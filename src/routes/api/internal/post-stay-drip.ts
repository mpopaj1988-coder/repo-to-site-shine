import * as React from 'react'
import { render } from '@react-email/components'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { sendResendEmail } from '@/lib/resend-email'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '@/lib/email-templates/registry'
import { getPublishedPosts } from '@/lib/blog'

const SENDER_DOMAIN = 'notify.seaandcityrentals.com'
const FROM_DOMAIN = 'seaandcityrentals.com'
const SITE_NAME = 'Sea & City Rentals'
const SUPABASE_URL = 'https://bgollemualqrwfrxrmwx.supabase.co'

// Timeline after checkout: review request first (while the trip is fresh),
// then a come-back nudge, then ongoing monthly local-tips emails — spaced out
// so no one gets two of these in the same week.
const REVIEW_REQUEST_DAYS = 2
const COMEBACK_NUDGE_DAYS = 30
const LOCAL_TIPS_START_DAYS = 60
const LOCAL_TIPS_REPEAT_DAYS = 28

// WiFi QR guests (booked via Airbnb/VRBO/etc, so we only know them from the
// WiFi signup, not a checkout date) get a slower, lighter sequence — no
// review request, and quarterly instead of monthly tips.
const WIFI_COMEBACK_NUDGE_DAYS = 45
const WIFI_LOCAL_TIPS_START_DAYS = 90
const WIFI_LOCAL_TIPS_REPEAT_DAYS = 90

type Booking = {
  id: string
  guest_email: string
  guest_name: string | null
  property_title: string | null
  check_out: string
}

type WifiLead = {
  id: string
  email: string
  created_at: string
}

function daysSince(dateStr: string, now: Date): number {
  const then = new Date(dateStr + 'T00:00:00Z').getTime()
  return Math.floor((now.getTime() - then) / (1000 * 60 * 60 * 24))
}

function daysSinceTimestamp(isoTimestamp: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60 * 24))
}

function genToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Deterministic monthly rotation through published blog posts — every guest
// eligible in a given month gets featured the same post that month.
function pickMonthlyPost(now: Date) {
  const posts = getPublishedPosts()
  if (posts.length === 0) return null
  const monthIndex = now.getUTCFullYear() * 12 + now.getUTCMonth()
  return posts[monthIndex % posts.length]
}

