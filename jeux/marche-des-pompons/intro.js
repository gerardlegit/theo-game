// ============================================================================
// Les deux petits films du jeu, dessinés sur un canvas :
//   - le début : le village des Pompons, le grand coup de vent qui les
//     emporte, leur chute sur les quatre mondes, et Plume qui arrive ;
//   - la fin : les Pompons rentrent au village et font la fête.
// Chaque film a ses sous-titres. script.js le lance avec playStory().
// ============================================================================

import { drawPompon, drawHome, drawPlume, drawBackground, POMPON_COLORS, INK } from './art.js';

const TAU = Math.PI * 2;

/* un petit Pompon de décor (même dessin que dans le jeu) */
function pom(c, id, x, y, size, t, { state = 'marche', dir = 1, anim = 0, fall = 0, parapluie = false, rot = 0 } = {}) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(size, size);
  drawPompon(c, { id, x: 0, y: 0, dir, state, work: 0, anim, fall, bricks: 0, grimpe: false, parapluie }, t);
  c.restore();
}

function caption(c, W, H, text, k) {
  if (!text || k <= 0) return;
  const fs = Math.max(16, Math.min(30, W / 36));
  c.save();
  c.globalAlpha = Math.min(1, k);
  c.font = `700 ${fs}px "Baloo 2", sans-serif`;
  /* « ! ? : » restent collés au mot d'avant (espace insécable) */
  const words = text.replace(/ ([!?:;])/g, '\u00a0$1').split(' ');
  const lines = [];
  let cur = '';
  const maxW = Math.min(W * 0.86, 900);
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
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

/* le village : une colline et trois maisons-champignons */
function village(c, W, H, t, s, gx) {
  c.fillStyle = '#6FCB7C';
  c.beginPath();
  c.moveTo(0, H);
  c.lineTo(0, H * 0.72);
  c.quadraticCurveTo(W * 0.5, H * 0.52, W, H * 0.72);
  c.lineTo(W, H);
  c.closePath();
  c.fill();
  c.fillStyle = '#58C46B';
  c.fillRect(0, H * 0.86, W, H);
  const homes = [[0.32, 0.66, 1.25], [0.5, 0.6, 1.5], [0.68, 0.66, 1.25]];
  for (const [hx, hy, hs] of homes) {
    c.save();
    c.translate(W * hx + (gx || 0), H * hy);
    c.scale(s * hs, s * hs);
    drawHome(c, { x: 0, y: 0 }, t, 0);
    c.restore();
  }
}

const SCENES = {
  intro: {
    duration: 18,
    captions: [
      [0, 4.2, 'Au village des Pompons, tout le monde est rond, tout doux… et un peu tête en l’air.'],
      [4.2, 8.4, 'Un jour, un grand coup de vent les emporte très, très loin de chez eux !'],
      [8.4, 12.6, 'Ils retombent dans la prairie, la forêt, la grotte, la montagne… et un Pompon, ça marche toujours tout droit !'],
      [12.6, 18, 'Hou hou ! Moi, c’est Plume. Donne-leur des métiers pour les ramener à la maison !'],
    ],
    sounds: [[4.2, 'wind'], [12.8, 'hoot']],
    draw(c, W, H, t) {
      const s = Math.min(W, H) / 260;
      if (t < 8.4) {
        drawBackground(c, { fond: 'prairie', ciel: ['#7CCBF5', '#D6F1FF'] }, t * 20, s / 2.2, W, H, t);
        const wind = Math.max(0, Math.min(1, (t - 4.2) / 1.5));
        village(c, W, H, t, s, 0);
        /* les Pompons qui jouent, puis qui s'envolent */
        for (let i = 0; i < 12; i++) {
          const bx = W * (0.15 + (i / 11) * 0.7);
          const by = H * 0.78 + Math.sin(i * 2.1) * H * 0.03;
          const hop = Math.abs(Math.sin(t * 3 + i)) * 8 * s;
          const fly = Math.max(0, t - 4.6 - i * 0.12);
          const x = bx + fly * fly * W * 0.08;
          const y = by - hop - fly * fly * H * 0.09;
          pom(c, i, x, y, s * 1.2, t, { state: fly > 0 ? 'tombe' : 'marche', anim: t * 30 + i * 5, rot: fly * 3, dir: i % 2 ? 1 : -1 });
        }
        if (wind > 0) {
          c.save();
          c.strokeStyle = 'rgba(255,255,255,0.8)';
          c.lineCap = 'round';
          for (let i = 0; i < 14; i++) {
            const y = H * (0.15 + (i / 14) * 0.7);
            const x = ((t * 900 + i * 197) % (W + 400)) - 200;
            c.lineWidth = 3 + (i % 3);
            c.globalAlpha = wind * 0.7;
            c.beginPath();
            c.moveTo(x, y);
            c.bezierCurveTo(x + 60, y - 18, x + 120, y + 18, x + 190, y);
            c.stroke();
          }
          c.restore();
        }
      } else {
        /* vu du ciel : les quatre mondes, et les Pompons qui tombent dessus */
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#6EC2F2'); g.addColorStop(1, '#E4F5FF');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        const worlds = [['#7FD89A', '#58C46B'], ['#3E9B55', '#2F7F45'], ['#5B4C8A', '#3A2F63'], ['#E8F0FA', '#A9BCD6']];
        worlds.forEach(([a, b], i) => {
          const x0 = (i / 4) * W;
          c.fillStyle = b;
          c.beginPath();
          c.moveTo(x0 - 10, H);
          c.quadraticCurveTo(x0 + W / 8, H * (0.62 + (i % 2) * 0.05), x0 + W / 4 + 10, H);
          c.fill();
          c.fillStyle = a;
          if (i === 3) {
            c.beginPath(); c.moveTo(x0 + W * 0.02, H); c.lineTo(x0 + W / 8, H * 0.5); c.lineTo(x0 + W * 0.23, H); c.fill();
            c.fillStyle = '#FFFFFF';
            c.beginPath(); c.moveTo(x0 + W * 0.095, H * 0.6); c.lineTo(x0 + W / 8, H * 0.5); c.lineTo(x0 + W * 0.155, H * 0.6); c.fill();
          } else if (i === 1) {
            for (let k = 0; k < 4; k++) {
              const tx = x0 + W * (0.04 + k * 0.055);
              c.beginPath(); c.moveTo(tx - 22 * s / 2, H * 0.86); c.lineTo(tx, H * 0.7); c.lineTo(tx + 22 * s / 2, H * 0.86); c.fill();
            }
          } else if (i === 2) {
            c.fillStyle = '#1C1738';
            c.beginPath(); c.ellipse(x0 + W / 8, H * 0.92, W * 0.05, H * 0.06, 0, Math.PI, TAU); c.fill();
          }
        });
        /* les nuages qui défilent : on tombe ! */
        for (let i = 0; i < 8; i++) {
          const y = ((i * 0.13 + (t - 8.4) * 0.35) % 1.1) * H * 1.2 - H * 0.1;
          const x = (i * 0.37 % 1) * W;
          c.fillStyle = 'rgba(255,255,255,0.8)';
          c.beginPath(); c.arc(x, H - y, 30 * s / 2, 0, TAU); c.arc(x + 28 * s / 2, H - y + 6, 22 * s / 2, 0, TAU); c.fill();
        }
        const fall = Math.min(1, (t - 8.4) / 3.5);
        for (let i = 0; i < 12; i++) {
          const wi = i % 4;
          const tx = (wi + 0.3 + (i * 0.17) % 0.4) * (W / 4);
          const x = W / 2 + (tx - W / 2) * fall + Math.sin(t * 3 + i) * 10;
          const y = -20 + fall * (H * (0.72 + (i % 3) * 0.05)) - (1 - fall) * i * 12;
          pom(c, i, x, y, s * 1.1, t, { state: fall < 1 ? 'tombe' : 'marche', rot: fall < 1 ? Math.sin(t * 6 + i) : 0, anim: t * 30, dir: 1 });
        }
        if (t > 12.6) {
          const k = Math.min(1, (t - 12.6) / 1.4);
          const px = W * 1.15 - k * W * 0.45;
          const py = H * 0.36 + Math.sin(t * 2.4) * 10;
          drawPlume(c, px, py, s * 0.9, t, { flap: t * (k < 1 ? 14 : 4), talk: k >= 1 });
        }
      }
    },
  },
  ending: {
    duration: 15,
    captions: [
      [0, 5, 'Les voilà enfin de retour au village des Pompons !'],
      [5, 10, 'Grâce à toi, tous les Pompons sont rentrés à la maison. C’est la fête !'],
      [10, 15, 'Hou hou ! Merci, grand guide. Tu as su réfléchir pour eux.'],
    ],
    sounds: [[0.2, 'saved'], [5, 'fanfare'], [6, 'firework'], [7.2, 'firework'], [8.5, 'firework'], [10.2, 'hoot']],
    draw(c, W, H, t) {
      const s = Math.min(W, H) / 260;
      const night = Math.min(1, Math.max(0, (t - 4.5) / 2));
      drawBackground(c, { fond: 'prairie', ciel: night > 0.5 ? ['#2B2C6B', '#8A6FB5'] : ['#7CCBF5', '#FFE2B8'] }, 0, s / 2.2, W, H, t);
      village(c, W, H, t, s, 0);
      /* les Pompons arrivent en file, puis sautent de joie */
      for (let i = 0; i < 14; i++) {
        const arrive = Math.min(1, Math.max(0, (t - i * 0.25) / 4));
        const homeX = W * (0.12 + (i / 13) * 0.76);
        const x = -40 * s + arrive * (homeX + 40 * s);
        const party = t > 5;
        const hop = party ? Math.abs(Math.sin(t * 5 + i)) * 14 * s : 0;
        const y = H * 0.8 + Math.sin(i * 1.7) * H * 0.03 - hop;
        pom(c, i, x, y, s * 1.25, t, { state: arrive < 1 ? 'marche' : (party ? 'sauve' : 'marche'), anim: t * 30 + i * 4, dir: 1 });
      }
      /* les feux d'artifice */
      if (t > 5.8) {
        for (let f = 0; f < 5; f++) {
          const start = 5.8 + f * 1.1;
          const k = (t - start) % 5.5;
          if (k < 0 || k > 1.8) continue;
          const fx = W * (0.2 + ((f * 0.37) % 0.6));
          const fy = H * (0.18 + (f % 3) * 0.08);
          const r = k * 90 * s / 2.2;
          const col = POMPON_COLORS[f % POMPON_COLORS.length];
          c.save();
          c.globalAlpha = Math.max(0, 1 - k / 1.8);
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * TAU;
            c.fillStyle = col;
            c.beginPath(); c.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r + k * k * 10, 3 * s / 2, 0, TAU); c.fill();
          }
          c.restore();
        }
      }
      if (t > 9.6) {
        const k = Math.min(1, (t - 9.6) / 1.4);
        drawPlume(c, W * 1.15 - k * W * 0.4, H * 0.34 + Math.sin(t * 2.4) * 10, s * 0.9, t, { flap: t * (k < 1 ? 14 : 4), talk: k >= 1 });
      }
    },
  },
};

/* lance un film ; renvoie { stop() }. onEnd est appelé à la fin (ou au « Passer ») */
export function playStory(name, canvas, { onEnd, sfx }) {
  const scene = SCENES[name];
  const c = canvas.getContext('2d');
  let raf = 0;
  let t0 = 0;
  let done = false;
  const played = new Set();
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = canvas.clientWidth || window.innerWidth;
    const H = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [W, H];
  }
  function frame(now) {
    if (done) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    const [W, H] = fit();
    c.clearRect(0, 0, W, H);
    scene.draw(c, W, H, t);
    for (const [a, b, text] of scene.captions) {
      if (t >= a && t < b) caption(c, W, H, text, Math.min((t - a) * 3, (b - t) * 3));
    }
    for (const [at, snd] of scene.sounds) {
      if (t >= at && !played.has(at)) { played.add(at); if (sfx[snd]) sfx[snd](); }
    }
    if (t >= scene.duration) { stop(); if (onEnd) onEnd(); return; }
    raf = requestAnimationFrame(frame);
  }
  function stop() { done = true; cancelAnimationFrame(raf); }
  raf = requestAnimationFrame(frame);
  return { stop };
}
