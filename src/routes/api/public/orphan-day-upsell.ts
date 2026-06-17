// POST/GET /api/public/orphan-day-upsell
//
// Scans every property for "orphan days" — single vacant nights sandwiched
// between two consecutive accepted reservations — and sends both adjacent
// guests a personalised discount offer via Hospitable messaging.
//
// Idempotent: the orphan_upsell_log table ensures each (property, orphan_date)
// pair is messaged at most once.
//
// Send window: messages only go out during the 3 pm Eastern hour (UTC 19 in
// summer / UTC 20 in winter).  Use ?dry_run=true to preview outside that window.
//
// Trigger methods:
//   • pg_cron daily at 3 pm Eastern (see migration for SQL)
//   • Manual: GET /api/public/orphan-day-upsell?dry_run=true  (read-only preview)

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processOrphanDayUpsells } from "@/lib/orphan-upsell.server";

export const Route = createFileRoute("/api/public/orphan-day-upsell")({
  server: {
    handlers: {
      GET: async ({ request }) => handleUpsell(request),
      POST: async ({ request }) => handleUpsell(request),
    },
  },
});

// Returns true if it's currently the 3 pm Eastern hour.
// Eastern observes EDT (UTC-4) mid-Mar–Nov and EST (UTC-5) Nov–mid-Mar.
// 3 pm EDT = 19:00 UTC; 3 pm EST = 20:00 UTC — accept both hours.
function isEasternAfternoon(): boolean {
  const utcHour = new Date().getUTCHours();
  return utcHour === 19 || utcHour === 20;
}

async function handleUpsell(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";

  if (!process.env.HOSPITABLE_API_KEY) {
    return Response.json({ error: "HOSPITABLE_API_KEY not configured" }, { status: 500 });
  }

  // Enforce send window — skip silently when outside 3 pm Eastern hour.
  // dry_run bypasses this so you can preview at any time.
  if (!dryRun && !isEasternAfternoon()) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "Outside send window — messages only go out at 3 pm Eastern",
    });
  }

  try {
    const { properties } = await import("@/data/properties");
    const MIN_PRICES: Record<string, number> = {
      clearwater: 190,
      largo: 190,
      tampa: 190,
    };
    const propertyList = properties
      .filter((p): p is typeof p & { hospitableId: string } => Boolean(p.hospitableId))
      .map((p) => ({
        slug: p.slug,
        hospitableId: p.hospitableId,
        minPrice: MIN_PRICES[p.slug] ?? 100,
      }));

    const results = await processOrphanDayUpsells(propertyList, supabaseAdmin, { dryRun });

    const processed = results.filter((r) => !r.skipped);
    const skipped = results.filter((r) => r.skipped);
    const sent = processed.filter((r) => r.outgoingSent || r.incomingSent);

    return Response.json({
      ok: true,
      dry_run: dryRun,
      summary: {
        properties_scanned: propertyList.length,
        orphan_days_found: results.length,
        newly_messaged: sent.length,
        already_sent: skipped.length,
      },
      results,
    });
  } catch (err) {
    console.error("[orphan-upsell] handler error:", err);
    return Response.json({ error: "Internal error", message: String(err) }, { status: 500 });
  }
}
