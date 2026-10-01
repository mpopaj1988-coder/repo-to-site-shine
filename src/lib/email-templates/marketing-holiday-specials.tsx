import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { UnsubscribeFooter } from './UnsubscribeFooter'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://seaandcityrentals.com'

export interface HolidayProp {
  title: string
  location: string
  slug: string
  tagline: string
}

interface HolidaySpecialsProps {
  firstName?: string
  holidayName?: string // e.g. "the holidays", "Thanksgiving", "New Year's"
  featuredProps?: HolidayProp[]
  promoCode?: string
  promoDesc?: string
  minNights?: number // minimum stay required to use the code
  bookByDate?: string // e.g. "Dec 1"
  unsubscribeUrl?: string
}

const FALLBACK_PROPS: HolidayProp[] = [
  { title: 'Waterfront 6BR Pool Home', location: 'Tampa, FL', slug: 'tampa', tagline: 'Sleeps 15 · Heated pool · Room for the whole family' },
  { title: 'Luxury 3BR Pool Retreat', location: 'Largo, FL', slug: 'largo', tagline: 'Sleeps 11 · Fire pit · 5 min to Indian Rocks Beach' },
]

const HolidaySpecialsEmail = ({
  firstName = 'there',
  holidayName = 'the holidays',
  featuredProps = FALLBACK_PROPS,
  promoCode = 'HOLIDAY10',
  promoDesc = '10% off direct holiday bookings',
  minNights = 10,
  bookByDate,
  unsubscribeUrl,
}: HolidaySpecialsProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Warm Gulf Coast days for {holidayName} — book direct and save</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={header}>
          <Text style={kicker}>Holiday Special</Text>
          <Heading style={h1}>Trade the cold for the coast this {holidayName}</Heading>
          <Text style={subheading}>Direct-booking savings for our Tampa Bay properties</Text>
        </Section>

        <Section style={body}>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            {holidayName === 'the holidays' ? 'The holidays are' : `${holidayName} is`} one of our busiest
            times of year — families and friends heading to Tampa Bay for warm days, sunsets, and time
            together away from the snow. Book direct and skip the Airbnb fees while dates are still open.
          </Text>

          {featuredProps.map((p) => (
            <Section key={p.slug} style={propCard}>
              <Text style={propTitle}>{p.title}</Text>
              <Text style={propLocation}>{p.location}</Text>
              <Text style={propTagline}>{p.tagline}</Text>
              <Button style={cardBtn} href={`${SITE_URL}/listings/${p.slug}#availability`}>
                Check holiday dates →
              </Button>
            </Section>
          ))}

          <Hr style={thinHr} />

          <Section style={promoBox}>
            <Text style={promoLabel}>Holiday code</Text>
            <Text style={promoText}>
              Use <strong style={{ letterSpacing: '0.08em' }}>{promoCode}</strong> at checkout — {promoDesc}
              {bookByDate ? ` if you book by ${bookByDate}` : ''}.
            </Text>
            <Text style={promoFinePrint}>
              Valid on stays of {minNights}+ nights.
            </Text>
          </Section>

          <Text style={text}>
            Perfect for a longer holiday stay — {minNights} nights or more gets you the code. Reply to
            this email and I'll help you find the right place for your group.
          </Text>
          <Text style={signoff}>— Nella</Text>

          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} · Tampa Bay, FL ·{' '}
            <a href={SITE_URL} style={footerLink}>{SITE_URL}</a>
          </Text>
          <UnsubscribeFooter url={unsubscribeUrl} />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: HolidaySpecialsEmail,
  subject: '🎄 Holiday special — save on your Tampa Bay getaway',
  displayName: 'Marketing — Holiday Specials',
  previewData: {
    firstName: 'Jessica',
    holidayName: 'Christmas',
    featuredProps: [
      { title: 'Waterfront 6BR Pool Home', location: 'Tampa, FL', slug: 'tampa', tagline: 'Sleeps 15 · Heated pool · Room for the whole family' },
      { title: 'St. Pete Rooftop Hot Tub', location: 'St. Petersburg, FL', slug: 'stpete-hottub', tagline: 'Sleeps 4 · Rooftop terrace · Walk to downtown' },
    ] as HolidayProp[],
    promoCode: 'HOLIDAY10',
    promoDesc: '10% off direct holiday bookings',
    minNights: 10,
    bookByDate: 'Dec 1',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#1A3A4A', padding: '36px 28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const h1 = { fontSize: '28px', color: '#ffffff', margin: '0 0 8px', lineHeight: '1.2' }
const subheading = { fontSize: '14px', color: 'rgba(255,255,255,0.75)', margin: '0', fontFamily: 'Arial, sans-serif' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const propCard = {
  border: '1px solid #1A3A4A', borderRadius: '6px',
  backgroundColor: '#F0F4F6', padding: '18px', margin: '0 0 14px',
}
const propTitle = { fontSize: '16px', color: '#1A3A4A', fontWeight: 'bold' as const, margin: '0 0 3px', lineHeight: '1.3' }
const propLocation = {
  fontSize: '11px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  margin: '0 0 6px', fontFamily: 'Arial, sans-serif',
}
const propTagline = { fontSize: '13px', color: '#555', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const cardBtn = {
  backgroundColor: '#1A3A4A', color: '#ffffff', padding: '10px 20px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '13px',
  fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const thinHr = { borderColor: '#f0f0f0', margin: '24px 0' }
const promoBox = {
  backgroundColor: '#F5EFE4', border: '1px dashed #C9A84C', borderRadius: '6px',
  padding: '16px 20px', margin: '0 0 20px',
}
const promoLabel = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '0 0 4px', fontFamily: 'Arial, sans-serif',
}
const promoText = { fontSize: '14px', color: '#333', margin: '0', lineHeight: '1.5', fontFamily: 'Arial, sans-serif' }
const promoFinePrint = { fontSize: '12px', color: '#8a7a52', margin: '8px 0 0', fontFamily: 'Arial, sans-serif' }
const signoff = { fontSize: '14px', color: '#555', fontStyle: 'italic' as const, margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0', fontFamily: 'Arial, sans-serif' }
const footerLink = { color: '#999', textDecoration: 'underline' }
