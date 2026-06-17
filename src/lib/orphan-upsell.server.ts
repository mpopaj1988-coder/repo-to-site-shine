// Server-only: orphan day detection and Hospitable guest messaging.
// An "orphan day" is exactly 1 vacant day between two consecutive accepted
// reservations on the same property.  We send both adjacent guests a
// personalised offer to fill it at a 35% discount.
//
// If the same guest has orphan days on BOTH sides of their stay (the night
// before check-in AND the night after checkout are both open), they receive
// ONE combined message instead of two separate ones.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";
const DISCOUNT_PCT = 20;
const ENHANCED_DISCOUNT_PCT = 35;

// ── Types ────────────────────────────────────────────────────────────────────

interface HospitableReservation {
  id: string;
  code: string;
  platform: string;
  arrival_date: string;
  departure_date: string;
  nights: number;
  reservation_status: { current: { category: string } };
  guest?: { first_name?: string; last_name?: string };
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

interface PendingPair {
  outgoing: HospitableReservation;
  incoming: HospitableReservation;
  orphanDate: string;
  discountPct: number;
  hospitablePrice: number | null;  // raw price from Hospitable before platform adjustment
  regularPrice: number | null;     // Airbnb-adjusted price (for result reporting)
  discountedPrice: number | null;  // Airbnb-adjusted discounted price (for result reporting)
  outgoingAlreadySent: boolean;
  incomingAlreadySent: boolean;
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
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function isCurrentlyStaying(res: HospitableReservation, today: string): boolean {
  return (
    today >= res.arrival_date.slice(0, 10) &&
    today < res.departure_date.slice(0, 10)
  );
}

function isExcludedMonth(dateStr: string): boolean {
  const month = toDate(dateStr).getUTCMonth() + 1;
  return month === 3 || month === 4; // March and April
}

// 35% off on Sun–Thu nights in late Aug (16+), Sep, Oct, Nov, Dec.
// Fri/Sat stay at the standard 20% — weekend demand is higher.
function discountPctForDate(dateStr: string): number {
  const d = toDate(dateStr);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const dow = d.getUTCDay(); // 0=Sun … 5=Fri, 6=Sat
  if (dow === 5 || dow === 6) return DISCOUNT_PCT;
  if (month === 8 && day >= 16) return ENHANCED_DISCOUNT_PCT;
  if (month >= 9 && month <= 12) return ENHANCED_DISCOUNT_PCT;
  return DISCOUNT_PCT;
}

function pricesForPlatform(
  hospitablePrice: number | null,
  platform: string,
  minPrice: number,
  discountPct: number,
): { regularPrice: number | null; discountedPrice: number | null } {
  if (hospitablePrice === null) return { regularPrice: null, discountedPrice: null };
  const isDirect = platform === "direct" || platform === "manual";
  const regularPrice = isDirect ? hospitablePrice : Math.round(hospitablePrice * 1.15);
  const discountedPrice = Math.max(
    Math.round(regularPrice * (1 - discountPct / 100)),
    minPrice,
  );
  // minPrice floor can push discountedPrice above regularPrice — don't quote broken math to guests
  if (discountedPrice >= regularPrice) return { regularPrice: null, discountedPrice: null };
  return { regularPrice, discountedPrice };
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

async function sendMessage(reservationId: string, body: string, apiKey: string): Promise<boolean> {
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

function greeting(firstName: string, currentlyStaying: boolean, emoji: string): string {
  return currentlyStaying
    ? `Hi ${firstName}! ${emoji} Hope your stay is going wonderfully!\n\n`
    : `Hi ${firstName}! ${emoji} We're so looking forward to welcoming you!\n\n`;
}

function priceNote(regular: number | null, discounted: number | null, label: string, discountPct: number): string {
  return regular !== null && discounted !== null
    ? ` We can offer ${label} at $${discounted} — a ${discountPct}% discount off our regular rate of $${regular}.`
    : ` We'd be happy to offer you a special discounted rate for ${label}.`;
}

function outgoingMessage(
  firstName: string,
  orphanDate: string,
  regularPrice: number | null,
  discountedPrice: number | null,
  currentlyStaying: boolean,
  discountPct: number,
): string {
  return (
    greeting(firstName, currentlyStaying, "🌊") +
    `We noticed the night right after your checkout — ${fmtDate(orphanDate)} — is still open. ` +
    `Would you like to extend by one more night?${priceNote(regularPrice, discountedPrice, "that extra night", discountPct)}\n\n` +
    `Reply **YES** if you'd like it — or if you'd prefer to keep your reservation exactly as is, no need to reply at all! 😊\n\n` +
    `— Nella`
  );
}

function incomingMessage(
  firstName: string,
  orphanDate: string,
  regularPrice: number | null,
  discountedPrice: number | null,
  discountPct: number,
): string {
  return (
    `Hi ${firstName}! 🌴 We're so looking forward to welcoming you!\n\n` +
    `Great news — the night right before your arrival, ${fmtDate(orphanDate)}, is available. ` +
    `Would you like to check in a day early?${priceNote(regularPrice, discountedPrice, "that early night", discountPct)}\n\n` +
    `Reply **YES** if you'd like it — or if you'd prefer to keep your reservation exactly as is, no need to reply at all! 🏖️\n\n` +
    `— Nella`
  );
}

function combinedMessage(
  firstName: string,
  earlyDate: string,
  lateDate: string,
  earlyRegular: number | null,
  earlyDiscounted: number | null,
  earlyDiscountPct: number,
  lateRegular: number | null,
  lateDiscounted: number | null,
  lateDiscountPct: number,
  currentlyStaying: boolean,
): string {
  const earlyPriceNote = earlyRegular !== null && earlyDiscounted !== null
    ? ` ($${earlyDiscounted} — ${earlyDiscountPct}% off our regular $${earlyRegular} rate)`
    : "";
  const latePriceNote = lateRegular !== null && lateDiscounted !== null
    ? ` ($${lateDiscounted} — ${lateDiscountPct}% off our regular $${lateRegular} rate)`
    : "";

  return (
    greeting(firstName, currentlyStaying, "🌊") +
    `We have a special offer — two nights are open right around your stay!\n\n` +
    `• **Check in a day early** — ${fmtDate(earlyDate)} is available${earlyPriceNote}\n` +
    `• **Stay an extra night** — ${fmtDate(lateDate)} is open after your checkout${latePriceNote}\n\n` +
    `Feel free to take one or both! Reply **YES (early)**, **YES (late)**, or **YES (both)** and we'll take care of the rest. ` +
    `Or if you'd prefer to keep your reservation exactly as is, no need to reply — your booking stays unchanged! 🏖️\n\n` +
    `— Nella`
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processOrphanDayUpsells(
  properties: Array<{ slug: string; hospitableId: string; minPrice: number }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  options: { dryRun?: boolean } = {},
): Promise<OrphanUpsellResult[]> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) throw new Error("HOSPITABLE_API_KEY not configured");

  const today = new Date().toISOString().slice(0, 10);
  const endDate = addDays(today, 365);
  const allResults: OrphanUpsellResult[] = [];

  for (const property of properties) {
    let reservations: HospitableReservation[];
    try {
      reservations = await fetchAcceptedReservations(property.hospitableId, apiKey, today, endDate);
    } catch (err) {
      console.error(`[orphan-upsell] ${property.slug} fetch error:`, err);
      continue;
    }

    reservations.sort((a, b) =>
      a.arrival_date.slice(0, 10).localeCompare(b.arrival_date.slice(0, 10)),
    );

    // ── Pass 1: detect orphan pairs, check DB, fetch prices ───────────────────

    // Pre-load all reservation IDs already messaged for this property so we
    // never send a second orphan upsell to the same guest across different pairs.
    const alreadyMessagedIds = new Set<string>();
    try {
      const { data: sentLogs } = await supabaseAdmin
        .from("orphan_upsell_log")
        .select("outgoing_reservation_id, incoming_reservation_id, outgoing_sent, incoming_sent")
        .eq("property_hospitable_id", property.hospitableId);
      for (const log of sentLogs ?? []) {
        if (log.outgoing_sent) alreadyMessagedIds.add(log.outgoing_reservation_id);
        if (log.incoming_sent) alreadyMessagedIds.add(log.incoming_reservation_id);
      }
    } catch (err) {
      console.error(`[orphan-upsell] sent-IDs fetch error ${property.slug}:`, err);
    }

    const pendingPairs: PendingPair[] = [];

    for (let i = 0; i < reservations.length - 1; i++) {
      const outgoing = reservations[i];
      const incoming = reservations[i + 1];

      const checkoutDate = outgoing.departure_date.slice(0, 10);
      const checkinDate = incoming.arrival_date.slice(0, 10);
      const gap = diffDays(checkoutDate, checkinDate);
      if (gap !== 1 && gap !== 2) continue;

      // gap=2: orphan is the day after checkout (true middle night)
      // gap=1: orphan is the checkout day itself (same-day turnaround scenario)
      const orphanDate = gap === 1 ? checkoutDate : addDays(checkoutDate, 1);

      if (isExcludedMonth(orphanDate)) continue;

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

      const outgoingDone = (existing?.outgoing_sent ?? false) || alreadyMessagedIds.has(outgoing.id);
      const incomingDone = (existing?.incoming_sent ?? false) || alreadyMessagedIds.has(incoming.id);
      if (outgoingDone && incomingDone) {
        allResults.push({
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

      let hospitablePrice: number | null = null;
      try {
        hospitablePrice = await fetchDayPrice(property.hospitableId, orphanDate, apiKey);
      } catch (err) {
        console.error(`[orphan-upsell] price fetch error ${property.slug}/${orphanDate}:`, err);
      }

      const discountPct = discountPctForDate(orphanDate);

      // Derive Airbnb-adjusted prices for result reporting (outgoing guest is typically Airbnb)
      const { regularPrice, discountedPrice } = pricesForPlatform(
        hospitablePrice,
        outgoing.platform,
        property.minPrice,
        discountPct,
      );

      pendingPairs.push({
        outgoing,
        incoming,
        orphanDate,
        discountPct,
        hospitablePrice,
        regularPrice,
        discountedPrice,
        outgoingAlreadySent: (existing?.outgoing_sent ?? false) || alreadyMessagedIds.has(outgoing.id),
        incomingAlreadySent: (existing?.incoming_sent ?? false) || alreadyMessagedIds.has(incoming.id),
      });
    }

    if (pendingPairs.length === 0) continue;

    // ── Pass 2: build send plan — detect combined-message guests ──────────────

    // Maps: reservationId → the pair where it still needs a message
    const needsAsOutgoing = new Map<string, PendingPair>();
    const needsAsIncoming = new Map<string, PendingPair>();
    for (const pair of pendingPairs) {
      if (!pair.outgoingAlreadySent) needsAsOutgoing.set(pair.outgoing.id, pair);
      if (!pair.incomingAlreadySent) needsAsIncoming.set(pair.incoming.id, pair);
    }

    // Mutable result objects keyed by orphanDate so cross-pair updates work
    const pairResults = new Map<string, OrphanUpsellResult>();
    for (const pair of pendingPairs) {
      pairResults.set(pair.orphanDate, {
        propertyId: property.hospitableId,
        propertySlug: property.slug,
        orphanDate: pair.orphanDate,
        outgoingReservationId: pair.outgoing.id,
        incomingReservationId: pair.incoming.id,
        regularPrice: pair.regularPrice,
        discountedPrice: pair.discountedPrice,
        outgoingSent: pair.outgoingAlreadySent,
        incomingSent: pair.incomingAlreadySent,
      });
    }

    const messagedReservations = new Set<string>();

    for (const pair of pendingPairs) {
      const result = pairResults.get(pair.orphanDate)!;

      // ── Outgoing guest (checking out before orphan day) ────────────────────
      if (!pair.outgoingAlreadySent && !messagedReservations.has(pair.outgoing.id)) {
        if (!options.dryRun) {
          try {
            const name = pair.outgoing.guest?.first_name || "there";
            const staying = isCurrentlyStaying(pair.outgoing, today);
            const incomingPairForSameGuest = needsAsIncoming.get(pair.outgoing.id);

            let sent: boolean;
            if (incomingPairForSameGuest) {
              // This guest also has an early check-in orphan → combine both into one message
              const earlyPrices = pricesForPlatform(incomingPairForSameGuest.hospitablePrice, pair.outgoing.platform, property.minPrice, incomingPairForSameGuest.discountPct);
              const latePrices = pricesForPlatform(pair.hospitablePrice, pair.outgoing.platform, property.minPrice, pair.discountPct);
              sent = await sendMessage(
                pair.outgoing.id,
                combinedMessage(
                  name,
                  incomingPairForSameGuest.orphanDate,
                  pair.orphanDate,
                  earlyPrices.regularPrice,
                  earlyPrices.discountedPrice,
                  incomingPairForSameGuest.discountPct,
                  latePrices.regularPrice,
                  latePrices.discountedPrice,
                  pair.discountPct,
                  staying,
                ),
                apiKey,
              );
              result.outgoingSent = sent;
              const otherResult = pairResults.get(incomingPairForSameGuest.orphanDate);
              if (otherResult) otherResult.incomingSent = sent;
            } else {
              const { regularPrice: rp, discountedPrice: dp } = pricesForPlatform(pair.hospitablePrice, pair.outgoing.platform, property.minPrice, pair.discountPct);
              sent = await sendMessage(
                pair.outgoing.id,
                outgoingMessage(name, pair.orphanDate, rp, dp, staying, pair.discountPct),
                apiKey,
              );
              result.outgoingSent = sent;
            }
          } catch (err) {
            console.error(`[orphan-upsell] outgoing send error ${pair.outgoing.id}:`, err);
          }
        }
        messagedReservations.add(pair.outgoing.id);
      }

      // ── Incoming guest (checking in after orphan day) ──────────────────────
      if (!pair.incomingAlreadySent && !messagedReservations.has(pair.incoming.id)) {
        if (!options.dryRun) {
          try {
            const name = pair.incoming.guest?.first_name || "there";
            const outgoingPairForSameGuest = needsAsOutgoing.get(pair.incoming.id);

            let sent: boolean;
            if (outgoingPairForSameGuest) {
              // This guest also has a late checkout orphan → combine both into one message
              const staying = isCurrentlyStaying(pair.incoming, today);
              const earlyPrices = pricesForPlatform(pair.hospitablePrice, pair.incoming.platform, property.minPrice, pair.discountPct);
              const latePrices = pricesForPlatform(outgoingPairForSameGuest.hospitablePrice, pair.incoming.platform, property.minPrice, outgoingPairForSameGuest.discountPct);
              sent = await sendMessage(
                pair.incoming.id,
                combinedMessage(
                  name,
                  pair.orphanDate,
                  outgoingPairForSameGuest.orphanDate,
                  earlyPrices.regularPrice,
                  earlyPrices.discountedPrice,
                  pair.discountPct,
                  latePrices.regularPrice,
                  latePrices.discountedPrice,
                  outgoingPairForSameGuest.discountPct,
                  staying,
                ),
                apiKey,
              );
              result.incomingSent = sent;
              const otherResult = pairResults.get(outgoingPairForSameGuest.orphanDate);
              if (otherResult) otherResult.outgoingSent = sent;
            } else {
              const { regularPrice: rp, discountedPrice: dp } = pricesForPlatform(pair.hospitablePrice, pair.incoming.platform, property.minPrice, pair.discountPct);
              sent = await sendMessage(
                pair.incoming.id,
                incomingMessage(name, pair.orphanDate, rp, dp, pair.discountPct),
                apiKey,
              );
              result.incomingSent = sent;
            }
          } catch (err) {
            console.error(`[orphan-upsell] incoming send error ${pair.incoming.id}:`, err);
          }
        }
        messagedReservations.add(pair.incoming.id);
      }
    }

    // ── Persist all pairs ─────────────────────────────────────────────────────
    if (!options.dryRun) {
      for (const [orphanDate, result] of pairResults) {
        const pair = pendingPairs.find((p) => p.orphanDate === orphanDate)!;
        try {
          const outgoingPrices = pricesForPlatform(pair.hospitablePrice, pair.outgoing.platform, property.minPrice, pair.discountPct);
          const incomingPrices = pricesForPlatform(pair.hospitablePrice, pair.incoming.platform, property.minPrice, pair.discountPct);
          await supabaseAdmin.from("orphan_upsell_log").upsert(
            {
              property_hospitable_id: property.hospitableId,
              orphan_date: orphanDate,
              outgoing_reservation_id: pair.outgoing.id,
              incoming_reservation_id: pair.incoming.id,
              outgoing_sent: result.outgoingSent,
              incoming_sent: result.incomingSent,
              orphan_day_price_usd: pair.regularPrice,
              discounted_price_usd: pair.discountedPrice,
              outgoing_discounted_price_usd: outgoingPrices.discountedPrice,
              incoming_discounted_price_usd: incomingPrices.discountedPrice,
            },
            { onConflict: "property_hospitable_id,orphan_date" },
          );
        } catch (err) {
          console.error(`[orphan-upsell] DB upsert error ${property.slug}/${orphanDate}:`, err);
        }
      }
    }

    allResults.push(...pairResults.values());
  }

  return allResults;
}
