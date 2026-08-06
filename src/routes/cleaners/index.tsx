import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  getCleanerSession,
  listOpenJobs,
  listMyJobs,
  claimJob,
  completeJob,
  savePushSubscription,
  cleanerLogout,
} from "@/lib/cleaner-portal.functions";

export const Route = createFileRoute("/cleaners/")({
  head: () => ({ meta: [{ title: "Cleaning Jobs — Sea & City Rentals" }] }),
  loader: async () => {
    const session = await getCleanerSession();
    return { session };
  },
  component: CleanerJobBoard,
});

type Job = {
  id: string;
  property_name: string;
  checkout_date: string;
  payout_amount: number;
  status: string;
};

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function CleanerJobBoard() {
  const { session } = Route.useLoaderData();
  const navigate = useNavigate();
  const [openJobs, setOpenJobs] = React.useState<Job[]>([]);
  const [myJobs, setMyJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pushState, setPushState] = React.useState<"idle" | "enabling" | "on" | "unsupported">(
    "idle",
  );
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!session) {
      navigate({ to: "/cleaners/login" });
      return;
    }
    refresh();
    if (
      typeof window !== "undefined" &&
      (!("serviceWorker" in navigator) || !("PushManager" in window))
    ) {
      setPushState("unsupported");
    }
  }, [session]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [open, mine] = await Promise.all([listOpenJobs(), listMyJobs()]);
      setOpenJobs(open as Job[]);
      setMyJobs(mine as Job[]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    setMessage("");
    const result = await claimJob({ data: { jobId } });
    if (!result.ok) {
      setMessage(result.error);
    }
    refresh();
  };

  const handleComplete = async (jobId: string) => {
    await completeJob({ data: { jobId } });
    refresh();
  };

  const handleLogout = async () => {
    await cleanerLogout();
    navigate({ to: "/cleaners/login" });
  };

  const enablePush = async () => {
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!publicKey) {
      setMessage("Push isn't set up yet — ask the owner to finish setup.");
      return;
    }
    setPushState("enabling");
    try {
      const registration = await navigator.serviceWorker.register("/cleaner-sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("idle");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });
      const json = subscription.toJSON();
      await savePushSubscription({
        data: {
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
      });
      setPushState("on");
    } catch {
      setPushState("idle");
      setMessage("Couldn't enable notifications. Try again.");
    }
  };

  if (!session) return null;

  return (
    <div style={pageStyle}>
      <nav style={navStyle}>
        <span style={{ fontWeight: 800, color: "#1A3A4A" }}>{session.name}</span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {session.isAdmin && (
            <Link to="/cleaners/admin" style={ghostBtnStyle}>
              Admin
            </Link>
          )}
          <button onClick={handleLogout} style={ghostBtnStyle}>
            Log out
          </button>
        </div>
      </nav>

      <main style={mainStyle}>
        {pushState !== "on" && pushState !== "unsupported" && (
          <button
            onClick={enablePush}
            disabled={pushState === "enabling"}
            style={{ ...primaryBtnStyle, width: "100%", marginBottom: "20px" }}
          >
            {pushState === "enabling" ? "Enabling…" : "🔔 Get notified about new jobs"}
          </button>
        )}
        {message && <p style={{ ...errorBoxStyle }}>{message}</p>}

        <h2 style={sectionHeading}>Open Jobs</h2>
        {loading ? (
          <p style={{ color: "#666" }}>Loading…</p>
        ) : openJobs.length === 0 ? (
          <p style={{ color: "#666" }}>No open jobs right now.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {openJobs.map((job) => (
              <div key={job.id} style={jobCardStyle}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1A3A4A" }}>{job.property_name}</div>
                  <div style={{ color: "#666", fontSize: "14px" }}>
                    Checkout {job.checkout_date}
                  </div>
                  {job.payout_amount > 0 && (
                    <div style={{ color: "#1a7f4b", fontSize: "14px", fontWeight: 700 }}>
                      ${job.payout_amount}
                    </div>
                  )}
                </div>
                <button onClick={() => handleAccept(job.id)} style={primaryBtnStyle}>
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ ...sectionHeading, marginTop: "32px" }}>My Jobs</h2>
        {myJobs.length === 0 ? (
          <p style={{ color: "#666" }}>You haven't accepted any jobs yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {myJobs.map((job) => (
              <div key={job.id} style={jobCardStyle}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1A3A4A" }}>{job.property_name}</div>
                  <div style={{ color: "#666", fontSize: "14px" }}>
                    Checkout {job.checkout_date}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: statusColor(job.status),
                      marginTop: "4px",
                    }}
                  >
                    {job.status.toUpperCase()}
                  </div>
                </div>
                {job.status === "claimed" && (
                  <button onClick={() => handleComplete(job.id)} style={secondaryBtnStyle}>
                    Mark Done
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function statusColor(status: string): string {
  if (status === "completed") return "#1a7f4b";
  if (status === "claimed") return "#a06020";
  return "#999";
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F8FAFB",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  background: "#fff",
  borderBottom: "1px solid #eee",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const mainStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "24px 16px 60px",
};

const sectionHeading: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#1A3A4A",
  margin: "0 0 12px",
};

const jobCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "16px 18px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid #eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "#1A3A4A",
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #1A3A4A",
  color: "#1A3A4A",
  padding: "10px 16px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const ghostBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1.5px solid #ddd",
  color: "#555",
  padding: "8px 14px",
  borderRadius: "6px",
  fontSize: "13px",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "none",
};

const errorBoxStyle: React.CSSProperties = {
  color: "#a06020",
  fontSize: "13px",
  marginBottom: "16px",
  background: "#fff8e8",
  padding: "10px 14px",
  borderRadius: "6px",
  border: "1px solid #f0d890",
};
