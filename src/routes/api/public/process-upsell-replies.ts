// DISABLED — the orphan day upsell it processes replies for has been
// turned off (see orphan-day-upsell.ts). This route's handler called an
// undefined function (updateCalendarPrice) and would throw on every YES
// reply it found, so it's disabled the same way rather than left live.
// If this feature is ever revived, both routes need to come back together.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/process-upsell-replies")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, disabled: true }),
      POST: async () => Response.json({ ok: true, disabled: true }),
    },
  },
});
