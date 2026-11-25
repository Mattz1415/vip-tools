# Panduan Handoff AI & Operasional Proyek MattzLM (`/root/vip-tools`)

Dokumen ini menjadi acuan utama bagi AI atau developer berikutnya agar langsung mengetahui seluruh pekerjaan yang sudah selesai, arsitektur aplikasi, pembagian role (`owner`, `admin`, `xvip`, `member`), dependensi VPS, aturan desain, serta langkah pemeliharaan dan verifikasi supaya **semua 75 fitur berjalan penuh**.

---

## 1. Ringkasan Proyek

- **Aplikasi**: MattzLM Web Tools & VPS Suite
- **Lokasi repo**: `/root/vip-tools`
- **Stack**: Next.js 16 (App Router, React 19, TypeScript) + Backend API Route di VPS Linux
- **Total modul aktif**: **75 modul tools** (45 modul bawaan + 30 modul modern baru)
- **Autentikasi & Sesi**:
  - Login lokal (`username` + `password` PBKDF2-SHA256) dengan cookie `HttpOnly` bertanda tangan HMAC (`vip_session_token`).
  - Login Google via Firebase Auth (`/api/auth/google`, verifikasi `idToken` di server via Identity Toolkit API).
  - Akun owner bawaan: `matt` (disimpan di `data/store.json`, password default di-seed saat pertama kali file store dibuat).
- **Penyimpanan Data**:
  - `data/store.json` (JSON atomik, permission `0600`) menyimpan `users`, `customTools`, `hiddenTools`, `chatMessages`, `shortLinks`, `pastes`, `auditLogs`, `firebaseConfig`, `ownerEmails`, dan statistik `visits`.
  - `data/yt-cookies.txt` (opsional, permission `0600`) untuk cookies Netscape `yt-dlp` agar unduhan YouTube tetap stabil.

---

## 2. Sistem Role & RBAC (`xvip` Access Control)

Aplikasi memiliki 4 role: `"owner" | "admin" | "xvip" | "member"`.

| Role | 65 Tools Reguler (VPS, Downloader, Maker, Tools, External, Extra) | 10 Modul XVIP (UI + Backend API) | Panel Owner (`/owner` & `/api/owner/*`) |
| --- | --- | --- | --- |
| `member` | Boleh | **Ditolak** (UI `XVIP LOCK`, API `403`) | **Ditolak** (`403`) |
| `xvip` | Boleh | **Boleh** | **Ditolak** (`403`) |
| `admin` | Boleh | **Boleh** | **Ditolak** (`403`) |
| `owner` | Boleh | **Boleh** | **Boleh** |
| Belum login | Sebagian endpoint publik bisa diakses, sesi dibutuhkan untuk chat/profil | **Ditolak** (API `401`) | **Ditolak** (`401`) |

### Implementasi RBAC XVIP
- **Server-side (`lib/server/auth.ts`)**:
  - `hasXvipRole(role)` mengembalikan `true` hanya untuk `owner`, `admin`, `xvip`.
  - `requireXvipUser()` mengembalikan HTTP `401` jika belum login dan HTTP `403` jika role adalah `member`.
  - Diterapkan pada seluruh endpoint XVIP:
    - `app/api/tools/source/route.ts`
    - `app/api/tools/ngl/route.ts`
    - `app/api/tools/stalk-game/route.ts`
    - `app/api/tools/stalk-social/route.ts`
    - `app/api/tools/download/route.ts` (khusus saat `body.xvip === true` atau `platform === "all"`; downloader reguler `instagram`, `tiktok`, `youtube` tetap bisa dipakai `member`).
- **Client-side (`lib/vip-tools-client.js`)**:
  - `hasXvipAccess(role)` dan `canCurrentUserAccessXvip()` mengontrol badge kartu (`XVIP` vs `XVIP LOCK`), banner info pada tab XVIP, serta gerbang modal `showXvipMessage()` (`#xvipLockedNotice`) sehingga `member` tidak bisa membuka modul XVIP lokal maupun server.
- **Manajemen Role**:
  - Owner bisa membuat/mengubah role akun ke `member`, `xvip`, `admin`, atau `owner` melalui `/owner` (`components/OwnerPanelClient.tsx`), Panel Owner inline di profil (`components/VipToolsApp.tsx` `#ownerAccRole`), atau `POST /api/owner/users` (`VALID_ROLES = ["member", "xvip", "admin", "owner"]`).

