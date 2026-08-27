import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/accounting/login")({
  head: () => ({ meta: [{ title: "Accounting — Sea & City Rentals" }] }),
  component: AccountingLoginPage,
});

function AccountingLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounting/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Incorrect password");
        return;
      }
      navigate({ to: "/admin/accounting" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>Sea &amp; City Rentals</div>
        <h1 style={headingStyle}>Accounting</h1>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
            autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign in"}
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
  maxWidth: "420px",
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
  fontSize: "24px",
  fontWeight: 800,
  color: "#1A3A4A",
  margin: "0 0 28px",
  textAlign: "center",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#333",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #ddd",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  background: "#1A3A4A",
  color: "#fff",
  border: "none",
  padding: "14px",
  borderRadius: "8px",
  fontSize: "16px",
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
