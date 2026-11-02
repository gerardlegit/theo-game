// ============================================================================
// Évolution — les animaux de la terre ferme vus de dos, de face et de trois
// quarts. Les dessins de profil (art-dinos, art-mammiferes, art-loup, art-terre)
// sont plats : quand un animal monte ou descend à l'écran, on le redessine ici
// EN VOLUME, à partir des mêmes mesures (BODIES : hanches, épaules, cou, tête…).
//
// Chaque morceau du corps est une suite de boules placées en 3D :
//   f = vers l'avant, y = vers le bas, l = sur le côté, en × taille de l'animal.
// On les projette selon sa direction, vues d'un peu au-dessus, puis on les
// dessine du plus loin au plus près. Vers la droite, le modèle tombe au même
// endroit que le dessin de profil.
// ============================================================================

import { INK, BODIES, shade as shadeHex } from './art.js';

const TAU = Math.PI * 2;
/** Assombrit ou éclaircit une couleur, qu'elle soit écrite #RRGGBB ou rgb(…) */
function shade(col, k) {
  if (col[0] === '#') return shadeHex(col, k);
  const [r, g, b] = col.match(/\d+/g).map(Number);
  const hex = (v) => Math.round(v).toString(16).padStart(2, '0');
  return shadeHex(`#${hex(r)}${hex(g)}${hex(b)}`, k);
}
/** Arrondit une ligne brisée (les défenses, les cornes) */
function smooth(pts) {
  if (pts.length < 3) return pts;
  let list = pts;
  for (let n = 0; n < 2; n++) {
    const out = [list[0]];
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i], b = list[i + 1];
      const mix = (k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, r: a.r + (b.r - a.r) * k });
      if (i > 0) out.push(mix(0.25));
      if (i < list.length - 2) out.push(mix(0.75));
    }
    out.push(list[list.length - 1]);
    list = out;
  }
  return list;
}
export const CAM_TILT = 0.55;      // la caméra regarde d'un peu au-dessus
const CAM_UP = 0.92;
const HORN = '#E8DCC0';
const HOOF_DARK = '#3A2E26';

/* ---------- Du modèle à l'écran ---------- */
function makeView(e) {
  return { x: e.x, y: e.y, r: e.size, c: Math.cos(e.angle), s: Math.sin(e.angle) };
}
function proj(V, f, y, l = 0, rad = 0) {
  return {
    x: V.x + V.r * (f * V.c - l * V.s),
    y: V.y + V.r * (y * CAM_UP + (f * V.s + l * V.c) * CAM_TILT),
    r: rad * V.r,
  };
}
const depth = (V, f, l = 0) => f * V.s + l * V.c;

/* ---------- Un tube : une suite de boules reliées, avec son contour ---------- */
function hull(ctx, pts, grow, scale, oy) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const ra = a.r * scale + grow;
    ctx.moveTo(a.x + ra, a.y + oy * a.r);
    ctx.arc(a.x, a.y + oy * a.r, Math.max(0.1, ra), 0, TAU);
    if (i === pts.length - 1) break;
    const b = pts[i + 1];
    const rb = b.r * scale + grow;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    // (dans le même sens que les cercles : sinon, les morceaux superposés font des trous)
    ctx.moveTo(a.x - nx * ra, a.y + oy * a.r - ny * ra);
    ctx.lineTo(b.x - nx * rb, b.y + oy * b.r - ny * rb);
    ctx.lineTo(b.x + nx * rb, b.y + oy * b.r + ny * rb);
    ctx.lineTo(a.x + nx * ra, a.y + oy * a.r + ny * ra);
    ctx.closePath();
  }
}

/** Un tube ombré : contour, dessous sombre, dessus éclairé (c'est ce qui donne le volume) */
function tube(ctx, pts, col, lw, o = {}) {
  ctx.fillStyle = o.ink || INK;
  hull(ctx, pts, lw, 1, 0);
  ctx.fill();
  ctx.fillStyle = shade(col, -0.24);
  hull(ctx, pts, 0, 1, 0);
  ctx.fill();
  ctx.fillStyle = col;
  hull(ctx, pts, 0, 0.84, -0.13);
  ctx.fill();
  if (o.flat) return;
  ctx.fillStyle = shade(col, 0.13);
  hull(ctx, pts, 0, 0.46, -0.36);
  ctx.fill();
}

/** Une corne, une dent, une défense : un tube clair qui s'affine */
function spike(ctx, line, col, lw) {
  const pts = smooth(line);
  ctx.fillStyle = INK;
  hull(ctx, pts, lw * 0.8, 1, 0);
  ctx.fill();
  ctx.fillStyle = col;
  hull(ctx, pts, 0, 1, 0);
  ctx.fill();
}

