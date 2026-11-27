import { NextRequest, NextResponse } from "next/server";
import {
  attachAiConfigCookie,
  clearAiConfigCookie,
  clearOwnerAiConfigAsync,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  resolveEffectiveAiConfig,
  saveOwnerAiConfigAsync,
  syncEncryptedAiConfigAsync,
  testAiConnectionAsync,
} from "@/lib/server/ai-config";
import { requireOwnerUser, verifyFirebaseIdToken } from "@/lib/server/auth";
import {
  appendAuditLog,
  getEffectiveFirebaseConfig,
  hasYtCookies,
  isFirebaseReady,
  readStore,
  saveYtCookies,
  updateStore,
  type ThemeKey,
} from "@/lib/server/store";

export const dynamic = "force-dynamic";

const VALID_THEMES: ThemeKey[] = ["hitam", "abu", "putih"];

async function resolveOptionalFirebaseOwner(
  req: NextRequest
): Promise<{ ownerIdToken?: string; ownerUid?: string }> {
  const token = (req.headers.get("x-firebase-id-token") || "").trim();
  if (!token) return {};
  const fbCfg = getEffectiveFirebaseConfig(readStore());
  if (!isFirebaseReady(fbCfg)) return {};
  try {
    const verified = await verifyFirebaseIdToken(token, fbCfg.projectId);
    return { ownerIdToken: token, ownerUid: verified.uid };
  } catch {
    return {};
  }
}

function buildAiConfigResponse(status: {
  baseUrl: string;
  model: string;
  maskedKey: string;
  activeSource: string;
  hasOwnerKey: boolean;
  hasEnvFallback: boolean;
  hasLocalRouter: boolean;
  updatedAtMs: number | null;
  encryptionReady: boolean;
  cloudVaultReady: boolean;
  cloudSynced: boolean;
  storageMode: string;
}) {
  return {
    baseUrl: status.baseUrl,
    model: status.model,
    hasApiKey: status.activeSource !== "none",
    apiKeyMask: status.maskedKey,
    source: status.activeSource,
    hasOwnerKey: status.hasOwnerKey,
    hasEnvFallback: status.hasEnvFallback,
    hasLocalRouter: status.hasLocalRouter,
    updatedAtMs: status.updatedAtMs,
    encryptionReady: status.encryptionReady,
    cloudVaultReady: status.cloudVaultReady,
    cloudSynced: status.cloudSynced,
    storageMode: status.storageMode,
  };
}

