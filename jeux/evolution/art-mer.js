// ============================================================================
// Les monstres marins (niveau 2, version mer), vus de dessus comme tout
// l'océan : nothosaures, ichthyosaures, plésiosaures au long cou, pliosaures
// à la tête énorme, mosasaures, crocodiles marins, requins, tortues géantes,
// ammonites et bélemnites. Un seul dessinateur pour les reptiles marins : une
// colonne qui ondule (le cou, le corps, la queue), quatre nageoires qui
// battent, et une tête avec ses rangées de dents. Chaque espèce est décrite
// par quelques nombres (en × c.size). Et le décor : les taches de lumière de
// la surface, où l'on remonte respirer.
// ============================================================================

import {
  INK, PLAYER, LOOKS, FORMS, DECORS, FRAMES, FORM_SPINE, SPINES, SNOUT,
  shade, seeded, smoothClosed, spineShape, segDir, shadow, eyes,
} from './art.js';

const TAU = Math.PI * 2;
const TOOTH = '#FBF6E9';

/* Quand un animal est tout petit à l'écran, on saute les détails invisibles */
let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 30;
}

/** La valeur d'un profil (liste de largeurs de la tête à la queue) à la position k (0 → 1) */
function profileAt(prof, k) {
  const x = k * (prof.length - 1);
  const i = Math.min(prof.length - 2, Math.floor(x));
  return prof[i] + (prof[i + 1] - prof[i]) * (x - i);
}

const rot = (a) => ({ x: Math.cos(a), y: Math.sin(a) });

/* ============================================================================
   Les morceaux : nageoires, queue, œil, tête
   ============================================================================ */

/** Une nageoire en forme d'aile, accrochée au flanc, qui rame (stroke de -1 à 1) */
function flipper(ctx, base, fa, s, len, w, stroke, col, dark, lw) {
  const a = fa + s * (Math.PI / 2 + 0.55 + stroke * 0.4);
  const f = rot(fa), d = rot(a);
  const tip = { x: base.x + d.x * len, y: base.y + d.y * len };
  const lead = rot(a - s * 0.3), trail = rot(a + s * 0.35);
  ctx.fillStyle = shade(col, -0.1);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(base.x + f.x * w * 0.5, base.y + f.y * w * 0.5);
  ctx.quadraticCurveTo(base.x + lead.x * len * 0.65, base.y + lead.y * len * 0.65, tip.x, tip.y);
  ctx.quadraticCurveTo(base.x + trail.x * len * 0.5, base.y + trail.y * len * 0.5, base.x - f.x * w * 0.5, base.y - f.y * w * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine) {
    // les os du bord d'attaque
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = Math.max(0.6, w * 0.12);
    ctx.beginPath();
    ctx.moveTo(base.x + f.x * w * 0.3, base.y + f.y * w * 0.3);
    ctx.quadraticCurveTo(base.x + lead.x * len * 0.55, base.y + lead.y * len * 0.55, tip.x, tip.y);
    ctx.stroke();
  }
}

/** Une patte palmée (le nothosaure, avant d'avoir de vraies nageoires) */
function webbedFoot(ctx, base, fa, s, len, w, stroke, col, dark, lw) {
  const a = fa + s * (Math.PI / 2 + 0.2 + stroke * 0.5);
  const d = rot(a);
  const knee = { x: base.x + d.x * len * 0.55, y: base.y + d.y * len * 0.55 };
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = w * 1.25;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(knee.x, knee.y);
  ctx.stroke();
  ctx.strokeStyle = shade(col, -0.08);
  ctx.lineWidth = w;
  ctx.stroke();
  // la palme : quatre doigts reliés par une peau
  const fb = a - s * 0.6;
  ctx.fillStyle = shade(col, 0.1);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(knee.x, knee.y);
  for (let i = 0; i < 4; i++) {
    const t = rot(fb + s * (i * 0.32 - 0.2));
    ctx.lineTo(knee.x + t.x * len * 0.55, knee.y + t.y * len * 0.55);
    const m = rot(fb + s * (i * 0.32 - 0.04));
    if (i < 3) ctx.lineTo(knee.x + m.x * len * 0.38, knee.y + m.y * len * 0.38);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** La nageoire de queue : 'croissant' (ichthyosaure, requin), 'fourche' (gros poissons),
    'pagaie' (mosasaure, crocodile marin). Deux lobes, qui battent de gauche à droite. */
function tailFin(ctx, pts, type, r, t, seed, col, dark, lw, big = 1) {
  const n = pts.length;
  const tail = pts[n - 1], td = segDir(pts, n - 1);
  const ta = Math.atan2(-td.y, -td.x);
  const flap = Math.sin(t * 6 + seed) * 0.22;
  const L = r * (type === 'pagaie' ? 0.6 : 0.8) * big;
  const spread = type === 'pagaie' ? 0.45 : type === 'fourche' ? 0.6 : 0.78;
  const back = rot(ta + flap);
  const notch = { x: tail.x + back.x * L * 0.28, y: tail.y + back.y * L * 0.28 };
  ctx.fillStyle = shade(col, -0.05);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  for (const s of [1, -1]) {
    const tip = rot(ta + s * spread + flap), outer = rot(ta + s * (spread + 0.4) + flap), inner = rot(ta + s * spread * 0.5 + flap);
    ctx.beginPath();
    ctx.moveTo(tail.x - back.x * L * 0.08, tail.y - back.y * L * 0.08);
    ctx.quadraticCurveTo(tail.x + outer.x * L * 0.55, tail.y + outer.y * L * 0.55, tail.x + tip.x * L, tail.y + tip.y * L);
    ctx.quadraticCurveTo(tail.x + inner.x * L * 0.5, tail.y + inner.y * L * 0.5, notch.x, notch.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Un œil de reptile vu de dessus : iris doré, pupille fendue, arcade selon l'humeur */
function reptileEye(ctx, x, y, R, ang, side, mood, blink, iris) {
  if (!fine) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.7, 0, TAU);
    ctx.fill();
    return;
  }
  const open = 1 - (blink || 0) * 0.85;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.5, R * 1.2, ang, 0, TAU);
  ctx.fill();
  ctx.fillStyle = iris;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.6, R * 0.22);
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.15, R * 0.85 * open, ang, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if ((blink || 0) < 0.6) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x, y, R * (mood === 'scared' ? 0.3 : 0.18), R * 0.75 * open, ang, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * R * 0.35, y + Math.sin(ang) * R * 0.35 - R * 0.25, R * 0.22, 0, TAU);
    ctx.fill();
  }
  // l'arcade au-dessus de l'œil (côté extérieur de la tête)
  const nx = -Math.sin(ang) * side, ny = Math.cos(ang) * side;
  const fx = Math.cos(ang), fy = Math.sin(ang);
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, R * 0.45);
  const tilt = mood === 'angry' ? 1 : mood === 'scared' ? -1 : 0;
  ctx.beginPath();
  ctx.moveTo(x + nx * R * 1.1 - fx * R * 1.1 + nx * tilt * R * 0.4, y + ny * R * 1.1 - fy * R * 1.1 + ny * tilt * R * 0.4);
  ctx.lineTo(x + nx * R * 1.1 + fx * R * 1.1 - nx * tilt * R * 0.5, y + ny * R * 1.1 + fy * R * 1.1 - ny * tilt * R * 0.5);
  ctx.stroke();
}

