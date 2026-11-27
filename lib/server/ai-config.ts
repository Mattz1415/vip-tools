import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AI_MODEL_OPTIONS,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  maskSecretApiKey,
  normalizeAiModelChoice,
  validateAiApiKeyInput,
  validateAiBaseUrlInput,
  type AiSecretSource,
  type OwnerAiSecretStatus,
} from "@/lib/ai-secrets-logic";
import {
  computeAiRuntimeVaultId,
  computeLegacyAiRuntimeVaultId,
  decryptSecretText,
  ENC_PREFIX,
  encryptSecretText,
} from "./ai-crypto";
import { sanitizePublicError } from "./net-guard";
import {
  getEffectiveFirebaseConfig,
  getStorageDir,
  getStorageMode,
  isFirebaseReady,
  updateStore,
  type FirebaseWebConfig,
  type VpsStoreData,
} from "./store";

export {
  AI_MODEL_OPTIONS,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  maskSecretApiKey,
  normalizeAiModelChoice,
  validateAiApiKeyInput,
  validateAiBaseUrlInput,
  type AiSecretSource,
  type OwnerAiSecretStatus,
};

const execFileAsync = promisify(execFile);

export const AI_CONFIG_COOKIE_NAME = "vip_ai_cfg";
const LOCAL_ROUTER_DB = "/root/.9router/db/data.sqlite";
const AI_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;
const HYDRATE_MISS_COOLDOWN_MS = 4000;

export interface AiCookiePayload {
  baseUrl: string;
  model: string;
  apiKey: string;
  updatedAtMs?: number;
}

export interface StoredAiSecretRecord {
  encryptedApiKey: string;
  baseUrl: string;
  model: string;
  updatedAtMs: number;
}

export interface EffectiveAiConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  hasApiKey: boolean;
  apiKeyMask: string;
  source: AiSecretSource;
  status: OwnerAiSecretStatus;
}

interface FirestoreFieldValue {
  stringValue?: string;
  timestampValue?: string;
}

interface FirestoreDocResponse {
  fields?: Record<string, FirestoreFieldValue>;
}

interface GlobalAiSecretState {
  record: StoredAiSecretRecord | null;
  hydratePromise: Promise<{ record: StoredAiSecretRecord | null; fromCloud: boolean }> | null;
  lastHydrateMissAtMs: number;
  syncedVaultSignature: string;
  cachedLocalRouterKey: string | null;
  checkedLocalRouter: boolean;
}

const g = globalThis as typeof globalThis & {
  __vipToolsAiSecretState?: GlobalAiSecretState;
};

function getAiState(): GlobalAiSecretState {
  if (!g.__vipToolsAiSecretState) {
    g.__vipToolsAiSecretState = {
      record: null,
      hydratePromise: null,
      lastHydrateMissAtMs: 0,
      syncedVaultSignature: "",
      cachedLocalRouterKey: null,
      checkedLocalRouter: false,
    };
  }
  return g.__vipToolsAiSecretState;
}

export function maskAiSecret(val?: string): string {
  return maskSecretApiKey(val);
}

function getVaultFilePath(): string | null {
  const dir = getStorageDir();
  return dir ? path.join(dir, "ai-secrets.json") : null;
}

function buildVaultSignature(record: StoredAiSecretRecord): string {
  return `${record.encryptedApiKey}::${record.baseUrl}::${record.model}`;
}

function safeDecryptStoredKey(
  rawValue: string | undefined,
  fbCfg?: Partial<FirebaseWebConfig>
): string {
  const trimmed = (rawValue || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(ENC_PREFIX)) {
    try {
      return decryptSecretText(trimmed, fbCfg).trim();
    } catch {
      return "";
    }
  }
  // Legacy plaintext stored in store.json before enc:v1 vault upgrade
  return trimmed;
}

function isValidStoredRecord(raw: unknown): raw is StoredAiSecretRecord {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.encryptedApiKey === "string" &&
    typeof obj.baseUrl === "string" &&
    typeof obj.model === "string" &&
    typeof obj.updatedAtMs === "number"
  );
}

