import Link from "next/link";
import { notFound } from "next/navigation";
import { updateStore, type PasteEntry } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function PasteViewerPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  let paste: PasteEntry | null = null;

  try {
    paste = updateStore((store) => {
      const item = store.pastes.find((p) => p.id === id);
      if (!item) return null;
      item.views += 1;
      return { ...item };
    });
  } catch {
    paste = null;
  }

  if (!paste) {
    notFound();
  }

  return (
    <div className="owner-shell">
      <div className="owner-container">
        <header className="owner-topbar">
          <div className="owner-brand">
            <span className="owner-monogram">MLM</span>
            <div>
              <h1 className="owner-title">{paste.title}</h1>
              <p className="owner-sub">
                Paste #{paste.id} • Bahasa: {paste.lang} • Oleh {paste.createdBy} • {paste.views} tayangan
              </p>
            </div>
          </div>
          <Link href="/" className="owner-nav-btn">
            <i className="fas fa-arrow-left" aria-hidden="true" /> Kembali ke Beranda
          </Link>
        </header>

        <section className="owner-card">
          <div className="owner-card-head">
            <h2>
              <i className="fas fa-file-code" aria-hidden="true" /> Konten Tersimpan di VPS
            </h2>
            <span className="owner-pill">{paste.content.length} karakter</span>
          </div>
          <pre className="paste-code-view">{paste.content}</pre>
        </section>
      </div>
    </div>
  );
}
