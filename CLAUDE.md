# Sea & City Rentals — Codebase Guide

## Project Overview

**Sea & City Rentals** is a vacation rental website for 9 properties across the Tampa Bay area (Tampa, St. Petersburg, Clearwater, Largo, Indian Rocks Beach). It is a full-stack SSR React app deployed to **Cloudflare Workers**, built on **TanStack Start** with file-based routing.

The site enables direct bookings (bypassing Airbnb fees), displays live pricing/availability from the Hospitable PMS API, captures email leads, and publishes a travel blog targeting Tampa Bay visitors. It also runs automated revenue-optimization campaigns (orphan-day upsells, rebooking outreach) via Hospitable messaging + Supabase pg_cron.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start (React SSR, file-based routing) |
| Build | Vite + `@lovable.dev/vite-tanstack-config` |
| Routing | TanStack Router (auto-generated `routeTree.gen.ts`) |
| Server state | TanStack Query |
| UI components | shadcn/ui (New York style) + Radix UI |
| Styling | Tailwind CSS v4 + `tw-animate-css` |
| Database | Supabase (PostgreSQL + pgmq + pg_cron) |
| Deployment | Cloudflare Workers (`wrangler.jsonc`) |
| Email infra | `@lovable.dev/email-js` + React Email + Supabase pgmq queues |
| Analytics | Google Analytics 4 (`G-Y94QM048EZ`) |
| PMS integration | Hospitable Public API |

---

## Repository Structure

```
src/
├── assets/                   # Images — hero shots and per-property galleries
│   ├── properties/<slug>/    # Gallery photos (jpg/jpeg/png) for each property
│   └── *.jpg                 # Shared hero / guide images
├── components/
│   ├── site/                 # App-specific components (see list below)
│   └── ui/                   # shadcn/ui primitives — DO NOT edit directly
├── content/
│   └── blog/                 # Markdown blog posts (week1–week30, frontmatter + body)
├── data/
│   ├── properties.ts         # Source of truth for all 9 properties + global constants
│   ├── guides.ts             # Neighborhood guide data (Tampa, St. Pete, Clearwater)
│   └── galleryAlts.ts        # Alt-text manifest for property gallery images
├── hooks/
│   └── use-mobile.tsx        # Breakpoint hook
├── integrations/
│   └── supabase/             # Auto-generated Supabase files — DO NOT edit directly
│       ├── client.ts         # Browser client (uses VITE_ env vars)
│       ├── client.server.ts  # Server-only admin client (service role key)
│       ├── auth-attacher.ts  # Client middleware: attaches Supabase JWT to serverFn calls
│       ├── auth-middleware.ts # Server middleware: validates Supabase JWT
│       └── types.ts          # Generated DB types
├── lib/
│   ├── analytics.ts              # GA4 `track()` helper
│   ├── blog.ts                   # Blog parsing (frontmatter + marked)
│   ├── email-templates/          # React Email templates + registry
│   ├── error-capture.ts          # SSR error capture for Cloudflare Worker
│   ├── error-page.ts             # Fallback HTML error page renderer
│   ├── hospitable.functions.ts   # Server functions: pricing, reviews, availability
│   ├── orphan-upsell.server.ts   # Orphan-day upsell core logic
│   ├── orphan-reply-handler.server.ts  # YES-reply detection + alteration automation
│   ├── rebooking-campaign.server.ts    # Past-guest rebooking outreach logic
│   ├── reviews.functions.ts      # Supabase-backed reviews (cached)
│   └── utils.ts                  # `cn()` Tailwind class merge helper
├── routes/                   # File-based routes (TanStack Router)
├── router.tsx                # Router + QueryClient factory
├── server.ts                 # Cloudflare Worker fetch handler (entry)
├── start.ts                  # TanStack Start instance + error middleware
├── routeTree.gen.ts          # Auto-generated — never edit by hand
└── styles.css                # Global styles, Tailwind v4 theme, brand tokens

supabase/
└── migrations/               # SQL migration files (run in order)
    ├── 20260508035937_*.sql           # Initial schema
    ├── 20260508035954_*.sql
    ├── 20260508040530_*.sql
    ├── 20260508041139_email_infra.sql
    ├── 20260521000000_email_leads_discount_code.sql
    ├── 20260530000001_orphan_upsell_log.sql
    ├── 20260530000002_orphan_upsell_reply_tracking.sql
    └── 20260530000003_rebooking_campaign_log.sql

.github/workflows/
├── weekly-site-health.yml    # HTTP 200 checks every Monday 9 AM UTC; opens GitHub issue on failure
└── weekly-site-monitoring.yml # Claude Code audit every Monday 8 AM UTC; auto-commits fixes
```

