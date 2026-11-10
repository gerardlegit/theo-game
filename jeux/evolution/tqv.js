// ============================================================================
// Évolution — le monde en VUE DE TROIS QUARTS (world.view === 'tqv') : la
// voie des humains. On ne mange plus : on ramasse, on invente, on construit.
// Rien ici ne connaît une espèce par son nom ; ce que l'on construit et où,
// c'est le niveau qui le dit (world.sites).
//
//   - La carte : une rivière, une grotte, des forêts, des rochers, et ce qu'on
//     ramasse (du bois mort, du silex, de l'ocre, du blé sauvage), l'arbre
//     frappé par la foudre (le premier feu). Elle reste la même d'un chapitre
//     à l'autre : le village grandit, et ce qu'on a construit reste.
//   - Les gestes : on ramasse en touchant ; on rapporte le feu (ou l'eau) ;
//     on s'arrête sur un plan pour construire (s'il y a assez de bois…) ;
//     on arrose les champs, on récolte le blé mûr.
//   - Les obstacles (arbres, rochers, huttes, palissade), la lance qu'on
//     lance, les attaques des pillards des autres villages, la nuit et ses
//     lumières, le radar.
// (Les dessins sont dans art-humains.js.)
// ============================================================================

import { shade } from './art.js';
import {
  drawTree, drawFireTree, drawRock, drawResource, drawBush, drawGrass, drawCave, drawHearth, drawHut, drawPost,
  drawField, drawGranary, drawStake, drawGate, drawTower, drawPlan, drawResIcon, groundShadow, flame,
} from './art-humains.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Réglages ---------- */
const GATHER_TIME = 0.42;          // s pour ramasser une unité
const BUILD_TIME = 1.6;            // s immobile sur un plan pour construire
const HARVEST_TIME = 0.9;
const GROW_TIME = 24;              // s pour que le blé pousse (après l'arrosage)
const REGROW = 28;                 // s avant qu'un tas de bois ou de silex revienne
const SPEAR_SPEED = 950;
const CELL = 220;                  // la grille des obstacles
const GATE_GAP = 150;              // l'ouverture de la palissade, que ferme la grande porte
const WALL_HP = 300;               // la solidité d'un morceau de palissade (un pillard tape 12 par seconde)

