export function initVipTools() {
    if (typeof window === 'undefined') return;
    if (window.__vipToolsInitialized) return;
    window.__vipToolsInitialized = true;


    // Telegram bot opsional (kosong secara default agar tidak mengirim data ke pihak ketiga)
    const BOT_TOKEN_MANAGEMENT = '';
    const BOT_TOKEN_CHAT = '';
    const CHAT_ID = '';

    function applyTheme(theme) {
        const root = document.documentElement;
        const themes = {
            biru: { 
                primary: '#3b82f6', primaryDark: '#2563eb', primaryLight: '#60a5fa',
                bgBody: '#0a0a1a', bgCard: 'rgba(20, 30, 60, 0.85)',
                textPrimary: '#e0e8ff', textMuted: '#5566aa',
                borderColor: 'rgba(50, 100, 255, 0.15)',
                shadow: '0 8px 32px rgba(30, 60, 200, 0.25)',
                bgVideo: 'https://c.termai.cc/v131/H4vF9D.mp4',
                homeVideo: 'https://c.termai.cc/v131/H4vF9D.mp4'
            },
            merah: { 
                primary: '#ef4444', primaryDark: '#dc2626', primaryLight: '#f87171',
                bgBody: '#1a0a0a', bgCard: 'rgba(60, 20, 20, 0.85)',
                textPrimary: '#ffe0e0', textMuted: '#aa5555',
                borderColor: 'rgba(255, 50, 50, 0.15)',
                shadow: '0 8px 32px rgba(200, 30, 30, 0.25)',
                bgVideo: 'https://c.termai.cc/v131/H4vF9D.mp4',
                homeVideo: 'https://c.termai.cc/v131/H4vF9D.mp4'
            },
            hitam: { 
                primary: '#6b7280', primaryDark: '#4b5563', primaryLight: '#9ca3af',
                bgBody: '#0a0a0a', bgCard: 'rgba(20, 20, 20, 0.85)',
                textPrimary: '#e5e5e5', textMuted: '#6b7280',
                borderColor: 'rgba(100, 100, 100, 0.15)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                bgVideo: 'https://c.termai.cc/v131/H4vF9D.mp4',
                homeVideo: 'https://c.termai.cc/v131/H4vF9D.mp4'
            },
            putih: { 
                primary: '#6b7280', primaryDark: '#4b5563', primaryLight: '#9ca3af',
                bgBody: '#f3f4f6', bgCard: 'rgba(255, 255, 255, 0.85)',
                textPrimary: '#1f2937', textMuted: '#6b7280',
                borderColor: 'rgba(200, 200, 200, 0.3)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                bgVideo: 'https://c.termai.cc/v131/H4vF9D.mp4',
                homeVideo: 'https://c.termai.cc/v131/H4vF9D.mp4'
            },
            silver: { 
                primary: '#f8fafc', primaryDark: '#e2e8f0', primaryLight: '#ffffff',
                bgBody: '#0a0a0c', bgCard: 'rgba(226, 232, 240, 0.14)',
                textPrimary: '#ffffff', textMuted: '#e2e8f0',
                borderColor: 'rgba(255, 255, 255, 0.55)',
                shadow: '0 0 70px rgba(255, 255, 255, 0.65), 0 0 25px rgba(226, 232, 240, 0.9), 0 8px 32px rgba(255, 255, 255, 0.35)',
                bgVideo: 'https://c.termai.cc/v131/WpSg.mp4',
                homeVideo: 'https://c.termai.cc/v131/WpSg.mp4'
            }
        };
        const t = themes[theme] || themes.biru;
        
        root.style.setProperty('--theme-primary', t.primary);
        root.style.setProperty('--theme-primary-dark', t.primaryDark);
        root.style.setProperty('--theme-primary-light', t.primaryLight);
        root.style.setProperty('--theme-bg-body', t.bgBody);
        root.style.setProperty('--theme-bg-card', t.bgCard);
        root.style.setProperty('--theme-text-primary', t.textPrimary);
        root.style.setProperty('--theme-text-muted', t.textMuted);
        root.style.setProperty('--theme-border-color', t.borderColor);
        root.style.setProperty('--theme-shadow', t.shadow);
        
        document.getElementById('bgOverlay').style.background = t.bgBody + 'cc';
        
        // Update video sesuai tema
        updateBackgroundVideo(t.bgVideo);
        updateHomeVideoSrc(t.homeVideo);
        
        localStorage.setItem('vip_theme', theme);
        localStorage.setItem('vip_special_mode', '0');
    }

    function getTheme() {
        return localStorage.getItem('vip_theme') || 'biru';
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
            const current = { theme: getTheme(), bgVideo: currentVideoUrl, homeRotate: getHomeVideoRotation(), visits: currentVisits };
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

    let currentVideoUrl = localStorage.getItem('vip_bg_video') || 'https://c.termai.cc/v131/H4vF9D.mp4';

    function updateBackgroundVideo(url) {
        const video = document.getElementById('bgVideo');
        if (video) {
            video.src = url;
            video.load();
            video.play().catch(() => {});
        }
        localStorage.setItem('vip_bg_video', url);
        currentVideoUrl = url;
    }

    function applyHomeVideoRotation(deg) {
        const homeVideo = document.getElementById('homeVideo');
        if (homeVideo) {
            homeVideo.style.transform = `rotate(${deg}deg)`;
        }
        localStorage.setItem('vip_home_rotate', String(deg));
    }

    function getHomeVideoRotation() {
        return parseInt(localStorage.getItem('vip_home_rotate') || '0');
    }

    function updateHomeVideoSrc(url) {
        const homeVideo = document.getElementById('homeVideo');
        if (homeVideo) {
            const source = homeVideo.querySelector('source');
            if (source) source.src = url;
            homeVideo.load();
            homeVideo.play().catch(() => {});
        }
        localStorage.setItem('vip_home_video_src', url);
    }

    // ============ MUSIK ============
    let musicUrls = [
        'https://c.termai.cc/v139/dhV3.mp4',
        'https://c.termai.cc/v131/H4vF9D.mp4'
    ];
    let currentMusicIndex = 0;

    function toggleMusic() {
        const audio = document.getElementById('bgMusic');
        const btn = document.getElementById('musicToggleBtn');
        const viz = document.getElementById('musicVisualizer');
        if (audio.paused) {
            audio.play().catch(() => toast('Gagal memutar musik, coba klik lagi.'));
            btn.innerHTML = '<i class="fas fa-stop"></i>';
            viz.classList.add('active');
        } else {
            audio.pause();
            audio.currentTime = 0;
            btn.innerHTML = '<i class="fas fa-music"></i>';
            viz.classList.remove('active');
        }
    }

    function changeMusic() {
        const audio = document.getElementById('bgMusic');
        currentMusicIndex = (currentMusicIndex + 1) % musicUrls.length;
        audio.src = musicUrls[currentMusicIndex];
        audio.load();
        if (!audio.paused) {
            audio.play().catch(() => {});
        }
        toast('Ganti lagu: ' + (currentMusicIndex + 1));
    }

    // ============ TOMBOL TOGGLE TEMA KHUSUS ============
    const DEFAULT_BG_VIDEO = 'https://c.termai.cc/v131/H4vF9D.mp4';
    const DEFAULT_HOME_VIDEO = 'https://c.termai.cc/v131/H4vF9D.mp4';
    const SPECIAL_BG_VIDEO = 'https://c.termai.cc/v131/WpSg.mp4';
    const SPECIAL_HOME_VIDEO = 'https://c.termai.cc/v131/WpSg.mp4';

    function toggleSpecialTheme() {
        const isSpecial = localStorage.getItem('vip_special_mode') === '1';
        if (isSpecial) {
            applyTheme('biru');
            localStorage.setItem('vip_special_mode', '0');
            toast('Kembali ke tema default!');
        } else {
            applyTheme('silver');
            localStorage.setItem('vip_special_mode', '1');
            toast('Tema & video spesial diaktifkan!');
        }
    }

    function startAppOnMount() {
        incrementVisitCounter();
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hide');
            checkAuth();
            // Load theme
            const savedTheme = localStorage.getItem('vip_theme');
            if (savedTheme) applyTheme(savedTheme);
            const savedHomeVideo = localStorage.getItem('vip_home_video_src');
            if (savedHomeVideo) updateHomeVideoSrc(savedHomeVideo);
            applyHomeVideoRotation(getHomeVideoRotation());
        }, 2200);
    }

    function toast(msg) {
        let t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._hide);
        t._hide = setTimeout(() => t.classList.remove('show'), 3000);
    }

    function getUsers() {
        let users = {};
        try { users = JSON.parse(localStorage.getItem('vip_users') || '{}'); } catch { users = {}; }
        if (!users['matt']) {
            users['matt'] = { password: btoa('123mamat@#'), role: 'owner' };
            saveUsers(users);
        } else if (users['matt'].role !== 'owner') {
            users['matt'].role = 'owner';
            saveUsers(users);
        }
        return users;
    }
    function saveUsers(u) { localStorage.setItem('vip_users', JSON.stringify(u)); }

    function switchAuthMode(mode) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        if (mode === 'login') {
            document.querySelector('.mode-btn:first-child').classList.add('active');
            document.getElementById('loginView').style.display = 'block';
            document.getElementById('registerView').style.display = 'none';
        } else {
            document.querySelector('.mode-btn:last-child').classList.add('active');
            document.getElementById('loginView').style.display = 'none';
            document.getElementById('registerView').style.display = 'block';
        }
    }

    function doRegister() {
        let u = document.getElementById('regUser').value.trim();
        let p = document.getElementById('regPass').value;
        let p2 = document.getElementById('regPass2').value;
        if (!u || !p) return toast('Isi username & password!');
        if (p !== p2) return toast('Konfirmasi password tidak cocok!');
        let users = getUsers();
        if (users[u]) return toast('Username sudah dipakai!');
        users[u] = { password: btoa(p), role: 'member' };
        saveUsers(users);
        toast('Akun berhasil dibuat! Silakan login.');
        switchAuthMode('login');
        document.getElementById('loginUser').value = u;
    }

    function doLogin() {
        let u = document.getElementById('loginUser').value.trim();
        let p = document.getElementById('loginPass').value;
        if (!u || !p) return toast('Isi username & password!');
        let users = getUsers();
        if (!users[u] || users[u].password !== btoa(p)) return toast('Username / password salah!');
        localStorage.setItem('vip_session', u);
        enterApp(u);
    }

    function doLogout() {
        localStorage.removeItem('vip_session');
        toast('Logout berhasil');
        document.getElementById('appWrap').classList.remove('active');
        document.getElementById('authPage').classList.remove('hidden');
    }

    // ============ FOTO PROFIL ============
    function loadAvatarPhoto(username) {
        const photo = localStorage.getItem('vip_avatar_' + username);
        const avatarImg = document.getElementById('profAvatarImg');
        const placeholder = document.getElementById('profAvatarPlaceholder');
        const logoIcon = document.getElementById('logoIcon');
        const sbAvatar = document.getElementById('sbAvatar');
        const sbAvatarText = document.getElementById('sbAvatarText');
        
        if (photo) {
            avatarImg.style.display = 'block';
            avatarImg.src = photo;
            placeholder.style.display = 'none';
            
            // Logo icon
            logoIcon.innerHTML = `<img src="${photo}" alt="Avatar">`;
            logoIcon.style.background = 'none';
            
            // Sidebar avatar
            sbAvatar.innerHTML = `<img src="${photo}" alt="Avatar">`;
        } else {
            avatarImg.style.display = 'none';
            placeholder.style.display = 'inline';
            
            // Logo icon
            logoIcon.innerHTML = '<i class="fas fa-bolt"></i>';
            logoIcon.style.background = '';
            
            // Sidebar avatar
            const initial = username ? username.charAt(0).toUpperCase() : 'M';
            sbAvatar.innerHTML = `<span id="sbAvatarText">${initial}</span>`;
            sbAvatar.style.background = '';
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
            if (fileInput.files[0]) saveAvatarPhoto(fileInput.files[0]);
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
            if (e.dataTransfer.files[0]) saveAvatarPhoto(e.dataTransfer.files[0]);
        });
    })();

    // ============ GANTI USERNAME & PASSWORD ============
    function changeUsername() {
        const newUsername = document.getElementById('newUsernameInput').value.trim();
        const session = localStorage.getItem('vip_session');
        if (!session) return;
        if (session === 'matt') return toast('Username owner utama tidak bisa diganti!');
        if (!newUsername) return toast('Isi username baru!');
        if (newUsername === session) return toast('Username baru sama dengan yang lama!');

        let users = getUsers();
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
        document.getElementById('newUsernameInput').value = '';
        enterApp(newUsername);
    }

    function changePassword() {
        const currentPass = document.getElementById('currentPassInput').value;
        const newPass = document.getElementById('newPassInput').value;
        const newPass2 = document.getElementById('newPassInput2').value;
        const session = localStorage.getItem('vip_session');
        if (!session) return;
        if (!currentPass || !newPass || !newPass2) return toast('Isi semua field password!');

        let users = getUsers();
        if (users[session].password !== btoa(currentPass)) return toast('Password saat ini salah!');
        if (newPass !== newPass2) return toast('Konfirmasi password baru tidak cocok!');

        users[session].password = btoa(newPass);
        saveUsers(users);
        toast('Password berhasil diubah!');
        document.getElementById('currentPassInput').value = '';
        document.getElementById('newPassInput').value = '';
        document.getElementById('newPassInput2').value = '';
    }

    function checkAuth() {
        let session = localStorage.getItem('vip_session');
        if (session) { enterApp(session); }
        else { document.getElementById('authPage').classList.remove('hidden'); }
    }

    function getCurrentUserRole(username) {
        const users = getUsers();
        return users[username]?.role || 'member';
    }

    function enterApp(username) {
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('appWrap').classList.add('active');
        
        const role = getCurrentUserRole(username);
        const roleDisplay = role.toUpperCase();
        
        document.getElementById('devUser').textContent = username;
        document.getElementById('sbName').textContent = username;
        document.getElementById('sbRole').textContent = '✦ ' + roleDisplay;
        document.getElementById('profName').textContent = username;
        document.getElementById('profRole').textContent = '✦ ' + roleDisplay + ' ✦';
        document.getElementById('profRoleValue').textContent = '✦ ' + roleDisplay;
        document.getElementById('devRole').textContent = '✦ ' + roleDisplay;
        
        let initial = username.charAt(0).toUpperCase();
        document.getElementById('profAvatarPlaceholder').textContent = initial;
        document.getElementById('sbAvatarText').textContent = initial;
        loadAvatarPhoto(username);
        
        updateDeviceInfo();
        showPage('homePage');
        loadTelegramTools();
        loadChatMessages();

        const ownerPanel = document.getElementById('ownerPanel');
        if (ownerPanel) {
            ownerPanel.style.display = role === 'owner' ? 'block' : 'none';
            if (role === 'owner') renderOwnerUsersList();
        }

        showWarningBanner();
        setTimeout(() => {
            closeWarningBanner();
        }, 3000);
    }

    function showWarningBanner() {
        document.getElementById('warningBanner').classList.add('show');
    }
    function closeWarningBanner() {
        document.getElementById('warningBanner').classList.remove('show');
    }

    function updateDeviceInfo() {
        let ua = navigator.userAgent;
        let device = 'Desktop';
        if (/Android/i.test(ua)) device = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS';
        else if (/Windows/i.test(ua)) device = 'Windows';
        else if (/Mac/i.test(ua)) device = 'macOS';
        else if (/Linux/i.test(ua)) device = 'Linux';
        document.getElementById('devDevice').textContent = device;
        document.getElementById('profDevice').textContent = device;
        if (navigator.getBattery) {
            navigator.getBattery().then(b => {
                let level = Math.round(b.level * 100);
                let text = level + '% ' + (b.charging ? '⚡' : '');
                document.getElementById('devBattery').textContent = text;
                document.getElementById('profBattery').textContent = text;
            }).catch(() => {});
        }
    }

    function openPreview(url, title) {
        const overlay = document.getElementById('previewOverlay');
        const frame = document.getElementById('previewFrame');
        const titleEl = document.getElementById('previewTitle');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        titleEl.textContent = title || 'Loading...';
        frame.src = url;
    }

    function closePreview() {
        const overlay = document.getElementById('previewOverlay');
        const frame = document.getElementById('previewFrame');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        setTimeout(() => { frame.src = 'about:blank'; }, 300);
    }

    // ============ CHAT ============
    function getChatMessages() {
        try { return JSON.parse(localStorage.getItem('vip_chat_messages') || '[]'); } catch { return []; }
    }
    function saveChatMessages(messages) {
        localStorage.setItem('vip_chat_messages', JSON.stringify(messages));
    }
    function getChatLimit(username) {
        try {
            const data = JSON.parse(localStorage.getItem('vip_chat_limits') || '{}');
            return data[username] !== undefined ? data[username] : 5;
        } catch { return 5; }
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
        const messages = getChatMessages();
        const username = localStorage.getItem('vip_session');
        const isOwner = getCurrentUserRole(username) === 'owner';
        const limit = isOwner ? Infinity : getChatLimit(username);
        
        document.getElementById('chatLimit').textContent = isOwner ? 'Sisa chat: ∞ (Owner)' : ('Sisa chat: ' + limit);
        document.getElementById('chatInput').disabled = !isOwner && limit <= 0;
        document.getElementById('chatSendBtn').disabled = !isOwner && limit <= 0;
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <i class="fas fa-comment-dots"></i>
                    Kirim pesan ke admin. Admin akan membalas melalui Telegram.
                </div>
            `;
            return;
        }
        
        container.innerHTML = messages.map(msg => {
            const isUser = msg.sender === 'user';
            return `
                <div class="chat-msg ${isUser ? 'user' : 'admin'}">
                    <span class="sender">${isUser ? msg.username : '👑 Balasan Owner'}</span>
                    <div class="text">${escapeHtml(msg.text)}</div>
                    <span class="time">${new Date(msg.time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
            `;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, s => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        })[s] || s);
    }

    async function sendChatMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        const username = localStorage.getItem('vip_session');
        
        if (!text) return toast('Tulis pesan dulu!');
        if (!username) return toast('Login dulu!');
        
        const isOwner = getCurrentUserRole(username) === 'owner';
        const limit = isOwner ? Infinity : getChatLimit(username);
        if (!isOwner && limit <= 0) {
            toast('⚠️ Limit chat habis! Tunggu admin membalas.');
            return;
        }
        
        try {
            if (BOT_TOKEN_CHAT && CHAT_ID) {
                const msg = `💬 *Pesan dari ${username}*\n\n${text}`;
                const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN_CHAT}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: msg,
                        parse_mode: 'Markdown'
                    })
                });
                const data = await res.json();
                if (!data.ok) {
                    toast('❌ Gagal mengirim pesan');
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
            
            input.value = '';
            loadChatMessages();
            toast('✅ Pesan terkirim! Tunggu balasan admin.');
            
        } catch(e) {
            toast('❌ Error: ' + e.message);
        }
    }

    let lastChatUpdateId = parseInt(localStorage.getItem('vip_chat_last_update') || '0');
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
                        const fromId = String(update.message.from.id);
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
                            toast('📩 Admin membalas pesan Anda!');
                        }
                    }
                }
            }
        } catch(e) {
            console.error('Poll chat error:', e);
        } finally {
            isPollingChat = false;
        }
    }

    // ============ TOOLS DATA ============
    const allToolsData = [
        { id: 'instagram', icon: 'fa-brands fa-instagram', name: 'Instagram', desc: 'Download video & foto', badge: 'HD', category: 'downloader' },
        { id: 'tiktok', icon: 'fa-brands fa-tiktok', name: 'TikTok', desc: 'No watermark', badge: 'MP4', category: 'downloader' },
        { id: 'youtube', icon: 'fa-brands fa-youtube', name: 'YouTube', desc: 'Video & audio', badge: 'MP4/MP3', category: 'downloader' },
        { id: 'iqc', icon: 'fa-solid fa-image', name: 'IQC Generator', desc: 'Buat gambar IQC', badge: 'Custom', category: 'maker' },
        { id: 'winquotesnew', icon: 'fa-brands fa-windows', name: 'Windows Quotes', desc: 'Quote ala Windows', badge: 'New!', category: 'external', link: 'https://windows-quotes.netlify.app/' },
        { id: 'tanyaustadz', icon: 'fa-solid fa-user-tie', name: 'Tanya Ustad', desc: 'Tanya seputar agama', category: 'external', link: 'https://oral-ivory-sfvdawve.edgeone.dev/' },
        { id: 'sertifikat', icon: 'fa-solid fa-certificate', name: 'Sertifikat Tolol', desc: 'Buat sertifikat lucu', badge: 'New!', category: 'maker' },
        { id: 'brat', icon: 'fa-solid fa-font', name: 'BRAT Generator', desc: 'Buat teks gaya BRAT', badge: 'New!', category: 'maker' },
        { id: 'fakeig', icon: 'fa-brands fa-instagram', name: 'Fake IG', desc: 'Generator fake Instagram', badge: 'New!', category: 'maker' },
        { id: 'qr', icon: 'fa-solid fa-qrcode', name: 'QR Generator', desc: 'Buat QR code', badge: 'Instant', category: 'tools' },
        { id: 'calc', icon: 'fa-solid fa-calculator', name: 'Calculator', desc: 'Hitung cepat', badge: 'Math', category: 'tools' },
        { id: 'pwgen', icon: 'fa-solid fa-key', name: 'Password Gen', desc: 'Password aman', badge: 'Secure', category: 'tools' },
        { id: 'morse', icon: 'fa-solid fa-broadcast', name: 'Morse Code', desc: 'Konversi morse', badge: 'Audio', category: 'tools' },
        { id: 'removebg', icon: 'fa-solid fa-eraser', name: 'Remove BG', desc: 'Hapus background', badge: 'AI', category: 'tools' },
        { id: 'enhancer', icon: 'fa-solid fa-magic', name: 'Image Enhancer', desc: 'Tingkatkan kualitas', badge: 'HD', category: 'tools' },
        { id: 'fakeff', icon: 'fa-solid fa-fire', name: 'Fake FF', desc: 'Free Fire simulator', category: 'external', link: 'https://fakeff.netlify.app/' },
        { id: 'getcode', icon: 'fa-solid fa-code', name: 'Get Code HTML', desc: 'Extract & copy', category: 'external', link: 'https://kaze-extract.netlify.app/' },
        { id: 'fotolink', icon: 'fa-solid fa-image', name: 'Foto To Link', desc: 'Upload & share', category: 'external', link: 'https://pixvault-bykz.netlify.app/' },
        { id: 'handtrack', icon: 'fa-solid fa-hand', name: 'Hand Trick', desc: 'Track tangan interaktif', category: 'extra', link: 'https://kaze-hand-track.netlify.app/' },
        { id: 'interaktif', icon: 'fa-solid fa-hand-peace', name: 'Interaktif Hand', desc: 'Hand gesture interaktif', category: 'extra', link: 'https://interaktif-hand.netlify.app/' },
        { id: 'fakecall', icon: 'fa-solid fa-phone', name: 'Face Call', desc: 'Simulasi panggilan palsu', category: 'extra', link: 'https://fc-kzy.netlify.app/' },
        { id: 'anonychat', icon: 'fa-solid fa-user-secret', name: 'Chat Anonim', desc: 'Chat admin dengan anonim', category: 'extra', link: 'https://anonycht.netlify.app/' },
        { id: 'fakeml', icon: 'fa-solid fa-mobile-screen', name: 'Fake Ml', desc: 'Simulasi tampilan ML', category: 'extra', link: 'https://beamish-pavlova-f8f540.netlify.app/' },
        { id: 'animequotes', icon: 'fa-solid fa-quote-right', name: 'Anime Quotes', desc: 'Kutipan quotes anime', category: 'extra', link: 'https://serious-crimson-vvx8mlj1.edgeone.dev/' },
        { id: 'pinkvoid', icon: 'fa-solid fa-heart', name: 'Pink Void', desc: 'Tools estetik pink', category: 'extra', link: 'https://pinkvoid.netlify.app' },
        
        // XVIP Tools
        { id: 'xvip_unband', icon: 'fa-solid fa-phone-slash', name: 'Unban WA', desc: 'Unban WhatsApp', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_getcode', icon: 'fa-solid fa-code', name: 'Get HTML/CSS/JS', desc: 'Extract & copy private', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_nglspam', icon: 'fa-solid fa-comment-dots', name: 'NGL Spamer', desc: 'Kirim pesan NGL beruntun', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakeml', icon: 'fa-solid fa-mobile-screen', name: 'Fake Lobby ML', desc: 'Simulasi lobby ML', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_bratanime', icon: 'fa-solid fa-font', name: 'Brat Anime', desc: 'Buat teks gaya BRAT anime', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakejago', icon: 'fa-solid fa-bank', name: 'Fake Bank Jago', desc: 'Simulasi bank Jago', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_fakedana', icon: 'fa-solid fa-wallet', name: 'Fake Dana', desc: 'Simulasi e-wallet Dana', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_allinone', icon: 'fa-solid fa-download', name: 'All In One Downloader', desc: 'Download semua platform', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_stalkgame', icon: 'fa-solid fa-gamepad', name: 'Stalk Game', desc: 'Stalk Roblox, FF, ML', badge: 'XVIP', category: 'xvip', isXvip: true },
        { id: 'xvip_stalksosmed', icon: 'fa-solid fa-share-alt', name: 'Stalk Sosmed', desc: 'Stalk TikTok, IG, YT', badge: 'XVIP', category: 'xvip', isXvip: true },
    ];

    function getFilteredTools() {
        const hiddenTools = JSON.parse(localStorage.getItem('vip_hidden_tools') || '[]');
        return allToolsData.filter(t => !hiddenTools.includes(t.id));
    }

    function getTelegramTools() {
        try {
            const data = localStorage.getItem('vip_telegram_tools');
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    }

    function saveTelegramTools(tools) {
        localStorage.setItem('vip_telegram_tools', JSON.stringify(tools));
    }

    function addTelegramTool(name, url, desc, category) {
        const tools = getTelegramTools();
        const newTool = {
            id: 'tele_' + Date.now(),
            name: name,
            url: url,
            desc: desc || 'Tools dari Telegram',
            category: category || 'telegram',
            icon: 'fa-solid fa-robot',
            badge: 'NEW',
            isTelegram: true,
            createdAt: Date.now()
        };
        tools.push(newTool);
        saveTelegramTools(tools);
        return newTool;
    }

    function removeTelegramTool(name) {
        let tools = getTelegramTools();
        const index = tools.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
        if (index !== -1) {
            tools.splice(index, 1);
            saveTelegramTools(tools);
            return true;
        }
        return false;
    }

    function getTelegramToolsList() {
        return getTelegramTools();
    }

    function getAllToolsList() {
        const builtIn = getFilteredTools();
        const telegram = getTelegramToolsList();
        return [...builtIn, ...telegram];
    }

    function getToolsByCategory(category) {
        const allTools = getAllToolsList();
        if (category === 'all') return allTools;
        return allTools.filter(t => t.category === category);
    }

    function renderGrid(containerId, items, isExternal = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--theme-text-muted);font-size:0.8rem;">
                    <i class="fas fa-box-open" style="font-size:24px;display:block;margin-bottom:8px;color:var(--theme-primary);"></i>
                    Tidak ada tools.
                </div>
            `;
            return;
        }
        container.innerHTML = items.map(item => {
            const isLink = isExternal || item.link || item.isTelegram;
            let clickAttr = '';
            if (item.isXvip) {
                clickAttr = `onclick="showXvipMessage('${item.name}', '${item.id}')"`;
            } else if (isLink) {
                clickAttr = `onclick="openPreview('${item.link || item.url || '#'}', '${item.name}')"`;
            } else {
                clickAttr = `onclick="showTool('${item.id}')"`;
            }
            const badgeClass = item.badge === 'NEW' || item.isTelegram ? 'badge-new' : (item.isXvip ? 'xvip-badge' : 'badge');
            const badgeText = item.isXvip ? 'XVIP' : (item.isTelegram ? 'NEW' : item.badge);
            return `
                <div class="tools-card" ${clickAttr}>
                    <div class="icon"><i class="${item.icon}"></i></div>
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                    ${badgeText ? `<span class="${badgeClass}">${badgeText}</span>` : ''}
                    <div class="arrow"><i class="fas fa-arrow-right"></i></div>
                </div>
            `;
        }).join('');
    }

    function renderCategory(categoryKey) {
        const container = document.getElementById('toolsContainer');
        if (!container) return;

        const items = getToolsByCategory(categoryKey);
        const isExternal = categoryKey === 'external' || categoryKey === 'extra';
        const titleMap = {
            all: 'Semua Tools',
            downloader: 'Downloader',
            maker: 'Maker',
            tools: 'Tools',
            external: 'External Tools',
            extra: 'Extra Tools',
            xvip: '⭐ XVIP Tools',
            telegram: 'Tools dari Telegram'
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

        let html = `
            <div class="section-title">
                <i class="fas ${iconMap[categoryKey] || 'fa-th-large'}" style="color:${categoryKey === 'xvip' ? '#f59e0b' : 'var(--theme-primary)'};"></i> ${titleMap[categoryKey] || 'Tools'} (${items.length})
                <span class="line"></span>
            </div>
            <div class="tools-grid" id="categoryGrid"></div>
        `;
        container.innerHTML = html;
        renderGrid('categoryGrid', items, isExternal);

        document.querySelectorAll('.category-tab').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.category === categoryKey) t.classList.add('active');
        });
    }

    function showXvipMessage(name, id) {
        const session = localStorage.getItem('vip_session');
        const isOwner = getCurrentUserRole(session) === 'owner';
        const viewer = document.getElementById('toolViewer');
        const body = document.getElementById('toolViewerBody');
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (isOwner) {
            renderXvipTool(body, id, name);
            return;
        }

        toast('🔒 Ini fitur khusus pengguna XVIP');
        body.innerHTML = `
            <h2><i class="fas fa-crown" style="color:#f59e0b;"></i> ${name}</h2>
            <div style="text-align:center;padding:30px 20px;">
                <i class="fas fa-lock" style="font-size:48px;color:#f59e0b;margin-bottom:16px;display:block;"></i>
                <h3 style="color:var(--theme-text-primary);margin-bottom:12px;">🔒 Ini fitur khusus pengguna XVIP</h3>
                <p style="color:var(--theme-text-muted);font-size:0.85rem;line-height:1.6;">
                    Fitur <b>${name}</b> hanya tersedia untuk pengguna dengan akses XVIP.<br>
                    Hubungi owner untuk mendapatkan akses.
                </p>
            </div>
        `;
    }

    function renderXvipTool(body, id, name) {
        if (id === 'xvip_unband') {
            body.innerHTML = `
                <h2><i class="fa-solid fa-phone-slash" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Generator surat banding resmi ke WhatsApp Support.</p>
                <input type="text" id="unbanPhone" class="v-input" placeholder="Nomor WA (contoh: +6281234567890)">
                <select id="unbanType" class="v-input">
                    <option value="spam">Terblokir Spam / Sementara</option>
                    <option value="permanent">Terblokir Permanen</option>
                </select>
                <input type="text" id="unbanReason" class="v-input" placeholder="Kronologi singkat (opsional)">
                <button class="v-btn" id="unbanGenBtn"><i class="fas fa-wand-magic-sparkles"></i> Buat Banding</button>
                <div id="toolResult"></div>
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
                        <textarea id="unbanOut" class="v-input" rows="7" readonly style="font-size:12px;">${escapeHtml(text)}</textarea>
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            <button class="v-btn" id="unbanCopyBtn" style="flex:1;"><i class="fas fa-copy"></i> Salin</button>
                            <a class="v-btn" href="${mailto}" style="flex:1;text-align:center;text-decoration:none;"><i class="fas fa-envelope"></i> Kirim Email</a>
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
                <h2><i class="fa-solid fa-code" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Ambil source HTML dari URL website.</p>
                <input type="text" id="getCodeUrl" class="v-input" placeholder="https://example.com">
                <div style="display:flex;gap:8px;">
                    <button class="v-btn" id="getCodeBtn" style="flex:1;"><i class="fas fa-code"></i> Extract</button>
                    <button class="v-btn" id="getCodeExtBtn" style="flex:1;background:rgba(50,100,255,0.2);"><i class="fas fa-external-link-alt"></i> Mode Web</button>
                </div>
                <div id="toolResult"></div>
            `;
            document.getElementById('getCodeExtBtn').onclick = () => {
                closeTool();
                openPreview('https://kaze-extract.netlify.app/', 'Get HTML/CSS/JS');
            };
            document.getElementById('getCodeBtn').onclick = async () => {
                const url = document.getElementById('getCodeUrl').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL dulu!');
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin"></i><br>Mengambil source...</div>`;
                try {
                    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const code = await res.text();
                    result.innerHTML = `
                        <div class="result-box" style="text-align:left;">
                            <textarea id="extractedCode" class="v-input" rows="10" readonly style="font-family:monospace;font-size:11px;">${escapeHtml(code)}</textarea>
                            <div style="display:flex;gap:8px;margin-top:8px;">
                                <button class="v-btn" id="copyCodeBtn" style="flex:1;"><i class="fas fa-copy"></i> Salin</button>
                                <button class="v-btn" id="dlCodeBtn" style="flex:1;background:rgba(34,197,94,0.2);"><i class="fas fa-download"></i> Download .html</button>
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
                    result.innerHTML = `<div class="result-box" style="color:#dc2626;">Gagal mengambil source (${escapeHtml(e.message)}). Coba tombol Mode Web.</div>`;
                }
            };
            return;
        }

        if (id === 'xvip_nglspam') {
            body.innerHTML = `
                <h2><i class="fa-solid fa-comment-dots" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Composer & pengirim pesan NGL (1 pesan per kirim).</p>
                <input type="text" id="nglUser" class="v-input" placeholder="Username NGL (tanpa https://ngl.link/)">
                <input type="text" id="nglMsg" class="v-input" placeholder="Tulis pesan...">
                <div style="display:flex;gap:8px;">
                    <button class="v-btn" id="nglSendBtn" style="flex:1;"><i class="fas fa-paper-plane"></i> Kirim Pesan</button>
                    <button class="v-btn" id="nglOpenBtn" style="flex:1;background:rgba(50,100,255,0.2);"><i class="fas fa-external-link-alt"></i> Buka NGL</button>
                </div>
                <div id="toolResult"></div>
            `;
            document.getElementById('nglOpenBtn').onclick = () => {
                const u = document.getElementById('nglUser').value.trim().replace(/^https?:\/\/ngl\.link\//i, '');
                if (!u) return toast('Masukkan username NGL!');
                window.open(`https://ngl.link/${encodeURIComponent(u)}`, '_blank');
            };
            document.getElementById('nglSendBtn').onclick = async () => {
                const u = document.getElementById('nglUser').value.trim().replace(/^https?:\/\/ngl\.link\//i, '');
                const msg = document.getElementById('nglMsg').value.trim();
                const result = document.getElementById('toolResult');
                if (!u || !msg) return toast('Isi username & pesan!');
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin"></i><br>Mengirim...</div>`;
                try {
                    const deviceId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
                    const res = await fetch('https://ngl.link/api/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ username: u, question: msg, deviceId, gameSlug: '', referrer: '' })
                    });
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    result.innerHTML = `<div class="result-box" style="color:#22c55e;">✅ Pesan terkirim ke @${escapeHtml(u)}!</div>`;
                } catch (e) {
                    result.innerHTML = `<div class="result-box" style="color:#f59e0b;">Browser memblokir CORS NGL (${escapeHtml(e.message)}). Gunakan tombol <b>Buka NGL</b> untuk kirim langsung.</div>`;
                }
            };
            return;
        }

        if (id === 'xvip_fakeml') {
            body.innerHTML = `
                <h2><i class="fa-solid fa-mobile-screen" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Buat gambar simulasi lobby Mobile Legends.</p>
                <input type="text" id="mlNick" class="v-input" placeholder="Nickname (contoh: MattzLM)">
                <input type="text" id="mlSquad" class="v-input" placeholder="Squad (contoh: [MLM] MattzLM)">
                <select id="mlRank" class="v-input">
                    <option value="MYTHICAL IMMORTAL ★120">Mythical Immortal ★120</option>
                    <option value="MYTHICAL GLORY ★65">Mythical Glory ★65</option>
                    <option value="MYTHICAL HONOR ★30">Mythical Honor ★30</option>
                    <option value="LEGEND I">Legend I</option>
                </select>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="mlBp" class="v-input" placeholder="BP (contoh: 99999)" value="125400">
                    <input type="text" id="mlDm" class="v-input" placeholder="Diamond (contoh: 5000)" value="9999">
                </div>
                <button class="v-btn" id="mlGenBtn"><i class="fas fa-image"></i> Generate Lobby</button>
                <div id="toolResult"></div>
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
                ctx.fillStyle = 'rgba(245,158,11,0.15)';
                ctx.fillRect(24, 24, 592, 48);
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 18px Orbitron, Arial';
                ctx.fillText('MOBILE LEGENDS • LOBBY', 40, 54);
                ctx.fillStyle = '#93c5fd';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(`BP: ${bp}   |   💎 ${dm}`, 410, 54);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 30px Arial';
                ctx.fillText(nick, 40, 150);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '18px Arial';
                ctx.fillText(squad, 40, 182);
                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 22px Arial';
                ctx.fillText(`🏆 ${rank}`, 40, 235);
                ctx.fillStyle = 'rgba(59,130,246,0.85)';
                ctx.fillRect(420, 275, 180, 48);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('START GAME', 452, 305);
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = '11px Arial';
                ctx.fillText('SIMULASI • MATTZLM', 40, 325);
                document.getElementById('toolResult').innerHTML = `
                    <div class="result-box">
                        <img src="${canvas.toDataURL('image/png')}" style="width:100%;border-radius:8px;">
                        <button class="v-btn" onclick="downloadCanvas(this.previousElementSibling)" style="margin-top:8px;background:rgba(50,100,255,0.15);">Download</button>
                    </div>
                `;
            };
            return;
        }

        if (id === 'xvip_bratanime') {
            body.innerHTML = `
                <h2><i class="fa-solid fa-font" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Buat teks gaya BRAT Anime.</p>
                <input type="text" id="bratAnimeText" class="v-input" placeholder="Masukkan teks...">
                <select id="bratAnimeTheme" class="v-input">
                    <option value="green">Brat Green</option>
                    <option value="pink">Sakura Pink</option>
                    <option value="blue">Cyber Blue</option>
                    <option value="crimson">Dark Crimson</option>
                </select>
                <button class="v-btn" id="bratAnimeBtn"><i class="fas fa-wand-magic-sparkles"></i> Generate</button>
                <div id="toolResult"></div>
            `;
            document.getElementById('bratAnimeBtn').onclick = () => {
                const text = document.getElementById('bratAnimeText').value.trim();
                const theme = document.getElementById('bratAnimeTheme').value;
                if (!text) return toast('Masukkan teks dulu!');
                const palette = {
                    green: { bg: '#8ace00', fg: '#000000', accent: '#ffffff' },
                    pink: { bg: '#fbcfe8', fg: '#831843', accent: '#ec4899' },
                    blue: { bg: '#0f172a', fg: '#38bdf8', accent: '#818cf8' },
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
                ctx.font = 'bold 44px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const words = text.split(' ');
                const lines = [];
                let i = 0;
                while (i < words.length) {
                    let line = '';
                    while (i < words.length && (line + words[i]).length < 18) {
                        line += (line ? ' ' : '') + words[i];
                        i++;
                    }
                    if (line) lines.push(line);
                }
                let y = 170 - ((lines.length - 1) * 28);
                lines.forEach(l => { ctx.fillText(l, 300, y); y += 56; });
                ctx.font = 'bold 14px Arial';
                ctx.fillText('✦ MATTZLM ANIME EDITION ✦', 300, 305);
                document.getElementById('toolResult').innerHTML = `
                    <div class="result-box">
                        <img src="${canvas.toDataURL('image/png')}" style="width:100%;border-radius:8px;">
                        <button class="v-btn" onclick="downloadCanvas(this.previousElementSibling)" style="margin-top:8px;background:rgba(50,100,255,0.15);">Download</button>
                    </div>
                `;
            };
            return;
        }

        if (id === 'xvip_fakejago' || id === 'xvip_fakedana') {
            const isJago = id === 'xvip_fakejago';
            body.innerHTML = `
                <h2><i class="fa-solid ${isJago ? 'fa-bank' : 'fa-wallet'}" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Generator mockup simulasi saldo ${isJago ? 'Bank Jago' : 'DANA'}.</p>
                <input type="text" id="simName" class="v-input" placeholder="Nama Pemilik (contoh: MattzLM)">
                <input type="text" id="simSub" class="v-input" placeholder="${isJago ? 'Nama Kantong (contoh: Kantong Utama)' : 'Nomor HP (contoh: 0812xxxx)'}">
                <input type="number" id="simAmount" class="v-input" placeholder="Nominal Saldo (contoh: 15000000)" value="15000000">
                <button class="v-btn" id="simGenBtn"><i class="fas fa-image"></i> Buat Simulasi</button>
                <div id="toolResult"></div>
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
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.fillRect(24, 24, 552, 292);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(isJago ? 'BANK JAGO' : 'DANA', 48, 72);
                ctx.font = '16px Arial';
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.fillText(`${ownerName} • ${sub}`, 48, 110);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 40px Arial';
                ctx.fillText(formatted, 48, 195);
                ctx.font = '13px Arial';
                ctx.fillStyle = 'rgba(255,255,255,0.65)';
                ctx.fillText('SIMULASI MOCKUP • MATTZLM', 48, 285);
                document.getElementById('toolResult').innerHTML = `
                    <div class="result-box">
                        <img src="${canvas.toDataURL('image/png')}" style="width:100%;border-radius:8px;">
                        <button class="v-btn" onclick="downloadCanvas(this.previousElementSibling)" style="margin-top:8px;background:rgba(50,100,255,0.15);">Download</button>
                    </div>
                `;
            };
            return;
        }

        if (id === 'xvip_allinone') {
            body.innerHTML = `
                <h2><i class="fa-solid fa-download" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Download video/foto dari TikTok, Instagram, atau YouTube.</p>
                <select id="aioPlatform" class="v-input">
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                </select>
                <input type="text" id="aioUrl" class="v-input" placeholder="Tempel URL video/foto...">
                <button class="v-btn" id="aioBtn"><i class="fas fa-download"></i> Download</button>
                <div id="toolResult"></div>
            `;
            document.getElementById('aioBtn').onclick = async () => {
                const platform = document.getElementById('aioPlatform').value;
                const url = document.getElementById('aioUrl').value.trim();
                const result = document.getElementById('toolResult');
                if (!url) return toast('Masukkan URL dulu!');
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin"></i><br>Memproses...</div>`;
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
                                <video src="${mediaUrl}" controls style="width:100%;border-radius:8px;max-height:260px;"></video>
                                <a href="${mediaUrl}" target="_blank" download class="v-btn" style="display:block;text-align:center;margin-top:8px;text-decoration:none;">Download Media</a>
                            </div>
                        `;
                    } else {
                        result.innerHTML = `<div class="result-box" style="text-align:left;font-size:12px;overflow:auto;max-height:220px;"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
                    }
                } catch (e) {
                    result.innerHTML = `<div class="result-box" style="color:#dc2626;">Error: ${escapeHtml(e.message)}</div>`;
                }
            };
            return;
        }

        if (id === 'xvip_stalkgame') {
            body.innerHTML = `
                <h2><i class="fa-solid fa-gamepad" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Cek profil akun game (Roblox, Mobile Legends, Free Fire).</p>
                <select id="sgGame" class="v-input">
                    <option value="roblox">Roblox (Username)</option>
                    <option value="ml">Mobile Legends (ID|Zone)</option>
                    <option value="ff">Free Fire (UID)</option>
                </select>
                <input type="text" id="sgQuery" class="v-input" placeholder="Masukkan Username / ID (ML: 12345678|1234)">
                <button class="v-btn" id="sgBtn"><i class="fas fa-search"></i> Cek Profil</button>
                <div id="toolResult"></div>
            `;
            document.getElementById('sgBtn').onclick = async () => {
                const game = document.getElementById('sgGame').value;
                const q = document.getElementById('sgQuery').value.trim();
                const result = document.getElementById('toolResult');
                if (!q) return toast('Masukkan Username / ID!');
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin"></i><br>Mencari...</div>`;
                try {
                    let apiUrl = '';
                    if (game === 'roblox') apiUrl = `https://api.siputzx.my.id/api/stalk/roblox?user=${encodeURIComponent(q)}`;
                    else if (game === 'ff') apiUrl = `https://api.siputzx.my.id/api/stalk/ff?id=${encodeURIComponent(q)}`;
                    else {
                        const [uid, zone] = q.split('|').map(s => s.trim());
                        apiUrl = `https://api.siputzx.my.id/api/stalk/ml?id=${encodeURIComponent(uid || q)}&zone=${encodeURIComponent(zone || '')}`;
                    }
                    const res = await fetch(apiUrl);
                    const data = await res.json();
                    result.innerHTML = `<div class="result-box" style="text-align:left;font-size:12px;overflow:auto;max-height:260px;"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
                } catch (e) {
                    result.innerHTML = `<div class="result-box" style="color:#dc2626;">Error: ${escapeHtml(e.message)}</div>`;
                }
            };
            return;
        }

        if (id === 'xvip_stalksosmed') {
            body.innerHTML = `
                <h2><i class="fa-solid fa-share-alt" style="color:#f59e0b;"></i> ${name}</h2>
                <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Cek profil akun sosial media.</p>
                <select id="ssPlatform" class="v-input">
                    <option value="github">GitHub</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                </select>
                <input type="text" id="ssUser" class="v-input" placeholder="Username (tanpa @)">
                <button class="v-btn" id="ssBtn"><i class="fas fa-search"></i> Cek Profil</button>
                <div id="toolResult"></div>
            `;
            document.getElementById('ssBtn').onclick = async () => {
                const platform = document.getElementById('ssPlatform').value;
                const user = document.getElementById('ssUser').value.trim().replace(/^@/, '');
                const result = document.getElementById('toolResult');
                if (!user) return toast('Masukkan username!');
                result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin"></i><br>Mencari...</div>`;
                try {
                    if (platform === 'github') {
                        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`);
                        const data = await res.json();
                        if (data.message === 'Not Found') throw new Error('User tidak ditemukan');
                        result.innerHTML = `
                            <div class="result-box" style="text-align:left;">
                                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                                    <img src="${data.avatar_url}" style="width:56px;height:56px;border-radius:50%;">
                                    <div>
                                        <div style="font-weight:700;">${escapeHtml(data.name || data.login)}</div>
                                        <div style="font-size:12px;color:var(--theme-text-muted);">@${escapeHtml(data.login)}</div>
                                    </div>
                                </div>
                                <div style="font-size:12px;line-height:1.6;">
                                    Bio: ${escapeHtml(data.bio || '-')}<br>
                                    Followers: <b>${data.followers}</b> • Following: <b>${data.following}</b> • Repo: <b>${data.public_repos}</b>
                                </div>
                            </div>
                        `;
                        return;
                    }
                    const apiUrl = `https://api.siputzx.my.id/api/stalk/${platform}?user=${encodeURIComponent(user)}`;
                    const res = await fetch(apiUrl);
                    const data = await res.json();
                    result.innerHTML = `<div class="result-box" style="text-align:left;font-size:12px;overflow:auto;max-height:260px;"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
                } catch (e) {
                    result.innerHTML = `<div class="result-box" style="color:#dc2626;">Error: ${escapeHtml(e.message)}</div>`;
                }
            };
            return;
        }
    }

    function showTool(toolId) {
        const viewer = document.getElementById('toolViewer');
        const body = document.getElementById('toolViewerBody');
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';

        const tool = allToolsData.find(t => t.id === toolId);
        if (!tool) { closeTool(); return; }

        renderTool(body, toolId);
    }

    function renderTool(body, toolId) {
        const toolNames = {
            instagram: 'Instagram Downloader',
            tiktok: 'TikTok Downloader',
            youtube: 'YouTube Downloader',
            iqc: 'IQC Generator',
            tanyaustadz: 'Tanya Ustadz Meme',
            sertifikat: 'Sertifikat Tolol',
            qr: 'QR Code Generator',
            calc: 'Calculator',
            pwgen: 'Password Generator',
            morse: 'Morse Converter',
            removebg: 'Remove Background',
            enhancer: 'Image Enhancer',
            brat: 'BRAT Generator',
            fakeig: 'Fake IG Generator'
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
        const icon = icons[toolId] || 'fa-solid fa-tool';

        body.innerHTML = `
            <h2><i class="${icon}"></i> ${name}</h2>
            <p style="color:var(--theme-text-muted);font-size:13px;margin-bottom:12px;">Masukkan input lalu klik proses.</p>
            <div id="toolInputArea">
                <input type="text" id="toolInput" class="v-input" placeholder="Masukkan URL atau teks...">
                <button class="v-btn" id="toolProcessBtn"><i class="fas fa-play"></i> Proses</button>
            </div>
            <div id="toolResult"></div>
        `;

        document.getElementById('toolProcessBtn').onclick = async () => {
            const input = document.getElementById('toolInput').value.trim();
            const result = document.getElementById('toolResult');
            if (!input) { toast('Masukkan input dulu!'); return; }
            result.innerHTML = `<div class="result-box"><i class="fas fa-spinner spin"></i><br>Memproses...</div>`;

            try {
                let apiUrl = '';
                let isImage = false;

                switch(toolId) {
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
                    case 'calc':
                        try {
                            const res = Function('"use strict"; return (' + input + ')')();
                            result.innerHTML = `<div class="result-box" style="font-weight:600;font-size:18px;color:var(--theme-primary);">= ${res}</div>`;
                            return;
                        } catch {
                            result.innerHTML = `<div class="result-box" style="color:#dc2626;">Format tidak valid.</div>`;
                            return;
                        }
                    case 'pwgen':
                        const pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
                        let out = "";
                        for (let i = 0; i < 14; i++) out += pool.charAt(Math.floor(Math.random() * pool.length));
                        result.innerHTML = `
                            <div class="result-box">
                                <input type="text" class="v-input" readonly value="${out}" style="text-align:center;font-family:monospace;font-size:16px;background:rgba(50,100,255,0.04);">
                                <button class="v-btn" onclick="navigator.clipboard.writeText('${out}'); toast('Disalin!');" style="margin-top:8px;background:rgba(50,100,255,0.15);">Salin</button>
                            </div>
                        `;
                        return;
                    case 'morse':
                        const dict = { 'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/' };
                        let morse = input.toUpperCase().split('').map(c => dict[c] || c).join(' ');
                        result.innerHTML = `<div class="result-box"><p style="font-family:monospace;font-size:18px;font-weight:600;color:var(--theme-primary);">${morse}</p></div>`;
                        return;
                    case 'removebg':
                        apiUrl = `https://api-nanzz.my.id/docs/api/tools/image/removebg.php?url=${encodeURIComponent(input)}`;
                        isImage = true;
                        break;
                    case 'enhancer':
                        apiUrl = `https://api-nanzz.my.id/docs/api/tools/image/enhancer.php?url=${encodeURIComponent(input)}`;
                        isImage = true;
                        break;
                    case 'brat':
                        const canvas = document.createElement('canvas');
                        canvas.width = 600;
                        canvas.height = 300;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, 600, 300);
                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 48px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const words = input.split(' ');
                        const lines = [];
                        let i = 0;
                        while (i < words.length) {
                            let line = '';
                            while (i < words.length && (line + words[i]).length < 20) {
                                line += (line ? ' ' : '') + words[i];
                                i++;
                            }
                            if (line) lines.push(line);
                        }
                        let y = 150 - (lines.length * 30);
                        lines.forEach(l => {
                            ctx.fillText(l, 300, y);
                            y += 60;
                        });
                        result.innerHTML = `
                            <div class="result-box">
                                <img src="${canvas.toDataURL('image/png')}" style="width:100%;border-radius:8px;">
                                <button class="v-btn" onclick="downloadCanvas(this.previousElementSibling)" style="margin-top:8px;background:rgba(50,100,255,0.15);">Download</button>
                            </div>
                        `;
                        return;
                    case 'fakeig':
                        toast('Fake IG: Upload gambar di menu utama');
                        result.innerHTML = `<div class="result-box">Buka di menu utama untuk upload foto profil.</div>`;
                        return;
                    default:
                        result.innerHTML = `<div class="result-box">Tool ${toolId} sedang dalam pengembangan.</div>`;
                        return;
                }

                if (apiUrl) {
                    const res = await fetch(apiUrl);
                    if (isImage) {
                        const blob = await res.blob();
                        const imgUrl = URL.createObjectURL(blob);
                        result.innerHTML = `
                            <div class="result-box">
                                <img src="${imgUrl}" style="width:100%;border-radius:8px;">
                                <br><br>
                                <a href="${imgUrl}" download="${toolId}_${Date.now()}.png" style="text-decoration:none;">
                                    <button class="v-btn" style="background:rgba(50,100,255,0.15);">Download</button>
                                </a>
                            </div>
                        `;
                    } else {
                        const data = await res.json();
                        const dl = data?.result?.url || data?.result?.[0]?.url || data?.url || data?.result?.video || data?.result?.data;
                        if (dl) {
                            const isVideo = dl.includes('.mp4') || dl.includes('video');
                            result.innerHTML = `
                                <div class="result-box">
                                    ${isVideo ? `<video controls style="width:100%;border-radius:8px;" src="${dl}"></video>` : `<img src="${dl}" style="width:100%;border-radius:8px;">`}
                                    <br><br>
                                    <a href="${dl}" target="_blank" style="text-decoration:none;">
                                        <button class="v-btn" style="background:rgba(50,100,255,0.15);">Download</button>
                                    </a>
                                </div>
                            `;
                        } else {
                            result.innerHTML = `<div class="result-box" style="color:#dc2626;">Gagal mengambil data.</div>`;
                        }
                    }
                }
            } catch (e) {
                result.innerHTML = `<div class="result-box" style="color:#dc2626;">Error: ${e.message}</div>`;
            }
        };
    }

    function closeTool() {
        document.getElementById('toolViewer').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    function loadTelegramTools() {
        const tools = getTelegramToolsList();
        const grid = document.getElementById('telegramToolsGrid');
        if (!grid) return;
        
        if (tools.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--theme-text-muted);font-size:0.8rem;">
                    <i class="fas fa-robot" style="font-size:24px;display:block;margin-bottom:8px;color:var(--theme-primary);"></i>
                    Belum ada tools dari Telegram.
                    <br><small>Gunakan /addtools di Telegram untuk menambahkan</small>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = tools.map(tool => `
            <div class="tools-card" onclick="openPreview('${tool.url}', '${tool.name}')">
                <div class="icon"><i class="${tool.icon || 'fa-solid fa-robot'}"></i></div>
                <h4>${tool.name}</h4>
                <p>${tool.desc || 'Tools dari Telegram'}</p>
                <span class="badge-new">NEW</span>
                <div class="arrow"><i class="fas fa-arrow-right"></i></div>
            </div>
        `).join('');
    }

    function showPage(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');

        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`.bottom-nav .nav-item[data-page="${id}"]`)?.classList.add('active');

        document.querySelectorAll('.sidebar .sb-item').forEach(s => s.classList.remove('active'));
        document.querySelector(`.sidebar .sb-item[data-page="${id}"]`)?.classList.add('active');

        document.querySelectorAll('.header-nav a').forEach(a => a.classList.remove('active'));
        const map = { homePage: 'navHome', toolsPage: 'navTools', profilePage: 'navProfile', chatPage: 'navChat' };
        if (map[id]) document.getElementById(map[id])?.classList.add('active');

        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sbOverlay').classList.remove('show');

        if (id === 'homePage') {
            const popular = getFilteredTools().slice(0, 6);
            renderGrid('popularGrid', popular);
            loadTelegramTools();
        }
        if (id === 'chatPage') {
            loadChatMessages();
        }
    }

    function toggleSidebar() {
        let sb = document.getElementById('sidebar');
        let ov = document.getElementById('sbOverlay');
        sb.classList.toggle('open');
        ov.classList.toggle('show');
    }

    document.querySelectorAll('.sidebar .sb-item[data-page]').forEach(el => {
        el.addEventListener('click', function() { showPage(this.dataset.page); });
    });
    document.querySelectorAll('.bottom-nav .nav-item[data-page]').forEach(el => {
        el.addEventListener('click', function() { showPage(this.dataset.page); });
    });
    document.getElementById('sbOverlay').addEventListener('click', toggleSidebar);

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            renderCategory(this.dataset.category);
            document.getElementById('searchInput').value = '';
        });
    });

    document.getElementById('searchInput').addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        document.querySelectorAll('.category-tab').forEach(t => {
            t.style.display = t.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
        });
        document.querySelectorAll('.tools-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(q) ? 'flex' : 'none';
        });
    });

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        if (e.key === 'Escape') {
            if (document.getElementById('previewOverlay').classList.contains('active')) {
                closePreview();
            } else {
                closeTool();
            }
        }
    });

    document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendChatMessage();
    });

    document.getElementById('toolViewer').addEventListener('click', function(e) {
        if (e.target === this) closeTool();
    });

    // ============ TELEGRAM BOT COMMANDS ============
    let lastUpdateId = parseInt(localStorage.getItem('vip_bot_last_update') || '0');
    let processedIds = JSON.parse(localStorage.getItem('vip_processed_ids') || '[]');
    let botStep = {};
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
                    text: text,
                    parse_mode: parseMode,
                    disable_web_page_preview: true
                })
            });
            return await response.json();
        } catch(e) {
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
                    caption: caption,
                    parse_mode: 'HTML'
                })
            });
            return await response.json();
        } catch(e) {
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

    async function handleTelegramCommand(text, messageId, chatId) {
        if (processedIds.includes(messageId)) {
            console.log('Already processed:', messageId);
            return;
        }
        if (chatId !== CHAT_ID) return;
        if (isProcessingCommand) {
            console.log('Still processing previous command');
            return;
        }

        isProcessingCommand = true;
        console.log('Processing command:', text, 'ID:', messageId);

        try {
            if (text === '.menu') {
                await sendTelegramPhoto(
                    'https://c.termai.cc/i174/RIM.png',
                    `<b>✨ Siap MattzLM!</b>\n\n<b>📋 Menu MattzLM Bot:</b>\n\n🔹 <b>/addtools</b> - Tambah tools baru ke website\n🔹 <b>/removetools</b> - Hapus tools dari Telegram\n🔹 <b>/removetoolsv2</b> - Hapus semua tools (bawaan + telegram)\n🔹 <b>/listtools</b> - Lihat semua tools di website\n🔹 <b>/createaccount</b> - Buat akun baru (username | password | role)\n🔹 <b>/editweb</b> - Ganti video background\n🔹 <b>/tema</b> - Ganti tema website\n🔹 <b>/status</b> - Status bot & website\n🔹 <b>/help</b> - Tampilkan menu ini\n\n<i>💡 Role: member, admin, owner</i>`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/help' || text === '/start') {
                await sendTelegramMessage(
                    `<b>🤖 MattzLM Bot</b>\n\n<b>📋 Commands:</b>\n\n🔹 <b>/addtools</b> - Tambah tools baru\n🔹 <b>/removetools</b> - Hapus tools Telegram\n🔹 <b>/removetoolsv2</b> - Hapus semua tools (bawaan + telegram)\n🔹 <b>/listtools</b> - Lihat semua tools\n🔹 <b>/createaccount</b> - Buat akun (username | password | role)\n🔹 <b>/editweb</b> - Ganti video background\n🔹 <b>/tema</b> - Ganti tema website\n🔹 <b>/status</b> - Status bot & website\n🔹 <b>.menu</b> - Menu lengkap dengan gambar\n\n<i>📌 Gunakan .menu untuk menu lengkap</i>`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/status') {
                const tools = getTelegramToolsList();
                const builtIn = getFilteredTools();
                const users = Object.keys(getUsers());
                const theme = getTheme();
                await sendTelegramMessage(
                    `<b>📊 Status MattzLM Tools</b>\n\n` +
                    `<b>🤖 Bot:</b> ✅ Aktif\n` +
                    `<b>🌐 Website:</b> ✅ Online\n` +
                    `<b>📦 Tools Bawaan:</b> ${builtIn.length} tools\n` +
                    `<b>📦 Tools Telegram:</b> ${tools.length} tools\n` +
                    `<b>👥 Total User:</b> ${users.length} user\n` +
                    `<b>🎨 Tema:</b> ${theme}\n\n` +
                    `<i>💡 Gunakan .menu untuk melihat perintah</i>`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/cek') {
                await fetchRemoteState();
                await sendTelegramMessage(
                    `<b>📈 Statistik Kunjungan</b>\n\n` +
                    `<b>👁️ Total website dibuka:</b> ${currentVisits}x`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/removetoolsv2') {
                const allTools = getAllToolsList();
                if (allTools.length === 0) {
                    await sendTelegramMessage('📦 Belum ada tools yang bisa dihapus.');
                    markProcessed(messageId);
                    isProcessingCommand = false;
                    return;
                }
                let msg = `🗑️ <b>Hapus Semua Tools (Bawaan + Telegram)</b>\n\n`;
                msg += `Pilih tools yang ingin dihapus dengan mengirim <b>nama tools</b>:\n\n`;
                allTools.forEach((t, i) => {
                    const type = t.isTelegram ? '📱 Telegram' : '📦 Bawaan';
                    msg += `${i+1}. <b>${t.name}</b> - ${t.desc || 'Tools'}\n`;
                    msg += `   ${type}\n\n`;
                });
                msg += `\n<i>💡 Kirim nama tools yang ingin dihapus (contoh: "Instagram")</i>`;
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
                
                const builtIn = getFilteredTools();
                const builtInTool = builtIn.find(t => t.name.toLowerCase() === name.toLowerCase());
                if (builtInTool) {
                    const success = hideToolById(builtInTool.id);
                    if (success) {
                        found = true;
                        removedName = builtInTool.name;
                    }
                }
                
                if (!found) {
                    const telegramTools = getTelegramToolsList();
                    const telegramTool = telegramTools.find(t => t.name.toLowerCase() === name.toLowerCase());
                    if (telegramTool) {
                        const success = removeTelegramTool(telegramTool.name);
                        if (success) {
                            found = true;
                            removedName = telegramTool.name;
                        }
                    }
                }
                
                if (found) {
                    await sendTelegramMessage(`✅ Tools "<b>${removedName}</b>" berhasil dihapus dari website!`);
                    loadTelegramTools();
                    renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
                    const popular = getFilteredTools().slice(0, 6);
                    renderGrid('popularGrid', popular);
                } else {
                    const allTools = getAllToolsList();
                    const similar = allTools.filter(t => t.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(t.name.toLowerCase()));
                    if (similar.length > 0) {
                        let suggestion = `❌ Tools "<b>${name}</b>" tidak ditemukan.\n\nMungkin maksud Anda:\n`;
                        similar.slice(0, 5).forEach(t => {
                            suggestion += `• <b>${t.name}</b>\n`;
                        });
                        suggestion += `\nKirim ulang dengan nama yang tepat.`;
                        await sendTelegramMessage(suggestion);
                    } else {
                        await sendTelegramMessage(`❌ Tools "<b>${name}</b>" tidak ditemukan.\n\nKirim ulang dengan nama yang tepat.`);
                    }
                }
                
                delete botStep[chatId];
                isProcessingCommand = false;
                return;
            }

            if (text === '/editweb') {
                botStep[chatId] = { step: 'waiting_editweb' };
                await sendTelegramMessage(
                    `✏️ <b>Edit Website</b>\n\n` +
                    `Mau ganti apa bos?\n\n` +
                    `🔹 <b>/background</b> - Ganti video background\n` +
                    `🔹 <b>/rotate</b> - Rotate video homepage\n\n` +
                    `Kirim <code>/background</code> untuk mulai.`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/background' && botStep[chatId] && botStep[chatId].step === 'waiting_editweb') {
                botStep[chatId] = { step: 'waiting_background_url' };
                await sendTelegramMessage(
                    `🎬 <b>Ganti Video Background</b>\n\n` +
                    `Silahkan kirim <b>URL video</b> baru:\n\n` +
                    `Contoh: <code>https://example.com/video.mp4</code>\n\n` +
                    `<i>💡 Video akan otomatis diputar di background website</i>`
                );
                isProcessingCommand = false;
                return;
            }

            if (text === '/rotate' && botStep[chatId] && botStep[chatId].step === 'waiting_editweb') {
                botStep[chatId] = { step: 'waiting_rotate_deg' };
                await sendTelegramMessage(
                    `🔄 <b>Rotate Video Homepage</b>\n\n` +
                    `Ini rotate video yang di <b>halaman Home</b> (card kedua), bukan background utama.\n\n` +
                    `Kirim derajat rotasi:\n` +
                    `🔹 <b>0</b> - Normal\n` +
                    `🔹 <b>90</b> - Rotate 90°\n` +
                    `🔹 <b>180</b> - Rotate 180°\n` +
                    `🔹 <b>270</b> - Rotate 270°`
                );
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId] && botStep[chatId].step === 'waiting_rotate_deg') {
                const deg = parseInt(text.trim());
                if (![0, 90, 180, 270].includes(deg)) {
                    await sendTelegramMessage('❌ Kirim salah satu: 0, 90, 180, atau 270');
                    isProcessingCommand = false;
                    return;
                }
                applyHomeVideoRotation(deg);
                pushRemoteState({ homeRotate: deg });
                delete botStep[chatId];
                await sendTelegramMessage(
                    `✅ <b>Video homepage berhasil di-rotate!</b>\n\n` +
                    `🔄 Derajat: <b>${deg}°</b>\n\n` +
                    `🔄 Semua device akan otomatis ikut rotasi ini.`
                );
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId] && botStep[chatId].step === 'waiting_background_url') {
                const url = text.trim();
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    await sendTelegramMessage('❌ URL harus dimulai dengan http:// atau https://');
                    isProcessingCommand = false;
                    return;
                }
                updateBackgroundVideo(url);
                pushRemoteState({ bgVideo: url });
                delete botStep[chatId];
                await sendTelegramMessage(
                    `✅ <b>Video background berhasil diubah!</b>\n\n` +
                    `🔗 URL: <code>${url}</code>\n\n` +
                    `🔄 Website akan otomatis menggunakan video baru.`
                );
                isProcessingCommand = false;
                return;
            }

            if (text === '/tema') {
                botStep[chatId] = { step: 'waiting_tema' };
                await sendTelegramMessage(
                    `🎨 <b>Ganti Tema Website</b>\n\n` +
                    `Pilih tema warna:\n\n` +
                    `🔹 <b>/biru</b> - Tema Biru (default)\n` +
                    `🔹 <b>/merah</b> - Tema Merah\n` +
                    `🔹 <b>/hitam</b> - Tema Hitam\n` +
                    `🔹 <b>/putih</b> - Tema Putih\n` +
                    `🔹 <b>/silver</b> - Tema Silver\n\n` +
                    `Kirim salah satu perintah di atas.`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            const temaMatch = text.match(/^\/(biru|merah|hitam|putih|silver)$/i);
            if (temaMatch && botStep[chatId] && botStep[chatId].step === 'waiting_tema') {
                const theme = temaMatch[1].toLowerCase();
                applyTheme(theme);
                pushRemoteState({ theme: theme });
                delete botStep[chatId];
                await sendTelegramMessage(
                    `✅ <b>Tema berhasil diubah!</b>\n\n` +
                    `🎨 Tema baru: <b>${theme}</b>\n\n` +
                    `🔄 Website akan otomatis berganti tema.`
                );
                isProcessingCommand = false;
                return;
            }

            if (text === '/removetools') {
                const tools = getTelegramToolsList();
                if (tools.length === 0) {
                    await sendTelegramMessage('📦 Belum ada tools Telegram yang bisa dihapus.');
                    markProcessed(messageId);
                    isProcessingCommand = false;
                    return;
                }
                let msg = `🗑️ <b>Hapus Tools Telegram</b>\n\n`;
                msg += `Pilih tools yang ingin dihapus dengan mengirim <b>nama tools</b>:\n\n`;
                tools.forEach((t, i) => {
                    msg += `${i+1}. <b>${t.name}</b> - ${t.desc || 'Tools dari Telegram'}\n`;
                });
                msg += `\n<i>💡 Kirim nama tools yang ingin dihapus (contoh: "MattzLM Downloader")</i>`;
                botStep[chatId] = { step: 'waiting_remove' };
                await sendTelegramMessage(msg);
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId] && botStep[chatId].step === 'waiting_remove') {
                const name = text.trim();
                const success = removeTelegramTool(name);
                delete botStep[chatId];
                
                if (success) {
                    await sendTelegramMessage(`✅ Tools "<b>${name}</b>" berhasil dihapus!`);
                    loadTelegramTools();
                    renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
                } else {
                    await sendTelegramMessage(`❌ Tools "<b>${name}</b>" tidak ditemukan.`);
                }
                isProcessingCommand = false;
                return;
            }

            if (text === '/listtools') {
                const allTools = getAllToolsList();
                if (allTools.length === 0) {
                    await sendTelegramMessage('📦 Belum ada tools di website.');
                    markProcessed(messageId);
                    isProcessingCommand = false;
                    return;
                }
                let msg = `<b>📦 Daftar Semua Tools:</b>\n\n`;
                const builtIn = getFilteredTools();
                const telegram = getTelegramToolsList();
                
                msg += `<b>📌 Tools Bawaan (${builtIn.length}):</b>\n`;
                builtIn.forEach((t, i) => {
                    msg += `  ${i+1}. <b>${t.name}</b> - ${t.desc || 'Tools'}\n`;
                });
                
                if (telegram.length > 0) {
                    msg += `\n<b>📌 Tools Telegram (${telegram.length}):</b>\n`;
                    telegram.forEach((t, i) => {
                        msg += `  ${i+1}. <b>${t.name}</b> - ${t.desc || 'Tools dari Telegram'}\n`;
                    });
                }
                
                msg += `\n<i>💡 Gunakan /removetoolsv2 untuk menghapus tools</i>`;
                await sendTelegramMessage(msg);
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (text === '/addtools') {
                botStep[chatId] = { step: 'waiting_name' };
                await sendTelegramMessage(
                    `✏️ <b>Tambah Tools Baru</b>\n\n` +
                    `Silahkan tulis <b>nama tools</b> dan <b>URL tools</b> dengan format:\n\n` +
                    `<code>Nama Tools | https://example.com</code>\n\n` +
                    `Contoh: <code>MattzLM Downloader | https://example.com</code>`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId] && botStep[chatId].step === 'waiting_name') {
                const parts = text.split('|').map(s => s.trim());
                if (parts.length < 2 || !parts[0] || !parts[1]) {
                    await sendTelegramMessage(
                        '❌ Format salah! Gunakan:\n\n' +
                        `<code>Nama Tools | https://example.com</code>\n\n` +
                        `Contoh: <code>MattzLM Downloader | https://example.com</code>`
                    );
                    isProcessingCommand = false;
                    return;
                }
                const name = parts[0];
                const url = parts[1];
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    await sendTelegramMessage('❌ URL harus dimulai dengan http:// atau https://');
                    isProcessingCommand = false;
                    return;
                }
                botStep[chatId] = { step: 'waiting_desc', data: { name, url } };
                await sendTelegramMessage(
                    `✅ Nama dan URL sudah dicatat!\n\n` +
                    `<b>📌 Nama:</b> ${name}\n` +
                    `<b>🔗 URL:</b> ${url}\n\n` +
                    `Sekarang kirim <b>deskripsi</b> dan <b>kategori</b> dengan format:\n\n` +
                    `<code>Deskripsi tools | kategori</code>\n\n` +
                    `Contoh: <code>Download video TikTok tanpa watermark | downloader</code>\n\n` +
                    `<b>Kategori yang tersedia:</b>\n` +
                    `• downloader\n• maker\n• tools\n• external\n• extra\n• telegram\n• xvip`
                );
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId] && botStep[chatId].step === 'waiting_desc') {
                const parts = text.split('|').map(s => s.trim());
                if (parts.length < 2 || !parts[0] || !parts[1]) {
                    await sendTelegramMessage(
                        '❌ Format salah! Gunakan:\n\n' +
                        `<code>Deskripsi | kategori</code>\n\n` +
                        `Contoh: <code>Download video TikTok tanpa watermark | downloader</code>`
                    );
                    isProcessingCommand = false;
                    return;
                }
                const desc = parts[0];
                const category = parts[1].toLowerCase();
                const validCategories = ['downloader', 'maker', 'tools', 'external', 'extra', 'telegram', 'xvip'];
                if (!validCategories.includes(category)) {
                    await sendTelegramMessage(
                        `❌ Kategori "${category}" tidak valid.\n\n` +
                        `Kategori yang tersedia:\n` +
                        `• downloader\n• maker\n• tools\n• external\n• extra\n• telegram\n• xvip`
                    );
                    isProcessingCommand = false;
                    return;
                }

                const { name, url } = botStep[chatId].data;
                const newTool = addTelegramTool(name, url, desc, category);
                delete botStep[chatId];

                await sendTelegramMessage(
                    `✅ <b>Tools berhasil ditambahkan!</b>\n\n` +
                    `<b>📌 Nama:</b> ${name}\n` +
                    `<b>🔗 URL:</b> ${url}\n` +
                    `<b>📝 Deskripsi:</b> ${desc}\n` +
                    `<b>📂 Kategori:</b> ${category}\n\n` +
                    `🔄 Silahkan refresh website untuk melihat perubahan.`
                );
                
                loadTelegramTools();
                renderCategory(document.querySelector('.category-tab.active')?.dataset?.category || 'all');
                isProcessingCommand = false;
                return;
            }

            if (text === '/createaccount') {
                botStep[chatId] = { step: 'waiting_account' };
                await sendTelegramMessage(
                    `✏️ <b>Buat Akun Baru</b>\n\n` +
                    `Silahkan kirim data dengan format:\n\n` +
                    `<code>username | password | role</code>\n\n` +
                    `Contoh: <code>MattzLM | password | owner</code>\n\n` +
                    `<b>Role yang tersedia:</b>\n` +
                    `• member\n` +
                    `• admin\n` +
                    `• owner`
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

            if (botStep[chatId] && botStep[chatId].step === 'waiting_account') {
                const parts = text.split('|').map(s => s.trim());
                if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) {
                    await sendTelegramMessage(
                        '❌ Format salah! Gunakan:\n\n' +
                        `<code>username | password | role</code>\n\n` +
                        `Contoh: <code>MattzLM | password | owner</code>`
                    );
                    isProcessingCommand = false;
                    return;
                }
                const username = parts[0];
                const password = parts[1];
                const role = parts[2].toLowerCase();
                
                if (!['member', 'admin', 'owner'].includes(role)) {
                    await sendTelegramMessage(
                        `❌ Role "${role}" tidak valid.\n\n` +
                        `Role yang tersedia:\n` +
                        `• member\n• admin\n• owner`
                    );
                    isProcessingCommand = false;
                    return;
                }
                
                const users = getUsers();
                if (users[username]) {
                    await sendTelegramMessage(`❌ Username "${username}" sudah terdaftar!`);
                    delete botStep[chatId];
                    isProcessingCommand = false;
                    return;
                }
                
                users[username] = { password: btoa(password), role: role };
                saveUsers(users);
                delete botStep[chatId];
                
                await sendTelegramMessage(
                    `✅ <b>Akun berhasil dibuat!</b>\n\n` +
                    `<b>👤 Username:</b> ${username}\n` +
                    `<b>🔑 Password:</b> ${password}\n` +
                    `<b>👑 Role:</b> ${role}\n\n` +
                    `User sekarang bisa login ke website.`
                );
                isProcessingCommand = false;
                return;
            }

            if (text.startsWith('/') || text.startsWith('.')) {
                await sendTelegramMessage(
                    '❌ Perintah tidak dikenal.\n\n' +
                    '📌 Gunakan <code>.menu</code> untuk melihat daftar perintah lengkap.\n\n' +
                    '💡 Perintah yang tersedia:\n' +
                    '• /addtools - Tambah tools baru\n' +
                    '• /removetools - Hapus tools Telegram\n' +
                    '• /removetoolsv2 - Hapus semua tools (bawaan + telegram)\n' +
                    '• /listtools - Lihat semua tools\n' +
                    '• /createaccount - Buat akun baru\n' +
                    '• /editweb - Ganti video background\n' +
                    '• /tema - Ganti tema website\n' +
                    '• /status - Status bot'
                );
                markProcessed(messageId);
                isProcessingCommand = false;
                return;
            }

        } catch(e) {
            console.error('Error handling command:', e);
            await sendTelegramMessage('❌ Terjadi error: ' + e.message);
        }
        
        isProcessingCommand = false;
    }

    function hideToolById(id) {
        const hiddenTools = JSON.parse(localStorage.getItem('vip_hidden_tools') || '[]');
        if (!hiddenTools.includes(id)) {
            hiddenTools.push(id);
            localStorage.setItem('vip_hidden_tools', JSON.stringify(hiddenTools));
            return true;
        }
        return false;
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
        } catch(e) {
            console.error('Telegram poll error:', e);
        } finally {
            isPollingTelegram = false;
        }
    }

    // ============ INIT ============
    renderCategory('all');
    const popular = getFilteredTools().slice(0, 6);
    renderGrid('popularGrid', popular);
    loadTelegramTools();
    loadChatMessages();

    setTimeout(() => {
        pollTelegram();
        setInterval(pollTelegram, 2000);
    }, 3000);

    setTimeout(() => {
        pollChatReplies();
        setInterval(pollChatReplies, 3000);
    }, 4000);

    console.log('🟢 MattzLM Tools Online');
    console.log('📌 Bot Management aktif');
    console.log('💬 Chat Admin aktif');

    window.downloadCanvas = function(img) {
        const link = document.createElement('a');
        link.download = 'brat_' + Date.now() + '.png';
        link.href = img.src;
        link.click();
    };

    // ================= ANTI-INSPECT =================
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('keydown', function(e) {
        const k = e.key;
        const blocked =
            k === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(k.toUpperCase())) ||
            (e.ctrlKey && k.toUpperCase() === 'U') ||
            (e.metaKey && e.altKey && ['I','J','C'].includes(k.toUpperCase()));
        if (blocked) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    (function devtoolsWatch() {
        const threshold = 160;
        let tripped = false;
        function check() {
            const widthGap = window.outerWidth - window.innerWidth > threshold;
            const heightGap = window.outerHeight - window.innerHeight > threshold;
            if ((widthGap || heightGap) && !tripped) {
                tripped = true;
                document.body.style.filter = 'blur(12px)';
                if (typeof toast === 'function') toast('DevTools terdeteksi.');
            } else if (!widthGap && !heightGap && tripped) {
                tripped = false;
                document.body.style.filter = '';
            }
        }
        setInterval(check, 1000);
    })();


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
            <div class="dev-row" style="padding:6px 10px;border-radius:8px;background:rgba(50,100,255,0.06);">
                <span class="label">${escapeHtml(uname)} <small style="color:var(--theme-primary-light);">(${escapeHtml(info.role || 'member')})</small></span>
                ${uname === 'matt'
                    ? '<span class="value role" style="font-size:0.7rem;">DEFAULT OWNER</span>'
                    : `<button type="button" onclick="ownerDeleteAccount('${escapeHtml(uname)}')" style="background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#ef4444;border-radius:6px;padding:3px 8px;font-size:0.7rem;cursor:pointer;">Hapus</button>`
                }
            </div>
        `).join('');
    }

    function ownerAddTool() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        const name = document.getElementById('ownerToolName').value.trim();
        const url = document.getElementById('ownerToolUrl').value.trim();
        const desc = document.getElementById('ownerToolDesc').value.trim() || 'Tools Owner';
        if (!name || !url) return toast('Isi nama & URL tool!');
        addTelegramTool({ name, url, desc, icon: 'fa-solid fa-star', category: 'telegram' });
        document.getElementById('ownerToolName').value = '';
        document.getElementById('ownerToolUrl').value = '';
        document.getElementById('ownerToolDesc').value = '';
        loadTelegramTools();
        renderCategory('all');
        toast('Tool berhasil ditambahkan!');
    }

    function ownerRestoreTools() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        localStorage.removeItem('vip_hidden_tools');
        renderCategory('all');
        const popular = getFilteredTools().slice(0, 6);
        renderGrid('popularGrid', popular);
        toast('Semua tools bawaan dipulihkan!');
    }

    function ownerSaveAccount() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        const uname = document.getElementById('ownerAccUser').value.trim();
        const pass = document.getElementById('ownerAccPass').value;
        const role = document.getElementById('ownerAccRole').value;
        if (!uname) return toast('Isi username!');
        const users = getUsers();
        if (!users[uname] && !pass) return toast('Isi password untuk akun baru!');
        users[uname] = {
            password: pass ? btoa(pass) : users[uname].password,
            role: uname === 'matt' ? 'owner' : role
        };
        saveUsers(users);
        document.getElementById('ownerAccUser').value = '';
        document.getElementById('ownerAccPass').value = '';
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
        const text = input.value.trim();
        if (!text) return toast('Tulis balasan dulu!');
        const messages = getChatMessages();
        messages.push({
            sender: 'admin',
            username: 'Owner',
            text,
            time: Date.now()
        });
        saveChatMessages(messages.slice(-50));
        input.value = '';
        loadChatMessages();
        toast('Balasan Owner terkirim!');
    }

    function ownerResetChatLimits() {
        if (!isCurrentOwner()) return toast('Khusus Owner!');
        localStorage.removeItem('vip_chat_limits');
        loadChatMessages();
        toast('Limit chat semua user direset!');
    }

    // Expose handlers for inline onclick attributes (static & dynamic templates)
    Object.assign(window, {
        applyTheme,
        toggleSpecialTheme,
        toast,
        switchAuthMode,
        doRegister,
        doLogin,
        doLogout,
        changeUsername,
        changePassword,
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
        ownerAddTool,
        ownerRestoreTools,
        ownerSaveAccount,
        ownerDeleteAccount,
        ownerReplyChat,
        ownerResetChatLimits,
    });

    startAppOnMount();
}
