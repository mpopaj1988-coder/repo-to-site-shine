// Server-only: processes guest YES replies to orphan-day upsell messages.
//
// Flow per pending log row:
//   1. Fetch recent messages on the reservation's conversation.
//   2. Look for guest messages containing "yes" posted after our upsell was sent.
//   3. On YES:
//      a. For direct/manual reservations: attempt to extend via Hospitable update-reservation.
//      b. For all reservations: create a Hospitable task reminding the host to send an alteration.
//      c. Send a confirmation message to the guest.
//   4. Mark the alteration_handled column so we don't repeat this.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";

const YES_RE = /\byes\b/i;

// ── Types ────────────────────────────────────────────────────────────────────

interface HospitableMessage {
  id: string;
  body: string;
  sender_type: string; // "guest" | "host" | "automated"
  created_at: string;
}

interface PendingRow {
  id: string;
  property_hospitable_id: string;
  orphan_date: string;
  outgoing_reservation_id: string;
  incoming_reservation_id: string;
  outgoing_sent: boolean;
  incoming_sent: boolean;
  outgoing_yes_detected: boolean;
  incoming_yes_detected: boolean;
  outgoing_alteration_handled: boolean;
  incoming_alteration_handled: boolean;
  discounted_price_usd: number | null;
  created_at: string;
}

interface ReservationDetail {
  id: string;
  conversation_id: string;
  platform: string; // "airbnb" | "vrbo" | "direct" | "manual" | ...
  arrival_date: string;
  departure_date: string;
  guest?: { first_name?: string };
}

