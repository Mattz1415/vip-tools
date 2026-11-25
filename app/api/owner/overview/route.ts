import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { requireOwnerUser, sanitizePublicUser } from "@/lib/server/auth";
import {
  getEffectiveFirebaseConfig,
  getStorageMode,
  hasYtCookies,
  isFirebaseReady,
  readStore,
} from "@/lib/server/store";

const execFileAsync = promisify(execFile);

async function safeExec(cmd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 3000 });
    return stdout.trim();
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const { error } = await requireOwnerUser();
    if (error) return error;

    const store = readStore();
    const fbCfg = getEffectiveFirebaseConfig(store);

    const [ytDlpVersion, dfOut] = await Promise.all([
      safeExec("/usr/local/bin/yt-dlp", ["--version"]),
      safeExec("df", ["-h", "/"]),
    ]);

    let diskSummary = "N/A";
    const dfLines = dfOut.split("\n").filter(Boolean);
    if (dfLines.length >= 2) {
      const cols = dfLines[1].split(/\s+/);
      if (cols.length >= 5) {
        diskSummary = `${cols[2]} / ${cols[1]} (${cols[4]})`;
      }
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = Math.max(0, totalMem - freeMem);
    const memPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;

    return NextResponse.json({
      ok: true,
      vps: {
        hostname: os.hostname(),
        platform: `${os.type()} ${os.release()} (${os.arch()})`,
        nodeVersion: process.version,
        uptimeSec: Math.floor(os.uptime()),
        cpuCores: os.cpus()?.length || 1,
        loadAvg: os.loadavg().map((n) => Number(n.toFixed(2))),
        memUsedMb: Math.round(usedMem / (1024 * 1024)),
        memTotalMb: Math.round(totalMem / (1024 * 1024)),
        memPercent,
        diskSummary,
        storageMode: getStorageMode(),
        ytDlpVersion: ytDlpVersion || "Tidak terpasang",
        hasYtCookies: hasYtCookies(),
        firebaseReady: isFirebaseReady(fbCfg),
      },
      users: Object.values(store.users)
        .map(sanitizePublicUser)
        .sort((a, b) => (a.username === "matt" ? -1 : b.lastLoginAt - a.lastLoginAt)),
      ownerEmails: store.ownerEmails,
      customTools: store.customTools,
      hiddenTools: store.hiddenTools,
      chatMessages: store.chatMessages.slice(-80),
      shortLinks: store.shortLinks.slice(0, 50),
      pastes: store.pastes.slice(0, 50).map((p) => ({
        id: p.id,
        title: p.title,
        lang: p.lang,
        views: p.views,
        createdBy: p.createdBy,
        createdAt: p.createdAt,
        length: p.content.length,
      })),
      settings: store.settings,
      firebaseConfig: fbCfg,
      auditLogs: store.auditLogs.slice(0, 50),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memuat data Owner Panel.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
