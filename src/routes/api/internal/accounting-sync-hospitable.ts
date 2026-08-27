import { createFileRoute } from "@tanstack/react-router";
import { syncHospitableTransactions } from "@/lib/accounting/hospitable-sync.server";

export const Route = createFileRoute("/api/internal/accounting-sync-hospitable")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Server misconfigured" }, { status: 500 });
        }

        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        if (token !== serviceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        try {
          const result = await syncHospitableTransactions();
          console.log("Hospitable transaction sync:", JSON.stringify(result));
          return Response.json(result);
        } catch (err) {
          console.error("Hospitable transaction sync failed", err);
          return Response.json({ error: "Sync failed" }, { status: 500 });
        }
      },
    },
  },
});
