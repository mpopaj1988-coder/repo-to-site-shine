import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { PHONE, CONTACT_EMAIL, SITE_URL } from "@/data/properties";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sea & City Rentals — Talk Directly with Your Host" },
      { name: "description", content: "Get in touch with Sea & City Rentals. Direct line to your host for custom requests, special occasions and extended stays in Florida." },
      { property: "og:title", content: "Contact — Sea & City Rentals" },
      { property: "og:description", content: "Talk directly to us — no platforms, no bots." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: ContactPage,
});

function ReturningGuestForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/public/returning-guest-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        track("returning_guest_code_requested", {});
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-4 text-sm font-medium text-emerald-700">
        Sent! Check your inbox for your RETURN10 code.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-deep)]"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-sm bg-[var(--color-gold)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] transition hover:brightness-105 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send me my code"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-600">Something went wrong — please try again.</p>
      )}
    </form>
  );
}

function ContactPage() {
  return (
    <Layout>
      <section className="bg-[var(--color-deep)] pb-16 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">Get in Touch</p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">Talk to a real person</h1>
          <p className="mt-4 max-w-xl text-white/75">No bots, no delays. Reach out for custom requests, special occasions, extended stays — or just to ask which property is right for your trip.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Have a question?</h2>
            <p className="mt-3 text-sm text-muted-foreground">Reach us by phone or email — usually back within the hour.</p>
            <a
              href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
              onClick={() => track("phone_click", { surface: "contact_page" })}
              className="mt-6 inline-block rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)]"
            >
              Call / Text {PHONE}
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-block rounded-sm border border-[var(--color-deep)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)] hover:bg-[var(--color-deep)] hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="rounded-md border border-border bg-card p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-sea)]">Returning guest?</p>
            <h2 className="mt-2 font-display text-2xl">Get your 10% off code</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Enter your email and we'll send <span className="font-semibold text-foreground">RETURN10</span> straight to your inbox — applies at checkout.
            </p>
            <ReturningGuestForm />
          </div>
        </div>
      </section>
    </Layout>
  );
}
