import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { sanitizePublicError } from "@/lib/server/net-guard";
import {
  extractYouTubeVideoId,
  fetchYouTubeVideoMeta,
  isValidYouTubeId,
  normalizeAudioBitrate,
  normalizeVideoHeight,
  resolveYouTubeMedia,
  searchYouTubeVideos,
  type YouTubeVideoMeta,
  type YtMediaFormat,
} from "@/lib/server/yt-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildVideoPayload(meta: YouTubeVideoMeta) {
  const id = meta.videoId;
  const mp3Qualities = [
    { kbps: 320, label: "MP3 320 kbps (Hi-Res)" },
    { kbps: 256, label: "MP3 256 kbps (Tinggi)" },
    { kbps: 128, label: "MP3 128 kbps (Standar)" },
    { kbps: 96, label: "MP3 96 kbps (Hemat)" },
  ].map((q) => ({
    quality: `${q.kbps}kbps`,
    kbps: q.kbps,
    label: q.label,
    ext: "mp3",
    streamUrl: `/api/tools/yt-media?v=${encodeURIComponent(id)}&format=mp3&quality=${q.kbps}&mode=stream`,
    downloadUrl: `/api/tools/yt-media?v=${encodeURIComponent(id)}&format=mp3&quality=${q.kbps}&mode=download`,
  }));

  const mp4Qualities = [
    { height: 1080, label: "Video 1080p Full HD (MP4)" },
    { height: 720, label: "Video 720p HD (MP4)" },
    { height: 480, label: "Video 480p SD (MP4)" },
    { height: 360, label: "Video 360p Hemat (MP4)" },
  ].map((q) => ({
    quality: `${q.height}p`,
    height: q.height,
    label: q.label,
    ext: "mp4",
    streamUrl: `/api/tools/yt-media?v=${encodeURIComponent(id)}&format=mp4&quality=${q.height}&mode=stream`,
    downloadUrl: `/api/tools/yt-media?v=${encodeURIComponent(id)}&format=mp4&quality=${q.height}&mode=download`,
  }));

  return {
    ...meta,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    mp3Qualities,
    mp4Qualities,
  };
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await req.json();
    const rawInput = String(body?.input || body?.url || body?.query || "").trim();
    if (!rawInput || rawInput.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Masukkan tautan YouTube atau kata kunci pencarian video (min. 2 karakter)." },
        { status: 400 }
      );
    }
    if (rawInput.length > 300) {
      return NextResponse.json(
        { ok: false, error: "Input terlalu panjang (maksimal 300 karakter)." },
        { status: 400 }
      );
    }

    const directId = extractYouTubeVideoId(rawInput, true);
    if (directId) {
      const meta = await fetchYouTubeVideoMeta(directId);
      return NextResponse.json(
        {
          ok: true,
          mode: "video",
          engine: "yt-provider",
          video: buildVideoPayload(meta),
          latencyMs: Date.now() - startedAt,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (/^https?:\/\//i.test(rawInput)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Tautan tidak dikenali sebagai link YouTube. Gunakan youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/..., atau ketik judul video.",
        },
        { status: 400 }
      );
    }

    const videos = await searchYouTubeVideos(rawInput, 8);
    return NextResponse.json(
      {
        ok: true,
        mode: "search",
        engine: "yt-provider",
        query: rawInput,
        videos: videos.map(buildVideoPayload),
        latencyMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const msg = sanitizePublicError(err, "Gagal memproses permintaan YouTube.");
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const videoId = (req.nextUrl.searchParams.get("v") || "").trim();
    const rawFormat = (req.nextUrl.searchParams.get("format") || "mp3").toLowerCase();
    const rawQuality = req.nextUrl.searchParams.get("quality") || "";
    const mode = (req.nextUrl.searchParams.get("mode") || "download").toLowerCase();

    if (!isValidYouTubeId(videoId)) {
      return NextResponse.json(
        { ok: false, error: "ID video YouTube tidak valid." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const format: YtMediaFormat = rawFormat === "mp4" ? "mp4" : "mp3";
    const quality =
      format === "mp3"
        ? normalizeAudioBitrate(rawQuality || "128")
        : normalizeVideoHeight(rawQuality || "720");

    const entry = await resolveYouTubeMedia({
      videoId,
      format,
      quality,
    });

    const totalLength = entry.sizeBytes;
    const isDownload = mode === "download";

    const headers = new Headers();
    headers.set("Content-Type", entry.contentType);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=300");
    headers.set("X-Video-Id", videoId);
    headers.set("X-Media-Quality", entry.qualityLabel);
    headers.set(
      "Content-Disposition",
      isDownload
        ? `attachment; filename="${entry.filename}"`
        : `inline; filename="${entry.filename}"`
    );

    const rangeHeader = req.headers.get("range");
    if (!isDownload && rangeHeader && rangeHeader.startsWith("bytes=")) {
      const [rawStart, rawEnd] = rangeHeader.replace(/^bytes=/, "").split("-");
      const start = rawStart ? Number.parseInt(rawStart, 10) : 0;
      const end = rawEnd
        ? Math.min(totalLength - 1, Number.parseInt(rawEnd, 10))
        : totalLength - 1;

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

      const chunkLen = end - start + 1;
      headers.set("Content-Range", `bytes ${start}-${end}/${totalLength}`);
      headers.set("Content-Length", String(chunkLen));
      const webStream = Readable.toWeb(
        createReadStream(entry.filePath, { start, end })
      ) as ReadableStream;
      return new NextResponse(webStream, { status: 206, headers });
    }

    headers.set("Content-Length", String(totalLength));
    const webStream = Readable.toWeb(createReadStream(entry.filePath)) as ReadableStream;
    return new NextResponse(webStream, { status: 200, headers });
  } catch (err) {
    const msg = sanitizePublicError(err, "Gagal mengunduh media YouTube.");
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
