import { NextRequest, NextResponse } from "next/server";
import { buildInvoicePdf, InvoiceItemInput } from "@/lib/server/pdf-writer";

// ===== CSV / JSON / MARKDOWN TABLE HELPERS =====
function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\r" && text[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function escapeCsvCell(val: unknown, delimiter = ","): string {
  const s = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
  if (s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(delimiter)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toMarkdownTable(headers: string[], rows: string[][]): string {
  const esc = (s: string) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const head = `| ${headers.map(esc).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${headers.map((_, idx) => esc(r[idx] ?? "")).join(" | ")} |`);
  return [head, sep, ...body].join("\n");
}

// ===== LINE DIFF (LCS) =====
function computeLineDiff(leftText: string, rightText: string) {
  const a = leftText.split(/\r?\n/);
  const b = rightText.split(/\r?\n/);
  if (a.length > 600 || b.length > 600) {
    throw new Error("Maksimal 600 baris per sisi untuk perbandingan diff.");
  }
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
    }
  }

  const lines: Array<{ type: "same" | "add" | "del"; leftNo: number | null; rightNo: number | null; text: string }> = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      lines.push({ type: "same", leftNo: i + 1, rightNo: j + 1, text: a[i] });
      unchanged++;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({ type: "del", leftNo: i + 1, rightNo: null, text: a[i] });
      removed++;
      i++;
    } else {
      lines.push({ type: "add", leftNo: null, rightNo: j + 1, text: b[j] });
      added++;
      j++;
    }
  }
  while (i < n) {
    lines.push({ type: "del", leftNo: i + 1, rightNo: null, text: a[i] });
    removed++;
    i++;
  }
  while (j < m) {
    lines.push({ type: "add", leftNo: null, rightNo: j + 1, text: b[j] });
    added++;
    j++;
  }

  return { added, removed, unchanged, lines };
}

// ===== CRON 5-FIELD PARSER =====
const MONTH_MAP: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const DOW_MAP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

function parseCronField(raw: string, min: number, max: number, aliases?: Record<string, number>): Set<number> {
  const out = new Set<number>();
  const upper = raw.toUpperCase();
  const parts = upper.split(",");

  const resolveNum = (tok: string): number => {
    if (aliases && tok in aliases) return aliases[tok];
    const n = parseInt(tok, 10);
    if (!/^\d+$/.test(tok) || Number.isNaN(n)) throw new Error(`Token cron tidak valid: ${tok}`);
    if (max === 6 && n === 7) return 0; // Sunday = 7
    if (n < min || n > max) throw new Error(`Nilai ${n} di luar rentang ${min}-${max}.`);
    return n;
  };

  for (const part of parts) {
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart ? parseInt(stepPart, 10) : 1;
    if (!Number.isInteger(step) || step <= 0) throw new Error(`Step cron tidak valid: ${part}`);

    let start = min;
    let end = max;
    if (rangePart === "*") {
      start = min;
      end = max;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-");
      start = resolveNum(a);
      end = resolveNum(b);
      if (start > end) throw new Error(`Rentang cron terbalik: ${part}`);
    } else {
      start = resolveNum(rangePart);
      end = stepPart ? max : start;
    }

    for (let v = start; v <= end; v += step) out.add(v);
  }
  if (out.size === 0) throw new Error(`Field cron kosong: ${raw}`);
  return out;
}

function describeCronId(fields: string[]): string {
  const [min, hour, dom, mon, dow] = fields;
  const parts: string[] = [];
  if (min === "*" && hour === "*") parts.push("Setiap menit");
  else if (min.startsWith("*/") && hour === "*") parts.push(`Setiap ${min.slice(2)} menit`);
  else if (hour.startsWith("*/")) parts.push(`Pada menit ${min}, setiap ${hour.slice(2)} jam`);
  else if (hour === "*") parts.push(`Setiap jam pada menit ${min}`);
  else parts.push(`Pukul ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`);

  if (dom !== "*") parts.push(`tanggal ${dom}`);
  if (mon !== "*") parts.push(`bulan ${mon}`);
  if (dow !== "*") parts.push(`hari ke-${dow} (0=Min..6=Sab)`);
  if (dom === "*" && mon === "*" && dow === "*") parts.push("setiap hari");
  return parts.join(", ");
}

