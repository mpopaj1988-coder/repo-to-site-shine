import * as React from "react";
import { render } from "@react-email/components";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";
const FROM_DOMAIN = "seaandcityrentals.com";
const SITE_NAME = "Sea & City Rentals";
const OWNER_EMAIL = "mpopaj1988@gmail.com";
const HOSPITABLE_API = "https://public.api.hospitable.com/v2";

type HospitableReservationResult =
  | { ok: true; reservationId: string }
  | { ok: false; error: string };

async function createHospitableReservation({
  hospitableId,
  checkIn,
  checkOut,
  guestName,
  guestEmail,
  guestCount,
  totalCents,
  currency,
  stripeSessionId,
  apiKey,
}: {
  hospitableId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestCount: number;
  totalCents: number;
  currency: string;
  stripeSessionId: string;
  apiKey: string;
}): Promise<HospitableReservationResult> {
  const nameParts = guestName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? guestName;
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const body = {
    property_id: hospitableId,
    check_in: checkIn,
    check_out: checkOut,
    guests: { adults: Math.max(1, guestCount) },
    guest: { first_name: firstName, last_name: lastName, email: guestEmail },
    language: "en",
    channel: "direct",
    notes: `Direct booking via seaandcityrentals.com — Stripe: ${stripeSessionId}`,
    financials: {
      currency: currency.toUpperCase(),
      accommodation: totalCents,
    },
  };

  try {
    const res = await fetch(`${HOSPITABLE_API}/reservations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as { data?: { id?: string }; message?: string };

    if (!res.ok) {
      return { ok: false, error: json.message ?? `HTTP ${res.status}` };
    }

    const reservationId = json.data?.id;
    if (!reservationId) return { ok: false, error: "No reservation ID in response" };

    return { ok: true, reservationId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const secretKey = process.env.STRIPE_SECRET_KEY;

        if (!secretKey || !webhookSecret) {
          return Response.json({ error: "Stripe not configured" }, { status: 500 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get("stripe-signature") ?? "";

        const stripe = new Stripe(secretKey);

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
        } catch {
          return Response.json({ error: "Invalid signature" }, { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const meta = session.metadata ?? {};

          const propertySlug = meta.property_slug ?? "";
          const propertyName = meta.property_name ?? "";
          const checkIn = meta.check_in ?? "";
          const checkOut = meta.check_out ?? "";
          const nights = parseInt(meta.nights ?? "1", 10);
          const guestName = meta.guest_name ?? "";
          const guestEmail = meta.guest_email ?? session.customer_email ?? "";
          const guestCount = parseInt(meta.guest_count ?? "1", 10);
          const hospitableId = meta.hospitable_id ?? "";
          const totalCents = session.amount_total ?? 0;
          const currency = (session.currency ?? "usd").toUpperCase();
          const paymentIntentId =
            typeof session.payment_intent === "string" ? session.payment_intent : null;
          const totalDollars = (totalCents / 100).toFixed(2);

          // ── 1. Create reservation in Hospitable (blocks dates across all channels) ──
          const hospApiKey = process.env.HOSPITABLE_API_KEY;
          let hospResult: HospitableReservationResult | null = null;

          if (hospitableId && hospApiKey) {
            hospResult = await createHospitableReservation({
              hospitableId,
              checkIn,
              checkOut,
              guestName,
              guestEmail,
              guestCount,
              totalCents,
              currency,
              stripeSessionId: session.id,
              apiKey: hospApiKey,
            });
          }

          const hospitableReservationId = hospResult?.ok ? hospResult.reservationId : null;
          const hospFailed = hospResult !== null && !hospResult.ok;

          // ── 2. Store booking in Supabase ──
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const supabase = serviceKey ? createClient(SUPABASE_URL, serviceKey) : null;

          if (supabase) {
            await supabase.from("direct_bookings").upsert(
              {
                stripe_session_id: session.id,
                stripe_payment_intent_id: paymentIntentId,
                property_slug: propertySlug,
                property_name: propertyName,
                hospitable_property_id: hospitableId || null,
                check_in: checkIn,
                check_out: checkOut,
                nights,
                total_cents: totalCents,
                currency,
                guest_name: guestName,
                guest_email: guestEmail,
                guest_count: guestCount,
                hospitable_reservation_id: hospitableReservationId,
                status: "confirmed",
              },
              { onConflict: "stripe_session_id" },
            );
          }

          // ── 3. Send emails ──
          const lovableApiKey = process.env.LOVABLE_API_KEY;
          if (lovableApiKey && guestEmail) {
            const template = TEMPLATES["booking-confirmation"];
            const emailOpts = { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL };
            const templateData = { guestName, propertyName, checkIn, checkOut, nights, total: totalDollars, currency };

            const element = React.createElement(template.component, templateData);
            const html = await render(element);
            const text = await render(element, { plainText: true });
            const subject =
              typeof template.subject === "function" ? template.subject(templateData) : template.subject;

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
                idempotency_key: `booking-confirmation-${session.id}`,
              },
              emailOpts,
            ).catch(() => {});

            const hospNote = hospFailed
              ? `\n  <li style="color:red"><strong>⚠️ Hospitable sync FAILED</strong> — dates not yet blocked. Manually create the reservation in Hospitable. Error: ${(hospResult as { ok: false; error: string }).error}</li>`
              : hospitableReservationId
                ? `\n  <li><strong>Hospitable reservation:</strong> ${hospitableReservationId}</li>`
                : "";

            await sendLovableEmail(
              {
                to: OWNER_EMAIL,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject: `${hospFailed ? "⚠️ ACTION NEEDED — " : ""}New direct booking — ${propertyName} (${checkIn} → ${checkOut})`,
                html: `<p>New direct booking received:</p><ul>
  <li><strong>Property:</strong> ${propertyName}</li>
  <li><strong>Guest:</strong> ${guestName} &lt;${guestEmail}&gt;</li>
  <li><strong>Dates:</strong> ${checkIn} → ${checkOut} (${nights} nights)</li>
  <li><strong>Guests:</strong> ${guestCount}</li>
  <li><strong>Total:</strong> $${totalDollars} ${currency}</li>
  <li><strong>Stripe session:</strong> ${session.id}</li>${hospNote}
</ul>`,
                text: `New booking: ${propertyName}\nGuest: ${guestName} <${guestEmail}>\nDates: ${checkIn} → ${checkOut} (${nights} nights)\nGuests: ${guestCount}\nTotal: $${totalDollars} ${currency}\nStripe: ${session.id}${hospFailed ? `\n\n⚠️ HOSPITABLE SYNC FAILED — block dates manually!` : ""}`,
                purpose: "transactional",
                label: "booking-owner-notification",
                idempotency_key: `booking-owner-${session.id}`,
              },
              emailOpts,
            ).catch(() => {});
          }
        }

        return Response.json({ received: true });
      },
    },
  },
});
