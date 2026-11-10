// ============================================================================
// Évolution — les animaux VUS DE CÔTÉ : la voie des airs (les oiseaux) et la
// voie des reptiles (la jungle). Ici, le monde est vu de profil (voir
// cote.js) : les oiseaux volent dans le ciel et se posent sur les falaises,
// les reptiles grimpent aux arbres et plongent dans les rivières.
//
// Un dessinateur par grande famille, et chaque espèce n'est qu'une liste de
// mesures (ANIMAUX_C) :
//   - les oiseaux (drawBird) : le corps rond, le cou, la tête et le bec, les
//     ailes qui battent (ou repliées sur le dos), la queue en éventail, les
//     pattes fines qui marchent ;
//   - les reptiles (drawReptile) : un long corps souple (lézard, crocodile,
//     varan, caméléon… et serpent, sans pattes), la gueule qui s'ouvre, les
//     pattes écartées qui marchent en diagonale, qui s'accrochent au tronc ;
//   - les tortues (drawTurtle), les poissons (drawFishSide), les insectes ;
//   - la nourriture posée par terre (graines, fruits, œufs, carcasses), et le
//     nid avec ses œufs ou ses petits qui réclament.
// Les mammifères et les humains de profil viennent d'art-profil.js (le même
// dessin que dans les intros).
//
// Repère : l'animal regarde vers la droite, (0, 0) = le milieu du corps,
// tout est en × c.size ; il se retourne (face = -1) et se penche (pitch).
// Les looks s'appellent « vc-<nom> ».
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SNOUT, shade, smoothClosed } from './art.js';
import { drawMammal, drawPerson } from './art-profil.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;

export const STAND = {};           // look ou forme → des pieds au milieu du corps (× taille) : pour poser l'animal par terre
export const MOUTH = {};           // look ou forme → la gueule (× taille, l'animal tourné vers la droite, sans pencher)
export const FLIERS = new Set();   // les looks qui volent (dans les vignettes : les ailes ouvertes)

/* Quand un animal est tout petit à l'écran, on saute les détails invisibles */
let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 13;
}

/** Le sens et la pente : face = 1 (vers la droite) ou -1 ; pitch < 0 = le nez vers le haut */
export function sidePose(c) {
  const face = c.face || (Math.cos(c.angle || 0) >= 0 ? 1 : -1);
  let pitch = face > 0 ? (c.angle || 0) : Math.PI - (c.angle || 0);
  pitch = Math.atan2(Math.sin(pitch), Math.cos(pitch));
  const loco = c.loco || (FLIERS.has(c.sp?.look) ? 'vol' : 'sol');
  const lim = loco === 'grimpe' ? 1.65 : loco === 'sol' || loco === 'surface' ? 0.45 : 1.2;
  return { face, pitch: clamp(pitch, -lim, lim), loco };
}

/** La gueule d'un animal vu de côté, dans le monde (pour savoir ce qu'il croque) */
export function sideMouth(e, look) {
  const m = MOUTH[look];
  if (!m) return null;
  const { face, pitch, loco } = sidePose(e);
  const tilt = loco === 'sol' || loco === 'surface' ? (m.tilt || 0) : 0;
  const a = pitch + tilt;
  const x = m.x * Math.cos(a) - m.y * Math.sin(a), y = m.x * Math.sin(a) + m.y * Math.cos(a);
  return { x: e.x + x * e.size * face, y: e.y + y * e.size };
}

/* ============================================================================
   Petits outils de dessin
   ============================================================================ */
function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
}

/** Une « gélule » : deux cercles reliés par leurs tangentes (un os avec ses muscles) */
function capsule(ctx, x1, y1, r1, x2, y2, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const d = Math.hypot(x2 - x1, y2 - y1) || 1e-6;
  const s = Math.asin(clamp((r1 - r2) / d, -1, 1));
  const a0 = a + Math.PI / 2 - s;
  ctx.moveTo(x1 + Math.cos(a0) * r1, y1 + Math.sin(a0) * r1);
  ctx.arc(x1, y1, r1, a0, a + Math.PI * 1.5 + s);
  ctx.arc(x2, y2, r2, a - Math.PI / 2 + s, a + Math.PI / 2 - s);
  ctx.closePath();
}

/** Un membre fait d'os : [[x, y, épaisseur]…]. Le contour d'abord, la couleur par-dessus */
function limb(ctx, segs, col, dark, lw) {
  ctx.beginPath();
  for (let i = 0; i + 1 < segs.length; i++) {
    const [x1, y1, r1] = segs[i], [x2, y2, r2] = segs[i + 1];
    capsule(ctx, x1, y1, r1, x2, y2, r2);
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 2;
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
}

/** Le genou (ou le coude) d'un membre à deux os, de a vers b. dir = 1 ou -1 : de quel côté il plie */
function joint(ax, ay, bx, by, l1, l2, dir) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.max(1e-6, Math.min(Math.hypot(dx, dy), (l1 + l2) * 0.999));
  const k = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a = Math.atan2(dy, dx) - dir * Math.acos(k);
  return { x: ax + Math.cos(a) * l1, y: ay + Math.sin(a) * l1 };
}

/** Le corps d'un seul tenant : pts = [x, y, épaisseur au-dessus, épaisseur en dessous] (× r) */
function tubePoly(pts, r) {
  const poly = [];
  for (const p of pts) poly.push({ x: p[0] * r, y: (p[1] - p[2]) * r });
  for (let i = pts.length - 1; i >= 0; i--) poly.push({ x: pts[i][0] * r, y: (pts[i][1] + pts[i][3]) * r });
  return poly;
}

/** Ajoute un contour lissé au chemin en cours (sans beginPath) */
function addSmooth(ctx, poly) {
  const n = poly.length;
  const m0 = { x: (poly[n - 1].x + poly[0].x) / 2, y: (poly[n - 1].y + poly[0].y) / 2 };
  ctx.moveTo(m0.x, m0.y);
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  ctx.closePath();
}

/** Dos plus sombre, ventre clair : ça donne du volume (on n'est pas une feuille de papier !) */
function volume(ctx, top, bottom, col, belly) {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, shade(col, -0.22));
  g.addColorStop(0.38, col);
  g.addColorStop(0.72, belly);
  g.addColorStop(1, shade(belly, -0.08));
  return g;
}

/** Un œil vu de profil : le sourcil est au-dessus. o : { iris, ring, cute } */
function sideEye(ctx, x, y, R, mood, blink, o = {}) {
  if (o.ring) {
    ctx.fillStyle = o.ring;
    circle(ctx, x, y, R * 1.38);
    ctx.fill();
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.6, R * 0.2);
  ctx.beginPath();
  ctx.ellipse(x, y, R, Math.max(0.1, R * (1 - blink * 0.9)), 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (blink < 0.6) {
    const pr = R * (o.cute ? 0.64 : 0.56) * (mood === 'scared' ? 0.72 : 1);
    const px = x + R * 0.24, py = y + R * 0.04;
    if (o.iris) {
      ctx.fillStyle = o.iris;
      circle(ctx, px, py, pr);
      ctx.fill();
      ctx.fillStyle = INK;
      circle(ctx, px + pr * 0.1, py, pr * 0.55);
      ctx.fill();
    } else {
      ctx.fillStyle = INK;
      circle(ctx, px, py, pr);
      ctx.fill();
    }
    ctx.fillStyle = '#FFFFFF';
    circle(ctx, px - pr * 0.3, py - pr * 0.35, pr * 0.36);
    ctx.fill();
    if (o.cute) {
      circle(ctx, px + pr * 0.35, py + pr * 0.35, pr * 0.16);
      ctx.fill();
    }
  }
  if (mood === 'angry' || mood === 'scared') {
    // fâché : le bout de devant descend ; apeuré : il remonte
    const tilt = mood === 'angry' ? 1 : -1;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(0.8, R * 0.36);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - R * 0.95, y - R * 1.3 - tilt * R * 0.28);
    ctx.lineTo(x + R * 0.95, y - R * 1.3 + tilt * R * 0.28);
    ctx.stroke();
  }
}

/** La joue rose du joueur (il est mignon !) */
function cheek(ctx, x, y, R) {
  ctx.fillStyle = PLAYER.cheek || 'rgba(255, 120, 150, 0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y, R, R * 0.62, 0, 0, TAU);
  ctx.fill();
}

/* ============================================================================
   LES OISEAUX
   S : { a, b (demi-longueur, demi-hauteur du corps), tilt (penché en arrière
         quand il est posé), neck { L, up, w }, head { r, col, bald, crest,
         mask, ruff }, beak { L, D, col, curve, hook, teeth, cere }, wing { L,
         chord, n, col, tip, bar }, tail { L, n, spread, up, col }, legs { L,
         col, w, toes, pants, talons }, eye { k, iris, ring }, flightless }
   ============================================================================ */
const BIRD0 = {
  a: 0.8, b: 0.56, tilt: -0.16,
  neck: { L: 0.3, up: 1.05, w: 0.28 },
  head: { r: 0.36 },
  beak: { L: 0.4, D: 0.24, col: '#E6B24C', curve: 0.18, hook: 0 },
  wing: { L: 1.35, chord: 0.62, n: 5 },
  tail: { L: 0.55, n: 5, spread: 0.45, up: 0.18 },
  legs: { L: 0.6, col: '#E3A447', w: 0.055, toes: 0.24 },
  eye: { k: 0.3 },
};
function bird(o) {
  const S = { ...BIRD0, ...o, kind: 'oiseau' };
  for (const k of ['neck', 'head', 'beak', 'wing', 'tail', 'legs', 'eye']) S[k] = { ...BIRD0[k], ...(o[k] || {}) };
  return S;
}

/** L'aile ouverte (vue de côté, elle bat de haut en bas) : l'épaule en (0, 0), elle monte vers le haut et l'arrière */
function wingPoly(L, C, n) {
  const tip = { x: -0.42 * L, y: -1.0 * L };
  const end = { x: -C * 1.12, y: -0.36 * L };
  const pts = [{ x: 0.26 * C, y: 0.06 * C }, { x: 0.32 * C, y: -0.42 * L }, { x: -0.04 * L, y: -0.8 * L }, tip];
  // le bout de l'aile en « doigts » : les grandes plumes
  for (let k = 1; k <= n; k++) {
    const u = k / n;
    const p = { x: lerp(tip.x, end.x, u), y: lerp(tip.y, end.y, u) };
    const m = { x: lerp(tip.x, end.x, u - 0.5 / n), y: lerp(tip.y, end.y, u - 0.5 / n) };
    // l'encoche entre deux plumes, un peu vers l'intérieur de l'aile
    pts.push({ x: lerp(m.x, -0.2 * L, 0.14), y: lerp(m.y, -0.5 * L, 0.14) });
    pts.push(p);
  }
  pts.push({ x: -C * 1.08, y: -0.12 * L }, { x: -C * 0.86, y: 0.08 * C });
  return pts;
}

function drawWingOpen(ctx, sx, sy, s, W, r, col, tipCol, dark, lw, far) {
  const L = W.L * r, C = W.chord * r;
  // le battement : on « aplatit » l'aile (k de 1 à -1) au lieu de la tourner
  const k = Math.sign(s || 1) * Math.max(0.14, Math.abs(s));
  const P = (p) => ({ x: sx + p.x * Math.cos(-0.12) - p.y * k * Math.sin(-0.12), y: sy + p.x * Math.sin(-0.12) + p.y * k * Math.cos(-0.12) });
  const pts = wingPoly(L, C, W.n || 5).map(P);
  const root = P({ x: 0, y: 0 }), tip = P({ x: -0.42 * L, y: -L });
  const g = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  g.addColorStop(0, far ? shade(col, -0.25) : col);
  g.addColorStop(0.55, far ? shade(col, -0.3) : shade(col, -0.05));
  g.addColorStop(1, far ? shade(tipCol, -0.25) : tipCol);
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine && !far && Math.abs(k) > 0.3) {
    // la bande claire du haut de l'aile, et les lignes des plumes
    const a = P({ x: 0.12 * C, y: -0.12 * L }), b = P({ x: 0.12 * C, y: -0.5 * L }), e = P({ x: -0.12 * L, y: -0.74 * L });
    ctx.strokeStyle = W.bar || 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = Math.max(0.6, C * 0.16 * Math.abs(k));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(b.x, b.y, e.x, e.y);
    ctx.stroke();
    const m = P({ x: -0.05 * L, y: -0.4 * L });
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = Math.max(0.5, lw * 0.6);
    ctx.beginPath();
    for (let i = 5; i < pts.length - 2; i += 2) {
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(lerp(pts[i].x, m.x, 0.45), lerp(pts[i].y, m.y, 0.45));
    }
    ctx.stroke();
  }
}

/** L'aile repliée sur le flanc (posé, ou sur l'eau) */
function drawWingFolded(ctx, S, r, col, tipCol, dark, lw, k = 1) {
  const a = S.a, b = S.b, wl = (S.wing.fold ?? 1.25) * k;
  const pts = [
    { x: 0.52 * a, y: -0.56 * b }, { x: 0.36 * a, y: 0.18 * b }, { x: -0.25 * a, y: 0.42 * b },
    { x: -wl * a, y: 0.14 * b }, { x: -(wl + 0.05) * a, y: 0.02 * b }, { x: -0.62 * a, y: -0.5 * b },
  ].map((p) => ({ x: p.x * r, y: p.y * r }));
  const g = ctx.createLinearGradient(0.5 * a * r, 0, -wl * a * r, 0);
  g.addColorStop(0, col);
  g.addColorStop(0.55, shade(col, -0.06));
  g.addColorStop(1, tipCol);
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, pts);
  ctx.fill();
  ctx.stroke();
  if (!fine) return;
  // les rangées de plumes : les couvertures, puis les grandes plumes du bout
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = Math.max(0.5, lw * 0.6);
  ctx.beginPath();
  for (const u of [0.15, -0.25, -0.6]) {
    ctx.moveTo((u + 0.12) * a * r, -0.48 * b * r);
    ctx.quadraticCurveTo((u - 0.08) * a * r, 0.0, (u + 0.08) * a * r, 0.36 * b * r);
  }
  ctx.stroke();
  if (S.wing.bar) {
    ctx.strokeStyle = S.wing.bar;
    ctx.lineWidth = Math.max(0.6, b * r * 0.12);
    ctx.beginPath();
    ctx.moveTo(0.3 * a * r, -0.3 * b * r);
    ctx.quadraticCurveTo(0, 0.1 * b * r, -0.1 * a * r, 0.25 * b * r);
    ctx.stroke();
  }
}

