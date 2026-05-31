# Sea & City Rentals — Codebase Guide

## Project Overview

**Sea & City Rentals** is a vacation rental website for 9 properties across the Tampa Bay area (Tampa, St. Petersburg, Clearwater, Largo, Indian Rocks Beach). It is a full-stack SSR React app deployed to **Cloudflare Workers**, built on **TanStack Start** with file-based routing.

The site enables direct bookings (bypassing Airbnb fees), displays live pricing/availability from the Hospitable PMS API, captures email leads, and publishes a travel blog targeting Tampa Bay visitors.

---

## Tech Stack

| Layer           | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Framework       | TanStack Start (React SSR, file-based routing)               |
| Build           | Vite + `@lovable.dev/vite-tanstack-config`                   |
| Routing         | TanStack Router (auto-generated `routeTree.gen.ts`)          |
| Server state    | TanStack Query                                               |
| UI components   | shadcn/ui (New York style) + Radix UI                        |
| Styling         | Tailwind CSS v4 + `tw-animate-css`                           |
| Database        | Supabase (PostgreSQL)                                        |
| Deployment      | Cloudflare Workers (`wrangler.jsonc`)                        |
| Email infra     | `@lovable.dev/email-js` + React Email + Supabase pgmq queues |
| Analytics       | Google Analytics 4                                           |
| PMS integration | Hospitable Public API                                        |

---

## Repository Structure

```
src/
├── assets/                   # Images — hero shots and per-property galleries
│   ├── properties/<slug>/    # Gallery photos for each property
│   └── *.jpg                 # Shared hero / guide images
├── components/
│   ├── site/                 # App-specific components (Header, Footer, Layout, etc.)
│   └── ui/                   # shadcn/ui primitives — DO NOT edit directly
├── content/
│   └── blog/                 # Markdown blog posts (frontmatter + body)
├── data/
│   ├── properties.ts         # Source of truth for all 9 properties
│   ├── guides.ts             # Neighborhood guide data (Tampa, St. Pete, Clearwater)
│   └── galleryAlts.ts        # Alt-text manifest for property gallery images
├── hooks/                    # Custom React hooks
├── integrations/
│   └── supabase/             # Auto-generated Supabase client — DO NOT edit directly
│       ├── client.ts         # Browser client (uses VITE_ env vars)
│       ├── client.server.ts  # Server-only admin client (service role key)
│       └── types.ts          # Generated DB types
├── lib/
│   ├── analytics.ts          # GA4 `track()` helper
│   ├── blog.ts               # Blog parsing (frontmatter + marked)
│   ├── email-templates/      # React Email templates + registry
│   ├── error-capture.ts      # SSR error capture for Cloudflare Worker
│   ├── error-page.ts         # Fallback HTML error page renderer
│   ├── hospitable.functions.ts  # Server functions: pricing, reviews, availability
│   ├── reviews.functions.ts  # Supabase-backed reviews (cached)
│   └── utils.ts              # `cn()` Tailwind class merge helper
├── routes/                   # File-based routes (TanStack Router)
├── router.tsx                # Router + QueryClient factory
├── server.ts                 # Cloudflare Worker fetch handler (entry)
├── start.ts                  # TanStack Start instance + error middleware
├── routeTree.gen.ts          # Auto-generated — never edit by hand
└── styles.css                # Global styles, Tailwind v4 theme, brand tokens

supabase/
└── migrations/               # SQL migration files (run in order)
```

---

## Routes Reference

| Route                                  | Description                                                         |
| -------------------------------------- | ------------------------------------------------------------------- |
| `/`                                    | Homepage — hero slider, property grid, reviews, about, blog preview |
| `/properties`                          | Full property listing with category filters                         |
| `/listings/$slug`                      | Property detail page (pricing, availability, reviews, gallery)      |
| `/blog`                                | Blog index                                                          |
| `/blog/$slug`                          | Individual blog post                                                |
| `/explore/$slug`                       | Neighborhood guides (`tampa`, `st-petersburg`, `clearwater-beach`)  |
| `/map`                                 | Interactive Leaflet map with property pins                          |
| `/about`                               | About page                                                          |
| `/contact`                             | Contact form                                                        |
| `/reviews`                             | Reviews page                                                        |
| `/unsubscribe`                         | Email unsubscribe (token-based)                                     |
| `/api/public/discount-signup`          | POST — email capture, sends welcome discount email                  |
| `/api/public/refresh-reviews`          | GET/POST — refreshes Hospitable reviews into Supabase               |
| `/sitemap.xml`                         | Auto-generated sitemap                                              |
| `/robots.txt`                          | robots.txt                                                          |
| `/blog.rss.xml`                        | Blog RSS feed                                                       |
| `/lovable/email/queue/process`         | Email queue processor (called by cron)                              |
| `/lovable/email/suppression`           | Bounce/complaint webhook handler                                    |
| `/lovable/email/transactional/send`    | Internal transactional send endpoint                                |
| `/lovable/email/transactional/preview` | Template preview                                                    |
| `/email/unsubscribe`                   | API-level unsubscribe handler                                       |

