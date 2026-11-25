import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type UserRole = "owner" | "admin" | "member";
export type ThemeKey = "hitam" | "abu" | "putih";
export type StorageMode = "vps-disk" | "tmp-disk" | "memory";

export interface StoredUser {
  username: string;
  passwordHash: string;
  role: UserRole;
  provider: "local" | "google";
  email?: string;
  googleUid?: string;
  displayName?: string;
  photoUrl?: string;
  chatLimit: number;
  createdAt: number;
  lastLoginAt: number;
}

export interface CustomTool {
  id: string;
  name: string;
  url: string;
  desc: string;
  category: string;
  icon: string;
  badge: string;
  isTelegram: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "admin";
  username: string;
  text: string;
  time: number;
}

export interface ShortLink {
  code: string;
  url: string;
  clicks: number;
  createdBy: string;
  createdAt: number;
}

export interface PasteEntry {
  id: string;
  title: string;
  lang: string;
  content: string;
  views: number;
  createdBy: string;
  createdAt: number;
}

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface GlobalSettings {
  defaultTheme: ThemeKey;
  announcement: string;
  maintenanceMode: boolean;
  bgVideoUrl: string;
  homeRotate: number;
  visits: number;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface AuditLogEntry {
  id: string;
  time: number;
  actor: string;
  action: string;
  detail: string;
}

export interface VpsStoreData {
  users: Record<string, StoredUser>;
  ownerEmails: string[];
  customTools: CustomTool[];
  hiddenTools: string[];
  chatMessages: ChatMessage[];
  shortLinks: ShortLink[];
  pastes: PasteEntry[];
  settings: GlobalSettings;
  firebaseConfig: FirebaseWebConfig;
  auditLogs: AuditLogEntry[];
}

interface ResolvedStorage {
  dir: string | null;
  mode: StorageMode;
}

interface GlobalStoreRuntime {
  resolvedStorage: ResolvedStorage | null;
  memoryStore: VpsStoreData | null;
  cachedDefaultOwnerHash: string | null;
  cachedSessionSecret: string | null;
}

const g = globalThis as unknown as { __mattzlmVpsState?: GlobalStoreRuntime };
if (!g.__mattzlmVpsState) {
  g.__mattzlmVpsState = {
    resolvedStorage: null,
    memoryStore: null,
    cachedDefaultOwnerHash: null,
    cachedSessionSecret: null,
  };
}
const runtimeState = g.__mattzlmVpsState;

function isWritableDir(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    const probe = path.join(dir, `.probe.${process.pid}.${Date.now()}`);
    fs.writeFileSync(probe, "1", { mode: 0o600 });
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function resolveStorage(): ResolvedStorage {
  if (runtimeState.resolvedStorage) return runtimeState.resolvedStorage;

  const envDir = (process.env.VPS_DATA_DIR || "").trim();
  if (envDir && isWritableDir(envDir)) {
    runtimeState.resolvedStorage = { dir: envDir, mode: "vps-disk" };
    return runtimeState.resolvedStorage;
  }

  const cwdData = path.join(process.cwd(), "data");
  if (isWritableDir(cwdData)) {
    runtimeState.resolvedStorage = { dir: cwdData, mode: "vps-disk" };
    return runtimeState.resolvedStorage;
  }

  const tmpData = path.join(os.tmpdir(), "mattzlm-vip-tools-data");
  if (isWritableDir(tmpData)) {
    runtimeState.resolvedStorage = { dir: tmpData, mode: "tmp-disk" };
    return runtimeState.resolvedStorage;
  }

  runtimeState.resolvedStorage = { dir: null, mode: "memory" };
  return runtimeState.resolvedStorage;
}

export function getStorageMode(): StorageMode {
  return resolveStorage().mode;
}

function getStorePath(): string | null {
  const { dir } = resolveStorage();
  return dir ? path.join(dir, "store.json") : null;
}

function getSecretPath(): string | null {
  const { dir } = resolveStorage();
  return dir ? path.join(dir, ".secret") : null;
}

function getCookiesFilePath(): string | null {
  const { dir } = resolveStorage();
  return dir ? path.join(dir, "yt-cookies.txt") : null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const [, salt, hashHex] = stored.split(":");
    if (!salt || !hashHex) return false;
    try {
      const derived = crypto.scryptSync(password, salt, 64);
      const expected = Buffer.from(hashHex, "hex");
      if (derived.length !== expected.length) return false;
      return crypto.timingSafeEqual(derived, expected);
    } catch {
      return false;
    }
  }
  return false;
}

function getDefaultOwnerUser(now: number): StoredUser {
  if (!runtimeState.cachedDefaultOwnerHash) {
    runtimeState.cachedDefaultOwnerHash = hashPassword("123mamat@#");
  }
  return {
    username: "matt",
    passwordHash: runtimeState.cachedDefaultOwnerHash,
    role: "owner",
    provider: "local",
    displayName: "MattzLM (Owner)",
    chatLimit: 999999,
    createdAt: now,
    lastLoginAt: now,
  };
}

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (runtimeState.cachedSessionSecret) return runtimeState.cachedSessionSecret;

  const storage = resolveStorage();
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (storage.mode === "vps-disk" && !isServerless) {
    const secretPath = getSecretPath();
    if (secretPath) {
      try {
        if (fs.existsSync(secretPath)) {
          const existing = fs.readFileSync(secretPath, "utf8").trim();
          if (existing.length >= 32) {
            runtimeState.cachedSessionSecret = existing;
            return existing;
          }
        }
        const generated = crypto.randomBytes(48).toString("hex");
        fs.writeFileSync(secretPath, generated, { mode: 0o600 });
        runtimeState.cachedSessionSecret = generated;
        return generated;
      } catch {
        // fall through to deterministic secret below
      }
    }
  }

  // Deterministic fallback for ephemeral serverless / read-only runtimes when SESSION_SECRET is unset
  const seed =
    process.env.VERCEL_PROJECT_ID ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    process.env.HOSTNAME ||
    "mattzlm-vip-tools-local";
  runtimeState.cachedSessionSecret = crypto
    .createHmac("sha256", "mattzlm-vip-tools-session-fallback-v2")
    .update(seed)
    .digest("hex");
  return runtimeState.cachedSessionSecret;
}

