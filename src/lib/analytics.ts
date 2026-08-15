// ============================================================
// 👉 PASTE YOUR GA4 MEASUREMENT ID HERE (looks like "G-XXXXXXX")
// You can find it in Google Analytics → Admin → Data Streams.
// Leave as empty string to disable analytics.
// ============================================================
export const GA4_MEASUREMENT_ID = "G-Y94QM048EZ";

// ============================================================
// 👉 GOOGLE ADS (optional — leave blank until you actually run ads)
//
// If you ever start advertising, you need TWO values from Google Ads
// so Google can tell which ad clicks turned into real bookings:
//
//   1. GOOGLE_ADS_ID — your account's conversion ID. Looks like "AW-123456789".
//      Google Ads → Tools → Data manager → Google tag.
//
//   2. GOOGLE_ADS_BOOKING_LABEL — the label for the booking conversion action.
//      Google Ads → Goals → Conversions → New conversion action → Website.
//      Create one called "Booking" and set it to use a DYNAMIC value
//      (so each booking reports its real dollar amount, not a flat guess).
//      The label is the short string after the slash, e.g. "AbC-D_efGh12".
//
// Leave BOTH as empty strings while you are not advertising. Nothing breaks —
// the tag simply never loads and no data is sent to Google Ads.
// ============================================================
export const GOOGLE_ADS_ID = "";
export const GOOGLE_ADS_BOOKING_LABEL = "";

/**
 * Safely fire a GA4 event. Works only in the browser when gtag is loaded
 * (no-op during SSR or before GA loads). Use for conversion tracking.
 *
 * Example: track("book_direct_click", { surface: "header", property: "tampa" })
 */
export function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", eventName, params ?? {});
  } catch {
    // swallow — analytics should never break the app
  }
}

export type PurchasePayload = {
  transactionId: string; // Stripe checkout session id — used to de-duplicate
  value: number; // total paid, in dollars
  currency: string;
  property: string;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
};

/**
 * Fire the booking conversion — GA4 `purchase` plus, if configured, the
 * Google Ads conversion. This is THE event that tells you which marketing
 * actually produces revenue; every other event on the site is just a step
 * on the way to this one.
 *
 * Safe to call more than once: the Stripe session id is recorded in
 * localStorage so a page refresh (or the guest reopening the link) cannot
 * double-count the same booking.
 */
export function trackPurchase(p: PurchasePayload) {
  if (typeof window === "undefined") return;

  const dedupeKey = `scr_purchase_${p.transactionId}`;
  try {
    if (window.localStorage.getItem(dedupeKey)) return;
    window.localStorage.setItem(dedupeKey, "1");
  } catch {
    // Private browsing / storage disabled — still report, better than losing it.
  }

  track("purchase", {
    transaction_id: p.transactionId,
    value: p.value,
    currency: p.currency,
    property: p.property,
    nights: p.nights,
    check_in: p.checkIn,
    check_out: p.checkOut,
    items: [
      {
        item_id: p.property,
        item_name: p.property,
        item_category: "vacation_rental",
        price: p.value,
        quantity: 1,
      },
    ],
  });

  if (GOOGLE_ADS_ID && GOOGLE_ADS_BOOKING_LABEL) {
    track("conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_BOOKING_LABEL}`,
      transaction_id: p.transactionId,
      value: p.value,
      currency: p.currency,
    });
  }
}
