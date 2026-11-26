import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { assertPublicHttpUrl, safeFetchPublic, sanitizePublicError } from "@/lib/server/net-guard";
import { getYtCookiesPath, hasYtCookies } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

interface ScTranscoding {
  url: string;
  preset?: string;
  duration?: number;
  snipped?: boolean;
  format?: {
    protocol?: string;
    mime_type?: string;
  };
}

interface ScTrack {
  id: number;
  title?: string;
  permalink?: string;
  permalink_url?: string;
  artwork_url?: string | null;
  duration?: number;
  full_duration?: number;
  playback_count?: number;
  policy?: string;
  genre?: string;
  track_authorization?: string;
  user?: {
    username?: string;
    avatar_url?: string | null;
    verified?: boolean;
  };
  publisher_metadata?: {
    artist?: string;
    release_title?: string;
  } | null;
  media?: {
    transcodings?: ScTranscoding[];
  };
}

interface YtMusicCandidate {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  plays: number;
  artwork: string;
  isOfficialAtv: boolean;
  ytRank: number;
}

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  rank: number;
  artist?: { name?: string };
  album?: { title?: string; cover_medium?: string };
}

interface TrackMetaHint {
  title: string;
  artist: string;
  album?: string;
  durationSec: number;
  createdAt: number;
}

interface AudioCacheEntry {
  buffer: Buffer;
  contentType: string;
  ext: "mp3" | "m4a";
  filename: string;
  title: string;
  artist: string;
  qualityLabel: string;
  createdAt: number;
}

interface SerializedTrack {
  id: string;
  source: "ytmusic" | "soundcloud";
  title: string;
  artist: string;
  album: string;
  uploader: string;
  verified: boolean;
  artwork: string;
  durationSec: number;
  durationLabel: string;
  plays: number;
  ext: "mp3" | "m4a";
  qualityLabel: string;
  isVariant: boolean;
  variantTags: string[];
  durationMatch: boolean;
  matchScore: number;
  matchLabel: string;
  permalinkUrl: string;
  streamUrl: string;
  downloadUrl: string;
}

const HTTP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

let cachedClientId = "";
let cachedClientIdAt = 0;
const CLIENT_ID_TTL_MS = 2 * 60 * 60 * 1000;

let cachedCnvReferer = "";
let cachedCnvRefererAt = 0;
const CNV_REFERER_TTL_MS = 30 * 60 * 1000;

const TRACK_META_CACHE = new Map<string, TrackMetaHint>();
const TRACK_META_MAX_ITEMS = 400;
const TRACK_META_TTL_MS = 45 * 60 * 1000;

const AUDIO_CACHE = new Map<string, AudioCacheEntry>();
const INFLIGHT_AUDIO = new Map<string, Promise<AudioCacheEntry>>();
const AUDIO_CACHE_MAX_ITEMS = 8;
const AUDIO_CACHE_TTL_MS = 8 * 60 * 1000;
const AUDIO_MAX_BYTES = 26 * 1024 * 1024;

// Only explicit search/media noise words. Keep real title words ("dan", "di", "with", "a").
const NOISE_WORDS = new Set([
  "official", "audio", "video", "lyric", "lyrics", "lirik", "mv", "hd", "hq",
  "full", "song", "lagu", "mp3", "m4a", "download", "music", "musik",
  "original", "track", "single", "ft", "feat", "featuring", "by", "prod",
]);

const VARIANT_PHRASES = [
  "remix", "rmx", "rework", "bootleg", "mashup", "flip", "edit", "vip",
  "dj", "jj", "jedag jedug", "jedug", "fvnky", "funkot", "funky", "horeg",
  "full bass", "bass boosted", "bass cover", "drum and bass", "dnb",
  "breakbeat", "hardstyle", "hard mix", "jungle dutch", "amapiano",
  "jersey club", "drill", "club mix", "extended mix", "radio edit",
  "house mix", "deep house", "tech house", "techno", "trance", "dubstep",
  "phonk", "phunk", "super exc", "mixtape", "nonstop", "medley", "megamix",
  "sound viral", "viral tiktok", "tiktok", "tik tok",
  "slowed", "slow version", "slow reverb", "reverb", "reverbed",
  "sped up", "speed up", "speedup", "nightcore", "8d", "16d", "lofi", "lo fi",
  "chill version", "lower key", "higher key", "pitched",
  "1 hour", "1 jam", "loop",
  "cover", "karaoke", "instrumental", "instrument", "inst",
  "minus one", "backing track", "play along", "acapella", "vocals only",
  "acoustic", "akustik", "unplugged", "reprise", "demo",
  "orchestral", "symphonic", "aransemen", "jazzy", "jazz version", "bossa nova",
  "koplo", "dangdut", "hipdut", "campursari", "keroncong", "reggae", "ska",
  "pop punk", "rock version", "metal version",
  "piano version", "piano cover", "guitar cover", "guitar version", "gitar cover",
  "fingerstyle", "ukulele", "violin cover", "cello cover", "saxophone", "kalimba", "flute",
  "music box", "box version", "8 bit", "8bit", "chiptune", "synthesia", "tutorial",
  "ringtone", "parody", "parodi", "tribute", "remake",
  "vers", "ver", "version", "originally performed", "in the style of", "made famous",
  "full album", "best hits", "greatest hits", "compilation",
  "live at", "live in", "live from", "live version", "live session", "live performance",
  "live acoustic", "en vivo", "en directo",
];

// Words that are legitimate in real song titles ("Live Forever", "Piano Man", "House of the Rising Sun")
// but clearly indicate a variant when inside parentheses/brackets: e.g. "(Live)", "(House)", "(Mix)"
const PAREN_VARIANT_WORDS = [
  "live", "house", "mix", "dub", "reggae", "ska", "rock", "metal", "jazz",
  "piano", "guitar", "gitar", "violin", "bass", "slow", "fast", "club", "dj",
  "extended", "stripped", "sped", "acoustic", "orchestra", "symphony", "choral",
];

function normalizeText(input: string): string {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  const words = normalizeText(input).split(" ").filter(Boolean);
  const meaningful = words.filter((w) => !NOISE_WORDS.has(w));
  return [...new Set(meaningful.length > 0 ? meaningful : words)];
}

function detectUnrequestedVariants(
  candidateNorm: string,
  queryNorm: string,
  rawTitle = ""
): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  for (const phrase of VARIANT_PHRASES) {
    const pattern = new RegExp(`(?:^| )${phrase.replace(/\s+/g, " ")}(?: |$)`);
    if (pattern.test(candidateNorm) && !pattern.test(queryNorm)) {
      if (!seen.has(phrase)) {
        seen.add(phrase);
        found.push(phrase);
      }
    }
  }

  // Parenthesized/bracketed variant descriptors such as "(Live)", "(House)", "(Mix)", "[Acoustic]"
  if (rawTitle) {
    const parenMatches = rawTitle.match(/[(\[][^)\]]+[)\]]/g) || [];
    for (const seg of parenMatches) {
      const segNorm = normalizeText(seg);
      for (const word of PAREN_VARIANT_WORDS) {
        const p = new RegExp(`(?:^| )${word}(?: |$)`);
        if (p.test(segNorm) && !p.test(queryNorm)) {
          if (!seen.has(word)) {
            seen.add(word);
            found.push(word);
          }
        }
      }
    }
  }

  return found;
}

function queryRequestsVariant(queryNorm: string): boolean {
  for (const phrase of VARIANT_PHRASES) {
    const pattern = new RegExp(`(?:^| )${phrase.replace(/\s+/g, " ")}(?: |$)`);
    if (pattern.test(queryNorm)) return true;
  }
  return false;
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

function parseDurationText(raw: string): number {
  const cleaned = String(raw || "").trim().replace(/\./g, ":");
  const parts = cleaned.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function parsePlayCount(raw: string): number {
  const m = String(raw || "").match(/([\d.,]+)\s*([KMB])?\s*(?:plays?|views?|putar|x)/i);
  if (!m) return 0;
  const num = Number.parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(num)) return 0;
  const unit = (m[2] || "").toUpperCase();
  if (unit === "B") return Math.round(num * 1_000_000_000);
  if (unit === "M") return Math.round(num * 1_000_000);
  if (unit === "K") return Math.round(num * 1_000);
  return Math.round(num);
}

function sanitizeFilename(title: string, artist: string, ext: string): string {
  const raw =
    artist && !normalizeText(title).includes(normalizeText(artist))
      ? `${artist} - ${title}`
      : title;
  const cleaned = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _.-]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 72);
  return `${cleaned || "mattzlm_music"}.${ext}`;
}

