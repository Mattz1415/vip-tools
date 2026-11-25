import { NextRequest, NextResponse } from "next/server";
import {
  attachSessionCookie,
  sanitizePublicUser,
  verifyFirebaseIdToken,
} from "@/lib/server/auth";
import {
  appendAuditLog,
  getEffectiveFirebaseConfig,
  isFirebaseReady,
  isOwnerEmail,
  readStore,
  updateStore,
} from "@/lib/server/store";

function makeGoogleUsername(email: string, name: string, existing: Record<string, unknown>): string {
  const baseRaw = (email ? email.split("@")[0] : name || "google_pilot")
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .slice(0, 22);
  const base = baseRaw.length >= 3 ? baseRaw : "pilot_" + Math.random().toString(36).slice(2, 6);
  if (!existing[base]) return base;
  for (let i = 1; i < 999; i++) {
    const candidate = `${base}_${i}`;
    if (!existing[candidate]) return candidate;
  }
  return `${base}_${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idToken = String(body?.idToken || "").trim();
    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: "Token login Google tidak ditemukan." },
        { status: 400 }
      );
    }

    const currentStore = readStore();
    const fbCfg = getEffectiveFirebaseConfig(currentStore);
    if (!isFirebaseReady(fbCfg)) {
      return NextResponse.json(
        { ok: false, error: "Login Google belum diaktifkan." },
        { status: 503 }
      );
    }

    const verified = await verifyFirebaseIdToken(idToken, fbCfg.projectId);
    const now = Date.now();

    const outcome = updateStore((store) => {
      let existingKey = Object.keys(store.users).find((k) => {
        const u = store.users[k];
        return (
          (u.googleUid && u.googleUid === verified.uid) ||
          (verified.email && u.email && u.email.toLowerCase() === verified.email.toLowerCase())
        );
      });

      const emailIsOwner = verified.email ? isOwnerEmail(verified.email, store) : false;

      if (existingKey) {
        const user = store.users[existingKey];
        user.googleUid = verified.uid;
        if (verified.email) user.email = verified.email;
        if (verified.name) user.displayName = verified.name;
        if (verified.picture && !user.photoUrl) user.photoUrl = verified.picture;
        if (emailIsOwner) user.role = "owner";
        if (store.settings.maintenanceMode && user.role !== "owner") {
          return { maintenance: true as const };
        }
        user.lastLoginAt = now;
        appendAuditLog(store, user.username, "LOGIN_GOOGLE", `Login Google (${verified.email || verified.uid})`);
        return { user: sanitizePublicUser(user) };
      }

      if (store.settings.maintenanceMode && !emailIsOwner) {
        return { maintenance: true as const };
      }

      const username = makeGoogleUsername(verified.email, verified.name, store.users);
      store.users[username] = {
        username,
        passwordHash: "",
        role: emailIsOwner ? "owner" : "member",
        provider: "google",
        email: verified.email,
        googleUid: verified.uid,
        displayName: verified.name,
        photoUrl: verified.picture,
        chatLimit: emailIsOwner ? 999999 : 5,
        createdAt: now,
        lastLoginAt: now,
      };
      appendAuditLog(
        store,
        username,
        "REGISTER_GOOGLE",
        `Akun Google baru (${verified.email || verified.uid}) role=${store.users[username].role}`
      );
      return { user: sanitizePublicUser(store.users[username]) };
    });

    if ("maintenance" in outcome) {
      return NextResponse.json(
        { ok: false, error: "Sistem sedang dalam mode maintenance. Hanya Owner yang dapat masuk." },
        { status: 503 }
      );
    }

    const res = NextResponse.json({ ok: true, user: outcome.user });
    return attachSessionCookie(res, outcome.user.username);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memverifikasi akun Google.";
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
}
