import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { requireXvipUser } from "@/lib/server/auth";
import { assertPublicHttpUrl, safeFetchPublic, sanitizePublicError } from "@/lib/server/net-guard";
import { getYtCookiesPath, hasYtCookies } from "@/lib/server/store";
import { extractYouTubeVideoId, fetchYouTubeVideoMeta } from "@/lib/server/yt-provider";

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
  args.push("--", targetUrl);

  const { stdout } = await execFileAsync("/usr/local/bin/yt-dlp", args, {
    timeout: 22000,
    maxBuffer: 12 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

async function resolveYouTubeFromProvider(videoId: string) {
  const meta = await fetchYouTubeVideoMeta(videoId);
  const encId = encodeURIComponent(videoId);
  const safeTitle = String(meta.title || `yt_${videoId}`)
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 48);

  const formats: MediaFormatItem[] = [
    {
      label: "Video 1080p Full HD (MP4)",
      ext: "mp4",
      quality: "1080p",
      url: `/api/tools/yt-media?v=${encId}&format=mp4&quality=1080&mode=download`,
      proxyUrl: `/api/tools/yt-media?v=${encId}&format=mp4&quality=1080&mode=download`,
      type: "video",
    },
    {
      label: "Video 720p HD (MP4)",
      ext: "mp4",
      quality: "720p",
      url: `/api/tools/yt-media?v=${encId}&format=mp4&quality=720&mode=download`,
      proxyUrl: `/api/tools/yt-media?v=${encId}&format=mp4&quality=720&mode=download`,
      type: "video",
    },
    {
      label: "Video 480p SD (MP4)",
      ext: "mp4",
      quality: "480p",
      url: `/api/tools/yt-media?v=${encId}&format=mp4&quality=480&mode=download`,
      proxyUrl: `/api/tools/yt-media?v=${encId}&format=mp4&quality=480&mode=download`,
      type: "video",
    },
    {
      label: "Video 360p Hemat (MP4)",
      ext: "mp4",
      quality: "360p",
      url: `/api/tools/yt-media?v=${encId}&format=mp4&quality=360&mode=download`,
      proxyUrl: `/api/tools/yt-media?v=${encId}&format=mp4&quality=360&mode=download`,
      type: "video",
    },
    {
      label: "Audio MP3 320 kbps (Hi-Res)",
      ext: "mp3",
      quality: "320kbps",
      url: `/api/tools/yt-media?v=${encId}&format=mp3&quality=320&mode=download`,
      proxyUrl: `/api/tools/yt-media?v=${encId}&format=mp3&quality=320&mode=download`,
      type: "audio",
    },
    {
      label: "Audio MP3 128 kbps (Cepat)",
      ext: "mp3",
      quality: "128kbps",
      url: `/api/tools/yt-media?v=${encId}&format=mp3&quality=128&mode=download`,
      proxyUrl: `/api/tools/yt-media?v=${encId}&format=mp3&quality=128&mode=download`,
      type: "audio",
    },
    {
      label: "Thumbnail HD (JPG)",
      ext: "jpg",
      quality: "HD",
      url: meta.thumbnailHd,
      proxyUrl: buildProxyUrl(meta.thumbnailHd, `${safeTitle}_thumb.jpg`, true),
      type: "image",
    },
  ];

  return {
    ok: true,
    engine: "yt-provider",
    platform: "youtube",
    videoId,
    title: meta.title,
    uploader: meta.uploader,
    duration: meta.durationSec,
    thumbnail: meta.thumbnail,
    previewUrl: `/api/tools/yt-media?v=${encId}&format=mp4&quality=360&mode=stream`,
    note: "Server menyediakan konversi langsung MP4 & MP3. Klik format di bawah untuk mengunduh atau tekan Putar pada pratinjau video.",
    formats,
  };
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
        engine: "media-stream",
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

    const normalizedUrl = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(
      rawUrl
    )
      ? `https://${rawUrl}`
      : rawUrl;
    const parsedUrl = await assertPublicHttpUrl(normalizedUrl);
    const ytId = extractYouTubeVideoId(parsedUrl.toString());

    // 1. YouTube direct provider (self-hosted MP4 1080p/720p/480p/360p + MP3 320/128 kbps via /api/tools/yt-media)
    if (ytId) {
      const ytPayload = await resolveYouTubeFromProvider(ytId);
      return NextResponse.json(ytPayload, { headers: { "Cache-Control": "no-store" } });
    }

    // 2. Try VPS yt-dlp for other platforms (TikTok, IG, X, Facebook, Reddit, Pinterest, etc.)
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
          engine: "media-stream",
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

    // 4. X / Twitter fxtwitter API fallback
    if (/(?:twitter\.com|x\.com)/i.test(parsedUrl.hostname)) {
      const m = parsedUrl.pathname.match(/\/([^/]+)\/status\/(\d+)/);
      if (m) {
        try {
          const fxRes = await fetch(`https://api.fxtwitter.com/${encodeURIComponent(m[1])}/status/${m[2]}`, {
            headers: { "User-Agent": "MattzLM-Web/2.0" },
            signal: AbortSignal.timeout(8000),
          });
          if (fxRes.ok) {
            const fx = await fxRes.json();
            const tw = fx?.tweet;
            const mediaAll: Array<{ type?: string; url?: string; thumbnail_url?: string }> = [
              ...(tw?.media?.videos || []),
              ...(tw?.media?.photos || []),
            ];
            const formats: MediaFormatItem[] = [];
            mediaAll.forEach((item, idx) => {
              if (!item?.url) return;
              const isVid = item.type === "video" || /\.mp4/i.test(item.url);
              const ext = isVid ? "mp4" : "jpg";
              formats.push({
                label: isVid ? `Video X #${idx + 1} (MP4)` : `Foto X #${idx + 1} (JPG)`,
                ext,
                quality: "HD",
                url: item.url,
                proxyUrl: buildProxyUrl(item.url, `x_${m[2]}_${idx + 1}.${ext}`, true),
                type: isVid ? "video" : "image",
              });
            });
            if (formats.length > 0) {
              const first = formats[0];
              return NextResponse.json({
                ok: true,
                engine: "media-stream",
                platform: "x",
                title: String(tw?.text || `Post X @${m[1]}`).slice(0, 100),
                uploader: `@${tw?.author?.screen_name || m[1]}`,
                duration: 0,
                thumbnail: tw?.media?.videos?.[0]?.thumbnail_url
                  ? buildProxyUrl(tw.media.videos[0].thumbnail_url, `x_${m[2]}_thumb.jpg`, false)
                  : first.type === "image"
                    ? buildProxyUrl(first.url, `x_${m[2]}_thumb.jpg`, false)
                    : "",
                previewUrl: buildProxyUrl(first.url, `x_${m[2]}.${first.ext}`, false),
                formats,
              });
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // 5. Pinterest / Threads / Facebook OpenGraph media fallback
    if (/(?:pinterest\.|pin\.it|threads\.|facebook\.com|fb\.watch)/i.test(parsedUrl.hostname)) {
      try {
        const { response: pageRes } = await safeFetchPublic(parsedUrl.toString(), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(9000),
        });
        if (pageRes.ok) {
          const html = (await pageRes.text()).slice(0, 260_000);
          const ogVid =
            html.match(/<meta[^>]+property=["']og:video(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/"(https:\/\/v1\.pinimg\.com\/videos\/[^"]+\.mp4)"/i)?.[1];
          const ogImg =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/"(https:\/\/i\.pinimg\.com\/originals\/[^"]+)"/i)?.[1];
          const ogTitle =
            html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
            "Media Publik";
          const formats: MediaFormatItem[] = [];
          if (ogVid && /^https?:\/\//i.test(ogVid)) {
            const clean = ogVid.replace(/&amp;/g, "&");
            formats.push({
              label: "Video HD (MP4)",
              ext: "mp4",
              quality: "HD",
              url: clean,
              proxyUrl: buildProxyUrl(clean, `media_${Date.now()}.mp4`, true),
              type: "video",
            });
          }
          if (ogImg && /^https?:\/\//i.test(ogImg)) {
            const clean = ogImg.replace(/&amp;/g, "&");
            formats.push({
              label: "Gambar HD (JPG)",
              ext: "jpg",
              quality: "HD",
              url: clean,
              proxyUrl: buildProxyUrl(clean, `media_${Date.now()}.jpg`, true),
              type: "image",
            });
          }
          if (formats.length > 0) {
            const first = formats[0];
            return NextResponse.json({
              ok: true,
              engine: "media-extractor",
              platform: platformHint,
              title: ogTitle.slice(0, 100),
              uploader: parsedUrl.hostname,
              duration: 0,
              thumbnail: ogImg ? buildProxyUrl(ogImg.replace(/&amp;/g, "&"), "thumb.jpg", false) : "",
              previewUrl: buildProxyUrl(first.url, `preview.${first.ext}`, false),
              formats,
            });
          }
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Media tidak dapat diekstrak dari tautan tersebut (akun privat atau dibatasi oleh platform sumber). Pastikan tautan bersifat publik.",
      },
      { status: 422 }
    );
  } catch (err) {
    const msg = sanitizePublicError(err, "Gagal memproses unduhan media.");
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
