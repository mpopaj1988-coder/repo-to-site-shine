// ============================================================
// 👉 PASTE YOUR GA4 MEASUREMENT ID HERE (looks like "G-XXXXXXX")
// You can find it in Google Analytics → Admin → Data Streams.
// Leave as empty string to disable analytics.
// ============================================================
export const GA4_MEASUREMENT_ID = "G-Y94QM048EZ";

// ============================================================
// Meta (Facebook/Instagram) Pixel ID, from Events Manager.
// Leave as empty string to disable Meta conversion tracking.
// ============================================================
export const META_PIXEL_ID = "1434166651018021";

// Maps our GA4 event names to Meta's standard event names so Meta Ads
// can optimize toward real conversions. Events not listed here only go to GA4.
const META_STANDARD_EVENTS: Record<string, string> = {
  email_signup: "Lead",
  inquiry_click: "Lead",
  phone_click: "Contact",
  reserve_click: "InitiateCheckout",
  listing_view: "ViewContent",
};

/**
 * Safely fire a GA4 (and, when mapped, Meta Pixel) event. Works only in the
 * browser when gtag/fbq are loaded (no-op during SSR or before they load).
 * Use for conversion tracking.
 *
 * Example: track("book_direct_click", { surface: "header", property: "tampa" })
 */
export function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    try {
      gtag("event", eventName, params ?? {});
    } catch {
      // swallow — analytics should never break the app
    }
  }

  const metaEvent = META_STANDARD_EVENTS[eventName];
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (metaEvent && typeof fbq === "function") {
    try {
      fbq("track", metaEvent, params ?? {});
    } catch {
      // swallow — analytics should never break the app
    }
  }
}
