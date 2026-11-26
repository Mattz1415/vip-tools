// Monochrome 3D Orthographic Earth Globe Engine for MattzLM
// Zero external dependencies, HiDPI Canvas 2D, strictly achromatic (hitam / abu / putih)

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export const GLOBE_HUBS = [
  { id: 'jakarta', code: 'JKT', name: 'Jakarta', regionLabel: 'Nusantara', lat: -6.2, lon: 106.85 },
  { id: 'singapore', code: 'SGP', name: 'Singapura', regionLabel: 'Asia Tenggara', lat: 1.35, lon: 103.82 },
  { id: 'tokyo', code: 'TYO', name: 'Tokyo', regionLabel: 'Asia Timur', lat: 35.68, lon: 139.69 },
  { id: 'london', code: 'LDN', name: 'London', regionLabel: 'Eropa Barat', lat: 51.51, lon: -0.13 },
  { id: 'frankfurt', code: 'FRA', name: 'Frankfurt', regionLabel: 'Eropa Tengah', lat: 50.11, lon: 8.68 },
  { id: 'newyork', code: 'NYC', name: 'New York', regionLabel: 'Amerika Utara', lat: 40.71, lon: -74.01 },
  { id: 'sydney', code: 'SYD', name: 'Sydney', regionLabel: 'Oseania', lat: -33.87, lon: 151.21 },
  { id: 'saopaulo', code: 'GRU', name: 'Sao Paulo', regionLabel: 'Amerika Selatan', lat: -23.55, lon: -46.63 }
];

export const GLOBE_ARCS = [
  ['jakarta', 'tokyo'],
  ['jakarta', 'london'],
  ['jakarta', 'sydney'],
  ['singapore', 'frankfurt'],
  ['tokyo', 'newyork'],
  ['london', 'newyork'],
  ['newyork', 'saopaulo'],
  ['frankfurt', 'tokyo']
];

// Simplified world landmass polygons [lon, lat] covering all continents + Nusantara archipelago
const RAW_LANDMASSES = [
  // North America
  [
    [-168, 66], [-162, 70], [-141, 70], [-126, 70], [-110, 68], [-94, 64], [-82, 63],
    [-78, 53], [-66, 58], [-56, 52], [-64, 45], [-70, 42], [-75, 36], [-81, 25],
    [-83, 30], [-90, 29], [-97, 26], [-96, 19], [-88, 21], [-83, 15], [-84, 10],
    [-78, 8], [-82, 8], [-86, 11], [-92, 15], [-104, 19], [-110, 24], [-114, 31],
    [-117, 33], [-123, 38], [-124, 48], [-131, 55], [-141, 60], [-152, 60], [-162, 56],
    [-166, 61]
  ],
  // Greenland
  [
    [-44, 60], [-36, 65], [-22, 71], [-18, 81], [-36, 83], [-56, 81], [-68, 76], [-54, 68]
  ],
  // Cuba
  [
    [-85, 22], [-79, 23], [-74, 20], [-77, 20], [-82, 21]
  ],
  // South America
  [
    [-78, 9], [-72, 12], [-62, 10], [-51, 2], [-35, -6], [-38, -14], [-41, -22],
    [-49, -28], [-55, -35], [-63, -41], [-66, -50], [-68, -55], [-74, -52],
    [-73, -42], [-71, -30], [-70, -18], [-77, -12], [-81, -5], [-79, 2]
  ],
  // Africa
  [
    [-17, 15], [-16, 22], [-9, 31], [-5, 36], [3, 37], [11, 37], [12, 32], [20, 32],
    [32, 31], [35, 24], [40, 15], [44, 11], [51, 11], [47, 4], [41, -2], [40, -11],
    [35, -18], [33, -26], [26, -34], [18, -34], [14, -22], [12, -12], [9, -2],
    [9, 4], [2, 6], [-8, 5], [-14, 10]
  ],
  // Madagascar
  [
    [49, -12], [50, -16], [47, -25], [44, -25], [44, -18], [47, -14]
  ],
  // Eurasia (Europe + Asia mainland)
  [
    [-9, 37], [-9, 43], [-2, 43], [-4, 48], [2, 51], [8, 54], [10, 57], [13, 54],
    [20, 55], [24, 60], [30, 60], [40, 66], [52, 68], [68, 70], [82, 73], [104, 77],
    [126, 73], [148, 71], [170, 69], [178, 65], [164, 60], [156, 51], [142, 54],
    [136, 44], [129, 35], [126, 38], [122, 40], [118, 38], [122, 31], [120, 24],
    [113, 22], [108, 21], [109, 12], [104, 10], [100, 13], [103, 2], [100, 6],
    [98, 16], [92, 22], [87, 22], [80, 14], [77, 8], [73, 19], [68, 24], [61, 25],
    [56, 26], [50, 29], [56, 23], [59, 22], [52, 16], [44, 13], [39, 21], [35, 29],
    [35, 36], [27, 37], [26, 41], [29, 41], [41, 41], [39, 46], [30, 46], [24, 38],
    [20, 39], [14, 45], [18, 40], [13, 41], [9, 44], [3, 43], [-1, 37], [-6, 36]
  ],
  // Scandinavia
  [
    [5, 60], [10, 64], [18, 69], [28, 71], [31, 69], [28, 65], [22, 60], [18, 59],
    [14, 56], [11, 58], [8, 58]
  ],
  // UK & Ireland
  [
    [-6, 50], [-5, 55], [-5, 58], [-2, 58], [1, 53], [1, 51], [-3, 50]
  ],
  [
    [-10, 52], [-9, 55], [-6, 55], [-6, 52]
  ],
  // Iceland
  [
    [-24, 64], [-22, 66], [-14, 66], [-15, 64]
  ],
  // Sri Lanka
  [
    [80, 9.6], [81.8, 7.6], [80.6, 6.0], [79.8, 7.2]
  ],
  // Taiwan
  [
    [120.2, 22.0], [121.6, 25.2], [121.9, 24.4], [120.9, 22.0]
  ],
  // Japan (Honshu + Hokkaido + Kyushu simplified)
  [
    [130, 31], [131, 34], [136, 34], [140, 36], [141, 41], [139, 40], [136, 36], [131, 34]
  ],
  [
    [140, 42], [142, 45], [145, 44], [144, 42]
  ],
  // Philippines
  [
    [120, 14], [120, 18.5], [122.4, 18.3], [123.5, 13.5], [121.5, 13]
  ],
  [
    [122, 7], [124.5, 9.6], [126.4, 8.6], [125.6, 6.0], [123.8, 6.8]
  ],
  // Indonesia: Sumatra
  [
    [95.3, 5.5], [98.6, 3.8], [101.8, 1.5], [104.5, -1.6], [105.8, -5.8],
    [104.0, -5.6], [101.2, -2.5], [98.0, 1.0], [95.4, 4.4]
  ],
  // Indonesia: Java + Bali/Nusa Tenggara chain
  [
    [105.3, -6.3], [108.5, -6.7], [112.5, -7.1], [114.5, -7.9], [114.3, -8.7],
    [110.5, -8.1], [106.4, -7.4]
  ],
  [
    [114.6, -8.3], [119.5, -8.5], [123.5, -9.8], [122.0, -10.5], [116.5, -8.9]
  ],
  // Indonesia: Kalimantan / Borneo
  [
    [109.0, 1.5], [112.0, 3.0], [116.5, 6.8], [118.8, 5.0], [117.8, 1.2],
    [116.2, -3.5], [112.0, -3.2], [109.2, -1.5]
  ],
  // Indonesia: Sulawesi
  [
    [119.2, -5.5], [120.5, -3.5], [122.4, -4.4], [122.8, -3.2], [121.5, -1.8],
    [125.0, 1.4], [124.2, 1.6], [120.8, 0.8], [119.4, -0.8], [118.8, -3.4]
  ],
  // Papua / New Guinea
  [
    [131.0, -1.2], [134.5, -1.0], [138.0, -2.2], [142.5, -3.2], [147.0, -6.4],
    [150.6, -10.2], [147.5, -9.6], [142.0, -9.0], [138.2, -8.2], [134.8, -4.2], [131.5, -2.8]
  ],
  // Australia
  [
    [114, -22], [122, -17], [131, -12], [136, -12], [136, -15], [141, -17],
    [142.5, -11], [146, -18], [153, -27], [150, -37], [144, -38], [138, -35],
    [131, -31], [123, -34], [115, -34], [113, -26]
  ],
  // Tasmania
  [
    [144.8, -40.8], [148.2, -41.0], [147.2, -43.5], [145.4, -42.5]
  ],
  // New Zealand
  [
    [173, -35], [178, -37.7], [175.5, -41.3], [174.0, -39.5]
  ],
  [
    [171, -41.5], [174, -41.8], [170.5, -46.0], [167, -46.2], [169, -43.5]
  ],
  // Antarctica
  [
    [-180, -73], [-140, -74], [-100, -72], [-64, -65], [-55, -72], [-20, -71],
    [20, -70], [60, -68], [100, -67], [140, -67], [175, -73], [180, -73],
    [180, -86], [-180, -86]
  ]
];

