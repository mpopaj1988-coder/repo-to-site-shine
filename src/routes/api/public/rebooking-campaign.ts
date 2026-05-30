// POST/GET /api/public/rebooking-campaign
//
// Finds open stretches in the next 90 days and messages past guests who stayed
// during the same window last year, offering a 10% returning-guest discount.
//
// Idempotent: rebooking_campaign_log prevents any guest being messaged twice
// about the same open stretch.
//
// Trigger methods:
//   • pg_cron every Monday at 10 AM (see migration for SQL)
//   • Manual: GET /api/public/rebooking-campaign?dry_run=true

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processRebookingCampaign } from "@/lib/rebooking-campaign.server";

export const Route = createFileRoute("/api/public/rebooking-campaign")({
  server: {
    handlers: {
      GET: async ({ request }) => handleCampaign(request),
      POST: async ({ request }) => handleCampaign(request),
    },
  },
});

async function handleCampaign(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";

  if (!process.env.HOSPITABLE_API_KEY) {
    return Response.json({ error: "HOSPITABLE_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { properties } = await import("@/data/properties");
    const propertyList = properties
      .filter((p): p is typeof p & { hospitableId: string } => Boolean(p.hospitableId))
      .map((p) => ({ slug: p.slug, hospitableId: p.hospitableId, title: p.title }));

    const results = await processRebookingCampaign(propertyList, supabaseAdmin, { dryRun });

    const sent = results.filter((r) => r.sent && !r.skipped);
    const skipped = results.filter((r) => r.skipped);

    return Response.json({
      ok: true,
      dry_run: dryRun,
      summary: {
        properties_scanned: propertyList.length,
        messages_sent: sent.length,
        already_sent: skipped.length,
      },
      results,
    });
  } catch (err) {
    console.error("[rebooking-campaign] handler error:", err);
    return Response.json({ error: "Internal error", message: String(err) }, { status: 500 });
  }
}
