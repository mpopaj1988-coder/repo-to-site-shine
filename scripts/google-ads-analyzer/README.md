# Google Ads Search Term Analyzer

A script that connects to your Google Ads account, pulls your recent search
term data, and prints a plain-English report telling you:

1. **Which searches are wasting money** (people clicked your ad but never
   booked/inquired) — so you can add them as negative keywords and stop
   paying for them.
2. **Which searches are converting well but aren't a keyword yet** — so you
   can add them directly and usually pay less per click for that traffic.
3. **Which of your existing keywords are wasting money** — same idea as #1,
   for keywords you're already bidding on.
4. **Which of your existing keywords are converting above average** — good
   candidates to raise the bid or budget on, since they're getting you
   customers efficiently.

It also saves the full results (not just what fits on screen) as CSV and
JSON files you can open in Excel/Sheets or hand to whoever manages the ads.

This does **not** change anything in your Google Ads account automatically —
it only reads data and prints recommendations. You (or whoever manages the
account) decide what to act on.

---

## One-time setup (about 15–20 minutes)

Google Ads requires four pieces of credentials before any tool — including
this one — can read your account's data. None of these cost money; they're
just proof that you (and this script) are allowed to access your account.

### 1. Apply for a Developer Token

This is Google's way of approving apps that read Google Ads data.

1. Sign in to [Google Ads](https://ads.google.com) with the account that
   owns/manages your campaigns.
2. Click **Tools & Settings** (wrench icon) → **Setup** → **API Center**.
3. Fill in the short application form. You'll immediately get a **test**
   developer token — this only works with test accounts, not your real
   account. You need **Basic access**, which Google approves within 1-2
   business days for real accounts.
4. Once approved, copy the token — this is `GOOGLE_ADS_DEVELOPER_TOKEN`.

### 2. Create an OAuth Client ID (proves this script is allowed to ask for access)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (top-left project dropdown → **New Project**) —
   name it anything, e.g. "Sea and City Ads Analyzer".
3. Go to **APIs & Services** → **Library**, search for "Google Ads API",
   and click **Enable**.
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** →
   **OAuth client ID**.
   - If prompted, configure the **OAuth consent screen** first: choose
     **External**, fill in an app name and your email, and add your own
     Google account under **Test users**. You don't need to publish it.
   - For **Application type**, choose **Desktop app**.
5. Copy the **Client ID** and **Client Secret** — these are
   `GOOGLE_ADS_CLIENT_ID` and `GOOGLE_ADS_CLIENT_SECRET`.

### 3. Generate a refresh token (one-time login)

This is a one-time login that lets the script access your Ads data going
forward without you logging in again.

```bash
export GOOGLE_ADS_CLIENT_ID=your-client-id
export GOOGLE_ADS_CLIENT_SECRET=your-client-secret
node scripts/google-ads-analyzer/get-refresh-token.mjs
```

The script prints a URL — open it, sign in with the Google account that has
access to your Ads account, and approve access. The script will print a
`GOOGLE_ADS_REFRESH_TOKEN` value in your terminal. Save it for the next step.

### 4. Find your Customer ID

This is the account you want to analyze — visible top-right in the Google
Ads UI, formatted like `123-456-7890`. You'll use it without the dashes.

### 5. Put it all together

```bash
cp scripts/google-ads-analyzer/.env.ads.example .env.ads
```

Edit `.env.ads` and fill in the five values from steps 1-4. `.env.ads` is
already in `.gitignore`, so it won't be committed.

---

## Running it

```bash
node --env-file=.env.ads scripts/google-ads-analyzer/index.mjs
```

Optional flags:

```bash
# Look at the last 90 days instead of the default 30
node --env-file=.env.ads scripts/google-ads-analyzer/index.mjs --days=90

# Only flag wasted spend once a search term/keyword has cost $50+ with no conversions
node --env-file=.env.ads scripts/google-ads-analyzer/index.mjs --min-waste=50

# Ignore anything with fewer than 5 clicks (reduces noise from one-off flukes)
node --env-file=.env.ads scripts/google-ads-analyzer/index.mjs --min-clicks=5
```

The report prints to your terminal, and the full (untruncated) results are
saved as CSV + JSON under `/tmp/google-ads-reports/<account>-<timestamp>/`.

## How to read the recommendations

- **Section 1 & 3 (wasted spend)**: these are the easiest wins — they're
  costing you money with zero bookings/leads to show for it. Adding them as
  negative keywords (in the Google Ads UI: right-click the campaign/ad
  group → "Negative keywords") stops your ads from showing for those exact
  searches.
- **Section 2 (new keyword opportunities)**: these searches already proved
  they convert. Adding them as their own keyword (usually **Exact match**,
  e.g. `[wording here]`) typically improves Quality Score and lowers your
  cost per click for that traffic.
- **Section 4 (scale up)**: these are your best performers relative to the
  rest of the account. If the campaign has budget headroom, raising the bid
  or daily budget here tends to bring in more bookings at a similar cost
  efficiency.

If any of this is unfamiliar, it's worth reviewing recommendations with
whoever manages your Google Ads account before making changes — this script
only tells you _what_ to consider, not applies changes for you.
