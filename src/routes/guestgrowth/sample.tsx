/**
 * GuestGrowth — Sample Guest Guide
 *
 * This is the demo page hosts see to understand what their guests will experience.
 * Customize SAMPLE_PROPERTY below to match your demo property.
 *
 * Placeholders:
 *  - SAMPLE_PROPERTY: all property content
 *  - Email capture: wired to /api/public/wifi-signup (replace slug with "sample")
 *  - To add real Stripe "Book Direct" checkout: replace bookUrl with Stripe payment link
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/guestgrowth/sample")({
  head: () => ({
    meta: [
      { title: "Sample Guest Guide — GuestGrowth QR System" },
      { name: "description", content: "See exactly what your guests experience when they scan your QR code." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SampleGuestGuide,
});

// ── SAMPLE_PROPERTY — edit all content here ──────────────────────────────────
const SAMPLE_PROPERTY = {
  name: "Oceanfront 4BR — Clearwater Beach",
  tagline: "Your WiFi password and complete house guide",
  heroColor: "#1A3A4A",
  wifiNetwork: "OceanView_5G",
  wifiPassword: "SunsetGuest2025",
  checkIn: "4:00 PM",
  checkOut: "10:00 AM",
  emergencyContact: "248-766-2957",
  bookDirectUrl: "#book-direct", // TODO: Replace with Stripe payment link or booking page
  bookDirectDiscount: "15%",

  houseRules: [
    "No smoking anywhere on the property",
    "No parties or events — max occupancy is 8 guests",
    "Quiet hours 10 PM – 8 AM (neighbors on both sides)",
    "Pets allowed with prior approval only",
    "Please lock all doors and windows when you leave",
  ],

  checkInInstructions: [
    "Keypad code is in your Airbnb/VRBO message thread",
    "Parking: 2 spots in the driveway — additional street parking available",
    "Pool is heated and ready — towels are in the outdoor cabinet",
    "Trash: Pickup is Monday morning — bins are in the side gate",
    "AC is preset to 74°F — feel free to adjust between 70–78°F",
  ],

  localRecommendations: [
    {
      category: "🍽 Restaurants",
      items: [
        { name: "Clear Sky Café", note: "Best breakfast on the beach — arrive before 9 AM to skip the wait" },
        { name: "Frenchy's Rockaway Grill", note: "Classic grouper sandwich, right on the sand — very casual" },
        { name: "Rumba Island Bar & Grill", note: "Best sunset view with a cocktail in hand" },
        { name: "Crabby's Dockside", note: "Fresh seafood, great for groups, waterfront patio" },
      ],
    },
    {
      category: "🏖 Beaches & Activities",
      items: [
        { name: "Clearwater Beach", note: "5-min walk — voted #1 beach in the US multiple years" },
        { name: "Pier 60 Sunset", note: "Live music, street performers, and a great sunset — every evening" },
        { name: "Dolphin watching cruise", note: "Departs from the pier — book at the dock or day before" },
        { name: "Caladesi Island State Park", note: "Pristine, less-crowded beach — take the ferry from Honeymoon Island" },
      ],
    },
    {
      category: "🛍 Shopping & Extras",
      items: [
        { name: "Publix Super Market", note: "10-min drive — best for groceries and quick meals" },
        { name: "Spectrum Wine & Spirits", note: "5-min drive — great selection, friendly staff" },
        { name: "Walgreens (24hr)", note: "8-min walk — pharmacy, snacks, sunscreen" },
      ],
    },
  ],
};
// ────────────────────────────────────────────────────────────────────────────

type Section = "rules" | "checkin" | "local" | null;

function SampleGuestGuide() {
  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">("idle");
  const [skipped, setSkipped] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<Section>(null);
  const [copied, setCopied] = React.useState(false);

  const wifiUnlocked = status === "success" || skipped;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !consent) return;
    setStatus("loading");
    try {
      await fetch("/api/public/wifi-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug: "sample", marketingConsent: consent }),
      });
    } catch {
      // Ignore errors on demo — still unlock
    }
    setStatus("success");
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(SAMPLE_PROPERTY.wifiPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleSection = (section: Section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", maxWidth: "480px", margin: "0 auto", minHeight: "100vh", background: "#f5f5f5" }}>

      {/* Demo banner */}
      <div style={{ background: "#C9A84C", color: "#1A3A4A", textAlign: "center", padding: "10px 16px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.03em" }}>
        👆 SAMPLE GUIDE — This is what your guests see after scanning your QR code
        <Link to="/guestgrowth" style={{ color: "#1A3A4A", textDecoration: "underline", marginLeft: "12px" }}>Get yours →</Link>
      </div>

      {/* HEADER */}
      <div style={{ background: SAMPLE_PROPERTY.heroColor, padding: "32px 24px 28px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", marginBottom: "6px", textTransform: "uppercase" as const }}>Welcome to Your Stay</div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: "0 0 6px", lineHeight: 1.25 }}>{SAMPLE_PROPERTY.name}</h1>
        <p style={{ fontSize: "12px", color: "#C9A84C", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>{SAMPLE_PROPERTY.tagline}</p>
      </div>

      <div style={{ padding: "0 0 80px" }}>

        {/* EMAIL GATE */}
        {!wifiUnlocked ? (
          <div style={{ background: "#fff", margin: "16px", borderRadius: "16px", padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📶</div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1A3A4A", margin: "0 0 8px" }}>Get your WiFi password</h2>
              <p style={{ color: "#777", fontSize: "14px", lineHeight: 1.5, margin: 0 }}>
                Enter your email below to instantly reveal the WiFi password and unlock your complete house guide.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1.5px solid #e5e5e5",
                  borderRadius: "10px",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "12px",
                }}
              />

              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginBottom: "16px" }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: "2px", width: "17px", height: "17px", flexShrink: 0, cursor: "pointer", accentColor: "#1A3A4A" }}
                />
                <span style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
                  I'd like to receive occasional deals and local tips from this host. I can unsubscribe anytime.
                </span>
              </label>

              <button
                type="submit"
                disabled={status === "loading" || !email.trim() || !consent}
                style={{
                  width: "100%",
                  background: (status === "loading" || !email.trim() || !consent) ? "#c5cdd4" : "#1A3A4A",
                  color: "#fff",
                  border: "none",
                  padding: "15px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: 800,
                  cursor: (status === "loading" || !email.trim() || !consent) ? "not-allowed" : "pointer",
                  marginBottom: "12px",
                }}
              >
                {status === "loading" ? "One second…" : "Get WiFi Password & Guide →"}
              </button>
            </form>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => setSkipped(true)}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: "13px", cursor: "pointer", textDecoration: "underline", padding: "4px 8px" }}
              >
                Skip — just show me the guide
              </button>
            </div>
          </div>
        ) : (

          <>
            {/* WIFI BOX */}
            <div style={{ background: "#1A3A4A", margin: "16px", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
              {status === "success" && (
                <div style={{ background: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.3)", borderRadius: "8px", padding: "8px 12px", marginBottom: "16px", fontSize: "13px", color: "#6ee7b7", fontWeight: 600 }}>
                  ✓ Guide sent to {email}
                </div>
              )}
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.2em", marginBottom: "4px" }}>📶 WIFI NETWORK</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>{SAMPLE_PROPERTY.wifiNetwork}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.2em", marginBottom: "6px" }}>🔐 PASSWORD</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#C9A84C", letterSpacing: "0.06em", marginBottom: "14px" }}>
                {SAMPLE_PROPERTY.wifiPassword}
              </div>
              <button
                onClick={copyPassword}
                style={{ background: copied ? "rgba(110,231,183,0.2)" : "rgba(255,255,255,0.1)", border: `1px solid ${copied ? "rgba(110,231,183,0.4)" : "rgba(255,255,255,0.2)"}`, color: copied ? "#6ee7b7" : "#fff", padding: "10px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                {copied ? "✓ Copied!" : "Copy Password"}
              </button>
            </div>

            {/* STAY DETAILS */}
            <div style={{ background: "#fff", margin: "12px 16px", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ padding: "18px 20px", borderRight: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "0.15em", marginBottom: "4px" }}>CHECK-IN</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#1A3A4A" }}>{SAMPLE_PROPERTY.checkIn}</div>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "0.15em", marginBottom: "4px" }}>CHECK-OUT</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#1A3A4A" }}>{SAMPLE_PROPERTY.checkOut}</div>
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "0.15em", marginBottom: "4px" }}>📞 EMERGENCY CONTACT</div>
                <div style={{ fontSize: "17px", fontWeight: 700, color: "#1A3A4A" }}>{SAMPLE_PROPERTY.emergencyContact}</div>
              </div>
            </div>

            {/* ACCORDION SECTIONS */}
            {[
              {
                id: "rules" as Section,
                label: "🏠 House Rules",
                content: (
                  <ul style={{ margin: 0, padding: "0 0 0 4px", listStyle: "none" }}>
                    {SAMPLE_PROPERTY.houseRules.map((rule, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: i < SAMPLE_PROPERTY.houseRules.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                        <span style={{ color: "#C9A84C", fontWeight: 700, flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: "14px", color: "#444", lineHeight: 1.5 }}>{rule}</span>
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                id: "checkin" as Section,
                label: "🕐 Check-in & Check-out",
                content: (
                  <ul style={{ margin: 0, padding: "0 0 0 4px", listStyle: "none" }}>
                    {SAMPLE_PROPERTY.checkInInstructions.map((item, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: i < SAMPLE_PROPERTY.checkInInstructions.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                        <span style={{ color: "#1A3A4A", fontWeight: 700, flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: "14px", color: "#444", lineHeight: 1.5 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                id: "local" as Section,
                label: "🍽 Local Recommendations",
                content: (
                  <div>
                    {SAMPLE_PROPERTY.localRecommendations.map((cat) => (
                      <div key={cat.category} style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#1A3A4A", marginBottom: "8px", letterSpacing: "0.03em" }}>{cat.category}</div>
                        {cat.items.map((item, i) => (
                          <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#222", marginBottom: "2px" }}>{item.name}</div>
                            <div style={{ fontSize: "13px", color: "#777", lineHeight: 1.45 }}>{item.note}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ),
              },
            ].map(({ id, label, content }) => (
              <div key={id} style={{ background: "#fff", margin: "8px 16px", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleSection(id)}
                  style={{ width: "100%", background: "none", border: "none", padding: "18px 20px", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#1A3A4A" }}>{label}</span>
                  <span style={{ fontSize: "20px", color: "#C9A84C", transition: "transform 0.2s", transform: openSection === id ? "rotate(45deg)" : "rotate(0)", display: "inline-block" }}>+</span>
                </button>
                {openSection === id && (
                  <div style={{ padding: "0 20px 20px" }}>
                    {content}
                  </div>
                )}
              </div>
            ))}

            {/* BOOK DIRECT CTA */}
            <div style={{ background: "#1A3A4A", margin: "12px 16px", borderRadius: "16px", padding: "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#C9A84C", fontWeight: 800, letterSpacing: "0.15em", marginBottom: "8px" }}>COMING BACK?</div>
              <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.3 }}>
                Book directly and save {SAMPLE_PROPERTY.bookDirectDiscount}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 20px" }}>
                Skip the Airbnb fees. Same property, same quality — at a lower price when you book direct.
              </p>
              <a
                href={SAMPLE_PROPERTY.bookDirectUrl}
                style={{ display: "block", background: "#C9A84C", color: "#1A3A4A", padding: "14px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", fontWeight: 800 }}
              >
                Book Direct &amp; Save {SAMPLE_PROPERTY.bookDirectDiscount} →
              </a>
            </div>
          </>
        )}

        {/* Bottom label */}
        <div style={{ textAlign: "center", padding: "24px", color: "#bbb", fontSize: "12px" }}>
          <Link to="/guestgrowth" style={{ color: "#C9A84C", fontWeight: 700, textDecoration: "none" }}>
            Want this for your property? →
          </Link>
        </div>
      </div>
    </div>
  );
}
