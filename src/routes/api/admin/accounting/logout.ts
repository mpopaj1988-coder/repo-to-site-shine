import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookieHeader } from "@/lib/accounting/auth.server";

export const Route = createFileRoute("/api/admin/accounting/logout")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json(
          { ok: true },
          { status: 200, headers: { "Set-Cookie": clearSessionCookieHeader() } },
        );
      },
    },
  },
});