function sanitizeCnvTitle(title: string): string {
  const cleaned = String(title || "audio")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[&#+?%/\\:*?"<>|]+/g, " ")
    .replace(/[^a-zA-Z0-9 _()-]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
  return cleaned || "music_audio";
}

function upgradeArtwork(url?: string | null): string {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  if (url.includes("sndcdn.com")) return url.replace("-large.", "-t300x300.");
  if (url.includes("googleusercontent.com") || url.includes("ggpht.com")) {
    return url.replace(/=w\d+-h\d+[^&]*/i, "=w300-h300-l90-rj");
  }
  return url;
}

function putTrackMeta(id: string, meta: Omit<TrackMetaHint, "createdAt">) {
  const now = Date.now();
  if (TRACK_META_CACHE.size >= TRACK_META_MAX_ITEMS) {
    for (const [k, v] of TRACK_META_CACHE.entries()) {
      if (now - v.createdAt > TRACK_META_TTL_MS) TRACK_META_CACHE.delete(k);
    }
    if (TRACK_META_CACHE.size >= TRACK_META_MAX_ITEMS) {
      const oldest = TRACK_META_CACHE.keys().next().value;
      if (oldest) TRACK_META_CACHE.delete(oldest);
    }
  }
  TRACK_META_CACHE.set(id, { ...meta, createdAt: now });
}

function getTrackMeta(id: string): TrackMetaHint | null {
  const entry = TRACK_META_CACHE.get(id);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TRACK_META_TTL_MS) {
    TRACK_META_CACHE.delete(id);
    return null;
  }
  return entry;
}

function putAudioCache(id: string, entry: AudioCacheEntry) {
  const now = Date.now();
  for (const [k, v] of AUDIO_CACHE.entries()) {
    if (now - v.createdAt > AUDIO_CACHE_TTL_MS) {
      AUDIO_CACHE.delete(k);
    }
  }
  if (AUDIO_CACHE.size >= AUDIO_CACHE_MAX_ITEMS) {
    const oldestKey = AUDIO_CACHE.keys().next().value;
    if (oldestKey) AUDIO_CACHE.delete(oldestKey);
  }
  AUDIO_CACHE.set(id, entry);
}

function isValidMp3Buffer(buf: Buffer): boolean {
  if (!buf || buf.length < 16_384) return false;
  // ID3v2 tag header ("ID3")
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  // Raw MPEG Audio frame sync (11 set bits: 0xFF followed by 0xE0..0xFF)
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  // Scan first 512 bytes for MPEG frame sync (skipping leading zeros/padding)
  const limit = Math.min(buf.length - 2, 512);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0x49 && buf[i + 1] === 0x44 && buf[i + 2] === 0x33) return true;
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0 && (buf[i + 1] & 0x06) !== 0x00) {
      return true;
    }
  }
  return false;
}

function isValidM4aBuffer(buf: Buffer): boolean {
  if (!buf || buf.length < 16_384) return false;
  const head = buf.subarray(0, 32).toString("latin1");
  return head.includes("ftyp") || head.includes("styp") || head.includes("moov");
}

function assertAllowedSoundCloudHost(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL stream audio tidak valid.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Protokol stream audio tidak diizinkan.");
  }
  const h = parsed.hostname.toLowerCase();
  const allowed =
    h === "soundcloud.com" ||
    h.endsWith(".soundcloud.com") ||
    h === "soundcloud.cloud" ||
    h.endsWith(".soundcloud.cloud") ||
    h === "sndcdn.com" ||
    h.endsWith(".sndcdn.com");
  if (!allowed) {
    throw new Error("Host stream audio di luar CDN terverifikasi.");
  }
  return parsed.toString();
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

// =========================================================================
// YOUTUBE MUSIC OFFICIAL SONGS SEARCH (PRIMARY STUDIO CATALOG)
// =========================================================================

async function searchYtMusicSongs(query: string): Promise<YtMusicCandidate[]> {
  try {
    const res = await fetch("https://music.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": HTTP_UA,
        Origin: "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20250101.01.00",
            hl: "en",
            gl: "ID",
          },
        },
        query,
        // Official Songs-only filter on YouTube Music
        params: "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D",
      }),
      signal: AbortSignal.timeout(7500),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, unknown>;

    const tabs = (
      (data?.contents as Record<string, unknown>)?.tabbedSearchResultsRenderer as Record<
        string,
        unknown
      >
    )?.tabs as Array<Record<string, unknown>> | undefined;
    const sections = (
      ((tabs?.[0]?.tabRenderer as Record<string, unknown>)?.content as Record<string, unknown>)
        ?.sectionListRenderer as Record<string, unknown>
    )?.contents as Array<Record<string, unknown>> | undefined;

    if (!Array.isArray(sections)) return [];

    const out: YtMusicCandidate[] = [];
    const seen = new Set<string>();

    for (const sec of sections) {
      const shelf = sec?.musicShelfRenderer as Record<string, unknown> | undefined;
      const items = shelf?.contents as Array<Record<string, unknown>> | undefined;
      if (!Array.isArray(items)) continue;

      for (const it of items) {
        const rr = it?.musicResponsiveListItemRenderer as Record<string, unknown> | undefined;
        if (!rr) continue;

        const playlistItemData = rr.playlistItemData as { videoId?: string } | undefined;
        const overlayVid = (
          (
            (
              (rr.overlay as Record<string, unknown>)?.musicItemThumbnailOverlayRenderer as Record<
                string,
                unknown
              >
            )?.content as Record<string, unknown>
          )?.musicPlayButtonRenderer as Record<string, unknown>
        )?.playNavigationEndpoint as { watchEndpoint?: { videoId?: string } } | undefined;

        const videoId = String(playlistItemData?.videoId || overlayVid?.watchEndpoint?.videoId || "").trim();
        if (!/^[A-Za-z0-9_-]{11}$/.test(videoId) || seen.has(videoId)) continue;

        const flexColumns = Array.isArray(rr.flexColumns)
          ? (rr.flexColumns as Array<Record<string, unknown>>)
          : [];

        const col0Runs = (
          (flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer as Record<string, unknown>)
            ?.text as { runs?: Array<Record<string, unknown>> } | undefined
        )?.runs;
        const title = Array.isArray(col0Runs)
          ? col0Runs.map((r) => String(r?.text || "")).join("").trim()
          : "";
        if (!title) continue;

        const nav0 = col0Runs?.[0]?.navigationEndpoint as
          | {
              watchEndpoint?: {
                watchEndpointMusicSupportedConfigs?: {
                  watchEndpointMusicConfig?: { musicVideoType?: string };
                };
              };
            }
          | undefined;
        const overlayNav = overlayVid as
          | {
              watchEndpoint?: {
                videoId?: string;
                watchEndpointMusicSupportedConfigs?: {
                  watchEndpointMusicConfig?: { musicVideoType?: string };
                };
              };
            }
          | undefined;
        const musicVideoType =
          nav0?.watchEndpoint?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig
            ?.musicVideoType ||
          overlayNav?.watchEndpoint?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig
            ?.musicVideoType ||
          "";
        const isOfficialAtv = musicVideoType === "MUSIC_VIDEO_TYPE_ATV";

        const col1Runs = (
          (flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer as Record<string, unknown>)
            ?.text as { runs?: Array<Record<string, unknown>> } | undefined
        )?.runs;
        const subText = Array.isArray(col1Runs)
          ? col1Runs.map((r) => String(r?.text || "")).join("")
          : "";
        const subParts = subText
          .split(" • ")
          .map((s) => s.trim())
          .filter(Boolean);

        // Remove leading type tags like "Song" / "Video" if present
        while (subParts.length > 0 && /^(song|video|single|ep)$/i.test(subParts[0])) {
          subParts.shift();
        }

        let durationSec = 0;
        let plays = 0;
        const metaParts: string[] = [];

        for (const part of subParts) {
          if (/^\d{1,2}[:.]\d{2}(?:[:.]\d{2})?$/.test(part)) {
            durationSec = parseDurationText(part);
          } else if (/\b(?:plays?|views?)\b/i.test(part)) {
            plays = Math.max(plays, parsePlayCount(part));
          } else {
            metaParts.push(part);
          }
        }

        // Also inspect flexColumns[2] for play count (e.g. "431M plays")
        const col2Runs = (
          (flexColumns[2]?.musicResponsiveListItemFlexColumnRenderer as Record<string, unknown>)
            ?.text as { runs?: Array<Record<string, unknown>> } | undefined
        )?.runs;
        if (Array.isArray(col2Runs)) {
          const col2Text = col2Runs.map((r) => String(r?.text || "")).join(" ");
          const col2Plays = parsePlayCount(col2Text);
          if (col2Plays > plays) plays = col2Plays;
        }

        const artist = metaParts[0] || "Unknown Artist";
        const album = metaParts[1] || "";

        const thumbs = (
          (
            (rr.thumbnail as Record<string, unknown>)?.musicThumbnailRenderer as Record<
              string,
              unknown
            >
          )?.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined
        )?.thumbnails;
        const rawThumb =
          Array.isArray(thumbs) && thumbs.length > 0 ? String(thumbs[thumbs.length - 1]?.url || "") : "";
        const artwork = upgradeArtwork(rawThumb);

        seen.add(videoId);
        out.push({
          videoId,
          title,
          artist,
          album,
          durationSec,
          plays,
          artwork,
          isOfficialAtv,
          ytRank: out.length,
        });
      }
    }

    return out;
  } catch {
    return [];
  }
}

