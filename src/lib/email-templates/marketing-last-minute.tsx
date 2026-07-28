import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { UnsubscribeFooter } from './UnsubscribeFooter'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://seaandcityrentals.com'

export interface AvailableProp {
  title: string
  location: string
  slug: string
  tagline: string
  openWindow: string // e.g. "Jun 7–11" or "This weekend"
}

interface LastMinuteProps {
  firstName?: string
  availableProps?: AvailableProp[]
  promoCode?: string
  promoDesc?: string
  unsubscribeUrl?: string
}

const FALLBACK_PROPS: AvailableProp[] = [
  { title: 'Waterfront 6BR Pool Home', location: 'Tampa, FL', slug: 'tampa', tagline: 'Sleeps 15 · Heated pool · Private dock', openWindow: 'Dates open' },
  { title: 'Indian Rocks Beachside Retreat', location: 'Indian Rocks Beach, FL', slug: 'irb-a', tagline: 'Sleeps 6 · Steps to the beach · Hot tub', openWindow: 'Dates open' },
]

const LastMinuteEmail = ({
  firstName = 'there',
  availableProps = FALLBACK_PROPS,
  promoCode = 'RETURN10',
  promoDesc = '10% off for returning guests',
  unsubscribeUrl,
}: LastMinuteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Last-minute openings just appeared — grab one before they're gone</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={header}>
          <Text style={kicker}>Limited Availability</Text>
          <Heading style={h1}>Last-minute dates just opened up</Heading>
          <Text style={subheading}>{availableProps.length} propert{availableProps.length === 1 ? 'y' : 'ies'} open in the next 14 days</Text>
        </Section>

        <Section style={body}>
          <Text style={text}>Hi {firstName},</Text>
          <Text style={text}>
            These dates just became available — either through a cancellation or a
            calendar update. Last-minute Gulf Coast trips fill fast, especially in summer.
          </Text>

          {availableProps.map((p) => (
            <Section key={p.slug} style={propCard}>
              <Text style={propWindow}>{p.openWindow}</Text>
              <Text style={propTitle}>{p.title}</Text>
              <Text style={propLocation}>{p.location}</Text>
              <Text style={propTagline}>{p.tagline}</Text>
              <Button style={cardBtn} href={`${SITE_URL}/listings/${p.slug}#availability`}>
                Check dates &amp; book →
              </Button>
            </Section>
          ))}

          <Hr style={thinHr} />

          <Section style={promoBox}>
            <Text style={promoLabel}>Returning guest?</Text>
            <Text style={promoText}>
              Use <strong style={{ letterSpacing: '0.08em' }}>{promoCode}</strong> at checkout — {promoDesc}.
            </Text>
          </Section>

          <Text style={text}>
            Need help picking? Reply and I'll personally recommend the right property for your group.
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
  component: LastMinuteEmail,
  subject: '⚡ Last-minute dates just opened — grab them before they go',
  displayName: 'Marketing — Last-Minute Availability',
  previewData: {
    firstName: 'Jessica',
    availableProps: [
      { title: 'Waterfront 6BR Pool Home', location: 'Tampa, FL', slug: 'tampa', tagline: 'Sleeps 15 · Heated pool · Private dock', openWindow: 'Jun 7–11' },
      { title: 'St. Pete Rooftop Hot Tub', location: 'St. Petersburg, FL', slug: 'stpete-hottub', tagline: 'Sleeps 4 · Rooftop terrace · Walk to downtown', openWindow: 'Jun 9–12' },
    ] as AvailableProp[],
    promoCode: 'RETURN10',
    promoDesc: '10% off for returning guests',
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
const propWindow = {
  fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 6px', fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold' as const,
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
const signoff = { fontSize: '14px', color: '#555', fontStyle: 'italic' as const, margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0', fontFamily: 'Arial, sans-serif' }
const footerLink = { color: '#999', textDecoration: 'underline' }
