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

const Schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
})

export const Route = createFileRoute('/api/public/returning-guest-code')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = Schema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'Invalid email' }, { status: 422 })
        }
        const { email } = parsed.data

        const template = TEMPLATES['returning-guest-code']
        const element = React.createElement(template.component, {})
        const html = await render(element)
        const text = await render(element, { plainText: true })
        const subject = typeof template.subject === 'function'
          ? template.subject({})
          : template.subject

        const lovableApiKey = process.env.LOVABLE_API_KEY
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (lovableApiKey) {
          await sendLovableEmail(
            {
              to: email,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject,
              html,
              text,
              purpose: 'transactional',
              label: 'returning-guest-code',
              idempotency_key: `returning-guest-${email}-${new Date().toISOString().slice(0, 10)}`,
            },
            { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
          )
        } else if (supabaseKey) {
          const sb = createClient(SUPABASE_URL, supabaseKey)
          await sb.rpc('enqueue_email', {
            queue_name: 'transactional_emails',
            payload: {
              message_id: crypto.randomUUID(),
              to: email,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject,
              html,
              text,
              purpose: 'transactional',
              label: 'returning-guest-code',
              idempotency_key: `returning-guest-${email}-${new Date().toISOString().slice(0, 10)}`,
              queued_at: new Date().toISOString(),
            },
          })
        } else {
          return Response.json({ error: 'Email service not configured' }, { status: 500 })
        }

        return Response.json({ ok: true })
      },
    },
  },
})