### Site Components (`src/components/site/`)

| Component | Purpose |
|---|---|
| `AvailabilityChecker` | Date-picker + pricing widget on listing pages |
| `EmailCaptureModal` | Pop-up email lead capture with discount offer |
| `Footer` / `FooterEmailSignup` | Site footer with inline email signup |
| `Header` | Navigation bar |
| `Layout` | Root layout wrapper |
| `PropertyCard` | Card used in property grid and search |
| `PropertyGallery` | Lightbox gallery for listing pages |
| `PropertyMap` | Interactive Leaflet map with pins |
| `RealReviews` | Review display component (pulls from Supabase cache) |

---

## Routes Reference

| Route | Description |
|---|---|
| `/` | Homepage — hero slider, property grid, reviews, about, blog preview |
| `/properties` | Full property listing with category filters |
| `/listings/$slug` | Property detail page (pricing, availability, reviews, gallery) |
| `/blog` | Blog index |
| `/blog/$slug` | Individual blog post |
| `/explore` | Neighborhood guide index (links to all three guides) |
| `/explore/$slug` | Neighborhood guides (`tampa`, `st-petersburg`, `clearwater-beach`) |
| `/map` | Interactive Leaflet map with property pins |
| `/about` | About page |
| `/contact` | Contact form |
| `/reviews` | Reviews page |
| `/unsubscribe` | Email unsubscribe (token-based) |
| `/api/public/discount-signup` | POST — email capture, sends welcome discount email |
| `/api/public/refresh-reviews` | GET/POST — refreshes Hospitable reviews into Supabase |
| `/api/public/orphan-day-upsell` | GET/POST — scans orphan days, messages adjacent guests |
| `/api/public/process-upsell-replies` | GET/POST — handles YES replies from orphan day upsells |
| `/api/public/rebooking-campaign` | GET/POST — messages past guests about open stretches |
| `/sitemap.xml` | Auto-generated sitemap |
| `/robots.txt` | robots.txt |
| `/blog.rss.xml` | Blog RSS feed |
| `/lovable/email/queue/process` | Email queue processor (called by cron) |
| `/lovable/email/suppression` | Bounce/complaint webhook handler |
| `/lovable/email/transactional/send` | Internal transactional send endpoint |
| `/lovable/email/transactional/preview` | Template preview |
| `/email/unsubscribe` | API-level unsubscribe handler |

All three campaign endpoints accept `?dry_run=true` for a safe read-only preview.

---

## Development Commands

```bash
npm run dev          # Start dev server (localhost, hot reload)
npm run start        # Dev server bound to 0.0.0.0:3000 (cloud / container)
npm run build        # Production build
npm run build:dev    # Dev-mode build
npm run preview      # Preview production build locally
npm run lint         # ESLint
npm run format       # Prettier (write)
```

**Never edit `src/routeTree.gen.ts`** — it is auto-generated by the TanStack Router plugin during `vite dev` or `vite build`.

---

## Environment Variables

### Required

| Variable | Where used |
|---|---|
| `VITE_SUPABASE_URL` | Browser Supabase client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser Supabase client |
| `SUPABASE_URL` | Server-side Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin client (bypasses RLS) |
| `HOSPITABLE_API_KEY` | Hospitable API (pricing, reviews, availability, messaging) |

### Optional

| Variable | Where used |
|---|---|
| `MAILCHIMP_API_KEY` | Sync email leads to Mailchimp audience |
| `MAILCHIMP_AUDIENCE_ID` | Mailchimp audience ID |

Variables prefixed `VITE_` are injected at build time by Vite and available in the browser. Non-`VITE_` variables are server-only (`process.env`).

---

## Key Conventions

### TypeScript
- Strict mode enabled; target ES2022
- Path alias `@/` resolves to `src/`
- `moduleResolution: "Bundler"` — use full paths with extensions only when necessary
- Server-only modules use `*.server.ts` naming (do not import `server-only` — it is a Next.js package)

### Code Style (Prettier)
- Print width: 100 characters
- Semicolons: yes
- Quotes: double
- Trailing commas: all

