import * as React from 'react'
import { render } from '@react-email/components'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { sendResendEmail } from '@/lib/resend-email'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

declare const __MAILERLITE_API_KEY__: string
declare const __RESEND_API_KEY__: string

const SENDER_DOMAIN = 'notify.seaandcityrentals.com'
const FROM_DOMAIN = 'seaandcityrentals.com'
const SITE_NAME = 'Sea & City Rentals'
const SUPABASE_URL = 'https://bgollemualqrwfrxrmwx.supabase.co'
const ML_GROUP_ID = '187986355712689414' // Website Leads
const ML_AUTOMATION_ID = '187987610712409793' // Welcome — Website Lead
// Chars chosen to avoid look-alikes (0/O, 1/I/l)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().max(100).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(100).optional().nullable(),
  user_agent: z.string().max(250).optional().nullable(),
})

function genToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function genDiscountCode(): string {
  const bytes = new Uint8Array(7)
  crypto.getRandomValues(bytes)
  return 'DIRECT' + Array.from(bytes).map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

export const Route = createFileRoute('/api/public/discount-signup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = SignupSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }
        const data = parsed.data

        const discountCode = genDiscountCode()

        // Send welcome email — try direct send first, fall back to queue
        try {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          const lovableApiKey = process.env.LOVABLE_API_KEY
          const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || __RESEND_API_KEY__ || ''
          const supabase = serviceKey ? createClient(SUPABASE_URL, serviceKey) : null

          // Log lead (best-effort, ignore duplicate errors)
          if (supabase) {
            await supabase.from('email_leads').insert({
              email: data.email,
              source: data.source ?? null,
              utm_source: data.utm_source ?? null,
              utm_medium: data.utm_medium ?? null,
              utm_campaign: data.utm_campaign ?? null,
              user_agent: data.user_agent ?? null,
              discount_code: discountCode,
            })
          }

          // Check suppression list
          const suppressed = supabase
            ? (await supabase.from('suppressed_emails').select('email').eq('email', data.email).maybeSingle()).data
            : null

          if (!suppressed) {
            // Get or create unsubscribe token
            let unsubscribeToken = ''
            if (supabase) {
              const { data: existing } = await supabase
                .from('email_unsubscribe_tokens').select('token, used_at').eq('email', data.email).maybeSingle()
              unsubscribeToken = existing?.token ?? ''
              if (!unsubscribeToken || existing?.used_at) {
                unsubscribeToken = genToken()
                await supabase.from('email_unsubscribe_tokens').upsert(
                  { email: data.email, token: unsubscribeToken },
                  { onConflict: 'email' },
                )
              }
            }

            const template = TEMPLATES['welcome-discount']
            const element = React.createElement(template.component, { code: discountCode })
            const html = await render(element)
            const plainText = await render(element, { plainText: true })
            const subject = typeof template.subject === 'function'
              ? template.subject({ code: discountCode }) : template.subject
            const messageId = crypto.randomUUID()
            const idempotencyKey = `welcome-discount-${data.email}`

            if (lovableApiKey) {
              // Direct send — no queue, no cron needed
              await sendLovableEmail(
                {
                  to: data.email,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  sender_domain: SENDER_DOMAIN,
                  subject,
                  html,
                  text: plainText,
                  purpose: 'transactional',
                  label: 'welcome-discount',
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubscribeToken,
                  message_id: messageId,
                },
                { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
              )
              if (supabase) {
                await supabase.from('email_send_log').insert({
                  message_id: messageId, template_name: 'welcome-discount',
                  recipient_email: data.email, status: 'sent',
                })
              }
            } else if (resendApiKey) {
              // Direct send via Resend — no queue, no cron needed
              await sendResendEmail(
                {
                  to: data.email,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  subject,
                  html,
                  text: plainText,
                  reply_to: `vacation@${FROM_DOMAIN}`,
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubscribeToken,
                  message_id: messageId,
                },
                { apiKey: resendApiKey },
              )
              if (supabase) {
                await supabase.from('email_send_log').insert({
                  message_id: messageId, template_name: 'welcome-discount',
                  recipient_email: data.email, status: 'sent',
                })
              }
            } else if (supabase) {
              // Fall back to queue (requires cron to process)
              await supabase.from('email_send_log').insert({
                message_id: messageId, template_name: 'welcome-discount',
                recipient_email: data.email, status: 'pending',
              })
              await supabase.rpc('enqueue_email', {
                queue_name: 'transactional_emails',
                payload: {
                  message_id: messageId, to: data.email,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  sender_domain: SENDER_DOMAIN, subject, html, text: plainText,
                  purpose: 'transactional', label: 'welcome-discount',
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubscribeToken, queued_at: new Date().toISOString(),
                },
              })
            } else {
              console.error('No email path available: LOVABLE_API_KEY, RESEND_API_KEY, and SUPABASE_SERVICE_ROLE_KEY are all missing')
            }
          }
        } catch (err) {
          console.error('email send failed', err)
        }

        // MailerLite — adds subscriber to "Website Leads" group, triggers automation.
        // __MAILERLITE_API_KEY__ is replaced at build time by vite.config.ts define(),
        // so it's baked into the Worker bundle without needing a runtime env var.
        try {
          const mlApiKey = process.env.MAILERLITE_API_KEY || process.env.VITE_MAILERLITE_API_KEY || __MAILERLITE_API_KEY__ || ''
          if (!mlApiKey) console.error('MailerLite API key missing — subscriber not added')
          if (mlApiKey) {
            const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mlApiKey}` },
              body: JSON.stringify({
                email: data.email,
                groups: [ML_GROUP_ID],
                resubscribe: true,
                status: 'active',
                fields: { discount_code: discountCode },
              }),
            })
            if (!mlRes.ok) {
              console.error('MailerLite error', mlRes.status, await mlRes.text())
            } else {
              // Explicitly trigger automation — bypasses double-opt-in / form-submission requirement
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

        return Response.json({ ok: true })
      },
    },
  },
})
