// ============================================================================
// Évolution — la voie des humains, en VUE DE TROIS QUARTS : le sol est vu
// d'en haut, mais tout ce qui est debout (les humains, les animaux, les
// arbres, les huttes, la palissade) se dessine debout, de face, et se range
// du fond vers le devant (voir tqv.js).
//
//   - Les humains (drawHuman) : de petits personnages tout ronds, de face,
//     qui marchent ; leur peau, leurs cheveux et leurs habits changent d'une
//     personne à l'autre ; ils tiennent leur outil (torche, lance, hache,
//     houe, jarre) et portent ce qu'ils transportent (le feu, l'eau, le bois).
//   - Les animaux de l'âge de glace, debout sur le sol (dessinés de profil
//     par art-profil.js, avec leur trompe, leurs défenses, leurs cornes…).
//   - Le décor et les constructions : les arbres, les rochers, le silex,
//     l'ocre, le blé sauvage, la grotte, le foyer, les huttes, l'enclos, les
//     champs, le grenier, la palissade, la porte, la tour de guet ; et les
//     plans de ce qu'on peut construire.
// Repère : (x, y) = l'endroit où ça touche le sol ; tout monte vers le haut.
// Les looks s'appellent « th-<nom> ».
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SNOUT, shade } from './art.js';
import { drawMammal } from './art-profil.js';
import './art-cote.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;

/* Quand un personnage est tout petit à l'écran, on saute les détails invisibles */
let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 12;
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
}
function ell(ctx, x, y, rx, ry, a = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a, 0, TAU);
}
/** Une ombre douce, par terre */
export function groundShadow(ctx, x, y, rx, ry, a = 0.28) {
  ctx.fillStyle = `rgba(20, 30, 10, ${a})`;
  ell(ctx, x, y, rx, ry);
  ctx.fill();
}
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
function limb(ctx, x1, y1, r1, x2, y2, r2, col, dark, lw) {
  ctx.beginPath();
  capsule(ctx, x1, y1, r1, x2, y2, r2);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
}
const seeded = (s) => {
  let a = (s * 9301 + 49297) % 233280;
  return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; };
};

/* ============================================================================
   LA FLAMME (torche, foyer, arbre en feu) : elle danse
   ============================================================================ */
export function flame(ctx, x, y, s, t, seed = 0) {
  const f1 = Math.sin(t * 13 + seed) * 0.12, f2 = Math.sin(t * 17 + seed * 2) * 0.1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y - s * 0.6, 0, x, y - s * 0.6, s * 2.6);
  g.addColorStop(0, 'rgba(255, 190, 90, 0.45)');
  g.addColorStop(1, 'rgba(255, 120, 30, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - s * 2.6, y - s * 3.2, s * 5.2, s * 5.2);
  ctx.restore();
  for (const [col, k, dx] of [['#E8541E', 1, 0], ['#FF9A2A', 0.78, f2 * s], ['#FFD84A', 0.52, f1 * s], ['#FFF6C8', 0.28, 0]]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55 * k, y);
    ctx.quadraticCurveTo(x - s * 0.6 * k, y - s * 0.8 * k, x + dx + f1 * s * k, y - s * 1.7 * k);
    ctx.quadraticCurveTo(x + s * 0.2 * k, y - s * 1.0 * k, x + s * 0.55 * k + f2 * s * 0.3, y - s * 0.6 * k);
    ctx.quadraticCurveTo(x + s * 0.6 * k, y - s * 0.1 * k, x, y + s * 0.05);
    ctx.closePath();
    ctx.fill();
  }
}

/* ============================================================================
   LES HUMAINS, de face (un peu tournés du côté où ils vont)
   o : { skin, hair, cloth, cloth2, style ('hirsute', 'court', 'long'), beard,
         brow (l'arcade du front d'Homo erectus), bare (le torse nu), tool
         ('torche', 'lance', 'hache', 'houe', 'massue', 'bouclier'), carry,
         paint (peintures de guerre), feather, band, cape, necklace, child, cute }
   ============================================================================ */
const SKINS = ['#8D5A3A', '#C68A5A', '#A8704A', '#6E4630', '#E2B48A', '#B07A52'];
const HAIRS = ['#2A1C14', '#4A2E1A', '#1C1411', '#6A4628', '#8A5A2A', '#3A2618'];
const FURS = ['#9A6A3A', '#7A5A3A', '#B08A5A', '#6E4A2A', '#8A6440'];
const WOVEN = ['#C2A878', '#A8885A', '#D2B888', '#B89A6A', '#9A7A50'];

