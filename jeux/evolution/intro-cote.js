// ============================================================================
// Évolution — les animations VUES DE CÔTÉ : le début et la fin de la voie
// des airs et de la voie des reptiles (on peut passer le début).
//
// Le début (environ 16 s), le même scénario pour les deux niveaux :
//   0 → 4,2 s    il y a 66 millions d'années : les dinosaures… et une
//                boule de feu qui traverse le ciel
//   4,2 → 5,6 s  l'impact : un éclair blanc, le ciel s'embrase
//   5,6 → 10 s   la cendre tombe, il fait froid et sombre ; les géants ont
//                disparu… mais un tout petit animal sort de sa cachette
//   10 → 16 s    le soleil revient : l'oiseau s'envole (ou le lézard grimpe
//                sur une fougère qui repousse)
// La fin : un défilé des oiseaux (ou des reptiles) d'aujourd'hui, puis, sur la
// colline, les humains qui arrivent.
// ============================================================================

import { drawCaptionBox } from './intro.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => 1 - (1 - clamp01(k)) ** 3;

const DURATION = 16;
const CAPTIONS = {
  airs: [
    [0.3, 4.2, "Il y a 66 millions d'années, les dinosaures règnent sur la Terre… Mais quelque chose arrive du ciel."],
    [5.8, 10, "Une météorite ! Le ciel se couvre de cendres, il fait froid et sombre. Les grands dinosaures disparaissent…"],
    [10.2, 16, "Mais un petit dinosaure à plumes a survécu, caché dans la falaise : un oiseau. C'est toi !"],
  ],
  reptiles: [
    [0.3, 4.2, "Il y a 66 millions d'années, les dinosaures règnent sur la Terre… Mais quelque chose arrive du ciel."],
    [5.8, 10, "Une météorite ! Le ciel se couvre de cendres. Les grands dinosaures disparaissent… mais au fond de l'eau, sous les pierres, d'autres attendent."],
    [10.2, 16, "Les petits reptiles ont survécu ! La forêt repousse… Toi, petit lézard, tu vas traverser les âges."],
  ],
};

const ASH = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), s: 0.8 + Math.random() * 2.2, v: 0.02 + Math.random() * 0.05, p: Math.random() * TAU }));
const STARS = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random() * 0.5 }));

function mixCol(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, k)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k)), bl = Math.round(lerp(pa & 255, pb & 255, k));
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Des collines lointaines (une ligne qui ondule), remplies jusqu'en bas */
function hills(ctx, w, h, y0, A, wl, ph, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w + 10; x += 10) ctx.lineTo(x, y0 - A * (0.6 + 0.4 * Math.sin(x / wl + ph) + 0.2 * Math.sin(x / (wl * 0.37) + ph * 2)));
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

