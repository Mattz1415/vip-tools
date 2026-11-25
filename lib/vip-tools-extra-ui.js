// 30 Modern VPS-Powered Utilities for MattzLM (45 existing + 30 new = 75 total)

export const EXTRA_30_TOOLS = [
    // ===== VPS Web Audit & Network Utilities (+10) =====
    { id: 'vps_seo', icon: 'fa-solid fa-magnifying-glass-chart', name: 'SEO & OpenGraph Inspector', desc: 'Audit meta title, OG, H1/H2, alt gambar, & skor SEO', badge: 'SEO', category: 'vps' },
    { id: 'vps_secheaders', icon: 'fa-solid fa-lock', name: 'Security Headers Grader', desc: 'Nilai HSTS, CSP, X-Frame-Options, & kebocoran header', badge: 'SEC', category: 'vps' },
    { id: 'vps_redirect', icon: 'fa-solid fa-route', name: 'Redirect & Link Checker', desc: 'Lacak rantai redirect HTTP & uji tautan halaman', badge: 'HTTP', category: 'vps' },
    { id: 'vps_sitemap', icon: 'fa-solid fa-sitemap', name: 'Robots & Sitemap Parser', desc: 'Ekstrak aturan robots.txt & daftar URL sitemap.xml', badge: 'XML', category: 'vps' },
    { id: 'vps_emailcheck', icon: 'fa-solid fa-envelope-circle-check', name: 'Email MX / SPF / DMARC', desc: 'Validasi MX, SPF, DMARC, & cek email sekali pakai', badge: 'DNS', category: 'vps' },
    { id: 'vps_uptime', icon: 'fa-solid fa-gauge-high', name: 'HTTP Latency & Uptime', desc: 'Uji ketersediaan & latensi multi-sampel dari VPS', badge: 'PING', category: 'vps' },
    { id: 'vps_techstack', icon: 'fa-solid fa-layer-group', name: 'Web Tech Stack Detector', desc: 'Deteksi framework, server, CDN, & library situs', badge: 'TECH', category: 'vps' },
    { id: 'vps_markdown', icon: 'fa-solid fa-file-lines', name: 'Webpage to Markdown', desc: 'Ubah halaman artikel web ke teks Markdown bersih', badge: 'MD', category: 'vps' },
    { id: 'vps_rss', icon: 'fa-solid fa-rss', name: 'RSS & Atom Feed Reader', desc: 'Baca feed RSS atau Atom blog & berita via VPS', badge: 'RSS', category: 'vps' },
    { id: 'vps_currency', icon: 'fa-solid fa-coins', name: 'Live Currency Converter', desc: 'Konversi kurs IDR, USD, EUR, JPY, SGD real-time', badge: 'FX', category: 'vps' },

    // ===== Image, Media & Document Studio (+8 in maker) =====
    { id: 'img_exif', icon: 'fa-solid fa-camera', name: 'EXIF Inspector & Stripper', desc: 'Cek metadata EXIF/ICC & hapus jejak privasi foto', badge: 'EXIF', category: 'maker' },
    { id: 'img_watermark', icon: 'fa-solid fa-stamp', name: 'Image Watermark Studio', desc: 'Tambah watermark teks sudut, tengah, atau tile', badge: 'PNG', category: 'maker' },
    { id: 'img_socialcrop', icon: 'fa-solid fa-crop-simple', name: 'Social Media Smart Crop', desc: 'Potong otomatis ukuran IG, Reels, YouTube, & OG', badge: 'CROP', category: 'maker' },
    { id: 'img_palette', icon: 'fa-solid fa-palette', name: 'Color Palette Extractor', desc: 'Ekstrak 6 warna dominan HEX, RGB, & HSL dari foto', badge: 'HEX', category: 'maker' },
    { id: 'img_favicon', icon: 'fa-solid fa-icons', name: 'Favicon Pack Generator', desc: 'Buat favicon.ico multi-ukuran & ikon PNG website', badge: 'ICO', category: 'maker' },
    { id: 'img_filters', icon: 'fa-solid fa-circle-half-stroke', name: 'Photo Filter & Rotate', desc: 'Putar, balik, atur cahaya, blur, & filter foto', badge: 'EDIT', category: 'maker' },
    { id: 'img_svg2png', icon: 'fa-solid fa-vector-square', name: 'SVG to PNG Rasterizer', desc: 'Konversi kode atau file SVG ke PNG resolusi tinggi', badge: 'SVG', category: 'maker' },
    { id: 'doc_img2pdf', icon: 'fa-solid fa-file-pdf', name: 'Images to Multi-Page PDF', desc: 'Gabung hingga 10 foto menjadi satu dokumen PDF A4', badge: 'PDF', category: 'maker' },

    // ===== Modern Dev, Security & Productivity (+12 in tools) =====
    { id: 'doc_invoice', icon: 'fa-solid fa-file-invoice-dollar', name: 'Invoice PDF Generator', desc: 'Buat & unduh faktur tagihan PDF profesional di VPS', badge: 'PDF', category: 'tools' },
    { id: 'dev_jwt', icon: 'fa-solid fa-key', name: 'JWT Decoder & Signer', desc: 'Decode, verifikasi HMAC, & buat token JWT HS256/512', badge: 'JWT', category: 'tools' },
    { id: 'dev_hash', icon: 'fa-solid fa-shield', name: 'Multi-Hash & Checksum', desc: 'Hitung MD5, SHA256, SHA3, BLAKE2b, & HMAC teks/file', badge: 'HASH', category: 'tools' },
    { id: 'dev_encrypt', icon: 'fa-solid fa-user-lock', name: 'AES-256-GCM Encryptor', desc: 'Enkripsi & dekripsi pesan sensitif dengan kunci', badge: 'AES', category: 'tools' },
    { id: 'dev_uuid', icon: 'fa-solid fa-fingerprint', name: 'UUID v7 / ULID / NanoID', desc: 'Generate massal ID kriptografis v4, v7, ULID, NanoID', badge: 'ID', category: 'tools' },
    { id: 'dev_compress', icon: 'fa-solid fa-file-zipper', name: 'Gzip & Brotli Compressor', desc: 'Kompres & dekompresi teks Brotli, Gzip, Deflate', badge: 'ZIP', category: 'tools' },
    { id: 'qr_pro', icon: 'fa-solid fa-qrcode', name: 'QR Pro (WiFi / WA / vCard)', desc: 'Buat QR khusus WiFi, chat WhatsApp, kontak, & email', badge: 'QR+', category: 'tools' },
    { id: 'dev_csvjson', icon: 'fa-solid fa-table', name: 'CSV / JSON / MD Table', desc: 'Konversi bolak-balik CSV, JSON, & tabel Markdown', badge: 'DATA', category: 'tools' },
    { id: 'dev_diff', icon: 'fa-solid fa-code-compare', name: 'Text & Code Diff Checker', desc: 'Bandingkan dua teks atau kode baris demi baris', badge: 'DIFF', category: 'tools' },
    { id: 'dev_regex', icon: 'fa-solid fa-terminal', name: 'Regex Tester & Replacer', desc: 'Uji pola RegExp, capture group, & simulasi replace', badge: 'REGX', category: 'tools' },
    { id: 'dev_cron', icon: 'fa-solid fa-clock', name: 'Cron Schedule Simulator', desc: 'Terjemahkan cron 5-kolom & 10 jadwal eksekusi WIB', badge: 'CRON', category: 'tools' },
    { id: 'net_subnet', icon: 'fa-solid fa-diagram-project', name: 'IPv4 CIDR Subnet Calc', desc: 'Hitung network, broadcast, mask, host, & biner IPv4', badge: 'CIDR', category: 'tools' }
];

async function postJson(url, payload) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
        throw new Error(data.error || `Permintaan gagal (HTTP ${res.status})`);
    }
    return data;
}

