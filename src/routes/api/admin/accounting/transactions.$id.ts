import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/accounting/auth.server";
import { CATEGORIES } from "@/lib/accounting/categorize";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";

export const Route = createFileRoute("/api/admin/accounting/transactions/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        if (!(await verifyAdminSession(request))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return Response.json({ error: "Server misconfigured" }, { status: 500 });

        let body: { category?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }

        if (!body.category || !(CATEGORIES as readonly string[]).includes(body.category)) {
          return Response.json({ error: "Invalid category" }, { status: 400 });
        }

        const sb = createClient(SUPABASE_URL, serviceKey);
        const { error } = await sb
          .from("accounting_transactions")
          .update({ category: body.category, category_overridden: true })
          .eq("id", params.id);

        if (error) {
          console.error("Failed to update transaction category", error);
          return Response.json({ error: "Failed to update category" }, { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
