// ============================================================================
// Dessins de la terre ferme (niveau 2), ajoutés aux registres de art.js :
// le joueur en tétrapode, en reptile et en dinosaure ; insectes, scorpions,
// libellules et reptiles volants, lézards, dinosaures à deux et à quatre
// pattes, sauropodes ; et le décor : mares, boue, fougères, arbres, os, nids…
// Les pattes bougent au rythme de la marche (e.walk, avancé par script.js).
// ============================================================================

import {
  INK, PLAYER, LOOKS, FORMS, DECORS, COVERS, FRAMES, FORM_SPINE, SPINES,
  shade, seeded, spineShape, smoothClosed, segDir, shadow, eyes, mouth,
} from './art.js';

const TAU = Math.PI * 2;

/* ---------- Colonnes des corps (nombre de points, écart en × taille) ---------- */
Object.assign(SPINES, {
  millepattes: { n: 9, gap: 0.3 },
  scorpion: { n: 6, gap: 0.32 },
});
// les formes vues de profil n'ont pas besoin de colonne
Object.assign(FORM_SPINE, { tetrapode: null, reptile: null, dino: null });

/* ---------- Petits outils ---------- */
const dirAt = (pts, i) => segDir(pts, i);
const angAt = (pts, i) => { const d = segDir(pts, i); return Math.atan2(d.y, d.x); };

/**
 * Une patte vue de dessus : de la hanche (hx, hy) vers l'extérieur ; elle
 * avance et recule avec phase. side = -1 / +1.
 */
function leg(ctx, hx, hy, ang, side, len, w, phase, col, dark, claws = true) {
  const fx = Math.cos(ang), fy = Math.sin(ang);
  const nx = -fy * side, ny = fx * side;
  const swing = Math.sin(phase);
  const lift = Math.max(0, Math.cos(phase)) * 0.15;
  const fxp = hx + nx * len * (0.75 - lift) + fx * len * 0.55 * swing;
  const fyp = hy + ny * len * (0.75 - lift) + fy * len * 0.55 * swing;
  const kx = hx + nx * len * 0.6 + fx * len * 0.1 * swing;
  const ky = hy + ny * len * 0.6 + fy * len * 0.1 * swing;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = w * 1.35;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.quadraticCurveTo(kx, ky, fxp, fyp);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.quadraticCurveTo(kx, ky, fxp, fyp);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, w * 0.18);
  ctx.beginPath();
  ctx.arc(fxp, fyp, w * 0.8, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (claws) {
    ctx.strokeStyle = '#F4ECD8';
    ctx.lineWidth = Math.max(0.8, w * 0.22);
    for (const k of [-0.5, 0, 0.5]) {
      const a = ang + k * 0.6;
      ctx.beginPath();
      ctx.moveTo(fxp + Math.cos(a) * w * 0.5, fyp + Math.sin(a) * w * 0.5);
      ctx.lineTo(fxp + Math.cos(a) * w * 1.15, fyp + Math.sin(a) * w * 1.15);
      ctx.stroke();
    }
  }
}

/* ============================================================================
   Les arthropodes : insectes, blattes, mille-pattes, scorpions, libellules
   ============================================================================ */