---

## 3. Peta Lengkap 75 Modul Tools & Backend API

### A. 30 Fitur Modern Baru (Ditambahkan & Terintegrasi Penuh)

Seluruh UI 30 fitur baru berada di **`lib/vip-tools-extra-ui.js`** (di-import ke `lib/vip-tools-client.js` dan didaftarkan ke `BUILTIN_TOOL_IDS` di `components/OwnerPanelClient.tsx`).

#### 1) VPS Web Audit & Network (`app/api/tools/web-inspect/route.ts` - 10 fitur, kategori `vps`)
1. `vps_seo` (`action: "seo"`): Audit SEO, title, meta description, canonical, OpenGraph, H1/H2, alt gambar, skor 0-100.
2. `vps_secheaders` (`action: "security"`): Penilaian security headers (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP) + grade A+-F & deteksi kebocoran header `server`/`x-powered-by`.
3. `vps_redirect` (`action: "redirect"`): Pelacak rantai redirect HTTP hop-by-hop + opsi cek status tautan di halaman akhir (maks. 12 link).
4. `vps_sitemap` (`action: "sitemap"`): Parser `robots.txt` dan ekstraktor `<loc>` dari `sitemap.xml` (maks. 60 URL).
5. `vps_emailcheck` (`action: "email"`): Validator email/domain DNS MX, SPF, DMARC, dan deteksi domain email sementara (disposable).
6. `vps_uptime` (`action: "uptime"`): Probe ketersediaan & latensi HTTP multi-sampel (2-5 kali uji, min/avg/max ms).
7. `vps_techstack` (`action: "tech"`): Detektor stack teknologi web (Next.js, Nuxt, React, WordPress, Tailwind, Cloudflare, Nginx, Vercel, dll.).
8. `vps_markdown` (`action: "markdown"`): Konversi artikel halaman web ke Markdown bersih + jumlah kata, estimasi baca, unduh `.md`.
9. `vps_rss` (`action: "rss"`): Pembaca feed RSS 2.0 & Atom tanpa kendala CORS browser.
10. `vps_currency` (`action: "currency"`): Konverter kurs mata uang live (`open.er-api.com` dengan cache memori VPS 30 menit + fallback kurs).

#### 2) Image, Media & Document Studio (`app/api/tools/image-suite/route.ts` - 8 fitur, kategori `maker`)
11. `img_exif` (`action: "exif"` & `action: "strip_exif"`): Inspeksi metadata EXIF/ICC/XMP/IPTC dan hapus metadata privasi foto.
12. `img_watermark` (`action: "watermark"`): Tambah watermark teks (sudut, tengah, atau pola tile diagonal, warna putih/hitam, opasitas).
13. `img_socialcrop` (`action: "social_crop"`): Smart crop attention-based ke rasio IG Feed, IG Portrait, Reels/TikTok, YouTube Thumbnail, OpenGraph, X Header.
14. `img_palette` (`action: "palette"`): Ekstrak 6 warna dominan HEX, RGB, HSL, dan persentase cakupan dengan klik-salin.
15. `img_favicon` (`action: "favicon"`): Generator `favicon.ico` multi-ukuran (16/32/48px) + PNG (32/180/192/512px) + snippet `<head>`.
16. `img_filters` (`action: "filters"`): Studio edit foto (rotasi 0/90/180/270, flip H/V, kecerahan, saturasi, blur, sharpen, grayscale, invert).
17. `img_svg2png` (`action: "svg2png"`): Rasterizer kode/file SVG menjadi PNG resolusi tinggi hingga 3000px.
18. `doc_img2pdf` (`action: "img2pdf"`): Gabung 1-10 gambar menjadi satu dokumen PDF A4 multi-halaman (via `lib/server/pdf-writer.ts`).

