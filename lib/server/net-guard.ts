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
  if (a >= 224) return true; // multicast/reserved
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice(7);
    if (net.isIPv4(mapped)) return isPrivateIpv4(mapped);
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
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(clean)) {
    throw new Error("Akses ke host lokal diblokir demi keamanan VPS.");
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