function readStoredAiSecretRecord(
  store: VpsStoreData,
  fbCfg: FirebaseWebConfig
): StoredAiSecretRecord | null {
  const state = getAiState();
  if (state.record) {
    if (!state.record.encryptedApiKey || safeDecryptStoredKey(state.record.encryptedApiKey, fbCfg)) {
      return state.record;
    }
    state.record = null;
  }

  const vaultFile = getVaultFilePath();
  if (vaultFile) {
    try {
      if (fs.existsSync(vaultFile)) {
        const parsed = JSON.parse(fs.readFileSync(vaultFile, "utf8")) as unknown;
        if (isValidStoredRecord(parsed)) {
          const plain = parsed.encryptedApiKey
            ? safeDecryptStoredKey(parsed.encryptedApiKey, fbCfg)
            : "";
          if (!parsed.encryptedApiKey || plain) {
            const baseCheck = validateAiBaseUrlInput(parsed.baseUrl);
            const record: StoredAiSecretRecord = {
              encryptedApiKey: parsed.encryptedApiKey,
              baseUrl: baseCheck.valid ? baseCheck.cleaned : DEFAULT_AI_BASE_URL,
              model: normalizeAiModelChoice(parsed.model),
              updatedAtMs: parsed.updatedAtMs,
            };
            state.record = record;
            return record;
          }
        }
      }
    } catch {
      // ignore corrupt vault file and fall back to store.settings
    }
  }

  const storeKeyRaw = (store.settings.aiApiKey || "").trim();
  if (storeKeyRaw) {
    const plain = safeDecryptStoredKey(storeKeyRaw, fbCfg);
    if (plain) {
      const baseCheck = validateAiBaseUrlInput(store.settings.aiBaseUrl || DEFAULT_AI_BASE_URL);
      const encryptedApiKey = storeKeyRaw.startsWith(ENC_PREFIX)
        ? storeKeyRaw
        : encryptSecretText(plain);
      const record: StoredAiSecretRecord = {
        encryptedApiKey,
        baseUrl: baseCheck.valid ? baseCheck.cleaned : DEFAULT_AI_BASE_URL,
        model: normalizeAiModelChoice(store.settings.aiModel),
        updatedAtMs: Date.now(),
      };
      state.record = record;
      return record;
    }
  }

  return null;
}

function writeStoredAiSecretRecord(record: StoredAiSecretRecord | null): void {
  const state = getAiState();
  state.record = record;
  state.lastHydrateMissAtMs = 0;
  if (!record) {
    state.syncedVaultSignature = "";
  }

  const vaultFile = getVaultFilePath();
  if (vaultFile) {
    try {
      if (!record) {
        if (fs.existsSync(vaultFile)) {
          fs.unlinkSync(vaultFile);
        }
      } else {
        const dir = path.dirname(vaultFile);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }
        fs.writeFileSync(vaultFile, JSON.stringify(record, null, 2), {
          encoding: "utf8",
          mode: 0o600,
        });
      }
    } catch {
      // Keep globalThis cache active even if disk persistence is restricted
    }
  }

  updateStore((store) => {
    if (!record) {
      store.settings.aiApiKey = "";
    } else {
      store.settings.aiBaseUrl = record.baseUrl;
      store.settings.aiModel = record.model;
      store.settings.aiApiKey = record.encryptedApiKey;
    }
  });
}

function getFirestoreBaseUrls(fbCfg: FirebaseWebConfig): {
  docPrefix: string;
  baseUrl: string;
} {
  const docPrefix = `projects/${fbCfg.projectId}/databases/(default)/documents`;
  return {
    docPrefix,
    baseUrl: `https://firestore.googleapis.com/v1/${docPrefix}`,
  };
}

