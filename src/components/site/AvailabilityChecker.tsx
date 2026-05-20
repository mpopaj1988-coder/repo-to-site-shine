import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import type { CalendarDay } from "@/lib/hospitable.functions";
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

export function AvailabilityChecker({
  bookingUrl,
  calendar,
  propertySlug,
}: {
  bookingUrl: string;
  calendar: CalendarDay[];
  propertySlug?: string;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Build map of unavailable date strings for quick lookup
  const { unavailableDates, priceByDate, currency, minDate } = useMemo(() => {
    const unavailable: Date[] = [];
    const priceMap: Record<string, number> = {};
    let cur = "USD";
    let earliest: Date | undefined;
    for (const d of calendar) {
      if (!d.date) continue;
      if (!earliest) earliest = parseYmd(d.date);
      if (!d.available) unavailable.push(parseYmd(d.date));
      if (typeof d.price === "number") priceMap[d.date] = d.price;
      cur = d.currency;
    }
    return {
      unavailableDates: unavailable,
      priceByDate: priceMap,
      currency: cur,
      minDate: earliest ?? new Date(),
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
      const dayPrice = priceByDate[key];
      const isUnavailable = unavailableDates.some(
        (u) => ymd(u) === key,
      );
      if (isUnavailable) bad = true;
      if (typeof dayPrice === "number") sum += dayPrice;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { nights: n, total: Math.round(sum), hasUnavailable: bad };
  }, [range, unavailableDates, priceByDate]);

  const canReserve = range?.from && range?.to && nights > 0 && !hasUnavailable;

  const reserveHref = useMemo(() => {
    if (!range?.from || !range?.to) return bookingUrl;
    const url = new URL(bookingUrl);
    url.searchParams.set("check_in", ymd(range.from));
    url.searchParams.set("check_out", ymd(range.to));
    return url.toString();
  }, [range, bookingUrl]);

  const fromLabel = range?.from?.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const toLabel = range?.to?.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (!calendar.length) {
    // No calendar data (API key missing) — render nothing; the existing fallback CTA covers it.
    return null;
  }

  return (
    <div data-testid="availability-checker" className="mt-5 border-t border-border pt-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">
        Check availability
      </p>
      <button
        type="button"
        data-testid="availability-toggle"
        onClick={() => {
          setShowCalendar((s) => {
            if (!s) track("availability_opened", { property: propertySlug });
            return !s;
          });
        }}
        className="mt-3 grid w-full grid-cols-2 gap-2 rounded-sm border border-border bg-background p-2 text-left transition hover:border-[var(--color-deep)]"
      >
        <div className="rounded-sm bg-[var(--color-sand)] px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Check-in
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {fromLabel ?? "Add date"}
          </p>
        </div>
        <div className="rounded-sm bg-[var(--color-sand)] px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Check-out
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {toLabel ?? "Add date"}
          </p>
        </div>
      </button>

      {showCalendar && (
        <div className="mt-3 rounded-sm border border-border bg-background p-2">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={[{ before: minDate }, ...unavailableDates.map((d) => ({ from: d, to: d }))]}
            numberOfMonths={1}
            data-testid="availability-calendar"
          />
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

      <a
        href={reserveHref}
        target="_blank"
        rel="noreferrer"
        data-testid="availability-reserve-btn"
        aria-disabled={!canReserve}
        onClick={(e) => {
          if (!canReserve) {
            e.preventDefault();
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
        }}
        className={`mt-4 block rounded-sm py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] shadow transition ${
          canReserve
            ? "bg-[var(--color-gold)] text-[var(--color-deep)] hover:brightness-105"
            : "cursor-not-allowed bg-[var(--color-gold)]/50 text-[var(--color-deep)]/60"
        }`}
      >
        {canReserve ? `Reserve · ${nights} ${nights === 1 ? "night" : "nights"}` : "Pick dates to reserve"}
      </a>
    </div>
  );
}
