// ============================================================================
// Évolution — les animations de LA VOIE DES HUMAINS (vue de trois quarts) :
// le début et la fin du niveau (on peut passer le début).
//
// Le début (17 s) : la nuit du premier feu
//   0 → 4,2 s     il y a 800 000 ans, la nuit : la tribu se serre dans le
//                 noir, les yeux des hyènes brillent tout autour
//   4,2 s         un éclair frappe un arbre : il prend feu
//   5,5 → 8,6 s   un humain s'approche des flammes et prend une branche
//   8,8 → 12 s    il rapporte le feu au camp ; les hyènes reculent
//   12 → 17 s     le foyer s'allume : la tribu se réchauffe, la nuit recule
// La fin (15,5 s, puis le texte) : le village fortifié… qui devient une
// ville de briques, avec son temple, son marché et sa grande porte bleue ;
// une charrette passe (la roue !) ; puis le défilé des inventions, en bas.
// Le paysage est un diorama : le ciel en haut, le sol vu de trois quarts en
// dessous ; plus c'est loin (vers l'horizon), plus c'est petit. On y pose les
// dessins du jeu (art-humains.js) : arbres, huttes, palissade, champs…
// ============================================================================

import { drawCaptionBox } from './intro.js';
import { shade } from './art.js';
import {
  drawTree, drawFireTree, drawHearth, drawHut, drawGranary, drawStake, drawGate, drawTower, drawField, drawPost,
  drawBush, drawRock, groundShadow,
} from './art-humains.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => 1 - (1 - clamp01(k)) ** 3;
const smooth = (k) => { const u = clamp01(k); return u * u * (3 - 2 * u); };

function seeded(s) {
  let a = (s * 9301 + 49297) % 233280;
  return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; };
}
const STARS = (() => { const r = seeded(7); return Array.from({ length: 70 }, () => ({ x: r(), y: r(), s: 0.6 + r() * 1.6, p: r() * TAU })); })();
const TUFTS = (() => { const r = seeded(21); return Array.from({ length: 160 }, () => ({ x: (r() * 2 - 1) * 1100, fy: r(), s: 0.6 + r() * 0.8 })); })();

/* ============================================================================
   LE DIORAMA : le ciel jusqu'à l'horizon (hy), puis le sol (fy : 0 au fond → 1 devant)
   ============================================================================ */
function view(w, h, span) {
  const hy = Math.round(h * 0.27);
  const K = Math.min(w / span, (h - hy) / (span * 0.5));
  const S = (fy) => K * lerp(0.46, 1.08, fy);
  return { w, h, hy, K, S, X: (x, fy) => w / 2 + x * S(fy), Y: (fy) => hy + fy * (h - hy) };
}
/** Dessine fn() posé sur le sol en (x, fy), à la bonne taille (fn dessine autour de (0, 0)) */
function at(ctx, V, x, fy, fn, k = 1) {
  const s = V.S(fy) * k;
  ctx.save();
  ctx.translate(V.X(x, fy), V.Y(fy));
  ctx.scale(s, s);
  fn();
  ctx.restore();
}

function hills(ctx, w, y0, A, wl, ph, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, y0 + 2);
  for (let x = 0; x <= w + 10; x += 10) ctx.lineTo(x, y0 - A * (0.6 + 0.4 * Math.sin(x / wl + ph) + 0.2 * Math.sin(x / (wl * 0.37) + ph * 2)));
  ctx.lineTo(w, y0 + 2);
  ctx.closePath();
  ctx.fill();
}

