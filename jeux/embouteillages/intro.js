// ============================================================================
// Le petit film du début, dessiné sur un canvas, avec ses sous-titres :
//   1. Bouchonville, petite ville tranquille où les voitures roulent bien ;
//   2. la grande tempête qui arrache tous les panneaux ;
//   3. le lendemain matin : la pagaille, tout le monde klaxonne ;
//   4. Zaza, la zèbre agente de la circulation, arrive avec son sifflet.
// script.js le lance avec playStory('intro', canvas, { onEnd, sfx }).
// ============================================================================

import { drawCar, carLook, drawSignFace, drawSignPost, drawZaza, drawCarBubble, drawSteam, INK } from './art.js';

const TAU = Math.PI * 2;
const COLORS = ['#FFC53D', '#F2555A', '#36B8E8', '#F28C38', '#5BC46A', '#9C6ADE'];

function caption(c, W, H, text, k) {
  if (!text || k <= 0) return;
  const fs = Math.max(16, Math.min(30, W / 36));
  c.save();
  c.globalAlpha = Math.min(1, k);
  c.font = `700 ${fs}px "Baloo 2", sans-serif`;
  const words = text.replace(/ ([!?:;])/g, ' $1').split(' ');
  const lines = [];
  let cur = '';
  const maxW = Math.min(W * 0.86, 900);
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  const lh = fs * 1.25;
  const bh = lines.length * lh + fs * 0.9;
  const bw = Math.min(W * 0.92, Math.max(...lines.map((l) => c.measureText(l).width)) + fs * 1.6);
  const bx = (W - bw) / 2;
  const by = H - bh - Math.max(24, H * 0.06);
  c.fillStyle = 'rgba(255,252,243,0.95)';
  c.strokeStyle = INK;
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(bx, by, bw, bh, 18);
  c.fill();
  c.stroke();
  c.fillStyle = INK;
  c.textAlign = 'center';
  c.textBaseline = 'top';
  lines.forEach((l, i) => c.fillText(l, W / 2, by + fs * 0.45 + i * lh));
  c.restore();
}

