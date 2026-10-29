// ============================================================================
// Les dinosaures (niveau 2), dessinés de profil avec leurs vraies proportions :
// T. rex, tricératops, stégosaure, brachiosaure, diplodocus, spinosaure,
// raptors, parasaurolophus, ptéranodon… Chaque espèce est décrite par quelques
// nombres (où sont les hanches, la longueur de la queue, la forme du crâne…) ;
// un seul dessinateur par famille fait le reste : les théropodes (sur deux
// pattes), les quadrupèdes (plaques, cornes, armure, becs de canard), les
// sauropodes (long cou) et les ptérosaures (vus de dessus, en vol).
// Repère de profil : tourné vers la droite, (0, 0) = le milieu du corps,
// tout est en × c.size. Le joueur dinosaure utilise les mêmes dessins, avec
// ses propres couleurs (PLAYER, qui changent à chaque chapitre).
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, shade, smoothClosed } from './art.js';
import { SIDE } from './art-terre.js';

const TAU = Math.PI * 2;
const CLAW = '#EDE3CC';

/* Quand un animal est tout petit à l'écran (caméra éloignée), on saute les
   détails invisibles (rayures, dents, griffes, reflets) : le jeu reste fluide. */
let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 34;
}

/* ============================================================================
   Petits outils
   ============================================================================ */
function startSide(ctx, c) {
  const face = c.face || (Math.cos(c.angle) >= 0 ? 1 : -1);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
}

function groundShadow(ctx, x0, x1, y, h) {
  ctx.fillStyle = 'rgba(0, 25, 15, 0.22)';
  ctx.beginPath();
  ctx.ellipse((x0 + x1) / 2, y, Math.abs(x1 - x0) / 2, h, 0, 0, TAU);
  ctx.fill();
}

/** Le genou (ou le coude) d'un membre à deux os, de a vers b. dir = 1 : plié vers l'avant */
function joint(ax, ay, bx, by, l1, l2, dir) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.max(1e-6, Math.min(Math.hypot(dx, dy), (l1 + l2) * 0.999));
  const k = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const a = Math.atan2(dy, dx) - dir * Math.acos(k);
  return { x: ax + Math.cos(a) * l1, y: ay + Math.sin(a) * l1 };
}

/** Une « gélule » : deux cercles reliés par leurs tangentes (un os avec ses muscles) */
function capsule(ctx, x1, y1, r1, x2, y2, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const d = Math.hypot(x2 - x1, y2 - y1) || 1e-6;
  const s = Math.asin(Math.max(-1, Math.min(1, (r1 - r2) / d)));
  const a0 = a + Math.PI / 2 - s;
  ctx.moveTo(x1 + Math.cos(a0) * r1, y1 + Math.sin(a0) * r1);
  ctx.arc(x1, y1, r1, a0, a + Math.PI * 1.5 + s);
  ctx.arc(x2, y2, r2, a - Math.PI / 2 + s, a + Math.PI / 2 - s);
  ctx.closePath();
}

/** Un membre fait de plusieurs os : [x, y, épaisseur] (ou plusieurs chaînes d'os :
    la patte et ses orteils). Le contour d'abord, la couleur par-dessus */
