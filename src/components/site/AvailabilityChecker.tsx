import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import type { CalendarDay } from "@/lib/hospitable.functions";
import { createBookingCheckout } from "@/lib/stripe.functions";
import { track } from "@/lib/analytics";

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmd(s: string): Date {
  // Parse YYYY-MM-DD as local-midnight to avoid timezone shifts.
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function nightsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Slow season: Aug–Jan, excluding Christmas week (Dec 20–31) and New Year week (Jan 1–7)
function isSlowSeason(date: Date): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (m >= 2 && m <= 7) return false;    // Feb–Jul: peak/shoulder
  if (m === 12 && d >= 20) return false; // Christmas week
  if (m === 1 && d <= 7) return false;   // New Year week
  return true;
}

// Peak / blackout nights: no length-of-stay discount applies if ANY night falls here.
// Blackout: Feb, Mar, 4th of July week (Jun 28 – Jul 7), Christmas/New Year (Dec 20 – Jan 7).
function isBlackoutNight(date: Date): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (m === 2 || m === 3) return true;               // February, March
  if (m === 6 && d >= 28) return true;               // Last days of June (4th of July week)
  if (m === 7 && d <= 7) return true;                // First week of July
  if (m === 12 && d >= 20) return true;              // Christmas week
  if (m === 1 && d <= 7) return true;                // New Year week
  return false;
}

type Discount = { pct: number; label: string; amount: number };

function getStayDiscount(nights: number, from: Date, to: Date, accommodationTotal: number): Discount | null {
  if (nights < 7) return null;
  // Check every night of the stay for a blackout date.
  const cursor = new Date(from);
  while (cursor < to) {
    if (isBlackoutNight(cursor)) return null;
    cursor.setDate(cursor.getDate() + 1);
  }
  const pct = nights >= 28 ? 0.15 : 0.05;
  const label = nights >= 28 ? "Monthly stay · 15% off" : "Weekly stay · 5% off";
  const amount = Math.round(accommodationTotal * pct);
  return { pct, label, amount };
}