/* le carrefour vu de dessus, avec quatre pâtés de maisons */
function crossroads(c, W, H, s, dark) {
  const cx = W / 2, cy = H / 2;
  const rw = 56 * s;
  c.fillStyle = '#93D483';
  c.fillRect(0, 0, W, H);
  /* les maisons et les arbres des quatre coins */
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const roofs = ['#D9603B', '#4F7FB8', '#8E5A9B', '#E07A45'];
  corners.forEach(([dx, dy], i) => {
    for (let k = 0; k < 3; k++) {
      const x = cx + dx * (rw + 30 * s + k * 74 * s) - 28 * s;
      const y = cy + dy * (rw + 40 * s) - 28 * s;
      c.fillStyle = 'rgba(30,30,50,0.25)';
      c.fillRect(x + 6 * s, y + 6 * s, 56 * s, 56 * s);
      c.fillStyle = roofs[(i + k) % 4];
      c.fillRect(x, y, 56 * s, 56 * s);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.fillRect(x, y, 56 * s, 28 * s);
      c.strokeStyle = INK; c.lineWidth = 2.5 * s; c.strokeRect(x, y, 56 * s, 56 * s);
    }
    const tx = cx + dx * (rw + 60 * s), ty = cy + dy * (rw + 130 * s);
    c.fillStyle = 'rgba(30,50,30,0.25)';
    c.beginPath(); c.arc(tx + 6 * s, ty + 6 * s, 26 * s, 0, TAU); c.fill();
    c.fillStyle = '#5DBB63';
    c.strokeStyle = INK; c.lineWidth = 3 * s;
    c.beginPath(); c.arc(tx, ty, 24 * s, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#8FDC7A';
    c.beginPath(); c.arc(tx - 7 * s, ty - 7 * s, 10 * s, 0, TAU); c.fill();
  });
  /* les trottoirs et les routes */
  c.fillStyle = '#E4DED3';
  c.fillRect(0, cy - rw - 12 * s, W, rw * 2 + 24 * s);
  c.fillRect(cx - rw - 12 * s, 0, rw * 2 + 24 * s, H);
  c.fillStyle = '#5B6070';
  c.fillRect(0, cy - rw, W, rw * 2);
  c.fillRect(cx - rw, 0, rw * 2, H);
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = 4 * s;
  c.setLineDash([18 * s, 18 * s]);
  c.beginPath();
  c.moveTo(0, cy); c.lineTo(cx - rw, cy); c.moveTo(cx + rw, cy); c.lineTo(W, cy);
  c.moveTo(cx, 0); c.lineTo(cx, cy - rw); c.moveTo(cx, cy + rw); c.lineTo(cx, H);
  c.stroke();
  c.setLineDash([]);
  if (dark > 0) {
    c.fillStyle = `rgba(30,30,70,${dark * 0.55})`;
    c.fillRect(0, 0, W, H);
  }
  return { cx, cy, rw };
}

const LOOKS = [0, 1, 2, 3, 4, 5, 6, 7].map(carLook);

export function playStory(which, cv, { onEnd, sfx } = {}) {
  const c = cv.getContext('2d');
  let raf = 0;
  let stopped = false;
  let t0 = 0;
  const DUR = 23;
  const said = {};
  const once = (k, fn) => { if (!said[k]) { said[k] = true; if (fn) fn(); } };
  const flying = [
    { type: 'stop', x: -1, y: -1 }, { type: 'cede', x: 1, y: -1 }, { type: 'stop', x: 1, y: 1 }, { type: 'cede', x: -1, y: 1 },
  ];
  function draw(now) {
    if (stopped) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = Math.max(0.6, Math.min(W, H) / 560);
    const storm = t > 4.5 && t < 9 ? Math.min(1, (t - 4.5) * 1.5, (9 - t) * 1.5) : 0;
    const { cx, cy, rw } = crossroads(c, W, H, s, storm);
    const L = 11 * s * 2.2;
    const carScale = 2.2 * s;
    const car = (x, y, a, i, extra = {}) => {
      c.save();
      c.translate(x, y);
      c.scale(carScale, carScale);
      drawCar(c, 0, 0, a, { color: COLORS[i % COLORS.length], look: LOOKS[i % LOOKS.length], idx: i, mood: 0, honk: 0, t: t + i, ...extra });
      c.restore();
    };

    if (t < 4.5) {
      /* 1. tout roule : les panneaux sont là */
      for (const f of flying) drawSignPost(c, cx + f.x * (rw + 26 * s), cy + f.y * (rw + 26 * s) + 20 * s, f.type, 2 * s);
      const u = (t * 140 * s) % (W + 200);
      car(u - 100, cy + L, 0, 0);
      car(W - ((t * 120 * s + W / 2) % (W + 200)) + 100, cy - L, Math.PI, 2);
      const v = Math.min(cy + rw + 40 * s, -60 + t * 120 * s);
      car(cx - L, v, Math.PI / 2, 1, { brake: v >= cy - rw - 40 * s });
      caption(c, W, H, 'Voici Bouchonville, une petite ville bien tranquille…', Math.min(1, t * 2));
    } else if (t < 9) {
      /* 2. la tempête arrache les panneaux */
      const k = t - 4.5;
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 3 * s;
      for (let i = 0; i < 18; i++) {
        const y = (i * 97 + k * 40) % H;
        const x = ((i * 233 + k * 900) % (W + 400)) - 200;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 60 * s, y - 14 * s, x + 140 * s, y); c.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const x = ((i * 311 + k * 600) % (W + 100)) - 50, y = (i * 173 + Math.sin(k * 3 + i) * 40) % H;
        c.fillStyle = i % 2 ? '#5DBB63' : '#E0A43A';
        c.save(); c.translate(x, y); c.rotate(k * 6 + i);
        c.beginPath(); c.ellipse(0, 0, 7 * s, 3.5 * s, 0, 0, TAU); c.fill();
        c.restore();
      }
      flying.forEach((f, i) => {
        const go = Math.max(0, k - 0.6 - i * 0.35);
        const x = cx + f.x * (rw + 26 * s) + go * go * 260 * s + go * 120 * s;
        const y = cy + f.y * (rw + 26 * s) + 20 * s - go * go * 140 * s - Math.sin(go * 4) * 20 * s;
        c.save();
        c.translate(x, y);
        c.rotate(go * (5 + i));
        if (go > 0) drawSignFace(c, f.type, 0, 0, 18 * s);
        c.restore();
        if (go <= 0) drawSignPost(c, cx + f.x * (rw + 26 * s), cy + f.y * (rw + 26 * s) + 20 * s, f.type, 2 * s);
        if (go > 0) once(`whoosh${i}`);
      });
      caption(c, W, H, 'Mais une nuit, une énorme tempête a emporté tous les panneaux !', Math.min(1, k * 2));
    } else if (t < 14.5) {
      /* 3. le lendemain : tout le monde veut passer en même temps */
      const k = t - 9;
      const into = Math.min(1, k / 1.6);
      const e = 1 - (1 - into) * (1 - into);
      const mood = Math.min(1, Math.max(0, (k - 1.5) / 3));
      const stopX = rw + 4 * s;
      const honk = k > 1.8 && Math.sin(k * 7) > 0.2 ? 1 : 0;
      const opts = (i) => ({ mood, honk: (i + Math.floor(k * 3)) % 2 ? honk : 0, furieux: mood > 0.8, stopped: into >= 1, brake: into >= 1 });
      const arms = [
        [cx - stopX - (1 - e) * W * 0.6, cy + L, 0],
        [cx + stopX + (1 - e) * W * 0.6, cy - L, Math.PI],
        [cx - L, cy - stopX - (1 - e) * H * 0.6, Math.PI / 2],
        [cx + L, cy + stopX + (1 - e) * H * 0.6, -Math.PI / 2],
      ];
      arms.forEach(([x, y, a], i) => {
        /* la file qui s'allonge derrière */
        for (let q = 1; q <= Math.min(3, Math.floor(k / 1.2)); q++) {
          const back = q * 72 * s;
          car(x - Math.cos(a) * back, y - Math.sin(a) * back, a, i + q * 4, opts(i + q));
        }
        car(x, y, a, i, opts(i));
        if (mood > 0.6) drawSteam(c, x, y, t + i, mood);
        if (into >= 1) {
          c.save(); c.translate(x, y - 20 * s);
          drawCarBubble(c, 0, 0, (i + Math.floor(k * 2)) % 2 ? 'tuutRouge' : 'colere', 1, t, 1 / (2.4 * s));
          c.restore();
        }
      });
      if (honk && sfx) sfx.klaxon(Math.floor(k * 3) % 7, mood > 0.7);
      caption(c, W, H, 'Le lendemain matin, plus personne ne savait qui devait passer… Quelle pagaille !', Math.min(1, k * 2));
    } else {
      /* 4. Zaza arrive avec son sifflet */
      const k = t - 14.5;
      for (const [i, [x, y, a]] of [[cx - rw - 40 * s, cy + L, 0], [cx + rw + 40 * s, cy - L, Math.PI], [cx - L, cy - rw - 40 * s, Math.PI / 2], [cx + L, cy + rw + 40 * s, -Math.PI / 2]].entries()) {
        car(x, y, a, i, { mood: Math.max(0, 0.9 - k * 0.25), stopped: true });
      }
      c.fillStyle = 'rgba(255,252,243,0.35)';
      c.fillRect(0, 0, W, H);
      const enter = Math.min(1, k / 1.2);
      const zx = W * 0.5 + (1 - enter * (2 - enter)) * W * 0.7;
      const zs = Math.min(W, H) / 330;
      const whistle = k > 1.2 && k < 3 ? 1 : 0;
      drawZaza(c, zx, H * 0.42, zs, t, { whistle, wave: k * 5, holding: k > 1 ? 'stop' : null });
      if (whistle && sfx) once('sifflet', () => sfx.sifflet());
      caption(c, W, H, k < 4.2 ? 'Heureusement, Zaza, l’agente de la circulation, est là… Tuuut !'
        : 'Aide-la à remettre les bons panneaux aux bons endroits, pour que tout le monde arrive à l’heure !', Math.min(1, (k % 4.2) * 2));
    }
    if (t >= DUR) { stopped = true; if (onEnd) onEnd(); return; }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return { stop() { stopped = true; cancelAnimationFrame(raf); } };
}
