import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview,
  Section, Text, Row, Column,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { UnsubscribeFooter } from './UnsubscribeFooter'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://seaandcityrentals.com'

interface PropertyShowcaseProps {
  firstName?: string
  season?: string
  unsubscribeUrl?: string
}

const properties = [
  {
    slug: 'tampa',
    title: 'Waterfront 6BR Pool Home',
    location: 'Tampa, FL',
    tagline: 'Sleeps 15 · Heated pool · Private dock · Hot tub',
    badge: 'Most Popular',
  },
  {
    slug: 'stpete-hottub',
    title: 'St. Pete Rooftop Hot Tub',
    location: 'St. Petersburg, FL',
    tagline: 'Sleeps 4 · Rooftop terrace · Walk to downtown',
    badge: 'City Escape',
  },
  {
    slug: 'irb-a',
    title: 'Indian Rocks Beachside Retreat',
    location: 'Indian Rocks Beach, FL',
    tagline: 'Sleeps 6 · Steps to the beach · Private pool',
    badge: 'Beach Pick',
  },
]

const PropertyShowcaseEmail = ({
  firstName = 'there',
  season = 'this season',
  unsubscribeUrl,
}: PropertyShowcaseProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Nella's hand-picked favourites for {season} — all available to book direct</Preview>
    <Body style={main}>
      <Container style={container}>

        <Section style={header}>
          <Text style={kicker}>Hand-Picked by Nella</Text>
          <Heading style={h1}>Our top stays for {season}</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Hi {firstName},
          </Text>
          <Text style={text}>
            Whether you're planning a family reunion on the water, a romantic city
            weekend, or a barefoot beach escape — here are three properties I'd
            personally put you in right now.
          </Text>

          {properties.map((p) => (
            <Section key={p.slug} style={propertyCard}>
              <Row>
                <Column style={badgeCol}>
                  <Text style={badge}>{p.badge}</Text>
                </Column>
              </Row>
              <Text style={propertyTitle}>{p.title}</Text>
              <Text style={propertyLocation}>{p.location}</Text>
              <Text style={propertyTagline}>{p.tagline}</Text>
              <Button style={cardButton} href={`${SITE_URL}/listings/${p.slug}`}>
                View & book →
              </Button>
            </Section>
          ))}

          <Hr style={hr} />

          <Section style={promoBox}>
            <Text style={promoLabel}>Returning guest?</Text>
            <Text style={promoText}>
              Use code <strong>RETURN10</strong> at checkout for 10% off your next stay.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={`${SITE_URL}/properties`}>
              See all 9 properties
            </Button>
          </Section>

          <Text style={smallText}>
            Questions about a specific property? Reply to this email — I read every one.
          </Text>
          <Text style={smallText}>— Nella</Text>

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
  component: PropertyShowcaseEmail,
  subject: (data: Record<string, any>) =>
    `Nella's top picks for ${data.season ?? 'your next Florida trip'}`,
  displayName: 'Marketing — Property Showcase',
  previewData: { firstName: 'Jessica', season: 'summer' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#1A3A4A', padding: '36px 28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const h1 = { fontSize: '30px', color: '#ffffff', margin: '0', lineHeight: '1.2' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const propertyCard = {
  border: '1px solid #e5e5e5', borderRadius: '6px', padding: '20px',
  margin: '0 0 16px', backgroundColor: '#FAFAFA',
}
const badgeCol = { paddingBottom: '8px' }
const badge = {
  display: 'inline-block' as const, backgroundColor: '#C9A84C', color: '#1A3A4A',
  fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' as const,
  padding: '3px 10px', borderRadius: '2px', margin: '0',
  fontFamily: 'Arial, sans-serif', fontWeight: 'bold' as const,
}
const propertyTitle = {
  fontSize: '17px', color: '#1A3A4A', fontWeight: 'bold' as const,
  margin: '0 0 4px', lineHeight: '1.3',
}
const propertyLocation = {
  fontSize: '12px', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  margin: '0 0 6px', fontFamily: 'Arial, sans-serif',
}
const propertyTagline = { fontSize: '13px', color: '#555', margin: '0 0 14px', fontFamily: 'Arial, sans-serif' }
const cardButton = {
  backgroundColor: '#1A3A4A', color: '#ffffff', padding: '10px 20px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '13px',
  fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const promoBox = {
  backgroundColor: '#F5EFE4', border: '1px dashed #C9A84C', borderRadius: '6px',
  padding: '16px 20px', margin: '0 0 20px',
}
const promoLabel = {
  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase' as const,
  color: '#1A3A4A', margin: '0 0 4px', fontFamily: 'Arial, sans-serif',
}
const promoText = { fontSize: '14px', color: '#333', margin: '0', fontFamily: 'Arial, sans-serif' }
const button = {
  backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '14px 32px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '14px',
  fontWeight: 'bold' as const, fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const smallText = { fontSize: '13px', color: '#666', lineHeight: '1.6', margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '0', fontFamily: 'Arial, sans-serif' }
const footerLink = { color: '#999', textDecoration: 'underline' }
