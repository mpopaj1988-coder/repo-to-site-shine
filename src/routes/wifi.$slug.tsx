import { useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { SITE_URL, properties } from "@/data/properties";

// Map slug -> property title for display (runs on server too)
function propertyTitle(slug: string) {
  const p = properties.find((x) => x.slug === slug);
  return p?.title ?? "Your Stay";
}

const VALID_SLUGS = [
  "tampa",
  "largo",
  "irb-b",
  "clearwater",
  "irb-a",
  "stpete-sunsoaked",
  "stpete-modern",
  "stpete-hottub",
  "stpete-patio",
];

export const Route = createFileRoute("/wifi/$slug")({
  loader: ({ params }) => {
    if (!VALID_SLUGS.includes(params.slug)) throw notFound();
    return { slug: params.slug, title: propertyTitle(params.slug) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return {
      meta: [
        { title: `WiFi & House Guide — ${loaderData.title} | Sea & City Rentals` },
        { name: "description", content: "Enter your email to receive WiFi credentials and your house guide." },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: WifiPage,
});

function WifiPage() {
  const { slug, title } = Route.useLoaderData();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/public/wifi-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), slug }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        throw new Error("Request failed");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#1A3A4A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      {/* Card */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        maxWidth: "400px",
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Card header */}
        <div style={{ backgroundColor: "#1A3A4A", padding: "28px 28px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.35em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 10px", fontFamily: "system-ui, sans-serif" }}>
            Sea &amp; City Rentals
          </p>
          <h1 style={{ fontSize: "22px", color: "#ffffff", margin: "0 0 6px", fontFamily: "Georgia, serif", fontWeight: 400, lineHeight: 1.25 }}>
            {title}
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", margin: 0, fontFamily: "system-ui, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            WiFi &amp; House Guide
          </p>
        </div>

        {/* Card body */}
        <div style={{ padding: "28px" }}>
          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <h2 style={{ fontSize: "20px", color: "#1A3A4A", margin: "0 0 10px", fontFamily: "Georgia, serif", fontWeight: 400 }}>
                Check your inbox!
              </h2>
              <p style={{ fontSize: "14px", color: "#666", margin: "0 0 8px", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
                Your WiFi password and house guide have been sent to:
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A3A4A", margin: "0", fontFamily: "system-ui, sans-serif" }}>
                {email}
              </p>
              <p style={{ fontSize: "13px", color: "#999", margin: "16px 0 0", fontFamily: "system-ui, sans-serif" }}>
                Don't see it? Check your spam folder.
              </p>
            </div>
          ) : (
            <>
              {/* What you'll receive */}
              <div style={{ backgroundColor: "#F8F5EE", borderRadius: "10px", padding: "16px 18px", marginBottom: "22px" }}>
                <p style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 10px", fontFamily: "system-ui, sans-serif" }}>
                  You'll receive
                </p>
                {[
                  { icon: "📶", text: "WiFi network & password" },
                  { icon: "🏠", text: "Check-out time & house notes" },
                  { icon: "🚗", text: "Parking & trash info" },
                  { icon: "📍", text: "Local restaurant & activity guide" },
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
                    <span style={{ fontSize: "16px" }}>{item.icon}</span>
                    <span style={{ fontSize: "14px", color: "#444", fontFamily: "system-ui, sans-serif" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "8px", fontFamily: "system-ui, sans-serif" }}>
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={status === "loading"}
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    fontSize: "16px",
                    border: "1.5px solid #ddd",
                    borderRadius: "8px",
                    fontFamily: "system-ui, sans-serif",
                    color: "#1A3A4A",
                    marginBottom: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                    backgroundColor: status === "loading" ? "#f9f9f9" : "#fff",
                  }}
                />

                {errorMsg && (
                  <p style={{ fontSize: "13px", color: "#c0392b", margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: status === "loading" ? "#7a9aaa" : "#1A3A4A",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: status === "loading" ? "default" : "pointer",
                    fontFamily: "system-ui, sans-serif",
                    transition: "background-color 0.15s",
                  }}
                >
                  {status === "loading" ? "Sending…" : "Get WiFi Info →"}
                </button>

                <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", margin: "14px 0 0", fontFamily: "system-ui, sans-serif" }}>
                  No spam — just your WiFi code and house guide.
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "24px 0 0", fontFamily: "system-ui, sans-serif" }}>
        © Sea &amp; City Rentals · {new Date().getFullYear()}
      </p>
    </div>
  );
}
