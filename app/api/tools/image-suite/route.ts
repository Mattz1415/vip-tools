import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { buildImagesPdf } from "@/lib/server/pdf-writer";

const MAX_BYTES = 10 * 1024 * 1024;

function escapeXml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function rgbToHsl(r: number, g: number, b: number): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function buildIcoFromPngs(entries: Array<{ size: number; png: Buffer }>): Buffer {
  const count = entries.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4);

  let offset = header.length;
  for (let i = 0; i < count; i++) {
    const e = entries[i];
    const base = 6 + i * 16;
    header.writeUInt8(e.size >= 256 ? 0 : e.size, base);
    header.writeUInt8(e.size >= 256 ? 0 : e.size, base + 1);
    header.writeUInt8(0, base + 2);
    header.writeUInt8(0, base + 3);
    header.writeUInt16LE(1, base + 4);
    header.writeUInt16LE(32, base + 6);
    header.writeUInt32LE(e.png.length, base + 8);
    header.writeUInt32LE(offset, base + 12);
    offset += e.png.length;
  }
  return Buffer.concat([header, ...entries.map((e) => e.png)]);
}

const SOCIAL_PRESETS: Record<string, { w: number; h: number; label: string }> = {
  ig_square: { w: 1080, h: 1080, label: "Instagram Feed (1080x1080)" },
  ig_portrait: { w: 1080, h: 1350, label: "Instagram Portrait (1080x1350)" },
  ig_story: { w: 1080, h: 1920, label: "Reels / Story / TikTok (1080x1920)" },
  yt_thumb: { w: 1280, h: 720, label: "YouTube Thumbnail (1280x720)" },
  og_card: { w: 1200, h: 630, label: "OpenGraph / LinkedIn (1200x630)" },
  x_header: { w: 1500, h: 500, label: "X / Twitter Header (1500x500)" },
};

