// ============================================================================
// L'animation de départ (environ 16 s, on peut la passer) :
//   0 → 4 s     la Terre il y a 4 milliards d'années : volcans, éclairs, océan
//   4 → 8 s     on plonge : des molécules flottent dans la soupe primitive
//   8 → 12 s    elles s'assemblent, une enveloppe se forme… une cellule naît : toi !
//   12 → 16 s   bien plus tard, une cellule géante s'approche : mange ou sois mangé !
// ============================================================================

const TAU = Math.PI * 2;
const DURATION = 16;

const CAPTIONS = [
  [0.3, 4, "Il y a 4 milliards d'années, la Terre est brûlante : des volcans, des éclairs… et un immense océan."],
  [4.4, 8, "Dans l'eau chaude, des molécules se mélangent : c'est la soupe primitive."],
  [8.2, 12, "Un jour, elles s'assemblent… et une toute petite cellule apparaît. C'est toi !"],
  [12.2, 16, "Plus d'un milliard d'années plus tard, les cellules se mangent entre elles. Mange… et ne te fais pas manger !"],
];

const ATOMS = ['#F9E27D', '#FF9DBB', '#9EE7FF', '#C6F68D'];

/**
 * drawCell(ctx, x, y, r, t) : dessine le joueur sous forme de cellule
 * drawCreature(ctx, id, x, y, r, angle, t) : dessine une créature du niveau
 */
