// ============================================================================
// Les mammifères (niveau 3), dessinés de profil comme les dinosaures : de la
// petite boule de poils qui survit à la météorite jusqu'aux géants de l'âge
// de glace (mammouth laineux, ours des cavernes, rhinocéros laineux, tigres à
// dents de sabre…). Chaque espèce est décrite par quelques nombres (hanches,
// épaules, tête, pattes, queue, fourrure) ; un seul dessinateur fait le reste.
// Aussi dans ce fichier : les grands oiseaux coureurs (oiseau-terreur,
// Gastornis), Titanoboa (vu de dessus, dans les mares), les oiseaux en vol,
// le joueur (de la musaraigne au tigre à dents de sabre) et le décor (hautes
// herbes, terriers, arbres à feuilles, palmiers, sapins, neige).
// Repère de profil : tourné vers la droite, (0, 0) = le milieu du corps,
// tout est en × c.size. Les outils de base (corps, pattes) viennent d'art-dinos.js.
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SNOUT, SPINES, DECORS, COVERS, shade, smoothClosed, spineShape, segDir, eyes, drawSprite, turnOf, seeded } from './art.js';
import { SIDE, blob } from './art-terre.js';
import { setDetail, isFine, startSide, groundShadow, joint, limb, claw, bodyPath, spineAt, paintBody, theroLeg, pillarLeg, muscles } from './art-dinos.js';

const TAU = Math.PI * 2;
const IVORY = '#F2E8CF';
const HOOF = '#3B3029';
const ANTLER = '#DCCBA6';

/* ============================================================================
   Petits outils
   ============================================================================ */
/** Un point d'une courbe de Bézier cubique */
function bez(p0, p1, p2, p3, k) {
  const u = 1 - k;
  return {
    x: u * u * u * p0.x + 3 * u * u * k * p1.x + 3 * u * k * k * p2.x + k * k * k * p3.x,
    y: u * u * u * p0.y + 3 * u * u * k * p1.y + 3 * u * k * k * p2.y + k * k * k * p3.y,
  };
}

/** Une forme effilée le long d'une courbe (défense, corne, trompe, queue) :
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
         eye [x, y] et eyeR (en part de L / D), iris, teeth, sabers (longueur
         des dents de sabre, × D), ear ('pointe', 'rond', 'petit', 'long',
         'cheval', 'elephant') et earR, nose ('chat', 'chien', 'cheval',
         'groin'), noseCol, whiskers, dome (front bombé), flanges (joues
         osseuses), trunk (longueur de la trompe, × taille), tusks ('mammouth',
         'deino') et tuskL, horns ('rhino', 'bison', 'gazelle') et hornL,
         antlers ('renne', 'megaceros'), beard, tuft }
   ============================================================================ */
