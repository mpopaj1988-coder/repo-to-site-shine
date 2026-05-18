import { Bath, BedDouble, Star, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Property } from "@/data/properties";
import type { Pricing } from "@/lib/hospitable.functions";

export function PropertyCard({ p, pricing }: { p: Property; pricing?: Pricing }) {
  return (
    <Link
      to="/listings/$slug"
      params={{ slug: p.slug }}
      className="group block overflow-hidden rounded-md bg-card shadow-sm ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={p.image}
          alt={p.imageAlts?.[0] ?? p.alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        {p.badge && (
          <span className="absolute left-3 top-3 rounded-sm bg-[var(--color-gold)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-deep)]">
            {p.badge}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-sm bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-deep)] backdrop-blur">
          Book Direct &amp; Save
        </span>
      </div>
      <div className="p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-sea)]">
          📍 {p.location}
        </p>
        <h3 className="mt-2 font-display text-xl leading-snug text-foreground">{p.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {p.bedrooms} BR</span>
          <span className="flex items-center gap-1"><Bath className="size-3.5" /> {p.bathrooms} BA</span>
          <span className="flex items-center gap-1"><Users className="size-3.5" /> Sleeps {p.sleeps}</span>
          <span className="flex items-center gap-1">✦ {p.feature}</span>
        </div>
        {p.reviews > 0 ? (
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-foreground">
              <Star className="size-3.5 fill-[var(--color-gold)] text-[var(--color-gold)]" />
              <span className="font-semibold">{p.rating}</span>
              <span className="text-muted-foreground">({p.reviews} reviews)</span>
            </div>
            {pricing && (
              <p className="text-xs font-semibold text-[var(--color-deep)]">
                From <span className="font-display text-base">${pricing.min}</span>
                <span className="font-normal text-muted-foreground"> /night</span>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--color-sea)]">✨ Newly listed</span>
            {pricing && (
              <p className="text-xs font-semibold text-[var(--color-deep)]">
                From <span className="font-display text-base">${pricing.min}</span>
                <span className="font-normal text-muted-foreground"> /night</span>
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}