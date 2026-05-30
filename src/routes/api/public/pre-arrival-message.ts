// POST/GET /api/public/pre-arrival-message
//
// Sends a reminder to every guest arriving in 2 days.
// Lets them know their door code will arrive on the morning of check-in.
//
// Trigger methods:
//   • pg_cron daily at 10 AM (see migration for SQL)
//   • Manual: GET /api/public/pre-arrival-message?dry_run=true

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processPreArrivalMessages } from "@/lib/pre-arrival-message.server";

export const Route = createFileRoute("/api/public/pre-arrival-message")({
  server: {
    handlers: {
      GET: async ({ request }) => handlePreArrival(request),
      POST: async ({ request }) => handlePreArrival(request),
    },
  },
});

async function handlePreArrival(request: Request): Promise<Response> {
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

    const results = await processPreArrivalMessages(propertyList, supabaseAdmin, { dryRun });

    const sent = results.filter((r) => r.sent && !r.skipped);
    const skipped = results.filter((r) => r.skipped);

    return Response.json({
      ok: true,
      dry_run: dryRun,
      arrival_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      summary: {
        properties_scanned: propertyList.length,
        messages_sent: sent.length,
        skipped: skipped.length,
      },
      results,
    });
  } catch (err) {
    console.error("[pre-arrival-message] handler error:", err);
    return Response.json({ error: "Internal error", message: String(err) }, { status: 500 });
  }
}
