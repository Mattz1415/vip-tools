import dns from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { assertPublicHost, assertPublicHttpUrl } from "@/lib/server/net-guard";

const UA = "MattzLM-VPS-Inspector/2.0 (+https://github.com/Mattz1415)";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "throwawaymail.com",
  "sharklasers.com",
  "trashmail.com",
  "getnada.com",
  "mohmal.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mintemail.com",
]);

function normalizeUrlInput(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = parseInt(n, 10);
      return Number.isFinite(code) && code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : "";
    });
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

async function safeFetchPublic(
  rawUrl: string,
  opts: { method?: string; timeoutMs?: number; maxRedirects?: number; maxBytes?: number } = {}
): Promise<{
  finalUrl: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  hops: Array<{ url: string; status: number; location: string | null; latencyMs: number }>;
  totalLatencyMs: number;
}> {
  const method = opts.method || "GET";
  const timeoutMs = opts.timeoutMs || 10_000;
  const maxRedirects = opts.maxRedirects ?? 6;
  const maxBytes = opts.maxBytes ?? 600_000;

  let currentUrl = normalizeUrlInput(rawUrl);
  const hops: Array<{ url: string; status: number; location: string | null; latencyMs: number }> = [];
  const tStart = Date.now();

  for (let i = 0; i <= maxRedirects; i++) {
    const parsed = await assertPublicHttpUrl(currentUrl);
    const hopStart = Date.now();
    const res = await fetch(parsed.toString(), {
      method,
      redirect: "manual",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml,text/plain,application/json;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const hopMs = Date.now() - hopStart;
    const loc = res.headers.get("location");
    hops.push({ url: parsed.toString(), status: res.status, location: loc, latencyMs: hopMs });

    if (res.status >= 300 && res.status < 400 && loc && i < maxRedirects) {
      try {
        res.body?.cancel().catch(() => {});
      } catch {}
      currentUrl = new URL(loc, parsed).toString();
      continue;
    }

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    let body = "";
    if (method !== "HEAD") {
      const reader = res.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let total = 0;
        while (total < maxBytes) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          const take = value.byteLength + total > maxBytes ? value.subarray(0, maxBytes - total) : value;
          chunks.push(take);
          total += take.byteLength;
        }
        try {
          reader.cancel().catch(() => {});
        } catch {}
        body = Buffer.concat(chunks).toString("utf8");
      }
    }

    return {
      finalUrl: parsed.toString(),
      status: res.status,
      statusText: res.statusText,
      headers,
      body,
      hops,
      totalLatencyMs: Date.now() - tStart,
    };
  }

  throw new Error("Terlalu banyak redirect (>6 kali).");
}

function getMetaTag(html: string, attrName: string, attrVal: string): string {
  const re = new RegExp(
    `<meta[^>]*${attrName}=["']${attrVal}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*${attrName}=["']${attrVal}["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m ? decodeHtmlEntities((m[1] || m[2] || "").trim()) : "";
}

function htmlToMarkdown(html: string, baseUrl: string): string {
  let content = html;
  const mainMatch =
    content.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
    content.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
    content.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (mainMatch) content = mainMatch[1];

  content = content
    .replace(/<(script|style|noscript|svg|iframe|nav|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "\n")
    .replace(/<!--[\s\S]*?-->/g, "");

  content = content.replace(/<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return `\n\`\`\`\n${decodeHtmlEntities(code.replace(/<[^>]+>/g, "")).trim()}\n\`\`\`\n`;
  });

  content = content.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, inner) => {
    const txt = stripTags(inner);
    return txt ? `\n${"#".repeat(Number(lvl))} ${txt}\n\n` : "";
  });

  content = content.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    const label = stripTags(inner);
    if (!label) return "";
    try {
      const abs = new URL(href, baseUrl).toString();
      return `[${label}](${abs})`;
    } catch {
      return label;
    }
  });

  content = content.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
    const txt = stripTags(inner);
    return txt ? `\n- ${txt}` : "";
  });

  content = content.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    const txt = stripTags(inner);
    return txt ? `\n> ${txt}\n` : "";
  });

  content = content.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, inner) => {
    const txt = stripTags(inner);
    return txt ? `**${txt}**` : "";
  });

  content = content.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
    const txt = stripTags(inner);
    return txt ? `\`${txt}\`` : "";
  });

  content = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|tr|ul|ol)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(content)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractXmlTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return decodeHtmlEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

