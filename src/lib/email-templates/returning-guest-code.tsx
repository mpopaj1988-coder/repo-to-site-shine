import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { UnsubscribeFooter } from './UnsubscribeFooter'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://seaandcityrentals.com'
const CODE = 'RETURN10'

interface ReturningGuestCodeProps {
  unsubscribeUrl?: string
}

const ReturningGuestCodeEmail = ({ unsubscribeUrl }: ReturningGuestCodeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your returning-guest code for 10% off is inside</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>Welcome Back</Text>
          <Heading style={h1}>Here's your 10% off code</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Thanks for coming back to {SITE_NAME}. As a returning guest, you get
            10% off your next direct booking — no platform fees on top of that either.
          </Text>

          <Section style={codeBox}>
            <Text style={codeLabel}>YOUR CODE</Text>
            <Text style={codeValue}>{CODE}</Text>
          </Section>

          <Text style={text}>
            Enter this code at checkout when you book direct. It applies once per booking.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={button} href={`${SITE_URL}/properties`}>
              Browse properties →
            </Button>
          </Section>

          <Text style={text}>
            Questions about a specific property or dates? Just reply to this email — we'll get back to you fast.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>The {SITE_NAME} team</Text>
          <UnsubscribeFooter url={unsubscribeUrl} />
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReturningGuestCodeEmail,
  subject: 'Your returning-guest code — 10% off your next stay',
  displayName: 'Returning guest — 10% off code',
  previewData: {},
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0' }
const header = { backgroundColor: '#1A3A4A', padding: '32px 28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const h1 = { fontSize: '28px', color: '#ffffff', margin: '0', lineHeight: '1.2' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = {
  border: '2px dashed #C9A84C', borderRadius: '6px', padding: '20px',
  textAlign: 'center' as const, margin: '24px 0', backgroundColor: '#F5EFE4',
}
const codeLabel = {
  fontSize: '11px', letterSpacing: '0.25em', color: '#1A3A4A',
  margin: '0 0 6px', fontFamily: 'Arial, sans-serif',
}
const codeValue = {
  fontSize: '28px', fontWeight: 'bold' as const, color: '#1A3A4A',
  margin: '0', letterSpacing: '0.15em', fontFamily: 'Arial, sans-serif',
}
const button = {
  backgroundColor: '#1A3A4A', color: '#ffffff', padding: '14px 28px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '14px',
  fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
