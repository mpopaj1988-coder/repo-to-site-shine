// Server-only: post-checkout thank-you message.
//
// Runs daily. Finds reservations that checked out yesterday, sends each guest:
//   - A thank-you
//   - A note that they left a 5-star review and would appreciate one back
//   - The property's direct booking link for future stays
//
// Idempotent: post_checkout_log (UNIQUE on reservation_id) prevents re-sends.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";

// ── Types ────────────────────────────────────────────────────────────────────

interface CheckedOutReservation {
  id: string;
  departure_date: string;
  guest?: { first_name?: string };
}

export interface PostCheckoutResult {
  reservationId: string;
  propertySlug: string;
  sent: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function fetchCheckouts(
  propertyId: string,
  checkoutDate: string,
  apiKey: string,
): Promise<CheckedOutReservation[]> {
  const url = new URL(`${HOSPITABLE_BASE}/reservations`);
  url.searchParams.append("properties[]", propertyId);
  url.searchParams.set("start_date", checkoutDate);
  url.searchParams.set("end_date", checkoutDate);
  url.searchParams.set("date_query", "checkout");
  url.searchParams.append("status[]", "accepted");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("include", "guest");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: CheckedOutReservation[] };
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
    console.error(`[post-checkout] sendMessage ${reservationId} ${res.status}:`, text.slice(0, 200));
  }
  return res.ok;
}

function checkoutMessage(firstName: string, propertyTitle: string, airbnbUrl: string): string {
  return (
    `Hi ${firstName}! 🌊 Thank you so much for staying with us — it was truly a pleasure hosting you at ${propertyTitle}!\n\n` +
    `I've already left you a 5-star review, and it would mean a lot if you could take a moment to leave one for us too. ` +
    `Reviews give us visibility on the booking platform and help us keep welcoming wonderful guests like you! 🙏\n\n` +
    `If you'd ever like to come back, here's the listing: ${airbnbUrl}\n\n` +
    `Hope to see you again soon!\n\n` +
    `— Nella`
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processPostCheckoutMessages(
  properties: Array<{ slug: string; hospitableId: string; title: string; airbnbUrl: string }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  options: { dryRun?: boolean } = {},
): Promise<PostCheckoutResult[]> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) throw new Error("HOSPITABLE_API_KEY not configured");

  const checkoutDate = yesterday();
  const results: PostCheckoutResult[] = [];

  for (const property of properties) {
    let checkouts: CheckedOutReservation[];
    try {
      checkouts = await fetchCheckouts(property.hospitableId, checkoutDate, apiKey);
    } catch (err) {
      console.error(`[post-checkout] fetch error ${property.slug}:`, err);
      continue;
    }

    for (const reservation of checkouts) {
      // Skip if already messaged.
      try {
        const { data: existing } = await supabaseAdmin
          .from("post_checkout_log")
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
        console.error(`[post-checkout] DB read error ${reservation.id}:`, err);
      }

      const result: PostCheckoutResult = {
        reservationId: reservation.id,
        propertySlug: property.slug,
        sent: false,
      };

      if (!options.dryRun) {
        try {
          const firstName = reservation.guest?.first_name || "there";
          const msg = checkoutMessage(firstName, property.title, property.airbnbUrl);
          result.sent = await sendMessage(reservation.id, msg, apiKey);
        } catch (err) {
          console.error(`[post-checkout] send error ${reservation.id}:`, err);
          result.error = String(err);
        }

        try {
          await supabaseAdmin.from("post_checkout_log").upsert(
            {
              reservation_id: reservation.id,
              property_hospitable_id: property.hospitableId,
              sent: result.sent,
            },
            { onConflict: "reservation_id" },
          );
        } catch (err) {
          console.error(`[post-checkout] DB upsert error ${reservation.id}:`, err);
        }
      }

      results.push(result);
    }
  }

  return results;
}