/**
 * La tête vue de dessus, posée au bout du cou (x, y), tournée vers ang.
 * H : { L, W (longueur, largeur, × r), taper (museau plus fin), teeth (taille
 *       des dents, 0 = aucune), eye [x, y] (en part de L, de la demi-largeur),
 *       eyeR, nostril (position des narines), rostrum (museau qui dépasse) }
 */
function marineHead(ctx, x, y, ang, H, r, c, col, dark, lw, o = {}) {
  const L = H.L * r, Wh = H.W * r * 0.5;
  const tp = H.taper ?? 0.5;
  const k = (u) => (u < 0.3 ? 1 : 1 - (1 - tp) * (u - 0.3) / 0.75);
  const f = rot(ang), nrm = { x: -f.y, y: f.x };
  const P = (u, v) => ({ x: x + f.x * u * L + nrm.x * v * Wh, y: y + f.y * u * L + nrm.y * v * Wh });
  const side = [[-0.16, 0.5], [-0.02, 0.9], [0.2, 1], [0.45, 0.86], [0.7, 1], [0.9, 0.95], [1.02, 0.55]];
  const outline = [];
  for (const [u, v] of side) outline.push(P(u, v * (u > 0.3 ? k(u) : 1)));
  outline.push(P(1.08 + (H.rostrum || 0), 0));
  for (let i = side.length - 1; i >= 0; i--) { const [u, v] = side[i]; outline.push(P(u, -v * (u > 0.3 ? k(u) : 1))); }
  const open = c.mouth || 0;
  // les dents du bas, qui dépassent sur les côtés quand la gueule s'ouvre
  if (fine && H.teeth && open > 0.1) {
    ctx.fillStyle = TOOTH;
    for (const s of [1, -1]) {
      for (let i = 0; i < 6; i++) {
        const u = 0.38 + i * 0.11;
        const e = P(u, s * k(u) * (0.95 + open * 0.25));
        const out = { x: nrm.x * s, y: nrm.y * s };
        const tl = r * H.teeth * 1.1;
        ctx.beginPath();
        ctx.moveTo(e.x - f.x * tl * 0.35, e.y - f.y * tl * 0.35);
        ctx.lineTo(e.x + out.x * tl - f.x * tl * 0.2, e.y + out.y * tl - f.y * tl * 0.2);
        ctx.lineTo(e.x + f.x * tl * 0.35, e.y + f.y * tl * 0.35);
        ctx.fill();
      }
    }
  }
  // le crâne
  const g = ctx.createLinearGradient(x, y, x + f.x * L, y + f.y * L);
  g.addColorStop(0, shade(col, 0.05));
  g.addColorStop(1, shade(col, 0.18));
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, outline);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    // l'arête du museau, plus sombre, et les gros muscles des mâchoires
    ctx.strokeStyle = shade(col, -0.18);
    ctx.lineCap = 'round';
    ctx.lineWidth = Wh * 0.35;
    ctx.beginPath();
    ctx.moveTo(P(0, 0).x, P(0, 0).y);
    const e = P(0.85, 0);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    if (H.muscles) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (const s of [1, -1]) {
        const m = P(0.08, s * 0.62);
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, L * 0.16, Wh * 0.32, ang, 0, TAU);
        ctx.fill();
      }
    }
  }
  // la gueule ouverte : on voit l'intérieur, et les crocs du haut
  if (open > 0.1) {
    ctx.fillStyle = '#5E1B28';
    ctx.beginPath();
    const a0 = P(0.3, 0), a1 = P(1.02 + (H.rostrum || 0) * 0.5, 0);
    const w0 = Wh * 0.55 * open;
    ctx.moveTo(a0.x, a0.y);
    ctx.quadraticCurveTo(P(0.65, 0).x + nrm.x * w0, P(0.65, 0).y + nrm.y * w0, a1.x, a1.y);
    ctx.quadraticCurveTo(P(0.65, 0).x - nrm.x * w0, P(0.65, 0).y - nrm.y * w0, a0.x, a0.y);
    ctx.fill();
  }
  // les dents du haut, sur le bord des mâchoires (toujours visibles : ce sont des monstres !)
  if (fine && H.teeth) {
    ctx.fillStyle = TOOTH;
    ctx.strokeStyle = 'rgba(60, 40, 30, 0.45)';
    ctx.lineWidth = Math.max(0.4, lw * 0.4);
    for (const s of [1, -1]) {
      for (let i = 0; i < 7; i++) {
        const u = 0.34 + i * 0.1;
        const e = P(u, s * k(u) * 0.92);
        const tl = r * H.teeth * (i > 4 && H.fangs ? 1.5 : 1);
        ctx.beginPath();
        ctx.moveTo(e.x - f.x * tl * 0.3, e.y - f.y * tl * 0.3);
        ctx.lineTo(e.x + nrm.x * s * tl + f.x * tl * 0.15, e.y + nrm.y * s * tl + f.y * tl * 0.15);
        ctx.lineTo(e.x + f.x * tl * 0.3, e.y + f.y * tl * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  // les narines
  if (fine || o.nostrils) {
    ctx.fillStyle = 'rgba(25, 20, 20, 0.7)';
    const nu = H.nostril ?? 0.86;
    for (const s of [1, -1]) {
      const p = P(nu, s * 0.22 * k(nu));
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r * (o.nostrils ? 0.045 : 0.03), r * 0.02, ang, 0, TAU);
      ctx.fill();
    }
  }
  // les yeux
  const [eu, ev] = H.eye || [0.2, 0.62];
  if (o.cute) {
    eyes(ctx, P(eu, 0).x, P(eu, 0).y, ang, r, 0, ev * Wh / r, Math.min((H.eyeR || 0.1) * 1.6, 0.13), c.mood, c.blink);
  } else {
    for (const s of [1, -1]) {
      const p = P(eu, s * ev);
      reptileEye(ctx, p.x, p.y, r * (H.eyeR || 0.1), ang, s, c.mood, c.blink, H.iris || '#E8B23A');
    }
  }
  if (o.cute) {
    ctx.fillStyle = 'rgba(255, 120, 150, 0.5)';
    for (const s of [1, -1]) {
      const p = P(eu + 0.2, s * ev * 1.05);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r * 0.08, r * 0.05, ang, 0, TAU);
      ctx.fill();
    }
  }
}

/* ============================================================================
   Les reptiles marins
   P : { body (largeurs de la tête à la queue, × r), neck (combien de points de
         cou), flippers [[point, longueur, largeur, phase]], webbed (pattes
         palmées), tail ('croissant' | 'pagaie' | null), dorsal [de, à],
         pattern ('taches' | 'bandes' | 'rayures'), head (voir marineHead) }
   ============================================================================ */
function drawMarine(ctx, c, t, P, col, o = {}) {
  const pts = c.spine;
  if (!pts) return;
  const r = c.size;
  setDetail(ctx, r);
  const n = pts.length;
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.04);
  const widths = pts.map((_, i) => r * profileAt(P.body, i / (n - 1)));
  const mid = pts[Math.floor(n / 2)];
  shadow(ctx, mid.x + r * 0.4, mid.y + r * 0.6, r * (n - 1) * (SPINES[c.look || c.sp.look]?.gap || 0.4) * 0.6, r * 0.6, c.angle);
  // les nageoires (sous le corps) : les deux paires rament l'une après l'autre
  const swim = t * (P.paddle || 3.2) + (c.seed || 0);
  for (const [i, len, w, phase] of P.flippers) {
    const d = segDir(pts, i), fa = Math.atan2(d.y, d.x);
    const stroke = Math.sin(swim + phase);
    for (const s of [-1, 1]) {
      const base = { x: pts[i].x - d.y * widths[i] * 0.75 * s, y: pts[i].y + d.x * widths[i] * 0.75 * s };
      if (o.webbed) webbedFoot(ctx, base, fa, s, r * len, r * w * 0.6, stroke, col, dark, lw);
      else flipper(ctx, base, fa, s, r * len, r * w, stroke, col, dark, lw);
    }
  }
  if (P.tail) tailFin(ctx, pts, P.tail, r, t, c.seed || 0, col, dark, lw, o.bigTail ? 1.25 : 1);
  // le corps
  const head = pts[0], tail = pts[n - 1];
  const g = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
  g.addColorStop(0, shade(col, 0.12));
  g.addColorStop(1, col);
  const outline = spineShape(pts, widths, 0.4);
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, outline);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    // le dos plus sombre que les flancs
    const back = shade(col, -0.16);
    ctx.strokeStyle = back;
    ctx.lineCap = 'round';
    for (let i = 0; i < n - 1; i++) {
      ctx.lineWidth = (widths[i] + widths[i + 1]) * 0.55;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }
    // le motif : taches, bandes ou rayures
    ctx.fillStyle = o.stripe || P.stripeCol || shade(col, -0.35);
    for (let i = 1; i < n - 1; i++) {
      const d = segDir(pts, i), a = Math.atan2(d.y, d.x), w = widths[i];
      if (P.pattern === 'bandes') {
        if (i % 2) continue;
        ctx.beginPath();
        ctx.ellipse(pts[i].x, pts[i].y, r * 0.09, w * 0.85, a, 0, TAU);
        ctx.fill();
      } else if (P.pattern === 'rayures') {
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(pts[i].x - d.y * w * 0.45 * s, pts[i].y + d.x * w * 0.45 * s, r * 0.12, w * 0.12, a, 0, TAU);
          ctx.fill();
        }
      } else if (P.pattern === 'taches') {
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(pts[i].x - d.y * w * 0.5 * s + d.x * r * 0.08 * s, pts[i].y + d.x * w * 0.5 * s + d.y * r * 0.08 * s, Math.max(1, w * 0.13), 0, TAU);
          ctx.fill();
        }
      }
    }
    // un reflet de lumière sur le dos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    for (let i = 1; i < n - 1; i++) {
      const d = segDir(pts, i);
      const x = pts[i].x + d.y * widths[i] * 0.45, y = pts[i].y - d.x * widths[i] * 0.45;
      if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    smoothClosed(ctx, outline);
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.stroke();
  // l'aileron sur le dos (ichthyosaures)
  if (P.dorsal) {
    const [a, b] = P.dorsal;
    const pa = pts[a], pb = pts[b], d = segDir(pts, a);
    ctx.fillStyle = shade(col, -0.3);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(pa.x + d.x * r * 0.15, pa.y + d.y * r * 0.15);
    ctx.quadraticCurveTo(pa.x - d.y * r * 0.14, pa.y + d.x * r * 0.14, pb.x - (pb.x - pa.x) * 0.1, pb.y - (pb.y - pa.y) * 0.1);
    ctx.quadraticCurveTo(pa.x + d.y * r * 0.05, pa.y - d.x * r * 0.05, pa.x + d.x * r * 0.15, pa.y + d.y * r * 0.15);
    ctx.fill();
    ctx.stroke();
  }
  // des plaques d'os (le joueur avec une peau épaisse)
  if (o.scutes) {
    ctx.fillStyle = o.scutes;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.5, lw * 0.6);
    for (let i = P.neck + 1; i < n - 2; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, r * 0.06, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  // la tête, au bout du cou
  const d0 = segDir(pts, 0);
  marineHead(ctx, head.x - d0.x * r * 0.08, head.y - d0.y * r * 0.08, Math.atan2(d0.y, d0.x), o.head || P.head, r, c, col, dark, lw, o);
}

