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

## Implemented (2026-01-18 / iteration 7)
- **Added 3 new images to the "Private Hot Tub | 1BR" listing**
  (`stpete-hottub`). Saved to `src/assets/properties/stpete-hottub/` as
  `07.jpg` (marble walk-in shower & vanity), `08.jpg` (renovated laundry
  pantry w/ washer + dryer), `09.jpg` (Crescent Lake sunset — neighborhood
  walk). Manifest entries added in `src/data/galleryAlts.ts` with SEO alt
  text and conversion-optimal order (hot tub → patio → exterior → living →
  kitchen → laundry → bedroom → bathroom → neighborhood). Listing now
  shows **9 photos** (was 6 placeholders).
- **Removed Tampa images 02, 07, 08, 21, 24, 35** — deleted from
  `src/assets/properties/tampa/` and from the `tampa` manifest in
  `src/data/galleryAlts.ts`. Tampa gallery now shows **31 photos** (was 36).
- All existing listings already use a manually-curated conversion-optimal
  gallery order (hero/exterior → pool/amenity → kitchen → living → bedrooms
  → baths → neighborhood). Verified hero ordering for each slug.

## Implemented (2026-01-18 / iteration 6)
- **Added "Latest from the blog" strip to the homepage**
  (`src/routes/index.tsx`). Sits on a sand-colored band between
  "Hosted with heart" and "Explore Tampa Bay". Shows the 3 most recently
  published posts via `getPublishedPosts().slice(0, 3)` — so it auto-rotates
  every week as new posts unlock. Each card links to `/blog/<slug>` with
  `track("home_blog_click")` and
  `data-testid="home-latest-blog-<slug>"`. Section also has an "All posts →"
  link (`data-testid="home-latest-blog-all"`) and a mobile-only repeat at the
  bottom of the strip.
- Today (May 18, 2026) the strip shows 2 cards (week1 + week2). It will
  auto-expand to a clean 3-card row on May 22 when week3 publishes.

## Implemented (2026-01-18 / iteration 5)
- **Fixed broken "Read more" on the blog** (`src/routes/blog.tsx`). Same
  parent-route swallow bug we hit on `/explore/<slug>` — `blog.tsx` lacked
  an `<Outlet />`, so `/blog/<slug>` was rendering the blog index instead
  of the post. Patched to render `<Outlet />` when `useChildMatches()` is
  non-empty. Verified by clicking "Read more" → full article opens with
  correct H1, URL and rendered markdown.
- **Weekly scheduling confirmed working as-is**: `src/lib/blog.ts`
  already filters out future-dated posts via `isPublished` (compares
  `publishDate` to `Date.now()`), so each new week auto-publishes on its
  date with no manual action. The 30 in-repo markdown posts cover
  May 8, 2026 → Nov 27, 2026 (1 per week).

## Implemented (2026-01-18 / iteration 4)
- **Added "Top stay in <City>" mini-row at the bottom of every card on
  `/explore`** (`src/routes/explore.tsx`). Each guide card now finishes with
  a sand-colored footer showing a 56px thumbnail of the most-reviewed
  property in that region plus title, rating and review count. The footer
  itself is a `<Link>` to `/listings/<top-property-slug>` (separate from
  the main guide link), wired with `track("top_stay_click")` analytics and
  `data-testid="explore-card-<guide-slug>-top-stay"`.
- "Top stay" selection logic = matches via the same
  `GUIDE_TO_LOCATIONS` map, sorted by `reviews desc, rating desc`.
  Result for the current catalog:
  - Tampa → Waterfront 6BR (5.00 · 6 reviews)
  - St. Petersburg → Modern Retreat 1BR (4.86 · 90 reviews)
  - Clearwater Beach → Family Pool Getaway (4.94 · 279 reviews)

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
