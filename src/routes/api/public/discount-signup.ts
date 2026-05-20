import * as React from 'react'
import { render } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SENDER_DOMAIN = 'notify.seaandcityrentals.com'
const FROM_DOMAIN = 'seaandcityrentals.com'
const SITE_NAME = 'Sea & City Rentals'

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

export const Route = createFileRoute('/api/public/discount-signup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = SignupSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }
        const data = parsed.data
        const supabase = createClient(supabaseUrl, serviceKey)

        // 1) Save lead (ignore duplicate)
        const { error: insertError } = await supabase.from('email_leads').insert({
          email: data.email,
          source: data.source ?? null,
          utm_source: data.utm_source ?? null,
          utm_medium: data.utm_medium ?? null,
          utm_campaign: data.utm_campaign ?? null,
          user_agent: data.user_agent ?? null,
        })
        if (insertError && !/duplicate/i.test(insertError.message)) {
          console.error('email_leads insert', insertError)
        }

        // 2) Check suppression
        const { data: suppressed } = await supabase
          .from('suppressed_emails').select('email').eq('email', data.email).maybeSingle()
        if (suppressed) {
          return Response.json({ ok: true, suppressed: true })
        }

        // 3) Ensure unsubscribe token
        const { data: existing } = await supabase
          .from('email_unsubscribe_tokens').select('token, used_at').eq('email', data.email).maybeSingle()
        let unsubscribeToken = existing?.token
        if (!unsubscribeToken || existing?.used_at) {
          unsubscribeToken = genToken()
          await supabase.from('email_unsubscribe_tokens').upsert(
            { email: data.email, token: unsubscribeToken },
            { onConflict: 'email' },
          )
          const { data: stored } = await supabase
            .from('email_unsubscribe_tokens').select('token').eq('email', data.email).maybeSingle()
          unsubscribeToken = stored?.token ?? unsubscribeToken
        }

        // 4) Render template
        const template = TEMPLATES['welcome-discount']
        const element = React.createElement(template.component, { code: 'DIRECT10' })
        const html = await render(element)
        const plainText = await render(element, { plainText: true })
        const subject = typeof template.subject === 'function'
          ? template.subject({ code: 'DIRECT10' }) : template.subject

        const messageId = crypto.randomUUID()
        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: 'welcome-discount',
          recipient_email: data.email,
          status: 'pending',
        })

        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: data.email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text: plainText,
            purpose: 'transactional',
            label: 'welcome-discount',
            idempotency_key: `welcome-discount-${data.email}`,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqueueError) {
          console.error('enqueue_email failed', enqueueError)
        }

        // 5) Sync to MailerLite (best-effort)
        try {
          const mlApiKey = process.env.MAILERLITE_API_KEY
          if (mlApiKey) {
            const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${mlApiKey}`,
              },
              body: JSON.stringify({
                email: data.email,
                groups: ['187986355712689414'], // "Website Leads" group
                fields: {
                  ...(data.utm_source ? { city: data.utm_source } : {}),
                },
              }),
            })
            if (!mlRes.ok) {
              const errText = await mlRes.text()
              console.error('mailerlite sync failed', mlRes.status, errText)
            }
          }
        } catch (mlErr) {
          console.error('mailerlite sync error', mlErr)
        }

        // 6) Sync to Mailchimp (best-effort, legacy)
        try {
          const apiKey = process.env.MAILCHIMP_API_KEY
          const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
          if (apiKey && audienceId) {
            const dc = apiKey.split('-')[1]
            if (dc) {
              const subscriberHash = await sha256Hex(data.email)
              const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`
              const mcRes = await fetch(url, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
                },
                body: JSON.stringify({
                  email_address: data.email,
                  status_if_new: 'subscribed',
                  tags: ['Website Lead'],
                  merge_fields: {},
                }),
              })
              if (!mcRes.ok) {
                const errText = await mcRes.text()
                console.error('mailchimp sync failed', mcRes.status, errText)
              }
            }
          }
        } catch (mcErr) {
          console.error('mailchimp sync error', mcErr)
        }

        return Response.json({ ok: true })
      },
    },
  },
})

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.toLowerCase())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
