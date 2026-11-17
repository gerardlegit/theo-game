// ============================================================================
// Évolution — les animations des PREMIÈRES VILLES (vue de trois quarts) :
// le début et la fin du niveau (on peut passer le début). Même diorama que
// la voie des humains (intro-humains.js) : le ciel en haut, le sol vu de trois
// quarts en dessous, plus petit vers l'horizon.
//
// Le début (17 s) : le village devient une ville
//   0 → 4 s       le village du niveau 4 : les huttes, la palissade ronde
//   4 → 9 s       les siècles passent : la palissade s'enfonce, les remparts
//                 de pierre montent (un carré), les maisons de pierre et leurs
//                 toits de chaume sortent de terre, le marché s'installe
//   9 → 13 s      à gauche, le grand fleuve ; au loin, d'autres villages, avec
//                 leurs drapeaux « ? » : amis… ou ennemis ?
//   13 → 17 s     le héros, devant la grande porte
// La fin (16 s, puis le texte) : le monument terminé, la fête ; « 2 000 ans
// plus tard… » : les remparts sont tombés, mais le monument est toujours là,
// et les touristes le prennent en photo ; puis le défilé des inventions.
// ============================================================================

import { drawCaptionBox } from './intro.js';
import { view, at, sky, ground, wheel, drawParade } from './intro-humains.js';
import { drawHut, drawStake, drawTree, drawField, groundShadow, drawBush } from './art-humains.js';
import { drawWallH, drawWallV, drawCityTower, drawGateArch, drawStoneHouse, drawStall, drawWell, drawBanner, drawMonument, MONUMENTS } from './art-villes.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => 1 - (1 - clamp01(k)) ** 3;
const smooth = (k) => { const u = clamp01(k); return u * u * (3 - 2 * u); };

const DAY_PAL = { leaf: ['#3A5A28', '#4E7232', '#6A8A3E'], rock: '#8E8478', thatch: '#D2B060', bush: ['#4A6A3A', '#5E7E44', '#7A9A50'] };
const CITY = { x0: -560, x1: 560, f0: 0.3, f1: 0.8 };       // les remparts, dans le diorama
const HOUSES = [[-430, 0.4], [-250, 0.38], [250, 0.38], [430, 0.4], [-430, 0.6], [430, 0.6], [-300, 0.72], [300, 0.72]];
const STALLS = [[-120, 0.5, '#C8302A', 'ble'], [120, 0.5, '#3A6AC8', 'jarres'], [-150, 0.66, '#E8C05A', 'fruits'], [150, 0.66, '#6A8A3A', 'poissons']];

/** Le fleuve, à gauche, du fond jusqu'au devant */
function river(ctx, V, x, wd, t) {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const fy = -0.02 + i / 19;
    pts.push({ fy, x: x + Math.sin(fy * 5) * 70 });
  }
  ctx.fillStyle = '#7A8A4A';
  ctx.beginPath();
  pts.forEach((q, i) => (i ? ctx.lineTo(V.X(q.x - wd - 30, q.fy), V.Y(q.fy)) : ctx.moveTo(V.X(q.x - wd - 30, q.fy), V.Y(q.fy))));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(V.X(pts[i].x + wd + 30, pts[i].fy), V.Y(pts[i].fy));
  ctx.fill();
  ctx.fillStyle = '#3E8EB8';
  ctx.beginPath();
  pts.forEach((q, i) => (i ? ctx.lineTo(V.X(q.x - wd, q.fy), V.Y(q.fy)) : ctx.moveTo(V.X(q.x - wd, q.fy), V.Y(q.fy))));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(V.X(pts[i].x + wd, pts[i].fy), V.Y(pts[i].fy));
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const fy = ((i / 14 + t * 0.05) % 1), xx = x + Math.sin(fy * 5) * 70 + ((i % 3) - 1) * wd * 0.4;
    ctx.moveTo(V.X(xx, fy), V.Y(fy));
    ctx.lineTo(V.X(xx, fy + 0.02), V.Y(fy + 0.02));
  }
  ctx.stroke();
}

