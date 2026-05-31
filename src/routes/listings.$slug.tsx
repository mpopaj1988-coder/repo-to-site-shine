import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { Layout } from "@/components/site/Layout";
import { PropertyCard } from "@/components/site/PropertyCard";
import { AvailabilityChecker } from "@/components/site/AvailabilityChecker";
import { properties, BOOK_DIRECT_URL, HOSPITABLE_INQUIRY_URL, PHONE, SITE_URL, type Property } from "@/data/properties";
import { guides } from "@/data/guides";
import { Bath, BedDouble, Users, Star, MapPin, BookOpen } from "lucide-react";
import { PropertyGallery } from "@/components/site/PropertyGallery";
import { getListingPricing, getListingReviews, getListingAvailability, type Pricing, type ReviewItem, type CalendarDay } from "@/lib/hospitable.functions";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/listings/$slug")({
  loader: async ({ params }) => {
    const p = properties.find((x) => x.slug === params.slug);
    if (!p) throw notFound();
    let pricing: Pricing = null;
    let reviews: ReviewItem[] = [];
    let availability: CalendarDay[] = [];
    if (p.hospitableId) {
      const [pr, rv, av] = await Promise.all([
        getListingPricing({ data: { id: p.hospitableId } }).catch(() => null),
        getListingReviews({ data: { id: p.hospitableId } }).catch(() => [] as ReviewItem[]),
        getListingAvailability({ data: { id: p.hospitableId } }).catch(() => [] as CalendarDay[]),
      ]);
      pricing = pr;
      reviews = rv;
      availability = av;
    }
    return { property: p, pricing, reviews, availability };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.property;
    const pricing = loaderData?.pricing ?? null;
    const reviews = loaderData?.reviews ?? [];
    if (!p) return { meta: [{ title: "Listing — Sea & City Rentals" }] };
    const title = `${p.title} — ${p.location} | Sea & City Rentals`;
    const desc = `${p.tagline} ${p.description}`.slice(0, 158);
    const url = `${SITE_URL}/listings/${p.slug}`;
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const priceValidUntil = validUntil.toISOString().slice(0, 10);
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "VacationRental",
      "@id": `${url}#lodging`,
      name: p.title,
      description: p.longDescription,
      image: p.images,
      address: { "@type": "PostalAddress", addressLocality: p.location.split(",")[0].trim(), addressRegion: "FL", addressCountry: "US" },
      geo: p.lat && p.lng ? { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } : undefined,
      telephone: PHONE,
      url,
      mainEntityOfPage: url,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      provider: { "@id": `${SITE_URL}/#organization` },
      brand: { "@type": "Brand", name: "Sea & City Rentals" },
      containsPlace: {
        "@type": "Accommodation",
        additionalType: "https://schema.org/EntirePlace",
        numberOfBedrooms: p.bedrooms,
        numberOfBathroomsTotal: p.bathrooms,
        occupancy: { "@type": "QuantitativeValue", maxValue: p.sleeps },
        amenityFeature: p.amenities.map((a) => ({
          "@type": "LocationFeatureSpecification",
          name: a,
          value: true,
        })),
      },
      numberOfRooms: p.bedrooms,
      occupancy: { "@type": "QuantitativeValue", maxValue: p.sleeps },
      amenityFeature: p.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a })),
      aggregateRating: p.reviews > 0 ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews } : undefined,
      review: reviews.length > 0
        ? reviews.map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            author: { "@type": "Person", name: "Verified guest" },
            datePublished: r.date,
            reviewBody: r.text.length > 500 ? r.text.slice(0, 497) + "…" : r.text,
          }))
        : undefined,
    };
    if (pricing) {
      ld.priceRange = `$${pricing.min}-$${pricing.max}`;
      ld.makesOffer = {
        "@type": "Offer",
        "@id": `${url}#offer`,
        name: `Nightly stay at ${p.title}`,
        price: pricing.min,
        priceCurrency: pricing.currency,
        availability: "https://schema.org/InStock",
        priceValidUntil,
        url,
        priceSpecification: [
          {
            "@type": "UnitPriceSpecification",
            unitCode: "DAY",
            price: pricing.avg,
            priceCurrency: pricing.currency,
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "DAY" },
          },
          {
            "@type": "UnitPriceSpecification",
            unitCode: "WEE",
            price: pricing.avg * 7,
            priceCurrency: pricing.currency,
            referenceQuantity: { "@type": "QuantitativeValue", value: 7, unitCode: "DAY" },
          },
        ],
      };
    }
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Properties", item: `${SITE_URL}/properties` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: p.image },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: p.image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(ld),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbs),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-4xl">Listing not found</h1>
        <Link to="/properties" className="mt-6 inline-block text-[var(--color-sea)] underline">View all properties</Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
      </div>
    </Layout>
  ),
  component: ListingPage,
});

