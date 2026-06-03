import { createFileRoute, notFound } from "@tanstack/react-router";
import QRCode from "react-qr-code";
import { SITE_URL, properties } from "@/data/properties";

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

function propertyTitle(slug: string) {
  const p = properties.find((x) => x.slug === slug);
  return p?.title ?? "Your Stay";
}

export const Route = createFileRoute("/plaque/$slug")({
  loader: ({ params }) => {
    if (!VALID_SLUGS.includes(params.slug)) throw notFound();
    return {
      slug: params.slug,
      title: propertyTitle(params.slug),
      wifiUrl: `${SITE_URL}/wifi/${params.slug}`,
    };
  },
  head: () => ({
    meta: [
      { title: "WiFi Plaque — Sea & City Rentals" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlaquePage,
});

function PlaquePage() {
  const { title, wifiUrl } = Route.useLoaderData();

  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "#e8e0d4",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "Georgia, serif",
    }}>
      {/* Print button — hidden when printing */}
      <div style={{ marginBottom: "24px" }} className="no-print">
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 24px",
            backgroundColor: "#1A3A4A",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          🖨️ Print Plaque
        </button>
        <p style={{ fontSize: "12px", color: "#888", textAlign: "center", margin: "8px 0 0", fontFamily: "system-ui, sans-serif" }}>
          Print at 4×6" or 5×7" — frame and display in your property.
        </p>
      </div>

      {/* PLAQUE */}
      <div id="plaque" style={{
        backgroundColor: "#1A3A4A",
        borderRadius: "16px",
        padding: "40px 36px",
        maxWidth: "380px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(201,168,76,0.25)",
      }}>
        {/* Top rule */}
        <div style={{ width: "40px", height: "2px", backgroundColor: "#C9A84C", margin: "0 auto 20px" }} />

        {/* Brand */}
        <p style={{
          fontSize: "10px",
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "#C9A84C",
          margin: "0 0 6px",
          fontFamily: "system-ui, sans-serif",
        }}>
          Sea &amp; City Rentals
        </p>

        {/* Property name */}
        <h1 style={{
          fontSize: "18px",
          color: "#ffffff",
          margin: "0 0 28px",
          fontWeight: 400,
          lineHeight: 1.3,
        }}>
          {title}
        </h1>

        {/* QR Code */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
          display: "inline-block",
          marginBottom: "24px",
        }}>
          <QRCode
            value={wifiUrl}
            size={180}
            style={{ display: "block" }}
            level="M"
            fgColor="#1A3A4A"
          />
        </div>

        {/* CTA text */}
        <p style={{
          fontSize: "13px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#C9A84C",
          margin: "0 0 6px",
          fontFamily: "system-ui, sans-serif",
        }}>
          Scan for
        </p>
        <p style={{
          fontSize: "22px",
          color: "#ffffff",
          margin: "0 0 20px",
          lineHeight: 1.2,
        }}>
          WiFi &amp; House Guide
        </p>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(201,168,76,0.3)", margin: "0 0 16px" }} />

        {/* URL fallback */}
        <p style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.45)",
          margin: "0",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.05em",
        }}>
          {wifiUrl}
        </p>

        {/* Bottom rule */}
        <div style={{ width: "40px", height: "2px", backgroundColor: "#C9A84C", margin: "20px auto 0" }} />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          #plaque {
            box-shadow: none !important;
            margin: 0 auto;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
