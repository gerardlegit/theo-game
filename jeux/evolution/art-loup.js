// ============================================================================
// Le loup et l'humain (niveau 4) : l'os que les humains te lancent, et le
// décor : le camp avec son feu, le village et l'enclos des moutons. (Les
// animaux et les humains du niveau sont dans art-dessus.js ; les loups, les
// chiens et les humains de profil des intros et de la fin, dans art-profil.js.)
// ============================================================================

import { LOOKS, FRAMES, DECORS, drawSprite, seeded } from './art.js';

const TAU = Math.PI * 2;

/* ---------- Un os lancé par les humains (il brille un peu : miam !) ---------- */
LOOKS['os-jete'] = (ctx, c, t) => {
  const r = c.size;
  const glow = 0.25 + Math.sin(t * 4) * 0.12;
  const g = ctx.createRadialGradient(c.x, c.y, r * 0.2, c.x, c.y, r * 1.8);
  g.addColorStop(0, `rgba(255, 240, 170, ${glow})`);
  g.addColorStop(1, 'rgba(255, 240, 170, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r * 1.8, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.seed);
  ctx.fillStyle = '#F4ECD8';
  ctx.strokeStyle = '#8A7A5A';
  ctx.lineWidth = Math.max(0.8, r * 0.08);
  ctx.beginPath();
  ctx.rect(-r * 0.7, -r * 0.13, r * 1.4, r * 0.26);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.moveTo(sx * r * 0.75 + r * 0.2, sy * r * 0.17);
      ctx.arc(sx * r * 0.75, sy * r * 0.17, r * 0.2, 0, TAU);
    }
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F4ECD8';
  ctx.fillRect(-r * 0.7, -r * 0.1, r * 1.4, r * 0.2);
  ctx.restore();
};
FRAMES['os-jete'] = { r: 0.3, x: 0.5, y: 0.5 };

/* ============================================================================
   Le décor : le camp des humains (tentes en peaux, le feu au milieu), le
   village (maisons au toit de paille) et l'enclos des moutons. Vus de dessus.
   ============================================================================ */
