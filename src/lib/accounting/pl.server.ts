import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";

export interface CategoryTotal {
  category: string;
  total: number; // dollars
}

export interface MonthlyPL {
  month: string; // YYYY-MM-01
  income: CategoryTotal[];
  expenses: CategoryTotal[];
  totalIncome: number;
  totalExpenses: number; // positive
  netProfit: number;
  transactionCount: number;
  excludedTransferCount: number;
}

function monthRange(monthStr: string): { start: string; end: string } {
  const [y, m] = monthStr.split("-").map(Number);
  const start = `${monthStr}-01`;
  const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return { start, end };
}

export async function computeMonthlyPL(monthStr: string): Promise<MonthlyPL> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  const sb = createClient(SUPABASE_URL, serviceKey);

  const { start, end } = monthRange(monthStr);

  const { data, error } = await sb
    .from("accounting_transactions")
    .select("category, amount, include_in_pl")
    .gte("transaction_date", start)
    .lt("transaction_date", end);

  if (error) throw new Error(`Failed to load transactions: ${error.message}`);

  const rows = (data ?? []) as Array<{
    category: string;
    amount: number;
    include_in_pl: boolean;
  }>;

  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  let excludedTransferCount = 0;

  for (const row of rows) {
    if (!row.include_in_pl) {
      excludedTransferCount++;
      continue;
    }
    const amount = Number(row.amount);
    if (amount >= 0) {
      incomeMap.set(row.category, (incomeMap.get(row.category) ?? 0) + amount);
    } else {
      expenseMap.set(row.category, (expenseMap.get(row.category) ?? 0) + Math.abs(amount));
    }
  }

  const toSorted = (map: Map<string, number>): CategoryTotal[] =>
    Array.from(map.entries())
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

  const income = toSorted(incomeMap);
  const expenses = toSorted(expenseMap);
  const totalIncome = Math.round(income.reduce((s, c) => s + c.total, 0) * 100) / 100;
  const totalExpenses = Math.round(expenses.reduce((s, c) => s + c.total, 0) * 100) / 100;

  return {
    month: start,
    income,
    expenses,
    totalIncome,
    totalExpenses,
    netProfit: Math.round((totalIncome - totalExpenses) * 100) / 100,
    transactionCount: rows.length,
    excludedTransferCount,
  };
}

/** YYYY-MM for the calendar month before `reference`. */
export function previousMonthString(reference = new Date()): string {
  const y = reference.getUTCFullYear();
  const m = reference.getUTCMonth();
  const prevMonthDate = new Date(Date.UTC(y, m - 1, 1));
  return `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function saveMonthlyReportSnapshot(pl: MonthlyPL, emailed: boolean): Promise<void> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  const sb = createClient(SUPABASE_URL, serviceKey);

  const { error } = await sb.from("accounting_monthly_reports").upsert(
    {
      month: pl.month,
      totals: pl,
      generated_at: new Date().toISOString(),
      ...(emailed ? { emailed_at: new Date().toISOString() } : {}),
    },
    { onConflict: "month" },
  );
  if (error) throw new Error(`Failed to save report snapshot: ${error.message}`);
}