export interface ReplyProcessResult {
  logId: string;
  orphanDate: string;
  outgoing: { yesFound: boolean; handled: boolean };
  incoming: { yesFound: boolean; handled: boolean };
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getReservation(id: string, apiKey: string): Promise<ReservationDetail | null> {
  const res = await fetch(`${HOSPITABLE_BASE}/reservations/${id}?include=guest`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: ReservationDetail };
  return json.data ?? null;
}

async function getMessages(conversationId: string, apiKey: string): Promise<HospitableMessage[]> {
  const res = await fetch(
    `${HOSPITABLE_BASE}/conversations/${conversationId}/messages?per_page=50&sort=created_at`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: HospitableMessage[] };
  return json.data ?? [];
}

// Returns true if any guest message after `sentAt` contains "yes".
function hasYesReply(messages: HospitableMessage[], sentAt: string): boolean {
  return messages.some(
    (m) =>
      m.sender_type === "guest" &&
      m.created_at > sentAt &&
      YES_RE.test(m.body),
  );
}

async function sendMessage(conversationId: string, body: string, apiKey: string): Promise<boolean> {
  const res = await fetch(`${HOSPITABLE_BASE}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ body }),
  });
  return res.ok;
}

// Create a task for the host to send an alteration request.
async function createAlterationTask(
  reservationId: string,
  guestName: string,
  orphanDate: string,
  direction: "outgoing" | "incoming",
  discountedPrice: number | null,
  apiKey: string,
): Promise<boolean> {
  const action = direction === "outgoing" ? "extend checkout by 1 night" : "move check-in 1 night earlier";
  const priceNote = discountedPrice ? ` at $${discountedPrice}` : "";
  const title = `ACTION NEEDED: Send alteration request to ${guestName} for ${orphanDate}`;
  const description =
    `Guest ${guestName} replied YES to the orphan-day upsell for ${orphanDate}.\n` +
    `Please ${action}${priceNote} by sending them an alteration request on the platform they booked through.\n` +
    `Reservation ID: ${reservationId}`;

  const res = await fetch(`${HOSPITABLE_BASE}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title,
      description,
      reservation_id: reservationId,
      type: "other",
      priority: "high",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[orphan-reply] createTask ${reservationId} ${res.status}:`, text.slice(0, 200));
  }
  return res.ok;
}

// Attempt to extend/move a direct/manual reservation via the Hospitable API.
// Returns false if the platform isn't updatable (Airbnb, VRBO, etc.).
async function extendDirectReservation(
  reservation: ReservationDetail,
  direction: "outgoing" | "incoming",
  apiKey: string,
): Promise<boolean> {
  const DIRECT_PLATFORMS = new Set(["direct", "manual", "website"]);
  if (!DIRECT_PLATFORMS.has(reservation.platform?.toLowerCase())) return false;

  const newDeparture =
    direction === "outgoing"
      ? shiftDate(reservation.departure_date, 1)
      : reservation.departure_date;
  const newArrival =
    direction === "incoming"
      ? shiftDate(reservation.arrival_date, -1)
      : reservation.arrival_date;

  const res = await fetch(`${HOSPITABLE_BASE}/reservations/${reservation.id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      arrival_date: newArrival.slice(0, 10),
      departure_date: newDeparture.slice(0, 10),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[orphan-reply] extendDirect ${reservation.id} ${res.status}:`, text.slice(0, 200));
  }
  return res.ok;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function confirmationMessage(
  firstName: string,
  orphanDate: string,
  direction: "outgoing" | "incoming",
): string {
  const action =
    direction === "outgoing"
      ? `extend your stay through ${orphanDate}`
      : `move your check-in to ${orphanDate}`;
  return (
    `Hi ${firstName}! Great news — we received your YES! 🎉\n\n` +
    `We're processing your request to ${action}. ` +
    `You'll receive an alteration request through your booking platform shortly — just accept it and you're all set!\n\n` +
    `If you have any questions in the meantime, don't hesitate to reach out.\n\n` +
    `— Sea & City Rentals`
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processUpsellReplies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  options: { dryRun?: boolean } = {},
): Promise<ReplyProcessResult[]> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) throw new Error("HOSPITABLE_API_KEY not configured");

  // Fetch rows where at least one message was sent but the alteration hasn't been handled yet.
  const { data: rows, error } = await supabaseAdmin
    .from("orphan_upsell_log")
    .select("*")
    .or(
      "and(outgoing_sent.eq.true,outgoing_alteration_handled.eq.false)," +
      "and(incoming_sent.eq.true,incoming_alteration_handled.eq.false)",
    )
    .order("orphan_date", { ascending: true });

  if (error) {
    console.error("[orphan-reply] DB fetch error:", error);
    throw error;
  }

  const pending: PendingRow[] = rows ?? [];
  const results: ReplyProcessResult[] = [];

  for (const row of pending) {
    const result: ReplyProcessResult = {
      logId: row.id,
      orphanDate: row.orphan_date,
      outgoing: { yesFound: row.outgoing_yes_detected, handled: row.outgoing_alteration_handled },
      incoming: { yesFound: row.incoming_yes_detected, handled: row.incoming_alteration_handled },
    };

    try {
      // ── Outgoing guest (checking out, wants to extend) ──────────────────────
      if (row.outgoing_sent && !row.outgoing_alteration_handled) {
        const reservation = await getReservation(row.outgoing_reservation_id, apiKey);
        if (reservation) {
          const messages = await getMessages(reservation.conversation_id, apiKey);
          const yesFound = hasYesReply(messages, row.created_at);
          result.outgoing.yesFound = yesFound;

          if (yesFound && !options.dryRun) {
            const firstName = reservation.guest?.first_name || "there";
            // Try direct extension first; always create a task for the host.
            await extendDirectReservation(reservation, "outgoing", apiKey);
            await createAlterationTask(
              reservation.id,
              firstName,
              row.orphan_date,
              "outgoing",
              row.discounted_price_usd,
              apiKey,
            );
            await sendMessage(
              reservation.conversation_id,
              confirmationMessage(firstName, row.orphan_date, "outgoing"),
              apiKey,
            );
            result.outgoing.handled = true;
          }
        }
      }

      // ── Incoming guest (checking in, wants early arrival) ───────────────────
      if (row.incoming_sent && !row.incoming_alteration_handled) {
        const reservation = await getReservation(row.incoming_reservation_id, apiKey);
        if (reservation) {
          const messages = await getMessages(reservation.conversation_id, apiKey);
          const yesFound = hasYesReply(messages, row.created_at);
          result.incoming.yesFound = yesFound;

          if (yesFound && !options.dryRun) {
            const firstName = reservation.guest?.first_name || "there";
            await extendDirectReservation(reservation, "incoming", apiKey);
            await createAlterationTask(
              reservation.id,
              firstName,
              row.orphan_date,
              "incoming",
              row.discounted_price_usd,
              apiKey,
            );
            await sendMessage(
              reservation.conversation_id,
              confirmationMessage(firstName, row.orphan_date, "incoming"),
              apiKey,
            );
            result.incoming.handled = true;
          }
        }
      }

      // ── Persist updated flags ───────────────────────────────────────────────
      if (!options.dryRun) {
        const updates: Record<string, boolean> = {};
        if (result.outgoing.yesFound) updates.outgoing_yes_detected = true;
        if (result.incoming.yesFound) updates.incoming_yes_detected = true;
        if (result.outgoing.handled) updates.outgoing_alteration_handled = true;
        if (result.incoming.handled) updates.incoming_alteration_handled = true;

        if (Object.keys(updates).length > 0) {
          await supabaseAdmin
            .from("orphan_upsell_log")
            .update(updates)
            .eq("id", row.id);
        }
      }
    } catch (err) {
      console.error(`[orphan-reply] error on row ${row.id}:`, err);
      result.error = String(err);
    }

    results.push(result);
  }

  return results;
}
