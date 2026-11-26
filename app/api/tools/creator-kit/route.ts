import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// ===== EMVCo QRIS CRC16-CCITT (Poly 0x1021, Init 0xFFFF) =====
function crc16Ccitt(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function parseEmvTlv(raw: string): Array<{ tag: string; value: string }> {
  const tags: Array<{ tag: string; value: string }> = [];
  let i = 0;
  while (i + 4 <= raw.length) {
    const tag = raw.slice(i, i + 2);
    const len = Number.parseInt(raw.slice(i + 2, i + 4), 10);
    if (!Number.isFinite(len) || len < 0 || i + 4 + len > raw.length) {
      throw new Error("Format string QRIS tidak valid (TLV rusak).");
    }
    const value = raw.slice(i + 4, i + 4 + len);
    tags.push({ tag, value });
    i += 4 + len;
  }
  return tags;
}

function buildDynamicQris(staticPayload: string, amount: number, feeType: string, feeValue: number) {
  const clean = staticPayload.trim();
  if (!clean.startsWith("000201") || !clean.includes("5802ID")) {
    throw new Error("Data bukan string QRIS Indonesia standar (harus diawali 000201 dan berisi 5802ID).");
  }
  const tags = parseEmvTlv(clean).filter((t) => t.tag !== "63" && t.tag !== "54" && t.tag !== "55" && t.tag !== "56" && t.tag !== "57");
  const merchantName = tags.find((t) => t.tag === "59")?.value || "MERCHANT QRIS";
  const merchantCity = tags.find((t) => t.tag === "60")?.value || "INDONESIA";

  const outTags: Array<{ tag: string; value: string }> = [];
  let insertedAmount = false;
  const amountStr = String(Math.round(amount));

  for (const t of tags) {
    if (t.tag === "01") {
      outTags.push({ tag: "01", value: "12" }); // 12 = Dynamic QRIS
      continue;
    }
    if (t.tag === "58" && !insertedAmount) {
      outTags.push({ tag: "54", value: amountStr });
      if (feeType === "fixed" && feeValue > 0) {
        outTags.push({ tag: "55", value: "02" });
        outTags.push({ tag: "56", value: String(Math.round(feeValue)) });
      } else if (feeType === "percent" && feeValue > 0) {
        outTags.push({ tag: "55", value: "03" });
        outTags.push({ tag: "57", value: feeValue.toFixed(2).replace(/\.00$/, "") });
      }
      insertedAmount = true;
    }
    outTags.push(t);
  }
  if (!insertedAmount) {
    outTags.push({ tag: "54", value: amountStr });
  }

  const body = outTags
    .map((t) => `${t.tag}${String(t.value.length).padStart(2, "0")}${t.value}`)
    .join("");
  const withCrcPrefix = `${body}6304`;
  const crc = crc16Ccitt(withCrcPrefix);
  return {
    qrisString: `${withCrcPrefix}${crc}`,
    crc,
    merchantName,
    merchantCity,
  };
}

// ===== FANCY UNICODE FONT MAPS =====
function mapAlpha(text: string, upperStart: number, lowerStart: number, digitStart?: number): string {
  return [...text]
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(upperStart + (c - 65));
      if (c >= 97 && c <= 122) return String.fromCodePoint(lowerStart + (c - 97));
      if (digitStart !== undefined && c >= 48 && c <= 57) return String.fromCodePoint(digitStart + (c - 48));
      return ch;
    })
    .join("");
}

const SMALL_CAPS_MAP: Record<string, string> = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ",
  n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
};

