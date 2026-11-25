import crypto from "node:crypto";
import zlib from "node:zlib";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

const JWT_ALG_MAP: Record<string, string> = {
  HS256: "sha256",
  HS384: "sha384",
  HS512: "sha512",
};

function b64urlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(input: string): Buffer {
  const padLen = (4 - (input.length % 4)) % 4;
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
  return Buffer.from(b64, "base64");
}

function generateUuidV7(): string {
  const now = Date.now();
  const rand = crypto.randomBytes(10);
  const bytes = Buffer.alloc(16);
  bytes.writeUIntBE(now, 0, 6);
  bytes[6] = (rand[0] & 0x0f) | 0x70;
  bytes[7] = rand[1];
  bytes[8] = (rand[2] & 0x3f) | 0x80;
  for (let i = 9; i < 16; i++) bytes[i] = rand[i - 6];
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function generateUlid(): string {
  let ts = Date.now();
  let timePart = "";
  for (let i = 0; i < 10; i++) {
    timePart = CROCKFORD[ts % 32] + timePart;
    ts = Math.floor(ts / 32);
  }
  const rand = crypto.randomBytes(16);
  let randPart = "";
  for (let i = 0; i < 16; i++) {
    randPart += CROCKFORD[rand[i] & 31];
  }
  return timePart + randPart;
}

const NANO_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
function generateNanoId(length = 21): string {
  const len = Math.min(64, Math.max(8, length));
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += NANO_ALPHABET[bytes[i] & 63];
  }
  return out;
}

