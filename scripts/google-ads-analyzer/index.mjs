#!/usr/bin/env node
// Pulls Google Ads search-term data, analyzes it, and prints concrete
// optimization recommendations (negative keywords to add, new keywords to
// add, keywords to pause, keywords to scale up).
//
// Usage:
//   node scripts/google-ads-analyzer/index.mjs [--days=30] [--min-waste=20] [--min-clicks=3]
//
// Requires credentials — see scripts/google-ads-analyzer/README.md for the
// full step-by-step setup guide (this only needs to be done once).

import { GoogleAdsApi } from "google-ads-api";
import { mkdirSync, writeFileSync } from "node:fs";

const REQUIRED_ENV = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
];

function parseArgs(argv) {
  const args = { days: 30, minWaste: 20, minClicks: 3 };
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key === "days") args.days = Number(value);
    if (key === "min-waste") args.minWaste = Number(value);
    if (key === "min-clicks") args.minClicks = Number(value);
    if (key === "customer-id") args.customerId = value;
    if (key === "help") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
Google Ads Search Term Analyzer

Options:
  --days=30         How many days of history to pull (default: 30)
  --min-waste=20     Flag search terms / keywords as "wasted spend" once they've
                     cost this much (in your account's currency) with zero
                     conversions (default: 20)
  --min-clicks=3     Ignore anything with fewer clicks than this — avoids
                     flagging one-off flukes (default: 3)
  --customer-id=...  Override the Google Ads account to analyze
  --help             Show this message

Setup instructions: scripts/google-ads-analyzer/README.md
`);
}

function requireEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `\nMissing required environment variable(s): ${missing.join(", ")}\n\n` +
        "See scripts/google-ads-analyzer/README.md for how to get each of these " +
        "(it walks through every step — no prior Google Ads API experience needed).\n",
    );
    process.exit(1);
  }
}

function dateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function money(micros, currencyCode) {
  const amount = (micros ?? 0) / 1_000_000;
  const symbol = currencyCode === "USD" ? "$" : `${currencyCode} `;
  return `${symbol}${amount.toFixed(2)}`;
}

function pct(a, b) {
  if (!b) return "0.0%";
  return `${((a / b) * 100).toFixed(1)}%`;
}

function normalize(text) {
  return (text ?? "").trim().toLowerCase();
}

function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = String(val ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  requireEnv();

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  const customerId = (args.customerId ?? process.env.GOOGLE_ADS_CUSTOMER_ID).replace(/-/g, "");
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");

  const customer = client.Customer({
    customer_id: customerId,
    login_customer_id: loginCustomerId,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  });

  const { start, end } = dateRange(args.days);
  console.log(`\nPulling Google Ads data for account ${customerId} from ${start} to ${end}...\n`);

  let accountInfo, searchTermRows, keywordRows, adGroupNegatives, campaignNegatives;
  try {
    [accountInfo] = await customer.query(
      `SELECT customer.descriptive_name, customer.currency_code FROM customer LIMIT 1`,
    );

    searchTermRows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        search_term_view.search_term,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM search_term_view
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status = 'ENABLED'
    `);

    keywordRows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM keyword_view
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND ad_group_criterion.status = 'ENABLED'
        AND campaign.status = 'ENABLED'
    `);

    adGroupNegatives = await customer.query(`
      SELECT ad_group.id, ad_group_criterion.keyword.text
      FROM ad_group_criterion
      WHERE ad_group_criterion.type = 'KEYWORD'
        AND ad_group_criterion.negative = true
    `);

    campaignNegatives = await customer.query(`
      SELECT campaign.id, campaign_criterion.keyword.text
      FROM campaign_criterion
      WHERE campaign_criterion.type = 'KEYWORD'
        AND campaign_criterion.negative = true
    `);
  } catch (err) {
    console.error("\nFailed to fetch data from Google Ads. Common causes:\n");
    console.error("  - Developer token not approved for this account (test accounts only)");
    console.error("  - Wrong GOOGLE_ADS_CUSTOMER_ID (should be 10 digits, no dashes)");
    console.error(
      "  - Refresh token was issued for a Google account that doesn't have access to this Ads account",
    );
    console.error(
      "  - If this account is managed under an agency/manager account, set GOOGLE_ADS_LOGIN_CUSTOMER_ID\n",
    );
    console.error("Raw error:", err.message ?? err);
    process.exit(1);
  }

  const currency = accountInfo?.customer?.currency_code ?? "USD";
  const accountName = accountInfo?.customer?.descriptive_name ?? customerId;

  // ---- Build lookup sets: existing keywords + negatives, keyed by ad group / campaign ----
  const existingKeywordSet = new Set();
  for (const row of keywordRows) {
    const text = normalize(row.ad_group_criterion?.keyword?.text);
    if (text) existingKeywordSet.add(`${row.ad_group.id}::${text}`);
  }

  const adGroupNegativeSet = new Set();
  for (const row of adGroupNegatives) {
    const text = normalize(row.ad_group_criterion?.keyword?.text);
    if (text) adGroupNegativeSet.add(`${row.ad_group.id}::${text}`);
  }

  const campaignNegativeSet = new Set();
  for (const row of campaignNegatives) {
    const text = normalize(row.campaign_criterion?.keyword?.text);
    if (text) campaignNegativeSet.add(`${row.campaign.id}::${text}`);
  }

  const isAlreadyNegative = (campaignId, adGroupId, term) => {
    const t = normalize(term);
    return (
      adGroupNegativeSet.has(`${adGroupId}::${t}`) || campaignNegativeSet.has(`${campaignId}::${t}`)
    );
  };
  const isAlreadyKeyword = (adGroupId, term) =>
    existingKeywordSet.has(`${adGroupId}::${normalize(term)}`);

  // ---- Account-level summary ----
  let totalCost = 0,
    totalClicks = 0,
    totalImpressions = 0,
    totalConversions = 0,
    totalConvValue = 0;
  for (const row of searchTermRows) {
    totalCost += row.metrics.cost_micros ?? 0;
    totalClicks += row.metrics.clicks ?? 0;
    totalImpressions += row.metrics.impressions ?? 0;
    totalConversions += row.metrics.conversions ?? 0;
    totalConvValue += row.metrics.conversions_value ?? 0;
  }
  const avgCpa = totalConversions > 0 ? totalCost / 1_000_000 / totalConversions : null;
  const avgConvRate = totalClicks > 0 ? totalConversions / totalClicks : 0;

  // ---- 1. Negative keyword candidates (wasted spend at the search-term level) ----
  const wasteThresholdMicros = args.minWaste * 1_000_000;
  const negativeCandidates = searchTermRows
    .filter((row) => {
      const cost = row.metrics.cost_micros ?? 0;
      const clicks = row.metrics.clicks ?? 0;
      const conversions = row.metrics.conversions ?? 0;
      return (
        cost >= wasteThresholdMicros &&
        conversions === 0 &&
        clicks >= args.minClicks &&
        !isAlreadyNegative(row.campaign.id, row.ad_group.id, row.search_term_view.search_term)
      );
    })
    .sort((a, b) => (b.metrics.cost_micros ?? 0) - (a.metrics.cost_micros ?? 0))
    .map((row) => ({
      "Search Term": row.search_term_view.search_term,
      Campaign: row.campaign.name,
      "Ad Group": row.ad_group.name,
      Clicks: row.metrics.clicks,
      "Cost (wasted)": money(row.metrics.cost_micros, currency),
    }));

  // ---- 2. New keyword opportunities (converting search terms not yet a keyword) ----
  const newKeywordOpportunities = searchTermRows
    .filter((row) => {
      const clicks = row.metrics.clicks ?? 0;
      const conversions = row.metrics.conversions ?? 0;
      return (
        conversions > 0 &&
        clicks >= args.minClicks &&
        !isAlreadyKeyword(row.ad_group.id, row.search_term_view.search_term)
      );
    })
    .sort((a, b) => (b.metrics.conversions ?? 0) - (a.metrics.conversions ?? 0))
    .map((row) => ({
      "Search Term": row.search_term_view.search_term,
      Campaign: row.campaign.name,
      "Ad Group": row.ad_group.name,
      Clicks: row.metrics.clicks,
      Conversions: row.metrics.conversions,
      "Conv. Value": money(row.metrics.conversions_value * 1_000_000, currency),
    }));

  // ---- 3. Existing keywords to pause / reduce (wasted spend) ----
  const pauseCandidates = keywordRows
    .filter((row) => {
      const cost = row.metrics.cost_micros ?? 0;
      const clicks = row.metrics.clicks ?? 0;
      const conversions = row.metrics.conversions ?? 0;
      return cost >= wasteThresholdMicros && conversions === 0 && clicks >= args.minClicks;
    })
    .sort((a, b) => (b.metrics.cost_micros ?? 0) - (a.metrics.cost_micros ?? 0))
    .map((row) => ({
      Keyword: row.ad_group_criterion?.keyword?.text,
      "Match Type": row.ad_group_criterion?.keyword?.match_type,
      Campaign: row.campaign.name,
      "Ad Group": row.ad_group.name,
      Clicks: row.metrics.clicks,
      "Cost (wasted)": money(row.metrics.cost_micros, currency),
    }));

  // ---- 4. Existing keywords to scale up (efficient converters) ----
  const scaleUpCandidates = keywordRows
    .filter((row) => {
      const clicks = row.metrics.clicks ?? 0;
      const conversions = row.metrics.conversions ?? 0;
      if (clicks < args.minClicks || conversions === 0) return false;
      const convRate = conversions / clicks;
      return convRate >= avgConvRate * 1.5;
    })
    .sort((a, b) => (b.metrics.conversions_value ?? 0) - (a.metrics.conversions_value ?? 0))
    .map((row) => ({
      Keyword: row.ad_group_criterion?.keyword?.text,
      "Match Type": row.ad_group_criterion?.keyword?.match_type,
      Campaign: row.campaign.name,
      "Ad Group": row.ad_group.name,
      Clicks: row.metrics.clicks,
      Conversions: row.metrics.conversions,
      "Conv. Rate": pct(row.metrics.conversions, row.metrics.clicks),
    }));

  // ---- Report ----
  console.log("=".repeat(70));
  console.log(`GOOGLE ADS SEARCH TERM REPORT — ${accountName}`);
  console.log(`${start} to ${end} (${args.days} days)`);
  console.log("=".repeat(70));

  console.log(`\nACCOUNT SUMMARY`);
  console.log(`  Total spend:        ${money(totalCost, currency)}`);
  console.log(`  Total clicks:       ${totalClicks}`);
  console.log(`  Total impressions:  ${totalImpressions}`);
  console.log(`  Click-through rate: ${pct(totalClicks, totalImpressions)}`);
  console.log(`  Total conversions:  ${totalConversions.toFixed(1)}`);
  console.log(
    `  Avg. cost/conversion: ${avgCpa !== null ? money(avgCpa * 1_000_000, currency) : "n/a (no conversions yet)"}`,
  );

  console.log(`\n${"-".repeat(70)}`);
  console.log(`1. STOP WASTING MONEY — add these as negative keywords`);
  console.log(
    `   These search terms cost at least ${money(wasteThresholdMicros, currency)} each with zero bookings/leads.`,
  );
  console.log(`   Adding them as negative keywords stops your ads showing for these searches.`);
  if (negativeCandidates.length === 0) {
    console.log(`   None found — nice, no obvious wasted spend at this threshold.`);
  } else {
    console.table(negativeCandidates.slice(0, 25));
    const totalWasted = negativeCandidates.reduce(
      (sum, r) => sum + Number(r["Cost (wasted)"].replace(/[^0-9.]/g, "")),
      0,
    );
    console.log(
      `   Total wasted spend from these ${negativeCandidates.length} search term(s): ~${currency === "USD" ? "$" : currency + " "}${totalWasted.toFixed(2)}`,
    );
  }

  console.log(`\n${"-".repeat(70)}`);
  console.log(`2. CAPTURE MORE OF WHAT'S WORKING — add these as keywords`);
  console.log(
    `   People searched these exact phrases and converted, but you're not bidding on them directly yet.`,
  );
  console.log(
    `   Adding them as their own keyword usually lowers cost-per-click and improves ad relevance.`,
  );
  if (newKeywordOpportunities.length === 0) {
    console.log(`   None found in this date range.`);
  } else {
    console.table(newKeywordOpportunities.slice(0, 25));
  }

  console.log(`\n${"-".repeat(70)}`);
  console.log(`3. PAUSE OR LOWER BIDS — existing keywords with wasted spend`);
  console.log(`   Same idea as #1, but these are keywords you're already bidding on directly.`);
  if (pauseCandidates.length === 0) {
    console.log(`   None found — no underperforming keywords at this threshold.`);
  } else {
    console.table(pauseCandidates.slice(0, 25));
  }

  console.log(`\n${"-".repeat(70)}`);
  console.log(`4. SPEND MORE HERE — keywords converting well above average`);
  console.log(
    `   These convert at 1.5x+ your account's average rate. Consider raising bids or budget on their campaigns.`,
  );
  if (scaleUpCandidates.length === 0) {
    console.log(`   None found — no keywords clearing the 1.5x average threshold yet.`);
  } else {
    console.table(scaleUpCandidates.slice(0, 25));
  }

  // ---- Save full (non-truncated) results to disk ----
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = `/tmp/google-ads-reports/${customerId}-${timestamp}`;
  mkdirSync(outDir, { recursive: true });

  const datasets = {
    "negative-keyword-candidates": negativeCandidates,
    "new-keyword-opportunities": newKeywordOpportunities,
    "pause-candidates": pauseCandidates,
    "scale-up-candidates": scaleUpCandidates,
  };
  for (const [name, rows] of Object.entries(datasets)) {
    writeFileSync(`${outDir}/${name}.csv`, toCsv(rows));
  }
  writeFileSync(
    `${outDir}/full-report.json`,
    JSON.stringify(
      {
        account: accountName,
        customerId,
        dateRange: { start, end, days: args.days },
        thresholds: { minWasteCost: args.minWaste, minClicks: args.minClicks },
        summary: {
          totalCost: totalCost / 1_000_000,
          totalClicks,
          totalImpressions,
          totalConversions,
          avgCpa,
          currency,
        },
        ...datasets,
      },
      null,
      2,
    ),
  );

  console.log(`\n${"=".repeat(70)}`);
  console.log(`Full results (CSV + JSON) saved to: ${outDir}`);
  console.log(`${"=".repeat(70)}\n`);
}

main();