/** Le feu, vu de dessus : il vacille, et la fumée monte */
export function campFire(ctx, x, y, s, t) {
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * 6);
  g.addColorStop(0, `rgba(255, 160, 60, ${0.4 + Math.sin(t * 9) * 0.05})`);
  g.addColorStop(1, 'rgba(255, 120, 30, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, s * 6, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  for (const [k, col] of [[1, '#FF7A1A'], [0.65, '#FFB23A'], [0.35, '#FFE58A']]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * TAU;
      const rr = s * k * (0.75 + 0.25 * Math.sin(t * 12 + i * 2.1));
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.fill();
  }
  // la fumée
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.25 + i / 4) % 1;
    ctx.fillStyle = `rgba(200, 200, 200, ${0.28 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin(i * 1.7 + t * 0.6) * s * 0.8 + u * s * 2, y - u * s * 7, s * (0.5 + u * 1.2), 0, TAU);
    ctx.fill();
  }
}

/** Une tente en peaux, vue de dessus (les perches dépassent au sommet) */
function tent(ctx, x, y, R, a) {
  ctx.fillStyle = 'rgba(30, 20, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + R * 0.25, y + R * 0.3, R * 1.05, R * 0.95, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(x - R * 0.2, y - R * 0.2, R * 0.1, x, y, R);
  g.addColorStop(0, '#D2B48A');
  g.addColorStop(1, '#8E6E48');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5A4028';
  ctx.lineWidth = Math.max(1.5, R * 0.05);
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // les coutures entre les peaux
  ctx.strokeStyle = 'rgba(90, 64, 40, 0.6)';
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const b = a + (i / 7) * TAU;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(b) * R, y + Math.sin(b) * R);
  }
  ctx.stroke();
  // l'entrée, tournée vers le feu
  ctx.fillStyle = '#3A2818';
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a) * R * 0.35, y + Math.sin(a) * R * 0.35);
  ctx.lineTo(x + Math.cos(a - 0.35) * R, y + Math.sin(a - 0.35) * R);
  ctx.lineTo(x + Math.cos(a + 0.35) * R, y + Math.sin(a + 0.35) * R);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4A3420';
  ctx.lineWidth = Math.max(1.5, R * 0.06);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const b = a + 0.6 + i * 1.2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(b) * R * 0.28, y + Math.sin(b) * R * 0.28);
  }
  ctx.stroke();
}

/** Une maison ronde au toit de paille (le village, il y a 10 000 ans) */
function hut(ctx, x, y, R) {
  ctx.fillStyle = 'rgba(30, 20, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + R * 0.25, y + R * 0.3, R * 1.05, R * 0.95, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(x - R * 0.25, y - R * 0.25, R * 0.1, x, y, R);
  g.addColorStop(0, '#E4C97A');
  g.addColorStop(1, '#A8853E');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6A5022';
  ctx.lineWidth = Math.max(1.5, R * 0.05);
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110, 80, 30, 0.45)';
  ctx.lineWidth = Math.max(1, R * 0.03);
  for (const k of [0.75, 0.5, 0.25]) {
    ctx.beginPath();
    ctx.arc(x, y, R * k, 0, TAU);
    ctx.stroke();
  }
}

function paintCamp(huts) {
  return (ctx, d) => {
    const rnd = seeded(d.seed);
    // la terre tassée par les pas
    const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
    g.addColorStop(0, huts ? 'rgba(150, 120, 80, 0.6)' : 'rgba(120, 95, 70, 0.6)');
    g.addColorStop(1, 'rgba(120, 95, 70, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, TAU);
    ctx.fill();
    // les tentes (ou les maisons) tout autour
    const n = huts ? 4 : 3;
    const a0 = rnd() * TAU;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU + (rnd() - 0.5) * 0.4;
      const x = d.x + Math.cos(a) * d.r * 0.62, y = d.y + Math.sin(a) * d.r * 0.62;
      if (huts) hut(ctx, x, y, d.r * 0.2);
      else tent(ctx, x, y, d.r * 0.2, a + Math.PI);
    }
    // les pierres du foyer et le bois
    ctx.strokeStyle = '#4A3420';
    ctx.lineCap = 'round';
    ctx.lineWidth = d.r * 0.035;
    ctx.beginPath();
    ctx.moveTo(d.x + d.r * 0.18, d.y + d.r * 0.2);
    ctx.lineTo(d.x + d.r * 0.32, d.y + d.r * 0.14);
    ctx.moveTo(d.x + d.r * 0.2, d.y + d.r * 0.26);
    ctx.lineTo(d.x + d.r * 0.34, d.y + d.r * 0.22);
    ctx.stroke();
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * TAU;
      ctx.fillStyle = i % 2 ? '#8A8680' : '#6E6A64';
      ctx.beginPath();
      ctx.arc(d.x + Math.cos(a) * d.r * 0.12, d.y + Math.sin(a) * d.r * 0.12, d.r * 0.03, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#2A1E16';
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r * 0.09, 0, TAU);
    ctx.fill();
  };
}
const paintTents = paintCamp(false);
const paintHuts = paintCamp(true);

DECORS.camp = (ctx, d, t) => {
  drawSprite(ctx, d, 'camp', d.seed % 3, paintTents, 0, 1.05);
  campFire(ctx, d.x, d.y, d.r * 0.06, t + d.seed);
};
DECORS.village = (ctx, d, t) => {
  drawSprite(ctx, d, 'village', d.seed % 3, paintHuts, 0, 1.05);
  campFire(ctx, d.x, d.y, d.r * 0.06, t + d.seed);
};

/** Le grand enclos : une barrière de pieux, et une seule porte (d.gate, d.gateW en radians) */
const FENCE = 0.85;
DECORS.enclos = (ctx, d) => {
  const R = d.r * FENCE, a0 = d.gate + d.gateW / 2, a1 = d.gate + Math.PI * 2 - d.gateW / 2;
  ctx.fillStyle = 'rgba(214, 200, 110, 0.4)';
  ctx.beginPath();
  ctx.arc(d.x, d.y, R, 0, TAU);
  ctx.fill();
  // des tas de foin
  ctx.fillStyle = '#D9BE5A';
  ctx.strokeStyle = '#A88E36';
  ctx.lineWidth = d.r * 0.006;
  for (const [x, y] of [[-0.35, -0.3], [-0.45, 0.25], [0.1, 0.45], [0.15, -0.5]]) {
    ctx.beginPath();
    ctx.ellipse(d.x + x * d.r, d.y + y * d.r, d.r * 0.08, d.r * 0.055, x * 3, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // la barrière
  ctx.strokeStyle = '#6A4A2A';
  ctx.lineCap = 'round';
  ctx.lineWidth = d.r * 0.016;
  for (const k of [-0.012, 0.012]) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, R + k * d.r, a0, a1);
    ctx.stroke();
  }
  ctx.fillStyle = '#5A3E22';
  const n = 44;
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * R, d.y + Math.sin(a) * R, d.r * 0.016, 0, TAU);
    ctx.fill();
  }
  // la porte : un chemin de terre, deux gros poteaux et les battants ouverts
  const gx = d.x + Math.cos(d.gate) * R, gy = d.y + Math.sin(d.gate) * R;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, d.r * 0.38);
  g.addColorStop(0, 'rgba(170, 135, 85, 0.7)');
  g.addColorStop(1, 'rgba(170, 135, 85, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(gx, gy, d.r * 0.38, 0, TAU);
  ctx.fill();
  for (const a of [a0, a1]) {
    const px = d.x + Math.cos(a) * R, py = d.y + Math.sin(a) * R;
    ctx.strokeStyle = '#7A5630';
    ctx.lineWidth = d.r * 0.02;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(d.gate) * d.r * 0.2, py + Math.sin(d.gate) * d.r * 0.2);
    ctx.stroke();
    ctx.fillStyle = '#3E2A16';
    ctx.beginPath();
    ctx.arc(px, py, d.r * 0.034, 0, TAU);
    ctx.fill();
  }
};