---

## Development Commands

```bash
npm run dev          # Start dev server (localhost, hot reload)
npm run start        # Dev server bound to 0.0.0.0:3000 (cloud / container)
npm run build        # Production build
npm run build:dev    # Dev-mode build
npm run lint         # ESLint
npm run format       # Prettier (write)
```

**Never edit `src/routeTree.gen.ts`** — it is auto-generated by the TanStack Router plugin during `vite dev` or `vite build`.

---

## Environment Variables

### Required

| Variable                        | Where used                                      |
| ------------------------------- | ----------------------------------------------- |
| `VITE_SUPABASE_URL`             | Browser Supabase client                         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser Supabase client                         |
| `SUPABASE_URL`                  | Server-side Supabase client                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side admin client (bypasses RLS)         |
| `HOSPITABLE_API_KEY`            | Hospitable API (pricing, reviews, availability) |

### Optional

| Variable                | Where used                             |
| ----------------------- | -------------------------------------- |
| `MAILCHIMP_API_KEY`     | Sync email leads to Mailchimp audience |
| `MAILCHIMP_AUDIENCE_ID` | Mailchimp audience ID                  |

Variables prefixed `VITE_` are injected at build time by Vite and available in the browser. Non-`VITE_` variables are server-only (`process.env`).

---

## Key Conventions

### TypeScript

- Strict mode enabled; target ES2022
- Path alias `@/` resolves to `src/`
- `moduleResolution: "Bundler"` — use full paths with extensions only when necessary
- Do not import `server-only` (Next.js package); instead use `*.server.ts` file naming for server-only modules

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

### Supabase Clients

- **Browser / isomorphic**: `import { supabase } from "@/integrations/supabase/client"`
- **Server admin (bypasses RLS)**: `import { supabaseAdmin } from "@/integrations/supabase/client.server"` — server files only, never expose to client
- Both files are auto-generated; do not edit them

### Styling

- Tailwind CSS v4 with CSS custom properties defined in `src/styles.css`
- Brand tokens (use these class names in markup):
  - `--color-deep` → navy (`var(--color-deep)`) — primary brand color
  - `--color-gold` → gold accent
  - `--color-sand` → warm off-white background
  - `--color-sea` → teal/sea blue
- `font-display` class → Cormorant Garamond (serif, headings)
- Default sans → Jost
- All colors must use oklch format in `:root` / `.dark` blocks
- shadcn/ui components live in `src/components/ui/` — install new ones with `npx shadcn@latest add <component>`, never edit generated files manually

### Analytics

Use `track()` from `@/lib/analytics` for GA4 events — always use this helper, never call `window.gtag` directly:

```ts
import { track } from "@/lib/analytics";
track("book_direct_click", { surface: "header", property: "tampa" });
```

**Tracked events (complete list):**

| Event                   | Where                                                             | Key params                                             |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| `property_card_click`   | `PropertyCard`                                                    | `property`, `location`                                 |
| `listing_view`          | `listings.$slug` (mount)                                          | `property`, `location`                                 |
| `availability_opened`   | `AvailabilityChecker`                                             | `property`                                             |
| `reserve_click`         | `AvailabilityChecker`                                             | `property`, `nights`, `total`, `check_in`, `check_out` |
| `book_direct_click`     | Header, Footer, Home, Listing, Properties, About, Contact, Guides | `surface`                                              |
| `email_signup`          | `EmailCaptureModal`, `FooterEmailSignup`                          | `method` (`modal`\|`footer`)                           |
| `inquiry_click`         | Listing (multiple CTAs), Contact                                  | `surface`, `property`                                  |
| `phone_click`           | Listing sticky bar + mobile bar                                   | `surface`, `property`                                  |
| `map_pin_click`         | `PropertyMap`                                                     | `property`, `location`                                 |
| `home_blog_click`       | Homepage blog preview                                             | `post`                                                 |
| `guide_click`           | Listing page                                                      | `surface`, `guide`                                     |
| `nearby_property_click` | Explore guide pages                                               | `surface`, `property`                                  |
| `top_stay_click`        | Explore index                                                     | `property`, `surface`                                  |