function pointInPolygon(lon, lat, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = (yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function latLonToVec3(latDeg, lonDeg) {
  const phi = latDeg * DEG2RAD;
  const lambda = lonDeg * DEG2RAD;
  const cosPhi = Math.cos(phi);
  return {
    x: cosPhi * Math.sin(lambda),
    y: Math.sin(phi),
    z: cosPhi * Math.cos(lambda)
  };
}

function subdividePolygon(poly, maxStepDeg = 4) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dLon = b[0] - a[0];
    const dLat = b[1] - a[1];
    const dist = Math.hypot(dLon, dLat);
    const steps = Math.max(1, Math.ceil(dist / maxStepDeg));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push(latLonToVec3(a[1] + dLat * t, a[0] + dLon * t));
    }
  }
  return out;
}

let cachedGeometry = null;

function getEarthGeometry() {
  if (cachedGeometry) return cachedGeometry;

  const polyMeta = RAW_LANDMASSES.map((poly) => {
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const [lon, lat] of poly) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return { poly, minLon, maxLon, minLat, maxLat };
  });

  const isLand = (lon, lat) => {
    for (let i = 0; i < polyMeta.length; i++) {
      const m = polyMeta[i];
      if (lon < m.minLon || lon > m.maxLon || lat < m.minLat || lat > m.maxLat) continue;
      if (pointInPolygon(lon, lat, m.poly)) return true;
    }
    return false;
  };

  // Precompute Fibonacci spherical lattice land dots (even area density, zero polar bunching)
  const landDots = [];
  const totalSamples = 4200;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < totalSamples; i++) {
    const y = 1 - (i / (totalSamples - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    const lat = Math.asin(Math.max(-1, Math.min(1, y))) * RAD2DEG;
    const lon = Math.atan2(x, z) * RAD2DEG;
    if (isLand(lon, lat)) {
      landDots.push({ x, y, z, s: 0.85 + ((i * 37) % 10) * 0.035 });
    }
  }

  // Subdivided 3D coastline loops for crisp vector outlines
  const coastlines = RAW_LANDMASSES.map((poly) => subdividePolygon(poly, 4.2));

  // Precompute hub 3D vectors
  const hubs = GLOBE_HUBS.map((h) => ({
    ...h,
    vec: latLonToVec3(h.lat, h.lon)
  }));

  const hubMap = new Map(hubs.map((h) => [h.id, h]));

  // Precompute elevated geodesic arcs between hubs
  const arcs = GLOBE_ARCS.map(([fromId, toId], idx) => {
    const a = hubMap.get(fromId);
    const b = hubMap.get(toId);
    if (!a || !b) return null;
    const dot = Math.max(-1, Math.min(1, a.vec.x * b.vec.x + a.vec.y * b.vec.y + a.vec.z * b.vec.z));
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega) || 1;
    const segments = 32;
    const points = [];
    const maxLift = 0.08 + Math.min(0.14, omega * 0.065);
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const wA = Math.sin((1 - t) * omega) / sinOmega;
      const wB = Math.sin(t * omega) / sinOmega;
      const lift = 1 + Math.sin(Math.PI * t) * maxLift;
      points.push({
        x: (a.vec.x * wA + b.vec.x * wB) * lift,
        y: (a.vec.y * wA + b.vec.y * wB) * lift,
        z: (a.vec.z * wA + b.vec.z * wB) * lift
      });
    }
    return { fromId, toId, points, phase: (idx * 0.17) % 1, speed: 0.14 + (idx % 3) * 0.035 };
  }).filter(Boolean);

  cachedGeometry = { landDots, coastlines, hubs, hubMap, arcs };
  return cachedGeometry;
}

