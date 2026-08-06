// Web Push (RFC 8291 message encryption + RFC 8292 VAPID) implemented on the
// Web Crypto API rather than the `web-push` npm package, because that
// package sends its HTTP request through Node's `https` module — which the
// Cloudflare Worker runtime does not support (only `fetch`). Web Crypto is a
// native Worker capability, so this runs the same in dev and in production.
//
// NOTE: this is the one piece of the cleaner portal that hasn't been
// exercised against a real push service — encryption bugs here fail
// silently as "no notification arrived" rather than a visible error, so
// test it against an actual phone before relying on it.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const db = supabaseAdmin as unknown as SupabaseClient;

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function signVapidJwt(
  endpoint: string,
  subject: string,
  privateKeyJwk: JsonWebKey,
): Promise<string> {
  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: subject };
  const encoder = new TextEncoder();
  const toB64 = (obj: unknown) => bytesToBase64url(encoder.encode(JSON.stringify(obj)));
  const unsigned = `${toB64(header)}.${toB64(payload)}`;

  const key = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsigned),
  );
  return `${unsigned}.${bytesToBase64url(new Uint8Array(signature))}`;
}

type PushSubscription = { endpoint: string; p256dh: string; auth: string };

async function sendWebPush(
  sub: PushSubscription,
  payload: unknown,
): Promise<{ ok: boolean; status?: number }> {
  const publicKeyB64 = process.env.VAPID_PUBLIC_KEY;
  const privateKeyB64 = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:vacation@seaandcityrentals.com";
  if (!publicKeyB64 || !privateKeyB64) return { ok: false };

  // VAPID private key is stored as a raw JWK (see generate-vapid-keys.mjs).
  const privateJwk = JSON.parse(privateKeyB64) as JsonWebKey;

  const uaPublic = base64urlToBytes(sub.p256dh); // 65-byte uncompressed EC point
  const authSecret = base64urlToBytes(sub.auth); // 16 bytes

  // Ephemeral local key pair for this message only (RFC 8291 §3.1).
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const uaPublicKey = await crypto.subtle.importKey(
    "raw",
    uaPublic as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: uaPublicKey },
      localKeyPair.privateKey,
      256,
    ),
  );
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

  const encoder = new TextEncoder();
  const keyInfo = concatBytes(encoder.encode("WebPush: info\0"), uaPublic, asPublicRaw);
  const prk = await hkdf(authSecret, sharedSecret, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, prk, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, prk, encoder.encode("Content-Encoding: nonce\0"), 12);

  const plaintext = encoder.encode(JSON.stringify(payload));
  // Single-record padding delimiter (0x02 = last/only record), no extra padding.
  const padded = concatBytes(plaintext, new Uint8Array([2]));

  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, [
    "encrypt",
  ]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource },
      aesKey,
      padded as BufferSource,
    ),
  );

  // aes128gcm header: salt(16) | record size(4, big-endian) | keyid length(1) | keyid(as public key, 65)
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  const header = concatBytes(salt, recordSize, new Uint8Array([asPublicRaw.length]), asPublicRaw);
  const body = concatBytes(header, ciphertext);

  const jwt = await signVapidJwt(sub.endpoint, subject, privateJwk);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${publicKeyB64}`,
    },
    body: body as BodyInit,
  });

  if (res.status === 404 || res.status === 410) {
    // Subscription expired/gone — clean it up so we stop trying.
    await db.from("cleaner_push_subscriptions").delete().eq("endpoint", sub.endpoint);
  }

  return { ok: res.ok, status: res.status };
}

// Pings every active cleaner's registered devices about a newly open job.
// Fire-and-forget from callers — a failed push should never block job
// creation, so this swallows its own errors per-subscription.
export async function notifyNewJob(job: {
  id: string;
  property_name: string;
  checkout_date: string;
}) {
  const { data: subs } = await db
    .from("cleaner_push_subscriptions")
    .select("endpoint, p256dh, auth, cleaners!inner(active)")
    .eq("cleaners.active", true);

  if (!subs || subs.length === 0) return;

  const payload = {
    title: "New cleaning available",
    body: `${job.property_name} — checkout ${job.checkout_date}`,
    url: "/cleaners",
  };

  await Promise.allSettled(
    subs.map((s) =>
      sendWebPush(
        { endpoint: s.endpoint as string, p256dh: s.p256dh as string, auth: s.auth as string },
        payload,
      ).catch(() => {}),
    ),
  );
}
