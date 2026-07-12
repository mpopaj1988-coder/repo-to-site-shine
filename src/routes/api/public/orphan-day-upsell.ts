// DISABLED — orphan day upsell has been turned off.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/orphan-day-upsell")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, disabled: true }),
      POST: async () => Response.json({ ok: true, disabled: true }),
    },
  },
});