function getNextCronRuns(expr: string, tzOffsetHours = 7, count = 10): { description: string; nextRuns: string[] } {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Ekspresi cron harus terdiri dari 5 kolom: menit jam tanggal bulan hari.");
  }
  const mins = parseCronField(fields[0], 0, 59);
  const hours = parseCronField(fields[1], 0, 23);
  const doms = parseCronField(fields[2], 1, 31);
  const mons = parseCronField(fields[3], 1, 12, MONTH_MAP);
  const dows = parseCronField(fields[4], 0, 6, DOW_MAP);
  const domWild = fields[2] === "*";
  const dowWild = fields[4] === "*";

  const offsetMs = tzOffsetHours * 3600 * 1000;
  const tzLabel =
    tzOffsetHours === 7 ? "WIB" : tzOffsetHours === 8 ? "WITA" : tzOffsetHours === 9 ? "WIT" : "UTC";

  // Work in shifted UTC date to represent target timezone cleanly
  let cursor = new Date(Date.now() + offsetMs);
  cursor.setUTCSeconds(0, 0);
  cursor = new Date(cursor.getTime() + 60_000);

  const runs: string[] = [];
  const maxSteps = 525_600; // 1 year of minutes
  let steps = 0;

  while (runs.length < count && steps < maxSteps) {
    steps++;
    const mon = cursor.getUTCMonth() + 1;
    if (!mons.has(mon)) {
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1, 0, 0, 0));
      continue;
    }
    const dom = cursor.getUTCDate();
    const dow = cursor.getUTCDay();
    const dayMatch =
      domWild && dowWild
        ? true
        : domWild
        ? dows.has(dow)
        : dowWild
        ? doms.has(dom)
        : doms.has(dom) || dows.has(dow);
    if (!dayMatch) {
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), dom + 1, 0, 0, 0));
      continue;
    }
    const hour = cursor.getUTCHours();
    if (!hours.has(hour)) {
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), dom, hour + 1, 0, 0));
      continue;
    }
    const minute = cursor.getUTCMinutes();
    if (mins.has(minute)) {
      const y = cursor.getUTCFullYear();
      const mo = String(mon).padStart(2, "0");
      const da = String(dom).padStart(2, "0");
      const ho = String(hour).padStart(2, "0");
      const mi = String(minute).padStart(2, "0");
      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      runs.push(`${dayNames[dow]}, ${y}-${mo}-${da} ${ho}:${mi} ${tzLabel}`);
    }
    cursor = new Date(cursor.getTime() + 60_000);
  }

  return { description: describeCronId(fields), nextRuns: runs };
}