function drawInsect(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  const dark = shade(col, -0.5);
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.5, r * 1.1, r * 0.6, c.angle);
  const ph = (c.walk || 0) * 3;
  // six pattes
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.7, r * 0.14);
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    for (const s of [-1, 1]) {
      const sw = Math.sin(ph + i * 2 + (s > 0 ? Math.PI : 0)) * 0.4;
      const bx = c.x + fx * r * i * 0.4, by = c.y + fy * r * i * 0.4;
      const a = c.angle + s * (Math.PI / 2) + (i * 0.5 + sw) * s * -1;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a) * r * 1.1, by + Math.sin(a) * r * 1.1);
      ctx.stroke();
    }
  }
  // antennes
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(c.x + fx * r * 0.9, c.y + fy * r * 0.9);
    ctx.quadraticCurveTo(c.x + fx * r * 1.5 - fy * r * 0.4 * s, c.y + fy * r * 1.5 + fx * r * 0.4 * s, c.x + fx * r * 1.9 - fy * r * 0.8 * s, c.y + fy * r * 1.9 + fx * r * 0.8 * s);
    ctx.stroke();
  }
  // tête, thorax, abdomen
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, r * 0.1);
  for (const [k, rx, ry, l] of [[-0.55, 0.7, 0.5, 0], [0.2, 0.4, 0.38, 0.1], [0.8, 0.32, 0.3, 0.2]]) {
    ctx.fillStyle = shade(col, l);
    ctx.beginPath();
    ctx.ellipse(c.x + fx * r * k, c.y + fy * r * k, r * rx, r * ry, c.angle, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(c.x - fx * r * 0.6, c.y - fy * r * 0.6 - r * 0.15, r * 0.3, r * 0.12, c.angle, 0, TAU);
  ctx.fill();
  eyes(ctx, c.x, c.y, c.angle, r, 0.85, 0.2, 0.14, c.mood, c.blink);
}

function drawBlatte(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  const dark = shade(col, -0.5);
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.5, r * 1.2, r * 0.7, c.angle);
  const ph = (c.walk || 0) * 3;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.7, r * 0.1);
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    for (const s of [-1, 1]) {
      const sw = Math.sin(ph + i * 2 + (s > 0 ? Math.PI : 0)) * 0.35;
      const bx = c.x + fx * r * i * 0.45, by = c.y + fy * r * i * 0.45;
      const a = c.angle + s * (Math.PI / 2) - (i * 0.6 + sw) * s;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a) * r * 1.15, by + Math.sin(a) * r * 1.15);
      ctx.stroke();
    }
  }
  for (const s of [-1, 1]) {
    const wig = Math.sin(t * 6 + s) * 0.2;
    ctx.beginPath();
    ctx.moveTo(c.x + fx * r * 0.9, c.y + fy * r * 0.9);
    ctx.quadraticCurveTo(c.x + fx * r * 2 - fy * r * 0.5 * s, c.y + fy * r * 2 + fx * r * 0.5 * s,
      c.x + fx * r * (2.6 + wig) - fy * r * 1.1 * s, c.y + fy * r * (2.6 + wig) + fx * r * 1.1 * s);
    ctx.stroke();
  }
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.7, r * 0.1);
  ctx.beginPath();
  ctx.ellipse(c.x - fx * r * 0.1, c.y - fy * r * 0.1, r * 1.05, r * 0.62, c.angle, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // les ailes repliées
  ctx.beginPath();
  ctx.moveTo(c.x + fx * r * 0.5, c.y + fy * r * 0.5);
  ctx.lineTo(c.x - fx * r * 1.05, c.y - fy * r * 1.05);
  ctx.stroke();
  ctx.fillStyle = shade(col, 0.25);
  ctx.beginPath();
  ctx.ellipse(c.x + fx * r * 0.7, c.y + fy * r * 0.7, r * 0.35, r * 0.4, c.angle, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(c.x - fx * r * 0.3 - fy * r * 0.2, c.y - fy * r * 0.3 + fx * r * 0.2, r * 0.55, r * 0.14, c.angle, 0, TAU);
  ctx.fill();
  eyes(ctx, c.x, c.y, c.angle, r, 0.85, 0.2, 0.13, c.mood, c.blink);
}

function drawMillepattes(ctx, c, t) {
  const pts = c.spine;
  const r = c.size;
  const col = c.sp.color;
  const dark = shade(col, -0.5);
  const n = pts.length;
  const giant = r > 60;
  const head = pts[0];
  shadow(ctx, head.x + r * 0.3, head.y + r * 0.5, r * 1.3, r * 0.6, c.angle);
  const ph = (c.walk || 0) * 4;
  // une paire de pattes par segment, qui ondule en vague
  ctx.strokeStyle = dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.07;
  for (let i = 1; i < n; i++) {
    const d = dirAt(pts, i);
    const w = r * (giant ? 0.42 : 0.32);
    for (const s of [-1, 1]) {
      const sw = Math.sin(ph - i * 0.9 + (s > 0 ? Math.PI : 0)) * 0.35;
      const nx = -d.y * s, ny = d.x * s;
      ctx.beginPath();
      ctx.moveTo(pts[i].x + nx * w * 0.6, pts[i].y + ny * w * 0.6);
      ctx.lineTo(pts[i].x + nx * w * 1.5 + d.x * w * sw, pts[i].y + ny * w * 1.5 + d.y * w * sw);
      ctx.stroke();
    }
  }
  // segments ronds
  for (let i = n - 1; i >= 0; i--) {
    const w = r * (giant ? 0.42 : 0.32) * (i === 0 ? 0.9 : 1);
    ctx.fillStyle = i % 2 ? col : shade(col, 0.12);
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.beginPath();
    if (giant) {
      const a = angAt(pts, i);
      ctx.ellipse(pts[i].x, pts[i].y, w * 0.55, w * 1.15, a, 0, TAU);
    } else {
      ctx.arc(pts[i].x, pts[i].y, w, 0, TAU);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(pts[i].x - w * 0.25, pts[i].y - w * 0.3, w * 0.35, 0, TAU);
    ctx.fill();
  }
  // antennes
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  ctx.strokeStyle = dark;
  ctx.lineWidth = r * 0.05;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(head.x + fx * r * 0.2, head.y + fy * r * 0.2);
    ctx.lineTo(head.x + fx * r * 0.9 - fy * r * 0.4 * s, head.y + fy * r * 0.9 + fx * r * 0.4 * s);
    ctx.stroke();
  }
  eyes(ctx, head.x, head.y, c.angle, r, 0.1, 0.16, 0.1, c.mood, c.blink);
}

function drawScorpion(ctx, c, t) {
  const pts = c.spine;
  const r = c.size;
  const col = c.sp.color;
  const dark = shade(col, -0.5);
  const head = pts[0];
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  shadow(ctx, head.x + r * 0.3, head.y + r * 0.5, r * 1.3, r * 0.7, c.angle);
  const ph = (c.walk || 0) * 3;
  // huit pattes
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) {
      leg(ctx, head.x - fx * r * (0.05 + k * 0.18), head.y - fy * r * (0.05 + k * 0.18), c.angle - s * 0.25 * (k - 1.5), s, r * 0.7, r * 0.07, ph + k * 1.4 + (s > 0 ? Math.PI : 0), shade(col, 0.1), dark, false);
    }
  }
  // la queue : des anneaux qui se terminent par le dard
  for (let i = pts.length - 1; i >= 2; i--) {
    const w = r * (0.2 - (i - 2) * 0.015);
    ctx.fillStyle = shade(col, i % 2 ? 0 : 0.1);
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, w, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  const tail = pts[pts.length - 1], td = dirAt(pts, pts.length - 1);
  const sting = Math.sin(t * 4) * 0.3 + (c.mood === 'angry' ? 0.4 : 0);
  const sa = Math.atan2(-td.y, -td.x) + sting;
  ctx.fillStyle = '#E8B04A';
  ctx.beginPath();
  ctx.ellipse(tail.x + Math.cos(sa) * r * 0.22, tail.y + Math.sin(sa) * r * 0.22, r * 0.2, r * 0.13, sa, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(tail.x + Math.cos(sa) * r * 0.38 - Math.sin(sa) * r * 0.06, tail.y + Math.sin(sa) * r * 0.38 + Math.cos(sa) * r * 0.06);
  ctx.lineTo(tail.x + Math.cos(sa + 0.5) * r * 0.62, tail.y + Math.sin(sa + 0.5) * r * 0.62);
  ctx.lineTo(tail.x + Math.cos(sa) * r * 0.38 + Math.sin(sa) * r * 0.06, tail.y + Math.sin(sa) * r * 0.38 - Math.cos(sa) * r * 0.06);
  ctx.fill();
  // corps
  const widths = [r * 0.42, r * 0.4, r * 0.3, r * 0.2, r * 0.18, r * 0.16];
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.06);
  smoothClosed(ctx, spineShape(pts.slice(0, 3), widths.slice(0, 3), 0.6));
  ctx.fill();
  ctx.stroke();
  // les pinces devant
  const pinch = 0.25 + c.mouth * 0.45 + Math.sin(t * 3) * 0.05;
  for (const s of [-1, 1]) {
    const bx = head.x + fx * r * 0.35 - fy * r * 0.25 * s, by = head.y + fy * r * 0.35 + fx * r * 0.25 * s;
    const ex = bx + Math.cos(c.angle - s * 0.5) * r * 0.45, ey = by + Math.sin(c.angle - s * 0.5) * r * 0.45;
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.11;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = shade(col, 0.15);
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.ellipse(ex + Math.cos(c.angle) * r * 0.18, ey + Math.sin(c.angle) * r * 0.18, r * 0.26, r * 0.15, c.angle, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.06;
    for (const k of [-1, 1]) {
      const a = c.angle + k * pinch;
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(c.angle) * r * 0.35, ey + Math.sin(c.angle) * r * 0.35);
      ctx.lineTo(ex + Math.cos(c.angle) * r * 0.35 + Math.cos(a) * r * 0.25, ey + Math.sin(c.angle) * r * 0.35 + Math.sin(a) * r * 0.25);
      ctx.stroke();
    }
  }
  eyes(ctx, head.x, head.y, c.angle, r, 0.18, 0.13, 0.11, c.mood, c.blink);
}

/** Les animaux volants : une ombre décalée au sol (ils sont haut dans le ciel) */
function flyShadow(ctx, c, rx, ry) {
  ctx.fillStyle = 'rgba(0, 20, 10, 0.18)';
  ctx.beginPath();
  ctx.ellipse(c.x + c.size * 1.2, c.y + c.size * 1.8, rx, ry, c.angle, 0, TAU);
  ctx.fill();
}

function drawLibellule(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  flyShadow(ctx, c, r * 1.4, r * 0.9);
  // quatre ailes transparentes qui battent très vite
  const flap = Math.sin(t * 40 + c.seed) * 0.18;
  for (const [k, len] of [[0.25, 1.35], [-0.2, 1.25]]) {
    for (const s of [-1, 1]) {
      const a = c.angle + s * (Math.PI / 2 - 0.15 + flap * s);
      const bx = c.x + fx * r * k, by = c.y + fy * r * k;
      ctx.fillStyle = 'rgba(220, 245, 255, 0.45)';
      ctx.strokeStyle = 'rgba(40, 80, 110, 0.6)';
      ctx.lineWidth = Math.max(0.8, r * 0.03);
      ctx.beginPath();
      ctx.ellipse(bx + Math.cos(a) * r * len * 0.55, by + Math.sin(a) * r * len * 0.55, r * len * 0.55, r * 0.2, a, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a) * r * len, by + Math.sin(a) * r * len);
      ctx.stroke();
    }
  }
  // long abdomen
  ctx.strokeStyle = shade(col, -0.4);
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x - fx * r * 1.7, c.y - fy * r * 1.7);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = r * 0.15;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x - fx * r * 1.65, c.y - fy * r * 1.65);
  ctx.stroke();
  ctx.strokeStyle = shade(col, -0.35);
  ctx.lineWidth = r * 0.05;
  for (let i = 1; i <= 6; i++) {
    const px = c.x - fx * r * 0.25 * i, py = c.y - fy * r * 0.25 * i;
    ctx.beginPath();
    ctx.moveTo(px - fy * r * 0.08, py + fx * r * 0.08);
    ctx.lineTo(px + fy * r * 0.08, py - fx * r * 0.08);
    ctx.stroke();
  }
  ctx.fillStyle = shade(col, 0.15);
  ctx.strokeStyle = shade(col, -0.45);
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.ellipse(c.x + fx * r * 0.1, c.y + fy * r * 0.1, r * 0.32, r * 0.22, c.angle, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // grosse tête avec des yeux énormes
  eyes(ctx, c.x, c.y, c.angle, r, 0.45, 0.18, 0.2, c.mood, c.blink);
  if (c.mouth > 0.2) mouth(ctx, c.x + fx * r * 0.62, c.y + fy * r * 0.62, c.angle, r * 0.14, c.mouth, null);
}