function limb(ctx, segs, col, dark, lw) {
  ctx.beginPath();
  for (const chain of Array.isArray(segs[0][0]) ? segs : [segs]) {
    for (let i = 0; i + 1 < chain.length; i++) {
      const [x1, y1, r1] = chain[i], [x2, y2, r2] = chain[i + 1];
      capsule(ctx, x1, y1, r1, x2, y2, r2);
    }
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 2;
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
}

/** Une griffe recourbée, de (x, y) dans la direction ang */
function claw(ctx, x, y, len, ang, w, col = CLAW) {
  if (!fine) return;
  const cx = Math.cos(ang), cy = Math.sin(ang), nx = -cy, ny = cx;
  ctx.fillStyle = col;
  ctx.strokeStyle = 'rgba(40, 30, 20, 0.6)';
  ctx.lineWidth = Math.max(0.5, w * 0.3);
  ctx.beginPath();
  ctx.moveTo(x + nx * w, y + ny * w);
  ctx.quadraticCurveTo(x + cx * len * 0.7 + nx * w * 0.8, y + cy * len * 0.7 + ny * w * 0.8, x + cx * len + nx * len * 0.25, y + cy * len + ny * len * 0.25);
  ctx.quadraticCurveTo(x + cx * len * 0.4, y + cy * len * 0.4, x - nx * w, y - ny * w);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Le corps d'un seul tenant (queue → hanches → ventre → épaules → cou).
    pts : [x, y, épaisseur au-dessus, épaisseur en dessous], × r */
function bodyPath(ctx, pts, r) {
  const poly = [];
  for (const p of pts) poly.push({ x: p[0] * r, y: (p[1] - p[2]) * r });
  for (let i = pts.length - 1; i >= 0; i--) poly.push({ x: pts[i][0] * r, y: (pts[i][1] + pts[i][3]) * r });
  smoothClosed(ctx, poly);
}

/** La hauteur du dos et du ventre à l'abscisse x (pour poser rayures, plaques, plumes) */
function spineAt(pts, x) {
  if (x <= pts[0][0]) return pts[0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (x <= b[0]) {
      const k = (x - a[0]) / (b[0] - a[0] || 1);
      return [x, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
    }
  }
  return pts[pts.length - 1];
}

/** Dos plus sombre, ventre clair (comme la plupart des animaux) */
function skinFill(ctx, r, top, bottom, col, belly) {
  const g = ctx.createLinearGradient(0, top * r, 0, bottom * r);
  g.addColorStop(0, shade(col, -0.25));
  g.addColorStop(0.42, col);
  g.addColorStop(0.75, belly);
  g.addColorStop(1, belly);
  return g;
}

/** Remplit le corps, pose le motif (rayures, taches) par-dessus, puis le contour */
function paintBody(ctx, pts, r, col, belly, dark, lw, P, stripe) {
  let top = 0, bottom = 0;
  for (const p of pts) { top = Math.min(top, p[1] - p[2]); bottom = Math.max(bottom, p[1] + p[3]); }
  bodyPath(ctx, pts, r);
  ctx.fillStyle = skinFill(ctx, r, top, bottom, col, belly);
  ctx.fill();
  if (!fine) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.clip();
  if (P.stripes || P.spots || P.bands) {
    ctx.fillStyle = stripe;
    if (P.stripes) {
      // des rayures sur le dos, du bout de la queue jusqu'aux épaules
      const x0 = pts[1][0], x1 = pts[pts.length - 3][0];
      const n = P.stripes;
      for (let i = 0; i < n; i++) {
        const x = x0 + (x1 - x0) * (i + 0.5) / n;
        const s = spineAt(pts, x);
        const w = (x1 - x0) / n * 0.32;
        ctx.beginPath();
        ctx.moveTo((x - w) * r, (s[1] - s[2] - 0.05) * r);
        ctx.lineTo((x + w * 1.4) * r, (s[1] - s[2] - 0.05) * r);
        ctx.lineTo((x + w * 0.2) * r, (s[1] + s[3] * 0.1) * r);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (P.spots) {
      for (let i = 0; i < P.spots; i++) {
        const x = pts[2][0] + (pts[pts.length - 3][0] - pts[2][0]) * ((i * 0.618) % 1);
        const s = spineAt(pts, x);
        const y = s[1] - s[2] * (0.25 + ((i * 0.37) % 0.55));
        ctx.beginPath();
        ctx.ellipse(x * r, y * r, s[2] * r * 0.16, s[2] * r * 0.11, 0, 0, TAU);
        ctx.fill();
      }
    }
    if (P.bands) {
      // de grandes bandes claires (diplodocus, ankylosaure)
      ctx.fillStyle = 'rgba(255, 245, 220, 0.18)';
      const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
      for (let i = 0; i < P.bands; i++) {
        const x = x0 + (x1 - x0) * (i + 0.5) / P.bands;
        const s = spineAt(pts, x);
        ctx.beginPath();
        ctx.ellipse(x * r, (s[1] - s[2] * 0.4) * r, (x1 - x0) / P.bands * r * 0.18, s[2] * r * 0.5, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
  // un reflet de lumière sur le dos
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const y = (p[1] - p[2] * 0.72) * r;
    if (i === 1) ctx.moveTo(p[0] * r, y); else ctx.lineTo(p[0] * r, y);
  }
  ctx.stroke();
  ctx.restore();
  bodyPath(ctx, pts, r);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/** Un œil de reptile : iris doré, pupille noire, sourcil selon l'humeur.
    cute = le joueur (un grand œil blanc, plus mignon) */
function dinoEye(ctx, x, y, R, mood, blink, iris, dark, cute) {
  if (!fine && !cute) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.8, 0, TAU);
    ctx.fill();
    return;
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.45, R * 1.25, 0, 0, TAU);
  ctx.fill();
  const open = 1 - (blink || 0) * 0.9;
  ctx.fillStyle = cute ? '#FFFFFF' : iris;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.6, R * 0.22);
  ctx.beginPath();
  ctx.ellipse(x, y, R, R * open, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if ((blink || 0) < 0.6) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    if (cute) ctx.arc(x + R * 0.25, y + R * 0.05, R * (mood === 'scared' ? 0.35 : 0.58), 0, TAU);
    else ctx.ellipse(x + R * 0.12, y, R * (mood === 'scared' ? 0.18 : 0.3), R * 0.82 * open, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x - R * 0.2 + (cute ? R * 0.2 : 0), y - R * 0.35, R * 0.24, 0, TAU);
    ctx.fill();
  }
  // le sourcil : une arcade osseuse au-dessus de l'œil
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, R * 0.5);
  ctx.beginPath();
  if (mood === 'angry') { ctx.moveTo(x - R * 1.4, y - R * 1.45); ctx.lineTo(x + R * 1.3, y - R * 0.7); }
  else if (mood === 'scared') { ctx.moveTo(x - R * 1.2, y - R * 0.95); ctx.lineTo(x + R * 1.1, y - R * 1.6); }
  else { ctx.moveTo(x - R * 1.3, y - R * 1.25); ctx.quadraticCurveTo(x, y - R * 1.6, x + R * 1.2, y - R * 1.15); }
  ctx.stroke();
}

/* ============================================================================
   La tête : un crâne, une mâchoire qui s'ouvre, des dents (ou un bec)
   H : { x, y (la charnière de la mâchoire), L, D (longueur, hauteur),
         tilt (penchée vers le bas), taper (museau plus fin), jaw (épaisseur de
         la mâchoire), eye [x, y] et eyeR (en part de L / D), teeth, beak, bill,
         crest, horn, dome, brow, croc, iris }
   ============================================================================ */
function drawHead(ctx, H, r, c, col, belly, dark, lw, o = {}) {
  const L = H.L * r, D = H.D * r;
  ctx.save();
  ctx.translate(H.x * r, H.y * r);
  ctx.rotate(H.tilt || 0);
  const open = (c.mouth || 0) * (H.gape ?? 0.55);
  const tp = H.taper ?? 0.7;
  const tap = (x) => (x < 0.35 ? 1 : 1 - (1 - tp) * (x - 0.35) / 0.65);
  const P = (x, y) => ({ x: x * L, y: y * D * (y < 0 ? tap(x) : 1) });
  const jd = H.jaw ?? 1;
  const jx = 0.06 * L, jy = 0.05 * D;
  const lowerPts = [[0.02, 0], [0.5, 0.02], [0.95, 0.04], [0.93, 0.16 * jd], [0.6, 0.26 * jd], [0.25, 0.34 * jd], [0.02, 0.3 * jd]];
  const lower = (k) => lowerPts.map(([x, y]) => {
    const px = x * L - jx, py = y * D * (k ? 1 : 1) - 0;
    const a = open;
    return { x: jx + px * Math.cos(a) - py * Math.sin(a), y: jy + px * Math.sin(a) + py * Math.cos(a) };
  });
  const lp = lower(1);
  // l'intérieur de la gueule
  if (open > 0.04) {
    ctx.fillStyle = '#5E1B28';
    ctx.beginPath();
    ctx.moveTo(jx, jy);
    ctx.lineTo(0.97 * L, 0.06 * D);
    ctx.lineTo(lp[2].x, lp[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#C8505F';
    ctx.beginPath();
    ctx.ellipse(lp[1].x * 0.8 + jx * 0.2, lp[1].y - D * 0.04, L * 0.28, D * 0.07, open, 0, TAU);
    ctx.fill();
  }
  // la mâchoire du bas (et ses dents)
  ctx.fillStyle = shade(col, 0.06);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, lp);
  ctx.fill();
  ctx.stroke();
  if (fine && H.teeth && !H.beak && !H.bill && open > 0.04) {
    ctx.fillStyle = '#FBF6E9';
    for (let i = 0; i < 6; i++) {
      const k = 0.32 + i * 0.11;
      const bx = jx + (k * L - jx) * Math.cos(open) - 0.02 * D * Math.sin(open), by = jy + (k * L - jx) * Math.sin(open) + 0.02 * D * Math.cos(open);
      const tl = D * (H.croc ? 0.16 : 0.13);
      ctx.beginPath();
      ctx.moveTo(bx - L * 0.022, by);
      ctx.lineTo(bx + Math.sin(open) * tl, by - Math.cos(open) * tl);
      ctx.lineTo(bx + L * 0.022, by);
      ctx.fill();
    }
  }
  // la crête de l'hadrosaure, derrière le crâne
  if (H.crest === 'tube') {
    ctx.fillStyle = H.crestCol || shade(col, 0.2);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(0.3 * L, -0.85 * D);
    ctx.quadraticCurveTo(-0.6 * L, -1.4 * D, -1.25 * L, -1.15 * D);
    ctx.quadraticCurveTo(-1.35 * L, -0.85 * D, -1.15 * L, -0.8 * D);
    ctx.quadraticCurveTo(-0.5 * L, -0.95 * D, 0.05 * L, -0.45 * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // le crâne
  const skull = [
    P(0.02, 0.1), P(-0.07, -0.3), P(-0.01, -0.78), P(0.18, -1), P(0.42, -0.92),
    P(0.68, -0.72), P(0.9, -0.52), P(1.01, -0.24), P(0.99, 0.05), P(0.6, 0.08), P(0.25, 0.1),
  ];
  if (H.dome) skull[3].y -= D * 0.15;
  const sg = ctx.createLinearGradient(0, -D, 0, D * 0.2);
  sg.addColorStop(0, shade(col, -0.18));
  sg.addColorStop(0.6, col);
  sg.addColorStop(1, belly);
  ctx.fillStyle = sg;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, skull);
  ctx.fill();
  ctx.stroke();
  // le grand trou du crâne devant l'œil (les théropodes en ont un : c'est plus léger)
  if (fine && H.teeth && !H.croc) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0.42 * L, -0.5 * D * tap(0.42));
    ctx.quadraticCurveTo(0.6 * L, -0.62 * D * tap(0.6), 0.74 * L, -0.42 * D * tap(0.74));
    ctx.quadraticCurveTo(0.6 * L, -0.12 * D, 0.42 * L, -0.2 * D);
    ctx.closePath();
    ctx.fill();
  }
  // les muscles de la mâchoire (les grands carnivores)
  if (fine && H.brow) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(0.12 * L, -0.25 * D, 0.14 * L, 0.3 * D, 0.2, 0, TAU);
    ctx.fill();
  }
  // les dents du haut, qui dépassent même gueule fermée
  if (fine && H.teeth && !H.beak && !H.bill) {
    ctx.fillStyle = '#FBF6E9';
    ctx.strokeStyle = 'rgba(60, 40, 30, 0.5)';
    ctx.lineWidth = Math.max(0.4, lw * 0.4);
    const n = H.croc ? 8 : 7;
    for (let i = 0; i < n; i++) {
      const k = 0.3 + i * (0.66 / (n - 1));
      const tl = D * (H.croc ? 0.17 : 0.13) * (H.croc && i > n - 3 ? 1.4 : 1);
      ctx.beginPath();
      ctx.moveTo(k * L - L * 0.024, 0.06 * D);
      ctx.lineTo(k * L + L * 0.006, 0.06 * D + tl);
      ctx.lineTo(k * L + L * 0.024, 0.06 * D);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // la ligne de la bouche
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.6, lw * 0.6);
    ctx.beginPath();
    ctx.moveTo(0.12 * L, 0.07 * D);
    ctx.quadraticCurveTo(0.6 * L, 0.11 * D, 0.92 * L, 0.06 * D);
    ctx.stroke();
  }
  // le bec (herbivores) ou le bec de canard (hadrosaures)
  if (H.beak || H.bill) {
    ctx.fillStyle = H.bill ? shade(col, -0.1) : '#D9B867';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    if (H.bill) {
      ctx.moveTo(0.72 * L, -0.4 * D * tap(0.72));
      ctx.quadraticCurveTo(1.15 * L, -0.42 * D * tap(1), 1.18 * L, -0.05 * D);
      ctx.quadraticCurveTo(1.12 * L, 0.2 * D, 0.75 * L, 0.18 * D);
    } else {
      ctx.moveTo(0.78 * L, -0.42 * D * tap(0.78));
      ctx.quadraticCurveTo(1.1 * L, -0.38 * D * tap(1), 1.08 * L, 0.02 * D + open * L * 0.5);
      ctx.quadraticCurveTo(0.95 * L, 0.18 * D + open * L * 0.4, 0.8 * L, 0.14 * D);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // les narines
  ctx.fillStyle = 'rgba(30, 20, 15, 0.75)';
  ctx.beginPath();
  const nx = H.croc ? 0.6 : 0.87;
  ctx.ellipse(nx * L, -0.42 * D * tap(nx), L * (o.nostrils ? 0.05 : 0.035), D * 0.05, -0.3, 0, TAU);
  ctx.fill();
  // cornes, crêtes, dôme
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, lw * 0.8);
  if (H.crest === 'lacrimal') {
    // les petites cornes rouges devant les yeux (allosaure)
    ctx.fillStyle = H.crestCol || '#C8452D';
    for (const k of [0.36, 0.5]) {
      ctx.beginPath();
      ctx.moveTo((k - 0.07) * L, -0.86 * D * tap(k));
      ctx.lineTo((k - 0.01) * L, -1.18 * D * tap(k));
      ctx.lineTo((k + 0.06) * L, -0.8 * D * tap(k));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  if (H.horn) {
    // une corne sur le nez (cératosaure)
    ctx.fillStyle = '#E9DDBF';
    ctx.beginPath();
    ctx.moveTo(0.7 * L, -0.66 * D * tap(0.7));
    ctx.quadraticCurveTo(0.76 * L, -1.15 * D * tap(0.76), 0.8 * L, -1.1 * D * tap(0.8));
    ctx.lineTo(0.86 * L, -0.56 * D * tap(0.86));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (H.crest === 'feathers') {
    // une huppe de plumes à l'arrière de la tête (raptors)
    ctx.fillStyle = H.crestCol || shade(col, 0.25);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse((-0.05 - i * 0.07) * L, (-0.75 + i * 0.12) * D, L * 0.16, D * 0.09, -0.5 + i * 0.15, 0, TAU);
      ctx.fill();
    }
  }
  if (H.crest === 'sail') {
    // une petite crête sur le museau (spinosaure)
    ctx.fillStyle = H.crestCol || shade(col, 0.15);
    ctx.beginPath();
    ctx.ellipse(0.42 * L, -0.92 * D * tap(0.42), L * 0.1, D * 0.18, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }
  if (H.dome) {
    // le crâne bombé, épais comme un casque, entouré de petites bosses
    ctx.fillStyle = shade(col, 0.22);
    ctx.beginPath();
    ctx.ellipse(0.22 * L, -0.92 * D, 0.36 * L, 0.55 * D, 0, Math.PI, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shade(col, -0.15);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + 0.25 + i * 0.55;
      ctx.beginPath();
      ctx.arc(0.22 * L + Math.cos(a) * 0.33 * L, -0.85 * D + Math.sin(a) * 0.3 * D, D * 0.07, 0, TAU);
      ctx.fill();
    }
  }
  if (fine && H.brow) {
    // des bosses rugueuses au-dessus des yeux (T. rex)
    ctx.fillStyle = shade(col, -0.2);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc((0.22 + i * 0.07) * L, -0.98 * D * tap(0.25) + i * D * 0.02, D * 0.07, 0, TAU);
      ctx.fill();
    }
  }
  // l'œil
  const ex = H.eye[0] * L, ey = H.eye[1] * D;
  dinoEye(ctx, ex, ey, D * H.eyeR * (o.cute ? 1.5 : 1), c.mood, c.blink, H.iris || '#E3A83A', dark, o.cute);
  if (o.cute) {
    ctx.fillStyle = 'rgba(255, 120, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse((H.eye[0] + 0.16) * L, (H.eye[1] + 0.48) * D, L * 0.08, D * 0.08, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Où est le bout de la gueule (pour SIDE), en × taille */
function mouthOf(H) {
  const x = 0.9 * H.L, y = 0.06 * H.D, a = H.tilt || 0;
  return [+(H.x + x * Math.cos(a) - y * Math.sin(a)).toFixed(2), +(H.y + x * Math.sin(a) + y * Math.cos(a)).toFixed(2)];
}

/* ============================================================================
   Les théropodes et les dinosaures à deux pattes
   P : { ground, hip, chest, depth, belly, tail, tailW, tailLift, neck [[x, y], [x, y]],
         neckW, head (voir drawHead), thigh, shin, meta, legW, stride, lift,
         shoulder, arm, armW, fingers, stripes, spots, feathers, sail, sickle, osteo }
   ============================================================================ */
function theroBody(P, sway) {
  const [hx, hy] = P.hip, [cx, cy] = P.chest, d = P.depth, T = P.tail, tw = P.tailW;
  const tail = (k) => hy + (P.tailLift || 0) * k * k + sway * k * k;
  const tf = P.tailFin || 0;   // la queue en pagaie du spinosaure
  return [
    [hx - T, tail(1), 0.012 + tf * 0.3, 0.012 + tf * 0.2],
    [hx - T * 0.78, tail(0.78), tw * 0.24 + tf * 0.55, tw * 0.2 + tf * 0.3],
    [hx - T * 0.52, tail(0.52), tw * 0.5 + tf * 0.5, tw * 0.44 + tf * 0.25],
    [hx - T * 0.26, tail(0.26), tw * 0.8 + tf * 0.2, tw * 0.72],
    [hx, hy, d * 0.86, d * 0.72],
    [(hx + cx) / 2, (hy + cy) / 2, d, d * (P.belly || 1.05)],
    [cx, cy, d * 0.8, d * 0.92],
    [P.neck[0][0], P.neck[0][1], P.neckW * 1.15, P.neckW * 1.3],
    [P.neck[1][0], P.neck[1][1], P.neckW, P.neckW * 0.95],
  ];
}

function theroLeg(ctx, P, r, gy, ph, col, dark, lw, far) {
  const hip = { x: P.hip[0] * r + r * 0.05, y: (P.hip[1] + 0.1) * r };
  const L1 = P.thigh * r, L2 = P.shin * r, L3 = P.meta * r, w = P.legW * r;
  const sw = Math.sin(ph);
  const lift = Math.max(0, Math.cos(ph)) * r * (P.lift ?? 0.16);
  const fx = hip.x + r * (P.foot || 0.08) + sw * P.stride * r, fy = gy * r - lift;
  const ax = fx - L3 * 0.42, ay = fy - L3 * 0.9;
  const k = joint(hip.x, hip.y, ax, ay, L1, L2, 1);
  // la patte et ses orteils, posés au sol, avec leurs griffes
  const toes = [[1.35, 0.28], [1.05, 0.05]];
  limb(ctx, [
    [[hip.x, hip.y, w * 1.55], [k.x, k.y, w * 0.78], [ax, ay, w * 0.5], [fx, fy - w * 0.3, w * 0.38]],
    ...toes.map(([len, dy]) => [[fx, fy - w * 0.3, w * 0.34], [fx + w * len, fy - w * 0.12 - dy * w, w * 0.18]]),
  ], col, dark, lw);
  for (const [len, dy] of toes) claw(ctx, fx + w * len, fy - w * 0.12 - dy * w, w * 0.45, 0.9, w * 0.13);
  if (P.sickle) {
    // la grande griffe en faucille des raptors, relevée
    claw(ctx, fx + w * 0.35, fy - w * 0.55, w * 1.05, -1.1, w * 0.2);
  }
  if (P.feathers && !far) {
    // des plumes sur la cuisse
    ctx.fillStyle = shade(col, 0.15);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(k.x - w * 0.8 - i * w * 0.2, k.y - w * (0.6 + i * 0.5), w * 0.55, w * 0.22, 0.9, 0, TAU);
      ctx.fill();
    }
  }
}

function theroArm(ctx, P, r, t, col, dark, lw, far) {
  if (!P.arm) return;
  const s = { x: P.shoulder[0] * r, y: P.shoulder[1] * r };
  const L = P.arm * r, w = P.armW * r;
  const sw = Math.sin(t * 2.4 + (far ? 1.3 : 0)) * 0.15;
  const e = { x: s.x - Math.sin(0.15 + sw) * L, y: s.y + Math.cos(0.15 + sw) * L };
  const h = { x: e.x + Math.cos(0.45 - sw) * L * 0.9, y: e.y + Math.sin(0.45 - sw) * L * 0.9 };
  if (P.feathers) {
    // les bras couverts de plumes, comme de petites ailes
    ctx.fillStyle = far ? shade(P.featherCol || col, -0.25) : (P.featherCol || shade(col, 0.15));
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.7;
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const bx = e.x + (h.x - e.x) * k, by = e.y + (h.y - e.y) * k;
      ctx.beginPath();
      ctx.ellipse(bx - w * 1.2, by + w * 1.6, w * 0.7, w * 2.1, 0.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  limb(ctx, [[s.x, s.y, w * 1.5], [e.x, e.y, w], [h.x, h.y, w * 0.75]], col, dark, lw);
  for (let i = 0; i < (P.fingers || 3); i++) claw(ctx, h.x + w * 0.3, h.y + (i - 0.5) * w * 0.55, w * 1.5, 0.9 + i * 0.3, w * 0.28);
}

function drawTheropod(ctx, c, t, P, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const belly = o.belly || P.bellyCol || shade(col, 0.42);
  const stripe = o.stripe || P.stripeCol || shade(col, -0.32);
  const dark = shade(col, -0.58);
  const lw = Math.max(0.8, r * 0.032);
  startSide(ctx, c);
  groundShadow(ctx, (P.hip[0] - P.tail * 0.75) * r, (P.head.x + P.head.L * 0.7) * r, P.ground * r, r * 0.17);
  const ph = (c.walk || 0) * (P.cadence || 2.1);
  const bob = Math.abs(Math.cos(ph)) * 0.035;
  ctx.translate(0, -bob * r);
  const gy = P.ground + bob;
  const sway = Math.sin(t * 1.8 + (c.seed || 0)) * 0.06;
  const pts = theroBody(P, sway);
  // la voile du spinosaure, derrière le corps
  if (P.sail) {
    const x0 = P.hip[0] - 0.35, x1 = P.chest[0] + 0.05;
    const g = ctx.createLinearGradient(0, (P.hip[1] - P.depth - P.sail) * r, 0, P.hip[1] * r);
    g.addColorStop(0, P.sailCol || '#D2553C');
    g.addColorStop(1, shade(col, -0.1));
    ctx.fillStyle = g;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      const s = spineAt(pts, x);
      const h = P.sail * Math.sin((i / n) * Math.PI) * (0.85 + (i % 2) * 0.15);
      const y = s[1] - s[2] * 0.6 - h;
      if (i === 0) ctx.moveTo(x * r, (s[1] - s[2] * 0.5) * r);
      ctx.lineTo(x * r, y * r);
    }
    const sEnd = spineAt(pts, x1);
    ctx.lineTo(x1 * r, (sEnd[1] - sEnd[2] * 0.5) * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60, 20, 10, 0.4)';
    ctx.lineWidth = Math.max(0.6, lw * 0.6);
    for (let i = 1; i < n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      const s = spineAt(pts, x);
      const h = P.sail * Math.sin((i / n) * Math.PI) * (0.85 + (i % 2) * 0.15);
      ctx.beginPath();
      ctx.moveTo(x * r, (s[1] - s[2] * 0.6) * r);
      ctx.lineTo(x * r, (s[1] - s[2] * 0.6 - h * 0.95) * r);
      ctx.stroke();
    }
  }
  // un éventail de plumes au bout de la queue
  if (P.feathers) {
    const tip = pts[0], mid = pts[1];
    ctx.fillStyle = P.featherCol || shade(col, 0.15);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.7;
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const x = tip[0] + (mid[0] - tip[0]) * k * 1.4, y = tip[1] + (mid[1] - tip[1]) * k * 1.4;
      ctx.beginPath();
      ctx.ellipse(x * r, (y - 0.03) * r, r * 0.26, r * 0.07, -0.25 + k * 0.1, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  // la patte et le bras du côté caché, plus sombres
  const farCol = shade(col, -0.3);
  theroLeg(ctx, P, r, gy, ph + Math.PI, farCol, dark, lw, true);
  theroArm(ctx, P, r, t, farCol, dark, lw, true);
  paintBody(ctx, pts, r, col, belly, dark, lw, P, stripe);
  // des plumes le long du dos
  if (P.feathers) {
    ctx.fillStyle = P.featherCol || shade(col, 0.12);
    for (let i = 2; i < pts.length - 1; i++) {
      const p = pts[i];
      ctx.beginPath();
      ctx.ellipse((p[0] - 0.08) * r, (p[1] - p[2] * 0.95) * r, r * 0.16, r * 0.05, 0.35, 0, TAU);
      ctx.fill();
    }
  }
  // des bosses d'os le long du dos
  if (P.osteo || o.osteo) {
    ctx.fillStyle = o.osteo ? '#E6B85C' : shade(col, 0.15);
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.6, lw * 0.6);
    for (let i = 3; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      for (const k of [0, 0.5]) {
        const x = p[0] + (q[0] - p[0]) * k, y = p[1] - p[2] + ((q[1] - q[2]) - (p[1] - p[2])) * k;
        ctx.beginPath();
        ctx.arc(x * r, (y + 0.02) * r, r * 0.05, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  const nearCol = shade(col, 0.06);
  theroLeg(ctx, P, r, gy, ph, nearCol, dark, lw, false);
  theroArm(ctx, P, r, t, nearCol, dark, lw, false);
  drawHead(ctx, P.head, r, c, col, belly, dark, lw, o);
  ctx.restore();
}

/* ============================================================================
   Les quadrupèdes : stégosaure, tricératops, ankylosaure, hadrosaures
   ============================================================================ */
function pillarLeg(ctx, top, gy, L1, L2, w, ph, stride, lift, col, dark, lw, dir) {
  const sw = Math.sin(ph);
  const fl = Math.max(0, Math.cos(ph)) * lift;
  const fx = top.x + sw * stride, fy = gy - fl;
  // des os presque droits, comme des colonnes (à peine pliés)
  const reach = Math.hypot(fx - top.x, fy - w * 0.4 - top.y);
  const k = joint(top.x, top.y, fx, fy - w * 0.4, Math.max(L1, reach * 0.52), Math.max(L2, reach * 0.52), dir);
  limb(ctx, [[top.x, top.y, w * 1.4], [k.x, k.y, w * 0.85], [fx, fy - w * 0.62, w * 0.8], [fx + w * 0.1, fy - w * 0.55, w * 0.55]], col, dark, lw);
  // un pied large d'éléphant, posé à plat, avec ses ongles
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(fx - w * 0.85, fy - w * 0.5);
  ctx.quadraticCurveTo(fx - w * 0.95, fy, fx - w * 0.6, fy);
  ctx.lineTo(fx + w * 0.9, fy);
  ctx.quadraticCurveTo(fx + w * 1.05, fy - w * 0.2, fx + w * 0.75, fy - w * 0.5);
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = CLAW;
  ctx.strokeStyle = 'rgba(40, 30, 20, 0.5)';
  ctx.lineWidth = Math.max(0.5, lw * 0.5);
  for (const k2 of [-0.25, 0.3, 0.8]) {
    ctx.beginPath();
    ctx.ellipse(fx + w * k2, fy - w * 0.02, w * 0.17, w * 0.16, 0, Math.PI, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

/** Le dessin des muscles de la cuisse et de l'épaule, sur le flanc */
function muscles(ctx, hip, sh, r, wH, wF, dark) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = Math.max(1, r * 0.025);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(hip.x, hip.y + wH * 0.4, wH * 1.6, Math.PI * 0.95, Math.PI * 1.75);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(sh.x, sh.y + wF * 0.5, wF * 1.4, Math.PI * 1.25, Math.PI * 2.05);
  ctx.stroke();
}

function quadBody(P, sway) {
  const [hx, hy] = P.hip, [sx, sy] = P.shoulder, d = P.depth, T = P.tail, tw = P.tailW;
  const tail = (k) => hy + (P.tailLift || 0) * k + sway * k * k;
  const pts = [
    [hx - T, tail(1), 0.015, 0.015],
    [hx - T * 0.72, tail(0.72), tw * 0.32, tw * 0.28],
    [hx - T * 0.42, tail(0.42), tw * 0.62, tw * 0.55],
    [hx - T * 0.16, tail(0.16), tw * 0.9, tw * 0.85],
    [hx, hy, d * (P.hipTop || 0.95), d * 0.8],
    [(hx + sx) / 2, (hy + sy) / 2 + 0.02, d * (P.midTop || 1), d * (P.belly || 1.1)],
    [sx, sy, d * 0.85, d * 0.95],
  ];
  for (const [x, y, w] of P.neck) pts.push([x, y, w, w * 1.1]);
  return pts;
}

/** Les plaques du stégosaure, plantées le long du dos (row 0 = derrière, 1 = devant) */
function plates(ctx, pts, r, P, dark, lw, row) {
  const x0 = P.hip[0] - P.tail * 0.62, x1 = P.shoulder[0] + 0.25;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const k = (i + row * 0.5) / n;
    const x = x0 + (x1 - x0) * k;
    const s = spineAt(pts, x);
    const h = (0.2 + Math.sin(k * Math.PI) * 0.36) * (row ? 0.9 : 1);
    const y = s[1] - s[2] * 0.55;
    ctx.fillStyle = row ? (P.plateCol || '#D9734E') : shade(P.plateCol || '#D9734E', -0.25);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo((x - h * 0.45) * r, (y + 0.05) * r);
    ctx.quadraticCurveTo((x - h * 0.4) * r, (y - h * 0.8) * r, (x + h * 0.05) * r, (y - h * 1.05) * r);
    ctx.quadraticCurveTo((x + h * 0.45) * r, (y - h * 0.5) * r, (x + h * 0.4) * r, (y + 0.05) * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (row) {
      ctx.strokeStyle = 'rgba(120, 40, 20, 0.35)';
      ctx.lineWidth = Math.max(0.5, lw * 0.6);
      ctx.beginPath();
      ctx.moveTo(x * r, y * r);
      ctx.lineTo((x + h * 0.02) * r, (y - h * 0.8) * r);
      ctx.stroke();
    }
  }
}

function drawQuadruped(ctx, c, t, P, col) {
  const r = c.size;
  setDetail(ctx, r);
  const belly = P.bellyCol || shade(col, 0.38);
  const stripe = P.stripeCol || shade(col, -0.25);
  const dark = shade(col, -0.58);
  const lw = Math.max(0.8, r * 0.03);
  startSide(ctx, c);
  const G = P.ground;
  groundShadow(ctx, (P.hip[0] - P.tail * 0.7) * r, (P.head.x + P.head.L * 0.6) * r, G * r, r * 0.18);
  const ph = (c.walk || 0) * (P.cadence || 1.7);
  const sway = Math.sin(t * 1.4 + (c.seed || 0)) * 0.04;
  const pts = quadBody(P, sway);
  const hipTop = { x: P.hip[0] * r, y: (P.hip[1] + 0.12) * r };
  const shTop = { x: (P.shoulder[0] - 0.05) * r, y: (P.shoulder[1] + 0.15) * r };
  const wH = P.legW * r, wF = P.legW * r * (P.foreW || 0.82);
  const farCol = shade(col, -0.3);
  const stride = (P.stride || 0.3) * r, lift = r * 0.12;
  // côté caché : les plaques de derrière, les pattes
  if (P.plates) { plates(ctx, pts, r, P, dark, lw, 0); plates(ctx, pts, r, P, dark, lw, 1); }
  pillarLeg(ctx, hipTop, G * r, 0, 0, wH, ph + Math.PI, stride, lift, farCol, dark, lw, 1);
  pillarLeg(ctx, shTop, G * r, 0, 0, wF, ph, stride, lift, farCol, dark, lw, -1);
  // côté visible : les pattes sortent de sous le corps
  pillarLeg(ctx, hipTop, G * r, 0, 0, wH, ph, stride, lift, col, dark, lw, 1);
  pillarLeg(ctx, shTop, G * r, 0, 0, wF, ph + Math.PI, stride, lift, col, dark, lw, -1);
  // les pointes de la queue (stégosaure)
  const tip = pts[0], tm = pts[1];
  if (P.thagomizer) {
    ctx.fillStyle = '#EFE3C6';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    for (const [k, a, len] of [[0.25, -2.5, 0.55], [0.55, -2.1, 0.5], [0.3, -0.9, 0.5], [0.6, -1.25, 0.45]]) {
      const x = tip[0] + (tm[0] - tip[0]) * k, y = tip[1] + (tm[1] - tip[1]) * k;
      ctx.beginPath();
      ctx.moveTo((x - 0.05) * r, y * r);
      ctx.lineTo((x + Math.cos(a) * len) * r, (y + Math.sin(a) * len) * r);
      ctx.lineTo((x + 0.05) * r, y * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  paintBody(ctx, pts, r, col, belly, dark, lw, P, stripe);
  muscles(ctx, hipTop, shTop, r, wH, wF, dark);
  if (P.armor) {
    // l'armure : des rangées de plaques d'os, et des pointes sur les flancs
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) {
        const x = P.hip[0] - 0.7 + i * 0.22 + row * 0.1;
        const s = spineAt(pts, x);
        const y = s[1] - s[2] * (0.75 - row * 0.32);
        ctx.fillStyle = shade(col, 0.12 - row * 0.06);
        ctx.strokeStyle = dark;
        ctx.lineWidth = Math.max(0.6, lw * 0.7);
        ctx.beginPath();
        ctx.ellipse(x * r, y * r, r * 0.085, r * 0.06, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#E8DCC0';
    for (let i = 0; i < 7; i++) {
      const x = P.hip[0] - 0.6 + i * 0.27;
      const s = spineAt(pts, x);
      const y = s[1] + s[3] * 0.25;
      ctx.beginPath();
      ctx.moveTo((x - 0.07) * r, (y - 0.05) * r);
      ctx.lineTo((x - 0.02) * r, (y + 0.2) * r);
      ctx.lineTo((x + 0.07) * r, (y - 0.04) * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  if (P.club) {
    // la massue au bout de la queue
    ctx.fillStyle = shade(col, -0.12);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(tip[0] * r, tip[1] * r, r * 0.26, r * 0.17, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse((tip[0] + 0.12) * r, (tip[1] - 0.02) * r, r * 0.18, r * 0.13, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // la collerette du tricératops, derrière la tête
  const H = P.head;
  if (P.frill) {
    ctx.save();
    ctx.translate(H.x * r, H.y * r);
    ctx.rotate(H.tilt || 0);
    const L = H.L * r, D = H.D * r;
    const fx0 = -0.12 * L, fy0 = -1.0 * D, rx = 0.62 * L, ry = 1.3 * D, rot = -0.4;
    const at = (a, k = 1) => ({
      x: fx0 + Math.cos(rot) * rx * k * Math.cos(a) - Math.sin(rot) * ry * k * Math.sin(a),
      y: fy0 + Math.sin(rot) * rx * k * Math.cos(a) + Math.cos(rot) * ry * k * Math.sin(a),
    });
    ctx.fillStyle = shade(col, 0.18);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    for (let i = 0; i < 11; i++) {
      const p = at(-3.0 + i * 0.36);
      ctx.beginPath();
      ctx.arc(p.x, p.y, D * 0.13, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = shade(col, 0.08);
    ctx.beginPath();
    ctx.ellipse(fx0, fy0, rx, ry, rot, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // le motif coloré de la collerette (pour impressionner les rivaux)
    ctx.fillStyle = P.frillCol || '#C8553D';
    ctx.globalAlpha *= 0.75;
    ctx.beginPath();
    ctx.ellipse(fx0 - 0.05 * L, fy0 - 0.1 * D, rx * 0.62, ry * 0.62, rot, 0, TAU);
    ctx.fill();
    ctx.globalAlpha /= 0.75;
    ctx.fillStyle = shade(col, 0.08);
    ctx.beginPath();
    ctx.ellipse(fx0 + 0.02 * L, fy0 + 0.05 * D, rx * 0.36, ry * 0.36, rot, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  drawHead(ctx, H, r, c, col, belly, dark, lw);
  if (P.frill) {
    // les trois cornes
    ctx.save();
    ctx.translate(H.x * r, H.y * r);
    ctx.rotate(H.tilt || 0);
    const L = H.L * r, D = H.D * r;
    ctx.fillStyle = '#EFE3C6';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    for (const [x, y, len, a, w] of [[0.32, -0.95, 1.25, -0.75, 0.09], [0.82, -0.55, 0.45, -1.2, 0.07]]) {
      ctx.beginPath();
      ctx.moveTo((x - w) * L, y * D);
      ctx.quadraticCurveTo((x + Math.cos(a) * len * 0.5) * L, (y + Math.sin(a) * len * 0.5) * D * 1.2 - 0.05 * L, (x + Math.cos(a) * len) * L + 0.1 * L, y * D + Math.sin(a) * len * L);
      ctx.lineTo((x + w) * L, y * D);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  if (P.backHorns) {
    // les petites cornes à l'arrière de la tête (ankylosaure)
    ctx.save();
    ctx.translate(H.x * r, H.y * r);
    ctx.rotate(H.tilt || 0);
    const L = H.L * r, D = H.D * r;
    ctx.fillStyle = '#E8DCC0';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    for (const y of [-0.7, 0.05]) {
      ctx.beginPath();
      ctx.moveTo(0.05 * L, (y - 0.12) * D);
      ctx.lineTo(-0.3 * L, (y + 0.05) * D);
      ctx.lineTo(0.12 * L, (y + 0.15) * D);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ============================================================================
   Les sauropodes : un très long cou, une longue queue, des pattes en colonnes
   ============================================================================ */
function drawSauropod(ctx, c, t, P, col) {
  const r = c.size;
  setDetail(ctx, r);
  const belly = shade(col, 0.32);
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.022);
  startSide(ctx, c);
  const G = P.ground;
  groundShadow(ctx, (P.hip[0] - P.tail * 0.6) * r, (P.shoulder[0] + 0.9) * r, G * r, r * 0.2);
  const ph = (c.walk || 0) * 1.3;
  const sway = Math.sin(t * 1.1 + (c.seed || 0)) * 0.05;
  const nod = Math.sin(t * 0.9 + (c.seed || 0)) * 0.05;
  const neck = P.neck.map(([x, y, w], i) => [x, y + nod * (i / P.neck.length), w]);
  const pts = quadBody({ ...P, neck }, sway);
  const hipTop = { x: P.hip[0] * r, y: (P.hip[1] + 0.2) * r };
  const shTop = { x: P.shoulder[0] * r, y: (P.shoulder[1] + 0.2) * r };
  const w = P.legW * r;
  const farCol = shade(col, -0.28);
  const stride = 0.28 * r, lift = r * 0.1;
  pillarLeg(ctx, hipTop, G * r, 0, 0, w, ph + Math.PI, stride, lift, farCol, dark, lw, 1);
  pillarLeg(ctx, shTop, G * r, 0, 0, w * 0.9, ph, stride, lift, farCol, dark, lw, -1);
  pillarLeg(ctx, hipTop, G * r, 0, 0, w, ph, stride, lift, col, dark, lw, 1);
  pillarLeg(ctx, shTop, G * r, 0, 0, w * 0.9, ph + Math.PI, stride, lift, col, dark, lw, -1);
  paintBody(ctx, pts, r, col, belly, dark, lw, P, shade(col, -0.2));
  muscles(ctx, hipTop, shTop, r, w, w * 0.9, dark);
  const end = neck[neck.length - 1];
  drawHead(ctx, { ...P.head, x: end[0] + P.head.dx, y: end[1] + P.head.dy }, r, c, col, belly, dark, lw);
  if (P.head.arch) {
    // la bosse au-dessus du museau du brachiosaure
    ctx.fillStyle = shade(col, 0.05);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse((end[0] + P.head.dx + P.head.L * 0.45) * r, (end[1] + P.head.dy - P.head.D * 0.85) * r, P.head.L * 0.22 * r, P.head.D * 0.38 * r, 0, Math.PI, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================================
   Les ptérosaures, vus de dessus pendant qu'ils volent (leur ombre au sol)
   ============================================================================ */
function drawPterosaurTop(ctx, c, t, P, col) {
  const r = c.size;
  setDetail(ctx, r);
  const dark = shade(col, -0.5);
  const lw = Math.max(0.8, r * 0.035);
  const big = r > 120;
  // l'ombre, loin en dessous
  ctx.fillStyle = 'rgba(0, 20, 10, 0.18)';
  ctx.beginPath();
  ctx.ellipse(c.x + r * 0.9, c.y + r * 1.3, r * P.span * 0.9, r * 0.35, c.angle, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  const flap = Math.sin(t * (big ? 3 : 7) + (c.seed || 0));
  const span = r * P.span * (0.82 + flap * 0.18);
  // les ailes : une membrane tendue du long doigt jusqu'aux pattes arrière
  for (const s of [-1, 1]) {
    const wx = r * 0.15, wy = s * r * 0.12;
    const elbow = { x: r * 0.35, y: s * span * 0.35 };
    const wrist = { x: r * 0.2, y: s * span * 0.62 };
    const tip = { x: -r * 0.35, y: s * span };
    const g = ctx.createLinearGradient(0, 0, 0, s * span);
    g.addColorStop(0, shade(col, -0.05));
    g.addColorStop(1, P.wingCol || shade(col, 0.15));
    ctx.fillStyle = g;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(elbow.x, elbow.y * 0.9, wrist.x, wrist.y);
    ctx.quadraticCurveTo(r * 0.05, s * span * 0.85, tip.x, tip.y);
    ctx.quadraticCurveTo(-r * 0.35, s * span * 0.5, -r * 0.45, s * r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // le bord d'attaque : les os du bras et du grand doigt
    ctx.strokeStyle = shade(col, -0.3);
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(elbow.x, elbow.y * 0.9, wrist.x, wrist.y);
    ctx.quadraticCurveTo(r * 0.05, s * span * 0.85, tip.x, tip.y);
    ctx.stroke();
    // les petits doigts griffus au poignet
    claw(ctx, wrist.x, wrist.y, r * 0.12, -0.3, r * 0.025);
  }
  // la queue (Rhamphorhynchus : longue, avec une palette au bout)
  if (P.longTail) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.quadraticCurveTo(-r * 1.0, Math.sin(t * 3) * r * 0.15, -r * 1.6, 0);
    ctx.stroke();
    ctx.fillStyle = P.vaneCol || '#E2574C';
    ctx.beginPath();
    ctx.moveTo(-r * 1.5, 0);
    ctx.lineTo(-r * 1.68, -r * 0.16);
    ctx.lineTo(-r * 1.86, 0);
    ctx.lineTo(-r * 1.68, r * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // le corps, couvert d'un fin duvet
  ctx.fillStyle = shade(col, -0.08);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(-r * 0.12, 0, r * 0.42, r * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // le cou et la tête au long bec
  const nl = r * (P.neck || 0.25);
  ctx.strokeStyle = shade(col, -0.05);
  ctx.lineWidth = r * 0.13;
  ctx.beginPath();
  ctx.moveTo(r * 0.2, 0);
  ctx.lineTo(r * 0.2 + nl, 0);
  ctx.stroke();
  const hx = r * 0.22 + nl;
  // la crête
  if (P.crest) {
    ctx.fillStyle = P.crestCol || '#D9534F';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(hx, -r * 0.05);
    ctx.lineTo(hx - r * P.crest, -r * 0.03);
    ctx.lineTo(hx - r * P.crest * 0.9, r * 0.03);
    ctx.lineTo(hx + r * 0.05, r * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = shade(col, 0.1);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(hx, 0, r * 0.13, r * 0.11, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = P.beakCol || '#E3C873';
  ctx.beginPath();
  ctx.moveTo(hx + r * 0.08, -r * 0.07);
  ctx.lineTo(hx + r * P.beak, 0);
  ctx.lineTo(hx + r * 0.08, r * 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // les yeux, de chaque côté de la tête
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#F2C14E';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(0.5, r * 0.012);
    ctx.beginPath();
    ctx.arc(hx + r * 0.03, s * r * 0.08, r * 0.04, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(hx + r * 0.04, s * r * 0.08, r * 0.018, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ============================================================================
   Les espèces (en × taille). Le crâne : voir drawHead.
   ============================================================================ */
const THERO = {
  trex: {
    ground: 1, hip: [-0.38, -0.2], chest: [0.42, -0.05], depth: 0.5, belly: 1.12,
    tail: 2.4, tailW: 0.42, tailLift: 0.05, neck: [[0.68, -0.32], [0.82, -0.48]], neckW: 0.3,
    head: { x: 0.7, y: -0.4, L: 1.2, D: 0.62, tilt: 0.12, taper: 0.82, jaw: 1.25, eye: [0.27, -0.6], eyeR: 0.09, teeth: true, brow: true, iris: '#E8A33A' },
    thigh: 0.6, shin: 0.55, meta: 0.32, legW: 0.2, stride: 0.42, foot: 0.05,
    shoulder: [0.4, 0.12], arm: 0.16, armW: 0.045, fingers: 2, stripes: 9, cadence: 1.9,
  },
  allosaure: {
    ground: 1, hip: [-0.38, -0.15], chest: [0.45, -0.05], depth: 0.42,
    tail: 2.5, tailW: 0.34, tailLift: 0.02, neck: [[0.75, -0.3], [0.92, -0.5]], neckW: 0.22,
    head: { x: 0.82, y: -0.45, L: 1.05, D: 0.44, tilt: 0.12, taper: 0.72, eye: [0.28, -0.55], eyeR: 0.1, teeth: true, crest: 'lacrimal', iris: '#E6B23A' },
    thigh: 0.58, shin: 0.58, meta: 0.34, legW: 0.17, stride: 0.45,
    shoulder: [0.45, 0.1], arm: 0.36, armW: 0.06, fingers: 3, stripes: 11,
  },
  ceratosaure: {
    ground: 1, hip: [-0.38, -0.15], chest: [0.45, -0.05], depth: 0.42,
    tail: 2.6, tailW: 0.36, tailLift: 0.02, neck: [[0.75, -0.3], [0.92, -0.5]], neckW: 0.22,
    head: { x: 0.82, y: -0.45, L: 1.05, D: 0.46, tilt: 0.12, taper: 0.75, eye: [0.27, -0.55], eyeR: 0.1, teeth: true, horn: true, iris: '#E8A33A' },
    thigh: 0.58, shin: 0.56, meta: 0.32, legW: 0.17, stride: 0.45, osteo: true,
    shoulder: [0.45, 0.1], arm: 0.26, armW: 0.06, fingers: 3, stripes: 12,
  },
  coelophysis: {
    ground: 1, hip: [-0.32, -0.1], chest: [0.42, -0.05], depth: 0.3, belly: 0.95,
    tail: 2.6, tailW: 0.22, tailLift: -0.05, neck: [[0.72, -0.35], [0.9, -0.62]], neckW: 0.13,
    head: { x: 0.85, y: -0.6, L: 0.85, D: 0.28, tilt: 0.18, taper: 0.55, eye: [0.25, -0.5], eyeR: 0.14, teeth: true, iris: '#F0C24A' },
    thigh: 0.6, shin: 0.62, meta: 0.4, legW: 0.11, stride: 0.55,
    shoulder: [0.45, 0.06], arm: 0.36, armW: 0.04, fingers: 3, stripes: 10, cadence: 2.4,
  },
  compsognathus: {
    ground: 1, hip: [-0.3, -0.1], chest: [0.4, -0.05], depth: 0.33,
    tail: 2.4, tailW: 0.22, tailLift: -0.08, neck: [[0.68, -0.32], [0.82, -0.56]], neckW: 0.14,
    head: { x: 0.78, y: -0.56, L: 0.7, D: 0.32, tilt: 0.15, taper: 0.6, eye: [0.28, -0.48], eyeR: 0.18, teeth: true, iris: '#F2C14E' },
    thigh: 0.58, shin: 0.6, meta: 0.38, legW: 0.11, stride: 0.55,
    shoulder: [0.42, 0.06], arm: 0.28, armW: 0.04, fingers: 3, stripes: 7, cadence: 2.6,
  },
  dryosaure: {
    ground: 1, hip: [-0.3, -0.12], chest: [0.45, -0.02], depth: 0.38,
    tail: 2.4, tailW: 0.26, tailLift: -0.04, neck: [[0.72, -0.3], [0.85, -0.52]], neckW: 0.15,
    head: { x: 0.8, y: -0.52, L: 0.62, D: 0.34, tilt: 0.2, taper: 0.7, eye: [0.32, -0.48], eyeR: 0.17, beak: true, iris: '#9C6A2E' },
    thigh: 0.6, shin: 0.6, meta: 0.36, legW: 0.13, stride: 0.5,
    shoulder: [0.45, 0.1], arm: 0.26, armW: 0.045, fingers: 3, spots: 9, cadence: 2.4,
  },
  gallimimus: {
    ground: 1, hip: [-0.3, -0.2], chest: [0.42, -0.1], depth: 0.36,
    tail: 2.2, tailW: 0.24, tailLift: -0.05, neck: [[0.72, -0.48], [0.95, -1.05]], neckW: 0.12,
    head: { x: 0.95, y: -1.02, L: 0.55, D: 0.26, tilt: 0.25, taper: 0.5, eye: [0.3, -0.48], eyeR: 0.22, beak: true, iris: '#B07B3A' },
    thigh: 0.6, shin: 0.68, meta: 0.46, legW: 0.12, stride: 0.6,
    shoulder: [0.42, 0.0], arm: 0.34, armW: 0.04, fingers: 3, feathers: true, cadence: 2.5,
  },
  pachycephalosaure: {
    ground: 1, hip: [-0.32, -0.15], chest: [0.45, -0.05], depth: 0.44, belly: 1.12,
    tail: 2.2, tailW: 0.3, tailLift: 0, neck: [[0.72, -0.3], [0.85, -0.48]], neckW: 0.19,
    head: { x: 0.8, y: -0.48, L: 0.68, D: 0.42, tilt: 0.28, taper: 0.7, eye: [0.32, -0.45], eyeR: 0.15, beak: true, dome: true, iris: '#9C6A2E' },
    thigh: 0.58, shin: 0.56, meta: 0.32, legW: 0.16, stride: 0.45,
    shoulder: [0.45, 0.1], arm: 0.22, armW: 0.05, fingers: 3, spots: 10,
  },
  raptor: {
    ground: 1, hip: [-0.32, -0.18], chest: [0.45, -0.08], depth: 0.36,
    tail: 2.6, tailW: 0.24, tailLift: -0.12, neck: [[0.75, -0.38], [0.92, -0.62]], neckW: 0.15,
    head: { x: 0.88, y: -0.6, L: 0.88, D: 0.34, tilt: 0.1, taper: 0.62, eye: [0.27, -0.5], eyeR: 0.15, teeth: true, crest: 'feathers', iris: '#F2C14E' },
    thigh: 0.56, shin: 0.62, meta: 0.36, legW: 0.13, stride: 0.55,
    shoulder: [0.45, 0.04], arm: 0.42, armW: 0.05, fingers: 3, feathers: true, sickle: true, stripes: 8, cadence: 2.4,
  },
  spinosaure: {
    ground: 1, hip: [-0.38, -0.05], chest: [0.48, 0.02], depth: 0.42,
    tail: 2.6, tailW: 0.32, tailLift: 0.1, tailFin: 0.22, neck: [[0.78, -0.25], [0.98, -0.42]], neckW: 0.2,
    head: { x: 0.92, y: -0.38, L: 1.25, D: 0.32, tilt: 0.16, taper: 0.55, jaw: 0.8, eye: [0.24, -0.62], eyeR: 0.13, teeth: true, croc: true, crest: 'sail', iris: '#E8A33A' },
    thigh: 0.48, shin: 0.45, meta: 0.26, legW: 0.17, stride: 0.38,
    shoulder: [0.48, 0.12], arm: 0.38, armW: 0.07, fingers: 3, sail: 1.05, sailCol: '#D2553C', stripes: 10,
  },
};

const QUAD = {
  stegosaure: {
    ground: 0.95, hip: [-0.3, -0.35], shoulder: [0.55, -0.08], depth: 0.5, hipTop: 1.05, midTop: 0.98, belly: 1.15,
    tail: 2.1, tailW: 0.32, tailLift: 0.25,
    neck: [[0.95, 0.05, 0.22], [1.2, 0.2, 0.16]],
    head: { x: 1.15, y: 0.18, L: 0.52, D: 0.24, tilt: 0.35, taper: 0.7, eye: [0.35, -0.42], eyeR: 0.18, beak: true, iris: '#7A5226' },
    legW: 0.2, foreW: 0.75, stride: 0.28, plates: true, plateCol: '#D9734E', thagomizer: true, spots: 8,
  },
  triceratops: {
    ground: 0.95, hip: [-0.4, -0.2], shoulder: [0.5, -0.1], depth: 0.55, belly: 1.12,
    tail: 1.6, tailW: 0.32, tailLift: 0.18,
    neck: [[0.85, -0.02, 0.32], [1.0, 0.05, 0.28]],
    head: { x: 0.92, y: 0.0, L: 0.8, D: 0.5, tilt: 0.12, taper: 0.7, eye: [0.38, -0.5], eyeR: 0.12, beak: true, iris: '#7A5226' },
    legW: 0.24, foreW: 0.85, stride: 0.26, frill: true, frillCol: '#C8553D', spots: 10,
  },
  ankylosaure: {
    ground: 0.9, hip: [-0.38, -0.08], shoulder: [0.52, -0.02], depth: 0.45, hipTop: 1.05, belly: 1.0,
    tail: 1.75, tailW: 0.24, tailLift: 0.05,
    neck: [[0.85, 0.05, 0.25], [1.0, 0.1, 0.22]],
    head: { x: 0.95, y: 0.08, L: 0.55, D: 0.36, tilt: 0.12, taper: 0.8, eye: [0.38, -0.42], eyeR: 0.14, beak: true, iris: '#7A5226' },
    legW: 0.2, foreW: 0.9, stride: 0.22, armor: true, club: true, backHorns: true,
  },
  edmontosaure: {
    ground: 1, hip: [-0.3, -0.3], shoulder: [0.55, -0.1], depth: 0.45, belly: 1.1,
    tail: 2.3, tailW: 0.32, tailLift: 0.1,
    neck: [[0.85, -0.22, 0.22], [1.08, -0.3, 0.17]],
    head: { x: 1.05, y: -0.32, L: 0.72, D: 0.32, tilt: 0.42, taper: 0.62, eye: [0.28, -0.5], eyeR: 0.15, bill: true, iris: '#7A5226' },
    legW: 0.19, foreW: 0.6, stride: 0.3, stripes: 9, cadence: 1.9,
  },
  parasaurolophus: {
    ground: 1, hip: [-0.3, -0.3], shoulder: [0.55, -0.1], depth: 0.45, belly: 1.1,
    tail: 2.3, tailW: 0.32, tailLift: 0.1,
    neck: [[0.85, -0.22, 0.22], [1.08, -0.32, 0.17]],
    head: { x: 1.05, y: -0.34, L: 0.66, D: 0.32, tilt: 0.42, taper: 0.65, eye: [0.3, -0.5], eyeR: 0.15, bill: true, crest: 'tube', crestCol: '#D27D3D', iris: '#7A5226' },
    legW: 0.19, foreW: 0.6, stride: 0.3, stripes: 9, cadence: 1.9,
  },
};

const SAURO = {
  brachiosaure: {
    ground: 1.1, hip: [-0.5, -0.32], shoulder: [0.5, -0.55], depth: 0.7, belly: 1.0, midTop: 1.0,
    tail: 1.9, tailW: 0.3, tailLift: 0.35,
    neck: [[0.95, -0.95, 0.3], [1.25, -1.5, 0.22], [1.45, -1.95, 0.17]],
    head: { dx: -0.05, dy: 0.02, L: 0.42, D: 0.22, tilt: 0.2, taper: 0.8, eye: [0.32, -0.55], eyeR: 0.2, beak: false, arch: true, iris: '#7A5226' },
    legW: 0.3, spots: 10,
  },
  diplodocus: {
    ground: 1, hip: [-0.4, -0.45], shoulder: [0.55, -0.25], depth: 0.55, belly: 1.0,
    tail: 3.4, tailW: 0.3, tailLift: 0.25,
    neck: [[1.1, -0.5, 0.26], [1.75, -0.78, 0.18], [2.3, -0.92, 0.13]],
    head: { dx: -0.03, dy: 0.04, L: 0.42, D: 0.18, tilt: 0.25, taper: 0.75, eye: [0.32, -0.55], eyeR: 0.22, beak: false, iris: '#7A5226' },
    legW: 0.27, bands: 7,
  },
};

const PTERO = {
  rhamphorhynchus: { span: 1.6, beak: 0.6, neck: 0.18, longTail: true, vaneCol: '#E2574C' },
  pteranodon: { span: 2.3, beak: 0.85, neck: 0.22, crest: 0.6, crestCol: '#D9534F' },
  quetzalcoatlus: { span: 2.4, beak: 0.95, neck: 0.55, crest: 0.25, crestCol: '#E07B39' },
};

/* ---------- Les looks, la position de la gueule, le cadrage des vignettes ---------- */
for (const [id, P] of Object.entries(THERO)) {
  LOOKS[id] = (ctx, c, t) => drawTheropod(ctx, c, t, P, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
  SIDE[id] = mouthOf(P.head);
  FRAMES[id] = { r: 0.16, x: 0.58, y: P.head.y < -0.8 ? 0.6 : 0.55 };
}
for (const [id, P] of Object.entries(QUAD)) {
  LOOKS[id] = (ctx, c, t) => drawQuadruped(ctx, c, t, P, c.sp.color);
  SIDE[id] = mouthOf(P.head);
  FRAMES[id] = { r: 0.17, x: 0.55, y: 0.56 };
}
for (const [id, P] of Object.entries(SAURO)) {
  LOOKS[id] = (ctx, c, t) => drawSauropod(ctx, c, t, P, c.sp.color);
  const end = P.neck[P.neck.length - 1];
  SIDE[id] = mouthOf({ ...P.head, x: end[0] + P.head.dx, y: end[1] + P.head.dy });
}
FRAMES.brachiosaure = { r: 0.14, x: 0.5, y: 0.7 };
FRAMES.diplodocus = { r: 0.12, x: 0.52, y: 0.62 };
for (const [id, P] of Object.entries(PTERO)) {
  LOOKS[id] = (ctx, c, t) => drawPterosaurTop(ctx, c, t, P, c.sp.color);
  FRAMES[id] = { r: id === 'rhamphorhynchus' ? 0.2 : 0.17, x: 0.55, y: 0.5 };
}

/* ============================================================================
   Le joueur dinosaure : trois silhouettes, de plus en plus grandes
   (dino = un des premiers dinosaures du Trias ; grand-dino = un grand chasseur
   du Jurassique ; tyran = un tyrannosaure). Les couleurs viennent de PLAYER.
   ============================================================================ */
const PLAYER_BUILD = {
  dino: {
    ...THERO.coelophysis, depth: 0.34, neckW: 0.15,
    head: { ...THERO.coelophysis.head, L: 0.8, D: 0.34, taper: 0.65, eyeR: 0.17 },
    legW: 0.13, stripes: 8,
  },
  'grand-dino': {
    ...THERO.allosaure,
    head: { ...THERO.allosaure.head, crest: 'lacrimal', crestCol: '#F2C14E', eyeR: 0.13 },
    stripes: 9,
  },
  tyran: { ...THERO.trex, head: { ...THERO.trex.head, eyeR: 0.1 }, stripes: 8 },
};

for (const [form, B] of Object.entries(PLAYER_BUILD)) {
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const P = { ...B, arm: B.arm * (parts.griffes ? 1.15 : 1) };
    const big = !!parts.morsure;
    P.head = { ...B.head, teeth: true, L: B.head.L * (big ? 1.1 : 1), D: B.head.D * (big ? 1.12 : 1), jaw: (B.head.jaw || 1) * (big ? 1.15 : 1) };
    drawTheropod(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, P, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.3),
      nostrils: !!parts.flair, osteo: !!parts['peau-epaisse'], cute: true,
    });
    if (parts.cerveau) {
      // une petite étincelle au-dessus de la tête : c'est un malin !
      const k = 0.6 + Math.sin(t * 3) * 0.4;
      const face = p.face || (Math.cos(p.angle) >= 0 ? 1 : -1);
      const hx = P.head.x + P.head.L * 0.3, hy = P.head.y - P.head.D * 1.6;
      ctx.fillStyle = `rgba(255, 240, 150, ${0.75 * k})`;
      ctx.beginPath();
      ctx.arc(p.x + face * p.size * hx, p.y + p.size * hy, p.size * 0.08, 0, TAU);
      ctx.fill();
    }
  };
  SIDE[form] = mouthOf(B.head);
  FORM_SPINE[form] = null;
  FRAMES[form] = { r: 0.16, x: 0.58, y: 0.55 };
}