/** La ville carrée : les remparts (k : 0 → 1, ils montent), les tours, la porte */
function walls(list, ctx, V, k, o = {}) {
  if (k <= 0) return;
  const put = (x, fy, fn) => list.push({ fy, fn: () => at(ctx, V, x, fy, () => { ctx.scale(1, k); fn(); }) });
  const { x0, x1, f0, f1 } = CITY;
  // le fond et le devant : des morceaux est-ouest (le devant a une porte au milieu)
  for (const [fy, gate] of [[f0, false], [f1, true]]) {
    for (let x = x0 + 62; x < x1 - 30; x += 124) {
      if (gate && Math.abs(x) < 120) continue;
      if (o.ruin && (Math.round(x / 124) + (gate ? 1 : 0)) % 3 === 0) continue;
      put(x, fy, () => drawWallH(ctx, { x: 0, y: 0, len: 124, side: gate ? 1 : -1 }));
    }
    if (gate && !o.ruin) put(0, fy + 0.001, () => drawGateArch(ctx, { x: 0, y: 0, w: 200 }));
  }
  // les côtés : des blocs, du fond vers le devant
  for (const x of [x0, x1]) {
    for (let i = 1; i <= 16; i++) {
      const fy = lerp(f0, f1, i / 16), fyp = lerp(f0, f1, (i - 1) / 16);
      if (o.ruin && i % 4 === 1) continue;
      const len = (V.Y(fy) - V.Y(fyp)) / V.S(fy);
      put(x, fy, () => drawWallV(ctx, { x: 0, y: 0, len, side: x < 0 ? -1 : 1 }));
    }
  }
  if (!o.ruin) for (const x of [x0, x1]) for (const fy of [f0, f1]) put(x, fy + 0.002, () => drawCityTower(ctx, { x: 0, y: 0, r: 86, h: 232, flag: fy === f0 ? '#C8302A' : null }));
}

/* ============================================================================
   LE DÉBUT : LE VILLAGE DEVIENT UNE VILLE
   ============================================================================ */
const INTRO_T = 17;
const INTRO_CAPS = [
  [0.3, 4, "Il y a 6 000 ans. Te souviens-tu de ton village, avec sa palissade et ses huttes ? Les siècles passent…"],
  [4.3, 9, "La palissade est devenue un haut rempart de pierre. Les maisons sont en pierre, avec des toits de chaume. Au milieu : le marché !"],
  [9.3, 13, "Mais de l'autre côté du grand fleuve, il y a d'autres villages. Sont-ils amis… ou ennemis ?"],
  [13.2, 17, "Ta ville est prête à grandir encore : ponts, routes, échanges… et un jour, un monument immense ! À toi de jouer !"],
];