async function fetchFirestoreAiDoc(
  fbCfg: FirebaseWebConfig,
  docPath: string,
  ownerIdToken?: string
): Promise<StoredAiSecretRecord | null> {
  if (!isFirebaseReady(fbCfg)) return null;
  const { baseUrl } = getFirestoreBaseUrls(fbCfg);
  const url = ownerIdToken
    ? `${baseUrl}/${docPath}`
    : `${baseUrl}/${docPath}?key=${encodeURIComponent(fbCfg.apiKey)}`;
  const headers: Record<string, string> = {};
  if (ownerIdToken) {
    headers.Authorization = `Bearer ${ownerIdToken}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as FirestoreDocResponse;
    const encryptedApiKey = String(json.fields?.encryptedApiKey?.stringValue ?? "").trim();
    if (!encryptedApiKey || !safeDecryptStoredKey(encryptedApiKey, fbCfg)) {
      return null;
    }
    const baseCheck = validateAiBaseUrlInput(
      json.fields?.aiBaseUrl?.stringValue ?? DEFAULT_AI_BASE_URL
    );
    const model = normalizeAiModelChoice(json.fields?.aiModel?.stringValue ?? DEFAULT_AI_MODEL);
    const tsRaw = json.fields?.updatedAt?.timestampValue;
    const parsedTs = tsRaw ? Date.parse(tsRaw) : Date.now();
    return {
      encryptedApiKey,
      baseUrl: baseCheck.valid ? baseCheck.cleaned : DEFAULT_AI_BASE_URL,
      model,
      updatedAtMs: Number.isFinite(parsedTs) ? parsedTs : Date.now(),
    };
  } catch {
    return null;
  }
}

async function checkFirestoreDocExists(
  fbCfg: FirebaseWebConfig,
  docPath: string,
  ownerIdToken: string
): Promise<boolean> {
  const { baseUrl } = getFirestoreBaseUrls(fbCfg);
  try {
    const res = await fetch(`${baseUrl}/${docPath}`, {
      headers: { Authorization: `Bearer ${ownerIdToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function writeAiSecretToFirestore(
  fbCfg: FirebaseWebConfig,
  record: StoredAiSecretRecord | null,
  ownerIdToken?: string,
  ownerUid?: string
): Promise<boolean> {
  if (!isFirebaseReady(fbCfg) || !ownerIdToken || !ownerUid) {
    return false;
  }

  const { docPrefix, baseUrl } = getFirestoreBaseUrls(fbCfg);
  const vaultId = computeAiRuntimeVaultId();
  const docPaths = ["ownerSecrets/config", `aiRuntimeSecrets/${vaultId}`];

  try {
    if (!record || !record.encryptedApiKey) {
      const res = await fetch(`${baseUrl}:commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerIdToken}`,
        },
        body: JSON.stringify({
          writes: docPaths.map((p) => ({
            delete: `${docPrefix}/${p}`,
          })),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        getAiState().syncedVaultSignature = "";
      }
      return res.ok;
    }

    const existsFlags = await Promise.all(
      docPaths.map((p) => checkFirestoreDocExists(fbCfg, p, ownerIdToken))
    );

    const writes = docPaths.map((p, idx) => {
      const exists = existsFlags[idx];
      if (exists) {
        return {
          update: {
            name: `${docPrefix}/${p}`,
            fields: {
              encryptedApiKey: { stringValue: record.encryptedApiKey },
              aiBaseUrl: { stringValue: record.baseUrl },
              aiModel: { stringValue: record.model },
            },
          },
          updateMask: {
            fieldPaths: ["encryptedApiKey", "aiBaseUrl", "aiModel", "updatedAt"],
          },
          updateTransforms: [{ fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" }],
          currentDocument: { exists: true },
        };
      }
      return {
        update: {
          name: `${docPrefix}/${p}`,
          fields: {
            encryptedApiKey: { stringValue: record.encryptedApiKey },
            aiBaseUrl: { stringValue: record.baseUrl },
            aiModel: { stringValue: record.model },
            ownerUid: { stringValue: ownerUid },
          },
        },
        updateTransforms: [{ fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" }],
        currentDocument: { exists: false },
      };
    });

    const res = await fetch(`${baseUrl}:commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerIdToken}`,
      },
      body: JSON.stringify({ writes }),
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      getAiState().syncedVaultSignature = buildVaultSignature(record);
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function hydrateAiSecretFromFirestore(
  store: VpsStoreData,
  fbCfg: FirebaseWebConfig,
  ownerIdToken?: string,
  ownerUid?: string
): Promise<{ record: StoredAiSecretRecord | null; fromCloud: boolean }> {
  const state = getAiState();
  const localRecord = readStoredAiSecretRecord(store, fbCfg);
  const cloudReady = isFirebaseReady(fbCfg);

  if (localRecord && localRecord.encryptedApiKey) {
    if (cloudReady && ownerIdToken && ownerUid) {
      const signature = buildVaultSignature(localRecord);
      if (state.syncedVaultSignature !== signature) {
        const vaultId = computeAiRuntimeVaultId();
        const runtimeDoc = await fetchFirestoreAiDoc(fbCfg, `aiRuntimeSecrets/${vaultId}`);
        if (
          !runtimeDoc ||
          runtimeDoc.encryptedApiKey !== localRecord.encryptedApiKey ||
          runtimeDoc.baseUrl !== localRecord.baseUrl ||
          runtimeDoc.model !== localRecord.model
        ) {
          await writeAiSecretToFirestore(fbCfg, localRecord, ownerIdToken, ownerUid);
        } else {
          state.syncedVaultSignature = signature;
        }
      }
    }
    return { record: localRecord, fromCloud: false };
  }

  if (!cloudReady) {
    return { record: localRecord, fromCloud: false };
  }

  const now = Date.now();
  if (
    !ownerIdToken &&
    state.lastHydrateMissAtMs &&
    now - state.lastHydrateMissAtMs < HYDRATE_MISS_COOLDOWN_MS
  ) {
    return { record: localRecord, fromCloud: false };
  }

  if (state.hydratePromise) {
    return state.hydratePromise;
  }

  const promise = (async (): Promise<{ record: StoredAiSecretRecord | null; fromCloud: boolean }> => {
    try {
      const vaultId = computeAiRuntimeVaultId();
      const fromRuntime = await fetchFirestoreAiDoc(fbCfg, `aiRuntimeSecrets/${vaultId}`);
      if (fromRuntime) {
        writeStoredAiSecretRecord(fromRuntime);
        state.syncedVaultSignature = buildVaultSignature(fromRuntime);
        return { record: fromRuntime, fromCloud: true };
      }

      const legacyVaultId = computeLegacyAiRuntimeVaultId(fbCfg);
      if (legacyVaultId !== vaultId) {
        const fromLegacy = await fetchFirestoreAiDoc(fbCfg, `aiRuntimeSecrets/${legacyVaultId}`);
        if (fromLegacy) {
          const plain = safeDecryptStoredKey(fromLegacy.encryptedApiKey, fbCfg);
          if (plain) {
            const reEncrypted: StoredAiSecretRecord = {
              encryptedApiKey: encryptSecretText(plain),
              baseUrl: fromLegacy.baseUrl,
              model: fromLegacy.model,
              updatedAtMs: fromLegacy.updatedAtMs,
            };
            writeStoredAiSecretRecord(reEncrypted);
            if (ownerIdToken && ownerUid) {
              await writeAiSecretToFirestore(fbCfg, reEncrypted, ownerIdToken, ownerUid);
            }
            return { record: reEncrypted, fromCloud: true };
          }
        }
      }

      if (ownerIdToken) {
        const fromOwnerDoc = await fetchFirestoreAiDoc(fbCfg, "ownerSecrets/config", ownerIdToken);
        if (fromOwnerDoc) {
          const plain = safeDecryptStoredKey(fromOwnerDoc.encryptedApiKey, fbCfg);
          const normalized: StoredAiSecretRecord = plain
            ? {
                encryptedApiKey: encryptSecretText(plain),
                baseUrl: fromOwnerDoc.baseUrl,
                model: fromOwnerDoc.model,
                updatedAtMs: fromOwnerDoc.updatedAtMs,
              }
            : fromOwnerDoc;
          writeStoredAiSecretRecord(normalized);
          if (ownerUid) {
            await writeAiSecretToFirestore(fbCfg, normalized, ownerIdToken, ownerUid);
          }
          return { record: normalized, fromCloud: true };
        }
      }

      state.lastHydrateMissAtMs = Date.now();
      return { record: localRecord, fromCloud: false };
    } finally {
      state.hydratePromise = null;
    }
  })();

  state.hydratePromise = promise;
  return promise;
}

export async function readAiConfigCookie(
  fbCfg?: Partial<FirebaseWebConfig>
): Promise<AiCookiePayload | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(AI_CONFIG_COOKIE_NAME)?.value;
    if (!raw) return null;
    const decrypted = decryptSecretText(raw, fbCfg);
    const parsed = JSON.parse(decrypted) as Partial<AiCookiePayload>;
    return {
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl.trim() : "",
      model: typeof parsed.model === "string" ? parsed.model.trim() : "",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "",
      updatedAtMs:
        typeof parsed.updatedAtMs === "number" && Number.isFinite(parsed.updatedAtMs)
          ? parsed.updatedAtMs
          : undefined,
    };
  } catch {
    return null;
  }
}

export function attachAiConfigCookie(
  res: NextResponse,
  payload: AiCookiePayload
): NextResponse {
  const token = encryptSecretText(
    JSON.stringify({
      ...payload,
      updatedAtMs: payload.updatedAtMs ?? Date.now(),
    })
  );
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
  const state = getAiState();
  if (state.checkedLocalRouter) return state.cachedLocalRouterKey || "";
  state.checkedLocalRouter = true;

  if (process.env.VERCEL === "1" || !fs.existsSync(LOCAL_ROUTER_DB)) {
    state.cachedLocalRouterKey = "";
    return "";
  }

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
    state.cachedLocalRouterKey = key;
    return key;
  } catch {
    state.cachedLocalRouterKey = "";
    return "";
  }
}

export async function resolveEffectiveAiConfig(
  store: VpsStoreData,
  ownerIdToken?: string,
  ownerUid?: string,
  options?: { ignoreCookie?: boolean }
): Promise<EffectiveAiConfig> {
  const fbCfg = getEffectiveFirebaseConfig(store);
  const state = getAiState();
  const { record, fromCloud } = await hydrateAiSecretFromFirestore(
    store,
    fbCfg,
    ownerIdToken,
    ownerUid
  );
  const cookieCfg = options?.ignoreCookie ? null : await readAiConfigCookie(fbCfg);

  const vaultPlainKey = record?.encryptedApiKey
    ? safeDecryptStoredKey(record.encryptedApiKey, fbCfg)
    : "";
  const cookieKey = (cookieCfg?.apiKey || "").trim();
  const cookieDiffersFromVault =
    Boolean(cookieKey && cookieKey !== vaultPlainKey) ||
    Boolean(cookieCfg?.baseUrl && cookieCfg.baseUrl !== record?.baseUrl) ||
    Boolean(cookieCfg?.model && cookieCfg.model !== record?.model);
  const cookieIsNewer = Boolean(
    cookieCfg &&
      cookieKey &&
      (!vaultPlainKey ||
        ((cookieCfg.updatedAtMs || 0) > (record?.updatedAtMs || 0) && cookieDiffersFromVault))
  );

  const storeBase = (store.settings.aiBaseUrl || "").trim();
  const customStoreBase = storeBase && storeBase !== DEFAULT_AI_BASE_URL ? storeBase : "";
  const envBase = (process.env.NINEROUTER_BASE_URL || "").trim();
  const rawBase =
    (cookieIsNewer ? cookieCfg?.baseUrl : "") ||
    record?.baseUrl ||
    cookieCfg?.baseUrl ||
    customStoreBase ||
    envBase ||
    storeBase ||
    DEFAULT_AI_BASE_URL;
  const baseCheck = validateAiBaseUrlInput(rawBase);
  const baseUrl = (baseCheck.valid ? baseCheck.cleaned : DEFAULT_AI_BASE_URL).replace(/\/+$/, "");

  const storeModel = (store.settings.aiModel || "").trim();
  const customStoreModel = storeModel && storeModel !== DEFAULT_AI_MODEL ? storeModel : "";
  const envModel = (process.env.NINEROUTER_MODEL || "").trim();
  const model = normalizeAiModelChoice(
    (cookieIsNewer ? cookieCfg?.model : "") ||
      record?.model ||
      cookieCfg?.model ||
      customStoreModel ||
      envModel ||
      storeModel ||
      DEFAULT_AI_MODEL
  );

  const envKey = (process.env.NINEROUTER_API_KEY || process.env.AI_ROUTER_API_KEY || "").trim();
  const localKey = await resolveLocalNineRouterKey();

  let apiKey = "";
  let source: AiSecretSource = "none";

  if (cookieIsNewer && cookieKey) {
    apiKey = cookieKey;
    source = "owner-cookie";
    // Warm or refresh runtime cache from server-signed AES-GCM HttpOnly cookie on serverless instances
    state.record = {
      encryptedApiKey: encryptSecretText(cookieKey),
      baseUrl,
      model,
      updatedAtMs: cookieCfg?.updatedAtMs || Date.now(),
    };
  } else if (vaultPlainKey) {
    apiKey = vaultPlainKey;
    source = fromCloud ? "owner-cloud" : "owner-vault";
  } else if (envKey) {
    apiKey = envKey;
    source = "env";
  } else if (localKey) {
    apiKey = localKey;
    source = "local-9router";
  }

  const hasOwnerKey = Boolean(vaultPlainKey || cookieKey);
  const cloudVaultReady = isFirebaseReady(fbCfg);
  const cloudSynced = Boolean(
    cloudVaultReady &&
      record &&
      record.encryptedApiKey &&
      state.syncedVaultSignature === buildVaultSignature(record)
  );

  const status: OwnerAiSecretStatus = {
    hasOwnerKey,
    hasEnvFallback: Boolean(envKey),
    hasLocalRouter: Boolean(localKey),
    activeSource: source,
    maskedKey: maskSecretApiKey(apiKey),
    baseUrl,
    model,
    updatedAtMs: cookieIsNewer ? (cookieCfg?.updatedAtMs ?? Date.now()) : (record?.updatedAtMs ?? null),
    encryptionReady: true,
    cloudVaultReady,
    cloudSynced,
    storageMode: getStorageMode(),
  };

  return {
    baseUrl,
    model,
    apiKey,
    hasApiKey: Boolean(apiKey),
    apiKeyMask: status.maskedKey,
    source,
    status,
  };
}

export async function saveOwnerAiConfigAsync(input: {
  store: VpsStoreData;
  baseUrl: unknown;
  model: unknown;
  apiKey?: unknown;
  ownerIdToken?: string;
  ownerUid?: string;
}): Promise<{
  status: OwnerAiSecretStatus;
  encryptedPayload: string;
  effectiveOwnerKey: string;
  baseUrl: string;
  model: string;
  cloudSynced: boolean;
}> {
  const fbCfg = getEffectiveFirebaseConfig(input.store);
  const baseCheck = validateAiBaseUrlInput(input.baseUrl);
  if (!baseCheck.valid) {
    throw new Error(baseCheck.error || "URL Provider AI tidak valid.");
  }
  const baseUrl = baseCheck.cleaned;
  const model = normalizeAiModelChoice(input.model);

  const rawKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  let plainOwnerKey = "";

  if (rawKey) {
    const keyCheck = validateAiApiKeyInput(rawKey);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error || "API Key AI tidak valid.");
    }
    plainOwnerKey = keyCheck.cleaned;
  } else {
    const hydrated = await hydrateAiSecretFromFirestore(
      input.store,
      fbCfg,
      input.ownerIdToken,
      input.ownerUid
    );
    const existingVaultKey = hydrated.record?.encryptedApiKey
      ? safeDecryptStoredKey(hydrated.record.encryptedApiKey, fbCfg)
      : "";
    const cookieCfg = await readAiConfigCookie(fbCfg);
    plainOwnerKey = existingVaultKey || (cookieCfg?.apiKey || "").trim();

    if (!plainOwnerKey) {
      const envKey = (process.env.NINEROUTER_API_KEY || process.env.AI_ROUTER_API_KEY || "").trim();
      const localKey = await resolveLocalNineRouterKey();
      if (!envKey && !localKey) {
        throw new Error(
          "API Key 9router wajib diisi karena server ini tidak memiliki key lokal atau NINEROUTER_API_KEY."
        );
      }
    }
  }

  const encryptedPayload = plainOwnerKey ? encryptSecretText(plainOwnerKey) : "";
  const nextRecord: StoredAiSecretRecord = {
    encryptedApiKey: encryptedPayload,
    baseUrl,
    model,
    updatedAtMs: Date.now(),
  };

  writeStoredAiSecretRecord(nextRecord);

  let cloudSynced = false;
  if (encryptedPayload && isFirebaseReady(fbCfg) && input.ownerIdToken && input.ownerUid) {
    cloudSynced = await writeAiSecretToFirestore(
      fbCfg,
      nextRecord,
      input.ownerIdToken,
      input.ownerUid
    );
  }

  const updatedStore = updateStore((s) => s);
  const effective = await resolveEffectiveAiConfig(
    updatedStore,
    input.ownerIdToken,
    input.ownerUid
  );

  return {
    status: {
      ...effective.status,
      cloudSynced: cloudSynced || effective.status.cloudSynced,
    },
    encryptedPayload,
    effectiveOwnerKey: plainOwnerKey,
    baseUrl,
    model,
    cloudSynced: cloudSynced || effective.status.cloudSynced,
  };
}

export async function syncEncryptedAiConfigAsync(input: {
  store: VpsStoreData;
  encryptedPayload: string;
  baseUrl: unknown;
  model: unknown;
  ownerIdToken?: string;
  ownerUid?: string;
}): Promise<{
  status: OwnerAiSecretStatus;
  effectiveOwnerKey: string;
  baseUrl: string;
  model: string;
  cloudSynced: boolean;
}> {
  const fbCfg = getEffectiveFirebaseConfig(input.store);
  const baseCheck = validateAiBaseUrlInput(input.baseUrl);
  if (!baseCheck.valid) {
    throw new Error(baseCheck.error || "URL Provider AI tidak valid.");
  }
  const baseUrl = baseCheck.cleaned;
  const model = normalizeAiModelChoice(input.model);
  const trimmed = input.encryptedPayload.trim();

  if (!trimmed) {
    writeStoredAiSecretRecord(null);
    const cloudCleared = await writeAiSecretToFirestore(
      fbCfg,
      null,
      input.ownerIdToken,
      input.ownerUid
    );
    const updatedStore = updateStore((s) => s);
    const effective = await resolveEffectiveAiConfig(
      updatedStore,
      input.ownerIdToken,
      input.ownerUid
    );
    return {
      status: effective.status,
      effectiveOwnerKey: "",
      baseUrl,
      model,
      cloudSynced: cloudCleared,
    };
  }

  const plain = decryptSecretText(trimmed, fbCfg).trim();
  if (!plain) {
    throw new Error("Ciphertext API Key AI kosong.");
  }

  const nextRecord: StoredAiSecretRecord = {
    encryptedApiKey: trimmed.startsWith(ENC_PREFIX) ? trimmed : encryptSecretText(plain),
    baseUrl,
    model,
    updatedAtMs: Date.now(),
  };
  writeStoredAiSecretRecord(nextRecord);

  const cloudSynced = await writeAiSecretToFirestore(
    fbCfg,
    nextRecord,
    input.ownerIdToken,
    input.ownerUid
  );
  const updatedStore = updateStore((s) => s);
  const effective = await resolveEffectiveAiConfig(
    updatedStore,
    input.ownerIdToken,
    input.ownerUid
  );

  return {
    status: {
      ...effective.status,
      cloudSynced: cloudSynced || effective.status.cloudSynced,
    },
    effectiveOwnerKey: plain,
    baseUrl,
    model,
    cloudSynced: cloudSynced || effective.status.cloudSynced,
  };
}

export async function clearOwnerAiConfigAsync(input: {
  store: VpsStoreData;
  ownerIdToken?: string;
  ownerUid?: string;
}): Promise<OwnerAiSecretStatus> {
  const fbCfg = getEffectiveFirebaseConfig(input.store);
  writeStoredAiSecretRecord(null);
  await writeAiSecretToFirestore(fbCfg, null, input.ownerIdToken, input.ownerUid);
  const updatedStore = updateStore((s) => s);
  const effective = await resolveEffectiveAiConfig(
    updatedStore,
    input.ownerIdToken,
    input.ownerUid,
    { ignoreCookie: true }
  );
  return effective.status;
}

export function extractAssistantText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const obj = part as Record<string, unknown>;
          if (typeof obj.text === "string") return obj.text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

export interface TestAiConnectionResult {
  ok: boolean;
  statusCode: number;
  message: string;
  modelUsed?: string;
  replyPreview?: string;
  latencyMs?: number;
  source?: AiSecretSource;
}

export async function testAiConnectionAsync(input: {
  store: VpsStoreData;
  baseUrl?: unknown;
  model?: unknown;
  apiKey?: unknown;
  ownerIdToken?: string;
  ownerUid?: string;
}): Promise<TestAiConnectionResult> {
  const effective = await resolveEffectiveAiConfig(
    input.store,
    input.ownerIdToken,
    input.ownerUid
  );

  const rawBase =
    typeof input.baseUrl === "string" && input.baseUrl.trim()
      ? input.baseUrl.trim()
      : effective.baseUrl;
  const baseCheck = validateAiBaseUrlInput(rawBase);
  if (!baseCheck.valid) {
    return {
      ok: false,
      statusCode: 400,
      message: baseCheck.error || "URL Provider AI tidak valid.",
    };
  }
  const baseUrl = baseCheck.cleaned;

  const rawModel =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : effective.model;
  const model = normalizeAiModelChoice(rawModel);

  const typedKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  let keyToTest = effective.apiKey;
  let keySource: AiSecretSource = effective.source;

  if (typedKey) {
    const keyCheck = validateAiApiKeyInput(typedKey);
    if (!keyCheck.valid) {
      return {
        ok: false,
        statusCode: 400,
        message: keyCheck.error || "API Key AI tidak valid.",
      };
    }
    keyToTest = keyCheck.cleaned;
    keySource = "owner-vault";
  }

  if (!keyToTest) {
    return {
      ok: false,
      statusCode: 400,
      message:
        "Belum ada API Key 9router untuk diuji. Masukkan API Key di kolom input atau set NINEROUTER_API_KEY di environment server.",
    };
  }

  const startedAt = Date.now();
  try {
    const upstream = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToTest}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0,
        max_tokens: 24,
        messages: [{ role: "user", content: "Balas tepat satu kata: OK" }],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const latencyMs = Date.now() - startedAt;
    const rawText = await upstream.text();
    let parsed: {
      choices?: Array<{ message?: { content?: unknown } }>;
      model?: string;
      error?: { message?: string };
    } | null = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    if (upstream.status === 401 || upstream.status === 403) {
      return {
        ok: false,
        statusCode: 400,
        message:
          "API Key AI ditolak oleh provider (401/403). Periksa ulang API Key 9router Anda.",
      };
    }

    if (!upstream.ok || !parsed) {
      return {
        ok: false,
        statusCode: upstream.status >= 400 && upstream.status < 500 ? 400 : 502,
        message: sanitizePublicError(
          parsed?.error?.message || `Provider AI mengembalikan HTTP ${upstream.status}.`,
          "Uji koneksi ke provider AI gagal."
        ),
      };
    }

    const replyPreview = extractAssistantText(parsed.choices?.[0]?.message?.content).slice(0, 60);
    const modelUsed = (parsed.model || model).trim();
    return {
      ok: true,
      statusCode: 200,
      modelUsed,
      replyPreview: replyPreview || "OK",
      latencyMs,
      source: keySource,
      message: `Koneksi AI berhasil melalui ${modelUsed} (${latencyMs} ms).`,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 502,
      message: sanitizePublicError(err, "Koneksi ke provider AI gagal atau timeout."),
    };
  }
}
