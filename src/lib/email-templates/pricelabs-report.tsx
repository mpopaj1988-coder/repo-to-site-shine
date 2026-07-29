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
const SITE_URL = "https://www.seaandcityrentals.com";

export interface PricelabsReportProps {
  reportType?: string;
  periodLabel?: string;
  generatedAt?: string;
  /** Pre-built HTML for the report body (headings, tables, paragraphs) — assembled by the reporting automation, not user input. */
  bodyHtml?: string;
}

const PricelabsReportEmail = ({
  reportType = "PriceLabs Pricing Report",
  periodLabel = "",
  generatedAt = "",
  bodyHtml = "",
}: PricelabsReportProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {reportType}
      {periodLabel ? ` · ${periodLabel}` : ""}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>Automated Report</Text>
          <Heading style={h1}>{reportType}</Heading>
          {periodLabel && <Text style={subheading}>{periodLabel}</Text>}
        </Section>

        <Section style={body}>
          <div style={bodyContent} dangerouslySetInnerHTML={{ __html: bodyHtml }} />

          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} · {SITE_URL}
            {generatedAt ? ` · Generated ${generatedAt}` : ""}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: PricelabsReportEmail,
  subject: (data: Record<string, any>) =>
    `${data.reportType ?? "PriceLabs Report"}${data.periodLabel ? ` — ${data.periodLabel}` : ""}`,
  displayName: "PriceLabs Report",
  to: "mpopaj1988@gmail.com",
  previewData: {
    reportType: "PriceLabs Pricing Audit",
    periodLabel: "Jul 16 – Jul 31, 2026",
    generatedAt: "July 31, 2026",
    bodyHtml:
      "<p>Recommending changes for 3 of 9 listings this period — mostly small price increases.</p>" +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;"><tr><th style="text-align:left;border-bottom:1px solid #e5e5e5;padding:6px 0;">Property</th><th style="text-align:left;border-bottom:1px solid #e5e5e5;padding:6px 0;">Current</th><th style="text-align:left;border-bottom:1px solid #e5e5e5;padding:6px 0;">Recommended</th></tr>' +
      '<tr><td style="padding:6px 0;">Tampa</td><td style="padding:6px 0;">$265</td><td style="padding:6px 0;">$230</td></tr></table>',
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { maxWidth: "600px", margin: "0 auto" };
const header = { backgroundColor: "#1A3A4A", padding: "28px", textAlign: "center" as const };
const kicker = {
  fontSize: "11px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: "#C9A84C",
  margin: "0 0 10px",
};
const h1 = { fontSize: "22px", color: "#ffffff", margin: "0", lineHeight: "1.2" };
const subheading = { fontSize: "13px", color: "#cfd9de", margin: "8px 0 0" };
const body = { padding: "28px" };
const bodyContent = { fontSize: "14px", color: "#333333", lineHeight: "1.6" };
const hr = { borderColor: "#e5e5e5", margin: "24px 0 16px" };
const footer = { fontSize: "12px", color: "#999", margin: "0" };
