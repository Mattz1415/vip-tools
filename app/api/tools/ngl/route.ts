import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "")
      .trim()
      .replace(/^https?:\/\/ngl\.link\//i, "")
      .replace(/^@/, "")
      .split(/[/?#]/)[0];
    const question = String(body?.question || "").trim();

    if (!username || !/^[a-zA-Z0-9._-]{1,40}$/.test(username)) {
      return NextResponse.json(
        { ok: false, error: "Username NGL tidak valid." },
        { status: 400 }
      );
    }
    if (!question || question.length > 300) {
      return NextResponse.json(
        { ok: false, error: "Pesan harus 1 sampai 300 karakter." },
        { status: 400 }
      );
    }

    const deviceId = crypto.randomUUID();
    const upstream = await fetch("https://ngl.link/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Origin: "https://ngl.link",
        Referer: `https://ngl.link/${encodeURIComponent(username)}`,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new URLSearchParams({
        username,
        question,
        deviceId,
        gameSlug: "",
        referrer: "",
      }),
      signal: AbortSignal.timeout(10000),
    });

    const text = await upstream.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 240) };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `NGL menolak permintaan (HTTP ${upstream.status}). Pastikan username @${username} aktif.`,
          detail: parsed,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      username,
      questionId: parsed.questionId || null,
      userRegion: parsed.userRegion || null,
      detail: parsed,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengirim ke NGL lewat VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
