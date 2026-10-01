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

// One-off campaign: sends "Last-minute deals" (if it hasn't already gone out
// to a lead via the regular drip) and "Holiday specials" to everyone still
// eligible for marketing email. Not on a cron — triggered manually, once,
// with dryRun:true first to review counts before anything actually sends.

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

function genToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const CAMPAIGN_STEPS = ['marketing-last-minute', 'marketing-holiday-specials'] as const

export const Route = createFileRoute('/api/internal/holiday-last-minute-campaign')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        const authHeader = request.headers.get('Authorization')
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
        if (token !== supabaseKey) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        let dryRun = true
        try {
          const body = await request.json() as { dryRun?: boolean }
          dryRun = body?.dryRun !== false
        } catch {
          // No body — default to dry run so a bare curl never sends for real.
        }

        const sb = createClient(SUPABASE_URL, supabaseKey)
        const lovableApiKey = process.env.LOVABLE_API_KEY
        const resendApiKey = process.env.RESEND_API_KEY
        const now = new Date()

        const { data: confirmedBookings } = await sb
          .from('bookings')
          .select('guest_email')
          .eq('status', 'confirmed')
        const bookedEmails = new Set(
          (confirmedBookings ?? []).map(b => b.guest_email?.toLowerCase()).filter(Boolean),
        )

        // "Haven't gotten Last-minute yet" — anyone the automated drip (or a
        // prior run of this campaign) already sent marketing-last-minute to.
        const { data: alreadyGotLastMinute } = await sb
          .from('email_send_log')
          .select('recipient_email')
          .eq('template_name', 'marketing-last-minute')
          .eq('status', 'sent')
        const gotLastMinute = new Set(
          (alreadyGotLastMinute ?? []).map(r => r.recipient_email?.toLowerCase()).filter(Boolean),
        )

        const { data: leadRows } = await sb
          .from('email_leads')
          .select('email, source')
          .limit(2000)

        const leads = (leadRows ?? []).filter(
          (l) => !l.source?.toLowerCase().startsWith('wifi-signup:'),
        )

        const hospApiKey = process.env.HOSPITABLE_API_KEY
        let lastMinuteProps: AvailableProp[] = []
        if (hospApiKey) {
          lastMinuteProps = await fetchLastMinuteProperties(hospApiKey)
        }

        const results: Record<string, { sent: number; skipped: number; recipients: string[] }> = {}
        for (const templateName of CAMPAIGN_STEPS) results[templateName] = { sent: 0, skipped: 0, recipients: [] }

        for (const lead of leads) {
          const email = lead.email
          const emailLower = email.toLowerCase()
          if (bookedEmails.has(emailLower)) continue
          if (gotLastMinute.has(emailLower)) continue

          const { data: suppressed } = await sb
            .from('suppressed_emails')
            .select('email')
            .eq('email', email)
            .maybeSingle()
          if (suppressed) continue

          for (const templateName of CAMPAIGN_STEPS) {
            if (templateName === 'marketing-last-minute' && lastMinuteProps.length === 0) continue

            const { data: alreadySent } = await sb
              .from('email_send_log')
              .select('id')
              .eq('recipient_email', email)
              .eq('template_name', templateName)
              .eq('status', 'sent')
              .maybeSingle()
            if (alreadySent) { results[templateName].skipped++; continue }

            if (dryRun) {
              results[templateName].sent++
              results[templateName].recipients.push(email)
              continue
            }

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
            const unsubscribeUrl = `https://seaandcityrentals.com/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`

            const template = TEMPLATES[templateName]
            const props =
              templateName === 'marketing-last-minute'
                ? { availableProps: lastMinuteProps, unsubscribeUrl }
                : { unsubscribeUrl }
            const element = React.createElement(template.component, props)
            const html = await render(element)
            const text = await render(element, { plainText: true })
            const subject = typeof template.subject === 'function' ? template.subject(props) : template.subject

            const messageId = crypto.randomUUID()
            const idempotencyKey = `${templateName}-${messageId}`

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
                    label: templateName,
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
                    subject,
                    html,
                    text,
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
                    subject,
                    html,
                    text,
                    purpose: 'marketing',
                    label: templateName,
                    idempotency_key: idempotencyKey,
                    unsubscribe_token: unsubscribeToken,
                    queued_at: now.toISOString(),
                  },
                })
              }

              await sb.from('email_send_log').insert({
                message_id: messageId,
                template_name: templateName,
                recipient_email: email,
                status: 'sent',
              })
              results[templateName].sent++
              results[templateName].recipients.push(email)
            } catch (err) {
              console.error(`Campaign send failed: ${templateName} → ${email}`, err)
              await sb.from('email_send_log').insert({
                message_id: messageId,
                template_name: templateName,
                recipient_email: email,
                status: 'failed',
                error_message: err instanceof Error ? err.message.slice(0, 1000) : String(err),
              })
            }
          }
        }

        return Response.json({
          dryRun,
          lastMinuteAvailabilityFound: lastMinuteProps.length,
          results: Object.fromEntries(
            Object.entries(results).map(([k, v]) => [k, { sent: v.sent, skipped: v.skipped, recipientCount: v.recipients.length }]),
          ),
        })
      },
    },
  },
})
