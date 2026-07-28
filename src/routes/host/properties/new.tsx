import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PropertyForm } from "@/components/site/PropertyForm";

export const Route = createFileRoute("/host/properties/new")({
  head: () => ({
    meta: [
      { title: "Add Property — GuestConnect" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NewPropertyPage,
});

function NewPropertyPage() {
  const navigate = useNavigate();
  const [token, setToken] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/host/login" });
        return;
      }
      setToken(session.access_token);
    });
  }, []);

  const handleSave = async (data: Record<string, unknown>) => {
    if (!token) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/host/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save");
        return;
      }
      navigate({ to: "/host/dashboard" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageStyle}>
      <nav style={navStyle}>
        <Link
          to="/host/dashboard"
          style={{ fontWeight: 800, fontSize: "18px", color: "#1A3A4A", textDecoration: "none" }}
        >
          ← Dashboard
        </Link>
      </nav>
      <main style={mainStyle}>
        <h1 style={headingStyle}>Add new property</h1>
        {error && <div style={errorStyle}>{error}</div>}
        <PropertyForm onSave={handleSave} saving={saving} />
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
  padding: "16px 32px",
};
const mainStyle: React.CSSProperties = {
  maxWidth: "700px",
  margin: "0 auto",
  padding: "40px 24px",
};
const headingStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 800,
  color: "#1A3A4A",
  margin: "0 0 32px",
};
const errorStyle: React.CSSProperties = {
  color: "#e53e3e",
  background: "#fff5f5",
  border: "1px solid #fed7d7",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "20px",
  fontSize: "14px",
};
