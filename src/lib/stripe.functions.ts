import { createServerFn } from "@tanstack/react-start";
import { SITE_URL } from "@/data/properties";

const TAX_RATE = 0.145; // Florida state + county tourist development tax

export type CheckoutInput = {
  propertySlug: string;
  propertyTitle: string;
  hospitableId?: string;
  guests?: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  accommodation: number; // nightly total after discount, dollars
  cleaningFee: number;   // dollars
  total: number;         // accommodation + cleaningFee (pre-tax), dollars
  currency: string;
  discountAmount?: number; // dollar amount saved, for display/records
  discountLabel?: string;  // e.g. "Weekly stay · 5% off"
  promoCode?: string;      // discount code the guest entered, if any
};

async function stripeCheckoutSession(input: CheckoutInput): Promise<string> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

  const listingUrl = `${SITE_URL}/listings/${input.propertySlug}`;
  const accommodationCents = Math.round(input.accommodation * 100);
  const cleaningFeeCents = Math.round(input.cleaningFee * 100);
  const subtotalCents = accommodationCents + cleaningFeeCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);

  const params: Record<string, string> = {
    mode: "payment",
    // Line item 1 — nightly accommodation (discounted price already applied)
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]":
      `${input.propertyTitle} · ${input.checkIn} → ${input.checkOut}`,
    "line_items[0][price_data][product_data][description]": [
      `${input.nights} night${input.nights !== 1 ? "s" : ""}`,
      "Sea & City Rentals · Book direct",
      input.discountLabel ? `${input.discountLabel} applied` : null,
    ].filter(Boolean).join(" · "),
    "line_items[0][price_data][unit_amount]": String(accommodationCents),
    "line_items[0][quantity]": "1",
    // `{CHECKOUT_SESSION_ID}` is substituted by Stripe on redirect. We read the
    // session back server-side to record the booking's real value in analytics,
    // rather than trusting a number passed through the URL.
    success_url: `${listingUrl}?booking=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: listingUrl,
    customer_creation: "always",
    billing_address_collection: "required",
    // Deliberately no `allow_promotion_codes` — discount codes are validated in
    // our own booking widget and applied to the room rate before this session is
    // built, so Florida tax stays correct. A second Stripe-side promo box would
    // only reject the codes we issue, since they don't exist in Stripe.
    // Session-level metadata
    "metadata[property]": input.propertySlug,
    "metadata[title]": input.propertyTitle,
    "metadata[check_in]": input.checkIn,
    "metadata[check_out]": input.checkOut,
    "metadata[nights]": String(input.nights),
    "metadata[accommodation_cents]": String(accommodationCents),
    "metadata[cleaning_fee_cents]": String(cleaningFeeCents),
    "metadata[tax_cents]": String(taxCents),
    ...(input.discountAmount ? { "metadata[discount_cents]": String(Math.round(input.discountAmount * 100)) } : {}),
    ...(input.discountLabel ? { "metadata[discount_label]": input.discountLabel } : {}),
    ...(input.promoCode ? { "metadata[promo_code]": input.promoCode } : {}),
  };

  let lineIndex = 1;

  // Line item 2 — cleaning fee (only if non-zero)
  if (cleaningFeeCents > 0) {
    params[`line_items[${lineIndex}][price_data][currency]`] = input.currency.toLowerCase();
    params[`line_items[${lineIndex}][price_data][product_data][name]`] = "Cleaning fee";
    params[`line_items[${lineIndex}][price_data][unit_amount]`] = String(cleaningFeeCents);
    params[`line_items[${lineIndex}][quantity]`] = "1";
    lineIndex++;
  }

  // Line item — Florida taxes
  params[`line_items[${lineIndex}][price_data][currency]`] = input.currency.toLowerCase();
  params[`line_items[${lineIndex}][price_data][product_data][name]`] = "Florida state & county taxes (14.5%)";
  params[`line_items[${lineIndex}][price_data][product_data][description]`] =
    "State sales tax 6% + Tourist Development Tax 6% + County surtax 2.5%";
  params[`line_items[${lineIndex}][price_data][unit_amount]`] = String(taxCents);
  params[`line_items[${lineIndex}][quantity]`] = "1";

  if (input.hospitableId) params["metadata[hospitable_id]"] = input.hospitableId;
  if (input.guests) params["metadata[guests]"] = String(input.guests);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
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

export type BookingResult = {
  paid: boolean;
  transactionId: string;
  value: number; // total actually charged, in dollars
  currency: string;
  property: string;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
};

/**
 * Read a completed checkout session back from Stripe so the confirmation page
 * can report the booking — and its true dollar value — to analytics.
 *
 * Returns `paid: false` for anything not actually paid, so a guessed or
 * replayed session id can never manufacture a fake conversion.
 */
export const getBookingResult = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }): Promise<BookingResult | null> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !data.sessionId.startsWith("cs_")) return null;

    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } },
    );
    if (!res.ok) return null;

    const session = (await res.json()) as {
      id: string;
      amount_total: number | null;
      currency: string | null;
      payment_status: string;
      metadata?: Record<string, string>;
    };

    if (session.payment_status !== "paid") return null;

    const meta = session.metadata ?? {};
    const nights = Number(meta.nights);

    return {
      paid: true,
      transactionId: session.id,
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? "usd").toUpperCase(),
      property: meta.property ?? "",
      nights: Number.isFinite(nights) && nights > 0 ? nights : undefined,
      checkIn: meta.check_in,
      checkOut: meta.check_out,
    };
  });
