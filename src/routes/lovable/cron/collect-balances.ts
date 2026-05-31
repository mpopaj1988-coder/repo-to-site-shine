import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/components";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { getStripe } from "@/lib/stripe.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";
const SITE_NAME = "Sea & City Rentals";
const FROM_DOMAIN = "seaandcityrentals.com";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";

export const Route = createFileRoute("/lovable/cron/collect-balances")({
  server: {
    handlers: {
      POST: async () => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Missing service key" }, { status: 500 });
        }
        const supabase = createClient(SUPABASE_URL, serviceKey);
        const today = new Date().toISOString().slice(0, 10);

        // Find all confirmed bookings where balance is due today or overdue
        const { data: dueBookings, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("status", "confirmed")
          .eq("balance_paid", false)
          .gt("balance_cents", 0)
          .lte("balance_due_date", today);

        if (error) {
          console.error("Failed to query due balances", error);
          return Response.json({ error: "DB query failed" }, { status: 500 });
        }

        if (!dueBookings || dueBookings.length === 0) {
          return Response.json({ ok: true, charged: 0 });
        }

        let charged = 0;
        let failed = 0;
        const stripe = getStripe();

        for (const booking of dueBookings) {
          const customerId = booking.stripe_customer_id as string | null;
          if (!customerId) {
            console.error("No stripe_customer_id for booking", booking.id);
            failed++;
            continue;
          }

          // Get the default payment method for this customer
          let paymentMethodId: string | null = booking.stripe_payment_method_id as string | null;
          if (!paymentMethodId) {
            try {
              const pms = await stripe.paymentMethods.list({
                customer: customerId,
                type: "card",
                limit: 1,
              });
              paymentMethodId = pms.data[0]?.id ?? null;
            } catch (err) {
              console.error("Could not retrieve payment method for", booking.id, err);
              failed++;
              continue;
            }
          }

          if (!paymentMethodId) {
            console.error("No payment method found for booking", booking.id);
            failed++;
            continue;
          }

          try {
            const pi = await stripe.paymentIntents.create({
              amount: booking.balance_cents as number,
              currency: (booking.currency as string).toLowerCase(),
              customer: customerId,
              payment_method: paymentMethodId,
              confirm: true,
              off_session: true,
              description: `Balance — ${booking.property_slug} ${booking.check_in}–${booking.check_out}`,
              metadata: { booking_id: booking.id, type: "balance" },
            });

            if (pi.status === "succeeded") {
              await supabase
                .from("bookings")
                .update({
                  balance_paid: true,
                  stripe_balance_payment_intent_id: pi.id,
                  stripe_payment_method_id: paymentMethodId,
                })
                .eq("id", booking.id);

              // Send balance collected email
              if (booking.guest_email) {
                try {
                  const templateEntry = TEMPLATES["balance-reminder"];
                  const firstName = (booking.guest_first_name as string) || "Guest";
                  const props = {
                    guestName: firstName,
                    propertyTitle: (booking.property_slug as string)
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    checkIn: booking.check_in as string,
                    checkOut: booking.check_out as string,
                    balanceDollars: (booking.balance_cents as number) / 100,
                    currency: booking.currency as string,
                    bookingId: booking.id as string,
                  };
                  const element = React.createElement(templateEntry.component, props);
                  const html = await render(element);
                  const text = await render(element, { plainText: true });
                  const subject =
                    typeof templateEntry.subject === "function"
                      ? templateEntry.subject(props as Record<string, any>)
                      : templateEntry.subject;
                  const lovableApiKey = process.env.LOVABLE_API_KEY;
                  if (lovableApiKey) {
                    await sendLovableEmail(
                      {
                        to: booking.guest_email as string,
                        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                        sender_domain: SENDER_DOMAIN,
                        subject,
                        html,
                        text,
                        purpose: "transactional",
                        label: "balance-reminder",
                        idempotency_key: `balance-${booking.id}`,
                      },
                      { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
                    );
                  }
                } catch (emailErr) {
                  console.error("Balance email failed for", booking.id, emailErr);
                }
              }
              charged++;
            } else {
              console.error("Payment intent not succeeded for", booking.id, pi.status);
              failed++;
            }
          } catch (stripeErr) {
            console.error("Stripe charge failed for booking", booking.id, stripeErr);
            failed++;
          }
        }

        return Response.json({ ok: true, charged, failed, total: dueBookings.length });
      },
    },
  },
});
