import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSessionSecret,
  readStore,
  sanitizePublicUser,
  type StoredUser,
} from "./store";

export const SESSION_COOKIE_NAME = "vip_session_token";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

interface SessionPayload {
  u: string;
  exp: number;
}

function b64urlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Buffer {
  let padded = input.replace(/-/g, "+").replace(/_/g, "/");
  while (padded.length % 4) padded += "=";
  return Buffer.from(padded, "base64");
}

export function createSessionToken(username: string): string {
  const payload: SessionPayload = {
    u: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const encoded = b64urlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest();
  return `${encoded}.${b64urlEncode(sig)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [encoded, sigStr] = token.split(".");
    if (!encoded || !sigStr) return null;
    const expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(encoded)
      .digest();
    const actualSig = b64urlDecode(sigStr);
    if (expectedSig.length !== actualSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null;

    const parsed = JSON.parse(b64urlDecode(encoded).toString("utf8")) as SessionPayload;
    if (!parsed.u || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function attachSessionCookie(res: NextResponse, username: string): NextResponse {
  const token = createSessionToken(username);
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
    secure:
      process.env.COOKIE_SECURE === "1" ||
      (process.env.NODE_ENV === "production" && process.env.VERCEL === "1"),
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function getCurrentSessionUser(): Promise<StoredUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE_NAME)?.value;
    const payload = verifySessionToken(token);
    if (!payload) return null;
    const store = readStore();
    return store.users[payload.u] || null;
  } catch {
    return null;
  }
}

export async function requireAuthUser() {
  const user = await getCurrentSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Sesi tidak aktif. Silakan login terlebih dahulu." },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

export async function requireOwnerUser() {
  const user = await getCurrentSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Autentikasi diperlukan untuk akses Owner Panel." },
        { status: 401 }
      ),
    };
  }
  if (user.role !== "owner") {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Akses ditolak. Endpoint ini khusus akun Owner." },
        { status: 403 }
      ),
    };
  }
  return { user, error: null };
}

// ============ FIREBASE GOOGLE ID TOKEN VERIFICATION (RS256) ============
const FIREBASE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && cachedCerts.expiresAt > now) {
    return cachedCerts.certs;
  }
  const res = await fetch(FIREBASE_CERTS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Gagal mengambil sertifikat publik Google Firebase.");
  }
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  const certs = (await res.json()) as Record<string, string>;
  cachedCerts = {
    certs,
    expiresAt: now + Math.max(60, maxAgeSec - 30) * 1000,
  };
  return certs;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
}

export async function verifyFirebaseIdToken(
  idToken: string,
  expectedProjectId: string
): Promise<VerifiedFirebaseUser> {
  if (!expectedProjectId) {
    throw new Error("Firebase projectId belum dikonfigurasi di server.");
  }
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Format Firebase ID token tidak valid.");
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(b64urlDecode(headerB64).toString("utf8")) as {
    alg?: string;
    kid?: string;
  };
  const payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as {
    iss?: string;
    aud?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Algoritma atau key ID Firebase token tidak valid.");
  }

  const certs = await getFirebasePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error("Sertifikat penanda tangan Firebase tidak dikenali.");
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const validSig = verifier.verify(certPem, b64urlDecode(sigB64));
  if (!validSig) {
    throw new Error("Tanda tangan Firebase ID token tidak valid.");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) {
    throw new Error("Firebase ID token sudah kedaluwarsa.");
  }
  if (!payload.iat || payload.iat > nowSec + 300) {
    throw new Error("Waktu penerbitan Firebase ID token tidak valid.");
  }
  if (payload.aud !== expectedProjectId) {
    throw new Error("Audience Firebase token tidak cocok dengan projectId.");
  }
  if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) {
    throw new Error("Issuer Firebase token tidak cocok.");
  }
  if (!payload.sub || payload.sub.length > 128) {
    throw new Error("Subject UID Firebase tidak valid.");
  }

  return {
    uid: payload.sub,
    email: payload.email || "",
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || (payload.email ? payload.email.split("@")[0] : "Pilot"),
    picture: payload.picture || "",
  };
}

export { sanitizePublicUser };
