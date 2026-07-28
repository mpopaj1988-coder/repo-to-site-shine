import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/host/login")({
  head: () => ({
    meta: [{ title: "Log in — GuestConnect" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: HostLoginPage,
});

function HostLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }
      navigate({ to: "/host/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Link to="/host" style={{ textDecoration: "none" }}>
          <div style={logoStyle}>GuestConnect</div>
        </Link>
        <h1 style={headingStyle}>Welcome back</h1>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            required
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

        <p style={{ textAlign: "center", color: "#666", fontSize: "14px", marginTop: "20px" }}>
          Don't have an account?{" "}
          <Link to="/host/signup" style={{ color: "#1A3A4A", fontWeight: 600 }}>
            Start free trial
          </Link>
        </p>
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
  fontSize: "22px",
  fontWeight: 800,
  color: "#1A3A4A",
  textAlign: "center",
  marginBottom: "24px",
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
  marginTop: "16px",
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
