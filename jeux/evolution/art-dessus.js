// ============================================================================
// Évolution — les animaux de la terre ferme (niveaux 2, 3 et 4), VUS DE
// DESSUS, comme ceux de la mer et comme tout le décor (les arbres, les
// rochers, les mares). Un style simple : de jolis aplats, un contour un peu
// plus foncé que l'animal, le ventre clair qui dépasse sur les bords, un
// reflet sur le dos, de petits yeux brillants.
//
// Le corps suit une colonne souple (comme les requins) : la tête va où elle
// veut et le corps suit en douceur, la queue se balance. Les pattes sortent
// de dessous le corps et trottent à tour de rôle, au rythme des pas (elles ne
// glissent pas, et ne quittent jamais le corps).
//
// Un seul dessinateur (drawLand) pour tout le monde : chaque espèce n'est
// qu'une liste de mesures (ANIMAUX). Les détails se voient d'en haut : les
// cornes, les bois, la trompe, les défenses, la collerette du tricératops,
// les plaques du stégosaure, la voile du dimétrodon, la crinière, la laine…
// Aussi : les humains (vus de dessus, eux aussi), la queue-leurre du lézard
// et l'animal caché dans les fougères. Les looks s'appellent « vd-<nom> ».
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SPINES, SNOUT, shade, seeded, smoothClosed, spineShape, segDir, eyes, makeSpine } from './art.js';

const TAU = Math.PI * 2;
const HORN = '#EFE4C8';
const IVORY = '#F6EEDA';
const ANTLER = '#E2D2AE';
const HOOF = '#3A2E26';
const CLAW = '#2E2620';
const NOSE = '#2A2024';
const PINK = '#E59AA2';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 16;
}
function profileAt(prof, k) {
  const x = k * (prof.length - 1);
  const i = Math.min(prof.length - 2, Math.floor(x));
  return prof[i] + (prof[i + 1] - prof[i]) * (x - i);
}

/** La colonne qui marche : le corps se balance doucement, la queue un peu plus (et frétille quand il est content) */
function walkSpine(c, look, t, S) {
  const base = c.spine || makeSpine(c.x, c.y, c.angle, c.size, look);
  const n = base.length, r = c.size;
  const k = clamp(c.speed ?? 0.3, 0, 1.3);
  const ph = (c.walk ?? t * 1.5) * (S.cadence ?? 2.2) + (c.seed || 0) * 3;
  const amp = (S.sway ?? 0.05) * (0.3 + k);
  const tailAt = S.tailAt ?? 0.6;
  const wag = S.wag && c.mood === 'happy' ? S.wag : 0;
  return base.map((p, i) => {
    if (i === 0) return { x: p.x, y: p.y };
    const d = segDir(base, i);
    const u = i / (n - 1);
    let off = Math.sin(ph * 0.5 + t * 0.6 - i * 0.7) * amp * r * u * u;
    if (wag && u > tailAt) off += Math.sin(t * 14 - i * 0.6 + (c.seed || 0)) * wag * r * (u - tailAt);
    return { x: p.x - d.y * off, y: p.y + d.x * off };
  });
}

/* ---------- Petits outils ---------- */
/** Un trait épais, cerné (une patte, une corne fine, un bois) */
function limb(ctx, pts, w, col, dark, lw) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [c, k] of [[dark, w + lw * 2], [col, w]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = k;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
    else for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
}
/** Une forme pointue (corne, pointe, griffe) de la base (bx, by) à la pointe (tx, ty) */
function cone(ctx, bx, by, tx, ty, w, col, dark, lw, bend = 0) {
  const dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(bx + nx * w, by + ny * w);
  ctx.quadraticCurveTo(bx + dx * 0.55 + nx * (w * 0.5 + bend), by + dy * 0.55 + ny * (w * 0.5 + bend), tx, ty);
  ctx.quadraticCurveTo(bx + dx * 0.55 - nx * (w * 0.5 - bend), by + dy * 0.55 - ny * (w * 0.5 - bend), bx - nx * w, by - ny * w);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
function ellipse(ctx, x, y, rx, ry, a, col, dark, lw) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a, 0, TAU);
  ctx.fill();
  if (dark) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** Un petit œil noir et brillant (le sourcil dit l'humeur) — comme les requins */
function darkEye(ctx, x, y, a, s, R, mood) {
  const fx = Math.cos(a), fy = Math.sin(a);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.15, R * 0.9, a, 0, TAU);
  ctx.fill();
  if (!fine) return;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.arc(x + fx * R * 0.3 - fy * R * 0.2 * s, y + fy * R * 0.3 + fx * R * 0.2 * s - R * 0.15, R * 0.32, 0, TAU);
  ctx.fill();
  if (mood === 'angry' || mood === 'scared') {
    const up = mood === 'angry' ? 1 : -1;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, R * 0.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - fx * R * 1.5 - fy * R * 1.3 * s, y - fy * R * 1.5 + fx * R * 1.3 * s);
    ctx.lineTo(x + fx * R * 1.5 - fy * R * (1.3 - up * 0.8) * s, y + fy * R * 1.5 + fx * R * (1.3 - up * 0.8) * s);
    ctx.stroke();
  }
}

/* ============================================================================
   L'animal entier, vu de dessus.
   S : { spine [n, gap], body (largeurs, du cou au bout de la queue, × r),
         nose (l'avant du corps), legs [{ at, len, w, foot, ph, stride, fwd,
         sprawl }], biped, arms { at, len }, head { l, w, snout, type ('mam',
         'rep', 'bec'), ears, earK, nose, eye [avant, écart], eyeR, teeth,
         muzzle, horns, antlers, trunk, tusks, sabers, beak, whiskers, crest,
         frill }, et les détails : stripes, spots, saddle, ridge, mane, wool,
         shaggy, cape, plates, sail, spikes, club, armor, studs, feathers,
         tuft, pompon, crin, fan, tailFin, wings }
   ============================================================================ */
export function drawLand(ctx, c, t, S, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  if (c.buried) { drawHidden(ctx, c, t); return; }
  const dark = o.dark || shade(col, -0.55);
  const belly = o.belly || S.belly || shade(col, 0.45);
  const lw = Math.max(0.8, r * 0.035);
  const base = walkSpine(c, c.look, t, S);
  // (le lézard qui vient de laisser sa queue en leurre : il en manque un bout)
  const cut = c.tailCut ? Math.max(3, base.length - c.tailCut) : base.length;
  const pts = base.slice(0, cut);
  const n = pts.length, full = base.length;
  const widths = pts.map((_, i) => r * profileAt(S.body, i / (full - 1)) * (i > 0 && o.fluffy && i / (full - 1) > (S.tailAt ?? 0.6) ? 1.25 : 1));
  const d0 = segDir(pts, 0);
  const a = Math.atan2(d0.y, d0.x);
  const spd = clamp(c.speed ?? 0, 0, 1.3);
  const ph = (c.walk ?? 0) * (S.cadence ?? 2.2);
  const legCol = S.legCol || shade(col, -0.08);
  const nose = S.nose ?? 0.8;

  // l'ombre, par terre
  ctx.fillStyle = 'rgba(0, 25, 15, 0.2)';
  smoothClosed(ctx, spineShape(pts.map((p) => ({ x: p.x + r * 0.1, y: p.y + r * 0.2 })), widths.map((w) => w * 1.08 + r * 0.06), nose));
  ctx.fill();

  // les pattes : elles sortent de sous le corps et trottent à tour de rôle
  const k = Math.min(1, spd * 1.6);
  const legs = [];
  for (const L of S.legs || []) {
    const i = Math.min(n - 1, Math.round(L.at * (full - 1)));
    const d = segDir(pts, i), nx = -d.y, ny = d.x;
    for (const s of [-1, 1]) {
      const phase = ph + (L.ph || 0) * Math.PI + (s > 0 ? 0 : Math.PI);
      const swing = Math.sin(phase) * (L.stride ?? 0.24) * 1.25 * r * k;
      const lift = Math.max(0, Math.cos(phase)) * k;
      const w = widths[i];
      const len = (L.len ?? 0.22) * r * 1.45 * (o.legK || 1);
      // les reptiles (sprawl) écartent les pattes sur le côté ; les autres les gardent sous le corps :
      // on ne voit que le bout de la patte, qui avance et recule le long du ventre
      const tuck = !L.sprawl;
      const ax = pts[i].x + nx * s * w * (tuck ? 0.55 : 0.4), ay = pts[i].y + ny * s * w * (tuck ? 0.55 : 0.4);
      const out = tuck ? w * 1.02 + len * 0.12 - lift * w * 0.1 : w * 0.85 + len * 0.8;
      const fwd = (L.fwd || 0) * r + swing * (tuck ? 1.35 : 1) + (tuck ? (L.ph ? -1 : 1) * len * 0.2 : 0);
      const fx = pts[i].x + nx * s * out + d.x * fwd, fy = pts[i].y + ny * s * out + d.y * fwd;
      legs.push({ ax, ay, fx, fy, d, s, nx, ny, lift, L, w, len });
    }
  }
  for (const G of legs) drawLeg(ctx, G, r, legCol, dark, lw, o);

  // la queue en crins (cheval), la queue en éventail (oiseau), la nageoire du tétrapode : sous le corps
  if (n === full) tailUnder(ctx, c, t, S, pts, widths, r, col, dark, lw);

  // le corps : le ventre clair dépasse sur les bords, le dos est plus foncé au milieu
  const outline = spineShape(pts, widths, nose);
  ctx.fillStyle = belly;
  smoothClosed(ctx, outline);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    const back = spineShape(pts, widths.map((w) => w * 0.8), nose);
    const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[n - 1].x, pts[n - 1].y);
    g.addColorStop(0, shade(col, 0.06));
    g.addColorStop(1, shade(col, -0.06));
    ctx.fillStyle = g;
    smoothClosed(ctx, back);
    ctx.fill();
    bodyMarks(ctx, c, S, pts, widths, n, full, r, col, dark, lw, o);
    // un reflet de lumière sur le dos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = r * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 1; i < Math.max(2, Math.round(n * 0.7)); i++) {
      const d = segDir(pts, i);
      const x = pts[i].x + d.y * widths[i] * 0.32, y = pts[i].y - d.x * widths[i] * 0.32;
      if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = col;
    smoothClosed(ctx, spineShape(pts, widths.map((w) => w * 0.8), nose));
    ctx.fill();
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, outline);
  ctx.stroke();

  // ce qui se voit sur le dos
  backThings(ctx, c, t, S, pts, widths, n, full, r, col, dark, lw, o);
  // les petits bras des bipèdes
  if (S.arms) armsOf(ctx, c, t, S, pts, widths, full, r, legCol, dark, lw, o);
  // la tête
  drawHead(ctx, c, t, S, pts[0], a, r, col, dark, lw, o, belly);
}

/* ---------- Une patte, vue de dessus ---------- */
function drawLeg(ctx, G, r, col, dark, lw, o) {
  const { ax, ay, fx, fy, d, s, nx, ny, lift, L } = G;
  const w = (L.w ?? 0.1) * r;
  // (la patte levée est un peu plus près de nous : un peu plus grande, un peu plus claire)
  const up = 1 + lift * 0.12;
  if (L.sprawl) {
    // les reptiles : le coude part sur le côté
    const ex = (ax + fx) / 2 + nx * s * G.len * 0.35 - d.x * r * 0.04, ey = (ay + fy) / 2 + ny * s * G.len * 0.35 - d.y * r * 0.04;
    limb(ctx, [{ x: ax, y: ay }, { x: ex, y: ey }, { x: fx, y: fy }], w, col, dark, lw);
  } else {
    limb(ctx, [{ x: ax, y: ay }, { x: fx, y: fy }], w, col, dark, lw);
  }
  const fa = Math.atan2(d.y, d.x);
  const foot = L.foot || 'patte';
  if (foot === 'sabot') {
    ellipse(ctx, fx + d.x * w * 0.15, fy + d.y * w * 0.15, w * 0.72 * up, w * 0.62 * up, fa, HOOF, dark, lw * 0.8);
  } else if (foot === 'colonne') {
    ellipse(ctx, fx, fy, w * 0.7 * up, w * 0.66 * up, fa, shade(col, -0.05), dark, lw);
    if (fine) for (const k of [-0.45, 0, 0.45]) ellipse(ctx, fx + d.x * w * 0.5 - d.y * w * k, fy + d.y * w * 0.5 + d.x * w * k, w * 0.15, w * 0.11, fa, IVORY, null);
  } else if (foot === 'griffe') {
    // trois doigts griffus, vers l'avant
    for (const k of [-0.5, 0, 0.5]) {
      const tx = fx + d.x * w * 1.3 - d.y * w * k * 1.1, ty = fy + d.y * w * 1.3 + d.x * w * k * 1.1;
      limb(ctx, [{ x: fx, y: fy }, { x: tx, y: ty }], w * 0.42, col, dark, lw * 0.7);
      if (fine) cone(ctx, tx, ty, tx + d.x * w * 0.5, ty + d.y * w * 0.5, w * 0.16, CLAW, CLAW, lw * 0.3);
    }
    ellipse(ctx, fx, fy, w * 0.55 * up, w * 0.5 * up, fa, col, dark, lw * 0.8);
  } else {
    ellipse(ctx, fx + d.x * w * 0.1, fy + d.y * w * 0.1, w * 0.78 * up, w * 0.68 * up, fa, shade(col, lift * 0.06), dark, lw * 0.9);
    if ((L.claws || o.claws) && fine) {
      for (const k of [-0.4, 0, 0.4]) {
        const tx = fx + d.x * w * 0.62 - d.y * w * k, ty = fy + d.y * w * 0.62 + d.x * w * k;
        cone(ctx, tx, ty, tx + d.x * w * 0.4, ty + d.y * w * 0.4, w * 0.12, CLAW, CLAW, lw * 0.3);
      }
    }
  }
}

