import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text, Row, Column,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "Sea & City Rentals";
const SITE_URL = "https://seaandcityrentals.com";

interface WifiInfoProps {
  propertyName?: string;
  wifiNetwork?: string;
  wifiPassword?: string;
  checkInTime?: string;
  checkoutTime?: string;
  parking?: string;
  trash?: string;
  emergencyContact?: string;
  notes?: string[];
  guideSlug?: string;
}

const WifiInfoEmail = ({
  propertyName = "Your Sea & City Property",
  wifiNetwork = "SeaCity_WiFi",
  wifiPassword = "password123",
  checkInTime = "4:00 PM",
  checkoutTime = "10:00 AM",
  parking,
  trash,
  emergencyContact = "248-766-2957",
  notes = [],
  guideSlug,
}: WifiInfoProps) => {
  const guideUrl = guideSlug ? `${SITE_URL}/explore/${guideSlug}` : null;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your WiFi password and house guide for {propertyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* HEADER */}
          <Section style={header}>
            <Text style={kicker}>Welcome to Your Stay</Text>
            <Heading style={h1}>{propertyName}</Heading>
            <Text style={subheading}>WiFi &amp; House Guide</Text>
          </Section>

          <Section style={body}>
            {/* WIFI BOX */}
            <Section style={wifiBox}>
              <Text style={wifiLabel}>📶 WiFi NETWORK</Text>
              <Text style={wifiValue}>{wifiNetwork}</Text>
              <Text style={wifiLabel} dangerouslySetInnerHTML={{ __html: "🔐 PASSWORD" }} />
              <Text style={wifiPasswordStyle}>{wifiPassword}</Text>
            </Section>

            {/* STAY DETAILS */}
            <Heading style={h2}>Your Stay</Heading>
            <Row style={{ marginBottom: "12px" }}>
              <Column>
                <Text style={detailLabel}>CHECK-IN</Text>
                <Text style={detailValue}>{checkInTime}</Text>
              </Column>
              <Column>
                <Text style={detailLabel}>CHECK-OUT</Text>
                <Text style={detailValue}>{checkoutTime}</Text>
              </Column>
            </Row>

            {parking && (
              <>
                <Text style={detailLabel}>🚗 PARKING</Text>
                <Text style={text}>{parking}</Text>
              </>
            )}

            {trash && (
              <>
                <Text style={detailLabel}>🗑️ TRASH</Text>
                <Text style={text}>{trash}</Text>
              </>
            )}

            {/* HOUSE NOTES */}
            {notes.length > 0 && (
              <>
                <Hr style={hr} />
                <Heading style={h2}>House Notes</Heading>
                {notes.map((note, i) => (
                  <Text key={i} style={noteItem}>
                    • {note}
                  </Text>
                ))}
              </>
            )}

            {/* EMERGENCY CONTACT */}
            <Hr style={hr} />
            <Text style={detailLabel}>📞 NEED HELP?</Text>
            <Text style={text}>
              Call or text your host anytime: <strong>{emergencyContact}</strong>
            </Text>

            {/* GUIDE CTA */}
            {guideUrl && (
              <>
                <Hr style={hr} />
                <Text style={text}>
                  Want restaurant recommendations, beach tips, and things to do nearby?
                  We've put together a local guide just for you.
                </Text>
                <Section style={{ textAlign: "center", margin: "20px 0" }}>
                  <Button style={button} href={guideUrl}>
                    View Local Guide
                  </Button>
                </Section>
              </>
            )}

            <Hr style={hr} />
            <Text style={footer}>
              Enjoy your stay — The {SITE_NAME} team · {emergencyContact}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: WifiInfoEmail,
  subject: (data: Record<string, any>) =>
    `WiFi & house guide — ${data.propertyName ?? "your property"}`,
  displayName: "WiFi & House Guide",
  previewData: {
    propertyName: "Waterfront 6BR Tampa",
    wifiNetwork: "SeaCity_Tampa",
    wifiPassword: "SunshineState2025",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Free parking in the driveway — room for 4 cars.",
    trash: "Trash pickup: Mondays. Bins in the garage.",
    emergencyContact: "248-766-2957",
    guideSlug: "tampa",
    notes: [
      "Please lock all doors and windows when you leave.",
      "Pool heat is on and ready to enjoy.",
      "Leave all keys on the kitchen counter at checkout.",
    ],
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: 'Georgia, "Times New Roman", serif' };
const container = { maxWidth: "580px", margin: "0 auto", padding: "0" };
const header = {
  backgroundColor: "#1A3A4A",
  padding: "32px 28px",
  textAlign: "center" as const,
};
const kicker = {
  fontSize: "11px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: "#C9A84C",
  margin: "0 0 12px",
  fontFamily: "Arial, sans-serif",
};
const h1 = { fontSize: "26px", color: "#ffffff", margin: "0 0 6px", lineHeight: "1.2" };
const subheading = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.7)",
  margin: "0",
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  fontFamily: "Arial, sans-serif",
};
const body = { padding: "28px" };
const wifiBox = {
  backgroundColor: "#1A3A4A",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "0 0 28px",
};
const wifiLabel = {
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: "#C9A84C",
  margin: "8px 0 4px",
  fontFamily: "Arial, sans-serif",
};
const wifiValue = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#ffffff",
  margin: "0 0 16px",
  letterSpacing: "0.05em",
  fontFamily: "Arial, sans-serif",
};
const wifiPasswordStyle = {
  fontSize: "26px",
  fontWeight: "bold" as const,
  color: "#C9A84C",
  margin: "0",
  letterSpacing: "0.1em",
  fontFamily: "Arial, sans-serif",
};
const h2 = {
  fontSize: "18px",
  color: "#1A3A4A",
  margin: "0 0 12px",
  letterSpacing: "-0.01em",
};
const detailLabel = {
  fontSize: "10px",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: "#999999",
  margin: "16px 0 2px",
  fontFamily: "Arial, sans-serif",
};
const detailValue = {
  fontSize: "18px",
  fontWeight: "bold" as const,
  color: "#1A3A4A",
  margin: "0 0 8px",
  fontFamily: "Arial, sans-serif",
};
const text = { fontSize: "15px", color: "#333333", lineHeight: "1.6", margin: "0 0 12px" };
const noteItem = { fontSize: "14px", color: "#444444", lineHeight: "1.6", margin: "0 0 8px" };
const button = {
  backgroundColor: "#C9A84C",
  color: "#1A3A4A",
  padding: "14px 28px",
  borderRadius: "4px",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: "bold" as const,
  fontFamily: "Arial, sans-serif",
  letterSpacing: "0.05em",
  display: "inline-block",
};
const hr = { borderColor: "#e5e5e5", margin: "24px 0 16px" };
const footer = { fontSize: "13px", color: "#999999", margin: "0" };
