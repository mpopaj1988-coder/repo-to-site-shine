/**
 * Stripe webhook endpoint — POST /api/webhooks/stripe
 *
 * Handles checkout.session.completed:
 *   1. Verifies the Stripe-Signature header.
 *   2. Runs shared booking fulfillment (src/lib/booking-fulfillment.server.ts):
 *      stores the booking, emails the guest, blocks the Hospitable calendar,
 *      and notifies the owner.
 *
 * A daily reconciliation sweep (src/routes/api/internal/stripe-reconcile.ts)
 * backfills any paid session this webhook missed, so a broken webhook can
 * never silently lose a booking.
 *
 * Required env vars:
 *   STRIPE_WEBHOOK_SECRET  — from Stripe Dashboard → Webhooks → your endpoint
 *   STRIPE_SECRET_KEY      — your Stripe secret key
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LOVABLE_API_KEY        — optional; falls back to email queue without it
 */

import { createFileRoute } from "@tanstack/react-router";
import { fulfillCheckoutSession } from "@/lib/booking-fulfillment.server";

// ── Stripe webhook signature verification (Web Crypto API) ──────────────────

async function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
): Promise<boolean> {
  try {
    let timestamp = "";
    let v1Sig = "";
    for (const part of header.split(",")) {
      if (part.startsWith("t=")) timestamp = part.slice(2);
      else if (part.startsWith("v1=")) v1Sig = part.slice(3);
    }
    if (!timestamp || !v1Sig) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${timestamp}.${rawBody}`),
    );
    const computed = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return computed === v1Sig;
  } catch {
    return false;
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          console.error("STRIPE_WEBHOOK_SECRET not configured");
          return new Response("Webhook secret not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const sigHeader = request.headers.get("stripe-signature") ?? "";

        const valid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
        if (!valid) {
          return new Response("Invalid signature", { status: 400 });
        }

        let event: Record<string, any>;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (event.type !== "checkout.session.completed") {
          return new Response("OK", { status: 200 });
        }

        const session = event.data?.object ?? {};
        const result = await fulfillCheckoutSession(session);

        if (!result.ok && result.reason === "missing_fields") {
          return new Response("Missing fields", { status: 400 });
        }
        if (!result.ok && result.reason === "db_not_configured") {
          return new Response("DB not configured", { status: 500 });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