export function createCityIntro({ sfx, drawHero, drawAnimal }) {
  let t = 0;
  const cues = new Set();
  const cue = (name, when, fn) => { if (t >= when && !cues.has(name)) { cues.add(name); fn(); } };
  const intro = {
    done: false,
    update(dt) {
      t += dt;
      cue('time', 4.1, () => sfx.time());
      cue('walls', 5.4, () => sfx.build());
      cue('market', 7.6, () => sfx.chapter());
      cue('far', 9.6, () => sfx.alert());
      cue('hero', 13.4, () => sfx.victory());
      if (t >= INTRO_T) intro.done = true;
    },
    draw(ctx, w, h) {
      const V = view(w, h, 2600);
      sky(ctx, V, t, false);
      ground(ctx, V, '#9AAE6A', '#7E9A48', 'rgba(70, 100, 40, 0.45)');
      river(ctx, V, -1150, 120, t);
      const old = 1 - smooth((t - 4.2) / 1.6);       // le village s'efface
      const city = smooth((t - 4.8) / 3.4);          // la ville monte
      const list = [];
      const put = (x, fy, fn, k = 1) => list.push({ fy, fn: () => at(ctx, V, x, fy, fn, k) });
      // les champs, à gauche, entre la ville et le fleuve
      for (const [x, fy] of [[-850, 0.42], [-850, 0.62], [-760, 0.82]]) list.push({ fy: fy - 0.1, fn: () => at(ctx, V, x, fy, () => drawField(ctx, { x: 0, y: 0, w: 230, h: 130, stage: 'mur', watered: true }, t)) });
      // les arbres autour
      for (const [x, fy, kind, r, s] of [[820, 0.12, 'pin', 80, 2], [950, 0.5, 'feuillu', 88, 4], [880, 0.9, 'feuillu', 84, 5], [-620, 0.08, 'pin', 74, 6]]) {
        put(x, fy, () => drawTree(ctx, { x: 0, y: 0, r, kind, seed: s * 131 }, t, DAY_PAL));
      }
      // ---- le village (il s'efface) ----
      if (old > 0) {
        const fade = (fn) => () => { ctx.globalAlpha = old; fn(); ctx.globalAlpha = 1; };
        for (let i = 0; i < 56; i++) {
          const a = (i / 56) * TAU;
          if (Math.abs(a - Math.PI / 2) < 0.1) continue;
          const x = Math.cos(a) * 520, fy = 0.55 + Math.sin(a) * 0.25;
          list.push({ fy, fn: fade(() => at(ctx, V, x, fy, () => { ctx.scale(1, 0.3 + old * 0.7); drawStake(ctx, { x: 0, y: 0, seed: i * 37, rope: i % 4 === 0 }); })) });
        }
        for (const [x, fy] of [[-260, 0.45], [250, 0.43], [40, 0.36], [-120, 0.62], [200, 0.64]]) list.push({ fy, fn: fade(() => at(ctx, V, x, fy, () => drawHut(ctx, { x: 0, y: 0 }, t, DAY_PAL))) });
      }
      // ---- la ville (elle sort de terre) ----
      walls(list, ctx, V, clamp01(city * 1.4));
      HOUSES.forEach(([x, fy], i) => {
        const k = clamp01(city * 1.8 - 0.3 - i * 0.06);
        if (k > 0) put(x, fy, () => { ctx.scale(1, k); drawStoneHouse(ctx, { x: 0, y: 0, v: i * 3 + 1 }, DAY_PAL.thatch); });
      });
      const mk = clamp01((t - 7.4) / 1);
      if (mk > 0) {
        for (const [x, fy, col, goods] of STALLS) put(x, fy, () => { ctx.globalAlpha = mk; drawStall(ctx, { x: 0, y: 0, col, goods }); ctx.globalAlpha = 1; });
        put(0, 0.58, () => { ctx.globalAlpha = mk; drawWell(ctx, { x: 0, y: 0 }, t); ctx.globalAlpha = 1; });
      }
      // les habitants qui se promènent
      for (let i = 0; i < 7; i++) {
        const a = t * 0.15 * (i % 2 ? 1 : -1) + i * 0.9;
        const x = Math.cos(a) * (120 + (i % 3) * 80), fy = 0.6 + Math.sin(a) * 0.08;
        const look = city > 0.5 ? 'th-citadin' : 'th-tribu-village';
        put(x, fy, () => drawAnimal(ctx, look, '#C2A878', 0, 0, 26, { seed: i * 1.3 + 0.2, angle: Math.sin(a) > 0 ? Math.PI : 0, speed: 0.6, walk: t * 2 + i }));
      }
      // ---- au loin, les autres villages (leurs drapeaux « ? ») ----
      const far = ease((t - 9.2) / 0.8);
      if (far > 0) {
        for (const [x, fy, s] of [[-1700, 0.12, 1], [1500, 0.02, 2], [-200, -0.04, 3]]) {
          for (const dx of [-90, 0, 90]) put(x + dx, fy + Math.abs(dx) * 0.0001, () => { ctx.globalAlpha = far; drawHut(ctx, { x: 0, y: 0, r: 60 }, t, DAY_PAL); ctx.globalAlpha = 1; });
          put(x + 150, fy + 0.01, () => { ctx.globalAlpha = far; ctx.scale(far, far); drawBanner(ctx, { x: 0, y: 0, state: '?', col: '#9A9A9A' }, t + s); ctx.globalAlpha = 1; });
        }
      }
      // le héros, devant la porte
      const hk = ease((t - 13) / 1.2);
      if (hk > 0) put(-90, 0.9, () => drawHero(ctx, 0, 0, 34, { angle: 0, front: true, speed: 0, walk: 0, mood: 'happy' }));
      list.sort((a, b) => a.fy - b.fy);
      for (const o of list) o.fn();
      // les siècles qui passent : un voile doré
      const veil = Math.max(0, 1 - Math.abs(t - 4.6) / 0.6) * 0.5;
      if (veil > 0) {
        ctx.fillStyle = `rgba(255, 240, 200, ${veil})`;
        ctx.fillRect(0, 0, w, h);
      }
      const cap = INTRO_CAPS.find(([a0, b0]) => t >= a0 && t < b0);
      if (cap) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
    },
  };
  return intro;
}