### Routing (TanStack Router)
- Routes are files in `src/routes/`; the plugin auto-generates `routeTree.gen.ts`
- Use `createFileRoute("/path")` at the top of each route file
- Data loading goes in `loader` functions, not inside React components
- SEO meta tags go in `head()` on the route definition
- Special file names: `[.]` → literal `.` (e.g. `sitemap[.]xml.tsx`)

### Server Functions
Server functions use `createServerFn` from `@tanstack/react-start`. They run server-side only. Pattern:
```ts
export const myFn = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => { ... });
```

### API Route Handlers
Raw HTTP endpoints (no React, no SSR) use `server.handlers` on the route definition:
```ts
export const Route = createFileRoute("/api/public/my-endpoint")({
  server: {
    handlers: {
      GET: async ({ request }) => Response.json({ ok: true }),
      POST: async ({ request }) => Response.json({ ok: true }),
    },
  },
});
```

### Supabase Clients
- **Browser / isomorphic**: `import { supabase } from "@/integrations/supabase/client"`
- **Server admin (bypasses RLS)**: `import { supabaseAdmin } from "@/integrations/supabase/client.server"` — server files only, never expose to client
- All four files in `src/integrations/supabase/` are auto-generated; do not edit them

### Styling
- Tailwind CSS v4 with CSS custom properties defined in `src/styles.css`
- Brand tokens (use these Tailwind class names in markup):
  - `bg-deep` / `text-deep` → `#1A3A4A` navy — primary brand color
  - `bg-gold` / `text-gold` → `#C9A84C` gold accent
  - `bg-sand` / `text-sand` → `#F5EFE4` warm off-white background
  - `bg-sea` / `text-sea` → `#3D8B8B` teal/sea blue
- `font-display` class → Cormorant Garamond (serif, headings)
- Default sans → Jost
- shadcn/ui semantic colors (`--primary`, `--accent`, etc.) use oklch format in `:root` / `.dark` blocks; the four brand tokens above use hex
- shadcn/ui components live in `src/components/ui/` — install new ones with `npx shadcn@latest add <component>`, never edit generated files manually

### Analytics
Use `track()` from `@/lib/analytics` for GA4 events — always use this helper, never call `window.gtag` directly:
```ts
import { track } from "@/lib/analytics";
track("book_direct_click", { surface: "header", property: "tampa" });
```

**Tracked events (complete list):**

| Event | Where | Key params |
|---|---|---|
| `property_card_click` | `PropertyCard` | `property`, `location` |
| `listing_view` | `listings.$slug` (mount) | `property`, `location` |
| `availability_opened` | `AvailabilityChecker` | `property` |
| `reserve_click` | `AvailabilityChecker` | `property`, `nights`, `total`, `check_in`, `check_out` |
| `book_direct_click` | Header, Footer, Home, Listing, Properties, About, Contact, Guides | `surface` |
| `email_signup` | `EmailCaptureModal`, `FooterEmailSignup` | `method` (`modal`\|`footer`) |
| `inquiry_click` | Listing (multiple CTAs), Contact | `surface`, `property` |
| `phone_click` | Listing sticky bar + mobile bar | `surface`, `property` |
| `map_pin_click` | `PropertyMap` | `property`, `location` |
| `home_blog_click` | Homepage blog preview | `post` |
| `guide_click` | Listing page | `surface`, `guide` |
| `nearby_property_click` | Explore guide pages | `surface`, `property` |
| `top_stay_click` | Explore index | `property`, `surface` |

---

## Property Data

All properties are defined in `src/data/properties.ts`. Each entry includes:

- `slug` — URL key and folder name for gallery images
- `hospitableId` — Hospitable PMS property UUID (used for live pricing/reviews/availability/messaging)
- `lat` / `lng` — Map coordinates
- `categories` — `"Beach"`, `"City"`, `"Large Groups"` (used for filter tabs)
- Gallery images are auto-discovered from `src/assets/properties/<slug>/` and ordered by `galleryAlts.ts`

**Current properties (9 total):**

