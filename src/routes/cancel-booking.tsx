import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { getBookingByToken, cancelBooking, type BookingRecord } from "@/lib/bookings.functions";

const REFUND_WINDOW_DAYS = 5;

function daysUntil(checkIn: string): number {
  const checkinMs = new Date(checkIn).setHours(0, 0, 0, 0);
  const todayMs = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((checkinMs - todayMs) / (1000 * 60 * 60 * 24));
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

export const Route = createFileRoute("/cancel-booking")({
  validateSearch: (search: Record<string, string>) => ({
    token: search.token ?? "",
  }),
  head: () => ({
    meta: [
      { title: "Cancel Booking — Sea & City Rentals" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CancelBookingPage,
});

type Phase = "loading" | "not-found" | "already-cancelled" | "confirm" | "cancelling" | "done" | "error";

function CancelBookingPage() {
  const { token } = Route.useSearch();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<{ refunded: boolean; refundAmount: string | null } | null>(null);

  useEffect(() => {
    if (!token) { setPhase("not-found"); return; }
    getBookingByToken({ data: { token } })
      .then((b) => {
        if (!b) { setPhase("not-found"); return; }
        setBooking(b);
        setPhase(b.status === "cancelled" ? "already-cancelled" : "confirm");
      })
      .catch(() => setPhase("not-found"));
  }, [token]);

  async function handleCancel() {
    setPhase("cancelling");
    try {
      const res = await cancelBooking({ data: { token } });
      if (res.ok) {
        setResult({ refunded: res.refunded, refundAmount: res.refundAmount });
        setPhase("done");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-xl px-6 py-32 lg:px-8">

        {phase === "loading" && (
          <div className="text-center text-muted-foreground">Loading your booking…</div>
        )}

        {phase === "not-found" && (
          <div className="rounded-md border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">
              Cancel Booking
            </p>
            <h1 className="mt-4 font-display text-3xl font-medium text-foreground">
              Link not found
            </h1>
            <p className="mt-4 text-muted-foreground">
              This cancellation link is invalid or has already been used. If you need
              help, contact us directly.
            </p>
            <Link to="/contact" className="mt-6 inline-block text-sm font-semibold text-[var(--color-deep)] underline-offset-4 hover:underline">
              Contact us →
            </Link>
          </div>
        )}

        {phase === "already-cancelled" && booking && (
          <div className="rounded-md border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">
              Already Cancelled
            </p>
            <h1 className="mt-4 font-display text-3xl font-medium text-foreground">
              This booking was already cancelled
            </h1>
            <p className="mt-4 text-muted-foreground">
              {booking.property_title} · {fmtDate(booking.check_in)} → {fmtDate(booking.check_out)}
            </p>
            <Link to="/properties" className="mt-6 inline-block text-sm font-semibold text-[var(--color-deep)] underline-offset-4 hover:underline">
              Browse properties →
            </Link>
          </div>
        )}

        {(phase === "confirm" || phase === "cancelling") && booking && (() => {
          const days = daysUntil(booking.check_in);
          const eligible = days >= REFUND_WINDOW_DAYS;
          return (
            <div className="rounded-md border border-border bg-card p-8 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">
                Cancel Booking
              </p>
              <h1 className="mt-4 font-display text-3xl font-medium text-foreground">
                {booking.property_title}
              </h1>
              <div className="mt-5 space-y-2 rounded-sm bg-[var(--color-sand)] p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{fmtDate(booking.check_in)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{fmtDate(booking.check_out)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nights</span>
                  <span className="font-medium">{booking.nights}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Total paid</span>
                  <span className="font-semibold text-[var(--color-deep)]">
                    ${booking.total_amount.toFixed(0)} {booking.currency.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className={`mt-5 rounded-sm p-4 text-sm ${eligible ? "border border-emerald-200 bg-emerald-50" : "border border-border bg-muted/40"}`}>
                <p className="font-semibold text-foreground">
                  {eligible
                    ? `✓ Eligible for a full refund — you're cancelling ${days} day${days !== 1 ? "s" : ""} before check-in`
                    : `✗ No refund — check-in is in ${days} day${days !== 1 ? "s" : ""} (less than ${REFUND_WINDOW_DAYS})`}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Cancellation policy: 100% refund if cancelled {REFUND_WINDOW_DAYS}+ days before arrival.
                  No refund within {REFUND_WINDOW_DAYS} days of check-in.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={phase === "cancelling"}
                  onClick={handleCancel}
                  className="flex-1 rounded-sm border border-red-600 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                >
                  {phase === "cancelling" ? "Processing…" : "Confirm cancellation"}
                </button>
                <Link
                  to="/listings/$slug"
                  params={{ slug: booking.property_slug }}
                  className="flex-1 rounded-sm border border-border py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                >
                  Keep my booking
                </Link>
              </div>
            </div>
          );
        })()}

        {phase === "done" && booking && (
          <div className="rounded-md border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">
              Booking Cancelled
            </p>
            <h1 className="mt-4 font-display text-3xl font-medium text-foreground">
              Your booking has been cancelled
            </h1>
            <p className="mt-4 text-muted-foreground">
              {booking.property_title} · {fmtDate(booking.check_in)} → {fmtDate(booking.check_out)}
            </p>
            {result?.refunded ? (
              <div className="mt-6 rounded-sm bg-emerald-50 px-6 py-4 text-sm">
                <p className="font-semibold text-emerald-700">
                  Full refund of {result.refundAmount} issued
                </p>
                <p className="mt-1 text-emerald-600">
                  Allow 5–10 business days to appear on your statement.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-sm bg-muted/40 px-6 py-4 text-sm text-muted-foreground">
                No refund was issued per our cancellation policy.
              </div>
            )}
            <p className="mt-4 text-sm text-muted-foreground">A confirmation has been sent to your email.</p>
            <Link
              to="/properties"
              className="mt-6 inline-block text-sm font-semibold text-[var(--color-deep)] underline-offset-4 hover:underline"
            >
              Browse properties →
            </Link>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-md border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="font-display text-3xl font-medium text-foreground">Something went wrong</h1>
            <p className="mt-4 text-muted-foreground">
              We couldn't process your cancellation. Please contact us and we'll handle it for you.
            </p>
            <Link to="/contact" className="mt-6 inline-block text-sm font-semibold text-[var(--color-deep)] underline-offset-4 hover:underline">
              Contact us →
            </Link>
          </div>
        )}

      </div>
    </Layout>
  );
}
