import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Row, Column,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://www.seaandcityrentals.com'

export interface BookingCancellationProps {
  guestName?: string
  propertyTitle?: string
  checkIn?: string
  checkOut?: string
  refundAmount?: string   // e.g. "$850 USD" or null/undefined = no refund
}

const BookingCancellationEmail = ({
  guestName = 'Guest',
  propertyTitle = 'Your Rental',
  checkIn = '—',
  checkOut = '—',
  refundAmount,
}: BookingCancellationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your booking has been cancelled — {propertyTitle}</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={header}>
          <Text style={kicker}>Booking Cancelled</Text>
          <Heading style={h1}>We've processed your cancellation</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Hi {guestName.split(' ')[0]}, your reservation at{' '}
            <strong>{propertyTitle}</strong> ({checkIn} → {checkOut}) has been cancelled.
          </Text>

          {refundAmount ? (
            <Section style={refundBox}>
              <Text style={refundTitle}>Refund Issued</Text>
              <Text style={refundAmount_}>
                {refundAmount}
              </Text>
              <Text style={refundNote}>
                Your full refund is on its way back to your original payment method.
                Allow 5–10 business days depending on your bank.
              </Text>
            </Section>
          ) : (
            <Section style={noRefundBox}>
              <Text style={noRefundTitle}>No Refund Applicable</Text>
              <Text style={noRefundNote}>
                As per our cancellation policy, bookings cancelled fewer than 5 days
                before check-in are not eligible for a refund. Your payment will not
                be returned.
              </Text>
            </Section>
          )}

          <Text style={text}>
            We hope to host you at Sea &amp; City Rentals in the future. Browse our
            properties at{' '}
            <a href={SITE_URL} style={link}>{SITE_URL}</a>.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>The {SITE_NAME} team · {SITE_URL}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingCancellationEmail,
  subject: (data: Record<string, any>) =>
    `Booking cancelled — ${data.propertyTitle ?? 'Your rental'}`,
  displayName: 'Booking Cancellation',
  previewData: {
    guestName: 'Jessica M.',
    propertyTitle: 'Waterfront 6BR | Heated Pool + Dock | Sleeps 15',
    checkIn: 'June 15, 2026',
    checkOut: 'June 22, 2026',
    refundAmount: '$3,850 USD',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#1A3A4A', padding: '32px 28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const h1 = { fontSize: '26px', color: '#ffffff', margin: '0', lineHeight: '1.2' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const refundBox = {
  border: '1px solid #22c55e', borderRadius: '6px', padding: '18px',
  backgroundColor: '#f0fdf4', margin: '20px 0', textAlign: 'center' as const,
}
const refundTitle = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#16a34a', margin: '0 0 8px', fontFamily: 'Arial, sans-serif',
}
const refundAmount_ = {
  fontSize: '28px', fontWeight: 'bold' as const, color: '#1A3A4A',
  margin: '0 0 8px', fontFamily: 'Arial, sans-serif',
}
const refundNote = { fontSize: '13px', color: '#555', lineHeight: '1.5', margin: '0', fontFamily: 'Arial, sans-serif' }
const noRefundBox = {
  border: '1px solid #e5e5e5', borderRadius: '6px', padding: '18px',
  backgroundColor: '#fafafa', margin: '20px 0',
}
const noRefundTitle = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#888', margin: '0 0 8px', fontFamily: 'Arial, sans-serif',
}
const noRefundNote = { fontSize: '13px', color: '#666', lineHeight: '1.5', margin: '0', fontFamily: 'Arial, sans-serif' }
const link = { color: '#1A3A4A' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0', fontFamily: 'Arial, sans-serif' }
