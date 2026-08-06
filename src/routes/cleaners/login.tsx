import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { cleanerLogin } from "@/lib/cleaner-portal.functions";

export const Route = createFileRoute("/cleaners/login")({
  head: () => ({ meta: [{ title: "Cleaner Login — Sea & City Rentals" }] }),
  component: CleanerLoginPage,
});

function CleanerLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await cleanerLogin({ data: { phone, pin } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      navigate({ to: "/cleaners" });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>Sea & City Rentals</div>
        <h1 style={headingStyle}>Cleaner Login</h1>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Phone number</label>
          <input
            type="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            placeholder="(555) 555-5555"
            autoComplete="tel"
          />

          <label style={labelStyle}>PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={inputStyle}
            placeholder="••••"
            autoComplete="off"
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
            {loading ? "Signing in…" : "Log in"}
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
  margin: "0 0 28px",
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
