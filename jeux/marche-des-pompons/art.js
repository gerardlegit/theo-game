// ============================================================================
// Les dessins de La Marche des Pompons, tout en code (aucune image) :
// les Pompons et leurs métiers, le nuage d'où ils tombent, la maison-
// champignon, l'eau, les ronces, les petits décors posés sur le terrain,
// les fonds de chaque monde (prairie, forêt, grotte, montagne) et Plume.
// Les Pompons, le décor et la maison se dessinent en coordonnées du monde
// (1 unité = 1 pixel de la grille) ; les fonds en pixels de l'écran.
// ============================================================================

import { hash } from './terrain.js';

const TAU = Math.PI * 2;
export const INK = '#3A2A4A';
export const POMPON_COLORS = ['#FF8FB8', '#FFD45E', '#7FD1FF', '#9BE58A', '#C9A7FF', '#FFB07A'];
const lighten = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255; const g = (n >> 8) & 255; const b = n & 255;
  const f = (v) => Math.round(v + (255 - v) * t);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
const darken = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255; const g = (n >> 8) & 255; const b = n & 255;
  const f = (v) => Math.round(v * (1 - t));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

/* ---------- Un Pompon ---------- */
function fluff(c, cx, cy, r, phase, bumps = 13, amp = 0.1) {
  c.beginPath();
  for (let i = 0; i <= bumps * 2; i++) {
    const a = (i / (bumps * 2)) * TAU;
    const rr = r * (1 + (i % 2 ? amp : -amp * 0.2) + Math.sin(a * 3 + phase) * 0.02);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
}

function mitt(c, x, y, col, r = 1.6) {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fillStyle = col;
  c.fill();
  c.lineWidth = 0.7;
  c.strokeStyle = INK;
  c.stroke();
}

function eyes(c, x, y, dir, mood, blink) {
  const ex = x + dir * 1.4;
  const front = mood === 'stop' || mood === 'face';
  const look = front ? 0 : dir * 0.6;
  for (const s of [-1, 1]) {
    const cx = ex + s * 2.2;
    if (mood === 'dizzy') {
      c.strokeStyle = INK; c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(cx - 1.1, y - 1.1); c.lineTo(cx + 1.1, y + 1.1);
      c.moveTo(cx + 1.1, y - 1.1); c.lineTo(cx - 1.1, y + 1.1);
      c.stroke();
      continue;
    }
    if (blink || mood === 'happy') {
      c.strokeStyle = INK; c.lineWidth = 0.8;
      c.beginPath();
      c.arc(cx, y + (mood === 'happy' ? 0.6 : 0), 1.3, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
      continue;
    }
    const big = mood === 'scared' ? 2.3 : 2;
    c.beginPath(); c.ellipse(cx, y, big * 0.9, big, 0, 0, TAU);
    c.fillStyle = '#FFFFFF'; c.fill();
    c.lineWidth = 0.6; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.arc(cx + look, y + (mood === 'up' ? -0.7 : 0.2), mood === 'scared' ? 0.8 : 1.1, 0, TAU);
    c.fillStyle = INK; c.fill();
    c.beginPath(); c.arc(cx + look - 0.4, y - 0.5, 0.4, 0, TAU);
    c.fillStyle = '#FFFFFF'; c.fill();
  }
  /* sourcils : décidés pour un métier, inquiets en tombant */
  if (mood === 'work' || mood === 'stop') {
    c.strokeStyle = INK; c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(ex - 3.6, y - 2.9); c.lineTo(ex - 1.2, y - 2.3);
    c.moveTo(ex + 3.6, y - 2.9); c.lineTo(ex + 1.2, y - 2.3);
    c.stroke();
  } else if (mood === 'scared') {
    c.strokeStyle = INK; c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(ex - 3.4, y - 2.6); c.lineTo(ex - 1.2, y - 3.3);
    c.moveTo(ex + 3.4, y - 2.6); c.lineTo(ex + 1.2, y - 3.3);
    c.stroke();
  }
}

function mouth(c, x, y, dir, mood) {
  const mx = x + dir * 1.4;
  c.strokeStyle = INK;
  c.lineWidth = 0.7;
  c.beginPath();
  if (mood === 'scared' || mood === 'dizzy') {
    c.ellipse(mx, y + 0.3, 0.9, 1.2, 0, 0, TAU);
    c.fillStyle = '#7A2E45'; c.fill(); c.stroke();
    return;
  }
  if (mood === 'stop' || mood === 'work') { c.moveTo(mx - 1.2, y); c.lineTo(mx + 1.2, y); c.stroke(); return; }
  c.arc(mx, y - 0.6, 1.4, 0.2, Math.PI - 0.2);
  c.stroke();
}

function umbrella(c, x, y, col, sway, open = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(sway);
  c.strokeStyle = INK;
  c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 11); c.stroke();
  const R = 9 * open;
  const cols = [col, '#FFFFFF'];
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, R, Math.PI + (i * Math.PI) / 4, Math.PI + ((i + 1) * Math.PI) / 4);
    c.closePath();
    c.fillStyle = cols[i % 2];
    c.fill();
  }
  c.beginPath(); c.arc(0, 0, R, Math.PI, TAU); c.closePath();
  c.lineWidth = 0.9; c.stroke();
  c.beginPath(); c.arc(0, -R - 0.6, 0.8, 0, TAU); c.fillStyle = INK; c.fill();
  c.restore();
}

