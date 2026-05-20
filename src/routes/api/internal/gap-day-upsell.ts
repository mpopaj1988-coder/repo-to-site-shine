import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  fetchPropertyReservations,
  findGaps,
  fetchGapPrice,
  buildCheckoutMessage,
  buildCheckinMessage,
  sendHospitableMessage,
} from "@/lib/gap-day-upsell";
import { properties } from "@/data/properties";

export const Route = createFileRoute("/api/internal/gap-day-upsell")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.INTERNAL_API_SECRET;
        if (secret && request.headers.get("x-internal-secret") !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey =
          process.env.HOSPITABLE_API_KEY || process.env.HOSPITABLE_API_TOKEN;
        if (!apiKey) {
          return Response.json(
            { error: "Missing HOSPITABLE_API_KEY" },
            { status: 500 },
          );
        }

        const results: Array<{
          propertySlug: string;
          gapDate: string;
          status: string;
          checkoutSent: boolean;
          checkinSent: boolean;
          discountedPrice?: number;
          error?: string;
        }> = [];

        for (const prop of properties) {
          if (!prop.hospitableId) continue;

          let reservations;
          try {
            reservations = await fetchPropertyReservations(
              prop.hospitableId,
              apiKey,
            );
          } catch (err) {
            console.error(
              `Error fetching reservations for ${prop.slug}:`,
              err,
            );
            continue;
          }

          const gaps = findGaps(reservations);

          for (const gap of gaps) {
            const { data: existing } = await supabaseAdmin
              .from("gap_day_upsell_log")
              .select(
                "id, checkout_message_sent_at, checkin_message_sent_at",
              )
              .eq("property_hospitable_id", prop.hospitableId)
              .eq("gap_date", gap.gapDate)
              .maybeSingle();

            if (
              existing?.checkout_message_sent_at &&
              existing?.checkin_message_sent_at
            ) {
              results.push({
                propertySlug: prop.slug,
                gapDate: gap.gapDate,
                status: "already_sent",
                checkoutSent: true,
                checkinSent: true,
              });
              continue;
            }

            const price = await fetchGapPrice(
              prop.hospitableId,
              gap.gapDate,
              apiKey,
            );
            if (!price) {
              results.push({
                propertySlug: prop.slug,
                gapDate: gap.gapDate,
                status: "no_price",
                checkoutSent: false,
                checkinSent: false,
              });
              continue;
            }

            // Upsert log row first so partial failures can be retried cleanly.
            await supabaseAdmin
              .from("gap_day_upsell_log")
              .upsert(
                {
                  property_hospitable_id: prop.hospitableId,
                  gap_date: gap.gapDate,
                  checkout_reservation_uuid: gap.checkoutRes.uuid,
                  checkin_reservation_uuid: gap.checkinRes.uuid,
                  original_price_cents: price.originalCents,
                  discounted_price_cents: price.discountedCents,
                  currency: price.currency,
                },
                { onConflict: "property_hospitable_id,gap_date" },
              );

            const checkoutName =
              gap.checkoutRes.guest?.first_name ?? "there";
            const checkinName = gap.checkinRes.guest?.first_name ?? "there";

            let checkoutSent = !!existing?.checkout_message_sent_at;
            let checkinSent = !!existing?.checkin_message_sent_at;
            let rowError: string | undefined;

            if (!checkoutSent) {
              const ok = await sendHospitableMessage(
                gap.checkoutRes.uuid,
                buildCheckoutMessage(checkoutName, gap.gapDate, price),
                apiKey,
              );
              if (ok) {
                checkoutSent = true;
                await supabaseAdmin
                  .from("gap_day_upsell_log")
                  .update({
                    checkout_message_sent_at: new Date().toISOString(),
                  })
                  .eq("property_hospitable_id", prop.hospitableId)
                  .eq("gap_date", gap.gapDate);
              } else {
                rowError = "checkout_send_failed";
              }
            }

            if (!checkinSent) {
              const ok = await sendHospitableMessage(
                gap.checkinRes.uuid,
                buildCheckinMessage(checkinName, gap.gapDate, price),
                apiKey,
              );
              if (ok) {
                checkinSent = true;
                await supabaseAdmin
                  .from("gap_day_upsell_log")
                  .update({
                    checkin_message_sent_at: new Date().toISOString(),
                  })
                  .eq("property_hospitable_id", prop.hospitableId)
                  .eq("gap_date", gap.gapDate);
              } else {
                rowError = rowError
                  ? `${rowError};checkin_send_failed`
                  : "checkin_send_failed";
              }
            }

            results.push({
              propertySlug: prop.slug,
              gapDate: gap.gapDate,
              status: rowError ? "partial_error" : "sent",
              checkoutSent,
              checkinSent,
              discountedPrice: price.discountedDollars,
              ...(rowError ? { error: rowError } : {}),
            });
          }
        }

        const sent = results.filter((r) => r.status === "sent").length;
        const skipped = results.filter(
          (r) => r.status === "already_sent",
        ).length;

        return Response.json({ ok: true, sent, skipped, results });
      },
    },
  },
});