async function readSingleFile(form: FormData): Promise<{ file: File; buf: Buffer }> {
  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new Error("Pilih file gambar terlebih dahulu.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Ukuran file maksimal 10MB.");
  }
  return { file, buf: Buffer.from(await file.arrayBuffer()) };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const action = String(form.get("action") || "").toLowerCase();

    // 1. EXIF / Metadata Inspector
    if (action === "exif") {
      const { file, buf } = await readSingleFile(form);
      const meta = await sharp(buf).metadata();
      const stats = await sharp(buf).stats();
      const hasMetadata = Boolean(meta.exif || meta.xmp || meta.iptc || meta.icc);
      return NextResponse.json({
        ok: true,
        action: "exif",
        fileName: file.name,
        bytes: buf.length,
        format: meta.format || "-",
        width: meta.width || 0,
        height: meta.height || 0,
        space: meta.space || "-",
        channels: meta.channels || 0,
        depth: meta.depth || "-",
        density: meta.density || null,
        hasAlpha: Boolean(meta.hasAlpha),
        orientation: meta.orientation || 1,
        isProgressive: Boolean(meta.isProgressive),
        metadataBlocks: {
          exifBytes: meta.exif?.length || 0,
          iccBytes: meta.icc?.length || 0,
          iptcBytes: meta.iptc?.length || 0,
          xmpBytes: meta.xmp?.length || 0,
        },
        hasMetadata,
        entropy: Number(stats.entropy.toFixed(3)),
        isOpaque: stats.isOpaque,
      });
    }

    // 2. EXIF / Metadata Privacy Stripper
    if (action === "strip_exif") {
      const { buf } = await readSingleFile(form);
      const meta = await sharp(buf).metadata();
      const fmt = meta.format === "png" ? "png" : meta.format === "webp" ? "webp" : "jpeg";
      let pipe = sharp(buf).rotate();
      let mime = "image/jpeg";
      let ext = "jpg";
      if (fmt === "png") {
        pipe = pipe.png({ compressionLevel: 9 });
        mime = "image/png";
        ext = "png";
      } else if (fmt === "webp") {
        pipe = pipe.webp({ quality: 92 });
        mime = "image/webp";
        ext = "webp";
      } else {
        pipe = pipe.jpeg({ quality: 92, mozjpeg: true });
      }
      const { data, info } = await pipe.toBuffer({ resolveWithObject: true });
      return new NextResponse(new Uint8Array(data), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "X-Original-Bytes": String(buf.length),
          "X-Output-Bytes": String(data.length),
          "X-Output-Dimensions": `${info.width}x${info.height}`,
          "X-Output-Ext": ext,
          "Cache-Control": "no-store",
        },
      });
    }

    // 3. Image Watermark
    if (action === "watermark") {
      const { buf } = await readSingleFile(form);
      const text = String(form.get("text") || "MATTZLM").trim().slice(0, 60);
      if (!text) return NextResponse.json({ ok: false, error: "Teks watermark wajib diisi." }, { status: 400 });
      const position = String(form.get("position") || "southeast").toLowerCase();
      const opacity = Math.min(0.95, Math.max(0.1, Number(form.get("opacity") || 0.45)));
      const tone = String(form.get("tone") || "light").toLowerCase();

      const base = sharp(buf).rotate();
      const meta = await base.metadata();
      const w = Math.max(120, meta.width || 800);
      const h = Math.max(120, meta.height || 600);
      const fontSize = Math.max(18, Math.min(72, Math.round(Math.min(w, h) * 0.055)));
      const fill = tone === "dark" ? "#0A0A0A" : "#FFFFFF";
      const stroke = tone === "dark" ? "#FFFFFF" : "#0A0A0A";
      const safeText = escapeXml(text);

      let svgContent = "";
      if (position === "tile") {
        const stepX = Math.max(220, Math.round(fontSize * Math.max(6, text.length * 0.85)));
        const stepY = Math.max(150, Math.round(fontSize * 3.4));
        const nodes: string[] = [];
        for (let y = Math.round(stepY / 2); y < h + stepY; y += stepY) {
          for (let x = Math.round(stepX / 2); x < w + stepX; x += stepX) {
            nodes.push(
              `<text x="${x}" y="${y}" text-anchor="middle" transform="rotate(-24 ${x} ${y})" font-family="sans-serif" font-weight="700" font-size="${fontSize}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-opacity="${(opacity * 0.45).toFixed(2)}" stroke-width="1.5">${safeText}</text>`
            );
          }
        }
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${nodes.join("")}</svg>`;
      } else {
        const pad = Math.round(fontSize * 0.9);
        let x = w - pad;
        let y = h - pad;
        let anchor = "end";
        if (position === "center") {
          x = Math.round(w / 2);
          y = Math.round(h / 2);
          anchor = "middle";
        } else if (position === "northwest") {
          x = pad;
          y = pad + fontSize;
          anchor = "start";
        } else if (position === "northeast") {
          x = w - pad;
          y = pad + fontSize;
          anchor = "end";
        } else if (position === "southwest") {
          x = pad;
          y = h - pad;
          anchor = "start";
        }
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${x}" y="${y}" text-anchor="${anchor}" font-family="sans-serif" font-weight="700" font-size="${fontSize}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-opacity="${(opacity * 0.55).toFixed(2)}" stroke-width="2">${safeText}</text></svg>`;
      }

      const { data, info } = await base
        .composite([{ input: Buffer.from(svgContent), top: 0, left: 0 }])
        .png({ compressionLevel: 8 })
        .toBuffer({ resolveWithObject: true });

      return new NextResponse(new Uint8Array(data), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "X-Output-Bytes": String(data.length),
          "X-Output-Dimensions": `${info.width}x${info.height}`,
          "X-Output-Ext": "png",
          "Cache-Control": "no-store",
        },
      });
    }

    // 4. Social Media Resizer & Smart Crop
    if (action === "social_crop") {
      const { buf } = await readSingleFile(form);
      const presetKey = String(form.get("preset") || "ig_square").toLowerCase();
      const fitRaw = String(form.get("fit") || "cover").toLowerCase();
      const fit = fitRaw === "contain" || fitRaw === "fill" ? fitRaw : "cover";

      let width = SOCIAL_PRESETS[presetKey]?.w || 1080;
      let height = SOCIAL_PRESETS[presetKey]?.h || 1080;
      if (presetKey === "custom") {
        width = Math.min(3840, Math.max(64, Number(form.get("width") || 1080)));
        height = Math.min(3840, Math.max(64, Number(form.get("height") || 1080)));
      }

      const { data, info } = await sharp(buf)
        .rotate()
        .resize({
          width,
          height,
          fit,
          position: sharp.strategy.attention,
          background: { r: 10, g: 10, b: 10, alpha: 1 },
        })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      return new NextResponse(new Uint8Array(data), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "X-Output-Bytes": String(data.length),
          "X-Output-Dimensions": `${info.width}x${info.height}`,
          "X-Output-Ext": "jpg",
          "Cache-Control": "no-store",
        },
      });
    }

    // 5. Dominant Color Palette Extractor
    if (action === "palette") {
      const { file, buf } = await readSingleFile(form);
      const { data, info } = await sharp(buf)
        .rotate()
        .resize(64, 64, { fit: "inside" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
      const totalPixels = info.width * info.height;
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const qr = Math.floor(r / 24) * 24;
        const qg = Math.floor(g / 24) * 24;
        const qb = Math.floor(b / 24) * 24;
        const key = `${qr},${qg},${qb}`;
        const prev = buckets.get(key);
        if (prev) {
          prev.count += 1;
          prev.r += r;
          prev.g += g;
          prev.b += b;
        } else {
          buckets.set(key, { count: 1, r, g, b });
        }
      }

      const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
      const swatches: Array<{
        hex: string;
        rgb: string;
        hsl: string;
        percent: number;
        textColor: string;
      }> = [];

      for (const b of sorted) {
        const r = Math.round(b.r / b.count);
        const g = Math.round(b.g / b.count);
        const bl = Math.round(b.b / b.count);
        const tooClose = swatches.some((existing) => {
          const er = parseInt(existing.hex.slice(1, 3), 16);
          const eg = parseInt(existing.hex.slice(3, 5), 16);
          const eb = parseInt(existing.hex.slice(5, 7), 16);
          return Math.hypot(r - er, g - eg, bl - eb) < 38;
        });
        if (tooClose) continue;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
        swatches.push({
          hex: rgbToHex(r, g, bl),
          rgb: `rgb(${r}, ${g}, ${bl})`,
          hsl: rgbToHsl(r, g, bl),
          percent: Number(((b.count / Math.max(1, totalPixels)) * 100).toFixed(1)),
          textColor: luma > 135 ? "#0A0A0A" : "#FFFFFF",
        });
        if (swatches.length >= 6) break;
      }

      return NextResponse.json({
        ok: true,
        action: "palette",
        fileName: file.name,
        swatches,
      });
    }

    // 6. Favicon Pack Generator (ICO + multi-size PNGs + HTML tags)
    if (action === "favicon") {
      const { buf } = await readSingleFile(form);
      const sizes = [16, 32, 48, 180, 192, 512];
      const pngMap: Record<number, Buffer> = {};
      await Promise.all(
        sizes.map(async (sz) => {
          pngMap[sz] = await sharp(buf)
            .rotate()
            .resize(sz, sz, { fit: "cover" })
            .png({ compressionLevel: 9 })
            .toBuffer();
        })
      );

      const icoBuf = buildIcoFromPngs([
        { size: 16, png: pngMap[16] },
        { size: 32, png: pngMap[32] },
        { size: 48, png: pngMap[48] },
      ]);

      const htmlSnippet = [
        '<link rel="icon" href="/favicon.ico" sizes="any">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
        '<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">',
      ].join("\n");

      return NextResponse.json({
        ok: true,
        action: "favicon",
        icoDataUrl: `data:image/x-icon;base64,${icoBuf.toString("base64")}`,
        icoBytes: icoBuf.length,
        icons: [
          { name: "favicon-32x32.png", size: 32, dataUrl: `data:image/png;base64,${pngMap[32].toString("base64")}` },
          { name: "apple-touch-icon.png", size: 180, dataUrl: `data:image/png;base64,${pngMap[180].toString("base64")}` },
          { name: "android-chrome-192x192.png", size: 192, dataUrl: `data:image/png;base64,${pngMap[192].toString("base64")}` },
          { name: "android-chrome-512x512.png", size: 512, dataUrl: `data:image/png;base64,${pngMap[512].toString("base64")}` },
        ],
        htmlSnippet,
      });
    }

    // 7. Photo Filter, Rotate & Flip Studio
    if (action === "filters") {
      const { buf } = await readSingleFile(form);
      const rotateDeg = [0, 90, 180, 270].includes(Number(form.get("rotate") || 0))
        ? Number(form.get("rotate") || 0)
        : 0;
      const flipH = String(form.get("flipH") || "0") === "1";
      const flipV = String(form.get("flipV") || "0") === "1";
      const grayscale = String(form.get("grayscale") || "0") === "1";
      const negate = String(form.get("negate") || "0") === "1";
      const blur = Math.min(20, Math.max(0, Number(form.get("blur") || 0)));
      const sharpen = String(form.get("sharpen") || "0") === "1";
      const brightness = Math.min(2, Math.max(0.3, Number(form.get("brightness") || 1)));
      const saturation = Math.min(2.5, Math.max(0, Number(form.get("saturation") || 1)));

      let pipe = sharp(buf).rotate(rotateDeg);
      if (flipV) pipe = pipe.flip();
      if (flipH) pipe = pipe.flop();
      if (brightness !== 1 || saturation !== 1) {
        pipe = pipe.modulate({ brightness, saturation });
      }
      if (grayscale) pipe = pipe.grayscale();
      if (negate) pipe = pipe.negate({ alpha: false });
      if (blur >= 0.5) pipe = pipe.blur(blur);
      if (sharpen) pipe = pipe.sharpen({ sigma: 1.5 });

      const { data, info } = await pipe.png({ compressionLevel: 8 }).toBuffer({ resolveWithObject: true });
      return new NextResponse(new Uint8Array(data), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "X-Output-Bytes": String(data.length),
          "X-Output-Dimensions": `${info.width}x${info.height}`,
          "X-Output-Ext": "png",
          "Cache-Control": "no-store",
        },
      });
    }

    // 8. SVG to PNG Rasterizer
    if (action === "svg2png") {
      let svgText = String(form.get("svg") || "").trim();
      const file = form.get("file");
      if (!svgText && file && file instanceof File && file.size > 0) {
        if (file.size > 2 * 1024 * 1024) {
          return NextResponse.json({ ok: false, error: "File SVG maksimal 2MB." }, { status: 400 });
        }
        svgText = await file.text();
      }
      if (!svgText || !/<svg[\s>]/i.test(svgText)) {
        return NextResponse.json({ ok: false, error: "Masukkan kode SVG valid atau pilih file .svg." }, { status: 400 });
      }
      // Strip scripts and external references for safety
      const safeSvg = svgText
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, "");

      const width = Math.min(3000, Math.max(64, Number(form.get("width") || 1024)));
      const bg = String(form.get("background") || "transparent").toLowerCase();

      let pipe = sharp(Buffer.from(safeSvg, "utf8"), { density: 220 }).resize({
        width,
        withoutEnlargement: false,
      });
      if (bg === "white") pipe = pipe.flatten({ background: "#FFFFFF" });
      else if (bg === "black") pipe = pipe.flatten({ background: "#0A0A0A" });

      const { data, info } = await pipe.png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
      return new NextResponse(new Uint8Array(data), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "X-Output-Bytes": String(data.length),
          "X-Output-Dimensions": `${info.width}x${info.height}`,
          "X-Output-Ext": "png",
          "Cache-Control": "no-store",
        },
      });
    }

    // 9. Images to Multi-Page PDF
    if (action === "img2pdf") {
      const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
      if (files.length === 0) {
        return NextResponse.json({ ok: false, error: "Pilih minimal 1 file gambar (maks. 10)." }, { status: 400 });
      }
      if (files.length > 10) {
        return NextResponse.json({ ok: false, error: "Maksimal 10 gambar dalam satu PDF." }, { status: 400 });
      }

      const pages: Array<{ jpeg: Buffer; width: number; height: number }> = [];
      for (const f of files) {
        if (f.size > MAX_BYTES) {
          return NextResponse.json({ ok: false, error: `File ${f.name} melebihi batas 10MB.` }, { status: 400 });
        }
        const raw = Buffer.from(await f.arrayBuffer());
        const { data, info } = await sharp(raw)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .flatten({ background: "#FFFFFF" })
          .jpeg({ quality: 86, mozjpeg: true })
          .toBuffer({ resolveWithObject: true });
        pages.push({ jpeg: data, width: info.width, height: info.height });
      }

      const pdfBuf = buildImagesPdf(pages);
      return new NextResponse(new Uint8Array(pdfBuf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="mattzlm-images.pdf"',
          "X-Output-Bytes": String(pdfBuf.length),
          "X-Page-Count": String(pages.length),
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ ok: false, error: "Action image-suite tidak dikenal." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses gambar di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
