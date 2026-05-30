import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties, BOOK_DIRECT_URL, type Category } from "@/data/properties";
import { RealReviews } from "@/components/site/RealReviews";
import { getListingPricing, type Pricing } from "@/lib/hospitable.functions";
import { getPublishedPosts } from "@/lib/blog";
import { track } from "@/lib/analytics";
import heroBeach from "@/assets/hero-beach.jpg";
import heroLargo from "@/assets/hero-largo.jpg";
import heroStpete from "@/assets/hero-stpete.jpg";
import sunset from "@/assets/sunset-beach.jpg";
import guideTampa from "@/assets/guide-tampa.jpg";
import guideStpete from "@/assets/guide-stpete.jpg";
import guideClearwater from "@/assets/guide-clearwater.jpg";

export const Route = createFileRoute("/")({
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
      {
        title:
          "Tampa Bay Vacation Rentals | Sea & City Rentals — St. Pete, Clearwater & Gulf Beaches",
      },
      {
        name: "description",
        content:
          "Luxury short-term rentals in Tampa, St. Petersburg, Clearwater, Largo and Indian Rocks Beach. Book direct with the host and save up to 15% — no Airbnb fees.",
      },
      {
        property: "og:title",
        content: "Tampa Bay Vacation Rentals | Sea & City Rentals",
      },
      {
        property: "og:description",
        content:
          "Designer beach houses, waterfront homes and downtown retreats across Florida's Gulf Coast. Book direct and save up to 15%.",
      },
      { property: "og:image", content: "/og.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://www.seaandcityrentals.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          "@id": "https://www.seaandcityrentals.com/#lodgingbusiness",
          name: "Sea & City Rentals",
          description:
            "Beautifully furnished Florida vacation rentals in Tampa Bay, St. Petersburg and the Gulf Beaches.",
          url: "https://www.seaandcityrentals.com/",
          mainEntityOfPage: "https://www.seaandcityrentals.com/",
          areaServed: ["Tampa, FL", "St. Petersburg, FL", "Clearwater, FL", "Largo, FL", "Indian Rocks Beach, FL"],
        }),
      },
    ],
  }),
  component: Index,
});

const heroSlides = [
  { img: heroBeach, label: "Indian Rocks Beach, FL", caption: "Gulf Sunsets · Steps from the Sand" },
  { img: heroStpete, label: "St. Petersburg, FL", caption: "Downtown Retreat · Hot Tub Garden" },
  { img: heroLargo, label: "St. Petersburg, FL", caption: "Luxury 2BR Apartment · Downtown" },
];

const perks = [
  { icon: "💰", title: "Save up to 15%", body: "No Airbnb service fees" },
  { icon: "💬", title: "Direct Communication", body: "Talk to us, not a platform" },
  { icon: "🔁", title: "Returning Guest Discount", body: "10% off your next stay" },
  { icon: "🤝", title: "Flexible Options", body: "Custom requests welcome" },
];

const categories: Array<"All" | Category> = ["All", "Beach", "City", "Large Groups"];

