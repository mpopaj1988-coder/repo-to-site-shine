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
  Row,
  Column,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "Sea & City Rentals";
const SITE_URL = "https://www.seaandcityrentals.com";

export interface MonthlyPlReportProps {
  monthLabel?: string;
  totalIncome?: string;
  totalExpenses?: string;
  netProfit?: string;
  income?: Array<{ category: string; amount: string }>;
  expenses?: Array<{ category: string; amount: string }>;
  transactionCount?: number;
  excludedTransferCount?: number;
  dashboardUrl?: string;
}

const MonthlyPlReportEmail = ({
  monthLabel = "This Month",
  totalIncome = "$0.00",
  totalExpenses = "$0.00",
  netProfit = "$0.00",
  income = [],
  expenses = [],
  transactionCount = 0,
  excludedTransferCount = 0,
  dashboardUrl = "https://www.seaandcityrentals.com/admin/accounting",
}: MonthlyPlReportProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {monthLabel} P&amp;L: {netProfit} net profit
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={kicker}>Monthly Profit &amp; Loss</Text>
          <Heading style={h1}>{monthLabel}</Heading>
        </Section>

        <Section style={body}>
          <Section style={summaryBox}>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Total income</Column>
              <Column style={{ ...summaryValue, color: "#16a34a" }}>{totalIncome}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Total expenses</Column>
              <Column style={{ ...summaryValue, color: "#dc2626" }}>-{totalExpenses}</Column>
            </Row>
            <Hr style={summaryDivider} />
            <Row style={summaryRow}>
              <Column style={{ ...summaryLabel, fontWeight: "bold" as const, color: "#1A3A4A" }}>
                Net profit
              </Column>
              <Column style={{ ...summaryValue, fontWeight: "bold" as const, color: "#1A3A4A" }}>
                {netProfit}
              </Column>
            </Row>
          </Section>

          {income.length > 0 && (
            <Section style={tableBox}>
              <Text style={summaryTitle}>Income by category</Text>
              {income.map((row) => (
                <Row style={summaryRow} key={row.category}>
                  <Column style={summaryLabel}>{row.category}</Column>
                  <Column style={summaryValue}>{row.amount}</Column>
                </Row>
              ))}
            </Section>
          )}

          {expenses.length > 0 && (
            <Section style={tableBox}>
              <Text style={summaryTitle}>Expenses by category</Text>
              {expenses.map((row) => (
                <Row style={summaryRow} key={row.category}>
                  <Column style={summaryLabel}>{row.category}</Column>
                  <Column style={summaryValue}>{row.amount}</Column>
                </Row>
              ))}
            </Section>
          )}

          <Text style={smallText}>
            {transactionCount} transaction{transactionCount === 1 ? "" : "s"} counted
            {excludedTransferCount > 0 &&
              ` · ${excludedTransferCount} transfer${excludedTransferCount === 1 ? "" : "s"} excluded (payouts / bank transfers, not P&L events)`}
          </Text>
          <Text style={text}>
            View, correct categories, or upload a Venmo CSV:{" "}
            <a href={dashboardUrl} style={link}>
              {dashboardUrl}
            </a>
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} · {SITE_URL}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: MonthlyPlReportEmail,
  subject: (data: Record<string, any>) =>
    `${data.monthLabel ?? "Monthly"} P&L: ${data.netProfit ?? "—"} net profit`,
  displayName: "Monthly P&L Report",
  to: "mpopaj1988@gmail.com",
  previewData: {
    monthLabel: "July 2026",
    totalIncome: "$18,420.50",
    totalExpenses: "$4,110.25",
    netProfit: "$14,310.25",
    income: [
      { category: "Booking Income", amount: "$18,120.50" },
      { category: "Other Income", amount: "$300.00" },
    ],
    expenses: [
      { category: "Cleaning", amount: "$2,400.00" },
      { category: "Supplies", amount: "$860.25" },
      { category: "Maintenance & Repairs", amount: "$650.00" },
      { category: "Utilities", amount: "$200.00" },
    ],
    transactionCount: 142,
    excludedTransferCount: 38,
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto" };
const header = { backgroundColor: "#1A3A4A", padding: "28px", textAlign: "center" as const };
const kicker = {
  fontSize: "11px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: "#C9A84C",
  margin: "0 0 10px",
};
const h1 = { fontSize: "24px", color: "#ffffff", margin: "0", lineHeight: "1.2" };
const body = { padding: "28px" };
const text = { fontSize: "14px", color: "#333333", lineHeight: "1.6", margin: "16px 0 0" };
const link = { color: "#1A3A4A" };
const summaryBox = {
  border: "1px solid #e5e5e5",
  borderRadius: "6px",
  padding: "20px",
  backgroundColor: "#F9F6F0",
  margin: "0 0 20px",
};
const tableBox = {
  border: "1px solid #e5e5e5",
  borderRadius: "6px",
  padding: "20px",
  backgroundColor: "#fafafa",
  margin: "0 0 16px",
};
const summaryTitle = {
  fontSize: "11px",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: "#1A3A4A",
  margin: "0 0 14px",
};
const summaryRow = { margin: "0 0 8px" };
const summaryLabel = { fontSize: "13px", color: "#888" };
const summaryValue = { fontSize: "13px", color: "#333", textAlign: "right" as const };
const summaryDivider = { borderColor: "#e5e5e5", margin: "12px 0" };
const smallText = { fontSize: "12px", color: "#999", margin: "0 0 4px" };
const hr = { borderColor: "#e5e5e5", margin: "24px 0 16px" };
const footer = { fontSize: "12px", color: "#999", margin: "0" };