#### 3) Modern Dev, Security & Productivity (`app/api/tools/crypto-util/route.ts` & `app/api/tools/text-pdf/route.ts` - 12 fitur, kategori `tools`)
19. `doc_invoice` (`/api/tools/text-pdf`, `action: "invoice_pdf"`): Generator faktur PDF profesional monokrom (via `lib/server/pdf-writer.ts`).
20. `dev_jwt` (`/api/tools/crypto-util`, `action: "jwt"`): Decode JWT, cek masa berlaku `exp`/`iat`, verifikasi HMAC, & sign token baru HS256/384/512.
21. `dev_hash` (`/api/tools/crypto-util`, `action: "hash"` & `"hash_file"`): Multi-hash MD5, SHA-1, SHA-256, SHA-512, SHA3-256, BLAKE2b512, dan HMAC untuk teks maupun file (maks. 12MB).
22. `dev_encrypt` (`/api/tools/crypto-util`, `action: "encrypt"`): Enkripsi & dekripsi terautentikasi AES-256-GCM + PBKDF2-SHA256 (100.000 iterasi).
23. `dev_uuid` (`/api/tools/crypto-util`, `action: "uuid"`): Generator massal (1-50) UUID v7 (time-sortable), UUID v4, ULID, dan NanoID.
24. `dev_compress` (`/api/tools/crypto-util`, `action: "compress"`): Kompresi & dekompresi teks Base64 menggunakan Brotli, Gzip, dan Deflate.
25. `qr_pro` (`/api/tools/crypto-util`, `action: "qr_pro"`): Generator QR terstruktur untuk WiFi auto-connect, WhatsApp chat link, kontak vCard, dan Email (unduh PNG & SVG).
26. `dev_csvjson` (`/api/tools/text-pdf`, `action: "csv_json"`): Konversi bolak-balik CSV, JSON Array, dan Tabel Markdown GitHub.
27. `dev_diff` (`/api/tools/text-pdf`, `action: "diff"`): Pembanding teks/kode baris demi baris berbasis LCS dengan tampilan `+`/`-`.
28. `dev_regex` (`/api/tools/text-pdf`, `action: "regex"`): Penguji RegExp (flags aman `gimsu`), daftar kecocokan + capture groups, dan simulasi replace.
29. `dev_cron` (`/api/tools/text-pdf`, `action: "cron"`): Penerjemah ekspresi cron 5-kolom + simulasi 10 jadwal eksekusi berikutnya (WIB/WITA/WIT/UTC).
30. `net_subnet` (`/api/tools/text-pdf`, `action: "subnet"`): Kalkulator IPv4 CIDR (network, broadcast, subnet mask, wildcard, rentang host, kelas/cakupan, biner).

### B. 45 Modul Bawaan yang Sudah Ada
- **VPS (8)**: `vps_dns`, `vps_http`, `vps_ip`, `vps_port` (`/api/tools/vps-net`), `vps_shortlink` (`/api/tools/shortlink` + `/s/[code]`), `vps_paste` (`/api/tools/paste` + `/p/[id]`), `vps_imgconv` (`/api/tools/imgconv`), `vps_status` (`/api/tools/vps-status`).
- **Downloader (3)**: `instagram`, `tiktok`, `youtube` (`/api/tools/download` + `/api/tools/proxy`).
- **Maker (5)**: `iqc`, `tanyaustadz`, `sertifikat` (`/api/tools/maker`), `brat`, `fakeig` (canvas lokal).
- **Tools (8)**: `qr` (`/api/tools/qr`), `removebg` (`/api/tools/removebg`), `enhancer` (`/api/tools/enhance`), `dev_json`, `dev_encode`, `calc`, `pwgen`, `morse`.
- **External (4)**: `winquotesnew`, `fakeff`, `getcode`, `fotolink`.
- **Extra (7)**: `handtrack` (canvas lokal), `interaktif`, `fakecall`, `anonychat`, `fakeml`, `animequotes`, `pinkvoid`.
- **XVIP (10 - khusus `xvip`/`admin`/`owner`)**: `xvip_unband`, `xvip_getcode` (`/api/tools/source`), `xvip_nglspam` (`/api/tools/ngl`), `xvip_fakeml`, `xvip_bratanime`, `xvip_fakejago`, `xvip_fakedana`, `xvip_allinone` (`/api/tools/download` `xvip:true`), `xvip_stalkgame` (`/api/tools/stalk-game`), `xvip_stalksosmed` (`/api/tools/stalk-social`).

---

## 4. Dependensi VPS & Konfigurasi Agar Semua Fitur Berjalan

