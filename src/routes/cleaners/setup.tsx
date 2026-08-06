import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { bootstrapFirstAdmin } from "@/lib/cleaner-portal.functions";

// One-time page: creates the first (admin) cleaner login. Refuses to run
// again once any cleaner exists — see bootstrapFirstAdmin.
export const Route = createFileRoute("/cleaners/setup")({
  head: () => ({ meta: [{ title: "Set Up Cleaner Portal — Sea & City Rentals" }] }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await bootstrapFirstAdmin({ data: { name, phone, pin } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      navigate({ to: "/cleaners/login" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>Sea & City Rentals</div>
        <h1 style={headingStyle}>One-Time Setup</h1>
        <p style={{ color: "#666", fontSize: "14px", textAlign: "center", margin: "0 0 24px" }}>
          Create your own admin login. This page stops working the moment it's used once.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Your name</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label style={labelStyle}>Phone number</label>
          <input
            style={inputStyle}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
            required
          />

          <label style={labelStyle}>Choose a PIN (4-6 digits)</label>
          <input
            style={inputStyle}
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            required
          />

          {error && <p style={errorStyle}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating…" : "Create admin login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F8FAFB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
  padding: "32px 16px",
};
const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "40px",
  width: "100%",
  maxWidth: "400px",
  boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
};
const logoStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#1A3A4A",
  textAlign: "center",
  marginBottom: "8px",
};
const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 800,
  color: "#1A3A4A",
  margin: "0 0 8px",
  textAlign: "center",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#333",
  marginBottom: "6px",
  marginTop: "16px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  border: "1.5px solid #ddd",
  borderRadius: "8px",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
  width: "100%",
  background: "#1A3A4A",
  color: "#fff",
  border: "none",
  padding: "16px",
  borderRadius: "8px",
  fontSize: "17px",
  fontWeight: 700,
  marginTop: "24px",
};
const errorStyle: React.CSSProperties = {
  color: "#e53e3e",
  fontSize: "13px",
  marginTop: "8px",
  background: "#fff5f5",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #fed7d7",
};
