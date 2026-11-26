# Panduan Handoff AI & Operasional Proyek MattzLM (`/root/vip-tools`)

Dokumen ini menjadi acuan utama bagi AI atau developer berikutnya agar langsung memahami arsitektur aplikasi, pembagian role (`owner`, `admin`, `xvip`, `member`), peta lengkap **75 modul tools** (termasuk 30 fitur jaman sekarang), dependensi VPS, aturan desain monokrom, serta perintah verifikasi wajib.

---

## 1. Ringkasan Proyek

- **Aplikasi**: MattzLM Web Tools & VPS Suite
- **Lokasi repo**: `/root/vip-tools`
- **Stack**: Next.js 16 (App Router, React 19, TypeScript) + Backend API Route di VPS Linux
- **Total modul aktif**: **75 modul tools** (45 modul bawaan + 30 fitur jaman sekarang)
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

| Role | 65 Tools Reguler (Downloader, VPS, Maker, Tools, External, Extra) | 10 Modul XVIP (UI + Backend API) | Panel Owner (`/owner` & `/api/owner/*`) |
| --- | --- | --- | --- |
| `member` | Boleh | **Ditolak** (UI `XVIP LOCK`, API `403`) | **Ditolak** (`403`) |
| `xvip` | Boleh | **Boleh** | **Ditolak** (`403`) |
| `admin` | Boleh | **Boleh** | **Ditolak** (`403`) |
| `owner` | Boleh | **Boleh** | **Boleh** |
| Belum login | Endpoint publik bisa diakses, sesi dibutuhkan untuk chat/profil | **Ditolak** (API `401`) | **Ditolak** (`401`) |

### Implementasi RBAC XVIP
- **Server-side (`lib/server/auth.ts`)**:
  - `hasXvipRole(role)` mengembalikan `true` hanya untuk `owner`, `admin`, `xvip`.
  - `requireXvipUser()` mengembalikan HTTP `401` jika belum login dan HTTP `403` jika role adalah `member`.
  - Diterapkan pada seluruh endpoint XVIP:
    - `app/api/tools/source/route.ts`
    - `app/api/tools/ngl/route.ts`
    - `app/api/tools/stalk-game/route.ts`
    - `app/api/tools/stalk-social/route.ts`
    - `app/api/tools/download/route.ts` (khusus saat `body.xvip === true` atau `platform === "all"`; downloader reguler `instagram`, `tiktok`, `youtube`, `x`, `pinterest`, `facebook`, `threads` tetap bisa dipakai `member`).
- **Client-side (`lib/vip-tools-client.js`)**:
  - `hasXvipAccess(role)` dan `canCurrentUserAccessXvip()` mengontrol badge kartu (`XVIP` vs `XVIP LOCK`), banner info pada tab XVIP, serta gerbang modal `showXvipMessage()` (`#xvipLockedNotice`) sehingga `member` tidak bisa membuka modul XVIP lokal maupun server.
- **Manajemen Role**:
  - Owner bisa membuat/mengubah role akun ke `member`, `xvip`, `admin`, atau `owner` melalui `/owner` (`components/OwnerPanelClient.tsx`), Panel Owner inline di profil (`components/VipToolsApp.tsx` `#ownerAccRole`), atau `POST /api/owner/users` (`VALID_ROLES = ["member", "xvip", "admin", "owner"]`).

---

## 3. Peta Lengkap 75 Modul Tools & Backend API

### A. 30 Fitur Jaman Sekarang (UI di `lib/vip-tools-extra-ui.js`)

Seluruh UI 30 fitur ini berada di **`lib/vip-tools-extra-ui.js`** (di-import ke `lib/vip-tools-client.js` dan terdaftar di `BUILTIN_TOOL_IDS` pada `components/OwnerPanelClient.tsx`).

#### 1) Downloader & Media Sosmed (+3, kategori `downloader`, total 6)
1. `dl_sosmed` (`/api/tools/download`): Unduh video/foto HD publik dari X/Twitter (`fxtwitter` + `yt-dlp`), Pinterest, Facebook, dan Threads.
2. `dl_ytthumb` (`/api/tools/creator-kit`, `action: "yt_thumb"`): Ambil thumbnail YouTube Full HD 1280x720, SD, & HQ + tombol unduh via proxy.
3. `dl_music` (`/api/tools/live-hub`, `action: "music"`): Cari lagu, putar preview audio 30 detik (iTunes Search) + lirik lengkap (LRCLIB).

