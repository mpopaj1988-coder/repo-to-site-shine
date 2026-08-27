import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/accounting/auth.server";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";

function currentMonthString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const Route = createFileRoute("/api/admin/accounting/transactions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await verifyAdminSession(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return Response.json({ error: "Server misconfigured" }, { status: 500 });

        const url = new URL(request.url);
        const month = url.searchParams.get("month") ?? currentMonthString();
        if (!/^\d{4}-\d{2}$/.test(month)) {
          return Response.json({ error: "Invalid month, expected YYYY-MM" }, { status: 400 });
        }
        const [y, m] = month.split("-").map(Number);
        const start = `${month}-01`;
        const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

        const sb = createClient(SUPABASE_URL, serviceKey);
        const { data, error } = await sb
          .from("accounting_transactions")
          .select(
            "id, source, transaction_date, description, counterparty, amount, category, include_in_pl, category_overridden",
          )
          .gte("transaction_date", start)
          .lt("transaction_date", end)
          .order("transaction_date", { ascending: false });

        if (error) {
          console.error("Failed to list accounting transactions", error);
          return Response.json({ error: "Failed to load transactions" }, { status: 500 });
        }

        return Response.json({ transactions: data ?? [] });
      },
    },
  },
});
