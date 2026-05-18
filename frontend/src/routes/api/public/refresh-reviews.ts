import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hospitable Public API: https://developer.hospitable.com
// We fetch reviews per property and upsert into our cache.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";

async function fetchReviewsForProperty(propertyId: string, token: string) {
  const url = `${HOSPITABLE_BASE}/properties/${propertyId}/reviews?per_page=50`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Hospitable ${propertyId} ${res.status}:`, body.slice(0, 200));
    return [];
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export const Route = createFileRoute("/api/public/refresh-reviews")({
  server: {
    handlers: {
      GET: async () => handleRefresh(),
      POST: async () => handleRefresh(),
    },
  },
});

async function handleRefresh() {
  const token = process.env.HOSPITABLE_API_KEY || process.env.HOSPITABLE_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing HOSPITABLE_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Pull property IDs from our static list (mirrors src/data/properties.ts)
  const { properties } = await import("@/data/properties");
  let totalUpserted = 0;
  const perProperty: Record<string, number> = {};

  for (const p of properties) {
    if (!p.hospitableId) continue;
    const reviews = await fetchReviewsForProperty(p.hospitableId, token);
    if (!reviews.length) {
      perProperty[p.slug] = 0;
      continue;
    }
    const rows = reviews.map((r: any) => ({
      hospitable_review_id: String(r.id ?? r.uuid ?? `${p.hospitableId}-${r.created_at}`),
      property_hospitable_id: p.hospitableId,
      property_slug: p.slug,
      guest_name:
        r.guest_name ||
        r.reviewer?.first_name ||
        r.guest?.first_name ||
        "Guest",
      rating:
        typeof r.rating === "number"
          ? r.rating
          : typeof r.overall_rating === "number"
          ? r.overall_rating
          : null,
      text: r.public_review || r.private_review || r.comment || r.text || "",
      review_date: (r.review_date || r.created_at || r.submitted_at || "").slice(0, 10) || null,
      raw: r,
      fetched_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("hospitable_reviews_cache")
      .upsert(rows, { onConflict: "hospitable_review_id" });
    if (error) {
      console.error(`Upsert error ${p.slug}:`, error);
    } else {
      totalUpserted += rows.length;
      perProperty[p.slug] = rows.length;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, totalUpserted, perProperty }),
    { headers: { "Content-Type": "application/json" } },
  );
}