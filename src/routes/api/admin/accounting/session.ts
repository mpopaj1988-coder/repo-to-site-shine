import { createFileRoute } from "@tanstack/react-router";
import { verifyAdminSession } from "@/lib/accounting/auth.server";

export const Route = createFileRoute("/api/admin/accounting/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const valid = await verifyAdminSession(request);
        return Response.json({ authenticated: valid }, { status: valid ? 200 : 401 });
      },
    },
  },
});
