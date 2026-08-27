/**
 * Single-owner password gate for /admin/accounting. This is internal
 * financial data for one person, not a multi-user product, so a shared
 * password + signed session cookie is simpler than wiring up Supabase Auth
 * sign-up/sign-in for an account nobody else will ever use.
 *
 * Set the password once via `wrangler secret put ACCOUNTING_ADMIN_PASSWORD`.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";
const SESSION_COOKIE = "sc_accounting_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getAdmin() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function genToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ACCOUNTING_ADMIN_PASSWORD;
  if (!expected) return false;
  return candidate === expected;
}

export async function createAdminSession(): Promise<string> {
  const token = genToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const { error } = await getAdmin()
    .from("accounting_admin_sessions")
    .insert({ token, expires_at: expiresAt });
  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return token;
}

export async function verifyAdminSession(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return false;
  const token = match[1];

  const { data } = await getAdmin()
    .from("accounting_admin_sessions")
    .select("expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!data) return false;
  return new Date(data.expires_at as string).getTime() > Date.now();
}

export function sessionCookieHeader(token: string): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
