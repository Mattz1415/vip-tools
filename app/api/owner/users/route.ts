import { NextRequest, NextResponse } from "next/server";
import { requireOwnerUser, sanitizePublicUser } from "@/lib/server/auth";
import {
  appendAuditLog,
  hashPassword,
  updateStore,
  type UserRole,
} from "@/lib/server/store";

const VALID_ROLES: UserRole[] = ["member", "admin", "owner"];

export async function POST(req: NextRequest) {
  const { user: actor, error } = await requireOwnerUser();
  if (error || !actor) return error!;

  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "saveUser") {
      const username = String(body?.username || "").trim();
      const password = String(body?.password || "");
      const rawRole = String(body?.role || "member").toLowerCase() as UserRole;
      const role: UserRole = VALID_ROLES.includes(rawRole) ? rawRole : "member";

      if (!username || !/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
        return NextResponse.json(
          { ok: false, error: "Username harus 3-32 karakter (huruf, angka, ._-)." },
          { status: 400 }
        );
      }

      const outcome = updateStore((store) => {
        const existing = store.users[username];
        if (!existing && password.length < 4) {
          return { error: "Password minimal 4 karakter untuk akun baru.", status: 400 };
        }
        const finalRole: UserRole = username === "matt" ? "owner" : role;
        const now = Date.now();
        if (existing) {
          existing.role = finalRole;
          if (password && password.length >= 4 && existing.provider !== "google") {
            existing.passwordHash = hashPassword(password);
          }
          if (finalRole === "owner") existing.chatLimit = 999999;
          appendAuditLog(store, actor.username, "OWNER_UPDATE_USER", `Update ${username} -> role=${finalRole}`);
        } else {
          store.users[username] = {
            username,
            passwordHash: hashPassword(password),
            role: finalRole,
            provider: "local",
            displayName: username,
            chatLimit: finalRole === "owner" ? 999999 : 5,
            createdAt: now,
            lastLoginAt: now,
          };
          appendAuditLog(store, actor.username, "OWNER_CREATE_USER", `Buat user ${username} (${finalRole})`);
        }
        return { users: Object.values(store.users).map(sanitizePublicUser) };
      });

      if ("error" in outcome) {
        return NextResponse.json({ ok: false, error: outcome.error }, { status: outcome.status });
      }
      return NextResponse.json({ ok: true, users: outcome.users });
    }

    if (action === "deleteUser") {
      const username = String(body?.username || "").trim();
      if (!username || username === "matt") {
        return NextResponse.json(
          { ok: false, error: "Akun owner utama (matt) tidak bisa dihapus." },
          { status: 400 }
        );
      }
      const users = updateStore((store) => {
        delete store.users[username];
        appendAuditLog(store, actor.username, "OWNER_DELETE_USER", `Hapus akun ${username}`);
        return Object.values(store.users).map(sanitizePublicUser);
      });
      return NextResponse.json({ ok: true, users });
    }

    if (action === "saveOwnerEmails") {
      const rawList: unknown[] = Array.isArray(body?.emails)
        ? body.emails
        : String(body?.emails || "").split(/[\n,]+/);
      const cleaned: string[] = Array.from(
        new Set<string>(
          rawList
            .map((e: unknown) => String(e || "").trim().toLowerCase())
            .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        )
      );

      const resData = updateStore((store) => {
        store.ownerEmails = cleaned;
        // Auto-promote existing Google users whose email is in whitelist
        for (const u of Object.values(store.users)) {
          if (u.email && cleaned.includes(u.email.toLowerCase())) {
            u.role = "owner";
            u.chatLimit = 999999;
          }
        }
        appendAuditLog(
          store,
          actor.username,
          "OWNER_EMAIL_WHITELIST",
          `Simpan ${cleaned.length} email Google Owner`
        );
        return {
          ownerEmails: store.ownerEmails,
          users: Object.values(store.users).map(sanitizePublicUser),
        };
      });

      return NextResponse.json({ ok: true, ...resData });
    }

    return NextResponse.json({ ok: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengelola akun.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
