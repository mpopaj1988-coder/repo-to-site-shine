import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SITE_URL } from "@/data/properties";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sea & City Rentals — Talk Directly with Your Host" },
      { name: "description", content: "Get in touch with Sea & City Rentals. Direct line to your host for custom requests, special occasions and extended stays in Florida." },
      { property: "og:title", content: "Contact — Sea & City Rentals" },
      { property: "og:description", content: "Talk directly to us — no platforms, no bots." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <Layout>
      <section className="bg-[var(--color-deep)] pb-16 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">Get in Touch</p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">Talk to a real person</h1>
          <p className="mt-4 max-w-xl text-white/75">No bots, no delays. Reach out for custom requests, special occasions, extended stays — or just to ask which property is right for your trip.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Book direct</h2>
            <p className="mt-3 text-sm text-muted-foreground">Skip the platform fees and unlock the returning-guest discount.</p>
            <Link
              to="/properties"
              onClick={() => track("book_direct_click", { surface: "contact_book" })}
              data-testid="contact-book-direct"
              className="mt-6 inline-block rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)]"
            >Browse properties →</Link>
          </div>
          <div className="rounded-md border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Have a question?</h2>
            <p className="mt-3 text-sm text-muted-foreground">Send a message through our booking site and we&apos;ll get right back to you — usually within the hour.</p>
            <a
              href="mailto:mpopaj1988@gmail.com"
              onClick={() => track("inquiry_click", { surface: "contact_message" })}
              data-testid="contact-inquiry"
              className="mt-6 inline-block rounded-sm border border-[var(--color-deep)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] hover:bg-[var(--color-deep)] hover:text-white"
            >Send a message →</a>
          </div>
        </div>
      </section>
    </Layout>
  );
}