function drawPterosaure(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const big = r > 120;
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  const dark = shade(col, -0.45);
  flyShadow(ctx, c, r * 1.8, r * 0.6);
  const flap = Math.sin(t * (big ? 3 : 8) + c.seed) * 0.35;
  // ailes en membrane
  for (const s of [-1, 1]) {
    const nx = -fy * s, ny = fx * s;
    const tipx = c.x + nx * r * 2.1 * (1 - Math.abs(flap) * 0.3) - fx * r * 0.2, tipy = c.y + ny * r * 2.1 * (1 - Math.abs(flap) * 0.3) - fy * r * 0.2;
    ctx.fillStyle = shade(col, -0.1);
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(c.x + fx * r * 0.25, c.y + fy * r * 0.25);
    ctx.quadraticCurveTo(c.x + nx * r * 1.2 + fx * r * (0.5 + flap * 0.5), c.y + ny * r * 1.2 + fy * r * (0.5 + flap * 0.5), tipx, tipy);
    ctx.quadraticCurveTo(c.x + nx * r * 1.1 - fx * r * 0.5, c.y + ny * r * 1.1 - fy * r * 0.5, c.x - fx * r * 0.55, c.y - fy * r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(tipx, tipy);
    ctx.stroke();
  }
  // queue (palette pour le Rhamphorhynchus)
  if (!big) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x - fx * r * 1.6, c.y - fy * r * 1.6);
    ctx.stroke();
    ctx.fillStyle = '#E2574C';
    ctx.beginPath();
    const tx = c.x - fx * r * 1.7, ty = c.y - fy * r * 1.7;
    ctx.moveTo(tx + fx * r * 0.2, ty + fy * r * 0.2);
    ctx.lineTo(tx - fy * r * 0.18, ty + fx * r * 0.18);
    ctx.lineTo(tx - fx * r * 0.2, ty - fy * r * 0.2);
    ctx.lineTo(tx + fy * r * 0.18, ty - fx * r * 0.18);
    ctx.closePath();
    ctx.fill();
  }
  // corps
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.ellipse(c.x - fx * r * 0.1, c.y - fy * r * 0.1, r * 0.55, r * 0.3, c.angle, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // tête au long bec, avec une crête
  const hx = c.x + fx * r * 0.55, hy = c.y + fy * r * 0.55;
  ctx.fillStyle = shade(col, 0.1);
  ctx.beginPath();
  ctx.moveTo(hx - fy * r * 0.15, hy + fx * r * 0.15);
  ctx.lineTo(hx + fx * r * (big ? 1.5 : 0.9), hy + fy * r * (big ? 1.5 : 0.9));
  ctx.lineTo(hx + fy * r * 0.15, hy - fx * r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (big) {
    ctx.fillStyle = '#E2574C';
    ctx.beginPath();
    ctx.ellipse(hx - fx * r * 0.25, hy - fy * r * 0.25, r * 0.4, r * 0.1, c.angle, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = shade(col, 0.15);
  ctx.beginPath();
  ctx.arc(hx, hy, r * 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  eyes(ctx, hx, hy, c.angle, r, 0.02, 0.13, 0.1, c.mood, c.blink);
}

/* ============================================================================
   Les vertébrés de la terre ferme sont dessinés DE PROFIL (bien plus
   reconnaissables qu'en vue de dessus) : ils regardent à gauche ou à droite
   selon leur direction (c.face), avec une ombre au sol. Repère local : tourné
   vers la droite, (0, 0) = le milieu du corps, les pieds en bas.
   ============================================================================ */

/** Où est la gueule, en × taille, pour chaque look ou forme vue de profil (utilisé par script.js) */
export const SIDE = {
  lezard: [1.05, 0.05],
  theropode: [1.35, -0.55],
  quadrupede: [1.45, 0.15],
  sauropode: [1.95, -2.05],
  tetrapode: [1.0, 0.05],
  reptile: [1.05, 0.05],
  dino: [1.35, -0.55],
};

function sideStart(ctx, c) {
  const face = c.face || (Math.cos(c.angle) >= 0 ? 1 : -1);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  return face;
}

function groundShadow(ctx, x0, x1, y, r) {
  ctx.fillStyle = 'rgba(0, 25, 15, 0.22)';
  ctx.beginPath();
  ctx.ellipse((x0 + x1) / 2, y, (x1 - x0) / 2, r * 0.22, 0, 0, TAU);
  ctx.fill();
}

/** Un œil de profil (il regarde vers l'avant), avec le sourcil de l'humeur */
function sideEye(ctx, x, y, r, mood, blink, iris = INK) {
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.8, r * 0.22);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * (1 - blink * 0.9), 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (blink < 0.6) {
    const pr = r * (mood === 'scared' ? 0.36 : 0.55);
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(x + r * 0.3, y + r * 0.05, pr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + r * 0.15, y - r * 0.15, pr * 0.35, 0, TAU);
    ctx.fill();
  }
  if (mood === 'angry' || mood === 'scared') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, r * 0.4);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (mood === 'angry') { ctx.moveTo(x - r * 0.9, y - r * 1.45); ctx.lineTo(x + r * 1, y - r * 0.85); } else { ctx.moveTo(x - r * 0.9, y - r * 0.95); ctx.lineTo(x + r * 0.9, y - r * 1.5); }
    ctx.stroke();
  }
}

/** Une patte de profil : de la hanche jusqu'au sol, qui avance et recule en marchant */
function sideLeg(ctx, hx, hy, groundY, w, phase, col, dark, o = {}) {
  const len = groundY - hy;
  const swing = Math.sin(phase);
  const lift = Math.max(0, Math.cos(phase)) * len * 0.18;
  const fx = hx + swing * len * 0.42, fy = groundY - lift;
  const bend = o.bend ?? 1;
  const kx = (hx + fx) / 2 + w * 0.9 * bend, ky = (hy + fy) / 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = w * 1.3;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.quadraticCurveTo(kx, ky, fx, fy);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.quadraticCurveTo(kx, ky, fx, fy);
  ctx.stroke();
  // le pied, et ses griffes
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, w * 0.16);
  ctx.beginPath();
  ctx.ellipse(fx + w * 0.35, fy - w * 0.1, w * (o.pillar ? 0.75 : 0.9), w * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (o.claws !== false) {
    ctx.fillStyle = '#F4ECD8';
    for (const k of [0.1, 0.55, 1]) {
      ctx.beginPath();
      ctx.moveTo(fx + w * (0.3 + k * 0.6), fy - w * 0.25);
      ctx.lineTo(fx + w * (0.55 + k * 0.6), fy + w * 0.05);
      ctx.lineTo(fx + w * (0.25 + k * 0.6), fy + w * 0.12);
      ctx.fill();
    }
  }
}

/** Une gueule de profil : mâchoire du haut fixe, mâchoire du bas qui s'ouvre */
function sideJaw(ctx, hx, hy, len, h, open, col, dark, lw, teeth = true, beak = false) {
  const a = open * 0.55;
  // l'intérieur de la gueule
  if (open > 0.05) {
    ctx.fillStyle = '#6E2233';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + len * 0.95, hy);
    ctx.lineTo(hx + Math.cos(a) * len * 0.9, hy + Math.sin(a) * len * 0.9);
    ctx.closePath();
    ctx.fill();
  }
  // mâchoire du bas
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(a);
  ctx.fillStyle = shade(col, -0.05);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.05);
  ctx.lineTo(len * 0.88, -h * 0.02);
  ctx.quadraticCurveTo(len * 0.95, h * 0.2, len * 0.8, h * 0.35);
  ctx.lineTo(0, h * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (teeth && !beak) {
    ctx.fillStyle = '#FFFFFF';
    for (let i = 1; i <= 5; i++) {
      const x = len * (0.15 + i * 0.13);
      ctx.beginPath();
      ctx.moveTo(x - h * 0.07, 0);
      ctx.lineTo(x, -h * 0.2);
      ctx.lineTo(x + h * 0.07, 0);
      ctx.fill();
    }
  }
  ctx.restore();
  if (teeth && !beak) {
    ctx.fillStyle = '#FFFFFF';
    for (let i = 1; i <= 5; i++) {
      const x = hx + len * (0.12 + i * 0.14);
      ctx.beginPath();
      ctx.moveTo(x - h * 0.07, hy - h * 0.02);
      ctx.lineTo(x, hy + h * 0.2);
      ctx.lineTo(x + h * 0.07, hy - h * 0.02);
      ctx.fill();
    }
  }
}

