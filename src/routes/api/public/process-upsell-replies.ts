// POST/GET /api/public/process-upsell-replies
//
// Scans orphan_upsell_log for guests who replied YES and haven't been
// handled yet.  For each YES reply it:
//   1. Creates a Hospitable task for the host to send an alteration request.
//   2. Attempts to auto-extend direct/manual reservations via the API.
//   3. Sends a confirmation message to the guest.
//   4. Marks the row as handled to prevent repeats.
//
// Trigger methods:
//   • pg_cron every hour (see migration 20260530000002 for SQL)
//   • Manual: GET /api/public/process-upsell-replies?dry_run=true

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processUpsellReplies } from "@/lib/orphan-reply-handler.server";

export const Route = createFileRoute("/api/public/process-upsell-replies")({
  server: {
    handlers: {
      GET: async ({ request }) => handleReplies(request),
      POST: async ({ request }) => handleReplies(request),
    },
  },
});

async function handleReplies(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";

  if (!process.env.HOSPITABLE_API_KEY) {
    return Response.json({ error: "HOSPITABLE_API_KEY not configured" }, { status: 500 });
  }

  try {
    const results = await processUpsellReplies(supabaseAdmin, { dryRun });

    const yesCount = results.filter((r) => r.outgoing.yesFound || r.incoming.yesFound).length;
    const handledCount = results.filter((r) => r.outgoing.handled || r.incoming.handled).length;

    return Response.json({
      ok: true,
      dry_run: dryRun,
      summary: {
        rows_checked: results.length,
        yes_replies_found: yesCount,
        alterations_handled: handledCount,
      },
      results,
    });
  } catch (err) {
    console.error("[process-upsell-replies] handler error:", err);
    return Response.json({ error: "Internal error", message: String(err) }, { status: 500 });
  }
}
