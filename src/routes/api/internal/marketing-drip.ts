import * as React from 'react'
import { render } from '@react-email/components'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { sendResendEmail } from '@/lib/resend-email'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '@/lib/email-templates/registry'
import type { AvailableProp } from '@/lib/email-templates/marketing-last-minute'
import { properties } from '@/data/properties'

const SENDER_DOMAIN = 'notify.seaandcityrentals.com'
const FROM_DOMAIN = 'seaandcityrentals.com'
const SITE_NAME = 'Sea & City Rentals'
const SUPABASE_URL = 'https://bgollemualqrwfrxrmwx.supabase.co'

// ---------------------------------------------------------------------------
// Last-minute availability helpers
// ---------------------------------------------------------------------------

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDateRange(startDate: string, nights: number): string {
  const start = new Date(startDate + 'T12:00:00Z')
  const end = new Date(start)
  end.setDate(end.getDate() + nights)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
  return `${start.toLocaleDateString('en-US', opts)}–${end.toLocaleDateString('en-US', opts)}`
}

// Returns the earliest window of minConsecutive+ available days within lookAheadDays,
// or null if none found.
function findOpenWindow(
  days: Array<{ date: string; available: boolean; minNights: number | null }>,
  lookAheadDays = 14,
  minConsecutive = 2,
): string | null {
  const todayStr = fmtDate(new Date())
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + lookAheadDays)
  const cutoffStr = fmtDate(cutoff)

  const window = days.filter(d => d.date >= todayStr && d.date <= cutoffStr)

  let streak = 0
  let streakStart: string | null = null

  for (const day of window) {
    if (day.available) {
      if (!streakStart) streakStart = day.date
      streak++
      const needed = Math.max(minConsecutive, day.minNights ?? 1)
      if (streak >= needed) {
        return formatDateRange(streakStart, streak)
      }
    } else {
      streak = 0
      streakStart = null
    }
  }
  return null
}

async function fetchLastMinuteProperties(apiKey: string): Promise<AvailableProp[]> {
  const start = fmtDate(new Date())
  const end = new Date()
  end.setDate(end.getDate() + 14)
  const endStr = fmtDate(end)

  const eligible = properties.filter(p => p.hospitableId)

  const results = await Promise.allSettled(
    eligible.map(async (p) => {
      const url = `https://public.api.hospitable.com/v2/properties/${p.hospitableId}/calendar?start_date=${start}&end_date=${endStr}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      })
      if (!res.ok) return null

      const json = (await res.json()) as {
        data?: {
          days?: Array<{
            date?: string
            status?: { available?: boolean }
            min_stay?: number
          }>
        }
      }
      const days = (json.data?.days ?? []).map(d => ({
        date: (d.date ?? '').slice(0, 10),
        available: d.status?.available ?? false,
        minNights: d.min_stay ?? null,
      }))

      const openWindow = findOpenWindow(days)
      if (!openWindow) return null

      return {
        title: p.title,
        location: p.location,
        slug: p.slug,
        tagline: p.tagline,
        openWindow,
      } satisfies AvailableProp
    }),
  )

  return results
    .filter((r): r is PromiseFulfilledResult<AvailableProp> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)
}

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
        const resendApiKey = process.env.RESEND_API_KEY
        const season = getSeason()
        const now = new Date()
        let sent = 0
        let skipped = 0

        for (const step of DRIP_SCHEDULE) {
          // For the last-minute step, check real Hospitable availability ONCE before
          // looping over subscribers. If nothing is open in the next 14 days, skip
          // the entire step — don't send anyone an email listing zero properties.
          let lastMinuteProps: AvailableProp[] | null = null
          if (step.templateName === 'marketing-last-minute') {
            const hospApiKey = process.env.HOSPITABLE_API_KEY
            if (!hospApiKey) {
              console.error('HOSPITABLE_API_KEY missing — skipping last-minute drip')
              continue
            }
            lastMinuteProps = await fetchLastMinuteProperties(hospApiKey)
            if (lastMinuteProps.length === 0) {
              console.log('No last-minute availability found — skipping step')
              continue
            }
          }

          // Everyone who signed up MORE than N days ago is eligible.
          // The already-sent check below prevents re-sending.
          const threshold = new Date(now)
          threshold.setDate(threshold.getDate() - step.daysAfterSignup)

          const { data: leads } = await sb
            .from('email_leads')
            .select('email, discount_code')
            .lte('created_at', threshold.toISOString())
            .limit(500)

          if (!leads?.length) continue

          // The why-book-direct email carries a reminder of each lead's own discount
          // code, so it has to be rendered per-recipient instead of once per batch.
          const needsPerLeadRender = step.templateName === 'marketing-why-book-direct'

          const template = TEMPLATES[step.templateName]
          const templateProps =
            step.templateName === 'marketing-property-showcase' ? { season }
            : step.templateName === 'marketing-last-minute' ? { availableProps: lastMinuteProps }
            : {}

          let html = ''
          let text = ''
          let subject = ''
          if (!needsPerLeadRender) {
            const element = React.createElement(template.component, templateProps)
            html = await render(element)
            text = await render(element, { plainText: true })
            subject = typeof template.subject === 'function'
              ? template.subject({ season })
              : template.subject
          }

          for (const lead of leads) {
            const { email, discount_code } = lead

            let leadHtml = html
            let leadText = text
            let leadSubject = subject
            if (needsPerLeadRender) {
              const element = React.createElement(template.component, { code: discount_code })
              leadHtml = await render(element)
              leadText = await render(element, { plainText: true })
              leadSubject = typeof template.subject === 'function'
                ? template.subject({ code: discount_code })
                : template.subject
            }

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
                    subject: leadSubject,
                    html: leadHtml,
                    text: leadText,
                    purpose: 'marketing',
                    label: step.templateName,
                    idempotency_key: idempotencyKey,
                    unsubscribe_token: unsubscribeToken,
                    message_id: messageId,
                  },
                  { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
                )
              } else if (resendApiKey) {
                await sendResendEmail(
                  {
                    to: email,
                    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                    subject: leadSubject,
                    html: leadHtml,
                    text: leadText,
                    reply_to: `vacation@${FROM_DOMAIN}`,
                    idempotency_key: idempotencyKey,
                    unsubscribe_token: unsubscribeToken,
                    message_id: messageId,
                  },
                  { apiKey: resendApiKey },
                )
              } else {
                await sb.rpc('enqueue_email', {
                  queue_name: 'transactional_emails',
                  payload: {
                    message_id: messageId,
                    to: email,
                    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                    sender_domain: SENDER_DOMAIN,
                    subject: leadSubject,
                    html: leadHtml,
                    text: leadText,
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