// =========================================================================
// SOUNDCLOUD API v2 (SECONDARY / REMIX / DIRECT-URL / FALLBACK ENGINE)
// =========================================================================

function pickBestTranscoding(track: ScTrack): {
  transcoding: ScTranscoding;
  ext: "mp3" | "m4a";
  contentType: string;
  qualityLabel: string;
} | null {
  const list = Array.isArray(track.media?.transcodings) ? track.media.transcodings : [];
  const valid = list.filter((t) => {
    if (!t?.url || t.snipped) return false;
    const mime = String(t.format?.mime_type || "").toLowerCase();
    const preset = String(t.preset || "").toLowerCase();
    if (preset.includes("abr") || mime === "audio/mpegurl" || mime.includes("ogg")) return false;
    return true;
  });
  if (valid.length === 0) return null;

  const progMp3 = valid.find(
    (t) => t.format?.protocol === "progressive" && String(t.format?.mime_type || "").includes("mpeg")
  );
  if (progMp3) {
    return { transcoding: progMp3, ext: "mp3", contentType: "audio/mpeg", qualityLabel: "MP3 128 kbps" };
  }

  const hlsMp3 = valid.find(
    (t) => t.format?.protocol === "hls" && String(t.format?.mime_type || "").includes("mpeg")
  );
  if (hlsMp3) {
    return { transcoding: hlsMp3, ext: "mp3", contentType: "audio/mpeg", qualityLabel: "MP3 128 kbps" };
  }

  const hlsAac160 = valid.find(
    (t) =>
      t.format?.protocol === "hls" &&
      (String(t.preset || "").includes("160") || String(t.preset || "").includes("aac_160"))
  );
  if (hlsAac160) {
    return { transcoding: hlsAac160, ext: "m4a", contentType: "audio/mp4", qualityLabel: "AAC 160 kbps" };
  }

  const hlsAac = valid.find(
    (t) => t.format?.protocol === "hls" && String(t.format?.mime_type || "").includes("mp4")
  );
  if (hlsAac) {
    const kbps = String(hlsAac.preset || "").includes("160") ? "160" : "96";
    return { transcoding: hlsAac, ext: "m4a", contentType: "audio/mp4", qualityLabel: `AAC ${kbps} kbps` };
  }

  const progAny = valid.find((t) => t.format?.protocol === "progressive");
  if (progAny) {
    const isMp3 = String(progAny.format?.mime_type || "").includes("mpeg");
    return {
      transcoding: progAny,
      ext: isMp3 ? "mp3" : "m4a",
      contentType: isMp3 ? "audio/mpeg" : "audio/mp4",
      qualityLabel: isMp3 ? "MP3 Audio" : "M4A Audio",
    };
  }

  return null;
}

function isFullScTrack(track: ScTrack): boolean {
  const durMs = Number(track.duration || 0);
  const fullMs = Number(track.full_duration || durMs);
  if (durMs < 45_000) return false;
  if (track.policy === "SNIP" || track.policy === "BLOCK") return false;
  if (fullMs > 0 && durMs < fullMs - 5_000) return false;
  return pickBestTranscoding(track) !== null;
}

async function getSoundCloudClientId(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedClientId && Date.now() - cachedClientIdAt < CLIENT_ID_TTL_MS) {
    return cachedClientId;
  }

  const homeRes = await fetch("https://soundcloud.com", {
    headers: { "User-Agent": HTTP_UA },
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (!homeRes.ok) {
    throw new Error(`Layanan musik sekunder mengembalikan HTTP ${homeRes.status}`);
  }
  const html = await homeRes.text();
  const scriptUrls = [...html.matchAll(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"'<>]+\.js/g)].map(
    (m) => m[0]
  );

  for (const scriptUrl of scriptUrls.slice(-6).reverse()) {
    try {
      const jsRes = await fetch(assertAllowedSoundCloudHost(scriptUrl), {
        headers: { "User-Agent": HTTP_UA },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!jsRes.ok) continue;
      const jsText = await jsRes.text();
      const match = jsText.match(/client_id\s*:\s*"([A-Za-z0-9]{20,40})"/);
      if (match?.[1]) {
        cachedClientId = match[1];
        cachedClientIdAt = Date.now();
        return cachedClientId;
      }
    } catch {
      // try previous bundle
    }
  }

  throw new Error("Gagal menginisialisasi sesi SoundCloud.");
}

async function scApiFetchJson<T>(urlBuilder: (clientId: string) => string): Promise<T> {
  let clientId = await getSoundCloudClientId(false);
  let targetUrl = assertAllowedSoundCloudHost(urlBuilder(clientId));
  let res = await fetch(targetUrl, {
    headers: { "User-Agent": HTTP_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    clientId = await getSoundCloudClientId(true);
    targetUrl = assertAllowedSoundCloudHost(urlBuilder(clientId));
    res = await fetch(targetUrl, {
      headers: { "User-Agent": HTTP_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
  }
  if (!res.ok) {
    throw new Error(`Pencarian SoundCloud gagal (HTTP ${res.status}).`);
  }
  return (await res.json()) as T;
}

// =========================================================================
// DEEZER CANONICAL REFERENCE (NON-BLOCKING VERIFICATION SIGNAL)
// =========================================================================

async function fetchCanonicalReference(query: string): Promise<{
  title: string;
  artist: string;
  durationSec: number;
  cover: string;
} | null> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: { "User-Agent": HTTP_UA },
        signal: AbortSignal.timeout(3800),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: DeezerTrack[] };
    const rows = Array.isArray(data.data) ? data.data : [];
    const qNorm = normalizeText(query);
    const qTokens = tokenize(query);
    if (qTokens.length === 0) return null;

    let best: { track: DeezerTrack; score: number } | null = null;
    for (const d of rows) {
      if (!d?.title || Number(d.duration || 0) < 90) continue;
      const dTitleNorm = normalizeText(d.title);
      const dArtistNorm = normalizeText(d.artist?.name || "");
      const dAllNorm = `${dTitleNorm} ${dArtistNorm}`.trim();
      if (detectUnrequestedVariants(dAllNorm, qNorm, d.title).length > 0) continue;

      const dTitleWords = new Set(dTitleNorm.split(" ").filter(Boolean));
      const dArtistWords = new Set(dArtistNorm.split(" ").filter(Boolean));
      const dHayWords = new Set(dAllNorm.split(" ").filter(Boolean));
      const hasAmp = d.title.includes("&");

      const hits = qTokens.filter(
        (t) => dHayWords.has(t) || (hasAmp && (t === "dan" || t === "and"))
      ).length;
      const titleHits = qTokens.filter(
        (t) => dTitleWords.has(t) || (hasAmp && (t === "dan" || t === "and"))
      ).length;
      const artistHits = qTokens.filter((t) => dArtistWords.has(t)).length;
      const cov = hits / qTokens.length;
      if (cov < (qTokens.length <= 4 ? 0.99 : 0.7) || titleHits === 0) continue;

      const dCoreTitleWords = new Set(normalizeText(stripSubtitles(d.title)).split(" ").filter(Boolean));
      const extraTitle = [...dCoreTitleWords].filter(
        (w) => w.length >= 2 && !NOISE_WORDS.has(w) && !qTokens.includes(w)
      ).length;
      const score =
        cov * 80 +
        (artistHits > 0 ? 28 : 0) +
        Math.log10((d.rank || 1) + 1) * 24 -
        extraTitle * 10;
      if (!best || score > best.score) {
        best = { track: d, score };
      }
    }
    if (!best) return null;
    return {
      title: String(best.track.title),
      artist: String(best.track.artist?.name || ""),
      durationSec: Math.round(Number(best.track.duration || 0)),
      cover: String(best.track.album?.cover_medium || ""),
    };
  } catch {
    return null;
  }
}

// =========================================================================
// DIRECT URL RESOLVER (YOUTUBE / YT MUSIC / SPOTIFY / SOUNDCLOUD)
// =========================================================================

function cleanVideoTitle(raw: string): string {
  return String(raw || "")
    .replace(
      /\((?:official\s+)?(?:music\s+video|lyric\s+video|lyrics|audio|mv|hd|hq|4k|visualizer)[^)]*\)/gi,
      " "
    )
    .replace(
      /\[(?:official\s+)?(?:music\s+video|lyric\s+video|lyrics|audio|mv|hd|hq|4k|visualizer)[^\]]*\]/gi,
      " "
    )
    .replace(/\|.*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractYouTubeVideoId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0] || "";
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }
  const v = parsed.searchParams.get("v") || "";
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  const m = parsed.pathname.match(/^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/);
  return m?.[1] || null;
}

async function resolveDirectUrl(rawUrl: string): Promise<
  | { kind: "sc_track"; track: ScTrack }
  | { kind: "yt_track"; track: YtMusicCandidate }
  | { kind: "derived_query"; query: string; sourceLabel: string }
> {
  let parsed = await assertPublicHttpUrl(rawUrl);
  let host = parsed.hostname.toLowerCase();

  if (host === "on.soundcloud.com" || host === "spotify.link" || host === "spoti.fi") {
    const { finalUrl } = await safeFetchPublic(parsed.toString(), {
      method: "GET",
      headers: { "User-Agent": HTTP_UA },
      signal: AbortSignal.timeout(8000),
    });
    parsed = await assertPublicHttpUrl(finalUrl);
    host = parsed.hostname.toLowerCase();
  }

  // 1. Direct SoundCloud link
  if (host === "soundcloud.com" || host === "www.soundcloud.com" || host === "m.soundcloud.com") {
    const resolvedTrack = await scApiFetchJson<ScTrack>(
      (cid) =>
        `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(
          parsed.toString()
        )}&client_id=${cid}`
    );
    if (resolvedTrack?.id && isFullScTrack(resolvedTrack)) {
      return { kind: "sc_track", track: resolvedTrack };
    }
    if (resolvedTrack?.title) {
      const artist = resolvedTrack.publisher_metadata?.artist || resolvedTrack.user?.username || "";
      return {
        kind: "derived_query",
        query: `${resolvedTrack.title} ${artist}`.trim(),
        sourceLabel: "SoundCloud (cari versi studio penuh)",
      };
    }
    throw new Error("Tautan SoundCloud tidak mengarah ke trek audio yang valid.");
  }

  // 2. Direct YouTube / YouTube Music link -> exact videoId!
  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be"
  ) {
    const videoId = extractYouTubeVideoId(parsed);
    const oRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.toString())}&format=json`,
      { headers: { "User-Agent": HTTP_UA }, signal: AbortSignal.timeout(6500), cache: "no-store" }
    );
    if (!oRes.ok) {
      throw new Error("Gagal membaca metadata lagu dari tautan YouTube tersebut.");
    }
    const oData = (await oRes.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    const cleanTitle = cleanVideoTitle(oData.title || "");
    const author = String(oData.author_name || "")
      .replace(/\s*-\s*Topic$/i, "")
      .replace(/(?:VEVO|Official)$/i, "")
      .trim();

    if (videoId && cleanTitle) {
      return {
        kind: "yt_track",
        track: {
          videoId,
          title: cleanTitle,
          artist: author || "YouTube Audio",
          album: "",
          durationSec: 0,
          plays: 0,
          artwork: String(oData.thumbnail_url || ""),
          isOfficialAtv: host === "music.youtube.com" || /-\s*Topic$/i.test(oData.author_name || ""),
          ytRank: 0,
        },
      };
    }

    if (!cleanTitle) {
      throw new Error("Judul lagu tidak terbaca dari link YouTube.");
    }
    const combined =
      author && !normalizeText(cleanTitle).includes(normalizeText(author))
        ? `${cleanTitle} ${author}`
        : cleanTitle;
    return {
      kind: "derived_query",
      query: combined,
      sourceLabel: "YouTube",
    };
  }

  // 3. Spotify track link -> resolve exact title + artist, then search YouTube Music official songs
  if (host === "open.spotify.com" || host === "spotify.com") {
    let title = "";
    let artist = "";
    try {
      const oRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.toString())}`,
        { headers: { "User-Agent": HTTP_UA }, signal: AbortSignal.timeout(6000), cache: "no-store" }
      );
      if (oRes.ok) {
        const oData = (await oRes.json()) as { title?: string };
        title = String(oData.title || "").trim();
      }
    } catch {
      // continue to OG metadata
    }
    try {
      const { response } = await safeFetchPublic(parsed.toString(), {
        headers: { "User-Agent": HTTP_UA },
        signal: AbortSignal.timeout(7000),
      });
      if (response.ok) {
        const html = await response.text();
        const ogTitle = html.match(
          /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
        )?.[1];
        const ogDesc = html.match(
          /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
        )?.[1];
        if (!title && ogTitle) title = ogTitle.trim();
        if (ogDesc) {
          const cleanDesc = ogDesc.replace(/^Listen to .*? on Spotify\.\s*/i, "");
          const firstSeg = cleanDesc.split(/[·•|]/)[0]?.trim() || "";
          if (firstSeg && !/^song$/i.test(firstSeg)) {
            artist = firstSeg;
          }
        }
      }
    } catch {
      // keep oEmbed title
    }
    if (!title) {
      throw new Error("Gagal membaca judul lagu dari link Spotify tersebut.");
    }
    return {
      kind: "derived_query",
      query:
        artist && !normalizeText(title).includes(normalizeText(artist))
          ? `${title} ${artist}`
          : title,
      sourceLabel: "Spotify Track",
    };
  }

  throw new Error(
    "Tautan tidak didukung. Gunakan judul lagu atau link YouTube, YouTube Music, Spotify, atau SoundCloud."
  );
}