/** Le ciel : la nuit étoilée (et la lune), ou le soir doré */
function sky(ctx, V, t, night) {
  const { w, hy } = V;
  const g = ctx.createLinearGradient(0, 0, 0, hy);
  if (night) {
    g.addColorStop(0, '#070B22');
    g.addColorStop(1, '#1E2A50');
  } else {
    g.addColorStop(0, '#5E9AD2');
    g.addColorStop(0.65, '#F2C890');
    g.addColorStop(1, '#F8E2B0');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, hy + 2);
  const m = Math.min(w, V.h);
  if (night) {
    for (const s of STARS) {
      ctx.fillStyle = `rgba(255, 255, 240, ${0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2 + s.p))})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * hy * 0.9, s.s, 0, TAU);
      ctx.fill();
    }
    // la lune (un croissant)
    const mx = w * 0.82, my = hy * 0.38, mr = m * 0.035;
    const glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4);
    glow.addColorStop(0, 'rgba(220, 230, 255, 0.35)');
    glow.addColorStop(1, 'rgba(220, 230, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
    ctx.fillStyle = '#EEF0F8';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#121A3A';
    ctx.beginPath();
    ctx.arc(mx + mr * 0.45, my - mr * 0.2, mr * 0.9, 0, TAU);
    ctx.fill();
    hills(ctx, w, hy, hy * 0.22, w * 0.11, 1.3, '#141C34');
    hills(ctx, w, hy, hy * 0.1, w * 0.07, 0.4, '#1A2A2A');
  } else {
    const sx = w * 0.74, sy = hy * 0.78;
    const glow = ctx.createRadialGradient(sx, sy, m * 0.03, sx, sy, m * 0.5);
    glow.addColorStop(0, 'rgba(255, 240, 190, 0.75)');
    glow.addColorStop(1, 'rgba(255, 240, 190, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, hy + 2);
    ctx.fillStyle = '#FFF2C8';
    ctx.beginPath();
    ctx.arc(sx, sy, m * 0.05, 0, TAU);
    ctx.fill();
    hills(ctx, w, hy, hy * 0.28, w * 0.13, 2.1, '#C29A8A');
    hills(ctx, w, hy, hy * 0.12, w * 0.08, 0.7, '#9AA06A');
  }
}

/** Le sol, du fond (brumeux) vers le devant, avec des touffes d'herbe */
function ground(ctx, V, far, near, tuft) {
  const g = ctx.createLinearGradient(0, V.hy, 0, V.h);
  g.addColorStop(0, far);
  g.addColorStop(1, near);
  ctx.fillStyle = g;
  ctx.fillRect(0, V.hy, V.w, V.h - V.hy);
  ctx.strokeStyle = tuft;
  ctx.lineCap = 'round';
  for (const d of TUFTS) {
    const s = V.S(d.fy) * d.s;
    const x = V.X(d.x, d.fy), y = V.Y(d.fy);
    if (x < -20 || x > V.w + 20) continue;
    ctx.lineWidth = Math.max(1, s * 3);
    ctx.beginPath();
    for (const k of [-1, 0, 1]) {
      ctx.moveTo(x + k * s * 6, y);
      ctx.lineTo(x + k * s * 10, y - s * (12 + Math.abs(k) * -3));
    }
    ctx.stroke();
  }
}

/* ---------- La nuit : tout est sombre, sauf autour des feux ---------- */
let nightCv = null;
function night(ctx, V, lights, a) {
  if (a <= 0) return;
  if (!nightCv) nightCv = document.createElement('canvas');
  const w = Math.ceil(V.w / 2), h = Math.ceil(V.h / 2);
  if (nightCv.width !== w || nightCv.height !== h) { nightCv.width = w; nightCv.height = h; }
  const n = nightCv.getContext('2d');
  n.globalCompositeOperation = 'source-over';
  n.clearRect(0, 0, w, h);
  n.fillStyle = `rgba(6, 10, 30, ${a})`;
  n.fillRect(0, 0, w, h);
  n.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    if (l.r <= 1) continue;
    const g = n.createRadialGradient(l.x / 2, l.y / 2, l.r * 0.08, l.x / 2, l.y / 2, l.r / 2);
    g.addColorStop(0, 'rgba(0, 0, 0, 1)');
    g.addColorStop(0.55, 'rgba(0, 0, 0, 0.8)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    n.fillStyle = g;
    n.fillRect(l.x / 2 - l.r / 2, l.y / 2 - l.r / 2, l.r, l.r);
  }
  ctx.drawImage(nightCv, 0, 0, V.w, V.h);
  // la lueur orangée des flammes
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    if (!l.warm || l.r <= 1) continue;
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.75);
    g.addColorStop(0, `rgba(255, 150, 60, ${0.22 * l.warm})`);
    g.addColorStop(1, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.restore();
}

/** Deux yeux qui brillent dans le noir (ils clignent de temps en temps) */
function eyes(ctx, x, y, s, t, seed, col = '#F2E25A') {
  if ((t + seed) % 3.4 < 0.14) return;
  ctx.save();
  ctx.fillStyle = col;
  ctx.shadowColor = col;
  ctx.shadowBlur = 10;
  for (const dx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + dx * s * 4, y, Math.max(1.6, s * 2.4), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** L'éclair : une ligne brisée, blanche et bleutée */
function lightning(ctx, x0, y0, x1, y1, a, seed) {
  const r = seeded(seed);
  const pts = [[x0, y0]];
  const n = 9;
  for (let i = 1; i < n; i++) {
    const k = i / n;
    pts.push([lerp(x0, x1, k) + (r() - 0.5) * 60, lerp(y0, y1, k) + (r() - 0.5) * 12]);
  }
  pts.push([x1, y1]);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [lw, col] of [[14, `rgba(150, 190, 255, ${0.35 * a})`], [6, `rgba(210, 230, 255, ${0.8 * a})`], [2.5, `rgba(255, 255, 255, ${a})`]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================================
   LE DÉBUT : LA NUIT DU PREMIER FEU
   ============================================================================ */
const INTRO_T = 17;
const INTRO_CAPS = [
  [0.3, 4.2, "Il y a 800 000 ans. La nuit tombe sur la vallée… Les humains n'ont ni griffes, ni crocs, ni fourrure épaisse. Dans le noir, les hyènes rôdent."],
  [4.6, 8.6, "Un éclair ! Un arbre prend feu. Tous les animaux ont peur des flammes… Mais un humain s'approche : il a une idée !"],
  [8.8, 12.6, "Il rapporte une branche enflammée jusqu'au camp. Les hyènes reculent : elles n'osent plus approcher !"],
  [12.8, 17, "Le feu réchauffe, éclaire et protège. C'est la première grande invention des humains… À toi de jouer !"],
];
const NIGHT_PAL = { leaf: ['#1E3A22', '#2A4E2A', '#3A6234'], rock: '#6A665E', bush: ['#2A4A26', '#3A5E30', '#4E7438'] };
const CAMP = { x: -260, fy: 0.62 };
const TREE_ON_FIRE = { x: 380, fy: 0.34, r: 78 };

/** Où est le héros, et ce qu'il fait, à l'instant t */
function heroAt(t) {
  const home = { x: CAMP.x + 70, fy: CAMP.fy + 0.06 }, tree = { x: TREE_ON_FIRE.x - 70, fy: TREE_ON_FIRE.fy + 0.1 };
  if (t < 5.5) return { ...home, speed: 0, walk: 0, angle: 0, carry: null };
  if (t < 8.2) {
    const k = smooth((t - 5.5) / 2.7);
    return { x: lerp(home.x, tree.x, k), fy: lerp(home.fy, tree.fy, k), speed: 0.8, walk: (t - 5.5) * 3.2, angle: Math.atan2(tree.fy - home.fy, (tree.x - home.x) / 900), carry: null };
  }
  if (t < 8.8) return { ...tree, speed: 0, walk: 0, angle: 0, carry: t > 8.5 ? 'feu' : null };
  if (t < 11.8) {
    const k = smooth((t - 8.8) / 3);
    return { x: lerp(tree.x, home.x, k), fy: lerp(tree.fy, home.fy, k), speed: 0.8, walk: (t - 8.8) * 3.2, angle: Math.PI - 0.2, carry: 'feu' };
  }
  return { ...home, speed: 0, walk: 0, angle: Math.PI, carry: t < 12 ? 'feu' : null };
}

/** Les hyènes : elles approchent dans le noir… puis s'enfuient devant le feu */
const HYENAS = [
  { from: [-820, 0.56], to: [-560, 0.6], flee: [-1250, 0.5], at: 10.6, seed: 1 },
  { from: [800, 0.6], to: [600, 0.62], flee: [1250, 0.55], at: 9.4, seed: 2 },
  { from: [-60, 0.08], to: [-110, 0.2], flee: [-520, 0.02], at: 11.4, seed: 3 },
];
function hyenaAt(H, t) {
  if (t < H.at) {
    const k = smooth(t / 4) - (t > 4.2 ? 0.25 * smooth((t - 4.2) / 0.6) : 0);
    return { x: lerp(H.from[0], H.to[0], k), fy: lerp(H.from[1], H.to[1], k), speed: t < 4 ? 0.35 : 0.1, angle: H.to[0] > H.from[0] ? 0 : Math.PI, flee: false };
  }
  const k = ease((t - H.at) / 1.6);
  const s = { x: lerp(H.from[0], H.to[0], 0.75), fy: lerp(H.from[1], H.to[1], 0.75) };
  return { x: lerp(s.x, H.flee[0], k), fy: lerp(s.fy, H.flee[1], k), speed: 1.1, angle: H.flee[0] > s.x ? 0 : Math.PI, flee: true, gone: k >= 1 };
}

export function createHumanIntro({ sfx, drawHero, drawAnimal }) {
  let t = 0;
  const cues = new Set();
  const cue = (name, when, fn) => { if (t >= when && !cues.has(name)) { cues.add(name); fn(); } };
  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('eyes', 1.2, () => sfx.alert());
      cue('crack', 4.2, () => { sfx.whip(); sfx.boom(); });
      cue('fire', 4.9, () => sfx.torch());
      cue('take', 8.5, () => { sfx.pickup(); sfx.torch(); });
      cue('flee', 9.4, () => sfx.dash());
      cue('light', 12, () => { sfx.torch(); sfx.chapter(); });
      cue('joy', 13.2, () => sfx.victory());
      if (t >= INTRO_T) intro.done = true;
    },
    draw(ctx, w, h) {
      const V = view(w, h, 1250);
      sky(ctx, V, t, true);
      ground(ctx, V, '#2E4630', '#3E5E34', 'rgba(90, 120, 60, 0.5)');
      const burning = t >= 4.3;
      const lit = t >= 12;
      const hero = heroAt(t);
      // tout ce qui est debout, du fond vers le devant
      const list = [];
      const tree = (x, fy, kind, r, seed) => list.push({ fy, fn: () => at(ctx, V, x, fy, () => drawTree(ctx, { x: 0, y: 0, r, kind, seed }, t, NIGHT_PAL)) });
      tree(-900, 0.16, 'bouleau', 70, 11); tree(-640, 0.06, 'pin', 72, 12); tree(-380, 0.02, 'feuillu', 80, 13);
      tree(150, 0.04, 'pin', 70, 14); tree(640, 0.1, 'feuillu', 84, 15); tree(930, 0.18, 'pin', 76, 16);
      tree(-760, 0.97, 'feuillu', 92, 17); tree(780, 0.95, 'bouleau', 84, 18);
      for (const [x, fy, r, s] of [[-520, 0.44, 60, 1], [40, 0.27, 55, 2], [620, 0.66, 66, 3], [-60, 0.9, 58, 4], [330, 0.84, 62, 5]]) {
        list.push({ fy, fn: () => at(ctx, V, x, fy, () => drawBush(ctx, { x: 0, y: 0, r, seed: s * 977 }, t, NIGHT_PAL)) });
      }
      for (const [x, fy, r] of [[-170, 0.24, 40], [530, 0.8, 50]]) list.push({ fy, fn: () => at(ctx, V, x, fy, () => drawRock(ctx, { x: 0, y: 0, r, seed: x }, NIGHT_PAL)) });
      // l'arbre frappé par la foudre
      list.push({
        fy: TREE_ON_FIRE.fy,
        fn: () => at(ctx, V, TREE_ON_FIRE.x, TREE_ON_FIRE.fy, () => (burning
          ? drawFireTree(ctx, { x: 0, y: 0, r: TREE_ON_FIRE.r, seed: 3 }, t)
          : drawTree(ctx, { x: 0, y: 0, r: TREE_ON_FIRE.r * 1.05, kind: 'feuillu', seed: 19 }, t, NIGHT_PAL))),
      });
      // le foyer du camp
      list.push({ fy: CAMP.fy, fn: () => at(ctx, V, CAMP.x, CAMP.fy, () => drawHearth(ctx, { x: 0, y: 0, seed: 2 }, t, lit, true)) });
      // la tribu, serrée près du foyer (elle danse quand le feu s'allume)
      const joy = lit ? clamp01((t - 12.3) / 0.5) : 0;
      [[-95, -0.05, 0.4], [80, -0.07, 1.9], [-70, 0.07, 3.1], [-10, 0.1, 4.6]].forEach(([dx, dfy, seed], i) => {
        const fy = CAMP.fy + dfy;
        const hop = joy * Math.abs(Math.sin(t * 5 + i)) * 10;
        list.push({ fy, fn: () => at(ctx, V, CAMP.x + dx, fy, () => drawAnimal(ctx, 'th-tribu-erectus', '#8A6440', 0, -hop, 26, { seed, angle: dx < 0 ? 0 : Math.PI, mood: lit ? 'happy' : 'scared', speed: 0, walk: 0 })) });
      });
      // les hyènes
      const hy = HYENAS.map((H) => ({ H, s: hyenaAt(H, t) }));
      for (const { H, s } of hy) {
        if (s.gone) continue;
        list.push({ fy: s.fy, fn: () => at(ctx, V, s.x, s.fy, () => drawAnimal(ctx, 'th-hyene', '#A08A62', 0, 0, 62, { seed: H.seed, angle: s.angle, speed: s.speed, walk: t * (s.flee ? 4 : 1.4) + H.seed, mood: s.flee ? 'scared' : 'angry' })) });
      }
      // le héros
      list.push({ fy: hero.fy, fn: () => at(ctx, V, hero.x, hero.fy, () => drawHero(ctx, 0, 0, 30, { angle: hero.angle, speed: hero.speed, walk: hero.walk, carry: hero.carry, mood: t < 5 ? 'scared' : 'happy' })) });
      list.sort((a, b) => a.fy - b.fy);
      for (const o of list) o.fn();
      // la nuit, et ses lumières
      const flick = (k) => 1 + Math.sin(t * 9 + k) * 0.04;
      const lights = [{ x: V.X(CAMP.x, CAMP.fy), y: V.Y(CAMP.fy), r: 260 * V.S(CAMP.fy), warm: 0 }];
      if (burning) lights.push({ x: V.X(TREE_ON_FIRE.x, TREE_ON_FIRE.fy), y: V.Y(TREE_ON_FIRE.fy) - 90 * V.S(TREE_ON_FIRE.fy), r: 900 * V.S(TREE_ON_FIRE.fy) * ease((t - 4.3) / 0.8) * flick(1), warm: 1 });
      if (hero.carry === 'feu') lights.push({ x: V.X(hero.x, hero.fy), y: V.Y(hero.fy) - 50 * V.S(hero.fy), r: 520 * V.S(hero.fy) * flick(2), warm: 0.8 });
      if (lit) lights.push({ x: V.X(CAMP.x, CAMP.fy), y: V.Y(CAMP.fy), r: 1100 * V.S(CAMP.fy) * ease((t - 12) / 1.6) * flick(3), warm: 1 });
      night(ctx, V, lights, lit ? lerp(0.84, 0.62, ease((t - 12) / 2)) : 0.84);
      // les yeux qui brillent dans le noir (pas dans la lumière)
      for (const { H, s } of hy) {
        if (s.gone || t < 1 + H.seed * 0.5) continue;
        const ex = V.X(s.x + (s.angle === 0 ? 1 : -1) * 50, s.fy), ey = V.Y(s.fy) - 78 * V.S(s.fy);
        if (lights.some((l) => l.warm && Math.hypot(l.x - ex, l.y - ey) < l.r * 0.35)) continue;
        eyes(ctx, ex, ey, V.S(s.fy), t, H.seed, s.flee ? '#FF8A5A' : '#F2E25A');
      }
      // l'éclair
      if (t > 4.1 && t < 4.6) {
        const a = 1 - Math.abs(t - 4.25) / 0.35;
        const tx = V.X(TREE_ON_FIRE.x, TREE_ON_FIRE.fy), ty = V.Y(TREE_ON_FIRE.fy) - TREE_ON_FIRE.r * 1.6 * V.S(TREE_ON_FIRE.fy);
        lightning(ctx, tx - w * 0.08, 0, tx, ty, clamp01(a * 1.5), Math.floor(t * 20));
        ctx.fillStyle = `rgba(230, 240, 255, ${clamp01(a) * 0.55})`;
        ctx.fillRect(0, 0, w, h);
      }
      const cap = INTRO_CAPS.find(([a0, b0]) => t >= a0 && t < b0);
      if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
    },
  };
  return intro;
}

/* ============================================================================
   LA FIN : LE VILLAGE DEVIENT UNE VILLE
   ============================================================================ */
const DAY_PAL = { leaf: ['#3A5A28', '#4E7232', '#6A8A3E'], rock: '#8E8478', thatch: '#C9A860', bush: ['#4A6A3A', '#5E7E44', '#7A9A50'] };
const RING = { x: 0, fy: 0.52, rx: 540, ry: 0.27 };
const ring = (a, k = 1) => ({ x: RING.x + Math.cos(a) * RING.rx * k, fy: RING.fy + Math.sin(a) * RING.ry * k });
const BRICK = ['#C9A070', '#D6B080', '#BE9464', '#CFA676'];

/** Une maison de briques crues, à toit plat (s = taille ; k : 0 → 1, elle sort de terre) */
function brickHouse(ctx, s, seed, k) {
  if (k <= 0) return;
  const r = seeded(seed);
  const W = (100 + r() * 50) * s, H = (62 + r() * 30) * s * k, D = 40 * s;
  const wall = BRICK[seed % BRICK.length];
  groundShadow(ctx, 0, 2, W * 0.62, D * 0.35, 0.3);
  ctx.fillStyle = wall;
  ctx.strokeStyle = shade(wall, -0.55);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(-W / 2, -H, W, H);
  ctx.fill();
  ctx.stroke();
  // le toit-terrasse (vu un peu d'en haut)
  ctx.fillStyle = shade(wall, 0.16);
  ctx.beginPath();
  ctx.rect(-W / 2, -H - D * 0.5, W, D * 0.5);
  ctx.fill();
  ctx.stroke();
  if (k < 0.6) return;
  // les briques
  ctx.strokeStyle = shade(wall, -0.22);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -H + 10 * s; y < -4; y += 12 * s) {
    ctx.moveTo(-W / 2 + 3, y);
    ctx.lineTo(W / 2 - 3, y);
  }
  ctx.stroke();
  // la porte et les petites fenêtres
  ctx.fillStyle = '#3A2414';
  const dx = (r() - 0.5) * W * 0.4;
  ctx.beginPath();
  ctx.moveTo(dx - 12 * s, 0);
  ctx.lineTo(dx - 12 * s, -34 * s);
  ctx.quadraticCurveTo(dx, -44 * s, dx + 12 * s, -34 * s);
  ctx.lineTo(dx + 12 * s, 0);
  ctx.closePath();
  ctx.fill();
  for (const fx of [-0.32, 0.32]) {
    if (Math.abs(fx * W - dx) < 24 * s) continue;
    ctx.fillRect(fx * W - 6 * s, -H + 16 * s, 12 * s, 10 * s);
  }
  // une échelle pour monter sur le toit, ou des jarres sur la terrasse
  if (r() < 0.5) {
    ctx.strokeStyle = '#6A4A2A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const lx = W / 2 - 14 * s;
    ctx.moveTo(lx, -4);
    ctx.lineTo(lx, -H - 18 * s);
    ctx.moveTo(lx + 10 * s, -4);
    ctx.lineTo(lx + 10 * s, -H - 18 * s);
    for (let y = -14 * s; y > -H - 12 * s; y -= 12 * s) {
      ctx.moveTo(lx, y);
      ctx.lineTo(lx + 10 * s, y);
    }
    ctx.stroke();
  } else {
    for (const jx of [-0.25, -0.1]) {
      ctx.fillStyle = '#B8643A';
      ctx.beginPath();
      ctx.ellipse(jx * W, -H - D * 0.3, 7 * s, 9 * s, 0, 0, TAU);
      ctx.fill();
    }
  }
}

/** Le temple à étages (une ziggourat) : il monte, étage par étage (k : 0 → 1) */
function ziggurat(ctx, k, t) {
  if (k <= 0) return;
  groundShadow(ctx, 0, 4, 230, 40, 0.32);
  const tiers = [[400, 70, 64], [290, 62, 52], [190, 56, 42]];
  let base = 0;
  tiers.forEach(([W, H0, D], i) => {
    const kk = clamp01(k * 3 - i);
    if (kk <= 0) return;
    const H = H0 * kk;
    const col = i === 2 ? '#D9B47C' : i ? '#CFA06A' : '#C49260';
    ctx.fillStyle = col;
    ctx.strokeStyle = shade(col, -0.55);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(-W / 2, base - H, W, H);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shade(col, 0.18);
    ctx.beginPath();
    ctx.rect(-W / 2, base - H - D * 0.5, W, D * 0.5);
    ctx.fill();
    ctx.stroke();
    // les contreforts
    ctx.strokeStyle = shade(col, -0.25);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -W / 2 + 24; x < W / 2 - 10; x += 32) {
      ctx.moveTo(x, base - 2);
      ctx.lineTo(x, base - H + 4);
    }
    ctx.stroke();
    base -= H + D * 0.25;
  });
  if (k < 0.75) return;
  // le petit sanctuaire tout en haut, aux briques bleues
  const kk = clamp01((k - 0.75) * 4);
  ctx.fillStyle = '#2E5AA8';
  ctx.strokeStyle = '#142A5A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(-48, base - 54 * kk, 96, 54 * kk);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F2C24A';
  ctx.fillRect(-48, base - 54 * kk, 96, 6);
  ctx.fillStyle = '#142A5A';
  ctx.beginPath();
  ctx.moveTo(-12, base);
  ctx.lineTo(-12, base - 30 * kk);
  ctx.quadraticCurveTo(0, base - 40 * kk, 12, base - 30 * kk);
  ctx.lineTo(12, base);
  ctx.fill();
  // la grande rampe d'escalier, au milieu
  ctx.fillStyle = '#B88456';
  ctx.strokeStyle = '#5A3A22';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-20, base + 4);
  ctx.lineTo(20, base + 4);
  ctx.lineTo(34, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60, 36, 18, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 1; i < 14; i++) {
    const y = lerp(0, base + 4, i / 14), hw = lerp(34, 20, i / 14);
    ctx.moveTo(-hw, y);
    ctx.lineTo(hw, y);
  }
  ctx.stroke();
  // les fanions qui flottent au vent
  for (const fx of [-40, 40]) {
    ctx.strokeStyle = '#3A2414';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, base - 54 * kk);
    ctx.lineTo(fx, base - 54 * kk - 46);
    ctx.stroke();
    ctx.fillStyle = fx < 0 ? '#C8302A' : '#F2C24A';
    ctx.beginPath();
    ctx.moveTo(fx, base - 54 * kk - 46);
    ctx.quadraticCurveTo(fx + 16, base - 54 * kk - 44 + Math.sin(t * 5 + fx) * 4, fx + 30, base - 54 * kk - 38);
    ctx.lineTo(fx, base - 54 * kk - 30);
    ctx.closePath();
    ctx.fill();
  }
}

/** Un morceau du rempart de briques, avec ses créneaux (k : 0 → 1, il monte) */
function wallBlock(ctx, len, k) {
  if (k <= 0) return;
  const H = 78 * k;
  const col = '#C49A66';
  ctx.fillStyle = col;
  ctx.strokeStyle = shade(col, -0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(-len / 2, -H, len, H);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(col, 0.14);
  for (let x = -len / 2; x < len / 2 - 4; x += 18) {
    ctx.beginPath();
    ctx.rect(x, -H - 12 * k, 10, 12 * k);
    ctx.fill();
    ctx.stroke();
  }
}

/** La grande porte de la ville, en briques bleues, avec ses animaux dorés */
function cityGate(ctx, k) {
  if (k <= 0) return;
  const H = 150 * k;
  groundShadow(ctx, 0, 4, 140, 26, 0.3);
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#2E5AA8';
    ctx.strokeStyle = '#142A5A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(s * 70 - 32, -H - 20 * k, 64, H + 20 * k);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F2C24A';
    for (let i = 0; i < 2; i++) {
      // un taureau doré (tout simple)
      const y = -H * (0.35 + i * 0.32);
      ctx.beginPath();
      ctx.ellipse(s * 70, y, 14, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(s * 70 - 10, y + 4, 3, 9);
      ctx.fillRect(s * 70 + 7, y + 4, 3, 9);
    }
    for (let x = -32; x < 32; x += 16) ctx.fillRect(s * 70 + x + 2, -H - 32 * k, 10, 12 * k);
  }
  ctx.fillStyle = '#2E5AA8';
  ctx.strokeStyle = '#142A5A';
  ctx.beginPath();
  ctx.rect(-40, -H, 80, H * 0.42);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F2C24A';
  ctx.fillRect(-40, -H + H * 0.36, 80, 5);
  // l'arche (on voit la ville à travers)
  ctx.fillStyle = '#5A3A22';
  ctx.beginPath();
  ctx.moveTo(-38, 0);
  ctx.lineTo(-38, -H * 0.52);
  ctx.quadraticCurveTo(0, -H * 0.7, 38, -H * 0.52);
  ctx.lineTo(38, 0);
  ctx.closePath();
  ctx.fill();
}

/** Un étal du marché : un auvent rayé, des jarres et du blé */
function stall(ctx, col) {
  groundShadow(ctx, 0, 2, 50, 12, 0.25);
  ctx.strokeStyle = '#5A3A22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const x of [-40, 40]) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, -62);
  }
  ctx.stroke();
  ctx.fillStyle = '#8A6440';
  ctx.fillRect(-44, -26, 88, 10);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#F8F0DC' : col;
    ctx.beginPath();
    ctx.moveTo(-50 + i * 20, -62);
    ctx.lineTo(-30 + i * 20, -62);
    ctx.lineTo(-28 + i * 20, -78);
    ctx.lineTo(-48 + i * 20, -78);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#B8643A';
  for (const x of [-26, -8]) {
    ctx.beginPath();
    ctx.ellipse(x, -32, 7, 9, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#E8C05A';
  ctx.beginPath();
  ctx.ellipse(18, -32, 14, 7, 0, 0, TAU);
  ctx.fill();
}

/** Un palmier dattier */
function palm(ctx, s, t, seed) {
  groundShadow(ctx, 10 * s, 2, 40 * s, 12 * s, 0.22);
  ctx.strokeStyle = '#6A4A2A';
  ctx.lineWidth = 10 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(12 * s, -80 * s, 4 * s, -150 * s);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.5 + Math.sin(t * 1.2 + i + seed) * 0.04;
    ctx.strokeStyle = i % 2 ? '#3E7A34' : '#2E6A2A';
    ctx.lineWidth = 7 * s;
    ctx.beginPath();
    ctx.moveTo(4 * s, -150 * s);
    ctx.quadraticCurveTo(4 * s + Math.cos(a) * 50 * s, -150 * s + Math.sin(a) * 45 * s, 4 * s + Math.cos(a) * 80 * s, -150 * s + Math.sin(a) * 25 * s + 26 * s);
    ctx.stroke();
  }
}

/** Une roue en bois (avec ses rayons) */
function wheel(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = r * 0.28;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#A8804E';
  ctx.lineWidth = r * 0.16;
  ctx.stroke();
  ctx.strokeStyle = '#6A4A2A';
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(-Math.cos(a) * r, -Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.fillStyle = '#3A2414';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Un biface : la pierre taillée, avec ses facettes */
function biface(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#8A8478';
  ctx.strokeStyle = '#2E2A26';
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.62, -s * 0.2, s * 0.42, s * 0.6);
  ctx.quadraticCurveTo(0, s * 0.95, -s * 0.42, s * 0.6);
  ctx.quadraticCurveTo(-s * 0.62, -s * 0.2, 0, -s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  for (const [fx, fy] of [[-0.18, -0.3], [0.16, 0.05], [-0.12, 0.38]]) {
    ctx.beginPath();
    ctx.ellipse(fx * s, fy * s, s * 0.16, s * 0.1, 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * La fin (environ 15,5 s, puis le texte).
 * o : { captions, parade [{ icon | draw ('biface' / 'roue'), name }], textAt,
 *       drawHero(ctx, x, y, r, c), drawAnimal(ctx, look, color, x, y, r, c) }
 */
export function drawHumanEnding(ctx, w, h, t, o) {
  const V = view(w, h, 1900);
  const city = smooth((t - 5.4) / 3.6);           // 0 = le village, 1 = la ville
  const old = 1 - smooth((t - 5.2) / 1.6);        // le village s'efface
  sky(ctx, V, t, false);
  // (la ville) au loin, une pyramide
  if (city > 0) {
    ctx.globalAlpha = city * 0.7;
    ctx.fillStyle = '#C8A07A';
    const px = w * 0.22, py = V.hy, ps = V.hy * 0.42;
    ctx.beginPath();
    ctx.moveTo(px - ps, py);
    ctx.lineTo(px, py - ps * 0.9);
    ctx.lineTo(px + ps, py);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120, 80, 50, 0.35)';
    ctx.beginPath();
    ctx.moveTo(px, py - ps * 0.9);
    ctx.lineTo(px + ps, py);
    ctx.lineTo(px + ps * 0.25, py);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ground(ctx, V, '#9AAE6A', '#7E9A48', 'rgba(70, 100, 40, 0.45)');
  // la route qui mène à la porte, et le marché devant
  ctx.fillStyle = `rgba(190, 160, 110, ${0.35 + city * 0.35})`;
  ctx.beginPath();
  const g0 = ring(Math.PI / 2);
  ctx.moveTo(V.X(-60, g0.fy), V.Y(g0.fy));
  ctx.lineTo(V.X(60, g0.fy), V.Y(g0.fy));
  ctx.lineTo(V.X(160, 1.05), V.Y(1.05));
  ctx.lineTo(V.X(-160, 1.05), V.Y(1.05));
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(0, V.Y(0.93) - 14 * V.S(0.93), w, 28 * V.S(0.93));
  const list = [];
  const put = (x, fy, fn, k = 1) => list.push({ fy, fn: () => at(ctx, V, x, fy, fn, k) });
  // les champs de blé mûr (à gauche) et l'enclos des moutons (à droite)
  for (const [x, fy] of [[-1010, 0.36], [-1010, 0.62], [-1260, 0.48]]) {
    list.push({ fy: fy - 0.1, fn: () => at(ctx, V, x, fy, () => drawField(ctx, { x: 0, y: 0, w: 260, h: 150, stage: 'mur', watered: true }, t)) });
  }
  const pen = { x: 960, fy: 0.55 };
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    if (Math.abs(a - Math.PI) < 0.2) continue;
    const p = { x: pen.x + Math.cos(a) * 190, fy: pen.fy + Math.sin(a) * 0.1 };
    const q = { x: pen.x + Math.cos(a + TAU / 18) * 190, fy: pen.fy + Math.sin(a + TAU / 18) * 0.1 };
    list.push({
      fy: p.fy,
      fn: () => {
        const sp = V.S(p.fy);
        ctx.save();
        ctx.translate(V.X(p.x, p.fy), V.Y(p.fy));
        ctx.scale(sp, sp);
        const nx = (V.X(q.x, q.fy) - V.X(p.x, p.fy)) / sp, ny = (V.Y(q.fy) - V.Y(p.fy)) / sp;
        drawPost(ctx, { x: 0, y: 0, next: Math.abs(a + TAU / 18 - Math.PI) < 0.2 ? null : { x: nx, y: ny } });
        ctx.restore();
      },
    });
  }
  for (let i = 0; i < 6; i++) {
    const sx = pen.x + Math.cos(i * 1.7) * 110, sfy = pen.fy + Math.sin(i * 1.7) * 0.05;
    put(sx, sfy, () => o.drawAnimal(ctx, i % 3 ? 'th-mouton' : 'th-chevre', i % 3 ? '#E8E2D4' : '#8A6A4A', 0, 0, 30, { seed: i, angle: Math.sin(t * 0.3 + i) > 0 ? 0 : Math.PI, speed: 0.1, walk: t + i }));
  }
  // les arbres et les palmiers autour
  for (const [x, fy, kind, r, s] of [[-780, 0.08, 'feuillu', 84, 1], [820, 0.1, 'pin', 80, 2], [-1300, 0.2, 'pin', 76, 3], [1320, 0.28, 'feuillu', 88, 4]]) {
    put(x, fy, () => drawTree(ctx, { x: 0, y: 0, r, kind, seed: s * 131 }, t, DAY_PAL));
  }
  if (city > 0) for (const [x, fy, s] of [[-640, 0.12, 1], [660, 0.16, 2], [-760, 0.86, 3], [780, 0.9, 4]]) put(x, fy, () => palm(ctx, 1.1 * city, t, s));
  // ---- le village (il s'efface) ----
  if (old > 0) {
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      if (Math.abs(a - Math.PI / 2) < 0.09) continue;
      const p = ring(a);
      list.push({ fy: p.fy, fn: () => { ctx.globalAlpha = old; at(ctx, V, p.x, p.fy, () => drawStake(ctx, { x: 0, y: 0, seed: i * 37, rope: i % 4 === 0 })); ctx.globalAlpha = 1; } });
    }
    const gp = ring(Math.PI / 2);
    list.push({ fy: gp.fy, fn: () => { ctx.globalAlpha = old; at(ctx, V, gp.x, gp.fy, () => drawGate(ctx, { x: 0, y: 0 }, t, true)); ctx.globalAlpha = 1; } });
    const fade = (fn) => () => { ctx.globalAlpha = old; fn(); ctx.globalAlpha = 1; };
    list.push({ fy: 0.48, fn: fade(() => at(ctx, V, 0, 0.48, () => drawHearth(ctx, { x: 0, y: 0, seed: 1 }, t, true, true))) });
    for (const [x, fy] of [[-260, 0.4], [250, 0.38], [40, 0.32]]) list.push({ fy, fn: fade(() => at(ctx, V, x, fy, () => drawHut(ctx, { x: 0, y: 0 }, t, DAY_PAL))) });
    list.push({ fy: 0.64, fn: fade(() => at(ctx, V, -200, 0.64, () => drawGranary(ctx, { x: 0, y: 0 }, t, DAY_PAL))) });
    for (const x of [-430, 430]) {
      list.push({ fy: 0.7, fn: fade(() => at(ctx, V, x, 0.7, () => drawTower(ctx, { x: 0, y: 0 }, t, (gx, gy) => o.drawAnimal(ctx, 'th-chasseur', '#7A5A3A', gx, gy, 24, { seed: 4, angle: Math.PI / 2, mood: 'happy' })))) });
    }
  }
  // ---- la ville (elle sort de terre) ----
  if (city > 0) {
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * TAU;
      if (Math.abs(a - Math.PI / 2) < 0.12) continue;
      const p = ring(a, 1.04);
      const k = clamp01(city * 1.6 - (i % 11) * 0.05);
      put(p.x, p.fy, () => wallBlock(ctx, 92, k));
    }
    const gp = ring(Math.PI / 2, 1.04);
    put(gp.x, gp.fy, () => cityGate(ctx, clamp01(city * 1.4 - 0.2)));
    put(0, 0.44, () => ziggurat(ctx, clamp01(city * 1.3 - 0.15), t));
    [[-330, 0.36], [330, 0.34], [-400, 0.6], [400, 0.58], [-190, 0.7], [200, 0.72], [-150, 0.27], [160, 0.26], [-460, 0.47], [470, 0.46]].forEach(([x, fy], i) => {
      put(x, fy, () => brickHouse(ctx, 1, i * 7 + 3, clamp01(city * 1.8 - i * 0.07)));
    });
    put(-70, 0.83, () => { ctx.globalAlpha = city; stall(ctx, '#C8302A'); ctx.globalAlpha = 1; });
    put(80, 0.85, () => { ctx.globalAlpha = city; stall(ctx, '#2E7AC8'); ctx.globalAlpha = 1; });
  }
  // les habitants qui se promènent
  for (let i = 0; i < 7; i++) {
    const a = t * 0.12 * (i % 2 ? 1 : -1) + i * 0.9;
    const x = Math.cos(a) * (180 + (i % 3) * 70), fy = 0.55 + Math.sin(a) * 0.12;
    const ang = (i % 2 ? 1 : -1) * (Math.sin(a) > 0 ? Math.PI : 0);
    put(x, fy, () => o.drawAnimal(ctx, 'th-tribu-village', '#B89A6A', 0, 0, 26, { seed: i * 1.3 + 0.2, angle: ang, speed: 0.6, walk: t * 2 + i }));
  }
  // (la ville) la charrette tirée par un bœuf : la roue !
  if (t > 6.5) {
    const k = (t - 6.5) / 8.5;
    const cx = lerp(-1500, 1500, k), cfy = 0.93;
    put(cx, cfy, () => {
      o.drawAnimal(ctx, 'th-aurochs', '#5A4434', 95, 0, 62, { seed: 2, angle: 0, speed: 0.5, walk: t * 1.6 });
      ctx.strokeStyle = '#5A3A22';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(30, -36);
      ctx.lineTo(80, -40);
      ctx.stroke();
      ctx.fillStyle = '#A8804E';
      ctx.strokeStyle = '#3A2414';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(-70, -66, 100, 34);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#E8C05A';
      ctx.beginPath();
      ctx.ellipse(-20, -70, 40, 12, 0, Math.PI, TAU);
      ctx.fill();
      wheel(ctx, -45, -22, 22, t * 4);
      wheel(ctx, 10, -22, 22, t * 4);
    });
  }
  // toi, le chef, devant la porte
  const hp = ring(Math.PI / 2, 1.25);
  put(hp.x - 90, Math.min(0.98, hp.fy), () => o.drawHero(ctx, 0, 0, 34, { angle: 0, front: true, speed: 0, walk: 0, mood: 'happy' }));
  list.sort((a, b) => a.fy - b.fy);
  for (const it of list) it.fn();
  // le défilé des inventions, dans le ciel
  const P = o.parade || [];
  const n = P.length;
  if (t > 10.2 && n) {
    const m = Math.min(w, h);
    // (sur un écran étroit, sur deux rangs)
    const cols = w < 700 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / cols);
    const R = Math.min(w / (cols * 2.6), m * 0.06);
    P.forEach((d, i) => {
      const k = ease((t - 10.4 - i * 0.42) / 0.5);
      if (k <= 0) return;
      const row = Math.floor(i / cols), col = i % cols, inRow = row < rows - 1 ? cols : n - cols * (rows - 1);
      const x = w * (0.5 + (col - (inRow - 1) / 2) / (cols + 0.6));
      // (en bas de l'écran : en haut, il y a la légende, puis le titre)
      const y = h - R * 2.3 - (rows - 1 - row) * R * 2.8 + Math.sin(t * 2 + i) * R * 0.08;
      const pop = 1 + Math.sin(k * Math.PI) * 0.25;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(k * pop, k * pop);
      const g = ctx.createRadialGradient(0, -R * 0.3, R * 0.2, 0, 0, R);
      g.addColorStop(0, '#FFF6D8');
      g.addColorStop(1, '#F2C24A');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#8A5A1A';
      ctx.lineWidth = Math.max(2, R * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (d.draw === 'roue') wheel(ctx, 0, 0, R * 0.55, t * 2);
      else if (d.draw === 'biface') biface(ctx, 0, 0, R * 0.62);
      else {
        ctx.font = `${Math.round(R * 1.05)}px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.icon, 0, R * 0.06);
      }
      ctx.font = `800 ${Math.max(11, Math.round(R * 0.36))}px 'Baloo 2', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(60, 36, 18, 0.85)';
      ctx.strokeText(d.name, 0, R * 1.12);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(d.name, 0, R * 1.12);
      ctx.restore();
    });
  }
  // (le texte de la fin) on assombrit un peu
  const dim = clamp01((t - o.textAt + 0.6) / 0.8);
  if (dim > 0) {
    ctx.fillStyle = `rgba(20, 16, 30, ${0.55 * dim})`;
    ctx.fillRect(0, 0, w, h);
  }
  const cap = o.captions.find(([a0, b0]) => t >= a0 && t < b0);
  if (cap && t < o.textAt) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}