/** La queue en éventail */
function drawBirdTail(ctx, S, r, col, dark, lw, open, t) {
  const T = S.tail;
  if (!T.L) return;
  const bx = -0.92 * S.a * r, by = -0.04 * S.b * r;
  const n = T.n || 5, L = T.L * r;
  const spread = T.spread * (open ? 1.5 : 1);
  const base = Math.PI - (T.up || 0) + Math.sin(t * 2.3) * 0.04;
  const tc = T.col || shade(col, -0.18);
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) - 0.5 : 0;
    const a = base + u * spread;
    const len = L * (1 - Math.abs(u) * 0.22) * (T.fork ? 1 + Math.abs(u) * T.fork : 1);
    const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
    const w = Math.max(1, r * (T.w ?? 0.11));
    ctx.fillStyle = i % 2 ? tc : shade(tc, -0.06);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse((bx + ex) / 2, (by + ey) / 2, len / 2, w, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

/** Une patte d'oiseau : la cuisse cachée dans les plumes, le « talon » qui plie vers l'arrière, trois doigts devant */
function birdLeg(ctx, hip, gy, L, ph, k, S, r, col, dark, lw, far) {
  const Lg = S.legs;
  const stride = L * 0.42 * k;
  const sw = Math.sin(ph) * stride;
  const lift = Math.max(0, Math.cos(ph)) * L * 0.28 * k;
  const foot = { x: hip.x + sw + L * 0.05, y: gy - lift };
  const heel = { x: lerp(hip.x, foot.x, 0.45) - L * 0.22, y: lerp(hip.y, foot.y, 0.52) };
  const w = Lg.w * r;
  const lc = far ? shade(col, -0.3) : col;
  if (Lg.pants) {
    // la « culotte » de plumes des rapaces et de l'oiseau-terreur
    limb(ctx, [[hip.x, hip.y, w * 3.2], [heel.x, heel.y, w * 1.6]], far ? shade(Lg.pants, -0.3) : Lg.pants, dark, lw);
  } else {
    limb(ctx, [[hip.x, hip.y, w * 1.5], [heel.x, heel.y, w * 0.95]], lc, dark, lw);
  }
  limb(ctx, [[heel.x, heel.y, w * 0.95], [foot.x, foot.y - w * 0.4, w * 0.8]], lc, dark, lw);
  // les doigts
  const tl = Lg.toes * r;
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = w * 1.1 + lw * 2;
  const toes = [[tl, 0.15], [tl * 0.85, -0.12], [-tl * 0.5, 0.2]];
  const fy = foot.y - w * 0.3;
  ctx.beginPath();
  for (const [l, a] of toes) {
    ctx.moveTo(foot.x, fy);
    ctx.lineTo(foot.x + l * Math.cos(a), fy + Math.abs(l) * Math.sin(Math.abs(a)) * 0.6);
  }
  ctx.stroke();
  ctx.strokeStyle = lc;
  ctx.lineWidth = w * 1.1;
  ctx.stroke();
  if (Lg.talons && fine) {
    ctx.fillStyle = '#2A2420';
    for (const [l, a] of toes) {
      const tx = foot.x + l * Math.cos(a), ty = fy + Math.abs(l) * Math.sin(Math.abs(a)) * 0.6;
      circle(ctx, tx + Math.sign(l) * w * 0.4, ty + w * 0.2, w * 0.55);
      ctx.fill();
    }
  }
}

/** Les pattes repliées sous le ventre, en vol (les rapaces sortent leurs serres pour attraper) */
function birdLegsTucked(ctx, S, r, col, dark, lw, grab) {
  const Lg = S.legs, w = Lg.w * r;
  const hx = -0.15 * S.a * r, hy = 0.7 * S.b * r;
  for (const far of [true, false]) {
    const lc = far ? shade(Lg.col, -0.3) : Lg.col;
    const o = far ? -0.06 * r : 0;
    const fx = grab ? hx + 0.55 * S.a * r : hx - 0.5 * S.a * r, fy = grab ? hy + Lg.L * 0.75 * r : hy + 0.36 * S.b * r;
    limb(ctx, [[hx + o, hy, w * (Lg.pants ? 2 : 1)], [fx + o, fy, w * 0.8]], Lg.pants && !grab ? shade(Lg.pants, far ? -0.3 : 0) : lc, dark, lw);
    if (grab) {
      ctx.strokeStyle = lc;
      ctx.lineWidth = w * 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const a of [-0.5, 0.1, 0.7]) {
        ctx.moveTo(fx + o, fy);
        ctx.lineTo(fx + o + Math.cos(a) * Lg.toes * r, fy + Math.sin(a) * Lg.toes * r);
      }
      ctx.stroke();
    }
  }
}

