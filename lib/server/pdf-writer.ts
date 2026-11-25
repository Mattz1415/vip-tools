export interface PdfImagePage {
  jpeg: Buffer;
  width: number;
  height: number;
}

export interface InvoiceItemInput {
  name: string;
  qty: number;
  price: number;
}

export interface InvoicePdfInput {
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  senderName: string;
  senderInfo: string;
  clientName: string;
  clientInfo: string;
  currency: string;
  taxPercent: number;
  discount: number;
  notes: string;
  items: InvoiceItemInput[];
}

function pdfTextSafe(input: string): string {
  const clean = String(input || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E]/g, (ch) => {
      const map: Record<string, string> = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201C": '"',
        "\u201D": '"',
        "\u2022": "*",
      };
      return map[ch] || " ";
    })
    .trim();
  return clean.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (!current) {
      current = w.slice(0, maxChars);
    } else if (current.length + 1 + w.length <= maxChars) {
      current += " " + w;
    } else {
      lines.push(current);
      current = w.slice(0, maxChars);
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatMoney(amount: number, currency: string): string {
  const cur = currency.toUpperCase();
  const safe = Number.isFinite(amount) ? amount : 0;
  if (cur === "IDR" || cur === "RP") {
    return "Rp " + Math.round(safe).toLocaleString("en-US").replace(/,/g, ".");
  }
  const symbol = cur === "USD" ? "$" : cur === "EUR" ? "EUR " : cur === "SGD" ? "S$" : `${cur} `;
  return symbol + safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function assemblePdf(objectBodies: Buffer[]): Buffer {
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  let offset = chunks[0].length;
  const offsets: number[] = [0];

  for (let i = 0; i < objectBodies.length; i++) {
    const objId = i + 1;
    offsets.push(offset);
    const header = Buffer.from(`${objId} 0 obj\n`, "ascii");
    const footer = Buffer.from("\nendobj\n", "ascii");
    chunks.push(header, objectBodies[i], footer);
    offset += header.length + objectBodies[i].length + footer.length;
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${objectBodies.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objectBodies.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "ascii"));
  return Buffer.concat(chunks);
}

export function buildImagesPdf(pages: PdfImagePage[]): Buffer {
  if (pages.length === 0) {
    throw new Error("Minimal satu gambar diperlukan untuk membuat PDF.");
  }

  // Object 1: Catalog, Object 2: Pages
  // For each page i (0..N-1):
  //   imgObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   pageObjId = 5 + i * 3
  const pageObjIds: number[] = [];
  const bodies: Buffer[] = [Buffer.alloc(0), Buffer.alloc(0)];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const imgObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const pageObjId = 5 + i * 3;
    pageObjIds.push(pageObjId);

    const landscape = p.width > p.height;
    const pageW = landscape ? 841.89 : 595.28;
    const pageH = landscape ? 595.28 : 841.89;
    const margin = 24;
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const scale = Math.min(availW / Math.max(1, p.width), availH / Math.max(1, p.height));
    const drawW = p.width * scale;
    const drawH = p.height * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    const imgHeader = Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
      "ascii"
    );
    const imgFooter = Buffer.from("\nendstream", "ascii");
    bodies.push(Buffer.concat([imgHeader, p.jpeg, imgFooter]));

    const contentStr = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${i} Do\nQ\n`;
    const contentBuf = Buffer.from(contentStr, "ascii");
    bodies.push(
      Buffer.from(
        `<< /Length ${contentBuf.length} >>\nstream\n${contentStr}endstream`,
        "ascii"
      )
    );

    bodies.push(
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im${i} ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`,
        "ascii"
      )
    );
  }

  bodies[0] = Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "ascii");
  bodies[1] = Buffer.from(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjIds.length} >>`,
    "ascii"
  );

  return assemblePdf(bodies);
}

export function buildInvoicePdf(input: InvoicePdfInput): Buffer {
  const pageW = 595.28;
  const pageH = 841.89;
  const cmds: string[] = [];

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    font: "F1" | "F2" | "F3" = "F1",
    gray = 0.08
  ) => {
    cmds.push(`${gray.toFixed(2)} g BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfTextSafe(text)}) Tj ET`);
  };

  const drawRightText = (
    text: string,
    rightX: number,
    y: number,
    size: number,
    font: "F1" | "F2" | "F3" = "F1",
    gray = 0.08
  ) => {
    const safe = pdfTextSafe(text);
    const charW = font === "F3" ? size * 0.6 : size * 0.52;
    const estW = safe.length * charW;
    drawText(text, Math.max(40, rightX - estW), y, size, font, gray);
  };

  const drawRect = (x: number, y: number, w: number, h: number, fillGray: number) => {
    cmds.push(`${fillGray.toFixed(2)} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, strokeGray = 0.82, width = 0.8) => {
    cmds.push(`${strokeGray.toFixed(2)} G ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  // Top monochrome header band
  drawRect(40, pageH - 122, pageW - 80, 82, 0.07);
  drawText("INVOICE", 60, pageH - 76, 26, "F2", 0.98);
  drawText(input.senderName || "MattzLM Studio", 60, pageH - 98, 11, "F1", 0.82);

  drawRightText(`NO: ${input.invoiceNo || "INV-001"}`, pageW - 60, pageH - 68, 11, "F3", 0.96);
  drawRightText(`Tanggal: ${input.issueDate || "-"}`, pageW - 60, pageH - 86, 9.5, "F1", 0.84);
  drawRightText(`Jatuh Tempo: ${input.dueDate || "-"}`, pageW - 60, pageH - 102, 9.5, "F1", 0.84);

  // From & Bill To blocks
  let y = pageH - 154;
  drawText("DARI", 40, y, 8.5, "F2", 0.45);
  drawText("TAGIHAN KEPADA", 315, y, 8.5, "F2", 0.45);
  y -= 16;
  drawText(input.senderName || "Pengirim", 40, y, 11.5, "F2", 0.08);
  drawText(input.clientName || "Klien", 315, y, 11.5, "F2", 0.08);

  const senderLines = wrapText(input.senderInfo || "", 42).slice(0, 3);
  const clientLines = wrapText(input.clientInfo || "", 42).slice(0, 3);
  const metaRows = Math.max(senderLines.length, clientLines.length, 1);
  for (let i = 0; i < metaRows; i++) {
    y -= 14;
    if (senderLines[i]) drawText(senderLines[i], 40, y, 9.5, "F1", 0.3);
    if (clientLines[i]) drawText(clientLines[i], 315, y, 9.5, "F1", 0.3);
  }

  // Table header
  y -= 30;
  drawRect(40, y - 6, pageW - 80, 24, 0.14);
  drawText("NO", 50, y + 2, 9, "F2", 0.98);
  drawText("ITEM / DESKRIPSI", 82, y + 2, 9, "F2", 0.98);
  drawRightText("QTY", 355, y + 2, 9, "F2", 0.98);
  drawRightText("HARGA", 450, y + 2, 9, "F2", 0.98);
  drawRightText("SUBTOTAL", pageW - 50, y + 2, 9, "F2", 0.98);

  y -= 24;
  let subtotal = 0;
  const rows = input.items.slice(0, 18);

  rows.forEach((item, idx) => {
    const qty = Math.max(0, Number(item.qty) || 0);
    const price = Math.max(0, Number(item.price) || 0);
    const lineTotal = qty * price;
    subtotal += lineTotal;

    if (idx % 2 === 1) {
      drawRect(40, y - 6, pageW - 80, 22, 0.96);
    }
    drawText(String(idx + 1), 50, y + 1, 9.5, "F3", 0.3);
    drawText(String(item.name || "Item").slice(0, 46), 82, y + 1, 9.5, "F1", 0.08);
    drawRightText(String(qty), 355, y + 1, 9.5, "F3", 0.2);
    drawRightText(formatMoney(price, input.currency), 450, y + 1, 9.5, "F3", 0.2);
    drawRightText(formatMoney(lineTotal, input.currency), pageW - 50, y + 1, 9.5, "F3", 0.08);
    drawLine(40, y - 6, pageW - 40, y - 6, 0.88, 0.6);
    y -= 22;
  });

  const discount = Math.max(0, Number(input.discount) || 0);
  const taxPct = Math.min(100, Math.max(0, Number(input.taxPercent) || 0));
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = afterDiscount * (taxPct / 100);
  const grandTotal = afterDiscount + taxAmount;

  // Totals box
  y -= 14;
  drawText("Subtotal", 355, y, 10, "F1", 0.35);
  drawRightText(formatMoney(subtotal, input.currency), pageW - 50, y, 10, "F3", 0.12);
  y -= 18;
  if (discount > 0) {
    drawText("Diskon", 355, y, 10, "F1", 0.35);
    drawRightText(`- ${formatMoney(discount, input.currency)}`, pageW - 50, y, 10, "F3", 0.12);
    y -= 18;
  }
  if (taxPct > 0) {
    drawText(`Pajak (${taxPct}%)`, 355, y, 10, "F1", 0.35);
    drawRightText(formatMoney(taxAmount, input.currency), pageW - 50, y, 10, "F3", 0.12);
    y -= 18;
  }

  drawRect(345, y - 8, pageW - 385, 28, 0.08);
  drawText("TOTAL", 358, y + 2, 11.5, "F2", 0.98);
  drawRightText(formatMoney(grandTotal, input.currency), pageW - 50, y + 2, 11.5, "F3", 0.98);

  // Notes section
  if (input.notes && input.notes.trim()) {
    let ny = Math.min(y - 44, 150);
    if (ny < 95) ny = 95;
    drawLine(40, ny + 18, pageW - 40, ny + 18, 0.84, 0.8);
    drawText("CATATAN & PEMBAYARAN", 40, ny + 4, 8.5, "F2", 0.4);
    const noteLines = wrapText(input.notes, 85).slice(0, 4);
    noteLines.forEach((line, i) => {
      drawText(line, 40, ny - 12 - i * 13, 9.2, "F1", 0.25);
    });
  }

  drawText("Dibuat dengan MattzLM Invoice Generator", 40, 34, 8, "F1", 0.55);

  const streamContent = cmds.join("\n") + "\n";
  const bodies: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "ascii"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "ascii"),
    Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>`,
      "ascii"
    ),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "ascii"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", "ascii"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>", "ascii"),
    Buffer.from(
      `<< /Length ${Buffer.byteLength(streamContent, "ascii")} >>\nstream\n${streamContent}endstream`,
      "ascii"
    ),
  ];

  return assemblePdf(bodies);
}
