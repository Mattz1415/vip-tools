import { NextRequest, NextResponse } from "next/server";
import { assertPublicHttpUrl } from "@/lib/server/net-guard";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = String(body?.url || "").trim();
    if (!rawUrl) {
      return NextResponse.json({ ok: false, error: "URL target wajib diisi." }, { status: 400 });
    }

    const parsed = await assertPublicHttpUrl(rawUrl);
    const t0 = Date.now();
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,text/css,application/javascript,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    const latencyMs = Date.now() - t0;
    const rawText = await upstream.text();
    const html = rawText.slice(0, 260_000);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "(tanpa judul)";

    const stylesheets: string[] = [];
    for (const m of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)) {
      try {
        stylesheets.push(new URL(m[1], upstream.url).toString());
      } catch {
        stylesheets.push(m[1]);
      }
    }

    const scripts: string[] = [];
    for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
      try {
        scripts.push(new URL(m[1], upstream.url).toString());
      } catch {
        scripts.push(m[1]);
      }
    }

    return NextResponse.json({
      ok: true,
      finalUrl: upstream.url,
      status: upstream.status,
      contentType: upstream.headers.get("content-type") || "text/plain",
      latencyMs,
      bytes: Buffer.byteLength(rawText, "utf8"),
      truncated: rawText.length > 260_000,
      title,
      stylesheets: Array.from(new Set(stylesheets)).slice(0, 25),
      scripts: Array.from(new Set(scripts)).slice(0, 25),
      html,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengekstrak source dari VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
