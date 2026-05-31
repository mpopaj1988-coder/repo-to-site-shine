import { useState } from "react";
import { X } from "lucide-react";
import { createBookingCheckout } from "@/lib/stripe.functions";

interface BookingModalProps {
  propertySlug: string;
  propertyName: string;
  hospitableId?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  currency: string;
  onClose: () => void;
}

function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function BookingModal({
  propertySlug,
  propertyName,
  hospitableId,
  checkIn,
  checkOut,
  nights,
  total,
  currency,
  onClose,
}: BookingModalProps) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = Math.round(total * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await createBookingCheckout({
        data: {
          propertySlug,
          propertyName,
          hospitableId,
          checkIn,
          checkOut,
          nights,
          totalCents,
          currency,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim().toLowerCase(),
          guestCount,
        },
      });
      window.location.href = result.url;
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-sm bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-sea)]">
            Complete your booking
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-[var(--color-deep)]">
            {propertyName}
          </h2>

          {/* Booking summary */}
          <div className="mt-4 rounded-sm bg-[var(--color-sand)] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {formatDate(checkIn)} → {formatDate(checkOut)}
              </span>
              <span className="font-semibold text-[var(--color-deep)]">
                {nights} {nights === 1 ? "night" : "nights"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-[var(--color-deep)]">
                ${total} {currency}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Full name
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Jane Smith"
                className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-[var(--color-deep)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="jane@example.com"
                className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-[var(--color-deep)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Number of guests
              </label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-[var(--color-deep)] focus:outline-none"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="rounded-sm bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-sm bg-[var(--color-gold)] py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? "Redirecting to payment…" : `Proceed to payment · $${total}`}
            </button>

            <p className="text-center text-[11px] text-muted-foreground">
              Secure payment via Stripe. No Airbnb fees.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