// Map property location -> neighborhood guide slug.
// Largo / Indian Rocks Beach / Clearwater all roll up to the Clearwater Beach guide;
// St. Petersburg -> st-petersburg; Tampa -> tampa.
const LOCATION_TO_GUIDE: Record<string, string> = {
  "Tampa": "tampa",
  "St. Petersburg": "st-petersburg",
  "Clearwater": "clearwater-beach",
  "Largo": "clearwater-beach",
  "Indian Rocks Beach": "clearwater-beach",
};

function guideForProperty(location: string) {
  const city = location.split(",")[0].trim();
  const slug = LOCATION_TO_GUIDE[city];
  if (!slug) return null;
  return guides.find((g) => g.slug === slug) ?? null;
}

function ListingPage() {
  const { property: p, pricing, reviews, availability } = Route.useLoaderData() as { property: Property; pricing: Pricing; reviews: ReviewItem[]; availability: CalendarDay[] };
  const bookingUrl = p.hospitableId
    ? `https://seaandcityrentals.hospitable.rentals/listings/${p.hospitableId}`
    : HOSPITABLE_INQUIRY_URL;
  useEffect(() => {
    track("listing_view", { property: p.slug, location: p.location });
  }, [p.slug, p.location]);

  const related = properties.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <Layout>
      {/* HEADER GAP */}
      <div className="bg-[var(--color-deep)] pb-6 pt-32 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Link to="/properties" className="text-[11px] uppercase tracking-[0.3em] text-white/70 hover:text-white">
            ← All properties
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[var(--color-gold)]">
                <MapPin className="size-3.5" /> {p.location}
              </p>
              <h1 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {p.title}
              </h1>
              <ul className="mt-5 flex flex-wrap gap-2">
                <li className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
                  ✦ {p.feature}
                </li>
                <li className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
                  {p.bedrooms} BR · {p.bathrooms} BA
                </li>
                <li className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
                  Sleeps {p.sleeps}
                </li>
                {p.badge && (
                  <li className="rounded-full bg-[var(--color-gold)] px-3 py-1 text-xs font-semibold text-[var(--color-deep)]">
                    {p.badge}
                  </li>
                )}
              </ul>
            </div>
            {p.reviews > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="size-4 fill-[var(--color-gold)] text-[var(--color-gold)]" />
                <span className="font-semibold">{p.rating}</span>
                <span className="text-white/60">· {p.reviews} reviews</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PHOTO GALLERY */}
      <section className="mx-auto max-w-7xl px-6 pt-8 lg:px-10">
        <PropertyGallery images={p.images} alts={p.imageAlts} propertyAlt={p.alt} />
      </section>

      {/* BODY */}
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1fr_380px] lg:px-10">
        <div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border pb-6 text-sm text-foreground">
            <span className="flex items-center gap-2"><BedDouble className="size-4 text-[var(--color-sea)]" /> {p.bedrooms} {p.bedrooms === 1 ? "Bedroom" : "Bedrooms"}</span>
            <span className="flex items-center gap-2"><Bath className="size-4 text-[var(--color-sea)]" /> {p.bathrooms} {p.bathrooms === 1 ? "Bath" : "Baths"}</span>
            <span className="flex items-center gap-2"><Users className="size-4 text-[var(--color-sea)]" /> Sleeps {p.sleeps}</span>
            <span className="flex items-center gap-2">✦ {p.feature}</span>
          </div>

          <h2 className="mt-10 font-display text-2xl font-medium tracking-tight sm:text-3xl">About this property</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{p.longDescription}</p>

          <h2 className="mt-12 font-display text-2xl font-medium tracking-tight sm:text-3xl">What makes it special</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {p.highlights.map((h) => (
              <div key={h.title} className="rounded-md border border-border bg-card p-5">
                <span className="text-2xl" aria-hidden>{h.icon}</span>
                <p className="mt-3 font-display text-lg">{h.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{h.body}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-12 font-display text-2xl font-medium tracking-tight sm:text-3xl">Amenities</h2>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {p.amenities.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-[6px] inline-block size-1.5 rounded-full bg-[var(--color-gold)]" />
                {a}
              </li>
            ))}
          </ul>

          {/* GUEST REVIEWS */}
          {reviews.length > 0 && (
            <div className="mt-12">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">Guest reviews</h2>
                {p.reviews > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star className="size-4 fill-[var(--color-gold)] text-[var(--color-gold)]" />
                    <span className="font-semibold">{p.rating}</span>
                    <span className="text-muted-foreground">· {p.reviews} reviews on Airbnb</span>
                  </div>
                )}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {reviews.map((r) => (
                  <div key={r.id} className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`size-3.5 ${n <= Math.round(r.rating) ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "fill-muted text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    {r.reviewer && (
                      <p className="text-xs font-medium text-foreground">{r.reviewer}</p>
                    )}
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-5">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEIGHBORHOOD GUIDE CTA */}
          {(() => {
            const guide = guideForProperty(p.location);
            if (!guide) return null;
            return (
              <div className="mt-14 flex flex-col gap-6 overflow-hidden rounded-md border border-border bg-card sm:flex-row sm:items-center">
                <div className="relative h-40 w-full shrink-0 sm:h-auto sm:w-56 sm:self-stretch">
                  <img
                    src={guide.hero}
                    alt={guide.heroAlt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-deep)]/60 via-transparent to-transparent" />
                </div>
                <div className="flex-1 px-6 py-5 sm:py-7 sm:pr-7">
                  <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">
                    <BookOpen className="size-3.5" /> Neighborhood Guide
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">
                    Read our {guide.city} local guide
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {guide.tagline} The spots we send our own friends — restaurants,
                    beaches, nightlife, fitness and things to do near this stay.
                  </p>
                  <Link
                    to="/explore/$slug"
                    params={{ slug: guide.slug }}
                    onClick={() => track("guide_click", { surface: `listing_${p.slug}`, guide: guide.slug })}
                    data-testid={`listing-${p.slug}-guide-link`}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] underline-offset-4 hover:underline"
                  >
                    Read the {guide.city} guide →
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* INQUIRY */}
          <div id="inquire" className="mt-14 rounded-md border border-border bg-[var(--color-sand)] p-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--color-sea)]">Ready to book?</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight">Check availability or send an inquiry</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Book direct and skip Airbnb fees. Open the booking site to view live calendar, request specific dates, or message us with questions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={HOSPITABLE_INQUIRY_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("inquiry_click", { surface: "listing_inquire_check", property: p.slug })}
                data-testid="listing-inquire-check"
                className="rounded-sm bg-[var(--color-gold)] px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow-md hover:brightness-105"
              >
                Check availability
              </a>
              <a
                href={HOSPITABLE_INQUIRY_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("inquiry_click", { surface: "listing_inquire_send", property: p.slug })}
                data-testid="listing-inquire-send"
                className="rounded-sm border border-[var(--color-deep)] px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] hover:bg-[var(--color-deep)] hover:text-white"
              >
                Send inquiry
              </a>
              <a
                href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
                onClick={() => track("phone_click", { surface: "listing_inquire_call", property: p.slug })}
                data-testid="listing-inquire-call"
                className="rounded-sm border border-border px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-foreground hover:bg-white"
              >
                Call {PHONE}
              </a>
            </div>
            {p.airbnbUrl && (
              <p className="mt-5 text-xs text-muted-foreground">
                Prefer Airbnb?{" "}
                <a
                  href={p.airbnbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--color-sea)] underline underline-offset-2 hover:opacity-80"
                >
                  View this listing on Airbnb →
                </a>
              </p>
            )}
          </div>
        </div>

        {/* STICKY BOOKING CARD */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-border bg-card p-6 shadow-md">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-sea)]">Book direct & save</p>
            {pricing ? (
              <>
                <p className="mt-2 font-display text-3xl text-[var(--color-deep)]">
                  ${pricing.min}
                  <span className="ml-1 text-sm font-sans font-normal text-muted-foreground">/ night</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Avg ${pricing.avg} · range ${pricing.min}–${pricing.max} ({pricing.currency})
                </p>
              </>
            ) : (
              <p className="mt-2 font-display text-2xl">No platform fees</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">Save up to 15% vs. Airbnb. Returning-guest discount applied automatically.</p>
            <AvailabilityChecker bookingUrl={bookingUrl} calendar={availability} propertySlug={p.slug} />
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("inquiry_click", { surface: "listing_sticky_check", property: p.slug })}
              data-testid="listing-sticky-check"
              className="mt-5 block rounded-sm bg-[var(--color-gold)] py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] shadow hover:brightness-105"
            >
              Check availability
            </a>
            <a
              href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
              onClick={() => track("phone_click", { surface: "listing_sticky_call", property: p.slug })}
              data-testid="listing-sticky-call"
              className="mt-3 block rounded-sm border border-[var(--color-deep)] py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] hover:bg-[var(--color-deep)] hover:text-white"
            >
              Call {PHONE}
            </a>
            <ul className="mt-6 space-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span>💰</span> Save up to 15% vs. Airbnb</li>
              <li className="flex items-start gap-2"><span>💬</span> Direct line to your host</li>
              <li className="flex items-start gap-2"><span>🔁</span> 10% off for returning guests</li>
              <li className="flex items-start gap-2"><span>✨</span> Custom requests welcome</li>
            </ul>
            {p.airbnbUrl && (
              <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <a
                  href={p.airbnbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--color-sea)] underline underline-offset-2 hover:opacity-80"
                >
                  View on Airbnb
                </a>
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* RELATED */}
      <section className="border-t border-border bg-[var(--color-sand)]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <h2 className="font-display text-3xl font-medium tracking-tight">You might also love</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <PropertyCard key={r.slug} p={r} />)}
          </div>
        </div>
      </section>

      {/* MOBILE CTA BAR */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-white p-3 shadow-lg lg:hidden">
        <a
          href={bookingUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("inquiry_click", { surface: "listing_mobile_check", property: p.slug })}
          data-testid="listing-mobile-check"
          className="flex-1 rounded-sm bg-[var(--color-gold)] py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)]"
        >
          Check availability
        </a>
        <a
          href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
          onClick={() => track("phone_click", { surface: "listing_mobile_call", property: p.slug })}
          data-testid="listing-mobile-call"
          className="rounded-sm border border-[var(--color-deep)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)]"
        >
          Call
        </a>
      </div>

      <BookDirectFooter />
    </Layout>
  );
}

function BookDirectFooter() {
  return (
    <div className="bg-[var(--color-deep)] py-12 text-center text-white lg:hidden">
      <a
        href={BOOK_DIRECT_URL}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("book_direct_click", { surface: "listing_footer_mobile" })}
        data-testid="listing-footer-book-direct"
        className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] underline-offset-4 hover:underline"
      >
        See all 9 properties →
      </a>
    </div>
  );
}