/* le Pompon p (voir monde.js) à son emplacement ; t = temps en secondes */
export function drawPompon(c, p, t, { hover = false } = {}) {
  const col = POMPON_COLORS[p.id % POMPON_COLORS.length];
  const dir = p.dir || 1;
  const a = p.anim;
  let x = p.x;
  let y = p.y;
  let mood = 'normal';
  let bob = 0;
  let squash = 1;
  let alpha = 1;
  let scale = 1;
  const blink = (Math.floor(t * 10 + p.id * 13) % 37) === 0;

  if (p.state === 'sauve') {
    const k = Math.min(1, p.work / 24);
    y -= Math.sin(k * Math.PI) * 9;
    scale = 1 - k * 0.7;
    alpha = 1 - k * 0.6;
    mood = 'happy';
  } else if (p.state === 'perdu') {
    const k = p.work / 70;
    y -= p.work * 0.7;
    x += Math.sin(p.work * 0.15) * 3;
    alpha = Math.max(0, 1 - k * 1.1);
    mood = 'dizzy';
  } else if (p.state === 'tombe') {
    mood = p.parapluie && p.fall > 10 ? 'normal' : 'scared';
  } else if (p.state === 'marche') {
    bob = Math.abs(Math.sin(a * 0.5)) * 0.9;
    squash = 1 - Math.abs(Math.cos(a * 0.5)) * 0.04;
  } else if (p.state === 'stop') {
    mood = 'stop';
  } else if (p.state === 'hausse') {
    mood = 'up';
  } else if (p.state === 'grimpe') {
    mood = 'work';
    bob = Math.sin(a * 0.6) * 0.6;
  } else {
    mood = 'work';
    bob = p.state === 'pont' ? Math.abs(Math.sin(a * 0.3)) * 0.5 : 0;
  }
  if (alpha <= 0) return;

  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.scale(scale, scale);
  const cy = -7 - bob;
  const R = 6;

  /* bulle du Pompon perdu */
  if (p.state === 'perdu') {
    c.beginPath(); c.arc(0, cy, 10, 0, TAU);
    c.fillStyle = 'rgba(180,230,255,0.35)'; c.fill();
    c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
    c.beginPath(); c.arc(-3.5, cy - 4, 2, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill();
  }

  /* ombre */
  if (p.state !== 'tombe' && p.state !== 'perdu' && p.state !== 'grimpe') {
    c.beginPath(); c.ellipse(0, 0.2, 5, 1.2, 0, 0, TAU);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fill();
  }

  /* parapluie ouvert au-dessus pendant la chute */
  if (p.state === 'tombe' && p.parapluie && p.fall > 10) {
    umbrella(c, 0, cy - 12, '#FF6F91', Math.sin(t * 3 + p.id) * 0.12, Math.min(1, (p.fall - 10) / 8 + 0.3));
  }

  /* pieds */
  const step = p.state === 'marche' ? Math.sin(a * 0.5) * 1.6 : 0;
  if (p.state !== 'perdu') {
    c.fillStyle = darken(col, 0.45);
    c.strokeStyle = INK; c.lineWidth = 0.6;
    for (const s of [-1, 1]) {
      let fx = s * 2.6 + step * s;
      let fy = -0.9;
      if (p.state === 'tombe') { fx = s * 2.4; fy = -1.6; }
      if (p.state === 'grimpe') { fx = dir * 2 + s * 1.5; fy = -1.5 + (s > 0 ? Math.sin(a * 0.6) : -Math.sin(a * 0.6)) * 1.2; }
      c.beginPath(); c.ellipse(fx, fy, 2.1, 1.2, 0, 0, TAU); c.fill(); c.stroke();
    }
  }

  /* bras derrière le corps (stop, haussement, chute) */
  const arm = (x1, y1, x2, y2) => {
    c.strokeStyle = INK; c.lineWidth = 1.9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = col; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    mitt(c, x2, y2, '#FFFFFF');
  };
  if (p.state === 'stop') {
    arm(-4, cy + 1, -10.5, cy - 1.5);
    arm(4, cy + 1, 10.5, cy - 1.5);
  } else if (p.state === 'hausse') {
    arm(-4, cy + 1, -8.5, cy - 4.5);
    arm(4, cy + 1, 8.5, cy - 4.5);
  } else if (p.state === 'tombe' && !(p.parapluie && p.fall > 10)) {
    const w = Math.sin(t * 18 + p.id) * 1.2;
    arm(-4, cy - 1, -8, cy - 7 + w);
    arm(4, cy - 1, 8, cy - 7 - w);
  }

  /* le corps tout doux */
  c.save();
  c.translate(0, cy);
  c.scale(1 / squash, squash);
  fluff(c, 0, 0, R + 0.9, p.id + t * 0.5);
  c.fillStyle = INK;
  c.fill();
  fluff(c, 0, 0, R, p.id);
  const grd = c.createRadialGradient(-2, -2.5, 0.5, 0, 0, R + 1);
  grd.addColorStop(0, lighten(col, 0.55));
  grd.addColorStop(0.55, col);
  grd.addColorStop(1, darken(col, 0.18));
  c.fillStyle = grd;
  c.fill();
  /* quelques poils */
  c.strokeStyle = lighten(col, 0.6);
  c.lineWidth = 0.5;
  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const an = -2.4 + i * 0.5;
    c.moveTo(Math.cos(an) * (R - 2.2), Math.sin(an) * (R - 2.2));
    c.lineTo(Math.cos(an) * (R - 0.6), Math.sin(an) * (R - 0.6));
  }
  c.stroke();
  c.restore();

  /* bandeau rouge du Grimpeur */
  if (p.grimpe) {
    c.save();
    c.beginPath(); c.arc(0, cy, R + 0.3, Math.PI * 1.12, Math.PI * 1.88); c.lineWidth = 1.6; c.strokeStyle = '#E8414E'; c.stroke();
    c.beginPath();
    c.moveTo(-dir * 4.5, cy - 4.2); c.lineTo(-dir * 8, cy - 5.2 + Math.sin(t * 8 + p.id) * 0.8);
    c.moveTo(-dir * 4.5, cy - 4.2); c.lineTo(-dir * 7.6, cy - 2.6 + Math.sin(t * 8 + p.id + 1) * 0.8);
    c.lineWidth = 1; c.stroke();
    c.restore();
  }
  /* petit parapluie replié sur le dos */
  if (p.parapluie && !(p.state === 'tombe' && p.fall > 10) && p.state !== 'perdu') {
    c.save();
    c.translate(-dir * 5.2, cy - 1);
    c.rotate(-dir * 0.35);
    c.strokeStyle = INK; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(0, -5); c.lineTo(1.6, 2); c.lineTo(-1.6, 2); c.closePath();
    c.fillStyle = '#FF6F91'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(0, 2); c.lineTo(0, 4.5); c.arc(-0.8, 4.5, 0.8, 0, Math.PI); c.stroke();
    c.restore();
  }

  /* les yeux, les joues, la bouche */
  const fy = cy - 1;
  eyes(c, 0, fy, p.state === 'grimpe' ? dir : dir, mood, blink);
  c.fillStyle = 'rgba(255,110,140,0.45)';
  c.beginPath(); c.ellipse(dir * 1.4 - 3.8, fy + 2.6, 1.3, 0.8, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(dir * 1.4 + 3.8, fy + 2.6, 1.3, 0.8, 0, 0, TAU); c.fill();
  mouth(c, 0, fy + 3.1, dir, mood);

  /* les outils, devant le corps */
  if (p.state === 'pont') {
    const k = (p.work % 10) / 10;
    const swing = k < 0.5 ? -1.2 + k * 3 : 0.3 - (k - 0.5) * 3;
    c.save();
    c.translate(dir * 4, cy + 1);
    c.scale(dir, 1);
    c.rotate(swing);
    c.strokeStyle = '#7A4A22'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(5, -3); c.stroke();
    c.fillStyle = '#8D98A6'; c.strokeStyle = INK; c.lineWidth = 0.5;
    c.beginPath(); c.rect(4, -5, 2.2, 3.6); c.fill(); c.stroke();
    c.restore();
    /* la pile de briques qu'il reste */
    const left = Math.ceil((p.bricks || 0) / 3);
    for (let i = 0; i < left; i++) {
      c.fillStyle = '#EDA65A'; c.strokeStyle = INK; c.lineWidth = 0.4;
      c.fillRect(-dir * 6 - 2, cy + 3 - i * 1.6, 4, 1.4);
      c.strokeRect(-dir * 6 - 2, cy + 3 - i * 1.6, 4, 1.4);
    }
    mitt(c, dir * 4.2, cy + 1.3, '#FFFFFF', 1.3);
  } else if (p.state === 'tunnel') {
    const k = (p.work % 8) / 8;
    const sw = Math.sin(k * TAU) * 0.9;
    c.save();
    c.translate(dir * 3, cy);
    c.scale(dir, 1);
    c.rotate(-0.6 + sw);
    c.strokeStyle = '#7A4A22'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(0, 0); c.lineTo(8, 0); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(8, -3.5); c.quadraticCurveTo(10.5, 0, 8, 3.5); c.stroke();
    c.strokeStyle = '#B8C2CE'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(8, -3.5); c.quadraticCurveTo(10.5, 0, 8, 3.5); c.stroke();
    c.restore();
    mitt(c, dir * 4, cy + 0.5, '#FFFFFF', 1.3);
  } else if (p.state === 'creuse') {
    const k = (p.work % 9) / 9;
    const dy = Math.sin(k * TAU) * 1.6;
    c.save();
    c.translate(dir * 3.5, cy - 2 + dy);
    c.strokeStyle = '#7A4A22'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(0, -3); c.lineTo(0, 7); c.stroke();
    c.fillStyle = '#B8C2CE'; c.strokeStyle = INK; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(-2.2, 7); c.lineTo(2.2, 7); c.lineTo(1.4, 10.5); c.lineTo(0, 11.5); c.lineTo(-1.4, 10.5); c.closePath(); c.fill(); c.stroke();
    c.restore();
    mitt(c, dir * 3.5, cy + 1 + dy, '#FFFFFF', 1.3);
  } else if (p.state === 'grimpe') {
    const k = Math.sin(a * 0.6);
    mitt(c, dir * 6.2, cy - 3 + k * 1.5, '#FFFFFF', 1.4);
    mitt(c, dir * 6.2, cy + 2 - k * 1.5, '#FFFFFF', 1.4);
  } else if (p.state === 'hausse') {
    c.fillStyle = INK;
    c.font = 'bold 7px "Baloo 2", sans-serif';
    c.textAlign = 'center';
    c.fillText('?', 0, cy - 9 + Math.sin(t * 6) * 0.8);
  }
  c.restore();

  if (hover) {
    c.save();
    c.strokeStyle = '#FFFFFF';
    c.lineWidth = 1.2;
    c.setLineDash([2.5, 2]);
    c.lineDashOffset = -t * 8;
    c.beginPath(); c.arc(p.x, p.y - 7, 10.5, 0, TAU); c.stroke();
    c.restore();
  }
}

/* ---------- Le nuage d'où tombent les Pompons ---------- */
export function drawEntrance(c, E, t, open, left) {
  const x = E.x;
  const y = E.y - 10;
  c.save();
  const float = Math.sin(t * 1.4) * 1.2;
  c.translate(x, y + float);
  /* la trappe */
  c.fillStyle = '#3A2A4A';
  c.beginPath(); c.ellipse(0, 7, 8, 3, 0, 0, TAU); c.fill();
  const ang = open * 1.4;
  c.save();
  c.translate(-8, 7);
  c.rotate(ang);
  c.fillStyle = '#C98A4B'; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.rect(0, -1.5, 16, 3); c.fill(); c.stroke();
  c.strokeStyle = '#8E5A2B'; c.lineWidth = 0.5;
  c.beginPath(); c.moveTo(5, -1.5); c.lineTo(5, 1.5); c.moveTo(11, -1.5); c.lineTo(11, 1.5); c.stroke();
  c.restore();
  /* le nuage */
  const puffs = [[-16, 1, 9], [-7, -5, 11], [5, -6, 12], [16, -1, 9], [0, 3, 12], [-11, 5, 7], [12, 5, 7]];
  c.fillStyle = INK;
  for (const [px, py, r] of puffs) { c.beginPath(); c.arc(px, py, r + 1.2, 0, TAU); c.fill(); }
  for (const [px, py, r] of puffs) {
    const g = c.createRadialGradient(px - r * 0.3, py - r * 0.4, 1, px, py, r);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E2EEFA');
    c.fillStyle = g;
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }
  /* sa petite figure endormie */
  c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.arc(-4.5, -2, 1.8, 0.2, Math.PI - 0.2); c.stroke();
  c.beginPath(); c.arc(5.5, -2, 1.8, 0.2, Math.PI - 0.2); c.stroke();
  c.beginPath(); c.arc(0.5, 2, 2.2, 0.15, Math.PI - 0.15); c.stroke();
  c.fillStyle = 'rgba(255,140,170,0.5)';
  c.beginPath(); c.ellipse(-8.5, 1.5, 2, 1.1, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(9.5, 1.5, 2, 1.1, 0, 0, TAU); c.fill();
  /* combien il en reste dans le nuage */
  if (left > 0) {
    c.fillStyle = '#FF6F91';
    c.beginPath(); c.arc(17, -11, 5.2, 0, TAU); c.fill();
    c.lineWidth = 0.8; c.strokeStyle = '#FFFFFF'; c.stroke();
    c.fillStyle = '#FFFFFF';
    c.font = 'bold 6.5px "Baloo 2", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(left), 17, -10.6);
  }
  c.restore();
}

/* ---------- La maison-champignon ---------- */
export function drawHome(c, S, t, glow) {
  const x = S.x;
  const y = S.y;
  c.save();
  c.translate(x, y);
  /* lumière quand un Pompon rentre */
  if (glow > 0) {
    const g = c.createRadialGradient(0, -8, 2, 0, -8, 30);
    g.addColorStop(0, `rgba(255,230,120,${0.55 * glow})`);
    g.addColorStop(1, 'rgba(255,230,120,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, -8, 30, 0, TAU); c.fill();
  }
  /* fumée de la cheminée */
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.35 + i / 3) % 1);
    c.beginPath();
    c.arc(13 + Math.sin(k * 6 + i) * 2, -44 - k * 18, 2 + k * 3, 0, TAU);
    c.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
    c.fill();
  }
  c.lineWidth = 1.2;
  c.strokeStyle = INK;
  /* le pied */
  c.beginPath();
  c.moveTo(-12, 0); c.quadraticCurveTo(-13, -12, -10, -22); c.lineTo(10, -22); c.quadraticCurveTo(13, -12, 12, 0); c.closePath();
  const gs = c.createLinearGradient(-12, 0, 12, 0);
  gs.addColorStop(0, '#FFF3DC'); gs.addColorStop(1, '#EBD3AE');
  c.fillStyle = gs; c.fill(); c.stroke();
  /* la porte */
  c.beginPath();
  c.moveTo(-4.5, 0); c.lineTo(-4.5, -8); c.arc(0, -8, 4.5, Math.PI, 0); c.lineTo(4.5, 0); c.closePath();
  c.fillStyle = glow > 0 ? '#FFD86B' : '#A8642E'; c.fill(); c.stroke();
  if (glow <= 0) {
    c.strokeStyle = '#7A4A22'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(0, -12.5); c.lineTo(0, 0); c.stroke();
    c.fillStyle = '#FFD45E'; c.beginPath(); c.arc(2.6, -5, 0.8, 0, TAU); c.fill();
  }
  /* la fenêtre ronde */
  c.lineWidth = 1; c.strokeStyle = INK;
  c.beginPath(); c.arc(-7.5, -15, 2.6, 0, TAU);
  c.fillStyle = '#FFE38A'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-7.5, -17.6); c.lineTo(-7.5, -12.4); c.moveTo(-10.1, -15); c.lineTo(-4.9, -15); c.lineWidth = 0.6; c.stroke();
  /* la cheminée */
  c.lineWidth = 1;
  c.beginPath(); c.rect(10, -42, 5, 10); c.fillStyle = '#B9773F'; c.fill(); c.stroke();
  /* le chapeau rouge à pois */
  c.beginPath();
  c.moveTo(-24, -21);
  c.bezierCurveTo(-24, -46, 24, -46, 24, -21);
  c.quadraticCurveTo(0, -16, -24, -21);
  c.closePath();
  const gc = c.createRadialGradient(-6, -36, 2, 0, -28, 28);
  gc.addColorStop(0, '#FF7B7B'); gc.addColorStop(1, '#D9343F');
  c.fillStyle = gc; c.lineWidth = 1.3; c.fill(); c.stroke();
  c.fillStyle = '#FFFFFF';
  for (const [dx, dy, r] of [[-12, -30, 3.2], [2, -36, 3.6], [14, -28, 2.8], [-3, -25, 2.2], [-19, -24, 1.6], [19, -23, 1.6]]) {
    c.beginPath(); c.arc(dx, dy, r, 0, TAU); c.fill();
  }
  /* le petit drapeau */
  c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-2, -41); c.lineTo(-2, -54); c.stroke();
  c.beginPath();
  c.moveTo(-2, -54);
  c.quadraticCurveTo(3, -53 + Math.sin(t * 5) * 1.2, 8, -51.5);
  c.lineTo(-2, -48.5); c.closePath();
  c.fillStyle = '#FFD45E'; c.fill(); c.stroke();
  /* paillasson */
  c.fillStyle = '#58C46B';
  c.beginPath(); c.ellipse(0, 0.4, 7, 1.4, 0, 0, TAU); c.fill();
  c.restore();
}