export function createTqv(api) {
  const on = () => api.level().world.view === 'tqv';
  let M = null;
  let spears = [];
  let raid = null;
  let nightCv = null;

  /* ============================================================================
     LA CARTE (une seule fois par niveau : elle reste la même d'un chapitre à l'autre)
     ============================================================================ */
  function build(seed) {
    const W = api.level().world, L = W.land || {};
    const rnd = mulberry32(seed);
    const R = (a, b) => a + rnd() * (b - a);
    const V = { x: W.village.x, y: W.village.y };
    const VR = W.villageR || 1150;
    const items = [];
    // la rivière, qui serpente du haut vers le bas de la carte
    const river = [];
    const rx = L.riverX ?? W.w * 0.3;
    for (let y = -200; y <= W.h + 200; y += 260) river.push({ x: rx + Math.sin(y / 900) * 260 + Math.sin(y / 330 + 1.3) * 80, y });
    const riverW = L.riverW || 210;
    const nearRiver = (x, y, m = 0) => riverDist(river, x, y) < riverW / 2 + m;
    // la grotte, au nord du village
    const cave = { type: 'grotte', x: V.x + (L.caveDx ?? 500), y: V.y + (L.caveDy ?? -1900), r: 210, seed: 11, solid: true };
    items.push(cave);
    const free = (x, y, m) => x > 150 && y > 150 && x < W.w - 150 && y < W.h - 150 && Math.hypot(x - V.x, y - V.y) > VR + 180 + m
      && !nearRiver(x, y, m + 30) && Math.hypot(x - cave.x, y - (cave.y - 80)) > cave.r * 1.7 + m;
    // l'arbre frappé par la foudre (le premier feu)
    if (L.fireTree) items.push({ type: 'arbre-feu', x: V.x + L.fireTree[0], y: V.y + L.fireTree[1], r: 70, seed: 3, solid: true, from: 1, to: 1 });
    // les forêts
    for (let k = 0; k < (L.forests || 9); k++) {
      let cx, cy, tries = 0;
      do { cx = R(300, W.w - 300); cy = R(300, W.h - 300); tries++; } while (!free(cx, cy, 200) && tries < 60);
      const n = Math.floor(R(10, 22));
      for (let i = 0; i < n; i++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * R(250, 520);
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (!free(x, y, 40) || items.some((o) => o.type === 'arbre' && Math.hypot(o.x - x, o.y - y) < 110)) continue;
        const kind = rnd() < 0.45 ? 'pin' : rnd() < 0.4 ? 'bouleau' : 'feuillu';
        items.push({ type: 'arbre', kind, x, y, r: R(60, 95), seed: Math.floor(rnd() * 1e6), solid: true });
      }
      // du bois mort au bord de chaque forêt
      for (let i = 0; i < 4; i++) {
        const a = rnd() * TAU, d = R(300, 600);
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (free(x, y, 30)) items.push({ type: 'bois', x, y, r: 42, seed: Math.floor(rnd() * 1e6), amount: 3, max: 3, res: 'bois' });
      }
    }
    // du bois mort aussi près du village (pour bien commencer)
    for (let i = 0; i < (L.woodNear || 8); i++) {
      const a = rnd() * TAU, d = R(VR * 0.55, VR + 650);
      const x = V.x + Math.cos(a) * d, y = V.y + Math.sin(a) * d;
      if (!nearRiver(x, y, 40)) items.push({ type: 'bois', x, y, r: 42, seed: Math.floor(rnd() * 1e6), amount: 3, max: 3, res: 'bois' });
    }
    // les rochers, et le silex au bord de la rivière et près de la grotte
    for (let i = 0; i < (L.rocks || 40); i++) {
      const x = R(200, W.w - 200), y = R(200, W.h - 200);
      if (free(x, y, 60)) items.push({ type: 'rocher', x, y, r: R(30, 70), seed: Math.floor(rnd() * 1e6), solid: true });
    }
    for (let i = 0; i < (L.flint || 18); i++) {
      const byRiver = i % 3 !== 2;
      const y = R(300, W.h - 300);
      const x = byRiver ? riverX(river, y) + (rnd() < 0.5 ? -1 : 1) * (riverW / 2 + R(60, 220)) : cave.x + R(-700, 700);
      const yy = byRiver ? y : cave.y + R(250, 600);
      if (Math.hypot(x - V.x, yy - V.y) < VR + 100) continue;
      items.push({ type: 'silex', x, y: yy, r: 46, seed: Math.floor(rnd() * 1e6), amount: 3, max: 3, res: 'silex', solid: false });
    }
    // l'ocre, la terre rouge des peintres, au pied de la grotte
    for (let i = 0; i < (L.ochre || 6); i++) {
      items.push({ type: 'ocre', x: cave.x + R(-650, 650), y: cave.y + R(220, 520), r: 40, seed: Math.floor(rnd() * 1e6), amount: 2, max: 2, res: 'ocre', from: L.ochreFrom || 2 });
    }
    // le blé sauvage, dans une prairie (à partir du chapitre de l'agriculture)
    const meadow = { x: V.x + (L.meadow ? L.meadow[0] : -1500), y: V.y + (L.meadow ? L.meadow[1] : 1700) };
    for (let i = 0; i < (L.wheat || 26); i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 700;
      const x = meadow.x + Math.cos(a) * d, y = meadow.y + Math.sin(a) * d * 0.7;
      if (nearRiver(x, y, 40) || Math.hypot(x - V.x, y - V.y) < VR + 80) continue;
      items.push({ type: 'ble', x, y, r: 34, seed: Math.floor(rnd() * 1e6), amount: 2, max: 2, res: 'ble', from: L.wheatFrom || 4 });
    }
    // les buissons et les hautes herbes (on s'y cache)
    for (let i = 0; i < (L.bushes || 60); i++) {
      const x = R(200, W.w - 200), y = R(200, W.h - 200);
      if (free(x, y, 0)) items.push({ type: rnd() < 0.5 ? 'buisson' : 'herbes', x, y, r: R(50, 80), seed: Math.floor(rnd() * 1e6), hide: true });
    }
    items.sort((a, b) => a.y - b.y);
    // les plans du village (ce que le niveau propose de construire)
    const sites = (W.sites || []).flatMap((s) => expandSite(s, V, VR, cave));
    M = { W, L, V, VR, river, riverW, cave, items, sites, meadow, grid: null, stakes: [], posts: [], lights: [] };
    refresh();
    return M;
  }

  /** Un plan du niveau devient un (ou plusieurs) emplacements : la palissade fait le tour du village */
  function expandSite(s, V, VR, cave) {
    if (s.ring) {
      // la palissade : n morceaux d'arc tout autour du village ; il ne reste qu'une ouverture,
      // juste assez large pour la grande porte (GATE_GAP)
      const out = [];
      const n = s.ring;
      const gateA = s.gate ?? Math.PI / 2;
      const gap = GATE_GAP / VR, step = (TAU - gap) / n;
      for (let i = 0; i < n; i++) {
        const a0 = gateA + gap / 2 + i * step, a1 = a0 + step;
        out.push({ ...s, id: `${s.id}-${i}`, a0, a1, R: VR, x: V.x + Math.cos((a0 + a1) / 2) * VR, y: V.y + Math.sin((a0 + a1) / 2) * VR, arc: true });
      }
      return out;
    }
    if (s.type === 'porte') {
      // la grande porte : dans l'ouverture de la palissade
      const a = s.angle ?? Math.PI / 2;
      return [{ ...s, x: V.x + Math.cos(a) * VR, y: V.y + Math.sin(a) * VR, a }];
    }
    // ('grotte') devant l'entrée de la grotte (on ne peut pas entrer dans la roche)
    const at = s.at === 'grotte' ? { x: cave.x, y: cave.y + 240 } : { x: V.x + s.at[0], y: V.y + s.at[1] };
    return [{ ...s, x: at.x, y: at.y }];
  }

  /* ---------- Ce qui a été construit : les obstacles, les lumières, l'enclos ---------- */
  function refresh() {
    const g = api.game();
    const ch = g.chapter + 1;
    g.built = g.built || {};
    g.fields = g.fields || {};
    const solids = [];
    for (const it of M.items) {
      if (!active(it, ch)) continue;
      if (it.solid) solids.push({ x: it.x, y: it.y - (it.type === 'grotte' ? 60 : 0), r: it.type === 'arbre' ? 26 : it.type === 'grotte' ? it.r * 1.25 : it.type === 'arbre-feu' ? 30 : it.r * 0.85, item: it });
    }
    M.stakes = [];
    M.posts = [];
    M.lights = [];
    M.pens = [];
    for (const s of M.sites) {
      const b = g.built[s.id];
      if (!b) continue;
      if (s.type === 'hutte') solids.push({ x: s.x, y: s.y - 20, r: 80 });
      if (s.type === 'grenier') solids.push({ x: s.x, y: s.y, r: 70 });
      if (s.type === 'tour') solids.push({ x: s.x, y: s.y, r: 45 });
      if (s.type === 'foyer') M.lights.push({ x: s.x, y: s.y, r: 420, warm: 330, fear: 460, site: s });
      if (s.type === 'feu') M.lights.push({ x: s.x, y: s.y, r: 320, warm: 230, fear: 380, site: s });
      if (s.type === 'enclos') {
        // l'enclos : un cercle de piquets, avec une porte (les moutons entrent par là)
        const pen = { x: s.x, y: s.y, r: s.r || 240, gate: s.gate ?? Math.PI, gateW: 0.7, zone: 'pen' };
        M.pens.push(pen);
        const n = 22;
        const posts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          if (Math.abs(((a - pen.gate + Math.PI) % TAU + TAU) % TAU - Math.PI) < pen.gateW / 2) continue;
          posts.push({ x: pen.x + Math.cos(a) * pen.r * 0.85, y: pen.y + Math.sin(a) * pen.r * 0.85, a, gate: false });
        }
        // (les deux poteaux de la porte sont plus gros)
        for (const s2 of [-1, 1]) {
          const a = pen.gate + s2 * pen.gateW / 2;
          posts.push({ x: pen.x + Math.cos(a) * pen.r * 0.85, y: pen.y + Math.sin(a) * pen.r * 0.85, a, gate: true });
        }
        posts.sort((a, b) => a.a - b.a);
        posts.forEach((p, i) => {
          const q = posts[(i + 1) % posts.length];
          if (!p.gate || !q.gate) p.next = Math.abs(q.a - p.a) < (TAU / n) * 1.6 ? q : null;
        });
        M.posts.push(...posts);
      }
      if (s.arc) {
        // la palissade : des pieux plantés serré (cassés, si les pillards ont forcé le passage)
        const len = (s.a1 - s.a0) * s.R;
        const n = Math.max(4, Math.round(len / 30));
        for (let i = 0; i < n; i++) {
          const a = lerp(s.a0, s.a1, (i + 0.5) / n);
          const st = { x: M.V.x + Math.cos(a) * s.R, y: M.V.y + Math.sin(a) * s.R, seed: (i * 37 + s.a0 * 100) | 0, broken: b === 'casse', rope: i % 4 === 0, site: s };
          M.stakes.push(st);
          if (b !== 'casse') solids.push({ x: st.x, y: st.y, r: 17, wall: s });
        }
      }
      if (s.type === 'porte') solids.push({ x: s.x, y: s.y, r: GATE_GAP / 2, gate: true, site: s });
    }
    // (le feu de l'arbre frappé par la foudre)
    for (const it of M.items) if (it.type === 'arbre-feu' && active(it, ch)) M.lights.push({ x: it.x, y: it.y - 90, r: 470, warm: 260, fear: 420, tree: it });
    // la grille des obstacles (pour aller vite)
    const grid = new Map();
    for (const s of solids) {
      const i0 = Math.floor((s.x - s.r) / CELL), i1 = Math.floor((s.x + s.r) / CELL);
      const j0 = Math.floor((s.y - s.r) / CELL), j1 = Math.floor((s.y + s.r) / CELL);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const k = i * 1000 + j;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(s);
      }
    }
    M.grid = grid;
    M.hides = M.items.filter((it) => it.hide && active(it, ch)).map((it) => ({ x: it.x, y: it.y - it.r * 0.4, r: it.r * 0.9 }));
  }
  const active = (it, ch) => (it.from || 1) <= ch && (it.to || 99) >= ch;

  /* ============================================================================
     LES QUESTIONS SUR LE MONDE
     ============================================================================ */
  function riverDist(river, x, y) {
    let best = Infinity;
    for (let i = 0; i + 1 < river.length; i++) {
      const a = river[i], b = river[i + 1];
      if (y < a.y - 400 || y > b.y + 400) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const k = clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
      best = Math.min(best, Math.hypot(x - (a.x + dx * k), y - (a.y + dy * k)));
    }
    return best;
  }
  function riverX(river, y) {
    for (let i = 0; i + 1 < river.length; i++) if (y >= river[i].y && y <= river[i + 1].y) return lerp(river[i].x, river[i + 1].x, (y - river[i].y) / (river[i + 1].y - river[i].y));
    return river[0].x;
  }
  /** 'water' dans la rivière, 'feu' au chaud près d'un feu, 'camp' dans le village */
  function zoneAt(x, y) {
    if (!M) return null;
    if (riverDist(M.river, x, y) < M.riverW / 2) return 'water';
    for (const l of M.lights) if (Math.hypot(x - l.x, y - l.y) < l.warm) return 'feu';
    for (const p of M.pens) if (Math.hypot(x - p.x, y - p.y) < p.r * 0.85) return 'pen';
    if (Math.hypot(x - M.V.x, y - M.V.y) < M.VR) return 'camp';
    return null;
  }
  const inVillage = (x, y, m = 0) => Math.hypot(x - M.V.x, y - M.V.y) < M.VR + m;
  const palisadeDone = () => M.sites.some((s) => s.arc) && M.sites.filter((s) => s.arc).every((s) => api.game().built[s.id] === true);

  /** On ne passe pas à travers les arbres, les rochers, les huttes, la palissade.
      who : 'ami' (le joueur, la tribu : ils passent la porte) ou 'sauvage' */
  function collide(e, rad, who) {
    if (!M) return;
    const i = Math.floor(e.x / CELL), j = Math.floor(e.y / CELL);
    let hitWall = null;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const list = M.grid.get((i + di) * 1000 + (j + dj));
      if (!list) continue;
      for (const s of list) {
        if (s.gate && who === 'ami') continue;
        // (un pillard en déroute escalade la palissade pour rentrer chez lui)
        if ((s.wall || s.gate) && e.routed) continue;
        const dx = e.x - s.x, dy = e.y - s.y, d = Math.hypot(dx, dy) || 0.01;
        const m = s.r + rad;
        if (d >= m) continue;
        e.x = s.x + dx / d * m;
        e.y = s.y + dy / d * m;
        if (s.wall || s.gate) hitWall = s;
        if (e.wx !== undefined && !s.wall) { e.wx = e.x + dx / d * 260; e.wy = e.y + dy / d * 260; }
      }
    }
    e.hitWall = hitWall;
  }

  /* ============================================================================
     LES GESTES DU JOUEUR : ramasser, porter, construire, arroser, récolter
     ============================================================================ */
  function interact(p, dt) {
    if (!M || p.dead) return;
    const g = api.game(), ch = g.chapter + 1;
    g.res = g.res || {};
    g.gathered = g.gathered || {};
    // ramasser (en touchant le tas)
    let node = null, nd = Infinity;
    for (const it of M.items) {
      if (!it.res || !active(it, ch) || it.amount <= 0) continue;
      const d = Math.hypot(it.x - p.x, it.y - p.y);
      if (d < it.r + p.size * 0.9 && d < nd) { nd = d; node = it; }
    }
    if (node) {
      p.gatherT = (p.gatherT || 0) + dt;
      p.working = node.res;
      // (le silex taillé : un outil qui coupe, on ramasse plus vite)
      if (p.gatherT >= GATHER_TIME / (api.stats().gather || 1)) {
        p.gatherT = 0;
        node.amount--;
        if (node.amount <= 0) node.regrowT = REGROW;
        g.res[node.res] = (g.res[node.res] || 0) + 1;
        g.gathered[node.res] = (g.gathered[node.res] || 0) + 1;
        api.floater(`+1 ${api.resName(node.res)}`, node.x, node.y - node.r * 1.6, '#FFE58A', 0.9);
        api.deed(1, node.x + 20, node.y - node.r * 2.2, true);
        api.sfx.pickup();
        for (let i = 0; i < 4; i++) api.particles().push({ x: node.x + (Math.random() - 0.5) * node.r, y: node.y - node.r * 0.4, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 100, life: 0, max: 0.5, size: 4, color: node.res === 'bois' ? '#8A6440' : node.res === 'silex' ? '#C8C8D2' : node.res === 'ocre' ? '#D8743A' : '#E8C05A' });
        api.sayOnce(`gather-${node.res}`, api.lines()[`gather_${node.res}`], 120, 1);
        api.changed();
      }
    } else {
      p.gatherT = 0;
      p.working = null;
    }
    // le feu de l'arbre frappé par la foudre : on en prend une branche
    for (const l of M.lights) {
      if (!l.tree || p.carry === 'feu' || Math.hypot(l.tree.x - p.x, l.tree.y - p.y) > 150) continue;
      if (M.sites.some((s) => s.cost && s.cost.feu && !g.built[s.id])) {
        p.carry = 'feu';
        api.floater('Tu as le feu !', p.x, p.y - p.size * 3, '#FFB36B', 1.3);
        api.say(api.lines().fireTaken, 2, 6000);
        api.sfx.chapter();
      }
    }
    // l'eau de la rivière, dans la jarre
    if (p.carry !== 'eau' && g.owned.poterie && zoneAt(p.x, p.y) === 'water' && Object.values(g.fields).some((f) => f.stage === 'seme' && !f.watered)) {
      p.carry = 'eau';
      api.floater('De l’eau !', p.x, p.y - p.size * 3, '#9EE7FF', 1.2);
      api.sayOnce('water', api.lines().waterTaken, 60, 1);
      api.sfx.splash();
    }
    // construire : on s'arrête sur un plan
    const site = nearSite(p);
    p.site = site;
    if (site) {
      const lock = site.need && !g.owned[site.need];
      const miss = lock ? null : missing(site, p);
      if (lock) {
        p.buildT = 0;
        api.sayOnce(`lock-${site.need}`, api.lines().needInvent.replace('{x}', api.evoName(site.need)), 25, 2);
      } else if (miss) {
        p.buildT = 0;
        if (performance.now() > (p.missAt || 0)) {
          p.missAt = performance.now() + 2500;
          api.floater(`Il manque ${miss}`, site.x, site.y - 160, '#FFB36B', 1);
          api.sayOnce('missing', api.lines().missing, 40, 1);
        }
      } else if (p.speed < 0.35) {
        p.buildT = (p.buildT || 0) + dt;
        if (Math.random() < dt * 2.5) api.sfx.build();
        if (Math.random() < dt * 12) api.particles().push({ x: site.x + (Math.random() - 0.5) * 80, y: site.y - Math.random() * 60, vx: (Math.random() - 0.5) * 140, vy: -80 - Math.random() * 120, life: 0, max: 0.6, size: 5, color: '#A8804E' });
        if (p.buildT >= BUILD_TIME) { p.buildT = 0; construct(site, p); }
      } else p.buildT = 0;
    } else p.buildT = 0;
    // les champs : on arrose, on récolte
    for (const s of M.sites) {
      if (s.type !== 'champ' || !g.built[s.id]) continue;
      const f = g.fields[s.id] || (g.fields[s.id] = { stage: 'seme', watered: false, grow: 0 });
      const inF = Math.abs(p.x - s.x) < 150 && Math.abs(p.y - s.y) < 110;
      if (!inF) continue;
      if (f.stage === 'seme' && !f.watered && p.carry === 'eau') {
        f.watered = true;
        f.stage = 'pousse';
        f.grow = 0;
        p.carry = null;
        g.delivered = g.delivered || {};
        g.delivered.eau = (g.delivered.eau || 0) + 1;
        api.floater('Arrosé !', s.x, s.y - 110, '#9EE7FF', 1.2);
        api.deed(6, s.x, s.y - 150);
        api.sfx.splash();
        api.sayOnce('watered', api.lines().watered, 60, 1);
        api.checkMissions();
      }
      if (f.stage === 'mur') {
        p.harvestT = (p.harvestT || 0) + dt;
        if (p.harvestT > HARVEST_TIME) {
          p.harvestT = 0;
          f.stage = 'seme';
          f.watered = false;
          f.grow = 0;
          g.res.ble = (g.res.ble || 0) + 3;
          g.harvested = (g.harvested || 0) + 3;
          api.floater('+3 gerbes de blé !', s.x, s.y - 120, '#FFE58A', 1.3);
          api.deed(9, s.x, s.y - 160);
          api.sfx.victory();
          api.confetti(12);
          api.sayOnce('harvest', api.lines().harvest, 60, 2);
          api.changed();
          api.checkMissions();
        }
      }
    }
    // on fonce sur un pillard (ou un sanglier dans les champs) : il s'enfuit
    if (p.dash > 0) {
      for (const c of api.creatures()) {
        if (!(c.sp.kind === 'pillard' || c.sp.fieldRaider) || c.fleeT > 0) continue;
        if (Math.hypot(c.x - p.x, c.y - p.y) < c.size + p.size * 1.3) repel(c, p, 'Ouste !', 6);
      }
    }
  }

  function nearSite(p) {
    const g = api.game(), ch = g.chapter + 1;
    let best = null, bd = Infinity;
    for (const s of M.sites) {
      if ((s.ch || 1) > ch || g.built[s.id] === true) continue;
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      const R = s.arc ? 170 : (s.planR || 80) * 0.9 + 20;
      if (d < R && d < bd) { bd = d; best = s; }
    }
    return best;
  }
  /** Ce qui manque pour construire (null si tout y est) */
  function missing(s, p) {
    const g = api.game();
    const out = [];
    for (const [k, n] of Object.entries(s.cost || {})) {
      if (k === 'feu') {
        if (p.carry !== 'feu' && !g.owned.feu) out.push('le feu');
        continue;
      }
      const have = g.res[k] || 0;
      if (have < n) out.push(`${n - have} ${api.resName(k)}`);
    }
    return out.length ? out.join(', ') : null;
  }
  function construct(s, p) {
    const g = api.game();
    for (const [k, n] of Object.entries(s.cost || {})) {
      if (k === 'feu') { if (p.carry === 'feu') p.carry = null; continue; }
      g.res[k] -= n;
    }
    const wasBroken = g.built[s.id] === 'casse';
    g.built[s.id] = true;
    if (s.type === 'champ') g.fields[s.id] = { stage: 'seme', watered: false, grow: 0 };
    g.builtCount = (g.builtCount || 0) + (wasBroken ? 0 : 1);
    refresh();
    api.rebuilt();
    api.floater(wasBroken ? 'Réparé !' : `${s.name || 'Construit'} !`, s.x, s.y - 170, '#7CF0A0', 1.4);
    api.deed(wasBroken ? 4 : (s.adn || 12), s.x, s.y - 210);
    api.sfx.mission();
    api.shake(0.15);
    api.confetti(s.type === 'foyer' ? 60 : 20);
    for (let i = 0; i < 18; i++) api.particles().push({ x: s.x + (Math.random() - 0.5) * 120, y: s.y - Math.random() * 80, vx: (Math.random() - 0.5) * 260, vy: -100 - Math.random() * 200, life: 0, max: 0.8, size: 6, color: Math.random() < 0.5 ? '#C9A860' : '#8A6440' });
    const line = api.lines()[`built_${s.type}`];
    if (line && !wasBroken) api.say(line, 2, 6000);
    api.changed();
    api.checkMissions();
  }

  /* ============================================================================
     CE QUI VIT TOUT SEUL : le blé qui pousse, les tas qui reviennent, les lances, les attaques
     ============================================================================ */
  function update(dt) {
    if (!M) return;
    const g = api.game();
    for (const it of M.items) {
      if (it.regrowT > 0) {
        it.regrowT -= dt;
        if (it.regrowT <= 0) it.amount = it.max;
      }
    }
    for (const [id, f] of Object.entries(g.fields || {})) {
      if (f.stage !== 'pousse') continue;
      f.grow += dt / GROW_TIME;
      if (f.grow >= 1) {
        f.stage = 'mur';
        const s = M.sites.find((x) => x.id === id);
        if (s) api.floater('Le blé est mûr !', s.x, s.y - 110, '#FFE58A', 1.2);
        api.sayOnce('ripe', api.lines().ripe, 40, 2);
      }
    }
    updateSpears(dt);
    updateRaid(dt);
    // (les tours de guet lancent des lances sur les pillards)
    for (const s of M.sites) {
      if (s.type !== 'tour' || g.built[s.id] !== true) continue;
      s.cool = (s.cool || 0) - dt;
      if (s.cool > 0) continue;
      const t = api.creatures().find((c) => c.sp.kind === 'pillard' && !(c.fleeT > 0) && Math.hypot(c.x - s.x, c.y - s.y) < 620);
      if (!t) continue;
      s.cool = 2.2;
      const a = Math.atan2(t.y - (s.y - 230), t.x - s.x);
      spears.push({ x: s.x, y: s.y - 230, z: 0, vx: Math.cos(a) * SPEAR_SPEED * 0.8, vy: Math.sin(a) * SPEAR_SPEED * 0.8, life: 1.2, owner: 'tour', ang: a });
      api.sfx.whip();
    }
  }

  /* ---------- La lance (le pouvoir du chasseur) ---------- */
  function throwSpear(p) {
    const a = Math.atan2(p.vy, p.vx);
    const ang = Math.hypot(p.vx, p.vy) > 20 ? a : p.angle;
    spears.push({ x: p.x + Math.cos(ang) * p.size, y: p.y - p.size * 1.3 + Math.sin(ang) * p.size, vx: Math.cos(ang) * SPEAR_SPEED, vy: Math.sin(ang) * SPEAR_SPEED, life: 0.6, owner: 'joueur', ang });
    api.sfx.whip();
  }
  function updateSpears(dt) {
    for (const s of spears) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      for (const c of api.creatures()) {
        if (s.life <= 0 || c.dead || c.sp.kind === 'tribu' || c.sp.kind === 'ally' || c.sp.kind === 'stray' || c.sp.kind === 'food' || c.sp.kind === 'flock') continue;
        // (on vise le corps : un peu au-dessus des pattes)
        if (Math.hypot(c.x - s.x, c.y - c.size * 0.8 - s.y) > c.size * 0.9 + 14) continue;
        s.life = 0;
        api.spearHit(c, s.owner);
      }
    }
    spears = spears.filter((s) => s.life > 0);
  }

  /** Un pillard (ou un sanglier) qu'on fait fuir, pendant "time" secondes (la lance : assez
      pour qu'un pillard reparte chez lui ; la torche : il reviendra) */
  function repel(c, from, text, time = 7) {
    c.fleeT = time;
    c.fleeFrom = { x: from.x, y: from.y };
    // (la lance, ou foncer dessus) un pillard rentre chez lui pour de bon, loin du village
    if (c.sp.kind === 'pillard' && time >= 6) {
      c.routed = true;
      c.fleeFrom = { x: M.V.x, y: M.V.y };
    }
    c.state = 'wander';
    c.mark = '!';
    c.markT = 1;
    api.floater(text, c.x, c.y - c.size * 2.6, '#FFFFFF', 1.3);
    if (!c.barked) {
      c.barked = true;
      const g = api.game();
      g.barked = g.barked || {};
      g.barked[c.id] = (g.barked[c.id] || 0) + 1;
      api.deed(8, c.x, c.y - c.size * 3);
      api.checkMissions();
    }
  }

  /* ---------- Les attaques des pillards (chapters[].raids) ---------- */
  function updateRaid(dt) {
    const CH = api.chapter(), g = api.game();
    const R = CH.raids;
    if (!R) return;
    if (!raid) raid = { wave: g.repelled || 0, t: R.first ?? 8, members: [], active: false };
    const start = R.after === undefined || g.done.includes(R.after);
    if (!start) return;
    if (!raid.active) {
      if (raid.wave >= R.waves.length) return;
      raid.t -= dt;
      if (raid.t > 0) return;
      // une nouvelle attaque : les pillards sortent de la forêt, tous du même côté
      raid.active = true;
      const n = R.waves[raid.wave];
      const a = Math.random() * TAU;
      raid.members = [];
      for (let i = 0; i < n; i++) {
        const last = raid.wave === R.waves.length - 1 && i === 0;
        const id = last && R.chief ? R.chief : R.species;
        const aa = a + (Math.random() - 0.5) * 0.6, d = M.VR + 1100 + Math.random() * 400;
        const c = api.spawnAt(id, M.V.x + Math.cos(aa) * d, M.V.y + Math.sin(aa) * d);
        if (c) raid.members.push(c);
      }
      api.horn();
      api.say(api.lines().raid, 3, 6000);
      return;
    }
    // l'attaque est finie quand tous les pillards sont repartis : repoussée… sauf s'ils ont volé du blé
    const left = raid.members.filter((c) => !c.dead && !c.gone);
    if (!left.length) {
      raid.active = false;
      raid.t = R.gap || 30;
      if (raid.members.some((c) => c.looted)) {
        // ils reviendront, aussi nombreux
        api.floater('Ils ont volé le blé…', api.player().x, api.player().y - 120, '#FF8A8A', 1.4);
        api.say(api.lines().raidLost, 3, 6000);
        return;
      }
      raid.wave++;
      g.repelled = (g.repelled || 0) + 1;
      api.floater('Attaque repoussée !', api.player().x, api.player().y - 120, '#7CF0A0', 1.6);
      api.sfx.victory();
      api.confetti(50);
      api.say(raid.wave >= R.waves.length ? api.lines().raidsDone : api.lines().raidRepelled, 2, 6000);
      api.checkMissions();
    }
  }
  const raidLeft = () => (raid && raid.active ? raid.members.filter((c) => !c.dead && !c.gone).length : 0);
  const raidState = () => raid;

  /* ============================================================================
     LE CERVEAU : la tribu, les pillards, les sangliers des champs, la peur du feu
     (renvoie true si l'animal a été conduit ici)
     ============================================================================ */
  function steer(c, dt, p) {
    if (!M) return false;
    const sp = c.sp, g = api.game(), CH = api.chapter();
    c.fleeT = Math.max(0, (c.fleeT || 0) - dt);
    // (la torche) un pillard, un sanglier : il recule devant les flammes… mais il reviendra
    if (c.scaredT > 0 && (sp.kind === 'pillard' || sp.fieldRaider)) {
      c.scaredT = 0;
      repel(c, { x: c.barkX ?? p.x, y: c.barkY ?? p.y }, 'Au feu !', 4);
    }
    // la tribu : elle vit au village, près du feu (la nuit, tout près)
    if (sp.kind === 'tribu') {
      c.fleeing = false;
      c.mood = 'happy';
      const night = !!CH.night;
      const home = M.lights.find((l) => l.site && l.site.type === 'foyer') || { x: M.V.x, y: M.V.y };
      const R = night ? 240 : 650;
      const threat = api.creatures().find((o) => o.sp.kind === 'hunter' && dist(o, c) < 380);
      if (threat) {
        const d = dist(threat, c) || 1;
        api.steer(c, (c.x - threat.x) / d, (c.y - threat.y) / d, sp.speed * 1.8, dt);
        c.mood = 'scared';
        return true;
      }
      if (!c.wx || Math.hypot(c.wx - c.x, c.wy - c.y) < 40 || Math.hypot(c.wx - home.x, c.wy - home.y) > R) {
        const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * R;
        c.wx = home.x + Math.cos(a) * d;
        c.wy = home.y + Math.sin(a) * d * 0.7;
        c.restT = Math.random() * 4;
      }
      if (c.restT > 0) { c.restT -= dt; api.steer(c, 0, 0, 0, dt); return true; }
      const dx = c.wx - c.x, dy = c.wy - c.y, d = Math.hypot(dx, dy) || 1;
      api.steer(c, dx / d, dy / d, sp.speed * 0.5, dt);
      return true;
    }
    // ceux qu'on a fait fuir : ils courent loin d'ici (un pillard en déroute ne s'arrête plus)
    if ((c.fleeT > 0 || c.routed) && (sp.kind === 'pillard' || sp.fieldRaider)) {
      const from = c.fleeFrom || M.V;
      const dx = c.x - from.x, dy = c.y - from.y, d = Math.hypot(dx, dy) || 1;
      api.steer(c, dx / d, dy / d, sp.speed * 1.4, dt);
      c.fleeing = true;
      c.mood = 'scared';
      if (sp.kind === 'pillard' && Math.hypot(c.x - M.V.x, c.y - M.V.y) > M.VR + 1300) { c.gone = true; c.dead = true; }
      return true;
    }
    // les pillards : ils foncent vers le grenier (ou le feu) du village… et forcent la palissade
    if (sp.kind === 'pillard') {
      c.fleeing = false;
      c.mood = 'angry';
      const goal = M.sites.find((s) => s.type === 'grenier' && g.built[s.id]) || { x: M.V.x, y: M.V.y };
      if (c.loot) {
        // ils repartent chez eux avec leur butin
        c.fleeT = 8;
        c.fleeFrom = { x: M.V.x, y: M.V.y };
        c.routed = true;
        c.loot = false;
        return true;
      }
      if (dist(c, goal) < 140) {
        // ils volent la récolte, et s'en vont avec
        const take = Math.min(3, g.res.ble || 0);
        g.res.ble = (g.res.ble || 0) - take;
        c.loot = true;
        c.looted = true;
        api.floater(take ? `Ils volent ${take} blé !` : 'Ils pillent le village !', goal.x, goal.y - 160, '#FF8A8A', 1.3);
        api.sayOnce('looted', api.lines().looted, 15, 3);
        api.changed();
        return true;
      }
      if (c.hitWall && c.hitWall.wall && api.game().built[c.hitWall.wall.id] === true) {
        // un mur devant : ils tapent dessus jusqu'à le casser
        const w = c.hitWall.wall;
        w.hp = (w.hp ?? (w.hpMax || WALL_HP)) - dt * (sp.breaker || 10);
        c.mouth = Math.abs(Math.sin(performance.now() / 120));
        if (Math.random() < dt * 3) api.sfx.thud();
        if (w.hp <= 0) {
          w.hp = undefined;
          g.built[w.id] = 'casse';
          refresh();
          api.rebuilt();
          api.floater('La palissade est cassée !', c.x, c.y - 150, '#FF8A8A', 1.4);
          api.say(api.lines().wallBroken, 3, 6000);
        }
        api.steer(c, 0, 0, 0, dt);
        return true;
      }
      const dx = goal.x - c.x, dy = goal.y - c.y, d = Math.hypot(dx, dy) || 1;
      api.steer(c, dx / d, dy / d, sp.speed, dt);
      return true;
    }
    // les sangliers (et les oiseaux) qui viennent manger le blé des champs
    if (sp.fieldRaider) {
      const fields = M.sites.filter((s) => s.type === 'champ' && g.built[s.id] && g.fields[s.id] && g.fields[s.id].stage !== 'seme');
      if (!fields.length || c.fedT > 0) {
        c.fedT = Math.max(0, (c.fedT || 0) - dt);
        return false;
      }
      const f = fields.reduce((a, b) => (dist(b, c) < dist(a, c) ? b : a));
      if (dist(f, c) < 110) {
        const st = g.fields[f.id];
        st.stage = 'seme';
        st.watered = false;
        st.grow = 0;
        c.fedT = 20;
        api.floater('Il a mangé le blé !', f.x, f.y - 120, '#FF8A8A', 1.2);
        api.sayOnce('eatenField', api.lines().fieldEaten, 20, 3);
        return true;
      }
      const dx = f.x - c.x, dy = f.y - c.y, d = Math.hypot(dx, dy) || 1;
      api.steer(c, dx / d, dy / d, sp.speed * 0.6, dt);
      c.mood = 'happy';
      return true;
    }
    // les fauves ont peur du feu : près d'un feu, ou de ta torche, ils reculent
    if (sp.kind === 'hunter') {
      let from = null;
      for (const l of M.lights) if (Math.hypot(c.x - l.x, c.y - l.y) < l.fear) { from = l; break; }
      if (!from && (p.carry === 'feu' || (g.owned.feu && api.chapter().night)) && dist(c, p) < 230) from = p;
      if (from) {
        const dx = c.x - from.x, dy = c.y - from.y, d = Math.hypot(dx, dy) || 1;
        api.steer(c, dx / d, dy / d, sp.speed * 0.9, dt);
        c.fleeing = true;
        c.mood = 'scared';
        if (c.state === 'chase' || c.state === 'alert') { c.state = 'wander'; c.rest = 2; }
        return true;
      }
    }
    return false;
  }

  /* ============================================================================
     OÙ APPARAISSENT LES ANIMAUX
     ============================================================================ */
  function spawnPoint(sp, near, minD, far) {
    for (let i = 0; i < 20; i++) {
      if (sp.kind === 'tribu') {
        const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 500;
        return { x: M.V.x + Math.cos(a) * d, y: M.V.y + Math.sin(a) * d * 0.7 };
      }
      const a = Math.random() * TAU, d = lerp(minD, far, Math.random());
      const x = near.x + Math.cos(a) * d, y = near.y + Math.sin(a) * d;
      if (x < 200 || y < 200 || x > M.W.w - 200 || y > M.W.h - 200) continue;
      if (riverDist(M.river, x, y) < M.riverW / 2 + 40) continue;
      // (les bêtes sauvages naissent hors du village ; les moutons, près de l'enclos s'il existe)
      if (sp.kind !== 'stray' && inVillage(x, y, 250)) continue;
      if (blocked(x, y, sp.size * 0.6)) continue;
      return { x, y };
    }
    return null;
  }
  function blocked(x, y, r) {
    const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      for (const s of M.grid.get((i + di) * 1000 + (j + dj)) || []) if (Math.hypot(x - s.x, y - s.y) < s.r + r) return true;
    }
    return false;
  }
  function startPoint() {
    return { x: M.V.x + 60, y: M.V.y + 140 };
  }
  function respawnPoint() {
    const f = M.lights.find((l) => l.site && l.site.type === 'foyer');
    if (f) return { x: f.x + 80, y: f.y + 90 };
    const t = M.lights.find((l) => l.tree);
    if (t) return { x: t.x + 130, y: t.y + 200 };
    return startPoint();
  }

  /* ============================================================================
     LE DESSIN
     ============================================================================ */
  const pal = () => api.chapter().palette || {};

  /** Le sol : la rivière, la terre battue du village, les champs, les plans */
  function drawGround(ctx, x0, x1, y0, y1, t) {
    const P = pal(), g = api.game();
    // la terre battue autour du foyer (elle s'agrandit avec le village)
    const n = Math.min(30, g.builtCount || 0);
    const rr = 280 + n * 35;
    const dg = ctx.createRadialGradient(M.V.x, M.V.y, rr * 0.2, M.V.x, M.V.y, rr);
    dg.addColorStop(0, P.dirt || 'rgba(150, 120, 80, 0.55)');
    dg.addColorStop(1, 'rgba(150, 120, 80, 0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.ellipse(M.V.x, M.V.y, rr, rr * 0.75, 0, 0, TAU);
    ctx.fill();
    // la rivière
    const W2 = M.riverW;
    const path = (off, w) => {
      ctx.beginPath();
      M.river.forEach((q, i) => (i ? ctx.lineTo(q.x + off, q.y) : ctx.moveTo(q.x + off, q.y)));
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };
    ctx.strokeStyle = P.bank || '#8A7A4A';
    path(0, W2 + 50);
    ctx.strokeStyle = P.sand || '#C9B07A';
    path(0, W2 + 26);
    ctx.strokeStyle = P.water || '#3E8EB8';
    path(0, W2);
    ctx.strokeStyle = shade(P.water || '#3E8EB8', 0.18);
    path(-W2 * 0.12, W2 * 0.55);
    // les reflets qui coulent
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i + 1 < M.river.length; i++) {
      const a = M.river[i], b = M.river[i + 1];
      if (b.y < y0 - 300 || a.y > y1 + 300) continue;
      for (let k = 0; k < 3; k++) {
        const u = ((t * 0.12 + k / 3 + i * 0.37) % 1);
        const x = lerp(a.x, b.x, u) + (k - 1) * W2 * 0.22, y = lerp(a.y, b.y, u);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 6, y + 30);
      }
    }
    ctx.stroke();
    // les champs (à plat)
    for (const s of M.sites) {
      if (s.type !== 'champ' || !g.built[s.id]) continue;
      if (s.x + 200 < x0 || s.x - 200 > x1 || s.y + 150 < y0 || s.y - 150 > y1) continue;
      drawField(ctx, { ...s, ...(g.fields[s.id] || { stage: 'seme' }) }, t);
    }
    // les plans de ce qu'on peut construire (au sol, en pointillés)
    const p = api.player();
    for (const s of M.sites) {
      if (!visibleSite(s) || s.x + 300 < x0 || s.x - 300 > x1) continue;
      if (s.arc) {
        ctx.save();
        ctx.setLineDash([16, 12]);
        ctx.lineDashOffset = -t * 20;
        ctx.strokeStyle = p.site === s ? 'rgba(255, 230, 120, 0.95)' : 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(M.V.x, M.V.y, s.R, s.R, 0, s.a0, s.a1);
        ctx.stroke();
        ctx.restore();
      } else drawPlan(ctx, s, t, p.site === s);
    }
  }
  const visibleSite = (s) => {
    const g = api.game();
    return (s.ch || 1) <= g.chapter + 1 && g.built[s.id] !== true;
  };

  /** Tout ce qui est debout, à ranger du fond vers le devant avec les animaux */
  function uprights(x0, x1, y0, y1) {
    const g = api.game(), ch = g.chapter + 1, out = [];
    const inV = (o, m) => o.x + m > x0 && o.x - m < x1 && o.y + m * 0.2 > y0 && o.y - m * 2.4 < y1;
    for (const it of M.items) {
      if (!active(it, ch) || !inV(it, it.r * 2 + 200)) continue;
      out.push({ y: it.y, item: it });
    }
    for (const s of M.sites) {
      const b = g.built[s.id];
      if (!inV(s, 400)) continue;
      if (b === true || (b === 'casse' && !s.arc)) out.push({ y: s.y, site: s });
      else if (visibleSite(s) && !s.arc && s.type !== 'champ') out.push({ y: s.y, ghost: s });
    }
    for (const st of M.stakes) if (inV(st, 60)) out.push({ y: st.y, stake: st });
    for (const pt of M.posts) if (inV(pt, 80)) out.push({ y: pt.y, post: pt });
    return out;
  }

  function drawUpright(ctx, u, t) {
    const P = pal(), g = api.game();
    if (u.item) {
      const it = u.item;
      if (it.type === 'arbre') drawTree(ctx, it, t, P);
      else if (it.type === 'arbre-feu') drawFireTree(ctx, it, t);
      else if (it.type === 'rocher') drawRock(ctx, it, P);
      else if (it.res) drawResource(ctx, it, t, P);
      else if (it.type === 'buisson') drawBush(ctx, it, t, P);
      else if (it.type === 'herbes') drawGrass(ctx, it, t, P);
      else if (it.type === 'grotte') drawCave(ctx, it, t, P, M.sites.some((s) => s.type === 'peinture' && g.built[s.id] === true));
      return;
    }
    if (u.stake) { drawStake(ctx, u.stake); return; }
    if (u.post) { drawPost(ctx, u.post); return; }
    const s = u.site || u.ghost;
    if (u.ghost) ctx.globalAlpha = 0.28;
    const p = api.player();
    switch (s.type) {
      case 'foyer': drawHearth(ctx, s, t, !!u.site, true); break;
      case 'feu': drawHearth(ctx, s, t, !!u.site, false); break;
      case 'hutte': drawHut(ctx, s, t, P); break;
      case 'grenier': drawGranary(ctx, s, t, P); break;
      case 'porte': drawGate(ctx, s, t, !!u.site && Math.hypot(p.x - s.x, p.y - s.y) < 260); break;
      case 'tour': drawTower(ctx, s, t, u.site ? (x, y) => api.drawGuard(ctx, x, y, t) : null); break;
      case 'enclos': if (u.ghost) drawPlan(ctx, { ...s, planR: s.r || 240 }, t, p.site === s); break;
      default: break;
    }
    ctx.globalAlpha = 1;
  }

  /** Par-dessus : les lances qui volent, les étiquettes des plans */
  function drawTop(ctx, t, zoom) {
    for (const s of spears) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.ang);
      ctx.strokeStyle = '#3A2414';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-60, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
      ctx.strokeStyle = '#8A6440';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#B8B4A8';
      ctx.strokeStyle = '#3A3630';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, -7);
      ctx.lineTo(38, 0);
      ctx.lineTo(18, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // l'étiquette du plan sur lequel on est : son nom, et ce qu'il coûte
    const p = api.player(), s = p.site, g = api.game();
    if (s && !p.dead) {
      const lock = s.need && !g.owned[s.need];
      const entries = Object.entries(s.cost || {});
      const k = 1 / zoom;
      ctx.font = `700 ${12 * k}px 'Baloo 2', sans-serif`;
      const need = lock ? ctx.measureText(`Invente d’abord : ${api.evoName(s.need)}`).width + 28 * k : 0;
      const w = Math.max(150 * k, (40 + entries.length * 74) * k, need), h = 64 * k;
      const x = s.x - w / 2, y = s.y - (s.arc ? 230 : 260) - h;
      ctx.fillStyle = 'rgba(255, 252, 243, 0.95)';
      ctx.strokeStyle = '#3A2414';
      ctx.lineWidth = 3 * k;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, 14 * k) : ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2E2A4D';
      ctx.font = `800 ${15 * k}px 'Baloo 2', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(lock ? `🔒 ${s.name}` : s.name, s.x, y + 6 * k);
      if (lock) {
        ctx.font = `700 ${12 * k}px 'Baloo 2', sans-serif`;
        ctx.fillText(`Invente d’abord : ${api.evoName(s.need)}`, s.x, y + 32 * k);
      } else {
        entries.forEach(([id, n], i) => {
          const cx = s.x + (i - (entries.length - 1) / 2) * 74 * k;
          const have = id === 'feu' ? (p.carry === 'feu' || g.owned.feu ? 1 : 0) : g.res[id] || 0;
          drawResIcon(ctx, id, cx - 18 * k, y + 44 * k, 9 * k);
          ctx.fillStyle = have >= n ? '#2E8A4A' : '#C8302A';
          ctx.font = `800 ${13 * k}px 'Baloo 2', sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`${Math.min(have, n)}/${n}`, cx - 6 * k, y + 36 * k);
          ctx.textAlign = 'center';
        });
      }
      // le cercle qui se remplit pendant la construction
      if (p.buildT > 0) {
        ctx.strokeStyle = '#7CF0A0';
        ctx.lineWidth = 7 * k;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(p.x, p.y - p.size * 3.6, 22 * k, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, p.buildT / BUILD_TIME));
        ctx.stroke();
      }
    }
  }

  /** La nuit : tout est noir, sauf autour des feux (et de ta torche). On voit briller les yeux des fauves. */
  function drawNight(ctx, cw, ch, toScreen, zoom, t, dpr, creatures) {
    const p = api.player(), g = api.game();
    if (!nightCv) nightCv = document.createElement('canvas');
    const w = Math.ceil(cw / 2), h = Math.ceil(ch / 2);
    if (nightCv.width !== w || nightCv.height !== h) { nightCv.width = w; nightCv.height = h; }
    const n = nightCv.getContext('2d');
    n.globalCompositeOperation = 'source-over';
    n.clearRect(0, 0, w, h);
    n.fillStyle = 'rgba(8, 14, 38, 0.8)';
    n.fillRect(0, 0, w, h);
    n.globalCompositeOperation = 'destination-out';
    const lights = M.lights.map((l) => ({ x: l.x, y: l.y, r: l.r * (0.95 + Math.sin(t * 7 + l.x) * 0.04) }));
    if (p.carry === 'feu' || g.owned.feu) lights.push({ x: p.x, y: p.y - p.size * 1.5, r: 300 + Math.sin(t * 9) * 10 });
    lights.push({ x: p.x, y: p.y - p.size, r: 230 });
    for (const l of lights) {
      const s = toScreen(l.x, l.y);
      const R = l.r * zoom / 2;
      const gr = n.createRadialGradient(s.x / 2, s.y / 2, R * 0.15, s.x / 2, s.y / 2, R);
      gr.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gr.addColorStop(0.6, 'rgba(0, 0, 0, 0.75)');
      gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
      n.fillStyle = gr;
      n.fillRect(s.x / 2 - R, s.y / 2 - R, R * 2, R * 2);
    }
    ctx.drawImage(nightCv, 0, 0, cw, ch);
    // la lueur orangée des feux
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights.slice(0, M.lights.length)) {
      const s = toScreen(l.x, l.y);
      const R = l.r * zoom * 0.8;
      const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, R);
      gr.addColorStop(0, 'rgba(255, 150, 60, 0.22)');
      gr.addColorStop(1, 'rgba(255, 120, 40, 0)');
      ctx.fillStyle = gr;
      ctx.fillRect(s.x - R, s.y - R, R * 2, R * 2);
    }
    ctx.restore();
    // les yeux qui brillent dans le noir
    for (const c of creatures) {
      if (c.sp.kind !== 'hunter') continue;
      if (lights.some((l) => Math.hypot(c.x - l.x, c.y - l.y) < l.r * 0.6)) continue;
      const face = Math.cos(c.angle || 0) >= 0 ? 1 : -1;
      const s = toScreen(c.x + face * c.size * 0.85, c.y - c.size * 1.25);
      if (s.x < -20 || s.y < -20 || s.x > cw + 20 || s.y > ch + 20) continue;
      const blink = (t + c.seed) % 4 < 0.15;
      if (blink) continue;
      ctx.fillStyle = c.state === 'chase' ? '#FF5A3A' : '#F2E25A';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      for (const dx of [-4, 4]) {
        ctx.beginPath();
        ctx.arc(s.x + dx * zoom, s.y, 2.6, 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }

  /** Sur le radar : la rivière, le village, les plans, ce qu'on ramasse */
  function minimap(mctx, toM, k, wanted) {
    const g = api.game(), ch = g.chapter + 1;
    mctx.strokeStyle = 'rgba(90, 180, 220, 0.85)';
    mctx.lineWidth = Math.max(2, M.riverW * k);
    mctx.beginPath();
    M.river.forEach((q, i) => { const m = toM(q.x, q.y); if (i) mctx.lineTo(m.x, m.y); else mctx.moveTo(m.x, m.y); });
    mctx.stroke();
    const v = toM(M.V.x, M.V.y);
    mctx.strokeStyle = 'rgba(255, 210, 140, 0.7)';
    mctx.lineWidth = 2;
    mctx.beginPath();
    mctx.arc(v.x, v.y, Math.max(4, M.VR * k), 0, TAU);
    mctx.stroke();
    for (const s of M.sites) {
      const m = toM(s.x, s.y);
      mctx.fillStyle = g.built[s.id] === true ? 'rgba(255, 180, 90, 0.95)' : visibleSite(s) ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0,0,0,0)';
      mctx.fillRect(m.x - 2, m.y - 2, 4, 4);
    }
    for (const it of M.items) {
      if (!it.res || !active(it, ch) || it.amount <= 0 || !wanted.includes(it.res)) continue;
      const m = toM(it.x, it.y);
      mctx.fillStyle = it.res === 'bois' ? '#C9A06A' : it.res === 'silex' ? '#E2E2EA' : it.res === 'ocre' ? '#E2744A' : '#F2D05A';
      mctx.beginPath();
      mctx.arc(m.x, m.y, 2.6, 0, TAU);
      mctx.fill();
    }
    const cv = toM(M.cave.x, M.cave.y);
    mctx.fillStyle = '#6A6258';
    mctx.fillRect(cv.x - 4, cv.y - 3, 8, 6);
  }

  /* ---------- Ce que la flèche montre ---------- */
  function nearestRes(p, res) {
    const ch = api.game().chapter + 1;
    let best = null, bd = Infinity;
    for (const it of M.items) {
      if (it.res !== res || !active(it, ch) || it.amount <= 0) continue;
      const d = Math.hypot(it.x - p.x, it.y - p.y);
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }
  function sitesOf(type) {
    return M.sites.filter((s) => s.type === type);
  }

  return {
    on, build, refresh, get M() { return M; }, zoneAt, collide, interact, update, steer, spawnPoint, startPoint, respawnPoint,
    throwSpear, repel, drawGround, uprights, drawUpright, drawTop, drawNight, minimap, nearestRes, sitesOf, missing, inVillage,
    raidLeft, raidState, palisadeDone, resetRaid: () => { raid = null; spears = []; },
    get pens() { return M ? M.pens : []; }, get hides() { return M ? M.hides : []; },
  };
}
