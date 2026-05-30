import { createFileRoute } from "@tanstack/react-router";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { z } from "zod";

const SENDER_DOMAIN = "notify.seaandcityrentals.com";
const FROM_DOMAIN = "seaandcityrentals.com";
const SITE_NAME = "Sea & City Rentals";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  property: z.string().max(200).optional().nullable(),
  message: z.string().trim().min(1).max(3000),
});

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = ContactSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }

        const data = parsed.data;
        const hostEmail = process.env.HOST_NOTIFY_EMAIL || "nella@seaandcityrentals.com";
        const lovableApiKey = process.env.LOVABLE_API_KEY;

        const subject = data.property
          ? `New inquiry: ${data.property} — from ${data.name}`
          : `New inquiry from ${data.name}`;

        const safeMessage = data.message
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>");

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff">
            <div style="background:#152238;padding:24px 28px;border-radius:6px 6px 0 0">
              <p style="color:#C9A84C;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px">
                ${SITE_NAME} — New Contact Form Inquiry
              </p>
              <h2 style="color:#ffffff;font-size:22px;margin:0">${subject}</h2>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;padding:24px 28px;border-radius:0 0 6px 6px">
              <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151">
                <tr>
                  <td style="padding:6px 0;color:#6b7280;width:120px">Name</td>
                  <td style="padding:6px 0;font-weight:600">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280">Email</td>
                  <td style="padding:6px 0">
                    <a href="mailto:${data.email}" style="color:#1d4ed8">${data.email}</a>
                  </td>
                </tr>
                ${
                  data.property
                    ? `<tr>
                        <td style="padding:6px 0;color:#6b7280">Property</td>
                        <td style="padding:6px 0">${data.property}</td>
                      </tr>`
                    : ""
                }
              </table>
              <div style="margin:20px 0 0">
                <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em">Message</p>
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:16px;font-size:14px;color:#374151;line-height:1.6">
                  ${safeMessage}
                </div>
              </div>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
                Reply directly to <a href="mailto:${data.email}" style="color:#1d4ed8">${data.email}</a> to respond.
              </p>
            </div>
          </div>
        `;

        const text = [
          `New inquiry from ${data.name} <${data.email}>`,
          data.property ? `Property: ${data.property}` : "",
          "",
          data.message,
        ]
          .filter(Boolean)
          .join("\n");

        try {
          if (lovableApiKey) {
            await sendLovableEmail(
              {
                to: hostEmail,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                reply_to: data.email,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text,
                purpose: "transactional",
                label: "contact-inquiry",
                message_id: crypto.randomUUID(),
              },
              { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
            );
          } else {
            console.warn("[contact] LOVABLE_API_KEY not set — inquiry not emailed:", {
              name: data.name,
              email: data.email,
              property: data.property,
            });
          }
        } catch (err) {
          console.error("[contact] email send failed:", err);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
