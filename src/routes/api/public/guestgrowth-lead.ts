import * as React from 'react'
import { render } from '@react-email/components'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SENDER_DOMAIN = 'notify.seaandcityrentals.com'
const FROM_DOMAIN = 'seaandcityrentals.com'
const SITE_NAME = 'Sea & City Rentals'
const SUPABASE_URL = 'https://bgollemualqrwfrxrmwx.supabase.co'
const OWNER_EMAIL = 'vacation@seaandcityrentals.com'

const LeadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  num_properties: z.string().max(20).optional().nullable(),
  listing_url: z.string().max(500).optional().nullable(),
  package: z.string().max(50).optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
})

export const Route = createFileRoute('/api/public/guestgrowth-lead')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = LeadSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }
        const data = parsed.data

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const lovableApiKey = process.env.LOVABLE_API_KEY
        const supabase = serviceKey ? createClient(SUPABASE_URL, serviceKey) : null

        const debug: Record<string, unknown> = {
          hasServiceKey: !!serviceKey,
          keyPrefix: serviceKey ? serviceKey.slice(0, 20) + '...' : null,
          leadError: null,
          emailLeadError: null,
        }

        // Save lead to DB
        if (!supabase) {
          console.error('guestgrowth-lead: SUPABASE_SERVICE_ROLE_KEY is not set')
        } else {
          const { error: leadError } = await supabase.from('guestgrowth_leads').insert({
            name: data.name,
            email: data.email,
            num_properties: data.num_properties ?? null,
            listing_url: data.listing_url ?? null,
            package: data.package ?? null,
            message: data.message ?? null,
            source: 'guestgrowth-landing',
          })
          if (leadError) {
            console.error('guestgrowth_leads insert error:', JSON.stringify(leadError))
            debug.leadError = leadError
          }

          const { error: emailLeadError } = await supabase.from('email_leads').insert({
            email: data.email,
            source: 'guestgrowth-landing',
          })
          if (emailLeadError) {
            console.error('email_leads insert error:', JSON.stringify(emailLeadError))
            debug.emailLeadError = emailLeadError
          }
        }

        // Send owner notification email
        try {
          const template = TEMPLATES['guestgrowth-lead-notify']
          const props = {
            name: data.name,
            email: data.email,
            num_properties: data.num_properties ?? undefined,
            listing_url: data.listing_url ?? undefined,
            package: data.package ?? undefined,
            message: data.message ?? undefined,
          }
          const element = React.createElement(template.component, props)
          const html = await render(element)
          const plainText = await render(element, { plainText: true })
          const subject = typeof template.subject === 'function'
            ? template.subject(props) : template.subject
          const messageId = crypto.randomUUID()

          if (lovableApiKey) {
            await sendLovableEmail(
              {
                to: OWNER_EMAIL,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text: plainText,
                purpose: 'transactional',
                label: 'guestgrowth-lead-notify',
                idempotency_key: `guestgrowth-lead-${data.email}-${Date.now()}`,
                message_id: messageId,
              },
              { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
            )
          } else if (supabase) {
            await supabase.rpc('enqueue_email', {
              queue_name: 'transactional_emails',
              payload: {
                message_id: messageId,
                to: OWNER_EMAIL,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text: plainText,
                purpose: 'transactional',
                label: 'guestgrowth-lead-notify',
                idempotency_key: `guestgrowth-lead-${data.email}-${Date.now()}`,
                queued_at: new Date().toISOString(),
              },
            })
          }
        } catch (err) {
          console.error('Owner notification failed', err)
        }

        // ── Future: ConvertKit ──────────────────────────────────────────────
        // const ckRes = await fetch(`https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ api_key: process.env.CONVERTKIT_API_KEY, email: data.email, first_name: data.name }),
        // })

        // ── Future: Airtable ────────────────────────────────────────────────
        // await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`, {
        //   method: 'POST',
        //   headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ fields: { Name: data.name, Email: data.email, Package: data.package } }),
        // })

        return Response.json({ ok: true, debug })
      },
    },
  },
})
