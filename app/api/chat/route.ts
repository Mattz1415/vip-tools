import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser, requireAuthUser } from "@/lib/server/auth";
import { readStore, updateStore } from "@/lib/server/store";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    const store = readStore();
    const isOwner = user?.role === "owner";
    const chatLimit = isOwner
      ? 999999
      : user
        ? store.users[user.username]?.chatLimit ?? 5
        : 5;

    return NextResponse.json({
      ok: true,
      messages: store.chatMessages.slice(-60),
      chatLimit,
      isOwner,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memuat pesan chat.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuthUser();
  if (error || !user) return error!;

  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();
    if (!text || text.length > 500) {
      return NextResponse.json(
        { ok: false, error: "Pesan harus 1 sampai 500 karakter." },
        { status: 400 }
      );
    }

    const result = updateStore((store) => {
      const dbUser = store.users[user.username];
      const isOwner = dbUser?.role === "owner";
      if (!isOwner && (dbUser?.chatLimit ?? 0) <= 0) {
        return { error: "Limit chat habis. Tunggu admin/owner membalas atau mereset limit.", status: 429 };
      }

      const msg = {
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        sender: (isOwner && body?.asAdmin ? "admin" : "user") as "user" | "admin",
        username: isOwner && body?.asAdmin ? "Owner" : user.username,
        text,
        time: Date.now(),
      };
      store.chatMessages.push(msg);
      if (store.chatMessages.length > 100) {
        store.chatMessages = store.chatMessages.slice(-100);
      }
      if (!isOwner && dbUser) {
        dbUser.chatLimit = Math.max(0, (dbUser.chatLimit ?? 5) - 1);
      }
      return {
        messages: store.chatMessages.slice(-60),
        chatLimit: isOwner ? 999999 : dbUser?.chatLimit ?? 0,
      };
    });

    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengirim pesan.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