// =========================================================================
// SERIALIZERS
// =========================================================================

function serializeYtTrack(
  cand: YtMusicCandidate,
  meta: {
    score: number;
    isVariant: boolean;
    variantTags: string[];
    durationMatch: boolean;
    matchLabel: string;
    canonicalCover?: string;
  }
): SerializedTrack {
  const trackId = `yt_${cand.videoId}`;
  putTrackMeta(trackId, {
    title: cand.title,
    artist: cand.artist,
    album: cand.album,
    durationSec: cand.durationSec,
  });

  return {
    id: trackId,
    source: "ytmusic",
    title: cand.title,
    artist: cand.artist,
    album: cand.album,
    uploader: cand.artist,
    verified: cand.isOfficialAtv,
    artwork: cand.artwork || meta.canonicalCover || "",
    durationSec: cand.durationSec,
    durationLabel: cand.durationSec > 0 ? formatDuration(cand.durationSec) : "Full",
    plays: cand.plays,
    ext: "mp3",
    qualityLabel: "MP3 128 kbps",
    isVariant: meta.isVariant,
    variantTags: meta.variantTags,
    durationMatch: meta.durationMatch,
    matchScore: meta.score,
    matchLabel: meta.matchLabel,
    permalinkUrl: `https://music.youtube.com/watch?v=${cand.videoId}`,
    streamUrl: `/api/tools/music-dl?id=${encodeURIComponent(trackId)}&mode=stream`,
    downloadUrl: `/api/tools/music-dl?id=${encodeURIComponent(trackId)}&mode=download`,
  };
}

function serializeScTrack(
  track: ScTrack,
  meta: {
    score: number;
    isVariant: boolean;
    variantTags: string[];
    durationMatch: boolean;
    matchLabel: string;
    canonicalCover?: string;
  }
): SerializedTrack {
  const best = pickBestTranscoding(track);
  const durSec = Math.round(Number(track.duration || 0) / 1000);
  const artist = track.publisher_metadata?.artist || track.user?.username || "Unknown Artist";
  const title = String(track.title || "Untitled").trim();
  const trackId = `sc_${track.id}`;
  putTrackMeta(trackId, {
    title,
    artist,
    durationSec: durSec,
  });

  const artwork =
    upgradeArtwork(track.artwork_url) ||
    meta.canonicalCover ||
    upgradeArtwork(track.user?.avatar_url) ||
    "";

  return {
    id: trackId,
    source: "soundcloud",
    title,
    artist,
    album: String(track.publisher_metadata?.release_title || ""),
    uploader: String(track.user?.username || artist),
    verified: Boolean(track.user?.verified),
    artwork,
    durationSec: durSec,
    durationLabel: formatDuration(durSec),
    plays: Number(track.playback_count || 0),
    ext: best?.ext || "m4a",
    qualityLabel: best?.qualityLabel || "Audio",
    isVariant: meta.isVariant,
    variantTags: meta.variantTags,
    durationMatch: meta.durationMatch,
    matchScore: meta.score,
    matchLabel: meta.matchLabel,
    permalinkUrl: String(track.permalink_url || ""),
    streamUrl: `/api/tools/music-dl?id=${encodeURIComponent(trackId)}&mode=stream`,
    downloadUrl: `/api/tools/music-dl?id=${encodeURIComponent(trackId)}&mode=download`,
  };
}

// =========================================================================
// AUDIO RESOLVERS (MP3 STUDIO STREAMING + MULTI-TIER FALLBACK)
// =========================================================================

async function getCnvReferer(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedCnvReferer && Date.now() - cachedCnvRefererAt < CNV_REFERER_TTL_MS) {
    return cachedCnvReferer;
  }
  const r = await fetch("https://cnvmp3.com/", {
    headers: { "User-Agent": HTTP_UA },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!r.ok) {
    throw new Error(`Layanan konversi audio mengembalikan HTTP ${r.status}`);
  }
  const finalUrl = r.url || "https://cnvmp3.com/";
  cachedCnvReferer = finalUrl;
  cachedCnvRefererAt = Date.now();
  return finalUrl;
}