function escapeWifiField(v: string): string {
  return String(v || "").replace(/([\\;,:"])/g, "\\$1");
}

function buildStructuredQrPayload(body: Record<string, unknown>): { payload: string; summary: string } {
  const kind = String(body.kind || "wifi").toLowerCase();
  if (kind === "wifi") {
    const ssid = String(body.ssid || "").trim();
    if (!ssid) throw new Error("Nama SSID WiFi wajib diisi.");
    const password = String(body.password || "");
    const encryption = ["WPA", "WEP", "nopass"].includes(String(body.encryption || "WPA"))
      ? String(body.encryption || "WPA")
      : "WPA";
    const hidden = Boolean(body.hidden);
    const payload = `WIFI:T:${encryption};S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};H:${hidden ? "true" : "false"};;`;
    return { payload, summary: `WiFi "${ssid}" (${encryption})` };
  }

  if (kind === "whatsapp") {
    const phone = String(body.phone || "").replace(/[^0-9]/g, "");
    if (!phone || phone.length < 8) throw new Error("Nomor WhatsApp tidak valid (gunakan kode negara, mis. 62812...).");
    const message = String(body.message || "").trim();
    const payload = message
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${phone}`;
    return { payload, summary: `WhatsApp +${phone}` };
  }

  if (kind === "vcard") {
    const fullName = String(body.fullName || "").trim();
    if (!fullName) throw new Error("Nama kontak wajib diisi.");
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const org = String(body.org || "").trim();
    const website = String(body.website || "").trim();
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${fullName}`];
    if (org) lines.push(`ORG:${org}`);
    if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
    if (email) lines.push(`EMAIL:${email}`);
    if (website) lines.push(`URL:${website}`);
    lines.push("END:VCARD");
    return { payload: lines.join("\n"), summary: `vCard ${fullName}` };
  }

  if (kind === "email") {
    const to = String(body.to || "").trim();
    if (!to) throw new Error("Alamat email tujuan wajib diisi.");
    const subject = String(body.subject || "").trim();
    const text = String(body.text || "").trim();
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (text) params.set("body", text);
    const qs = params.toString();
    return { payload: `mailto:${to}${qs ? "?" + qs : ""}`, summary: `Email ${to}` };
  }

  throw new Error("Tipe QR terstruktur tidak didukung.");
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // File hashing via multipart form-data
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const action = String(form.get("action") || "hash_file").toLowerCase();
      if (action !== "hash_file") {
        return NextResponse.json({ ok: false, error: "Aksi form tidak dikenal." }, { status: 400 });
      }
      const file = form.get("file");
      if (!file || !(file instanceof File) || file.size === 0) {
        return NextResponse.json({ ok: false, error: "Pilih file terlebih dahulu." }, { status: 400 });
      }
      if (file.size > 12 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Ukuran file maksimal 12MB." }, { status: 400 });
      }
      const secret = String(form.get("secret") || "");
      const buf = Buffer.from(await file.arrayBuffer());
      const hashes = {
        md5: crypto.createHash("md5").update(buf).digest("hex"),
        sha1: crypto.createHash("sha1").update(buf).digest("hex"),
        sha256: crypto.createHash("sha256").update(buf).digest("hex"),
        sha512: crypto.createHash("sha512").update(buf).digest("hex"),
        sha3_256: crypto.createHash("sha3-256").update(buf).digest("hex"),
        blake2b512: crypto.createHash("blake2b512").update(buf).digest("hex"),
        hmacSha256: secret ? crypto.createHmac("sha256", secret).update(buf).digest("hex") : null,
      };
      return NextResponse.json({
        ok: true,
        action: "hash",
        fileName: file.name,
        bytes: buf.length,
        hashes,
      });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body?.action || "").toLowerCase();

    // 1. JWT Decoder, Verifier & HS Signer
    if (action === "jwt") {
      const mode = String(body.mode || "decode").toLowerCase();

      if (mode === "sign") {
        const alg = String(body.alg || "HS256").toUpperCase();
        const hashAlg = JWT_ALG_MAP[alg];
        if (!hashAlg) {
          return NextResponse.json({ ok: false, error: "Algoritma didukung: HS256, HS384, HS512." }, { status: 400 });
        }
        const secret = String(body.secret || "");
        if (!secret) {
          return NextResponse.json({ ok: false, error: "Secret key wajib diisi untuk menandatangani JWT." }, { status: 400 });
        }
        let payloadObj: Record<string, unknown>;
        try {
          payloadObj = typeof body.payload === "string" ? JSON.parse(body.payload) : (body.payload as Record<string, unknown>);
          if (!payloadObj || typeof payloadObj !== "object") throw new Error();
        } catch {
          return NextResponse.json({ ok: false, error: "Payload harus berupa objek JSON yang valid." }, { status: 400 });
        }
        const headerObj = { alg, typ: "JWT" };
        const signingInput = `${b64urlEncode(JSON.stringify(headerObj))}.${b64urlEncode(JSON.stringify(payloadObj))}`;
        const sig = b64urlEncode(crypto.createHmac(hashAlg, secret).update(signingInput).digest());
        return NextResponse.json({
          ok: true,
          action: "jwt",
          mode: "sign",
          token: `${signingInput}.${sig}`,
          header: headerObj,
          payload: payloadObj,
        });
      }

      const token = String(body.token || "").trim();
      const parts = token.split(".");
      if (parts.length !== 3) {
        return NextResponse.json({ ok: false, error: "Format JWT tidak valid (harus 3 bagian dipisah titik)." }, { status: 400 });
      }
      let header: Record<string, unknown>;
      let payload: Record<string, unknown>;
      try {
        header = JSON.parse(b64urlDecode(parts[0]).toString("utf8"));
        payload = JSON.parse(b64urlDecode(parts[1]).toString("utf8"));
      } catch {
        return NextResponse.json({ ok: false, error: "Header atau payload JWT tidak bisa di-decode sebagai JSON." }, { status: 400 });
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const exp = typeof payload.exp === "number" ? payload.exp : null;
      const iat = typeof payload.iat === "number" ? payload.iat : null;
      const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

      let signatureValid: boolean | null = null;
      const secret = String(body.secret || "");
      const alg = String(header.alg || "").toUpperCase();
      if (secret && JWT_ALG_MAP[alg]) {
        const expected = crypto
          .createHmac(JWT_ALG_MAP[alg], secret)
          .update(`${parts[0]}.${parts[1]}`)
          .digest();
        const actual = b64urlDecode(parts[2]);
        signatureValid =
          expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
      }

      return NextResponse.json({
        ok: true,
        action: "jwt",
        mode: "decode",
        header,
        payload,
        signature: parts[2],
        signatureValid,
        timing: {
          issuedAt: iat ? new Date(iat * 1000).toISOString() : null,
          notBefore: nbf ? new Date(nbf * 1000).toISOString() : null,
          expiresAt: exp ? new Date(exp * 1000).toISOString() : null,
          expired: exp !== null ? nowSec >= exp : null,
          secondsRemaining: exp !== null ? exp - nowSec : null,
        },
      });
    }

    // 2. Multi-Hash & HMAC Generator (text)
    if (action === "hash") {
      const text = String(body.text ?? "");
      if (!text) {
        return NextResponse.json({ ok: false, error: "Teks input tidak boleh kosong." }, { status: 400 });
      }
      if (text.length > 500_000) {
        return NextResponse.json({ ok: false, error: "Input maksimal 500.000 karakter." }, { status: 400 });
      }
      const secret = String(body.secret || "");
      const buf = Buffer.from(text, "utf8");
      return NextResponse.json({
        ok: true,
        action: "hash",
        bytes: buf.length,
        hashes: {
          md5: crypto.createHash("md5").update(buf).digest("hex"),
          sha1: crypto.createHash("sha1").update(buf).digest("hex"),
          sha256: crypto.createHash("sha256").update(buf).digest("hex"),
          sha512: crypto.createHash("sha512").update(buf).digest("hex"),
          sha3_256: crypto.createHash("sha3-256").update(buf).digest("hex"),
          blake2b512: crypto.createHash("blake2b512").update(buf).digest("hex"),
          hmacSha256: secret ? crypto.createHmac("sha256", secret).update(buf).digest("hex") : null,
          hmacSha512: secret ? crypto.createHmac("sha512", secret).update(buf).digest("hex") : null,
        },
      });
    }

    // 3. AES-256-GCM Encryptor / Decryptor
    if (action === "encrypt") {
      const mode = String(body.mode || "encrypt").toLowerCase();
      const text = String(body.text || "");
      const passphrase = String(body.passphrase || "");
      if (!text || !passphrase) {
        return NextResponse.json({ ok: false, error: "Teks dan kunci rahasia wajib diisi." }, { status: 400 });
      }
      if (text.length > 200_000) {
        return NextResponse.json({ ok: false, error: "Panjang teks maksimal 200.000 karakter." }, { status: 400 });
      }

      if (mode === "decrypt") {
        try {
          const packed = Buffer.from(text.trim(), "base64");
          if (packed.length < 16 + 12 + 16 + 1) {
            throw new Error("Format ciphertext tidak valid.");
          }
          const salt = packed.subarray(0, 16);
          const iv = packed.subarray(16, 28);
          const tag = packed.subarray(28, 44);
          const ciphertext = packed.subarray(44);
          const key = crypto.pbkdf2Sync(passphrase, salt, 100_000, 32, "sha256");
          const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
          decipher.setAuthTag(tag);
          const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
          return NextResponse.json({ ok: true, action: "encrypt", mode: "decrypt", output: plain });
        } catch {
          return NextResponse.json(
            { ok: false, error: "Dekripsi gagal. Periksa kunci rahasia atau format ciphertext." },
            { status: 400 }
          );
        }
      }

      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);
      const key = crypto.pbkdf2Sync(passphrase, salt, 100_000, 32, "sha256");
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      const packed = Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
      return NextResponse.json({
        ok: true,
        action: "encrypt",
        mode: "encrypt",
        algorithm: "AES-256-GCM + PBKDF2-SHA256 (100k)",
        output: packed,
      });
    }

    // 4. Bulk UUID v4/v7, ULID, NanoID
    if (action === "uuid") {
      const kind = String(body.kind || "uuidv4").toLowerCase();
      const count = Math.min(50, Math.max(1, Number(body.count || 10)));
      const length = Math.min(64, Math.max(8, Number(body.length || 21)));
      const items: string[] = [];
      for (let i = 0; i < count; i++) {
        if (kind === "uuidv7") items.push(generateUuidV7());
        else if (kind === "ulid") items.push(generateUlid());
        else if (kind === "nanoid") items.push(generateNanoId(length));
        else items.push(crypto.randomUUID());
      }
      return NextResponse.json({ ok: true, action: "uuid", kind, count: items.length, items });
    }

    // 5. Gzip / Brotli / Deflate Compressor & Decompressor
    if (action === "compress") {
      const mode = String(body.mode || "compress").toLowerCase();
      const alg = String(body.algorithm || "brotli").toLowerCase();
      const text = String(body.text || "");
      if (!text) {
        return NextResponse.json({ ok: false, error: "Masukkan teks atau Base64 terlebih dahulu." }, { status: 400 });
      }
      if (text.length > 500_000) {
        return NextResponse.json({ ok: false, error: "Input maksimal 500KB." }, { status: 400 });
      }

      if (mode === "decompress") {
        const raw = Buffer.from(text.trim(), "base64");
        let out: Buffer;
        if (alg === "gzip") out = zlib.gunzipSync(raw);
        else if (alg === "deflate") out = zlib.inflateSync(raw);
        else out = zlib.brotliDecompressSync(raw);
        return NextResponse.json({
          ok: true,
          action: "compress",
          mode: "decompress",
          algorithm: alg,
          inputBytes: raw.length,
          outputBytes: out.length,
          output: out.toString("utf8"),
        });
      }

      const inputBuf = Buffer.from(text, "utf8");
      let compressed: Buffer;
      if (alg === "gzip") compressed = zlib.gzipSync(inputBuf, { level: 9 });
      else if (alg === "deflate") compressed = zlib.deflateSync(inputBuf, { level: 9 });
      else compressed = zlib.brotliCompressSync(inputBuf);

      const savedPct =
        inputBuf.length > 0
          ? Number((((inputBuf.length - compressed.length) / inputBuf.length) * 100).toFixed(1))
          : 0;

      return NextResponse.json({
        ok: true,
        action: "compress",
        mode: "compress",
        algorithm: alg,
        originalBytes: inputBuf.length,
        compressedBytes: compressed.length,
        savedPercent: savedPct,
        base64: compressed.toString("base64"),
      });
    }

    // 6. Structured QR Generator (WiFi, WhatsApp, vCard, Email)
    if (action === "qr_pro") {
      const { payload, summary } = buildStructuredQrPayload(body);
      const size = Math.min(1024, Math.max(180, Number(body.size || 380)));
      const [pngDataUrl, svg] = await Promise.all([
        QRCode.toDataURL(payload, {
          width: size,
          margin: 2,
          color: { dark: "#0A0A0A", light: "#FFFFFF" },
          errorCorrectionLevel: "M",
        }),
        QRCode.toString(payload, {
          type: "svg",
          width: size,
          margin: 2,
          color: { dark: "#0A0A0A", light: "#FFFFFF" },
          errorCorrectionLevel: "M",
        }),
      ]);
      return NextResponse.json({
        ok: true,
        action: "qr_pro",
        summary,
        payload,
        pngDataUrl,
        svg,
      });
    }

    return NextResponse.json({ ok: false, error: "Action tidak dikenal." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses utilitas kriptografi.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
