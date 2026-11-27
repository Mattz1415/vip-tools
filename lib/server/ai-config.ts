import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionSecret, type VpsStoreData } from "./store";

const execFileAsync = promisify(execFile);

export const AI_CONFIG_COOKIE_NAME = "vip_ai_cfg";
export const DEFAULT_AI_BASE_URL = "http://165.245.190.115:20128";
export const DEFAULT_AI_MODEL = "ag/gemini-3.8-flash";
const LOCAL_ROUTER_DB = "/root/.9router/db/data.sqlite";
const AI_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

let cachedLocalRouterKey: string | null = null;

export interface AiCookiePayload {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export type AiKeySource = "owner-store" | "owner-cookie" | "env" | "local-9router" | "none";

export interface EffectiveAiConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  hasApiKey: boolean;
  apiKeyMask: string;
  source: AiKeySource;
}

export function maskAiSecret(val?: string): string {
  const s = String(val || "").trim();
  if (!s) return "";
  if (s.length <= 8) return "*".repeat(s.length);
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

function deriveAesKey(): Buffer {
  return crypto.createHash("sha256").update(`ai-cfg:${getSessionSecret()}`).digest();
}

function encryptAiPayload(payload: AiCookiePayload): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveAesKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptAiPayload(token: string | undefined): AiCookiePayload | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [ivStr, tagStr, dataStr] = parts;
    const iv = Buffer.from(ivStr, "base64url");
    const tag = Buffer.from(tagStr, "base64url");
    const data = Buffer.from(dataStr, "base64url");
    if (iv.length !== 12 || tag.length !== 16) return null;

    const decipher = crypto.createDecipheriv("aes-256-gcm", deriveAesKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(decrypted) as Partial<AiCookiePayload>;
    return {
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl.trim() : "",
      model: typeof parsed.model === "string" ? parsed.model.trim() : "",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "",
    };
  } catch {
    return null;
  }
}

export async function readAiConfigCookie(): Promise<AiCookiePayload | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(AI_CONFIG_COOKIE_NAME)?.value;
    return decryptAiPayload(raw);
  } catch {
    return null;
  }
}

export function attachAiConfigCookie(res: NextResponse, payload: AiCookiePayload): NextResponse {
  const token = encryptAiPayload(payload);
  res.cookies.set(AI_CONFIG_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: AI_COOKIE_MAX_AGE_SEC,
    secure:
      process.env.COOKIE_SECURE === "1" ||
      (process.env.NODE_ENV === "production" && process.env.VERCEL === "1"),
  });
  return res;
}

export function clearAiConfigCookie(res: NextResponse): NextResponse {
  res.cookies.set(AI_CONFIG_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

async function resolveLocalNineRouterKey(): Promise<string> {
  if (cachedLocalRouterKey) return cachedLocalRouterKey;
  if (!fs.existsSync(LOCAL_ROUTER_DB)) return "";

  try {
    const { stdout } = await execFileAsync(
      "python3",
      [
        "-c",
        'import sqlite3,sys; conn=sqlite3.connect(sys.argv[1]); cur=conn.cursor(); cur.execute("SELECT key FROM apiKeys WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 1"); row=cur.fetchone(); print(row[0] if row and row[0] else "")',
        LOCAL_ROUTER_DB,
      ],
      { timeout: 4000 }
    );
    const key = String(stdout || "").trim();
    if (key) cachedLocalRouterKey = key;
    return key;
  } catch {
    return "";
  }
}

export async function resolveEffectiveAiConfig(store: VpsStoreData): Promise<EffectiveAiConfig> {
  const cookieCfg = await readAiConfigCookie();

  const storeBase = (store.settings.aiBaseUrl || "").trim();
  const cookieBase = (cookieCfg?.baseUrl || "").trim();
  const envBase = (process.env.NINEROUTER_BASE_URL || "").trim();
  const baseUrl = (
    (storeBase && storeBase !== DEFAULT_AI_BASE_URL ? storeBase : "") ||
    cookieBase ||
    storeBase ||
    envBase ||
    DEFAULT_AI_BASE_URL
  ).replace(/\/+$/, "");

  const storeModel = (store.settings.aiModel || "").trim();
  const cookieModel = (cookieCfg?.model || "").trim();
  const envModel = (process.env.NINEROUTER_MODEL || "").trim();
  const model =
    (storeModel && storeModel !== DEFAULT_AI_MODEL ? storeModel : "") ||
    cookieModel ||
    storeModel ||
    envModel ||
    DEFAULT_AI_MODEL;

  const storeKey = (store.settings.aiApiKey || "").trim();
  const cookieKey = (cookieCfg?.apiKey || "").trim();
  const envKey = (process.env.NINEROUTER_API_KEY || process.env.AI_ROUTER_API_KEY || "").trim();

  let apiKey = "";
  let source: AiKeySource = "none";

  if (storeKey) {
    apiKey = storeKey;
    source = "owner-store";
  } else if (cookieKey) {
    apiKey = cookieKey;
    source = "owner-cookie";
  } else if (envKey) {
    apiKey = envKey;
    source = "env";
  } else {
    const localKey = await resolveLocalNineRouterKey();
    if (localKey) {
      apiKey = localKey;
      source = "local-9router";
    }
  }

  return {
    baseUrl,
    model,
    apiKey,
    hasApiKey: Boolean(apiKey),
    apiKeyMask: maskAiSecret(apiKey),
    source,
  };
}
