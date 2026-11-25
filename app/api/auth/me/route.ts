import { NextResponse } from "next/server";
import { getCurrentSessionUser, sanitizePublicUser } from "@/lib/server/auth";
import { getEffectiveFirebaseConfig, isFirebaseReady, readStore } from "@/lib/server/store";

export async function GET() {
  const user = await getCurrentSessionUser();
  const store = readStore();
  const fbCfg = getEffectiveFirebaseConfig(store);

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    user: user ? sanitizePublicUser(user) : null,
    firebaseReady: isFirebaseReady(fbCfg),
    settings: {
      defaultTheme: store.settings.defaultTheme,
      announcement: store.settings.announcement,
      maintenanceMode: store.settings.maintenanceMode,
      bgVideoUrl: store.settings.bgVideoUrl,
      homeRotate: store.settings.homeRotate,
      visits: store.settings.visits,
    },
  });
}
