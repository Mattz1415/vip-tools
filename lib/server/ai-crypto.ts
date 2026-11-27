import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { getSessionSecret, type FirebaseWebConfig } from "./store";

export const ENC_PREFIX = "enc:v1:";

function resolveEnvFallbackAes256Key(): Buffer {
  const projectSeed = (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.VERCEL_PROJECT_ID ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_GIT_REPO_ID ||
    "mattzlm-vip-tools"
  ).trim();
  const apiSeed = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();
  return createHash("sha256")
    .update(`vip-tools-ai-vault-v1:${projectSeed}:${apiSeed}`, "utf8")
    .digest();
}

function resolveLegacyFallbackAes256Key(fbCfg?: Partial<FirebaseWebConfig>): Buffer {
  const projectSeed = (
    fbCfg?.projectId ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.VERCEL_PROJECT_ID ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_GIT_REPO_ID ||
    "mattzlm-vip-tools"
  ).trim();
  const apiSeed = (
    fbCfg?.apiKey ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    ""
  ).trim();
  return createHash("sha256")
    .update(`vip-tools-ai-vault-v1:${projectSeed}:${apiSeed}`, "utf8")
    .digest();
}

function resolveSessionDerivedAes256Key(): Buffer {
  return createHash("sha256")
    .update(`ai-cfg:${getSessionSecret()}`, "utf8")
    .digest();
}

export function resolveAes256Key(): Buffer {
  const configured = process.env.APP_ENCRYPTION_KEY?.trim() || "";
  if (/^[0-9a-fA-F]{64}$/.test(configured)) {
    return Buffer.from(configured, "hex");
  }
  if (configured) {
    return createHash("sha256")
      .update(`vip-tools-ai-vault-v1:${configured}`, "utf8")
      .digest();
  }

  const sessionSecret = process.env.SESSION_SECRET?.trim() || "";
  if (sessionSecret.length >= 16) {
    return createHash("sha256")
      .update(`vip-tools-ai-vault-v1:${sessionSecret}`, "utf8")
      .digest();
  }

  return resolveEnvFallbackAes256Key();
}

export function computeAiRuntimeVaultId(): string {
  return createHmac("sha256", resolveAes256Key())
    .update("vip-tools-ai-runtime-v1", "utf8")
    .digest("hex");
}

export function computeLegacyAiRuntimeVaultId(fbCfg?: Partial<FirebaseWebConfig>): string {
  return createHmac("sha256", resolveLegacyFallbackAes256Key(fbCfg))
    .update("vip-tools-ai-runtime-v1", "utf8")
    .digest("hex");
}

export function encryptSecretText(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (!trimmed) {
    throw new Error("Data rahasia AI tidak boleh kosong.");
  }
  const key = resolveAes256Key();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

function decryptWithKey(
  key: Buffer,
  iv: Buffer,
  authTag: Buffer,
  ciphertext: Buffer
): string {
  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error("Struktur ciphertext tidak valid.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export function decryptSecretText(
  payload: string,
  fbCfg?: Partial<FirebaseWebConfig>
): string {
  const trimmed = payload.trim();
  if (!trimmed) {
    throw new Error("Payload terenkripsi kosong.");
  }

  let ivB64 = "";
  let tagB64 = "";
  let dataB64 = "";

  if (trimmed.startsWith(ENC_PREFIX)) {
    const rawParts = trimmed.slice(ENC_PREFIX.length).split(":");
    if (rawParts.length !== 3) {
      throw new Error("Struktur ciphertext korup.");
    }
    [ivB64, tagB64, dataB64] = rawParts;
  } else if (trimmed.includes(".")) {
    // Backward compatibility with legacy vip_ai_cfg cookie format (iv.tag.data)
    const rawParts = trimmed.split(".");
    if (rawParts.length !== 3) {
      throw new Error("Format data terenkripsi tidak valid.");
    }
    [ivB64, tagB64, dataB64] = rawParts;
  } else {
    throw new Error("Format data terenkripsi tidak valid.");
  }

  const iv = Buffer.from(ivB64, "base64url");
  const authTag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(dataB64, "base64url");

  const candidateKeys: Buffer[] = [
    resolveAes256Key(),
    resolveEnvFallbackAes256Key(),
    resolveLegacyFallbackAes256Key(fbCfg),
    resolveSessionDerivedAes256Key(),
  ];

  let lastErr: unknown;
  for (const key of candidateKeys) {
    try {
      return decryptWithKey(key, iv, authTag, ciphertext);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Gagal mendekripsi secret AI.");
}
