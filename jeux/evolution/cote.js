// ============================================================================
// Évolution — le monde VU DE CÔTÉ (world.view === 'cote') : la voie des airs
// et la voie des reptiles. Rien ici ne connaît une espèce par son nom.
//
//   - Le paysage de chaque chapitre (chapters[].land) : des collines, des
//     falaises avec leurs corniches, des montagnes, des lacs, la mer, des
//     arbres (on grimpe au tronc, on se pose sur les branches et à la cime),
//     des buissons et des roseaux où se cacher, des colonnes d'air chaud, un
//     camp d'humains. Il est tiré au hasard, mais toujours le même pour un
//     chapitre donné.
//   - La physique : on marche (la pente, la gravité), on vole et on plane, on
//     grimpe aux troncs, on nage et on plonge. Le joueur et les animaux
//     suivent les mêmes règles ; chaque espèce dit ce qu'elle sait faire
//     (lives, swims, climbs, dives).
//   - Le dessin du monde : le ciel, le soleil, les montagnes et les forêts au
//     loin (elles défilent plus lentement : de la profondeur), les nuages, le
//     sol, l'eau transparente, les arbres et leurs feuillages par-dessus les
//     animaux, la pluie de cendres, les lucioles…
// (Les animaux eux-mêmes sont dessinés de profil : art-cote.js.)
// ============================================================================

import { shade } from './art.js';
import { STAND } from './art-cote.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

/* ---------- Réglages de la physique ---------- */
const GRAV = 1500;                 // la gravité (px/s²)
const STEP = 16;                   // le sol est mesuré tous les 16 px
const STEEP = 2.4;                 // plus raide que ça : c'est un mur (on ne le monte pas en marchant)
const FLY_SINK = 70;               // sans rien faire en vol, on descend doucement (on plane)
const TIRED_SINK = 150;            // à bout de forces, on ne peut plus monter
const SWIM_DRAG = 3;

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

/* Les arbres : hauteur, largeur du tronc (× hauteur), branches, feuillage */
const TREES = {
  kapokier: { h: [950, 1450], tw: 0.045, branches: 3, crown: 'jungle', leaf: ['#1F5A2E', '#2E7A3A', '#4E9A44'] },
  feuillu: { h: [520, 820], tw: 0.05, branches: 2, crown: 'rond', leaf: ['#2E5E2A', '#3E7A34', '#5E9A44'] },
  palmier: { h: [430, 720], tw: 0.035, branches: 0, crown: 'palme', leaf: ['#2E6A2A', '#4A8A34', '#6AAA44'] },
  fougere: { h: [240, 420], tw: 0.05, branches: 0, crown: 'fougere', leaf: ['#2E6A34', '#4A8E3E', '#6EB04E'] },
  mort: { h: [380, 650], tw: 0.05, branches: 3, crown: 'mort', leaf: ['#5A524A', '#6A6058', '#7A7066'] },
  pin: { h: [620, 980], tw: 0.035, branches: 0, crown: 'pin', leaf: ['#1E4A34', '#2A5E40', '#3A7650'] },
  acacia: { h: [380, 560], tw: 0.05, branches: 0, crown: 'acacia', leaf: ['#4A6A2A', '#6A8A34', '#8AA644'] },
  cypres: { h: [500, 800], tw: 0.06, branches: 1, crown: 'cypres', leaf: ['#2A4A2A', '#3A5E34', '#4E7440'] },
};

/* Ce qui pousse par terre : par 1000 px (land.deco), et si on peut s'y cacher */
const DECO = {
  fougere: { r: [50, 110], hide: true },
  buisson: { r: [60, 130], hide: true },
  herbe: { r: [40, 90], hide: true },
  roseau: { r: [50, 90], hide: true },
  fleur: { r: [10, 18] },
  rocher: { r: [25, 80] },
  os: { r: [30, 60] },
  souche: { r: [30, 55] },
  champignon: { r: [10, 20] },
  cactus: { r: [40, 80] },
};