/* ============================================================================
   LA FIN : LE MONUMENT… ET LES TOURISTES, 2 000 ANS PLUS TARD
   ============================================================================ */
/** Le car des touristes (une boîte à roues, avec ses vitres) */
function bus(ctx, x, y, t) {
  groundShadow(ctx, x, y + 4, 180, 22, 0.3);
  ctx.fillStyle = '#F2C24A';
  ctx.strokeStyle = '#5A4020';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - 170, y - 150, 340, 128, 24) : ctx.rect(x - 170, y - 150, 340, 128);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#E8443A';
  ctx.fillRect(x - 168, y - 62, 336, 14);
  ctx.fillStyle = '#9ED2F2';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 150 + i * 58, y - 134, 48, 50, 8) : ctx.rect(x - 150 + i * 58, y - 134, 48, 50);
    ctx.fill();
    ctx.stroke();
    // des têtes aux fenêtres
    ctx.fillStyle = ['#C68A5A', '#E2B48A', '#8D5A3A', '#B07A52', '#E2B48A'][i];
    ctx.beginPath();
    ctx.arc(x - 126 + i * 58, y - 100, 12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9ED2F2';
  }
  for (const wx of [x - 110, x + 110]) wheel(ctx, wx, y - 18, 26, t * 3);
  ctx.fillStyle = '#FFF6C8';
  ctx.beginPath();
  ctx.arc(x + 160, y - 44, 10, 0, TAU);
  ctx.fill();
}

/** Le panneau du site historique */
function sign(ctx, x, y, name) {
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 50, y);
  ctx.lineTo(x - 50, y - 110);
  ctx.moveTo(x + 50, y);
  ctx.lineTo(x + 50, y - 110);
  ctx.stroke();
  ctx.fillStyle = '#6A4A2A';
  ctx.strokeStyle = '#2A1A0C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - 90, y - 170, 180, 74, 10) : ctx.rect(x - 90, y - 170, 180, 74);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F8F0DC';
  ctx.font = "800 20px 'Baloo 2', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Site historique', x, y - 148);
  ctx.font = "700 15px 'Baloo 2', sans-serif";
  ctx.fillText(name, x, y - 120);
}

/**
 * La fin (environ 16 s, puis le texte).
 * o : { captions, parade, textAt, monument (sa forme), drawHero, drawAnimal }
 */
