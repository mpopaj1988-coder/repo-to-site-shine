import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { properties, SITE_URL } from "@/data/properties";
import { RealReviews } from "@/components/site/RealReviews";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Guest Reviews — Sea & City Rentals" },
      {
        name: "description",
        content:
          "Read what guests say about staying at Sea & City Rentals across Tampa, Indian Rocks Beach and St. Petersburg, Florida.",
      },
      { property: "og:title", content: "Guest Reviews — Sea & City Rentals" },
      {
        property: "og:description",
        content: "Real guest reviews from across our Florida portfolio.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/reviews` }],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const total = properties.reduce((s, p) => s + p.reviews, 0);
  return (
    <Layout>
      <section className="bg-[var(--color-deep)] pb-16 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
            Guest Reviews
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
            What our guests say
          </h1>
          <p className="mt-4 text-white/75">
            {total.toLocaleString()}+ verified reviews across our 9 Florida properties.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <RealReviews limit={24} />
      </section>
    </Layout>
  );
}
