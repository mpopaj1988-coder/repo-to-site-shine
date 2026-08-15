import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Every promo code we issue is worth 10% off the room rate. */
export const PROMO_PCT = 0.1;

/** Shared, reusable code sent to guests who have stayed before. */
export const RETURNING_GUEST_CODE = "RETURN10";

export type PromoResult =
  | { valid: true; pct: number; label: string; code: string }
  | { valid: false; reason: "not_found" | "already_used" };

/**
 * Validates a discount code against our own records — we deliberately do NOT
 * use Stripe promotion codes here. Doing it in-app lets the discount apply to
 * the room rate only, so Florida tax is still calculated on the true amount
 * rather than being discounted along with everything else.
 */
export const validatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }): Promise<PromoResult> => {
    const code = (data.code ?? "").trim().toUpperCase();
    if (!code) return { valid: false, reason: "not_found" };

    // Returning-guest code is shared across all past guests and reusable.
    if (code === RETURNING_GUEST_CODE) {
      return { valid: true, pct: PROMO_PCT, label: "Returning guest · 10% off", code };
    }

    // Signup codes are unique per lead and single-use.
    const { data: lead, error } = await supabaseAdmin
      .from("email_leads")
      .select("id, discount_code, discount_code_used_at")
      .eq("discount_code", code)
      .maybeSingle();

    if (error) {
      console.error("validatePromoCode error", error);
      return { valid: false, reason: "not_found" };
    }
    if (!lead) return { valid: false, reason: "not_found" };
    if (lead.discount_code_used_at) return { valid: false, reason: "already_used" };

    return { valid: true, pct: PROMO_PCT, label: "Signup discount · 10% off", code };
  });
