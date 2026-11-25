import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { hasYtCookies, readStore } from "@/lib/server/store";

const execFileAsync = promisify(execFile);

async function safeExec(cmd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 2500 });
    return stdout.trim();
  } catch {
    return "";
  }
}

export async function GET() {
  const store = readStore();
  const [ytDlp, dfOut] = await Promise.all([
    safeExec("/usr/local/bin/yt-dlp", ["--version"]),
    safeExec("df", ["-h", "/"]),
  ]);

  let disk = "N/A";
  const lines = dfOut.split("\n").filter(Boolean);
  if (lines.length >= 2) {
    const cols = lines[1].split(/\s+/);
    if (cols.length >= 5) disk = `${cols[2]} / ${cols[1]} (${cols[4]})`;
  }

  const totalMem = os.totalmem();
  const usedMem = totalMem - os.freemem();

  return NextResponse.json({
    ok: true,
    status: "ONLINE",
    server: {
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      node: process.version,
      uptimeSec: Math.floor(os.uptime()),
      cpuCores: os.cpus().length,
      loadAvg: os.loadavg().map((n) => Number(n.toFixed(2))),
      ramUsedMb: Math.round(usedMem / (1024 * 1024)),
      ramTotalMb: Math.round(totalMem / (1024 * 1024)),
      ramPercent: Math.round((usedMem / totalMem) * 100),
      disk,
      ytDlp: ytDlp || "Offline",
      ytCookiesConfigured: hasYtCookies(),
      sharpReady: true,
      visits: store.settings.visits,
      shortLinksCount: store.shortLinks.length,
      pastesCount: store.pastes.length,
    },
  });
}
