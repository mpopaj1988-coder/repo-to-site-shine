#!/usr/bin/env node
// One-time setup helper: turns a Google OAuth "Desktop app" Client ID/Secret
// into a long-lived refresh token the analyzer script can reuse forever.
// You only need to run this once (or again if you ever revoke access).
//
// Usage:
//   GOOGLE_ADS_CLIENT_ID=... GOOGLE_ADS_CLIENT_SECRET=... node scripts/google-ads-analyzer/get-refresh-token.mjs
//
// See scripts/google-ads-analyzer/README.md for the full step-by-step guide.

import http from "node:http";

const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/adwords";

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "\nMissing GOOGLE_ADS_CLIENT_ID and/or GOOGLE_ADS_CLIENT_SECRET.\n" +
      "Set them first, e.g.:\n\n" +
      "  export GOOGLE_ADS_CLIENT_ID=xxxxx.apps.googleusercontent.com\n" +
      "  export GOOGLE_ADS_CLIENT_SECRET=xxxxx\n" +
      "  node scripts/google-ads-analyzer/get-refresh-token.mjs\n\n" +
      "See scripts/google-ads-analyzer/README.md for where to get these.\n",
  );
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\n1. Open this URL in a browser and sign in with the Google account");
console.log("   that has access to your Google Ads account:\n");
console.log(`   ${authUrl.toString()}\n`);
console.log(`2. Approve access. You'll be redirected to localhost:${PORT} — that's expected,`);
console.log("   this script is listening there and will pick it up automatically.\n");
console.log("Waiting for you to approve access...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res
      .writeHead(400, { "Content-Type": "text/html" })
      .end(`<h1>Authorization failed</h1><p>${error}</p>`);
    console.error(`\nGoogle returned an error: ${error}`);
    server.close();
    process.exit(1);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();

    if (!tokenRes.ok || !tokens.refresh_token) {
      res
        .writeHead(500, { "Content-Type": "text/html" })
        .end("<h1>Token exchange failed</h1><p>Check your terminal for details.</p>");
      console.error("\nToken exchange failed:", tokens);
      server.close();
      process.exit(1);
    }

    res
      .writeHead(200, { "Content-Type": "text/html" })
      .end("<h1>Success!</h1><p>You can close this tab and go back to your terminal.</p>");

    console.log("Success! Add this line to your .env.ads file:\n");
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT);
