/**
 * Stripe webhook endpoint — POST /api/stripe/webhook
 *
 * Handles checkout.session.completed:
 *   1. Verifies the Stripe-Signature header.
 *   2. Stores the booking in the `bookings` Supabase table.
 *   3. Sends a confirmation email to the guest with a cancel link.
 *
 * Required env vars:
 *   STRIPE_WEBHOOK_SECRET  — from Stripe Dashboard → Webhooks → your endpoint
 *   STRIPE_SECRET_KEY      — your Stripe secret key
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LOVABLE_API_KEY        — optional; falls back to email queue without it
 */

import * as React from "react";
import { render } from "@react-email/components";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { TEMPLATES } from "@/lib/email-templates/registry";
import type { BookingConfirmationProps } from "@/lib/email-templates/booking-confirmation";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";
const SITE_NAME = "Sea & City Rentals";
const SITE_URL = "https://www.seaandcityrentals.com";
const FROM_DOMAIN = "seaandcityrentals.com";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";

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

function genToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
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
        const metadata: Record<string, string> = session.metadata ?? {};

        const propertySlug = metadata.property ?? "";
        const propertyTitle = metadata.title ?? propertySlug;
        const checkIn = metadata.check_in ?? "";
        const checkOut = metadata.check_out ?? "";
        const nights = parseInt(metadata.nights ?? "1", 10);
        const guestEmail = session.customer_details?.email ?? "";
        const guestName = session.customer_details?.name ?? null;
        const totalAmount = (session.amount_total ?? 0) / 100;
        const currency = session.currency ?? "usd";
        const sessionId = session.id ?? "";
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : null;

        if (!guestEmail || !propertySlug || !checkIn || !checkOut) {
          console.error("Webhook missing required fields", { guestEmail, propertySlug, checkIn, checkOut });
          return new Response("Missing fields", { status: 400 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
          return new Response("DB not configured", { status: 500 });
        }

        const sb = createClient(SUPABASE_URL, serviceKey);
        const cancelToken = genToken();

        // Upsert — idempotent; safe if Stripe retries the webhook.
        const { error: dbErr } = await sb.from("bookings").upsert(
          {
            stripe_session_id: sessionId,
            stripe_payment_intent_id: paymentIntentId,
            property_slug: propertySlug,
            property_title: propertyTitle,
            guest_email: guestEmail,
            guest_name: guestName,
            check_in: checkIn,
            check_out: checkOut,
            nights,
            total_amount: totalAmount,
            currency,
            cancel_token: cancelToken,
            status: "confirmed",
          },
          { onConflict: "stripe_session_id", ignoreDuplicates: true },
        );

        if (dbErr) {
          console.error("DB insert error", dbErr);
          // Still return 200 so Stripe doesn't retry — log the error for investigation.
        }

        // Fetch the stored cancel token (in case this was a duplicate and we got
        // the original token back via ignoreDuplicates).
        const { data: stored } = await sb
          .from("bookings")
          .select("cancel_token")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        const actualToken = stored?.cancel_token ?? cancelToken;
        const cancelUrl = `${SITE_URL}/cancel-booking?token=${actualToken}`;

        // Send confirmation email.
        try {
          const lovableApiKey = process.env.LOVABLE_API_KEY;
          const template = TEMPLATES["booking-confirmation"];
          const props: BookingConfirmationProps = {
            guestName: guestName ?? "Guest",
            propertyTitle,
            checkIn: formatDate(checkIn),
            checkOut: formatDate(checkOut),
            nights,
            total: `$${totalAmount.toFixed(0)} ${currency.toUpperCase()}`,
            cancelUrl,
          };
          const element = React.createElement(template.component, props);
          const html = await render(element);
          const text = await render(element, { plainText: true });
          const subject =
            typeof template.subject === "function"
              ? template.subject(props as Record<string, any>)
              : template.subject;
          const messageId = crypto.randomUUID();

          if (lovableApiKey) {
            await sendLovableEmail(
              {
                to: guestEmail,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text,
                purpose: "transactional",
                label: "booking-confirmation",
                idempotency_key: `booking-confirm-${sessionId}`,
                message_id: messageId,
              },
              { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
            );
            await sb.from("email_send_log").insert({
              message_id: messageId,
              template_name: "booking-confirmation",
              recipient_email: guestEmail,
              status: "sent",
            });
          } else {
            await sb.from("email_send_log").insert({
              message_id: messageId,
              template_name: "booking-confirmation",
              recipient_email: guestEmail,
              status: "pending",
            });
            await sb.rpc("enqueue_email", {
              queue_name: "transactional_emails",
              payload: {
                message_id: messageId,
                to: guestEmail,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text,
                purpose: "transactional",
                label: "booking-confirmation",
                idempotency_key: `booking-confirm-${sessionId}`,
                queued_at: new Date().toISOString(),
              },
            });
          }
        } catch (err) {
          console.error("confirmation email failed", err);
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
