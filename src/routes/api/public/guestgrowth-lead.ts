/**
 * POST /api/public/guestgrowth-lead
 *
 * Saves a host inquiry lead from the GuestGrowth landing page.
 *
 * Future integrations (see comments below):
 *  - ConvertKit / Mailchimp / Klaviyo — tag the lead as "guestgrowth-host-lead"
 *  - Airtable — POST to /v0/{baseId}/{tableName}
 *  - Google Sheets — via Apps Script webhook or Zapier
 *  - Stripe Checkout — create session after package selection
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SUPABASE_URL = "https://ywstqonfcfjfqfuwscya.supabase.co";

const LeadSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(254).toLowerCase().trim(),
  numProperties: z.string().max(20).optional().default(""),
  listingUrl: z.string().max(500).optional().default(""),
  package: z.enum(["qr-guide", "email-automation", "booking-site", "unsure"]).optional().default("unsure"),
  message: z.string().max(1000).optional().default(""),
});

export const Route = createFileRoute("/api/public/guestgrowth-lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = LeadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }

        const { name, email, numProperties, listingUrl, package: pkg, message } = parsed.data;

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey) {
          const supabase = createClient(SUPABASE_URL, serviceKey);

          // Save to Supabase
          await supabase.from("guestgrowth_leads").insert({
            name,
            email,
            num_properties: numProperties,
            listing_url: listingUrl,
            package: pkg,
            message,
          });

          // Also log to email_leads for consolidated reporting
          await supabase.from("email_leads").insert({
            email,
            source: `guestgrowth-lead:${pkg}`,
          });
        }

        // ── Future: ConvertKit ────────────────────────────────────────────────
        // const ckKey = process.env.CONVERTKIT_API_KEY;
        // const ckFormId = process.env.CONVERTKIT_FORM_ID;
        // if (ckKey && ckFormId) {
        //   await fetch(`https://api.convertkit.com/v3/forms/${ckFormId}/subscribe`, {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //       api_key: ckKey,
        //       email,
        //       first_name: name.split(" ")[0],
        //       tags: ["guestgrowth-host-lead", pkg],
        //       fields: { num_properties: numProperties, package: pkg },
        //     }),
        //   });
        // }

        // ── Future: Airtable ─────────────────────────────────────────────────
        // const airtableKey = process.env.AIRTABLE_API_KEY;
        // const airtableBase = process.env.AIRTABLE_BASE_ID;
        // if (airtableKey && airtableBase) {
        //   await fetch(`https://api.airtable.com/v0/${airtableBase}/Leads`, {
        //     method: "POST",
        //     headers: { Authorization: `Bearer ${airtableKey}`, "Content-Type": "application/json" },
        //     body: JSON.stringify({ fields: { Name: name, Email: email, Package: pkg, Properties: numProperties, URL: listingUrl } }),
        //   });
        // }

        return Response.json({ ok: true });
      },
    },
  },
});
