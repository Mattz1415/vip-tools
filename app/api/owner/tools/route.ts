import { NextRequest, NextResponse } from "next/server";
import { requireOwnerUser } from "@/lib/server/auth";
import { appendAuditLog, updateStore } from "@/lib/server/store";

const VALID_CATEGORIES = new Set([
  "downloader",
  "maker",
  "tools",
  "vps",
  "external",
  "extra",
  "xvip",
  "telegram",
]);

export async function POST(req: NextRequest) {
  const { user: actor, error } = await requireOwnerUser();
  if (error || !actor) return error!;

  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "addCustomTool") {
      const name = String(body?.name || "").trim();
      const url = String(body?.url || "").trim();
      const desc = String(body?.desc || "").trim() || "Tools Custom Owner";
      const rawCat = String(body?.category || "telegram").trim().toLowerCase();
      const category = VALID_CATEGORIES.has(rawCat) ? rawCat : "telegram";

      if (!name || !url) {
        return NextResponse.json(
          { ok: false, error: "Nama tool dan URL wajib diisi." },
          { status: 400 }
        );
      }
      if (!/^https?:\/\//i.test(url)) {
        return NextResponse.json(
          { ok: false, error: "URL tool harus diawali http:// atau https://." },
          { status: 400 }
        );
      }

      const customTools = updateStore((store) => {
        store.customTools.unshift({
          id: "tele_" + Date.now(),
          name: name.slice(0, 60),
          url: url.slice(0, 500),
          desc: desc.slice(0, 140),
          category,
          icon: "fa-solid fa-plug",
          badge: "Custom",
          isTelegram: true,
          createdAt: Date.now(),
        });
        appendAuditLog(store, actor.username, "OWNER_ADD_TOOL", `Tambah custom tool: ${name}`);
        return store.customTools;
      });
      return NextResponse.json({ ok: true, customTools });
    }

    if (action === "deleteCustomTool") {
      const id = String(body?.id || "").trim();
      const customTools = updateStore((store) => {
        store.customTools = store.customTools.filter((t) => t.id !== id);
        appendAuditLog(store, actor.username, "OWNER_DELETE_TOOL", `Hapus custom tool ID: ${id}`);
        return store.customTools;
      });
      return NextResponse.json({ ok: true, customTools });
    }

    if (action === "toggleHiddenTool") {
      const toolId = String(body?.toolId || "").trim();
      if (!toolId) {
        return NextResponse.json({ ok: false, error: "toolId wajib diisi." }, { status: 400 });
      }
      const hiddenTools = updateStore((store) => {
        if (store.hiddenTools.includes(toolId)) {
          store.hiddenTools = store.hiddenTools.filter((x) => x !== toolId);
          appendAuditLog(store, actor.username, "OWNER_UNHIDE_TOOL", `Tampilkan tool ${toolId}`);
        } else {
          store.hiddenTools.push(toolId);
          appendAuditLog(store, actor.username, "OWNER_HIDE_TOOL", `Sembunyikan tool ${toolId}`);
        }
        return store.hiddenTools;
      });
      return NextResponse.json({ ok: true, hiddenTools });
    }

    if (action === "restoreTools") {
      const hiddenTools = updateStore((store) => {
        store.hiddenTools = [];
        appendAuditLog(store, actor.username, "OWNER_RESTORE_TOOLS", "Pulihkan semua tool bawaan");
        return store.hiddenTools;
      });
      return NextResponse.json({ ok: true, hiddenTools });
    }

    if (action === "deleteShortLink") {
      const code = String(body?.code || "").trim();
      const shortLinks = updateStore((store) => {
        store.shortLinks = store.shortLinks.filter((s) => s.code !== code);
        appendAuditLog(store, actor.username, "OWNER_DELETE_SHORTLINK", `Hapus shortlink /s/${code}`);
        return store.shortLinks;
      });
      return NextResponse.json({ ok: true, shortLinks });
    }

    if (action === "deletePaste") {
      const id = String(body?.id || "").trim();
      const pastes = updateStore((store) => {
        store.pastes = store.pastes.filter((p) => p.id !== id);
        appendAuditLog(store, actor.username, "OWNER_DELETE_PASTE", `Hapus paste /p/${id}`);
        return store.pastes;
      });
      return NextResponse.json({ ok: true, pastes });
    }

    return NextResponse.json({ ok: false, error: "Aksi tool tidak dikenali." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses aksi tool.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
