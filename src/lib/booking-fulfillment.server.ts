/**
 * Shared booking fulfillment — everything that must happen after a Stripe
 * checkout session is paid:
 *   1. Store the booking in the `bookings` table.
 *   2. Send the guest a confirmation email with a cancel link.
 *   3. Create a Hospitable reservation to block the calendar.
 *   4. Send the owner a notification email.
 *
 * Used by BOTH the Stripe webhook (src/routes/api/webhooks/stripe.ts) and the
 * daily reconciliation sweep (src/routes/api/internal/stripe-reconcile.ts), so
 * a missed webhook can never silently lose a paid booking.
 */

import * as React from "react";
import { render } from "@react-email/components";
import { createClient } from "@supabase/supabase-js";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { sendResendEmail } from "@/lib/resend-email";
import { TEMPLATES } from "@/lib/email-templates/registry";
import type { BookingConfirmationProps } from "@/lib/email-templates/booking-confirmation";
import type { BookingOwnerNotificationProps } from "@/lib/email-templates/booking-owner-notification";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";
const SITE_NAME = "Sea & City Rentals";
const SITE_URL = "https://www.seaandcityrentals.com";
const FROM_DOMAIN = "seaandcityrentals.com";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";
const OWNER_EMAIL = "mpopaj1988@gmail.com";
const HOSPITABLE_API = "https://public.api.hospitable.com/v2";

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

// ── Hospitable reservation creation ──────────────────────────────────────────

async function createHospitableReservation(opts: {
  hospitableId: string;
  checkIn: string;
  checkOut: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  adults: number;
  accommodationCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  currency: string;
  stripeSessionId: string;
  apiKey: string;
}): Promise<boolean> {
  const url = `${HOSPITABLE_API}/properties/${opts.hospitableId}/reservations`;
  const body = {
    check_in: opts.checkIn,
    check_out: opts.checkOut,
    guests: { adults: Math.max(1, opts.adults) },
    guest: {
      first_name: opts.guestFirstName,
      last_name: opts.guestLastName,
      email: opts.guestEmail,
    },
    language: "en",
    channel: "direct",
    notes: `Booked via seaandcityrentals.com — Stripe session: ${opts.stripeSessionId}`,
    financials: {
      currency: opts.currency.toUpperCase(),
      accommodation: opts.accommodationCents,
      ...(opts.cleaningFeeCents > 0 ? { cleaning_fee: opts.cleaningFeeCents } : {}),
      ...(opts.taxCents > 0 ? { pass_through_taxes: opts.taxCents } : {}),
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Hospitable reservation creation failed", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Hospitable reservation creation error", err);
    return false;
  }
}

// ── Fulfillment ──────────────────────────────────────────────────────────────

export type FulfillResult =
  | { ok: true; sessionId: string; hospitableCreated: boolean }
  | { ok: false; sessionId: string; reason: string };

/**
 * Fulfill a paid Stripe checkout session. `session` is the raw checkout
 * session object — identical shape whether it came from a webhook event
 * (`event.data.object`) or from GET /v1/checkout/sessions.
 */
