import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader, getRequest } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  hashPin,
  verifyPin,
  genSessionToken,
  normalizePhone,
  readCookie,
  sessionCookieHeader,
  clearSessionCookieHeader,
  CLEANER_COOKIE,
  SESSION_TTL_MS,
} from "./cleaner-auth.server";
import { notifyNewJob } from "./cleaner-push.server";

// The cleaner-portal tables (cleaners, cleaning_jobs, ...) were added in a
// migration that hasn't been run through `supabase generate-types` yet, so
// they aren't in the generated Database type. Use an untyped view of the
// same client for just these calls rather than editing the generated file.
const db = supabaseAdmin as unknown as SupabaseClient;

export type CleanerRow = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  is_admin: boolean;
};

async function getSessionCleaner(): Promise<CleanerRow | null> {
  const request = getRequest();
  const token = readCookie(request?.headers.get("cookie"), CLEANER_COOKIE);
  if (!token) return null;

  const { data } = await db
    .from("cleaner_sessions")
    .select("expires_at, cleaners(id, name, phone, active, is_admin)")
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;

  const cleaner = data.cleaners as unknown as CleanerRow | null;
  if (!cleaner || !cleaner.active) return null;
  return cleaner;
}

async function requireCleaner(): Promise<CleanerRow> {
  const cleaner = await getSessionCleaner();
  if (!cleaner) throw new Error("Not authenticated");
  return cleaner;
}

async function requireAdmin(): Promise<CleanerRow> {
  const cleaner = await requireCleaner();
  if (!cleaner.is_admin) throw new Error("Not authorized");
  return cleaner;
}

// ============================================================
// Auth
// ============================================================

export const cleanerLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    const { data: cleaner } = await db
      .from("cleaners")
      .select("*")
      .eq("phone", phone)
      .eq("active", true)
      .maybeSingle();

    if (!cleaner) return { ok: false as const, error: "Phone number not found" };

    const valid = await verifyPin(data.pin, cleaner.pin_hash as string);
    if (!valid) return { ok: false as const, error: "Incorrect PIN" };

    const token = genSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await db
      .from("cleaner_sessions")
      .insert({ token, cleaner_id: cleaner.id, expires_at: expiresAt });

    setResponseHeader("Set-Cookie", sessionCookieHeader(token, SESSION_TTL_MS / 1000));
    return {
      ok: true as const,
      cleaner: { id: cleaner.id, name: cleaner.name, isAdmin: cleaner.is_admin as boolean },
    };
  });

export const cleanerLogout = createServerFn({ method: "POST" }).handler(async () => {
  const request = getRequest();
  const token = readCookie(request?.headers.get("cookie"), CLEANER_COOKIE);
  if (token) await db.from("cleaner_sessions").delete().eq("token", token);
  setResponseHeader("Set-Cookie", clearSessionCookieHeader());
  return { ok: true };
});

export const getCleanerSession = createServerFn({ method: "GET" }).handler(async () => {
  const cleaner = await getSessionCleaner();
  if (!cleaner) return null;
  return { id: cleaner.id, name: cleaner.name, isAdmin: cleaner.is_admin };
});

// ============================================================
// Job board
// ============================================================

export const listOpenJobs = createServerFn({ method: "GET" }).handler(async () => {
  await requireCleaner();
  const { data } = await db
    .from("cleaning_jobs")
    .select("*")
    .eq("status", "open")
    .order("checkout_date", { ascending: true });
  return data ?? [];
});

export const listMyJobs = createServerFn({ method: "GET" }).handler(async () => {
  const cleaner = await requireCleaner();
  const { data } = await db
    .from("cleaning_jobs")
    .select("*")
    .eq("claimed_by", cleaner.id)
    .order("checkout_date", { ascending: false })
    .limit(50);
  return data ?? [];
});

// Race-safe claim: the UPDATE only matches rows still `open`, so if two
// cleaners tap Accept at the same instant, only the first UPDATE finds a
// matching row — the second gets back no row and knows it lost the race.
export const claimJob = createServerFn({ method: "POST" })
  .inputValidator((d: { jobId: string }) => d)
  .handler(async ({ data }) => {
    const cleaner = await requireCleaner();
    const { data: updated, error } = await db
      .from("cleaning_jobs")
      .update({ status: "claimed", claimed_by: cleaner.id, claimed_at: new Date().toISOString() })
      .eq("id", data.jobId)
      .eq("status", "open")
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) return { ok: false as const, error: "Someone already claimed this job" };
    return { ok: true as const, job: updated };
  });

export const completeJob = createServerFn({ method: "POST" })
  .inputValidator((d: { jobId: string }) => d)
  .handler(async ({ data }) => {
    const cleaner = await requireCleaner();
    const { data: updated, error } = await db
      .from("cleaning_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.jobId)
      .eq("claimed_by", cleaner.id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) return { ok: false as const, error: "Job not found" };
    return { ok: true as const, job: updated };
  });

// ============================================================
// Push subscriptions
// ============================================================

export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: { endpoint: string; p256dh: string; auth: string }) => d)
  .handler(async ({ data }) => {
    const cleaner = await requireCleaner();
    await db
      .from("cleaner_push_subscriptions")
      .upsert(
        { cleaner_id: cleaner.id, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth },
        { onConflict: "endpoint" },
      );
    return { ok: true };
  });