let cachedRates: { fetchedAt: number; base: string; rates: Record<string, number> } | null = null;
const FALLBACK_RATES_USD: Record<string, number> = {
  USD: 1,
  IDR: 16250,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 153.5,
  SGD: 1.34,
  MYR: 4.42,
  AUD: 1.54,
  KRW: 1390,
  CNY: 7.24,
  THB: 34.5,
  PHP: 58.2,
  SAR: 3.75,
};

async function getUsdRates(): Promise<{ rates: Record<string, number>; source: string; updatedAt: string }> {
  if (cachedRates && Date.now() - cachedRates.fetchedAt < 30 * 60 * 1000) {
    return {
      rates: cachedRates.rates,
      source: "open.er-api.com (cache)",
      updatedAt: new Date(cachedRates.fetchedAt).toISOString(),
    };
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
      if (json.result === "success" && json.rates && json.rates.IDR) {
        cachedRates = { fetchedAt: Date.now(), base: "USD", rates: json.rates };
        return {
          rates: json.rates,
          source: "open.er-api.com (live)",
          updatedAt: json.time_last_update_utc || new Date().toISOString(),
        };
      }
    }
  } catch {
    // fallback below
  }
  return {
    rates: FALLBACK_RATES_USD,
    source: "referensi-offline",
    updatedAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body?.action || "").toLowerCase();

    // 1. SEO & OpenGraph Meta Inspector
    if (action === "seo") {
      const target = String(body.target || "").trim();
      if (!target) return NextResponse.json({ ok: false, error: "Masukkan URL website target." }, { status: 400 });

      const fetched = await safeFetchPublic(target);
      const html = fetched.body;
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim()) : "";
      const description = getMetaTag(html, "name", "description");
      const robots = getMetaTag(html, "name", "robots");
      const viewport = getMetaTag(html, "name", "viewport");
      const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
      const canonical = canonicalMatch ? canonicalMatch[1] : "";
      const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);

      const og = {
        title: getMetaTag(html, "property", "og:title"),
        description: getMetaTag(html, "property", "og:description"),
        image: getMetaTag(html, "property", "og:image"),
        type: getMetaTag(html, "property", "og:type"),
        url: getMetaTag(html, "property", "og:url"),
      };
      const twitter = {
        card: getMetaTag(html, "name", "twitter:card"),
        title: getMetaTag(html, "name", "twitter:title"),
        description: getMetaTag(html, "name", "twitter:description"),
        image: getMetaTag(html, "name", "twitter:image"),
      };

      const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
        .map((m) => stripTags(m[1]))
        .filter(Boolean)
        .slice(0, 10);
      const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
        .map((m) => stripTags(m[1]))
        .filter(Boolean)
        .slice(0, 12);

      const imgMatches = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
      const imgsWithoutAlt = imgMatches.filter((tag) => !/\balt=["'][^"']+["']/i.test(tag)).length;

      const checks = [
        { label: "Tag <title> (30-65 karakter)", pass: title.length >= 15 && title.length <= 70, detail: `${title.length} karakter` },
        { label: "Meta description (70-160 karakter)", pass: description.length >= 50 && description.length <= 170, detail: `${description.length} karakter` },
        { label: "Heading H1 tunggal", pass: h1s.length === 1, detail: `${h1s.length} H1 ditemukan` },
        { label: "Canonical URL", pass: Boolean(canonical), detail: canonical || "Belum ada" },
        { label: "OpenGraph (og:title & og:image)", pass: Boolean(og.title && og.image), detail: og.image ? "Lengkap" : "Belum lengkap" },
        { label: "Viewport mobile", pass: Boolean(viewport), detail: viewport ? "Ada" : "Tidak ada" },
        { label: "Atribut alt pada gambar", pass: imgsWithoutAlt === 0, detail: `${imgMatches.length - imgsWithoutAlt}/${imgMatches.length} punya alt` },
      ];
      const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);

      return NextResponse.json({
        ok: true,
        action: "seo",
        finalUrl: fetched.finalUrl,
        status: fetched.status,
        latencyMs: fetched.totalLatencyMs,
        score,
        lang: langMatch ? langMatch[1] : "-",
        title,
        description,
        robots: robots || "-",
        canonical: canonical || "-",
        viewport: viewport || "-",
        og,
        twitter,
        h1s,
        h2s,
        imagesTotal: imgMatches.length,
        imgsWithoutAlt,
        checks,
      });
    }

    // 2. Security Headers Grader
    if (action === "security") {
      const target = String(body.target || "").trim();
      if (!target) return NextResponse.json({ ok: false, error: "Masukkan URL target." }, { status: 400 });

      const fetched = await safeFetchPublic(target, { maxBytes: 16_000 });
      const h = fetched.headers;
      const isHttps = fetched.finalUrl.startsWith("https://");

      const audit = [
        {
          header: "Strict-Transport-Security",
          present: Boolean(h["strict-transport-security"]),
          value: h["strict-transport-security"] || "Tidak ada",
          weight: 20,
          tip: "Aktifkan HSTS (max-age=31536000; includeSubDomains) untuk memaksa HTTPS.",
        },
        {
          header: "Content-Security-Policy",
          present: Boolean(h["content-security-policy"]),
          value: (h["content-security-policy"] || "Tidak ada").slice(0, 180),
          weight: 25,
          tip: "Tambahkan CSP untuk mencegah XSS dan injeksi skrip pihak ketiga.",
        },
        {
          header: "X-Content-Type-Options",
          present: (h["x-content-type-options"] || "").toLowerCase() === "nosniff",
          value: h["x-content-type-options"] || "Tidak ada",
          weight: 15,
          tip: "Setel ke nosniff agar browser tidak menebak MIME type.",
        },
        {
          header: "X-Frame-Options / frame-ancestors",
          present:
            Boolean(h["x-frame-options"]) ||
            (h["content-security-policy"] || "").toLowerCase().includes("frame-ancestors"),
          value: h["x-frame-options"] || (h["content-security-policy"]?.includes("frame-ancestors") ? "Via CSP frame-ancestors" : "Tidak ada"),
          weight: 15,
          tip: "Setel DENY atau SAMEORIGIN untuk mencegah clickjacking.",
        },
        {
          header: "Referrer-Policy",
          present: Boolean(h["referrer-policy"]),
          value: h["referrer-policy"] || "Tidak ada",
          weight: 10,
          tip: "Gunakan strict-origin-when-cross-origin untuk menjaga privasi URL.",
        },
        {
          header: "Permissions-Policy",
          present: Boolean(h["permissions-policy"]),
          value: (h["permissions-policy"] || "Tidak ada").slice(0, 160),
          weight: 10,
          tip: "Batasi akses kamera, mikrofon, dan geolokasi lewat Permissions-Policy.",
        },
        {
          header: "HTTPS Active",
          present: isHttps,
          value: isHttps ? "HTTPS" : "HTTP tidak terenkripsi",
          weight: 5,
          tip: "Gunakan sertifikat TLS aktif pada domain.",
        },
      ];

      const score = audit.reduce((acc, item) => acc + (item.present ? item.weight : 0), 0);
      const grade =
        score >= 90 ? "A+" : score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "F";

      const leaks = ["server", "x-powered-by", "x-aspnet-version"]
        .filter((k) => h[k])
        .map((k) => ({ header: k, value: h[k] }));

      return NextResponse.json({
        ok: true,
        action: "security",
        finalUrl: fetched.finalUrl,
        status: fetched.status,
        score,
        grade,
        audit,
        leaks,
      });
    }

    // 3. Redirect Chain & Page Link Checker
    if (action === "redirect") {
      const target = String(body.target || "").trim();
      const checkLinks = Boolean(body.checkLinks);
      if (!target) return NextResponse.json({ ok: false, error: "Masukkan URL target." }, { status: 400 });

      const fetched = await safeFetchPublic(target, { maxBytes: checkLinks ? 260_000 : 16_000 });
      const checkedLinks: Array<{ url: string; status: number | string; ok: boolean; latencyMs: number }> = [];

      if (checkLinks && fetched.body) {
        const found = new Set<string>();
        for (const m of fetched.body.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
          try {
            const u = new URL(m[1], fetched.finalUrl);
            if (u.protocol === "http:" || u.protocol === "https:") {
              found.add(u.toString());
              if (found.size >= 12) break;
            }
          } catch {}
        }

        const list = [...found];
        const results = await Promise.all(
          list.map(async (linkUrl) => {
            const t0 = Date.now();
            try {
              await assertPublicHttpUrl(linkUrl);
              const r = await fetch(linkUrl, {
                method: "HEAD",
                redirect: "follow",
                headers: { "User-Agent": UA },
                signal: AbortSignal.timeout(4500),
              });
              return { url: linkUrl, status: r.status, ok: r.status < 400, latencyMs: Date.now() - t0 };
            } catch {
              return { url: linkUrl, status: "ERR", ok: false, latencyMs: Date.now() - t0 };
            }
          })
        );
        checkedLinks.push(...results);
      }

      return NextResponse.json({
        ok: true,
        action: "redirect",
        finalUrl: fetched.finalUrl,
        finalStatus: fetched.status,
        totalLatencyMs: fetched.totalLatencyMs,
        hops: fetched.hops,
        checkedLinks,
      });
    }

    // 4. Robots.txt & Sitemap.xml Parser
    if (action === "sitemap") {
      const raw = String(body.target || "").trim();
      if (!raw) return NextResponse.json({ ok: false, error: "Masukkan domain atau URL target." }, { status: 400 });
      const parsed = await assertPublicHttpUrl(normalizeUrlInput(raw));
      const origin = parsed.origin;

      let robotsText = "";
      let robotsStatus = 0;
      const sitemapCandidates = new Set<string>();

      try {
        const r = await safeFetchPublic(`${origin}/robots.txt`, { maxBytes: 100_000, timeoutMs: 7000 });
        robotsStatus = r.status;
        if (r.status >= 200 && r.status < 300) {
          robotsText = r.body.slice(0, 12_000);
          for (const line of robotsText.split(/\r?\n/)) {
            const m = line.match(/^sitemap:\s*(https?:\/\/\S+)/i);
            if (m) sitemapCandidates.add(m[1].trim());
          }
        }
      } catch {}

      if (sitemapCandidates.size === 0) {
        sitemapCandidates.add(`${origin}/sitemap.xml`);
      }

      const sitemapUrl = [...sitemapCandidates][0];
      let sitemapStatus = 0;
      const urls: string[] = [];
      try {
        const s = await safeFetchPublic(sitemapUrl, { maxBytes: 350_000, timeoutMs: 8000 });
        sitemapStatus = s.status;
        if (s.status >= 200 && s.status < 300) {
          for (const m of s.body.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)) {
            const u = decodeHtmlEntities(m[1].trim());
            if (u) urls.push(u);
            if (urls.length >= 60) break;
          }
        }
      } catch {}

      return NextResponse.json({
        ok: true,
        action: "sitemap",
        origin,
        robotsUrl: `${origin}/robots.txt`,
        robotsStatus,
        robotsPreview: robotsText || "robots.txt tidak ditemukan.",
        sitemapUrl,
        sitemapStatus,
        sitemapsDeclared: [...sitemapCandidates],
        urlCount: urls.length,
        urls,
      });
    }

    // 5. Email Domain Validator (MX, SPF, DMARC, Disposable)
    if (action === "email") {
      const raw = String(body.target || "").trim().toLowerCase();
      if (!raw) return NextResponse.json({ ok: false, error: "Masukkan alamat email atau domain." }, { status: 400 });

      const hasAt = raw.includes("@");
      const syntaxValid = hasAt ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) : /^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw);
      const domain = hasAt ? raw.split("@").pop() || "" : raw;
      if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
        return NextResponse.json({ ok: false, error: "Format email atau domain tidak valid." }, { status: 400 });
      }
      await assertPublicHost(domain).catch(() => {});

      const [mxRes, txtRes, dmarcRes] = await Promise.allSettled([
        dns.resolveMx(domain),
        dns.resolveTxt(domain),
        dns.resolveTxt(`_dmarc.${domain}`),
      ]);

      const mx =
        mxRes.status === "fulfilled"
          ? mxRes.value.sort((a, b) => a.priority - b.priority)
          : [];
      const txtAll =
        txtRes.status === "fulfilled" ? txtRes.value.map((parts) => parts.join("")) : [];
      const spf = txtAll.find((t) => t.toLowerCase().startsWith("v=spf1")) || null;
      const dmarcAll =
        dmarcRes.status === "fulfilled" ? dmarcRes.value.map((parts) => parts.join("")) : [];
      const dmarc = dmarcAll.find((t) => t.toLowerCase().startsWith("v=dmarc1")) || null;
      const disposable = DISPOSABLE_DOMAINS.has(domain);

      const deliverable = syntaxValid && mx.length > 0 && !disposable;

      return NextResponse.json({
        ok: true,
        action: "email",
        input: raw,
        domain,
        syntaxValid,
        disposable,
        deliverable,
        mx,
        spf,
        dmarc,
      });
    }

    // 6. Multi-Sample HTTP Latency & Uptime Probe
    if (action === "uptime") {
      const target = String(body.target || "").trim();
      const samples = Math.min(5, Math.max(2, Number(body.samples || 3)));
      if (!target) return NextResponse.json({ ok: false, error: "Masukkan URL target." }, { status: 400 });
      const parsed = await assertPublicHttpUrl(normalizeUrlInput(target));

      const runs: Array<{ run: number; status: number | string; ok: boolean; latencyMs: number; bytes: number }> = [];
      for (let i = 1; i <= samples; i++) {
        const t0 = Date.now();
        try {
          const r = await fetch(parsed.toString(), {
            method: "GET",
            redirect: "follow",
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(8000),
          });
          const buf = await r.arrayBuffer();
          runs.push({
            run: i,
            status: r.status,
            ok: r.status >= 200 && r.status < 400,
            latencyMs: Date.now() - t0,
            bytes: buf.byteLength,
          });
        } catch {
          runs.push({ run: i, status: "TIMEOUT/ERR", ok: false, latencyMs: Date.now() - t0, bytes: 0 });
        }
      }

      const latencies = runs.map((r) => r.latencyMs);
      const okCount = runs.filter((r) => r.ok).length;
      return NextResponse.json({
        ok: true,
        action: "uptime",
        target: parsed.toString(),
        availabilityPercent: Math.round((okCount / runs.length) * 100),
        minMs: Math.min(...latencies),
        avgMs: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
        maxMs: Math.max(...latencies),
        runs,
      });
    }

    // 7. Web Tech Stack Detector
    if (action === "tech") {
      const target = String(body.target || "").trim();
      if (!target) return NextResponse.json({ ok: false, error: "Masukkan URL website target." }, { status: 400 });

      const fetched = await safeFetchPublic(target, { maxBytes: 300_000 });
      const h = fetched.headers;
      const html = fetched.body;
      const detected: Array<{ name: string; category: string; evidence: string }> = [];
      const add = (name: string, category: string, evidence: string) => {
        if (!detected.some((d) => d.name === name)) detected.push({ name, category, evidence });
      };

      const server = h["server"] || "";
      const powered = h["x-powered-by"] || "";
      if (/cloudflare/i.test(server) || h["cf-ray"]) add("Cloudflare", "CDN / WAF", h["cf-ray"] ? `cf-ray: ${h["cf-ray"]}` : `server: ${server}`);
      if (/vercel/i.test(server) || h["x-vercel-id"]) add("Vercel", "Hosting", h["x-vercel-id"] ? "x-vercel-id" : server);
      if (/netlify/i.test(server) || h["x-nf-request-id"]) add("Netlify", "Hosting", "x-nf-request-id / server");
      if (/nginx/i.test(server)) add("Nginx", "Web Server", server);
      if (/apache/i.test(server)) add("Apache", "Web Server", server);
      if (/litespeed/i.test(server)) add("LiteSpeed", "Web Server", server);
      if (/next\.js/i.test(powered) || /\/_next\/static\//i.test(html) || /__NEXT_DATA__/i.test(html)) add("Next.js", "Framework", "/_next/static atau x-powered-by");
      if (/nuxt/i.test(html) || /__NUXT__/i.test(html)) add("Nuxt.js", "Framework", "__NUXT__");
      if (/wp-content|wp-includes/i.test(html)) add("WordPress", "CMS", "wp-content / wp-includes");
      if (/cdn\.shopify\.com|Shopify\.theme/i.test(html)) add("Shopify", "E-Commerce", "cdn.shopify.com");
      if (/react|data-reactroot|__REACT/i.test(html)) add("React", "UI Library", "Marker React di HTML");
      if (/data-v-[a-f0-9]+|vue(\.min)?\.js/i.test(html)) add("Vue.js", "UI Library", "Marker Vue di HTML");
      if (/svelte|__sveltekit/i.test(html)) add("Svelte / SvelteKit", "Framework", "Marker Svelte");
      if (/astro-island/i.test(html)) add("Astro", "Framework", "astro-island");
      if (/tailwindcss|tw-/i.test(html)) add("Tailwind CSS", "CSS", "Class / bundle Tailwind");
      if (/bootstrap(\.min)?\.(css|js)/i.test(html)) add("Bootstrap", "CSS", "Asset Bootstrap");
      if (/jquery(\.min)?\.js/i.test(html)) add("jQuery", "JavaScript", "Asset jQuery");
      if (/googletagmanager\.com|gtag\(/i.test(html)) add("Google Analytics / GTM", "Analytics", "googletagmanager.com");
      if (/fonts\.googleapis\.com/i.test(html)) add("Google Fonts", "Typography", "fonts.googleapis.com");
      if (/font-awesome|fontawesome/i.test(html)) add("Font Awesome", "Icons", "Asset Font Awesome");
      if (/php/i.test(powered)) add("PHP", "Runtime", `x-powered-by: ${powered}`);
      if (/express/i.test(powered)) add("Express.js", "Runtime", `x-powered-by: ${powered}`);

      const generatorMeta = getMetaTag(html, "name", "generator");
      if (generatorMeta) add(generatorMeta, "Generator", "meta[name=generator]");

      return NextResponse.json({
        ok: true,
        action: "tech",
        finalUrl: fetched.finalUrl,
        status: fetched.status,
        server: server || "-",
        poweredBy: powered || "-",
        detectedCount: detected.length,
        detected,
      });
    }

    // 8. Webpage to Clean Markdown
    if (action === "markdown") {
      const target = String(body.target || "").trim();
      if (!target) return NextResponse.json({ ok: false, error: "Masukkan URL artikel/halaman." }, { status: 400 });

      const fetched = await safeFetchPublic(target, { maxBytes: 450_000 });
      const titleMatch = fetched.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim()) : fetched.finalUrl;
      const mdBody = htmlToMarkdown(fetched.body, fetched.finalUrl);
      const markdown = `# ${title}\n\nSumber: ${fetched.finalUrl}\n\n${mdBody}`.slice(0, 60_000);
      const words = markdown.split(/\s+/).filter(Boolean).length;
      const readingMinutes = Math.max(1, Math.ceil(words / 200));

      return NextResponse.json({
        ok: true,
        action: "markdown",
        finalUrl: fetched.finalUrl,
        title,
        words,
        readingMinutes,
        markdown,
      });
    }

    // 9. RSS / Atom Feed Reader
    if (action === "rss") {
      const target = String(body.target || "").trim();
      if (!target) return NextResponse.json({ ok: false, error: "Masukkan URL RSS atau Atom feed." }, { status: 400 });

      const fetched = await safeFetchPublic(target, { maxBytes: 400_000 });
      const xml = fetched.body;
      const isAtom = /<feed\b/i.test(xml) && /<entry\b/i.test(xml);
      const feedTitle = extractXmlTag(xml.split(/<(item|entry)\b/i)[0] || xml, "title") || fetched.finalUrl;

      const blocks = isAtom
        ? [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map((m) => m[1])
        : [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

      const items = blocks.slice(0, 25).map((block) => {
        let link = extractXmlTag(block, "link");
        if (!link) {
          const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
          link = hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : "";
        }
        return {
          title: extractXmlTag(block, "title") || "(Tanpa judul)",
          link,
          pubDate:
            extractXmlTag(block, "pubDate") ||
            extractXmlTag(block, "published") ||
            extractXmlTag(block, "updated") ||
            "-",
          summary: (
            extractXmlTag(block, "description") ||
            extractXmlTag(block, "summary") ||
            extractXmlTag(block, "content") ||
            ""
          ).slice(0, 220),
        };
      });

      if (items.length === 0) {
        return NextResponse.json(
          { ok: false, error: "Tidak ada item RSS/Atom ditemukan pada URL tersebut." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        action: "rss",
        feedType: isAtom ? "Atom" : "RSS",
        feedTitle,
        finalUrl: fetched.finalUrl,
        count: items.length,
        items,
      });
    }

    // 10. Live Currency Converter
    if (action === "currency") {
      const amount = Number(body.amount);
      const from = String(body.from || "USD").toUpperCase().trim();
      const to = String(body.to || "IDR").toUpperCase().trim();
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ ok: false, error: "Nominal jumlah tidak valid." }, { status: 400 });
      }
      const { rates, source, updatedAt } = await getUsdRates();
      const fromRate = rates[from];
      const toRate = rates[to];
      if (!fromRate || !toRate) {
        return NextResponse.json({ ok: false, error: `Kode mata uang ${from} atau ${to} tidak ditemukan.` }, { status: 400 });
      }
      const unitRate = toRate / fromRate;
      const converted = amount * unitRate;
      const popularTargets = ["IDR", "USD", "EUR", "SGD", "MYR", "JPY", "GBP", "AUD", "KRW", "CNY"]
        .filter((c) => rates[c])
        .map((code) => ({
          code,
          value: Number(((amount / fromRate) * rates[code]).toFixed(code === "IDR" || code === "JPY" || code === "KRW" ? 0 : 2)),
        }));

      return NextResponse.json({
        ok: true,
        action: "currency",
        amount,
        from,
        to,
        unitRate: Number(unitRate.toFixed(6)),
        converted: Number(converted.toFixed(to === "IDR" || to === "JPY" || to === "KRW" ? 0 : 4)),
        source,
        updatedAt,
        popularTargets,
      });
    }

    return NextResponse.json({ ok: false, error: "Action web-inspect tidak dikenal." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memeriksa target di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
