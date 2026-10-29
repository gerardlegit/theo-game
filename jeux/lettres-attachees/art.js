// ============================================================================
// Tous les dessins du jeu, faits en code (aucune image) : les quatre décors
// (la tour de Plume, le jardin enchanté, le lac aux nénuphars, le château
// des nuages), les bulles magiques, le parchemin, le grimoire, la baguette,
// l'étoile filante, Gribouille le nuage farceur et Plume la chouette (en
// dessin sur la toile, et en SVG pour le guide en bas de l'écran).
// Les trois écritures (MAJUSCULES, script, attachée) sont définies ici.
// ============================================================================

const TAU = Math.PI * 2;
export const INK = '#2E2A4D';

/* ---------- Les trois écritures ---------- */
export const SCRIPTS = {
  cap: { label: 'MAJUSCULES', font: (s) => `800 ${s}px 'Baloo 2', sans-serif`, k: 1, up: true },
  script: { label: 'script', font: (s) => `700 ${s}px 'Quicksand', sans-serif`, k: 1.05, up: false },
  cursive: { label: 'attachée', font: (s) => `400 ${s}px 'Playwrite FR Moderne', cursive`, k: 0.8, up: false },
};

/** Le texte tel qu'il s'écrit dans une écriture */
export function written(text, script) {
  return SCRIPTS[script].up ? text.toLocaleUpperCase('fr-FR') : text;
}

/** Choisit la taille de police pour que le texte tienne dans maxW × maxH */
export function fitFont(ctx, text, script, maxW, maxH) {
  const sc = SCRIPTS[script];
  let size = maxH * sc.k;
  ctx.font = sc.font(100);
  const w100 = ctx.measureText(written(text, script)).width || 1;
  size = Math.min(size, (maxW / w100) * 100);
  return Math.max(10, size);
}

export function drawWritten(ctx, text, script, x, y, maxW, maxH, color = INK) {
  const size = fitFont(ctx, text, script, maxW, maxH);
  ctx.font = SCRIPTS[script].font(size);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // l'attachée a des boucles qui montent : on la descend un tout petit peu
  ctx.fillText(written(text, script), x, y + (script === 'cursive' ? size * 0.06 : size * 0.04));
  return size;
}

/* ---------- Petits outils ---------- */
const shadeCache = new Map();
/** Éclaircit (k > 0) ou assombrit (k < 0) une couleur #RRGGBB */
export function shade(hex, k) {
  const key = hex + k;
  let out = shadeCache.get(key);
  if (out) return out;
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  out = `rgb(${r | 0},${g | 0},${b | 0})`;
  shadeCache.set(key, out);
  return out;
}

/* Hasard reproductible (pour que le décor soit toujours dessiné pareil) */
export function seeded(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function starPath(ctx, x, y, r, rot = 0, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function heartPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  ctx.closePath();
}

/** Un petit nuage tout rond (plusieurs boules) */
function puff(ctx, x, y, r, fill, stroke = null, lw = 0) {
  const balls = [[-0.9, 0.15, 0.55], [-0.35, -0.25, 0.75], [0.35, -0.3, 0.7], [0.95, 0.12, 0.55], [0, 0.2, 0.7]];
  ctx.beginPath();
  for (const [dx, dy, k] of balls) {
    ctx.moveTo(x + dx * r + k * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, k * r, 0, TAU);
  }
  if (stroke) { ctx.lineWidth = lw * 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Une étincelle de baguette (forme selon la baguette choisie) */
export function drawSpark(ctx, shape, x, y, s, color, rot) {
  ctx.fillStyle = color;
  if (shape === 'heart') { heartPath(ctx, x, y, s); ctx.fill(); return; }
  if (shape === 'snow') {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.25);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = rot + i * Math.PI / 3;
      ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s);
      ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
    }
    ctx.stroke();
    return;
  }
  if (shape === 'note') {
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.5, s * 0.55, s * 0.4, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillRect(x + s * 0.35, y - s * 0.9, s * 0.18, s * 1.4);
    ctx.fillRect(x + s * 0.35, y - s * 0.9, s * 0.6, s * 0.2);
    return;
  }
  if (shape === 'dot' || shape === 'firework') {
    ctx.beginPath();
    ctx.arc(x, y, s * 0.6, 0, TAU);
    ctx.fill();
    return;
  }
  starPath(ctx, x, y, s, rot);
  ctx.fill();
}

/* ============================================================================
   LES DÉCORS — une partie fixe (dessinée une fois dans une toile cachée),
   et une partie animée (étoiles qui scintillent, lucioles, nuages…).
   ============================================================================ */
export function buildScene(kind, w, h, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = seeded(kind.length * 977 + 13);
  (SCENES[kind] || SCENES.tour)(g, w, h, rnd);
  return c;
}

function skyGradient(g, h, stops) {
  const grad = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([at, col]) => grad.addColorStop(at, col));
  return grad;
}

function drawStars(g, w, h, rnd, n, maxY) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h * maxY, r = rnd() * 1.4 + 0.3;
    g.globalAlpha = 0.3 + rnd() * 0.6;
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
}

function drawMoon(g, x, y, r) {
  const glow = g.createRadialGradient(x, y, r * 0.5, x, y, r * 3.2);
  glow.addColorStop(0, 'rgba(255, 244, 200, 0.35)');
  glow.addColorStop(1, 'rgba(255, 244, 200, 0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(x, y, r * 3.2, 0, TAU);
  g.fill();
  g.fillStyle = '#FFF4C8';
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(214, 196, 140, 0.45)';
  for (const [dx, dy, k] of [[-0.3, -0.2, 0.22], [0.25, 0.25, 0.16], [0.35, -0.35, 0.1], [-0.1, 0.45, 0.12]]) {
    g.beginPath();
    g.arc(x + dx * r, y + dy * r, k * r, 0, TAU);
    g.fill();
  }
}

/** Une ligne de collines (y en part de la hauteur) */
function hills(g, w, h, y, amp, color, rnd, bumps = 4) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, h);
  const ph = rnd() * TAU;
  for (let x = 0; x <= w + 10; x += 10) {
    const k = x / w;
    g.lineTo(x, h * y - Math.sin(k * Math.PI * bumps / 2 + ph) * amp - Math.sin(k * 9 + ph * 2) * amp * 0.25);
  }
  g.lineTo(w, h);
  g.closePath();
  g.fill();
}