### A. Paket Sistem & Binary VPS
Pastikan binary berikut tersedia di VPS Linux:
- `node` >= 20 (saat ini terpasang `v22.23.5`) & `npm`
- `/usr/local/bin/yt-dlp` (wajib untuk `instagram`, `tiktok`, `youtube`, `xvip_allinone`). **Jangan dihapus.** Untuk update berkala:
  ```bash
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp
  ```
- `python3` (dibutuhkan oleh `yt-dlp`)
- `dig` (`dnsutils`) & `whois` (`whois`) untuk `vps_dns`
- `openssl` & `curl` & `df` untuk inspeksi TLS dan telemetri server
- **Catatan**: `ffmpeg`, `imagemagick`, dan `ghostscript` tidak wajib karena seluruh pemrosesan gambar menggunakan `sharp` (Node native) dan pembuatan PDF menggunakan `lib/server/pdf-writer.ts` (zero-dependency).

### B. Paket NPM (`package.json`)
Dependensi utama: `next`, `react`, `react-dom`, `sharp`, `qrcode`, `firebase`. Jika baru clone atau pindah VPS, jalankan:
```bash
cd /root/vip-tools && npm install
```

### C. Environment Variables (`.env.local` atau Systemd/PM2 Env)
Buat/isi `/root/vip-tools/.env.local` saat deploy produksi:
```env
# Rahasia penandatanganan cookie sesi (isi string acak 32+ karakter agar sesi tahan restart)
VIP_SESSION_SECRET=ganti_dengan_secret_acak_minimal_32_karakter

# Daftar email Google yang otomatis mendapat role owner (pisahkan koma)
VIP_OWNER_EMAILS=emailowner@gmail.com

# Konfigurasi Firebase Client (opsional di env; bisa juga diisi lewat /owner -> Pengaturan)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### D. Aktivasi Fitur Eksternal Tertentu
1. **Google Sign-In (Firebase)**:
   - Pastikan domain/host produksi (mis. `domainanda.com` atau IP/localhost saat dev) sudah ditambahkan di **Firebase Console -> Authentication -> Settings -> Authorized domains**.
   - Aktifkan provider **Google** di Firebase Console -> Authentication -> Sign-in method.
   - Isi 6 field Firebase di `.env.local` atau melalui halaman `/owner` (tab Pengaturan).
2. **YouTube Downloader (`yt-dlp`)**:
   - Jika IP VPS terkena pembatasan anti-bot YouTube, ekspor cookies Netscape dari browser dan simpan lewat halaman `/owner` (kolom YouTube Cookies -> tersimpan ke `data/yt-cookies.txt` dengan mode `0600`).
3. **SSRF Protection (`lib/server/net-guard.ts`)**:
   - Setiap route baru yang melakukan `fetch()` atau koneksi TCP ke target input pengguna **wajib** memanggil `assertPublicHttpUrl()` atau `assertPublicHost()` agar IP loopback (`127.0.0.1`), metadata cloud (`169.254.169.254`), dan jaringan privat (`10/8`, `172.16/12`, `192.168/16`) selalu ditolak (HTTP `400`).

---

## 5. Aturan & Invarian Kode (Wajib Dipatuhi AI Selanjutnya)

1. **Tema Monokrom Murni**:
   - 3 tema wajib: `hitam`, `abu`, `putih` di `app/globals.css`.
   - Seluruh kode warna `#RRGGBB` dan `rgb()/rgba()` di `app/globals.css` **wajib** achromatic (`R === G === B`).
   - Seluruh pasangan warna teks/latar wajib memenuhi kontras WCAG AA `>= 4.5:1`.
2. **Batas Glassmorphism & Tipografi**:
   - Maksimal **2** properti `backdrop-filter` di seluruh `app/globals.css`.
   - Font UI hanya `Rajdhani`, `IBM Plex Sans`, dan `IBM Plex Mono`. Dilarang menambahkan `Poppins`, `Orbitron`, `Inter`, `Space Grotesk`, atau `JetBrains Mono`.
