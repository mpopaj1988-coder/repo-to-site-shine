import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";
import { Layout } from "@/components/site/Layout";
import { PHONE } from "@/data/properties";

export const Route = createFileRoute("/book/success")({
  head: () => ({
    meta: [
      { title: "Booking Confirmed — Sea & City Rentals" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-[var(--color-sea)]" strokeWidth={1.5} />
        </div>

        <h1 className="font-display mt-6 text-4xl font-semibold text-[var(--color-deep)]">
          Booking confirmed!
        </h1>

        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Your payment was successful and your reservation is confirmed.
          Check your email for a booking confirmation with all the details.
        </p>

        <div className="mt-8 rounded-sm bg-[var(--color-sand)] p-6 text-left space-y-2">
          <p className="text-sm font-semibold text-[var(--color-deep)]">What's next?</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>• A confirmation email is on its way to your inbox.</li>
            <li>• We'll send check-in instructions a few days before your arrival.</li>
            <li>
              • Questions? Call or text us at{" "}
              <a href={`tel:${PHONE}`} className="text-[var(--color-sea)] underline">
                {PHONE}
              </a>
              .
            </li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-sm bg-[var(--color-gold)] px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow hover:brightness-105 transition"
          >
            Back to home
          </Link>
          <Link
            to="/properties"
            className="rounded-sm border border-border px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-foreground hover:border-[var(--color-deep)] transition"
          >
            Explore more properties
          </Link>
        </div>
      </div>
    </Layout>
  );
}
