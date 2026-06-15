import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

export type Pricing = {
  min: number;
  max: number;
  avg: number;
  currency: string;
} | null;

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  available: boolean;
  price: number | null; // unit currency (e.g., dollars)
  currency: string;
  minNights: number | null;
};

export type ReviewItem = {
  id: string;
  rating: number;
  text: string;
  date: string;
  reviewer?: string;
};

type Entry = { value: Pricing; fresh: number; stale: number; refreshing?: boolean };
const cache = new Map<string, Entry>();
type ReviewEntry = { value: ReviewItem[]; fresh: number; stale: number; refreshing?: boolean };
const reviewCache = new Map<string, ReviewEntry>();
const FRESH_MS = 60 * 60 * 1000; // 1h fresh
const STALE_MS = 24 * 60 * 60 * 1000; // serve stale up to 24h while revalidating
const ERROR_MS = 5 * 60 * 1000;

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function fetchPricing(id: string, apiKey: string): Promise<Pricing> {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 90);
  const url = `https://public.api.hospitable.com/v2/properties/${id}/calendar?start_date=${fmtDate(start)}&end_date=${fmtDate(end)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { days?: Array<{ price?: { amount?: number; currency?: string } }> };
  };
  const days = json.data?.days ?? [];
  const prices: number[] = [];
  let currency = "USD";
  for (const d of days) {
    const amt = d.price?.amount;
    if (typeof amt === "number" && amt > 0) {
      prices.push(amt / 100);
      if (d.price?.currency) currency = d.price.currency;
    }
  }
  if (prices.length === 0) return null;
  const min = Math.round(Math.min(...prices));
  const max = Math.round(Math.max(...prices));
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  return { min, max, avg, currency };
}

function store(id: string, value: Pricing, ok: boolean) {
  const now = Date.now();
  const fresh = ok ? now + FRESH_MS : now + ERROR_MS;
  const stale = ok ? now + STALE_MS : now + ERROR_MS;
  cache.set(id, { value, fresh, stale });
}

export const getListingPricing = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<Pricing> => {
    const id = data.id;
    const now = Date.now();
    const apiKey = process.env.HOSPITABLE_API_KEY;

    // Hint downstream caches (CDN, browser) — public, 1h fresh, 1d stale.
    try {
      setResponseHeader(
        "Cache-Control",
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      );
    } catch {
      /* not in a request context */
    }

    const cached = cache.get(id);
    if (cached) {
      if (cached.fresh > now) return cached.value;
      if (cached.stale > now) {
        // Stale — return immediately, refresh in background (single-flight).
        if (apiKey && !cached.refreshing) {
          cached.refreshing = true;
          void fetchPricing(id, apiKey)
            .then((v) => store(id, v, v !== null))
            .catch(() => store(id, cached.value, false));
        }
        return cached.value;
      }
    }

    if (!apiKey) return null;

    try {
      const value = await fetchPricing(id, apiKey);
      store(id, value, value !== null);
      return value;
    } catch {
      store(id, null, false);
      return null;
    }
  });

async function fetchReviews(id: string, apiKey: string): Promise<ReviewItem[]> {
  const url = `https://public.api.hospitable.com/v2/properties/${id}/reviews?per_page=50&sort=reviewed_at&direction=desc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      reviewed_at?: string;
      public?: { rating?: number; review?: string; reviewer?: string };
    }>;
  };
  return (json.data ?? [])
    .filter((r) => r.public?.review && (r.public?.rating ?? 0) >= 4)
    .slice(0, 30)
    .map((r) => ({
      id: r.id,
      rating: r.public!.rating!,
      text: r.public!.review!,
      date: (r.reviewed_at ?? "").slice(0, 10),
      reviewer: r.public?.reviewer,
    }));
}

function storeReviews(id: string, value: ReviewItem[], ok: boolean) {
  const now = Date.now();
  reviewCache.set(id, {
    value,
    fresh: ok ? now + FRESH_MS : now + ERROR_MS,
    stale: ok ? now + STALE_MS : now + ERROR_MS,
  });
}

