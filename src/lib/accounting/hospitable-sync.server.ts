/**
 * Pulls the full Hospitable transaction ledger (GET /v2/transactions) and
 * upserts it into `accounting_transactions`. Idempotent: rows are keyed on
 * (source, source_id) with ON CONFLICT DO NOTHING, so re-running never
 * overwrites a category the owner manually corrected in the dashboard.
 *
 * The API has no date filter or sort order guarantee, so every sync walks
 * every page — cheap (a few dozen requests) and safe to run daily from cron.
 */

import { createClient } from "@supabase/supabase-js";
import { categorizeHospitable } from "./categorize";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";
const HOSPITABLE_API = "https://public.api.hospitable.com/v2";
const MAX_PAGES = 60; // safety bound (~6,000 transactions)

type Money = { amount: number; formatted: string; currency: string };

type HospitableTxRaw = {
  id: string;
  platform: string | null;
  type: string;
  details: string | null;
  amount: Money | null;
  paid_out_amount: Money | null;
  date: string | null;
  start_date: string | null;
};

type HospitablePage = {
  data: HospitableTxRaw[];
  meta: { current_page: number; last_page: number };
};

async function fetchPage(apiKey: string, page: number): Promise<HospitablePage> {
  const url = `${HOSPITABLE_API}/transactions?page=${page}&per_page=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Hospitable transactions fetch failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as HospitablePage;
}

function toRow(tx: HospitableTxRaw) {
  const isPayout = tx.type === "Payout";
  const money = isPayout ? tx.paid_out_amount : tx.amount;
  if (!money) return null;

  const transactionDate = (tx.date ?? tx.start_date ?? "").slice(0, 10);
  if (!transactionDate) return null;

  const amountDollars = money.amount / 100;
  const { category, includeInPl } = categorizeHospitable({
    type: tx.type,
    description: tx.details ?? "",
    amount: amountDollars,
  });

  return {
    source: "hospitable" as const,
    source_id: tx.id,
    transaction_date: transactionDate,
    description: tx.details ?? tx.type,
    counterparty: tx.platform ?? null,
    amount: amountDollars,
    currency: money.currency ?? "USD",
    category,
    include_in_pl: includeInPl,
    raw: tx,
  };
}

export async function syncHospitableTransactions(): Promise<{
  fetched: number;
  inserted: number;
  pages: number;
}> {
  const apiKey = process.env.HOSPITABLE_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !serviceKey) {
    throw new Error("HOSPITABLE_API_KEY or SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  const sb = createClient(SUPABASE_URL, serviceKey);

  let fetched = 0;
  let inserted = 0;
  let page = 1;
  let lastPage = 1;

  do {
    const result = await fetchPage(apiKey, page);
    lastPage = result.meta.last_page;
    fetched += result.data.length;

    const rows = result.data
      .map(toRow)
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length > 0) {
      const { data, error } = await sb
        .from("accounting_transactions")
        .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true })
        .select("id");
      if (error) {
        console.error("Hospitable transaction upsert failed", error);
      } else {
        inserted += data?.length ?? 0;
      }
    }

    page++;
  } while (page <= lastPage && page <= MAX_PAGES);

  return { fetched, inserted, pages: Math.min(lastPage, MAX_PAGES) };
}
