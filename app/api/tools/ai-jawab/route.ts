import { NextResponse } from "next/server";
import { extractAssistantText, resolveEffectiveAiConfig } from "@/lib/server/ai-config";
import { requireXvipUser } from "@/lib/server/auth";
import { sanitizePublicError } from "@/lib/server/net-guard";
import { readStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

const MAX_IMAGE_DATA_URL_LEN = 8 * 1024 * 1024;

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

  const store = readStore();
  const { baseUrl, model, apiKey } = await resolveEffectiveAiConfig(store);
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Konfigurasi API key penyedia AI belum tersedia. Simpan API key di /owner -> Pengaturan atau set NINEROUTER_API_KEY di environment server.",
      },
      { status: 503 }
    );
  }

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

    if (upstream.status === 401 || upstream.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "API key penyedia AI ditolak (401/403). Periksa dan uji ulang API key di /owner -> Pengaturan.",
        },
        { status: 502 }
      );
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

    const answer = extractAssistantText(parsed.choices?.[0]?.message?.content);
    if (!answer) {
      return NextResponse.json(
        { ok: false, error: "AI tidak mengembalikan jawaban untuk gambar ini." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        answer,
        provider: "9router",
        model: (parsed.model || model).replace(/^ag\//, ""),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: sanitizePublicError(err, "Koneksi ke layanan AI gagal.") },
      { status: 502 }
    );
  }
}
