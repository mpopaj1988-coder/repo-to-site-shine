// Server-only: processes guest YES replies to rebooking campaign messages.
//
// Flow per pending log row:
//   1. Fetch messages on the guest's past reservation conversation.
//   2. Look for a guest message containing "yes" after the campaign was sent.
//   3. On YES:
//      a. Re-fetch current calendar prices for the offered stretch.
//      b. Send a follow-up with the correct price (correcting any pricing error).
//      c. Create a Hospitable task to send the guest a direct booking link.
//   4. Mark yes_handled so we don't repeat.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";
const REBOOKING_DISCOUNT_PCT = 10;
const YES_RE = /\byes\b/i;

interface HospitableMessage {
  id: string;
  body: string;
  sender_type: string;
  created_at: string;
}

interface PendingRow {
  id: string;
  property_hospitable_id: string;
  guest_reservation_id: string;
  available_start_date: string;
  available_end_date: string;
  created_at: string;
  quoted_discounted_price_usd: number | null;
}

interface CalendarDay {
  date: string;
  price?: { amount?: number };
}

export interface RebookingReplyResult {
  logId: string;
  stretchStart: string;
  stretchEnd: string;
  guestReservationId: string;
  yesFound: boolean;
  handled: boolean;
  error?: string;
}

async function getMessages(reservationId: string, apiKey: string): Promise<HospitableMessage[]> {
  const res = await fetch(
    `${HOSPITABLE_BASE}/reservations/${reservationId}/messages?per_page=50`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: HospitableMessage[] };
  return json.data ?? [];
}

function hasYesReply(messages: HospitableMessage[], sentAt: string): boolean {
  return messages.some(
    (m) => m.sender_type === "guest" && m.created_at > sentAt && YES_RE.test(m.body),
  );
}

async function getReservation(
  id: string,
  apiKey: string,
): Promise<{ platform: string; guest?: { first_name?: string } } | null> {
  const res = await fetch(`${HOSPITABLE_BASE}/reservations/${id}?include=guest`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { platform: string; guest?: { first_name?: string } };
  };
  return json.data ?? null;
}

async function getAverageNightlyPrice(
  propertyId: string,
  startDate: string,
  endDate: string,
  apiKey: string,
): Promise<number | null> {
  const res = await fetch(
    `${HOSPITABLE_BASE}/properties/${propertyId}/calendar?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { days?: CalendarDay[] } };
  const days = json.data?.days ?? [];
  const prices = days.map((d) => d.price?.amount ?? 0).filter((p) => p > 0);
  if (prices.length === 0) return null;
  return Math.round(prices.reduce((s, p) => s + p, 0) / prices.length / 100);
}

async function createDraftTask(
  reservationId: string,
  guestName: string,
  stretchStart: string,
  stretchEnd: string,
  draftMessage: string,
  apiKey: string,
): Promise<void> {
  const res = await fetch(`${HOSPITABLE_BASE}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: `Reply needed: ${guestName} said YES — ${stretchStart}`,
      description:
        `${guestName} replied YES to the rebooking offer for ${stretchStart}–${stretchEnd}.\n\n` +
        `DRAFT REPLY (review and send manually):\n` +
        `----------------------------------------\n` +
        `${draftMessage}\n` +
        `----------------------------------------\n\n` +
        `Reservation ID: ${reservationId}`,
      reservation_id: reservationId,
      type: "other",
      priority: "high",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[rebooking-reply] createDraftTask ${reservationId} ${res.status}:`, text.slice(0, 200));
  }
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long", day: "numeric", timeZone: "UTC",
  });
}

function followUpMessage(
  firstName: string,
  stretchStart: string,
  stretchEnd: string,
  regularPrice: number | null,
  discountedPrice: number | null,
  quotedPrice: number | null,
): string {
  const hasPriceError =
    quotedPrice !== null && discountedPrice !== null && Math.abs(quotedPrice - discountedPrice) > 5;

  const priceNote =
    regularPrice !== null && discountedPrice !== null
      ? `$${discountedPrice}/night (10% off our regular rate of $${regularPrice}/night)`
      : "a 10% returning-guest discount";

  const opener = hasPriceError
    ? `Quick note — there was a small error in the price we originally sent. The correct rate for ${fmtDate(stretchStart)}–${fmtDate(stretchEnd)} is ${priceNote}. We apologize for any confusion!`
    : `The rate for ${fmtDate(stretchStart)}–${fmtDate(stretchEnd)} is ${priceNote}.`;

  return (
    `Hi ${firstName}! So glad you'd like to come back — we'd love to have you! 🌊\n\n` +
    `${opener}\n\n` +
    `We'll send you a direct booking link shortly with your discount applied. ` +
    `If you have any questions in the meantime, just let us know!\n\n` +
    `— Nella`
  );
}

export async function processRebookingReplies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  options: { dryRun?: boolean } = {},
): Promise<RebookingReplyResult[]> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) throw new Error("HOSPITABLE_API_KEY not configured");

  const { data: rows, error } = await supabaseAdmin
    .from("rebooking_campaign_log")
    .select("*")
    .eq("sent", true)
    .eq("yes_handled", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[rebooking-reply] DB fetch error:", error);
    throw error;
  }

  const pending: PendingRow[] = rows ?? [];
  const results: RebookingReplyResult[] = [];

  for (const row of pending) {
    const result: RebookingReplyResult = {
      logId: row.id,
      stretchStart: row.available_start_date,
      stretchEnd: row.available_end_date,
      guestReservationId: row.guest_reservation_id,
      yesFound: false,
      handled: false,
    };

    try {
      const messages = await getMessages(row.guest_reservation_id, apiKey);
      const yesFound = hasYesReply(messages, row.created_at);
      result.yesFound = yesFound;

      if (yesFound && !options.dryRun) {
        const reservation = await getReservation(row.guest_reservation_id, apiKey);
        const firstName = reservation?.guest?.first_name || "there";
        const isDirect = ["direct", "manual", "website"].includes(
          reservation?.platform?.toLowerCase() ?? "",
        );

        const hospitableAvg = await getAverageNightlyPrice(
          row.property_hospitable_id,
          row.available_start_date,
          row.available_end_date,
          apiKey,
        );

        const regularPrice = hospitableAvg
          ? Math.round(hospitableAvg * (isDirect ? 1 : 1.15))
          : null;
        const discountedPrice = regularPrice
          ? Math.round(regularPrice * (1 - REBOOKING_DISCOUNT_PCT / 100))
          : null;

        const draftMsg = followUpMessage(
          firstName,
          row.available_start_date,
          row.available_end_date,
          regularPrice,
          discountedPrice,
          row.quoted_discounted_price_usd,
        );

        await createDraftTask(
          row.guest_reservation_id,
          firstName,
          row.available_start_date,
          row.available_end_date,
          draftMsg,
          apiKey,
        );

        result.handled = true;
      }

      if (!options.dryRun) {
        const updates: Record<string, boolean> = {};
        if (result.yesFound) updates.yes_detected = true;
        if (result.handled) updates.yes_handled = true;
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin
            .from("rebooking_campaign_log")
            .update(updates)
            .eq("id", row.id);
        }
      }
    } catch (err) {
      console.error(`[rebooking-reply] error on row ${row.id}:`, err);
      result.error = String(err);
    }

    results.push(result);
  }

  return results;
}
