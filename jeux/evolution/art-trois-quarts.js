// ============================================================================
// Vers les dinosaures (niveau 2) : les animaux en VUE DE TROIS QUARTS.
// On les voit d'un peu au-dessus, comme dans un vieux jeu d'aventure : le dos,
// mais aussi le flanc et la joue tournés vers nous, et les pattes qui
// descendent jusqu'au sol, plus bas sur l'écran. Le corps suit une colonne
// (comme les requins) : l'animal va dans toutes les directions sans jamais se
// retrouver « de profil ». Les pieds se posent à tour de rôle, la queue
// balance, la mâchoire du bas tombe quand la gueule s'ouvre, le cou des géants
// monte haut dans le ciel, et l'ombre reste par terre.
//
// Un seul dessinateur (drawBeast) pour tout le monde : chaque espèce n'est
// qu'une liste de mesures (BEASTS). Le joueur a ses propres formes, qui
// changent avec ses évolutions.
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SPINES, SNOUT, shade, seeded, smoothClosed, spineShape, segDir, eye, makeSpine } from './art.js';

const TAU = Math.PI * 2;
const HORN = '#EFE4C8';
const CLAW = '#2E2620';
const TOOTH = '#FBF6E9';
const MOUTH = '#5E1B28';

let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 20;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function profileAt(prof, k) {
  const x = k * (prof.length - 1);
  const i = Math.min(prof.length - 2, Math.floor(x));
  return prof[i] + (prof[i + 1] - prof[i]) * (x - i);
}

/** La colonne qui marche : la queue balance doucement, un peu plus quand il court */
function walkSpine(c, look, t, S) {
  const base = c.spine || makeSpine(c.x, c.y, c.angle, c.size, look);
  const n = base.length;
  const r = c.size;
  const k = clamp(c.speed ?? 0.3, 0, 1.3);
  const ph = (c.walk ?? t * 1.5) * (S.cadence ?? 1.5) + (c.seed || 0) * 3;
  const amp = (S.sway ?? 0.06) * (0.35 + k);
  return base.map((p, i) => {
    if (i === 0) return { x: p.x, y: p.y };
    const d = segDir(base, i);
    const u = i / (n - 1);
    const off = Math.sin(ph * 0.5 + t * 0.6 - i * 0.7) * amp * r * Math.pow(u, 1.6);
    return { x: p.x - d.y * off, y: p.y + d.x * off };
  });
}

