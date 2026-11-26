import { NextRequest, NextResponse } from "next/server";
import { requireXvipUser } from "@/lib/server/auth";

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function stalkGitHub(user: string) {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`, {
    headers: { "User-Agent": "MattzLM-Web/2.0", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  if (!res.ok || data.message === "Not Found") {
    throw new Error(`Akun GitHub @${user} tidak ditemukan.`);
  }
  return {
    platform: "GitHub",
    username: `@${data.login}`,
    displayName: data.name || data.login,
    avatar: data.avatar_url || "",
    bio: data.bio || "-",
    verified: Boolean(data.site_admin),
    profileUrl: data.html_url,
    stats: {
      Followers: data.followers ?? 0,
      Following: data.following ?? 0,
      "Public Repos": data.public_repos ?? 0,
      Lokasi: data.location || "-",
    },
  };
}

async function stalkTikTok(user: string) {
  const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(user)}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`TikTok mengembalikan HTTP ${res.status}`);
  const html = await res.text();

  const scriptMatch = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (scriptMatch?.[1]) {
    const parsed = JSON.parse(scriptMatch[1]);
    const userInfo = parsed?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;
    if (userInfo?.user) {
      const u = userInfo.user;
      const st = userInfo.stats || {};
      return {
        platform: "TikTok",
        username: `@${u.uniqueId || user}`,
        displayName: u.nickname || user,
        avatar: u.avatarMedium || u.avatarLarger || "",
        bio: u.signature || "-",
        verified: Boolean(u.verified),
        profileUrl: `https://www.tiktok.com/@${encodeURIComponent(u.uniqueId || user)}`,
        stats: {
          Followers: Number(st.followerCount || 0).toLocaleString("id-ID"),
          Following: Number(st.followingCount || 0).toLocaleString("id-ID"),
          Likes: Number(st.heartCount || st.heart || 0).toLocaleString("id-ID"),
          Video: Number(st.videoCount || 0).toLocaleString("id-ID"),
        },
      };
    }
  }

  // Regex fallback
  const nick = html.match(/"nickname":"([^"]+)"/)?.[1];
  const followers = html.match(/"followerCount":(\d+)/)?.[1];
  const sig = html.match(/"signature":"([^"]*)"/)?.[1];
  if (!nick) {
    throw new Error(`Akun TikTok @${user} tidak ditemukan atau privat.`);
  }
  return {
    platform: "TikTok",
    username: `@${user}`,
    displayName: nick,
    avatar: "",
    bio: sig || "-",
    verified: false,
    profileUrl: `https://www.tiktok.com/@${encodeURIComponent(user)}`,
    stats: {
      Followers: followers ? Number(followers).toLocaleString("id-ID") : "-",
    },
  };
}

async function stalkYouTube(user: string) {
  const handle = user.startsWith("@") ? user : `@${user}`;
  const res = await fetch(`https://www.youtube.com/${encodeURIComponent(handle)}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Channel YouTube ${handle} tidak ditemukan (HTTP ${res.status}).`);
  const html = await res.text();
  const title = decodeEntities(html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || "");
  const desc = decodeEntities(html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] || "-");
  const avatar = decodeEntities(html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || "");
  const subMatch =
    html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/) ||
    html.match(/"content":"([0-9.,]+[KMB]?\s+subscribers)"/i);
  const videoMatch = html.match(/"content":"([0-9.,]+[KMB]?\s+videos)"/i);

  if (!title) {
    throw new Error(`Channel YouTube ${handle} tidak ditemukan.`);
  }

  return {
    platform: "YouTube",
    username: handle,
    displayName: title,
    avatar,
    bio: desc || "-",
    verified: html.includes("BADGE_STYLE_TYPE_VERIFIED"),
    profileUrl: `https://www.youtube.com/${handle}`,
    stats: {
      Subscribers: subMatch?.[1] || "Tersembunyi",
      Videos: videoMatch?.[1] || "-",
    },
  };
}

async function stalkInstagram(user: string) {
  const clean = user.replace(/^@/, "");
  const res = await fetch(`https://www.instagram.com/${encodeURIComponent(clean)}/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });
  const html = await res.text();
  const ogTitle = decodeEntities(html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || "");
  const ogDesc = decodeEntities(html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || "");
  const ogImage = decodeEntities(html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || "");

  if (ogTitle && !/login|page not found/i.test(ogTitle)) {
    const counts = ogDesc.match(/([0-9.,]+[KMB]?)\s+Followers,\s+([0-9.,]+[KMB]?)\s+Following,\s+([0-9.,]+[KMB]?)\s+Posts/i);
    return {
      platform: "Instagram",
      username: `@${clean}`,
      displayName: ogTitle.split("(")[0].trim() || clean,
      avatar: ogImage ? `/api/tools/proxy?url=${encodeURIComponent(ogImage)}&filename=ig.jpg` : "",
      bio: ogDesc || "-",
      verified: false,
      profileUrl: `https://www.instagram.com/${encodeURIComponent(clean)}/`,
      stats: counts
        ? {
            Followers: counts[1],
            Following: counts[2],
            Posts: counts[3],
          }
        : { Info: "Profil publik terdeteksi" },
    };
  }

  throw new Error(
    `Instagram membatasi akses publik tanpa sesi login untuk @${clean}. Buka tautan profil langsung di instagram.com/${clean}.`
  );
}

export async function POST(req: NextRequest) {
  const { error } = await requireXvipUser();
  if (error) return error;

  try {
    const body = await req.json();
    const platform = String(body?.platform || "github").toLowerCase();
    const user = String(body?.username || "").trim().replace(/^@/, "");

    if (!user) {
      return NextResponse.json({ ok: false, error: "Username wajib diisi." }, { status: 400 });
    }

    let profile;
    if (platform === "github") profile = await stalkGitHub(user);
    else if (platform === "tiktok") profile = await stalkTikTok(user);
    else if (platform === "youtube") profile = await stalkYouTube(user);
    else if (platform === "instagram") profile = await stalkInstagram(user);
    else return NextResponse.json({ ok: false, error: "Platform tidak didukung." }, { status: 400 });

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengecek profil sosial media.";
    return NextResponse.json({ ok: false, error: msg }, { status: 404 });
  }
}