export const getListingReviews = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<ReviewItem[]> => {
    const id = data.id;
    const now = Date.now();
    const apiKey = process.env.HOSPITABLE_API_KEY;
    try {
      // Keep reviews out of the CDN cache so low-star filter changes take effect immediately.
      setResponseHeader("Cache-Control", "private, max-age=0");
    } catch {
      /* not in request context */
    }
    const cached = reviewCache.get(id);
    if (cached) {
      if (cached.fresh > now) return cached.value;
      if (cached.stale > now) {
        if (apiKey && !cached.refreshing) {
          cached.refreshing = true;
          void fetchReviews(id, apiKey)
            .then((v) => storeReviews(id, v, v.length > 0))
            .catch(() => storeReviews(id, cached.value, false));
        }
        return cached.value;
      }
    }
    if (!apiKey) return [];
    try {
      const value = await fetchReviews(id, apiKey);
      storeReviews(id, value, value.length > 0);
      return value;
    } catch {
      storeReviews(id, [], false);
      return [];
    }
  });

// ============================================================
// Availability (calendar) — used by inline availability picker
// ============================================================

type AvailEntry = { value: CalendarDay[]; fresh: number; stale: number; refreshing?: boolean };
const availCache = new Map<string, AvailEntry>();
const AVAIL_FRESH_MS = 15 * 60 * 1000; // 15 min fresh (more dynamic than pricing)
const AVAIL_STALE_MS = 6 * 60 * 60 * 1000; // 6h stale