/* ---------- Sous le corps : la queue en crins, l'éventail de plumes, la nageoire ---------- */
function tailUnder(ctx, c, t, S, pts, widths, r, col, dark, lw) {
  const n = pts.length;
  const tail = pts[n - 1], td = segDir(pts, n - 1);
  const ta = Math.atan2(-td.y, -td.x);
  const sw = Math.sin(t * 2.2 + (c.seed || 0)) * 0.18 + Math.sin((c.walk ?? 0) * 2.2) * 0.12 * clamp(c.speed ?? 0, 0, 1);
  if (S.crin) {
    // une longue queue de crins, plus foncée, qui se balance
    const L = r * S.crin, a1 = ta + sw;
    const mx = tail.x + Math.cos(ta + sw * 0.5) * L * 0.5, my = tail.y + Math.sin(ta + sw * 0.5) * L * 0.5;
    const ex = tail.x + Math.cos(a1) * L, ey = tail.y + Math.sin(a1) * L;
    const w = r * 0.13;
    const hc = S.maneCol || shade(col, -0.45);
    ctx.fillStyle = hc;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(tail.x - Math.sin(ta) * w * 0.6, tail.y + Math.cos(ta) * w * 0.6);
    ctx.quadraticCurveTo(mx - Math.sin(ta) * w * 1.3, my + Math.cos(ta) * w * 1.3, ex, ey);
    ctx.quadraticCurveTo(mx + Math.sin(ta) * w * 1.3, my - Math.cos(ta) * w * 1.3, tail.x + Math.sin(ta) * w * 0.6, tail.y - Math.cos(ta) * w * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = shade(hc, 0.25);
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }
  }
  if (S.fan) {
    // l'éventail de plumes de la queue d'un oiseau
    for (const k of [-0.5, 0, 0.5]) {
      const b = ta + k + sw * 0.3;
      ellipse(ctx, tail.x + Math.cos(b) * r * S.fan * 0.6, tail.y + Math.sin(b) * r * S.fan * 0.6, r * S.fan * 0.62, r * S.fan * 0.2, b, shade(col, -0.22), dark, lw * 0.8);
    }
  }
  if (S.tailFin) {
    // la nageoire de la queue du tétrapode (il sort tout juste de l'eau)
    const i0 = Math.round(n * 0.45);
    const tn = { x: -td.y, y: td.x };
    ctx.fillStyle = shade(col, 0.22);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(pts[i0].x, pts[i0].y);
    ctx.quadraticCurveTo(tail.x + tn.x * r * 0.3, tail.y + tn.y * r * 0.3, tail.x - td.x * r * 0.4, tail.y - td.y * r * 0.4);
    ctx.quadraticCurveTo(tail.x - tn.x * r * 0.3, tail.y - tn.y * r * 0.3, pts[i0].x, pts[i0].y);
    ctx.fill();
    ctx.stroke();
  }
}

/* ---------- Les motifs du pelage, de la peau (dans le corps) ---------- */
function bodyMarks(ctx, c, S, pts, widths, n, full, r, col, dark, lw, o) {
  const stripe = o.stripe || shade(col, -0.4);
  const idx = (f) => Math.min(n - 1, Math.round(f * (full - 1)));
  if (S.saddle) {
    // une « selle » plus sombre sur le dos (loups, chiens)
    const i0 = idx(S.saddle[0]), i1 = idx(S.saddle[1]);
    if (i1 > i0 + 1) {
      ctx.fillStyle = shade(col, -0.2);
      smoothClosed(ctx, spineShape(pts.slice(i0, i1 + 1), widths.slice(i0, i1 + 1).map((w, k) => w * (0.35 + 0.35 * Math.sin((k / (i1 - i0)) * Math.PI))), 0.5));
      ctx.fill();
    }
  }
  if (S.cape) {
    // l'avant du corps couvert de longs poils sombres (bison)
    const i1 = idx(S.cape);
    ctx.fillStyle = shade(col, -0.25);
    smoothClosed(ctx, spineShape(pts.slice(0, i1 + 1), widths.slice(0, i1 + 1).map((w) => w * 1.1), 0.8));
    ctx.fill();
  }
  if (S.stripes) {
    ctx.fillStyle = stripe;
    const i1 = idx(0.95);
    for (let i = 1; i <= i1; i++) {
      const d = segDir(pts, i), w = widths[i];
      for (const f of S.stripes === 2 ? [-0.25, 0.25] : [0]) {
        const x = pts[i].x + d.x * f * r * 0.35, y = pts[i].y + d.y * f * r * 0.35;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.045, w * 0.95, Math.atan2(d.y, d.x), 0, TAU);
        ctx.fill();
      }
    }
  }
  if (S.spots || o.patch) {
    const rnd = seeded(17 + (S.spots || 3));
    const big = !S.spots;
    ctx.fillStyle = big ? o.patch : (S.spotCol || stripe);
    const m = S.spots || 4;
    for (let k = 0; k < m; k++) {
      const i = 1 + Math.floor(rnd() * Math.max(1, idx(S.tailAt ?? 0.6) - 1));
      const d = segDir(pts, i), u = (rnd() - 0.5) * 1.3 * widths[i];
      ctx.beginPath();
      ctx.ellipse(pts[i].x - d.y * u, pts[i].y + d.x * u, r * (big ? 0.16 : 0.035 + rnd() * 0.035), r * (big ? 0.12 : 0.03 + rnd() * 0.025), rnd() * 3, 0, TAU);
      ctx.fill();
    }
  }
  if (S.ridge) {
    // une crête de poils sombres le long du dos (hyène, Entelodon)
    ctx.strokeStyle = shade(col, -0.45);
    ctx.lineWidth = r * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= idx(S.ridge); i++) (i ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y));
    ctx.stroke();
  }
}