function getMonochromePalette(themeName) {
  if (themeName === 'putih') {
    return {
      isLight: true,
      sphereLight: '#ffffff',
      sphereMid: '#e6e6e6',
      sphereDark: '#bdbdbd',
      haloInner: 'rgba(17, 17, 17, 0.12)',
      haloOuter: 'rgba(17, 17, 17, 0)',
      rimStroke: 'rgba(17, 17, 17, 0.44)',
      compassTick: 'rgba(17, 17, 17, 0.24)',
      graticule: 'rgba(17, 17, 17, 0.12)',
      equator: 'rgba(17, 17, 17, 0.28)',
      backDot: 'rgba(17, 17, 17, 0.08)',
      landFill: 'rgba(17, 17, 17, 0.09)',
      landStroke: 'rgba(17, 17, 17, 0.44)',
      landDotRgb: '17, 17, 17',
      arcStroke: 'rgba(17, 17, 17, 0.45)',
      arcPulse: '#111111',
      orbitBack: 'rgba(17, 17, 17, 0.16)',
      orbitFront: 'rgba(17, 17, 17, 0.38)',
      orbitNode: '#111111',
      hubPin: '#111111',
      hubHalo: 'rgba(17, 17, 17, 0.34)',
      labelBg: 'rgba(255, 255, 255, 0.92)',
      labelBorder: 'rgba(17, 17, 17, 0.38)',
      labelText: '#111111',
      starRgb: '38, 38, 38',
      horizonArc: 'rgba(17, 17, 17, 0.11)',
      horizonStrong: 'rgba(17, 17, 17, 0.2)'
    };
  }
  if (themeName === 'abu') {
    return {
      isLight: false,
      sphereLight: '#474747',
      sphereMid: '#2c2c2c',
      sphereDark: '#161616',
      haloInner: 'rgba(245, 245, 245, 0.15)',
      haloOuter: 'rgba(245, 245, 245, 0)',
      rimStroke: 'rgba(255, 255, 255, 0.42)',
      compassTick: 'rgba(240, 240, 240, 0.24)',
      graticule: 'rgba(255, 255, 255, 0.13)',
      equator: 'rgba(255, 255, 255, 0.28)',
      backDot: 'rgba(255, 255, 255, 0.08)',
      landFill: 'rgba(245, 245, 245, 0.13)',
      landStroke: 'rgba(250, 250, 250, 0.48)',
      landDotRgb: '245, 245, 245',
      arcStroke: 'rgba(255, 255, 255, 0.5)',
      arcPulse: '#ffffff',
      orbitBack: 'rgba(255, 255, 255, 0.15)',
      orbitFront: 'rgba(255, 255, 255, 0.42)',
      orbitNode: '#ffffff',
      hubPin: '#ffffff',
      hubHalo: 'rgba(255, 255, 255, 0.36)',
      labelBg: 'rgba(24, 24, 24, 0.9)',
      labelBorder: 'rgba(255, 255, 255, 0.36)',
      labelText: '#ffffff',
      starRgb: '235, 235, 235',
      horizonArc: 'rgba(255, 255, 255, 0.09)',
      horizonStrong: 'rgba(255, 255, 255, 0.18)'
    };
  }
  // Default: hitam
  return {
    isLight: false,
    sphereLight: '#2c2c2c',
    sphereMid: '#151515',
    sphereDark: '#050505',
    haloInner: 'rgba(255, 255, 255, 0.16)',
    haloOuter: 'rgba(255, 255, 255, 0)',
    rimStroke: 'rgba(255, 255, 255, 0.38)',
    compassTick: 'rgba(220, 220, 220, 0.22)',
    graticule: 'rgba(255, 255, 255, 0.11)',
    equator: 'rgba(255, 255, 255, 0.25)',
    backDot: 'rgba(255, 255, 255, 0.07)',
    landFill: 'rgba(235, 235, 235, 0.11)',
    landStroke: 'rgba(245, 245, 245, 0.44)',
    landDotRgb: '245, 245, 245',
    arcStroke: 'rgba(255, 255, 255, 0.48)',
    arcPulse: '#ffffff',
    orbitBack: 'rgba(255, 255, 255, 0.13)',
    orbitFront: 'rgba(255, 255, 255, 0.38)',
    orbitNode: '#ffffff',
    hubPin: '#ffffff',
    hubHalo: 'rgba(255, 255, 255, 0.34)',
    labelBg: 'rgba(10, 10, 10, 0.88)',
    labelBorder: 'rgba(255, 255, 255, 0.34)',
    labelText: '#ffffff',
    starRgb: '240, 240, 240',
    horizonArc: 'rgba(255, 255, 255, 0.08)',
    horizonStrong: 'rgba(255, 255, 255, 0.16)'
  };
}

function projectPoint(vx, vy, vz, cosLon, sinLon, cosLat, sinLat) {
  // Rotate around Y by -rotLon, then around X by +rotLat
  const x1 = vx * cosLon - vz * sinLon;
  const z1 = vx * sinLon + vz * cosLon;
  const y2 = vy * cosLat - z1 * sinLat;
  const z2 = vy * sinLat + z1 * cosLat;
  return { x: x1, y: y2, z: z2 };
}

