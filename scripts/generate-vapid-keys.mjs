// One-time helper: generates a VAPID key pair for the cleaner-portal push
// notifications. Run with `node scripts/generate-vapid-keys.mjs`, then copy
// the three printed values into your Cloudflare Worker environment
// variables. Safe to re-run — each run produces a fresh, unrelated key pair
// (any subscriptions saved under an old key would need re-subscribing).
import { webcrypto } from "node:crypto";

function bytesToBase64url(bytes) {
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// VAPID keys are only ever used to sign/verify the Authorization JWT
// (ECDSA) — a separate, per-message ephemeral key pair handles the
// payload-encryption ECDH, so this pair must be generated for signing.
const keyPair = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
  "sign",
  "verify",
]);

const publicRaw = new Uint8Array(await webcrypto.subtle.exportKey("raw", keyPair.publicKey));
const privateJwk = await webcrypto.subtle.exportKey("jwk", keyPair.privateKey);

console.log("VAPID_PUBLIC_KEY=" + bytesToBase64url(publicRaw));
console.log("VAPID_PRIVATE_KEY=" + JSON.stringify(privateJwk));
console.log("VAPID_SUBJECT=mailto:vacation@seaandcityrentals.com");
