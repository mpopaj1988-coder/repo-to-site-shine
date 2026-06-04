# GuestGrowth QR System — Developer Guide

## What this is

A productized service landing page + sample guest guide built on top of the existing Sea & City Rentals repo (TanStack Start + Tailwind CSS + Cloudflare Workers + Supabase).

- **`/guestgrowth`** — Sales/landing page for selling the service to STR hosts
- **`/guestgrowth/sample`** — Live demo of what guests experience after scanning the QR code
- **`/api/public/guestgrowth-lead`** — Lead capture API (saves to Supabase)

---

## Running locally

```bash
npm run dev
# Open http://localhost:3000/guestgrowth
# Open http://localhost:3000/guestgrowth/sample
```

---

## How to edit content

### Edit pricing tiers
Open `src/routes/guestgrowth/index.tsx` and find the `PRICING_TIERS` array near the top. Change `price`, `features`, `name`, or `cta` fields directly.

```ts
const PRICING_TIERS = [
  {
    id: "qr-guide",
    price: "$299",   // ← change here
    name: "QR Guest Guide",
    ...
  }
]
```

### Edit the comparison table
Find `COMPARISON_DATA` in the same file. Each row has `us`, `guidebook`, and `wifiCapture` — set to `true/false` for checkmarks, or a string for custom text.

### Edit the FAQ
Find `FAQ_ITEMS` in the same file. Add/remove/edit `{ q, a }` objects.

### Edit the sample guest guide content
Open `src/routes/guestgrowth/sample.tsx` and find `SAMPLE_PROPERTY` at the top. Edit:

```ts
const SAMPLE_PROPERTY = {
  name: "Your Property Name",
  wifiNetwork: "YourNetwork_5G",
  wifiPassword: "YourPassword",
  checkIn: "4:00 PM",
  checkOut: "10:00 AM",
  emergencyContact: "555-555-5555",
  bookDirectUrl: "https://your-booking-url.com",  // ← or Stripe payment link
  houseRules: [ "Rule 1", "Rule 2", ... ],
  checkInInstructions: [ "Step 1", "Step 2", ... ],
  localRecommendations: [ { category: "🍽 Restaurants", items: [...] } ],
}
```

---

## Connecting email tools

### ConvertKit
1. Set `CONVERTKIT_API_KEY` and `CONVERTKIT_FORM_ID` as environment variables in Cloudflare Workers
2. Open `src/routes/api/public/guestgrowth-lead.ts`
3. Uncomment the ConvertKit block (look for `// ── Future: ConvertKit`)

### Mailchimp
Similar pattern — use the Mailchimp API to add a member to a list. Add in the same file.

### Klaviyo
Use Klaviyo's `POST /v2/list/{list_id}/members` endpoint with your private API key.

### Airtable
1. Set `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` as env vars
2. Uncomment the Airtable block in `guestgrowth-lead.ts`

---

## Connecting Stripe checkout

For the pricing buttons, replace `href="#get-started"` with a direct Stripe Payment Link:

```tsx
// In src/routes/guestgrowth/index.tsx, find each pricing tier CTA:
<a href="https://buy.stripe.com/your_payment_link_here" ...>
  {tier.cta} →
</a>
```

Or create a Stripe Checkout session server-side:
1. Add `stripe` npm package: `npm install stripe`
2. Create `/api/public/guestgrowth-checkout.ts` that calls `stripe.checkout.sessions.create()`
3. Redirect the user to `session.url`

---

## Running the Supabase migration

Run this in the Supabase SQL editor (project: `ywstqonfcfjfqfuwscya`):

```
supabase/migrations/20260604000002_guestgrowth_leads.sql
```

This creates the `guestgrowth_leads` table where all host inquiries are stored.

To view leads:
```sql
select * from guestgrowth_leads order by created_at desc;
```

---

## Adding a real property guide

Each paying client gets their own page at `/wifi/[their-slug]`. To add a new client property:

**Option A — Hardcode (fastest):** Add to `src/data/wifiConfig.server.ts`

**Option B — Database (scalable):** Log in to `/host/dashboard`, click "Add property", fill the form. The `/wifi/[slug]` page automatically checks the database first.

---

## QR code generation

QR codes are generated client-side using the `qrcode` npm package:

```js
import QRCode from "qrcode";
const url = `https://seaandcityrentals.com/wifi/client-slug`;
await QRCode.toCanvas(canvas, url, { width: 600, color: { dark: "#1A3A4A", light: "#FFFFFF" } });
```

The dashboard's "Download QR" button does this automatically for every property.

---

## Environment variables needed

| Variable | Where to set | What it does |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare Workers secrets | Saves leads to DB |
| `CONVERTKIT_API_KEY` | Optional | Syncs leads to ConvertKit |
| `CONVERTKIT_FORM_ID` | Optional | ConvertKit form target |
| `AIRTABLE_API_KEY` | Optional | Syncs leads to Airtable |
| `AIRTABLE_BASE_ID` | Optional | Airtable base target |
| `STRIPE_SECRET_KEY` | Optional | Stripe checkout sessions |

---

## Deploying

```bash
npm run build
npx wrangler deploy
```

Changes to `guestgrowth/` routes deploy with the rest of the site automatically.