function Index() {
  const { pricingMap } = Route.useLoaderData();
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5500);
    return () => clearInterval(id);
  }, []);
  const filtered =
    active === "All" ? properties : properties.filter((p) => p.categories.includes(active));
  const latestPosts = getPublishedPosts().slice(0, 3);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
        {heroSlides.map((s, i) => (
          <img
            key={i}
            src={s.img}
            alt={`${s.label} — ${s.caption}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 pb-32 pt-28 text-center text-white sm:pb-40">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--color-gold)] sm:text-[11px] sm:tracking-[0.45em]">
            Tampa Bay, Florida
          </p>
          <h1 className="mt-5 font-display text-[2.5rem] font-medium leading-[1.05] tracking-tight sm:mt-6 sm:text-6xl lg:text-7xl">
            Florida vacation rentals,<br className="hidden sm:block" />
            <span className="text-white/95"> hosted with care.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-white/85 sm:mt-7 sm:text-lg">
            Designer homes across Tampa, St. Petersburg, Clearwater and the Gulf beaches.
            Book direct with the host and save up to 15%.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <Link
              to="/properties"
              className="w-full rounded-sm border border-white/40 bg-white/10 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur transition hover:bg-white/20 sm:w-auto sm:text-xs sm:tracking-[0.25em]"
            >
              View Properties
            </Link>
            <a
              href={BOOK_DIRECT_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("book_direct_click", { surface: "home_hero" })}
              data-testid="home-hero-book-direct"
              className="w-full rounded-sm bg-[var(--color-gold)] px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-deep)] shadow-md transition hover:brightness-105 sm:w-auto sm:text-xs sm:tracking-[0.25em]"
            >
              Book Direct
            </a>
          </div>

          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-6 sm:bottom-10">
            <div className="text-center text-[10px] uppercase tracking-[0.25em] text-[var(--color-gold)] sm:text-xs">
              {heroSlides[slide].label}
              <div className="mt-1 font-display text-xs italic normal-case tracking-normal text-white/85 sm:text-sm">
                {heroSlides[slide].caption}
              </div>
            </div>
            <div className="flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Show slide ${i + 1}`}
                  className={`h-[2px] w-6 transition sm:h-[3px] sm:w-8 ${
                    i === slide ? "bg-[var(--color-gold)]" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PERKS BAR */}
      <section className="border-y border-border bg-[var(--color-sand)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {perks.map((p) => (
            <div key={p.title} className="flex items-start gap-4">
              <span className="text-2xl" aria-hidden>
                {p.icon}
              </span>
              <div>
                <p className="font-semibold text-foreground">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROPERTIES */}
      <section id="properties" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-sea)]">
              Our Rentals
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
              Where would you like to stay?
            </h2>
          </div>
          <Link
            to="/properties"
            className="text-sm font-medium text-[var(--color-deep)] underline-offset-4 hover:underline"
          >
            View all 9 properties →
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] transition ${
                active === c
                  ? "border-[var(--color-deep)] bg-[var(--color-deep)] text-white"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PropertyCard key={p.slug} p={p} pricing={pricingMap[p.slug]} priority={i < 3} />
          ))}
        </div>
      </section>

      {/* WHY BOOK DIRECT */}
      <section className="bg-[var(--color-deep)] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
              Why Book Direct?
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Skip the fees. Keep the perks.
            </h2>
            <p className="mt-6 max-w-md text-white/75">
              When you book directly with Sea &amp; City Rentals, you skip the Airbnb service fees,
              talk directly to us, and unlock exclusive perks you won&apos;t find anywhere else.
            </p>
            <a
              href={BOOK_DIRECT_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("book_direct_click", { surface: "home_why_book_direct" })}
              data-testid="home-why-book-direct"
              className="mt-8 inline-block rounded-sm bg-[var(--color-gold)] px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow-md transition hover:brightness-105"
            >
              Book Direct Now
            </a>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: "💰", t: "Save up to 15%", d: "No platform service fees added at checkout. What you see is what you pay." },
              { icon: "💬", t: "Direct Line to Us", d: "Text or call us directly. No bots, no delays — real people who care." },
              { icon: "🔁", t: "Return Guest Perk", d: "Come back and get 10% off your next stay — automatically." },
              { icon: "✨", t: "Custom Requests", d: "Early check-in, special occasions, extended stays — just ask us." },
            ].map((b) => (
              <div key={b.t} className="rounded-md border border-white/10 bg-white/5 p-6">
                <span className="text-2xl" aria-hidden>{b.icon}</span>
                <dt className="mt-3 font-display text-xl">{b.t}</dt>
                <dd className="mt-2 text-sm text-white/70">{b.d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-sea)]">
            Guest Reviews
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            What our guests say
          </h2>
        </div>
        <div className="mt-12">
          <RealReviews limit={3} />
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative overflow-hidden bg-[var(--color-sand)]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:px-10">
          <div className="relative">
            <img
              src={sunset}
              alt="Florida beach at sunset on the Gulf Coast"
              className="aspect-[4/5] w-full rounded-md object-cover shadow-xl"
              loading="lazy"
            />
            <div className="absolute -bottom-6 -right-6 hidden rounded-md bg-[var(--color-deep)] px-6 py-5 text-white shadow-lg md:block">
              <p className="font-display text-3xl">9</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">Properties</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-sea)]">
              About Us
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
              Hosted with heart
            </h2>
            <blockquote className="mt-6 border-l-2 border-[var(--color-gold)] pl-5 font-display text-xl italic text-foreground">
              “Hosting isn&apos;t just about providing a rental — it&apos;s about creating the
              perfect setting for someone&apos;s best memories.”
            </blockquote>
            <p className="mt-6 text-muted-foreground">
              I&apos;m Nella, founder of Sea &amp; City Rentals, and I personally manage all nine
              of our properties across Tampa Bay — from St. Pete and Clearwater to Indian Rocks
              Beach, Tampa, Largo, and Palm Harbor.
            </p>
            <p className="mt-4 text-muted-foreground">
              Every guest who walks through our doors gets the same attention to detail and care
              I&apos;d want for my own family — whether it&apos;s a beachfront escape, a cozy
              retreat, or a home base for exploring the Gulf Coast.
            </p>
          </div>
        </div>
      </section>

      {/* LATEST FROM THE BLOG */}
      {latestPosts.length > 0 ? (
        <section
          data-testid="home-latest-blog"
          className="border-y border-border bg-[var(--color-sand)]"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-sea)]">
                  Journal
                </p>
                <h2 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
                  Latest from the blog
                </h2>
              </div>
              <Link
                to="/blog"
                data-testid="home-latest-blog-all"
                className="hidden shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] underline-offset-4 hover:underline sm:inline-block"
              >
                All posts →
              </Link>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {latestPosts.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  onClick={() => track("home_blog_click", { post: p.slug })}
                  data-testid={`home-latest-blog-${p.slug}`}
                  className="group flex flex-col rounded-md bg-card p-6 shadow-sm ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <time className="text-[10px] font-medium uppercase tracking-[0.25em] text-[var(--color-sea)]">
                    {new Date(p.publishDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                  <h3 className="mt-3 font-display text-2xl leading-snug text-foreground group-hover:text-[var(--color-deep)]">
                    {p.title}
                  </h3>
                  {p.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {p.description}
                    </p>
                  ) : null}
                  <span className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)]">
                    Read post →
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link
                to="/blog"
                className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] underline-offset-4 hover:underline"
              >
                All posts →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* GUIDES */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-sea)]">
            Area Guides
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            Explore Tampa Bay
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { img: guideTampa, name: "Tampa", slug: "tampa", alt: "Tampa Florida waterfront downtown skyline" },
            { img: guideStpete, name: "St. Petersburg", slug: "st-petersburg", alt: "St. Petersburg Florida pier and waterfront" },
            { img: guideClearwater, name: "Clearwater Beach", slug: "clearwater-beach", alt: "Clearwater Beach Florida white sand and Gulf water with Pier 60" },
          ].map((g) => (
            <Link
              key={g.name}
              to="/explore/$slug"
              params={{ slug: g.slug }}
              data-testid={`home-guide-${g.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-md"
            >
              <img
                src={g.img}
                alt={g.alt}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-deep)]/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)]">
                  Neighborhood Guide
                </p>
                <h3 className="mt-2 font-display text-3xl">{g.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/80">
                  Explore {g.name} →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
