import { NextRequest, NextResponse } from "next/server";
import { assertPublicHttpUrl, safeFetchPublic, sanitizePublicError } from "@/lib/server/net-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  rank: number;
  artist?: { name?: string };
  album?: { title?: string; cover_medium?: string };
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

const SC_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

let cachedClientId = "";
let cachedClientIdAt = 0;
const CLIENT_ID_TTL_MS = 2 * 60 * 60 * 1000;

const AUDIO_CACHE = new Map<string, AudioCacheEntry>();
const AUDIO_CACHE_MAX_ITEMS = 6;
const AUDIO_CACHE_TTL_MS = 5 * 60 * 1000;
const AUDIO_MAX_BYTES = 26 * 1024 * 1024;

// Only explicit search/media noise words. Never strip words that can be real song titles (e.g. "dan", "di", "with", "a").
const NOISE_WORDS = new Set([
  "official", "audio", "video", "lyric", "lyrics", "lirik", "mv", "hd", "hq",
  "full", "song", "lagu", "mp3", "m4a", "download", "music", "musik",
  "original", "track", "single", "ft", "feat", "featuring", "by", "prod",
]);

const VARIANT_PHRASES = [
  "remix", "slowed", "reverb", "reverbed", "sped up", "speed up", "nightcore", "cover",
  "karaoke", "instrumental", "inst", "8d", "mashup", "bootleg", "flip", "koplo", "dj",
  "tiktok", "tik tok", "pop punk", "lofi", "lo fi", "1 hour", "1 jam", "loop", "play along",
  "piano version", "guitar cover", "parody", "parodi", "tribute", "hard mix", "hardstyle",
  "jedag jedug", "breakbeat", "rework", "circuit", "funkot", "full album", "best hits",
  "greatest hits", "compilation", "nonstop", "medley", "mixtape", "reggae", "dub",
  "acoustic", "live", "counter", "english", "eng ver", "edit", "mix", "vers", "version",
  "acapella", "vocals only", "orchestral", "aransemen", "jazzy", "originally performed",
  "in the style of", "made famous", "ringtone", "piano", "violin", "cello", "music box",
  "box version", "8 bit", "8bit", "chiptune", "synthesia", "tutorial", "blender", "vip",
  "fingerstyle", "guitar", "ukulele", "drum cover", "bass cover", "saxophone", "kalimba", "flute",
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

function detectUnrequestedVariants(candidateNorm: string, queryNorm: string): string[] {
  const found: string[] = [];
  for (const phrase of VARIANT_PHRASES) {
    const pattern = new RegExp(`(?:^| )${phrase.replace(/\s+/g, " ")}(?: |$)`);
    if (pattern.test(candidateNorm) && !pattern.test(queryNorm)) {
      found.push(phrase);
    }
  }
  return found;
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

function sanitizeFilename(title: string, artist: string, ext: string): string {
  const raw = artist && !normalizeText(title).includes(normalizeText(artist))
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

function upgradeArtwork(url?: string | null): string {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  return url.replace("-large.", "-t300x300.");
}

function assertAllowedAudioHost(rawUrl: string): string {
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

function isFullTrack(track: ScTrack): boolean {
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
    headers: { "User-Agent": SC_UA },
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (!homeRes.ok) {
    throw new Error(`Layanan pencarian musik mengembalikan HTTP ${homeRes.status}`);
  }
  const html = await homeRes.text();
  const scriptUrls = [...html.matchAll(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"'<>]+\.js/g)].map(
    (m) => m[0]
  );

  for (const scriptUrl of scriptUrls.slice(-6).reverse()) {
    try {
      const jsRes = await fetch(assertAllowedAudioHost(scriptUrl), {
        headers: { "User-Agent": SC_UA },
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

  throw new Error("Gagal menginisialisasi sesi pencarian musik realtime.");
}

async function scApiFetchJson<T>(urlBuilder: (clientId: string) => string): Promise<T> {
  let clientId = await getSoundCloudClientId(false);
  let targetUrl = assertAllowedAudioHost(urlBuilder(clientId));
  let res = await fetch(targetUrl, {
    headers: { "User-Agent": SC_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    clientId = await getSoundCloudClientId(true);
    targetUrl = assertAllowedAudioHost(urlBuilder(clientId));
    res = await fetch(targetUrl, {
      headers: { "User-Agent": SC_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
  }
  if (!res.ok) {
    throw new Error(`Pencarian musik gagal (HTTP ${res.status}).`);
  }
  return (await res.json()) as T;
}

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
        headers: { "User-Agent": SC_UA },
        signal: AbortSignal.timeout(4500),
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
      if (detectUnrequestedVariants(dAllNorm, qNorm).length > 0) continue;

      const dTitleWords = new Set(dTitleNorm.split(" ").filter(Boolean));
      const dArtistWords = new Set(dArtistNorm.split(" ").filter(Boolean));
      const dHayWords = new Set(dAllNorm.split(" ").filter(Boolean));

      const hits = qTokens.filter((t) => dHayWords.has(t)).length;
      const titleHits = qTokens.filter((t) => dTitleWords.has(t)).length;
      const artistHits = qTokens.filter((t) => dArtistWords.has(t)).length;
      const cov = hits / qTokens.length;
      if (cov < (qTokens.length <= 4 ? 0.99 : 0.7) || titleHits === 0) continue;

      const extraTitle = [...dTitleWords].filter(
        (w) => w.length >= 2 && !NOISE_WORDS.has(w) && !qTokens.includes(w)
      ).length;
      const score =
        cov * 80 +
        (artistHits > 0 ? 28 : 0) +
        Math.log10((d.rank || 1) + 1) * 18 -
        extraTitle * 14;
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

function cleanVideoTitle(raw: string): string {
  return String(raw || "")
    .replace(/\((?:official\s+)?(?:music\s+video|lyric\s+video|lyrics|audio|mv|hd|hq|4k|visualizer)[^)]*\)/gi, " ")
    .replace(/\[(?:official\s+)?(?:music\s+video|lyric\s+video|lyrics|audio|mv|hd|hq|4k|visualizer)[^\]]*\]/gi, " ")
    .replace(/\|.*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function resolveDirectUrl(rawUrl: string): Promise<
  | { kind: "sc_track"; track: ScTrack }
  | { kind: "derived_query"; query: string; sourceLabel: string }
> {
  let parsed = await assertPublicHttpUrl(rawUrl);
  let host = parsed.hostname.toLowerCase();

  // Resolve short links safely with SSRF-guarded redirects
  if (host === "on.soundcloud.com" || host === "spotify.link" || host === "spoti.fi") {
    const { finalUrl } = await safeFetchPublic(parsed.toString(), {
      method: "GET",
      headers: { "User-Agent": SC_UA },
      signal: AbortSignal.timeout(8000),
    });
    parsed = await assertPublicHttpUrl(finalUrl);
    host = parsed.hostname.toLowerCase();
  }

  // 1. Direct SoundCloud track link
  if (host === "soundcloud.com" || host === "www.soundcloud.com" || host === "m.soundcloud.com") {
    const resolvedTrack = await scApiFetchJson<ScTrack>(
      (cid) => `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(parsed.toString())}&client_id=${cid}`
    );
    if (resolvedTrack?.id && isFullTrack(resolvedTrack)) {
      return { kind: "sc_track", track: resolvedTrack };
    }
    if (resolvedTrack?.title) {
      const artist = resolvedTrack.publisher_metadata?.artist || resolvedTrack.user?.username || "";
      return {
        kind: "derived_query",
        query: `${resolvedTrack.title} ${artist}`.trim(),
        sourceLabel: "SoundCloud (cari versi full)",
      };
    }
    throw new Error("Tautan SoundCloud tidak mengarah ke trek audio yang valid.");
  }

  // 2. Spotify track link -> resolve exact title + artist via Spotify oEmbed + page metadata
  if (host === "open.spotify.com" || host === "spotify.com") {
    let title = "";
    let artist = "";
    try {
      const oRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.toString())}`,
        { headers: { "User-Agent": SC_UA }, signal: AbortSignal.timeout(6000), cache: "no-store" }
      );
      if (oRes.ok) {
        const oData = (await oRes.json()) as { title?: string };
        title = String(oData.title || "").trim();
      }
    } catch {
      // continue to page metadata
    }
    try {
      const { response } = await safeFetchPublic(parsed.toString(), {
        headers: { "User-Agent": SC_UA },
        signal: AbortSignal.timeout(7000),
      });
      if (response.ok) {
        const html = await response.text();
        const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
        const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
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
      query: artist && !normalizeText(title).includes(normalizeText(artist)) ? `${title} ${artist}` : title,
      sourceLabel: "Spotify Track",
    };
  }

  // 3. YouTube / YouTube Music link -> resolve exact title via YouTube oEmbed
  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be"
  ) {
    const oRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.toString())}&format=json`,
      { headers: { "User-Agent": SC_UA }, signal: AbortSignal.timeout(6500), cache: "no-store" }
    );
    if (!oRes.ok) {
      throw new Error("Gagal membaca judul lagu dari link YouTube tersebut.");
    }
    const oData = (await oRes.json()) as { title?: string; author_name?: string };
    const cleanTitle = cleanVideoTitle(oData.title || "");
    const author = String(oData.author_name || "")
      .replace(/\s*-\s*Topic$/i, "")
      .replace(/(?:VEVO|Official)$/i, "")
      .trim();
    if (!cleanTitle) {
      throw new Error("Judul lagu tidak terbaca dari link YouTube.");
    }
    const alreadyHasArtist = /\s+[-–]\s+/.test(cleanTitle);
    const combined =
      author && !alreadyHasArtist && !normalizeText(cleanTitle).includes(normalizeText(author))
        ? `${cleanTitle} ${author}`
        : cleanTitle;
    return {
      kind: "derived_query",
      query: combined,
      sourceLabel: "YouTube",
    };
  }

  throw new Error("Tautan tidak didukung. Gunakan judul lagu atau link SoundCloud, Spotify, atau YouTube.");
}

function serializeTrack(
  track: ScTrack,
  meta: {
    score: number;
    isVariant: boolean;
    variantTags: string[];
    durationMatch: boolean;
    matchLabel: string;
    canonicalCover?: string;
  }
) {
  const best = pickBestTranscoding(track);
  const durSec = Math.round(Number(track.duration || 0) / 1000);
  const artist =
    track.publisher_metadata?.artist ||
    track.user?.username ||
    "Unknown Artist";
  const title = String(track.title || "Untitled").trim();
  const artwork =
    upgradeArtwork(track.artwork_url) ||
    meta.canonicalCover ||
    upgradeArtwork(track.user?.avatar_url) ||
    "";

  return {
    id: String(track.id),
    title,
    artist,
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
    streamUrl: `/api/tools/music-dl?id=${track.id}&mode=stream`,
    downloadUrl: `/api/tools/music-dl?id=${track.id}&mode=download`,
  };
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

async function resolveAndAssembleTrackAudio(trackId: string): Promise<AudioCacheEntry> {
  const existing = AUDIO_CACHE.get(trackId);
  if (existing && Date.now() - existing.createdAt < AUDIO_CACHE_TTL_MS) {
    return existing;
  }

  const track = await scApiFetchJson<ScTrack>(
    (cid) => `https://api-v2.soundcloud.com/tracks/${encodeURIComponent(trackId)}?client_id=${cid}`
  );
  if (!track?.id || !isFullTrack(track)) {
    throw new Error("Trek audio tidak tersedia secara penuh atau dibatasi lisensi.");
  }

  const chosen = pickBestTranscoding(track);
  if (!chosen) {
    throw new Error("Format audio yang kompatibel tidak ditemukan untuk trek ini.");
  }

  const transcodingUrl = assertAllowedAudioHost(chosen.transcoding.url);
  const authSuffix = track.track_authorization
    ? `&track_authorization=${encodeURIComponent(track.track_authorization)}`
    : "";
  const streamMeta = await scApiFetchJson<{ url?: string }>(
    (cid) => `${transcodingUrl}${transcodingUrl.includes("?") ? "&" : "?"}client_id=${cid}${authSuffix}`
  );
  if (!streamMeta?.url) {
    throw new Error("Gagal mendapatkan stream audio realtime.");
  }
  const safeStreamUrl = assertAllowedAudioHost(streamMeta.url);

  let assembled: Buffer;
  if (chosen.transcoding.format?.protocol === "progressive") {
    const mediaRes = await fetch(safeStreamUrl, {
      headers: { "User-Agent": SC_UA },
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
      headers: { "User-Agent": SC_UA },
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
      segmentUrls.push(assertAllowedAudioHost(new URL(initMatch[1], safeStreamUrl).toString()));
    }
    for (const seg of segmentLines) {
      segmentUrls.push(assertAllowedAudioHost(new URL(seg, safeStreamUrl).toString()));
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
            headers: { "User-Agent": SC_UA },
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
  const entry: AudioCacheEntry = {
    buffer: assembled,
    contentType: chosen.contentType,
    ext: chosen.ext,
    filename: sanitizeFilename(title, artist, chosen.ext),
    title,
    artist,
    qualityLabel: chosen.qualityLabel,
    createdAt: Date.now(),
  };

  putAudioCache(trackId, entry);
  return entry;
}

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
      const tryArtist = splitParts.length >= 2 ? splitParts[0].trim() : artist;

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
          const d = (await r.json()) as { trackName?: string; artistName?: string; plainLyrics?: string };
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
              const hayWords = new Set(normalizeText(`${item.trackName} ${item.artistName}`).split(" "));
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
    let sourceLabel = "Realtime Search";

    if (/^https?:\/\//i.test(rawQuery)) {
      const resolved = await resolveDirectUrl(rawQuery);
      if (resolved.kind === "sc_track") {
        const trackItem = serializeTrack(resolved.track, {
          score: 210,
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

    const [scData, canonical] = await Promise.all([
      scApiFetchJson<{ collection?: ScTrack[] }>(
        (cid) =>
          `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(
            searchQuery
          )}&client_id=${cid}&limit=40`
      ),
      fetchCanonicalReference(searchQuery),
    ]);

    const rawCollection = Array.isArray(scData?.collection) ? scData.collection : [];
    const allowLongAudio = /\b(album|hour|jam|mix|nonstop|medley|podcast|set|live)\b/i.test(qNorm);
    const refDur = canonical?.durationSec || 0;
    const refTitleTokens = canonical ? tokenize(canonical.title) : [];
    const refArtistTokens = canonical ? tokenize(canonical.artist) : [];

    const seenIds = new Set<number>();
    const scoredAll: Array<ReturnType<typeof serializeTrack>> = [];

    for (const item of rawCollection) {
      if (!item?.id || seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      if (!isFullTrack(item)) continue;

      const durSec = Math.round(Number(item.duration || 0) / 1000);
      if (!allowLongAudio && durSec > 660) continue;
      if (!allowLongAudio && refDur > 0 && durSec > Math.max(refDur * 1.85, refDur + 135)) continue;

      const titleNorm = normalizeText(item.title || "");
      const artistNorm = normalizeText(item.publisher_metadata?.artist || item.user?.username || "");
      const slugNorm = normalizeText((item.permalink || "").replace(/-/g, " "));
      const hayNorm = `${titleNorm} ${artistNorm} ${slugNorm}`.trim();
      const hayWords = new Set(hayNorm.split(" ").filter(Boolean));
      const titleWords = new Set(titleNorm.split(" ").filter(Boolean));
      const hayGlued = hayNorm.replace(/ /g, "");
      const titleGlued = titleNorm.replace(/ /g, "");

      let matchedCount = 0;
      let matchedInTitle = 0;
      for (const tok of qTokens) {
        const hitAny = hayWords.has(tok) || (tok.length >= 6 && hayGlued.includes(tok));
        const hitTitle = titleWords.has(tok) || (tok.length >= 6 && titleGlued.includes(tok));
        if (hitAny) matchedCount++;
        if (hitTitle) matchedInTitle++;
      }

      const coverage = matchedCount / qTokens.length;
      // Strict exact-match threshold: 100% of query words for <= 4 tokens so wrong songs never pass
      const minCoverage = qTokens.length <= 4 ? 1.0 : 0.80;
      const canonicalFullMatch =
        refTitleTokens.length >= 2 &&
        refTitleTokens.every((t) => titleWords.has(t)) &&
        refArtistTokens.some((t) => hayWords.has(t));

      if (!canonicalFullMatch && (coverage < minCoverage || matchedInTitle === 0)) continue;

      const variantTags = detectUnrequestedVariants(`${titleNorm} ${artistNorm}`, qNorm);
      const isVariant = variantTags.length > 0;

      let score = coverage * 65 + (matchedInTitle / qTokens.length) * 25;
      if (titleNorm.includes(qNorm) || hayNorm.includes(qNorm)) score += 16;

      if (!isVariant) {
        score += 36;
      } else {
        score -= 28 * Math.min(2, variantTags.length);
      }

      let durationMatch = false;
      if (refDur > 0) {
        const diff = Math.abs(durSec - refDur);
        if (diff <= 8) {
          score += 44;
          durationMatch = true;
        } else if (diff <= 20) {
          score += 28;
          durationMatch = true;
        } else if (diff <= 40) {
          score += 8;
        } else {
          score -= 24;
        }
      }

      if (refArtistTokens.length > 0) {
        const artHits = refArtistTokens.filter((t) => hayWords.has(t)).length;
        if (artHits > 0) score += 12 * (artHits / refArtistTokens.length);
      }

      const allowedSet = new Set([...qTokens, ...refTitleTokens, ...refArtistTokens]);
      const extraTokens = [...titleWords].filter(
        (w) => w.length >= 3 && !NOISE_WORDS.has(w) && !allowedSet.has(w)
      ).length;
      score -= Math.min(26, extraTokens * 4);

      score += Math.min(18, Math.log10((item.playback_count || 0) + 1) * 2.8);
      if (item.user?.verified) score += 10;

      const matchLabel = isVariant
        ? `Versi ${variantTags[0]}`
        : durationMatch
          ? "Cocok Akurat"
          : "Original";

      scoredAll.push(
        serializeTrack(item, {
          score: Math.round(score),
          isVariant,
          variantTags,
          durationMatch,
          matchLabel,
          canonicalCover: canonical?.cover,
        })
      );
    }

    scoredAll.sort((a, b) => b.matchScore - a.matchScore);

    const cleanOnly = scoredAll.filter((t) => !t.isVariant);
    let finalTracks = originalOnly && cleanOnly.length > 0 ? cleanOnly : scoredAll;
    const onlyVariantsAvailable = originalOnly && cleanOnly.length === 0 && scoredAll.length > 0;
    finalTracks = finalTracks.slice(0, 10);

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
        totalScanned: rawCollection.length,
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

    if (!/^\d{4,16}$/.test(trackId)) {
      return NextResponse.json(
        { ok: false, error: "ID trek audio tidak valid." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const entry = await resolveAndAssembleTrackAudio(trackId);
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
