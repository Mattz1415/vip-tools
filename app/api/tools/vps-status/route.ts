import { NextResponse } from "next/server";
import { requireOwnerUser } from "@/lib/server/auth";

/**
 * Restricted endpoint. Never exposes OS, kernel, CPU, RAM, disk, IP,
 * Node runtime, yt-dlp, or internal infrastructure metadata publicly.
 */
export async function GET() {
  const { error } = await requireOwnerUser();
  if (error) return error;

  return NextResponse.json(
    {
      ok: true,
      status: "ONLINE",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
