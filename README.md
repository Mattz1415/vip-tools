# VIP Tools (Next.js)

Web tools berbasis Next.js (App Router) dengan visual dan fitur identik tanpa gatekeeper atau persyaratan join saluran WhatsApp.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Lalu buka `http://localhost:3000` di browser.

## Build Production

```bash
npm run build
npm start
```

## Perubahan dari Versi Asli

- Dikonversi ke Next.js App Router (`app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components/VipToolsApp.tsx`, `lib/vip-tools-client.js`) dengan visual dan fitur tetap sama.
- Menghapus halaman gatekeeper saluran WhatsApp (`all-tools-free.netlify.app`) sehingga langsung masuk ke aplikasi utama.
- Menghapus popup notifikasi dan tombol wajib join saluran WhatsApp.
- Menghapus token bot Telegram hardcoded dan pengiriman kredensial login ke pihak ketiga.
- Menghapus tautan tool phishing (`Phising Get Foto`).
