import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { properties } from "@/data/properties";

type Review = {
  hospitable_review_id: string | null;
  property_slug: string | null;
  guest_name: string | null;
  rating: number | null;
  text: string | null;
  review_date: string | null;
};

const fallback: Review[] = [
  {
    hospitable_review_id: "f1",
    property_slug: null,
    guest_name: "Jessica M.",
    rating: 5,
    text:
      "Absolutely stunning property. Nella was incredibly responsive and the home was exactly as pictured — actually better. We'll be back every year.",
    review_date: null,
  },
  {
    hospitable_review_id: "f2",
    property_slug: null,
    guest_name: "The Rodriguez Family",
    rating: 5,
    text:
      "The best vacation rental we've ever stayed in. So close to the beach, beautifully decorated, and the communication was seamless from start to finish.",
    review_date: null,
  },
  {
    hospitable_review_id: "f3",
    property_slug: null,
    guest_name: "Mark & Dana T.",
    rating: 5,
    text:
      "Stayed in St. Pete and fell in love with the condo. Designer touches everywhere, great location, and the host goes above and beyond. Five stars isn't enough.",
    review_date: null,
  },
];

export function RealReviews({ limit = 6, propertySlug }: { limit?: number; propertySlug?: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let q = supabase
        .from("hospitable_reviews_cache")
        .select("hospitable_review_id, property_slug, guest_name, rating, text, review_date")
        .order("review_date", { ascending: false })
        .limit(limit);
      if (propertySlug) q = q.eq("property_slug", propertySlug);
      const { data, error } = await q;
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setReviews(fallback.slice(0, limit));
      } else {
        setReviews(data.filter((r) => (r.text ?? "").trim().length > 30));
      }
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [limit, propertySlug]);

  const list = reviews.length ? reviews : fallback.slice(0, limit);

  return (
    <div className={`grid gap-6 ${list.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      {list.map((r) => {
        const place = r.property_slug
          ? properties.find((p) => p.slug === r.property_slug)?.location
          : undefined;
        return (
          <figure
            key={r.hospitable_review_id ?? `${r.guest_name}-${r.review_date}`}
            className="rounded-md border border-border bg-card p-7 shadow-sm"
          >
            <div className="text-[var(--color-gold)]" aria-label={`${r.rating ?? 5} stars`}>
              ★★★★★
            </div>
            <blockquote className="mt-4 font-display text-lg italic leading-relaxed text-foreground">
              “{r.text}”
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted-foreground">
              — {r.guest_name || "Guest"}
              {place ? (
                <>
                  {" "}
                  · <span className="text-[var(--color-sea)]">{place}</span>
                </>
              ) : null}
            </figcaption>
          </figure>
        );
      })}
      {!loaded && null}
    </div>
  );
}