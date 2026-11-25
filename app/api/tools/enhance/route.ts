import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { assertPublicHttpUrl } from "@/lib/server/net-guard";

const MAX_BYTES = 8 * 1024 * 1024;

async function extractInput(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const url = String(form.get("url") || "").trim();
    const scale = Math.min(2, Math.max(1, Number(form.get("scale") || 2)));
    const sharpen = Math.min(3, Math.max(0.5, Number(form.get("sharpen") || 1.4)));
    const denoise = String(form.get("denoise") || "1") === "1";

    if (file && file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) throw new Error("Ukuran gambar maksimal 8MB.");
      return { buffer: Buffer.from(await file.arrayBuffer()), scale, sharpen, denoise };
    }
    if (url) {
      const parsed = await assertPublicHttpUrl(url);
      const res = await fetch(parsed.toString(), { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`Gagal mengunduh gambar (HTTP ${res.status}).`);
      const arr = await res.arrayBuffer();
      if (arr.byteLength > MAX_BYTES) throw new Error("Ukuran gambar melebihi 8MB.");
      return { buffer: Buffer.from(arr), scale, sharpen, denoise };
    }
    throw new Error("Unggah file gambar atau masukkan URL gambar.");
  }

  const body = await req.json();
  const url = String(body?.url || "").trim();
  const scale = Math.min(2, Math.max(1, Number(body?.scale || 2)));
  const sharpen = Math.min(3, Math.max(0.5, Number(body?.sharpen || 1.4)));
  const denoise = body?.denoise !== false;
  if (!url) throw new Error("URL gambar wajib diisi.");
  const parsed = await assertPublicHttpUrl(url);
  const res = await fetch(parsed.toString(), { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Gagal mengunduh gambar (HTTP ${res.status}).`);
  const arr = await res.arrayBuffer();
  if (arr.byteLength > MAX_BYTES) throw new Error("Ukuran gambar melebihi 8MB.");
  return { buffer: Buffer.from(arr), scale, sharpen, denoise };
}

export async function POST(req: NextRequest) {
  try {
    const { buffer, scale, sharpen, denoise } = await extractInput(req);
    const meta = await sharp(buffer).metadata();
    const origW = meta.width || 640;
    const origH = meta.height || 640;

    const targetW = Math.min(2400, Math.round(origW * scale));
    const targetH = Math.min(2400, Math.round(origH * scale));

    let pipeline = sharp(buffer).rotate();
    if (denoise) {
      pipeline = pipeline.median(3);
    }
    pipeline = pipeline
      .resize({ width: targetW, height: targetH, fit: "inside", kernel: sharp.kernel.lanczos3 })
      .normalize()
      .modulate({ brightness: 1.03, saturation: 1.08 })
      .sharpen({ sigma: sharpen, m1: 1.0, m2: 2.0 });

    const { data, info } = await pipeline
      .png({ compressionLevel: 8 })
      .toBuffer({ resolveWithObject: true });

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "X-Original-Dimensions": `${origW}x${origH}`,
        "X-Enhanced-Dimensions": `${info.width}x${info.height}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal meningkatkan kualitas gambar di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