/* ---------- L'eau et les ronces ---------- */
export function drawWater(c, tiles, t, color, TILE) {
  c.save();
  for (const w of tiles) {
    const x0 = w.c * TILE;
    const y0 = w.r * TILE;
    c.fillStyle = color;
    c.globalAlpha = 0.82;
    if (w.top) {
      c.beginPath();
      c.moveTo(x0, y0 + TILE);
      for (let i = 0; i <= 8; i++) {
        const xx = x0 + (i / 8) * TILE;
        c.lineTo(xx, y0 + 2 + Math.sin(xx * 0.35 + t * 3) * 1.1);
      }
      c.lineTo(x0 + TILE, y0 + TILE);
      c.closePath();
      c.fill();
      c.globalAlpha = 0.9;
      c.strokeStyle = '#E6F7FF';
      c.lineWidth = 0.9;
      c.beginPath();
      for (let i = 0; i <= 8; i++) {
        const xx = x0 + (i / 8) * TILE;
        const yy = y0 + 2 + Math.sin(xx * 0.35 + t * 3) * 1.1;
        if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
      }
      c.stroke();
      /* reflets */
      c.globalAlpha = 0.5;
      c.fillStyle = '#FFFFFF';
      const k = (t * 0.4 + hash(w.c, w.r) * 3) % 1;
      c.fillRect(x0 + 3 + k * 8, y0 + 7, 3, 0.8);
    } else {
      c.fillRect(x0, y0, TILE, TILE);
    }
  }
  c.restore();
}