export function renderExtraTool(toolId, body, meta, helpers) {
    const { escapeHtml, toast, registerCleanup } = helpers;
    const { name, icon } = meta;
    const blobUrls = [];
    const trackUrl = (blob) => {
        const u = URL.createObjectURL(blob);
        blobUrls.push(u);
        return u;
    };
    if (typeof registerCleanup === 'function') {
        registerCleanup(() => {
            while (blobUrls.length) {
                try {
                    URL.revokeObjectURL(blobUrls.pop());
                } catch {}
            }
        });
    }

    const headHtml = (subtitle) => `
        <h2 id="toolViewerTitle"><i class="${escapeHtml(icon)}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
        <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">${escapeHtml(subtitle)}</p>
    `;

    // ===== 1. SEO & OpenGraph Inspector =====
    if (toolId === 'vps_seo') {
        body.innerHTML = `
            ${headHtml('Audit tag SEO, OpenGraph, heading H1/H2, atribut alt gambar, dan skor kesiapan indeks lewat VPS.')}
            <label for="seoUrlIn" class="v-label">URL Website Target</label>
            <input type="url" id="seoUrlIn" class="v-input" placeholder="https://example.com">
            <button type="button" class="v-btn" id="seoRunBtn"><i class="fas fa-magnifying-glass-chart" aria-hidden="true"></i> Audit SEO</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('seoRunBtn').onclick = async () => {
            const target = document.getElementById('seoUrlIn').value.trim();
            const btn = document.getElementById('seoRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan URL website target.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Menganalisis SEO halaman...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'seo', target });
                const checksHtml = (d.checks || [])
                    .map((c) => `
                        <div class="vps-kv-item">
                            <span>${c.pass ? '[LULUS]' : '[PERLU PERBAIKAN]'} ${escapeHtml(c.label)}</span>
                            <strong>${escapeHtml(c.detail)}</strong>
                        </div>
                    `)
                    .join('');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>Skor SEO</span><strong>${d.score} / 100</strong></div>
                            <div class="vps-kv-item"><span>HTTP / Latensi</span><strong>${d.status} / ${d.latencyMs} ms</strong></div>
                            <div class="vps-kv-item"><span>Judul Halaman</span><strong>${escapeHtml(d.title || '(Kosong)')}</strong></div>
                            <div class="vps-kv-item"><span>Bahasa / Robots</span><strong>${escapeHtml(d.lang)} / ${escapeHtml(d.robots)}</strong></div>
                            <div class="vps-kv-item"><span>Meta Description</span><strong>${escapeHtml(d.description || '(Kosong)')}</strong></div>
                            <div class="vps-kv-item"><span>Canonical</span><strong>${escapeHtml(d.canonical)}</strong></div>
                            <div class="vps-kv-item"><span>OG Title</span><strong>${escapeHtml(d.og?.title || '-')}</strong></div>
                            <div class="vps-kv-item"><span>OG Image</span><strong>${escapeHtml(d.og?.image || '-')}</strong></div>
                        </div>
                        <div class="vps-kv-grid">${checksHtml}</div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 2. Security Headers Grader =====
    if (toolId === 'vps_secheaders') {
        body.innerHTML = `
            ${headHtml('Evaluasi header keamanan HTTP (HSTS, CSP, X-Frame-Options, nosniff, Referrer & Permissions Policy).')}
            <label for="secUrlIn" class="v-label">URL Target</label>
            <input type="url" id="secUrlIn" class="v-input" placeholder="https://example.com">
            <button type="button" class="v-btn" id="secRunBtn"><i class="fas fa-lock" aria-hidden="true"></i> Periksa Keamanan Header</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('secRunBtn').onclick = async () => {
            const target = document.getElementById('secUrlIn').value.trim();
            const btn = document.getElementById('secRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan URL target.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memeriksa header keamanan...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'security', target });
                const rows = (d.audit || [])
                    .map((a) => `
                        <div class="vps-kv-item">
                            <span>${a.present ? '[OK]' : '[TIDAK ADA]'} ${escapeHtml(a.header)} (${a.weight} poin)</span>
                            <strong>${escapeHtml(a.value)}</strong>
                            ${a.present ? '' : `<small style="color:var(--text-muted);font-size:0.75rem;">${escapeHtml(a.tip)}</small>`}
                        </div>
                    `)
                    .join('');
                const leaks = (d.leaks || []).length
                    ? `<p style="font-size:0.8rem;color:var(--status-warn);margin-top:10px;">Info header terbuka: ${d.leaks.map((l) => `${escapeHtml(l.header)}=${escapeHtml(l.value)}`).join(', ')}</p>`
                    : `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:10px;">Tidak ada header server/x-powered-by yang bocor.</p>`;
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>Grade Keamanan</span><strong>${escapeHtml(d.grade)} (${d.score}/100)</strong></div>
                            <div class="vps-kv-item"><span>URL Final (HTTP ${d.status})</span><strong>${escapeHtml(d.finalUrl)}</strong></div>
                        </div>
                        <div class="vps-kv-grid">${rows}</div>
                        ${leaks}
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 3. Redirect & Link Checker =====
    if (toolId === 'vps_redirect') {
        body.innerHTML = `
            ${headHtml('Lacak seluruh hop pengalihan HTTP (301/302/307/308) serta cek status tautan aktif pada halaman.')}
            <label for="redUrlIn" class="v-label">URL Target</label>
            <input type="url" id="redUrlIn" class="v-input" placeholder="http://github.com">
            <label style="display:flex;align-items:center;gap:8px;font-size:0.84rem;color:var(--text-muted);margin-bottom:12px;">
                <input type="checkbox" id="redCheckLinks"> Sekaligus uji hingga 12 tautan di halaman akhir
            </label>
            <button type="button" class="v-btn" id="redRunBtn"><i class="fas fa-route" aria-hidden="true"></i> Lacak Redirect</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('redRunBtn').onclick = async () => {
            const target = document.getElementById('redUrlIn').value.trim();
            const checkLinks = Boolean(document.getElementById('redCheckLinks')?.checked);
            const btn = document.getElementById('redRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan URL target.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Melacak rantai redirect...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'redirect', target, checkLinks });
                const hopText = (d.hops || [])
                    .map((h, i) => `#${i + 1} [${h.status}] ${h.url} (${h.latencyMs}ms)${h.location ? '\n    -> ' + h.location : ''}`)
                    .join('\n');
                const linksBlock = (d.checkedLinks || []).length
                    ? `<label class="v-label" style="margin-top:10px;">Status Tautan Halaman (${d.checkedLinks.length})</label><pre class="vps-code-out">${escapeHtml(d.checkedLinks.map((l) => `[${l.status}] ${l.latencyMs}ms  ${l.url}`).join('\n'))}</pre>`
                    : '';
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>Total Hop</span><strong>${(d.hops || []).length} langkah (${d.totalLatencyMs} ms)</strong></div>
                            <div class="vps-kv-item"><span>Status Akhir</span><strong>HTTP ${d.finalStatus}</strong></div>
                        </div>
                        <label class="v-label">Rantai Redirect</label>
                        <pre class="vps-code-out">${escapeHtml(hopText)}</pre>
                        ${linksBlock}
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 4. Robots & Sitemap Parser =====
    if (toolId === 'vps_sitemap') {
        body.innerHTML = `
            ${headHtml('Ambil isi robots.txt dan ekstrak daftar URL dari sitemap.xml domain target lewat VPS.')}
            <label for="smUrlIn" class="v-label">Domain atau URL</label>
            <input type="text" id="smUrlIn" class="v-input" placeholder="nextjs.org">
            <button type="button" class="v-btn" id="smRunBtn"><i class="fas fa-sitemap" aria-hidden="true"></i> Parse Robots &amp; Sitemap</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('smRunBtn').onclick = async () => {
            const target = document.getElementById('smUrlIn').value.trim();
            const btn = document.getElementById('smRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan domain target.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Membaca robots.txt &amp; sitemap.xml...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'sitemap', target });
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>robots.txt</span><strong>HTTP ${d.robotsStatus || 'N/A'}</strong></div>
                            <div class="vps-kv-item"><span>Sitemap URL (${d.urlCount})</span><strong>HTTP ${d.sitemapStatus || 'N/A'}</strong></div>
                        </div>
                        <label class="v-label">Pratinjau robots.txt</label>
                        <pre class="vps-code-out">${escapeHtml(d.robotsPreview)}</pre>
                        <label class="v-label" style="margin-top:10px;">URL di ${escapeHtml(d.sitemapUrl)} (maks. 60)</label>
                        <pre class="vps-code-out">${escapeHtml((d.urls || []).join('\n') || 'Tidak ada entri <loc> ditemukan.')}</pre>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 5. Email MX / SPF / DMARC Validator =====
    if (toolId === 'vps_emailcheck') {
        body.innerHTML = `
            ${headHtml('Cek validitas format, record MX, kebijakan SPF, DMARC, dan deteksi domain email sementara.')}
            <label for="emIn" class="v-label">Alamat Email atau Domain</label>
            <input type="text" id="emIn" class="v-input" placeholder="nama@gmail.com atau github.com">
            <button type="button" class="v-btn" id="emRunBtn"><i class="fas fa-envelope-circle-check" aria-hidden="true"></i> Validasi Domain Email</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('emRunBtn').onclick = async () => {
            const target = document.getElementById('emIn').value.trim();
            const btn = document.getElementById('emRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan email atau domain.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memeriksa MX, SPF, dan DMARC...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'email', target });
                const mxLines = (d.mx || []).map((m) => `prio ${m.priority}  ${m.exchange}`).join('\n') || 'Tidak ada record MX.';
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>Domain</span><strong>${escapeHtml(d.domain)}</strong></div>
                            <div class="vps-kv-item"><span>Status Pengiriman</span><strong>${d.deliverable ? 'SIAP TERIMA EMAIL' : 'TIDAK VALID / BERISIKO'}</strong></div>
                            <div class="vps-kv-item"><span>Email Sementara</span><strong>${d.disposable ? 'YA (Disposable)' : 'Bukan'}</strong></div>
                            <div class="vps-kv-item"><span>Jumlah Server MX</span><strong>${(d.mx || []).length}</strong></div>
                            <div class="vps-kv-item"><span>SPF Record</span><strong>${escapeHtml(d.spf || 'Belum dikonfigurasi')}</strong></div>
                            <div class="vps-kv-item"><span>DMARC Record</span><strong>${escapeHtml(d.dmarc || 'Belum dikonfigurasi')}</strong></div>
                        </div>
                        <label class="v-label">Mail Exchange (MX)</label>
                        <pre class="vps-code-out">${escapeHtml(mxLines)}</pre>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 6. HTTP Latency & Uptime Probe =====
    if (toolId === 'vps_uptime') {
        body.innerHTML = `
            ${headHtml('Uji kestabilan respon server target dengan 2 sampai 5 kali permintaan berurutan dari VPS.')}
            <label for="upUrlIn" class="v-label">URL Target</label>
            <input type="url" id="upUrlIn" class="v-input" placeholder="https://example.com">
            <label for="upSamples" class="v-label">Jumlah Sampel Uji</label>
            <select id="upSamples" class="v-input">
                <option value="3" selected>3 Kali Uji</option>
                <option value="4">4 Kali Uji</option>
                <option value="5">5 Kali Uji</option>
            </select>
            <button type="button" class="v-btn" id="upRunBtn"><i class="fas fa-gauge-high" aria-hidden="true"></i> Mulai Probe Latensi</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('upRunBtn').onclick = async () => {
            const target = document.getElementById('upUrlIn').value.trim();
            const samples = Number(document.getElementById('upSamples').value || 3);
            const btn = document.getElementById('upRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan URL target.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Menjalankan ${samples}x probe HTTP...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'uptime', target, samples });
                const rows = (d.runs || [])
                    .map((r) => `Uji #${r.run}  HTTP ${r.status}  ${r.latencyMs} ms  ${(r.bytes / 1024).toFixed(1)} KB  ${r.ok ? '[OK]' : '[GAGAL]'}`)
                    .join('\n');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>Ketersediaan</span><strong>${d.availabilityPercent}%</strong></div>
                            <div class="vps-kv-item"><span>Rata-rata</span><strong>${d.avgMs} ms</strong></div>
                            <div class="vps-kv-item"><span>Tercepat (Min)</span><strong>${d.minMs} ms</strong></div>
                            <div class="vps-kv-item"><span>Terlambat (Max)</span><strong>${d.maxMs} ms</strong></div>
                        </div>
                        <pre class="vps-code-out">${escapeHtml(rows)}</pre>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 7. Web Tech Stack Detector =====
    if (toolId === 'vps_techstack') {
        body.innerHTML = `
            ${headHtml('Kenali framework, CDN, web server, CMS, CSS framework, dan skrip analitik yang dipakai website.')}
            <label for="techUrlIn" class="v-label">URL Website</label>
            <input type="url" id="techUrlIn" class="v-input" placeholder="https://nextjs.org">
            <button type="button" class="v-btn" id="techRunBtn"><i class="fas fa-layer-group" aria-hidden="true"></i> Deteksi Teknologi</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('techRunBtn').onclick = async () => {
            const target = document.getElementById('techUrlIn').value.trim();
            const btn = document.getElementById('techRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan URL website.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memindai fingerprint teknologi...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'tech', target });
                const list = (d.detected || []).length
                    ? d.detected
                          .map((item) => `
                              <div class="vps-kv-item">
                                  <span>${escapeHtml(item.category)}</span>
                                  <strong>${escapeHtml(item.name)}</strong>
                                  <small style="color:var(--text-muted);font-size:0.74rem;">${escapeHtml(item.evidence)}</small>
                              </div>
                          `)
                          .join('')
                    : `<p style="color:var(--text-muted);font-size:0.84rem;">Tidak ada fingerprint framework publik yang terdeteksi.</p>`;
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>Terdeteksi</span><strong>${d.detectedCount} teknologi</strong></div>
                            <div class="vps-kv-item"><span>Server Header</span><strong>${escapeHtml(d.server)}</strong></div>
                        </div>
                        <div class="vps-kv-grid">${list}</div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 8. Webpage to Markdown =====
    if (toolId === 'vps_markdown') {
        body.innerHTML = `
            ${headHtml('Konversi artikel atau dokumentasi web menjadi teks Markdown bersih, siap untuk catatan atau prompt.')}
            <label for="mdUrlIn" class="v-label">URL Halaman Web</label>
            <input type="url" id="mdUrlIn" class="v-input" placeholder="https://example.com">
            <button type="button" class="v-btn" id="mdRunBtn"><i class="fas fa-file-lines" aria-hidden="true"></i> Ekstrak ke Markdown</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('mdRunBtn').onclick = async () => {
            const target = document.getElementById('mdUrlIn').value.trim();
            const btn = document.getElementById('mdRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan URL halaman.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Mengekstrak konten Markdown...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'markdown', target });
                const mdUrl = trackUrl(new Blob([d.markdown], { type: 'text/markdown;charset=utf-8' }));
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid" style="margin-bottom:10px;">
                            <div class="vps-kv-item"><span>Jumlah Kata</span><strong>${d.words} kata</strong></div>
                            <div class="vps-kv-item"><span>Estimasi Baca</span><strong>~${d.readingMinutes} menit</strong></div>
                        </div>
                        <textarea id="mdOutArea" class="v-input" rows="10" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.78rem;">${escapeHtml(d.markdown)}</textarea>
                        <div class="owner-action-row">
                            <button type="button" class="v-btn" id="mdCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Markdown</button>
                            <a href="${mdUrl}" download="page_${Date.now()}.md" class="v-btn v-btn-secondary"><i class="fas fa-download" aria-hidden="true"></i> Unduh .md</a>
                        </div>
                    </div>
                `;
                document.getElementById('mdCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(d.markdown);
                    toast('Markdown disalin.');
                };
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 9. RSS & Atom Feed Reader =====
    if (toolId === 'vps_rss') {
        body.innerHTML = `
            ${headHtml('Baca dan ekstrak artikel terbaru dari URL RSS atau Atom feed tanpa kendala CORS browser.')}
            <label for="rssUrlIn" class="v-label">URL Feed RSS / Atom</label>
            <input type="url" id="rssUrlIn" class="v-input" placeholder="https://hnrss.org/frontpage">
            <button type="button" class="v-btn" id="rssRunBtn"><i class="fas fa-rss" aria-hidden="true"></i> Muat Feed</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('rssRunBtn').onclick = async () => {
            const target = document.getElementById('rssUrlIn').value.trim();
            const btn = document.getElementById('rssRunBtn');
            const out = document.getElementById('toolResult');
            if (!target) return toast('Masukkan URL feed RSS/Atom.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memuat entri feed...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'rss', target });
                const cards = (d.items || [])
                    .map((it) => `
                        <div class="vps-kv-item" style="margin-bottom:8px;">
                            <span>${escapeHtml(it.pubDate)}</span>
                            <strong>${it.link ? `<a href="${escapeHtml(it.link)}" target="_blank" rel="noopener noreferrer" style="color:var(--text-primary);">${escapeHtml(it.title)}</a>` : escapeHtml(it.title)}</strong>
                            ${it.summary ? `<small style="color:var(--text-muted);font-size:0.78rem;">${escapeHtml(it.summary)}</small>` : ''}
                        </div>
                    `)
                    .join('');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.84rem;margin-bottom:10px;"><strong>${escapeHtml(d.feedTitle)}</strong> (${escapeHtml(d.feedType)}, ${d.count} entri)</p>
                        <div style="max-height:360px;overflow:auto;">${cards}</div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 10. Live Currency Converter =====
    if (toolId === 'vps_currency') {
        const codes = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'GBP', 'AUD', 'KRW', 'CNY', 'THB', 'SAR'];
        const opts = (sel) => codes.map((c) => `<option value="${c}"${c === sel ? ' selected' : ''}>${c}</option>`).join('');
        body.innerHTML = `
            ${headHtml('Konversi mata uang real-time (kurs live dicache VPS) untuk kebutuhan belanja, freelance, dan invoice.')}
            <label for="fxAmount" class="v-label">Nominal</label>
            <input type="number" id="fxAmount" class="v-input" value="100" min="0" step="any">
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div>
                    <label for="fxFrom" class="v-label">Dari</label>
                    <select id="fxFrom" class="v-input" style="margin-bottom:0;">${opts('USD')}</select>
                </div>
                <div>
                    <label for="fxTo" class="v-label">Ke</label>
                    <select id="fxTo" class="v-input" style="margin-bottom:0;">${opts('IDR')}</select>
                </div>
            </div>
            <button type="button" class="v-btn" id="fxRunBtn"><i class="fas fa-coins" aria-hidden="true"></i> Hitung Kurs</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('fxRunBtn').onclick = async () => {
            const amount = Number(document.getElementById('fxAmount').value);
            const from = document.getElementById('fxFrom').value;
            const to = document.getElementById('fxTo').value;
            const btn = document.getElementById('fxRunBtn');
            const out = document.getElementById('toolResult');
            if (!Number.isFinite(amount) || amount < 0) return toast('Nominal tidak valid.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Mengambil kurs terbaru...</div>`;
            try {
                const d = await postJson('/api/tools/web-inspect', { action: 'currency', amount, from, to });
                const grid = (d.popularTargets || [])
                    .map((p) => `<div class="vps-kv-item"><span>${escapeHtml(p.code)}</span><strong>${Number(p.value).toLocaleString('id-ID')} ${escapeHtml(p.code)}</strong></div>`)
                    .join('');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:1.25rem;font-weight:700;margin-bottom:4px;font-family:'IBM Plex Mono',monospace;">
                            ${Number(d.amount).toLocaleString('id-ID')} ${escapeHtml(d.from)} = ${Number(d.converted).toLocaleString('id-ID')} ${escapeHtml(d.to)}
                        </p>
                        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">
                            1 ${escapeHtml(d.from)} = ${d.unitRate} ${escapeHtml(d.to)} | Sumber: ${escapeHtml(d.source)}
                        </p>
                        <div class="vps-kv-grid">${grid}</div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 11. EXIF Inspector & Privacy Stripper =====
    if (toolId === 'img_exif') {
        body.innerHTML = `
            ${headHtml('Inspeksi metadata kamera/EXIF/ICC/XMP pada foto, lalu hapus seluruh metadata tersembunyi untuk privasi.')}
            <label for="exifFile" class="v-label">Pilih Gambar (maks. 10MB)</label>
            <input type="file" id="exifFile" class="v-input" accept="image/*">
            <div class="owner-action-row">
                <button type="button" class="v-btn" id="exifInspectBtn"><i class="fas fa-magnifying-glass" aria-hidden="true"></i> Cek Metadata</button>
                <button type="button" class="v-btn v-btn-secondary" id="exifStripBtn"><i class="fas fa-eraser" aria-hidden="true"></i> Hapus EXIF &amp; Unduh</button>
            </div>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('exifInspectBtn').onclick = async () => {
            const file = document.getElementById('exifFile').files?.[0];
            const out = document.getElementById('toolResult');
            if (!file) return toast('Pilih gambar terlebih dahulu.');
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Membaca metadata gambar...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'exif');
                fd.append('file', file);
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                const d = await res.json();
                if (!res.ok || !d.ok) throw new Error(d.error || 'Gagal membaca metadata.');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid">
                            <div class="vps-kv-item"><span>Format &amp; Dimensi</span><strong>${escapeHtml(String(d.format).toUpperCase())} ${d.width}x${d.height}px</strong></div>
                            <div class="vps-kv-item"><span>Ukuran File</span><strong>${(d.bytes / 1024).toFixed(1)} KB</strong></div>
                            <div class="vps-kv-item"><span>Ruang Warna / Channel</span><strong>${escapeHtml(d.space)} (${d.channels} ch)</strong></div>
                            <div class="vps-kv-item"><span>Alpha / Opaque</span><strong>${d.hasAlpha ? 'Ada Alpha' : 'Tanpa Alpha'}</strong></div>
                            <div class="vps-kv-item"><span>EXIF / ICC</span><strong>${d.metadataBlocks?.exifBytes || 0} B / ${d.metadataBlocks?.iccBytes || 0} B</strong></div>
                            <div class="vps-kv-item"><span>XMP / IPTC</span><strong>${d.metadataBlocks?.xmpBytes || 0} B / ${d.metadataBlocks?.iptcBytes || 0} B</strong></div>
                            <div class="vps-kv-item"><span>Status Privasi</span><strong>${d.hasMetadata ? 'Mengandung metadata' : 'Sudah bersih'}</strong></div>
                            <div class="vps-kv-item"><span>Entropi Detail</span><strong>${d.entropy}</strong></div>
                        </div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        document.getElementById('exifStripBtn').onclick = async () => {
            const file = document.getElementById('exifFile').files?.[0];
            const out = document.getElementById('toolResult');
            if (!file) return toast('Pilih gambar terlebih dahulu.');
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Menghapus seluruh metadata EXIF...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'strip_exif');
                fd.append('file', file);
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal menghapus EXIF.');
                }
                const orig = Number(res.headers.get('X-Original-Bytes') || file.size);
                const outB = Number(res.headers.get('X-Output-Bytes') || 0);
                const ext = res.headers.get('X-Output-Ext') || 'jpg';
                const url = trackUrl(await res.blob());
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:10px;">
                            Metadata EXIF/ICC/XMP dihapus. ${(orig / 1024).toFixed(1)} KB menjadi <strong>${(outB / 1024).toFixed(1)} KB</strong>.
                        </p>
                        <img src="${url}" width="460" height="300" alt="Gambar tanpa metadata EXIF" class="result-media">
                        <a href="${url}" download="clean_no_exif_${Date.now()}.${escapeHtml(ext)}" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh Foto Bersih</a>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 12. Image Watermark Studio =====
    if (toolId === 'img_watermark') {
        body.innerHTML = `
            ${headHtml('Tambahkan watermark teks anti-colong ke gambar (posisi sudut, tengah, atau pola diagonal berulang).')}
            <label for="wmFile" class="v-label">Pilih Gambar (maks. 10MB)</label>
            <input type="file" id="wmFile" class="v-input" accept="image/*">
            <label for="wmText" class="v-label">Teks Watermark</label>
            <input type="text" id="wmText" class="v-input" value="© MattzLM" maxlength="60">
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div>
                    <label for="wmPos" class="v-label">Posisi</label>
                    <select id="wmPos" class="v-input" style="margin-bottom:0;">
                        <option value="southeast">Kanan Bawah</option>
                        <option value="southwest">Kiri Bawah</option>
                        <option value="northeast">Kanan Atas</option>
                        <option value="northwest">Kiri Atas</option>
                        <option value="center">Tengah</option>
                        <option value="tile">Pola Tile Diagonal</option>
                    </select>
                </div>
                <div>
                    <label for="wmTone" class="v-label">Warna Teks</label>
                    <select id="wmTone" class="v-input" style="margin-bottom:0;">
                        <option value="light">Putih (Outline Gelap)</option>
                        <option value="dark">Hitam (Outline Terang)</option>
                    </select>
                </div>
            </div>
            <label for="wmOpacity" class="v-label">Opasitas (0.1 - 0.95)</label>
            <input type="number" id="wmOpacity" class="v-input" value="0.55" min="0.1" max="0.95" step="0.05">
            <button type="button" class="v-btn" id="wmRunBtn"><i class="fas fa-stamp" aria-hidden="true"></i> Terapkan Watermark</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('wmRunBtn').onclick = async () => {
            const file = document.getElementById('wmFile').files?.[0];
            const btn = document.getElementById('wmRunBtn');
            const out = document.getElementById('toolResult');
            if (!file) return toast('Pilih gambar terlebih dahulu.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memasang watermark di VPS...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'watermark');
                fd.append('file', file);
                fd.append('text', document.getElementById('wmText').value.trim() || 'MattzLM');
                fd.append('position', document.getElementById('wmPos').value);
                fd.append('tone', document.getElementById('wmTone').value);
                fd.append('opacity', document.getElementById('wmOpacity').value);
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal memasang watermark.');
                }
                const dims = res.headers.get('X-Output-Dimensions') || '-';
                const url = trackUrl(await res.blob());
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">Dimensi: ${escapeHtml(dims)}</p>
                        <img src="${url}" width="480" height="320" alt="Gambar dengan watermark" class="result-media">
                        <a href="${url}" download="watermark_${Date.now()}.png" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 13. Social Media Smart Crop =====
    if (toolId === 'img_socialcrop') {
        body.innerHTML = `
            ${headHtml('Potong dan ubah ukuran gambar otomatis ke rasio media sosial dengan deteksi titik fokus (attention crop).')}
            <label for="scFile" class="v-label">Pilih Gambar</label>
            <input type="file" id="scFile" class="v-input" accept="image/*">
            <label for="scPreset" class="v-label">Preset Ukuran</label>
            <select id="scPreset" class="v-input">
                <option value="ig_square">Instagram Feed (1080x1080)</option>
                <option value="ig_portrait">Instagram Portrait (1080x1350)</option>
                <option value="ig_story">Reels / Story / TikTok (1080x1920)</option>
                <option value="yt_thumb">YouTube Thumbnail (1280x720)</option>
                <option value="og_card">OpenGraph / LinkedIn (1200x630)</option>
                <option value="x_header">X / Twitter Header (1500x500)</option>
            </select>
            <label for="scFit" class="v-label">Mode Penyesuaian</label>
            <select id="scFit" class="v-input">
                <option value="cover">Smart Crop Penuh (Cover)</option>
                <option value="contain">Muat Utuh dengan Latar Hitam (Contain)</option>
            </select>
            <button type="button" class="v-btn" id="scRunBtn"><i class="fas fa-crop-simple" aria-hidden="true"></i> Potong Gambar</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('scRunBtn').onclick = async () => {
            const file = document.getElementById('scFile').files?.[0];
            const btn = document.getElementById('scRunBtn');
            const out = document.getElementById('toolResult');
            if (!file) return toast('Pilih gambar terlebih dahulu.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memproses smart crop di VPS...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'social_crop');
                fd.append('file', file);
                fd.append('preset', document.getElementById('scPreset').value);
                fd.append('fit', document.getElementById('scFit').value);
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal memotong gambar.');
                }
                const dims = res.headers.get('X-Output-Dimensions') || '-';
                const url = trackUrl(await res.blob());
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">Hasil: <strong>${escapeHtml(dims)}</strong> (JPG)</p>
                        <img src="${url}" width="460" height="340" alt="Hasil smart crop media sosial" class="result-media">
                        <a href="${url}" download="social_${document.getElementById('scPreset').value}_${Date.now()}.jpg" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh JPG</a>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 14. Dominant Color Palette Extractor =====
    if (toolId === 'img_palette') {
        body.innerHTML = `
            ${headHtml('Ekstrak 6 warna dominan beserta kode HEX, RGB, HSL, dan persentase cakupan dari foto.')}
            <label for="palFile" class="v-label">Pilih Gambar</label>
            <input type="file" id="palFile" class="v-input" accept="image/*">
            <button type="button" class="v-btn" id="palRunBtn"><i class="fas fa-palette" aria-hidden="true"></i> Ekstrak Palet Warna</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('palRunBtn').onclick = async () => {
            const file = document.getElementById('palFile').files?.[0];
            const btn = document.getElementById('palRunBtn');
            const out = document.getElementById('toolResult');
            if (!file) return toast('Pilih gambar terlebih dahulu.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Mengekstrak warna dominan...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'palette');
                fd.append('file', file);
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                const d = await res.json();
                if (!res.ok || !d.ok) throw new Error(d.error || 'Gagal mengekstrak palet.');
                const swatches = (d.swatches || [])
                    .map((s) => `
                        <button type="button" class="palette-swatch" data-copy-hex="${escapeHtml(s.hex)}" style="background:${escapeHtml(s.hex)};color:${escapeHtml(s.textColor)};">
                            <strong>${escapeHtml(s.hex)}</strong>
                            <span>${escapeHtml(s.rgb)}</span>
                            <span>${escapeHtml(s.hsl)} (${s.percent}%)</span>
                        </button>
                    `)
                    .join('');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;">Klik kotak warna untuk menyalin kode HEX.</p>
                        <div class="palette-grid">${swatches}</div>
                    </div>
                `;
                out.querySelectorAll('[data-copy-hex]').forEach((el) => {
                    el.onclick = () => {
                        const hex = el.getAttribute('data-copy-hex');
                        navigator.clipboard.writeText(hex);
                        toast(`Kode ${hex} disalin.`);
                    };
                });
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 15. Favicon Pack Generator =====
    if (toolId === 'img_favicon') {
        body.innerHTML = `
            ${headHtml('Buat paket favicon.ico (16/32/48px), ikon PNG (32/180/192/512px), dan tag HTML head siap pakai.')}
            <label for="favFile" class="v-label">Pilih Logo / Gambar Persegi</label>
            <input type="file" id="favFile" class="v-input" accept="image/*">
            <button type="button" class="v-btn" id="favRunBtn"><i class="fas fa-icons" aria-hidden="true"></i> Generate Paket Favicon</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('favRunBtn').onclick = async () => {
            const file = document.getElementById('favFile').files?.[0];
            const btn = document.getElementById('favRunBtn');
            const out = document.getElementById('toolResult');
            if (!file) return toast('Pilih gambar logo terlebih dahulu.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Membuat paket favicon di VPS...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'favicon');
                fd.append('file', file);
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                const d = await res.json();
                if (!res.ok || !d.ok) throw new Error(d.error || 'Gagal membuat favicon.');
                const iconLinks = (d.icons || [])
                    .map((ic) => `
                        <a href="${ic.dataUrl}" download="${escapeHtml(ic.name)}" class="v-btn v-btn-secondary" style="font-size:0.8rem;">
                            <img src="${ic.dataUrl}" width="20" height="20" alt="${escapeHtml(ic.name)}" style="border-radius:4px;"> ${escapeHtml(ic.name)}
                        </a>
                    `)
                    .join('');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <a href="${d.icoDataUrl}" download="favicon.ico" class="v-btn" style="margin-bottom:10px;">
                            <i class="fas fa-download" aria-hidden="true"></i> Unduh favicon.ico (${(d.icoBytes / 1024).toFixed(1)} KB)
                        </a>
                        <div class="vps-kv-grid" style="margin-bottom:12px;">${iconLinks}</div>
                        <label class="v-label">Tag HTML &lt;head&gt;</label>
                        <pre class="vps-code-out">${escapeHtml(d.htmlSnippet)}</pre>
                        <button type="button" class="v-btn v-btn-secondary" id="favCopyHtml"><i class="fas fa-copy" aria-hidden="true"></i> Salin Tag HTML</button>
                    </div>
                `;
                document.getElementById('favCopyHtml').onclick = () => {
                    navigator.clipboard.writeText(d.htmlSnippet);
                    toast('Tag HTML favicon disalin.');
                };
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 16. Photo Filter & Rotate Studio =====
    if (toolId === 'img_filters') {
        body.innerHTML = `
            ${headHtml('Putar, balik horizontal/vertikal, atur kecerahan, saturasi, blur, sharpen, grayscale, atau invert.')}
            <label for="fltFile" class="v-label">Pilih Gambar</label>
            <input type="file" id="fltFile" class="v-input" accept="image/*">
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div>
                    <label for="fltRot" class="v-label">Rotasi</label>
                    <select id="fltRot" class="v-input" style="margin-bottom:0;">
                        <option value="0">0°</option>
                        <option value="90">90°</option>
                        <option value="180">180°</option>
                        <option value="270">270°</option>
                    </select>
                </div>
                <div>
                    <label for="fltBlur" class="v-label">Blur (0 - 20)</label>
                    <input type="number" id="fltBlur" class="v-input" style="margin-bottom:0;" value="0" min="0" max="20" step="0.5">
                </div>
                <div>
                    <label for="fltBright" class="v-label">Kecerahan (0.3 - 2.0)</label>
                    <input type="number" id="fltBright" class="v-input" style="margin-bottom:0;" value="1" min="0.3" max="2" step="0.1">
                </div>
                <div>
                    <label for="fltSat" class="v-label">Saturasi (0 - 2.5)</label>
                    <input type="number" id="fltSat" class="v-input" style="margin-bottom:0;" value="1" min="0" max="2.5" step="0.1">
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">
                <label><input type="checkbox" id="fltFlipH"> Flip Horizontal</label>
                <label><input type="checkbox" id="fltFlipV"> Flip Vertikal</label>
                <label><input type="checkbox" id="fltGray"> Grayscale</label>
                <label><input type="checkbox" id="fltNeg"> Negatif / Invert</label>
                <label><input type="checkbox" id="fltSharp"> Pertajam</label>
            </div>
            <button type="button" class="v-btn" id="fltRunBtn"><i class="fas fa-circle-half-stroke" aria-hidden="true"></i> Terapkan Edit Foto</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('fltRunBtn').onclick = async () => {
            const file = document.getElementById('fltFile').files?.[0];
            const btn = document.getElementById('fltRunBtn');
            const out = document.getElementById('toolResult');
            if (!file) return toast('Pilih gambar terlebih dahulu.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memproses filter di VPS...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'filters');
                fd.append('file', file);
                fd.append('rotate', document.getElementById('fltRot').value);
                fd.append('blur', document.getElementById('fltBlur').value);
                fd.append('brightness', document.getElementById('fltBright').value);
                fd.append('saturation', document.getElementById('fltSat').value);
                fd.append('flipH', document.getElementById('fltFlipH').checked ? '1' : '0');
                fd.append('flipV', document.getElementById('fltFlipV').checked ? '1' : '0');
                fd.append('grayscale', document.getElementById('fltGray').checked ? '1' : '0');
                fd.append('negate', document.getElementById('fltNeg').checked ? '1' : '0');
                fd.append('sharpen', document.getElementById('fltSharp').checked ? '1' : '0');
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal memproses filter.');
                }
                const dims = res.headers.get('X-Output-Dimensions') || '-';
                const url = trackUrl(await res.blob());
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">Dimensi: ${escapeHtml(dims)}</p>
                        <img src="${url}" width="460" height="320" alt="Hasil filter foto" class="result-media">
                        <a href="${url}" download="edited_${Date.now()}.png" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 17. SVG to PNG Rasterizer =====
    if (toolId === 'img_svg2png') {
        body.innerHTML = `
            ${headHtml('Konversi kode SVG atau file .svg menjadi gambar PNG resolusi tinggi hingga 3000px lewat VPS.')}
            <label for="svgCodeIn" class="v-label">Kode SVG (atau unggah file di bawah)</label>
            <textarea id="svgCodeIn" class="v-input" rows="5" placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="28" fill="#111"/><text x="100" y="116" text-anchor="middle" fill="#fff" font-size="48" font-family="sans-serif">MLM</text></svg>'></textarea>
            <label for="svgFileIn" class="v-label">Atau Pilih File .svg</label>
            <input type="file" id="svgFileIn" class="v-input" accept=".svg,image/svg+xml">
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div>
                    <label for="svgWidth" class="v-label">Lebar Output (px)</label>
                    <input type="number" id="svgWidth" class="v-input" style="margin-bottom:0;" value="1024" min="64" max="3000">
                </div>
                <div>
                    <label for="svgBg" class="v-label">Latar Belakang</label>
                    <select id="svgBg" class="v-input" style="margin-bottom:0;">
                        <option value="transparent">Transparan</option>
                        <option value="white">Putih (#FFFFFF)</option>
                        <option value="black">Hitam (#0A0A0A)</option>
                    </select>
                </div>
            </div>
            <button type="button" class="v-btn" id="svgRunBtn"><i class="fas fa-vector-square" aria-hidden="true"></i> Render ke PNG</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('svgRunBtn').onclick = async () => {
            const svg = document.getElementById('svgCodeIn').value.trim();
            const file = document.getElementById('svgFileIn').files?.[0];
            const btn = document.getElementById('svgRunBtn');
            const out = document.getElementById('toolResult');
            if (!svg && !file) return toast('Masukkan kode SVG atau pilih file .svg.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Merender SVG ke PNG...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'svg2png');
                if (svg) fd.append('svg', svg);
                if (file) fd.append('file', file);
                fd.append('width', document.getElementById('svgWidth').value);
                fd.append('background', document.getElementById('svgBg').value);
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal merender SVG.');
                }
                const dims = res.headers.get('X-Output-Dimensions') || '-';
                const url = trackUrl(await res.blob());
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">Dimensi PNG: ${escapeHtml(dims)}</p>
                        <img src="${url}" width="360" height="360" alt="Hasil rasterisasi SVG ke PNG" class="result-media">
                        <a href="${url}" download="svg_export_${Date.now()}.png" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 18. Images to Multi-Page PDF =====
    if (toolId === 'doc_img2pdf') {
        body.innerHTML = `
            ${headHtml('Gabungkan 1 sampai 10 gambar (JPG/PNG/WebP) menjadi satu file PDF A4 siap cetak di VPS.')}
            <label for="pdfImgsIn" class="v-label">Pilih Gambar (bisa pilih banyak sekaligus, maks. 10)</label>
            <input type="file" id="pdfImgsIn" class="v-input" accept="image/*" multiple>
            <button type="button" class="v-btn" id="pdfImgsBtn"><i class="fas fa-file-pdf" aria-hidden="true"></i> Buat PDF Multi-Halaman</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('pdfImgsBtn').onclick = async () => {
            const files = Array.from(document.getElementById('pdfImgsIn').files || []);
            const btn = document.getElementById('pdfImgsBtn');
            const out = document.getElementById('toolResult');
            if (files.length === 0) return toast('Pilih minimal 1 gambar.');
            if (files.length > 10) return toast('Maksimal 10 gambar per PDF.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Menyusun ${files.length} halaman PDF...</div>`;
            try {
                const fd = new FormData();
                fd.append('action', 'img2pdf');
                files.forEach((f) => fd.append('files', f));
                const res = await fetch('/api/tools/image-suite', { method: 'POST', body: fd });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal membuat PDF.');
                }
                const pages = res.headers.get('X-Page-Count') || String(files.length);
                const bytes = Number(res.headers.get('X-Output-Bytes') || 0);
                const url = trackUrl(await res.blob());
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.86rem;margin-bottom:10px;">
                            PDF siap diunduh: <strong>${escapeHtml(pages)} halaman</strong> (${(bytes / 1024).toFixed(1)} KB).
                        </p>
                        <div class="owner-action-row">
                            <a href="${url}" download="mattzlm_images_${Date.now()}.pdf" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh PDF</a>
                            <a href="${url}" target="_blank" rel="noopener noreferrer" class="v-btn v-btn-secondary"><i class="fas fa-up-right-from-square" aria-hidden="true"></i> Buka Tab Baru</a>
                        </div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 19. Invoice PDF Generator =====
    if (toolId === 'doc_invoice') {
        const today = new Date().toISOString().slice(0, 10);
        body.innerHTML = `
            ${headHtml('Buat faktur tagihan PDF profesional (monokrom, siap kirim ke klien) langsung dari VPS.')}
            <div class="vps-kv-grid" style="margin-bottom:10px;">
                <div><label for="invNo" class="v-label">Nomor Invoice</label><input id="invNo" class="v-input" style="margin-bottom:0;" value="INV-${today.replace(/-/g, '')}-01"></div>
                <div><label for="invCur" class="v-label">Mata Uang</label><select id="invCur" class="v-input" style="margin-bottom:0;"><option value="IDR">IDR (Rp)</option><option value="USD">USD ($)</option><option value="SGD">SGD (S$)</option><option value="EUR">EUR</option></select></div>
                <div><label for="invDate" class="v-label">Tanggal Terbit</label><input id="invDate" type="date" class="v-input" style="margin-bottom:0;" value="${today}"></div>
                <div><label for="invDue" class="v-label">Jatuh Tempo</label><input id="invDue" type="date" class="v-input" style="margin-bottom:0;" value="${today}"></div>
                <div><label for="invSender" class="v-label">Nama Pengirim / Bisnis</label><input id="invSender" class="v-input" style="margin-bottom:0;" value="MattzLM Studio"></div>
                <div><label for="invClient" class="v-label">Nama Klien</label><input id="invClient" class="v-input" style="margin-bottom:0;" placeholder="PT Contoh Nusantara"></div>
            </div>
            <label for="invSenderInfo" class="v-label">Info Pengirim (Alamat / Email / WA)</label>
            <input id="invSenderInfo" class="v-input" placeholder="Jakarta, Indonesia | studio@domain.com">
            <label for="invClientInfo" class="v-label">Info Klien</label>
            <input id="invClientInfo" class="v-input" placeholder="Bandung, Indonesia | klien@domain.com">
            <label for="invItems" class="v-label">Daftar Item (1 baris per item: Nama | Qty | Harga Satuan)</label>
            <textarea id="invItems" class="v-input" rows="4" style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;">Pembuatan Landing Page Next.js | 1 | 2500000
Setup Server VPS & SSL | 1 | 500000</textarea>
            <div class="vps-kv-grid" style="margin-bottom:10px;">
                <div><label for="invDisc" class="v-label">Diskon Nominal</label><input id="invDisc" type="number" class="v-input" style="margin-bottom:0;" value="0" min="0"></div>
                <div><label for="invTax" class="v-label">Pajak (%)</label><input id="invTax" type="number" class="v-input" style="margin-bottom:0;" value="11" min="0" max="100"></div>
            </div>
            <label for="invNotes" class="v-label">Catatan / Nomor Rekening Pembayaran</label>
            <input id="invNotes" class="v-input" placeholder="Transfer ke BCA 1234567890 a.n. Nama Anda">
            <button type="button" class="v-btn" id="invGenBtn"><i class="fas fa-file-invoice-dollar" aria-hidden="true"></i> Generate Invoice PDF</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('invGenBtn').onclick = async () => {
            const btn = document.getElementById('invGenBtn');
            const out = document.getElementById('toolResult');
            const rawLines = document.getElementById('invItems').value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            const items = rawLines.map((line) => {
                const [itemName, qtyStr, priceStr] = line.split('|').map((s) => (s || '').trim());
                return { name: itemName, qty: Number(qtyStr || 1), price: Number(priceStr || 0) };
            }).filter((i) => i.name);
            if (items.length === 0) return toast('Masukkan minimal 1 item invoice.');
            btn.disabled = true;
            out.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Menyusun Invoice PDF...</div>`;
            try {
                const res = await fetch('/api/tools/text-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'invoice_pdf',
                        invoiceNo: document.getElementById('invNo').value.trim(),
                        currency: document.getElementById('invCur').value,
                        issueDate: document.getElementById('invDate').value,
                        dueDate: document.getElementById('invDue').value,
                        senderName: document.getElementById('invSender').value.trim(),
                        senderInfo: document.getElementById('invSenderInfo').value.trim(),
                        clientName: document.getElementById('invClient').value.trim() || 'Klien',
                        clientInfo: document.getElementById('invClientInfo').value.trim(),
                        discount: Number(document.getElementById('invDisc').value || 0),
                        taxPercent: Number(document.getElementById('invTax').value || 0),
                        notes: document.getElementById('invNotes').value.trim(),
                        items
                    })
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal membuat PDF.');
                }
                const bytes = Number(res.headers.get('X-Output-Bytes') || 0);
                const url = trackUrl(await res.blob());
                const fname = (document.getElementById('invNo').value.trim() || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.86rem;margin-bottom:10px;">Invoice PDF selesai dibuat (${(bytes / 1024).toFixed(1)} KB).</p>
                        <div class="owner-action-row">
                            <a href="${url}" download="${escapeHtml(fname)}.pdf" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh PDF</a>
                            <a href="${url}" target="_blank" rel="noopener noreferrer" class="v-btn v-btn-secondary"><i class="fas fa-up-right-from-square" aria-hidden="true"></i> Pratinjau PDF</a>
                        </div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 20. JWT Decoder, Verifier & Signer =====
    if (toolId === 'dev_jwt') {
        body.innerHTML = `
            ${headHtml('Decode JWT, cek masa berlaku exp/iat, verifikasi signature HMAC, atau buat token JWT HS256/384/512.')}
            <label for="jwtMode" class="v-label">Mode</label>
            <select id="jwtMode" class="v-input">
                <option value="decode">Decode &amp; Verifikasi Token JWT</option>
                <option value="sign">Buat &amp; Sign Token JWT Baru</option>
            </select>
            <label for="jwtInput" class="v-label" id="jwtInputLabel">Token JWT (atau Payload JSON untuk mode Sign)</label>
            <textarea id="jwtInput" class="v-input" rows="4" style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea>
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div><label for="jwtSecret" class="v-label">Secret Key (Opsional untuk decode)</label><input id="jwtSecret" class="v-input" style="margin-bottom:0;" placeholder="kunci-rahasia"></div>
                <div><label for="jwtAlg" class="v-label">Algoritma (Mode Sign)</label><select id="jwtAlg" class="v-input" style="margin-bottom:0;"><option value="HS256">HS256</option><option value="HS384">HS384</option><option value="HS512">HS512</option></select></div>
            </div>
            <button type="button" class="v-btn" id="jwtRunBtn"><i class="fas fa-key" aria-hidden="true"></i> Proses JWT</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('jwtMode').onchange = (e) => {
            const sign = e.target.value === 'sign';
            document.getElementById('jwtInputLabel').textContent = sign ? 'Payload JSON' : 'Token JWT';
            if (sign && !document.getElementById('jwtInput').value.trim()) {
                document.getElementById('jwtInput').value = JSON.stringify({ sub: 'user_01', role: 'xvip', iat: Math.floor(Date.now() / 1000) }, null, 2);
            }
        };
        document.getElementById('jwtRunBtn').onclick = async () => {
            const mode = document.getElementById('jwtMode').value;
            const raw = document.getElementById('jwtInput').value.trim();
            const secret = document.getElementById('jwtSecret').value;
            const alg = document.getElementById('jwtAlg').value;
            const out = document.getElementById('toolResult');
            if (!raw) return toast('Masukkan token atau payload JSON.');
            try {
                const payload = mode === 'sign'
                    ? { action: 'jwt', mode: 'sign', alg, secret, payload: raw }
                    : { action: 'jwt', mode: 'decode', token: raw, secret };
                const d = await postJson('/api/tools/crypto-util', payload);
                if (mode === 'sign') {
                    out.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <label class="v-label">JWT Signed Token (${escapeHtml(alg)})</label>
                            <textarea class="v-input" rows="4" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.78rem;">${escapeHtml(d.token)}</textarea>
                            <button type="button" class="v-btn" id="jwtCopyTok"><i class="fas fa-copy" aria-hidden="true"></i> Salin Token</button>
                        </div>
                    `;
                    document.getElementById('jwtCopyTok').onclick = () => {
                        navigator.clipboard.writeText(d.token);
                        toast('Token JWT disalin.');
                    };
                } else {
                    const sigLabel = d.signatureValid === true ? 'VALID' : d.signatureValid === false ? 'TIDAK VALID' : 'Belum diverifikasi (isi secret)';
                    const expLabel = d.timing?.expired === true ? 'KADALUWARSA' : d.timing?.expired === false ? `Aktif (${d.timing.secondsRemaining} dtk)` : 'Tanpa exp';
                    out.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <div class="vps-kv-grid" style="margin-bottom:10px;">
                                <div class="vps-kv-item"><span>Signature HMAC</span><strong>${escapeHtml(sigLabel)}</strong></div>
                                <div class="vps-kv-item"><span>Masa Berlaku</span><strong>${escapeHtml(expLabel)}</strong></div>
                            </div>
                            <label class="v-label">Header</label>
                            <pre class="vps-code-out">${escapeHtml(JSON.stringify(d.header, null, 2))}</pre>
                            <label class="v-label" style="margin-top:8px;">Payload</label>
                            <pre class="vps-code-out">${escapeHtml(JSON.stringify(d.payload, null, 2))}</pre>
                        </div>
                    `;
                }
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 21. Multi-Hash & File Checksum =====
    if (toolId === 'dev_hash') {
        body.innerHTML = `
            ${headHtml('Hitung hash MD5, SHA-1, SHA-256, SHA-512, SHA3-256, BLAKE2b512, dan HMAC untuk teks atau file.')}
            <label for="hashText" class="v-label">Teks Input (kosongkan jika unggah file)</label>
            <textarea id="hashText" class="v-input" rows="3" placeholder="Ketik teks yang ingin di-hash..."></textarea>
            <label for="hashFile" class="v-label">Atau Pilih File (maks. 12MB)</label>
            <input type="file" id="hashFile" class="v-input">
            <label for="hashSecret" class="v-label">Kunci HMAC (Opsional)</label>
            <input type="text" id="hashSecret" class="v-input" placeholder="Isi jika butuh HMAC-SHA256">
            <button type="button" class="v-btn" id="hashRunBtn"><i class="fas fa-shield" aria-hidden="true"></i> Hitung Semua Hash</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('hashRunBtn').onclick = async () => {
            const text = document.getElementById('hashText').value;
            const file = document.getElementById('hashFile').files?.[0];
            const secret = document.getElementById('hashSecret').value;
            const btn = document.getElementById('hashRunBtn');
            const out = document.getElementById('toolResult');
            if (!text && !file) return toast('Masukkan teks atau pilih file.');
            btn.disabled = true;
            try {
                let d;
                if (file) {
                    const fd = new FormData();
                    fd.append('action', 'hash_file');
                    fd.append('file', file);
                    if (secret) fd.append('secret', secret);
                    const res = await fetch('/api/tools/crypto-util', { method: 'POST', body: fd });
                    d = await res.json();
                    if (!res.ok || !d.ok) throw new Error(d.error || 'Gagal menghitung hash file.');
                } else {
                    d = await postJson('/api/tools/crypto-util', { action: 'hash', text, secret });
                }
                const entries = Object.entries(d.hashes || {}).filter(([, v]) => v);
                const rows = entries
                    .map(([k, v]) => `
                        <div class="vps-kv-item">
                            <span>${escapeHtml(k.toUpperCase())}</span>
                            <strong style="font-family:'IBM Plex Mono',monospace;font-size:0.75rem;">${escapeHtml(v)}</strong>
                        </div>
                    `)
                    .join('');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">
                            ${d.fileName ? `File: ${escapeHtml(d.fileName)} | ` : ''}${d.bytes} bytes
                        </p>
                        <div style="display:flex;flex-direction:column;gap:8px;">${rows}</div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
        return true;
    }

    // ===== 22. AES-256-GCM Encryptor / Decryptor =====
    if (toolId === 'dev_encrypt') {
        body.innerHTML = `
            ${headHtml('Enkripsi terautentikasi AES-256-GCM + PBKDF2-SHA256 (100.000 iterasi) untuk melindungi teks rahasia.')}
            <label for="aesMode" class="v-label">Mode</label>
            <select id="aesMode" class="v-input">
                <option value="encrypt">Enkripsi Teks ke Ciphertext Base64</option>
                <option value="decrypt">Dekripsi Ciphertext Base64 ke Teks Asli</option>
            </select>
            <label for="aesText" class="v-label">Teks / Ciphertext</label>
            <textarea id="aesText" class="v-input" rows="4" placeholder="Tulis pesan rahasia atau tempel ciphertext Base64..."></textarea>
            <label for="aesPass" class="v-label">Kunci Rahasia (Passphrase)</label>
            <input type="password" id="aesPass" class="v-input" placeholder="Minimal 6 karakter kuat">
            <button type="button" class="v-btn" id="aesRunBtn"><i class="fas fa-user-lock" aria-hidden="true"></i> Jalankan AES-256-GCM</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('aesRunBtn').onclick = async () => {
            const mode = document.getElementById('aesMode').value;
            const text = document.getElementById('aesText').value;
            const passphrase = document.getElementById('aesPass').value;
            const out = document.getElementById('toolResult');
            if (!text || !passphrase) return toast('Isi teks dan kunci rahasia.');
            try {
                const d = await postJson('/api/tools/crypto-util', { action: 'encrypt', mode, text, passphrase });
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <label class="v-label">${mode === 'encrypt' ? 'Ciphertext Base64 (AES-256-GCM)' : 'Hasil Dekripsi'}</label>
                        <textarea class="v-input" rows="4" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;">${escapeHtml(d.output)}</textarea>
                        <button type="button" class="v-btn" id="aesCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Hasil</button>
                    </div>
                `;
                document.getElementById('aesCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(d.output);
                    toast('Hasil disalin.');
                };
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 23. Bulk UUID v4 / v7 / ULID / NanoID =====
    if (toolId === 'dev_uuid') {
        body.innerHTML = `
            ${headHtml('Generate ID kriptografis modern untuk database & API: UUID v4, UUID v7 (time-sortable), ULID, dan NanoID.')}
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div>
                    <label for="uidKind" class="v-label">Format ID</label>
                    <select id="uidKind" class="v-input" style="margin-bottom:0;">
                        <option value="uuidv7">UUID v7 (Time-Sortable)</option>
                        <option value="uuidv4">UUID v4 (Random)</option>
                        <option value="ulid">ULID (26 char)</option>
                        <option value="nanoid">NanoID (URL-Safe)</option>
                    </select>
                </div>
                <div>
                    <label for="uidCount" class="v-label">Jumlah (1 - 50)</label>
                    <input type="number" id="uidCount" class="v-input" style="margin-bottom:0;" value="10" min="1" max="50">
                </div>
            </div>
            <label for="uidLen" class="v-label">Panjang NanoID (khusus NanoID, 8 - 64)</label>
            <input type="number" id="uidLen" class="v-input" value="21" min="8" max="64">
            <button type="button" class="v-btn" id="uidRunBtn"><i class="fas fa-fingerprint" aria-hidden="true"></i> Generate ID</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('uidRunBtn').onclick = async () => {
            const kind = document.getElementById('uidKind').value;
            const count = Number(document.getElementById('uidCount').value || 10);
            const length = Number(document.getElementById('uidLen').value || 21);
            const out = document.getElementById('toolResult');
            try {
                const d = await postJson('/api/tools/crypto-util', { action: 'uuid', kind, count, length });
                const text = (d.items || []).join('\n');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <textarea class="v-input" rows="7" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;">${escapeHtml(text)}</textarea>
                        <button type="button" class="v-btn" id="uidCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin ${d.count} ID</button>
                    </div>
                `;
                document.getElementById('uidCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(text);
                    toast(`${d.count} ID disalin.`);
                };
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 24. Gzip / Brotli / Deflate Compressor =====
    if (toolId === 'dev_compress') {
        body.innerHTML = `
            ${headHtml('Kompres teks/JSON ke Base64 terkompresi (Brotli, Gzip, Deflate) atau dekompresi kembali ke teks asli.')}
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div>
                    <label for="cmpMode" class="v-label">Mode</label>
                    <select id="cmpMode" class="v-input" style="margin-bottom:0;">
                        <option value="compress">Kompres (Teks ke Base64)</option>
                        <option value="decompress">Dekompresi (Base64 ke Teks)</option>
                    </select>
                </div>
                <div>
                    <label for="cmpAlg" class="v-label">Algoritma</label>
                    <select id="cmpAlg" class="v-input" style="margin-bottom:0;">
                        <option value="brotli">Brotli</option>
                        <option value="gzip">Gzip</option>
                        <option value="deflate">Deflate</option>
                    </select>
                </div>
            </div>
            <label for="cmpIn" class="v-label">Input Teks / Base64</label>
            <textarea id="cmpIn" class="v-input" rows="5" placeholder="Tempel JSON, HTML, log, atau string Base64 terkompresi..."></textarea>
            <button type="button" class="v-btn" id="cmpRunBtn"><i class="fas fa-file-zipper" aria-hidden="true"></i> Proses Kompresi</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('cmpRunBtn').onclick = async () => {
            const mode = document.getElementById('cmpMode').value;
            const algorithm = document.getElementById('cmpAlg').value;
            const text = document.getElementById('cmpIn').value;
            const out = document.getElementById('toolResult');
            if (!text.trim()) return toast('Masukkan data input.');
            try {
                const d = await postJson('/api/tools/crypto-util', { action: 'compress', mode, algorithm, text });
                const resultStr = mode === 'compress' ? d.base64 : d.output;
                const statText = mode === 'compress'
                    ? `${d.originalBytes} B -> ${d.compressedBytes} B (hemat ${d.savedPercent}%)`
                    : `${d.inputBytes} B -> ${d.outputBytes} B`;
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">${escapeHtml(algorithm.toUpperCase())}: <strong>${escapeHtml(statText)}</strong></p>
                        <textarea class="v-input" rows="5" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.78rem;">${escapeHtml(resultStr)}</textarea>
                        <button type="button" class="v-btn" id="cmpCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Output</button>
                    </div>
                `;
                document.getElementById('cmpCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(resultStr);
                    toast('Output disalin.');
                };
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 25. QR Pro (WiFi / WhatsApp / vCard / Email) =====
    if (toolId === 'qr_pro') {
        body.innerHTML = `
            ${headHtml('Buat QR Code terstruktur siap pindai untuk login WiFi otomatis, chat WhatsApp, kartu kontak vCard, dan Email.')}
            <label for="qrpKind" class="v-label">Tipe QR Code</label>
            <select id="qrpKind" class="v-input">
                <option value="wifi">WiFi Auto-Connect</option>
                <option value="whatsapp">WhatsApp Chat Link</option>
                <option value="vcard">Kartu Kontak (vCard)</option>
                <option value="email">Email (mailto)</option>
            </select>
            <div id="qrpFields"></div>
            <button type="button" class="v-btn" id="qrpRunBtn"><i class="fas fa-qrcode" aria-hidden="true"></i> Generate QR Pro</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        const renderFields = () => {
            const k = document.getElementById('qrpKind').value;
            const box = document.getElementById('qrpFields');
            if (k === 'wifi') {
                box.innerHTML = `
                    <label for="qrpSsid" class="v-label">Nama WiFi (SSID)</label>
                    <input id="qrpSsid" class="v-input" placeholder="WiFi-Kantor">
                    <label for="qrpPass" class="v-label">Password WiFi</label>
                    <input id="qrpPass" class="v-input" placeholder="rahasia123">
                    <label for="qrpEnc" class="v-label">Keamanan</label>
                    <select id="qrpEnc" class="v-input"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Tanpa Password</option></select>
                `;
            } else if (k === 'whatsapp') {
                box.innerHTML = `
                    <label for="qrpWaPhone" class="v-label">Nomor WhatsApp (dengan kode negara)</label>
                    <input id="qrpWaPhone" class="v-input" placeholder="6281234567890">
                    <label for="qrpWaMsg" class="v-label">Pesan Awal (Opsional)</label>
                    <input id="qrpWaMsg" class="v-input" placeholder="Halo, saya ingin bertanya...">
                `;
            } else if (k === 'vcard') {
                box.innerHTML = `
                    <label for="qrpVcName" class="v-label">Nama Lengkap</label>
                    <input id="qrpVcName" class="v-input" placeholder="Budi Santoso">
                    <label for="qrpVcPhone" class="v-label">Nomor HP</label>
                    <input id="qrpVcPhone" class="v-input" placeholder="+628123456789">
                    <label for="qrpVcEmail" class="v-label">Email</label>
                    <input id="qrpVcEmail" class="v-input" placeholder="budi@domain.com">
                    <label for="qrpVcOrg" class="v-label">Organisasi / Bisnis</label>
                    <input id="qrpVcOrg" class="v-input" placeholder="MattzLM Studio">
                `;
            } else {
                box.innerHTML = `
                    <label for="qrpEmTo" class="v-label">Email Tujuan</label>
                    <input id="qrpEmTo" class="v-input" placeholder="halo@domain.com">
                    <label for="qrpEmSub" class="v-label">Subjek</label>
                    <input id="qrpEmSub" class="v-input" placeholder="Pertanyaan Kerja Sama">
                    <label for="qrpEmBody" class="v-label">Isi Pesan</label>
                    <input id="qrpEmBody" class="v-input" placeholder="Halo tim...">
                `;
            }
        };
        document.getElementById('qrpKind').onchange = renderFields;
        renderFields();
        document.getElementById('qrpRunBtn').onclick = async () => {
            const kind = document.getElementById('qrpKind').value;
            const out = document.getElementById('toolResult');
            const payload = { action: 'qr_pro', kind, size: 420 };
            if (kind === 'wifi') {
                payload.ssid = document.getElementById('qrpSsid').value.trim();
                payload.password = document.getElementById('qrpPass').value;
                payload.encryption = document.getElementById('qrpEnc').value;
            } else if (kind === 'whatsapp') {
                payload.phone = document.getElementById('qrpWaPhone').value.trim();
                payload.message = document.getElementById('qrpWaMsg').value.trim();
            } else if (kind === 'vcard') {
                payload.fullName = document.getElementById('qrpVcName').value.trim();
                payload.phone = document.getElementById('qrpVcPhone').value.trim();
                payload.email = document.getElementById('qrpVcEmail').value.trim();
                payload.org = document.getElementById('qrpVcOrg').value.trim();
            } else {
                payload.to = document.getElementById('qrpEmTo').value.trim();
                payload.subject = document.getElementById('qrpEmSub').value.trim();
                payload.text = document.getElementById('qrpEmBody').value.trim();
            }
            try {
                const d = await postJson('/api/tools/crypto-util', payload);
                const svgUrl = trackUrl(new Blob([d.svg], { type: 'image/svg+xml' }));
                out.innerHTML = `
                    <div class="result-box">
                        <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:8px;">${escapeHtml(d.summary)}</p>
                        <img src="${d.pngDataUrl}" width="260" height="260" alt="QR Pro ${escapeHtml(d.summary)}" class="result-media" style="max-width:260px;background:#FFFFFF;padding:8px;">
                        <div class="owner-action-row">
                            <a href="${d.pngDataUrl}" download="qr_${escapeHtml(kind)}_${Date.now()}.png" class="v-btn"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>
                            <a href="${svgUrl}" download="qr_${escapeHtml(kind)}_${Date.now()}.svg" class="v-btn v-btn-secondary"><i class="fas fa-download" aria-hidden="true"></i> Unduh SVG</a>
                        </div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 26. CSV / JSON / Markdown Table Converter =====
    if (toolId === 'dev_csvjson') {
        body.innerHTML = `
            ${headHtml('Konversi cepat antara CSV, JSON Array, dan Tabel Markdown GitHub di VPS.')}
            <div class="vps-kv-grid" style="margin-bottom:12px;">
                <div>
                    <label for="cjMode" class="v-label">Konversi</label>
                    <select id="cjMode" class="v-input" style="margin-bottom:0;">
                        <option value="csv2json">CSV ke JSON</option>
                        <option value="csv2md">CSV ke Tabel Markdown</option>
                        <option value="json2csv">JSON ke CSV</option>
                        <option value="json2md">JSON ke Tabel Markdown</option>
                    </select>
                </div>
                <div>
                    <label for="cjDelim" class="v-label">Pemisah CSV</label>
                    <select id="cjDelim" class="v-input" style="margin-bottom:0;">
                        <option value=",">Koma (,)</option>
                        <option value=";">Titik Koma (;)</option>
                    </select>
                </div>
            </div>
            <label for="cjIn" class="v-label">Data Sumber</label>
            <textarea id="cjIn" class="v-input" rows="5" style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;" placeholder="nama,role,kota&#10;Matt,owner,Jakarta&#10;Raka,xvip,Bandung"></textarea>
            <button type="button" class="v-btn" id="cjRunBtn"><i class="fas fa-table" aria-hidden="true"></i> Konversi Data</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('cjRunBtn').onclick = async () => {
            const mode = document.getElementById('cjMode').value;
            const delimiter = document.getElementById('cjDelim').value;
            const input = document.getElementById('cjIn').value;
            const out = document.getElementById('toolResult');
            if (!input.trim()) return toast('Masukkan data CSV atau JSON.');
            try {
                const d = await postJson('/api/tools/text-pdf', { action: 'csv_json', mode, delimiter, input });
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">${d.rowCount} baris berhasil dikonversi.</p>
                        <textarea class="v-input" rows="7" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.78rem;">${escapeHtml(d.output)}</textarea>
                        <button type="button" class="v-btn" id="cjCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Hasil</button>
                    </div>
                `;
                document.getElementById('cjCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(d.output);
                    toast('Hasil konversi disalin.');
                };
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 27. Text & Code Diff Checker =====
    if (toolId === 'dev_diff') {
        body.innerHTML = `
            ${headHtml('Bandingkan dua versi teks, konfigurasi, atau kode sumber baris demi baris menggunakan algoritma LCS.')}
            <label for="diffLeft" class="v-label">Teks Asli (Kiri)</label>
            <textarea id="diffLeft" class="v-input" rows="4" style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;" placeholder="Baris lama..."></textarea>
            <label for="diffRight" class="v-label">Teks Baru (Kanan)</label>
            <textarea id="diffRight" class="v-input" rows="4" style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;" placeholder="Baris baru..."></textarea>
            <button type="button" class="v-btn" id="diffRunBtn"><i class="fas fa-code-compare" aria-hidden="true"></i> Bandingkan Diff</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('diffRunBtn').onclick = async () => {
            const left = document.getElementById('diffLeft').value;
            const right = document.getElementById('diffRight').value;
            const out = document.getElementById('toolResult');
            try {
                const d = await postJson('/api/tools/text-pdf', { action: 'diff', left, right });
                const rows = (d.lines || [])
                    .map((ln) => {
                        const cls = ln.type === 'add' ? 'diff-add' : ln.type === 'del' ? 'diff-del' : 'diff-same';
                        const sym = ln.type === 'add' ? '+' : ln.type === 'del' ? '-' : ' ';
                        const num = `${ln.leftNo ?? ''} | ${ln.rightNo ?? ''}`;
                        return `<div class="diff-line ${cls}"><span class="diff-num">${escapeHtml(num)}</span><span class="diff-sym">${sym}</span><span>${escapeHtml(ln.text)}</span></div>`;
                    })
                    .join('');
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">
                            +${d.added} ditambah | -${d.removed} dihapus | ${d.unchanged} sama
                        </p>
                        <div class="diff-viewer">${rows}</div>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 28. Regex Tester & Replacer =====
    if (toolId === 'dev_regex') {
        body.innerHTML = `
            ${headHtml('Uji ekspresi reguler (RegExp), lihat indeks & capture groups, dan uji penggantian teks (replace).')}
            <div class="vps-kv-grid" style="margin-bottom:10px;">
                <div><label for="rxPat" class="v-label">Pola Regex</label><input id="rxPat" class="v-input" style="margin-bottom:0;font-family:'IBM Plex Mono',monospace;" placeholder="([a-z0-9._-]+)@([a-z0-9.-]+)"></div>
                <div><label for="rxFlags" class="v-label">Flags (g, i, m, s, u)</label><input id="rxFlags" class="v-input" style="margin-bottom:0;font-family:'IBM Plex Mono',monospace;" value="gi"></div>
            </div>
            <label for="rxText" class="v-label">Teks Uji</label>
            <textarea id="rxText" class="v-input" rows="4" placeholder="Kontak: admin@mattzlm.dev dan support@example.com"></textarea>
            <label for="rxRep" class="v-label">Pola Replace (Opsional, mis. $1[at]$2)</label>
            <input id="rxRep" class="v-input" placeholder="Kosongkan jika hanya cek match">
            <button type="button" class="v-btn" id="rxRunBtn"><i class="fas fa-terminal" aria-hidden="true"></i> Uji Regex</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('rxRunBtn').onclick = async () => {
            const pattern = document.getElementById('rxPat').value;
            const flags = document.getElementById('rxFlags').value;
            const text = document.getElementById('rxText').value;
            const repVal = document.getElementById('rxRep').value;
            const out = document.getElementById('toolResult');
            if (!pattern) return toast('Masukkan pola regex.');
            try {
                const payload = { action: 'regex', pattern, flags, text };
                if (repVal !== '') payload.replacement = repVal;
                const d = await postJson('/api/tools/text-pdf', payload);
                const matchesTxt = (d.matches || [])
                    .map((m, idx) => `#${idx + 1} [idx ${m.index}] "${m.value}"${m.groups.length ? ' -> groups: ' + JSON.stringify(m.groups) : ''}`)
                    .join('\n') || 'Tidak ada kecocokan.';
                const repHtml = d.replaced !== null
                    ? `<label class="v-label" style="margin-top:8px;">Hasil Replace</label><pre class="vps-code-out">${escapeHtml(d.replaced)}</pre>`
                    : '';
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.84rem;margin-bottom:8px;">Ditemukan <strong>${d.matchCount} kecocokan</strong> untuk /${escapeHtml(d.pattern)}/${escapeHtml(d.flags)}</p>
                        <pre class="vps-code-out">${escapeHtml(matchesTxt)}</pre>
                        ${repHtml}
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 29. Cron Schedule Simulator =====
    if (toolId === 'dev_cron') {
        body.innerHTML = `
            ${headHtml('Pahami ekspresi cron 5-kolom dan lihat 10 waktu eksekusi berikutnya dalam zona WIB/WITA/WIT/UTC.')}
            <label for="cronExpr" class="v-label">Ekspresi Cron (menit jam tanggal bulan hari)</label>
            <input id="cronExpr" class="v-input" style="font-family:'IBM Plex Mono',monospace;" value="0 9 * * 1-5" placeholder="*/15 * * * *">
            <label for="cronTz" class="v-label">Zona Waktu</label>
            <select id="cronTz" class="v-input">
                <option value="7" selected>WIB (UTC+7)</option>
                <option value="8">WITA (UTC+8)</option>
                <option value="9">WIT (UTC+9)</option>
                <option value="0">UTC (UTC+0)</option>
            </select>
            <button type="button" class="v-btn" id="cronRunBtn"><i class="fas fa-clock" aria-hidden="true"></i> Simulasikan Jadwal</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('cronRunBtn').onclick = async () => {
            const expression = document.getElementById('cronExpr').value.trim();
            const tzOffset = Number(document.getElementById('cronTz').value || 7);
            const out = document.getElementById('toolResult');
            if (!expression) return toast('Masukkan ekspresi cron.');
            try {
                const d = await postJson('/api/tools/text-pdf', { action: 'cron', expression, tzOffset });
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <p style="font-size:0.86rem;margin-bottom:8px;"><strong>Arti:</strong> ${escapeHtml(d.description)}</p>
                        <label class="v-label">10 Jadwal Eksekusi Berikutnya</label>
                        <pre class="vps-code-out">${escapeHtml((d.nextRuns || []).map((r, i) => `${String(i + 1).padStart(2, '0')}. ${r}`).join('\n'))}</pre>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    // ===== 30. IPv4 CIDR Subnet Calculator =====
    if (toolId === 'net_subnet') {
        body.innerHTML = `
            ${headHtml('Hitung alamat network, broadcast, subnet mask, wildcard, rentang host aktif, dan biner IPv4 CIDR.')}
            <label for="subCidr" class="v-label">IPv4 / Prefix CIDR</label>
            <input id="subCidr" class="v-input" style="font-family:'IBM Plex Mono',monospace;" value="192.168.10.25/24" placeholder="10.0.0.0/16">
            <button type="button" class="v-btn" id="subRunBtn"><i class="fas fa-diagram-project" aria-hidden="true"></i> Hitung Subnet</button>
            <div id="toolResult" aria-live="polite"></div>
        `;
        document.getElementById('subRunBtn').onclick = async () => {
            const cidr = document.getElementById('subCidr').value.trim();
            const out = document.getElementById('toolResult');
            if (!cidr) return toast('Masukkan IP/CIDR.');
            try {
                const d = await postJson('/api/tools/text-pdf', { action: 'subnet', cidr });
                out.innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <div class="vps-kv-grid">
                            <div class="vps-kv-item"><span>CIDR Network</span><strong>${escapeHtml(d.cidr)}</strong></div>
                            <div class="vps-kv-item"><span>Kelas / Cakupan</span><strong>${escapeHtml(d.ipClass)} (${escapeHtml(d.scope)})</strong></div>
                            <div class="vps-kv-item"><span>Network Address</span><strong>${escapeHtml(d.networkAddress)}</strong></div>
                            <div class="vps-kv-item"><span>Broadcast Address</span><strong>${escapeHtml(d.broadcastAddress)}</strong></div>
                            <div class="vps-kv-item"><span>Subnet Mask</span><strong>${escapeHtml(d.subnetMask)}</strong></div>
                            <div class="vps-kv-item"><span>Wildcard Mask</span><strong>${escapeHtml(d.wildcardMask)}</strong></div>
                            <div class="vps-kv-item"><span>Host Pertama - Terakhir</span><strong>${escapeHtml(d.firstHost)} s.d. ${escapeHtml(d.lastHost)}</strong></div>
                            <div class="vps-kv-item"><span>Total IP / Usable</span><strong>${Number(d.totalIps).toLocaleString('id-ID')} / ${Number(d.usableHosts).toLocaleString('id-ID')}</strong></div>
                        </div>
                        <label class="v-label" style="margin-top:8px;">Representasi Biner</label>
                        <pre class="vps-code-out">IP  : ${escapeHtml(d.ipBinary)}\nMASK: ${escapeHtml(d.maskBinary)}</pre>
                    </div>
                `;
            } catch (e) {
                out.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
            }
        };
        return true;
    }

    return false;
}