function ear(ctx, H, L, D, col, dark, lw, far) {
  const k = H.earR || 1;
  const ox = far ? -0.07 * L : 0, oy = far ? -0.04 * D : 0;
  const inner = H.earIn || '#E2A39A';
  ctx.fillStyle = far ? shade(col, -0.28) : col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  const bx = -0.1 * L + ox, by = -0.4 * D + oy;
  if (H.ear === 'pointe' || H.ear === 'cheval') {
    const thin = H.ear === 'cheval' ? 0.6 : 1;
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
  } else if (H.ear === 'long') {
    ctx.ellipse(bx - 0.08 * L, by - 0.42 * D * k, 0.1 * L, 0.46 * D * k, -0.35, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (!far && isFine()) {
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.ellipse(bx - 0.07 * L, by - 0.42 * D * k, 0.05 * L, 0.34 * D * k, -0.35, 0, TAU);
      ctx.fill();
    }
  } else {
    // ronde (ours, lion, souris) ou petite (bison, mammouth)
    const R = (H.ear === 'petit' ? 0.12 : 0.2) * D * k;
    ctx.arc(bx, by - R * 0.5, R, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (!far && isFine() && H.ear !== 'petit') {
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(bx + R * 0.1, by - R * 0.4, R * 0.55, 0, TAU);
      ctx.fill();
    }
  }
}

/** Les défenses (far = celle de derrière, plus sombre) */
function tusk(ctx, H, L, D, r, dark, lw, far) {
  const TK = (H.tuskL || 0.6) * r;
  const o = far ? -0.07 * L : 0;
  let b, p1, p2, tip;
  if (H.tusks === 'deino') {
    // le deinotherium : des défenses recourbées vers le bas, sur la mâchoire du bas
    b = { x: 0.5 * L + o, y: 0.24 * D };
    p1 = add(b, 0.06 * TK, 0.45 * TK);
    p2 = add(b, -0.02 * TK, 0.8 * TK);
    tip = add(b, -0.28 * TK, 0.9 * TK);
  } else {
    // le mammouth : de longues défenses en spirale
    b = { x: 0.48 * L + o, y: 0.1 * D };
    p1 = add(b, 0.2 * TK, 0.6 * TK);
    p2 = add(b, 0.95 * TK, 0.62 * TK);
    tip = add(b, 1.0 * TK - o * 2, -0.12 * TK);
  }
  ctx.fillStyle = far ? shade(IVORY, -0.22) : IVORY;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, lw * 0.8);
  taper(ctx, b, p1, p2, tip, D * 0.09, D * 0.03);
  ctx.fill();
  ctx.stroke();
}

/** La trompe : elle pend et se balance doucement */
function trunk(ctx, H, L, D, r, t, seed, col, dark, lw) {
  const TL = H.trunk * r;
  const sw = Math.sin(t * 1.3 + seed) * 0.1;
  const b = { x: 0.6 * L, y: -0.05 * D };
  const p1 = add(b, 0.25 * TL, 0.3 * TL);
  const p2 = add(b, (0.12 + sw) * TL, 0.8 * TL);
  const tip = add(b, (0.3 + sw * 1.5) * TL, 0.92 * TL);
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  const pts = taper(ctx, b, p1, p2, tip, D * 0.2, D * 0.08);
  ctx.fill();
  ctx.stroke();
  if (!isFine()) return;
  // les plis de la trompe
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = Math.max(0.6, lw * 0.6);
  ctx.beginPath();
  for (let i = 2; i < pts.length - 1; i += 1) {
    const a = pts[i - 1], c = pts[i + 1];
    const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || 1;
    const w = D * (0.2 - 0.12 * i / pts.length) * 0.8;
    ctx.moveTo(pts[i].x - dy / d * w, pts[i].y + dx / d * w);
    ctx.lineTo(pts[i].x + dy / d * w * 0.3, pts[i].y - dx / d * w * 0.3);
  }
  ctx.stroke();
}

/** Les bois du renne ou du mégacéros (far = ceux de derrière) */
function antlers(ctx, H, L, D, dark, lw, far) {
  const o = far ? -0.12 * L : 0;
  const b = { x: -0.02 * L + o, y: -0.45 * D };
  D *= H.antlerK || 1;
  ctx.fillStyle = far ? shade(ANTLER, -0.25) : ANTLER;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.7, lw * 0.8);
  ctx.lineJoin = 'round';
  if (H.antlers === 'megaceros') {
    // d'immenses bois plats, comme deux grandes mains ouvertes
    const P = [[0, 0], [-0.3, -0.35], [-0.75, -0.45], [-1.7, -0.75], [-1.45, -1.05], [-2.0, -1.4], [-1.4, -1.5], [-1.45, -2.05],
      [-1.0, -1.55], [-0.75, -2.0], [-0.55, -1.3], [-0.1, -1.6], [-0.2, -0.85], [0.35, -1.0], [0.08, -0.4]];
    ctx.beginPath();
    P.forEach(([x, y], i) => {
      const px = b.x + x * D * 1.1, py = b.y + y * D * 0.9;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  // le renne : de longues branches recourbées vers l'avant, avec des andouillers
  const beam = (w) => {
    const p0 = b, p1 = add(b, -0.6 * D, -0.7 * D), p2 = add(b, -0.75 * D, -1.9 * D), p3 = add(b, 0.15 * D, -2.4 * D);
    const tines = [[0.15, 0.55, -0.15], [0.45, 0.35, -0.75], [0.75, -0.45, -0.4]];
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    for (const [k, dx, dy] of tines) {
      const q = bez(p0, p1, p2, p3, k);
      ctx.moveTo(q.x, q.y);
      ctx.quadraticCurveTo(q.x + dx * D * 0.5, q.y + dy * D * 0.2, q.x + dx * D, q.y + dy * D);
    }
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  beam(D * 0.13);
  ctx.strokeStyle = far ? shade(ANTLER, -0.25) : ANTLER;
  beam(D * 0.08);
}

/** Les cornes (rhinocéros, bison, gazelle) */
function horns(ctx, H, L, D, top, dark, lw, far) {
  const k = H.hornL || 1;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.7, lw * 0.8);
  if (H.horns === 'rhino') {
    if (far) return;
    // deux cornes sur le museau : une immense devant, une plus petite derrière
    ctx.fillStyle = '#6A5A48';
    for (const [x, len, w] of [[0.36, 0.55, 0.1], [0.58, 1.15, 0.13]]) {
      const b = { x: x * L, y: (top - 0.06) * D };
      taper(ctx, b, add(b, 0.02 * L, -len * 0.4 * D * k), add(b, 0.05 * L, -len * 0.8 * D * k), add(b, 0.14 * L, -len * D * k), w * L, w * L * 0.12, 8);
      ctx.fill();
      ctx.stroke();
    }
    return;
  }
  if (H.horns === 'bison') {
    const b = { x: (far ? -0.08 : -0.02) * L, y: -0.42 * D };
    ctx.fillStyle = far ? '#1F1916' : '#2E2622';
    taper(ctx, b, add(b, -0.16 * L, -0.08 * D), add(b, -0.16 * L, -0.4 * D * k), add(b, 0.04 * L, -0.48 * D * k), 0.07 * D, 0.015 * D, 8);
    ctx.fill();
    ctx.stroke();
    return;
  }
  // la gazelle : de longues cornes annelées, recourbées vers l'arrière
  const b = { x: (far ? -0.02 : 0.06) * L, y: -0.46 * D };
  ctx.fillStyle = far ? '#3A2E25' : '#4E3F33';
  taper(ctx, b, add(b, -0.05 * L, -0.6 * D * k), add(b, -0.35 * L, -1.1 * D * k), add(b, -0.62 * L, -1.3 * D * k), 0.06 * L, 0.01 * L, 10);
  ctx.fill();
  ctx.stroke();
}

function drawMamHead(ctx, H, r, c, t, col, belly, dark, lw, o = {}) {
  const L = H.L * r, D = H.D * r;
  const fine = isFine();
  const sn = H.snout ?? 0.5;
  const top = -0.5 * sn;                  // le dessus du museau (en × D)
  const P = (x, y) => ({ x: x * L, y: y * D });
  ctx.save();
  ctx.translate(H.x * r, H.y * r);
  ctx.rotate(H.tilt || 0);
  const open = (c.mouth || 0) * (H.gape ?? 0.45);
  // derrière la tête : l'oreille, les bois, les cornes et la défense du côté caché
  if (H.ear && H.ear !== 'elephant') ear(ctx, H, L, D, col, dark, lw, true);
  if (H.antlers) antlers(ctx, H, L, D, dark, lw, true);
  if (H.horns) horns(ctx, H, L, D, top, dark, lw, true);
  if (H.tusks) tusk(ctx, H, L, D, r, dark, lw, true);
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
  if (H.flanges) {
    // les grosses joues osseuses de l'entélodon
    skull[9].y += D * 0.28;
    skull[10].y += D * 0.2;
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
  if (H.nose === 'chat') {
    ctx.moveTo(0.64 * L, (top * 0.45) * D);
    ctx.lineTo(0.745 * L, (top * 0.45) * D);
    ctx.lineTo(0.72 * L, (top * 0.45 + 0.1) * D);
    ctx.closePath();
    ctx.fill();
  } else if (H.nose === 'chien') {
    ctx.ellipse(0.71 * L, top * 0.4 * D, 0.065 * L * (o.bigNose ? 1.3 : 1), 0.08 * D * (o.bigNose ? 1.3 : 1), 0, 0, TAU);
    ctx.fill();
  } else if (H.nose === 'groin') {
    ctx.fillStyle = shade(col, -0.12);
    ctx.strokeStyle = dark;
    ctx.ellipse(0.73 * L, top * 0.15 * D, 0.045 * L, 0.15 * D, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(30, 20, 15, 0.8)';
    ctx.beginPath();
    ctx.arc(0.75 * L, (top * 0.15 - 0.05) * D, 0.012 * L + 0.02 * D, 0, TAU);
    ctx.arc(0.75 * L, (top * 0.15 + 0.06) * D, 0.012 * L + 0.02 * D, 0, TAU);
    ctx.fill();
  } else if (H.nose === 'cheval') {
    ctx.fillStyle = 'rgba(30, 20, 15, 0.7)';
    ctx.ellipse(0.66 * L, top * 0.15 * D, 0.035 * L, 0.06 * D, -0.3, 0, TAU);
    ctx.fill();
  }
  // la bouche fermée
  if (open <= 0.04) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.6, lw * 0.6);
    ctx.beginPath();
    ctx.moveTo(0.69 * L, 0.11 * D);
    ctx.quadraticCurveTo(0.45 * L, 0.17 * D, 0.2 * L, 0.15 * D);
    ctx.stroke();
  }
  // les canines… ou les dents de sabre !
  if (H.sabers) {
    const S = H.sabers * D, w = 0.05 * L + 0.02 * D;
    const x = 0.5 * L, y = 0.1 * D;
    ctx.fillStyle = IVORY;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.6, lw * 0.7);
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 1.1, y + S * 0.6, x - w * 0.5, y + S);
    ctx.quadraticCurveTo(x + w * 1.2, y + S * 0.5, x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (fine && H.teeth) {
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
  if (H.horns) horns(ctx, H, L, D, top, dark, lw, false);
  // l'œil
  const ex = H.eye[0] * L, ey = H.eye[1] * D;
  mamEye(ctx, ex, ey, D * H.eyeR * (o.cute ? 1.45 : 1), c.mood, c.blink, H.iris || '#3B2414', dark, o.cute);
  if (o.cute) {
    ctx.fillStyle = 'rgba(255, 120, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(ex + 0.16 * L, ey + 0.32 * D, L * 0.07, D * 0.07, 0, 0, TAU);
    ctx.fill();
  }
  // les moustaches
  if (fine && (H.whiskers || o.whiskers)) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = Math.max(0.5, lw * 0.35);
    ctx.beginPath();
    for (const a of [-0.25, 0, 0.25]) {
      ctx.moveTo(0.6 * L, 0.03 * D);
      ctx.quadraticCurveTo(0.85 * L, (0.03 + a * 0.4) * D, 1.05 * L, (0.05 + a) * D);
    }
    ctx.stroke();
  }
  // devant : l'oreille, les bois, la barbe, la touffe, la trompe, la défense
  if (H.ear === 'elephant') {
    ctx.fillStyle = shade(col, -0.08);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(-0.12 * L, -0.05 * D, 0.2 * L * (H.earR || 1), 0.3 * D * (H.earR || 1), 0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
  } else if (H.ear) ear(ctx, H, L, D, col, dark, lw, false);
  if (H.antlers) antlers(ctx, H, L, D, dark, lw, false);
  if (H.beard) {
    ctx.fillStyle = shade(col, -0.35);
    ctx.beginPath();
    ctx.moveTo(0.05 * L, 0.2 * D);
    ctx.quadraticCurveTo(0.12 * L, 0.75 * D, 0.32 * L, 0.6 * D);
    ctx.quadraticCurveTo(0.36 * L, 0.35 * D, 0.4 * L, 0.18 * D);
    ctx.closePath();
    ctx.fill();
  }
  if (H.tuft) {
    // une touffe de longs poils sur le haut du crâne (mammouth)
    ctx.fillStyle = shade(col, -0.2);
    ctx.beginPath();
    ctx.moveTo(-0.3 * L, -0.55 * D);
    for (let i = 0; i <= 6; i++) ctx.lineTo((-0.25 + i * 0.07) * L, (-0.82 - (i % 2) * 0.12 - Math.sin(i / 6 * Math.PI) * 0.12) * D);
    ctx.lineTo(0.2 * L, -0.6 * D);
    ctx.closePath();
    ctx.fill();
  }
  if (H.trunk) trunk(ctx, H, L, D, r, t, c.seed || 0, col, dark, lw);
  if (H.tusks) tusk(ctx, H, L, D, r, dark, lw, false);
  ctx.restore();
}

/** Où est le bout de la gueule (pour SIDE), en × taille */
function mamMouth(H) {
  const x = 0.68 * H.L, y = 0.1 * H.D, a = H.tilt || 0;
  return [+(H.x + x * Math.cos(a) - y * Math.sin(a)).toFixed(2), +(H.y + x * Math.sin(a) + y * Math.cos(a)).toFixed(2)];
}

/* ============================================================================
   Le corps, les pattes et la queue
   P : { ground, hip, shoulder, depth, hipTop, midTop, hump, belly, sag, neck
         [[x, y, épaisseur]…], head (voir drawMamHead), legs ('patte' = sur les
         doigts, 'sabot', 'ours' = à plat, 'colonne' = d'éléphant), legW, foreW,
         legCol, stride, cadence, claws, webbed, tail { len, w, droop, curl,
         type ('fine', 'touffe', 'touffue', 'crin', 'pompon') }, stripes, spots,
         shaggy (longueur des longs poils sous le ventre), cape (avant du corps
         plus sombre), mane (crinière), ridge (poils dressés sur le dos), ruff
         (poils clairs sous le cou), fluffy (fourrure ébouriffée) }
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

function paw(ctx, P, x, y, w, col, dark, lw) {
  if (P.legs === 'sabot') {
    ctx.fillStyle = P.hoofCol || HOOF;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y - w * 0.8);
    ctx.lineTo(x + w * 0.45, y - w * 0.75);
    ctx.lineTo(x + w * 0.75, y);
    ctx.lineTo(x - w * 0.55, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  const big = P.legs === 'ours';
  const web = P.webbed ? 1.35 : 1;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(x + w * (big ? 0.35 : 0.3), y - w * 0.4, w * (big ? 1.1 : 0.85) * web, w * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (P.claws) for (const k of [-0.25, 0, 0.25]) claw(ctx, x + w * (big ? 1.25 : 0.95), y - w * (0.3 + k), w * (big ? 0.7 : 0.45), 0.7, w * 0.13);
  else if (isFine()) {
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

function hindLeg(ctx, P, top, gy, w, ph, stride, col, dark, lw) {
  const H = gy - top.y;
  const sw = Math.sin(ph);
  const lift = Math.max(0, Math.cos(ph)) * H * 0.16;
  const flat = P.legs === 'ours';
  const L1 = H * 0.44, L2 = H * 0.42, L3 = H * (flat ? 0.14 : 0.3);
  const foot = { x: top.x + sw * stride - H * 0.04, y: gy - lift };
  const hock = { x: foot.x - L3 * (flat ? 0.6 : 0.3), y: foot.y - L3 * 0.95 - w * 0.3 };
  const knee = joint(top.x, top.y, hock.x, hock.y, L1, L2, 1);
  limb(ctx, [[top.x, top.y, w * 1.75], [knee.x, knee.y, w * 0.95], [hock.x, hock.y, w * 0.58], [foot.x, foot.y - w * 0.45, w * 0.5]], col, dark, lw);
  paw(ctx, P, foot.x, foot.y, w, col, dark, lw);
}

function foreLeg(ctx, P, top, gy, w, ph, stride, col, dark, lw) {
  const H = gy - top.y;
  const sw = Math.sin(ph);
  const lift = Math.max(0, Math.cos(ph)) * H * 0.16;
  const L1 = H * 0.47, L2 = H * 0.42, L3 = H * 0.13;
  const foot = { x: top.x + sw * stride + H * 0.04 - lift * 0.4, y: gy - lift };
  const wrist = { x: foot.x - L3 * 0.1 + lift * 0.3, y: foot.y - L3 - w * 0.3 };
  const elbow = joint(top.x, top.y, wrist.x, wrist.y, L1, L2, -1);
  limb(ctx, [[top.x, top.y, w * 1.55], [elbow.x, elbow.y, w * 0.9], [wrist.x, wrist.y, w * 0.62], [foot.x, foot.y - w * 0.45, w * 0.52]], col, dark, lw);
  paw(ctx, P, foot.x, foot.y, w, col, dark, lw);
}

/** Les quatre pattes d'un côté (far = le côté caché, plus sombre) : elles avancent en diagonale */
function mamLegs(ctx, P, r, gy, ph, col, dark, lw, far) {
  const stride = (P.stride || 0.3) * r;
  const hip = { x: (P.hip[0] + 0.04) * r, y: (P.hip[1] + P.depth * 0.25) * r };
  const sh = { x: (P.shoulder[0] - 0.02) * r, y: (P.shoulder[1] + P.depth * 0.3) * r };
  const wH = P.legW * r, wF = P.legW * r * (P.foreW || 0.9);
  const a = far ? Math.PI : 0;
  if (P.legs === 'colonne') {
    pillarLeg(ctx, hip, gy * r, 0, 0, wH, ph + a, stride, r * 0.1, col, dark, lw, 1);
    pillarLeg(ctx, sh, gy * r, 0, 0, wF, ph + Math.PI + a, stride, r * 0.1, col, dark, lw, -1);
    return { hip, sh, wH, wF };
  }
  hindLeg(ctx, P, hip, gy * r, wH, ph + a, stride, col, dark, lw);
  foreLeg(ctx, P, sh, gy * r, wF, ph + Math.PI + a, stride, col, dark, lw);
  return { hip, sh, wH, wF };
}

function mamTail(ctx, P, r, t, c, col, dark, lw) {
  const T = P.tail;
  if (!T) return;
  const d = P.depth;
  const base = { x: (P.hip[0] - d * 0.82) * r, y: (P.hip[1] - d * 0.4) * r };
  if (T.type === 'pompon') {
    // la petite queue en boule du lapin
    ctx.fillStyle = '#F4EFE4';
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(base.x - T.w * r * 0.4, base.y + d * 0.25 * r, T.w * r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    return;
  }
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
  if (T.type === 'crin') {
    // une queue de cheval : de longs crins qui pendent
    ctx.fillStyle = shade(col, -0.45);
    taper(ctx, base, p1, p2, tip, w * 1.2, w * 2.2, 8);
    ctx.fill();
    ctx.stroke();
    return;
  }
  ctx.fillStyle = col;
  if (T.type === 'touffue') taper(ctx, base, p1, p2, tip, w * 0.8, w * 1.2, 10);
  else taper(ctx, base, p1, p2, tip, w, w * 0.4, 10);
  ctx.fill();
  ctx.stroke();
  if (T.type === 'touffe') {
    ctx.fillStyle = shade(col, -0.4);
    ctx.beginPath();
    ctx.ellipse(tip.x, tip.y, w * 2.4, w * 1.4, a1, 0, TAU);
    ctx.fill();
  }
  if (T.tip) {
    ctx.fillStyle = T.tip;
    ctx.beginPath();
    ctx.ellipse(tip.x, tip.y, w * 1.4, w * 1.1, a1, 0, TAU);
    ctx.fill();
  }
}

/** De longs poils qui pendent sous le ventre (mammouth, rhinocéros laineux, bison) */
function hem(ctx, pts, r, P, col, dark, lw) {
  const len = P.shaggy;
  const x0 = P.hip[0] - P.depth * 0.7, x1 = P.shoulder[0] + P.depth * 0.5;
  const n = 16;
  ctx.fillStyle = shade(col, -0.14);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, lw * 0.7);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    const s = spineAt(pts, x);
    const y = s[1] + s[3] * 0.45;
    if (i === 0) ctx.moveTo(x * r, y * r); else ctx.lineTo(x * r, y * r);
  }
  for (let i = n * 2; i >= 0; i--) {
    const x = x0 + (x1 - x0) * i / (n * 2);
    const s = spineAt(pts, x);
    const k = 0.5 + Math.sin(i / (n * 2) * Math.PI) * 0.5;
    ctx.lineTo(x * r, (s[1] + s[3] + (i % 2 ? len : len * 0.35) * k) * r);
  }
  ctx.closePath();
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

/** Une rangée de poils dressés sur le cou et le dos (crinière du cheval, de l'hyène, du sanglier) */
function ridge(ctx, pts, r, x0, x1, h, col, dark, lw) {
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, lw * 0.7);
  ctx.beginPath();
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    const s = spineAt(pts, x);
    const y = s[1] - s[2] * 0.85;
    if (i === 0) ctx.moveTo(x * r, y * r);
    ctx.lineTo((x - 0.03) * r, (y - h * (i % 2 ? 1 : 0.5)) * r);
  }
  for (let i = n; i >= 0; i--) {
    const x = x0 + (x1 - x0) * i / n;
    const s = spineAt(pts, x);
    ctx.lineTo(x * r, (s[1] - s[2] * 0.7) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawMammal(ctx, c, t, P, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const fine = isFine();
  const belly = o.belly || P.bellyCol || shade(col, 0.35);
  const stripe = o.stripe || P.stripeCol || shade(col, -0.3);
  const dark = shade(col, -0.58);
  const lw = Math.max(0.8, r * 0.03);
  startSide(ctx, c);
  const H = P.head;
  groundShadow(ctx, (P.hip[0] - P.depth * 1.1) * r, (H.x + H.L * 0.75) * r, P.ground * r, r * 0.15);
  const ph = (c.walk || 0) * (P.cadence || 2);
  const bob = Math.abs(Math.cos(ph)) * (P.legs === 'colonne' ? 0.012 : 0.025);
  ctx.translate(0, -bob * r);
  const gy = P.ground + bob;
  const pts = mamBody(P);
  const legCol = P.legCol || col;
  // derrière : la queue, puis les pattes du côté caché
  mamTail(ctx, P, r, t, c, col, dark, lw);
  mamLegs(ctx, P, r, gy, ph, shade(legCol, -0.3), dark, lw, true);
  const near = mamLegs(ctx, P, r, gy, ph, shade(legCol, 0.04), dark, lw, false);
  paintBody(ctx, pts, r, col, belly, dark, lw, P, stripe);
  if (fine && P.legs !== 'colonne') muscles(ctx, near.hip, near.sh, r, near.wH * 0.75, near.wF * 0.75, dark);
  if (fine) {
    if (P.cape) {
      // l'avant du corps, couvert d'une épaisse toison plus sombre (bison)
      ctx.save();
      bodyPath(ctx, pts, r);
      ctx.clip();
      const x = (P.hip[0] + P.shoulder[0]) / 2 * r;
      const g = ctx.createLinearGradient(x - r * 0.15, 0, x + r * 0.15, 0);
      g.addColorStop(0, 'rgba(0, 0, 0, 0)');
      g.addColorStop(1, shade(col, -0.35));
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 0.15, -r * 3, r * 4, r * 6);
      ctx.restore();
    }
    furTicks(ctx, pts, r, lw, o.fluffy || P.fluffy);
    if (P.ruff) {
      // des poils clairs sous le cou (renne)
      ctx.fillStyle = P.ruff;
      const n0 = P.neck[0];
      ctx.beginPath();
      ctx.ellipse((n0[0] - 0.02) * r, (n0[1] + n0[2] * 0.75) * r, n0[2] * r * 0.9, n0[2] * r * 0.6, 0.6, 0, TAU);
      ctx.fill();
    }
  }
  if (P.shaggy) hem(ctx, pts, r, P, col, dark, lw);
  if (P.mane) {
    const n1 = P.neck[P.neck.length - 1];
    ridge(ctx, pts, r, P.shoulder[0] - 0.05, n1[0] + 0.02, P.depth * 0.32, shade(col, -0.45), dark, lw);
  }
  if (P.ridge) ridge(ctx, pts, r, P.hip[0] + 0.1, P.shoulder[0] + 0.15, P.depth * 0.22, shade(col, -0.3), dark, lw);
  drawMamHead(ctx, H, r, c, t, col, belly, dark, lw, o);
  ctx.restore();
}

/* ============================================================================
   Les grands oiseaux coureurs (oiseau-terreur, Gastornis), de profil
   P : les pattes comme un théropode (voir art-dinos.js) + body (le corps, comme
       bodyPath), head { x, y, R, beakL, beakD }, beakCol, wing
   ============================================================================ */
function drawRunnerBird(ctx, c, t, P, col) {
  const r = c.size;
  setDetail(ctx, r);
  const fine = isFine();
  const belly = shade(col, 0.35);
  const dark = shade(col, -0.58);
  const lw = Math.max(0.8, r * 0.03);
  startSide(ctx, c);
  groundShadow(ctx, -0.9 * r, (P.head.x + P.head.beakL) * r, P.ground * r, r * 0.14);
  const ph = (c.walk || 0) * (P.cadence || 2.3);
  const bob = Math.abs(Math.cos(ph)) * 0.035;
  ctx.translate(0, -bob * r);
  const gy = P.ground + bob;
  const legCol = P.legCol || shade(col, 0.12);
  theroLeg(ctx, P, r, gy, ph + Math.PI, shade(legCol, -0.3), dark, lw, true);
  // la queue : un éventail de longues plumes
  const tail = P.body[0];
  ctx.fillStyle = shade(col, -0.2);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.8;
  for (const a of [-0.5, -0.2, 0.1]) {
    ctx.beginPath();
    ctx.ellipse((tail[0] + 0.08) * r, tail[1] * r, r * 0.32, r * 0.08, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  paintBody(ctx, P.body, r, col, belly, dark, lw, P, shade(col, -0.3));
  if (fine) {
    // des plumes en écailles sur le dos
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = Math.max(0.6, lw * 0.6);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const x = -0.65 + i * 0.12, s = spineAt(P.body, x);
      const y = s[1] - s[2] * 0.5;
      ctx.moveTo((x - 0.05) * r, y * r);
      ctx.quadraticCurveTo(x * r, (y + 0.06) * r, (x + 0.05) * r, y * r);
    }
    ctx.stroke();
  }
  // la petite aile repliée
  ctx.fillStyle = shade(col, -0.12);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(-0.05 * r, -0.2 * r, r * (P.wing || 0.32), r * 0.13, -0.25, 0, TAU);
  ctx.fill();
  ctx.stroke();
  theroLeg(ctx, P, r, gy, ph, legCol, dark, lw, false);
  // la tête et l'énorme bec crochu
  const H = P.head;
  const hx = H.x * r, hy = H.y * r, R = H.R * r, bl = H.beakL * r, bd = H.beakD * r;
  const open = (c.mouth || 0) * 0.35;
  ctx.fillStyle = P.beakCol || '#D9A441';
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  // le bas du bec (il s'ouvre)
  ctx.save();
  ctx.translate(hx + R * 0.5, hy + bd * 0.12);
  ctx.rotate(open);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(bl * 0.85, bd * 0.05);
  ctx.quadraticCurveTo(bl * 0.5, bd * 0.4, 0, bd * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(hx, hy, R * 1.1, R, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // le haut du bec, crochu au bout
  ctx.fillStyle = P.beakCol || '#D9A441';
  ctx.beginPath();
  ctx.moveTo(hx + R * 0.3, hy - R * 0.85);
  ctx.quadraticCurveTo(hx + R * 0.5 + bl * 0.7, hy - bd * 0.6, hx + R * 0.5 + bl, hy + bd * 0.05);
  ctx.quadraticCurveTo(hx + R * 0.5 + bl * 1.02, hy + bd * 0.3, hx + R * 0.5 + bl * 0.9, hy + bd * 0.32);
  ctx.quadraticCurveTo(hx + R * 0.5 + bl * 0.85, hy + bd * 0.15, hx + R * 0.5 + bl * 0.7, hy + bd * 0.14);
  ctx.lineTo(hx + R * 0.5, hy + bd * 0.12);
  ctx.quadraticCurveTo(hx + R * 0.2, hy, hx + R * 0.3, hy - R * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(hx + R * 0.5 + bl * 0.4, hy - bd * 0.3, bl * 0.3, bd * 0.08, 0.15, 0, TAU);
    ctx.fill();
  }
  // une petite huppe de plumes
  if (P.crest) {
    ctx.fillStyle = shade(col, -0.25);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(hx - R * (0.8 + i * 0.25), hy - R * (0.6 - i * 0.3), R * 0.5, R * 0.14, -0.6 + i * 0.3, 0, TAU);
      ctx.fill();
    }
  }
  mamEye(ctx, hx + R * 0.15, hy - R * 0.25, R * 0.32, c.mood, c.blink, '#E8B730', dark, false);
  ctx.restore();
}

/* ============================================================================
   Titanoboa, le serpent géant (vu de dessus, il nage dans les mares)
   ============================================================================ */
function drawSnake(ctx, c, t) {
  const pts = c.spine;
  if (!pts) return;
  const r = c.size;
  setDetail(ctx, r);
  const col = c.sp.color;
  const dark = shade(col, -0.55);
  const n = pts.length;
  const widths = pts.map((_, i) => r * 0.4 * (i < 2 ? 0.95 : 1 - Math.pow((i - 1) / (n - 1), 1.5) * 0.85));
  const shape = spineShape(pts, widths, 0.55);
  ctx.fillStyle = 'rgba(0, 20, 30, 0.25)';
  ctx.save();
  ctx.translate(r * 0.25, r * 0.35);
  smoothClosed(ctx, shape);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.06);
  smoothClosed(ctx, shape);
  ctx.fill();
  ctx.stroke();
  if (isFine()) {
    // les grosses taches sombres sur le dos
    ctx.fillStyle = shade(col, -0.35);
    for (let i = 2; i < n - 1; i++) {
      const d = segDir(pts, i);
      const s = i % 2 ? 1 : -1;
      const w = widths[i] * 0.45;
      ctx.beginPath();
      ctx.ellipse(pts[i].x - d.y * w * s, pts[i].y + d.x * w * s, widths[i] * 0.42, widths[i] * 0.3, Math.atan2(d.y, d.x), 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = r * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    for (let i = 2; i < n - 1; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  // la tête, un peu plus large, avec sa langue fourchue
  const h = pts[0], d0 = segDir(pts, 0);
  const ang = Math.atan2(d0.y, d0.x);
  if (Math.sin(t * 2.6 + (c.seed || 0) * 3) > 0.55 || c.mouth > 0.3) {
    const fx = h.x + d0.x * r * 0.75, fy = h.y + d0.y * r * 0.75;
    ctx.strokeStyle = '#D4314B';
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(h.x + d0.x * r * 0.45, h.y + d0.y * r * 0.45);
    ctx.lineTo(fx, fy);
    for (const s of [-1, 1]) {
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(ang + s * 0.5) * r * 0.18, fy + Math.sin(ang + s * 0.5) * r * 0.18);
    }
    ctx.stroke();
  }
  ctx.fillStyle = shade(col, 0.06);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  ctx.ellipse(h.x + d0.x * r * 0.12, h.y + d0.y * r * 0.12, r * 0.5, r * 0.36, ang, 0, TAU);
  ctx.fill();
  ctx.stroke();
  eyes(ctx, h.x, h.y, ang, r, 0.22, 0.22, 0.1, c.mood, c.blink, '#E8C547');
}

/* ============================================================================
   Les oiseaux en vol (vus de dessus)
   ============================================================================ */
function drawFlyingBird(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const dark = shade(col, -0.55);
  const flap = Math.sin(t * 9 + (c.seed || 0) * 3);
  ctx.fillStyle = 'rgba(0, 25, 15, 0.16)';
  ctx.beginPath();
  ctx.ellipse(c.x + r * 0.9, c.y + r * 1.8, r * 1.3, r * 0.6, c.angle, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.lineJoin = 'round';
  // les ailes, qui battent
  for (const s of [-1, 1]) {
    const span = 1.5 + flap * 0.3;
    ctx.fillStyle = shade(col, -0.08);
    ctx.beginPath();
    ctx.moveTo(r * 0.2, s * r * 0.2);
    ctx.quadraticCurveTo(r * 0.1, s * r * span * 0.8, -r * 0.35, s * r * span);
    ctx.lineTo(-r * 0.65, s * r * span * 0.75);
    ctx.lineTo(-r * 0.5, s * r * span * 0.5);
    ctx.lineTo(-r * 0.6, s * r * span * 0.3);
    ctx.quadraticCurveTo(-r * 0.3, s * r * 0.25, -r * 0.2, s * r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // la queue en éventail
  ctx.fillStyle = shade(col, -0.15);
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, 0);
  ctx.lineTo(-r * 1.15, -r * 0.32);
  ctx.quadraticCurveTo(-r * 1.25, 0, -r * 1.15, r * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.65, r * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c.sp.beak || '#E8A33A';
  ctx.beginPath();
  ctx.moveTo(r * 0.95, 0);
  ctx.lineTo(r * 0.68, -r * 0.09);
  ctx.lineTo(r * 0.68, r * 0.09);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(col, 0.1);
  ctx.beginPath();
  ctx.arc(r * 0.55, 0, r * 0.22, 0, TAU);
  ctx.fill();
  ctx.stroke();
  eyes(ctx, r * 0.55, 0, 0, r, 0.08, 0.12, 0.08, c.mood, c.blink);
  ctx.restore();
}

/* ============================================================================
   Les espèces (en × taille). La tête : voir drawMamHead.
   ============================================================================ */
const MAM = {
  /* ---- Les formes du joueur (et ses rivaux, qui lui ressemblent) ---- */
  musaraigne: {
    ground: 0.6, hip: [-0.55, -0.02], shoulder: [0.38, 0.02], depth: 0.36, midTop: 1.05,
    neck: [[0.56, -0.04, 0.3], [0.66, -0.08, 0.28]],
    head: { x: 0.76, y: -0.13, L: 0.72, D: 0.5, snout: 0.32, ear: 'rond', earR: 0.85, nose: 'chien', noseCol: '#C9727E', eye: [0.12, -0.16], eyeR: 0.14, teeth: true },
    legs: 'patte', legW: 0.09, stride: 0.3, cadence: 2.6,
    tail: { len: 1.5, w: 0.05, droop: 0.25, curl: -0.25, type: 'fine' },
  },
  miacis: {
    ground: 0.62, hip: [-0.62, -0.02], shoulder: [0.45, -0.02], depth: 0.3,
    neck: [[0.66, -0.1, 0.23], [0.78, -0.16, 0.21]],
    head: { x: 0.88, y: -0.2, L: 0.66, D: 0.42, snout: 0.38, ear: 'rond', earR: 0.75, nose: 'chien', eye: [0.16, -0.18], eyeR: 0.13, teeth: true },
    legs: 'patte', legW: 0.09, stride: 0.32, cadence: 2.4,
    tail: { len: 1.5, w: 0.11, droop: 0.35, curl: 0.3, type: 'touffue' }, stripes: 6,
  },
  proailurus: {
    ground: 0.72, hip: [-0.6, -0.08], shoulder: [0.42, -0.08], depth: 0.32,
    neck: [[0.64, -0.18, 0.24], [0.76, -0.26, 0.22]],
    head: { x: 0.88, y: -0.3, L: 0.6, D: 0.44, snout: 0.42, ear: 'pointe', earR: 0.75, nose: 'chat', eye: [0.2, -0.18], eyeR: 0.13, teeth: true, iris: '#C98A2E' },
    legs: 'patte', legW: 0.1, stride: 0.34, cadence: 2.4,
    tail: { len: 1.4, w: 0.075, droop: 0.45, curl: 0.35, type: 'fine' }, spots: 9,
  },
  machairodus: {
    ground: 0.88, hip: [-0.62, -0.2], shoulder: [0.42, -0.22], depth: 0.34, belly: 0.85,
    neck: [[0.66, -0.36, 0.27], [0.8, -0.46, 0.24]],
    head: { x: 0.92, y: -0.5, L: 0.6, D: 0.46, tilt: 0.08, snout: 0.5, ear: 'rond', earR: 0.7, nose: 'chat', eye: [0.18, -0.2], eyeR: 0.11, teeth: true, sabers: 0.5, iris: '#D9A13A' },
    legs: 'patte', legW: 0.12, foreW: 1.05, stride: 0.36, cadence: 2.1,
    tail: { len: 0.95, w: 0.06, droop: 0.9, curl: 0.5, type: 'fine' }, stripes: 7,
  },
  homotherium: {
    ground: 0.92, hip: [-0.6, -0.12], shoulder: [0.42, -0.3], depth: 0.36, hump: 1.08, belly: 0.88,
    neck: [[0.68, -0.46, 0.29], [0.82, -0.56, 0.25]],
    head: { x: 0.95, y: -0.6, L: 0.64, D: 0.46, tilt: 0.06, snout: 0.55, ear: 'petit', earR: 1.3, nose: 'chat', eye: [0.18, -0.2], eyeR: 0.1, teeth: true, sabers: 0.45, iris: '#D9A13A' },
    legs: 'patte', legW: 0.14, foreW: 1.1, stride: 0.38, cadence: 2,
    tail: { len: 0.38, w: 0.07, droop: 1.15, curl: 0.2, type: 'fine' }, stripes: 5,
  },

  /* ---- Chapitre 1 et 2 : après la météorite, la grande forêt ---- */
  eohippus: {
    ground: 0.85, hip: [-0.5, -0.25], shoulder: [0.4, -0.2], depth: 0.32, midTop: 1.1,
    neck: [[0.6, -0.35, 0.2], [0.72, -0.52, 0.16]],
    head: { x: 0.8, y: -0.58, L: 0.6, D: 0.32, tilt: 0.6, snout: 0.7, ear: 'pointe', earR: 0.7, nose: 'cheval', eye: [0.12, -0.2], eyeR: 0.13 },
    legs: 'sabot', legW: 0.07, stride: 0.34, cadence: 2.4,
    tail: { len: 0.5, w: 0.05, droop: 1.0, type: 'fine' }, spots: 9, stripeCol: '#F2E6C8',
  },
  darwinius: {
    ground: 0.7, hip: [-0.45, -0.12], shoulder: [0.35, -0.08], depth: 0.3,
    neck: [[0.52, -0.2, 0.24], [0.62, -0.3, 0.22]],
    head: { x: 0.74, y: -0.38, L: 0.5, D: 0.52, snout: 0.35, ear: 'rond', earR: 0.6, nose: 'chien', eye: [0.18, -0.12], eyeR: 0.2, iris: '#C98A2E' },
    legs: 'patte', legW: 0.08, stride: 0.3, cadence: 2.5,
    tail: { len: 1.7, w: 0.06, droop: 0.15, curl: 0.9, type: 'fine' },
  },
  andrewsarchus: {
    ground: 0.95, hip: [-0.55, -0.28], shoulder: [0.42, -0.36], depth: 0.42, hump: 1.12,
    neck: [[0.66, -0.42, 0.32], [0.8, -0.44, 0.3]],
    head: { x: 0.95, y: -0.42, L: 1.05, D: 0.52, tilt: 0.12, snout: 0.62, jaw: 1.1, ear: 'petit', nose: 'chien', eye: [0.05, -0.25], eyeR: 0.08, teeth: true, iris: '#C77A2A' },
    legs: 'sabot', legW: 0.13, stride: 0.34,
    tail: { len: 0.9, w: 0.09, droop: 0.9, type: 'fine' }, stripes: 6,
  },
  ambulocetus: {
    ground: 0.55, hip: [-0.55, 0.02], shoulder: [0.4, 0.02], depth: 0.32,
    neck: [[0.6, -0.04, 0.28], [0.72, -0.06, 0.26]],
    head: { x: 0.82, y: -0.08, L: 1.05, D: 0.36, tilt: 0.04, snout: 0.45, ear: 'petit', earR: 0.5, nose: 'chien', eye: [0.08, -0.3], eyeR: 0.1, teeth: true, iris: '#C9A13A' },
    legs: 'patte', legW: 0.1, webbed: true, stride: 0.26,
    tail: { len: 1.2, w: 0.14, droop: 0.2, type: 'fine' },
  },

  /* ---- Chapitre 3 : les prairies de l'Oligocène ---- */
  palaeolagus: {
    ground: 0.62, hip: [-0.42, -0.22], shoulder: [0.3, -0.02], depth: 0.4, hipTop: 1.05,
    neck: [[0.48, -0.12, 0.3], [0.56, -0.2, 0.28]],
    head: { x: 0.66, y: -0.3, L: 0.55, D: 0.5, snout: 0.45, ear: 'long', earR: 0.9, nose: 'chien', noseCol: '#C77A7A', eye: [0.12, -0.18], eyeR: 0.15 },
    legs: 'patte', legW: 0.1, stride: 0.3, cadence: 2.8,
    tail: { len: 0.15, w: 0.1, type: 'pompon' },
  },
  mesohippus: {
    ground: 0.95, hip: [-0.5, -0.32], shoulder: [0.42, -0.3], depth: 0.32,
    neck: [[0.62, -0.46, 0.2], [0.76, -0.68, 0.16]],
    head: { x: 0.84, y: -0.74, L: 0.66, D: 0.32, tilt: 0.75, snout: 0.75, ear: 'cheval', nose: 'cheval', eye: [0.12, -0.2], eyeR: 0.12 },
    legs: 'sabot', legW: 0.07, stride: 0.36, cadence: 2.3, mane: true,
    tail: { len: 0.6, w: 0.05, droop: 1.1, type: 'crin' },
  },
  hyaenodon: {
    ground: 0.88, hip: [-0.6, -0.18], shoulder: [0.42, -0.2], depth: 0.34,
    neck: [[0.66, -0.3, 0.26], [0.8, -0.36, 0.24]],
    head: { x: 0.95, y: -0.38, L: 0.85, D: 0.44, snout: 0.5, ear: 'pointe', earR: 0.7, nose: 'chien', eye: [0.1, -0.22], eyeR: 0.09, teeth: true, iris: '#D0A040' },
    legs: 'patte', legW: 0.1, stride: 0.36, cadence: 2.2,
    tail: { len: 1.0, w: 0.08, droop: 0.8, type: 'fine' }, stripes: 5,
  },
  entelodon: {
    ground: 0.95, hip: [-0.5, -0.22], shoulder: [0.38, -0.35], depth: 0.42, hump: 1.3,
    neck: [[0.6, -0.4, 0.34], [0.74, -0.38, 0.32]],
    head: { x: 0.86, y: -0.3, L: 0.95, D: 0.58, tilt: 0.4, snout: 0.7, ear: 'pointe', earR: 0.6, nose: 'groin', eye: [0.05, -0.25], eyeR: 0.07, teeth: true, flanges: true, iris: '#B5452E' },
    legs: 'sabot', legW: 0.1, stride: 0.32,
    tail: { len: 0.45, w: 0.04, droop: 1.2, type: 'touffe' }, ridge: true,
  },
  paraceratherium: {
    ground: 1.15, hip: [-0.5, -0.45], shoulder: [0.42, -0.55], depth: 0.56, hump: 1.08, belly: 0.9,
    neck: [[0.7, -0.85, 0.32], [0.92, -1.12, 0.25]],
    head: { x: 1.05, y: -1.18, L: 0.75, D: 0.36, tilt: 0.55, snout: 0.75, ear: 'cheval', earR: 0.8, nose: 'cheval', eye: [0.1, -0.2], eyeR: 0.1 },
    legs: 'colonne', legW: 0.19, foreW: 0.95, stride: 0.3, cadence: 1.4,
    tail: { len: 0.45, w: 0.04, droop: 1.3, type: 'touffe' }, spots: 0,
  },

  /* ---- Chapitre 4 : la savane du Miocène ---- */
  gazelle: {
    ground: 1.0, hip: [-0.45, -0.4], shoulder: [0.4, -0.38], depth: 0.28,
    neck: [[0.58, -0.52, 0.15], [0.7, -0.75, 0.12]],
    head: { x: 0.78, y: -0.82, L: 0.52, D: 0.26, tilt: 0.55, snout: 0.65, ear: 'pointe', earR: 0.8, nose: 'cheval', horns: 'gazelle', eye: [0.15, -0.2], eyeR: 0.14 },
    legs: 'sabot', legW: 0.055, stride: 0.4, cadence: 2.5,
    tail: { len: 0.25, w: 0.04, droop: 1.0, type: 'touffe' },
  },
  hipparion: {
    ground: 1.0, hip: [-0.5, -0.38], shoulder: [0.42, -0.36], depth: 0.34,
    neck: [[0.62, -0.52, 0.22], [0.78, -0.82, 0.17]],
    head: { x: 0.85, y: -0.88, L: 0.78, D: 0.32, tilt: 0.95, snout: 0.8, ear: 'cheval', nose: 'cheval', eye: [0.12, -0.22], eyeR: 0.1 },
    legs: 'sabot', legW: 0.08, stride: 0.38, cadence: 2.2, mane: true,
    tail: { len: 0.75, w: 0.05, droop: 1.15, type: 'crin' },
  },
  chalicothere: {
    ground: 1.05, hip: [-0.48, -0.15], shoulder: [0.42, -0.42], depth: 0.4, hump: 1.1,
    neck: [[0.62, -0.6, 0.25], [0.76, -0.75, 0.2]],
    head: { x: 0.86, y: -0.8, L: 0.7, D: 0.36, tilt: 0.5, snout: 0.7, ear: 'cheval', nose: 'cheval', eye: [0.12, -0.2], eyeR: 0.1 },
    legs: 'ours', legW: 0.13, claws: true, stride: 0.28, cadence: 1.6,
    tail: { len: 0.35, w: 0.05, droop: 1.2, type: 'touffe' },
  },
  deinotherium: {
    ground: 1.15, hip: [-0.45, -0.32], shoulder: [0.38, -0.4], depth: 0.6, hump: 1.1, hipTop: 0.92,
    neck: [[0.6, -0.55, 0.42], [0.7, -0.6, 0.4]],
    head: { x: 0.82, y: -0.6, L: 0.52, D: 0.66, tilt: 0.3, snout: 0.9, dome: 0.5, ear: 'elephant', earR: 1.25, eye: [0.15, -0.12], eyeR: 0.07, trunk: 0.9, tusks: 'deino', tuskL: 0.6, muzzle: false },
    legs: 'colonne', legW: 0.21, foreW: 1, stride: 0.26, cadence: 1.3,
    tail: { len: 0.45, w: 0.04, droop: 1.3, type: 'touffe' },
  },
  hyene: {
    ground: 0.92, hip: [-0.55, -0.12], shoulder: [0.42, -0.32], depth: 0.36, hump: 1.1,
    neck: [[0.64, -0.42, 0.28], [0.78, -0.48, 0.25]],
    head: { x: 0.92, y: -0.48, L: 0.72, D: 0.48, snout: 0.55, ear: 'rond', earR: 0.75, nose: 'chien', eye: [0.1, -0.22], eyeR: 0.09, teeth: true, jaw: 1.1, iris: '#C98A2E' },
    legs: 'patte', legW: 0.11, stride: 0.34, cadence: 2.2,
    tail: { len: 0.5, w: 0.06, droop: 1.1, type: 'touffe' }, spots: 14, ridge: true,
  },
  amphicyon: {
    ground: 0.95, hip: [-0.58, -0.25], shoulder: [0.42, -0.3], depth: 0.44, hump: 1.08,
    neck: [[0.66, -0.38, 0.32], [0.8, -0.42, 0.3]],
    head: { x: 0.95, y: -0.45, L: 0.85, D: 0.52, snout: 0.55, ear: 'rond', earR: 0.75, nose: 'chien', eye: [0.08, -0.22], eyeR: 0.08, teeth: true, iris: '#C77A2A' },
    legs: 'ours', legW: 0.14, claws: true, stride: 0.32, cadence: 1.8,
    tail: { len: 1.0, w: 0.11, droop: 0.8, type: 'touffue' },
  },

  /* ---- Chapitre 5 : l'âge de glace ---- */
  bison: {
    ground: 0.95, hip: [-0.5, -0.25], shoulder: [0.38, -0.35], depth: 0.45, hump: 1.45, hipTop: 0.85, midTop: 1.08,
    neck: [[0.6, -0.28, 0.42], [0.72, -0.18, 0.38]],
    head: { x: 0.82, y: -0.1, L: 0.6, D: 0.55, tilt: 0.5, snout: 0.7, ear: 'petit', nose: 'cheval', horns: 'bison', beard: true, eye: [0.08, -0.15], eyeR: 0.08, muzzle: false },
    legs: 'sabot', legW: 0.11, stride: 0.3, cadence: 1.9, cape: true, shaggy: 0.12,
    tail: { len: 0.5, w: 0.04, droop: 1.2, type: 'touffe' },
  },
  renne: {
    ground: 1.0, hip: [-0.48, -0.35], shoulder: [0.42, -0.35], depth: 0.34,
    neck: [[0.62, -0.5, 0.22], [0.75, -0.7, 0.18]],
    head: { x: 0.84, y: -0.78, L: 0.6, D: 0.32, tilt: 0.55, snout: 0.75, ear: 'pointe', earR: 0.7, nose: 'cheval', antlers: 'renne', antlerK: 1.25, eye: [0.12, -0.2], eyeR: 0.11 },
    legs: 'sabot', legW: 0.075, stride: 0.38, cadence: 2.2,
    tail: { len: 0.2, w: 0.06, droop: 1, type: 'fine' },
  },
  cheval: {
    ground: 1.0, hip: [-0.5, -0.38], shoulder: [0.42, -0.36], depth: 0.35,
    neck: [[0.62, -0.52, 0.22], [0.78, -0.82, 0.17]],
    head: { x: 0.85, y: -0.88, L: 0.78, D: 0.33, tilt: 0.95, snout: 0.8, ear: 'cheval', nose: 'cheval', eye: [0.12, -0.22], eyeR: 0.1, muzzle: true },
    legs: 'sabot', legW: 0.085, stride: 0.38, cadence: 2.2, mane: true, legCol: '#5A4636',
    tail: { len: 0.75, w: 0.05, droop: 1.15, type: 'crin' },
  },
  megaloceros: {
    ground: 1.05, hip: [-0.48, -0.38], shoulder: [0.44, -0.42], depth: 0.38, hump: 1.15,
    neck: [[0.64, -0.58, 0.25], [0.78, -0.78, 0.2]],
    head: { x: 0.88, y: -0.85, L: 0.62, D: 0.32, tilt: 0.55, snout: 0.75, ear: 'pointe', earR: 0.7, nose: 'cheval', antlers: 'megaceros', antlerK: 1.6, eye: [0.12, -0.2], eyeR: 0.1 },
    legs: 'sabot', legW: 0.09, stride: 0.36, cadence: 2,
    tail: { len: 0.2, w: 0.06, droop: 1, type: 'fine' },
  },
  'rhino-laineux': {
    ground: 0.9, hip: [-0.5, -0.25], shoulder: [0.42, -0.3], depth: 0.48, hump: 1.25, hipTop: 0.92,
    neck: [[0.66, -0.22, 0.38], [0.8, -0.1, 0.33]],
    head: { x: 0.92, y: -0.02, L: 0.75, D: 0.48, tilt: 0.4, snout: 0.75, ear: 'pointe', earR: 0.6, nose: 'cheval', horns: 'rhino', eye: [0.05, -0.12], eyeR: 0.07, muzzle: false },
    legs: 'colonne', legW: 0.15, foreW: 1, stride: 0.26, cadence: 1.6, shaggy: 0.22,
    tail: { len: 0.3, w: 0.04, droop: 1.2, type: 'touffe' },
  },
  mammouth: {
    ground: 1.05, hip: [-0.42, -0.3], shoulder: [0.38, -0.42], depth: 0.6, hump: 1.3, hipTop: 0.85, belly: 0.95,
    neck: [[0.6, -0.62, 0.42], [0.7, -0.66, 0.4]],
    head: { x: 0.86, y: -0.7, L: 0.56, D: 0.85, tilt: 0.35, snout: 0.9, dome: 1, ear: 'elephant', earR: 0.6, eye: [0.15, -0.1], eyeR: 0.07, trunk: 1.25, tusks: 'mammouth', tuskL: 0.85, tuft: true, muzzle: false },
    legs: 'colonne', legW: 0.2, foreW: 1, stride: 0.26, cadence: 1.3, shaggy: 0.3,
    tail: { len: 0.3, w: 0.05, droop: 1.3, type: 'touffe' },
  },
  'lion-des-cavernes': {
    ground: 0.9, hip: [-0.62, -0.22], shoulder: [0.42, -0.25], depth: 0.36, belly: 0.85,
    neck: [[0.66, -0.38, 0.28], [0.8, -0.48, 0.25]],
    head: { x: 0.92, y: -0.52, L: 0.62, D: 0.5, snout: 0.5, ear: 'rond', earR: 0.6, nose: 'chat', eye: [0.2, -0.2], eyeR: 0.1, teeth: true, whiskers: true, iris: '#D9A13A' },
    legs: 'patte', legW: 0.125, foreW: 1.05, stride: 0.38, cadence: 2.1,
    tail: { len: 1.0, w: 0.06, droop: 0.9, curl: 0.5, type: 'touffe' },
  },
  'ours-des-cavernes': {
    ground: 0.92, hip: [-0.55, -0.22], shoulder: [0.38, -0.3], depth: 0.5, hump: 1.2, hipTop: 0.95,
    neck: [[0.62, -0.38, 0.38], [0.76, -0.42, 0.34]],
    head: { x: 0.92, y: -0.42, L: 0.72, D: 0.62, snout: 0.48, dome: 0.5, ear: 'rond', earR: 0.6, nose: 'chien', eye: [0.12, -0.2], eyeR: 0.08, teeth: true, iris: '#5A3418' },
    legs: 'ours', legW: 0.17, foreW: 1, claws: true, stride: 0.3, cadence: 1.7, shaggy: 0.1,
    tail: { len: 0.18, w: 0.06, droop: 1, type: 'fine' },
  },
};

/** Les grands oiseaux coureurs (pattes comme un théropode, voir art-dinos.js) */
const BIRDS = {
  'oiseau-terreur': {
    ground: 1, hip: [-0.2, -0.15], thigh: 0.55, shin: 0.6, meta: 0.42, legW: 0.11, stride: 0.55, lift: 0.18, foot: 0.06, feathers: true, cadence: 2.5,
    body: [[-1.0, -0.42, 0.04, 0.04], [-0.78, -0.32, 0.16, 0.1], [-0.45, -0.18, 0.36, 0.3], [0, -0.15, 0.42, 0.42], [0.32, -0.3, 0.32, 0.28], [0.5, -0.62, 0.15, 0.17], [0.56, -0.95, 0.14, 0.15]],
    head: { x: 0.62, y: -1.05, R: 0.24, beakL: 0.62, beakD: 0.42 }, beakCol: '#D9A441', crest: true, wing: 0.3,
  },
  gastornis: {
    ground: 1, hip: [-0.2, -0.05], thigh: 0.5, shin: 0.48, meta: 0.3, legW: 0.15, stride: 0.45, lift: 0.14, foot: 0.06, feathers: true, cadence: 2,
    body: [[-0.95, -0.3, 0.05, 0.05], [-0.75, -0.25, 0.22, 0.15], [-0.42, -0.12, 0.45, 0.4], [0, -0.1, 0.5, 0.5], [0.3, -0.3, 0.38, 0.32], [0.45, -0.62, 0.2, 0.2], [0.5, -0.88, 0.18, 0.18]],
    head: { x: 0.58, y: -0.96, R: 0.28, beakL: 0.55, beakD: 0.62 }, beakCol: '#E2B33C', wing: 0.36,
  },
};

/* ---------- Les looks, la position de la gueule, le cadrage des vignettes ---------- */
for (const [id, P] of Object.entries(MAM)) {
  LOOKS[id] = (ctx, c, t) => drawMammal(ctx, c, t, P, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
  SIDE[id] = mamMouth(P.head);
  const tall = -(P.head.y - P.head.D * 0.6);
  FRAMES[id] = tall > 1.1 ? { r: 0.13, x: 0.46, y: 0.66 } : tall > 0.75 ? { r: 0.155, x: 0.47, y: 0.62 } : { r: 0.18, x: 0.47, y: 0.56 };
}
FRAMES.megaloceros = { r: 0.13, x: 0.5, y: 0.72 };
FRAMES.mammouth = { r: 0.15, x: 0.45, y: 0.62 };
for (const [id, P] of Object.entries(BIRDS)) {
  LOOKS[id] = (ctx, c, t) => drawRunnerBird(ctx, c, t, P, c.sp.color);
  const H = P.head;
  SIDE[id] = [+(H.x + H.R * 0.5 + H.beakL * 0.9).toFixed(2), +(H.y + H.beakD * 0.2).toFixed(2)];
  FRAMES[id] = { r: 0.15, x: 0.45, y: 0.62 };
}
LOOKS.titanoboa = drawSnake;
SPINES.titanoboa = { n: 12, gap: 0.42 };
SNOUT.titanoboa = 0.55;
FRAMES.titanoboa = { r: 0.14, x: 0.7, y: 0.35 };
LOOKS.oiseau = drawFlyingBird;
FRAMES.oiseau = { r: 0.2, x: 0.55, y: 0.5 };

/* ============================================================================
   Le joueur : cinq silhouettes, de la musaraigne au tigre à dents de sabre.
   Les évolutions se voient : moustaches, fourrure, grandes oreilles, griffes,
   gros nez (flair), dents de sabre de plus en plus longues, longs poils.
   ============================================================================ */
for (const form of ['musaraigne', 'miacis', 'proailurus', 'machairodus', 'homotherium']) {
  const B = MAM[form];
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const H = { ...B.head };
    if (parts.oreilles) H.earR = (H.earR || 1) * 1.3;
    if (H.sabers) H.sabers *= (parts['dents-de-sabre'] ? 1.3 : 1) * (parts['grands-sabres'] ? 1.45 : 1);
    const P = {
      ...B, head: H,
      claws: !!parts.griffes,
      shaggy: parts['fourrure-epaisse'] ? 0.13 : 0,
      tail: { ...B.tail, w: B.tail.w * (parts.fourrure ? 1.25 : 1) },
    };
    drawMammal(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, P, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.3),
      cute: true, whiskers: !!parts.moustaches, fluffy: !!parts.fourrure, bigNose: !!parts.flair,
    });
  };
  FORM_SPINE[form] = null;
  FRAMES[form] = { r: 0.18, x: 0.47, y: 0.56 };
}

/* ============================================================================
   Le décor des mammifères (vu de dessus, comme le reste du sol)
   ============================================================================ */
/** Une ombre ronde et douce au sol (sous les herbes, les arbres) */
function paintShade(ctx, d) {
  const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
  g.addColorStop(0, 'rgba(30, 45, 10, 0.45)');
  g.addColorStop(1, 'rgba(30, 45, 10, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, TAU);
  ctx.fill();
}

/** Des touffes de hautes herbes (cols = les couleurs des brins) */
function grassPainter(cols) {
  return (ctx, d) => {
    const rnd = seeded(d.seed);
    ctx.lineCap = 'round';
    const tufts = 6 + (d.v % 3);
    for (let i = 0; i < tufts; i++) {
      const a0 = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.6;
      const bx = d.x + Math.cos(a0) * rr, by = d.y + Math.sin(a0) * rr;
      const n = 14 + Math.floor(rnd() * 6);
      for (let k = 0; k < n; k++) {
        const a = rnd() * TAU;
        const len = d.r * (0.22 + rnd() * 0.25);
        const bend = (rnd() - 0.5) * 0.8;
        ctx.strokeStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.lineWidth = Math.max(1.5, d.r * 0.03);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + Math.cos(a) * len * 0.6, by + Math.sin(a) * len * 0.6, bx + Math.cos(a + bend) * len, by + Math.sin(a + bend) * len);
        ctx.stroke();
      }
    }
  };
}
const paintGrass = grassPainter(['#B9B04A', '#9FA43C', '#C9BC5C', '#82963A', '#D6C46E']);
const paintFrostGrass = grassPainter(['#C9C4A0', '#B5B88E', '#E4E2CF', '#A8A77A', '#F2F2EA']);

DECORS.herbes = (ctx, d) => drawSprite(ctx, d, 'ombre-herbes', 0, paintShade, 0, 1);
COVERS.herbes = (ctx, d, t) => drawSprite(ctx, d, 'herbes', d.seed % 4, paintGrass, turnOf(d) + Math.sin(t * 1.1 + d.seed) * 0.03);
DECORS['herbes-gel'] = DECORS.herbes;
COVERS['herbes-gel'] = (ctx, d, t) => drawSprite(ctx, d, 'herbes-gel', d.seed % 4, paintFrostGrass, turnOf(d) + Math.sin(t * 1.1 + d.seed) * 0.03);

/** Un terrier : on s'y cache. Le trou dessous, le tas de terre par-dessus (on voit qui est dedans) */
DECORS.terrier = (ctx, d) => {
  const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 0.62);
  g.addColorStop(0, '#1A120B');
  g.addColorStop(1, '#4A3522');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.62, 0, TAU);
  ctx.fill();
};
function paintMound(ctx, d) {
  const rnd = seeded(d.seed);
  ctx.fillStyle = '#7A5A38';
  ctx.strokeStyle = '#4A3522';
  ctx.lineWidth = Math.max(2, d.r * 0.04);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, TAU);
  ctx.arc(d.x, d.y, d.r * 0.6, 0, TAU, true);
  ctx.fill('evenodd');
  ctx.stroke();
  // des cailloux et des mottes de terre
  for (let i = 0; i < 14; i++) {
    const a = rnd() * TAU, rr = d.r * (0.68 + rnd() * 0.25);
    ctx.fillStyle = rnd() < 0.5 ? '#8E6C45' : '#5F4630';
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr, d.r * (0.04 + rnd() * 0.05), 0, TAU);
    ctx.fill();
  }
}
COVERS.terrier = (ctx, d) => drawSprite(ctx, d, 'terrier', d.seed % 3, paintMound, turnOf(d), 1.1);

/** Le tronc, vu d'en haut, et son ombre au sol */
function stump(ctx, d, col) {
  ctx.fillStyle = 'rgba(10, 30, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(d.x + d.r * 0.5, d.y + d.r * 0.7, d.r * 1.05, d.r * 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.strokeStyle = shade(col, -0.45);
  ctx.lineWidth = Math.max(2, d.r * 0.04);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.18, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

function paintLeafy(ctx, d) {
  // un grand arbre à feuilles : des bouquets ronds qui se chevauchent
  const rnd = seeded(d.seed);
  const lobes = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * TAU + rnd() * 0.4, k = i === 0 ? 0 : 0.45 + rnd() * 0.15;
    return { x: d.x + Math.cos(a) * d.r * k, y: d.y + Math.sin(a) * d.r * k, r: d.r * (0.4 + rnd() * 0.15) };
  });
  ctx.fillStyle = '#2C5A28';
  for (const l of lobes) {
    ctx.beginPath();
    ctx.arc(l.x + d.r * 0.04, l.y + d.r * 0.05, l.r, 0, TAU);
    ctx.fill();
  }
  for (const l of lobes) {
    const g = ctx.createRadialGradient(l.x - l.r * 0.35, l.y - l.r * 0.35, l.r * 0.1, l.x, l.y, l.r);
    g.addColorStop(0, '#7DBB4E');
    g.addColorStop(1, '#3B7A33');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r * 0.92, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 255, 210, 0.14)';
  for (let i = 0; i < 18; i++) {
    const a = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.8;
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * rr - d.r * 0.1, d.y + Math.sin(a) * rr - d.r * 0.1, d.r * 0.06, 0, TAU);
    ctx.fill();
  }
}
DECORS.feuillu = (ctx, d) => stump(ctx, d, '#6B4F35');
COVERS.feuillu = (ctx, d, t) => drawSprite(ctx, d, 'feuillu', d.seed % 4, paintLeafy, Math.sin(t * 0.6 + d.seed) * 0.02, 1.25);

function paintPalm(ctx, d) {
  // un palmier : de grandes palmes en étoile
  const rnd = seeded(d.seed);
  const n = 9;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd() * 0.3;
    const len = d.r * (0.85 + rnd() * 0.15);
    const ex = d.x + Math.cos(a) * len, ey = d.y + Math.sin(a) * len;
    ctx.strokeStyle = '#4E7A2C';
    ctx.lineWidth = Math.max(1.5, d.r * 0.035);
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = i % 2 ? '#5E9A35' : '#6FAE3E';
    ctx.lineWidth = Math.max(1.5, d.r * 0.05);
    ctx.beginPath();
    for (let j = 1; j <= 9; j++) {
      const u = j / 10;
      const px = d.x + (ex - d.x) * u, py = d.y + (ey - d.y) * u;
      const l = d.r * 0.22 * Math.sin(u * Math.PI);
      for (const s of [-1, 1]) {
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a + s * 1.0) * l, py + Math.sin(a + s * 1.0) * l);
      }
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#7A5A30';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.08, 0, TAU);
  ctx.fill();
}
DECORS.palmier = (ctx, d) => stump(ctx, d, '#7A5A30');
COVERS.palmier = (ctx, d, t) => drawSprite(ctx, d, 'palmier', d.seed % 3, paintPalm, turnOf(d) + Math.sin(t * 0.8 + d.seed) * 0.03, 1.1);

function paintSnowFir(ctx, d) {
  // un sapin couvert de neige : des étages d'aiguilles, de la neige sur le dessus
  const rnd = seeded(d.seed);
  for (const [k, col] of [[1, '#1F4430'], [0.72, '#2A5A3C'], [0.45, '#346B47']]) {
    ctx.fillStyle = col;
    ctx.strokeStyle = 'rgba(10, 30, 20, 0.5)';
    ctx.lineWidth = Math.max(1.5, d.r * 0.02);
    ctx.beginPath();
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU + d.v;
      const rr = d.r * k * (i % 2 ? 0.72 : 1);
      const x = d.x + Math.cos(a) * rr, y = d.y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(245, 250, 255, 0.92)';
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.85;
    ctx.beginPath();
    ctx.ellipse(d.x + Math.cos(a) * rr - d.r * 0.05, d.y + Math.sin(a) * rr - d.r * 0.05, d.r * (0.06 + rnd() * 0.08), d.r * (0.04 + rnd() * 0.05), a, 0, TAU);
    ctx.fill();
  }
}
DECORS['sapin-neige'] = (ctx, d) => stump(ctx, d, '#4E3A28');
COVERS['sapin-neige'] = (ctx, d, t) => drawSprite(ctx, d, 'sapin-neige', d.seed % 3, paintSnowFir, Math.sin(t * 0.6 + d.seed) * 0.02, 1.1);

/** Une congère : on s'enfonce dans la neige profonde, on avance tout doucement */
DECORS.neige = (ctx, d, t) => {
  ctx.fillStyle = 'rgba(120, 150, 185, 0.35)';
  smoothClosed(ctx, blob(d, 1.08));
  ctx.fill();
  const g = ctx.createRadialGradient(d.x - d.r * 0.25, d.y - d.r * 0.25, d.r * 0.1, d.x, d.y, d.r);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(1, '#D6E4F0');
  ctx.fillStyle = g;
  smoothClosed(ctx, blob(d));
  ctx.fill();
  ctx.strokeStyle = 'rgba(140, 170, 200, 0.6)';
  ctx.lineWidth = Math.max(2, d.r * 0.025);
  ctx.stroke();
  // ça scintille
  for (let i = 0; i < 5; i++) {
    const k = (Math.sin(t * 2 + i * 1.7 + d.seed) + 1) / 2;
    const a = d.seed * 0.3 + i * 1.3;
    const x = d.x + Math.cos(a) * d.r * 0.5, y = d.y + Math.sin(a) * d.r * 0.45;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + k * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, d.r * 0.015 + k * d.r * 0.012, 0, TAU);
    ctx.fill();
  }
};
