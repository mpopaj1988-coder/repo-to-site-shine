import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getStripe } from "@/lib/stripe.server";

const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";
const SITE_URL = "https://seaandcityrentals.com";

const BodySchema = z.object({
  property_slug: z.string().min(1).max(100),
  hospitable_property_id: z.string().min(1).max(200),
  property_title: z.string().min(1).max(200),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().min(1).max(365),
  guests: z.number().int().min(1).max(50),
  total_dollars: z.number().min(1),
  currency: z.string().length(3).default("USD"),
});

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const Route = createFileRoute("/api/public/create-checkout-session")({
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

        const d = parsed.data;
        const totalCents = Math.round(d.total_dollars * 100);
        const days = daysUntil(d.check_in);

        // If check-in is within 30 days, charge in full now
        const isFullPaymentNow = days <= 30;
        const depositCents = isFullPaymentNow ? totalCents : Math.round(totalCents * 0.3);
        const balanceCents = totalCents - depositCents;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const balanceDueDate = new Date(d.check_in + "T00:00:00");
        balanceDueDate.setDate(balanceDueDate.getDate() - 30);
        // Don't put balance due in the past
        const effectiveBalanceDue = balanceDueDate < today ? today : balanceDueDate;
        const balanceDueDateStr = effectiveBalanceDue.toISOString().slice(0, 10);

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Server misconfiguration" }, { status: 500 });
        }
        const supabase = createClient(SUPABASE_URL, serviceKey);

        // Create pending booking record first so the success page works
        const { data: booking, error: dbErr } = await supabase
          .from("bookings")
          .insert({
            property_slug: d.property_slug,
            hospitable_property_id: d.hospitable_property_id,
            check_in: d.check_in,
            check_out: d.check_out,
            nights: d.nights,
            guests: d.guests,
            currency: d.currency.toUpperCase(),
            total_cents: totalCents,
            deposit_cents: depositCents,
            balance_cents: balanceCents,
            balance_due_date: balanceDueDateStr,
            status: "pending",
          })
          .select("id")
          .single();

        if (dbErr || !booking) {
          console.error("Failed to create booking record", dbErr);
          return Response.json({ error: "Could not create booking" }, { status: 500 });
        }

        const bookingId = booking.id as string;

        // Build Stripe Checkout session
        const stripe = getStripe();
        const isFullPayment = balanceCents === 0;

        const lineItemDescription = isFullPayment
          ? `${d.nights} nights · ${d.guests} ${d.guests === 1 ? "guest" : "guests"} · Full payment`
          : `${d.nights} nights · ${d.guests} ${d.guests === 1 ? "guest" : "guests"} · 30% deposit (balance of $${(balanceCents / 100).toFixed(0)} due ${balanceDueDateStr})`;

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: d.currency.toLowerCase(),
                product_data: {
                  name: `${d.property_title} — ${d.check_in} to ${d.check_out}`,
                  description: lineItemDescription,
                },
                unit_amount: depositCents,
              },
              quantity: 1,
            },
          ],
          customer_creation: "always",
          phone_number_collection: { enabled: true },
          payment_intent_data: {
            // Save card for future off-session balance charge
            setup_future_usage: isFullPayment ? undefined : "off_session",
            metadata: {
              booking_id: bookingId,
              property_slug: d.property_slug,
            },
          },
          metadata: {
            booking_id: bookingId,
            property_slug: d.property_slug,
            check_in: d.check_in,
            check_out: d.check_out,
          },
          success_url: `${SITE_URL}/bookings/${bookingId}?success=1`,
          cancel_url: `${SITE_URL}/listings/${d.property_slug}`,
        });

        // Save session ID so the webhook can find the booking
        await supabase
          .from("bookings")
          .update({ stripe_checkout_session_id: session.id })
          .eq("id", bookingId);

        return Response.json({ url: session.url, booking_id: bookingId });
      },
    },
  },
});
