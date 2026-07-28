import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Sea & City Rentals'
const GOOGLE_REVIEW_URL = 'https://g.page/r/CbQ3d8oUEBhHEAE/review'

interface PostStayReviewProps {
  guestName?: string
  propertyTitle?: string
}

const PostStayReviewEmail = ({ guestName, propertyTitle }: PostStayReviewProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>How was your stay? A quick review would mean a lot</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>Thanks For Staying With Us</Text>
          <Heading style={h1}>How was {propertyTitle ?? 'your stay'}?</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Hi {guestName ?? 'there'}, we hope you had a great trip. We're a small,
            independent host — reviews are how new guests find us, and they genuinely
            help. If you have a minute, we'd really appreciate one.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={button} href={GOOGLE_REVIEW_URL}>
              Leave a Google review
            </Button>
          </Section>

          <Text style={text}>
            Thanks again for choosing to book direct — we hope to host you again soon.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>The {SITE_NAME} team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PostStayReviewEmail,
  subject: 'How was your stay?',
  displayName: 'Post-stay — review request',
  previewData: { guestName: 'Alex', propertyTitle: 'Tampa Bayfront Retreat' },
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
const button = {
  backgroundColor: '#1A3A4A', color: '#ffffff', padding: '14px 28px',
  borderRadius: '4px', textDecoration: 'none', fontSize: '14px',
  fontFamily: 'Arial, sans-serif', display: 'inline-block',
}
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
