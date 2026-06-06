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
          if (leadError) console.error('guestgrowth_leads insert error:', JSON.stringify(leadError))
        }

        // Send owner notification email
        let emailSent = false
        let emailDebug = ''
        const subject = `New GuestGrowth Lead: ${data.name}`
        const html = `<h2>New GuestGrowth Lead</h2>
<p><strong>Name:</strong> ${data.name}<br>
<strong>Email:</strong> ${data.email}<br>
<strong>Properties:</strong> ${data.num_properties ?? '—'}<br>
<strong>Listing URL:</strong> ${data.listing_url ?? '—'}<br>
<strong>Package:</strong> ${data.package ?? '—'}<br>
<strong>Message:</strong> ${data.message ?? '—'}</p>`
        const text = `New GuestGrowth Lead\n\nName: ${data.name}\nEmail: ${data.email}\nProperties: ${data.num_properties ?? '—'}\nListing: ${data.listing_url ?? '—'}\nPackage: ${data.package ?? '—'}\nMessage: ${data.message ?? '—'}`

        // Path 1: Lovable email API
        if (lovableApiKey && !emailSent) {
          try {
            await sendLovableEmail(
              {
                to: OWNER_EMAIL,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text,
                purpose: 'transactional',
                label: 'guestgrowth-lead-notify',
                idempotency_key: `guestgrowth-lead-${data.email}-${Date.now()}`,
                message_id: crypto.randomUUID(),
              },
              { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
            )
            emailSent = true
            emailDebug = 'lovable'
          } catch (err: any) {
            emailDebug = `lovable-error: ${err?.message ?? err}`
            console.error('Lovable email failed', err)
          }
        }

        // Path 2: Resend (free tier, no plan upgrade needed)
        if (!emailSent) {
          const resendKey = process.env.RESEND_API_KEY || ''
          if (resendKey) {
            try {
              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
                body: JSON.stringify({
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  to: [OWNER_EMAIL],
                  subject,
                  html,
                  text,
                }),
              })
              const resendBody = await resendRes.text()
              if (resendRes.ok) {
                emailSent = true
                emailDebug = 'resend'
              } else {
                emailDebug = `resend-error-${resendRes.status}: ${resendBody}`
                console.error('Resend error', resendRes.status, resendBody)
              }
            } catch (err: any) {
              emailDebug = `resend-exception: ${err?.message ?? err}`
              console.error('Resend fetch failed', err)
            }
          }
        }

        // Path 3: MailerLite transactional email (requires paid add-on)
        if (!emailSent) {
          const mlApiKey = process.env.MAILERLITE_API_KEY || process.env.VITE_MAILERLITE_API_KEY || __MAILERLITE_API_KEY__ || ''
          if (mlApiKey) {
            try {
              const mlRes = await fetch('https://connect.mailerlite.com/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mlApiKey}` },
                body: JSON.stringify({
                  from: { email: `noreply@${FROM_DOMAIN}`, name: SITE_NAME },
                  to: [{ email: OWNER_EMAIL }],
                  subject,
                  html,
                  text,
                }),
              })
              const mlBody = await mlRes.text()
              if (mlRes.ok) {
                emailSent = true
                emailDebug = 'mailerlite'
              } else {
                emailDebug = `mailerlite-error-${mlRes.status}: ${mlBody}`
                console.error('MailerLite transactional error', mlRes.status, mlBody)
              }
            } catch (err: any) {
              emailDebug = `mailerlite-exception: ${err?.message ?? err}`
              console.error('MailerLite fetch failed', err)
            }
          } else {
            emailDebug = 'no-ml-key'
            console.error('guestgrowth-lead: MAILERLITE_API_KEY not available')
          }
        }

        if (!emailSent) {
          console.error('guestgrowth-lead: all email paths failed', emailDebug, { name: data.name, email: data.email })
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

        return Response.json({ ok: true, _email: emailDebug })
      },
    },
  },
})