export async function fulfillCheckoutSession(
  session: Record<string, any>,
): Promise<FulfillResult> {
  const metadata: Record<string, string> = session.metadata ?? {};

  const propertySlug = metadata.property ?? "";
  const propertyTitle = metadata.title ?? propertySlug;
  const hospitableId = metadata.hospitable_id ?? "";
  const guestCount = parseInt(metadata.guests ?? "1", 10);
  const checkIn = metadata.check_in ?? "";
  const checkOut = metadata.check_out ?? "";
  const nights = parseInt(metadata.nights ?? "1", 10);
  const guestEmail = session.customer_details?.email ?? "";
  const guestName = session.customer_details?.name ?? null;
  const currency = session.currency ?? "usd";
  // Prefer metadata amounts over session total for accurate breakdown.
  const accommodationCents = metadata.accommodation_cents
    ? parseInt(metadata.accommodation_cents, 10)
    : session.amount_total ?? 0;
  const cleaningFeeCents = metadata.cleaning_fee_cents
    ? parseInt(metadata.cleaning_fee_cents, 10)
    : 0;
  const taxCents = metadata.tax_cents ? parseInt(metadata.tax_cents, 10) : 0;
  const discountCents = metadata.discount_cents ? parseInt(metadata.discount_cents, 10) : 0;
  const discountLabel = metadata.discount_label ?? "";
  const totalCents = session.amount_total ?? accommodationCents + cleaningFeeCents + taxCents;
  const accommodationAmount = accommodationCents / 100;
  const cleaningFeeAmount = cleaningFeeCents / 100;
  const taxAmount = taxCents / 100;
  const discountAmount = discountCents / 100;
  const totalAmount = totalCents / 100;
  const sessionId = session.id ?? "";
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : null;

  // Split full name into first / last for Hospitable
  const nameParts = (guestName ?? "Guest").trim().split(/\s+/);
  const guestFirstName = nameParts[0] ?? "Guest";
  const guestLastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ".";

  if (!guestEmail || !propertySlug || !checkIn || !checkOut) {
    console.error("Fulfillment missing required fields", { guestEmail, propertySlug, checkIn, checkOut });
    return { ok: false, sessionId, reason: "missing_fields" };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
    return { ok: false, sessionId, reason: "db_not_configured" };
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
      accommodation_amount: accommodationAmount,
      cleaning_fee_amount: cleaningFeeAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency,
      cancel_token: cancelToken,
      status: "confirmed",
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );

  if (dbErr) {
    console.error("DB insert error", dbErr);
    // Continue anyway — log the error for investigation.
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
    const resendApiKey = process.env.RESEND_API_KEY;

    // Get or create unsubscribe token.
    let unsubscribeToken = "";
    const { data: existingUnsubToken } = await sb
      .from("email_unsubscribe_tokens")
      .select("token, used_at")
      .eq("email", guestEmail)
      .maybeSingle();
    unsubscribeToken = existingUnsubToken?.token ?? "";
    if (!unsubscribeToken || existingUnsubToken?.used_at) {
      unsubscribeToken = genToken();
      await sb.from("email_unsubscribe_tokens").upsert(
        { email: guestEmail, token: unsubscribeToken },
        { onConflict: "email" },
      );
    }
    const unsubscribeUrl = `https://seaandcityrentals.com/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    const template = TEMPLATES["booking-confirmation"];
    const props: BookingConfirmationProps = {
      guestName: guestName ?? "Guest",
      propertyTitle,
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      nights,
      accommodation: `$${accommodationAmount.toFixed(0)} ${currency.toUpperCase()}`,
      ...(discountAmount > 0 ? { discount: `-$${discountAmount.toFixed(0)} ${currency.toUpperCase()}`, discountLabel } : {}),
      ...(cleaningFeeAmount > 0 ? { cleaningFee: `$${cleaningFeeAmount.toFixed(0)} ${currency.toUpperCase()}` } : {}),
      tax: `$${taxAmount.toFixed(0)} ${currency.toUpperCase()}`,
      total: `$${totalAmount.toFixed(0)} ${currency.toUpperCase()}`,
      cancelUrl,
      unsubscribeUrl,
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
          unsubscribe_token: unsubscribeToken,
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
    } else if (resendApiKey) {
      await sendResendEmail(
        {
          to: guestEmail,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          subject,
          html,
          text,
          reply_to: `vacation@${FROM_DOMAIN}`,
          idempotency_key: `booking-confirm-${sessionId}`,
          unsubscribe_token: unsubscribeToken,
          message_id: messageId,
        },
        { apiKey: resendApiKey },
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
          unsubscribe_token: unsubscribeToken,
          queued_at: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    console.error("confirmation email failed", err);
  }

  // Create Hospitable reservation to block the calendar.
  const hospitableApiKey = process.env.HOSPITABLE_API_KEY;
  let hospitableCreated = false;
  if (hospitableId && hospitableApiKey) {
    hospitableCreated = await createHospitableReservation({
      hospitableId,
      checkIn,
      checkOut,
      guestFirstName,
      guestLastName,
      guestEmail,
      adults: guestCount,
      accommodationCents,
      cleaningFeeCents,
      taxCents,
      currency,
      stripeSessionId: sessionId,
      apiKey: hospitableApiKey,
    });
  } else if (!hospitableId) {
    console.warn("No hospitable_id in Stripe metadata — calendar not blocked for session", sessionId);
  }

  // Send owner notification email.
  try {
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const ownerTemplate = TEMPLATES["booking-owner-notification"];
    const ownerProps: BookingOwnerNotificationProps = {
      guestName: guestName ?? "Unknown",
      guestEmail,
      propertyTitle,
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      nights,
      guests: guestCount,
      accommodation: `$${accommodationAmount.toFixed(0)} ${currency.toUpperCase()}`,
      ...(discountAmount > 0 ? { discount: `-$${discountAmount.toFixed(0)} ${currency.toUpperCase()}`, discountLabel } : {}),
      ...(cleaningFeeAmount > 0 ? { cleaningFee: `$${cleaningFeeAmount.toFixed(0)} ${currency.toUpperCase()}` } : {}),
      tax: `$${taxAmount.toFixed(0)} ${currency.toUpperCase()}`,
      total: `$${totalAmount.toFixed(0)} ${currency.toUpperCase()}`,
      stripeSessionId: sessionId,
      hospitableCreated,
    };
    const ownerElement = React.createElement(ownerTemplate.component, ownerProps);
    const ownerHtml = await render(ownerElement);
    const ownerText = await render(ownerElement, { plainText: true });
    const ownerSubject =
      typeof ownerTemplate.subject === "function"
        ? ownerTemplate.subject(ownerProps as Record<string, any>)
        : ownerTemplate.subject;
    const ownerMessageId = crypto.randomUUID();

    if (lovableApiKey) {
      await sendLovableEmail(
        {
          to: OWNER_EMAIL,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: ownerSubject,
          html: ownerHtml,
          text: ownerText,
          purpose: "transactional",
          label: "booking-owner-notification",
          idempotency_key: `booking-owner-${sessionId}`,
          message_id: ownerMessageId,
        },
        { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
      );
      await sb.from("email_send_log").insert({
        message_id: ownerMessageId,
        template_name: "booking-owner-notification",
        recipient_email: OWNER_EMAIL,
        status: "sent",
      });
    } else if (resendApiKey) {
      await sendResendEmail(
        {
          to: OWNER_EMAIL,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          subject: ownerSubject,
          html: ownerHtml,
          text: ownerText,
          reply_to: `vacation@${FROM_DOMAIN}`,
          idempotency_key: `booking-owner-${sessionId}`,
          message_id: ownerMessageId,
        },
        { apiKey: resendApiKey },
      );
      await sb.from("email_send_log").insert({
        message_id: ownerMessageId,
        template_name: "booking-owner-notification",
        recipient_email: OWNER_EMAIL,
        status: "sent",
      });
    } else {
      const ownerQueueMessageId = crypto.randomUUID();
      await sb.from("email_send_log").insert({
        message_id: ownerQueueMessageId,
        template_name: "booking-owner-notification",
        recipient_email: OWNER_EMAIL,
        status: "pending",
      });
      await sb.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          message_id: ownerQueueMessageId,
          to: OWNER_EMAIL,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: ownerSubject,
          html: ownerHtml,
          text: ownerText,
          purpose: "transactional",
          label: "booking-owner-notification",
          idempotency_key: `booking-owner-${sessionId}`,
          queued_at: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    console.error("owner notification email failed", err);
  }

  return { ok: true, sessionId, hospitableCreated };
}
