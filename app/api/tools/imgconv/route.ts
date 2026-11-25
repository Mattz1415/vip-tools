import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "Pilih file gambar terlebih dahulu." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "Ukuran file maksimal 10MB." }, { status: 400 });
    }

    const format = String(form.get("format") || "webp").toLowerCase();
    const quality = Math.min(100, Math.max(15, Number(form.get("quality") || 80)));
    const maxWidth = Math.min(3840, Math.max(0, Number(form.get("maxWidth") || 0)));
    const grayscale = String(form.get("grayscale") || "0") === "1";

    const inputBuf = Buffer.from(await file.arrayBuffer());
    let pipe = sharp(inputBuf).rotate();
    if (maxWidth > 0) {
      pipe = pipe.resize({ width: maxWidth, withoutEnlargement: true });
    }
    if (grayscale) {
      pipe = pipe.grayscale();
    }

    let mime = "image/webp";
    let ext = "webp";
    if (format === "jpeg" || format === "jpg") {
      pipe = pipe.jpeg({ quality, mozjpeg: true });
      mime = "image/jpeg";
      ext = "jpg";
    } else if (format === "png") {
      pipe = pipe.png({ compressionLevel: 9, palette: quality < 90, quality });
      mime = "image/png";
      ext = "png";
    } else if (format === "avif") {
      pipe = pipe.avif({ quality });
      mime = "image/avif";
      ext = "avif";
    } else {
      pipe = pipe.webp({ quality });
      mime = "image/webp";
      ext = "webp";
    }

    const { data, info } = await pipe.toBuffer({ resolveWithObject: true });

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "X-Original-Bytes": String(inputBuf.byteLength),
        "X-Output-Bytes": String(data.byteLength),
        "X-Output-Dimensions": `${info.width}x${info.height}`,
        "X-Output-Ext": ext,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengonversi gambar di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
