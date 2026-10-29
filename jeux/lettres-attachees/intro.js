// ============================================================================
// Les animations : le départ (on peut le passer) et la fin d'un niveau.
//
// Le départ, environ 16 s, devant la tour de Plume :
//   0 → 4,5 s    Plume garde le Grimoire Magique : les lettres dansent au-dessus
//   4,5 → 8 s    Gribouille, le petit nuage farceur, arrive sans bruit…
//   8 → 12 s     FFFOUUU ! Il souffle : les lettres s'envolent dans des bulles
//   12 → 16 s    Plume brandit sa baguette : « Aide-moi à les rattraper ! »
// La fin d'un niveau tourne en boucle derrière le texte : les mots retrouvés
// rentrent dans le grimoire, feux d'artifice, Gribouille s'excuse.
// ============================================================================

import {
  buildScene, drawSceneFx, drawPlume, drawGribouille, drawGrimoire, drawBubble, drawWindLines,
  drawSpark, starPath, roundRect, SCRIPTS,
} from './art.js';

const TAU = Math.PI * 2;
const DURATION = 16;

const CAPTIONS = [
  [0.3, 4.4, "Dans sa tour, Plume la chouette garde le Grimoire Magique : toutes les lettres et tous les mots y sont rangés."],
  [4.6, 8, "Mais voici Gribouille, le petit nuage farceur…"],
  [8.2, 12, "FFFOUUU ! Il souffle sur le grimoire : les lettres s'envolent dans des bulles !"],
  [12.2, 16, "Vite ! Prends ta baguette magique et aide Plume à tout rattraper !"],
];

const LETTERS = [['cap', 'A'], ['cursive', 'b'], ['script', 'c'], ['cap', 'M'], ['cursive', 'o'], ['script', 'r'], ['cap', 'S'], ['cursive', 'é']];

function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawCaptionBox(ctx, w, h, text, alpha) {
  const fs = Math.max(15, Math.min(24, w / 38));
  ctx.font = `700 ${fs}px 'Baloo 2', sans-serif`;
  const maxW = Math.min(w - 40, 760);
  const lines = wrap(ctx, text, maxW - 40);
  const lh = fs * 1.3;
  const bw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44);
  const bh = lines.length * lh + 24;
  const x = (w - bw) / 2, y = Math.max(16, h * 0.05);
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = 'rgba(255, 252, 243, 0.94)';
  roundRect(ctx, x, y, bw, bh, 16);
  ctx.fill();
  ctx.fillStyle = '#2E2A4D';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, w / 2, y + 12 + i * lh));
  ctx.globalAlpha = 1;
}

/** Le décor de fond, recalculé seulement quand la taille change */
function sceneCache(kind) {
  let cache = null;
  return (ctx, w, h) => {
    const dpr = ctx.getTransform().a || 1;
    if (!cache || cache.w !== w || cache.h !== h) cache = { w, h, img: buildScene(kind, w, h, dpr) };
    ctx.drawImage(cache.img, 0, 0, w, h);
  };
}

const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);

