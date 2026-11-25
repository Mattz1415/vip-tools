# MattzLM Web Tools

Aplikasi web Next.js (App Router) berisi 45 utilitas harian, pengunduh media, maker gambar, serta alat jaringan yang berjalan langsung di server VPS tanpa mengandalkan API luar yang sering mati.

## Menjalankan di Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser.

## Build Production

```bash
npm run build
npm start
```

## Apa Saja di Dalamnya

- **45 Tool Aktif di VPS**: DNS & WHOIS lookup, HTTP/SSL inspector, TCP port checker, IP tracker, URL shortener (`/s/kode`), code paste (`/p/id`), kompresi dan konversi gambar dengan Sharp, remove background, upscale 2x, QR generator, serta pengunduh IG/TikTok/YouTube lewat `yt-dlp`.
- **Tampilan Monokrom 3 Palet**: Pilihan tema Hitam, Abu, dan Putih dengan kontras WCAG AA, latar 3D ringan, dan tombol jeda animasi.
- **Panel Khusus `/owner`**: Hanya akun dengan role `owner` (bawaan `matt`) yang bisa membuka konsol `/owner` untuk memantau CPU/RAM/disk VPS, mengatur pengguna, menambah tool custom, membalas chat, dan menyimpan konfigurasi Firebase Google Login.
- **Pencarian Cepat**: Tekan `Ctrl+K` atau `⌘K` kapan saja setelah login untuk langsung menyaring daftar tool.
