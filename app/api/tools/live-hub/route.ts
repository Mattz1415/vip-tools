import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const WMO_ID: Record<number, string> = {
  0: "Cerah",
  1: "Cerah Berawan",
  2: "Berawan Sebagian",
  3: "Mendung",
  45: "Berkabut",
  48: "Kabut Tebal",
  51: "Gerimis Ringan",
  53: "Gerimis Sedang",
  55: "Gerimis Lebat",
  61: "Hujan Ringan",
  63: "Hujan Sedang",
  65: "Hujan Lebat",
  80: "Hujan Lokal Ringan",
  81: "Hujan Lokal Sedang",
  82: "Hujan Lokal Deras",
  95: "Hujan Petir",
  96: "Badai Petir",
  99: "Badai Petir Kuat",
};

const KHODAM_LIST = [
  { name: "Macan Putih Wi-Fi", element: "Sinyal 5G", rarity: "Mythic", desc: "Menjaga koneksi dan mood tetap stabil bahkan saat akhir bulan." },
  { name: "Naga Indosiar", element: "Api CGI", rarity: "Legend", desc: "Aura dramatis tingkat tinggi, bikin langkahmu selalu terasa sinematik." },
  { name: "Kucing Oren Barbar", element: "Chaos", rarity: "Epic", desc: "Berani ambil keputusan nekat, tapi entah kenapa sering hoki sendiri." },
  { name: "Kulkas 2 Pintu", element: "Es Dingin", rarity: "Epic", desc: "Pembawaan super santai dan dingin, susah dipancing emosi orang lain." },
  { name: "Tutup Tupperware Hilang", element: "Dimensi Lain", rarity: "Mythic", desc: "Misterius dan susah ditebak, sering bikin orang sekitar penasaran." },
  { name: "Garuda Sinyal Penuh", element: "Angin", rarity: "Legend", desc: "Fokus tajam dan punya intuisi kuat membaca peluang sebelum orang lain sadar." },
  { name: "Biawak Skaters", element: "Tanah", rarity: "Rare", desc: "Gesit beradaptasi di tongkrongan baru dan cepat akrab sama siapa saja." },
  { name: "Rice Cooker Mode Warm", element: "Hangat", rarity: "Rare", desc: "Selalu bikin suasana nyaman, tempat curhat paling aman buat teman." },
  { name: "Kura-Kura Turbo", element: "Air", rarity: "Epic", desc: "Kelihatannya santai, tapi begitu deadline mepet langsung ngebut beres." },
  { name: "Serigala Tengah Malam", element: "Bayangan", rarity: "Legend", desc: "Ide paling brilian justru muncul di atas jam 11 malam." },
  { name: "Sendal Swallow Kiri", element: "Legenda", rarity: "Rare", desc: "Tangguh menghadapi segala medan hidup, sederhana tapi tahan banting." },
  { name: "Burung Hantu Kopi Hitam", element: "Malam", rarity: "Epic", desc: "Pengamat yang teliti dan jago menyusun strategi tanpa banyak bicara." },
  { name: "Harimau Listrik", element: "Petir", rarity: "Mythic", desc: "Energi besar, cepat bertindak, dan punya karisma kuat di tim." },
  { name: "Lampu Disko Warnet", element: "Neon", rarity: "Epic", desc: "Pencair suasana paling ampuh setiap kali suasana lagi canggung." },
];

const PASARAN = [
  { name: "Legi", neptu: 5 },
  { name: "Pahing", neptu: 9 },
  { name: "Pon", neptu: 7 },
  { name: "Wage", neptu: 4 },
  { name: "Kliwon", neptu: 8 },
];

const HARI_JAWA = [
  { name: "Minggu", neptu: 5 },
  { name: "Senin", neptu: 4 },
  { name: "Selasa", neptu: 3 },
  { name: "Rabu", neptu: 7 },
  { name: "Kamis", neptu: 8 },
  { name: "Jumat", neptu: 6 },
  { name: "Sabtu", neptu: 9 },
];

function getZodiac(month: number, day: number): string {
  const ranges: Array<[number, number, string]> = [
    [1, 19, "Capricorn"], [2, 18, "Aquarius"], [3, 20, "Pisces"], [4, 19, "Aries"],
    [5, 20, "Taurus"], [6, 20, "Gemini"], [7, 22, "Cancer"], [8, 22, "Leo"],
    [9, 22, "Virgo"], [10, 22, "Libra"], [11, 21, "Scorpio"], [12, 21, "Sagittarius"],
  ];
  for (const [m, d, name] of ranges) {
    if (month === m && day <= d) return name;
    if (month === m && day > d) return ranges[m % 12][2];
  }
  return "Capricorn";
}

