/**
 * GuestGrowth QR System — Landing Page
 *
 * To edit pricing: search for PRICING_TIERS below
 * To edit comparison table: search for COMPARISON_DATA below
 * To edit FAQ: search for FAQ_ITEMS below
 * To connect email tools: see /api/public/guestgrowth-lead.ts
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/guestgrowth/")({
  head: () => ({
    meta: [
      { title: "Guest Growth QR System — Turn Every Guest Into a Future Direct Booking" },
      {
        name: "description",
        content:
          "One QR code. WiFi password, house guide, local recommendations, and direct booking offer — delivered the moment your guest walks in. One-time setup. No monthly fees. You own everything.",
      },
    ],
  }),
  component: GuestGrowthLanding,
});

// ── PRICING_TIERS — edit here ────────────────────────────────────────────────
const PRICING_TIERS = [
  {
    id: "qr-guide",
    name: "QR Guest Guide",
    price: "$299",
    note: "one-time",
    tag: "Most popular",
    description: "Everything a guest needs — delivered instantly on scan.",
    features: [
      "Custom property guide page",
      "WiFi info with email gate",
      "House rules & check-in instructions",
      "Local recommendations section",
      "Emergency contacts",
      "Printable QR code (digital file)",
      "1 revision round",
      "Hosted on your domain or ours",
    ],
    cta: "Get My QR Guide",
    highlight: true,
  },
  {
    id: "email-automation",
    name: "QR Guide + Email Automation",
    price: "$399",
    note: "one-time",
    tag: "",
    description: "Add a follow-up email sequence that converts past guests into direct bookings.",
    features: [
      "Everything in QR Guest Guide",
      "Welcome email (day of check-in)",
      "Book direct discount email (day of checkout)",
      "30-day follow-up email",
      "MailerLite or Klaviyo setup",
      "Unsubscribe & compliance setup",
    ],
    cta: "Get Guide + Emails",
    highlight: false,
  },
  {
    id: "booking-site",
    name: "Direct Booking Website",
    price: "$999+",
    note: "one-time",
    tag: "",
    description: "A full custom direct booking site — your own Airbnb alternative.",
    features: [
      "Everything in QR Guide + Emails",
      "Custom branded booking website",
      "Stripe payment integration",
      "Availability calendar",
      "SEO optimized for your market",
      "Google Analytics setup",
      "Priority support",
    ],
    cta: "Get Full Website",
    highlight: false,
  },
];

// ── COMPARISON_DATA — edit here ──────────────────────────────────────────────
const COMPARISON_DATA = [
  { feature: "Guest WiFi guide", us: true, guidebook: true, wifiCapture: true },
  { feature: "Email capture from guests", us: true, guidebook: false, wifiCapture: true },
  { feature: "House rules & check-in info", us: true, guidebook: true, wifiCapture: false },
  { feature: "Local recommendations", us: true, guidebook: true, wifiCapture: false },
  { feature: "Direct booking CTA", us: true, guidebook: false, wifiCapture: false },
  { feature: "You own the guest email list", us: true, guidebook: false, wifiCapture: false },
  { feature: "No hardware required", us: true, guidebook: true, wifiCapture: false },
  { feature: "No monthly fees", us: true, guidebook: false, wifiCapture: false },
  { feature: "Pricing", us: "$299 once", guidebook: "$15–40/mo", wifiCapture: "$20–50/mo" },
];

// ── FAQ_ITEMS — edit here ────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Do guests have to give their email?",
    a: "Email is required to see the WiFi password, but we always include an optional skip link. Most guests enter their email — they want the WiFi and the experience feels fair. Guests who skip are in the minority.",
  },
  {
    q: "What do I get exactly — is this a software subscription?",
    a: "No. This is a done-for-you setup service. We build your custom guide page, generate your QR code, and hand everything over to you. You own the guide page, the QR code, and every email you collect. No ongoing fees.",
  },
  {
    q: "How is this different from Hostfully, Touch Stay, or Enso Connect?",
    a: "Those are subscription tools — you pay every month, forever. If you stop paying, your guests lose access. With our system, you pay once and own the result. Plus most guidebook tools don't capture guest emails.",
  },
  {
    q: "What email tool do you connect to?",
    a: "We set you up with MailerLite (free up to 1,000 subscribers), Klaviyo, or ConvertKit — whichever you prefer. Email automation is included in the $399 package.",
  },
  {
    q: "How long does setup take?",
    a: "Most properties are live within 3–5 business days. We need your property details, WiFi info, house rules, and any local recommendations. We do the rest.",
  },
  {
    q: "What if I have multiple properties?",
    a: "Each property is a separate setup (each has its own guide page and QR code). We offer discounts for 3+ properties — mention it in the form and we'll quote you.",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

function GuestGrowthLanding() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    numProperties: "",
    listingUrl: "",
    package: "unsure",
    message: "",
  });
  const [formStatus, setFormStatus] = React.useState<"idle" | "sending" | "success" | "error">("idle");
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    try {
      const res = await fetch("/api/public/guestgrowth-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          numProperties: formData.numProperties,
          listingUrl: formData.listingUrl,
          package: formData.package,
          message: formData.message,
        }),
      });
      setFormStatus(res.ok ? "success" : "error");
    } catch {
      setFormStatus("error");
    }
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#1a1a1a", background: "#fff", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #f0f0f0", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: "18px", color: "#1A3A4A", letterSpacing: "-0.02em" }}>
          GuestGrowth<span style={{ color: "#C9A84C" }}>.</span>
        </span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a href="#sample" style={{ color: "#555", textDecoration: "none", fontSize: "14px", fontWeight: 500, padding: "8px 12px" }}>
            See Sample
          </a>
          <a
            href="#get-started"
            style={{ background: "#1A3A4A", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(135deg, #0f2535 0%, #1A3A4A 60%, #1e4a5c 100%)", padding: "80px 24px 96px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(201,168,76,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.05) 0%, transparent 50%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "780px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "100px", padding: "6px 16px", marginBottom: "28px" }}>
            <span style={{ width: "8px", height: "8px", background: "#C9A84C", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ color: "#C9A84C", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>For Airbnb & VRBO Hosts</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 24px", color: "#fff", letterSpacing: "-0.03em" }}>
            Every guest who leaves without
            <br />
            <span style={{ color: "#C9A84C" }}>their email is a booking lost forever</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: "600px", margin: "0 auto 40px" }}>
            One QR code. WiFi password, house guide, local recommendations, and a direct booking offer — delivered the moment your guest walks in. You own every email. No monthly fees. Ever.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="#get-started"
              style={{ background: "#C9A84C", color: "#1A3A4A", padding: "18px 36px", borderRadius: "8px", textDecoration: "none", fontSize: "17px", fontWeight: 800, letterSpacing: "-0.01em" }}
            >
              Get My QR Guest System →
            </a>
            <Link
              to="/guestgrowth/sample"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", padding: "18px 32px", borderRadius: "8px", textDecoration: "none", fontSize: "16px", fontWeight: 600 }}
            >
              See Sample Guest Guide
            </Link>
          </div>

          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "20px" }}>
            One-time setup · No subscriptions · You own the guide &amp; email list
          </p>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ background: "#F8FAFB", borderBottom: "1px solid #eee", padding: "24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", gap: "0", justifyContent: "space-around", flexWrap: "wrap" }}>
          {[
            { stat: "$0/mo", label: "in ongoing fees" },
            { stat: "2–3 min", label: "guest experience" },
            { stat: "100%", label: "you own the emails" },
            { stat: "3–5 days", label: "typical setup time" },
          ].map((item) => (
            <div key={item.stat} style={{ textAlign: "center", padding: "12px 24px" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A4A", letterSpacing: "-0.03em" }}>{item.stat}</div>
              <div style={{ fontSize: "13px", color: "#777", marginTop: "2px" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          <div style={{ padding: "32px", background: "#fff5f5", borderRadius: "16px", border: "1px solid #fecaca" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>😤</div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 10px" }}>
              Airbnb keeps the guest relationship
            </h3>
            <p style={{ color: "#666", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
              Your guests check out and Airbnb owns the communication. You pay 3% every time they rebook — through the platform you introduced them to.
            </p>
          </div>
          <div style={{ padding: "32px", background: "#fff5f5", borderRadius: "16px", border: "1px solid #fecaca" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>💸</div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 10px" }}>
              Monthly tools eat your margins
            </h3>
            <p style={{ color: "#666", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
              Guidebook software: $15–40/mo. WiFi capture hardware: $20–50/mo per property. That's $420–$1,080/year per property — just to stay competitive.
            </p>
          </div>
          <div style={{ padding: "32px", background: "#fff5f5", borderRadius: "16px", border: "1px solid #fecaca" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 10px" }}>
              You have no way to reach past guests
            </h3>
            <p style={{ color: "#666", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
              Hundreds of guests have stayed with you. You can't email them a discount. You can't announce a new property. You're starting from zero every season.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "#F8FAFB", padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#1A3A4A", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
              How it works
            </h2>
            <p style={{ color: "#666", fontSize: "17px", margin: 0 }}>Three steps. Done in under a week.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2px", position: "relative" }}>
            {[
              {
                num: "01",
                title: "You fill out our setup form",
                desc: "WiFi details, house rules, local spots you love, emergency contacts. 10 minutes of your time.",
                icon: "📋",
              },
              {
                num: "02",
                title: "We build your custom guide",
                desc: "A polished, mobile-first page with your property's brand and every detail guests need.",
                icon: "🛠",
              },
              {
                num: "03",
                title: "Print the QR plaque. Done.",
                desc: "Place it in your entryway. Every guest scans, enters email, gets instant WiFi + guide. You get their email — forever.",
                icon: "📱",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                style={{
                  background: "#fff",
                  padding: "36px 28px",
                  borderRadius: i === 0 ? "16px 0 0 16px" : i === 2 ? "0 16px 16px 0" : "0",
                  border: "1px solid #eee",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>{step.icon}</div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#C9A84C", letterSpacing: "0.15em", marginBottom: "8px" }}>
                  STEP {step.num}
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#1A3A4A", margin: "0 0 10px", lineHeight: 1.3 }}>{step.title}</h3>
                <p style={{ color: "#666", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE PREVIEW ── */}
      <section id="sample" style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#C9A84C", letterSpacing: "0.15em", marginBottom: "12px" }}>GUEST EXPERIENCE</div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, color: "#1A3A4A", margin: "0 0 20px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
              Your guests see a beautiful, fully custom guide
            </h2>
            <p style={{ color: "#555", fontSize: "16px", lineHeight: 1.7, margin: "0 0 24px" }}>
              No generic templates. No branding from a third-party app. A clean, fast-loading page that feels like it belongs to your property — because it does.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {["WiFi password revealed after email", "House rules & check-in walkthrough", "Local restaurant and activity picks", "Emergency contact always visible", "Book direct discount at checkout"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "#333" }}>
                  <span style={{ width: "20px", height: "20px", background: "#1A3A4A", color: "#C9A84C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/guestgrowth/sample"
              style={{ display: "inline-block", background: "#1A3A4A", color: "#fff", padding: "14px 28px", borderRadius: "8px", textDecoration: "none", fontSize: "15px", fontWeight: 700 }}
            >
              See Sample Guest Guide →
            </Link>
          </div>

          {/* Mock phone preview */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "260px", background: "#1A3A4A", borderRadius: "36px", padding: "12px", boxShadow: "0 32px 80px rgba(26,58,74,0.35)" }}>
              <div style={{ background: "#fff", borderRadius: "26px", overflow: "hidden", minHeight: "480px" }}>
                {/* Mock screen */}
                <div style={{ background: "#1A3A4A", padding: "20px 16px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", marginBottom: "4px" }}>WELCOME TO YOUR STAY</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>Oceanfront 4BR Tampa</div>
                  <div style={{ fontSize: "11px", color: "#C9A84C", letterSpacing: "0.1em" }}>WiFi &amp; House Guide</div>
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ background: "#F8FAFB", borderRadius: "8px", padding: "12px", marginBottom: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: "#999", letterSpacing: "0.1em", marginBottom: "4px" }}>📶 NETWORK</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A4A" }}>OceanView_5G</div>
                    <div style={{ fontSize: "9px", color: "#999", letterSpacing: "0.1em", marginTop: "8px", marginBottom: "4px" }}>🔐 PASSWORD</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#C9A84C" }}>SunsetGuest2025</div>
                  </div>
                  {["🏠 House Rules", "🕐 Check-in & Out", "🍽 Local Spots", "📞 Emergency"].map((item) => (
                    <div key={item} style={{ padding: "9px 10px", borderBottom: "1px solid #f0f0f0", fontSize: "11px", fontWeight: 600, color: "#333", display: "flex", justifyContent: "space-between" }}>
                      {item} <span style={{ color: "#C9A84C" }}>›</span>
                    </div>
                  ))}
                  <div style={{ background: "#1A3A4A", borderRadius: "6px", padding: "10px", textAlign: "center", marginTop: "10px" }}>
                    <div style={{ fontSize: "9px", color: "#C9A84C", fontWeight: 700, letterSpacing: "0.08em" }}>BOOK DIRECT — SAVE 15%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section style={{ background: "#1A3A4A", padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
              Stop paying every month for tools you don't own
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: 0 }}>
              See how GuestGrowth compares to subscription alternatives
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em" }}>FEATURE</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#C9A84C", fontSize: "13px", fontWeight: 800 }}>GuestGrowth</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700 }}>Guidebook Apps</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700 }}>WiFi Capture Tools</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.04)" : "transparent" }}>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ textAlign: "center", padding: "14px 16px" }}>
                      {typeof row.us === "boolean" ? (
                        <span style={{ fontSize: "18px" }}>{row.us ? "✅" : "❌"}</span>
                      ) : (
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#C9A84C" }}>{row.us}</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 16px" }}>
                      {typeof row.guidebook === "boolean" ? (
                        <span style={{ fontSize: "18px" }}>{row.guidebook ? "✅" : "❌"}</span>
                      ) : (
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{row.guidebook}</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 16px" }}>
                      {typeof row.wifiCapture === "boolean" ? (
                        <span style={{ fontSize: "18px" }}>{row.wifiCapture ? "✅" : "❌"}</span>
                      ) : (
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{row.wifiCapture}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "32px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "12px", padding: "20px 24px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", margin: 0 }}>
              💡 A host with 2 properties paying $30/mo for a guidebook app and $35/mo for WiFi capture pays <strong style={{ color: "#C9A84C" }}>$1,560/year</strong> — every year. GuestGrowth is $299 — once.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#1A3A4A", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            One-time pricing. No surprises.
          </h2>
          <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>
            Pay once. Own everything. Cancel nothing.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "start" }}>
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                background: tier.highlight ? "#1A3A4A" : "#fff",
                borderRadius: "20px",
                padding: "36px 28px",
                border: tier.highlight ? "none" : "1.5px solid #e5e5e5",
                position: "relative",
                boxShadow: tier.highlight ? "0 20px 60px rgba(26,58,74,0.25)" : "none",
                transform: tier.highlight ? "scale(1.02)" : "scale(1)",
              }}
            >
              {tier.tag && (
                <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#C9A84C", color: "#1A3A4A", fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", padding: "5px 14px", borderRadius: "100px", whiteSpace: "nowrap" as const }}>
                  {tier.tag.toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: "13px", fontWeight: 700, color: tier.highlight ? "#C9A84C" : "#999", letterSpacing: "0.08em", marginBottom: "8px" }}>
                {tier.name.toUpperCase()}
              </div>
              <div style={{ fontSize: "48px", fontWeight: 900, color: tier.highlight ? "#fff" : "#1A3A4A", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: "4px" }}>
                {tier.price}
              </div>
              <div style={{ fontSize: "14px", color: tier.highlight ? "rgba(255,255,255,0.5)" : "#aaa", marginBottom: "16px" }}>
                {tier.note}
              </div>
              <p style={{ fontSize: "14px", color: tier.highlight ? "rgba(255,255,255,0.7)" : "#666", lineHeight: 1.6, margin: "0 0 24px" }}>
                {tier.description}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: tier.highlight ? "rgba(255,255,255,0.85)" : "#333" }}>
                    <span style={{ color: "#C9A84C", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#get-started"
                onClick={() => setFormData((p) => ({ ...p, package: tier.id }))}
                style={{
                  display: "block",
                  textAlign: "center",
                  background: tier.highlight ? "#C9A84C" : "#1A3A4A",
                  color: tier.highlight ? "#1A3A4A" : "#fff",
                  padding: "14px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                {tier.cta} →
              </a>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "#999", fontSize: "13px", marginTop: "24px" }}>
          Have 3+ properties? <a href="#get-started" style={{ color: "#1A3A4A", fontWeight: 700 }}>Mention it in the form</a> for a bundle discount.
        </p>
      </section>

      {/* ── LEAD FORM ── */}
      <section id="get-started" style={{ background: "#F8FAFB", padding: "80px 24px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "#1A3A4A", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
              Get your QR Guest System
            </h2>
            <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>
              Fill this out and we'll reach out within 24 hours with next steps.
            </p>
          </div>

          {formStatus === "success" ? (
            <div style={{ background: "#e6f9f0", border: "1.5px solid #6ee7b7", borderRadius: "16px", padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1A3A4A", margin: "0 0 8px" }}>You're on the list!</h3>
              <p style={{ color: "#555", fontSize: "15px", margin: 0 }}>
                We'll reach out to <strong>{formData.email}</strong> within 24 hours to get your QR Guest System set up.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ background: "#fff", borderRadius: "20px", padding: "40px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.06)", border: "1px solid #eee" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <FormField label="Your name *">
                  <input name="name" required value={formData.name} onChange={handleFormChange} style={inputStyle} placeholder="Jane Smith" />
                </FormField>
                <FormField label="Email address *">
                  <input name="email" type="email" required value={formData.email} onChange={handleFormChange} style={inputStyle} placeholder="jane@email.com" />
                </FormField>
              </div>

              <FormField label="Number of properties" hint="Even if you only have 1 right now">
                <select name="numProperties" value={formData.numProperties} onChange={handleFormChange} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="1">1 property</option>
                  <option value="2-3">2–3 properties</option>
                  <option value="4-10">4–10 properties</option>
                  <option value="10+">10+ properties</option>
                </select>
              </FormField>

              <FormField label="Your Airbnb or VRBO listing URL" hint="Optional — helps us understand your property">
                <input name="listingUrl" value={formData.listingUrl} onChange={handleFormChange} style={inputStyle} placeholder="https://airbnb.com/rooms/..." />
              </FormField>

              <FormField label="Which package are you most interested in?">
                <select name="package" value={formData.package} onChange={handleFormChange} style={inputStyle}>
                  <option value="unsure">Not sure yet</option>
                  <option value="qr-guide">QR Guest Guide — $299</option>
                  <option value="email-automation">QR Guide + Email Automation — $399</option>
                  <option value="booking-site">Direct Booking Website — $999+</option>
                </select>
              </FormField>

              <FormField label="Anything else? (optional)">
                <textarea name="message" value={formData.message} onChange={handleFormChange} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" as const }} placeholder="Number of bedrooms, current setup, questions, etc." />
              </FormField>

              {formStatus === "error" && (
                <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#c53030", fontSize: "14px" }}>
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={formStatus === "sending"}
                style={{ width: "100%", background: formStatus === "sending" ? "#b0bec5" : "#1A3A4A", color: "#fff", border: "none", padding: "16px", borderRadius: "10px", fontSize: "17px", fontWeight: 800, cursor: formStatus === "sending" ? "not-allowed" : "pointer", marginTop: "8px" }}
              >
                {formStatus === "sending" ? "Sending…" : "Get My QR Guest System →"}
              </button>

              <p style={{ textAlign: "center", color: "#aaa", fontSize: "12px", marginTop: "12px" }}>
                No payment now. We'll reach out to confirm details and send an invoice.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 24px" }}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#1A3A4A", textAlign: "center", margin: "0 0 40px", letterSpacing: "-0.03em" }}>
          Questions
        </h2>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} style={{ borderBottom: "1px solid #eee" }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ width: "100%", background: "none", border: "none", textAlign: "left", padding: "20px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}
            >
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#1A3A4A", lineHeight: 1.4 }}>{item.q}</span>
              <span style={{ fontSize: "20px", color: "#C9A84C", flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
            </button>
            {openFaq === i && (
              <p style={{ color: "#555", fontSize: "15px", lineHeight: 1.7, margin: "0 0 20px", paddingRight: "32px" }}>
                {item.a}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: "linear-gradient(135deg, #0f2535 0%, #1A3A4A 100%)", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.03em" }}>
            Ready to own your guest relationships?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", marginBottom: "36px" }}>
            Set up once. Collect emails forever. Pay nothing monthly.
          </p>
          <a
            href="#get-started"
            style={{ display: "inline-block", background: "#C9A84C", color: "#1A3A4A", padding: "18px 40px", borderRadius: "8px", textDecoration: "none", fontSize: "18px", fontWeight: 800, letterSpacing: "-0.01em" }}
          >
            Get My QR Guest System →
          </a>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "16px" }}>
            No payment now · Reply within 24 hours · Multi-property discounts available
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "28px 24px", textAlign: "center", color: "#aaa", fontSize: "13px", borderTop: "1px solid #f0f0f0" }}>
        <p style={{ margin: 0 }}>
          GuestGrowth QR System &copy; {new Date().getFullYear()} &nbsp;·&nbsp;
          <Link to="/guestgrowth/sample" style={{ color: "#aaa" }}>Sample Guide</Link>
          &nbsp;·&nbsp;
          <a href="mailto:hello@seaandcityrentals.com" style={{ color: "#aaa" }}>Contact</a>
        </p>
      </footer>
    </div>
  );
}

// ── Shared small components ──────────────────────────────────────────────────

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px", gridColumn: "span 1" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#333", marginBottom: "6px" }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: "12px", color: "#aaa", margin: "0 0 5px" }}>{hint}</p>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #e5e5e5",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#fafafa",
};
