import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { properties, BOOK_DIRECT_URL, PHONE, SITE_URL } from "@/data/properties";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sea & City Rentals — Talk Directly with Your Host" },
      {
        name: "description",
        content:
          "Get in touch with Sea & City Rentals. Direct line to your host for custom requests, special occasions and extended stays in Florida.",
      },
      { property: "og:title", content: "Contact — Sea & City Rentals" },
      { property: "og:description", content: "Talk directly to us — no platforms, no bots." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <Layout>
      <section className="bg-[var(--color-deep)] pb-16 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
            Get in Touch
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
            Talk to a real person
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            No bots, no delays. Ask us anything — which property fits your group, custom requests,
            special occasions, or extended stays. We usually reply within the hour.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          {/* INQUIRY FORM */}
          <div>
            <h2 className="font-display text-3xl font-medium text-foreground">Send us a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill out the form and we'll get back to you directly — no middleman.
            </p>
            <div className="mt-8">
              <InquiryForm />
            </div>
          </div>

          {/* QUICK CONTACT */}
          <aside className="space-y-6">
            <div className="rounded-md border border-border bg-card p-6">
              <h3 className="font-display text-xl">Ready to book?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Skip the form — go straight to availability and checkout.
              </p>
              <a
                href={BOOK_DIRECT_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("book_direct_click", { surface: "contact_book" })}
                data-testid="contact-book-direct"
                className="mt-5 inline-block rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] transition hover:brightness-105"
              >
                Book direct →
              </a>
            </div>

            <div className="rounded-md border border-border bg-card p-6">
              <h3 className="font-display text-xl">Call or text us</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Fastest response — we're usually available 9 am–9 pm ET.
              </p>
              <a
                href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
                onClick={() => track("phone_click", { surface: "contact_sidebar", property: "all" })}
                className="mt-5 inline-block text-sm font-semibold text-[var(--color-deep)] underline-offset-4 hover:underline"
              >
                {PHONE}
              </a>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}

const PROPERTY_OPTIONS = [
  "Not sure yet — help me choose",
  ...properties.map((p) => `${p.title} (${p.location})`),
];

type Status = "idle" | "loading" | "success" | "error";

function InquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyInterest, setPropertyInterest] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/public/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          property_interest: propertyInterest || null,
          check_in: checkIn || null,
          check_out: checkOut || null,
          message: message.trim(),
          source: `contact:${window.location.pathname}`.slice(0, 100),
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      });

      if (!res.ok) throw new Error("Server error");
      track("inquiry_click", { surface: "contact_form", property: propertyInterest || "unknown" });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong — please try again or call us directly.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <p className="font-display text-2xl text-[var(--color-deep)]">Message received!</p>
        <p className="mt-3 text-sm text-muted-foreground">
          We'll get back to you at <strong>{email}</strong> — usually within the hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="inq-name">Name *</label>
          <input
            id="inq-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="inq-email">Email *</label>
          <input
            id="inq-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="inq-phone">Phone (optional)</label>
          <input
            id="inq-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-123-4567"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="inq-property">Property interest</label>
          <select
            id="inq-property"
            value={propertyInterest}
            onChange={(e) => setPropertyInterest(e.target.value)}
            className={inputClass}
          >
            <option value="">— Select a property —</option>
            {PROPERTY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="inq-checkin">Check-in date</label>
          <input
            id="inq-checkin"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="inq-checkout">Check-out date</label>
          <input
            id="inq-checkout"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="inq-message">Message *</label>
        <textarea
          id="inq-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your trip — group size, occasion, any questions..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-sm bg-[var(--color-deep)] px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[var(--color-deep)]/90 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </button>

      <p className="text-xs text-muted-foreground">
        Or call / text us directly at{" "}
        <a
          href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
          className="font-medium text-[var(--color-deep)] underline-offset-4 hover:underline"
        >
          {PHONE}
        </a>
        {" "}— we read every message.
      </p>
    </form>
  );
}

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground";
const inputClass =
  "w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--color-sea)] focus:outline-none";