async function downloadVerifiedMp3(rawUrl: string, refererUrl: string): Promise<Buffer | null> {
  const escaped = escapeCnvDownloadUrl(rawUrl);
  const parsed = await assertPublicHttpUrl(escaped);
  if (parsed.protocol !== "https:") return null;

  const { response } = await safeFetchPublic(parsed.toString(), {
    method: "GET",
    headers: {
      "User-Agent": HTTP_UA,
      Referer: refererUrl,
      Origin: "https://cnvmp3.com",
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) return null;

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > AUDIO_MAX_BYTES) {
    throw new Error("Ukuran file audio melebihi batas aman (25 MB).");
  }

  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length > AUDIO_MAX_BYTES) {
    throw new Error("Ukuran file audio melebihi batas aman (25 MB).");
  }
  if (!isValidMp3Buffer(buf)) return null;
  return buf;
}

async function fetchYoutubeMp3ViaCnv(videoId: string, titleHint: string): Promise<Buffer | null> {
  const attempt = async (forceRefreshReferer: boolean): Promise<Buffer | null> => {
    const refererUrl = await getCnvReferer(forceRefreshReferer);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": HTTP_UA,
      Origin: "https://cnvmp3.com",
      Referer: refererUrl,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
    };

    // 1. Check pre-cached MP3 first (~1.5-3s)
    try {
      const cdbRes = await fetch("https://cnvmp3.com/check_database.php", {
        method: "POST",
        headers,
        body: JSON.stringify({ youtube_id: videoId, quality: 4, formatValue: 1 }),
        signal: AbortSignal.timeout(9000),
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
          const cachedBuf = await downloadVerifiedMp3(cdb.data.server_path, refererUrl);
          if (cachedBuf) return cachedBuf;
        }
      }
    } catch {
      // proceed to fresh convert
    }

    // 2. Fresh MP3 conversion from official YouTube Music audio stream
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const dlRes = await fetch("https://cnvmp3.com/download_video_ucep.php", {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: ytUrl,
        quality: 4,
        title: sanitizeCnvTitle(titleHint),
        formatValue: 1,
      }),
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
    if (dlRes.status === 403 && !forceRefreshReferer) {
      return attempt(true);
    }
    if (!dlRes.ok) return null;

    const dl = (await dlRes.json()) as { success?: boolean; download_link?: string };
    if (!dl?.success || !dl?.download_link) return null;
    return await downloadVerifiedMp3(dl.download_link, refererUrl);
  };

  try {
    return await attempt(false);
  } catch {
    return null;
  }
}

