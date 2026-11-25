"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { signInWithGoogleFirebase, signOutFirebaseQuietly } from "@/lib/firebase-client";

interface PublicUser {
  username: string;
  role: "owner" | "admin" | "member";
  provider: "local" | "google";
  email: string;
  displayName: string;
  photoUrl: string;
  chatLimit: number;
  createdAt: number;
  lastLoginAt: number;
}

interface CustomTool {
  id: string;
  name: string;
  url: string;
  desc: string;
  category: string;
  createdAt: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "admin";
  username: string;
  text: string;
  time: number;
}

interface ShortLink {
  code: string;
  url: string;
  clicks: number;
  createdBy: string;
  createdAt: number;
}

interface PasteSummary {
  id: string;
  title: string;
  lang: string;
  views: number;
  createdBy: string;
  createdAt: number;
  length: number;
}

interface AuditLog {
  id: string;
  time: number;
  actor: string;
  action: string;
  detail: string;
}

interface OverviewData {
  vps: {
    hostname: string;
    platform: string;
    nodeVersion: string;
    uptimeSec: number;
    cpuCores: number;
    loadAvg: number[];
    memUsedMb: number;
    memTotalMb: number;
    memPercent: number;
    diskSummary: string;
    ytDlpVersion: string;
    hasYtCookies: boolean;
    firebaseReady: boolean;
  };
  users: PublicUser[];
  ownerEmails: string[];
  customTools: CustomTool[];
  hiddenTools: string[];
  chatMessages: ChatMessage[];
  shortLinks: ShortLink[];
  pastes: PasteSummary[];
  settings: {
    defaultTheme: "hitam" | "abu" | "putih";
    announcement: string;
    maintenanceMode: boolean;
    bgVideoUrl: string;
    homeRotate: number;
    visits: number;
  };
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  auditLogs: AuditLog[];
}

const BUILTIN_TOOL_IDS = [
  { id: "instagram", name: "Instagram Downloader" },
  { id: "tiktok", name: "TikTok Downloader" },
  { id: "youtube", name: "YouTube Downloader" },
  { id: "vps_dns", name: "DNS & WHOIS Lookup (VPS)" },
  { id: "vps_http", name: "HTTP & SSL Inspector (VPS)" },
  { id: "vps_ip", name: "IP Tracker & rDNS (VPS)" },
  { id: "vps_port", name: "TCP Port Checker (VPS)" },
  { id: "vps_shortlink", name: "VPS URL Shortener" },
  { id: "vps_paste", name: "VPS Code Paste" },
  { id: "vps_imgconv", name: "Image Compressor & Converter (VPS)" },
  { id: "vps_status", name: "VPS Server Telemetry" },
  { id: "iqc", name: "IQC Generator" },
  { id: "tanyaustadz", name: "Tanya Ustadz Meme" },
  { id: "sertifikat", name: "Sertifikat Lucu" },
  { id: "brat", name: "BRAT Generator" },
  { id: "fakeig", name: "Fake IG Post" },
  { id: "qr", name: "QR Generator" },
  { id: "removebg", name: "Remove BG (VPS)" },
  { id: "enhancer", name: "Image Enhancer (VPS)" },
  { id: "dev_json", name: "JSON Formatter" },
  { id: "dev_encode", name: "Base64 / URL / Hash" },
  { id: "calc", name: "Calculator" },
  { id: "pwgen", name: "Password Gen" },
  { id: "morse", name: "Morse Code" },
  { id: "xvip_unband", name: "XVIP Unban WA" },
  { id: "xvip_getcode", name: "XVIP Get HTML/CSS/JS" },
  { id: "xvip_nglspam", name: "XVIP NGL Sender" },
  { id: "xvip_allinone", name: "XVIP All In One Downloader" },
  { id: "xvip_stalkgame", name: "XVIP Stalk Game" },
  { id: "xvip_stalksosmed", name: "XVIP Stalk Sosmed" },
];

type TabKey = "overview" | "users" | "tools" | "chat" | "firebase" | "settings";

function formatUptime(sec: number): string {
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  return `${days}h ${hours}j ${mins}m`;
}

