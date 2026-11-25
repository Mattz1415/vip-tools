import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, sanitizePublicUser } from "@/lib/server/auth";
import { appendAuditLog, updateStore, verifyPassword } from "@/lib/server/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Isi username dan password terlebih dahulu." },
        { status: 400 }
      );
    }

    const result = updateStore((store) => {
      const user = store.users[username];
      if (!user || user.provider === "google") {
        return null;
      }
      if (!verifyPassword(password, user.passwordHash)) {
        return null;
      }
      if (store.settings.maintenanceMode && user.role !== "owner") {
        return { maintenance: true as const };
      }
      user.lastLoginAt = Date.now();
      appendAuditLog(store, username, "LOGIN_LOCAL", `Login lokal (${user.role})`);
      return { user: sanitizePublicUser(user) };
    });

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Username atau password salah. Periksa kembali input Anda." },
        { status: 401 }
      );
    }
    if ("maintenance" in result) {
      return NextResponse.json(
        { ok: false, error: "Sistem sedang dalam mode maintenance. Hanya Owner yang dapat masuk." },
        { status: 503 }
      );
    }

    const res = NextResponse.json({ ok: true, user: result.user });
    return attachSessionCookie(res, result.user.username);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses login.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