/* ---------- Le corps, selon la famille de l'animal ---------- */
function mamModel(P) {
  const [hx, hy] = P.hip, [sx, sy] = P.shoulder, d = P.depth;
  const midTop = P.midTop || 0.95, belly = P.belly || 0.95;
  const ball = (f, y, top, bottom) => ({ f, y: y + (bottom - top) / 2, r: (top + bottom) / 2 });
  const trunk = [
    ball(hx - d * 0.62, hy - d * 0.02, d * 0.8 * (P.hipTop || 1), d * 0.72),
    ball(hx, hy, d * (P.hipTop || 1), d * 0.85),
    ball((hx + sx) / 2, (hy + sy) / 2 + (P.sag || 0), d * midTop, d * belly),
    ball(sx, sy, d * (P.hump || 1), d * 0.95),
  ];
  const neck = [{ f: sx, y: sy, r: d * 0.7 }, ...P.neck.map(([f, y, w]) => ({ f, y, r: w * 0.92 }))];
  const w = P.legW;
  const fore = P.foreW || 0.92;
  const legs = [
    { f: hx, y: hy + d * 0.18, l: 1, r0: w * 1.75, r1: w * 0.78, phase: 0 },
    { f: hx, y: hy + d * 0.18, l: -1, r0: w * 1.75, r1: w * 0.78, phase: Math.PI },
    { f: sx, y: sy + d * 0.25, l: 1, r0: w * 1.45 * fore, r1: w * 0.76 * fore, phase: Math.PI },
    { f: sx, y: sy + d * 0.25, l: -1, r0: w * 1.45 * fore, r1: w * 0.76 * fore, phase: 0 },
  ];
  return { kind: 'mam', trunk, neck, legs, lat: d * (P.sprawl || 0.62), head: P.head, stride: P.stride || 0.3, foot: P.legs || 'patte' };
}

function dinoModel(P, biped) {
  const [hx, hy] = P.hip;
  const [cx, cy] = P.chest || P.shoulder;
  const d = P.depth;
  const trunk = [
    { f: hx - d * 0.45, y: hy + d * 0.04, r: d * 0.72 },
    { f: hx, y: hy, r: d * (P.hipTop || 0.9) },
    { f: (hx + cx) / 2, y: (hy + cy) / 2, r: d * (P.belly || 1) * 0.98 },
    { f: cx, y: cy, r: d * (biped ? 0.8 : 0.92) },
  ];
  const neck = [{ f: cx, y: cy, r: d * 0.58 }, ...P.neck.map(([f, y, w]) => ({ f, y, r: (w ?? P.neckW) * 0.95 }))];
  let legs;
  if (biped) {
    legs = [1, -1].map((l, i) => ({ f: hx + 0.05, y: hy + d * 0.25, l, r0: P.legW * 1.5, r1: P.legW * 0.42, phase: i * Math.PI }));
  } else {
    const fore = P.foreW || 1;
    const w = P.legW;
    legs = [
      { f: hx, y: hy + d * 0.25, l: 1, r0: w * 0.95, r1: w * 0.62, phase: 0 },
      { f: hx, y: hy + d * 0.25, l: -1, r0: w * 0.95, r1: w * 0.62, phase: Math.PI },
      { f: cx, y: cy + d * 0.25, l: 1, r0: w * 0.8 * fore, r1: w * 0.55 * fore, phase: Math.PI },
      { f: cx, y: cy + d * 0.25, l: -1, r0: w * 0.8 * fore, r1: w * 0.55 * fore, phase: 0 },
    ];
  }
  const last = P.neck[P.neck.length - 1];
  const head = P.head.dx !== undefined ? { ...P.head, x: last[0] + P.head.dx, y: last[1] + P.head.dy } : P.head;
  return { kind: 'dino', trunk, neck, legs, lat: d * (biped ? 0.55 : 0.68), head, stride: P.stride || 0.26, foot: biped ? 'griffe' : 'colonne' };
}

function birdModel(P) {
  const b = P.body;
  const ball = ([f, y, t, u]) => ({ f, y: y + (u - t) / 2, r: (t + u) / 2 });
  const trunk = b.slice(1, 5).map(ball);
  const neck = b.slice(4).map(ball);
  const [hx, hy] = P.hip;
  const legs = [1, -1].map((l, i) => ({ f: hx, y: hy + 0.1, l, r0: P.legW * 1.5, r1: P.legW * 0.4, phase: i * Math.PI }));
  return { kind: 'bird', trunk, neck, legs, lat: 0.2, head: P.head, stride: P.stride || 0.4, foot: 'griffe' };
}

function modelOf(B) {
  if (!B.model) {
    B.model = B.family === 'thero' ? dinoModel(B.P, true) : B.family === 'quad' || B.family === 'sauro' ? dinoModel(B.P, false)
      : B.family === 'bird' ? birdModel(B.P) : mamModel(B.P);
  }
  return B.model;
}

