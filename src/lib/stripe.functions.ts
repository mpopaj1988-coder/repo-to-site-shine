import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { SITE_URL } from "@/data/properties";

export type CreateBookingCheckoutInput = {
  propertySlug: string;
  propertyName: string;
  hospitableId?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalCents: number;
  currency: string;
  guestName: string;
  guestEmail: string;
  guestCount: number;
};

export const createBookingCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: CreateBookingCheckoutInput) => data)
  .handler(async ({ data }): Promise<{ url: string }> => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Stripe is not configured");

    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.guestEmail,
      line_items: [
        {
          price_data: {
            currency: data.currency.toLowerCase(),
            product_data: {
              name: `${data.propertyName} — ${data.nights} ${data.nights === 1 ? "night" : "nights"}`,
              description: `${data.checkIn} → ${data.checkOut} · ${data.guestCount} ${data.guestCount === 1 ? "guest" : "guests"}`,
            },
            unit_amount: data.totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        property_slug: data.propertySlug,
        property_name: data.propertyName,
        hospitable_id: data.hospitableId ?? "",
        check_in: data.checkIn,
        check_out: data.checkOut,
        nights: String(data.nights),
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        guest_count: String(data.guestCount),
      },
      success_url: `${SITE_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/listings/${data.propertySlug}`,
    });

    if (!session.url) throw new Error("Failed to create checkout session");
    return { url: session.url };
  });
