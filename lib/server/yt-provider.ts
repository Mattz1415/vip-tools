import { execFile } from "node:child_process";
import { createWriteStream, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { assertPublicHttpUrl, safeFetchPublic } from "@/lib/server/net-guard";
import { getYtCookiesPath, hasYtCookies } from "@/lib/server/store";

const execFileAsync = promisify(execFile);

export const YT_HTTP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export type YtMediaFormat = "mp3" | "mp4";
export type YtAudioBitrate = 96 | 128 | 256 | 320;
export type YtVideoHeight = 360 | 480 | 720 | 1080;

export interface YouTubeVideoMeta {
  videoId: string;
  title: string;
  uploader: string;
  durationSec: number;
  durationLabel: string;
  viewsText: string;
  thumbnail: string;
  thumbnailHd: string;
}

export interface CachedYouTubeMedia {
  filePath: string;
  sizeBytes: number;
  contentType: string;
  ext: YtMediaFormat;
  filename: string;
  qualityLabel: string;
  actualQuality: number;
  title: string;
  uploader: string;
  createdAt: number;
}

const META_CACHE = new Map<string, { meta: YouTubeVideoMeta; createdAt: number }>();
const META_CACHE_MAX = 300;
const META_CACHE_TTL_MS = 30 * 60 * 1000;

const DISK_CACHE_DIR = path.join(os.tmpdir(), "mattzlm-yt-media-cache");
const MEDIA_CACHE = new Map<string, CachedYouTubeMedia>();
const INFLIGHT_MEDIA = new Map<string, Promise<CachedYouTubeMedia>>();
const MEDIA_CACHE_MAX = 6;
const MEDIA_CACHE_TTL_MS = 10 * 60 * 1000;
const MP3_MAX_BYTES = 40 * 1024 * 1024;
const MP4_MAX_BYTES = 150 * 1024 * 1024;

let cachedCnvReferer = "";
let cachedCnvRefererAt = 0;
const CNV_REFERER_TTL_MS = 30 * 60 * 1000;

export function isValidYouTubeId(id: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

export function extractYouTubeVideoId(rawInput: string, allowBareId = false): string | null {
  const trimmed = String(rawInput || "").trim();
  if (!trimmed) return null;
  if (allowBareId && isValidYouTubeId(trimmed)) return trimmed;

  const withProto = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(
    trimmed
  )
    ? `https://${trimmed}`
    : trimmed;

  let parsed: URL;
  try {
    parsed = new URL(withProto);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0] || "";
    return isValidYouTubeId(id) ? id : null;
  }
  const isYtHost =
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "www.youtube-nocookie.com";
  if (!isYtHost) return null;

  const vParam = parsed.searchParams.get("v") || "";
  if (isValidYouTubeId(vParam)) return vParam;

  const m = parsed.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
  return m?.[1] && isValidYouTubeId(m[1]) ? m[1] : null;
}

export function normalizeAudioBitrate(raw: unknown): YtAudioBitrate {
  const n = Number.parseInt(String(raw || "128"), 10);
  if (n >= 300) return 320;
  if (n >= 220) return 256;
  if (n <= 100) return 96;
  return 128;
}

export function normalizeVideoHeight(raw: unknown): YtVideoHeight {
  const n = Number.parseInt(String(raw || "720"), 10);
  if (n >= 1000) return 1080;
  if (n >= 600) return 720;
  if (n >= 420) return 480;
  return 360;
}

function audioBitrateToCnvCode(kbps: YtAudioBitrate): number {
  switch (kbps) {
    case 320:
      return 0;
    case 256:
      return 1;
    case 128:
      return 4;
    case 96:
      return 5;
  }
}

export function formatYtDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s <= 0) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

function parseDurationText(raw: string): number {
  const parts = String(raw || "")
    .trim()
    .replace(/\./g, ":")
    .split(":")
    .map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export function sanitizeMediaFilename(title: string, suffix: string, ext: string): string {
  const base = String(title || "youtube_media")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _.-]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
  const cleanSuffix = suffix ? `_${suffix.replace(/[^a-zA-Z0-9]+/g, "")}` : "";
  return `${base || "mattzlm_youtube"}${cleanSuffix}.${ext}`;
}

