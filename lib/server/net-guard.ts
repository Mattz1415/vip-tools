import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
  if (a >= 224) return true; // multicast/reserved
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase().split("%")[0];
  if (lower === "::1" || lower === "::") return true;
  // Link-local fe80::/10, Unique local fc00::/7, Multicast ff00::/8, Discard 100::/64, NAT64 64:ff9b::
  if (
    /^fe[89ab][0-9a-f]:/.test(lower) ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("ff") ||
    lower.startsWith("100::") ||
    lower.startsWith("64:ff9b:") ||
    lower.startsWith("0000:0000:0000:0000:0000:ffff:")
  ) {
    return true;
  }
  // IPv4-mapped IPv6 (dotted or hex form like ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice(7);
    if (net.isIPv4(mapped)) return isPrivateIpv4(mapped);
    const hexParts = mapped.split(":");
    if (hexParts.length === 2) {
      const hi = parseInt(hexParts[0], 16);
      const lo = parseInt(hexParts[1], 16);
      if (!Number.isNaN(hi) && !Number.isNaN(lo) && hi >= 0 && hi <= 0xffff && lo >= 0 && lo <= 0xffff) {
        const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        return isPrivateIpv4(ipv4);
      }
    }
    return true;
  }
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const ver = net.isIP(ip);
  if (ver === 4) return isPrivateIpv4(ip);
  if (ver === 6) return isPrivateIpv6(ip);
  return true;
}

export async function assertPublicHost(hostname: string): Promise<{ hostname: string; address: string }> {
  const clean = hostname.trim().replace(/^\[|\]$/g, "");
  if (!clean || clean.length > 253) {
    throw new Error("Hostname tidak valid.");
  }
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(clean)) {
    throw new Error("Akses ke host lokal diblokir demi keamanan.");
  }

  if (net.isIP(clean)) {
    if (isPrivateIp(clean)) {
      throw new Error("Akses ke alamat IP privat/loopback diblokir.");
    }
    return { hostname: clean, address: clean };
  }

  const records = await dns.lookup(clean, { all: true });
  if (!records || records.length === 0) {
    throw new Error("Domain tidak dapat di-resolve.");
  }
  for (const rec of records) {
    if (isPrivateIp(rec.address)) {
      throw new Error("Target mengarah ke IP privat/lokal dan diblokir.");
    }
  }
  return { hostname: clean, address: records[0].address };
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Format URL tidak valid. Gunakan http:// atau https://");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Hanya protokol http:// dan https:// yang diizinkan.");
  }
  await assertPublicHost(parsed.hostname);
  return parsed;
}

/**
 * Fetches a public HTTP(S) URL while re-validating every redirect target
 * against SSRF / private IP ranges so redirects cannot reach internal services.
 */
export async function safeFetchPublic(
  rawUrl: string,
  init: Omit<RequestInit, "redirect"> = {},
  maxRedirects = 5
): Promise<{ response: Response; finalUrl: string }> {
  let current = await assertPublicHttpUrl(rawUrl);

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(current.toString(), {
      ...init,
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) {
        return { response: res, finalUrl: current.toString() };
      }
      if (hop === maxRedirects) {
        throw new Error("Terlalu banyak redirect pada URL target.");
      }
      try {
        await res.body?.cancel();
      } catch {
        // ignore
      }
      const nextUrl = new URL(loc, current).toString();
      current = await assertPublicHttpUrl(nextUrl);
      continue;
    }

    return { response: res, finalUrl: current.toString() };
  }

  throw new Error("Terlalu banyak redirect pada URL target.");
}

const INTERNAL_LEAK_RE =
  /(\/root\/|\/usr\/|\/var\/|\/etc\/|\/tmp\/|\/home\/|node_modules|store\.json|cookies\.txt|yt-dlp|ENOENT|EACCES|EPERM|EADDRINUSE|spawn\s|execFile)/i;

export function sanitizePublicError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const msg = String(err.message || "").trim();
  if (!msg || msg.length > 260 || INTERNAL_LEAK_RE.test(msg)) {
    return fallback;
  }
  return msg;
}
