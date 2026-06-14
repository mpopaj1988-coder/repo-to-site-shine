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

export const getListingQuote = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; checkIn: string; checkOut: string; adults: number }) => data)
  .handler(async ({ data }): Promise<Quote> => {
    const apiKey = process.env.HOSPITABLE_API_KEY;
    if (!apiKey) return null;

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
      const json = (await res.json()) as {
        data?: {
          pricing?: {
            accommodation?: { amount?: number; currency?: string };
            cleaning_fee?: { amount?: number };
            subtotal?: { amount?: number };
            total?: { amount?: number; currency?: string };
          };
        };
      };
      const pricing = json.data?.pricing;
      if (!pricing) return null;

      const accommodation = (pricing.accommodation?.amount ?? 0) / 100;
      const cleaningFee = (pricing.cleaning_fee?.amount ?? 0) / 100;
      // Use subtotal (pre-tax) if available, otherwise sum the parts.
      const totalBeforeTax =
        pricing.subtotal?.amount != null
          ? pricing.subtotal.amount / 100
          : accommodation + cleaningFee;
      const currency = pricing.accommodation?.currency ?? pricing.total?.currency ?? "USD";

      return { accommodation, cleaningFee, totalBeforeTax, currency };
    } catch (err) {
      console.error("Hospitable quote fetch error", err);
      return null;
    }
  });