| Slug | Location | Beds | Sleeps | Categories |
|---|---|---|---|---|
| `tampa` | Tampa, FL | 6 | 15 | Large Groups |
| `largo` | Largo, FL | 3 | 11 | Beach, Large Groups |
| `irb-b` | Indian Rocks Beach, FL | 2 | 6 | Beach |
| `clearwater` | Clearwater, FL | 4 | 14 | Beach, Large Groups |
| `irb-a` | Indian Rocks Beach, FL | 2 | 6 | Beach |
| `stpete-sunsoaked` | St. Petersburg, FL | 2 | 6 | City |
| `stpete-modern` | St. Petersburg, FL | 1 | 2 | City |
| `stpete-hottub` | St. Petersburg, FL | 1 | 4 | City |
| `stpete-patio` | St. Petersburg, FL | 1 | 6 | City |

**Global constants exported from `properties.ts`:**
```ts
BOOK_DIRECT_URL        // "https://seaandcityrentals.hospitable.rentals/"
HOSPITABLE_INQUIRY_URL // "https://seaandcityrentals.hospitable.rentals/"
PHONE                  // "248-766-2957"
BLOG_URL               // "https://www.seaandcityrentals.com/blog"
SITE_URL               // "https://www.seaandcityrentals.com"
```

### Adding a New Property

1. Create `src/assets/properties/<slug>/` and add numbered `.jpg` photos
2. Add alt-text entries in `src/data/galleryAlts.ts`
3. Add the property object in `src/data/properties.ts`
4. Update the property count in marketing copy on the homepage (currently hardcoded as "9")

---

## Blog Content

Blog posts are Markdown files in `src/content/blog/`. Currently 30 posts (`week1` through `week30`). Each needs frontmatter:

```yaml
---
title: "Post Title"
description: "Short description for SEO and previews"
publishDate: "2025-06-15"   # YYYY-MM-DD; future dates are not shown
author: "Nella"
tags: ["clearwater", "beaches"]
---
```

Parsed at build time by the custom `parseFrontmatter` in `src/lib/blog.ts`. HTML is generated with `marked`. The `entities` package is pinned to `4.5.0` via a `pnpm.overrides` entry in `package.json` to avoid ESM/CJS conflicts with `marked`.

---

## Hospitable API Integration

Server functions in `src/lib/hospitable.functions.ts` fetch live data from `https://public.api.hospitable.com/v2`.

Three exported server functions:
- `getListingPricing({ data: { id } })` — 90-day pricing range (min/max/avg)
- `getListingReviews({ data: { id } })` — latest 5 reviews
- `getListingAvailability({ data: { id } })` — 365-day calendar

All use in-process stale-while-revalidate caching (1h fresh / 24h stale for pricing; 15min / 6h for availability). They also set `Cache-Control` headers for CDN caching.

---

## Revenue Optimization Campaigns

Three automated campaigns run via Supabase pg_cron calling internal API routes. All are **idempotent** — the Supabase log tables ensure messages are never sent twice.

### Orphan Day Upsell (`src/lib/orphan-upsell.server.ts`)

Detects single vacant nights sandwiched between two back-to-back reservations and offers both adjacent guests a discounted add-on night via Hospitable messaging.

- **Route**: `GET/POST /api/public/orphan-day-upsell`
- **Cron**: every 4 hours (`0 */4 * * *`)
- **Log table**: `orphan_upsell_log` — unique on `(property_hospitable_id, orphan_date)`
- **Discount**: 35%, with a minimum floor ($100 city / $190 beach properties)
- **Messages signed as**: Nella (host persona)

### Upsell Reply Handler (`src/lib/orphan-reply-handler.server.ts`)

Polls Hospitable message threads for YES replies from guests who received an orphan-day offer, then:
1. Creates a Hospitable task for the host to send an alteration request
2. Attempts to auto-extend direct/manual reservations via the API
3. Sends a confirmation message to the guest
4. Marks the row handled to prevent repeats

- **Route**: `GET/POST /api/public/process-upsell-replies`
- **Cron**: every hour at :15 (`15 * * * *`)
- **Tracking columns**: `outgoing_yes_detected`, `incoming_yes_detected`, `outgoing_alteration_handled`, `incoming_alteration_handled` (on `orphan_upsell_log`)

### Rebooking Campaign (`src/lib/rebooking-campaign.server.ts`)

Finds open stretches in the next 90 days, then messages past guests who stayed during the same calendar window last year, offering a 10% returning-guest discount.

- **Route**: `GET/POST /api/public/rebooking-campaign`
- **Cron**: every Monday at 10 AM (`0 10 * * 1`)
- **Log table**: `rebooking_campaign_log` — unique on `(property_hospitable_id, guest_reservation_id, available_start_date)`

