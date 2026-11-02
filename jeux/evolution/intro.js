// ============================================================================
// Les animations de départ (on peut les passer). Niveau 1, environ 16 s :
//   0 → 4 s     la Terre il y a 4 milliards d'années : volcans, éclairs, océan
//   4 → 8 s     on plonge : des molécules flottent dans la soupe primitive
//   8 → 12 s    elles s'assemblent, une enveloppe se forme… une cellule naît : toi !
//   12 → 16 s   bien plus tard, une cellule géante s'approche : mange ou sois mangé !
// Puis celles du niveau 2 : sur la terre (createLandIntro) ou dans la mer
// (createSeaIntro), celle du niveau 3, après la météorite (createMammalIntro),
// celle du niveau 4, la meute de loups sous la lune (createWolfIntro),
// et celle des requins, dans la mer noire après la météorite (createSharkIntro).
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

/* ============================================================================
   L'animation du niveau 2 (environ 14 s) : vue du ciel, un rivage.
   0 → 4,5 s   un poisson aux nageoires musclées nage vers la rive
   4,5 → 9 s   il se hisse hors de l'eau et rampe sur la terre
   9 → 14 s    le sol tremble, une ombre immense passe… seuls les malins survivront
   drawHero(ctx, x, y, r, angle, t, walk) dessine le joueur en tétrapode.
   ============================================================================ */
const LAND_DURATION = 14;
const LAND_CAPTIONS = [
  [0.3, 4.5, "Il y a 375 millions d'années, la terre ferme est encore presque vide d'animaux…"],
  [4.7, 9, "Un poisson aux nageoires musclées se hisse hors de l'eau. Tes descendants vont conquérir la terre !"],
  [9.2, 14, "Mais sur la terre, tout est dangereux. Seuls les plus malins survivront !"],
];