/* ---------- Les pattes ---------- */
function drawLeg(ctx, V, M, P, leg, ph, col, lw, fine) {
  const a = ph + leg.phase;
  const swing = Math.sin(a) * M.stride;
  const lift = Math.max(0, Math.cos(a)) * 0.13;
  const l = leg.l * M.lat;
  const hip = proj(V, leg.f, leg.y, l * 0.92, leg.r0);
  const foot = { f: leg.f + swing, y: P.ground - lift };
  const knee = proj(V, leg.f + swing * 0.55 + 0.03, (leg.y + foot.y) / 2, l * 1.02, (leg.r0 + leg.r1) * 0.5);
  const end = proj(V, foot.f, foot.y - leg.r1 * 0.5, l, leg.r1);
  tube(ctx, [hip, knee, end], col, lw, { flat: true });
  const fr = leg.r1 * V.r;
  const fx = end.x + V.c * fr * 0.35, fy = end.y + fr * 0.55 + V.s * fr * 0.2;
  // le pied : il pointe vers l'avant de l'animal
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  if (M.foot === 'sabot') {
    ctx.fillStyle = P.hoofCol || HOOF_DARK;
    ctx.beginPath();
    ctx.ellipse(fx, fy, fr * (0.95 + Math.abs(V.c) * 0.25), fr * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    return;
  }
  ctx.fillStyle = shade(col, -0.08);
  ctx.beginPath();
  ctx.ellipse(fx, fy, fr * (1.2 + Math.abs(V.c) * 0.5), fr * 0.72, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (!fine || V.s < -0.2) return;      // les griffes ne se voient que de face
  ctx.fillStyle = M.foot === 'colonne' ? '#EFE6CF' : '#F2EAD6';
  for (const k of [-0.6, 0, 0.6]) {
    ctx.beginPath();
    ctx.arc(fx + k * fr + V.c * fr * 0.8, fy + fr * 0.28, Math.max(0.7, fr * 0.2), 0, TAU);
    ctx.fill();
  }
}

/* ---------- Les marques du dos : rayures, taches, crête ---------- */
function trunkAt(M, u) {
  const n = M.trunk.length - 1, k = Math.min(n - 1, Math.floor(u * n)), w = u * n - k;
  const a = M.trunk[k], b = M.trunk[k + 1];
  return { f: a.f + (b.f - a.f) * w, y: a.y + (b.y - a.y) * w, r: a.r + (b.r - a.r) * w };
}

function drawMarks(ctx, V, M, P, stripe, lw) {
  const n = P.stripes || P.bands || 0;
  if (n) {
    ctx.strokeStyle = stripe;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const b = trunkAt(M, (i + 0.5) / n);
      ctx.lineWidth = Math.max(lw * 0.7, b.r * V.r * 0.13);
      ctx.beginPath();
      for (let k = -2; k <= 2; k++) {
        const th = k * 0.55;
        const p = proj(V, b.f, b.y - b.r * 0.86 * Math.cos(th), b.r * 0.86 * Math.sin(th));
        if (k === -2) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }
  if (P.spots) {
    ctx.fillStyle = stripe;
    for (let i = 0; i < P.spots; i++) {
      const b = trunkAt(M, ((i * 0.618) % 1) * 0.92 + 0.04);
      const th = ((i * 2.39) % 2.4) - 1.2;
      const p = proj(V, b.f, b.y - b.r * 0.86 * Math.cos(th), b.r * 0.86 * Math.sin(th));
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, b.r * V.r * 0.1), 0, TAU);
      ctx.fill();
    }
  }
  if (P.patches) {
    ctx.fillStyle = P.patches.col;
    for (let i = 0; i < P.patches.n; i++) {
      const b = trunkAt(M, ((i * 0.618 + 0.2) % 1) * 0.9 + 0.05);
      const th = ((i * 1.7) % 1.8) - 0.9;
      const p = proj(V, b.f, b.y - b.r * 0.8 * Math.cos(th), b.r * 0.8 * Math.sin(th));
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, b.r * V.r * 0.42, b.r * V.r * 0.3, i, 0, TAU);
      ctx.fill();
    }
  }
}

/** La suite de points du dos, de la croupe au garrot (pour les crêtes et les plaques) */
function ridgeAt(M, u) {
  const b = trunkAt(M, u);
  return { f: b.f, y: b.y - b.r * 0.96, r: b.r };
}

