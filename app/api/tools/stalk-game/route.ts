import { NextRequest, NextResponse } from "next/server";

async function stalkRoblox(username: string) {
  const lookupRes = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    signal: AbortSignal.timeout(8000),
  });
  if (!lookupRes.ok) throw new Error(`Roblox API HTTP ${lookupRes.status}`);
  const lookupData = await lookupRes.json();
  const entry = lookupData?.data?.[0];
  if (!entry?.id) {
    throw new Error(`Username Roblox "${username}" tidak ditemukan.`);
  }
  const userId = entry.id;

  const [detailRes, followersRes, followingRes, friendsRes, thumbRes] = await Promise.all([
    fetch(`https://users.roblox.com/v1/users/${userId}`, { signal: AbortSignal.timeout(8000) }),
    fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`, { signal: AbortSignal.timeout(8000) }),
    fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`, { signal: AbortSignal.timeout(8000) }),
    fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`, { signal: AbortSignal.timeout(8000) }),
    fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=180x180&format=Png&isCircular=false`,
      { signal: AbortSignal.timeout(8000) }
    ),
  ]);

  const detail = detailRes.ok ? await detailRes.json() : {};
  const followers = followersRes.ok ? await followersRes.json() : {};
  const following = followingRes.ok ? await followingRes.json() : {};
  const friends = friendsRes.ok ? await friendsRes.json() : {};
  const thumb = thumbRes.ok ? await thumbRes.json() : {};

  return {
    game: "Roblox",
    id: String(userId),
    username: detail.name || entry.name,
    displayName: detail.displayName || entry.displayName,
    verified: Boolean(detail.hasVerifiedBadge || entry.hasVerifiedBadge),
    isBanned: Boolean(detail.isBanned),
    created: detail.created || "-",
    bio: detail.description || "-",
    avatar: thumb?.data?.[0]?.imageUrl || "",
    stats: {
      Followers: followers.count ?? "-",
      Following: following.count ?? "-",
      Friends: friends.count ?? "-",
    },
    profileUrl: `https://www.roblox.com/users/${userId}/profile`,
  };
}

async function stalkCodashop(game: "ml" | "ff", rawQuery: string) {
  let userId = rawQuery.trim();
  let zoneId = "";
  if (game === "ml") {
    const parts = rawQuery.split(/[|:\s/()-]+/).filter(Boolean);
    userId = parts[0] || "";
    zoneId = parts[1] || "";
    if (!userId || !zoneId) {
      throw new Error("Format Mobile Legends wajib ID|Zone. Contoh: 12345678|2015");
    }
  } else {
    userId = rawQuery.replace(/[^0-9]/g, "");
    if (!userId) throw new Error("Masukkan UID Free Fire berupa angka.");
  }

  const params = new URLSearchParams(
    game === "ml"
      ? {
          "voucherPricePoint.id": "27670",
          "voucherPricePoint.price": "1579",
          "voucherPricePoint.variablePrice": "0",
          "user.userId": userId,
          "user.zoneId": zoneId,
          voucherTypeName: "MOBILE_LEGENDS",
          shopLang: "id_ID",
        }
      : {
          "voucherPricePoint.id": "8050",
          "voucherPricePoint.price": "1000",
          "voucherPricePoint.variablePrice": "0",
          "user.userId": userId,
          voucherTypeName: "FREEFIRE",
          shopLang: "id_ID",
        }
  );

  const res = await fetch("https://order-sg.codashop.com/initPayment.action", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://www.codashop.com",
      Referer: "https://www.codashop.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: params,
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();

  const cf = data?.confirmationFields || {};
  const nickname = cf.username || cf.roles?.[0]?.role || "";
  if (data?.success && nickname) {
    return {
      game: game === "ml" ? "Mobile Legends" : "Free Fire",
      id: zoneId ? `${userId} (${zoneId})` : userId,
      username: decodeURIComponent(String(nickname)),
      displayName: decodeURIComponent(String(nickname)),
      verified: true,
      bio: `Region / Server: ${cf.country || "ID/SG"}`,
      stats: {
        Status: "Akun Ditemukan",
        Server: zoneId || "Global",
        Region: cf.country || "ID",
      },
    };
  }

  throw new Error(
    data?.errorMsg ||
      `Akun ${game === "ml" ? "Mobile Legends" : "Free Fire"} tidak ditemukan atau region dibatasi.`
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const game = String(body?.game || "roblox").toLowerCase();
    const query = String(body?.query || "").trim();

    if (!query) {
      return NextResponse.json({ ok: false, error: "Username atau ID game wajib diisi." }, { status: 400 });
    }

    if (game === "roblox") {
      const profile = await stalkRoblox(query);
      return NextResponse.json({ ok: true, profile });
    }
    if (game === "ml" || game === "ff") {
      const profile = await stalkCodashop(game, query);
      return NextResponse.json({ ok: true, profile });
    }

    return NextResponse.json({ ok: false, error: "Game tidak didukung." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengecek akun game di VPS.";
    return NextResponse.json({ ok: false, error: msg }, { status: 404 });
  }
}