export async function POST(req: NextRequest) {
  const { user: actor, error } = await requireOwnerUser();
  if (error || !actor) return error!;

  try {
    const body = await req.json();
    const action = String(body?.action || "saveSettings");
    const { ownerIdToken, ownerUid } = await resolveOptionalFirebaseOwner(req);

    if (action === "saveFirebase") {
      const cfg = body?.firebaseConfig || {};
      const saved = updateStore((store) => {
        store.firebaseConfig = {
          apiKey: String(cfg.apiKey || "").trim(),
          authDomain: String(cfg.authDomain || "").trim(),
          projectId: String(cfg.projectId || "").trim(),
          storageBucket: String(cfg.storageBucket || "").trim(),
          messagingSenderId: String(cfg.messagingSenderId || "").trim(),
          appId: String(cfg.appId || "").trim(),
        };
        const eff = getEffectiveFirebaseConfig(store);
        appendAuditLog(
          store,
          actor.username,
          "OWNER_FIREBASE_CONFIG",
          `Update Firebase project=${eff.projectId || "(kosong)"}`
        );
        return { firebaseConfig: eff, firebaseReady: isFirebaseReady(eff) };
      });
      return NextResponse.json({ ok: true, ...saved });
    }

    if (action === "clearAiConfig" || (action === "saveAiConfig" && Boolean(body?.clearAiApiKey))) {
      const status = await clearOwnerAiConfigAsync({
        store: readStore(),
        ownerIdToken,
        ownerUid,
      });
      updateStore((store) => {
        appendAuditLog(
          store,
          actor.username,
          "OWNER_AI_CONFIG_CLEAR",
          `Reset kunci custom AI (sumber aktif=${status.activeSource})`
        );
      });
      const res = NextResponse.json(
        {
          ok: true,
          aiConfig: buildAiConfigResponse(status),
        },
        { headers: { "Cache-Control": "no-store" } }
      );
      clearAiConfigCookie(res);
      return res;
    }

    if (action === "saveAiConfig") {
      try {
        const saved = await saveOwnerAiConfigAsync({
          store: readStore(),
          baseUrl: body?.aiBaseUrl ?? DEFAULT_AI_BASE_URL,
          model: body?.aiModel ?? DEFAULT_AI_MODEL,
          apiKey: body?.aiApiKey,
          ownerIdToken,
          ownerUid,
        });

        updateStore((store) => {
          appendAuditLog(
            store,
            actor.username,
            "OWNER_AI_CONFIG",
            `Update AI base=${saved.baseUrl}, model=${saved.model}, source=${saved.status.activeSource}, cloud=${saved.cloudSynced ? "yes" : "no"}`
          );
        });

        const res = NextResponse.json(
          {
            ok: true,
            aiConfig: buildAiConfigResponse(saved.status),
            encryptedPayload: saved.encryptedPayload,
            cloudSynced: saved.cloudSynced,
          },
          { headers: { "Cache-Control": "no-store" } }
        );

        attachAiConfigCookie(res, {
          baseUrl: saved.baseUrl,
          model: saved.model,
          apiKey: saved.effectiveOwnerKey,
          updatedAtMs: saved.status.updatedAtMs ?? Date.now(),
        });
        return res;
      } catch (err) {
        return NextResponse.json(
          {
            ok: false,
            error: err instanceof Error ? err.message : "Gagal menyimpan konfigurasi AI.",
          },
          { status: 400 }
        );
      }
    }

    if (action === "syncAiConfig") {
      const encryptedPayload =
        typeof body?.encryptedApiKey === "string" ? body.encryptedApiKey.trim() : "";
      if (encryptedPayload && !/^enc:v1:.+$/.test(encryptedPayload)) {
        return NextResponse.json(
          { ok: false, error: "Format ciphertext AI tidak valid." },
          { status: 400 }
        );
      }

      try {
        const synced = await syncEncryptedAiConfigAsync({
          store: readStore(),
          encryptedPayload,
          baseUrl: body?.aiBaseUrl ?? DEFAULT_AI_BASE_URL,
          model: body?.aiModel ?? DEFAULT_AI_MODEL,
          ownerIdToken,
          ownerUid,
        });
        const res = NextResponse.json(
          {
            ok: true,
            aiConfig: buildAiConfigResponse(synced.status),
            cloudSynced: synced.cloudSynced,
          },
          { headers: { "Cache-Control": "no-store" } }
        );
        if (synced.effectiveOwnerKey) {
          attachAiConfigCookie(res, {
            baseUrl: synced.baseUrl,
            model: synced.model,
            apiKey: synced.effectiveOwnerKey,
            updatedAtMs: synced.status.updatedAtMs ?? Date.now(),
          });
        } else {
          clearAiConfigCookie(res);
        }
        return res;
      } catch (err) {
        return NextResponse.json(
          {
            ok: false,
            error: err instanceof Error ? err.message : "Gagal menyinkronkan secret AI.",
          },
          { status: 400 }
        );
      }
    }

    if (action === "testAiConfig") {
      const tested = await testAiConnectionAsync({
        store: readStore(),
        baseUrl: body?.aiBaseUrl,
        model: body?.aiModel,
        apiKey: body?.aiApiKey,
        ownerIdToken,
        ownerUid,
      });

      updateStore((store) => {
        appendAuditLog(
          store,
          actor.username,
          "OWNER_AI_TEST",
          tested.ok
            ? `Uji koneksi AI sukses (${tested.modelUsed}, ${tested.latencyMs} ms)`
            : `Uji koneksi AI gagal (${tested.statusCode})`
        );
      });

      if (!tested.ok) {
        return NextResponse.json(
          { ok: false, error: tested.message },
          { status: tested.statusCode, headers: { "Cache-Control": "no-store" } }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          message: tested.message,
          modelUsed: tested.modelUsed,
          replyPreview: tested.replyPreview,
          latencyMs: tested.latencyMs,
          source: tested.source,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "saveYtCookies") {
      const cookiesText = String(body?.cookiesText || "");
      saveYtCookies(cookiesText);
      updateStore((store) => {
        appendAuditLog(
          store,
          actor.username,
          "OWNER_YT_COOKIES",
          cookiesText.trim() ? "Perbarui yt-dlp cookies.txt di VPS" : "Hapus yt-dlp cookies.txt"
        );
      });
      return NextResponse.json({ ok: true, hasYtCookies: hasYtCookies() });
    }

    const incomingAiBase = typeof body?.aiBaseUrl === "string" ? body.aiBaseUrl.trim() : "";
    const incomingAiModel = typeof body?.aiModel === "string" ? body.aiModel.trim() : "";
    const incomingAiKey = typeof body?.aiApiKey === "string" ? body.aiApiKey.trim() : "";

    const saved = updateStore((store) => {
      if (body?.defaultTheme && VALID_THEMES.includes(body.defaultTheme)) {
        store.settings.defaultTheme = body.defaultTheme;
      }
      if (typeof body?.announcement === "string") {
        store.settings.announcement = body.announcement.trim().slice(0, 320);
      }
      if (typeof body?.maintenanceMode === "boolean") {
        store.settings.maintenanceMode = body.maintenanceMode;
      }
      if (typeof body?.bgVideoUrl === "string" && /^https?:\/\//i.test(body.bgVideoUrl.trim())) {
        store.settings.bgVideoUrl = body.bgVideoUrl.trim();
      }
      if (typeof body?.homeRotate === "number" && [0, 90, 180, 270].includes(body.homeRotate)) {
        store.settings.homeRotate = body.homeRotate;
      }
      appendAuditLog(
        store,
        actor.username,
        "OWNER_SETTINGS_SAVE",
        `Tema=${store.settings.defaultTheme}, maintenance=${store.settings.maintenanceMode}`
      );
      return { ...store.settings, aiApiKey: "" };
    });

    let cookieAttachment: {
      baseUrl: string;
      model: string;
      apiKey: string;
      updatedAtMs?: number;
    } | null = null;
    if (incomingAiKey || incomingAiBase || incomingAiModel) {
      try {
        const effBefore = await resolveEffectiveAiConfig(readStore(), ownerIdToken, ownerUid);
        const aiChanged =
          Boolean(incomingAiKey) ||
          (Boolean(incomingAiBase) && incomingAiBase.replace(/\/+$/, "") !== effBefore.baseUrl) ||
          (Boolean(incomingAiModel) && incomingAiModel !== effBefore.model);
        if (aiChanged) {
          const aiSaved = await saveOwnerAiConfigAsync({
            store: readStore(),
            baseUrl: incomingAiBase || effBefore.baseUrl,
            model: incomingAiModel || effBefore.model,
            apiKey: incomingAiKey || undefined,
            ownerIdToken,
            ownerUid,
          });
          cookieAttachment = {
            baseUrl: aiSaved.baseUrl,
            model: aiSaved.model,
            apiKey: aiSaved.effectiveOwnerKey,
            updatedAtMs: aiSaved.status.updatedAtMs ?? Date.now(),
          };
        }
      } catch {
        // Keep global settings save resilient when AI key is not yet provided
      }
    }

    const res = NextResponse.json({ ok: true, settings: saved });
    if (cookieAttachment) {
      attachAiConfigCookie(res, cookieAttachment);
    }
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
