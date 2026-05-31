import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getStripe } from "@/lib/stripe.server";

const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";
const HOSPITABLE_API = "https://public.api.hospitable.com/v2";

const BodySchema = z.object({
  booking_id: z.string().uuid(),
  guest_email: z.string().email(),
});

export const Route = createFileRoute("/api/public/cancel-booking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }

        const { booking_id, guest_email } = parsed.data;

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Server misconfiguration" }, { status: 500 });
        }
        const supabase = createClient(SUPABASE_URL, serviceKey);

        const { data: booking } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", booking_id)
          .single();

        if (!booking) {
          return Response.json({ error: "Booking not found" }, { status: 404 });
        }

        // Verify guest owns this booking
        if ((booking.guest_email as string)?.toLowerCase() !== guest_email.toLowerCase()) {
          return Response.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (booking.status === "cancelled") {
          return Response.json({ error: "Already cancelled" }, { status: 400 });
        }
        if (booking.status === "completed") {
          return Response.json({ error: "Completed stays cannot be cancelled" }, { status: 400 });
        }

        // Check cancellation policy: 5+ days before check-in → full refund
        const checkIn = new Date((booking.check_in as string) + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntilCheckIn = Math.ceil(
          (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        const isFullRefund = daysUntilCheckIn >= 5;
        const paidSoFar =
          (booking.deposit_paid ? (booking.deposit_cents as number) : 0) +
          (booking.balance_paid ? (booking.balance_cents as number) : 0);
        const refundCents = isFullRefund ? paidSoFar : 0;

        // Issue Stripe refund if applicable
        let stripeRefundId: string | null = null;
        if (refundCents > 0 && booking.stripe_deposit_payment_intent_id) {
          try {
            const stripe = getStripe();
            const refund = await stripe.refunds.create({
              payment_intent: booking.stripe_deposit_payment_intent_id as string,
              amount: refundCents,
              reason: "requested_by_customer",
            });
            stripeRefundId = refund.id;
          } catch (err) {
            console.error("Stripe refund failed", err);
            return Response.json({ error: "Refund processing failed" }, { status: 500 });
          }
        }

        // Cancel Hospitable reservation
        if (booking.hospitable_reservation_id) {
          const apiKey = process.env.HOSPITABLE_API_KEY;
          if (apiKey) {
            await fetch(
              `${HOSPITABLE_API}/reservations/${booking.hospitable_reservation_id}/cancel`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({ reason: "Guest requested cancellation" }),
              },
            ).catch((err) => console.error("Hospitable cancel failed", err));
          }
        }

        await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancellation_date: new Date().toISOString(),
            refund_amount_cents: refundCents,
            stripe_refund_id: stripeRefundId,
          })
          .eq("id", booking_id);

        return Response.json({
          ok: true,
          refunded: refundCents > 0,
          refund_amount: refundCents / 100,
          currency: booking.currency,
          policy: isFullRefund
            ? "Full refund issued (cancelled 5+ days before check-in)"
            : "No refund (cancelled less than 5 days before check-in)",
        });
      },
    },
  },
});
