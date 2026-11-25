import type { Metadata } from "next";
import OwnerPanelClient from "@/components/OwnerPanelClient";
import { getCurrentSessionUser, sanitizePublicUser } from "@/lib/server/auth";
import { getEffectiveFirebaseConfig, isFirebaseReady, readStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Panel | MattzLM",
  description: "Panel admin khusus Owner untuk mengatur akun, tools custom, Firebase Auth, dan konfigurasi VPS.",
};

export default async function OwnerPage() {
  let initialUser: ReturnType<typeof sanitizePublicUser> | null = null;
  let fbReady = false;

  try {
    const user = await getCurrentSessionUser();
    initialUser = user ? sanitizePublicUser(user) : null;
  } catch {
    initialUser = null;
  }

  try {
    const store = readStore();
    fbReady = isFirebaseReady(getEffectiveFirebaseConfig(store));
  } catch {
    fbReady = Boolean(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    );
  }

  return <OwnerPanelClient initialUser={initialUser} firebaseReady={fbReady} />;
}