export function createCote(api) {
  const on = () => api.level().world.view === 'cote';
  let G = null;

  /* ============================================================================
     LE PAYSAGE
     ============================================================================ */
  function build(seed) {
    const W = api.level().world, L = api.chapter().land || {};
    const rnd = mulberry32(seed);
    const R = (a, b) => a + rnd() * (b - a);
    const w = L.w || W.w, h = L.h || W.h;
    const n = Math.ceil(w / STEP) + 2;
    const base = h * (L.base ?? 0.8);
    const gy = new Float32Array(n);
    const ph = [rnd() * TAU, rnd() * TAU, rnd() * TAU];
    const A = L.hills ?? 90;
    for (let i = 0; i < n; i++) {
      const x = i * STEP;
      gy[i] = base + A * Math.sin(x / 1500 + ph[0]) + A * 0.45 * Math.sin(x / 540 + ph[1]) + A * 0.1 * Math.sin(x / 170 + ph[2]);
    }
    const idx = (x) => clamp(Math.round(x / STEP), 0, n - 1);
    const taken = [];
    const free = (x0, x1) => x0 > 200 && x1 < w - 200 && taken.every(([a, b]) => x1 < a || x0 > b);
    const take = (x0, x1) => taken.push([x0, x1]);
    const startX = (L.start ?? 0.12) * w;
    take(startX - 450, startX + 450);
    const find = (wd, tries = 60) => {
      for (let i = 0; i < tries; i++) {
        const x = R(wd + 300, w - wd - 300);
        if (free(x - wd, x + wd)) { take(x - wd - 120, x + wd + 120); return x; }
      }
      return null;
    };

    // la mer, d'un côté (avec, si on veut, une grande falaise au bord)
    const waters = [];
    let sea = null;
    if (L.sea) {
      const sw = L.seaW || 3400;
      const shore = L.sea === 'right' ? w - sw : sw;
      sea = { shore, side: L.sea };
      take(L.sea === 'right' ? shore - (L.seaCliff ? 1100 : 300) : 0, L.sea === 'right' ? w : shore + (L.seaCliff ? 1100 : 300));
    }
    // les montagnes : de grands sommets rocheux, parfois enneigés
    const peaks = [];
    for (let k = 0; k < (L.mountains || 0); k++) {
      const hw = R(900, 1500);
      const x = find(hw * 0.8);
      if (x === null) continue;
      const H = R(...(L.mountainH || [1000, 1500]));
      const i0 = idx(x - hw);
      peaks.push({ x, hw, H, x0: x - hw, x1: x + hw, i0, base: gy.slice(i0, idx(x + hw) + 1), seed: Math.floor(rnd() * 1e6), peak: true });
      for (let i = idx(x - hw); i <= idx(x + hw); i++) {
        const u = Math.abs(i * STEP - x) / hw;
        if (u >= 1) continue;
        const jag = 1 + 0.06 * Math.sin(i * 0.9 + k) + 0.04 * Math.sin(i * 2.3);
        gy[i] -= H * Math.pow(1 - u, 1.35) * jag;
      }
    }
    // les falaises : des plateaux de roche aux parois raides
    const cliffs = [];
    const addCliff = (x0, x1, H) => {
      const e = 95;
      const i0 = idx(x0 - e), i1 = idx(x1 + e);
      const seed = Math.floor(rnd() * 1e6);
      const base = gy.slice(i0, i1 + 1);
      for (let i = i0; i <= i1; i++) {
        const x = i * STEP;
        // (deux fois adouci : le pied se creuse doucement, le haut s'arrondit, la paroi est raide)
        let k = Math.min(smooth(smooth((x - (x0 - e)) / (e * 2))), smooth(smooth(((x1 + e) - x) / (e * 2))));
        // une paroi rocheuse n'est jamais lisse : des bosses, des creux (pas au pied, ni au bord du haut)
        if (k > 0.22 && k < 0.92) k = clamp(k + Math.sin(i * 1.7 + seed) * 0.07 + Math.sin(i * 0.61 + seed * 0.3) * 0.06 + Math.sin(i * 3.1 + seed * 0.7) * 0.03, 0, 1);
        gy[i] -= H * k + (k > 0.97 ? Math.sin(i * 0.45 + seed) * 9 + Math.sin(i * 1.3 + seed) * 4 : 0);
      }
      cliffs.push({ x0, x1, H, i0, base, seed });
    };
    for (let k = 0; k < (L.cliffs || 0); k++) {
      const wd = R(220, 520);
      const x = find(wd);
      if (x === null) continue;
      addCliff(x - wd, x + wd, R(...(L.cliffH || [450, 850])));
    }
    // les lacs et les rivières, creusés dans le sol
    for (let k = 0; k < (L.lakes || 0); k++) {
      const wd = R(...(L.lakeW || [450, 800]));
      const span = wd * 1.4;
      const x = find(span);
      if (x === null) continue;
      const level = Math.max(gy[idx(x - span * 0.8)], gy[idx(x + span * 0.8)]) + 8;
      const D = R(...(L.lakeD || [260, 460]));
      for (let i = idx(x - span); i <= idx(x + span); i++) {
        // le fond se creuse doucement depuis les bords : une plage, puis le fond du lac
        const u = Math.abs(i * STEP - x) / span;
        const f = smooth((1 - u) / 0.55);
        const wgt = smooth((1 - u) / 0.3);
        const target = level - 30 + (D + 30) * f;
        gy[i] = Math.max(gy[i], lerp(gy[i], target, wgt));
      }
      waters.push({ x0: x - span, x1: x + span, y: level, lake: true });
    }
    // la mer : le sol plonge vers le fond
    if (sea) {
      const bottom = h - 90;
      const level = base + 40;
      const cliffH = L.seaCliff ? R(...(L.seaCliffH || [650, 900])) : 0;
      for (let i = 0; i < n; i++) {
        const x = i * STEP;
        const d = sea.side === 'right' ? x - sea.shore : sea.shore - x;
        if (d > 0) gy[i] = lerp(Math.max(gy[i], level - 10), bottom, smooth(d / (L.seaCliff ? 160 : 900)));
      }
      if (L.seaCliff) {
        const x1 = sea.side === 'right' ? sea.shore - 10 : sea.shore + 900;
        const x0 = sea.side === 'right' ? sea.shore - 900 : sea.shore + 10;
        addCliff(x0, x1, cliffH);
      }
      waters.push({ x0: sea.side === 'right' ? sea.shore : 0, x1: sea.side === 'right' ? w : sea.shore, y: level, sea: true });
    }
    // les vrais bords de l'eau (là où le sol passe sous la surface)
    for (const wt of waters) {
      let a = idx(wt.x0), b = idx(wt.x1);
      while (a < b && gy[a] <= wt.y) a++;
      while (b > a && gy[b] <= wt.y) b--;
      wt.x0 = a * STEP;
      wt.x1 = b * STEP;
      let deep = wt.y;
      for (let i = a; i <= b; i++) deep = Math.max(deep, gy[i]);
      wt.bottom = deep;
    }
    const at = (x) => {
      const f = clamp(x / STEP, 0, n - 1.001), i = Math.floor(f);
      return gy[i] + (gy[i + 1] - gy[i]) * (f - i);
    };
    const wetAt = (x) => waters.find((wt) => x >= wt.x0 && x <= wt.x1) || null;
    const slopeAt = (x) => (at(x + 24) - at(x - 24)) / 48;

    // les corniches sur les parois des falaises (et des montagnes) : on peut s'y poser, y nicher
    const plats = [];
    const faceX = (xa, xb, y) => {
      // là où la paroi passe à la hauteur y, entre xa et xb
      const s = Math.sign(xb - xa);
      for (let x = xa; s > 0 ? x <= xb : x >= xb; x += s * 8) if (at(x) <= y) return x;
      return null;
    };
    for (const c of cliffs) {
      const top = Math.min(at(c.x0 + 40), at(c.x1 - 40));
      for (const side of [-1, 1]) {
        const nL = 1 + Math.floor(rnd() * 2.6);
        for (let j = 0; j < nL; j++) {
          const y = lerp(top + 80, top + c.H - 120, (j + 0.5 + R(-0.2, 0.2)) / nL);
          const fx = side < 0 ? faceX(c.x0 - 90, c.x0 + 160, y) : faceX(c.x1 + 90, c.x1 - 160, y);
          if (fx === null || wetAt(fx - side * 40)) continue;
          const len = R(70, 110);
          plats.push({ x0: side < 0 ? fx - len : fx - 10, x1: side < 0 ? fx + 10 : fx + len, y, kind: 'corniche', side });
        }
      }
    }
    for (const p of peaks) {
      for (const side of [-1, 1]) {
        for (let j = 0; j < 3; j++) {
          const x = p.x + side * p.hw * (0.25 + j * 0.2) + R(-40, 40);
          const y = at(x);
          plats.push({ x0: x - 60, x1: x + 60, y: y - 4, kind: 'corniche', side, rock: true, peak: true });
        }
      }
    }

    // les arbres
    const trees = [];
    const hides = [];
    const okTree = (x, wide) => !wetAt(x) && !wetAt(x - wide) && !wetAt(x + wide) && Math.abs(slopeAt(x)) < 0.45 && Math.abs(x - startX) > 140 && trees.every((t) => Math.abs(t.x - x) > 160);
    for (const [type, count] of Object.entries(L.trees || {})) {
      const T = TREES[type];
      for (let k = 0; k < count; k++) {
        let x = null;
        for (let i = 0; i < 40 && x === null; i++) {
          const cx = R(250, w - 250);
          if (okTree(cx, 60) || (type === 'cypres' && wetAt(cx) && wetAt(cx).lake)) x = cx;
        }
        if (x === null) continue;
        const ht = R(...T.h);
        const y0 = at(x) + 6;
        const tr = { type, x, y0, h: ht, top: y0 - ht, tw: Math.max(14, ht * T.tw), seed: Math.floor(rnd() * 1e6), lean: R(-0.06, 0.06), crowns: [], branches: [] };
        // les branches (on peut marcher dessus) et le feuillage (on peut s'y cacher)
        for (let b = 0; b < T.branches; b++) {
          const side = (b + (tr.seed % 2)) % 2 ? 1 : -1;
          const by = lerp(tr.top + ht * 0.3, tr.top + ht * 0.72, b / Math.max(1, T.branches - 1)) + R(-30, 30);
          const len = ht * R(0.16, 0.26);
          const p = { x0: side < 0 ? x - len : x, x1: side < 0 ? x : x + len, y: by - len * 0.12, kind: 'branche', tree: tr, side };
          tr.branches.push(p);
          plats.push(p);
          if (T.crown !== 'mort') tr.crowns.push({ x: x + side * len * 0.95, y: by - len * 0.25, r: ht * R(0.1, 0.14) });
        }
        const cr = T.crown;
        const top = { x: x + tr.lean * ht, y: tr.top };
        if (cr === 'jungle' || cr === 'rond' || cr === 'cypres') tr.crowns.push({ x: top.x, y: top.y + ht * 0.04, r: ht * (cr === 'jungle' ? 0.17 : cr === 'cypres' ? 0.13 : 0.22) });
        if (cr === 'acacia') tr.crowns.push({ x: top.x, y: top.y + 20, r: ht * 0.32, flat: true });
        if (cr === 'palme' || cr === 'fougere') tr.crowns.push({ x: top.x, y: top.y, r: ht * 0.2, frond: true });
        if (cr === 'pin') tr.crowns.push({ x: top.x, y: top.y + ht * 0.3, r: ht * 0.16, pin: true });
        // la cime : on s'y pose (et on y fait son nid)
        const ctop = tr.crowns.length ? tr.crowns[tr.crowns.length - 1] : { x: top.x, y: top.y, r: 30 };
        const cimeY = cr === 'acacia' ? ctop.y - ctop.r * 0.32 : cr === 'mort' ? top.y : cr === 'pin' ? top.y - 10 : ctop.y - ctop.r * (cr === 'palme' || cr === 'fougere' ? 0.15 : 0.62);
        const cw = cr === 'acacia' ? ctop.r * 0.8 : cr === 'mort' ? 30 : Math.max(40, ctop.r * 0.45);
        tr.cime = { x0: top.x - cw, x1: top.x + cw, y: cimeY, kind: 'cime', tree: tr };
        plats.push(tr.cime);
        for (const c of tr.crowns) if (!c.pin || true) hides.push({ x: c.x, y: c.y, r: c.r * (c.flat ? 0.7 : 0.9), crown: true });
        trees.push(tr);
      }
    }
    // ce qui pousse par terre
    const deco = [];
    for (const [type, per] of Object.entries(L.deco || {})) {
      const D = DECO[type];
      const count = Math.round(per * w / 1000);
      for (let k = 0; k < count; k++) {
        let x = R(100, w - 100);
        const wt = wetAt(x);
        if (type === 'roseau') {
          // les roseaux poussent au bord de l'eau
          const wt2 = waters[Math.floor(rnd() * waters.length)];
          if (!wt2) continue;
          x = rnd() < 0.5 ? wt2.x0 + R(-60, 90) : wt2.x1 + R(-90, 60);
        } else if (wt) continue;
        const r = R(...D.r);
        const d = { type, x, y: Math.min(at(x), wetAt(x) ? wetAt(x).y + 10 : 1e9), r, seed: Math.floor(rnd() * 1e6) };
        deco.push(d);
        if (D.hide && r > 55) hides.push({ x, y: d.y - r * 0.55, r: r * 0.85, bush: true, d });
      }
    }
    deco.sort((a, b) => a.x - b.x);
    // les nénuphars et les algues
    const lily = [];
    for (const wt of waters) {
      if (wt.sea || !(L.deco && L.deco.roseau)) continue;
      for (let x = wt.x0 + 60; x < wt.x1 - 60; x += R(60, 160)) if (rnd() < 0.55) lily.push({ x, y: wt.y, r: R(14, 26), seed: Math.floor(rnd() * 1e6) });
    }
    const weeds = [];
    for (const wt of waters) {
      for (let x = wt.x0 + 40; x < wt.x1 - 40; x += R(40, 120)) weeds.push({ x, y: at(x), h: R(60, 180), seed: Math.floor(rnd() * 1e6) });
    }
    // les colonnes d'air chaud (on monte sans battre des ailes)
    const thermals = [];
    for (let k = 0; k < (L.thermals || 0); k++) {
      const x = R(600, w - 600);
      if (wetAt(x)) continue;
      thermals.push({ x, w: R(150, 230), top: h * 0.08, lift: L.thermalLift || 300, seed: rnd() * 10 });
    }
    // le camp des humains
    const camps = [];
    for (let k = 0; k < (L.camps || 0); k++) {
      const x = find(320);
      if (x === null) continue;
      // le sol du camp est bien plat
      const y = at(x);
      for (let i = idx(x - 340); i <= idx(x + 340); i++) {
        const k2 = smooth(1 - Math.abs(i * STEP - x) / 340);
        gy[i] = lerp(gy[i], y, k2);
      }
      camps.push({ x, y, r: 300 });
    }
    // les nuages et les étoiles (au loin)
    const clouds = Array.from({ length: 22 }, (_, i) => ({ u: rnd() * 6000, v: R(0.05, 0.45), s: R(0.6, 1.5), p: R(0.08, 0.3), seed: i }));
    const stars = Array.from({ length: 90 }, () => ({ x: rnd(), y: rnd() * 0.6, s: R(0.5, 1.8), p: rnd() * TAU }));
    G = { w, h, n, gy, base, at, wetAt, waters, cliffs, peaks, plats, trees, hides, deco, lily, weeds, thermals, camps, clouds, stars, startX, pal: L.pal || {}, L };
    return G;
  }

  /* ============================================================================
     QUELQUES QUESTIONS SUR LE MONDE
     ============================================================================ */
  const groundY = (x) => G.at(x);
  const waterAt = (x, y) => {
    const wt = G.wetAt(x);
    return wt && y > wt.y && y < G.at(x) + 4 ? wt : null;
  };
  /** 'water' dans l'eau, 'camp' au camp des humains, sinon null */
  function zoneAt(x, y) {
    if (!G) return null;
    if (waterAt(x, y)) return 'water';
    for (const c of G.camps) if (Math.abs(x - c.x) < c.r && y > c.y - 500) return 'camp';
    return null;
  }
  const standOf = (e) => (STAND[e.look || e.sp?.look] ?? 0.6) * e.size;
  const inCamp = (x) => G.camps.some((c) => Math.abs(x - c.x) < c.r + 120);
  const onRock = (x) => G.cliffs.some((c) => x > c.x0 - 140 && x < c.x1 + 140) || G.peaks.some((p) => Math.abs(x - p.x) < p.hw * 0.75);
  /** Un animal peut-il aller jusqu'au nid ? (une corniche ou un sommet : seulement en volant ; une cime : en grimpant) */
  function nestReachable(c, n) {
    if ((c.sp.lives || 'sol') === 'air') return true;
    if (n.kind === 'corniche' || n.kind === 'sommet') return false;
    if (n.kind === 'cime' || n.kind === 'branche') return !!c.sp.climbs;
    return !onRock(n.x);
  }
  function thermalAt(x, y) {
    for (const t of G.thermals) if (Math.abs(x - t.x) < t.w / 2 && y > t.top && y < G.at(x)) return t;
    return null;
  }
  function treeNear(e) {
    let best = null, bd = Infinity;
    for (const t of G.trees) {
      const d = Math.abs(t.x - e.x);
      const feet = e.y + standOf(e);
      if (d < t.tw / 2 + e.size * 1.1 && feet > t.top - 20 && e.y < t.y0 + 10 && d < bd) { bd = d; best = t; }
    }
    return best;
  }
  /** Où l'on se poserait en tombant : le sol, ou une branche, une corniche, une cime */
  function supportAt(e, x, prevFeet, feet) {
    let y = G.at(x), plat = null;
    if (!(e.dropT > 0)) {
      for (const p of G.plats) {
        if (x < p.x0 || x > p.x1 || p.y < prevFeet - 6 || p.y > feet + 2 || p.y >= y) continue;
        y = p.y;
        plat = p;
      }
    }
    return { y, plat };
  }
  /** Ce sur quoi l'on se tient (pour le nid) : 'cime', 'branche', 'corniche', 'sommet' ou 'sol' */
  function placeOf(e) {
    if (e.plat) return e.plat.kind;
    if (e.loco !== 'sol') return null;
    return G.at(e.x) < G.base - (G.L.summit || 900) ? 'sommet' : 'sol';
  }

  /* ============================================================================
     LA PHYSIQUE : marcher, voler, grimper, nager
     can : { fly, climb, swim, float, dive, jump, flap (encore des forces), flapRate }
     ============================================================================ */
  function move(e, want, top, dt, can, dash) {
    const st = standOf(e);
    e.dropT = Math.max(0, (e.dropT || 0) - dt);
    e.diveT = Math.max(0, (e.diveT || 0) - dt);
    e.flapping = false;
    if (!e.loco) e.loco = can.fly && !onGround(e) ? 'vol' : 'sol';
    const wt = G.wetAt(e.x);
    const surface = wt ? wt.y : null;

    if (e.loco === 'grimpe') {
      climb(e, want, top, dt, st, can);
    } else if (wt && e.y > surface + (can.swim ? -e.size * 0.1 : e.size * 0.2) && (can.swim || e.diveT > 0 || e.loco === 'plonge')) {
      // dans l'eau
      if (can.swim) {
        e.loco = 'eau';
        const k = 1 - Math.exp(-SWIM_DRAG * dt);
        const v = top * (can.swimK || 0.9);
        e.vx += ((want ? want.x * v : 0) - e.vx) * k;
        e.vy += ((want ? want.y * v : -40) - e.vy) * k;
        // on ne sort pas de l'eau par en haut (sauf pour sauter sur la rive)
        if (e.y < surface + e.size * 0.15 && e.vy < 0) {
          const bank = Math.min(G.at(e.x - e.size * 2.2), G.at(e.x + e.size * 2.2));
          if (want && want.y < -0.55 && bank < surface + 30) {
            e.vy = -Math.max(420, top * 1.4);
            e.loco = 'chute';
          } else {
            e.vy = Math.max(e.vy, 0) * 0.5;
            e.y = Math.max(e.y, surface + e.size * 0.12);
          }
        }
      } else {
        // un oiseau qui plonge : l'élan l'emporte, puis il remonte comme un bouchon
        e.loco = 'plonge';
        e.vx *= Math.exp(-2 * dt);
        if (e.diveT <= 0) e.vy -= 1700 * dt;
        e.vy *= Math.exp(-1.5 * dt);
        if (e.y <= surface + e.size * 0.2 && e.vy < 0) { e.loco = 'surface'; e.vy = 0; e.y = surface - st * 0.15; }
      }
    } else if (e.loco === 'surface' && wt) {
      // posé sur l'eau
      e.vy = 0;
      e.y = surface - e.size * 0.35;
      e.vx += ((want ? want.x * top * 0.5 : 0) - e.vx) * (1 - Math.exp(-4 * dt));
      if (want && want.y < -0.5 && can.fly) { e.loco = 'vol'; e.vy = -top * 0.8; }
      else if ((dash || (want && want.y > 0.7)) && can.dive) { e.loco = 'plonge'; e.diveT = 0.7; e.vy = top * 1.2; api.splash(e); }
    } else if (e.loco === 'vol') {
      fly(e, want, top, dt, can, dash);
    } else if (e.loco === 'sol') {
      walk(e, want, top, dt, can, st);
    } else {
      // on tombe (ou on saute)
      e.loco = 'chute';
      e.vy += GRAV * dt;
      e.vx += ((want ? want.x * top * 0.75 : e.vx * 0.9) - e.vx) * (1 - Math.exp(-3 * dt));
      if (can.fly && want && want.y < -0.2) e.loco = 'vol';
    }

    // on avance
    const ox = e.x, prevFeet = e.y + st;
    if (e.loco !== 'grimpe') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
    e.x = clamp(e.x, e.size + 20, G.w - e.size - 20);
    if (e.y < e.size + 10) { e.y = e.size + 10; e.vy = Math.max(0, e.vy); }
    // (en vol, en tombant, en nageant) on bute contre une paroi de roche : on ne passe pas au travers
    if (e.loco !== 'sol' && e.loco !== 'grimpe' && e.y + st > G.at(e.x) + 2 && G.at(e.x) < G.at(ox) - 6 && prevFeet <= G.at(ox) + 4) {
      e.x = ox;
      e.vx = 0;
    }

    // on se pose (sur le sol, une branche, une corniche), on entre dans l'eau
    if (e.loco === 'vol' || e.loco === 'chute') {
      const feet = e.y + st;
      const s = supportAt(e, e.x, prevFeet, feet);
      const wt2 = G.wetAt(e.x);
      if (wt2 && feet > wt2.y && s.y > wt2.y) {
        if (can.swim) { e.loco = 'eau'; api.splash(e); }
        else if (can.float || e.loco === 'vol') {
          if (can.dive && (dash ? e.vy > 100 : e.vy > 240)) { e.loco = 'plonge'; e.diveT = 0.6; api.splash(e); }
          else { e.loco = 'surface'; e.y = wt2.y - e.size * 0.35; e.vy = 0; api.splash(e); }
        } else { e.loco = 'surface'; e.y = wt2.y - e.size * 0.35; e.vy = 0; }
      } else if (feet >= s.y && (e.loco === 'chute' || e.vy > -20 || !can.fly)) {
        if (e.loco === 'vol' && e.vy < 40 && want && want.y < 0.2 && !s.plat && feet - s.y < 6) {
          // en vol au ras du sol : on glisse dessus
          e.y = s.y - st;
          e.vy = Math.min(0, e.vy);
        } else {
          e.y = s.y - st;
          e.vy = 0;
          e.loco = 'sol';
          e.plat = s.plat;
          if (feet - prevFeet > 18) api.land(e);
        }
      }
    }
    // jamais sous la terre
    const g = G.at(e.x);
    if (e.loco !== 'eau' && e.loco !== 'plonge' && e.y + st > g + 1 && !(G.wetAt(e.x) && e.y > G.wetAt(e.x).y)) {
      e.y = g - st;
      if (e.loco === 'vol' && e.vy > 0) e.vy = 0;
    }
    if ((e.loco === 'eau' || e.loco === 'plonge') && e.y > g - e.size * 0.4) { e.y = g - e.size * 0.4; e.vy = Math.min(0, e.vy); }

    orient(e, dt, ox);
  }

  function onGround(e) {
    return e.y + standOf(e) >= G.at(e.x) - 4;
  }

  function walk(e, want, top, dt, can, st) {
    const tx = want ? want.x * top : 0;
    const k = 1 - Math.exp(-(want ? 10 : 9) * dt);
    e.vx += (tx - e.vx) * k;
    e.vy = 0;
    const nx = e.x + e.vx * dt;
    if (e.plat) {
      // sur une branche ou une corniche : au bout, on tombe
      if (nx < e.plat.x0 - 4 || nx > e.plat.x1 + 4) { e.plat = null; e.loco = 'chute'; }
      else e.y = e.plat.y - st;
    } else {
      const g0 = G.at(e.x), g1 = G.at(nx);
      const wt = G.wetAt(nx);
      // (can.turn : les animaux) une paroi de roche devant, ou un grand vide : demi-tour !
      if (can.turn && Math.abs(e.vx) > 1) {
        const dir = Math.sign(e.vx), ahead = G.at(e.x + dir * 40);
        const camp = can.noCamp && inCamp(e.x + dir * 60) && !inCamp(e.x);
        if (g0 - ahead > 40 * can.turn || ahead - g0 > 70 || camp) {
          e.vx = 0;
          e.bumpT = 2.5;
          e.bumpDir = -dir;
          e.y = g0 - st;
          return;
        }
      }
      // un mur de roche (trop raide pour marcher), ou l'eau pour qui ne nage pas
      if ((g0 - g1) > STEEP * Math.abs(nx - e.x) + 2 && !can.climbRock) e.vx = 0;
      else if (wt && g1 > wt.y + 6) {
        // le bord de l'eau : on y entre à la nage, on s'y pose (un oiseau), ou on s'arrête
        // (ceux qui ne nagent pas pataugent à la surface, lentement : l'eau ne coupe jamais le monde en deux)
        if (can.swim) { e.loco = 'eau'; api.splash(e); }
        else { e.loco = 'surface'; e.y = wt.y - e.size * 0.35; api.splash(e); }
      }
      else if (g1 - g0 > 40) { e.loco = 'chute'; }
      else e.y = G.at(e.x) - st;
    }
    if (want && want.y < -0.55) {
      const tr = can.climb && treeNear(e);
      if (tr) { startClimb(e, tr, want); return; }
      if (can.fly) { e.loco = 'vol'; e.vy = -top * 0.85; e.plat = null; api.takeoff(e); return; }
      if (can.jump && !e.jumpT) { e.loco = 'chute'; e.vy = -can.jump; e.plat = null; }
    }
    if (want && want.y > 0.7 && e.plat) {
      // on se laisse tomber de la branche (ou on redescend le long du tronc)
      const tr = can.climb && e.plat.tree;
      if (tr && Math.abs(e.x - tr.x) < tr.tw + e.size) { startClimb(e, tr, want); return; }
      e.dropT = 0.3;
      e.plat = null;
      e.loco = 'chute';
    }
  }

  function startClimb(e, tr, want) {
    e.loco = 'grimpe';
    e.tree = tr;
    e.plat = null;
    e.face = e.x < tr.x ? 1 : -1;
    e.climbUp = !(want && want.y > 0);
    e.vx = 0;
    e.vy = 0;
  }

  function climb(e, want, top, dt, st, can) {
    const tr = e.tree;
    if (!tr) { e.loco = 'chute'; return; }
    const v = want && Math.abs(want.y) > 0.25 ? want.y * top * (can.climbK || 0.7) : 0;
    e.vy = v;
    if (v) e.climbUp = v < 0;
    e.y += v * dt;
    // collé au tronc, le ventre contre l'écorce
    e.x = tr.x + tr.lean * (tr.y0 - e.y) - e.face * (tr.tw * 0.5 + st * 0.95);
    e.vx = 0;
    const topY = tr.cime ? tr.cime.y : tr.top;
    if (e.y < topY + e.size * 0.3) {
      // en haut : on monte sur la cime
      if (tr.cime) { e.loco = 'sol'; e.plat = tr.cime; e.y = tr.cime.y - st; e.x = clamp(tr.x + tr.lean * tr.h, tr.cime.x0 + 4, tr.cime.x1 - 4); return; }
      e.y = topY + e.size * 0.3;
    }
    const g = tr.y0 - st - 4;
    if (e.y > g) {
      e.y = g;
      if (want && want.y > 0.3) { e.loco = 'sol'; e.tree = null; e.y = G.at(e.x) - st; return; }
    }
    if (want && Math.abs(want.x) > 0.6) {
      // une branche à cette hauteur, du côté où l'on va ?
      const feet = e.y + st;
      const b = tr.branches.find((p) => Math.abs(p.y - feet) < 40 + e.size && Math.sign(want.x) === p.side);
      if (b) { e.loco = 'sol'; e.plat = b; e.y = b.y - st; e.x = tr.x + b.side * (tr.tw * 0.5 + e.size * 0.6); e.face = b.side; e.tree = null; return; }
      if (Math.sign(want.x) !== e.face) {
        // on lâche le tronc
        e.loco = 'chute';
        e.vx = want.x * top * 0.6;
        e.vy = -120;
        e.face = Math.sign(want.x);
        e.tree = null;
      }
    }
  }

  function fly(e, want, top, dt, can, dash) {
    const th = thermalAt(e.x, e.y);
    const tired = can.flap === false;
    let tx = want ? want.x * top : e.vx * 0.985;
    let ty = want ? want.y * top : FLY_SINK;
    if (!want && Math.abs(e.vx) < top * 0.3) ty = FLY_SINK * 1.6;
    if (tired) ty = Math.max(ty, TIRED_SINK);
    if (th) ty -= th.lift * (want && want.y > 0.3 ? 0.3 : 1);
    if (dash) { tx *= 1.4; ty *= 1.4; }
    const k = 1 - Math.exp(-(can.agile || 3) * dt);
    e.vx += (tx - e.vx) * k;
    e.vy += (ty - e.vy) * k;
    e.inThermal = !!th;
    e.flapping = !tired && !th && (!want || want.y < 0.35);
    e.plat = null;
  }

  /** Le sens et la pente de l'animal, selon où il va */
  function orient(e, dt, ox) {
    let pitch;
    if (e.loco === 'sol') {
      if (Math.abs(e.vx) > 8) e.face = Math.sign(e.vx);
      const s = e.plat ? 0 : Math.atan(clamp((G.at(e.x + 14) - G.at(e.x - 14)) / 28, -0.8, 0.8)) * e.face;
      pitch = s;
    } else if (e.loco === 'grimpe') {
      pitch = e.climbUp === false ? Math.PI / 2 : -Math.PI / 2;
    } else if (e.loco === 'surface') {
      if (Math.abs(e.vx) > 8) e.face = Math.sign(e.vx);
      pitch = 0;
    } else {
      if (Math.abs(e.vx) > 14) e.face = Math.sign(e.vx);
      const sp = Math.hypot(e.vx, e.vy);
      pitch = sp > 20 ? Math.atan2(e.vy, Math.max(Math.abs(e.vx), 40)) : 0;
      pitch = clamp(pitch, -1.1, 1.1);
    }
    e.face = e.face || 1;
    const cur = e.pitch ?? pitch;
    e.pitch = e.loco === 'grimpe' ? pitch : cur + (pitch - cur) * (1 - Math.exp(-8 * dt));
    e.angle = e.face > 0 ? e.pitch : Math.PI - e.pitch;
  }

  /** Les animaux suivent les mêmes règles : leur envie (vx, vy, donnée par leur cerveau) devient un mouvement */
  function creature(c, dt) {
    const sp = c.sp;
    const v = Math.hypot(c.vx, c.vy);
    const lives = sp.lives || 'sol';
    // (ce qui ne bouge pas : la nourriture par terre, les œufs)
    if (sp.kind === 'food' && lives !== 'eau') {
      c.loco = 'sol';
      c.vx = 0;
      const st = standOf(c);
      const s = supportAt(c, c.x, c.y + st - 2, c.y + st + 400);
      c.y = (c.plat ? c.plat.y : s.y) - st;
      c.face = c.face || 1;
      return;
    }
    if (lives === 'eau') {
      // un poisson : il reste dans son eau
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      const wt = G.wetAt(c.x) || c.water;
      if (wt) c.water = wt;
      const W2 = c.water;
      if (W2) {
        const top = W2.y + c.size * 0.6 + (sp.depth ? sp.depth[0] : 0);
        const bot = Math.min(G.at(c.x) - c.size * 0.5, sp.depth ? W2.y + sp.depth[1] : 1e9);
        if (c.x < W2.x0 + c.size) { c.x = W2.x0 + c.size; c.vx = Math.abs(c.vx); c.wx = W2.x1; }
        if (c.x > W2.x1 - c.size) { c.x = W2.x1 - c.size; c.vx = -Math.abs(c.vx); c.wx = W2.x0; }
        if (c.y < top && !(c.leapT > 0)) { c.y = top; c.vy = Math.abs(c.vy) * 0.3; }
        if (c.y > bot) { c.y = Math.max(top, bot); c.vy = -Math.abs(c.vy) * 0.3; }
      }
      if (c.leapT > 0) {
        // le poisson volant saute hors de l'eau
        c.leapT -= dt;
        c.vy += 600 * dt;
      } else if (sp.leap && Math.random() < dt / sp.leap && c.water && c.y < c.water.y + 200) {
        c.leapT = 1.4;
        c.vy = -520;
        c.vx = (c.face || 1) * 380;
      }
      c.loco = c.leapT > 0 ? 'vol' : 'eau';
      if (Math.abs(c.vx) > 6) c.face = Math.sign(c.vx);
      const pitch = clamp(Math.atan2(c.vy, Math.max(Math.abs(c.vx), 30)), -0.9, 0.9);
      c.pitch = c.pitch === undefined ? pitch : c.pitch + (pitch - c.pitch) * Math.min(1, dt * 6);
      c.angle = c.face > 0 ? c.pitch : Math.PI - c.pitch;
      return;
    }
    // (noCamp) les bêtes sauvages n'entrent pas dans le village des humains
    const wild = sp.kind !== 'human' && sp.habitat !== 'camp';
    const can = { fly: lives === 'air', swim: !!sp.swims, climb: !!sp.climbs, float: !!sp.floats, dive: !!sp.dives, climbK: 0.6, agile: sp.agile || 2.5, turn: lives === 'air' ? 0 : 0.9, noCamp: wild };
    if (wild && lives !== 'air' && inCamp(c.x) && !(c.bumpT > 0)) {
      // (déjà dedans : il en ressort)
      const cp = G.camps.reduce((a, b) => (Math.abs(b.x - c.x) < Math.abs(a.x - c.x) ? b : a));
      c.bumpT = 2.5;
      c.bumpDir = c.x < cp.x ? -1 : 1;
    }
    let want = v > 6 ? { x: c.vx / v, y: c.vy / v } : null;
    let top = Math.max(v, 1);
    if (c.bumpT > 0) {
      // il vient de buter contre une falaise : il repart dans l'autre sens
      c.bumpT -= dt;
      want = { x: c.bumpDir, y: 0 };
      top = Math.max(top, sp.speed * 0.45);
      c.wx = clamp(c.x + c.bumpDir * 700, 200, G.w - 200);
      c.wy = G.at(c.wx);
    }
    // (un oiseau) il reste dans son étage du ciel
    if (lives === 'air') {
      if (!c.loco || c.loco === 'sol' && !c.perch) c.loco = 'vol';
      const g = G.at(c.x);
      const alt = sp.alt || [250, 1100];
      const h = g - c.y;
      // (sauf quand il fond sur une proie : un chasseur, un vautour qui descend vers une carcasse)
      const free = c.state === 'chase' || c.state === 'alert' || !!c.prey || (c.sp.raider && c.wy > g - 400);
      if (c.loco === 'vol' && want && !free) {
        if (h < alt[0] && want.y > -0.3) want = { x: want.x, y: -0.5 };
        if (h > alt[1] && want.y < 0.3) want = { x: want.x, y: 0.4 };
      }
      if (!want) want = { x: c.face || 1, y: h < alt[0] ? -0.4 : 0.05 };
      // (au-dessus du village des humains, il reste tout là-haut)
      if (wild && inCamp(c.x) && h < 500) want = { x: want.x, y: -0.7 };
      const s = Math.hypot(want.x, want.y);
      want = { x: want.x / s, y: want.y / s };
      top = Math.max(top, sp.speed * 0.5);
      if (c.loco !== 'vol' && c.loco !== 'sol' && c.loco !== 'surface' && c.loco !== 'plonge') c.loco = 'vol';
      can.flap = true;
    } else if (want && c.loco === 'sol') {
      // marcher : ce qui compte, c'est d'aller à gauche ou à droite (et de grimper, pour ceux qui savent)
      const tr = can.climb && want.y < -0.6 ? treeNear(c) : null;
      if (!tr && Math.abs(want.x) < 0.25) want = { x: Math.sign(want.x || 1) * 0.3, y: want.y };
      top = Math.max(v, 1);
    }
    c.look = sp.look;
    move(c, want, top, dt, can, false);
    if (lives === 'air') {
      c.flapPh = (c.flapPh || 0) + dt * (sp.flapRate || 9) * (c.flapping || !sp.glide ? 1 : 0);
      if (sp.glide && c.loco === 'vol') c.flapping = Math.sin(c.flapPh * 0.1 + (c.seed || 0)) > 0.6;
    }
  }

  /** Ce chasseur peut-il t'attraper là où tu es ? (un crocodile ne monte pas aux arbres, un loup ne vole pas) */
  function reach(c, p) {
    const lives = c.sp.lives || 'sol';
    if (lives === 'air') return true;
    const pw = waterAt(p.x, p.y + p.size * 0.3) || ['surface', 'plonge', 'eau'].includes(p.loco);
    if (lives === 'eau') return !!pw;
    if (pw && !c.sp.swims) return false;
    if (p.loco === 'grimpe' || (p.plat && p.plat.tree)) return !!c.sp.climbs;
    if (p.plat && p.plat.kind === 'corniche') return false;
    // en vol, trop haut pour lui
    const h = G.at(p.x) - (p.y + p.size * 0.5);
    return h < c.size * 2.2 + 60;
  }

  /* ============================================================================
     OÙ APPARAISSENT LES ANIMAUX, OÙ ILS SE PROMÈNENT
     ============================================================================ */
  function spawnPoint(sp, near, minD, far, home) {
    const lives = sp.lives || 'sol';
    const st = (STAND[sp.look] ?? 0.6) * sp.size;
    for (let i = 0; i < 16; i++) {
      let x = near.x + (Math.random() < 0.5 ? -1 : 1) * lerp(minD, far, Math.random());
      if (sp.habitat === 'camp' && G.camps.length) {
        const c = G.camps.reduce((a, b) => (Math.abs(b.x - near.x) < Math.abs(a.x - near.x) ? b : a));
        x = c.x + (Math.random() - 0.5) * c.r * 1.6;
        if (Math.abs(x - near.x) < sp.size + 100 && !home) continue;
      }
      if (x < 150 || x > G.w - 150) continue;
      const wt = G.wetAt(x);
      if (lives === 'eau') {
        const pool = G.waters.filter((w) => w.x1 > near.x - far * 1.4 && w.x0 < near.x + far * 1.4 && w.x1 - w.x0 > sp.size * 4);
        if (!pool.length) return null;
        const W2 = pool[Math.floor(Math.random() * pool.length)];
        // (près du joueur : dans la partie de l'eau qui est à sa portée)
        const xa = Math.max(W2.x0 + sp.size * 2, near.x - far), xb = Math.min(W2.x1 - sp.size * 2, near.x + far);
        if (xb <= xa) continue;
        const px = lerp(xa, xb, Math.random());
        if (Math.abs(px - near.x) < minD * 0.6 && !home) continue;
        const d0 = W2.y + sp.size + (sp.depth ? sp.depth[0] : 10), d1 = Math.min(G.at(px) - sp.size, sp.depth ? W2.y + sp.depth[1] : 1e9);
        if (d1 <= d0) continue;
        return { x: px, y: lerp(d0, d1, Math.random()), water: W2 };
      }
      if (lives === 'air') {
        const alt = sp.alt || [250, 1100];
        return { x, y: G.at(x) - lerp(alt[0], alt[1], Math.random()) };
      }
      if (lives === 'arbre' || sp.perch) {
        const trees = G.trees.filter((t) => Math.abs(t.x - x) < far * 0.6 && Math.abs(t.x - near.x) > minD * 0.5);
        if (trees.length) {
          const t = trees[Math.floor(Math.random() * trees.length)];
          const p = [t.cime, ...t.branches][Math.floor(Math.random() * (1 + t.branches.length))];
          return { x: lerp(p.x0, p.x1, Math.random()), y: p.y - st, plat: p };
        }
        if (lives === 'arbre') continue;
      }
      if (sp.ledge) {
        const L = G.plats.filter((p) => p.kind === 'corniche' && Math.abs(p.x0 - near.x) < far * 1.2);
        if (L.length) {
          const p = L[Math.floor(Math.random() * L.length)];
          return { x: (p.x0 + p.x1) / 2, y: p.y - st, plat: p };
        }
      }
      if (sp.near === 'eau' && G.waters.length) {
        // il vit au bord de l'eau (les crocodiles, ceux qui viennent boire)
        const pool = G.waters.filter((w) => Math.abs((w.x0 + w.x1) / 2 - near.x) < far * 1.6);
        if (pool.length) {
          const W2 = pool[Math.floor(Math.random() * pool.length)];
          const edge = Math.random() < 0.5 ? W2.x0 : W2.x1;
          const px = edge + (edge === W2.x0 ? -1 : 1) * lerp(20, 260, Math.random());
          if (Math.abs(px - near.x) < minD * 0.5 && !home) continue;
          if (sp.swims && Math.random() < 0.5) {
            const ix = lerp(W2.x0 + sp.size * 2, W2.x1 - sp.size * 2, Math.random());
            if (G.at(ix) - W2.y > sp.size * 2) return { x: ix, y: W2.y + sp.size * 0.5, water: W2 };
          }
          if (!G.wetAt(px)) return { x: px, y: G.at(px) - st };
        }
      }
      if (wt && !sp.swims) continue;
      if (Math.abs(G.at(x + 30) - G.at(x - 30)) > 70) continue;
      // (ceux qui marchent) jamais en haut d'une falaise ou d'une montagne : ils n'y montent pas
      if (onRock(x)) continue;
      // (les bêtes sauvages) jamais dans le village des humains
      if (sp.kind !== 'human' && sp.habitat !== 'camp' && inCamp(x)) continue;
      if (wt && sp.swims) return { x, y: wt.y + sp.size * 0.5 };
      return { x, y: G.at(x) - st };
    }
    return null;
  }

  function wanderPoint(c) {
    const sp = c.sp, lives = sp.lives || 'sol';
    const d = (Math.random() < 0.5 ? -1 : 1) * lerp(200, 700, Math.random());
    if (c.post) {
      const h = c.post;
      return { x: h.x + (Math.random() - 0.5) * h.r * 2, y: h.y };
    }
    if (lives === 'air') {
      const x = clamp(c.x + d, 200, G.w - 200);
      const alt = sp.alt || [250, 1100];
      return { x, y: G.at(x) - lerp(alt[0], alt[1], Math.random()) };
    }
    if (lives === 'eau' && c.water) {
      const W2 = c.water;
      const x = clamp(c.x + d, W2.x0 + c.size, W2.x1 - c.size);
      const d0 = W2.y + c.size + (sp.depth ? sp.depth[0] : 0), d1 = Math.min(G.at(x) - c.size, sp.depth ? W2.y + sp.depth[1] : 1e9);
      return { x, y: lerp(d0, Math.max(d0, d1), Math.random()) };
    }
    if (sp.near === 'eau' && G.waters.length) {
      // il fait des allers-retours au bord de l'eau (pour boire)
      const W2 = G.waters.reduce((a, b) => (Math.abs((b.x0 + b.x1) / 2 - c.x) < Math.abs((a.x0 + a.x1) / 2 - c.x) ? b : a));
      if (Math.abs((W2.x0 + W2.x1) / 2 - c.x) < 2500) {
        const edge = Math.abs(c.x - W2.x0) < Math.abs(c.x - W2.x1) ? W2.x0 : W2.x1;
        const out = edge === W2.x0 ? -1 : 1;
        const inside = sp.swims && Math.random() < 0.4;
        const x = inside ? lerp(W2.x0, W2.x1, Math.random()) : edge + out * lerp(-10, 500, Math.random());
        return { x, y: inside ? W2.y + c.size : G.at(x) };
      }
    }
    if (sp.habitat === 'camp' && G.camps.length) {
      const cp = G.camps.reduce((a, b) => (Math.abs(b.x - c.x) < Math.abs(a.x - c.x) ? b : a));
      return { x: cp.x + (Math.random() - 0.5) * cp.r * 1.8, y: cp.y };
    }
    if (sp.climbs && Math.random() < 0.35) {
      // il monte dans un arbre
      const t = G.trees.find((tr) => Math.abs(tr.x - c.x) < 600);
      if (t) return { x: t.x, y: t.top + 40 };
    }
    let x = clamp(c.x + d, 200, G.w - 200);
    // (les bêtes sauvages) on ne se promène pas dans le village des humains
    if (sp.kind !== 'human' && sp.habitat !== 'camp' && inCamp(x)) x = clamp(c.x - d, 200, G.w - 200);
    return { x, y: G.at(x) };
  }

  /** Les points où l'on peut nicher (place : 'corniche', 'cime', 'sommet', 'sol') */
  function nestSpots(place) {
    // (cache) par terre, dans un buisson ou les hautes herbes
    if (place === 'cache') return G.hides.filter((h) => h.bush).map((h) => ({ x: h.x, y: h.d.y, kind: 'sol' }));
    if (place === 'sol' || place === 'sommet') {
      const out = [];
      for (let x = 300; x < G.w - 300; x += 400) {
        if (G.wetAt(x)) continue;
        const y = G.at(x);
        if (place === 'sommet' ? y < G.base - (G.L.summit || 900) : Math.abs(G.at(x + 40) - G.at(x - 40)) < 30) out.push({ x, y, kind: place });
      }
      return out;
    }
    return G.plats.filter((p) => p.kind === place || (place === 'haut' && (p.kind === 'cime' || p.kind === 'corniche'))).map((p) => ({ x: (p.x0 + p.x1) / 2, y: p.y, kind: p.kind, plat: p }));
  }

  /** Après un coup dur : on repart du nid, ou d'une cachette pas trop loin */
  function respawnPoint(p, nest, st) {
    if (nest) return { x: nest.x, y: nest.y - st - 4, plat: nest.plat || null };
    const x = clamp(p.x + (Math.random() < 0.5 ? -1 : 1) * 600, 300, G.w - 300);
    for (let dx = 0; dx < 3000; dx += 80) {
      for (const s of [-1, 1]) {
        const xx = clamp(x + s * dx, 300, G.w - 300);
        if (!G.wetAt(xx)) return { x: xx, y: G.at(xx) - st };
      }
    }
    return { x: G.startX, y: G.at(G.startX) - st };
  }

  function startPoint(st, frac) {
    let x = frac !== undefined ? frac * G.w : G.startX;
    while (G.wetAt(x) && x < G.w - 300) x += 100;
    return { x, y: G.at(x) - st };
  }

  /* ============================================================================
     LE DESSIN : le fond (à l'écran), le monde (dans le monde), le devant
     ============================================================================ */
  const P = () => G.pal;

  /** Le ciel, le soleil, les montagnes et les forêts au loin, les nuages */
  function drawBack(ctx, cw, ch, cam, zoom, t) {
    const pal = P();
    const sky = pal.sky || ['#6FB8E6', '#BFE3F2', '#F2E8C8'];
    // plus on monte, plus le ciel fonce un peu
    const alt = clamp((G.base - cam.y) / (G.h * 0.8), 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, shade(sky[0], -alt * 0.15));
    g.addColorStop(0.55, sky[1]);
    g.addColorStop(1, sky[2] || sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
    if (pal.stars) {
      for (const s of G.stars) {
        ctx.fillStyle = `rgba(255, 255, 240, ${0.45 + Math.sin(t * 2 + s.p) * 0.3})`;
        ctx.beginPath();
        ctx.arc(s.x * cw, s.y * ch, s.s, 0, TAU);
        ctx.fill();
      }
    }
    // le soleil (ou la lune), qui bouge à peine
    const sun = pal.sun || { x: 0.75, y: 0.2, col: '#FFF4C8', r: 40 };
    const sx = cw * sun.x - (cam.x / G.w - 0.5) * cw * 0.15, sy = ch * sun.y + (cam.y - G.base) * zoom * 0.05;
    const glow = ctx.createRadialGradient(sx, sy, sun.r * 0.5, sx, sy, sun.r * 6);
    glow.addColorStop(0, sun.glow || 'rgba(255, 245, 210, 0.55)');
    glow.addColorStop(1, 'rgba(255, 245, 210, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = sun.col;
    ctx.beginPath();
    ctx.arc(sx, sy, sun.r, 0, TAU);
    ctx.fill();
    // les nuages lointains
    const cloudCol = pal.cloud || 'rgba(255, 255, 255, 0.85)';
    for (const c of G.clouds) {
      if (c.p > 0.2) continue;
      drawCloud(ctx, c, cw, ch, cam, zoom, t, cloudCol);
    }
    // les couches au loin : elles défilent d'autant plus lentement qu'elles sont loin
    const layers = pal.layers || [];
    layers.forEach((Ly, li) => {
      const p = Ly.p;
      const yBase = ch / 2 + (G.base - cam.y) * zoom * p + (Ly.dy || 0) * zoom * p;
      ctx.fillStyle = Ly.col;
      ctx.beginPath();
      ctx.moveTo(0, ch);
      const stepPx = 8;
      for (let sxp = 0; sxp <= cw + stepPx; sxp += stepPx) {
        const u = (sxp - cw / 2) / zoom + cam.x * p;
        const H = layerH(Ly, u, li);
        ctx.lineTo(sxp, yBase - H * zoom * Math.max(0.5, p * 1.4));
      }
      ctx.lineTo(cw, ch);
      ctx.closePath();
      ctx.fill();
      if (Ly.snow) {
        // de la neige sur les plus hauts sommets
        ctx.save();
        ctx.clip();
        ctx.fillStyle = Ly.snow;
        ctx.beginPath();
        for (let sxp = 0; sxp <= cw + stepPx; sxp += stepPx) {
          const u = (sxp - cw / 2) / zoom + cam.x * p;
          const H = layerH(Ly, u, li);
          const y = yBase - H * zoom * Math.max(0.5, p * 1.4);
          if (sxp === 0) ctx.moveTo(sxp, y); else ctx.lineTo(sxp, y);
        }
        for (let sxp = cw + stepPx; sxp >= 0; sxp -= stepPx) {
          const u = (sxp - cw / 2) / zoom + cam.x * p;
          const H = Math.max(Ly.A * 0.72, layerH(Ly, u, li) * 0.86);
          ctx.lineTo(sxp, yBase - H * zoom * Math.max(0.5, p * 1.4));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // la brume qui monte du bas de chaque couche
      if (Ly.haze) {
        const hz = ctx.createLinearGradient(0, yBase - Ly.A * zoom * p, 0, yBase + 60);
        hz.addColorStop(0, 'rgba(255, 255, 255, 0)');
        hz.addColorStop(1, Ly.haze);
        ctx.fillStyle = hz;
        ctx.fillRect(0, yBase - Ly.A * zoom * p * 1.4, cw, ch);
      }
    });
    for (const c of G.clouds) {
      if (c.p <= 0.2) continue;
      drawCloud(ctx, c, cw, ch, cam, zoom, t, cloudCol);
    }
  }

  function layerH(Ly, u, li) {
    const s = li * 13.7;
    if (Ly.kind === 'foret') {
      // des cimes d'arbres, toutes rondes
      const cell = Ly.cell || 120;
      const i = Math.floor(u / cell), f = u / cell - i;
      const hh = (k) => 0.7 + 0.3 * Math.abs(Math.sin(k * 12.9898 + s));
      const a = hh(i), b = hh(i + 1);
      return Ly.A * (lerp(a, b, f) * 0.6 + Math.sqrt(Math.max(0, 1 - (f * 2 - 1) ** 2)) * 0.4);
    }
    if (Ly.kind === 'palmiers') {
      const cell = Ly.cell || 200;
      const f = ((u / cell) % 1 + 1) % 1;
      return Ly.A * (0.55 + 0.1 * Math.sin(u / 300 + s) + (Math.abs(f - 0.5) < 0.04 ? 0.45 : 0));
    }
    // des montagnes : des pics et des crêtes
    const m = Math.abs(Math.sin(u / (Ly.wl || 700) + s)) * 0.55 + Math.abs(Math.sin(u / ((Ly.wl || 700) * 0.37) + s * 2)) * 0.3 + Math.sin(u / ((Ly.wl || 700) * 2.3) + s) * 0.15;
    return Ly.A * (0.35 + m * 0.75);
  }

  function drawCloud(ctx, c, cw, ch, cam, zoom, t, col) {
    const span = cw / zoom + 2400;
    let u = ((c.u + t * 8 * c.p * 3 - cam.x * c.p) % span + span) % span - 1200;
    const x = cw / 2 + u * zoom;
    const y = ch * c.v + (G.base - cam.y) * zoom * c.p * 0.5;
    const R = 60 * c.s * zoom * (0.6 + c.p);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.5 + c.p;
    ctx.beginPath();
    for (const [dx, dy, k] of [[-1.2, 0.15, 0.6], [-0.5, -0.2, 0.85], [0.3, -0.35, 1], [1.1, 0, 0.7], [0.2, 0.2, 0.9]]) {
      ctx.moveTo(x + dx * R + k * R, y + dy * R);
      ctx.arc(x + dx * R, y + dy * R, k * R, 0, TAU);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /** Le monde, derrière les animaux : l'eau (le fond), le sol, les falaises, les troncs, les plantes */
  function drawWorld(ctx, x0, x1, y0, y1, t, zoom) {
    const pal = P();
    const wTop = pal.waterTop || '#5AA6C8', wDeep = pal.waterDeep || '#1E4E6A';
    // l'eau, au fond
    for (const wt of G.waters) {
      if (wt.x1 < x0 || wt.x0 > x1) continue;
      const g = ctx.createLinearGradient(0, wt.y, 0, wt.bottom);
      g.addColorStop(0, wTop);
      g.addColorStop(1, wDeep);
      ctx.fillStyle = g;
      ctx.fillRect(Math.max(x0, wt.x0 - 40), wt.y, Math.min(x1, wt.x1 + 40) - Math.max(x0, wt.x0 - 40), wt.bottom - wt.y + 20);
      // les rayons de lumière sous l'eau
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const rx = wt.x0 + ((i * 397 + t * 18) % Math.max(1, wt.x1 - wt.x0));
        if (rx < x0 - 200 || rx > x1 + 200) continue;
        const rg = ctx.createLinearGradient(0, wt.y, 0, wt.y + 500);
        rg.addColorStop(0, 'rgba(255, 255, 230, 0.12)');
        rg.addColorStop(1, 'rgba(255, 255, 230, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(rx - 30, wt.y);
        ctx.lineTo(rx + 30, wt.y);
        ctx.lineTo(rx + 140, wt.y + 500);
        ctx.lineTo(rx + 40, wt.y + 500);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    // les algues au fond de l'eau
    for (const wd of G.weeds) {
      if (wd.x < x0 - 50 || wd.x > x1 + 50) continue;
      ctx.strokeStyle = pal.weed || '#3E7A4A';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wd.x, wd.y);
      const sw = Math.sin(t * 1.2 + wd.seed) * 18;
      ctx.quadraticCurveTo(wd.x + sw, wd.y - wd.h * 0.5, wd.x + sw * 1.6, wd.y - wd.h);
      ctx.stroke();
    }
    // le sol
    const step = zoom < 0.45 ? STEP * 2 : STEP;
    const xa = Math.max(0, Math.floor(x0 / step) * step - step), xb = Math.min(G.w, x1 + step);
    const deep = Math.min(G.h + 400, y1 + 400);
    const gtop = pal.ground || ['#8A6A44', '#5A4028'];
    const gg = ctx.createLinearGradient(0, G.base - 300, 0, G.base + 900);
    gg.addColorStop(0, gtop[0]);
    gg.addColorStop(1, gtop[1]);
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(xa, deep);
    for (let x = xa; x <= xb; x += step) ctx.lineTo(x, G.at(x));
    ctx.lineTo(xb, deep);
    ctx.closePath();
    ctx.fill();
    // la roche des falaises et des montagnes (peinte une fois, voir rockSprite)
    for (const c of [...G.cliffs, ...G.peaks]) {
      if (c.x1 + 260 < x0 || c.x0 - 260 > x1) continue;
      const sp = rockSprite(c);
      ctx.drawImage(sp.cv, sp.xa, sp.ya, sp.w, sp.h);
    }
    // l'herbe sur le dessus (pas sous l'eau, pas sur la roche nue)
    const grass = pal.grass || '#6A9A3A';
    ctx.strokeStyle = shade(grass, -0.25);
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const edge = (col, lw, dy) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      let pen = false;
      for (let x = xa; x <= xb; x += step) {
        const y = G.at(x);
        const wt = G.wetAt(x);
        const steep = Math.abs(G.at(x + step) - G.at(x - step)) / (step * 2) > 0.85;
        const onPeak = G.peaks.some((pk) => Math.abs(x - pk.x) < pk.hw * 0.85);
        if ((wt && y > wt.y - 4) || steep || onPeak) { pen = false; continue; }
        if (!pen) { ctx.moveTo(x, y + dy); pen = true; } else ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    };
    edge(shade(grass, -0.3), 16, 3);
    edge(grass, 10, 0);
    // des touffes d'herbe
    if (zoom > 0.35) {
      ctx.strokeStyle = shade(grass, 0.12);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = Math.floor(xa / 22) * 22; x <= xb; x += 22) {
        const y = G.at(x);
        const wt = G.wetAt(x);
        if (wt && y > wt.y - 4) continue;
        if (Math.abs(G.at(x + 16) - G.at(x - 16)) > 26) continue;
        const sw = Math.sin(t * 2 + x * 0.05) * 3;
        const hh = 10 + ((x * 7919) % 13);
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4 + sw, y - hh);
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + 7 + sw, y - hh * 0.8);
      }
      ctx.stroke();
    }
    // le sable au bord de l'eau
    for (const wt of G.waters) {
      if (wt.x1 < x0 || wt.x0 > x1) continue;
      ctx.strokeStyle = pal.sand || '#C9B07A';
      ctx.lineWidth = 12;
      ctx.beginPath();
      let pen = false;
      for (let x = Math.max(xa, wt.x0 - 160); x <= Math.min(xb, wt.x1 + 160); x += step) {
        const y = G.at(x);
        if (y < wt.y - 30) { pen = false; continue; }
        if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // les colonnes d'air chaud : de l'air qui tremble et monte
    for (const th of G.thermals) {
      if (th.x + th.w < x0 || th.x - th.w > x1) continue;
      const g2 = ctx.createLinearGradient(th.x - th.w / 2, 0, th.x + th.w / 2, 0);
      g2.addColorStop(0, 'rgba(255, 240, 200, 0)');
      g2.addColorStop(0.5, 'rgba(255, 240, 200, 0.14)');
      g2.addColorStop(1, 'rgba(255, 240, 200, 0)');
      ctx.fillStyle = g2;
      const gy0 = G.at(th.x);
      ctx.fillRect(th.x - th.w / 2, Math.max(y0, th.top), th.w, gy0 - Math.max(y0, th.top));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const yy = gy0 - ((t * 160 + i * 230 + th.seed * 100) % (gy0 - th.top));
        if (yy < y0 - 50 || yy > y1 + 50) continue;
        const xx = th.x + Math.sin(yy * 0.02 + i) * th.w * 0.3;
        ctx.moveTo(xx, yy);
        ctx.quadraticCurveTo(xx + 10, yy - 30, xx, yy - 60);
      }
      ctx.stroke();
    }
    // le camp des humains
    for (const c of G.camps) if (c.x + 500 > x0 && c.x - 500 < x1) drawCamp(ctx, c, t);
    // les plantes et rochers par terre (derrière)
    for (const d of G.deco) {
      if (d.x < x0 - 150 || d.x > x1 + 150) continue;
      if (!DECO[d.type].hide) drawDeco(ctx, d, t);
    }
    // les arbres : troncs et branches
    for (const tr of G.trees) {
      if (tr.x + tr.h * 0.4 < x0 || tr.x - tr.h * 0.4 > x1) continue;
      drawTrunk(ctx, tr, t);
    }
    // les corniches
    for (const p of G.plats) {
      if (p.kind !== 'corniche' || p.x1 < x0 || p.x0 > x1) continue;
      drawLedge(ctx, p);
    }
  }

  /** Par-dessus les animaux : la surface de l'eau (ce qui est dessous est un peu caché), les feuillages, les buissons */
  function drawFront(ctx, x0, x1, y0, y1, t, player) {
    const pal = P();
    for (const wt of G.waters) {
      if (wt.x1 < x0 || wt.x0 > x1) continue;
      const xa = Math.max(x0 - 20, wt.x0 - STEP), xb = Math.min(x1 + 20, wt.x1 + STEP);
      const g = ctx.createLinearGradient(0, wt.y, 0, wt.y + 260);
      g.addColorStop(0, pal.waterFront || 'rgba(70, 150, 190, 0.45)');
      g.addColorStop(1, pal.waterFront2 || 'rgba(20, 70, 100, 0.55)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(xa, wt.y);
      for (let x = xa; x <= xb; x += 12) ctx.lineTo(x, wt.y + Math.sin(x * 0.03 + t * 2.4) * 3);
      // (le dessous suit le fond : sur la plage, l'eau s'amincit jusqu'à rien)
      for (let x = xb; x >= xa; x -= 12) ctx.lineTo(x, Math.max(wt.y + 3, G.at(x) + 2));
      ctx.closePath();
      ctx.fill();
      // la ligne de la surface, qui brille
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = xa; x <= xb; x += 20) {
        const y = wt.y + Math.sin(x * 0.03 + t * 2.4) * 3;
        if (x === xa) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = Math.floor(xa / 90) * 90; x < xb; x += 90) {
        const y = wt.y + 10 + ((x * 31) % 23);
        const s = Math.sin(t * 1.5 + x) * 10;
        ctx.moveTo(x + s, y);
        ctx.lineTo(x + 30 + s, y);
      }
      ctx.stroke();
    }
    // les nénuphars
    for (const l of G.lily) {
      if (l.x < x0 - 40 || l.x > x1 + 40) continue;
      ctx.fillStyle = '#4E9A3E';
      ctx.strokeStyle = '#2A5A22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(l.x, l.y + Math.sin(t * 2.4 + l.x * 0.03) * 3, l.r, l.r * 0.28, 0, 0.3, TAU - 0.3);
      ctx.lineTo(l.x, l.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (l.seed % 3 === 0) {
        ctx.fillStyle = '#F4B6C8';
        ctx.beginPath();
        ctx.ellipse(l.x + 4, l.y - 6, 7, 5, 0, 0, TAU);
        ctx.fill();
      }
    }
    // les feuillages des arbres (transparents quand on est dessous)
    for (const tr of G.trees) {
      if (tr.x + tr.h * 0.5 < x0 || tr.x - tr.h * 0.5 > x1) continue;
      drawCrowns(ctx, tr, t, player);
    }
    // les buissons, les fougères, les roseaux (on s'y cache)
    for (const d of G.deco) {
      if (d.x < x0 - 150 || d.x > x1 + 150 || !DECO[d.type].hide) continue;
      const inside = player && Math.abs(player.x - d.x) < d.r && player.y > d.y - d.r * 1.6 && player.y < d.y + 20;
      ctx.globalAlpha = inside ? 0.5 : 1;
      drawDeco(ctx, d, t);
      ctx.globalAlpha = 1;
    }
  }

  /** Devant tout, à l'écran : la cendre qui tombe, la pluie, les lucioles, la brume */
  function drawWeather(ctx, cw, ch, cam, zoom, t, motes) {
    const pal = P();
    const wx = pal.weather;
    if (pal.mist) {
      const g = ctx.createLinearGradient(0, ch * 0.5, 0, ch);
      g.addColorStop(0, 'rgba(255, 255, 255, 0)');
      g.addColorStop(1, pal.mist);
      ctx.fillStyle = g;
      ctx.fillRect(0, ch * 0.5, cw, ch * 0.5);
    }
    if (!wx) return;
    for (const m of motes) {
      let x = ((m.x * cw - cam.x * zoom * m.d * 0.6) % cw + cw) % cw;
      let y = ((m.y * ch - cam.y * zoom * m.d * 0.6 + t * (wx === 'pluie' ? 900 : wx === 'cendre' ? 30 : wx === 'neige' ? 40 : -8) * m.d) % ch + ch) % ch;
      if (wx === 'cendre' || wx === 'neige') {
        x += Math.sin(t * 0.8 + m.p) * 12;
        ctx.fillStyle = wx === 'cendre' ? `rgba(80, 76, 74, ${0.35 + m.d * 0.4})` : 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(x, y, m.s * 1.2, 0, TAU);
        ctx.fill();
      } else if (wx === 'pluie') {
        ctx.strokeStyle = 'rgba(200, 225, 255, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y + 18 * m.d);
        ctx.stroke();
      } else if (wx === 'lucioles') {
        const a = 0.4 + Math.sin(t * 3 + m.p * 7) * 0.4;
        if (a <= 0.05) continue;
        x += Math.sin(t * 0.7 + m.p) * 20;
        const gl = ctx.createRadialGradient(x, y, 0, x, y, 8);
        gl.addColorStop(0, `rgba(230, 255, 140, ${a})`);
        gl.addColorStop(1, 'rgba(230, 255, 140, 0)');
        ctx.fillStyle = gl;
        ctx.fillRect(x - 8, y - 8, 16, 16);
      } else if (wx === 'pollen') {
        ctx.fillStyle = `rgba(255, 250, 210, ${0.3 + m.d * 0.4})`;
        ctx.beginPath();
        ctx.arc(x + Math.sin(t + m.p) * 10, y, m.s * 0.8, 0, TAU);
        ctx.fill();
      }
    }
  }

  /* ---------- Les arbres ---------- */
  function drawTrunk(ctx, tr, t) {
    const T = TREES[tr.type], pal = P();
    const bark = pal.bark || (tr.type === 'mort' ? '#8A847C' : tr.type === 'palmier' ? '#8A6E4A' : '#6E5236');
    const dark = shade(bark, -0.45);
    const top = { x: tr.x + tr.lean * tr.h, y: tr.top };
    const w0 = tr.tw, w1 = tr.tw * (tr.type === 'palmier' ? 0.75 : 0.45);
    // les racines-contreforts (les géants de la jungle)
    if (T.crown === 'jungle' || T.crown === 'cypres') {
      ctx.fillStyle = shade(bark, -0.1);
      ctx.strokeStyle = dark;
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(tr.x + s * w0 * 0.4, tr.y0 - tr.h * 0.14);
        ctx.quadraticCurveTo(tr.x + s * w0 * 0.6, tr.y0 - 10, tr.x + s * w0 * 2.2, tr.y0 + 4);
        ctx.lineTo(tr.x + s * w0 * 0.3, tr.y0 + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    const g = ctx.createLinearGradient(tr.x - w0, 0, tr.x + w0, 0);
    g.addColorStop(0, shade(bark, -0.25));
    g.addColorStop(0.4, shade(bark, 0.1));
    g.addColorStop(1, shade(bark, -0.35));
    ctx.fillStyle = g;
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (tr.type === 'palmier') {
      // un tronc fin et courbé
      const mx = tr.x + tr.lean * tr.h * 0.2 + (tr.seed % 2 ? 1 : -1) * tr.h * 0.06;
      ctx.moveTo(tr.x - w0 / 2, tr.y0);
      ctx.quadraticCurveTo(mx - w0 / 2, tr.y0 - tr.h * 0.5, top.x - w1 / 2, top.y);
      ctx.lineTo(top.x + w1 / 2, top.y);
      ctx.quadraticCurveTo(mx + w0 / 2, tr.y0 - tr.h * 0.5, tr.x + w0 / 2, tr.y0);
    } else {
      ctx.moveTo(tr.x - w0 / 2, tr.y0);
      ctx.lineTo(top.x - w1 / 2, top.y + (T.crown === 'pin' ? 0 : tr.h * 0.05));
      ctx.lineTo(top.x + w1 / 2, top.y + (T.crown === 'pin' ? 0 : tr.h * 0.05));
      ctx.lineTo(tr.x + w0 / 2, tr.y0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // l'écorce
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (tr.type === 'palmier' || tr.type === 'fougere') {
      for (let y = tr.y0 - 20; y > top.y + 10; y -= 26) {
        const k = (tr.y0 - y) / tr.h;
        const x = lerp(tr.x, top.x, k);
        ctx.moveTo(x - lerp(w0, w1, k) / 2, y);
        ctx.quadraticCurveTo(x, y + 6, x + lerp(w0, w1, k) / 2, y);
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const u = (i + 0.5) / 4 - 0.5;
        ctx.moveTo(tr.x + u * w0 * 0.8, tr.y0 - 10);
        ctx.lineTo(top.x + u * w1 * 0.8, top.y + tr.h * 0.1);
      }
    }
    ctx.stroke();
    // les branches
    for (const b of tr.branches) {
      const bx0 = tr.x + tr.lean * (tr.y0 - b.y) + b.side * w0 * 0.2, by0 = b.y + 30;
      const bx1 = b.side < 0 ? b.x0 : b.x1;
      ctx.strokeStyle = dark;
      ctx.lineCap = 'round';
      ctx.lineWidth = w0 * 0.42 + 6;
      ctx.beginPath();
      ctx.moveTo(bx0, by0);
      ctx.quadraticCurveTo(lerp(bx0, bx1, 0.5), b.y + 8, bx1, b.y - 6);
      ctx.stroke();
      ctx.strokeStyle = shade(bark, 0.05);
      ctx.lineWidth = w0 * 0.42;
      ctx.stroke();
      if (tr.type === 'mort') {
        // de petites branches sèches
        ctx.lineWidth = 5;
        ctx.strokeStyle = dark;
        ctx.beginPath();
        ctx.moveTo(lerp(bx0, bx1, 0.6), b.y);
        ctx.lineTo(lerp(bx0, bx1, 0.75), b.y - 60);
        ctx.moveTo(bx1, b.y - 6);
        ctx.lineTo(bx1 + b.side * 40, b.y - 50);
        ctx.stroke();
      }
    }
    // les lianes qui pendent
    if (T.crown === 'jungle' && P().lianas !== false) {
      ctx.strokeStyle = '#3E6A2E';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const b of tr.branches) {
        const x = (b.x0 + b.x1) / 2 + b.side * 30;
        const sw = Math.sin(t * 0.8 + tr.seed) * 12;
        ctx.moveTo(x, b.y);
        ctx.quadraticCurveTo(x + sw, b.y + 160, x + sw * 0.5, b.y + 300 + (tr.seed % 150));
      }
      ctx.stroke();
    }
    if (tr.type === 'mort') {
      // le haut cassé
      ctx.strokeStyle = dark;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y + 20);
      ctx.lineTo(top.x - 30, top.y - 40);
      ctx.moveTo(top.x, top.y + 10);
      ctx.lineTo(top.x + 25, top.y - 25);
      ctx.stroke();
    }
  }

  function drawCrowns(ctx, tr, t, player) {
    const T = TREES[tr.type];
    const pal = P();
    const leaf = pal.leaf ? pal.leaf : T.leaf;
    if (T.crown === 'mort') return;
    for (const c of tr.crowns) {
      const inside = player && Math.hypot(player.x - c.x, player.y - c.y) < c.r * 1.05;
      ctx.globalAlpha = inside ? 0.42 : 1;
      const sw = Math.sin(t * 0.9 + tr.seed) * 3;
      if (c.frond) {
        // les palmes (ou les grandes feuilles de la fougère arborescente)
        const n = T.crown === 'fougere' ? 9 : 8;
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (i - (n - 1) / 2) * (T.crown === 'fougere' ? 0.36 : 0.42);
          const L = c.r * (1.1 - Math.abs(i - (n - 1) / 2) * 0.05);
          const ex = c.x + Math.cos(a) * L + sw, ey = c.y + Math.sin(a) * L * 0.45 + L * 0.45;
          const mx = c.x + Math.cos(a) * L * 0.55, my = c.y + Math.sin(a) * L * 0.8 - L * 0.08;
          ctx.strokeStyle = leaf[0];
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.quadraticCurveTo(mx, my, ex, ey);
          ctx.stroke();
          ctx.strokeStyle = leaf[i % 2 ? 1 : 2];
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let k = 1; k < 9; k++) {
            const u = k / 9;
            const px = (1 - u) * (1 - u) * c.x + 2 * (1 - u) * u * mx + u * u * ex;
            const py = (1 - u) * (1 - u) * c.y + 2 * (1 - u) * u * my + u * u * ey;
            const l = L * 0.22 * (1 - u * 0.6);
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(a + 1.3) * l, py + Math.sin(a + 1.3) * l + l * 0.5);
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(a - 1.3) * l, py + Math.sin(a - 1.3) * l + l * 0.5);
          }
          ctx.stroke();
        }
      } else if (c.pin) {
        for (let i = 0; i < 5; i++) {
          const y = c.y - c.r * 1.6 + i * c.r * 0.7;
          const wd = c.r * (0.4 + i * 0.22);
          ctx.fillStyle = leaf[i % 2 ? 1 : 0];
          ctx.strokeStyle = shade(leaf[0], -0.3);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(c.x + sw * 0.3, y - c.r * 0.5);
          ctx.lineTo(c.x + wd, y + c.r * 0.45);
          ctx.lineTo(c.x - wd, y + c.r * 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // des boules de feuilles : sombres derrière, claires devant, avec des reflets
        const n = c.flat ? 7 : 6;
        const blobs = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + tr.seed;
          const dx = Math.cos(a) * c.r * (c.flat ? 0.75 : 0.5), dy = Math.sin(a) * c.r * (c.flat ? 0.18 : 0.38);
          blobs.push({ x: c.x + dx + sw, y: c.y + dy, r: c.r * (c.flat ? 0.38 : 0.52) });
        }
        blobs.push({ x: c.x + sw, y: c.y - (c.flat ? c.r * 0.08 : c.r * 0.12), r: c.r * (c.flat ? 0.4 : 0.6) });
        ctx.fillStyle = leaf[0];
        ctx.strokeStyle = shade(leaf[0], -0.35);
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (const b of blobs) { ctx.moveTo(b.x + b.r, b.y); ctx.arc(b.x, b.y, b.r, 0, TAU); }
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = leaf[1];
        ctx.beginPath();
        for (const b of blobs) { ctx.moveTo(b.x + b.r * 0.78, b.y - b.r * 0.15); ctx.arc(b.x, b.y - b.r * 0.15, b.r * 0.78, 0, TAU); }
        ctx.fill();
        ctx.fillStyle = leaf[2];
        ctx.beginPath();
        for (const b of blobs) { ctx.moveTo(b.x - b.r * 0.1 + b.r * 0.38, b.y - b.r * 0.4); ctx.arc(b.x - b.r * 0.1, b.y - b.r * 0.4, b.r * 0.38, 0, TAU); }
        ctx.fill();
        if (pal.flowers && (tr.seed % 3 === 0)) {
          ctx.fillStyle = pal.flowers;
          for (let i = 0; i < 6; i++) {
            const b = blobs[i % blobs.length];
            ctx.beginPath();
            ctx.arc(b.x + Math.cos(i * 2.4) * b.r * 0.5, b.y + Math.sin(i * 2.4) * b.r * 0.4, 7, 0, TAU);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  }


  /* ---------- Les falaises et les montagnes : de la vraie roche ----------
     Peintes une seule fois dans une petite toile (elles ne bougent pas) :
     des couches de roche, des blocs, des fissures, une face au soleil et une
     face à l'ombre, de la mousse, des lianes qui pendent, des éboulis au pied
     et de l'herbe sur le dessus. */
  const baseAt = (c, x) => {
    const i = Math.round(x / STEP) - c.i0;
    return i < 0 || i >= c.base.length ? G.at(x) : c.base[i];
  };

  function rockSprite(c) {
    if (c.spr) return c.spr;
    const pal = P();
    const rock = pal.rock || '#9A8A78';
    const r1 = mulberry32(c.seed || 7);
    const R1 = (a, b) => a + r1() * (b - a);
    const pad = c.peak ? 40 : 90;
    const xa = Math.max(0, c.x0 - pad), xb = Math.min(G.w, c.x1 + pad);
    let top = Infinity, bot = -Infinity;
    for (let x = xa; x <= xb; x += STEP) { top = Math.min(top, G.at(x)); bot = Math.max(bot, baseAt(c, x)); }
    const ya = top - 140, yb = bot + 70;
    const k = 0.7;                                   // la toile est un peu moins fine que l'écran (c'est bien assez)
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil((xb - xa) * k));
    cv.height = Math.max(1, Math.ceil((yb - ya) * k));
    const g = cv.getContext('2d');
    g.scale(k, k);
    g.translate(-xa, -ya);
    const dark = shade(rock, -0.5);
    // où est la roche : entre la surface et l'ancien sol (un peu en dessous)
    const outline = () => {
      g.beginPath();
      g.moveTo(xa, G.at(xa));
      for (let x = xa; x <= xb; x += 8) g.lineTo(x, G.at(x));
      g.lineTo(xb, G.at(xb));
      for (let x = xb; x >= xa; x -= 8) g.lineTo(x, Math.max(G.at(x), baseAt(c, x) + 6));
      g.closePath();
    };
    outline();
    g.save();
    g.clip();
    // les couches de roche (sédimentaires), de tons un peu différents
    const tones = [rock, shade(rock, -0.07), shade(rock, 0.06), shade(rock, -0.13), shade(rock, 0.02)];
    let y = top - 10, band = 0;
    const bands = [];
    const wav = (x, b) => Math.sin(x * (0.008 + (b % 3) * 0.004) + b * 1.7) * 9 + Math.sin(x * 0.031 + b) * 3;
    while (y < yb) {
      const hgt = R1(26, 62);
      bands.push({ y, hgt });
      g.fillStyle = tones[band % tones.length];
      g.beginPath();
      g.moveTo(xa, y + wav(xa, band));
      for (let x = xa; x <= xb; x += 24) g.lineTo(x, y + wav(x, band));
      g.lineTo(xb, y + hgt + 8);
      g.lineTo(xa, y + hgt + 8);
      g.closePath();
      g.fill();
      y += hgt;
      band++;
    }
    // les blocs : des joints verticaux, décalés d'une couche à l'autre
    bands.forEach((b, bi) => {
      let x = xa + R1(0, 140);
      while (x < xb) {
        const w = R1(90, 240);
        if (r1() < 0.7) {
          // un joint de travers, avec un coude (de la vraie roche, pas des briques)
          const y0 = b.y + wav(x, bi) + 2, y2 = b.y + b.hgt + wav(x, bi + 1);
          const mx = x + R1(-14, 14), my = (y0 + y2) / 2 + R1(-6, 6);
          const ex = mx + R1(-16, 16);
          g.strokeStyle = 'rgba(40, 28, 18, 0.32)';
          g.lineWidth = 3;
          g.lineJoin = 'round';
          g.beginPath();
          g.moveTo(x, y0);
          g.lineTo(mx, my);
          g.lineTo(ex, y2);
          g.stroke();
          g.strokeStyle = 'rgba(255, 245, 225, 0.16)';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(x - 3, y0 + 3);
          g.lineTo(mx - 3, my);
          g.lineTo(ex - 3, y2 - 3);
          g.stroke();
        }
        // un bloc bombé : un reflet doux sur le dessus
        g.fillStyle = 'rgba(255, 248, 230, 0.1)';
        g.beginPath();
        g.ellipse(x + w * 0.5, b.y + wav(x + w * 0.5, bi) + b.hgt * 0.3, w * 0.36, b.hgt * 0.22, 0, 0, TAU);
        g.fill();
        x += w;
      }
    });
    for (const b of bands) {
      // l'arête claire en haut de chaque couche, l'ombre en dessous
      g.strokeStyle = 'rgba(255, 248, 230, 0.28)';
      g.lineWidth = 3;
      g.beginPath();
      for (let x = xa; x <= xb; x += 24) {
        const yy = b.y + wav(x, bands.indexOf(b)) + 2;
        if (x === xa) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
      g.strokeStyle = 'rgba(40, 28, 18, 0.32)';
      g.lineWidth = 4;
      g.beginPath();
      for (let x = xa; x <= xb; x += 24) {
        const yy = b.y + b.hgt + wav(x, bands.indexOf(b) + 1) - 1;
        if (x === xa) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
    }
    // des trous et des petits cailloux incrustés
    for (let n = 0; n < (xb - xa) / 60; n++) {
      const x = R1(xa, xb), yy = R1(G.at(x) + 30, baseAt(c, x) - 10);
      if (yy <= G.at(x) + 20) continue;
      g.fillStyle = 'rgba(30, 20, 14, 0.4)';
      g.beginPath();
      g.ellipse(x, yy, R1(6, 16), R1(4, 9), 0, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255, 245, 225, 0.25)';
      g.beginPath();
      g.ellipse(x - 2, yy - 4, R1(3, 7), 2, 0, Math.PI, TAU);
      g.fill();
    }
    // les fissures, de haut en bas
    for (let n = 0; n < Math.max(3, (xb - xa) / 160); n++) {
      let x = R1(xa + 30, xb - 30), yy = G.at(x) + R1(10, 60);
      const end = Math.min(baseAt(c, x), yy + R1(140, 420));
      g.strokeStyle = 'rgba(30, 20, 14, 0.55)';
      g.lineWidth = 3;
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(x, yy);
      const pts = [];
      while (yy < end) {
        x += R1(-14, 14);
        yy += R1(20, 46);
        pts.push([x, yy]);
        g.lineTo(x, yy);
        if (r1() < 0.18) {
          g.moveTo(x, yy);
          g.lineTo(x + R1(-40, 40), yy + R1(20, 50));
          g.moveTo(x, yy);
        }
      }
      g.stroke();
      g.strokeStyle = 'rgba(255, 245, 225, 0.22)';
      g.lineWidth = 1.5;
      g.beginPath();
      pts.forEach(([px, py], i2) => (i2 ? g.lineTo(px + 3, py) : g.moveTo(px + 3, py)));
      g.stroke();
    }
    // les traînées sombres laissées par l'eau de pluie, qui coule du haut
    for (let n = 0; n < Math.max(4, (xb - xa) / 90); n++) {
      const x = R1(xa + 20, xb - 20), wd = R1(12, 38), y0 = G.at(x) + 4, len = R1(150, 520);
      const sg = g.createLinearGradient(0, y0, 0, y0 + len);
      sg.addColorStop(0, 'rgba(35, 25, 20, 0.2)');
      sg.addColorStop(1, 'rgba(35, 25, 20, 0)');
      g.fillStyle = sg;
      g.beginPath();
      g.moveTo(x - wd / 2, y0);
      g.quadraticCurveTo(x - wd * 0.3, y0 + len * 0.6, x + R1(-6, 6), y0 + len);
      g.quadraticCurveTo(x + wd * 0.3, y0 + len * 0.6, x + wd / 2, y0);
      g.closePath();
      g.fill();
    }
    // la lumière : la face de gauche au soleil, celle de droite dans l'ombre
    const sunLeft = (pal.sun ? pal.sun.x : 0.7) < 0.5;
    const lg = g.createLinearGradient(xa, 0, xb, 0);
    const lit = 'rgba(255, 236, 190, 0.22)', shadow = 'rgba(20, 14, 30, 0.32)';
    lg.addColorStop(0, sunLeft ? lit : shadow);
    lg.addColorStop(Math.min(0.45, 160 / (xb - xa)), 'rgba(0, 0, 0, 0)');
    lg.addColorStop(Math.max(0.55, 1 - 160 / (xb - xa)), 'rgba(0, 0, 0, 0)');
    lg.addColorStop(1, sunLeft ? shadow : lit);
    g.fillStyle = lg;
    g.fillRect(xa, ya, xb - xa, yb - ya);
    // l'ombre au pied (la roche s'enfonce dans le sol) et sous le rebord du haut
    // (des traits larges et transparents qui suivent le contour : une ombre bien lisse)
    const along = (yOf, alpha, lw) => {
      g.strokeStyle = `rgba(20, 14, 10, ${alpha})`;
      g.lineWidth = lw;
      g.lineJoin = 'round';
      g.beginPath();
      for (let x = xa; x <= xb; x += 12) {
        const yy = yOf(x);
        if (x === xa) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
    };
    for (let n = 0; n < 6; n++) along((x) => baseAt(c, x) + 6 - n * 24, 0.07, 34);
    for (let n = 0; n < 3; n++) along((x) => G.at(x) + 8 + n * 10, 0.08, 16);
    // (les montagnes) de la neige sur les sommets
    if (c.peak && pal.snow) {
      const snowY = G.at(c.x) + c.H * 0.3;
      g.fillStyle = pal.snow;
      g.beginPath();
      g.moveTo(xa, ya);
      for (let x = xa; x <= xb; x += 12) g.lineTo(x, Math.min(baseAt(c, x), snowY + Math.sin(x * 0.05) * 26 + Math.sin(x * 0.013) * 30));
      g.lineTo(xb, ya);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(160, 190, 220, 0.6)';
      g.lineWidth = 3;
      g.stroke();
    }
    g.restore();
    // le contour de la paroi
    g.strokeStyle = dark;
    g.lineWidth = 4;
    g.lineJoin = 'round';
    g.beginPath();
    let pen = false;
    for (let x = xa; x <= xb; x += 8) {
      const yy = G.at(x);
      const steep = Math.abs(G.at(x + 8) - G.at(x - 8)) / 16 > 0.7;
      if (!steep || baseAt(c, x) - yy < 20) { pen = false; continue; }
      if (!pen) { g.moveTo(x, yy); pen = true; } else g.lineTo(x, yy);
    }
    g.stroke();
    // les éboulis au pied des parois
    for (const fx of [c.x0, c.x1]) {
      if (c.peak) break;
      for (let n = 0; n < 9; n++) {
        const x = fx + (fx === c.x0 ? -1 : 1) * R1(10, 120), rr = R1(8, 24);
        const yy = baseAt(c, x) - rr * 0.35;
        g.fillStyle = tones[n % tones.length];
        g.strokeStyle = dark;
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(x - rr, yy + rr * 0.4);
        g.quadraticCurveTo(x - rr * 0.9, yy - rr * 0.7, x, yy - rr * 0.75);
        g.quadraticCurveTo(x + rr * 0.9, yy - rr * 0.6, x + rr, yy + rr * 0.4);
        g.closePath();
        g.fill();
        g.stroke();
        g.fillStyle = 'rgba(255, 245, 225, 0.3)';
        g.beginPath();
        g.ellipse(x - rr * 0.25, yy - rr * 0.4, rr * 0.35, rr * 0.14, -0.3, 0, TAU);
        g.fill();
      }
    }
    // la végétation : mousse sur les rebords, lianes qui pendent du haut, herbe sur le dessus
    const grass = pal.grass || '#6A9A3A';
    const moss = shade(grass, -0.08);
    for (let n = 0; n < (xb - xa) / 45; n++) {
      const x = R1(xa, xb), gt = G.at(x);
      const yy = R1(gt + 20, Math.max(gt + 21, baseAt(c, x) - 40));
      if (baseAt(c, x) - gt < 80) continue;
      g.fillStyle = r1() < 0.5 ? moss : shade(moss, 0.12);
      g.beginPath();
      for (let m = 0; m < 4; m++) {
        const mx = x + R1(-18, 18), my = yy + R1(-6, 6), mr = R1(5, 11);
        g.moveTo(mx + mr, my);
        g.arc(mx, my, mr, Math.PI, TAU);
      }
      g.fill();
    }
    if (!c.peak) {
      for (const [fx, side] of [[c.x0, -1], [c.x1, 1]]) {
        // le haut de la paroi : là où le dessus s'arrête
        let ex = fx;
        for (let x = fx + side * 120; side < 0 ? x < fx + 200 : x > fx - 200; x -= side * 8) {
          if (Math.abs(G.at(x + 8) - G.at(x - 8)) / 16 < 0.6) { ex = x; break; }
        }
        const ey = G.at(ex);
        for (let n = 0; n < 5; n++) {
          const vx = ex + side * R1(-10, 60), len = R1(60, 260);
          const vy = G.at(vx) + 4;
          const sw = R1(-20, 20);
          g.strokeStyle = shade(grass, -0.3);
          g.lineWidth = 4;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(vx, vy);
          g.quadraticCurveTo(vx + side * 18 + sw, vy + len * 0.5, vx + side * 8 + sw * 0.5, vy + len);
          g.stroke();
          g.fillStyle = shade(grass, 0.05);
          for (let m = 1; m < len / 22; m++) {
            const u = m / (len / 22);
            const lx = vx + (side * 18 + sw) * Math.sin(u * Math.PI) * 0.8, ly = vy + len * u;
            g.beginPath();
            g.ellipse(lx + (m % 2 ? 6 : -6), ly, 7, 3.5, m % 2 ? 0.6 : -0.6, 0, TAU);
            g.fill();
          }
        }
        // une touffe d'herbe qui déborde au bord du haut
        g.strokeStyle = shade(grass, 0.1);
        g.lineWidth = 4;
        g.beginPath();
        for (let m = 0; m < 9; m++) {
          const bx = ex + side * (m * 9 - 20);
          g.moveTo(bx, ey + 2);
          g.quadraticCurveTo(bx + side * 10, ey - 18, bx + side * 22, ey - 6 + R1(0, 14));
        }
        g.stroke();
      }
    }
    c.spr = { cv, xa, ya, w: xb - xa, h: yb - ya };
    return c.spr;
  }

  function drawLedge(ctx, p) {
    // une dalle de roche qui sort de la paroi (la paroi est du côté opposé à p.side)
    const rock = P().rock || '#9A8A78';
    const wallX = p.side > 0 ? p.x0 : p.x1, tipX = p.side > 0 ? p.x1 : p.x0, s = p.side > 0 ? 1 : -1;
    const L = Math.abs(tipX - wallX);
    // son ombre, sur la paroi en dessous
    ctx.fillStyle = 'rgba(20, 14, 10, 0.28)';
    ctx.beginPath();
    ctx.moveTo(wallX + s * 6, p.y + 30);
    ctx.quadraticCurveTo(wallX - s * L * 0.45, p.y + 70, wallX + s * 6, p.y + 120);
    ctx.closePath();
    ctx.fill();
    const g = ctx.createLinearGradient(0, p.y - 4, 0, p.y + 46);
    g.addColorStop(0, shade(rock, 0.14));
    g.addColorStop(0.45, rock);
    g.addColorStop(1, shade(rock, -0.32));
    ctx.fillStyle = g;
    ctx.strokeStyle = shade(rock, -0.5);
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(wallX - s * 16, p.y - 2);
    ctx.quadraticCurveTo(lerp(wallX, tipX, 0.5), p.y - 7, tipX, p.y - 1);
    ctx.quadraticCurveTo(tipX + s * 9, p.y + 9, tipX - s * 4, p.y + 17);
    ctx.quadraticCurveTo(lerp(wallX, tipX, 0.72), p.y + 22, lerp(wallX, tipX, 0.55), p.y + 31);
    ctx.quadraticCurveTo(lerp(wallX, tipX, 0.3), p.y + 36, wallX - s * 12, p.y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // une couche plus sombre dans l'épaisseur, et un reflet sur l'arête
    ctx.strokeStyle = 'rgba(40, 28, 18, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wallX, p.y + 15);
    ctx.quadraticCurveTo(lerp(wallX, tipX, 0.5), p.y + 18, tipX - s * 8, p.y + 12);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 248, 230, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(wallX, p.y + 2);
    ctx.quadraticCurveTo(lerp(wallX, tipX, 0.5), p.y - 3, tipX - s * 2, p.y + 3);
    ctx.stroke();
    // la mousse et quelques brins d'herbe sur le dessus
    const grass = P().grass || '#6A8A3A';
    ctx.fillStyle = shade(grass, -0.05);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const mx = lerp(wallX, tipX, 0.15 + k * 0.22), mr = 7 + (k % 2) * 3;
      ctx.moveTo(mx + mr, p.y - 1);
      ctx.arc(mx, p.y - 1, mr, Math.PI, TAU);
    }
    ctx.fill();
    ctx.strokeStyle = shade(grass, 0.12);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const bx = lerp(wallX, tipX, 0.1 + k * 0.15);
      ctx.moveTo(bx, p.y - 2);
      ctx.lineTo(bx + (k % 2 ? 4 : -3), p.y - 12 - (k % 3) * 4);
    }
    ctx.stroke();
  }

  /* ---------- Les plantes, les rochers, le camp ---------- */
  function drawDeco(ctx, d, t) {
    const pal = P();
    const r = d.r, x = d.x, y = d.y;
    const sw = Math.sin(t * 1.4 + d.seed) * r * 0.05;
    switch (d.type) {
      case 'fougere': {
        const col = pal.fern || ['#2E6A34', '#4E9A44'];
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.38;
          const ex = x + Math.cos(a) * r * 1.1 + sw, ey = y + Math.sin(a) * r * 1.1 * 0.9;
          ctx.strokeStyle = col[i % 2];
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.9, ex, ey);
          ctx.stroke();
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let k = 1; k < 7; k++) {
            const u = k / 7;
            const px = lerp(x, ex, u), py = lerp(y, ey, u) - Math.sin(u * Math.PI) * r * 0.15;
            ctx.moveTo(px, py);
            ctx.lineTo(px + r * 0.12, py + r * 0.06);
            ctx.moveTo(px, py);
            ctx.lineTo(px - r * 0.12, py + r * 0.06);
          }
          ctx.stroke();
        }
        break;
      }
      case 'buisson': {
        const col = pal.bush || ['#3A6A2E', '#4E8A3A', '#6AA448'];
        const blobs = [[-0.55, -0.35, 0.5], [0.5, -0.4, 0.5], [0, -0.7, 0.6], [-0.2, -0.3, 0.55], [0.3, -0.25, 0.5]];
        ctx.fillStyle = col[0];
        ctx.strokeStyle = shade(col[0], -0.35);
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const [dx, dy, k] of blobs) { ctx.moveTo(x + dx * r + k * r + sw, y + dy * r); ctx.arc(x + dx * r + sw, y + dy * r, k * r, 0, TAU); }
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = col[1];
        ctx.beginPath();
        for (const [dx, dy, k] of blobs) { ctx.moveTo(x + dx * r + k * r * 0.7 + sw, y + dy * r - k * r * 0.2); ctx.arc(x + dx * r + sw, y + dy * r - k * r * 0.2, k * r * 0.7, 0, TAU); }
        ctx.fill();
        if (pal.berries) {
          ctx.fillStyle = pal.berries;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(x + Math.cos(d.seed + i * 2) * r * 0.6, y - r * 0.4 + Math.sin(d.seed + i) * r * 0.3, 5, 0, TAU);
            ctx.fill();
          }
        }
        break;
      }
      case 'herbe': case 'roseau': {
        const col = d.type === 'roseau' ? ['#5A7A3A', '#7A9A4A'] : (pal.tallGrass || ['#7A9A3A', '#A8B85A']);
        ctx.lineCap = 'round';
        for (let i = 0; i < 11; i++) {
          const u = i / 10 - 0.5;
          const hh = r * (1.3 + Math.sin(i * 7.1 + d.seed) * 0.4) * (d.type === 'roseau' ? 1.6 : 1);
          const s2 = Math.sin(t * 1.6 + i + d.seed) * r * 0.12;
          ctx.strokeStyle = col[i % 2];
          ctx.lineWidth = d.type === 'roseau' ? 5 : 4;
          ctx.beginPath();
          ctx.moveTo(x + u * r, y);
          ctx.quadraticCurveTo(x + u * r * 1.4, y - hh * 0.6, x + u * r * 1.8 + s2, y - hh);
          ctx.stroke();
          if (d.type === 'roseau' && i % 3 === 0) {
            ctx.fillStyle = '#6A4A2A';
            ctx.beginPath();
            ctx.ellipse(x + u * r * 1.8 + s2, y - hh + 12, 5, 14, 0, 0, TAU);
            ctx.fill();
          }
        }
        break;
      }
      case 'fleur': {
        ctx.strokeStyle = '#4A7A3A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + sw, y - r * 2.5);
        ctx.stroke();
        const cols = pal.flowerCols || ['#F2C84A', '#F28AB0', '#FFFFFF', '#B08AE8'];
        ctx.fillStyle = cols[d.seed % cols.length];
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * TAU;
          ctx.beginPath();
          ctx.arc(x + sw + Math.cos(a) * r * 0.5, y - r * 2.5 + Math.sin(a) * r * 0.5, r * 0.45, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#F2A23A';
        ctx.beginPath();
        ctx.arc(x + sw, y - r * 2.5, r * 0.35, 0, TAU);
        ctx.fill();
        break;
      }
      case 'rocher': {
        const rock = pal.rock || '#9A8A78';
        ctx.fillStyle = rock;
        ctx.strokeStyle = shade(rock, -0.45);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - r, y + 4);
        ctx.quadraticCurveTo(x - r * 0.9, y - r * 0.7, x - r * 0.1, y - r * 0.8);
        ctx.quadraticCurveTo(x + r * 0.8, y - r * 0.7, x + r, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.3, y - r * 0.5, r * 0.3, r * 0.12, -0.3, 0, TAU);
        ctx.fill();
        break;
      }
      case 'os': {
        ctx.strokeStyle = '#E8E0CC';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const xx = x - r * 0.6 + i * r * 0.4;
          ctx.moveTo(xx, y);
          ctx.quadraticCurveTo(xx + r * 0.2, y - r * 0.8, xx + r * 0.45, y - r * 0.2);
        }
        ctx.stroke();
        break;
      }
      case 'souche': {
        const bark = '#7A5A3A';
        ctx.fillStyle = bark;
        ctx.strokeStyle = shade(bark, -0.5);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.7, y + 3);
        ctx.lineTo(x - r * 0.5, y - r * 0.8);
        ctx.lineTo(x + r * 0.5, y - r * 0.9);
        ctx.lineTo(x + r * 0.75, y + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#C9A06A';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.85, r * 0.5, r * 0.12, -0.05, 0, TAU);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'champignon': {
        ctx.fillStyle = '#F2EAD6';
        ctx.fillRect(x - r * 0.2, y - r, r * 0.4, r);
        ctx.fillStyle = d.seed % 2 ? '#D9483A' : '#C9A06A';
        ctx.beginPath();
        ctx.ellipse(x, y - r, r * 0.8, r * 0.5, 0, Math.PI, TAU);
        ctx.fill();
        break;
      }
      case 'cactus': {
        ctx.fillStyle = '#5A8A4A';
        ctx.strokeStyle = '#2E4A26';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x - r * 0.18, y - r * 1.8, r * 0.36, r * 1.8, r * 0.18) : ctx.rect(x - r * 0.18, y - r * 1.8, r * 0.36, r * 1.8);
        ctx.fill();
        ctx.stroke();
        break;
      }
      default: break;
    }
  }

  function drawCamp(ctx, c, t) {
    // deux tentes en peaux, et le feu au milieu
    for (const [dx, s] of [[-170, 1], [190, 0.85]]) {
      const x = c.x + dx, y = c.y + 4, H = 190 * s, W = 150 * s;
      ctx.fillStyle = '#B08A5E';
      ctx.strokeStyle = '#4A3018';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - W, y);
      ctx.lineTo(x, y - H);
      ctx.lineTo(x + W, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3A2414';
      ctx.beginPath();
      ctx.moveTo(x - W * 0.25, y);
      ctx.lineTo(x, y - H * 0.5);
      ctx.lineTo(x + W * 0.25, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6A4A2A';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x - 20, y - H - 30);
      ctx.lineTo(x + 10, y - H + 20);
      ctx.moveTo(x + 20, y - H - 30);
      ctx.lineTo(x - 10, y - H + 20);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(80, 50, 20, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - W * 0.6, y - H * 0.4);
      ctx.lineTo(x + W * 0.6, y - H * 0.4);
      ctx.stroke();
    }
    // le feu
    const fx = c.x, fy = c.y;
    ctx.fillStyle = '#6A6058';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(fx - 50 + i * 20, fy - 4, 10, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(fx, fy - 40, 10, fx, fy - 40, 260);
    gl.addColorStop(0, 'rgba(255, 170, 60, 0.4)');
    gl.addColorStop(1, 'rgba(255, 120, 30, 0)');
    ctx.fillStyle = gl;
    ctx.fillRect(fx - 260, fy - 300, 520, 400);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) {
      const fl = Math.sin(t * 9 + i * 2) * 8;
      ctx.fillStyle = ['#FF8A2A', '#FFC23A', '#FFF0A0'][i];
      const s = 1 - i * 0.28;
      ctx.beginPath();
      ctx.moveTo(fx - 36 * s, fy - 6);
      ctx.quadraticCurveTo(fx - 30 * s, fy - 60 * s, fx + fl, fy - 110 * s);
      ctx.quadraticCurveTo(fx + 30 * s, fy - 60 * s, fx + 36 * s, fy - 6);
      ctx.closePath();
      ctx.fill();
    }
    // la fumée
    ctx.fillStyle = 'rgba(160, 160, 160, 0.25)';
    for (let i = 0; i < 4; i++) {
      const k = ((t * 0.3 + i * 0.25) % 1);
      ctx.beginPath();
      ctx.arc(fx + Math.sin(k * 6 + i) * 30, fy - 140 - k * 300, 20 + k * 40, 0, TAU);
      ctx.fill();
    }
  }

  /** Sur la carte (le radar) : le relief et l'eau */
  function minimap(mctx, toM, range, S) {
    const pl = api.player();
    mctx.fillStyle = 'rgba(120, 90, 60, 0.75)';
    mctx.beginPath();
    const x0 = pl.x - range, x1 = pl.x + range;
    const p0 = toM(x0, G.at(Math.max(0, x0)));
    mctx.moveTo(p0.x, S);
    for (let x = x0; x <= x1; x += range / 30) {
      const p = toM(x, G.at(clamp(x, 0, G.w)));
      mctx.lineTo(p.x, p.y);
    }
    mctx.lineTo(S, S);
    mctx.closePath();
    mctx.fill();
    mctx.fillStyle = 'rgba(90, 180, 220, 0.7)';
    for (const wt of G.waters) {
      if (wt.x1 < x0 || wt.x0 > x1) continue;
      const a = toM(wt.x0, wt.y), b = toM(wt.x1, wt.bottom);
      mctx.fillRect(a.x, a.y, b.x - a.x, Math.max(2, b.y - a.y));
    }
    mctx.fillStyle = 'rgba(80, 200, 110, 0.55)';
    for (const tr of G.trees) {
      if (tr.x < x0 || tr.x > x1) continue;
      const a = toM(tr.x, tr.top), b = toM(tr.x, tr.y0);
      mctx.fillRect(a.x - 1.5, a.y, 3, b.y - a.y);
    }
  }

  return {
    on, build, get G() { return G; }, groundY, nestReachable, waterAt, zoneAt, thermalAt, placeOf, move, creature, reach,
    spawnPoint, wanderPoint, nestSpots, respawnPoint, startPoint, standOf,
    drawBack, drawWorld, drawFront, drawWeather, minimap,
  };
}
