/**
 * Parser for Venmo's "Account Statement" CSV export (Venmo app/site →
 * Statements → download CSV). Venmo has no public API, so this manual
 * export is the only way to get transaction history into the app — see
 * the upload route at /api/admin/accounting/upload-venmo.
 *
 * The export has a few metadata rows before the real header, so this
 * scans for the row containing "ID"/"Datetime" columns rather than
 * assuming a fixed row number.
 */

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const negative = trimmed.startsWith("-");
  const cleaned = trimmed.replace(/[+\-$,\s]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (Number.isNaN(value)) return null;
  return negative ? -Math.abs(value) : Math.abs(value);
}

const SKIP_STATUSES = new Set(["failed", "cancelled", "canceled", "declined", "expired"]);

export interface VenmoParsedRow {
  sourceId: string;
  transactionDate: string; // YYYY-MM-DD
  type: string;
  description: string;
  counterparty: string | null;
  amount: number; // dollars, signed
}

export interface VenmoParseResult {
  rows: VenmoParsedRow[];
  skipped: number;
  warnings: string[];
}

export function parseVenmoCsv(text: string): VenmoParseResult {
  const table = parseCsv(text);

  const headerIndex = table.findIndex(
    (r) =>
      r.some((c) => normalizeHeader(c) === "id") &&
      r.some((c) => normalizeHeader(c) === "datetime"),
  );

  if (headerIndex === -1) {
    return {
      rows: [],
      skipped: 0,
      warnings: [
        "Could not find a header row with ID/Datetime columns — is this a Venmo account statement CSV?",
      ],
    };
  }

  const headers = table[headerIndex].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(name);

  const idxId = col("id");
  const idxDate = col("datetime");
  const idxType = col("type");
  const idxStatus = col("status");
  const idxNote = col("note");
  const idxFrom = col("from");
  const idxTo = col("to");
  const idxAmount = col("amount (total)");

  if (idxId === -1 || idxDate === -1 || idxAmount === -1) {
    return {
      rows: [],
      skipped: 0,
      warnings: ["Missing required columns (ID, Datetime, Amount (total))."],
    };
  }

  const rows: VenmoParsedRow[] = [];
  let skipped = 0;

  for (let i = headerIndex + 1; i < table.length; i++) {
    const r = table[i];
    const id = r[idxId]?.trim();
    const dateRaw = r[idxDate]?.trim();
    const amountRaw = r[idxAmount]?.trim();
    if (!id || !dateRaw || !amountRaw) {
      skipped++;
      continue;
    }

    const status = idxStatus !== -1 ? (r[idxStatus]?.trim().toLowerCase() ?? "") : "";
    if (status && SKIP_STATUSES.has(status)) {
      skipped++;
      continue;
    }

    const amount = parseAmount(amountRaw);
    if (amount === null) {
      skipped++;
      continue;
    }

    const type = idxType !== -1 ? r[idxType]?.trim() || "Payment" : "Payment";
    const note = idxNote !== -1 ? (r[idxNote]?.trim() ?? "") : "";
    const from = idxFrom !== -1 ? (r[idxFrom]?.trim() ?? "") : "";
    const to = idxTo !== -1 ? (r[idxTo]?.trim() ?? "") : "";
    const counterparty = amount < 0 ? to || null : from || null;
    const description = note || `${from || "?"} -> ${to || "?"}`;

    rows.push({
      sourceId: id,
      transactionDate: dateRaw.slice(0, 10),
      type,
      description,
      counterparty,
      amount,
    });
  }

  return { rows, skipped, warnings: [] };
}