function generateFancyFonts(input: string) {
  const s = input.trim().slice(0, 80);
  return [
    { label: "Bold Sans", value: mapAlpha(s, 0x1d5d4, 0x1d5ee, 0x1d7ec) },
    { label: "Italic Sans", value: mapAlpha(s, 0x1d608, 0x1d622) },
    { label: "Bold Italic", value: mapAlpha(s, 0x1d63c, 0x1d656) },
    { label: "Bold Serif", value: mapAlpha(s, 0x1d400, 0x1d41a, 0x1d7ce) },
    { label: "Script Aesthetic", value: mapAlpha(s, 0x1d4d0, 0x1d4ea) },
    { label: "Gothic / Fraktur", value: mapAlpha(s, 0x1d56c, 0x1d586) },
    { label: "Monospace", value: mapAlpha(s, 0x1d670, 0x1d68a, 0x1d7f6) },
    { label: "Double Struck", value: mapAlpha(s, 0x1d538, 0x1d552, 0x1d7d8) },
    {
      label: "Small Caps Bio",
      value: [...s].map((c) => SMALL_CAPS_MAP[c.toLowerCase()] || c).join(""),
    },
    {
      label: "Fullwidth Vapor",
      value: [...s]
        .map((c) => {
          const code = c.charCodeAt(0);
          return code >= 33 && code <= 126 ? String.fromCodePoint(code + 0xfee0) : c;
        })
        .join(""),
    },
    {
      label: "Bubble Circle",
      value: [...s]
        .map((c) => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x24b6 + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x24d0 + (code - 97));
          return c;
        })
        .join(""),
    },
    { label: "Spaced Aesthetic", value: [...s].join(" ") },
    { label: "Bracket Minimal", value: `『 ${s} 』` },
    { label: "Wing Frame", value: `꧁ ${s} ꧂` },
    { label: "Katakana Frame", value: `ツ ${s} ツ` },
  ];
}

function generateGameNicks(base: string, style: string) {
  const clean = base.trim().slice(0, 18) || "Mattz";
  const bold = mapAlpha(clean, 0x1d5d4, 0x1d5ee, 0x1d7ec);
  const sc = [...clean].map((c) => SMALL_CAPS_MAP[c.toLowerCase()] || c).join("");
  const gothic = mapAlpha(clean, 0x1d56c, 0x1d586);
  const prefix = style === "ff" ? "FF" : style === "ml" ? "ML" : style === "val" ? "VLR" : "PRO";

  return [
    `『${prefix}』${bold}ツ`,
    `꧁༺${clean}༻꧂`,
    `亗 ${bold} 亗`,
    `×͜× ${sc} ࿐`,
    `⚡${clean}・ID`.replace("⚡", "メ"),
    `メ ${clean} 乡`,
    `々${bold}々`,
    `❖ ${sc} ❖`,
    `『${clean}』• 01`,
    `ᴿᶻ・${sc}`,
    `父 ${gothic} 父`,
    `°•${clean}•°`,
    `[ ${bold} ]`,
    `ム ${clean} ム`,
    `ぁ ${sc} ぁ`,
    `★彡 ${clean} 彡★`.replace(/★/g, "✦"),
    `░ ${bold} ░`,
    `✿ ${sc} ✿`,
    `么 ${clean} 么`,
    `彡${clean}彡`,
  ];
}

