import { NextRequest, NextResponse } from "next/server";
import {
  getEffectiveFirebaseConfig,
  isFirebaseReady,
  readStore,
  updateStore,
} from "@/lib/server/store";

export async function GET(req: NextRequest) {
  const countVisit = req.nextUrl.searchParams.get("visit") === "1";
  const store = countVisit
    ? updateStore((s) => {
        s.settings.visits = (s.settings.visits || 0) + 1;
        return s;
      })
    : readStore();

  const fbCfg = getEffectiveFirebaseConfig(store);
  const ready = isFirebaseReady(fbCfg);

  return NextResponse.json({
    ok: true,
    firebaseReady: ready,
    firebaseConfig: ready ? fbCfg : null,
    customTools: store.customTools,
    hiddenTools: store.hiddenTools,
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