/* ---------- Une patte : la cuisse sur le flanc, le tibia, le pied posé au sol ---------- */
function leg(ctx, L, col, dark, lw, biped) {
  const { hip, foot, w, out } = L;
  // le genou ressort vers l'extérieur ; celui d'un bipède pointe vers l'avant
  const kx = hip.x + (foot.x - hip.x) * 0.45 + out.x * w * 0.7 + (biped ? L.d.x * w * 0.9 : 0);
  const ky = hip.y + (foot.y - hip.y) * 0.45 + out.y * w * 0.35 + (biped ? L.d.y * w * 0.9 - w * 0.3 : 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // le contour, puis la couleur : un tube qui s'affine
  ctx.strokeStyle = dark;
  ctx.lineWidth = w * 1.05 + lw * 2;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  ctx.lineWidth = w * 0.72 + lw * 2;
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(foot.x, foot.y - w * 0.15);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = w * 1.05;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  ctx.lineWidth = w * 0.72;
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(foot.x, foot.y - w * 0.15);
  ctx.stroke();
  // la cuisse : un gros muscle bien rond
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(hip.x, hip.y + w * 0.1, w * 1.08, w * 0.88, Math.atan2(L.d.y, L.d.x), 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.ellipse(hip.x - w * 0.25, hip.y - w * 0.2, w * 0.45, w * 0.28, -0.4, 0, TAU);
    ctx.fill();
  }
  footPrint(ctx, foot.x, foot.y, Math.atan2(L.d.y, L.d.x), w * 0.78, col, dark, lw, L.toes);
}

function footPrint(ctx, x, y, a, w, col, dark, lw, toes) {
  const fx = Math.cos(a), fy = Math.sin(a);
  if (toes && fine) {
    // les doigts, avec leurs griffes, devant le pied
    for (let k = 0; k < toes; k++) {
      const u = toes === 1 ? 0 : (k / (toes - 1) - 0.5) * 1.7;
      const bx = x + fx * w * 0.55 - fy * w * u * 0.6, by = y + fy * w * 0.3 + fx * w * u * 0.35;
      const tx = bx + fx * w * 0.6 - fy * w * u * 0.25, ty = by + fy * w * 0.32 + fx * w * u * 0.12 + w * 0.08;
      ctx.strokeStyle = dark;
      ctx.lineCap = 'round';
      ctx.lineWidth = w * 0.42 + lw * 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = w * 0.42;
      ctx.stroke();
      ctx.fillStyle = CLAW;
      ctx.beginPath();
      ctx.moveTo(tx - fy * w * 0.14, ty + fx * w * 0.1);
      ctx.lineTo(tx + fx * w * 0.34, ty + fy * w * 0.18 + w * 0.06);
      ctx.lineTo(tx + fy * w * 0.14, ty - fx * w * 0.1);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.8, w * 0.5, Math.atan2(fy * 0.5, fx), 0, TAU);
  ctx.fill();
  ctx.stroke();
}

/* ---------- Une corne, une plaque, une pointe (qui se dressent vers le haut de l'écran) ---------- */
function cone(ctx, bx, by, tx, ty, w, col, dark, lw) {
  const dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(bx + nx * w, by + ny * w);
  ctx.quadraticCurveTo(bx + dx * 0.55 + nx * w * 0.4, by + dy * 0.55 + ny * w * 0.4, tx, ty);
  ctx.quadraticCurveTo(bx + dx * 0.55 - nx * w * 0.4, by + dy * 0.55 - ny * w * 0.4, bx - nx * w, by - ny * w);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/* ============================================================================
   L'animal entier.
   S : { body (largeurs, du cou au bout de la queue, × r), head { l, w, snout,
         brow, beak, teeth, iris, eye }, hip (hauteur du dos au-dessus du sol),
         flank (épaisseur du flanc qu'on voit), legs [{ at (place sur la colonne,
         0 = le cou), w, spread, fwd, stride, lift, ph, toes }], biped, cadence,
         sway, neck { n, h } (le cou qui monte), horns, frill, sail, plates,
         spikes, armor, club, studs, crest, tube, arms, stripes, spots, feathers,
         fins (la queue à nageoire du tétrapode), whiskers }
   ============================================================================ */
export function drawBeast(ctx, c, t, S, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const dark = o.dark || shade(col, -0.6);
  const flankCol = shade(col, -0.24);
  const stripe = o.stripe || S.stripe || shade(col, -0.36);
  const legCol = shade(col, -0.1);
  const lw = Math.max(0.9, r * 0.04);
  const base = walkSpine(c, c.look, t, S);
  // (le lézard qui vient de laisser sa queue en leurre : il en manque un bout)
  const cut = c.tailCut ? Math.max(3, base.length - c.tailCut) : base.length;
  const pts = base.slice(0, cut);
  const n = pts.length;
  const full = base.length;
  const widths = pts.map((_, i) => r * profileAt(S.body, i / (full - 1)));
  // le cou des géants monte vers le ciel (vers le haut de l'écran)
  const lift = (i) => (S.neck ? Math.pow(Math.max(0, 1 - i / S.neck.n), 1.3) * S.neck.h * r : 0);
  const P = pts.map((p, i) => ({ x: p.x, y: p.y - lift(i) }));
  const H = (S.hip ?? 0.3) * r;        // le sol, sous l'animal, est plus bas sur l'écran
  const T = (S.flank ?? 0.16) * r;     // l'épaisseur du flanc qu'on voit
  const spd = clamp(c.speed ?? 0, 0, 1.3);
  const d0 = segDir(pts, 0);
  const a = Math.atan2(d0.y, d0.x);
  const fx = Math.cos(a), fy = Math.sin(a);

  // l'ombre, par terre (elle va de la tête au bout de la queue)
  ctx.fillStyle = 'rgba(0, 25, 15, 0.24)';
  const sh = pts.map((p) => ({ x: p.x + r * 0.06, y: p.y + H + T * 0.6 }));
  smoothClosed(ctx, spineShape(sh, widths.map((w) => w * 1.1 + r * 0.04), 1));
  ctx.fill();
  const HL = (S.head?.l ?? 0.5) * r;
  ctx.beginPath();
  ctx.ellipse(pts[0].x + fx * HL * 0.35, pts[0].y + fy * HL * 0.35 + H + T * 0.6, HL * 0.55, HL * 0.28, a, 0, TAU);
  ctx.fill();

  // les pattes : où est la hanche, où se pose le pied
  const legs = [];
  for (const L of S.legs || []) {
    for (const s of [-1, 1]) {
      const i = Math.min(n - 1, Math.round(L.at * (full - 1)));
      const d = segDir(pts, i);
      const ox = -d.y * s, oy = d.x * s;
      const w = widths[i];
      const hip = { x: P[i].x + ox * w * 0.6, y: P[i].y + oy * w * 0.6 + T * 0.5 };
      const ph = (c.walk ?? 0) * (S.cadence ?? 1.5) + (L.ph || 0) * Math.PI + (s > 0 ? 0 : Math.PI);
      const k = Math.min(1, spd * 1.5);
      const swing = Math.sin(ph) * (L.stride ?? 0.3) * r * k;
      const up = Math.max(0, Math.cos(ph)) * (L.lift ?? 0.12) * r * k;
      const reach = w * 0.6 + (L.spread ?? 0.15) * r;
      const foot = {
        x: pts[i].x + ox * reach + d.x * (swing + (L.fwd ?? 0) * r),
        y: pts[i].y + oy * reach + d.y * (swing + (L.fwd ?? 0) * r) + H + T - up,
      };
      // la patte tournée vers nous passe devant le corps, l'autre derrière
      const near = oy > 0.05 || (Math.abs(oy) <= 0.05 && s > 0);
      legs.push({ hip, foot, w: (L.w ?? 0.14) * r, near, out: { x: ox, y: oy }, toes: L.toes ?? 3, d });
    }
  }
  for (const L of legs) if (!L.near) leg(ctx, L, shade(legCol, -0.22), dark, lw, S.biped);
  if (S.arms) arms(ctx, P, pts, widths, full, S, false, legCol, dark, lw, r, c, t);

  // la queue à nageoire du tétrapode
  if (S.fins && n === full) tailFin(ctx, P, pts, n, r, col, dark, lw);

  // le flanc, qu'on voit parce qu'on regarde d'un peu au-dessus
  ctx.fillStyle = flankCol;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, spineShape(P.map((p) => ({ x: p.x, y: p.y + T })), widths, 0.6));
  ctx.fill();
  ctx.stroke();

  // le dos : éclairé au milieu, plus sombre sur les bords, c'est rond
  const outline = spineShape(P, widths, 0.6);
  ctx.fillStyle = shade(col, -0.06);
  smoothClosed(ctx, outline);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = col;
    smoothClosed(ctx, spineShape(P.map((p) => ({ x: p.x, y: p.y - T * 0.12 })), widths.map((w) => w * 0.8), 0.6));
    ctx.fill();
    ctx.fillStyle = shade(col, 0.12);
    smoothClosed(ctx, spineShape(P.map((p) => ({ x: p.x, y: p.y - T * 0.25 })), widths.map((w) => w * 0.45), 0.6));
    ctx.fill();
    if (S.stripes) {
      ctx.fillStyle = stripe;
      for (let i = 1; i < n - 1; i++) {
        const d = segDir(pts, i), w = widths[i];
        ctx.beginPath();
        ctx.ellipse(P[i].x, P[i].y, r * 0.055, w * 1.1, Math.atan2(d.y, d.x), 0, TAU);
        ctx.fill();
      }
    }
    if (S.spots) {
      const rnd = seeded(S.spots * 31 + 7);
      ctx.fillStyle = stripe;
      for (let k = 0; k < S.spots; k++) {
        const i = 1 + Math.floor(rnd() * (n - 2));
        const d = segDir(pts, i), u = (rnd() - 0.5) * 1.4 * widths[i];
        ctx.beginPath();
        ctx.ellipse(P[i].x - d.y * u, P[i].y + d.x * u, r * (0.04 + rnd() * 0.05), r * (0.03 + rnd() * 0.03), rnd() * 3, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, outline);
  ctx.stroke();

  // ce qui se dresse sur le dos
  if (S.sail) sail(ctx, P, S.sail, full, r, o.sail || S.sailCol || '#C8553D', dark, lw);
  if (S.plates) plates(ctx, P, pts, S.plates, full, r, S.plateCol || '#D9734E', dark, lw);
  if (S.studs && fine) studs(ctx, P, S.studs, full, r, shade(col, -0.32));
  if (S.armor) armor(ctx, P, pts, widths, S.armor, full, r, col, dark, lw);
  if (S.feathers && fine) feathers(ctx, P, pts, widths, n, r, S.feathers);
  if (S.spikes && n === full) spikes(ctx, P, pts, r, S.spikes, dark, lw);
  if (S.club && n === full) {
    const tp = P[n - 1];
    ctx.fillStyle = shade(col, -0.12);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(tp.x, tp.y, r * S.club * 1.2, r * S.club, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  // la tête
  drawHead(ctx, c, t, S, P[0], a, fx, fy, r, col, flankCol, dark, lw, T, o);

  // ce qui passe devant : les petits bras, les pattes tournées vers nous
  if (S.arms) arms(ctx, P, pts, widths, full, S, true, legCol, dark, lw, r, c, t);
  for (const L of legs) if (L.near) leg(ctx, L, legCol, dark, lw, S.biped);
}

/** Une dent : un croc pointu et un peu courbé, cerné de noir. dir = 1 vers le bas, -1 vers le haut */
function tooth(ctx, x, y, dir, len, w, dark, lw) {
  ctx.fillStyle = TOOTH;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.5, lw * 0.45);
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w * 0.35, y + dir * len * 0.65, x + w * 0.25, y + dir * len);
  ctx.quadraticCurveTo(x + w * 0.55, y + dir * len * 0.45, x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Des points régulièrement espacés le long d'une ligne brisée (en coordonnées de la tête) */
function rimSample(line, HL, HW, n) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const L = Math.hypot((line[i + 1][0] - line[i][0]) * HL, (line[i + 1][1] - line[i][1]) * HW);
    seg.push(L);
    total += L;
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (k / (n - 1)) * total, i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const w = seg[i] ? Math.min(1, d / seg[i]) : 0;
    out.push([line[i][0] + (line[i + 1][0] - line[i][0]) * w, line[i][1] + (line[i + 1][1] - line[i][1]) * w]);
  }
  return out;
}

/* ---------- La tête : le crâne, la joue tournée vers nous, la gueule ---------- */
function drawHead(ctx, c, t, S, h, a, fx, fy, r, col, flankCol, dark, lw, T, o) {
  const Hd = S.head || {};
  const HL = (Hd.l ?? 0.5) * r, HW = (Hd.w ?? 0.3) * r, sn = Hd.snout ?? 0.6;
  const nx = -fy, ny = fx;
  const cx = h.x + fx * HL * 0.18, cy = h.y + fy * HL * 0.18;
  const P = (u, v) => ({ x: cx + fx * HL * u + nx * HW * v, y: cy + fy * HL * u + ny * HW * v });
  // le contour du crâne, vu d'en haut : large derrière, le museau devant
  const shape = (dy) => [
    P(-0.5, 0.78), P(-0.15, 1), P(0.25, 0.9), P(0.5, sn * 1.05), P(0.62, 0), P(0.5, -sn * 1.05), P(0.25, -0.9), P(-0.15, -1), P(-0.5, -0.78), P(-0.62, 0),
  ].map((p) => ({ x: p.x, y: p.y + dy }));
  const Th = T * 0.85;
  // la collerette se dresse derrière la tête
  if (Hd.frill) {
    const f = P(-0.55, 0);
    frill(ctx, f.x, f.y - HW * 0.75, a, HW * Hd.frill.r, Hd.frill, col, dark, lw);
  }
  const open = clamp(c.mouth || 0, 0, 1);
  const lift = open * HL * 0.08;             // la mâchoire du haut se relève un peu…
  const drop = Th + open * HL * 0.55;         // …et celle du bas tombe, vers le bas de l'écran
  // le bord de la gueule, de la commissure gauche au bout du museau, puis à la commissure droite
  const RIM = [[-0.28, -0.93], [0.2, -0.86], [0.48, -sn], [0.6, 0], [0.48, sn], [0.2, 0.86], [-0.28, 0.93]];
  const rim = rimSample(RIM, HL, HW, 26);
  const at = (q, dy, k = 1) => { const p = P(q[0] * k, q[1] * k); return { x: p.x, y: p.y + dy }; };
  // une dent est visible si elle est sur le côté tourné vers nous (ou au bout du museau)
  const facing = (q) => { const p = P(q[0], q[1]); return (p.y - cy) / (Math.hypot(p.x - cx, p.y - cy) || 1); };
  const teethAt = (dy, dir, scale) => {
    const N = Hd.teeth * 2 + 1;
    for (let k = 0; k < N; k++) {
      const q = rim[Math.round(((k + 0.5) / N) * (rim.length - 1))];
      if (facing(q) < -0.3) continue;
      const u = (k + 0.5) / N;
      const big = 0.65 + Math.sin(u * Math.PI) * 0.45 + (k % 3 === 1 ? 0.18 : 0);
      const p = at(q, dy);
      tooth(ctx, p.x, p.y, dir, (Hd.toothL ?? 0.13) * HL * big * scale, HL * 0.045 * big, dark, lw);
    }
  };
  if (open > 0.06) {
    // le fond de la gueule, tout sombre
    ctx.fillStyle = '#2A0810';
    ctx.beginPath();
    rim.forEach((q, i) => { const p = at(q, Th - lift); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    for (let i = rim.length - 1; i >= 0; i--) { const p = at(rim[i], drop); ctx.lineTo(p.x, p.y); }
    ctx.closePath();
    ctx.fill();
    // la mâchoire du bas : son côté, puis l'intérieur (la gencive et la langue)
    ctx.fillStyle = shade(flankCol, -0.12);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, rim.map((q) => at(q, drop + HL * 0.1)));
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#A03848';
    smoothClosed(ctx, rim.map((q) => at(q, drop, 0.84)));
    ctx.fill();
    ctx.fillStyle = '#E58A94';
    const tg = P(0.05, 0);
    ctx.beginPath();
    ctx.ellipse(tg.x, tg.y + drop, HL * 0.28, HW * 0.38, a, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 30, 45, 0.6)';
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.moveTo(tg.x - fx * HL * 0.22, tg.y + drop - fy * HL * 0.22);
    ctx.lineTo(tg.x + fx * HL * 0.18, tg.y + drop + fy * HL * 0.18);
    ctx.stroke();
    // les dents du bas, qui pointent vers le haut
    if (Hd.teeth && fine) teethAt(drop, -1, 0.85);
  } else {
    // gueule fermée : le menton dépasse juste sous la joue
    ctx.fillStyle = shade(flankCol, -0.14);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, rim.map((q) => at(q, Th + HL * 0.07, 0.96)));
    ctx.fill();
    ctx.stroke();
  }
  // la joue (le côté de la tête tourné vers nous)
  ctx.fillStyle = flankCol;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, shape(Th - lift));
  ctx.fill();
  ctx.stroke();
  if (open <= 0.06 && fine) {
    // la ligne de la gueule, qui remonte un peu au coin : un vrai sourire de carnassier
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    let started = false;
    for (const q of rim) {
      if (facing(q) < -0.3) { started = false; continue; }
      const p = at(q, Th * 0.9);
      if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  // les dents du haut, qui dépassent de la gueule
  if (Hd.teeth && fine) teethAt(Th - lift + lw * 0.5, 1, open > 0.06 ? 1 : 0.6);
  // le dessus du crâne
  const top = shape(-lift);
  ctx.fillStyle = col;
  smoothClosed(ctx, top);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = shade(col, 0.14);
    ctx.beginPath();
    ctx.ellipse(cx - fx * HL * 0.1, cy - fy * HL * 0.1 - HW * 0.15 - lift, HL * 0.42, HW * 0.45, a, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, top);
  ctx.stroke();
  // le bec des herbivores
  if (Hd.beak) {
    ctx.fillStyle = Hd.beak;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    const b = [P(0.38, sn * 1.0), P(0.62, 0), P(0.38, -sn * 1.0)];
    ctx.moveTo(b[0].x, b[0].y);
    ctx.quadraticCurveTo(b[1].x + fx * HL * 0.08, b[1].y + fy * HL * 0.08, b[2].x, b[2].y);
    ctx.quadraticCurveTo(b[1].x - fx * HL * 0.08, b[1].y - fy * HL * 0.08, b[0].x, b[0].y);
    ctx.fill();
    ctx.stroke();
  }
  // les narines
  if (fine) {
    ctx.fillStyle = 'rgba(20, 12, 8, 0.6)';
    for (const s of [-1, 1]) {
      const p = P(0.45, s * sn * 0.42);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, HW * 0.08, HW * 0.06, a, 0, TAU);
      ctx.fill();
    }
  }
  // les moustaches (cynodonte : un cousin des mammifères !)
  if (S.whiskers && fine) {
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.6)';
    ctx.lineWidth = Math.max(0.5, r * 0.012);
    for (const s of [-1, 1]) {
      for (const k of [-0.15, 0.15]) {
        const p = P(0.42, s * sn * 0.7);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + nx * s * HW * 0.9 + fx * HL * k, p.y + ny * s * HW * 0.9 + fy * HL * k);
        ctx.stroke();
      }
    }
  }
  // les cornes (at : de 0 = l'arrière du crâne à 1 = le bout du museau)
  for (const hn of S.horns || []) {
    for (const s of hn.side ? [-1, 1] : [0]) {
      const p = P(-0.5 + hn.at * 1.1, (hn.side || 0) * s);
      const L = hn.len * r;
      const tx = p.x + fx * L * hn.fwd + nx * L * (hn.out || 0) * s, ty = p.y + fy * L * hn.fwd + ny * L * (hn.out || 0) * s - L * hn.rise;
      cone(ctx, p.x, p.y, tx, ty, hn.w * r, o.horn || HORN, dark, lw);
    }
  }
  if (S.crest) {
    // les petites crêtes au-dessus des yeux (Allosaurus)
    ctx.fillStyle = S.crest;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.7;
    for (const s of [-1, 1]) {
      const p = P(0.12, s * 0.5);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - HW * 0.16, HL * 0.2, HW * 0.16, a, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (S.tube) {
    // la crête en tube du Parasaurolophus
    const p = P(-0.2, 0);
    ctx.strokeStyle = dark;
    ctx.lineCap = 'round';
    ctx.lineWidth = r * 0.14 + lw * 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - fx * r * S.tube, p.y - fy * r * S.tube - r * S.tube * 0.5);
    ctx.stroke();
    ctx.strokeStyle = S.tubeCol || shade(col, -0.2);
    ctx.lineWidth = r * 0.14;
    ctx.stroke();
  }
  // les yeux, sur les côtés du crâne
  const [eu, ev, er] = Hd.eye || [-0.12, 0.62, 0.12];
  // (les yeux restent à la taille de la tête : pas d'yeux géants sur un Brachiosaurus)
  const R = Math.min(r * er, HW * 0.36, HL * 0.2) * (o.cute ? 1.25 : 1);
  const mood = c.mood || 'calm';
  if (Hd.brow && fine) {
    ctx.fillStyle = shade(col, -0.22);
    for (const s of [-1, 1]) {
      const p = P(eu + 0.12, s * ev * 0.95);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - R * 0.6, R * 1.35, R * 0.7, a, 0, TAU);
      ctx.fill();
    }
  }
  for (const s of [-1, 1]) {
    const p = P(eu, s * ev);
    eye(ctx, p.x, p.y - R * 0.15, R, fx, fy, mood, c.blink || 0, s, Hd.iris || INK);
  }
}

function tailFin(ctx, P, pts, n, r, col, dark, lw) {
  const i0 = Math.round(n * 0.5);
  const tail = P[n - 1], td = segDir(pts, n - 1);
  const tn = { x: -td.y, y: td.x };
  ctx.fillStyle = shade(col, 0.2);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.7;
  ctx.beginPath();
  ctx.moveTo(P[i0].x, P[i0].y);
  ctx.quadraticCurveTo(tail.x + tn.x * r * 0.34, tail.y + tn.y * r * 0.34 - r * 0.2, tail.x - td.x * r * 0.4, tail.y - td.y * r * 0.4);
  ctx.quadraticCurveTo(tail.x - tn.x * r * 0.34, tail.y - tn.y * r * 0.34 - r * 0.2, P[i0].x, P[i0].y);
  ctx.fill();
  ctx.stroke();
}

function frill(ctx, cx, cy, a, R, F, col, dark, lw) {
  ctx.fillStyle = F.col || shade(col, 0.08);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * 0.7, R, a, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (!fine) return;
  ctx.fillStyle = HORN;
  for (let k = 0; k < 12; k++) {
    const u = (k / 12) * TAU;
    const px = cx + Math.cos(u) * R * 0.7 * Math.cos(a) - Math.sin(u) * R * Math.sin(a);
    const py = cy + Math.cos(u) * R * 0.7 * Math.sin(a) + Math.sin(u) * R * Math.cos(a);
    ctx.beginPath();
    ctx.arc(px, py, R * 0.08, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = F.mark || shade(col, -0.25);
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * 0.32, R * 0.55, a, 0, TAU);
  ctx.fill();
}

function sail(ctx, P, V, full, r, colr, dark, lw) {
  const i0 = Math.round(V.from * (full - 1)), i1 = Math.min(P.length - 1, Math.round(V.to * (full - 1)));
  if (i1 <= i0) return;
  const top = [];
  for (let i = i0; i <= i1; i++) {
    const u = (i - i0) / (i1 - i0);
    top.push({ x: P[i].x, y: P[i].y - V.h * r * Math.pow(Math.sin(u * Math.PI), 0.6) });
  }
  const g = ctx.createLinearGradient(0, P[i0].y - V.h * r, 0, P[i0].y);
  g.addColorStop(0, shade(colr, 0.25));
  g.addColorStop(1, shade(colr, -0.15));
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(P[i0].x, P[i0].y);
  for (let k = 0; k < top.length; k++) {
    const p = top[k];
    if (k === 0) ctx.lineTo(p.x, p.y);
    else { const q = top[k - 1]; ctx.quadraticCurveTo(q.x, q.y, (q.x + p.x) / 2, (q.y + p.y) / 2); }
  }
  ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
  for (let i = i1; i >= i0; i--) ctx.lineTo(P[i].x, P[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (!fine) return;
  // les longues épines de la voile
  ctx.strokeStyle = shade(colr, -0.4);
  ctx.lineWidth = lw * 0.7;
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) {
    const p = top[i - i0];
    ctx.moveTo(P[i].x, P[i].y);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

function plates(ctx, P, pts, V, full, r, colr, dark, lw) {
  const i0 = Math.round(V.from * (full - 1)), i1 = Math.min(P.length - 1, Math.round(V.to * (full - 1)));
  const list = [];
  for (let k = 0; k < V.n; k++) {
    const u = (k + 0.5) / V.n;
    const fi = i0 + u * (i1 - i0);
    const i = Math.min(P.length - 2, Math.floor(fi)), w = fi - i;
    const x = P[i].x + (P[i + 1].x - P[i].x) * w, y = P[i].y + (P[i + 1].y - P[i].y) * w;
    const d = segDir(pts, i);
    const s = k % 2 ? 1 : -1;
    const h = V.h * r * (0.55 + Math.sin(u * Math.PI) * 0.6);
    list.push({ x: x - d.y * r * 0.07 * s, y: y + d.x * r * 0.07 * s, d, h });
  }
  // de l'arrière vers l'avant de l'écran
  list.sort((p, q) => p.y - q.y);
  for (const q of list) {
    const b = r * 0.17;
    ctx.fillStyle = colr;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(q.x + q.d.x * b, q.y + q.d.y * b);
    ctx.quadraticCurveTo(q.x + q.d.x * b * 0.7, q.y + q.d.y * b * 0.7 - q.h * 0.85, q.x, q.y - q.h);
    ctx.quadraticCurveTo(q.x - q.d.x * b * 0.7, q.y - q.d.y * b * 0.7 - q.h * 0.85, q.x - q.d.x * b, q.y - q.d.y * b);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = shade(colr, -0.25);
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x, q.y - q.h * 0.8);
      ctx.stroke();
    }
  }
}

function studs(ctx, P, V, full, r, colr) {
  const i0 = Math.round(V.from * (full - 1)), i1 = Math.min(P.length - 1, Math.round(V.to * (full - 1)));
  ctx.fillStyle = colr;
  for (let i = i0; i <= i1; i++) {
    for (const k of [0, 0.5]) {
      if (k && i === i1) continue;
      const x = P[i].x + (P[i + 1 < P.length ? i + 1 : i].x - P[i].x) * k, y = P[i].y + (P[i + 1 < P.length ? i + 1 : i].y - P[i].y) * k;
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.05, r * V.s, r * V.s * 0.8, 0, 0, TAU);
      ctx.fill();
    }
  }
}

function armor(ctx, P, pts, widths, V, full, r, col, dark, lw) {
  const i0 = Math.round(V.from * (full - 1)), i1 = Math.min(P.length - 1, Math.round(V.to * (full - 1)));
  for (let i = i0; i <= i1; i++) {
    const d = segDir(pts, i);
    for (const s of [-1, 1]) {
      // les pointes des côtés
      const bx = P[i].x - d.y * widths[i] * 0.9 * s, by = P[i].y + d.x * widths[i] * 0.9 * s;
      cone(ctx, bx, by, bx - d.y * r * V.side * s - d.x * r * 0.05, by + d.x * r * V.side * s - d.y * r * 0.05, r * 0.05, HORN, dark, lw);
    }
    if (!fine) continue;
    for (const u of [-0.5, 0, 0.5]) {
      ctx.fillStyle = shade(col, 0.22);
      ctx.strokeStyle = shade(col, -0.35);
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      ctx.ellipse(P[i].x - d.y * widths[i] * u, P[i].y + d.x * widths[i] * u, r * 0.07, r * 0.055, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function spikes(ctx, P, pts, r, L, dark, lw) {
  const n = P.length;
  for (const [k, s] of [[n - 2, 1], [n - 2, -1], [n - 1, 1], [n - 1, -1]]) {
    const d = segDir(pts, k);
    const bx = P[k].x, by = P[k].y;
    cone(ctx, bx, by, bx - d.y * r * L * s - d.x * r * L * 0.4, by + d.x * r * L * s - d.y * r * L * 0.4 - r * L * 0.35, r * 0.05, HORN, dark, lw);
  }
}

function feathers(ctx, P, pts, widths, n, r, colr) {
  ctx.strokeStyle = colr;
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.05;
  for (let i = 1; i < n; i++) {
    const d = segDir(pts, i);
    for (const s of [-1, 1]) {
      const bx = P[i].x - d.y * widths[i] * 0.8 * s, by = P[i].y + d.x * widths[i] * 0.8 * s;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - d.y * r * 0.14 * s - d.x * r * 0.12, by + d.x * r * 0.14 * s - d.y * r * 0.12);
      ctx.stroke();
    }
  }
}

function arms(ctx, P, pts, widths, full, S, nearPass, col, dark, lw, r, c, t) {
  const A = S.arms;
  const i = Math.min(P.length - 1, Math.round(A.at * (full - 1)));
  const d = segDir(pts, i);
  for (const s of [-1, 1]) {
    const ox = -d.y * s, oy = d.x * s;
    const near = oy > 0.05 || (Math.abs(oy) <= 0.05 && s > 0);
    if (near !== nearPass) continue;
    const sw = Math.sin((c.walk ?? t) * 1.5 + (s > 0 ? 0 : Math.PI)) * 0.15;
    const sx = P[i].x + ox * widths[i] * 0.7, sy = P[i].y + oy * widths[i] * 0.7 + r * 0.1;
    const L = A.len * r;
    const ex = sx + d.x * L * (0.6 + sw) + ox * L * 0.2, ey = sy + d.y * L * (0.6 + sw) + oy * L * 0.2 + L * 0.45;
    ctx.lineCap = 'round';
    ctx.strokeStyle = dark;
    ctx.lineWidth = A.w * r + lw * 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = nearPass ? col : shade(col, -0.2);
    ctx.lineWidth = A.w * r;
    ctx.stroke();
    if (fine) {
      ctx.fillStyle = CLAW;
      for (const k of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.arc(ex + d.x * A.w * r * 0.6 + ox * k * A.w * r * 0.35, ey + d.y * A.w * r * 0.6 + oy * k * A.w * r * 0.35 + A.w * r * 0.2, A.w * r * 0.24, 0, TAU);
        ctx.fill();
      }
    }
  }
}

/* ---------- Caché dans les fougères : on ne voit que deux yeux ---------- */
function drawHidden(ctx, c, t) {
  const r = c.size;
  ctx.fillStyle = 'rgba(0, 25, 15, 0.2)';
  ctx.beginPath();
  ctx.ellipse(c.x + r * 0.2, c.y + r * 0.6, r * 1.5, r * 0.6, 0, 0, TAU);
  ctx.fill();
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + 0.3 + Math.sin(t * 2 + k) * 0.05;
    ctx.strokeStyle = k % 2 ? '#3E7A34' : '#6FA83E';
    ctx.lineWidth = Math.max(1.5, r * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + r * 0.2);
    ctx.quadraticCurveTo(c.x + Math.cos(a) * r * 0.9, c.y + Math.sin(a) * r * 0.5 - r * 0.9, c.x + Math.cos(a) * r * 1.4, c.y + Math.sin(a) * r * 0.7 - r * 0.2);
    ctx.stroke();
  }
  // deux yeux qui clignent, de temps en temps
  if ((t + (c.seed || 0)) % 3 < 2.6) {
    ctx.fillStyle = '#FFF4B8';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(c.x + s * r * 0.22, c.y - r * 0.15, Math.max(1.2, r * 0.11), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(c.x + s * r * 0.22, c.y - r * 0.15, Math.max(0.6, r * 0.05), 0, TAU);
      ctx.fill();
    }
  }
}

/* ============================================================================
   Les mesures de chaque espèce (r = la taille de l'animal ; body : du cou au
   bout de la queue ; head : longueur, largeur, museau)
   ============================================================================ */
const sprawl = (front, back, w, spread = 0.26, stride = 0.24) => [
  { at: front, w, spread, stride, ph: 0, fwd: 0.08, lift: 0.1 },
  { at: back, w: w * 1.1, spread, stride, ph: 1, fwd: 0, lift: 0.1 },
];
const quadLegs = (front, back, w, stride = 0.26) => [
  { at: front, w, spread: 0.06, stride, ph: 0, fwd: 0.05, lift: 0.12 },
  { at: back, w: w * 1.12, spread: 0.06, stride, ph: 1, fwd: 0, lift: 0.12 },
];
const biped = (at, w, stride = 0.42, toes = 3) => [{ at, w, spread: 0.06, stride, lift: 0.2, toes, fwd: 0.12 }];

export const BEASTS = {
  /* ---- Les formes du joueur ---- */
  ichthyostega: {
    spine: { n: 7, gap: 0.34 }, body: [0.34, 0.48, 0.54, 0.5, 0.38, 0.24, 0.1], hip: 0.2, flank: 0.14, sway: 0.12, cadence: 1.6,
    head: { l: 0.66, w: 0.48, snout: 0.75, teeth: 5, eye: [-0.1, 0.55, 0.15] },
    legs: sprawl(0.18, 0.6, 0.15), fins: true, spots: 10,
  },
  hylonomus: {
    spine: { n: 8, gap: 0.32 }, body: [0.2, 0.3, 0.36, 0.36, 0.3, 0.2, 0.12, 0.05], hip: 0.22, flank: 0.13, sway: 0.1, cadence: 1.7,
    head: { l: 0.52, w: 0.28, snout: 0.55, teeth: 3, eye: [-0.08, 0.62, 0.14] },
    legs: sprawl(0.2, 0.58, 0.12, 0.24, 0.28), stripes: true,
  },
  herrerasaure: {
    spine: { n: 9, gap: 0.36 }, body: [0.15, 0.18, 0.34, 0.42, 0.36, 0.26, 0.16, 0.08, 0.03], hip: 0.75, flank: 0.2, cadence: 1.8, sway: 0.05,
    head: { l: 0.62, w: 0.27, snout: 0.6, teeth: 6, brow: true, iris: '#A8541E', eye: [-0.1, 0.62, 0.12] },
    biped: true, legs: biped(0.36, 0.2), arms: { at: 0.15, len: 0.3, w: 0.07 }, stripes: true,
  },
  'allosaure-joueur': {
    spine: { n: 9, gap: 0.37 }, body: [0.22, 0.26, 0.44, 0.5, 0.42, 0.3, 0.18, 0.09, 0.03], hip: 0.8, flank: 0.22, cadence: 1.6, sway: 0.045,
    head: { l: 0.8, w: 0.36, snout: 0.62, teeth: 7, brow: true, iris: '#E8A33A', eye: [-0.12, 0.62, 0.1] },
    biped: true, legs: biped(0.36, 0.24), arms: { at: 0.16, len: 0.3, w: 0.08 }, stripes: true, crest: '#C8553D',
  },
  'trex-joueur': {
    spine: { n: 9, gap: 0.37 }, body: [0.32, 0.38, 0.54, 0.58, 0.48, 0.32, 0.19, 0.09, 0.03], hip: 0.85, flank: 0.24, cadence: 1.4, sway: 0.04,
    head: { l: 0.95, w: 0.5, snout: 0.7, teeth: 8, brow: true, iris: '#FFB02E', eye: [-0.15, 0.6, 0.09] },
    biped: true, legs: biped(0.36, 0.3), arms: { at: 0.18, len: 0.14, w: 0.06 }, stripes: true,
  },

  /* ---- Les animaux ---- */
  dimetrodon: {
    spine: { n: 8, gap: 0.34 }, body: [0.22, 0.34, 0.42, 0.42, 0.32, 0.2, 0.11, 0.04], hip: 0.28, flank: 0.15, cadence: 1.5,
    head: { l: 0.62, w: 0.3, snout: 0.6, teeth: 6, brow: true, iris: '#F2C14E', eye: [-0.12, 0.62, 0.11] },
    legs: sprawl(0.2, 0.58, 0.14, 0.22), sail: { from: 0.14, to: 0.6, h: 1.2 }, sailCol: '#C8553D', spots: 7,
  },
  cynodonte: {
    spine: { n: 6, gap: 0.34 }, body: [0.26, 0.42, 0.46, 0.4, 0.24, 0.1], hip: 0.32, flank: 0.16, sway: 0.1, cadence: 1.9,
    head: { l: 0.48, w: 0.34, snout: 0.6, teeth: 2, eye: [-0.05, 0.55, 0.15] },
    legs: quadLegs(0.15, 0.6, 0.15, 0.3), stripes: true, whiskers: true,
  },
  coelophysis: {
    spine: { n: 9, gap: 0.37 }, body: [0.12, 0.15, 0.3, 0.34, 0.28, 0.2, 0.12, 0.06, 0.02], hip: 0.75, flank: 0.16, cadence: 1.9, sway: 0.05,
    head: { l: 0.6, w: 0.18, snout: 0.45, teeth: 6, brow: true, iris: '#F2C14E', eye: [-0.1, 0.65, 0.14] },
    biped: true, legs: biped(0.36, 0.16, 0.48), arms: { at: 0.14, len: 0.24, w: 0.05 }, stripes: true,
  },
  postosuchus: {
    spine: { n: 9, gap: 0.35 }, body: [0.24, 0.34, 0.44, 0.46, 0.38, 0.26, 0.15, 0.08, 0.03], hip: 0.48, flank: 0.2, cadence: 1.5,
    head: { l: 0.82, w: 0.3, snout: 0.55, teeth: 8, brow: true, iris: '#F2C14E', eye: [-0.15, 0.65, 0.1] },
    legs: quadLegs(0.18, 0.5, 0.18, 0.32), studs: { from: 0.1, to: 0.85, s: 0.06 },
  },
  plateosaure: {
    spine: { n: 10, gap: 0.35 }, body: [0.1, 0.12, 0.14, 0.3, 0.46, 0.46, 0.34, 0.22, 0.11, 0.04], hip: 0.75, flank: 0.22, cadence: 1.4, sway: 0.05,
    head: { l: 0.34, w: 0.17, snout: 0.7, beak: '#C9B27A', eye: [-0.05, 0.62, 0.15] },
    biped: true, legs: biped(0.48, 0.22, 0.34), arms: { at: 0.34, len: 0.34, w: 0.08 }, neck: { n: 4, h: 0.55 }, spots: 6,
  },
  compsognathus: {
    spine: { n: 8, gap: 0.37 }, body: [0.14, 0.3, 0.34, 0.28, 0.18, 0.1, 0.05, 0.02], hip: 0.7, flank: 0.16, cadence: 2.2,
    head: { l: 0.46, w: 0.2, snout: 0.5, teeth: 3, eye: [-0.05, 0.62, 0.17] },
    biped: true, legs: biped(0.28, 0.15, 0.42), arms: { at: 0.1, len: 0.2, w: 0.05 }, stripes: true,
  },
  dryosaure: {
    spine: { n: 9, gap: 0.36 }, body: [0.14, 0.2, 0.38, 0.42, 0.32, 0.2, 0.11, 0.05, 0.02], hip: 0.78, flank: 0.18, cadence: 2,
    head: { l: 0.44, w: 0.2, snout: 0.6, beak: '#C9B27A', eye: [-0.05, 0.62, 0.17] },
    biped: true, legs: biped(0.36, 0.17, 0.48), arms: { at: 0.18, len: 0.2, w: 0.05 }, spots: 8,
  },
  stegosaure: {
    spine: { n: 9, gap: 0.35 }, body: [0.16, 0.3, 0.5, 0.58, 0.52, 0.38, 0.22, 0.11, 0.04], hip: 0.55, flank: 0.24, cadence: 1.3,
    head: { l: 0.34, w: 0.18, snout: 0.7, beak: '#C9B27A', eye: [-0.05, 0.62, 0.17] },
    legs: quadLegs(0.2, 0.52, 0.2, 0.26), plates: { from: 0.12, to: 0.88, n: 11, h: 0.62 }, plateCol: '#D9734E', spikes: 0.55, spots: 5,
  },
  brachiosaure: {
    spine: { n: 12, gap: 0.35 }, body: [0.1, 0.1, 0.11, 0.12, 0.15, 0.3, 0.5, 0.56, 0.44, 0.28, 0.14, 0.05], hip: 0.85, flank: 0.26, sway: 0.03, cadence: 1,
    head: { l: 0.32, w: 0.16, snout: 0.75, eye: [-0.05, 0.62, 0.18] },
    legs: quadLegs(0.48, 0.72, 0.22, 0.24), neck: { n: 6, h: 1.8 }, spots: 6,
  },
  diplodocus: {
    spine: { n: 14, gap: 0.35 }, body: [0.08, 0.09, 0.1, 0.12, 0.18, 0.34, 0.46, 0.44, 0.32, 0.2, 0.13, 0.08, 0.04, 0.02], hip: 0.7, flank: 0.24, sway: 0.07, cadence: 1,
    head: { l: 0.32, w: 0.14, snout: 0.75, eye: [-0.05, 0.62, 0.18] },
    legs: quadLegs(0.38, 0.55, 0.19, 0.22), neck: { n: 5, h: 0.8 }, stripes: true,
  },
  ceratosaure: {
    spine: { n: 9, gap: 0.37 }, body: [0.2, 0.24, 0.42, 0.46, 0.38, 0.27, 0.16, 0.08, 0.03], hip: 0.78, flank: 0.21, cadence: 1.7,
    head: { l: 0.76, w: 0.33, snout: 0.6, teeth: 7, brow: true, iris: '#E8A33A', eye: [-0.12, 0.62, 0.11] },
    biped: true, legs: biped(0.36, 0.23), arms: { at: 0.16, len: 0.24, w: 0.07 }, studs: { from: 0.05, to: 0.9, s: 0.05 }, stripes: true,
    horns: [{ at: 0.82, len: 0.18, w: 0.045, fwd: 0.3, rise: 0.9 }],
  },
  edmontosaure: {
    spine: { n: 10, gap: 0.35 }, body: [0.2, 0.24, 0.42, 0.52, 0.5, 0.38, 0.24, 0.12, 0.05, 0.02], hip: 0.8, flank: 0.22, cadence: 1.5,
    head: { l: 0.7, w: 0.3, snout: 0.95, beak: '#D8C48E', eye: [-0.15, 0.62, 0.13] },
    biped: true, legs: biped(0.42, 0.24, 0.36), arms: { at: 0.2, len: 0.36, w: 0.08 }, stripes: true,
  },
  dakotaraptor: {
    spine: { n: 9, gap: 0.37 }, body: [0.14, 0.18, 0.32, 0.36, 0.28, 0.2, 0.12, 0.06, 0.02], hip: 0.78, flank: 0.17, cadence: 2,
    head: { l: 0.56, w: 0.2, snout: 0.55, teeth: 6, brow: true, iris: '#FFD24A', eye: [-0.08, 0.62, 0.14] },
    biped: true, legs: biped(0.34, 0.17, 0.5), arms: { at: 0.14, len: 0.32, w: 0.06 }, feathers: '#E2574C', stripes: true,
  },
  ankylosaure: {
    spine: { n: 9, gap: 0.33 }, body: [0.3, 0.48, 0.62, 0.68, 0.62, 0.46, 0.26, 0.12, 0.05], hip: 0.38, flank: 0.22, sway: 0.08, cadence: 1.3,
    head: { l: 0.52, w: 0.42, snout: 0.85, beak: '#7A6A4A', eye: [-0.1, 0.58, 0.1] },
    legs: quadLegs(0.18, 0.55, 0.2, 0.2), armor: { from: 0.12, to: 0.72, side: 0.2 }, club: 0.24,
  },
  triceratops: {
    spine: { n: 9, gap: 0.35 }, body: [0.36, 0.44, 0.56, 0.6, 0.52, 0.38, 0.22, 0.11, 0.04], hip: 0.58, flank: 0.24, cadence: 1.4,
    head: { l: 0.88, w: 0.48, snout: 0.45, beak: '#3A2E26', eye: [-0.05, 0.65, 0.11], frill: { r: 1.25, col: '#B88A52', mark: '#C8553D' } },
    legs: quadLegs(0.2, 0.55, 0.22, 0.26), spots: 4,
    horns: [{ at: 0.4, side: 0.5, len: 0.58, w: 0.07, fwd: 0.9, out: 0.12, rise: 0.4 }, { at: 0.98, len: 0.2, w: 0.06, fwd: 0.5, rise: 0.7 }],
  },
  'trex-rival': {
    spine: { n: 9, gap: 0.37 }, body: [0.32, 0.38, 0.54, 0.58, 0.48, 0.32, 0.19, 0.09, 0.03], hip: 0.85, flank: 0.24, cadence: 1.4, sway: 0.04,
    head: { l: 0.95, w: 0.5, snout: 0.7, teeth: 8, brow: true, iris: '#FF6A1E', eye: [-0.15, 0.6, 0.09] },
    biped: true, legs: biped(0.36, 0.3), arms: { at: 0.18, len: 0.14, w: 0.06 }, stripes: true, studs: { from: 0.05, to: 0.6, s: 0.05 },
  },
};

/* Le cadrage des vignettes (fiches « Le savais-tu ? ») */
const FRAME = { r: 0.12, x: 0.68, y: 0.4 };
const FRAME_BIG = { r: 0.075, x: 0.66, y: 0.55 };

function register(look, S) {
  SPINES[look] = S.spine;
  SNOUT[look] = (S.head?.l ?? 0.5) * 0.75 + 0.05;
  FRAMES[look] = S.neck || S.spine.n >= 12 ? FRAME_BIG : FRAME;
}

for (const [id, S] of Object.entries(BEASTS)) {
  const look = `tq-${id}`;
  register(look, S);
  LOOKS[look] = (ctx, c, t) => {
    if (c.buried) { drawHidden(ctx, c, t); return; }
    drawBeast(ctx, { ...c, look }, t, S, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
  };
}

/* ============================================================================
   Le joueur : cinq formes, de la sortie de l'eau au roi de la Terre.
   Ses évolutions se voient (parts = ce qu'il a déjà acheté).
   ============================================================================ */
const B = BEASTS;
const PLAYER_FORMS = {
  'tq-tetrapode': (parts) => ({
    ...B.ichthyostega,
    legs: sprawl(0.18, 0.6, parts.pattes ? 0.19 : 0.15, parts.pattes ? 0.2 : 0.26, parts.pattes ? 0.3 : 0.24),
    hip: parts.pattes ? 0.3 : 0.2,
    body: parts.poumons ? [0.36, 0.52, 0.6, 0.54, 0.4, 0.24, 0.1] : B.ichthyostega.body,
  }),
  'tq-reptile': (parts) => ({
    ...B.hylonomus,
    studs: parts.ecailles ? { from: 0.1, to: 0.8, s: 0.045 } : null,
    legs: sprawl(0.2, 0.58, 0.13, parts['longues-pattes'] ? 0.14 : 0.24, parts['longues-pattes'] ? 0.34 : 0.28),
    hip: parts['longues-pattes'] ? 0.34 : 0.22,
  }),
  'tq-premier-dino': (parts) => ({
    ...B.herrerasaure,
    arms: { at: 0.15, len: parts.griffes ? 0.38 : 0.3, w: parts.griffes ? 0.09 : 0.07 },
    feathers: parts.plumes ? '#F2C14E' : null,
  }),
  'tq-allosaure': (parts) => ({
    ...B['allosaure-joueur'],
    horns: parts.cornes ? [{ at: 0.42, side: 0.5, len: 0.16, w: 0.05, fwd: 0.2, rise: 1 }] : null,
    head: parts.machoire ? { ...B['allosaure-joueur'].head, l: 0.9, w: 0.4 } : B['allosaure-joueur'].head,
  }),
  'tq-trex': (parts) => ({
    ...B['trex-joueur'],
    head: parts.morsure ? { ...B['trex-joueur'].head, l: 1.05, w: 0.56 } : B['trex-joueur'].head,
    studs: parts['peau-epaisse'] ? { from: 0.05, to: 0.9, s: 0.06 } : null,
  }),
};
for (const [form, make] of Object.entries(PLAYER_FORMS)) {
  const S0 = make({});
  register(form, S0);
  FRAMES[form] = FRAME;
  FORM_SPINE[form] = form;
  // (un rival, de ton espèce : le même corps, sans les évolutions)
  LOOKS[form] = (ctx, c, t) => drawBeast(ctx, { ...c, look: form }, t, S0, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const S = make(parts || {});
    drawBeast(ctx, { ...p, look: form, mood, seed: 0 }, t, S, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.32), cute: true, dark: PLAYER.dark,
    });
  };
}

/* ---------- La queue-leurre du lézard : elle gigote toute seule par terre ---------- */
export function drawDecoyTail(ctx, d, t) {
  const r = d.size;
  const col = PLAYER.body;
  const dark = PLAYER.dark || shade(col, -0.55);
  ctx.fillStyle = 'rgba(0, 25, 15, 0.2)';
  ctx.beginPath();
  ctx.ellipse(d.x + r * 0.2, d.y + r * 0.35, r * 1.3, r * 0.35, d.a, 0, TAU);
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

