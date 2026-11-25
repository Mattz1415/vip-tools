import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { readStore, updateStore } from "@/lib/server/store";

export async function GET() {
  const store = readStore();
  return NextResponse.json({
    ok: true,
    pastes: store.pastes.slice(0, 15).map((p) => ({
      id: p.id,
      title: p.title,
      lang: p.lang,
      views: p.views,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body?.title || "Untitled Paste").trim().slice(0, 80) || "Untitled Paste";
    const lang = String(body?.lang || "text").trim().slice(0, 24);
    const content = String(body?.content || "");

    if (!content.trim() || content.length > 100_000) {
      return NextResponse.json(
        { ok: false, error: "Isi teks/kode wajib diisi (maks 100KB)." },
        { status: 400 }
      );
    }

    const user = await getCurrentSessionUser();
    const id = crypto.randomBytes(4).toString("hex");

    const entry = updateStore((store) => {
      const item = {
        id,
        title,
        lang,
        content,
        views: 0,
        createdBy: user?.username || "guest",
        createdAt: Date.now(),
      };
      store.pastes.unshift(item);
      if (store.pastes.length > 200) {
        store.pastes = store.pastes.slice(0, 200);
      }
      return item;
    });

    return NextResponse.json(
      {
        ok: true,
        paste: {
          id: entry.id,
          title: entry.title,
          lang: entry.lang,
          createdAt: entry.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan paste di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
