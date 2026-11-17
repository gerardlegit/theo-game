// ============================================================================
// Évolution — LES PREMIÈRES VILLES (world.city) : ce que la vue de trois
// quarts (tqv.js) ne sait pas faire toute seule. Rien ici ne connaît une
// espèce par son nom : c'est le niveau qui décrit la ville (world.city).
//
//   - La ville carrée : ses remparts de pierre et leurs tours, ses quatre
//     portes, ses maisons, le marché et ses étals, le puits, le grenier ; la
//     carrière (les pierres taillées), les balles de laine du parc à moutons.
//   - Le grand fleuve : on ne le traverse que sur le pont (une fois construit).
//     La route pavée (en morceaux) mène au village de l'Ouest ; sur les rues
//     et les routes pavées, on marche plus vite.
//   - Les quatre villages : amis ou hostiles (tirés au sort au début du
//     niveau, sauf l'Ouest, toujours ami). On découvre ce qu'ils sont en
//     s'approchant ; les soldats des villages hostiles foncent sur toi. Au
//     marché d'un village ami, on vend son blé et sa laine : on gagne des
//     pièces d'argent et leur amitié. Avec la roue, leurs charrettes viennent
//     vendre à ton marché (des pièces en plus).
//   - Le grand monument : on choisit sa forme, on pose ses fondations, puis on
//     embauche des ouvriers (à la cabane du chantier) et on fait venir des
//     bateaux de pierres (au port). Il monte tant qu'il y a des pierres, du
//     bois et des ouvriers.
// L'état qui se garde (game.ville) : les villages (amis, rencontrés, amitié),
// la forme du monument, le chantier (ses réserves, sa hauteur), les ouvriers.
// (Les dessins sont dans art-villes.js.)
// ============================================================================

import {
  drawCityGround, drawWallH, drawWallV, drawCityTower, drawGateArch, drawStoneHouse, drawStall, drawWell, drawSilo, drawSchool,
  drawQuarryGround, drawStonePile, drawWoolBales, drawBridge, drawRoad, drawRoadPlan, drawPortGround, drawCrane, drawBoat, drawCart,
  drawBanner, drawTownHut, drawTownStake, drawTownTower, drawTownFire, drawYard, drawStock, drawMonument, monumentHeight, MONUMENTS,
} from './art-villes.js';
import { drawPlan, drawResIcon } from './art-humains.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleDiff = (a, b) => ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const GOODS = ['ble', 'laine'];          // ce que les villages amis achètent
const COUNTER_TIME = 1.1;                // s immobile sur un comptoir pour embaucher ou commander
const SELL_TIME = 0.32;                  // s pour vendre une marchandise
const STORE_TIME = 0.12;                 // s pour déposer une pierre (ou un bois) au chantier

/** Le point le plus proche d'un segment */
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
  const k = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1);
  return Math.hypot(px - (ax + dx * k), py - (ay + dy * k));
}

