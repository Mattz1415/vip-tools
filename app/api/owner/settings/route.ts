import { NextRequest, NextResponse } from "next/server";
import {
  attachAiConfigCookie,
  clearAiConfigCookie,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  readAiConfigCookie,
  resolveEffectiveAiConfig,
} from "@/lib/server/ai-config";
import { requireOwnerUser } from "@/lib/server/auth";
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

const VALID_THEMES: ThemeKey[] = ["hitam", "abu", "putih"];

export async function POST(req: NextRequest) {
  const { user: actor, error } = await requireOwnerUser();
  if (error || !actor) return error!;

  try {
    const body = await req.json();
    const action = String(body?.action || "saveSettings");

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

    if (action === "saveAiConfig") {
      const baseUrl = String(body?.aiBaseUrl || DEFAULT_AI_BASE_URL).trim();
      const model = String(body?.aiModel || DEFAULT_AI_MODEL).trim();
      const incomingKey = typeof body?.aiApiKey === "string" ? body.aiApiKey.trim() : "";
      const clearApiKey = Boolean(body?.clearAiApiKey);

      if (!/^https?:\/\/.+/i.test(baseUrl)) {
        return NextResponse.json(
          { ok: false, error: "URL Provider AI harus diawali http:// atau https://." },
          { status: 400 }
        );
      }
      if (!model || model.length > 120) {
        return NextResponse.json(
          { ok: false, error: "Nama model AI wajib diisi (maks 120 karakter)." },
          { status: 400 }
        );
      }

      const existingCookie = await readAiConfigCookie();
      const normalizedBase = baseUrl.replace(/\/+$/, "");

      const updatedStore = updateStore((store) => {
        store.settings.aiBaseUrl = normalizedBase;
        store.settings.aiModel = model;
        if (clearApiKey) {
          store.settings.aiApiKey = "";
        } else if (incomingKey) {
          store.settings.aiApiKey = incomingKey;
        } else if (!store.settings.aiApiKey && existingCookie?.apiKey) {
          store.settings.aiApiKey = existingCookie.apiKey;
        }
        appendAuditLog(
          store,
          actor.username,
          "OWNER_AI_CONFIG",
          `Update AI base=${store.settings.aiBaseUrl}, model=${store.settings.aiModel}, key=${store.settings.aiApiKey ? "custom" : "auto"}`
        );
        return store;
      });

      const effectiveKey = clearApiKey
        ? ""
        : incomingKey || (updatedStore.settings.aiApiKey || "").trim() || existingCookie?.apiKey || "";

      const eff = await resolveEffectiveAiConfig(updatedStore);
      const res = NextResponse.json({
        ok: true,
        aiConfig: {
          baseUrl: normalizedBase,
          model,
          hasApiKey: clearApiKey ? eff.hasApiKey : Boolean(effectiveKey || eff.hasApiKey),
          apiKeyMask: clearApiKey ? eff.apiKeyMask : eff.apiKeyMask,
          source: clearApiKey ? eff.source : effectiveKey ? "owner-store" : eff.source,
        },
      });

      if (clearApiKey) {
        clearAiConfigCookie(res);
      } else {
        attachAiConfigCookie(res, {
          baseUrl: normalizedBase,
          model,
          apiKey: effectiveKey,
        });
      }
      return res;
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

    const existingCookie = await readAiConfigCookie();
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
      if (incomingAiBase && /^https?:\/\/.+/i.test(incomingAiBase)) {
        store.settings.aiBaseUrl = incomingAiBase.replace(/\/+$/, "");
      }
      if (incomingAiModel && incomingAiModel.length <= 120) {
        store.settings.aiModel = incomingAiModel;
      }
      if (incomingAiKey) {
        store.settings.aiApiKey = incomingAiKey;
      }
      appendAuditLog(
        store,
        actor.username,
        "OWNER_SETTINGS_SAVE",
        `Tema=${store.settings.defaultTheme}, maintenance=${store.settings.maintenanceMode}`
      );
      return { ...store.settings, aiApiKey: "" };
    });

    const res = NextResponse.json({ ok: true, settings: saved });
    if (incomingAiBase || incomingAiModel || incomingAiKey) {
      const storeNow = readStore();
      attachAiConfigCookie(res, {
        baseUrl: (storeNow.settings.aiBaseUrl || DEFAULT_AI_BASE_URL).trim(),
        model: (storeNow.settings.aiModel || DEFAULT_AI_MODEL).trim(),
        apiKey: incomingAiKey || (storeNow.settings.aiApiKey || "").trim() || existingCookie?.apiKey || "",
      });
    }
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
