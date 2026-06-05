import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface GuestGrowthLeadProps {
  name?: string
  email?: string
  num_properties?: string
  listing_url?: string
  package?: string
  message?: string
}

const GuestGrowthLeadNotify = ({
  name = 'Test User',
  email = 'test@example.com',
  num_properties = '2',
  listing_url = 'airbnb.com/rooms/12345',
  package: pkg = 'email-automation',
  message = 'Looking forward to learning more.',
}: GuestGrowthLeadProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New GuestGrowth lead: {name} ({pkg})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>GuestGrowth QR System</Text>
          <Heading style={h1}>New Lead</Heading>
        </Section>
        <Section style={body}>
          <Row label="Name" value={name} />
          <Row label="Email" value={email} />
          <Row label="Package" value={pkg} />
          <Row label="Properties" value={num_properties} />
          {listing_url && <Row label="Listing URL" value={listing_url} />}
          {message && <Row label="Message" value={message} />}
          <Hr style={hr} />
          <Text style={footer}>Reply directly to {email} to follow up.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <Section style={row}>
      <Text style={rowLabel}>{label}</Text>
      <Text style={rowValue}>{value}</Text>
    </Section>
  )
}

export const template = {
  component: GuestGrowthLeadNotify,
  subject: ({ name, package: pkg }: Record<string, any>) =>
    `New GuestGrowth lead: ${name ?? 'Unknown'} — ${pkg ?? 'unknown package'}`,
  displayName: 'GuestGrowth Lead Notification',
  to: 'vacation@seaandcityrentals.com',
  previewData: {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    num_properties: '3',
    listing_url: 'airbnb.com/rooms/99999',
    package: 'email-automation',
    message: 'Interested in getting started ASAP.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '540px', margin: '0 auto', backgroundColor: '#ffffff' }
const header = { backgroundColor: '#1A3A4A', padding: '24px 28px' }
const kicker = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 8px',
}
const h1 = { fontSize: '22px', color: '#ffffff', margin: '0' }
const body = { padding: '24px 28px' }
const row = { marginBottom: '14px' }
const rowLabel = {
  fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const,
  color: '#888888', margin: '0 0 2px',
}
const rowValue = { fontSize: '15px', color: '#111111', margin: '0' }
const hr = { borderColor: '#e5e5e5', margin: '20px 0 16px' }
const footer = { fontSize: '13px', color: '#666666', margin: '0' }
