import * as React from "react";
import { render } from "@react-email/components";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { sendResendEmail } from "@/lib/resend-email";
import { TEMPLATES } from "@/lib/email-templates/registry";
import type { BookingCancellationProps } from "@/lib/email-templates/booking-cancellation";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";
const SITE_NAME = "Sea & City Rentals";
const FROM_DOMAIN = "seaandcityrentals.com";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";

// Days-before-checkin threshold for a full refund.
const REFUND_WINDOW_DAYS = 5;

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(SUPABASE_URL, key);
}

function daysUntil(checkIn: string): number {
  const checkinMs = new Date(checkIn).setHours(0, 0, 0, 0);
  const todayMs = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((checkinMs - todayMs) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export type BookingRecord = {
  id: string;
  stripe_payment_intent_id: string | null;
  property_slug: string;
  property_title: string;
  guest_email: string;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  total_amount: number;
  currency: string;
  status: string;
  cancel_token: string;
  created_at: string;
};

export const getBookingByToken = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }): Promise<BookingRecord | null> => {
    if (!data.token) return null;
    const sb = adminClient();
    const { data: row, error } = await sb
      .from("bookings")
      .select("*")
      .eq("cancel_token", data.token)
      .maybeSingle();
    if (error || !row) return null;
    return row as BookingRecord;
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(
    async ({ data }): Promise<{ ok: boolean; refunded: boolean; refundAmount: string | null; error?: string }> => {
      if (!data.token) return { ok: false, refunded: false, refundAmount: null, error: "Invalid token" };

      const sb = adminClient();
      const { data: row, error: fetchErr } = await sb
        .from("bookings")
        .select("*")
        .eq("cancel_token", data.token)
        .maybeSingle();

      if (fetchErr || !row) return { ok: false, refunded: false, refundAmount: null, error: "Booking not found" };
      if (row.status !== "confirmed") return { ok: false, refunded: false, refundAmount: null, error: "Already cancelled" };

      const days = daysUntil(row.check_in);
      const eligible = days >= REFUND_WINDOW_DAYS;
      let refundAmount: number | null = null;

      // Issue Stripe refund if within the free-cancellation window.
      if (eligible && row.stripe_payment_intent_id) {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
          const body = new URLSearchParams({
            payment_intent: row.stripe_payment_intent_id,
          });
          const res = await fetch("https://api.stripe.com/v1/refunds", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          });
          if (res.ok) {
            refundAmount = row.total_amount;
          } else {
            const err = (await res.json()) as { error?: { message?: string } };
            console.error("Stripe refund failed", err.error?.message);
          }
        }
      }

      // Update booking record.
      await sb.from("bookings").update({
        status: "cancelled",
        refund_amount: refundAmount,
        cancelled_at: new Date().toISOString(),
      }).eq("id", row.id);

      // Send cancellation email.
      try {
        const lovableApiKey = process.env.LOVABLE_API_KEY;
        const resendApiKey = process.env.RESEND_API_KEY;
        const template = TEMPLATES["booking-cancellation"];
        const props: BookingCancellationProps = {
          guestName: row.guest_name ?? "Guest",
          propertyTitle: row.property_title,
          checkIn: formatDate(row.check_in),
          checkOut: formatDate(row.check_out),
          refundAmount: refundAmount != null
            ? `$${refundAmount.toFixed(0)} ${row.currency.toUpperCase()}`
            : undefined,
        };
        const element = React.createElement(template.component, props);
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const subject = typeof template.subject === "function"
          ? template.subject(props as Record<string, any>)
          : template.subject;

        if (lovableApiKey) {
          await sendLovableEmail(
            {
              to: row.guest_email,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject,
              html,
              text,
              purpose: "transactional",
              label: "booking-cancellation",
              idempotency_key: `booking-cancel-${row.id}`,
            },
            { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
          );
        } else if (resendApiKey) {
          await sendResendEmail(
            {
              to: row.guest_email,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              subject,
              html,
              text,
              reply_to: `vacation@${FROM_DOMAIN}`,
              idempotency_key: `booking-cancel-${row.id}`,
            },
            { apiKey: resendApiKey },
          );
        } else {
          await sb.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              message_id: crypto.randomUUID(),
              to: row.guest_email,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject,
              html,
              text,
              purpose: "transactional",
              label: "booking-cancellation",
              idempotency_key: `booking-cancel-${row.id}`,
              queued_at: new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        console.error("cancellation email failed", err);
      }

      return {
        ok: true,
        refunded: refundAmount != null,
        refundAmount: refundAmount != null
          ? `$${refundAmount.toFixed(0)} ${row.currency.toUpperCase()}`
          : null,
      };
    },
  );
