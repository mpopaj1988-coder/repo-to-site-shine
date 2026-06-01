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
const SUPABASE_URL = 'https://ywstqonfcfjfqfuwscya.supabase.co'
const FALLBACK_HOST_EMAIL = 'hello@seaandcityrentals.com'

const InquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30).optional().nullable(),
  property_interest: z.string().trim().max(120).optional().nullable(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  message: z.string().trim().min(1).max(2000),
  source: z.string().max(100).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(100).optional().nullable(),
})

export const Route = createFileRoute('/api/public/inquiry')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = InquirySchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }
        const data = parsed.data

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabase = serviceKey ? createClient(SUPABASE_URL, serviceKey) : null

        // Log to Supabase (best-effort)
        if (supabase) {
          await supabase.from('inquiries').insert({
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            property_interest: data.property_interest ?? null,
            check_in: data.check_in ?? null,
            check_out: data.check_out ?? null,
            message: data.message,
            source: data.source ?? null,
            utm_source: data.utm_source ?? null,
            utm_medium: data.utm_medium ?? null,
            utm_campaign: data.utm_campaign ?? null,
          }).catch((err: unknown) => console.error('inquiry log failed', err))
        }

        // Send notification to host
        try {
          const lovableApiKey = process.env.LOVABLE_API_KEY
          const hostEmail = process.env.HOST_EMAIL || FALLBACK_HOST_EMAIL

          if (lovableApiKey) {
            const template = TEMPLATES['inquiry-notification']
            const props = {
              name: data.name,
              email: data.email,
              phone: data.phone ?? '',
              propertyInterest: data.property_interest ?? '',
              checkIn: data.check_in ?? '',
              checkOut: data.check_out ?? '',
              message: data.message,
            }
            const element = React.createElement(template.component, props)
            const html = await render(element)
            const plainText = await render(element, { plainText: true })
            const subject = typeof template.subject === 'function'
              ? template.subject(props) : template.subject

            await sendLovableEmail(
              {
                to: hostEmail,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                reply_to: data.email,
                subject,
                html,
                text: plainText,
                purpose: 'transactional',
                label: 'inquiry-notification',
                idempotency_key: `inquiry-${data.email}-${Date.now()}`,
              },
              { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
            )
          } else {
            console.error('LOVABLE_API_KEY missing — inquiry notification not sent')
          }
        } catch (err) {
          console.error('inquiry notification send failed', err)
        }

        return Response.json({ ok: true })
      },
    },
  },
})
