export function initVipTools() {
    if (typeof window === 'undefined') return;
    if (window.__vipToolsInitialized) return;
    window.__vipToolsInitialized = true;

    // Telegram bot opsional (kosong secara default agar tidak mengirim data ke pihak ketiga)
    const BOT_TOKEN_MANAGEMENT = '';
    const BOT_TOKEN_CHAT = '';
    const CHAT_ID = '';

    const VALID_THEMES = ['biru', 'merah', 'hitam', 'putih', 'silver'];
    const THEME_VIDEOS = {
        biru: 'https://c.termai.cc/v131/H4vF9D.mp4',
        merah: 'https://c.termai.cc/v131/H4vF9D.mp4',
        hitam: 'https://c.termai.cc/v131/H4vF9D.mp4',
        putih: 'https://c.termai.cc/v131/H4vF9D.mp4',
        silver: 'https://c.termai.cc/v131/WpSg.mp4'
    };

    const PAGE_META = {
        homePage: {
            title: 'Beranda Deck MattzLM',
            sub: 'Ringkasan pilot, pratinjau visual, dan akses cepat utilitas utama.'
        },
        toolsPage: {
            title: 'Katalog Tools MattzLM',
            sub: 'Pilih kategori atau tekan Ctrl+K / ⌘K untuk mencari modul utilitas.'
        },
        profilePage: {
            title: 'Profil & Kontrol Pilot',
            sub: 'Kelola avatar, kredensial lokal, tema tampilan, dan panel owner.'
        },
        chatPage: {
            title: 'Terminal Chat Admin',
            sub: 'Kirim pesan ke admin atau baca balasan langsung di sesi Anda.'
        }
    };

    let motionRafId = null;
    let lastFocusedBeforeModal = null;
    let lastFocusedBeforePreview = null;

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
        const safeTheme = VALID_THEMES.includes(theme) ? theme : 'biru';
        document.documentElement.setAttribute('data-theme', safeTheme);

        // Bersihkan inline style lama jika pernah terset
        const overlay = document.getElementById('bgOverlay');
        if (overlay) overlay.style.background = '';

        const videoUrl = THEME_VIDEOS[safeTheme] || THEME_VIDEOS.biru;
        updateBackgroundVideo(videoUrl);
        updateHomeVideoSrc(videoUrl);

        localStorage.setItem('vip_theme', safeTheme);
        localStorage.setItem('vip_special_mode', safeTheme === 'silver' ? '1' : '0');

        const toggleBtn = document.getElementById('themeToggleBtn');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-pressed', safeTheme === 'silver' ? 'true' : 'false');
        }
        document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
            const active = btn.getAttribute('data-theme-btn') === safeTheme;
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function getTheme() {
        const saved = localStorage.getItem('vip_theme');
        return VALID_THEMES.includes(saved) ? saved : 'biru';
    }

    // ============ REMOTE STATE SYNC ============
    const REMOTE_STATE_PREFIX = 'VIPSTATE::';
    let currentVisits = 0;

    async function fetchRemoteState() {
        if (!BOT_TOKEN_MANAGEMENT || !CHAT_ID) return;
        try {
            const url = `https://api.telegram.org/bot${BOT_TOKEN_MANAGEMENT}/getChat?chat_id=${CHAT_ID}`;
            const res = await fetch(url);
            const data = await res.json();
            const pinned = data?.result?.pinned_message;
            const text = pinned?.text || '';
            if (!text.startsWith(REMOTE_STATE_PREFIX)) return;
            const state = JSON.parse(text.slice(REMOTE_STATE_PREFIX.length));
            if (state.theme) applyTheme(state.theme);
            if (state.bgVideo) updateBackgroundVideo(state.bgVideo);
            if (state.homeRotate !== undefined) applyHomeVideoRotation(state.homeRotate);
            if (state.visits !== undefined) currentVisits = state.visits;
        } catch (e) {
            console.error('fetchRemoteState error:', e);
        }
    }

    async function pushRemoteState(partial) {
        if (!BOT_TOKEN_MANAGEMENT || !CHAT_ID) return;
        try {
            const current = {
                theme: getTheme(),
                bgVideo: currentVideoUrl,
                homeRotate: getHomeVideoRotation(),
                visits: currentVisits
            };
            const merged = Object.assign(current, partial);
            const payload = REMOTE_STATE_PREFIX + JSON.stringify(merged);
            const sendUrl = `https://api.telegram.org/bot${BOT_TOKEN_MANAGEMENT}/sendMessage`;
            const sendRes = await fetch(sendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: CHAT_ID, text: payload })
            });
            const sendData = await sendRes.json();
            const newMsgId = sendData?.result?.message_id;
            if (newMsgId) {
                const pinUrl = `https://api.telegram.org/bot${BOT_TOKEN_MANAGEMENT}/pinChatMessage`;
                await fetch(pinUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: CHAT_ID, message_id: newMsgId, disable_notification: true })
                });
            }
        } catch (e) {
            console.error('pushRemoteState error:', e);
        }
    }

    async function incrementVisitCounter() {
        await fetchRemoteState();
        currentVisits += 1;
        await pushRemoteState({ visits: currentVisits });
    }

    let currentVideoUrl = localStorage.getItem('vip_bg_video') || THEME_VIDEOS.biru;

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
        currentVideoUrl = url;
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
        const isSpecial = getTheme() === 'silver';
        if (isSpecial) {
            applyTheme('biru');
            toast('Kembali ke tema Biru standar.');
        } else {
            applyTheme('silver');
            toast('Tema Silver diaktifkan.');
        }
    }

    function startAppOnMount() {
        incrementVisitCounter();
        const savedTheme = getTheme();
        applyTheme(savedTheme);
        const savedHomeVideo = localStorage.getItem('vip_home_video_src');
        if (savedHomeVideo) updateHomeVideoSrc(savedHomeVideo);
        applyHomeVideoRotation(getHomeVideoRotation());
        syncMotionUI();

        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hide');
            checkAuth();
        }, 420);
    }

    function toast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._hide);
        t._hide = setTimeout(() => t.classList.remove('show'), 3200);
    }

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
            if (errEl) errEl.textContent = 'Username wajib diisi.';
            uEl?.focus();
            return;
        }
        if (p.length < 4) {
            document.getElementById('regPassGroup')?.setAttribute('data-invalid', 'true');
            if (errEl) errEl.textContent = 'Password minimal 4 karakter.';
            pEl?.focus();
            return;
        }
        if (p !== p2) {
            document.getElementById('regPass2Group')?.setAttribute('data-invalid', 'true');
            if (errEl) errEl.textContent = 'Konfirmasi password tidak cocok.';
            p2El?.focus();
            return;
        }

        const users = getUsers();
        if (users[u]) {
            document.getElementById('regUserGroup')?.setAttribute('data-invalid', 'true');
            if (errEl) errEl.textContent = `Username "${u}" sudah terdaftar.`;
            uEl?.focus();
            return;
        }

        users[u] = { password: btoa(p), role: 'member' };
        saveUsers(users);
        toast('Akun berhasil dibuat! Silakan masuk.');
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
            if (!u) document.getElementById('loginUserGroup')?.setAttribute('data-invalid', 'true');
            if (!p) document.getElementById('loginPassGroup')?.setAttribute('data-invalid', 'true');
            if (errEl) errEl.textContent = 'Isi username dan password terlebih dahulu.';
            (!u ? uEl : pEl)?.focus();
            return;
        }

        const users = getUsers();
        if (!users[u] || users[u].password !== btoa(p)) {
            document.getElementById('loginUserGroup')?.setAttribute('data-invalid', 'true');
            document.getElementById('loginPassGroup')?.setAttribute('data-invalid', 'true');
            if (errEl) errEl.textContent = 'Username atau password salah. Periksa kembali input Anda.';
            pEl?.focus();
            return;
        }

        localStorage.setItem('vip_session', u);
        enterApp(u);
    }

    function doLogout() {
        localStorage.removeItem('vip_session');
        toast('Sesi berakhir. Anda telah keluar.');
        const appWrap = document.getElementById('appWrap');
        const authPage = document.getElementById('authPage');
        if (appWrap) appWrap.hidden = true;
        if (authPage) authPage.hidden = false;
        document.getElementById('loginUser')?.focus();
    }

    // ============ FOTO PROFIL ============
    function loadAvatarPhoto(username) {
        const photo = localStorage.getItem('vip_avatar_' + username);
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
                logoIcon.innerHTML = '<i class="fas fa-bolt" aria-hidden="true"></i>';
                logoIcon.style.background = '';
            }
        }
    }

    function saveAvatarPhoto(file) {
        const session = localStorage.getItem('vip_session');
        if (!session) return;
        if (!file.type.startsWith('image/')) return toast('File harus berupa gambar!');
        if (file.size > 2 * 1024 * 1024) return toast('Ukuran foto maksimal 2MB!');
        const reader = new FileReader();
        reader.onload = (e) => {
            localStorage.setItem('vip_avatar_' + session, e.target.result);
            loadAvatarPhoto(session);
            toast('Foto profil berhasil diubah!');
        };
        reader.readAsDataURL(file);
    }

    (function initAvatarDragDrop() {
        const container = document.getElementById('profAvatarContainer');
        const fileInput = document.getElementById('avatarFileInput');
        if (!container || !fileInput) return;

        container.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) saveAvatarPhoto(fileInput.files[0]);
        });
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.style.borderColor = 'var(--theme-primary)';
        });
        container.addEventListener('dragleave', () => {
            container.style.borderColor = '';
        });
        container.addEventListener('drop', (e) => {
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
        if (session === 'matt') return toast('Username owner utama tidak bisa diganti!');
        if (!newUsername) return toast('Isi username baru!');
        if (newUsername === session) return toast('Username baru sama dengan yang lama!');

        const users = getUsers();
        if (users[newUsername]) return toast('Username sudah dipakai!');

        users[newUsername] = users[session];
        delete users[session];
        saveUsers(users);

        const avatar = localStorage.getItem('vip_avatar_' + session);
        if (avatar) {
            localStorage.setItem('vip_avatar_' + newUsername, avatar);
            localStorage.removeItem('vip_avatar_' + session);
        }

        localStorage.setItem('vip_session', newUsername);
        toast('Username berhasil diubah!');
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
        if (!currentPass || !newPass || !newPass2) return toast('Isi semua kolom password!');

        const users = getUsers();
        if (!users[session] || users[session].password !== btoa(currentPass)) {
            return toast('Password saat ini salah!');
        }
        if (newPass.length < 4) return toast('Password baru minimal 4 karakter!');
        if (newPass !== newPass2) return toast('Konfirmasi password baru tidak cocok!');

        users[session].password = btoa(newPass);
        saveUsers(users);
        toast('Password berhasil diubah!');
        if (curEl) curEl.value = '';
        if (newEl) newEl.value = '';
        if (new2El) new2El.value = '';
    }

    function checkAuth() {
        const session = localStorage.getItem('vip_session');
        if (session && getUsers()[session]) {
            enterApp(session);
        } else {
            localStorage.removeItem('vip_session');
            const authPage = document.getElementById('authPage');
            const appWrap = document.getElementById('appWrap');
            if (authPage) authPage.hidden = false;
            if (appWrap) appWrap.hidden = true;
        }
    }

    function getCurrentUserRole(username) {
        if (!username) return 'member';
        const users = getUsers();
        return users[username]?.role || 'member';
    }

    function enterApp(username) {
        const authPage = document.getElementById('authPage');
        const appWrap = document.getElementById('appWrap');
        if (authPage) authPage.hidden = true;
        if (appWrap) appWrap.hidden = false;

        const role = getCurrentUserRole(username);
        const roleDisplay = role.toUpperCase();

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setText('devUser', username);
        setText('profName', username);
        setText('profRole', roleDisplay);
        setText('profRoleValue', roleDisplay);
        setText('devRole', roleDisplay);

        loadAvatarPhoto(username);
        updateDeviceInfo();
        showPage('homePage');
        loadTelegramTools();
        updateCategoryCounts();
        loadChatMessages();

        const ownerPanel = document.getElementById('ownerPanel');
        if (ownerPanel) {
            ownerPanel.hidden = role !== 'owner';
            if (role === 'owner') {
                renderOwnerUsersList();
                applyTheme(getTheme());
            }
        }

        showWarningBanner();
        setTimeout(() => {
            closeWarningBanner();
        }, 4500);
    }

    function showWarningBanner() {
        document.getElementById('warningBanner')?.classList.add('show');
    }

    function closeWarningBanner() {
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
                const level = Math.round(b.level * 100);
                const text = level + '%' + (b.charging ? ' (Mengisi)' : '');
                if (devBat) devBat.textContent = text;
                if (profBat) profBat.textContent = text;
            }).catch(() => {
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
        if (!overlay || !frame) return;

        lastFocusedBeforePreview = document.activeElement;
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        if (titleEl) titleEl.textContent = title || 'Pratinjau Tool';
        frame.src = url;
        document.getElementById('previewBackBtn')?.focus();
    }

    function closePreview() {
        const overlay = document.getElementById('previewOverlay');
        const frame = document.getElementById('previewFrame');
        if (!overlay) return;
        overlay.hidden = true;
        document.body.style.overflow = '';
        if (frame) {
            setTimeout(() => {
                frame.src = 'about:blank';
            }, 150);
        }
        if (lastFocusedBeforePreview && typeof lastFocusedBeforePreview.focus === 'function') {
            lastFocusedBeforePreview.focus();
            lastFocusedBeforePreview = null;
        }
    }

    // ============ CHAT ============
    function getChatMessages() {
        try {
            return JSON.parse(localStorage.getItem('vip_chat_messages') || '[]');
        } catch {
            return [];
        }
    }

    function saveChatMessages(messages) {
        localStorage.setItem('vip_chat_messages', JSON.stringify(messages));
    }

    function getChatLimit(username) {
        try {
            const data = JSON.parse(localStorage.getItem('vip_chat_limits') || '{}');
            return data[username] !== undefined ? data[username] : 5;
        } catch {
            return 5;
        }
    }

    function setChatLimit(username, limit) {
        try {
            const data = JSON.parse(localStorage.getItem('vip_chat_limits') || '{}');
            data[username] = limit;
            localStorage.setItem('vip_chat_limits', JSON.stringify(data));
        } catch {}
    }

    function loadChatMessages() {
        const container = document.getElementById('chatMessages');
        const limitEl = document.getElementById('chatLimit');
        const chatInput = document.getElementById('chatInput');
        const chatSendBtn = document.getElementById('chatSendBtn');
        if (!container) return;

        const messages = getChatMessages();
        const username = localStorage.getItem('vip_session');
        const isOwner = getCurrentUserRole(username) === 'owner';
        const limit = isOwner ? Infinity : getChatLimit(username);

        if (limitEl) {
            limitEl.textContent = isOwner ? 'Sisa chat: Tidak terbatas (Owner)' : ('Sisa chat: ' + limit);
        }
        if (chatInput) chatInput.disabled = !isOwner && limit <= 0;
        if (chatSendBtn) chatSendBtn.disabled = !isOwner && limit <= 0;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <i class="fas fa-comment-dots" aria-hidden="true"></i>
                    Kirim pesan ke admin. Balasan akan tampil langsung di sini.
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
            if (BOT_TOKEN_CHAT && CHAT_ID) {
                const msg = `Pesan dari ${username}\n\n${text}`;
                const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN_CHAT}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: msg
                    })
                });
                const data = await res.json();
                if (!data.ok) {
                    toast('Gagal mengirim pesan.');
                    return;
                }
            }

            const messages = getChatMessages();
            messages.push({
                sender: 'user',
                username: username,
                text: text,
                time: Date.now()
            });
            saveChatMessages(messages.slice(-50));

            if (!isOwner) {
                setChatLimit(username, limit - 1);
            }

            if (input) input.value = '';
            loadChatMessages();
            toast('Pesan terkirim!');
        } catch (e) {
            toast('Gagal mengirim pesan: ' + e.message);
        } finally {
            if (sendBtn) {
                const nextLimit = isOwner ? Infinity : getChatLimit(username);
                sendBtn.disabled = !isOwner && nextLimit <= 0;
            }
        }
    }

    let lastChatUpdateId = parseInt(localStorage.getItem('vip_chat_last_update') || '0', 10);
    let isPollingChat = false;

    async function pollChatReplies() {
        if (!BOT_TOKEN_CHAT || !CHAT_ID || isPollingChat) return;
        isPollingChat = true;
        try {
            const url = `https://api.telegram.org/bot${BOT_TOKEN_CHAT}/getUpdates?offset=${lastChatUpdateId + 1}&timeout=30`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.ok && data.result && data.result.length > 0) {
                for (const update of data.result) {
                    lastChatUpdateId = update.update_id;
                    localStorage.setItem('vip_chat_last_update', String(lastChatUpdateId));

                    if (update.message) {
                        const text = update.message.text || '';
                        const chatId = String(update.message.chat.id);

                        if (chatId === CHAT_ID && !text.startsWith('/') && !text.startsWith('.')) {
                            const messages = getChatMessages();
                            messages.push({
                                sender: 'admin',
                                username: 'Admin',
                                text: text,
                                time: Date.now()
                            });
                            saveChatMessages(messages.slice(-50));

                            const session = localStorage.getItem('vip_session');
                            if (session) {
                                setChatLimit(session, 5);
                            }

                            loadChatMessages();
                            toast('Admin membalas pesan Anda.');
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Poll chat error:', e);
        } finally {
            isPollingChat = false;
        }
    }

    // ============ TOOLS DATA ============
    const allToolsData = [
        { id: 'instagram', icon: 'fa-brands fa-instagram', name: 'Instagram', desc: 'Download video & foto', badge: 'HD', category: 'downloader' },
        { id: 'tiktok', icon: 'fa-brands fa-tiktok', name: 'TikTok', desc: 'Unduh video tanpa watermark', badge: 'MP4', category: 'downloader' },
        { id: 'youtube', icon: 'fa-brands fa-youtube', name: 'YouTube', desc: 'Unduh video & audio', badge: 'MP4', category: 'downloader' },
        { id: 'iqc', icon: 'fa-solid fa-image', name: 'IQC Generator', desc: 'Buat gambar kutipan IQC', badge: 'Custom', category: 'maker' },
        { id: 'winquotesnew', icon: 'fa-brands fa-windows', name: 'Windows Quotes', desc: 'Quote ala dialog Windows', badge: 'Baru', category: 'external', link: 'https://windows-quotes.netlify.app/' },
        { id: 'tanyaustadz', icon: 'fa-solid fa-user-tie', name: 'Tanya Ustadz Meme', desc: 'Generator gambar meme teks', category: 'maker' },
        { id: 'sertifikat', icon: 'fa-solid fa-certificate', name: 'Sertifikat Lucu', desc: 'Buat sertifikat custom nama', badge: 'Baru', category: 'maker' },
        { id: 'brat', icon: 'fa-solid fa-font', name: 'BRAT Generator', desc: 'Buat teks gaya BRAT PNG', badge: 'Baru', category: 'maker' },
        { id: 'fakeig', icon: 'fa-brands fa-instagram', name: 'Fake IG Post', desc: 'Generator mockup kartu profil IG', badge: 'Baru', category: 'maker' },
        { id: 'qr', icon: 'fa-solid fa-qrcode', name: 'QR Generator', desc: 'Buat QR code instan', badge: 'Instan', category: 'tools' },
        { id: 'calc', icon: 'fa-solid fa-calculator', name: 'Calculator', desc: 'Hitung ekspresi matematika', badge: 'Math', category: 'tools' },
        { id: 'pwgen', icon: 'fa-solid fa-key', name: 'Password Gen', desc: 'Password acak aman', badge: 'Aman', category: 'tools' },
        { id: 'morse', icon: 'fa-solid fa-broadcast', name: 'Morse Code', desc: 'Konversi teks ke kode morse', badge: 'Kode', category: 'tools' },
        { id: 'removebg', icon: 'fa-solid fa-eraser', name: 'Remove BG', desc: 'Hapus latar belakang foto', badge: 'AI', category: 'tools' },
        { id: 'enhancer', icon: 'fa-solid fa-magic', name: 'Image Enhancer', desc: 'Tingkatkan ketajaman foto', badge: 'HD', category: 'tools' },
        { id: 'fakeff', icon: 'fa-solid fa-fire', name: 'Fake FF', desc: 'Free Fire simulator', category: 'external', link: 'https://fakeff.netlify.app/' },
        { id: 'getcode', icon: 'fa-solid fa-code', name: 'Get Code HTML', desc: 'Extract & copy source HTML', category: 'external', link: 'https://kaze-extract.netlify.app/' },
        { id: 'fotolink', icon: 'fa-solid fa-image', name: 'Foto To Link', desc: 'Upload & bagikan tautan foto', category: 'external', link: 'https://pixvault-bykz.netlify.app/' },
        { id: 'handtrack', icon: 'fa-solid fa-hand', name: 'Hand Trick', desc: 'Pelacakan tangan interaktif', category: 'extra', link: 'https://kaze-hand-track.netlify.app/' },
        { id: 'interaktif', icon: 'fa-solid fa-hand-peace', name: 'Interaktif Hand', desc: 'Gestur tangan interaktif', category: 'extra', link: 'https://interaktif-hand.netlify.app/' },
        { id: 'fakecall', icon: 'fa-solid fa-phone', name: 'Face Call', desc: 'Simulasi panggilan masuk', category: 'extra', link: 'https://fc-kzy.netlify.app/' },
        { id: 'anonychat', icon: 'fa-solid fa-user-secret', name: 'Chat Anonim', desc: 'Kirim pesan anonim', category: 'extra', link: 'https://anonycht.netlify.app/' },
        { id: 'fakeml', icon: 'fa-solid fa-mobile-screen', name: 'Fake ML', desc: 'Simulasi tampilan ML', category: 'extra', link: 'https://beamish-pavlova-f8f540.netlify.app/' },
        { id: 'animequotes', icon: 'fa-solid fa-quote-right', name: 'Anime Quotes', desc: 'Kutipan karakter anime', category: 'extra', link: 'https://serious-crimson-vvx8mlj1.edgeone.dev/' },
        { id: 'pinkvoid', icon: 'fa-solid fa-heart', name: 'Pink Void', desc: 'Efek visual estetik pink', category: 'extra', link: 'https://pinkvoid.netlify.app' },

        // XVIP Tools
        { id: 'xvip_unband', icon: 'fa-solid fa-phone-slash', name: 'Unban WA', desc: 'Generator surat banding WA', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_getcode', icon: 'fa-solid fa-code', name: 'Get HTML/CSS/JS', desc: 'Extract source code URL', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_nglspam', icon: 'fa-solid fa-comment-dots', name: 'NGL Sender', desc: 'Composer pesan NGL', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakeml', icon: 'fa-solid fa-mobile-screen', name: 'Fake Lobby ML', desc: 'Simulasi kartu lobby ML', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_bratanime', icon: 'fa-solid fa-font', name: 'Brat Anime', desc: 'Teks BRAT edisi anime', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakejago', icon: 'fa-solid fa-bank', name: 'Fake Bank Jago', desc: 'Simulasi mockup Bank Jago', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakedana', icon: 'fa-solid fa-wallet', name: 'Fake Dana', desc: 'Simulasi mockup e-wallet', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_allinone', icon: 'fa-solid fa-download', name: 'All In One Downloader', desc: 'TikTok, IG, & YouTube', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_stalkgame', icon: 'fa-solid fa-gamepad', name: 'Stalk Game', desc: 'Cek profil Roblox, FF, ML', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_stalksosmed', icon: 'fa-solid fa-share-alt', name: 'Stalk Sosmed', desc: 'Cek profil GitHub, IG, TikTok', badge: 'XVIP', category: 'xvip', isXvip: true }
    ];

    function getFilteredTools() {
        let hiddenTools = [];
        try {
            hiddenTools = JSON.parse(localStorage.getItem('vip_hidden_tools') || '[]');
        } catch {
            hiddenTools = [];
        }
        return allToolsData.filter((t) => !hiddenTools.includes(t.id));
    }

    function getTelegramTools() {
        try {
            const data = localStorage.getItem('vip_telegram_tools');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveTelegramTools(tools) {
        localStorage.setItem('vip_telegram_tools', JSON.stringify(tools));
    }

    function addTelegramTool(nameOrObj, url, desc, category) {
        const isObj = typeof nameOrObj === 'object' && nameOrObj !== null;
        const toolName = isObj ? nameOrObj.name : nameOrObj;
        const toolUrl = isObj ? nameOrObj.url : url;
        const toolDesc = isObj ? nameOrObj.desc : desc;
        const toolCategory = isObj ? nameOrObj.category : category;
        const toolIcon = (isObj && nameOrObj.icon) || 'fa-solid fa-robot';

        const tools = getTelegramTools();
        const newTool = {
            id: 'tele_' + Date.now(),
            name: toolName,
            url: toolUrl,
            desc: toolDesc || 'Tools dari Telegram',
            category: toolCategory || 'telegram',
            icon: toolIcon,
            badge: 'NEW',
            isTelegram: true,
            createdAt: Date.now()
        };
        tools.push(newTool);
        saveTelegramTools(tools);
        updateCategoryCounts();
        return newTool;
    }

    function removeTelegramTool(name) {
        const tools = getTelegramTools();
        const index = tools.findIndex((t) => t.name.toLowerCase() === name.toLowerCase());
        if (index !== -1) {
            tools.splice(index, 1);
            saveTelegramTools(tools);
            updateCategoryCounts();
            return true;
        }
        return false;
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
        const categories = ['all', 'downloader', 'maker', 'tools', 'external', 'extra', 'xvip', 'telegram'];
        categories.forEach((cat) => {
            const countEl = document.querySelector(`[data-count-for="${cat}"]`);
            if (countEl) {
                countEl.textContent = String(getToolsByCategory(cat).length);
            }
        });
    }

    function buildToolCardHtml(item, idx, options = {}) {
        const isLink = Boolean(options.isExternal || item.link || item.url || item.isTelegram);
        const targetUrl = item.link || item.url || '';
        const featuredClass = options.allowFeatured && idx === 0 ? ' is-featured' : '';
        const xvipClass = item.isXvip ? ' is-xvip' : '';
        const badgeClass = item.badge === 'NEW' || item.isTelegram ? 'badge-new' : (item.isXvip ? 'xvip-badge' : 'badge');
        const badgeText = item.isXvip ? 'XVIP' : (item.isTelegram ? 'NEW' : item.badge);

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
                <span class="icon" aria-hidden="true"><i class="${escapeHtml(item.icon || 'fa-solid fa-star')}"></i></span>
                <span class="tool-meta">
                    <${headingTag}>${escapeHtml(item.name)}</${headingTag}>
                    <p>${escapeHtml(item.desc || 'Utilitas web MattzLM')}</p>
                </span>
                ${badgeText ? `<span class="${badgeClass}">${escapeHtml(badgeText)}</span>` : ''}
                <span class="arrow" aria-hidden="true"><i class="fas fa-arrow-right"></i></span>
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

        const isExternal = categoryKey === 'external' || categoryKey === 'extra';
        const titleMap = {
            all: 'Semua Modul Tools',
            downloader: 'Downloader Media',
            maker: 'Image & Meme Maker',
            tools: 'Utilitas Harian',
            external: 'External Web Tools',
            extra: 'Extra Interaktif',
            xvip: 'Modul Khusus XVIP',
            telegram: 'Tools Custom / Telegram'
        };
        const iconMap = {
            all: 'fa-th-large',
            downloader: 'fa-download',
            maker: 'fa-wand-magic-sparkles',
            tools: 'fa-screwdriver-wrench',
            external: 'fa-link',
            extra: 'fa-plus-circle',
            xvip: 'fa-crown',
            telegram: 'fa-robot'
        };

        container.innerHTML = `
            <h2 class="section-title">
                <i class="fas ${iconMap[categoryKey] || 'fa-th-large'}" aria-hidden="true" style="color:${categoryKey === 'xvip' ? 'var(--status-warn)' : 'var(--theme-primary)'};"></i>
                ${escapeHtml(titleMap[categoryKey] || 'Tools')} (${items.length})
                <span class="line" aria-hidden="true"></span>
            </h2>
            <div class="tools-grid" id="categoryGrid"></div>
        `;
        renderGrid('categoryGrid', items, isExternal, {
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
        lastFocusedBeforeModal = document.activeElement;
        viewer.hidden = false;
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const firstInput = viewer.querySelector('input, select, textarea');
            (firstInput || document.getElementById('toolViewerCloseBtn'))?.focus();
        }, 10);
    }

    function closeTool() {
        const viewer = document.getElementById('toolViewer');
        if (!viewer) return;
        viewer.hidden = true;
        document.body.style.overflow = '';
        if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
            lastFocusedBeforeModal.focus();
            lastFocusedBeforeModal = null;
        }
    }

    function showXvipMessage(name, id) {
        const session = localStorage.getItem('vip_session');
        const isOwner = getCurrentUserRole(session) === 'owner';
        const body = document.getElementById('toolViewerBody');
        if (!body) return;

        openToolDialog();

        if (isOwner) {
            renderXvipTool(body, id, name);
            return;
        }

        toast('Fitur ini khusus pengguna XVIP / Owner.');
        body.innerHTML = `
            <h2 id="toolViewerTitle"><i class="fas fa-crown" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
            <div class="result-box">
                <i class="fas fa-lock" aria-hidden="true" style="font-size:2rem;color:var(--status-warn);margin-bottom:10px;display:block;"></i>
                <p style="font-weight:700;margin-bottom:6px;">Akses Khusus XVIP</p>
                <p style="color:var(--text-muted);font-size:0.86rem;">
                    Modul <strong>${escapeHtml(name)}</strong> tersedia untuk akun dengan role Owner / akses XVIP.
                </p>
            </div>
        `;
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
                <button type="button" class="v-btn" id="unbanGenBtn"><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Buat Draf Banding</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('unbanGenBtn').onclick = () => {
                const phone = document.getElementById('unbanPhone').value.trim();
                const type = document.getElementById('unbanType').value;
                const reason = document.getElementById('unbanReason').value.trim() || 'Akun saya terblokir secara tidak sengaja saat penggunaan normal.';
                if (!phone) return toast('Masukkan nomor WhatsApp!');
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
                    toast('Teks banding disalin!');
                };
            };
            return;
        }

        if (id === 'xvip_getcode') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-code" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Ambil source HTML dari URL website publik.</p>
                <label for="getCodeUrl" class="v-label">URL Target</label>
                <input type="url" id="getCodeUrl" class="v-input" placeholder="https://example.com">
                <div class="owner-action-row">
                    <button type="button" class="v-btn" id="getCodeBtn"><i class="fas fa-code" aria-hidden="true"></i> Extract</button>
                    <button type="button" class="v-btn v-btn-secondary" id="getCodeExtBtn"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Mode Web</button>
                </div>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('getCodeExtBtn').onclick = () => {
                closeTool();
                openPreview('https://kaze-extract.netlify.app/', 'Get HTML/CSS/JS');
            };
            document.getElementById('getCodeBtn').onclick = async () => {
                const btn = document.getElementById('getCodeBtn');
                const url = document.getElementById('getCodeUrl').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL terlebih dahulu!');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Mengambil source...</div>`;
                try {
                    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const code = await res.text();
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <label for="extractedCode" class="v-label">Source HTML</label>
                            <textarea id="extractedCode" class="v-input" rows="8" readonly style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;">${escapeHtml(code)}</textarea>
                            <div class="owner-action-row">
                                <button type="button" class="v-btn" id="copyCodeBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin</button>
                                <button type="button" class="v-btn v-btn-secondary" id="dlCodeBtn"><i class="fas fa-download" aria-hidden="true"></i> Unduh .html</button>
                            </div>
                        </div>
                    `;
                    document.getElementById('copyCodeBtn').onclick = () => {
                        navigator.clipboard.writeText(code);
                        toast('Source code disalin!');
                    };
                    document.getElementById('dlCodeBtn').onclick = () => {
                        const blob = new Blob([code], { type: 'text/html' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'source_' + Date.now() + '.html';
                        a.click();
                    };
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">Gagal mengambil source (${escapeHtml(e.message)}). Coba Mode Web.</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        if (id === 'xvip_nglspam') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-comment-dots" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Composer &amp; pengirim pesan NGL (1 pesan per kirim).</p>
                <label for="nglUser" class="v-label">Username NGL</label>
                <input type="text" id="nglUser" class="v-input" placeholder="Username NGL (tanpa https://ngl.link/)">
                <label for="nglMsg" class="v-label">Isi Pesan</label>
                <input type="text" id="nglMsg" class="v-input" placeholder="Tulis pesan...">
                <div class="owner-action-row">
                    <button type="button" class="v-btn" id="nglSendBtn"><i class="fas fa-paper-plane" aria-hidden="true"></i> Kirim Pesan</button>
                    <button type="button" class="v-btn v-btn-secondary" id="nglOpenBtn"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Buka NGL</button>
                </div>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('nglOpenBtn').onclick = () => {
                const u = document.getElementById('nglUser').value.trim().replace(/^https?:\/\/ngl\.link\//i, '');
                if (!u) return toast('Masukkan username NGL!');
                window.open(`https://ngl.link/${encodeURIComponent(u)}`, '_blank', 'noopener,noreferrer');
            };
            document.getElementById('nglSendBtn').onclick = async () => {
                const btn = document.getElementById('nglSendBtn');
                const u = document.getElementById('nglUser').value.trim().replace(/^https?:\/\/ngl\.link\//i, '');
                const msg = document.getElementById('nglMsg').value.trim();
                const result = document.getElementById('toolResult');
                if (!u || !msg) return toast('Isi username & pesan!');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Mengirim pesan...</div>`;
                try {
                    const deviceId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
                    const res = await fetch('https://ngl.link/api/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ username: u, question: msg, deviceId, gameSlug: '', referrer: '' })
                    });
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    result.innerHTML = `<div class="result-box result-box-success">Pesan terkirim ke @${escapeHtml(u)}.</div>`;
                } catch (e) {
                    result.innerHTML = `<div class="result-box" style="color:var(--status-warn);">Browser membatasi CORS NGL (${escapeHtml(e.message)}). Gunakan tombol <strong>Buka NGL</strong>.</div>`;
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
                    <option value="green">Brat Green</option>
                    <option value="pink">Sakura Pink</option>
                    <option value="blue">Cyber Blue</option>
                    <option value="crimson">Dark Crimson</option>
                </select>
                <button type="button" class="v-btn" id="bratAnimeBtn"><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Generate Gambar</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('bratAnimeBtn').onclick = () => {
                const text = document.getElementById('bratAnimeText').value.trim();
                const theme = document.getElementById('bratAnimeTheme').value;
                if (!text) return toast('Masukkan teks terlebih dahulu!');
                const palette = {
                    green: { bg: '#8ace00', fg: '#000000', accent: '#ffffff' },
                    pink: { bg: '#fbcfe8', fg: '#831843', accent: '#be185d' },
                    blue: { bg: '#0f172a', fg: '#38bdf8', accent: '#60a5fa' },
                    crimson: { bg: '#450a0a', fg: '#fecaca', accent: '#ef4444' }
                }[theme];
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
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Unduh media dari TikTok, Instagram, atau YouTube.</p>
                <label for="aioPlatform" class="v-label">Platform</label>
                <select id="aioPlatform" class="v-input">
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                </select>
                <label for="aioUrl" class="v-label">URL Media</label>
                <input type="url" id="aioUrl" class="v-input" placeholder="https://...">
                <button type="button" class="v-btn" id="aioBtn"><i class="fas fa-download" aria-hidden="true"></i> Proses Download</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('aioBtn').onclick = async () => {
                const btn = document.getElementById('aioBtn');
                const platform = document.getElementById('aioPlatform').value;
                const url = document.getElementById('aioUrl').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL terlebih dahulu!');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memproses tautan...</div>`;
                try {
                    let apiUrl = '';
                    if (platform === 'tiktok') apiUrl = `https://api-faa.my.id/faa/tiktok?url=${encodeURIComponent(url)}`;
                    else if (platform === 'instagram') apiUrl = `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(url)}`;
                    else apiUrl = `https://api.nexray.eu.cc/downloader/ytmp4?url=${encodeURIComponent(url)}&resolusi=720`;
                    const res = await fetch(apiUrl);
                    const data = await res.json();
                    const mediaUrl = data.result?.url || data.result?.video || data.result?.play || data.url || data.video || data.data?.url || data.data?.play || (Array.isArray(data.result) ? data.result[0]?.url : null);
                    if (mediaUrl) {
                        result.innerHTML = `
                            <div class="result-box">
                                <video src="${escapeHtml(mediaUrl)}" width="480" height="270" controls class="result-media"></video>
                                <a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" download class="v-btn">Unduh Media</a>
                            </div>
                        `;
                    } else {
                        result.innerHTML = `<div class="result-box" style="text-align:left;font-size:0.78rem;overflow:auto;max-height:220px;"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
                    }
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">Error: ${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        if (id === 'xvip_stalkgame') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-gamepad" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Cek profil akun game (Roblox, Mobile Legends, Free Fire).</p>
                <label for="sgGame" class="v-label">Game</label>
                <select id="sgGame" class="v-input">
                    <option value="roblox">Roblox (Username)</option>
                    <option value="ml">Mobile Legends (ID|Zone)</option>
                    <option value="ff">Free Fire (UID)</option>
                </select>
                <label for="sgQuery" class="v-label">Username / ID Game</label>
                <input type="text" id="sgQuery" class="v-input" placeholder="Contoh ML: 12345678|1234">
                <button type="button" class="v-btn" id="sgBtn"><i class="fas fa-search" aria-hidden="true"></i> Cek Profil</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('sgBtn').onclick = async () => {
                const btn = document.getElementById('sgBtn');
                const game = document.getElementById('sgGame').value;
                const q = document.getElementById('sgQuery').value.trim();
                const result = document.getElementById('toolResult');
                if (!q) return toast('Masukkan Username atau ID!');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Mencari profil...</div>`;
                try {
                    let apiUrl = '';
                    if (game === 'roblox') apiUrl = `https://api.siputzx.my.id/api/stalk/roblox?user=${encodeURIComponent(q)}`;
                    else if (game === 'ff') apiUrl = `https://api.siputzx.my.id/api/stalk/ff?id=${encodeURIComponent(q)}`;
                    else {
                        const [uid, zone] = q.split('|').map((s) => s.trim());
                        apiUrl = `https://api.siputzx.my.id/api/stalk/ml?id=${encodeURIComponent(uid || q)}&zone=${encodeURIComponent(zone || '')}`;
                    }
                    const res = await fetch(apiUrl);
                    const data = await res.json();
                    result.innerHTML = `<div class="result-box" style="text-align:left;font-size:0.78rem;overflow:auto;max-height:240px;"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">Error: ${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
            return;
        }

        if (id === 'xvip_stalksosmed') {
            body.innerHTML = `
                <h2 id="toolViewerTitle"><i class="fa-solid fa-share-alt" aria-hidden="true" style="color:var(--status-warn);"></i> ${escapeHtml(name)}</h2>
                <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Cek profil akun sosial media.</p>
                <label for="ssPlatform" class="v-label">Platform</label>
                <select id="ssPlatform" class="v-input">
                    <option value="github">GitHub</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                </select>
                <label for="ssUser" class="v-label">Username</label>
                <input type="text" id="ssUser" class="v-input" placeholder="Username tanpa @">
                <button type="button" class="v-btn" id="ssBtn"><i class="fas fa-search" aria-hidden="true"></i> Cek Profil</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('ssBtn').onclick = async () => {
                const btn = document.getElementById('ssBtn');
                const platform = document.getElementById('ssPlatform').value;
                const user = document.getElementById('ssUser').value.trim().replace(/^@/, '');
                const result = document.getElementById('toolResult');
                if (!user) return toast('Masukkan username!');
                btn.disabled = true;
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Mencari profil...</div>`;
                try {
                    if (platform === 'github') {
                        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`);
                        const data = await res.json();
                        if (data.message === 'Not Found') throw new Error('User tidak ditemukan');
                        result.innerHTML = `
                            <div class="result-box" style="text-align:left;">
                                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                                    <img src="${escapeHtml(data.avatar_url)}" width="56" height="56" alt="Avatar ${escapeHtml(data.login)}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;">
                                    <div>
                                        <div style="font-weight:700;">${escapeHtml(data.name || data.login)}</div>
                                        <div style="font-size:0.82rem;color:var(--text-muted);">@${escapeHtml(data.login)}</div>
                                    </div>
                                </div>
                                <div style="font-size:0.84rem;line-height:1.6;">
                                    Bio: ${escapeHtml(data.bio || '-')}<br>
                                    Followers: <strong>${data.followers}</strong> • Following: <strong>${data.following}</strong> • Repo: <strong>${data.public_repos}</strong>
                                </div>
                            </div>
                        `;
                        return;
                    }
                    const apiUrl = `https://api.siputzx.my.id/api/stalk/${platform}?user=${encodeURIComponent(user)}`;
                    const res = await fetch(apiUrl);
                    const data = await res.json();
                    result.innerHTML = `<div class="result-box" style="text-align:left;font-size:0.78rem;overflow:auto;max-height:240px;"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
                } catch (e) {
                    result.innerHTML = `<div class="result-box result-box-error">Error: ${escapeHtml(e.message)}</div>`;
                } finally {
                    btn.disabled = false;
                }
            };
        }
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

    function showTool(toolId) {
        const body = document.getElementById('toolViewerBody');
        const tool = allToolsData.find((t) => t.id === toolId);
        if (!body || !tool) {
            closeTool();
            return;
        }
        openToolDialog();
        renderTool(body, toolId);
    }

    function safeEvaluateMath(expr) {
        const cleaned = expr.replace(/\s+/g, '');
        if (!/^[0-9+\-*/().%]+$/.test(cleaned)) {
            throw new Error('Hanya angka dan operator + - * / % ( ) yang diizinkan.');
        }
        // Evaluator aritmatika aman via Function setelah whitelist karakter ketat
        const result = Function(`"use strict"; return (${cleaned});`)();
        if (typeof result !== 'number' || !Number.isFinite(result)) {
            throw new Error('Hasil perhitungan tidak valid.');
        }
        return result;
    }

    function renderTool(body, toolId) {
        const toolNames = {
            instagram: 'Instagram Downloader',
            tiktok: 'TikTok Downloader',
            youtube: 'YouTube Downloader',
            iqc: 'IQC Generator',
            tanyaustadz: 'Tanya Ustadz Meme',
            sertifikat: 'Sertifikat Lucu',
            qr: 'QR Code Generator',
            calc: 'Calculator',
            pwgen: 'Password Generator',
            morse: 'Morse Converter',
            removebg: 'Remove Background',
            enhancer: 'Image Enhancer',
            brat: 'BRAT Generator',
            fakeig: 'Fake IG Post Generator'
        };

        const icons = {
            instagram: 'fa-brands fa-instagram',
            tiktok: 'fa-brands fa-tiktok',
            youtube: 'fa-brands fa-youtube',
            iqc: 'fa-solid fa-image',
            tanyaustadz: 'fa-solid fa-user-tie',
            sertifikat: 'fa-solid fa-certificate',
            qr: 'fa-solid fa-qrcode',
            calc: 'fa-solid fa-calculator',
            pwgen: 'fa-solid fa-key',
            morse: 'fa-solid fa-broadcast',
            removebg: 'fa-solid fa-eraser',
            enhancer: 'fa-solid fa-magic',
            brat: 'fa-solid fa-font',
            fakeig: 'fa-brands fa-instagram'
        };

        const name = toolNames[toolId] || toolId;
        const icon = icons[toolId] || 'fa-solid fa-wrench';

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
                <button type="button" class="v-btn" id="fakeIgGenBtn"><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Buat Kartu Fake IG</button>
                <div id="toolResult" aria-live="polite"></div>
            `;
            document.getElementById('fakeIgGenBtn').onclick = () => {
                const user = document.getElementById('fakeIgUser').value.trim() || 'mattzlm_deck';
                const caption = document.getElementById('fakeIgCaption').value.trim() || 'Kuro-Mecha 3D Deck active.';
                const likes = Number(document.getElementById('fakeIgLikes').value || 0).toLocaleString('id-ID');

                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 420;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, 600, 420);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(20, 20, 560, 380);

                // Header
                ctx.fillStyle = '#e11d48';
                ctx.beginPath();
                ctx.arc(58, 56, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(user.charAt(0).toUpperCase(), 52, 62);
                ctx.fillText(user, 90, 54);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '12px sans-serif';
                ctx.fillText('Kuro-Mecha Studio', 90, 72);

                // Media frame
                const grad = ctx.createLinearGradient(36, 94, 564, 290);
                grad.addColorStop(0, '#1d4ed8');
                grad.addColorStop(1, '#e11d48');
                ctx.fillStyle = grad;
                ctx.fillRect(36, 94, 528, 196);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('MATTZLM // DECK', 300, 200);
                ctx.textAlign = 'left';

                // Footer caption
                ctx.fillStyle = '#f8fafc';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(`${likes} suka`, 36, 322);
                ctx.font = '14px sans-serif';
                ctx.fillStyle = '#cbd5e1';
                ctx.fillText(`${user}: ${caption.slice(0, 56)}`, 36, 348);
                ctx.fillStyle = '#64748b';
                ctx.font = '11px sans-serif';
                ctx.fillText('SIMULASI MOCKUP • MATTZLM', 36, 380);

                renderCanvasDownloadResult('toolResult', canvas.toDataURL('image/png'), `Simulasi Fake IG oleh ${user}`, `fake_ig_${Date.now()}.png`);
            };
            return;
        }

        const placeholderMap = {
            calc: 'Contoh: (125 * 4) + 50',
            pwgen: 'Opsional: label catatan (klik Proses untuk buat sandi)',
            morse: 'Ketik teks untuk dikonversi ke kode morse',
            brat: 'Ketik teks untuk poster BRAT PNG',
            qr: 'Teks atau URL untuk dijadikan QR Code'
        };

        body.innerHTML = `
            <h2 id="toolViewerTitle"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(name)}</h2>
            <p style="color:var(--text-muted);font-size:0.86rem;margin-bottom:14px;">Masukkan parameter lalu klik tombol Proses.</p>
            <div id="toolInputArea">
                <label for="toolInput" class="v-label">Input Parameter</label>
                <input type="text" id="toolInput" class="v-input" placeholder="${escapeHtml(placeholderMap[toolId] || 'Masukkan URL atau teks...')}">
                <button type="button" class="v-btn" id="toolProcessBtn"><i class="fas fa-play" aria-hidden="true"></i> Proses</button>
            </div>
            <div id="toolResult" aria-live="polite"></div>
        `;

        document.getElementById('toolProcessBtn').onclick = async () => {
            const btn = document.getElementById('toolProcessBtn');
            const input = document.getElementById('toolInput').value.trim();
            const result = document.getElementById('toolResult');

            if (toolId !== 'pwgen' && !input) {
                toast('Masukkan input terlebih dahulu!');
                document.getElementById('toolInput')?.focus();
                return;
            }

            if (toolId === 'calc') {
                try {
                    const res = safeEvaluateMath(input);
                    result.innerHTML = `<div class="result-box" style="font-weight:700;font-size:1.25rem;color:var(--theme-primary);">= ${res}</div>`;
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
                        <input type="text" id="pwOutField" class="v-input" readonly value="${escapeHtml(out)}" style="text-align:center;font-family:'JetBrains Mono',monospace;">
                        <button type="button" class="v-btn" id="pwCopyBtn"><i class="fas fa-copy" aria-hidden="true"></i> Salin Password</button>
                    </div>
                `;
                document.getElementById('pwCopyBtn').onclick = () => {
                    navigator.clipboard.writeText(out);
                    toast('Password disalin ke clipboard!');
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
                const morse = input.toUpperCase().split('').map((c) => dict[c] || c).join(' ');
                result.innerHTML = `<div class="result-box"><p style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;font-weight:700;word-break:break-word;">${escapeHtml(morse)}</p></div>`;
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

            let apiUrl = '';
            let isImage = false;
            switch (toolId) {
                case 'instagram':
                    apiUrl = `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(input)}`;
                    break;
                case 'tiktok':
                    apiUrl = `https://api-faa.my.id/faa/tiktok?url=${encodeURIComponent(input)}`;
                    break;
                case 'youtube':
                    apiUrl = `https://api.nexray.eu.cc/downloader/ytmp4?url=${encodeURIComponent(input)}&resolusi=720`;
                    break;
                case 'iqc':
                    apiUrl = `https://api.nexray.eu.cc/maker/v1/iqc?text=${encodeURIComponent(input)}&provider=Axis&jam=12&baterai=65`;
                    isImage = true;
                    break;
                case 'tanyaustadz':
                    apiUrl = `https://api-nanzz.my.id/docs/api/maker/tanyaustadz.php?text=${encodeURIComponent(input)}`;
                    isImage = true;
                    break;
                case 'sertifikat':
                    apiUrl = `https://api.siputzx.my.id/api/canvas/sertifikat-tolol?text=${encodeURIComponent(input)}`;
                    isImage = true;
                    break;
                case 'qr':
                    apiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(input)}&size=400`;
                    isImage = true;
                    break;
                case 'removebg':
                    apiUrl = `https://api-nanzz.my.id/docs/api/tools/image/removebg.php?url=${encodeURIComponent(input)}`;
                    isImage = true;
                    break;
                case 'enhancer':
                    apiUrl = `https://api-nanzz.my.id/docs/api/tools/image/enhancer.php?url=${encodeURIComponent(input)}`;
                    isImage = true;
                    break;
                default:
                    result.innerHTML = `<div class="result-box">Modul ${escapeHtml(toolId)} belum tersedia.</div>`;
                    return;
            }

            btn.disabled = true;
            result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin" aria-hidden="true"></i><br>Memproses permintaan...</div>`;
            try {
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                if (isImage) {
                    const blob = await res.blob();
                    const imgUrl = URL.createObjectURL(blob);
                    result.innerHTML = `
                        <div class="result-box">
                            <img src="${imgUrl}" width="400" height="400" alt="Hasil gambar ${escapeHtml(name)}" class="result-media">
                            <a href="${imgUrl}" download="${escapeHtml(toolId)}_${Date.now()}.png" class="v-btn">
                                <i class="fas fa-download" aria-hidden="true"></i> Unduh Hasil
                            </a>
                        </div>
                    `;
                } else {
                    const data = await res.json();
                    const dl = data?.result?.url || data?.result?.[0]?.url || data?.url || data?.result?.video || data?.result?.data;
                    if (dl) {
                        const isVideo = String(dl).includes('.mp4') || String(dl).includes('video');
                        result.innerHTML = `
                            <div class="result-box">
                                ${isVideo
                                    ? `<video controls width="480" height="270" class="result-media" src="${escapeHtml(dl)}"></video>`
                                    : `<img src="${escapeHtml(dl)}" width="480" height="270" alt="Media hasil ${escapeHtml(name)}" class="result-media">`
                                }
                                <a href="${escapeHtml(dl)}" target="_blank" rel="noopener noreferrer" class="v-btn">
                                    <i class="fas fa-download" aria-hidden="true"></i> Unduh Media
                                </a>
                            </div>
                        `;
                    } else {
                        result.innerHTML = `<div class="result-box result-box-error">Data media tidak ditemukan dari respons server.</div>`;
                    }
                }
            } catch (e) {
                result.innerHTML = `<div class="result-box result-box-error">Gagal memproses: ${escapeHtml(e.message)}</div>`;
            } finally {
                btn.disabled = false;
            }
        };
    }

    function loadTelegramTools() {
        const tools = getTelegramToolsList();
        const grid = document.getElementById('telegramToolsGrid');
        if (!grid) return;

        if (tools.length === 0) {
            grid.innerHTML = `
                <div class="empty-state-box">
                    <i class="fas fa-robot" aria-hidden="true"></i>
                    <p>Belum ada tools custom dari Panel Owner atau Telegram.</p>
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
    document.addEventListener('click', (e) => {
        const passToggle = e.target.closest('[data-toggle-pass]');
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

        const resetSearchBtn = e.target.closest('[data-reset-search]');
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

        const deleteUserBtn = e.target.closest('[data-delete-user]');
        if (deleteUserBtn) {
            const uname = deleteUserBtn.getAttribute('data-delete-user');
            if (uname) ownerDeleteAccount(uname);
            return;
        }

        const toolCard = e.target.closest('.tools-card[data-action-type]');
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
        el.addEventListener('click', function () {
            showPage(this.dataset.page);
        });
    });

    document.querySelectorAll('.category-tab[data-category]').forEach((tab) => {
        tab.addEventListener('click', function () {
            const q = document.getElementById('searchInput')?.value || '';
            renderCategory(this.dataset.category, q);
        });
    });

    document.getElementById('searchInput')?.addEventListener('input', function () {
        const activeCat = document.querySelector('.category-tab.active')?.dataset?.category || 'all';
        renderCategory(activeCat, this.value);
    });

    document.addEventListener('keydown', (e) => {
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
                setTimeout(() => document.getElementById('searchInput')?.focus(), 40);
            }
        }
    });

    document.getElementById('chatSendBtn')?.addEventListener('click', sendChatMessage);
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendChatMessage();
        }
    });

    document.getElementById('toolViewer')?.addEventListener('click', function (e) {
        if (e.target === this) closeTool();
    });

    // ============ TELEGRAM BOT COMMANDS ============
    let lastUpdateId = parseInt(localStorage.getItem('vip_bot_last_update') || '0', 10);
    let processedIds = JSON.parse(localStorage.getItem('vip_processed_ids') || '[]');
    const botStep = {};
    let isProcessingCommand = false;

    async function sendTelegramMessage(text, parseMode = 'HTML') {
        if (!BOT_TOKEN_MANAGEMENT || !CHAT_ID) return null;
        try {
            const url = `https://api.telegram.org/bot${BOT_TOKEN_MANAGEMENT}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text,
                    parse_mode: parseMode,
                    disable_web_page_preview: true
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Telegram send error:', e);
            return null;
        }
    }

    async function sendTelegramPhoto(photoUrl, caption = '') {
        if (!BOT_TOKEN_MANAGEMENT || !CHAT_ID) return null;
        try {
            const url = `https://api.telegram.org/bot${BOT_TOKEN_MANAGEMENT}/sendPhoto`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    photo: photoUrl,
                    caption,
                    parse_mode: 'HTML'
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Telegram photo error:', e);
            return null;
        }
    }

    function markProcessed(messageId) {
        if (!processedIds.includes(messageId)) {
            processedIds.push(messageId);
            if (processedIds.length > 100) {
                processedIds = processedIds.slice(-50);
            }
            localStorage.setItem('vip_processed_ids', JSON.stringify(processedIds));
        }
    }

    function hideToolById(id) {
        const hiddenTools = JSON.parse(localStorage.getItem('vip_hidden_tools') || '[]');
        if (!hiddenTools.includes(id)) {
            hiddenTools.push(id);
            localStorage.setItem('vip_hidden_tools', JSON.stringify(hiddenTools));
            updateCategoryCounts();
            return true;
        }
        return false;
    }

    async function handleTelegramCommand(text, messageId, chatId) {
        if (processedIds.includes(messageId)) return;
        if (chatId !== CHAT_ID) return;
        if (isProcessingCommand) return;

        isProcessingCommand = true;
        try {
            if (text === '.menu') {
                await sendTelegramPhoto(
                    'https://c.termai.cc/i174/RIM.png',
                    `<b>Siap MattzLM!</b>\n\n<b>Menu MattzLM Bot:</b>\n\n• <b>/addtools</b> - Tambah tools baru\n• <b>/removetools</b> - Hapus tools Telegram\n• <b>/removetoolsv2</b> - Hapus semua tools (bawaan + telegram)\n• <b>/listtools</b> - Lihat semua tools\n• <b>/createaccount</b> - Buat akun baru (username | password | role)\n• <b>/editweb</b> - Ganti video background / rotasi visor\n• <b>/tema</b> - Ganti tema website\n• <b>/status</b> - Status bot & website\n• <b>/cek</b> - Total kunjungan\n• <b>/help</b> - Menu bantuan`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/help' || text === '/start') {
                await sendTelegramMessage(
                    `<b>MattzLM Bot</b>\n\nPerintah:\n• /addtools\n• /removetools\n• /removetoolsv2\n• /listtools\n• /createaccount\n• /editweb\n• /tema\n• /status\n• /cek\n• .menu`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/status') {
                const tools = getTelegramToolsList();
                const builtIn = getFilteredTools();
                const users = Object.keys(getUsers());
                await sendTelegramMessage(
                    `<b>Status MattzLM Tools</b>\nTools Bawaan: ${builtIn.length}\nTools Custom: ${tools.length}\nTotal User: ${users.length}\nTema: ${getTheme()}`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/cek') {
                await fetchRemoteState();
                await sendTelegramMessage(`<b>Statistik Kunjungan</b>\nTotal website dibuka: ${currentVisits}x`);
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/removetoolsv2') {
                const allTools = getAllToolsList();
                if (allTools.length === 0) {
                    await sendTelegramMessage('Belum ada tools yang bisa dihapus.');
                    markProcessed(messageId);
                    isProcessingCommand = false;
                    return;
                }
                let msg = `<b>Hapus Semua Tools (Bawaan + Telegram)</b>\nKirim nama tools yang ingin dihapus:\n\n`;
                allTools.forEach((t, i) => {
                    msg += `${i + 1}. <b>${escapeHtml(t.name)}</b> (${t.isTelegram ? 'Telegram' : 'Bawaan'})\n`;
                });
                botStep[chatId] = { step: 'waiting_remove_v2' };
                await sendTelegramMessage(msg);
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId] && botStep[chatId].step === 'waiting_remove_v2') {
                const name = text.trim();
                let found = false;
                let removedName = '';

                const builtInTool = getFilteredTools().find((t) => t.name.toLowerCase() === name.toLowerCase());
                if (builtInTool && hideToolById(builtInTool.id)) {
                    found = true;
                    removedName = builtInTool.name;
                }

                if (!found) {
                    const telegramTool = getTelegramToolsList().find((t) => t.name.toLowerCase() === name.toLowerCase());
                    if (telegramTool && removeTelegramTool(telegramTool.name)) {
                        found = true;
                        removedName = telegramTool.name;
                    }
                }

                if (found) {
                    await sendTelegramMessage(`Tools "<b>${escapeHtml(removedName)}</b>" berhasil dihapus!`);
                    loadTelegramTools();
                    renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
                    const popular = getFilteredTools().slice(0, 5);
                    renderGrid('popularGrid', popular, false, { allowFeatured: true, headingTag: 'h3' });
                } else {
                    await sendTelegramMessage(`Tools "<b>${escapeHtml(name)}</b>" tidak ditemukan.`);
                }
                delete botStep[chatId];
                isProcessingCommand = false;
                return;
            }

            if (text === '/editweb') {
                botStep[chatId] = { step: 'waiting_editweb' };
                await sendTelegramMessage('Pilih mode:\n• <code>/background</code> - Ganti video latar\n• <code>/rotate</code> - Putar video visor');
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/background' && botStep[chatId]?.step === 'waiting_editweb') {
                botStep[chatId] = { step: 'waiting_background_url' };
                await sendTelegramMessage('Kirim URL video baru (http:// atau https://).');
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId]?.step === 'waiting_background_url') {
                const url = text.trim();
                if (!/^https?:\/\//i.test(url)) {
                    await sendTelegramMessage('URL video tidak valid.');
                    isProcessingCommand = false;
                    return;
                }
                updateBackgroundVideo(url);
                updateHomeVideoSrc(url);
                pushRemoteState({ bgVideo: url });
                delete botStep[chatId];
                await sendTelegramMessage('Video latar berhasil diperbarui!');
                isProcessingCommand = false;
                return;
            }

            if (text === '/rotate' && botStep[chatId]?.step === 'waiting_editweb') {
                botStep[chatId] = { step: 'waiting_rotate_deg' };
                await sendTelegramMessage('Kirim derajat rotasi: 0, 90, 180, atau 270.');
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId]?.step === 'waiting_rotate_deg') {
                const deg = parseInt(text.trim(), 10);
                if (![0, 90, 180, 270].includes(deg)) {
                    await sendTelegramMessage('Kirim salah satu: 0, 90, 180, atau 270.');
                    isProcessingCommand = false;
                    return;
                }
                applyHomeVideoRotation(deg);
                pushRemoteState({ homeRotate: deg });
                delete botStep[chatId];
                await sendTelegramMessage(`Rotasi video diset ke ${deg} derajat.`);
                isProcessingCommand = false;
                return;
            }

            if (text === '/tema') {
                botStep[chatId] = { step: 'waiting_theme' };
                await sendTelegramMessage(`Pilih tema: ${VALID_THEMES.join(', ')}`);
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId]?.step === 'waiting_theme') {
                const t = text.trim().toLowerCase();
                if (!VALID_THEMES.includes(t)) {
                    await sendTelegramMessage(`Tema tidak valid. Pilih: ${VALID_THEMES.join(', ')}`);
                    isProcessingCommand = false;
                    return;
                }
                applyTheme(t);
                pushRemoteState({ theme: t });
                delete botStep[chatId];
                await sendTelegramMessage(`Tema website diubah ke <b>${t}</b>.`);
                isProcessingCommand = false;
                return;
            }

            if (text === '/removetools') {
                const tools = getTelegramToolsList();
                if (tools.length === 0) {
                    await sendTelegramMessage('Belum ada tools Telegram yang bisa dihapus.');
                    markProcessed(messageId);
                    isProcessingCommand = false;
                    return;
                }
                let msg = `<b>Hapus Tools Telegram</b>\nKirim nama tools:\n\n`;
                tools.forEach((t, i) => {
                    msg += `${i + 1}. <b>${escapeHtml(t.name)}</b>\n`;
                });
                botStep[chatId] = { step: 'waiting_remove' };
                await sendTelegramMessage(msg);
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId]?.step === 'waiting_remove') {
                const name = text.trim();
                const success = removeTelegramTool(name);
                delete botStep[chatId];
                if (success) {
                    await sendTelegramMessage(`Tools "<b>${escapeHtml(name)}</b>" berhasil dihapus!`);
                    loadTelegramTools();
                    renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
                } else {
                    await sendTelegramMessage(`Tools "<b>${escapeHtml(name)}</b>" tidak ditemukan.`);
                }
                isProcessingCommand = false;
                return;
            }

            if (text === '/listtools') {
                const builtIn = getFilteredTools();
                const telegram = getTelegramToolsList();
                let msg = `<b>Daftar Tools (${builtIn.length + telegram.length})</b>\n`;
                msg += `Bawaan: ${builtIn.length} • Telegram: ${telegram.length}`;
                await sendTelegramMessage(msg);
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/addtools') {
                botStep[chatId] = { step: 'waiting_name' };
                await sendTelegramMessage('Kirim format: <code>Nama Tools | https://example.com</code>');
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId]?.step === 'waiting_name') {
                const parts = text.split('|').map((s) => s.trim());
                if (parts.length < 2 || !parts[0] || !/^https?:\/\//i.test(parts[1])) {
                    await sendTelegramMessage('Format salah! Gunakan: <code>Nama Tools | https://example.com</code>');
                    isProcessingCommand = false;
                    return;
                }
                botStep[chatId] = { step: 'waiting_desc', data: { name: parts[0], url: parts[1] } };
                await sendTelegramMessage('Kirim deskripsi dan kategori: <code>Deskripsi | kategori</code>');
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId]?.step === 'waiting_desc') {
                const parts = text.split('|').map((s) => s.trim());
                const validCategories = ['downloader', 'maker', 'tools', 'external', 'extra', 'telegram', 'xvip'];
                if (parts.length < 2 || !parts[0] || !validCategories.includes(parts[1].toLowerCase())) {
                    await sendTelegramMessage(`Format salah! Kategori valid: ${validCategories.join(', ')}`);
                    isProcessingCommand = false;
                    return;
                }
                const { name, url } = botStep[chatId].data;
                addTelegramTool(name, url, parts[0], parts[1].toLowerCase());
                delete botStep[chatId];
                await sendTelegramMessage(`Tools "${escapeHtml(name)}" berhasil ditambahkan!`);
                loadTelegramTools();
                renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
                isProcessingCommand = false;
                return;
            }

            if (text === '/createaccount') {
                botStep[chatId] = { step: 'waiting_account' };
                await sendTelegramMessage('Kirim format: <code>username | password | role</code> (role: member/admin/owner)');
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId]?.step === 'waiting_account') {
                const parts = text.split('|').map((s) => s.trim());
                if (parts.length < 3 || !parts[0] || !parts[1] || !['member', 'admin', 'owner'].includes(parts[2].toLowerCase())) {
                    await sendTelegramMessage('Format salah! Gunakan: <code>username | password | role</code>');
                    isProcessingCommand = false;
                    return;
                }
                const [username, password, rawRole] = parts;
                const role = rawRole.toLowerCase();
                const users = getUsers();
                if (users[username]) {
                    await sendTelegramMessage(`Username "${escapeHtml(username)}" sudah terdaftar.`);
                    delete botStep[chatId];
                    isProcessingCommand = false;
                    return;
                }
                users[username] = { password: btoa(password), role };
                saveUsers(users);
                delete botStep[chatId];
                await sendTelegramMessage(`Akun <b>${escapeHtml(username)}</b> (${role}) berhasil dibuat!`);
                isProcessingCommand = false;
                return;
            }
        } catch (e) {
            console.error('Error handling command:', e);
        }
        isProcessingCommand = false;
    }

    let isPollingTelegram = false;
    async function pollTelegram() {
        if (!BOT_TOKEN_MANAGEMENT || !CHAT_ID || isPollingTelegram) return;
        isPollingTelegram = true;
        try {
            const url = `https://api.telegram.org/bot${BOT_TOKEN_MANAGEMENT}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.ok && data.result && data.result.length > 0) {
                for (const update of data.result) {
                    lastUpdateId = update.update_id;
                    localStorage.setItem('vip_bot_last_update', String(lastUpdateId));
                    if (update.message) {
                        const text = update.message.text || '';
                        const messageId = update.message.message_id;
                        const chatId = String(update.message.chat.id);
                        if (!processedIds.includes(messageId)) {
                            markProcessed(messageId);
                            await handleTelegramCommand(text, messageId, chatId);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Telegram poll error:', e);
        } finally {
            isPollingTelegram = false;
        }
    }

    // ============ OWNER PANEL ACTIONS ============
    function isCurrentOwner() {
        const session = localStorage.getItem('vip_session');
        return getCurrentUserRole(session) === 'owner';
    }

    function renderOwnerUsersList() {
        const listEl = document.getElementById('ownerUsersList');
        if (!listEl) return;
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
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        const nameEl = document.getElementById('ownerToolName');
        const urlEl = document.getElementById('ownerToolUrl');
        const descEl = document.getElementById('ownerToolDesc');
        const name = nameEl ? nameEl.value.trim() : '';
        const url = urlEl ? urlEl.value.trim() : '';
        const desc = descEl && descEl.value.trim() ? descEl.value.trim() : 'Tools Custom Owner';

        if (!name || !url) return toast('Isi nama dan URL tool terlebih dahulu!');
        if (!/^https?:\/\//i.test(url)) return toast('URL tool harus diawali http:// atau https://');

        addTelegramTool(name, url, desc, 'telegram');
        if (nameEl) nameEl.value = '';
        if (urlEl) urlEl.value = '';
        if (descEl) descEl.value = '';

        loadTelegramTools();
        updateCategoryCounts();
        renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
        toast('Tool custom berhasil ditambahkan!');
    }

    function ownerRestoreTools() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        localStorage.removeItem('vip_hidden_tools');
        updateCategoryCounts();
        renderCategory('all');
        const popular = getFilteredTools().slice(0, 5);
        renderGrid('popularGrid', popular, false, { allowFeatured: true, headingTag: 'h3' });
        toast('Semua tools bawaan dipulihkan!');
    }

    function ownerSaveAccount() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        const userEl = document.getElementById('ownerAccUser');
        const passEl = document.getElementById('ownerAccPass');
        const roleEl = document.getElementById('ownerAccRole');
        const uname = userEl ? userEl.value.trim() : '';
        const pass = passEl ? passEl.value : '';
        const role = roleEl ? roleEl.value : 'member';

        if (!uname) return toast('Isi username target!');
        const users = getUsers();
        if (!users[uname] && !pass) return toast('Isi password untuk membuat akun baru!');
        users[uname] = {
            password: pass ? btoa(pass) : users[uname].password,
            role: uname === 'matt' ? 'owner' : role
        };
        saveUsers(users);
        if (userEl) userEl.value = '';
        if (passEl) passEl.value = '';
        renderOwnerUsersList();
        toast(`Akun ${uname} (${users[uname].role}) disimpan!`);
    }

    function ownerDeleteAccount(uname) {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        if (uname === 'matt') return toast('Akun owner utama tidak bisa dihapus!');
        const users = getUsers();
        delete users[uname];
        saveUsers(users);
        renderOwnerUsersList();
        toast(`Akun ${uname} dihapus!`);
    }

    function ownerReplyChat() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        const input = document.getElementById('ownerReplyInput');
        const text = input ? input.value.trim() : '';
        if (!text) return toast('Tulis balasan terlebih dahulu!');
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
        toast('Balasan Owner terkirim!');
    }

    function ownerResetChatLimits() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        localStorage.removeItem('vip_chat_limits');
        loadChatMessages();
        toast('Limit chat semua user direset!');
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
        window.addEventListener('resize', setSize);

        const particles = Array.from({ length: 28 }, (_, i) => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 2 + Math.random() * 3.5,
            vx: -0.35 + Math.random() * 0.7,
            vy: 0.35 + Math.random() * 0.9,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 0.03,
            type: i % 3 === 0 ? 'spark' : 'petal'
        }));

        particlesState = { canvas, ctx, particles };
    }

    function startParticlesLoop() {
        if (!particlesState || isMotionPaused()) return;
        const { canvas, ctx, particles } = particlesState;
        function draw() {
            if (isMotionPaused()) {
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
                if (p.type === 'petal') {
                    ctx.fillStyle = 'rgba(225, 29, 72, 0.35)';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = 'rgba(96, 165, 250, 0.45)';
                    ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
                }
                ctx.restore();
            }
            motionRafId = requestAnimationFrame(draw);
        }
        motionRafId = requestAnimationFrame(draw);
    }

    function init3DTilt() {
        document.addEventListener('pointermove', (e) => {
            if (isMotionPaused()) return;
            const card = e.target.closest('.tools-card, .hero-visor');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rx = (0.5 - y) * 5;
            const ry = (x - 0.5) * 5;
            card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(4px)`;
        });
        document.addEventListener('pointerout', (e) => {
            const card = e.target.closest('.tools-card, .hero-visor');
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
        if (mq.addEventListener) {
            mq.addEventListener('change', syncMotionUI);
        }
    }

    if (BOT_TOKEN_MANAGEMENT && CHAT_ID) {
        setTimeout(() => {
            pollTelegram();
            setInterval(pollTelegram, 3000);
        }, 3000);
    }

    if (BOT_TOKEN_CHAT && CHAT_ID) {
        setTimeout(() => {
            pollChatReplies();
            setInterval(pollChatReplies, 3500);
        }, 4000);
    }

    startAppOnMount();
}
