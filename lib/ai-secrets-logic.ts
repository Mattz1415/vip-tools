export const DEFAULT_AI_BASE_URL = "http://165.245.190.115:20128";
export const DEFAULT_AI_MODEL = "ag/gemini-3.8-flash";

export interface AiModelOption {
  value: string;
  label: string;
}

export const AI_MODEL_OPTIONS: readonly AiModelOption[] = [
  { value: "ag/gemini-3.8-flash", label: "Gemini 3.8 Flash (Cepat & Akurat - Default)" },
  { value: "ag/gemini-3.8-flash-low", label: "Gemini 3.8 Flash Low (Super Cepat)" },
  { value: "ag/gemini-3.8-flash-medium", label: "Gemini 3.8 Flash Medium (Seimbang)" },
  { value: "ag/gemini-3.8-flash-high", label: "Gemini 3.8 Flash High (Analisis Mendalam)" },
  { value: "ag/gemini-4-hydrogen", label: "Gemini 4 Hydrogen (Penalaran Tinggi)" },
  { value: "ag/gemini-4-carbon", label: "Gemini 4 Carbon" },
  { value: "ag/gemini-3.7-flash", label: "Gemini 3.7 Flash (Cadangan)" },
] as const;

export type AiSecretSource =
  | "owner-vault"
  | "owner-cloud"
  | "owner-cookie"
  | "env"
  | "local-9router"
  | "none";

export interface OwnerAiSecretStatus {
  hasOwnerKey: boolean;
  hasEnvFallback: boolean;
  hasLocalRouter: boolean;
  activeSource: AiSecretSource;
  maskedKey: string;
  baseUrl: string;
  model: string;
  updatedAtMs: number | null;
  encryptionReady: boolean;
  cloudVaultReady: boolean;
  cloudSynced: boolean;
  storageMode: "vps-disk" | "tmp-disk" | "memory";
}

const PLACEHOLDER_KEYS = new Set([
  "my_api_key",
  "your_api_key",
  "your_ninerouter_api_key",
  "your_gemini_api_key",
  "api_key",
  "changeme",
  "placeholder",
  "sk-placeholder",
]);

export function maskSecretApiKey(rawKey: string | null | undefined): string {
  const trimmed = (rawKey ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.length <= 10) {
    return "*".repeat(Math.max(4, trimmed.length));
  }
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

export function validateAiApiKeyInput(rawKey: unknown): {
  valid: boolean;
  cleaned: string;
  error?: string;
} {
  if (typeof rawKey !== "string") {
    return { valid: false, cleaned: "", error: "Format API Key AI tidak valid." };
  }

  const cleaned = rawKey.trim();
  if (!cleaned) {
    return { valid: false, cleaned: "", error: "API Key AI wajib diisi." };
  }

  if (/\s/.test(cleaned)) {
    return {
      valid: false,
      cleaned: "",
      error: "API Key AI tidak boleh mengandung spasi atau baris baru.",
    };
  }

  if (cleaned.length < 8 || cleaned.length > 512) {
    return {
      valid: false,
      cleaned: "",
      error: "Panjang API Key AI harus antara 8 hingga 512 karakter.",
    };
  }

  if (PLACEHOLDER_KEYS.has(cleaned.toLowerCase())) {
    return {
      valid: false,
      cleaned: "",
      error: "Masukkan API Key asli dari dashboard 9router atau penyedia AI.",
    };
  }

  if (/[\x00-\x1f\x7f]/.test(cleaned)) {
    return {
      valid: false,
      cleaned: "",
      error: "API Key AI mengandung karakter kontrol yang tidak diizinkan.",
    };
  }

  return { valid: true, cleaned };
}

export function validateAiBaseUrlInput(rawUrl: unknown): {
  valid: boolean;
  cleaned: string;
  error?: string;
} {
  if (typeof rawUrl !== "string") {
    return { valid: false, cleaned: "", error: "URL Provider AI tidak valid." };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: true, cleaned: DEFAULT_AI_BASE_URL };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      cleaned: "",
      error: "Format URL Provider AI tidak valid. Gunakan http:// atau https://.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      cleaned: "",
      error: "URL Provider AI wajib diawali http:// atau https://.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      cleaned: "",
      error: "URL Provider AI tidak boleh menyertakan kredensial di dalam URL.",
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === "169.254.169.254" ||
    host.startsWith("169.254.") ||
    host === "metadata.google.internal" ||
    host === "metadata"
  ) {
    return {
      valid: false,
      cleaned: "",
      error: "Host metadata internal tidak diizinkan sebagai Provider AI.",
    };
  }

  const normalized = parsed.toString().replace(/\/+$/, "");
  return { valid: true, cleaned: normalized };
}

export function normalizeAiModelChoice(rawModel: unknown): string {
  if (typeof rawModel !== "string") return DEFAULT_AI_MODEL;
  const cleaned = rawModel.trim();
  if (!cleaned) return DEFAULT_AI_MODEL;
  if (!/^[a-zA-Z0-9._:/-]{2,120}$/.test(cleaned)) {
    return DEFAULT_AI_MODEL;
  }
  return cleaned;
}
