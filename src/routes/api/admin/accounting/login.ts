import { createFileRoute } from "@tanstack/react-router";
import {
  checkPassword,
  createAdminSession,
  sessionCookieHeader,
} from "@/lib/accounting/auth.server";

export const Route = createFileRoute("/api/admin/accounting/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { password?: string } = {};
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }

        if (!body.password || !checkPassword(body.password)) {
          return Response.json({ error: "Incorrect password" }, { status: 401 });
        }

        const token = await createAdminSession();
        return Response.json(
          { ok: true },
          { status: 200, headers: { "Set-Cookie": sessionCookieHeader(token) } },
        );
      },
    },
  },
});