function drawBird(ctx, c, t, S, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const { face, pitch, loco } = sidePose(c);
  const belly = o.belly || c.sp?.belly || shade(col, 0.35);
  const dark = o.dark ? shade(o.dark, -0.2) : shade(col, -0.55);
  const lw = Math.max(0.7, r * 0.045);
  const wingCol = o.wingCol || S.wing.col || shade(col, -0.08);
  const tipCol = o.tipCol || S.wing.tip || shade(wingCol, -0.35);
  const flying = !S.flightless && (loco === 'vol' || loco === 'chute');
  const onWater = loco === 'surface' || loco === 'eau';
  const k = clamp(c.speed ?? 0, 0, 1.2);
  const a = S.a, b = S.b;

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  if (onWater) ctx.translate(0, Math.sin(t * 2 + (c.seed || 0)) * r * 0.03);
  ctx.rotate(flying ? pitch : pitch * 0.5);
  const tilt = flying ? 0 : S.tilt;
  const bob = !flying && !onWater ? Math.abs(Math.sin((c.walk || 0) * 2.4)) * k * 0.05 * r : 0;
  const gy = STAND[S.look] * r;

  // le battement : de +1 (aile en haut) à -1 (en bas) ; plané : un peu levées
  const flapK = c.flapping === false ? null : (c.flapPh ?? t * (S.flapRate || 9));
  const s = !flying ? 0 : flapK === null ? 0.32 + Math.sin(t * 1.3) * 0.05 : Math.cos(flapK) * 0.95;

  // l'épaule, dans le repère du corps penché
  const rot = (x, y) => ({ x: x * Math.cos(tilt) - y * Math.sin(tilt), y: x * Math.sin(tilt) + y * Math.cos(tilt) });
  const sh = rot(0.36 * a * r, -0.6 * b * r);
  const hip = rot(-0.08 * a * r, 0.62 * b * r);

  // derrière : l'aile du côté caché, la queue, la patte du côté caché
  if (flying) drawWingOpen(ctx, sh.x + 0.1 * r, sh.y - 0.06 * r, s, S.wing, r * (o.wingK || 1), wingCol, tipCol, dark, lw, true);
  ctx.save();
  ctx.rotate(tilt);
  ctx.translate(0, -bob);
  drawBirdTail(ctx, S, r * (o.tailK || 1), o.tailCol || col, dark, lw, flying, t);
  ctx.restore();
  const ph = (c.walk || 0) * (S.cadence || 2.6);
  if (!flying && !onWater && loco !== 'grimpe') {
    birdLeg(ctx, { x: hip.x - 0.05 * r, y: hip.y - bob }, gy, S.legs.L * r * (o.legK || 1), ph + Math.PI, k, S, r, S.legs.col, dark, lw, true);
  }
  if (flying && !S.flightless) {
    birdLegsTucked(ctx, S, r, col, dark, lw, S.legs.talons && (c.state === 'chase' || (c.mouth || 0) > 0.5));
  }

  ctx.save();
  ctx.rotate(tilt);
  ctx.translate(0, -bob);
  // le corps, le cou et la tête, d'un seul contour
  const neck = S.neck;
  const up = flying ? 0.2 : neck.up;
  const nl = neck.L * (flying ? 1.15 : 1);
  const n0 = { x: 0.6 * a * r, y: -0.42 * b * r };
  const hr = S.head.r * r * (o.headK || 1);
  const H = { x: n0.x + Math.cos(-up) * nl * r + hr * 0.35, y: n0.y + Math.sin(-up) * nl * r };
  if (flying) { H.x += 0.12 * r; }
  const body = [
    { x: a, y: -0.08 * b }, { x: 0.78 * a, y: 0.55 * b }, { x: 0.18 * a, y: 0.98 * b }, { x: -0.52 * a, y: 0.74 * b },
    { x: -1.0 * a, y: 0.14 * b }, { x: -0.96 * a, y: -0.3 * b }, { x: -0.3 * a, y: -0.94 * b }, { x: 0.42 * a, y: -0.86 * b },
  ].map((p) => ({ x: p.x * r, y: p.y * r }));
  ctx.beginPath();
  addSmooth(ctx, body);
  capsule(ctx, n0.x, n0.y, neck.w * r, H.x - hr * 0.2, H.y + hr * 0.1, hr * 0.7);
  ctx.moveTo(H.x + hr, H.y);
  ctx.arc(H.x, H.y, hr, 0, TAU);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = volume(ctx, (H.y - hr), b * r, col, belly);
  ctx.fill();
  if (fine) {
    // un reflet sur le dos, et quelques plumes sur la poitrine
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = r * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.6 * a * r, -0.62 * b * r);
    ctx.quadraticCurveTo(0, -0.95 * b * r, 0.45 * a * r, -0.68 * b * r);
    ctx.stroke();
    if (S.pattern === 'bandes' || o.pattern === 'bandes') {
      ctx.strokeStyle = o.stripe || S.stripe || shade(col, -0.3);
      ctx.lineWidth = r * 0.05;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const x = (-0.7 + i * 0.26) * a * r;
        ctx.moveTo(x, 0.1 * b * r);
        ctx.quadraticCurveTo(x - 0.06 * r, 0.5 * b * r, x + 0.02 * r, 0.9 * b * r);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = Math.max(0.5, lw * 0.6);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const x = (0.25 + i * 0.13) * a * r, y = (0.05 + i * 0.16) * b * r;
      ctx.moveTo(x - 0.08 * r, y);
      ctx.quadraticCurveTo(x, y + 0.06 * r, x + 0.08 * r, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  // (head.col, bald) une tête d'une autre couleur (le vautour : la tête nue)
  if (S.head.col || o.headCol) {
    ctx.fillStyle = o.headCol || S.head.col;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(H.x, H.y, hr, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  if (S.head.ruff && fine) {
    // la collerette de plumes blanches à la base du cou
    ctx.fillStyle = S.head.ruff;
    ctx.strokeStyle = shade(S.head.ruff, -0.35);
    ctx.lineWidth = Math.max(0.5, lw * 0.7);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      ctx.moveTo(n0.x + (u - 0.5) * 0.5 * r, n0.y + (u - 0.2) * 0.2 * r);
      ctx.arc(n0.x + (u - 0.5) * 0.45 * r, n0.y + (Math.abs(u - 0.5) - 0.1) * 0.25 * r, 0.12 * r, 0, TAU);
    }
    ctx.fill();
    ctx.stroke();
  }
  if (S.head.mask && fine) {
    ctx.fillStyle = S.head.mask;
    ctx.beginPath();
    ctx.ellipse(H.x + hr * 0.25, H.y - hr * 0.08, hr * 0.62, hr * 0.32, 0.1, 0, TAU);
    ctx.fill();
  }
  // la crête de plumes, sur la tête
  const crest = o.crest || S.head.crest;
  if (crest) {
    ctx.fillStyle = crest.col || shade(col, -0.2);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    for (let i = 0; i < (crest.n || 3); i++) {
      const a0 = -1.9 - i * 0.32;
      const L = hr * (crest.L || 1) * (1 - i * 0.12);
      ctx.beginPath();
      ctx.ellipse(H.x + Math.cos(a0) * (hr + L * 0.4), H.y + Math.sin(a0) * (hr + L * 0.4), L * 0.55, hr * 0.13, a0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();

  // devant : la patte de notre côté, puis l'aile
  if (!flying && !onWater && loco !== 'grimpe') {
    birdLeg(ctx, { x: hip.x + 0.04 * r, y: hip.y - bob }, gy, S.legs.L * r * (o.legK || 1), ph, k, S, r, S.legs.col, dark, lw, false);
  }
  ctx.save();
  ctx.rotate(tilt);
  ctx.translate(0, -bob);
  if (flying) drawWingOpen(ctx, sh.x, sh.y, s, S.wing, r * (o.wingK || 1), wingCol, tipCol, dark, lw, false);
  else drawWingFolded(ctx, S, r, wingCol, tipCol, dark, lw, S.flightless ? 0.7 : 1);
  // la tête par-dessus l'aile qui monte
  drawBirdHead(ctx, c, t, S, r, H, hr, col, belly, dark, lw, o);
  ctx.restore();
  ctx.restore();
}

function drawBirdHead(ctx, c, t, S, r, H, hr, col, belly, dark, lw, o) {
  if (S.head.col || o.headCol) {
    ctx.fillStyle = o.headCol || S.head.col;
  } else {
    const g = ctx.createLinearGradient(0, H.y - hr, 0, H.y + hr);
    g.addColorStop(0, shade(col, -0.12));
    g.addColorStop(0.6, col);
    g.addColorStop(1, belly);
    ctx.fillStyle = g;
  }
  circle(ctx, H.x, H.y, hr * 0.93);
  ctx.fill();
  if (S.head.mask && fine) {
    ctx.fillStyle = S.head.mask;
    ctx.beginPath();
    ctx.ellipse(H.x + hr * 0.25, H.y - hr * 0.08, hr * 0.62, hr * 0.32, 0.1, 0, TAU);
    ctx.fill();
  }
  // le bec : la mâchoire du haut, et celle du bas qui s'ouvre
  const B = S.beak;
  const L = B.L * r * (o.beakK || 1), D = B.D * r * (o.beakK ? Math.sqrt(o.beakK) : 1);
  const bx = H.x + hr * 0.72, by = H.y + hr * 0.12;
  const open = clamp(c.mouth || 0, 0, 1) * (B.gape ?? 0.5);
  const bcol = o.beakCol || B.col;
  const bdark = shade(bcol, -0.5);
  const hinge = { x: bx - hr * 0.1, y: by + D * 0.12 };
  const lower = [
    { x: bx - hr * 0.12, y: by + D * 0.08 }, { x: bx + L * 0.86, y: by + D * (0.18 + B.curve * 0.6) },
    { x: bx + L * 0.3, y: by + D * 0.6 }, { x: bx - hr * 0.1, y: by + D * 0.5 },
  ].map((p) => {
    const dx = p.x - hinge.x, dy = p.y - hinge.y;
    return { x: hinge.x + dx * Math.cos(open) - dy * Math.sin(open), y: hinge.y + dx * Math.sin(open) + dy * Math.cos(open) };
  });
  if (open > 0.05) {
    ctx.fillStyle = '#7A2234';
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y);
    ctx.lineTo(bx + L * 0.85, by + D * 0.2);
    ctx.lineTo(lower[1].x, lower[1].y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = shade(bcol, -0.08);
  ctx.strokeStyle = bdark;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  smoothClosed(ctx, lower);
  ctx.fill();
  ctx.stroke();
  const tipY = by + D * (B.curve + B.hook);
  ctx.fillStyle = bcol;
  ctx.beginPath();
  ctx.moveTo(bx - hr * 0.18, by - D * 0.52);
  ctx.quadraticCurveTo(bx + L * 0.55, by - D * (0.55 - B.curve * 0.3), bx + L, tipY);
  if (B.hook) ctx.quadraticCurveTo(bx + L * 1.02, tipY + D * B.hook * 0.6, bx + L * 0.9, tipY + D * B.hook * 0.3);
  ctx.quadraticCurveTo(bx + L * 0.6, by + D * 0.22, bx - hr * 0.12, by + D * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine) {
    // un reflet sur le bec, la narine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(0.5, D * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx + L * 0.08, by - D * 0.3);
    ctx.quadraticCurveTo(bx + L * 0.4, by - D * 0.36, bx + L * 0.65, by - D * 0.12);
    ctx.stroke();
    ctx.fillStyle = bdark;
    ctx.beginPath();
    ctx.ellipse(bx + L * 0.16, by - D * 0.18, Math.max(0.6, L * 0.05), Math.max(0.4, D * 0.07), -0.2, 0, TAU);
    ctx.fill();
    if (B.cere) {
      ctx.fillStyle = B.cere;
      ctx.beginPath();
      ctx.ellipse(bx, by - D * 0.12, hr * 0.22, D * 0.45, 0, 0, TAU);
      ctx.fill();
    }
    if (B.teeth || o.teeth) {
      // les « dents » en os du pélagornis
      ctx.fillStyle = '#FBF4E2';
      for (let i = 0; i < 7; i++) {
        const u = 0.12 + i * 0.12;
        const x = lerp(bx, bx + L * 0.92, u);
        const y = by + D * (0.16 + B.curve * u * 0.5);
        const h = D * (i % 2 ? 0.16 : 0.26);
        ctx.beginPath();
        ctx.moveTo(x - L * 0.025, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + L * 0.025, y);
        ctx.fill();
      }
    }
  }
  // l'œil
  const E = S.eye;
  const R = hr * E.k * (o.cute ? 1.3 : 1);
  sideEye(ctx, H.x + hr * 0.18, H.y - hr * 0.2, R, c.mood, c.blink || 0, { iris: E.iris, ring: E.ring, cute: o.cute });
  if (S.eye.brow && fine) {
    // le sourcil osseux des rapaces : un regard perçant
    ctx.fillStyle = shade(col, -0.25);
    ctx.beginPath();
    ctx.moveTo(H.x - hr * 0.2, H.y - hr * 0.5);
    ctx.quadraticCurveTo(H.x + hr * 0.3, H.y - hr * 0.62, H.x + hr * 0.62, H.y - hr * 0.32);
    ctx.lineTo(H.x + hr * 0.1, H.y - hr * 0.36);
    ctx.closePath();
    ctx.fill();
  }
  if (o.cute) cheek(ctx, H.x + hr * 0.28, H.y + hr * 0.38, hr * 0.22);
}

/* ============================================================================
   LES REPTILES (lézard, crocodile, varan, caméléon, serpent)
   S : { a, h (le tronc), neck, tail { L, w, up, curl }, head { L, D, type
         ('lezard', 'croc', 'varan', 'cameleon', 'serpent'), teeth, eye, casque,
         horn, dewlap }, legs { L, w, toes, claws, stride }, back ('osteo',
         'crete', 'pics'), pattern ('bandes', 'taches', 'losanges'), snake }
   ============================================================================ */
const REPT0 = {
  a: 0.6, h: 0.28, neck: 0.22,
  tail: { L: 1.5, w: 0.75, up: 0.05, curl: 0 },
  head: { L: 0.62, D: 0.42, type: 'lezard', eye: 0.11 },
  legs: { L: 0.42, w: 0.075, toes: 0.16, stride: 0.32 },
};
function rept(o) {
  const S = { ...REPT0, ...o, kind: 'reptile' };
  for (const k of ['tail', 'head', 'legs']) S[k] = { ...REPT0[k], ...(o[k] || {}) };
  return S;
}

/** La forme de la tête (repère : la nuque en (0, 0), le museau vers la droite), et la mâchoire du bas */
function headShape(H, L, D) {
  switch (H.type) {
    case 'croc': return {
      top: [[-0.04, -0.4], [0.2, -0.56], [0.36, -0.34], [0.62, -0.24], [0.9, -0.2], [1.02, -0.06], [1.0, 0.06], [0.4, 0.1], [0.0, 0.32]],
      jaw: [[0.04, 0.12], [0.98, 0.06], [0.92, 0.2], [0.3, 0.36], [0.0, 0.42]], hinge: [0.06, 0.12],
    };
    case 'serpent': return {
      top: [[-0.05, -0.38], [0.3, -0.52], [0.72, -0.4], [1.0, -0.06], [0.94, 0.12], [0.4, 0.16], [0.0, 0.3]],
      jaw: [[0.06, 0.12], [0.9, 0.1], [0.7, 0.3], [0.1, 0.4]], hinge: [0.08, 0.12],
    };
    case 'cameleon': return {
      top: [[-0.2, -0.3], [-0.05, -0.95 * (H.casque || 1)], [0.35, -0.6], [0.8, -0.32], [1.0, -0.05], [0.9, 0.12], [0.3, 0.2], [0.0, 0.42]],
      jaw: [[0.08, 0.14], [0.86, 0.1], [0.62, 0.36], [0.05, 0.5]], hinge: [0.1, 0.14],
    };
    default: return {
      top: [[-0.04, -0.46], [0.28, -0.6], [0.66, -0.4], [0.98, -0.12], [1.0, 0.04], [0.5, 0.14], [0.0, 0.36]],
      jaw: [[0.06, 0.13], [0.92, 0.08], [0.7, 0.32], [0.08, 0.46]], hinge: [0.08, 0.13],
    };
  }
}

/** Une patte de reptile, écartée : le coude ressort, trois ou cinq doigts devant */
function reptLeg(ctx, top, gy, S, r, ph, k, col, dark, lw, front, swim, o) {
  const Lg = S.legs;
  const L = Lg.L * r * (o.legK || 1);
  const w = Lg.w * r * (o.legW || 1);
  let foot;
  if (swim) {
    foot = { x: top.x - L * 0.95, y: top.y + L * 0.35 };
  } else {
    const sw = Math.sin(ph) * Lg.stride * r * k;
    const lift = Math.max(0, Math.cos(ph)) * L * 0.3 * k;
    foot = { x: top.x + sw + (front ? L * 0.15 : -L * 0.05), y: gy - lift };
  }
  const knee = joint(top.x, top.y, foot.x, foot.y, L * 0.62, L * 0.68, front ? 1 : -1);
  limb(ctx, [[top.x, top.y, w * 1.6], [knee.x, knee.y, w * 1.05], [foot.x, foot.y - w * 0.3, w * 0.8]], col, dark, lw);
  // les doigts
  const tl = Lg.toes * r;
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  const n = Lg.zygo ? 2 : 3;
  for (const pass of [0, 1]) {
    ctx.lineWidth = pass ? w * 0.7 : w * 0.7 + lw * 2;
    ctx.strokeStyle = pass ? col : dark;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = swim ? Math.PI - 0.3 + i * 0.3 : (Lg.zygo ? [0.2, Math.PI - 0.4][i] : -0.15 + i * 0.25);
      ctx.moveTo(foot.x, foot.y - w * 0.2);
      ctx.lineTo(foot.x + Math.cos(a) * tl, foot.y - w * 0.2 + Math.sin(a) * tl * 0.5);
    }
    ctx.stroke();
  }
  if ((Lg.claws || o.claws) && fine) {
    ctx.fillStyle = '#2A2420';
    for (let i = 0; i < n; i++) {
      const a = -0.15 + i * 0.25;
      circle(ctx, foot.x + Math.cos(a) * tl * 1.05, foot.y - w * 0.2 + Math.sin(a) * tl * 0.5, w * 0.32);
      ctx.fill();
    }
  }
}

function drawReptile(ctx, c, t, S, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const { face, pitch, loco } = sidePose(c);
  const belly = o.belly || c.sp?.belly || shade(col, 0.32);
  const dark = o.dark ? shade(o.dark, -0.25) : shade(col, -0.55);
  const lw = Math.max(0.7, r * 0.04);
  const swim = loco === 'eau' || loco === 'surface';
  const k = clamp(c.speed ?? 0, 0, 1.2);
  const a = S.a, h = S.h * (o.fat || 1);
  const T = S.tail, H = S.head;
  const ph = (c.walk || 0) * (S.cadence || 2.4) + (c.seed || 0);

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  ctx.rotate(pitch);
  const gy = STAND[S.look] * r;

  // la colonne : de la queue au cou. Le serpent ondule (des bosses qui glissent vers l'arrière)
  const nodes = [];
  const tailL = T.L * (o.tailK || 1);
  const total = a * 2 + tailL;
  if (S.snake) {
    // (le serpent) beaucoup de points, régulièrement espacés : il peut onduler sur toute sa longueur
    const N = 30;
    for (let i = N; i >= 1; i--) {
      const x = a + S.neck - (total + S.neck) * (i / N);
      nodes.push(x < -a ? { x, u: (-a - x) / tailL, tail: true } : { x, u: 0 });
    }
    nodes.push({ x: a + S.neck, u: 0, neck: true });
  } else {
    const nt = 5;
    for (let i = nt; i >= 1; i--) {
      const u = i / nt;
      nodes.push({ x: -a - tailL * u, u, tail: true });
    }
    nodes.push({ x: -a * 0.92, u: 0 }, { x: -a * 0.45, u: 0 }, { x: 0, u: 0 }, { x: a * 0.5, u: 0 }, { x: a * 0.9, u: 0 }, { x: a + S.neck, u: 0, neck: true });
  }
  const pts = nodes.map((n) => {
    let y = 0;
    if (n.tail) {
      const sway = Math.sin(t * (swim ? 5 : 1.8) - n.u * 3 + (c.seed || 0)) * (swim ? 0.12 : 0.04) * n.u;
      y = -(T.up || 0) * n.u * n.u + sway;
    }
    if (S.snake && !swim && loco !== 'grimpe') {
      // il rampe : son corps forme des vagues qui restent à leur place sur le sol pendant qu'il
      // glisse dedans (chaque bout du corps passe là où la tête est passée)
      const u = (a + S.neck - n.x) / (total + S.neck);
      const wx = (c.x || 0) / r + face * n.x;
      const wave = (1 - Math.cos((wx / (S.wave || 1.3)) * TAU)) / 2;
      const env = clamp((u - 0.05) / 0.14, 0, 1) * (1 - u * 0.45);
      y -= wave * h * 1.25 * env;
      if (n.tail) y += (T.up || 0) * n.u * n.u;
    } else if (S.snake && swim) {
      const u = (a - n.x) / total;
      y += Math.sin((c.walk || t) * 2.4 - u * 9) * 0.08;
    }
    let th = h;
    if (n.tail) th = lerp(h * T.w, 0.035, S.snake ? n.u * n.u : n.u);
    else if (n.neck) th = H.D * 0.42;
    else if (Math.abs(n.x) > a * 0.8) th = h * 0.9;
    return [n.x, y, th, th * (n.tail || n.neck ? 1 : 1.08)];
  });
  // (le serpent) la tête un peu levée
  const neckP = pts[pts.length - 1];
  const lift = S.snake && !swim && loco !== 'grimpe' ? -0.16 : 0;
  neckP[1] += lift;

  // la queue enroulée du caméléon
  const curl = (T.curl || 0) * (o.curlK || 1);
  // derrière : les pattes du côté caché
  const legsOn = !S.snake && S.legs.L > 0;
  const fx = a * 0.55 * r, hx = -a * 0.5 * r, ly = h * 0.35 * r;
  const farCol = shade(o.legCol || col, -0.32), nearCol = shade(o.legCol || col, 0.02);
  if (legsOn) {
    reptLeg(ctx, { x: hx + 0.04 * r, y: ly - 0.04 * r }, gy, S, r, ph, k, farCol, dark, lw, false, swim, o);
    reptLeg(ctx, { x: fx + 0.04 * r, y: ly - 0.04 * r }, gy, S, r, ph + Math.PI, k, farCol, dark, lw, true, swim, o);
  }
  // le corps et la tête d'un seul contour
  const hn = { x: neckP[0] * r, y: neckP[1] * r };
  const shp = headShape(H, 1, 1);
  const HL = H.L * r * (o.headK || 1), HD = H.D * r * (o.headK || 1);
  const headPoly = shp.top.map(([x, y]) => ({ x: hn.x + x * HL, y: hn.y + y * HD }));
  // (la gueule ouverte) la mâchoire du bas tourne autour de sa charnière
  const open = clamp(c.mouth || 0, 0, 1) * (H.gape ?? 0.5);
  const hg = { x: hn.x + shp.hinge[0] * HL, y: hn.y + shp.hinge[1] * HD };
  const jaw = shp.jaw.map(([x, y]) => {
    const px = hn.x + x * HL - hg.x, py = hn.y + y * HD - hg.y;
    return { x: hg.x + px * Math.cos(open) - py * Math.sin(open), y: hg.y + px * Math.sin(open) + py * Math.cos(open) };
  });
  if (open > 0.05) {
    ctx.fillStyle = '#E7A2A8';
    ctx.beginPath();
    ctx.moveTo(hg.x, hg.y);
    ctx.lineTo(hn.x + 0.95 * HL, hn.y + 0.06 * HD);
    ctx.lineTo(jaw[1].x, jaw[1].y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = shade(belly, -0.05);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  smoothClosed(ctx, jaw);
  ctx.fill();
  ctx.stroke();
  if (H.teeth && fine) {
    ctx.fillStyle = '#FBF6E6';
    for (let i = 0; i < 6; i++) {
      const u = 0.2 + i * 0.13;
      const x = lerp(jaw[0].x, jaw[1].x, u), y = lerp(jaw[0].y, jaw[1].y, u);
      ctx.beginPath();
      ctx.moveTo(x - HL * 0.03, y);
      ctx.lineTo(x + Math.sin(open) * HD * 0.18, y - Math.cos(open) * HD * 0.18);
      ctx.lineTo(x + HL * 0.03, y);
      ctx.fill();
    }
  }
  const poly = tubePoly(pts, r);
  ctx.beginPath();
  addSmooth(ctx, poly);
  addSmooth(ctx, headPoly);
  if (curl) {
    // la spirale de la queue : un cercle enroulé au bout
    const tip = pts[0];
    const R = curl * r * 0.32;
    ctx.moveTo(tip[0] * r + R * 0.2, tip[1] * r + R);
    ctx.arc(tip[0] * r, tip[1] * r + R, R * 0.22, 0, TAU);
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 2;
  ctx.stroke();
  ctx.fillStyle = volume(ctx, -h * r * 1.1, h * r * 1.1, col, belly);
  ctx.fill();
  if (curl) {
    // la queue du caméléon s'enroule en spirale
    const tip = pts[0];
    const R = curl * r * 0.32;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, r * 0.07) + lw * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const ang = -Math.PI / 2 - u * TAU * 1.15;
      const rr = R * (1 - u * 0.8);
      const x = tip[0] * r + Math.cos(ang) * rr, y = tip[1] * r + R + Math.sin(ang) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.stroke();
  }
  if (fine) {
    ctx.save();
    ctx.beginPath();
    addSmooth(ctx, poly);
    ctx.clip();
    const pat = o.pattern || S.pattern;
    const pc = o.stripe || S.stripe || shade(col, -0.32);
    ctx.fillStyle = pc;
    ctx.strokeStyle = pc;
    if (pat === 'bandes') {
      ctx.lineWidth = r * 0.09;
      ctx.beginPath();
      for (let x = -a - tailL * 0.8; x < a * 0.9; x += 0.32) {
        ctx.moveTo(x * r, -h * r * 1.2);
        ctx.lineTo((x - 0.06) * r, h * r * 0.3);
      }
      ctx.stroke();
    } else if (pat === 'taches') {
      for (let i = 0; i < 14; i++) {
        const x = lerp(-a - tailL * 0.6, a * 0.9, (i * 0.618) % 1);
        const y = -h * (0.15 + ((i * 0.37) % 0.6));
        ctx.beginPath();
        ctx.ellipse(x * r, y * r, r * 0.06, r * 0.045, 0, 0, TAU);
        ctx.fill();
      }
    } else if (pat === 'losanges') {
      ctx.lineWidth = Math.max(0.6, r * 0.035);
      ctx.beginPath();
      for (let x = -a - tailL * 0.85; x < a + S.neck; x += 0.3) {
        ctx.moveTo(x * r, -h * r * 0.1);
        ctx.lineTo((x + 0.15) * r, -h * r * 0.8);
        ctx.lineTo((x + 0.3) * r, -h * r * 0.1);
        ctx.lineTo((x + 0.15) * r, h * r * 0.5);
        ctx.closePath();
      }
      ctx.fill();
    } else if (pat === 'ecailles') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.lineWidth = Math.max(0.5, lw * 0.5);
      ctx.beginPath();
      for (let x = -a - tailL * 0.7; x < a; x += 0.14) {
        for (let y = -h * 0.8; y < h * 0.5; y += 0.12) {
          ctx.moveTo((x + 0.07) * r, y * r);
          ctx.arc(x * r, y * r, 0.07 * r, 0, Math.PI);
        }
      }
      ctx.stroke();
    }
    // un reflet sur le dos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = r * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const y = (p[1] - p[2] * 0.62) * r;
      if (i === 1) ctx.moveTo(p[0] * r, y); else ctx.lineTo(p[0] * r, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  // le dos : bosses osseuses (crocodile), crête (iguane, caméléon), piquants
  const back = o.back || S.back;
  if (back && fine) {
    ctx.fillStyle = back === 'osteo' ? shade(col, -0.18) : (o.crestCol || S.crestCol || shade(col, -0.2));
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    const n = back === 'osteo' ? 14 : 12;
    for (let i = 0; i < n; i++) {
      const x = lerp(-a - tailL * 0.7, a * 0.85, i / (n - 1));
      let p = pts[0];
      for (const q of pts) if (q[0] <= x) p = q;
      const y = (p[1] - p[2]) * r;
      const s = back === 'osteo' ? r * 0.06 : r * (back === 'crete' ? 0.13 : 0.09) * (1 - Math.abs(i / n - 0.5));
      ctx.beginPath();
      if (back === 'osteo') ctx.ellipse(x * r, y + s * 0.2, s * 1.1, s, 0, Math.PI, TAU);
      else {
        ctx.moveTo(x * r - s * 0.6, y + s * 0.3);
        ctx.lineTo(x * r + s * 0.15, y - s * 1.5);
        ctx.lineTo(x * r + s * 0.6, y + s * 0.3);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  // le fanon (sous la gorge de l'iguane)
  if (H.dewlap && fine) {
    ctx.fillStyle = H.dewlapCol || shade(col, 0.1);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(hn.x - HL * 0.1, hn.y + HD * 0.3);
    ctx.quadraticCurveTo(hn.x + HL * 0.1, hn.y + HD * (0.4 + H.dewlap), hn.x + HL * 0.45, hn.y + HD * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // les dents du haut (le crocodile les montre même gueule fermée)
  if (H.teeth && fine) {
    ctx.fillStyle = '#FBF6E6';
    for (let i = 0; i < 7; i++) {
      const u = 0.28 + i * 0.1;
      const x = hn.x + u * HL, y = hn.y + (H.type === 'croc' ? 0.08 : 0.12) * HD;
      ctx.beginPath();
      ctx.moveTo(x - HL * 0.025, y - HD * 0.02);
      ctx.lineTo(x, y + HD * (i % 2 ? 0.16 : 0.22));
      ctx.lineTo(x + HL * 0.025, y - HD * 0.02);
      ctx.fill();
    }
  }
  // la narine
  ctx.fillStyle = dark;
  circle(ctx, hn.x + HL * 0.9, hn.y - HD * 0.12, Math.max(0.5, HD * 0.05));
  ctx.fill();
  // la corne (au bout du museau)
  if (H.horn && fine) {
    ctx.fillStyle = '#E8DCC0';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(hn.x + HL * 0.55, hn.y - HD * 0.42);
    ctx.lineTo(hn.x + HL * 0.62, hn.y - HD * (0.42 + H.horn));
    ctx.lineTo(hn.x + HL * 0.75, hn.y - HD * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // l'œil : sur une petite bosse chez le crocodile (il voit en restant sous l'eau)
  const ex = hn.x + HL * (H.type === 'croc' ? 0.22 : H.type === 'cameleon' ? 0.36 : 0.3);
  const ey = hn.y - HD * (H.type === 'croc' ? 0.5 : H.type === 'cameleon' ? 0.3 : 0.24);
  const R = H.eye * r * (o.cute ? 1.35 : 1) * (H.type === 'cameleon' ? 1.4 : 1);
  if (H.type === 'croc' || H.type === 'cameleon') {
    ctx.fillStyle = H.type === 'cameleon' ? col : shade(col, -0.05);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    circle(ctx, ex, ey, R * (H.type === 'cameleon' ? 1.45 : 1.25));
    ctx.fill();
    ctx.stroke();
  }
  sideEye(ctx, ex, ey, R, c.mood, c.blink || 0, { iris: H.iris || (o.cute ? null : '#D9B53A'), cute: o.cute });
  if (o.cute) cheek(ctx, ex + R * 0.6, ey + R * 1.6, R * 0.55);
  // la langue fourchue du serpent (ou la longue langue du caméléon)
  const tongue = c.tongue ?? (S.snake || H.type === 'varan' ? Math.max(0, Math.sin(t * 3 + (c.seed || 0) * 5) - 0.75) * 4 : 0);
  if (tongue > 0.02 && fine) {
    const tx = hn.x + HL * 1.0, ty = hn.y + HD * 0.05;
    const tl = HL * (H.type === 'cameleon' ? tongue * 3 : 0.5 * tongue);
    ctx.strokeStyle = H.type === 'cameleon' ? '#E86A86' : '#C8303E';
    ctx.lineWidth = Math.max(0.8, HD * (H.type === 'cameleon' ? 0.12 : 0.05));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + tl, ty);
    if (H.type !== 'cameleon') {
      ctx.lineTo(tx + tl + HL * 0.12, ty - HD * 0.08);
      ctx.moveTo(tx + tl, ty);
      ctx.lineTo(tx + tl + HL * 0.12, ty + HD * 0.08);
    }
    ctx.stroke();
    if (H.type === 'cameleon') {
      ctx.fillStyle = '#E86A86';
      circle(ctx, tx + tl, ty, HD * 0.16);
      ctx.fill();
    }
  }
  // devant : les pattes de notre côté
  if (legsOn) {
    reptLeg(ctx, { x: hx, y: ly }, gy, S, r, ph + Math.PI, k, nearCol, dark, lw, false, swim, o);
    reptLeg(ctx, { x: fx, y: ly }, gy, S, r, ph, k, nearCol, dark, lw, true, swim, o);
  }
  ctx.restore();
}

/* ============================================================================
   LES TORTUES : la carapace bombée, la tête au bout du cou, les pattes
   (ou les nageoires des tortues de mer)
   ============================================================================ */
function drawTurtle(ctx, c, t, S, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const { face, pitch, loco } = sidePose(c);
  const shell = o.shell || S.shell || shade(col, -0.15);
  const belly = o.belly || c.sp?.belly || '#E8D8A8';
  const dark = shade(col, -0.55);
  const lw = Math.max(0.7, r * 0.04);
  const swim = loco === 'eau' || loco === 'surface';
  const k = clamp(c.speed ?? 0, 0, 1.2);
  const ph = (c.walk || 0) * 2 + (c.seed || 0);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  ctx.rotate(pitch);
  const gy = STAND[S.look] * r;
  const A = S.a * r, Hh = S.h * r;
  // les pattes (ou les nageoires) du côté caché
  const legs = (far) => {
    for (const [lx, front] of [[-A * 0.55, false], [A * 0.5, true]]) {
      const p = ph + (front ? 0 : Math.PI) + (far ? Math.PI : 0);
      const lc = far ? shade(col, -0.3) : col;
      if (S.flipper) {
        const ang = (front ? 0.4 : 2.4) + Math.sin(p * (swim ? 1.5 : 1)) * 0.5;
        const L = (front ? 0.9 : 0.5) * r;
        ctx.fillStyle = lc;
        ctx.strokeStyle = dark;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.ellipse(lx + Math.cos(ang) * L * 0.5, Hh * 0.2 + Math.sin(ang) * L * 0.5, L * 0.55, L * 0.16, ang, 0, TAU);
        ctx.fill();
        ctx.stroke();
      } else {
        const sw = swim ? 0 : Math.sin(p) * 0.18 * r * k;
        const lift = swim ? 0 : Math.max(0, Math.cos(p)) * 0.08 * r * k;
        const fx = lx + sw + (swim ? (front ? 0.3 : -0.3) * r : 0);
        const fy = swim ? Hh * 0.6 : gy - lift;
        limb(ctx, [[lx, Hh * 0.1, S.legW * r * 1.2], [fx, fy - S.legW * r * 0.4, S.legW * r]], lc, dark, lw);
        if (fine && !swim) {
          ctx.fillStyle = '#3A2E26';
          for (const d of [-0.5, 0, 0.5]) {
            circle(ctx, fx + (0.6 + d * 0.3) * S.legW * r, fy - S.legW * r * 0.15, S.legW * r * 0.22);
            ctx.fill();
          }
        }
      }
    }
  };
  legs(true);
  // la queue
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-A * 0.9, Hh * 0.05);
  ctx.lineTo(-A * 1.18, Hh * 0.25);
  ctx.lineTo(-A * 0.85, Hh * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // le cou et la tête (elle rentre dans la carapace quand elle a peur)
  const out = c.mood === 'scared' ? 0.35 : 1;
  const nx = A * (0.85 + 0.35 * out), ny = -Hh * (0.05 + S.neckUp * out);
  const HR = S.headR * r;
  limb(ctx, [[A * 0.7, Hh * 0.05, HR * 0.75], [nx, ny, HR * 0.7]], col, dark, lw);
  const hx = nx + HR * 0.55, hy = ny - HR * 0.05;
  ctx.fillStyle = volume(ctx, hy - HR, hy + HR, col, belly);
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.ellipse(hx, hy, HR * 1.15, HR * 0.85, 0.05, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // le bec de tortue, la bouche
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, lw * 0.8);
  ctx.beginPath();
  const open = clamp(c.mouth || 0, 0, 1) * 0.5;
  ctx.moveTo(hx + HR * 1.1, hy + HR * 0.15);
  ctx.quadraticCurveTo(hx + HR * 0.6, hy + HR * (0.35 + open), hx + HR * 0.1, hy + HR * 0.3);
  ctx.stroke();
  sideEye(ctx, hx + HR * 0.4, hy - HR * 0.25, HR * 0.3 * (o.cute ? 1.3 : 1), c.mood, c.blink || 0, { cute: o.cute });
  if (o.cute) cheek(ctx, hx + HR * 0.55, hy + HR * 0.35, HR * 0.22);
  // la carapace
  const g = ctx.createLinearGradient(0, -Hh * 1.4, 0, Hh * 0.3);
  g.addColorStop(0, shade(shell, 0.12));
  g.addColorStop(0.6, shell);
  g.addColorStop(1, shade(shell, -0.25));
  ctx.fillStyle = belly;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(0, Hh * 0.18, A * 0.98, Hh * 0.42, 0, 0, Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-A, Hh * 0.2);
  ctx.bezierCurveTo(-A * 0.95, -Hh * 1.45, A * 0.95, -Hh * 1.45, A, Hh * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine) {
    // les écailles de la carapace
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = shade(shell, -0.35);
    ctx.lineWidth = Math.max(0.6, lw * 0.8);
    ctx.beginPath();
    for (const x of [-0.5, 0, 0.5]) {
      ctx.moveTo((x - 0.22) * A, -Hh * 0.15);
      ctx.lineTo((x - 0.12) * A, -Hh * 0.7);
      ctx.lineTo((x + 0.12) * A, -Hh * 0.7);
      ctx.lineTo((x + 0.22) * A, -Hh * 0.15);
      ctx.closePath();
    }
    ctx.moveTo(-A, -Hh * 0.15);
    ctx.lineTo(A, -Hh * 0.15);
    ctx.stroke();
    if (S.ridges) {
      ctx.fillStyle = shade(shell, -0.2);
      for (const x of [-0.6, -0.2, 0.2, 0.6]) {
        ctx.beginPath();
        ctx.ellipse(x * A, -Hh * 0.98 + Math.abs(x) * Hh * 0.35, A * 0.08, Hh * 0.12, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.ellipse(-A * 0.1, -Hh * 0.55, A * 0.55, Hh * 0.5, 0, Math.PI * 1.15, Math.PI * 1.7);
    ctx.stroke();
    ctx.restore();
  }
  legs(false);
  ctx.restore();
}

/* ============================================================================
   LES POISSONS, de profil : le corps, les nageoires, la queue qui bat
   ============================================================================ */
function drawFishSide(ctx, c, t, S, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const { face, pitch } = sidePose({ ...c, loco: 'eau' });
  const belly = o.belly || c.sp?.belly || shade(col, 0.4);
  const dark = shade(col, -0.55);
  const lw = Math.max(0.6, r * 0.04);
  const A = S.a, Hh = S.h;
  const beat = Math.sin(t * (6 + (c.speed || 0) * 6) + (c.seed || 0) * 4);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  ctx.rotate(pitch);
  // la nageoire de la queue
  const tx = -A * r;
  ctx.fillStyle = shade(col, -0.1);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  if (S.eel) {
    ctx.moveTo(tx, -Hh * 0.2 * r);
    ctx.quadraticCurveTo(tx - 0.5 * r, beat * 0.1 * r, tx, Hh * 0.2 * r);
  } else {
    const fl = S.tailL * r, fw = S.tailW * r;
    ctx.moveTo(tx + 0.05 * r, 0);
    ctx.quadraticCurveTo(tx - fl * 0.5, -fw * 0.2 + beat * fw * 0.15, tx - fl, -fw + beat * fw * 0.2);
    ctx.quadraticCurveTo(tx - fl * (S.fork ? 0.55 : 0.85), beat * fw * 0.1, tx - fl, fw + beat * fw * 0.2);
    ctx.quadraticCurveTo(tx - fl * 0.5, fw * 0.2 + beat * fw * 0.15, tx + 0.05 * r, 0);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // les nageoires du dos et du ventre
  const fin = o.fin || S.fin || shade(col, -0.15);
  ctx.fillStyle = fin;
  if (S.dorsal) {
    const dh = S.dorsal * r;
    ctx.beginPath();
    ctx.moveTo(A * 0.25 * r, -Hh * 0.9 * r);
    ctx.quadraticCurveTo(-A * 0.05 * r, -Hh * r - dh * 1.1, -A * (S.shark ? 0.15 : 0.4) * r, -Hh * r - dh * (S.shark ? 1 : 0.4));
    ctx.lineTo(-A * 0.45 * r, -Hh * 0.75 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-A * 0.2 * r, Hh * 0.85 * r);
  ctx.quadraticCurveTo(-A * 0.4 * r, Hh * 1.4 * r, -A * 0.6 * r, Hh * 0.7 * r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // le corps
  const pts = [
    { x: A, y: 0.05 * Hh }, { x: 0.82 * A, y: -0.7 * Hh }, { x: 0.2 * A, y: -1.0 * Hh }, { x: -0.6 * A, y: -0.62 * Hh }, { x: -A, y: -0.18 * Hh },
    { x: -A, y: 0.18 * Hh }, { x: -0.6 * A, y: 0.6 * Hh }, { x: 0.2 * A, y: 1.0 * Hh }, { x: 0.8 * A, y: 0.6 * Hh },
  ].map((p) => ({ x: p.x * r, y: p.y * r }));
  ctx.beginPath();
  addSmooth(ctx, pts);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 2;
  ctx.stroke();
  ctx.fillStyle = volume(ctx, -Hh * r, Hh * r, col, belly);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    if (S.stripes || o.stripes) {
      ctx.fillStyle = o.stripe || S.stripe || shade(col, -0.3);
      for (let i = 0; i < (S.stripes || 3); i++) {
        const x = (0.4 - i * 0.35) * A * r;
        ctx.fillRect(x - 0.05 * r, -Hh * r, 0.1 * r, Hh * r * 2);
      }
    }
    if (S.spots) {
      ctx.fillStyle = shade(col, -0.3);
      for (let i = 0; i < 10; i++) {
        circle(ctx, lerp(-0.8, 0.6, (i * 0.618) % 1) * A * r, -Hh * r * (0.1 + ((i * 0.41) % 0.6)), r * 0.04);
        ctx.fill();
      }
    }
    // l'éclat argenté
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(-0.6 * A * r, -0.3 * Hh * r);
    ctx.quadraticCurveTo(0, -0.55 * Hh * r, 0.6 * A * r, -0.3 * Hh * r);
    ctx.stroke();
    ctx.restore();
  }
  // les ouïes, la nageoire de côté
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.5, lw * 0.7);
  ctx.beginPath();
  ctx.arc(A * 0.55 * r, 0, Hh * 0.6 * r, -1.1, 1.1);
  ctx.stroke();
  ctx.fillStyle = fin;
  ctx.beginPath();
  const pec = S.wings ? 1.6 : 0.5;
  ctx.ellipse(A * 0.3 * r - pec * 0.3 * r, Hh * 0.25 * r, pec * 0.45 * r, Hh * 0.22 * r, -0.4 + beat * 0.15, 0, TAU);
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();
  // l'œil et la bouche
  sideEye(ctx, A * 0.72 * r, -Hh * 0.25 * r, Math.max(0.8, Hh * 0.28 * r), c.mood, c.blink || 0, { iris: S.shark ? null : null });
  if (S.shark && fine) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.6, lw * 0.8);
    ctx.beginPath();
    ctx.moveTo(A * 0.95 * r, Hh * 0.35 * r);
    ctx.quadraticCurveTo(A * 0.7 * r, Hh * (0.5 + (c.mouth || 0) * 0.3) * r, A * 0.45 * r, Hh * 0.38 * r);
    ctx.stroke();
    if ((c.mouth || 0) > 0.3) {
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 4; i++) {
        const x = (0.5 + i * 0.1) * A * r;
        ctx.beginPath();
        ctx.moveTo(x, Hh * 0.38 * r);
        ctx.lineTo(x + 0.02 * r, Hh * 0.52 * r);
        ctx.lineTo(x + 0.04 * r, Hh * 0.38 * r);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/* ============================================================================
   LES INSECTES (scarabée, libellule, papillon, grillon, mouche)
   ============================================================================ */
function drawInsect(ctx, c, t, S, col) {
  const r = c.size;
  setDetail(ctx, r);
  const { face, pitch, loco } = sidePose(c);
  const dark = shade(col, -0.55);
  const lw = Math.max(0.5, r * 0.07);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  ctx.rotate(pitch * 0.6);
  const flap = Math.sin(t * 40 + (c.seed || 0) * 9);
  const flying = loco === 'vol' || S.type === 'libellule' || S.type === 'papillon';
  const wing = (x, y, w, h, a, colW) => {
    ctx.fillStyle = colW;
    ctx.strokeStyle = 'rgba(30, 40, 60, 0.6)';
    ctx.lineWidth = Math.max(0.4, lw * 0.5);
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  if (S.type === 'papillon') {
    const k = 0.25 + Math.abs(Math.sin(t * 9 + (c.seed || 0) * 5)) * 0.75;
    wing(-0.05 * r, -0.75 * r * k, 0.75 * r, 0.8 * r * k, -0.3, S.wing || '#FFB84A');
    wing(-0.3 * r, -0.3 * r * k, 0.5 * r, 0.5 * r * k, -0.9, shade(S.wing || '#FFB84A', -0.15));
    if (fine) {
      ctx.fillStyle = S.spot || '#3A2A40';
      circle(ctx, 0.0 * r, -0.75 * r * k, 0.12 * r * k + 0.1);
      ctx.fill();
    }
  }
  if (S.type === 'libellule' || S.type === 'mouche') {
    const k = 0.4 + Math.abs(flap) * 0.6;
    const wc = 'rgba(220, 240, 255, 0.55)';
    wing(-0.05 * r, -0.4 * r * k, (S.type === 'mouche' ? 0.4 : 0.75) * r, 0.16 * r, -0.35 * k, wc);
    if (S.type === 'libellule') wing(-0.25 * r, -0.35 * r * k, 0.7 * r, 0.15 * r, -0.6 * k, wc);
  }
  // le corps : tête, thorax, abdomen
  const body = S.type === 'libellule' ? [[0.45, 0.16], [0.15, 0.2], [-0.75, 0.1]] : S.type === 'scarabee' ? [[0.48, 0.2], [0.25, 0.26], [-0.2, 0.46]] : [[0.45, 0.2], [0.18, 0.24], [-0.32, 0.32]];
  // les pattes
  if (!flying || S.type === 'scarabee' || S.type === 'grillon') {
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.6, r * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const x = (0.25 - i * 0.22) * r;
      const sw = Math.sin((c.walk || t * 3) * 6 + i * 2) * 0.12 * r;
      ctx.moveTo(x, 0.1 * r);
      ctx.lineTo(x + sw + (i === 2 && S.type === 'grillon' ? -0.3 * r : 0.05 * r), (i === 2 && S.type === 'grillon' ? -0.2 : 0.3) * r);
      ctx.lineTo(x + sw + (i === 2 && S.type === 'grillon' ? -0.45 * r : 0.12 * r), 0.55 * r);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  const cols = [shade(col, -0.1), col, shade(col, 0.08)];
  body.forEach(([x, R], i) => {
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    if (i === 2) ctx.ellipse(x * r, 0, (S.type === 'libellule' ? 0.65 : R * 1.2) * r, R * r, 0, 0, TAU);
    else circle(ctx, x * r, 0, R * r);
    ctx.fill();
    ctx.stroke();
  });
  if (S.type === 'scarabee' && fine) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.ellipse(-0.2 * r, -0.12 * r, 0.3 * r, 0.22 * r, 0, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();
  }
  // les antennes et l'œil
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.5, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(0.55 * r, -0.12 * r);
  ctx.quadraticCurveTo(0.8 * r, -0.6 * r, 1.05 * r, -0.5 * r);
  ctx.stroke();
  ctx.fillStyle = INK;
  circle(ctx, 0.55 * r, -0.04 * r, Math.max(0.6, 0.08 * r));
  ctx.fill();
  ctx.restore();
}

/* ============================================================================
   CE QUI SE MANGE, posé par terre : graines, fruits, œufs, carcasses…
   ============================================================================ */
function drawItem(ctx, c, t, S, col) {
  const r = c.size;
  setDetail(ctx, r);
  const dark = shade(col, -0.5);
  const lw = Math.max(0.6, r * 0.08);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  const glow = 0.5 + Math.sin(t * 3 + (c.seed || 0) * 4) * 0.5;
  if (S.type === 'graine') {
    // une grappe de graines
    for (const [x, y, k] of [[-0.35, 0.2, 0.9], [0.3, 0.25, 0.8], [0, -0.15, 1], [0.45, -0.1, 0.7], [-0.5, -0.2, 0.7]]) {
      ctx.fillStyle = k > 0.85 ? col : shade(col, -0.12);
      ctx.beginPath();
      ctx.ellipse(x * r, y * r, 0.32 * r * k, 0.22 * r * k, 0.4, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  } else if (S.type === 'fruit' || S.type === 'noix') {
    ctx.fillStyle = col;
    circle(ctx, 0, 0, r * 0.8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    circle(ctx, -0.25 * r, -0.3 * r, r * 0.22);
    ctx.fill();
    if (S.type === 'fruit') {
      ctx.strokeStyle = '#5A3A1A';
      ctx.beginPath();
      ctx.moveTo(0, -0.75 * r);
      ctx.lineTo(0.1 * r, -1.1 * r);
      ctx.stroke();
      ctx.fillStyle = '#5AAE4A';
      ctx.beginPath();
      ctx.ellipse(0.35 * r, -1.0 * r, 0.3 * r, 0.14 * r, -0.4, 0, TAU);
      ctx.fill();
    }
  } else if (S.type === 'oeuf') {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.62 * r, 0.82 * r, 0.15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.fillStyle = shade(col, -0.3);
      for (let i = 0; i < 6; i++) {
        circle(ctx, ((i * 0.37) % 0.8 - 0.4) * r, ((i * 0.61) % 1.1 - 0.5) * r, 0.07 * r);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      circle(ctx, -0.2 * r, -0.35 * r, 0.16 * r);
      ctx.fill();
    }
  } else if (S.type === 'carcasse') {
    // les restes d'un grand animal : de la viande et des côtes
    ctx.fillStyle = '#B5523E';
    ctx.beginPath();
    ctx.ellipse(0, 0.2 * r, 1.0 * r, 0.42 * r, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#F2E8D2';
    ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const x = (-0.6 + i * 0.3) * r;
      ctx.moveTo(x, 0.05 * r);
      ctx.quadraticCurveTo(x + 0.15 * r, -0.65 * r, x + 0.32 * r, -0.2 * r);
    }
    ctx.stroke();
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.6;
    ctx.stroke();
  } else if (S.type === 'viande') {
    ctx.fillStyle = '#C4583E';
    ctx.beginPath();
    ctx.ellipse(-0.1 * r, 0, 0.7 * r, 0.45 * r, -0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F2E8D2';
    ctx.beginPath();
    ctx.ellipse(0.65 * r, -0.2 * r, 0.32 * r, 0.12 * r, -0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // une petite lueur : « ça se mange ! »
  if (S.shine !== false && fine) {
    ctx.fillStyle = `rgba(255, 255, 220, ${0.25 + glow * 0.35})`;
    circle(ctx, 0.5 * r, -0.6 * r, 0.12 * r + glow * 0.06 * r);
    ctx.fill();
  }
  ctx.restore();
}

/* ============================================================================
   LE NID : des brindilles, des œufs… puis des petits qui réclament
   n : { x, y, r, eggs, chicks, hunger (0..1), col (la couleur des petits), glow }
   ============================================================================ */
export function drawNest(ctx, n, t) {
  const r = n.r;
  ctx.save();
  ctx.translate(n.x, n.y);
  // les petits (derrière le bord du nid)
  for (let i = 0; i < (n.chicks || 0); i++) {
    const x = (i - (n.chicks - 1) / 2) * r * 0.55;
    const beg = n.hunger > 0.2 ? Math.max(0, Math.sin(t * 9 + i * 2.1)) : 0;
    const y = -r * (0.35 + beg * 0.35);
    const col = n.col || '#D8C8A8';
    ctx.fillStyle = col;
    ctx.strokeStyle = shade(col, -0.5);
    ctx.lineWidth = Math.max(0.6, r * 0.04);
    circle(ctx, x, y, r * 0.28);
    ctx.fill();
    ctx.stroke();
    // des petites plumes en bataille
    ctx.beginPath();
    ctx.moveTo(x - r * 0.05, y - r * 0.26);
    ctx.lineTo(x - r * 0.1, y - r * 0.42);
    ctx.moveTo(x + r * 0.04, y - r * 0.27);
    ctx.lineTo(x + r * 0.08, y - r * 0.44);
    ctx.stroke();
    // le bec grand ouvert : « j'ai faim ! »
    const gape = n.hunger > 0.2 ? 0.25 + beg * 0.35 : 0.05;
    ctx.fillStyle = '#FFD24A';
    ctx.beginPath();
    ctx.moveTo(x + r * 0.2, y - r * 0.02);
    ctx.lineTo(x + r * 0.48, y - r * 0.1 - gape * r * 0.3);
    ctx.lineTo(x + r * 0.22, y + r * 0.04);
    ctx.lineTo(x + r * 0.46, y + r * 0.08 + gape * r * 0.3);
    ctx.lineTo(x + r * 0.2, y + r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (gape > 0.2) {
      ctx.fillStyle = '#E2445A';
      ctx.beginPath();
      ctx.moveTo(x + r * 0.22, y + r * 0.03);
      ctx.lineTo(x + r * 0.42, y - r * 0.05 - gape * r * 0.2);
      ctx.lineTo(x + r * 0.42, y + r * 0.05 + gape * r * 0.2);
      ctx.fill();
    }
    sideEye(ctx, x + r * 0.08, y - r * 0.08, r * 0.08, 'happy', 0, {});
  }
  // les œufs
  for (let i = 0; i < (n.eggs || 0); i++) {
    const x = (i - (n.eggs - 1) / 2) * r * 0.42;
    ctx.fillStyle = n.eggCol || '#F2EAD6';
    ctx.strokeStyle = shade(n.eggCol || '#F2EAD6', -0.45);
    ctx.lineWidth = Math.max(0.6, r * 0.04);
    ctx.beginPath();
    ctx.ellipse(x, -r * 0.25, r * 0.2, r * 0.27, (i - 1) * 0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(120, 90, 60, 0.45)';
    circle(ctx, x - r * 0.05, -r * 0.3, r * 0.04);
    ctx.fill();
    circle(ctx, x + r * 0.07, -r * 0.18, r * 0.03);
    ctx.fill();
  }
  // la coupe de brindilles
  const g = ctx.createLinearGradient(0, -r * 0.2, 0, r * 0.3);
  g.addColorStop(0, '#A8804E');
  g.addColorStop(1, '#6A4A2A');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3E2A16';
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.18);
  ctx.quadraticCurveTo(-r * 0.75, r * 0.32, 0, r * 0.32);
  ctx.quadraticCurveTo(r * 0.75, r * 0.32, r * 0.85, -r * 0.18);
  ctx.quadraticCurveTo(0, r * 0.02, -r * 0.85, -r * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60, 40, 20, 0.7)';
  ctx.lineWidth = Math.max(0.6, r * 0.03);
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const x = -r * 0.75 + i * r * 0.19;
    ctx.moveTo(x, -r * 0.05 + Math.sin(i * 2.3) * r * 0.06);
    ctx.lineTo(x + r * 0.32, r * 0.12 + Math.cos(i * 1.7) * r * 0.06);
  }
  ctx.stroke();
  // une brindille qui dépasse
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.15);
  ctx.lineTo(-r * 1.1, -r * 0.32);
  ctx.moveTo(r * 0.75, -r * 0.1);
  ctx.lineTo(r * 1.05, -r * 0.05);
  ctx.stroke();
  if (n.glow) {
    ctx.strokeStyle = `rgba(255, 230, 120, ${0.4 + Math.sin(t * 5) * 0.3})`;
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.1, r * 1.3, r * 0.75, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/** La becquée que le joueur rapporte au nid, dans son bec */
export function drawCarry(ctx, x, y, r, n, t) {
  for (let i = 0; i < n; i++) {
    const a = -0.4 + i * 0.4 + Math.sin(t * 6 + i) * 0.1;
    ctx.fillStyle = ['#7A5A3A', '#5A8A3A', '#9A4A3A'][i % 3];
    ctx.strokeStyle = '#2A1A10';
    ctx.lineWidth = Math.max(0.6, r * 0.06);
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35 + r * 0.15, r * 0.32, r * 0.16, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

/* ============================================================================
   LES MAMMIFÈRES de ces niveaux (dessinés par art-profil.js)
   ============================================================================ */
const MAMMIFERES = {
  purgatorius: {
    ground: 0.58, hip: [-0.5, -0.02], shoulder: [0.36, 0.02], depth: 0.36, midTop: 1.05,
    neck: [[0.54, -0.04, 0.3], [0.64, -0.08, 0.28]],
    head: { x: 0.74, y: -0.13, L: 0.66, D: 0.5, snout: 0.36, ear: 'rond', earR: 0.8, eye: [0.14, -0.16], eyeR: 0.15 },
    legW: 0.09, stride: 0.3, cadence: 2.6,
    tail: { len: 1.4, w: 0.06, droop: 0.1, curl: -0.4, type: 'touffue' },
  },
  agouti: {
    ground: 0.62, hip: [-0.42, -0.14], shoulder: [0.3, -0.04], depth: 0.4, hipTop: 1.15, midTop: 1.05,
    neck: [[0.5, -0.1, 0.3], [0.6, -0.16, 0.27]],
    head: { x: 0.7, y: -0.24, L: 0.62, D: 0.52, snout: 0.45, ear: 'rond', earR: 0.65, eye: [0.12, -0.18], eyeR: 0.13 },
    legW: 0.08, stride: 0.34, cadence: 2.8,
    tail: { len: 0.15, w: 0.05, droop: 0.4, type: 'fine' },
  },
  phoberomys: {
    ground: 0.72, hip: [-0.5, -0.22], shoulder: [0.38, -0.12], depth: 0.5, hipTop: 1.1, midTop: 1.05, belly: 1.0,
    neck: [[0.58, -0.2, 0.36], [0.7, -0.26, 0.33]],
    head: { x: 0.84, y: -0.32, L: 0.72, D: 0.6, snout: 0.5, dome: 0.3, ear: 'rond', earR: 0.5, eye: [0.12, -0.24], eyeR: 0.1, teeth: false, noseCol: '#3A2A22' },
    legW: 0.1, stride: 0.3, cadence: 2.2,
    tail: { len: 0.1, w: 0.04, type: 'fine' },
  },
  toxodon: {
    ground: 0.92, hip: [-0.6, -0.3], shoulder: [0.42, -0.22], depth: 0.5, hump: 1.15, belly: 1.0,
    neck: [[0.66, -0.26, 0.38], [0.78, -0.24, 0.34]],
    head: { x: 0.92, y: -0.22, L: 0.78, D: 0.62, snout: 0.6, ear: 'rond', earR: 0.45, eye: [0.1, -0.24], eyeR: 0.09, noseCol: '#3A2A22' },
    legW: 0.15, foreW: 1.05, stride: 0.3, cadence: 1.7,
    tail: { len: 0.25, w: 0.06, droop: 0.9, type: 'fine' },
  },
  thylacosmilus: {
    ground: 0.8, hip: [-0.56, -0.18], shoulder: [0.4, -0.2], depth: 0.34, belly: 0.86,
    neck: [[0.6, -0.3, 0.27], [0.72, -0.36, 0.25]],
    head: { x: 0.86, y: -0.4, L: 0.68, D: 0.52, snout: 0.38, dome: 0.15, ear: 'rond', earR: 0.6, eye: [0.16, -0.2], eyeR: 0.11, saber: 0.55, iris: '#E0B040', gape: 0.75 },
    legW: 0.11, stride: 0.36, cadence: 2.2,
    tail: { len: 0.9, w: 0.08, droop: 0.4, curl: 0.2, type: 'fine' },
    spots: 0,
  },
  macrauchenia: {
    ground: 1.25, hip: [-0.55, -0.42], shoulder: [0.4, -0.38], depth: 0.38,
    neck: [[0.58, -0.62, 0.22], [0.72, -0.95, 0.19], [0.82, -1.18, 0.18]],
    head: { x: 0.92, y: -1.24, L: 0.62, D: 0.4, snout: 0.6, ear: 'pointe', earR: 0.6, eye: [0.16, -0.2], eyeR: 0.12, noseCol: '#4A3A30' },
    legW: 0.09, stride: 0.42, cadence: 1.8,
    tail: { len: 0.35, w: 0.06, droop: 0.8, type: 'fine' },
  },
  diprotodon: {
    ground: 0.95, hip: [-0.62, -0.28], shoulder: [0.42, -0.25], depth: 0.56, hump: 1.1, belly: 1.05, hipTop: 1.05,
    neck: [[0.68, -0.3, 0.42], [0.8, -0.32, 0.38]],
    head: { x: 0.94, y: -0.3, L: 0.74, D: 0.66, snout: 0.5, ear: 'rond', earR: 0.6, eye: [0.08, -0.22], eyeR: 0.09, noseCol: '#2A2024' },
    legW: 0.16, foreW: 1.0, stride: 0.28, cadence: 1.6,
    tail: { len: 0.12, w: 0.06, type: 'fine' },
  },
  thylacoleo: {
    ground: 0.78, hip: [-0.54, -0.18], shoulder: [0.38, -0.2], depth: 0.37, belly: 0.9,
    neck: [[0.58, -0.28, 0.28], [0.7, -0.34, 0.26]],
    head: { x: 0.84, y: -0.38, L: 0.66, D: 0.56, snout: 0.34, dome: 0.2, ear: 'rond', earR: 0.65, eye: [0.14, -0.2], eyeR: 0.11, teeth: true, iris: '#D9A13A', gape: 0.7 },
    legW: 0.12, stride: 0.34, cadence: 2.1,
    tail: { len: 0.85, w: 0.09, droop: 0.5, curl: 0.15, type: 'fine' },
  },
  renne: {
    ground: 1.05, hip: [-0.55, -0.3], shoulder: [0.42, -0.32], depth: 0.34,
    neck: [[0.6, -0.48, 0.22], [0.72, -0.62, 0.2]],
    head: { x: 0.84, y: -0.66, L: 0.62, D: 0.42, snout: 0.55, ear: 'pointe', earR: 0.6, eye: [0.14, -0.2], eyeR: 0.12, noseCol: '#4A3A30' },
    legW: 0.075, stride: 0.42, cadence: 2,
    tail: { len: 0.2, w: 0.06, droop: 0.3, type: 'touffue' },
  },
};

/* ============================================================================
   LE CATALOGUE : chaque espèce, en quelques mesures
   ============================================================================ */
export const ANIMAUX_C = {
  /* ---- La voie des airs : les oiseaux ---- */
  asteriornis: bird({
    a: 0.74, b: 0.56, tilt: -0.1, neck: { L: 0.26, up: 0.95, w: 0.26 }, head: { r: 0.36 },
    beak: { L: 0.34, D: 0.26, col: '#D8B46E', curve: 0.22 }, wing: { L: 1.15, chord: 0.6, n: 5 },
    tail: { L: 0.3, n: 5, spread: 0.6, up: 0.3 }, legs: { L: 0.52, col: '#C88A48', w: 0.06, toes: 0.24 }, flapRate: 13,
  }),
  pelagornis: bird({
    a: 0.86, b: 0.48, tilt: -0.08, neck: { L: 0.4, up: 0.9, w: 0.24 }, head: { r: 0.32 },
    beak: { L: 0.95, D: 0.24, col: '#E6C98A', curve: 0.08, hook: 0.18, teeth: true }, wing: { L: 2.4, chord: 0.62, n: 6, tip: '#3A3A40' },
    tail: { L: 0.45, n: 5, spread: 0.3, up: 0.1 }, legs: { L: 0.44, col: '#E4A86A', w: 0.06, toes: 0.26 }, flapRate: 5,
  }),
  phorusrhacos: bird({
    a: 0.72, b: 0.62, tilt: -0.42, flightless: true, neck: { L: 0.5, up: 1.15, w: 0.3 }, head: { r: 0.52 },
    beak: { L: 0.72, D: 0.52, col: '#E2B34E', curve: 0.1, hook: 0.42, gape: 0.6 }, wing: { L: 0.5, chord: 0.4, n: 4, fold: 0.85 },
    tail: { L: 0.5, n: 6, spread: 0.5, up: 0.05 }, legs: { L: 1.25, col: '#C9A04A', w: 0.08, toes: 0.3, pants: '#7A5A3A' }, cadence: 2.2,
    eye: { k: 0.24, iris: '#E8C040', brow: true },
  }),
  argentavis: bird({
    a: 0.9, b: 0.56, tilt: -0.22, neck: { L: 0.34, up: 0.85, w: 0.25 }, head: { r: 0.3, col: '#C9A492', ruff: '#F4EEE4' },
    beak: { L: 0.5, D: 0.3, col: '#E8D4A8', curve: 0.1, hook: 0.32, cere: '#B8907A' }, wing: { L: 2.5, chord: 0.7, n: 7, tip: '#1E1C1E', bar: 'rgba(255, 255, 255, 0.5)' },
    tail: { L: 0.6, n: 6, spread: 0.4, up: 0.08 }, legs: { L: 0.55, col: '#BDB2A2', w: 0.07, toes: 0.3 }, flapRate: 4,
    eye: { k: 0.28, iris: '#8A3A2A' },
  }),
  corbeau: bird({
    a: 0.78, b: 0.5, tilt: -0.2, neck: { L: 0.26, up: 0.85, w: 0.26 }, head: { r: 0.36 },
    beak: { L: 0.55, D: 0.3, col: '#2E2C34', curve: 0.25, hook: 0.08 }, wing: { L: 1.5, chord: 0.62, n: 6, tip: '#14141C', bar: 'rgba(160, 170, 255, 0.35)' },
    tail: { L: 0.7, n: 5, spread: 0.35, up: 0.1 }, legs: { L: 0.62, col: '#2A2A30', w: 0.055, toes: 0.26 }, flapRate: 8,
  }),
  labbe: bird({
    a: 0.76, b: 0.48, neck: { L: 0.26, up: 0.8, w: 0.24 }, head: { r: 0.32, mask: 'rgba(40, 30, 30, 0.35)' },
    beak: { L: 0.42, D: 0.2, col: '#3A3230', curve: 0.1, hook: 0.2 }, wing: { L: 1.7, chord: 0.5, n: 6, tip: '#2A2420', bar: 'rgba(255, 255, 255, 0.55)' },
    tail: { L: 0.6, n: 4, spread: 0.3, fork: 0.2 }, legs: { L: 0.5, col: '#2A2626', w: 0.05 }, flapRate: 8,
  }),
  vautour: bird({
    a: 0.84, b: 0.56, tilt: -0.3, neck: { L: 0.38, up: 0.75, w: 0.2 }, head: { r: 0.28, col: '#D9927A', ruff: '#F0E6D8' },
    beak: { L: 0.4, D: 0.24, col: '#E8D8B8', curve: 0.1, hook: 0.3 }, wing: { L: 2.0, chord: 0.64, n: 6, tip: '#221E1E' },
    tail: { L: 0.45, n: 6, spread: 0.4 }, legs: { L: 0.55, col: '#B8AC9C', w: 0.06 }, flapRate: 5,
  }),
  aigle: bird({
    a: 0.8, b: 0.52, tilt: -0.28, neck: { L: 0.24, up: 0.8, w: 0.27 }, head: { r: 0.36, col: '#E8D8B0' },
    beak: { L: 0.42, D: 0.3, col: '#F0C84A', curve: 0.2, hook: 0.45, cere: '#F2D060' }, wing: { L: 2.0, chord: 0.66, n: 7, tip: '#2A1E16' },
    tail: { L: 0.62, n: 6, spread: 0.35, col: '#5A3E28' }, legs: { L: 0.55, col: '#F0C84A', w: 0.07, toes: 0.3, pants: '#7A5A3A', talons: true }, flapRate: 6,
    eye: { k: 0.26, iris: '#E8A830', brow: true },
  }),
  passereau: bird({
    a: 0.7, b: 0.55, neck: { L: 0.18, up: 0.9, w: 0.28 }, head: { r: 0.38 }, beak: { L: 0.26, D: 0.2, col: '#3A3430', curve: 0.1 },
    wing: { L: 1.1, chord: 0.55, n: 5 }, tail: { L: 0.55, n: 4, spread: 0.3, up: 0.25 }, legs: { L: 0.4, col: '#6A5A4A', w: 0.05 }, flapRate: 16,
  }),
  genyornis: bird({
    a: 0.9, b: 0.66, tilt: -0.3, flightless: true, neck: { L: 0.62, up: 1.25, w: 0.26 }, head: { r: 0.38 },
    beak: { L: 0.5, D: 0.42, col: '#C9A060', curve: 0.25, hook: 0.08 }, wing: { L: 0.5, chord: 0.4, fold: 0.7 },
    tail: { L: 0.35, n: 6, spread: 0.6 }, legs: { L: 1.25, col: '#8A7A6A', w: 0.09, toes: 0.3 }, cadence: 2,
  }),
  colibri: bird({
    a: 0.62, b: 0.42, neck: { L: 0.1, up: 0.6, w: 0.24 }, head: { r: 0.34 }, beak: { L: 1.1, D: 0.1, col: '#2A2A2A', curve: 0.05 },
    wing: { L: 1.2, chord: 0.4, n: 5 }, tail: { L: 0.5, n: 4, spread: 0.4 }, legs: { L: 0.25, col: '#2A2A2A', w: 0.04 }, flapRate: 40,
  }),
  perroquet: bird({
    a: 0.7, b: 0.52, tilt: -0.55, neck: { L: 0.18, up: 1, w: 0.3 }, head: { r: 0.42, col: '#F2D23A' },
    beak: { L: 0.36, D: 0.44, col: '#2A2A2A', curve: 0.2, hook: 0.55 }, wing: { L: 1.4, chord: 0.6, col: '#2E8AE0', tip: '#1A4AA0' },
    tail: { L: 1.2, n: 4, spread: 0.12, up: -0.3, col: '#2E8AE0' }, legs: { L: 0.35, col: '#5A5A6A', w: 0.06 },
  }),
  manchot: bird({
    a: 0.6, b: 0.7, tilt: -1.1, flightless: true, neck: { L: 0.12, up: 0.9, w: 0.34 }, head: { r: 0.4, col: '#1E1E2A' },
    beak: { L: 0.42, D: 0.18, col: '#2A2A30', curve: 0.1 }, wing: { L: 0.5, chord: 0.3, fold: 0.6, col: '#1E1E2A' },
    tail: { L: 0.15, n: 3, spread: 0.3 }, legs: { L: 0.28, col: '#E8904A', w: 0.08, toes: 0.25 }, cadence: 3.4,
  }),
  autruche: bird({
    a: 0.8, b: 0.62, tilt: -0.15, flightless: true, neck: { L: 1.0, up: 1.35, w: 0.18 }, head: { r: 0.28, col: '#D8B8A8' },
    beak: { L: 0.36, D: 0.2, col: '#D8B8A0', curve: 0.1 }, wing: { L: 0.6, chord: 0.5, fold: 0.9, col: '#1E1A1A', tip: '#F2F0EA' },
    tail: { L: 0.4, n: 6, spread: 0.7, col: '#F2F0EA' }, legs: { L: 1.5, col: '#D8B8A8', w: 0.09, toes: 0.26 }, cadence: 2,
  }),
  flamant: bird({
    a: 0.7, b: 0.48, tilt: -0.1, neck: { L: 0.9, up: 1.5, w: 0.13 }, head: { r: 0.26 },
    beak: { L: 0.42, D: 0.24, col: '#2A2224', curve: 0.6, hook: 0.2 }, wing: { L: 1.5, chord: 0.55, tip: '#1A1A1A' },
    tail: { L: 0.3, n: 4, spread: 0.3 }, legs: { L: 1.6, col: '#E87A8A', w: 0.05, toes: 0.2 },
  }),
  chouette: bird({
    a: 0.66, b: 0.62, tilt: -0.75, neck: { L: 0.06, up: 0.9, w: 0.4 }, head: { r: 0.52 },
    beak: { L: 0.18, D: 0.22, col: '#4A3A30', curve: 0.2, hook: 0.5 }, wing: { L: 1.5, chord: 0.66 },
    tail: { L: 0.3, n: 5, spread: 0.3 }, legs: { L: 0.3, col: '#B8A890', w: 0.07, pants: '#B8A890', talons: true },
    eye: { k: 0.38, iris: '#F2B630' },
  }),
  poule: bird({
    a: 0.74, b: 0.62, tilt: -0.2, neck: { L: 0.3, up: 1.2, w: 0.3 }, head: { r: 0.34, crest: { n: 4, L: 0.7, col: '#E2333E' } },
    beak: { L: 0.26, D: 0.24, col: '#E8C04A', curve: 0.2 }, wing: { L: 1.0, chord: 0.6 },
    tail: { L: 0.8, n: 6, spread: 0.8, up: 0.9, col: '#3A2A20' }, legs: { L: 0.5, col: '#E8B44A', w: 0.07, toes: 0.26 },
  }),
  toucan: bird({
    a: 0.66, b: 0.5, tilt: -0.3, neck: { L: 0.14, up: 0.9, w: 0.3 }, head: { r: 0.36, mask: '#F2F0E8' },
    beak: { L: 1.1, D: 0.5, col: '#F29A2A', curve: 0.2, hook: 0.15 }, wing: { L: 1.1, chord: 0.55, col: '#1E1E24', tip: '#0E0E12' },
    tail: { L: 0.6, n: 4, spread: 0.2, col: '#1E1E24' }, legs: { L: 0.32, col: '#4A6ABA', w: 0.06 },
  }),

  /* ---- La voie des reptiles ---- */
  lezard: rept({ a: 0.55, h: 0.24, neck: 0.18, tail: { L: 1.7, w: 0.7, up: 0.08 }, head: { L: 0.6, D: 0.42, type: 'lezard', eye: 0.11 }, legs: { L: 0.36, w: 0.07, toes: 0.18 }, pattern: 'taches', cadence: 3 }),
  titanoboa: rept({ a: 0.9, h: 0.42, neck: 0.25, snake: true, tail: { L: 4.2, w: 0.95, up: 0 }, head: { L: 0.85, D: 0.66, type: 'serpent', eye: 0.09, gape: 0.9 }, legs: { L: 0 }, pattern: 'losanges', cadence: 1.4 }),
  cameleon: rept({ a: 0.52, h: 0.4, neck: 0.1, tail: { L: 0.9, w: 0.5, up: -0.05, curl: 1.4 }, head: { L: 0.62, D: 0.6, type: 'cameleon', casque: 1.1, eye: 0.13, gape: 0.4 }, legs: { L: 0.46, w: 0.065, toes: 0.12, zygo: true, stride: 0.2 }, back: 'crete', pattern: 'bandes', cadence: 1.4 }),
  purussaurus: rept({ a: 0.75, h: 0.27, neck: 0.25, tail: { L: 1.9, w: 0.8, up: 0 }, head: { L: 1.0, D: 0.48, type: 'croc', teeth: true, eye: 0.08, gape: 0.75 }, legs: { L: 0.36, w: 0.1, toes: 0.18, claws: true }, back: 'osteo', cadence: 2 }),
  megalania: rept({ a: 0.72, h: 0.3, neck: 0.32, tail: { L: 1.9, w: 0.75, up: 0.05 }, head: { L: 0.72, D: 0.42, type: 'varan', eye: 0.08, gape: 0.65 }, legs: { L: 0.5, w: 0.1, toes: 0.2, claws: true, stride: 0.38 }, pattern: 'bandes', cadence: 2.2 }),
  borealosuchus: rept({ a: 0.7, h: 0.26, neck: 0.22, tail: { L: 1.8, w: 0.8 }, head: { L: 0.95, D: 0.44, type: 'croc', teeth: true, eye: 0.08, gape: 0.75 }, legs: { L: 0.34, w: 0.09, toes: 0.18, claws: true }, back: 'osteo', cadence: 2 }),
  serpent: rept({ a: 0.6, h: 0.25, neck: 0.2, snake: true, tail: { L: 2.8, w: 0.9 }, head: { L: 0.6, D: 0.44, type: 'serpent', eye: 0.1, gape: 0.9 }, legs: { L: 0 }, pattern: 'losanges', cadence: 2 }),
  'serpent-arboricole': rept({ a: 0.55, h: 0.14, neck: 0.2, snake: true, tail: { L: 3.2, w: 0.85 }, head: { L: 0.62, D: 0.4, type: 'serpent', eye: 0.13, gape: 0.9 }, legs: { L: 0 }, cadence: 2.2 }),
  cerrejonisuchus: rept({ a: 0.55, h: 0.22, neck: 0.18, tail: { L: 1.5, w: 0.8 }, head: { L: 1.0, D: 0.34, type: 'croc', teeth: true, eye: 0.08 }, legs: { L: 0.3, w: 0.08, toes: 0.16 }, back: 'osteo', cadence: 2.4 }),
  champsosaure: rept({ a: 0.62, h: 0.24, neck: 0.25, tail: { L: 1.8, w: 0.8 }, head: { L: 1.1, D: 0.3, type: 'croc', teeth: true, eye: 0.08 }, legs: { L: 0.3, w: 0.08, toes: 0.16 }, pattern: 'taches', cadence: 2.2 }),
  gryposuchus: rept({ a: 0.72, h: 0.25, neck: 0.25, tail: { L: 1.9, w: 0.8 }, head: { L: 1.3, D: 0.3, type: 'croc', teeth: true, eye: 0.07 }, legs: { L: 0.32, w: 0.09, toes: 0.16 }, back: 'osteo', cadence: 2 }),
  iguane: rept({ a: 0.55, h: 0.27, neck: 0.18, tail: { L: 1.9, w: 0.7, up: 0.05 }, head: { L: 0.62, D: 0.5, type: 'lezard', eye: 0.1, dewlap: 0.5 }, legs: { L: 0.4, w: 0.075, claws: true }, back: 'crete', pattern: 'bandes', cadence: 2.6 }),
  gecko: rept({ a: 0.5, h: 0.24, neck: 0.14, tail: { L: 1.1, w: 0.75, up: 0.04 }, head: { L: 0.6, D: 0.5, type: 'lezard', eye: 0.15 }, legs: { L: 0.36, w: 0.07, toes: 0.2 }, pattern: 'taches', cadence: 3 }),
  komodo: rept({ a: 0.72, h: 0.3, neck: 0.32, tail: { L: 1.7, w: 0.75 }, head: { L: 0.7, D: 0.42, type: 'varan', eye: 0.08 }, legs: { L: 0.48, w: 0.1, claws: true }, pattern: 'ecailles', cadence: 2.2 }),
  crocodile: rept({ a: 0.72, h: 0.27, neck: 0.24, tail: { L: 1.9, w: 0.8 }, head: { L: 0.95, D: 0.45, type: 'croc', teeth: true, eye: 0.08 }, legs: { L: 0.35, w: 0.1, claws: true }, back: 'osteo', cadence: 2 }),

  /* ---- Les tortues ---- */
  carbonemys: { kind: 'tortue', a: 0.95, h: 0.55, legW: 0.14, headR: 0.28, neckUp: 0.15, ridges: true },
  stupendemys: { kind: 'tortue', a: 1.0, h: 0.48, legW: 0.14, headR: 0.24, neckUp: 0.12, ridges: true },
  tortue: { kind: 'tortue', a: 0.9, h: 0.62, legW: 0.15, headR: 0.24, neckUp: 0.2 },
  'tortue-marine': { kind: 'tortue', a: 0.9, h: 0.42, legW: 0.13, headR: 0.24, neckUp: 0.08, flipper: true },

  /* ---- Les poissons ---- */
  poisson: { kind: 'poisson', a: 0.95, h: 0.42, tailL: 0.55, tailW: 0.45, fork: true, dorsal: 0.32, stripes: 0 },
  'poisson-volant': { kind: 'poisson', a: 0.95, h: 0.34, tailL: 0.5, tailW: 0.42, fork: true, dorsal: 0.2, wings: true },
  dipneuste: { kind: 'poisson', a: 1.2, h: 0.3, tailL: 0.4, tailW: 0.25, dorsal: 0.12, eel: true, spots: true },
  piranha: { kind: 'poisson', a: 0.8, h: 0.6, tailL: 0.45, tailW: 0.45, fork: true, dorsal: 0.25, shark: true },
  requin: { kind: 'poisson', a: 1.1, h: 0.36, tailL: 0.7, tailW: 0.6, fork: true, dorsal: 0.55, shark: true },
  arapaima: { kind: 'poisson', a: 1.2, h: 0.32, tailL: 0.5, tailW: 0.4, dorsal: 0.25, spots: true },
  calmar: { kind: 'poisson', a: 1.0, h: 0.3, tailL: 0.3, tailW: 0.55, dorsal: 0, eel: true },

  /* ---- Les insectes ---- */
  scarabee: { kind: 'insecte', type: 'scarabee' },
  libellule: { kind: 'insecte', type: 'libellule' },
  papillon: { kind: 'insecte', type: 'papillon', wing: '#FFB84A' },
  'papillon-bleu': { kind: 'insecte', type: 'papillon', wing: '#4AA8FF', spot: '#1A2A5A' },
  grillon: { kind: 'insecte', type: 'grillon' },
  mouche: { kind: 'insecte', type: 'mouche' },

  /* ---- Ce qui se mange par terre ---- */
  graine: { kind: 'item', type: 'graine' },
  fruit: { kind: 'item', type: 'fruit' },
  noix: { kind: 'item', type: 'noix', shine: true },
  oeuf: { kind: 'item', type: 'oeuf' },
  carcasse: { kind: 'item', type: 'carcasse' },
  viande: { kind: 'item', type: 'viande' },
};

/* ============================================================================
   L'inscription : les looks « vc-<nom> », leur hauteur, leur gueule, leur vignette
   ============================================================================ */
function standOf(S) {
  switch (S.kind) {
    case 'oiseau': return S.b * 0.55 + S.legs.L;
    case 'reptile': return S.snake ? S.h : S.legs.L;
    case 'tortue': return S.h * 0.5 + S.legW * 0.5;
    case 'insecte': return 0.55;
    case 'item': return S.type === 'carcasse' ? 0.55 : 0.75;
    default: return S.h || 0.5;
  }
}
function mouthOf(S) {
  switch (S.kind) {
    case 'oiseau': {
      const n0 = { x: 0.6 * S.a, y: -0.42 * S.b };
      const hx = n0.x + Math.cos(-S.neck.up) * S.neck.L + S.head.r * 0.35, hy = n0.y + Math.sin(-S.neck.up) * S.neck.L;
      // (posé, le corps est penché en arrière : tilt)
      return { x: hx + S.head.r * 0.7 + S.beak.L * 0.8, y: hy + S.head.r * 0.15, tilt: S.tilt };
    }
    case 'reptile': return { x: S.a + S.neck + S.head.L * 0.9, y: S.snake ? -0.1 : 0.02 };
    case 'tortue': return { x: S.a * 1.2 + S.headR, y: -S.h * 0.15 };
    case 'poisson': return { x: S.a * 0.95, y: 0.05 };
    case 'insecte': return { x: 0.6, y: 0 };
    default: return { x: 0.5, y: 0 };
  }
}
function frameOf(S) {
  switch (S.kind) {
    case 'oiseau': return { r: S.flightless ? 0.22 : 0.26, x: 0.46, y: S.flightless ? 0.46 : 0.58 };
    case 'reptile': {
      const len = S.a * 2 + S.neck + S.head.L + S.tail.L;
      return { r: +Math.min(0.24, 0.85 / len).toFixed(3), x: +(0.5 + (S.tail.L - S.head.L - S.neck) * 0.5 * Math.min(0.24, 0.85 / len)).toFixed(3), y: 0.52 };
    }
    case 'tortue': return { r: 0.3, x: 0.45, y: 0.55 };
    case 'poisson': return { r: 0.3, x: 0.55, y: 0.5 };
    case 'insecte': return { r: 0.32, x: 0.48, y: 0.5 };
    default: return { r: 0.34, x: 0.5, y: 0.5 };
  }
}

function drawerOf(S) {
  switch (S.kind) {
    case 'oiseau': return drawBird;
    case 'reptile': return drawReptile;
    case 'tortue': return drawTurtle;
    case 'poisson': return drawFishSide;
    case 'insecte': return drawInsect;
    default: return drawItem;
  }
}

for (const [id, S] of Object.entries(ANIMAUX_C)) {
  const look = `vc-${id}`;
  S.look = look;
  STAND[look] = standOf(S);
  MOUTH[look] = mouthOf(S);
  FRAMES[look] = frameOf(S);
  SNOUT[look] = MOUTH[look].x;
  if (S.kind === 'oiseau' && !S.flightless) FLIERS.add(look);
  if (S.kind === 'insecte' && (S.type === 'libellule' || S.type === 'papillon' || S.type === 'mouche')) FLIERS.add(look);
  const draw = drawerOf(S);
  LOOKS[look] = (ctx, c, t) => draw(ctx, c, t, S, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe, shell: c.sp.shell });
}
for (const [id, P] of Object.entries(MAMMIFERES)) {
  const look = `vc-${id}`;
  STAND[look] = P.ground;
  MOUTH[look] = { x: P.head.x + P.head.L * 0.7, y: P.head.y + P.head.D * 0.1 };
  SNOUT[look] = MOUTH[look].x;
  FRAMES[look] = { r: 0.3, x: 0.44, y: 0.42 };
  LOOKS[look] = (ctx, c, t) => drawMammal(ctx, c, t, P, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
}
// le loup (de profil, dessiné par art-profil.js) et les humains
STAND.loup = 0.9;
MOUTH.loup = { x: 1.5, y: -0.4 };
FRAMES.loup = { r: 0.28, x: 0.4, y: 0.52 };
for (const [id, o] of [['humain', {}], ['chasseur', { spear: true }], ['enfant', { child: true }]]) {
  const look = `vc-${id}`;
  STAND[look] = 0.98;
  MOUTH[look] = { x: 0.3, y: -0.6 };
  FRAMES[look] = { r: 0.36, x: 0.5, y: 0.52 };
  LOOKS[look] = (ctx, c, t) => drawPerson(ctx, c, t, o);
}

/* ============================================================================
   LE JOUEUR : ses formes (« vc-<nom> ») et ses évolutions qui se voient
   ============================================================================ */
const PARTS_C = {
  asteriornis: (P) => ({ beakK: P['bec-solide'] ? 1.3 : 1, wingK: P['ailes-longues'] ? 1.25 : 1, crest: P.huppe ? { n: 3, L: 0.8, col: shade(PLAYER.body, -0.25) } : null }),
  pelagornis: (P) => ({ wingK: P['ailes-geantes'] ? 1.2 : 1, teeth: !!P['dents-os'], beakK: P['dents-os'] ? 1.1 : 1 }),
  phorusrhacos: (P) => ({ beakK: P['bec-hache'] ? 1.22 : 1, legK: P['longues-pattes'] ? 1.15 : 1, headK: P['bec-hache'] ? 1.08 : 1 }),
  argentavis: (P) => ({ wingK: P['ailes-planeur'] ? 1.15 : 1, headCol: P['tete-nue'] ? '#D9927A' : null }),
  corbeau: (P) => ({ beakK: P['bec-malin'] ? 1.15 : 1, crest: P.croassement ? { n: 2, L: 0.5, col: shade(PLAYER.body, -0.2) } : null }),
  lezard: (P) => ({ legK: P['pattes-agiles'] ? 1.2 : 1, claws: !!P.griffes, tailK: P['queue-longue'] ? 1.2 : 1 }),
  titanoboa: (P) => ({ fat: P['corps-geant'] ? 1.18 : 1, headK: P['machoire-elastique'] ? 1.15 : 1 }),
  cameleon: (P) => ({ curlK: P['queue-prehensile'] ? 1.3 : 1, headK: P.casque ? 1.12 : 1 }),
  purussaurus: (P) => ({ headK: P['machoire-geante'] ? 1.12 : 1, back: P.cuirasse ? 'osteo' : null, fat: P.cuirasse ? 1.08 : 1 }),
  megalania: (P) => ({ claws: !!P.griffes, legK: P['pattes-fortes'] ? 1.12 : 1, back: P.cuirasse ? 'osteo' : null }),
};
for (const [id, make] of Object.entries(PARTS_C)) {
  const S = ANIMAUX_C[id];
  const form = `vc-${id}`;
  const draw = drawerOf(S);
  FORM_SPINE[form] = null;
  STAND[form] = STAND[S.look];
  MOUTH[form] = MOUTH[S.look];
  SNOUT[form] = MOUTH[form].x;
  FRAMES[form] = FRAMES[S.look];
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const o = make(parts || {});
    draw(ctx, { ...p, mood, seed: 0, sp: { look: S.look } }, t, S, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.3), dark: PLAYER.dark, cute: true,
      wingCol: PLAYER.wing || null, tipCol: PLAYER.tip || null, beakCol: PLAYER.beak || null, ...o,
    });
  };
}
