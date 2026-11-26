import fs from "node:fs";
import path from "node:path";
import { parse as parseFont, Path as OpenTypePath, type Font, type Glyph } from "opentype.js";
import sharp, { type PngOptions } from "sharp";

export type FontKey = "sans" | "sans-bold" | "mono" | "mono-bold" | "serif" | "serif-bold";

const FONT_FILES: Record<FontKey, string> = {
  sans: "DejaVuSans.ttf",
  "sans-bold": "DejaVuSans-Bold.ttf",
  mono: "DejaVuSansMono.ttf",
  "mono-bold": "DejaVuSansMono-Bold.ttf",
  serif: "DejaVuSerif.ttf",
  "serif-bold": "DejaVuSerif-Bold.ttf",
};

const fontCache = new Map<FontKey, Font>();

function readFontBuffer(filename: string): Buffer {
  const bundledPath = path.join(process.cwd(), "lib", "fonts", filename);
  if (fs.existsSync(bundledPath)) {
    return fs.readFileSync(bundledPath);
  }
  const sysPath = path.join("/usr/share/fonts/truetype/dejavu", filename);
  if (fs.existsSync(/*turbopackIgnore: true*/ sysPath)) {
    return fs.readFileSync(/*turbopackIgnore: true*/ sysPath);
  }
  throw new Error(`Font asset tidak ditemukan: ${filename}`);
}

export function getFont(key: FontKey): Font {
  const cached = fontCache.get(key);
  if (cached) return cached;

  const buf = readFontBuffer(FONT_FILES[key]);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const font = parseFont(ab);
  fontCache.set(key, font);
  return font;
}

export function pickFontKey(fontFamily?: string, fontWeight?: string): FontKey {
  const fam = String(fontFamily || "").toLowerCase();
  const wStr = String(fontWeight || "").toLowerCase().trim();
  const wNum = Number(wStr);
  const isBold = wStr === "bold" || wStr === "bolder" || (!Number.isNaN(wNum) && wNum >= 600);

  if (fam.includes("mono")) {
    return isBold ? "mono-bold" : "mono";
  }
  if (fam.includes("serif") && !fam.includes("sans-serif") && !fam.includes("sans")) {
    return isBold ? "serif-bold" : "serif";
  }
  return isBold ? "sans-bold" : "sans";
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const cp = parseInt(hex, 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : "";
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const cp = parseInt(dec, 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : "";
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeGlyphText(text: string): string {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFE0E\uFE0F\uFEFF]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

interface ResolvedGlyph {
  font: Font;
  glyph: Glyph;
  isSpace: boolean;
}

function resolveGlyphs(text: string, primaryKey: FontKey): ResolvedGlyph[] {
  const primary = getFont(primaryKey);
  const fallbackKey: FontKey = primaryKey.endsWith("-bold") ? "sans-bold" : "sans";
  const fallback = primaryKey === fallbackKey ? primary : getFont(fallbackKey);

  const clean = normalizeGlyphText(text);
  const out: ResolvedGlyph[] = [];

  for (const ch of Array.from(clean)) {
    if (ch === " " || ch === "\t") {
      const sp = primary.charToGlyph(" ");
      out.push({ font: primary, glyph: sp, isSpace: true });
      continue;
    }

    const g1 = primary.charToGlyph(ch);
    if (g1 && g1.index !== 0) {
      out.push({ font: primary, glyph: g1, isSpace: false });
      continue;
    }

    if (fallback !== primary) {
      const g2 = fallback.charToGlyph(ch);
      if (g2 && g2.index !== 0) {
        out.push({ font: fallback, glyph: g2, isSpace: false });
        continue;
      }
    }
    // Skip unsupported glyphs (e.g., color emoji) rather than rendering .notdef tofu rectangles
  }
  return out;
}

export function measureTextWidth(
  text: string,
  fontSize: number,
  opts?: { family?: string; weight?: string; letterSpacing?: number }
): number {
  const key = pickFontKey(opts?.family, opts?.weight);
  const letterSpacing = Number(opts?.letterSpacing || 0);
  const items = resolveGlyphs(text, key);
  if (items.length === 0) return 0;

  let width = 0;
  for (let i = 0; i < items.length; i++) {
    const cur = items[i];
    const scale = fontSize / cur.font.unitsPerEm;
    if (i > 0) {
      const prev = items[i - 1];
      if (prev.font === cur.font) {
        width += cur.font.getKerningValue(prev.glyph, cur.glyph) * scale;
      }
      width += letterSpacing;
    }
    width += (cur.glyph.advanceWidth || 0) * scale;
  }
  return width;
}

export function fitFontSize(
  text: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number,
  opts?: { family?: string; weight?: string; letterSpacing?: number }
): number {
  const trimmed = String(text || "").trim();
  if (!trimmed) return maxFontSize;
  const measuredMax = measureTextWidth(trimmed, maxFontSize, opts);
  if (measuredMax <= maxWidth || measuredMax <= 0) return maxFontSize;

  let size = Math.max(minFontSize, Math.floor((maxFontSize * maxWidth) / measuredMax));
  while (size > minFontSize && measureTextWidth(trimmed, size, opts) > maxWidth) {
    size -= 1;
  }
  return size;
}

export function wrapTextByWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
  opts?: { family?: string; weight?: string }
): string[] {
  const paragraphs = String(text || "").split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (lines.length < maxLines) lines.push("");
      continue;
    }

    let cur = "";
    for (const word of words) {
      const candidate = cur ? `${cur} ${word}` : word;
      if (measureTextWidth(candidate, fontSize, opts) <= maxWidth) {
        cur = candidate;
      } else {
        if (cur) {
          lines.push(cur);
          if (lines.length >= maxLines) break;
        }
        if (measureTextWidth(word, fontSize, opts) <= maxWidth) {
          cur = word;
        } else {
          let chunk = "";
          for (const ch of Array.from(word)) {
            if (measureTextWidth(chunk + ch, fontSize, opts) > maxWidth && chunk) {
              lines.push(chunk);
              if (lines.length >= maxLines) {
                chunk = "";
                break;
              }
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          cur = chunk;
        }
      }
      if (lines.length >= maxLines) break;
    }

    if (cur && lines.length < maxLines) {
      lines.push(cur);
    }
    if (lines.length >= maxLines) break;
  }

  return lines.slice(0, maxLines);
}

function buildTextPathData(
  text: string,
  startX: number,
  baselineY: number,
  fontSize: number,
  key: FontKey,
  letterSpacing: number
): { pathData: string; width: number } {
  const items = resolveGlyphs(text, key);
  if (items.length === 0) return { pathData: "", width: 0 };

  const combined = new OpenTypePath();
  let cursorX = startX;

  for (let i = 0; i < items.length; i++) {
    const cur = items[i];
    const scale = fontSize / cur.font.unitsPerEm;
    if (i > 0) {
      const prev = items[i - 1];
      if (prev.font === cur.font) {
        cursorX += cur.font.getKerningValue(prev.glyph, cur.glyph) * scale;
      }
      cursorX += letterSpacing;
    }
    if (!cur.isSpace) {
      const gp = cur.glyph.getPath(cursorX, baselineY, fontSize);
      combined.extend(gp);
    }
    cursorX += (cur.glyph.advanceWidth || 0) * scale;
  }

  return {
    pathData: combined.toPathData(2),
    width: cursorX - startX,
  };
}

function parseAttributes(rawAttrs: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(rawAttrs)) !== null) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3] || "";
  }
  return attrs;
}

