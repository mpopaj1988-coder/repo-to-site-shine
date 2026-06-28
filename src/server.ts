import "./lib/error-capture";

import { createClient } from "@supabase/supabase-js";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";
const OWNER_EMAIL = "mpopaj1988@gmail.com";
const SITE_NAME = "Sea & City Rentals";
const FROM_DOMAIN = "seaandcityrentals.com";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";

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

  async scheduled(_event: unknown, env: unknown, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    ctx.waitUntil(
      (async () => {
        const handler = await getServerEntry();

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
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
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

        // Booking reconciliation — catch any Stripe payments that the webhook missed.
        try {
          const stripeKey = process.env.STRIPE_SECRET_KEY;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (stripeKey && serviceKey) {
            const since = Math.floor(Date.now() / 1000) - 48 * 60 * 60;
            const stripeRes = await fetch(
              `https://api.stripe.com/v1/checkout/sessions?status=complete&created[gte]=${since}&limit=100`,
              { headers: { Authorization: `Bearer ${stripeKey}` } },
            );

            if (stripeRes.ok) {
              type StripeSession = {
                id: string; amount_total: number; currency: string; created: number;
                customer_details?: { email?: string; name?: string };
                metadata?: Record<string, string>;
              };
              const { data: sessions } = await stripeRes.json() as { data: StripeSession[] };
              const bookingSessions = sessions.filter(s => s.metadata?.property);

              if (bookingSessions.length > 0) {
                const sb = createClient(SUPABASE_URL, serviceKey);
                const { data: existing } = await sb
                  .from("bookings")
                  .select("stripe_session_id")
                  .in("stripe_session_id", bookingSessions.map(s => s.id));

                const processedIds = new Set(
                  (existing ?? []).map((b: { stripe_session_id: string }) => b.stripe_session_id),
                );
                const missed = bookingSessions.filter(s => !processedIds.has(s.id));

                if (missed.length > 0) {
                  console.error("Booking reconciliation: missed sessions", missed.map(s => s.id));

                  const lines = missed.map(s => {
                    const m = s.metadata ?? {};
                    const total = `$${((s.amount_total ?? 0) / 100).toFixed(2)} ${(s.currency ?? "usd").toUpperCase()}`;
                    return `• ${s.customer_details?.name ?? "Unknown"} (${s.customer_details?.email ?? "—"}) — ${m.title ?? m.property ?? "Unknown property"}, ${m.check_in ?? "?"} → ${m.check_out ?? "?"}, ${total}\n  Stripe session: ${s.id}`;
                  }).join("\n\n");

                  const subject = `⚠ ${missed.length} missed booking${missed.length > 1 ? "s" : ""} — action required`;
                  const html = `<p><strong>${missed.length} Stripe payment${missed.length > 1 ? "s were" : " was"} not saved to your bookings system.</strong> The webhook may have failed for these sessions.</p><pre style="background:#fff8e1;padding:12px;border-radius:4px;font-size:13px">${lines}</pre><p>Log into Hospitable and manually block these dates to prevent double-booking.</p>`;
                  const text = `${missed.length} missed booking(s) detected.\n\n${lines}\n\nPlease block these dates in Hospitable manually.`;
                  const dayKey = Math.floor(Date.now() / 86_400_000);

                  const lovableApiKey = process.env.LOVABLE_API_KEY;
                  if (lovableApiKey) {
                    await sendLovableEmail(
                      { to: OWNER_EMAIL, from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`, sender_domain: SENDER_DOMAIN, subject, html, text, purpose: "transactional", label: "booking-reconciliation-alert", idempotency_key: `reconcile-${dayKey}` },
                      { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
                    );
                  } else {
                    await sb.rpc("enqueue_email", {
                      queue_name: "transactional_emails",
                      payload: { message_id: crypto.randomUUID(), to: OWNER_EMAIL, from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`, sender_domain: SENDER_DOMAIN, subject, html, text, purpose: "transactional", label: "booking-reconciliation-alert", queued_at: new Date().toISOString() },
                    });
                  }
                } else {
                  console.log(`Booking reconciliation: all ${bookingSessions.length} session(s) accounted for`);
                }
              } else {
                console.log("Booking reconciliation: no website bookings in last 48h");
              }
            }
          }
        } catch (err) {
          console.error("Booking reconciliation failed:", err);
        }
      })(),
    );
  },
};