export function createVilles(api, T) {
  const on = () => !!api.level().world.city;
  const K = () => api.level().world.city;
  let C = null;                          // la ville et ce qu'il y a autour (construit une fois par niveau)
  let agents = [];                       // les charrettes, les bateaux, les ouvriers : ils bougent tout seuls
  let sellT = 0, storeT = 0, counterT = 0, chooseAt = 0, lackAt = 0;

  /* ============================================================================
     L'ÉTAT QUI SE GARDE (game.ville)
     ============================================================================ */
  function S() {
    const g = api.game();
    if (!g.ville || !g.ville.towns) {
      const k = K();
      const towns = {};
      const open = k.towns.filter((t) => !t.friend).map((t) => t.id);
      // (au hasard) parmi les villages qui ne sont pas toujours amis, certains le sont
      for (let i = open.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [open[i], open[j]] = [open[j], open[i]]; }
      const friends = new Set(open.slice(0, k.friends ?? 1));
      for (const t of k.towns) towns[t.id] = { friend: !!t.friend || friends.has(t.id), met: false, known: false, amitie: 0 };
      g.ville = { towns, monument: null, chantier: { pierre: 0, bois: 0, k: 0 }, workers: 0, boatsTotal: 0 };
    }
    return g.ville;
  }

  /* ============================================================================
     LA CARTE : la ville, la carrière, le pont, la route, le port, les villages
     ============================================================================ */
  function build(M, rnd) {
    const W = api.level().world, k = K(), V = M.V, h = k.half;
    const R = (a, b) => a + rnd() * (b - a);
    C = { x: V.x, y: V.y, half: h, gateW: k.gateW || 200, street: 150, plaza: 360, walls: [], towers: [], arches: [], solids: [], houses: [], stalls: [], towns: [] };
    const gw = C.gateW / 2, gt = gw + 52;
    // les remparts nord et sud : des morceaux, coupés par les portes
    for (const side of [-1, 1]) {
      const y = V.y + side * h;
      for (let x = -h; x < h - 1; x += 125) {
        const a = x, b = Math.min(h, x + 125);
        const parts = b <= -gt || a >= gt ? [[a, b]] : [a < -gt ? [a, -gt] : null, b > gt ? [gt, b] : null].filter(Boolean);
        for (const [s0, s1] of parts) if (s1 - s0 > 8) C.walls.push({ kind: 'h', x: V.x + (s0 + s1) / 2, y, len: s1 - s0, side });
      }
      C.arches.push({ x: V.x, y, w: C.gateW });
    }
    // les remparts est et ouest : des blocs, du nord au sud
    for (const side of [-1, 1]) {
      const x = V.x + side * h;
      for (let y = -h + 60; y <= h + 0.5; y += 60) {
        if (Math.abs(y - 30) < gt + 30) continue;
        C.walls.push({ kind: 'v', x, y: V.y + y, len: 60, side });
      }
    }
    // les tours : aux quatre coins, et de chaque côté des portes
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) C.towers.push({ x: V.x + sx * h, y: V.y + sy * h, r: 86, h: 232, flag: sy < 0 ? '#C8302A' : null });
    for (const s of [-1, 1]) {
      for (const side of [-1, 1]) {
        C.towers.push({ x: V.x + s * gt, y: V.y + side * h, r: 60, h: 196 });
        C.towers.push({ x: V.x + side * h, y: V.y + s * gt, r: 60, h: 196 });
      }
    }
    // (ce qui bloque) les murs, les tours
    for (let u = -h; u <= h; u += 44) {
      if (Math.abs(u) < gw) continue;
      for (const side of [-1, 1]) {
        C.solids.push({ x: V.x + u, y: V.y + side * h, r: 30, wall: true });
        C.solids.push({ x: V.x + side * h, y: V.y + u, r: 30, wall: true });
      }
    }
    for (const t of C.towers) C.solids.push({ x: t.x, y: t.y, r: t.r * 0.85 });
    // les portes (pour s'y retrouver) : leur milieu, et un point devant, dehors et dedans
    C.gates = [[0, -1, 'nord'], [0, 1, 'sud'], [1, 0, 'est'], [-1, 0, 'ouest']].map(([gx, gy, id]) => ({
      id, x: V.x + gx * h, y: V.y + gy * h, nx: gx, ny: gy,
      out: { x: V.x + gx * (h + 150), y: V.y + gy * (h + 150) }, in: { x: V.x + gx * (h - 150), y: V.y + gy * (h - 150) },
    }));
    // les maisons de pierre (les deux rangées de chaque quartier)
    const HOUSES = [
      [-800, -770], [-560, -770], [-320, -770], [-800, -490], [-560, -490], [-320, -490],
      [320, -770], [560, -770], [800, -770], [800, -490],
      [-800, 520], [-800, 800], [-560, 800], [-320, 800],
      [320, 520], [560, 520], [800, 520], [320, 800], [560, 800], [800, 800],
    ];
    HOUSES.forEach(([dx, dy], i) => {
      const o = { x: V.x + dx, y: V.y + dy, v: (i * 7 + 3) % 12 };
      C.houses.push(o);
      for (const s of [-1, 1]) C.solids.push({ x: o.x + s * 52, y: o.y - 44, r: 58 });
    });
    // le marché : les étals autour de la place, le puits au milieu ; le grand grenier
    const STALL = [[-250, -170, '#C8302A', 'ble'], [250, -170, '#3A6AC8', 'jarres'], [-290, 60, '#E8C05A', 'fruits'], [290, 60, '#6A8A3A', 'poissons'], [-180, 230, '#8A4AB8', 'tissus'], [180, 230, '#E86A9A', 'pain']];
    for (const [dx, dy, col, goods] of STALL) {
      const o = { x: V.x + dx, y: V.y + dy, col, goods, seed: dx * 0.01 + dy };
      C.stalls.push(o);
      C.solids.push({ x: o.x, y: o.y - 22, r: 56 });
    }
    C.well = { x: V.x, y: V.y - 20 };
    C.solids.push({ x: C.well.x, y: C.well.y - 18, r: 56 });
    C.silo = { x: V.x - 210, y: V.y + 600 };
    C.solids.push({ x: C.silo.x, y: C.silo.y - 20, r: 76 });
    // la carrière, et ses tas de pierres taillées
    C.quarry = { x: V.x + k.quarry[0], y: V.y + k.quarry[1], r: 330 };
    for (let i = 0; i < (k.stones || 8); i++) {
      const a = (i / (k.stones || 8)) * TAU + R(-0.2, 0.2), d = C.quarry.r * R(0.35, 0.72);
      M.items.push({ type: 'pierre', x: C.quarry.x + Math.cos(a) * d, y: C.quarry.y + Math.sin(a) * d * 0.68, r: 44, seed: Math.floor(rnd() * 1e6), amount: 4, max: 4, res: 'pierre' });
    }
    // les balles de laine, devant la porte du parc à moutons
    const sheep = (W.sites || []).find((s) => s.type === 'enclos' && /mouton/.test(s.id));
    if (sheep) {
      const px = V.x + sheep.at[0], py = V.y + sheep.at[1], ga = sheep.gate ?? Math.PI;
      for (let i = 0; i < (k.wool || 4); i++) {
        const a = ga + (i - ((k.wool || 4) - 1) / 2) * 0.34;
        M.items.push({ type: 'laine', x: px + Math.cos(a) * (sheep.r + 120), y: py + Math.sin(a) * (sheep.r + 120), r: 38, seed: Math.floor(rnd() * 1e6), amount: 2, max: 2, res: 'laine' });
      }
    }
    // le pont (là où la route traverse le fleuve), le port (plus au sud), le grand chantier
    const by = V.y, brx = T.riverX(by), rw = M.riverW;
    C.bridge = { x0: brx - rw / 2 - 80, x1: brx + rw / 2 + 80, y: by, hw: 70 };
    const py = V.y + (k.port || 1800), prx = T.riverX(py);
    C.port = { x: prx + rw / 2 + 30, y: py, dock: prx - 30, boatX: prx, counter: { x: prx + rw / 2 + 130, y: py + 40 } };
    C.port.crane = { x: C.port.x + 120, y: py - 110 };
    const fs = (W.sites || []).find((s) => s.type === 'fondations');
    const mc = fs ? fs.at : k.monument;
    C.mon = { x: V.x + mc[0], y: V.y + mc[1] + 170, w: 440, d: 340, cy: V.y + mc[1] };
    C.yard = { x: V.x + k.yard[0], y: V.y + k.yard[1] };
    C.yard.counter = { x: C.yard.x, y: C.yard.y + 110 };
    C.stock = { x: C.yard.x - 40, y: C.yard.y + 290 };
    C.solids.push({ x: C.yard.x, y: C.yard.y - 20, r: 70 });
    // les villages voisins
    for (const t of k.towns) {
      const o = { ...t, x: V.x + t.at[0], y: V.y + t.at[1], r: 470, huts: [], stakes: [] };
      o.gate = Math.atan2(V.y - o.y, V.x - o.x);
      const dir = (a, d) => ({ x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d });
      const n = Math.round(TAU * o.r / 30);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        if (Math.abs(angleDiff(a, o.gate)) < 0.2) continue;
        const p = dir(a, o.r);
        o.stakes.push({ ...p, seed: i * 31 + 7, rope: i % 4 === 0 });
        C.solids.push({ ...p, r: 17, wall: true });
      }
      o.huts.push({ ...dir(o.gate + Math.PI, o.r * 0.42), r: 92 });
      for (const da of [1.15, -1.15, 1.95, -1.95, 2.6, -2.6]) o.huts.push({ ...dir(o.gate + da, o.r * 0.64), r: 70 });
      for (const hh of o.huts) C.solids.push({ x: hh.x, y: hh.y - 20, r: hh.r * 0.8 });
      o.stall = { ...dir(o.gate, o.r * 0.42), col: o.col, goods: t.id === 'ouest' ? 'poissons' : t.fav === 'laine' ? 'tissus' : 'jarres' };
      o.stall.front = { x: o.stall.x, y: o.stall.y + 70 };
      C.solids.push({ x: o.stall.x, y: o.stall.y - 22, r: 50 });
      o.fire = { x: o.x, y: o.y + 10 };
      C.solids.push({ x: o.fire.x, y: o.fire.y, r: 34 });
      o.banner = dir(o.gate + 1.0, o.r * 0.6);
      o.towers = [dir(o.gate + 0.42, o.r * 0.8), dir(o.gate - 0.42, o.r * 0.8)];
      o.door = dir(o.gate, o.r + 90);
      C.towns.push(o);
    }
    // la route pavée : de la porte ouest jusqu'au pont, puis du pont jusqu'au village de l'Ouest
    const west = C.towns.find((t) => t.id === ((W.sites || []).find((s) => s.type === 'route') || {}).to) || C.towns[0];
    C.roadTo = west;
    C.parts = [
      [{ x: V.x - h - 70, y: V.y }, { x: C.bridge.x1, y: by }],
      [{ x: C.bridge.x0, y: by }, west ? { x: west.door.x - 40, y: west.door.y } : { x: C.bridge.x0 - 600, y: by }],
    ];
    agents = [];
    S();
    return C;
  }

  /** Les plans du niveau qui ont besoin de la carte : le pont, le port, la route (en morceaux) */
  function expandSite(s) {
    if (!C) return null;
    if (s.type === 'pont') return [{ ...s, x: C.bridge.x1 - 40, y: C.bridge.y }];
    if (s.type === 'port') return [{ ...s, x: C.port.x + 70, y: C.port.y }];
    if (s.type === 'route') {
      const out = [];
      let n = 0;
      for (const [a, b] of C.parts) {
        const L = Math.hypot(b.x - a.x, b.y - a.y), m = Math.max(1, Math.round(L / (s.step || 250)));
        for (let i = 0; i < m; i++) {
          const ax = lerp(a.x, b.x, i / m), ay = lerp(a.y, b.y, i / m), bx = lerp(a.x, b.x, (i + 1) / m), by = lerp(a.y, b.y, (i + 1) / m);
          out.push({ ...s, id: `${s.id}-${n++}`, ax, ay, bx, by, x: (ax + bx) / 2, y: (ay + by) / 2, seg: true });
        }
      }
      return out;
    }
    return null;
  }

  /** Là où rien ne pousse (pas d'arbres, pas de buissons) : la ville, les champs, les parcs, la carrière, le chantier, les villages… */
  function reserved(x, y, m = 0) {
    if (!C) return false;
    const h = C.half + 260 + m;
    if (Math.abs(x - C.x) < h && Math.abs(y - C.y) < h) return true;
    if (Math.hypot(x - C.quarry.x, y - C.quarry.y) < C.quarry.r + 120 + m) return true;
    if (Math.abs(x - C.mon.x) < C.mon.w + 400 + m && y > C.mon.y - C.mon.d - 300 - m && y < C.mon.y + 450 + m) return true;
    if (Math.abs(x - C.yard.x) < 380 + m && Math.abs(y - C.yard.y - 100) < 360 + m) return true;
    if (Math.abs(x - C.port.x - 80) < 300 + m && Math.abs(y - C.port.y) < 300 + m) return true;
    for (const t of C.towns) if (Math.hypot(x - t.x, y - t.y) < t.r + 200 + m) return true;
    // (le pont et ses abords : pas de roseaux devant ses arches)
    const B = C.bridge;
    if (x > B.x0 - 120 - m && x < B.x1 + 120 + m && y > B.y - B.hw - 160 - m && y < B.y + B.hw + 260 + m) return true;
    for (const [a, b] of C.parts) if (segDist(x, y, a.x, a.y, b.x, b.y) < 130 + m) return true;
    const M = T.M();
    for (const s of M ? M.W.sites || [] : []) {
      if (!s.at || (s.type !== 'enclos' && s.type !== 'champ')) continue;
      const sx = C.x + s.at[0], sy = C.y + s.at[1];
      if (s.type === 'enclos' ? Math.hypot(x - sx, y - sy) < s.r + 140 + m : Math.abs(x - sx) < 190 + m && Math.abs(y - sy) < 140 + m) return true;
    }
    // (entre la ville et les champs, les parcs) un peu de place pour passer
    return Math.abs(x - C.x) < C.half + 900 + m && Math.abs(y - C.y) < 160 + m;
  }
  const inCity = (x, y, m = 0) => !!C && Math.abs(x - C.x) < C.half + m && Math.abs(y - C.y) < C.half + m;

  /** Ce qui bloque : les remparts, les maisons, les étals, les villages ; et ce qu'on a construit */
  function solids(out) {
    if (!C) return;
    out.push(...C.solids);
    const g = api.game();
    for (const s of T.M().sites) {
      if (g.built[s.id] !== true) continue;
      if (s.type === 'ecole') for (const d of [-1, 1]) out.push({ x: s.x + d * 52, y: s.y - 44, r: 58 });
      if (s.type === 'port') out.push({ x: C.port.crane.x, y: C.port.crane.y, r: 46 });
      if (s.type === 'fondations' && (S().chantier.k > 0 || api.chapter().missions.some((m) => m.type === 'monument'))) {
        // le monument (une fois qu'il monte) : on en fait le tour
        const m = C.mon;
        for (let x = -m.w + 70; x <= m.w - 70; x += 110) for (let y = 60; y <= m.d - 60; y += 110) out.push({ x: m.x + x, y: m.y - y, r: 78 });
      }
    }
  }

  /** Le fleuve : on ne le traverse pas (sauf sur le pont, une fois construit) */
  function riverBlock(e, rad) {
    const M = T.M();
    if (!M || !M.L.riverBlock) return;
    const rx = T.riverX(e.y), half = M.riverW / 2 + rad * 0.6;
    if (Math.abs(e.x - rx) >= half) return;
    if (bridgeBuilt() && Math.abs(e.y - C.bridge.y) < C.bridge.hw - rad * 0.4 && e.x > C.bridge.x0 - 40 && e.x < C.bridge.x1 + 40) return;
    // on reste du côté d'où l'on vient
    const side = e.px !== undefined ? Math.sign(e.px - rx) || 1 : Math.sign(e.x - rx) || 1;
    e.x = rx + side * half;
    if (e === api.player()) api.sayOnce('river', api.lines().river, 90, 1);
    if (e.wx !== undefined) { e.wx = e.x + side * 400; e.wy = e.y; }
  }
  const bridgeBuilt = () => !!C && T.M().sites.some((s) => s.type === 'pont' && api.game().built[s.id] === true);
  const roadBuilt = () => !!C && T.M().sites.filter((s) => s.type === 'route').every((s) => api.game().built[s.id] === true);

  /** Sur les rues pavées, le pont et la route : on marche plus vite */
  function speedAt(x, y) {
    if (!C) return 1;
    let paved = false;
    if (inCity(x, y)) paved = Math.abs(x - C.x) < C.street / 2 || Math.abs(y - C.y) < C.street / 2 || ((x - C.x) / C.plaza) ** 2 + ((y - C.y) / (C.plaza * 0.82)) ** 2 < 1;
    else if (bridgeBuilt() && Math.abs(y - C.bridge.y) < C.bridge.hw && x > C.bridge.x0 && x < C.bridge.x1) paved = true;
    else {
      const g = api.game();
      for (const s of T.M().sites) if (s.seg && g.built[s.id] === true && segDist(x, y, s.ax, s.ay, s.bx, s.by) < 70) { paved = true; break; }
    }
    if (paved && !inCity(x, y)) api.sayOnce('road', api.lines().road, 600, 1);
    return paved ? 1.28 : 1;
  }

  /** (près du grand monument) la caméra recule, pour le voir en entier */
  function zoomAt(p) {
    if (!C || api.game().built.fondations !== true) return 1;
    const d = Math.hypot(p.x - C.mon.x, p.y - C.mon.cy);
    return lerp(0.7, 1, clamp((d - 700) / 900, 0, 1));
  }

  /** Pourquoi ce plan est verrouillé (null s'il ne l'est pas) */
  function lockText(s) {
    if (s.type === 'fondations' && !S().monument && api.game().owned[s.need]) return 'Choisis d’abord la forme du monument';
    return null;
  }

  /* ============================================================================
     LES GESTES DU JOUEUR : vendre au marché, embaucher, commander un bateau,
     déposer ses pierres au chantier, choisir la forme du monument
     ============================================================================ */
  function interact(p, dt) {
    if (!C || p.dead) return;
    const g = api.game(), st = S(), k = K(), ch = g.chapter + 1;
    g.res = g.res || {};
    // (aux marchés des villages amis) on vend son blé et sa laine
    let stall = null;
    for (const t of C.towns) {
      const ts = st.towns[t.id];
      if (ts.friend && ts.met && dist(p, t.stall.front) < 175) stall = t;
    }
    p.stall = stall;
    if (stall) {
      const ts = st.towns[stall.id];
      if (!g.owned.balance && EVOS().balance) {
        api.sayOnce('tradeLocked', api.lines().tradeLocked, 30, 2);
      } else {
        const fav = stall.fav || k.friendFav || 'laine';
        const good = (g.res[fav] || 0) > 0 ? fav : GOODS.find((r) => (g.res[r] || 0) > 0);
        if (!good) {
          api.sayOnce('tradeNothing', api.lines().tradeNothing, 30, 2);
          sellT = 0;
        } else if ((sellT += dt) >= SELL_TIME) {
          sellT = 0;
          sell(stall, ts, good, good === fav);
        }
      }
    } else sellT = 0;
    // (au chantier) on dépose ses pierres et son bois
    const building = api.chapter().missions.some((m) => m.type === 'monument') && g.built.fondations === true;
    if (building && Math.hypot(p.x - C.mon.x, p.y - (C.mon.y - C.mon.d / 2)) < C.mon.w + 200 && Math.abs(p.y - (C.mon.y - C.mon.d / 2)) < C.mon.d / 2 + 260) {
      const keep = reserve();
      const res = ['pierre', 'bois'].find((r) => (g.res[r] || 0) > (keep[r] || 0));
      if (res && (storeT += dt) >= STORE_TIME) {
        storeT = 0;
        g.res[res]--;
        st.chantier[res] += 1;
        api.floater(`+1 ${api.resName(res)}`, C.mon.x - C.mon.w * 0.6, C.mon.y - 60, '#FFE58A', 0.8);
        api.sfx.pickup();
        api.sayOnce('stored', api.lines().stored, 120, 1);
        api.changed();
      }
    } else storeT = 0;
    // (le monument) sa forme se choisit sur le grand chantier
    if (g.owned.plans && !st.monument && api.chapter().missions.some((m) => m.type === 'choose')
      && Math.hypot(p.x - C.mon.x, p.y - C.mon.cy) < C.mon.w + 220 && performance.now() > chooseAt && !(p.speed > 0.6)) {
      chooseAt = performance.now() + 6000;
      api.chooseMonument();
    }
    // les comptoirs : embaucher un ouvrier, commander un bateau
    const cn = counterAt(p);
    p.counter = cn;
    if (cn && p.speed < 0.35) {
      counterT += dt;
      if (counterT >= COUNTER_TIME) {
        counterT = 0;
        useCounter(cn, p);
      }
    } else counterT = 0;
    p.counterT = counterT;
  }
  const EVOS = () => api.level().evolutions;

  /** Ce qu'on garde pour les plans encore à construire (on ne le dépose pas au chantier) */
  function reserve() {
    const g = api.game(), ch = g.chapter + 1, out = {};
    for (const s of T.M().sites) {
      if ((s.ch || 1) > ch || g.built[s.id] === true) continue;
      for (const [r, n] of Object.entries(s.cost || {})) out[r] = (out[r] || 0) + n;
    }
    return out;
  }

  /** Une marchandise vendue au marché d'un village ami */
  function sell(t, ts, good, fav) {
    const g = api.game(), k = K();
    let price = (k.price || 2) + (fav ? k.favBonus || 1 : 0);
    if (g.owned.ecriture) price++;
    if (g.owned.mathematiques) price++;
    g.res[good]--;
    g.res.argent = (g.res.argent || 0) + price;
    g.coins = (g.coins || 0) + price;
    g.traded = g.traded || {};
    g.traded[t.id] = (g.traded[t.id] || 0) + 1;
    g.traded._all = (g.traded._all || 0) + 1;
    const before = ts.amitie;
    ts.amitie = Math.min(1, ts.amitie + (k.friendGain || 0.05) * (fav ? 1.25 : 1));
    api.floater(`+${price} pièces`, t.stall.x, t.stall.y - 170, '#E8EEF6', 1);
    if (g.owned.ecriture && g.traded._all % 3 === 1) {
      api.floater('📜 Noté !', t.stall.x + 70, t.stall.y - 220, '#F2E6C4', 0.9);
      api.sayOnce('tablet', api.lines().tablet, 200, 1);
    }
    api.deed(1, t.stall.x - 60, t.stall.y - 200, true);
    api.sfx.pickup();
    api.sayOnce('traded', api.lines().traded, 200, 1);
    if (before < 1 && ts.amitie >= 1) {
      api.say(api.lines().friendMax.replace('{x}', cap(t.name)), 2, 6000);
      api.confetti(40);
      api.sfx.victory();
    }
    api.changed();
    api.checkMissions();
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** Les comptoirs (le chef de chantier, le quai du port) : seulement quand ils servent */
  function counters() {
    if (!C) return [];
    const g = api.game(), k = K(), CH = api.chapter(), out = [];
    if (CH.missions.some((m) => m.type === 'hire' || m.type === 'monument') && g.built.fondations === true) {
      out.push({ id: 'embauche', x: C.yard.counter.x, y: C.yard.counter.y, cost: k.worker.cost, name: 'Embaucher un ouvrier', icon: 'ouvrier' });
    }
    const port = T.M().sites.find((s) => s.type === 'port');
    if (port && g.built[port.id] === true) out.push({ id: 'bateau', x: C.port.counter.x, y: C.port.counter.y, cost: k.boat.cost, name: 'Commander un bateau', icon: 'bateau' });
    return out;
  }
  function counterAt(p) {
    return counters().find((c) => Math.hypot(p.x - c.x, p.y - c.y) < 110) || null;
  }
  function useCounter(cn, p) {
    const g = api.game(), st = S(), k = K();
    if ((g.res.argent || 0) < cn.cost) {
      if (performance.now() > lackAt) {
        lackAt = performance.now() + 2500;
        api.floater(`Il manque ${cn.cost - (g.res.argent || 0)} pièces`, cn.x, cn.y - 160, '#FFB36B', 1);
        api.sayOnce(`${cn.id}Need`, api.lines()[cn.id === 'bateau' ? 'boatNeed' : 'hireNeed'].replace('{n}', cn.cost), 40, 2);
      }
      return;
    }
    g.res.argent -= cn.cost;
    if (cn.id === 'embauche') {
      st.workers++;
      api.floater('Un ouvrier de plus !', cn.x, cn.y - 170, '#7CF0A0', 1.3);
      api.say(api.lines().hired, 2, 5000);
      addWorker(st.workers - 1);
    } else {
      // un bateau part de l'embouchure, plus au sud, et remonte le fleuve jusqu'au port
      const W = api.level().world;
      // (plusieurs bateaux commandés : ils partent l'un après l'autre)
      const y0 = W.h - 120, queue = agents.filter((a) => a.type === 'boat' && a.state === 'monte').length;
      agents.push({ type: 'boat', x: T.riverX(y0), y: y0, load: true, state: 'monte', wait: queue * 4, seed: Math.random() * 10, col: ['#C8302A', '#2E5AA8', '#E8C05A'][Math.floor(Math.random() * 3)] });
      api.floater('Bateau commandé !', cn.x, cn.y - 170, '#9EE7FF', 1.3);
      api.say(api.lines().boatOrdered, 2, 5000);
    }
    api.deed(5, cn.x, cn.y - 210);
    api.sfx.mission();
    api.changed();
    api.checkMissions();
  }
  function addWorker(i) {
    agents.push({ type: 'ouvrier', i, x: C.stock.x + (Math.random() - 0.5) * 200, y: C.stock.y + 60, seed: Math.random() * 10, walk: 0, carry: null, state: 'prendre' });
  }

  /* ============================================================================
     CE QUI VIT TOUT SEUL : les villages, les charrettes, les bateaux, le chantier
     ============================================================================ */
  function update(dt) {
    if (!C) return;
    const g = api.game(), st = S(), p = api.player(), k = K();
    // les villages : on découvre s'ils sont amis ou hostiles en s'approchant
    for (const t of C.towns) {
      const ts = st.towns[t.id];
      const d = p.dead ? Infinity : dist(p, t);
      if (!ts.friend && !ts.known && d < (k.reveal || 1500)) {
        ts.known = true;
        api.horn();
        api.say(api.lines().townHostile.replace('{x}', cap(t.name)), 3, 7000);
        api.floater('Village hostile !', t.x, t.y - 420, '#FF8A8A', 1.6);
        api.changed();
      } else if (!ts.friend && ts.known && d < (k.aggro || 1100) + 300) {
        api.sayOnce(`hostile-${t.id}`, api.lines().townKnownHostile.replace('{x}', cap(t.name)), 60, 2);
      }
      if (ts.friend && !ts.met && d < 700) {
        ts.met = true;
        ts.known = true;
        ts.amitie = Math.min(1, ts.amitie + (k.meetGain || 0.1));
        api.say(api.lines().townFriend.replace('{x}', cap(t.name)), 3, 7000);
        api.floater('Un village ami !', t.x, t.y - 420, '#7CF0A0', 1.6);
        api.deed(25, t.x, t.y - 480);
        api.confetti(50);
        api.sfx.chapter();
        api.changed();
        api.checkMissions();
      }
      // (la roue) les charrettes des villages amis viennent vendre à ton marché
      const cv = k.caravan;
      if (cv && ts.friend && ts.met && ts.amitie >= (cv.friend ?? 0.5) && g.owned[cv.need || 'roue'] && (t.id !== C.roadTo.id || roadBuilt())) {
        t.cartT = (t.cartT ?? cv.every * 0.3) - dt;
        if (t.cartT <= 0 && !agents.some((a) => a.type === 'cart' && a.town === t)) {
          t.cartT = cv.every * (0.85 + Math.random() * 0.3);
          agents.push({ type: 'cart', town: t, path: cartPath(t), i: 0, x: t.door.x, y: t.door.y, walk: 0, face: 1, back: false, col: t.col, goods: t.stall.goods });
        }
      }
    }
    updateAgents(dt);
    updateMonument(dt);
  }

  /** Le chemin d'une charrette : de la porte de son village jusqu'au marché */
  function cartPath(t) {
    const pts = [{ x: t.door.x, y: t.door.y }];
    if (t === C.roadTo) {
      // par la route pavée et le pont
      const [a, b] = C.parts;
      pts.push(b[1], b[0], a[1], a[0]);
    } else {
      // tout droit jusqu'à la porte de la ville la plus proche
      const gate = C.gates.reduce((m, q) => (dist(q.out, t) < dist(m.out, t) ? q : m));
      pts.push(gate.out);
    }
    // puis par la rue, jusqu'au bord de la place du marché
    const gate = C.gates.reduce((m, q) => (dist(q.out, pts[pts.length - 1]) < dist(m.out, pts[pts.length - 1]) ? q : m));
    pts.push(gate.in, { x: C.x + gate.nx * 470, y: C.y + gate.ny * 470 });
    return pts;
  }

  function updateAgents(dt) {
    const g = api.game(), st = S(), k = K(), p = api.player();
    // (une ancienne partie) les ouvriers déjà embauchés
    if (agents.filter((a) => a.type === 'ouvrier').length < st.workers) for (let i = agents.filter((a) => a.type === 'ouvrier').length; i < st.workers; i++) addWorker(i);
    for (const a of agents) {
      if (a.type === 'cart') {
        // (au marché) les marchands vendent un moment, puis repartent
        if (a.wait > 0) { a.wait -= dt; a.moving = false; continue; }
        const to = a.path[a.i];
        const dx = to.x - a.x, dy = to.y - a.y, d = Math.hypot(dx, dy) || 1;
        const v = 140 * dt;
        a.moving = true;
        if (d > v) {
          a.x += dx / d * v;
          a.y += dy / d * v;
          if (Math.abs(dx) > 4) a.face = dx > 0 ? 1 : -1;
          a.walk += v / 40;
        } else if (!a.back && a.i + 1 < a.path.length) a.i++;
        else if (a.back && a.i > 0) a.i--;
        else if (!a.back) {
          // arrivée au marché : les marchands paient pour vendre chez toi
          let gain = k.caravan.gain || 8;
          if (g.owned.ecriture) gain += 4;
          if (g.owned.mathematiques) gain += 4;
          g.res.argent = (g.res.argent || 0) + gain;
          g.coins = (g.coins || 0) + gain;
          st.towns[a.town.id].amitie = Math.min(1, st.towns[a.town.id].amitie + 0.02);
          api.floater(`Charrette de ${a.town.name} : +${gain} pièces`, a.x, a.y - 160, '#E8EEF6', 1.1);
          if (dist(a, p) < 1400) { api.sayOnce('caravan', api.lines().caravan, 240, 1); api.sfx.pickup(); }
          api.changed();
          api.checkMissions();
          a.back = true;
          a.wait = 4;
        } else a.gone = true;
      } else if (a.type === 'boat') {
        const W = api.level().world;
        if (a.wait > 0) { a.wait -= dt; a.hidden = true; continue; }
        a.hidden = false;
        if (a.state === 'monte') {
          a.y -= dt * (W.h - 120 - C.port.y) / (k.boat.sail || 16);
          if (a.y <= C.port.y + 40) {
            a.y = C.port.y + 40;
            a.state = 'decharge';
            a.t = 3;
            st.chantier.pierre += k.boat.pierre || 50;
            st.chantier.bois += k.boat.bois || 12;
            g.boats = (g.boats || 0) + 1;
            st.boatsTotal++;
            api.floater(`+${k.boat.pierre} pierres, +${k.boat.bois} bois pour le chantier`, C.port.x, C.port.y - 260, '#FFE58A', 1.2);
            if (dist(p, C.port) < 2200) api.sfx.chapter();
            api.say(api.lines().boatArrived, 2, 5000);
            api.changed();
            api.checkMissions();
          }
        } else if (a.state === 'decharge') {
          a.t -= dt;
          if (a.t < 1.6) a.load = false;
          if (a.t <= 0) a.state = 'repart';
        } else {
          a.y += dt * 260;
          if (a.y > W.h + 300) a.gone = true;
        }
        a.x = T.riverX(a.y);
      } else if (a.type === 'ouvrier') {
        // les ouvriers : de la réserve au monument (avec un bloc), puis retour
        const working = st.chantier.k < 1 && st.chantier.pierre >= 1 && g.built.fondations === true;
        const m = C.mon;
        if (!a.to || dist(a, a.to) < 12) {
          if (!working) {
            a.carry = null;
            a.to = { x: C.yard.x + (Math.random() - 0.5) * 300, y: C.yard.y + 120 + Math.random() * 120 };
            a.pause = 1 + Math.random() * 3;
          } else if (a.state === 'prendre') {
            a.state = 'poser';
            a.carry = 'bloc';
            a.to = { x: m.x + (Math.random() - 0.5) * m.w * 1.6, y: m.y + 30 + Math.random() * 30 };
          } else {
            a.state = 'prendre';
            a.carry = null;
            a.pause = 0.6;
            a.to = { x: C.stock.x + (Math.random() - 0.5) * 220, y: C.stock.y + 40 + Math.random() * 30 };
          }
        }
        if (a.pause > 0) { a.pause -= dt; a.speed = 0; continue; }
        const dx = a.to.x - a.x, dy = a.to.y - a.y, d = Math.hypot(dx, dy) || 1, v = 95 * dt;
        a.x += dx / d * Math.min(v, d);
        a.y += dy / d * Math.min(v, d);
        a.angle = Math.atan2(dy, dx);
        a.walk += v / 20;
        a.speed = 0.6;
      }
    }
    agents = agents.filter((a) => !a.gone);
  }

  /** Le monument monte : tant qu'il y a des ouvriers, des pierres et du bois */
  function updateMonument(dt) {
    const g = api.game(), st = S(), k = K(), CH = api.chapter();
    if (!CH.missions.some((m) => m.type === 'monument') || g.built.fondations !== true || st.chantier.k >= 1) return;
    const C0 = st.chantier, need = k.needs || { pierre: 300, bois: 60 };
    const p = api.player();
    const near = dist(p, { x: C.mon.x, y: C.mon.cy }) < 1600;
    if (!st.workers) { if (near) api.sayOnce('noWorkers', api.lines().noWorkers, 50, 2); return; }
    const dk = st.workers * (k.worker.rate || 0.0012) * (g.owned.levier ? 1.5 : 1) * dt;
    const np = dk * need.pierre, nb = dk * need.bois;
    if (C0.pierre < np) { if (near) api.sayOnce('noStone', api.lines().noStone, 45, 2); return; }
    if (C0.bois < nb) { if (near) api.sayOnce('noWood', api.lines().noWood, 45, 2); return; }
    C0.pierre -= np;
    C0.bois -= nb;
    const before = C0.k;
    C0.k = Math.min(1, C0.k + dk);
    if (Math.floor(before * 100) !== Math.floor(C0.k * 100)) api.checkMissions();
    if (before < 0.5 && C0.k >= 0.5) api.say(api.lines().monumentHalf, 2, 6000);
    if (C0.k >= 1) {
      api.say(api.lines().monumentDone, 3, 8000);
      api.confetti(140);
      api.sfx.victory();
      api.shake(0.4);
      api.checkMissions();
    }
  }

  /* ============================================================================
     LE CERVEAU : les habitants des autres villages, les soldats des villages hostiles
     (renvoie true si l'animal a été conduit ici)
     ============================================================================ */
  function steer(c, dt, p) {
    if (!C || !c.town) return false;
    const t = C.towns.find((o) => o.id === c.town);
    if (!t) return false;
    const st = S(), k = K();
    if (c.sp.kind === 'hunter') {
      // un soldat : il garde son village ; si tu t'approches, il fonce sur toi
      const dp = p.dead ? Infinity : dist(p, t);
      if (dp < (k.aggro || 1100) && p.invul <= 0 && dist(c, t) < (k.leash || 1700)) {
        if (c.state === 'wander' && !(c.rest > 0)) c.noiseT = 0.5;
        return false;
      }
      if ((c.state === 'chase' || c.state === 'alert') && dist(c, t) < (k.leash || 1700) && dp < (k.leash || 1700)) return false;
      if (c.state === 'chase' || c.state === 'alert') { c.state = 'wander'; c.rest = 2; }
      // il retourne à son poste, devant la porte
      const post = c.postAt || (c.postAt = { x: t.x + Math.cos(t.gate + (Math.random() - 0.5) * 0.8) * t.r * (0.5 + Math.random() * 0.7), y: t.y + Math.sin(t.gate + (Math.random() - 0.5) * 0.8) * t.r * (0.5 + Math.random() * 0.7) });
      const dx = post.x - c.x, dy = post.y - c.y, d = Math.hypot(dx, dy) || 1;
      if (d < 30) {
        api.steer(c, 0, 0, 0, dt);
        c.angle = t.gate;
        if (Math.random() < dt * 0.15) c.postAt = null;
      } else api.steer(c, dx / d, dy / d, c.sp.speed * (d > 600 ? 0.8 : 0.35), dt);
      c.mood = 'angry';
      c.fleeing = false;
      return true;
    }
    // un habitant : il se promène dans son village, et te sourit
    c.fleeing = false;
    c.mood = 'happy';
    if (!c.wx || Math.hypot(c.wx - c.x, c.wy - c.y) < 30 || Math.hypot(c.wx - t.x, c.wy - t.y) > t.r * 0.7) {
      const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * t.r * 0.6;
      c.wx = t.x + Math.cos(a) * d;
      c.wy = t.y + Math.sin(a) * d;
      c.restT = Math.random() * 4;
    }
    if (c.restT > 0) {
      c.restT -= dt;
      api.steer(c, 0, 0, 0, dt);
      if (!p.dead && dist(p, c) < 300) c.angle = Math.atan2(p.y - c.y, p.x - c.x);
      return true;
    }
    const dx = c.wx - c.x, dy = c.wy - c.y, d = Math.hypot(dx, dy) || 1;
    api.steer(c, dx / d, dy / d, c.sp.speed * 0.5, dt);
    return true;
  }

  /** Les gens des autres villages : les habitants des villages amis, les soldats des villages hostiles */
  function populate() {
    if (!C) return;
    const st = S(), k = K(), sp = api.level().species;
    const habitant = Object.keys(sp).find((id) => sp[id].kind === 'habitant');
    const soldier = Object.keys(sp).find((id) => sp[id].kind === 'hunter' && sp[id].steals);
    for (const t of C.towns) {
      const friend = st.towns[t.id].friend;
      const id = friend ? habitant : soldier;
      if (!id) continue;
      const n = friend ? 6 : k.guards || 4;
      for (let i = 0; i < n; i++) {
        const a = friend ? Math.random() * TAU : t.gate + (i - (n - 1) / 2) * 0.32;
        const d = friend ? Math.sqrt(Math.random()) * t.r * 0.55 : t.r * 0.62;
        const c = api.spawnAt(id, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d);
        if (!c) continue;
        c.town = t.id;
        c.dress = t.col;
        c.post = { x: t.x, y: t.y, r: t.r };
        c.guard = true;
        c.angle = t.gate;
      }
    }
  }

  /** (attrapé par les soldats) ils prennent une partie de tes pièces */
  function caught(by) {
    if (!C || !by || !by.sp.steals) return;
    const g = api.game();
    const n = Math.ceil((g.res.argent || 0) * (K().steal || 0.3));
    if (n > 0) {
      g.res.argent -= n;
      api.floater(`−${n} pièces`, api.player().x, api.player().y - 120, '#FF8A8A', 1.4);
      api.changed();
    }
  }

  /* ============================================================================
     LE DESSIN
     ============================================================================ */
  const pal = () => api.chapter().palette || {};
  function drawGround(ctx, x0, x1, y0, y1, t) {
    if (!C) return;
    const g = api.game();
    const vis = (x, y, r) => x + r > x0 && x - r < x1 && y + r > y0 && y - r < y1;
    if (vis(C.x, C.y, C.half + 400)) drawCityGround(ctx, C, t);
    if (vis(C.quarry.x, C.quarry.y, C.quarry.r + 50)) drawQuarryGround(ctx, C.quarry);
    // la route pavée (les bords, puis les pavés : les morceaux se raccordent) ; ceux encore à paver, en pointillés
    const p = api.player();
    const segs = T.M().sites.filter((s) => s.seg && vis(s.x, s.y, 300));
    for (const pass of ['bord', 'paves']) for (const s of segs) if (g.built[s.id] === true) drawRoad(ctx, s, pass);
    for (const s of segs) if (g.built[s.id] !== true && (s.ch || 1) <= g.chapter + 1) drawRoadPlan(ctx, s, t, p.site === s);
    if (bridgeBuilt() && vis((C.bridge.x0 + C.bridge.x1) / 2, C.bridge.y, 500)) drawBridge(ctx, C.bridge, t);
    const port = T.M().sites.find((s) => s.type === 'port');
    if (port && g.built[port.id] === true && vis(C.port.x, C.port.y, 500)) drawPortGround(ctx, C.port);
    // les comptoirs
    for (const cn of counters()) if (vis(cn.x, cn.y, 200)) drawPlan(ctx, { x: cn.x, y: cn.y, planR: 90 }, t, p.counter && p.counter.id === cn.id);
    // le sol tassé du chantier
    if (vis(C.mon.x, C.mon.cy, C.mon.w + 500)) {
      ctx.fillStyle = 'rgba(170, 140, 90, 0.45)';
      ctx.beginPath();
      ctx.ellipse(C.mon.x - 200, C.mon.cy + 120, C.mon.w + 420, C.mon.d * 0.9, 0, 0, TAU);
      ctx.fill();
    }
  }

  /** Tout ce qui est debout, à ranger avec les animaux (du fond vers le devant) */
  function uprights(out, inV) {
    if (!C) return;
    for (const w of C.walls) if (inV(w, w.kind === 'h' ? w.len : 80)) out.push({ y: w.y, city: 'wall', o: w });
    for (const tw of C.towers) if (inV(tw, 120)) out.push({ y: tw.y, city: 'tower', o: tw });
    for (const a of C.arches) if (inV(a, 200)) out.push({ y: a.y + 1, city: 'arch', o: a });
    for (const h of C.houses) if (inV(h, 160)) out.push({ y: h.y, city: 'house', o: h });
    for (const s of C.stalls) if (inV(s, 120)) { out.push({ y: s.y, city: 'stall', o: s }); out.push({ y: s.y - 34, city: 'seller', o: s }); }
    if (inV(C.well, 100)) out.push({ y: C.well.y, city: 'well', o: C.well });
    if (inV(C.silo, 120)) out.push({ y: C.silo.y, city: 'silo', o: C.silo });
    if (inV(C.yard, 200)) { out.push({ y: C.yard.y, city: 'yard', o: C.yard }); out.push({ y: C.stock.y, city: 'stock', o: C.stock }); }
    const g = api.game();
    if (g.built.fondations === true && inV({ x: C.mon.x, y: C.mon.y }, C.mon.w + 200)) out.push({ y: C.mon.y, city: 'monument', o: C.mon });
    const port = T.M().sites.find((s) => s.type === 'port');
    if (port && g.built[port.id] === true && inV(C.port.crane, 200)) out.push({ y: C.port.crane.y, city: 'crane', o: C.port.crane });
    for (const t of C.towns) {
      if (!inV(t, t.r + 300)) continue;
      for (const s of t.stakes) out.push({ y: s.y, city: 'stake', o: s });
      for (const h of t.huts) out.push({ y: h.y, city: 'hut', o: h });
      out.push({ y: t.stall.y, city: 'stall', o: t.stall });
      if (S().towns[t.id].friend) out.push({ y: t.stall.y - 34, city: 'seller', o: { ...t.stall, town: t } });
      else for (const tw of t.towers) out.push({ y: tw.y, city: 'ttower', o: tw });
      out.push({ y: t.fire.y, city: 'fire', o: t.fire });
      out.push({ y: t.banner.y, city: 'banner', o: { ...t.banner, town: t } });
    }
    for (const a of agents) if (!a.hidden && inV(a, a.type === 'boat' ? 300 : 200)) out.push({ y: a.y, city: 'agent', o: a });
  }

  /** (le joueur est caché derrière) on voit à travers */
  function behind(o, up, hw) {
    const p = api.player();
    return !!p && !p.dead && p.y < o.y - 2 && p.y > o.y - up && Math.abs(p.x - o.x) < hw + p.size * 0.6;
  }
  function drawUpright(ctx, u, t) {
    if (u.city) {
      const o = u.o, P = pal();
      let fade = false;
      switch (u.city) {
        case 'wall':
          fade = o.kind === 'h' && behind(o, 190, o.len / 2);
          if (fade) ctx.globalAlpha = 0.45;
          if (o.kind === 'h') drawWallH(ctx, o); else drawWallV(ctx, o);
          break;
        case 'tower':
          fade = behind(o, o.h, o.r);
          if (fade) ctx.globalAlpha = 0.45;
          drawCityTower(ctx, o);
          break;
        case 'arch':
          fade = behind(o, 220, o.w / 2 + 30);
          if (fade) ctx.globalAlpha = 0.45;
          drawGateArch(ctx, o);
          break;
        case 'house':
          fade = behind(o, 200, 105);
          if (fade) ctx.globalAlpha = 0.45;
          drawStoneHouse(ctx, o, P.thatch || '#D2B060');
          break;
        case 'stall': drawStall(ctx, o); break;
        case 'seller': {
          const tw = o.town;
          api.drawLook(ctx, tw ? 'th-habitant' : 'th-citadin', '#B89A6A', o.x + 20, o.y - 34, 26, { seed: (o.seed || 0) + 3.3, dress: tw ? tw.col : o.col, angle: Math.PI / 2, mood: 'happy', front: true });
          break;
        }
        case 'well': drawWell(ctx, o, t); break;
        case 'silo': drawSilo(ctx, o, P.thatch || '#D2B060'); break;
        case 'yard': drawYard(ctx, o, t); break;
        case 'stock': drawStock(ctx, o, S().chantier.pierre, S().chantier.bois); break;
        case 'monument': {
          const st = S(), H = monumentHeight(o, st.monument);
          fade = behind(o, o.d + H * clamp(st.chantier.k, 0.15, 1), o.w);
          if (fade) ctx.globalAlpha = 0.5;
          drawMonument(ctx, o, st.monument, st.chantier.k, t, { found: st.chantier.k <= 0 });
          break;
        }
        case 'crane': drawCrane(ctx, o, t); break;
        case 'stake': drawTownStake(ctx, o); break;
        case 'hut': drawTownHut(ctx, o, t, P); break;
        case 'ttower': drawTownTower(ctx, o, t, (x, y) => api.drawLook(ctx, 'th-soldat', '#8A3A2A', x, y, 24, { seed: 2, angle: Math.PI / 2, mood: 'angry' })); break;
        case 'fire': drawTownFire(ctx, o, t); break;
        case 'banner': {
          const ts = S().towns[o.town.id];
          drawBanner(ctx, { ...o, col: o.town.col, state: ts.friend && ts.met ? 'ami' : !ts.friend && ts.known ? 'hostile' : '?' }, t);
          break;
        }
        case 'agent': drawAgent(ctx, o, t); break;
        default: break;
      }
      if (fade) ctx.globalAlpha = 1;
      return true;
    }
    if (u.item && (u.item.type === 'pierre' || u.item.type === 'laine')) {
      if (u.item.type === 'pierre') drawStonePile(ctx, u.item, t); else drawWoolBales(ctx, u.item, t);
      return true;
    }
    const s = u.site || u.ghost;
    if (!s) return false;
    if (s.type === 'ecole') {
      drawSchool(ctx, s, pal().thatch || '#D2B060');
      if (u.site) {
        // les élèves, assis devant avec leur tablette
        for (const [dx, seed] of [[-120, 1.1], [-80, 2.7], [-40, 4.2]]) api.drawLook(ctx, 'th-eleve', '#C2A878', s.x + dx, s.y + 30, 24, { seed, angle: Math.PI / 2, front: true, mood: 'happy' });
      }
      return true;
    }
    if (s.type === 'fondations' || s.type === 'pont' || s.type === 'port' || s.type === 'route') return true;
    return false;
  }

  function drawAgent(ctx, a, t) {
    if (a.type === 'boat') drawBoat(ctx, a, t);
    else if (a.type === 'cart') drawCart(ctx, a, t, (look, col, x, y, size, o) => api.drawLook(ctx, look, col, x, y, size, { seed: 1.7, mood: 'happy', ...o }));
    else if (a.type === 'ouvrier') api.drawLook(ctx, 'th-ouvrier', '#B07A52', a.x, a.y, 26, { seed: a.seed, angle: a.angle || 0, speed: a.speed || 0, walk: a.walk, carry: a.carry, mood: 'happy' });
  }

  /** Par-dessus : le nom des villages, leur amitié ; la hauteur du monument ; les comptoirs */
  function drawTop(ctx, t, zoom) {
    if (!C) return;
    const p = api.player(), st = S(), g = api.game(), k = 1 / zoom;
    const label = (x, y, text, col = '#FFF2C8') => {
      ctx.font = `800 ${14 * k}px 'Baloo 2', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 4 * k;
      ctx.strokeStyle = 'rgba(30, 20, 10, 0.85)';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = col;
      ctx.fillText(text, x, y);
    };
    const bar = (x, y, u, col) => {
      const w = 150 * k, h = 14 * k;
      ctx.fillStyle = 'rgba(30, 20, 10, 0.75)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - w / 2 - 3 * k, y - 3 * k, w + 6 * k, h + 6 * k, 8 * k) : ctx.rect(x - w / 2, y, w, h);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - w / 2, y, Math.max(h, w * clamp(u, 0, 1)), h, 6 * k) : ctx.rect(x - w / 2, y, w * u, h);
      ctx.fill();
    };
    for (const tw of C.towns) {
      const d = dist(p, tw);
      if (d > 1800) continue;
      const ts = st.towns[tw.id];
      const y = tw.banner.y - 300;
      const state = ts.friend && ts.met ? '🤝 ami' : !ts.friend && ts.known ? '⚠️ hostile' : '❓ ami ou ennemi ?';
      label(tw.banner.x + 50, y, `${cap(tw.name)} — ${state}`, ts.friend && ts.met ? '#B9F5DA' : !ts.friend && ts.known ? '#FF9A8A' : '#FFF2C8');
      if (ts.friend && ts.met) {
        bar(tw.banner.x + 50, y + 6 * k, ts.amitie, '#FF6F91');
        label(tw.banner.x + 50, y + 40 * k, `Amitié : ${Math.round(ts.amitie * 100)} %`, '#FFD0DC');
      }
    }
    // au marché d'un village ami : ce qu'il achète
    if (p.stall) {
      const tw = p.stall, fav = tw.fav || K().friendFav || 'laine';
      let price = (K().price || 2) + (g.owned.ecriture ? 1 : 0) + (g.owned.mathematiques ? 1 : 0);
      label(tw.stall.front.x, tw.stall.front.y + 70, `Marché : ${api.resName(fav)} ${price + (K().favBonus || 1)} pièces · ${api.resName(GOODS.find((r) => r !== fav))} ${price} pièces`, '#FFFFFF');
    }
    // le monument : sa hauteur, ses réserves, ses ouvriers
    if (g.built.fondations === true && dist(p, { x: C.mon.x, y: C.mon.cy }) < 1900 && api.chapter().missions.some((m) => m.type === 'monument')) {
      // (au pied du monument, là où l'on se tient : on la voit même quand il est très haut)
      const y = C.mon.y + 110;
      bar(C.mon.x, y, st.chantier.k, '#F2C24A');
      label(C.mon.x, y - 4 * k, `${(MONUMENTS[st.monument] || MONUMENTS.pyramide).name} : ${Math.floor(st.chantier.k * 100)} %`);
      label(C.mon.x, y + 44 * k, `Pierres ${Math.floor(st.chantier.pierre)} · Bois ${Math.floor(st.chantier.bois)} · Ouvriers ${st.workers}`, '#FFFFFF');
    }
    // le comptoir sur lequel on est : ce qu'il fait, ce qu'il coûte, et le cercle qui se remplit
    const cn = p.counter;
    if (cn && !p.dead) {
      const w = 230 * k, h = 58 * k, x = cn.x - w / 2, y = cn.y - 250 - h;
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
      ctx.fillText(cn.name, cn.x, y + 6 * k);
      drawResIcon(ctx, 'argent', cn.x - 30 * k, y + 42 * k, 9 * k);
      const have = g.res.argent || 0;
      ctx.fillStyle = have >= cn.cost ? '#2E8A4A' : '#C8302A';
      ctx.font = `800 ${13 * k}px 'Baloo 2', sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`${cn.cost} pièces (tu en as ${have})`, cn.x - 16 * k, y + 34 * k);
      if (p.counterT > 0) {
        ctx.strokeStyle = '#7CF0A0';
        ctx.lineWidth = 7 * k;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(p.x, p.y - p.size * 3.6, 22 * k, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, p.counterT / COUNTER_TIME));
        ctx.stroke();
      }
    }
  }

  /** Sur le radar : la ville (un carré), les villages (? / ami / hostile), la carrière, le chantier, la route */
  function minimap(mctx, toM, k) {
    if (!C) return;
    const st = S(), g = api.game();
    const a = toM(C.x - C.half, C.y - C.half), b = toM(C.x + C.half, C.y + C.half);
    mctx.strokeStyle = 'rgba(255, 220, 160, 0.85)';
    mctx.lineWidth = 2;
    mctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    mctx.strokeStyle = 'rgba(200, 180, 140, 0.8)';
    mctx.lineWidth = 3;
    mctx.beginPath();
    for (const s of T.M().sites) {
      if (!s.seg || g.built[s.id] !== true) continue;
      const p0 = toM(s.ax, s.ay), p1 = toM(s.bx, s.by);
      mctx.moveTo(p0.x, p0.y);
      mctx.lineTo(p1.x, p1.y);
    }
    mctx.stroke();
    const dot = (x, y, col, r = 4) => {
      const m = toM(x, y);
      mctx.fillStyle = col;
      mctx.beginPath();
      mctx.arc(m.x, m.y, r, 0, TAU);
      mctx.fill();
    };
    dot(C.quarry.x, C.quarry.y, '#D2CAB8', 4);
    if (g.built.fondations === true || api.chapter().missions.some((m) => m.type === 'choose')) dot(C.mon.x, C.mon.cy, '#F2C24A', 5);
    for (const t of C.towns) {
      const ts = st.towns[t.id];
      dot(t.x, t.y, ts.friend && ts.met ? '#7CF0A0' : !ts.friend && ts.known ? '#FF5A5A' : '#FFFFFF', 6);
    }
    for (const a2 of agents) if (a2.type !== 'ouvrier') dot(a2.x, a2.y, a2.type === 'boat' ? '#9EE7FF' : '#FFD24A', 2.5);
  }

  /* ---------- Ce que la flèche montre (les missions des premières villes) ----------
     undefined = ce n'est pas une mission d'ici ; null = rien à montrer */
  function target(m, p, near) {
    if (!C) return undefined;
    const g = api.game(), st = S(), k = K();
    const at = (o, img, size = 60) => ({ x: o.x, y: o.y - 60, size, img: near(img) });
    const goods = () => GOODS.reduce((n, r) => n + (g.res[r] || 0), 0);
    const met = C.towns.filter((t) => st.towns[t.id].friend && st.towns[t.id].met);
    // de quoi vendre : du blé mûr dans les champs, ou de la laine
    const fetch = () => {
      const f = api.ripeField(p);
      const w = api.nearestRes(p, 'laine');
      if (f && (!w || dist(f, p) < dist(w, p) * 1.3)) return { x: f.x, y: f.y, size: 60, img: near('ble') };
      return w ? at(w, 'laine', 40) : f ? { x: f.x, y: f.y, size: 60, img: near('ble') } : null;
    };
    const market = (only) => {
      const list = only ? met.filter((t) => t.id === only) : met;
      if (!list.length) return only ? null : unmet();
      // (le moins ami d'abord, pour gagner l'amitié de tous)
      const t = list.reduce((a, b) => (st.towns[b.id].amitie < st.towns[a.id].amitie - 0.05 || (Math.abs(st.towns[b.id].amitie - st.towns[a.id].amitie) <= 0.05 && dist(b, p) < dist(a, p)) ? b : a));
      return goods() > 0 ? at(t.stall.front, 'argent') : fetch();
    };
    const unmet = () => {
      const list = C.towns.filter((t) => !st.towns[t.id].met && !(st.towns[t.id].known && !st.towns[t.id].friend));
      if (!list.length) return null;
      const t = list.reduce((a, b) => (dist(b, p) < dist(a, p) ? b : a));
      return at(t.door, 'carte');
    };
    if (m.type === 'meet') {
      if (m.town) { const t = C.towns.find((o) => o.id === m.town); return t ? at(t.door, 'carte') : null; }
      return unmet();
    }
    if (m.type === 'trade') return market(m.town);
    if (m.type === 'friend') {
      const ok = met.filter((t) => (m.town ? t.id === m.town : true));
      if (!m.town && ok.length < m.n) return unmet() || market();
      const low = ok.filter((t) => st.towns[t.id].amitie * 100 < (m.pct || 100));
      if (!low.length) return null;
      return goods() > 0 ? at(low.reduce((a, b) => (st.towns[b.id].amitie < st.towns[a.id].amitie ? b : a)).stall.front, 'ami') : fetch();
    }
    if (m.type === 'money') return market();
    if (m.type === 'build') {
      // (un plan qui coûte des pièces d'argent) sans assez d'argent, on va d'abord vendre au marché
      const s = T.M().sites.find((o) => o.type === m.what && (o.ch || 1) <= g.chapter + 1 && g.built[o.id] !== true);
      const need = s && s.cost ? s.cost.argent || 0 : 0;
      return need && (g.res.argent || 0) < need && !(s.need && !g.owned[s.need]) ? market() : undefined;
    }
    if (m.type === 'choose') return { x: C.mon.x, y: C.mon.cy, size: 120, img: near('plans') };
    if (m.type === 'hire') return (g.res.argent || 0) >= k.worker.cost && g.built.fondations === true ? at(C.yard.counter, 'ouvrier') : market();
    if (m.type === 'boat') {
      const port = T.M().sites.find((s) => s.type === 'port');
      if (!port || g.built[port.id] !== true) return null;
      return (g.res.argent || 0) >= k.boat.cost ? at(C.port.counter, 'bateau') : market();
    }
    if (m.type === 'monument') {
      if (!st.workers) return (g.res.argent || 0) >= k.worker.cost ? at(C.yard.counter, 'ouvrier') : market();
      if (st.chantier.pierre < 5 || st.chantier.bois < 2) {
        // plus rien sur le chantier : un bateau, ses propres pierres, ou la carrière
        const port = T.M().sites.find((s) => s.type === 'port');
        if (port && g.built[port.id] === true && (g.res.argent || 0) >= k.boat.cost && !agents.some((a) => a.type === 'boat' && a.state === 'monte')) return at(C.port.counter, 'bateau');
        if ((g.res.pierre || 0) > 0 || (g.res.bois || 0) > 0) return { x: C.mon.x - C.mon.w * 0.5, y: C.mon.y, size: 80, img: near('pierre') };
        const res = st.chantier.pierre < 5 ? 'pierre' : 'bois';
        const it = api.nearestRes(p, res);
        if (it) return at(it, res, 40);
      }
      return { x: C.mon.x, y: C.mon.cy, size: 120, img: near('monument') };
    }
    return undefined;
  }

  /** Où aller pour entrer dans la ville (ou en sortir) : la porte la plus pratique, devant puis dedans */
  function cityRoute(p, x, y) {
    if (!C) return null;
    const xTo = x, yTo = y;
    // (les villages voisins) on entre et on sort par la porte de leur palissade
    for (const t of C.towns) {
      const pi = dist(p, t) < t.r - 10, ti = Math.hypot(x - t.x, y - t.y) < t.r - 10;
      if (pi === ti) continue;
      const c = Math.cos(t.gate), s = Math.sin(t.gate);
      const inner = { x: t.x + c * (t.r - 170), y: t.y + s * (t.r - 170) }, outer = t.door;
      const gx = t.x + c * t.r, gy = t.y + s * t.r;
      const inLane = Math.abs((p.x - gx) * s - (p.y - gy) * c) < 60 && Math.hypot(p.x - gx, p.y - gy) < 180;
      if (pi) return dist(p, inner) < 70 || inLane ? outer : inner;
      return dist(p, outer) < 70 || inLane ? inner : outer;
    }
    // le fleuve : on passe par le pont (avant tout le reste : on ne le traverse pas ailleurs)
    if (T.M().L.riverBlock) {
      const pSide = Math.sign(p.x - T.riverX(p.y)), tSide = Math.sign(x - T.riverX(y));
      if (pSide !== tSide) {
        const east = { x: C.bridge.x1 + 50, y: C.bridge.y }, west = { x: C.bridge.x0 - 50, y: C.bridge.y };
        const near = pSide > 0 ? east : west, far = pSide > 0 ? west : east;
        const onBridge = Math.abs(p.y - C.bridge.y) < C.bridge.hw && p.x > C.bridge.x0 - 60 && p.x < C.bridge.x1 + 60;
        if (onBridge || dist(p, near) < 60) return far;
        // (de l'autre côté de la ville : on va d'abord jusqu'au pont, par la ville s'il le faut)
        x = near.x;
        y = near.y;
      }
    }
    const pin = inCity(p.x, p.y, -10), tin = inCity(x, y, -10);
    let route = null;
    if (pin !== tin) {
      // (le chemin par une porte : jusqu'à elle, de notre côté, puis de l'autre côté jusqu'au but)
      const via = (g) => (pin ? dist(p, g.in) + Math.hypot(g.out.x - x, g.out.y - y) : dist(p, g.out) + Math.hypot(g.in.x - x, g.in.y - y));
      const gate = C.gates.reduce((a, b) => (via(b) < via(a) ? b : a));
      const first = pin ? gate.in : gate.out, second = pin ? gate.out : gate.in;
      // (devant la porte, de notre côté : on la traverse)
      route = dist(p, first) < 90 || (Math.abs((p.x - gate.x) * gate.ny - (p.y - gate.y) * gate.nx) < 70 && dist(p, gate) < 170) ? second : first;
    } else if (!pin) {
      // (dehors, mais la ville est sur le chemin) on passe par la ville : on entre par la porte la plus proche
      const L = Math.hypot(x - p.x, y - p.y);
      let cross = false;
      for (let d = 0; d < L && !cross; d += 90) cross = inCity(p.x + (x - p.x) * d / L, p.y + (y - p.y) * d / L, -40);
      if (cross) {
        const gate = C.gates.reduce((a, b) => (dist(b.out, p) < dist(a.out, p) ? b : a));
        const inLane = Math.abs((p.x - gate.x) * gate.ny - (p.y - gate.y) * gate.nx) < 70 && dist(p, gate) < 170;
        route = dist(p, gate.out) < 90 || inLane ? gate.in : gate.out;
      }
    }
    // (le pont est la prochaine étape, et rien n'est sur le chemin) on y va tout droit
    if (!route && (x !== xTo || y !== yTo)) route = { x, y };
    return route;
  }

  return {
    on, build, expandSite, reserved, inCity, solids, riverBlock, speedAt, zoomAt, lockText, interact, update, steer, populate, caught,
    drawGround, uprights, drawUpright, drawTop, minimap, target, cityRoute, counters,
    get C() { return C; }, get agents() { return agents; }, state: S, bridgeBuilt, roadBuilt,
  };
}
