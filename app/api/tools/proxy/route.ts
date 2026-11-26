import { NextRequest, NextResponse } from "next/server";
import { assertPublicHttpUrl, safeFetchPublic, sanitizePublicError } from "@/lib/server/net-guard";

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url") || "";
    const filename = (req.nextUrl.searchParams.get("filename") || "mattzlm_media")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const asDownload = req.nextUrl.searchParams.get("download") === "1";

    const parsed = await assertPublicHttpUrl(rawUrl);

    const { response: upstream } = await safeFetchPublic(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
      },
      signal: AbortSignal.timeout(25000),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { ok: false, error: `Upstream mengembalikan HTTP ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "private, max-age=300");
    if (asDownload) {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }
    const contentLen = upstream.headers.get("content-length");
    if (contentLen) headers.set("Content-Length", contentLen);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err) {
    const msg = sanitizePublicError(err, "Proxy media gagal.");
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
