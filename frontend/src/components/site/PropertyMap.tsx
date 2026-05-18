import { useEffect, useState } from "react";
import { properties, type Property } from "@/data/properties";
import type { Pricing } from "@/lib/hospitable.functions";
import { track } from "@/lib/analytics";

// Properties with coordinates only
const geoProperties = properties.filter(
  (p): p is Property & { lat: number; lng: number } =>
    typeof p.lat === "number" && typeof p.lng === "number",
);

// Center on Tampa Bay (mean of all property coords)
const center: [number, number] =
  geoProperties.length > 0
    ? [
        geoProperties.reduce((s, p) => s + p.lat, 0) / geoProperties.length,
        geoProperties.reduce((s, p) => s + p.lng, 0) / geoProperties.length,
      ]
    : [27.95, -82.5];

export function PropertyMap({ pricingMap }: { pricingMap?: Record<string, Pricing> }) {
  const [mounted, setMounted] = useState(false);
  const [LeafletStack, setLeafletStack] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    // Dynamically import leaflet + react-leaflet only on client to avoid SSR issues
    (async () => {
      const L = await import("leaflet");
      const RL = await import("react-leaflet");
      await import("leaflet/dist/leaflet.css");

      // Custom gold pin icon (avoids the missing default marker images in vite bundlers)
      const goldIcon = L.divIcon({
        className: "scr-pin",
        html: `
          <div style="
            width: 30px; height: 38px; position: relative;
            transform: translate(-50%, -100%);
          ">
            <svg viewBox="0 0 32 40" width="30" height="38" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0 C7.16 0 0 7.16 0 16 C0 28 16 40 16 40 S32 28 32 16 C32 7.16 24.84 0 16 0 Z"
                fill="#C8A24B" stroke="#152238" stroke-width="2"/>
              <circle cx="16" cy="15" r="5" fill="#152238"/>
            </svg>
          </div>
        `,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
        popupAnchor: [0, -34],
      });

      if (!cancelled) setLeafletStack({ ...RL, goldIcon, L });
    })();
    setMounted(true);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted || !LeafletStack) {
    return (
      <div
        data-testid="property-map-loading"
        className="flex h-[560px] w-full items-center justify-center rounded-md border border-border bg-[var(--color-sand)] text-sm text-muted-foreground"
      >
        Loading map…
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, goldIcon } = LeafletStack;

  return (
    <div
      data-testid="property-map"
      className="overflow-hidden rounded-md border border-border shadow-sm"
    >
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={false}
        style={{ height: "560px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {geoProperties.map((p) => {
          const price = pricingMap?.[p.slug];
          return (
            <Marker key={p.slug} position={[p.lat, p.lng]} icon={goldIcon}>
              <Popup className="scr-popup">
                <a
                  href={`/listings/${p.slug}`}
                  className="block w-[220px] no-underline"
                  data-testid={`map-popup-${p.slug}`}
                  onClick={() => track("map_pin_click", { property: p.slug, location: p.location })}
                >
                  <img
                    src={p.image}
                    alt={p.imageAlts?.[0] ?? p.alt}
                    className="h-[120px] w-full rounded-sm object-cover"
                    loading="lazy"
                  />
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-sea)]">
                    📍 {p.location}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[var(--color-deep)]">
                    {p.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {p.bedrooms} BR · {p.bathrooms} BA · Sleeps {p.sleeps}
                    </span>
                    {price && (
                      <span className="font-semibold text-[var(--color-deep)]">
                        ${price.min}/nt
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
                    View listing →
                  </p>
                </a>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
