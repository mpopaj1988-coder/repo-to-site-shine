import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Sea & City Rentals'
const SITE_URL = 'https://seaandcityrentals.com'

interface LocalTipsProps {
  title: string
  description: string
  slug: string
}

const LocalTipsEmail = ({ title, description, slug }: LocalTipsProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{description}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>Tampa Bay Tip</Text>
          <Heading style={h1}>{title}</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>{description}</Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={button} href={`${SITE_URL}/blog/${slug}`}>
              Read the full guide
            </Button>
          </Section>

          <Text style={text}>
            Planning another Tampa Bay trip? We'd love to have you back — no platform
            fees when you book direct.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>The {SITE_NAME} team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LocalTipsEmail,
  subject: (data: Record<string, any>) => `Tampa Bay tip: ${data.title}`,
  displayName: 'Local tips (monthly)',
  previewData: {
    title: 'St. Petersburg Weekend Guide',
    description: 'Our favorite waterfront spots to watch the sun go down.',
    slug: 'week1-st-pete-weekend-guide',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: '#1A3A4A', padding: '32px 28px', textAlign: 'center' as const }
const kicker = {
  fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' as const,
  color: '#C9A84C', margin: '0 0 12px', fontFamily: 'Arial, sans-serif',
}
const h1 = { fontSize: '26px', color: '#ffffff', margin: '0', lineHeight: '1.25' }
const body = { padding: '28px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#1A3A4A', color: '#ffffff', padding: '14px 28px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '14px',
  fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
