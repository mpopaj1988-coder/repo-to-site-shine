import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import type { CalendarDay } from "@/lib/hospitable.functions";
import { track } from "@/lib/analytics";
import { BookingModal } from "./BookingModal";

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

export function AvailabilityChecker({
  calendar,
  propertySlug,
  propertyName,
  hospitableId,
}: {
  calendar: CalendarDay[];
  propertySlug?: string;
  propertyName: string;
  hospitableId?: string;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Build lookup structures for availability and pricing
  const { unavailableSet, blockStartSet, priceByDate, currency, minDate, firstAvailableDate, hasAnyAvailable } =
    useMemo(() => {
      const unavail = new Set<string>();
      const blockStart = new Set<string>(); // first day of each unavailable block = valid checkout date
      const priceMap: Record<string, number> = {};
      let cur = "USD";
      let earliest: Date | undefined;
      let firstAvail: Date | undefined;
      let prevAvail = true;
      for (const d of calendar) {
        if (!d.date) continue;
        if (!earliest) earliest = parseYmd(d.date);
        if (!d.available) {
          unavail.add(d.date);
          if (prevAvail) blockStart.add(d.date); // same-day turnover: guests can check out on this date
        } else if (!firstAvail) {
          firstAvail = parseYmd(d.date);
        }
        if (typeof d.price === "number") priceMap[d.date] = d.price;
        cur = d.currency;
        prevAvail = d.available;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        unavailableSet: unavail,
        blockStartSet: blockStart,
        priceByDate: priceMap,
        currency: cur,
        minDate: earliest ?? today,
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

  const canReserve = range?.from && range?.to && nights > 0 && !hasUnavailable;

  const fromLabel = range?.from?.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const toLabel = range?.to?.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (!calendar.length) {
    // No calendar data (API key missing) — render nothing; the existing fallback CTA covers it.
    return null;
  }

  return (
    <>
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

        {showCalendar && (
          <div className="mt-3 rounded-sm border border-border bg-background p-2">
            {hasAnyAvailable ? (
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                disabled={(date) => {
                  if (date < minDate) return true;
                  const key = ymd(date);
                  if (!unavailableSet.has(key)) return false;
                  // Allow block-start dates as checkout (same-day turnover).
                  return !blockStartSet.has(key);
                }}
                startMonth={minDate}
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
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{nights} {nights === 1 ? "night" : "nights"}</span>
              {total > 0 && (
                <span className="font-semibold text-[var(--color-deep)]">
                  ${total} {currency}
                </span>
              )}
            </div>
            {hasUnavailable && (
              <p className="text-xs text-red-600">
                Some dates in this range aren't available. Try different dates.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          data-testid="availability-reserve-btn"
          onClick={() => {
            if (!canReserve) {
              setShowCalendar(true);
              return;
            }
            track("reserve_click", {
              property: propertySlug,
              nights,
              total,
              currency,
              check_in: range?.from ? ymd(range.from) : undefined,
              check_out: range?.to ? ymd(range.to) : undefined,
            });
            setShowModal(true);
          }}
          className="mt-4 block w-full rounded-sm bg-[var(--color-gold)] py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow transition hover:brightness-105"
        >
          {canReserve ? `Reserve · ${nights} ${nights === 1 ? "night" : "nights"}` : "Select dates to reserve"}
        </button>
      </div>

      {showModal && canReserve && range?.from && range?.to && (
        <BookingModal
          propertySlug={propertySlug ?? ""}
          propertyName={propertyName}
          hospitableId={hospitableId}
          checkIn={ymd(range.from)}
          checkOut={ymd(range.to)}
          nights={nights}
          total={total}
          currency={currency}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