export function drawThorns(c, tiles, TILE) {
  c.save();
  c.lineCap = 'round';
  for (const th of tiles) {
    const x0 = th.c * TILE;
    const yb = th.r * TILE + TILE;
    /* une touffe de ronces bien piquantes : on doit voir tout de suite que c'est dangereux */
    for (let i = 0; i < 4; i++) {
      const bx = x0 + 2 + i * 4 + hash(th.c, i) * 1.5;
      const h = 9 + hash(th.c, i, 3) * 5;
      const lean = (hash(th.c, i, 4) - 0.5) * 5;
      c.strokeStyle = INK; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(bx, yb); c.quadraticCurveTo(bx + lean, yb - h * 0.6, bx + lean * 0.5, yb - h); c.stroke();
      c.strokeStyle = '#4E7A2E'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(bx, yb); c.quadraticCurveTo(bx + lean, yb - h * 0.6, bx + lean * 0.5, yb - h); c.stroke();
      /* les épines rouges */
      for (let j = 1; j <= 4; j++) {
        const k = j / 5;
        const px = bx + lean * k * 0.9;
        const py = yb - h * k;
        const sd = j % 2 ? 1 : -1;
        c.fillStyle = '#E8414E'; c.strokeStyle = INK; c.lineWidth = 0.4;
        c.beginPath(); c.moveTo(px, py - 0.9); c.lineTo(px + sd * 3, py - 1.6); c.lineTo(px, py + 0.9); c.closePath(); c.fill(); c.stroke();
      }
    }
    /* quelques feuilles et une mûre */
    c.fillStyle = '#6FA84A';
    c.beginPath(); c.ellipse(x0 + 5, yb - 5, 2.2, 1.1, -0.5, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x0 + 12, yb - 7, 2.2, 1.1, 0.6, 0, TAU); c.fill();
    if (hash(th.c, th.r, 5) < 0.6) {
      c.fillStyle = '#5A1E6E';
      c.beginPath(); c.arc(x0 + 8, yb - 9, 1.6, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath(); c.arc(x0 + 7.5, yb - 9.6, 0.5, 0, TAU); c.fill();
    }
  }
  c.restore();
}

/* ---------- Les petits décors posés sur le terrain ---------- */
export function buildDecor(T, solid, theme, seed, avoid = []) {
  const list = [];
  const big = [];
  const { W, H } = T;
  const far = (x) => avoid.every((a) => Math.abs(a - x) > 26);
  /* la surface de départ de chaque colonne : en dessous, on est « dedans » (pas d'arbres ni de fleurs) */
  const top = new Int32Array(W);
  for (let x = 0; x < W; x++) { let y = 0; while (y < H && !solid(x, y)) y++; top[x] = y; }
  const cave = theme.fond === 'grotte';
  for (let x = 3; x < W - 3; x += 4) {
    for (let y = 1; y < H; y++) {
      const floor = solid(x, y) && !solid(x, y - 1);
      const ceil = !solid(x, y) && solid(x, y - 1) && theme.fond === 'grotte';
      if (!floor && !ceil) continue;
      const h = hash(x, y, seed);
      if (ceil) {
        if (h < 0.22) list.push({ kind: 'stalactite', x, y, s: 0.6 + hash(x, y, seed + 1) * 0.8, ceil: true });
        continue;
      }
      if (!far(x)) continue;
      const inside = !cave && y > top[x];
      /* gros décor (arbres, rochers) sur les sols bien plats, à l'air libre */
      if (!inside && h > 0.965 && solid(x - 14, y) && solid(x + 14, y) && !solid(x - 14, y - 1) && !solid(x + 14, y - 1)) {
        big.push({ kind: theme.fond, x, y, s: 0.8 + hash(x, y, seed + 2) * 0.5, v: hash(x, y, seed + 3) });
        continue;
      }
      if (h < 0.3) list.push({ kind: 'tuft', x, y, s: 0.7 + hash(x, y, seed + 4) * 0.6 });
      else if (h < 0.42) list.push({ kind: cave ? 'crystal' : theme.fond === 'montagne' || inside ? 'pebble' : 'flower', x, y, v: hash(x, y, seed + 5) });
      else if (h < 0.46 && theme.fond !== 'montagne') list.push({ kind: 'mushroom', x, y, v: hash(x, y, seed + 6) });
    }
  }
  return { list, big };
}

const FLOWER_COLS = ['#FF6F91', '#FFD45E', '#FFFFFF', '#C9A7FF', '#7FD1FF'];
export function drawDecor(c, list, solid, theme, t) {
  for (const d of list) {
    if (d.ceil) { if (!solid(d.x, d.y - 1) || solid(d.x, d.y)) continue; }
    else if (!solid(d.x, d.y) || solid(d.x, d.y - 1)) continue;
    const { x, y } = d;
    switch (d.kind) {
      case 'tuft': {
        const sway = Math.sin(t * 2 + x * 0.1) * 0.6;
        c.strokeStyle = theme.neige ? '#DDEBF7' : theme.herbe;
        c.lineWidth = 0.9; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x - 1.5, y); c.lineTo(x - 2.5 + sway, y - 3.5 * d.s);
        c.moveTo(x, y); c.lineTo(x + sway, y - 5 * d.s);
        c.moveTo(x + 1.5, y); c.lineTo(x + 2.6 + sway, y - 3.2 * d.s);
        c.stroke();
        break;
      }
      case 'flower': {
        const col = FLOWER_COLS[Math.floor(d.v * FLOWER_COLS.length)];
        const sway = Math.sin(t * 1.6 + x) * 0.5;
        c.strokeStyle = '#3E8F4A'; c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + sway, y - 6); c.stroke();
        c.fillStyle = col;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU;
          c.beginPath(); c.arc(x + sway + Math.cos(a) * 1.4, y - 6 + Math.sin(a) * 1.4, 1.1, 0, TAU); c.fill();
        }
        c.fillStyle = '#FFB13B';
        c.beginPath(); c.arc(x + sway, y - 6, 0.8, 0, TAU); c.fill();
        break;
      }
      case 'mushroom': {
        c.fillStyle = '#FFF3DC'; c.strokeStyle = INK; c.lineWidth = 0.5;
        c.beginPath(); c.rect(x - 0.8, y - 3, 1.6, 3); c.fill(); c.stroke();
        c.fillStyle = d.v < 0.5 ? '#E8414E' : '#C98A4B';
        c.beginPath(); c.arc(x, y - 3, 2.6, Math.PI, TAU); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#FFFFFF';
        c.beginPath(); c.arc(x - 1, y - 4.2, 0.5, 0, TAU); c.arc(x + 1.1, y - 3.8, 0.4, 0, TAU); c.fill();
        break;
      }
      case 'crystal': {
        const col = d.v < 0.5 ? '#B98BFF' : '#6FE3F2';
        const glow = 0.5 + Math.sin(t * 2 + x) * 0.25;
        c.fillStyle = col; c.globalAlpha = 0.25 * glow;
        c.beginPath(); c.arc(x, y - 3, 6, 0, TAU); c.fill();
        c.globalAlpha = 1;
        c.strokeStyle = INK; c.lineWidth = 0.5;
        for (const [dx, h, w] of [[-1.5, 5, 1.6], [0.8, 7, 2], [2.6, 4, 1.3]]) {
          c.beginPath();
          c.moveTo(x + dx - w, y); c.lineTo(x + dx - w, y - h + 1.5); c.lineTo(x + dx, y - h); c.lineTo(x + dx + w, y - h + 1.5); c.lineTo(x + dx + w, y);
          c.closePath();
          c.fillStyle = col; c.fill(); c.stroke();
        }
        break;
      }
      case 'stalactite': {
        const h = 5 + d.s * 5;
        c.fillStyle = '#6D6585'; c.strokeStyle = INK; c.lineWidth = 0.5;
        c.beginPath(); c.moveTo(x - 2 * d.s, y); c.lineTo(x, y + h); c.lineTo(x + 2 * d.s, y); c.closePath(); c.fill(); c.stroke();
        /* une goutte qui tombe de temps en temps */
        const k = (t * 0.5 + d.s * 7) % 3;
        if (k < 1) {
          c.fillStyle = 'rgba(140,220,255,0.8)';
          c.beginPath(); c.arc(x, y + h + k * 14, 0.7, 0, TAU); c.fill();
        }
        break;
      }
      case 'pebble': {
        c.fillStyle = '#C7CDD6'; c.strokeStyle = INK; c.lineWidth = 0.5;
        c.beginPath(); c.ellipse(x, y - 1.2, 2.4, 1.5, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#FFFFFF';
        c.beginPath(); c.ellipse(x - 0.4, y - 2.3, 1.6, 0.6, 0, 0, TAU); c.fill();
        break;
      }
      default: break;
    }
  }
}

