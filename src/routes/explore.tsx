import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { guides } from "@/data/guides";
import { properties, type Property, SITE_URL } from "@/data/properties";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Tampa Bay — Neighborhood Guides | Sea & City Rentals" },
      {
        name: "description",
        content:
          "Local guides to Tampa, St. Petersburg and Clearwater Beach — where to eat, what to do and how to get around, written by your Sea & City Rentals hosts.",
      },
      { property: "og:title", content: "Explore Tampa Bay — Sea & City Rentals" },
      {
        property: "og:description",
        content: "Neighborhood guides for Tampa, St. Pete and Clearwater Beach.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/explore` }],
  }),
  component: ExplorePage,
});

// Same reverse mapping used on the guide page — keep in sync.
const GUIDE_TO_LOCATIONS: Record<string, string[]> = {
  tampa: ["Tampa"],
  "st-petersburg": ["St. Petersburg"],
  "clearwater-beach": ["Clearwater", "Largo", "Indian Rocks Beach"],
};

function topStayForGuide(slug: string): Property | null {
  const locs = GUIDE_TO_LOCATIONS[slug] ?? [];
  const matches = properties.filter((p) => locs.includes(p.location.split(",")[0].trim()));
  if (matches.length === 0) return null;
  // Most-reviewed first; ties broken by rating.
  return [...matches].sort((a, b) => b.reviews - a.reviews || b.rating - a.rating)[0];
}

function ExplorePage() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return (
    <Layout>
      <section className="bg-[var(--color-deep)] pb-16 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
            Explore Tampa Bay
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
            Neighborhood guides
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Local picks, drive times and the spots we send our own friends — straight from the hosts
            who live here.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-3 lg:px-10">
        {guides.map((g) => {
          const topStay = topStayForGuide(g.slug);
          return (
            <div
              key={g.slug}
              className="group flex flex-col overflow-hidden rounded-md bg-card shadow-sm ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link
                to="/explore/$slug"
                params={{ slug: g.slug }}
                data-testid={`explore-card-${g.slug}`}
                className="block"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={g.hero}
                    alt={g.heroAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">
                    Neighborhood Guide
                  </p>
                  <h2 className="mt-2 font-display text-2xl">{g.city}</h2>
                  <p className="mt-2 font-display text-sm italic text-muted-foreground">
                    {g.tagline}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {g.intro.split(". ").slice(0, 2).join(". ")}.
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)]">
                    Read guide →
                  </p>
                </div>
              </Link>

              {topStay ? (
                <Link
                  to="/listings/$slug"
                  params={{ slug: topStay.slug }}
                  onClick={() =>
                    track("top_stay_click", {
                      surface: `explore_card_${g.slug}`,
                      property: topStay.slug,
                    })
                  }
                  data-testid={`explore-card-${g.slug}-top-stay`}
                  className="flex items-center gap-4 border-t border-border bg-[var(--color-sand)] px-6 py-4 transition hover:bg-[var(--color-shell,#ede8de)]"
                >
                  <div className="size-14 shrink-0 overflow-hidden rounded-sm">
                    <img
                      src={topStay.image}
                      alt={topStay.imageAlts?.[0] ?? topStay.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[var(--color-gold)]">
                      Top stay in {g.city}
                    </p>
                    <p className="mt-1 truncate font-display text-sm text-foreground">
                      {topStay.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {topStay.reviews > 0
                        ? `★ ${topStay.rating.toFixed(2)} · ${topStay.reviews} reviews`
                        : topStay.location}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)]"
                  >
                    →
                  </span>
                </Link>
              ) : null}
            </div>
          );
        })}
      </section>
    </Layout>
  );
}