/** Un arbre en ombre chinoise (un palmier, un conifère, un arbre mort) */
function treeShape(ctx, x, y, s, type, col, t) {
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineCap = 'round';
  if (type === 'palmier') {
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.5, x + s * 0.05, y - s);
    ctx.stroke();
    ctx.lineWidth = s * 0.05;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.48 + Math.sin(t + i) * 0.04;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.05, y - s);
      ctx.quadraticCurveTo(x + s * 0.05 + Math.cos(a) * s * 0.28, y - s + Math.sin(a) * s * 0.35, x + s * 0.05 + Math.cos(a) * s * 0.45, y - s + Math.sin(a) * s * 0.2 + s * 0.15);
      ctx.stroke();
    }
  } else if (type === 'mort') {
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - s);
    ctx.moveTo(x, y - s * 0.6);
    ctx.lineTo(x - s * 0.25, y - s * 0.85);
    ctx.moveTo(x, y - s * 0.45);
    ctx.lineTo(x + s * 0.3, y - s * 0.7);
    ctx.moveTo(x, y - s * 0.85);
    ctx.lineTo(x + s * 0.15, y - s * 1.05);
    ctx.stroke();
  } else if (type === 'fougere') {
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - s * 0.6);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.4;
      ctx.moveTo(x, y - s * 0.6);
      ctx.quadraticCurveTo(x + Math.cos(a) * s * 0.25, y - s * 0.6 + Math.sin(a) * s * 0.3, x + Math.cos(a) * s * 0.42, y - s * 0.5 + Math.sin(a) * s * 0.15);
    }
    ctx.stroke();
  } else {
    // un conifère
    ctx.fillRect(x - s * 0.03, y - s * 0.3, s * 0.06, s * 0.3);
    for (let i = 0; i < 4; i++) {
      const yy = y - s * 0.25 - i * s * 0.22, wd = s * (0.3 - i * 0.06);
      ctx.beginPath();
      ctx.moveTo(x, yy - s * 0.3);
      ctx.lineTo(x + wd, yy);
      ctx.lineTo(x - wd, yy);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** Les dinosaures d'avant la météorite, en ombres chinoises (un long cou, un T. rex, des ptérosaures) */
function dinoShapes(ctx, w, h, gy, t, alpha, col) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = col;
  // le sauropode, qui marche doucement
  const sx = w * 0.62 + t * 6, s = Math.min(w, h) * 0.22;
  ctx.beginPath();
  ctx.ellipse(sx, gy - s * 0.42, s * 0.5, s * 0.22, 0, 0, TAU);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = col;
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(sx + s * 0.35, gy - s * 0.5);
  ctx.quadraticCurveTo(sx + s * 0.7, gy - s * 0.9, sx + s * 0.75, gy - s * 1.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(sx + s * 0.8, gy - s * 1.28, s * 0.09, s * 0.05, 0.2, 0, TAU);
  ctx.fill();
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(sx - s * 0.45, gy - s * 0.4);
  ctx.quadraticCurveTo(sx - s * 0.85, gy - s * 0.35, sx - s * 1.1, gy - s * 0.15);
  ctx.stroke();
  ctx.lineWidth = s * 0.09;
  for (const [dx, ph] of [[-0.3, 0], [-0.15, Math.PI], [0.2, Math.PI], [0.32, 0]]) {
    const sw = Math.sin(t * 2 + ph) * s * 0.04;
    ctx.beginPath();
    ctx.moveTo(sx + dx * s, gy - s * 0.35);
    ctx.lineTo(sx + dx * s + sw, gy);
    ctx.stroke();
  }
  // le T. rex, plus près, à gauche
  const tx = w * 0.22, ts = Math.min(w, h) * 0.16;
  ctx.beginPath();
  ctx.ellipse(tx, gy - ts * 0.62, ts * 0.42, ts * 0.2, -0.15, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(tx + ts * 0.5, gy - ts * 0.85, ts * 0.22, ts * 0.12, -0.1, 0, TAU);
  ctx.fill();
  ctx.lineWidth = ts * 0.1;
  ctx.beginPath();
  ctx.moveTo(tx - ts * 0.35, gy - ts * 0.6);
  ctx.quadraticCurveTo(tx - ts * 0.8, gy - ts * 0.55, tx - ts * 1.05, gy - ts * 0.5);
  ctx.stroke();
  ctx.lineWidth = ts * 0.12;
  for (const [dx, ph] of [[-0.05, 0], [0.12, Math.PI]]) {
    const sw = Math.sin(t * 3 + ph) * ts * 0.08;
    ctx.beginPath();
    ctx.moveTo(tx + dx * ts, gy - ts * 0.55);
    ctx.lineTo(tx + dx * ts + sw, gy);
    ctx.stroke();
  }
  // des ptérosaures dans le ciel
  ctx.lineWidth = Math.max(2, ts * 0.04);
  for (let i = 0; i < 3; i++) {
    const px = ((w * (0.2 + i * 0.27) + t * 40 * (1 + i * 0.3)) % (w + 100)) - 50, py = h * (0.18 + i * 0.07);
    const f = Math.sin(t * 5 + i) * ts * 0.12;
    ctx.beginPath();
    ctx.moveTo(px - ts * 0.35, py - f);
    ctx.quadraticCurveTo(px - ts * 0.12, py - ts * 0.08, px, py);
    ctx.quadraticCurveTo(px + ts * 0.12, py - ts * 0.08, px + ts * 0.35, py - f);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * kind : 'airs' ou 'reptiles'
 * drawHero(ctx, x, y, r, c) : dessine le joueur ; c : { face, angle, loco, flapPh, flapping, walk, speed, mood, mouth }
 * drawAnimal(ctx, look, color, x, y, r, c) : dessine un animal du niveau (le crocodile de l'intro des reptiles)
 */
export function createSideIntro({ sfx, kind, drawHero, drawAnimal }) {
  let t = 0;
  const cues = new Set();
  const cue = (name, at, fn) => { if (t >= at && !cues.has(name)) { cues.add(name); fn(); } };
  const caps = CAPTIONS[kind];
  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('whoosh', 1.6, () => sfx.dash());
      cue('boom', 4.2, () => sfx.boom());
      cue('rumble', 4.6, () => sfx.rumble());
      cue('sad', 6.2, () => sfx.sad());
      cue('peek', 8.4, () => sfx.pickup());
      cue('sun', 10.2, () => sfx.chapter());
      if (t >= DURATION) intro.done = true;
    },
    draw(ctx, w, h) {
      const m = Math.min(w, h);
      const gy = h * 0.8;
      // le ciel : bleu, puis rouge feu, puis gris de cendre… puis le soleil revient
      const fire = clamp01((t - 4.2) / 0.6) * (1 - clamp01((t - 5.6) / 1.5));
      const ash = clamp01((t - 5.2) / 1.2) * (1 - clamp01((t - 10.2) / 3) * 0.75);
      const top = ash > 0 ? mixCol('#3E9AE0', '#5A5652', ash) : '#3E9AE0';
      const bot = ash > 0 ? mixCol('#CDEAF4', '#9A8E7E', ash) : '#CDEAF4';
      const sky = ctx.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, top);
      sky.addColorStop(1, bot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      if (fire > 0) {
        ctx.fillStyle = `rgba(255, 110, 40, ${0.55 * fire})`;
        ctx.fillRect(0, 0, w, h);
      }
      // le soleil (il revient à la fin)
      const sunA = t < 4.2 ? 1 : clamp01((t - 10.2) / 2);
      if (sunA > 0) {
        const sx = w * 0.78, sy = h * (0.2 + (1 - sunA) * 0.1);
        const glow = ctx.createRadialGradient(sx, sy, m * 0.03, sx, sy, m * 0.45);
        glow.addColorStop(0, `rgba(255, 245, 200, ${0.6 * sunA})`);
        glow.addColorStop(1, 'rgba(255, 245, 200, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = `rgba(255, 250, 220, ${sunA})`;
        ctx.beginPath();
        ctx.arc(sx, sy, m * 0.05, 0, TAU);
        ctx.fill();
        if (t > 10.2) {
          // les rayons de soleil à travers la cendre
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 5; i++) {
            const a = 1.9 + i * 0.16 + Math.sin(t * 0.3 + i) * 0.02;
            const g2 = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * h, sy + Math.sin(a) * h);
            g2.addColorStop(0, `rgba(255, 240, 190, ${0.14 * sunA})`);
            g2.addColorStop(1, 'rgba(255, 240, 190, 0)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(a - 0.05) * h * 1.4, sy + Math.sin(a - 0.05) * h * 1.4);
            ctx.lineTo(sx + Math.cos(a + 0.05) * h * 1.4, sy + Math.sin(a + 0.05) * h * 1.4);
            ctx.closePath();
            ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // la météorite : une boule de feu qui traverse le ciel
      if (t > 1 && t < 4.4) {
        const k = ease((t - 1) / 3.2);
        const mx = lerp(w * 1.05, w * 0.42, k), my = lerp(-h * 0.05, gy - h * 0.05, k);
        const R = m * (0.015 + k * 0.04);
        const tail = ctx.createLinearGradient(mx, my, mx + m * 0.5, my - m * 0.35);
        tail.addColorStop(0, 'rgba(255, 220, 120, 0.9)');
        tail.addColorStop(1, 'rgba(255, 120, 40, 0)');
        ctx.strokeStyle = tail;
        ctx.lineWidth = R * 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + m * 0.5, my - m * 0.35);
        ctx.stroke();
        const g3 = ctx.createRadialGradient(mx, my, 0, mx, my, R * 3);
        g3.addColorStop(0, 'rgba(255, 255, 220, 1)');
        g3.addColorStop(0.4, 'rgba(255, 180, 60, 0.8)');
        g3.addColorStop(1, 'rgba(255, 90, 20, 0)');
        ctx.fillStyle = g3;
        ctx.beginPath();
        ctx.arc(mx, my, R * 3, 0, TAU);
        ctx.fill();
      }
      // le lointain
      const far = ash > 0 ? mixCol('#7AA8C2', '#7A746C', ash) : '#7AA8C2';
      const near = ash > 0 ? mixCol('#4E8A5A', '#5A544C', ash) : '#4E8A5A';
      hills(ctx, w, h, gy - h * 0.12, h * 0.12, w * 0.12, 1.3, far);
      dinoShapes(ctx, w, h, gy - h * 0.04, t, 1 - clamp01((t - 4.3) / 1.2), 'rgba(40, 60, 50, 0.7)');
      hills(ctx, w, h, gy - h * 0.02, h * 0.05, w * 0.08, 0.4, near);
      // les arbres : verts, puis morts, puis ça repousse
      const dead = clamp01((t - 5.4) / 1.5) * (1 - clamp01((t - 11) / 4));
      const trees = kind === 'airs' ? [[0.08, 'palmier', 0.32], [0.3, 'conifere', 0.4], [0.9, 'palmier', 0.28], [0.52, 'conifere', 0.3]] : [[0.1, 'palmier', 0.36], [0.35, 'fougere', 0.3], [0.62, 'palmier', 0.4], [0.92, 'fougere', 0.34]];
      for (const [fx, type, s] of trees) {
        treeShape(ctx, w * fx, gy - h * 0.01, h * s, dead > 0.5 ? 'mort' : type, dead > 0.5 ? '#3A3632' : mixCol('#2E5A34', '#3A3632', dead * 2), t);
      }
      // le sol
      const gg = ctx.createLinearGradient(0, gy, 0, h);
      gg.addColorStop(0, ash > 0 ? mixCol('#6A8A3A', '#6A6050', ash) : '#6A8A3A');
      gg.addColorStop(1, '#3A2E20');
      ctx.fillStyle = gg;
      ctx.fillRect(0, gy, w, h - gy);
      // (les reptiles) la rivière, où le crocodile se cache
      if (kind === 'reptiles') {
        const rx0 = w * 0.55, rx1 = w * 0.85;
        const rg = ctx.createLinearGradient(0, gy, 0, h);
        rg.addColorStop(0, ash > 0 ? mixCol('#4A9AB8', '#5A6A6A', ash) : '#4A9AB8');
        rg.addColorStop(1, '#1E3A44');
        ctx.fillStyle = rg;
        ctx.fillRect(rx0, gy + 6, rx1 - rx0, h - gy);
        const dive = clamp01((t - 5.6) / 1.2) * (1 - clamp01((t - 11) / 2));
        drawAnimal(ctx, 'vc-borealosuchus', '#5A6A44', w * 0.7, gy + m * 0.02 + dive * m * 0.12, m * 0.07, { face: -1, angle: Math.PI, loco: 'eau', speed: 0.2, mood: t > 4.2 && t < 9 ? 'scared' : 'calm', mouth: t < 4 ? Math.max(0, Math.sin(t * 2)) * 0.6 : 0 });
        ctx.fillStyle = 'rgba(70, 140, 170, 0.45)';
        ctx.fillRect(rx0, gy + 6, rx1 - rx0, h - gy);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx0, gy + 6);
        ctx.lineTo(rx1, gy + 6);
        ctx.stroke();
      }
      // le héros : sa cachette (un trou dans la falaise, une pierre)
      const hx = kind === 'airs' ? w * 0.36 : w * 0.3;
      if (kind === 'airs') {
        // une petite falaise, avec une fente
        ctx.fillStyle = ash > 0 ? mixCol('#9A8A74', '#6A6258', ash) : '#9A8A74';
        ctx.strokeStyle = '#3A3028';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx - m * 0.22, gy + 2);
        ctx.lineTo(hx - m * 0.18, gy - m * 0.3);
        ctx.lineTo(hx + m * 0.05, gy - m * 0.34);
        ctx.lineTo(hx + m * 0.14, gy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1E1814';
        ctx.beginPath();
        ctx.ellipse(hx + m * 0.06, gy - m * 0.16, m * 0.045, m * 0.032, 0, 0, TAU);
        ctx.fill();
      }
      const r = m * (kind === 'airs' ? 0.045 : 0.04);
      if (t > 8 && t < 10.2) {
        // il sort la tête de sa cachette, il regarde…
        const k = ease((t - 8) / 0.8);
        const px = kind === 'airs' ? hx + m * 0.06 + k * r * 0.6 : hx + k * r * 1.6;
        const py = kind === 'airs' ? gy - m * 0.16 : gy - r * 0.4;
        drawHero(ctx, px, py, r, { face: 1, angle: 0, loco: 'sol', speed: 0, mood: 'scared', walk: 0 });
        if (kind !== 'airs') {
          // la pierre qui le cachait
          ctx.fillStyle = '#6A6258';
          ctx.strokeStyle = '#2E2820';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(hx - r * 0.3, gy - r * 0.2, r * 1.6, r * 0.9, 0, Math.PI, TAU);
          ctx.fill();
          ctx.stroke();
        }
      } else if (t >= 10.2) {
        const u = t - 10.2;
        if (kind === 'airs') {
          // il s'envole, monte vers le soleil… et fait une boucle de joie
          const x = hx + m * 0.06 + u * m * 0.16, y = gy - m * 0.16 - Math.sin(Math.min(u, 3) / 3 * Math.PI / 2) * h * 0.3 + Math.sin(u * 2) * m * 0.02;
          drawHero(ctx, x, y, r * 1.1, { face: 1, angle: -0.35 + Math.sin(u * 2) * 0.15, loco: 'vol', flapPh: u * 13, flapping: true, speed: 0.8, mood: 'happy' });
        } else {
          // la fougère repousse… et le lézard grimpe dessus
          const grow = ease(u / 2.5);
          treeShape(ctx, hx + m * 0.16, gy, h * 0.42 * grow, 'fougere', '#3E8A3A', t);
          const up = clamp01((u - 1.5) / 3);
          const x = hx + m * 0.16 - r * 0.7, y = gy - r * 0.6 - up * h * 0.2;
          drawHero(ctx, up > 0 ? x : hx + r * 1.6 + u * m * 0.12, up > 0 ? y : gy - r * 0.4, r, { face: 1, angle: up > 0 ? -Math.PI / 2 : 0, loco: up > 0 ? 'grimpe' : 'sol', walk: u * 3, speed: 0.7, mood: 'happy' });
        }
      }
      // la cendre qui tombe
      if (ash > 0.05) {
        for (const a of ASH) {
          const x = (a.x * w + Math.sin(t * 0.6 + a.p) * 14) % w;
          const y = ((a.y + t * a.v) % 1) * h;
          ctx.fillStyle = `rgba(70, 66, 62, ${0.55 * ash})`;
          ctx.beginPath();
          ctx.arc(x, y, a.s, 0, TAU);
          ctx.fill();
        }
      }
      // l'éclair de l'impact
      const flash = clamp01(1 - Math.abs(t - 4.35) / 0.45);
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 250, 235, ${flash})`;
        ctx.fillRect(0, 0, w, h);
      }
      const cap = caps.find(([a0, b0]) => t >= a0 && t < b0);
      if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
    },
  };
  return intro;
}

/**
 * La fin (environ 16 s) : un beau paysage, le défilé des espèces d'aujourd'hui,
 * puis les humains sur la colline.
 * o : { kind ('oiseaux' / 'reptiles'), parade [{ look, name, color, belly, k, fly, shell }],
 *       captions, textAt, drawHero(ctx, x, y, r, c), drawAnimal(ctx, d, x, y, r, c), drawHuman(ctx, look, x, y, r, c) }
 */
export function drawSideEnding(ctx, w, h, t, o) {
  const m = Math.min(w, h);
  const birds = o.kind === 'oiseaux';
  const gy = h * 0.78;
  // le ciel du soir, tout doré
  const sky = ctx.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, birds ? '#3E86D8' : '#4E9AC8');
  sky.addColorStop(0.7, '#F2C890');
  sky.addColorStop(1, '#F8E2B0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sx = w * 0.72, sy = h * 0.42;
  const glow = ctx.createRadialGradient(sx, sy, m * 0.04, sx, sy, m * 0.6);
  glow.addColorStop(0, 'rgba(255, 240, 190, 0.7)');
  glow.addColorStop(1, 'rgba(255, 240, 190, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#FFF2C8';
  ctx.beginPath();
  ctx.arc(sx, sy, m * 0.07, 0, TAU);
  ctx.fill();
  hills(ctx, w, h, gy - h * 0.1, h * 0.1, w * 0.14, 2.1, '#C29A8A');
  hills(ctx, w, h, gy - h * 0.03, h * 0.06, w * 0.09, 0.7, birds ? '#7A9A5A' : '#5A8A4A');
  for (const [fx, type, s] of [[0.06, 'palmier', 0.36], [0.18, birds ? 'conifere' : 'fougere', 0.3], [0.86, 'palmier', 0.42], [0.95, birds ? 'conifere' : 'fougere', 0.28]]) {
    treeShape(ctx, w * fx, gy, h * s, type, '#2E4A2E', t);
  }
  const gg = ctx.createLinearGradient(0, gy, 0, h);
  gg.addColorStop(0, '#7AA048');
  gg.addColorStop(1, '#4A5A2A');
  ctx.fillStyle = gg;
  ctx.fillRect(0, gy, w, h - gy);
  // les humains, sur la colline, au loin (ils arrivent à la fin)
  const hk = clamp01((t - 9.4) / 1.5);
  if (hk > 0 && o.drawHuman) {
    ctx.globalAlpha = hk;
    const hy = gy - h * 0.06;
    o.drawHuman(ctx, 'vc-chasseur', w * 0.12 + (1 - hk) * w * 0.05, hy, m * 0.045, { face: 1, walk: t * 1.2, speed: 0.4 });
    o.drawHuman(ctx, 'vc-humain', w * 0.06 + (1 - hk) * w * 0.05, hy + m * 0.01, m * 0.042, { face: 1, walk: t * 1.2 + 1, speed: 0.4 });
    o.drawHuman(ctx, 'vc-enfant', w * 0.17 + (1 - hk) * w * 0.05, hy + m * 0.02, m * 0.04, { face: 1, walk: t * 1.4 + 2, speed: 0.4 });
    ctx.globalAlpha = 1;
  }
  // le défilé : chacun passe à son tour, de droite à gauche, avec son nom
  const P = o.parade || [];
  const span = 13;
  P.forEach((d, i) => {
    const start = 0.6 + i * (span / Math.max(1, P.length)) * 0.85;
    const u = (t - start) / 4.4;
    if (u <= 0 || u >= 1) return;
    const r = m * 0.07 * d.k;
    const x = lerp(w + r * 3, -r * 3, u);
    const fly = !!d.fly;
    const y = fly ? h * 0.3 + Math.sin(t * 2 + i) * m * 0.03 : gy - r * (d.stand ?? 0.9);
    o.drawAnimal(ctx, d, x, y, r, { face: -1, angle: Math.PI, loco: fly ? 'vol' : 'sol', walk: t * 3 + i, speed: 0.7, flapPh: t * (d.k < 0.5 ? 40 : 9), flapping: true, mood: 'happy' });
    ctx.globalAlpha = Math.min(1, u * 6, (1 - u) * 6);
    ctx.font = `800 ${Math.max(12, Math.round(m * 0.032))}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(40, 30, 20, 0.8)';
    const ty = fly ? y - r * 1.6 : gy + m * 0.06;
    ctx.strokeText(d.name, x, ty);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(d.name, x, ty);
    ctx.globalAlpha = 1;
  });
  // toi, au milieu, qui regardes le défilé
  const r = m * 0.08;
  if (birds) {
    const x = w * 0.5 + Math.sin(t * 0.5) * w * 0.05, y = h * 0.4 + Math.sin(t * 0.9) * m * 0.02;
    o.drawHero(ctx, x, y, r * 0.8, { face: 1, angle: -0.1, loco: 'vol', flapPh: t * 3, flapping: Math.sin(t * 0.8) > 0, speed: 0.5, mood: 'happy' });
  } else {
    o.drawHero(ctx, w * 0.42, gy - r * 0.75, r, { face: 1, angle: 0, loco: 'sol', walk: 0, speed: 0, mood: 'happy', mouth: t < 1.2 ? 0.8 : 0 });
  }
  const dim = clamp01((t - o.textAt + 0.6) / 0.8);
  if (dim > 0) {
    ctx.fillStyle = `rgba(20, 16, 30, ${0.55 * dim})`;
    ctx.fillRect(0, 0, w, h);
  }
  const cap = o.captions.find(([a0, b0]) => t >= a0 && t < b0);
  if (cap && t < o.textAt) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}
