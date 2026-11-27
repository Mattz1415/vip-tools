import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { requireXvipUser } from "@/lib/server/auth";
import { sanitizePublicError } from "@/lib/server/net-guard";

const execFileAsync = promisify(execFile);

const MAX_IMAGE_DATA_URL_LEN = 8 * 1024 * 1024;
const DEFAULT_BASE_URL = "http://127.0.0.1:20128";
const DEFAULT_MODEL = "ag/gemini-3.8-flash";
const LOCAL_ROUTER_DB = "/root/.9router/db/data.sqlite";

let cachedRouterKey: string | null = null;

async function resolveNineRouterApiKey(): Promise<string> {
  const envKey = (process.env.NINEROUTER_API_KEY || process.env.AI_ROUTER_API_KEY || "").trim();
  if (envKey) return envKey;
  if (cachedRouterKey) return cachedRouterKey;
  if (!fs.existsSync(LOCAL_ROUTER_DB)) return "";

  try {
    const { stdout } = await execFileAsync(
      "python3",
      [
        "-c",
        'import sqlite3,sys; conn=sqlite3.connect(sys.argv[1]); cur=conn.cursor(); cur.execute("SELECT key FROM apiKeys WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 1"); row=cur.fetchone(); print(row[0] if row and row[0] else "")',
        LOCAL_ROUTER_DB,
      ],
      { timeout: 4000 }
    );
    const key = String(stdout || "").trim();
    if (key) cachedRouterKey = key;
    return key;
  } catch {
    return "";
  }
}

function buildSystemPrompt(mode: string): string {
  if (mode === "ringkas") {
    return "Kamu adalah asisten pemecah soal dan analisis foto. Jawab langsung ke inti dalam Bahasa Indonesia yang singkat, tepat, dan mudah dibaca tanpa basa-basi.";
  }
  if (mode === "langkah") {
    return "Kamu adalah asisten pemecah soal dan analisis foto. Jelaskan jawaban dalam Bahasa Indonesia secara runtut langkah demi langkah, sertakan rumus/alasan bila perlu, dan tutup dengan jawaban akhir yang jelas.";
  }
  return "Kamu adalah asisten pemecah soal dan analisis foto. Baca gambar dengan teliti, lalu berikan jawaban yang akurat, rapi, dan jelas dalam Bahasa Indonesia tanpa basa-basi.";
}

export async function POST(req: Request) {
  const { error } = await requireXvipUser();
  if (error) return error;

  let body: { imageDataUrl?: unknown; question?: unknown; mode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Format payload JSON tidak valid." }, { status: 400 });
  }

  const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl.trim() : "";
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(imageDataUrl)) {
    return NextResponse.json(
      { ok: false, error: "Unggah gambar berformat PNG, JPG, WEBP, atau GIF terlebih dahulu." },
      { status: 400 }
    );
  }
  if (imageDataUrl.length > MAX_IMAGE_DATA_URL_LEN) {
    return NextResponse.json(
      { ok: false, error: "Ukuran gambar terlalu besar. Gunakan gambar di bawah 5 MB." },
      { status: 413 }
    );
  }

  const rawQuestion = typeof body.question === "string" ? body.question.trim().slice(0, 1000) : "";
  const mode = body.mode === "ringkas" || body.mode === "langkah" ? body.mode : "lengkap";
  const userPrompt =
    rawQuestion ||
    "Baca dan analisis seluruh isi foto ini, lalu berikan jawaban yang paling tepat dan jelas.";

  const apiKey = await resolveNineRouterApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Konfigurasi API key penyedia AI belum tersedia." },
      { status: 503 }
    );
  }

  const baseUrl = (process.env.NINEROUTER_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = (process.env.NINEROUTER_MODEL || DEFAULT_MODEL).trim();

  try {
    const upstream = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.2,
        max_tokens: 2048,
        messages: [
          { role: "system", content: buildSystemPrompt(mode) },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });

    const rawText = await upstream.text();
    let parsed: {
      choices?: Array<{ message?: { content?: unknown } }>;
      model?: string;
      error?: { message?: string };
    } | null = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    if (!upstream.ok || !parsed) {
      return NextResponse.json(
        {
          ok: false,
          error: sanitizePublicError(
            parsed?.error?.message || "Layanan AI sedang sibuk atau gagal memproses gambar.",
            "Gagal memproses gambar dengan layanan AI."
          ),
        },
        { status: upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502 }
      );
    }

    const content = parsed.choices?.[0]?.message?.content;
    const answer = typeof content === "string" ? content.trim() : "";
    if (!answer) {
      return NextResponse.json(
        { ok: false, error: "AI tidak mengembalikan jawaban untuk gambar ini." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      answer,
      provider: "9router",
      model: "gemini-3.8-flash",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: sanitizePublicError(err, "Koneksi ke layanan AI gagal.") },
      { status: 502 }
    );
  }
}
