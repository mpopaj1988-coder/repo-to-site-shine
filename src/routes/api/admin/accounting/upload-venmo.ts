import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/accounting/auth.server";
import { parseVenmoCsv } from "@/lib/accounting/venmo-csv";
import { categorizeVenmo } from "@/lib/accounting/categorize";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";

export const Route = createFileRoute("/api/admin/accounting/upload-venmo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyAdminSession(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return Response.json({ error: "Server misconfigured" }, { status: 500 });

        let text: string;
        try {
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) {
            return Response.json({ error: "No file uploaded" }, { status: 400 });
          }
          text = await file.text();
        } catch {
          return Response.json({ error: "Could not read uploaded file" }, { status: 400 });
        }

        const parsed = parseVenmoCsv(text);
        if (parsed.warnings.length > 0) {
          return Response.json({ error: parsed.warnings[0] }, { status: 400 });
        }

        const rows = parsed.rows.map((row) => {
          const { category, includeInPl } = categorizeVenmo({
            type: row.type,
            description: row.description,
            amount: row.amount,
          });
          return {
            source: "venmo" as const,
            source_id: row.sourceId,
            transaction_date: row.transactionDate,
            description: row.description,
            counterparty: row.counterparty,
            amount: row.amount,
            currency: "USD",
            category,
            include_in_pl: includeInPl,
            raw: row,
          };
        });

        let inserted = 0;
        if (rows.length > 0) {
          const sb = createClient(SUPABASE_URL, serviceKey);
          const { data, error } = await sb
            .from("accounting_transactions")
            .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true })
            .select("id");
          if (error) {
            console.error("Venmo upload upsert failed", error);
            return Response.json({ error: "Failed to save transactions" }, { status: 500 });
          }
          inserted = data?.length ?? 0;
        }

        return Response.json({
          parsed: parsed.rows.length,
          inserted,
          skippedRows: parsed.skipped,
        });
      },
    },
  },
});
