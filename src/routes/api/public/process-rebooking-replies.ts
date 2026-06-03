// POST/GET /api/public/process-rebooking-replies
//
// Scans rebooking_campaign_log for guests who replied YES and sends a
// follow-up message with the correct pricing and a booking link request.
//
// Trigger methods:
//   • pg_cron every hour at :30 (see migration 20260530000007 for SQL)
//   • Manual: GET /api/public/process-rebooking-replies?dry_run=true

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processRebookingReplies } from "@/lib/rebooking-reply-handler.server";

export const Route = createFileRoute("/api/public/process-rebooking-replies")({
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
    const results = await processRebookingReplies(supabaseAdmin, { dryRun });
    const yesCount = results.filter((r) => r.yesFound).length;
    const handledCount = results.filter((r) => r.handled).length;

    return Response.json({
      ok: true,
      dry_run: dryRun,
      summary: {
        rows_checked: results.length,
        yes_replies_found: yesCount,
        follow_ups_sent: handledCount,
      },
      results,
    });
  } catch (err) {
    console.error("[process-rebooking-replies] handler error:", err);
    return Response.json({ error: "Internal error", message: String(err) }, { status: 500 });
  }
}
