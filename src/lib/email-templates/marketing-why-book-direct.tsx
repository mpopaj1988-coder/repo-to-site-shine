import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview,
  Section, Text, Row, Column,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { UnsubscribeFooter } from './UnsubscribeFooter'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://seaandcityrentals.com'

interface WhyBookDirectProps {
  firstName?: string
  code?: string
  unsubscribeUrl?: string
}

const WhyBookDirectEmail = ({ firstName = 'there', code, unsubscribeUrl }: WhyBookDirectProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Skip the Airbnb fees — here's what you save when you book direct with us</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={header}>
          <Text style={kicker}>Direct Booking Perk</Text>
          <Heading style={h1}>Why book direct?</Heading>
          <Text style={subheading}>Here's exactly what you save</Text>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Hi {firstName},
          </Text>
          <Text style={text}>
            Most guests don't realise how much Airbnb and VRBO add on top of the
            rental price. We list on those platforms — but if you book directly
            through our site, you skip every one of those fees.
          </Text>

          {code && (
            <Section style={codeBox}>
              <Text style={codeLabel}>YOUR CODE IS STILL WAITING</Text>
              <Text style={codeValue}>{code}</Text>
            </Section>
          )}

          <Section style={comparisonBox}>
            <Text style={comparisonTitle}>A typical 5-night stay</Text>
            <Row style={compRow}>
              <Column style={compLabel}>Rental cost</Column>
              <Column style={compAirbnb}>$1,000</Column>
              <Column style={compDirect}>$1,000</Column>
            </Row>
            <Row style={compRow}>
              <Column style={compLabel}>Platform service fee</Column>
              <Column style={compAirbnb}>+ $160</Column>
              <Column style={compDirect}>—</Column>
            </Row>
            <Row style={compRow}>
              <Column style={compLabel}>Cleaning fee markup</Column>
              <Column style={compAirbnb}>+ $40</Column>
              <Column style={compDirect}>—</Column>
            </Row>
            <Hr style={summaryDivider} />
            <Row style={{ ...compRow, fontWeight: 'bold' as const }}>
              <Column style={{ ...compLabel, color: '#1A3A4A', fontWeight: 'bold' as const }}>You pay</Column>
              <Column style={{ ...compAirbnb, color: '#c0392b', fontWeight: 'bold' as const }}>$1,200</Column>
              <Column style={{ ...compDirect, color: '#1A3A4A', fontWeight: 'bold' as const }}>$1,000</Column>
            </Row>
            <Row>
              <Column style={compLabel} />
              <Column style={compAirbnbHead}>Airbnb</Column>
              <Column style={compDirectHead}>Direct ✓</Column>
            </Row>
          </Section>

          <Text style={text}>
            Beyond the savings, direct bookings also mean:
          </Text>

          {[
            ['Direct host contact', 'Text or email us anytime — no support ticket queue.'],
            ['Flexible dates', 'We can sometimes accommodate arrivals Airbnb won\'t allow.'],
            ['Loyalty perks', 'Return guests get 10% off with code RETURN10.'],
          ].map(([title, desc]) => (
            <Row key={title} style={benefitRow}>
              <Column style={benefitIcon}>✦</Column>
              <Column>
                <Text style={benefitTitle}>{title}</Text>
                <Text style={benefitDesc}>{desc}</Text>
              </Column>
            </Row>
          ))}

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={`${SITE_URL}/properties`}>
              Browse & book direct
            </Button>
          </Section>

          <Text style={smallText}>
            Questions? Just reply — Nella reads every message personally.
          </Text>

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
  component: WhyBookDirectEmail,
  subject: 'Skip the Airbnb fees — book direct & save',
  displayName: 'Marketing — Why Book Direct',
  previewData: { firstName: 'Jessica', code: 'DIRECT7X9K2' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#1A3A4A', padding: '36px 28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const h1 = { fontSize: '30px', color: '#ffffff', margin: '0 0 6px', lineHeight: '1.2' }
const subheading = { fontSize: '15px', color: 'rgba(255,255,255,0.75)', margin: '0', fontFamily: 'Arial, sans-serif' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = {
  border: '2px dashed #C9A84C', borderRadius: '6px', padding: '18px',
  textAlign: 'center' as const, margin: '0 0 24px', backgroundColor: '#F5EFE4',
}
const codeLabel = {
  fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '0 0 6px', fontFamily: 'Arial, sans-serif',
}
const codeValue = {
  fontSize: '26px', fontWeight: 'bold' as const, color: '#1A3A4A',
  margin: '0', letterSpacing: '0.15em', fontFamily: 'Arial, sans-serif',
}
const comparisonBox = {
  border: '1px solid #e5e5e5', borderRadius: '6px',
  backgroundColor: '#F9F6F0', margin: '20px 0', overflow: 'hidden' as const,
}
const comparisonTitle = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '16px 16px 10px', fontFamily: 'Arial, sans-serif',
}
const compRow = { padding: '6px 16px' }
const compLabel = { fontSize: '13px', color: '#555', fontFamily: 'Arial, sans-serif', width: '55%' }
const compAirbnb = { fontSize: '13px', color: '#c0392b', fontFamily: 'Arial, sans-serif', width: '22%', textAlign: 'right' as const }
const compDirect = { fontSize: '13px', color: '#1A7A4A', fontFamily: 'Arial, sans-serif', width: '23%', textAlign: 'right' as const }
const compAirbnbHead = { fontSize: '10px', color: '#999', fontFamily: 'Arial, sans-serif', textAlign: 'right' as const, padding: '4px 16px 12px' }
const compDirectHead = { fontSize: '10px', color: '#1A3A4A', fontWeight: 'bold' as const, fontFamily: 'Arial, sans-serif', textAlign: 'right' as const, padding: '4px 16px 12px' }
const summaryDivider = { borderColor: '#e5e5e5', margin: '8px 16px' }
const benefitRow = { margin: '0 0 14px' }
const benefitIcon = { fontSize: '16px', color: '#C9A84C', width: '28px', verticalAlign: 'top' as const }
const benefitTitle = { fontSize: '14px', fontWeight: 'bold' as const, color: '#1A3A4A', margin: '0 0 2px', fontFamily: 'Arial, sans-serif' }
const benefitDesc = { fontSize: '13px', color: '#666', margin: '0', lineHeight: '1.5', fontFamily: 'Arial, sans-serif' }
const button = {
  backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '14px 32px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '14px',
  fontWeight: 'bold' as const, fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const smallText = { fontSize: '13px', color: '#666', lineHeight: '1.6', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0', fontFamily: 'Arial, sans-serif' }
const footerLink = { color: '#999', textDecoration: 'underline' }
