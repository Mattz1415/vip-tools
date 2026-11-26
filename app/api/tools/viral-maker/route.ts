import { NextRequest, NextResponse } from "next/server";
import sharp, { type OverlayOptions } from "sharp";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function escXml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLines(text: string, maxChars: number, maxLines = 8): string[] {
  const paragraphs = String(text || "").split(/\r?\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (lines.length < maxLines) lines.push("");
      continue;
    }
    let cur = "";
    for (const w of words) {
      if ((cur ? `${cur} ${w}` : w).length <= maxChars) {
        cur = cur ? `${cur} ${w}` : w;
      } else {
        if (cur) lines.push(cur);
        cur = w.length > maxChars ? w.slice(0, maxChars) : w;
      }
      if (lines.length >= maxLines) break;
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    if (lines.length >= maxLines) break;
  }
  return lines.slice(0, maxLines);
}

async function readUploadedFile(form: FormData, key = "file"): Promise<Buffer | null> {
  const f = form.get(key);
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > MAX_FILE_BYTES) throw new Error("Ukuran gambar maksimal 10MB.");
  return Buffer.from(await f.arrayBuffer());
}

async function handleJsonActions(body: Record<string, unknown>) {
  const action = String(body?.action || "").toLowerCase();

  // ===== 1. FAKE CHAT WHATSAPP (PNG HD) =====
  if (action === "fake_wa") {
    const name = String(body?.name || "Ayang").trim().slice(0, 32);
    const status = String(body?.status || "online").trim().slice(0, 28);
    const dark = body?.theme !== "light";
    const clock = String(body?.clock || "21:42").trim().slice(0, 8);
    const rawChat = String(
      body?.messages ||
        "L: Lagi ngapain? | 21:40\nR: Lagi bikin proyek baru di MattzLM nih | 21:41\nL: Keren banget, boleh liat dong | 21:41\nR: Siap, bentar lagi jadi! | 21:42"
    );

    const parsed = rawChat
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 9)
      .map((line) => {
        const isRight = /^(R|ME|KANAN|AKU)\s*:/i.test(line);
        const stripped = line.replace(/^(L|R|ME|DIA|KIRI|KANAN|AKU)\s*:\s*/i, "");
        const [msgPart, timePart] = stripped.split("|").map((p) => p.trim());
        return {
          side: isRight ? "right" : "left",
          text: msgPart || stripped,
          time: timePart || clock,
        };
      });

    const W = 720;
    const bg = dark ? "#0b141a" : "#efeae2";
    const headerBg = dark ? "#202c33" : "#008069";
    const headerFg = "#ffffff";
    const headerSub = dark ? "#8696a0" : "#d9fdd3";
    const bubbleL = dark ? "#202c33" : "#ffffff";
    const bubbleR = dark ? "#005c4b" : "#d9fdd3";
    const textCol = dark ? "#e9edef" : "#111b21";
    const timeCol = dark ? "#8696a0" : "#667781";
    const inputBg = dark ? "#202c33" : "#ffffff";

    let curY = 148;
    const bubblesSvg: string[] = [];
    for (const msg of parsed) {
      const lines = wrapLines(msg.text, 34, 4);
      const maxLineLen = Math.max(...lines.map((l) => l.length), 6);
      const boxW = Math.min(510, Math.max(170, maxLineLen * 13 + 72));
      const boxH = lines.length * 30 + 34;
      const x = msg.side === "right" ? W - 26 - boxW : 26;
      const fill = msg.side === "right" ? bubbleR : bubbleL;

      const textSvg = lines
        .map(
          (ln, i) =>
            `<text x="${x + 18}" y="${curY + 32 + i * 30}" fill="${textCol}" font-size="22" font-family="DejaVu Sans, sans-serif">${escXml(ln)}</text>`
        )
        .join("");

      const ticks =
        msg.side === "right"
          ? `<text x="${x + boxW - 22}" y="${curY + boxH - 11}" text-anchor="end" fill="#53bdeb" font-size="16" font-weight="700" font-family="DejaVu Sans, sans-serif">&#10003;&#10003;</text>`
          : "";
      const timeX = msg.side === "right" ? x + boxW - 50 : x + boxW - 16;

      bubblesSvg.push(`
        <rect x="${x}" y="${curY}" width="${boxW}" height="${boxH}" rx="16" fill="${fill}"/>
        ${textSvg}
        <text x="${timeX}" y="${curY + boxH - 11}" text-anchor="end" fill="${timeCol}" font-size="14" font-family="DejaVu Sans, sans-serif">${escXml(msg.time)}</text>
        ${ticks}
      `);
      curY += boxH + 14;
    }

    const H = Math.max(660, curY + 96);
    const initial = escXml((name[0] || "W").toUpperCase());

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${bg}"/>
      <rect x="0" y="0" width="${W}" height="118" fill="${headerBg}"/>
      <text x="24" y="32" fill="${headerFg}" font-size="16" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(clock)}</text>
      <text x="${W - 24}" y="32" text-anchor="end" fill="${headerFg}" font-size="15" font-family="DejaVu Sans, sans-serif">5G  92%</text>
      <text x="24" y="88" fill="${headerFg}" font-size="28" font-family="DejaVu Sans, sans-serif">&#8592;</text>
      <circle cx="88" cy="78" r="24" fill="#3b4a54"/>
      <text x="88" y="86" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="700" font-family="DejaVu Sans, sans-serif">${initial}</text>
      <text x="128" y="73" fill="${headerFg}" font-size="23" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(name)}</text>
      <text x="128" y="98" fill="${headerSub}" font-size="16" font-family="DejaVu Sans, sans-serif">${escXml(status)}</text>
      <rect x="${W / 2 - 64}" y="126" width="128" height="24" rx="12" fill="${dark ? "#182229" : "#ffffff"}" fill-opacity="0.9"/>
      <text x="${W / 2}" y="143" text-anchor="middle" fill="${timeCol}" font-size="13" font-family="DejaVu Sans, sans-serif">Hari Ini</text>
      ${bubblesSvg.join("\n")}
      <rect x="0" y="${H - 76}" width="${W}" height="76" fill="${dark ? "#111b21" : "#f0f2f5"}"/>
      <rect x="18" y="${H - 60}" width="${W - 96}" height="46" rx="23" fill="${inputBg}"/>
      <text x="42" y="${H - 31}" fill="${timeCol}" font-size="18" font-family="DejaVu Sans, sans-serif">Ketik pesan...</text>
      <circle cx="${W - 44}" cy="${H - 37}" r="23" fill="#00a884"/>
      <text x="${W - 44}" y="${H - 31}" text-anchor="middle" fill="#ffffff" font-size="20" font-weight="700" font-family="DejaVu Sans, sans-serif">&#10148;</text>
    </svg>`;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  // ===== 2. FAKE TWEET X / TWITTER (PNG HD) =====
  if (action === "fake_tweet") {
    const displayName = String(body?.displayName || "MattzLM").trim().slice(0, 32);
    const handle = String(body?.handle || "mattzlm_id").trim().replace(/^@/, "").slice(0, 26);
    const text = String(body?.text || "Bikin konten viral sekarang cukup 1 klik di web, tanpa ribet install aplikasi tambahan.").trim();
    const verified = body?.verified !== false;
    const dark = body?.theme !== "light";
    const replies = String(body?.replies || "1,2K").slice(0, 12);
    const reposts = String(body?.reposts || "4,8K").slice(0, 12);
    const likes = String(body?.likes || "38,4K").slice(0, 12);
    const views = String(body?.views || "1,4M").slice(0, 12);
    const timestamp = String(body?.timestamp || "9:41 PM · 25 Nov 2026").slice(0, 36);

    const lines = wrapLines(text, 44, 9);
    const W = 820;
    const bodyStartY = 148;
    const bodyHeight = lines.length * 38;
    const H = Math.max(380, bodyStartY + bodyHeight + 170);

    const bg = dark ? "#000000" : "#ffffff";
    const fg = dark ? "#e7e9ea" : "#0f1419";
    const muted = dark ? "#71767b" : "#536471";
    const lineCol = dark ? "#2f3336" : "#eff3f4";

    const linesSvg = lines
      .map(
        (ln, i) =>
          `<text x="42" y="${bodyStartY + i * 38}" fill="${fg}" font-size="27" font-family="DejaVu Sans, sans-serif">${escXml(ln)}</text>`
      )
      .join("");

    const footerY = bodyStartY + bodyHeight + 36;
    const badgeX = 122 + Math.min(displayName.length, 24) * 14 + 14;
    const verifiedSvg = verified
      ? `<circle cx="${badgeX}" cy="68" r="11" fill="#1d9bf0"/><text x="${badgeX}" y="73" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700" font-family="DejaVu Sans, sans-serif">&#10003;</text>`
      : "";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" rx="22" fill="${bg}"/>
      <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="none" stroke="${lineCol}" stroke-width="2"/>
      <circle cx="74" cy="76" r="32" fill="${dark ? "#202327" : "#d9e2ec"}"/>
      <text x="74" y="86" text-anchor="middle" fill="${fg}" font-size="28" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml((displayName[0] || "X").toUpperCase())}</text>
      <text x="122" y="74" fill="${fg}" font-size="24" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(displayName)}</text>
      ${verifiedSvg}
      <text x="122" y="102" fill="${muted}" font-size="19" font-family="DejaVu Sans, sans-serif">@${escXml(handle)}</text>
      <text x="${W - 44}" y="82" text-anchor="end" fill="${fg}" font-size="30" font-weight="700" font-family="DejaVu Sans, sans-serif">X</text>
      ${linesSvg}
      <text x="42" y="${footerY}" fill="${muted}" font-size="18" font-family="DejaVu Sans, sans-serif">${escXml(timestamp)}  &#183;  <tspan fill="${fg}" font-weight="700">${escXml(views)}</tspan> Views</text>
      <line x1="42" y1="${footerY + 24}" x2="${W - 42}" y2="${footerY + 24}" stroke="${lineCol}" stroke-width="1.5"/>
      <text x="42" y="${footerY + 64}" fill="${muted}" font-size="19" font-family="DejaVu Sans, sans-serif"><tspan fill="${fg}" font-weight="700">${escXml(replies)}</tspan> Replies</text>
      <text x="230" y="${footerY + 64}" fill="${muted}" font-size="19" font-family="DejaVu Sans, sans-serif"><tspan fill="${fg}" font-weight="700">${escXml(reposts)}</tspan> Reposts</text>
      <text x="435" y="${footerY + 64}" fill="${muted}" font-size="19" font-family="DejaVu Sans, sans-serif"><tspan fill="${fg}" font-weight="700">${escXml(likes)}</tspan> Likes</text>
      <text x="${W - 42}" y="${footerY + 64}" text-anchor="end" fill="${muted}" font-size="17" font-family="DejaVu Sans, sans-serif">Bookmark</text>
    </svg>`;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  // ===== 3. FAKE NOTIF LOCKSCREEN IPHONE (PNG HD) =====
  if (action === "fake_notif") {
    const app = String(body?.app || "WhatsApp").trim().slice(0, 24);
    const sender = String(body?.sender || "Sayang").trim().slice(0, 36);
    const message = String(body?.message || "Jangan lupa makan ya, nanti malam kita ketemu!").trim().slice(0, 160);
    const clock = String(body?.clock || "21:45").trim().slice(0, 8);
    const dateLabel = String(body?.dateLabel || "Rabu, 25 November").trim().slice(0, 32);
    const ago = String(body?.ago || "baru saja").trim().slice(0, 18);

    const appColors: Record<string, string> = {
      WhatsApp: "#25d366",
      Instagram: "#e1306c",
      DANA: "#118eea",
      BCA: "#0066ae",
      TikTok: "#111111",
      GoPay: "#00aed6",
      Shopee: "#ee4d2d",
    };
    const badgeColor = appColors[app] || "#25d366";
    const lines = wrapLines(message, 40, 3);
    const W = 760;
    const H = 980;
    const cardH = 122 + (lines.length - 1) * 28;

    const msgSvg = lines
      .map(
        (ln, i) =>
          `<text x="148" y="${578 + i * 28}" fill="#f1f5f9" font-size="21" font-family="DejaVu Sans, sans-serif">${escXml(ln)}</text>`
      )
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="52%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#wall)"/>
      <circle cx="150" cy="210" r="240" fill="#ffffff" fill-opacity="0.04"/>
      <circle cx="620" cy="760" r="260" fill="#ffffff" fill-opacity="0.035"/>
      <text x="${W / 2}" y="76" text-anchor="middle" fill="#cbd5e1" font-size="22" font-family="DejaVu Sans, sans-serif">${escXml(dateLabel)}</text>
      <text x="${W / 2}" y="220" text-anchor="middle" fill="#ffffff" font-size="146" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(clock)}</text>
      <rect x="44" y="492" width="${W - 88}" height="${cardH}" rx="30" fill="#1e293b" fill-opacity="0.88" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.5"/>
      <rect x="68" y="520" width="62" height="62" rx="16" fill="${badgeColor}"/>
      <text x="99" y="560" text-anchor="middle" fill="#ffffff" font-size="28" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml((app[0] || "N").toUpperCase())}</text>
      <text x="148" y="544" fill="#ffffff" font-size="23" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(sender)}</text>
      <text x="${W - 72}" y="544" text-anchor="end" fill="#94a3b8" font-size="17" font-family="DejaVu Sans, sans-serif">${escXml(ago)}</text>
      ${msgSvg}
      <text x="148" y="${508 + cardH - 18}" fill="#94a3b8" font-size="14" font-family="DejaVu Sans, sans-serif">${escXml(app)}</text>
      <rect x="${W / 2 - 120}" y="${H - 34}" width="240" height="8" rx="4" fill="#ffffff" fill-opacity="0.72"/>
    </svg>`;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  // ===== 4. FAKE STRUK TRANSFER / E-WALLET (SIMULASI) =====
  if (action === "fake_struk") {
    const provider = String(body?.provider || "QRIS / Transfer Bank").trim().slice(0, 28);
    const receiver = String(body?.receiver || "MATTZLM STORE").trim().slice(0, 34);
    const sender = String(body?.sender || "BUDI SANTOSO").trim().slice(0, 34);
    const amountNum = Math.max(0, Number(body?.amount || 250000));
    const amountFmt = "Rp " + Math.round(amountNum).toLocaleString("id-ID");
    const note = String(body?.note || "Pembayaran pesanan").trim().slice(0, 42);
    const dateStr = String(body?.date || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })).slice(0, 32);
    const refNo = "REF-" + String(Date.now()).slice(-9);

    const W = 680;
    const H = 820;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="#f4f4f5"/>
      <rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="26" fill="#ffffff" stroke="#e4e4e7" stroke-width="2"/>
      <circle cx="${W / 2}" cy="126" r="42" fill="#16a34a"/>
      <text x="${W / 2}" y="142" text-anchor="middle" fill="#ffffff" font-size="44" font-weight="700" font-family="DejaVu Sans, sans-serif">&#10003;</text>
      <text x="${W / 2}" y="206" text-anchor="middle" fill="#111827" font-size="28" font-weight="700" font-family="DejaVu Sans, sans-serif">Transaksi Berhasil</text>
      <text x="${W / 2}" y="238" text-anchor="middle" fill="#6b7280" font-size="17" font-family="DejaVu Sans, sans-serif">${escXml(provider)}  &#183;  ${escXml(dateStr)}</text>
      <text x="${W / 2}" y="316" text-anchor="middle" fill="#09090b" font-size="48" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(amountFmt)}</text>
      <line x1="74" y1="360" x2="${W - 74}" y2="360" stroke="#e4e4e7" stroke-width="2" stroke-dasharray="8 6"/>
      <text x="74" y="416" fill="#6b7280" font-size="18" font-family="DejaVu Sans, sans-serif">Penerima</text>
      <text x="${W - 74}" y="416" text-anchor="end" fill="#111827" font-size="19" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(receiver)}</text>
      <text x="74" y="468" fill="#6b7280" font-size="18" font-family="DejaVu Sans, sans-serif">Pengirim</text>
      <text x="${W - 74}" y="468" text-anchor="end" fill="#111827" font-size="19" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(sender)}</text>
      <text x="74" y="520" fill="#6b7280" font-size="18" font-family="DejaVu Sans, sans-serif">Metode</text>
      <text x="${W - 74}" y="520" text-anchor="end" fill="#111827" font-size="19" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(provider)}</text>
      <text x="74" y="572" fill="#6b7280" font-size="18" font-family="DejaVu Sans, sans-serif">Catatan</text>
      <text x="${W - 74}" y="572" text-anchor="end" fill="#111827" font-size="18" font-family="DejaVu Sans, sans-serif">${escXml(note)}</text>
      <text x="74" y="624" fill="#6b7280" font-size="18" font-family="DejaVu Sans, sans-serif">No. Referensi</text>
      <text x="${W - 74}" y="624" text-anchor="end" fill="#111827" font-size="18" font-family="DejaVu Sans Mono, monospace">${escXml(refNo)}</text>
      <line x1="74" y1="670" x2="${W - 74}" y2="670" stroke="#e4e4e7" stroke-width="2" stroke-dasharray="8 6"/>
      <text x="${W / 2}" y="726" text-anchor="middle" fill="#9ca3af" font-size="14" font-family="DejaVu Sans Mono, monospace">MOCKUP SIMULASI HIBURAN &#183; MATTZLM</text>
    </svg>`;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  // ===== 5. FUN SHAREABLE PNG CARD (CEK KHODAM / JODOH) =====
  if (action === "fun_card") {
    const badge = String(body?.badge || "CEK KHODAM").trim().slice(0, 26);
    const title = String(body?.title || "Macan Putih Wi-Fi").trim().slice(0, 42);
    const subtitle = String(body?.subtitle || "Nama: Matt").trim().slice(0, 56);
    const stat1 = String(body?.stat1 || "Elemen: Petir").trim().slice(0, 32);
    const stat2 = String(body?.stat2 || "Power: 94%").trim().slice(0, 32);
    const desc = String(body?.desc || "Khodam penjaga sinyal dan mood harian.").trim().slice(0, 180);

    const lines = wrapLines(desc, 42, 4);
    const W = 800;
    const H = 500;
    const linesSvg = lines
      .map(
        (ln, i) =>
          `<text x="${W / 2}" y="${324 + i * 32}" text-anchor="middle" fill="#d4d4d8" font-size="21" font-family="DejaVu Sans, sans-serif">${escXml(ln)}</text>`
      )
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="#09090b"/>
      <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="28" fill="#18181b" stroke="#52525b" stroke-width="2"/>
      <rect x="${W / 2 - 110}" y="52" width="220" height="36" rx="18" fill="#fafafa"/>
      <text x="${W / 2}" y="76" text-anchor="middle" fill="#09090b" font-size="16" font-weight="700" font-family="DejaVu Sans Mono, monospace">${escXml(badge)}</text>
      <text x="${W / 2}" y="140" text-anchor="middle" fill="#a1a1aa" font-size="20" font-family="DejaVu Sans, sans-serif">${escXml(subtitle)}</text>
      <text x="${W / 2}" y="206" text-anchor="middle" fill="#ffffff" font-size="44" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(title)}</text>
      <rect x="90" y="236" width="290" height="46" rx="14" fill="#27272a" stroke="#3f3f46"/>
      <text x="235" y="266" text-anchor="middle" fill="#fafafa" font-size="18" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(stat1)}</text>
      <rect x="420" y="236" width="290" height="46" rx="14" fill="#27272a" stroke="#3f3f46"/>
      <text x="565" y="266" text-anchor="middle" fill="#fafafa" font-size="18" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(stat2)}</text>
      ${linesSvg}
      <text x="${W / 2}" y="${H - 44}" text-anchor="middle" fill="#71717a" font-size="14" font-family="DejaVu Sans Mono, monospace">MATTZLM VIRAL CARD GENERATOR</text>
    </svg>`;

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json({ ok: false, error: `Action '${action}' tidak dikenal.` }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      return await handleJsonActions(body);
    }

    const form = await req.formData();
    const action = String(form.get("action") || "").toLowerCase();

    // ===== 6. STICKER WHATSAPP MAKER (512x512 WebP Transparan) =====
    if (action === "wa_sticker") {
      const inputBuf = await readUploadedFile(form);
      if (!inputBuf) return NextResponse.json({ ok: false, error: "Unggah foto terlebih dahulu." }, { status: 400 });
      const shape = String(form.get("shape") || "rounded");
      const topText = String(form.get("topText") || "").trim().slice(0, 36);
      const bottomText = String(form.get("bottomText") || "").trim().slice(0, 36);

      const base = await sharp(inputBuf)
        .rotate()
        .resize(512, 512, { fit: "cover", position: "attention" })
        .ensureAlpha()
        .png()
        .toBuffer();

      const composites: OverlayOptions[] = [];

      if (shape === "circle" || shape === "rounded") {
        const maskSvg =
          shape === "circle"
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="244" fill="#ffffff"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect x="12" y="12" width="488" height="488" rx="84" fill="#ffffff"/></svg>`;
        const masked = await sharp(base)
          .composite([{ input: Buffer.from(maskSvg), blend: "dest-in" }])
          .png()
          .toBuffer();

        const textOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
          ${topText ? `<text x="256" y="72" text-anchor="middle" fill="#ffffff" stroke="#000000" stroke-width="10" paint-order="stroke" font-size="44" font-weight="900" font-family="DejaVu Sans, sans-serif">${escXml(topText.toUpperCase())}</text>` : ""}
          ${bottomText ? `<text x="256" y="468" text-anchor="middle" fill="#ffffff" stroke="#000000" stroke-width="10" paint-order="stroke" font-size="44" font-weight="900" font-family="DejaVu Sans, sans-serif">${escXml(bottomText.toUpperCase())}</text>` : ""}
        </svg>`;
        if (topText || bottomText) composites.push({ input: Buffer.from(textOverlay), top: 0, left: 0 });
        const webp = await sharp(masked).composite(composites).webp({ quality: 88, alphaQuality: 95 }).toBuffer();
        return new NextResponse(new Uint8Array(webp), {
          status: 200,
          headers: { "Content-Type": "image/webp", "X-Output-Bytes": String(webp.length), "Cache-Control": "no-store" },
        });
      }

      const textOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        ${topText ? `<text x="256" y="68" text-anchor="middle" fill="#ffffff" stroke="#000000" stroke-width="10" paint-order="stroke" font-size="44" font-weight="900" font-family="DejaVu Sans, sans-serif">${escXml(topText.toUpperCase())}</text>` : ""}
        ${bottomText ? `<text x="256" y="472" text-anchor="middle" fill="#ffffff" stroke="#000000" stroke-width="10" paint-order="stroke" font-size="44" font-weight="900" font-family="DejaVu Sans, sans-serif">${escXml(bottomText.toUpperCase())}</text>` : ""}
      </svg>`;
      if (topText || bottomText) composites.push({ input: Buffer.from(textOverlay), top: 0, left: 0 });
      const webp = await sharp(base).composite(composites).webp({ quality: 88 }).toBuffer();
      return new NextResponse(new Uint8Array(webp), {
        status: 200,
        headers: { "Content-Type": "image/webp", "X-Output-Bytes": String(webp.length), "Cache-Control": "no-store" },
      });
    }

    // ===== 7. SPOTIFY NOW PLAYING CARD (PNG HD + Optional Cover Upload) =====
    if (action === "fake_spotify") {
      const title = String(form.get("title") || "Komang").trim().slice(0, 38);
      const artist = String(form.get("artist") || "Raim Laode").trim().slice(0, 42);
      const lyric = String(form.get("lyric") || "Sebab kau terlalu indah dari sekadar kata").trim().slice(0, 90);
      const elapsed = String(form.get("elapsed") || "1:42").trim().slice(0, 8);
      const duration = String(form.get("duration") || "3:42").trim().slice(0, 8);
      const progress = Math.min(98, Math.max(5, Number(form.get("progress") || 46)));
      const coverBuf = await readUploadedFile(form, "file");

      const W = 720;
      const H = 960;
      const barW = 580;
      const fillW = Math.round((barW * progress) / 100);
      const lyricLines = wrapLines(lyric, 38, 2);
      const lyricSvg = lyricLines
        .map(
          (ln, i) =>
            `<text x="70" y="${736 + i * 28}" fill="#d4d4d8" font-size="19" font-style="italic" font-family="DejaVu Sans, sans-serif">${escXml(ln)}</text>`
        )
        .join("");

      const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <defs>
          <linearGradient id="spBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#27272a"/>
            <stop offset="55%" stop-color="#121212"/>
            <stop offset="100%" stop-color="#09090b"/>
          </linearGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#spBg)"/>
        <text x="${W / 2}" y="58" text-anchor="middle" fill="#a1a1aa" font-size="14" font-weight="700" letter-spacing="2" font-family="DejaVu Sans, sans-serif">PLAYING FROM PLAYLIST</text>
        <text x="${W / 2}" y="84" text-anchor="middle" fill="#ffffff" font-size="19" font-weight="700" font-family="DejaVu Sans, sans-serif">Lagu Andalan 2026</text>
        <rect x="110" y="116" width="500" height="500" rx="18" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
        <text x="${W / 2}" y="380" text-anchor="middle" fill="#52525b" font-size="96" font-weight="700" font-family="DejaVu Sans, sans-serif">&#9835;</text>
        <text x="70" y="670" fill="#ffffff" font-size="34" font-weight="700" font-family="DejaVu Sans, sans-serif">${escXml(title)}</text>
        <text x="70" y="704" fill="#a1a1aa" font-size="22" font-family="DejaVu Sans, sans-serif">${escXml(artist)}</text>
        <circle cx="${W - 84}" cy="676" r="18" fill="#1db954"/>
        <text x="${W - 84}" y="683" text-anchor="middle" fill="#000000" font-size="20" font-weight="700" font-family="DejaVu Sans, sans-serif">&#10003;</text>
        ${lyricSvg}
        <rect x="70" y="794" width="${barW}" height="8" rx="4" fill="#3f3f46"/>
        <rect x="70" y="794" width="${fillW}" height="8" rx="4" fill="#ffffff"/>
        <circle cx="${70 + fillW}" cy="798" r="9" fill="#ffffff"/>
        <text x="70" y="828" fill="#a1a1aa" font-size="15" font-family="DejaVu Sans Mono, monospace">${escXml(elapsed)}</text>
        <text x="${70 + barW}" y="828" text-anchor="end" fill="#a1a1aa" font-size="15" font-family="DejaVu Sans Mono, monospace">${escXml(duration)}</text>
        <text x="195" y="896" text-anchor="middle" fill="#ffffff" font-size="34" font-family="DejaVu Sans, sans-serif">&#9198;</text>
        <circle cx="${W / 2}" cy="884" r="38" fill="#ffffff"/>
        <rect x="${W / 2 - 11}" y="868" width="8" height="32" rx="2" fill="#000000"/>
        <rect x="${W / 2 + 3}" y="868" width="8" height="32" rx="2" fill="#000000"/>
        <text x="${W - 195}" y="896" text-anchor="middle" fill="#ffffff" font-size="34" font-family="DejaVu Sans, sans-serif">&#9197;</text>
      </svg>`;

      let img = sharp(Buffer.from(cardSvg));
      if (coverBuf) {
        const roundedMask = Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" rx="18" fill="#fff"/></svg>`
        );
        const coverPng = await sharp(coverBuf)
          .rotate()
          .resize(500, 500, { fit: "cover", position: "attention" })
          .ensureAlpha()
          .composite([{ input: roundedMask, blend: "dest-in" }])
          .png()
          .toBuffer();
        img = img.composite([{ input: coverPng, top: 116, left: 110 }]);
      }
      const png = await img.png().toBuffer();
      return new NextResponse(new Uint8Array(png), {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // ===== 8. IG FEED 3x3 GRID SPLITTER =====
    if (action === "ig_grid") {
      const inputBuf = await readUploadedFile(form);
      if (!inputBuf) return NextResponse.json({ ok: false, error: "Unggah foto terlebih dahulu." }, { status: 400 });
      const rows = Math.min(3, Math.max(1, Number(form.get("rows") || 3)));
      const cols = 3;
      const cell = 360;
      const resized = await sharp(inputBuf)
        .rotate()
        .resize(cols * cell, rows * cell, { fit: "cover", position: "attention" })
        .png()
        .toBuffer();

      const tiles: Array<{ index: number; row: number; col: number; name: string; dataUrl: string }> = [];
      let idx = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tileBuf = await sharp(resized)
            .extract({ left: c * cell, top: r * cell, width: cell, height: cell })
            .jpeg({ quality: 92 })
            .toBuffer();
          tiles.push({
            index: idx,
            row: r + 1,
            col: c + 1,
            name: `ig_grid_${rows}x3_part_${idx}.jpg`,
            dataUrl: `data:image/jpeg;base64,${tileBuf.toString("base64")}`,
          });
          idx++;
        }
      }
      return NextResponse.json({ ok: true, rows, cols, total: tiles.length, tiles });
    }

    // ===== 9. TWIBBON & FRAME FOTO =====
    if (action === "twibbon") {
      const photoBuf = await readUploadedFile(form, "file");
      if (!photoBuf) return NextResponse.json({ ok: false, error: "Unggah foto profil terlebih dahulu." }, { status: 400 });
      const customFrameBuf = await readUploadedFile(form, "frameFile");
      const preset = String(form.get("preset") || "event");
      const headline = String(form.get("headline") || "SIAP MERAMAIKAN EVENT 2026").trim().slice(0, 42);
      const subline = String(form.get("subline") || "#MattzLMCommunity").trim().slice(0, 38);

      const size = 1080;
      const base = await sharp(photoBuf)
        .rotate()
        .resize(size, size, { fit: "cover", position: "attention" })
        .png()
        .toBuffer();

      let overlayBuf: Buffer;
      if (customFrameBuf) {
        overlayBuf = await sharp(customFrameBuf).resize(size, size, { fit: "fill" }).png().toBuffer();
      } else {
        const themes: Record<string, { border: string; ribbon: string; text: string; accent: string }> = {
          event: { border: "#111111", ribbon: "#09090b", text: "#ffffff", accent: "#e4e4e7" },
          merdeka: { border: "#dc2626", ribbon: "#991b1b", text: "#ffffff", accent: "#fef2f2" },
          ramadhan: { border: "#065f46", ribbon: "#064e3b", text: "#fef3c7", accent: "#fde68a" },
          birthday: { border: "#1d4ed8", ribbon: "#1e3a8a", text: "#ffffff", accent: "#dbeafe" },
          kampus: { border: "#3f3f46", ribbon: "#18181b", text: "#fafafa", accent: "#d4d4d8" },
        };
        const t = themes[preset] || themes.event;
        const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <rect x="20" y="20" width="${size - 40}" height="${size - 40}" rx="48" fill="none" stroke="${t.border}" stroke-width="32"/>
          <rect x="44" y="44" width="${size - 88}" height="${size - 88}" rx="34" fill="none" stroke="${t.accent}" stroke-width="4" stroke-opacity="0.75"/>
          <path d="M0 830 Q540 770 1080 830 L1080 1080 L0 1080 Z" fill="${t.ribbon}" fill-opacity="0.93"/>
          <text x="540" y="928" text-anchor="middle" fill="${t.text}" font-size="42" font-weight="800" font-family="DejaVu Sans, sans-serif">${escXml(headline)}</text>
          <text x="540" y="990" text-anchor="middle" fill="${t.accent}" font-size="28" font-weight="600" font-family="DejaVu Sans, sans-serif">${escXml(subline)}</text>
        </svg>`;
        overlayBuf = Buffer.from(frameSvg);
      }

      const out = await sharp(base).composite([{ input: overlayBuf, top: 0, left: 0 }]).png().toBuffer();
      return new NextResponse(new Uint8Array(out), {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // ===== 10. MEME GENERATOR VIRAL =====
    if (action === "meme") {
      const inputBuf = await readUploadedFile(form);
      if (!inputBuf) return NextResponse.json({ ok: false, error: "Unggah gambar meme terlebih dahulu." }, { status: 400 });
      const topText = String(form.get("topText") || "").trim().slice(0, 70).toUpperCase();
      const bottomText = String(form.get("bottomText") || "").trim().slice(0, 70).toUpperCase();

      const prepared = await sharp(inputBuf)
        .rotate()
        .resize({ width: 960, height: 960, fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer();
      const meta = await sharp(prepared).metadata();
      const W = meta.width || 800;
      const H = meta.height || 800;
      const fontSize = Math.max(32, Math.round(W * 0.068));
      const strokeW = Math.max(6, Math.round(fontSize * 0.18));

      const topLines = wrapLines(topText, 22, 2);
      const botLines = wrapLines(bottomText, 22, 2);

      const topSvg = topLines
        .map(
          (ln, i) =>
            `<text x="${W / 2}" y="${fontSize + 18 + i * (fontSize + 8)}" text-anchor="middle" fill="#ffffff" stroke="#000000" stroke-width="${strokeW}" paint-order="stroke" font-size="${fontSize}" font-weight="900" font-family="DejaVu Sans, sans-serif">${escXml(ln)}</text>`
        )
        .join("");

      const botStart = H - 24 - (botLines.length - 1) * (fontSize + 8);
      const botSvg = botLines
        .map(
          (ln, i) =>
            `<text x="${W / 2}" y="${botStart + i * (fontSize + 8)}" text-anchor="middle" fill="#ffffff" stroke="#000000" stroke-width="${strokeW}" paint-order="stroke" font-size="${fontSize}" font-weight="900" font-family="DejaVu Sans, sans-serif">${escXml(ln)}</text>`
        )
        .join("");

      const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${topSvg}${botSvg}</svg>`);
      const out = await sharp(prepared).composite([{ input: overlay, top: 0, left: 0 }]).png().toBuffer();
      return new NextResponse(new Uint8Array(out), {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // ===== 11. POLAROID & AESTHETIC QUOTE CARD =====
    if (action === "polaroid") {
      const inputBuf = await readUploadedFile(form);
      const caption = String(form.get("caption") || "Tetap tenang, semua ada waktunya.").trim().slice(0, 90);
      const dateStr = String(form.get("date") || "25 . 11 . 2026").trim().slice(0, 24);
      const tone = String(form.get("tone") || "classic");

      const W = 760;
      const H = 920;
      const paperBg = tone === "dark" ? "#141414" : "#fafafa";
      const paperFg = tone === "dark" ? "#f4f4f5" : "#18181b";
      const paperMuted = tone === "dark" ? "#a1a1aa" : "#71717a";

      const capLines = wrapLines(caption, 32, 2);
      const capSvg = capLines
        .map(
          (ln, i) =>
            `<text x="${W / 2}" y="${778 + i * 36}" text-anchor="middle" fill="${paperFg}" font-size="27" font-weight="600" font-family="DejaVu Serif, Georgia, serif">${escXml(ln)}</text>`
        )
        .join("");

      const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <rect width="${W}" height="${H}" fill="${tone === "dark" ? "#09090b" : "#e4e4e7"}"/>
        <rect x="40" y="36" width="${W - 80}" height="${H - 72}" rx="12" fill="${paperBg}" stroke="${tone === "dark" ? "#27272a" : "#d4d4d8"}" stroke-width="2"/>
        <rect x="76" y="72" width="608" height="624" fill="${tone === "dark" ? "#202024" : "#18181b"}"/>
        ${!inputBuf ? `<text x="${W / 2}" y="394" text-anchor="middle" fill="#ffffff" font-size="30" font-style="italic" font-family="DejaVu Serif, Georgia, serif">${escXml(capLines[0] || "Aesthetic")}</text>` : ""}
        ${capSvg}
        <text x="${W / 2}" y="856" text-anchor="middle" fill="${paperMuted}" font-size="16" font-family="DejaVu Sans Mono, monospace">${escXml(dateStr)}</text>
      </svg>`;

      let canvas = sharp(Buffer.from(baseSvg));
      if (inputBuf) {
        let photoPipe = sharp(inputBuf).rotate().resize(608, 624, { fit: "cover", position: "attention" });
        if (tone === "bw") photoPipe = photoPipe.grayscale().modulate({ brightness: 1.05 });
        const photoPng = await photoPipe.png().toBuffer();
        canvas = canvas.composite([{ input: photoPng, top: 72, left: 76 }]);
      }
      const png = await canvas.png().toBuffer();
      return new NextResponse(new Uint8Array(png), {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json({ ok: false, error: `Action '${action}' tidak didukung.` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses Viral Maker di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
