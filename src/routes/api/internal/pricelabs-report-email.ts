import * as React from "react";
import { render } from "@react-email/components";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SENDER_DOMAIN = "notify.seaandcityrentals.com";
const FROM_DOMAIN = "seaandcityrentals.com";
const SITE_NAME = "Sea & City Rentals";
const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";

// Delivers a PriceLabs report (built by the scheduled reporting automation) to
// the owner's inbox via the site's existing email queue + sender. Auth mirrors
// marketing-drip.ts / post-stay-drip.ts: a service-role bearer token, since the
// caller is a server-to-server automation, not a signed-in browser session.
export const Route = createFileRoute("/api/internal/pricelabs-report-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseKey) {
          return Response.json({ error: "Server misconfigured" }, { status: 500 });
        }

        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        if (token !== supabaseKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        let body: { reportType?: string; periodLabel?: string; bodyHtml?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
        }

        if (!body.bodyHtml) {
          return Response.json({ error: "bodyHtml is required" }, { status: 400 });
        }

        const template = TEMPLATES["pricelabs-report"];
        const templateData = {
          reportType: body.reportType ?? "PriceLabs Report",
          periodLabel: body.periodLabel ?? "",
          generatedAt: new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          bodyHtml: body.bodyHtml,
        };

        const element = React.createElement(template.component, templateData);
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const subject =
          typeof template.subject === "function"
            ? template.subject(templateData)
            : template.subject;
        const recipient = template.to!;

        const sb = createClient(SUPABASE_URL, supabaseKey);
        const messageId = crypto.randomUUID();

        // Log pending BEFORE enqueue so we have a record even if enqueue crashes.
        await sb.from("email_send_log").insert({
          message_id: messageId,
          template_name: "pricelabs-report",
          recipient_email: recipient,
          status: "pending",
        });

        const { error: enqueueError } = await sb.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: "transactional",
            label: "pricelabs-report",
            idempotency_key: messageId,
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          console.error("Failed to enqueue PriceLabs report email", enqueueError);
          await sb.from("email_send_log").insert({
            message_id: messageId,
            template_name: "pricelabs-report",
            recipient_email: recipient,
            status: "failed",
            error_message: "Failed to enqueue email",
          });
          return Response.json({ error: "Failed to enqueue email" }, { status: 500 });
        }

        return Response.json({ success: true, queued: true });
      },
    },
  },
});
