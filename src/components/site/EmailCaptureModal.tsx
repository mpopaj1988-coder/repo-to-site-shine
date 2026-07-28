import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "scr_email_capture_v1";

export function EmailCaptureModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 12000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Primary path: our own backend actually sends the discount email
      // (via Lovable/Resend) and logs the lead. This is awaited and its
      // result gates the success message — this is the call that matters.
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/public/discount-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          source: window.location.pathname.slice(0, 100),
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
          user_agent: navigator.userAgent.slice(0, 250),
        }),
      });
      if (!res.ok) throw new Error("signup failed");
      const resBody = await res.json().catch(() => ({}) as { alreadyClaimed?: boolean });

      // Best-effort: also add to the MailerLite marketing list. Not awaited —
      // this is a secondary marketing sync, not the source of the actual email.
      const formData = new FormData();
      formData.append("fields[email]", normalizedEmail);
      fetch(
        "https://assets.mailerlite.com/jsonp/2353166/forms/188851104776193043/subscribe",
        { method: "POST", body: formData },
      ).catch(() => {});

      setStatus("success");
      setMessage(
        resBody.alreadyClaimed
          ? "Looks like you've already claimed your discount — check your inbox for the code from before."
          : "Thanks! Check your inbox — we just sent your mystery discount code for your first direct booking.",
      );
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        track("email_signup", { method: "modal" });
      } catch {}
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-capture-title"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-md bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          ×
        </button>
        <div className="bg-[var(--color-deep)] px-7 py-6 text-white">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
            Direct Booking Perk
          </p>
          <h2 id="email-capture-title" className="mt-2 font-display text-3xl leading-tight">
            Unlock your mystery discount
          </h2>
          <p className="mt-2 text-sm text-white/75">
            Join our list and we'll email you a mystery discount code good on any direct booking — no Airbnb fees, no markup.
          </p>
        </div>
        <div className="px-7 py-6">
          {status === "success" ? (
            <p className="text-sm text-foreground">{message}</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--color-sea)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-md bg-[var(--color-deep)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-deep)]/90 disabled:opacity-60"
              >
                {status === "loading" ? "Sending..." : "Get my mystery discount"}
              </button>
              {message && status === "error" && (
                <p className="text-xs text-red-600">{message}</p>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                No thanks
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}