/* ============================================================================
   Les requins (vus de dessus) : museau pointu, grandes nageoires, aileron
   ============================================================================ */
function drawShark(ctx, c, t, S, col) {
  // S : { spines, horns (Hybodus) ; bony (poisson osseux : opercule, œil rond),
  //       jaw 'bouledogue' (crocs qui dépassent) ou 'filtre' (grande bouche ouverte) }
  const pts = c.spine;
  if (!pts) return;
  const r = c.size;
  setDetail(ctx, r);
  const n = pts.length;
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.04);
  const widths = pts.map((_, i) => r * profileAt(S.body || [0.24, 0.42, 0.46, 0.36, 0.22, 0.1], i / (n - 1)));
  const head = pts[0];
  shadow(ctx, head.x + r * 0.35 - Math.cos(c.angle) * r, head.y + r * 0.55 - Math.sin(c.angle) * r, r * 1.6, r * 0.55, c.angle);
  // les nageoires pectorales (de grandes ailes) et les petites du ventre
  const wob = Math.sin(t * 3 + (c.seed || 0)) * 0.15;
  for (const [i, len, w] of S.bony ? [[1, 0.55, 0.22], [3, 0.3, 0.16]] : [[1, 0.85, 0.32], [3, 0.3, 0.16]]) {
    const d = segDir(pts, i), fa = Math.atan2(d.y, d.x);
    for (const s of [-1, 1]) {
      const base = { x: pts[i].x - d.y * widths[i] * 0.7 * s, y: pts[i].y + d.x * widths[i] * 0.7 * s };
      flipper(ctx, base, fa, s, r * len, r * w, 0.35 + wob * s, col, dark, lw);
    }
  }
  tailFin(ctx, pts, S.bony ? 'fourche' : 'croissant', r, t * 1.4, c.seed || 0, col, dark, lw, 1.1);
  // le corps, avec son museau pointu (ou arrondi pour les poissons)
  const outline = spineShape(pts, widths, S.bony ? 0.8 : 1.9);
  const g = ctx.createLinearGradient(head.x, head.y, pts[n - 1].x, pts[n - 1].y);
  g.addColorStop(0, shade(col, 0.1));
  g.addColorStop(1, col);
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, outline);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = shade(col, -0.18);
    ctx.lineCap = 'round';
    for (let i = 0; i < n - 1; i++) {
      ctx.lineWidth = (widths[i] + widths[i + 1]) * 0.5;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }
    // les fentes des branchies (ou l'opercule d'un poisson osseux)
    const d = segDir(pts, 1);
    ctx.strokeStyle = 'rgba(30, 30, 40, 0.45)';
    ctx.lineWidth = Math.max(0.6, r * 0.025);
    if (S.bony) {
      ctx.beginPath();
      ctx.arc(pts[0].x + d.x * r * 0.05, pts[0].y + d.y * r * 0.05, widths[0] * 1.2, Math.atan2(d.y, d.x) + Math.PI * 0.6, Math.atan2(d.y, d.x) + Math.PI * 1.4);
      ctx.stroke();
    }
    for (const s of S.bony ? [] : [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const bx = pts[0].x - d.x * r * (0.28 + k * 0.08) - d.y * widths[1] * 0.75 * s;
        const by = pts[0].y - d.y * r * (0.28 + k * 0.08) + d.x * widths[1] * 0.75 * s;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - d.y * r * 0.1 * s, by + d.x * r * 0.1 * s);
        ctx.stroke();
      }
    }
    ctx.restore();
    smoothClosed(ctx, outline);
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.stroke();
  // l'aileron (et le petit second aileron)
  for (const [i, k] of S.bony ? [[2, 0.8]] : [[2, 1], [4, 0.5]]) {
    const d = segDir(pts, i), p = pts[i];
    ctx.fillStyle = shade(col, -0.35);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(p.x + d.x * r * 0.25 * k, p.y + d.y * r * 0.25 * k);
    ctx.quadraticCurveTo(p.x - d.y * r * 0.1 * k, p.y + d.x * r * 0.1 * k, p.x - d.x * r * 0.5 * k, p.y - d.y * r * 0.5 * k);
    ctx.quadraticCurveTo(p.x + d.y * r * 0.04, p.y - d.x * r * 0.04, p.x + d.x * r * 0.25 * k, p.y + d.y * r * 0.25 * k);
    ctx.fill();
    ctx.stroke();
    if (S.spines && fine) {
      // Hybodus : une épine devant chaque aileron
      ctx.strokeStyle = '#EFE3C6';
      ctx.lineWidth = Math.max(1, r * 0.04 * k);
      ctx.beginPath();
      ctx.moveTo(p.x + d.x * r * 0.3 * k, p.y + d.y * r * 0.3 * k);
      ctx.lineTo(p.x - d.x * r * 0.15 * k, p.y - d.y * r * 0.15 * k);
      ctx.stroke();
    }
  }
  // la gueule : vue de dessus, quand elle s'ouvre, les dents dépassent de chaque côté de la tête
  // (le grand poisson filtreur, lui, nage toujours la bouche grande ouverte)
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  if (S.jaw === 'filtre') {
    const w = widths[0] * 0.9, hx = head.x + fx * r * 0.2, hy = head.y + fy * r * 0.2;
    ctx.fillStyle = '#5E1B28';
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.1, w, c.angle, 0, TAU);
    ctx.fill();
    if (fine) {
      ctx.strokeStyle = 'rgba(240, 230, 210, 0.75)';
      ctx.lineWidth = Math.max(0.6, r * 0.015);
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const v = (i / 8 - 0.5) * 1.6 * w;
        ctx.moveTo(hx - fy * v - fx * r * 0.07, hy + fx * v - fy * r * 0.07);
        ctx.lineTo(hx - fy * v + fx * r * 0.05, hy + fx * v + fy * r * 0.05);
      }
      ctx.stroke();
    }
  } else if ((c.mouth || 0) > 0.15 && fine) {
    ctx.fillStyle = TOOTH;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const k = 0.05 + i * 0.09;
        const ex = head.x + fx * r * k - fy * widths[0] * 0.95 * s, ey = head.y + fy * r * k + fx * widths[0] * 0.95 * s;
        const tl = r * 0.09 * c.mouth;
        ctx.beginPath();
        ctx.moveTo(ex - fx * r * 0.035, ey - fy * r * 0.035);
        ctx.lineTo(ex - fy * tl * s, ey + fx * tl * s);
        ctx.lineTo(ex + fx * r * 0.035, ey + fy * r * 0.035);
        ctx.fill();
      }
    }
  }
  if (S.jaw === 'bouledogue' && fine) {
    // Xiphactinus : deux grands crocs qui dépassent devant
    ctx.fillStyle = TOOTH;
    ctx.strokeStyle = 'rgba(60, 40, 30, 0.5)';
    ctx.lineWidth = Math.max(0.5, lw * 0.5);
    for (const s of [-1, 1]) {
      const bx = head.x + fx * r * 0.12 - fy * widths[0] * 0.5 * s, by = head.y + fy * r * 0.12 + fx * widths[0] * 0.5 * s;
      ctx.beginPath();
      ctx.moveTo(bx - fy * r * 0.04 * s, by + fx * r * 0.04 * s);
      ctx.lineTo(bx + fx * r * 0.22 - fy * r * 0.03 * s, by + fy * r * 0.22 + fx * r * 0.03 * s);
      ctx.lineTo(bx + fy * r * 0.04 * s, by - fx * r * 0.04 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  // les yeux, sur les côtés de la tête (noirs, avec un reflet)
  for (const s of [-1, 1]) {
    const ex = head.x + fx * r * 0.12 - fy * widths[0] * 0.8 * s, ey = head.y + fy * r * 0.12 + fx * widths[0] * 0.8 * s;
    if (S.bony) {
      // un œil de poisson : rond, cerclé de jaune
      ctx.fillStyle = '#E8D27A';
      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.08, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(ex, ey, r * (S.bony ? 0.05 : 0.075), r * 0.05, c.angle, 0, TAU);
    ctx.fill();
    if (fine) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(ex + fx * r * 0.02, ey + fy * r * 0.02 - r * 0.015, r * 0.02, 0, TAU);
      ctx.fill();
      if (c.mood === 'angry') {
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(1, r * 0.035);
        ctx.beginPath();
        ctx.moveTo(ex - fx * r * 0.1 - fy * r * 0.06 * s, ey - fy * r * 0.1 + fx * r * 0.06 * s);
        ctx.lineTo(ex + fx * r * 0.1 - fy * r * 0.02 * s, ey + fy * r * 0.1 + fx * r * 0.02 * s);
        ctx.stroke();
      }
    }
    if (S.horns && fine) {
      // Hybodus : deux petites cornes au-dessus des yeux
      ctx.fillStyle = '#EFE3C6';
      ctx.beginPath();
      ctx.moveTo(ex - fx * r * 0.12, ey - fy * r * 0.12);
      ctx.lineTo(ex - fx * r * 0.28 - fy * r * 0.06 * s, ey - fy * r * 0.28 + fx * r * 0.06 * s);
      ctx.lineTo(ex - fx * r * 0.08 - fy * r * 0.05 * s, ey - fy * r * 0.08 + fx * r * 0.05 * s);
      ctx.fill();
    }
  }
}

/* ============================================================================
   Les tortues de mer : une carapace de cuir, de grandes nageoires avant
   ============================================================================ */
function drawTurtle(ctx, c, t, col) {
  const r = c.size;
  setDetail(ctx, r);
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.04);
  shadow(ctx, c.x + r * 0.4, c.y + r * 0.6, r * 1.3, r * 1.0, c.angle);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  const flap = Math.sin(t * 2.2 + (c.seed || 0));
  // les nageoires : les grandes devant battent ensemble, comme des ailes
  for (const s of [-1, 1]) {
    flipper(ctx, { x: r * 0.35, y: s * r * 0.55 }, 0, s, r * 1.15, r * 0.3, flap * 0.9 - 0.2, col, dark, lw);
    flipper(ctx, { x: -r * 0.6, y: s * r * 0.45 }, 0, s, r * 0.5, r * 0.2, -flap * 0.5 + 0.5, col, dark, lw);
  }
  // la tête, avec son bec crochu
  ctx.fillStyle = shade(col, 0.1);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(r * 1.0, 0, r * 0.32, r * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#D9C27A';
  ctx.beginPath();
  ctx.moveTo(r * 1.22, -r * 0.12);
  ctx.quadraticCurveTo(r * 1.45, 0, r * 1.22, r * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const s of [-1, 1]) reptileEye(ctx, r * 1.05, s * r * 0.17, r * 0.06, 0, s, c.mood, c.blink, '#B07B3A');
  // la carapace (en cuir, avec des arêtes)
  const g = ctx.createRadialGradient(-r * 0.1, -r * 0.2, r * 0.1, 0, 0, r);
  g.addColorStop(0, shade(col, 0.15));
  g.addColorStop(1, shade(col, -0.12));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(r * 0.75, 0);
  ctx.bezierCurveTo(r * 0.7, -r * 0.75, -r * 0.6, -r * 0.8, -r * 1.05, 0);
  ctx.bezierCurveTo(-r * 0.6, r * 0.8, r * 0.7, r * 0.75, r * 0.75, 0);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.strokeStyle = shade(col, -0.3);
    ctx.lineWidth = lw;
    for (const v of [-0.5, -0.25, 0, 0.25, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(r * 0.6, v * r * 0.6);
      ctx.quadraticCurveTo(-r * 0.1, v * r * 1.2, -r * 0.9, v * r * 0.2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ============================================================================
   Ammonites et bélemnites (les cousines d'Ammo !)
   ============================================================================ */
function drawAmmonite(ctx, c, t) {
  const r = c.size;
  setDetail(ctx, r);
  const col = c.sp.color || '#E8C99A';
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.06);
  const f = rot(c.angle);
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.5, r * 0.9, r * 0.7);
  // les tentacules, devant
  ctx.strokeStyle = '#E08A6A';
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.1;
  for (let i = 0; i < 6; i++) {
    const off = (i / 5 - 0.5) * 1.1;
    const sx = c.x + Math.cos(c.angle + off) * r * 0.55, sy = c.y + Math.sin(c.angle + off) * r * 0.55;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let k = 1; k <= 4; k++) {
      const a = c.angle + off * 0.6 + Math.sin(t * 5 + i + k) * 0.25;
      ctx.lineTo(sx + Math.cos(a) * r * 0.16 * k, sy + Math.sin(a) * r * 0.16 * k);
    }
    ctx.stroke();
  }
  // la coquille enroulée
  const cx = c.x - f.x * r * 0.25, cy = c.y - f.y * r * 0.25;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.strokeStyle = shade(col, -0.3);
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = c.angle + i * 0.2;
      const rr = r * 0.08 + r * 0.7 * (i / 60);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // les côtes de la coquille
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
      ctx.lineTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78);
    }
    ctx.stroke();
  }
  eyes(ctx, c.x + f.x * r * 0.4, c.y + f.y * r * 0.4, c.angle, r, 0, 0.32, 0.14, c.mood, c.blink);
}

function drawBelemnite(ctx, c, t) {
  const r = c.size;
  setDetail(ctx, r);
  const col = c.sp.color || '#E39A8E';
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.06);
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.5, r * 1.3, r * 0.4, c.angle);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  // les bras, devant (avec leurs petits crochets)
  ctx.strokeStyle = shade(col, -0.1);
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.09;
  for (let i = 0; i < 8; i++) {
    const v = (i / 7 - 0.5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(r * 0.45, v * r);
    ctx.quadraticCurveTo(r * 0.8, v * r * 1.4 + Math.sin(t * 6 + i) * r * 0.08, r * 1.05, v * r * 1.6);
    ctx.stroke();
  }
  // le corps en torpille, et ses deux nageoires à l'arrière
  ctx.fillStyle = shade(col, -0.05);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  const fl = Math.sin(t * 7 + (c.seed || 0)) * 0.08;
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, 0);
  ctx.lineTo(-r * 0.9, -r * (0.45 + fl));
  ctx.lineTo(-r * 1.05, 0);
  ctx.lineTo(-r * 0.9, r * (0.45 + fl));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, 0, r * 0.75, r * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = shade(col, -0.3);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-r * (0.6 - i * 0.22), (i % 2 ? 0.08 : -0.08) * r, r * 0.05, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
  eyes(ctx, c.x + Math.cos(c.angle) * r * 0.35, c.y + Math.sin(c.angle) * r * 0.35, c.angle, r, 0, 0.24, 0.13, c.mood, c.blink);
}