**Automated monitoring:** A GitHub Actions workflow (`.github/workflows/weekly-site-health.yml`) runs every Monday at 9 AM UTC, checks that `/`, `/properties`, `/blog`, `/listings/clearwater`, and `/sitemap.xml` all return HTTP 200, and opens a GitHub issue labelled `site-health` if any check fails.

---

## Property Data

All properties are defined in `src/data/properties.ts`. Each entry includes:

- `slug` — URL key and folder name for gallery images
- `hospitableId` — Hospitable PMS property UUID (used for live pricing/reviews/availability)
- `lat` / `lng` — Map coordinates
- `categories` — `"Beach"`, `"City"`, `"Large Groups"` (used for filter tabs)
- Gallery images are auto-discovered from `src/assets/properties/<slug>/` and ordered by `galleryAlts.ts`

**Current properties (9 total):** `tampa`, `largo`, `irb-b`, `clearwater`, `irb-a`, `stpete-sunsoaked`, `stpete-modern`, `stpete-hottub`, `stpete-patio`

### Adding a New Property

1. Create `src/assets/properties/<slug>/` and add numbered `.jpg` photos
2. Add alt-text entries in `src/data/galleryAlts.ts`
3. Add the property object in `src/data/properties.ts`
4. Update the property count in marketing copy on the homepage (currently hardcoded as "9")

---

## Blog Content

Blog posts are Markdown files in `src/content/blog/`. Each needs frontmatter:

```yaml
---
title: "Post Title"
description: "Short description for SEO and previews"
publishDate: "2025-06-15" # YYYY-MM-DD; future dates are not shown
author: "Nella"
tags: ["clearwater", "beaches"]
---
```

Parsed at build time by the custom `parseFrontmatter` in `src/lib/blog.ts` (avoids `gray-matter`'s Node.js `Buffer` dependency). HTML is generated with `marked`.

---

## Hospitable API Integration

Server functions in `src/lib/hospitable.functions.ts` fetch live data from `https://public.api.hospitable.com/v2`.

Three exported server functions:

- `getListingPricing({ data: { id } })` — 90-day pricing range (min/max/avg)
- `getListingReviews({ data: { id } })` — latest 5 reviews
- `getListingAvailability({ data: { id } })` — 365-day calendar

All use in-process stale-while-revalidate caching (1h fresh / 24h stale for pricing; 15min / 6h for availability). They also set `Cache-Control` headers for CDN caching.

---

## Email System

The email system uses Supabase `pgmq` message queues and `@lovable.dev/email-js`.

- **Queue names**: `transactional_emails`, `auth_emails` (+ `_dlq` variants for dead letters)
- **Sending flow**: enqueue via `supabase.rpc('enqueue_email', { ... })` → queue processor at `/lovable/email/queue/process` (called by cron) → `sendLovableEmail()`
- **Templates**: React Email components in `src/lib/email-templates/`; register in `registry.ts`
- **Unsubscribe**: token-based; tokens in `email_unsubscribe_tokens` table; suppression in `suppressed_emails`

### Adding a New Email Template

1. Create `src/lib/email-templates/<name>.tsx` — React Email component
2. Export a `template` object matching `TemplateEntry` interface
3. Register it in `src/lib/email-templates/registry.ts`

---

## Supabase Schema (key tables)

| Table                      | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `email_leads`              | Email captures from signup forms                 |
| `email_send_log`           | Audit trail for all email send attempts          |
| `email_unsubscribe_tokens` | One-time tokens for unsubscribe links            |
| `suppressed_emails`        | Bounce/complaint suppression list                |
| `hospitable_reviews_cache` | Reviews fetched by `/api/public/refresh-reviews` |

Migrations are in `supabase/migrations/`. Run them against the project (`ywstqonfcfjfqfuwscya`) via `supabase db push` or Supabase dashboard SQL editor.

---

## Deployment

Deployed as a **Cloudflare Worker** via `wrangler.jsonc`:

- Entry: `src/server.ts`
- Compatibility: `nodejs_compat` flag
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

The `entities` package is aliased explicitly to avoid ESM/CJS conflicts with `marked`.
