import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { PropertyMap } from "@/components/site/PropertyMap";
import { properties, SITE_URL } from "@/data/properties";
import { getListingPricing, type Pricing } from "@/lib/hospitable.functions";

export const Route = createFileRoute("/map")({
  staleTime: 5 * 60 * 1000,
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
  head: () => {
    const title = "Florida Vacation Rentals Map — Sea & City Rentals";
    const description =
      "Explore all 9 Sea & City Rentals on an interactive map of Tampa Bay, St. Petersburg, Clearwater, Largo and Indian Rocks Beach.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/map` }],
    };
  },
  component: MapPage,
});

function MapPage() {
  const { pricingMap } = Route.useLoaderData();
  return (
    <Layout>
      <section className="bg-[var(--color-deep)] pb-12 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
            Find Your Stay
          </p>
          <h1
            data-testid="map-page-heading"
            className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl"
          >
            Our properties, mapped
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Drop a pin and see how close you are to the beach. All 9 Sea &amp; City Rentals across
            Tampa Bay, St. Petersburg, Clearwater, Largo and Indian Rocks Beach.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <PropertyMap pricingMap={pricingMap} />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Tip: tap any pin to preview the property — click through to see photos, amenities and book direct.
        </p>
      </section>
    </Layout>
  );
}
