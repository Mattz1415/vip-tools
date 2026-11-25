import type { Metadata } from "next";
import OwnerPanelClient from "@/components/OwnerPanelClient";
import { getCurrentSessionUser, sanitizePublicUser } from "@/lib/server/auth";
import { getEffectiveFirebaseConfig, isFirebaseReady, readStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Panel | MattzLM VPS Deck",
  description: "Panel kontrol khusus Owner untuk mengelola VPS, akun, Firebase Google Auth, dan tools.",
};

export default async function OwnerPage() {
  const user = await getCurrentSessionUser();
  const store = readStore();
  const fbReady = isFirebaseReady(getEffectiveFirebaseConfig(store));

  return (
    <OwnerPanelClient
      initialUser={user ? sanitizePublicUser(user) : null}
      firebaseReady={fbReady}
    />
  );
}