function sanitizeUpstreamTitle(title: string): string {
  const cleaned = String(title || "video")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[&#+?%/\\:*?"<>|]+/g, " ")
    .replace(/[^a-zA-Z0-9 _()-]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
  return cleaned || "youtube_media";
}

function escapeCnvDownloadUrl(rawUrl: string): string {
  const idx = rawUrl.indexOf("?file=");
  if (idx > 0) {
    const prefix = rawUrl.slice(0, idx + 6);
    const fileVal = rawUrl.slice(idx + 6);
    const safeVal = fileVal
      .replace(/&/g, "%26")
      .replace(/#/g, "%23")
      .replace(/\+/g, "%2B")
      .replace(/ /g, "%20");
    return `${prefix}${safeVal}`;
  }
  return rawUrl.replace(/&/g, "%26").replace(/#/g, "%23").replace(/\+/g, "%2B");
}

function isValidMp3Head(buf: Buffer): boolean {
  if (!buf || buf.length < 32) return false;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  const limit = Math.min(buf.length - 2, 512);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0x49 && buf[i + 1] === 0x44 && buf[i + 2] === 0x33) return true;
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0 && (buf[i + 1] & 0x06) !== 0x00) {
      return true;
    }
  }
  return false;
}

function isValidMp4Head(buf: Buffer): boolean {
  if (!buf || buf.length < 16) return false;
  const head = buf.subarray(0, Math.min(buf.length, 64)).toString("latin1");
  return head.includes("ftyp") || head.includes("moov") || head.includes("mdat") || head.includes("free");
}

function putMetaCache(videoId: string, meta: YouTubeVideoMeta) {
  const now = Date.now();
  if (META_CACHE.size >= META_CACHE_MAX) {
    for (const [k, v] of META_CACHE.entries()) {
      if (now - v.createdAt > META_CACHE_TTL_MS) META_CACHE.delete(k);
    }
    if (META_CACHE.size >= META_CACHE_MAX) {
      const oldest = META_CACHE.keys().next().value;
      if (oldest) META_CACHE.delete(oldest);
    }
  }
  META_CACHE.set(videoId, { meta, createdAt: now });
}

function getMetaCache(videoId: string): YouTubeVideoMeta | null {
  const entry = META_CACHE.get(videoId);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > META_CACHE_TTL_MS) {
    META_CACHE.delete(videoId);
    return null;
  }
  return entry.meta;
}

function extractVideoRenderers(data: Record<string, unknown>): YouTubeVideoMeta[] {
  const sections = (
    (
      (data?.contents as Record<string, unknown>)?.twoColumnSearchResultsRenderer as Record<
        string,
        unknown
      >
    )?.primaryContents as {
      sectionListRenderer?: { contents?: Array<Record<string, unknown>> };
    }
  )?.sectionListRenderer?.contents;

  if (!Array.isArray(sections)) return [];

  const out: YouTubeVideoMeta[] = [];
  const seen = new Set<string>();

  for (const sec of sections) {
    const items = (sec?.itemSectionRenderer as { contents?: Array<Record<string, unknown>> })
      ?.contents;
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      const vr = item?.videoRenderer as Record<string, unknown> | undefined;
      const videoId = String(vr?.videoId || "").trim();
      if (!isValidYouTubeId(videoId) || seen.has(videoId)) continue;

      const titleRuns = (vr?.title as { runs?: Array<{ text?: string }> })?.runs;
      const title = Array.isArray(titleRuns)
        ? titleRuns.map((r) => String(r?.text || "")).join("").trim()
        : "";
      if (!title) continue;

      const ownerRuns = (vr?.ownerText as { runs?: Array<{ text?: string }> })?.runs;
      const uploader = Array.isArray(ownerRuns)
        ? ownerRuns.map((r) => String(r?.text || "")).join("").trim()
        : "YouTube";

      const durText = String(
        (vr?.lengthText as { simpleText?: string })?.simpleText || ""
      ).trim();
      const durationSec = parseDurationText(durText);
      const viewsText = String(
        (vr?.shortViewCountText as { simpleText?: string })?.simpleText ||
          (vr?.viewCountText as { simpleText?: string })?.simpleText ||
          ""
      ).trim();

      seen.add(videoId);
      out.push({
        videoId,
        title,
        uploader: uploader || "YouTube",
        durationSec,
        durationLabel: durationSec > 0 ? formatYtDuration(durationSec) : durText || "Video",
        viewsText,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailHd: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      });
    }
  }

  return out;
}

