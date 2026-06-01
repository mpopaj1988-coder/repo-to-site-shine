import { createServerFn } from "@tanstack/react-start";
import { SITE_URL } from "@/data/properties";

export type CheckoutInput = {
  propertySlug: string;
  propertyTitle: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  total: number; // dollars (will be converted to cents for Stripe)
  currency: string;
};

async function stripeCheckoutSession(input: CheckoutInput): Promise<string> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

  const listingUrl = `${SITE_URL}/listings/${input.propertySlug}`;

  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]":
      `${input.propertyTitle} · ${input.checkIn} → ${input.checkOut}`,
    "line_items[0][price_data][product_data][description]":
      `${input.nights} night${input.nights !== 1 ? "s" : ""} · Sea & City Rentals · Book direct`,
    "line_items[0][price_data][unit_amount]": String(Math.round(input.total * 100)),
    "line_items[0][quantity]": "1",
    success_url: `${listingUrl}?booking=success`,
    cancel_url: listingUrl,
    customer_creation: "always",
    billing_address_collection: "required",
    "payment_intent_data[metadata][property]": input.propertySlug,
    "payment_intent_data[metadata][check_in]": input.checkIn,
    "payment_intent_data[metadata][check_out]": input.checkOut,
    "payment_intent_data[metadata][nights]": String(input.nights),
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Could not create Stripe checkout session");
  }

  const session = (await res.json()) as { url: string };
  return session.url;
}

export const createBookingCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: CheckoutInput) => data)
  .handler(async ({ data }) => {
    const url = await stripeCheckoutSession(data);
    return { url };
  });