/* gros décor derrière les Pompons : arbres, sapins, rochers… */
export function drawBigDecor(c, big, solid, theme, t) {
  for (const d of big) {
    if (!solid(d.x, d.y) || solid(d.x, d.y - 1)) continue;
    const { x, y, s } = d;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.globalAlpha = 0.95;
    c.strokeStyle = INK;
    c.lineWidth = 0.9;
    if (d.kind === 'prairie') {
      c.fillStyle = '#9A6B3E';
      c.beginPath(); c.moveTo(-2.5, 0); c.lineTo(-1.8, -16); c.lineTo(1.8, -16); c.lineTo(2.5, 0); c.closePath(); c.fill(); c.stroke();
      const sway = Math.sin(t * 1.2 + x) * 0.6;
      for (const [dx, dy, r, col] of [[-6, -18, 7, '#4DB062'], [6, -19, 7.5, '#4DB062'], [0, -25, 8.5, '#5FC46E'], [-2, -20, 6, '#6DD07A']]) {
        c.beginPath(); c.arc(dx + sway, dy, r, 0, TAU); c.fillStyle = col; c.fill(); c.stroke();
      }
      if (d.v < 0.5) for (const [dx, dy] of [[-4, -22], [4, -26], [2, -18]]) { c.beginPath(); c.arc(dx + sway, dy, 1.3, 0, TAU); c.fillStyle = '#FF5C6C'; c.fill(); }
    } else if (d.kind === 'foret') {
      c.fillStyle = '#6E4526';
      c.beginPath(); c.moveTo(-2, 0); c.lineTo(-1.5, -10); c.lineTo(1.5, -10); c.lineTo(2, 0); c.closePath(); c.fill(); c.stroke();
      for (const [w, yy, col] of [[11, -8, '#2F7F45'], [9, -16, '#38914F'], [6.5, -23, '#43A35A']]) {
        c.beginPath(); c.moveTo(-w, yy); c.lineTo(0, yy - 12); c.lineTo(w, yy); c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
      }
    } else if (d.kind === 'montagne') {
      c.fillStyle = '#6E4526';
      c.beginPath(); c.rect(-1.3, -6, 2.6, 6); c.fill(); c.stroke();
      for (const [w, yy] of [[9, -5], [7, -12], [5, -18]]) {
        c.beginPath(); c.moveTo(-w, yy); c.lineTo(0, yy - 10); c.lineTo(w, yy); c.closePath(); c.fillStyle = '#2F6F55'; c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-w * 0.6, yy - 4); c.lineTo(0, yy - 10); c.lineTo(w * 0.6, yy - 4); c.quadraticCurveTo(0, yy - 6, -w * 0.6, yy - 4); c.fillStyle = '#FFFFFF'; c.fill();
      }
    } else if (d.kind === 'grotte') {
      const col = d.v < 0.5 ? '#B98BFF' : '#6FE3F2';
      c.globalAlpha = 0.3 + Math.sin(t * 1.5 + x) * 0.1;
      c.fillStyle = col;
      c.beginPath(); c.arc(0, -8, 16, 0, TAU); c.fill();
      c.globalAlpha = 1;
      for (const [dx, h, w] of [[-5, 10, 3], [0, 16, 4], [5, 12, 3], [9, 6, 2]]) {
        c.beginPath();
        c.moveTo(dx - w, 0); c.lineTo(dx - w, -h + 3); c.lineTo(dx, -h); c.lineTo(dx + w, -h + 3); c.lineTo(dx + w, 0); c.closePath();
        c.fillStyle = col; c.fill(); c.stroke();
        c.beginPath(); c.moveTo(dx - w * 0.4, -2); c.lineTo(dx - w * 0.4, -h + 3.5); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke(); c.strokeStyle = INK;
      }
    }
    c.restore();
  }
}