export default function OwnerPanelClient({
  initialUser,
  firebaseReady,
}: {
  initialUser: { username: string; role: "owner" | "admin" | "member"; email?: string } | null;
  firebaseReady: boolean;
}) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState<TabKey>("overview");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Login gate state (when unauthenticated)
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // Form states
  const [accUser, setAccUser] = useState("");
  const [accPass, setAccPass] = useState("");
  const [accRole, setAccRole] = useState<"member" | "admin" | "owner">("member");
  const [ownerEmailsText, setOwnerEmailsText] = useState("");

  const [toolName, setToolName] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [toolDesc, setToolDesc] = useState("");
  const [toolCat, setToolCat] = useState("telegram");

  const [replyText, setReplyText] = useState("");

  const [fbApiKey, setFbApiKey] = useState("");
  const [fbAuthDomain, setFbAuthDomain] = useState("");
  const [fbProjectId, setFbProjectId] = useState("");
  const [fbStorageBucket, setFbStorageBucket] = useState("");
  const [fbSenderId, setFbSenderId] = useState("");
  const [fbAppId, setFbAppId] = useState("");
  const [ytCookiesText, setYtCookiesText] = useState("");

  const [defaultTheme, setDefaultTheme] = useState<"hitam" | "abu" | "putih">("hitam");
  const [announcement, setAnnouncement] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [bgVideoUrl, setBgVideoUrl] = useState("");
  const [homeRotate, setHomeRotate] = useState(0);

  const flash = useCallback((type: "ok" | "err", text: string) => {
    setNotice({ type, text });
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        flash("err", json.error || "Gagal memuat data Owner Panel.");
        return;
      }
      setData(json as OverviewData);
      setOwnerEmailsText((json.ownerEmails || []).join("\n"));
      setFbApiKey(json.firebaseConfig?.apiKey || "");
      setFbAuthDomain(json.firebaseConfig?.authDomain || "");
      setFbProjectId(json.firebaseConfig?.projectId || "");
      setFbStorageBucket(json.firebaseConfig?.storageBucket || "");
      setFbSenderId(json.firebaseConfig?.messagingSenderId || "");
      setFbAppId(json.firebaseConfig?.appId || "");
      setDefaultTheme(json.settings?.defaultTheme || "hitam");
      setAnnouncement(json.settings?.announcement || "");
      setMaintenanceMode(Boolean(json.settings?.maintenanceMode));
      setBgVideoUrl(json.settings?.bgVideoUrl || "");
      setHomeRotate(Number(json.settings?.homeRotate || 0));
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Gagal terhubung ke VPS.");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("vip_theme");
      if (savedTheme && ["hitam", "abu", "putih"].includes(savedTheme)) {
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
    } catch {
      // ignore
    }
    if (user?.role === "owner") {
      loadOverview();
    }
  }, [user, loadOverview]);

  async function handleOwnerLocalLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        flash("err", json.error || "Login gagal.");
        return;
      }
      if (json.user?.role !== "owner") {
        flash("err", "Akun ini bukan akun Owner. Akses /owner ditolak.");
        setUser(json.user);
        return;
      }
      localStorage.setItem("vip_session", json.user.username);
      setUser(json.user);
      flash("ok", `Selamat datang, Owner ${json.user.username}.`);
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Gagal login.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleOwnerGoogleLogin() {
    setAuthBusy(true);
    setNotice(null);
    try {
      const logged = await signInWithGoogleFirebase();
      if (logged.role !== "owner") {
        flash("err", `Akun Google ${logged.email || logged.username} bukan Owner.`);
        setUser(logged);
        return;
      }
      localStorage.setItem("vip_session", logged.username);
      setUser(logged);
      flash("ok", `Login Google Owner berhasil (${logged.email}).`);
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Login Google gagal.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOutFirebaseQuietly();
    localStorage.removeItem("vip_session");
    setUser(null);
    setData(null);
    flash("ok", "Anda telah keluar dari sesi Owner.");
  }

  async function postOwner(endpoint: string, payload: Record<string, unknown>, okMsg: string) {
    setNotice(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        flash("err", json.error || "Aksi gagal dijalankan.");
        return false;
      }
      flash("ok", okMsg);
      await loadOverview();
      return true;
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Kesalahan jaringan VPS.");
      return false;
    }
  }

  // ===== UNAUTHENTICATED OR NON-OWNER GATE =====
  if (!user || user.role !== "owner") {
    return (
      <div className="owner-shell">
        <div className="owner-gate-card">
          <div className="owner-brand" style={{ marginBottom: "18px" }}>
            <span className="owner-monogram">MLM</span>
            <div>
              <h1 className="owner-title">Owner Control Panel</h1>
              <p className="owner-sub">Area khusus akun Owner (/owner)</p>
            </div>
          </div>

          {notice && (
            <div
              className={`owner-alert ${notice.type === "err" ? "is-err" : "is-ok"}`}
              role="alert"
            >
              {notice.text}
            </div>
          )}

          {user && user.role !== "owner" ? (
            <div className="owner-denied-box">
              <i className="fas fa-lock" aria-hidden="true" />
              <h2>Akses Ditolak (403)</h2>
              <p>
                Akun <strong>{user.username}</strong> memiliki role{" "}
                <strong>{user.role.toUpperCase()}</strong>. Halaman <code>/owner</code> hanya
                dapat dibuka oleh akun Owner.
              </p>
              <div className="owner-gate-actions">
                <Link href="/" className="v-btn">
                  <i className="fas fa-arrow-left" aria-hidden="true" /> Kembali ke Beranda
                </Link>
                <button type="button" className="v-btn v-btn-secondary" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt" aria-hidden="true" /> Ganti Akun
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="owner-sub" style={{ marginBottom: "16px" }}>
                Masuk dengan akun Owner untuk memantau server VPS, mengatur akun, mengisi
                konfigurasi Firebase Google Login, dan mengubah pengaturan situs.
              </p>
              <form onSubmit={handleOwnerLocalLogin}>
                <label htmlFor="gateUser" className="v-label">
                  Username Owner
                </label>
                <input
                  id="gateUser"
                  type="text"
                  className="v-input"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Username owner"
                  required
                />
                <label htmlFor="gatePass" className="v-label">
                  Password
                </label>
                <input
                  id="gatePass"
                  type="password"
                  className="v-input"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Password owner"
                  required
                />
                <button type="submit" className="v-btn" disabled={authBusy}>
                  <i className="fas fa-shield-halved" aria-hidden="true" />{" "}
                  {authBusy ? "Memverifikasi..." : "Masuk Owner Panel"}
                </button>
              </form>

              <div className="auth-divider">
                <span>ATAU</span>
              </div>

              <button
                type="button"
                className="btn-google-auth"
                onClick={handleOwnerGoogleLogin}
                disabled={authBusy}
              >
                <i className="fab fa-google" aria-hidden="true" />
                <span>Masuk Owner via Google Firebase</span>
                <span className="google-pill">{firebaseReady ? "Aktif" : "Belum Setup"}</span>
              </button>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <Link href="/" className="owner-inline-link">
                  <i className="fas fa-arrow-left" aria-hidden="true" /> Kembali ke Beranda
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ===== AUTHENTICATED OWNER CONSOLE =====
  return (
    <div className="owner-shell">
      <div className="owner-container">
        <header className="owner-topbar">
          <div className="owner-brand">
            <span className="owner-monogram">MLM</span>
            <div>
              <h1 className="owner-title">MattzLM Owner Panel</h1>
              <p className="owner-sub">
                Login sebagai <strong>{user.username}</strong> (OWNER) • Panel VPS
              </p>
            </div>
          </div>

          <div className="owner-top-actions">
            <button
              type="button"
              className="owner-nav-btn"
              onClick={loadOverview}
              disabled={loading}
            >
              <i className={`fas fa-rotate ${loading ? "spin" : ""}`} aria-hidden="true" /> Muat Ulang
            </button>
            <Link href="/" className="owner-nav-btn">
              <i className="fas fa-arrow-left" aria-hidden="true" /> Kembali ke Beranda
            </Link>
            <button type="button" className="owner-nav-btn is-danger" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt" aria-hidden="true" /> Keluar
            </button>
          </div>
        </header>

        {notice && (
          <div
            className={`owner-alert ${notice.type === "err" ? "is-err" : "is-ok"}`}
            role="status"
            aria-live="polite"
          >
            {notice.text}
          </div>
        )}

        <nav className="owner-tabs" role="tablist" aria-label="Menu Owner Panel">
          {(
            [
              ["overview", "fa-server", "VPS & Ringkasan"],
              ["users", "fa-users-cog", "Akun & Whitelist"],
              ["tools", "fa-toolbox", "Tools & Link VPS"],
              ["chat", "fa-comment-dots", "Chat Admin"],
              ["firebase", "fa-key", "Firebase & yt-dlp"],
              ["settings", "fa-sliders", "Pengaturan & Log"],
            ] as Array<[TabKey, string, string]>
          ).map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`owner-tab-btn ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              <i className={`fas ${icon}`} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        {!data ? (
          <section className="owner-card">
            <p className="owner-sub">Memuat data server VPS...</p>
          </section>
        ) : (
          <>
            {tab === "overview" && (
              <div className="owner-section-stack">
                <div className="owner-kpi-grid">
                  <div className="owner-kpi">
                    <span className="kpi-label">Total Akun</span>
                    <strong className="kpi-val">{data.users.length}</strong>
                    <span className="kpi-sub">
                      Google: {data.users.filter((u) => u.provider === "google").length}
                    </span>
                  </div>
                  <div className="owner-kpi">
                    <span className="kpi-label">RAM VPS</span>
                    <strong className="kpi-val">{data.vps.memPercent}%</strong>
                    <span className="kpi-sub">
                      {data.vps.memUsedMb} / {data.vps.memTotalMb} MB
                    </span>
                  </div>
                  <div className="owner-kpi">
                    <span className="kpi-label">Total Kunjungan</span>
                    <strong className="kpi-val">{data.settings.visits}</strong>
                    <span className="kpi-sub">
                      Shortlink: {data.shortLinks.length} • Paste: {data.pastes.length}
                    </span>
                  </div>
                  <div className="owner-kpi">
                    <span className="kpi-label">Status Integrasi</span>
                    <strong className="kpi-val">
                      {data.vps.firebaseReady ? "FIREBASE ON" : "LOKAL ONLY"}
                    </strong>
                    <span className="kpi-sub">yt-dlp {data.vps.ytDlpVersion}</span>
                  </div>
                </div>

                <section className="owner-card">
                  <div className="owner-card-head">
                    <h2>
                      <i className="fas fa-microchip" aria-hidden="true" /> Status Server Linux
                    </h2>
                    <span className="owner-pill">ONLINE</span>
                  </div>
                  <div className="owner-kv-grid">
                    <div className="owner-kv">
                      <span>Hostname</span>
                      <strong>{data.vps.hostname}</strong>
                    </div>
                    <div className="owner-kv">
                      <span>OS &amp; Kernel</span>
                      <strong>{data.vps.platform}</strong>
                    </div>
                    <div className="owner-kv">
                      <span>Node.js Runtime</span>
                      <strong>{data.vps.nodeVersion}</strong>
                    </div>
                    <div className="owner-kv">
                      <span>CPU / Load Avg</span>
                      <strong>
                        {data.vps.cpuCores} core • {data.vps.loadAvg.join(" / ")}
                      </strong>
                    </div>
                    <div className="owner-kv">
                      <span>Disk Root (/)</span>
                      <strong>{data.vps.diskSummary}</strong>
                    </div>
                    <div className="owner-kv">
                      <span>Uptime VPS</span>
                      <strong>{formatUptime(data.vps.uptimeSec)}</strong>
                    </div>
                    <div className="owner-kv">
                      <span>yt-dlp Cookies</span>
                      <strong>{data.vps.hasYtCookies ? "Terpasang" : "Belum diisi"}</strong>
                    </div>
                    <div className="owner-kv">
                      <span>Firebase Google Auth</span>
                      <strong>{data.vps.firebaseReady ? "Terkonfigurasi" : "Belum diisi"}</strong>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "users" && (
              <div className="owner-two-col">
                <section className="owner-card">
                  <div className="owner-card-head">
                    <h2>
                      <i className="fas fa-user-plus" aria-hidden="true" /> Buat / Ubah Akun &amp; Role
                    </h2>
                  </div>
                  <label htmlFor="ownAccUser" className="v-label">
                    Username
                  </label>
                  <input
                    id="ownAccUser"
                    className="v-input"
                    value={accUser}
                    onChange={(e) => setAccUser(e.target.value)}
                    placeholder="Contoh: pilot01"
                  />
                  <label htmlFor="ownAccPass" className="v-label">
                    Password (kosongkan jika hanya ubah role)
                  </label>
                  <input
                    id="ownAccPass"
                    type="password"
                    className="v-input"
                    value={accPass}
                    onChange={(e) => setAccPass(e.target.value)}
                    placeholder="Minimal 4 karakter"
                  />
                  <label htmlFor="ownAccRole" className="v-label">
                    Role
                  </label>
                  <select
                    id="ownAccRole"
                    className="v-input"
                    value={accRole}
                    onChange={(e) => setAccRole(e.target.value as "member" | "admin" | "owner")}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                    <option value="owner">owner</option>
                  </select>
                  <button
                    type="button"
                    className="v-btn"
                    onClick={async () => {
                      const ok = await postOwner(
                        "/api/owner/users",
                        { action: "saveUser", username: accUser, password: accPass, role: accRole },
                        `Akun ${accUser} disimpan.`
                      );
                      if (ok) {
                        setAccUser("");
                        setAccPass("");
                      }
                    }}
                  >
                    <i className="fas fa-user-check" aria-hidden="true" /> Simpan Akun
                  </button>

                  <hr className="owner-hr" />

                  <h3 className="settings-heading">
                    <i className="fab fa-google" aria-hidden="true" /> Whitelist Email Google Owner
                  </h3>
                  <p className="owner-sub" style={{ marginBottom: "10px" }}>
                    Email Google yang terdaftar di sini otomatis mendapat role{" "}
                    <strong>OWNER</strong> saat login via Firebase. Pisahkan per baris atau koma.
                  </p>
                  <textarea
                    className="v-input"
                    rows={3}
                    value={ownerEmailsText}
                    onChange={(e) => setOwnerEmailsText(e.target.value)}
                    placeholder="owner@gmail.com"
                  />
                  <button
                    type="button"
                    className="v-btn v-btn-secondary"
                    onClick={() =>
                      postOwner(
                        "/api/owner/users",
                        { action: "saveOwnerEmails", emails: ownerEmailsText },
                        "Daftar email Google Owner diperbarui."
                      )
                    }
                  >
                    <i className="fas fa-check" aria-hidden="true" /> Simpan Whitelist Email
                  </button>
                </section>

                <section className="owner-card">
                  <div className="owner-card-head">
                    <h2>
                      <i className="fas fa-users" aria-hidden="true" /> Daftar Akun ({data.users.length})
                    </h2>
                  </div>
                  <div className="owner-list-stack">
                    {data.users.map((u) => (
                      <div key={u.username} className="owner-list-row">
                        <div className="owner-list-main">
                          <strong>
                            {u.username}{" "}
                            <span className="owner-pill">{u.role.toUpperCase()}</span>{" "}
                            <span className="owner-pill">{u.provider.toUpperCase()}</span>
                          </strong>
                          <small>{u.email || "Akun lokal VPS"}</small>
                        </div>
                        {u.username === "matt" ? (
                          <span className="owner-pill">PRIMARY OWNER</span>
                        ) : (
                          <div className="owner-row-btns">
                            <button
                              type="button"
                              className="owner-mini-btn"
                              onClick={() => {
                                setAccUser(u.username);
                                setAccRole(u.role);
                                setAccPass("");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="owner-mini-btn is-danger"
                              onClick={() =>
                                postOwner(
                                  "/api/owner/users",
                                  { action: "deleteUser", username: u.username },
                                  `Akun ${u.username} dihapus.`
                                )
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {tab === "tools" && (
              <div className="owner-section-stack">
                <div className="owner-two-col">
                  <section className="owner-card">
                    <div className="owner-card-head">
                      <h2>
                        <i className="fas fa-plus-circle" aria-hidden="true" /> Tambah Tool Custom
                      </h2>
                    </div>
                    <label htmlFor="ownToolName" className="v-label">
                      Nama Tool
                    </label>
                    <input
                      id="ownToolName"
                      className="v-input"
                      value={toolName}
                      onChange={(e) => setToolName(e.target.value)}
                      placeholder="Contoh: Panel Monitor"
                    />
                    <label htmlFor="ownToolUrl" className="v-label">
                      URL Tool
                    </label>
                    <input
                      id="ownToolUrl"
                      type="url"
                      className="v-input"
                      value={toolUrl}
                      onChange={(e) => setToolUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                    <label htmlFor="ownToolDesc" className="v-label">
                      Deskripsi Singkat
                    </label>
                    <input
                      id="ownToolDesc"
                      className="v-input"
                      value={toolDesc}
                      onChange={(e) => setToolDesc(e.target.value)}
                      placeholder="Deskripsi singkat modul"
                    />
                    <label htmlFor="ownToolCat" className="v-label">
                      Kategori
                    </label>
                    <select
                      id="ownToolCat"
                      className="v-input"
                      value={toolCat}
                      onChange={(e) => setToolCat(e.target.value)}
                    >
                      <option value="telegram">Custom</option>
                      <option value="vps">VPS Server</option>
                      <option value="tools">Tools</option>
                      <option value="external">External</option>
                      <option value="extra">Extra</option>
                    </select>
                    <button
                      type="button"
                      className="v-btn"
                      onClick={async () => {
                        const ok = await postOwner(
                          "/api/owner/tools",
                          {
                            action: "addCustomTool",
                            name: toolName,
                            url: toolUrl,
                            desc: toolDesc,
                            category: toolCat,
                          },
                          `Tool "${toolName}" ditambahkan.`
                        );
                        if (ok) {
                          setToolName("");
                          setToolUrl("");
                          setToolDesc("");
                        }
                      }}
                    >
                      <i className="fas fa-plus" aria-hidden="true" /> Tambah Tool
                    </button>

                    <hr className="owner-hr" />
                    <h3 className="settings-heading">Tool Custom Aktif ({data.customTools.length})</h3>
                    <div className="owner-list-stack">
                      {data.customTools.length === 0 ? (
                        <p className="owner-sub">Belum ada tool custom.</p>
                      ) : (
                        data.customTools.map((t) => (
                          <div key={t.id} className="owner-list-row">
                            <div className="owner-list-main">
                              <strong>{t.name}</strong>
                              <small>{t.url}</small>
                            </div>
                            <button
                              type="button"
                              className="owner-mini-btn is-danger"
                              onClick={() =>
                                postOwner(
                                  "/api/owner/tools",
                                  { action: "deleteCustomTool", id: t.id },
                                  `Tool ${t.name} dihapus.`
                                )
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="owner-card">
                    <div className="owner-card-head">
                      <h2>
                        <i className="fas fa-eye" aria-hidden="true" /> Visibilitas Tool Bawaan
                      </h2>
                      <button
                        type="button"
                        className="owner-mini-btn"
                        onClick={() =>
                          postOwner(
                            "/api/owner/tools",
                            { action: "restoreTools" },
                            "Semua tool bawaan dipulihkan."
                          )
                        }
                      >
                        Pulihkan Semua
                      </button>
                    </div>
                    <div className="owner-list-stack" style={{ maxHeight: "420px", overflowY: "auto" }}>
                      {BUILTIN_TOOL_IDS.map((item) => {
                        const isHidden = data.hiddenTools.includes(item.id);
                        return (
                          <div key={item.id} className="owner-list-row">
                            <div className="owner-list-main">
                              <strong>{item.name}</strong>
                              <small>ID: {item.id}</small>
                            </div>
                            <button
                              type="button"
                              className={`owner-mini-btn ${isHidden ? "is-danger" : ""}`}
                              onClick={() =>
                                postOwner(
                                  "/api/owner/tools",
                                  { action: "toggleHiddenTool", toolId: item.id },
                                  isHidden ? `${item.name} ditampilkan.` : `${item.name} disembunyikan.`
                                )
                              }
                            >
                              {isHidden ? "Tersembunyi" : "Aktif"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <div className="owner-two-col">
                  <section className="owner-card">
                    <div className="owner-card-head">
                      <h2>
                        <i className="fas fa-link" aria-hidden="true" /> VPS Shortlinks ({data.shortLinks.length})
                      </h2>
                    </div>
                    <div className="owner-list-stack">
                      {data.shortLinks.length === 0 ? (
                        <p className="owner-sub">Belum ada shortlink tersimpan.</p>
                      ) : (
                        data.shortLinks.map((s) => (
                          <div key={s.code} className="owner-list-row">
                            <div className="owner-list-main">
                              <strong>
                                /s/{s.code} <span className="owner-pill">{s.clicks} klik</span>
                              </strong>
                              <small>{s.url}</small>
                            </div>
                            <button
                              type="button"
                              className="owner-mini-btn is-danger"
                              onClick={() =>
                                postOwner(
                                  "/api/owner/tools",
                                  { action: "deleteShortLink", code: s.code },
                                  `Shortlink /s/${s.code} dihapus.`
                                )
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="owner-card">
                    <div className="owner-card-head">
                      <h2>
                        <i className="fas fa-file-code" aria-hidden="true" /> VPS Pastes ({data.pastes.length})
                      </h2>
                    </div>
                    <div className="owner-list-stack">
                      {data.pastes.length === 0 ? (
                        <p className="owner-sub">Belum ada paste tersimpan.</p>
                      ) : (
                        data.pastes.map((p) => (
                          <div key={p.id} className="owner-list-row">
                            <div className="owner-list-main">
                              <strong>
                                {p.title} <span className="owner-pill">{p.views} view</span>
                              </strong>
                              <small>
                                /p/{p.id} • {p.lang} • oleh {p.createdBy}
                              </small>
                            </div>
                            <div className="owner-row-btns">
                              <Link href={`/p/${p.id}`} className="owner-mini-btn">
                                Buka
                              </Link>
                              <button
                                type="button"
                                className="owner-mini-btn is-danger"
                                onClick={() =>
                                  postOwner(
                                    "/api/owner/tools",
                                    { action: "deletePaste", id: p.id },
                                    `Paste /p/${p.id} dihapus.`
                                  )
                                }
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {tab === "chat" && (
              <section className="owner-card">
                <div className="owner-card-head">
                  <h2>
                    <i className="fas fa-comment-dots" aria-hidden="true" /> Moderasi &amp; Balas Chat User
                  </h2>
                  <div className="owner-row-btns">
                    <button
                      type="button"
                      className="owner-mini-btn"
                      onClick={() =>
                        postOwner(
                          "/api/owner/chat",
                          { action: "resetLimits" },
                          "Limit chat semua user direset ke 5."
                        )
                      }
                    >
                      Reset Limit Chat
                    </button>
                    <button
                      type="button"
                      className="owner-mini-btn is-danger"
                      onClick={() =>
                        postOwner(
                          "/api/owner/chat",
                          { action: "clearChat" },
                          "Riwayat chat dibersihkan."
                        )
                      }
                    >
                      Hapus Semua Chat
                    </button>
                  </div>
                </div>

                <div className="owner-chat-log">
                  {data.chatMessages.length === 0 ? (
                    <p className="owner-sub">Belum ada pesan chat.</p>
                  ) : (
                    data.chatMessages.map((m) => (
                      <div key={m.id} className={`owner-chat-item ${m.sender}`}>
                        <strong>
                          {m.sender === "admin" ? "Owner" : m.username}
                          <span>
                            {new Date(m.time).toLocaleString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </strong>
                        <p>{m.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="owner-reply-row">
                  <input
                    type="text"
                    className="v-input"
                    style={{ marginBottom: 0 }}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tulis balasan untuk user..."
                  />
                  <button
                    type="button"
                    className="v-btn"
                    style={{ width: "auto", minWidth: "150px" }}
                    onClick={async () => {
                      if (!replyText.trim()) return;
                      const ok = await postOwner(
                        "/api/owner/chat",
                        { action: "reply", text: replyText },
                        "Balasan Owner terkirim."
                      );
                      if (ok) setReplyText("");
                    }}
                  >
                    <i className="fas fa-paper-plane" aria-hidden="true" /> Kirim Balasan
                  </button>
                </div>
              </section>
            )}

            {tab === "firebase" && (
              <div className="owner-two-col">
                <section className="owner-card">
                  <div className="owner-card-head">
                    <h2>
                      <i className="fab fa-google" aria-hidden="true" /> Firebase Google Auth Config
                    </h2>
                    <span className="owner-pill">
                      {data.vps.firebaseReady ? "AKTIF" : "BELUM AKTIF"}
                    </span>
                  </div>
                  <p className="owner-sub" style={{ marginBottom: "14px" }}>
                    Masukkan kredensial Web App dari Firebase Console (Project Settings → Web App)
                    dan aktifkan Provider Google di Authentication → Sign-in method, lalu tambahkan
                    domain VPS ini di Authorized Domains.
                  </p>
                  <label htmlFor="fbApiKey" className="v-label">
                    API Key
                  </label>
                  <input
                    id="fbApiKey"
                    className="v-input"
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                  />
                  <label htmlFor="fbAuthDomain" className="v-label">
                    Auth Domain
                  </label>
                  <input
                    id="fbAuthDomain"
                    className="v-input"
                    value={fbAuthDomain}
                    onChange={(e) => setFbAuthDomain(e.target.value)}
                    placeholder="your-project.firebaseapp.com"
                  />
                  <label htmlFor="fbProjectId" className="v-label">
                    Project ID
                  </label>
                  <input
                    id="fbProjectId"
                    className="v-input"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="your-project-id"
                  />
                  <label htmlFor="fbStorageBucket" className="v-label">
                    Storage Bucket (Opsional)
                  </label>
                  <input
                    id="fbStorageBucket"
                    className="v-input"
                    value={fbStorageBucket}
                    onChange={(e) => setFbStorageBucket(e.target.value)}
                    placeholder="your-project.firebasestorage.app"
                  />
                  <label htmlFor="fbSenderId" className="v-label">
                    Messaging Sender ID (Opsional)
                  </label>
                  <input
                    id="fbSenderId"
                    className="v-input"
                    value={fbSenderId}
                    onChange={(e) => setFbSenderId(e.target.value)}
                    placeholder="1234567890"
                  />
                  <label htmlFor="fbAppId" className="v-label">
                    App ID
                  </label>
                  <input
                    id="fbAppId"
                    className="v-input"
                    value={fbAppId}
                    onChange={(e) => setFbAppId(e.target.value)}
                    placeholder="1:1234567890:web:abcdef..."
                  />
                  <button
                    type="button"
                    className="v-btn"
                    onClick={() =>
                      postOwner(
                        "/api/owner/settings",
                        {
                          action: "saveFirebase",
                          firebaseConfig: {
                            apiKey: fbApiKey,
                            authDomain: fbAuthDomain,
                            projectId: fbProjectId,
                            storageBucket: fbStorageBucket,
                            messagingSenderId: fbSenderId,
                            appId: fbAppId,
                          },
                        },
                        "Konfigurasi Firebase disimpan di VPS. Login Google langsung aktif."
                      )
                    }
                  >
                    <i className="fas fa-check" aria-hidden="true" /> Simpan Konfigurasi Firebase
                  </button>
                </section>

                <section className="owner-card">
                  <div className="owner-card-head">
                    <h2>
                      <i className="fas fa-download" aria-hidden="true" /> VPS yt-dlp Cookies (Opsional)
                    </h2>
                    <span className="owner-pill">
                      {data.vps.hasYtCookies ? "TERPASANG" : "KOSONG"}
                    </span>
                  </div>
                  <p className="owner-sub" style={{ marginBottom: "14px" }}>
                    Tempel isi Netscape <code>cookies.txt</code> untuk membuka unduhan YouTube HD
                    dan Instagram yang dibatasi anti-bot dari IP VPS. Kosongkan lalu simpan untuk
                    menghapus cookies.
                  </p>
                  <textarea
                    className="v-input"
                    rows={10}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem" }}
                    value={ytCookiesText}
                    onChange={(e) => setYtCookiesText(e.target.value)}
                    placeholder="# Netscape HTTP Cookie File..."
                  />
                  <button
                    type="button"
                    className="v-btn v-btn-secondary"
                    onClick={async () => {
                      const ok = await postOwner(
                        "/api/owner/settings",
                        { action: "saveYtCookies", cookiesText: ytCookiesText },
                        ytCookiesText.trim()
                          ? "File yt-dlp cookies.txt disimpan di VPS."
                          : "File cookies.txt dihapus dari VPS."
                      );
                      if (ok) setYtCookiesText("");
                    }}
                  >
                    <i className="fas fa-shield-halved" aria-hidden="true" /> Simpan Cookies ke VPS
                  </button>
                </section>
              </div>
            )}

            {tab === "settings" && (
              <div className="owner-two-col">
                <section className="owner-card">
                  <div className="owner-card-head">
                    <h2>
                      <i className="fas fa-sliders" aria-hidden="true" /> Pengaturan Global
                    </h2>
                  </div>
                  <label htmlFor="ownTheme" className="v-label">
                    Palet Tema Default (Monokrom)
                  </label>
                  <select
                    id="ownTheme"
                    className="v-input"
                    value={defaultTheme}
                    onChange={(e) => {
                      const next = e.target.value as "hitam" | "abu" | "putih";
                      setDefaultTheme(next);
                      document.documentElement.setAttribute("data-theme", next);
                      localStorage.setItem("vip_theme", next);
                    }}
                  >
                    <option value="hitam">Hitam (Monokrom Gelap)</option>
                    <option value="abu">Abu (Graphite)</option>
                    <option value="putih">Putih (Monokrom Terang)</option>
                  </select>

                  <label htmlFor="ownAnnouncement" className="v-label">
                    Teks Banner Pengumuman
                  </label>
                  <textarea
                    id="ownAnnouncement"
                    className="v-input"
                    rows={3}
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                  />

                  <label htmlFor="ownBgVideo" className="v-label">
                    URL Video Latar &amp; Visor
                  </label>
                  <input
                    id="ownBgVideo"
                    type="url"
                    className="v-input"
                    value={bgVideoUrl}
                    onChange={(e) => setBgVideoUrl(e.target.value)}
                  />

                  <label htmlFor="ownRotate" className="v-label">
                    Rotasi Video Visor (Derajat)
                  </label>
                  <select
                    id="ownRotate"
                    className="v-input"
                    value={homeRotate}
                    onChange={(e) => setHomeRotate(Number(e.target.value))}
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>

                  <label className="owner-check-row">
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                    />
                    <span>Aktifkan Mode Maintenance (hanya akun Owner yang bisa login)</span>
                  </label>

                  <button
                    type="button"
                    className="v-btn"
                    onClick={() =>
                      postOwner(
                        "/api/owner/settings",
                        {
                          action: "saveSettings",
                          defaultTheme,
                          announcement,
                          maintenanceMode,
                          bgVideoUrl,
                          homeRotate,
                        },
                        "Pengaturan global berhasil disimpan ke VPS."
                      )
                    }
                  >
                    <i className="fas fa-check" aria-hidden="true" /> Simpan Pengaturan
                  </button>
                </section>

                <section className="owner-card">
                  <div className="owner-card-head">
                    <h2>
                      <i className="fas fa-list" aria-hidden="true" /> Audit Log Aktivitas ({data.auditLogs.length})
                    </h2>
                  </div>
                  <div className="owner-list-stack" style={{ maxHeight: "460px", overflowY: "auto" }}>
                    {data.auditLogs.map((log) => (
                      <div key={log.id} className="owner-list-row">
                        <div className="owner-list-main">
                          <strong>
                            {log.action} <span className="owner-pill">{log.actor}</span>
                          </strong>
                          <small>{log.detail}</small>
                        </div>
                        <small className="owner-time-tag">
                          {new Date(log.time).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