async function fetchYoutubeAudioViaYtDlp(
  videoId: string
): Promise<{ buffer: Buffer; ext: "m4a" | "mp3"; contentType: string; qualityLabel: string } | null> {
  if (!hasYtCookies()) return null;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vip-mdl-"));
  const outTpl = path.join(tmpDir, "track.%(ext)s");
  try {
    const args = [
      "--no-playlist",
      "--no-warnings",
      "--cookies",
      getYtCookiesPath(),
      "-f",
      "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio",
      "--max-filesize",
      "25M",
      "-o",
      outTpl,
      `https://music.youtube.com/watch?v=${videoId}`,
    ];
    await execFileAsync("/usr/local/bin/yt-dlp", args, { timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
    const files = await fs.readdir(tmpDir);
    const audioFile = files.find((f) => /\.(m4a|mp3|mp4|webm|opus)$/i.test(f));
    if (!audioFile) return null;
    const buf = await fs.readFile(path.join(tmpDir, audioFile));
    if (buf.length < 16_384 || buf.length > AUDIO_MAX_BYTES) return null;
    const isMp3 = audioFile.toLowerCase().endsWith(".mp3") || isValidMp3Buffer(buf);
    if (isMp3) {
      return { buffer: buf, ext: "mp3", contentType: "audio/mpeg", qualityLabel: "MP3 Audio" };
    }
    if (isValidM4aBuffer(buf)) {
      return { buffer: buf, ext: "m4a", contentType: "audio/mp4", qualityLabel: "AAC M4A" };
    }
    return null;
  } catch {
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function assembleSoundCloudAudio(scNumericId: string): Promise<AudioCacheEntry> {
  const track = await scApiFetchJson<ScTrack>(
    (cid) => `https://api-v2.soundcloud.com/tracks/${encodeURIComponent(scNumericId)}?client_id=${cid}`
  );
  if (!track?.id || !isFullScTrack(track)) {
    throw new Error("Trek audio tidak tersedia secara penuh atau dibatasi lisensi.");
  }

  const chosen = pickBestTranscoding(track);
  if (!chosen) {
    throw new Error("Format audio yang kompatibel tidak ditemukan untuk trek ini.");
  }

  const transcodingUrl = assertAllowedSoundCloudHost(chosen.transcoding.url);
  const authSuffix = track.track_authorization
    ? `&track_authorization=${encodeURIComponent(track.track_authorization)}`
    : "";
  const streamMeta = await scApiFetchJson<{ url?: string }>(
    (cid) => `${transcodingUrl}${transcodingUrl.includes("?") ? "&" : "?"}client_id=${cid}${authSuffix}`
  );
  if (!streamMeta?.url) {
    throw new Error("Gagal mendapatkan stream audio realtime.");
  }
  const safeStreamUrl = assertAllowedSoundCloudHost(streamMeta.url);

  let assembled: Buffer;
  if (chosen.transcoding.format?.protocol === "progressive") {
    const mediaRes = await fetch(safeStreamUrl, {
      headers: { "User-Agent": HTTP_UA },
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
    });
    if (!mediaRes.ok) {
      throw new Error(`Stream audio mengembalikan HTTP ${mediaRes.status}`);
    }
    assembled = Buffer.from(await mediaRes.arrayBuffer());
    if (assembled.length > AUDIO_MAX_BYTES) {
      throw new Error("Ukuran file audio melebihi batas aman (25 MB).");
    }
  } else {
    const playlistRes = await fetch(safeStreamUrl, {
      headers: { "User-Agent": HTTP_UA },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!playlistRes.ok) {
      throw new Error(`Playlist audio mengembalikan HTTP ${playlistRes.status}`);
    }
    const playlistText = await playlistRes.text();
    const initMatch = playlistText.match(/#EXT-X-MAP:URI="([^"]+)"/);
    const segmentLines = playlistText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    const segmentUrls: string[] = [];
    if (initMatch?.[1]) {
      segmentUrls.push(assertAllowedSoundCloudHost(new URL(initMatch[1], safeStreamUrl).toString()));
    }
    for (const seg of segmentLines) {
      segmentUrls.push(assertAllowedSoundCloudHost(new URL(seg, safeStreamUrl).toString()));
    }

    if (segmentUrls.length === 0 || segmentUrls.length > 260) {
      throw new Error("Playlist audio tidak valid atau durasi terlalu panjang.");
    }

    const buffers: Buffer[] = new Array(segmentUrls.length);
    let totalBytes = 0;
    const CONCURRENCY = 8;

    for (let i = 0; i < segmentUrls.length; i += CONCURRENCY) {
      const batch = segmentUrls.slice(i, i + CONCURRENCY);
      const chunkBufs = await Promise.all(
        batch.map(async (segUrl) => {
          const r = await fetch(segUrl, {
            headers: { "User-Agent": HTTP_UA },
            signal: AbortSignal.timeout(14000),
            cache: "no-store",
          });
          if (!r.ok) {
            throw new Error(`Gagal memuat segmen audio (HTTP ${r.status})`);
          }
          return Buffer.from(await r.arrayBuffer());
        })
      );
      for (let j = 0; j < chunkBufs.length; j++) {
        totalBytes += chunkBufs[j].length;
        if (totalBytes > AUDIO_MAX_BYTES) {
          throw new Error("Ukuran file audio melebihi batas aman (25 MB).");
        }
        buffers[i + j] = chunkBufs[j];
      }
    }

    assembled = Buffer.concat(buffers, totalBytes);
  }

  if (assembled.length < 8192) {
    throw new Error("Data audio tidak lengkap, silakan coba lagi.");
  }

  const title = String(track.title || "Untitled").trim();
  const artist = track.publisher_metadata?.artist || track.user?.username || "";
  return {
    buffer: assembled,
    contentType: chosen.contentType,
    ext: chosen.ext,
    filename: sanitizeFilename(title, artist, chosen.ext),
    title,
    artist,
    qualityLabel: chosen.qualityLabel,
    createdAt: Date.now(),
  };
}

async function resolveYoutubeMetaFallback(videoId: string): Promise<TrackMetaHint> {
  const cached = getTrackMeta(`yt_${videoId}`);
  if (cached) return cached;
  try {
    const oRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`,
      { headers: { "User-Agent": HTTP_UA }, signal: AbortSignal.timeout(5000), cache: "no-store" }
    );
    if (oRes.ok) {
      const o = (await oRes.json()) as { title?: string; author_name?: string };
      const title = cleanVideoTitle(o.title || "Music Track") || "Music Track";
      const artist = String(o.author_name || "")
        .replace(/\s*-\s*Topic$/i, "")
        .trim();
      const meta: TrackMetaHint = { title, artist, durationSec: 0, createdAt: Date.now() };
      putTrackMeta(`yt_${videoId}`, meta);
      return meta;
    }
  } catch {
    // ignore
  }
  return { title: `Track_${videoId}`, artist: "", durationSec: 0, createdAt: Date.now() };
}

async function findStrictSoundCloudFallback(meta: TrackMetaHint): Promise<string | null> {
  if (!meta.title || meta.title.startsWith("Track_")) return null;
  try {
    const query = `${meta.title} ${meta.artist}`.trim();
    const scData = await scApiFetchJson<{ collection?: ScTrack[] }>(
      (cid) =>
        `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(
          query
        )}&client_id=${cid}&limit=20`
    );
    const titleTokens = tokenize(meta.title);
    const artistTokens = tokenize(meta.artist);
    const qNorm = normalizeText(query);
    if (titleTokens.length === 0) return null;

    let bestId: string | null = null;
    let bestScore = -1;

    for (const item of scData?.collection || []) {
      if (!item?.id || !isFullScTrack(item)) continue;
      const durSec = Math.round(Number(item.duration || 0) / 1000);
      if (meta.durationSec > 0 && Math.abs(durSec - meta.durationSec) > 12) continue;

      const tNorm = normalizeText(item.title || "");
      const aNorm = normalizeText(item.publisher_metadata?.artist || item.user?.username || "");
      const slugNorm = normalizeText((item.permalink || "").replace(/-/g, " "));
      const allNorm = `${tNorm} ${aNorm} ${slugNorm}`.trim();
      if (detectUnrequestedVariants(allNorm, qNorm, item.title || "").length > 0) continue;

      const words = new Set(allNorm.split(" ").filter(Boolean));
      const tWords = new Set(tNorm.split(" ").filter(Boolean));
      const titleMatched = titleTokens.every((t) => tWords.has(t));
      const artistMatched =
        artistTokens.length === 0 || artistTokens.some((t) => words.has(t));
      if (!titleMatched || !artistMatched) continue;

      const score =
        Math.log10((item.playback_count || 0) + 1) * 10 -
        (meta.durationSec > 0 ? Math.abs(durSec - meta.durationSec) : 0);
      if (score > bestScore) {
        bestScore = score;
        bestId = String(item.id);
      }
    }
    return bestId;
  } catch {
    return null;
  }
}

async function resolveTrackAudioInternal(rawTrackId: string): Promise<AudioCacheEntry> {
  // YouTube Music studio track: yt_<11 chars>
  if (rawTrackId.startsWith("yt_")) {
    const videoId = rawTrackId.slice(3);
    const meta = await resolveYoutubeMetaFallback(videoId);

    // Tier 1: Official YouTube Music MP3 stream via cnvmp3 (cache -> fresh convert)
    const mp3Buf = await fetchYoutubeMp3ViaCnv(videoId, meta.title);
    if (mp3Buf) {
      return {
        buffer: mp3Buf,
        contentType: "audio/mpeg",
        ext: "mp3",
        filename: sanitizeFilename(meta.title, meta.artist, "mp3"),
        title: meta.title,
        artist: meta.artist,
        qualityLabel: "MP3 128 kbps",
        createdAt: Date.now(),
      };
    }

    // Tier 2: Local yt-dlp if owner uploaded YouTube cookies
    const ytdlpAudio = await fetchYoutubeAudioViaYtDlp(videoId);
    if (ytdlpAudio) {
      return {
        buffer: ytdlpAudio.buffer,
        contentType: ytdlpAudio.contentType,
        ext: ytdlpAudio.ext,
        filename: sanitizeFilename(meta.title, meta.artist, ytdlpAudio.ext),
        title: meta.title,
        artist: meta.artist,
        qualityLabel: ytdlpAudio.qualityLabel,
        createdAt: Date.now(),
      };
    }

    // Tier 3: Strictly verified non-remix SoundCloud exact-duration fallback
    const scFallbackId = await findStrictSoundCloudFallback(meta);
    if (scFallbackId) {
      const scEntry = await assembleSoundCloudAudio(scFallbackId);
      return {
        ...scEntry,
        title: meta.title,
        artist: meta.artist,
        filename: sanitizeFilename(meta.title, meta.artist, scEntry.ext),
      };
    }

    throw new Error("Server audio sedang sibuk untuk trek ini. Silakan coba lagi beberapa detik.");
  }

  // SoundCloud track: sc_<digits> or legacy <digits>
  const scNumericId = rawTrackId.startsWith("sc_") ? rawTrackId.slice(3) : rawTrackId;
  return await assembleSoundCloudAudio(scNumericId);
}

async function resolveAndCacheAudio(trackId: string): Promise<AudioCacheEntry> {
  const existing = AUDIO_CACHE.get(trackId);
  if (existing && Date.now() - existing.createdAt < AUDIO_CACHE_TTL_MS) {
    return existing;
  }

  const inflight = INFLIGHT_AUDIO.get(trackId);
  if (inflight) {
    return await inflight;
  }

  const promise = resolveTrackAudioInternal(trackId)
    .then((entry) => {
      putAudioCache(trackId, entry);
      return entry;
    })
    .finally(() => {
      INFLIGHT_AUDIO.delete(trackId);
    });

  INFLIGHT_AUDIO.set(trackId, promise);
  return await promise;
}

// =========================================================================
// SCORING ENGINE (STRICT ANTI-MISMATCH + STRICT ANTI-REMIX)
// =========================================================================

function stripSubtitles(raw: string): string {
  return String(raw || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleForCoreCompare(raw: string): string {
  return normalizeText(stripSubtitles(raw).replace(/&/g, " "))
    .replace(/\b(?:dan|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evaluateCandidateMatch(params: {
  rawTitle: string;
  rawArtist: string;
  rawSlug?: string;
  durationSec: number;
  plays: number;
  isOfficialAtv: boolean;
  verified: boolean;
  ytRank: number | null;
  qNorm: string;
  qTokens: string[];
  allowLongAudio: boolean;
  refDur: number;
  refTitleTokens: string[];
  refArtistTokens: string[];
}): {
  accepted: boolean;
  score: number;
  isVariant: boolean;
  variantTags: string[];
  durationMatch: boolean;
  matchLabel: string;
} {
  const {
    rawTitle,
    rawArtist,
    rawSlug = "",
    durationSec,
    plays,
    isOfficialAtv,
    verified,
    ytRank,
    qNorm,
    qTokens,
    allowLongAudio,
    refDur,
    refTitleTokens,
    refArtistTokens,
  } = params;

  const rejected = {
    accepted: false,
    score: -999,
    isVariant: false,
    variantTags: [] as string[],
    durationMatch: false,
    matchLabel: "",
  };

  if (!allowLongAudio && durationSec > 660) return rejected;
  if (!allowLongAudio && refDur > 0 && durationSec > Math.max(refDur * 1.65, refDur + 120)) {
    return rejected;
  }

  const titleNorm = normalizeText(rawTitle);
  const coreTitleNorm = normalizeText(stripSubtitles(rawTitle));
  const coreTitleCompare = normalizeTitleForCoreCompare(rawTitle);
  const qCompare = normalizeTitleForCoreCompare(qNorm);
  const artistNorm = normalizeText(rawArtist);
  const slugNorm = normalizeText(rawSlug.replace(/-/g, " "));
  const hayNorm = `${titleNorm} ${artistNorm} ${slugNorm}`.trim();
  const hayWords = new Set(hayNorm.split(" ").filter(Boolean));
  const titleWords = new Set(titleNorm.split(" ").filter(Boolean));
  const coreTitleWords = new Set(coreTitleNorm.split(" ").filter(Boolean));
  const artistWords = new Set(artistNorm.split(" ").filter(Boolean));
  const hayGlued = hayNorm.replace(/ /g, "");
  const titleGlued = titleNorm.replace(/ /g, "");
  const titleHasAmp = rawTitle.includes("&");

  let matchedCount = 0;
  let matchedInTitle = 0;
  let matchedInArtist = 0;

  for (const tok of qTokens) {
    const isAmpConnector = titleHasAmp && (tok === "dan" || tok === "and");
    const hitTitle =
      isAmpConnector || titleWords.has(tok) || (tok.length >= 6 && titleGlued.includes(tok));
    const hitArtist =
      artistWords.has(tok) || (tok.length >= 6 && artistNorm.replace(/ /g, "").includes(tok));
    const hitAny =
      hitTitle || hitArtist || hayWords.has(tok) || (tok.length >= 6 && hayGlued.includes(tok));
    if (hitAny) matchedCount++;
    if (hitTitle) matchedInTitle++;
    if (hitArtist) matchedInArtist++;
  }

  const coverage = matchedCount / qTokens.length;
  const minCoverage = qTokens.length <= 4 ? 1.0 : 0.8;

  const canonicalFullMatch =
    refTitleTokens.length >= 2 &&
    refTitleTokens.every((t) => titleWords.has(t) || (titleHasAmp && (t === "dan" || t === "and"))) &&
    refArtistTokens.some((t) => hayWords.has(t));

  // Allow explicit artist search (e.g. "sheila on 7" or exact single artist "hindia")
  const exactArtistQuery =
    (qTokens.length >= 2 && matchedInArtist === qTokens.length) ||
    (qTokens.length === 1 && artistNorm === qNorm);

  // Allow CJK/Japanese/Korean official #1 song when user types romaji title + artist (e.g. "idol yoasobi" -> "アイドル" by YOASOBI)
  const isLocalizedTopOfficial =
    ytRank === 0 &&
    isOfficialAtv &&
    matchedInArtist >= 1 &&
    /[\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]/.test(rawTitle);

  if (
    !canonicalFullMatch &&
    !exactArtistQuery &&
    !isLocalizedTopOfficial &&
    (coverage < minCoverage || matchedInTitle === 0)
  ) {
    return rejected;
  }

  // Variant/remix check across title + artist + SoundCloud permalink slug + parenthesized descriptors
  const variantTags = detectUnrequestedVariants(
    `${titleNorm} ${artistNorm} ${slugNorm}`.trim(),
    qNorm,
    rawTitle
  );

  // Catch mashup "Song A X Song B" in title when query does not ask for mashup (" x ")
  if (
    /\s+x\s+/i.test(rawTitle) &&
    !/\s+x\s+/i.test(qNorm) &&
    !/\s+x\s+/i.test(rawArtist) &&
    !variantTags.includes("mashup")
  ) {
    variantTags.push("mashup");
  }

  const isVariant = variantTags.length > 0;

  let score = coverage * 65 + (matchedInTitle / qTokens.length) * 28;
  const exactCoreTitle =
    titleNorm === qNorm ||
    coreTitleNorm === qNorm ||
    (qCompare.length >= 3 && coreTitleCompare === qCompare);
  if (exactCoreTitle) {
    score += 38;
  } else if (titleNorm.includes(qNorm) || hayNorm.includes(qNorm)) {
    score += 16;
  }

  // Official YouTube Music studio ATV track bonus & native ranking authority
  if (isOfficialAtv) {
    score += 48;
  }
  if (ytRank === 0) {
    score += 65;
  } else if (ytRank !== null) {
    score += Math.max(0, 26 - ytRank * 6);
  }

  if (!isVariant) {
    score += 36;
  } else {
    score -= 36 * Math.min(2, variantTags.length);
  }

  let durationMatch = false;
  if (refDur > 0 && durationSec > 0) {
    const diff = Math.abs(durationSec - refDur);
    if (diff <= 8) {
      score += 36;
      durationMatch = true;
    } else if (diff <= 20) {
      score += 20;
      durationMatch = true;
    } else if (diff <= 40) {
      score += 4;
    } else {
      score -= 22;
    }
  }

  if (refArtistTokens.length > 0) {
    const artHits = refArtistTokens.filter((t) => hayWords.has(t)).length;
    if (artHits > 0) score += 20 * (artHits / refArtistTokens.length);
  }

  // Count extra words only on core title (excluding parenthesized subtitles like "(Sakit Dadaku)" or "(feat. ...)")
  const allowedSet = new Set([...qTokens, ...refTitleTokens, ...refArtistTokens]);
  const extraTokens = [...coreTitleWords].filter(
    (w) => w.length >= 3 && !NOISE_WORDS.has(w) && !allowedSet.has(w)
  ).length;
  score -= Math.min(28, extraTokens * 4);

  // Real streaming popularity separates 300M-play official studio releases from 20-play knockoff covers
  score += Math.min(52, Math.log10((plays || 0) + 1) * 5.5);
  if (verified) score += 10;

  const requestedVariant = queryRequestsVariant(qNorm);
  const matchLabel = isVariant
    ? `Versi ${variantTags[0]}`
    : requestedVariant
      ? "Sesuai Pencarian"
      : isOfficialAtv
        ? "Studio Original"
        : durationMatch
          ? "Cocok Akurat"
          : "Original";

  return {
    accepted: true,
    score: Math.round(score),
    isVariant,
    variantTags,
    durationMatch,
    matchLabel,
  };
}

// =========================================================================
// ROUTE HANDLERS
// =========================================================================

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await req.json();
    const action = String(body?.action || "search").toLowerCase();

    // ===== EXACT LYRICS FOR SELECTED TRACK =====
    if (action === "lyrics") {
      const title = String(body?.title || "").trim();
      const artist = String(body?.artist || "").trim();
      const durationSec = Number(body?.durationSec || 0);
      if (!title) {
        return NextResponse.json({ ok: false, error: "Judul lagu wajib diisi." }, { status: 400 });
      }

      const cleanedTitle = cleanVideoTitle(title);
      const splitParts = cleanedTitle.split(/\s+[-–]\s+/);
      const tryTitle = splitParts.length >= 2 ? splitParts[1].trim() : cleanedTitle;
      const tryArtist = (splitParts.length >= 2 ? splitParts[0].trim() : artist)
        .replace(/\b(?:featuring|feat\.?|ft\.?)\b.*$/i, "")
        .split(/[,&]/)[0]
        .trim();

      let matched: { trackName: string; artistName: string; plainLyrics: string } | null = null;

      try {
        const params = new URLSearchParams({ track_name: tryTitle });
        if (tryArtist) params.set("artist_name", tryArtist);
        if (durationSec > 45) params.set("duration", String(Math.round(durationSec)));
        const r = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
          headers: { "User-Agent": "MattzLM-Web/2.0" },
          signal: AbortSignal.timeout(6500),
          cache: "no-store",
        });
        if (r.ok) {
          const d = (await r.json()) as {
            trackName?: string;
            artistName?: string;
            plainLyrics?: string;
          };
          if (d?.plainLyrics) {
            matched = {
              trackName: String(d.trackName || tryTitle),
              artistName: String(d.artistName || tryArtist),
              plainLyrics: String(d.plainLyrics),
            };
          }
        }
      } catch {
        // fallback to verified search
      }

      if (!matched) {
        try {
          const q = `${tryTitle} ${tryArtist}`.trim();
          const r = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, {
            headers: { "User-Agent": "MattzLM-Web/2.0" },
            signal: AbortSignal.timeout(6500),
            cache: "no-store",
          });
          if (r.ok) {
            const arr = (await r.json()) as Array<{
              trackName?: string;
              artistName?: string;
              plainLyrics?: string;
            }>;
            const targetTokens = tokenize(tryTitle);
            for (const item of arr || []) {
              if (!item?.plainLyrics) continue;
              const hayWords = new Set(
                normalizeText(`${item.trackName} ${item.artistName}`).split(" ")
              );
              const hits = targetTokens.filter((t) => hayWords.has(t)).length;
              const cov = targetTokens.length ? hits / targetTokens.length : 0;
              if (cov >= 0.8) {
                matched = {
                  trackName: String(item.trackName || tryTitle),
                  artistName: String(item.artistName || tryArtist),
                  plainLyrics: String(item.plainLyrics),
                };
                break;
              }
            }
          }
        } catch {
          // ignore
        }
      }

      return NextResponse.json(
        { ok: true, lyrics: matched },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // ===== REALTIME VERIFIED MUSIC SEARCH =====
    const rawQuery = String(body?.query || "").trim();
    const originalOnly = body?.originalOnly !== false;
    if (!rawQuery || rawQuery.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Masukkan judul lagu, nama penyanyi, atau tautan musik (min. 2 karakter)." },
        { status: 400 }
      );
    }
    if (rawQuery.length > 300) {
      return NextResponse.json(
        { ok: false, error: "Kueri terlalu panjang (maksimal 300 karakter)." },
        { status: 400 }
      );
    }

    let searchQuery = rawQuery;
    let sourceLabel = "YouTube Music Studio";

    if (/^https?:\/\//i.test(rawQuery)) {
      const resolved = await resolveDirectUrl(rawQuery);
      if (resolved.kind === "yt_track") {
        const trackItem = serializeYtTrack(resolved.track, {
          score: 260,
          isVariant: false,
          variantTags: [],
          durationMatch: true,
          matchLabel: "Tautan Langsung (100% Akurat)",
        });
        return NextResponse.json(
          {
            ok: true,
            mode: "url_exact",
            sourceLabel: "YouTube Direct",
            query: rawQuery,
            resolvedQuery: trackItem.title,
            canonical: null,
            tracks: [trackItem],
            onlyVariantsAvailable: false,
            variantCount: 0,
            totalScanned: 1,
            latencyMs: Date.now() - startedAt,
          },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      if (resolved.kind === "sc_track") {
        const trackItem = serializeScTrack(resolved.track, {
          score: 240,
          isVariant: false,
          variantTags: [],
          durationMatch: true,
          matchLabel: "Tautan Langsung (100% Akurat)",
        });
        return NextResponse.json(
          {
            ok: true,
            mode: "url_exact",
            sourceLabel: "SoundCloud Direct",
            query: rawQuery,
            resolvedQuery: trackItem.title,
            canonical: null,
            tracks: [trackItem],
            onlyVariantsAvailable: false,
            variantCount: 0,
            totalScanned: 1,
            latencyMs: Date.now() - startedAt,
          },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      searchQuery = resolved.query;
      sourceLabel = resolved.sourceLabel;
    }

    const qNorm = normalizeText(searchQuery);
    const qTokens = tokenize(searchQuery);
    if (qTokens.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Kueri tidak mengandung kata kunci lagu yang valid." },
        { status: 400 }
      );
    }

    const userAskedVariant = queryRequestsVariant(qNorm);
    const strictOriginal = originalOnly && !userAskedVariant;
    const allowLongAudio = /\b(album|hour|jam|mix|nonstop|medley|podcast|set|live)\b/i.test(qNorm);

    // Primary parallel search: Official YouTube Music Songs + Deezer Canonical Reference.
    // Query SoundCloud in parallel ONLY when user wants remixes/variants or turned off originalOnly.
    const scPromise = !strictOriginal
      ? scApiFetchJson<{ collection?: ScTrack[] }>(
          (cid) =>
            `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(
              searchQuery
            )}&client_id=${cid}&limit=25`
        ).catch(() => ({ collection: [] as ScTrack[] }))
      : Promise.resolve({ collection: [] as ScTrack[] });

    const [ytSongs, canonical, scInitial] = await Promise.all([
      searchYtMusicSongs(searchQuery),
      fetchCanonicalReference(searchQuery),
      scPromise,
    ]);

    const refDur = canonical?.durationSec || 0;
    const refTitleTokens = canonical ? tokenize(canonical.title) : [];
    const refArtistTokens = canonical ? tokenize(canonical.artist) : [];

    const scoredAll: SerializedTrack[] = [];
    const seenKeys = new Set<string>();

    const scoreYtItems = (items: YtMusicCandidate[]) => {
      for (const cand of items) {
        if (cand.durationSec > 0 && cand.durationSec < 45) continue;
        const evalRes = evaluateCandidateMatch({
          rawTitle: cand.title,
          rawArtist: cand.artist,
          durationSec: cand.durationSec,
          plays: cand.plays,
          isOfficialAtv: cand.isOfficialAtv,
          verified: cand.isOfficialAtv,
          ytRank: cand.ytRank,
          qNorm,
          qTokens,
          allowLongAudio,
          refDur,
          refTitleTokens,
          refArtistTokens,
        });
        if (!evalRes.accepted) continue;

        const dedupKey = `yt:${cand.videoId}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);

        scoredAll.push(
          serializeYtTrack(cand, {
            score: evalRes.score,
            isVariant: evalRes.isVariant,
            variantTags: evalRes.variantTags,
            durationMatch: evalRes.durationMatch,
            matchLabel: evalRes.matchLabel,
            canonicalCover: canonical?.cover,
          })
        );
      }
    };

    const scoreScItems = (items: ScTrack[]) => {
      for (const item of items) {
        if (!item?.id || !isFullScTrack(item)) continue;
        const dedupKey = `sc:${item.id}`;
        if (seenKeys.has(dedupKey)) continue;

        const durSec = Math.round(Number(item.duration || 0) / 1000);
        const artist = item.publisher_metadata?.artist || item.user?.username || "";
        const evalRes = evaluateCandidateMatch({
          rawTitle: item.title || "",
          rawArtist: artist,
          rawSlug: item.permalink || "",
          durationSec: durSec,
          plays: Number(item.playback_count || 0),
          isOfficialAtv: false,
          verified: Boolean(item.user?.verified),
          ytRank: null,
          qNorm,
          qTokens,
          allowLongAudio,
          refDur,
          refTitleTokens,
          refArtistTokens,
        });
        if (!evalRes.accepted) continue;

        seenKeys.add(dedupKey);
        scoredAll.push(
          serializeScTrack(item, {
            score: evalRes.score,
            isVariant: evalRes.isVariant,
            variantTags: evalRes.variantTags,
            durationMatch: evalRes.durationMatch,
            matchLabel: evalRes.matchLabel,
            canonicalCover: canonical?.cover,
          })
        );
      }
    };

    scoreYtItems(ytSongs);
    let totalScanned = ytSongs.length;

    if (Array.isArray(scInitial?.collection) && scInitial.collection.length > 0) {
      scoreScItems(scInitial.collection);
      totalScanned += scInitial.collection.length;
    }

    // If strictOriginal yielded 0 clean studio hits on YouTube Music (e.g. indie SoundCloud-only release),
    // run a targeted SoundCloud fallback while still enforcing strict non-variant filtering.
    const cleanBeforeFallback = scoredAll.filter((t) => !t.isVariant);
    if (strictOriginal && cleanBeforeFallback.length === 0) {
      try {
        const scFallback = await scApiFetchJson<{ collection?: ScTrack[] }>(
          (cid) =>
            `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(
              searchQuery
            )}&client_id=${cid}&limit=25`
        );
        const scRows = Array.isArray(scFallback?.collection) ? scFallback.collection : [];
        scoreScItems(scRows);
        totalScanned += scRows.length;
      } catch {
        // ignore fallback error
      }
    }

    scoredAll.sort((a, b) => b.matchScore - a.matchScore);

    // STRICT ANTI-REMIX GUARANTEE:
    // When "Hanya Versi Original" is active and user did NOT ask for a remix/cover,
    // NEVER silently fall back to remix/variant tracks!
    const cleanOnly = scoredAll.filter((t) => !t.isVariant);
    const variantTracks = scoredAll.filter((t) => t.isVariant);

    const finalTracks = (strictOriginal ? cleanOnly : scoredAll).slice(0, 10);
    const onlyVariantsAvailable = strictOriginal && cleanOnly.length === 0 && variantTracks.length > 0;

    return NextResponse.json(
      {
        ok: true,
        mode: "search",
        sourceLabel,
        query: rawQuery,
        resolvedQuery: searchQuery,
        canonical,
        tracks: finalTracks,
        onlyVariantsAvailable,
        variantCount: variantTracks.length,
        totalScanned,
        latencyMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const msg = sanitizePublicError(err, "Pencarian musik realtime gagal.");
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const trackId = (req.nextUrl.searchParams.get("id") || "").trim();
    const mode = (req.nextUrl.searchParams.get("mode") || "stream").toLowerCase();

    const validId =
      /^yt_[A-Za-z0-9_-]{11}$/.test(trackId) ||
      /^sc_\d{4,16}$/.test(trackId) ||
      /^\d{4,16}$/.test(trackId);

    if (!validId) {
      return NextResponse.json(
        { ok: false, error: "ID trek audio tidak valid." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const entry = await resolveAndCacheAudio(trackId);
    const totalLength = entry.buffer.length;
    const isDownload = mode === "download";

    const baseHeaders = new Headers();
    baseHeaders.set("Content-Type", entry.contentType);
    baseHeaders.set("Accept-Ranges", "bytes");
    baseHeaders.set("Cache-Control", "private, max-age=300");
    baseHeaders.set("X-Track-Id", trackId);
    baseHeaders.set("X-Audio-Quality", entry.qualityLabel);
    baseHeaders.set(
      "Content-Disposition",
      isDownload
        ? `attachment; filename="${entry.filename}"`
        : `inline; filename="${entry.filename}"`
    );

    const rangeHeader = req.headers.get("range");
    if (!isDownload && rangeHeader && rangeHeader.startsWith("bytes=")) {
      const [rawStart, rawEnd] = rangeHeader.replace(/^bytes=/, "").split("-");
      const start = rawStart ? Number.parseInt(rawStart, 10) : 0;
      const end = rawEnd ? Math.min(totalLength - 1, Number.parseInt(rawEnd, 10)) : totalLength - 1;

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 0 ||
        start >= totalLength ||
        end < start
      ) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${totalLength}` },
        });
      }

      const chunk = entry.buffer.subarray(start, end + 1);
      baseHeaders.set("Content-Range", `bytes ${start}-${end}/${totalLength}`);
      baseHeaders.set("Content-Length", String(chunk.length));
      return new NextResponse(new Uint8Array(chunk), { status: 206, headers: baseHeaders });
    }

    baseHeaders.set("Content-Length", String(totalLength));
    return new NextResponse(new Uint8Array(entry.buffer), { status: 200, headers: baseHeaders });
  } catch (err) {
    const msg = sanitizePublicError(err, "Gagal memuat atau mengunduh audio trek.");
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
