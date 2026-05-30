// Server-only: pre-arrival reminder message.
//
// Runs daily. Finds reservations arriving in 2 days and sends each guest
// a friendly heads-up that their door code will arrive on check-in morning.
//
// Idempotent: pre_arrival_log (UNIQUE on reservation_id) prevents re-sends.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";

// ── Types ────────────────────────────────────────────────────────────────────

interface UpcomingReservation {
  id: string;
  arrival_date: string;
  guest?: { first_name?: string };
}

export interface PreArrivalResult {
  reservationId: string;
  propertySlug: string;
  sent: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysFromNow(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function fetchArrivals(
  propertyId: string,
  arrivalDate: string,
  apiKey: string,
): Promise<UpcomingReservation[]> {
  const url = new URL(`${HOSPITABLE_BASE}/reservations`);
  url.searchParams.append("properties[]", propertyId);
  url.searchParams.set("start_date", arrivalDate);
  url.searchParams.set("end_date", arrivalDate);
  url.searchParams.set("date_query", "checkin");
  url.searchParams.append("status[]", "accepted");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("include", "guest");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: UpcomingReservation[] };
  return json.data ?? [];
}

async function sendMessage(reservationId: string, body: string, apiKey: string): Promise<boolean> {
  const res = await fetch(`${HOSPITABLE_BASE}/reservations/${reservationId}/messages`, {
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
    console.error(`[pre-arrival] sendMessage ${reservationId} ${res.status}:`, text.slice(0, 200));
  }
  return res.ok;
}

function preArrivalMessage(firstName: string, propertyTitle: string): string {
  return (
    `Hi ${firstName}! 🌊 Just a friendly reminder that your stay at ${propertyTitle} is coming up in 2 days — we're so excited to have you!\n\n` +
    `You'll receive your check-in details and door code on the morning of your arrival.\n\n` +
    `In the meantime, if you have any questions at all, don't hesitate to reach out. See you soon!\n\n` +
    `— Nella`
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processPreArrivalMessages(
  properties: Array<{ slug: string; hospitableId: string; title: string }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  options: { dryRun?: boolean } = {},
): Promise<PreArrivalResult[]> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) throw new Error("HOSPITABLE_API_KEY not configured");

  const arrivalDate = daysFromNow(2);
  const results: PreArrivalResult[] = [];

  for (const property of properties) {
    let arrivals: UpcomingReservation[];
    try {
      arrivals = await fetchArrivals(property.hospitableId, arrivalDate, apiKey);
    } catch (err) {
      console.error(`[pre-arrival] fetch error ${property.slug}:`, err);
      continue;
    }

    for (const reservation of arrivals) {
      // Skip if already messaged.
      try {
        const { data: existing } = await supabaseAdmin
          .from("pre_arrival_log")
          .select("sent")
          .eq("reservation_id", reservation.id)
          .maybeSingle();

        if (existing) {
          results.push({
            reservationId: reservation.id,
            propertySlug: property.slug,
            sent: existing.sent,
            skipped: true,
            skipReason: "already_sent",
          });
          continue;
        }
      } catch (err) {
        console.error(`[pre-arrival] DB read error ${reservation.id}:`, err);
      }

      const result: PreArrivalResult = {
        reservationId: reservation.id,
        propertySlug: property.slug,
        sent: false,
      };

      if (!options.dryRun) {
        try {
          const firstName = reservation.guest?.first_name || "there";
          const msg = preArrivalMessage(firstName, property.title);
          result.sent = await sendMessage(reservation.id, msg, apiKey);
        } catch (err) {
          console.error(`[pre-arrival] send error ${reservation.id}:`, err);
          result.error = String(err);
        }

        try {
          await supabaseAdmin.from("pre_arrival_log").upsert(
            {
              reservation_id: reservation.id,
              property_hospitable_id: property.hospitableId,
              sent: result.sent,
            },
            { onConflict: "reservation_id" },
          );
        } catch (err) {
          console.error(`[pre-arrival] DB upsert error ${reservation.id}:`, err);
        }
      }

      results.push(result);
    }
  }

  return results;
}