### pg_cron Setup

After running migrations, schedule the crons in the Supabase SQL editor:

```sql
-- Orphan day upsell — every 4 hours
SELECT cron.schedule('orphan-day-upsell', '0 */4 * * *', $$
  SELECT net.http_post(url := 'https://www.seaandcityrentals.com/api/public/orphan-day-upsell',
    headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);
$$);

-- Process YES replies — every hour at :15
SELECT cron.schedule('process-upsell-replies', '15 * * * *', $$
  SELECT net.http_post(url := 'https://www.seaandcityrentals.com/api/public/process-upsell-replies',
    headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);
$$);

-- Rebooking campaign — every Monday at 10 AM UTC
SELECT cron.schedule('rebooking-campaign', '0 10 * * 1', $$
  SELECT net.http_post(url := 'https://www.seaandcityrentals.com/api/public/rebooking-campaign',
    headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);
$$);
```

---

## Email System

The email system uses Supabase `pgmq` message queues and `@lovable.dev/email-js`.

- **Queue names**: `transactional_emails`, `auth_emails` (+ `_dlq` variants for dead letters)
- **Sending flow**: enqueue via `supabase.rpc('enqueue_email', { ... })` → queue processor at `/lovable/email/queue/process` (called by cron) → `sendLovableEmail()`
- **Templates**: React Email components in `src/lib/email-templates/`; register in `registry.ts`
- **Current templates**: `welcome-discount` (sent on email lead capture)
- **Unsubscribe**: token-based; tokens in `email_unsubscribe_tokens` table; suppression in `suppressed_emails`

### Adding a New Email Template

1. Create `src/lib/email-templates/<name>.tsx` — React Email component
2. Export a `template` object matching the `TemplateEntry` interface (see `registry.ts`)
3. Register it in `src/lib/email-templates/registry.ts`

---

## Supabase Schema (key tables)

| Table | Purpose |
|---|---|
| `email_leads` | Email captures from signup forms |
| `email_send_log` | Audit trail for all email send attempts |
| `email_unsubscribe_tokens` | One-time tokens for unsubscribe links |
| `suppressed_emails` | Bounce/complaint suppression list |
| `hospitable_reviews_cache` | Reviews fetched by `/api/public/refresh-reviews` |
| `orphan_upsell_log` | Tracks orphan-day upsell messages; unique per property + orphan date |
| `rebooking_campaign_log` | Tracks rebooking messages; unique per property + guest reservation + stretch start |

Migrations are in `supabase/migrations/`. Run them against the project (`ywstqonfcfjfqfuwscya`) via `supabase db push` or Supabase dashboard SQL editor.

---

## GitHub Actions Workflows

### `weekly-site-health.yml` — Site Health Check
- **Schedule**: every Monday at 9 AM UTC
- **What it does**: curls `/`, `/properties`, `/blog`, `/listings/clearwater`, `/sitemap.xml` and asserts HTTP 200
- **On failure**: opens a GitHub issue labelled `site-health` (deduped per month)

### `weekly-site-monitoring.yml` — Claude Code Audit
- **Schedule**: every Monday at 8 AM UTC
- **What it does**: runs a Claude Code agent that audits SEO, accessibility, performance, UX/conversion and code quality, implements improvements, then commits and pushes to branch `claude/website-monitoring-setup-MxGBy`
- **Commit format**: `"Weekly monitoring pass #N: <summary>"`

---

## Deployment

Deployed as a **Cloudflare Worker** via `wrangler.jsonc`:
- Entry: `src/server.ts`
- Worker name: `tanstack-start-app`
- Compatibility date: `2025-09-24`
- Compatibility flag: `nodejs_compat`
- The Worker wraps the TanStack Start server entry and normalizes h3 SSR errors into a branded 500 page

Build → deploy workflow:
```bash
npm run build
npx wrangler deploy
```

---

## Vite Configuration Notes

`vite.config.ts` uses `@lovable.dev/vite-tanstack-config` which bundles many plugins automatically. **Do not add these manually** or the build will break (they are already included):
- `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, `cloudflare` (build), `componentTagger` (dev), `VITE_*` env injection, `@` path alias, React/TanStack dedupe

The `entities` package is pinned to `4.5.0` in `package.json` (`pnpm.overrides`) to avoid ESM/CJS conflicts with `marked`.
