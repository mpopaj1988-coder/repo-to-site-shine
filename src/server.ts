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
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
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

        // Collect balance payments — runs on every scheduled trigger (daily + bi-monthly)
        try {
          const balanceReq = new Request(
            "https://seaandcityrentals.com/lovable/cron/collect-balances",
            {
              method: "POST",
            },
          );
          const balanceRes = await handler.fetch(balanceReq, env, ctx);
          console.log("Scheduled balance collection:", balanceRes.status, await balanceRes.text());
        } catch (err) {
          console.error("Scheduled balance collection failed:", err);
        }

        // Review refresh — only on the 1st and 15th cron
        if (!event.cron || event.cron === "0 9 1,15 * *") {
          try {
            const reviewReq = new Request(
              "https://seaandcityrentals.com/api/public/refresh-reviews",
              {
                method: "POST",
              },
            );
            const reviewRes = await handler.fetch(reviewReq, env, ctx);
            console.log("Scheduled review refresh:", reviewRes.status, await reviewRes.text());
          } catch (err) {
            console.error("Scheduled review refresh failed:", err);
          }
        }
      })(),
    );
  },
};
