// PIN hashing and session helpers for the cleaner portal.
// Uses the Web Crypto API (not node:crypto) so this works identically in
// local dev and in the Cloudflare Worker runtime.

export const CLEANER_COOKIE = "cleaner_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function derivePinBits(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinBits(pin, salt);
  return `${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const hash = await derivePinBits(pin, salt);
  const candidate = toHex(hash);
  // Constant-time-ish comparison — good enough for a 4-6 digit PIN, avoids
  // pulling in a timing-safe-equal polyfill for this low-stakes secret.
  if (candidate.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++)
    diff |= candidate.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

export function genSessionToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookieHeader(token: string, maxAgeSeconds: number): string {
  return `${CLEANER_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader(): string {
  return `${CLEANER_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
