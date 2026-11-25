import { createServerFn } from "@tanstack/react-start";
import { SITE_URL } from "@/data/properties";
import { MAX_PETS, petFeeFor } from "@/data/pets";

const TAX_RATE = 0.145; // Florida state + county tourist development tax

export type CheckoutInput = {
  propertySlug: string;
  propertyTitle: string;
  hospitableId?: string;
  guests?: number;
  pets?: number;
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
  // Pet fee is recomputed here from the pet count — never trust a client amount.
  const pets = Math.max(0, Math.min(MAX_PETS, Math.floor(input.pets ?? 0)));
  const petFeeCents = Math.round(petFeeFor(pets) * 100);
  // Florida taxes mandatory charges tied to the stay, so the pet fee is taxed
  // the same way as the cleaning fee.
  const subtotalCents = accommodationCents + cleaningFeeCents + petFeeCents;
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
    success_url: `${listingUrl}?booking=success`,
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
    "metadata[pets]": String(pets),
    "metadata[pet_fee_cents]": String(petFeeCents),
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

  // Pet fee ($50 per pet, per stay)
  if (petFeeCents > 0) {
    params[`line_items[${lineIndex}][price_data][currency]`] = input.currency.toLowerCase();
    params[`line_items[${lineIndex}][price_data][product_data][name]`] =
      `Pet fee (${pets} pet${pets !== 1 ? "s" : ""})`;
    params[`line_items[${lineIndex}][price_data][product_data][description]`] =
      "$50 per pet, per stay";
    params[`line_items[${lineIndex}][price_data][unit_amount]`] = String(petFeeCents);
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