export async function searchYouTubeVideos(query: string, limit = 8): Promise<YouTubeVideoMeta[]> {
  const q = String(query || "").trim();
  if (!q) return [];
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": YT_HTTP_UA,
        Origin: "https://www.youtube.com",
        Referer: "https://www.youtube.com/",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20250101.00.00",
            hl: "en",
            gl: "ID",
          },
        },
        query: q,
      }),
      signal: AbortSignal.timeout(7500),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, unknown>;
    // Filter out ongoing live streams (durationSec === 0) from keyword search results
    const items = extractVideoRenderers(data).filter((v) => v.durationSec > 0);
    for (const v of items) putMetaCache(v.videoId, v);
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchYouTubeVideoMeta(videoId: string): Promise<YouTubeVideoMeta> {
  if (!isValidYouTubeId(videoId)) {
    throw new Error("ID video YouTube tidak valid.");
  }
  const cached = getMetaCache(videoId);
  if (cached) return cached;

  const [oembedRes, searchRes] = await Promise.allSettled([
    fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`,
      {
        headers: { "User-Agent": YT_HTTP_UA },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      }
    ).then((r) => (r.ok ? (r.json() as Promise<{ title?: string; author_name?: string }>) : null)),
    fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": YT_HTTP_UA,
        Origin: "https://www.youtube.com",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20250101.00.00",
            hl: "en",
            gl: "ID",
          },
        },
        query: videoId,
      }),
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    }).then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null)),
  ]);

  const oe = oembedRes.status === "fulfilled" ? oembedRes.value : null;
  const sr = searchRes.status === "fulfilled" && searchRes.value ? extractVideoRenderers(searchRes.value) : [];
  const exactSr = sr.find((v) => v.videoId === videoId) || null;

  if (!oe && !exactSr) {
    throw new Error("Video YouTube tidak ditemukan atau bersifat privat.");
  }

  const title = String(oe?.title || exactSr?.title || `YouTube Video ${videoId}`).trim();
  const uploader = String(oe?.author_name || exactSr?.uploader || "YouTube")
    .replace(/\s*-\s*Topic$/i, "")
    .trim();
  const durationSec = exactSr?.durationSec || 0;

  const meta: YouTubeVideoMeta = {
    videoId,
    title,
    uploader: uploader || "YouTube",
    durationSec,
    durationLabel: durationSec > 0 ? formatYtDuration(durationSec) : "Full",
    viewsText: exactSr?.viewsText || "",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    thumbnailHd: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  };
  putMetaCache(videoId, meta);
  return meta;
}

async function getCnvReferer(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedCnvReferer && Date.now() - cachedCnvRefererAt < CNV_REFERER_TTL_MS) {
    return cachedCnvReferer;
  }
  const r = await fetch("https://cnvmp3.com/", {
    headers: { "User-Agent": YT_HTTP_UA },
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (!r.ok) {
    throw new Error(`Layanan konversi media mengembalikan HTTP ${r.status}`);
  }
  const finalUrl = r.url || "https://cnvmp3.com/";
  cachedCnvReferer = finalUrl;
  cachedCnvRefererAt = Date.now();
  return finalUrl;
}

async function streamVerifiedMediaToFile(
  rawUrl: string,
  refererUrl: string,
  destPath: string,
  format: YtMediaFormat
): Promise<number | null> {
  const escaped = escapeCnvDownloadUrl(rawUrl);
  const parsed = await assertPublicHttpUrl(escaped);
  if (parsed.protocol !== "https:") return null;

  const maxBytes = format === "mp3" ? MP3_MAX_BYTES : MP4_MAX_BYTES;
  const timeoutMs = format === "mp3" ? 45_000 : 90_000;

  const { response } = await safeFetchPublic(parsed.toString(), {
    method: "GET",
    headers: {
      "User-Agent": YT_HTTP_UA,
      Referer: refererUrl,
      Origin: "https://cnvmp3.com",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok || !response.body) return null;

  const declaredLen = Number(response.headers.get("content-length") || 0);
  if (declaredLen > maxBytes) {
    throw new Error(`Ukuran media melebihi batas aman (${Math.round(maxBytes / (1024 * 1024))} MB).`);
  }

  const partPath = `${destPath}.${Date.now()}.part`;
  const writer = createWriteStream(partPath);
  const reader = response.body.getReader();

  let totalBytes = 0;
  let headChecked = false;
  const headChunks: Buffer[] = [];
  let headLen = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      const chunk = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        throw new Error(`Ukuran media melebihi batas aman (${Math.round(maxBytes / (1024 * 1024))} MB).`);
      }

      if (!headChecked) {
        headChunks.push(chunk);
        headLen += chunk.length;
        if (headLen >= 512) {
          const headBuf = Buffer.concat(headChunks, headLen);
          const valid = format === "mp3" ? isValidMp3Head(headBuf) : isValidMp4Head(headBuf);
          if (!valid) {
            throw new Error("Format biner media dari server konversi tidak valid.");
          }
          headChecked = true;
        }
      }

      if (!writer.write(chunk)) {
        await new Promise<void>((resolve, reject) => {
          writer.once("drain", resolve);
          writer.once("error", reject);
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      writer.end();
    });

    if (!headChecked) {
      const headBuf = Buffer.concat(headChunks, headLen);
      const valid = format === "mp3" ? isValidMp3Head(headBuf) : isValidMp4Head(headBuf);
      if (!valid) {
        await fs.unlink(partPath).catch(() => {});
        return null;
      }
    }

    if (totalBytes < 16_384) {
      await fs.unlink(partPath).catch(() => {});
      return null;
    }

    await fs.rename(partPath, destPath);
    return totalBytes;
  } catch (err) {
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
    writer.destroy();
    await fs.unlink(partPath).catch(() => {});
    if (err instanceof Error && err.message.includes("batas aman")) {
      throw err;
    }
    return null;
  }
}

async function fetchMediaViaCnvSingle(params: {
  videoId: string;
  format: YtMediaFormat;
  cnvQuality: number;
  titleHint: string;
  destPath: string;
}): Promise<number | null> {
  const { videoId, format, cnvQuality, titleHint, destPath } = params;
  const formatValue = format === "mp3" ? 1 : 0;

  const attempt = async (forceRefreshReferer: boolean): Promise<number | null> => {
    const refererUrl = await getCnvReferer(forceRefreshReferer);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": YT_HTTP_UA,
      Origin: "https://cnvmp3.com",
      Referer: refererUrl,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
    };

    // 1. Fast pre-cached database hit
    try {
      const cdbRes = await fetch("https://cnvmp3.com/check_database.php", {
        method: "POST",
        headers,
        body: JSON.stringify({ youtube_id: videoId, quality: cnvQuality, formatValue }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
      if (cdbRes.status === 403 && !forceRefreshReferer) {
        return attempt(true);
      }
      if (cdbRes.ok) {
        const cdb = (await cdbRes.json()) as {
          success?: boolean;
          data?: { server_path?: string };
        };
        if (cdb?.success && cdb?.data?.server_path) {
          const bytes = await streamVerifiedMediaToFile(
            cdb.data.server_path,
            refererUrl,
            destPath,
            format
          );
          if (bytes) return bytes;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("batas aman")) throw err;
    }

    // 2. Realtime conversion
    const dlRes = await fetch("https://cnvmp3.com/download_video_ucep.php", {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        quality: cnvQuality,
        title: sanitizeUpstreamTitle(titleHint),
        formatValue,
      }),
      signal: AbortSignal.timeout(format === "mp3" ? 45_000 : 65_000),
      cache: "no-store",
    });
    if (dlRes.status === 403 && !forceRefreshReferer) {
      return attempt(true);
    }
    if (!dlRes.ok) return null;

    const dl = (await dlRes.json()) as { success?: boolean; download_link?: string };
    if (!dl?.success || !dl?.download_link) return null;
    return await streamVerifiedMediaToFile(dl.download_link, refererUrl, destPath, format);
  };

  try {
    return await attempt(false);
  } catch (err) {
    if (err instanceof Error && err.message.includes("batas aman")) throw err;
    return null;
  }
}

async function fetchMediaViaYtDlpFallback(params: {
  videoId: string;
  format: YtMediaFormat;
  quality: number;
  destPath: string;
}): Promise<number | null> {
  if (!hasYtCookies()) return null;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vip-ytdlp-"));
  const outTpl = path.join(tmpDir, "media.%(ext)s");
  try {
    const args = [
      "--no-playlist",
      "--no-warnings",
      "--cookies",
      getYtCookiesPath(),
      "--max-filesize",
      params.format === "mp3" ? "38M" : "140M",
    ];
    if (params.format === "mp3") {
      args.push("-f", "bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio");
    } else {
      args.push(
        "-f",
        `best[height<=${params.quality}][ext=mp4]/best[ext=mp4]/best`
      );
    }
    args.push("-o", outTpl, `https://www.youtube.com/watch?v=${params.videoId}`);

    await execFileAsync("/usr/local/bin/yt-dlp", args, {
      timeout: 45_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    const files = await fs.readdir(tmpDir);
    const matched = files.find((f) =>
      params.format === "mp3" ? /\.mp3$/i.test(f) : /\.mp4$/i.test(f)
    );
    if (!matched) return null;
    const src = path.join(tmpDir, matched);
    const st = await fs.stat(src);
    if (st.size < 16_384) return null;
    await fs.copyFile(src, params.destPath);
    return st.size;
  } catch {
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function evictDiskCacheIfNeeded() {
  const now = Date.now();
  for (const [k, v] of MEDIA_CACHE.entries()) {
    if (now - v.createdAt > MEDIA_CACHE_TTL_MS) {
      MEDIA_CACHE.delete(k);
      await fs.unlink(v.filePath).catch(() => {});
    }
  }
  while (MEDIA_CACHE.size >= MEDIA_CACHE_MAX) {
    const oldestKey = MEDIA_CACHE.keys().next().value;
    if (!oldestKey) break;
    const old = MEDIA_CACHE.get(oldestKey);
    MEDIA_CACHE.delete(oldestKey);
    if (old) await fs.unlink(old.filePath).catch(() => {});
  }
  try {
    const activePaths = new Set([...MEDIA_CACHE.values()].map((v) => v.filePath));
    const files = await fs.readdir(DISK_CACHE_DIR);
    for (const f of files) {
      const full = path.join(DISK_CACHE_DIR, f);
      if (activePaths.has(full)) continue;
      const st = await fs.stat(full).catch(() => null);
      if (st && now - st.mtimeMs > 30 * 60 * 1000) {
        await fs.unlink(full).catch(() => {});
      }
    }
  } catch {
    // ignore cleanup errors
  }
}

export async function resolveYouTubeMedia(opts: {
  videoId: string;
  format: YtMediaFormat;
  quality?: number;
  titleHint?: string;
}): Promise<CachedYouTubeMedia> {
  const { videoId, format } = opts;
  if (!isValidYouTubeId(videoId)) {
    throw new Error("ID video YouTube tidak valid.");
  }

  const normalizedQuality =
    format === "mp3"
      ? normalizeAudioBitrate(opts.quality)
      : normalizeVideoHeight(opts.quality);
  const cacheKey = `${videoId}_${format}_${normalizedQuality}`;

  const cached = MEDIA_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < MEDIA_CACHE_TTL_MS) {
    try {
      const st = await fs.stat(cached.filePath);
      if (st.size === cached.sizeBytes) {
        return cached;
      }
    } catch {
      MEDIA_CACHE.delete(cacheKey);
    }
  }

  const inflight = INFLIGHT_MEDIA.get(cacheKey);
  if (inflight) {
    return await inflight;
  }

  const task = (async (): Promise<CachedYouTubeMedia> => {
    await fs.mkdir(DISK_CACHE_DIR, { recursive: true });
    await evictDiskCacheIfNeeded();

    let meta: YouTubeVideoMeta | null = getMetaCache(videoId);
    if (!meta) {
      try {
        meta = await fetchYouTubeVideoMeta(videoId);
      } catch {
        meta = {
          videoId,
          title: opts.titleHint || `YouTube_${videoId}`,
          uploader: "YouTube",
          durationSec: 0,
          durationLabel: "Full",
          viewsText: "",
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          thumbnailHd: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        };
      }
    }

    const destPath = path.join(DISK_CACHE_DIR, `${cacheKey}.${format}`);
    let sizeBytes: number | null = null;
    let actualQuality: number = normalizedQuality;

    if (format === "mp3") {
      const bitratesToTry: YtAudioBitrate[] =
        normalizedQuality === 128
          ? [128]
          : [normalizedQuality as YtAudioBitrate, 128];
      for (const kbps of bitratesToTry) {
        sizeBytes = await fetchMediaViaCnvSingle({
          videoId,
          format: "mp3",
          cnvQuality: audioBitrateToCnvCode(kbps),
          titleHint: meta.title,
          destPath,
        });
        if (sizeBytes) {
          actualQuality = kbps;
          break;
        }
      }
    } else {
      const heightsToTry: YtVideoHeight[] =
        normalizedQuality === 1080
          ? [1080, 720, 360]
          : normalizedQuality === 720
            ? [720, 360]
            : normalizedQuality === 480
              ? [480, 360]
              : [360];
      for (const h of heightsToTry) {
        sizeBytes = await fetchMediaViaCnvSingle({
          videoId,
          format: "mp4",
          cnvQuality: h,
          titleHint: meta.title,
          destPath,
        });
        if (sizeBytes) {
          actualQuality = h;
          break;
        }
      }
    }

    if (!sizeBytes) {
      sizeBytes = await fetchMediaViaYtDlpFallback({
        videoId,
        format,
        quality: normalizedQuality,
        destPath,
      });
    }

    if (!sizeBytes) {
      throw new Error(
        "Server media YouTube sedang sibuk atau video dibatasi usia/wilayah. Coba lagi beberapa detik."
      );
    }

    const qualityLabel = format === "mp3" ? `MP3 ${actualQuality} kbps` : `MP4 ${actualQuality}p`;
    const suffix = format === "mp3" ? `${actualQuality}kbps` : `${actualQuality}p`;
    const entry: CachedYouTubeMedia = {
      filePath: destPath,
      sizeBytes,
      contentType: format === "mp3" ? "audio/mpeg" : "video/mp4",
      ext: format,
      filename: sanitizeMediaFilename(meta.title, suffix, format),
      qualityLabel,
      actualQuality,
      title: meta.title,
      uploader: meta.uploader,
      createdAt: Date.now(),
    };
    MEDIA_CACHE.set(cacheKey, entry);
    return entry;
  })().finally(() => {
    INFLIGHT_MEDIA.delete(cacheKey);
  });

  INFLIGHT_MEDIA.set(cacheKey, task);
  return await task;
}
