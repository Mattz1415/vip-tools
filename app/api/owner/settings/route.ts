import { NextRequest, NextResponse } from "next/server";
import { requireOwnerUser } from "@/lib/server/auth";
import {
  appendAuditLog,
  getEffectiveFirebaseConfig,
  hasYtCookies,
  isFirebaseReady,
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
      return store.settings;
    });

    return NextResponse.json({ ok: true, settings: saved });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
