import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "Sea & City Rentals";
const SITE_URL = "https://seaandcityrentals.com";

interface BookingConfirmationProps {
  guestName?: string;
  propertyTitle?: string;
  propertySlug?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;
  totalDollars?: number;
  depositDollars?: number;
  balanceDollars?: number;
  balanceDueDate?: string;
  bookingId?: string;
  currency?: string;
}

const BookingConfirmationEmail = ({
  guestName = "Guest",
  propertyTitle = "your property",
  propertySlug = "",
  checkIn = "",
  checkOut = "",
  nights = 1,
  guests = 1,
  totalDollars = 0,
  depositDollars = 0,
  balanceDollars = 0,
  balanceDueDate = "",
  bookingId = "",
  currency = "USD",
}: BookingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your booking is confirmed — {propertyTitle}, {checkIn} to {checkOut}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>Booking Confirmed</Text>
          <Heading style={h1}>You're all set, {guestName}!</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>
            Your reservation at <strong>{propertyTitle}</strong> is confirmed. We can't wait to host
            you in the Tampa Bay area!
          </Text>

          <Section style={detailBox}>
            <Row>
              <Column style={detailCell}>
                <Text style={detailLabel}>CHECK-IN</Text>
                <Text style={detailValue}>{checkIn}</Text>
              </Column>
              <Column style={detailCell}>
                <Text style={detailLabel}>CHECK-OUT</Text>
                <Text style={detailValue}>{checkOut}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={detailCell}>
                <Text style={detailLabel}>NIGHTS</Text>
                <Text style={detailValue}>{nights}</Text>
              </Column>
              <Column style={detailCell}>
                <Text style={detailLabel}>GUESTS</Text>
                <Text style={detailValue}>{guests}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={financeBox}>
            <Row>
              <Column>
                <Text style={financeLabel}>Total ({currency})</Text>
              </Column>
              <Column style={{ textAlign: "right" as const }}>
                <Text style={financeValue}>${totalDollars.toFixed(0)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={financeLabel}>Deposit paid today</Text>
              </Column>
              <Column style={{ textAlign: "right" as const }}>
                <Text style={{ ...financeValue, color: "#2d7a4f" }}>
                  −${depositDollars.toFixed(0)}
                </Text>
              </Column>
            </Row>
            {balanceDollars > 0 && (
              <Row>
                <Column>
                  <Text style={{ ...financeLabel, fontWeight: "bold" as const }}>
                    Balance due {balanceDueDate}
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={{ ...financeValue, color: "#1A3A4A" }}>
                    ${balanceDollars.toFixed(0)}
                  </Text>
                </Column>
              </Row>
            )}
          </Section>

          {balanceDollars > 0 && (
            <Text style={noteText}>
              Your card on file will be automatically charged ${balanceDollars.toFixed(0)} on{" "}
              <strong>{balanceDueDate}</strong>. No action needed.
            </Text>
          )}

          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button style={button} href={`${SITE_URL}/bookings/${bookingId}`}>
              View booking details
            </Button>
          </Section>

          {propertySlug && (
            <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
              <Button style={secondaryButton} href={`${SITE_URL}/listings/${propertySlug}`}>
                View property page
              </Button>
            </Section>
          )}

          <Text style={text}>Questions? Just reply to this email — we read every message.</Text>

          <Hr style={hr} />
          <Text style={footer}>
            Booking ID: {bookingId}
            {"\n"}The {SITE_NAME} team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Booking confirmed — ${data.propertyTitle ?? "your stay"} · ${data.checkIn ?? ""}`,
  displayName: "Booking Confirmation",
  previewData: {
    guestName: "Maria",
    propertyTitle: "Clearwater Beach Retreat",
    propertySlug: "clearwater",
    checkIn: "2025-08-01",
    checkOut: "2025-08-05",
    nights: 4,
    guests: 2,
    totalDollars: 800,
    depositDollars: 240,
    balanceDollars: 560,
    balanceDueDate: "2025-07-02",
    bookingId: "abc-123",
    currency: "USD",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: 'Georgia, "Times New Roman", serif' };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0" };
const header = { backgroundColor: "#1A3A4A", padding: "32px 28px", textAlign: "center" as const };
const kicker = {
  fontSize: "11px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: "#C9A84C",
  margin: "0 0 12px",
  fontFamily: "Arial, sans-serif",
};
const h1 = { fontSize: "26px", color: "#ffffff", margin: "0", lineHeight: "1.2" };
const body = { padding: "28px" };
const text = { fontSize: "15px", color: "#333333", lineHeight: "1.6", margin: "0 0 16px" };
const detailBox = {
  border: "1px solid #e5e5e5",
  borderRadius: "6px",
  padding: "16px",
  margin: "20px 0",
  backgroundColor: "#F5EFE4",
};
const detailCell = { padding: "8px 12px" };
const detailLabel = {
  fontSize: "10px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#888",
  margin: "0 0 4px",
  fontFamily: "Arial, sans-serif",
};
const detailValue = {
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#1A3A4A",
  margin: "0",
};
const financeBox = {
  border: "1px solid #e5e5e5",
  borderRadius: "6px",
  padding: "16px",
  margin: "20px 0",
};
const financeLabel = { fontSize: "14px", color: "#555", margin: "4px 0" };
const financeValue = {
  fontSize: "14px",
  fontWeight: "bold" as const,
  color: "#333",
  margin: "4px 0",
};
const noteText = {
  fontSize: "13px",
  color: "#666",
  lineHeight: "1.5",
  margin: "0 0 16px",
  padding: "12px 16px",
  backgroundColor: "#f0f7f4",
  borderRadius: "4px",
};
const button = {
  backgroundColor: "#1A3A4A",
  color: "#ffffff",
  padding: "14px 28px",
  borderRadius: "4px",
  textDecoration: "none",
  fontSize: "14px",
  fontFamily: "Arial, sans-serif",
  display: "inline-block",
};
const secondaryButton = {
  backgroundColor: "transparent",
  color: "#1A3A4A",
  padding: "12px 24px",
  borderRadius: "4px",
  textDecoration: "none",
  fontSize: "13px",
  fontFamily: "Arial, sans-serif",
  display: "inline-block",
  border: "1px solid #1A3A4A",
};
const hr = { borderColor: "#e5e5e5", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#999999", margin: "0", whiteSpace: "pre-line" as const };
