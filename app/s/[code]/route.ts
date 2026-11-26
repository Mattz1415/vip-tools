import { NextRequest, NextResponse } from "next/server";
import { updateStore } from "@/lib/server/store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const target = updateStore((store) => {
      const item = store.shortLinks.find((s) => s.code === code);
      if (!item) return null;
      item.clicks += 1;
      return item.url;
    });

    if (!target) {
      return new NextResponse("Shortlink tidak ditemukan.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.redirect(target, 302);
  } catch {
    return new NextResponse("Shortlink tidak dapat diakses saat ini.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
