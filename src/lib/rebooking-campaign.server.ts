// Server-only: re-booking campaign for past guests.
//
// For each property, scans the next 90 days for open stretches (≥2 nights).
// For each stretch, looks back exactly 1 year ±14 days to find guests who
// stayed during that same window.  Sends each matched guest a personalised
// "come back at 10% off" message — once per (guest, open window) pair.

const HOSPITABLE_BASE = "https://public.api.hospitable.com/v2";
const REBOOKING_DISCOUNT_PCT = 10;
const SCAN_DAYS = 90;
const ANNIVERSARY_WINDOW_DAYS = 14;
const MIN_STRETCH_NIGHTS = 2;

// Returns true if a date falls within a high-season blackout window where
// no discount should be offered.
function isHighSeason(dateStr: string): boolean {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  const month = d.getUTCMonth() + 1; // 1-12
  const day = d.getUTCDate();

  // February and March — peak Florida season
  if (month === 2 || month === 3) return true;

  // Christmas week: Dec 23 – Jan 1
  if (month === 12 && day >= 23) return true;
  if (month === 1 && day <= 1) return true;

  // Thanksgiving week: Thu of 4th week of Nov + surrounding days (Nov 20-30)
  if (month === 11 && day >= 20) return true;

  // 4th of July window: Jun 30 – Jul 4
  if (month === 6 && day >= 30) return true;
  if (month === 7 && day <= 4) return true;

  return false;
}

