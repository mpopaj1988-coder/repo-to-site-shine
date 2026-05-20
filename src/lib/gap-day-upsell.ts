const HOSPITABLE_API = "https://public.api.hospitable.com/v2";

// Guests are charged 40% of the rack rate for the gap night.
const DISCOUNT_FACTOR = 0.4;

export type HospReservation = {
  uuid: string;
  check_in: string;
  check_out: string;
  status: string;
  guest?: {
    first_name?: string;
    last_name?: string;
  };
};

export type PriceInfo = {
  originalCents: number;
  discountedCents: number;
  currency: string;
  originalDollars: number;
  discountedDollars: number;
};

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return fmtDate(d);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

async function fetchReservationPage(
  propertyId: string,
  apiKey: string,
  startDate: string,
  endDate: string,
  dateQuery: "checkin" | "checkout",
): Promise<HospReservation[]> {
  const url = new URL(`${HOSPITABLE_API}/reservations`);
  url.searchParams.set("properties[]", propertyId);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("date_query", dateQuery);
  url.searchParams.append("status[]", "accepted");
  url.searchParams.set("include", "guest");
  url.searchParams.set("per_page", "100");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) {
    console.error(
      `Hospitable reservations (${dateQuery}) ${propertyId}: HTTP ${res.status}`,
    );
    return [];
  }
  const json = (await res.json()) as { data?: HospReservation[] };
  return Array.isArray(json.data) ? json.data : [];
}

// Fetches all accepted reservations for a property within a rolling window,
// querying by both checkin and checkout to catch reservations that straddle
// the window boundary (e.g. a long stay that checks out 3 days from now).
export async function fetchPropertyReservations(
  propertyId: string,
  apiKey: string,
  windowDays = 60,
): Promise<HospReservation[]> {
  const start = fmtDate(new Date());
  const end = addDays(start, windowDays);

  const [byCheckin, byCheckout] = await Promise.all([
    fetchReservationPage(propertyId, apiKey, start, end, "checkin"),
    fetchReservationPage(propertyId, apiKey, start, end, "checkout"),
  ]);

  const byUuid = new Map<string, HospReservation>();
  for (const r of [...byCheckin, ...byCheckout]) {
    byUuid.set(r.uuid, r);
  }
  return [...byUuid.values()].sort((a, b) =>
    a.check_in.localeCompare(b.check_in),
  );
}

// Returns pairs of consecutive reservations with exactly one open night between them.
export function findGaps(reservations: HospReservation[]): Array<{
  gapDate: string;
  checkoutRes: HospReservation;
  checkinRes: HospReservation;
}> {
  const gaps: Array<{
    gapDate: string;
    checkoutRes: HospReservation;
    checkinRes: HospReservation;
  }> = [];

  for (let i = 0; i < reservations.length - 1; i++) {
    const a = reservations[i];
    const b = reservations[i + 1];
    // One open night: B checks in exactly 1 day after A checks out.
    if (b.check_in === addDays(a.check_out, 1)) {
      gaps.push({ gapDate: a.check_out, checkoutRes: a, checkinRes: b });
    }
  }
  return gaps;
}

export async function fetchGapPrice(
  propertyId: string,
  gapDate: string,
  apiKey: string,
): Promise<PriceInfo | null> {
  const url = `${HOSPITABLE_API}/properties/${propertyId}/calendar?start_date=${gapDate}&end_date=${gapDate}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: {
      days?: Array<{ price?: { amount?: number; currency?: string } }>;
    };
  };
  const day = json.data?.days?.[0];
  const amt = day?.price?.amount;
  if (typeof amt !== "number" || amt <= 0) return null;
  const currency = day?.price?.currency ?? "USD";
  const discountedCents = Math.round(amt * DISCOUNT_FACTOR);
  return {
    originalCents: amt,
    discountedCents,
    currency,
    originalDollars: Math.round(amt / 100),
    discountedDollars: Math.round(discountedCents / 100),
  };
}

export async function fetchGuestFirstName(
  reservationUuid: string,
  apiKey: string,
): Promise<string> {
  try {
    const res = await fetch(
      `${HOSPITABLE_API}/reservations/${reservationUuid}?include=guest`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return "there";
    const json = (await res.json()) as {
      data?: { guest?: { first_name?: string } };
    };
    return json.data?.guest?.first_name ?? "there";
  } catch {
    return "there";
  }
}

export async function sendHospitableMessage(
  reservationUuid: string,
  body: string,
  apiKey: string,
): Promise<boolean> {
  const res = await fetch(
    `${HOSPITABLE_API}/reservations/${reservationUuid}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error(
      `Hospitable message failed (${reservationUuid}): HTTP ${res.status}`,
      err.slice(0, 200),
    );
  }
  return res.ok;
}

export function buildCheckoutMessage(
  guestFirstName: string,
  gapDate: string,
  price: PriceInfo,
): string {
  const night = formatDate(gapDate);
  return (
    `Hi ${guestFirstName}!\n\n` +
    `We have an exclusive offer just for you — ${night} is open right after your current stay.\n\n` +
    `Extend your trip by one extra night for just $${price.discountedDollars} ` +
    `(that's 40% of our regular $${price.originalDollars} nightly rate).\n\n` +
    `Interested? Simply reply "Interested" to this message and we'll take care of everything right away.\n\n` +
    `Hope you're having a wonderful stay!\n` +
    `— Sea & City Rentals`
  );
}

export function buildCheckinMessage(
  guestFirstName: string,
  gapDate: string,
  price: PriceInfo,
): string {
  const night = formatDate(gapDate);
  return (
    `Hi ${guestFirstName}!\n\n` +
    `Great news — ${night}, the night before your check-in, is available at a special rate.\n\n` +
    `Arrive a day early for just $${price.discountedDollars} ` +
    `(that's 40% of our regular $${price.originalDollars} nightly rate).\n\n` +
    `Interested? Just reply "Interested" and we'll arrange everything before your arrival.\n\n` +
    `Looking forward to welcoming you!\n` +
    `— Sea & City Rentals`
  );
}

export function buildFulfillMessage(
  guestFirstName: string,
  gapDate: string,
  price: PriceInfo,
): string {
  const night = formatDate(gapDate);
  return (
    `Hi ${guestFirstName}! Great news — we're locking in your extra night.\n\n` +
    `Here are your details:\n` +
    `• Night: ${night}\n` +
    `• Your rate: $${price.discountedDollars} (40% of our regular $${price.originalDollars} rate)\n\n` +
    `We'll update your reservation and send a confirmation shortly. ` +
    `If you have any questions in the meantime, just reply here.\n\n` +
    `Thank you for choosing Sea & City Rentals — we can't wait to host you for that extra night!\n` +
    `— Sea & City Rentals`
  );
}
