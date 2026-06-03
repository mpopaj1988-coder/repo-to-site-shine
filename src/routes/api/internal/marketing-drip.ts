import * as React from 'react'
import { render } from '@react-email/components'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SENDER_DOMAIN = 'notify.seaandcityrentals.com'
const FROM_DOMAIN = 'seaandcityrentals.com'
const SITE_NAME = 'Sea & City Rentals'
const SUPABASE_URL = 'https://ywstqonfcfjfqfuwscya.supabase.co'

// Day N after signup → which template to send
const DRIP_SCHEDULE = [
  { templateName: 'marketing-why-book-direct', daysAfterSignup: 3 },
  { templateName: 'marketing-property-showcase', daysAfterSignup: 7 },
  { templateName: 'marketing-last-minute', daysAfterSignup: 14 },
] as const

function getSeason(): string {
  const m = new Date().getMonth() + 1 // 1–12
  if (m >= 5 && m <= 8) return 'summer'
  if (m >= 9 && m <= 10) return 'fall'
  if (m === 11 || m <= 3) return 'winter escape'
  return 'spring'
}

function genToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const Route = createFileRoute('/api/internal/marketing-drip')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        // Require service-role bearer token — same pattern as the queue processor.
        const authHeader = request.headers.get('Authorization')
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
        if (token !== supabaseKey) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        const sb = createClient(SUPABASE_URL, supabaseKey)
        const lovableApiKey = process.env.LOVABLE_API_KEY
        const season = getSeason()
        const now = new Date()
        let sent = 0
        let skipped = 0

        for (const step of DRIP_SCHEDULE) {
          // Everyone who signed up MORE than N days ago is eligible.
          // The already-sent check below prevents re-sending.
          const threshold = new Date(now)
          threshold.setDate(threshold.getDate() - step.daysAfterSignup)

          const { data: leads } = await sb
            .from('email_leads')
            .select('email')
            .lte('created_at', threshold.toISOString())
            .limit(500)

          if (!leads?.length) continue

          for (const lead of leads) {
            const { email } = lead

            // Skip suppressed addresses.
            const { data: suppressed } = await sb
              .from('suppressed_emails')
              .select('email')
              .eq('email', email)
              .maybeSingle()
            if (suppressed) { skipped++; continue }

            // Skip if this specific drip email was already sent.
            const { data: alreadySent } = await sb
              .from('email_send_log')
              .select('id')
              .eq('recipient_email', email)
              .eq('template_name', step.templateName)
              .eq('status', 'sent')
              .maybeSingle()
            if (alreadySent) { skipped++; continue }

            // Get or create unsubscribe token.
            let unsubscribeToken = ''
            const { data: existing } = await sb
              .from('email_unsubscribe_tokens')
              .select('token, used_at')
              .eq('email', email)
              .maybeSingle()
            unsubscribeToken = existing?.token ?? ''
            if (!unsubscribeToken || existing?.used_at) {
              unsubscribeToken = genToken()
              await sb.from('email_unsubscribe_tokens').upsert(
                { email, token: unsubscribeToken },
                { onConflict: 'email' },
              )
            }

            // Render the template.
            const template = TEMPLATES[step.templateName]
            const props = step.templateName === 'marketing-property-showcase' ? { season } : {}
            const element = React.createElement(template.component, props)
            const html = await render(element)
            const text = await render(element, { plainText: true })
            const subject = typeof template.subject === 'function'
              ? template.subject({ season })
              : template.subject

            const messageId = crypto.randomUUID()
            // Idempotency key prevents double-send even if this handler runs twice.
            const idempotencyKey = `${step.templateName}-${email}`

            try {
              if (lovableApiKey) {
                await sendLovableEmail(
                  {
                    to: email,
                    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                    sender_domain: SENDER_DOMAIN,
                    subject,
                    html,
                    text,
                    purpose: 'marketing',
                    label: step.templateName,
                    idempotency_key: idempotencyKey,
                    unsubscribe_token: unsubscribeToken,
                    message_id: messageId,
                  },
                  { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
                )
              } else {
                await sb.rpc('enqueue_email', {
                  queue_name: 'transactional_emails',
                  payload: {
                    message_id: messageId,
                    to: email,
                    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                    sender_domain: SENDER_DOMAIN,
                    subject,
                    html,
                    text,
                    purpose: 'marketing',
                    label: step.templateName,
                    idempotency_key: idempotencyKey,
                    unsubscribe_token: unsubscribeToken,
                    queued_at: now.toISOString(),
                  },
                })
              }

              await sb.from('email_send_log').insert({
                message_id: messageId,
                template_name: step.templateName,
                recipient_email: email,
                status: 'sent',
              })
              sent++
            } catch (err) {
              console.error(`Drip send failed: ${step.templateName} → ${email}`, err)
              await sb.from('email_send_log').insert({
                message_id: messageId,
                template_name: step.templateName,
                recipient_email: email,
                status: 'failed',
                error_message: err instanceof Error ? err.message.slice(0, 1000) : String(err),
              })
            }
          }
        }

        console.log(`Marketing drip: sent=${sent} skipped=${skipped}`)
        return Response.json({ sent, skipped })
      },
    },
  },
})
