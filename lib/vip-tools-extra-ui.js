// 30 Modul Fitur Jaman Sekarang (Medsos, Stiker & Mockup Viral, Suara TTS, QRIS, Game, Anime, Info Indonesia Live)

export const EXTRA_30_TOOLS = [
    // === DOWNLOADER & MEDIA SOSMED (+4) ===
    { id: 'dl_music_dl', icon: 'fa-solid fa-headphones', name: 'Music Downloader', desc: 'Cari lagu realtime akurat, putar full audio & unduh M4A/MP3', badge: 'Audio', category: 'downloader' },
    { id: 'dl_sosmed', icon: 'fa-solid fa-cloud-arrow-down', name: 'X, Pinterest & FB DL', desc: 'Unduh video/foto HD dari X, Pinterest, FB & Threads', badge: 'DL', category: 'downloader' },
    { id: 'dl_ytthumb', icon: 'fa-brands fa-youtube', name: 'YouTube Thumbnail HD', desc: 'Ambil gambar cover 1280x720, SD & HQ video YouTube', badge: 'HD', category: 'downloader' },
    { id: 'dl_music', icon: 'fa-solid fa-music', name: 'Cari Lagu & Lirik', desc: 'Putar preview lagu 30 detik + lirik lagu lengkap', badge: 'Audio', category: 'downloader' },

    // === MAKER VIRAL & STIKER (+10) ===
    { id: 'mk_wasticker', icon: 'fa-brands fa-whatsapp', name: 'Stiker WA Maker', desc: 'Ubah foto jadi stiker WhatsApp 512px WebP + teks', badge: 'WebP', category: 'maker' },
    { id: 'mk_fakewa', icon: 'fa-solid fa-comments', name: 'Fake Chat WhatsApp', desc: 'Buat screenshot chat WA gelap/terang siap unduh', badge: 'Viral', category: 'maker' },
    { id: 'mk_faketweet', icon: 'fa-brands fa-x-twitter', name: 'Fake Tweet X', desc: 'Buat postingan X / Twitter centang biru custom', badge: 'Viral', category: 'maker' },
    { id: 'mk_fakespotify', icon: 'fa-brands fa-spotify', name: 'Spotify Now Playing', desc: 'Kartu lagu sedang diputar + lirik buat IG Story', badge: 'Story', category: 'maker' },
    { id: 'mk_fakenotif', icon: 'fa-solid fa-bell', name: 'Fake Notif iPhone', desc: 'Mockup notifikasi lockscreen WA, IG, DANA & BCA', badge: 'Viral', category: 'maker' },
    { id: 'mk_fakestruk', icon: 'fa-solid fa-receipt', name: 'Mockup Struk Transfer', desc: 'Simulasi bukti transfer & e-wallet untuk hiburan', badge: 'Card', category: 'maker' },
    { id: 'mk_iggrid', icon: 'fa-solid fa-table-cells', name: 'IG Feed 3x3 Splitter', desc: 'Potong 1 foto jadi 3, 6, atau 9 kotak feed IG rapi', badge: 'Feed', category: 'maker' },
    { id: 'mk_twibbon', icon: 'fa-solid fa-crop-simple', name: 'Twibbon & Frame Foto', desc: 'Pasang bingkai event, kampus, atau frame PNG custom', badge: 'Frame', category: 'maker' },
    { id: 'mk_meme', icon: 'fa-solid fa-face-laugh-squint', name: 'Meme Generator', desc: 'Tambah teks meme tebal atas & bawah resolusi HD', badge: 'Meme', category: 'maker' },
    { id: 'mk_polaroid', icon: 'fa-solid fa-camera-retro', name: 'Polaroid Quote Card', desc: 'Bingkai polaroid estetik + kutipan siap upload Story', badge: 'Story', category: 'maker' },

    // === KREATOR, SUARA & UTILITAS KEKINIAN (+9) ===
    { id: 'gen_tts', icon: 'fa-solid fa-volume-high', name: 'Suara Narator (TTS)', desc: 'Ubah teks jadi audio MP3 Indonesia, Inggris, Jepang, Korea', badge: 'MP3', category: 'tools' },
    { id: 'gen_translate', icon: 'fa-solid fa-language', name: 'Translator Cepat', desc: 'Terjemahkan teks ke banyak bahasa deteksi otomatis', badge: 'Lang', category: 'tools' },
    { id: 'gen_walink', icon: 'fa-brands fa-whatsapp', name: 'WA Link & QR Chat', desc: 'Buat tautan wa.me pesan otomatis + QR siap scan', badge: 'WA', category: 'tools' },
    { id: 'gen_qris', icon: 'fa-solid fa-qrcode', name: 'QRIS Nominal Dinamis', desc: 'Ubah QRIS statis jadi QRIS dengan nominal otomatis', badge: 'QRIS', category: 'tools' },
    { id: 'gen_fancyfont', icon: 'fa-solid fa-font', name: 'Font Bio Aesthetic', desc: '15 gaya tulisan unik untuk bio IG, TikTok & WA', badge: 'Font', category: 'tools' },
    { id: 'gen_nickgame', icon: 'fa-solid fa-gamepad', name: 'Nickname Game Pro', desc: '20 variasi nickname keren FF, MLBB, Valorant & PUBG', badge: 'Game', category: 'tools' },
    { id: 'gen_tiktokcalc', icon: 'fa-solid fa-chart-line', name: 'Cek Rate Card & ER', desc: 'Hitung Engagement Rate & estimasi tarif endorse', badge: 'FYP', category: 'tools' },
    { id: 'gen_caption', icon: 'fa-solid fa-hashtag', name: 'Caption & Hashtag FYP', desc: 'Ide caption menarik + kumpulan hashtag siap salin', badge: 'FYP', category: 'tools' },
    { id: 'gen_mlwr', icon: 'fa-solid fa-trophy', name: 'Kalkulator Winrate ML', desc: 'Hitung berapa kali win streak biar tembus target WR', badge: 'MLBB', category: 'tools' },

    // === HIBURAN VIRAL, ANIME & INFO INDONESIA LIVE (+8) ===
    { id: 'live_khodam', icon: 'fa-solid fa-ghost', name: 'Cek Khodam Viral', desc: 'Cek khodam berdasarkan nama + unduh kartu PNG Story', badge: 'Fun', category: 'extra' },
    { id: 'live_jodoh', icon: 'fa-solid fa-heart', name: 'Cek Jodoh & Weton', desc: 'Cek kecocokan nama, zodiak & hitungan Weton Jawa', badge: 'Weton', category: 'extra' },
    { id: 'live_anime', icon: 'fa-solid fa-film', name: 'Cari Info Anime', desc: 'Cari rating, jumlah episode & sinopsis via AniList', badge: 'Anime', category: 'extra' },
    { id: 'live_animeart', icon: 'fa-solid fa-palette', name: 'Random Anime Art', desc: 'Ambil artwork anime SFW resolusi HD siap unduh', badge: 'Art', category: 'extra' },
    { id: 'live_bmkg', icon: 'fa-solid fa-house-crack', name: 'Info Gempa BMKG', desc: 'Pantau gempa terbaru Indonesia + peta guncangan live', badge: 'Live', category: 'extra' },
    { id: 'live_weather', icon: 'fa-solid fa-cloud-sun', name: 'Prakiraan Cuaca', desc: 'Cek suhu, kelembaban & prakiraan 4 hari kota RI', badge: 'Info', category: 'extra' },
    { id: 'live_islami', icon: 'fa-solid fa-mosque', name: 'Sholat & Al-Quran', desc: 'Jadwal sholat Kemenag RI + baca & audio Al-Quran', badge: 'Quran', category: 'extra' },
    { id: 'live_crypto', icon: 'fa-solid fa-coins', name: 'Harga Kripto & Kurs', desc: 'Pantau harga BTC, ETH, SOL, TON & konverter kurs IDR', badge: 'Kurs', category: 'extra' },
];

