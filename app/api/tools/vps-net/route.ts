import { execFile } from "node:child_process";
import dns from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { assertPublicHost, assertPublicHttpUrl } from "@/lib/server/net-guard";

const execFileAsync = promisify(execFile);

async function runWhois(domain: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("whois", [domain], {
      timeout: 7000,
      maxBuffer: 512 * 1024,
    });
    return stdout
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("%") && !line.trim().startsWith("#"))
      .slice(0, 45)
      .join("\n");
  } catch {
    return "WHOIS tidak tersedia untuk domain ini.";
  }
}

function inspectTls(hostname: string, port = 443): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const sock = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: 6000,
      },
      () => {
        try {
          const cert = sock.getPeerCertificate();
          const protocol = sock.getProtocol();
          const cipher = sock.getCipher();
          sock.end();
          if (!cert || !cert.subject) return resolve(null);
          const validToMs = cert.valid_to ? Date.parse(cert.valid_to) : 0;
          const daysRemaining = validToMs
            ? Math.floor((validToMs - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          resolve({
            protocol,
            cipher: cipher?.name || "-",
            subjectCN: cert.subject?.CN || "-",
            issuerO: cert.issuer?.O || cert.issuer?.CN || "-",
            validFrom: cert.valid_from || "-",
            validTo: cert.valid_to || "-",
            daysRemaining,
          });
        } catch {
          sock.destroy();
          resolve(null);
        }
      }
    );
    sock.on("error", () => resolve(null));
    sock.on("timeout", () => {
      sock.destroy();
      resolve(null);
    });
  });
}

function probePort(host: string, port: number): Promise<{ port: number; open: boolean; latencyMs: number }> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const socket = net.createConnection({ host, port, timeout: 2200 });
    socket.on("connect", () => {
      const latencyMs = Date.now() - t0;
      socket.destroy();
      resolve({ port, open: true, latencyMs });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ port, open: false, latencyMs: Date.now() - t0 });
    });
    socket.on("error", () => {
      socket.destroy();
      resolve({ port, open: false, latencyMs: Date.now() - t0 });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "").toLowerCase();

    if (action === "dns") {
      const raw = String(body?.target || "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .split(/[/?#:]/)[0];
      if (!raw || !/^[a-zA-Z0-9.-]{2,253}$/.test(raw)) {
        return NextResponse.json({ ok: false, error: "Nama domain tidak valid." }, { status: 400 });
      }
      await assertPublicHost(raw);

      const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
        try {
          return await fn();
        } catch {
          return fallback;
        }
      };

      const [a, aaaa, mx, ns, txt, cname, whois] = await Promise.all([
        safe(() => dns.resolve4(raw), []),
        safe(() => dns.resolve6(raw), []),
        safe(() => dns.resolveMx(raw), []),
        safe(() => dns.resolveNs(raw), []),
        safe(() => dns.resolveTxt(raw), []),
        safe(() => dns.resolveCname(raw), []),
        runWhois(raw),
      ]);

      return NextResponse.json({
        ok: true,
        domain: raw,
        records: {
          A: a,
          AAAA: aaaa,
          MX: mx.map((m) => `${m.priority} ${m.exchange}`),
          NS: ns,
          CNAME: cname,
          TXT: txt.map((t) => t.join("")),
        },
        whois,
      });
    }

    if (action === "http") {
      let rawUrl = String(body?.target || "").trim();
      if (!rawUrl) {
        return NextResponse.json({ ok: false, error: "URL target wajib diisi." }, { status: 400 });
      }
      if (!/^https?:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;
      const parsed = await assertPublicHttpUrl(rawUrl);

      const t0 = Date.now();
      const res = await fetch(parsed.toString(), {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "MattzLM-VPS-Inspector/2.0" },
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Date.now() - t0;

      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        headers[k] = v;
      });

      const finalParsed = new URL(res.url);
      const ssl =
        finalParsed.protocol === "https:"
          ? await inspectTls(finalParsed.hostname, Number(finalParsed.port) || 443)
          : null;

      return NextResponse.json({
        ok: true,
        url: parsed.toString(),
        finalUrl: res.url,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        headers,
        ssl,
      });
    }

    if (action === "ip") {
      const raw = String(body?.target || "").trim();
      let lookupTarget = raw;
      if (!lookupTarget) {
        const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
        lookupTarget = xff && xff !== "::1" && xff !== "127.0.0.1" ? xff : "";
      } else {
        const cleanHost = lookupTarget.replace(/^https?:\/\//i, "").split(/[/?#:]/)[0];
        const checked = await assertPublicHost(cleanHost);
        lookupTarget = checked.address;
      }

      const apiUrl = lookupTarget
        ? `http://ip-api.com/json/${encodeURIComponent(lookupTarget)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
        : `http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;

      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || "IP tidak ditemukan.");
      }

      let reverseDns: string[] = [];
      try {
        reverseDns = await dns.reverse(data.query);
      } catch {
        reverseDns = [];
      }

      return NextResponse.json({
        ok: true,
        ip: data.query,
        country: `${data.country} (${data.countryCode})`,
        region: data.regionName || "-",
        city: data.city || "-",
        timezone: data.timezone || "-",
        coords: `${data.lat}, ${data.lon}`,
        isp: data.isp || "-",
        org: data.org || "-",
        asn: data.as || "-",
        reverseDns,
      });
    }

    if (action === "port") {
      const rawHost = String(body?.target || "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .split(/[/?#:]/)[0];
      if (!rawHost) {
        return NextResponse.json({ ok: false, error: "Host atau domain wajib diisi." }, { status: 400 });
      }
      const checked = await assertPublicHost(rawHost);

      const rawPorts = String(body?.ports || "80,443,22,21,25,3306,5432,8080");
      const ports = Array.from(
        new Set(
          rawPorts
            .split(/[\s,]+/)
            .map((p) => parseInt(p, 10))
            .filter((p) => !Number.isNaN(p) && p >= 1 && p <= 65535)
        )
      ).slice(0, 10);

      if (ports.length === 0) {
        return NextResponse.json({ ok: false, error: "Daftar port tidak valid (1-65535)." }, { status: 400 });
      }

      const results = await Promise.all(ports.map((p) => probePort(checked.address, p)));
      return NextResponse.json({
        ok: true,
        host: rawHost,
        ip: checked.address,
        results,
      });
    }

    return NextResponse.json({ ok: false, error: "Aksi jaringan tidak dikenali." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menjalankan modul jaringan VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
