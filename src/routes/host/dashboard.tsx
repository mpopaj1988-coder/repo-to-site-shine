import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/host/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — GuestConnect" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: HostDashboard,
});

interface Property {
  id: string;
  slug: string;
  property_name: string;
  wifi_network: string;
  wifi_password: string;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
}

function HostDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/host/login" });
        return;
      }
      setToken(session.access_token);
      loadData(session.access_token);
    });
  }, []);

  const loadData = async (accessToken: string) => {
    setLoading(true);
    try {
      const [profileRes, propsRes] = await Promise.all([
        fetch("/api/host/profile", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch("/api/host/properties", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (profileRes.status === 401) {
        navigate({ to: "/host/login" });
        return;
      }

      const profileData = await profileRes.json();
      const propsData = await propsRes.json();

      if (profileData.profile) setProfile(profileData.profile);
      if (propsData.properties) setProperties(propsData.properties);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/host/login" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/host/properties?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const downloadQR = async (slug: string, name: string) => {
    // Dynamically import qrcode so it doesn't bloat main bundle
    const QRCode = await import("qrcode");
    const url = `${window.location.origin}/wifi/${slug}`;
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, url, {
      width: 600,
      margin: 2,
      color: { dark: "#1A3A4A", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    const link = document.createElement("a");
    link.download = `${slug}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  if (loading) {
    return (
      <div style={{ ...pageStyle, justifyContent: "center" }}>
        <p style={{ color: "#666" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* TOP NAV */}
      <nav style={navStyle}>
        <Link
          to="/host"
          style={{ fontWeight: 800, fontSize: "18px", color: "#1A3A4A", textDecoration: "none" }}
        >
          GuestConnect
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {profile && (
            <span style={{ fontSize: "14px", color: "#666" }}>
              {profile.full_name ?? profile.email}
            </span>
          )}
          <button onClick={handleLogout} style={ghostBtnStyle}>
            Log out
          </button>
        </div>
      </nav>

      <main style={mainStyle}>
        {/* TRIAL BANNER */}
        {profile?.subscription_status === "trialing" && trialDaysLeft !== null && (
          <div style={trialBannerStyle}>
            🎉 You're on your free trial — <strong>{trialDaysLeft} days left</strong>. &nbsp;
            <a href="#" style={{ color: "#1A3A4A", fontWeight: 700, textDecoration: "underline" }}>
              Add payment method →
            </a>
          </div>
        )}

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1A3A4A", margin: "0 0 4px" }}>
              Your Properties
            </h1>
            <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
              {properties.length} propert{properties.length === 1 ? "y" : "ies"}
            </p>
          </div>
          <Link to="/host/properties/new" style={primaryBtnStyle}>
            + Add property
          </Link>
        </div>

        {/* EMPTY STATE */}
        {properties.length === 0 && (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏠</div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1A3A4A", margin: "0 0 8px" }}>
              Add your first property
            </h2>
            <p style={{ color: "#666", fontSize: "15px", margin: "0 0 24px" }}>
              Set up your WiFi details and house guide — takes 5 minutes.
            </p>
            <Link to="/host/properties/new" style={primaryBtnStyle}>
              Add property →
            </Link>
          </div>
        )}

        {/* PROPERTY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {properties.map((prop) => (
            <div key={prop.id} style={propertyCardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#1A3A4A",
                      margin: "0 0 4px",
                    }}
                  >
                    {prop.property_name}
                  </h3>
                  <a
                    href={`/wifi/${prop.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#C9A84C",
                      fontSize: "13px",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    /wifi/{prop.slug} ↗
                  </a>
                </div>
                <span
                  style={{
                    background: prop.is_active ? "#e6f9f0" : "#f9f0e6",
                    color: prop.is_active ? "#1a7f4b" : "#a06020",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "100px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {prop.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div
                style={{
                  background: "#F8FAFB",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                <div style={wifiRowStyle}>
                  <span style={wifiLabelStyle}>Network</span>
                  <span style={wifiValueStyle}>{prop.wifi_network || "—"}</span>
                </div>
                <div style={wifiRowStyle}>
                  <span style={wifiLabelStyle}>Password</span>
                  <span
                    style={{ ...wifiValueStyle, fontFamily: "monospace", letterSpacing: "0.05em" }}
                  >
                    {prop.wifi_password || "—"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => downloadQR(prop.slug, prop.property_name)}
                  style={secondaryBtnStyle}
                >
                  ⬇ QR Code
                </button>
                <Link to="/host/properties/$id" params={{ id: prop.id }} style={secondaryBtnStyle}>
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(prop.id, prop.property_name)}
                  style={{ ...secondaryBtnStyle, color: "#e53e3e", borderColor: "#fed7d7" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
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
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const mainStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "40px 24px",
};

const trialBannerStyle: React.CSSProperties = {
  background: "#FFF8E8",
  border: "1px solid #f0d890",
  color: "#5a4000",
  borderRadius: "8px",
  padding: "12px 20px",
  fontSize: "14px",
  marginBottom: "32px",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "#1A3A4A",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 700,
  display: "inline-block",
  border: "none",
  cursor: "pointer",
};

const ghostBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid #ddd",
  color: "#555",
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #ddd",
  color: "#333",
  padding: "8px 14px",
  borderRadius: "6px",
  fontSize: "13px",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};

const propertyCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid #eee",
};

const emptyStateStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "64px 32px",
  textAlign: "center",
  border: "2px dashed #ddd",
};

const wifiRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "2px 0",
};

const wifiLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#999",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const wifiValueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#1A3A4A",
  maxWidth: "60%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};