export function getYtCookiesPath(): string {
  return getCookiesFilePath() || path.join(os.tmpdir(), "mattzlm-yt-cookies.txt");
}

export function hasYtCookies(): boolean {
  try {
    const p = getCookiesFilePath();
    if (!p) return false;
    return fs.existsSync(p) && fs.statSync(p).size > 20;
  } catch {
    return false;
  }
}

export function saveYtCookies(content: string): void {
  const p = getCookiesFilePath();
  if (!p) {
    throw new Error("Filesystem server hanya baca (read-only); yt-cookies.txt tidak dapat disimpan.");
  }
  const trimmed = content.trim();
  if (!trimmed) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return;
  }
  fs.writeFileSync(p, trimmed + "\n", { mode: 0o600 });
}

function getEnvOwnerEmails(): string[] {
  const raw = process.env.OWNER_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function getEnvFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
}

function getDefaultSettings(): GlobalSettings {
  return {
    defaultTheme: "hitam",
    announcement:
      "Akses MattzLM gratis; seluruh modul berjalan langsung di server VPS.",
    maintenanceMode: false,
    bgVideoUrl: "https://c.termai.cc/v131/H4vF9D.mp4",
    homeRotate: 0,
    visits: 0,
    telegramBotToken: "",
    telegramChatId: "",
  };
}

function createInitialStore(): VpsStoreData {
  const now = Date.now();
  return {
    users: {
      matt: getDefaultOwnerUser(now),
    },
    ownerEmails: getEnvOwnerEmails(),
    customTools: [],
    hiddenTools: [],
    chatMessages: [],
    shortLinks: [],
    pastes: [],
    settings: getDefaultSettings(),
    firebaseConfig: getEnvFirebaseConfig(),
    auditLogs: [
      {
        id: "init_" + now,
        time: now,
        actor: "system",
        action: "VPS_STORE_INIT",
        detail: "Store awal dibuat bersama akun owner default matt.",
      },
    ],
  };
}

