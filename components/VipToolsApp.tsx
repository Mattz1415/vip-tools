"use client";

import { useEffect } from "react";
import { initVipTools } from "@/lib/vip-tools-client";

function callGlobal(name: string, ...args: unknown[]) {
  const fn = (window as unknown as Record<string, ((...a: unknown[]) => void) | undefined>)[name];
  if (typeof fn === "function") {
    fn(...args);
  }
}

export default function VipToolsApp() {
  useEffect(() => {
    initVipTools();
  }, []);

  return (
    <>
      <video id="bgVideo" autoPlay loop muted playsInline>
        <source src="https://c.termai.cc/v131/H4vF9D.mp4" type="video/mp4" />
      </video>
      <div id="bgOverlay" />
      <div className="anime-orbs">
        <div className="anime-orb orb-1" />
        <div className="anime-orb orb-2" />
        <div className="anime-orb orb-3" />
      </div>
      <div className="anime-grid-3d" />
      <canvas id="animeParticles" />

      <div id="loader">
        <div className="loader-ring-3d">
          <span />
          <span />
          <span />
        </div>
        <div className="loader-title">MATTZLM</div>
        <div className="loader-sub">✦ ANIME 3D DECK ✦</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" />
        </div>
        <div className="loader-status" id="ldStatus">
          INITIALIZING 3D MODULES...
        </div>
      </div>

      <div id="toast" />

      <div id="warningBanner" className="warning-banner">
        <button
          className="warning-close"
          onClick={() => callGlobal("closeWarningBanner")}
        >
          <i className="fas fa-times" />
        </button>
        <div className="warning-text">
          𝐈𝐍𝐈 𝐀𝐏𝐋𝐈𝐊𝐀𝐒𝐈 𝐅𝐑𝐄𝐄 𝐁𝐘 𝐌𝐀𝐓𝐓𝐙𝐋𝐌, 𝐊𝐀𝐋𝐎 𝐀𝐃𝐀 𝐘𝐀𝐍𝐆 𝐌𝐄𝐌𝐏𝐄𝐑𝐉𝐔𝐀𝐋 𝐁𝐄𝐋𝐈𝐊𝐀𝐍 𝐒𝐄𝐆𝐄𝐑𝐀 𝐋𝐀𝐏𝐎𝐑 𝐊𝐄 𝐎𝐖𝐍𝐄𝐑 (𝐌𝐀𝐓𝐓𝐙𝐋𝐌) 𝐀𝐆𝐀𝐑 𝐓𝐈𝐃𝐀𝐊 𝐀𝐃𝐀 𝐊𝐎𝐑𝐁𝐀𝐍 𝐒𝐄𝐋𝐀𝐍𝐉𝐔𝐓𝐍𝐘𝐀
        </div>
      </div>

      <div className="preview-overlay" id="previewOverlay">
        <div className="preview-header">
          <button
            className="preview-back"
            onClick={() => callGlobal("closePreview")}
          >
            <i className="fas fa-arrow-left" /> Kembali
          </button>
          <span className="preview-title" id="previewTitle">
            Loading...
          </span>
        </div>
        <iframe className="preview-frame" id="previewFrame" src="about:blank" />
      </div>

      <div className="sidebar-overlay" id="sbOverlay" />
      <div className="sidebar" id="sidebar">
        <div className="sb-head">
          <div className="avatar" id="sbAvatar">
            <span id="sbAvatarText">M</span>
          </div>
          <div>
            <div className="sb-name" id="sbName">
              User
            </div>
            <div className="sb-role" id="sbRole">
              ✦ MEMBER
            </div>
          </div>
        </div>
        <div className="sb-item active" data-page="homePage">
          <i className="fas fa-home" /> Beranda
        </div>
        <div className="sb-item" data-page="toolsPage">
          <i className="fas fa-toolbox" /> Tools
        </div>
        <div className="sb-item" data-page="profilePage">
          <i className="fas fa-user" /> Profil
        </div>
        <div className="sb-item" data-page="chatPage">
          <i className="fas fa-comment" /> Chat Admin
        </div>
        <div
          className="sb-item"
          style={{
            borderTop: "1px solid var(--theme-border-color)",
            marginTop: "8px",
            color: "#dc2626",
          }}
          onClick={() => callGlobal("doLogout")}
        >
          <i className="fas fa-sign-out-alt" /> Keluar
        </div>
      </div>

      <div id="authPage">
        <div className="auth-box">
          <div className="auth-anime-side">
            <div className="anime-emblem-3d">
              <i className="fas fa-bolt" />
            </div>
            <div className="auth-jp-tag">マッツ // ANIME 3D PORTAL</div>
          </div>
          <div className="auth-form-side">
            <div className="logo">
              <h1>MATTZLM</h1>
              <p>✦ VIP TOOLS 3D ✦</p>
            </div>
            <div className="auth-mode">
              <button
                className="mode-btn active"
                onClick={() => callGlobal("switchAuthMode", "login")}
              >
                LOGIN
              </button>
              <button
                className="mode-btn"
                onClick={() => callGlobal("switchAuthMode", "register")}
              >
                DAFTAR
              </button>
            </div>
            <div id="loginView">
              <div className="input-group">
                <i className="fas fa-user" />
                <input type="text" id="loginUser" placeholder="Username" />
              </div>
              <div className="input-group">
                <i className="fas fa-lock" />
                <input type="password" id="loginPass" placeholder="Password" />
              </div>
              <button className="btn-auth" onClick={() => callGlobal("doLogin")}>
                <i className="fas fa-right-to-bracket" /> MASUK
              </button>
            </div>
            <div id="registerView" style={{ display: "none" }}>
              <div className="input-group">
                <i className="fas fa-user" />
                <input type="text" id="regUser" placeholder="Username" />
              </div>
              <div className="input-group">
                <i className="fas fa-lock" />
                <input type="password" id="regPass" placeholder="Password" />
              </div>
              <div className="input-group">
                <i className="fas fa-lock" />
                <input
                  type="password"
                  id="regPass2"
                  placeholder="Konfirmasi Password"
                />
              </div>
              <button
                className="btn-auth"
                onClick={() => callGlobal("doRegister")}
              >
                <i className="fas fa-user-plus" /> DAFTAR
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="app-wrap" id="appWrap">
        <aside className="anime-rail">
          <div className="rail-brand">
            <i className="fas fa-dragon" />
          </div>
          <div className="rail-nav">
            <button
              className="rail-item active"
              data-page="homePage"
              title="Beranda"
            >
              <i className="fas fa-home" />
            </button>
            <button
              className="rail-item"
              data-page="toolsPage"
              title="Tools"
            >
              <i className="fas fa-toolbox" />
            </button>
            <button
              className="rail-item"
              data-page="profilePage"
              title="Profil"
            >
              <i className="fas fa-user" />
            </button>
            <button
              className="rail-item"
              data-page="chatPage"
              title="Chat"
            >
              <i className="fas fa-comment" />
            </button>
          </div>
          <button
            className="rail-logout"
            onClick={() => callGlobal("doLogout")}
            title="Keluar"
          >
            <i className="fas fa-sign-out-alt" />
          </button>
        </aside>

        <header className="header-top">
          <div className="header-left-group">
            <div className="menu-btn" onClick={() => callGlobal("toggleSidebar")}>
              <span />
              <span />
              <span />
            </div>
            <div className="logo-wrapper">
              <div className="logo-icon" id="logoIcon">
                <i className="fas fa-bolt" />
              </div>
              <div className="logo-text">
                <span className="brand-name">
                  Mattz<span>LM</span>
                </span>
                <span className="brand-tagline">ANIME 3D DECK</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <nav className="header-nav" id="headerNav">
              <a
                href="#"
                className="active"
                id="navHome"
                onClick={(e) => {
                  e.preventDefault();
                  callGlobal("showPage", "homePage");
                }}
              >
                Home
              </a>
              <a
                href="#"
                id="navTools"
                onClick={(e) => {
                  e.preventDefault();
                  callGlobal("showPage", "toolsPage");
                }}
              >
                Tools
              </a>
              <a
                href="#"
                id="navProfile"
                onClick={(e) => {
                  e.preventDefault();
                  callGlobal("showPage", "profilePage");
                }}
              >
                Profil
              </a>
              <a
                href="#"
                id="navChat"
                onClick={(e) => {
                  e.preventDefault();
                  callGlobal("showPage", "chatPage");
                }}
              >
                Chat
              </a>
            </nav>
            <button
              className="header-btn"
              id="themeToggleBtn"
              onClick={() => callGlobal("toggleSpecialTheme")}
              title="Ganti tema & video"
            >
              <i className="fas fa-circle-half-stroke" />
            </button>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                className="header-btn"
                id="musicToggleBtn"
                onClick={() => callGlobal("toggleMusic")}
                title="Musik"
              >
                <i className="fas fa-music" />
              </button>
              <div className="music-visualizer" id="musicVisualizer">
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </div>
              <button
                className="change-music-btn"
                onClick={() => callGlobal("changeMusic")}
                title="Ganti lagu"
              >
                <i className="fas fa-rotate" />
              </button>
            </div>
            <button
              className="header-btn"
              onClick={() => callGlobal("showPage", "chatPage")}
            >
              <i className="fas fa-comment" /> Chat
            </button>
          </div>
        </header>

        <audio id="bgMusic" loop preload="none">
          <source src="https://c.termai.cc/v139/dhV3.mp4" type="audio/mp4" />
        </audio>

        <div className="content-wrap">
          <div className="page active" id="homePage">
            <div className="anime-hero-grid">
              <div className="hero-visor">
                <div className="video-landscape">
                  <video autoPlay loop muted playsInline id="homeVideo">
                    <source
                      src="https://c.termai.cc/v131/H4vF9D.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
                <div className="visor-hud-overlay">
                  <span className="visor-badge">LIVE HUD // MATTZLM</span>
                  <a
                    href="https://github.com/Mattz1415"
                    target="_blank"
                    rel="noreferrer"
                    className="channel-btn"
                  >
                    <i className="fab fa-github" /> MattzLM
                  </a>
                </div>
              </div>

              <div className="telemetry-grid">
                <div className="stat-tile">
                  <div className="tile-icon">
                    <i className="fas fa-user" />
                  </div>
                  <span className="label">Username</span>
                  <span className="value" id="devUser">
                    -
                  </span>
                </div>
                <div className="stat-tile">
                  <div className="tile-icon">
                    <i className="fas fa-laptop" />
                  </div>
                  <span className="label">Perangkat</span>
                  <span className="value" id="devDevice">
                    -
                  </span>
                </div>
                <div className="stat-tile">
                  <div className="tile-icon">
                    <i className="fas fa-battery-three-quarters" />
                  </div>
                  <span className="label">Baterai</span>
                  <span className="value" id="devBattery">
                    -
                  </span>
                </div>
                <div className="stat-tile">
                  <div className="tile-icon">
                    <i className="fas fa-crown" />
                  </div>
                  <span className="label">Role</span>
                  <span className="value role" id="devRole">
                    ✦ MEMBER
                  </span>
                </div>
              </div>
            </div>

            <div className="home-bento-decks">
              <div className="deck-panel">
                <div className="section-title">
                  <i
                    className="fas fa-th-large"
                    style={{ color: "var(--theme-primary)" }}
                  />{" "}
                  Tools Populer
                  <span className="line" />
                </div>
                <div className="tools-grid" id="popularGrid" />
              </div>

              <div className="deck-panel">
                <div className="section-title">
                  <i
                    className="fas fa-plus-circle"
                    style={{ color: "var(--new-badge)" }}
                  />{" "}
                  Tools Terbaru
                  <span className="line" />
                </div>
                <div className="tools-grid" id="telegramToolsGrid" />
              </div>
            </div>
          </div>

          <div className="page" id="toolsPage">
            <div className="tools-workspace">
              <div className="category-tabs" id="categoryTabs">
                <button className="category-tab active" data-category="all">
                  <i className="fas fa-th-large" /> ALL
                </button>
                <button className="category-tab" data-category="downloader">
                  <i className="fas fa-download" /> DOWNLOADER
                </button>
                <button className="category-tab" data-category="maker">
                  <i className="fas fa-wand-magic-sparkles" /> MAKER
                </button>
                <button className="category-tab" data-category="tools">
                  <i className="fas fa-screwdriver-wrench" /> TOOLS
                </button>
                <button className="category-tab" data-category="external">
                  <i className="fas fa-link" /> EXTERNAL
                </button>
                <button className="category-tab" data-category="extra">
                  <i className="fas fa-plus-circle" /> EXTRA
                </button>
                <button
                  className="category-tab"
                  data-category="xvip"
                  style={{
                    borderColor: "rgba(245,158,11,0.3)",
                    color: "#f59e0b",
                  }}
                >
                  <i className="fas fa-crown" /> XVIP
                </button>
                <button
                  className="category-tab"
                  data-category="telegram"
                  style={{
                    borderColor: "rgba(34,197,94,0.3)",
                    color: "var(--new-badge)",
                  }}
                >
                  <i className="fas fa-robot" /> TELEGRAM
                </button>
              </div>

              <div className="tools-main-pane">
                <div className="search-wrapper" id="searchWrapper">
                  <i className="fas fa-search" />
                  <input
                    type="text"
                    id="searchInput"
                    placeholder="Cari tools..."
                  />
                  <span className="search-shortcut">⌘K</span>
                </div>
                <div id="toolsContainer" />
              </div>
            </div>
          </div>

          <div className="page" id="profilePage">
            <div className="device-card">
              <div className="profile-pilot-banner">
                <div
                  className="profile-avatar-container"
                  id="profAvatarContainer"
                >
                  <img
                    id="profAvatarImg"
                    style={{ display: "none" }}
                    alt="Avatar"
                  />
                  <span
                    className="avatar-placeholder"
                    id="profAvatarPlaceholder"
                  >
                    M
                  </span>
                  <div className="avatar-overlay">
                    <i className="fas fa-camera" />
                  </div>
                </div>
                <input
                  type="file"
                  id="avatarFileInput"
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div
                    style={{ fontSize: "1.25rem", fontWeight: 700 }}
                    id="profName"
                  >
                    User
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--anime-cyan)",
                      letterSpacing: "3px",
                      marginTop: "2px",
                    }}
                    id="profRole"
                  >
                    ✦ MEMBER ✦
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--theme-text-muted)",
                      marginTop: "6px",
                    }}
                  >
                    Klik atau drag &amp; drop foto ke avatar
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <div className="dev-row">
                      <span className="label">
                        <i className="fas fa-laptop" /> Perangkat
                      </span>
                      <span className="value" id="profDevice">
                        -
                      </span>
                    </div>
                    <div className="dev-row">
                      <span className="label">
                        <i className="fas fa-battery-three-quarters" /> Baterai
                      </span>
                      <span className="value" id="profBattery">
                        -
                      </span>
                    </div>
                    <div className="dev-row">
                      <span className="label">
                        <i className="fas fa-crown" /> Role
                      </span>
                      <span className="value role" id="profRoleValue">
                        ✦ MEMBER
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-settings-grid">
                <div>
                  <h3 style={{ marginBottom: "12px", fontSize: "0.9rem" }}>
                    <i className="fas fa-user-pen" /> Ganti Username
                  </h3>
                  <div className="input-group">
                    <i className="fas fa-user" />
                    <input
                      type="text"
                      id="newUsernameInput"
                      placeholder="Username baru"
                    />
                  </div>
                  <button
                    className="btn-auth"
                    onClick={() => callGlobal("changeUsername")}
                    style={{ padding: "10px", fontSize: "0.8rem" }}
                  >
                    <i className="fas fa-check" /> Simpan Username
                  </button>
                </div>

                <div>
                  <h3 style={{ marginBottom: "12px", fontSize: "0.9rem" }}>
                    <i className="fas fa-key" /> Ganti Password
                  </h3>
                  <div className="input-group">
                    <i className="fas fa-lock" />
                    <input
                      type="password"
                      id="currentPassInput"
                      placeholder="Password saat ini"
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-lock" />
                    <input
                      type="password"
                      id="newPassInput"
                      placeholder="Password baru"
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-lock" />
                    <input
                      type="password"
                      id="newPassInput2"
                      placeholder="Konfirmasi password baru"
                    />
                  </div>
                  <button
                    className="btn-auth"
                    onClick={() => callGlobal("changePassword")}
                    style={{ padding: "10px", fontSize: "0.8rem" }}
                  >
                    <i className="fas fa-check" /> Simpan Password
                  </button>
                </div>
              </div>

              <div
                id="ownerPanel"
                style={{
                  display: "none",
                  marginTop: "20px",
                  borderTop: "1px solid var(--theme-border-color)",
                  paddingTop: "16px",
                  textAlign: "left",
                }}
              >
                <h3
                  style={{
                    marginBottom: "12px",
                    fontSize: "0.95rem",
                    color: "#f59e0b",
                  }}
                >
                  <i className="fas fa-crown" /> Panel Owner (Full Akses)
                </h3>

                <div style={{ marginBottom: "14px" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--theme-text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Tema Website
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {["biru", "merah", "hitam", "putih", "silver"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="category-tab"
                        style={{
                          width: "auto",
                          padding: "6px 12px",
                          fontSize: "0.7rem",
                        }}
                        onClick={() => callGlobal("applyTheme", t)}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-settings-grid">
                  <div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      <i className="fas fa-plus-circle" /> Tambah Tool Custom
                    </div>
                    <div className="input-group">
                      <i className="fas fa-tag" />
                      <input
                        type="text"
                        id="ownerToolName"
                        placeholder="Nama tool"
                      />
                    </div>
                    <div className="input-group">
                      <i className="fas fa-link" />
                      <input
                        type="text"
                        id="ownerToolUrl"
                        placeholder="URL tool (https://...)"
                      />
                    </div>
                    <div className="input-group">
                      <i className="fas fa-align-left" />
                      <input
                        type="text"
                        id="ownerToolDesc"
                        placeholder="Deskripsi singkat"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="btn-auth"
                        onClick={() => callGlobal("ownerAddTool")}
                        style={{ padding: "10px", fontSize: "0.75rem", flex: 1 }}
                      >
                        <i className="fas fa-plus" /> Tambah Tool
                      </button>
                      <button
                        type="button"
                        className="btn-auth"
                        onClick={() => callGlobal("ownerRestoreTools")}
                        style={{
                          padding: "10px",
                          fontSize: "0.75rem",
                          flex: 1,
                          background: "rgba(50,100,255,0.2)",
                        }}
                      >
                        <i className="fas fa-rotate-left" /> Restore Tools
                      </button>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      <i className="fas fa-users-cog" /> Kelola Akun &amp; Role
                    </div>
                    <div className="input-group">
                      <i className="fas fa-user" />
                      <input
                        type="text"
                        id="ownerAccUser"
                        placeholder="Username"
                      />
                    </div>
                    <div className="input-group">
                      <i className="fas fa-lock" />
                      <input
                        type="password"
                        id="ownerAccPass"
                        placeholder="Password"
                      />
                    </div>
                    <div className="input-group">
                      <i className="fas fa-shield-halved" />
                      <select
                        id="ownerAccRole"
                        defaultValue="member"
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          color: "var(--theme-text-primary)",
                          outline: "none",
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "0.85rem",
                        }}
                      >
                        <option value="member" style={{ color: "#000" }}>
                          member
                        </option>
                        <option value="admin" style={{ color: "#000" }}>
                          admin
                        </option>
                        <option value="owner" style={{ color: "#000" }}>
                          owner
                        </option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn-auth"
                      onClick={() => callGlobal("ownerSaveAccount")}
                      style={{ padding: "10px", fontSize: "0.75rem" }}
                    >
                      <i className="fas fa-user-check" /> Simpan / Update Akun
                    </button>
                    <div
                      id="ownerUsersList"
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    borderTop: "1px solid var(--theme-border-color)",
                    paddingTop: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    <i className="fas fa-comment-dots" /> Balas Chat &amp; Reset Limit
                  </div>
                  <div className="input-group">
                    <i className="fas fa-reply" />
                    <input
                      type="text"
                      id="ownerReplyInput"
                      placeholder="Tulis balasan sebagai Owner..."
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn-auth"
                      onClick={() => callGlobal("ownerReplyChat")}
                      style={{ padding: "10px", fontSize: "0.75rem", flex: 1 }}
                    >
                      <i className="fas fa-paper-plane" /> Kirim Balasan
                    </button>
                    <button
                      type="button"
                      className="btn-auth"
                      onClick={() => callGlobal("ownerResetChatLimits")}
                      style={{
                        padding: "10px",
                        fontSize: "0.75rem",
                        flex: 1,
                        background: "rgba(34,197,94,0.2)",
                      }}
                    >
                      <i className="fas fa-unlock" /> Reset Limit Chat
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => callGlobal("doLogout")}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "12px",
                  background: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.15)",
                  borderRadius: "12px",
                  color: "#dc2626",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "0.3s",
                  fontFamily: "'Poppins',sans-serif",
                }}
              >
                <i className="fas fa-sign-out-alt" /> Keluar
              </button>
            </div>
          </div>

          <div className="page" id="chatPage">
            <div className="chat-container">
              <div className="chat-header">
                <h3>
                  <i className="fas fa-comment" /> Chat Admin
                </h3>
              </div>
              <div className="chat-messages" id="chatMessages">
                <div className="chat-empty">
                  <i className="fas fa-comment-dots" />
                  Kirim pesan ke admin. Admin akan membalas melalui Telegram.
                </div>
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  id="chatInput"
                  placeholder="Tulis pesan..."
                  maxLength={500}
                />
                <button id="chatSendBtn">
                  <i className="fas fa-paper-plane" /> Kirim
                </button>
              </div>
              <div className="chat-limit" id="chatLimit">
                Sisa chat: 5
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-nav">
          <button className="nav-item active" data-page="homePage">
            <i className="fas fa-home" />
            <span>Beranda</span>
          </button>
          <button className="nav-item" data-page="toolsPage">
            <i className="fas fa-toolbox" />
            <span>Tools</span>
          </button>
          <button className="nav-item" data-page="profilePage">
            <i className="fas fa-user" />
            <span>Profil</span>
          </button>
          <button className="nav-item" data-page="chatPage">
            <i className="fas fa-comment" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      <div className="tool-viewer" id="toolViewer">
        <div className="tool-viewer-content" id="toolViewerContent">
          <button
            className="tool-viewer-close"
            onClick={() => callGlobal("closeTool")}
          >
            <i className="fas fa-times" />
          </button>
          <div id="toolViewerBody" />
        </div>
      </div>
    </>
  );
}
