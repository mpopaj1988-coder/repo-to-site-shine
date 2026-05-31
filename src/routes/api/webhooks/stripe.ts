import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/components";
import { sendLovableEmail } from "@lovable.dev/email-js";
import type Stripe from "stripe";
import { webhookEvent } from "@/lib/stripe.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";
const SITE_NAME = "Sea & City Rentals";
const FROM_DOMAIN = "seaandcityrentals.com";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";
const HOSPITABLE_API = "https://public.api.hospitable.com/v2";

async function createHospitableReservation(params: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  accommodationCents: number;
  currency: string;
  bookingId: string;
}) {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) {
    console.error("HOSPITABLE_API_KEY not set — skipping reservation creation");
    return null;
  }
  const res = await fetch(`${HOSPITABLE_API}/reservations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      property_id: params.propertyId,
      check_in: params.checkIn,
      check_out: params.checkOut,
      channel: "direct",
      language: "en",
      notes: `Booked via website · Booking ID: ${params.bookingId}`,
      guests: { adults: Math.max(1, params.guests) },
      guest: {
        first_name: params.firstName,
        last_name: params.lastName || "Guest",
        email: params.email,
        phone: params.phone ?? undefined,
      },
      financials: {
        currency: params.currency,
        accommodation: params.accommodationCents,
      },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("Hospitable reservation creation failed", res.status, errBody);
    return null;
  }
  const json = (await res.json()) as { data?: { id?: string } };
  return json.data?.id ?? null;
}

async function sendConfirmationEmail(params: {
  email: string;
  guestName: string;
  propertyTitle: string;
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
  balanceDueDate: string;
  bookingId: string;
  currency: string;
}) {
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  if (!lovableApiKey) return;

  const templateEntry = TEMPLATES["booking-confirmation"];
  const props = {
    guestName: params.guestName,
    propertyTitle: params.propertyTitle,
    propertySlug: params.propertySlug,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights: params.nights,
    guests: params.guests,
    totalDollars: params.totalCents / 100,
    depositDollars: params.depositCents / 100,
    balanceDollars: params.balanceCents / 100,
    balanceDueDate: params.balanceDueDate,
    bookingId: params.bookingId,
    currency: params.currency,
  };
  const element = React.createElement(templateEntry.component, props);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });
  const subject =
    typeof templateEntry.subject === "function"
      ? templateEntry.subject(props as Record<string, any>)
      : templateEntry.subject;

  await sendLovableEmail(
    {
      to: params.email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: "transactional",
      label: "booking-confirmation",
      idempotency_key: `booking-confirmation-${params.bookingId}`,
    },
    { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
  );
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const sig = request.headers.get("stripe-signature") ?? "";

        let event: Stripe.Event;
        try {
          event = webhookEvent(rawBody, sig);
        } catch (err) {
          console.error("Stripe webhook signature verification failed", err);
          return Response.json({ error: "Invalid signature" }, { status: 400 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return Response.json({ ok: true });
        const supabase = createClient(SUPABASE_URL, serviceKey);

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const bookingId = session.metadata?.booking_id;
          if (!bookingId) {
            console.error("No booking_id in Stripe session metadata", session.id);
            return Response.json({ ok: true });
          }

          const { data: booking } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

          if (!booking) {
            console.error("Booking not found for id", bookingId);
            return Response.json({ ok: true });
          }

          const guestDetails = session.customer_details;
          const fullName = guestDetails?.name ?? "Guest";
          const nameParts = fullName.trim().split(/\s+/);
          const firstName = nameParts[0] ?? "Guest";
          const lastName = nameParts.slice(1).join(" ") || "Guest";
          const guestEmail = guestDetails?.email ?? "";
          const guestPhone = guestDetails?.phone ?? null;

          // Get payment method from payment intent
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null);

          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : (session.customer?.id ?? null);

          // Create Hospitable reservation
          const hospId = await createHospitableReservation({
            propertyId: booking.hospitable_property_id,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            guests: booking.guests,
            firstName,
            lastName,
            email: guestEmail,
            phone: guestPhone,
            accommodationCents: booking.total_cents,
            currency: booking.currency,
            bookingId,
          });

          // Mark deposit paid, confirm booking
          const { error: updateErr } = await supabase
            .from("bookings")
            .update({
              status: "confirmed",
              deposit_paid: true,
              guest_name: fullName,
              guest_first_name: firstName,
              guest_last_name: lastName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              stripe_customer_id: customerId,
              stripe_deposit_payment_intent_id: paymentIntentId,
              hospitable_reservation_id: hospId,
            })
            .eq("id", bookingId);

          if (updateErr) console.error("Failed to update booking", updateErr);

          // If no balance owed, mark balance paid too
          if (booking.balance_cents === 0) {
            await supabase.from("bookings").update({ balance_paid: true }).eq("id", bookingId);
          }

          // Send confirmation email
          if (guestEmail) {
            try {
              await sendConfirmationEmail({
                email: guestEmail,
                guestName: firstName,
                propertyTitle: booking.property_slug
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                propertySlug: booking.property_slug,
                checkIn: booking.check_in,
                checkOut: booking.check_out,
                nights: booking.nights,
                guests: booking.guests,
                totalCents: booking.total_cents,
                depositCents: booking.deposit_cents,
                balanceCents: booking.balance_cents,
                balanceDueDate: booking.balance_due_date,
                bookingId,
                currency: booking.currency,
              });
            } catch (emailErr) {
              console.error("Booking confirmation email failed", emailErr);
            }
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
