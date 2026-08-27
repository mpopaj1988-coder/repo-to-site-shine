import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },

  async scheduled(
    event: { cron?: string },
    env: unknown,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) {
    ctx.waitUntil(
      (async () => {
        const handler = await getServerEntry();
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

        // Every 5 minutes: drain the outgoing email queue (welcome emails,
        // follow-ups, anything enqueued when direct-send wasn't available).
        try {
          const res = await handler.fetch(
            new Request("https://seaandcityrentals.com/lovable/email/queue/process", {
              method: "POST",
              headers: { Authorization: `Bearer ${serviceKey}` },
            }),
            env, ctx,
          );
          console.log("Scheduled email queue process:", res.status, await res.text());
        } catch (err) {
          console.error("Scheduled email queue process failed:", err);
        }

        // Once daily at 9am UTC: reviews refresh + marketing drip.
        if (event.cron !== "0 9 * * *") return;

        // Refresh Hospitable reviews into Supabase cache.
        try {
          const res = await handler.fetch(
            new Request("https://seaandcityrentals.com/api/public/refresh-reviews", { method: "POST" }),
            env, ctx,
          );
          console.log("Scheduled review refresh:", res.status, await res.text());
        } catch (err) {
          console.error("Scheduled review refresh failed:", err);
        }

        // Send marketing drip emails to eligible subscribers.
        try {
          const res = await handler.fetch(
            new Request("https://seaandcityrentals.com/api/internal/marketing-drip", {
              method: "POST",
              headers: { Authorization: `Bearer ${serviceKey}` },
            }),
            env, ctx,
          );
          console.log("Scheduled marketing drip:", res.status, await res.text());
        } catch (err) {
          console.error("Scheduled marketing drip failed:", err);
        }

        // Reconcile Stripe: backfill any paid checkout session the webhook
        // missed (booking record, guest email, calendar block, owner alert).
        try {
          const res = await handler.fetch(
            new Request("https://seaandcityrentals.com/api/internal/stripe-reconcile", {
              method: "POST",
              headers: { Authorization: `Bearer ${serviceKey}` },
            }),
            env, ctx,
          );
          console.log("Scheduled Stripe reconcile:", res.status, await res.text());
        } catch (err) {
          console.error("Scheduled Stripe reconcile failed:", err);
        }

        // Send post-stay emails (review request, come-back nudge, local tips)
        // to past guests.
        try {
          const res = await handler.fetch(
            new Request("https://seaandcityrentals.com/api/internal/post-stay-drip", {
              method: "POST",
              headers: { Authorization: `Bearer ${serviceKey}` },
            }),
            env, ctx,
          );
          console.log("Scheduled post-stay drip:", res.status, await res.text());
        } catch (err) {
          console.error("Scheduled post-stay drip failed:", err);
        }

        // Sync Hospitable transactions into the accounting ledger.
        try {
          const res = await handler.fetch(
            new Request("https://seaandcityrentals.com/api/internal/accounting-sync-hospitable", {
              method: "POST",
              headers: { Authorization: `Bearer ${serviceKey}` },
            }),
            env, ctx,
          );
          console.log("Scheduled accounting sync:", res.status, await res.text());
        } catch (err) {
          console.error("Scheduled accounting sync failed:", err);
        }

        // On the 1st of the month: email last month's Profit & Loss report.
        if (new Date().getUTCDate() === 1) {
          try {
            const res = await handler.fetch(
              new Request("https://seaandcityrentals.com/api/internal/accounting-monthly-report", {
                method: "POST",
                headers: { Authorization: `Bearer ${serviceKey}` },
              }),
              env, ctx,
            );
            console.log("Scheduled monthly P&L report:", res.status, await res.text());
          } catch (err) {
            console.error("Scheduled monthly P&L report failed:", err);
          }
        }
      })(),
    );
  },
};