export function createLandIntro({ sfx, drawHero }) {
  let t = 0;
  const cues = new Set();
  const prints = [];
  const plants = Array.from({ length: 26 }, () => ({ x: 0.5 + Math.random() * 0.55, y: Math.random(), r: 0.025 + Math.random() * 0.04, a: Math.random() * TAU }));
  const bugs = Array.from({ length: 6 }, () => ({ x: 0.55 + Math.random() * 0.4, y: Math.random(), a: Math.random() * TAU }));

  function cue(name, at, fn) {
    if (t >= at && !cues.has(name)) { cues.add(name); fn(); }
  }

  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('splash', 3.6, () => sfx.splash());
      cue('s1', 9.6, () => sfx.stomp(0.4));
      cue('s2', 10.6, () => sfx.stomp(0.7));
      cue('s3', 11.6, () => sfx.stomp(1));
      cue('roar', 12.3, () => sfx.roar(1));
      if (t >= LAND_DURATION) intro.done = true;
    },
    draw(ctx, w, h) {
      const m = Math.min(w, h);
      const shake = t > 9.6 && t < 12.6 ? Math.max(0, Math.sin((t - 9.6) * Math.PI)) * 6 * Math.min(1, (t - 9.4) / 2) : 0;
      ctx.save();
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      // l'eau à gauche, une plage, puis la terre
      const shore = w * 0.42;
      const g = ctx.createLinearGradient(0, 0, shore, 0);
      g.addColorStop(0, '#1F6F8B');
      g.addColorStop(1, '#4FB0C0');
      ctx.fillStyle = g;
      ctx.fillRect(-10, -10, shore + 40, h + 20);
      ctx.fillStyle = '#D9C38F';
      ctx.beginPath();
      ctx.moveTo(shore - 20, -10);
      for (let y = 0; y <= h + 20; y += 20) ctx.lineTo(shore + Math.sin(y * 0.03) * 14, y);
      ctx.lineTo(shore + 70, h + 10);
      ctx.lineTo(shore + 70, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7C8A55';
      ctx.fillRect(shore + 60, -10, w, h + 20);
      // vagues qui viennent mourir sur la plage
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.25 + i / 4) % 1;
        const x = shore - 120 + k * 110;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        for (let y = 0; y <= h; y += 16) ctx.lineTo(x + Math.sin(y * 0.04 + i) * 8, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // fougères et prêles sur la terre
      for (const p of plants) {
        const x = p.x * w, y = p.y * h, r = p.r * m;
        if (x < shore + 80) continue;
        ctx.strokeStyle = '#3E8E41';
        ctx.lineWidth = Math.max(2, r * 0.12);
        ctx.lineCap = 'round';
        for (let k = 0; k < 7; k++) {
          const a = p.a + (k / 7) * TAU + Math.sin(t + k) * 0.05;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          ctx.stroke();
        }
      }
      for (const b of bugs) {
        b.a += 0.03;
        const x = b.x * w + Math.cos(b.a * 3) * 20, y = b.y * h + Math.sin(b.a * 2) * 20;
        ctx.fillStyle = '#4A3A20';
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 3, b.a, 0, TAU);
        ctx.fill();
      }
      // le héros : il nage, puis il rampe en laissant des traces
      const r = m * 0.05;
      const k1 = Math.min(1, t / 4.5), k2 = clamp01((t - 4.5) / 4.5);
      let x = w * 0.08 + (shore - w * 0.08 - r) * ease(k1) + (w * 0.2) * ease(k2);
      const y = h * 0.58 + Math.sin(t * 1.5) * h * 0.02;
      if (t > 9.6) x += Math.sin(t * 50) * 2;
      if (t > 4.5 && t < 9 && Math.floor(t * 4) !== Math.floor((t - 0.016) * 4)) prints.push({ x: x - r, y: y + (prints.length % 2 ? r * 0.4 : -r * 0.4) });
      ctx.fillStyle = 'rgba(80, 60, 30, 0.35)';
      for (const p of prints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.12, 0, TAU);
        ctx.fill();
      }
      drawHero(ctx, x, y, r, -0.05, t, t > 4.5 && t < 9 ? t * 3 : t * 1.5);
      // une ombre immense passe…
      if (t > 10.2) {
        const k = clamp01((t - 10.2) / 3.5);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * Math.sin(k * Math.PI)})`;
        ctx.beginPath();
        ctx.ellipse(w * (1.3 - k * 1.4), h * 0.45, m * 0.55, m * 0.3, -0.3, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      // le ciel s'assombrit
      if (t > 9) {
        const v = ctx.createRadialGradient(w / 2, h / 2, m * 0.2, w / 2, h / 2, Math.hypot(w, h) * 0.6);
        v.addColorStop(0, 'rgba(0, 0, 0, 0)');
        v.addColorStop(1, `rgba(0, 0, 0, ${0.6 * clamp01((t - 9) / 2)})`);
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, w, h);
      }
      drawLandCaption(ctx, w, h, t);
      if (t > LAND_DURATION - 0.6) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(t - (LAND_DURATION - 0.6)) / 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
  return intro;
}

function drawLandCaption(ctx, w, h, t) {
  const cap = LAND_CAPTIONS.find(([a, b]) => t >= a && t < b);
  if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}

/** Une bulle de texte en haut de l'écran (aussi utilisée par la fin du niveau 2) */
export function drawCaptionBox(ctx, w, h, text, alpha) {
  const fs = Math.max(15, Math.min(24, w / 38));
  ctx.font = `700 ${fs}px 'Baloo 2', sans-serif`;
  const maxW = Math.min(w - 40, 760);
  const lines = wrap(ctx, text, maxW - 40);
  const lh = fs * 1.3;
  const bw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44);
  const bh = lines.length * lh + 24;
  const x = (w - bw) / 2, y = Math.max(16, h * 0.06);
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

/* ============================================================================
   L'animation du niveau 2, version mer (environ 14 s) : vue du ciel, une plage.
   0 → 4,5 s   un petit reptile descend la plage vers la mer
   4,5 → 9 s   il plonge et s'éloigne du rivage : la mer devient profonde
   9 → 14 s    il remonte respirer… une ombre immense passe sous lui
   drawHero(ctx, x, y, r, angle, t, swim) dessine le joueur en nothosaure.
   ============================================================================ */
const SEA_DURATION = 14;
const SEA_CAPTIONS = [
  [0.3, 4.5, "Pendant que des reptiles conquièrent la terre, d'autres font le chemin inverse…"],
  [4.7, 9, "Ils retournent dans la mer ! Leurs pattes vont devenir des nageoires."],
  [9.2, 14, "Mais un reptile doit remonter respirer… et la mer est pleine de monstres !"],
];

export function createSeaIntro({ sfx, drawHero }) {
  let t = 0;
  const cues = new Set();
  const prints = [];
  const fish = Array.from({ length: 14 }, () => ({ x: 0.5 + Math.random() * 0.5, y: Math.random(), a: Math.random() * TAU, s: 0.5 + Math.random() }));

  function cue(name, at, fn) {
    if (t >= at && !cues.has(name)) { cues.add(name); fn(); }
  }

  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('splash', 4.5, () => sfx.splash());
      cue('breath', 9.2, () => sfx.pickup());
      cue('h1', 10.4, () => sfx.heart(false));
      cue('h2', 11.1, () => sfx.heart(true));
      cue('h3', 11.8, () => sfx.heart(true));
      cue('alert', 12.2, () => sfx.alert());
      if (t >= SEA_DURATION) intro.done = true;
    },
    draw(ctx, w, h) {
      const m = Math.min(w, h);
      // la terre à gauche, une plage, puis la mer de plus en plus profonde
      const shore = w * 0.3;
      ctx.fillStyle = '#7C8A55';
      ctx.fillRect(-10, -10, shore, h + 20);
      ctx.fillStyle = '#D9C38F';
      ctx.fillRect(shore - 20, -10, 90, h + 20);
      const g = ctx.createLinearGradient(shore + 40, 0, w, 0);
      g.addColorStop(0, '#5FC0CF');
      g.addColorStop(0.35, '#1E8C9E');
      g.addColorStop(1, '#073A52');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w + 10, -10);
      for (let y = -10; y <= h + 20; y += 20) ctx.lineTo(shore + 40 + Math.sin(y * 0.03 + t) * 10, y);
      ctx.lineTo(w + 10, h + 20);
      ctx.closePath();
      ctx.fill();
      // l'écume qui vient lécher la plage
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.25 + i / 4) % 1;
        const x = shore + 140 - k * 100;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        for (let y = 0; y <= h; y += 16) ctx.lineTo(x + Math.sin(y * 0.04 + i) * 8, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // des bancs de petits poissons, au large
      ctx.fillStyle = 'rgba(200, 235, 245, 0.7)';
      for (const f of fish) {
        f.a += 0.01 * f.s;
        const x = f.x * w + Math.cos(f.a) * 30, y = f.y * h + Math.sin(f.a * 1.3) * 20;
        if (x < shore + 120) continue;
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 3, f.a + Math.PI / 2, 0, TAU);
        ctx.fill();
      }
      // une tache de lumière : la surface, où l'on respire
      const lx = w * 0.72, ly = h * 0.42, lr = m * 0.16;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      lg.addColorStop(0, 'rgba(255, 255, 235, 0.5)');
      lg.addColorStop(1, 'rgba(190, 245, 255, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, TAU);
      ctx.fill();
      // le héros : il marche sur la plage (en laissant des traces), plonge, puis nage vers la lumière
      const r = m * 0.05;
      const k1 = clamp01(t / 4.5), k2 = clamp01((t - 4.5) / 4.5), k3 = clamp01((t - 9) / 1.5);
      let x = w * 0.05 + (shore + 60 - w * 0.05) * ease(k1) + (lx - shore - 60 - r) * ease(k2);
      let y = h * 0.62 - (h * 0.62 - ly) * ease(k2) * 0.8 - (h * 0.62 - ly) * 0.2 * ease(k3);
      x += r * ease(k3);
      if (t > 10.4) x += Math.sin(t * 40) * 1.5;
      if (t < 4.5 && Math.floor(t * 4) !== Math.floor((t - 0.016) * 4)) prints.push({ x: x - r, y: y + (prints.length % 2 ? r * 0.4 : -r * 0.4) });
      ctx.fillStyle = 'rgba(80, 60, 30, 0.35)';
      for (const p of prints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.12, 0, TAU);
        ctx.fill();
      }
      // des bulles en plongeant
      if (t > 4.5 && t < 6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 6; i++) {
          const k = ((t - 4.5) * 1.3 + i / 6) % 1;
          ctx.beginPath();
          ctx.arc(x - r * (1 + k * 2) + Math.sin(i * 3) * r, y + Math.cos(i * 2) * r * 0.8, r * 0.12 * (1 - k), 0, TAU);
          ctx.fill();
        }
      }
      const ang = t < 4.5 ? 0 : Math.atan2(-(h * 0.62 - ly) * 0.8, lx - shore) * (1 - k3);
      drawHero(ctx, x, y, r, ang, t, t < 4.5 ? t * 3 : t * 1.5);
      // une ombre immense passe sous lui…
      if (t > 10.2) {
        const k = clamp01((t - 10.2) / 3.5);
        // la silhouette d'un pliosaure géant : une tête énorme, quatre nageoires
        ctx.fillStyle = `rgba(0, 10, 25, ${0.55 * Math.sin(k * Math.PI)})`;
        ctx.beginPath();
        const sx = w * (1.35 - k * 1.1), sy = h * 0.6;
        for (const [dx, dy, rx, ry, a] of [
          [0, 0, 0.36, 0.13, 0], [-0.08, 0, 0.3, 0.16, 0], [0.5, 0.01, 0.16, 0.04, 0],
          [0.02, -0.2, 0.17, 0.05, -1.0], [0.02, 0.2, 0.17, 0.05, 1.0],
          [0.3, -0.17, 0.14, 0.045, -1.1], [0.3, 0.17, 0.14, 0.045, 1.1],
        ]) {
          ctx.moveTo(sx + (dx + rx * Math.cos(a)) * m, sy + (dy + rx * Math.sin(a)) * m);
          ctx.ellipse(sx + dx * m, sy + dy * m, rx * m, ry * m, a, 0, TAU);
        }
        ctx.fill();
      }
      // l'eau devient sombre
      if (t > 9) {
        const v = ctx.createRadialGradient(w / 2, h / 2, m * 0.2, w / 2, h / 2, Math.hypot(w, h) * 0.6);
        v.addColorStop(0, 'rgba(0, 0, 0, 0)');
        v.addColorStop(1, `rgba(0, 5, 20, ${0.65 * clamp01((t - 9) / 2)})`);
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, w, h);
      }
      const cap = SEA_CAPTIONS.find(([a, b]) => t >= a && t < b);
      if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
      if (t > SEA_DURATION - 0.6) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(t - (SEA_DURATION - 0.6)) / 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
  return intro;
}

/* ============================================================================
   L'animation du niveau 3 (environ 14 s) : vue du ciel, juste après la météorite.
   0 → 4,5 s   tout est gris de cendres : les dinosaures ont disparu
   4,5 → 9 s   la lumière revient, les fougères repoussent… une petite boule de
               poils sort de son terrier
   9 → 14 s    elle part explorer ; une grande ombre d'oiseau passe au-dessus
   drawHero(ctx, x, y, r, angle, t, walk, mood) dessine le joueur en petit mammifère.
   ============================================================================ */
const MAMMAL_DURATION = 14;
const MAMMAL_CAPTIONS = [
  [0.3, 4.5, "Après la météorite, le ciel est noir et il fait froid. Les grands dinosaures ont tous disparu…"],
  [4.7, 9, "Mais au fond d'un terrier, une petite boule de poils a survécu : c'est toi !"],
  [9.2, 14, "Sans les dinosaures, la Terre est à prendre… mais de nouveaux chasseurs arrivent déjà !"],
];

/** Une couleur entre deux autres (#rrggbb) */
function mixCol(a, b, k) {
  const p = (s, i) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function createMammalIntro({ sfx, drawHero }) {
  let t = 0;
  const cues = new Set();
  const ash = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2, v: 0.02 + Math.random() * 0.04 }));
  const ferns = Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), r: 0.025 + Math.random() * 0.035, a: Math.random() * TAU, at: 4.6 + Math.random() * 4 }));
  const logs = Array.from({ length: 6 }, () => ({ x: 0.05 + Math.random() * 0.9, y: 0.1 + Math.random() * 0.85, l: 0.06 + Math.random() * 0.06, a: Math.random() * Math.PI }));

  function cue(name, at, fn) {
    if (t >= at && !cues.has(name)) { cues.add(name); fn(); }
  }

  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('peek', 5.0, () => sfx.pickup());
      cue('out', 6.3, () => sfx.phew());
      cue('h1', 10.4, () => sfx.heart(false));
      cue('h2', 11.1, () => sfx.heart(true));
      cue('h3', 11.8, () => sfx.heart(true));
      cue('alert', 12.2, () => sfx.alert());
      if (t >= MAMMAL_DURATION) intro.done = true;
    },
    draw(ctx, w, h) {
      const m = Math.min(w, h);
      const life = clamp01((t - 4.5) / 3);          // les couleurs reviennent peu à peu
      ctx.fillStyle = mixCol('#5A5650', '#7C7550', life);
      ctx.fillRect(0, 0, w, h);
      // des troncs brûlés, couchés par le souffle de la météorite
      ctx.lineCap = 'round';
      for (const lg of logs) {
        const x = lg.x * w, y = lg.y * h, l = lg.l * m;
        ctx.strokeStyle = '#2E2620';
        ctx.lineWidth = m * 0.022;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(lg.a) * l, y - Math.sin(lg.a) * l);
        ctx.lineTo(x + Math.cos(lg.a) * l, y + Math.sin(lg.a) * l);
        ctx.stroke();
      }
      // le squelette d'un grand dinosaure
      const sx = w * 0.72, sy = h * 0.28, s = m * 0.2;
      ctx.strokeStyle = 'rgba(235, 228, 210, 0.85)';
      ctx.lineWidth = Math.max(2, s * 0.04);
      ctx.beginPath();
      ctx.moveTo(sx - s * 1.2, sy + s * 0.15);
      ctx.quadraticCurveTo(sx, sy - s * 0.1, sx + s * 0.8, sy);
      for (let i = 0; i < 7; i++) {
        const x = sx - s * 0.4 + i * s * 0.14;
        for (const k of [-1, 1]) {
          ctx.moveTo(x, sy - s * 0.02);
          ctx.quadraticCurveTo(x + s * 0.06, sy + k * s * 0.18, x - s * 0.02, sy + k * s * 0.3);
        }
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(235, 228, 210, 0.85)';
      ctx.beginPath();
      ctx.ellipse(sx + s * 0.95, sy - s * 0.02, s * 0.2, s * 0.11, 0.2, 0, TAU);
      ctx.fill();
      // les fougères repoussent les premières
      for (const f of ferns) {
        const k = clamp01((t - f.at) / 1.2);
        if (k <= 0) continue;
        const x = f.x * w, y = f.y * h, r = f.r * m * k;
        ctx.strokeStyle = '#4FA853';
        ctx.lineWidth = Math.max(2, r * 0.12);
        for (let i = 0; i < 7; i++) {
          const a = f.a + (i / 7) * TAU + Math.sin(t + i) * 0.05;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          ctx.stroke();
        }
      }
      // le terrier : un tas de terre et un trou noir
      const bx = w * 0.3, by = h * 0.62, br = m * 0.07;
      ctx.fillStyle = '#7A5A38';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1A120B';
      ctx.beginPath();
      ctx.arc(bx, by, br * 0.6, 0, TAU);
      ctx.fill();
      // le héros sort la tête… puis part explorer
      if (t > 4.8) {
        const pop = clamp01((t - 4.8) / 0.9);
        const k2 = clamp01((t - 6.5) / 5.5);
        const r = m * 0.055 * (0.45 + 0.55 * pop);
        const x = bx + (w * 0.72 - bx) * ease(k2);
        const y = by - br * 0.2 * pop - Math.sin(k2 * Math.PI) * h * 0.06;
        const scared = t > 10.4;
        drawHero(ctx, x + (scared ? Math.sin(t * 40) * 1.5 : 0), y, r, 0, t, t > 6.5 && t < 12 ? t * 3 : 0, scared ? 'scared' : 'happy');
      }
      // une grande ombre passe : un oiseau-terreur, au long cou et au gros bec
      if (t > 10.2) {
        const k = clamp01((t - 10.2) / 3.6);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * Math.sin(k * Math.PI)})`;
        const ox = w * (1.25 - k * 1.5), oy = h * 0.45;
        ctx.beginPath();
        for (const [dx, dy, rx, ry, a] of [
          [0, 0, 0.16, 0.09, 0], [-0.17, -0.02, 0.1, 0.05, -0.3], [0.17, -0.1, 0.09, 0.035, -0.7],
          [0.26, -0.2, 0.07, 0.05, 0], [0.36, -0.19, 0.08, 0.035, 0.15],
        ]) {
          ctx.moveTo(ox + (dx + rx * Math.cos(a)) * m * 2, oy + (dy + rx * Math.sin(a)) * m * 2);
          ctx.ellipse(ox + dx * m * 2, oy + dy * m * 2, rx * m * 2, ry * m * 2, a, 0, TAU);
        }
        ctx.fill();
      }
      // les cendres tombent encore un peu, puis s'arrêtent
      ctx.fillStyle = 'rgba(210, 210, 205, 0.7)';
      for (const a of ash) {
        ctx.globalAlpha = 1 - life * 0.9;
        const y = ((a.y + t * a.v) % 1) * h;
        const x = (a.x * w + Math.sin(t + a.x * 10) * 10) % w;
        ctx.beginPath();
        ctx.arc(x, y, a.s, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // au début, le ciel est noir de poussière ; à la fin, l'ombre du danger
      const dark = 0.5 * (1 - life) + 0.55 * clamp01((t - 9.5) / 2);
      const v = ctx.createRadialGradient(w / 2, h / 2, m * 0.2, w / 2, h / 2, Math.hypot(w, h) * 0.6);
      v.addColorStop(0, `rgba(0, 0, 0, ${dark * 0.4})`);
      v.addColorStop(1, `rgba(0, 0, 0, ${dark})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
      const cap = MAMMAL_CAPTIONS.find(([a, b]) => t >= a && t < b);
      if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
      if (t > MAMMAL_DURATION - 0.6) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(t - (MAMMAL_DURATION - 0.6)) / 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
  return intro;
}

/* ============================================================================
   L'animation du niveau 4 (environ 14 s) : une nuit de l'âge de glace, de profil.
   0 → 4,5 s   la meute hurle à la lune, sur une colline enneigée
   4,5 → 9 s   le plus petit de la meute arrive en gambadant : c'est toi !
   9 → 14 s    au loin, le feu des humains s'allume… le louveteau s'approche
   drawHero(ctx, x, y, r, t, walk, mood) dessine le joueur en louveteau ;
   drawAnimal(ctx, look, color, x, y, r, face, t, walk, mouth) un autre animal.
   ============================================================================ */
const WOLF_DURATION = 14;
const WOLF_CAPTIONS = [
  [0.3, 4.5, "Il y a 40 000 ans, c'est l'âge de glace. Dans la steppe gelée, une meute de loups hurle à la lune…"],
  [4.7, 9, "Le plus petit de la meute, c'est toi : un louveteau curieux, qui ne tient pas en place !"],
  [9.2, 14, "Au loin, une drôle de lumière : le feu des humains. Et si tu allais voir ?"],
];
const STARS = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() * 0.5, s: 0.6 + Math.random() * 1.4, p: Math.random() * TAU }));
const FLAKES = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2, v: 0.02 + Math.random() * 0.04 }));

export function createWolfIntro({ sfx, drawHero, drawAnimal }) {
  let t = 0;
  const cues = new Set();

  function cue(name, at, fn) {
    if (t >= at && !cues.has(name)) { cues.add(name); fn(); }
  }

  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('howl', 1.0, () => sfx.howl());
      cue('howl2', 2.6, () => sfx.howl());
      cue('pup', 5.0, () => sfx.pickup());
      cue('fire', 9.6, () => sfx.phew());
      if (t >= WOLF_DURATION) intro.done = true;
    },
    draw(ctx, w, h) {
      const m = Math.min(w, h);
      // le ciel de nuit, les étoiles, la lune
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
      sky.addColorStop(0, '#0B1430');
      sky.addColorStop(1, '#2A3C66');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      for (const s of STARS) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(t * 2 + s.p) * 0.3})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s, 0, TAU);
        ctx.fill();
      }
      const mx = w * 0.2, my = h * 0.2, mr = m * 0.09;
      const glow = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3);
      glow.addColorStop(0, 'rgba(255, 250, 220, 0.35)');
      glow.addColorStop(1, 'rgba(255, 250, 220, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FFF8DC';
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(200, 190, 160, 0.4)';
      for (const [dx, dy, k] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.35, 0.12]]) {
        ctx.beginPath();
        ctx.arc(mx + dx * mr, my + dy * mr, k * mr, 0, TAU);
        ctx.fill();
      }
      // au loin, à droite : le feu des humains
      const fire = clamp01((t - 9) / 1.5);
      const fx = w * 0.86, fy = h * 0.6;
      if (fire > 0) {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, m * 0.3);
        g.addColorStop(0, `rgba(255, 160, 60, ${0.5 * fire})`);
        g.addColorStop(1, 'rgba(255, 120, 30, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      // la colline enneigée
      const hill = ctx.createLinearGradient(0, h * 0.55, 0, h);
      hill.addColorStop(0, '#C9D8EA');
      hill.addColorStop(1, '#7E92B2');
      ctx.fillStyle = hill;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.66);
      ctx.quadraticCurveTo(w * 0.3, h * 0.52, w * 0.55, h * 0.6);
      ctx.quadraticCurveTo(w * 0.8, h * 0.66, w, h * 0.62);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      if (fire > 0) {
        // les humains autour du feu, en ombres chinoises
        ctx.fillStyle = '#1C1411';
        for (const [dx, k] of [[-0.05, 1], [0.045, 0.9], [0.075, 0.7]]) {
          const x = fx + dx * w, s = m * 0.045 * k;
          ctx.globalAlpha = fire;
          ctx.beginPath();
          ctx.arc(x, fy - s * 1.9, s * 0.22, 0, TAU);
          ctx.moveTo(x - s * 0.26, fy - s * 0.5);
          ctx.lineTo(x + s * 0.26, fy - s * 0.5);
          ctx.lineTo(x + s * 0.17, fy - s * 1.65);
          ctx.lineTo(x - s * 0.17, fy - s * 1.65);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(x - s * 0.14, fy - s * 0.55, s * 0.1, s * 0.55);
          ctx.fillRect(x + s * 0.04, fy - s * 0.55, s * 0.1, s * 0.55);
        }
        ctx.globalAlpha = 1;
        const f = m * 0.018 * fire * (0.85 + Math.sin(t * 13) * 0.15);
        ctx.fillStyle = '#FF7A1A';
        ctx.beginPath();
        ctx.ellipse(fx, fy - f * 0.8, f * 0.6, f * 1.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#FFE58A';
        ctx.beginPath();
        ctx.ellipse(fx, fy - f * 0.6, f * 0.3, f * 0.7, 0, 0, TAU);
        ctx.fill();
      }
      // la meute, sur la colline (elle hurle, museau levé)
      const howl = (t > 1 && t < 4.2) || (t > 2.6 && t < 5);
      const r = m * 0.075;
      for (const [x, y, k, face] of [[0.3, 0.6, 1, 1], [0.42, 0.58, 0.95, -1], [0.18, 0.64, 0.9, 1]]) {
        drawAnimal(ctx, 'loup', '#8A8A88', w * x, h * y - r * 0.9 * k, r * k, face, t, 0, howl ? 0.7 : 0);
      }
      // le louveteau : il arrive en gambadant, il joue… puis il part vers le feu
      if (t > 4.5) {
        const k1 = clamp01((t - 4.5) / 2);
        const k2 = clamp01((t - 9.6) / 4);
        const x = w * (-0.05 + 0.4 * ease(k1) + 0.25 * ease(k2));
        const hop = Math.abs(Math.sin(t * 6)) * (t < 9 ? m * 0.03 : m * 0.008);
        const y = h * 0.72 - hop;
        const walk = t < 6.5 || t > 9.6 ? t * 4 : 0;
        drawHero(ctx, x, y, m * 0.05, t, walk, 'happy');
      }
      // il neige
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (const f of FLAKES) {
        const y = ((f.y + t * f.v) % 1) * h;
        const x = (f.x * w + Math.sin(t + f.x * 10) * 12) % w;
        ctx.beginPath();
        ctx.arc(x, y, f.s, 0, TAU);
        ctx.fill();
      }
      const cap = WOLF_CAPTIONS.find(([a, b]) => t >= a && t < b);
      if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
      if (t > WOLF_DURATION - 0.6) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(t - (WOLF_DURATION - 0.6)) / 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
  return intro;
}

/* ============================================================================
   L'animation de la voie des requins (environ 14 s) : la mer juste après la météorite.
   0 → 4,5 s   la mer est noire, les cendres tombent, les grands monstres ont disparu
   4,5 → 9 s   une petite lumière s'allume dans le noir : c'est toi !
   9 → 14 s    les crevettes accourent… et une ombre énorme passe
   drawHero(ctx, x, y, r, t, mood, flashT) dessine le joueur en requin-lanterne.
   ============================================================================ */
const SHARK_DURATION = 14;
const SHARK_CAPTIONS = [
  [0.3, 4.5, "Après la météorite, le ciel est noir et la mer est glacée. Les mosasaures ont tous disparu…"],
  [4.7, 9, "Mais dans le noir, une toute petite lumière s'allume : c'est toi, un requin-lanterne !"],
  [9.2, 14, "La mer est à prendre. De requin en requin, ta grande famille va devenir la reine des océans !"],
];

export function createSharkIntro({ sfx, drawHero }) {
  let t = 0;
  const cues = new Set();
  const ash = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2, v: 0.02 + Math.random() * 0.04 }));
  const prey = Array.from({ length: 16 }, (_, i) => ({ a: i * 2.4, d: 0.35 + Math.random() * 0.45, s: 0.6 + Math.random() * 0.8 }));

  function cue(name, at, fn) {
    if (t >= at && !cues.has(name)) { cues.add(name); fn(); }
  }

  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('flash', 4.9, () => sfx.flashy());
      cue('flash2', 7.6, () => sfx.flashy());
      cue('h1', 10.6, () => sfx.heart(false));
      cue('h2', 11.3, () => sfx.heart(true));
      if (t >= SHARK_DURATION) intro.done = true;
    },
    draw(ctx, w, h) {
      const m = Math.min(w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, m * 0.1, w / 2, h / 2, Math.hypot(w, h) * 0.65);
      g.addColorStop(0, '#16324A');
      g.addColorStop(1, '#040C16');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // le squelette d'un mosasaure, au fond
      const sx = w * 0.72, sy = h * 0.72, s = m * 0.24;
      ctx.strokeStyle = 'rgba(225, 225, 210, 0.3)';
      ctx.lineWidth = Math.max(2, s * 0.03);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx - s * 1.3, sy + s * 0.2);
      ctx.quadraticCurveTo(sx, sy - s * 0.1, sx + s, sy);
      for (let i = 0; i < 9; i++) {
        const x = sx - s * 0.6 + i * s * 0.16;
        for (const k of [-1, 1]) {
          ctx.moveTo(x, sy);
          ctx.quadraticCurveTo(x + s * 0.05, sy + k * s * 0.15, x - s * 0.02, sy + k * s * 0.26);
        }
      }
      ctx.stroke();
      // le héros : une lumière dans le noir
      const on = clamp01((t - 4.6) / 0.5);
      const hx = w * (0.38 + 0.06 * Math.sin(t * 0.4)), hy = h * 0.52 + Math.sin(t * 0.9) * m * 0.02;
      const pulse = t > 4.9 && t < 5.4 || t > 7.6 && t < 8.1;
      if (on > 0) {
        ctx.globalCompositeOperation = 'lighter';
        const R = m * (pulse ? 0.55 : 0.32) * on;
        const gl = ctx.createRadialGradient(hx, hy, 0, hx, hy, R);
        gl.addColorStop(0, 'rgba(120, 255, 235, 0.55)');
        gl.addColorStop(1, 'rgba(60, 220, 255, 0)');
        ctx.fillStyle = gl;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      // les crevettes attirées par la lumière
      if (t > 7.6) {
        const k = ease(clamp01((t - 7.6) / 2.6));
        ctx.fillStyle = '#F4B59A';
        for (const p of prey) {
          const d = p.d * m * (1.3 - k * 0.8);
          ctx.beginPath();
          ctx.ellipse(hx + Math.cos(p.a + t * 0.5) * d, hy + Math.sin(p.a + t * 0.5) * d, 5 * p.s, 3 * p.s, p.a + t * 0.5, 0, TAU);
          ctx.fill();
        }
      }
      if (on > 0) drawHero(ctx, hx, hy, m * 0.05 * (0.6 + on * 0.4), t, t > 10.6 ? 'scared' : 'happy', pulse ? 1 : 0);
      // une grande ombre passe (une énorme gueule de crocodile marin)
      if (t > 10.3) {
        const k = clamp01((t - 10.3) / 3.2);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.55 * Math.sin(k * Math.PI)})`;
        const ox = w * (1.3 - k * 1.6), oy = h * 0.3;
        ctx.beginPath();
        ctx.ellipse(ox, oy, m * 0.38, m * 0.09, 0.05, 0, TAU);
        ctx.moveTo(ox - m * 0.3, oy);
        ctx.ellipse(ox - m * 0.42, oy + m * 0.01, m * 0.24, m * 0.035, 0.05, 0, TAU);
        ctx.moveTo(ox + m * 0.3, oy);
        ctx.ellipse(ox + m * 0.55, oy, m * 0.25, m * 0.03, -0.1, 0, TAU);
        ctx.fill();
      }
      // les cendres
      ctx.fillStyle = 'rgba(210, 215, 220, 0.6)';
      for (const a of ash) {
        const y = ((a.y + t * a.v) % 1) * h;
        const x = (a.x * w + Math.sin(t + a.x * 10) * 10) % w;
        ctx.beginPath();
        ctx.arc(x, y, a.s, 0, TAU);
        ctx.fill();
      }
      const cap = SHARK_CAPTIONS.find(([a, b]) => t >= a && t < b);
      if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
      if (t > SHARK_DURATION - 0.6) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(t - (SHARK_DURATION - 0.6)) / 0.6})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
  return intro;
}
