import { createFileRoute } from "@tanstack/react-router";
import { syncCleaningJobs } from "@/lib/cleaner-sync.server";

// Pulls upcoming Hospitable checkouts into open cleaning jobs. Call this on
// a schedule (e.g. a GitHub Actions cron, same pattern as the weekly site
// health check) so new jobs and their push notifications go out without
// anyone needing to trigger it by hand.
export const Route = createFileRoute("/api/internal/sync-cleaning-jobs")({
  server: {
    handlers: {
      GET: async () => {
        const result = await syncCleaningJobs();
        return Response.json({ ok: true, ...result });
      },
      POST: async () => {
        const result = await syncCleaningJobs();
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
