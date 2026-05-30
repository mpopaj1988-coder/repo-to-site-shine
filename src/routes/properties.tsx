import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties, BOOK_DIRECT_URL, SITE_URL } from "@/data/properties";
import { getListingPricing, type Pricing } from "@/lib/hospitable.functions";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/properties")({
  loader: async () => {
    const pricingMap: Record<string, Pricing> = {};
    await Promise.all(
      properties
        .filter((p) => p.hospitableId)
        .map(async (p) => {
          try {
            pricingMap[p.slug] = await getListingPricing({ data: { id: p.hospitableId! } });
          } catch {
            pricingMap[p.slug] = null;
          }
        }),
    );
    return { pricingMap };
  },
  head: () => ({
    meta: [
      { title: "Florida Vacation Rentals — Sea & City Rentals" },
      {
        name: "description",
        content:
          "Browse all 9 Sea & City Rentals properties across Tampa, St. Petersburg, Clearwater, Largo and Indian Rocks Beach. Book direct to skip Airbnb fees.",
      },
      { property: "og:title", content: "Our Properties — Sea & City Rentals" },
      { property: "og:description", content: "Hand-picked Florida vacation rentals — book direct & save." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/properties` }],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const { pricingMap } = Route.useLoaderData();
  return (
    <Layout>
      <section className="bg-[var(--color-deep)] pb-16 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
            Our Properties
          </p>
          <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">
            All 9 rentals
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            From waterfront pool homes to beachside hot-tub condos and downtown St. Pete retreats —
            find the right space for your trip.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => (
            <PropertyCard key={p.slug} p={p} pricing={pricingMap[p.slug]} priority={i < 3} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <a
            href={BOOK_DIRECT_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("book_direct_click", { surface: "properties_page" })}
            data-testid="properties-book-direct"
            className="inline-block rounded-sm bg-[var(--color-gold)] px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow-md hover:brightness-105"
          >
            See full availability
          </a>
        </div>
      </section>
    </Layout>
  );
}