function drawRidge(ctx, V, M, n, h, col, lw, wide = 1) {
  ctx.fillStyle = col;
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  // on dessine d'abord les plaques les plus loin de nous
  const order = Array.from({ length: n }, (_, i) => i);
  if (V.s > 0) order.reverse();
  for (const i of order) {
    const u = (i + 0.5) / n;
    const a = ridgeAt(M, Math.max(0, u - 0.5 / n * wide)), b = ridgeAt(M, Math.min(1, u + 0.5 / n * wide)), m = ridgeAt(M, u);
    const size = h * (0.65 + Math.sin(u * Math.PI) * 0.5);
    const A = proj(V, a.f, a.y), B = proj(V, b.f, b.y), T = proj(V, m.f, m.y - size);
    // vue de face ou de dos, la plaque garde un peu d'épaisseur
    const side = Math.abs(V.s) * V.r * size * 0.2;
    ctx.beginPath();
    ctx.moveTo(A.x - side, A.y);
    ctx.lineTo(T.x, T.y);
    ctx.lineTo(B.x + side, B.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/* ---------- Les yeux ---------- */
function drawEye(ctx, x, y, R, iris, mood, blink, lookX, side) {
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.8, R * 0.26);
  ctx.beginPath();
  ctx.ellipse(x, y, R, R * (1 - blink * 0.9), 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (blink < 0.6) {
    const pr = R * (mood === 'scared' ? 0.42 : 0.62);
    ctx.fillStyle = iris || INK;
    ctx.beginPath();
    ctx.arc(x + lookX * R * 0.25, y + R * 0.08, pr, 0, TAU);
    ctx.fill();
    if (iris) {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(x + lookX * R * 0.25, y + R * 0.08, pr * 0.55, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + lookX * R * 0.1 - R * 0.14, y - R * 0.18, pr * 0.32, 0, TAU);
    ctx.fill();
  }
  if (mood === 'angry' || mood === 'scared') {
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, R * 0.42);
    ctx.beginPath();
    // le sourcil descend vers le nez
    const up = mood === 'angry' ? 1 : -1;
    ctx.moveTo(x + side * R * 1.05, y - R * (1.25 + 0.3 * up));
    ctx.lineTo(x - side * R * 1.05, y - R * (1.25 - 0.3 * up));
    ctx.stroke();
  }
}

/* ---------- La tête ---------- */
function pushEyes(items, ctx, V, f, y, lat, R, H, mood, blink) {
  for (const side of [1, -1]) {
    // un œil ne se voit que s'il est tourné vers nous
    const facing = side * V.c * 0.95 + V.s * 0.75;
    if (facing < -0.02) continue;
    items.push({
      d: depth(V, f, side * lat) + 0.3,
      draw: () => {
        const p = proj(V, f, y, side * lat);
        const lookX = V.c;
        drawEye(ctx, p.x, p.y, R, H.iris, mood, blink, lookX, (V.c * side > 0 ? 1 : -1) * (V.s > 0.5 ? -side : 1));
      },
    });
  }
}

function pushMamHead(items, ctx, V, P, col, lw, t, e, big) {
  const H = P.head;
  const hc = P.headCol || col;
  const tilt = H.tilt || 0;
  const R = H.D * 0.54;
  const cf = H.x + H.L * 0.08, cy = H.y;
  const tipF = cf + H.L * 0.62 * Math.cos(tilt), tipY = cy + H.L * 0.62 * Math.sin(tilt) + H.D * 0.08;
  const tipR = H.D * Math.max(0.17, 0.4 - (H.snout || 0.5) * 0.22);
  const wid = R * 0.76;
  const fine = big;
  // le crâne
  items.push({ d: depth(V, cf) + 0.1, draw: () => tube(ctx, [proj(V, cf, cy, 0, R), proj(V, cf + (tipF - cf) * 0.28, cy + (tipY - cy) * 0.28, 0, R * 0.92)], hc, lw) });
  // le museau
  items.push({
    d: depth(V, tipF) + 0.12,
    draw: () => {
      tube(ctx, [proj(V, cf + (tipF - cf) * 0.38, cy + (tipY - cy) * 0.38, 0, R * 0.74), proj(V, tipF, tipY, 0, tipR)], H.muzzle === false ? hc : shade(hc, 0.1), lw, { flat: true });
      if (V.s < -0.45 || H.trunk) return;
      const n = proj(V, tipF + tipR * 0.6, tipY - tipR * 0.25, 0);
      ctx.fillStyle = H.noseCol || INK;
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, tipR * V.r * (H.nose === 'groin' ? 0.62 : 0.46), tipR * V.r * 0.36, 0, 0, TAU);
      ctx.fill();
      if (e.mouth > 0.25 && V.s > 0.1) {
        const m = proj(V, tipF + tipR * 0.3, tipY + tipR * 0.8, 0);
        ctx.fillStyle = '#6E2A2E';
        ctx.strokeStyle = INK;
        ctx.lineWidth = lw * 0.7;
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, tipR * V.r * 0.7, tipR * V.r * 0.42 * e.mouth, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    },
  });
  // les oreilles
  for (const side of [1, -1]) {
    const ef = cf - H.L * 0.14, ey = cy - R * 0.68, el = side * wid * 0.85;
    const k = H.earR || 1;
    const dEar = depth(V, ef, el) + 0.13;
    const ear = H.ear;
    if (!ear || ear === 'none') continue;
    if (ear === 'elephant') {
      items.push({ d: depth(V, ef - 0.12, el) + 0.05, draw: () => tube(ctx, [proj(V, ef, cy - R * 0.12, side * R * 0.9, H.D * 0.34 * k), proj(V, ef - 0.08, cy, side * R * 1.3, H.D * 0.28 * k)], shade(hc, -0.06), lw, { flat: true }) });
    } else if (ear === 'rond' || ear === 'petit') {
      const er = H.D * (ear === 'petit' ? 0.12 : 0.21) * k;
      items.push({ d: dEar, draw: () => tube(ctx, [proj(V, ef, ey, el, er)], hc, lw, { flat: true }) });
    } else {
      const L = ear === 'long' ? 1.1 : ear === 'cheval' ? 0.5 : 0.55;
      const w0 = ear === 'long' ? 0.17 : 0.15;
      items.push({ d: dEar, draw: () => tube(ctx, [proj(V, ef, ey + 0.02, el, H.D * w0 * Math.max(0.7, k)), proj(V, ef - 0.03, ey - H.D * L * k * 0.55, el * 1.1, H.D * w0 * 0.7), proj(V, ef - 0.05, ey - H.D * L * k, el * 1.18, H.D * 0.02)], hc, lw, { flat: true }) });
    }
  }
  // les cornes et les bois
  if (H.horns === 'rhino') {
    items.push({ d: depth(V, tipF) + 0.2, draw: () => {
      spike(ctx, [proj(V, tipF - 0.02, tipY - tipR * 0.8, 0, tipR * 0.75), proj(V, tipF, tipY - tipR - 0.26, 0, tipR * 0.42), proj(V, tipF - 0.05, tipY - tipR - 0.62, 0, 0.006)], '#8E7A62', lw);
      spike(ctx, [proj(V, tipF - 0.32, tipY - tipR * 1.15, 0, tipR * 0.5), proj(V, tipF - 0.36, tipY - tipR - 0.3, 0, 0.006)], '#8E7A62', lw);
    } });
  }
  for (const side of [1, -1]) {
    const hl = side * wid * 0.72;
    const hf = cf - H.L * 0.02, hy = cy - R * 0.72;
    const dH = depth(V, hf, hl) + 0.14;
    if (H.horns === 'bison') {
      const k = H.hornL || 1;
      items.push({ d: dH, draw: () => spike(ctx, [proj(V, hf, hy + 0.05, hl * 0.9, 0.05), proj(V, hf + 0.02, hy, side * (wid + 0.2 * k), 0.038), proj(V, hf + 0.06, hy - 0.2 * k, side * (wid + 0.27 * k), 0.006)], HORN, lw) });
    } else if (H.horns === 'gazelle') {
      const k = H.hornL || 1;
      items.push({ d: dH, draw: () => spike(ctx, [proj(V, hf, hy, hl * 0.6, 0.024), proj(V, hf - 0.1 * k, hy - 0.26 * k, hl * 0.8, 0.018), proj(V, hf - 0.24 * k, hy - 0.42 * k, hl * 0.9, 0.004)], '#4A3A2E', lw * 0.8) });
    }
    if (H.antlers) {
      const k = H.antlerK || 1;
      const wide = H.antlers === 'megaceros';
      items.push({ d: dH, draw: () => {
        const beam = wide ? [[0, 0, 0.3], [0.03, 0.2, 0.72], [0.0, 0.3, 1.1]] : [[0, 0, 0.25], [-0.04, 0.28, 0.45], [0.02, 0.55, 0.6]];
        const pts = beam.map(([df, up, out]) => proj(V, hf + df * k, hy - up * k, side * (wid * 0.4 + out * k * 0.5), 0.022));
        spike(ctx, pts, '#D9C6A0', lw * 0.8);
        // les andouillers
        for (const [i, df, up, out] of [[1, 0.12, 0.17, 0.0], [1, -0.08, 0.2, 0.12], [2, 0.1, 0.2, 0.05], [2, -0.06, 0.18, 0.18]]) {
          const b = wide ? [[0, 0, 0.3], [0.03, 0.2, 0.72], [0.0, 0.3, 1.1]][i] : [[0, 0, 0.25], [-0.04, 0.28, 0.45], [0.02, 0.55, 0.6]][i];
          const from = proj(V, hf + b[0] * k, hy - b[1] * k, side * (wid * 0.4 + b[2] * k * 0.5), 0.016);
          const to = proj(V, hf + (b[0] + df) * k, hy - (b[1] + up) * k, side * (wid * 0.4 + (b[2] + out) * k * 0.5), 0.004);
          spike(ctx, [from, to], '#D9C6A0', lw * 0.7);
        }
      } });
    }
  }
  // la trompe, les défenses, les dents de sabre
  if (H.trunk) {
    items.push({ d: depth(V, tipF) + 0.22, draw: () => {
      const pts = [];
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const sw = Math.sin(t * 1.6 + u * 2) * 0.05 * u;
        pts.push(proj(V, tipF + 0.1 * Math.sin(u * 2) + 0.08 * u, tipY + u * H.trunk * 0.72, sw, H.D * (0.24 - u * 0.15)));
      }
      tube(ctx, pts, hc, lw, { flat: true });
    } });
  }
  for (const side of [1, -1]) {
    if (H.tusks) {
      const k = H.tuskL || 0.7;
      const down = H.tusks === 'deino';
      items.push({ d: depth(V, tipF + 0.25, side * 0.2) + 0.24, draw: () => {
        const bf = cf + H.L * 0.3, by = tipY - 0.05, bl = side * R * 0.6;
        const pts = down
          ? [proj(V, bf, by + 0.2, bl * 0.8, 0.04), proj(V, bf + 0.03, by + 0.2 + k * 0.5, bl * 0.8, 0.032), proj(V, bf - 0.1, by + 0.2 + k * 0.85, bl * 0.8, 0.008)]
          : [proj(V, bf, by, bl, 0.055), proj(V, bf + k * 0.45, by + k * 0.42, bl * 1.35, 0.05), proj(V, bf + k * 0.95, by + k * 0.2, bl * 1.3, 0.034), proj(V, bf + k * 1.15, by - k * 0.28, bl * 0.95, 0.006)];
        spike(ctx, pts, '#F4ECD8', lw);
      } });
    }
    if (H.sabers && V.s > -0.4) {
      items.push({ d: depth(V, tipF) + 0.26, draw: () => {
        const f = cf + (tipF - cf) * 0.82, y = tipY + tipR * 0.4;
        spike(ctx, [proj(V, f, y, side * tipR * 0.6, 0.03), proj(V, f + 0.01, y + H.sabers * 0.4, side * tipR * 0.6, 0.022), proj(V, f - 0.02, y + H.sabers * 0.72, side * tipR * 0.6, 0.004)], '#F4ECD8', lw * 0.8);
      } });
    }
  }
  if (H.beard) {
    items.push({ d: depth(V, tipF) + 0.15, draw: () => tube(ctx, [proj(V, cf + (tipF - cf) * 0.5, cy + R * 0.6, 0, H.D * 0.18), proj(V, cf + (tipF - cf) * 0.45, cy + R * 1.25, 0, H.D * 0.05)], shade(hc, -0.3), lw, { flat: true }) });
  }
  if (H.tuft) {
    items.push({ d: depth(V, cf) + 0.16, draw: () => tube(ctx, [proj(V, cf - 0.03, cy - R * 0.95, 0, H.D * 0.18), proj(V, cf - 0.08, cy - R * 1.25, 0, H.D * 0.05)], shade(hc, -0.3), lw, { flat: true }) });
  }
  // les yeux (de dos, on ne les voit pas)
  if (fine) pushEyes(items, ctx, V, cf + H.L * 0.2, cy - R * 0.2, wid * 0.88, Math.min(0.13, Math.max(0.055, (H.eyeR || 0.1) * H.D * 1.5)) * V.r * (e.cute ? 1.25 : 1), H, e.mood, e.blink || 0);
}

function pushDinoHead(items, ctx, V, P, col, lw, t, e, big) {
  const H = P.head;
  const tilt = H.tilt || 0;
  const R = H.D * 0.55;
  const cf = H.x + H.L * 0.16, cy = H.y;
  const tipF = H.x + H.L * 0.86 * Math.cos(tilt), tipY = H.y + H.L * 0.86 * Math.sin(tilt) + H.D * 0.08;
  const tipR = R * (H.taper || 0.7) * 0.62;
  const wid = R * 0.72;
  if (P.frill) {
    items.push({ d: depth(V, cf - 0.15) + 0.02, draw: () => {
      const a = proj(V, cf - 0.1, cy - R * 0.5, 0);
      ctx.fillStyle = P.frillCol || shade(col, -0.2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, V.r * (0.2 + 0.3 * Math.abs(V.s)), V.r * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    } });
  }
  items.push({ d: depth(V, cf) + 0.1, draw: () => tube(ctx, [proj(V, cf - H.L * 0.1, cy, 0, R), proj(V, cf + H.L * 0.2, cy + (tipY - cy) * 0.3, 0, R * 0.92)], col, lw) });
  items.push({
    d: depth(V, tipF) + 0.12,
    draw: () => {
      const tip = H.beak || H.bill ? shade(col, 0.28) : col;
      tube(ctx, [proj(V, cf + H.L * 0.24, cy + (tipY - cy) * 0.35, 0, R * 0.8), proj(V, tipF, tipY, 0, tipR)], tip, lw, { flat: true });
      if (V.s < -0.45) return;
      // la gueule : les dents, ou la bouche ouverte
      if (H.teeth && V.s > 0.05) {
        const m = proj(V, tipF + tipR * 0.3, tipY + tipR * 0.55, 0);
        const w = tipR * V.r * 0.9;
        ctx.strokeStyle = INK;
        ctx.lineWidth = lw * 0.8;
        ctx.fillStyle = e.mouth > 0.25 ? '#6E2A2E' : '#F7F1E0';
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, w, w * (0.24 + e.mouth * 0.5), 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      const n = proj(V, tipF, tipY - tipR * 0.55, 0);
      ctx.fillStyle = INK;
      for (const k of [-0.32, 0.32]) {
        ctx.beginPath();
        ctx.arc(n.x + k * tipR * V.r * Math.abs(V.s), n.y, Math.max(0.8, tipR * V.r * 0.12), 0, TAU);
        ctx.fill();
      }
    },
  });
  if (H.horn) items.push({ d: depth(V, tipF) + 0.2, draw: () => spike(ctx, [proj(V, tipF - 0.14, tipY - tipR * 0.9, 0, 0.05), proj(V, tipF - 0.12, tipY - tipR - 0.22, 0, 0.006)], HORN, lw) });
  if (P.frill) {
    items.push({ d: depth(V, tipF) + 0.2, draw: () => spike(ctx, [proj(V, tipF - 0.02, tipY - tipR, 0, 0.04), proj(V, tipF + 0.02, tipY - tipR - 0.18, 0, 0.006)], HORN, lw) });
    for (const side of [1, -1]) items.push({ d: depth(V, cf, side * wid) + 0.2, draw: () => spike(ctx, [proj(V, cf, cy - R * 0.8, side * wid * 0.7, 0.055), proj(V, cf + 0.25, cy - R * 1.3, side * wid * 0.9, 0.035), proj(V, cf + 0.5, cy - R * 1.5, side * wid, 0.006)], HORN, lw) });
  }
  if (H.dome) items.push({ d: depth(V, cf) + 0.16, draw: () => tube(ctx, [proj(V, cf, cy - R * 0.72, 0, R * 0.72)], shade(col, 0.2), lw, { flat: true }) });
  if (H.crest === 'tube') items.push({ d: depth(V, cf - 0.3) + 0.12, draw: () => tube(ctx, [proj(V, cf, cy - R * 0.5, 0, 0.055), proj(V, cf - 0.45, cy - R * 1.1, 0, 0.05), proj(V, cf - 0.8, cy - R * 1.1, 0, 0.03)], H.crestCol || shade(col, -0.2), lw, { flat: true }) });
  if (H.crest === 'feathers' || H.crest === 'sail') items.push({ d: depth(V, cf) + 0.15, draw: () => tube(ctx, [proj(V, cf - 0.05, cy - R * 0.85, 0, R * 0.26), proj(V, cf - 0.15, cy - R * 1.4, 0, 0.012)], H.crest === 'sail' ? '#D2553C' : '#E8A33A', lw, { flat: true }) });
  if (H.crest === 'lacrimal') {
    for (const side of [1, -1]) items.push({ d: depth(V, cf, side * wid) + 0.15, draw: () => spike(ctx, [proj(V, cf + 0.08, cy - R * 0.72, side * wid * 0.75, 0.05), proj(V, cf + 0.06, cy - R * 1.08, side * wid * 0.85, 0.008)], H.crestCol || shade(col, -0.2), lw) });
  }
  if (big) pushEyes(items, ctx, V, cf + H.L * 0.12, cy - R * 0.36, wid * 0.95, Math.min(0.13, Math.max(0.05, (H.eyeR || 0.1) * H.D * 1.1)) * V.r * (e.cute ? 1.3 : 1), H, e.mood, e.blink || 0);
}

function pushBirdHead(items, ctx, V, P, col, lw, e, big) {
  const H = P.head;
  items.push({ d: depth(V, H.x) + 0.1, draw: () => tube(ctx, [proj(V, H.x, H.y, 0, H.R)], col, lw) });
  items.push({ d: depth(V, H.x + H.beakL) + 0.12, draw: () => spike(ctx, [proj(V, H.x + H.R * 0.4, H.y + 0.02, 0, H.beakD * 0.42), proj(V, H.x + H.R * 0.4 + H.beakL, H.y + H.beakD * 0.25, 0, 0.012)], P.beakCol || '#D9A441', lw) });
  if (big) pushEyes(items, ctx, V, H.x + H.R * 0.3, H.y - H.R * 0.25, H.R * 0.7, H.R * 0.3 * V.r, { iris: '#D9A441' }, e.mood, e.blink || 0);
}

/* ---------- La queue ---------- */
function tailPts(V, M, P, t, e) {
  const pts = [];
  const wag = Math.sin(t * (e.speed > 0.2 ? 6 : 2.2)) * (0.1 + 0.1 * (e.speed || 0));
  if (M.kind === 'mam') {
    const T = P.tail;
    if (!T) return { pts, T: null };
    let f = P.hip[0] - P.depth * 0.95, y = P.hip[1] - P.depth * 0.2;
    let a = T.droop || 0;
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const bulge = T.type === 'touffue' ? 1 + Math.sin(u * Math.PI) * 0.9 : T.type === 'crin' ? 1 + u * 1.5 : 1;
      pts.push(proj(V, f, y, wag * u * T.len, T.w * bulge * (T.type === 'touffue' ? 1 - u * 0.3 : 1 - u * 0.35)));
      const step = T.len / n;
      f -= Math.cos(a) * step;
      y += Math.sin(a) * step;
      a += (T.curl || 0) * 0.35;
    }
    return { pts, T };
  }
  if (M.kind === 'bird') {
    const b = P.body;
    return { pts: [b[2], b[1], b[0]].map(([f, y, s, u]) => proj(V, f, y, 0, (s + u) / 2 * 0.8)), T: {} };
  }
  const [hx, hy] = P.hip;
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push(proj(V, hx - P.depth * 0.4 - u * P.tail, hy - (P.tailLift || 0) * u + u * u * 0.12, Math.sin(u * 3 + t * 2.5) * 0.12 * u * (1 + (e.speed || 0)), Math.max(0.012, P.tailW * Math.pow(1 - u, 1.15))));
  }
  return { pts, T: {} };
}

/* ---------- L'animal entier ---------- */
/** Dessine l'animal en volume. e : x, y, angle, size, walk, speed, mood, mouth, blink, cute ;
    pal : { col, belly, stripe } */
export function drawVolume(ctx, e, B, pal, t) {
  const P = B.P;
  const M = modelOf(B);
  const col = P.wool || pal.col;
  const stripe = pal.stripe || P.stripeCol || shade(pal.col, -0.3);
  const legCol = P.legCol || (P.wool ? P.headCol : pal.col) || pal.col;
  const m = ctx.getTransform();
  const big = e.size * Math.hypot(m.a, m.b) > 26;
  const lw = Math.max(0.8, e.size * 0.03);
  const ph = (e.walk || 0) * (P.cadence || 2);
  const bob = Math.abs(Math.cos(ph)) * 0.02 * Math.min(1, e.speed || 0);
  const V = makeView({ x: e.x, y: e.y - bob * e.size, angle: e.angle, size: e.size });
  const items = [];

  // l'ombre au sol, posée selon sa direction
  const hipF = M.trunk[0].f, noseF = M.head.x + (M.head.L || 0.4) * 0.6;
  const midF = (hipF + noseF) / 2, half = (noseF - hipF) / 2 + 0.12;
  const sc = proj(makeView(e), midF, P.ground, 0);
  const W = (M.lat + 0.32);
  ctx.save();
  ctx.fillStyle = 'rgba(0, 25, 15, 0.22)';
  ctx.transform(V.c * half * V.r, V.s * half * V.r * CAM_TILT, -V.s * W * V.r, V.c * W * V.r * CAM_TILT, sc.x, sc.y);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, TAU);
  ctx.fill();
  ctx.restore();

  // les pattes (chacune à sa profondeur : celle de derrière passe sous le corps)
  for (const leg of M.legs) {
    const near = leg.l * V.c + leg.f * V.s;
    const lc = near < depth(V, (M.trunk[0].f + M.trunk[3].f) / 2) ? shade(legCol, -0.16) : legCol;
    items.push({ d: depth(V, leg.f, leg.l * M.lat) * 0.92, draw: () => drawLeg(ctx, V, M, P, leg, ph, lc, lw, big) });
  }

  // la queue
  const { pts: tail, T } = tailPts(V, M, P, t, e);
  if (tail.length) {
    items.push({
      d: depth(V, M.trunk[0].f - 0.3),
      draw: () => {
        const tailCol = T.type === 'crin' ? shade(pal.col, -0.45) : col === P.wool ? P.wool : pal.col;
        tube(ctx, tail, tailCol, lw, { flat: T.type !== 'touffue' });
        const end = tail[tail.length - 1];
        if (T.type === 'touffe' || T.type === 'pompon') {
          ctx.fillStyle = T.type === 'pompon' ? '#FFFFFF' : shade(pal.col, -0.45);
          ctx.strokeStyle = INK;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.arc(end.x, end.y, Math.max(1.5, (T.w * 1.5) * V.r), 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
        if (P.thagomizer) {
          const a = tail[tail.length - 2];
          for (const s of [1, -1]) {
            const o = proj(V, 0, 0, s * 0.3);
            spike(ctx, [{ x: a.x, y: a.y, r: V.r * 0.04 }, { x: a.x + (o.x - V.x), y: a.y + (o.y - V.y) - V.r * 0.2, r: 0.5 }], HORN, lw);
          }
        }
        if (P.club) tube(ctx, [{ x: end.x, y: end.y, r: V.r * 0.2 }], shade(pal.col, -0.1), lw);
      },
    });
  }

  // le corps
  const trunkPts = () => M.trunk.map((b) => proj(V, b.f, b.y, 0, b.r));
  const cf = (M.trunk[0].f + M.trunk[M.trunk.length - 1].f) / 2;
  items.push({
    d: depth(V, cf),
    draw: () => {
      if (P.sail) drawRidge(ctx, V, M, 1, P.sail, P.sailCol || '#D2553C', lw, 1);
      tube(ctx, trunkPts(), col, lw);
      if (big) drawMarks(ctx, V, M, P, stripe, lw);
      if (P.cape) {
        // l'avant du corps, couvert d'une toison plus sombre
        const n = M.trunk.length;
        tube(ctx, [M.trunk[n - 2], M.trunk[n - 1]].map((b) => proj(V, b.f, b.y, 0, b.r * 0.96)), shade(pal.col, -0.2), lw * 0.2, { ink: shade(pal.col, -0.3) });
      }
      if (P.wool && big) {
        // la laine : de petites boules
        ctx.fillStyle = P.wool;
        ctx.strokeStyle = shade(P.wool, -0.16);
        ctx.lineWidth = lw * 0.6;
        for (let i = 0; i < 14; i++) {
          const b = trunkAt(M, (i * 0.618) % 1);
          const th = ((i * 2.39) % 3) - 1.5;
          const p = proj(V, b.f, b.y - b.r * 0.82 * Math.cos(th), b.r * 0.82 * Math.sin(th));
          ctx.beginPath();
          ctx.arc(p.x, p.y, b.r * V.r * 0.3, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
      }
      if (P.shaggy && big) {
        // les longs poils qui pendent sur les côtés
        ctx.fillStyle = shade(pal.col, -0.26);
        for (const s of [1, -1]) {
          for (let i = 0; i < 7; i++) {
            const b = trunkAt(M, (i + 0.5) / 7);
            const a = proj(V, b.f - 0.05, b.y + b.r * 0.38, s * b.r * 0.86), c = proj(V, b.f + 0.05, b.y + b.r * 0.38, s * b.r * 0.86);
            const tip = proj(V, b.f, b.y + b.r * 0.42 + P.shaggy, s * b.r * 0.9);
            const w = Math.abs(V.s) * V.r * 0.05;
            ctx.beginPath();
            ctx.moveTo(a.x - w, a.y);
            ctx.lineTo(tip.x, tip.y);
            ctx.lineTo(c.x + w, c.y);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      if (V.s > 0.2 && !P.wool && (pal.belly || P.bellyCol)) {
        const b = M.trunk[M.trunk.length - 1];
        const p = proj(V, b.f + b.r * 0.55, b.y + b.r * 0.3, 0);
        ctx.fillStyle = pal.belly || P.bellyCol;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, b.r * V.r * 0.58, b.r * V.r * 0.66, 0, 0, TAU);
        ctx.fill();
      }
      if (P.plates) drawRidge(ctx, V, M, 7, 0.42, P.plateCol || '#D9734E', lw);
      if (P.ridge) drawRidge(ctx, V, M, 8, 0.08, shade(pal.col, -0.35), lw * 0.6);
      if (P.armor || P.backHorns) drawRidge(ctx, V, M, 6, 0.14, HORN, lw);
    },
  });

  // le cou et la tête
  const neckF = M.neck[M.neck.length - 1].f;
  items.push({
    d: depth(V, (M.trunk[M.trunk.length - 1].f + neckF) / 2),
    draw: () => {
      tube(ctx, M.neck.map((b) => proj(V, b.f, b.y, 0, b.r)), P.headCol || pal.col, lw);
      if (P.mane) {
        // la crinière, le long du cou
        const pts = M.neck.slice(1).map((b) => proj(V, b.f - b.r * 0.4, b.y - b.r * 0.85, 0, 0.05));
        if (pts.length > 1) tube(ctx, pts, shade(pal.col, -0.42), lw * 0.6, { flat: true });
      }
    },
  });
  if (M.kind === 'mam') pushMamHead(items, ctx, V, P, pal.col, lw, t, e, big);
  else if (M.kind === 'bird') pushBirdHead(items, ctx, V, P, pal.col, lw, e, big);
  else pushDinoHead(items, ctx, V, P, pal.col, lw, t, e, big);

  // du plus loin au plus près
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.draw();
}

/* Un lézard, un tétrapode ou un reptile : comme un petit mammifère, mais les pattes sur les côtés */
const LOW = (o) => ({
  ground: 0.42, hip: [-0.5, 0.04], shoulder: [0.42, 0.04], depth: 0.27, sprawl: 1.25,
  neck: [[0.6, 0.02, 0.2], [0.7, 0, 0.19]],
  head: { x: 0.8, y: -0.02, L: 0.62, D: 0.4, snout: 0.55, ear: 'none', eye: [0.15, -0.2], eyeR: 0.16, muzzle: false },
  legs: 'patte', legW: 0.075, stride: 0.26, cadence: 2.5,
  tail: { len: 1.5, w: 0.13, droop: 0.12, type: 'fine' },
  ...o,
});
Object.assign(BODIES, {
  lezard: { family: 'mam', P: LOW({}) },
  tetrapode: { family: 'mam', P: LOW({ depth: 0.31, tail: { len: 1.2, w: 0.16, droop: 0.1, type: 'fine' } }) },
  reptile: { family: 'mam', P: LOW({}) },
});
