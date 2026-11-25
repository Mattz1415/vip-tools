import { NextRequest, NextResponse } from "next/server";
import { sanitizePublicUser } from "@/lib/server/auth";
import { appendAuditLog, hashPassword, updateStore } from "@/lib/server/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!username || username.length < 3 || username.length > 32) {
      return NextResponse.json(
        { ok: false, error: "Username harus 3 sampai 32 karakter." },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return NextResponse.json(
        { ok: false, error: "Username hanya boleh berisi huruf, angka, titik, strip, atau garis bawah." },
        { status: 400 }
      );
    }
    if (password.length < 4 || password.length > 100) {
      return NextResponse.json(
        { ok: false, error: "Password minimal 4 karakter." },
        { status: 400 }
      );
    }

    const result = updateStore((store) => {
      if (store.settings.maintenanceMode) {
        return { error: "Pendaftaran ditutup sementara selama mode maintenance.", status: 503 };
      }
      if (store.users[username]) {
        return { error: `Username "${username}" sudah terdaftar.`, status: 409 };
      }
      const now = Date.now();
      store.users[username] = {
        username,
        passwordHash: hashPassword(password),
        role: "member",
        provider: "local",
        displayName: username,
        chatLimit: 5,
        createdAt: now,
        lastLoginAt: now,
      };
      appendAuditLog(store, username, "REGISTER_LOCAL", "Registrasi akun member baru");
      return { user: sanitizePublicUser(store.users[username]), status: 201 };
    });

    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, user: result.user }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mendaftarkan akun.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
