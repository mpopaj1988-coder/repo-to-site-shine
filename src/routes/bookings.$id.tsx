import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { Layout } from "@/components/site/Layout";
import { CheckCircle, Clock, XCircle, CalendarDays, Users, CreditCard } from "lucide-react";

const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";

const getBooking = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    const supabase = createClient(SUPABASE_URL, serviceKey);
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        "id, status, property_slug, check_in, check_out, nights, guests, currency, total_cents, deposit_cents, balance_cents, balance_due_date, deposit_paid, balance_paid, guest_name, guest_email, hospitable_reservation_id",
      )
      .eq("id", data.id)
      .single();
    return booking ?? null;
  });

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({
    meta: [
      { title: "Booking Confirmation — Sea & City Rentals" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params }) => {
    const booking = await getBooking({ data: { id: params.id } });
    if (!booking) throw notFound();
    return { booking };
  },
  component: BookingPage,
});

function statusLabel(status: string) {
  if (status === "confirmed")
    return { icon: CheckCircle, text: "Confirmed", color: "text-green-600" };
  if (status === "cancelled") return { icon: XCircle, text: "Cancelled", color: "text-red-500" };
  return { icon: Clock, text: "Pending", color: "text-amber-500" };
}

function fmt(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function BookingPage() {
  const { booking } = Route.useLoaderData();
  const { icon: Icon, text: statusText, color } = statusLabel(booking.status as string);
  const totalDollars = (booking.total_cents as number) / 100;
  const depositDollars = (booking.deposit_cents as number) / 100;
  const balanceDollars = (booking.balance_cents as number) / 100;
  const propertyTitle = (booking.property_slug as string)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-20">
        {/* Status header */}
        <div className="mb-8 text-center">
          <Icon className={`mx-auto mb-3 h-14 w-14 ${color}`} strokeWidth={1.5} />
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">
            Booking {statusText}
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium text-[var(--color-deep)]">
            {booking.status === "confirmed"
              ? "You're all set!"
              : booking.status === "cancelled"
                ? "Booking cancelled"
                : "Payment processing…"}
          </h1>
          {booking.status === "pending" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Your payment is being processed. This page will update automatically in a moment.
            </p>
          )}
        </div>

        {/* Booking card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 border-b border-border pb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">
              Property
            </p>
            <p className="mt-1 font-display text-2xl text-[var(--color-deep)]">{propertyTitle}</p>
            <Link
              to="/listings/$slug"
              params={{ slug: booking.property_slug as string }}
              className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              View property →
            </Link>
          </div>

          {/* Dates + guests */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-sea)]" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Check-in
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {fmt(booking.check_in as string)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-sea)]" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Check-out
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {fmt(booking.check_out as string)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-sea)]" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Guests
                </p>
                <p className="text-sm font-semibold">{booking.guests}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-sea)]" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Duration
                </p>
                <p className="text-sm font-semibold">{booking.nights} nights</p>
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="rounded-sm bg-[var(--color-sand)] p-4 space-y-2">
            <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
              <CreditCard className="h-3 w-3" /> Payment
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-[var(--color-deep)]">
                ${totalDollars.toFixed(0)} {booking.currency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Deposit paid {booking.deposit_paid ? "✓" : "(pending)"}
              </span>
              <span
                className={`font-semibold ${booking.deposit_paid ? "text-green-600" : "text-amber-500"}`}
              >
                ${depositDollars.toFixed(0)}
              </span>
            </div>
            {balanceDollars > 0 && (
              <div className="flex justify-between text-sm border-t border-border/50 pt-2">
                <span className="text-muted-foreground">
                  {booking.balance_paid
                    ? "Balance paid ✓"
                    : `Balance due ${booking.balance_due_date}`}
                </span>
                <span
                  className={`font-semibold ${booking.balance_paid ? "text-green-600" : "text-[var(--color-deep)]"}`}
                >
                  ${balanceDollars.toFixed(0)}
                </span>
              </div>
            )}
          </div>

          {balanceDollars > 0 && !booking.balance_paid && (
            <p className="mt-3 text-xs text-muted-foreground">
              Your card on file will be automatically charged on {booking.balance_due_date}. No
              action needed.
            </p>
          )}
        </div>

        {/* Reference */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Booking ID: <span className="font-mono">{booking.id as string}</span>
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          A confirmation email was sent to {booking.guest_email || "the email you provided"}.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/"
            className="rounded-sm border border-border px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)] hover:bg-[var(--color-sand)]"
          >
            Back to home
          </Link>
          <Link
            to="/listings/$slug"
            params={{ slug: booking.property_slug as string }}
            className="rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)] shadow hover:brightness-105"
          >
            View property
          </Link>
        </div>
      </div>
    </Layout>
  );
}
