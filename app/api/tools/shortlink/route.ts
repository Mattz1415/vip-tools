import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { assertPublicHttpUrl } from "@/lib/server/net-guard";
import { readStore, updateStore } from "@/lib/server/store";

export async function GET() {
  try {
    const store = readStore();
    return NextResponse.json({
      ok: true,
      shortLinks: store.shortLinks.slice(0, 20),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar shortlink.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = String(body?.url || "").trim();
    const customAlias = String(body?.alias || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    if (!rawUrl) {
      return NextResponse.json({ ok: false, error: "URL tujuan wajib diisi." }, { status: 400 });
    }
    const parsed = await assertPublicHttpUrl(rawUrl);
    const user = await getCurrentSessionUser();

    const outcome = updateStore((store) => {
      let code = customAlias;
      if (code) {
        if (code.length < 3 || code.length > 24) {
          return { error: "Alias harus 3-24 karakter (huruf, angka, - atau _).", status: 400 };
        }
        if (store.shortLinks.some((s) => s.code === code)) {
          return { error: `Kode "/s/${code}" sudah digunakan.`, status: 409 };
        }
      } else {
        code = crypto.randomBytes(4).toString("base64url").slice(0, 6);
        while (store.shortLinks.some((s) => s.code === code)) {
          code = crypto.randomBytes(4).toString("base64url").slice(0, 6);
        }
      }

      const entry = {
        code,
        url: parsed.toString(),
        clicks: 0,
        createdBy: user?.username || "guest",
        createdAt: Date.now(),
      };
      store.shortLinks.unshift(entry);
      if (store.shortLinks.length > 200) {
        store.shortLinks = store.shortLinks.slice(0, 200);
      }
      return { entry, recent: store.shortLinks.slice(0, 20) };
    });

    if ("error" in outcome) {
      return NextResponse.json({ ok: false, error: outcome.error }, { status: outcome.status });
    }
    return NextResponse.json({ ok: true, ...outcome }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat shortlink di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
