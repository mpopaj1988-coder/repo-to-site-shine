import { useState } from "react";
import { track } from "@/lib/analytics";

export function FooterEmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Add directly to MailerLite from the browser — bypasses Worker env var issues
      const mlKey = import.meta.env.VITE_MAILERLITE_API_KEY as string | undefined;
      if (mlKey) {
        await fetch("https://connect.mailerlite.com/api/subscribers", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${mlKey}` },
          body: JSON.stringify({ email: normalizedEmail, groups: ["187986355712689414"] }),
        });
      }

      // Best-effort server call for Supabase logging
      const params = new URLSearchParams(window.location.search);
      fetch("/api/public/discount-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          source: `footer:${window.location.pathname}`.slice(0, 100),
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
          user_agent: navigator.userAgent.slice(0, 250),
        }),
      }).catch(() => {});

      setStatus("success");
      setMessage("Thanks! Check your inbox for your 10% off code.");
      track("email_signup", { method: "footer" });
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
        Stay in the loop
      </h2>
      <p className="mt-5 text-sm text-white/75">
        Local tips, new listings & 10% off your first direct booking.
      </p>
      {status === "success" ? (
        <p className="mt-4 text-sm text-[var(--color-sea)]">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-2">
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[var(--color-sea)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-sm bg-[var(--color-gold)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)] transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "loading" ? "Sending..." : "Get 10% off"}
          </button>
          {status === "error" && (
            <p className="text-xs text-red-300">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}