function drawOrbitRingHalf(ctx, cx, cy, R, timeSec, drawFront, palette) {
  if (typeof ctx.moveTo !== 'function' || typeof ctx.lineTo !== 'function') return;
  const ringR = R * 1.24;
  const tiltX = 0.42;
  const tiltZ = -0.26;
  const cosTX = Math.cos(tiltX);
  const sinTX = Math.sin(tiltX);
  const cosTZ = Math.cos(tiltZ);
  const sinTZ = Math.sin(tiltZ);

  ctx.save();
  ctx.beginPath();
  let penDown = false;
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rx = Math.cos(a) * ringR;
    const rz0 = Math.sin(a) * ringR;
    const ry1 = -rz0 * sinTX;
    const rz1 = rz0 * cosTX;
    const sx = cx + (rx * cosTZ - ry1 * sinTZ);
    const sy = cy - (rx * sinTZ + ry1 * cosTZ);
    const visible = drawFront ? rz1 >= 0 : rz1 < 0;
    if (visible) {
      if (!penDown) {
        ctx.moveTo(sx, sy);
        penDown = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    } else {
      penDown = false;
    }
  }
  ctx.strokeStyle = drawFront ? palette.orbitFront : palette.orbitBack;
  ctx.lineWidth = drawFront ? 1.15 : 0.85;
  if (typeof ctx.setLineDash === 'function') {
    ctx.setLineDash(drawFront ? [4, 4] : [2, 5]);
  }
  ctx.stroke();
  if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);

  // Orbiting satellite beacon dot
  const satA = (timeSec * 0.45) % (Math.PI * 2);
  const srx = Math.cos(satA) * ringR;
  const srz0 = Math.sin(satA) * ringR;
  const sry1 = -srz0 * sinTX;
  const srz1 = srz0 * cosTX;
  const isSatFront = srz1 >= 0;
  if (isSatFront === drawFront) {
    const ssx = cx + (srx * cosTZ - sry1 * sinTZ);
    const ssy = cy - (srx * sinTZ + sry1 * cosTZ);
    ctx.beginPath();
    ctx.arc(ssx, ssy, drawFront ? 3.2 : 2.1, 0, Math.PI * 2);
    ctx.fillStyle = palette.orbitNode;
    ctx.fill();
    if (drawFront) {
      ctx.beginPath();
      ctx.arc(ssx, ssy, 6.5, 0, Math.PI * 2);
      ctx.strokeStyle = palette.hubHalo;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function renderGlobeFrame(ctx, w, h, state, options) {
  if (!ctx || w < 10 || h < 10) return [];
  const geom = getEarthGeometry();
  const palette = getMonochromePalette(state.theme);
  const interactive = Boolean(options.interactive);
  const cx = w * 0.5;
  const cy = interactive ? h * 0.5 : h * 0.5;
  const baseR = Math.min(w, h) * (interactive ? 0.37 : 0.38);
  const R = baseR * (state.zoom || 1);

  ctx.clearRect(0, 0, w, h);

  // Guard minimal mock contexts (e.g. headless runtime-test.mjs)
  const hasFullCanvas =
    typeof ctx.moveTo === 'function' &&
    typeof ctx.lineTo === 'function' &&
    typeof ctx.stroke === 'function' &&
    typeof ctx.createRadialGradient === 'function';

  if (!hasFullCanvas) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = palette.sphereMid;
    ctx.fill();
    return [];
  }

  // 0. Subtle ambient stars inside viewport
  const starCount = interactive ? 48 : 18;
  for (let i = 0; i < starCount; i++) {
    const sx = ((i * 197.3 + 41) % 1000) / 1000 * w;
    const sy = ((i * 313.7 + 89) % 1000) / 1000 * h;
    const dx = sx - cx;
    const dy = sy - cy;
    if (dx * dx + dy * dy < R * R * 1.08) continue;
    const twinkle = 0.22 + 0.24 * Math.sin(state.time * 1.2 + i * 1.9);
    ctx.fillStyle = `rgba(${palette.starRgb}, ${twinkle.toFixed(2)})`;
    ctx.fillRect(sx, sy, i % 3 === 0 ? 1.8 : 1.1, i % 3 === 0 ? 1.8 : 1.1);
  }

  // 1. Subtle astrolabe outer compass ring (interactive hero only)
  if (interactive) {
    ctx.save();
    const tickR = R * 1.11;
    ctx.strokeStyle = palette.compassTick;
    ctx.lineWidth = 1;
    for (let deg = 0; deg < 360; deg += 15) {
      const a = deg * DEG2RAD;
      const major = deg % 45 === 0;
      const inner = tickR;
      const outer = tickR + (major ? 7 : 3.5);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Outer atmospheric halo
  const haloGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.24);
  haloGrad.addColorStop(0, palette.haloInner);
  haloGrad.addColorStop(1, palette.haloOuter);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.24, 0, Math.PI * 2);
  ctx.fillStyle = haloGrad;
  ctx.fill();

  // 3. Back half of tilted orbital satellite ring
  drawOrbitRingHalf(ctx, cx, cy, R, state.time, false, palette);

  // 4. Shaded 3D monochrome Earth sphere base (Lambertian sunlit upper-left)
  const sphereGrad = ctx.createRadialGradient(
    cx - R * 0.34,
    cy - R * 0.32,
    R * 0.08,
    cx,
    cy,
    R * 1.04
  );
  sphereGrad.addColorStop(0, palette.sphereLight);
  sphereGrad.addColorStop(0.58, palette.sphereMid);
  sphereGrad.addColorStop(1, palette.sphereDark);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = sphereGrad;
  ctx.fill();

  // Clip interior features to sphere
  if (typeof ctx.clip === 'function') {
    ctx.clip();
  }

  const cosLon = Math.cos(state.lon);
  const sinLon = Math.sin(state.lon);
  const cosLat = Math.cos(state.lat);
  const sinLat = Math.sin(state.lat);

  // Light direction (normalized upper-left-front)
  const lx = -0.46;
  const ly = 0.44;
  const lz = 0.77;

  // 5. Cartographic Graticule (parallels & meridians)
  ctx.lineWidth = 0.8;
  for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
    const phi = latDeg * DEG2RAD;
    const cPhi = Math.cos(phi);
    const sPhi = Math.sin(phi);
    ctx.beginPath();
    let pen = false;
    for (let lonDeg = -180; lonDeg <= 180; lonDeg += 6) {
      const lam = lonDeg * DEG2RAD;
      const p = projectPoint(cPhi * Math.sin(lam), sPhi, cPhi * Math.cos(lam), cosLon, sinLon, cosLat, sinLat);
      if (p.z >= 0) {
        const sx = cx + p.x * R;
        const sy = cy - p.y * R;
        if (!pen) {
          ctx.moveTo(sx, sy);
          pen = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      } else {
        pen = false;
      }
    }
    ctx.strokeStyle = latDeg === 0 ? palette.equator : palette.graticule;
    ctx.lineWidth = latDeg === 0 ? 1.1 : 0.75;
    ctx.stroke();
  }

  for (let lonDeg = -180; lonDeg < 180; lonDeg += 30) {
    const lam = lonDeg * DEG2RAD;
    const sLam = Math.sin(lam);
    const cLam = Math.cos(lam);
    ctx.beginPath();
    let pen = false;
    for (let latDeg = -84; latDeg <= 84; latDeg += 6) {
      const phi = latDeg * DEG2RAD;
      const cPhi = Math.cos(phi);
      const p = projectPoint(cPhi * sLam, Math.sin(phi), cPhi * cLam, cosLon, sinLon, cosLat, sinLat);
      if (p.z >= 0) {
        const sx = cx + p.x * R;
        const sy = cy - p.y * R;
        if (!pen) {
          ctx.moveTo(sx, sy);
          pen = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      } else {
        pen = false;
      }
    }
    ctx.strokeStyle = lonDeg === 0 ? palette.equator : palette.graticule;
    ctx.lineWidth = lonDeg === 0 ? 1.05 : 0.75;
    ctx.stroke();
  }

  // 6. Back-hemisphere ghost dots (subtle 3D depth transparency)
  ctx.fillStyle = palette.backDot;
  const backStep = interactive ? 2 : 4;
  for (let i = 0; i < geom.landDots.length; i += backStep) {
    const d = geom.landDots[i];
    const p = projectPoint(d.x, d.y, d.z, cosLon, sinLon, cosLat, sinLat);
    if (p.z < -0.05) {
      const sx = cx + p.x * R;
      const sy = cy - p.y * R;
      ctx.fillRect(sx - 0.6, sy - 0.6, 1.2, 1.2);
    }
  }

  // 7. Front-hemisphere Coastline Polygons (filled silhouette + crisp outline)
  ctx.fillStyle = palette.landFill;
  ctx.strokeStyle = palette.landStroke;
  ctx.lineWidth = interactive ? 1.05 : 0.85;
  for (let c = 0; c < geom.coastlines.length; c++) {
    const loop = geom.coastlines[c];
    const projected = new Array(loop.length);
    let visibleCount = 0;
    for (let i = 0; i < loop.length; i++) {
      const v = loop[i];
      const p = projectPoint(v.x, v.y, v.z, cosLon, sinLon, cosLat, sinLat);
      projected[i] = p;
      if (p.z >= 0) visibleCount++;
    }
    if (visibleCount < 2) continue;

    // Draw filled horizon-projected silhouette
    ctx.beginPath();
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      let px = p.x;
      let py = p.y;
      if (p.z < 0) {
        const len = Math.hypot(px, py) || 1;
        px /= len;
        py /= len;
      }
      const sx = cx + px * R;
      const sy = cy - py * R;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    if (typeof ctx.closePath === 'function') ctx.closePath();
    ctx.fill();

    // Draw crisp visible coastline segments only (z >= 0)
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= projected.length; i++) {
      const p = projected[i % projected.length];
      if (p.z >= 0) {
        const sx = cx + p.x * R;
        const sy = cy - p.y * R;
        if (!pen) {
          ctx.moveTo(sx, sy);
          pen = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      } else {
        pen = false;
      }
    }
    ctx.stroke();
  }

  // 8. Front-hemisphere Monochrome Dot-Matrix Terrain with Lambertian lighting
  const dotStep = interactive ? 1 : 2;
  const dotBaseR = interactive ? Math.max(1.0, R * 0.0095) : Math.max(0.85, R * 0.012);
  for (let i = 0; i < geom.landDots.length; i += dotStep) {
    const d = geom.landDots[i];
    const p = projectPoint(d.x, d.y, d.z, cosLon, sinLon, cosLat, sinLat);
    if (p.z <= 0) continue;
    const ndl = Math.max(0, p.x * lx + p.y * ly + p.z * lz);
    const alpha = Math.min(0.95, 0.24 + p.z * 0.34 + ndl * 0.42);
    const dotR = dotBaseR * d.s * (0.68 + p.z * 0.46);
    const sx = cx + p.x * R;
    const sy = cy - p.y * R;
    ctx.fillStyle = `rgba(${palette.landDotRgb}, ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // 9. Crisp Fresnel Rim Stroke around Sphere
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = palette.rimStroke;
  ctx.lineWidth = interactive ? 1.35 : 1.1;
  ctx.stroke();

  // 10. Geodesic Great-Circle Arcs & Traveling Monochrome Pulses (above sphere)
  if (interactive) {
    ctx.save();
    for (let i = 0; i < geom.arcs.length; i++) {
      const arc = geom.arcs[i];
      const isFocusedArc = arc.fromId === state.activeHub || arc.toId === state.activeHub;
      ctx.beginPath();
      let pen = false;
      const screenPts = [];
      for (let k = 0; k < arc.points.length; k++) {
        const pt = arc.points[k];
        const p = projectPoint(pt.x, pt.y, pt.z, cosLon, sinLon, cosLat, sinLat);
        const sx = cx + p.x * R;
        const sy = cy - p.y * R;
        screenPts.push({ sx, sy, z: p.z });
        if (p.z > -0.08) {
          if (!pen) {
            ctx.moveTo(sx, sy);
            pen = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          pen = false;
        }
      }
      ctx.strokeStyle = palette.arcStroke;
      ctx.lineWidth = isFocusedArc ? 1.45 : 0.85;
      ctx.globalAlpha = isFocusedArc ? 0.92 : 0.45;
      ctx.stroke();

      // Traveling signal dot along arc
      const progress = (state.time * arc.speed + arc.phase) % 1;
      const idxF = progress * (screenPts.length - 1);
      const i0 = Math.floor(idxF);
      const i1 = Math.min(screenPts.length - 1, i0 + 1);
      const frac = idxF - i0;
      const pz = screenPts[i0].z + (screenPts[i1].z - screenPts[i0].z) * frac;
      if (pz > 0.02) {
        const px = screenPts[i0].sx + (screenPts[i1].sx - screenPts[i0].sx) * frac;
        const py = screenPts[i0].sy + (screenPts[i1].sy - screenPts[i0].sy) * frac;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, py, isFocusedArc ? 2.8 : 2.0, 0, Math.PI * 2);
        ctx.fillStyle = palette.arcPulse;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 11. Front half of tilted orbital satellite ring
  drawOrbitRingHalf(ctx, cx, cy, R, state.time, true, palette);

  // 12. Global Hub Pins & Focus Reticle
  const visibleHubs = [];
  if (interactive) {
    ctx.save();
    for (let i = 0; i < geom.hubs.length; i++) {
      const hub = geom.hubs[i];
      const p = projectPoint(hub.vec.x, hub.vec.y, hub.vec.z, cosLon, sinLon, cosLat, sinLat);
      if (p.z <= 0.14) continue;
      const sx = cx + p.x * R;
      const sy = cy - p.y * R;
      const isSelected = hub.id === state.activeHub;
      visibleHubs.push({ hub, sx, sy, z: p.z });

      if (isSelected) {
        const pulse = 5 + ((state.time * 10) % 10);
        const pulseAlpha = Math.max(0.08, 1 - (pulse - 5) / 10);
        ctx.beginPath();
        ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = palette.hubPin;
        ctx.globalAlpha = pulseAlpha * 0.7;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? 3.8 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = palette.hubPin;
      ctx.fill();

      // Clean monochrome code pill for focused hub or prominent front hubs
      if (isSelected || p.z > 0.62) {
        const tag = hub.code;
        ctx.font = '700 10px "IBM Plex Mono", monospace';
        const tw = typeof ctx.measureText === 'function' ? ctx.measureText(tag).width : 22;
        const bx = sx + 7;
        const by = sy - 10;
        const bw = tw + 10;
        const bh = 16;
        ctx.fillStyle = palette.labelBg;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = palette.labelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = palette.labelText;
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, bx + 5, by + bh * 0.5 + 0.5);
      }
    }
    ctx.restore();
  }

  return visibleHubs;
}

function renderBackdropHorizon(ctx, w, h, timeSec, themeName, stars) {
  if (!ctx || w < 10 || h < 10) return;
  const palette = getMonochromePalette(themeName);
  ctx.clearRect(0, 0, w, h);

  // 1. Calm drifting monochrome stars
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const x = ((s.x + timeSec * s.vx) % w + w) % w;
    const y = ((s.y + timeSec * s.vy) % h + h) % h;
    const alpha = s.a * (0.65 + 0.35 * Math.sin(timeSec * 0.9 + s.p));
    ctx.fillStyle = `rgba(${palette.starRgb}, ${alpha.toFixed(2)})`;
    ctx.fillRect(x, y, s.r, s.r);
  }

  if (typeof ctx.moveTo !== 'function' || typeof ctx.lineTo !== 'function' || typeof ctx.stroke !== 'function') {
    return;
  }

  // 2. Giant architectural wireframe Earth hemisphere on lower-right backdrop
  const R = Math.max(w, h) * 0.44;
  const cx = w * 0.86;
  const cy = h * 0.88;
  const spin = timeSec * 0.04;

  ctx.save();
  // Outer horizon rings
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = palette.horizonStrong;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.14, 0, Math.PI * 2);
  ctx.strokeStyle = palette.horizonArc;
  ctx.lineWidth = 0.8;
  if (typeof ctx.setLineDash === 'function') ctx.setLineDash([5, 7]);
  ctx.stroke();
  if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);

  // Clip wireframe inside giant backdrop sphere
  if (typeof ctx.clip === 'function') {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
  }

  const cosLon = Math.cos(spin);
  const sinLon = Math.sin(spin);
  const cosLat = Math.cos(-0.22);
  const sinLat = Math.sin(-0.22);

  ctx.strokeStyle = palette.horizonArc;
  ctx.lineWidth = 0.85;
  for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
    const phi = latDeg * DEG2RAD;
    const cPhi = Math.cos(phi);
    const sPhi = Math.sin(phi);
    ctx.beginPath();
    let pen = false;
    for (let lonDeg = -180; lonDeg <= 180; lonDeg += 10) {
      const lam = lonDeg * DEG2RAD;
      const p = projectPoint(cPhi * Math.sin(lam), sPhi, cPhi * Math.cos(lam), cosLon, sinLon, cosLat, sinLat);
      if (p.z >= 0) {
        const sx = cx + p.x * R;
        const sy = cy - p.y * R;
        if (!pen) {
          ctx.moveTo(sx, sy);
          pen = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      } else {
        pen = false;
      }
    }
    ctx.stroke();
  }

  for (let lonDeg = -180; lonDeg < 180; lonDeg += 30) {
    const lam = lonDeg * DEG2RAD;
    const sLam = Math.sin(lam);
    const cLam = Math.cos(lam);
    ctx.beginPath();
    let pen = false;
    for (let latDeg = -80; latDeg <= 80; latDeg += 10) {
      const phi = latDeg * DEG2RAD;
      const cPhi = Math.cos(phi);
      const p = projectPoint(cPhi * sLam, Math.sin(phi), cPhi * cLam, cosLon, sinLon, cosLat, sinLat);
      if (p.z >= 0) {
        const sx = cx + p.x * R;
        const sy = cy - p.y * R;
        if (!pen) {
          ctx.moveTo(sx, sy);
          pen = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      } else {
        pen = false;
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function formatCoordString(latRad, lonRad, activeHubId) {
  let lonDeg = ((lonRad * RAD2DEG) % 360 + 540) % 360 - 180;
  let latDeg = Math.max(-90, Math.min(90, latRad * RAD2DEG));
  const ns = latDeg >= 0 ? 'N' : 'S';
  const ew = lonDeg >= 0 ? 'E' : 'W';
  const hub = GLOBE_HUBS.find((h) => h.id === activeHubId);
  const label = hub ? hub.name.toUpperCase() : 'BUMI';
  return `${Math.abs(latDeg).toFixed(1)}°${ns} · ${Math.abs(lonDeg).toFixed(1)}°${ew} · ${label}`;
}

export function createEarthGlobeController(options = {}) {
  const {
    heroCanvas,
    authCanvas,
    backdropCanvas,
    getTheme = () => 'hitam',
    isMotionPaused = () => false,
    onCoordsChange = null,
    onHeroPauseChange = null,
    onRegionChange = null
  } = options;

  const geom = getEarthGeometry();
  const defaultHub = geom.hubMap.get('jakarta') || GLOBE_HUBS[0];

  const heroState = {
    lon: defaultHub.lon * DEG2RAD,
    lat: defaultHub.lat * DEG2RAD,
    targetLon: null,
    targetLat: null,
    velLon: 0,
    velLat: 0,
    zoom: 1.0,
    targetZoom: 1.0,
    time: 0,
    activeHub: defaultHub.id,
    theme: getTheme(),
    spinPaused: false,
    lonOffsetRad: 0
  };

  const authState = {
    lon: defaultHub.lon * DEG2RAD,
    lat: -0.14,
    zoom: 1.02,
    time: 0,
    activeHub: defaultHub.id,
    theme: getTheme()
  };

  let rafId = null;
  let destroyed = false;
  let lastTs = 0;
  let lastCoordEmit = 0;
  let lastRenderedHubs = [];
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let movedDistance = 0;

  let backdropStars = [];
  const canvasDims = {
    hero: { w: 680, h: 380 },
    auth: { w: 220, h: 220 },
    backdrop: { w: 1280, h: 720 }
  };

  const localCleanups = [];
  function bindLocal(el, ev, fn, opts) {
    if (!el || typeof el.addEventListener !== 'function') return;
    el.addEventListener(ev, fn, opts);
    localCleanups.push(() => {
      if (typeof el.removeEventListener === 'function') {
        el.removeEventListener(ev, fn, opts);
      }
    });
  }

  function sizeCanvas(canvas, key, fallbackW, fallbackH) {
    if (!canvas) return;
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    let cssW = fallbackW;
    let cssH = fallbackH;
    if (key === 'backdrop' && typeof window !== 'undefined') {
      cssW = Math.max(320, window.innerWidth || fallbackW);
      cssH = Math.max(320, window.innerHeight || fallbackH);
    } else if (typeof canvas.getBoundingClientRect === 'function') {
      const rect = canvas.getBoundingClientRect();
      if (rect && rect.width > 40 && rect.height > 40) {
        cssW = Math.round(rect.width);
        cssH = Math.round(rect.height);
      }
    }
    canvasDims[key] = { w: cssW, h: cssH };
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx && typeof ctx.setTransform === 'function') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function seedBackdropStars() {
    const { w, h } = canvasDims.backdrop;
    backdropStars = Array.from({ length: 44 }, (_, i) => ({
      x: ((i * 211.7 + 17) % 1000) / 1000 * w,
      y: ((i * 389.3 + 53) % 1000) / 1000 * h,
      r: i % 5 === 0 ? 1.8 : 1.15,
      vx: -1.8 + (i % 7) * 0.45,
      vy: 0.5 + (i % 5) * 0.35,
      a: 0.16 + (i % 4) * 0.08,
      p: i * 0.9
    }));
  }

  function resize() {
    sizeCanvas(backdropCanvas, 'backdrop', 1280, 720);
    sizeCanvas(heroCanvas, 'hero', 680, 380);
    sizeCanvas(authCanvas, 'auth', 220, 220);
    seedBackdropStars();
    renderOnce();
  }

  function emitCoords(force = false) {
    if (typeof onCoordsChange !== 'function') return;
    const now = Date.now();
    if (!force && now - lastCoordEmit < 120) return;
    lastCoordEmit = now;
    onCoordsChange(formatCoordString(heroState.lat, heroState.lon + heroState.lonOffsetRad, heroState.activeHub));
  }

  function renderOnce() {
    const theme = getTheme();
    heroState.theme = theme;
    authState.theme = theme;

    if (backdropCanvas) {
      const ctx = backdropCanvas.getContext('2d');
      renderBackdropHorizon(ctx, canvasDims.backdrop.w, canvasDims.backdrop.h, heroState.time, theme, backdropStars);
    }
    if (heroCanvas) {
      const homePage = typeof document !== 'undefined' ? document.getElementById('homePage') : null;
      const appWrap = typeof document !== 'undefined' ? document.getElementById('appWrap') : null;
      const heroVisible = (!appWrap || !appWrap.hidden) && (!homePage || !homePage.hidden);
      if (heroVisible) {
        const ctx = heroCanvas.getContext('2d');
        const renderState = { ...heroState, lon: heroState.lon + heroState.lonOffsetRad };
        lastRenderedHubs = renderGlobeFrame(ctx, canvasDims.hero.w, canvasDims.hero.h, renderState, { interactive: true });
      }
    }
    if (authCanvas) {
      const authPage = typeof document !== 'undefined' ? document.getElementById('authPage') : null;
      if (!authPage || !authPage.hidden) {
        const ctx = authCanvas.getContext('2d');
        renderGlobeFrame(ctx, canvasDims.auth.w, canvasDims.auth.h, authState, { interactive: false });
      }
    }
    emitCoords(false);
  }

  function step(ts) {
    if (destroyed) return;
    if (isMotionPaused()) {
      rafId = null;
      renderOnce();
      return;
    }

    const dt = lastTs ? Math.min(0.05, Math.max(0.008, (ts - lastTs) / 1000)) : 0.016;
    lastTs = ts;
    heroState.time += dt;
    authState.time += dt;

    // Auth mini globe rotates gently West-to-East
    authState.lon -= dt * 0.16;

    // Hero globe easing toward target or inertia / auto-rotation
    if (heroState.targetLon !== null && heroState.targetLat !== null) {
      let diffLon = heroState.targetLon - heroState.lon;
      while (diffLon > Math.PI) diffLon -= Math.PI * 2;
      while (diffLon < -Math.PI) diffLon += Math.PI * 2;
      const diffLat = heroState.targetLat - heroState.lat;
      heroState.lon += diffLon * Math.min(1, dt * 6.5);
      heroState.lat += diffLat * Math.min(1, dt * 6.5);
      if (Math.abs(diffLon) < 0.003 && Math.abs(diffLat) < 0.003) {
        heroState.lon = heroState.targetLon;
        heroState.lat = heroState.targetLat;
        heroState.targetLon = null;
        heroState.targetLat = null;
      }
    } else if (!dragging) {
      if (Math.abs(heroState.velLon) > 0.0004 || Math.abs(heroState.velLat) > 0.0004) {
        heroState.lon += heroState.velLon;
        heroState.lat = Math.max(-1.12, Math.min(1.12, heroState.lat + heroState.velLat));
        heroState.velLon *= 0.92;
        heroState.velLat *= 0.92;
      } else if (!heroState.spinPaused) {
        heroState.lon -= dt * 0.14;
      }
    }

    // Smooth zoom interpolation
    if (Math.abs(heroState.targetZoom - heroState.zoom) > 0.002) {
      heroState.zoom += (heroState.targetZoom - heroState.zoom) * Math.min(1, dt * 8);
    } else {
      heroState.zoom = heroState.targetZoom;
    }

    renderOnce();
    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (destroyed) return;
    if (isMotionPaused()) {
      stop();
      renderOnce();
      return;
    }
    if (rafId === null) {
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    }
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    renderOnce();
  }

  function setHeroSpinPaused(paused) {
    heroState.spinPaused = Boolean(paused);
    if (typeof onHeroPauseChange === 'function') {
      onHeroPauseChange(heroState.spinPaused);
    }
    renderOnce();
  }

  function toggleHeroSpin() {
    setHeroSpinPaused(!heroState.spinPaused);
    return heroState.spinPaused;
  }

  function focusRegion(hubId) {
    const hub = geom.hubMap.get(String(hubId || '').toLowerCase());
    if (!hub) return null;
    heroState.activeHub = hub.id;
    heroState.velLon = 0;
    heroState.velLat = 0;
    if (isMotionPaused()) {
      heroState.lon = hub.lon * DEG2RAD;
      heroState.lat = hub.lat * DEG2RAD;
      heroState.targetLon = null;
      heroState.targetLat = null;
    } else {
      heroState.targetLon = hub.lon * DEG2RAD;
      heroState.targetLat = hub.lat * DEG2RAD;
    }
    if (typeof onRegionChange === 'function') {
      onRegionChange(hub.id);
    }
    emitCoords(true);
    renderOnce();
    return hub;
  }

  function nudge(dLonDeg, dLatDeg) {
    heroState.targetLon = null;
    heroState.targetLat = null;
    heroState.velLon = 0;
    heroState.velLat = 0;
    heroState.lon += (Number(dLonDeg) || 0) * DEG2RAD;
    heroState.lat = Math.max(-1.12, Math.min(1.12, heroState.lat + (Number(dLatDeg) || 0) * DEG2RAD));
    emitCoords(true);
    renderOnce();
  }

  function zoomBy(delta) {
    const next = Math.max(0.82, Math.min(1.42, heroState.targetZoom + (Number(delta) || 0)));
    heroState.targetZoom = next;
    if (isMotionPaused()) {
      heroState.zoom = next;
    }
    renderOnce();
    return next;
  }

  function resetView() {
    heroState.targetZoom = 1.0;
    if (isMotionPaused()) heroState.zoom = 1.0;
    return focusRegion('jakarta');
  }

  function setLongitudeOffset(deg) {
    heroState.lonOffsetRad = (Number(deg) || 0) * DEG2RAD;
    emitCoords(true);
    renderOnce();
  }

  // Interactive pointer drag & keyboard navigation on Hero Globe Canvas
  if (heroCanvas) {
    bindLocal(heroCanvas, 'pointerdown', (e) => {
      dragging = true;
      heroState.targetLon = null;
      heroState.targetLat = null;
      heroState.velLon = 0;
      heroState.velLat = 0;
      dragStartX = e.clientX || 0;
      dragStartY = e.clientY || 0;
      lastPointerX = dragStartX;
      lastPointerY = dragStartY;
      movedDistance = 0;
      if (typeof heroCanvas.setPointerCapture === 'function' && e.pointerId !== undefined) {
        try {
          heroCanvas.setPointerCapture(e.pointerId);
        } catch {}
      }
      heroCanvas.classList.add('is-dragging');
    });

    bindLocal(heroCanvas, 'pointermove', (e) => {
      if (!dragging) return;
      const cx = e.clientX || 0;
      const cy = e.clientY || 0;
      const dx = cx - lastPointerX;
      const dy = cy - lastPointerY;
      lastPointerX = cx;
      lastPointerY = cy;
      movedDistance += Math.hypot(dx, dy);

      const sens = 0.0058 / Math.max(0.75, heroState.zoom);
      heroState.lon -= dx * sens;
      heroState.lat = Math.max(-1.12, Math.min(1.12, heroState.lat + dy * sens));
      heroState.velLon = -dx * sens * 0.42;
      heroState.velLat = dy * sens * 0.32;
      emitCoords(false);
      if (isMotionPaused()) {
        renderOnce();
      }
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      heroCanvas.classList.remove('is-dragging');
      if (typeof heroCanvas.releasePointerCapture === 'function' && e && e.pointerId !== undefined) {
        try {
          heroCanvas.releasePointerCapture(e.pointerId);
        } catch {}
      }
      // Single tap/click near a hub pin focuses it
      if (movedDistance < 6 && e && typeof heroCanvas.getBoundingClientRect === 'function') {
        const rect = heroCanvas.getBoundingClientRect();
        const px = (e.clientX || 0) - rect.left;
        const py = (e.clientY || 0) - rect.top;
        let closest = null;
        let bestDist = 24;
        for (const item of lastRenderedHubs) {
          const dist = Math.hypot(item.sx - px, item.sy - py);
          if (dist < bestDist) {
            bestDist = dist;
            closest = item.hub;
          }
        }
        if (closest) {
          focusRegion(closest.id);
        }
      }
    };

    bindLocal(heroCanvas, 'pointerup', endDrag);
    bindLocal(heroCanvas, 'pointercancel', endDrag);

    bindLocal(heroCanvas, 'wheel', (e) => {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      zoomBy(e.deltaY > 0 ? -0.1 : 0.1);
    }, { passive: false });

    bindLocal(heroCanvas, 'keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudge(-16, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudge(16, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudge(0, 12);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudge(0, -12);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomBy(0.14);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomBy(-0.14);
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleHeroSpin();
      } else if (e.key === 'r' || e.key === 'R' || e.key === '0') {
        e.preventDefault();
        resetView();
      }
    });
  }

  resize();
  emitCoords(true);

  return {
    start,
    stop,
    resize,
    renderOnce,
    focusRegion,
    nudge,
    zoomBy,
    resetView,
    setLongitudeOffset,
    setHeroSpinPaused,
    toggleHeroSpin,
    isHeroSpinPaused: () => heroState.spinPaused,
    getActiveHub: () => heroState.activeHub,
    destroy() {
      destroyed = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      for (const fn of localCleanups) {
        try {
          fn();
        } catch {}
      }
      localCleanups.length = 0;
    }
  };
}
