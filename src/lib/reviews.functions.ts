import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getReviews = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("hospitable_reviews_cache")
    .select("hospitable_review_id, property_slug, guest_name, rating, text, review_date")
    .order("review_date", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getReviews error", error);
    return { reviews: [] as Array<any> };
  }
  return { reviews: data ?? [] };
});