// ===== IPv4 CIDR SUBNET CALCULATOR =====
function ipToUint32(ip: string): number {
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    throw new Error("Alamat IPv4 tidak valid.");
  }
  return (((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + parts[3]) >>> 0;
}

function uint32ToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function uint32ToBin(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    .map((o) => o.toString(2).padStart(8, "0"))
    .join(".");
}

function computeSubnet(cidrInput: string) {
  const clean = cidrInput.trim();
  const [ipStr, prefixStr] = clean.split("/");
  const prefix = prefixStr !== undefined ? parseInt(prefixStr, 10) : 24;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("Prefix CIDR harus antara /0 sampai /32.");
  }
  const ipNum = ipToUint32(ipStr);
  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  const wildcard = (~mask) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalIps = Math.pow(2, 32 - prefix);
  const usableHosts = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.max(0, totalIps - 2);
  const firstHost = prefix >= 31 ? network : (network + 1) >>> 0;
  const lastHost = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;

  const firstOctet = (ipNum >>> 24) & 255;
  const secondOctet = (ipNum >>> 16) & 255;
  const ipClass =
    firstOctet < 128 ? "Class A" : firstOctet < 192 ? "Class B" : firstOctet < 224 ? "Class C" : firstOctet < 240 ? "Class D (Multicast)" : "Class E";
  const isPrivate =
    firstOctet === 10 ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168) ||
    firstOctet === 127;

  return {
    cidr: `${uint32ToIp(network)}/${prefix}`,
    inputIp: ipStr,
    prefix,
    networkAddress: uint32ToIp(network),
    broadcastAddress: uint32ToIp(broadcast),
    subnetMask: uint32ToIp(mask),
    wildcardMask: uint32ToIp(wildcard),
    firstHost: uint32ToIp(firstHost),
    lastHost: uint32ToIp(lastHost),
    totalIps,
    usableHosts,
    ipClass,
    scope: isPrivate ? "Privat / Lokal" : "Publik",
    ipBinary: uint32ToBin(ipNum),
    maskBinary: uint32ToBin(mask),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body?.action || "").toLowerCase();

    // 1. Invoice PDF Generator
    if (action === "invoice_pdf") {
      const rawItems = Array.isArray(body.items) ? body.items : [];
      const items: InvoiceItemInput[] = rawItems
        .map((it) => {
          const obj = it as Record<string, unknown>;
          return {
            name: String(obj?.name || "").trim(),
            qty: Number(obj?.qty || 1),
            price: Number(obj?.price || 0),
          };
        })
        .filter((it) => it.name);

      if (items.length === 0) {
        return NextResponse.json({ ok: false, error: "Tambahkan minimal 1 item tagihan." }, { status: 400 });
      }

      const today = new Date().toISOString().slice(0, 10);
      const pdfBuf = buildInvoicePdf({
        invoiceNo: String(body.invoiceNo || `INV-${Date.now().toString().slice(-6)}`).trim(),
        issueDate: String(body.issueDate || today).trim(),
        dueDate: String(body.dueDate || today).trim(),
        senderName: String(body.senderName || "MattzLM Studio").trim(),
        senderInfo: String(body.senderInfo || "").trim(),
        clientName: String(body.clientName || "Klien").trim(),
        clientInfo: String(body.clientInfo || "").trim(),
        currency: String(body.currency || "IDR").trim().toUpperCase(),
        taxPercent: Number(body.taxPercent || 0),
        discount: Number(body.discount || 0),
        notes: String(body.notes || "").trim(),
        items,
      });

      const safeNo = String(body.invoiceNo || "invoice").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
      return new NextResponse(new Uint8Array(pdfBuf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeNo || "invoice"}.pdf"`,
          "X-Output-Bytes": String(pdfBuf.length),
          "Cache-Control": "no-store",
        },
      });
    }

    // 2. CSV / JSON / Markdown Table Converter
    if (action === "csv_json") {
      const mode = String(body.mode || "csv2json").toLowerCase();
      const input = String(body.input || "").trim();
      const delimiter = String(body.delimiter || ",") === ";" ? ";" : String(body.delimiter || ",") === "\t" ? "\t" : ",";
      if (!input) return NextResponse.json({ ok: false, error: "Masukkan data CSV atau JSON terlebih dahulu." }, { status: 400 });
      if (input.length > 400_000) return NextResponse.json({ ok: false, error: "Ukuran input maksimal 400KB." }, { status: 400 });

      if (mode === "csv2json" || mode === "csv2md") {
        const rows = parseCsv(input, delimiter);
        if (rows.length < 2) {
          return NextResponse.json({ ok: false, error: "CSV minimal butuh 1 baris header dan 1 baris data." }, { status: 400 });
        }
        const headers = rows[0].map((h, i) => h.trim() || `col_${i + 1}`);
        const dataRows = rows.slice(1);
        if (mode === "csv2md") {
          return NextResponse.json({
            ok: true,
            action: "csv_json",
            mode,
            rowCount: dataRows.length,
            output: toMarkdownTable(headers, dataRows),
          });
        }
        const objects = dataRows.map((r) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            obj[h] = r[idx] ?? "";
          });
          return obj;
        });
        return NextResponse.json({
          ok: true,
          action: "csv_json",
          mode,
          rowCount: objects.length,
          output: JSON.stringify(objects, null, 2),
        });
      }

      if (mode === "json2csv" || mode === "json2md") {
        let parsed: unknown;
        try {
          parsed = JSON.parse(input);
        } catch {
          return NextResponse.json({ ok: false, error: "Input bukan JSON yang valid." }, { status: 400 });
        }
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        if (arr.length === 0 || typeof arr[0] !== "object" || arr[0] === null) {
          return NextResponse.json({ ok: false, error: "JSON harus berupa array of objects." }, { status: 400 });
        }
        const keySet = new Set<string>();
        for (const item of arr) {
          if (item && typeof item === "object") {
            Object.keys(item as Record<string, unknown>).forEach((k) => keySet.add(k));
          }
        }
        const headers = [...keySet];
        const rows = arr.map((item) => {
          const obj = (item || {}) as Record<string, unknown>;
          return headers.map((h) => {
            const v = obj[h];
            return v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
          });
        });

        if (mode === "json2md") {
          return NextResponse.json({
            ok: true,
            action: "csv_json",
            mode,
            rowCount: rows.length,
            output: toMarkdownTable(headers, rows),
          });
        }
        const csvLines = [
          headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter),
          ...rows.map((r) => r.map((c) => escapeCsvCell(c, delimiter)).join(delimiter)),
        ];
        return NextResponse.json({
          ok: true,
          action: "csv_json",
          mode,
          rowCount: rows.length,
          output: csvLines.join("\n"),
        });
      }

      return NextResponse.json({ ok: false, error: "Mode konversi tidak dikenal." }, { status: 400 });
    }

    // 3. Text & Code Diff
    if (action === "diff") {
      const left = String(body.left ?? "");
      const right = String(body.right ?? "");
      const res = computeLineDiff(left, right);
      return NextResponse.json({ ok: true, action: "diff", ...res });
    }

    // 4. Regex Tester & Replace
    if (action === "regex") {
      const pattern = String(body.pattern || "");
      const flagsRaw = String(body.flags || "g");
      const text = String(body.text || "");
      const replacement = body.replacement !== undefined ? String(body.replacement) : null;
      if (!pattern) return NextResponse.json({ ok: false, error: "Pola regex wajib diisi." }, { status: 400 });
      if (pattern.length > 300 || text.length > 100_000) {
        return NextResponse.json({ ok: false, error: "Pola atau teks terlalu panjang." }, { status: 400 });
      }
      const allowedFlags = [...new Set(flagsRaw.replace(/[^gimsu]/g, "").split(""))].join("");
      let rx: RegExp;
      try {
        rx = new RegExp(pattern, allowedFlags);
      } catch (e) {
        return NextResponse.json(
          { ok: false, error: "Regex tidak valid: " + (e instanceof Error ? e.message : "") },
          { status: 400 }
        );
      }

      const matches: Array<{ index: number; value: string; groups: string[] }> = [];
      if (allowedFlags.includes("g")) {
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = rx.exec(text)) !== null && guard < 200) {
          guard++;
          matches.push({ index: m.index, value: m[0], groups: m.slice(1).map((g) => g ?? "") });
          if (m[0] === "") rx.lastIndex++;
        }
      } else {
        const m = rx.exec(text);
        if (m) matches.push({ index: m.index, value: m[0], groups: m.slice(1).map((g) => g ?? "") });
      }

      const replaced = replacement !== null ? text.replace(new RegExp(pattern, allowedFlags), replacement) : null;

      return NextResponse.json({
        ok: true,
        action: "regex",
        pattern,
        flags: allowedFlags,
        matchCount: matches.length,
        matches,
        replaced,
      });
    }

    // 5. Cron Schedule Parser
    if (action === "cron") {
      const expression = String(body.expression || "").trim();
      const tzOffset = Number(body.tzOffset ?? 7);
      if (!expression) return NextResponse.json({ ok: false, error: "Ekspresi cron wajib diisi." }, { status: 400 });
      const result = getNextCronRuns(expression, Number.isFinite(tzOffset) ? tzOffset : 7, 10);
      return NextResponse.json({ ok: true, action: "cron", expression, ...result });
    }

    // 6. CIDR Subnet Calculator
    if (action === "subnet") {
      const cidr = String(body.cidr || "").trim();
      if (!cidr) return NextResponse.json({ ok: false, error: "Masukkan IP/CIDR, contoh 192.168.1.0/24." }, { status: 400 });
      const result = computeSubnet(cidr);
      return NextResponse.json({ ok: true, action: "subnet", ...result });
    }

    return NextResponse.json({ ok: false, error: "Action text-pdf tidak dikenal." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses permintaan.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
