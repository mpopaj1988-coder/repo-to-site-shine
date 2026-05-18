// ============================================================
// 👉 PASTE YOUR GA4 MEASUREMENT ID HERE (looks like "G-XXXXXXX")
// You can find it in Google Analytics → Admin → Data Streams.
// Leave as empty string to disable analytics.
// ============================================================
export const GA4_MEASUREMENT_ID = "G-Y94QM048EZ";

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