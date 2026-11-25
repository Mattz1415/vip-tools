"use client";

import Link from "next/link";
import { useEffect } from "react";
import { signInWithGoogleFirebase, signOutFirebaseQuietly } from "@/lib/firebase-client";
import { initVipTools } from "@/lib/vip-tools-client";

function callGlobal(name: string, ...args: unknown[]) {
  const fn = (
    window as unknown as Record<string, ((...a: unknown[]) => void) | undefined>
  )[name];
  if (typeof fn === "function") {
    fn(...args);
  }
}

export default function VipToolsApp() {
  useEffect(() => {
    const cleanup = initVipTools({ signInWithGoogleFirebase, signOutFirebaseQuietly });
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, []);

  return (
    <>
      <a href="#authPage" id="skipLink" className="skip-link">
        Lewati ke konten utama
      </a>

      <div className="backdrop-stage" aria-hidden="true">
        <video
          id="bgVideo"
          width={1280}
          height={720}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="https://c.termai.cc/v131/H4vF9D.mp4" type="video/mp4" />
        </video>
        <div id="bgOverlay" />
        <div className="anime-orbs">
          <div className="anime-orb orb-1" />
          <div className="anime-orb orb-2" />
          <div className="anime-orb orb-3" />
        </div>
        <div className="anime-grid-3d" />
        <canvas id="animeParticles" width={1280} height={720} />
      </div>

      <div id="loader" role="status" aria-live="polite">
        <div className="loader-stage-3d" aria-hidden="true">
          <div className="loader-ring-3d">
            <span />
            <span />
            <span />
          </div>
          <div className="loader-crest-3d mecha-cut">
            <span className="brand-monogram">MLM</span>
          </div>
        </div>
        <div className="loader-title">MATTZLM</div>
        <div className="loader-sub">WEB TOOLS</div>
        <div className="loader-bar-wrap" aria-hidden="true">
          <div className="loader-bar" />
        </div>
        <div className="loader-status" id="ldStatus">
          MEMUAT...
        </div>
      </div>

      <div id="toast" role="status" aria-live="polite" aria-atomic="true" />

      <div
        className="preview-overlay"
        id="previewOverlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="previewTitle"
        hidden
      >
        <div className="preview-header">
          <button
            type="button"
            className="preview-back"
            id="previewBackBtn"
            onClick={() => callGlobal("closePreview")}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Kembali
          </button>
          <span className="preview-title" id="previewTitle">
            Memuat preview...
          </span>
          <a
            href="#previewOverlay"
            id="previewExternalLink"
            className="preview-external"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /> Buka Tab Baru
          </a>
        </div>
        <iframe
          className="preview-frame"
          id="previewFrame"
          title="Pratinjau Tool Eksternal"
          width={1280}
          height={720}
          src="about:blank"
        />
      </div>

      <section className="auth-portal" id="authPage" tabIndex={-1} aria-labelledby="authHeading">
        <div className="auth-box mecha-cut">
          <div className="auth-anime-side">
            <div className="anime-emblem-3d mecha-cut-sm" aria-hidden="true">
              <span className="brand-monogram">MLM</span>
            </div>
            <h1 className="auth-brand-title" id="authHeading">
              MattzLM
            </h1>
            <p className="auth-brand-desc">
              Unduh video, olah gambar, buat shortlink, dan cek DNS atau port langsung dari browser.
            </p>
          </div>

          <div className="auth-form-side">
            <div className="auth-mode" role="tablist" aria-label="Mode autentikasi">
              <button
                type="button"
                role="tab"
                id="tabLoginBtn"
                aria-selected="true"
                className="mode-btn active"
                onClick={() => callGlobal("switchAuthMode", "login")}
              >
                Masuk
              </button>
              <button
                type="button"
                role="tab"
                id="tabRegisterBtn"
                aria-selected="false"
                className="mode-btn"
                onClick={() => callGlobal("switchAuthMode", "register")}
              >
                Daftar
              </button>
            </div>

            <form
              id="loginView"
              onSubmit={(e) => {
                e.preventDefault();
                callGlobal("doLogin");
              }}
              noValidate
            >
              <div className="field-stack">
                <label htmlFor="loginUser" className="field-label">
                  Username
                </label>
                <div className="input-group" id="loginUserGroup">
                  <i className="fas fa-user" aria-hidden="true" />
                  <input
                    type="text"
                    id="loginUser"
                    autoComplete="username"
                    aria-describedby="loginError"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              </div>

              <div className="field-stack">
                <label htmlFor="loginPass" className="field-label">
                  Password
                </label>
                <div className="input-group" id="loginPassGroup">
                  <i className="fas fa-lock" aria-hidden="true" />
                  <input
                    type="password"
                    id="loginPass"
                    autoComplete="current-password"
                    aria-describedby="loginError"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    className="pass-toggle-btn"
                    aria-label="Tampilkan atau sembunyikan password"
                    aria-pressed="false"
                    data-toggle-pass="loginPass"
                  >
                    <i className="fas fa-eye" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div id="loginError" className="inline-error" role="alert" aria-live="polite" />

              <button type="submit" id="loginSubmitBtn" className="btn-auth mecha-cut-sm">
                <i className="fas fa-right-to-bracket" aria-hidden="true" /> Masuk
              </button>
            </form>

            <form
              id="registerView"
              hidden
              onSubmit={(e) => {
                e.preventDefault();
                callGlobal("doRegister");
              }}
              noValidate
            >
              <div className="field-stack">
                <label htmlFor="regUser" className="field-label">
                  Username
                </label>
                <div className="input-group" id="regUserGroup">
                  <i className="fas fa-user" aria-hidden="true" />
                  <input
                    type="text"
                    id="regUser"
                    autoComplete="username"
                    aria-describedby="regError"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              </div>

              <div className="field-stack">
                <label htmlFor="regPass" className="field-label">
                  Password
                </label>
                <div className="input-group" id="regPassGroup">
                  <i className="fas fa-lock" aria-hidden="true" />
                  <input
                    type="password"
                    id="regPass"
                    autoComplete="new-password"
                    aria-describedby="regError"
                    placeholder="Minimal 4 karakter"
                    required
                  />
                  <button
                    type="button"
                    className="pass-toggle-btn"
                    aria-label="Tampilkan atau sembunyikan password"
                    aria-pressed="false"
                    data-toggle-pass="regPass"
                  >
                    <i className="fas fa-eye" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="field-stack">
                <label htmlFor="regPass2" className="field-label">
                  Konfirmasi Password
                </label>
                <div className="input-group" id="regPass2Group">
                  <i className="fas fa-lock" aria-hidden="true" />
                  <input
                    type="password"
                    id="regPass2"
                    autoComplete="new-password"
                    aria-describedby="regError"
                    placeholder="Ulangi password"
                    required
                  />
                  <button
                    type="button"
                    className="pass-toggle-btn"
                    aria-label="Tampilkan atau sembunyikan konfirmasi password"
                    aria-pressed="false"
                    data-toggle-pass="regPass2"
                  >
                    <i className="fas fa-eye" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div id="regError" className="inline-error" role="alert" aria-live="polite" />

              <button type="submit" id="regSubmitBtn" className="btn-auth mecha-cut-sm">
                <i className="fas fa-user-plus" aria-hidden="true" /> Daftar
              </button>
            </form>

            <div className="auth-divider" aria-hidden="true">
              <span>ATAU</span>
            </div>

            <button
              type="button"
              id="googleLoginBtn"
              className="btn-google-auth"
              onClick={() => callGlobal("doGoogleLogin")}
            >
              <i className="fab fa-google" aria-hidden="true" />
              <span id="googleLoginLabel">Masuk dengan Google</span>
            </button>
          </div>
        </div>
      </section>

      <div className="app-wrap" id="appWrap" hidden>
        <aside className="anime-rail" aria-label="Navigasi desktop">
          <div className="rail-brand mecha-cut-sm" aria-hidden="true">
            <span className="brand-monogram">MLM</span>
          </div>

          <nav className="rail-nav" aria-label="Menu utama desktop">
            <button
              type="button"
              className="rail-item active"
              data-page="homePage"
              aria-current="page"
              aria-label="Beranda"
            >
              <i className="fas fa-home" aria-hidden="true" />
              <span>Beranda</span>
            </button>
            <button
              type="button"
              className="rail-item"
              data-page="toolsPage"
              aria-label="Tools"
            >
              <i className="fas fa-toolbox" aria-hidden="true" />
              <span>Tools</span>
            </button>
            <button
              type="button"
              className="rail-item"
              data-page="profilePage"
              aria-label="Profil"
            >
              <i className="fas fa-user" aria-hidden="true" />
              <span>Profil</span>
            </button>
            <button
              type="button"
              className="rail-item"
              data-page="chatPage"
              aria-label="Chat Admin"
            >
              <i className="fas fa-comment" aria-hidden="true" />
              <span>Chat</span>
            </button>
            <Link
              href="/owner"
              prefetch={false}
              id="ownerRailLink"
              className="rail-item owner-only-link"
              aria-label="Buka Panel Owner"
              hidden
            >
              <i className="fas fa-crown" aria-hidden="true" />
              <span>Owner</span>
            </Link>
          </nav>

          <button
            type="button"
            className="rail-logout"
            onClick={() => callGlobal("doLogout")}
            aria-label="Keluar dari akun"
          >
            <i className="fas fa-sign-out-alt" aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </aside>

        <header className="header-top">
          <div className="logo-wrapper">
            <div className="logo-icon" id="logoIcon" aria-hidden="true">
              <span className="brand-monogram">MLM</span>
            </div>
            <div className="logo-text">
              <span className="brand-name">
                Mattz<span>LM</span>
              </span>
              <span className="brand-tagline">WEB TOOLS</span>
            </div>
          </div>

          <div className="header-right">
            <Link
              href="/owner"
              prefetch={false}
              id="ownerHeaderBtn"
              className="header-btn owner-only-btn"
              aria-label="Buka Owner Panel /owner"
              hidden
            >
              <i className="fas fa-crown" aria-hidden="true" />
              <span className="header-btn-text">Owner</span>
            </Link>

            <button
              type="button"
              className="header-btn"
              id="themeToggleBtn"
              onClick={() => callGlobal("toggleSpecialTheme")}
              aria-pressed="false"
              aria-label="Ganti palet warna antara Hitam, Abu, dan Putih"
            >
              <i className="fas fa-circle-half-stroke" aria-hidden="true" />
              <span className="header-btn-text" id="themeToggleLabel">Hitam</span>
            </button>

            <button
              type="button"
              className="header-btn"
              id="motionToggleBtn"
              onClick={() => callGlobal("toggleMotion")}
              aria-pressed="false"
              aria-label="Jeda atau jalankan animasi latar"
            >
              <i className="fas fa-wave-square" aria-hidden="true" />
              <span className="header-btn-text" id="motionToggleLabel">Gerak</span>
            </button>

            <div className="music-group">
              <button
                type="button"
                className="header-btn"
                id="musicToggleBtn"
                onClick={() => callGlobal("toggleMusic")}
                aria-pressed="false"
                aria-label="Putar atau hentikan musik latar"
              >
                <i className="fas fa-music" aria-hidden="true" />
                <span className="header-btn-text" id="musicToggleLabel">Musik</span>
              </button>
              <div className="music-visualizer" id="musicVisualizer" aria-hidden="true">
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </div>
              <button
                type="button"
                className="change-music-btn"
                onClick={() => callGlobal("changeMusic")}
                aria-label="Ganti trek musik"
              >
                <i className="fas fa-rotate" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <audio id="bgMusic" loop preload="none">
          <source src="https://c.termai.cc/v139/dhV3.mp4" type="audio/mp4" />
        </audio>

        <main className="content-wrap" id="mainContent" tabIndex={-1}>
          <div id="warningBanner" className="warning-banner" role="region" aria-label="Pemberitahuan aplikasi gratis">
            <div className="warning-text">
              <i className="fas fa-shield-halved" aria-hidden="true" />
              <span id="warningBannerText">
                Akses MattzLM gratis. Kalau ada pihak yang menjual akun atau aksesnya, laporkan ke Owner.
              </span>
            </div>
            <button
              type="button"
              className="warning-close"
              onClick={() => callGlobal("closeWarningBanner")}
              aria-label="Tutup pemberitahuan"
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>

          <div className="workspace-header-row">
            <h1 className="page-hero-title" id="workspaceHeading" tabIndex={-1}>
              Beranda MattzLM
            </h1>
            <p className="workspace-sub" id="workspaceSub">
              Info akun aktif dan daftar tool yang paling sering dipakai.
            </p>
          </div>

          <section className="page active" id="homePage" aria-label="Beranda">
            <div className="anime-hero-grid">
              <div className="hero-visor mecha-cut">
                <div className="video-landscape">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    width={640}
                    height={360}
                    id="homeVideo"
                  >
                    <source
                      src="https://c.termai.cc/v131/H4vF9D.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
                <div className="visor-hud-overlay">
                  <div className="visor-meta">
                    <span className="visor-badge">MATTZLM</span>
                    <span className="visor-caption">Online</span>
                  </div>
                  <div className="visor-actions">
                    <button
                      type="button"
                      className="visor-control-btn"
                      id="visorVideoToggleBtn"
                      onClick={() => callGlobal("toggleHomeVideo")}
                      aria-pressed="false"
                      aria-label="Jeda atau putar video visor"
                    >
                      <i className="fas fa-pause" aria-hidden="true" />
                      <span id="visorVideoToggleLabel">Jeda</span>
                    </button>
                    <a
                      href="https://github.com/Mattz1415"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="channel-btn mecha-cut-sm"
                    >
                      <i className="fab fa-github" aria-hidden="true" /> GitHub Mattz1415
                    </a>
                  </div>
                </div>
              </div>

              <div className="dossier-panel">
                <div>
                  <h2 className="dossier-heading">
                    <i className="fas fa-id-card" aria-hidden="true" style={{ color: "var(--accent-hallmark-fg)" }} />
                    Info Akun
                  </h2>
                  <div className="dossier-list">
                    <div className="dossier-row">
                      <span className="label">
                        <i className="fas fa-user" aria-hidden="true" /> Username
                      </span>
                      <span className="value" id="devUser">
                        -
                      </span>
                    </div>
                    <div className="dossier-row">
                      <span className="label">
                        <i className="fas fa-laptop" aria-hidden="true" /> Perangkat
                      </span>
                      <span className="value" id="devDevice">
                        -
                      </span>
                    </div>
                    <div className="dossier-row">
                      <span className="label">
                        <i className="fas fa-battery-three-quarters" aria-hidden="true" /> Baterai
                      </span>
                      <span className="value" id="devBattery">
                        -
                      </span>
                    </div>
                    <div className="dossier-row">
                      <span className="label">
                        <i className="fas fa-crown" aria-hidden="true" /> Role
                      </span>
                      <span className="value role" id="devRole">
                        MEMBER
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-auth mecha-cut-sm dossier-cta"
                  onClick={() => callGlobal("showPage", "toolsPage")}
                >
                  <i className="fas fa-toolbox" aria-hidden="true" /> Buka Katalog Tools
                </button>
              </div>
            </div>

            <div className="home-section-block">
              <div className="deck-panel">
                <h2 className="section-title">
                  <i className="fas fa-fire" aria-hidden="true" style={{ color: "var(--accent-hallmark-fg)" }} />
                  Tools Populer
                  <span className="line" aria-hidden="true" />
                </h2>
                <div className="tools-grid" id="popularGrid" />
              </div>
            </div>

            <div className="home-section-block">
              <div className="deck-panel">
                <h2 className="section-title">
                  <i className="fas fa-plug" aria-hidden="true" style={{ color: "var(--status-success)" }} />
                  Feed Tools Terbaru (Telegram / Custom)
                  <span className="line" aria-hidden="true" />
                </h2>
                <div className="tools-feed-list" id="telegramToolsGrid" />
              </div>
            </div>
          </section>

          <section className="page" id="toolsPage" aria-label="Katalog Tools" hidden>
            <div className="tools-workspace">
              <div className="category-tabs" id="categoryTabs" role="tablist" aria-label="Kategori Tools">
                <button type="button" role="tab" aria-selected="true" className="category-tab active" data-category="all">
                  <span className="category-tab-main">
                    <i className="fas fa-th-large" aria-hidden="true" /> SEMUA
                  </span>
                  <span className="category-count" data-count-for="all">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab" data-category="vps">
                  <span className="category-tab-main">
                    <i className="fas fa-server" aria-hidden="true" /> VPS
                  </span>
                  <span className="category-count" data-count-for="vps">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab" data-category="downloader">
                  <span className="category-tab-main">
                    <i className="fas fa-download" aria-hidden="true" /> DOWNLOADER
                  </span>
                  <span className="category-count" data-count-for="downloader">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab" data-category="maker">
                  <span className="category-tab-main">
                    <i className="fas fa-paintbrush" aria-hidden="true" /> MAKER
                  </span>
                  <span className="category-count" data-count-for="maker">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab" data-category="tools">
                  <span className="category-tab-main">
                    <i className="fas fa-screwdriver-wrench" aria-hidden="true" /> TOOLS
                  </span>
                  <span className="category-count" data-count-for="tools">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab" data-category="external">
                  <span className="category-tab-main">
                    <i className="fas fa-link" aria-hidden="true" /> EXTERNAL
                  </span>
                  <span className="category-count" data-count-for="external">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab" data-category="extra">
                  <span className="category-tab-main">
                    <i className="fas fa-plus-circle" aria-hidden="true" /> EXTRA
                  </span>
                  <span className="category-count" data-count-for="extra">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab tab-xvip" data-category="xvip">
                  <span className="category-tab-main">
                    <i className="fas fa-crown" aria-hidden="true" /> XVIP
                  </span>
                  <span className="category-count" data-count-for="xvip">0</span>
                </button>
                <button type="button" role="tab" aria-selected="false" className="category-tab" data-category="telegram">
                  <span className="category-tab-main">
                    <i className="fas fa-plug" aria-hidden="true" /> CUSTOM
                  </span>
                  <span className="category-count" data-count-for="telegram">0</span>
                </button>
              </div>

              <div className="tools-main-pane">
                <label htmlFor="searchInput" className="search-label">
                  Cari modul tool berdasarkan nama atau deskripsi
                </label>
                <div className="search-wrapper" id="searchWrapper">
                  <i className="fas fa-search" aria-hidden="true" />
                  <input
                    type="search"
                    id="searchInput"
                    placeholder="Ketik nama tool (contoh: TikTok, DNS, Shortlink, QR)..."
                  />
                  <span className="search-shortcut" aria-hidden="true">⌘K</span>
                </div>
                <div id="toolsContainer" />
              </div>
            </div>
          </section>

          <section className="page" id="profilePage" aria-label="Profil dan Pengaturan" hidden>
            <div className="device-card">
              <div className="profile-pilot-banner">
                <button
                  type="button"
                  className="profile-avatar-btn"
                  id="profAvatarContainer"
                  aria-label="Unggah atau ganti foto profil"
                >
                  <img
                    id="profAvatarImg"
                    width={92}
                    height={92}
                    style={{ display: "none" }}
                    alt="Foto profil pengguna"
                  />
                  <span className="avatar-placeholder" id="profAvatarPlaceholder">
                    M
                  </span>
                  <span className="avatar-overlay" aria-hidden="true">
                    <i className="fas fa-camera" />
                  </span>
                </button>
                <label htmlFor="avatarFileInput" className="sr-only">
                  Pilih file foto profil
                </label>
                <input
                  type="file"
                  id="avatarFileInput"
                  accept="image/*"
                  className="sr-only"
                />

                <div className="profile-pilot-info">
                  <div className="profile-pilot-name" id="profName">
                    User
                  </div>
                  <div className="profile-pilot-role" id="profRole">
                    MEMBER
                  </div>
                  <div className="profile-avatar-hint">
                    Klik tombol foto atau seret gambar (maks. 2MB) untuk mengganti avatar.
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <div className="dev-row">
                      <span className="label">
                        <i className="fas fa-laptop" aria-hidden="true" /> Perangkat
                      </span>
                      <span className="value" id="profDevice">
                        -
                      </span>
                    </div>
                    <div className="dev-row">
                      <span className="label">
                        <i className="fas fa-battery-three-quarters" aria-hidden="true" /> Baterai
                      </span>
                      <span className="value" id="profBattery">
                        -
                      </span>
                    </div>
                    <div className="dev-row">
                      <span className="label">
                        <i className="fas fa-crown" aria-hidden="true" /> Role Akses
                      </span>
                      <span className="value role" id="profRoleValue">
                        MEMBER
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-settings-grid">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    callGlobal("changeUsername");
                  }}
                >
                  <h2 className="settings-heading">
                    <i className="fas fa-user-pen" aria-hidden="true" /> Ganti Username
                  </h2>
                  <div className="field-stack">
                    <label htmlFor="newUsernameInput" className="field-label">
                      Username Baru
                    </label>
                    <div className="input-group">
                      <i className="fas fa-user" aria-hidden="true" />
                      <input
                        type="text"
                        id="newUsernameInput"
                        placeholder="Masukkan username baru"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-auth mecha-cut-sm">
                    <i className="fas fa-check" aria-hidden="true" /> Simpan Username
                  </button>
                </form>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    callGlobal("changePassword");
                  }}
                >
                  <h2 className="settings-heading">
                    <i className="fas fa-key" aria-hidden="true" /> Ganti Password
                  </h2>
                  <div className="field-stack">
                    <label htmlFor="currentPassInput" className="field-label">
                      Password Saat Ini
                    </label>
                    <div className="input-group">
                      <i className="fas fa-lock" aria-hidden="true" />
                      <input
                        type="password"
                        id="currentPassInput"
                        autoComplete="current-password"
                        placeholder="Password saat ini"
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        aria-label="Tampilkan atau sembunyikan password saat ini"
                        aria-pressed="false"
                        data-toggle-pass="currentPassInput"
                      >
                        <i className="fas fa-eye" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="field-stack">
                    <label htmlFor="newPassInput" className="field-label">
                      Password Baru
                    </label>
                    <div className="input-group">
                      <i className="fas fa-lock" aria-hidden="true" />
                      <input
                        type="password"
                        id="newPassInput"
                        autoComplete="new-password"
                        placeholder="Password baru"
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        aria-label="Tampilkan atau sembunyikan password baru"
                        aria-pressed="false"
                        data-toggle-pass="newPassInput"
                      >
                        <i className="fas fa-eye" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="field-stack">
                    <label htmlFor="newPassInput2" className="field-label">
                      Konfirmasi Password Baru
                    </label>
                    <div className="input-group">
                      <i className="fas fa-lock" aria-hidden="true" />
                      <input
                        type="password"
                        id="newPassInput2"
                        autoComplete="new-password"
                        placeholder="Ulangi password baru"
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        aria-label="Tampilkan atau sembunyikan konfirmasi password baru"
                        aria-pressed="false"
                        data-toggle-pass="newPassInput2"
                      >
                        <i className="fas fa-eye" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-auth mecha-cut-sm">
                    <i className="fas fa-check" aria-hidden="true" /> Simpan Password
                  </button>
                </form>
              </div>

              <div id="ownerPanel" className="owner-panel-box" hidden>
                <div className="owner-panel-head-row">
                  <h2 className="owner-heading" style={{ marginBottom: 0 }}>
                    <i className="fas fa-crown" aria-hidden="true" /> Panel Owner (Akses Penuh)
                  </h2>
                  <Link href="/owner" prefetch={false} id="ownerFullPanelBtn" className="btn-auth mecha-cut-sm owner-jump-btn">
                    <i className="fas fa-sliders" aria-hidden="true" /> Buka Panel /owner
                  </Link>
                </div>

                <div className="field-stack">
                  <span className="field-label">Pilih Palet Warna (Hitam / Abu / Putih)</span>
                  <div className="owner-theme-row" role="group" aria-label="Pilihan palet tema website">
                    {["hitam", "abu", "putih"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="theme-chip-btn"
                        data-theme-btn={t}
                        aria-pressed={t === "hitam" ? "true" : "false"}
                        onClick={() => callGlobal("applyTheme", t)}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-settings-grid">
                  <div>
                    <h3 className="settings-heading">
                      <i className="fas fa-plus-circle" aria-hidden="true" /> Tambah Tool Custom
                    </h3>
                    <div className="field-stack">
                      <label htmlFor="ownerToolName" className="field-label">
                        Nama Tool
                      </label>
                      <div className="input-group">
                        <i className="fas fa-tag" aria-hidden="true" />
                        <input type="text" id="ownerToolName" placeholder="Contoh: MattzLM Parser" />
                      </div>
                    </div>
                    <div className="field-stack">
                      <label htmlFor="ownerToolUrl" className="field-label">
                        URL Tool
                      </label>
                      <div className="input-group">
                        <i className="fas fa-link" aria-hidden="true" />
                        <input type="url" id="ownerToolUrl" placeholder="https://example.com" />
                      </div>
                    </div>
                    <div className="field-stack">
                      <label htmlFor="ownerToolDesc" className="field-label">
                        Deskripsi Singkat
                      </label>
                      <div className="input-group">
                        <i className="fas fa-align-left" aria-hidden="true" />
                        <input type="text" id="ownerToolDesc" placeholder="Keterangan singkat tool" />
                      </div>
                    </div>
                    <div className="owner-action-row">
                      <button
                        type="button"
                        className="btn-auth mecha-cut-sm"
                        onClick={() => callGlobal("ownerAddTool")}
                      >
                        <i className="fas fa-plus" aria-hidden="true" /> Tambah Tool
                      </button>
                      <button
                        type="button"
                        className="btn-auth btn-secondary"
                        onClick={() => callGlobal("ownerRestoreTools")}
                      >
                        <i className="fas fa-rotate-left" aria-hidden="true" /> Pulihkan Tools
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="settings-heading">
                      <i className="fas fa-users-cog" aria-hidden="true" /> Kelola Akun &amp; Role
                    </h3>
                    <div className="field-stack">
                      <label htmlFor="ownerAccUser" className="field-label">
                        Username Akun
                      </label>
                      <div className="input-group">
                        <i className="fas fa-user" aria-hidden="true" />
                        <input type="text" id="ownerAccUser" placeholder="Username target" />
                      </div>
                    </div>
                    <div className="field-stack">
                      <label htmlFor="ownerAccPass" className="field-label">
                        Password Akun
                      </label>
                      <div className="input-group">
                        <i className="fas fa-lock" aria-hidden="true" />
                        <input type="password" id="ownerAccPass" placeholder="Password (kosongkan jika ubah role)" />
                        <button
                          type="button"
                          className="pass-toggle-btn"
                          aria-label="Tampilkan atau sembunyikan password akun"
                          aria-pressed="false"
                          data-toggle-pass="ownerAccPass"
                        >
                          <i className="fas fa-eye" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="field-stack">
                      <label htmlFor="ownerAccRole" className="field-label">
                        Role Akun
                      </label>
                      <div className="input-group">
                        <i className="fas fa-shield-halved" aria-hidden="true" />
                        <select id="ownerAccRole" defaultValue="member">
                          <option value="member">member</option>
                          <option value="xvip">xvip</option>
                          <option value="admin">admin</option>
                          <option value="owner">owner</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-auth mecha-cut-sm"
                      onClick={() => callGlobal("ownerSaveAccount")}
                    >
                      <i className="fas fa-user-check" aria-hidden="true" /> Simpan / Update Akun
                    </button>
                    <div id="ownerUsersList" className="owner-users-list" />
                  </div>
                </div>

                <div className="owner-chat-box">
                  <h3 className="settings-heading">
                    <i className="fas fa-comment-dots" aria-hidden="true" /> Balas Chat &amp; Reset Limit
                  </h3>
                  <div className="field-stack">
                    <label htmlFor="ownerReplyInput" className="field-label">
                      Pesan Balasan Owner
                    </label>
                    <div className="input-group">
                      <i className="fas fa-reply" aria-hidden="true" />
                      <input type="text" id="ownerReplyInput" placeholder="Tulis balasan sebagai Owner..." />
                    </div>
                  </div>
                  <div className="owner-action-row">
                    <button
                      type="button"
                      className="btn-auth mecha-cut-sm"
                      onClick={() => callGlobal("ownerReplyChat")}
                    >
                      <i className="fas fa-paper-plane" aria-hidden="true" /> Kirim Balasan
                    </button>
                    <button
                      type="button"
                      className="btn-auth btn-secondary"
                      onClick={() => callGlobal("ownerResetChatLimits")}
                    >
                      <i className="fas fa-unlock" aria-hidden="true" /> Reset Limit Chat
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-logout-full"
                onClick={() => callGlobal("doLogout")}
              >
                <i className="fas fa-sign-out-alt" aria-hidden="true" /> Keluar dari Sesi
              </button>
            </div>
          </section>

          <section className="page" id="chatPage" aria-label="Chat Admin" hidden>
            <div className="chat-container">
              <div className="chat-header">
                <h2>
                  <i className="fas fa-comment" aria-hidden="true" /> Chat Admin
                </h2>
              </div>
              <div className="chat-messages" id="chatMessages" aria-live="polite">
                <div className="chat-empty">
                  <i className="fas fa-comment-dots" aria-hidden="true" />
                  Tulis pesan untuk admin; balasan muncul di sini.
                </div>
              </div>
              <div className="chat-input-area">
                <label htmlFor="chatInput" className="sr-only">
                  Tulis pesan ke admin
                </label>
                <input
                  type="text"
                  id="chatInput"
                  placeholder="Tulis pesan untuk admin..."
                  maxLength={500}
                />
                <button type="button" id="chatSendBtn">
                  <i className="fas fa-paper-plane" aria-hidden="true" /> Kirim
                </button>
              </div>
              <div className="chat-limit" id="chatLimit">
                Sisa chat: 5
              </div>
            </div>
          </section>

          <footer className="app-footer">
            <span>MattzLM • Cari tool: Ctrl+K / ⌘K</span>
            <a
              href="https://github.com/Mattz1415/vip-tools"
              target="_blank"
              rel="noopener noreferrer"
            >
              Repositori Mattz1415/vip-tools
            </a>
          </footer>
        </main>

        <nav className="bottom-nav" aria-label="Navigasi mobile">
          <button
            type="button"
            className="nav-item active"
            data-page="homePage"
            aria-current="page"
          >
            <i className="fas fa-home" aria-hidden="true" />
            <span>Beranda</span>
          </button>
          <button type="button" className="nav-item" data-page="toolsPage">
            <i className="fas fa-toolbox" aria-hidden="true" />
            <span>Tools</span>
          </button>
          <button type="button" className="nav-item" data-page="profilePage">
            <i className="fas fa-user" aria-hidden="true" />
            <span>Profil</span>
          </button>
          <button type="button" className="nav-item" data-page="chatPage">
            <i className="fas fa-comment" aria-hidden="true" />
            <span>Chat</span>
          </button>
          <Link
            href="/owner"
            prefetch={false}
            id="ownerMobileLink"
            className="nav-item owner-only-link"
            aria-label="Panel Owner"
            hidden
          >
            <i className="fas fa-crown" aria-hidden="true" />
            <span>Owner</span>
          </Link>
        </nav>
      </div>

      <div
        className="tool-viewer"
        id="toolViewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="toolViewerTitle"
        hidden
      >
        <div className="tool-viewer-content mecha-cut" id="toolViewerContent">
          <button
            type="button"
            className="tool-viewer-close"
            id="toolViewerCloseBtn"
            aria-label="Tutup dialog tool"
            onClick={() => callGlobal("closeTool")}
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
          <div id="toolViewerBody" />
        </div>
      </div>
    </>
  );
}