export function drawCityEnding(ctx, w, h, t, o) {
  const V = view(w, h, 2100);
  const today = t >= 6;                          // 2 000 ans plus tard
  sky(ctx, V, t, false);
  ground(ctx, V, today ? '#A8B470' : '#9AAE6A', today ? '#86A050' : '#7E9A48', 'rgba(70, 100, 40, 0.45)');
  const list = [];
  const put = (x, fy, fn, k = 1) => list.push({ fy, fn: () => at(ctx, V, x, fy, fn, k) });
  const kind = o.monument || 'pyramide';
  // le grand monument, au fond
  put(160, 0.4, () => drawMonument(ctx, { x: 0, y: 0, w: 520, d: 420 }, kind, 1, t, { done: true, ruin: today }), kind === 'phare' ? 0.62 : kind === 'pyramide' ? 0.74 : 0.85);
  // la ville, à gauche (ses remparts, ses maisons) : 2 000 ans plus tard, des ruines
  if (!today) {
    for (const [x, fy, i] of [[-980, 0.3, 1], [-760, 0.28, 2], [-1060, 0.52, 3], [-840, 0.5, 4]]) put(x, fy, () => drawStoneHouse(ctx, { x: 0, y: 0, v: i * 3 }, DAY_PAL.thatch), 0.9);
    put(-640, 0.62, () => drawStall(ctx, { x: 0, y: 0, col: '#C8302A', goods: 'pain' }));
    put(-470, 0.7, () => drawStall(ctx, { x: 0, y: 0, col: '#3A6AC8', goods: 'jarres' }));
  } else {
    for (let i = 0; i < 6; i++) {
      const x = -1150 + i * 140, fy = 0.42 + (i % 2) * 0.03;
      put(x, fy, () => { ctx.scale(1, 0.28 + (i % 3) * 0.12); drawWallH(ctx, { x: 0, y: 0, len: 110 }); });
    }
    put(-620, 0.66, () => sign(ctx, 0, 0, (MONUMENTS[kind] || MONUMENTS.pyramide).name));
  }
  // les arbres, les palmiers
  for (const [x, fy, kind2, r, s] of [[-1250, 0.16, 'pin', 76, 3], [1150, 0.2, 'feuillu', 86, 4], [1250, 0.66, 'pin', 80, 5], [-1300, 0.86, 'feuillu', 90, 6]]) {
    put(x, fy, () => drawTree(ctx, { x: 0, y: 0, r, kind: kind2, seed: s * 131 }, t, DAY_PAL));
  }
  for (const [x, fy, r, s] of [[860, 0.58, 56, 1], [-280, 0.86, 50, 2]]) put(x, fy, () => drawBush(ctx, { x: 0, y: 0, r, seed: s * 977 }, t, DAY_PAL));
  if (!today) {
    // la fête : les habitants, les ouvriers, les enfants sautent de joie
    const looks = ['th-citadin', 'th-ouvrier', 'th-citadin', 'th-eleve', 'th-ouvrier', 'th-citadin', 'th-citadin', 'th-eleve', 'th-ouvrier', 'th-citadin'];
    looks.forEach((look, i) => {
      const x = -420 + i * 100 + Math.sin(i * 2.1) * 30, fy = 0.72 + (i % 3) * 0.06;
      const hop = Math.abs(Math.sin(t * 5 + i)) * 14;
      put(x, fy, () => o.drawAnimal(ctx, look, '#C2A878', 0, -hop, 26, { seed: i * 1.7 + 0.4, angle: i % 2 ? 0 : Math.PI, mood: 'happy', front: true, speed: 0, walk: 0 }));
    });
    put(60, 0.96, () => o.drawHero(ctx, 0, 0, 34, { angle: 0, front: true, speed: 0, walk: 0, mood: 'happy' }));
  } else {
    // les touristes : une file derrière le guide et son drapeau, qui fait le tour du monument
    const lead = (t - 6) * 0.06;
    for (let i = 0; i < 9; i++) {
      const u = lead - i * 0.035;
      const x = lerp(-700, 700, (Math.sin(u * TAU * 0.5) + 1) / 2), fy = 0.66 + Math.cos(u * TAU * 0.5) * 0.05;
      const dir = Math.cos(u * TAU * 0.5) >= 0 ? 0 : Math.PI;
      put(x, fy, () => o.drawAnimal(ctx, i === 0 ? 'th-guide' : 'th-touriste', '#E8443A', 0, 0, 26, { seed: i * 2.3 + 1.1, angle: dir, speed: 0.6, walk: t * 2 + i, mood: 'happy' }));
    }
    // ceux qui s'arrêtent pour prendre une photo
    for (const [x, fy, s] of [[-120, 0.86, 7.7], [380, 0.84, 9.1], [640, 0.78, 5.3]]) put(x, fy, () => o.drawAnimal(ctx, 'th-touriste', '#3A8AE8', 0, 0, 26, { seed: s, angle: Math.PI / 2, front: true, speed: 0, walk: 0, mood: 'happy' }));
    // le car, qui arrive sur la route
    const bx = lerp(1700, 760, ease((t - 6.4) / 3));
    put(bx, 0.97, () => bus(ctx, 0, 0, t * (bx > 770 ? 1 : 0)));
  }
  list.sort((a, b) => a.fy - b.fy);
  for (const it of list) it.fn();
  // « 2 000 ans plus tard… »
  const k = 1 - Math.abs(t - 6) / 0.9;
  if (k > 0) {
    ctx.fillStyle = `rgba(250, 244, 228, ${clamp01(k * 1.3)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = clamp01(k * 1.6);
    ctx.fillStyle = '#3A2A14';
    ctx.font = `800 ${Math.round(Math.min(w, h) * 0.08)}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2 000 ans plus tard…', w / 2, h / 2);
    ctx.globalAlpha = 1;
  }
  // les flashs des appareils photo
  if (today && t > 7 && Math.sin(t * 3.1) > 0.97) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(0, 0, w, h);
  }
  drawParade(ctx, w, h, t, o.parade || [], 11.2);
  const dim = clamp01((t - o.textAt + 0.6) / 0.8);
  if (dim > 0) {
    ctx.fillStyle = `rgba(20, 16, 30, ${0.55 * dim})`;
    ctx.fillRect(0, 0, w, h);
  }
  const cap = o.captions.find(([a0, b0]) => t >= a0 && t < b0);
  if (cap && t < o.textAt) drawCaptionBox(ctx, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}
