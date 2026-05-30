// Server-only: orphan day detection and Hospitable guest messaging.
// An "orphan day" is exactly 1 vacant day between two consecutive accepted
// reservations on the same property.  We send both adjacent guests a
// personalised offer to fill it at a 20% discount.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";
const DISCOUNT_PCT = 35;

// ── Types ────────────────────────────────────────────────────────────────────

interface HospitableReservation {
  id: string;
  code: string;
  platform: string;
  arrival_date: string;   // "YYYY-MM-DDThh:mm:ss±hh:mm"
  departure_date: string; // same — guest departs (checks out) this day
  nights: number;
  reservation_status: { current: { category: string } };
  conversation_id: string;
  guest?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface OrphanUpsellResult {
  propertyId: string;
  propertySlug: string;
  orphanDate: string;
  outgoingReservationId: string;
  incomingReservationId: string;
  regularPrice: number | null;
  discountedPrice: number | null;
  outgoingSent: boolean;
  incomingSent: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function toDate(s: string): Date {
  return new Date(s.slice(0, 10) + "T00:00:00Z");
}

function diffDays(earlier: string, later: string): number {
  return Math.round((toDate(later).getTime() - toDate(earlier).getTime()) / 86_400_000);
}

function addDays(dateStr: string, n: number): string {
  const d = toDate(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr: string): string {
  return toDate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// ── Hospitable API calls ──────────────────────────────────────────────────────

async function fetchAcceptedReservations(
  propertyId: string,
  apiKey: string,
  startDate: string,
  endDate: string,
): Promise<HospitableReservation[]> {
  const results: HospitableReservation[] = [];
  let page = 1;

  while (true) {
    const url = new URL(`${HOSPITABLE_BASE}/reservations`);
    url.searchParams.append("properties[]", propertyId);
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);
    url.searchParams.set("date_query", "checkin");
    url.searchParams.append("status[]", "accepted");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    url.searchParams.set("include", "guest");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[orphan-upsell] fetchReservations ${propertyId} ${res.status}`);
      break;
    }

    const json = (await res.json()) as {
      data?: HospitableReservation[];
      meta?: { last_page?: number };
    };

    results.push(...(json.data ?? []));
    if (page >= (json.meta?.last_page ?? 1)) break;
    page++;
  }

  return results;
}

async function fetchDayPrice(
  propertyId: string,
  orphanDate: string,
  apiKey: string,
): Promise<number | null> {
  const nextDay = addDays(orphanDate, 1);
  const url =
    `${HOSPITABLE_BASE}/properties/${propertyId}/calendar` +
    `?start_date=${orphanDate}&end_date=${nextDay}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: { days?: Array<{ price?: { amount?: number } }> };
  };
  const amt = json.data?.days?.[0]?.price?.amount;
  return typeof amt === "number" ? Math.round(amt / 100) : null;
}

async function sendMessage(
  reservationId: string,
  body: string,
  apiKey: string,
): Promise<boolean> {
  const url = `${HOSPITABLE_BASE}/reservations/${reservationId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[orphan-upsell] sendMessage ${reservationId} ${res.status}:`, text.slice(0, 200));
  }
  return res.ok;
}

// ── Message copy ──────────────────────────────────────────────────────────────

function outgoingMessage(
  firstName: string,
  orphanDate: string,
  regularPrice: number | null,
  discountedPrice: number | null,
): string {
  const dateLabel = fmtDate(orphanDate);
  const priceClause =
    regularPrice !== null && discountedPrice !== null
      ? ` We can offer that extra night at $${discountedPrice} — a 35% discount off our regular rate of $${regularPrice}.`
      : " We'd be happy to offer you a special discounted rate for that extra night.";

  return (
    `Hi ${firstName}! 🌊 Hope your stay is going wonderfully!\n\n` +
    `We noticed the night right after your checkout — ${dateLabel} — is still open. ` +
    `Would you like to extend by one more night?${priceClause}\n\n` +
    `Reply **YES** if you'd like it, or simply ignore this message if not — no worries either way! 😊\n\n` +
    `— Sea & City Rentals`
  );
}

function incomingMessage(
  firstName: string,
  orphanDate: string,
  regularPrice: number | null,
  discountedPrice: number | null,
): string {
  const dateLabel = fmtDate(orphanDate);
  const priceClause =
    regularPrice !== null && discountedPrice !== null
      ? ` We can offer that early night at $${discountedPrice} — a 35% discount off our regular rate of $${regularPrice}.`
      : " We'd be happy to offer you a special discounted rate for that night.";

  return (
    `Hi ${firstName}! 🌴 We're so looking forward to welcoming you!\n\n` +
    `Great news — the night right before your arrival, ${dateLabel}, is available. ` +
    `Would you like to check in a day early?${priceClause}\n\n` +
    `Reply **YES** if you'd like it, or simply ignore this message if not — no worries either way! 🏖️\n\n` +
    `— Sea & City Rentals`
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processOrphanDayUpsells(
  properties: Array<{ slug: string; hospitableId: string }>,
  // Using `any` here to avoid importing supabase client types in a server file
  // that may be shared — callers pass supabaseAdmin.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  options: { dryRun?: boolean } = {},
): Promise<OrphanUpsellResult[]> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) throw new Error("HOSPITABLE_API_KEY not configured");

  const today = new Date().toISOString().slice(0, 10);
  const endDate = addDays(today, 365);

  const results: OrphanUpsellResult[] = [];

  for (const property of properties) {
    let reservations: HospitableReservation[];
    try {
      reservations = await fetchAcceptedReservations(property.hospitableId, apiKey, today, endDate);
    } catch (err) {
      console.error(`[orphan-upsell] ${property.slug} fetch error:`, err);
      continue;
    }

    // Sort ascending by check-in date so we can scan consecutive pairs.
    reservations.sort((a, b) =>
      a.arrival_date.slice(0, 10).localeCompare(b.arrival_date.slice(0, 10)),
    );

    for (let i = 0; i < reservations.length - 1; i++) {
      const outgoing = reservations[i];
      const incoming = reservations[i + 1];

      const checkoutDate = outgoing.departure_date.slice(0, 10);
      const checkinDate = incoming.arrival_date.slice(0, 10);
      const gap = diffDays(checkoutDate, checkinDate);

      // Exactly 2-day gap between departure and next arrival → 1 orphan night.
      if (gap !== 2) continue;

      const orphanDate = addDays(checkoutDate, 1); // the vacant night

      // Skip if we already sent both messages for this gap.
      let existing: { outgoing_sent: boolean; incoming_sent: boolean } | null = null;
      try {
        const { data } = await supabaseAdmin
          .from("orphan_upsell_log")
          .select("outgoing_sent, incoming_sent")
          .eq("property_hospitable_id", property.hospitableId)
          .eq("orphan_date", orphanDate)
          .maybeSingle();
        existing = data ?? null;
      } catch (err) {
        console.error(`[orphan-upsell] DB read error ${property.slug}/${orphanDate}:`, err);
      }

      if (existing?.outgoing_sent && existing?.incoming_sent) {
        results.push({
          propertyId: property.hospitableId,
          propertySlug: property.slug,
          orphanDate,
          outgoingReservationId: outgoing.id,
          incomingReservationId: incoming.id,
          regularPrice: null,
          discountedPrice: null,
          outgoingSent: true,
          incomingSent: true,
          skipped: true,
          skipReason: "already_sent",
        });
        continue;
      }

      // Fetch the rack rate for the orphan night to quote a discount.
      let regularPrice: number | null = null;
      let discountedPrice: number | null = null;
      try {
        regularPrice = await fetchDayPrice(property.hospitableId, orphanDate, apiKey);
        if (regularPrice !== null) {
          discountedPrice = Math.round(regularPrice * (1 - DISCOUNT_PCT / 100));
        }
      } catch (err) {
        console.error(`[orphan-upsell] price fetch error ${property.slug}/${orphanDate}:`, err);
      }

      const result: OrphanUpsellResult = {
        propertyId: property.hospitableId,
        propertySlug: property.slug,
        orphanDate,
        outgoingReservationId: outgoing.id,
        incomingReservationId: incoming.id,
        regularPrice,
        discountedPrice,
        outgoingSent: existing?.outgoing_sent ?? false,
        incomingSent: existing?.incoming_sent ?? false,
      };

      if (!options.dryRun) {
        // Message the departing guest — offer to extend.
        if (!existing?.outgoing_sent) {
          try {
            const name = outgoing.guest?.first_name || "there";
            const msg = outgoingMessage(name, orphanDate, regularPrice, discountedPrice);
            result.outgoingSent = await sendMessage(outgoing.id, msg, apiKey);
          } catch (err) {
            console.error(`[orphan-upsell] outgoing send error ${outgoing.id}:`, err);
          }
        }

        // Message the arriving guest — offer early check-in.
        if (!existing?.incoming_sent) {
          try {
            const name = incoming.guest?.first_name || "there";
            const msg = incomingMessage(name, orphanDate, regularPrice, discountedPrice);
            result.incomingSent = await sendMessage(incoming.id, msg, apiKey);
          } catch (err) {
            console.error(`[orphan-upsell] incoming send error ${incoming.id}:`, err);
          }
        }

        // Persist result so we never double-send.
        try {
          await supabaseAdmin.from("orphan_upsell_log").upsert(
            {
              property_hospitable_id: property.hospitableId,
              orphan_date: orphanDate,
              outgoing_reservation_id: outgoing.id,
              incoming_reservation_id: incoming.id,
              outgoing_sent: result.outgoingSent,
              incoming_sent: result.incomingSent,
              orphan_day_price_usd: regularPrice,
              discounted_price_usd: discountedPrice,
            },
            { onConflict: "property_hospitable_id,orphan_date" },
          );
        } catch (err) {
          console.error(`[orphan-upsell] DB upsert error ${property.slug}/${orphanDate}:`, err);
        }
      }

      results.push(result);
    }
  }

  return results;
}
