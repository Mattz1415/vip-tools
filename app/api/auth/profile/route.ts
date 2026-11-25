import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, requireAuthUser, sanitizePublicUser } from "@/lib/server/auth";
import { hashPassword, updateStore, verifyPassword } from "@/lib/server/store";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuthUser();
  if (error || !user) return error!;

  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "changeUsername") {
      const newUsername = String(body?.newUsername || "").trim();
      if (user.username === "matt") {
        return NextResponse.json(
          { ok: false, error: "Username owner utama tidak bisa diganti." },
          { status: 400 }
        );
      }
      if (!newUsername || newUsername.length < 3 || newUsername.length > 32 || !/^[a-zA-Z0-9_.-]+$/.test(newUsername)) {
        return NextResponse.json(
          { ok: false, error: "Username baru harus 3-32 karakter (huruf, angka, ._-)." },
          { status: 400 }
        );
      }
      const resData = updateStore((store) => {
        if (store.users[newUsername]) {
          return { error: "Username sudah dipakai.", status: 409 };
        }
        const existing = store.users[user.username];
        if (!existing) return { error: "Akun tidak ditemukan.", status: 404 };
        existing.username = newUsername;
        store.users[newUsername] = existing;
        delete store.users[user.username];
        return { user: sanitizePublicUser(existing) };
      });
      if ("error" in resData) {
        return NextResponse.json({ ok: false, error: resData.error }, { status: resData.status });
      }
      const res = NextResponse.json({ ok: true, user: resData.user });
      return attachSessionCookie(res, resData.user.username);
    }

    if (action === "changePassword") {
      const currentPass = String(body?.currentPass || "");
      const newPass = String(body?.newPass || "");
      if (user.provider === "google") {
        return NextResponse.json(
          { ok: false, error: "Akun Google dikelola langsung melalui keamanan Google Firebase." },
          { status: 400 }
        );
      }
      if (newPass.length < 4) {
        return NextResponse.json({ ok: false, error: "Password baru minimal 4 karakter." }, { status: 400 });
      }
      const resData = updateStore((store) => {
        const existing = store.users[user.username];
        if (!existing || !verifyPassword(currentPass, existing.passwordHash)) {
          return { error: "Password saat ini salah.", status: 401 };
        }
        existing.passwordHash = hashPassword(newPass);
        return { ok: true };
      });
      if ("error" in resData) {
        return NextResponse.json({ ok: false, error: resData.error }, { status: resData.status });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "updateAvatar") {
      const photoUrl = String(body?.photoUrl || "");
      if (photoUrl.length > 2_800_000) {
        return NextResponse.json({ ok: false, error: "Ukuran foto maksimal 2MB." }, { status: 400 });
      }
      if (photoUrl && !photoUrl.startsWith("data:image/") && !/^https?:\/\//i.test(photoUrl)) {
        return NextResponse.json({ ok: false, error: "Format foto tidak valid." }, { status: 400 });
      }
      const updated = updateStore((store) => {
        const existing = store.users[user.username];
        if (!existing) return null;
        existing.photoUrl = photoUrl;
        return sanitizePublicUser(existing);
      });
      return NextResponse.json({ ok: true, user: updated });
    }

    return NextResponse.json({ ok: false, error: "Aksi profil tidak dikenali." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui profil.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
