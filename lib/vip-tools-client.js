export function initVipTools(deps = {}) {
    if (typeof window === 'undefined') return () => {};
    if (typeof window.__vipToolsCleanup === 'function') {
        try {
            window.__vipToolsCleanup();
        } catch {}
    }
    window.__vipToolsInitialized = true;

    let disposed = false;
    const cleanupFns = [];
    const activeTimers = new Set();
    let warningBannerTimer = null;
    let toastTimer = null;
    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;

    function scheduleTimeout(fn, ms) {
        const id = setTimeout(() => {
            activeTimers.delete(id);
            if (disposed) return;
            fn();
        }, ms);
        activeTimers.add(id);
        return id;
    }

    function clearTrackedTimeout(id) {
        if (id === null || id === undefined) return;
        clearTimeout(id);
        activeTimers.delete(id);
    }

    function bindListener(target, event, handler, options) {
        if (!target || typeof target.addEventListener !== 'function') return;
        target.addEventListener(event, handler, options);
        cleanupFns.push(() => {
            if (typeof target.removeEventListener === 'function') {
                target.removeEventListener(event, handler, options);
            }
        });
    }

    const hasBackend = Boolean(
        typeof fetch === 'function' &&
        window.location &&
        /^https?:/i.test(window.location.protocol)
    );

    const VALID_THEMES = ['hitam', 'abu', 'putih'];
    const LEGACY_THEME_MAP = { biru: 'hitam', merah: 'hitam', silver: 'abu' };
    const THEME_LABELS = { hitam: 'Hitam', abu: 'Abu', putih: 'Putih' };
    const THEME_VIDEOS = {
        hitam: 'https://c.termai.cc/v131/H4vF9D.mp4',
        abu: 'https://c.termai.cc/v131/WpSg.mp4',
        putih: 'https://c.termai.cc/v131/WpSg.mp4'
    };

    function normalizeTheme(theme) {
        const key = String(theme || '').toLowerCase();
        if (VALID_THEMES.includes(key)) return key;
        if (LEGACY_THEME_MAP[key]) return LEGACY_THEME_MAP[key];
        return 'hitam';
    }

    const PAGE_META = {
        homePage: {
            title: 'Beranda MattzLM',
            sub: 'Info akun aktif dan daftar tool yang paling sering dipakai.'
        },
        toolsPage: {
            title: 'Katalog Tools',
            sub: 'Filter menurut kategori atau tekan Ctrl+K / ⌘K untuk langsung mencari.'
        },
        profilePage: {
            title: 'Profil & Pengaturan',
            sub: 'Ganti foto profil, username, password, dan tema tampilan.'
        },
        chatPage: {
            title: 'Chat Admin',
            sub: 'Kirim pesan langsung ke admin; riwayat tersimpan di server.'
        }
    };

    let motionRafId = null;
    let lastFocusedBeforeModal = null;
    let lastFocusedBeforePreview = null;
    let activeToolCleanup = null;

    // Server-backed runtime state
    let currentUserObj = null;
    let vpsCustomTools = null;
    let vpsHiddenTools = null;
    let vpsFirebaseReady = false;
    let serverChatMessages = null;
    let serverChatLimit = 5;

    function isMotionPaused() {
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        return reduced || localStorage.getItem('vip_motion_paused') === '1';
    }

    function syncMotionUI() {
        const paused = isMotionPaused();
        document.body.classList.toggle('motion-paused', paused);

        const btn = document.getElementById('motionToggleBtn');
        const label = document.getElementById('motionToggleLabel');
        if (btn) {
            btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
            btn.setAttribute('aria-label', paused ? 'Jalankan animasi latar' : 'Jeda animasi latar');
        }
        if (label) {
            label.textContent = paused ? 'Jeda' : 'Gerak';
        }

        const bgVideo = document.getElementById('bgVideo');
        const homeVideo = document.getElementById('homeVideo');
        if (paused) {
            if (motionRafId !== null) {
                cancelAnimationFrame(motionRafId);
                motionRafId = null;
            }
            if (bgVideo && !bgVideo.paused) bgVideo.pause();
            if (homeVideo && !homeVideo.paused) homeVideo.pause();
            syncVisorVideoUI(true);
        } else {
            if (bgVideo && bgVideo.paused) bgVideo.play().catch(() => {});
            if (homeVideo && homeVideo.paused && localStorage.getItem('vip_visor_paused') !== '1') {
                homeVideo.play().catch(() => {});
                syncVisorVideoUI(false);
            }
            if (motionRafId === null) startParticlesLoop();
        }
    }

    function toggleMotion() {
        const next = localStorage.getItem('vip_motion_paused') === '1' ? '0' : '1';
        localStorage.setItem('vip_motion_paused', next);
        syncMotionUI();
        toast(next === '1' ? 'Animasi latar dijeda.' : 'Animasi latar diaktifkan.');
    }

    function syncVisorVideoUI(paused) {
        const btn = document.getElementById('visorVideoToggleBtn');
        const label = document.getElementById('visorVideoToggleLabel');
        if (!btn) return;
        const icon = btn.querySelector('i');
        btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        if (icon) {
            icon.className = paused ? 'fas fa-play' : 'fas fa-pause';
        }
        if (label) {
            label.textContent = paused ? 'Putar' : 'Jeda';
        }
    }

    function toggleHomeVideo() {
        const homeVideo = document.getElementById('homeVideo');
        if (!homeVideo) return;
        if (homeVideo.paused) {
            localStorage.setItem('vip_visor_paused', '0');
            homeVideo.play().catch(() => {});
            syncVisorVideoUI(false);
        } else {
            localStorage.setItem('vip_visor_paused', '1');
            homeVideo.pause();
            syncVisorVideoUI(true);
        }
    }

    function applyTheme(theme) {
        const safeTheme = normalizeTheme(theme);
        document.documentElement.setAttribute('data-theme', safeTheme);

        const overlay = document.getElementById('bgOverlay');
        if (overlay) overlay.style.background = '';

        const videoUrl = THEME_VIDEOS[safeTheme] || THEME_VIDEOS.hitam;
        updateBackgroundVideo(videoUrl);
        updateHomeVideoSrc(videoUrl);

        localStorage.setItem('vip_theme', safeTheme);
        localStorage.setItem('vip_special_mode', safeTheme === 'hitam' ? '0' : '1');

        const toggleBtn = document.getElementById('themeToggleBtn');
        const toggleLabel = document.getElementById('themeToggleLabel');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-pressed', safeTheme !== 'hitam' ? 'true' : 'false');
            toggleBtn.setAttribute('aria-label', `Palet aktif: ${THEME_LABELS[safeTheme]}. Klik untuk ganti antara Hitam, Abu, dan Putih`);
        }
        if (toggleLabel) {
            toggleLabel.textContent = THEME_LABELS[safeTheme];
        }
        document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
            const active = btn.getAttribute('data-theme-btn') === safeTheme;
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function getTheme() {
        const saved = localStorage.getItem('vip_theme');
        return normalizeTheme(saved);
    }

    function updateBackgroundVideo(url) {
        const video = document.getElementById('bgVideo');
        if (video) {
            const source = video.querySelector('source');
            if (source && source.src !== url) {
                source.src = url;
                video.load();
            }
            if (!isMotionPaused()) {
                video.play().catch(() => {});
            }
        }
        localStorage.setItem('vip_bg_video', url);
    }

    function applyHomeVideoRotation(deg) {
        const homeVideo = document.getElementById('homeVideo');
        if (homeVideo) {
            homeVideo.style.transform = deg ? `rotate(${deg}deg)` : '';
        }
        localStorage.setItem('vip_home_rotate', String(deg));
    }

    function getHomeVideoRotation() {
        return parseInt(localStorage.getItem('vip_home_rotate') || '0', 10);
    }

    function updateHomeVideoSrc(url) {
        const homeVideo = document.getElementById('homeVideo');
        if (homeVideo) {
            const source = homeVideo.querySelector('source');
            if (source && source.src !== url) {
                source.src = url;
                homeVideo.load();
            }
            if (!isMotionPaused() && localStorage.getItem('vip_visor_paused') !== '1') {
                homeVideo.play().catch(() => {});
                syncVisorVideoUI(false);
            } else {
                homeVideo.pause();
                syncVisorVideoUI(true);
            }
        }
        localStorage.setItem('vip_home_video_src', url);
    }

    // ============ MUSIK ============
    const musicUrls = [
        'https://c.termai.cc/v139/dhV3.mp4',
        'https://c.termai.cc/v131/H4vF9D.mp4'
    ];
    let currentMusicIndex = 0;

    function toggleMusic() {
        const audio = document.getElementById('bgMusic');
        const btn = document.getElementById('musicToggleBtn');
        const viz = document.getElementById('musicVisualizer');
        const label = document.getElementById('musicToggleLabel');
        if (!audio || !btn || !viz) return;

        const icon = btn.querySelector('i');
        if (audio.paused) {
            audio.play().catch(() => toast('Gagal memutar musik, coba klik lagi.'));
            if (icon) icon.className = 'fas fa-stop';
            if (label) label.textContent = 'Stop';
            btn.setAttribute('aria-pressed', 'true');
            viz.classList.add('active');
        } else {
            audio.pause();
            audio.currentTime = 0;
            if (icon) icon.className = 'fas fa-music';
            if (label) label.textContent = 'Musik';
            btn.setAttribute('aria-pressed', 'false');
            viz.classList.remove('active');
        }
    }

    function changeMusic() {
        const audio = document.getElementById('bgMusic');
        if (!audio) return;
        const wasPlaying = !audio.paused;
        currentMusicIndex = (currentMusicIndex + 1) % musicUrls.length;
        audio.src = musicUrls[currentMusicIndex];
        audio.load();
        if (wasPlaying) {
            audio.play().catch(() => {});
        }
        toast('Trek musik diganti ke #' + (currentMusicIndex + 1));
    }

    function toggleSpecialTheme() {
        const current = getTheme();
        const nextIdx = (VALID_THEMES.indexOf(current) + 1) % VALID_THEMES.length;
        const next = VALID_THEMES[nextIdx];
        applyTheme(next);
        toast(`Palet tema ${THEME_LABELS[next]} diaktifkan.`);
    }

    // ============ VPS PUBLIC CONFIG SYNC ============
    async function syncPublicConfig(countVisit = false) {
        if (!hasBackend || disposed) return;
        try {
            const fetchOpts = { cache: 'no-store' };
            if (abortController) fetchOpts.signal = abortController.signal;
            const res = await fetch(`/api/config/public${countVisit ? '?visit=1' : ''}`, fetchOpts);
            if (!res.ok || disposed) return;
            const data = await res.json();
            if (!data.ok || disposed) return;

            vpsFirebaseReady = Boolean(data.firebaseReady);
            const fbPill = document.getElementById('googleAuthStatus');
            if (fbPill) {
                fbPill.textContent = vpsFirebaseReady ? 'Aktif' : 'Setup /owner';
            }

            if (Array.isArray(data.customTools)) {
                vpsCustomTools = data.customTools;
                saveTelegramTools(data.customTools);
            }
            if (Array.isArray(data.hiddenTools)) {
                vpsHiddenTools = data.hiddenTools;
                localStorage.setItem('vip_hidden_tools', JSON.stringify(data.hiddenTools));
            }
            if (data.settings) {
                if (data.settings.announcement) {
                    const bannerText = document.getElementById('warningBannerText');
                    if (bannerText) bannerText.textContent = data.settings.announcement;
                }
                if (data.settings.bgVideoUrl) {
                    updateBackgroundVideo(data.settings.bgVideoUrl);
                    updateHomeVideoSrc(data.settings.bgVideoUrl);
                }
                if (data.settings.homeRotate !== undefined) {
                    applyHomeVideoRotation(Number(data.settings.homeRotate) || 0);
                }
                if (!localStorage.getItem('vip_theme') && data.settings.defaultTheme) {
                    applyTheme(data.settings.defaultTheme);
                }
            }

            loadTelegramTools();
            updateCategoryCounts();
            const popular = getFilteredTools().slice(0, 5);
            renderGrid('popularGrid', popular, false, { allowFeatured: true, headingTag: 'h3' });
            const activeCat = document.querySelector('.category-tab.active')?.dataset?.category || 'all';
            const q = document.getElementById('searchInput')?.value || '';
            renderCategory(activeCat, q);
        } catch {
            // fallback to local cache
        }
    }

    function startAppOnMount() {
        const savedTheme = getTheme();
        applyTheme(savedTheme);
        const savedHomeVideo = localStorage.getItem('vip_home_video_src');
        if (savedHomeVideo) updateHomeVideoSrc(savedHomeVideo);
        applyHomeVideoRotation(getHomeVideoRotation());
        syncMotionUI();

        if (hasBackend) {
            syncPublicConfig(true);
        }

        const alreadyBooted = Boolean(window.__vipToolsBootedOnce);
        window.__vipToolsBootedOnce = true;

        const hideLoader = () => {
            if (disposed) return;
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hide');
        };

        if (alreadyBooted) {
            if (!hasBackend) {
                checkAuth();
                hideLoader();
            } else {
                const safetyTimer = scheduleTimeout(hideLoader, 2500);
                checkAuth().finally(() => {
                    clearTrackedTimeout(safetyTimer);
                    hideLoader();
                });
            }
            return;
        }

        if (!hasBackend) {
            scheduleTimeout(() => {
                hideLoader();
                checkAuth();
            }, 700);
            return;
        }

        let authDone = false;
        let minDelayDone = false;
        const maybeReveal = () => {
            if (authDone && minDelayDone) hideLoader();
        };
        const safetyTimer = scheduleTimeout(hideLoader, 3000);
        scheduleTimeout(() => {
            minDelayDone = true;
            maybeReveal();
        }, 700);
        checkAuth().finally(() => {
            authDone = true;
            clearTrackedTimeout(safetyTimer);
            maybeReveal();
        });
    }

    function toast(msg) {
        if (disposed) return;
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTrackedTimeout(toastTimer);
        toastTimer = scheduleTimeout(() => t.classList.remove('show'), 3200);
    }

    // ============ LOCAL AUTH FALLBACK (offline/unit-test) ============
    function getUsers() {
        let users = {};
        try {
            users = JSON.parse(localStorage.getItem('vip_users') || '{}');
        } catch {
            users = {};
        }
        if (!users['matt']) {
            users['matt'] = { password: btoa('123mamat@#'), role: 'owner' };
            saveUsers(users);
        } else if (users['matt'].role !== 'owner') {
            users['matt'].role = 'owner';
            saveUsers(users);
        }
        return users;
    }

    function saveUsers(u) {
        localStorage.setItem('vip_users', JSON.stringify(u));
    }

    function clearAuthErrors() {
        const loginErr = document.getElementById('loginError');
        const regErr = document.getElementById('regError');
        if (loginErr) loginErr.textContent = '';
        if (regErr) regErr.textContent = '';
        ['loginUserGroup', 'loginPassGroup', 'regUserGroup', 'regPassGroup', 'regPass2Group'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.removeAttribute('data-invalid');
        });
        ['loginUser', 'loginPass', 'regUser', 'regPass', 'regPass2'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.removeAttribute('aria-invalid');
        });
    }

    function switchAuthMode(mode) {
        clearAuthErrors();
        const tabLogin = document.getElementById('tabLoginBtn');
        const tabReg = document.getElementById('tabRegisterBtn');
        const loginView = document.getElementById('loginView');
        const registerView = document.getElementById('registerView');

        if (mode === 'login') {
            tabLogin?.classList.add('active');
            tabLogin?.setAttribute('aria-selected', 'true');
            tabReg?.classList.remove('active');
            tabReg?.setAttribute('aria-selected', 'false');
            if (loginView) loginView.hidden = false;
            if (registerView) registerView.hidden = true;
        } else {
            tabReg?.classList.add('active');
            tabReg?.setAttribute('aria-selected', 'true');
            tabLogin?.classList.remove('active');
            tabLogin?.setAttribute('aria-selected', 'false');
            if (loginView) loginView.hidden = true;
            if (registerView) registerView.hidden = false;
        }
    }

    function doRegister() {
        clearAuthErrors();
        const uEl = document.getElementById('regUser');
        const pEl = document.getElementById('regPass');
        const p2El = document.getElementById('regPass2');
        const errEl = document.getElementById('regError');

        const u = uEl ? uEl.value.trim() : '';
        const p = pEl ? pEl.value : '';
        const p2 = p2El ? p2El.value : '';

        if (!u) {
            document.getElementById('regUserGroup')?.setAttribute('data-invalid', 'true');
            uEl?.setAttribute('aria-invalid', 'true');
            if (errEl) errEl.textContent = 'Username wajib diisi.';
            uEl?.focus();
            return;
        }
        if (p.length < 4) {
            document.getElementById('regPassGroup')?.setAttribute('data-invalid', 'true');
            pEl?.setAttribute('aria-invalid', 'true');
            if (errEl) errEl.textContent = 'Password minimal 4 karakter.';
            pEl?.focus();
            return;
        }
        if (p !== p2) {
            document.getElementById('regPass2Group')?.setAttribute('data-invalid', 'true');
            p2El?.setAttribute('aria-invalid', 'true');
            if (errEl) errEl.textContent = 'Konfirmasi password tidak cocok.';
            p2El?.focus();
            return;
        }

        if (hasBackend) {
            const btn = document.getElementById('regSubmitBtn');
            if (btn) btn.disabled = true;
            fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            })
                .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                .then(({ ok, data }) => {
                    if (disposed) return;
                    if (!ok || !data.ok) {
                        document.getElementById('regUserGroup')?.setAttribute('data-invalid', 'true');
                        uEl?.setAttribute('aria-invalid', 'true');
                        if (errEl) errEl.textContent = data.error || 'Gagal membuat akun.';
                        uEl?.focus();
                        return;
                    }
                    toast('Akun berhasil dibuat di VPS. Silakan masuk.');
                    switchAuthMode('login');
                    const loginUser = document.getElementById('loginUser');
                    if (loginUser) loginUser.value = u;
                    document.getElementById('loginPass')?.focus();
                })
                .catch((err) => {
                    if (disposed) return;
                    if (errEl) errEl.textContent = 'Gagal terhubung ke VPS: ' + err.message;
                })
                .finally(() => {
                    if (btn && !disposed) btn.disabled = false;
                });
            return;
        }

        const users = getUsers();
        if (users[u]) {
            document.getElementById('regUserGroup')?.setAttribute('data-invalid', 'true');
            uEl?.setAttribute('aria-invalid', 'true');
            if (errEl) errEl.textContent = `Username "${u}" sudah terdaftar.`;
            uEl?.focus();
            return;
        }

        users[u] = { password: btoa(p), role: 'member' };
        saveUsers(users);
        toast('Akun berhasil dibuat. Silakan masuk.');
        switchAuthMode('login');
        const loginUser = document.getElementById('loginUser');
        if (loginUser) loginUser.value = u;
        document.getElementById('loginPass')?.focus();
    }

    function doLogin() {
        clearAuthErrors();
        const uEl = document.getElementById('loginUser');
        const pEl = document.getElementById('loginPass');
        const errEl = document.getElementById('loginError');

        const u = uEl ? uEl.value.trim() : '';
        const p = pEl ? pEl.value : '';

        if (!u || !p) {
            if (!u) {
                document.getElementById('loginUserGroup')?.setAttribute('data-invalid', 'true');
                uEl?.setAttribute('aria-invalid', 'true');
            }
            if (!p) {
                document.getElementById('loginPassGroup')?.setAttribute('data-invalid', 'true');
                pEl?.setAttribute('aria-invalid', 'true');
            }
            if (errEl) errEl.textContent = 'Isi username dan password terlebih dahulu.';
            (!u ? uEl : pEl)?.focus();
            return;
        }

        if (hasBackend) {
            const btn = document.getElementById('loginSubmitBtn');
            if (btn) btn.disabled = true;
            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            })
                .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                .then(({ ok, data }) => {
                    if (disposed) return;
                    if (!ok || !data.ok || !data.user) {
                        document.getElementById('loginUserGroup')?.setAttribute('data-invalid', 'true');
                        document.getElementById('loginPassGroup')?.setAttribute('data-invalid', 'true');
                        uEl?.setAttribute('aria-invalid', 'true');
                        pEl?.setAttribute('aria-invalid', 'true');
                        if (errEl) errEl.textContent = data.error || 'Username atau password salah.';
                        pEl?.focus();
                        return;
                    }
                    currentUserObj = data.user;
                    localStorage.setItem('vip_session', data.user.username);
                    enterApp(data.user.username, data.user);
                    toast(`Selamat datang, ${data.user.username}.`);
                })
                .catch((err) => {
                    if (disposed) return;
                    if (errEl) errEl.textContent = 'Gagal terhubung ke VPS: ' + err.message;
                })
                .finally(() => {
                    if (btn && !disposed) btn.disabled = false;
                });
            return;
        }

        const users = getUsers();
        if (!users[u] || users[u].password !== btoa(p)) {
            document.getElementById('loginUserGroup')?.setAttribute('data-invalid', 'true');
            document.getElementById('loginPassGroup')?.setAttribute('data-invalid', 'true');
            uEl?.setAttribute('aria-invalid', 'true');
            pEl?.setAttribute('aria-invalid', 'true');
            if (errEl) errEl.textContent = 'Username atau password salah. Periksa kembali input Anda.';
            pEl?.focus();
            return;
        }

        currentUserObj = { username: u, role: users[u].role || 'member', provider: 'local' };
        localStorage.setItem('vip_session', u);
        enterApp(u, currentUserObj);
    }

    async function doGoogleLogin() {
        clearAuthErrors();
        const errEl = document.getElementById('loginError');
        const btn = document.getElementById('googleLoginBtn');
        const label = document.getElementById('googleLoginLabel');

        if (typeof deps.signInWithGoogleFirebase !== 'function') {
            const msg = 'Modul Firebase Google Auth tidak tersedia di lingkungan ini.';
            if (errEl) errEl.textContent = msg;
            toast(msg);
            return;
        }

        if (btn) btn.disabled = true;
        if (label) label.textContent = 'Menghubungkan ke Google Firebase...';
        try {
            const user = await deps.signInWithGoogleFirebase();
            if (disposed) return;
            currentUserObj = user;
            localStorage.setItem('vip_session', user.username);
            enterApp(user.username, user);
            toast(`Berhasil masuk dengan Google (${user.email || user.username}).`);
        } catch (err) {
            if (disposed) return;
            const msg = err instanceof Error ? err.message : 'Login Google gagal.';
            if (errEl) errEl.textContent = msg;
            toast(msg);
        } finally {
            if (btn && !disposed) btn.disabled = false;
            if (label && !disposed) label.textContent = 'Masuk dengan Google (Firebase)';
        }
    }

    function syncSkipLink(isAuthenticated) {
        const skipLink = document.getElementById('skipLink');
        if (skipLink) {
            skipLink.setAttribute('href', isAuthenticated ? '#mainContent' : '#authPage');
        }
    }

    function syncOwnerVisibility(role) {
        const isOwner = role === 'owner';
        ['ownerRailLink', 'ownerHeaderBtn', 'ownerMobileLink', 'ownerPanel'].forEach((elId) => {
            const el = document.getElementById(elId);
            if (el) el.hidden = !isOwner;
        });
    }

    function doLogout() {
        currentUserObj = null;
        localStorage.removeItem('vip_session');
        syncOwnerVisibility('member');

        if (hasBackend) {
            fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        }
        if (typeof deps.signOutFirebaseQuietly === 'function') {
            deps.signOutFirebaseQuietly();
        }

        toast('Sesi berakhir. Anda telah keluar.');
        const appWrap = document.getElementById('appWrap');
        const authPage = document.getElementById('authPage');
        if (appWrap) appWrap.hidden = true;
        if (authPage) authPage.hidden = false;
        syncSkipLink(false);
        document.getElementById('loginUser')?.focus();
    }

    // ============ FOTO PROFIL ============
    function loadAvatarPhoto(username, serverPhotoUrl = '') {
        const photo = serverPhotoUrl || currentUserObj?.photoUrl || localStorage.getItem('vip_avatar_' + username);
        const avatarImg = document.getElementById('profAvatarImg');
        const placeholder = document.getElementById('profAvatarPlaceholder');
        const logoIcon = document.getElementById('logoIcon');

        if (photo) {
            if (avatarImg) {
                avatarImg.style.display = 'block';
                avatarImg.src = photo;
            }
            if (placeholder) placeholder.style.display = 'none';
            if (logoIcon) {
                logoIcon.innerHTML = `<img src="${escapeHtml(photo)}" width="42" height="42" alt="Avatar ${escapeHtml(username)}">`;
                logoIcon.style.background = 'none';
            }
        } else {
            if (avatarImg) avatarImg.style.display = 'none';
            if (placeholder) {
                placeholder.style.display = 'inline';
                placeholder.textContent = username ? username.charAt(0).toUpperCase() : 'M';
            }
            if (logoIcon) {
                logoIcon.innerHTML = '<span class="brand-monogram">MLM</span>';
                logoIcon.style.background = '';
            }
        }
    }

    function saveAvatarPhoto(file) {
        const session = localStorage.getItem('vip_session');
        if (!session) return;
        if (!file.type.startsWith('image/')) return toast('File harus berupa gambar.');
        if (file.size > 2 * 1024 * 1024) return toast('Ukuran foto maksimal 2MB.');
        const reader = new FileReader();
        reader.onload = (e) => {
            if (disposed) return;
            const dataUrl = String(e.target.result || '');
            localStorage.setItem('vip_avatar_' + session, dataUrl);
            if (currentUserObj) currentUserObj.photoUrl = dataUrl;
            loadAvatarPhoto(session, dataUrl);
            if (hasBackend) {
                fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'updateAvatar', photoUrl: dataUrl })
                }).catch(() => {});
            }
            toast('Foto profil berhasil diubah.');
        };
        reader.readAsDataURL(file);
    }

    (function initAvatarDragDrop() {
        const container = document.getElementById('profAvatarContainer');
        const fileInput = document.getElementById('avatarFileInput');
        if (!container || !fileInput) return;

        bindListener(container, 'click', () => fileInput.click());
        bindListener(fileInput, 'change', () => {
            if (fileInput.files && fileInput.files[0]) saveAvatarPhoto(fileInput.files[0]);
        });
        bindListener(container, 'dragover', (e) => {
            e.preventDefault();
            container.style.borderColor = 'var(--theme-primary)';
        });
        bindListener(container, 'dragleave', () => {
            container.style.borderColor = '';
        });
        bindListener(container, 'drop', (e) => {
            e.preventDefault();
            container.style.borderColor = '';
            if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
                saveAvatarPhoto(e.dataTransfer.files[0]);
            }
        });
    })();

    // ============ GANTI USERNAME & PASSWORD ============
    function changeUsername() {
        const input = document.getElementById('newUsernameInput');
        const newUsername = input ? input.value.trim() : '';
        const session = localStorage.getItem('vip_session');
        if (!session) return;
        if (session === 'matt') return toast('Username owner utama tidak bisa diganti.');
        if (!newUsername) return toast('Isi username baru.');
        if (newUsername === session) return toast('Username baru sama dengan yang lama.');

        if (hasBackend) {
            fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'changeUsername', newUsername })
            })
                .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                .then(({ ok, data }) => {
                    if (disposed) return;
                    if (!ok || !data.ok) return toast(data.error || 'Gagal mengganti username.');
                    currentUserObj = data.user;
                    localStorage.setItem('vip_session', data.user.username);
                    if (input) input.value = '';
                    toast('Username berhasil diubah.');
                    enterApp(data.user.username, data.user);
                })
                .catch((err) => {
                    if (!disposed) toast('Error: ' + err.message);
                });
            return;
        }

        const users = getUsers();
        if (users[newUsername]) return toast('Username sudah dipakai.');

        users[newUsername] = users[session];
        delete users[session];
        saveUsers(users);

        const avatar = localStorage.getItem('vip_avatar_' + session);
        if (avatar) {
            localStorage.setItem('vip_avatar_' + newUsername, avatar);
            localStorage.removeItem('vip_avatar_' + session);
        }

        localStorage.setItem('vip_session', newUsername);
        toast('Username berhasil diubah.');
        if (input) input.value = '';
        enterApp(newUsername);
    }

    function changePassword() {
        const curEl = document.getElementById('currentPassInput');
        const newEl = document.getElementById('newPassInput');
        const new2El = document.getElementById('newPassInput2');
        const currentPass = curEl ? curEl.value : '';
        const newPass = newEl ? newEl.value : '';
        const newPass2 = new2El ? new2El.value : '';
        const session = localStorage.getItem('vip_session');
        if (!session) return;
        if (!currentPass || !newPass || !newPass2) return toast('Isi semua kolom password.');
        if (newPass.length < 4) return toast('Password baru minimal 4 karakter.');
        if (newPass !== newPass2) return toast('Konfirmasi password baru tidak cocok.');

        if (hasBackend) {
            fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'changePassword', currentPass, newPass })
            })
                .then(async (res) => ({ ok: res.ok, data: await res.json() }))
                .then(({ ok, data }) => {
                    if (disposed) return;
                    if (!ok || !data.ok) return toast(data.error || 'Gagal mengganti password.');
                    toast('Password berhasil diubah di VPS.');
                    if (curEl) curEl.value = '';
                    if (newEl) newEl.value = '';
                    if (new2El) new2El.value = '';
                })
                .catch((err) => {
                    if (!disposed) toast('Error: ' + err.message);
                });
            return;
        }

        const users = getUsers();
        if (!users[session] || users[session].password !== btoa(currentPass)) {
            return toast('Password saat ini salah.');
        }

        users[session].password = btoa(newPass);
        saveUsers(users);
        toast('Password berhasil diubah.');
        if (curEl) curEl.value = '';
        if (newEl) newEl.value = '';
        if (new2El) new2El.value = '';
    }

    async function checkAuth() {
        if (disposed) return;
        if (hasBackend) {
            try {
                const fetchOpts = { cache: 'no-store' };
                if (abortController) fetchOpts.signal = abortController.signal;
                const res = await fetch('/api/auth/me', fetchOpts);
                if (disposed) return;
                if (res.ok) {
                    const data = await res.json();
                    if (disposed) return;
                    vpsFirebaseReady = Boolean(data.firebaseReady);
                    const fbPill = document.getElementById('googleAuthStatus');
                    if (fbPill) fbPill.textContent = vpsFirebaseReady ? 'Aktif' : 'Setup /owner';

                    if (data.authenticated && data.user) {
                        currentUserObj = data.user;
                        localStorage.setItem('vip_session', data.user.username);
                        enterApp(data.user.username, data.user);
                        return;
                    }
                    currentUserObj = null;
                    localStorage.removeItem('vip_session');
                    syncOwnerVisibility('member');
                    const authPage = document.getElementById('authPage');
                    const appWrap = document.getElementById('appWrap');
                    if (authPage) authPage.hidden = false;
                    if (appWrap) appWrap.hidden = true;
                    syncSkipLink(false);
                    return;
                }
            } catch {
                if (disposed) return;
                // fallback below
            }
        }

        if (disposed) return;
        const session = localStorage.getItem('vip_session');
        if (session && getUsers()[session]) {
            enterApp(session);
        } else {
            localStorage.removeItem('vip_session');
            syncOwnerVisibility('member');
            const authPage = document.getElementById('authPage');
            const appWrap = document.getElementById('appWrap');
            if (authPage) authPage.hidden = false;
            if (appWrap) appWrap.hidden = true;
            syncSkipLink(false);
        }
    }

    function getCurrentUserRole(username) {
        if (currentUserObj && (!username || currentUserObj.username === username)) {
            return currentUserObj.role || 'member';
        }
        if (!username) return 'member';
        const users = getUsers();
        return users[username]?.role || 'member';
    }

    function enterApp(username, userObj = null) {
        if (userObj) currentUserObj = userObj;
        const authPage = document.getElementById('authPage');
        const appWrap = document.getElementById('appWrap');
        if (authPage) authPage.hidden = true;
        if (appWrap) appWrap.hidden = false;
        syncSkipLink(true);

        const role = userObj?.role || getCurrentUserRole(username);
        const roleDisplay = role.toUpperCase();
        const providerTag = userObj?.provider === 'google' ? `${roleDisplay} • GOOGLE` : roleDisplay;

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setText('devUser', userObj?.email ? `${username} (${userObj.email})` : username);
        setText('profName', userObj?.displayName || username);
        setText('profRole', providerTag);
        setText('profRoleValue', roleDisplay);
        setText('devRole', roleDisplay);

        loadAvatarPhoto(username, userObj?.photoUrl || '');
        updateDeviceInfo();
        showPage('homePage');
        loadTelegramTools();
        updateCategoryCounts();
        loadChatMessages();

        syncOwnerVisibility(role);
        if (role === 'owner') {
            renderOwnerUsersList();
            applyTheme(getTheme());
        }

        showWarningBanner();
        clearTrackedTimeout(warningBannerTimer);
        warningBannerTimer = scheduleTimeout(() => {
            closeWarningBanner();
        }, 4500);
    }

    function showWarningBanner() {
        document.getElementById('warningBanner')?.classList.add('show');
    }

    function closeWarningBanner() {
        clearTrackedTimeout(warningBannerTimer);
        warningBannerTimer = null;
        document.getElementById('warningBanner')?.classList.remove('show');
    }

    function updateDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Desktop';
        if (/Android/i.test(ua)) device = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS';
        else if (/Windows/i.test(ua)) device = 'Windows';
        else if (/Mac/i.test(ua)) device = 'macOS';
        else if (/Linux/i.test(ua)) device = 'Linux';

        const devEl = document.getElementById('devDevice');
        const profEl = document.getElementById('profDevice');
        if (devEl) devEl.textContent = device;
        if (profEl) profEl.textContent = device;

        const devBat = document.getElementById('devBattery');
        const profBat = document.getElementById('profBattery');
        if (navigator.getBattery) {
            navigator.getBattery().then((b) => {
                if (disposed) return;
                const level = Math.round(b.level * 100);
                const text = level + '%' + (b.charging ? ' (Mengisi)' : '');
                if (devBat) devBat.textContent = text;
                if (profBat) profBat.textContent = text;
            }).catch(() => {
                if (disposed) return;
                if (devBat) devBat.textContent = 'AC / Desktop';
                if (profBat) profBat.textContent = 'AC / Desktop';
            });
        } else {
            if (devBat) devBat.textContent = 'AC / Desktop';
            if (profBat) profBat.textContent = 'AC / Desktop';
        }
    }

    // ============ FOCUS TRAP DIALOG HELPER ============
    function getFocusableElements(container) {
        if (!container) return [];
        return Array.from(
            container.querySelectorAll(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => el.offsetParent !== null);
    }

    function handleFocusTrap(container, e) {
        if (e.key !== 'Tab') return;
        const focusables = getFocusableElements(container);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function openPreview(url, title) {
        const overlay = document.getElementById('previewOverlay');
        const frame = document.getElementById('previewFrame');
        const titleEl = document.getElementById('previewTitle');
        const extLink = document.getElementById('previewExternalLink');
        if (!overlay || !frame) return;

        lastFocusedBeforePreview = document.activeElement;
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        if (titleEl) titleEl.textContent = title || 'Pratinjau Tool';
        const safeUrl = /^https?:\/\//i.test(String(url || '')) ? url : 'about:blank';
        if (extLink) {
            if (safeUrl !== 'about:blank') {
                extLink.href = safeUrl;
                extLink.hidden = false;
            } else {
                extLink.href = '#previewOverlay';
                extLink.hidden = true;
            }
        }
        frame.src = safeUrl;
        document.getElementById('previewBackBtn')?.focus();
    }

    function closePreview() {
        const overlay = document.getElementById('previewOverlay');
        const frame = document.getElementById('previewFrame');
        const extLink = document.getElementById('previewExternalLink');
        if (!overlay) return;
        overlay.hidden = true;
        document.body.style.overflow = '';
        if (extLink) {
            extLink.href = '#previewOverlay';
            extLink.hidden = false;
        }
        if (frame) {
            scheduleTimeout(() => {
                frame.src = 'about:blank';
            }, 150);
        }
        if (lastFocusedBeforePreview && typeof lastFocusedBeforePreview.focus === 'function') {
            lastFocusedBeforePreview.focus();
            lastFocusedBeforePreview = null;
        }
    }

    // ============ CHAT (VPS-backed + local fallback) ============
    function getChatMessages() {
        if (serverChatMessages !== null) return serverChatMessages;
        try {
            return JSON.parse(localStorage.getItem('vip_chat_messages') || '[]');
        } catch {
            return [];
        }
    }

    function saveChatMessages(messages) {
        serverChatMessages = messages;
        localStorage.setItem('vip_chat_messages', JSON.stringify(messages));
    }

    function getChatLimit(username) {
        if (hasBackend && currentUserObj) return serverChatLimit;
        try {
            const data = JSON.parse(localStorage.getItem('vip_chat_limits') || '{}');
            return data[username] !== undefined ? data[username] : 5;
        } catch {
            return 5;
        }
    }

    function setChatLimit(username, limit) {
        serverChatLimit = limit;
        try {
            const data = JSON.parse(localStorage.getItem('vip_chat_limits') || '{}');
            data[username] = limit;
            localStorage.setItem('vip_chat_limits', JSON.stringify(data));
        } catch {}
    }

    function renderChatUI(messages, isOwner, limit) {
        const container = document.getElementById('chatMessages');
        const limitEl = document.getElementById('chatLimit');
        const chatInput = document.getElementById('chatInput');
        const chatSendBtn = document.getElementById('chatSendBtn');
        if (!container) return;

        if (limitEl) {
            limitEl.textContent = isOwner ? 'Sisa chat: Tidak terbatas (Owner)' : ('Sisa chat: ' + limit);
        }
        if (chatInput) chatInput.disabled = !isOwner && limit <= 0;
        if (chatSendBtn) chatSendBtn.disabled = !isOwner && limit <= 0;

        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <i class="fas fa-comment-dots" aria-hidden="true"></i>
                    Tulis pesan untuk admin; balasan muncul di sini.
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return `
                <div class="chat-msg ${isUser ? 'user' : 'admin'}">
                    <span class="sender">${isUser ? escapeHtml(msg.username) : 'Balasan Owner'}</span>
                    <div class="text">${escapeHtml(msg.text)}</div>
                    <span class="time">${new Date(msg.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }

    function loadChatMessages() {
        const username = localStorage.getItem('vip_session');
        const isOwner = getCurrentUserRole(username) === 'owner';

        if (hasBackend) {
            const fetchOpts = { cache: 'no-store' };
            if (abortController) fetchOpts.signal = abortController.signal;
            fetch('/api/chat', fetchOpts)
                .then((r) => r.json())
                .then((data) => {
                    if (disposed) return;
                    if (data?.ok) {
                        serverChatMessages = data.messages || [];
                        serverChatLimit = Number(data.chatLimit ?? 5);
                        renderChatUI(serverChatMessages, Boolean(data.isOwner || isOwner), serverChatLimit);
                    }
                })
                .catch(() => {
                    if (disposed) return;
                    renderChatUI(getChatMessages(), isOwner, isOwner ? Infinity : getChatLimit(username));
                });
            return;
        }

        const limit = isOwner ? Infinity : getChatLimit(username);
        renderChatUI(getChatMessages(), isOwner, limit);
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (s) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[s] || s);
    }

    async function sendChatMessage() {
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSendBtn');
        const text = input ? input.value.trim() : '';
        const username = localStorage.getItem('vip_session');

        if (!text) return toast('Tulis pesan terlebih dahulu.');
        if (!username) return toast('Silakan login terlebih dahulu.');

        const isOwner = getCurrentUserRole(username) === 'owner';
        const limit = isOwner ? Infinity : getChatLimit(username);
        if (!isOwner && limit <= 0) {
            toast('Limit chat habis. Tunggu admin membalas.');
            return;
        }

        if (sendBtn) sendBtn.disabled = true;
        try {
            if (hasBackend) {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                if (!res.ok || !data.ok) {
                    toast(data.error || 'Gagal mengirim pesan.');
                    return;
                }
                serverChatMessages = data.messages || [];
                serverChatLimit = Number(data.chatLimit ?? 0);
                if (input) input.value = '';
                renderChatUI(serverChatMessages, isOwner, serverChatLimit);
                toast('Pesan terkirim ke VPS.');
                return;
            }

            const messages = getChatMessages();
            messages.push({
                sender: 'user',
                username,
                text,
                time: Date.now()
            });
            saveChatMessages(messages.slice(-50));
            if (!isOwner) setChatLimit(username, limit - 1);
            if (input) input.value = '';
            loadChatMessages();
            toast('Pesan terkirim.');
        } catch (e) {
            toast('Gagal mengirim pesan: ' + e.message);
        } finally {
            if (sendBtn) {
                const nextLimit = isOwner ? Infinity : getChatLimit(username);
                sendBtn.disabled = !isOwner && nextLimit <= 0;
            }
        }
    }

    // ============ TOOLS DATA (45 MODUL TERINTEGRASI VPS) ============
    const allToolsData = [
        // VPS Server Tools (8)
        { id: 'vps_dns', icon: 'fa-solid fa-globe', name: 'DNS & WHOIS Lookup', desc: 'Cek DNS A/MX/NS/TXT & WHOIS domain via VPS', badge: 'VPS', category: 'vps' },
        { id: 'vps_http', icon: 'fa-solid fa-shield-halved', name: 'HTTP & SSL Inspector', desc: 'Inspeksi header HTTP, latensi, & sertifikat TLS', badge: 'VPS', category: 'vps' },
        { id: 'vps_ip', icon: 'fa-solid fa-location-dot', name: 'IP Tracker & rDNS', desc: 'Lacak geolokasi IP, ISP, ASN, & reverse DNS', badge: 'VPS', category: 'vps' },
        { id: 'vps_port', icon: 'fa-solid fa-network-wired', name: 'TCP Port Checker', desc: 'Uji port terbuka & latensi host publik dari VPS', badge: 'VPS', category: 'vps' },
        { id: 'vps_shortlink', icon: 'fa-solid fa-link', name: 'VPS URL Shortener', desc: 'Buat tautan pendek /s/kode tersimpan di VPS', badge: 'VPS', category: 'vps' },
        { id: 'vps_paste', icon: 'fa-solid fa-file-code', name: 'VPS Code Paste', desc: 'Simpan & bagikan potongan kode /p/id di VPS', badge: 'VPS', category: 'vps' },
        { id: 'vps_imgconv', icon: 'fa-solid fa-compress', name: 'Image Converter', desc: 'Kompres & ubah foto ke WebP/JPG/PNG/AVIF', badge: 'VPS', category: 'vps' },
        { id: 'vps_status', icon: 'fa-solid fa-server', name: 'VPS Server Telemetry', desc: 'Monitor CPU, RAM, disk, uptime, & engine VPS', badge: 'VPS', category: 'vps' },

        // Downloader (3 - Powered by VPS yt-dlp + proxy)
        { id: 'instagram', icon: 'fa-brands fa-instagram', name: 'Instagram', desc: 'Unduh video, reel, & foto via VPS', badge: 'HD', category: 'downloader' },
        { id: 'tiktok', icon: 'fa-brands fa-tiktok', name: 'TikTok', desc: 'Unduh video TikTok tanpa watermark via VPS', badge: 'MP4', category: 'downloader' },
        { id: 'youtube', icon: 'fa-brands fa-youtube', name: 'YouTube', desc: 'Unduh video & audio YouTube via VPS', badge: 'MP4', category: 'downloader' },

        // Maker (5 - VPS Sharp + Canvas)
        { id: 'iqc', icon: 'fa-solid fa-image', name: 'IQC Generator', desc: 'Buat kartu kutipan IQC HD di VPS', badge: 'PNG', category: 'maker' },
        { id: 'tanyaustadz', icon: 'fa-solid fa-user-tie', name: 'Tanya Ustadz Meme', desc: 'Generator kartu meme tanya jawab HD', badge: 'PNG', category: 'maker' },
        { id: 'sertifikat', icon: 'fa-solid fa-certificate', name: 'Sertifikat Lucu', desc: 'Buat sertifikat custom nama di VPS', badge: 'PNG', category: 'maker' },
        { id: 'brat', icon: 'fa-solid fa-font', name: 'BRAT Generator', desc: 'Buat poster teks gaya BRAT PNG', badge: 'PNG', category: 'maker' },
        { id: 'fakeig', icon: 'fa-brands fa-instagram', name: 'Fake IG Post', desc: 'Generator mockup kartu profil IG', badge: 'PNG', category: 'maker' },

        // Tools (8 - VPS Sharp/QR + Local Dev Tools)
        { id: 'qr', icon: 'fa-solid fa-qrcode', name: 'QR Generator', desc: 'Buat QR code PNG & SVG lokal di VPS', badge: 'PNG', category: 'tools' },
        { id: 'removebg', icon: 'fa-solid fa-eraser', name: 'Remove BG', desc: 'Hapus latar belakang foto PNG di VPS', badge: 'VPS', category: 'tools' },
        { id: 'enhancer', icon: 'fa-solid fa-sliders', name: 'Image Enhancer', desc: 'Upscale 2x & pertajam foto di VPS', badge: 'HD', category: 'tools' },
        { id: 'dev_json', icon: 'fa-solid fa-brackets-curly', name: 'JSON Formatter', desc: 'Rapikan, validasi, & minify JSON', badge: 'Dev', category: 'tools' },
        { id: 'dev_encode', icon: 'fa-solid fa-fingerprint', name: 'Base64 / URL / Hash', desc: 'Encode/decode Base64, URL, & SHA-256', badge: 'Dev', category: 'tools' },
        { id: 'calc', icon: 'fa-solid fa-calculator', name: 'Calculator', desc: 'Hitung ekspresi matematika', badge: 'Math', category: 'tools' },
        { id: 'pwgen', icon: 'fa-solid fa-key', name: 'Password Gen', desc: 'Password acak 16 karakter', badge: '16-Char', category: 'tools' },
        { id: 'morse', icon: 'fa-solid fa-wave-square', name: 'Morse Code', desc: 'Konversi teks & kode morse dua arah', badge: 'Kode', category: 'tools' },

        // External (4 - Verified HTTP 200)
        { id: 'winquotesnew', icon: 'fa-brands fa-windows', name: 'Windows Quotes', desc: 'Quote ala dialog Windows', badge: 'Web', category: 'external', link: 'https://windows-quotes.netlify.app/' },
        { id: 'fakeff', icon: 'fa-solid fa-fire', name: 'Fake FF', desc: 'Free Fire simulator', category: 'external', link: 'https://fakeff.netlify.app/' },
        { id: 'getcode', icon: 'fa-solid fa-code', name: 'Get Code HTML', desc: 'Extract & copy source HTML web', category: 'external', link: 'https://kaze-extract.netlify.app/' },
        { id: 'fotolink', icon: 'fa-solid fa-image', name: 'Foto To Link', desc: 'Upload & bagikan tautan foto', category: 'external', link: 'https://pixvault-bykz.netlify.app/' },

        // Extra (7 - handtrack rebuilt locally replacing dead 404 URL)
        { id: 'handtrack', icon: 'fa-solid fa-hand', name: 'Hand Trail Canvas', desc: 'Simulasi jejak gestur & partikel interaktif', badge: 'Canvas', category: 'extra' },
        { id: 'interaktif', icon: 'fa-solid fa-hand-peace', name: 'Interaktif Hand', desc: 'Gestur tangan interaktif', category: 'extra', link: 'https://interaktif-hand.netlify.app/' },
        { id: 'fakecall', icon: 'fa-solid fa-phone', name: 'Face Call', desc: 'Simulasi panggilan masuk', category: 'extra', link: 'https://fc-kzy.netlify.app/' },
        { id: 'anonychat', icon: 'fa-solid fa-user-secret', name: 'Chat Anonim', desc: 'Kirim pesan anonim', category: 'extra', link: 'https://anonycht.netlify.app/' },
        { id: 'fakeml', icon: 'fa-solid fa-mobile-screen', name: 'Fake ML', desc: 'Simulasi tampilan ML', category: 'extra', link: 'https://beamish-pavlova-f8f540.netlify.app/' },
        { id: 'animequotes', icon: 'fa-solid fa-quote-right', name: 'Anime Quotes', desc: 'Kutipan karakter anime', category: 'extra', link: 'https://serious-crimson-vvx8mlj1.edgeone.dev/' },
        { id: 'pinkvoid', icon: 'fa-solid fa-heart', name: 'Pink Void', desc: 'Efek visual bertema pink', category: 'extra', link: 'https://pinkvoid.netlify.app' },

        // XVIP Tools (10 - Powered by VPS APIs + local generators)
        { id: 'xvip_unband', icon: 'fa-solid fa-phone-slash', name: 'Unban WA', desc: 'Generator surat banding WA', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_getcode', icon: 'fa-solid fa-code', name: 'Get HTML/CSS/JS', desc: 'Extract source code URL via VPS', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_nglspam', icon: 'fa-solid fa-comment-dots', name: 'NGL Sender', desc: 'Kirim pesan NGL tanpa CORS via VPS', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakeml', icon: 'fa-solid fa-mobile-screen', name: 'Fake Lobby ML', desc: 'Simulasi kartu lobby ML', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_bratanime', icon: 'fa-solid fa-font', name: 'Brat Anime', desc: 'Teks BRAT edisi anime', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakejago', icon: 'fa-solid fa-bank', name: 'Fake Bank Jago', desc: 'Simulasi mockup Bank Jago', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakedana', icon: 'fa-solid fa-wallet', name: 'Fake Dana', desc: 'Simulasi mockup e-wallet', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_allinone', icon: 'fa-solid fa-download', name: 'All In One Downloader', desc: 'TikTok, IG, YouTube, X via VPS', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_stalkgame', icon: 'fa-solid fa-gamepad', name: 'Stalk Game', desc: 'Cek profil Roblox, FF, ML via VPS', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_stalksosmed', icon: 'fa-solid fa-share-alt', name: 'Stalk Sosmed', desc: 'Cek profil GitHub, TikTok, YT, IG', badge: 'XVIP', category: 'xvip', isXvip: true }
    ];

    function getFilteredTools() {
        let hiddenTools = vpsHiddenTools;
        if (!Array.isArray(hiddenTools)) {
            try {
                hiddenTools = JSON.parse(localStorage.getItem('vip_hidden_tools') || '[]');
            } catch {
                hiddenTools = [];
            }
        }
        return allToolsData.filter((t) => !hiddenTools.includes(t.id));
    }

    function getTelegramTools() {
        if (Array.isArray(vpsCustomTools)) return vpsCustomTools;
        try {
            const data = localStorage.getItem('vip_telegram_tools');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveTelegramTools(tools) {
        vpsCustomTools = tools;
        localStorage.setItem('vip_telegram_tools', JSON.stringify(tools));
    }

    function addTelegramTool(nameOrObj, url, desc, category) {
        const isObj = typeof nameOrObj === 'object' && nameOrObj !== null;
        const toolName = isObj ? nameOrObj.name : nameOrObj;
        const toolUrl = isObj ? nameOrObj.url : url;
        const toolDesc = isObj ? nameOrObj.desc : desc;
        const toolCategory = isObj ? nameOrObj.category : category;
        const toolIcon = (isObj && nameOrObj.icon) || 'fa-solid fa-plug';

        const tools = [...getTelegramTools()];
        const newTool = {
            id: 'tele_' + Date.now(),
            name: toolName,
            url: toolUrl,
            desc: toolDesc || 'Tools Custom Owner',
            category: toolCategory || 'telegram',
            icon: toolIcon,
            badge: 'Custom',
            isTelegram: true,
            createdAt: Date.now()
        };
        tools.push(newTool);
        saveTelegramTools(tools);
        updateCategoryCounts();
        return newTool;
    }

    function getTelegramToolsList() {
        return getTelegramTools();
    }

    function getAllToolsList() {
        return [...getFilteredTools(), ...getTelegramToolsList()];
    }

    function getToolsByCategory(category) {
        const allTools = getAllToolsList();
        if (category === 'all') return allTools;
        return allTools.filter((t) => t.category === category);
    }

    function updateCategoryCounts() {
        const categories = ['all', 'vps', 'downloader', 'maker', 'tools', 'external', 'extra', 'xvip', 'telegram'];
        categories.forEach((cat) => {
            const countEl = document.querySelector(`[data-count-for="${cat}"]`);
            if (countEl) {
                countEl.textContent = String(getToolsByCategory(cat).length);
            }
        });
    }

    function buildToolCardHtml(item, idx, options = {}) {
        const targetUrl = item.link || item.url || '';
        const isLink = Boolean(targetUrl || item.isTelegram);
        const featuredClass = options.allowFeatured && idx === 0 ? ' is-featured' : '';
        const xvipClass = item.isXvip ? ' is-xvip' : '';
        const badgeClass = item.badge === 'Custom' || item.isTelegram ? 'badge-new' : (item.isXvip ? 'xvip-badge' : 'badge');
        const badgeText = item.isXvip ? 'XVIP' : (item.isTelegram ? 'Custom' : item.badge);

        const actionType = item.isXvip ? 'xvip' : (isLink ? 'preview' : 'tool');
        const headingTag = options.headingTag || 'h3';

        return `
            <button
                type="button"
                class="tools-card${featuredClass}${xvipClass}"
                style="animation-delay:${Math.min(idx * 30, 320)}ms"
                data-action-type="${actionType}"
                data-tool-id="${escapeHtml(item.id)}"
                data-tool-name="${escapeHtml(item.name)}"
                data-tool-url="${escapeHtml(targetUrl)}"
            >
                <span class="icon" aria-hidden="true"><i class="${escapeHtml(item.icon || 'fa-solid fa-wrench')}"></i></span>
                <span class="tool-meta">
                    <${headingTag}>${escapeHtml(item.name)}</${headingTag}>
                    <p>${escapeHtml(item.desc || 'Utilitas web MattzLM')}</p>
                </span>
                ${badgeText ? `<span class="${badgeClass}">${escapeHtml(badgeText)}</span>` : ''}
            </button>
        `;
    }

    function renderGrid(containerId, items, isExternal = false, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state-box">
                    <i class="fas fa-box-open" aria-hidden="true"></i>
                    <p>${escapeHtml(options.emptyMessage || 'Tidak ada modul tool pada kategori ini.')}</p>
                    ${options.showReset ? '<button type="button" class="v-btn v-btn-secondary" style="width:auto;" data-reset-search="1">Reset Pencarian</button>' : ''}
                </div>
            `;
            return;
        }
        container.innerHTML = items
            .map((item, idx) =>
                buildToolCardHtml(item, idx, {
                    isExternal,
                    allowFeatured: Boolean(options.allowFeatured),
                    headingTag: options.headingTag || 'h3'
                })
            )
            .join('');
    }

    function renderCategory(categoryKey, searchQuery = '') {
        const container = document.getElementById('toolsContainer');
        if (!container) return;

        const baseItems = getToolsByCategory(categoryKey);
        const q = searchQuery.trim().toLowerCase();
        const items = q
            ? baseItems.filter((item) =>
                  `${item.name} ${item.desc} ${item.category} ${item.badge || ''}`.toLowerCase().includes(q)
              )
            : baseItems;

        const titleMap = {
            all: 'Semua Modul Tools',
            vps: 'Modul Server VPS Terintegrasi',
            downloader: 'Downloader Media (VPS)',
            maker: 'Image & Meme Maker',
            tools: 'Utilitas Harian & Dev',
            external: 'External Web Tools',
            extra: 'Extra Interaktif',
            xvip: 'Modul XVIP Terintegrasi VPS',
            telegram: 'Tools Custom Owner'
        };
        const iconMap = {
            all: 'fa-th-large',
            vps: 'fa-server',
            downloader: 'fa-download',
            maker: 'fa-paintbrush',
            tools: 'fa-screwdriver-wrench',
            external: 'fa-link',
            extra: 'fa-plus-circle',
            xvip: 'fa-crown',
            telegram: 'fa-plug'
        };

        container.innerHTML = `
            <h2 class="section-title">
                <i class="fas ${iconMap[categoryKey] || 'fa-th-large'}" aria-hidden="true" style="color:${categoryKey === 'xvip' ? 'var(--status-warn)' : 'var(--theme-primary-light)'};"></i>
                ${escapeHtml(titleMap[categoryKey] || 'Tools')} (${items.length})
                <span class="line" aria-hidden="true"></span>
            </h2>
            <div class="tools-grid" id="categoryGrid"></div>
        `;
        renderGrid('categoryGrid', items, false, {
            emptyMessage: q ? `Tidak ada tool yang cocok dengan "${searchQuery}".` : 'Belum ada tools pada kategori ini.',
            showReset: Boolean(q)
        });

        document.querySelectorAll('.category-tab[data-category]').forEach((t) => {
            const active = t.dataset.category === categoryKey;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    function openToolDialog() {
        const viewer = document.getElementById('toolViewer');
        if (!viewer) return;
        if (typeof activeToolCleanup === 'function') {
            activeToolCleanup();
            activeToolCleanup = null;
        }
        lastFocusedBeforeModal = document.activeElement;
        viewer.hidden = false;
        document.body.style.overflow = 'hidden';
        scheduleTimeout(() => {
            const firstInput = viewer.querySelector('input, select, textarea');
            (firstInput || document.getElementById('toolViewerCloseBtn'))?.focus();
        }, 10);
    }

    function closeTool() {
        const viewer = document.getElementById('toolViewer');
        if (!viewer) return;
        if (typeof activeToolCleanup === 'function') {
            activeToolCleanup();
            activeToolCleanup = null;
        }
        viewer.hidden = true;
        document.body.style.overflow = '';
        if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
            lastFocusedBeforeModal.focus();
            lastFocusedBeforeModal = null;
        }
    }

    // ============ SHARED RENDER HELPERS FOR VPS RESPONSES ============
    function renderDownloadResult(resultEl, data, fallbackName) {
        const formats = Array.isArray(data.formats) ? data.formats : [];
        const firstVideo = formats.find((f) => f.type === 'video');
        const firstImage = formats.find((f) => f.type === 'image');
        const previewSrc = data.previewUrl || firstVideo?.proxyUrl || firstImage?.proxyUrl || data.thumbnail || '';

        const mediaPreview = firstVideo && previewSrc
            ? `<video controls width="480" height="270" class="result-media" src="${escapeHtml(previewSrc)}"${data.thumbnail ? ` poster="${escapeHtml(data.thumbnail)}"` : ''}></video>`
            : (previewSrc
                ? `<img src="${escapeHtml(previewSrc)}" width="480" height="270" alt="Pratinjau ${escapeHtml(data.title || fallbackName)}" class="result-media">`
                : '');

        const formatButtons = formats.map((f) => {
            const sizeMb = f.filesize ? ` • ${(f.filesize / (1024 * 1024)).toFixed(1)} MB` : '';
            const href = f.proxyUrl || f.url;
            return `
                <a href="${escapeHtml(href)}" download class="v-btn" style="margin-bottom:8px;">
                    <i class="fas fa-download" aria-hidden="true"></i> ${escapeHtml(f.label)}${escapeHtml(sizeMb)}
                </a>
            `;
        }).join('');

        resultEl.innerHTML = `
            <div class="result-box" style="text-align:left;">
                <div class="result-meta-head">
                    <strong>${escapeHtml(data.title || fallbackName)}</strong>
                    <span class="owner-pill">${escapeHtml((data.engine || 'VPS').toUpperCase())}</span>
                </div>
                <p style="font-size:0.8rem;color:var(--text-muted);margin:4px 0 12px;">
                    Uploader: ${escapeHtml(data.uploader || '-')}${data.duration ? ` • Durasi: ${Math.floor(data.duration / 60)}m ${Math.floor(data.duration % 60)}d` : ''}
                </p>
                ${data.note ? `<p style="font-size:0.8rem;color:var(--status-warn);margin-bottom:10px;">${escapeHtml(data.note)}</p>` : ''}
                ${mediaPreview}
                <div style="margin-top:8px;">${formatButtons}</div>
            </div>
        `;
    }

    function renderProfileCardResult(resultEl, profile) {
        const statsEntries = Object.entries(profile.stats || {});
        const statsHtml = statsEntries.map(([k, v]) => `
            <div class="vps-kv-item">
                <span>${escapeHtml(k)}</span>
                <strong>${escapeHtml(String(v))}</strong>
            </div>
        `).join('');

        resultEl.innerHTML = `
            <div class="result-box" style="text-align:left;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    ${profile.avatar
                        ? `<img src="${escapeHtml(profile.avatar)}" width="56" height="56" alt="Avatar ${escapeHtml(profile.username)}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid var(--border-color);">`
                        : `<span class="owner-monogram" style="width:48px;height:48px;font-size:1rem;">${escapeHtml((profile.displayName || profile.username || 'U').charAt(0).toUpperCase())}</span>`
                    }
                    <div style="min-width:0;">
                        <div style="font-weight:700;font-size:1rem;">
                            ${escapeHtml(profile.displayName || profile.username)}
                            ${profile.verified ? '<span class="owner-pill" style="margin-left:6px;">VERIFIED</span>' : ''}
                        </div>
                        <div style="font-size:0.82rem;color:var(--text-muted);">
                            ${escapeHtml(profile.username)} • ${escapeHtml(profile.platform || profile.game || '')}
                        </div>
                    </div>
                </div>
                ${profile.bio ? `<p style="font-size:0.84rem;color:var(--text-primary);margin-bottom:10px;word-break:break-word;">${escapeHtml(profile.bio)}</p>` : ''}
                ${statsHtml ? `<div class="vps-kv-grid">${statsHtml}</div>` : ''}
                ${profile.profileUrl
                    ? `<a href="${escapeHtml(profile.profileUrl)}" target="_blank" rel="noopener noreferrer" class="v-btn v-btn-secondary" style="margin-top:12px;"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> Buka Profil Asli</a>`
                    : ''
                }
            </div>
        `;
    }

    function renderCanvasDownloadResult(containerId, dataUrl, altText, filename) {
        const resultEl = document.getElementById(containerId);
        if (!resultEl) return;
        resultEl.innerHTML = `
            <div class="result-box">
                <img src="${dataUrl}" width="600" height="340" alt="${escapeHtml(altText)}" class="result-media">
                <a href="${dataUrl}" download="${escapeHtml(filename)}" class="v-btn">
                    <i class="fas fa-download" aria-hidden="true"></i> Unduh PNG
                </a>
            </div>
        `;
    }

    // ============ XVIP TOOLS (ALL ACTIVE & VPS-POWERED) ============
    function showXvipMessage(name, id) {
        const body = document.getElementById('toolViewerBody');
        if (!body) return;
        openToolDialog();
        renderXvipTool(body, id, name);
    }

    function renderXvipTool(body, id, name) {
        if (id === 'xvip_unband') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-phone-slash" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Generator draf surat banding resmi ke WhatsApp Support.</p>
                <label for="unbanPhone" class="v-label">Nomor WhatsApp</label>
                <input type="text" id="unbanPhone" class="v-input" placeholder="+6281234567890">
                <label for="unbanType" class="v-label">Jenis Pemblokiran</label>
                <select id="unbanType" class="v-input">
                    <option value="spam">Terblokir Spam / Sementara</option>
                    <option value="permanent">Terblokir Permanen</option>
                </select>
                <label for="unbanReason" class="v-label">Kronologi Singkat (Opsional)</label>
                <input type="text" id="unbanReason" class="v-input" placeholder="Penggunaan normal bersama keluarga/kerja">
                <button type="button" class="v-btn" id="unbanGenBtn"><i class="fas fa-file-lines" aria-hidden="true"></i> Buat Draf Banding</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('unbanGenBtn').onclick = () => {
                const phone = document.getElementById('unbanPhone').value.trim();
                const type = document.getElementById('unbanType').value;
                const reason = document.getElementById('unbanReason').value.trim() || 'Akun saya terblokir secara tidak sengaja saat penggunaan normal.';
                if (!phone) return toast('Masukkan nomor WhatsApp.');
                const subject = type === 'permanent' ? `Appeal for Permanently Banned WhatsApp Account (${phone})` : `WhatsApp Account Review Request (${phone})`;
                const text = `Hello WhatsApp Support Team,\n\nMy WhatsApp number ${phone} was recently banned (${type === 'permanent' ? 'permanent ban' : 'temporary/spam flag'}). ${reason}\n\nI always try to follow WhatsApp Terms of Service and kindly ask you to review and restore my account.\n\nThank you,\n${phone}`;
                const mailto = `mailto:support@support.whatsapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
                document.getElementById('toolResult').innerHTML = `
                    <div class="result-box" style="text-align:left;">
                        <label for="unbanOut" class="v-label">Hasil Draf Banding</label>
                        <textarea id="unbanOut" class="v-input" rows="6" readonly style="font-size:0.84rem;">${escapeHtml(text)}</textarea>
                        <div class="owner-action-row">
                            <button type="button" class="v-btn" id="unbanCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Draf</button>
                            <a class="v-btn v-btn-secondary" href="${mailto}"><i class="fas fa-envelope" aria-hidden="true"></i> Buka Email</a>
                        </div>
                    </div>
                `;
                document.getElementById('unbanCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(text);
                    toast('Teks banding disalin.');
                };
            };
            return;
        }

        if (id === 'xvip_getcode') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-code" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Ambil source HTML, daftar CSS, &amp; script langsung lewat server VPS (bebas CORS).</p>
                <label for="getCodeUrl" class="v-label">URL Target</label>
                <input type="url" id="getCodeUrl" class="v-input" placeholder="https://example.com">
                <button type="button" class="v-btn" id="getCodeBtn"><i class="fas fa-code" aria-hidden="true"></i> Extract via VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('getCodeBtn').onclick = async () => {
                const btn = document.getElementById('getCodeBtn');
                const url = document.getElementById('getCodeUrl').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL terlebih dahulu.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS sedang mengekstrak source...</div>`;
                try {
                    const res = await fetch('/api/tools/source', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal mengambil source.');
                    const code = data.html || '';
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <div class="vps-kv-grid" style="margin-bottom:10px;">
                                <div class="vps-kv-item"><span>HTTP Status</span><strong>${data.status}</strong></div>
                                <div class="vps-kv-item"><span>Latensi VPS</span><strong>${data.latencyMs} ms</strong></div>
                                <div class="vps-kv-item"><span>Ukuran</span><strong>${(data.bytes / 1024).toFixed(1)} KB</strong></div>
                                <div class="vps-kv-item"><span>CSS / JS</span><strong>${data.stylesheets.length} / ${data.scripts.length}</strong></div>
                            </div>
                            <label for="extractedCode" class="v-label">Source HTML (${escapeHtml(data.title)})</label>
                            <textarea id="extractedCode" class="v-input" rows="8" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.78rem;">${escapeHtml(code)}</textarea>
                            <div class="owner-action-row">
                                <button type="button" class="v-btn" id="copyCodeBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin</button>
                                <button type="button" class="v-btn v-btn-secondary" id="dlCodeBtn"><i class="fas fa-download" aria-hidden="true"></i> Unduh .html</button>
                            </div>
                        </div>
                    `;
                    document.getElementById('copyCodeBtn').onclick = () => {
                        navigator.clipboard.writeText(code);
                        toast('Source code disalin.');
                    };
                    document.getElementById('dlCodeBtn').onclick = () => {
                        const blob = new Blob([code], { type: 'text/html' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'source_' + Date.now() + '.html';
                        a.click();
                    };
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">Gagal mengambil source: ${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        if (id === 'xvip_nglspam') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-comment-dots" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Pengirim pesan NGL server-side lewat VPS (bebas blokir CORS browser).</p>
                <label for="nglUser" class="v-label">Username NGL</label>
                <input type="text" id="nglUser" class="v-input" placeholder="Username NGL (tanpa https://ngl.link/)">
                <label for="nglMsg" class="v-label">Isi Pesan</label>
                <input type="text" id="nglMsg" class="v-input" placeholder="Tulis pesan anonim..." maxlength="300">
                <div class="owner-action-row">
                    <button type="button" class="v-btn" id="nglSendBtn"><i class="fas fa-paper-plane" aria-hidden="true"></i> Kirim via VPS</button>
                    <button type="button" class="v-btn v-btn-secondary" id="nglOpenBtn"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Buka NGL</button>
                </div>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('nglOpenBtn').onclick = () => {
                const u = document.getElementById('nglUser').value.trim().replace(/^https?:\/\/ngl\.link\//i, '').replace(/^@/, '');
                if (!u) return toast('Masukkan username NGL.');
                window.open(`https://ngl.link/${encodeURIComponent(u)}`, '_blank', 'noopener,noreferrer');
            };
            document.getElementById('nglSendBtn').onclick = async () => {
                const btn = document.getElementById('nglSendBtn');
                const u = document.getElementById('nglUser').value.trim();
                const msg = document.getElementById('nglMsg').value.trim();
                const result = document.getElementById('toolResult');
                if (!u || !msg) return toast('Isi username dan pesan.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS mengirim pesan ke NGL...</div>`;
                try {
                    const res = await fetch('/api/tools/ngl', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: u, question: msg })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal mengirim ke NGL.');
                    result.innerHTML = `<div class="result-box result-box-success">Pesan berhasil dikirim ke @${escapeHtml(data.username)} lewat VPS.${data.questionId ? ` ID: ${escapeHtml(data.questionId)}` : ''}</div>`;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        if (id === 'xvip_fakeml') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-mobile-screen" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Buat gambar simulasi kartu lobby Mobile Legends.</p>
                <label for="mlNick" class="v-label">Nickname</label>
                <input type="text" id="mlNick" class="v-input" placeholder="MattzLM">
                <label for="mlSquad" class="v-label">Nama Squad</label>
                <input type="text" id="mlSquad" class="v-input" placeholder="[MLM] MattzLM">
                <label for="mlRank" class="v-label">Tier Rank</label>
                <select id="mlRank" class="v-input">
                    <option value="MYTHICAL IMMORTAL ★120">Mythical Immortal ★120</option>
                    <option value="MYTHICAL GLORY ★65">Mythical Glory ★65</option>
                    <option value="MYTHICAL HONOR ★30">Mythical Honor ★30</option>
                    <option value="LEGEND I">Legend I</option>
                </select>
                <div class="owner-action-row">
                    <div style="flex:1;">
                        <label for="mlBp" class="v-label">Battle Points</label>
                        <input type="text" id="mlBp" class="v-input" value="125400">
                    </div>
                    <div style="flex:1;">
                        <label for="mlDm" class="v-label">Diamond</label>
                        <input type="text" id="mlDm" class="v-input" value="9999">
                    </div>
                </div>
                <button type="button" class="v-btn" id="mlGenBtn"><i class="fas fa-image" aria-hidden="true"></i> Generate Lobby</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('mlGenBtn').onclick = () => {
                const nick = document.getElementById('mlNick').value.trim() || 'MattzLM';
                const squad = document.getElementById('mlSquad').value.trim() || '[VIP] MattzLM';
                const rank = document.getElementById('mlRank').value;
                const bp = document.getElementById('mlBp').value.trim() || '125400';
                const dm = document.getElementById('mlDm').value.trim() || '9999';

                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 360;
                const ctx = canvas.getContext('2d');
                const grad = ctx.createLinearGradient(0, 0, 640, 360);
                grad.addColorStop(0, '#0b132b');
                grad.addColorStop(0.5, '#1c2541');
                grad.addColorStop(1, '#0f172a');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 640, 360);
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 3;
                ctx.strokeRect(12, 12, 616, 336);
                ctx.fillStyle = 'rgba(245,158,11,0.18)';
                ctx.fillRect(24, 24, 592, 48);
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 18px sans-serif';
                ctx.fillText('MOBILE LEGENDS • LOBBY', 40, 54);
                ctx.fillStyle = '#93c5fd';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(`BP: ${bp} | DM: ${dm}`, 410, 54);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 30px sans-serif';
                ctx.fillText(nick, 40, 150);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '18px sans-serif';
                ctx.fillText(squad, 40, 182);
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 22px sans-serif';
                ctx.fillText(rank, 40, 235);
                ctx.fillStyle = '#2563eb';
                ctx.fillRect(420, 275, 180, 48);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px sans-serif';
                ctx.fillText('START GAME', 452, 305);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '11px sans-serif';
                ctx.fillText('SIMULASI MOCKUP • MATTZLM', 40, 325);

                renderCanvasDownloadResult('toolResult', canvas.toDataURL('image/png'), `Simulasi lobby ML untuk ${nick}`, `ml_lobby_${Date.now()}.png`);
            };
            return;
        }

        if (id === 'xvip_bratanime') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-font" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Buat poster teks gaya BRAT edisi Anime.</p>
                <label for="bratAnimeText" class="v-label">Teks Poster</label>
                <input type="text" id="bratAnimeText" class="v-input" placeholder="Tulis kalimat pendek...">
                <label for="bratAnimeTheme" class="v-label">Palet Warna</label>
                <select id="bratAnimeTheme" class="v-input">
                    <option value="mono">Hitam Putih Abu</option>
                    <option value="green">Brat Green</option>
                    <option value="pink">Sakura Pink</option>
                    <option value="blue">Cyber Blue</option>
                    <option value="crimson">Dark Crimson</option>
                </select>
                <button type="button" class="v-btn" id="bratAnimeBtn"><i class="fas fa-image" aria-hidden="true"></i> Generate Gambar</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('bratAnimeBtn').onclick = () => {
                const text = document.getElementById('bratAnimeText').value.trim();
                const theme = document.getElementById('bratAnimeTheme').value;
                if (!text) return toast('Masukkan teks terlebih dahulu.');
                const palette = {
                    mono: { bg: '#111111', fg: '#ffffff', accent: '#a3a3a3' },
                    green: { bg: '#8ace00', fg: '#000000', accent: '#ffffff' },
                    pink: { bg: '#fbcfe8', fg: '#831843', accent: '#be185d' },
                    blue: { bg: '#0f172a', fg: '#38bdf8', accent: '#60a5fa' },
                    crimson: { bg: '#450a0a', fg: '#fecaca', accent: '#ef4444' }
                }[theme] || { bg: '#111111', fg: '#ffffff', accent: '#a3a3a3' };
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 340;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = palette.bg;
                ctx.fillRect(0, 0, 600, 340);
                ctx.strokeStyle = palette.accent;
                ctx.lineWidth = 6;
                ctx.strokeRect(14, 14, 572, 312);
                ctx.fillStyle = palette.fg;
                ctx.font = 'bold 42px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const words = text.split(/\s+/);
                const lines = [];
                let i = 0;
                while (i < words.length) {
                    let line = '';
                    while (i < words.length && (line + words[i]).length < 18) {
                        line += (line ? ' ' : '') + words[i];
                        i++;
                    }
                    if (!line) {
                        line = words[i].slice(0, 18);
                        i++;
                    }
                    lines.push(line);
                }
                let y = 160 - ((lines.length - 1) * 26);
                lines.forEach((l) => {
                    ctx.fillText(l, 300, y);
                    y += 52;
                });
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText('MATTZLM ANIME EDITION', 300, 305);
                renderCanvasDownloadResult('toolResult', canvas.toDataURL('image/png'), `Poster Brat Anime: ${text}`, `brat_anime_${Date.now()}.png`);
            };
            return;
        }

        if (id === 'xvip_fakejago' || id === 'xvip_fakedana') {
            const isJago = id === 'xvip_fakejago';
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid ${isJago ? 'fa-bank' : 'fa-wallet'}" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Generator mockup simulasi saldo ${isJago ? 'Bank Jago' : 'DANA'}.</p>
                <label for="simName" class="v-label">Nama Pemilik</label>
                <input type="text" id="simName" class="v-input" placeholder="MattzLM">
                <label for="simSub" class="v-label">${isJago ? 'Nama Kantong' : 'Nomor HP'}</label>
                <input type="text" id="simSub" class="v-input" placeholder="${isJago ? 'Kantong Utama' : '0812-xxxx-xxxx'}">
                <label for="simAmount" class="v-label">Nominal Saldo (Rp)</label>
                <input type="number" id="simAmount" class="v-input" value="15000000">
                <button type="button" class="v-btn" id="simGenBtn"><i class="fas fa-image" aria-hidden="true"></i> Buat Simulasi</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('simGenBtn').onclick = () => {
                const ownerName = document.getElementById('simName').value.trim() || 'MattzLM';
                const sub = document.getElementById('simSub').value.trim() || (isJago ? 'Kantong Utama' : '0812-xxxx-xxxx');
                const amount = Number(document.getElementById('simAmount').value || 0);
                const formatted = 'Rp ' + amount.toLocaleString('id-ID');
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 340;
                const ctx = canvas.getContext('2d');
                const grad = ctx.createLinearGradient(0, 0, 600, 340);
                if (isJago) {
                    grad.addColorStop(0, '#f59e0b');
                    grad.addColorStop(1, '#7c3aed');
                } else {
                    grad.addColorStop(0, '#0284c7');
                    grad.addColorStop(1, '#1d4ed8');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 600, 340);
                ctx.fillStyle = 'rgba(0,0,0,0.28)';
                ctx.fillRect(24, 24, 552, 292);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText(isJago ? 'BANK JAGO' : 'DANA', 48, 72);
                ctx.font = '16px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.88)';
                ctx.fillText(`${ownerName} • ${sub}`, 48, 110);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 38px sans-serif';
                ctx.fillText(formatted, 48, 195);
                ctx.font = '13px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillText('SIMULASI MOCKUP • MATTZLM', 48, 285);
                renderCanvasDownloadResult('toolResult', canvas.toDataURL('image/png'), `Simulasi ${isJago ? 'Bank Jago' : 'DANA'} untuk ${ownerName}`, `sim_${Date.now()}.png`);
            };
            return;
        }

        if (id === 'xvip_allinone') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-download" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Unduh media dari TikTok, Instagram, YouTube, X, Facebook, &amp; ratusan situs via VPS yt-dlp.</p>
                <label for="aioPlatform" class="v-label">Platform</label>
                <select id="aioPlatform" class="v-input">
                    <option value="auto">Deteksi Otomatis (All Platform)</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                </select>
                <label for="aioUrl" class="v-label">URL Media</label>
                <input type="url" id="aioUrl" class="v-input" placeholder="https://...">
                <button type="button" class="v-btn" id="aioBtn"><i class="fas fa-download" aria-hidden="true"></i> Proses di VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('aioBtn').onclick = async () => {
                const btn = document.getElementById('aioBtn');
                const platform = document.getElementById('aioPlatform').value;
                const url = document.getElementById('aioUrl').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL terlebih dahulu.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS sedang mengekstrak media...</div>`;
                try {
                    const res = await fetch('/api/tools/download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ platform, url })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal mengekstrak media.');
                    renderDownloadResult(result, data, name);
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        if (id === 'xvip_stalkgame') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-gamepad" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Cek profil akun game resmi lewat server VPS (Roblox, Mobile Legends, Free Fire).</p>
                <label for="sgGame" class="v-label">Game</label>
                <select id="sgGame" class="v-input">
                    <option value="roblox">Roblox (Username)</option>
                    <option value="ml">Mobile Legends (ID|Zone)</option>
                    <option value="ff">Free Fire (UID)</option>
                </select>
                <label for="sgQuery" class="v-label">Username / ID Game</label>
                <input type="text" id="sgQuery" class="v-input" placeholder="Contoh Roblox: builderman | ML: 12345678|2015">
                <button type="button" class="v-btn" id="sgBtn"><i class="fas fa-search" aria-hidden="true"></i> Cek Profil via VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('sgBtn').onclick = async () => {
                const btn = document.getElementById('sgBtn');
                const game = document.getElementById('sgGame').value;
                const query = document.getElementById('sgQuery').value.trim();
                const result = document.getElementById('toolResult');
                if (!query) return toast('Masukkan Username atau ID.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS mencari profil game...</div>`;
                try {
                    const res = await fetch('/api/tools/stalk-game', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ game, query })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok || !data.profile) throw new Error(data.error || 'Profil tidak ditemukan.');
                    renderProfileCardResult(result, data.profile);
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        if (id === 'xvip_stalksosmed') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-share-alt" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Cek profil akun sosial media langsung lewat VPS.</p>
                <label for="ssPlatform" class="v-label">Platform</label>
                <select id="ssPlatform" class="v-input">
                    <option value="github">GitHub</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                </select>
                <label for="ssUser" class="v-label">Username</label>
                <input type="text" id="ssUser" class="v-input" placeholder="Username tanpa @ (contoh: Mattz1415)">
                <button type="button" class="v-btn" id="ssBtn"><i class="fas fa-search" aria-hidden="true"></i> Cek Profil via VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('ssBtn').onclick = async () => {
                const btn = document.getElementById('ssBtn');
                const platform = document.getElementById('ssPlatform').value;
                const username = document.getElementById('ssUser').value.trim().replace(/^@/, '');
                const result = document.getElementById('toolResult');
                if (!username) return toast('Masukkan username.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS mencari profil sosial media...</div>`;
                try {
                    const res = await fetch('/api/tools/stalk-social', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ platform, username })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok || !data.profile) throw new Error(data.error || 'Profil tidak ditemukan.');
                    renderProfileCardResult(result, data.profile);
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
        }
    }

    // ============ STANDARD & VPS TOOLS ============
    function showTool(toolId) {
        const body = document.getElementById('toolViewerBody');
        const tool = allToolsData.find((t) => t.id === toolId);
        if (!body || !tool) {
            closeTool();
            return;
        }
        openToolDialog();
        renderTool(body, toolId, tool);
    }

    function safeEvaluateMath(expr) {
        const cleaned = expr.replace(/\s+/g, '');
        if (!/^[0-9+\-*/().%]+$/.test(cleaned)) {
            throw new Error('Hanya angka dan operator + - * / % ( ) yang diizinkan.');
        }
        const result = Function(`"use strict"; return (${cleaned});`)();
        if (typeof result !== 'number' || !Number.isFinite(result)) {
            throw new Error('Hasil perhitungan tidak valid.');
        }
        return result;
    }

    function renderTool(body, toolId, toolMeta) {
        const name = toolMeta?.name || toolId;
        const icon = toolMeta?.icon || 'fa-solid fa-wrench';

        // ===== 1. VPS DNS & WHOIS =====
        if (toolId === 'vps_dns') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Resolusi DNS (A, AAAA, MX, NS, CNAME, TXT) &amp; WHOIS langsung dari VPS Linux.</p>
                <label for="dnsTarget" class="v-label">Nama Domain</label>
                <input type="text" id="dnsTarget" class="v-input" placeholder="contoh: github.com">
                <button type="button" class="v-btn" id="dnsRunBtn"><i class="fas fa-search" aria-hidden="true"></i> Periksa DNS &amp; WHOIS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('dnsRunBtn').onclick = async () => {
                const btn = document.getElementById('dnsRunBtn');
                const target = document.getElementById('dnsTarget').value.trim();
                const result = document.getElementById('toolResult');
                if (!target) return toast('Masukkan domain.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memindai DNS &amp; WHOIS di VPS...</div>`;
                try {
                    const res = await fetch('/api/tools/vps-net', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'dns', target })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal cek DNS.');
                    const recHtml = Object.entries(data.records || {}).map(([k, vals]) => `
                        <div class="vps-kv-item" style="grid-column:span 2;">
                            <span>${escapeHtml(k)}</span>
                            <strong style="font-family:'IBM Plex Mono',monospace;font-size:0.78rem;word-break:break-all;">${escapeHtml(Array.isArray(vals) && vals.length ? vals.join(', ') : '-')}</strong>
                        </div>
                    `).join('');
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <div class="vps-kv-grid">${recHtml}</div>
                            <label class="v-label" style="margin-top:12px;">WHOIS Summary</label>
                            <pre class="vps-code-out">${escapeHtml(data.whois || '-')}</pre>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 2. VPS HTTP & SSL INSPECTOR =====
        if (toolId === 'vps_http') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Inspeksi status HTTP, redirect, latensi, header, &amp; sertifikat TLS/SSL lewat VPS.</p>
                <label for="httpTarget" class="v-label">URL Website</label>
                <input type="url" id="httpTarget" class="v-input" placeholder="https://example.com">
                <button type="button" class="v-btn" id="httpRunBtn"><i class="fas fa-shield-halved" aria-hidden="true"></i> Inspeksi sekarang</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('httpRunBtn').onclick = async () => {
                const btn = document.getElementById('httpRunBtn');
                const target = document.getElementById('httpTarget').value.trim();
                const result = document.getElementById('toolResult');
                if (!target) return toast('Masukkan URL.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memeriksa HTTP &amp; SSL dari VPS...</div>`;
                try {
                    const res = await fetch('/api/tools/vps-net', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'http', target })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal inspeksi HTTP.');
                    const ssl = data.ssl;
                    const headersText = Object.entries(data.headers || {}).map(([k, v]) => `${k}: ${v}`).join('\n');
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <div class="vps-kv-grid">
                                <div class="vps-kv-item"><span>HTTP Status</span><strong>${data.status} ${escapeHtml(data.statusText || '')}</strong></div>
                                <div class="vps-kv-item"><span>Latensi VPS</span><strong>${data.latencyMs} ms</strong></div>
                                ${ssl ? `
                                    <div class="vps-kv-item"><span>TLS / Cipher</span><strong>${escapeHtml(ssl.protocol || '-')}</strong></div>
                                    <div class="vps-kv-item"><span>Masa Berlaku SSL</span><strong>${ssl.daysRemaining !== null ? `${ssl.daysRemaining} hari lagi` : '-'}</strong></div>
                                    <div class="vps-kv-item"><span>Subject CN</span><strong>${escapeHtml(ssl.subjectCN || '-')}</strong></div>
                                    <div class="vps-kv-item"><span>Penerbit (Issuer)</span><strong>${escapeHtml(ssl.issuerO || '-')}</strong></div>
                                ` : ''}
                            </div>
                            <label class="v-label" style="margin-top:12px;">Response Headers</label>
                            <pre class="vps-code-out">${escapeHtml(headersText || '-')}</pre>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 3. VPS IP TRACKER & rDNS =====
        if (toolId === 'vps_ip') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Lacak lokasi, ISP, ASN, koordinat, &amp; Reverse DNS dari IP atau domain publik.</p>
                <label for="ipTarget" class="v-label">IP atau Domain (kosongkan untuk cek IP VPS)</label>
                <input type="text" id="ipTarget" class="v-input" placeholder="Contoh: 1.1.1.1 atau google.com">
                <button type="button" class="v-btn" id="ipRunBtn"><i class="fas fa-location-dot" aria-hidden="true"></i> Lacak IP</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('ipRunBtn').onclick = async () => {
                const btn = document.getElementById('ipRunBtn');
                const target = document.getElementById('ipTarget').value.trim();
                const result = document.getElementById('toolResult');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Melacak informasi IP di VPS...</div>`;
                try {
                    const res = await fetch('/api/tools/vps-net', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'ip', target })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal melacak IP.');
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <div class="vps-kv-grid">
                                <div class="vps-kv-item"><span>Alamat IP</span><strong>${escapeHtml(data.ip)}</strong></div>
                                <div class="vps-kv-item"><span>Negara</span><strong>${escapeHtml(data.country)}</strong></div>
                                <div class="vps-kv-item"><span>Wilayah / Kota</span><strong>${escapeHtml(data.region)} / ${escapeHtml(data.city)}</strong></div>
                                <div class="vps-kv-item"><span>Zona Waktu</span><strong>${escapeHtml(data.timezone)}</strong></div>
                                <div class="vps-kv-item"><span>ISP</span><strong>${escapeHtml(data.isp)}</strong></div>
                                <div class="vps-kv-item"><span>ASN / Org</span><strong>${escapeHtml(data.asn)}</strong></div>
                                <div class="vps-kv-item"><span>Koordinat</span><strong>${escapeHtml(data.coords)}</strong></div>
                                <div class="vps-kv-item"><span>Reverse DNS</span><strong>${escapeHtml((data.reverseDns || []).join(', ') || '-')}</strong></div>
                            </div>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 4. VPS TCP PORT CHECKER =====
        if (toolId === 'vps_port') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Uji keterbukaan port TCP hingga 10 port secara paralel langsung dari VPS.</p>
                <label for="portHost" class="v-label">Domain atau IP Publik</label>
                <input type="text" id="portHost" class="v-input" placeholder="contoh: github.com">
                <label for="portList" class="v-label">Daftar Port (pisahkan koma)</label>
                <input type="text" id="portList" class="v-input" value="80,443,22,21,25,8080">
                <button type="button" class="v-btn" id="portRunBtn"><i class="fas fa-network-wired" aria-hidden="true"></i> Cek Port TCP</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('portRunBtn').onclick = async () => {
                const btn = document.getElementById('portRunBtn');
                const target = document.getElementById('portHost').value.trim();
                const ports = document.getElementById('portList').value.trim();
                const result = document.getElementById('toolResult');
                if (!target) return toast('Masukkan domain atau IP.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memeriksa port TCP dari VPS...</div>`;
                try {
                    const res = await fetch('/api/tools/vps-net', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'port', target, ports })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal cek port.');
                    const rows = (data.results || []).map((r) => `
                        <div class="vps-kv-item">
                            <span>Port ${r.port}</span>
                            <strong>${r.open ? `TERBUKA (${r.latencyMs}ms)` : 'TERTUTUP'}</strong>
                        </div>
                    `).join('');
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">
                                Target: <strong>${escapeHtml(data.host)}</strong> (${escapeHtml(data.ip)})
                            </p>
                            <div class="vps-kv-grid">${rows}</div>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 5. VPS URL SHORTENER =====
        if (toolId === 'vps_shortlink') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Buat tautan pendek permanen /s/kode yang langsung di-redirect oleh VPS ini.</p>
                <label for="shortUrlInput" class="v-label">URL Panjang</label>
                <input type="url" id="shortUrlInput" class="v-input" placeholder="https://example.com/halaman-panjang">
                <label for="shortAliasInput" class="v-label">Alias Custom (Opsional, 3-24 karakter)</label>
                <input type="text" id="shortAliasInput" class="v-input" placeholder="contoh: promo2026">
                <button type="button" class="v-btn" id="shortCreateBtn"><i class="fas fa-link" aria-hidden="true"></i> Buat Shortlink di VPS</button>
                <div id="toolResult" aria-live="polite"></div>
                <div id="shortRecentList" style="margin-top:14px;"></div>
            `;
            const renderRecent = (items) => {
                const el = document.getElementById('shortRecentList');
                if (!el || !Array.isArray(items) || items.length === 0) return;
                const origin = window.location?.origin || '';
                el.innerHTML = `
                    <label class="v-label">Shortlink Terbaru di VPS</label>
                    <div class="owner-list-stack">
                        ${items.slice(0, 6).map((s) => `
                            <div class="owner-list-row">
                                <div class="owner-list-main">
                                    <strong><a href="${escapeHtml(origin)}/s/${escapeHtml(s.code)}" target="_blank" rel="noopener noreferrer">/s/${escapeHtml(s.code)}</a></strong>
                                    <small>${escapeHtml(s.url)}</small>
                                </div>
                                <span class="owner-pill">${s.clicks} klik</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            };
            if (hasBackend) {
                fetch('/api/tools/shortlink').then((r) => r.json()).then((d) => d.ok && renderRecent(d.shortLinks)).catch(() => {});
            }
            document.getElementById('shortCreateBtn').onclick = async () => {
                const btn = document.getElementById('shortCreateBtn');
                const url = document.getElementById('shortUrlInput').value.trim();
                const alias = document.getElementById('shortAliasInput').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL tujuan.');
                btn.disabled = true;
                try {
                    const res = await fetch('/api/tools/shortlink', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url, alias })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal membuat shortlink.');
                    const fullShort = `${window.location.origin}/s/${data.entry.code}`;
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <label for="shortOut" class="v-label">Shortlink Aktif</label>
                            <input type="text" id="shortOut" class="v-input" readonly value="${escapeHtml(fullShort)}" style="font-family:'IBM Plex Mono',monospace;">
                            <div class="owner-action-row">
                                <button type="button" class="v-btn" id="shortCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Link</button>
                                <a href="${escapeHtml(fullShort)}" target="_blank" rel="noopener noreferrer" class="v-btn v-btn-secondary">Buka</a>
                            </div>
                        </div>
                    `;
                    document.getElementById('shortCopyBtn').onclick = () => {
                        navigator.clipboard.writeText(fullShort);
                        toast('Shortlink disalin.');
                    };
                    renderRecent(data.recent || []);
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 6. VPS CODE PASTE =====
        if (toolId === 'vps_paste') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Simpan catatan atau potongan kode ke VPS lalu bagikan tautan /p/id.</p>
                <label for="pasteTitle" class="v-label">Judul Paste</label>
                <input type="text" id="pasteTitle" class="v-input" placeholder="Contoh: Config Nginx">
                <label for="pasteLang" class="v-label">Bahasa / Format</label>
                <select id="pasteLang" class="v-input">
                    <option value="text">Plain Text</option>
                    <option value="javascript">JavaScript / TypeScript</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML / CSS</option>
                    <option value="bash">Bash / Linux</option>
                    <option value="python">Python</option>
                </select>
                <label for="pasteContent" class="v-label">Isi Kode / Catatan</label>
                <textarea id="pasteContent" class="v-input" rows="6" placeholder="Tempel teks atau kode di sini..." style="font-family:'IBM Plex Mono',monospace;font-size:0.82rem;"></textarea>
                <button type="button" class="v-btn" id="pasteSaveBtn"><i class="fas fa-file-code" aria-hidden="true"></i> Simpan ke VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('pasteSaveBtn').onclick = async () => {
                const btn = document.getElementById('pasteSaveBtn');
                const title = document.getElementById('pasteTitle').value.trim();
                const lang = document.getElementById('pasteLang').value;
                const content = document.getElementById('pasteContent').value;
                const result = document.getElementById('toolResult');
                if (!content.trim()) return toast('Isi teks atau kode terlebih dahulu.');
                btn.disabled = true;
                try {
                    const res = await fetch('/api/tools/paste', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, lang, content })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal menyimpan paste.');
                    const fullUrl = `${window.location.origin}/p/${data.paste.id}`;
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <label for="pasteUrlOut" class="v-label">Tautan Paste Tersimpan</label>
                            <input type="text" id="pasteUrlOut" class="v-input" readonly value="${escapeHtml(fullUrl)}" style="font-family:'IBM Plex Mono',monospace;">
                            <div class="owner-action-row">
                                <button type="button" class="v-btn" id="pasteCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin URL</button>
                                <a href="${escapeHtml(fullUrl)}" target="_blank" rel="noopener noreferrer" class="v-btn v-btn-secondary">Buka Paste</a>
                            </div>
                        </div>
                    `;
                    document.getElementById('pasteCopyBtn').onclick = () => {
                        navigator.clipboard.writeText(fullUrl);
                        toast('URL Paste disalin.');
                    };
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 7. VPS IMAGE CONVERTER & COMPRESSOR =====
        if (toolId === 'vps_imgconv') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Ubah format dan kompres ukuran gambar memakai Sharp di VPS.</p>
                <label for="convFile" class="v-label">Pilih File Gambar (maks 10MB)</label>
                <input type="file" id="convFile" accept="image/*" class="v-input">
                <div class="owner-action-row">
                    <div style="flex:1;">
                        <label for="convFmt" class="v-label">Format Output</label>
                        <select id="convFmt" class="v-input">
                            <option value="webp">WebP (Terhemat)</option>
                            <option value="jpeg">JPEG (MozJPEG)</option>
                            <option value="png">PNG</option>
                            <option value="avif">AVIF</option>
                        </select>
                    </div>
                    <div style="flex:1;">
                        <label for="convQual" class="v-label">Kualitas (15-100)</label>
                        <input type="number" id="convQual" class="v-input" min="15" max="100" value="80">
                    </div>
                </div>
                <label for="convWidth" class="v-label">Lebar Maksimal px (0 = asli)</label>
                <input type="number" id="convWidth" class="v-input" min="0" max="3840" value="0">
                <label class="owner-check-row" style="margin-bottom:12px;">
                    <input type="checkbox" id="convGray">
                    <span>Ubah ke Monokrom (Grayscale)</span>
                </label>
                <button type="button" class="v-btn" id="convRunBtn"><i class="fas fa-compress" aria-hidden="true"></i> Konversi di VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('convRunBtn').onclick = async () => {
                const btn = document.getElementById('convRunBtn');
                const fileInput = document.getElementById('convFile');
                const file = fileInput?.files?.[0];
                const result = document.getElementById('toolResult');
                if (!file) return toast('Pilih file gambar terlebih dahulu.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS memproses gambar...</div>`;
                try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('format', document.getElementById('convFmt').value);
                    fd.append('quality', document.getElementById('convQual').value);
                    fd.append('maxWidth', document.getElementById('convWidth').value);
                    fd.append('grayscale', document.getElementById('convGray').checked ? '1' : '0');
                    const res = await fetch('/api/tools/imgconv', { method: 'POST', body: fd });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'HTTP ' + res.status);
                    }
                    const origBytes = Number(res.headers.get('X-Original-Bytes') || file.size);
                    const outBytes = Number(res.headers.get('X-Output-Bytes') || 0);
                    const dims = res.headers.get('X-Output-Dimensions') || '-';
                    const ext = res.headers.get('X-Output-Ext') || 'webp';
                    const savedPct = origBytes > 0 ? Math.round((1 - outBytes / origBytes) * 100) : 0;
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    result.innerHTML = `
                        <div class="result-box">
                            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">
                                ${(origBytes / 1024).toFixed(1)} KB → <strong>${(outBytes / 1024).toFixed(1)} KB</strong> (${savedPct >= 0 ? `hemat ${savedPct}%` : `+${Math.abs(savedPct)}%`}) • ${escapeHtml(dims)}
                            </p>
                            <img src="${url}" width="480" height="300" alt="Hasil konversi gambar" class="result-media">
                            <a href="${url}" download="converted_${Date.now()}.${escapeHtml(ext)}" class="v-btn">
                                <i class="fas fa-download" aria-hidden="true"></i> Unduh .${escapeHtml(ext.toUpperCase())}
                            </a>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 8. VPS SERVER TELEMETRY =====
        if (toolId === 'vps_status') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Info CPU, RAM, disk, dan uptime server Linux yang menjalankan MattzLM.</p>
                <button type="button" class="v-btn" id="vpsRefreshBtn"><i class="fas fa-rotate" aria-hidden="true"></i> Muat Ulang Telemetri</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            const loadStatus = async () => {
                const btn = document.getElementById('vpsRefreshBtn');
                const result = document.getElementById('toolResult');
                if (btn) btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Membaca telemetri VPS...</div>`;
                try {
                    const res = await fetch('/api/tools/vps-status', { cache: 'no-store' });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error('Gagal membaca telemetri VPS.');
                    const s = data.server;
                    const upH = Math.floor(s.uptimeSec / 3600);
                    const upM = Math.floor((s.uptimeSec % 3600) / 60);
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <div class="vps-kv-grid">
                                <div class="vps-kv-item"><span>Status Server</span><strong>${escapeHtml(data.status)}</strong></div>
                                <div class="vps-kv-item"><span>OS Kernel</span><strong>${escapeHtml(s.os)}</strong></div>
                                <div class="vps-kv-item"><span>Node.js</span><strong>${escapeHtml(s.node)}</strong></div>
                                <div class="vps-kv-item"><span>Uptime</span><strong>${upH} jam ${upM} mnt</strong></div>
                                <div class="vps-kv-item"><span>CPU / Load</span><strong>${s.cpuCores} core • ${escapeHtml((s.loadAvg || []).join(' / '))}</strong></div>
                                <div class="vps-kv-item"><span>RAM VPS</span><strong>${s.ramPercent}% (${s.ramUsedMb}/${s.ramTotalMb} MB)</strong></div>
                                <div class="vps-kv-item"><span>Disk Root (/)</span><strong>${escapeHtml(s.disk)}</strong></div>
                                <div class="vps-kv-item"><span>Engine yt-dlp</span><strong>${escapeHtml(s.ytDlp)}</strong></div>
                                <div class="vps-kv-item"><span>Shortlink / Paste</span><strong>${s.shortLinksCount} / ${s.pastesCount}</strong></div>
                                <div class="vps-kv-item"><span>Total Kunjungan</span><strong>${s.visits}</strong></div>
                            </div>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    if (btn) btn.disabled = false;
                }
            };
            document.getElementById('vpsRefreshBtn').onclick = loadStatus;
            loadStatus();
            return;
        }

        // ===== 9. VPS DOWNLOADERS (IG / TikTok / YouTube) =====
        if (toolId === 'instagram' || toolId === 'tiktok' || toolId === 'youtube') {
            const ph = {
                instagram: 'https://www.instagram.com/reel/...',
                tiktok: 'https://www.tiktok.com/@user/video/...',
                youtube: 'https://www.youtube.com/watch?v=...'
            }[toolId];
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Diproses langsung oleh engine VPS (yt-dlp + stream proxy) tanpa API pihak ketiga mati.</p>
                <label for="dlUrlInput" class="v-label">Tautan ${escapeHtml(name)}</label>
                <input type="url" id="dlUrlInput" class="v-input" placeholder="${escapeHtml(ph)}">
                <button type="button" class="v-btn" id="dlRunBtn"><i class="fas fa-download" aria-hidden="true"></i> Ekstrak &amp; Unduh via VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('dlRunBtn').onclick = async () => {
                const btn = document.getElementById('dlRunBtn');
                const url = document.getElementById('dlUrlInput').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL terlebih dahulu.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS mengekstrak media ${escapeHtml(name)}...</div>`;
                try {
                    const res = await fetch('/api/tools/download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ platform: toolId, url })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) throw new Error(data.error || 'Media gagal diekstrak.');
                    renderDownloadResult(result, data, name);
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 10. VPS IMAGE MAKERS (IQC / Tanya Ustadz / Sertifikat) =====
        if (toolId === 'iqc' || toolId === 'tanyaustadz' || toolId === 'sertifikat') {
            const extraFields = toolId === 'iqc'
                ? `
                    <div class="owner-action-row">
                        <div style="flex:1;"><label for="mkExtra1" class="v-label">Operator</label><input type="text" id="mkExtra1" class="v-input" value="MattzLM"></div>
                        <div style="flex:1;"><label for="mkExtra2" class="v-label">Jam</label><input type="text" id="mkExtra2" class="v-input" value="12:30"></div>
                        <div style="flex:1;"><label for="mkExtra3" class="v-label">Baterai %</label><input type="number" id="mkExtra3" class="v-input" value="85"></div>
                    </div>
                `
                : (toolId === 'tanyaustadz'
                    ? `<label for="mkExtra1" class="v-label">Jawaban Ustadz (Opsional)</label><input type="text" id="mkExtra1" class="v-input" placeholder="Kosongkan untuk jawaban default">`
                    : `<label for="mkExtra1" class="v-label">Keterangan Penghargaan</label><input type="text" id="mkExtra1" class="v-input" value="Atas dedikasi terbaik di MattzLM Deck"><label for="mkExtra2" class="v-label">Disahkan Oleh</label><input type="text" id="mkExtra2" class="v-input" value="MattzLM Official">`);

            const mainLabel = toolId === 'iqc' ? 'Teks Kutipan IQC' : (toolId === 'tanyaustadz' ? 'Pertanyaan Jamaah' : 'Nama Penerima Sertifikat');
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Dirender langsung menjadi PNG HD di VPS menggunakan Sharp.</p>
                <label for="mkText" class="v-label">${escapeHtml(mainLabel)}</label>
                <input type="text" id="mkText" class="v-input" placeholder="Ketik teks di sini...">
                ${extraFields}
                <button type="button" class="v-btn" id="mkRunBtn"><i class="fas fa-image" aria-hidden="true"></i> Render PNG di VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('mkRunBtn').onclick = async () => {
                const btn = document.getElementById('mkRunBtn');
                const text = document.getElementById('mkText').value.trim();
                const result = document.getElementById('toolResult');
                if (!text) return toast('Masukkan teks terlebih dahulu.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS sedang merender gambar PNG...</div>`;
                try {
                    const payload = { type: toolId, text };
                    if (toolId === 'iqc') {
                        payload.provider = document.getElementById('mkExtra1')?.value || 'MattzLM';
                        payload.time = document.getElementById('mkExtra2')?.value || '12:30';
                        payload.battery = document.getElementById('mkExtra3')?.value || '85';
                    } else if (toolId === 'tanyaustadz') {
                        payload.answer = document.getElementById('mkExtra1')?.value || '';
                    } else {
                        payload.award = document.getElementById('mkExtra1')?.value || '';
                        payload.issuer = document.getElementById('mkExtra2')?.value || '';
                    }
                    const res = await fetch('/api/tools/maker', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'HTTP ' + res.status);
                    }
                    const blob = await res.blob();
                    const imgUrl = URL.createObjectURL(blob);
                    result.innerHTML = `
                        <div class="result-box">
                            <img src="${imgUrl}" width="600" height="400" alt="Hasil ${escapeHtml(name)}" class="result-media">
                            <a href="${imgUrl}" download="${escapeHtml(toolId)}_${Date.now()}.png" class="v-btn">
                                <i class="fas fa-download" aria-hidden="true"></i> Unduh PNG HD
                            </a>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 11. VPS QR GENERATOR =====
        if (toolId === 'qr') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Buat QR Code tajam (PNG / SVG) langsung di server VPS tanpa pihak ketiga.</p>
                <label for="qrText" class="v-label">Teks atau URL</label>
                <input type="text" id="qrText" class="v-input" placeholder="https://github.com/Mattz1415">
                <div class="owner-action-row">
                    <div style="flex:1;">
                        <label for="qrSize" class="v-label">Ukuran (px)</label>
                        <select id="qrSize" class="v-input">
                            <option value="320">320 x 320</option>
                            <option value="512" selected>512 x 512</option>
                            <option value="800">800 x 800</option>
                        </select>
                    </div>
                    <div style="flex:1;">
                        <label for="qrFmt" class="v-label">Format</label>
                        <select id="qrFmt" class="v-input">
                            <option value="png">PNG</option>
                            <option value="svg">SVG Vektor</option>
                        </select>
                    </div>
                </div>
                <button type="button" class="v-btn" id="qrRunBtn"><i class="fas fa-qrcode" aria-hidden="true"></i> Generate QR di VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('qrRunBtn').onclick = async () => {
                const btn = document.getElementById('qrRunBtn');
                const text = document.getElementById('qrText').value.trim();
                const size = document.getElementById('qrSize').value;
                const format = document.getElementById('qrFmt').value;
                const result = document.getElementById('toolResult');
                if (!text) return toast('Masukkan teks atau URL.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Membuat QR Code di VPS...</div>`;
                try {
                    const url = `/api/tools/qr?text=${encodeURIComponent(text)}&size=${encodeURIComponent(size)}&format=${encodeURIComponent(format)}`;
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('Gagal membuat QR Code.');
                    const blob = await res.blob();
                    const objUrl = URL.createObjectURL(blob);
                    result.innerHTML = `
                        <div class="result-box">
                            <img src="${objUrl}" width="320" height="320" alt="QR Code untuk ${escapeHtml(text)}" class="result-media" style="max-width:280px;background:#ffffff;padding:8px;">
                            <a href="${objUrl}" download="qr_${Date.now()}.${escapeHtml(format)}" class="v-btn">
                                <i class="fas fa-download" aria-hidden="true"></i> Unduh ${escapeHtml(format.toUpperCase())}
                            </a>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 12. VPS REMOVE BG =====
        if (toolId === 'removebg') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Hapus latar belakang foto menjadi PNG transparan lewat engine Sharp di VPS (upload file atau URL).</p>
                <label for="rbgFile" class="v-label">Unggah File Foto (Opsional jika pakai URL)</label>
                <input type="file" id="rbgFile" accept="image/*" class="v-input">
                <label for="rbgUrl" class="v-label">Atau Masukkan URL Gambar Publik</label>
                <input type="url" id="rbgUrl" class="v-input" placeholder="https://example.com/foto.jpg">
                <label for="rbgTol" class="v-label">Sensitivitas Warna Latar (8 - 100)</label>
                <input type="number" id="rbgTol" class="v-input" min="8" max="100" value="42">
                <button type="button" class="v-btn" id="rbgRunBtn"><i class="fas fa-eraser" aria-hidden="true"></i> Hapus Background di VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('rbgRunBtn').onclick = async () => {
                const btn = document.getElementById('rbgRunBtn');
                const file = document.getElementById('rbgFile')?.files?.[0];
                const url = document.getElementById('rbgUrl').value.trim();
                const tolerance = document.getElementById('rbgTol').value;
                const result = document.getElementById('toolResult');
                if (!file && !url) return toast('Pilih file foto atau masukkan URL gambar.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS memproses segmentasi latar belakang...</div>`;
                try {
                    const fd = new FormData();
                    if (file) fd.append('file', file);
                    if (url) fd.append('url', url);
                    fd.append('tolerance', tolerance);
                    const res = await fetch('/api/tools/removebg', { method: 'POST', body: fd });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'HTTP ' + res.status);
                    }
                    const blob = await res.blob();
                    const imgUrl = URL.createObjectURL(blob);
                    result.innerHTML = `
                        <div class="result-box">
                            <div class="checkerboard-preview">
                                <img src="${imgUrl}" width="400" height="400" alt="Hasil hapus background" class="result-media" style="margin-bottom:0;">
                            </div>
                            <a href="${imgUrl}" download="nobg_${Date.now()}.png" class="v-btn" style="margin-top:12px;">
                                <i class="fas fa-download" aria-hidden="true"></i> Unduh PNG Transparan
                            </a>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 13. VPS IMAGE ENHANCER =====
        if (toolId === 'enhancer') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Upscale Lanczos3 2x, normalisasi kontras, denoise, &amp; penajaman foto di VPS.</p>
                <label for="enhFile" class="v-label">Unggah File Foto (Opsional jika pakai URL)</label>
                <input type="file" id="enhFile" accept="image/*" class="v-input">
                <label for="enhUrl" class="v-label">Atau Masukkan URL Gambar Publik</label>
                <input type="url" id="enhUrl" class="v-input" placeholder="https://example.com/foto.jpg">
                <div class="owner-action-row">
                    <div style="flex:1;">
                        <label for="enhScale" class="v-label">Upscale</label>
                        <select id="enhScale" class="v-input">
                            <option value="1.5">1.5x HD</option>
                            <option value="2" selected>2.0x Ultra</option>
                        </select>
                    </div>
                    <div style="flex:1;">
                        <label for="enhSharp" class="v-label">Ketajaman (0.5 - 3)</label>
                        <input type="number" id="enhSharp" class="v-input" step="0.2" min="0.5" max="3" value="1.4">
                    </div>
                </div>
                <label class="owner-check-row" style="margin-bottom:12px;">
                    <input type="checkbox" id="enhDenoise" checked>
                    <span>Aktifkan reduksi noise (Median Filter)</span>
                </label>
                <button type="button" class="v-btn" id="enhRunBtn"><i class="fas fa-sliders" aria-hidden="true"></i> Pertajam &amp; Upscale di VPS</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('enhRunBtn').onclick = async () => {
                const btn = document.getElementById('enhRunBtn');
                const file = document.getElementById('enhFile')?.files?.[0];
                const url = document.getElementById('enhUrl').value.trim();
                const result = document.getElementById('toolResult');
                if (!file && !url) return toast('Pilih file foto atau masukkan URL gambar.');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>VPS meningkatkan resolusi &amp; ketajaman foto...</div>`;
                try {
                    const fd = new FormData();
                    if (file) fd.append('file', file);
                    if (url) fd.append('url', url);
                    fd.append('scale', document.getElementById('enhScale').value);
                    fd.append('sharpen', document.getElementById('enhSharp').value);
                    fd.append('denoise', document.getElementById('enhDenoise').checked ? '1' : '0');
                    const res = await fetch('/api/tools/enhance', { method: 'POST', body: fd });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'HTTP ' + res.status);
                    }
                    const origDim = res.headers.get('X-Original-Dimensions') || '-';
                    const newDim = res.headers.get('X-Enhanced-Dimensions') || '-';
                    const blob = await res.blob();
                    const imgUrl = URL.createObjectURL(blob);
                    result.innerHTML = `
                        <div class="result-box">
                            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">
                                Resolusi: ${escapeHtml(origDim)} → <strong>${escapeHtml(newDim)}</strong>
                            </p>
                            <img src="${imgUrl}" width="480" height="340" alt="Hasil enhancer gambar" class="result-media">
                            <a href="${imgUrl}" download="enhanced_${Date.now()}.png" class="v-btn">
                                <i class="fas fa-download" aria-hidden="true"></i> Unduh PNG HD
                            </a>
                        </div>
                    `;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        // ===== 14. JSON FORMATTER & VALIDATOR =====
        if (toolId === 'dev_json') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Validasi, rapikan (pretty print), atau minify teks JSON secara cepat.</p>
                <label for="jsonIn" class="v-label">Input JSON</label>
                <textarea id="jsonIn" class="v-input" rows="7" placeholder='{"app":"MattzLM","vps":true}' style="font-family:'IBM Plex Mono',monospace;font-size:0.82rem;"></textarea>
                <div class="owner-action-row">
                    <button type="button" class="v-btn" id="jsonPrettyBtn">Rapikan (2 Spasi)</button>
                    <button type="button" class="v-btn v-btn-secondary" id="jsonMinBtn">Minify</button>
                </div>
                <div id="toolResult" aria-live="polite"></div>
            `;
            const runJson = (pretty) => {
                const raw = document.getElementById('jsonIn').value.trim();
                const result = document.getElementById('toolResult');
                if (!raw) return toast('Masukkan JSON terlebih dahulu.');
                try {
                    const parsed = JSON.parse(raw);
                    const formatted = pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <label for="jsonOut" class="v-label">JSON Valid (${formatted.length} karakter)</label>
                            <textarea id="jsonOut" class="v-input" rows="7" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.8rem;">${escapeHtml(formatted)}</textarea>
                            <button type="button" class="v-btn" id="jsonCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Hasil</button>
                        </div>
                    `;
                    document.getElementById('jsonCopyBtn').onclick = () => {
                        navigator.clipboard.writeText(formatted);
                        toast('JSON disalin.');
                    };
                } catch (err) {
                    result.innerHTML = `<div class="result-box result-box-error">JSON tidak valid: ${escapeHtml(err.message)}</div>`;
                }
            };
            document.getElementById('jsonPrettyBtn').onclick = () => runJson(true);
            document.getElementById('jsonMinBtn').onclick = () => runJson(false);
            return;
        }

        // ===== 15. BASE64 / URL / SHA-256 =====
        if (toolId === 'dev_encode') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Utilitas encode/decode Base64 (UTF-8), URL Component, &amp; Hash SHA-256.</p>
                <label for="encMode" class="v-label">Mode Operasi</label>
                <select id="encMode" class="v-input">
                    <option value="b64e">Base64 Encode</option>
                    <option value="b64d">Base64 Decode</option>
                    <option value="urle">URL Encode</option>
                    <option value="urld">URL Decode</option>
                    <option value="sha256">SHA-256 Hash</option>
                </select>
                <label for="encIn" class="v-label">Input Teks</label>
                <textarea id="encIn" class="v-input" rows="4" placeholder="Ketik teks di sini..."></textarea>
                <button type="button" class="v-btn" id="encRunBtn"><i class="fas fa-play" aria-hidden="true"></i> Proses</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('encRunBtn').onclick = async () => {
                const mode = document.getElementById('encMode').value;
                const val = document.getElementById('encIn').value;
                const result = document.getElementById('toolResult');
                if (!val) return toast('Masukkan teks terlebih dahulu.');
                try {
                    let out = '';
                    if (mode === 'b64e') {
                        const bytes = new TextEncoder().encode(val);
                        out = btoa(String.fromCharCode(...bytes));
                    } else if (mode === 'b64d') {
                        const bin = atob(val.trim());
                        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
                        out = new TextDecoder().decode(bytes);
                    } else if (mode === 'urle') {
                        out = encodeURIComponent(val);
                    } else if (mode === 'urld') {
                        out = decodeURIComponent(val);
                    } else if (mode === 'sha256') {
                        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
                        out = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
                    }
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <label for="encOut" class="v-label">Hasil</label>
                            <textarea id="encOut" class="v-input" rows="4" readonly style="font-family:'IBM Plex Mono',monospace;font-size:0.82rem;">${escapeHtml(out)}</textarea>
                            <button type="button" class="v-btn" id="encCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin</button>
                        </div>
                    `;
                    document.getElementById('encCopyBtn').onclick = () => {
                        navigator.clipboard.writeText(out);
                        toast('Hasil disalin.');
                    };
                } catch (err) {
                    result.innerHTML = `<div class="result-box result-box-error">Gagal memproses: ${escapeHtml(err.message)}</div>`;
                }
            };
            return;
        }

        // ===== 16. HAND TRAIL CANVAS (replaces dead 404 kaze-hand-track link) =====
        if (toolId === 'handtrack') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:12px;">Gerakkan kursor atau sentuh kanvas untuk membuat pola gestur partikel 3D interaktif.</p>
                <canvas id="handTrailCanvas" width="480" height="300" style="width:100%;height:260px;background:#0a0a0a;border:1px solid var(--border-color);border-radius:14px;display:block;touch-action:none;"></canvas>
                <div class="owner-action-row" style="margin-top:10px;">
                    <button type="button" class="v-btn v-btn-secondary" id="handClearBtn"><i class="fas fa-eraser" aria-hidden="true"></i> Bersihkan Kanvas</button>
                    <button type="button" class="v-btn" id="handSaveBtn"><i class="fas fa-download" aria-hidden="true"></i> Simpan PNG</button>
                </div>
            `;
            const canvas = document.getElementById('handTrailCanvas');
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext('2d');
                const sparks = [];
                let raf = null;
                const emit = (x, y) => {
                    for (let i = 0; i < 4; i++) {
                        sparks.push({
                            x,
                            y,
                            vx: (Math.random() - 0.5) * 3.2,
                            vy: (Math.random() - 0.5) * 3.2,
                            life: 1,
                            r: 2 + Math.random() * 5
                        });
                    }
                };
                const onMove = (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
                    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
                    emit(x, y);
                };
                canvas.addEventListener('pointermove', onMove);
                canvas.addEventListener('pointerdown', onMove);
                const tick = () => {
                    ctx.fillStyle = 'rgba(10, 10, 10, 0.16)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    for (let i = sparks.length - 1; i >= 0; i--) {
                        const s = sparks[i];
                        s.x += s.vx;
                        s.y += s.vy;
                        s.life -= 0.025;
                        if (s.life <= 0) {
                            sparks.splice(i, 1);
                            continue;
                        }
                        ctx.beginPath();
                        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(245, 245, 245, ${s.life.toFixed(2)})`;
                        ctx.fill();
                    }
                    raf = requestAnimationFrame(tick);
                };
                raf = requestAnimationFrame(tick);
                activeToolCleanup = () => {
                    if (raf !== null) cancelAnimationFrame(raf);
                    canvas.removeEventListener('pointermove', onMove);
                    canvas.removeEventListener('pointerdown', onMove);
                };
                document.getElementById('handClearBtn').onclick = () => {
                    sparks.length = 0;
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                };
                document.getElementById('handSaveBtn').onclick = () => {
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = `hand_trail_${Date.now()}.png`;
                    a.click();
                };
            }
            return;
        }

        // ===== 17. FAKE IG =====
        if (toolId === 'fakeig') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Buat kartu simulasi postingan Instagram dan unduh sebagai PNG.</p>
                <label for="fakeIgUser" class="v-label">Username IG</label>
                <input type="text" id="fakeIgUser" class="v-input" placeholder="mattzlm_official" value="mattzlm_deck">
                <label for="fakeIgCaption" class="v-label">Caption Postingan</label>
                <input type="text" id="fakeIgCaption" class="v-input" placeholder="Tulis caption postingan...">
                <label for="fakeIgLikes" class="v-label">Jumlah Suka</label>
                <input type="number" id="fakeIgLikes" class="v-input" value="1420">
                <button type="button" class="v-btn" id="fakeIgGenBtn"><i class="fas fa-image" aria-hidden="true"></i> Buat Kartu Fake IG</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('fakeIgGenBtn').onclick = () => {
                const user = document.getElementById('fakeIgUser').value.trim() || 'mattzlm_deck';
                const caption = document.getElementById('fakeIgCaption').value.trim() || 'MattzLM web tools.';
                const likes = Number(document.getElementById('fakeIgLikes').value || 0).toLocaleString('id-ID');

                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 420;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, 600, 420);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(20, 20, 560, 380);

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(58, 56, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#0a0a0a';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(user.charAt(0).toUpperCase(), 52, 62);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(user, 90, 54);
                ctx.fillStyle = '#a3a3a3';
                ctx.font = '12px sans-serif';
                ctx.fillText('MattzLM Studio', 90, 72);

                const grad = ctx.createLinearGradient(36, 94, 564, 290);
                grad.addColorStop(0, '#262626');
                grad.addColorStop(1, '#525252');
                ctx.fillStyle = grad;
                ctx.fillRect(36, 94, 528, 196);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('MATTZLM // VPS', 300, 200);
                ctx.textAlign = 'left';

                ctx.fillStyle = '#f5f5f5';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(`${likes} suka`, 36, 322);
                ctx.font = '14px sans-serif';
                ctx.fillStyle = '#d4d4d4';
                ctx.fillText(`${user}: ${caption.slice(0, 56)}`, 36, 348);
                ctx.fillStyle = '#8a8a8a';
                ctx.font = '11px sans-serif';
                ctx.fillText('SIMULASI MOCKUP • MATTZLM', 36, 380);

                renderCanvasDownloadResult('toolResult', canvas.toDataURL('image/png'), `Simulasi Fake IG oleh ${user}`, `fake_ig_${Date.now()}.png`);
            };
            return;
        }

        // ===== 18. LOCAL UTILITIES (calc / pwgen / morse / brat) =====
        const placeholderMap = {
            calc: 'Contoh: (125 * 4) + 50',
            pwgen: 'Opsional: label catatan (klik Proses untuk buat sandi)',
            morse: 'Ketik teks atau kode morse (... --- ...)',
            brat: 'Ketik teks untuk poster BRAT PNG'
        };

        body.innerHTML = `
            <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
            <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Masukkan parameter lalu klik tombol Proses.</p>
            <div id="toolInputArea">
                <label for="toolInput" class="v-label">Input Parameter</label>
                <input type="text" id="toolInput" class="v-input" placeholder="${escapeHtml(placeholderMap[toolId] || 'Masukkan teks...')}">
                <button type="button" class="v-btn" id="toolProcessBtn"><i class="fas fa-play" aria-hidden="true"></i> Proses</button>
            </div>
            <div id="toolResult" aria-live="polite"></div>
        `;

        document.getElementById('toolProcessBtn').onclick = async () => {
            const input = document.getElementById('toolInput').value.trim();
            const result = document.getElementById('toolResult');

            if (toolId !== 'pwgen' && !input) {
                toast('Masukkan input terlebih dahulu.');
                document.getElementById('toolInput')?.focus();
                return;
            }

            if (toolId === 'calc') {
                try {
                    const res = safeEvaluateMath(input);
                    result.innerHTML = `<div class="result-box" style="font-weight:700;font-size:1.25rem;color:var(--theme-primary-light);">= ${res}</div>`;
                } catch (err) {
                    result.innerHTML = `<div class="result-box result-box-error">${escapeHtml(err.message)}</div>`;
                }
                return;
            }

            if (toolId === 'pwgen') {
                const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
                const arr = new Uint32Array(16);
                crypto.getRandomValues(arr);
                let out = '';
                for (let i = 0; i < arr.length; i++) {
                    out += pool.charAt(arr[i] % pool.length);
                }
                result.innerHTML = `
                    <div class="result-box">
                        <label for="pwOutField" class="v-label">Password Dihasilkan</label>
                        <input type="text" id="pwOutField" class="v-input" readonly value="${escapeHtml(out)}" style="text-align:center;font-family:'IBM Plex Mono',monospace;">
                        <button type="button" class="v-btn" id="pwCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Password</button>
                    </div>
                `;
                document.getElementById('pwCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(out);
                    toast('Password disalin ke clipboard.');
                };
                return;
            }

            if (toolId === 'morse') {
                const dict = {
                    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
                    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
                    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
                    Y: '-.--', Z: '--..', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
                    6: '-....', 7: '--...', 8: '---..', 9: '----.', 0: '-----', ' ': '/'
                };
                const rev = Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k]));
                const isMorseInput = /^[.\-\s/]+$/.test(input);
                const converted = isMorseInput
                    ? input.split(/\s+/).map((tok) => rev[tok] || tok).join('')
                    : input.toUpperCase().split('').map((c) => dict[c] || c).join(' ');
                result.innerHTML = `<div class="result-box"><p style="font-family:'IBM Plex Mono',monospace;font-size:1.1rem;font-weight:700;word-break:break-word;">${escapeHtml(converted)}</p></div>`;
                return;
            }

            if (toolId === 'brat') {
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 300;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, 600, 300);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 44px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const words = input.split(/\s+/);
                const lines = [];
                let i = 0;
                while (i < words.length) {
                    let line = '';
                    while (i < words.length && (line + words[i]).length < 20) {
                        line += (line ? ' ' : '') + words[i];
                        i++;
                    }
                    if (!line) {
                        line = words[i].slice(0, 20);
                        i++;
                    }
                    lines.push(line);
                }
                let y = 150 - ((lines.length - 1) * 28);
                lines.forEach((l) => {
                    ctx.fillText(l, 300, y);
                    y += 56;
                });
                renderCanvasDownloadResult('toolResult', canvas.toDataURL('image/png'), `Poster BRAT: ${input}`, `brat_${Date.now()}.png`);
                return;
            }

            result.innerHTML = `<div class="result-box">Modul ${escapeHtml(toolId)} siap dijalankan.</div>`;
        };
    }

    function loadTelegramTools() {
        const tools = getTelegramToolsList();
        const grid = document.getElementById('telegramToolsGrid');
        if (!grid) return;

        if (tools.length === 0) {
            grid.innerHTML = `
                <div class="empty-state-box">
                    <i class="fas fa-plug" aria-hidden="true"></i>
                    <p>Belum ada tools custom dari Panel Owner.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = tools
            .map((tool, idx) =>
                buildToolCardHtml(
                    { ...tool, isTelegram: true },
                    idx,
                    { isExternal: true, headingTag: 'h3' }
                )
            )
            .join('');
    }

    function showPage(id) {
        const pages = document.querySelectorAll('.page');
        pages.forEach((p) => {
            const active = p.id === id;
            p.hidden = !active;
            p.classList.toggle('active', active);
        });

        document.querySelectorAll('.bottom-nav .nav-item, .anime-rail .rail-item').forEach((navBtn) => {
            if (!navBtn.dataset || !navBtn.dataset.page) return;
            const active = navBtn.dataset.page === id;
            navBtn.classList.toggle('active', active);
            if (active) {
                navBtn.setAttribute('aria-current', 'page');
            } else {
                navBtn.removeAttribute('aria-current');
            }
        });

        const meta = PAGE_META[id] || PAGE_META.homePage;
        const h1 = document.getElementById('workspaceHeading');
        const sub = document.getElementById('workspaceSub');
        if (h1) h1.textContent = meta.title;
        if (sub) sub.textContent = meta.sub;

        if (id === 'homePage') {
            const popular = getFilteredTools().slice(0, 5);
            renderGrid('popularGrid', popular, false, { allowFeatured: true, headingTag: 'h3' });
            loadTelegramTools();
        } else if (id === 'toolsPage') {
            const activeCat = document.querySelector('.category-tab.active')?.dataset?.category || 'all';
            const q = document.getElementById('searchInput')?.value || '';
            renderCategory(activeCat, q);
            updateCategoryCounts();
        } else if (id === 'chatPage') {
            loadChatMessages();
        }
    }

    function toggleSidebar() {
        // Navigasi desktop menggunakan left rail permanen & mobile menggunakan bottom dock.
    }

    // ============ EVENT DELEGATION & HANDLERS ============
    bindListener(document, 'click', (e) => {
        const target = e.target;
        if (!target || typeof target.closest !== 'function') return;

        const passToggle = target.closest('[data-toggle-pass]');
        if (passToggle) {
            const targetId = passToggle.getAttribute('data-toggle-pass');
            const input = targetId ? document.getElementById(targetId) : null;
            if (input) {
                const nextType = input.type === 'password' ? 'text' : 'password';
                input.type = nextType;
                const pressed = nextType === 'text';
                passToggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
                const icon = passToggle.querySelector('i');
                if (icon) icon.className = pressed ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
            return;
        }

        const resetSearchBtn = target.closest('[data-reset-search]');
        if (resetSearchBtn) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            const activeCat = document.querySelector('.category-tab.active')?.dataset?.category || 'all';
            renderCategory(activeCat, '');
            return;
        }

        const deleteUserBtn = target.closest('[data-delete-user]');
        if (deleteUserBtn) {
            const uname = deleteUserBtn.getAttribute('data-delete-user');
            if (uname) ownerDeleteAccount(uname);
            return;
        }

        const toolCard = target.closest('.tools-card[data-action-type]');
        if (toolCard) {
            const actionType = toolCard.getAttribute('data-action-type');
            const id = toolCard.getAttribute('data-tool-id');
            const name = toolCard.getAttribute('data-tool-name');
            const url = toolCard.getAttribute('data-tool-url');
            if (actionType === 'xvip') {
                showXvipMessage(name, id);
            } else if (actionType === 'preview') {
                openPreview(url || '#', name);
            } else if (id) {
                showTool(id);
            }
        }
    });

    document.querySelectorAll('.bottom-nav .nav-item[data-page], .anime-rail .rail-item[data-page]').forEach((el) => {
        bindListener(el, 'click', function () {
            showPage(this.dataset.page);
        });
    });

    document.querySelectorAll('.category-tab[data-category]').forEach((tab) => {
        bindListener(tab, 'click', function () {
            const q = document.getElementById('searchInput')?.value || '';
            renderCategory(this.dataset.category, q);
        });
    });

    document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
        bindListener(tablist, 'keydown', (e) => {
            const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
            if (tabs.length === 0) return;
            const currentIdx = tabs.indexOf(document.activeElement);
            if (currentIdx === -1) return;
            let nextIdx = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIdx = (currentIdx + 1) % tabs.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
            } else if (e.key === 'Home') {
                nextIdx = 0;
            } else if (e.key === 'End') {
                nextIdx = tabs.length - 1;
            }
            if (nextIdx !== -1) {
                e.preventDefault();
                tabs[nextIdx].focus();
                tabs[nextIdx].click();
            }
        });
    });

    bindListener(document.getElementById('searchInput'), 'input', function () {
        const activeCat = document.querySelector('.category-tab.active')?.dataset?.category || 'all';
        renderCategory(activeCat, this.value);
    });

    bindListener(document, 'keydown', (e) => {
        const viewer = document.getElementById('toolViewer');
        const preview = document.getElementById('previewOverlay');

        if (preview && !preview.hidden) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closePreview();
                return;
            }
            handleFocusTrap(preview, e);
            return;
        }

        if (viewer && !viewer.hidden) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeTool();
                return;
            }
            handleFocusTrap(viewer, e);
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            const appWrap = document.getElementById('appWrap');
            if (appWrap && !appWrap.hidden) {
                e.preventDefault();
                showPage('toolsPage');
                scheduleTimeout(() => document.getElementById('searchInput')?.focus(), 40);
            }
        }
    });

    bindListener(document.getElementById('chatSendBtn'), 'click', sendChatMessage);
    bindListener(document.getElementById('chatInput'), 'keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendChatMessage();
        }
    });

    bindListener(document.getElementById('toolViewer'), 'click', function (e) {
        if (e.target === this) closeTool();
    });

    // ============ QUICK INLINE OWNER PANEL ACTIONS (synced to VPS APIs) ============
    function isCurrentOwner() {
        const session = localStorage.getItem('vip_session');
        return getCurrentUserRole(session) === 'owner';
    }

    function renderOwnerUsersList() {
        const listEl = document.getElementById('ownerUsersList');
        if (!listEl) return;

        if (hasBackend && isCurrentOwner()) {
            const fetchOpts = { cache: 'no-store' };
            if (abortController) fetchOpts.signal = abortController.signal;
            fetch('/api/owner/overview', fetchOpts)
                .then((r) => r.json())
                .then((data) => {
                    if (disposed || !data?.ok || !Array.isArray(data.users)) return;
                    listEl.innerHTML = data.users.map((info) => `
                        <div class="owner-user-row">
                            <span>${escapeHtml(info.username)} <small style="color:var(--text-muted);">(${escapeHtml(info.role)} • ${escapeHtml(info.provider)})</small></span>
                            ${info.username === 'matt'
                                ? '<span class="value role" style="font-size:0.75rem;color:var(--status-warn);font-weight:700;">DEFAULT OWNER</span>'
                                : `<button type="button" class="btn-delete-user" data-delete-user="${escapeHtml(info.username)}">Hapus</button>`
                            }
                        </div>
                    `).join('');
                })
                .catch(() => {});
            return;
        }

        const users = getUsers();
        listEl.innerHTML = Object.entries(users).map(([uname, info]) => `
            <div class="owner-user-row">
                <span>${escapeHtml(uname)} <small style="color:var(--text-muted);">(${escapeHtml(info.role || 'member')})</small></span>
                ${uname === 'matt'
                    ? '<span class="value role" style="font-size:0.75rem;color:var(--status-warn);font-weight:700;">DEFAULT OWNER</span>'
                    : `<button type="button" class="btn-delete-user" data-delete-user="${escapeHtml(uname)}">Hapus</button>`
                }
            </div>
        `).join('');
    }

    function ownerAddTool() {
        if (!isCurrentOwner()) return toast('Khusus Owner.');
        const nameEl = document.getElementById('ownerToolName');
        const urlEl = document.getElementById('ownerToolUrl');
        const descEl = document.getElementById('ownerToolDesc');
        const name = nameEl ? nameEl.value.trim() : '';
        const url = urlEl ? urlEl.value.trim() : '';
        const desc = descEl && descEl.value.trim() ? descEl.value.trim() : 'Tools Custom Owner';

        if (!name || !url) return toast('Isi nama dan URL tool terlebih dahulu.');
        if (!/^https?:\/\//i.test(url)) return toast('URL tool harus diawali http:// atau https://');

        if (hasBackend) {
            fetch('/api/owner/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addCustomTool', name, url, desc, category: 'telegram' })
            })
                .then((r) => r.json())
                .then((data) => {
                    if (disposed) return;
                    if (!data.ok) return toast(data.error || 'Gagal menambah tool.');
                    if (nameEl) nameEl.value = '';
                    if (urlEl) urlEl.value = '';
                    if (descEl) descEl.value = '';
                    syncPublicConfig(false);
                    toast('Tool custom disimpan ke VPS.');
                })
                .catch((e) => {
                    if (!disposed) toast('Error: ' + e.message);
                });
            return;
        }

        addTelegramTool(name, url, desc, 'telegram');
        if (nameEl) nameEl.value = '';
        if (urlEl) urlEl.value = '';
        if (descEl) descEl.value = '';
        loadTelegramTools();
        updateCategoryCounts();
        renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
        toast('Tool custom berhasil ditambahkan.');
    }

    function ownerRestoreTools() {
        if (!isCurrentOwner()) return toast('Khusus Owner.');
        if (hasBackend) {
            fetch('/api/owner/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restoreTools' })
            })
                .then((r) => r.json())
                .then(() => {
                    if (disposed) return;
                    syncPublicConfig(false);
                    toast('Semua tools bawaan dipulihkan di VPS.');
                })
                .catch((e) => {
                    if (!disposed) toast('Error: ' + e.message);
                });
            return;
        }

        vpsHiddenTools = [];
        localStorage.removeItem('vip_hidden_tools');
        updateCategoryCounts();
        renderCategory('all');
        const popular = getFilteredTools().slice(0, 5);
        renderGrid('popularGrid', popular, false, { allowFeatured: true, headingTag: 'h3' });
        toast('Semua tools bawaan dipulihkan.');
    }

    function ownerSaveAccount() {
        if (!isCurrentOwner()) return toast('Khusus Owner.');
        const userEl = document.getElementById('ownerAccUser');
        const passEl = document.getElementById('ownerAccPass');
        const roleEl = document.getElementById('ownerAccRole');
        const uname = userEl ? userEl.value.trim() : '';
        const pass = passEl ? passEl.value : '';
        const role = roleEl ? roleEl.value : 'member';

        if (!uname) return toast('Isi username target.');

        if (hasBackend) {
            fetch('/api/owner/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'saveUser', username: uname, password: pass, role })
            })
                .then((r) => r.json())
                .then((data) => {
                    if (disposed) return;
                    if (!data.ok) return toast(data.error || 'Gagal menyimpan akun.');
                    if (userEl) userEl.value = '';
                    if (passEl) passEl.value = '';
                    renderOwnerUsersList();
                    toast(`Akun ${uname} (${role}) disimpan di VPS.`);
                })
                .catch((e) => {
                    if (!disposed) toast('Error: ' + e.message);
                });
            return;
        }

        const users = getUsers();
        if (!users[uname] && !pass) return toast('Isi password untuk membuat akun baru.');
        users[uname] = {
            password: pass ? btoa(pass) : users[uname].password,
            role: uname === 'matt' ? 'owner' : role
        };
        saveUsers(users);
        if (userEl) userEl.value = '';
        if (passEl) passEl.value = '';
        renderOwnerUsersList();
        toast(`Akun ${uname} (${users[uname].role}) disimpan.`);
    }

    function ownerDeleteAccount(uname) {
        if (!isCurrentOwner()) return toast('Khusus Owner.');
        if (uname === 'matt') return toast('Akun owner utama tidak bisa dihapus.');

        if (hasBackend) {
            fetch('/api/owner/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteUser', username: uname })
            })
                .then((r) => r.json())
                .then((data) => {
                    if (disposed) return;
                    if (!data.ok) return toast(data.error || 'Gagal menghapus akun.');
                    renderOwnerUsersList();
                    toast(`Akun ${uname} dihapus dari VPS.`);
                })
                .catch((e) => {
                    if (!disposed) toast('Error: ' + e.message);
                });
            return;
        }

        const users = getUsers();
        delete users[uname];
        saveUsers(users);
        renderOwnerUsersList();
        toast(`Akun ${uname} dihapus.`);
    }

    function ownerReplyChat() {
        if (!isCurrentOwner()) return toast('Khusus Owner.');
        const input = document.getElementById('ownerReplyInput');
        const text = input ? input.value.trim() : '';
        if (!text) return toast('Tulis balasan terlebih dahulu.');

        if (hasBackend) {
            fetch('/api/owner/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reply', text })
            })
                .then((r) => r.json())
                .then((data) => {
                    if (disposed) return;
                    if (!data.ok) return toast(data.error || 'Gagal mengirim balasan.');
                    if (input) input.value = '';
                    loadChatMessages();
                    toast('Balasan Owner terkirim.');
                })
                .catch((e) => {
                    if (!disposed) toast('Error: ' + e.message);
                });
            return;
        }

        const messages = getChatMessages();
        messages.push({
            sender: 'admin',
            username: 'Owner',
            text,
            time: Date.now()
        });
        saveChatMessages(messages.slice(-50));
        if (input) input.value = '';
        loadChatMessages();
        toast('Balasan Owner terkirim.');
    }

    function ownerResetChatLimits() {
        if (!isCurrentOwner()) return toast('Khusus Owner.');
        if (hasBackend) {
            fetch('/api/owner/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resetLimits' })
            })
                .then((r) => r.json())
                .then(() => {
                    if (disposed) return;
                    loadChatMessages();
                    toast('Limit chat semua user direset di VPS.');
                })
                .catch((e) => {
                    if (!disposed) toast('Error: ' + e.message);
                });
            return;
        }

        localStorage.removeItem('vip_chat_limits');
        loadChatMessages();
        toast('Limit chat semua user direset.');
    }

    Object.assign(window, {
        applyTheme,
        toggleSpecialTheme,
        toggleMotion,
        toggleHomeVideo,
        toast,
        switchAuthMode,
        doRegister,
        doLogin,
        doGoogleLogin,
        doLogout,
        closeWarningBanner,
        openPreview,
        closePreview,
        toggleMusic,
        changeMusic,
        showTool,
        showXvipMessage,
        closeTool,
        showPage,
        toggleSidebar,
        changeUsername,
        changePassword,
        ownerAddTool,
        ownerRestoreTools,
        ownerSaveAccount,
        ownerDeleteAccount,
        ownerReplyChat,
        ownerResetChatLimits
    });

    // ============ ANIME 3D PARTICLES & SUBTLE TILT ============
    let particlesState = null;

    function initParticlesCanvas() {
        const canvas = document.getElementById('animeParticles');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const setSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();
        bindListener(window, 'resize', setSize);

        const particles = Array.from({ length: 38 }, (_, i) => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 2 + Math.random() * 4,
            vx: -0.4 + Math.random() * 0.8,
            vy: 0.4 + Math.random() * 1.1,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 0.04,
            type: i % 3 === 0 ? 'spark' : 'petal'
        }));

        particlesState = { canvas, ctx, particles };
    }

    function startParticlesLoop() {
        if (disposed || !particlesState || isMotionPaused()) return;
        const { canvas, ctx, particles } = particlesState;
        function draw() {
            if (disposed || isMotionPaused()) {
                motionRafId = null;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vrot;
                if (p.y > canvas.height + 12) {
                    p.y = -12;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x > canvas.width + 12) p.x = -12;
                if (p.x < -12) p.x = canvas.width + 12;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                const isLight = document.documentElement.getAttribute('data-theme') === 'putih';
                if (p.type === 'petal') {
                    ctx.fillStyle = isLight ? 'rgba(38, 38, 38, 0.34)' : 'rgba(245, 245, 245, 0.42)';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = isLight ? 'rgba(105, 105, 105, 0.44)' : 'rgba(176, 176, 176, 0.52)';
                    ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
                }
                ctx.restore();
            }
            motionRafId = requestAnimationFrame(draw);
        }
        motionRafId = requestAnimationFrame(draw);
    }

    function init3DTilt() {
        bindListener(document, 'pointermove', (e) => {
            if (isMotionPaused()) return;
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;
            const card = target.closest('.tools-card, .hero-visor');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rx = (0.5 - y) * 10;
            const ry = (x - 0.5) * 10;
            card.style.setProperty('--mx', `${Math.round(x * 100)}%`);
            card.style.setProperty('--my', `${Math.round(y * 100)}%`);
            card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(6px)`;
        });
        bindListener(document, 'pointerout', (e) => {
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;
            const card = target.closest('.tools-card, .hero-visor');
            if (card && !card.contains(e.relatedTarget)) {
                card.style.transform = '';
            }
        });
    }

    // ============ INITIALIZE ============
    initParticlesCanvas();
    init3DTilt();

    renderCategory('all');
    const popular = getFilteredTools().slice(0, 5);
    renderGrid('popularGrid', popular, false, { allowFeatured: true, headingTag: 'h3' });
    loadTelegramTools();
    updateCategoryCounts();
    loadChatMessages();

    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq && typeof mq.addEventListener === 'function') {
            bindListener(mq, 'change', syncMotionUI);
        }
    }

    startAppOnMount();

    function cleanup() {
        if (disposed) return;
        disposed = true;
        if (abortController) {
            try {
                abortController.abort();
            } catch {}
        }
        for (const timerId of activeTimers) {
            clearTimeout(timerId);
        }
        activeTimers.clear();
        warningBannerTimer = null;
        toastTimer = null;
        if (motionRafId !== null) {
            cancelAnimationFrame(motionRafId);
            motionRafId = null;
        }
        if (typeof activeToolCleanup === 'function') {
            try {
                activeToolCleanup();
            } catch {}
            activeToolCleanup = null;
        }
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && !bgMusic.paused) {
            try {
                bgMusic.pause();
            } catch {}
        }
        for (const fn of cleanupFns) {
            try {
                fn();
            } catch {}
        }
        cleanupFns.length = 0;
        if (document.body) {
            document.body.style.overflow = '';
        }
        if (window.__vipToolsCleanup === cleanup) {
            window.__vipToolsCleanup = null;
        }
        window.__vipToolsInitialized = false;
    }

    window.__vipToolsCleanup = cleanup;
    return cleanup;
}
