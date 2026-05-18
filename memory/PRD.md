# Sea & City Rentals — PRD

## Original Problem Statement
> www.seaandcityrentals.com — needs a couple updates:
> 1. The "Meet Nella" button on the home page should disappear.
> 2. The neighborhood guidebook at the bottom has three guides. Replace the guide
>    content with the richer guides from
>    https://github.com/mpopaj1988-coder/seaandcityrentals-site (source of guides),
>    inside the current site repo https://github.com/mpopaj1988-coder/repo-to-site-shine.

## Architecture / Stack
- TanStack Start + Vite + React 19 (SSR), Tailwind v4, Radix UI primitives.
- Source repo cloned into `/app/frontend`. Vite dev server runs on port 3000
  (supervisor `frontend`), `vite dev --host 0.0.0.0 --port 3000`.
- `server.allowedHosts: true` added to `vite.config.ts` so the Emergent preview
  hostname is accepted.
- No backend changes — repo is static / static-rendered marketing site.

## Implemented (2026-01-18 / iteration 3)
- **Added "Stay nearby" property card grid to every guide page**
  (`src/routes/explore.$slug.tsx`). Up to 3 matching property cards now
  appear under the "Find your perfect base in <City>" heading, closing the
  guide-to-listing loop in both directions. Uses the existing `PropertyCard`
  component. Mapping (reverse of the listing CTA):
  - `tampa` → Tampa properties (1 card)
  - `st-petersburg` → St. Petersburg properties (3 cards)
  - `clearwater-beach` → Clearwater / Largo / Indian Rocks Beach (3 cards)
- Added analytics tracking `nearby_property_click` and
  `data-testid="guide-<slug>-nearby-<property-slug>"` on each card.

## Implemented (2026-01-18 / iteration 2)
- **Added "Read the local guide" card to every property listing page**
  (`src/routes/listings.$slug.tsx`). The card sits between Amenities and the
  Inquiry block and shows the matching guide's hero image, city, tagline and
  a `Read the <City> guide →` link with analytics tracking
  (`track("guide_click", { surface: "listing_<slug>", guide: "<slug>" })`)
  and `data-testid="listing-<slug>-guide-link"`.
- City-to-guide mapping handled by an in-file `LOCATION_TO_GUIDE` dict:
  Tampa → tampa; St. Petersburg → st-petersburg; Clearwater / Largo /
  Indian Rocks Beach → clearwater-beach. Verified server-rendered URLs for
  all 9 listings.

## Implemented (2026-01-18 / iteration 1)
- Cloned repo `repo-to-site-shine` into `/app/frontend` (replaced the empty
  scaffold), installed deps via `yarn install --ignore-engines`, added a
  `start` script for supervisor.
- **Removed "Meet Nella" link** from the homepage's "Hosted with heart"
  section (`src/routes/index.tsx`). The About page bio remains untouched.
- **Rewrote the three neighborhood guides** with the rich content extracted
  from the static `seaandcityrentals-site` HTML files
  (`guide-tampa.html`, `guide-stpete.html`, `guide-clearwater.html`):
  - 5 sections per city: Where to Eat, Nearest Beaches / The Beaches,
    Nightlife, Fitness & Wellness, Things To Do.
  - 6 place cards per section (type / name / description / address detail).
  - "Local Tip" callout box per section.
- Reshaped `src/data/guides.ts` types (`GuideItem`, `GuideTip`, `GuideSection`)
  and rebuilt `src/routes/explore.$slug.tsx` to render the new structure
  with sticky in-page nav, getting-around drive times, CTA strip and
  "Other guides" footer.
- Patched `src/routes/explore.tsx` to render `<Outlet />` when a child
  (`/explore/$slug`) route is matched, fixing the parent-route swallow issue
  that caused `/explore/tampa` to render the listing.

## Testing
- Lint clean (`mcp_lint_javascript`).
- `testing_agent_v3` iteration 1 — frontend-only — passed at 100%:
  Meet Nella absence ✓, Hosted-with-heart intact ✓, /explore listing ✓,
  Tampa / St. Petersburg / Clearwater guide pages all render 5 sections
  with 6 items + Local Tip ✓, sticky section nav, drive-time cards, CTA
  links, "Other guides" all verified.

## Backlog / Future
- P2: Split `src/data/guides.ts` (~790 lines) into per-city files for
  maintainability (code-review note from testing agent).
- P2: Precompute section slug into `GuideSection` to harden in-page anchors
  against heading rewording.
- P2: Add images / icons per place card (currently uses the 📍 emoji from
  source content).
