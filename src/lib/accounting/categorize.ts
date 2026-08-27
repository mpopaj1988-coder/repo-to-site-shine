// Simple rule-based categorization for accounting transactions. Keyword/type
// matching only — no AI calls, so every run is free and deterministic. The
// owner can always override a category in the dashboard; sync/upload never
// touches a row once `category_overridden` is set (see hospitable-sync and
// venmo-csv upsert logic).

export const CATEGORIES = [
  "Booking Income",
  "Cancellation Adjustments",
  "Other Income",
  "Cleaning",
  "Maintenance & Repairs",
  "Supplies",
  "Utilities",
  "Property Management Fees",
  "Payment Processing Fees",
  "Transfer",
  "Uncategorized",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface CategorizeInput {
  source: "hospitable" | "venmo";
  type: string;
  description: string;
  amount: number; // dollars, signed (positive = income, negative = expense)
}

export interface CategorizeResult {
  category: Category;
  // Payouts and bank/Venmo transfers are cash movements, not P&L events —
  // the income they move was already counted when it was earned (a
  // Hospitable "Reservation" line, a Venmo "Payment"/"Charge"). Rows with
  // includeInPl=false are still stored (for the audit trail) but excluded
  // from every P&L total.
  includeInPl: boolean;
}

const VENMO_KEYWORD_RULES: Array<{ category: Category; keywords: string[] }> = [
  { category: "Cleaning", keywords: ["clean", "housekeep", "maid", "turnover"] },
  {
    category: "Maintenance & Repairs",
    keywords: [
      "repair",
      "plumb",
      "hvac",
      "handyman",
      "pool service",
      "pest control",
      "lawn",
      "landscap",
      "locksmith",
      "electrician",
      "appliance",
    ],
  },
  {
    category: "Supplies",
    keywords: [
      "amazon",
      "target",
      "walmart",
      "home depot",
      "lowes",
      "lowe's",
      "costco",
      "ikea",
      "supplies",
      "wayfair",
      "sam's club",
      "sams club",
    ],
  },
  {
    category: "Utilities",
    keywords: [
      "electric",
      "duke energy",
      "tampa electric",
      "teco",
      "water bill",
      "spectrum",
      "xfinity",
      "comcast",
      "internet",
      "wifi bill",
      "gas bill",
    ],
  },
  {
    category: "Property Management Fees",
    keywords: ["management fee", "commission", "service fee", "host fee"],
  },
];

export function categorizeHospitable(
  input: Pick<CategorizeInput, "type" | "description" | "amount">,
): CategorizeResult {
  const type = input.type.toLowerCase();

  // Payouts just move already-earned money to the bank — excluded from P&L.
  if (type === "payout") return { category: "Transfer", includeInPl: false };
  if (type === "reservation") return { category: "Booking Income", includeInPl: true };
  if (type.includes("resolution")) return { category: "Other Income", includeInPl: true };
  if (type.includes("cancellation") || type.includes("refund")) {
    return { category: "Cancellation Adjustments", includeInPl: true };
  }
  if (type.includes("fee")) return { category: "Property Management Fees", includeInPl: true };

  return { category: "Uncategorized", includeInPl: true };
}

export function categorizeVenmo(
  input: Pick<CategorizeInput, "type" | "description" | "amount">,
): CategorizeResult {
  const type = input.type.toLowerCase();

  // Standard/Instant Transfer = Venmo balance <-> bank, not a P&L event.
  if (type.includes("transfer")) return { category: "Transfer", includeInPl: false };
  if (type.includes("fee")) return { category: "Payment Processing Fees", includeInPl: true };

  const desc = input.description.toLowerCase();
  for (const rule of VENMO_KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => desc.includes(keyword))) {
      return { category: rule.category, includeInPl: true };
    }
  }

  return input.amount >= 0
    ? { category: "Other Income", includeInPl: true }
    : { category: "Uncategorized", includeInPl: true };
}

export function categorize(input: CategorizeInput): CategorizeResult {
  return input.source === "hospitable" ? categorizeHospitable(input) : categorizeVenmo(input);
}
