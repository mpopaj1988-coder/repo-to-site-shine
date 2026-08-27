import { createFileRoute } from "@tanstack/react-router";
import { verifyAdminSession } from "@/lib/accounting/auth.server";
import { computeMonthlyPL, monthLabel } from "@/lib/accounting/pl.server";

function currentMonthString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const Route = createFileRoute("/api/admin/accounting/pl")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await verifyAdminSession(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const month = url.searchParams.get("month") ?? currentMonthString();
        if (!/^\d{4}-\d{2}$/.test(month)) {
          return Response.json({ error: "Invalid month, expected YYYY-MM" }, { status: 400 });
        }

        try {
          const pl = await computeMonthlyPL(month);
          return Response.json({ ...pl, monthLabel: monthLabel(month) });
        } catch (err) {
          console.error("P&L computation failed", err);
          return Response.json({ error: "Failed to compute P&L" }, { status: 500 });
        }
      },
    },
  },
});