function calcWeton(isoDate: string) {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const targetUtc = Date.UTC(y, mo - 1, d);
  // Reference date: 1970-01-01 was Kamis Wage (pasaran index 3)
  const diffDays = Math.floor(targetUtc / 86_400_000);
  const hariIdx = ((4 + diffDays) % 7 + 7) % 7;
  const pasaranIdx = ((3 + diffDays) % 5 + 5) % 5;
  const hari = HARI_JAWA[hariIdx];
  const pas = PASARAN[pasaranIdx];
  return {
    weton: `${hari.name} ${pas.name}`,
    neptu: hari.neptu + pas.neptu,
    zodiac: getZodiac(mo, d),
  };
}

let cryptoCache: { ts: number; data: Record<string, unknown> } | null = null;
let fxCache: { ts: number; rates: Record<string, number> } | null = null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "").toLowerCase();

    // ===== 1. CARI LAGU, AUDIO PREVIEW 30 DETIK & LIRIK =====
    if (action === "music") {
      const query = String(body?.query || "").trim();
      if (!query) return NextResponse.json({ ok: false, error: "Masukkan judul lagu atau artis." }, { status: 400 });

      const [itRes, lrcRes] = await Promise.allSettled([
        fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=6`,
          { signal: AbortSignal.timeout(8000) }
        ).then((r) => (r.ok ? r.json() : null)),
        fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
          headers: { "User-Agent": "MattzLM-Web/2.0" },
          signal: AbortSignal.timeout(8000),
        }).then((r) => (r.ok ? r.json() : null)),
      ]);

      const rawTracks = itRes.status === "fulfilled" && Array.isArray(itRes.value?.results) ? itRes.value.results : [];
      const tracks = rawTracks.map((t: Record<string, unknown>) => ({
        title: String(t.trackName || "-"),
        artist: String(t.artistName || "-"),
        album: String(t.collectionName || "-"),
        cover: String(t.artworkUrl100 || "").replace("100x100", "300x300"),
        previewUrl: String(t.previewUrl || ""),
        durationSec: Math.round(Number(t.trackTimeMillis || 0) / 1000),
      }));

      const rawLyrics = lrcRes.status === "fulfilled" && Array.isArray(lrcRes.value) ? lrcRes.value : [];
      const bestLrc = rawLyrics.find((l: Record<string, unknown>) => l.plainLyrics) || rawLyrics[0] || null;
      const lyrics = bestLrc
        ? {
            trackName: String(bestLrc.trackName || query),
            artistName: String(bestLrc.artistName || "-"),
            albumName: String(bestLrc.albumName || "-"),
            plainLyrics: String(bestLrc.plainLyrics || bestLrc.syncedLyrics || "").slice(0, 6000),
          }
        : null;

      return NextResponse.json({ ok: true, query, tracks, lyrics });
    }

    // ===== 2. CARI ANIME (ANILIST GRAPHQL) =====
    if (action === "anime_search") {
      const query = String(body?.query || "").trim();
      if (!query) return NextResponse.json({ ok: false, error: "Masukkan judul anime." }, { status: 400 });

      const gql = `query ($search: String) {
        Page(perPage: 6) {
          media(search: $search, type: ANIME, isAdult: false) {
            id
            title { romaji english native }
            averageScore
            episodes
            status
            seasonYear
            genres
            description(asHtml: false)
            coverImage { large }
            siteUrl
          }
        }
      }`;

      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: gql, variables: { search: query } }),
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
      const json = await res.json();
      const media = Array.isArray(json?.data?.Page?.media) ? json.data.Page.media : [];
      const items = media.map((m: Record<string, unknown>) => {
        const t = (m.title || {}) as Record<string, string>;
        const c = (m.coverImage || {}) as Record<string, string>;
        return {
          title: t.english || t.romaji || "Untitled",
          romaji: t.romaji || "",
          score: m.averageScore ? `${m.averageScore}/100` : "N/A",
          episodes: m.episodes || "?",
          status: String(m.status || "-"),
          year: m.seasonYear || "-",
          genres: Array.isArray(m.genres) ? m.genres.slice(0, 4) : [],
          synopsis: String(m.description || "Sinopsis belum tersedia.")
            .replace(/<[^>]+>/g, "")
            .slice(0, 260),
          cover: c.large ? `/api/tools/proxy?url=${encodeURIComponent(c.large)}&filename=anime.jpg` : "",
          siteUrl: String(m.siteUrl || ""),
        };
      });
      return NextResponse.json({ ok: true, count: items.length, items });
    }

    // ===== 3. RANDOM ANIME ART (NEKOS.BEST SFW) =====
    if (action === "anime_art") {
      const allowed = new Set(["neko", "waifu", "husbando", "kitsune"]);
      const category = allowed.has(String(body?.category || "").toLowerCase())
        ? String(body?.category).toLowerCase()
        : "waifu";
      const res = await fetch(`https://nekos.best/api/v2/${category}`, {
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) throw new Error(`Nekos.best HTTP ${res.status}`);
      const j = await res.json();
      const item = j?.results?.[0];
      if (!item?.url) throw new Error("Gambar anime tidak tersedia saat ini.");
      return NextResponse.json({
        ok: true,
        category,
        artist: String(item.artist_name || "Unknown Artist"),
        sourceUrl: String(item.source_url || ""),
        imageUrl: `/api/tools/proxy?url=${encodeURIComponent(item.url)}&filename=${category}.png`,
        downloadUrl: `/api/tools/proxy?url=${encodeURIComponent(item.url)}&filename=${category}_${Date.now()}.png&download=1`,
      });
    }

    // ===== 4. INFO GEMPA BMKG INDONESIA LIVE =====
    if (action === "bmkg") {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
        Accept: "application/json",
      };
      try {
        const [autoRes, listRes] = await Promise.all([
          fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json", { headers, signal: AbortSignal.timeout(8000) }),
          fetch("https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json", { headers, signal: AbortSignal.timeout(8000) }),
        ]);
        if (autoRes.ok) {
          const autoJson = await autoRes.json();
          const g = autoJson?.Infogempa?.gempa;
          let recent: Array<Record<string, string>> = [];
          if (listRes.ok) {
            const listJson = await listRes.json();
            const arr = Array.isArray(listJson?.Infogempa?.gempa) ? listJson.Infogempa.gempa : [];
            recent = arr.slice(0, 6).map((x: Record<string, string>) => ({
              tanggal: `${x.Tanggal || ""} ${x.Jam || ""}`.trim(),
              magnitude: String(x.Magnitude || "-"),
              kedalaman: String(x.Kedalaman || "-"),
              wilayah: String(x.Wilayah || "-"),
              potensi: String(x.Potensi || "-"),
            }));
          }
          const shakeUrl = g?.Shakemap
            ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`
            : "";
          return NextResponse.json({
            ok: true,
            source: "BMKG Indonesia (TEWS Live)",
            latest: {
              tanggal: `${g?.Tanggal || ""} ${g?.Jam || ""}`.trim(),
              magnitude: String(g?.Magnitude || "-"),
              kedalaman: String(g?.Kedalaman || "-"),
              koordinat: `${g?.Lintang || ""} ${g?.Bujur || ""}`.trim(),
              wilayah: String(g?.Wilayah || "-"),
              potensi: String(g?.Potensi || "-"),
              dirasakan: String(g?.Dirasakan || "-"),
              shakemapUrl: shakeUrl
                ? `/api/tools/proxy?url=${encodeURIComponent(shakeUrl)}&filename=bmkg_shakemap.jpg`
                : "",
            },
            recent,
          });
        }
      } catch {
        // Fallback to USGS Indonesia bounding box
      }

      const usgsRes = await fetch(
        "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=-12&maxlatitude=7&minlongitude=94&maxlongitude=142&limit=6&orderby=time",
        { signal: AbortSignal.timeout(8000) }
      );
      if (!usgsRes.ok) throw new Error("Gagal memuat data gempa.");
      const usgs = await usgsRes.json();
      const feats = Array.isArray(usgs?.features) ? usgs.features : [];
      const first = feats[0];
      return NextResponse.json({
        ok: true,
        source: "USGS Wilayah Indonesia (Fallback)",
        latest: {
          tanggal: first ? new Date(first.properties.time).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "-",
          magnitude: String(first?.properties?.mag ?? "-"),
          kedalaman: `${Math.round(first?.geometry?.coordinates?.[2] || 0)} km`,
          koordinat: `${first?.geometry?.coordinates?.[1]}, ${first?.geometry?.coordinates?.[0]}`,
          wilayah: String(first?.properties?.place || "-"),
          potensi: "Cek info resmi BMKG",
          dirasakan: "-",
          shakemapUrl: "",
        },
        recent: feats.slice(1, 6).map((f: Record<string, Record<string, unknown>>) => ({
          tanggal: new Date(Number(f.properties.time)).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
          magnitude: String(f.properties.mag ?? "-"),
          kedalaman: `${Math.round((f.geometry.coordinates as number[])?.[2] || 0)} km`,
          wilayah: String(f.properties.place || "-"),
          potensi: "-",
        })),
      });
    }

    // ===== 5. PRAKIRAAN CUACA KOTA INDONESIA (OPEN-METEO + PRESET KOORDINAT) =====
    if (action === "weather") {
      const city = String(body?.city || "Jakarta").trim().slice(0, 60);
      const presetCities: Record<string, { name: string; admin1: string; latitude: number; longitude: number }> = {
        jakarta: { name: "Jakarta", admin1: "DKI Jakarta", latitude: -6.2146, longitude: 106.8451 },
        bandung: { name: "Bandung", admin1: "Jawa Barat", latitude: -6.9175, longitude: 107.6191 },
        surabaya: { name: "Surabaya", admin1: "Jawa Timur", latitude: -7.2575, longitude: 112.7521 },
        medan: { name: "Medan", admin1: "Sumatera Utara", latitude: 3.5952, longitude: 98.6722 },
        yogyakarta: { name: "Yogyakarta", admin1: "DI Yogyakarta", latitude: -7.7956, longitude: 110.3695 },
        jogja: { name: "Yogyakarta", admin1: "DI Yogyakarta", latitude: -7.7956, longitude: 110.3695 },
        semarang: { name: "Semarang", admin1: "Jawa Tengah", latitude: -6.9667, longitude: 110.4167 },
        makassar: { name: "Makassar", admin1: "Sulawesi Selatan", latitude: -5.1477, longitude: 119.4327 },
        denpasar: { name: "Denpasar", admin1: "Bali", latitude: -8.6705, longitude: 115.2126 },
        bali: { name: "Denpasar", admin1: "Bali", latitude: -8.6705, longitude: 115.2126 },
        palembang: { name: "Palembang", admin1: "Sumatera Selatan", latitude: -2.9761, longitude: 104.7754 },
        malang: { name: "Malang", admin1: "Jawa Timur", latitude: -7.9666, longitude: 112.6326 },
        bogor: { name: "Bogor", admin1: "Jawa Barat", latitude: -6.5971, longitude: 106.806 },
        depok: { name: "Depok", admin1: "Jawa Barat", latitude: -6.4025, longitude: 106.7942 },
        bekasi: { name: "Bekasi", admin1: "Jawa Barat", latitude: -6.2383, longitude: 106.9756 },
        tangerang: { name: "Tangerang", admin1: "Banten", latitude: -6.1783, longitude: 106.6319 },
        solo: { name: "Surakarta", admin1: "Jawa Tengah", latitude: -7.5755, longitude: 110.8243 },
        balikpapan: { name: "Balikpapan", admin1: "Kalimantan Timur", latitude: -1.2379, longitude: 116.8529 },
      };

      let loc: { name: string; admin1?: string; country?: string; latitude: number; longitude: number } | undefined =
        presetCities[city.toLowerCase()];

      if (!loc) {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id`,
          { signal: AbortSignal.timeout(12000) }
        );
        if (!geoRes.ok) throw new Error("Gagal mencari koordinat kota.");
        const geo = await geoRes.json();
        loc = geo?.results?.[0];
      }
      if (!loc) return NextResponse.json({ ok: false, error: `Kota '${city}' tidak ditemukan.` }, { status: 404 });

      const fcRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=4`,
        { signal: AbortSignal.timeout(12000) }
      );
      if (!fcRes.ok) throw new Error("Gagal memuat prakiraan cuaca.");
      const fc = await fcRes.json();
      const cur = fc.current || {};
      const daily = (fc.daily?.time || []).map((dt: string, i: number) => ({
        date: dt,
        min: fc.daily.temperature_2m_min?.[i],
        max: fc.daily.temperature_2m_max?.[i],
        rainProb: fc.daily.precipitation_probability_max?.[i] ?? 0,
        condition: WMO_ID[Number(fc.daily.weather_code?.[i])] || "Berawan",
      }));

      return NextResponse.json({
        ok: true,
        location: `${loc.name}, ${loc.admin1 || loc.country || ""}`.replace(/,\s*$/, ""),
        timezone: fc.timezone || "Asia/Jakarta",
        current: {
          tempC: cur.temperature_2m,
          feelsLikeC: cur.apparent_temperature,
          humidity: cur.relative_humidity_2m,
          windKmh: cur.wind_speed_10m,
          condition: WMO_ID[Number(cur.weather_code)] || "Berawan",
        },
        daily,
      });
    }

    // ===== 6. JADWAL SHOLAT KEMENAG RI (MYQURAN API) =====
    if (action === "sholat") {
      const city = String(body?.city || "Jakarta").trim().slice(0, 50);
      const cariRes = await fetch(
        `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(city)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!cariRes.ok) throw new Error("Gagal mencari kota jadwal sholat.");
      const cari = await cariRes.json();
      const firstCity = Array.isArray(cari?.data) ? cari.data[0] : null;
      if (!firstCity?.id) {
        return NextResponse.json({ ok: false, error: `Kota '${city}' tidak ditemukan di daftar Kemenag RI.` }, { status: 404 });
      }
      const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
      const y = nowWib.getUTCFullYear();
      const m = String(nowWib.getUTCMonth() + 1).padStart(2, "0");
      const d = String(nowWib.getUTCDate()).padStart(2, "0");

      const jRes = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${firstCity.id}/${y}/${m}/${d}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!jRes.ok) throw new Error("Gagal memuat jadwal sholat hari ini.");
      const j = await jRes.json();
      return NextResponse.json({
        ok: true,
        lokasi: j?.data?.lokasi || firstCity.lokasi,
        daerah: j?.data?.daerah || "-",
        jadwal: j?.data?.jadwal || {},
      });
    }

    // ===== 7. AL-QURAN DIGITAL INDONESIA (EQURAN.ID) =====
    if (action === "quran") {
      const surah = Math.min(114, Math.max(1, Math.round(Number(body?.surah || 1))));
      const res = await fetch(`https://equran.id/api/v2/surat/${surah}`, { signal: AbortSignal.timeout(9000) });
      if (!res.ok) throw new Error(`Gagal memuat Surah #${surah}.`);
      const j = await res.json();
      const d = j?.data;
      if (!d) throw new Error("Data surah tidak ditemukan.");
      const ayat = Array.isArray(d.ayat)
        ? d.ayat.slice(0, 25).map((a: Record<string, unknown>) => ({
            nomor: a.nomorAyat,
            arab: String(a.teksArab || ""),
            latin: String(a.teksLatin || ""),
            arti: String(a.teksIndonesia || ""),
          }))
        : [];
      return NextResponse.json({
        ok: true,
        nomor: d.nomor,
        nama: d.nama,
        namaLatin: d.namaLatin,
        arti: d.arti,
        jumlahAyat: d.jumlahAyat,
        tempatTurun: d.tempatTurun,
        audioFull: d.audioFull?.["05"] || d.audioFull?.["01"] || "",
        ayat,
        truncated: Array.isArray(d.ayat) && d.ayat.length > 25,
      });
    }

    // ===== 8. HARGA KRIPTO & KURS LIVE (IDR/USD) =====
    if (action === "crypto") {
      const amount = Math.max(0, Number(body?.amount || 100));
      const from = String(body?.from || "USD").toUpperCase();
      const to = String(body?.to || "IDR").toUpperCase();

      let coins: Array<{ id: string; symbol: string; idr: number; usd: number; change24h: number }> = [];
      const now = Date.now();
      if (cryptoCache && now - cryptoCache.ts < 60_000) {
        coins = cryptoCache.data.coins as typeof coins;
      } else {
        try {
          const cgRes = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether,toncoin,binancecoin,dogecoin&vs_currencies=idr,usd&include_24hr_change=true",
            { signal: AbortSignal.timeout(8000) }
          );
          if (cgRes.ok) {
            const cg = await cgRes.json();
            const mapMeta: Array<[string, string]> = [
              ["bitcoin", "BTC"],
              ["ethereum", "ETH"],
              ["solana", "SOL"],
              ["tether", "USDT"],
              ["toncoin", "TON"],
              ["binancecoin", "BNB"],
              ["dogecoin", "DOGE"],
            ];
            coins = mapMeta
              .filter(([id]) => cg[id])
              .map(([id, symbol]) => ({
                id,
                symbol,
                idr: Number(cg[id].idr || 0),
                usd: Number(cg[id].usd || 0),
                change24h: Number((cg[id].usd_24h_change || 0).toFixed(2)),
              }));
            cryptoCache = { ts: now, data: { coins } };
          }
        } catch {
          // ignore
        }
      }

      let rates: Record<string, number> = {
        USD: 1, IDR: 16200, EUR: 0.92, SGD: 1.34, MYR: 4.42, JPY: 152, GBP: 0.79, AUD: 1.53,
      };
      if (fxCache && now - fxCache.ts < 1_800_000) {
        rates = fxCache.rates;
      } else {
        try {
          const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(7000) });
          if (fxRes.ok) {
            const fxJson = await fxRes.json();
            if (fxJson?.rates?.IDR) {
              rates = fxJson.rates;
              fxCache = { ts: now, rates };
            }
          }
        } catch {
          // fallback rates
        }
      }

      const fromRate = rates[from] || 1;
      const toRate = rates[to] || 1;
      const converted = Number(((amount / fromRate) * toRate).toFixed(2));

      return NextResponse.json({
        ok: true,
        coins,
        fx: { amount, from, to, converted, unitRate: Number((toRate / fromRate).toFixed(4)) },
      });
    }

    // ===== 9. CEK KHODAM & AURA NAMA =====
    if (action === "khodam") {
      const name = String(body?.name || "").trim().slice(0, 50);
      const reroll = Number(body?.reroll || 0);
      if (!name) return NextResponse.json({ ok: false, error: "Masukkan nama terlebih dahulu." }, { status: 400 });
      const digest = crypto.createHash("sha256").update(`${name.toLowerCase()}::${reroll}`).digest();
      const idx = digest[0] % KHODAM_LIST.length;
      const power = 62 + (digest[1] % 38);
      const chosen = KHODAM_LIST[idx];
      return NextResponse.json({
        ok: true,
        name,
        khodam: chosen.name,
        element: chosen.element,
        rarity: chosen.rarity,
        power,
        description: chosen.desc,
      });
    }

    // ===== 10. CEK KECOCOKAN, ZODIAK & WETON JAWA =====
    if (action === "jodoh") {
      const name1 = String(body?.name1 || "").trim().slice(0, 40);
      const name2 = String(body?.name2 || "").trim().slice(0, 40);
      const dob1 = String(body?.dob1 || "").trim();
      const dob2 = String(body?.dob2 || "").trim();
      if (!name1 || !name2) {
        return NextResponse.json({ ok: false, error: "Masukkan kedua nama terlebih dahulu." }, { status: 400 });
      }
      const pairKey = [name1.toLowerCase(), name2.toLowerCase()].sort().join("::");
      const digest = crypto.createHash("sha256").update(pairKey).digest();
      const score = 55 + (digest[0] % 45);

      const w1 = dob1 ? calcWeton(dob1) : null;
      const w2 = dob2 ? calcWeton(dob2) : null;
      const wetonSum = w1 && w2 ? w1.neptu + w2.neptu : null;
      const wetonSisa = wetonSum !== null ? wetonSum % 7 : null;
      const wetonReadings = [
        "Wasesa Segara (Rezeki luas & pemaaf)",
        "Tunggak Semi (Rezeki terus tumbuh)",
        "Satria Wibawa (Dihormati & rukun)",
        "Sumur Sinaba (Jadi panutan sekitar)",
        "Satria Wirang (Perlu saling jaga komunikasi)",
        "Bumi Kapetak (Kuat & pekerja keras)",
        "Lebu Katiup Angin (Perlu konsisten & sabar)",
      ];

      const verdict =
        score >= 88
          ? "Cocok Banget! Frekuensi kalian nyambung dan saling melengkapi."
          : score >= 74
            ? "Chemistry Kuat! Tinggal jaga komunikasi biar makin langgeng."
            : "Potensi Bagus! Saling mengerti karakter bikin hubungan makin seru.";

      return NextResponse.json({
        ok: true,
        name1,
        name2,
        score,
        verdict,
        person1: w1,
        person2: w2,
        wetonSummary:
          wetonSum !== null && wetonSisa !== null
            ? { totalNeptu: wetonSum, makna: wetonReadings[wetonSisa] }
            : null,
      });
    }

    return NextResponse.json({ ok: false, error: `Action '${action}' tidak dikenal.` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memproses layanan live.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
