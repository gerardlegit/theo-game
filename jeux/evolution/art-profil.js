// ============================================================================
// Évolution — les dessins DE PROFIL des intros et des scènes de fin.
// (Dans les niveaux, les animaux sont vus de dessus : art-dessus.js.)
// Ici : la musaraigne de l'intro des mammifères, le louveteau et les loups de
// l'intro du loup, le défilé des races de chiens et les humains autour du feu,
// à la fin du niveau du loup.
// Chaque animal est décrit par quelques nombres (hanches, épaules, tête,
// pattes, queue, fourrure) ; un seul dessinateur fait le reste. Repère de
// profil : tourné vers la droite, (0, 0) = le milieu du corps, tout est en
// × c.size.
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FORM_SPINE, shade, smoothClosed } from './art.js';

const TAU = Math.PI * 2;

/* Quand un animal est tout petit à l'écran, on saute les détails invisibles */
let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 34;
}
const isFine = () => fine;

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
  if (P.spots) {
    // des taches (le dalmatien)
    ctx.fillStyle = stripe;
    {
      for (let i = 0; i < P.spots; i++) {
        const x = pts[2][0] + (pts[pts.length - 3][0] - pts[2][0]) * ((i * 0.618) % 1);
        const s = spineAt(pts, x);
        const y = s[1] - s[2] * (0.25 + ((i * 0.37) % 0.55));
        ctx.beginPath();
        ctx.ellipse(x * r, y * r, s[2] * r * 0.16, s[2] * r * 0.11, 0, 0, TAU);
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

/* ============================================================================
   Les mammifères de profil
   ============================================================================ */
/** Un point d'une courbe de Bézier cubique */
function bez(p0, p1, p2, p3, k) {
  const u = 1 - k;
  return {
    x: u * u * u * p0.x + 3 * u * u * k * p1.x + 3 * u * k * k * p2.x + k * k * k * p3.x,
    y: u * u * u * p0.y + 3 * u * u * k * p1.y + 3 * u * k * k * p2.y + k * k * k * p3.y,
  };
}

/** Une forme effilée le long d'une courbe (la queue) :
    demi-largeur w0 à la base, w1 au bout. Prépare le chemin, sans le remplir. */
function taper(ctx, p0, p1, p2, p3, w0, w1, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(bez(p0, p1, p2, p3, i / n));
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const w = w0 + (w1 - w0) * (i / n);
    L.push({ x: pts[i].x - dy / d * w, y: pts[i].y + dx / d * w });
    R.push({ x: pts[i].x + dy / d * w, y: pts[i].y - dx / d * w });
  }
  const e = pts[n], f = pts[n - 1];
  ctx.beginPath();
  ctx.moveTo(L[0].x, L[0].y);
  for (let i = 1; i <= n; i++) ctx.lineTo(L[i].x, L[i].y);
  ctx.quadraticCurveTo(e.x + (e.x - f.x) * 0.9, e.y + (e.y - f.y) * 0.9, R[n].x, R[n].y);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
  ctx.closePath();
  return pts;
}

const add = (p, x, y) => ({ x: p.x + x, y: p.y + y });

/** Un œil de mammifère : rond et sombre. cute = le joueur (un grand œil blanc, plus mignon) */
function mamEye(ctx, x, y, R, mood, blink, iris, dark, cute) {
  if (!isFine() && !cute) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.8, 0, TAU);
    ctx.fill();
    return;
  }
  const open = 1 - (blink || 0) * 0.9;
  ctx.fillStyle = cute ? '#FFFFFF' : iris;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.6, R * 0.2);
  ctx.beginPath();
  ctx.ellipse(x, y, R, R * open, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if ((blink || 0) < 0.6) {
    const pr = R * (mood === 'scared' ? 0.36 : cute ? 0.6 : 0.52);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x + R * (cute ? 0.25 : 0.12), y + R * 0.05, pr, pr * open, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(x - R * 0.1 + (cute ? R * 0.2 : 0), y - R * 0.3, R * 0.24, 0, TAU);
    ctx.fill();
  }
  // le sourcil dit l'humeur (calme : seulement chez le joueur)
  if (mood !== 'angry' && mood !== 'scared' && !cute) return;
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, R * 0.42);
  ctx.beginPath();
  if (mood === 'angry') { ctx.moveTo(x - R * 1.3, y - R * 1.5); ctx.lineTo(x + R * 1.2, y - R * 0.8); }
  else if (mood === 'scared') { ctx.moveTo(x - R * 1.1, y - R * 1.0); ctx.lineTo(x + R * 1.0, y - R * 1.6); }
  else { ctx.moveTo(x - R * 1.2, y - R * 1.3); ctx.quadraticCurveTo(x, y - R * 1.65, x + R * 1.1, y - R * 1.25); }
  ctx.stroke();
}

