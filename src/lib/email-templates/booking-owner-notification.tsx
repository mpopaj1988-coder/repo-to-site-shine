import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Row, Column,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://www.seaandcityrentals.com'

export interface BookingOwnerNotificationProps {
  guestName?: string
  guestEmail?: string
  propertyTitle?: string
  checkIn?: string
  checkOut?: string
  nights?: number
  guests?: number
  accommodation?: string
  discount?: string
  discountLabel?: string
  cleaningFee?: string
  tax?: string
  total?: string
  stripeSessionId?: string
  hospitableCreated?: boolean
}

const BookingOwnerNotificationEmail = ({
  guestName = 'Unknown',
  guestEmail = '—',
  propertyTitle = 'Your Rental',
  checkIn = '—',
  checkOut = '—',
  nights = 1,
  guests = 1,
  accommodation,
  discount,
  discountLabel,
  cleaningFee,
  tax,
  total = '—',
  stripeSessionId = '—',
  hospitableCreated = false,
}: BookingOwnerNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New booking: {propertyTitle} · {checkIn} → {checkOut}</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={header}>
          <Text style={kicker}>New Direct Booking</Text>
          <Heading style={h1}>You have a new reservation</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>
            A guest just booked through your website and paid via Stripe. Here are the details:
          </Text>

          <Section style={summaryBox}>
            <Text style={summaryTitle}>Reservation Details</Text>
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
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Guests</Column>
              <Column style={summaryValue}>{guests}</Column>
            </Row>
            {accommodation && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>Accommodation</Column>
                <Column style={summaryValue}>{accommodation}</Column>
              </Row>
            )}
            {discount && (
              <Row style={summaryRow}>
                <Column style={{ ...summaryLabel, color: '#16a34a' }}>{discountLabel ?? 'Discount'}</Column>
                <Column style={{ ...summaryValue, color: '#16a34a' }}>{discount}</Column>
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
              <Column style={{ ...summaryLabel, fontWeight: 'bold' as const, color: '#1A3A4A' }}>Total collected</Column>
              <Column style={{ ...summaryValue, fontWeight: 'bold' as const, color: '#1A3A4A' }}>{total}</Column>
            </Row>
          </Section>

          <Section style={guestBox}>
            <Text style={summaryTitle}>Guest Info</Text>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Name</Column>
              <Column style={summaryValue}>{guestName}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Email</Column>
              <Column style={summaryValue}>{guestEmail}</Column>
            </Row>
          </Section>

          <Section style={hospitableCreated ? successBox : warningBox}>
            <Text style={statusText}>
              {hospitableCreated
                ? '✓ Reservation created in Hospitable — calendar blocked automatically.'
                : '⚠ Could not create reservation in Hospitable. Please block these dates manually to prevent double-booking.'}
            </Text>
          </Section>

          <Text style={smallText}>
            Stripe session: {stripeSessionId}
          </Text>

          <Hr style={hr} />
          <Text style={footer}>{SITE_NAME} · {SITE_URL}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingOwnerNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New booking: ${data.propertyTitle ?? 'Rental'} · ${data.checkIn ?? ''} → ${data.checkOut ?? ''}`,
  displayName: 'Booking Owner Notification',
  to: 'mpopaj1988@gmail.com',
  previewData: {
    guestName: 'Jessica M.',
    guestEmail: 'jessica@example.com',
    propertyTitle: 'Waterfront 6BR | Heated Pool + Dock | Sleeps 15',
    checkIn: 'June 15, 2026',
    checkOut: 'June 22, 2026',
    nights: 7,
    guests: 4,
    accommodation: '$3,362 USD',
    tax: '$488 USD',
    total: '$3,850 USD',
    stripeSessionId: 'cs_live_abc123',
    hospitableCreated: true,
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
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const summaryBox = {
  border: '1px solid #e5e5e5', borderRadius: '6px', padding: '20px',
  backgroundColor: '#F9F6F0', margin: '20px 0',
}
const guestBox = {
  border: '1px solid #e5e5e5', borderRadius: '6px', padding: '20px',
  backgroundColor: '#f4f8fb', margin: '20px 0',
}
const summaryTitle = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '0 0 14px',
}
const summaryRow = { margin: '0 0 8px' }
const summaryLabel = { fontSize: '13px', color: '#888', width: '120px' }
const summaryValue = { fontSize: '13px', color: '#333' }
const summaryDivider = { borderColor: '#e5e5e5', margin: '12px 0' }
const successBox = {
  border: '1px solid #22c55e', borderRadius: '6px', padding: '14px 18px',
  backgroundColor: '#f0fdf4', margin: '20px 0',
}
const warningBox = {
  border: '1px solid #f59e0b', borderRadius: '6px', padding: '14px 18px',
  backgroundColor: '#fffbeb', margin: '20px 0',
}
const statusText = { fontSize: '13px', color: '#333', margin: '0', lineHeight: '1.5' }
const smallText = { fontSize: '12px', color: '#999', margin: '0 0 4px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0' }
