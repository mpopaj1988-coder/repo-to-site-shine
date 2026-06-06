import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

declare const __MAILERLITE_API_KEY__: string

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
        const supabase = serviceKey ? createClient(SUPABASE_URL, serviceKey) : null

        // Save lead to Supabase
        if (supabase) {
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

        // Add lead to MailerLite "GuestGrowth Leads" group.
        // This triggers the owner notification automation in MailerLite.
        // One-time setup: MailerLite → Automations → trigger "Joins group: GuestGrowth Leads"
        //   → step "Send notification" → email: vacation@seaandcityrentals.com
        const mlApiKey = process.env.MAILERLITE_API_KEY || process.env.VITE_MAILERLITE_API_KEY || __MAILERLITE_API_KEY__ || ''
        let mlDebug = 'no-key'

        if (mlApiKey) {
          try {
            // Find or create the "GuestGrowth Leads" group
            let groupId = ''
            const listRes = await fetch(
              'https://connect.mailerlite.com/api/groups?filter[name]=GuestGrowth+Leads&limit=1',
              { headers: { Authorization: `Bearer ${mlApiKey}`, 'Content-Type': 'application/json' } },
            )
            if (listRes.ok) {
              const listData = await listRes.json() as any
              groupId = listData.data?.[0]?.id ?? ''
            }
            if (!groupId) {
              const createRes = await fetch('https://connect.mailerlite.com/api/groups', {
                method: 'POST',
                headers: { Authorization: `Bearer ${mlApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'GuestGrowth Leads' }),
              })
              if (createRes.ok) {
                const createData = await createRes.json() as any
                groupId = createData.data?.id ?? ''
              } else {
                mlDebug = `group-create-error-${createRes.status}`
              }
            }

            if (groupId) {
              const leadSummary = [
                `From: ${data.name} <${data.email}>`,
                data.package ? `Package: ${data.package}` : '',
                data.num_properties ? `Properties: ${data.num_properties}` : '',
                data.listing_url ? `Listing: ${data.listing_url}` : '',
                data.message ? `Message: ${data.message}` : '',
              ].filter(Boolean).join(' | ')

              // Update owner subscriber record with lead details
              const updateRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
                method: 'POST',
                headers: { Authorization: `Bearer ${mlApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: OWNER_EMAIL,
                  fields: { name: 'GuestGrowth Alert', last_name: leadSummary },
                  status: 'active',
                }),
              })
              const ownerData = await updateRes.json() as any
              const ownerId = ownerData?.data?.id ?? ''

              // Remove owner from group then re-add — forces "joins group" trigger to fire
              if (ownerId) {
                await fetch(`https://connect.mailerlite.com/api/subscribers/${ownerId}/groups/${groupId}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${mlApiKey}` },
                })
              }

              const subRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
                method: 'POST',
                headers: { Authorization: `Bearer ${mlApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: OWNER_EMAIL,
                  fields: { name: 'GuestGrowth Alert', last_name: leadSummary },
                  groups: [groupId],
                  status: 'active',
                }),
              })
              mlDebug = subRes.ok ? `ok:${groupId}` : `sub-error-${subRes.status}: ${await subRes.text()}`
            }
          } catch (err: any) {
            mlDebug = `exception: ${err?.message ?? err}`
            console.error('MailerLite group add failed', err)
          }
        }

        // Also notify owner directly — works once LOVABLE_API_KEY or RESEND_API_KEY is set
        // const ownerNotified = await sendOwnerEmail(data) — future

        console.log('guestgrowth-lead processed', { email: data.email, mlDebug, owner: OWNER_EMAIL })
        return Response.json({ ok: true, _ml: mlDebug })
      },
    },
  },
})
