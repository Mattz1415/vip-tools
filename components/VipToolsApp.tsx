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

      <div id="loader">
        <div className="loader-title">VIP TOOLS</div>
        <div className="loader-sub">✦ KAZE SENPAI ✦</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" />
        </div>
        <div className="loader-status" id="ldStatus">
          LOADING MODULES...
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
          𝐈𝐍𝐈 𝐀𝐏𝐋𝐈𝐊𝐀𝐒𝐈 𝐅𝐑𝐄𝐄 𝐁𝐘 𝐊𝐀𝐙𝐄, 𝐊𝐀𝐋𝐎 𝐀𝐃𝐀 𝐘𝐀𝐍𝐆 𝐌𝐄𝐌𝐏𝐄𝐑𝐉𝐔𝐀𝐋 𝐁𝐄𝐋𝐈𝐊𝐀𝐍 𝐒𝐄𝐆𝐄𝐑𝐀 𝐋𝐀𝐏𝐎𝐑 𝐊𝐄 𝐎𝐖𝐍𝐄𝐑 (𝐊𝐀𝐙𝐄) 𝟎𝟖𝟓𝟏𝟑𝟒𝟕𝟓𝟎𝟗𝟓𝟑 𝐀𝐆𝐀𝐑 𝐓𝐈𝐃𝐀𝐊 𝐀𝐃𝐀 𝐊𝐎𝐑𝐁𝐀𝐍 𝐒𝐄𝐋𝐀𝐍𝐉𝐔𝐓𝐍𝐘𝐀
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
            <span id="sbAvatarText">K</span>
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
          <div className="logo">
            <h1>VIP TOOLS</h1>
            <p>✦ KAZE SENPAI ✦</p>
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

      <div className="app-wrap" id="appWrap">
        <header className="header-top">
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
                Vip <span>Tools</span>
              </span>
              <span className="brand-tagline">PREMIUM TOOLS</span>
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
            <div className="video-landscape">
              <video autoPlay loop muted playsInline id="homeVideo">
                <source
                  src="https://c.termai.cc/v131/H4vF9D.mp4"
                  type="video/mp4"
                />
              </video>
            </div>

            <div className="device-card">
              <div className="dev-row">
                <span className="label">
                  <i className="fas fa-user" style={{ width: "16px" }} />{" "}
                  Username
                </span>
                <span className="value" id="devUser">
                  -
                </span>
              </div>
              <div className="dev-row">
                <span className="label">
                  <i className="fas fa-laptop" style={{ width: "16px" }} />{" "}
                  Perangkat
                </span>
                <span className="value" id="devDevice">
                  -
                </span>
              </div>
              <div className="dev-row">
                <span className="label">
                  <i
                    className="fas fa-battery-three-quarters"
                    style={{ width: "16px" }}
                  />{" "}
                  Baterai
                </span>
                <span className="value" id="devBattery">
                  -
                </span>
              </div>
              <div className="dev-row">
                <span className="label">
                  <i className="fas fa-crown" style={{ width: "16px" }} /> Role
                </span>
                <span className="value role" id="devRole">
                  ✦ MEMBER
                </span>
              </div>
            </div>

            <div className="channel-buttons">
              <a
                href="https://www.tiktok.com/@voidzerov2"
                target="_blank"
                rel="noreferrer"
                className="channel-btn tt"
              >
                <i className="fab fa-tiktok" /> @voidzerov2
              </a>
            </div>

            <div style={{ marginTop: "4px" }}>
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

            <div style={{ marginTop: "18px" }}>
              <div className="section-title">
                <i
                  className="fas fa-plus-circle"
                  style={{ color: "var(--new-badge)" }}
                />{" "}
                Tools Terbaru dari Telegram
                <span className="line" />
              </div>
              <div className="tools-grid" id="telegramToolsGrid" />
            </div>
          </div>

          <div className="page" id="toolsPage">
            <div className="search-wrapper" id="searchWrapper">
              <i className="fas fa-search" />
              <input type="text" id="searchInput" placeholder="Cari tools..." />
              <span className="search-shortcut">⌘K</span>
            </div>

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

            <div id="toolsContainer" />
          </div>

          <div className="page" id="profilePage">
            <div
              className="device-card"
              style={{ textAlign: "center", padding: "28px 16px" }}
            >
              <div className="profile-avatar-container" id="profAvatarContainer">
                <img id="profAvatarImg" style={{ display: "none" }} alt="Avatar" />
                <span className="avatar-placeholder" id="profAvatarPlaceholder">
                  K
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
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "var(--theme-text-muted)",
                  marginBottom: "8px",
                }}
              >
                Klik atau drag &amp; drop foto ke avatar
              </div>
              <div
                style={{ fontSize: "1.1rem", fontWeight: 700 }}
                id="profName"
              >
                User
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--theme-primary-light)",
                  letterSpacing: "3px",
                  marginTop: "2px",
                }}
                id="profRole"
              >
                ✦ MEMBER ✦
              </div>

              <div
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid var(--theme-border-color)",
                  paddingTop: "16px",
                  textAlign: "left",
                }}
              >
                <div className="dev-row">
                  <span className="label">
                    <i className="fas fa-laptop" style={{ width: "16px" }} />{" "}
                    Perangkat
                  </span>
                  <span className="value" id="profDevice">
                    -
                  </span>
                </div>
                <div className="dev-row">
                  <span className="label">
                    <i
                      className="fas fa-battery-three-quarters"
                      style={{ width: "16px" }}
                    />{" "}
                    Baterai
                  </span>
                  <span className="value" id="profBattery">
                    -
                  </span>
                </div>
                <div className="dev-row">
                  <span className="label">
                    <i className="fas fa-crown" style={{ width: "16px" }} />{" "}
                    Role
                  </span>
                  <span className="value role" id="profRoleValue">
                    ✦ MEMBER
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid var(--theme-border-color)",
                  paddingTop: "16px",
                }}
              >
                <h3
                  style={{
                    marginBottom: "12px",
                    fontSize: "0.9rem",
                    textAlign: "left",
                  }}
                >
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

              <div
                style={{
                  marginTop: "16px",
                  borderTop: "1px solid var(--theme-border-color)",
                  paddingTop: "16px",
                }}
              >
                <h3
                  style={{
                    marginBottom: "12px",
                    fontSize: "0.9rem",
                    textAlign: "left",
                  }}
                >
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