// ============================================================
// One-time setup — creates the first (admin) cleaner. Locks itself out the
// moment any cleaner row exists, so there's no standing "create an admin"
// endpoint left open after initial setup.
// ============================================================

export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; phone: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const { count } = await db.from("cleaners").select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      return { ok: false as const, error: "Setup already completed — log in instead." };
    }
    const phone = normalizePhone(data.phone);
    if (!/^\d{10,15}$/.test(phone))
      return { ok: false as const, error: "Enter a valid phone number" };
    if (!/^\d{4,6}$/.test(data.pin)) return { ok: false as const, error: "PIN must be 4-6 digits" };
    if (!data.name.trim()) return { ok: false as const, error: "Name is required" };

    const pinHash = await hashPin(data.pin);
    const { error } = await db
      .from("cleaners")
      .insert({ name: data.name.trim(), phone, pin_hash: pinHash, is_admin: true });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Admin — cleaners
// ============================================================

export const listCleaners = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { data } = await db
    .from("cleaners")
    .select("id,name,phone,active,is_admin,created_at")
    .order("created_at", { ascending: true });
  return data ?? [];
});

export const addCleaner = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; phone: string; pin: string; isAdmin?: boolean }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const phone = normalizePhone(data.phone);
    if (!/^\d{10,15}$/.test(phone))
      return { ok: false as const, error: "Enter a valid phone number" };
    if (!/^\d{4,6}$/.test(data.pin)) return { ok: false as const, error: "PIN must be 4-6 digits" };
    if (!data.name.trim()) return { ok: false as const, error: "Name is required" };

    const pinHash = await hashPin(data.pin);
    const { data: created, error } = await db
      .from("cleaners")
      .insert({ name: data.name.trim(), phone, pin_hash: pinHash, is_admin: !!data.isAdmin })
      .select("id,name,phone,active,is_admin,created_at")
      .maybeSingle();

    if (error) {
      const msg = error.message.includes("duplicate")
        ? "That phone number is already registered"
        : error.message;
      return { ok: false as const, error: msg };
    }
    return { ok: true as const, cleaner: created };
  });

export const setCleanerActive = createServerFn({ method: "POST" })
  .inputValidator((d: { cleanerId: string; active: boolean }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.from("cleaners").update({ active: data.active }).eq("id", data.cleanerId);
    return { ok: true };
  });

// ============================================================
// Admin — jobs, rates, payouts
// ============================================================

export const listAllJobsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { data } = await db
    .from("cleaning_jobs")
    .select("*, cleaners(name, phone)")
    .order("checkout_date", { ascending: false })
    .limit(200);
  return data ?? [];
});

export const listPropertyRates = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { data } = await db.from("property_cleaning_rates").select("*");
  return data ?? [];
});

export const setPropertyRate = createServerFn({ method: "POST" })
  .inputValidator((d: { propertySlug: string; amount: number }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.from("property_cleaning_rates").upsert(
      {
        property_slug: data.propertySlug,
        amount: data.amount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "property_slug" },
    );
    return { ok: true };
  });

export type PayoutSummaryRow = {
  cleanerId: string;
  name: string;
  phone: string;
  total: number;
  jobCount: number;
};

export const getPayoutSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<PayoutSummaryRow[]> => {
    await requireAdmin();
    const { data } = await db
      .from("cleaning_jobs")
      .select("claimed_by, payout_amount, cleaners(name, phone)")
      .eq("status", "completed")
      .eq("payout_status", "unpaid")
      .not("claimed_by", "is", null);

    const byCleaner = new Map<string, PayoutSummaryRow>();
    for (const row of data ?? []) {
      const cleanerId = row.claimed_by as string;
      const cleanerInfo = row.cleaners as unknown as { name: string; phone: string } | null;
      const existing = byCleaner.get(cleanerId);
      const amount = Number(row.payout_amount ?? 0);
      if (existing) {
        existing.total += amount;
        existing.jobCount += 1;
      } else {
        byCleaner.set(cleanerId, {
          cleanerId,
          name: cleanerInfo?.name ?? "Unknown",
          phone: cleanerInfo?.phone ?? "",
          total: amount,
          jobCount: 1,
        });
      }
    }
    return Array.from(byCleaner.values()).sort((a, b) => b.total - a.total);
  },
);

export const markCleanerPaid = createServerFn({ method: "POST" })
  .inputValidator((d: { cleanerId: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    await db
      .from("cleaning_jobs")
      .update({ payout_status: "paid", paid_at: new Date().toISOString() })
      .eq("claimed_by", data.cleanerId)
      .eq("status", "completed")
      .eq("payout_status", "unpaid");
    return { ok: true };
  });

// Manually create a one-off job (e.g. a maintenance clean not tied to a
// Hospitable checkout) from the admin view.
export const createManualJob = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      propertySlug: string;
      propertyName: string;
      checkoutDate: string;
      payoutAmount: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: created, error } = await db
      .from("cleaning_jobs")
      .insert({
        property_slug: data.propertySlug,
        property_name: data.propertyName,
        checkout_date: data.checkoutDate,
        payout_amount: data.payoutAmount,
        status: "open",
      })
      .select()
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (created)
      void notifyNewJob(created as { id: string; property_name: string; checkout_date: string });
    return { ok: true as const, job: created };
  });