#### 2) Viral Maker, Stiker WA & Mockup Konten (+10, kategori `maker`, total 15)
Backend: **`app/api/tools/viral-maker/route.ts`** (menggunakan `sharp` + SVG renderer server-side).
4. `mk_wasticker` (`action: "wa_sticker"`): Stiker WhatsApp 512x512 WebP transparan (bulat/membulat/kotak) + teks atas/bawah.
5. `mk_fakewa` (`action: "fake_wa"`): Screenshot Fake Chat WhatsApp mode gelap/terang realistis.
6. `mk_faketweet` (`action: "fake_tweet"`): Generator postingan Fake Tweet X/Twitter centang biru custom.
7. `mk_fakespotify` (`action: "fake_spotify"`): Kartu Spotify Now Playing + lirik & cover album untuk IG Story.
8. `mk_fakenotif` (`action: "fake_notif"`): Mockup notifikasi lockscreen iPhone (WA, IG, DANA, BCA, TikTok, GoPay, Shopee).
9. `mk_fakestruk` (`action: "fake_struk"`): Mockup simulasi bukti transfer & e-wallet untuk hiburan (berlabel simulasi).
10. `mk_iggrid` (`action: "ig_grid"`): IG Feed 3x3 / 2x3 / 1x3 Splitter (potong foto jadi beberapa kotak feed siap unduh).
11. `mk_twibbon` (`action: "twibbon"`): Pasang bingkai Twibbon preset (Event, Merdeka, Ramadhan, Ulang Tahun, Kampus) atau frame PNG custom.
12. `mk_meme` (`action: "meme"`): Meme Generator resolusi HD dengan teks tebal bergaris tepi atas & bawah.
13. `mk_polaroid` (`action: "polaroid"`): Kartu Polaroid & kutipan estetik (Klasik, Hitam Putih Vintage, Gelap).

#### 3) Kreator, Suara TTS, QRIS & Game (+9, kategori `tools`, total 17)
Backend: **`app/api/tools/creator-kit/route.ts`** (menggunakan `qrcode`, Google TTS/Translate endpoint, dan standar EMVCo QRIS).
14. `gen_tts` (`action: "tts"`): Suara Narator Text-to-Speech (MP3 asli: Indonesia, Inggris, Jepang, Korea, Arab, Jawa, Sunda).
15. `gen_translate` (`action: "translate"`): Translator cepat multi-bahasa dengan deteksi bahasa otomatis.
16. `gen_walink` (`action: "wa_link"`): Generator tautan `wa.me` pesan otomatis + QR Code siap scan/unduh.
17. `gen_qris` (`action: "qris_dinamis"`): Konverter QRIS statis ke QRIS nominal dinamis + opsi biaya layanan & hitung ulang CRC16-CCITT EMVCo.
18. `gen_fancyfont` (`action: "fancy_font"`): 15 gaya font Unicode estetik untuk bio Instagram, TikTok & WhatsApp.
19. `gen_nickgame` (`action: "nick_game"`): 20 generator nickname simbol keren untuk Free Fire, MLBB, Valorant & PUBG.
20. `gen_tiktokcalc` (`action: "tiktok_calc"`): Kalkulator Engagement Rate (ER) & estimasi Rate Card endorse TikTok/Instagram Indonesia.
21. `gen_caption` (`action: "caption_hashtag"`): Ide caption viral + paket hashtag FYP per kategori (Daily, Bisnis/UMKM, Gaming, Aesthetic, Kuliner).
22. `gen_mlwr` (`action: "ml_winrate"`): Kalkulator Win Rate MLBB (hitung berapa win streak dibutuhkan untuk target WR).

#### 4) Hiburan Viral, Anime & Info Indonesia Live (+8, kategori `extra`, total 15)
Backend: **`app/api/tools/live-hub/route.ts`** + kartu PNG via **`app/api/tools/viral-maker/route.ts`** (`action: "fun_card"`).
23. `live_khodam` (`action: "khodam"` + `fun_card`): Cek Khodam viral deterministik + acak ulang + kartu PNG siap Story.
24. `live_jodoh` (`action: "jodoh"` + `fun_card`): Cek kecocokan nama, zodiak & hitungan Neptu Weton Jawa + kartu PNG.
25. `live_anime` (`action: "anime_search"`): Pencarian info anime (rating, episode, genre, sinopsis) via AniList GraphQL.
26. `live_animeart` (`action: "anime_art"`): Random Anime Art HD (SFW: Waifu, Neko, Kitsune, Husbando) via Nekos.best.
27. `live_bmkg` (`action: "bmkg"`): Info Gempa Indonesia live dari BMKG TEWS + peta guncangan (shakemap) & fallback USGS.
28. `live_weather` (`action: "weather"`): Prakiraan cuaca saat ini & 4 hari ke depan kota Indonesia via Open-Meteo.
29. `live_islami` (`action: "sholat"` & `action: "quran"`): Jadwal Sholat Kemenag RI (MyQuran API) + baca & audio murottal Al-Quran (eQuran.id).
30. `live_crypto` (`action: "crypto"`): Pantau harga kripto live BTC, ETH, SOL, USDT, TON, BNB, DOGE (CoinGecko) + konverter kurs IDR/USD/SGD/MYR/JPY/EUR.

