import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import sunset from "@/assets/sunset-beach.jpg?format=webp&quality=80&w=1920&as=url";
import { SITE_URL } from "@/data/properties";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Sea & City Rentals — Hosted with Heart by Nella" },
      {
        name: "description",
        content:
          "Meet Nella — host of Sea & City Rentals. Personally managing 9 vacation rentals across Tampa Bay and the Florida Gulf Coast for over 5 years.",
      },
      { property: "og:title", content: "About Sea & City Rentals" },
      { property: "og:description", content: "Hosted with heart — meet Nella." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Layout>
      <section className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
        <img
          src={sunset}
          alt="Florida Gulf Coast beach at sunset"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 to-black/65" />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center text-white">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-[var(--color-gold)]">
              About Us
            </p>
            <h1 className="mt-5 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
              Hosted with heart
            </h1>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 font-display text-2xl italic text-foreground">
          “Hosting isn&apos;t just about providing a rental — it&apos;s about creating the perfect
          setting for someone&apos;s best memories.”
        </blockquote>
        <p className="mt-8 text-lg text-muted-foreground">
          I&apos;m Nella, founder of Sea &amp; City Rentals, and I personally manage all nine of our
          properties across Tampa Bay. What started as a passion for creating welcoming spaces has
          grown into a portfolio spanning St. Pete, Clearwater, Indian Rocks Beach, Tampa, Largo,
          and Palm Harbor.
        </p>
        <p className="mt-5 text-lg text-muted-foreground">
          I love hosting because every guest who walks through our doors gets the same attention to
          detail and care I&apos;d want for my own family — whether it&apos;s a beachfront escape, a
          cozy retreat, or a home base for exploring the Gulf Coast. For me, hosting isn&apos;t just
          about providing a rental; it&apos;s about creating the perfect setting for someone&apos;s
          best memories.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/properties"
            className="rounded-sm border border-[var(--color-deep)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] hover:bg-[var(--color-deep)] hover:text-white"
          >
            View Properties
          </Link>
          <Link
            to="/properties"
            onClick={() => track("book_direct_click", { surface: "about_page" })}
            data-testid="about-book-direct"
            className="rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)]"
          >
            Book Direct
          </Link>
        </div>
      </section>
    </Layout>
  );
}
