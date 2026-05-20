import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  fetchGapPrice,
  fetchGuestFirstName,
  buildFulfillMessage,
  sendHospitableMessage,
} from "@/lib/gap-day-upsell";

export const Route = createFileRoute("/api/internal/gap-day-fulfill")({
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

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { reservation_uuid, gap_date } = (body ?? {}) as {
          reservation_uuid?: string;
          gap_date?: string;
        };

        if (!reservation_uuid || !gap_date) {
          return Response.json(
            { error: "reservation_uuid and gap_date are required" },
            { status: 400 },
          );
        }

        const { data: logEntry } = await supabaseAdmin
          .from("gap_day_upsell_log")
          .select("*")
          .eq("gap_date", gap_date)
          .or(
            `checkout_reservation_uuid.eq.${reservation_uuid},checkin_reservation_uuid.eq.${reservation_uuid}`,
          )
          .maybeSingle();

        if (!logEntry) {
          return Response.json(
            {
              error:
                "No upsell log entry found for this reservation and gap date. Run the scan endpoint first.",
            },
            { status: 404 },
          );
        }

        const isCheckout =
          logEntry.checkout_reservation_uuid === reservation_uuid;
        const fulfillColumn = isCheckout
          ? "fulfill_checkout_sent_at"
          : "fulfill_checkin_sent_at";
        const alreadySent = logEntry[fulfillColumn];

        if (alreadySent) {
          return Response.json({
            ok: true,
            status: "already_fulfilled",
            sentAt: alreadySent,
          });
        }

        // Re-fetch price at fulfillment time ("40% of what it is at that time").
        const price = await fetchGapPrice(
          logEntry.property_hospitable_id,
          gap_date,
          apiKey,
        );
        if (!price) {
          return Response.json(
            { error: "Could not fetch current price for gap date" },
            { status: 502 },
          );
        }

        const guestFirstName = await fetchGuestFirstName(
          reservation_uuid,
          apiKey,
        );
        const msgBody = buildFulfillMessage(guestFirstName, gap_date, price);

        const sent = await sendHospitableMessage(
          reservation_uuid,
          msgBody,
          apiKey,
        );
        if (!sent) {
          return Response.json(
            { error: "Failed to send message via Hospitable" },
            { status: 502 },
          );
        }

        await supabaseAdmin
          .from("gap_day_upsell_log")
          .update({ [fulfillColumn]: new Date().toISOString() })
          .eq("gap_date", gap_date)
          .or(
            `checkout_reservation_uuid.eq.${reservation_uuid},checkin_reservation_uuid.eq.${reservation_uuid}`,
          );

        return Response.json({
          ok: true,
          status: "fulfilled",
          guestType: isCheckout ? "checkout" : "checkin",
          discountedPrice: price.discountedDollars,
          originalPrice: price.originalDollars,
        });
      },
    },
  },
});