export function renderExtraTool(toolId, body, meta, helpers) {
    const { escapeHtml, toast, registerCleanup } = helpers;
    const name = meta?.name || toolId;
    const icon = meta?.icon || 'fa-solid fa-wrench';
    const header = `<h2 id="toolViewerTitle"><i class="${escapeHtml(icon)}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>`;

    const urlsToRevoke = [];
    const trackUrl = (blob) => {
        const u = URL.createObjectURL(blob);
        urlsToRevoke.push(u);
        return u;
    };
    const bindCleanup = () => {
        if (typeof registerCleanup === 'function') {
            registerCleanup(() => {
                while (urlsToRevoke.length > 0) {
                    try {
                        URL.revokeObjectURL(urlsToRevoke.pop());
                    } catch {
                        // ignore
                    }
                }
            });
        }
    };

    const copyText = (txt, msg = 'Disalin!') => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(txt).then(() => toast(msg)).catch(() => toast('Gagal menyalin'));
        } else {
            toast(msg);
        }
    };

    const postJson = async (endpoint, payload) => {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    };

    const postBlob = async (endpoint, payload, isForm = false) => {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: isForm ? undefined : { 'Content-Type': 'application/json' },
            body: isForm ? payload : JSON.stringify(payload),
        });
        if (!res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const j = await res.json();
                throw new Error(j.error || `HTTP ${res.status}`);
            }
            throw new Error(`HTTP ${res.status}`);
        }
        return { blob: await res.blob(), res };
    };

    const fmtRp = (num) => 'Rp ' + Math.round(Number(num || 0)).toLocaleString('id-ID');

    const bindCopyButtons = (container) => {
        container.querySelectorAll('[data-copy-val]').forEach((btn) => {
            btn.onclick = () => copyText(btn.getAttribute('data-copy-val') || '');
        });
    };

    switch (toolId) {
        // ============================================================
        // 1. X, PINTEREST & FB DOWNLOADER
        // ============================================================
        case 'dl_sosmed':
            body.innerHTML = `${header}
                <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">Tempel tautan publik X (Twitter), Pinterest, Facebook, atau Threads untuk mengunduh video/foto HD.</p>
                <div class="input-group">
                    <select id="dlsPlatform" class="v-select">
                        <option value="x">X / Twitter</option>
                        <option value="pinterest">Pinterest</option>
                        <option value="facebook">Facebook / Reels</option>
                        <option value="threads">Threads</option>
                    </select>
                </div>
                <div class="input-group"><input id="dlsUrl" class="v-input" placeholder="https://x.com/user/status/... atau https://pin.it/..."></div>
                <button type="button" class="v-btn" id="dlsBtn"><i class="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i> Ambil Media</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Tempel link postingan publik lalu klik Ambil Media.</div>`;
            document.getElementById('dlsBtn').onclick = async () => {
                const url = document.getElementById('dlsUrl').value.trim();
                const platform = document.getElementById('dlsPlatform').value;
                const resBox = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL terlebih dahulu');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengekstrak media...';
                try {
                    const data = await postJson('/api/tools/download', { platform, url });
                    const btns = (data.formats || [])
                        .map(
                            (f) =>
                                `<a href="${escapeHtml(f.proxyUrl)}" download class="v-btn" style="margin-bottom:6px;text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> ${escapeHtml(f.label)}</a>`
                        )
                        .join('');
                    const thumb = data.thumbnail
                        ? `<img src="${escapeHtml(data.thumbnail)}" alt="Preview" width="480" height="270" class="media-result-img">`
                        : '';
                    resBox.innerHTML = `${thumb}
                        <div style="font-weight:700;margin-bottom:4px;">${escapeHtml(data.title)}</div>
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">Uploader: ${escapeHtml(data.uploader || '-')} | Platform: ${escapeHtml((data.platform || 'media').toUpperCase())}</div>
                        ${btns}`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 2. YOUTUBE THUMBNAIL HD
        // ============================================================
        case 'dl_ytthumb':
            body.innerHTML = `${header}
                <div class="input-group"><input id="yttUrl" class="v-input" placeholder="Link YouTube atau Shorts (contoh: https://youtu.be/jNQXAC9IVRw)"></div>
                <button type="button" class="v-btn" id="yttBtn"><i class="fa-brands fa-youtube" aria-hidden="true"></i> Ambil Thumbnail HD</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Ambil gambar cover video YouTube kualitas maksimal.</div>`;
            document.getElementById('yttBtn').onclick = async () => {
                const url = document.getElementById('yttUrl').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!url) return toast('Masukkan link YouTube');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Memeriksa resolusi thumbnail...';
                try {
                    const data = await postJson('/api/tools/creator-kit', { action: 'yt_thumb', url });
                    const cards = data.thumbnails
                        .filter((t) => t.available)
                        .map(
                            (t) => `<div style="margin-bottom:12px;">
                                <div style="font-size:0.8rem;font-weight:700;margin-bottom:6px;">${escapeHtml(t.label)}</div>
                                <img src="${escapeHtml(t.previewUrl)}" alt="${escapeHtml(t.label)}" width="${t.width}" height="${t.height}" class="media-result-img">
                                <a href="${escapeHtml(t.proxyUrl)}" download class="v-btn v-btn-secondary" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh ${escapeHtml(t.label)}</a>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div style="font-weight:700;margin-bottom:4px;">${escapeHtml(data.title)}</div>
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">Channel: ${escapeHtml(data.author)}</div>
                        ${cards}`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 0. MUSIC DOWNLOADER REALTIME (ANTI-MISMATCH FULL AUDIO)
        // ============================================================
        case 'dl_music_dl': {
            body.innerHTML = `${header}
                <div class="input-group">
                    <input id="mdlQuery" class="v-input" placeholder="Ketik judul + penyanyi (mis: Komang Raim Laode) atau tempel link SoundCloud / Spotify / YouTube" autocomplete="off">
                </div>
                <div class="mdl-toolbar">
                    <button type="button" class="v-btn mdl-search-btn" id="mdlSearchBtn">
                        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Cari Musik Realtime
                    </button>
                    <label class="mdl-filter-toggle" for="mdlOrigOnly">
                        <input type="checkbox" id="mdlOrigOnly" checked>
                        <span>Hanya Versi Original</span>
                    </label>
                </div>
                <div id="mdlPlayerWrap" class="mdl-player-card" hidden>
                    <div class="mdl-player-head">
                        <img id="mdlPlayerCover" src="" alt="Cover trek aktif" width="56" height="56" class="mdl-cover" hidden>
                        <div class="mdl-player-meta">
                            <div id="mdlPlayerTitle" class="mdl-track-title">-</div>
                            <div id="mdlPlayerSub" class="mdl-track-sub">-</div>
                        </div>
                        <span id="mdlPlayerBadge" class="mdl-badge">-</span>
                    </div>
                    <audio id="mdlAudio" controls preload="auto" class="mdl-audio"></audio>
                    <div class="mdl-player-actions">
                        <a id="mdlPlayerDownload" href="#" download class="v-btn mdl-action-btn" style="text-decoration:none;">
                            <i class="fas fa-download" aria-hidden="true"></i> Unduh Full Audio
                        </a>
                        <button type="button" class="v-btn v-btn-secondary mdl-action-btn" id="mdlLyricsBtn">
                            <i class="fas fa-align-left" aria-hidden="true"></i> Lihat Lirik
                        </button>
                    </div>
                    <div id="mdlLyricsBox" class="mdl-lyrics-box" hidden></div>
                </div>
                <div id="mdlStatusBar" class="mdl-status-bar">
                    Ketik judul lagu &amp; penyanyi untuk pencarian realtime akurat. Setiap hasil diverifikasi judul + durasi asli sebelum diputar atau diunduh.
                </div>
                <div id="mdlResults" class="mdl-results-list" aria-live="polite"></div>`;

            const queryEl = document.getElementById('mdlQuery');
            const searchBtn = document.getElementById('mdlSearchBtn');
            const origOnlyEl = document.getElementById('mdlOrigOnly');
            const statusBar = document.getElementById('mdlStatusBar');
            const resultsEl = document.getElementById('mdlResults');
            const playerWrap = document.getElementById('mdlPlayerWrap');
            const playerCover = document.getElementById('mdlPlayerCover');
            const playerTitle = document.getElementById('mdlPlayerTitle');
            const playerSub = document.getElementById('mdlPlayerSub');
            const playerBadge = document.getElementById('mdlPlayerBadge');
            const audioEl = document.getElementById('mdlAudio');
            const playerDl = document.getElementById('mdlPlayerDownload');
            const lyricsBtn = document.getElementById('mdlLyricsBtn');
            const lyricsBox = document.getElementById('mdlLyricsBox');

            let activeAbort = null;
            let debounceTimer = null;
            let reqSeq = 0;
            let activeTrack = null;
            let renderedTracks = [];

            const formatPlays = (n) => {
                const num = Number(n || 0);
                if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
                if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
                return String(num);
            };

            const selectAndPlayTrack = (track) => {
                if (!track) return;
                activeTrack = track;
                if (playerWrap) playerWrap.hidden = false;
                if (playerCover) {
                    if (track.artwork) {
                        playerCover.src = track.artwork;
                        playerCover.hidden = false;
                    } else {
                        playerCover.hidden = true;
                    }
                }
                if (playerTitle) playerTitle.textContent = track.title;
                if (playerSub) {
                    playerSub.textContent = `${track.artist} · ${track.durationLabel} · ${track.qualityLabel}`;
                }
                if (playerBadge) playerBadge.textContent = track.matchLabel || 'Akurat';
                if (playerDl) {
                    playerDl.setAttribute('href', track.downloadUrl);
                    playerDl.innerHTML = `<i class="fas fa-download" aria-hidden="true"></i> Unduh Full (.${escapeHtml(track.ext)})`;
                }
                if (lyricsBox) {
                    lyricsBox.hidden = true;
                    lyricsBox.innerHTML = '';
                }
                if (audioEl) {
                    audioEl.pause();
                    audioEl.src = track.streamUrl;
                    audioEl.load();
                    audioEl.play().catch(() => {});
                }
                resultsEl.querySelectorAll('.mdl-track-card').forEach((card) => {
                    card.classList.toggle('is-active', card.getAttribute('data-track-id') === track.id);
                });
                toast(`Memuat audio realtime: ${track.title}`);
            };

            const runMusicSearch = async (rawInput) => {
                const q = String(rawInput ?? queryEl?.value ?? '').trim();
                if (q.length < 2) {
                    statusBar.textContent = 'Ketik minimal 2 karakter judul lagu, penyanyi, atau tempel tautan SoundCloud / Spotify / YouTube.';
                    resultsEl.innerHTML = '';
                    return;
                }

                if (activeAbort) {
                    try { activeAbort.abort(); } catch {}
                }
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                activeAbort = controller;
                const mySeq = ++reqSeq;

                statusBar.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mencari musik realtime &amp; memverifikasi kecocokan lagu...';

                try {
                    const res = await fetch('/api/tools/music-dl', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'search',
                            query: q,
                            originalOnly: Boolean(origOnlyEl?.checked),
                        }),
                        signal: controller ? controller.signal : undefined,
                    });
                    const data = await res.json();
                    if (mySeq !== reqSeq) return;
                    if (!res.ok || !data.ok) {
                        throw new Error(data.error || `HTTP ${res.status}`);
                    }

                    const tracks = Array.isArray(data.tracks) ? data.tracks : [];
                    renderedTracks = tracks;

                    const refInfo = data.canonical
                        ? ` · Referensi asli: <strong>${escapeHtml(data.canonical.title)}</strong> - ${escapeHtml(data.canonical.artist)} (${escapeHtml(String(Math.floor(data.canonical.durationSec / 60)))}:${escapeHtml(String(data.canonical.durationSec % 60).padStart(2, '0'))})`
                        : '';

                    if (tracks.length === 0) {
                        statusBar.innerHTML = `Realtime ${escapeHtml(String(data.latencyMs || 0))} ms${refInfo}`;
                        resultsEl.innerHTML = `<div class="mdl-empty-state">
                            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                            <div>
                                <strong>Tidak ditemukan lagu full yang cocok persis untuk "${escapeHtml(q)}".</strong>
                                <p>Sistem sengaja menolak hasil acak agar lagu tidak melenceng. Coba tambahkan nama penyanyi, matikan filter "Hanya Versi Original", atau tempel link SoundCloud / Spotify / YouTube langsung.</p>
                            </div>
                        </div>`;
                        return;
                    }

                    const variantWarn = data.onlyVariantsAvailable
                        ? ' <span class="mdl-warn-note">(Versi studio penuh dibatasi lisensi; hanya tersedia versi edit/cover berlabel jelas)</span>'
                        : '';

                    statusBar.innerHTML = `<strong>${tracks.length} trek terverifikasi</strong> · Realtime ${escapeHtml(String(data.latencyMs || 0))} ms${refInfo}${variantWarn}`;

                    resultsEl.innerHTML = tracks
                        .map(
                            (t) => `<article class="mdl-track-card${activeTrack?.id === t.id ? ' is-active' : ''}" data-track-id="${escapeHtml(t.id)}">
                                ${
                                    t.artwork
                                        ? `<img src="${escapeHtml(t.artwork)}" alt="Cover ${escapeHtml(t.title)}" width="56" height="56" class="mdl-cover">`
                                        : `<div class="mdl-cover mdl-cover-fallback" aria-hidden="true"><i class="fa-solid fa-music"></i></div>`
                                }
                                <div class="mdl-track-body">
                                    <div class="mdl-track-title">${escapeHtml(t.title)}</div>
                                    <div class="mdl-track-sub">${escapeHtml(t.artist)} · ${escapeHtml(t.durationLabel)} · ${escapeHtml(t.qualityLabel)} · ${escapeHtml(formatPlays(t.plays))} putar</div>
                                    <div class="mdl-track-tags">
                                        <span class="mdl-badge${t.isVariant ? ' is-variant' : ''}">${escapeHtml(t.matchLabel)}</span>
                                        <span class="mdl-ext-tag">.${escapeHtml(t.ext.toUpperCase())}</span>
                                    </div>
                                </div>
                                <div class="mdl-track-actions">
                                    <button type="button" class="mdl-row-btn mdl-play-btn" data-play-id="${escapeHtml(t.id)}" aria-label="Putar realtime ${escapeHtml(t.title)}">
                                        <i class="fas fa-play" aria-hidden="true"></i> Putar
                                    </button>
                                    <a href="${escapeHtml(t.downloadUrl)}" download class="mdl-row-btn mdl-dl-btn" aria-label="Unduh ${escapeHtml(t.title)}">
                                        <i class="fas fa-download" aria-hidden="true"></i> Unduh
                                    </a>
                                </div>
                            </article>`
                        )
                        .join('');

                    resultsEl.querySelectorAll('[data-play-id]').forEach((btn) => {
                        btn.onclick = () => {
                            const id = btn.getAttribute('data-play-id');
                            const chosen = renderedTracks.find((x) => x.id === id);
                            if (chosen) selectAndPlayTrack(chosen);
                        };
                    });
                } catch (err) {
                    if (err && err.name === 'AbortError') return;
                    if (mySeq !== reqSeq) return;
                    statusBar.innerHTML = `<span style="color:var(--status-danger);">${escapeHtml(err.message || 'Gagal mencari musik.')}</span>`;
                    resultsEl.innerHTML = '';
                }
            };

            if (searchBtn) searchBtn.onclick = () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                runMusicSearch();
            };

            if (queryEl) {
                queryEl.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (debounceTimer) clearTimeout(debounceTimer);
                        runMusicSearch();
                    }
                };
                queryEl.oninput = () => {
                    if (debounceTimer) clearTimeout(debounceTimer);
                    const val = queryEl.value.trim();
                    if (val.length < 3) return;
                    debounceTimer = setTimeout(() => {
                        runMusicSearch(val);
                    }, 520);
                };
            }

            if (origOnlyEl) {
                origOnlyEl.onchange = () => {
                    if (queryEl && queryEl.value.trim().length >= 2) {
                        runMusicSearch();
                    }
                };
            }

            if (lyricsBtn) {
                lyricsBtn.onclick = async () => {
                    if (!activeTrack || !lyricsBox) return;
                    lyricsBox.hidden = false;
                    lyricsBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Memuat lirik cocok...';
                    try {
                        const data = await postJson('/api/tools/music-dl', {
                            action: 'lyrics',
                            title: activeTrack.title,
                            artist: activeTrack.artist,
                            durationSec: activeTrack.durationSec,
                        });
                        if (data.lyrics?.plainLyrics) {
                            lyricsBox.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;">
                                <strong>${escapeHtml(data.lyrics.trackName)} - ${escapeHtml(data.lyrics.artistName)}</strong>
                                <button type="button" class="copy-mini-btn" id="mdlCopyLyrics">Salin</button>
                            </div>
                            <pre class="mdl-lyrics-pre">${escapeHtml(data.lyrics.plainLyrics)}</pre>`;
                            const cp = document.getElementById('mdlCopyLyrics');
                            if (cp) cp.onclick = () => copyText(data.lyrics.plainLyrics, 'Lirik disalin!');
                        } else {
                            lyricsBox.textContent = 'Lirik yang cocok persis belum tersedia untuk trek ini.';
                        }
                    } catch (err) {
                        lyricsBox.innerHTML = `<span style="color:var(--status-danger);">${escapeHtml(err.message)}</span>`;
                    }
                };
            }

            if (typeof registerCleanup === 'function') {
                registerCleanup(() => {
                    if (debounceTimer) clearTimeout(debounceTimer);
                    if (activeAbort) {
                        try { activeAbort.abort(); } catch {}
                    }
                    if (audioEl) {
                        audioEl.pause();
                        audioEl.removeAttribute('src');
                    }
                });
            }

            if (typeof window !== 'undefined' && window.__pendingMusicQuery && queryEl) {
                const pending = String(window.__pendingMusicQuery);
                window.__pendingMusicQuery = '';
                queryEl.value = pending;
                runMusicSearch(pending);
            }

            return true;
        }

        // ============================================================
        // 3. CARI LAGU, PREVIEW 30 DETIK & LIRIK
        // ============================================================
        case 'dl_music':
            body.innerHTML = `${header}
                <div class="input-group"><input id="musQuery" class="v-input" placeholder="Judul lagu atau penyanyi (mis: Komang Raim Laode)"></div>
                <button type="button" class="v-btn" id="musBtn"><i class="fa-solid fa-music" aria-hidden="true"></i> Cari Lagu & Lirik</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Cari lagu, putar cuplikan audio 30 detik, dan lihat liriknya.</div>`;
            document.getElementById('musBtn').onclick = async () => {
                const query = document.getElementById('musQuery').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!query) return toast('Masukkan judul lagu');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mencari lagu & lirik...';
                try {
                    const data = await postJson('/api/tools/live-hub', { action: 'music', query });
                    const trackHtml = (data.tracks || [])
                        .slice(0, 4)
                        .map(
                            (t) => `<div style="display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:12px;margin-bottom:8px;background:var(--surface-input);">
                                ${t.cover ? `<img src="${escapeHtml(t.cover)}" alt="Cover" width="60" height="60" style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;">` : ''}
                                <div style="min-width:0;flex:1;">
                                    <div style="font-weight:700;font-size:0.88rem;">${escapeHtml(t.title)}</div>
                                    <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">${escapeHtml(t.artist)} - ${escapeHtml(t.album)}</div>
                                    ${t.previewUrl ? `<audio controls src="${escapeHtml(t.previewUrl)}" style="width:100%;height:32px;"></audio>` : ''}
                                    <button type="button" class="copy-mini-btn" style="margin-top:6px;" data-open-mdl="${escapeHtml(`${t.title} ${t.artist}`)}"><i class="fa-solid fa-headphones" aria-hidden="true"></i> Unduh Full di Music Downloader</button>
                                </div>
                            </div>`
                        )
                        .join('');
                    const lrcHtml = data.lyrics
                        ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color);">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                <strong>Lirik: ${escapeHtml(data.lyrics.trackName)}</strong>
                                <button type="button" class="copy-mini-btn" id="musCopyLrc">Salin Lirik</button>
                            </div>
                            <pre style="white-space:pre-wrap;font-size:0.8rem;max-height:240px;overflow:auto;line-height:1.55;">${escapeHtml(data.lyrics.plainLyrics)}</pre>
                        </div>`
                        : '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Lirik tidak ditemukan untuk kueri ini.</div>';
                    resBox.innerHTML = (trackHtml || '<div>Lagu tidak ditemukan.</div>') + lrcHtml;
                    const cp = document.getElementById('musCopyLrc');
                    if (cp && data.lyrics) cp.onclick = () => copyText(data.lyrics.plainLyrics, 'Lirik disalin!');
                    resBox.querySelectorAll('[data-open-mdl]').forEach((btn) => {
                        btn.onclick = () => {
                            window.__pendingMusicQuery = btn.getAttribute('data-open-mdl') || query;
                            if (typeof window.showTool === 'function') {
                                window.showTool('dl_music_dl', 'Music Downloader');
                            }
                        };
                    });
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 4. STIKER WA MAKER (512px WebP)
        // ============================================================
        case 'mk_wasticker':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group"><input type="file" id="wasFile" accept="image/*" class="v-input"></div>
                <div class="input-group">
                    <select id="wasShape" class="v-select">
                        <option value="rounded">Sudut Membulat (Transparan)</option>
                        <option value="circle">Lingkaran Penuh (Transparan)</option>
                        <option value="square">Kotak Penuh 512x512</option>
                    </select>
                </div>
                <div class="input-group"><input id="wasTop" class="v-input" placeholder="Teks atas stiker (opsional)"></div>
                <div class="input-group"><input id="wasBot" class="v-input" placeholder="Teks bawah stiker (mis: SANTAI BRO)"></div>
                <button type="button" class="v-btn" id="wasBtn"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Buat Stiker WebP</button>
                <div class="result-box" id="toolResult">Unggah foto untuk diubah ke format stiker WhatsApp 512x512 WebP.</div>`;
            document.getElementById('wasBtn').onclick = async () => {
                const file = document.getElementById('wasFile').files?.[0];
                const resBox = document.getElementById('toolResult');
                if (!file) return toast('Pilih foto terlebih dahulu');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender stiker WebP 512x512...';
                try {
                    const fd = new FormData();
                    fd.append('action', 'wa_sticker');
                    fd.append('file', file);
                    fd.append('shape', document.getElementById('wasShape').value);
                    fd.append('topText', document.getElementById('wasTop').value);
                    fd.append('bottomText', document.getElementById('wasBot').value);
                    const { blob } = await postBlob('/api/tools/viral-maker', fd, true);
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Stiker WA" width="512" height="512" class="media-result-img" style="max-width:280px;">
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Ukuran file: ${(blob.size / 1024).toFixed(1)} KB (WebP 512x512)</div>
                        <a href="${url}" download="stiker_wa_mattzlm.webp" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Stiker (.webp)</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 5. FAKE CHAT WHATSAPP
        // ============================================================
        case 'mk_fakewa':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group"><input id="fwaName" class="v-input" value="Ayang" placeholder="Nama kontak"></div>
                <div class="input-group"><input id="fwaStatus" class="v-input" value="online" placeholder="Status (online / mengetik... / terakhir dilihat)"></div>
                <div class="input-group">
                    <select id="fwaTheme" class="v-select">
                        <option value="dark">Mode Gelap WA</option>
                        <option value="light">Mode Terang WA</option>
                    </select>
                </div>
                <div class="input-group">
                    <textarea id="fwaMsgs" class="v-textarea" rows="5" placeholder="Format per baris: L: Pesan dia | 21:40 atau R: Pesan kamu | 21:41">L: Lagi sibuk gak? | 21:40
R: Santai kok, kenapa nih? | 21:41
L: Jalan yuk malam ini aku traktir | 21:41
R: Gas meluncur sekarang! | 21:42</textarea>
                </div>
                <button type="button" class="v-btn" id="fwaBtn"><i class="fa-solid fa-comments" aria-hidden="true"></i> Buat Screenshot WA</button>
                <div class="result-box" id="toolResult">Gunakan awalan <code>L:</code> untuk bubble kiri dan <code>R:</code> untuk bubble kanan.</div>`;
            document.getElementById('fwaBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender chat WhatsApp...';
                try {
                    const { blob } = await postBlob('/api/tools/viral-maker', {
                        action: 'fake_wa',
                        name: document.getElementById('fwaName').value,
                        status: document.getElementById('fwaStatus').value,
                        theme: document.getElementById('fwaTheme').value,
                        messages: document.getElementById('fwaMsgs').value,
                    });
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Fake Chat WA" width="720" height="720" class="media-result-img">
                        <a href="${url}" download="fake_chat_wa.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 6. FAKE TWEET X / TWITTER
        // ============================================================
        case 'mk_faketweet':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group"><input id="ftwName" class="v-input" value="MattzLM" placeholder="Nama tampilan"></div>
                <div class="input-group"><input id="ftwHandle" class="v-input" value="mattzlm_id" placeholder="Username tanpa @"></div>
                <div class="input-group"><textarea id="ftwText" class="v-textarea" rows="3" placeholder="Isi postingan X...">Bikin konten viral jaman sekarang nggak perlu ribet edit berjam-jam, semua beres dalam 10 detik.</textarea></div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <input id="ftwLikes" class="v-input" value="48,2K" placeholder="Likes">
                    <input id="ftwViews" class="v-input" value="2,1M" placeholder="Views">
                </div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <select id="ftwTheme" class="v-select"><option value="dark">Gelap (Hitam)</option><option value="light">Terang (Putih)</option></select>
                    <select id="ftwVer" class="v-select"><option value="1">Centang Biru</option><option value="0">Tanpa Centang</option></select>
                </div>
                <button type="button" class="v-btn" id="ftwBtn"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i> Buat Gambar Tweet</button>
                <div class="result-box" id="toolResult">Hasil gambar PNG resolusi tinggi siap untuk konten meme atau Story.</div>`;
            document.getElementById('ftwBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender postingan X...';
                try {
                    const { blob } = await postBlob('/api/tools/viral-maker', {
                        action: 'fake_tweet',
                        displayName: document.getElementById('ftwName').value,
                        handle: document.getElementById('ftwHandle').value,
                        text: document.getElementById('ftwText').value,
                        likes: document.getElementById('ftwLikes').value,
                        views: document.getElementById('ftwViews').value,
                        theme: document.getElementById('ftwTheme').value,
                        verified: document.getElementById('ftwVer').value === '1',
                    });
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Fake Tweet X" width="820" height="420" class="media-result-img">
                        <a href="${url}" download="fake_tweet_x.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 7. SPOTIFY NOW PLAYING CARD
        // ============================================================
        case 'mk_fakespotify':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group"><input id="fspTitle" class="v-input" value="Komang" placeholder="Judul lagu"></div>
                <div class="input-group"><input id="fspArtist" class="v-input" value="Raim Laode" placeholder="Nama artis"></div>
                <div class="input-group"><input id="fspLyric" class="v-input" value="Sebab kau terlalu indah dari sekadar kata" placeholder="Penggalan lirik"></div>
                <div class="input-group"><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">Foto Cover Album (opsional)</label><input type="file" id="fspFile" accept="image/*" class="v-input"></div>
                <button type="button" class="v-btn" id="fspBtn"><i class="fa-brands fa-spotify" aria-hidden="true"></i> Buat Kartu Spotify</button>
                <div class="result-box" id="toolResult">Buat kartu Now Playing bergaya Spotify siap unggah ke Story.</div>`;
            document.getElementById('fspBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender kartu musik...';
                try {
                    const fd = new FormData();
                    fd.append('action', 'fake_spotify');
                    fd.append('title', document.getElementById('fspTitle').value);
                    fd.append('artist', document.getElementById('fspArtist').value);
                    fd.append('lyric', document.getElementById('fspLyric').value);
                    const file = document.getElementById('fspFile').files?.[0];
                    if (file) fd.append('file', file);
                    const { blob } = await postBlob('/api/tools/viral-maker', fd, true);
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Spotify Card" width="720" height="960" class="media-result-img" style="max-width:320px;">
                        <a href="${url}" download="spotify_now_playing.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 8. FAKE NOTIF LOCKSCREEN IPHONE
        // ============================================================
        case 'mk_fakenotif':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group">
                    <select id="fnApp" class="v-select">
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Instagram">Instagram</option>
                        <option value="DANA">DANA</option>
                        <option value="BCA">BCA Mobile</option>
                        <option value="TikTok">TikTok</option>
                        <option value="GoPay">GoPay</option>
                        <option value="Shopee">Shopee</option>
                    </select>
                </div>
                <div class="input-group"><input id="fnSender" class="v-input" value="Sayang" placeholder="Judul / Pengirim"></div>
                <div class="input-group"><textarea id="fnMsg" class="v-textarea" rows="3" placeholder="Isi notifikasi...">Jangan lupa makan ya, nanti malam kita ketemu!</textarea></div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <input id="fnClock" class="v-input" value="21:45" placeholder="Jam (21:45)">
                    <input id="fnAgo" class="v-input" value="baru saja" placeholder="Waktu (baru saja)">
                </div>
                <button type="button" class="v-btn" id="fnBtn"><i class="fa-solid fa-bell" aria-hidden="true"></i> Buat Lockscreen Notif</button>
                <div class="result-box" id="toolResult">Hasil wallpaper lockscreen HD siap buat konten Story/TikTok.</div>`;
            document.getElementById('fnBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender notifikasi iPhone...';
                try {
                    const { blob } = await postBlob('/api/tools/viral-maker', {
                        action: 'fake_notif',
                        app: document.getElementById('fnApp').value,
                        sender: document.getElementById('fnSender').value,
                        message: document.getElementById('fnMsg').value,
                        clock: document.getElementById('fnClock').value,
                        ago: document.getElementById('fnAgo').value,
                    });
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Fake Notif" width="760" height="980" class="media-result-img" style="max-width:320px;">
                        <a href="${url}" download="fake_notif_lockscreen.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 9. MOCKUP STRUK TRANSFER (SIMULASI HIBURAN)
        // ============================================================
        case 'mk_fakestruk':
            bindCleanup();
            body.innerHTML = `${header}
                <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">Khusus mockup konten hiburan/desain UI (tertera label simulasi di bagian bawah).</p>
                <div class="input-group">
                    <select id="fstProv" class="v-select">
                        <option value="QRIS / Transfer Bank">QRIS / Transfer Bank</option>
                        <option value="DANA E-Wallet">DANA E-Wallet</option>
                        <option value="GoPay">GoPay</option>
                        <option value="SeaBank / BCA">SeaBank / BCA</option>
                    </select>
                </div>
                <div class="input-group"><input id="fstRecv" class="v-input" value="MATTZLM STORE" placeholder="Nama penerima"></div>
                <div class="input-group"><input id="fstSend" class="v-input" value="RAKA PRATAMA" placeholder="Nama pengirim"></div>
                <div class="input-group"><input id="fstAmt" type="number" class="v-input" value="250000" placeholder="Nominal (Rp)"></div>
                <div class="input-group"><input id="fstNote" class="v-input" value="Bayar kopi & cemilan" placeholder="Catatan transaksi"></div>
                <button type="button" class="v-btn" id="fstBtn"><i class="fa-solid fa-receipt" aria-hidden="true"></i> Buat Mockup Struk</button>
                <div class="result-box" id="toolResult">Isi nominal dan nama lalu klik Buat Mockup Struk.</div>`;
            document.getElementById('fstBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender mockup struk...';
                try {
                    const { blob } = await postBlob('/api/tools/viral-maker', {
                        action: 'fake_struk',
                        provider: document.getElementById('fstProv').value,
                        receiver: document.getElementById('fstRecv').value,
                        sender: document.getElementById('fstSend').value,
                        amount: Number(document.getElementById('fstAmt').value || 0),
                        note: document.getElementById('fstNote').value,
                    });
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Mockup Struk" width="680" height="820" class="media-result-img" style="max-width:320px;">
                        <a href="${url}" download="mockup_struk_simulasi.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 10. IG FEED 3x3 GRID SPLITTER
        // ============================================================
        case 'mk_iggrid':
            body.innerHTML = `${header}
                <div class="input-group"><input type="file" id="iggFile" accept="image/*" class="v-input"></div>
                <div class="input-group">
                    <select id="iggRows" class="v-select">
                        <option value="3">3 x 3 (9 Kotak Feed Penuh)</option>
                        <option value="2">2 x 3 (6 Kotak Banner)</option>
                        <option value="1">1 x 3 (3 Kotak Panorama)</option>
                    </select>
                </div>
                <button type="button" class="v-btn" id="iggBtn"><i class="fa-solid fa-table-cells" aria-hidden="true"></i> Potong Foto Feed IG</button>
                <div class="result-box" id="toolResult">Unggah foto untuk dipotong otomatis menjadi kotak feed Instagram.</div>`;
            document.getElementById('iggBtn').onclick = async () => {
                const file = document.getElementById('iggFile').files?.[0];
                const resBox = document.getElementById('toolResult');
                if (!file) return toast('Unggah foto terlebih dahulu');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Memotong foto ke grid feed...';
                try {
                    const fd = new FormData();
                    fd.append('action', 'ig_grid');
                    fd.append('file', file);
                    fd.append('rows', document.getElementById('iggRows').value);
                    const res = await fetch('/api/tools/viral-maker', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal memotong foto');
                    const tiles = data.tiles
                        .map(
                            (t) => `<a href="${t.dataUrl}" download="${escapeHtml(t.name)}" class="ig-grid-tile">
                                <img src="${t.dataUrl}" alt="Tile ${t.index}" width="360" height="360">
                                <span>#${t.index} Unduh</span>
                            </a>`
                        )
                        .join('');
                    resBox.innerHTML = `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Tip: Upload ke Instagram mulai dari nomor terbesar (#${data.total}) mundur ke #1 agar tersusun rapi.</div>
                        <div class="ig-grid-preview">${tiles}</div>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 11. TWIBBON & FRAME FOTO
        // ============================================================
        case 'mk_twibbon':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group"><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">Foto Profil Anda (Wajib)</label><input type="file" id="twbPhoto" accept="image/*" class="v-input"></div>
                <div class="input-group">
                    <select id="twbPreset" class="v-select">
                        <option value="event">Bingkai Event Monokrom</option>
                        <option value="merdeka">Bingkai Merah Putih</option>
                        <option value="ramadhan">Bingkai Ramadhan / Hari Raya</option>
                        <option value="birthday">Bingkai Ulang Tahun</option>
                        <option value="kampus">Bingkai Maba / Kampus</option>
                    </select>
                </div>
                <div class="input-group"><input id="twbHead" class="v-input" value="SIAP MERAMAIKAN EVENT 2026" placeholder="Judul pita twibbon"></div>
                <div class="input-group"><input id="twbSub" class="v-input" value="#MattzLMCommunity" placeholder="Subjudul / Hashtag"></div>
                <div class="input-group"><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">Atau Unggah Frame PNG Transparan Sendiri (Opsional)</label><input type="file" id="twbFrame" accept="image/png" class="v-input"></div>
                <button type="button" class="v-btn" id="twbBtn"><i class="fa-solid fa-crop-simple" aria-hidden="true"></i> Pasang Twibbon</button>
                <div class="result-box" id="toolResult">Gabungkan foto profil dengan twibbon 1080x1080 HD.</div>`;
            document.getElementById('twbBtn').onclick = async () => {
                const photo = document.getElementById('twbPhoto').files?.[0];
                const resBox = document.getElementById('toolResult');
                if (!photo) return toast('Pilih foto profil terlebih dahulu');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Memasang bingkai twibbon...';
                try {
                    const fd = new FormData();
                    fd.append('action', 'twibbon');
                    fd.append('file', photo);
                    fd.append('preset', document.getElementById('twbPreset').value);
                    fd.append('headline', document.getElementById('twbHead').value);
                    fd.append('subline', document.getElementById('twbSub').value);
                    const customFrame = document.getElementById('twbFrame').files?.[0];
                    if (customFrame) fd.append('frameFile', customFrame);
                    const { blob } = await postBlob('/api/tools/viral-maker', fd, true);
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Twibbon" width="1080" height="1080" class="media-result-img" style="max-width:340px;">
                        <a href="${url}" download="twibbon_mattzlm.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Twibbon PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 12. MEME GENERATOR
        // ============================================================
        case 'mk_meme':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group"><input type="file" id="mmFile" accept="image/*" class="v-input"></div>
                <div class="input-group"><input id="mmTop" class="v-input" placeholder="Teks atas meme (mis: KETIKA DEADLINE BESOK)"></div>
                <div class="input-group"><input id="mmBot" class="v-input" placeholder="Teks bawah meme (mis: TAPI MALAH SCROLL TIKTOK)"></div>
                <button type="button" class="v-btn" id="mmBtn"><i class="fa-solid fa-face-laugh-squint" aria-hidden="true"></i> Buat Meme HD</button>
                <div class="result-box" id="toolResult">Unggah foto dan masukkan teks meme atas/bawah.</div>`;
            document.getElementById('mmBtn').onclick = async () => {
                const file = document.getElementById('mmFile').files?.[0];
                const resBox = document.getElementById('toolResult');
                if (!file) return toast('Pilih gambar meme');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender meme...';
                try {
                    const fd = new FormData();
                    fd.append('action', 'meme');
                    fd.append('file', file);
                    fd.append('topText', document.getElementById('mmTop').value);
                    fd.append('bottomText', document.getElementById('mmBot').value);
                    const { blob } = await postBlob('/api/tools/viral-maker', fd, true);
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Meme" width="800" height="800" class="media-result-img">
                        <a href="${url}" download="meme_mattzlm.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Meme PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 13. POLAROID & QUOTE CARD AESTHETIC
        // ============================================================
        case 'mk_polaroid':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group"><label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">Foto (opsional, kosongkan untuk kartu kutipan teks)</label><input type="file" id="polFile" accept="image/*" class="v-input"></div>
                <div class="input-group"><input id="polCap" class="v-input" value="Tetap tenang, semua ada waktunya." placeholder="Caption / Kutipan singkat"></div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <input id="polDate" class="v-input" value="25 . 11 . 2026" placeholder="Tanggal">
                    <select id="polTone" class="v-select">
                        <option value="classic">Kertas Putih Klasik</option>
                        <option value="bw">Hitam Putih Vintage</option>
                        <option value="dark">Polaroid Gelap</option>
                    </select>
                </div>
                <button type="button" class="v-btn" id="polBtn"><i class="fa-solid fa-camera-retro" aria-hidden="true"></i> Buat Kartu Polaroid</button>
                <div class="result-box" id="toolResult">Buat bingkai polaroid estetik siap unggah ke Story.</div>`;
            document.getElementById('polBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Merender kartu polaroid...';
                try {
                    const fd = new FormData();
                    fd.append('action', 'polaroid');
                    fd.append('caption', document.getElementById('polCap').value);
                    fd.append('date', document.getElementById('polDate').value);
                    fd.append('tone', document.getElementById('polTone').value);
                    const file = document.getElementById('polFile').files?.[0];
                    if (file) fd.append('file', file);
                    const { blob } = await postBlob('/api/tools/viral-maker', fd, true);
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Polaroid" width="760" height="920" class="media-result-img" style="max-width:320px;">
                        <a href="${url}" download="polaroid_mattzlm.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Polaroid PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 14. SUARA NARATOR TTS (MP3)
        // ============================================================
        case 'gen_tts':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group">
                    <select id="ttsLang" class="v-select">
                        <option value="id">Bahasa Indonesia (Suara TikTok / Narator)</option>
                        <option value="en">Bahasa Inggris (English)</option>
                        <option value="ja">Bahasa Jepang (Anime / JP)</option>
                        <option value="ko">Bahasa Korea (KR)</option>
                        <option value="ar">Bahasa Arab (AR)</option>
                        <option value="jw">Bahasa Jawa (JW)</option>
                        <option value="su">Bahasa Sunda (SU)</option>
                    </select>
                </div>
                <div class="input-group"><textarea id="ttsText" class="v-textarea" rows="4" placeholder="Ketik teks narasi (maks. 480 karakter)...">Halo semuanya! Selamat datang di MattzLM, kumpulan tools viral siap pakai langsung dari browser.</textarea></div>
                <button type="button" class="v-btn" id="ttsBtn"><i class="fa-solid fa-volume-high" aria-hidden="true"></i> Buat Audio MP3</button>
                <div class="result-box" id="toolResult">Ketik naskah lalu klik Buat Audio MP3 untuk memutar dan mengunduh suara.</div>`;
            document.getElementById('ttsBtn').onclick = async () => {
                const text = document.getElementById('ttsText').value.trim();
                const lang = document.getElementById('ttsLang').value;
                const resBox = document.getElementById('toolResult');
                if (!text) return toast('Masukkan teks narasi');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengubah teks jadi audio MP3...';
                try {
                    const { blob } = await postBlob('/api/tools/creator-kit', { action: 'tts', text, lang });
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<audio controls autoplay src="${url}" style="width:100%;margin-bottom:10px;"></audio>
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Audio siap (${(blob.size / 1024).toFixed(1)} KB, MP3)</div>
                        <a href="${url}" download="narasi_tts_${escapeHtml(lang)}.mp3" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Suara (.mp3)</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 15. TRANSLATOR CEPAT MULTI-BAHASA
        // ============================================================
        case 'gen_translate':
            body.innerHTML = `${header}
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <select id="trSrc" class="v-select">
                        <option value="auto">Deteksi Otomatis</option>
                        <option value="id">Indonesia</option>
                        <option value="en">Inggris</option>
                        <option value="ja">Jepang</option>
                        <option value="ko">Korea</option>
                        <option value="ar">Arab</option>
                        <option value="jw">Jawa</option>
                    </select>
                    <select id="trDst" class="v-select">
                        <option value="en">Ke: Inggris</option>
                        <option value="id">Ke: Indonesia</option>
                        <option value="ja">Ke: Jepang</option>
                        <option value="ko">Ke: Korea</option>
                        <option value="zh-CN">Ke: Mandarin</option>
                        <option value="ar">Ke: Arab</option>
                        <option value="es">Ke: Spanyol</option>
                    </select>
                </div>
                <div class="input-group"><textarea id="trText" class="v-textarea" rows="4" placeholder="Ketik teks yang ingin diterjemahkan..."></textarea></div>
                <button type="button" class="v-btn" id="trBtn"><i class="fa-solid fa-language" aria-hidden="true"></i> Terjemahkan</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Hasil terjemahan akan muncul di sini.</div>`;
            document.getElementById('trBtn').onclick = async () => {
                const text = document.getElementById('trText').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!text) return toast('Masukkan teks');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Menerjemahkan...';
                try {
                    const data = await postJson('/api/tools/creator-kit', {
                        action: 'translate',
                        text,
                        source: document.getElementById('trSrc').value,
                        target: document.getElementById('trDst').value,
                    });
                    resBox.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">Bahasa terdeteksi: <strong>${escapeHtml(data.detectedLang.toUpperCase())}</strong> -> <strong>${escapeHtml(data.target.toUpperCase())}</strong></div>
                        <div style="font-size:0.95rem;white-space:pre-wrap;margin-bottom:10px;">${escapeHtml(data.translated)}</div>
                        <button type="button" class="v-btn v-btn-secondary" id="trCopyBtn">Salin Terjemahan</button>`;
                    document.getElementById('trCopyBtn').onclick = () => copyText(data.translated);
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 16. WA DIRECT LINK & QR CHAT
        // ============================================================
        case 'gen_walink':
            body.innerHTML = `${header}
                <div class="input-group"><input id="walPhone" class="v-input" placeholder="Nomor WA (contoh: 081234567890)"></div>
                <div class="input-group"><textarea id="walMsg" class="v-textarea" rows="3" placeholder="Pesan otomatis saat link diklik...">Halo kak, saya mau tanya info produknya dong!</textarea></div>
                <button type="button" class="v-btn" id="walBtn"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Buat Link & QR WA</button>
                <div class="result-box" id="toolResult">Buat tautan wa.me untuk bio Instagram/TikTok lengkap dengan QR Code.</div>`;
            document.getElementById('walBtn').onclick = async () => {
                const phone = document.getElementById('walPhone').value.trim();
                const message = document.getElementById('walMsg').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!phone) return toast('Masukkan nomor WhatsApp');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Membuat link & QR WhatsApp...';
                try {
                    const data = await postJson('/api/tools/creator-kit', { action: 'wa_link', phone, message });
                    resBox.innerHTML = `<img src="${data.pngDataUrl}" alt="QR WhatsApp" width="420" height="420" class="media-result-img" style="max-width:220px;">
                        <div style="word-break:break-all;font-size:0.8rem;margin-bottom:10px;">${escapeHtml(data.waUrl)}</div>
                        <div class="owner-action-row">
                            <button type="button" class="v-btn" id="walCopyBtn">Salin Link</button>
                            <a href="${escapeHtml(data.waUrl)}" target="_blank" rel="noopener noreferrer" class="v-btn v-btn-secondary" style="text-decoration:none;">Buka WA</a>
                            <a href="${data.pngDataUrl}" download="qr_wa_${escapeHtml(data.phone)}.png" class="v-btn v-btn-secondary" style="text-decoration:none;">Unduh QR</a>
                        </div>`;
                    document.getElementById('walCopyBtn').onclick = () => copyText(data.waUrl, 'Link WA disalin!');
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 17. QRIS NOMINAL DINAMIS (EMVCo)
        // ============================================================
        case 'gen_qris':
            body.innerHTML = `${header}
                <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;">Tempel string mentah QRIS statis merchant Anda (hasil scan QR teks <code>000201...</code>) lalu masukkan nominal tagihan otomatis.</p>
                <div class="input-group"><textarea id="qrsStr" class="v-textarea" rows="3" placeholder="00020101021126...5802ID59...6304XXXX"></textarea></div>
                <div class="input-group"><input id="qrsAmt" type="number" class="v-input" value="25000" placeholder="Nominal tagihan (Rp)"></div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <select id="qrsFeeType" class="v-select">
                        <option value="none">Tanpa Biaya Layanan</option>
                        <option value="fixed">Biaya Tetap (Rp)</option>
                        <option value="percent">Biaya Persen (%)</option>
                    </select>
                    <input id="qrsFeeVal" type="number" class="v-input" value="0" placeholder="Nilai biaya">
                </div>
                <button type="button" class="v-btn" id="qrsBtn"><i class="fa-solid fa-qrcode" aria-hidden="true"></i> Generate QRIS Dinamis</button>
                <div class="result-box" id="toolResult">QRIS otomatis dihitung ulang CRC16-CCITT sesuai standar BI EMVCo.</div>`;
            document.getElementById('qrsBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Menghitung ulang CRC16 & membuat QRIS...';
                try {
                    const data = await postJson('/api/tools/creator-kit', {
                        action: 'qris_dinamis',
                        qris: document.getElementById('qrsStr').value,
                        amount: Number(document.getElementById('qrsAmt').value || 0),
                        feeType: document.getElementById('qrsFeeType').value,
                        feeValue: Number(document.getElementById('qrsFeeVal').value || 0),
                    });
                    resBox.innerHTML = `<div style="font-weight:700;margin-bottom:4px;">${escapeHtml(data.merchantName)} (${escapeHtml(data.merchantCity)})</div>
                        <div style="font-size:0.95rem;font-weight:700;margin-bottom:10px;">Nominal: ${escapeHtml(fmtRp(data.amount))} | CRC: ${escapeHtml(data.crc)}</div>
                        <img src="${data.pngDataUrl}" alt="QRIS Dinamis" width="440" height="440" class="media-result-img" style="max-width:250px;">
                        <div class="owner-action-row">
                            <a href="${data.pngDataUrl}" download="qris_${data.amount}.png" class="v-btn" style="text-decoration:none;">Unduh PNG</a>
                            <button type="button" class="v-btn v-btn-secondary" id="qrsCopyBtn">Salin String QRIS</button>
                        </div>`;
                    document.getElementById('qrsCopyBtn').onclick = () => copyText(data.qrisString, 'String QRIS disalin!');
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 18. FONT BIO AESTHETIC
        // ============================================================
        case 'gen_fancyfont':
            body.innerHTML = `${header}
                <div class="input-group"><input id="ffInput" class="v-input" value="MattzLM Official" placeholder="Ketik teks bio IG / TikTok / WA..."></div>
                <button type="button" class="v-btn" id="ffBtn"><i class="fa-solid fa-font" aria-hidden="true"></i> Ubah ke 15 Gaya Font</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Klik tombol Salin di samping gaya font favorit Anda.</div>`;
            document.getElementById('ffBtn').onclick = async () => {
                const text = document.getElementById('ffInput').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!text) return toast('Masukkan teks');
                try {
                    const data = await postJson('/api/tools/creator-kit', { action: 'fancy_font', text });
                    const rows = data.styles
                        .map(
                            (s) => `<div class="copy-row-item">
                                <div class="copy-row-text">
                                    <span class="copy-row-label">${escapeHtml(s.label)}</span>
                                    <span class="copy-row-val">${escapeHtml(s.value)}</span>
                                </div>
                                <button type="button" class="copy-mini-btn" data-copy-val="${escapeHtml(s.value)}">Salin</button>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div class="copy-row-list">${rows}</div>`;
                    bindCopyButtons(resBox);
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 19. NICKNAME GAME PRO (FF / MLBB / VAL / PUBG)
        // ============================================================
        case 'gen_nickgame':
            body.innerHTML = `${header}
                <div class="input-group"><input id="ngName" class="v-input" value="Mattz" placeholder="Nama dasar (mis: Raka, Sora, Kyro)"></div>
                <div class="input-group">
                    <select id="ngStyle" class="v-select">
                        <option value="ff">Free Fire (FF)</option>
                        <option value="ml">Mobile Legends (MLBB)</option>
                        <option value="val">Valorant</option>
                        <option value="pro">PUBG / Umum Pro</option>
                    </select>
                </div>
                <button type="button" class="v-btn" id="ngBtn"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> Generate 20 Nickname</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Hasil nickname simbol keren siap tempel ke dalam game.</div>`;
            document.getElementById('ngBtn').onclick = async () => {
                const name = document.getElementById('ngName').value.trim();
                const style = document.getElementById('ngStyle').value;
                const resBox = document.getElementById('toolResult');
                if (!name) return toast('Masukkan nama dasar');
                try {
                    const data = await postJson('/api/tools/creator-kit', { action: 'nick_game', name, style });
                    const rows = data.nicknames
                        .map(
                            (n, i) => `<div class="copy-row-item">
                                <div class="copy-row-text"><span class="copy-row-val">${escapeHtml(n)}</span></div>
                                <button type="button" class="copy-mini-btn" data-copy-val="${escapeHtml(n)}">Salin #${i + 1}</button>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div class="copy-row-list">${rows}</div>`;
                    bindCopyButtons(resBox);
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 20. KALKULATOR RATE CARD & ENGAGEMENT RATE TIKTOK/IG
        // ============================================================
        case 'gen_tiktokcalc':
            body.innerHTML = `${header}
                <div class="input-group">
                    <select id="tcPlat" class="v-select">
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                    </select>
                </div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <input id="tcFol" type="number" class="v-input" value="50000" placeholder="Jumlah Followers">
                    <input id="tcViews" type="number" class="v-input" value="35000" placeholder="Rata-rata Views">
                </div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                    <input id="tcLikes" type="number" class="v-input" value="2800" placeholder="Rata-rata Like">
                    <input id="tcComm" type="number" class="v-input" value="140" placeholder="Komentar">
                    <input id="tcShare" type="number" class="v-input" value="90" placeholder="Share/Save">
                </div>
                <button type="button" class="v-btn" id="tcBtn"><i class="fa-solid fa-chart-line" aria-hidden="true"></i> Hitung ER & Rate Card</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Masukkan statistik akun untuk melihat kualitas engagement & kisaran tarif endorse Indonesia.</div>`;
            document.getElementById('tcBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                try {
                    const data = await postJson('/api/tools/creator-kit', {
                        action: 'tiktok_calc',
                        platform: document.getElementById('tcPlat').value,
                        followers: Number(document.getElementById('tcFol').value || 0),
                        views: Number(document.getElementById('tcViews').value || 0),
                        likes: Number(document.getElementById('tcLikes').value || 0),
                        comments: Number(document.getElementById('tcComm').value || 0),
                        shares: Number(document.getElementById('tcShare').value || 0),
                    });
                    resBox.innerHTML = `<div class="sholat-grid" style="margin-bottom:10px;">
                            <div class="sholat-cell"><span>ER / Followers</span><strong>${data.erFollowers}%</strong></div>
                            <div class="sholat-cell"><span>ER / Views</span><strong>${data.erViews}%</strong></div>
                            <div class="sholat-cell"><span>Tier Akun</span><strong>${escapeHtml(data.tier)}</strong></div>
                            <div class="sholat-cell"><span>Status</span><strong>${escapeHtml(data.quality)}</strong></div>
                        </div>
                        <div style="padding:10px;border-radius:12px;background:var(--surface-input);border:1px solid var(--border-color);">
                            <div style="font-size:0.78rem;color:var(--text-muted);">Estimasi Rate Card Endorse (${escapeHtml(data.platform)})</div>
                            <div style="font-size:1.1rem;font-weight:700;margin:4px 0;">${escapeHtml(fmtRp(data.rateMinIdr))} - ${escapeHtml(fmtRp(data.rateMaxIdr))} / konten</div>
                            <div style="font-size:0.78rem;color:var(--text-muted);">Estimasi Bonus Views Bulanan: ~${escapeHtml(fmtRp(data.estCreatorFundIdr))}</div>
                        </div>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 21. CAPTION & HASHTAG FYP GENERATOR
        // ============================================================
        case 'gen_caption':
            body.innerHTML = `${header}
                <div class="input-group">
                    <select id="capNiche" class="v-select">
                        <option value="daily">Daily Vlog / Relatable</option>
                        <option value="bisnis">Bisnis / UMKM / Affiliate</option>
                        <option value="gaming">Gaming / MLBB / FF</option>
                        <option value="aesthetic">Aesthetic / Galau / Story</option>
                        <option value="kuliner">Kuliner / Jajanan Viral</option>
                    </select>
                </div>
                <div class="input-group"><input id="capTopic" class="v-input" value="kopi susu kekinian" placeholder="Topik konten Anda"></div>
                <button type="button" class="v-btn" id="capBtn"><i class="fa-solid fa-hashtag" aria-hidden="true"></i> Buat Caption & Hashtag</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Pilih kategori konten untuk mendapatkan caption dan hashtag siap tempel.</div>`;
            document.getElementById('capBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                try {
                    const data = await postJson('/api/tools/creator-kit', {
                        action: 'caption_hashtag',
                        niche: document.getElementById('capNiche').value,
                        topic: document.getElementById('capTopic').value,
                    });
                    const caps = data.captions
                        .map(
                            (c, i) => `<div class="copy-row-item">
                                <div class="copy-row-text"><span class="copy-row-label">Opsi #${i + 1}</span><span>${escapeHtml(c)}</span></div>
                                <button type="button" class="copy-mini-btn" data-copy-val="${escapeHtml(c + '\n\n' + data.hashtagLine)}">Salin</button>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div class="copy-row-list" style="margin-bottom:10px;">${caps}</div>
                        <div class="copy-row-item">
                            <div class="copy-row-text"><span class="copy-row-label">Paket Hashtag FYP</span><span style="font-size:0.82rem;">${escapeHtml(data.hashtagLine)}</span></div>
                            <button type="button" class="copy-mini-btn" data-copy-val="${escapeHtml(data.hashtagLine)}">Salin Tag</button>
                        </div>`;
                    bindCopyButtons(resBox);
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 22. KALKULATOR WINRATE MLBB
        // ============================================================
        case 'gen_mlwr':
            body.innerHTML = `${header}
                <div class="input-group"><input id="mlMatch" type="number" class="v-input" value="250" placeholder="Total Pertandingan (Match)"></div>
                <div class="input-group"><input id="mlCur" type="number" step="0.1" class="v-input" value="54.5" placeholder="Win Rate Saat Ini (%)"></div>
                <div class="input-group"><input id="mlTar" type="number" step="0.1" class="v-input" value="60" placeholder="Target Win Rate (%)"></div>
                <button type="button" class="v-btn" id="mlBtn"><i class="fa-solid fa-trophy" aria-hidden="true"></i> Hitung Win Streak</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Hitung butuh berapa kemenangan beruntun untuk mencapai target WR MLBB.</div>`;
            document.getElementById('mlBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                try {
                    const data = await postJson('/api/tools/creator-kit', {
                        action: 'ml_winrate',
                        totalMatch: Number(document.getElementById('mlMatch').value || 0),
                        currentWr: Number(document.getElementById('mlCur').value || 0),
                        targetWr: Number(document.getElementById('mlTar').value || 0),
                    });
                    resBox.innerHTML = `<div style="font-weight:700;font-size:0.95rem;margin-bottom:10px;">${escapeHtml(data.message)}</div>
                        <div class="sholat-grid">
                            <div class="sholat-cell"><span>Total Menang</span><strong>${data.currentWins}</strong></div>
                            <div class="sholat-cell"><span>Total Kalah</span><strong>${data.currentLosses}</strong></div>
                            <div class="sholat-cell"><span>Jika Next Win</span><strong>${data.nextWinWr}%</strong></div>
                            <div class="sholat-cell"><span>Jika Next Lose</span><strong>${data.nextLoseWr}%</strong></div>
                        </div>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 23. CEK KHODAM VIRAL + KARTU PNG STORY
        // ============================================================
        case 'live_khodam': {
            bindCleanup();
            let rerollCount = 0;
            body.innerHTML = `${header}
                <div class="input-group"><input id="khName" class="v-input" placeholder="Masukkan nama lengkap atau panggilan..."></div>
                <div class="owner-action-row" style="margin-bottom:10px;">
                    <button type="button" class="v-btn" id="khBtn"><i class="fa-solid fa-ghost" aria-hidden="true"></i> Cek Khodam</button>
                    <button type="button" class="v-btn v-btn-secondary" id="khRerollBtn">Acak Ulang</button>
                </div>
                <div class="result-box" id="toolResult">Masukkan nama untuk melihat khodam dan mengunduh kartu PNG untuk Story.</div>`;
            const runKhodam = async (inc) => {
                const n = document.getElementById('khName').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!n) return toast('Masukkan nama terlebih dahulu');
                if (inc) rerollCount += 1;
                else rerollCount = 0;
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Membaca aura & membuat kartu PNG...';
                try {
                    const data = await postJson('/api/tools/live-hub', { action: 'khodam', name: n, reroll: rerollCount });
                    const { blob } = await postBlob('/api/tools/viral-maker', {
                        action: 'fun_card',
                        badge: `CEK KHODAM - ${data.rarity.toUpperCase()}`,
                        subtitle: `Pemilik Nama: ${data.name}`,
                        title: data.khodam,
                        stat1: `Elemen: ${data.element}`,
                        stat2: `Power: ${data.power}%`,
                        desc: data.description,
                    });
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Kartu Khodam" width="800" height="500" class="media-result-img">
                        <a href="${url}" download="khodam_${escapeHtml(n.replace(/\s+/g, '_'))}.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Kartu PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            document.getElementById('khBtn').onclick = () => runKhodam(false);
            document.getElementById('khRerollBtn').onclick = () => runKhodam(true);
            return true;
        }

        // ============================================================
        // 24. CEK JODOH, ZODIAK & WETON JAWA
        // ============================================================
        case 'live_jodoh':
            bindCleanup();
            body.innerHTML = `${header}
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <input id="jdN1" class="v-input" placeholder="Nama Kamu">
                    <input id="jdN2" class="v-input" placeholder="Nama Pasangan">
                </div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <input id="jdD1" type="date" class="v-input" title="Tanggal Lahir Kamu (Opsional untuk Weton)">
                    <input id="jdD2" type="date" class="v-input" title="Tanggal Lahir Pasangan (Opsional untuk Weton)">
                </div>
                <button type="button" class="v-btn" id="jdBtn"><i class="fa-solid fa-heart" aria-hidden="true"></i> Cek Kecocokan & Weton</button>
                <div class="result-box" id="toolResult">Isi nama (dan tanggal lahir opsional untuk hitungan Weton Jawa + Zodiak).</div>`;
            document.getElementById('jdBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Menghitung kecocokan & weton...';
                try {
                    const data = await postJson('/api/tools/live-hub', {
                        action: 'jodoh',
                        name1: document.getElementById('jdN1').value,
                        name2: document.getElementById('jdN2').value,
                        dob1: document.getElementById('jdD1').value,
                        dob2: document.getElementById('jdD2').value,
                    });
                    const wetonInfo = data.wetonSummary
                        ? `Neptu ${data.wetonSummary.totalNeptu}: ${data.wetonSummary.makna}`
                        : 'Tambahkan tanggal lahir untuk Weton Jawa';
                    const { blob } = await postBlob('/api/tools/viral-maker', {
                        action: 'fun_card',
                        badge: 'CEK JODOH & WETON',
                        subtitle: `${data.name1} & ${data.name2}`,
                        title: `Cocok ${data.score}%`,
                        stat1: data.person1 ? `${data.person1.weton} (${data.person1.zodiac})` : `Nama 1: ${data.name1}`,
                        stat2: data.person2 ? `${data.person2.weton} (${data.person2.zodiac})` : `Nama 2: ${data.name2}`,
                        desc: `${data.verdict} ${data.wetonSummary ? '| ' + wetonInfo : ''}`,
                    });
                    const url = trackUrl(blob);
                    resBox.innerHTML = `<img src="${url}" alt="Kartu Jodoh" width="800" height="500" class="media-result-img">
                        <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">${escapeHtml(wetonInfo)}</div>
                        <a href="${url}" download="kecocokan_jodoh.png" class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Kartu PNG</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 25. CARI INFO ANIME (ANILIST)
        // ============================================================
        case 'live_anime':
            body.innerHTML = `${header}
                <div class="input-group"><input id="aniQuery" class="v-input" placeholder="Judul anime (mis: Frieren, Solo Leveling, One Piece)"></div>
                <button type="button" class="v-btn" id="aniBtn"><i class="fa-solid fa-film" aria-hidden="true"></i> Cari Anime</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Cari skor, episode, genre & sinopsis anime langsung dari AniList.</div>`;
            document.getElementById('aniBtn').onclick = async () => {
                const query = document.getElementById('aniQuery').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!query) return toast('Masukkan judul anime');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mencari di AniList...';
                try {
                    const data = await postJson('/api/tools/live-hub', { action: 'anime_search', query });
                    if (!data.items.length) {
                        resBox.innerHTML = 'Anime tidak ditemukan.';
                        return;
                    }
                    resBox.innerHTML = data.items
                        .map(
                            (a) => `<div style="display:flex;gap:10px;padding:10px;border:1px solid var(--border-color);border-radius:12px;margin-bottom:8px;background:var(--surface-input);">
                                ${a.cover ? `<img src="${escapeHtml(a.cover)}" alt="${escapeHtml(a.title)}" width="84" height="120" style="width:84px;height:120px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : ''}
                                <div style="min-width:0;flex:1;">
                                    <div style="font-weight:700;font-size:0.92rem;">${escapeHtml(a.title)}</div>
                                    <div style="font-size:0.76rem;color:var(--text-muted);margin:3px 0;">Skor: <strong>${escapeHtml(a.score)}</strong> | Ep: ${escapeHtml(String(a.episodes))} | ${escapeHtml(String(a.year))} | ${escapeHtml(a.status)}</div>
                                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">${escapeHtml((a.genres || []).join(', '))}</div>
                                    <div style="font-size:0.78rem;line-height:1.45;">${escapeHtml(a.synopsis)}...</div>
                                </div>
                            </div>`
                        )
                        .join('');
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 26. RANDOM ANIME ART HD (SFW)
        // ============================================================
        case 'live_animeart':
            body.innerHTML = `${header}
                <div class="input-group">
                    <select id="aaCat" class="v-select">
                        <option value="waifu">Waifu (SFW)</option>
                        <option value="neko">Neko (SFW)</option>
                        <option value="kitsune">Kitsune (SFW)</option>
                        <option value="husbando">Husbando (SFW)</option>
                    </select>
                </div>
                <button type="button" class="v-btn" id="aaBtn"><i class="fa-solid fa-palette" aria-hidden="true"></i> Ambil Artwork Acak</button>
                <div class="result-box" id="toolResult">Klik tombol untuk mengambil artwork anime HD acak (SFW).</div>`;
            document.getElementById('aaBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengambil artwork anime...';
                try {
                    const data = await postJson('/api/tools/live-hub', {
                        action: 'anime_art',
                        category: document.getElementById('aaCat').value,
                    });
                    resBox.innerHTML = `<img src="${escapeHtml(data.imageUrl)}" alt="Anime Art" width="600" height="750" class="media-result-img" style="max-width:340px;">
                        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">Ilustrator: <strong>${escapeHtml(data.artist)}</strong></div>
                        <a href="${escapeHtml(data.downloadUrl)}" download class="v-btn" style="text-decoration:none;"><i class="fas fa-download" aria-hidden="true"></i> Unduh Gambar HD</a>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 27. INFO GEMPA BMKG INDONESIA LIVE
        // ============================================================
        case 'live_bmkg':
            body.innerHTML = `${header}
                <button type="button" class="v-btn" id="bmkgBtn"><i class="fa-solid fa-house-crack" aria-hidden="true"></i> Muat Data Gempa BMKG Terbaru</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Klik tombol di atas untuk mengambil pembaruan gempa resmi BMKG Indonesia secara real-time.</div>`;
            document.getElementById('bmkgBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengambil data BMKG live...';
                try {
                    const data = await postJson('/api/tools/live-hub', { action: 'bmkg' });
                    const l = data.latest;
                    const recHtml = (data.recent || [])
                        .map(
                            (r) => `<div style="padding:8px;border:1px solid var(--border-color);border-radius:10px;margin-bottom:6px;font-size:0.8rem;background:var(--surface-input);">
                                <strong>M ${escapeHtml(r.magnitude)}</strong> (${escapeHtml(r.kedalaman)}) - ${escapeHtml(r.wilayah)}<br>
                                <span style="color:var(--text-muted);">${escapeHtml(r.tanggal)}</span>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">Sumber: ${escapeHtml(data.source)}</div>
                        <div style="padding:12px;border:1px solid var(--border-color);border-radius:12px;margin-bottom:10px;background:var(--surface-input);">
                            <div style="font-size:1.1rem;font-weight:700;">Magnitudo ${escapeHtml(l.magnitude)} | Kedalaman ${escapeHtml(l.kedalaman)}</div>
                            <div style="margin:4px 0;"><strong>${escapeHtml(l.wilayah)}</strong></div>
                            <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(l.tanggal)} | Koordinat: ${escapeHtml(l.koordinat)}</div>
                            <div style="font-size:0.82rem;margin-top:6px;">Potensi: <strong>${escapeHtml(l.potensi)}</strong></div>
                            ${l.dirasakan && l.dirasakan !== '-' ? `<div style="font-size:0.8rem;margin-top:4px;">Dirasakan: ${escapeHtml(l.dirasakan)}</div>` : ''}
                        </div>
                        ${l.shakemapUrl ? `<img src="${escapeHtml(l.shakemapUrl)}" alt="Peta Guncangan BMKG" width="600" height="600" class="media-result-img" style="max-width:320px;">` : ''}
                        ${recHtml ? `<div style="font-weight:700;font-size:0.84rem;margin:10px 0 6px;">Gempa Terkini Lainnya (M >= 5.0)</div>${recHtml}` : ''}`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 28. PRAKIRAAN CUACA KOTA INDONESIA
        // ============================================================
        case 'live_weather':
            body.innerHTML = `${header}
                <div class="input-group"><input id="wthCity" class="v-input" value="Jakarta" placeholder="Nama kota (Jakarta, Bandung, Surabaya, Medan, Bali)"></div>
                <button type="button" class="v-btn" id="wthBtn"><i class="fa-solid fa-cloud-sun" aria-hidden="true"></i> Cek Cuaca</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Cek kondisi cuaca real-time dan prakiraan 4 hari ke depan.</div>`;
            document.getElementById('wthBtn').onclick = async () => {
                const city = document.getElementById('wthCity').value.trim();
                const resBox = document.getElementById('toolResult');
                if (!city) return toast('Masukkan nama kota');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengambil prakiraan cuaca...';
                try {
                    const data = await postJson('/api/tools/live-hub', { action: 'weather', city });
                    const c = data.current;
                    const days = (data.daily || [])
                        .map(
                            (d) => `<div class="sholat-cell">
                                <span>${escapeHtml(d.date)} (${escapeHtml(d.condition)})</span>
                                <strong>${d.min}-${d.max}C (${d.rainProb}%)</strong>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div style="font-weight:700;font-size:1rem;margin-bottom:6px;">${escapeHtml(data.location)}</div>
                        <div class="sholat-grid" style="margin-bottom:10px;">
                            <div class="sholat-cell"><span>Suhu</span><strong>${c.tempC} C</strong></div>
                            <div class="sholat-cell"><span>Terasa</span><strong>${c.feelsLikeC} C</strong></div>
                            <div class="sholat-cell"><span>Kelembaban</span><strong>${c.humidity}%</strong></div>
                            <div class="sholat-cell"><span>Angin</span><strong>${c.windKmh} km/j</strong></div>
                        </div>
                        <div style="font-size:0.84rem;margin-bottom:10px;">Kondisi saat ini: <strong>${escapeHtml(c.condition)}</strong></div>
                        <div style="display:flex;flex-direction:column;gap:6px;">${days}</div>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 29. JADWAL SHOLAT KEMENAG RI & AL-QURAN DIGITAL
        // ============================================================
        case 'live_islami':
            body.innerHTML = `${header}
                <div class="input-group" style="display:grid;grid-template-columns:1fr auto;gap:8px;">
                    <input id="islCity" class="v-input" value="Jakarta" placeholder="Kota (Jakarta, Bandung, Yogyakarta, Surabaya)">
                    <button type="button" class="v-btn" id="islSholatBtn">Jadwal Sholat</button>
                </div>
                <div class="input-group" style="display:grid;grid-template-columns:1fr auto;gap:8px;">
                    <select id="islSurah" class="v-select">
                        <option value="1">1. Al-Fatihah</option>
                        <option value="36">36. Yasin</option>
                        <option value="55">55. Ar-Rahman</option>
                        <option value="56">56. Al-Waqiah</option>
                        <option value="67">67. Al-Mulk</option>
                        <option value="18">18. Al-Kahfi</option>
                        <option value="112">112. Al-Ikhlas</option>
                        <option value="113">113. Al-Falaq</option>
                        <option value="114">114. An-Nas</option>
                    </select>
                    <button type="button" class="v-btn v-btn-secondary" id="islQuranBtn">Baca Surah</button>
                </div>
                <div class="result-box" id="toolResult" style="text-align:left;">Pilih Jadwal Sholat Kemenag RI atau Baca Surah Al-Quran lengkap dengan audio murottal.</div>`;
            document.getElementById('islSholatBtn').onclick = async () => {
                const city = document.getElementById('islCity').value.trim();
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Memuat jadwal sholat Kemenag RI...';
                try {
                    const data = await postJson('/api/tools/live-hub', { action: 'sholat', city });
                    const j = data.jadwal || {};
                    const pairs = [
                        ['Imsak', j.imsak], ['Subuh', j.subuh], ['Terbit', j.terbit], ['Dhuha', j.dhuha],
                        ['Dzuhur', j.dzuhur], ['Ashar', j.ashar], ['Maghrib', j.maghrib], ['Isya', j.isya],
                    ];
                    resBox.innerHTML = `<div style="font-weight:700;margin-bottom:4px;">${escapeHtml(data.lokasi)} (${escapeHtml(data.daerah)})</div>
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">${escapeHtml(j.tanggal || 'Hari ini')}</div>
                        <div class="sholat-grid">${pairs.map(([k, v]) => `<div class="sholat-cell"><span>${k}</span><strong>${escapeHtml(v || '-')}</strong></div>`).join('')}</div>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            document.getElementById('islQuranBtn').onclick = async () => {
                const surah = Number(document.getElementById('islSurah').value || 1);
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Memuat ayat & audio surah...';
                try {
                    const data = await postJson('/api/tools/live-hub', { action: 'quran', surah });
                    const ayatHtml = (data.ayat || [])
                        .map(
                            (a) => `<div class="quran-ayat">
                                <div class="quran-arab">${escapeHtml(a.arab)}</div>
                                <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">${a.nomor}. ${escapeHtml(a.latin)}</div>
                                <div style="font-size:0.84rem;">${escapeHtml(a.arti)}</div>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div style="font-weight:700;font-size:1rem;margin-bottom:4px;">${escapeHtml(data.namaLatin)} (${escapeHtml(data.nama)}) - ${escapeHtml(data.arti)}</div>
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">${data.jumlahAyat} Ayat | ${escapeHtml(data.tempatTurun)}</div>
                        ${data.audioFull ? `<audio controls src="${escapeHtml(data.audioFull)}" style="width:100%;margin-bottom:10px;"></audio>` : ''}
                        <div style="max-height:300px;overflow:auto;">${ayatHtml}</div>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        // ============================================================
        // 30. HARGA KRIPTO & KURS MATA UANG LIVE
        // ============================================================
        case 'live_crypto':
            body.innerHTML = `${header}
                <div class="input-group" style="display:grid;grid-template-columns:1fr 90px 90px;gap:8px;">
                    <input id="crAmt" type="number" class="v-input" value="100" placeholder="Jumlah">
                    <select id="crFrom" class="v-select">
                        <option value="USD">USD</option><option value="IDR">IDR</option><option value="SGD">SGD</option><option value="MYR">MYR</option><option value="JPY">JPY</option><option value="EUR">EUR</option>
                    </select>
                    <select id="crTo" class="v-select">
                        <option value="IDR">IDR</option><option value="USD">USD</option><option value="SGD">SGD</option><option value="MYR">MYR</option><option value="JPY">JPY</option><option value="EUR">EUR</option>
                    </select>
                </div>
                <button type="button" class="v-btn" id="crBtn"><i class="fa-solid fa-coins" aria-hidden="true"></i> Cek Harga Kripto & Kurs</button>
                <div class="result-box" id="toolResult" style="text-align:left;">Pantau harga BTC, ETH, SOL, USDT, TON & konversi kurs IDR secara langsung.</div>`;
            document.getElementById('crBtn').onclick = async () => {
                const resBox = document.getElementById('toolResult');
                resBox.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengambil harga pasar live...';
                try {
                    const data = await postJson('/api/tools/live-hub', {
                        action: 'crypto',
                        amount: Number(document.getElementById('crAmt').value || 1),
                        from: document.getElementById('crFrom').value,
                        to: document.getElementById('crTo').value,
                    });
                    const fx = data.fx;
                    const coinsHtml = (data.coins || [])
                        .map(
                            (c) => `<div class="sholat-cell">
                                <span><strong>${escapeHtml(c.symbol)}</strong> (${c.change24h >= 0 ? '+' : ''}${c.change24h}%)</span>
                                <strong>${escapeHtml(fmtRp(c.idr))}</strong>
                            </div>`
                        )
                        .join('');
                    resBox.innerHTML = `<div style="padding:10px;border-radius:12px;background:var(--surface-input);border:1px solid var(--border-color);margin-bottom:10px;">
                            <div style="font-size:0.78rem;color:var(--text-muted);">Hasil Konversi Kurs Live</div>
                            <div style="font-size:1.1rem;font-weight:700;">${fx.amount.toLocaleString('id-ID')} ${escapeHtml(fx.from)} = ${fx.converted.toLocaleString('id-ID')} ${escapeHtml(fx.to)}</div>
                        </div>
                        <div style="font-weight:700;font-size:0.84rem;margin-bottom:6px;">Harga Kripto Live (IDR)</div>
                        <div style="display:flex;flex-direction:column;gap:6px;">${coinsHtml || '<div>Data kripto sedang limit, coba lagi 1 menit.</div>'}</div>`;
                } catch (err) {
                    resBox.innerHTML = `<span style="color:var(--status-error);">${escapeHtml(err.message)}</span>`;
                }
            };
            return true;

        default:
            return false;
    }
}