interface SpanToken {
  text: string;
  attrs: Record<string, string>;
  hasLineBreakPos: boolean;
}

function tokenizeTextInner(inner: string): SpanToken[] {
  const tokens: SpanToken[] = [];
  const tspanRe = /<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = tspanRe.exec(inner)) !== null) {
    const before = inner.slice(lastIndex, m.index);
    if (before.length > 0) {
      tokens.push({
        text: decodeXmlEntities(before),
        attrs: {},
        hasLineBreakPos: false,
      });
    }
    const spanAttrs = parseAttributes(m[1] || "");
    const hasLineBreakPos =
      spanAttrs.x !== undefined || spanAttrs.y !== undefined || spanAttrs.dy !== undefined;
    tokens.push({
      text: decodeXmlEntities(m[2] || ""),
      attrs: spanAttrs,
      hasLineBreakPos,
    });
    lastIndex = tspanRe.lastIndex;
  }

  const tail = inner.slice(lastIndex);
  if (tail.length > 0) {
    tokens.push({
      text: decodeXmlEntities(tail),
      attrs: {},
      hasLineBreakPos: false,
    });
  }

  return tokens;
}

function emitStyledPath(
  pathData: string,
  attrs: Record<string, string>,
  baseX: number,
  baseY: number
): string {
  if (!pathData) return "";

  const fill = attrs.fill || "#000000";
  const fillOpacity = attrs["fill-opacity"];
  const opacity = attrs.opacity;
  const stroke = attrs.stroke && attrs.stroke !== "none" ? attrs.stroke : "";
  const strokeWidth = attrs["stroke-width"] || "1";
  const paintOrder = (attrs["paint-order"] || "").toLowerCase();
  const isItalic = (attrs["font-style"] || "").toLowerCase() === "italic";

  const sharedParts: string[] = [];
  if (opacity) sharedParts.push(`opacity="${opacity}"`);
  if (isItalic) {
    const bx = baseX.toFixed(2);
    const by = baseY.toFixed(2);
    const nbx = (-baseX).toFixed(2);
    const nby = (-baseY).toFixed(2);
    sharedParts.push(`transform="translate(${bx} ${by}) skewX(-11) translate(${nbx} ${nby})"`);
  }
  const shared = sharedParts.length > 0 ? ` ${sharedParts.join(" ")}` : "";
  const fillOpAttr = fillOpacity ? ` fill-opacity="${fillOpacity}"` : "";

  if (stroke && paintOrder.includes("stroke")) {
    return (
      `<path d="${pathData}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"${shared}/>` +
      `<path d="${pathData}" fill="${fill}"${fillOpAttr}${shared}/>`
    );
  }

  if (stroke) {
    return (
      `<path d="${pathData}" fill="${fill}"${fillOpAttr}${shared}/>` +
      `<path d="${pathData}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"${shared}/>`
    );
  }

  return `<path d="${pathData}" fill="${fill}"${fillOpAttr}${shared}/>`;
}