/* ---------- Ce qui se voit sur le dos : crinière, laine, plaques, voile, armure… ---------- */
function backThings(ctx, c, t, S, pts, widths, n, full, r, col, dark, lw, o) {
  const idx = (f) => Math.min(n - 1, Math.round(f * (full - 1)));
  // la crinière du cheval : une bande de poils foncés sur le cou
  if (S.mane) {
    const i1 = idx(S.mane);
    const mc = S.maneCol || shade(col, -0.45);
    const p = pts.slice(0, i1 + 1);
    limb(ctx, p, r * 0.065, mc, dark, lw * 0.8);
  }
  // les longs poils qui dépassent sur les bords (mammouth, rhinocéros laineux)
  if (S.shaggy || o.shaggy) {
    const L = r * (S.shaggy || o.shaggy);
    const hc = shade(col, -0.1);
    const i1 = idx(S.tailAt ?? 0.65);
    for (let i = 1; i <= i1; i++) {
      const d = segDir(pts, i);
      for (const s of [-1, 1]) {
        for (const f of [0, 0.5]) {
          const j = Math.min(n - 1, i + f);
          const x0 = pts[i].x + (pts[Math.min(n - 1, i + 1)].x - pts[i].x) * f, y0 = pts[i].y + (pts[Math.min(n - 1, i + 1)].y - pts[i].y) * f;
          const w = widths[Math.floor(j)];
          const bx = x0 - d.y * w * s * 0.88, by = y0 + d.x * w * s * 0.88;
          // (une mèche posée sur le bord du corps : la fourrure déborde un peu, toute douce)
          const sw = Math.sin(t * 2 + i + f * 3) * L * 0.08;
          ellipse(ctx, bx - d.y * L * 0.12 * s - d.x * sw, by + d.x * L * 0.12 * s - d.y * sw, L * 0.55, L * 0.42, Math.atan2(d.y, d.x), hc, null);
        }
      }
    }
  }
  // la laine du mouton : un gros nuage tout bouclé
  if (S.wool) {
    const i1 = idx(S.woolTo ?? 0.85);
    const blobs = [];
    for (let i = 0; i <= i1; i++) {
      const d = segDir(pts, i), w = widths[i];
      for (const v of [-0.62, 0, 0.62]) blobs.push([pts[i].x - d.y * w * v, pts[i].y + d.x * w * v, w * (v ? 0.48 : 0.55)]);
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 2;
    for (const [x, y, R] of blobs) { ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = shade(S.wool, -0.08);
    for (const [x, y, R] of blobs) { ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); }
    if (fine) {
      ctx.fillStyle = S.wool;
      for (const [x, y, R] of blobs) { ctx.beginPath(); ctx.arc(x - R * 0.15, y - R * 0.18, R * 0.72, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = shade(S.wool, -0.22);
      ctx.lineWidth = lw * 0.6;
      for (let k = 0; k < blobs.length; k += 2) {
        const [x, y, R] = blobs[k];
        ctx.beginPath();
        ctx.arc(x, y, R * 0.35, 0.5, 4);
        ctx.stroke();
      }
    }
  }
  // la voile du dimétrodon : une fine voile rouge, avec ses épines
  if (S.sail) {
    const i0 = idx(S.sail[0]), i1 = idx(S.sail[1]);
    const P = pts.slice(i0, i1 + 1);
    const W = P.map((_, k) => r * 0.14 * Math.sin(((k + 0.5) / P.length) * Math.PI) + r * 0.02);
    ctx.fillStyle = '#C8553D';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, spineShape(P, W, 0.4));
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = shade('#C8553D', -0.4);
      ctx.lineWidth = lw * 0.7;
      for (let k = 0; k < P.length; k++) {
        const d = segDir(P, k);
        ctx.beginPath();
        ctx.moveTo(P[k].x - d.y * W[k], P[k].y + d.x * W[k]);
        ctx.lineTo(P[k].x + d.y * W[k], P[k].y - d.x * W[k]);
        ctx.stroke();
      }
    }
  }
  // les plaques du stégosaure, en quinconce sur le dos
  if (S.plates) {
    const i0 = idx(S.plates[0]), i1 = idx(S.plates[1]);
    const m = S.plates[2] || 9;
    const pc = S.plateCol || '#D9734E';
    for (let k = 0; k < m; k++) {
      const u = (k + 0.5) / m;
      const f = i0 + u * (i1 - i0);
      const i = Math.min(n - 2, Math.floor(f)), w = f - i;
      const x = pts[i].x + (pts[i + 1].x - pts[i].x) * w, y = pts[i].y + (pts[i + 1].y - pts[i].y) * w;
      const d = segDir(pts, i), s = k % 2 ? 1 : -1;
      const L = r * (0.15 + Math.sin(u * Math.PI) * 0.12);
      const px = x - d.y * r * 0.07 * s, py = y + d.x * r * 0.07 * s;
      ctx.fillStyle = pc;
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.moveTo(px + d.x * L, py + d.y * L);
      ctx.quadraticCurveTo(px - d.y * L * 1.1 * s, py + d.x * L * 1.1 * s, px - d.x * L, py - d.y * L);
      ctx.quadraticCurveTo(px + d.y * L * 0.25 * s, py - d.x * L * 0.25 * s, px + d.x * L, py + d.y * L);
      ctx.fill();
      ctx.stroke();
    }
  }
  // l'armure de l'ankylosaure : des bosses, et des pointes sur les côtés
  if (S.armor) {
    const i0 = idx(S.armor[0]), i1 = idx(S.armor[1]);
    for (let i = i0; i <= i1; i++) {
      const d = segDir(pts, i), w = widths[i];
      for (const s of [-1, 1]) {
        const bx = pts[i].x - d.y * w * 0.9 * s, by = pts[i].y + d.x * w * 0.9 * s;
        cone(ctx, bx, by, bx - d.y * r * 0.18 * s - d.x * r * 0.06, by + d.x * r * 0.18 * s - d.y * r * 0.06, r * 0.05, HORN, dark, lw);
      }
      if (fine) for (const u of [-0.5, 0, 0.5]) ellipse(ctx, pts[i].x - d.y * w * u, pts[i].y + d.x * w * u, r * 0.065, r * 0.05, 0, shade(col, 0.2), shade(col, -0.35), lw * 0.6);
    }
  }
  // de petites bosses sur le dos (crocodiles, Postosuchus, peau épaisse)
  if ((S.studs || o.studs) && fine) {
    const [f0, f1] = S.studs || [0.05, 0.85];
    ctx.fillStyle = shade(col, -0.3);
    for (let i = idx(f0); i <= idx(f1); i++) {
      const d = segDir(pts, i), w = widths[i];
      for (const u of [-0.32, 0.32]) {
        ctx.beginPath();
        ctx.ellipse(pts[i].x - d.y * w * u, pts[i].y + d.x * w * u, r * 0.04, r * 0.032, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
  // des plumes sur les bords du corps (les raptors, le premier dinosaure à plumes)
  const fc = o.feathers || S.feathers;
  if (fc) {
    ctx.strokeStyle = fc;
    ctx.lineCap = 'round';
    ctx.lineWidth = r * 0.055;
    for (let i = 1; i < n; i++) {
      const d = segDir(pts, i);
      for (const s of [-1, 1]) {
        const bx = pts[i].x - d.y * widths[i] * 0.8 * s, by = pts[i].y + d.x * widths[i] * 0.8 * s;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - d.y * r * 0.13 * s - d.x * r * 0.12, by + d.x * r * 0.13 * s - d.y * r * 0.12);
        ctx.stroke();
      }
    }
  }
  // les ailes repliées des grands oiseaux coureurs
  if (S.wings) {
    const i = idx(0.45), d = segDir(pts, i), w = widths[i];
    for (const s of [-1, 1]) {
      const x = pts[i].x - d.y * w * 0.62 * s - d.x * r * 0.08, y = pts[i].y + d.x * w * 0.62 * s - d.y * r * 0.08;
      ellipse(ctx, x, y, r * S.wings, r * S.wings * 0.42, Math.atan2(d.y, d.x) - s * 0.12, shade(col, -0.16), dark, lw);
    }
  }
  // le bout de la queue : une touffe, un pompon, une massue, des pointes
  if (n === full) {
    const tp = pts[n - 1], td = segDir(pts, n - 1), ta = Math.atan2(td.y, td.x);
    if (S.tuft) ellipse(ctx, tp.x - td.x * r * S.tuft * 0.5, tp.y - td.y * r * S.tuft * 0.5, r * S.tuft * 1.3, r * S.tuft * 0.85, ta, S.tuftCol || shade(col, -0.45), dark, lw);
    if (S.pompon) ellipse(ctx, tp.x, tp.y, r * S.pompon, r * S.pompon, 0, '#F6F2EA', dark, lw);
    if (S.club) {
      ellipse(ctx, tp.x, tp.y, r * S.club * 1.25, r * S.club, ta, shade(col, -0.12), dark, lw);
      if (fine) ellipse(ctx, tp.x, tp.y, r * S.club * 0.6, r * S.club * 0.45, ta, shade(col, 0.1), null);
    }
    if (S.spikes) {
      for (const [j, s] of [[n - 2, 1], [n - 2, -1], [n - 1, 1], [n - 1, -1]]) {
        const d = segDir(pts, j), b = pts[j];
        cone(ctx, b.x, b.y, b.x - d.y * r * S.spikes * s - d.x * r * S.spikes * 0.4, b.y + d.x * r * S.spikes * s - d.y * r * S.spikes * 0.4, r * 0.05, HORN, dark, lw);
      }
    }
  }
}

/* ---------- Les petits bras (les dinosaures sur deux pattes) ---------- */
function armsOf(ctx, c, t, S, pts, widths, full, r, col, dark, lw, o) {
  const A = S.arms;
  const i = Math.min(pts.length - 1, Math.round(A.at * (full - 1)));
  const d = segDir(pts, i);
  for (const s of [-1, 1]) {
    const sw = Math.sin((c.walk ?? t) * 2 + (s > 0 ? 0 : Math.PI)) * 0.12;
    const bx = pts[i].x - d.y * widths[i] * 0.75 * s, by = pts[i].y + d.x * widths[i] * 0.75 * s;
    const L = A.len * r * (o.armK || 1);
    const ex = bx + d.x * L * (0.8 + sw) - d.y * L * 0.3 * s, ey = by + d.y * L * (0.8 + sw) + d.x * L * 0.3 * s;
    limb(ctx, [{ x: bx, y: by }, { x: ex, y: ey }], (A.w ?? 0.06) * r, col, dark, lw);
    if (fine) for (const k of [-1, 1]) cone(ctx, ex, ey, ex + d.x * r * 0.06 + k * d.y * r * 0.03, ey + d.y * r * 0.06 - k * d.x * r * 0.03, r * 0.012, CLAW, CLAW, lw * 0.3);
  }
}

/* ============================================================================
   La tête, vue de dessus : le crâne, le museau (plus clair), les oreilles, les
   yeux sur les côtés, le nez au bout ; et tout ce qui pousse dessus.
   ============================================================================ */
function drawHead(ctx, c, t, S, h, a, r, col, dark, lw, o, belly) {
  const H = S.head || {};
  const hk = o.headK || 1;
  const L = (H.l ?? 0.6) * r * hk, W = (H.w ?? 0.4) * r * hk, sn = H.snout ?? 0.5;
  const fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  const cx = h.x + fx * L * 0.3, cy = h.y + fy * L * 0.3;
  const P = (u, v) => ({ x: cx + fx * L * u + nx * W * v, y: cy + fy * L * u + ny * W * v });
  const mood = c.mood || 'calm';
  const open = clamp(c.mouth || 0, 0, 1);
  const ears = o.ears || H.ears;
  const earK = (H.earK ?? 1) * (o.bigEars ? 1.3 : 1);

  // la collerette du tricératops, derrière la tête
  if (H.frill) {
    const fp = P(-0.55, 0), R = W * H.frill;
    ellipse(ctx, fp.x, fp.y, R * 0.75, R, a, H.frillCol || shade(col, 0.08), dark, lw);
    if (fine) {
      // des petites bosses tout autour du bord de la collerette
      for (let k = 0; k < 11; k++) {
        const u = Math.PI * 0.55 + (k / 10) * Math.PI * 0.9;
        const px = fp.x + Math.cos(u) * fx * R * 0.75 - Math.sin(u) * nx * R, py = fp.y + Math.cos(u) * fy * R * 0.75 - Math.sin(u) * ny * R;
        ellipse(ctx, px, py, R * 0.09, R * 0.09, 0, HORN, null);
      }
      ellipse(ctx, fp.x - fx * R * 0.1, fp.y - fy * R * 0.1, R * 0.35, R * 0.55, a, H.frillMark || '#C8553D', null);
    }
  }
  // les bois (au fond) et les cornes qui partent en arrière (gazelle, chèvre)
  if (H.antlers) antlersOf(ctx, H, P, fx, fy, nx, ny, W, r, dark, lw);
  if (H.horns === 'gazelle' || H.horns === 'chevre') {
    for (const s of [-1, 1]) {
      const b = P(-0.15, s * 0.32);
      const Lh = W * (H.horns === 'chevre' ? 1.5 : 1.9);
      const tip = { x: b.x - fx * Lh + nx * s * Lh * 0.25, y: b.y - fy * Lh + ny * s * Lh * 0.25 };
      const mid = { x: b.x - fx * Lh * 0.5 + nx * s * Lh * (H.horns === 'chevre' ? 0.35 : 0.08), y: b.y - fy * Lh * 0.5 + ny * s * Lh * (H.horns === 'chevre' ? 0.35 : 0.08) };
      limb(ctx, [b, mid, tip], W * 0.14, '#5A4A3A', dark, lw * 0.8);
    }
  }
  // les grandes oreilles d'éléphant, sur les côtés (elles s'éventent doucement)
  if (ears === 'elephant') {
    for (const s of [-1, 1]) {
      const p = P(-0.2, s * 0.95);
      const flap = 1 + Math.sin(t * 2.2 + (c.seed || 0)) * 0.08;
      const E = W * earK * 0.9;
      ellipse(ctx, p.x + nx * s * E * 0.45 * flap - fx * E * 0.1, p.y + ny * s * E * 0.45 * flap - fy * E * 0.1, E * 0.7, E * 0.62 * flap, a, shade(col, -0.05), dark, lw);
      if (fine) ellipse(ctx, p.x + nx * s * E * 0.4 * flap - fx * E * 0.1, p.y + ny * s * E * 0.4 * flap - fy * E * 0.1, E * 0.45, E * 0.38 * flap, a, shade(col, -0.2), null);
    }
  }
  // les défenses du mammouth (en dessous, elles dépassent devant)
  if (H.tusks === 'mammouth') {
    for (const s of [-1, 1]) {
      const b = P(0.4, s * sn * 0.6);
      const T = r * (H.tuskK ?? 0.75);
      const m = { x: b.x + fx * T * 0.6 + nx * s * T * 0.5, y: b.y + fy * T * 0.6 + ny * s * T * 0.5 };
      const e = { x: b.x + fx * T * 0.95 + nx * s * T * 0.05, y: b.y + fy * T * 0.95 + ny * s * T * 0.05 };
      limb(ctx, [b, m, e], r * 0.07, IVORY, dark, lw);
    }
  }
  if (H.tusks === 'deino') {
    for (const s of [-1, 1]) {
      const b = P(0.45, s * sn * 0.4);
      limb(ctx, [b, { x: b.x + fx * r * 0.2 + nx * s * r * 0.04, y: b.y + fy * r * 0.2 + ny * s * r * 0.04 }], r * 0.06, IVORY, dark, lw);
    }
  }
  // la trompe : elle se balance devant (et se lève quand il barrit)
  if (H.trunk) {
    const T = r * H.trunk;
    const sw = Math.sin(t * 1.6 + (c.seed || 0)) * 0.35 * (1 - open);
    const b = P(0.5, 0);
    const m = { x: b.x + fx * T * 0.5 + nx * T * sw * 0.4, y: b.y + fy * T * 0.5 + ny * T * sw * 0.4 };
    const e = { x: b.x + fx * T * (0.9 - open * 0.25) + nx * T * sw, y: b.y + fy * T * (0.9 - open * 0.25) + ny * T * sw };
    limb(ctx, [b, m, e], r * 0.12, col, dark, lw);
    if (fine) {
      ctx.strokeStyle = shade(col, -0.3);
      ctx.lineWidth = lw * 0.6;
      for (const u of [0.3, 0.5, 0.7]) {
        const x = b.x + (e.x - b.x) * u, y = b.y + (e.y - b.y) * u;
        ctx.beginPath();
        ctx.moveTo(x - nx * r * 0.05, y - ny * r * 0.05);
        ctx.lineTo(x + nx * r * 0.05, y + ny * r * 0.05);
        ctx.stroke();
      }
    }
  }

  // la tête : le crâne et le museau
  const shape = [P(-0.5, 0), P(-0.44, 0.72), P(-0.15, 1), P(0.15, 0.93), P(0.38, sn * 0.95 + 0.05), P(0.55, sn * 0.62), P(0.62, 0),
    P(0.55, -sn * 0.62), P(0.38, -sn * 0.95 - 0.05), P(0.15, -0.93), P(-0.15, -1), P(-0.44, -0.72)];
  const headCol = S.headCol || col;
  const hdark = S.headCol ? shade(S.headCol, -0.5) : dark;
  ctx.fillStyle = headCol;
  smoothClosed(ctx, shape);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    // le museau plus clair (les mammifères), et un reflet sur le front
    if (H.muzzle !== false && H.type !== 'rep' && !S.headCol) {
      const m = P(0.42, 0);
      ellipse(ctx, m.x, m.y, L * 0.28, W * sn * 0.85, a, H.muzzleCol || belly, null);
    }
    if (H.type === 'bec' || H.beak) {
      const m = P(0.5, 0);
      ellipse(ctx, m.x, m.y, L * 0.2, W * sn * 0.85, a, H.beak || '#D9B55A', null);
    }
    const g = P(-0.15, 0);
    ellipse(ctx, g.x - nx * W * 0.25, g.y - ny * W * 0.25, L * 0.3, W * 0.28, a, 'rgba(255, 255, 255, 0.16)', null);
    if (S.stripes && H.type === 'mam') {
      ctx.strokeStyle = o.stripe || shade(col, -0.4);
      ctx.lineWidth = r * 0.04;
      ctx.lineCap = 'round';
      for (const v of [-0.35, 0, 0.35]) {
        const p0 = P(-0.4, v * 1.2), p1 = P(-0.05, v * 0.7);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.strokeStyle = hdark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, shape);
  ctx.stroke();
  // la crête rouge de l'allosaure, les plumes sur la tête des raptors
  if (H.crest) for (const s of [-1, 1]) { const p = P(0.12, s * 0.42); ellipse(ctx, p.x, p.y, L * 0.18, W * 0.14, a, H.crest, dark, lw * 0.7); }
  if (H.plume) for (const k of [-0.25, 0, 0.25]) { const p = P(-0.45, k); cone(ctx, p.x, p.y, p.x - fx * r * 0.22 + nx * k * r * 0.2, p.y - fy * r * 0.22 + ny * k * r * 0.2, r * 0.04, H.plume, dark, lw * 0.6); }

  // la gueule grande ouverte, au bout du museau
  if (open > 0.12) jaws(ctx, P(0.58, 0), a, W * Math.max(0.45, sn) * 0.95, L * 0.3, open, H.teeth ?? (H.type === 'rep' ? 6 : 0), H.fangs, r);

  // les oreilles
  if (ears && ears !== 'elephant') {
    let ea = (t + (c.seed || 0)) % 5 < 0.3 ? Math.sin(t * 9) * 0.15 : 0;
    if (mood === 'angry') ea -= 0.35;
    if (mood === 'scared') ea -= 0.7;
    for (const s of [-1, 1]) earOf(ctx, ears, P, a, s, W * earK, col, dark, lw, ea, o);
  }
  // les cornes (bison, aurochs, rhinocéros, tricératops, cératosaure, allosaure)
  hornsOf(ctx, H, P, fx, fy, nx, ny, W, L, r, dark, lw, o);
  // les dents de sabre : elles dépassent devant la mâchoire
  const sab = (H.sabers || 0) * (o.saberK || 1);
  if (sab) for (const s of [-1, 1]) { const b = P(0.5, s * sn * 0.45); cone(ctx, b.x, b.y, b.x + fx * r * 0.2 * sab + nx * s * r * 0.02, b.y + fy * r * 0.2 * sab + ny * s * r * 0.02, r * 0.035, IVORY, dark, lw * 0.8); }
  // le nez
  if (!H.trunk) noseOf(ctx, H, P, a, W, sn, r, dark, o, col);
  // les moustaches
  if ((H.whiskers || o.whiskers) && fine) {
    ctx.strokeStyle = 'rgba(250, 245, 235, 0.9)';
    ctx.lineWidth = Math.max(0.6, r * 0.012);
    for (const s of [-1, 1]) {
      const b = P(0.42, s * sn * 0.6);
      for (const k of [-0.2, 0, 0.2]) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + nx * s * W * 0.95 + fx * L * k, b.y + ny * s * W * 0.95 + fy * L * k);
        ctx.stroke();
      }
    }
  }
  // les yeux, sur les côtés de la tête
  const [eu, ev] = H.eye || [0.08, 0.62];
  if (o.cute) {
    const e = P(eu, 0);
    eyes(ctx, e.x, e.y, a, r, 0, (W * ev) / r, (H.eyeR ?? 0.07) * 1.35, mood, c.blink || 0);
  } else {
    for (const s of [-1, 1]) {
      const p = P(eu, s * ev);
      darkEye(ctx, p.x, p.y, a, s, r * (H.eyeR ?? 0.055), mood);
    }
  }
}

/** La gueule grande ouverte : un croissant sombre, la langue, des dents */
function jaws(ctx, p, a, W, D, open, teeth, fangs, r) {
  const fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  ctx.fillStyle = '#5E1B28';
  ctx.strokeStyle = 'rgba(30, 10, 15, 0.8)';
  ctx.lineWidth = Math.max(0.6, r * 0.02);
  ctx.beginPath();
  ctx.moveTo(p.x + nx * W, p.y + ny * W);
  ctx.quadraticCurveTo(p.x + fx * D * open * 1.5, p.y + fy * D * open * 1.5, p.x - nx * W, p.y - ny * W);
  ctx.quadraticCurveTo(p.x - fx * D * 0.4, p.y - fy * D * 0.4, p.x + nx * W, p.y + ny * W);
  ctx.fill();
  ctx.stroke();
  if (!fine) return;
  ctx.fillStyle = '#E37C8C';
  ctx.beginPath();
  ctx.ellipse(p.x + fx * D * open * 0.35, p.y + fy * D * open * 0.35, D * 0.35 * open, W * 0.45, a, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#FBF6E9';
  ctx.strokeStyle = 'rgba(70, 40, 30, 0.5)';
  ctx.lineWidth = Math.max(0.4, r * 0.008);
  const list = teeth ? Array.from({ length: teeth + 1 }, (_, i) => (i / teeth) * 2 - 1) : fangs !== false ? [-0.7, 0.7] : [];
  for (const u of list) {
    const px = p.x + nx * W * u * 0.9 + fx * D * open * 0.7 * (1 - u * u);
    const py = p.y + ny * W * u * 0.9 + fy * D * open * 0.7 * (1 - u * u);
    const tw = W * (teeth ? 1.5 / teeth : 0.3), tl = W * (teeth ? 0.32 : 0.45) * (0.7 + open * 0.5);
    ctx.beginPath();
    ctx.moveTo(px + nx * tw * 0.5, py + ny * tw * 0.5);
    ctx.lineTo(px - fx * tl, py - fy * tl);
    ctx.lineTo(px - nx * tw * 0.5, py - ny * tw * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Une oreille, vue de dessus (s : le côté) */
function earOf(ctx, type, P, a, s, W, col, dark, lw, ea, o) {
  const inner = shade(col, -0.32);
  const back = a + Math.PI;
  if (type === 'tombante') {
    // une oreille toute molle, posée sur le côté de la tête
    const p = P(-0.1, s * 1.0);
    ellipse(ctx, p.x, p.y, W * 0.42, W * 0.24, a + s * 0.25, o.earCol || shade(col, -0.2), dark, lw);
    return;
  }
  if (type === 'long') {
    // les grandes oreilles du lapin, couchées sur le dos
    const p = P(-0.35, s * 0.32);
    const ang = back - s * (0.25 + ea * 0.3);
    const L = W * 1.5;
    ellipse(ctx, p.x + Math.cos(ang) * L * 0.5, p.y + Math.sin(ang) * L * 0.5, L * 0.55, W * 0.22, ang, col, dark, lw);
    if (fine) ellipse(ctx, p.x + Math.cos(ang) * L * 0.5, p.y + Math.sin(ang) * L * 0.5, L * 0.38, W * 0.1, ang, PINK, null);
    return;
  }
  if (type === 'lateral') {
    // une petite oreille qui part sur le côté (bison, mouton)
    const p = P(-0.2, s * 0.9);
    const ang = a + s * (Math.PI / 2 + 0.3);
    ellipse(ctx, p.x + Math.cos(ang) * W * 0.28, p.y + Math.sin(ang) * W * 0.28, W * 0.32, W * 0.15, ang, col, dark, lw);
    return;
  }
  // une oreille dressée : vers l'arrière et vers l'extérieur
  const p = P(-0.28, s * 0.62);
  const ang = back - s * (0.75 - ea);
  const sz = { pointe: 0.55, rond: 0.36, petit: 0.24, cheval: 0.48 }[type] ?? 0.4;
  const L = W * sz;
  const tipX = p.x + Math.cos(ang) * L * 1.5, tipY = p.y + Math.sin(ang) * L * 1.5;
  const sx = -Math.sin(ang), sy = Math.cos(ang);
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  if (type === 'rond' || type === 'petit') {
    ctx.ellipse(p.x + Math.cos(ang) * L * 0.55, p.y + Math.sin(ang) * L * 0.55, L * 0.75, L * 0.95, ang, 0, TAU);
  } else {
    const wb = L * (type === 'cheval' ? 0.5 : 0.7);
    ctx.moveTo(p.x + sx * wb, p.y + sy * wb);
    ctx.quadraticCurveTo(p.x + Math.cos(ang) * L + sx * wb * 0.7, p.y + Math.sin(ang) * L + sy * wb * 0.7, tipX, tipY);
    ctx.quadraticCurveTo(p.x + Math.cos(ang) * L - sx * wb * 0.7, p.y + Math.sin(ang) * L - sy * wb * 0.7, p.x - sx * wb, p.y - sy * wb);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = inner;
    ctx.beginPath();
    if (type === 'rond' || type === 'petit') ctx.ellipse(p.x + Math.cos(ang) * L * 0.5, p.y + Math.sin(ang) * L * 0.5, L * 0.42, L * 0.55, ang, 0, TAU);
    else ctx.ellipse(p.x + Math.cos(ang) * L * 0.65, p.y + Math.sin(ang) * L * 0.65, L * 0.55, L * 0.22, ang, 0, TAU);
    ctx.fill();
  }
}

/** Les cornes, vues de dessus */
function hornsOf(ctx, H, P, fx, fy, nx, ny, W, L, r, dark, lw, o) {
  const hc = HORN;
  const type = H.horns || (o.horns ? 'allo' : null);
  if (type === 'bison' || type === 'aurochs') {
    // elles partent sur les côtés, puis se recourbent vers l'avant
    const big = type === 'aurochs' ? 1.7 : 1;
    for (const s of [-1, 1]) {
      const b = P(-0.2, s * 0.85);
      const Lh = W * 0.7 * big;
      const m = { x: b.x + nx * s * Lh * 0.8, y: b.y + ny * s * Lh * 0.8 };
      const e = { x: b.x + nx * s * Lh * 0.9 + fx * Lh * (type === 'aurochs' ? 0.9 : 0.55), y: b.y + ny * s * Lh * 0.9 + fy * Lh * (type === 'aurochs' ? 0.9 : 0.55) };
      ctx.lineCap = 'round';
      ctx.strokeStyle = dark;
      ctx.lineWidth = W * 0.2 + lw * 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(m.x, m.y, e.x, e.y);
      ctx.stroke();
      ctx.strokeStyle = hc;
      ctx.lineWidth = W * 0.2;
      ctx.stroke();
      ellipse(ctx, e.x, e.y, W * 0.06, W * 0.06, 0, shade(hc, -0.35), null);
    }
  }
  if (type === 'rhino') {
    const b = P(0.42, 0), b2 = P(0.15, 0);
    cone(ctx, b.x - fx * L * 0.1, b.y - fy * L * 0.1, b.x + fx * L * 0.55, b.y + fy * L * 0.55, W * 0.28, hc, dark, lw);
    cone(ctx, b2.x - fx * L * 0.05, b2.y - fy * L * 0.05, b2.x + fx * L * 0.22, b2.y + fy * L * 0.22, W * 0.16, hc, dark, lw);
  }
  if (type === 'trike') {
    // deux grandes cornes au-dessus des yeux, une petite sur le nez
    for (const s of [-1, 1]) {
      const b = P(0.02, s * 0.5);
      cone(ctx, b.x, b.y, b.x + fx * L * 0.9 + nx * s * L * 0.12, b.y + fy * L * 0.9 + ny * s * L * 0.12, W * 0.14, hc, dark, lw);
    }
    const b = P(0.45, 0);
    cone(ctx, b.x, b.y, b.x + fx * L * 0.25, b.y + fy * L * 0.25, W * 0.12, hc, dark, lw);
  }
  if (type === 'cerato') {
    const b = P(0.38, 0);
    cone(ctx, b.x, b.y, b.x + fx * L * 0.22, b.y + fy * L * 0.22, W * 0.12, hc, dark, lw);
  }
  if (type === 'allo') {
    // les petites cornes de l'allosaure, au-dessus des yeux
    for (const s of [-1, 1]) {
      const b = P(0.05, s * 0.55);
      cone(ctx, b.x, b.y, b.x - fx * L * 0.12 + nx * s * L * 0.2, b.y - fy * L * 0.12 + ny * s * L * 0.2, W * 0.1, hc, dark, lw);
    }
  }
}

/** Les bois du renne et du mégacéros : ils s'écartent sur les côtés */
function antlersOf(ctx, H, P, fx, fy, nx, ny, W, r, dark, lw) {
  const K = W * (H.antlerK ?? 1.6);
  const w = Math.max(1, r * 0.04);
  for (const s of [-1, 1]) {
    const b = P(-0.25, s * 0.35);
    const Q = (f, o2) => ({ x: b.x + fx * K * f + nx * s * K * o2, y: b.y + fy * K * f + ny * s * K * o2 });
    if (H.antlers === 'megaceros') {
      // une longue branche vers l'extérieur, puis une immense « main » plate
      limb(ctx, [b, Q(-0.05, 0.45), Q(0, 0.75)], w * 1.4, ANTLER, dark, lw);
      const c0 = Q(0, 0.95);
      ctx.fillStyle = ANTLER;
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw;
      ctx.beginPath();
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const u = -1.2 + (k / 8) * 2.4;
        const R = k % 2 ? 0.28 : 0.42;
        pts.push({ x: c0.x + (fx * Math.sin(u) + nx * s * Math.cos(u)) * K * R, y: c0.y + (fy * Math.sin(u) + ny * s * Math.cos(u)) * K * R });
      }
      ctx.moveTo(Q(0, 0.7).x, Q(0, 0.7).y);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      limb(ctx, [b, Q(0.1, 0.5), Q(0.35, 0.85)], w, ANTLER, dark, lw);
      limb(ctx, [Q(0.08, 0.45), Q(0.4, 0.5)], w * 0.8, ANTLER, dark, lw);
      limb(ctx, [Q(0.25, 0.72), Q(0.5, 0.65)], w * 0.8, ANTLER, dark, lw);
      limb(ctx, [Q(0.02, 0.15), Q(0.3, 0.12)], w * 0.8, ANTLER, dark, lw);
    }
  }
}

/** Le nez : une truffe, un petit nez rose, des narines, un groin, un bec */
function noseOf(ctx, H, P, a, W, sn, r, dark, o, col) {
  const k = o.bigNose ? 1.4 : 1;
  const type = H.nose ?? (H.type === 'rep' ? 'narines' : H.type === 'bec' ? null : 'truffe');
  const tip = P(0.58, 0);
  if (type === 'truffe') {
    ellipse(ctx, tip.x, tip.y, W * 0.16 * k, W * 0.2 * k, a, NOSE, null);
    if (fine) ellipse(ctx, tip.x - Math.cos(a) * W * 0.04, tip.y - Math.sin(a) * W * 0.04 - W * 0.05, W * 0.06 * k, W * 0.05 * k, a, 'rgba(255, 255, 255, 0.5)', null);
  } else if (type === 'rose') {
    ellipse(ctx, tip.x, tip.y, W * 0.12 * k, W * 0.15 * k, a, PINK, shade(PINK, -0.45), Math.max(0.5, r * 0.012));
  } else if (type === 'narines') {
    for (const s of [-1, 1]) { const p = P(0.52, s * sn * 0.3); ellipse(ctx, p.x, p.y, W * 0.05 * k, W * 0.07 * k, a, 'rgba(30, 18, 12, 0.7)', null); }
  } else if (type === 'groin') {
    ellipse(ctx, tip.x, tip.y, W * 0.22, W * 0.32, a, shade(col, 0.22), dark, Math.max(0.6, r * 0.025));
    for (const s of [-1, 1]) { const p = P(0.6, s * 0.12); ellipse(ctx, p.x, p.y, W * 0.05, W * 0.07, a, 'rgba(30, 18, 12, 0.7)', null); }
  }
  if (H.type === 'bec') {
    // le grand bec crochu des oiseaux-terreur
    const fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
    const b = P(0.3, 0), BL = W * (H.beakL ?? 2.2);
    const bc = H.beakCol || '#D9A441';
    ctx.fillStyle = bc;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.8, r * 0.03);
    ctx.beginPath();
    ctx.moveTo(b.x + nx * W * 0.5, b.y + ny * W * 0.5);
    ctx.quadraticCurveTo(b.x + fx * BL * 0.6 + nx * W * 0.42, b.y + fy * BL * 0.6 + ny * W * 0.42, b.x + fx * BL, b.y + fy * BL);
    ctx.quadraticCurveTo(b.x + fx * BL * 0.6 - nx * W * 0.42, b.y + fy * BL * 0.6 - ny * W * 0.42, b.x - nx * W * 0.5, b.y - ny * W * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = shade(bc, -0.35);
      ctx.beginPath();
      ctx.moveTo(b.x + fx * BL * 0.15, b.y + fy * BL * 0.15);
      ctx.lineTo(b.x + fx * BL * 0.85, b.y + fy * BL * 0.85);
      ctx.stroke();
      ellipse(ctx, b.x + fx * BL * 0.3 + nx * W * 0.2, b.y + fy * BL * 0.3 + ny * W * 0.2, W * 0.06, W * 0.04, a, 'rgba(30, 18, 12, 0.6)', null);
      ellipse(ctx, b.x + fx * BL * 0.3 - nx * W * 0.2, b.y + fy * BL * 0.3 - ny * W * 0.2, W * 0.06, W * 0.04, a, 'rgba(30, 18, 12, 0.6)', null);
    }
  }
}

/* ---------- Caché dans les fougères : on ne voit que deux yeux ---------- */
function drawHidden(ctx, c, t) {
  const r = c.size;
  ctx.fillStyle = 'rgba(0, 25, 15, 0.2)';
  ctx.beginPath();
  ctx.ellipse(c.x + r * 0.2, c.y + r * 0.3, r * 1.5, r * 0.8, 0, 0, TAU);
  ctx.fill();
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + 0.3 + Math.sin(t * 2 + k) * 0.05;
    ctx.strokeStyle = k % 2 ? '#3E7A34' : '#6FA83E';
    ctx.lineWidth = Math.max(1.5, r * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.quadraticCurveTo(c.x + Math.cos(a) * r * 0.9, c.y + Math.sin(a) * r * 0.9 - r * 0.2, c.x + Math.cos(a) * r * 1.4, c.y + Math.sin(a) * r * 1.4);
    ctx.stroke();
  }
  if ((t + (c.seed || 0)) % 3 < 2.6) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#FFF4B8';
      ctx.beginPath();
      ctx.arc(c.x + s * r * 0.22, c.y - r * 0.1, Math.max(1.2, r * 0.11), 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(c.x + s * r * 0.22, c.y - r * 0.1, Math.max(0.6, r * 0.05), 0, TAU);
      ctx.fill();
    }
  }
}

/* ---------- La queue-leurre du lézard : elle gigote toute seule par terre ---------- */
export function drawDecoyTail(ctx, d, t) {
  const r = d.size;
  const col = PLAYER.body;
  const dark = PLAYER.dark || shade(col, -0.55);
  ctx.fillStyle = 'rgba(0, 25, 15, 0.2)';
  ctx.beginPath();
  ctx.ellipse(d.x + r * 0.15, d.y + r * 0.25, r * 1.3, r * 0.35, d.a, 0, TAU);
  ctx.fill();
  const pts = [];
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    const wig = Math.sin(t * 16 + i * 1.1) * r * 0.35 * u;
    pts.push({ x: d.x + Math.cos(d.a) * r * (u - 0.5) * 2.2 - Math.sin(d.a) * wig, y: d.y + Math.sin(d.a) * r * (u - 0.5) * 2.2 + Math.cos(d.a) * wig });
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = r * 0.42;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = r * 0.3;
  ctx.stroke();
  ctx.strokeStyle = PLAYER.stripe || shade(col, -0.32);
  ctx.lineWidth = r * 0.1;
  ctx.setLineDash([r * 0.12, r * 0.22]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ============================================================================
   Les humains, vus de dessus : la tête (les cheveux, et un petit bout de
   visage devant), les épaules dans la tunique de fourrure, les bras qui se
   balancent, les pieds qui avancent l'un après l'autre. o : { spear (le
   chasseur et sa lance), crook (le berger et son bâton), child (un enfant) }.
   Quand ils te chassent (« Ouste ! »), ils lèvent le bras.
   ============================================================================ */
const SKINS = ['#C68A5A', '#8D5A3A', '#E2B48A', '#A8704A'];
const HAIR = ['#2A1C14', '#4A2E1A', '#1C1411', '#6A4628'];
function drawPerson(ctx, c, t, o) {
  const r = c.size * (o.child ? 0.8 : 1);
  setDetail(ctx, r);
  const i = Math.floor((c.seed || 0) * 7) % 4;
  const skin = SKINS[i], hair = HAIR[(i + 1) % 4];
  const col = c.sp.color, dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.035);
  const a = c.angle ?? 0, fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  const k = clamp((c.speed ?? 0) * 1.6, 0, 1);
  const ph = (c.walk || 0) * 2.4;
  const angry = c.state === 'charge' || c.state === 'alert';
  const x = c.x, y = c.y;
  const P = (u, v) => ({ x: x + fx * r * u + nx * r * v, y: y + fy * r * u + ny * r * v });
  ellipse(ctx, x + r * 0.08, y + r * 0.16, r * 0.42, r * 0.36, a, 'rgba(0, 25, 15, 0.2)', null);
  // les pieds, l'un devant l'autre
  for (const s of [-1, 1]) {
    const st = Math.sin(ph + (s > 0 ? 0 : Math.PI)) * 0.3 * k;
    const p = P(st + 0.05, s * 0.13);
    ellipse(ctx, p.x, p.y, r * 0.13, r * 0.08, a, '#5A3E26', shade('#5A3E26', -0.5), lw * 0.8);
  }
  // les bras : ils se balancent (ou l'un se lève pour te chasser)
  const arm = (s) => {
    const sw = angry && s > 0 ? 0.55 + Math.sin(t * 14) * 0.08 : Math.sin(ph + (s > 0 ? Math.PI : 0)) * 0.25 * k;
    const sh = P(0, s * 0.3), hand = P(sw + 0.05, s * (angry && s > 0 ? 0.32 : 0.42));
    limb(ctx, [sh, hand], r * 0.12, col, dark, lw);
    ellipse(ctx, hand.x, hand.y, r * 0.07, r * 0.07, 0, skin, shade(skin, -0.5), lw * 0.7);
    return hand;
  };
  arm(-1);
  const hr = arm(1);
  // la lance du chasseur, le bâton du berger
  if ((o.spear || o.crook) && !angry) {
    const b = { x: hr.x - fx * r * 0.45, y: hr.y - fy * r * 0.45 }, e = { x: hr.x + fx * r * 0.85, y: hr.y + fy * r * 0.85 };
    limb(ctx, [b, e], r * 0.045, '#8A6A42', '#4A3420', lw * 0.6);
    if (o.spear) cone(ctx, e.x - fx * r * 0.04, e.y - fy * r * 0.04, e.x + fx * r * 0.2, e.y + fy * r * 0.2, r * 0.05, '#A8A296', '#4A463E', lw);
    if (o.crook) {
      ctx.strokeStyle = '#8A6A42';
      ctx.lineWidth = r * 0.045;
      ctx.beginPath();
      ctx.arc(e.x + nx * r * 0.08, e.y + ny * r * 0.08, r * 0.08, a - Math.PI / 2, a + Math.PI / 2);
      ctx.stroke();
    }
  }
  // le corps : les épaules dans la tunique, le col en fourrure claire
  ellipse(ctx, x, y, r * 0.22, r * 0.38, a, col, dark, lw);
  if (fine) ellipse(ctx, x + fx * r * 0.04, y + fy * r * 0.04, r * 0.12, r * 0.26, a, shade(col, 0.3), null);
  // la tête : les cheveux, et le visage qui regarde devant
  const hp = P(0.04, 0);
  ellipse(ctx, hp.x, hp.y, r * 0.2, r * 0.2, 0, skin, shade(skin, -0.5), lw);
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(hp.x - fx * r * 0.04, hp.y - fy * r * 0.04, r * 0.2, a + Math.PI * 0.42, a + Math.PI * 1.58);
  ctx.closePath();
  ctx.fill();
  if (fine) {
    for (const s of [-1, 1]) {
      const e = P(0.15, s * 0.08);
      ellipse(ctx, e.x, e.y, r * 0.025, r * 0.025, 0, INK, null);
    }
    if (angry) { const m = P(0.21, 0); ellipse(ctx, m.x, m.y, r * 0.035, r * 0.05, a, '#5E1B28', null); }
  }
}

/* ============================================================================
   LES ESPÈCES : les mesures de chaque animal (r = sa taille)
   ============================================================================ */
/** Quatre pattes : devant (les épaules), derrière (les hanches) */
const Q4 = (front, back, len, w, foot = 'patte', x = {}) => [
  { at: front, len, w, foot, ph: 0, stride: x.stride ?? 0.24, fwd: 0.04, sprawl: x.sprawl, claws: x.claws },
  { at: back, len: len * (x.hk ?? 1), w: w * (x.hw ?? 1.12), foot, ph: 1, stride: x.stride ?? 0.24, fwd: -0.02, sprawl: x.sprawl, claws: x.claws },
];
/** Deux pattes (dinosaures, oiseaux coureurs) */
const B2 = (at, len, w, stride = 0.4) => [{ at, len, w, foot: 'griffe', ph: 0, stride, fwd: 0.06 }];
const mam = (S) => ({ sway: 0.05, cadence: 2.2, ...S, head: { type: 'mam', ...S.head } });
const rep = (S) => ({ sway: 0.1, cadence: 1.8, ...S, head: { type: 'rep', ears: null, muzzle: false, ...S.head } });

export const ANIMAUX = {
  /* ======================= Niveau 2 : vers les dinosaures ======================= */
  tetrapode: rep({
    spine: [7, 0.34], body: [0.34, 0.48, 0.54, 0.5, 0.38, 0.24, 0.1], tailFin: true, spots: 10,
    head: { l: 0.66, w: 0.48, snout: 0.75, eye: [0.05, 0.55], eyeR: 0.07 },
    legs: Q4(0.18, 0.6, 0.2, 0.11, 'griffe', { sprawl: true }),
  }),
  reptile: rep({
    spine: [8, 0.32], body: [0.2, 0.3, 0.36, 0.36, 0.3, 0.2, 0.12, 0.05], stripes: 1,
    head: { l: 0.52, w: 0.28, snout: 0.55, eyeR: 0.06 },
    legs: Q4(0.2, 0.58, 0.2, 0.09, 'griffe', { sprawl: true }),
  }),
  'premier-dino': rep({
    spine: [9, 0.36], body: [0.15, 0.18, 0.34, 0.42, 0.36, 0.26, 0.16, 0.08, 0.03], stripes: 1, sway: 0.05,
    head: { l: 0.62, w: 0.27, snout: 0.6, teeth: 8, eyeR: 0.055 },
    legs: B2(0.36, 0.22, 0.13), arms: { at: 0.15, len: 0.28, w: 0.06 },
  }),
  allosaure: rep({
    spine: [9, 0.37], body: [0.22, 0.26, 0.44, 0.5, 0.42, 0.3, 0.18, 0.09, 0.03], stripes: 1, sway: 0.045,
    head: { l: 0.8, w: 0.36, snout: 0.62, teeth: 9, crest: '#C8553D', eyeR: 0.055 },
    legs: B2(0.36, 0.25, 0.16), arms: { at: 0.16, len: 0.26, w: 0.07 },
  }),
  trex: rep({
    spine: [9, 0.37], body: [0.32, 0.38, 0.54, 0.58, 0.48, 0.32, 0.19, 0.09, 0.03], stripes: 1, sway: 0.04,
    head: { l: 0.95, w: 0.5, snout: 0.7, teeth: 10, eyeR: 0.055 },
    legs: B2(0.36, 0.28, 0.2), arms: { at: 0.18, len: 0.13, w: 0.055 },
  }),
  'trex-rival': rep({
    spine: [9, 0.37], body: [0.32, 0.38, 0.54, 0.58, 0.48, 0.32, 0.19, 0.09, 0.03], stripes: 1, sway: 0.04, studs: [0.05, 0.6],
    head: { l: 0.95, w: 0.5, snout: 0.7, teeth: 10, eyeR: 0.055 },
    legs: B2(0.36, 0.28, 0.2), arms: { at: 0.18, len: 0.13, w: 0.055 },
  }),
  dimetrodon: rep({
    spine: [8, 0.34], body: [0.22, 0.34, 0.42, 0.42, 0.32, 0.2, 0.11, 0.04], spots: 7, sail: [0.14, 0.6],
    head: { l: 0.62, w: 0.3, snout: 0.6, teeth: 8, eyeR: 0.055 },
    legs: Q4(0.2, 0.58, 0.22, 0.11, 'griffe', { sprawl: true }),
  }),
  cynodonte: mam({
    spine: [6, 0.34], body: [0.26, 0.42, 0.46, 0.4, 0.24, 0.1], stripes: 1, sway: 0.08,
    head: { l: 0.5, w: 0.36, snout: 0.55, ears: 'petit', whiskers: true },
    legs: Q4(0.15, 0.6, 0.18, 0.11),
  }),
  coelophysis: rep({
    spine: [9, 0.37], body: [0.12, 0.15, 0.3, 0.34, 0.28, 0.2, 0.12, 0.06, 0.02], stripes: 1, sway: 0.05,
    head: { l: 0.6, w: 0.2, snout: 0.45, teeth: 8, eyeR: 0.05 },
    legs: B2(0.36, 0.22, 0.11, 0.46), arms: { at: 0.14, len: 0.22, w: 0.045 },
  }),
  postosuchus: rep({
    spine: [9, 0.35], body: [0.24, 0.34, 0.44, 0.46, 0.38, 0.26, 0.15, 0.08, 0.03], studs: [0.1, 0.85],
    head: { l: 0.82, w: 0.3, snout: 0.55, teeth: 10, eyeR: 0.05 },
    legs: Q4(0.18, 0.5, 0.2, 0.13, 'griffe'),
  }),
  plateosaure: rep({
    spine: [10, 0.35], body: [0.1, 0.12, 0.14, 0.3, 0.46, 0.46, 0.34, 0.22, 0.11, 0.04], spots: 6, sway: 0.05,
    head: { l: 0.34, w: 0.18, snout: 0.7, beak: '#C9B27A', eyeR: 0.05 },
    legs: B2(0.48, 0.24, 0.15, 0.34), arms: { at: 0.34, len: 0.3, w: 0.07 },
  }),
  compsognathus: rep({
    spine: [8, 0.37], body: [0.14, 0.3, 0.34, 0.28, 0.18, 0.1, 0.05, 0.02], stripes: 1, sway: 0.06,
    head: { l: 0.46, w: 0.2, snout: 0.5, teeth: 5, eyeR: 0.06 },
    legs: B2(0.28, 0.2, 0.1, 0.42), arms: { at: 0.1, len: 0.18, w: 0.045 },
  }),
  dryosaure: rep({
    spine: [9, 0.36], body: [0.14, 0.2, 0.38, 0.42, 0.32, 0.2, 0.11, 0.05, 0.02], spots: 8, sway: 0.05,
    head: { l: 0.44, w: 0.2, snout: 0.6, beak: '#C9B27A', eyeR: 0.06 },
    legs: B2(0.36, 0.22, 0.12, 0.46), arms: { at: 0.18, len: 0.18, w: 0.045 },
  }),
  stegosaure: rep({
    spine: [9, 0.35], body: [0.16, 0.3, 0.5, 0.58, 0.52, 0.38, 0.22, 0.11, 0.04], spots: 5, sway: 0.04, cadence: 1.6,
    head: { l: 0.34, w: 0.18, snout: 0.7, beak: '#C9B27A', eyeR: 0.05 },
    legs: Q4(0.2, 0.52, 0.22, 0.16, 'colonne'), plates: [0.12, 0.88, 11], plateCol: '#D9734E', spikes: 0.5,
  }),
  brachiosaure: rep({
    spine: [12, 0.35], body: [0.1, 0.1, 0.11, 0.12, 0.15, 0.3, 0.5, 0.56, 0.44, 0.28, 0.14, 0.05], spots: 6, sway: 0.03, cadence: 1.2,
    head: { l: 0.32, w: 0.16, snout: 0.75, eyeR: 0.045 },
    legs: Q4(0.48, 0.72, 0.24, 0.18, 'colonne', { stride: 0.2 }),
  }),
  diplodocus: rep({
    spine: [14, 0.35], body: [0.08, 0.09, 0.1, 0.12, 0.18, 0.34, 0.46, 0.44, 0.32, 0.2, 0.13, 0.08, 0.04, 0.02], stripes: 1, sway: 0.07, cadence: 1.2,
    head: { l: 0.32, w: 0.14, snout: 0.75, eyeR: 0.045 },
    legs: Q4(0.38, 0.55, 0.22, 0.16, 'colonne', { stride: 0.2 }),
  }),
  ceratosaure: rep({
    spine: [9, 0.37], body: [0.2, 0.24, 0.42, 0.46, 0.38, 0.27, 0.16, 0.08, 0.03], stripes: 1, studs: [0.05, 0.9], sway: 0.05,
    head: { l: 0.76, w: 0.33, snout: 0.6, teeth: 9, horns: 'cerato', eyeR: 0.055 },
    legs: B2(0.36, 0.24, 0.15), arms: { at: 0.16, len: 0.22, w: 0.06 },
  }),
  edmontosaure: rep({
    spine: [10, 0.35], body: [0.2, 0.24, 0.42, 0.52, 0.5, 0.38, 0.24, 0.12, 0.05, 0.02], stripes: 1, sway: 0.05,
    head: { l: 0.7, w: 0.3, snout: 0.95, beak: '#D8C48E', eyeR: 0.05 },
    legs: B2(0.42, 0.26, 0.17, 0.36), arms: { at: 0.2, len: 0.3, w: 0.07 },
  }),
  dakotaraptor: rep({
    spine: [9, 0.37], body: [0.14, 0.18, 0.32, 0.36, 0.28, 0.2, 0.12, 0.06, 0.02], stripes: 1, feathers: '#E2574C', sway: 0.05,
    head: { l: 0.56, w: 0.2, snout: 0.55, teeth: 8, plume: '#E2574C', eyeR: 0.055 },
    legs: B2(0.34, 0.22, 0.12, 0.48), arms: { at: 0.14, len: 0.28, w: 0.05 },
  }),
  ankylosaure: rep({
    spine: [9, 0.33], body: [0.3, 0.48, 0.62, 0.68, 0.62, 0.46, 0.26, 0.12, 0.05], sway: 0.06, cadence: 1.6,
    head: { l: 0.52, w: 0.42, snout: 0.85, beak: '#7A6A4A', eyeR: 0.05 },
    legs: Q4(0.18, 0.55, 0.16, 0.16, 'colonne'), armor: [0.12, 0.72], club: 0.22,
  }),
  triceratops: rep({
    spine: [9, 0.35], body: [0.36, 0.44, 0.56, 0.6, 0.52, 0.38, 0.22, 0.11, 0.04], spots: 4, sway: 0.04, cadence: 1.6,
    head: { l: 0.88, w: 0.48, snout: 0.45, beak: '#3A2E26', horns: 'trike', frill: 1.25, frillCol: '#B88A52', frillMark: '#C8553D', eye: [0.0, 0.62], eyeR: 0.05 },
    legs: Q4(0.2, 0.55, 0.22, 0.17, 'colonne'),
  }),

  /* ======================= Niveaux 3 et 4 : les mammifères ======================= */
  musaraigne: mam({
    spine: [8, 0.27], body: [0.24, 0.36, 0.42, 0.42, 0.35, 0.07, 0.055, 0.04], tailAt: 0.62, sway: 0.08, cadence: 2.8,
    head: { l: 0.62, w: 0.4, snout: 0.32, ears: 'petit', earK: 1.2, nose: 'rose', whiskers: true },
    legs: Q4(0.15, 0.5, 0.12, 0.08),
  }),
  miacis: mam({
    spine: [10, 0.28], body: [0.2, 0.28, 0.32, 0.32, 0.31, 0.27, 0.11, 0.13, 0.12, 0.06], tailAt: 0.6, stripes: 1,
    head: { l: 0.6, w: 0.4, snout: 0.42, ears: 'rond' },
    legs: Q4(0.12, 0.5, 0.15, 0.085),
  }),
  proailurus: mam({
    spine: [9, 0.3], body: [0.2, 0.3, 0.33, 0.32, 0.3, 0.08, 0.075, 0.07, 0.06], tailAt: 0.55, spots: 14,
    head: { l: 0.55, w: 0.44, snout: 0.42, ears: 'pointe', earK: 0.8, nose: 'rose', whiskers: true },
    legs: Q4(0.12, 0.47, 0.18, 0.09),
  }),
  machairodus: mam({
    spine: [9, 0.32], body: [0.24, 0.36, 0.4, 0.38, 0.35, 0.09, 0.08, 0.07, 0.06], tailAt: 0.55, stripes: 2,
    head: { l: 0.58, w: 0.48, snout: 0.46, ears: 'rond', earK: 0.85, nose: 'rose', sabers: 1, whiskers: true },
    legs: Q4(0.12, 0.47, 0.2, 0.11),
  }),
  homotherium: mam({
    spine: [8, 0.33], body: [0.26, 0.4, 0.44, 0.4, 0.34, 0.1, 0.07, 0.04], tailAt: 0.62, stripes: 1,
    head: { l: 0.62, w: 0.48, snout: 0.5, ears: 'petit', earK: 1.2, nose: 'rose', sabers: 0.9, whiskers: true },
    legs: Q4(0.14, 0.55, 0.21, 0.12),
  }),
  'lion-des-cavernes': mam({
    spine: [9, 0.32], body: [0.26, 0.38, 0.4, 0.38, 0.34, 0.08, 0.07, 0.06, 0.05], tailAt: 0.55, tuft: 0.07,
    head: { l: 0.62, w: 0.52, snout: 0.48, ears: 'rond', earK: 0.8, nose: 'rose', whiskers: true },
    legs: Q4(0.12, 0.47, 0.21, 0.11),
  }),
  'ours-des-cavernes': mam({
    spine: [6, 0.36], body: [0.42, 0.56, 0.6, 0.58, 0.48, 0.14], cadence: 1.8, sway: 0.04,
    head: { l: 0.72, w: 0.62, snout: 0.48, ears: 'rond', earK: 0.75 },
    legs: Q4(0.16, 0.7, 0.18, 0.15, 'patte', { claws: true }),
  }),
  louveteau: mam({
    spine: [7, 0.27], body: [0.24, 0.34, 0.38, 0.36, 0.13, 0.13, 0.08], tailAt: 0.55, wag: 0.5, saddle: [0.1, 0.55],
    head: { l: 0.62, w: 0.56, snout: 0.4, ears: 'pointe', earK: 0.95 },
    legs: Q4(0.12, 0.45, 0.13, 0.09),
  }),
  loup: mam({
    spine: [9, 0.31], body: [0.22, 0.31, 0.34, 0.33, 0.3, 0.1, 0.15, 0.16, 0.11], tailAt: 0.55, wag: 0.4, saddle: [0.1, 0.55], tuft: 0.08, tuftCol: '#3A3632',
    head: { l: 0.76, w: 0.46, snout: 0.42, ears: 'pointe' },
    legs: Q4(0.12, 0.47, 0.19, 0.09),
  }),
  chien: mam({
    spine: [9, 0.3], body: [0.22, 0.31, 0.34, 0.33, 0.3, 0.1, 0.1, 0.09, 0.05], tailAt: 0.55, wag: 0.6,
    head: { l: 0.68, w: 0.5, snout: 0.45, ears: 'pointe', earK: 0.85 },
    legs: Q4(0.12, 0.47, 0.18, 0.09),
  }),
  berger: mam({
    spine: [9, 0.31], body: [0.24, 0.33, 0.36, 0.35, 0.32, 0.12, 0.16, 0.17, 0.12], tailAt: 0.55, wag: 0.5, saddle: [0.1, 0.55],
    head: { l: 0.72, w: 0.5, snout: 0.44, ears: 'pointe' },
    legs: Q4(0.12, 0.47, 0.19, 0.095),
  }),
  hyaenodon: mam({
    spine: [9, 0.32], body: [0.22, 0.32, 0.36, 0.35, 0.32, 0.09, 0.08, 0.06, 0.04], stripes: 1,
    head: { l: 0.85, w: 0.44, snout: 0.45, ears: 'pointe', earK: 0.75 },
    legs: Q4(0.12, 0.47, 0.2, 0.1),
  }),
  hyene: mam({
    spine: [8, 0.32], body: [0.24, 0.36, 0.4, 0.36, 0.3, 0.08, 0.07, 0.05], spots: 16, ridge: 0.5, tuft: 0.06,
    head: { l: 0.72, w: 0.5, snout: 0.48, ears: 'rond', muzzleCol: '#3A2E26' },
    legs: Q4(0.12, 0.55, 0.2, 0.1),
  }),
  amphicyon: mam({
    spine: [9, 0.33], body: [0.3, 0.44, 0.48, 0.46, 0.42, 0.14, 0.14, 0.11, 0.06], tailAt: 0.58, saddle: [0.1, 0.5],
    head: { l: 0.85, w: 0.54, snout: 0.5, ears: 'rond', earK: 0.85 },
    legs: Q4(0.12, 0.47, 0.2, 0.14, 'patte', { claws: true }),
  }),
  andrewsarchus: mam({
    spine: [8, 0.33], body: [0.3, 0.42, 0.46, 0.42, 0.36, 0.1, 0.07, 0.04], stripes: 1,
    head: { l: 1.0, w: 0.5, snout: 0.55, ears: 'petit', earK: 1.1 },
    legs: Q4(0.14, 0.55, 0.2, 0.13, 'sabot'),
  }),
  palaeolagus: mam({
    spine: [6, 0.27], body: [0.26, 0.36, 0.42, 0.44, 0.36, 0.12], pompon: 0.13, sway: 0.04, cadence: 2.8,
    head: { l: 0.5, w: 0.44, snout: 0.48, ears: 'long', nose: 'rose', eye: [0.0, 0.66] },
    legs: [
      { at: 0.15, len: 0.1, w: 0.07, foot: 'patte', ph: 0, stride: 0.16, fwd: 0.06 },
      { at: 0.75, len: 0.12, w: 0.11, foot: 'patte', ph: 0, stride: 0.22, fwd: 0.12 },
    ],
  }),
  marmotte: mam({
    spine: [6, 0.27], body: [0.3, 0.42, 0.46, 0.44, 0.2, 0.14], tailAt: 0.7,
    head: { l: 0.5, w: 0.5, snout: 0.5, ears: 'petit', nose: 'rose' },
    legs: Q4(0.15, 0.6, 0.12, 0.1, 'patte', { claws: true }),
  }),
  darwinius: mam({
    spine: [10, 0.26], body: [0.2, 0.28, 0.3, 0.29, 0.07, 0.06, 0.06, 0.05, 0.05, 0.04], tailAt: 0.42,
    head: { l: 0.48, w: 0.48, snout: 0.4, ears: 'rond', earK: 0.75, eye: [0.15, 0.45], eyeR: 0.07 },
    legs: Q4(0.1, 0.36, 0.16, 0.075, 'patte', { claws: true }),
  }),
  eohippus: mam({
    spine: [8, 0.28], body: [0.15, 0.27, 0.31, 0.32, 0.31, 0.07, 0.05, 0.03], spots: 9, spotCol: '#F2E6C8',
    head: { l: 0.6, w: 0.3, snout: 0.55, ears: 'cheval', nose: 'narines', muzzle: false },
    legs: Q4(0.12, 0.55, 0.15, 0.07, 'sabot'),
  }),
  mesohippus: mam({
    spine: [7, 0.3], body: [0.16, 0.28, 0.32, 0.33, 0.32, 0.06, 0.03], mane: 0.25, crin: 0.7,
    head: { l: 0.66, w: 0.3, snout: 0.55, ears: 'cheval', nose: 'narines', muzzle: false },
    legs: Q4(0.1, 0.62, 0.16, 0.07, 'sabot'),
  }),
  hipparion: mam({
    spine: [7, 0.32], body: [0.18, 0.31, 0.35, 0.36, 0.35, 0.06, 0.03], mane: 0.25, crin: 0.8, stripes: 1,
    head: { l: 0.78, w: 0.32, snout: 0.55, ears: 'cheval', nose: 'narines', muzzle: false },
    legs: Q4(0.1, 0.62, 0.17, 0.08, 'sabot'),
  }),
  cheval: mam({
    spine: [7, 0.32], body: [0.18, 0.32, 0.36, 0.37, 0.36, 0.06, 0.03], mane: 0.25, crin: 0.9, maneCol: '#3A2A1E', legCol: '#6A5442',
    head: { l: 0.78, w: 0.34, snout: 0.55, ears: 'cheval', nose: 'narines', muzzle: false },
    legs: Q4(0.1, 0.62, 0.18, 0.085, 'sabot'),
  }),
  gazelle: mam({
    spine: [7, 0.28], body: [0.14, 0.24, 0.27, 0.27, 0.26, 0.06, 0.04], tuft: 0.05,
    head: { l: 0.5, w: 0.26, snout: 0.5, ears: 'pointe', nose: 'narines', horns: 'gazelle', muzzle: false },
    legs: Q4(0.12, 0.65, 0.15, 0.055, 'sabot', { stride: 0.3 }),
  }),
  renne: mam({
    spine: [7, 0.31], body: [0.18, 0.3, 0.34, 0.34, 0.32, 0.08, 0.04],
    head: { l: 0.62, w: 0.36, snout: 0.55, ears: 'pointe', nose: 'narines', antlers: 'renne', antlerK: 1.6, muzzle: false },
    legs: Q4(0.12, 0.62, 0.16, 0.075, 'sabot'),
  }),
  megaloceros: mam({
    spine: [7, 0.33], body: [0.2, 0.34, 0.38, 0.38, 0.34, 0.07, 0.04],
    head: { l: 0.64, w: 0.36, snout: 0.55, ears: 'pointe', nose: 'narines', antlers: 'megaceros', antlerK: 2.3, muzzle: false },
    legs: Q4(0.12, 0.62, 0.17, 0.09, 'sabot'),
  }),
  chevre: mam({
    spine: [6, 0.3], body: [0.16, 0.28, 0.3, 0.3, 0.27, 0.06], tuft: 0.05,
    head: { l: 0.52, w: 0.3, snout: 0.55, ears: 'pointe', nose: 'narines', horns: 'chevre', muzzle: false },
    legs: Q4(0.15, 0.7, 0.14, 0.06, 'sabot'),
  }),
  mouton: mam({
    spine: [6, 0.3], body: [0.24, 0.42, 0.48, 0.48, 0.4, 0.1], wool: '#F2EEE4', woolTo: 0.85, headCol: '#3A302A', legCol: '#3A302A',
    head: { l: 0.52, w: 0.36, snout: 0.6, ears: 'lateral', nose: 'narines' },
    legs: Q4(0.15, 0.68, 0.12, 0.065, 'sabot'),
  }),
  chalicothere: mam({
    spine: [7, 0.34], body: [0.2, 0.38, 0.44, 0.42, 0.36, 0.07, 0.04],
    head: { l: 0.7, w: 0.36, snout: 0.6, ears: 'cheval', nose: 'narines', muzzle: false },
    legs: Q4(0.12, 0.62, 0.2, 0.12, 'patte', { claws: true }),
  }),
  paraceratherium: mam({
    spine: [9, 0.33], body: [0.16, 0.2, 0.3, 0.46, 0.5, 0.5, 0.44, 0.06, 0.03], sway: 0.04, cadence: 1.4, tuft: 0.05,
    head: { l: 0.72, w: 0.34, snout: 0.6, ears: 'cheval', nose: 'narines', muzzle: false },
    legs: Q4(0.38, 0.72, 0.2, 0.17, 'colonne', { stride: 0.2 }),
  }),
  bison: mam({
    spine: [7, 0.33], body: [0.4, 0.52, 0.52, 0.46, 0.4, 0.24, 0.04], cape: 0.45, tuft: 0.06,
    head: { l: 0.6, w: 0.56, snout: 0.55, ears: 'lateral', nose: 'narines', horns: 'bison', muzzle: false },
    legs: Q4(0.14, 0.62, 0.16, 0.12, 'sabot'),
  }),
  aurochs: mam({
    spine: [7, 0.34], body: [0.34, 0.46, 0.5, 0.48, 0.44, 0.26, 0.04], tuft: 0.06,
    head: { l: 0.62, w: 0.5, snout: 0.58, ears: 'lateral', nose: 'narines', horns: 'aurochs', muzzleCol: '#C9B79A' },
    legs: Q4(0.14, 0.62, 0.17, 0.11, 'sabot'),
  }),
  'rhino-laineux': mam({
    spine: [7, 0.34], body: [0.36, 0.5, 0.54, 0.54, 0.48, 0.3, 0.04], shaggy: 0.12, tuft: 0.05, cadence: 1.8,
    head: { l: 0.78, w: 0.5, snout: 0.62, ears: 'pointe', earK: 0.6, nose: 'narines', horns: 'rhino', muzzle: false },
    legs: Q4(0.14, 0.62, 0.15, 0.15, 'colonne'),
  }),
  entelodon: mam({
    spine: [8, 0.33], body: [0.3, 0.44, 0.46, 0.4, 0.34, 0.08, 0.05, 0.03], ridge: 0.55, tuft: 0.05,
    head: { l: 0.95, w: 0.55, snout: 0.55, ears: 'pointe', earK: 0.6, nose: 'groin', muzzle: false, fangs: true },
    legs: Q4(0.14, 0.58, 0.17, 0.1, 'sabot'),
  }),
  mammouth: mam({
    spine: [7, 0.35], body: [0.42, 0.58, 0.62, 0.6, 0.54, 0.36, 0.05], shaggy: 0.16, tuft: 0.05, sway: 0.03, cadence: 1.4,
    head: { l: 0.62, w: 0.56, snout: 0.55, ears: 'elephant', earK: 0.6, trunk: 1.0, tusks: 'mammouth', tuskK: 0.95, muzzle: false, eye: [0.18, 0.5] },
    legs: Q4(0.14, 0.58, 0.14, 0.2, 'colonne', { stride: 0.2 }),
  }),
  deinotherium: mam({
    spine: [7, 0.35], body: [0.4, 0.56, 0.62, 0.62, 0.56, 0.38, 0.05], tuft: 0.05, sway: 0.03, cadence: 1.4,
    head: { l: 0.62, w: 0.54, snout: 0.55, ears: 'elephant', earK: 1.0, trunk: 0.85, tusks: 'deino', muzzle: false, eye: [0.18, 0.5] },
    legs: Q4(0.14, 0.58, 0.14, 0.2, 'colonne', { stride: 0.2 }),
  }),
  'oiseau-terreur': {
    spine: [7, 0.3], body: [0.12, 0.12, 0.16, 0.36, 0.42, 0.36, 0.2], sway: 0.05, cadence: 2.5, fan: 0.32, wings: 0.3, belly: '#E6DCC8',
    head: { type: 'bec', l: 0.48, w: 0.34, snout: 0.8, beakL: 2.2, beakCol: '#D9A441', plume: '#4E3E30', eye: [-0.05, 0.6], eyeR: 0.06 },
    legs: B2(0.62, 0.24, 0.1, 0.5),
  },
  gastornis: {
    spine: [7, 0.3], body: [0.14, 0.14, 0.2, 0.44, 0.5, 0.42, 0.24], sway: 0.05, cadence: 2, fan: 0.34, wings: 0.36, belly: '#C9D0D8',
    head: { type: 'bec', l: 0.55, w: 0.42, snout: 0.8, beakL: 1.8, beakCol: '#E2B33C', eye: [-0.05, 0.6], eyeR: 0.06 },
    legs: B2(0.62, 0.24, 0.13, 0.42),
  },
  lezard: rep({
    spine: [9, 0.3], body: [0.2, 0.3, 0.34, 0.33, 0.27, 0.18, 0.11, 0.06, 0.02], stripes: 1, sway: 0.12,
    head: { l: 0.5, w: 0.27, snout: 0.6, eyeR: 0.07 },
    legs: Q4(0.16, 0.5, 0.2, 0.09, 'griffe', { sprawl: true }),
  }),
  'crocodile-coureur': rep({
    spine: [9, 0.34], body: [0.22, 0.32, 0.38, 0.38, 0.32, 0.22, 0.14, 0.07, 0.03], studs: [0.08, 0.9],
    head: { l: 0.95, w: 0.28, snout: 0.5, teeth: 10, eyeR: 0.05 },
    legs: Q4(0.15, 0.48, 0.24, 0.11, 'griffe'),
  }),
  crocodile: rep({
    spine: [10, 0.33], body: [0.24, 0.34, 0.4, 0.4, 0.36, 0.28, 0.2, 0.13, 0.07, 0.03], studs: [0.06, 0.95], sway: 0.08,
    head: { l: 1.05, w: 0.32, snout: 0.45, teeth: 12, eyeR: 0.05, eye: [-0.15, 0.6] },
    legs: Q4(0.14, 0.44, 0.2, 0.12, 'griffe', { sprawl: true }),
  }),
  ambulocetus: mam({
    spine: [9, 0.33], body: [0.26, 0.34, 0.38, 0.36, 0.32, 0.25, 0.18, 0.12, 0.06], sway: 0.1,
    head: { l: 1.0, w: 0.36, snout: 0.5, ears: 'petit', earK: 0.7, nose: 'narines', teeth: 10, muzzle: false },
    legs: Q4(0.14, 0.5, 0.18, 0.11, 'patte', { sprawl: true }),
  }),
};

/* La portée de la gueule (pour le jeu) : la même qu'avant, pour ne rien changer à la difficulté */
const REACH = {
  tetrapode: 0.545, reptile: 0.44, 'premier-dino': 0.515, allosaure: 0.65, trex: 0.762, 'trex-rival': 0.762, dimetrodon: 0.515, cynodonte: 0.41,
  coelophysis: 0.5, postosuchus: 0.665, plateosaure: 0.305, compsognathus: 0.395, dryosaure: 0.38, stegosaure: 0.305, brachiosaure: 0.29,
  diplodocus: 0.29, ceratosaure: 0.62, edmontosaure: 0.575, dakotaraptor: 0.47, ankylosaure: 0.44, triceratops: 0.71,
  musaraigne: 0.515, miacis: 0.5, proailurus: 0.463, machairodus: 0.485, homotherium: 0.515, eohippus: 0.5, darwinius: 0.41, andrewsarchus: 0.8,
  ambulocetus: 0.8, palaeolagus: 0.425, mesohippus: 0.545, hyaenodon: 0.688, entelodon: 0.762, paraceratherium: 0.59, lezard: 0.425,
  'crocodile-coureur': 0.762, crocodile: 0.838, gazelle: 0.425, hipparion: 0.635, chalicothere: 0.575, deinotherium: 0.515, hyene: 0.59,
  amphicyon: 0.688, bison: 0.5, renne: 0.5, cheval: 0.635, megaloceros: 0.515, 'rhino-laineux': 0.635, mammouth: 0.5, 'lion-des-cavernes': 0.515,
  'ours-des-cavernes': 0.59, 'oiseau-terreur': 0.41, gastornis: 0.463, louveteau: 0.515, loup: 0.62, chien: 0.56, berger: 0.59, marmotte: 0.425,
  mouton: 0.44, chevre: 0.44, aurochs: 0.515,
};

/** La vignette (fiches « Le savais-tu ? », missions) : l'animal entier, bien au milieu */
function frameOf(S) {
  const len = S.spine[1] * (S.spine[0] - 1);
  const head = (S.head?.l ?? 0.6) * (S.head?.trunk ? 1.6 : S.head?.beakL ? 1.8 : 1.1);
  const r = Math.min(0.3, 0.78 / (len + head + 0.3));
  const fwd = (head - len) / 2;
  return { r: +r.toFixed(3), x: +(0.5 - 0.94 * fwd * r).toFixed(3), y: +(0.5 + 0.34 * fwd * r).toFixed(3) };
}

function register(look, S) {
  SPINES[look] = { n: S.spine[0], gap: S.spine[1] };
  FRAMES[look] = frameOf(S);
}
for (const [id, S] of Object.entries(ANIMAUX)) {
  const look = `vd-${id}`;
  register(look, S);
  SNOUT[look] = REACH[id] ?? 0.55;
  LOOKS[look] = (ctx, c, t) => drawLand(ctx, { ...c, look }, t, S, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
}
for (const [id, o] of [['humain', {}], ['chasseur', { spear: true }], ['enfant', { child: true }], ['humain-berger', { crook: true }]]) {
  LOOKS[`vd-${id}`] = (ctx, c, t) => drawPerson(ctx, c, t, o);
  FRAMES[`vd-${id}`] = { r: 0.5, x: 0.5, y: 0.5 };
}

/* ============================================================================
   Le joueur : ses formes, et ses évolutions qui se voient.
   ============================================================================ */
const FORM_PARTS = {
  // niveau 2
  tetrapode: (P) => ({ legK: P.pattes ? 1.35 : 1, fat: P.poumons }),
  reptile: (P) => ({ studs: !!P.ecailles, legK: P['longues-pattes'] ? 1.35 : 1 }),
  'premier-dino': (P) => ({ armK: P.griffes ? 1.35 : 1, claws: !!P.griffes, feathers: P.plumes ? '#F2C14E' : null }),
  allosaure: (P) => ({ horns: !!P.cornes, headK: P.machoire ? 1.12 : 1 }),
  trex: (P) => ({ headK: P.morsure ? 1.12 : 1, studs: !!P['peau-epaisse'] }),
  // niveau 3
  musaraigne: (P) => mamParts(P), miacis: (P) => mamParts(P), proailurus: (P) => mamParts(P), machairodus: (P) => mamParts(P), homotherium: (P) => mamParts(P),
  // niveau 4
  louveteau: (P) => dogParts(P), loup: (P) => dogParts(P), chien: (P) => dogParts(P), berger: (P) => dogParts(P),
};
function mamParts(P) {
  return {
    bigEars: !!P.oreilles, whiskers: !!P.moustaches, fluffy: !!P.fourrure, claws: !!P.griffes, bigNose: !!P.flair,
    saberK: (P['dents-de-sabre'] ? 1.3 : 1) * (P['grands-sabres'] ? 1.45 : 1), shaggy: P['fourrure-epaisse'] ? 0.08 : 0,
  };
}
function dogParts(P) {
  return {
    bigNose: !!P.flair, fluffy: !!P['pelage-epais'], shaggy: P['pelage-epais'] ? 0.05 : 0,
    ears: P['oreilles-tombantes'] ? 'tombante' : null, earCol: shade(PLAYER.body, -0.22),
    curl: !!P['queue-tire-bouchon'], patch: P['pelage-tachete'] ? PLAYER.patch || '#FFFFFF' : null,
  };
}
const CURLS = new Map();
for (const [id, make] of Object.entries(FORM_PARTS)) {
  const form = `vd-${id}`;
  const S0 = ANIMAUX[id];
  // (le look « vd-… » de l'espèce sert aussi aux rivaux : le même corps, sans les évolutions)
  FORM_SPINE[form] = form;
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const o = make(parts || {});
    let S = S0;
    if (o.fat) S = fatOf(S0);
    if (o.curl) {
      // la queue en tire-bouchon : elle frétille sans arrêt, plus courte et plus touffue
      S = CURLS.get(id) || { ...S0, wag: 0.9, body: S0.body.map((w, i) => (i / (S0.body.length - 1) > (S0.tailAt ?? 0.6) ? w * 1.2 : w)) };
      CURLS.set(id, S);
    }
    drawLand(ctx, { ...p, look: form, mood: o.curl && mood !== 'scared' ? 'happy' : mood, seed: 0 }, t, S, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.32), cute: true, dark: PLAYER.dark, ...o,
    });
  };
}
const FATS = new Map();
function fatOf(S) {
  let F = FATS.get(S);
  if (!F) {
    F = { ...S, body: S.body.map((w, i) => (i > 0 && i < 4 ? w * 1.12 : w)) };
    FATS.set(S, F);
  }
  return F;
}
