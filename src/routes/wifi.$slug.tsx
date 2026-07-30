import { useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { properties } from "@/data/properties";

const SITE_URL = "https://seaandcityrentals.com";

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

type Tip = { name: string; note: string };
type HouseNote = string | { text: string; image: string } | { text: string; video: string };

type Guide = {
  propertyName: string;
  wifiNetwork: string;
  wifiPassword: string;
  checkInTime: string;
  checkoutTime: string;
  parking: string | null;
  trash: string | null;
  emergencyContact: string;
  notes: HouseNote[];
  guideSlug: string | null;
  restaurants: Tip[];
  activities: Tip[];
  nightlife: Tip[];
  beaches: Tip[];
};

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
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [guide, setGuide] = useState<Guide | null>(null);

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
        const data = (await res.json()) as { ok: boolean; guide: Guide };
        setGuide(data.guide);
      } else {
        throw new Error("Request failed");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#1A3A4A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "24px 20px 40px" }}>
      {/* Card */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", maxWidth: "440px", width: "100%", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        {/* Header */}
        <div style={{ backgroundColor: "#1A3A4A", padding: "28px 28px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.35em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 10px", fontFamily: "system-ui, sans-serif" }}>
            Sea &amp; City Rentals
          </p>
          <h1 style={{ fontSize: "22px", color: "#ffffff", margin: "0 0 6px", fontFamily: "Georgia, serif", fontWeight: 400, lineHeight: 1.25 }}>
            {guide ? guide.propertyName : title}
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", margin: 0, fontFamily: "system-ui, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            WiFi &amp; House Guide
          </p>
        </div>

        <div style={{ padding: "28px" }}>
          {guide ? (
            /* ── GUIDE VIEW ── */
            <div>
              {/* WiFi box */}
              <div style={{ backgroundColor: "#1A3A4A", borderRadius: "10px", padding: "20px", textAlign: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>📶 WiFi Network</p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: "0 0 14px", fontFamily: "system-ui, sans-serif", letterSpacing: "0.05em" }}>{guide.wifiNetwork}</p>
                <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>🔐 Password</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color: "#C9A84C", margin: 0, fontFamily: "system-ui, sans-serif", letterSpacing: "0.1em" }}>{guide.wifiPassword}</p>
              </div>

              {/* Check-in / check-out */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <div style={{ flex: 1, backgroundColor: "#F8F5EE", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>Check-in</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#1A3A4A", margin: 0, fontFamily: "system-ui, sans-serif" }}>{guide.checkInTime}</p>
                </div>
                <div style={{ flex: 1, backgroundColor: "#F8F5EE", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>Check-out</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#1A3A4A", margin: 0, fontFamily: "system-ui, sans-serif" }}>{guide.checkoutTime}</p>
                </div>
              </div>

              {/* Parking */}
              {guide.parking && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>🚗 Parking</p>
                  <p style={{ fontSize: "14px", color: "#444", margin: 0, fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>{guide.parking}</p>
                </div>
              )}

              {/* Trash */}
              {guide.trash && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>🗑️ Trash</p>
                  <p style={{ fontSize: "14px", color: "#444", margin: 0, fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>{guide.trash}</p>
                </div>
              )}

              {/* House notes */}
              {guide.notes.length > 0 && (
                <div style={{ backgroundColor: "#F8F5EE", borderRadius: "8px", padding: "16px 18px", margin: "16px 0" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 10px", fontFamily: "system-ui, sans-serif" }}>House Notes</p>
                  {guide.notes.map((note, i) => {
                    if (typeof note === "string") {
                      return <p key={i} style={{ fontSize: "14px", color: "#444", margin: "0 0 6px", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>• {note}</p>;
                    }
                    if ("video" in note) {
                      return (
                        <div key={i} style={{ marginBottom: "14px" }}>
                          <p style={{ fontSize: "14px", color: "#444", margin: "0 0 8px", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>• {note.text}</p>
                          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px" }}>
                            <iframe
                              src={note.video}
                              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Video guide"
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} style={{ marginBottom: "12px" }}>
                        <p style={{ fontSize: "14px", color: "#444", margin: "0 0 8px", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>• {note.text}</p>
                        <img src={note.image} alt="" style={{ width: "100%", borderRadius: "8px", display: "block" }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Local guide sections */}
              {(guide.restaurants.length > 0 || guide.activities.length > 0 || guide.nightlife.length > 0 || guide.beaches.length > 0) && (
                <div style={{ marginTop: "8px" }}>
                  <p style={{ fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 12px", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
                    Local Guide
                  </p>
                  {[
                    { label: "🍽️ Restaurants", items: guide.restaurants },
                    { label: "🎯 Things To Do", items: guide.activities },
                    { label: "🍹 Nightlife", items: guide.nightlife },
                    { label: "🏖️ Beaches", items: guide.beaches },
                  ].filter(s => s.items.length > 0).map((section) => (
                    <div key={section.label} style={{ marginBottom: "16px" }}>
                      <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", margin: "0 0 8px", fontFamily: "system-ui, sans-serif" }}>{section.label}</p>
                      {section.items.map((item) => (
                        <div key={item.name} style={{ marginBottom: "8px" }}>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A3A4A", margin: "0 0 2px", fontFamily: "system-ui, sans-serif" }}>{item.name}</p>
                          <p style={{ fontSize: "13px", color: "#666", margin: 0, fontFamily: "system-ui, sans-serif", lineHeight: 1.4 }}>{item.note}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: "1px solid #eee", margin: "16px 0" }} />

              {/* Emergency contact */}
              <p style={{ fontSize: "13px", color: "#888", textAlign: "center", margin: "12px 0 2px", fontFamily: "system-ui, sans-serif" }}>
                Need help? Call or text anytime:
              </p>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#1A3A4A", textAlign: "center", margin: "0 0 20px", fontFamily: "system-ui, sans-serif" }}>
                <a href={`tel:${guide.emergencyContact}`} style={{ color: "#1A3A4A", textDecoration: "none" }}>{guide.emergencyContact}</a>
              </p>

              {/* Local guide link */}
              {guide.guideSlug && (
                <a
                  href={`${SITE_URL}/explore/${guide.guideSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", border: "1.5px solid #1A3A4A", color: "#1A3A4A", padding: "12px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", fontFamily: "system-ui, sans-serif", marginBottom: "12px" }}
                >
                  📍 Local Restaurants &amp; Tips →
                </a>
              )}

              {/* Email copy note */}
              <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", margin: "0 0 20px", fontFamily: "system-ui, sans-serif" }}>
                A copy has been sent to {email}
              </p>

              {/* Book Direct */}
              <div style={{ backgroundColor: "#1A3A4A", borderRadius: "10px", padding: "18px", textAlign: "center" }}>
                <p style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 6px", fontFamily: "system-ui, sans-serif" }}>Coming back?</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: "0 0 14px", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>
                  Book directly next time and save up to 15% — no Airbnb fees.
                </p>
                <a
                  href={`${SITE_URL}/listings/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", backgroundColor: "#C9A84C", color: "#1A3A4A", padding: "12px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", fontFamily: "system-ui, sans-serif" }}
                >
                  Book Direct &amp; Save 15% →
                </a>
              </div>
            </div>
          ) : (
            /* ── FORM VIEW ── */
            <>
              <div style={{ backgroundColor: "#F8F5EE", borderRadius: "10px", padding: "16px 18px", marginBottom: "22px" }}>
                <p style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#C9A84C", margin: "0 0 10px", fontFamily: "system-ui, sans-serif" }}>
                  You'll get instantly
                </p>
                {[
                  { icon: "📶", text: "WiFi network & password" },
                  { icon: "🔑", text: "Door code" },
                  { icon: "🏠", text: "Check-out time & house notes" },
                  { icon: "📍", text: "Local restaurants & activity guide" },
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
                    <span style={{ fontSize: "16px" }}>{item.icon}</span>
                    <span style={{ fontSize: "14px", color: "#444", fontFamily: "system-ui, sans-serif" }}>{item.text}</span>
                  </div>
                ))}
              </div>

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
                  style={{ width: "100%", padding: "13px 14px", fontSize: "16px", border: "1.5px solid #ddd", borderRadius: "8px", fontFamily: "system-ui, sans-serif", color: "#1A3A4A", marginBottom: "14px", boxSizing: "border-box", outline: "none", backgroundColor: status === "loading" ? "#f9f9f9" : "#fff" }}
                />

                {errorMsg && (
                  <p style={{ fontSize: "13px", color: "#c0392b", margin: "0 0 12px", fontFamily: "system-ui, sans-serif" }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  style={{ width: "100%", padding: "14px", backgroundColor: status === "loading" ? "#7a9aaa" : "#1A3A4A", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: status === "loading" ? "default" : "pointer", fontFamily: "system-ui, sans-serif" }}
                >
                  {status === "loading" ? "Loading…" : "Get WiFi & Guide →"}
                </button>

                <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", margin: "14px 0 0", fontFamily: "system-ui, sans-serif" }}>
                  No spam — just your WiFi code and house guide.
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "24px 0 0", fontFamily: "system-ui, sans-serif" }}>
        © Sea &amp; City Rentals · {new Date().getFullYear()}
      </p>
    </div>
  );
}
