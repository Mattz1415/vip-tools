# VIP Tools

Web tools statis (single-file `index.html`) tanpa gatekeeper atau persyaratan join saluran WhatsApp.

## Menjalankan Secara Lokal

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080` di browser.

## Perubahan dari Versi Asli

- Menghapus halaman gatekeeper saluran WhatsApp (`all-tools-free.netlify.app`) sehingga langsung masuk ke aplikasi utama.
- Menghapus popup notifikasi dan tombol wajib join saluran WhatsApp.
- Menghapus token bot Telegram hardcoded dan pengiriman kredensial login ke pihak ketiga.
- Menghapus tautan tool phishing (`Phising Get Foto`).
