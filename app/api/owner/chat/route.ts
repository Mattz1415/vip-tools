import { NextRequest, NextResponse } from "next/server";
import { requireOwnerUser } from "@/lib/server/auth";
import { appendAuditLog, updateStore } from "@/lib/server/store";

export async function POST(req: NextRequest) {
  const { user: actor, error } = await requireOwnerUser();
  if (error || !actor) return error!;

  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "reply") {
      const text = String(body?.text || "").trim();
      if (!text || text.length > 500) {
        return NextResponse.json(
          { ok: false, error: "Balasan harus 1 sampai 500 karakter." },
          { status: 400 }
        );
      }
      const chatMessages = updateStore((store) => {
        store.chatMessages.push({
          id: "adm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          sender: "admin",
          username: "Owner",
          text,
          time: Date.now(),
        });
        if (store.chatMessages.length > 100) {
          store.chatMessages = store.chatMessages.slice(-100);
        }
        appendAuditLog(store, actor.username, "OWNER_CHAT_REPLY", text.slice(0, 80));
        return store.chatMessages.slice(-80);
      });
      return NextResponse.json({ ok: true, chatMessages });
    }

    if (action === "resetLimits") {
      updateStore((store) => {
        for (const u of Object.values(store.users)) {
          u.chatLimit = u.role === "owner" ? 999999 : 5;
        }
        appendAuditLog(store, actor.username, "OWNER_RESET_CHAT_LIMITS", "Reset limit chat semua user ke 5");
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "clearChat") {
      updateStore((store) => {
        store.chatMessages = [];
        appendAuditLog(store, actor.username, "OWNER_CLEAR_CHAT", "Bersihkan seluruh riwayat chat");
      });
      return NextResponse.json({ ok: true, chatMessages: [] });
    }

    return NextResponse.json({ ok: false, error: "Aksi chat tidak dikenali." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses aksi chat.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
