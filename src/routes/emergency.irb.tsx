import { createFileRoute } from "@tanstack/react-router";
import { Phone, MapPin, AlertTriangle } from "lucide-react";
import { SITE_URL } from "@/data/properties";

export const Route = createFileRoute("/emergency/irb")({
  head: () => ({
    meta: [
      { title: "Emergency Information — Indian Rocks Beach | Sea & City Rentals" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/emergency/irb` }],
  }),
  component: EmergencyInfoIRB,
});

const contacts = [
  {
    category: "Emergency Services",
    color: "bg-red-600",
    entries: [
      {
        name: "Emergency",
        detail: "All emergencies — police, fire, medical",
        phone: "911",
        address: null,
      },
    ],
  },
  {
    category: "Police",
    color: "bg-[var(--color-deep)]",
    entries: [
      {
        name: "Pinellas County Sheriff",
        detail: "Non-emergency line",
        phone: "(727) 582-6200",
        address: null,
      },
    ],
  },
  {
    category: "Fire & Rescue",
    color: "bg-orange-600",
    entries: [
      {
        name: "Pinellas Suncoast Fire & Rescue District",
        detail: "Non-emergency",
        phone: "(727) 595-1117",
        address: null,
      },
    ],
  },
  {
    category: "Nearest Hospitals",
    color: "bg-[var(--color-sea)]",
    entries: [
      {
        name: "HCA Florida Largo Hospital",
        detail: "Full-service emergency room · ~4 miles",
        phone: "(727) 588-5200",
        address: "201 14th St SW, Largo, FL 33770",
      },
      {
        name: "Morton Plant Hospital",
        detail: "Full-service emergency room · ~8 miles",
        phone: "(727) 462-7000",
        address: "300 Pinellas St, Clearwater, FL 33756",
      },
    ],
  },
];

function EmergencyInfoIRB() {
  return (
    <div className="min-h-screen bg-[var(--color-sand)] print:bg-white">
      {/* Print button — hidden when printing */}
      <div className="flex justify-end px-6 pt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-[var(--color-deep)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="mx-auto max-w-2xl px-6 pb-16 pt-8 print:px-0 print:pt-4">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-[var(--color-deep)] px-8 py-8 text-white print:rounded-none print:mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 h-8 w-8 shrink-0 text-[var(--color-gold)]" />
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Emergency Information
              </h1>
              <p className="mt-2 text-base leading-relaxed text-white/80">
                We hope you never have to use these, but if you ever do, here are important numbers.
              </p>
            </div>
          </div>

          {/* Property address */}
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4">
            <MapPin className="h-5 w-5 shrink-0 text-[var(--color-gold)]" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/60">
                This property
              </p>
              <p className="mt-0.5 font-medium">2602 Bay Blvd, Indian Rocks Beach, FL 33785</p>
            </div>
          </div>
        </div>

        {/* Contact cards */}
        <div className="space-y-4">
          {contacts.map((section) => (
            <div key={section.category} className="overflow-hidden rounded-xl border border-border bg-white print:rounded-none print:border-b">
              <div className={`${section.color} px-5 py-2.5`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-white">
                  {section.category}
                </p>
              </div>
              <div className="divide-y divide-border">
                {section.entries.map((entry) => (
                  <div key={entry.name} className="px-5 py-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{entry.name}</p>
                        {entry.detail && (
                          <p className="text-sm text-muted-foreground">{entry.detail}</p>
                        )}
                        {entry.address && (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {entry.address}
                          </p>
                        )}
                      </div>
                      <a
                        href={`tel:${entry.phone.replace(/\D/g, "")}`}
                        className="mt-2 flex items-center gap-2 self-start rounded-lg bg-[var(--color-sand)] px-4 py-2 text-sm font-semibold text-[var(--color-deep)] hover:bg-[var(--color-gold)] hover:text-white sm:mt-0 print:bg-transparent print:p-0 print:font-bold print:text-foreground"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {entry.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-muted-foreground print:mt-6">
          Sea &amp; City Rentals — seaandcityrentals.com
        </p>
      </div>
    </div>
  );
}
