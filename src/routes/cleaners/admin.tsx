import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getCleanerSession,
  listCleaners,
  addCleaner,
  setCleanerActive,
  listPropertyRates,
  setPropertyRate,
  getPayoutSummary,
  markCleanerPaid,
  listAllJobsAdmin,
} from "@/lib/cleaner-portal.functions";
import { properties } from "@/data/properties";

export const Route = createFileRoute("/cleaners/admin")({
  head: () => ({ meta: [{ title: "Cleaner Admin — Sea & City Rentals" }] }),
  loader: async () => ({ session: await getCleanerSession() }),
  component: AdminPage,
});

type Cleaner = { id: string; name: string; phone: string; active: boolean; is_admin: boolean };
type Rate = { property_slug: string; amount: number };
type Payout = { cleanerId: string; name: string; phone: string; total: number; jobCount: number };
type AdminJob = {
  id: string;
  property_name: string;
  checkout_date: string;
  status: string;
  payout_amount: number;
  payout_status: string;
  cleaners: { name: string; phone: string } | null;
};

const PROPERTY_LABELS: Record<string, string> = {
  tampa: "Tampa",
  largo: "Largo",
  "irb-a": "Indian Rocks Beach A",
  "irb-b": "Indian Rocks Beach B",
  clearwater: "Clearwater",
  "stpete-sunsoaked": "St. Pete — Sun Soaked",
  "stpete-modern": "St. Pete — Modern",
  "stpete-hottub": "St. Pete — Hot Tub",
  "stpete-patio": "St. Pete — Patio",
};

