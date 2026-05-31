import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<
    "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error"
  >("loading");
  const [mailchimpSynced, setMailchimpSynced] = useState<boolean | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (!t) {
      setState("invalid");
      return;
    }
    setToken(t);
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setState("valid");
        else if (d.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, []);

  async function confirm() {
    if (!token) return;
    setState("submitting");
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (d.success) {
        setMailchimpSynced(d.mailchimpSynced ?? null);
        setState("done");
      } else {
        setState(d.reason === "already_unsubscribed" ? "already" : "error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold)]">
          Sea & City Rentals
        </p>
        <h1 className="mt-3 font-display text-3xl text-[var(--color-deep)]">Email preferences</h1>
        <div className="mt-8 rounded-md border border-border bg-card p-8">
          {state === "loading" && (
            <p className="text-sm text-muted-foreground">Checking your link…</p>
          )}
          {state === "invalid" && (
            <p className="text-sm">This unsubscribe link is invalid or has expired.</p>
          )}
          {state === "already" && (
            <p className="text-sm">You're already unsubscribed. We won't email you again.</p>
          )}
          {state === "error" && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          )}
          {state === "valid" && (
            <>
              <p className="text-sm mb-6">
                Click below to confirm you'd like to stop receiving emails from us.
              </p>
              <button
                onClick={confirm}
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-deep)] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                Confirm Unsubscribe
              </button>
            </>
          )}
          {state === "submitting" && <p className="text-sm text-muted-foreground">Processing…</p>}
          {state === "done" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-deep)]/10">
                <svg
                  className="h-6 w-6 text-[var(--color-deep)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-xl text-[var(--color-deep)]">You're unsubscribed</h2>
              <p className="text-sm text-muted-foreground">
                We've removed you from our email list. You won't receive any more messages from Sea
                & City Rentals.
              </p>
              {mailchimpSynced === false && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 text-left">
                  Note: We couldn't sync your opt-out with our newsletter provider right now, but
                  your address is suppressed on our end and won't be emailed. Our team will
                  reconcile this automatically — no action needed from you.
                </p>
              )}
              <a
                href="/"
                className="inline-block text-sm text-[var(--color-deep)] underline underline-offset-4"
              >
                Return to homepage
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