/* ---------- Les fonds de chaque monde (en pixels d'écran) ----------
   camX : la position de la caméra en pixels du monde, z : le zoom,
   W, H : la taille de l'écran, top : où commence le haut du niveau. */
function hills(c, W, H, base, amp, step, off, col, seed, round = true) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, H);
  const first = Math.floor(off / step) - 1;
  const last = Math.ceil((off + W) / step) + 1;
  let px = 0;
  for (let i = first; i <= last; i++) {
    const x = i * step - off;
    const y = base - amp * (0.4 + hash(i, seed) * 0.6);
    if (i === first) { c.lineTo(x, y); px = x; continue; }
    if (round) c.quadraticCurveTo((px + x) / 2, y - amp * 0.25, x, y);
    else c.lineTo(x, y);
    px = x;
  }
  c.lineTo(W, H);
  c.closePath();
  c.fill();
}
function peaks(c, W, H, base, amp, step, off, col, snow, seed) {
  const first = Math.floor(off / step) - 1;
  const last = Math.ceil((off + W) / step) + 1;
  for (let i = first; i <= last; i++) {
    const cx = i * step - off + hash(i, seed) * step * 0.4;
    const h = amp * (0.6 + hash(i, seed + 1) * 0.5);
    const w = step * (0.7 + hash(i, seed + 2) * 0.4);
    c.fillStyle = col;
    c.beginPath(); c.moveTo(cx - w, base); c.lineTo(cx, base - h); c.lineTo(cx + w, base); c.closePath(); c.fill();
    if (snow) {
      c.fillStyle = snow;
      c.beginPath();
      c.moveTo(cx - w * 0.3, base - h * 0.7);
      c.lineTo(cx, base - h);
      c.lineTo(cx + w * 0.3, base - h * 0.7);
      c.lineTo(cx + w * 0.12, base - h * 0.62);
      c.lineTo(cx, base - h * 0.72);
      c.lineTo(cx - w * 0.14, base - h * 0.6);
      c.closePath();
      c.fill();
    }
  }
}