### B. 45 Modul Bawaan yang Tetap Aktif
- **Downloader (3)**: `instagram`, `tiktok`, `youtube` (`/api/tools/download` + `/api/tools/proxy`).
- **VPS (8)**: `vps_dns`, `vps_http`, `vps_ip`, `vps_port` (`/api/tools/vps-net`), `vps_shortlink` (`/api/tools/shortlink` + `/s/[code]`), `vps_paste` (`/api/tools/paste` + `/p/[id]`), `vps_imgconv` (`/api/tools/imgconv`), `vps_status` (`/api/tools/vps-status`).
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
- `/usr/local/bin/yt-dlp` (wajib untuk `instagram`, `tiktok`, `youtube`, `dl_sosmed`, `xvip_allinone`). **Jangan dihapus.** Untuk update berkala:
  ```bash
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp
  ```
- `python3` (dibutuhkan oleh `yt-dlp`)
- `dig` (`dnsutils`) & `whois` (`whois`) untuk `vps_dns`
- `openssl`, `curl`, `df`, serta font sistem `DejaVu Sans` / `DejaVu Serif` (untuk rendering teks SVG `sharp` pada `viral-maker` dan `maker`).
- **Catatan**: `ffmpeg` dan `imagemagick` tidak wajib karena seluruh pemrosesan stiker/gambar/mockup memakai `sharp` (Node native).

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
   - Tambahkan domain/host produksi di **Firebase Console -> Authentication -> Settings -> Authorized domains**.
   - Aktifkan provider **Google** di Firebase Console -> Authentication -> Sign-in method.
   - Isi 6 field Firebase di `.env.local` atau lewat `/owner`.
2. **YouTube Downloader (`yt-dlp`)**:
   - Jika IP VPS terkena pembatasan anti-bot YouTube, simpan cookies Netscape lewat `/owner` (`data/yt-cookies.txt`, mode `0600`).
3. **SSRF Protection (`lib/server/net-guard.ts`)**:
   - Setiap route baru yang melakukan `fetch()` atau koneksi TCP ke URL/host input pengguna **wajib** memanggil `assertPublicHttpUrl()` atau `assertPublicHost()` agar IP loopback (`127.0.0.1`), metadata cloud (`169.254.169.254`), dan jaringan privat ditolak (HTTP `400`).

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
   - Semua listener/timer/ObjectURL di client wajib dibersihkan lewat fungsi `cleanup()` yang dikembalikan `initVipTools()` (atau `registerCleanup` di `lib/vip-tools-extra-ui.js`), agar navigasi `/` <-> `/owner` tidak membocorkan listener atau membuat `#loader` macet.
5. **Batas Wilayah Kerja di VPS Ini**:
   - Edit hanya di dalam `/root/vip-tools`. Jangan menyentuh `/root/mattzzzz`.
   - Jangan mematikan proses sistem pada port `20128`.
   - Jika menjalankan server uji sementara (mis. port `3099`), selalu matikan proses beserta child process-nya setelah verifikasi selesai.

---

## 6. Checklist AI Selanjutnya (Menjalankan & Verifikasi)

### A. Menjalankan Aplikasi di Produksi
```bash
cd /root/vip-tools
npx tsc --noEmit
rm -rf .next && npm run build
PORT=3000 npm run start
```
(Disarankan menjalankan `npm run start` di balik PM2 atau systemd + reverse proxy Nginx/Caddy dengan HTTPS agar cookie `Secure` dan Google Sign-In berjalan mulus.)

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
- `lib/vip-tools-extra-ui.js`: Katalog & renderer UI 30 fitur jaman sekarang.
- `lib/vip-tools-client.js`: State utama, auth, katalog gabungan 75 tools, gerbang `xvip`, dan renderer 45 fitur bawaan.
- `lib/server/auth.ts` & `lib/server/store.ts`: Session HMAC, role `UserRole`, `requireXvipUser()`, `requireOwnerUser()`, dan penyimpanan `data/store.json`.
- `lib/server/net-guard.ts`: Validasi URL publik anti-SSRF.
- `app/api/tools/*`: Semua backend API tools (`viral-maker`, `creator-kit`, `live-hub`, `download`, `proxy`, `vps-net`, `vps-status`, `shortlink`, `paste`, `qr`, `maker`, `imgconv`, `removebg`, `enhance`, `source`, `ngl`, `stalk-game`, `stalk-social`).
- `components/VipToolsApp.tsx` & `components/OwnerPanelClient.tsx`: Markup SSR halaman utama dan panel `/owner`.
