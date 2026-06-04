import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/host/")({
  head: () => ({
    meta: [
      { title: "GuestConnect — WiFi Guest Guides for Short-Term Rentals" },
      {
        name: "description",
        content:
          "Turn every guest check-in into a lifelong email subscriber. QR code plaques give guests instant WiFi + house guide. You get their email — automatically.",
      },
    ],
  }),
  component: HostLandingPage,
});

function HostLandingPage() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", background: "#fff" }}>
      {/* NAV */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid #eee",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 100,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "20px", color: "#1A3A4A" }}>GuestConnect</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            to="/host/login"
            style={{ color: "#1A3A4A", textDecoration: "none", fontSize: "15px", fontWeight: 500 }}
          >
            Log in
          </Link>
          <Link
            to="/host/signup"
            style={{
              background: "#1A3A4A",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Start free trial
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "80px 32px 64px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#FFF8E8",
            color: "#C9A84C",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "6px 14px",
            borderRadius: "100px",
            marginBottom: "24px",
          }}
        >
          For Airbnb & VRBO Hosts
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 24px",
            color: "#1A3A4A",
          }}
        >
          Your WiFi password is your
          <br />
          <span style={{ color: "#C9A84C" }}>most valuable real estate</span>
        </h1>
        <p
          style={{
            fontSize: "20px",
            color: "#555",
            lineHeight: 1.6,
            maxWidth: "560px",
            margin: "0 auto 40px",
          }}
        >
          Guests leave without you ever getting their email. GuestConnect fixes that — one QR
          code plaque, instant WiFi + house guide, automatic email capture.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/host/signup"
            style={{
              background: "#1A3A4A",
              color: "#fff",
              padding: "16px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Start 14-day free trial →
          </Link>
          <a
            href="#how-it-works"
            style={{
              background: "transparent",
              color: "#1A3A4A",
              padding: "16px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 600,
              border: "1.5px solid #1A3A4A",
            }}
          >
            See how it works
          </a>
        </div>
        <p style={{ color: "#999", fontSize: "13px", marginTop: "16px" }}>
          No credit card required. Cancel anytime.
        </p>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <div
        style={{
          background: "#F8FAFB",
          padding: "16px 32px",
          textAlign: "center",
          borderTop: "1px solid #eee",
          borderBottom: "1px solid #eee",
        }}
      >
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
          ⭐⭐⭐⭐⭐&nbsp;&nbsp;"Built 200 email subscribers in our first season without any extra work."
          &nbsp;— <strong>Tampa Airbnb host</strong>
        </p>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 32px" }}>
        <h2
          style={{
            fontSize: "36px",
            fontWeight: 800,
            textAlign: "center",
            color: "#1A3A4A",
            marginBottom: "56px",
          }}
        >
          Three steps. Done in 10 minutes.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "32px",
          }}
        >
          {[
            {
              num: "1",
              title: "Set up your property",
              desc: "Enter your WiFi details, check-in/out times, parking, and house notes. Takes 5 minutes.",
            },
            {
              num: "2",
              title: "Print your QR plaque",
              desc: "Download your unique QR code and print it on a plaque. Place it in your entryway.",
            },
            {
              num: "3",
              title: "Guests scan. You win.",
              desc: "Guests get instant WiFi + house guide. Their email goes straight to your MailerLite list.",
            },
          ].map((step) => (
            <div
              key={step.num}
              style={{
                background: "#F8FAFB",
                borderRadius: "12px",
                padding: "32px 28px",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#1A3A4A",
                  color: "#C9A84C",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 800,
                  marginBottom: "16px",
                }}
              >
                {step.num}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1A3A4A", margin: "0 0 8px" }}>
                {step.title}
              </h3>
              <p style={{ color: "#555", lineHeight: 1.6, margin: 0, fontSize: "15px" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{
          background: "#1A3A4A",
          padding: "80px 32px",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: "56px",
              color: "#fff",
            }}
          >
            Everything a host needs
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              { icon: "📶", title: "Instant WiFi delivery", desc: "Guests get the password the moment they enter their email. Zero friction." },
              { icon: "📧", title: "Automatic email capture", desc: "Every guest becomes a subscriber. No manual work, no missed opportunities." },
              { icon: "🏠", title: "Full house guide", desc: "Check-in/out times, parking, trash, emergency contact, and custom notes." },
              { icon: "📱", title: "Works on any phone", desc: "iOS and Android. QR scan or NFC tap — your choice of plaque style." },
              { icon: "🔁", title: "Book direct follow-up", desc: "Automated email sequence nudges guests to rebook directly — saving them Airbnb fees." },
              { icon: "📊", title: "MailerLite integration", desc: "Subscribers sync automatically to your MailerLite audience, ready for campaigns." },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "28px", flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "#C9A84C" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 800, color: "#1A3A4A", marginBottom: "8px" }}>
          Simple pricing
        </h2>
        <p style={{ color: "#666", fontSize: "16px", marginBottom: "40px" }}>
          One plan. Everything included.
        </p>
        <div
          style={{
            border: "2px solid #1A3A4A",
            borderRadius: "16px",
            padding: "40px",
            background: "#fff",
            boxShadow: "0 4px 32px rgba(26,58,74,0.08)",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#C9A84C", letterSpacing: "0.1em", marginBottom: "8px" }}>
            HOST PLAN
          </div>
          <div style={{ fontSize: "56px", fontWeight: 800, color: "#1A3A4A", lineHeight: 1 }}>
            $12
          </div>
          <div style={{ color: "#666", fontSize: "16px", marginBottom: "32px" }}>per month</div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 32px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {[
              "Unlimited properties",
              "Unlimited guest scans",
              "QR code download",
              "MailerLite sync",
              "Book direct email sequence",
              "House guide with photos",
              "Cancel anytime",
            ].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "#333" }}>
                <span style={{ color: "#1A3A4A", fontWeight: 700, fontSize: "18px" }}>✓</span> {item}
              </li>
            ))}
          </ul>
          <Link
            to="/host/signup"
            style={{
              display: "block",
              background: "#1A3A4A",
              color: "#fff",
              padding: "16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Start 14-day free trial
          </Link>
          <p style={{ color: "#999", fontSize: "13px", marginTop: "12px" }}>No credit card required to start.</p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: "700px", margin: "0 auto", padding: "0 32px 80px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#1A3A4A", textAlign: "center", marginBottom: "40px" }}>
          Questions
        </h2>
        {[
          {
            q: "Do guests have to give their email?",
            a: "Yes — email is required to see the WiFi password. Guests also opt in to future marketing emails (with a checkbox). The WiFi delivery is always guaranteed.",
          },
          {
            q: "What if a guest doesn't have a smartphone?",
            a: "You can share your WiFi page URL directly (e.g. yoursite.com/wifi/your-property). Most guests have smartphones, but this is the fallback.",
          },
          {
            q: "Does this work with Airbnb?",
            a: "Yes. You place a physical QR plaque inside the property. Airbnb guests scan it when they arrive, before you even have to message them.",
          },
          {
            q: "What MailerLite plan do I need?",
            a: "Any MailerLite plan works, including their free tier (up to 1,000 subscribers). GuestConnect uses the MailerLite API to sync subscribers automatically.",
          },
          {
            q: "Can I have multiple properties?",
            a: "Yes — unlimited properties on one account. Each property gets its own WiFi guide page and QR code.",
          },
        ].map((faq) => (
          <div key={faq.q} style={{ borderBottom: "1px solid #eee", padding: "20px 0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1A3A4A", margin: "0 0 8px" }}>{faq.q}</h3>
            <p style={{ color: "#555", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
          </div>
        ))}
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          background: "#1A3A4A",
          padding: "80px 32px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2 style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 16px" }}>
          Ready to build your guest email list?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "18px", marginBottom: "32px" }}>
          Start your free 14-day trial. No credit card required.
        </p>
        <Link
          to="/host/signup"
          style={{
            background: "#C9A84C",
            color: "#1A3A4A",
            padding: "18px 40px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: 700,
            display: "inline-block",
          }}
        >
          Get started free →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px", textAlign: "center", color: "#999", fontSize: "13px", borderTop: "1px solid #eee" }}>
        <p style={{ margin: 0 }}>
          GuestConnect © {new Date().getFullYear()} &nbsp;·&nbsp;{" "}
          <Link to="/" style={{ color: "#999" }}>
            Powered by Sea &amp; City Rentals
          </Link>
        </p>
      </footer>
    </div>
  );
}