function extractYoutubeId(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "").slice(0, 11) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v")!.slice(0, 11);
    const m = u.pathname.match(/\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlStr.trim())) return urlStr.trim();
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "").toLowerCase();

    // ===== 1. TEXT TO SPEECH (REAL MP3 AUDIO VIA VPS) =====
    if (action === "tts") {
      const text = String(body?.text || "").trim();
      const lang = String(body?.lang || "id").toLowerCase().replace(/[^a-z-]/g, "") || "id";
      if (!text) return NextResponse.json({ ok: false, error: "Teks wajib diisi." }, { status: 400 });
      if (text.length > 480) {
        return NextResponse.json({ ok: false, error: "Maksimal 480 karakter per audio TTS." }, { status: 400 });
      }

      // Split safely into <=180 char chunks so Google TTS returns clean audio for longer sentences
      const chunks: string[] = [];
      let remaining = text;
      while (remaining.length > 0) {
        if (remaining.length <= 180) {
          chunks.push(remaining);
          break;
        }
        let cut = remaining.lastIndexOf(" ", 180);
        if (cut < 40) cut = 180;
        chunks.push(remaining.slice(0, cut).trim());
        remaining = remaining.slice(cut).trim();
      }

      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            Referer: "https://translate.google.com/",
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`Layanan TTS mengembalikan HTTP ${res.status}.`);
        audioBuffers.push(Buffer.from(await res.arrayBuffer()));
      }

      const merged = Buffer.concat(audioBuffers);
      return new NextResponse(new Uint8Array(merged), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "X-Audio-Bytes": String(merged.length),
          "Cache-Control": "no-store",
        },
      });
    }

    // ===== 2. TRANSLATOR MULTI-BAHASA =====
    if (action === "translate") {
      const text = String(body?.text || "").trim();
      const source = String(body?.source || "auto").toLowerCase();
      const target = String(body?.target || "en").toLowerCase();
      if (!text) return NextResponse.json({ ok: false, error: "Teks wajib diisi." }, { status: 400 });
      if (text.length > 4000) return NextResponse.json({ ok: false, error: "Maksimal 4000 karakter." }, { status: 400 });

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!res.ok) throw new Error(`Gagal menerjemahkan (HTTP ${res.status}).`);
      const data = await res.json();
      const translated = Array.isArray(data?.[0])
        ? data[0].map((seg: unknown[]) => String(seg?.[0] || "")).join("")
        : "";
      const detectedLang = String(data?.[2] || source);

      return NextResponse.json({
        ok: true,
        detectedLang,
        target,
        translated,
      });
    }

    // ===== 3. YOUTUBE THUMBNAIL HD & INFO =====
    if (action === "yt_thumb") {
      const input = String(body?.url || "").trim();
      const videoId = extractYoutubeId(input);
      if (!videoId) return NextResponse.json({ ok: false, error: "Link atau ID YouTube tidak valid." }, { status: 400 });

      let title = `YouTube Video (${videoId})`;
      let author = "YouTube";
      try {
        const oe = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (oe.ok) {
          const j = await oe.json();
          if (j.title) title = String(j.title);
          if (j.author_name) author = String(j.author_name);
        }
      } catch {
        // ignore
      }

      const candidates = [
        { key: "maxresdefault", label: "Full HD (1280x720)", width: 1280, height: 720 },
        { key: "sddefault", label: "SD High (640x480)", width: 640, height: 480 },
        { key: "hqdefault", label: "HQ (480x360)", width: 480, height: 360 },
      ];

      const thumbnails = await Promise.all(
        candidates.map(async (c) => {
          const directUrl = `https://i.ytimg.com/vi/${videoId}/${c.key}.jpg`;
          let available = true;
          try {
            const head = await fetch(directUrl, { method: "HEAD", signal: AbortSignal.timeout(4000) });
            available = head.ok;
          } catch {
            available = c.key === "hqdefault";
          }
          return {
            ...c,
            available,
            url: directUrl,
            proxyUrl: `/api/tools/proxy?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(`yt_${videoId}_${c.key}.jpg`)}&download=1`,
            previewUrl: `/api/tools/proxy?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(`yt_${videoId}_${c.key}.jpg`)}`,
          };
        })
      );

      return NextResponse.json({ ok: true, videoId, title, author, thumbnails });
    }

    // ===== 4. WHATSAPP DIRECT LINK & QR CHAT =====
    if (action === "wa_link") {
      let phone = String(body?.phone || "").replace(/[^0-9]/g, "");
      if (phone.startsWith("0")) phone = "62" + phone.slice(1);
      if (phone.length < 8 || phone.length > 16) {
        return NextResponse.json({ ok: false, error: "Nomor WhatsApp tidak valid (contoh: 081234567890)." }, { status: 400 });
      }
      const message = String(body?.message || "").trim().slice(0, 600);
      const waUrl = message
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/${phone}`;
      const [pngDataUrl, svg] = await Promise.all([
        QRCode.toDataURL(waUrl, { width: 420, margin: 2 }),
        QRCode.toString(waUrl, { type: "svg", width: 420, margin: 2 }),
      ]);
      return NextResponse.json({ ok: true, phone, waUrl, pngDataUrl, svg });
    }

    // ===== 5. QRIS NOMINAL DINAMIS (EMVCo CRC16-CCITT) =====
    if (action === "qris_dinamis") {
      const staticQris = String(body?.qris || "").trim();
      const amount = Number(body?.amount || 0);
      const feeType = String(body?.feeType || "none");
      const feeValue = Number(body?.feeValue || 0);
      if (!staticQris) return NextResponse.json({ ok: false, error: "Tempel string QRIS statis terlebih dahulu." }, { status: 400 });
      if (!Number.isFinite(amount) || amount < 1 || amount > 100_000_000) {
        return NextResponse.json({ ok: false, error: "Nominal harus antara Rp 1 sampai Rp 100.000.000." }, { status: 400 });
      }
      const built = buildDynamicQris(staticQris, amount, feeType, feeValue);
      const [pngDataUrl, svg] = await Promise.all([
        QRCode.toDataURL(built.qrisString, { width: 440, margin: 2 }),
        QRCode.toString(built.qrisString, { type: "svg", width: 440, margin: 2 }),
      ]);
      return NextResponse.json({
        ok: true,
        amount: Math.round(amount),
        merchantName: built.merchantName,
        merchantCity: built.merchantCity,
        crc: built.crc,
        qrisString: built.qrisString,
        pngDataUrl,
        svg,
      });
    }

    // ===== 6. FANCY FONT & BIO AESTHETIC =====
    if (action === "fancy_font") {
      const text = String(body?.text || "").trim();
      if (!text) return NextResponse.json({ ok: false, error: "Masukkan teks terlebih dahulu." }, { status: 400 });
      return NextResponse.json({ ok: true, styles: generateFancyFonts(text) });
    }

    // ===== 7. GENERATOR NICKNAME GAME =====
    if (action === "nick_game") {
      const name = String(body?.name || "").trim();
      const style = String(body?.style || "ff").toLowerCase();
      if (!name) return NextResponse.json({ ok: false, error: "Masukkan nama dasar nickname." }, { status: 400 });
      return NextResponse.json({ ok: true, nicknames: generateGameNicks(name, style) });
    }

    // ===== 8. KALKULATOR ENGAGEMENT & PENGHASILAN TIKTOK / IG =====
    if (action === "tiktok_calc") {
      const platform = String(body?.platform || "tiktok").toLowerCase();
      const followers = Math.max(1, Number(body?.followers || 0));
      const avgLikes = Math.max(0, Number(body?.likes || 0));
      const avgComments = Math.max(0, Number(body?.comments || 0));
      const avgShares = Math.max(0, Number(body?.shares || 0));
      const avgViews = Math.max(0, Number(body?.views || followers * 0.4));

      const interactions = avgLikes + avgComments + avgShares;
      const erFollowers = Number(((interactions / followers) * 100).toFixed(2));
      const erViews = avgViews > 0 ? Number(((interactions / avgViews) * 100).toFixed(2)) : 0;

      const tier =
        followers >= 1_000_000
          ? "Mega Creator"
          : followers >= 100_000
            ? "Macro Creator"
            : followers >= 10_000
              ? "Micro Creator"
              : "Nano Creator";

      const quality =
        erFollowers >= 8 ? "Sangat Tinggi (FYP Kuat)" : erFollowers >= 4 ? "Tinggi (Sehat)" : erFollowers >= 1.5 ? "Normal" : "Perlu Optimasi Hook";

      // Estimasi realistis pasar endorse Indonesia (IDR)
      const basePer1k = platform === "instagram" ? 45000 : 32000;
      const mult = erFollowers >= 6 ? 1.5 : erFollowers >= 3 ? 1.15 : 0.85;
      const rateMin = Math.max(150000, Math.round((followers / 1000) * basePer1k * mult * 0.75));
      const rateMax = Math.round(rateMin * 1.9);
      const estMonthlyViews = Math.round(avgViews * 15);
      const estCreatorFundIdr = Math.round((estMonthlyViews / 1000) * 6500);

      return NextResponse.json({
        ok: true,
        platform: platform === "instagram" ? "Instagram" : "TikTok",
        followers,
        erFollowers,
        erViews,
        tier,
        quality,
        rateMinIdr: rateMin,
        rateMaxIdr: rateMax,
        estCreatorFundIdr,
      });
    }

    // ===== 9. GENERATOR CAPTION & HASHTAG FYP =====
    if (action === "caption_hashtag") {
      const niche = String(body?.niche || "daily").toLowerCase();
      const topic = String(body?.topic || "konten hari ini").trim().slice(0, 60);

      const packs: Record<string, { captions: string[]; hashtags: string[] }> = {
        daily: {
          captions: [
            `POV: baru sadar ${topic} ternyata sesimpel ini. Simpan dulu biar nggak lupa!`,
            `Jujur aja, siapa yang relate soal ${topic}? Tulis di kolom komentar ya.`,
            `Update singkat soal ${topic} hari ini. Menurut kalian worth it atau skip?`,
            `Nggak perlu nunggu sempurna buat mulai ${topic}, yang penting jalan dulu.`,
          ],
          hashtags: ["#fyp", "#fypindonesia", "#viralindonesia", "#dailyvlog", "#relatable", "#kontenkreatif", "#trending2026"],
        },
        bisnis: {
          captions: [
            `Banyak yang tanya soal ${topic}, ini versi lengkapnya biar makin paham sebelum checkout.`,
            `Baru restock! Buat yang cari ${topic} kualitas rapi tapi tetap ramah kantong, cek link di bio.`,
            `Di balik layar proses ${topic} hari ini. Terima kasih buat semua yang sudah dukung UMKM lokal!`,
            `Tips cepat memilih ${topic} biar nggak salah beli. Share ke teman yang lagi butuh!`,
          ],
          hashtags: ["#umkmindonesia", "#bisnisonline", "#racuntiktok", "#jualanonline", "#promohariini", "#fypbelanja", "#spillproduk"],
        },
        gaming: {
          captions: [
            `Momen paling tegang pas ${topic}! Kalian pernah ngalamin yang lebih parah nggak?`,
            `Build & trik ${topic} terbaru patch sekarang, auto naik rank tanpa drama.`,
            `Niatnya main santai ${topic}, ujung-ujungnya malah push sampai subuh.`,
            `Rate gameplay ${topic} ini dari 1 sampai 10 di komentar!`,
          ],
          hashtags: ["#gamingindonesia", "#mlbbindonesia", "#freefireid", "#valorantid", "#gamerfyp", "#clipsgaming", "#pushrank"],
        },
        aesthetic: {
          captions: [
            `Pelan-pelan aja soal ${topic}, hal baik selalu datang di waktu yang tepat.`,
            `Menyimpan potongan tenang dari ${topic} hari ini.`,
            `Nggak semua hal soal ${topic} harus dijelaskan, cukup dinikmati prosesnya.`,
            `Catatan kecil hari ini: terima kasih sudah bertahan sampai titik ini.`,
          ],
          hashtags: ["#aestheticid", "#selfreminder", "#quotesindonesia", "#healingtime", "#midnightthoughts", "#storywa", "#fypgalau"],
        },
        kuliner: {
          captions: [
            `Rating jujur ${topic} tanpa endorse! Beneran seenak review orang atau cuma hype?`,
            `Rekomendasi ${topic} yang wajib masuk daftar kulineran akhir pekan ini.`,
            `Warning: jangan tonton video ${topic} ini pas tengah malam, auto lapar!`,
            `Hidden gem ${topic} porsi melimpah harga bersahabat. Save dulu buat nanti!`,
          ],
          hashtags: ["#kulinerindonesia", "#jajanankekinian", "#reviewmakanan", "#foodvlogid", "#hiddengem", "#kulinerviral", "#fypmakanan"],
        },
      };

      const selected = packs[niche] || packs.daily;
      const topicTag =
        "#" +
        topic
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 22);
      const hashtags = topicTag.length > 2 ? [topicTag, ...selected.hashtags] : selected.hashtags;

      return NextResponse.json({
        ok: true,
        niche,
        topic,
        captions: selected.captions,
        hashtags,
        hashtagLine: hashtags.join(" "),
      });
    }

    // ===== 10. KALKULATOR WINRATE MLBB =====
    if (action === "ml_winrate") {
      const totalMatch = Math.max(0, Math.round(Number(body?.totalMatch || 0)));
      const currentWr = Math.min(100, Math.max(0, Number(body?.currentWr || 0)));
      const targetWr = Math.min(99.9, Math.max(1, Number(body?.targetWr || 60)));

      if (totalMatch === 0) {
        return NextResponse.json({ ok: false, error: "Total match harus lebih dari 0." }, { status: 400 });
      }
      const currentWins = Math.round((totalMatch * currentWr) / 100);
      const currentLosses = Math.max(0, totalMatch - currentWins);

      let neededWins = 0;
      let message = "";
      if (targetWr <= currentWr) {
        const loseAllowance = Math.max(0, Math.floor((currentWins * 100) / targetWr - totalMatch));
        message = `Win Rate Anda sudah mencapai target! Anda masih bisa kalah hingga ${loseAllowance} kali sebelum turun di bawah ${targetWr}%.`;
      } else {
        // (currentWins + x) / (totalMatch + x) >= targetWr/100
        neededWins = Math.ceil((targetWr * totalMatch - 100 * currentWins) / (100 - targetWr));
        message = `Anda butuh ${neededWins} kemenangan beruntun (Win Streak) tanpa kalah untuk mencapai Win Rate ${targetWr}%.`;
      }

      const nextWinWr = Number((((currentWins + 1) / (totalMatch + 1)) * 100).toFixed(2));
      const nextLoseWr = Number(((currentWins / (totalMatch + 1)) * 100).toFixed(2));

      return NextResponse.json({
        ok: true,
        totalMatch,
        currentWr,
        targetWr,
        currentWins,
        currentLosses,
        neededWins,
        nextWinWr,
        nextLoseWr,
        message,
      });
    }

    return NextResponse.json({ ok: false, error: `Action '${action}' tidak dikenal.` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses Creator Kit di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