function AdminPage() {
  const { session } = Route.useLoaderData();
  const navigate = useNavigate();
  const [cleaners, setCleaners] = React.useState<Cleaner[]>([]);
  const [rates, setRates] = React.useState<Rate[]>([]);
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [jobs, setJobs] = React.useState<AdminJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formName, setFormName] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [formPin, setFormPin] = React.useState("");
  const [formError, setFormError] = React.useState("");

  React.useEffect(() => {
    if (session === null) {
      navigate({ to: "/cleaners/login" });
      return;
    }
    if (session && !session.isAdmin) {
      navigate({ to: "/cleaners" });
      return;
    }
    refresh();
  }, [session]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [c, r, p, j] = await Promise.all([
        listCleaners(),
        listPropertyRates(),
        getPayoutSummary(),
        listAllJobsAdmin(),
      ]);
      setCleaners(c as Cleaner[]);
      setRates(r as Rate[]);
      setPayouts(p as Payout[]);
      setJobs(j as AdminJob[]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCleaner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const result = await addCleaner({ data: { name: formName, phone: formPhone, pin: formPin } });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setFormName("");
    setFormPhone("");
    setFormPin("");
    refresh();
  };

  const toggleActive = async (cleaner: Cleaner) => {
    await setCleanerActive({ data: { cleanerId: cleaner.id, active: !cleaner.active } });
    refresh();
  };

  const rateFor = (slug: string) => rates.find((r) => r.property_slug === slug)?.amount ?? 0;

  const handleRateChange = async (slug: string, amount: number) => {
    await setPropertyRate({ data: { propertySlug: slug, amount } });
    refresh();
  };

  const handleMarkPaid = async (cleanerId: string) => {
    await markCleanerPaid({ data: { cleanerId } });
    refresh();
  };

  if (!session || !session.isAdmin) return null;

  return (
    <div style={pageStyle}>
      <nav style={navStyle}>
        <span style={{ fontWeight: 800, color: "#1A3A4A" }}>Cleaner Admin</span>
        <a href="/cleaners" style={ghostBtnStyle}>
          Job board →
        </a>
      </nav>

      <main style={mainStyle}>
        {loading && <p style={{ color: "#666" }}>Loading…</p>}

        {/* PAYOUTS DUE */}
        <section style={sectionStyle}>
          <h2 style={sectionHeading}>Payouts Due</h2>
          {payouts.length === 0 ? (
            <p style={{ color: "#666" }}>Nothing owed right now.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {payouts.map((p) => (
                <div key={p.cleanerId} style={rowCardStyle}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1A3A4A" }}>{p.name}</div>
                    <div style={{ color: "#666", fontSize: "13px" }}>
                      {p.jobCount} job{p.jobCount === 1 ? "" : "s"} · {p.phone}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontWeight: 800, color: "#1a7f4b", fontSize: "16px" }}>
                      ${p.total.toFixed(2)}
                    </span>
                    <button onClick={() => handleMarkPaid(p.cleanerId)} style={secondaryBtnStyle}>
                      Mark Paid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CLEANERS */}
        <section style={sectionStyle}>
          <h2 style={sectionHeading}>Cleaners</h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}
          >
            {cleaners.map((c) => (
              <div key={c.id} style={rowCardStyle}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1A3A4A" }}>
                    {c.name} {c.is_admin && <span style={badgeStyle}>ADMIN</span>}
                  </div>
                  <div style={{ color: "#666", fontSize: "13px" }}>{c.phone}</div>
                </div>
                <button onClick={() => toggleActive(c)} style={secondaryBtnStyle}>
                  {c.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddCleaner} style={formCardStyle}>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "#1A3A4A" }}>
              Add a cleaner
            </h3>
            <input
              style={inputStyle}
              placeholder="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <input
              style={inputStyle}
              placeholder="Phone number"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              required
            />
            <input
              style={inputStyle}
              placeholder="4-digit PIN"
              inputMode="numeric"
              value={formPin}
              onChange={(e) => setFormPin(e.target.value)}
              required
            />
            {formError && <p style={{ color: "#e53e3e", fontSize: "13px" }}>{formError}</p>}
            <button type="submit" style={{ ...primaryBtnStyle, marginTop: "8px" }}>
              Add cleaner
            </button>
          </form>
        </section>

        {/* PROPERTY RATES */}
        <section style={sectionStyle}>
          <h2 style={sectionHeading}>Cleaning Rates per Property</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {properties.map((p) => (
              <div key={p.slug} style={rowCardStyle}>
                <span style={{ color: "#1A3A4A", fontWeight: 600 }}>
                  {PROPERTY_LABELS[p.slug] ?? p.slug}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  $
                  <input
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={rateFor(p.slug)}
                    onBlur={(e) => handleRateChange(p.slug, Number(e.target.value))}
                    style={{ ...inputStyle, width: "80px", margin: 0 }}
                  />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* RECENT JOBS */}
        <section style={sectionStyle}>
          <h2 style={sectionHeading}>Recent Jobs</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {jobs.slice(0, 30).map((j) => (
              <div key={j.id} style={rowCardStyle}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1A3A4A" }}>{j.property_name}</div>
                  <div style={{ color: "#666", fontSize: "13px" }}>
                    {j.checkout_date} · {j.cleaners?.name ?? "Unclaimed"}
                  </div>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#a06020" }}>
                  {j.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F8FAFB",
  fontFamily: "Arial, sans-serif",
};
const navStyle: React.CSSProperties = {
  background: "#fff",
  borderBottom: "1px solid #eee",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  zIndex: 100,
};
const mainStyle: React.CSSProperties = {
  maxWidth: "720px",
  margin: "0 auto",
  padding: "24px 16px 60px",
};
const sectionStyle: React.CSSProperties = { marginBottom: "36px" };
const sectionHeading: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#1A3A4A",
  margin: "0 0 12px",
};
const rowCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "10px",
  padding: "12px 16px",
  border: "1px solid #eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};
const formCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "16px",
  border: "1px solid #eee",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  marginBottom: "8px",
  boxSizing: "border-box",
};
const primaryBtnStyle: React.CSSProperties = {
  background: "#1A3A4A",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};
const secondaryBtnStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #1A3A4A",
  color: "#1A3A4A",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const ghostBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid #ddd",
  color: "#555",
  padding: "8px 14px",
  borderRadius: "6px",
  fontSize: "13px",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "none",
};
const badgeStyle: React.CSSProperties = {
  background: "#FFF8E8",
  color: "#a06020",
  fontSize: "10px",
  fontWeight: 800,
  padding: "2px 6px",
  borderRadius: "4px",
  marginLeft: "6px",
};
