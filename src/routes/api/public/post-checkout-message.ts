// POST/GET /api/public/post-checkout-message
//
// Sends a thank-you message to every guest who checked out yesterday.
// The message thanks them, mentions a 5-star review was left for them,
// asks for one back, and includes the property's direct booking link.
//
// Trigger methods:
//   • pg_cron daily at noon (see migration for SQL)
//   • Manual: GET /api/public/post-checkout-message?dry_run=true

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processPostCheckoutMessages } from "@/lib/post-checkout-message.server";

export const Route = createFileRoute("/api/public/post-checkout-message")({
  server: {
    handlers: {
      GET: async ({ request }) => handleCheckout(request),
      POST: async ({ request }) => handleCheckout(request),
    },
  },
});

async function handleCheckout(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";

  if (!process.env.HOSPITABLE_API_KEY) {
    return Response.json({ error: "HOSPITABLE_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { properties } = await import("@/data/properties");
    const propertyList = properties
      .filter(
        (p): p is typeof p & { hospitableId: string; airbnbUrl: string } =>
          Boolean(p.hospitableId) && Boolean(p.airbnbUrl),
      )
      .map((p) => ({
        slug: p.slug,
        hospitableId: p.hospitableId,
        title: p.title,
        airbnbUrl: p.airbnbUrl,
      }));

    const results = await processPostCheckoutMessages(propertyList, supabaseAdmin, { dryRun });

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
    console.error("[post-checkout-message] handler error:", err);
    return Response.json({ error: "Internal error", message: String(err) }, { status: 500 });
  }
}
