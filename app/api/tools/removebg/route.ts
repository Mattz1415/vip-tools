import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { safeFetchPublic, sanitizePublicError } from "@/lib/server/net-guard";

const MAX_BYTES = 8 * 1024 * 1024;

async function extractImageBuffer(req: NextRequest): Promise<{
  buffer: Buffer;
  tolerance: number;
}> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const url = String(form.get("url") || "").trim();
    const tolerance = Math.min(120, Math.max(8, Number(form.get("tolerance") || 42)));

    if (file && file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) throw new Error("Ukuran gambar maksimal 8MB.");
      return { buffer: Buffer.from(await file.arrayBuffer()), tolerance };
    }
    if (url) {
      const { response: res } = await safeFetchPublic(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`Gagal mengunduh gambar (HTTP ${res.status}).`);
      const arr = await res.arrayBuffer();
      if (arr.byteLength > MAX_BYTES) throw new Error("Ukuran gambar melebihi 8MB.");
      return { buffer: Buffer.from(arr), tolerance };
    }
    throw new Error("Unggah file gambar atau masukkan URL gambar.");
  }

  const body = await req.json();
  const url = String(body?.url || "").trim();
  const tolerance = Math.min(120, Math.max(8, Number(body?.tolerance || 42)));
  if (!url) throw new Error("URL gambar wajib diisi.");
  const { response: res } = await safeFetchPublic(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Gagal mengunduh gambar (HTTP ${res.status}).`);
  const arr = await res.arrayBuffer();
  if (arr.byteLength > MAX_BYTES) throw new Error("Ukuran gambar melebihi 8MB.");
  return { buffer: Buffer.from(arr), tolerance };
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export async function POST(req: NextRequest) {
  try {
    const { buffer, tolerance } = await extractImageBuffer(req);

    // Resize safely so BFS segmentation runs fast on VPS
    const { data, info } = await sharp(buffer)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const w = info.width;
    const h = info.height;
    const total = w * h;
    const pixels = new Uint8ClampedArray(data);

    // Sample border colors (corners + mid-edges)
    const sampleCoords: Array<[number, number]> = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
      [Math.floor(w / 2), 0],
      [Math.floor(w / 2), h - 1],
      [0, Math.floor(h / 2)],
      [w - 1, Math.floor(h / 2)],
    ];

    const bgSeeds: Array<[number, number, number]> = sampleCoords.map(([x, y]) => {
      const idx = (y * w + x) * 4;
      return [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
    });

    const isNearBg = (idx4: number, tol: number): boolean => {
      const r = pixels[idx4];
      const g = pixels[idx4 + 1];
      const b = pixels[idx4 + 2];
      for (const [sr, sg, sb] of bgSeeds) {
        if (colorDist(r, g, b, sr, sg, sb) <= tol) return true;
      }
      return false;
    };

    // Border-connected BFS flood fill
    const visited = new Uint8Array(total);
    const removed = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;

    const pushIfBg = (x: number, y: number) => {
      const pos = y * w + x;
      if (visited[pos]) return;
      visited[pos] = 1;
      if (isNearBg(pos * 4, tolerance)) {
        removed[pos] = 1;
        queue[tail++] = pos;
      }
    };

    for (let x = 0; x < w; x++) {
      pushIfBg(x, 0);
      pushIfBg(x, h - 1);
    }
    for (let y = 1; y < h - 1; y++) {
      pushIfBg(0, y);
      pushIfBg(w - 1, y);
    }

    while (head < tail) {
      const pos = queue[head++];
      const x = pos % w;
      const y = (pos - x) / w;
      const base4 = pos * 4;
      const br = pixels[base4];
      const bg = pixels[base4 + 1];
      const bb = pixels[base4 + 2];

      const neighbors = [
        x > 0 ? pos - 1 : -1,
        x + 1 < w ? pos + 1 : -1,
        y > 0 ? pos - w : -1,
        y + 1 < h ? pos + w : -1,
      ];

      for (const nPos of neighbors) {
        if (nPos < 0 || visited[nPos]) continue;
        visited[nPos] = 1;
        const n4 = nPos * 4;
        const localDiff = colorDist(pixels[n4], pixels[n4 + 1], pixels[n4 + 2], br, bg, bb);
        if (isNearBg(n4, tolerance * 1.15) || localDiff <= tolerance * 0.55) {
          removed[nPos] = 1;
          queue[tail++] = nPos;
        }
      }
    }

    // Apply transparency + 1px soft edge feathering
    for (let pos = 0; pos < total; pos++) {
      const idx4 = pos * 4;
      if (removed[pos]) {
        pixels[idx4 + 3] = 0;
      } else {
        const x = pos % w;
        const y = (pos - x) / w;
        let bgNeighbors = 0;
        if (x > 0 && removed[pos - 1]) bgNeighbors++;
        if (x + 1 < w && removed[pos + 1]) bgNeighbors++;
        if (y > 0 && removed[pos - w]) bgNeighbors++;
        if (y + 1 < h && removed[pos + w]) bgNeighbors++;
        if (bgNeighbors > 0) {
          pixels[idx4 + 3] = Math.round(pixels[idx4 + 3] * (1 - bgNeighbors * 0.16));
        }
      }
    }

    const outPng = await sharp(Buffer.from(pixels), {
      raw: { width: w, height: h, channels: 4 },
    })
      .png({ compressionLevel: 8 })
      .toBuffer();

    return new NextResponse(new Uint8Array(outPng), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "X-Image-Dimensions": `${w}x${h}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = sanitizePublicError(err, "Gagal menghapus latar belakang.");
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
