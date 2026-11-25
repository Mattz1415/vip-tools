import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type UserRole = "owner" | "admin" | "member";
export type ThemeKey = "hitam" | "abu" | "putih";

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

export interface SiteSettings {
  defaultTheme: ThemeKey;
  announcement: string;
  maintenanceMode: boolean;
  bgVideoUrl: string;
  homeRotate: number;
  visits: number;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface AuditLog {
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
  settings: SiteSettings;
  firebaseConfig: FirebaseWebConfig;
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const SECRET_PATH = path.join(DATA_DIR, ".secret");
const COOKIES_PATH = path.join(DATA_DIR, "yt-cookies.txt");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
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
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  }
  return false;
}

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  ensureDataDir();
  if (fs.existsSync(SECRET_PATH)) {
    const existing = fs.readFileSync(SECRET_PATH, "utf8").trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(SECRET_PATH, generated, { mode: 0o600 });
  return generated;
}

export function getYtCookiesPath(): string {
  ensureDataDir();
  return COOKIES_PATH;
}

export function hasYtCookies(): boolean {
  try {
    return fs.existsSync(COOKIES_PATH) && fs.statSync(COOKIES_PATH).size > 20;
  } catch {
    return false;
  }
}

export function saveYtCookies(content: string): void {
  ensureDataDir();
  const trimmed = content.trim();
  if (!trimmed) {
    if (fs.existsSync(COOKIES_PATH)) fs.unlinkSync(COOKIES_PATH);
    return;
  }
  fs.writeFileSync(COOKIES_PATH, trimmed + "\n", { mode: 0o600 });
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

function createInitialStore(): VpsStoreData {
  const now = Date.now();
  return {
    users: {
      matt: {
        username: "matt",
        passwordHash: hashPassword("123mamat@#"),
        role: "owner",
        provider: "local",
        displayName: "MattzLM (Owner)",
        chatLimit: 999999,
        createdAt: now,
        lastLoginAt: now,
      },
    },
    ownerEmails: getEnvOwnerEmails(),
    customTools: [],
    hiddenTools: [],
    chatMessages: [],
    shortLinks: [],
    pastes: [],
    settings: {
      defaultTheme: "hitam",
      announcement:
        "Aplikasi ini gratis dari MattzLM. Terintegrasi langsung dengan server VPS untuk semua modul utilitas.",
      maintenanceMode: false,
      bgVideoUrl: "https://c.termai.cc/v131/H4vF9D.mp4",
      homeRotate: 0,
      visits: 0,
      telegramBotToken: "",
      telegramChatId: "",
    },
    firebaseConfig: getEnvFirebaseConfig(),
    auditLogs: [
      {
        id: "init_" + now,
        time: now,
        actor: "system",
        action: "VPS_STORE_INIT",
        detail: "Database JSON VPS diinisialisasi dengan akun owner default matt.",
      },
    ],
  };
}

export function readStore(): VpsStoreData {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    const initial = createInitialStore();
    writeStore(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<VpsStoreData>;
    const defaults = createInitialStore();
    const merged: VpsStoreData = {
      users: parsed.users && typeof parsed.users === "object" ? parsed.users : defaults.users,
      ownerEmails: Array.isArray(parsed.ownerEmails) ? parsed.ownerEmails : defaults.ownerEmails,
      customTools: Array.isArray(parsed.customTools) ? parsed.customTools : [],
      hiddenTools: Array.isArray(parsed.hiddenTools) ? parsed.hiddenTools : [],
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
      shortLinks: Array.isArray(parsed.shortLinks) ? parsed.shortLinks : [],
      pastes: Array.isArray(parsed.pastes) ? parsed.pastes : [],
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      firebaseConfig: { ...defaults.firebaseConfig, ...(parsed.firebaseConfig || {}) },
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : defaults.auditLogs,
    };

    // Always ensure primary owner account 'matt' exists and keeps owner role
    if (!merged.users.matt) {
      merged.users.matt = defaults.users.matt;
      writeStore(merged);
    } else if (merged.users.matt.role !== "owner") {
      merged.users.matt.role = "owner";
      writeStore(merged);
    }

    return merged;
  } catch {
    const fallback = createInitialStore();
    writeStore(fallback);
    return fallback;
  }
}

export function writeStore(data: VpsStoreData): void {
  ensureDataDir();
  const tmpPath = STORE_PATH + ".tmp." + process.pid + "." + Date.now();
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmpPath, STORE_PATH);
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