function roundTree(g, x, y, r, col) {
  g.fillStyle = shade(col, -0.25);
  g.fillRect(x - r * 0.12, y - r * 0.4, r * 0.24, r * 0.9);
  g.fillStyle = col;
  g.beginPath();
  g.arc(x, y - r * 0.9, r * 0.75, 0, TAU);
  g.arc(x - r * 0.5, y - r * 0.6, r * 0.5, 0, TAU);
  g.arc(x + r * 0.5, y - r * 0.6, r * 0.5, 0, TAU);
  g.fill();
}

const SCENES = {
  /* La tour de Plume, sous la lune */
  tour(g, w, h, rnd) {
    g.fillStyle = skyGradient(g, h, [[0, '#121A4A'], [0.5, '#2B2470'], [1, '#6A3F94']]);
    g.fillRect(0, 0, w, h);
    drawStars(g, w, h, rnd, Math.round(w * h / 5000), 0.75);
    drawMoon(g, w * 0.86, h * 0.17, Math.min(w, h) * 0.06);
    hills(g, w, h, 0.8, h * 0.05, '#35296E', rnd, 3);
    for (let i = 0; i < 9; i++) roundTree(g, w * (0.45 + rnd() * 0.55), h * (0.82 + rnd() * 0.04), Math.min(w, h) * (0.05 + rnd() * 0.03), '#2A2160');
    hills(g, w, h, 0.9, h * 0.03, '#221A52', rnd, 5);
    // la tour
    const tw = Math.max(54, Math.min(w * 0.085, 120)), tx = w * 0.1, ground = h * 0.93, top = h * 0.36;
    const stone = g.createLinearGradient(tx - tw / 2, 0, tx + tw / 2, 0);
    stone.addColorStop(0, '#5B5390');
    stone.addColorStop(0.5, '#7A72B0');
    stone.addColorStop(1, '#463F78');
    g.fillStyle = stone;
    g.beginPath();
    g.moveTo(tx - tw * 0.55, ground);
    g.lineTo(tx - tw * 0.45, top);
    g.lineTo(tx + tw * 0.45, top);
    g.lineTo(tx + tw * 0.55, ground);
    g.closePath();
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = '#1E1748';
    g.stroke();
    g.strokeStyle = 'rgba(30, 23, 72, 0.4)';
    g.lineWidth = 1.5;
    for (let y = top + 14, row = 0; y < ground; y += 14, row++) {
      const half = tw * (0.45 + 0.1 * (y - top) / (ground - top));
      g.beginPath();
      g.moveTo(tx - half, y);
      g.lineTo(tx + half, y);
      g.stroke();
      for (let x = tx - half + (row % 2 ? 10 : 20); x < tx + half; x += 20) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y - 14);
        g.stroke();
      }
    }
    // le toit pointu
    g.fillStyle = '#7A3FA8';
    g.beginPath();
    g.moveTo(tx - tw * 0.72, top + 4);
    g.lineTo(tx + tw * 0.08, top - tw * 1.5);
    g.lineTo(tx + tw * 0.72, top + 4);
    g.closePath();
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = '#2A124A';
    g.stroke();
    g.fillStyle = '#FFD24A';
    starPath(g, tx + tw * 0.08, top - tw * 1.55, tw * 0.16);
    g.fill();
    for (let i = 0; i < 4; i++) {
      starPath(g, tx - tw * 0.3 + i * tw * 0.18, top - tw * (0.3 + (i % 2) * 0.35), tw * 0.06);
      g.fill();
    }
    // la porte
    g.fillStyle = '#3B2A1E';
    g.beginPath();
    g.moveTo(tx - tw * 0.16, ground);
    g.lineTo(tx - tw * 0.16, ground - tw * 0.38);
    g.arc(tx, ground - tw * 0.38, tw * 0.16, Math.PI, 0);
    g.lineTo(tx + tw * 0.16, ground);
    g.closePath();
    g.fill();
    hills(g, w, h, 0.97, h * 0.015, '#191240', rnd, 6);
  },

  /* Le jardin enchanté, au coucher du soleil */
  jardin(g, w, h, rnd) {
    g.fillStyle = skyGradient(g, h, [[0, '#5B4BB0'], [0.45, '#E27AB0'], [0.78, '#FFB98A'], [1, '#FFD9A0']]);
    g.fillRect(0, 0, w, h);
    drawStars(g, w, h, rnd, Math.round(w * h / 16000), 0.3);
    const sx = w * 0.3, sy = h * 0.76, sr = Math.min(w, h) * 0.13;
    const glow = g.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 3);
    glow.addColorStop(0, 'rgba(255, 230, 140, 0.55)');
    glow.addColorStop(1, 'rgba(255, 230, 140, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFE38A';
    g.beginPath();
    g.arc(sx, sy, sr, 0, TAU);
    g.fill();
    hills(g, w, h, 0.8, h * 0.05, '#6FAF6A', rnd, 3);
    hills(g, w, h, 0.88, h * 0.04, '#4F9558', rnd, 4);
    // les champignons géants
    const base = Math.min(w, h);
    const mush = [[0.06, 0.95, 0.16, '#E8505B'], [0.93, 0.94, 0.14, '#E8505B'], [0.82, 0.96, 0.08, '#B58CF0'], [0.18, 0.97, 0.07, '#FFB13C']];
    for (const [mx, my, k, col] of mush) {
      const x = w * mx, y = h * my, r = base * k;
      g.fillStyle = '#FFF1DC';
      g.strokeStyle = '#5A3A2A';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x - r * 0.18, y);
      g.quadraticCurveTo(x - r * 0.24, y - r * 0.6, x - r * 0.14, y - r * 0.9);
      g.lineTo(x + r * 0.14, y - r * 0.9);
      g.quadraticCurveTo(x + r * 0.24, y - r * 0.6, x + r * 0.18, y);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x, y - r * 0.9, r * 0.75, r * 0.5, 0, Math.PI, 0);
      g.quadraticCurveTo(x, y - r * 0.75, x - r * 0.75, y - r * 0.9);
      g.fill();
      g.stroke();
      g.fillStyle = '#FFFFFF';
      for (const [dx, dy, kk] of [[-0.4, -1.1, 0.09], [0, -1.25, 0.11], [0.38, -1.08, 0.08], [-0.15, -0.98, 0.06]]) {
        g.beginPath();
        g.arc(x + dx * r, y + dy * r, kk * r, 0, TAU);
        g.fill();
      }
    }
    hills(g, w, h, 0.97, h * 0.02, '#3B7D47', rnd, 6);
    // les fleurs
    const cols = ['#FF6F91', '#FFE066', '#FFFFFF', '#B58CF0', '#4FB8E8'];
    for (let i = 0; i < Math.round(w / 22); i++) {
      const x = rnd() * w, y = h * (0.9 + rnd() * 0.09), r = 3 + rnd() * 4;
      g.strokeStyle = '#2F6B3A';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x, y + 10);
      g.lineTo(x, y);
      g.stroke();
      g.fillStyle = cols[i % cols.length];
      for (let p = 0; p < 5; p++) {
        g.beginPath();
        g.arc(x + Math.cos(p * TAU / 5) * r * 0.7, y + Math.sin(p * TAU / 5) * r * 0.7, r * 0.55, 0, TAU);
        g.fill();
      }
      g.fillStyle = '#FFB13C';
      g.beginPath();
      g.arc(x, y, r * 0.35, 0, TAU);
      g.fill();
    }
  },

  /* Le lac aux nénuphars, au clair de lune */
  lac(g, w, h, rnd) {
    const horizon = h * 0.6;
    g.fillStyle = skyGradient(g, horizon, [[0, '#0E2547'], [0.6, '#24507A'], [1, '#5E9DB2']]);
    g.fillRect(0, 0, w, horizon);
    drawStars(g, w, horizon, rnd, Math.round(w * h / 7000), 0.9);
    drawMoon(g, w * 0.78, h * 0.16, Math.min(w, h) * 0.055);
    // les montagnes au loin
    g.fillStyle = '#1C3A5C';
    g.beginPath();
    g.moveTo(0, horizon);
    for (let x = 0; x <= w; x += w / 8) g.lineTo(x + w / 16, horizon - h * (0.06 + rnd() * 0.1));
    g.lineTo(w, horizon);
    g.closePath();
    g.fill();
    for (let i = 0; i < 14; i++) roundTree(g, rnd() * w, horizon + 2, Math.min(w, h) * (0.025 + rnd() * 0.02), '#163150');
    // l'eau
    const water = g.createLinearGradient(0, horizon, 0, h);
    water.addColorStop(0, '#3E7A95');
    water.addColorStop(0.3, '#1F5272');
    water.addColorStop(1, '#0D2C45');
    g.fillStyle = water;
    g.fillRect(0, horizon, w, h - horizon);
    g.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) {
      const y = horizon + 6 + rnd() * (h - horizon), x = rnd() * w, l = 20 + rnd() * 60;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + l, y);
      g.stroke();
    }
    // les nénuphars
    const pads = [[0.07, 0.8, 1], [0.2, 0.93, 1.3], [0.88, 0.84, 1.1], [0.72, 0.95, 1.4], [0.5, 0.98, 1], [0.95, 0.68, 0.7], [0.32, 0.7, 0.6]];
    for (const [px, py, k] of pads) {
      const x = w * px, y = h * py, r = Math.min(w, h) * 0.05 * k;
      g.fillStyle = '#3F9B5E';
      g.strokeStyle = '#1F5A35';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(x, y, r, r * 0.38, 0, 0.25, TAU - 0.25);
      g.lineTo(x, y);
      g.closePath();
      g.fill();
      g.stroke();
      if (k >= 1) {
        g.fillStyle = '#FF9DBB';
        for (let p = 0; p < 6; p++) {
          const a = p * TAU / 6;
          g.beginPath();
          g.ellipse(x + Math.cos(a) * r * 0.18, y - r * 0.18 + Math.sin(a) * r * 0.07, r * 0.2, r * 0.1, a, 0, TAU);
          g.fill();
        }
        g.fillStyle = '#FFE066';
        g.beginPath();
        g.arc(x, y - r * 0.2, r * 0.08, 0, TAU);
        g.fill();
      }
    }
    // les roseaux
    for (const side of [0, 1]) {
      for (let i = 0; i < 9; i++) {
        const x = side ? w - 10 - rnd() * w * 0.08 : 10 + rnd() * w * 0.08, len = h * (0.12 + rnd() * 0.12);
        g.strokeStyle = '#2E5E3A';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, h);
        g.quadraticCurveTo(x + (side ? -8 : 8), h - len * 0.5, x + (side ? -4 : 4), h - len);
        g.stroke();
        if (i % 2 === 0) {
          g.fillStyle = '#6B4226';
          g.beginPath();
          g.ellipse(x + (side ? -4 : 4), h - len + 8, 4, 11, 0, 0, TAU);
          g.fill();
        }
      }
    }
  },

  /* Le château des nuages, à l'aube */
  chateau(g, w, h, rnd) {
    g.fillStyle = skyGradient(g, h, [[0, '#7E6CC7'], [0.5, '#F3A2C9'], [1, '#FFE2B0']]);
    g.fillRect(0, 0, w, h);
    drawStars(g, w, h, rnd, Math.round(w * h / 20000), 0.35);
    // l'arc-en-ciel
    const rcx = w * 0.3, rcy = h * 0.95, rr = Math.min(w * 0.45, h * 0.8);
    ['#FF5E5E', '#FFB13C', '#FFE066', '#58C97B', '#4FB8E8', '#B58CF0'].forEach((col, i) => {
      g.strokeStyle = col;
      g.globalAlpha = 0.28;
      g.lineWidth = rr * 0.05;
      g.beginPath();
      g.arc(rcx, rcy, rr - i * rr * 0.05, Math.PI, TAU);
      g.stroke();
    });
    g.globalAlpha = 1;
    // le château, posé sur un nuage
    const cx = w * 0.86, cy = h * 0.5, s = Math.min(w, h) * 0.2;
    const towers = [[-0.55, 0.55, 0.22], [-0.2, 0.85, 0.26], [0.2, 0.75, 0.24], [0.55, 0.5, 0.2]];
    for (const [dx, th, tw] of towers) {
      const x = cx + dx * s, top = cy - th * s;
      g.fillStyle = '#F7E9FF';
      g.strokeStyle = '#6B4F9C';
      g.lineWidth = 2.5;
      g.fillRect(x - tw * s / 2, top, tw * s, th * s + s * 0.2);
      g.strokeRect(x - tw * s / 2, top, tw * s, th * s + s * 0.2);
      g.fillStyle = dx < 0 ? '#FF8FB8' : '#7FB8FF';
      g.beginPath();
      g.moveTo(x - tw * s * 0.65, top);
      g.lineTo(x, top - tw * s * 1.5);
      g.lineTo(x + tw * s * 0.65, top);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#FFD24A';
      g.beginPath();
      g.arc(x, top + th * s * 0.35, tw * s * 0.16, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#F7E9FF';
    g.fillRect(cx - s * 0.6, cy - s * 0.25, s * 1.2, s * 0.45);
    g.strokeRect(cx - s * 0.6, cy - s * 0.25, s * 1.2, s * 0.45);
    puff(g, cx, cy + s * 0.25, s * 0.75, '#FFFFFF', 'rgba(150, 120, 200, 0.35)', 2);
    // des nuages fixes
    for (let i = 0; i < 6; i++) puff(g, rnd() * w * 0.7, h * (0.15 + rnd() * 0.45), Math.min(w, h) * (0.04 + rnd() * 0.04), 'rgba(255, 255, 255, 0.55)');
    // le sol de nuages
    for (let x = -40; x < w + 80; x += 90) puff(g, x, h * 0.97 + Math.sin(x) * 8, 70, '#FFFFFF', 'rgba(150, 120, 200, 0.3)', 2);
  },
};

/** La partie animée du décor (t = temps en s) */
export function drawSceneFx(ctx, kind, w, h, t, fx) {
  if (!fx.twinkle) {
    const rnd = seeded(91);
    fx.twinkle = Array.from({ length: 26 }, () => ({ x: rnd(), y: rnd() * 0.6, p: rnd() * TAU, s: 1 + rnd() * 1.6 }));
    fx.flies = Array.from({ length: 16 }, () => ({ x: rnd(), y: 0.5 + rnd() * 0.45, p: rnd() * TAU, v: 0.3 + rnd() * 0.5 }));
    fx.clouds = Array.from({ length: 5 }, () => ({ x: rnd(), y: 0.1 + rnd() * 0.5, r: 0.04 + rnd() * 0.05, v: 0.004 + rnd() * 0.01 }));
  }
  // les étoiles qui scintillent
  if (kind !== 'jardin' && kind !== 'chateau') {
    for (const s of fx.twinkle) {
      const a = 0.5 + 0.5 * Math.sin(t * 2.2 + s.p);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = '#FFFBEA';
      starPath(ctx, s.x * w, s.y * h * (kind === 'lac' ? 0.9 : 1), s.s * (1 + a), t * 0.3 + s.p, 0.35);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // la fenêtre de la tour qui brille
  if (kind === 'tour') {
    const tw = Math.max(54, Math.min(w * 0.085, 120)), tx = w * 0.1;
    const flick = 0.75 + 0.25 * Math.sin(t * 7) * Math.sin(t * 3.1);
    for (const [wy, k] of [[0.48, 1], [0.66, 0.85]]) {
      const y = h * wy;
      const glow = ctx.createRadialGradient(tx, y, 2, tx, y, tw * 0.8);
      glow.addColorStop(0, `rgba(255, 210, 100, ${0.5 * flick})`);
      glow.addColorStop(1, 'rgba(255, 210, 100, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(tx - tw, y - tw, tw * 2, tw * 2);
      ctx.fillStyle = `rgba(255, 220, 120, ${0.85 * flick})`;
      roundRect(ctx, tx - tw * 0.12 * k, y - tw * 0.2 * k, tw * 0.24 * k, tw * 0.32 * k, tw * 0.12 * k);
      ctx.fill();
      ctx.strokeStyle = '#1E1748';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  // le reflet de la lune sur le lac
  if (kind === 'lac') {
    const mx = w * 0.78;
    for (let i = 0; i < 9; i++) {
      const y = h * 0.62 + i * h * 0.035;
      const len = (30 - i * 2) * (0.7 + 0.3 * Math.sin(t * 2 + i));
      ctx.fillStyle = `rgba(255, 244, 200, ${0.35 - i * 0.03})`;
      ctx.fillRect(mx - len / 2 + Math.sin(t * 1.5 + i * 1.7) * 6, y, len, 2.5);
    }
  }
  // les nuages qui passent
  if (kind === 'chateau' || kind === 'jardin') {
    for (const c of fx.clouds) {
      const x = ((c.x + t * c.v) % 1.3) * w - w * 0.15;
      ctx.globalAlpha = kind === 'chateau' ? 0.8 : 0.35;
      puff(ctx, x, c.y * h * (kind === 'jardin' ? 0.6 : 1), Math.min(w, h) * c.r, '#FFFFFF');
    }
    ctx.globalAlpha = 1;
  }
  // les lucioles (ou des pétales dans le jardin)
  for (const f of fx.flies) {
    const x = (f.x * w + Math.sin(t * f.v + f.p) * 40 + t * 6 * f.v) % w;
    const y = f.y * h + Math.cos(t * f.v * 1.3 + f.p) * 24;
    const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2 * f.v + f.p));
    if (kind === 'jardin') {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#FFD1E3';
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 2.4, t + f.p, 0, TAU);
      ctx.fill();
    } else {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
      glow.addColorStop(0, `rgba(255, 240, 140, ${a})`);
      glow.addColorStop(1, 'rgba(255, 240, 140, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 9, y - 9, 18, 18);
    }
  }
  ctx.globalAlpha = 1;
}

/* ============================================================================
   LES BULLES MAGIQUES
   b = { x, y, rx, ry, text, script, num, scale, alpha, grey, glow, hover, ph }
   ============================================================================ */
export function drawBubble(ctx, b, t) {
  const s = b.scale;
  if (s <= 0.01 || b.alpha <= 0.01) return;
  const wob = Math.sin(t * 3.1 + b.ph) * 0.035;
  const rx = b.rx * s * (1 + wob), ry = b.ry * s * (1 - wob);
  ctx.save();
  ctx.globalAlpha = b.alpha;
  ctx.translate(b.x, b.y);
  // le halo doré de l'indice
  if (b.glow > 0) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    const halo = ctx.createRadialGradient(0, 0, Math.min(rx, ry) * 0.8, 0, 0, Math.max(rx, ry) * 1.35);
    halo.addColorStop(0, `rgba(255, 220, 90, ${0.55 * b.glow * pulse})`);
    halo.addColorStop(1, 'rgba(255, 220, 90, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 1.35, ry * 1.35, 0, 0, TAU);
    ctx.fill();
  }
  if (b.hover) ctx.scale(1.05, 1.05);
  // l'ombre
  ctx.fillStyle = 'rgba(10, 5, 40, 0.18)';
  ctx.beginPath();
  ctx.ellipse(rx * 0.06, ry * 0.1, rx, ry, 0, 0, TAU);
  ctx.fill();
  // le corps transparent
  const body = ctx.createRadialGradient(-rx * 0.3, -ry * 0.35, Math.min(rx, ry) * 0.1, 0, 0, Math.max(rx, ry));
  if (b.grey) {
    body.addColorStop(0, 'rgba(220, 220, 220, 0.6)');
    body.addColorStop(1, 'rgba(120, 120, 130, 0.6)');
  } else {
    body.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    body.addColorStop(0.65, 'rgba(190, 225, 255, 0.25)');
    body.addColorStop(1, 'rgba(200, 160, 255, 0.45)');
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  // le bord irisé
  const rim = ctx.createLinearGradient(-rx, -ry, rx, ry);
  rim.addColorStop(0, 'rgba(255, 140, 200, 0.95)');
  rim.addColorStop(0.35, 'rgba(255, 240, 150, 0.95)');
  rim.addColorStop(0.65, 'rgba(120, 230, 255, 0.95)');
  rim.addColorStop(1, 'rgba(190, 140, 255, 0.95)');
  ctx.strokeStyle = b.grey ? 'rgba(140, 140, 150, 0.9)' : rim;
  ctx.lineWidth = Math.max(2.5, Math.min(rx, ry) * 0.06);
  ctx.stroke();
  // la pastille claire où le texte se lit bien
  ctx.fillStyle = b.grey ? 'rgba(230, 230, 235, 0.85)' : 'rgba(255, 252, 243, 0.9)';
  ctx.beginPath();
  ctx.ellipse(0, ry * 0.02, rx * 0.8, ry * 0.7, 0, 0, TAU);
  ctx.fill();
  // les reflets
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = Math.max(2, Math.min(rx, ry) * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.86, ry * 0.86, 0, Math.PI * 1.08, Math.PI * 1.38);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(-rx * 0.48, -ry * 0.62, Math.min(rx, ry) * 0.06, 0, TAU);
  ctx.fill();
  // le texte
  if (s > 0.3) drawWritten(ctx, b.text, b.script, 0, 0, rx * 1.4, ry * 0.95, b.grey ? '#8C8A99' : INK);
  // le numéro (pour jouer au clavier)
  if (b.num) {
    const nr = Math.max(10, Math.min(rx, ry) * 0.17);
    const nx = rx * 0.72, ny = ry * 0.72;
    ctx.fillStyle = b.grey ? '#B9B6C6' : '#7B5CD6';
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${nr * 1.3}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(b.num), nx, ny + nr * 0.08);
  }
  ctx.restore();
}

/** Un petit nuage de fumée grise (quand on touche la mauvaise bulle) */
export function drawSmoke(ctx, x, y, r, a) {
  ctx.globalAlpha = Math.max(0, a);
  puff(ctx, x, y, r, 'rgba(170, 165, 190, 0.85)');
  ctx.globalAlpha = 1;
}

/* ============================================================================
   LE PARCHEMIN (le modèle à retrouver)
   ============================================================================ */
export function drawParchment(ctx, x, y, w, h, t, glow = 0) {
  const roll = Math.min(h * 0.16, 22);
  ctx.save();
  if (glow > 0) {
    ctx.shadowColor = `rgba(255, 220, 100, ${glow})`;
    ctx.shadowBlur = 30 * glow;
  }
  // l'ombre
  ctx.fillStyle = 'rgba(10, 5, 40, 0.25)';
  roundRect(ctx, x + 4, y + 8, w, h, 10);
  ctx.fill();
  const paper = ctx.createLinearGradient(0, y, 0, y + h);
  paper.addColorStop(0, '#FFF7E0');
  paper.addColorStop(1, '#F3DFB2');
  ctx.fillStyle = paper;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8A5A2B';
  ctx.stroke();
  // les rouleaux, à gauche et à droite
  for (const side of [x - roll * 0.4, x + w - roll * 0.6]) {
    const rg = ctx.createLinearGradient(side, 0, side + roll, 0);
    rg.addColorStop(0, '#C99A5B');
    rg.addColorStop(0.5, '#F6E2B8');
    rg.addColorStop(1, '#B07D42');
    ctx.fillStyle = rg;
    roundRect(ctx, side, y - roll * 0.35, roll, h + roll * 0.7, roll / 2);
    ctx.fill();
    ctx.strokeStyle = '#8A5A2B';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  // de petites étoiles dans les coins
  ctx.fillStyle = 'rgba(181, 140, 240, 0.55)';
  starPath(ctx, x + roll * 1.3, y + roll * 1.1, roll * 0.4, t * 0.6);
  ctx.fill();
  starPath(ctx, x + w - roll * 1.3, y + h - roll * 1.1, roll * 0.4, -t * 0.6);
  ctx.fill();
  ctx.restore();
}

/** L'étiquette de l'écriture, en haut du parchemin */
export function drawTag(ctx, x, y, text, color) {
  ctx.font = `800 14px 'Baloo 2', sans-serif`;
  const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = color;
  roundRect(ctx, x - w / 2, y - 12, w, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

/* ============================================================================
   LE GRIMOIRE (en bas : les sorts retrouvés s'y écrivent)
   entries = [{ text }], slots = nombre de lignes de la page
   ============================================================================ */
export function drawGrimoire(ctx, cx, cy, w, t, glow, entries, slots) {
  const h = w * 0.42;
  const x = cx - w / 2, y = cy - h / 2;
  ctx.save();
  // la lueur magique
  const g = 0.25 + glow * 0.75;
  const halo = ctx.createRadialGradient(cx, cy, w * 0.1, cx, cy, w * 0.75);
  halo.addColorStop(0, `rgba(255, 220, 120, ${0.35 * g})`);
  halo.addColorStop(1, 'rgba(255, 220, 120, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - w, cy - w * 0.75, w * 2, w * 1.5);
  // la couverture
  ctx.fillStyle = '#5B2C83';
  ctx.strokeStyle = '#2A124A';
  ctx.lineWidth = 3;
  roundRect(ctx, x - w * 0.03, y + h * 0.04, w * 1.06, h * 1.02, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFD24A';
  for (const [px, py] of [[x - w * 0.01, y + h * 0.08], [x + w * 1.01, y + h * 0.08], [x - w * 0.01, y + h], [x + w * 1.01, y + h]]) {
    ctx.beginPath();
    ctx.arc(px, py, w * 0.025, 0, TAU);
    ctx.fill();
  }
  // les deux pages, un peu bombées
  for (const side of [-1, 1]) {
    const px = side < 0 ? x : cx;
    ctx.fillStyle = side < 0 ? '#FFF6DE' : '#FBEFD2';
    ctx.strokeStyle = '#8A6A3B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, y + h * 0.1);
    ctx.quadraticCurveTo(cx + side * w * 0.25, y - h * 0.04, px + (side < 0 ? 0 : w / 2), y + h * 0.04);
    ctx.lineTo(px + (side < 0 ? 0 : w / 2), y + h * 0.96);
    ctx.quadraticCurveTo(cx + side * w * 0.25, y + h * 0.88, cx, y + h * 1.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(138, 106, 59, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, y + h * 0.1);
  ctx.lineTo(cx, y + h);
  ctx.stroke();
  // les lignes et les sorts retrouvés (une colonne par page)
  for (let i = 0; i < slots; i++) {
    const { x: lx, y: ly, lineH } = grimoireSlot(cx, cy, w, i, slots);
    const e = entries[i];
    ctx.strokeStyle = 'rgba(79, 184, 232, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx - w * 0.19, ly + lineH * 0.32);
    ctx.lineTo(lx + w * 0.19, ly + lineH * 0.32);
    ctx.stroke();
    if (e) {
      const k = Math.min(1, e.age * 3);
      ctx.globalAlpha = k;
      drawWritten(ctx, e.text, 'cursive', lx, ly, w * 0.36, lineH * 0.85, '#5B2C83');
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(138, 106, 59, 0.3)';
      ctx.font = `700 ${Math.max(9, lineH * 0.5)}px 'Baloo 2', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('· · ·', lx, ly);
    }
  }
  // le marque-page
  ctx.fillStyle = '#FF6F91';
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.36, y + h * 0.96);
  ctx.lineTo(cx + w * 0.36, y + h * 1.18 + Math.sin(t * 2) * 2);
  ctx.lineTo(cx + w * 0.39, y + h * 1.12 + Math.sin(t * 2) * 2);
  ctx.lineTo(cx + w * 0.42, y + h * 1.18 + Math.sin(t * 2) * 2);
  ctx.lineTo(cx + w * 0.42, y + h * 0.96);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return h;
}

/** Où s'écrit le sort n° i sur les pages du grimoire */
export function grimoireSlot(cx, cy, w, i, slots) {
  const h = w * 0.42;
  const perPage = Math.ceil(slots / 2);
  const lineH = (h * 0.74) / perPage;
  const page = i < perPage ? -1 : 1;
  return { x: cx + page * w * 0.25, y: cy - h / 2 + h * 0.2 + ((i % perPage) + 0.5) * lineH, lineH };
}

/* ============================================================================
   LA BAGUETTE (le curseur, à l'ordinateur) et L'ÉTOILE FILANTE
   ============================================================================ */
export function drawWand(ctx, x, y, t, colors) {
  const L = 54, a = -0.75;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a + Math.PI / 2);
  // le bâton : la pointe est au point du curseur
  ctx.fillStyle = '#4A2A1A';
  ctx.strokeStyle = '#1E1010';
  ctx.lineWidth = 2;
  roundRect(ctx, -3.5, 4, 7, L, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, -3.5, 4, 7, 10, 3);
  ctx.fill();
  ctx.fillStyle = colors[0];
  ctx.strokeStyle = shade(colors[0], -0.4);
  starPath(ctx, 0, 0, 9 + Math.sin(t * 6) * 1.2, t * 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawShootingStar(ctx, s, t) {
  const tail = 120;
  const ang = Math.atan2(s.vy, s.vx);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(ang);
  const grad = ctx.createLinearGradient(-tail, 0, 0, 0);
  grad.addColorStop(0, 'rgba(255, 240, 160, 0)');
  grad.addColorStop(1, 'rgba(255, 240, 160, 0.9)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-tail, 0);
  ctx.lineTo(0, -8);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const glow = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 40);
  glow.addColorStop(0, 'rgba(255, 245, 180, 0.9)');
  glow.addColorStop(1, 'rgba(255, 245, 180, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 40, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#FFE066';
  ctx.strokeStyle = '#C98A12';
  ctx.lineWidth = 2.5;
  starPath(ctx, s.x, s.y, 18, t * 4);
  ctx.fill();
  ctx.stroke();
}

/* ============================================================================
   GRIBOUILLE, le petit nuage farceur
   mood : 'sneak' (il rôde), 'blow' (il souffle), 'laugh' (il rigole),
          'sorry' (il s'excuse, à la fin)
   ============================================================================ */
export function drawGribouille(ctx, x, y, r, t, mood = 'sneak', flip = 1) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.4) * r * 0.06);
  ctx.scale(flip, 1);
  const body = '#B7A6E6';
  const lw = Math.max(2, r * 0.07);
  const cheeks = mood === 'blow' ? 1.18 : 1;
  // le corps tout en boules
  ctx.save();
  ctx.scale(cheeks, 1);
  puff(ctx, 0, 0, r, body, '#3B2C6E', lw);
  ctx.restore();
  // une petite mèche sur la tête
  ctx.strokeStyle = '#3B2C6E';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.9);
  ctx.quadraticCurveTo(r * 0.15, -r * 1.3, r * 0.35, -r * 1.05);
  ctx.stroke();
  // les yeux
  const ex = r * 0.32, ey = -r * 0.12;
  if (mood === 'laugh') {
    ctx.beginPath();
    ctx.arc(-ex, ey + r * 0.04, r * 0.13, Math.PI * 1.1, Math.PI * 1.9);
    ctx.moveTo(ex - r * 0.13, ey);
    ctx.arc(ex, ey + r * 0.04, r * 0.13, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(s * ex, ey, r * 0.16, r * 0.19, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3B2C6E';
      ctx.lineWidth = lw * 0.6;
      ctx.stroke();
      const look = mood === 'sorry' ? 0.06 : 0.05 * Math.sin(t * 1.3);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(s * ex + r * look, ey + r * (mood === 'sorry' ? 0.06 : 0.03), r * 0.08, 0, TAU);
      ctx.fill();
      // les sourcils
      ctx.strokeStyle = '#3B2C6E';
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      // (le bout du sourcil côté nez : relevé = désolé, baissé = l'air malin)
      if (mood === 'sorry') {
        ctx.moveTo(s * ex - s * r * 0.15, ey - r * 0.34);
        ctx.lineTo(s * ex + s * r * 0.12, ey - r * 0.24);
      } else {
        ctx.moveTo(s * ex - s * r * 0.15, ey - r * 0.2);
        ctx.lineTo(s * ex + s * r * 0.14, ey - r * 0.32);
      }
      ctx.stroke();
    }
  }
  // les joues roses
  ctx.fillStyle = 'rgba(255, 120, 170, 0.45)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.55, r * 0.15, r * 0.12 * cheeks, r * 0.07, 0, 0, TAU);
    ctx.fill();
  }
  // la bouche
  ctx.strokeStyle = '#3B2C6E';
  ctx.lineWidth = lw * 0.8;
  ctx.fillStyle = '#5A2A4A';
  ctx.beginPath();
  if (mood === 'blow') {
    ctx.ellipse(r * 0.05, r * 0.25, r * 0.09, r * 0.11, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  } else if (mood === 'laugh') {
    ctx.moveTo(-r * 0.25, r * 0.16);
    ctx.quadraticCurveTo(0, r * 0.55, r * 0.25, r * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (mood === 'sorry') {
    ctx.moveTo(-r * 0.15, r * 0.32);
    ctx.quadraticCurveTo(0, r * 0.22, r * 0.15, r * 0.32);
    ctx.stroke();
  } else {
    // un sourire en coin, l'air malin
    ctx.moveTo(-r * 0.2, r * 0.22);
    ctx.quadraticCurveTo(r * 0.05, r * 0.38, r * 0.3, r * 0.15);
    ctx.stroke();
  }
  ctx.restore();
}

/** Le souffle de Gribouille : des traits de vent */
export function drawWindLines(ctx, x, y, dir, len, t, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const k = ((t * 1.6 + i * 0.25) % 1);
    const sx = x + dir * k * len, sy = y + (i - 1.5) * 16 + Math.sin(t * 4 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + dir * 30, sy - 8, sx + dir * 60, sy);
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================================
   PLUME, la chouette magicienne (sur la toile : intro et fin)
   ============================================================================ */
export function drawPlume(ctx, x, y, r, t, { mood = 'happy', hat = 'sorcier', wave = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  const lw = Math.max(2, r * 0.06);
  ctx.lineWidth = lw;
  ctx.strokeStyle = '#4A2E1A';
  // les ailes
  for (const s of [-1, 1]) {
    const lift = s === 1 ? wave : 0;
    ctx.save();
    ctx.translate(s * r * 0.72, r * 0.1);
    ctx.rotate(s * (0.25 + lift * 0.9));
    ctx.fillStyle = '#8A5E3C';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.24, r * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // le corps
  ctx.fillStyle = '#A9744C';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.1, r * 0.78, r * 0.92, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // le ventre et ses plumes
  ctx.fillStyle = '#F6E3C2';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.38, r * 0.48, r * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(169, 116, 76, 0.7)';
  ctx.lineWidth = lw * 0.6;
  for (let row = 0; row < 3; row++) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * r * 0.22, r * (0.2 + row * 0.2), r * 0.08, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
  // les yeux, grands et ronds
  ctx.strokeStyle = '#4A2E1A';
  ctx.lineWidth = lw;
  const blink = (t % 3.4) < 0.12;
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#FFE7B0';
    ctx.beginPath();
    ctx.arc(s * r * 0.3, -r * 0.28, r * 0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (blink || mood === 'proud') {
      ctx.beginPath();
      ctx.arc(s * r * 0.3, -r * 0.24, r * 0.16, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFB13C';
      ctx.beginPath();
      ctx.arc(s * r * 0.3, -r * 0.26, r * 0.19, 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(s * r * 0.3 + (mood === 'worried' ? 0 : r * 0.02), -r * (mood === 'worried' ? 0.22 : 0.26), r * 0.11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s * r * 0.3 - r * 0.04, -r * 0.31, r * 0.04, 0, TAU);
      ctx.fill();
    }
  }
  // le bec
  ctx.fillStyle = '#FF9F1C';
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.08);
  ctx.lineTo(r * 0.1, -r * 0.08);
  ctx.lineTo(0, r * (mood === 'talk' ? 0.12 + Math.abs(Math.sin(t * 14)) * 0.05 : 0.12));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // les pattes
  ctx.fillStyle = '#FF9F1C';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.25, r * 1.0, r * 0.14, r * 0.07, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  drawHat(ctx, r, hat, t, lw);
  ctx.restore();
}

function drawHat(ctx, r, hat, t, lw) {
  ctx.strokeStyle = '#2A124A';
  ctx.lineWidth = lw;
  if (hat === 'couronne') {
    ctx.fillStyle = '#FFD24A';
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.62);
    ctx.lineTo(-r * 0.46, -r * 1.02);
    ctx.lineTo(-r * 0.22, -r * 0.82);
    ctx.lineTo(0, -r * 1.1);
    ctx.lineTo(r * 0.22, -r * 0.82);
    ctx.lineTo(r * 0.46, -r * 1.02);
    ctx.lineTo(r * 0.42, -r * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FF6F91';
    ctx.beginPath();
    ctx.arc(0, -r * 0.75, r * 0.07, 0, TAU);
    ctx.fill();
    return;
  }
  if (hat === 'fleur') {
    const cols = ['#FF6F91', '#FFE066', '#B58CF0', '#4FB8E8', '#FFFFFF'];
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.05 + i * 0.15);
      const fx = Math.cos(a) * r * 0.62, fy = -r * 0.25 + Math.sin(a) * r * 0.62;
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      ctx.arc(fx, fy, r * 0.12, 0, TAU);
      ctx.fill();
      ctx.lineWidth = lw * 0.5;
      ctx.stroke();
    }
    return;
  }
  if (hat === 'bonnet') {
    ctx.fillStyle = '#4FB8E8';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.62, r * 0.6, r * 0.42, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, -r * 0.64, -r * 0.7, r * 1.28, r * 0.2, r * 0.1);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r * 1.08, r * 0.15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    return;
  }
  // le chapeau de magicien
  const tip = Math.sin(t * 1.8) * r * 0.08;
  ctx.fillStyle = '#6A3FB5';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.62);
  ctx.quadraticCurveTo(-r * 0.1, -r * 1.1, r * 0.25 + tip, -r * 1.55);
  ctx.quadraticCurveTo(r * 0.15, -r * 1.05, r * 0.5, -r * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFD24A';
  roundRect(ctx, -r * 0.62, -r * 0.7, r * 1.24, r * 0.16, r * 0.08);
  ctx.fill();
  ctx.stroke();
  starPath(ctx, -r * 0.05, -r * 0.95, r * 0.1, 0.3);
  ctx.fill();
  starPath(ctx, r * 0.12, -r * 1.2, r * 0.07, 0);
  ctx.fill();
}

/* ---------- Plume en SVG (le guide en bas de l'écran, et les fenêtres) ---------- */
const HAT_SVG = {
  sorcier: `<path d="M22 30 Q38 22 50 2 Q48 20 62 30 Z" fill="#6A3FB5" stroke="#2A124A" stroke-width="3" stroke-linejoin="round"/>
    <rect x="18" y="27" width="48" height="7" rx="3.5" fill="#FFD24A" stroke="#2A124A" stroke-width="2.5"/>
    <path d="M40 16 l1.6 3.4 3.7 .4 -2.8 2.5 .8 3.6 -3.3 -1.9 -3.2 1.9 .8 -3.6 -2.8 -2.5 3.7 -.4 Z" fill="#FFD24A"/>`,
  couronne: `<path d="M24 32 L22 14 L32 22 L42 10 L52 22 L62 14 L60 32 Z" fill="#FFD24A" stroke="#2A124A" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="42" cy="26" r="3" fill="#FF6F91"/>`,
  fleur: `<g stroke="#2A124A" stroke-width="1.5"><circle cx="20" cy="30" r="5" fill="#FF6F91"/><circle cx="28" cy="22" r="5" fill="#FFE066"/><circle cx="38" cy="18" r="5" fill="#B58CF0"/><circle cx="48" cy="18" r="5" fill="#4FB8E8"/><circle cx="57" cy="22" r="5" fill="#FFFFFF"/><circle cx="64" cy="30" r="5" fill="#FF6F91"/></g>`,
  bonnet: `<path d="M18 32 Q42 0 66 32 Z" fill="#4FB8E8" stroke="#2A124A" stroke-width="3"/>
    <rect x="16" y="28" width="52" height="8" rx="4" fill="#FFFFFF" stroke="#2A124A" stroke-width="2.5"/>
    <circle cx="42" cy="9" r="6" fill="#FFFFFF" stroke="#2A124A" stroke-width="2.5"/>`,
};

export function plumeSvg(hat = 'sorcier') {
  return `
<svg class="bip plume" viewBox="0 0 84 96" aria-hidden="true">
  <g class="plume-wing"><ellipse cx="14" cy="62" rx="9" ry="18" fill="#8A5E3C" stroke="#4A2E1A" stroke-width="3" transform="rotate(14 14 62)"/></g>
  <ellipse cx="70" cy="62" rx="9" ry="18" fill="#8A5E3C" stroke="#4A2E1A" stroke-width="3" transform="rotate(-14 70 62)"/>
  <ellipse cx="42" cy="58" rx="29" ry="33" fill="#A9744C" stroke="#4A2E1A" stroke-width="3"/>
  <ellipse cx="42" cy="70" rx="18" ry="19" fill="#F6E3C2"/>
  <g fill="none" stroke="rgba(169,116,76,0.7)" stroke-width="2"><path d="M30 64 a4 4 0 0 0 8 0 M38 64 a4 4 0 0 0 8 0 M46 64 a4 4 0 0 0 8 0 M34 72 a4 4 0 0 0 8 0 M42 72 a4 4 0 0 0 8 0"/></g>
  <g class="bip-eyes">
    <circle cx="31" cy="46" r="11" fill="#FFE7B0" stroke="#4A2E1A" stroke-width="3"/>
    <circle cx="53" cy="46" r="11" fill="#FFE7B0" stroke="#4A2E1A" stroke-width="3"/>
    <circle cx="31" cy="46" r="7" fill="#FFB13C"/><circle cx="53" cy="46" r="7" fill="#FFB13C"/>
    <circle cx="32" cy="46" r="4" fill="#2E2A4D"/><circle cx="54" cy="46" r="4" fill="#2E2A4D"/>
    <circle cx="30" cy="44" r="1.5" fill="#fff"/><circle cx="52" cy="44" r="1.5" fill="#fff"/>
  </g>
  <path class="bip-mouth" d="M38 53 L46 53 L42 60 Z" fill="#FF9F1C" stroke="#4A2E1A" stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="34" cy="91" rx="5" ry="3" fill="#FF9F1C" stroke="#4A2E1A" stroke-width="2"/>
  <ellipse cx="50" cy="91" rx="5" ry="3" fill="#FF9F1C" stroke="#4A2E1A" stroke-width="2"/>
  <g class="plume-hat">${HAT_SVG[hat] || HAT_SVG.sorcier}</g>
</svg>`;
}

/** Une petite baguette en SVG (boutique) */
export function wandSvg(colors) {
  return `<svg viewBox="0 0 52 52" aria-hidden="true">
    <rect x="23" y="16" width="6" height="34" rx="3" fill="#4A2A1A" transform="rotate(35 26 26)"/>
    <path d="M18 4 l3 6.5 7 .8 -5.3 4.8 1.5 7 -6.2 -3.6 -6.2 3.6 1.5 -7 -5.3 -4.8 7 -.8 Z" fill="${colors[0]}" stroke="#2E2A4D" stroke-width="2" stroke-linejoin="round"/>
    ${colors.slice(1, 4).map((c, i) => `<circle cx="${34 + i * 6}" cy="${8 + i * 7}" r="${3 - i * 0.5}" fill="${c}" stroke="#2E2A4D" stroke-width="1"/>`).join('')}
  </svg>`;
}
