import * as React from "react";
import { render } from "@react-email/components";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { TEMPLATES } from "@/lib/email-templates/registry";
import { WIFI_CONFIG } from "@/data/wifiConfig.server";

const SENDER_DOMAIN = "notify.seaandcityrentals.com";
const FROM_DOMAIN = "seaandcityrentals.com";
const SITE_NAME = "Sea & City Rentals";
const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";
const ML_WIFI_GROUP_ID = "189035051981211452"; // WiFi Guests

declare const __MAILERLITE_API_KEY__: string;

const WifiSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  slug: z.string().min(1).max(100),
});

function genToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const Route = createFileRoute("/api/public/wifi-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = WifiSignupSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }
        const { email, slug } = parsed.data;

        const config = WIFI_CONFIG[slug];
        if (!config) {
          return Response.json({ error: "Property not found" }, { status: 404 });
        }

        try {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const lovableApiKey = process.env.LOVABLE_API_KEY;
          const supabase = serviceKey ? createClient(SUPABASE_URL, serviceKey) : null;

          // Log the request (reuse email_leads table, source = wifi-signup)
          if (supabase) {
            await supabase.from("email_leads").insert({
              email,
              source: `wifi-signup:${slug}`,
            });
          }

          // Check suppression list
          const suppressed = supabase
            ? (
                await supabase
                  .from("suppressed_emails")
                  .select("email")
                  .eq("email", email)
                  .maybeSingle()
              ).data
            : null;

          if (!suppressed) {
            let unsubscribeToken = "";
            if (supabase) {
              const { data: existing } = await supabase
                .from("email_unsubscribe_tokens")
                .select("token, used_at")
                .eq("email", email)
                .maybeSingle();
              unsubscribeToken = existing?.token ?? "";
              if (!unsubscribeToken || existing?.used_at) {
                unsubscribeToken = genToken();
                await supabase.from("email_unsubscribe_tokens").upsert(
                  { email, token: unsubscribeToken },
                  { onConflict: "email" },
                );
              }
            }

            const template = TEMPLATES["wifi-info"];
            const templateData = {
              propertyName: config.propertyName,
              doorCode: config.doorCode,
              wifiNetwork: config.wifiNetwork,
              wifiPassword: config.wifiPassword,
              checkInTime: config.checkInTime,
              checkoutTime: config.checkoutTime,
              parking: config.parking,
              trash: config.trash,
              emergencyContact: config.emergencyContact,
              notes: config.notes,
              guideSlug: config.guideSlug,
            };

            const element = React.createElement(template.component, templateData);
            const html = await render(element);
            const plainText = await render(element, { plainText: true });
            const subject =
              typeof template.subject === "function"
                ? template.subject(templateData)
                : template.subject;

            const messageId = crypto.randomUUID();
            const idempotencyKey = `wifi-info-${email}-${slug}`;

            if (lovableApiKey) {
              await sendLovableEmail(
                {
                  to: email,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  sender_domain: SENDER_DOMAIN,
                  subject,
                  html,
                  text: plainText,
                  purpose: "transactional",
                  label: "wifi-info",
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubscribeToken,
                  message_id: messageId,
                },
                { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
              );
              if (supabase) {
                await supabase.from("email_send_log").insert({
                  message_id: messageId,
                  template_name: "wifi-info",
                  recipient_email: email,
                  status: "sent",
                });
              }
            } else if (supabase) {
              await supabase.from("email_send_log").insert({
                message_id: messageId,
                template_name: "wifi-info",
                recipient_email: email,
                status: "pending",
              });
              await supabase.rpc("enqueue_email", {
                queue_name: "transactional_emails",
                payload: {
                  message_id: messageId,
                  to: email,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  sender_domain: SENDER_DOMAIN,
                  subject,
                  html,
                  text: plainText,
                  purpose: "transactional",
                  label: "wifi-info",
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubscribeToken,
                  queued_at: new Date().toISOString(),
                },
              });
            } else {
              console.error("No email path available: LOVABLE_API_KEY and SUPABASE_SERVICE_ROLE_KEY both missing");
            }
          }
        } catch (err) {
          console.error("wifi-signup email send failed", err);
          // Don't expose internal errors to client
        }

        // MailerLite — add to "WiFi Guests" group with property slug
        try {
          const mlApiKey =
            process.env.MAILERLITE_API_KEY ||
            process.env.VITE_MAILERLITE_API_KEY ||
            __MAILERLITE_API_KEY__ ||
            "";
          if (!mlApiKey) {
            console.error("MailerLite API key missing — wifi guest not added");
          } else {
            const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${mlApiKey}`,
              },
              body: JSON.stringify({
                email,
                groups: [ML_WIFI_GROUP_ID],
                resubscribe: true,
                status: "active",
                fields: { property_slug: slug, property_name: config.propertyName },
              }),
            });
            if (!mlRes.ok) {
              console.error("MailerLite wifi-guest error", mlRes.status, await mlRes.text());
            }
          }
        } catch (err) {
          console.error("mailerlite wifi-guest sync failed", err);
        }

        return Response.json({
          ok: true,
          guide: {
            propertyName: config.propertyName,
            wifiNetwork: config.wifiNetwork,
            wifiPassword: config.wifiPassword,
            doorCode: config.doorCode ?? null,
            checkInTime: config.checkInTime,
            checkoutTime: config.checkoutTime,
            parking: config.parking ?? null,
            trash: config.trash ?? null,
            emergencyContact: config.emergencyContact,
            notes: config.notes,
            guideSlug: config.guideSlug ?? null,
          },
        });
      },
    },
  },
});