export function createIntro({ sfx, hat }) {
  let t = 0;
  const cues = new Set();
  const fx = {};
  const bg = sceneCache('tour');
  const sparks = [];
  // chaque lettre : sa place autour du grimoire, puis son envol
  const letters = LETTERS.map(([script, text], i) => ({
    script, text, a: (i / LETTERS.length) * TAU, fly: { vx: -0.5 - Math.random() * 0.6, vy: -0.35 - Math.random() * 0.5, delay: i * 0.18 },
  }));

  function cue(name, at, fn) {
    if (t >= at && !cues.has(name)) { cues.add(name); fn(); }
  }

  const intro = {
    done: false,

    update(dt) {
      t += dt;
      cue('magic', 0.8, () => sfx.magic());
      cue('sneak', 5, () => sfx.giggle());
      cue('wind', 8.2, () => sfx.wind());
      cue('pop', 9.4, () => sfx.inflate(2));
      cue('laugh', 11, () => sfx.giggle());
      cue('wand', 12.6, () => sfx.magic());
      for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; s.life -= dt; }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
      if (t >= DURATION) intro.done = true;
    },

    draw(ctx, w, h) {
      bg(ctx, w, h);
      drawSceneFx(ctx, 'tour', w, h, t, fx);
      const m = Math.min(w, h);
      const bookW = Math.min(w * 0.42, 420);
      const bx = w * 0.52, by = h * 0.74;
      const blown = t > 8.2;
      drawGrimoire(ctx, bx, by, bookW, t, blown ? 0.1 : 0.6 + 0.4 * Math.sin(t * 3), [], 6);

      // les lettres : elles dansent au-dessus du grimoire… puis s'envolent dans des bulles
      letters.forEach((l, i) => {
        const orbitR = bookW * 0.42;
        let x = bx + Math.cos(l.a + t * 0.8) * orbitR;
        let y = by - bookW * 0.35 + Math.sin(l.a + t * 0.8) * orbitR * 0.25 + Math.sin(t * 2 + i) * 6;
        let bubble = 0;
        const k = t - 8.4 - l.fly.delay;
        if (k > 0) {
          x += l.fly.vx * k * k * w * 0.18;
          y += l.fly.vy * k * k * h * 0.22;
          bubble = ease(k * 2);
        }
        if (x < -100 || y < -100) return;
        const size = m * 0.06;
        if (bubble > 0) {
          drawBubble(ctx, { x, y, rx: size * 1.2, ry: size * 1.2, text: l.text.toLowerCase(), script: l.script, scale: bubble, alpha: 1, ph: i }, t);
        } else {
          ctx.save();
          ctx.shadowColor = 'rgba(255, 230, 120, 0.9)';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#FFF4C8';
          ctx.font = SCRIPTS[l.script].font(size * 1.3 * SCRIPTS[l.script].k);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(l.text, x, y);
          ctx.restore();
        }
      });

      // Plume, à gauche du grimoire
      const px = bx - bookW * 0.72, py = by - m * 0.1;
      const mood = t > 8.2 && t < 12 ? 'worried' : t > 12 ? 'happy' : 'happy';
      const wave = t > 12 ? 0.6 + 0.4 * Math.sin(t * 6) : 0;
      drawPlume(ctx, px, py, m * 0.11, t, { mood, hat, wave });
      // la baguette de Plume, qui crépite
      if (t > 12.2) {
        const wx = px + m * 0.16, wy = py - m * 0.16;
        if (Math.random() < 0.6) sparks.push({ x: wx, y: wy, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 120, life: 0.8, c: ['#FFE066', '#FF9DBB', '#9EE7FF'][Math.floor(Math.random() * 3)] });
        ctx.fillStyle = '#FFE066';
        ctx.strokeStyle = '#C98A12';
        ctx.lineWidth = 2;
        starPath(ctx, wx, wy, m * 0.03, t * 3);
        ctx.fill();
        ctx.stroke();
      }
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(0, s.life);
        drawSpark(ctx, 'star', s.x, s.y, 5, s.c, t * 4);
      }
      ctx.globalAlpha = 1;

      // Gribouille arrive par la droite, souffle, puis s'envole en riant
      if (t > 4.4) {
        const gr = m * 0.09;
        let gx = w + gr * 2 - ease((t - 4.4) / 3) * (w * 0.25 + gr * 2);
        let gy = by - bookW * 0.3;
        let gmood = 'sneak';
        if (t > 8.2 && t < 10.8) gmood = 'blow';
        if (t >= 10.8) {
          gmood = 'laugh';
          const k = t - 10.8;
          gx += k * k * w * 0.08;
          gy -= k * k * h * 0.12;
        }
        drawGribouille(ctx, gx, gy, gr, t, gmood, -1);
        if (gmood === 'blow') drawWindLines(ctx, gx - gr * 1.3, gy, -1, w * 0.3, t, 0.9);
      }

      // les légendes
      for (const [a, b, text] of CAPTIONS) {
        if (t >= a && t < b) {
          const alpha = Math.min(1, (t - a) * 3, (b - t) * 3);
          drawCaptionBox(ctx, w, h, text, alpha);
        }
      }
      // fondu au début et à la fin
      const fade = Math.max(0, 1 - t * 1.5, (t - (DURATION - 0.6)) / 0.6);
      if (fade > 0) {
        ctx.fillStyle = `rgba(5, 4, 20, ${Math.min(1, fade)})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
  return intro;
}

/* ============================================================================
   La fin d'un niveau (en boucle derrière le texte)
   words = les mots retrouvés (ils rentrent dans le grimoire)
   ============================================================================ */
export function createEnding({ sfx, scene, hat, words, wand }) {
  let t = 0;
  const fx = {};
  const bg = sceneCache(scene);
  const rockets = [];
  const sparks = [];
  let nextRocket = 0.6;
  const flying = words.slice(0, 12).map((text, i) => ({ text, delay: 0.4 + i * 0.25, a: Math.random() * TAU }));
  const entries = [];

  return {
    update(dt) {
      t += dt;
      nextRocket -= dt;
      if (nextRocket <= 0) {
        nextRocket = 0.5 + Math.random() * 0.7;
        rockets.push({ x: 0.15 + Math.random() * 0.7, y: 1.05, vy: -(0.55 + Math.random() * 0.25), fuse: 0.9 + Math.random() * 0.5 });
      }
      for (const r of rockets) { r.y += r.vy * dt; r.fuse -= dt; }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        if (r.fuse <= 0) {
          rockets.splice(i, 1);
          sfx.pop();
          for (let k = 0; k < 26; k++) {
            const a = (k / 26) * TAU, s = 120 + Math.random() * 120;
            sparks.push({ x: r.x, y: r.y, ox: 0, oy: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.1, c: wand.colors[k % wand.colors.length], rot: Math.random() * TAU });
          }
        }
      }
      for (const s of sparks) { s.ox += s.vx * dt; s.oy += s.vy * dt; s.vx *= 0.97; s.vy = s.vy * 0.97 + 50 * dt; s.life -= dt * 0.9; }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
    },

    draw(ctx, w, h) {
      bg(ctx, w, h);
      drawSceneFx(ctx, scene, w, h, t, fx);
      ctx.fillStyle = 'rgba(10, 6, 40, 0.25)';
      ctx.fillRect(0, 0, w, h);
      const m = Math.min(w, h);
      const bookW = Math.min(w * 0.5, 460);
      const bx = w / 2, by = h * 0.78;
      // les mots qui rentrent dans le grimoire, un par un
      for (const f of flying) {
        const k = (t - f.delay) / 1.2;
        if (k < 0) continue;
        if (k >= 1) {
          if (!f.in) { f.in = true; entries.push({ text: f.text, age: 0 }); }
          continue;
        }
        const e = ease(k);
        const sx = w / 2 + Math.cos(f.a) * w * 0.45, sy = h * 0.3 + Math.sin(f.a) * h * 0.2;
        const x = sx + (bx - sx) * e, y = sy + (by - sy) * e - Math.sin(e * Math.PI) * h * 0.15;
        ctx.save();
        ctx.globalAlpha = 1 - e * 0.3;
        ctx.shadowColor = 'rgba(255, 230, 120, 0.9)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FFF4C8';
        ctx.font = SCRIPTS.cursive.font(m * 0.045 * (1 - e * 0.4));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.text, x, y);
        ctx.restore();
      }
      for (const e of entries) e.age = Math.min(1, e.age + 0.02);
      drawGrimoire(ctx, bx, by, bookW, t, 0.7 + 0.3 * Math.sin(t * 3), entries, Math.max(6, Math.min(12, flying.length + (flying.length % 2))));
      // Plume, fière, et Gribouille qui s'excuse
      drawPlume(ctx, bx - bookW * 0.68, by - m * 0.08, m * 0.1, t, { mood: 'proud', hat, wave: 0.5 + 0.5 * Math.sin(t * 5) });
      drawGribouille(ctx, bx + bookW * 0.7, by - m * 0.14, m * 0.075, t, t % 6 < 3 ? 'sorry' : 'laugh', -1);
      // les feux d'artifice
      for (const r of rockets) {
        ctx.fillStyle = '#FFF4C8';
        ctx.beginPath();
        ctx.arc(r.x * w, r.y * h, 3, 0, TAU);
        ctx.fill();
      }
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(0, Math.min(1, s.life));
        drawSpark(ctx, wand.shape === 'firework' ? 'star' : wand.shape, s.x * w + s.ox, s.y * h + s.oy, 5, s.c, s.rot + t);
      }
      ctx.globalAlpha = 1;
    },
  };
}
