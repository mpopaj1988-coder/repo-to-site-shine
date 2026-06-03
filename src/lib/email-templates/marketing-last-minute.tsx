import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://seaandcityrentals.com'

interface LastMinuteProps {
  firstName?: string
  windowLabel?: string   // e.g. "this weekend" or "next 2 weeks"
  promoCode?: string
  promoDesc?: string     // e.g. "10% off — returning guests only"
}

const LastMinuteEmail = ({
  firstName = 'there',
  windowLabel = 'the next few weeks',
  promoCode = 'RETURN10',
  promoDesc = '10% off for returning guests',
}: LastMinuteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Last-minute openings just appeared — grab one before they're gone</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={header}>
          <Text style={kicker}>Limited Availability</Text>
          <Heading style={h1}>Last-minute dates just opened up</Heading>
          <Text style={subheading}>Book now for {windowLabel}</Text>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Hi {firstName},
          </Text>
          <Text style={text}>
            A few cancellations just came in, which means rare last-minute availability
            across our Tampa Bay properties. These dates won't last — Florida trips
            fill fast, especially on short notice.
          </Text>

          <Section style={urgencyBox}>
            <Text style={urgencyTitle}>Open right now</Text>
            <Text style={urgencyItem}>🌊 <strong>Indian Rocks Beach</strong> — beachside pool home, sleeps 6</Text>
            <Text style={urgencyItem}>🏙 <strong>St. Pete Rooftop</strong> — rooftop hot tub, walk to downtown</Text>
            <Text style={urgencyItem}>🌴 <strong>Clearwater</strong> — steps from the beach, private pool</Text>
            <Text style={urgencyNote}>
              Check real-time availability on each listing — calendar updates live.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={button} href={`${SITE_URL}/properties`}>
              Check availability now →
            </Button>
          </Section>

          <Hr style={thinHr} />

          <Section style={promoBox}>
            <Text style={promoLabel}>Use your returning-guest code</Text>
            <Text style={promoText}>
              Apply <strong style={{ letterSpacing: '0.1em' }}>{promoCode}</strong> at
              checkout to save. {promoDesc}.
            </Text>
          </Section>

          <Text style={text}>
            Travelling for the first time? We'd love to host you. Reply to this email
            with your dates and I'll personally help you find the right property.
          </Text>

          <Text style={signoff}>— Nella, host at {SITE_NAME}</Text>

          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} · Tampa Bay, FL ·{' '}
            <a href={SITE_URL} style={footerLink}>{SITE_URL}</a>
          </Text>
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
    windowLabel: 'late July',
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
const subheading = { fontSize: '15px', color: 'rgba(255,255,255,0.75)', margin: '0', fontFamily: 'Arial, sans-serif' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const urgencyBox = {
  border: '1px solid #1A3A4A', borderRadius: '6px',
  backgroundColor: '#F0F4F6', padding: '20px', margin: '0 0 20px',
}
const urgencyTitle = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const urgencyItem = { fontSize: '14px', color: '#333', margin: '0 0 8px', lineHeight: '1.4', fontFamily: 'Arial, sans-serif' }
const urgencyNote = {
  fontSize: '12px', color: '#888', fontStyle: 'italic' as const,
  margin: '12px 0 0', fontFamily: 'Arial, sans-serif',
}
const button = {
  backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '14px 32px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '14px',
  fontWeight: 'bold' as const, fontFamily: 'Arial, sans-serif', display: 'inline-block',
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
