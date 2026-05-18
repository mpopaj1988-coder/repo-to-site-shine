import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { guides, guideBySlug, type Guide } from "@/data/guides";
import { SITE_URL, BOOK_DIRECT_URL } from "@/data/properties";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/explore/$slug")({
  loader: ({ params }) => {
    const g = guideBySlug(params.slug);
    if (!g) throw notFound();
    return { guide: g };
  },
  head: ({ loaderData }) => {
    const g = loaderData?.guide;
    if (!g) return { meta: [{ title: "Neighborhood Guide — Sea & City Rentals" }] };
    const title = `${g.city} ${g.state} Travel Guide — ${g.tagline} | Sea & City Rentals`;
    const description = g.intro.slice(0, 158);
    const url = `${SITE_URL}/explore/${g.slug}`;
    const allAttractionNames = g.sections.flatMap((s) => s.items.map((i) => i.name));
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: g.hero },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            "@id": `${url}#destination`,
            name: `${g.city}, ${g.state}`,
            description: g.intro,
            image: g.hero,
            url,
            touristType: ["Vacationers", "Families", "Couples"],
            includesAttraction: allAttractionNames.map((d) => ({
              "@type": "TouristAttraction",
              name: d,
            })),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-4xl">Guide not found</h1>
        <Link to="/explore" className="mt-6 inline-block text-[var(--color-sea)] underline">
          Back to all guides
        </Link>
      </div>
    </Layout>
  ),
  component: GuidePage,
});

function slugifyHeading(heading: string) {
  return heading
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function GuidePage() {
  const { guide: g } = Route.useLoaderData() as { guide: Guide };
  const others = guides.filter((x) => x.slug !== g.slug);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[460px] w-full overflow-hidden">
        <img
          src={g.hero}
          alt={g.heroAlt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/40 to-black/75" />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-end px-6 pb-16 pt-28 text-center text-white">
          <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-[var(--color-gold)]">
            Neighborhood Guide
          </p>
          <h1
            data-testid="guide-heading"
            className="mt-5 font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl"
          >
            {g.city}, <span className="italic text-white/90">{g.state}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-[15px] leading-relaxed text-white/90 sm:text-lg">
            {g.tagline}
          </p>
        </div>
      </section>

      {/* SECTION NAV */}
      <nav
        aria-label="Guide sections"
        className="sticky top-[var(--nav-h,64px)] z-30 border-b border-border bg-background/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground lg:px-10">
          {g.sections.map((s) => (
            <a
              key={s.heading}
              href={`#${slugifyHeading(s.heading)}`}
              data-testid={`guide-${g.slug}-nav-${slugifyHeading(s.heading)}`}
              className="hover:text-[var(--color-deep)]"
            >
              {s.heading}
            </a>
          ))}
        </div>
      </nav>

      {/* INTRO */}
      <section className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
        <p className="text-lg leading-relaxed text-foreground">{g.intro}</p>

        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Known for</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {g.knownFor.map((k) => (
            <li key={k} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-[7px] inline-block size-1.5 rounded-full bg-[var(--color-gold)]" />
              {k}
            </li>
          ))}
        </ul>
      </section>

      {/* SECTIONS (rich, with item cards + tip) */}
      {g.sections.map((s, idx) => {
        const alt = idx % 2 === 1;
        const sectionId = slugifyHeading(s.heading);
        return (
          <section
            key={s.heading}
            id={sectionId}
            data-testid={`guide-${g.slug}-section-${sectionId}`}
            className={`scroll-mt-32 ${alt ? "border-y border-border bg-[var(--color-sand)]" : ""}`}
          >
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">
                {s.heading}
              </p>
              <h2 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
                {g.city}&apos;s {s.heading}
              </h2>

              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {s.items.map((it) => (
                  <article
                    key={it.name}
                    data-testid={`guide-${g.slug}-${sectionId}-item-${slugifyHeading(it.name)}`}
                    className="rounded-md bg-background p-6 shadow-sm ring-1 ring-border"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-gold)]">
                      {it.type}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-medium text-foreground">
                      {it.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {it.desc}
                    </p>
                    {it.detail ? (
                      <p className="mt-4 text-xs font-medium text-[var(--color-deep)]">
                        {it.detail}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>

              {s.tip ? (
                <div className="mt-10 rounded-md bg-[var(--color-deep)] p-6 text-white sm:p-8">
                  <p className="font-display text-lg text-[var(--color-gold)]">{s.tip.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{s.tip.body}</p>
                </div>
              ) : null}
            </div>
          </section>
        );
      })}

      {/* DRIVE TIMES */}
      <section className="border-t border-border bg-[var(--color-deep)] text-white">
        <div className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-gold)]">
            From {g.city}
          </p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Getting around
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {g.driveTimes.map((d) => (
              <li
                key={d.label}
                className="rounded-md border border-white/10 bg-white/5 p-4"
              >
                <p className="font-display text-3xl text-[var(--color-gold)]">{d.minutes}</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">min drive</p>
                <p className="mt-2 text-sm text-white/85">{d.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">
          Stay nearby
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Find your perfect base in {g.city}
        </h2>
        <p className="mt-4 text-muted-foreground">
          Book direct with us and save up to 15% on any of our nine Tampa Bay properties.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/properties"
            data-testid={`guide-${g.slug}-view-properties`}
            className="rounded-sm border border-[var(--color-deep)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] hover:bg-[var(--color-deep)] hover:text-white"
          >
            View Properties
          </Link>
          <a
            href={BOOK_DIRECT_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("book_direct_click", { surface: `guide_${g.slug}` })}
            data-testid={`guide-${g.slug}-book-direct`}
            className="rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)]"
          >
            Book Direct
          </a>
        </div>
      </section>

      {/* OTHER GUIDES */}
      <section className="border-t border-border bg-[var(--color-sand)]">
        <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
          <h2 className="font-display text-2xl font-medium tracking-tight">Other guides</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                to="/explore/$slug"
                params={{ slug: o.slug }}
                data-testid={`guide-${g.slug}-other-${o.slug}`}
                className="group relative block aspect-[16/9] overflow-hidden rounded-md"
              >
                <img
                  src={o.hero}
                  alt={o.heroAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-deep)]/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)]">
                    Neighborhood Guide
                  </p>
                  <h3 className="mt-2 font-display text-2xl">{o.city}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