3. **Anti-Slop UI & Aksesibilitas**:
   - Dilarang memakai ikon: `fa-bolt`, `fa-dragon`, `fa-sparkles`, `fa-robot`, `fa-magic`, `fa-broadcast`, `fa-star`, `fa-wand-magic-sparkles`, `fa-arrow-right`.
   - Dilarang memakai badge: `'Baru'`, `'NEW'`, `'AI'`, `'Instan'`, `'Aman'`.
   - Dilarang memakai karakter em dash (`\u2014`) di file TSX maupun JS.
   - Setiap elemen `<img>`, `<video>`, dan `<iframe>` wajib memiliki atribut `width` dan `height` eksplisit.
   - Tombol interaktif utama wajib menjaga target sentuh minimal `44px`.
4. **Lifecycle Cleanup SPA**:
   - Semua listener/timer/ObjectURL di client wajib dibersihkan lewat fungsi `cleanup()` yang dikembalikan `initVipTools()` (atau `registerCleanup` di `lib/vip-tools-extra-ui.js`), agar navigasi `/` <-> `/owner` tidak membocorkan listener atau menyebabkan `#loader` macet.
5. **Batas Wilayah Kerja di VPS Ini**:
   - Edit hanya di dalam `/root/vip-tools`. Jangan menyentuh `/root/mattzzzz`.
   - Jangan mematikan proses sistem pada port `20128`.
   - Jika menjalankan server uji sementara (mis. port `3099`), selalu matikan kembali prosesnya setelah verifikasi selesai.

---

## 6. Checklist AI Selanjutnya (Menjalankan & Verifikasi)

### A. Menjalankan Aplikasi di Produksi
```bash
cd /root/vip-tools
npx tsc --noEmit
rm -rf .next && npm run build
PORT=3000 npm run start
```
(Disarankan membungkus `npm run start` menggunakan PM2 atau systemd + reverse proxy Nginx/Caddy dengan HTTPS agar cookie `Secure` dan Google Sign-In berjalan mulus.)

### B. Verifikasi Otomatis Wajib Sebelum Commit / Push
Setiap kali menambah atau mengubah fitur, jalankan seluruh rangkaian pengecekan ini:

```bash
# 1. Type-check TypeScript
cd /root/vip-tools && npx tsc --noEmit

# 2. Simulasi runtime client (75 tools, navigasi, role member/xvip/owner, cleanup unmount/remount)
node /tmp/antigravity/runtime-test.mjs

# 3. Production build bersih
cd /root/vip-tools && rm -rf .next && npm run build

# 4. Uji E2E seluruh API VPS & RBAC XVIP + static/contrast verifier pada port sementara 3099
cd /root/vip-tools
npx next start -H 127.0.0.1 -p 3099 >/tmp/antigravity/next-3099.log 2>&1 &
SRV_PID=$!
sleep 3
node /tmp/antigravity/e2e-vps-test.mjs
node /tmp/antigravity/verify-client.mjs
pkill -P "$SRV_PID" 2>/dev/null || true
kill "$SRV_PID" 2>/dev/null || true
wait "$SRV_PID" 2>/dev/null || true
ss -ltnp | grep 3099 || echo "Port 3099 bersih"
```

### C. File Kunci yang Perlu Dicek Saat Mengembangkan Fitur Baru
- `lib/vip-tools-extra-ui.js`: Katalog & renderer UI 30 fitur modern.
- `lib/vip-tools-client.js`: State utama, auth, katalog gabungan 75 tools, gerbang `xvip`, dan renderer 45 fitur bawaan.
- `lib/server/auth.ts` & `lib/server/store.ts`: Session HMAC, role `UserRole`, `requireXvipUser()`, `requireOwnerUser()`, dan penyimpanan `data/store.json`.
- `lib/server/net-guard.ts`: Validasi URL publik anti-SSRF.
- `lib/server/pdf-writer.ts`: Generator PDF multi-halaman & invoice tanpa dependensi eksternal.
- `app/api/tools/*`: Semua backend API tools (`web-inspect`, `image-suite`, `crypto-util`, `text-pdf`, `vps-net`, `vps-status`, `shortlink`, `paste`, `qr`, `maker`, `imgconv`, `removebg`, `enhance`, `download`, `proxy`, `source`, `ngl`, `stalk-game`, `stalk-social`).
- `components/VipToolsApp.tsx` & `components/OwnerPanelClient.tsx`: Markup SSR halaman utama dan panel `/owner`.