export function drawHuman(ctx, c, t, o = {}) {
  const r = c.size * (o.child ? 0.78 : 1);
  setDetail(ctx, r);
  const x = c.x, y = c.y;
  const sp = clamp(c.speed ?? 0, 0, 1.2);
  // le sens : vers où il va (de dos s'il s'éloigne vers le haut)
  const ang = c.angle || 0;
  const f = c.face || (Math.cos(ang) >= 0 ? 1 : -1);
  const back = !o.front && sp > 0.25 && Math.sin(ang) < -0.75;
  const ph = (c.walk || 0) * 2.6;
  const k = Math.min(1, sp * 1.4);
  const skin = o.skin, hair = o.hair, cloth = o.cloth, cloth2 = o.cloth2 || shade(cloth, -0.18);
  const dark = shade(skin, -0.6);
  const lw = Math.max(0.7, r * 0.05);
  const bob = Math.abs(Math.sin(ph)) * r * 0.05 * k;
  const head = o.child ? 0.72 : 0.6;

  groundShadow(ctx, x, y, r * 0.6, r * 0.2);
  ctx.save();
  ctx.translate(x, y - bob);
  // ce qu'il porte sur le dos : un fagot de bois
  if (o.carry === 'bois' && !back) bundle(ctx, -f * r * 0.15, -r * 1.5, r, f);
  // les jambes
  for (const s of [-1, 1]) {
    const p = ph + (s > 0 ? 0 : Math.PI);
    const fx = s * r * 0.17 + f * Math.sin(p) * r * 0.2 * k;
    const lift = Math.max(0, Math.cos(p)) * r * 0.14 * k;
    const legCol = o.legs || skin;
    limb(ctx, s * r * 0.15, -r * 0.8, r * 0.13, fx, -r * 0.12 - lift, r * 0.1, legCol, dark, lw);
    ctx.fillStyle = o.shoes || shade(skin, -0.35);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ell(ctx, fx + f * r * 0.05, -r * 0.06 - lift, r * 0.15, r * 0.08);
    ctx.fill();
    ctx.stroke();
  }
  // la cape (le chef) derrière le corps
  if (o.cape) {
    ctx.fillStyle = o.cape;
    ctx.strokeStyle = shade(o.cape, -0.5);
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 1.55);
    ctx.quadraticCurveTo(-r * 0.62 - f * r * 0.1 * k, -r * 0.8, -r * 0.5 - f * r * 0.15 * k, -r * 0.35);
    ctx.lineTo(r * 0.5 - f * r * 0.15 * k, -r * 0.35);
    ctx.quadraticCurveTo(r * 0.62, -r * 0.8, r * 0.42, -r * 1.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // le corps : un habit en peau (ou en tissu), avec un bas en dents de scie
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, -r * 1.58);
    ctx.quadraticCurveTo(0, -r * 1.7, r * 0.36, -r * 1.58);
    ctx.quadraticCurveTo(r * 0.5, -r * 1.2, r * 0.42, -r * 0.62);
    const n = 5;
    for (let i = 0; i <= n; i++) {
      const xx = lerp(r * 0.42, -r * 0.42, i / n);
      ctx.lineTo(xx + r * 0.04, -r * (i % 2 ? 0.5 : 0.62));
    }
    ctx.quadraticCurveTo(-r * 0.5, -r * 1.2, -r * 0.36, -r * 1.58);
    ctx.closePath();
  };
  if (o.bare) {
    // (Homo erectus) le torse nu, et un pagne en peau
    ctx.fillStyle = skin;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.12, r * 0.4, r * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = cloth;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.92);
    ctx.lineTo(r * 0.4, -r * 0.92);
    for (let i = 0; i <= 4; i++) ctx.lineTo(lerp(r * 0.42, -r * 0.42, i / 4), -r * (i % 2 ? 0.52 : 0.66));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, -r * 1.6, 0, -r * 0.5);
    g.addColorStop(0, shade(cloth, 0.08));
    g.addColorStop(1, cloth2);
    ctx.fillStyle = g;
    bodyPath();
    ctx.fill();
    ctx.strokeStyle = shade(cloth, -0.55);
    ctx.lineWidth = lw;
    ctx.stroke();
    if (fine) {
      // des poils de fourrure, ou une bordure tissée
      ctx.save();
      bodyPath();
      ctx.clip();
      if (o.woven) {
        ctx.fillStyle = o.border || '#A8442A';
        ctx.fillRect(-r * 0.6, -r * 0.82, r * 1.2, r * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let i = -3; i <= 3; i++) ctx.fillRect(i * r * 0.12, -r * 1.6, r * 0.03, r * 0.8);
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = Math.max(0.5, lw * 0.6);
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const xx = -r * 0.3 + i * r * 0.1, yy = -r * (1.35 - (i % 3) * 0.18);
          ctx.moveTo(xx, yy);
          ctx.lineTo(xx + r * 0.03, yy + r * 0.12);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    // la ceinture, la lanière en travers
    ctx.strokeStyle = shade(cloth, -0.45);
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(-r * 0.43, -r * 0.88);
    ctx.lineTo(r * 0.43, -r * 0.88);
    if (o.strap) {
      ctx.moveTo(-r * 0.3, -r * 1.55);
      ctx.lineTo(r * 0.36, -r * 0.92);
    }
    ctx.stroke();
  }
  // le collier de dents (les chasseurs)
  if (o.necklace && fine && !back) {
    ctx.strokeStyle = '#5A3A22';
    ctx.lineWidth = Math.max(0.6, r * 0.03);
    ctx.beginPath();
    ctx.arc(0, -r * 1.62, r * 0.24, 0.35, Math.PI - 0.35);
    ctx.stroke();
    ctx.fillStyle = '#F4ECD8';
    for (let i = 0; i < 5; i++) {
      const a = 0.5 + i * 0.53;
      const px = Math.cos(a) * r * 0.24, py = -r * 1.62 + Math.sin(a) * r * 0.24;
      ctx.beginPath();
      ctx.moveTo(px - r * 0.035, py);
      ctx.lineTo(px, py + r * 0.11);
      ctx.lineTo(px + r * 0.035, py);
      ctx.fill();
    }
  }
  // les bras : celui de derrière, puis celui qui tient l'outil
  const armSw = Math.sin(ph) * r * 0.16 * k;
  const toolArm = o.tool || o.carry === 'feu' || o.carry === 'eau';
  for (const s of [-f, f]) {
    const sx = s * r * 0.38, sy = -r * 1.45;
    const hold = toolArm && s === f;
    const hx = hold ? s * r * 0.58 : s * r * 0.5 + (s === f ? armSw : -armSw) * 0.6;
    const hy = hold ? -r * 1.05 : -r * 0.86;
    limb(ctx, sx, sy, r * 0.12, hx, hy, r * 0.1, o.bare || o.sleeves === false ? skin : shade(cloth, 0.04), dark, lw);
    ctx.fillStyle = skin;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    circle(ctx, hx, hy, r * 0.11);
    ctx.fill();
    ctx.stroke();
    if (hold) holdTool(ctx, hx, hy, r, f, t, o, c);
  }
  // le bouclier (le chef)
  if (o.shield && !back) {
    const bx = -f * r * 0.42, by = -r * 1.08;
    const sg = ctx.createRadialGradient(bx - r * 0.1, by - r * 0.1, r * 0.05, bx, by, r * 0.4);
    sg.addColorStop(0, '#B08A5A');
    sg.addColorStop(1, '#6E4A2A');
    ctx.fillStyle = sg;
    ctx.strokeStyle = '#3A2414';
    ctx.lineWidth = lw * 1.3;
    ell(ctx, bx, by, r * 0.34, r * 0.4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#A8442A';
    circle(ctx, bx, by, r * 0.09);
    ctx.fill();
  }
  // la tête
  const hy = -r * (1.62 + head * 0.68);
  const hx = back ? 0 : f * r * 0.04;
  const R = r * head;
  const style = o.style || 'court';
  if (style === 'long' || style === 'hirsute') {
    // les cheveux de derrière
    ctx.fillStyle = hair;
    ctx.strokeStyle = shade(hair, -0.5);
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(hx, hy + R * (style === 'long' ? 0.45 : 0.15), R * (style === 'long' ? 1.08 : 1.12), R * (style === 'long' ? 1.1 : 1.0), 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  const sg = ctx.createRadialGradient(hx - f * R * 0.3, hy - R * 0.35, R * 0.1, hx, hy, R * 1.05);
  sg.addColorStop(0, shade(skin, 0.14));
  sg.addColorStop(1, shade(skin, -0.08));
  ctx.fillStyle = sg;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  circle(ctx, hx, hy, R);
  ctx.fill();
  ctx.stroke();
  // l'oreille (du côté qu'on voit)
  if (!back && style !== 'long') {
    ctx.fillStyle = shade(skin, -0.05);
    circle(ctx, hx - f * R * 0.95, hy + R * 0.08, R * 0.2);
    ctx.fill();
    ctx.stroke();
  }
  // les cheveux de devant (ou toute la tête, de dos)
  ctx.fillStyle = hair;
  ctx.strokeStyle = shade(hair, -0.5);
  ctx.lineWidth = lw;
  ctx.beginPath();
  if (back) {
    ctx.arc(hx, hy, R * 1.02, 0, TAU);
  } else {
    const spikes = style === 'hirsute' ? 7 : 5;
    ctx.moveTo(hx - R * 1.02, hy + R * 0.1);
    ctx.quadraticCurveTo(hx - R * 1.1, hy - R * 1.15, hx, hy - R * 1.12);
    ctx.quadraticCurveTo(hx + R * 1.1, hy - R * 1.15, hx + R * 1.02, hy + R * 0.1);
    for (let i = 0; i <= spikes; i++) {
      const u = i / spikes;
      const xx = lerp(hx + R * 0.95, hx - R * 0.95, u) + f * R * 0.1;
      const yy = hy - R * (0.35 + Math.sin(u * Math.PI) * 0.12) + (i % 2 ? R * 0.14 : 0);
      ctx.lineTo(xx, yy);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  if (!back) face(ctx, hx, hy, R, f, c, o, skin, dark, lw);
  // le bandeau, la plume
  if (o.band) {
    ctx.strokeStyle = o.band;
    ctx.lineWidth = Math.max(1, R * 0.16);
    ctx.beginPath();
    ctx.arc(hx, hy + R * 0.1, R * 0.98, Math.PI + 0.35, TAU - 0.35);
    ctx.stroke();
  }
  if (o.feather) {
    for (const [dx, a, col] of [[-0.3, -0.5, o.feather], [0.05, -0.15, '#F2EEE6']]) {
      ctx.fillStyle = col;
      ctx.strokeStyle = shade(col, -0.5);
      ctx.lineWidth = Math.max(0.5, lw * 0.7);
      ctx.save();
      ctx.translate(hx - f * R * 0.5 + dx * R, hy - R * 0.85);
      ctx.rotate(a * -f);
      ell(ctx, 0, -R * 0.45, R * 0.13, R * 0.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Le visage, tourné du côté f */
function face(ctx, hx, hy, R, f, c, o, skin, dark, lw) {
  const mood = c.mood || 'happy';
  const blink = c.blink || 0;
  const ex = hx + f * R * 0.22, ey = hy + R * 0.02;
  if (o.brow) {
    // l'arcade du front, bien marquée (Homo erectus, Néandertal)
    ctx.fillStyle = shade(skin, -0.25);
    ctx.beginPath();
    ctx.ellipse(ex - f * R * 0.04, ey - R * 0.3, R * 0.62, R * 0.15, 0, Math.PI, TAU);
    ctx.fill();
  }
  const er = R * (o.cute ? 0.2 : 0.16);
  for (const s of [-1, 1]) {
    const x = ex + s * R * 0.3;
    const sc = s === -f ? 0.86 : 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(0.5, er * 0.25);
    ctx.beginPath();
    ctx.ellipse(x, ey, er * sc, Math.max(0.1, er * (1 - blink * 0.9)), 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (blink < 0.6) {
      const pr = er * (mood === 'scared' ? 0.42 : 0.6);
      ctx.fillStyle = o.iris || '#3A2414';
      circle(ctx, x + f * er * 0.25, ey + er * 0.08, pr);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      circle(ctx, x + f * er * 0.1, ey - er * 0.18, pr * 0.38);
      ctx.fill();
    }
    if (mood === 'angry' || mood === 'scared') {
      const tilt = (mood === 'angry' ? 1 : -1) * s;
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(0.6, er * 0.35);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - er, ey - er * 1.5 - tilt * er * 0.3);
      ctx.lineTo(x + er, ey - er * 1.5 + tilt * er * 0.3);
      ctx.stroke();
    }
  }
  // les peintures de guerre (les pillards)
  if (o.paint && fine) {
    ctx.strokeStyle = o.paint;
    ctx.lineWidth = Math.max(0.8, R * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const s of [-1, 1]) {
      const x = ex + s * R * 0.32;
      ctx.moveTo(x - R * 0.12, ey + R * 0.25);
      ctx.lineTo(x + R * 0.12, ey + R * 0.25);
      ctx.moveTo(x - R * 0.12, ey + R * 0.38);
      ctx.lineTo(x + R * 0.12, ey + R * 0.38);
    }
    ctx.stroke();
  }
  // la barbe (autour du menton seulement : on voit toujours le sourire)
  if (o.beard) {
    ctx.fillStyle = shade(o.hair, 0.12);
    ctx.beginPath();
    ctx.moveTo(ex - R * 0.55, ey + R * 0.38);
    ctx.quadraticCurveTo(ex - R * 0.45, ey + R * 1.0, ex + f * R * 0.05, ey + R * 1.02);
    ctx.quadraticCurveTo(ex + R * 0.45, ey + R * 1.0, ex + R * 0.55, ey + R * 0.38);
    ctx.quadraticCurveTo(ex + f * R * 0.05, ey + R * 0.68, ex - R * 0.55, ey + R * 0.38);
    ctx.fill();
  }
  // le nez, la bouche, les joues
  ctx.fillStyle = shade(skin, -0.18);
  ell(ctx, ex + f * R * 0.06, ey + R * 0.22, R * 0.1, R * 0.07);
  ctx.fill();
  ctx.strokeStyle = shade(skin, -0.6);
  ctx.lineWidth = Math.max(0.6, R * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  const my = ey + R * 0.45;
  if (mood === 'scared' || (c.mouth || 0) > 0.5) {
    ctx.fillStyle = '#5E1B28';
    ell(ctx, ex + f * R * 0.05, my, R * 0.11, R * 0.13);
    ctx.fill();
  } else if (mood === 'angry') {
    ctx.moveTo(ex - R * 0.15, my + R * 0.04);
    ctx.lineTo(ex + R * 0.2, my);
    ctx.stroke();
  } else {
    ctx.arc(ex + f * R * 0.04, my - R * 0.1, R * 0.17, 0.35, Math.PI - 0.35);
    ctx.stroke();
  }
  if (o.cute) {
    ctx.fillStyle = 'rgba(255, 120, 150, 0.45)';
    for (const s of [-1, 1]) {
      ell(ctx, ex + s * R * 0.42, ey + R * 0.3, R * 0.13, R * 0.08);
      ctx.fill();
    }
  }
}

/** Un fagot de bois sur le dos */
function bundle(ctx, x, y, r, f) {
  for (let i = 0; i < 4; i++) {
    const yy = y + i * r * 0.14;
    ctx.fillStyle = i % 2 ? '#8A6440' : '#7A5434';
    ctx.strokeStyle = '#3A2414';
    ctx.lineWidth = Math.max(0.6, r * 0.04);
    ctx.save();
    ctx.translate(x, yy);
    ctx.rotate(-0.25 * f + i * 0.08);
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-r * 0.6, -r * 0.07, r * 1.2, r * 0.14, r * 0.07) : ctx.rect(-r * 0.6, -r * 0.07, r * 1.2, r * 0.14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

/** L'outil dans la main (hx, hy) */
function holdTool(ctx, hx, hy, r, f, t, o, c) {
  const tool = o.carry === 'feu' ? 'torche' : o.carry === 'eau' ? 'jarre' : o.tool;
  const lw = Math.max(0.7, r * 0.05);
  const stick = (x1, y1, x2, y2, w, col = '#7A5434') => {
    ctx.strokeStyle = '#3A2414';
    ctx.lineCap = 'round';
    ctx.lineWidth = w + lw * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
  };
  if (tool === 'torche') {
    stick(hx, hy + r * 0.3, hx + f * r * 0.15, hy - r * 0.75, r * 0.1);
    flame(ctx, hx + f * r * 0.15, hy - r * 0.72, r * 0.32, t, (c.seed || 0) * 7);
  } else if (tool === 'lance') {
    // une longue lance, avec une pointe de silex taillé
    const tx = hx + f * r * 0.3, ty = hy - r * 1.9;
    stick(hx - f * r * 0.12, hy + r * 0.85, tx, ty, r * 0.08);
    ctx.fillStyle = '#B8B4A8';
    ctx.strokeStyle = '#4A4640';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(tx - r * 0.09, ty + r * 0.06);
    ctx.lineTo(tx + f * r * 0.04, ty - r * 0.36);
    ctx.lineTo(tx + r * 0.09, ty + r * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#A8442A';
    ctx.lineWidth = Math.max(0.6, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(tx - r * 0.07, ty + r * 0.12);
    ctx.lineTo(tx + r * 0.07, ty + r * 0.18);
    ctx.stroke();
  } else if (tool === 'hache' || tool === 'houe') {
    const tx = hx + f * r * 0.1, ty = hy - r * 0.75;
    stick(hx, hy + r * 0.25, tx, ty, r * 0.08);
    ctx.fillStyle = tool === 'hache' ? '#9A968C' : '#C9B89A';
    ctx.strokeStyle = '#3A3630';
    ctx.lineWidth = lw;
    ctx.beginPath();
    if (tool === 'hache') {
      ctx.moveTo(tx - f * r * 0.05, ty - r * 0.12);
      ctx.quadraticCurveTo(tx + f * r * 0.45, ty - r * 0.2, tx + f * r * 0.42, ty + r * 0.12);
      ctx.quadraticCurveTo(tx + f * r * 0.2, ty + r * 0.18, tx - f * r * 0.05, ty + r * 0.1);
    } else {
      ctx.moveTo(tx, ty - r * 0.05);
      ctx.lineTo(tx + f * r * 0.12, ty + r * 0.4);
      ctx.lineTo(tx + f * r * 0.3, ty + r * 0.36);
      ctx.lineTo(tx + f * r * 0.12, ty - r * 0.08);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (tool === 'massue') {
    stick(hx, hy + r * 0.2, hx + f * r * 0.2, hy - r * 0.65, r * 0.12, '#6A4A2A');
    ctx.fillStyle = '#5A3A22';
    ell(ctx, hx + f * r * 0.22, hy - r * 0.68, r * 0.17, r * 0.22);
    ctx.fill();
  } else if (tool === 'jarre') {
    // une jarre d'argile pleine d'eau, sur l'épaule
    const jx = hx + f * r * 0.02, jy = hy - r * 0.32;
    ctx.fillStyle = '#B8683E';
    ctx.strokeStyle = '#5A2A14';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(jx - r * 0.12, jy - r * 0.3);
    ctx.quadraticCurveTo(jx - r * 0.36, jy - r * 0.1, jx - r * 0.2, jy + r * 0.2);
    ctx.lineTo(jx + r * 0.2, jy + r * 0.2);
    ctx.quadraticCurveTo(jx + r * 0.36, jy - r * 0.1, jx + r * 0.12, jy - r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#E8C89A';
    ctx.lineWidth = Math.max(0.6, r * 0.04);
    ctx.beginPath();
    ctx.moveTo(jx - r * 0.24, jy - r * 0.02);
    ctx.lineTo(jx + r * 0.24, jy - r * 0.02);
    ctx.stroke();
    if (o.carry === 'eau') {
      ctx.fillStyle = '#5AB0E0';
      ell(ctx, jx, jy - r * 0.3, r * 0.11, r * 0.04);
      ctx.fill();
    }
  }
}

/* ============================================================================
   LES ANIMAUX, debout sur le sol (dessinés de profil par art-profil.js)
   ============================================================================ */
/** La trompe et les défenses du mammouth (repère de la tête : L vers l'avant, D vers le bas) */
function mammothHead(ctx, L, D, c, col, dark, lw) {
  const sw = Math.sin((c.walk || 0) * 1.5 + (c.seed || 0)) * 0.06;
  // les défenses, longues et recourbées
  ctx.fillStyle = '#F4ECD8';
  ctx.strokeStyle = '#7A6A50';
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(0.42 * L, 0.18 * D);
  ctx.quadraticCurveTo(0.95 * L, 0.95 * D, 1.35 * L, 0.35 * D);
  ctx.quadraticCurveTo(1.38 * L, 0.2 * D, 1.28 * L, 0.3 * D);
  ctx.quadraticCurveTo(0.95 * L, 0.72 * D, 0.55 * L, 0.05 * D);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // la trompe, épaisse, qui se balance jusqu'au sol
  ctx.fillStyle = shade(col, 0.06);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 1.2;
  ctx.beginPath();
  ctx.moveTo(0.48 * L, -0.12 * D);
  ctx.quadraticCurveTo((0.98 + sw) * L, 0.1 * D, (0.92 + sw * 2) * L, 1.0 * D);
  ctx.quadraticCurveTo((0.9 + sw * 2) * L, 1.32 * D, (1.06 + sw * 2) * L, 1.3 * D);
  ctx.lineTo((1.06 + sw * 2) * L, 1.12 * D);
  ctx.quadraticCurveTo((0.74 + sw) * L, 0.45 * D, 0.42 * L, 0.32 * D);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = Math.max(0.5, lw * 0.6);
  ctx.beginPath();
  for (let i = 1; i < 6; i++) {
    const u = i / 6;
    ctx.moveTo((0.62 + u * 0.28 + sw * u * 2) * L, (0.1 + u) * D);
    ctx.lineTo((0.75 + u * 0.24 + sw * u * 2) * L, (0.05 + u) * D);
  }
  ctx.stroke();
}
/** La longue toison du mammouth, qui pend sous le ventre */
function shaggy(ctx, r, pts, col, dark, lw) {
  // de longs poils qui pendent du ventre et des flancs (des mèches, pas une jupe)
  const x0 = pts[1][0], x1 = pts[pts.length - 3][0];
  const at = (xx, top) => {
    let a = pts[0], b = pts[pts.length - 1];
    for (let i = 1; i < pts.length; i++) if (pts[i][0] >= xx) { a = pts[i - 1]; b = pts[i]; break; }
    const k = (xx - a[0]) / ((b[0] - a[0]) || 1);
    return top ? (lerp(a[1], b[1], k) - lerp(a[2], b[2], k)) * r : (lerp(a[1], b[1], k) + lerp(a[3], b[3], k)) * r;
  };
  const hair = shade(col, -0.22);
  ctx.lineCap = 'round';
  for (const [w, c2] of [[Math.max(1.5, r * 0.07) + lw * 2, shade(col, -0.5)], [Math.max(1.5, r * 0.07), hair]]) {
    ctx.strokeStyle = c2;
    ctx.lineWidth = w;
    ctx.beginPath();
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const xx = lerp(x0, x1, i / n), yb = at(xx, false);
      const len = r * (0.16 + ((i * 7) % 5) * 0.035);
      ctx.moveTo(xx * r, yb - r * 0.18);
      ctx.quadraticCurveTo(xx * r - r * 0.03, yb + len * 0.5, xx * r + r * 0.02, yb + len);
    }
    ctx.stroke();
  }
  // des mèches plus claires sur le dos et la bosse
  ctx.strokeStyle = shade(col, 0.15);
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const xx = lerp(x0, x1, i / 14), yt = at(xx, true);
    ctx.moveTo(xx * r, yt + r * 0.06);
    ctx.lineTo(xx * r - r * 0.05, yt + r * 0.18);
  }
  ctx.stroke();
}
const horn = (kind) => (ctx, L, D, c, col, dark, lw) => {
  ctx.fillStyle = kind === 'aurochs' ? '#EDE2C6' : '#C8B48E';
  ctx.strokeStyle = '#5A4A30';
  ctx.lineWidth = lw;
  ctx.beginPath();
  if (kind === 'mouflon') {
    // une grosse corne enroulée
    ctx.arc(0.08 * L, -0.25 * D, 0.38 * D, -Math.PI * 0.9, Math.PI * 0.6);
    ctx.arc(0.08 * L, -0.25 * D, 0.2 * D, Math.PI * 0.6, -Math.PI * 0.9, true);
  } else if (kind === 'chevre') {
    ctx.moveTo(0.1 * L, -0.45 * D);
    ctx.quadraticCurveTo(-0.2 * L, -1.15 * D, -0.45 * L, -0.85 * D);
    ctx.quadraticCurveTo(-0.15 * L, -0.95 * D, 0.25 * L, -0.42 * D);
  } else {
    // (l'aurochs) des cornes en avant, en forme de lyre
    ctx.moveTo(0.05 * L, -0.42 * D);
    ctx.quadraticCurveTo(0.2 * L, -1.1 * D, 0.62 * L, -1.0 * D);
    ctx.quadraticCurveTo(0.3 * L, -0.85 * D, 0.25 * L, -0.38 * D);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (kind === 'chevre') {
    // la barbichette
    ctx.fillStyle = shade(col, -0.2);
    ctx.beginPath();
    ctx.moveTo(0.42 * L, 0.25 * D);
    ctx.lineTo(0.5 * L, 0.7 * D);
    ctx.lineTo(0.58 * L, 0.25 * D);
    ctx.fill();
  }
};
/** Les bois du renne et du cerf, qui se ramifient */
const antlers = (big) => (ctx, L, D, c, col, dark, lw) => {
  ctx.strokeStyle = '#3A2E20';
  ctx.lineCap = 'round';
  for (const [pass, w] of [[0, lw * 2 + D * 0.11], [1, D * 0.11]]) {
    ctx.strokeStyle = pass ? '#D8C39A' : '#4A3A28';
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0.05 * L, -0.4 * D);
    ctx.quadraticCurveTo(-0.3 * L, -1.4 * D * big, 0.2 * L, -1.9 * D * big);
    ctx.moveTo(-0.08 * L, -0.95 * D * big);
    ctx.lineTo(0.35 * L, -1.15 * D * big);
    ctx.moveTo(-0.02 * L, -1.45 * D * big);
    ctx.lineTo(0.4 * L, -1.7 * D * big);
    ctx.moveTo(0.1 * L, -0.55 * D);
    ctx.lineTo(0.45 * L, -0.6 * D);
    ctx.stroke();
  }
};
/** Les poils hérissés du sanglier */
function bristles(ctx, r, pts, col, dark, lw) {
  ctx.strokeStyle = shade(col, -0.45);
  ctx.lineWidth = Math.max(0.8, lw);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    for (let k = 0; k < 3; k++) {
      const xx = (p[0] + k * 0.08) * r, yy = (p[1] - p[2]) * r;
      ctx.moveTo(xx, yy + r * 0.02);
      ctx.lineTo(xx - r * 0.03, yy - r * 0.1);
    }
  }
  ctx.stroke();
}
function boarTusk(ctx, L, D) {
  ctx.fillStyle = '#F4ECD8';
  ctx.beginPath();
  ctx.moveTo(0.58 * L, 0.12 * D);
  ctx.quadraticCurveTo(0.7 * L, -0.25 * D, 0.62 * L, -0.32 * D);
  ctx.lineTo(0.66 * L, 0.12 * D);
  ctx.fill();
}

const MAM = {
  mammouth: {
    ground: 1.05, hip: [-0.48, -0.3], shoulder: [0.3, -0.5], depth: 0.62, hump: 1.45, hipTop: 0.9, belly: 1.0, sag: 0.04, pillar: true,
    neck: [[0.5, -0.58, 0.5], [0.62, -0.56, 0.48]],
    head: { x: 0.66, y: -0.62, L: 0.62, D: 0.95, snout: 0.85, dome: 0.95, ear: 'rond', earR: 0.35, eye: [0.22, -0.08], eyeR: 0.06, muzzle: false, extra: mammothHead },
    legW: 0.16, foreW: 1.05, stride: 0.22, cadence: 1.3,
    tail: { len: 0.3, w: 0.05, droop: 1.1, type: 'fine' }, extra: shaggy,
  },
  lion: {
    ground: 0.78, hip: [-0.56, -0.16], shoulder: [0.4, -0.2], depth: 0.36, belly: 0.86,
    neck: [[0.6, -0.3, 0.28], [0.72, -0.36, 0.26]],
    head: { x: 0.84, y: -0.42, L: 0.66, D: 0.56, snout: 0.36, dome: 0.18, ear: 'rond', earR: 0.6, eye: [0.16, -0.2], eyeR: 0.11, teeth: true, iris: '#D9A13A', gape: 0.7 },
    legW: 0.12, stride: 0.36, cadence: 2.1,
    tail: { len: 1.0, w: 0.07, droop: 0.4, curl: 0.3, type: 'touffue' },
  },
  ours: {
    ground: 0.82, hip: [-0.5, -0.32], shoulder: [0.36, -0.36], depth: 0.52, hump: 1.25, belly: 1.0,
    neck: [[0.56, -0.36, 0.38], [0.68, -0.34, 0.34]],
    head: { x: 0.78, y: -0.38, L: 0.66, D: 0.56, snout: 0.5, dome: 0.3, ear: 'rond', earR: 0.55, eye: [0.14, -0.22], eyeR: 0.09, teeth: true, noseCol: '#1E1614', gape: 0.6 },
    legW: 0.17, foreW: 1.05, stride: 0.26, cadence: 1.7,
    tail: { len: 0.12, w: 0.06, type: 'fine' },
  },
  hyene: {
    ground: 0.76, hip: [-0.48, -0.05], shoulder: [0.36, -0.28], depth: 0.34, hump: 1.1, belly: 0.86,
    neck: [[0.56, -0.36, 0.27], [0.68, -0.4, 0.24]],
    head: { x: 0.8, y: -0.42, L: 0.66, D: 0.54, snout: 0.48, ear: 'rond', earR: 0.75, eye: [0.14, -0.2], eyeR: 0.1, teeth: true, iris: '#C99A3A', gape: 0.6 },
    legW: 0.1, stride: 0.34, cadence: 2.2, spots: 9, stripeCol: '#4A3A2A',
    tail: { len: 0.4, w: 0.07, droop: 0.9, type: 'touffue' },
  },
  loup: {
    ground: 0.9, hip: [-0.6, -0.2], shoulder: [0.42, -0.24], depth: 0.32, belly: 0.82,
    neck: [[0.64, -0.34, 0.25], [0.78, -0.42, 0.22]],
    head: { x: 0.92, y: -0.46, L: 0.8, D: 0.44, snout: 0.42, ear: 'pointe', earR: 0.9, eye: [0.14, -0.22], eyeR: 0.1, teeth: true, iris: '#D9A13A' },
    legW: 0.095, stride: 0.38, cadence: 2.2,
    tail: { len: 0.95, w: 0.11, droop: -0.85, curl: 0.3, type: 'touffue' },
  },
  renne: {
    ground: 1.05, hip: [-0.55, -0.3], shoulder: [0.42, -0.32], depth: 0.34,
    neck: [[0.6, -0.48, 0.22], [0.72, -0.62, 0.2]],
    head: { x: 0.84, y: -0.66, L: 0.62, D: 0.42, snout: 0.55, ear: 'pointe', earR: 0.6, eye: [0.14, -0.2], eyeR: 0.12, noseCol: '#4A3A30', extra: antlers(1) },
    legW: 0.075, stride: 0.42, cadence: 2,
    tail: { len: 0.2, w: 0.06, droop: 0.3, type: 'touffue' },
  },
  cerf: {
    ground: 1.1, hip: [-0.55, -0.32], shoulder: [0.42, -0.34], depth: 0.32,
    neck: [[0.6, -0.52, 0.2], [0.72, -0.7, 0.18]],
    head: { x: 0.84, y: -0.74, L: 0.6, D: 0.38, snout: 0.55, ear: 'pointe', earR: 0.7, eye: [0.14, -0.2], eyeR: 0.13, noseCol: '#3A2A20', extra: antlers(1.25) },
    legW: 0.07, stride: 0.44, cadence: 2,
    tail: { len: 0.15, w: 0.07, droop: 0.2, type: 'touffue' }, spots: 0,
  },
  mouflon: {
    ground: 0.82, hip: [-0.48, -0.18], shoulder: [0.36, -0.2], depth: 0.38, belly: 0.95,
    neck: [[0.54, -0.32, 0.27], [0.64, -0.4, 0.24]],
    head: { x: 0.74, y: -0.44, L: 0.56, D: 0.46, snout: 0.5, ear: 'pointe', earR: 0.5, eye: [0.16, -0.18], eyeR: 0.12, noseCol: '#3A2A20', extra: horn('mouflon') },
    legW: 0.075, stride: 0.34, cadence: 2.3,
    tail: { len: 0.15, w: 0.06, droop: 0.5, type: 'touffue' },
  },
  mouton: {
    ground: 0.78, hip: [-0.46, -0.16], shoulder: [0.34, -0.18], depth: 0.42, belly: 1.0,
    neck: [[0.52, -0.3, 0.27], [0.62, -0.36, 0.24]],
    head: { x: 0.7, y: -0.4, L: 0.52, D: 0.44, snout: 0.5, ear: 'tombante', earR: 0.6, eye: [0.16, -0.16], eyeR: 0.13, noseCol: '#3A2A28' },
    legW: 0.075, stride: 0.3, cadence: 2.4, wool: '#F2EEE4',
    tail: { len: 0.12, w: 0.07, droop: 0.6, type: 'touffue' },
  },
  chevre: {
    ground: 0.84, hip: [-0.46, -0.2], shoulder: [0.34, -0.22], depth: 0.34,
    neck: [[0.52, -0.36, 0.22], [0.62, -0.46, 0.2]],
    head: { x: 0.72, y: -0.5, L: 0.56, D: 0.4, snout: 0.5, ear: 'tombante', earR: 0.5, eye: [0.16, -0.16], eyeR: 0.13, noseCol: '#3A2A20', extra: horn('chevre') },
    legW: 0.07, stride: 0.34, cadence: 2.4,
    tail: { len: 0.14, w: 0.06, droop: -0.6, type: 'touffue' },
  },
  sanglier: {
    ground: 0.62, hip: [-0.48, -0.06], shoulder: [0.32, -0.12], depth: 0.42, hump: 1.2, belly: 1.0,
    neck: [[0.5, -0.12, 0.34], [0.6, -0.1, 0.3]],
    head: { x: 0.68, y: -0.12, L: 0.62, D: 0.54, snout: 0.62, ear: 'pointe', earR: 0.45, eye: [0.12, -0.2], eyeR: 0.08, noseCol: '#3A2A28', extra: boarTusk },
    legW: 0.09, stride: 0.26, cadence: 2.8,
    tail: { len: 0.25, w: 0.04, droop: 0.4, curl: 0.6, type: 'fine' }, extra: bristles,
  },
  aurochs: {
    ground: 1.0, hip: [-0.55, -0.32], shoulder: [0.36, -0.36], depth: 0.48, hump: 1.2, belly: 1.0,
    neck: [[0.56, -0.38, 0.36], [0.68, -0.34, 0.32]],
    head: { x: 0.8, y: -0.32, L: 0.62, D: 0.52, snout: 0.55, ear: 'pointe', earR: 0.45, eye: [0.12, -0.2], eyeR: 0.09, noseCol: '#2A2024', extra: horn('aurochs') },
    legW: 0.12, stride: 0.32, cadence: 1.8,
    tail: { len: 0.6, w: 0.05, droop: 1.0, type: 'fine' },
  },
};

/* ============================================================================
   L'INSCRIPTION : les looks des espèces, les formes du joueur
   ============================================================================ */
export const HUMAN_LOOKS = {};
const H0 = (seed) => {
  const rnd = seeded(Math.floor((seed || 0) * 1000) + 7);
  return { skin: SKINS[Math.floor(rnd() * SKINS.length)], hair: HAIRS[Math.floor(rnd() * HAIRS.length)], r: rnd };
};
// les gens de la tribu : chacun le sien (peau, cheveux, habit, enfant ou adulte)
function villager(ctx, c, t, o) {
  const b = H0(c.seed);
  // (c.warrior) un guerrier : un adulte, avec sa lance
  const child = b.r() < 0.25 && !c.warrior;
  const female = b.r() < 0.5;
  const woven = !!o.woven;
  const cloth = (woven ? WOVEN : FURS)[Math.floor(b.r() * 5)];
  return drawHuman(ctx, c, t, {
    skin: b.skin, hair: b.hair, cloth, child, style: female ? 'long' : b.r() < 0.5 ? 'hirsute' : 'court',
    beard: !female && !child && b.r() < 0.4, woven, border: ['#A8442A', '#3A6A9A', '#C9A030'][Math.floor(b.r() * 3)],
    tool: c.warrior ? 'lance' : o.tools ? o.tools[Math.floor(b.r() * o.tools.length)] : null, necklace: !child && b.r() < 0.4, carry: c.carry, brow: o.brow,
    bare: o.bare && !female, legs: o.legs,
  });
}
for (const [id, o] of Object.entries({
  'tribu-erectus': { bare: true, brow: true, tools: [null, null, 'hache'] },
  'tribu-chasseur': { tools: [null, 'lance', 'hache'] },
  'tribu-village': { woven: true, tools: [null, 'hache', 'houe', null] },
})) {
  LOOKS[`th-${id}`] = (ctx, c, t) => villager(ctx, c, t, o);
  FRAMES[`th-${id}`] = { r: 0.28, x: 0.5, y: 0.9 };
}
// les chasseurs de la tribu (ils te suivent), les pillards des autres villages, leur chef
LOOKS['th-chasseur'] = (ctx, c, t) => {
  const b = H0(c.seed);
  drawHuman(ctx, c, t, { skin: b.skin, hair: b.hair, cloth: FURS[Math.floor(b.r() * 5)], style: b.r() < 0.5 ? 'hirsute' : 'court', beard: b.r() < 0.5, tool: 'lance', necklace: true, strap: true });
};
LOOKS['th-pillard'] = (ctx, c, t) => {
  const b = H0(c.seed + 3);
  drawHuman(ctx, c, t, { skin: b.skin, hair: b.hair, cloth: '#5A3A2A', cloth2: '#3A2418', style: 'hirsute', beard: b.r() < 0.6, tool: b.r() < 0.5 ? 'massue' : 'lance', paint: '#E8E2D4', feather: '#2A2A2A', legs: '#4A3020' });
};
LOOKS['th-chef-pillard'] = (ctx, c, t) => {
  const b = H0(c.seed + 9);
  drawHuman(ctx, c, t, { skin: b.skin, hair: '#1C1411', cloth: '#3A2418', style: 'hirsute', beard: true, tool: 'massue', paint: '#C8302A', feather: '#C8302A', band: '#C8302A', shield: true, cape: '#4A2A1A', legs: '#3A2418' });
};
for (const id of ['chasseur', 'pillard', 'chef-pillard']) FRAMES[`th-${id}`] = { r: 0.28, x: 0.5, y: 0.9 };

// les animaux, debout : (x, y) = leurs pattes au sol
for (const [id, P] of Object.entries(MAM)) {
  const look = `th-${id}`;
  LOOKS[look] = (ctx, c, t) => drawMammal(ctx, { ...c, y: c.y - P.ground * c.size }, t, P, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
  FRAMES[look] = { r: id === 'mammouth' ? 0.22 : 0.27, x: 0.46, y: 0.82 };
  SNOUT[look] = P.head.x + P.head.L * 0.7;
}
// les oiseaux : ils volent au-dessus du sol (leur ombre reste par terre)
for (const id of ['corbeau', 'passereau']) {
  LOOKS[`th-${id}`] = (ctx, c, t) => {
    const h = c.size * 3.2 + Math.sin(t * 1.5 + (c.seed || 0)) * c.size * 0.4;
    groundShadow(ctx, c.x, c.y, c.size * 0.7, c.size * 0.2, 0.18);
    const face = Math.cos(c.angle || 0) >= 0 ? 1 : -1;
    LOOKS[`vc-${id}`](ctx, { ...c, y: c.y - h, loco: 'vol', face, angle: face > 0 ? 0 : Math.PI }, t);
  };
  FRAMES[`th-${id}`] = { r: 0.24, x: 0.5, y: 0.9 };
}

/* ---- Le joueur : sa forme à chaque époque, et ses inventions qui se voient ---- */
const HERO = {
  'th-erectus': (P) => ({ bare: !P.vetements, cloth: P.vetements ? PLAYER.body : '#8A6440', brow: true, style: 'hirsute', beard: true, tool: P.feu ? 'torche' : null }),
  'th-chasseur': (P) => ({ cloth: PLAYER.body, style: 'hirsute', necklace: true, strap: true, tool: P.lance ? 'lance' : P.silex ? 'hache' : 'torche' }),
  'th-villageois': (P) => ({ cloth: PLAYER.body, woven: true, border: '#A8442A', style: 'court', necklace: true, band: P.elevage ? '#3A6A9A' : null, tool: P.hutte ? 'hache' : 'lance' }),
  'th-paysan': (P) => ({ cloth: PLAYER.body, woven: true, border: '#C9A030', style: 'court', necklace: true, band: '#3A6A9A', tool: P.agriculture ? 'houe' : 'hache' }),
  'th-chef': (P) => ({ cloth: PLAYER.body, woven: true, border: '#C8302A', style: 'court', necklace: true, band: '#C8302A', feather: '#E8B04A', cape: P.tour ? '#7A3A2A' : null, tool: 'lance', shield: !!P.palissade }),
};
for (const [form, make] of Object.entries(HERO)) {
  FORM_SPINE[form] = null;
  FRAMES[form] = { r: 0.27, x: 0.5, y: 0.9 };
  FORMS[form] = (ctx, p, parts, t, mood) => {
    drawHuman(ctx, { ...p, mood, seed: 0 }, t, {
      skin: PLAYER.tone || '#C68A5A', hair: PLAYER.hair || '#2A1C14', cute: true, cloth2: PLAYER.belly, ...make(parts || {}), carry: p.carry, front: p.front,
    });
  };
}

/* ============================================================================
   LE DÉCOR, debout (les arbres, les rochers, les ressources)
   d : { type, x, y, r, seed, amount, max } ; pal : les couleurs du chapitre
   ============================================================================ */
export function drawTree(ctx, d, t, pal) {
  const { x, y, r } = d;
  const kind = d.kind || 'feuillu';
  const rnd = seeded(d.seed);
  const sw = Math.sin(t * 0.8 + d.seed) * r * 0.03;
  groundShadow(ctx, x + r * 0.15, y, r * 0.9, r * 0.28, 0.22);
  const bark = kind === 'bouleau' ? '#E8E2D8' : '#6E5236';
  const H = r * (kind === 'pin' ? 1.2 : 1.4);
  // le tronc
  const tw = r * 0.16;
  const g = ctx.createLinearGradient(x - tw, 0, x + tw, 0);
  g.addColorStop(0, shade(bark, -0.25));
  g.addColorStop(0.45, shade(bark, 0.08));
  g.addColorStop(1, shade(bark, -0.35));
  ctx.fillStyle = g;
  ctx.strokeStyle = shade(bark, -0.6);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - tw * 1.5, y + 2);
  ctx.quadraticCurveTo(x - tw * 0.8, y - r * 0.2, x - tw * 0.7, y - H);
  ctx.lineTo(x + tw * 0.7, y - H);
  ctx.quadraticCurveTo(x + tw * 0.8, y - r * 0.2, x + tw * 1.5, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (kind === 'bouleau') {
    ctx.fillStyle = '#2A2420';
    for (let i = 0; i < 5; i++) ctx.fillRect(x - tw * 0.6 + rnd() * tw * 0.8, y - r * (0.2 + i * 0.25), tw * 0.5, r * 0.04);
  }
  const leaf = pal.leaf || ['#2E5E2A', '#3E7A34', '#5E9A44'];
  if (kind === 'pin') {
    // un sapin : des étages de branches, un peu de neige à l'âge de glace
    for (let i = 0; i < 4; i++) {
      const yy = y - H * 0.55 - i * r * 0.42;
      const wd = r * (0.95 - i * 0.2);
      ctx.fillStyle = leaf[i % 2 ? 1 : 0];
      ctx.strokeStyle = shade(leaf[0], -0.4);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + sw * (i + 1) * 0.5, yy - r * 0.62);
      ctx.lineTo(x + wd + sw, yy + r * 0.1);
      ctx.quadraticCurveTo(x, yy + r * 0.22, x - wd + sw, yy + r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (pal.snow) {
        ctx.fillStyle = pal.snow;
        ctx.beginPath();
        ctx.moveTo(x + sw * (i + 1) * 0.5, yy - r * 0.62);
        ctx.lineTo(x + wd * 0.55, yy - r * 0.18);
        ctx.quadraticCurveTo(x, yy - r * 0.08, x - wd * 0.55, yy - r * 0.18);
        ctx.closePath();
        ctx.fill();
      }
    }
    return;
  }
  // un arbre feuillu : des boules de feuilles, sombres derrière, claires devant
  const cy = y - H - r * 0.35;
  const blobs = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + d.seed;
    blobs.push({ x: x + Math.cos(a) * r * 0.55 + sw, y: cy + Math.sin(a) * r * 0.35, r: r * (0.45 + rnd() * 0.15) });
  }
  blobs.push({ x: x + sw, y: cy - r * 0.15, r: r * 0.62 });
  const lc = kind === 'bouleau' ? ['#6A8A2A', '#8AAA3A', '#B0C84A'] : leaf;
  ctx.fillStyle = lc[0];
  ctx.strokeStyle = shade(lc[0], -0.4);
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const b of blobs) { ctx.moveTo(b.x + b.r, b.y); ctx.arc(b.x, b.y, b.r, 0, TAU); }
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = lc[1];
  ctx.beginPath();
  for (const b of blobs) { ctx.moveTo(b.x + b.r * 0.78, b.y - b.r * 0.15); ctx.arc(b.x - b.r * 0.05, b.y - b.r * 0.15, b.r * 0.78, 0, TAU); }
  ctx.fill();
  ctx.fillStyle = lc[2];
  ctx.beginPath();
  for (const b of blobs) { ctx.moveTo(b.x - b.r * 0.15 + b.r * 0.38, b.y - b.r * 0.42); ctx.arc(b.x - b.r * 0.15, b.y - b.r * 0.42, b.r * 0.38, 0, TAU); }
  ctx.fill();
  if (pal.fruit && d.seed % 3 === 0) {
    ctx.fillStyle = pal.fruit;
    for (let i = 0; i < 6; i++) {
      const b = blobs[i % blobs.length];
      circle(ctx, b.x + Math.cos(i * 2.4) * b.r * 0.5, b.y + Math.sin(i * 2.4) * b.r * 0.4, 5);
      ctx.fill();
    }
  }
}

/** Un arbre mort frappé par la foudre, qui brûle */
export function drawFireTree(ctx, d, t) {
  const { x, y, r } = d;
  groundShadow(ctx, x, y, r * 0.8, r * 0.25, 0.3);
  ctx.strokeStyle = '#1E1612';
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + r * 0.05, y - r * 1.7);
  ctx.moveTo(x, y - r * 1.0);
  ctx.lineTo(x - r * 0.6, y - r * 1.6);
  ctx.moveTo(x + r * 0.03, y - r * 1.3);
  ctx.lineTo(x + r * 0.6, y - r * 1.9);
  ctx.stroke();
  ctx.strokeStyle = '#4A3A30';
  ctx.lineWidth = r * 0.18;
  ctx.stroke();
  for (const [fx, fy, s, k] of [[0.05, -1.75, 0.5, 0], [-0.6, -1.6, 0.36, 1], [0.6, -1.9, 0.4, 2], [0, -1.0, 0.3, 3], [0.02, -0.15, 0.42, 4]]) {
    flame(ctx, x + fx * r, y + fy * r, r * s, t, k * 1.7 + d.seed);
  }
}

export function drawRock(ctx, d, pal) {
  const { x, y, r } = d;
  const rock = pal.rock || '#9A928A';
  groundShadow(ctx, x + r * 0.1, y + 2, r * 1.05, r * 0.32, 0.25);
  ctx.fillStyle = shade(rock, -0.15);
  ctx.strokeStyle = shade(rock, -0.55);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x - r * 1.05, y - r * 0.7, x - r * 0.35, y - r * 0.95);
  ctx.quadraticCurveTo(x + r * 0.3, y - r * 1.15, x + r * 0.85, y - r * 0.65);
  ctx.quadraticCurveTo(x + r * 1.05, y - r * 0.3, x + r, y);
  ctx.quadraticCurveTo(x, y + r * 0.22, x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // le dessus, plus clair (il prend le soleil)
  ctx.fillStyle = shade(rock, 0.1);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, y - r * 0.55);
  ctx.quadraticCurveTo(x - r * 0.4, y - r * 1.05, x + r * 0.3, y - r * 1.02);
  ctx.quadraticCurveTo(x + r * 0.75, y - r * 0.75, x + r * 0.6, y - r * 0.45);
  ctx.quadraticCurveTo(x, y - r * 0.38, x - r * 0.8, y - r * 0.55);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 30, 20, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.1, y - r * 0.4);
  ctx.lineTo(x + r * 0.25, y - r * 0.15);
  ctx.lineTo(x + r * 0.15, y);
  ctx.stroke();
}

/** Ce qu'on ramasse : du bois mort, du silex, de l'ocre, du blé sauvage */
export function drawResource(ctx, d, t, pal) {
  const { x, y, r } = d;
  const n = Math.max(0, d.amount ?? 3), max = d.max || 3;
  const k = 0.45 + 0.55 * (n / max);
  const shine = n > 0 ? 0.5 + Math.sin(t * 3 + d.seed) * 0.5 : 0;
  if (d.type === 'bois') {
    groundShadow(ctx, x, y, r * 0.9, r * 0.25);
    for (let i = 0; i < Math.max(1, Math.ceil(n * 1.5)); i++) {
      const a = (i % 2 ? 0.35 : -0.3) + i * 0.1;
      ctx.save();
      ctx.translate(x + (i - 2) * r * 0.12, y - r * 0.12 - i * r * 0.1);
      ctx.rotate(a);
      ctx.fillStyle = i % 2 ? '#8A6440' : '#7A5434';
      ctx.strokeStyle = '#3A2414';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-r * 0.75, -r * 0.1, r * 1.5, r * 0.2, r * 0.1) : ctx.rect(-r * 0.75, -r * 0.1, r * 1.5, r * 0.2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#C9A06A';
      ell(ctx, r * 0.75, 0, r * 0.06, r * 0.09);
      ctx.fill();
      ctx.restore();
    }
  } else if (d.type === 'silex') {
    groundShadow(ctx, x, y, r * 0.95, r * 0.3);
    const rock = pal.rock || '#9A928A';
    drawRock(ctx, { x: x - r * 0.25, y, r: r * 0.6 }, { rock });
    for (let i = 0; i < Math.max(0, n); i++) {
      const xx = x + r * (0.1 + (i % 2) * 0.35), yy = y - r * (0.05 + Math.floor(i / 2) * 0.22);
      ctx.fillStyle = '#5A5A62';
      ctx.strokeStyle = '#22222A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xx - r * 0.22, yy);
      ctx.lineTo(xx - r * 0.08, yy - r * 0.3 * k);
      ctx.lineTo(xx + r * 0.18, yy - r * 0.22);
      ctx.lineTo(xx + r * 0.2, yy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#C8C8D2';
      ctx.beginPath();
      ctx.moveTo(xx - r * 0.06, yy - r * 0.22);
      ctx.lineTo(xx + r * 0.1, yy - r * 0.18);
      ctx.lineTo(xx, yy - r * 0.08);
      ctx.fill();
    }
  } else if (d.type === 'ocre') {
    groundShadow(ctx, x, y, r, r * 0.3);
    ctx.fillStyle = '#A8442A';
    ctx.strokeStyle = '#4A1A10';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x - r * 0.6, y - r * 0.6 * k, x, y - r * 0.62 * k);
    ctx.quadraticCurveTo(x + r * 0.7, y - r * 0.55 * k, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#D8743A';
    for (let i = 0; i < n + 1; i++) {
      circle(ctx, x + (i - 1.5) * r * 0.32, y - r * (0.18 + (i % 2) * 0.15), r * 0.12);
      ctx.fill();
    }
  } else if (d.type === 'ble') {
    // une touffe d'épis de blé sauvage
    groundShadow(ctx, x, y, r * 0.8, r * 0.22, 0.18);
    const stalks = 4 + n * 2;
    for (let i = 0; i < stalks; i++) {
      const u = i / (stalks - 1) - 0.5;
      const s = Math.sin(t * 1.6 + i + d.seed) * r * 0.08;
      const tx = x + u * r * 1.2 + s, ty = y - r * (1.2 + Math.sin(i * 3.1) * 0.15);
      ctx.strokeStyle = '#B89A4A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + u * r * 0.6, y);
      ctx.quadraticCurveTo(x + u * r * 0.9, y - r * 0.6, tx, ty);
      ctx.stroke();
      ctx.fillStyle = '#E2BE5A';
      ctx.strokeStyle = '#8A6A2A';
      ctx.lineWidth = 1.5;
      ell(ctx, tx, ty - r * 0.12, r * 0.07, r * 0.2, u * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
  // un petit éclat de lumière : « ça se ramasse ! »
  if (shine > 0) {
    ctx.fillStyle = `rgba(255, 250, 210, ${0.25 + shine * 0.45})`;
    const sx = x + r * 0.55, sy = y - r * 0.9;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 8);
    ctx.lineTo(sx + 2.5, sy - 2.5);
    ctx.lineTo(sx + 8, sy);
    ctx.lineTo(sx + 2.5, sy + 2.5);
    ctx.lineTo(sx, sy + 8);
    ctx.lineTo(sx - 2.5, sy + 2.5);
    ctx.lineTo(sx - 8, sy);
    ctx.lineTo(sx - 2.5, sy - 2.5);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawBush(ctx, d, t, pal) {
  const { x, y, r } = d;
  const col = pal.bush || ['#3A6A2E', '#4E8A3A', '#6AA448'];
  const sw = Math.sin(t * 1.3 + d.seed) * r * 0.04;
  groundShadow(ctx, x, y, r * 1.0, r * 0.3, 0.22);
  const blobs = [[-0.55, -0.35, 0.5], [0.5, -0.4, 0.5], [0, -0.75, 0.6], [-0.2, -0.3, 0.55], [0.3, -0.25, 0.5]];
  ctx.fillStyle = col[0];
  ctx.strokeStyle = shade(col[0], -0.35);
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [dx, dy, k] of blobs) { ctx.moveTo(x + dx * r + k * r + sw, y + dy * r); ctx.arc(x + dx * r + sw, y + dy * r, k * r, 0, TAU); }
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = col[1];
  ctx.beginPath();
  for (const [dx, dy, k] of blobs) { ctx.moveTo(x + dx * r + k * r * 0.7 + sw, y + dy * r - k * r * 0.2); ctx.arc(x + dx * r + sw, y + dy * r - k * r * 0.2, k * r * 0.7, 0, TAU); }
  ctx.fill();
  if (pal.berries && d.seed % 2) {
    ctx.fillStyle = pal.berries;
    for (let i = 0; i < 6; i++) {
      circle(ctx, x + Math.cos(d.seed + i * 2) * r * 0.6, y - r * 0.45 + Math.sin(d.seed + i) * r * 0.3, 4.5);
      ctx.fill();
    }
  }
}

export function drawGrass(ctx, d, t, pal) {
  const { x, y, r } = d;
  const col = pal.tallGrass || ['#7A9A3A', '#A8B85A'];
  ctx.lineCap = 'round';
  for (let i = 0; i < 11; i++) {
    const u = i / 10 - 0.5;
    const hh = r * (1.2 + Math.sin(i * 7.1 + d.seed) * 0.35);
    const s2 = Math.sin(t * 1.6 + i + d.seed) * r * 0.12;
    ctx.strokeStyle = col[i % 2];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + u * r * 1.4, y);
    ctx.quadraticCurveTo(x + u * r * 1.7, y - hh * 0.6, x + u * r * 2 + s2, y - hh);
    ctx.stroke();
  }
}

/** Une fougère : des frondes qui s'ouvrent en éventail, couvertes de petites folioles */
export function drawFern(ctx, d, t, pal) {
  const { x, y, r } = d;
  const col = pal.fern || (pal.leaf ? pal.leaf[1] : '#3E7A34');
  groundShadow(ctx, x, y, r * 0.85, r * 0.24, 0.2);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.34 + Math.sin(t * 1.4 + d.seed + i) * 0.04;
    const L = r * (1.1 - Math.abs(i - 3) * 0.09);
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.95;
    const cx = x + Math.cos(a) * L * 0.45, cy = y + Math.sin(a) * L * 0.65 - L * 0.12;
    const c2 = i % 2 ? col : shade(col, 0.12);
    ctx.strokeStyle = shade(col, -0.35);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
    // les folioles, de chaque côté de la tige
    ctx.fillStyle = c2;
    const dx = ex - x, dy = ey - y, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
    for (let k = 1; k <= 7; k++) {
      const u = k / 8;
      const px = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx + u * u * ex;
      const py = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy + u * u * ey;
      const s = r * 0.16 * (1 - u * 0.6);
      for (const side of [-1, 1]) {
        ell(ctx, px + nx * side * s * 0.8, py + ny * side * s * 0.8, s, s * 0.42, Math.atan2(ny * side, nx * side) + 0.5 * side);
        ctx.fill();
      }
    }
  }
  if (pal.snow) {
    ctx.fillStyle = pal.snow;
    ell(ctx, x, y - r * 0.7, r * 0.35, r * 0.12);
    ctx.fill();
  }
}

/** Un bouquet de fleurs sauvages (pas à l'âge de glace) */
export function drawFlowers(ctx, d, t, pal) {
  if (pal.snow) return;
  const { x, y, r } = d;
  const cols = pal.flowers || ['#F2E25A', '#FFFFFF', '#E86A9A'];
  const leaf = pal.leaf ? pal.leaf[1] : '#3E7A34';
  const rnd = seeded(d.seed);
  ctx.fillStyle = leaf;
  for (let i = 0; i < 4; i++) {
    ell(ctx, x + (i - 1.5) * r * 0.32, y - r * 0.1, r * 0.22, r * 0.09, (i - 1.5) * 0.5);
    ctx.fill();
  }
  for (let i = 0; i < 7; i++) {
    const fx = x + (rnd() - 0.5) * r * 1.6, h = r * (0.5 + rnd() * 0.6), sw = Math.sin(t * 2 + i + d.seed) * 2;
    ctx.strokeStyle = shade(leaf, -0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.quadraticCurveTo(fx - 3, y - h * 0.5, fx + sw, y - h);
    ctx.stroke();
    ctx.fillStyle = cols[i % cols.length];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + d.seed;
      circle(ctx, fx + sw + Math.cos(a) * 4.5, y - h + Math.sin(a) * 4.5, 3.6);
      ctx.fill();
    }
    ctx.fillStyle = '#F2B84A';
    circle(ctx, fx + sw, y - h, 2.4);
    ctx.fill();
  }
}

/** Des roseaux, au bord de l'eau (certains avec leur massette brune) */
export function drawReeds(ctx, d, t, pal) {
  const { x, y, r } = d;
  const rnd = seeded(d.seed);
  groundShadow(ctx, x, y, r * 0.8, r * 0.18, 0.18);
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const fx = x + (i - 4) * r * 0.16 + (rnd() - 0.5) * 6;
    const h = r * (1.3 + rnd() * 0.7), sw = Math.sin(t * 1.5 + i * 0.7 + d.seed) * r * 0.08;
    ctx.strokeStyle = pal.snow ? (i % 2 ? '#9A9A6A' : '#B0A878') : i % 2 ? '#6A8A3A' : '#88A048';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.quadraticCurveTo(fx, y - h * 0.5, fx + sw, y - h);
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.fillStyle = '#6A4228';
      ell(ctx, fx + sw * 0.9, y - h + 12, 4, 11);
      ctx.fill();
    } else {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, y - h * 0.3);
      ctx.quadraticCurveTo(fx + (i % 2 ? 14 : -14), y - h * 0.55, fx + (i % 2 ? 22 : -22) + sw, y - h * 0.45);
      ctx.stroke();
    }
  }
}

/** Au sol : une petite touffe d'herbe, ou quelques fleurs (dark, light : les couleurs de l'herbe) */
export function drawDecal(ctx, d, flowers, dark, light) {
  const s = d.s;
  if (d.k === 'fleur' && flowers) {
    for (let i = 0; i < 3; i++) {
      const fx = d.x + (((d.seed >> (i * 3)) % 7) - 3) * 5 * s, fy = d.y + (((d.seed >> (i * 4 + 1)) % 5) - 2) * 4 * s;
      ctx.fillStyle = flowers[(d.seed + i) % flowers.length];
      circle(ctx, fx, fy, 3.2 * s);
      ctx.fill();
    }
    return;
  }
  ctx.strokeStyle = d.seed & 1 ? dark : light;
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const k of [-1, 0, 1]) {
    ctx.moveTo(d.x + k * 5 * s, d.y);
    ctx.lineTo(d.x + k * 8 * s, d.y - (k ? 9 : 13) * s);
  }
  ctx.stroke();
}

/* ============================================================================
   LA GROTTE : une colline de roche creusée d'une grande salle. On y entre par
   l'arche ; dedans, la colline devient transparente (alpha) et l'on voit le
   sol, la paroi du fond, ses stalactites… et les peintures, une fois faites.
   d : { x, y (le milieu du sol de la salle), rw, rd (sa demi-largeur, sa demi-profondeur), seed }
   ============================================================================ */
/** Le haut de la colline (de la base gauche à la base droite) */
function hillTop(pth, x, y, rw, top, baseY) {
  pth.quadraticCurveTo(x - rw - 300, y - 140, x - rw * 0.8, top + 110);
  pth.quadraticCurveTo(x - rw * 0.3, top - 40, x + rw * 0.3, top + 30);
  pth.quadraticCurveTo(x + rw * 1.05, top + 50, x + rw + 180, y - 220);
  pth.quadraticCurveTo(x + rw + 280, y - 60, x + rw + 230, baseY);
}

/** Le sol de la salle (dessiné à plat, avant tout le reste) */
export function drawCaveFloor(ctx, d, t, pal) {
  const { x, y, rw, rd } = d;
  const rock = pal.rock || '#9A928A';
  const g = ctx.createRadialGradient(x, y + rd * 0.5, 30, x, y, rw + 60);
  g.addColorStop(0, shade(rock, -0.32));
  g.addColorStop(1, shade(rock, -0.62));
  ctx.fillStyle = g;
  ell(ctx, x, y, rw + 48, rd + 40);
  ctx.fill();
  // la lumière du jour qui entre par l'arche
  const lg = ctx.createRadialGradient(x, y + rd + 30, 10, x, y + rd, rd * 1.3);
  lg.addColorStop(0, 'rgba(255, 240, 200, 0.3)');
  lg.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = lg;
  ell(ctx, x, y + rd * 0.4, rw * 0.7, rd);
  ctx.fill();
  // des cailloux
  const rnd = seeded(d.seed);
  for (let i = 0; i < 34; i++) {
    const a = rnd() * TAU, k = Math.sqrt(rnd()) * 0.92;
    ctx.fillStyle = shade(rock, i % 3 ? -0.45 : -0.15);
    ell(ctx, x + Math.cos(a) * rw * k, y + Math.sin(a) * rd * k, 5 + rnd() * 9, 3 + rnd() * 5);
    ctx.fill();
  }
  // un vieux foyer (des cendres, du charbon) et quelques os
  ctx.fillStyle = 'rgba(70, 64, 60, 0.85)';
  ell(ctx, x - rw * 0.45, y + rd * 0.15, 40, 18);
  ctx.fill();
  ctx.fillStyle = '#1A1410';
  for (const [dx, dy] of [[-12, -2], [8, 4], [0, -6]]) { ell(ctx, x - rw * 0.45 + dx, y + rd * 0.15 + dy, 9, 4); ctx.fill(); }
  ctx.strokeStyle = '#E8DCC4';
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (const [bx, by, a] of [[0.4, 0.3, 0.4], [0.55, -0.1, -0.8], [-0.2, 0.55, 1.2]]) {
    const cx = x + bx * rw, cy = y + by * rd;
    ctx.moveTo(cx - Math.cos(a) * 14, cy - Math.sin(a) * 6);
    ctx.lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 6);
  }
  ctx.stroke();
}

/** La grotte, debout : part 'fond' (la colline derrière, la paroi du fond) ou 'devant' (la colline et son arche) */
export function drawCave(ctx, d, t, pal, painted, part = 'devant', alpha = 1) {
  const { x, y, rw, rd } = d;
  const rock = pal.rock || '#9A928A';
  const top = y - rd - 430;
  if (part === 'fond') {
    // la colline, derrière la salle
    const g = ctx.createLinearGradient(0, top, 0, y);
    g.addColorStop(0, shade(rock, 0.05));
    g.addColorStop(1, shade(rock, -0.3));
    ctx.fillStyle = g;
    ctx.strokeStyle = shade(rock, -0.6);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - rw - 230, y + 30);
    hillTop(ctx, x, y, rw, top, y + 30);
    ctx.lineTo(x + rw + 40, y);
    ctx.ellipse(x, y, rw + 40, rd + 35, 0, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // la paroi du fond, à l'intérieur (là où l'on peint)
    const H = 250;
    const wg = ctx.createLinearGradient(0, y - rd - H, 0, y - rd * 0.2);
    wg.addColorStop(0, shade(rock, -0.62));
    wg.addColorStop(1, shade(rock, -0.32));
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.ellipse(x, y, rw + 40, rd + 35, 0, Math.PI, TAU, false);
    ctx.ellipse(x, y - H, rw + 10, rd + 10, 0, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = shade(rock, -0.7);
    ctx.lineWidth = 4;
    ctx.stroke();
    // les veines de la roche
    ctx.strokeStyle = 'rgba(20, 14, 10, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const k of [0.3, 0.6]) ctx.ellipse(x, y - H * k, rw + 30 - k * 20, rd + 30 - k * 20, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    // les stalactites, qui pendent du plafond
    ctx.fillStyle = shade(rock, -0.15);
    ctx.strokeStyle = shade(rock, -0.6);
    ctx.lineWidth = 2;
    const rnd = seeded(d.seed + 5);
    for (let i = 0; i < 14; i++) {
      const a = Math.PI + ((i + 0.5) / 14) * Math.PI;
      const sx = x + Math.cos(a) * (rw + 10), sy = y - H + Math.sin(a) * (rd + 10);
      const len = 26 + rnd() * 46, w = 8 + rnd() * 8;
      ctx.beginPath();
      ctx.moveTo(sx - w, sy - 2);
      ctx.quadraticCurveTo(sx - w * 0.3, sy + len * 0.6, sx, sy + len);
      ctx.quadraticCurveTo(sx + w * 0.3, sy + len * 0.6, sx + w, sy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (painted) {
      // les peintures (à l'ocre et au charbon), éclairées par deux torches
      const glow = ctx.createRadialGradient(x, y - rd - 110, 20, x, y - rd - 110, rw);
      glow.addColorStop(0, 'rgba(255, 180, 90, 0.32)');
      glow.addColorStop(1, 'rgba(255, 150, 60, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - rw, y - rd - 260, rw * 2, 300);
      paintAnimal(ctx, x - rw * 0.42, y - rd - 80, 34, '#A8442A');
      paintAnimal(ctx, x + rw * 0.18, y - rd - 105, 28, '#2A1C14');
      paintAnimal(ctx, x + rw * 0.55, y - rd - 55, 24, '#A8442A');
      for (const [hx, hy] of [[-0.75, -40], [-0.08, -140], [0.82, -110], [0.3, -30]]) hand(ctx, x + hx * rw, y - rd + hy, 13, '#A8442A');
      for (const s of [-1, 1]) {
        const tx = x + s * rw * 0.85, ty = y - rd * 0.45;
        ctx.strokeStyle = '#3A2414';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - s * 6, ty - 70);
        ctx.stroke();
        flame(ctx, tx - s * 6, ty - 70, 18, t, s + 4);
      }
    }
    return;
  }
  // ---- 'devant' : la colline, son arche, sa végétation ----
  ctx.save();
  ctx.globalAlpha = alpha;
  const base = y + rd + 30;
  groundShadow(ctx, x, base + 8, rw + 270, 44, 0.3);
  const hill = new Path2D();
  hill.moveTo(x - rw - 230, base);
  hillTop(hill, x, y, rw, top, base);
  hill.quadraticCurveTo(x, base + 40, x - rw - 230, base);
  const g = ctx.createLinearGradient(0, top, 0, base);
  g.addColorStop(0, shade(rock, 0.14));
  g.addColorStop(0.55, rock);
  g.addColorStop(1, shade(rock, -0.32));
  ctx.fillStyle = g;
  ctx.fill(hill);
  ctx.save();
  ctx.clip(hill);
  // l'ombre du côté droit, et des blocs de roche plus clairs
  const sg = ctx.createLinearGradient(x, 0, x + rw + 260, 0);
  sg.addColorStop(0, 'rgba(30, 20, 10, 0)');
  sg.addColorStop(1, 'rgba(30, 20, 10, 0.35)');
  ctx.fillStyle = sg;
  ctx.fillRect(x, top - 60, rw + 300, base - top + 100);
  const rnd = seeded(d.seed);
  for (let i = 0; i < 16; i++) {
    const bx = x + (rnd() - 0.5) * (rw * 2 + 300), by = top + 90 + rnd() * (base - top - 120);
    const br = 40 + rnd() * 60;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + rnd() * 0.08})`;
    ell(ctx, bx, by, br, br * 0.6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 20, 10, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(bx, by, br, br * 0.6, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // les couches de roche
  ctx.strokeStyle = 'rgba(40, 28, 18, 0.28)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const k of [0.22, 0.42, 0.62]) {
    const yy = lerp(base, top, k);
    ctx.moveTo(x - rw - 320, yy + 30);
    ctx.quadraticCurveTo(x, yy - 40, x + rw + 320, yy + 20);
  }
  ctx.stroke();
  // le sommet : de l'herbe (ou de la neige)
  const cap = pal.snow || (pal.leaf ? pal.leaf[1] : '#5E8A3A');
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.moveTo(x - rw - 400, top - 100);
  ctx.lineTo(x + rw + 400, top - 100);
  ctx.lineTo(x + rw + 400, top + 130);
  for (let i = 0; i <= 24; i++) {
    const xx = lerp(x + rw + 400, x - rw - 400, i / 24);
    ctx.lineTo(xx, top + 110 + Math.sin(i * 1.7 + d.seed) * 22 + (i % 2) * 14);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = shade(rock, -0.62);
  ctx.lineWidth = 5;
  ctx.stroke(hill);
  // l'arche d'entrée
  const aw = 128, ah = 250;
  const arch = new Path2D();
  arch.moveTo(x - aw, base + 2);
  arch.lineTo(x - aw * 0.95, base - ah * 0.45);
  arch.quadraticCurveTo(x - aw * 0.85, base - ah, x, base - ah);
  arch.quadraticCurveTo(x + aw * 0.85, base - ah, x + aw * 0.95, base - ah * 0.45);
  arch.lineTo(x + aw, base + 2);
  arch.closePath();
  const ag = ctx.createLinearGradient(0, base - ah, 0, base);
  ag.addColorStop(0, '#0C0806');
  ag.addColorStop(1, '#2E2218');
  ctx.fillStyle = ag;
  ctx.fill(arch);
  if (painted) {
    // la lueur des torches, au fond
    const lg = ctx.createRadialGradient(x, base - ah * 0.35, 10, x, base - ah * 0.35, aw * 1.2);
    lg.addColorStop(0, 'rgba(255, 160, 70, 0.45)');
    lg.addColorStop(1, 'rgba(255, 140, 50, 0)');
    ctx.fillStyle = lg;
    ctx.fill(arch);
  }
  ctx.strokeStyle = shade(rock, 0.22);
  ctx.lineWidth = 12;
  ctx.stroke(arch);
  ctx.strokeStyle = shade(rock, -0.6);
  ctx.lineWidth = 4;
  ctx.stroke(arch);
  // du lierre qui pend de l'arche
  const leaf = pal.leaf || ['#2E5E2A', '#3E7A34', '#5E9A44'];
  for (let i = 0; i < 7; i++) {
    const vx = x + (i - 3) * aw * 0.26, vy = base - ah * (0.97 - Math.abs(i - 3) * 0.06);
    const len = 40 + ((i * 37) % 50), sw = Math.sin(t * 1.2 + i) * 4;
    ctx.strokeStyle = shade(leaf[0], -0.2);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.quadraticCurveTo(vx + sw, vy + len * 0.5, vx + sw * 1.5, vy + len);
    ctx.stroke();
    ctx.fillStyle = leaf[(i % 2) + 1];
    for (let k = 1; k <= 4; k++) { ell(ctx, vx + sw * k * 0.35 + (k % 2 ? 5 : -5), vy + len * k / 4, 6, 4, k % 2 ? 0.6 : -0.6); ctx.fill(); }
  }
  // des pierres au pied de la colline
  for (const [bx, br] of [[-aw - 40, 34], [aw + 50, 30], [-rw - 120, 46], [rw + 110, 40], [-rw * 0.6, 26], [rw * 0.55, 30]]) {
    ctx.fillStyle = shade(rock, -0.05);
    ctx.strokeStyle = shade(rock, -0.6);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x + bx, base + 6 - br * 0.4, br, br * 0.65, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // des arbres là-haut, des fougères et des buissons en bas
  for (const [tx, ty, r, kind, s] of [[-rw * 0.6, top + 175, 58, 'pin', 1], [rw * 0.5, top + 150, 54, 'feuillu', 2], [rw * 0.02, top + 95, 50, 'pin', 3], [-rw - 40, top + 300, 46, 'feuillu', 4]]) {
    drawTree(ctx, { x: x + tx, y: ty, r, kind, seed: d.seed * 7 + s }, t, pal);
  }
  for (const [fx, r, s] of [[-aw - 95, 48, 1], [aw + 105, 52, 2], [-rw - 30, 56, 3], [rw + 20, 50, 4]]) {
    drawFern(ctx, { x: x + fx, y: base + 10, r, seed: d.seed + s * 13 }, t, pal);
  }
  ctx.restore();
}
function paintAnimal(ctx, x, y, s, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 1.4, s * 0.8, 0, 0, TAU);
  ctx.moveTo(x + s * 1.2, y - s * 0.3);
  ctx.ellipse(x + s * 1.6, y - s * 0.5, s * 0.5, s * 0.35, -0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = s * 0.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const dx of [-0.9, -0.4, 0.5, 1.0]) {
    ctx.moveTo(x + dx * s, y + s * 0.5);
    ctx.lineTo(x + dx * s, y + s * 1.4);
  }
  ctx.moveTo(x - s * 1.3, y - s * 0.2);
  ctx.lineTo(x - s * 1.9, y + s * 0.4);
  ctx.stroke();
}
function hand(ctx, x, y, s, col) {
  ctx.fillStyle = col;
  ell(ctx, x, y, s, s * 1.15);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = s * 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 - 0.9 + i * 0.45;
    ctx.moveTo(x + Math.cos(a) * s * 0.8, y + Math.sin(a) * s * 0.8);
    ctx.lineTo(x + Math.cos(a) * s * 1.9, y + Math.sin(a) * s * 1.9);
  }
  ctx.stroke();
}

/* ============================================================================
   LES CONSTRUCTIONS (b : { type, x, y, r, seed, state… })
   ============================================================================ */
/** Le foyer : un cercle de pierres, des bûches… et le feu, s'il est allumé */
export function drawHearth(ctx, b, t, lit, big = true) {
  const { x, y } = b;
  const R = big ? 46 : 32;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    const sx = x + Math.cos(a) * R, sy = y + Math.sin(a) * R * 0.4;
    ctx.fillStyle = i % 2 ? '#8A847C' : '#9A948C';
    ctx.strokeStyle = '#3A3630';
    ctx.lineWidth = 2;
    ell(ctx, sx, sy, R * 0.26, R * 0.18);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = '#2A1A10';
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x - R * 0.6, y + R * 0.1);
  ctx.lineTo(x + R * 0.5, y - R * 0.15);
  ctx.moveTo(x - R * 0.5, y - R * 0.15);
  ctx.lineTo(x + R * 0.6, y + R * 0.12);
  ctx.stroke();
  ctx.strokeStyle = lit ? '#6A3A1A' : '#5A4A3A';
  ctx.lineWidth = 6;
  ctx.stroke();
  if (lit) {
    flame(ctx, x, y + 2, R * 0.85, t, b.seed || 0);
    // la fumée qui monte
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.25 + i * 0.25 + (b.seed || 0) * 0.1) % 1;
      ctx.fillStyle = `rgba(160, 160, 160, ${0.22 * (1 - k)})`;
      circle(ctx, x + Math.sin(k * 6 + i) * 18, y - R * 1.8 - k * 220, 12 + k * 30);
      ctx.fill();
    }
  }
}

/** Une hutte ronde : un mur de branches tressées, un toit pointu de chaume, une porte */
export function drawHut(ctx, b, t, pal) {
  const { x, y } = b;
  const R = b.r || 85;
  groundShadow(ctx, x + R * 0.1, y + 4, R * 1.2, R * 0.38, 0.3);
  // le mur (sa face avant)
  const wall = '#8A6A44';
  const wg = ctx.createLinearGradient(x - R, 0, x + R, 0);
  wg.addColorStop(0, shade(wall, 0.1));
  wg.addColorStop(1, shade(wall, -0.25));
  ctx.fillStyle = wg;
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - R, y - R * 0.55);
  ctx.lineTo(x - R, y - R * 0.05);
  ctx.ellipse(x, y - R * 0.05, R, R * 0.32, 0, Math.PI, 0, true);
  ctx.lineTo(x + R, y - R * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // les branches tressées
  ctx.strokeStyle = 'rgba(40, 24, 10, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -6; i <= 6; i++) {
    const xx = x + (i / 6.5) * R;
    const yb = y - R * 0.05 + Math.sqrt(Math.max(0, 1 - (i / 6.5) ** 2)) * R * 0.32;
    ctx.moveTo(xx, y - R * 0.55);
    ctx.lineTo(xx, yb);
  }
  ctx.stroke();
  // la porte
  ctx.fillStyle = '#1E140C';
  ctx.beginPath();
  ctx.moveTo(x - R * 0.24, y + R * 0.25);
  ctx.lineTo(x - R * 0.24, y - R * 0.3);
  ctx.quadraticCurveTo(x, y - R * 0.55, x + R * 0.24, y - R * 0.3);
  ctx.lineTo(x + R * 0.24, y + R * 0.25);
  ctx.closePath();
  ctx.fill();
  // le toit de chaume
  const roof = pal.thatch || '#C9A860';
  const rg = ctx.createLinearGradient(x - R, 0, x + R, 0);
  rg.addColorStop(0, shade(roof, 0.12));
  rg.addColorStop(0.6, roof);
  rg.addColorStop(1, shade(roof, -0.25));
  ctx.fillStyle = rg;
  ctx.strokeStyle = shade(roof, -0.55);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - R * 1.75);
  ctx.quadraticCurveTo(x + R * 0.6, y - R * 1.05, x + R * 1.18, y - R * 0.48);
  ctx.quadraticCurveTo(x, y - R * 0.18, x - R * 1.18, y - R * 0.48);
  ctx.quadraticCurveTo(x - R * 0.6, y - R * 1.05, x, y - R * 1.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80, 60, 20, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -5; i <= 5; i++) {
    ctx.moveTo(x + i * R * 0.04, y - R * 1.7);
    ctx.lineTo(x + i * R * 0.21, y - R * 0.4);
  }
  ctx.stroke();
  // les bâtons qui dépassent en haut
  ctx.strokeStyle = '#5A3A22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - R * 0.12, y - R * 1.95);
  ctx.lineTo(x + R * 0.04, y - R * 1.62);
  ctx.moveTo(x + R * 0.12, y - R * 1.95);
  ctx.lineTo(x - R * 0.04, y - R * 1.62);
  ctx.stroke();
}

/** Un piquet de l'enclos (avec la barrière qui le relie au suivant) */
export function drawPost(ctx, p) {
  if (p.next) {
    ctx.strokeStyle = '#3A2414';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const h of [30, 58]) {
      ctx.moveTo(p.x, p.y - h);
      ctx.lineTo(p.next.x, p.next.y - h);
    }
    ctx.stroke();
    ctx.strokeStyle = '#9A7A4A';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.fillStyle = '#7A5A34';
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(p.x - 6, p.y - 78, 12, 80, 4) : ctx.rect(p.x - 6, p.y - 78, 12, 80);
  ctx.fill();
  ctx.stroke();
  if (p.gate) {
    ctx.fillStyle = '#5A3A22';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(p.x - 9, p.y - 100, 18, 102, 5) : ctx.rect(p.x - 9, p.y - 100, 18, 102);
    ctx.fill();
    ctx.stroke();
  }
}

/** Un champ : la terre labourée en sillons, et ce qui y pousse (stage : 'seme', 'pousse', 'mur') */
export function drawField(ctx, f, t) {
  const { x, y } = f;
  const w = f.w || 230, h = f.h || 150;
  const wet = f.watered;
  ctx.fillStyle = wet ? '#5A3A22' : '#7A5634';
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 14) : ctx.rect(x - w / 2, y - h / 2, w, h);
  ctx.fill();
  ctx.stroke();
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const yy = y - h / 2 + (i + 0.6) * (h / rows);
    ctx.strokeStyle = 'rgba(40, 20, 8, 0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 12, yy);
    ctx.lineTo(x + w / 2 - 12, yy);
    ctx.stroke();
    if (f.stage === 'seme' || !f.stage) {
      ctx.fillStyle = '#C9A860';
      for (let k = 0; k < 7; k++) {
        circle(ctx, x - w / 2 + 22 + k * (w - 44) / 6, yy - 3, 2.5);
        ctx.fill();
      }
      continue;
    }
    // les pousses : vertes qui grandissent, puis dorées (les épis mûrs)
    const g = f.stage === 'mur' ? 1 : clamp(f.grow || 0, 0, 1);
    const ripe = f.stage === 'mur';
    for (let k = 0; k < 8; k++) {
      const xx = x - w / 2 + 18 + k * (w - 36) / 7;
      const hh = (8 + g * 34) * (ripe ? 1.1 : 1);
      const s = Math.sin(t * 1.8 + k + i) * 2 * g;
      ctx.strokeStyle = ripe ? '#C9A040' : '#5A9A3A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xx - 4, yy);
      ctx.lineTo(xx - 6 + s, yy - hh);
      ctx.moveTo(xx + 4, yy);
      ctx.lineTo(xx + 6 + s, yy - hh * 0.9);
      ctx.stroke();
      if (ripe) {
        ctx.fillStyle = '#E8C05A';
        ell(ctx, xx - 6 + s, yy - hh - 5, 3.5, 7);
        ctx.fill();
        ell(ctx, xx + 6 + s, yy - hh * 0.9 - 5, 3.5, 7);
        ctx.fill();
      }
    }
  }
  if (!wet && f.stage === 'seme') {
    // il a soif : une goutte au-dessus du champ
    const k = 0.5 + Math.sin(t * 4) * 0.5;
    ctx.fillStyle = `rgba(90, 176, 224, ${0.55 + k * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2 - 46);
    ctx.quadraticCurveTo(x + 14, y - h / 2 - 22, x, y - h / 2 - 16);
    ctx.quadraticCurveTo(x - 14, y - h / 2 - 22, x, y - h / 2 - 46);
    ctx.fill();
  }
}

/** Le grenier : une petite hutte sur pilotis, à l'abri des rongeurs */
export function drawGranary(ctx, b, t, pal) {
  const { x, y } = b;
  groundShadow(ctx, x, y + 4, 90, 26, 0.3);
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const dx of [-55, -20, 20, 55]) {
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x + dx * 0.9, y - 70);
  }
  ctx.stroke();
  ctx.strokeStyle = '#7A5A34';
  ctx.lineWidth = 6;
  ctx.stroke();
  drawHut(ctx, { x, y: y - 62, r: 64, seed: b.seed }, t, pal);
  // l'échelle
  ctx.strokeStyle = '#5A3A22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 6);
  ctx.lineTo(x - 18, y - 70);
  ctx.moveTo(x + 14, y + 6);
  ctx.lineTo(x + 6, y - 70);
  for (let i = 1; i < 5; i++) {
    ctx.moveTo(x - 10 - i * 1.6, y + 6 - i * 15);
    ctx.lineTo(x + 14 - i * 1.6, y + 6 - i * 15);
  }
  ctx.stroke();
  // des gerbes de blé posées devant
  for (const dx of [-60, 62]) {
    ctx.fillStyle = '#D8B04A';
    ctx.strokeStyle = '#7A5A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + dx - 12, y + 4);
    ctx.lineTo(x + dx - 6, y - 34);
    ctx.lineTo(x + dx + 6, y - 34);
    ctx.lineTo(x + dx + 12, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Un pieu de la palissade (taillé en pointe) */
export function drawStake(ctx, s) {
  const H = s.broken ? 40 + (s.seed % 20) : 120 + (s.seed % 18);
  const w = 15;
  const g = ctx.createLinearGradient(s.x - w, 0, s.x + w, 0);
  g.addColorStop(0, '#8A6440');
  g.addColorStop(0.5, '#A8804E');
  g.addColorStop(1, '#5A3A22');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(s.x - w / 2, s.y + 3);
  ctx.lineTo(s.x - w / 2, s.y - H + (s.broken ? 0 : 14));
  if (s.broken) {
    ctx.lineTo(s.x - 2, s.y - H - 8);
    ctx.lineTo(s.x + 2, s.y - H + 4);
  } else {
    ctx.lineTo(s.x, s.y - H - 4);
  }
  ctx.lineTo(s.x + w / 2, s.y - H + (s.broken ? 6 : 14));
  ctx.lineTo(s.x + w / 2, s.y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (s.rope) {
    ctx.strokeStyle = '#C9A860';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s.x - w / 2, s.y - 40);
    ctx.lineTo(s.x + w / 2, s.y - 36);
    ctx.stroke();
  }
}

/** La porte du village : deux grands poteaux, un linteau, deux battants
    (side : une porte à l'est ou à l'ouest, qu'on voit de profil) */
export function drawGate(ctx, b, t, open, side = false) {
  if (side) { drawSideGate(ctx, b, open); return; }
  const { x, y } = b;
  const W = 120;
  groundShadow(ctx, x, y + 4, W * 0.9, 24, 0.3);
  ctx.fillStyle = '#5A3A22';
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 3;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x + s * W * 0.5 - 12, y - 190, 24, 192, 6) : ctx.rect(x + s * W * 0.5 - 12, y - 190, 24, 192);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#7A5A34';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - W * 0.62, y - 200, W * 1.24, 22, 6) : ctx.rect(x - W * 0.62, y - 200, W * 1.24, 22);
  ctx.fill();
  ctx.stroke();
  // les crânes d'aurochs (pour impressionner les ennemis !)
  ctx.fillStyle = '#F2EAD6';
  ctx.beginPath();
  ctx.ellipse(x, y - 214, 14, 11, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#EDE2C6';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 220);
  ctx.quadraticCurveTo(x - 30, y - 236, x - 26, y - 248);
  ctx.moveTo(x + 12, y - 220);
  ctx.quadraticCurveTo(x + 30, y - 236, x + 26, y - 248);
  ctx.stroke();
  // les battants (ouverts quand un ami passe)
  const k = open ? 0.35 : 1;
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#8A6440';
    ctx.strokeStyle = '#2A1A0C';
    ctx.lineWidth = 2.5;
    const x0 = x + s * W * 0.5 - s * 12, x1 = x0 - s * W * 0.5 * k;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.lineTo(x1, y - 150);
    ctx.lineTo(x0, y - 150);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40, 24, 10, 0.4)';
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const xx = lerp(x0, x1, i / 4);
      ctx.moveTo(xx, y - 4);
      ctx.lineTo(xx, y - 146);
    }
    ctx.stroke();
  }
}

/** Une porte de côté (est ou ouest) : vue de profil, ses poteaux sont l'un derrière l'autre */
function drawSideGate(ctx, b, open) {
  const { x, y } = b;
  const D = 64;
  groundShadow(ctx, x + 10, y + 4, 34, D + 24, 0.3);
  const post = (py) => {
    ctx.fillStyle = '#5A3A22';
    ctx.strokeStyle = '#2A1A0C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 13, py - 192, 26, 194, 6) : ctx.rect(x - 13, py - 192, 26, 194);
    ctx.fill();
    ctx.stroke();
  };
  post(y - D);
  // les battants (fermés : une paroi de planches entre les deux poteaux ; ouverts : rabattus)
  ctx.fillStyle = '#8A6440';
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 2.5;
  const k = open ? 0.3 : 1;
  for (const sgn of [-1, 1]) {
    const y0 = y + sgn * D, y1 = y + sgn * D * (1 - k);
    ctx.beginPath();
    ctx.moveTo(x - 6, y0 - 150);
    ctx.lineTo(x - 6, y0);
    ctx.lineTo(x + 6, y1);
    ctx.lineTo(x + 6, y1 - 150);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // le linteau, d'un poteau à l'autre
  ctx.fillStyle = '#7A5A34';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - D - 200);
  ctx.lineTo(x + 12, y - D - 200);
  ctx.lineTo(x + 12, y + D - 178);
  ctx.lineTo(x - 12, y + D - 178);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  post(y + D);
  // le crâne d'aurochs, tout en haut
  ctx.fillStyle = '#F2EAD6';
  ell(ctx, x, y + D - 212, 11, 13);
  ctx.fill();
  ctx.strokeStyle = '#EDE2C6';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + D - 222);
  ctx.quadraticCurveTo(x - 22, y + D - 238, x - 18, y + D - 250);
  ctx.moveTo(x + 6, y + D - 222);
  ctx.quadraticCurveTo(x + 22, y + D - 238, x + 18, y + D - 250);
  ctx.stroke();
}

/** La tour de guet : quatre poteaux, une plateforme, un toit… et un guetteur */
export function drawTower(ctx, b, t, guard) {
  const { x, y } = b;
  groundShadow(ctx, x, y + 4, 70, 22, 0.3);
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x0, x1] of [[-46, -30], [46, 30], [-26, -18], [26, 18]]) {
    ctx.moveTo(x + x0, y);
    ctx.lineTo(x + x1, y - 230);
  }
  ctx.moveTo(x - 40, y - 60);
  ctx.lineTo(x + 34, y - 150);
  ctx.moveTo(x + 40, y - 60);
  ctx.lineTo(x - 34, y - 150);
  ctx.stroke();
  ctx.strokeStyle = '#7A5A34';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.fillStyle = '#8A6440';
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - 52, y - 246, 104, 22, 5) : ctx.rect(x - 52, y - 246, 104, 22);
  ctx.fill();
  ctx.stroke();
  if (guard) guard(x, y - 240);
  // la rambarde et le toit
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - 52, y - 280, 104, 14, 4) : ctx.rect(x - 52, y - 280, 104, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#C9A860';
  ctx.beginPath();
  ctx.moveTo(x - 66, y - 300);
  ctx.lineTo(x, y - 350);
  ctx.lineTo(x + 66, y - 300);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Le plan d'une construction : une silhouette en pointillés, et ce qu'elle coûte */
export function drawPlan(ctx, b, t, near) {
  const { x, y } = b;
  const R = b.planR || 80;
  const k = 0.55 + Math.sin(t * 3) * 0.15;
  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.lineDashOffset = -t * 20;
  ctx.strokeStyle = near ? `rgba(255, 230, 120, ${0.6 + k * 0.4})` : `rgba(255, 255, 255, ${0.35 + k * 0.25})`;
  ctx.lineWidth = 4;
  ell(ctx, x, y, R, R * 0.38);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = near ? 'rgba(255, 230, 120, 0.15)' : 'rgba(255, 255, 255, 0.06)';
  ell(ctx, x, y, R, R * 0.38);
  ctx.fill();
}

/* ============================================================================
   LES ICÔNES DES RESSOURCES (le compteur en haut, le coût des plans)
   ============================================================================ */
export function drawResIcon(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(1, s * 0.1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (id === 'bois') {
    for (const [a, dy] of [[-0.35, 0.12], [0.35, -0.05]]) {
      ctx.save();
      ctx.rotate(a);
      ctx.translate(0, dy * s);
      ctx.fillStyle = '#8A6440';
      ctx.strokeStyle = '#3A2414';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-s * 0.85, -s * 0.2, s * 1.7, s * 0.4, s * 0.2) : ctx.rect(-s * 0.85, -s * 0.2, s * 1.7, s * 0.4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#E2C08A';
      ell(ctx, s * 0.85, 0, s * 0.12, s * 0.18);
      ctx.fill();
      ctx.restore();
    }
  } else if (id === 'silex') {
    ctx.fillStyle = '#5A5A62';
    ctx.strokeStyle = '#1E1E26';
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, s * 0.5);
    ctx.lineTo(-s * 0.3, -s * 0.75);
    ctx.lineTo(s * 0.55, -s * 0.45);
    ctx.lineTo(s * 0.75, s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#D2D2DC';
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, -s * 0.5);
    ctx.lineTo(s * 0.35, -s * 0.3);
    ctx.lineTo(-s * 0.05, s * 0.05);
    ctx.fill();
  } else if (id === 'ocre') {
    ctx.fillStyle = '#B8502E';
    ctx.strokeStyle = '#4A1A10';
    ell(ctx, 0, s * 0.1, s * 0.75, s * 0.55);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E2844A';
    circle(ctx, -s * 0.2, -s * 0.05, s * 0.2);
    ctx.fill();
  } else if (id === 'ble') {
    ctx.strokeStyle = '#8A6A2A';
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.9);
    ctx.lineTo(0, -s * 0.2);
    ctx.stroke();
    ctx.fillStyle = '#E8C05A';
    ctx.strokeStyle = '#8A6A2A';
    ctx.lineWidth = Math.max(0.8, s * 0.08);
    for (let i = 0; i < 4; i++) {
      for (const sx of [-1, 1]) {
        ell(ctx, sx * s * 0.2, -s * (0.75 - i * 0.28), s * 0.15, s * 0.24, sx * 0.5);
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (id === 'eau') {
    ctx.fillStyle = '#5AB0E0';
    ctx.strokeStyle = '#1E5A80';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.quadraticCurveTo(s * 0.75, s * 0.1, 0, s * 0.75);
    ctx.quadraticCurveTo(-s * 0.75, s * 0.1, 0, -s * 0.85);
    ctx.fill();
    ctx.stroke();
  } else if (id === 'feu') {
    flame(ctx, 0, s * 0.7, s * 0.85, 0.3, 1);
  } else if (id === 'mouton') {
    // un petit mouton tout rond (sa laine, sa tête noire)
    ctx.fillStyle = '#F4F0E6';
    ctx.strokeStyle = '#6A5A48';
    for (const [dx, dy, r] of [[-0.35, 0, 0.36], [0.05, -0.18, 0.4], [0.3, 0.05, 0.34], [-0.05, 0.15, 0.38]]) {
      ell(ctx, dx * s, dy * s, r * s, r * s * 0.85);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#2E2A26';
    ell(ctx, s * 0.62, -s * 0.12, s * 0.22, s * 0.28);
    ctx.fill();
    ctx.fillRect(-s * 0.35, s * 0.4, s * 0.1, s * 0.3);
    ctx.fillRect(s * 0.2, s * 0.4, s * 0.1, s * 0.3);
  } else if (id === 'viande') {
    ctx.fillStyle = '#C4583E';
    ctx.strokeStyle = '#4A1A10';
    ell(ctx, -s * 0.15, 0, s * 0.62, s * 0.45, -0.3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F2E8D2';
    ell(ctx, s * 0.55, -s * 0.3, s * 0.25, s * 0.12, -0.3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

const ICONS = {};
/** L'icône d'une ressource, en image (pour le compteur en haut de l'écran) */
export function resIconUrl(id) {
  if (ICONS[id]) return ICONS[id];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  drawResIcon(g, id, 32, 32, 22);
  ICONS[id] = c.toDataURL();
  return ICONS[id];
}
