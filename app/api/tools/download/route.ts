import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { requireXvipUser } from "@/lib/server/auth";
import { assertPublicHttpUrl } from "@/lib/server/net-guard";
import { getYtCookiesPath, hasYtCookies } from "@/lib/server/store";

const execFileAsync = promisify(execFile);

interface MediaFormatItem {
  label: string;
  ext: string;
  quality: string;
  url: string;
  proxyUrl: string;
  type: "video" | "audio" | "image";
  filesize?: number;
}

function buildProxyUrl(url: string, filename: string, download = false): string {
  const params = new URLSearchParams({ url, filename });
  if (download) params.set("download", "1");
  return `/api/tools/proxy?${params.toString()}`;
}

function extractYouTubeId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    if (u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/")) {
      return u.pathname.split("/")[2] || null;
    }
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

async function runYtDlp(targetUrl: string) {
  const args = [
    "--no-warnings",
    "--no-playlist",
    "-J",
    "--socket-timeout",
    "12",
  ];
  if (hasYtCookies()) {
    args.push("--cookies", getYtCookiesPath());
  }
  args.push(targetUrl);

  const { stdout } = await execFileAsync("/usr/local/bin/yt-dlp", args, {
    timeout: 22000,
    maxBuffer: 12 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

async function tryPipedYouTube(videoId: string) {
  const hosts = ["https://api.piped.private.coffee"];
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/streams/${encodeURIComponent(videoId)}`, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "MattzLM-VPS/2.0" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data?.title) continue;

      const safeTitle = String(data.title || "youtube_video")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 48);

      const formats: MediaFormatItem[] = [];
      const videoStreams = Array.isArray(data.videoStreams) ? data.videoStreams : [];
      const muxed = videoStreams.filter((s: { videoOnly?: boolean; url?: string }) => !s.videoOnly && s.url);
      const videoOnly = videoStreams.filter((s: { videoOnly?: boolean; url?: string }) => s.videoOnly && s.url);

      for (const s of muxed.slice(0, 4)) {
        const ext = String(s.format || "mp4").toLowerCase().includes("webm") ? "webm" : "mp4";
        formats.push({
          label: `Video ${s.quality || "SD"} (${ext.toUpperCase()} + Audio)`,
          ext,
          quality: String(s.quality || "SD"),
          url: s.url,
          proxyUrl: buildProxyUrl(s.url, `${safeTitle}_${s.quality || "sd"}.${ext}`, true),
          type: "video",
          filesize: Number(s.contentLength || 0) || undefined,
        });
      }
      if (formats.length === 0) {
        for (const s of videoOnly.slice(0, 3)) {
          const ext = String(s.format || "mp4").toLowerCase().includes("webm") ? "webm" : "mp4";
          formats.push({
            label: `Video ${s.quality || "HD"} (Video Only)`,
            ext,
            quality: String(s.quality || "HD"),
            url: s.url,
            proxyUrl: buildProxyUrl(s.url, `${safeTitle}_${s.quality || "hd"}.${ext}`, true),
            type: "video",
          });
        }
      }

      const audioStreams = Array.isArray(data.audioStreams) ? data.audioStreams : [];
      for (const a of audioStreams.slice(0, 2)) {
        if (!a.url) continue;
        const ext = String(a.mimeType || "").includes("mp4") ? "m4a" : "webm";
        formats.push({
          label: `Audio ${a.quality || "HQ"} (${ext.toUpperCase()})`,
          ext,
          quality: String(a.quality || "Audio"),
          url: a.url,
          proxyUrl: buildProxyUrl(a.url, `${safeTitle}_audio.${ext}`, true),
          type: "audio",
        });
      }

      if (formats.length > 0) {
        return {
          engine: "vps-piped",
          platform: "youtube",
          title: String(data.title),
          uploader: String(data.uploader || "YouTube"),
          duration: Number(data.duration || 0),
          thumbnail: String(data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
          formats,
        };
      }
    } catch {
      // try next
    }
  }
  return null;
}

async function tryInstagramEmbed(targetUrl: string) {
  const m = targetUrl.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  const shortcode = m[2];
  try {
    const res = await fetch(`https://www.instagram.com/${kind}/${shortcode}/embed/captioned/`, {
      signal: AbortSignal.timeout(9000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const videoMatch = html.match(/"video_url":"(https:\\\/\\\/[^"]+)"/);
    const imgMatch =
      html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/) ||
      html.match(/"display_url":"(https:\\\/\\\/[^"]+)"/);
    const userMatch = html.match(/"username":"([^"]+)"/);

    const formats: MediaFormatItem[] = [];
    if (videoMatch?.[1]) {
      const vUrl = videoMatch[1].replace(/\\\//g, "/").replace(/\\u0026/g, "&");
      formats.push({
        label: "Instagram Video (MP4)",
        ext: "mp4",
        quality: "HD",
        url: vUrl,
        proxyUrl: buildProxyUrl(vUrl, `instagram_${shortcode}.mp4`, true),
        type: "video",
      });
    }
    if (imgMatch?.[1]) {
      const iUrl = imgMatch[1]
        .replace(/\\\//g, "/")
        .replace(/\\u0026/g, "&")
        .replace(/&amp;/g, "&");
      formats.push({
        label: "Instagram Foto / Cover (JPG)",
        ext: "jpg",
        quality: "HD",
        url: iUrl,
        proxyUrl: buildProxyUrl(iUrl, `instagram_${shortcode}.jpg`, true),
        type: "image",
      });
    }
    if (formats.length > 0) {
      return {
        engine: "vps-ig-embed",
        platform: "instagram",
        title: `Instagram Post ${shortcode}`,
        uploader: userMatch?.[1] ? `@${userMatch[1]}` : "Instagram",
        duration: 0,
        thumbnail: formats.find((f) => f.type === "image")?.proxyUrl || "",
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = String(body?.url || "").trim();
    const platformHint = String(body?.platform || "auto").toLowerCase();

    if (body?.xvip === true || platformHint === "all") {
      const { error } = await requireXvipUser();
      if (error) return error;
    }

    if (!rawUrl) {
      return NextResponse.json({ ok: false, error: "URL media wajib diisi." }, { status: 400 });
    }

    const parsedUrl = await assertPublicHttpUrl(rawUrl);
    const ytId = extractYouTubeId(parsedUrl.toString());

    // 1. Try VPS yt-dlp first (handles TikTok, IG, YT with cookies, X, Facebook, Reddit, etc.)
    try {
      const info = await runYtDlp(parsedUrl.toString());
      const safeTitle = String(info.title || "media")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 48);

      const rawFormats: Array<{
        url?: string;
        ext?: string;
        vcodec?: string;
        acodec?: string;
        height?: number;
        format_note?: string;
        filesize?: number;
        protocol?: string;
      }> = Array.isArray(info.formats) ? info.formats : [];

      const formats: MediaFormatItem[] = [];
      const directMuxed = rawFormats
        .filter(
          (f) =>
            f.url &&
            /^https?:\/\//i.test(f.url) &&
            f.vcodec &&
            f.vcodec !== "none" &&
            f.acodec &&
            f.acodec !== "none" &&
            !String(f.protocol || "").includes("m3u8")
        )
        .sort((a, b) => (b.height || 0) - (a.height || 0));

      for (const f of directMuxed.slice(0, 4)) {
        const ext = f.ext || "mp4";
        const q = f.height ? `${f.height}p` : f.format_note || "HD";
        formats.push({
          label: `Video ${q} (${ext.toUpperCase()})`,
          ext,
          quality: q,
          url: f.url!,
          proxyUrl: buildProxyUrl(f.url!, `${safeTitle}_${q}.${ext}`, true),
          type: "video",
          filesize: f.filesize,
        });
      }

      if (formats.length === 0 && info.url && /^https?:\/\//i.test(info.url)) {
        const ext = info.ext || "mp4";
        formats.push({
          label: `Media (${ext.toUpperCase()})`,
          ext,
          quality: info.height ? `${info.height}p` : "HD",
          url: info.url,
          proxyUrl: buildProxyUrl(info.url, `${safeTitle}.${ext}`, true),
          type: ["jpg", "jpeg", "png", "webp"].includes(ext) ? "image" : "video",
        });
      }

      const audioOnly = rawFormats
        .filter(
          (f) =>
            f.url &&
            /^https?:\/\//i.test(f.url) &&
            (!f.vcodec || f.vcodec === "none") &&
            f.acodec &&
            f.acodec !== "none" &&
            !String(f.protocol || "").includes("m3u8")
        )
        .slice(0, 2);

      for (const a of audioOnly) {
        const ext = a.ext || "m4a";
        formats.push({
          label: `Audio (${ext.toUpperCase()})`,
          ext,
          quality: a.format_note || "Audio",
          url: a.url!,
          proxyUrl: buildProxyUrl(a.url!, `${safeTitle}_audio.${ext}`, true),
          type: "audio",
          filesize: a.filesize,
        });
      }

      if (formats.length > 0) {
        const previewStream =
          formats.find((f) => f.type === "video") || formats[0];
        return NextResponse.json({
          ok: true,
          engine: "vps-yt-dlp",
          platform: String(info.extractor_key || platformHint).toLowerCase(),
          title: String(info.title || "Media Unduhan"),
          uploader: String(info.uploader || info.channel || info.creator || "-"),
          duration: Number(info.duration || 0),
          thumbnail: info.thumbnail
            ? buildProxyUrl(String(info.thumbnail), `${safeTitle}_thumb.jpg`, false)
            : "",
          previewUrl: buildProxyUrl(previewStream.url, `${safeTitle}.${previewStream.ext}`, false),
          formats,
        });
      }
    } catch {
      // Fallback below depending on platform
    }

    // 2. YouTube fallback via Piped API + oEmbed
    if (ytId) {
      const piped = await tryPipedYouTube(ytId);
      if (piped) {
        const firstVid = piped.formats.find((f) => f.type === "video") || piped.formats[0];
        return NextResponse.json({
          ok: true,
          ...piped,
          previewUrl: firstVid ? buildProxyUrl(firstVid.url, `yt_${ytId}.${firstVid.ext}`, false) : "",
        });
      }
      // Last-resort YouTube oEmbed + HD thumbnail
      try {
        const oeRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(parsedUrl.toString())}&format=json`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (oeRes.ok) {
          const oe = await oeRes.json();
          const thumb = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;
          return NextResponse.json({
            ok: true,
            engine: "vps-yt-oembed",
            platform: "youtube",
            title: String(oe.title || "YouTube Video"),
            uploader: String(oe.author_name || "YouTube"),
            duration: 0,
            thumbnail: thumb,
            note: "Stream YouTube dibatasi anti-bot dari IP VPS. Owner dapat memasang yt-dlp cookies.txt di /owner untuk unduhan penuh 1080p.",
            formats: [
              {
                label: "Thumbnail HD (JPG)",
                ext: "jpg",
                quality: "HD",
                url: thumb,
                proxyUrl: buildProxyUrl(thumb, `yt_${ytId}_thumb.jpg`, true),
                type: "image",
              },
            ],
          });
        }
      } catch {
        // ignore
      }
    }

    // 3. Instagram embed fallback
    if (/instagram\.com/i.test(parsedUrl.hostname)) {
      const ig = await tryInstagramEmbed(parsedUrl.toString());
      if (ig) {
        const first = ig.formats[0];
        return NextResponse.json({
          ok: true,
          ...ig,
          previewUrl: first ? buildProxyUrl(first.url, `ig.${first.ext}`, false) : "",
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Media tidak dapat diekstrak dari tautan tersebut (akun privat atau butuh cookies). Pastikan tautan publik atau tambahkan yt-dlp cookies di /owner.",
      },
      { status: 422 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses downloader di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
