import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const text = (req.nextUrl.searchParams.get("text") || "").trim();
    const format = (req.nextUrl.searchParams.get("format") || "png").toLowerCase();
    const rawSize = parseInt(req.nextUrl.searchParams.get("size") || "400", 10);
    const size = Math.min(1024, Math.max(160, Number.isNaN(rawSize) ? 400 : rawSize));

    if (!text || text.length > 2000) {
      return NextResponse.json(
        { ok: false, error: "Teks/URL QR wajib diisi (maks 2000 karakter)." },
        { status: 400 }
      );
    }

    if (format === "svg") {
      const svg = await QRCode.toString(text, {
        type: "svg",
        width: size,
        margin: 2,
        color: { dark: "#111111", light: "#ffffff" },
      });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const buf = await QRCode.toBuffer(text, {
      type: "png",
      width: size,
      margin: 2,
      color: { dark: "#111111", light: "#ffffff" },
    });

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat QR Code.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
