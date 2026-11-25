"use client";

import Link from "next/link";

export default function AppErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="owner-shell">
      <div className="owner-gate-card">
        <div className="owner-brand" style={{ marginBottom: "16px" }}>
          <span className="owner-monogram">MLM</span>
          <div>
            <h1 className="owner-title">Halaman Gagal Dimuat</h1>
            <p className="owner-sub">Terjadi kendala sementara di server. Muat ulang untuk mencoba lagi.</p>
          </div>
        </div>
        <div className="owner-gate-actions">
          <button type="button" className="v-btn" onClick={() => reset()}>
            <i className="fas fa-rotate-right" aria-hidden="true" /> Muat Ulang
          </button>
          <Link href="/" className="v-btn v-btn-secondary">
            <i className="fas fa-home" aria-hidden="true" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
