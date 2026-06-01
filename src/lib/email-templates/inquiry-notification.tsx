import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface InquiryNotificationProps {
  name?: string
  email?: string
  phone?: string
  propertyInterest?: string
  checkIn?: string
  checkOut?: string
  message?: string
}

const InquiryNotificationEmail = ({
  name = 'Guest',
  email = '',
  phone = '',
  propertyInterest = '',
  checkIn = '',
  checkOut = '',
  message = '',
}: InquiryNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New inquiry from {name} — {propertyInterest || 'Sea & City Rentals'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>New Guest Inquiry</Text>
          <Heading style={h1}>Message from {name}</Heading>
        </Section>

        <Section style={body}>
          <Row label="Name" value={name} />
          <Row label="Email" value={email} />
          {phone && <Row label="Phone" value={phone} />}
          {propertyInterest && <Row label="Property interest" value={propertyInterest} />}
          {checkIn && <Row label="Check-in" value={checkIn} />}
          {checkOut && <Row label="Check-out" value={checkOut} />}

          <Hr style={hr} />

          <Text style={messageLabel}>Their message:</Text>
          <Text style={messageText}>{message}</Text>

          <Hr style={hr} />
          <Text style={footer}>Reply directly to {email} to respond.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Section style={row}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={valueStyle}>{value}</Text>
    </Section>
  )
}

export const template = {
  component: InquiryNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New inquiry from ${data.name ?? 'Guest'}${data.propertyInterest ? ` — ${data.propertyInterest}` : ''}`,
  displayName: 'Inquiry Notification (Host)',
  previewData: {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '555-123-4567',
    propertyInterest: 'Indian Rocks Beach A',
    checkIn: '2026-07-04',
    checkOut: '2026-07-11',
    message: 'Hi, we love your property! Does it allow pets? We have a small dog.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#1A3A4A', padding: '28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 10px',
}
const h1 = { fontSize: '24px', color: '#ffffff', margin: '0', lineHeight: '1.2' }
const body = { padding: '24px 28px' }
const row = { margin: '0 0 12px' }
const labelStyle = { fontSize: '11px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0' }
const valueStyle = { fontSize: '15px', color: '#222', margin: '2px 0 0' }
const messageLabel = { fontSize: '11px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 6px' }
const messageText = { fontSize: '15px', color: '#222', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e5e5e5', margin: '20px 0' }
const footer = { fontSize: '13px', color: '#999', margin: '0' }