export const Route = createFileRoute('/api/internal/post-stay-drip')({
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

        const sb = createClient(SUPABASE_URL, supabaseKey)
        const lovableApiKey = process.env.LOVABLE_API_KEY
        const resendApiKey = process.env.RESEND_API_KEY
        const now = new Date()
        let sent = 0
        let skipped = 0

        const { data: bookings } = await sb
          .from('bookings')
          .select('id, guest_email, guest_name, property_title, check_out')
          .eq('status', 'confirmed')
          .lte('check_out', now.toISOString().slice(0, 10))
          .limit(1000)

        const allBookings = (bookings ?? []) as Booking[]
        const bookedEmails = new Set(allBookings.map((b) => b.guest_email.toLowerCase()))

        // WiFi QR guests — the only record we have of guests who stayed but
        // booked through another platform (Airbnb, VRBO, etc). Excludes anyone
        // who also shows up in `bookings`, since those guests already get the
        // more attentive, checkout-dated sequence above.
        const { data: wifiLeadRows } = await sb
          .from('email_leads')
          .select('id, email, created_at, source')
          .ilike('source', 'wifi-signup:%')
          .limit(1000)
        const wifiLeads = ((wifiLeadRows ?? []) as (WifiLead & { source: string })[]).filter(
          (l) => !bookedEmails.has(l.email.toLowerCase()),
        )

        const { data: suppressedRows } = await sb.from('suppressed_emails').select('email')
        const suppressed = new Set((suppressedRows ?? []).map((r) => r.email.toLowerCase()))

        async function getUnsubscribeToken(email: string): Promise<string> {
          const { data: existing } = await sb
            .from('email_unsubscribe_tokens')
            .select('token, used_at')
            .eq('email', email)
            .maybeSingle()
          let unsubscribeToken = existing?.token ?? ''
          if (!unsubscribeToken || existing?.used_at) {
            unsubscribeToken = genToken()
            await sb.from('email_unsubscribe_tokens').upsert(
              { email, token: unsubscribeToken },
              { onConflict: 'email' },
            )
          }
          return unsubscribeToken
        }

        async function sendEmail(opts: {
          to: string
          subject: string
          html: string
          text: string
          templateName: string
          metadata?: Record<string, unknown>
        }) {
          const messageId = crypto.randomUUID()
          const idempotencyKey = `${opts.templateName}-${messageId}`
          const unsubscribeToken = await getUnsubscribeToken(opts.to)

          try {
            if (lovableApiKey) {
              await sendLovableEmail(
                {
                  to: opts.to,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  sender_domain: SENDER_DOMAIN,
                  subject: opts.subject,
                  html: opts.html,
                  text: opts.text,
                  purpose: 'marketing',
                  label: opts.templateName,
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubscribeToken,
                  message_id: messageId,
                },
                { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
              )
            } else if (resendApiKey) {
              await sendResendEmail(
                {
                  to: opts.to,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  subject: opts.subject,
                  html: opts.html,
                  text: opts.text,
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
                  to: opts.to,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  sender_domain: SENDER_DOMAIN,
                  subject: opts.subject,
                  html: opts.html,
                  text: opts.text,
                  purpose: 'marketing',
                  label: opts.templateName,
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubscribeToken,
                  queued_at: now.toISOString(),
                },
              })
            }

            await sb.from('email_send_log').insert({
              message_id: messageId,
              template_name: opts.templateName,
              recipient_email: opts.to,
              status: 'sent',
              metadata: opts.metadata ?? null,
            })
            sent++
          } catch (err) {
            console.error(`Post-stay send failed: ${opts.templateName} → ${opts.to}`, err)
            await sb.from('email_send_log').insert({
              message_id: messageId,
              template_name: opts.templateName,
              recipient_email: opts.to,
              status: 'failed',
              metadata: opts.metadata ?? null,
              error_message: err instanceof Error ? err.message.slice(0, 1000) : String(err),
            })
          }
        }

        // ---------------------------------------------------------------
        // Step 1: review request — once per booking, ~2 days after checkout.
        // ---------------------------------------------------------------
        const reviewCandidates = allBookings.filter((b) => daysSince(b.check_out, now) >= REVIEW_REQUEST_DAYS)
        for (const booking of reviewCandidates) {
          const email = booking.guest_email
          if (suppressed.has(email.toLowerCase())) { skipped++; continue }

          const { data: alreadySent } = await sb
            .from('email_send_log')
            .select('id')
            .eq('recipient_email', email)
            .eq('template_name', 'post-stay-review')
            .eq('status', 'sent')
            .contains('metadata', { booking_id: booking.id })
            .maybeSingle()
          if (alreadySent) { skipped++; continue }

          const template = TEMPLATES['post-stay-review']
          const props = { guestName: booking.guest_name ?? undefined, propertyTitle: booking.property_title ?? undefined }
          const element = React.createElement(template.component, props)
          const html = await render(element)
          const text = await render(element, { plainText: true })
          const subject = typeof template.subject === 'function' ? template.subject(props) : template.subject

          await sendEmail({
            to: email, subject, html, text,
            templateName: 'post-stay-review',
            metadata: { booking_id: booking.id },
          })
        }

        // ---------------------------------------------------------------
        // Step 2: come-back nudge — once per booking, ~30 days after checkout.
        // ---------------------------------------------------------------
        const comebackCandidates = allBookings.filter((b) => daysSince(b.check_out, now) >= COMEBACK_NUDGE_DAYS)
        for (const booking of comebackCandidates) {
          const email = booking.guest_email
          if (suppressed.has(email.toLowerCase())) { skipped++; continue }

          const { data: alreadySent } = await sb
            .from('email_send_log')
            .select('id')
            .eq('recipient_email', email)
            .eq('template_name', 'returning-guest-code')
            .eq('status', 'sent')
            .contains('metadata', { booking_id: booking.id })
            .maybeSingle()
          if (alreadySent) { skipped++; continue }

          const template = TEMPLATES['returning-guest-code']
          const element = React.createElement(template.component, {})
          const html = await render(element)
          const text = await render(element, { plainText: true })
          const subject = typeof template.subject === 'function' ? template.subject({}) : template.subject

          await sendEmail({
            to: email, subject, html, text,
            templateName: 'returning-guest-code',
            metadata: { booking_id: booking.id },
          })
        }

        async function daysSinceLastSend(email: string, templateName: string): Promise<number | null> {
          const { data: lastSent } = await sb
            .from('email_send_log')
            .select('created_at')
            .eq('recipient_email', email)
            .eq('template_name', templateName)
            .eq('status', 'sent')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (!lastSent) return null
          return Math.floor((now.getTime() - new Date(lastSent.created_at).getTime()) / (1000 * 60 * 60 * 24))
        }

        async function sendLocalTips(email: string, post: NonNullable<ReturnType<typeof pickMonthlyPost>>) {
          const template = TEMPLATES['local-tips']
          const props = { title: post.title, description: post.description, slug: post.slug }
          const element = React.createElement(template.component, props)
          const html = await render(element)
          const text = await render(element, { plainText: true })
          const subject = typeof template.subject === 'function' ? template.subject(props) : template.subject
          await sendEmail({ to: email, subject, html, text, templateName: 'local-tips' })
        }

        // ---------------------------------------------------------------
        // Step 3: local tips — recurring monthly per guest, starting a bit
        // after the come-back nudge window so sends don't collide.
        // ---------------------------------------------------------------
        const tipsEligibleEmails = new Set(
          allBookings
            .filter((b) => daysSince(b.check_out, now) >= LOCAL_TIPS_START_DAYS)
            .map((b) => b.guest_email),
        )
        const monthlyPost = pickMonthlyPost(now)

        if (monthlyPost) {
          for (const email of tipsEligibleEmails) {
            if (suppressed.has(email.toLowerCase())) { skipped++; continue }

            const daysSinceLast = await daysSinceLastSend(email, 'local-tips')
            if (daysSinceLast !== null && daysSinceLast < LOCAL_TIPS_REPEAT_DAYS) { skipped++; continue }

            await sendLocalTips(email, monthlyPost)
          }
        }

        // ---------------------------------------------------------------
        // Step 4: WiFi QR guest come-back nudge — once per guest, ~45 days
        // after their WiFi signup. Dedup checks for ANY prior send (not
        // scoped to this lead) so it never collides with Step 2's nudge if
        // the same person later becomes a confirmed direct booker.
        // ---------------------------------------------------------------
        const wifiComebackCandidates = wifiLeads.filter(
          (l) => daysSinceTimestamp(l.created_at, now) >= WIFI_COMEBACK_NUDGE_DAYS,
        )
        for (const lead of wifiComebackCandidates) {
          const email = lead.email
          if (suppressed.has(email.toLowerCase())) { skipped++; continue }

          const { data: alreadySent } = await sb
            .from('email_send_log')
            .select('id')
            .eq('recipient_email', email)
            .eq('template_name', 'returning-guest-code')
            .eq('status', 'sent')
            .maybeSingle()
          if (alreadySent) { skipped++; continue }

          const template = TEMPLATES['returning-guest-code']
          const element = React.createElement(template.component, {})
          const html = await render(element)
          const text = await render(element, { plainText: true })
          const subject = typeof template.subject === 'function' ? template.subject({}) : template.subject

          await sendEmail({ to: email, subject, html, text, templateName: 'returning-guest-code' })
        }

        // ---------------------------------------------------------------
        // Step 5: WiFi QR guest local tips — recurring quarterly, starting
        // ~90 days after signup. Shares the 'local-tips' log with Step 3, so
        // a guest who's also a confirmed direct booker (and getting the
        // monthly cadence there) will naturally skip here too.
        // ---------------------------------------------------------------
        const wifiTipsEligible = wifiLeads.filter(
          (l) => daysSinceTimestamp(l.created_at, now) >= WIFI_LOCAL_TIPS_START_DAYS,
        )
        if (monthlyPost) {
          for (const lead of wifiTipsEligible) {
            const email = lead.email
            if (suppressed.has(email.toLowerCase())) { skipped++; continue }

            const daysSinceLast = await daysSinceLastSend(email, 'local-tips')
            if (daysSinceLast !== null && daysSinceLast < WIFI_LOCAL_TIPS_REPEAT_DAYS) { skipped++; continue }

            await sendLocalTips(email, monthlyPost)
          }
        }

        console.log(`Post-stay drip: sent=${sent} skipped=${skipped}`)
        return Response.json({ sent, skipped })
      },
    },
  },
})