export function writeStore(data: VpsStoreData): void {
  runtimeState.memoryStore = data;
  const storePath = getStorePath();
  if (!storePath) return;
  try {
    const tmpPath = storePath + ".tmp." + process.pid + "." + Date.now();
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(tmpPath, storePath);
  } catch {
    // Gracefully keep data in memory if disk becomes unavailable or read-only
  }
}

export function readStore(): VpsStoreData {
  const storePath = getStorePath();

  if (!storePath) {
    if (!runtimeState.memoryStore) {
      runtimeState.memoryStore = createInitialStore();
    }
    return runtimeState.memoryStore;
  }

  try {
    if (!fs.existsSync(storePath)) {
      const initial = runtimeState.memoryStore || createInitialStore();
      writeStore(initial);
      return initial;
    }

    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<VpsStoreData>;
    const now = Date.now();
    const defaultSettings = getDefaultSettings();
    const defaultFb = getEnvFirebaseConfig();

    const users: Record<string, StoredUser> =
      parsed.users && typeof parsed.users === "object" ? { ...parsed.users } : {};

    let needsSave = false;
    if (!users.matt) {
      users.matt = getDefaultOwnerUser(now);
      needsSave = true;
    } else if (users.matt.role !== "owner") {
      users.matt = { ...users.matt, role: "owner" };
      needsSave = true;
    }

    const merged: VpsStoreData = {
      users,
      ownerEmails: Array.isArray(parsed.ownerEmails) ? parsed.ownerEmails : getEnvOwnerEmails(),
      customTools: Array.isArray(parsed.customTools) ? parsed.customTools : [],
      hiddenTools: Array.isArray(parsed.hiddenTools) ? parsed.hiddenTools : [],
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
      shortLinks: Array.isArray(parsed.shortLinks) ? parsed.shortLinks : [],
      pastes: Array.isArray(parsed.pastes) ? parsed.pastes : [],
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      firebaseConfig: { ...defaultFb, ...(parsed.firebaseConfig || {}) },
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    };

    runtimeState.memoryStore = merged;
    if (needsSave) {
      writeStore(merged);
    }
    return merged;
  } catch {
    if (!runtimeState.memoryStore) {
      runtimeState.memoryStore = createInitialStore();
    }
    writeStore(runtimeState.memoryStore);
    return runtimeState.memoryStore;
  }
}

export function updateStore<T>(mutator: (data: VpsStoreData) => T): T {
  const data = readStore();
  const result = mutator(data);
  writeStore(data);
  return result;
}

export function appendAuditLog(data: VpsStoreData, actor: string, action: string, detail: string): void {
  data.auditLogs.unshift({
    id: "log_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    time: Date.now(),
    actor,
    action,
    detail: detail.slice(0, 260),
  });
  if (data.auditLogs.length > 100) {
    data.auditLogs = data.auditLogs.slice(0, 100);
  }
}

export function getEffectiveFirebaseConfig(store?: VpsStoreData): FirebaseWebConfig {
  const s = store || readStore();
  const envCfg = getEnvFirebaseConfig();
  return {
    apiKey: s.firebaseConfig.apiKey || envCfg.apiKey,
    authDomain: s.firebaseConfig.authDomain || envCfg.authDomain,
    projectId: s.firebaseConfig.projectId || envCfg.projectId,
    storageBucket: s.firebaseConfig.storageBucket || envCfg.storageBucket,
    messagingSenderId: s.firebaseConfig.messagingSenderId || envCfg.messagingSenderId,
    appId: s.firebaseConfig.appId || envCfg.appId,
  };
}

export function isFirebaseReady(cfg: FirebaseWebConfig): boolean {
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

export function isOwnerEmail(email: string, store: VpsStoreData): boolean {
  const clean = email.trim().toLowerCase();
  if (!clean) return false;
  const all = new Set([
    ...getEnvOwnerEmails(),
    ...store.ownerEmails.map((e) => e.trim().toLowerCase()),
  ]);
  return all.has(clean);
}

export function sanitizePublicUser(u: StoredUser) {
  return {
    username: u.username,
    role: u.role,
    provider: u.provider,
    email: u.email || "",
    displayName: u.displayName || u.username,
    photoUrl: u.photoUrl || "",
    chatLimit: u.role === "owner" ? 999999 : u.chatLimit,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}