export function AvailabilityChecker({
  bookingUrl,
  calendar,
  propertySlug,
  propertyTitle,
  hospitableId,
  maxGuests = 16,
  cleaningFee = 0,
}: {
  bookingUrl: string;
  calendar: CalendarDay[];
  propertySlug?: string;
  propertyTitle?: string;
  hospitableId?: string;
  maxGuests?: number;
  cleaningFee?: number;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeEmail, setCodeEmail] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "loading" | "done" | "not_found" | "error">("idle");
  // Tracks which rangeKey the user dismissed the upsell for, so it reappears on new date selections
  const [dismissedForRange, setDismissedForRange] = useState("");

  // Build lookup structures for availability and pricing
  const { unavailableSet, checkoutOnlySet, priceByDate, currency, minDate, maxDate, firstAvailableDate, hasAnyAvailable } =
    useMemo(() => {
      const unavail = new Set<string>();
      const priceMap: Record<string, number> = {};
      let cur = "USD";
      let earliest: Date | undefined;
      let latestStr: string | undefined;
      let firstAvail: Date | undefined;
      for (const d of calendar) {
        if (!d.date) continue;
        if (!earliest) earliest = parseYmd(d.date);
        if (!latestStr || d.date > latestStr) latestStr = d.date;
        if (!d.available) unavail.add(d.date);
        else if (!firstAvail) firstAvail = parseYmd(d.date);
        if (typeof d.price === "number") priceMap[d.date] = d.price;
        cur = d.currency;
      }
      // Dates that are the first day of an unavailable block are another guest's
      // check-in day. Allow these as checkout dates (same-day turnaround is standard)
      // but not as check-in dates.
      const checkoutOnly = new Set<string>();
      for (const date of unavail) {
        const prev = new Date(parseYmd(date));
        prev.setDate(prev.getDate() - 1);
        if (!unavail.has(ymd(prev))) checkoutOnly.add(date);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        unavailableSet: unavail,
        checkoutOnlySet: checkoutOnly,
        priceByDate: priceMap,
        currency: cur,
        minDate: earliest ?? today,
        maxDate: latestStr ? parseYmd(latestStr) : undefined,
        firstAvailableDate: firstAvail,
        hasAnyAvailable: !!firstAvail,
      };
    }, [calendar]);

  // Validate selected range against unavailability; sum price across nights.
  const { nights, total, hasUnavailable } = useMemo(() => {
    if (!range?.from || !range?.to) return { nights: 0, total: 0, hasUnavailable: false };
    const n = nightsBetween(range.from, range.to);
    if (n <= 0) return { nights: 0, total: 0, hasUnavailable: false };
    let sum = 0;
    let bad = false;
    const cursor = new Date(range.from);
    for (let i = 0; i < n; i++) {
      const key = ymd(cursor);
      if (unavailableSet.has(key)) bad = true;
      const dayPrice = priceByDate[key];
      if (typeof dayPrice === "number") sum += dayPrice;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { nights: n, total: Math.round(sum), hasUnavailable: bad };
  }, [range, unavailableSet, priceByDate]);

  // ── 5th-night upsell ──────────────────────────────────────────────────────
  // range.to is the checkout date; staying that night = the potential 5th night
  const rangeKey = range?.from && range?.to ? `${ymd(range.from)}_${ymd(range.to)}` : "";
  const upsellDismissed = rangeKey !== "" && dismissedForRange === rangeKey;

  const fifthNightKey = range?.to ? ymd(range.to) : null;
  const fifthNightBasePrice = fifthNightKey ? (priceByDate[fifthNightKey] ?? 0) : 0;
  const fifthNightDiscountedPrice = Math.round(fifthNightBasePrice * 0.65);
  const fifthNightSavings = Math.round(fifthNightBasePrice * 0.35);
  const fifthNightAvailable = !!fifthNightKey && !unavailableSet.has(fifthNightKey);

  const showUpsellModal = useMemo(() => {
    if (nights !== 4 || upsellDismissed || !range?.from) return false;
    if (!fifthNightAvailable) return false;
    return isSlowSeason(range.from);
  }, [nights, upsellDismissed, range?.from, fifthNightAvailable]);

  useEffect(() => {
    if (showUpsellModal) {
      track("upsell_shown", { property: propertySlug, nights: 4 });
    }
  }, [showUpsellModal]); // eslint-disable-line react-hooks/exhaustive-deps

  function acceptUpsell() {
    if (!range?.to) return;
    const newTo = new Date(range.to);
    newTo.setDate(newTo.getDate() + 1);
    setRange((r) => (r ? { ...r, to: newTo } : undefined));
    setDismissedForRange(rangeKey);
    track("upsell_accepted", {
      property: propertySlug,
      savings: fifthNightSavings,
      check_in: range?.from ? ymd(range.from) : undefined,
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  const canReserve = range?.from && range?.to && nights > 0 && !hasUnavailable;

  async function handleReserve() {
    if (!canReserve) {
      setShowCalendar(true);
      return;
    }

    track("reserve_click", {
      property: propertySlug,
      nights,
      total,
      currency,
      guests,
      check_in: range?.from ? ymd(range.from) : undefined,
      check_out: range?.to ? ymd(range.to) : undefined,
    });

    // No pricing available → fall back to Hospitable booking URL
    const baseAccommodation = total > 0 ? total : 0;
    if (!baseAccommodation) {
      window.open(bookingUrl, "_blank", "noreferrer");
      return;
    }

    const discount = range?.from && range?.to
      ? getStayDiscount(nights, range.from, range.to, baseAccommodation)
      : null;
    const discountedAccommodation = discount
      ? Math.round(baseAccommodation - discount.amount)
      : Math.round(baseAccommodation);
    const checkoutTotal = discountedAccommodation + cleaningFee;

    setRedirecting(true);
    try {
      const result = await createBookingCheckout({
        data: {
          propertySlug: propertySlug ?? "",
          propertyTitle: propertyTitle ?? propertySlug ?? "Vacation Rental",
          hospitableId,
          guests,
          checkIn: ymd(range!.from!),
          checkOut: ymd(range!.to!),
          nights,
          accommodation: discountedAccommodation,
          cleaningFee,
          total: checkoutTotal,
          currency,
          ...(discount ? { discountAmount: discount.amount, discountLabel: discount.label } : {}),
        },
      });
      window.location.href = result.url;
    } catch {
      // Stripe unavailable — fall back to Hospitable
      window.open(bookingUrl, "_blank", "noreferrer");
      setRedirecting(false);
    }
  }

  const fromLabel = range?.from?.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const toLabel = range?.to?.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fifthNightLabel = range?.to?.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (!calendar.length) {
    // No calendar data (API key missing) — render nothing; the existing fallback CTA covers it.
    return null;
  }

  return (
    <div data-testid="availability-checker" className="mt-5 border-t border-border pt-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">
        Check availability
      </p>
      <div className="mt-3 grid w-full grid-cols-2 gap-2">
        <div className="relative">
          <button
            type="button"
            data-testid="availability-toggle"
            onClick={() => {
              setShowCalendar((s) => {
                if (!s) track("availability_opened", { property: propertySlug });
                return !s;
              });
            }}
            className="w-full rounded-sm border border-border bg-background p-2 text-left transition hover:border-[var(--color-deep)]"
          >
            <div className="rounded-sm bg-[var(--color-sand)] px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Check-in</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{fromLabel ?? "Add date"}</p>
            </div>
          </button>
          {range?.from && (
            <button
              type="button"
              aria-label="Clear check-in"
              onClick={() => setRange((r) => r ? { ...r, from: undefined } : undefined)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCalendar((s) => {
                if (!s) track("availability_opened", { property: propertySlug });
                return !s;
              });
            }}
            className="w-full rounded-sm border border-border bg-background p-2 text-left transition hover:border-[var(--color-deep)]"
          >
            <div className="rounded-sm bg-[var(--color-sand)] px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Check-out</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{toLabel ?? "Add date"}</p>
            </div>
          </button>
          {range?.to && (
            <button
              type="button"
              aria-label="Clear check-out"
              onClick={() => setRange((r) => r ? { ...r, to: undefined } : undefined)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Guest count */}
      <div className="mt-2 flex items-center justify-between rounded-sm border border-border bg-background px-3 py-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Guests</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Remove guest"
            disabled={guests <= 1}
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm text-muted-foreground transition hover:border-[var(--color-deep)] hover:text-foreground disabled:opacity-30"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold text-foreground">{guests}</span>
          <button
            type="button"
            aria-label="Add guest"
            disabled={guests >= maxGuests}
            onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm text-muted-foreground transition hover:border-[var(--color-deep)] hover:text-foreground disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      {showCalendar && (
        <div className="mt-3 rounded-sm border border-border bg-background p-2">
          {hasAnyAvailable ? (
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              disabled={(date) => {
                const key = ymd(date);
                if (date < minDate) return true;
                // Beyond the fetched calendar window we have no data — never treat that as "available".
                if (maxDate && date > maxDate) return true;
                // Allow another guest's check-in date as a checkout date (same-day turnaround).
                if (checkoutOnlySet.has(key)) return !range?.from || date <= range.from;
                return unavailableSet.has(key);
              }}
              startMonth={minDate}
              endMonth={maxDate}
              defaultMonth={firstAvailableDate ?? minDate}
              numberOfMonths={1}
              data-testid="availability-calendar"
            />
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No online availability right now</p>
              <p className="mt-1">Contact us directly — we often have dates open that aren't shown here.</p>
            </div>
          )}
        </div>
      )}

      {nights > 0 && (
        <div
          data-testid="availability-summary"
          className="mt-4 space-y-1 rounded-sm bg-[var(--color-sand)] p-3 text-sm"
        >
          {(() => {
            const baseAccom = total > 0 ? total : 0;
            if (baseAccom === 0) {
              return (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{nights} {nights === 1 ? "night" : "nights"}</span>
                </div>
              );
            }
            const disc = range?.from && range?.to
              ? getStayDiscount(nights, range.from, range.to, baseAccom)
              : null;
            const discountedAccom = disc ? baseAccom - disc.amount : baseAccom;
            const subtotal = discountedAccom + cleaningFee;
            const tax = Math.round(subtotal * 0.145);
            const grandTotal = Math.round(subtotal + tax);
            return (
              <>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{nights} {nights === 1 ? "night" : "nights"}</span>
                  <span>${Math.round(baseAccom)} {currency}</span>
                </div>
                {disc && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>{disc.label}</span>
                    <span>-${disc.amount} {currency}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Cleaning fee</span>
                  <span>${cleaningFee} {currency}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>FL taxes (14.5%)</span>
                  <span>${tax} {currency}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1 font-semibold text-[var(--color-deep)]">
                  <span>Total</span>
                  <span>${grandTotal} {currency}</span>
                </div>
              </>
            );
          })()}
          {hasUnavailable && (
            <p className="text-xs text-red-600">
              Some dates in this range aren't available. Try different dates.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground">
        🔒 100% refund if cancelled 5+ days before check-in · No refund within 5 days
      </p>

      <button
        type="button"
        data-testid="availability-reserve-btn"
        disabled={redirecting}
        onClick={handleReserve}
        className={`mt-4 w-full rounded-sm py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] shadow transition ${
          redirecting
            ? "cursor-wait bg-[var(--color-gold)]/70 text-[var(--color-deep)]"
            : "bg-[var(--color-gold)] text-[var(--color-deep)] hover:brightness-105"
        }`}
      >
        {redirecting
          ? "Redirecting to checkout…"
          : canReserve
            ? `Reserve · ${nights} ${nights === 1 ? "night" : "nights"}`
            : "Select dates to reserve"}
      </button>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Returning guest?{" "}
        <button
          type="button"
          onClick={() => { setShowCodeModal(true); setCodeStatus("idle"); setCodeEmail(""); }}
          className="font-medium text-[var(--color-deep)] underline-offset-2 hover:underline"
        >
          Get your 10% off code →
        </button>
      </p>

      {showCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCodeModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">Returning guest</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--color-deep)]">Get your 10% off code</h3>

            {codeStatus === "done" ? (
              <>
                <p className="mt-4 text-sm font-medium text-emerald-700">
                  Sent! Check your inbox for your <span className="font-bold">RETURN10</span> code, then enter it at checkout.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="mt-5 block w-full rounded-sm bg-[var(--color-gold)] py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] transition hover:brightness-105"
                >
                  Back to booking
                </button>
              </>
            ) : codeStatus === "not_found" ? (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  We don't have a previous booking on file for that email.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you booked via Airbnb or VRBO, email us at{" "}
                  <a href="mailto:vacation@seaandcityrentals.com" className="font-medium text-foreground underline-offset-2 hover:underline">
                    vacation@seaandcityrentals.com
                  </a>{" "}
                  and we'll sort it out.
                </p>
                <button
                  type="button"
                  onClick={() => setCodeStatus("idle")}
                  className="mt-4 text-xs text-[var(--color-deep)] underline-offset-2 hover:underline"
                >
                  ← Try a different email
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-muted-foreground">Enter your email and we'll send the code straight to your inbox.</p>
                <form
                  className="mt-4 flex flex-col gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCodeStatus("loading");
                    try {
                      const res = await fetch("/api/public/returning-guest-code", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: codeEmail }),
                      });
                      if (res.ok) {
                        const data = await res.json() as { ok?: boolean; notFound?: boolean };
                        setCodeStatus(data.notFound ? "not_found" : "done");
                      } else {
                        setCodeStatus("error");
                      }
                    } catch {
                      setCodeStatus("error");
                    }
                  }}
                >
                  <input
                    type="email"
                    required
                    value={codeEmail}
                    onChange={(e) => setCodeEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-deep)]"
                  />
                  <button
                    type="submit"
                    disabled={codeStatus === "loading"}
                    className="rounded-sm bg-[var(--color-gold)] py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] transition hover:brightness-105 disabled:opacity-60"
                  >
                    {codeStatus === "loading" ? "Checking…" : "Send me my code"}
                  </button>
                  {codeStatus === "error" && (
                    <p className="text-xs text-red-600">Something went wrong — please try again.</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">By submitting you agree to receive property updates and promotions. Unsubscribe anytime.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5th-night upsell modal — slow season only (Aug–Jan, ex Christmas/New Year) */}
      {showUpsellModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDismissedForRange(rangeKey)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">
              Slow-season deal
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--color-deep)]">
              Stay one more night?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Extend to 5 nights and your{" "}
              <span className="font-semibold text-foreground">{fifthNightLabel}</span> night is{" "}
              <span className="font-semibold text-foreground">35% off</span>
              {fifthNightBasePrice > 0 && (
                <>
                  {" "}— just{" "}
                  <span className="font-semibold text-[var(--color-deep)]">
                    ${fifthNightDiscountedPrice}
                  </span>{" "}
                  instead of ${fifthNightBasePrice}
                </>
              )}
              .
            </p>
            {fifthNightSavings > 0 && (
              <p className="mt-1 text-xs font-medium text-[var(--color-sea)]">
                You save ${fifthNightSavings} {currency}
              </p>
            )}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={acceptUpsell}
                className="block w-full rounded-sm bg-[var(--color-gold)] py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow transition hover:brightness-105"
              >
                {fifthNightSavings > 0
                  ? `Add the 5th night · Save $${fifthNightSavings}`
                  : "Add the 5th night · 35% off"}
              </button>
              <button
                type="button"
                onClick={() => setDismissedForRange(rangeKey)}
                className="block w-full py-2 text-center text-xs text-muted-foreground transition hover:text-foreground"
              >
                No thanks, keep 4 nights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