/**
 * Converts every SVG <text> (including nested <tspan>) into pure vector <path>
 * outlines using bundled TrueType fonts via opentype.js.
 * Result has zero <text> tags and zero dependency on OS fonts or fontconfig.
 */
export function vectorizeSvgText(svg: string): string {
  const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;

  return svg.replace(textRe, (_full, rawTextAttrs: string, inner: string) => {
    const baseAttrs = parseAttributes(rawTextAttrs || "");
    const baseX = Number(baseAttrs.x || 0);
    const baseY = Number(baseAttrs.y || 0);
    const baseAnchor = (baseAttrs["text-anchor"] || "start").toLowerCase();
    const tokens = tokenizeTextInner(inner);

    if (tokens.length === 0) return "";

    // Group tokens into visual lines. Any tspan with x, y, or dy starts a new positioned line.
    interface RunItem {
      text: string;
      attrs: Record<string, string>;
      fontKey: FontKey;
      fontSize: number;
      letterSpacing: number;
      width: number;
    }
    interface VisualLine {
      x: number;
      y: number;
      anchor: string;
      runs: RunItem[];
    }

    const lines: VisualLine[] = [];
    let curX = baseX;
    let curY = baseY;
    let currentLine: VisualLine | null = null;

    for (const tok of tokens) {
      const merged: Record<string, string> = { ...baseAttrs, ...tok.attrs };
      const fontSize = Math.max(1, Number(merged["font-size"] || 16));
      const letterSpacing = Number(merged["letter-spacing"] || 0);
      const fontKey = pickFontKey(merged["font-family"], merged["font-weight"]);
      const anchor = (merged["text-anchor"] || baseAnchor).toLowerCase();

      if (tok.hasLineBreakPos || !currentLine) {
        if (tok.attrs.x !== undefined) curX = Number(tok.attrs.x);
        if (tok.attrs.y !== undefined) curY = Number(tok.attrs.y);
        if (tok.attrs.dy !== undefined) curY += Number(tok.attrs.dy);
        if (tok.attrs.dx !== undefined) curX += Number(tok.attrs.dx);

        // Skip pure-whitespace separator text between block tspans
        if (!tok.hasLineBreakPos && !currentLine && tok.text.trim() === "" && tokens.some((t) => t.hasLineBreakPos)) {
          continue;
        }

        currentLine = { x: curX, y: curY, anchor, runs: [] };
        lines.push(currentLine);
      }

      const w = measureTextWidth(tok.text, fontSize, {
        family: merged["font-family"],
        weight: merged["font-weight"],
        letterSpacing,
      });

      currentLine.runs.push({
        text: tok.text,
        attrs: merged,
        fontKey,
        fontSize,
        letterSpacing,
        width: w,
      });
    }

    const parts: string[] = [];
    for (const line of lines) {
      const totalWidth = line.runs.reduce((acc, r) => acc + r.width, 0);
      let runX = line.x;
      if (line.anchor === "middle") runX = line.x - totalWidth / 2;
      else if (line.anchor === "end") runX = line.x - totalWidth;

      for (const run of line.runs) {
        if (run.text.length > 0) {
          const { pathData } = buildTextPathData(
            run.text,
            runX,
            line.y,
            run.fontSize,
            run.fontKey,
            run.letterSpacing
          );
          if (pathData) {
            parts.push(emitStyledPath(pathData, run.attrs, runX + run.width / 2, line.y));
          }
        }
        runX += run.width;
      }
    }

    return parts.join("");
  });
}

export function svgToBuffer(svg: string): Buffer {
  return Buffer.from(vectorizeSvgText(svg), "utf8");
}

export async function svgToPngBuffer(svg: string, pngOpts?: PngOptions): Promise<Buffer> {
  const vectorized = vectorizeSvgText(svg);
  return sharp(Buffer.from(vectorized, "utf8")).png(pngOpts).toBuffer();
}