/* ============================================================================
   Le décor : les taches de lumière de la surface (on y remonte respirer)
   ============================================================================ */
DECORS.surface = (ctx, d, t) => {
  const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
  g.addColorStop(0, 'rgba(255, 255, 235, 0.55)');
  g.addColorStop(0.55, 'rgba(190, 245, 255, 0.3)');
  g.addColorStop(1, 'rgba(190, 245, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, TAU);
  ctx.fill();
  // les vaguelettes de la surface
  ctx.lineWidth = Math.max(1.5, d.r * 0.015);
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.22 + i / 3 + (d.seed % 100) / 100) % 1;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 * (1 - k)})`;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.r * (0.2 + k * 0.6), d.r * (0.17 + k * 0.5), 0, 0, TAU);
    ctx.stroke();
  }
  // les reflets qui scintillent
  if (!d.sparks) {
    const rnd = seeded(d.seed);
    d.sparks = Array.from({ length: 7 }, () => ({ a: rnd() * TAU, k: Math.sqrt(rnd()) * 0.7, ph: rnd() * TAU }));
  }
  ctx.fillStyle = '#FFFFFF';
  for (const s of d.sparks) {
    const tw = Math.max(0, Math.sin(t * 2.5 + s.ph));
    if (tw < 0.2) continue;
    const x = d.x + Math.cos(s.a) * d.r * s.k, y = d.y + Math.sin(s.a) * d.r * s.k;
    const z = d.r * 0.035 * tw;
    ctx.globalAlpha = tw * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y - z * 2);
    ctx.lineTo(x + z * 0.5, y);
    ctx.lineTo(x, y + z * 2);
    ctx.lineTo(x - z * 0.5, y);
    ctx.closePath();
    ctx.moveTo(x - z * 2, y);
    ctx.lineTo(x, y + z * 0.5);
    ctx.lineTo(x + z * 2, y);
    ctx.lineTo(x, y - z * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

/* ============================================================================
   Les espèces
   ============================================================================ */
const MARINE = {
  nothosaure: {
    spine: { n: 10, gap: 0.3 },
    body: [0.15, 0.17, 0.22, 0.32, 0.36, 0.35, 0.28, 0.19, 0.11, 0.04], neck: 2,
    flippers: [[3, 0.55, 0.22, 0], [6, 0.48, 0.2, Math.PI]], tail: null, pattern: 'rayures',
    head: { L: 0.7, W: 0.36, taper: 0.4, teeth: 0.07, fangs: true, eye: [0.18, 0.6], eyeR: 0.07, iris: '#E8C23A' },
  },
  ichthyosaure: {
    spine: { n: 7, gap: 0.42 },
    body: [0.32, 0.47, 0.54, 0.48, 0.34, 0.2, 0.08], neck: 0,
    flippers: [[1, 0.62, 0.26, 0], [4, 0.32, 0.16, 1.4]], tail: 'croissant', dorsal: [2, 3], pattern: 'taches',
    head: { L: 0.95, W: 0.58, taper: 0.2, teeth: 0.035, eye: [0.14, 0.62], eyeR: 0.1, iris: '#9FD3E8' },
  },
  plesiosaure: {
    spine: { n: 13, gap: 0.28 },
    body: [0.12, 0.13, 0.14, 0.16, 0.19, 0.25, 0.42, 0.52, 0.55, 0.5, 0.38, 0.18, 0.05], neck: 5,
    flippers: [[6, 1.0, 0.3, 0], [9, 0.85, 0.28, Math.PI]], tail: null, pattern: 'taches', paddle: 2.4,
    head: { L: 0.5, W: 0.3, taper: 0.45, teeth: 0.05, fangs: true, eye: [0.2, 0.6], eyeR: 0.07, iris: '#E8B23A' },
  },
  elasmosaure: {
    spine: { n: 18, gap: 0.25 },
    body: [0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.18, 0.21, 0.27, 0.44, 0.54, 0.56, 0.5, 0.36, 0.16, 0.05], neck: 10,
    flippers: [[11, 1.0, 0.3, 0], [14, 0.85, 0.28, Math.PI]], tail: null, pattern: 'bandes', paddle: 2.2,
    head: { L: 0.42, W: 0.26, taper: 0.45, teeth: 0.045, fangs: true, eye: [0.2, 0.6], eyeR: 0.065, iris: '#E8B23A' },
  },
  pliosaure: {
    spine: { n: 7, gap: 0.4 },
    body: [0.42, 0.52, 0.6, 0.57, 0.44, 0.26, 0.07], neck: 0,
    flippers: [[2, 0.95, 0.32, 0], [4, 0.85, 0.3, Math.PI]], tail: null, pattern: 'taches', paddle: 2.6,
    head: { L: 1.15, W: 0.78, taper: 0.48, teeth: 0.09, fangs: true, muscles: true, eye: [0.22, 0.55], eyeR: 0.07, nostril: 0.58, iris: '#E8A33A' },
  },
  kronosaure: {
    spine: { n: 7, gap: 0.4 },
    body: [0.44, 0.54, 0.62, 0.58, 0.44, 0.26, 0.07], neck: 0,
    flippers: [[2, 1.0, 0.34, 0], [4, 0.9, 0.32, Math.PI]], tail: null, pattern: 'bandes', paddle: 2.4,
    head: { L: 1.4, W: 0.86, taper: 0.5, teeth: 0.1, fangs: true, muscles: true, eye: [0.2, 0.55], eyeR: 0.065, nostril: 0.55, iris: '#E86A3A' },
  },
  mosasaure: {
    spine: { n: 10, gap: 0.36 },
    body: [0.32, 0.4, 0.45, 0.47, 0.45, 0.4, 0.32, 0.24, 0.16, 0.1], neck: 0,
    flippers: [[1, 0.5, 0.2, 0], [4, 0.42, 0.18, Math.PI]], tail: 'pagaie', pattern: 'bandes',
    head: { L: 1.0, W: 0.62, taper: 0.45, teeth: 0.07, fangs: true, muscles: true, eye: [0.2, 0.6], eyeR: 0.08, iris: '#E8B23A' },
  },
  tylosaure: {
    spine: { n: 10, gap: 0.36 },
    body: [0.3, 0.38, 0.43, 0.45, 0.43, 0.38, 0.3, 0.22, 0.15, 0.09], neck: 0,
    flippers: [[1, 0.5, 0.2, 0], [4, 0.42, 0.18, Math.PI]], tail: 'pagaie', pattern: 'rayures',
    head: { L: 1.05, W: 0.56, taper: 0.4, teeth: 0.065, fangs: true, rostrum: 0.12, eye: [0.2, 0.6], eyeR: 0.075, iris: '#E8C23A' },
  },
  metriorhynque: {
    spine: { n: 9, gap: 0.36 },
    body: [0.22, 0.29, 0.33, 0.33, 0.29, 0.23, 0.17, 0.11, 0.06], neck: 0,
    flippers: [[1, 0.35, 0.14, 0], [4, 0.45, 0.18, Math.PI]], tail: 'pagaie', pattern: 'bandes',
    head: { L: 0.95, W: 0.4, taper: 0.3, teeth: 0.06, fangs: true, eye: [0.2, 0.6], eyeR: 0.08, iris: '#E8C23A' },
  },
};

for (const [id, P] of Object.entries(MARINE)) {
  SPINES[id] = P.spine;
  LOOKS[id] = (ctx, c, t) => drawMarine(ctx, c, t, P, c.sp.color, { stripe: c.sp.stripe });
  SNOUT[id] = P.head.L * 0.9;
  // le cadrage des vignettes : tout l'animal doit tenir dans l'image
  const len = (P.spine.n - 1) * P.spine.gap + P.head.L + (P.tail ? 0.7 : 0.15);
  const r = Math.min(0.2, 0.8 / len);
  FRAMES[id] = { r, x: 0.1 + ((P.spine.n - 1) * P.spine.gap + (P.tail ? 0.6 : 0.1)) * r * 0.94, y: 0.42 + (P.spine.n - 1) * P.spine.gap * r * 0.17 };
}

SPINES.requin = { n: 6, gap: 0.42 };
const SHARKS = {
  requin: {},
  hybodus: { spines: true, horns: true },
  'grand-poisson': { bony: true, jaw: 'bouledogue', body: [0.3, 0.4, 0.42, 0.34, 0.22, 0.1] },
  leedsichthys: { bony: true, jaw: 'filtre', body: [0.4, 0.46, 0.46, 0.38, 0.24, 0.1] },
};
for (const [id, S] of Object.entries(SHARKS)) {
  SPINES[id] = SPINES.requin;
  LOOKS[id] = (ctx, c, t) => drawShark(ctx, c, t, S, c.sp.color);
  SNOUT[id] = 0.75;
  FRAMES[id] = { r: 0.2, x: 0.68, y: 0.42 };
}

LOOKS.tortue = (ctx, c, t) => drawTurtle(ctx, c, t, c.sp.color);
LOOKS.ammonite = drawAmmonite;
LOOKS.belemnite = drawBelemnite;
SNOUT.tortue = 1.2;
FRAMES.tortue = { r: 0.24, x: 0.45, y: 0.52 };
FRAMES.ammonite = { r: 0.28, x: 0.52, y: 0.52 };
FRAMES.belemnite = { r: 0.28, x: 0.55, y: 0.5 };

/* ============================================================================
   Le joueur : nothosaure → ichthyosaure → pliosaure → mosasaure
   (ses couleurs viennent de PLAYER, qui changent à chaque chapitre)
   ============================================================================ */
const PLAYER_FORMS = ['nothosaure', 'ichthyosaure', 'pliosaure', 'mosasaure'];
for (const form of PLAYER_FORMS) {
  const B = MARINE[form];
  FORM_SPINE[form] = form;
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const big = parts.morsure ? 1.12 : parts.machoires ? 1.05 : 1;
    const head = {
      ...B.head, L: B.head.L * big, W: B.head.W * big,
      teeth: B.head.teeth * (parts.dents || parts.morsure ? 1.35 : 1),
      eyeR: B.head.eyeR * (parts['grands-yeux'] ? 1.35 : 1),
    };
    drawMarine(ctx, { ...p, look: form, sp: { kind: 'player' }, mood, seed: 0 }, t, B, PLAYER.body, {
      head, cute: true, stripe: PLAYER.stripe,
      webbed: form === 'nothosaure' && !parts.palmes,
      bigTail: !!parts.nageoire,
      nostrils: !!parts.flair,
      scutes: parts['peau-epaisse'] ? '#E6B85C' : parts.cuir ? shade(PLAYER.body, -0.3) : null,
    });
  };
}