/* ============================================================================
   La tête d'un mammifère
   H : { x, y (le milieu du crâne), L (longueur, du crâne au museau), D (hauteur),
         tilt, snout (hauteur du museau : 0,3 pointu → 0,9 carré), jaw, gape,
         eye [x, y] et eyeR (en part de L / D), iris, teeth, ear ('pointe',
         'rond', 'tombante' = qui pend, comme chez les chiens) et earR, earCol,
         noseCol, dome (front bombé), muzzle }
   ============================================================================ */
function ear(ctx, H, L, D, col, dark, lw, far) {
  const k = H.earR || 1;
  const ox = far ? -0.07 * L : 0, oy = far ? -0.04 * D : 0;
  const inner = H.earIn || '#E2A39A';
  if (H.earCol) col = H.earCol;
  ctx.fillStyle = far ? shade(col, -0.28) : col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  const bx = -0.1 * L + ox, by = -0.4 * D + oy;
  if (H.ear === 'pointe') {
    const thin = 1;
    ctx.moveTo(bx - 0.11 * L * thin, by + 0.04 * D);
    ctx.quadraticCurveTo(bx - 0.15 * L * thin, by - 0.42 * D * k, bx - 0.04 * L, by - 0.62 * D * k);
    ctx.quadraticCurveTo(bx + 0.08 * L * thin, by - 0.32 * D * k, bx + 0.12 * L * thin, by - 0.02 * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (!far && isFine()) {
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.moveTo(bx - 0.05 * L * thin, by - 0.02 * D);
      ctx.quadraticCurveTo(bx - 0.07 * L * thin, by - 0.32 * D * k, bx - 0.035 * L, by - 0.45 * D * k);
      ctx.quadraticCurveTo(bx + 0.03 * L * thin, by - 0.25 * D * k, bx + 0.06 * L * thin, by - 0.02 * D);
      ctx.closePath();
      ctx.fill();
    }
  } else if (H.ear === 'tombante') {
    // une oreille molle qui pend le long de la tête (les chiens)
    ctx.moveTo(bx - 0.1 * L, by + 0.02 * D);
    ctx.quadraticCurveTo(bx - 0.28 * L, by + 0.3 * D * k, bx - 0.16 * L, by + 0.66 * D * k);
    ctx.quadraticCurveTo(bx + 0.02 * L, by + 0.55 * D * k, bx + 0.1 * L, by + 0.02 * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // ronde (la musaraigne)
    const R = 0.2 * D * k;
    ctx.arc(bx, by - R * 0.5, R, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (!far && isFine()) {
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(bx + R * 0.1, by - R * 0.4, R * 0.55, 0, TAU);
      ctx.fill();
    }
  }
}

function drawMamHead(ctx, H, r, c, col, belly, dark, lw, o = {}) {
  const L = H.L * r, D = H.D * r;
  const fine = isFine();
  const sn = H.snout ?? 0.5;
  const top = -0.5 * sn;                  // le dessus du museau (en × D)
  const P = (x, y) => ({ x: x * L, y: y * D });
  ctx.save();
  ctx.translate(H.x * r, H.y * r);
  ctx.rotate(H.tilt || 0);
  const open = (c.mouth || 0) * (H.gape ?? 0.45);
  // derrière la tête : l'oreille du côté caché
  if (H.ear) ear(ctx, H, L, D, col, dark, lw, true);
  // la mâchoire du bas, qui tourne autour de sa charnière
  const hx = 0, hy = 0.12;
  const jd = H.jaw ?? 1;
  const jaw = [[0.0, 0.06], [0.62, 0.08], [0.63, 0.19], [0.36, 0.27 * jd + 0.02], [-0.02, 0.34 * jd]].map(([x, y]) => {
    const px = (x - hx) * L, py = (y - hy) * D;
    return { x: hx * L + px * Math.cos(open) - py * Math.sin(open), y: hy * D + px * Math.sin(open) + py * Math.cos(open) };
  });
  if (open > 0.04) {
    ctx.fillStyle = '#5E1B28';
    ctx.beginPath();
    ctx.moveTo(hx * L, hy * D);
    ctx.lineTo(0.68 * L, 0.1 * D);
    ctx.lineTo(jaw[2].x, jaw[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#D9677A';
    ctx.beginPath();
    ctx.ellipse(jaw[1].x * 0.55, (jaw[1].y + hy * D) * 0.5, L * 0.18, D * 0.05, open * 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = shade(col, 0.08);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, jaw);
  ctx.fill();
  ctx.stroke();
  if (fine && H.teeth && open > 0.06) {
    // les dents du bas
    ctx.fillStyle = '#FBF6E9';
    for (let i = 0; i < 4; i++) {
      const k = 0.35 + i * 0.16;
      const bx = jaw[0].x + (jaw[1].x - jaw[0].x) * k, by = jaw[0].y + (jaw[1].y - jaw[0].y) * k;
      const tl = D * (i === 3 ? 0.17 : 0.09);
      ctx.beginPath();
      ctx.moveTo(bx - L * 0.025, by);
      ctx.lineTo(bx + Math.sin(open) * tl, by - Math.cos(open) * tl);
      ctx.lineTo(bx + L * 0.025, by);
      ctx.fill();
    }
  }
  // le crâne et le museau
  const skull = [P(-0.34, 0.0), P(-0.28, -0.34), P(-0.08, -0.52), P(0.16, -0.48), P(0.42, top - 0.06), P(0.66, top), P(0.74, top * 0.2), P(0.71, 0.12), P(0.42, 0.15), P(0.12, 0.22), P(-0.22, 0.3)];
  if (H.dome) {
    skull[1].y -= D * 0.2 * H.dome;
    skull[2].y -= D * 0.4 * H.dome;
    skull[3].y -= D * 0.3 * H.dome;
    skull[4].y -= D * 0.1 * H.dome;
  }
  const g = ctx.createLinearGradient(0, -0.55 * D, 0, 0.3 * D);
  g.addColorStop(0, shade(col, -0.16));
  g.addColorStop(0.55, col);
  g.addColorStop(1, belly);
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, skull);
  ctx.fill();
  ctx.stroke();
  // le museau plus clair (comme chez beaucoup de mammifères)
  if (fine && H.muzzle !== false) {
    ctx.fillStyle = 'rgba(255, 250, 235, 0.16)';
    ctx.beginPath();
    ctx.ellipse(0.56 * L, 0.02 * D, 0.17 * L, 0.13 * D, 0, 0, TAU);
    ctx.fill();
  }
  // le nez
  ctx.fillStyle = H.noseCol || '#2B2224';
  ctx.beginPath();
  ctx.ellipse(0.71 * L, top * 0.4 * D, 0.065 * L, 0.08 * D, 0, 0, TAU);
  ctx.fill();
  // la bouche fermée
  if (open <= 0.04) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.6, lw * 0.6);
    ctx.beginPath();
    ctx.moveTo(0.69 * L, 0.11 * D);
    ctx.quadraticCurveTo(0.45 * L, 0.17 * D, 0.2 * L, 0.15 * D);
    ctx.stroke();
  }
  // les canines
  if (fine && H.teeth) {
    ctx.fillStyle = '#FBF6E9';
    ctx.strokeStyle = 'rgba(60, 40, 30, 0.5)';
    ctx.lineWidth = Math.max(0.4, lw * 0.4);
    ctx.beginPath();
    ctx.moveTo(0.55 * L, 0.1 * D);
    ctx.lineTo(0.585 * L, 0.3 * D);
    ctx.lineTo(0.62 * L, 0.1 * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // (H.saber) les dents de sabre, qui dépassent bien sous le menton
  if (H.saber) {
    ctx.fillStyle = '#FBF6E9';
    ctx.strokeStyle = 'rgba(60, 40, 30, 0.6)';
    ctx.lineWidth = Math.max(0.5, lw * 0.6);
    ctx.beginPath();
    ctx.moveTo(0.5 * L, 0.08 * D);
    ctx.quadraticCurveTo(0.5 * L, (0.3 + H.saber * 0.5) * D, 0.44 * L, (0.2 + H.saber) * D);
    ctx.quadraticCurveTo(0.58 * L, (0.3 + H.saber * 0.4) * D, 0.6 * L, 0.08 * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // l'œil
  const ex = H.eye[0] * L, ey = H.eye[1] * D;
  mamEye(ctx, ex, ey, D * H.eyeR * (o.cute ? 1.45 : 1), c.mood, c.blink, H.iris || '#3B2414', dark, o.cute);
  if (o.cute) {
    ctx.fillStyle = 'rgba(255, 120, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(ex + 0.16 * L, ey + 0.32 * D, L * 0.07, D * 0.07, 0, 0, TAU);
    ctx.fill();
  }
  // devant : l'oreille de notre côté
  if (H.ear) ear(ctx, H, L, D, col, dark, lw, false);
  ctx.restore();
}

/* ============================================================================
   Le corps, les pattes et la queue
   P : { ground, hip, shoulder, depth, hipTop, midTop, hump, belly, sag, neck
         [[x, y, épaisseur]…], head (voir drawMamHead), legW, foreW, stride,
         cadence, tail { len, w, droop, curl, sway, type ('fine', 'touffue') },
         spots, stripeCol, patches ({ col, n } : de grandes taches), wool (la
         couleur de la laine) }
   ============================================================================ */
function mamBody(P) {
  const [hx, hy] = P.hip, [sx, sy] = P.shoulder, d = P.depth;
  const pts = [
    [hx - d * 0.95, hy + d * 0.08, d * 0.3, d * 0.3],
    [hx - d * 0.68, hy - d * 0.02, d * 0.8 * (P.hipTop || 1), d * 0.72],
    [hx, hy, d * (P.hipTop || 1), d * 0.85],
    [(hx + sx) / 2, (hy + sy) / 2 + (P.sag || 0), d * (P.midTop || 0.95), d * (P.belly || 0.95)],
    [sx, sy, d * (P.hump || 1), d * 0.95],
  ];
  for (const [x, y, w] of P.neck) pts.push([x, y, w, w * 1.05]);
  return pts;
}

function paw(ctx, x, y, w, col, dark, lw) {
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y - w * 0.4, w * 0.85, w * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (isFine()) {
    // les doigts
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = Math.max(0.5, lw * 0.5);
    ctx.beginPath();
    for (const k of [0.15, 0.6]) {
      ctx.moveTo(x + w * k, y - w * 0.05);
      ctx.lineTo(x + w * k, y - w * 0.4);
    }
    ctx.stroke();
  }
}

function hindLeg(ctx, top, gy, w, ph, stride, col, dark, lw) {
  const H = gy - top.y;
  const sw = Math.sin(ph);
  const lift = Math.max(0, Math.cos(ph)) * H * 0.16;
  const L1 = H * 0.44, L2 = H * 0.42, L3 = H * 0.3;
  const foot = { x: top.x + sw * stride - H * 0.04, y: gy - lift };
  const hock = { x: foot.x - L3 * 0.3, y: foot.y - L3 * 0.95 - w * 0.3 };
  const knee = joint(top.x, top.y, hock.x, hock.y, L1, L2, 1);
  limb(ctx, [[top.x, top.y, w * 1.75], [knee.x, knee.y, w * 0.95], [hock.x, hock.y, w * 0.58], [foot.x, foot.y - w * 0.45, w * 0.5]], col, dark, lw);
  paw(ctx, foot.x, foot.y, w, col, dark, lw);
}

function foreLeg(ctx, top, gy, w, ph, stride, col, dark, lw) {
  const H = gy - top.y;
  const sw = Math.sin(ph);
  const lift = Math.max(0, Math.cos(ph)) * H * 0.16;
  const L1 = H * 0.47, L2 = H * 0.42, L3 = H * 0.13;
  const foot = { x: top.x + sw * stride + H * 0.04 - lift * 0.4, y: gy - lift };
  const wrist = { x: foot.x - L3 * 0.1 + lift * 0.3, y: foot.y - L3 - w * 0.3 };
  const elbow = joint(top.x, top.y, wrist.x, wrist.y, L1, L2, -1);
  limb(ctx, [[top.x, top.y, w * 1.55], [elbow.x, elbow.y, w * 0.9], [wrist.x, wrist.y, w * 0.62], [foot.x, foot.y - w * 0.45, w * 0.52]], col, dark, lw);
  paw(ctx, foot.x, foot.y, w, col, dark, lw);
}

/** Les quatre pattes d'un côté (far = le côté caché, plus sombre) : elles avancent en diagonale */
function mamLegs(ctx, P, r, gy, ph, col, dark, lw, far) {
  const stride = (P.stride || 0.3) * r;
  const hip = { x: (P.hip[0] + 0.04) * r, y: (P.hip[1] + P.depth * 0.25) * r };
  const sh = { x: (P.shoulder[0] - 0.02) * r, y: (P.shoulder[1] + P.depth * 0.3) * r };
  const wH = P.legW * r, wF = P.legW * r * (P.foreW || 0.9);
  const a = far ? Math.PI : 0;
  hindLeg(ctx, hip, gy * r, wH, ph + a, stride, col, dark, lw);
  foreLeg(ctx, sh, gy * r, wF, ph + Math.PI + a, stride, col, dark, lw);
  return { hip, sh, wH, wF };
}

function mamTail(ctx, P, r, t, c, col, dark, lw) {
  const T = P.tail;
  if (!T) return;
  const d = P.depth;
  const base = { x: (P.hip[0] - d * 0.82) * r, y: (P.hip[1] - d * 0.4) * r };
  const sw = Math.sin(t * 2.2 + (c.seed || 0) * 2) * (T.sway ?? 0.22);
  const len = T.len * r;
  const a0 = Math.PI + (T.droop ?? 0.6);          // vers l'arrière, en descendant
  const a1 = a0 + (T.curl ?? 0) + sw;
  const am = (a0 + a1) / 2;
  const p1 = add(base, Math.cos(a0) * len * 0.36, Math.sin(a0) * len * 0.36);
  const p2 = add(p1, Math.cos(am) * len * 0.34, Math.sin(am) * len * 0.34);
  const tip = add(p2, Math.cos(a1) * len * 0.32, Math.sin(a1) * len * 0.32);
  const w = T.w * r;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.fillStyle = col;
  if (T.type === 'touffue') taper(ctx, base, p1, p2, tip, w * 0.8, w * 1.2, 10);
  else taper(ctx, base, p1, p2, tip, w, w * 0.4, 10);
  ctx.fill();
  ctx.stroke();
}

/** Des petits traits de poils le long du dos (fluffy = fourrure ébouriffée) */
function furTicks(ctx, pts, r, lw, fluffy) {
  ctx.strokeStyle = fluffy ? 'rgba(0, 0, 0, 0.26)' : 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = Math.max(0.6, lw * (fluffy ? 0.9 : 0.6));
  ctx.lineCap = 'round';
  ctx.beginPath();
  const x0 = pts[1][0], x1 = pts[pts.length - 2][0];
  const n = fluffy ? 18 : 12;
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + 0.5) / n;
    const s = spineAt(pts, x);
    const y = s[1] - s[2] * 0.8;
    ctx.moveTo(x * r, y * r);
    ctx.lineTo((x - (fluffy ? 0.1 : 0.07)) * r, (y + (fluffy ? 0.1 : 0.06)) * r);
  }
  ctx.stroke();
}

/** La laine (le caniche) : des boucles tout autour du corps */
function wool(ctx, pts, r, P, dark, lw) {
  const x0 = pts[0][0] + 0.05, x1 = P.shoulder[0] + P.depth * 0.45;
  const n = isFine() ? 9 : 5;
  ctx.fillStyle = P.wool;
  ctx.strokeStyle = shade(P.wool, -0.35);
  ctx.lineWidth = Math.max(0.6, lw * 0.7);
  for (const top of [false, true]) {
    // toutes les boucles d'une rangée en un seul tracé (bien plus rapide)
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      const s = spineAt(pts, x);
      const R = (top ? s[2] : s[3]) * 0.42;
      const y = (top ? s[1] - s[2] * 0.62 : s[1] + s[3] * 0.55) * r;
      ctx.moveTo((x + R) * r, y);
      ctx.arc(x * r, y, R * r, 0, TAU);
    }
    ctx.stroke();
    ctx.fill();
  }
}

function drawMammal(ctx, c, t, P, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const fine = isFine();
  const belly = o.belly || shade(col, 0.35);
  const stripe = o.stripe || P.stripeCol || shade(col, -0.3);
  const dark = shade(col, -0.58);
  const lw = Math.max(0.8, r * 0.03);
  startSide(ctx, c);
  const H = P.head;
  groundShadow(ctx, (P.hip[0] - P.depth * 1.1) * r, (H.x + H.L * 0.75) * r, P.ground * r, r * 0.15);
  const ph = (c.walk || 0) * (P.cadence || 2);
  const bob = Math.abs(Math.cos(ph)) * 0.025;
  ctx.translate(0, -bob * r);
  const gy = P.ground + bob;
  const pts = mamBody(P);
  const legCol = col;
  // derrière : la queue, puis les pattes du côté caché
  mamTail(ctx, P, r, t, c, col, dark, lw);
  mamLegs(ctx, P, r, gy, ph, shade(legCol, -0.3), dark, lw, true);
  const near = mamLegs(ctx, P, r, gy, ph, shade(legCol, 0.04), dark, lw, false);
  paintBody(ctx, pts, r, col, belly, dark, lw, P, stripe);
  const patches = o.patches || P.patches;
  if (patches && fine) {
    // de grandes taches (les chiens tachetés)
    ctx.save();
    bodyPath(ctx, pts, r);
    ctx.clip();
    ctx.fillStyle = patches.col;
    for (let i = 0; i < patches.n; i++) {
      const x = pts[1][0] + (P.shoulder[0] + 0.1 - pts[1][0]) * ((i * 0.618 + 0.2) % 1);
      const s = spineAt(pts, x);
      ctx.beginPath();
      ctx.ellipse(x * r, (s[1] - s[2] * (0.35 - (i % 2) * 0.5)) * r, s[2] * r * 0.62, s[2] * r * 0.48, i, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  if (P.wool) wool(ctx, pts, r, P, dark, lw);
  if (fine && !P.wool) muscles(ctx, near.hip, near.sh, r, near.wH * 0.75, near.wF * 0.75, dark);
  if (fine) furTicks(ctx, pts, r, lw, o.fluffy);
  drawMamHead(ctx, H, r, c, col, belly, dark, lw, o);
  ctx.restore();
}

/* ---------- La musaraigne (le joueur, dans l'intro des mammifères) ---------- */
const MUSARAIGNE = {
  ground: 0.6, hip: [-0.55, -0.02], shoulder: [0.38, 0.02], depth: 0.36, midTop: 1.05,
  neck: [[0.56, -0.04, 0.3], [0.66, -0.08, 0.28]],
  head: { x: 0.76, y: -0.13, L: 0.72, D: 0.5, snout: 0.32, ear: 'rond', earR: 0.85, noseCol: '#C9727E', eye: [0.12, -0.16], eyeR: 0.14, teeth: true },
  legW: 0.09, stride: 0.3, cadence: 2.6,
  tail: { len: 1.5, w: 0.05, droop: 0.25, curl: -0.25, type: 'fine' },
};
FORMS.musaraigne = (ctx, p, parts, t, mood) => {
  drawMammal(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, MUSARAIGNE, PLAYER.body, {
    belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.3), cute: true,
  });
};
FORM_SPINE.musaraigne = null;

/* ============================================================================
   Les loups et les chiens (l'intro du loup, le défilé de la fin)
   ============================================================================ */
const DOGS = {
  louveteau: {
    ground: 0.66, hip: [-0.48, -0.08], shoulder: [0.36, -0.08], depth: 0.36, midTop: 1.05,
    neck: [[0.54, -0.18, 0.28], [0.64, -0.26, 0.26]],
    head: { x: 0.76, y: -0.34, L: 0.64, D: 0.56, snout: 0.36, ear: 'pointe', earR: 0.85, eye: [0.16, -0.16], eyeR: 0.13 },
    legW: 0.1, stride: 0.3, cadence: 2.6,
    tail: { len: 0.65, w: 0.1, droop: -0.5, curl: 0.2, type: 'touffue' },
  },
  loup: {
    ground: 0.9, hip: [-0.6, -0.2], shoulder: [0.42, -0.24], depth: 0.32, belly: 0.82,
    neck: [[0.64, -0.34, 0.25], [0.78, -0.42, 0.22]],
    head: { x: 0.92, y: -0.46, L: 0.8, D: 0.44, snout: 0.42, ear: 'pointe', earR: 0.9, eye: [0.14, -0.22], eyeR: 0.1, teeth: true, iris: '#D9A13A' },
    legW: 0.095, stride: 0.38, cadence: 2.2,
    tail: { len: 0.95, w: 0.11, droop: -0.85, curl: 0.3, type: 'touffue' },
  },
};
/* (le chien : le modèle des races de chiens) */
const CHIEN = {
  ground: 0.85, hip: [-0.56, -0.18], shoulder: [0.4, -0.2], depth: 0.33,
  neck: [[0.6, -0.3, 0.25], [0.72, -0.38, 0.23]],
  head: { x: 0.86, y: -0.44, L: 0.68, D: 0.48, snout: 0.5, dome: 0.25, ear: 'pointe', earR: 0.8, eye: [0.16, -0.2], eyeR: 0.11, teeth: true },
  legW: 0.1, stride: 0.36, cadence: 2.3,
  tail: { len: 0.8, w: 0.1, droop: -0.3, curl: 0.4, type: 'touffue' },
};

/* ---- Pour la fin : les races de chiens d'aujourd'hui ---- */
const BREEDS = {
  'race-chihuahua': {
    ground: 0.62, hip: [-0.42, -0.1], shoulder: [0.32, -0.1], depth: 0.28,
    neck: [[0.48, -0.2, 0.2], [0.56, -0.3, 0.19]],
    head: { x: 0.68, y: -0.44, L: 0.5, D: 0.56, snout: 0.28, dome: 0.6, ear: 'pointe', earR: 1.5, eye: [0.2, -0.12], eyeR: 0.17 },
    legW: 0.07, stride: 0.3, cadence: 3,
    tail: { len: 0.6, w: 0.06, droop: 0.6, curl: 1.0, type: 'fine' },
  },
  'race-teckel': {
    ground: 0.42, hip: [-0.72, -0.05], shoulder: [0.5, -0.05], depth: 0.27,
    neck: [[0.68, -0.14, 0.2], [0.78, -0.2, 0.19]],
    head: { x: 0.9, y: -0.26, L: 0.72, D: 0.4, snout: 0.4, ear: 'tombante', earR: 1.1, eye: [0.15, -0.2], eyeR: 0.11 },
    legW: 0.08, stride: 0.18, cadence: 3.2,
    tail: { len: 0.7, w: 0.06, droop: -0.2, type: 'fine' },
  },
  'race-caniche': {
    ground: 0.9, hip: [-0.45, -0.25], shoulder: [0.36, -0.25], depth: 0.3,
    neck: [[0.54, -0.38, 0.2], [0.64, -0.5, 0.19]],
    head: { x: 0.74, y: -0.62, L: 0.62, D: 0.42, snout: 0.45, dome: 0.4, ear: 'tombante', earR: 1, earCol: '#E4DED2', eye: [0.15, -0.18], eyeR: 0.11 },
    legW: 0.07, stride: 0.32, cadence: 2.6, wool: '#F6F2EC',
    tail: { len: 0.35, w: 0.1, droop: 1.1, type: 'fine' },
  },
  'race-dalmatien': {
    ...CHIEN, spots: 16, stripeCol: '#1E1E1E',
    head: { ...CHIEN.head, ear: 'tombante', earR: 0.9 },
  },
  'race-husky': {
    ...DOGS.loup,
    head: { ...DOGS.loup.head, iris: '#6AB4E8' },
    tail: { len: 0.9, w: 0.12, droop: 0.9, curl: 1.7, type: 'touffue' },
  },
  'race-berger-allemand': {
    ...DOGS.loup, patches: { col: '#2A2420', n: 2 },
    head: { ...DOGS.loup.head, earR: 1.1 },
  },
  'race-labrador': {
    ...CHIEN,
    head: { ...CHIEN.head, ear: 'tombante', earR: 0.9, snout: 0.55 },
    tail: { len: 0.9, w: 0.12, droop: -0.5, type: 'fine' },
  },
  'race-saint-bernard': {
    ...CHIEN, depth: 0.4, patches: { col: '#9A4A22', n: 3 },
    head: { ...CHIEN.head, D: 0.58, snout: 0.6, dome: 0.3, ear: 'tombante', earR: 1, earCol: '#7A3A1A' },
  },
};

/** Le défilé de la fin : le loup en tête, puis les chiens, du plus petit au plus grand (k = la taille) */
export const BREED_PARADE = [
  { look: 'loup', name: 'Le loup', color: '#8A8A88', belly: '#E8E4DA', k: 1 },
  { look: 'race-chihuahua', name: 'Chihuahua', color: '#E6BE8E', belly: '#F8E8D2', k: 0.5 },
  { look: 'race-teckel', name: 'Teckel', color: '#8A4A22', belly: '#B97A4A', k: 0.62 },
  { look: 'race-caniche', name: 'Caniche', color: '#F2EEE6', belly: '#FFFFFF', k: 0.72 },
  { look: 'race-dalmatien', name: 'Dalmatien', color: '#F4F2EE', belly: '#FFFFFF', k: 0.92 },
  { look: 'race-husky', name: 'Husky', color: '#8E949C', belly: '#F2F2F2', k: 0.95 },
  { look: 'race-labrador', name: 'Labrador', color: '#E8C27A', belly: '#F6E2B4', k: 0.98 },
  { look: 'race-berger-allemand', name: 'Berger allemand', color: '#C08A4A', belly: '#E2C08A', k: 1.02 },
  { look: 'race-saint-bernard', name: 'Saint-bernard', color: '#F4EEE4', belly: '#FFFFFF', k: 1.3 },
];

// (où sont les pattes : pour que tout le défilé marche sur le même chemin)
for (const b of BREED_PARADE) b.ground = (BREEDS[b.look] || DOGS[b.look]).ground;
for (const [id, P] of [['loup', DOGS.loup], ...Object.entries(BREEDS)]) {
  LOOKS[id] = (ctx, c, t) => drawMammal(ctx, c, t, P, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
}
// le louveteau (le joueur, dans l'intro du loup)
FORMS.louveteau = (ctx, p, parts, t, mood) => {
  drawMammal(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, { ...DOGS.louveteau, tail: { ...DOGS.louveteau.tail, sway: mood === 'happy' ? 0.3 : 0.15 } }, PLAYER.body, {
    belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.3), cute: true,
  });
};
FORM_SPINE.louveteau = null;

/* ============================================================================
   Les humains, de profil (autour du feu, à la fin du niveau du loup) : une
   tunique en fourrure, des jambières en cuir. o : { spear (le chasseur et sa
   lance), child (un enfant) }
   ============================================================================ */
const SKINS = ['#C68A5A', '#8D5A3A', '#E2B48A', '#A8704A'];
const HAIR = ['#2A1C14', '#4A2E1A', '#1C1411', '#6A4628'];

function drawPerson(ctx, c, t, o) {
  const r = c.size;
  setDetail(ctx, r);
  const fine = isFine();
  const i = Math.floor((c.seed || 0) * 7) % 4;
  const skin = SKINS[i], hair = HAIR[(i + 1) % 4];
  const col = c.sp.color;
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.035);
  const legCol = '#6A4A30';
  startSide(ctx, c);
  groundShadow(ctx, -0.32 * r, 0.32 * r, 0.98 * r, r * 0.1);
  const ph = (c.walk || 0) * 2.4;
  const sw = Math.sin(ph);
  ctx.translate(0, -Math.abs(Math.cos(ph)) * 0.03 * r);
  const ch = !!o.child;
  const hipY = (ch ? 0.4 : 0.25) * r, footY = 0.98 * r;
  const shY = (ch ? -0.42 : -0.7) * r;
  const headY = (ch ? -0.72 : -1.0) * r, headR = (ch ? 0.27 : 0.22) * r;
  const angry = c.state === 'charge' || c.state === 'alert';
  // les jambes (celle de derrière, plus sombre)
  for (const s of [-1, 1]) {
    const fx = s * sw * 0.24 * r, kx = fx * 0.6 + 0.05 * r, ky = (hipY + footY) / 2;
    const lc = s < 0 ? shade(legCol, -0.25) : legCol;
    limb(ctx, [[0, hipY, 0.11 * r], [kx, ky, 0.09 * r], [fx, footY - 0.05 * r, 0.08 * r]], lc, shade(legCol, -0.5), lw);
    ctx.fillStyle = shade(lc, -0.3);
    ctx.beginPath();
    ctx.ellipse(fx + 0.06 * r, footY - 0.04 * r, 0.11 * r, 0.055 * r, 0, 0, TAU);
    ctx.fill();
  }
  // le bras de derrière
  limb(ctx, [[-0.02 * r, shY + 0.08 * r, 0.075 * r], [-sw * 0.12 * r - 0.04 * r, shY + 0.42 * r, 0.065 * r], [-sw * 0.2 * r, shY + 0.75 * r, 0.06 * r]], shade(skin, -0.2), shade(skin, -0.55), lw);
  // la tunique en fourrure, avec des franges
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-0.17 * r, shY);
  ctx.quadraticCurveTo(0, shY - 0.06 * r, 0.17 * r, shY);
  ctx.lineTo(0.26 * r, hipY + 0.06 * r);
  const n = 7;
  for (let k = 0; k <= n; k++) ctx.lineTo((0.26 - 0.52 * k / n) * r, hipY + (k % 2 ? 0.14 : 0.06) * r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.strokeStyle = shade(col, -0.35);
    ctx.lineWidth = lw * 1.4;
    ctx.beginPath();
    ctx.moveTo(-0.22 * r, (shY + hipY) * 0.42);
    ctx.lineTo(0.22 * r, (shY + hipY) * 0.42);
    ctx.stroke();
  }
  // le col en fourrure claire
  ctx.fillStyle = shade(col, 0.35);
  ctx.beginPath();
  ctx.ellipse(0.02 * r, shY + 0.01 * r, 0.2 * r, 0.07 * r, 0, 0, TAU);
  ctx.fill();
  // la tête
  ctx.fillStyle = skin;
  ctx.strokeStyle = shade(skin, -0.55);
  ctx.beginPath();
  ctx.arc(0.03 * r, headY, headR, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(0.12 * r, headY - headR * 0.85);
  ctx.quadraticCurveTo(-headR * 0.5, headY - headR * 1.25, -headR * 1.05, headY - headR * 0.1);
  ctx.quadraticCurveTo(-headR * 1.2, headY + headR * (ch ? 0.7 : 1.4), -headR * 0.45, headY + headR * (ch ? 0.6 : 1.2));
  ctx.quadraticCurveTo(-headR * 0.2, headY, 0.12 * r, headY - headR * 0.85);
  ctx.fill();
  // le nez, l'œil, la bouche
  ctx.fillStyle = shade(skin, -0.12);
  ctx.beginPath();
  ctx.ellipse(0.03 * r + headR * 0.98, headY + headR * 0.08, headR * 0.16, headR * 0.12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0.03 * r + headR * 0.5, headY - headR * 0.15, headR * 0.12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.6, headR * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (angry) {
    // il crie « Ouste ! » et fronce les sourcils
    ctx.moveTo(0.03 * r + headR * 0.3, headY - headR * 0.42);
    ctx.lineTo(0.03 * r + headR * 0.75, headY - headR * 0.3);
    ctx.stroke();
    ctx.fillStyle = '#5E1B28';
    ctx.beginPath();
    ctx.ellipse(0.03 * r + headR * 0.68, headY + headR * 0.45, headR * 0.13, headR * 0.17, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.moveTo(0.03 * r + headR * 0.45, headY + headR * 0.42);
    ctx.quadraticCurveTo(0.03 * r + headR * 0.65, headY + headR * 0.55, 0.03 * r + headR * 0.82, headY + headR * 0.38);
    ctx.stroke();
  }
  // le bras de devant : il tient la lance, ou il fait de grands gestes
  const hand = angry ? { x: 0.28 * r, y: headY - 0.35 * r + Math.sin(t * 14) * 0.06 * r }
    : o.spear ? { x: 0.22 * r, y: shY + 0.5 * r } : { x: sw * 0.2 * r, y: shY + 0.75 * r };
  if (o.spear && !angry) {
    ctx.strokeStyle = '#6A4A2A';
    ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath();
    ctx.moveTo(0.12 * r, footY - 0.05 * r);
    ctx.lineTo(0.3 * r, headY - 0.75 * r);
    ctx.stroke();
    ctx.fillStyle = '#9A9488';
    ctx.strokeStyle = '#4A463E';
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(0.3 * r, headY - 0.95 * r);
    ctx.lineTo(0.35 * r, headY - 0.72 * r);
    ctx.lineTo(0.26 * r, headY - 0.73 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  limb(ctx, [[0.05 * r, shY + 0.08 * r, 0.08 * r], [(0.05 * r + hand.x) / 2 + 0.06 * r, (shY + hand.y) / 2 + 0.06 * r, 0.068 * r], [hand.x, hand.y, 0.062 * r]], skin, shade(skin, -0.55), lw);
  ctx.restore();
}

LOOKS.humain = (ctx, c, t) => drawPerson(ctx, c, t, {});
LOOKS.chasseur = (ctx, c, t) => drawPerson(ctx, c, t, { spear: true });
LOOKS.enfant = (ctx, c, t) => drawPerson(ctx, c, t, { child: true });

/* (la vue de côté, voie des airs et voie des reptiles : ses mammifères et ses humains) */
export { drawMammal, drawPerson };
