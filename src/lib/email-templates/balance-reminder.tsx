import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "Sea & City Rentals";

interface BalanceReminderProps {
  guestName?: string;
  propertyTitle?: string;
  checkIn?: string;
  checkOut?: string;
  balanceDollars?: number;
  currency?: string;
  bookingId?: string;
}

const BalanceReminderEmail = ({
  guestName = "Guest",
  propertyTitle = "your property",
  checkIn = "",
  checkOut = "",
  balanceDollars = 0,
  currency = "USD",
  bookingId = "",
}: BalanceReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Balance of ${balanceDollars.toFixed(0)} charged — {propertyTitle}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>Balance Collected</Text>
          <Heading style={h1}>Balance payment processed</Heading>
        </Section>

        <Section style={body}>
          <Text style={text}>Hi {guestName},</Text>
          <Text style={text}>
            Your balance payment of{" "}
            <strong>
              ${balanceDollars.toFixed(0)} {currency}
            </strong>{" "}
            for <strong>{propertyTitle}</strong> ({checkIn} – {checkOut}) has been successfully
            collected from your card on file.
          </Text>

          <Section style={confirmBox}>
            <Text style={confirmText}>
              Your stay is fully paid. We look forward to hosting you!
            </Text>
          </Section>

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
  component: BalanceReminderEmail,
  subject: (data: Record<string, any>) =>
    `Balance paid — ${data.propertyTitle ?? "your stay"} · ${data.checkIn ?? ""}`,
  displayName: "Balance Collected",
  previewData: {
    guestName: "Maria",
    propertyTitle: "Clearwater Beach Retreat",
    checkIn: "2025-08-01",
    checkOut: "2025-08-05",
    balanceDollars: 560,
    currency: "USD",
    bookingId: "abc-123",
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
const confirmBox = {
  backgroundColor: "#f0f7f4",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "20px 0",
};
const confirmText = {
  fontSize: "15px",
  color: "#2d7a4f",
  margin: "0",
  fontWeight: "bold" as const,
};
const hr = { borderColor: "#e5e5e5", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#999999", margin: "0", whiteSpace: "pre-line" as const };