// Returns true if any night in the stretch falls in a high-season window.
function stretchIsHighSeason(start: string, nights: number): boolean {
  for (let i = 0; i < nights; i++) {
    if (isHighSeason(addDays(start, i))) return true;
  }
  return false;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CalendarDay {
  date: string;
  status: { available: boolean };
  price?: { amount?: number };
}

interface PastReservation {
  id: string;
  platform: string;
  arrival_date: string;
  departure_date: string;
  nights: number;
  guest?: { first_name?: string };
}

interface OpenStretch {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD (inclusive last night)
  nights: number;
}

export interface RebookingResult {
  propertyId: string;
  propertySlug: string;
  stretchStart: string;
  stretchEnd: string;
  guestReservationId: string;
  sent: boolean;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(dateStr: string): string {
  return dateStr.slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function fmtMonthYear(dateStr: string): string {
  return new Date(dateStr.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long", year: "numeric", timeZone: "UTC",
  });
}

// ── Hospitable API calls ──────────────────────────────────────────────────────

async function fetchCalendar(
  propertyId: string,
  startDate: string,
  endDate: string,
  apiKey: string,
): Promise<CalendarDay[]> {
  const url =
    `${HOSPITABLE_BASE}/properties/${propertyId}/calendar` +
    `?start_date=${startDate}&end_date=${endDate}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: { days?: CalendarDay[] } };
  return json.data?.days ?? [];
}

async function fetchPastReservations(
  propertyId: string,
  startDate: string,
  endDate: string,
  apiKey: string,
): Promise<PastReservation[]> {
  const results: PastReservation[] = [];
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
    if (!res.ok) break;

    const json = (await res.json()) as {
      data?: PastReservation[];
      meta?: { last_page?: number };
    };
    results.push(...(json.data ?? []));
    if (page >= (json.meta?.last_page ?? 1)) break;
    page++;
  }

  return results;
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
    console.error(`[rebooking] sendMessage ${reservationId} ${res.status}:`, text.slice(0, 200));
  }
  return res.ok;
}

// ── Open-stretch detection ────────────────────────────────────────────────────

function findOpenStretches(days: CalendarDay[]): OpenStretch[] {
  const stretches: OpenStretch[] = [];
  let runStart: string | null = null;
  let runLength = 0;

  for (const day of days) {
    if (day.status.available) {
      if (!runStart) runStart = day.date;
      runLength++;
    } else {
      if (runStart && runLength >= MIN_STRETCH_NIGHTS) {
        stretches.push({
          start: runStart,
          end: addDays(runStart, runLength - 1),
          nights: runLength,
        });
      }
      runStart = null;
      runLength = 0;
    }
  }
  if (runStart && runLength >= MIN_STRETCH_NIGHTS) {
    stretches.push({ start: runStart, end: addDays(runStart, runLength - 1), nights: runLength });
  }

  return stretches;
}

// ── Message copy ──────────────────────────────────────────────────────────────

function rebookingMessage(
  firstName: string,
  propertyTitle: string,
  pastArrival: string,
  stretchStart: string,
  stretchEnd: string,
  nights: number,
  discountedNightlyRate: number | null,
): string {
  const pastMonth = fmtMonthYear(pastArrival);
  const fromDate = fmtDate(stretchStart);
  const toDate = fmtDate(stretchEnd);
  const nightsLabel = nights === 1 ? "1 night" : `${nights} nights`;
  const priceNote =
    discountedNightlyRate !== null
      ? ` at just $${discountedNightlyRate}/night (10% off our regular rate) —`
      : " —";

  return (
    `Hi ${firstName}! 🌊 Hope you've been well since your stay with us in ${pastMonth}!\n\n` +
    `We noticed ${nightsLabel} just opened up — ${fromDate} through ${toDate} — at ${propertyTitle}. ` +
    `That's right around the same time you were here last year, so we wanted you to have first dibs.\n\n` +
    `We'd love to welcome you back${priceNote} reply **YES** if you're interested and we'll get you all the details and your returning-guest discount. ` +
    `Or simply ignore this if the timing doesn't work — no worries at all!\n\n` +
    `— Nella`
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processRebookingCampaign(
  properties: Array<{ slug: string; hospitableId: string; title: string }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  options: { dryRun?: boolean } = {},
): Promise<RebookingResult[]> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  if (!apiKey) throw new Error("HOSPITABLE_API_KEY not configured");

  const today = new Date().toISOString().slice(0, 10);
  const scanEnd = addDays(today, SCAN_DAYS);
  const results: RebookingResult[] = [];

  for (const property of properties) {
    // Fetch calendar for next 90 days.
    let calendarDays: CalendarDay[];
    try {
      calendarDays = await fetchCalendar(property.hospitableId, today, scanEnd, apiKey);
    } catch (err) {
      console.error(`[rebooking] calendar fetch error ${property.slug}:`, err);
      continue;
    }

    const stretches = findOpenStretches(calendarDays);
    if (stretches.length === 0) continue;

    for (const stretch of stretches) {
      // Skip high-season windows — no discount offered during peak dates.
      if (stretchIsHighSeason(stretch.start, stretch.nights)) continue;

      // Anniversary window: same dates last year ±14 days.
      const lastYearStart = addDays(addDays(stretch.start, -365), -ANNIVERSARY_WINDOW_DAYS);
      const lastYearEnd = addDays(addDays(stretch.start, -365), ANNIVERSARY_WINDOW_DAYS);

      let pastGuests: PastReservation[];
      try {
        pastGuests = await fetchPastReservations(
          property.hospitableId,
          lastYearStart,
          lastYearEnd,
          apiKey,
        );
      } catch (err) {
        console.error(`[rebooking] past guest fetch error ${property.slug}/${stretch.start}:`, err);
        continue;
      }

      for (const past of pastGuests) {
        // Skip if already messaged this guest about this stretch.
        try {
          const { data: existing } = await supabaseAdmin
            .from("rebooking_campaign_log")
            .select("sent")
            .eq("property_hospitable_id", property.hospitableId)
            .eq("guest_reservation_id", past.id)
            .eq("available_start_date", stretch.start)
            .maybeSingle();

          if (existing?.sent) {
            results.push({
              propertyId: property.hospitableId,
              propertySlug: property.slug,
              stretchStart: stretch.start,
              stretchEnd: stretch.end,
              guestReservationId: past.id,
              sent: true,
              skipped: true,
              skipReason: "already_sent",
            });
            continue;
          }
        } catch (err) {
          console.error(`[rebooking] DB read error ${property.slug}/${past.id}:`, err);
        }

        const result: RebookingResult = {
          propertyId: property.hospitableId,
          propertySlug: property.slug,
          stretchStart: stretch.start,
          stretchEnd: stretch.end,
          guestReservationId: past.id,
          sent: false,
        };

        if (!options.dryRun) {
          try {
            const firstName = past.guest?.first_name || "there";
            // Average the Hospitable nightly price across every night in the stretch.
            // Airbnb automatically adds 15% on top, so quote that rate with 10% off.
            const stretchDays = calendarDays.filter(
              (d) => toISO(d.date) >= stretch.start && toISO(d.date) <= stretch.end,
            );
            const priceSum = stretchDays.reduce(
              (sum, d) => sum + (d.price?.amount ?? 0),
              0,
            );
            const hospitableNightly =
              stretchDays.length > 0 && priceSum > 0
                ? Math.round(priceSum / stretchDays.length / 100)
                : null;
            const isDirect = ["direct", "manual", "website"].includes(
              past.platform?.toLowerCase() ?? "",
            );
            const regularNightly = hospitableNightly
              ? Math.round(hospitableNightly * (isDirect ? 1 : 1.15))
              : null;
            const discountedNightly = regularNightly
              ? Math.round(regularNightly * (1 - REBOOKING_DISCOUNT_PCT / 100))
              : null;

            const msg = rebookingMessage(
              firstName,
              property.title,
              toISO(past.arrival_date),
              stretch.start,
              stretch.end,
              stretch.nights,
              discountedNightly,
            );

            result.sent = await sendMessage(past.id, msg, apiKey);
          } catch (err) {
            console.error(`[rebooking] send error ${past.id}:`, err);
            result.error = String(err);
          }

          // Log regardless of send outcome so we can retry selectively.
          try {
            await supabaseAdmin.from("rebooking_campaign_log").upsert(
              {
                property_hospitable_id: property.hospitableId,
                guest_reservation_id: past.id,
                available_start_date: stretch.start,
                available_end_date: stretch.end,
                sent: result.sent,
              },
              { onConflict: "property_hospitable_id,guest_reservation_id,available_start_date" },
            );
          } catch (err) {
            console.error(`[rebooking] DB upsert error ${property.slug}/${past.id}:`, err);
          }
        }

        results.push(result);
      }
    }
  }

  return results;
}