async function fetchAvailability(id: string, apiKey: string): Promise<CalendarDay[]> {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 365); // 1 year out
  const url = `https://public.api.hospitable.com/v2/properties/${id}/calendar?start_date=${fmtDate(start)}&end_date=${fmtDate(end)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: {
      days?: Array<{
        date?: string;
        min_stay?: number;
        status?: { available?: boolean };
        price?: { amount?: number; currency?: string };
      }>;
    };
  };
  return (json.data?.days ?? []).map((d) => ({
    date: (d.date ?? "").slice(0, 10),
    available: d.status?.available ?? false,
    price: typeof d.price?.amount === "number" ? d.price.amount / 100 : null,
    currency: d.price?.currency ?? "USD",
    minNights: d.min_stay ?? null,
  }));
}

function storeAvail(id: string, value: CalendarDay[], ok: boolean) {
  const now = Date.now();
  availCache.set(id, {
    value,
    fresh: ok ? now + AVAIL_FRESH_MS : now + ERROR_MS,
    stale: ok ? now + AVAIL_STALE_MS : now + ERROR_MS,
  });
}

export const getListingAvailability = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<CalendarDay[]> => {
    const id = data.id;
    const now = Date.now();
    const apiKey = process.env.HOSPITABLE_API_KEY;
    try {
      setResponseHeader(
        "Cache-Control",
        "public, max-age=900, s-maxage=900, stale-while-revalidate=21600",
      );
    } catch {
      /* not in request context */
    }
    const cached = availCache.get(id);
    if (cached) {
      if (cached.fresh > now) return cached.value;
      if (cached.stale > now) {
        if (apiKey && !cached.refreshing) {
          cached.refreshing = true;
          void fetchAvailability(id, apiKey)
            .then((v) => storeAvail(id, v, v.length > 0))
            .catch(() => storeAvail(id, cached.value, false));
        }
        return cached.value;
      }
    }
    if (!apiKey) return [];
    try {
      const value = await fetchAvailability(id, apiKey);
      storeAvail(id, value, value.length > 0);
      return value;
    } catch {
      storeAvail(id, [], false);
      return [];
    }
  });

// ============================================================
// Quote — exact pricing breakdown for a specific date range
// ============================================================

export type Quote = {
  accommodation: number; // dollars
  cleaningFee: number;   // dollars
  totalBeforeTax: number; // dollars
  currency: string;
} | null;

type QuoteCacheEntry = { value: Quote; expires: number };
const quoteCache = new Map<string, QuoteCacheEntry>();
const QUOTE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Cleaning fee fallback cache — keyed by property ID, refreshed every 24h.
type FeeEntry = { amount: number; expires: number };
const cleaningFeeCache = new Map<string, FeeEntry>();
const CLEANING_FEE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchCleaningFeeFromReservations(id: string, apiKey: string): Promise<number> {
  const cached = cleaningFeeCache.get(id);
  if (cached && cached.expires > Date.now()) return cached.amount;

  try {
    const url = `https://public.api.hospitable.com/v2/reservations?properties[]=${id}&status[]=accepted&include=financials&per_page=5&sort=check_in&direction=desc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!res.ok) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as Record<string, any>;
    for (const r of (json?.data ?? []) as Array<Record<string, any>>) {
      const fees: Array<Record<string, any>> = r?.financials?.host?.guest_fees ?? [];
      const cf = fees.find((f) => typeof f.label === "string" && f.label.toLowerCase().includes("cleaning"));
      if (cf && (cf.amount as number) > 0) {
        const amount = (cf.amount as number) / 100;
        cleaningFeeCache.set(id, { amount, expires: Date.now() + CLEANING_FEE_TTL_MS });
        return amount;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

export const getListingQuote = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; checkIn: string; checkOut: string; adults: number }) => data)
  .handler(async ({ data }): Promise<Quote> => {
    const apiKey = process.env.HOSPITABLE_API_KEY;
    if (!apiKey) return null;

    const cacheKey = `${data.id}:${data.checkIn}:${data.checkOut}:${data.adults}`;
    const cached = quoteCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.value;

    const url = `https://public.api.hospitable.com/v2/properties/${data.id}/quote`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          checkin_date: data.checkIn,
          checkout_date: data.checkOut,
          guests: { adults: Math.max(1, data.adults) },
        }),
      });
      if (!res.ok) {
        console.error("Hospitable quote error", res.status, await res.text());
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as Record<string, any>;
      const d = json?.data;
      let accommodation = 0;
      let cleaningFee = 0;
      let currency = "USD";

      // Format A: data.pricing with fees array (most common in Hospitable v2)
      const pricing = d?.pricing;
      if (pricing) {
        accommodation = ((pricing.accommodation?.amount ?? pricing.nightly_rate?.amount ?? pricing.base_price?.amount ?? 0) as number) / 100;
        currency = (pricing.accommodation?.currency ?? pricing.currency ?? d?.currency ?? "USD") as string;
        // Cleaning fee may live in pricing.fees[] or pricing.cleaning_fee
        if (Array.isArray(pricing.fees)) {
          for (const fee of pricing.fees as Array<Record<string, unknown>>) {
            const t = (fee.type ?? fee.kind ?? "") as string;
            if (t === "cleaning_fee" || t === "cleaning") {
              cleaningFee = ((fee.amount ?? 0) as number) / 100;
            }
          }
        }
        if (cleaningFee === 0 && pricing.cleaning_fee) {
          cleaningFee = ((pricing.cleaning_fee?.amount ?? pricing.cleaning_fee ?? 0) as number) / 100;
        }
      }

      // Format B: data.line_items array
      else if (Array.isArray(d?.line_items)) {
        currency = (d.currency ?? "USD") as string;
        for (const item of d.line_items as Array<Record<string, unknown>>) {
          const amt = ((item.amount ?? item.value ?? 0) as number);
          const t = (item.type ?? item.kind ?? "") as string;
          if (t === "accommodation" || t === "nightly_rate" || t === "base_price") {
            accommodation = amt / 100;
          } else if (t === "cleaning_fee" || t === "cleaning") {
            cleaningFee = amt / 100;
          }
        }
      }

      // Format C: data.prices flat object
      else if (d?.prices) {
        const p = d.prices as Record<string, number>;
        accommodation = (p.nightly_rate ?? p.accommodation ?? p.base_price ?? 0) / 100;
        cleaningFee = (p.cleaning_fee ?? p.cleaning ?? 0) / 100;
        currency = (d.currency ?? "USD") as string;
      }

      // Format D: direct fields on data
      else if (d) {
        accommodation = ((d.accommodation_amount ?? d.nightly_total ?? d.accommodation ?? 0) as number) / 100;
        cleaningFee = ((d.cleaning_fee_amount ?? d.cleaning_fee ?? 0) as number) / 100;
        currency = (d.currency ?? "USD") as string;
      }

      if (accommodation === 0) {
        console.error("Hospitable quote: could not parse accommodation from", JSON.stringify(json).slice(0, 500));
        // Still try to get accommodation from calendar total — return null so caller uses fallback.
        return null;
      }

      // If quote API didn't return a cleaning fee, pull it from recent reservation history.
      if (cleaningFee === 0) {
        cleaningFee = await fetchCleaningFeeFromReservations(data.id, apiKey);
      }

      const result: Quote = { accommodation, cleaningFee, totalBeforeTax: accommodation + cleaningFee, currency };
      quoteCache.set(cacheKey, { value: result, expires: Date.now() + QUOTE_TTL_MS });
      return result;
    } catch (err) {
      console.error("Hospitable quote fetch error", err);
      return null;
    }
  });

// Also export a standalone server function so the AvailabilityChecker can pre-fetch
// the cleaning fee as soon as the page loads (before the user selects dates).
export const getPropertyCleaningFee = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<number> => {
    const apiKey = process.env.HOSPITABLE_API_KEY;
    if (!apiKey) return 0;
    return fetchCleaningFeeFromReservations(data.id, apiKey);
  });
