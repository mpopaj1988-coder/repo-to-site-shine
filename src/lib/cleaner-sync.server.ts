// Pulls upcoming checkouts from Hospitable and turns each one into an open
// cleaning job, so cleaners never have to be told manually that a turnover
// is coming up.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { properties } from "@/data/properties";
import { notifyNewJob } from "./cleaner-push.server";

const db = supabaseAdmin as unknown as SupabaseClient;

// Hospitable's internal property names don't match the site's slugs 1:1
// (e.g. their "IRB A" is our "irb-b"), so jobs are labeled from our own
// property data rather than whatever Hospitable calls the listing.
const PROPERTY_LABELS: Record<string, string> = {
  tampa: "Tampa",
  largo: "Largo",
  "irb-a": "Indian Rocks Beach A",
  "irb-b": "Indian Rocks Beach B",
  clearwater: "Clearwater",
  "stpete-sunsoaked": "St. Pete — Sun Soaked",
  "stpete-modern": "St. Pete — Modern",
  "stpete-hottub": "St. Pete — Hot Tub",
  "stpete-patio": "St. Pete — Patio",
};

const SYNC_WINDOW_DAYS = 14;

type HospitableReservation = {
  id: string;
  check_out?: string;
  status?: { current?: { category?: string } };
};

async function fetchUpcomingCheckouts(
  hospitableId: string,
  apiKey: string,
): Promise<HospitableReservation[]> {
  const url = `https://public.api.hospitable.com/v2/reservations?properties[]=${hospitableId}&status[]=accepted&sort=check_out&direction=asc&per_page=25`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: HospitableReservation[] };
  return json.data ?? [];
}

export async function syncCleaningJobs(): Promise<{ created: number; checked: number }> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) return { created: 0, checked: 0 };

  const { data: rates } = await db.from("property_cleaning_rates").select("property_slug, amount");
  const rateBySlug = new Map(
    (rates ?? []).map((r) => [r.property_slug as string, Number(r.amount)]),
  );

  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + SYNC_WINDOW_DAYS);

  let created = 0;
  let checked = 0;

  for (const property of properties) {
    if (!property.hospitableId) continue;
    const reservations = await fetchUpcomingCheckouts(property.hospitableId, apiKey);

    for (const reservation of reservations) {
      const checkoutDate = reservation.check_out?.slice(0, 10);
      if (!checkoutDate) continue;
      if (new Date(checkoutDate) > windowEnd) continue;
      checked++;

      const { data: existing } = await db
        .from("cleaning_jobs")
        .select("id")
        .eq("hospitable_reservation_uuid", reservation.id)
        .maybeSingle();
      if (existing) continue;

      const { data: job } = await db
        .from("cleaning_jobs")
        .insert({
          property_slug: property.slug,
          property_name: PROPERTY_LABELS[property.slug] ?? property.slug,
          hospitable_reservation_uuid: reservation.id,
          checkout_date: checkoutDate,
          payout_amount: rateBySlug.get(property.slug) ?? 0,
        })
        .select()
        .maybeSingle();

      if (job) {
        created++;
        await notifyNewJob(job as { id: string; property_name: string; checkout_date: string });
      }
    }
  }

  return { created, checked };
}