export function drawBackground(c, theme, camX, z, W, H, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.ciel[0]);
  g.addColorStop(1, theme.ciel[1]);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const s = Math.max(0.7, Math.min(2.2, z));
  const kind = theme.fond;
  if (kind === 'prairie' || kind === 'montagne') {
    /* le soleil */
    const sx = W * 0.82;
    const sy = H * 0.16;
    const sg = c.createRadialGradient(sx, sy, 4, sx, sy, 80 * s);
    sg.addColorStop(0, 'rgba(255,244,190,0.95)');
    sg.addColorStop(0.25, 'rgba(255,230,140,0.5)');
    sg.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = sg;
    c.beginPath(); c.arc(sx, sy, 80 * s, 0, TAU); c.fill();
    c.fillStyle = '#FFF1A8';
    c.beginPath(); c.arc(sx, sy, 22 * s, 0, TAU); c.fill();
    /* les nuages qui glissent */
    for (let i = 0; i < 6; i++) {
      const span = W + 300;
      const x = ((hash(i, 3) * span - camX * z * 0.08 + t * (8 + i * 2)) % span + span) % span - 150;
      const y = H * (0.08 + hash(i, 4) * 0.3);
      const r = (16 + hash(i, 5) * 14) * s;
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath();
      c.arc(x, y, r, 0, TAU); c.arc(x + r * 1.1, y + r * 0.2, r * 0.8, 0, TAU); c.arc(x - r * 1.1, y + r * 0.25, r * 0.7, 0, TAU);
      c.fill();
    }
  }
  if (kind === 'prairie') {
    hills(c, W, H, H * 0.62, 70 * s, 220 * s, camX * z * 0.15, '#A6DDB5', 1);
    hills(c, W, H, H * 0.74, 60 * s, 170 * s, camX * z * 0.3, '#86D19A', 2);
  } else if (kind === 'montagne') {
    peaks(c, W, H, H * 0.75, 260 * s, 190 * s, camX * z * 0.1, '#A9BCD6', '#FFFFFF', 1);
    peaks(c, W, H, H * 0.86, 190 * s, 150 * s, camX * z * 0.22, '#8AA0BE', '#F4F8FF', 2);
    hills(c, W, H, H * 0.92, 40 * s, 160 * s, camX * z * 0.35, '#E8F0FA', 3);
    /* la neige qui tombe */
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 60; i++) {
      const x = ((hash(i, 11) * W - camX * z * 0.4 + Math.sin(t + i) * 12) % W + W) % W;
      const y = ((hash(i, 12) * H + t * (18 + hash(i, 13) * 20)) % H);
      c.beginPath(); c.arc(x, y, 1.2 + hash(i, 14) * 1.6, 0, TAU); c.fill();
    }
  } else if (kind === 'foret') {
    /* les rayons de lumière */
    c.save();
    c.globalAlpha = 0.18;
    c.fillStyle = '#FFFBD0';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 0.27 + 0.1) * W - camX * z * 0.05) % (W + 200);
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60 * s, 0); c.lineTo(x + 220 * s, H); c.lineTo(x + 120 * s, H); c.closePath(); c.fill();
    }
    c.restore();
    /* les arbres du fond */
    const layer = (f, col, base, step, seed, tall) => {
      const off = camX * z * f;
      const first = Math.floor(off / step) - 1;
      const last = Math.ceil((off + W) / step) + 1;
      for (let i = first; i <= last; i++) {
        const x = i * step - off + hash(i, seed) * step * 0.5;
        const h = tall * (0.7 + hash(i, seed + 1) * 0.5);
        c.fillStyle = col;
        c.fillRect(x - 6 * s, base - h * 0.4, 12 * s, h * 0.4 + H);
        for (let k = 0; k < 3; k++) {
          const w = (34 - k * 8) * s;
          const yy = base - h * 0.35 - k * h * 0.22;
          c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x, yy - h * 0.38); c.lineTo(x + w, yy); c.closePath(); c.fill();
        }
      }
    };
    layer(0.12, '#8CCBA9', H * 0.8, 120 * s, 1, 200 * s);
    layer(0.25, '#5FAE84', H * 0.92, 150 * s, 2, 220 * s);
  } else if (kind === 'grotte') {
    /* les parois du fond */
    hills(c, W, H, H * 0.25, -60 * s, 120 * s, camX * z * 0.12, '#1C1738', 1, false);
    c.save();
    c.scale(1, -1);
    hills(c, W, -H * 0.02, -H * 0.02, 80 * s, 140 * s, camX * z * 0.12, '#1C1738', 5, false);
    c.restore();
    hills(c, W, H, H * 0.85, 80 * s, 130 * s, camX * z * 0.2, '#3A2F63', 2, false);
    /* cristaux qui brillent au loin */
    for (let i = 0; i < 14; i++) {
      const span = W + 200;
      const x = ((hash(i, 21) * span * 2 - camX * z * 0.2) % span + span) % span - 100;
      const y = H * (0.5 + hash(i, 22) * 0.4);
      const col = hash(i, 23) < 0.5 ? '185,139,255' : '111,227,242';
      const a = 0.25 + Math.sin(t * 1.3 + i) * 0.12;
      const r = (10 + hash(i, 24) * 20) * s;
      const gg = c.createRadialGradient(x, y, 1, x, y, r);
      gg.addColorStop(0, `rgba(${col},${a + 0.3})`);
      gg.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = gg;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    /* lucioles */
    for (let i = 0; i < 18; i++) {
      const x = ((hash(i, 31) * W + Math.sin(t * 0.7 + i) * 30 - camX * z * 0.3) % W + W) % W;
      const y = hash(i, 32) * H + Math.cos(t * 0.9 + i) * 20;
      c.fillStyle = `rgba(255,240,150,${0.5 + Math.sin(t * 3 + i * 2) * 0.4})`;
      c.beginPath(); c.arc(x, y, 1.6 * s, 0, TAU); c.fill();
    }
  }
}

