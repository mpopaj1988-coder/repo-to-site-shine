// POST/GET /api/public/orphan-day-upsell
//
// Scans every property for "orphan days" — single vacant nights sandwiched
// between two consecutive accepted reservations — and sends both adjacent
// guests a personalised discount offer via Hospitable messaging.
//
// Idempotent: the orphan_upsell_log table ensures each (property, orphan_date)
// pair is messaged at most once, so the cron can fire safely every 4 hours.
//
// Trigger methods:
//   • pg_cron every 4 hours (see migration for SQL)
//   • Hospitable webhook on reservation.created → point to this URL
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

async function handleUpsell(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";

  if (!process.env.HOSPITABLE_API_KEY) {
    return Response.json({ error: "HOSPITABLE_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { properties } = await import("@/data/properties");
    const propertyList = properties
      .filter((p): p is typeof p & { hospitableId: string } => Boolean(p.hospitableId))
      .map((p) => ({ slug: p.slug, hospitableId: p.hospitableId }));

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
