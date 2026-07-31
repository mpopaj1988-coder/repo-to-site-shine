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

const REFRESH_INTERVAL_DAYS = 28;

async function handleRefresh() {
  const token = process.env.HOSPITABLE_API_KEY || process.env.HOSPITABLE_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing HOSPITABLE_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Called from the daily cron, but reviews only need to refresh monthly —
  // skip most days by checking how recently the cache was last populated.
  const { data: lastFetch } = await supabaseAdmin
    .from("hospitable_reviews_cache")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastFetch?.fetched_at) {
    const daysSinceLastRefresh =
      (Date.now() - new Date(lastFetch.fetched_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastRefresh < REFRESH_INTERVAL_DAYS) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "not due yet",
          daysSinceLastRefresh: Math.floor(daysSinceLastRefresh),
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
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
    const rows = reviews
      .map((r: any) => ({
        hospitable_review_id: String(r.id ?? r.uuid ?? `${p.hospitableId}-${r.reviewed_at}`),
        property_hospitable_id: p.hospitableId,
        property_slug: p.slug,
        guest_name: r.public?.reviewer || r.guest_name || r.reviewer?.first_name || r.guest?.first_name || "Guest",
        rating:
          typeof r.public?.rating === "number"
            ? r.public.rating
            : typeof r.rating === "number"
            ? r.rating
            : typeof r.overall_rating === "number"
            ? r.overall_rating
            : null,
        text: r.public?.review || r.public_review || r.comment || r.text || "",
        review_date: (r.reviewed_at || r.review_date || r.created_at || r.submitted_at || "").slice(0, 10) || null,
        raw: r,
        fetched_at: new Date().toISOString(),
      }))
      .filter((row: any) => row.rating !== null && row.rating >= 4);

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

  // Purge any pre-existing rows with rating below 4 (or null) left from before the filter was added.
  await supabaseAdmin.from("hospitable_reviews_cache").delete().lt("rating", 4);
  await supabaseAdmin.from("hospitable_reviews_cache").delete().is("rating", null);

  return new Response(
    JSON.stringify({ ok: true, totalUpserted, perProperty }),
    { headers: { "Content-Type": "application/json" } },
  );
}