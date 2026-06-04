import * as React from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PropertyForm } from "@/components/site/PropertyForm";

export const Route = createFileRoute("/host/properties/$id")({
  head: () => ({ meta: [{ title: "Edit Property — GuestConnect" }] }),
  component: EditPropertyPage,
});

function EditPropertyPage() {
  const { id } = useParams({ from: "/host/properties/$id" });
  const navigate = useNavigate();
  const [token, setToken] = React.useState<string | null>(null);
  const [initial, setInitial] = React.useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/host/login" });
        return;
      }
      setToken(session.access_token);

      const res = await fetch("/api/host/properties", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      const prop = (data.properties ?? []).find((p: { id: string }) => p.id === id);
      if (!prop) {
        navigate({ to: "/host/dashboard" });
        return;
      }
      setInitial(prop);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (data: Record<string, unknown>) => {
    if (!token) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/host/properties?id=${id}`, {
        method: "PUT",
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <nav style={navStyle}>
        <Link to="/host/dashboard" style={{ fontWeight: 800, fontSize: "18px", color: "#1A3A4A", textDecoration: "none" }}>
          ← Dashboard
        </Link>
      </nav>
      <main style={mainStyle}>
        <h1 style={headingStyle}>Edit property</h1>
        {error && <div style={errorStyle}>{error}</div>}
        {initial && <PropertyForm initialValues={initial} onSave={handleSave} saving={saving} />}
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#F8FAFB", fontFamily: "Arial, sans-serif" };
const navStyle: React.CSSProperties = { background: "#fff", borderBottom: "1px solid #eee", padding: "16px 32px" };
const mainStyle: React.CSSProperties = { maxWidth: "700px", margin: "0 auto", padding: "40px 24px" };
const headingStyle: React.CSSProperties = { fontSize: "28px", fontWeight: 800, color: "#1A3A4A", margin: "0 0 32px" };
const errorStyle: React.CSSProperties = {
  color: "#e53e3e",
  background: "#fff5f5",
  border: "1px solid #fed7d7",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "20px",
  fontSize: "14px",
};