/** Une queue qui se balance, de (x0, y0) jusqu'à la pointe */
function sideTail(ctx, x0, y0, w0, tipx, tipy, sway, col, dark, lw) {
  const mx = (x0 + tipx) / 2, my = (y0 + tipy) / 2 + sway;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x0, y0 - w0);
  ctx.quadraticCurveTo(mx, my - w0 * 0.55, tipx, tipy + sway * 1.6);
  ctx.quadraticCurveTo(mx, my + w0 * 0.55, x0, y0 + w0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/* ---------- Lézards, crocodiles, amphibiens, cynodontes (et le joueur tétrapode / reptile) ---------- */
function drawLizardSide(ctx, c, t, col = c.sp.color, b = c.sp.body || {}, o = {}) {
  const r = c.size;
  const dark = shade(col, -0.5);
  const lw = Math.max(1, r * 0.06);
  sideStart(ctx, c);
  const erect = b.plates === 'back';               // Postosuchus se tenait droit sur ses pattes
  const groundY = r * (erect ? 0.8 : 0.52);
  groundShadow(ctx, -2.4 * r, 1.4 * r, groundY, r);
  const ph = (c.walk || 0) * 2.4;
  const legW = r * (o.stubby ? 0.15 : erect ? 0.2 : 0.17);
  const legY = r * 0.18;
  // pattes du côté caché
  for (const [x, off] of [[0.1, Math.PI], [-0.85, 0]]) sideLeg(ctx, x * r, legY, groundY, legW, ph + off, shade(col, -0.25), dark, { bend: erect ? 0.5 : -1.2, claws: !o.stubby });
  // queue (avec une nageoire pour le tétrapode)
  const sway = Math.sin(t * 2.2 + (c.seed || 0)) * r * 0.08;
  if (o.tailFin) {
    ctx.fillStyle = shade(col, 0.25);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-1.2 * r, -0.2 * r);
    ctx.quadraticCurveTo(-2 * r, -0.55 * r + sway, -2.6 * r, -0.05 * r + sway * 1.6);
    ctx.quadraticCurveTo(-2 * r, 0.6 * r + sway, -1.2 * r, 0.35 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  sideTail(ctx, -0.9 * r, 0.12 * r, r * (b.wide ? 0.3 : 0.24), -2.5 * r, 0.25 * r, sway, col, dark, lw);
  // corps
  const g = ctx.createLinearGradient(0, -0.4 * r, 0, 0.45 * r);
  g.addColorStop(0, shade(col, 0.1));
  g.addColorStop(1, shade(col, 0.35));
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(-0.35 * r, 0.08 * r, r * (b.wide ? 0.92 : 0.85), r * (b.wide ? 0.4 : 0.34), 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (b.fur) {
    // fourrure : des petites mèches sur le dos
    ctx.strokeStyle = shade(col, -0.25);
    ctx.lineWidth = Math.max(1, r * 0.05);
    for (let i = 0; i < 9; i++) {
      const x = (-1.1 + i * 0.2) * r;
      ctx.beginPath();
      ctx.moveTo(x, -0.2 * r);
      ctx.lineTo(x - 0.08 * r, -0.36 * r);
      ctx.stroke();
    }
  } else if (erect) {
    // plaques d'os le long du dos
    ctx.fillStyle = shade(col, -0.25);
    for (let i = 0; i < 7; i++) {
      const x = (-1.05 + i * 0.25) * r;
      ctx.beginPath();
      ctx.moveTo(x - 0.08 * r, -0.24 * r);
      ctx.lineTo(x, -0.38 * r);
      ctx.lineTo(x + 0.08 * r, -0.24 * r);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = shade(col, -0.15);
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc((-0.95 + i * 0.2) * r, (-0.08 + (i % 2) * 0.08) * r, r * 0.05, 0, TAU);
      ctx.fill();
    }
  }
  if (o.scales) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = Math.max(1, r * 0.035);
    for (let i = 0; i < 6; i++) {
      for (const y of [-0.1, 0.1]) {
        ctx.beginPath();
        ctx.arc((-0.9 + i * 0.22) * r, y * r, r * 0.08, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-0.45 * r, -0.12 * r, r * 0.5, r * 0.08, 0, 0, TAU);
  ctx.fill();
  // la tête : plate et large, ou longue comme un crocodile
  const snout = b.snout || 0;
  const hl = r * (0.55 + snout * 0.45) * (b.wide ? 1.1 : 1);
  const hh = r * (snout ? 0.24 : b.wide ? 0.3 : 0.28);
  const hx = 0.35 * r, hy = 0.02 * r;
  ctx.fillStyle = shade(col, 0.08);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(hx, hy - hh * 0.9);
  ctx.quadraticCurveTo(hx + hl * 0.6, hy - hh * 1.05, hx + hl, hy - hh * 0.15);
  ctx.lineTo(hx + hl, hy + hh * 0.15);
  ctx.lineTo(hx, hy + hh * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const teeth = c.sp.kind === 'hunter' || snout > 0;
  sideJaw(ctx, hx + r * 0.05, hy + hh * 0.12, hl * 0.95, hh, c.mouth || 0, col, dark, lw, teeth);
  if (b.fur) {
    ctx.fillStyle = '#3B2A20';
    ctx.beginPath();
    ctx.arc(hx + hl, hy - hh * 0.1, r * 0.06, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.6)';
    ctx.lineWidth = Math.max(0.6, r * 0.025);
    for (const k of [-0.15, 0.05]) {
      ctx.beginPath();
      ctx.moveTo(hx + hl * 0.85, hy);
      ctx.lineTo(hx + hl * 1.3, hy + k * r);
      ctx.stroke();
    }
    ctx.fillStyle = shade(col, 0.15);
    ctx.beginPath();
    ctx.arc(hx + hl * 0.15, hy - hh * 1.05, r * 0.1, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // pattes du côté visible
  for (const [x, off] of [[0.1, 0], [-0.85, Math.PI]]) sideLeg(ctx, x * r, legY, groundY, legW, ph + off, col, dark, { bend: erect ? 0.5 : -1.2, claws: !o.stubby });
  if (o.cheek) {
    ctx.fillStyle = 'rgba(255, 120, 150, 0.55)';
    ctx.beginPath();
    ctx.ellipse(hx + hl * 0.4, hy + hh * 0.25, r * 0.1, r * 0.06, 0, 0, TAU);
    ctx.fill();
  }
  const ex = hx + hl * (o.eyesTop ? 0.25 : 0.32), ey = hy - hh * (o.eyesTop ? 1 : 0.5);
  sideEye(ctx, ex, ey, r * (b.wide ? 0.13 : 0.12) * (o.bigEyes ? 1.25 : 1), c.mood, c.blink, o.iris);
  ctx.restore();
}

/* ---------- Les dinosaures à deux pattes (et le joueur dinosaure) ---------- */
function drawTheropodSide(ctx, c, t, col = c.sp.color, b = c.sp.body || {}, o = {}) {
  const r = c.size;
  const k = b.slim ? 0.86 : 1;
  const dark = shade(col, -0.5);
  const lw = Math.max(1, r * 0.055);
  sideStart(ctx, c);
  const groundY = r * 1.02;
  groundShadow(ctx, -2.6 * r, 1.7 * r, groundY, r);
  const ph = (c.walk || 0) * 2.1;
  const bob = Math.abs(Math.sin(ph)) * r * 0.05;
  ctx.translate(0, -bob);
  const gy = groundY + bob;
  const legW = r * 0.24 * k;
  // la patte du côté caché
  sideLeg(ctx, -0.9 * r, 0.2 * r, gy, legW, ph + Math.PI, shade(col, -0.22), dark, { bend: 1 });
  // queue
  const sway = Math.sin(t * 2 + (c.seed || 0)) * r * 0.08;
  if (b.feathers) {
    ctx.fillStyle = shade(col, 0.25);
    ctx.beginPath();
    ctx.ellipse(-2.6 * r, -0.12 * r + sway * 1.5, r * 0.55, r * 0.18, -0.1, 0, TAU);
    ctx.fill();
  }
  sideTail(ctx, -1.25 * r, -0.08 * r, r * 0.34 * k, -3 * r, -0.2 * r, sway, col, dark, lw);
  // le corps
  const g = ctx.createLinearGradient(0, -0.5 * r, 0, 0.5 * r);
  g.addColorStop(0, shade(col, 0.08));
  g.addColorStop(1, shade(col, 0.32));
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(-0.75 * r, 0, r * 0.78 * k, r * 0.5 * k, -0.12, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // le cou
  const hb = b.bigHead ? 1.12 : 1;
  const hx = 0.2 * r, hy = -0.62 * r * hb;
  ctx.fillStyle = shade(col, 0.1);
  ctx.beginPath();
  ctx.moveTo(-0.45 * r, -0.36 * r * k);
  ctx.quadraticCurveTo(-0.05 * r, -0.5 * r, hx + 0.05 * r, hy - 0.2 * r * k);
  ctx.lineTo(hx + 0.2 * r, hy + 0.28 * r * k);
  ctx.quadraticCurveTo(-0.05 * r, -0.05 * r, -0.2 * r, 0.3 * r * k);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // rayures, plumes, bosses d'os sur le dos
  if (b.stripes) {
    ctx.strokeStyle = shade(col, -0.25);
    ctx.lineWidth = r * 0.07;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const x = (-1.25 + i * 0.22) * r;
      ctx.beginPath();
      ctx.moveTo(x, -0.42 * r * k);
      ctx.lineTo(x + 0.06 * r, -0.12 * r * k);
      ctx.stroke();
    }
  }
  if (b.feathers) {
    ctx.fillStyle = shade(col, 0.2);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse((-1.3 + i * 0.22) * r, -0.45 * r, r * 0.12, r * 0.06, -0.5, 0, TAU);
      ctx.fill();
    }
  }
  if (o.osteo) {
    ctx.fillStyle = '#E6B85C';
    ctx.strokeStyle = '#8A5A1E';
    ctx.lineWidth = Math.max(1, r * 0.025);
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc((-1.4 + i * 0.22) * r, -0.47 * r + Math.abs(i - 3) * 0.03 * r, r * 0.065, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(-0.85 * r, -0.25 * r, r * 0.45, r * 0.09, -0.12, 0, TAU);
  ctx.fill();
  // la tête
  const hl = r * (b.bigHead ? 1.2 : b.slim ? 0.8 : 0.95);
  const hh = r * (b.bigHead ? 0.52 : b.slim ? 0.3 : 0.38);
  ctx.fillStyle = shade(col, 0.06);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(hx, hy - hh * 0.55);
  ctx.quadraticCurveTo(hx + hl * 0.35, hy - hh * 1.05, hx + hl * 0.85, hy - hh * 0.55);
  ctx.quadraticCurveTo(hx + hl * 1.05, hy - hh * 0.3, hx + hl, hy + hh * 0.05);
  ctx.lineTo(hx + hl * 0.1, hy + hh * 0.18);
  ctx.quadraticCurveTo(hx - hl * 0.12, hy, hx, hy - hh * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (b.dome) {
    ctx.fillStyle = shade(col, 0.3);
    ctx.beginPath();
    ctx.arc(hx + hl * 0.3, hy - hh * 0.75, hh * 0.6, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }
  if (b.crests) {
    ctx.fillStyle = '#D9534F';
    ctx.beginPath();
    ctx.moveTo(hx + hl * 0.15, hy - hh * 0.85);
    ctx.lineTo(hx + hl * 0.25, hy - hh * 1.25);
    ctx.lineTo(hx + hl * 0.4, hy - hh * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (b.horn) {
    ctx.fillStyle = '#F2E2C4';
    ctx.beginPath();
    ctx.moveTo(hx + hl * 0.6, hy - hh * 0.7);
    ctx.lineTo(hx + hl * 0.72, hy - hh * 1.3);
    ctx.lineTo(hx + hl * 0.82, hy - hh * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (b.feathers) {
    ctx.fillStyle = shade(col, 0.3);
    ctx.beginPath();
    ctx.ellipse(hx + hl * 0.05, hy - hh * 0.8, r * 0.18, r * 0.06, -0.6, 0, TAU);
    ctx.fill();
  }
  const teeth = !b.beak;
  sideJaw(ctx, hx + hl * 0.08, hy + hh * 0.12, hl * 0.92, hh * 0.85, c.mouth || 0, col, dark, lw, teeth || o.teeth);
  if (b.beak) {
    ctx.fillStyle = '#E8C547';
    ctx.strokeStyle = dark;
    ctx.beginPath();
    ctx.moveTo(hx + hl * 0.82, hy - hh * 0.5);
    ctx.quadraticCurveTo(hx + hl * 1.2, hy - hh * 0.1, hx + hl, hy + hh * 0.25);
    ctx.lineTo(hx + hl * 0.8, hy + hh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (o.nostrils) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(hx + hl * 0.88, hy - hh * 0.38, r * 0.04, r * 0.025, 0, 0, TAU);
    ctx.fill();
  }
  if (o.cheek) {
    ctx.fillStyle = 'rgba(255, 120, 150, 0.55)';
    ctx.beginPath();
    ctx.ellipse(hx + hl * 0.3, hy - hh * 0.05, r * 0.1, r * 0.06, 0, 0, TAU);
    ctx.fill();
  }
  const iris = o.iris || (c.sp && c.sp.boss && c.mood === 'angry' ? '#C0182B' : INK);
  sideEye(ctx, hx + hl * 0.32, hy - hh * 0.5, r * (b.bigHead ? 0.11 : 0.12), c.mood, c.blink, iris);
  // le petit bras (minuscule pour le T. rex !)
  const armLen = r * (b.bigHead ? 0.28 : 0.42);
  ctx.strokeStyle = dark;
  ctx.lineWidth = r * 0.12 * k;
  ctx.lineCap = 'round';
  const aw = Math.sin(t * 2) * 0.15;
  ctx.beginPath();
  ctx.moveTo(-0.25 * r, 0.05 * r);
  ctx.quadraticCurveTo(-0.05 * r, 0.15 * r, -0.25 * r + armLen, 0.15 * r + armLen * (0.4 + aw));
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = r * 0.08 * k;
  ctx.stroke();
  if (b.feathers) {
    ctx.fillStyle = shade(col, 0.2);
    ctx.beginPath();
    ctx.ellipse(-0.1 * r, 0.25 * r, r * 0.22, r * 0.07, 0.6, 0, TAU);
    ctx.fill();
  }
  // la grosse cuisse et la patte du côté visible
  ctx.fillStyle = shade(col, 0.05);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(-0.9 * r, 0.12 * r, r * 0.34 * k, r * 0.42 * k, 0.2 + Math.sin(ph) * 0.25, 0, TAU);
  ctx.fill();
  ctx.stroke();
  sideLeg(ctx, -0.9 * r, 0.32 * r, gy, legW, ph, col, dark, { bend: 1 });
  ctx.restore();
}

/* ---------- Les herbivores à quatre pattes : stégosaure, tricératops, ankylosaure, edmontosaure ---------- */
function drawQuadrupedSide(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const b = c.sp.body || {};
  const dark = shade(col, -0.5);
  const lw = Math.max(1, r * 0.05);
  sideStart(ctx, c);
  const groundY = r * 0.95;
  groundShadow(ctx, -2.4 * r, 1.6 * r, groundY, r);
  const ph = (c.walk || 0) * 1.8;
  const legW = r * 0.27;
  const hipY = r * 0.25;
  for (const [x, off] of [[0.5, Math.PI], [-0.8, 0]]) sideLeg(ctx, x * r, hipY, groundY, legW, ph + off, shade(col, -0.22), dark, { bend: 0.3, pillar: true, claws: false });
  // queue, avec ses pointes ou sa massue
  const sway = Math.sin(t * 1.6 + (c.seed || 0)) * r * 0.06;
  sideTail(ctx, -1.05 * r, -0.05 * r, r * 0.32, -2.4 * r, 0.05 * r, sway, col, dark, lw);
  if (b.tailSpikes) {
    ctx.fillStyle = '#F2E2C4';
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, r * 0.025);
    for (const [x, a] of [[-2.2, -2.2], [-2.05, -1.9], [-2.3, -0.9], [-2.15, -1.2]]) {
      const bx = x * r, by = 0.02 * r + sway * 1.6;
      ctx.beginPath();
      ctx.moveTo(bx - r * 0.05, by);
      ctx.lineTo(bx + Math.cos(a) * r * 0.45, by + Math.sin(a) * r * 0.45);
      ctx.lineTo(bx + r * 0.05, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  if (b.club) {
    ctx.fillStyle = shade(col, -0.2);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(-2.4 * r, 0.05 * r + sway * 1.6, r * 0.28, r * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // grandes plaques sur le dos (stégosaure)
  if (b.plates) {
    for (let i = 0; i < 7; i++) {
      const x = (-1.05 + i * 0.27) * r;
      const s = r * (0.28 + Math.sin((i / 6) * Math.PI) * 0.22);
      const top = -0.45 * r - Math.sin((i / 6) * Math.PI) * 0.12 * r;
      ctx.fillStyle = i % 2 ? '#D9734E' : '#E58F5C';
      ctx.strokeStyle = shade('#D9734E', -0.45);
      ctx.lineWidth = Math.max(1, r * 0.025);
      ctx.beginPath();
      ctx.moveTo(x - s * 0.45, top + s * 0.35);
      ctx.lineTo(x, top - s * 0.7);
      ctx.lineTo(x + s * 0.45, top + s * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  // le corps
  const g = ctx.createLinearGradient(0, -0.55 * r, 0, 0.5 * r);
  g.addColorStop(0, shade(col, 0.08));
  g.addColorStop(1, shade(col, 0.3));
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(-0.2 * r, -0.02 * r, r * (b.armor ? 1.08 : 1), r * (b.armor ? 0.46 : 0.56), 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (b.armor) {
    // armure : des rangées de bosses et de pointes
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 8; i++) {
        const x = (-1.1 + i * 0.26) * r, y = (-0.32 + row * 0.25) * r;
        ctx.fillStyle = shade(col, 0.2);
        ctx.strokeStyle = dark;
        ctx.lineWidth = Math.max(0.8, r * 0.02);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.07, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#E8DCC0';
    for (let i = 0; i < 7; i++) {
      const x = (-1 + i * 0.3) * r;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.07, -0.42 * r);
      ctx.lineTo(x, -0.62 * r);
      ctx.lineTo(x + r * 0.07, -0.42 * r);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = shade(col, -0.12);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc((-0.95 + i * 0.3) * r, (-0.2 + (i % 2) * 0.15) * r, r * 0.07, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(-0.3 * r, -0.32 * r, r * 0.55, r * 0.08, 0, 0, TAU);
  ctx.fill();
  // la tête (basse : ils broutent)
  const hx = 0.72 * r, hy = 0.12 * r;
  const hl = r * (b.frill ? 0.75 : 0.6), hh = r * (b.frill ? 0.36 : 0.28);
  if (b.frill) {
    // la grande collerette, derrière la tête
    ctx.fillStyle = shade(col, 0.15);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI * 0.95 + (i / 12) * Math.PI * 1.05;
      const rr = r * (0.85 + (i % 2) * 0.09);
      const x = hx - 0.05 * r + Math.cos(a) * rr * 0.7, y = hy - 0.1 * r + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#D9534F';
    ctx.beginPath();
    ctx.arc(hx - 0.15 * r, hy - 0.35 * r, r * 0.1, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = shade(col, 0.06);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(hx - 0.1 * r, hy - hh * 0.8);
  ctx.quadraticCurveTo(hx + hl * 0.6, hy - hh * 1.1, hx + hl, hy - hh * 0.1);
  ctx.lineTo(hx + hl * 0.95, hy + hh * 0.5);
  ctx.quadraticCurveTo(hx + hl * 0.4, hy + hh * 0.85, hx - 0.15 * r, hy + hh * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (b.frill) {
    // trois cornes
    ctx.fillStyle = '#F2E2C4';
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, r * 0.025);
    for (const [x, y, len, a] of [[0.35, -0.65, 0.95, -0.3], [0.22, -0.6, 0.75, -0.45], [0.85, -0.25, 0.35, -0.6]]) {
      const bx = hx + hl * x, by = hy + hh * y;
      ctx.beginPath();
      ctx.moveTo(bx - r * 0.06, by);
      ctx.lineTo(bx + Math.cos(a) * r * len, by + Math.sin(a) * r * len);
      ctx.lineTo(bx + r * 0.06, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  if (b.beak || b.frill) {
    ctx.fillStyle = '#E8C547';
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.beginPath();
    ctx.ellipse(hx + hl * 0.98, hy + hh * 0.2, r * (b.beak ? 0.16 : 0.1), r * (b.beak ? 0.12 : 0.1), 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  sideEye(ctx, hx + hl * 0.3, hy - hh * 0.35, r * 0.1, c.mood, c.blink);
  for (const [x, off] of [[0.5, 0], [-0.8, Math.PI]]) sideLeg(ctx, x * r, hipY, groundY, legW, ph + off, col, dark, { bend: 0.3, pillar: true, claws: false });
  ctx.restore();
}

/* ---------- Le sauropode géant : un très long cou ---------- */
function drawSauropodSide(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const dark = shade(col, -0.45);
  const lw = Math.max(1, r * 0.03);
  sideStart(ctx, c);
  const groundY = r * 1.1;
  groundShadow(ctx, -2.9 * r, 1.4 * r, groundY, r);
  const ph = (c.walk || 0) * 1.4;
  const legW = r * 0.32;
  for (const [x, off] of [[0.6, Math.PI], [-0.6, 0]]) sideLeg(ctx, x * r, 0.3 * r, groundY, legW, ph + off, shade(col, -0.2), dark, { bend: 0, pillar: true, claws: false });
  const sway = Math.sin(t * 1.2 + (c.seed || 0)) * r * 0.08;
  sideTail(ctx, -0.95 * r, -0.1 * r, r * 0.35, -2.9 * r, 0.25 * r, sway, col, dark, lw);
  // le long cou, jusqu'à la petite tête tout en haut
  const nod = Math.sin(t * 0.9 + (c.seed || 0)) * r * 0.08;
  const hx = 1.75 * r, hy = -2 * r + nod;
  ctx.fillStyle = shade(col, 0.08);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(0.55 * r, -0.5 * r);
  ctx.quadraticCurveTo(1.15 * r, -0.9 * r, hx - 0.1 * r, hy - 0.08 * r);
  ctx.lineTo(hx - 0.05 * r, hy + 0.14 * r);
  ctx.quadraticCurveTo(1.45 * r, -0.4 * r, 0.85 * r, 0.1 * r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -0.6 * r, 0, 0.6 * r);
  g.addColorStop(0, shade(col, 0.08));
  g.addColorStop(1, shade(col, 0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -0.05 * r, r * 1.1, r * 0.62, -0.05, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(col, -0.12);
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc((-0.8 + i * 0.3) * r, (-0.3 + (i % 2) * 0.18) * r, r * 0.09, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(-0.1 * r, -0.4 * r, r * 0.6, r * 0.09, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = shade(col, 0.1);
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.ellipse(hx + 0.08 * r, hy, r * 0.24, r * 0.14, 0.15, 0, TAU);
  ctx.fill();
  ctx.stroke();
  sideEye(ctx, hx + 0.08 * r, hy - 0.04 * r, r * 0.06, 'calm', c.blink);
  for (const [x, off] of [[0.6, 0], [-0.6, Math.PI]]) sideLeg(ctx, x * r, 0.3 * r, groundY, legW, ph + off, col, dark, { bend: 0, pillar: true, claws: false });
  ctx.restore();
}

/* ---------- Les looks des espèces ---------- */
Object.assign(LOOKS, {
  insecte: drawInsect,
  blatte: drawBlatte,
  millepattes: drawMillepattes,
  scorpion: drawScorpion,
  libellule: drawLibellule,
  pterosaure: drawPterosaure,
  lezard: (ctx, c, t) => drawLizardSide(ctx, c, t),
  theropode: (ctx, c, t) => drawTheropodSide(ctx, c, t),
  quadrupede: drawQuadrupedSide,
  sauropode: drawSauropodSide,
});

/* Cadrage des vignettes (r = taille, x / y = position de la tête, en part de l'image) */
Object.assign(FRAMES, {
  insecte: { r: 0.22, x: 0.5, y: 0.55 },
  blatte: { r: 0.2, x: 0.48, y: 0.55 },
  millepattes: { r: 0.2, x: 0.72, y: 0.34 },
  scorpion: { r: 0.25, x: 0.62, y: 0.42 },
  libellule: { r: 0.22, x: 0.62, y: 0.42 },
  pterosaure: { r: 0.17, x: 0.55, y: 0.48 },
  lezard: { r: 0.2, x: 0.62, y: 0.5 },
  theropode: { r: 0.17, x: 0.6, y: 0.55 },
  quadrupede: { r: 0.18, x: 0.58, y: 0.55 },
  sauropode: { r: 0.14, x: 0.55, y: 0.72 },
  tetrapode: { r: 0.2, x: 0.62, y: 0.5 },
  reptile: { r: 0.2, x: 0.62, y: 0.5 },
  dino: { r: 0.17, x: 0.58, y: 0.56 },
});

/* ============================================================================
   Le joueur sur la terre ferme
   ============================================================================ */
FORMS.tetrapode = (ctx, p, parts, t, mood) => {
  drawLizardSide(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, PLAYER.body, { wide: true }, { tailFin: true, stubby: !parts.pattes, eyesTop: true, cheek: true, bigEyes: true });
};

FORMS.reptile = (ctx, p, parts, t, mood) => {
  drawLizardSide(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, PLAYER.body, {}, { scales: !!parts.ecailles, cheek: true, bigEyes: true });
};

FORMS.dino = (ctx, p, parts, t, mood) => {
  drawTheropodSide(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, PLAYER.body, { bigHead: !!parts.morsure }, {
    teeth: !!parts.dents || !!parts.morsure,
    nostrils: !!parts.flair,
    osteo: !!parts['peau-epaisse'],
    cheek: true,
  });
  if (parts.cerveau) {
    // une petite étincelle au-dessus de la tête : c'est un malin !
    const k = 0.6 + Math.sin(t * 3) * 0.4;
    const face = p.face || (Math.cos(p.angle) >= 0 ? 1 : -1);
    ctx.fillStyle = `rgba(255, 240, 150, ${0.75 * k})`;
    ctx.beginPath();
    ctx.arc(p.x + face * p.size * 0.55, p.y - p.size * 1.2, p.size * 0.09, 0, TAU);
    ctx.fill();
  }
};

/* ============================================================================
   Le décor de la terre ferme
   ============================================================================ */
/** Une forme de flaque irrégulière (pour les mares et la boue) */
function blob(d, k = 1) {
  if (!d.blob) {
    const rnd = seeded(d.seed);
    d.blob = Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * TAU;
      return { a, r: 0.82 + rnd() * 0.3 };
    });
  }
  return d.blob.map((p) => ({ x: d.x + Math.cos(p.a) * d.r * p.r * k, y: d.y + Math.sin(p.a) * d.r * p.r * k }));
}

DECORS.mare = (ctx, d, t) => {
  // berge boueuse, eau, reflets et roseaux
  ctx.fillStyle = 'rgba(70, 55, 30, 0.45)';
  smoothClosed(ctx, blob(d, 1.1));
  ctx.fill();
  const g = ctx.createRadialGradient(d.x - d.r * 0.2, d.y - d.r * 0.2, d.r * 0.1, d.x, d.y, d.r);
  g.addColorStop(0, '#5FB8C9');
  g.addColorStop(1, '#2C7A8C');
  ctx.fillStyle = g;
  smoothClosed(ctx, blob(d));
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 60, 70, 0.6)';
  ctx.lineWidth = Math.max(2, d.r * 0.03);
  ctx.stroke();
  // ronds dans l'eau
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(1.5, d.r * 0.012);
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.3 + i / 3 + d.seed % 1) % 1;
    const a = d.seed + i * 2.1;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.ellipse(d.x + Math.cos(a) * d.r * 0.4, d.y + Math.sin(a) * d.r * 0.35, d.r * 0.18 * k + 2, d.r * 0.1 * k + 1, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(d.x - d.r * 0.3, d.y - d.r * 0.35, d.r * 0.3, d.r * 0.07, -0.3, 0, TAU);
  ctx.fill();
  // roseaux sur le bord
  if (!d.reeds) {
    const rnd = seeded(d.seed + 5);
    d.reeds = Array.from({ length: 10 }, () => ({ a: rnd() * TAU, k: 0.85 + rnd() * 0.2, s: 0.6 + rnd() * 0.6 }));
  }
  ctx.strokeStyle = '#4E7A2E';
  ctx.lineCap = 'round';
  for (const rd of d.reeds) {
    const x = d.x + Math.cos(rd.a) * d.r * rd.k, y = d.y + Math.sin(rd.a) * d.r * rd.k;
    const len = d.r * 0.12 * rd.s;
    ctx.lineWidth = Math.max(1.5, d.r * 0.012);
    for (let k = -1; k <= 1; k++) {
      const a = -Math.PI / 2 + k * 0.4 + Math.sin(t + rd.a) * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
  }
};

DECORS.boue = (ctx, d, t) => {
  ctx.fillStyle = '#5A4128';
  smoothClosed(ctx, blob(d));
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 28, 15, 0.6)';
  ctx.lineWidth = Math.max(2, d.r * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#6E5133';
  smoothClosed(ctx, blob(d, 0.7));
  ctx.fill();
  // bulles qui éclatent
  for (let i = 0; i < 4; i++) {
    const k = (t * 0.5 + i / 4 + (d.seed % 7) / 7) % 1;
    const a = d.seed * 0.7 + i * 1.7;
    const x = d.x + Math.cos(a) * d.r * 0.45, y = d.y + Math.sin(a) * d.r * 0.4;
    ctx.strokeStyle = `rgba(150, 120, 80, ${1 - k})`;
    ctx.lineWidth = Math.max(1, d.r * 0.012);
    ctx.beginPath();
    ctx.arc(x, y, d.r * 0.03 + k * d.r * 0.06, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 240, 210, 0.12)';
  ctx.beginPath();
  ctx.ellipse(d.x - d.r * 0.25, d.y - d.r * 0.3, d.r * 0.25, d.r * 0.06, -0.3, 0, TAU);
  ctx.fill();
};

/* Fougères : une ombre au sol, puis des frondes par-dessus les créatures */
DECORS.fougeres = (ctx, d) => {
  const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
  g.addColorStop(0, 'rgba(20, 50, 20, 0.5)');
  g.addColorStop(1, 'rgba(20, 50, 20, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, TAU);
  ctx.fill();
};

COVERS.fougeres = (ctx, d, t) => {
  if (!d.fronds) {
    const rnd = seeded(d.seed);
    const tufts = Math.round(Math.min(9, 2 + d.r / 60));
    d.fronds = [];
    for (let i = 0; i < tufts; i++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.6;
      const cx = Math.cos(a) * rr, cy = Math.sin(a) * rr;
      const n = 6 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        d.fronds.push({
          x: cx, y: cy, a: (k / n) * TAU + rnd() * 0.5,
          len: d.r * (0.32 + rnd() * 0.22), ph: rnd() * TAU,
          col: ['#3E8E41', '#4FA853', '#2F7535', '#5DB860'][Math.floor(rnd() * 4)],
        });
      }
    }
  }
  ctx.lineCap = 'round';
  for (const f of d.fronds) {
    const bx = d.x + f.x, by = d.y + f.y;
    const a = f.a + Math.sin(t * 1.2 + f.ph) * 0.06;
    const ex = bx + Math.cos(a) * f.len, ey = by + Math.sin(a) * f.len;
    // la tige
    ctx.strokeStyle = shade(f.col, -0.35);
    ctx.lineWidth = Math.max(1.5, f.len * 0.04);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // les petites feuilles de chaque côté
    ctx.strokeStyle = f.col;
    for (let k = 1; k <= 7; k++) {
      const u = k / 8;
      const px = bx + (ex - bx) * u, py = by + (ey - by) * u;
      const l = f.len * 0.22 * (1 - u * 0.7);
      ctx.lineWidth = Math.max(2, f.len * 0.07 * (1 - u * 0.5));
      for (const s of [-1, 1]) {
        const la = a + s * 1.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(la) * l, py + Math.sin(la) * l);
        ctx.stroke();
      }
    }
  }
};

/* Arbres : le tronc et son ombre au sol, le feuillage par-dessus */
function trunk(ctx, d, col) {
  ctx.fillStyle = 'rgba(10, 30, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(d.x + d.r * 0.5, d.y + d.r * 0.7, d.r * 1.05, d.r * 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.strokeStyle = shade(col, -0.45);
  ctx.lineWidth = Math.max(2, d.r * 0.04);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

DECORS['arbre-ancien'] = (ctx, d) => trunk(ctx, d, '#6B5B3E');
DECORS.conifere = (ctx, d) => trunk(ctx, d, '#5B3F2A');

COVERS['arbre-ancien'] = (ctx, d, t) => {
  // un lépidodendron : des touffes en pompon au bout des branches, écorce en écailles
  if (!d.tufts) {
    const rnd = seeded(d.seed);
    d.tufts = Array.from({ length: 5 + Math.floor(rnd() * 3) }, (_, i) => {
      const a = (i / 6) * TAU + rnd() * 0.6;
      return { a, k: 0.35 + rnd() * 0.35, s: 0.35 + rnd() * 0.2 };
    });
  }
  const sway = Math.sin(t * 0.7 + d.seed) * d.r * 0.02;
  ctx.strokeStyle = '#5E4B30';
  ctx.lineWidth = d.r * 0.08;
  ctx.lineCap = 'round';
  for (const tf of d.tufts) {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + Math.cos(tf.a) * d.r * tf.k + sway, d.y + Math.sin(tf.a) * d.r * tf.k);
    ctx.stroke();
  }
  for (const tf of d.tufts) {
    const x = d.x + Math.cos(tf.a) * d.r * tf.k + sway, y = d.y + Math.sin(tf.a) * d.r * tf.k;
    const g = ctx.createRadialGradient(x - d.r * 0.08, y - d.r * 0.08, 0, x, y, d.r * tf.s);
    g.addColorStop(0, '#6FAE4A');
    g.addColorStop(1, '#2E6B2A');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * TAU;
      const rr = d.r * tf.s * (i % 2 ? 0.75 : 1);
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
};

COVERS.conifere = (ctx, d, t) => {
  const sway = Math.sin(t * 0.6 + d.seed) * d.r * 0.02;
  // trois étages d'aiguilles, du plus large au plus petit
  for (const [k, col] of [[1, '#24502E'], [0.72, '#2F6638'], [0.45, '#3D7D45']]) {
    ctx.fillStyle = col;
    ctx.strokeStyle = 'rgba(10, 30, 15, 0.5)';
    ctx.lineWidth = Math.max(1.5, d.r * 0.02);
    ctx.beginPath();
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU + d.seed;
      const rr = d.r * k * (i % 2 ? 0.72 : 1);
      const x = d.x + sway * k + Math.cos(a) * rr, y = d.y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 220, 0.12)';
  ctx.beginPath();
  ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, TAU);
  ctx.fill();
};

DECORS.prele = (ctx, d) => {
  // des prêles : des tiges fines en étoile
  ctx.strokeStyle = '#5C8F3A';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, d.r * 0.12);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + d.seed;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + Math.cos(a) * d.r, d.y + Math.sin(a) * d.r);
    ctx.stroke();
  }
  ctx.fillStyle = '#7FAF4E';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.25, 0, TAU);
  ctx.fill();
};

DECORS.cycas = (ctx, d, t) => {
  // un cycas : une rosette de grandes palmes
  shadow(ctx, d.x + d.r * 0.3, d.y + d.r * 0.4, d.r, d.r * 0.8);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + d.seed + Math.sin(t * 0.8 + i) * 0.03;
    const ex = d.x + Math.cos(a) * d.r, ey = d.y + Math.sin(a) * d.r;
    ctx.strokeStyle = '#3F7A35';
    ctx.lineWidth = Math.max(1.5, d.r * 0.06);
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = '#5BA34A';
    ctx.lineWidth = Math.max(1.2, d.r * 0.05);
    for (let k = 1; k <= 5; k++) {
      const px = d.x + (ex - d.x) * k / 6, py = d.y + (ey - d.y) * k / 6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a + s * 0.9) * d.r * 0.18, py + Math.sin(a + s * 0.9) * d.r * 0.18);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = '#8A6B3E';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.18, 0, TAU);
  ctx.fill();
};

DECORS.os = (ctx, d) => {
  // un vieux squelette : un crâne et des côtes (un peu effrayant…)
  if (!d.rot) d.rot = (d.seed % 628) / 100;
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.rot);
  ctx.strokeStyle = '#E9E2CF';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, d.r * 0.08);
  ctx.beginPath();
  ctx.moveTo(-d.r * 0.8, 0);
  ctx.lineTo(d.r * 0.5, 0);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, d.r * 0.06);
  for (let i = 0; i < 5; i++) {
    const x = -d.r * 0.6 + i * d.r * 0.22;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + d.r * 0.1, s * d.r * 0.35, x - d.r * 0.05, s * d.r * 0.5);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#E9E2CF';
  ctx.strokeStyle = 'rgba(80, 70, 50, 0.6)';
  ctx.lineWidth = Math.max(1, d.r * 0.03);
  ctx.beginPath();
  ctx.ellipse(d.r * 0.7, 0, d.r * 0.28, d.r * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4A4030';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(d.r * 0.7, s * d.r * 0.08, d.r * 0.06, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
};

DECORS.nid = (ctx, d) => {
  // un nid de dinosaure avec ses œufs
  ctx.strokeStyle = '#8A6B3E';
  ctx.lineWidth = Math.max(2, d.r * 0.25);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.8, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#6B5230';
  ctx.lineWidth = Math.max(1, d.r * 0.06);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + d.seed;
    ctx.beginPath();
    ctx.moveTo(d.x + Math.cos(a) * d.r * 0.65, d.y + Math.sin(a) * d.r * 0.65);
    ctx.lineTo(d.x + Math.cos(a + 0.5) * d.r * 0.95, d.y + Math.sin(a + 0.5) * d.r * 0.95);
    ctx.stroke();
  }
  for (const [x, y] of [[-0.25, -0.15], [0.2, -0.2], [0, 0.22], [0.3, 0.15]]) {
    ctx.fillStyle = '#F4EBD6';
    ctx.strokeStyle = '#B8A988';
    ctx.lineWidth = Math.max(1, d.r * 0.04);
    ctx.beginPath();
    ctx.ellipse(d.x + x * d.r, d.y + y * d.r, d.r * 0.2, d.r * 0.26, x, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#C9A77C';
    ctx.beginPath();
    ctx.arc(d.x + x * d.r + d.r * 0.05, d.y + y * d.r - d.r * 0.05, d.r * 0.04, 0, TAU);
    ctx.fill();
  }
};

DECORS.fleur = (ctx, d) => {
  // les premières fleurs (elles sont apparues au temps des dinosaures !)
  if (!d.col) d.col = ['#FF8FB1', '#FFD24A', '#FFFFFF', '#B58CF0'][d.seed % 4];
  ctx.fillStyle = d.col;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + d.seed;
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * d.r * 0.5, d.y + Math.sin(a) * d.r * 0.5, d.r * 0.42, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#FFB000';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.3, 0, TAU);
  ctx.fill();
};

/** Les grandes ombres des nuages qui glissent sur le sol */
export function drawCloudShadows(ctx, clouds, t, x0, y0, x1, y1) {
  ctx.fillStyle = 'rgba(0, 15, 10, 0.1)';
  for (const c of clouds) {
    const x = c.x + t * 18, y = c.y + t * 6;
    if (x + c.r < x0 || x - c.r > x1 || y + c.r < y0 || y - c.r > y1) continue;
    ctx.beginPath();
    ctx.ellipse(x, y, c.r, c.r * 0.6, 0.3, 0, TAU);
    ctx.ellipse(x + c.r * 0.5, y + c.r * 0.15, c.r * 0.7, c.r * 0.45, 0.2, 0, TAU);
    ctx.fill();
  }
}

