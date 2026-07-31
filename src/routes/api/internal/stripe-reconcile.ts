/**
 * Stripe reconciliation sweep — POST /api/internal/stripe-reconcile
 *
 * Safety net for missed webhooks: pulls recent paid checkout sessions
 * straight from Stripe and fulfills any that never made it into the
 * `bookings` table (webhook down, bad signing secret, deploy gap, etc).
 * Runs from the daily 9am cron; a missed webhook then costs hours, not a
 * double-booking.
 *
 * Only sessions with a FUTURE check-in are backfilled — resurrecting a
 * stay that already happened would send confusing emails and block dates
 * that are already in the past.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { fulfillCheckoutSession } from "@/lib/booking-fulfillment.server";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";

export const Route = createFileRoute("/api/internal/stripe-reconcile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Server misconfigured" }, { status: 500 });
        }

        // Require service-role bearer token — same pattern as the other
        // internal endpoints.
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        if (token !== serviceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          console.error("STRIPE_SECRET_KEY not configured — skipping reconcile");
          return Response.json({ error: "Stripe not configured" }, { status: 500 });
        }

        // Recent sessions only — anything older is either handled or history.
        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
        const res = await fetch(
          `https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${thirtyDaysAgo}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } },
        );
        if (!res.ok) {
          const err = await res.text();
          console.error("Stripe session list failed", res.status, err);
          return Response.json({ error: "Stripe list failed" }, { status: 502 });
        }
        const list = (await res.json()) as { data?: Record<string, any>[] };
        const sessions = list.data ?? [];

        const sb = createClient(SUPABASE_URL, serviceKey);
        const todayStr = new Date().toISOString().slice(0, 10);

        let fulfilled = 0;
        let skipped = 0;
        const backfilled: string[] = [];

        for (const session of sessions) {
          // Only completed, paid, direct-booking sessions.
          if (session.payment_status !== "paid") { skipped++; continue; }
          if (session.mode !== "payment") { skipped++; continue; }
          const metadata: Record<string, string> = session.metadata ?? {};
          if (!metadata.property || !metadata.check_in) { skipped++; continue; }

          // Never resurrect past stays.
          if (metadata.check_in < todayStr) { skipped++; continue; }

          // Skip anything the webhook (or a previous sweep) already handled.
          const { data: existing } = await sb
            .from("bookings")
            .select("id")
            .eq("stripe_session_id", session.id)
            .maybeSingle();
          if (existing) { skipped++; continue; }

          console.warn("Reconcile: paid session missing from bookings — backfilling", session.id);
          const result = await fulfillCheckoutSession(session);
          if (result.ok) {
            fulfilled++;
            backfilled.push(session.id);
          } else {
            console.error("Reconcile fulfillment failed", session.id, result.reason);
          }
        }

        console.log(`Stripe reconcile: checked=${sessions.length} fulfilled=${fulfilled} skipped=${skipped}`);
        return Response.json({ checked: sessions.length, fulfilled, skipped, backfilled });
      },
    },
  },
});
