import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/accounting/categorize";

export const Route = createFileRoute("/admin/accounting/")({
  head: () => ({ meta: [{ title: "Accounting — Sea & City Rentals" }] }),
  component: AccountingDashboard,
});

interface CategoryTotal {
  category: string;
  total: number;
}

interface PL {
  month: string;
  monthLabel: string;
  income: CategoryTotal[];
  expenses: CategoryTotal[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  excludedTransferCount: number;
}

interface Transaction {
  id: string;
  source: "hospitable" | "venmo";
  transaction_date: string;
  description: string;
  counterparty: string | null;
  amount: number;
  category: string;
  include_in_pl: boolean;
  category_overridden: boolean;
}

function currentMonthString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function AccountingDashboard() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [month, setMonth] = React.useState(currentMonthString());
  const [pl, setPl] = React.useState<PL | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<string>("");
  const [uploadStatus, setUploadStatus] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadData = React.useCallback(
    async (m: string) => {
      setLoading(true);
      try {
        const [plRes, txRes] = await Promise.all([
          fetch(`/api/admin/accounting/pl?month=${m}`),
          fetch(`/api/admin/accounting/transactions?month=${m}`),
        ]);
        if (plRes.status === 401 || txRes.status === 401) {
          navigate({ to: "/admin/accounting/login" });
          return;
        }
        const plData = await plRes.json();
        const txData = await txRes.json();
        setPl(plData);
        setTransactions(txData.transactions ?? []);
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  React.useEffect(() => {
    fetch("/api/admin/accounting/session").then((res) => {
      if (!res.ok) {
        navigate({ to: "/admin/accounting/login" });
        return;
      }
      setCheckingSession(false);
      loadData(month);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!checkingSession) loadData(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const handleLogout = async () => {
    await fetch("/api/admin/accounting/logout", { method: "POST" });
    navigate({ to: "/admin/accounting/login" });
  };

  const handleSync = async () => {
    setSyncStatus("Syncing Hospitable transactions…");
    try {
      const res = await fetch("/api/admin/accounting/sync", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setSyncStatus(`Sync failed: ${body.error ?? "unknown error"}`);
        return;
      }
      setSyncStatus(`Synced ${body.fetched} transactions, ${body.inserted} new.`);
      loadData(month);
    } catch {
      setSyncStatus("Sync failed: network error");
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadStatus("Choose a Venmo CSV file first.");
      return;
    }
    setUploadStatus("Uploading…");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/accounting/upload-venmo", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) {
        setUploadStatus(`Upload failed: ${body.error ?? "unknown error"}`);
        return;
      }
      setUploadStatus(
        `Parsed ${body.parsed} rows, added ${body.inserted} new transactions (${body.skippedRows} skipped).`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadData(month);
    } catch {
      setUploadStatus("Upload failed: network error");
    }
  };

  const handleCategoryChange = async (id: string, category: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category, category_overridden: true } : t)),
    );
    await fetch(`/api/admin/accounting/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    loadData(month);
  };

  if (checkingSession) return null;

  return (
    <div style={pageStyle}>
      <div style={headerBar}>
        <div style={logoStyle}>Sea &amp; City Rentals — Accounting</div>
        <button onClick={handleLogout} style={logoutBtn}>
          Log out
        </button>
      </div>

      <div style={contentStyle}>
        <div style={controlsRow}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
            Month{" "}
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{
                marginLeft: 8,
                padding: "6px 10px",
                borderRadius: 6,
                border: "1.5px solid #ddd",
              }}
            />
          </label>
          <button onClick={handleSync} style={secondaryBtn}>
            Sync Hospitable now
          </button>
        </div>
        {syncStatus && <p style={statusText}>{syncStatus}</p>}

        {loading && <p style={statusText}>Loading…</p>}

        {pl && (
          <>
            <div style={summaryGrid}>
              <SummaryCard label="Total income" value={fmtMoney(pl.totalIncome)} color="#16a34a" />
              <SummaryCard
                label="Total expenses"
                value={fmtMoney(pl.totalExpenses)}
                color="#dc2626"
              />
              <SummaryCard label="Net profit" value={fmtMoney(pl.netProfit)} color="#1A3A4A" />
            </div>
            <p style={statusText}>
              {pl.transactionCount} transaction{pl.transactionCount === 1 ? "" : "s"} counted
              {pl.excludedTransferCount > 0 &&
                ` · ${pl.excludedTransferCount} transfer${pl.excludedTransferCount === 1 ? "" : "s"} excluded (payouts / bank transfers)`}
            </p>

            <div style={twoColGrid}>
              <CategoryTable title="Income by category" rows={pl.income} />
              <CategoryTable title="Expenses by category" rows={pl.expenses} />
            </div>
          </>
        )}

        <div style={sectionBox}>
          <h2 style={sectionHeading}>Upload Venmo statement</h2>
          <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
            Export a CSV from Venmo (Settings → Account Statements) and upload it here. Re-uploading
            the same file is safe — duplicate transactions are skipped automatically.
          </p>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ marginRight: 12 }} />
          <button onClick={handleUpload} style={secondaryBtn}>
            Upload
          </button>
          {uploadStatus && <p style={statusText}>{uploadStatus}</p>}
        </div>

        <div style={sectionBox}>
          <h2 style={sectionHeading}>Transactions — {pl?.monthLabel ?? month}</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Category</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} style={{ opacity: t.include_in_pl ? 1 : 0.5 }}>
                    <td style={tdStyle}>{t.transaction_date}</td>
                    <td style={tdStyle}>{t.source}</td>
                    <td style={tdStyle}>
                      {t.description}
                      {!t.include_in_pl && (
                        <span style={{ fontSize: 11, color: "#999" }}> (transfer, excluded)</span>
                      )}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: t.amount >= 0 ? "#16a34a" : "#dc2626",
                        textAlign: "right",
                      }}
                    >
                      {fmtMoney(t.amount)}
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={t.category}
                        onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                        style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid #ddd" }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && !loading && (
                  <tr>
                    <td style={tdStyle} colSpan={5}>
                      No transactions for this month yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={cardStyle}>
      <div
        style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}
      >
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function CategoryTable({ title, rows }: { title: string; rows: CategoryTotal[] }) {
  return (
    <div style={sectionBox}>
      <h3 style={{ ...sectionHeading, fontSize: 14 }}>{title}</h3>
      {rows.length === 0 && <p style={{ fontSize: 13, color: "#999" }}>None</p>}
      {rows.map((r) => (
        <div
          key={r.category}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "4px 0",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#555" }}>{r.category}</span>
          <span style={{ color: "#333", fontWeight: 600 }}>{fmtMoney(r.total)}</span>
        </div>
      ))}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F8FAFB",
  fontFamily: "Arial, sans-serif",
};
const headerBar: React.CSSProperties = {
  background: "#1A3A4A",
  color: "#fff",
  padding: "16px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const logoStyle: React.CSSProperties = { fontWeight: 800, fontSize: 18 };
const logoutBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #fff",
  color: "#fff",
  padding: "6px 14px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};
const contentStyle: React.CSSProperties = { maxWidth: 960, margin: "0 auto", padding: "24px 16px" };
const controlsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
};
const secondaryBtn: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #1A3A4A",
  color: "#1A3A4A",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
};
const statusText: React.CSSProperties = { fontSize: 13, color: "#666", margin: "8px 0" };
const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  margin: "16px 0",
};
const twoColGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  margin: "16px 0",
};
const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
const sectionBox: React.CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  margin: "16px 0",
};
const sectionHeading: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#1A3A4A",
  margin: "0 0 12px",
};
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "2px solid #eee",
  color: "#888",
  fontSize: 11,
  textTransform: "uppercase",
};
const tdStyle: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f0f0f0" };