export function createIntro({ sfx, drawCell, drawCreature }) {
  let t = 0;
  const cues = new Set();
  const bolts = [];
  const molecules = Array.from({ length: 34 }, () => ({
    x: Math.random(), y: Math.random(), a: Math.random() * TAU, s: 0.7 + Math.random() * 0.6,
    col: ATOMS[Math.floor(Math.random() * ATOMS.length)], col2: ATOMS[Math.floor(Math.random() * ATOMS.length)],
  }));
  const bubbles = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 4, v: 0.03 + Math.random() * 0.06 }));

  function cue(name, at, fn) {
    if (t >= at && !cues.has(name)) { cues.add(name); fn(); }
  }

  const intro = {
    done: false,

    update(dt) {
      t += dt;
      // quelques éclairs au début
      if (t < 4 && Math.random() < dt * 1.3) bolts.push({ x: 0.15 + Math.random() * 0.7, life: 0.25, seed: Math.random() * 1000 });
      for (const b of bolts) b.life -= dt;
      while (bolts.length && bolts[0].life <= 0) bolts.shift();
      cue('thunder', 0.6, () => sfx.dash());
      cue('dive', 4.1, () => sfx.dash());
      cue('birth', 10.2, () => sfx.evolve());
      cue('danger', 13.6, () => sfx.alert());
      cue('heart1', 14.3, () => sfx.heart(true));
      cue('heart2', 14.9, () => sfx.heart(true));
      if (t >= DURATION) intro.done = true;
    },

    draw(ctx, w, h) {
      if (t < 4.2) drawEarth(ctx, w, h);
      else drawSea(ctx, w, h);
      // la plongée : la surface de l'eau remonte d'un coup
      if (t > 3.6 && t < 4.6) {
        const k = (t - 3.6) / 1;
        ctx.fillStyle = `rgba(30, 140, 150, ${Math.sin(k * Math.PI)})`;
        ctx.fillRect(0, 0, w, h);
      }
      drawCaption(ctx, w, h);
      // fondu au noir à la fin
      if (t > DURATION - 0.6) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(t - (DURATION - 0.6)) / 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };

  function drawEarth(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#2B0F2E');
    sky.addColorStop(0.6, '#8C2B2B');
    sky.addColorStop(1, '#E2733A');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // éclairs
    for (const b of bolts) {
      ctx.fillStyle = `rgba(255, 255, 255, ${b.life * 0.6})`;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(255, 255, 220, ${b.life * 4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      let x = b.x * w, y = 0;
      ctx.moveTo(x, y);
      let s = b.seed;
      while (y < h * 0.6) {
        s = (s * 9301 + 49297) % 233280;
        x += (s / 233280 - 0.5) * 60;
        y += 25 + (s % 20);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // volcans qui crachent de la lave
    const volcanoes = [[0.12, 0.62, 0.22], [0.38, 0.62, 0.3], [0.78, 0.62, 0.26]];
    for (const [vx, vy, vw] of volcanoes) {
      const x = vx * w, y = vy * h, s = vw * w;
      // fumée
      for (let i = 0; i < 6; i++) {
        const k = ((t * 0.25 + i / 6) % 1);
        ctx.fillStyle = `rgba(70, 50, 60, ${0.5 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(x + Math.sin(i + t) * 20 + k * 40, y - s * 0.55 - k * h * 0.35, 20 + k * 60, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#3A2228';
      ctx.beginPath();
      ctx.moveTo(x - s / 2, y);
      ctx.lineTo(x - s * 0.08, y - s * 0.55);
      ctx.lineTo(x + s * 0.08, y - s * 0.55);
      ctx.lineTo(x + s / 2, y);
      ctx.closePath();
      ctx.fill();
      // lave qui coule
      ctx.strokeStyle = '#FF8A3C';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.05, y - s * 0.55);
      ctx.quadraticCurveTo(x - s * 0.12, y - s * 0.3, x - s * 0.2, y - s * 0.08);
      ctx.moveTo(x + s * 0.05, y - s * 0.55);
      ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.32, x + s * 0.16, y - s * 0.12);
      ctx.stroke();
      // projections
      for (let i = 0; i < 5; i++) {
        const k = ((t * 0.9 + i / 5 + vx) % 1);
        const a = -Math.PI / 2 + (i - 2) * 0.35;
        ctx.fillStyle = `rgba(255, ${150 + i * 15}, 60, ${1 - k})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * k * s * 0.5, y - s * 0.55 + Math.sin(a) * k * s * 0.6 + k * k * s * 0.4, 5, 0, TAU);
        ctx.fill();
      }
    }
    // l'océan primitif
    const sea = ctx.createLinearGradient(0, h * 0.62, 0, h);
    sea.addColorStop(0, '#2E7F7A');
    sea.addColorStop(1, '#0F3F45');
    ctx.fillStyle = sea;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.strokeStyle = 'rgba(255, 180, 120, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const y = h * 0.66 + i * h * 0.045;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        const yy = y + Math.sin(x * 0.02 + t * 2 + i) * 3;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function drawSea(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3AA89A');
    g.addColorStop(1, '#0E4A55');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // rayons de lumière
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = w * (0.1 + i * 0.2) + Math.sin(t * 0.5 + i) * 25;
      const gg = ctx.createLinearGradient(x, 0, x + 80, h);
      gg.addColorStop(0, 'rgba(255, 255, 220, 0.14)');
      gg.addColorStop(1, 'rgba(255, 255, 220, 0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(x - 25, 0);
      ctx.lineTo(x + 25, 0);
      ctx.lineTo(x + 140, h);
      ctx.lineTo(x + 40, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const b of bubbles) {
      const y = ((b.y - t * b.v) % 1 + 1) % 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(b.x * w + Math.sin(t * 2 + b.x * 10) * 6, y * h, b.r, 0, TAU);
      ctx.stroke();
    }
    const m = Math.min(w, h);
    const cx = w / 2, cy = h * 0.58;
    // molécules : elles flottent, puis se rassemblent au centre
    const gather = clamp01((t - 8.2) / 2);
    for (const mo of molecules) {
      const fx = mo.x * w + Math.sin(t * 0.7 + mo.a) * 30;
      const fy = mo.y * h + Math.cos(t * 0.5 + mo.a) * 20;
      const tx = cx + Math.cos(mo.a) * m * 0.04, ty = cy + Math.sin(mo.a) * m * 0.04;
      const k = ease(gather);
      const x = fx + (tx - fx) * k, y = fy + (ty - fy) * k;
      if (t > 10.3) continue;
      const r = m * 0.012 * mo.s;
      const a = mo.a + t;
      ctx.fillStyle = mo.col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = mo.col2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, r * 0.7, 0, TAU);
      ctx.fill();
    }
    // l'enveloppe se dessine autour, puis la cellule naît
    if (t > 9.4 && t < 10.4) {
      const k = clamp01((t - 9.4) / 0.8);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, m * 0.08, -Math.PI / 2, -Math.PI / 2 + TAU * k);
      ctx.stroke();
    }
    if (t >= 10.2) {
      const pop = Math.min(1, (t - 10.2) / 0.35);
      const bounce = 1 + Math.sin(pop * Math.PI) * 0.25;
      let r = m * 0.08 * pop * bounce;
      let x = cx, y = cy;
      // à la fin, la cellule a peur et tremble
      if (t > 13.6) { x += Math.sin(t * 60) * 2; r *= 0.95; }
      if (t < 11) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, m * 0.25);
        glow.addColorStop(0, `rgba(255, 250, 200, ${0.6 * (1 - (t - 10.2) / 0.8)})`);
        glow.addColorStop(1, 'rgba(255, 250, 200, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }
      drawCell(ctx, x, y, r, t);
    }
    // une cellule géante surgit de l'ombre…
    if (t > 12.6) {
      const k = clamp01((t - 12.6) / 3);
      const r = m * 0.3;
      const x = w + r * 1.2 - k * (w * 0.5 + r * 0.5), y = cy - m * 0.02;
      drawCreature(ctx, 'geante', x, y, r, Math.PI, t);
    }
  }

  function drawCaption(ctx, w, h) {
    const cap = CAPTIONS.find(([a, b]) => t >= a && t < b);
    if (!cap) return;
    const [a, b, text] = cap;
    const alpha = Math.min(1, (t - a) / 0.4, (b - t) / 0.3);
    const fs = Math.max(15, Math.min(24, w / 38));
    ctx.font = `700 ${fs}px 'Baloo 2', sans-serif`;
    const maxW = Math.min(w - 40, 760);
    const lines = wrap(ctx, text, maxW - 40);
    const lh = fs * 1.3;
    const bw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44);
    const bh = lines.length * lh + 24;
    const x = (w - bw) / 2, y = Math.max(16, h * 0.06);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255, 252, 243, 0.94)';
    roundRect(ctx, x, y, bw, bh, 16);
    ctx.fill();
    ctx.fillStyle = '#2E2A4D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, w / 2, y + 12 + i * lh));
    ctx.globalAlpha = 1;
  }

  return intro;
}

function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (k) => k * k * (3 - 2 * k);
