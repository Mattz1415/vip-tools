import type { Metadata } from "next";
import OwnerPanelClient from "@/components/OwnerPanelClient";
import { getCurrentSessionUser, sanitizePublicUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Panel | MattzLM",
  description: "Panel admin khusus Owner untuk mengatur akun, tools custom, dan konfigurasi layanan.",
};

export default async function OwnerPage() {
  let initialUser: ReturnType<typeof sanitizePublicUser> | null = null;

  try {
    const user = await getCurrentSessionUser();
    initialUser = user ? sanitizePublicUser(user) : null;
  } catch {
    initialUser = null;
  }

  return <OwnerPanelClient initialUser={initialUser} />;
}
