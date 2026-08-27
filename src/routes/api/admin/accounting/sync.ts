import { createFileRoute } from "@tanstack/react-router";
import { verifyAdminSession } from "@/lib/accounting/auth.server";
import { syncHospitableTransactions } from "@/lib/accounting/hospitable-sync.server";

export const Route = createFileRoute("/api/admin/accounting/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyAdminSession(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const result = await syncHospitableTransactions();
          return Response.json(result);
        } catch (err) {
          console.error("Manual Hospitable sync failed", err);
          return Response.json({ error: "Sync failed" }, { status: 500 });
        }
      },
    },
  },
});
