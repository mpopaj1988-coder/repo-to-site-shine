import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text, Row, Column,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://www.seaandcityrentals.com'

export interface BookingConfirmationProps {
  guestName?: string
  propertyTitle?: string
  checkIn?: string   // e.g. "June 15, 2026"
  checkOut?: string
  nights?: number
  accommodation?: string // e.g. "$742 USD"
  cleaningFee?: string   // e.g. "$150 USD"
  tax?: string           // e.g. "$130 USD"
  total?: string         // e.g. "$1,022 USD"
  cancelUrl?: string
}

const BookingConfirmationEmail = ({
  guestName = 'Guest',
  propertyTitle = 'Your Rental',
  checkIn = '—',
  checkOut = '—',
  nights = 1,
  accommodation,
  cleaningFee,
  tax,
  total = '—',
  cancelUrl = SITE_URL,
}: BookingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your booking is confirmed — {propertyTitle}, {checkIn} → {checkOut}</Preview>
    <Body style={main}>
      <Container style={container}>

        {/* Header */}
        <Section style={header}>
          <Text style={kicker}>Booking Confirmed</Text>
          <Heading style={h1}>You're booked, {guestName.split(' ')[0]}!</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Great news — your reservation at <strong>{propertyTitle}</strong> is confirmed.
            We'll be in touch before your arrival with check-in details.
          </Text>

          {/* Booking summary */}
          <Section style={summaryBox}>
            <Text style={summaryTitle}>Booking Summary</Text>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Property</Column>
              <Column style={summaryValue}>{propertyTitle}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Check-in</Column>
              <Column style={summaryValue}>{checkIn}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Check-out</Column>
              <Column style={summaryValue}>{checkOut}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Nights</Column>
              <Column style={summaryValue}>{nights}</Column>
            </Row>
            {accommodation && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>Accommodation</Column>
                <Column style={summaryValue}>{accommodation}</Column>
              </Row>
            )}
            {cleaningFee && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>Cleaning fee</Column>
                <Column style={summaryValue}>{cleaningFee}</Column>
              </Row>
            )}
            {tax && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>FL taxes (14.5%)</Column>
                <Column style={summaryValue}>{tax}</Column>
              </Row>
            )}
            <Hr style={summaryDivider} />
            <Row style={summaryRow}>
              <Column style={{ ...summaryLabel, fontWeight: 'bold' as const, color: '#1A3A4A' }}>Total paid</Column>
              <Column style={{ ...summaryValue, fontWeight: 'bold' as const, color: '#1A3A4A' }}>{total}</Column>
            </Row>
          </Section>

          {/* Cancellation policy */}
          <Section style={policyBox}>
            <Text style={policyTitle}>Cancellation Policy</Text>
            <Text style={policyText}>
              ✓ <strong>Free cancellation</strong> if you cancel <strong>5 or more days before check-in</strong> — full refund, no questions asked.
            </Text>
            <Text style={policyText}>
              ✗ <strong>No refund</strong> for cancellations made fewer than 5 days before check-in.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={cancelBtn} href={cancelUrl}>
              Cancel This Booking
            </Button>
          </Section>

          <Text style={smallText}>
            Need to change your dates or have questions? Just reply to this email —
            we read every message.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>The {SITE_NAME} team · {SITE_URL}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Booking confirmed — ${data.propertyTitle ?? 'Your rental'}, ${data.checkIn ?? ''}`,
  displayName: 'Booking Confirmation',
  previewData: {
    guestName: 'Jessica M.',
    propertyTitle: 'Waterfront 6BR | Heated Pool + Dock | Sleeps 15',
    checkIn: 'June 15, 2026',
    checkOut: 'June 22, 2026',
    nights: 7,
    accommodation: '$3,362 USD',
    tax: '$488 USD',
    total: '$3,850 USD',
    cancelUrl: 'https://www.seaandcityrentals.com/cancel-booking?token=preview',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#1A3A4A', padding: '32px 28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const h1 = { fontSize: '28px', color: '#ffffff', margin: '0', lineHeight: '1.2' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const summaryBox = {
  border: '1px solid #e5e5e5', borderRadius: '6px', padding: '20px',
  backgroundColor: '#F9F6F0', margin: '20px 0',
}
const summaryTitle = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '0 0 14px', fontFamily: 'Arial, sans-serif',
}
const summaryRow = { margin: '0 0 8px' }
const summaryLabel = { fontSize: '13px', color: '#888', width: '120px', fontFamily: 'Arial, sans-serif' }
const summaryValue = { fontSize: '13px', color: '#333', fontFamily: 'Arial, sans-serif' }
const summaryDivider = { borderColor: '#e5e5e5', margin: '12px 0' }
const policyBox = {
  border: '1px solid #C9A84C', borderRadius: '6px', padding: '18px',
  backgroundColor: '#FFFDF7', margin: '20px 0',
}
const policyTitle = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '0 0 10px', fontFamily: 'Arial, sans-serif',
}
const policyText = { fontSize: '13px', color: '#555', lineHeight: '1.5', margin: '0 0 6px', fontFamily: 'Arial, sans-serif' }
const cancelBtn = {
  backgroundColor: '#ffffff', color: '#1A3A4A', padding: '12px 28px',
  borderRadius: '4px', border: '2px solid #1A3A4A', textDecoration: 'none',
  fontSize: '13px', fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const smallText = { fontSize: '13px', color: '#666', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0', fontFamily: 'Arial, sans-serif' }
