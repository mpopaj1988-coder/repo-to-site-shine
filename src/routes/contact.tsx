import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { BOOK_DIRECT_URL, PHONE, SITE_URL, properties } from "@/data/properties";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sea & City Rentals — Talk Directly with Your Host" },
      {
        name: "description",
        content:
          "Get in touch with Sea & City Rentals. Direct line to your host for custom requests, questions and booking inquiries across Tampa Bay, FL.",
      },
      { property: "og:title", content: "Contact — Sea & City Rentals" },
      { property: "og:description", content: "Talk directly to us — no platforms, no bots." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [property, setProperty] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, property: property || null, message }),
      });
      if (!res.ok) throw new Error("Server error");
      setStatus("success");
      track("inquiry_click", { surface: "contact_form", property: property || "unspecified" });
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again or call us directly.");
    }
  }

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
            No bots, no delays. Questions about dates, properties, group bookings or custom
            requests — just send us a message.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* CONTACT FORM */}
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground">
              Send us a message
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We respond within a few hours — usually faster.
            </p>

            {status === "success" ? (
              <div className="mt-8 rounded-md border border-border bg-card p-8">
                <p className="text-lg font-display text-foreground">Message received!</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thanks, {name}. We&apos;ll be in touch shortly. In the meantime, you can also
                  browse availability directly.
                </p>
                <a
                  href={BOOK_DIRECT_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("book_direct_click", { surface: "contact_form_success" })}
                  className="mt-5 inline-block rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)]"
                >
                  Browse properties →
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
                    >
                      Name <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--color-sea)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
                    >
                      Email <span className="text-[var(--color-gold)]">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--color-sea)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-property"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
                  >
                    Property of interest{" "}
                    <span className="font-normal normal-case tracking-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <select
                    id="contact-property"
                    value={property}
                    onChange={(e) => setProperty(e.target.value)}
                    className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground focus:border-[var(--color-sea)] focus:outline-none"
                  >
                    <option value="">Not sure yet / general question</option>
                    {properties.map((p) => (
                      <option key={p.slug} value={p.title}>
                        {p.title} — {p.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
                  >
                    Message <span className="text-[var(--color-gold)]">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your trip — dates, group size, any questions…"
                    className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--color-sea)] focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-sm bg-[var(--color-deep)] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-md transition hover:bg-[var(--color-deep)]/90 disabled:opacity-60"
                >
                  {status === "loading" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-5 lg:pt-14">
            <div className="rounded-md border border-border bg-card p-7">
              <h3 className="font-display text-xl">Book direct</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Skip the platform fees. Browse live availability and book straight with us.
              </p>
              <a
                href={BOOK_DIRECT_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("book_direct_click", { surface: "contact_book" })}
                data-testid="contact-book-direct"
                className="mt-5 inline-block rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)]"
              >
                Open booking →
              </a>
            </div>

            <div className="rounded-md border border-border bg-card p-7">
              <h3 className="font-display text-xl">Call us</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Prefer to talk? Call or text — we usually pick up or reply within minutes.
              </p>
              <a
                href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
                onClick={() => track("phone_click", { surface: "contact_page", property: "all" })}
                className="mt-4 block font-display text-2xl text-[var(--color-deep)] hover:underline"
              >
                {PHONE}
              </a>
            </div>

            <div className="rounded-md border border-[var(--color-gold)]/30 bg-[var(--color-sand)] p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-sea)]">
                Quick tip
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Returning guests get <strong className="text-foreground">10% off</strong> their next
                stay — just mention your previous booking when you reach out.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