/* ---------- Plume, la chouette ---------- */
export const PLUME_SVG = `<svg class="bip plume" viewBox="0 0 80 84" aria-hidden="true">
  <path d="M18 22 L14 4 L30 16 Z" fill="#8A5A34" stroke="#3A2A4A" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M62 22 L66 4 L50 16 Z" fill="#8A5A34" stroke="#3A2A4A" stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="13" cy="50" rx="8" ry="16" fill="#8A5A34" stroke="#3A2A4A" stroke-width="2.5" transform="rotate(12 13 50)"/>
  <ellipse cx="67" cy="50" rx="8" ry="16" fill="#8A5A34" stroke="#3A2A4A" stroke-width="2.5" transform="rotate(-12 67 50)"/>
  <ellipse cx="40" cy="46" rx="27" ry="31" fill="#B98552" stroke="#3A2A4A" stroke-width="3"/>
  <ellipse cx="40" cy="58" rx="16" ry="17" fill="#F6E2BE"/>
  <path d="M33 54 q3 3 6 0 M41 54 q3 3 6 0 M37 62 q3 3 6 0" stroke="#C9A27A" stroke-width="2" fill="none" stroke-linecap="round"/>
  <g class="bip-eyes">
    <circle cx="29" cy="36" r="10.5" fill="#FFFFFF" stroke="#FFC93C" stroke-width="3"/>
    <circle cx="51" cy="36" r="10.5" fill="#FFFFFF" stroke="#FFC93C" stroke-width="3"/>
    <circle cx="30" cy="37" r="5" fill="#2E2A4D"/>
    <circle cx="50" cy="37" r="5" fill="#2E2A4D"/>
    <circle cx="28.3" cy="35" r="1.8" fill="#FFFFFF"/>
    <circle cx="48.3" cy="35" r="1.8" fill="#FFFFFF"/>
  </g>
  <path d="M35 45 L45 45 L40 52 Z" fill="#FF9F3C" stroke="#3A2A4A" stroke-width="2" stroke-linejoin="round"/>
  <path class="bip-mouth" d="M37 50 L43 50 L40 54 Z" fill="#E07C22"/>
  <path d="M30 76 l-3 5 M33 76 l0 5 M47 76 l0 5 M50 76 l3 5" stroke="#FF9F3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M38 12 q6 -9 13 -6 q-4 7 -13 6 Z" fill="#7BD17A" stroke="#3A2A4A" stroke-width="2"/>
</svg>`;

/* Plume dessinée sur un canvas (animations de départ et de fin) */
export function drawPlume(c, x, y, s, t, { flap = 0, talk = false } = {}) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineWidth = 2.5;
  c.strokeStyle = INK;
  const wing = Math.sin(flap) * 0.9;
  for (const side of [-1, 1]) {
    c.save();
    c.translate(side * 24, 2);
    c.rotate(side * (0.25 + wing));
    c.beginPath(); c.ellipse(side * 6, 0, 9, 17, 0, 0, TAU);
    c.fillStyle = '#8A5A34'; c.fill(); c.stroke();
    c.restore();
  }
  for (const side of [-1, 1]) {
    c.beginPath(); c.moveTo(side * 22, -24); c.lineTo(side * 26, -42); c.lineTo(side * 10, -30); c.closePath();
    c.fillStyle = '#8A5A34'; c.fill(); c.stroke();
  }
  c.beginPath(); c.ellipse(0, 0, 27, 31, 0, 0, TAU);
  c.fillStyle = '#B98552'; c.lineWidth = 3; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0, 12, 16, 17, 0, 0, TAU); c.fillStyle = '#F6E2BE'; c.fill();
  const blink = (t % 3.2) < 0.12;
  for (const side of [-1, 1]) {
    c.beginPath(); c.arc(side * 11, -10, 10.5, 0, TAU);
    c.fillStyle = '#FFFFFF'; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#FFC93C'; c.stroke();
    if (blink) {
      c.strokeStyle = INK; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(side * 11 - 6, -10); c.lineTo(side * 11 + 6, -10); c.stroke();
    } else {
      c.beginPath(); c.arc(side * 10, -9, 5, 0, TAU); c.fillStyle = '#2E2A4D'; c.fill();
      c.beginPath(); c.arc(side * 10 - 1.7, -11, 1.8, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill();
    }
  }
  c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-5, -1); c.lineTo(5, -1); c.lineTo(0, talk ? 5 + Math.abs(Math.sin(t * 14)) * 3 : 6); c.closePath();
  c.fillStyle = '#FF9F3C'; c.fill(); c.stroke();
  c.strokeStyle = '#FF9F3C'; c.lineWidth = 2.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-10, 30); c.lineTo(-13, 35); c.moveTo(-7, 30); c.lineTo(-7, 35); c.moveTo(7, 30); c.lineTo(7, 35); c.moveTo(10, 30); c.lineTo(13, 35); c.stroke();
  c.beginPath(); c.moveTo(-2, -34); c.quadraticCurveTo(4, -43, 11, -40); c.quadraticCurveTo(7, -33, -2, -34); c.closePath();
  c.fillStyle = '#7BD17A'; c.strokeStyle = INK; c.lineWidth = 2; c.fill(); c.stroke();
  c.restore();
}

/* ---------- Les icônes des métiers : un Pompon au travail ---------- */
export function drawSkillIcon(cv, skill) {
  const c = cv.getContext('2d');
  const S = cv.width;
  c.clearRect(0, 0, S, S);
  const k = S / 30;
  c.save();
  c.scale(k, k);
  const p = { id: { stop: 0, pont: 1, creuse: 5, tunnel: 2, grimpe: 3, parapluie: 4 }[skill] || 0, x: 15, y: 25, dir: 1, state: 'marche', work: 4, anim: 3, fall: 0, bricks: 9, grimpe: false, parapluie: false };
  if (skill === 'stop') p.state = 'stop';
  if (skill === 'pont') {
    p.state = 'pont';
    c.fillStyle = '#EDA65A'; c.strokeStyle = INK; c.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) { c.fillRect(13 + i * 4, 25 - i * 2 - 2, 10, 2); c.strokeRect(13 + i * 4, 25 - i * 2 - 2, 10, 2); }
    p.x = 13; p.y = 25;
  }
  if (skill === 'creuse') {
    p.state = 'creuse';
    c.fillStyle = '#B9773F'; c.fillRect(0, 25, 30, 5);
    c.fillStyle = '#5a3a20'; c.fillRect(10, 25, 10, 5);
    p.y = 27;
  }
  if (skill === 'tunnel') {
    p.state = 'tunnel'; p.x = 11;
    c.fillStyle = '#B9773F'; c.fillRect(20, 8, 10, 20);
    c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(20, 8, 10, 20);
  }
  if (skill === 'grimpe') {
    p.state = 'grimpe'; p.grimpe = true; p.x = 15; p.y = 26;
    c.fillStyle = '#9AA3AD'; c.fillRect(22, 0, 8, 30);
    c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(22, 0, 8, 30);
  }
  if (skill === 'parapluie') { p.state = 'tombe'; p.parapluie = true; p.fall = 30; p.y = 30; }
  if (skill !== 'creuse' && skill !== 'parapluie') {
    c.fillStyle = '#58C46B'; c.fillRect(0, 25, skill === 'tunnel' ? 20 : 30, 5);
  }
  drawPompon(c, p, 0.3);
  c.restore();
}
