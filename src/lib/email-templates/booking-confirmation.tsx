import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Sea & City Rentals'
const PHONE = '248-766-2957'

interface BookingConfirmationProps {
  guestName?: string
  propertyName?: string
  checkIn?: string
  checkOut?: string
  nights?: number
  total?: string
  currency?: string
}

const BookingConfirmationEmail = ({
  guestName = 'Guest',
  propertyName = 'your property',
  checkIn = '',
  checkOut = '',
  nights = 1,
  total = '0',
  currency = 'USD',
}: BookingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your booking at {propertyName} is confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Text style={kicker}>Booking Confirmed</Text>
          <Heading style={h1}>You're all set, {guestName}!</Heading>
          <Text style={text}>
            Your reservation at <strong>{propertyName}</strong> is confirmed and paid.
            We can't wait to host you.
          </Text>
        </Section>

        <Hr style={hr} />

        <Section style={detailsBox}>
          <div style={row}>
            <Text style={label}>Check-in</Text>
            <Text style={valueText}>{checkIn}</Text>
          </div>
          <div style={row}>
            <Text style={label}>Check-out</Text>
            <Text style={valueText}>{checkOut}</Text>
          </div>
          <div style={row}>
            <Text style={label}>Nights</Text>
            <Text style={valueText}>{nights}</Text>
          </div>
          <div style={row}>
            <Text style={label}>Total paid</Text>
            <Text style={{ ...valueText, fontWeight: '700', color: '#1a2e4a' }}>
              ${total} {currency}
            </Text>
          </div>
        </Section>

        <Hr style={hr} />

        <Section>
          <Text style={text}>
            We'll send check-in instructions a few days before your arrival. In the
            meantime, if you have any questions, reply to this email or call us at{' '}
            <strong>{PHONE}</strong>.
          </Text>
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f5f0eb', fontFamily: 'Jost, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '4px', overflow: 'hidden' as const, padding: '40px' }
const kicker = { fontSize: '10px', fontWeight: '700', letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: '#3b8f8c', margin: '0 0 8px' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#1a2e4a', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#444', margin: '0 0 12px' }
const hr = { borderTop: '1px solid #e5e0da', margin: '24px 0' }
const detailsBox = { backgroundColor: '#f5f0eb', borderRadius: '4px', padding: '20px' }
const row = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }
const label = { fontSize: '12px', color: '#888', margin: '0', fontWeight: '500' }
const valueText = { fontSize: '14px', color: '#333', margin: '0', fontWeight: '500' }
const footer = { fontSize: '13px', color: '#888', marginTop: '16px' }

export const template: TemplateEntry = {
  component: BookingConfirmationEmail,
  subject: (data: Record<string, unknown>) =>
    `Booking confirmed — ${typeof data.propertyName === 'string' ? data.propertyName : 'your stay'}`,
  displayName: 'Booking Confirmation',
  previewData: {
    guestName: 'Alex',
    propertyName: 'Largo Pool Home',
    checkIn: '2025-07-04',
    checkOut: '2025-07-07',
    nights: 3,
    total: '1200',
    currency: 'USD',
  },
}
