import * as React from 'react'
import { render } from '@react-email/components'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

declare const __MAILERLITE_API_KEY__: string

const SENDER_DOMAIN = 'notify.seaandcityrentals.com'
const FROM_DOMAIN = 'seaandcityrentals.com'
const SITE_NAME = 'Sea & City Rentals'
const SUPABASE_URL = process.env.SUPABASE_URL!
const ML_GROUP_ID = '187986355712689414' // Website Leads
const ML_AUTOMATION_ID = '187987610712409793' // Welcome — Website Lead

const Schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
})

function genToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

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

        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }
        const sb = createClient(SUPABASE_URL, supabaseKey)

        // Verify this email has at least one prior completed booking.
        const { data: prior } = await sb
          .from('bookings')
          .select('id')
          .eq('guest_email', email)
          .in('status', ['confirmed', 'cancelled'])
          .limit(1)
          .maybeSingle()

        if (!prior) {
          return Response.json({ notFound: true })
        }

        // Opt them into marketing: upsert into email_leads.
        await sb.from('email_leads').upsert(
          { email, source: 'returning-guest-code' },
          { onConflict: 'email', ignoreDuplicates: true },
        ).throwOnError().catch(() => {/* non-fatal */})

        // Add to MailerLite "Website Leads" group and trigger automation.
        try {
          const mlApiKey = process.env.MAILERLITE_API_KEY || process.env.VITE_MAILERLITE_API_KEY || __MAILERLITE_API_KEY__ || ''
          if (!mlApiKey) console.error('MailerLite API key missing — subscriber not added')
          if (mlApiKey) {
            const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mlApiKey}` },
              body: JSON.stringify({
                email,
                groups: [ML_GROUP_ID],
                resubscribe: true,
                status: 'active',
                fields: { source: 'returning-guest-code' },
              }),
            })
            if (!mlRes.ok) {
              console.error('MailerLite error', mlRes.status, await mlRes.text())
            } else {
              const mlData = await mlRes.json() as any
              const subscriberId = mlData?.data?.id
              if (subscriberId) {
                const trigRes = await fetch(
                  `https://connect.mailerlite.com/api/automations/${ML_AUTOMATION_ID}/subscribers/${subscriberId}`,
                  { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mlApiKey}` } },
                )
                if (!trigRes.ok) console.error('MailerLite automation trigger error', trigRes.status, await trigRes.text())
              }
            }
          }
        } catch (err) {
          console.error('mailerlite sync failed', err)
        }

        // Get or create unsubscribe token.
        let unsubscribeToken = ''
        const { data: existingToken } = await sb
          .from('email_unsubscribe_tokens')
          .select('token, used_at')
          .eq('email', email)
          .maybeSingle()
        unsubscribeToken = existingToken?.token ?? ''
        if (!unsubscribeToken || existingToken?.used_at) {
          unsubscribeToken = genToken()
          await sb.from('email_unsubscribe_tokens').upsert(
            { email, token: unsubscribeToken },
            { onConflict: 'email' },
          )
        }

        const template = TEMPLATES['returning-guest-code']
        const element = React.createElement(template.component, {})
        const html = await render(element)
        const text = await render(element, { plainText: true })
        const subject = typeof template.subject === 'function'
          ? template.subject({})
          : template.subject

        const lovableApiKey = process.env.LOVABLE_API_KEY
        const idempotencyKey = `returning-guest-${email}-${new Date().toISOString().slice(0, 10)}`

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
              idempotency_key: idempotencyKey,
              unsubscribe_token: unsubscribeToken,
            },
            { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
          )
        } else {
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
              idempotency_key: idempotencyKey,
              unsubscribe_token: unsubscribeToken,
              queued_at: new Date().toISOString(),
            },
          })
        }

        return Response.json({ ok: true })
      },
    },
  },
})
