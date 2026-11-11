// ============================================================================
// Évolution — un niveau « vu de dessus » redessiné en VUE DE TROIS QUARTS
// (world.style === 'tqv' : le niveau du loup). Le moteur ne change pas : les
// mares, la neige, les camps, l'enclos, les hautes herbes et les arbres sont
// ceux de world.decor (voir script.js), aux mêmes places et avec les mêmes
// règles ; seul leur dessin change, dans le style de la voie des humains :
//   - à plat, sur le sol : la neige, l'eau des mares (gelée sur les bords à
//     l'âge de glace), la terre battue des camps et des villages, l'herbe
//     foulée de l'enclos, les touffes et les fleurs ;
//   - debout, rangé avec les animaux du fond vers le devant : les sapins et
//     les arbres, les rochers, les hautes herbes où l'on se cache, les
//     roseaux, les buissons, les os des grands repas, les tentes en peaux, le
//     séchoir et le feu des camps, les huttes des villages, la barrière de
//     l'enclos.
// Un grand objet planté devant le joueur devient transparent : on le voit
// toujours. (Les dessins sont dans art-humains.js ; les couleurs, dans
// chapters[].palette ; la végétation en plus, dans world.land.)
// ============================================================================

import { shade } from './art.js';
import {
  drawTree, drawRock, drawBush, drawGrass, drawFern, drawFlowers, drawReeds, drawDecal, drawHearth, drawHut, drawPost,
  drawTent, drawRack, drawBones,
} from './art-humains.js';

const TAU = Math.PI * 2;
const CELL = 500;                  // la grille qui range le décor (pour ne dessiner que ce qu'on voit)
const FENCE = 0.85;                // la barrière de l'enclos, en part de son rayon (comme dans script.js)

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

/* Les couleurs par défaut (la steppe enneigée) ; chapters[].palette les remplace */
const DEFAULTS = {
  floor: '#DCE6EC', leaf: ['#1E4A34', '#2A5E40', '#3A7650'], rock: '#9A968E', bush: ['#5A7A5A', '#6E8E68', '#8AA67E'],
  tallGrass: ['#B4AE84', '#D2CCA6'], pond: '#6E9AB4', bank: '#8A9488', sand: '#D2D8CC', dirt: 'rgba(130, 110, 80, 0.55)',
  hideBase: 'rgba(160, 150, 110, 0.3)', drift: '#F6F9FF', pen: 'rgba(120, 100, 60, 0.22)',
};

/** Un bord irrégulier (n rayons, de 0,88 à 1,06) : les mares et les congères ne sont pas des ronds parfaits */
function wobble(seed, n) {
  const rnd = mulberry32(seed + 17);
  return Array.from({ length: n }, () => 0.88 + rnd() * 0.18);
}
/** Le chemin d'une forme molle de rayon r (k = l'échelle), qui suit son bord irrégulier */
function blob(ctx, x, y, r, edge, k = 1, squash = 1) {
  const n = edge.length;
  const pt = (i) => {
    const a = (i / n) * TAU;
    return [x + Math.cos(a) * r * k * edge[i % n], y + Math.sin(a) * r * k * edge[i % n] * squash];
  };
  ctx.beginPath();
  let [px, py] = pt(0);
  let [qx, qy] = pt(1);
  ctx.moveTo((px + qx) / 2, (py + qy) / 2);
  for (let i = 1; i <= n; i++) {
    [px, py] = pt(i);
    [qx, qy] = pt(i + 1);
    ctx.quadraticCurveTo(px, py, (px + qx) / 2, (py + qy) / 2);
  }
  ctx.closePath();
}

export function createDecorTqv(api) {
  const on = () => api.level().world.style === 'tqv';
  let flats = [];                  // ce qui se dessine à plat (mares, neige, terre battue…)
  let grid = new Map();            // ce qui est debout, rangé par case
  let decalGrid = new Map();       // les touffes et les fleurs du sol, rangées par case
  let palFor = null, palNow = DEFAULTS;

  const pal = () => {
    const CH = api.chapter();
    if (CH !== palFor) {
      palFor = CH;
      palNow = { ...DEFAULTS, ...(CH.palette || {}) };
    }
    return palNow;
  };
  const key = (cx, cy) => `${cx},${cy}`;
  const put = (g, o) => {
    const k = key(Math.floor(o.x / CELL), Math.floor(o.y / CELL));
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(o);
  };

  /* ============================================================================
     LA CONSTRUCTION (une fois par niveau) : à partir du décor du moteur
     ============================================================================ */
  function build(decor, zones, seed) {
    const W = api.level().world, L = W.land || {};
    const rnd = mulberry32(seed);
    const R = (a, b) => a + rnd() * (b - a);
    const sd = () => Math.floor(rnd() * 1e6);
    flats = [];
    grid = new Map();
    decalGrid = new Map();
    const add = (o) => put(grid, o);
    for (const d of [...zones, ...decor]) {
      const s = { from: d.from || 1, to: d.to || 99 };
      const at = (a, k, kk = k) => ({ x: d.x + Math.cos(a) * d.r * k, y: d.y + Math.sin(a) * d.r * kk });
      switch (d.type) {
        case 'mare': {
          flats.push({ k: 'mare', x: d.x, y: d.y, r: d.r, seed: d.seed, edge: wobble(d.seed, 16), ...s });
          // des roseaux tout autour de l'eau
          const n = 4 + Math.floor(d.r / 60);
          for (let i = 0; i < n; i++) {
            if (rnd() < 0.3) continue;
            add({ type: 'roseaux', ...at((i / n) * TAU + R(-0.2, 0.2), 0.88), r: R(30, 44), seed: sd(), ...s });
          }
          break;
        }
        case 'neige':
          flats.push({ k: 'neige', x: d.x, y: d.y, r: d.r, seed: d.seed, edge: wobble(d.seed, 12), ...s });
          break;
        case 'camp': {
          // le camp de l'âge de glace : le feu au milieu, trois tentes en peaux, le séchoir
          flats.push({ k: 'terre', x: d.x, y: d.y, r: d.r, ...s });
          add({ type: 'feu', x: d.x, y: d.y + 10, seed: sd(), ...s });
          const a0 = rnd() * TAU;
          for (let i = 0; i < 3; i++) add({ type: 'tente', ...at(a0 + i * TAU / 3 + R(-0.3, 0.3), 0.68, 0.6), r: R(64, 80), seed: sd(), ...s });
          add({ type: 'sechoir', ...at(a0 + TAU / 6, 0.6, 0.55), r: 54, seed: sd(), ...s });
          break;
        }
        case 'village': {
          // le premier village : des huttes rondes au toit de chaume, autour du feu
          flats.push({ k: 'terre', x: d.x, y: d.y, r: d.r, ...s });
          add({ type: 'feu', x: d.x, y: d.y + 10, seed: sd(), ...s });
          const a0 = rnd() * TAU;
          for (let i = 0; i < 3; i++) add({ type: 'hutte', ...at(a0 + i * TAU / 3 + R(-0.25, 0.25), 0.66, 0.58), r: R(64, 74), seed: sd(), ...s });
          break;
        }
        case 'enclos': {
          // la barrière, tout autour, sauf à la porte (gate = sa direction, gateW = sa largeur)
          const RR = d.r * FENCE;
          flats.push({ k: 'pre', x: d.x, y: d.y, r: RR, ...s });
          const span = TAU - d.gateW, m = Math.ceil(span * RR / 105);
          let prev = null;
          for (let i = 0; i <= m; i++) {
            const a = d.gate + d.gateW / 2 + (i / m) * span;
            const p = { type: 'piquet', x: d.x + Math.cos(a) * RR, y: d.y + Math.sin(a) * RR, r: 60, gate: i === 0 || i === m, next: null, ...s };
            if (prev) prev.next = p;
            prev = p;
            add(p);
          }
          break;
        }
        case 'sapin-neige':
          add({ type: 'arbre', kind: 'pin', x: d.x, y: d.y, r: d.r * 0.55, seed: d.seed, tall: true, ...s });
          break;
        case 'feuillu':
          add({ type: 'arbre', kind: rnd() < 0.3 ? 'bouleau' : 'feuillu', x: d.x, y: d.y, r: d.r * 0.5, seed: d.seed, tall: true, ...s });
          break;
        case 'rocher':
          add({ type: 'rocher', x: d.x, y: d.y, r: d.r * 0.8, seed: d.seed, tall: d.r > 50, ...s });
          break;
        case 'os':
          add({ type: 'os', x: d.x, y: d.y, r: d.r, seed: d.seed, ...s });
          break;
        case 'fleur':
          add({ type: 'fleurs', x: d.x, y: d.y, r: 18 + d.r, seed: d.seed, ...s });
          break;
        default:
          if (d.hide) {
            // les hautes herbes où l'on se cache : des touffes serrées, sur une tache d'herbe sèche
            flats.push({ k: 'herbe', x: d.x, y: d.y, r: d.r, ...s });
            const n = Math.max(6, Math.round((d.r / 36) ** 2 * 0.85));
            for (let i = 0; i < n; i++) {
              const a = rnd() * TAU, k = Math.sqrt(rnd()) * 0.86;
              add({ type: 'herbes', x: d.x + Math.cos(a) * d.r * k, y: d.y + Math.sin(a) * d.r * k, r: R(44, 60), seed: sd(), ...s });
            }
          }
      }
    }
    // la végétation en plus, pour le plaisir des yeux (elle ne cache rien, elle n'arrête personne)
    const busy = zones.filter((z) => z.zone === 'water' || z.zone === 'camp' || z.zone === 'pen');
    const free = (x, y, m) => !busy.some((z) => Math.hypot(z.x - x, z.y - y) < z.r + m);
    for (const [type, n, r0, r1, from] of [['buisson', L.bushes ?? 260, 34, 54, 1], ['fougere', L.ferns ?? 0, 40, 60, L.fernsFrom || 1]]) {
      for (let i = 0; i < n; i++) {
        const x = R(150, W.w - 150), y = R(150, W.h - 150);
        if (free(x, y, 90)) add({ type, x, y, r: R(r0, r1), seed: sd(), from, to: 99 });
      }
    }
    // les touffes d'herbe et les fleurs, au sol (par terre : on marche dessus)
    const nd = L.decals ?? Math.round(W.w * W.h / 26000);
    for (let i = 0; i < nd; i++) {
      const x = R(0, W.w), y = R(0, W.h);
      put(decalGrid, { x, y, s: R(0.8, 1.4), k: rnd() < 0.25 ? 'fleur' : 'herbe', seed: sd() });
    }
  }

  /** Tout ce qui est rangé dans les cases de ce rectangle */
  function inCells(g, x0, x1, y0, y1, fn) {
    for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) {
      for (let cy = Math.floor(y0 / CELL); cy <= Math.floor(y1 / CELL); cy++) {
        const list = g.get(key(cx, cy));
        if (list) for (const o of list) fn(o);
      }
    }
  }
  const now = (o) => {
    const ch = api.game().chapter + 1;
    return o.from <= ch && o.to >= ch;
  };

  /* ============================================================================
     LE SOL (à plat)
     ============================================================================ */
  function drawGround(ctx, x0, x1, y0, y1, t) {
    const P = pal();
    // les touffes et les fleurs (à l'âge de glace : des brins d'herbe sèche qui sortent de la neige)
    const [dark, light] = P.tuft || [shade(P.floor, -0.2), shade(P.floor, 0.14)];
    const flowers = P.snow ? null : P.flowers;
    inCells(decalGrid, x0 - 30, x1 + 30, y0 - 30, y1 + 30, (d) => drawDecal(ctx, d, flowers, dark, light));
    const vis = (f, m) => now(f) && f.x + f.r + m > x0 && f.x - f.r - m < x1 && f.y + f.r + m > y0 && f.y - f.r - m < y1;
    for (const f of flats) {
      if (f.k === 'mare' || !vis(f, 40)) continue;
      if (f.k === 'neige') drawDrift(ctx, f, t, P);
      else {
        // la terre battue des camps, l'herbe foulée de l'enclos, l'herbe sèche des cachettes
        const col = f.k === 'terre' ? P.dirt : f.k === 'pre' ? P.pen : P.hideBase;
        const g = ctx.createRadialGradient(f.x, f.y, f.r * 0.25, f.x, f.y, f.r * 1.02);
        g.addColorStop(0, col);
        g.addColorStop(0.75, col);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 1.02, 0, TAU);
        ctx.fill();
      }
    }
    for (const f of flats) if (f.k === 'mare' && vis(f, 40)) drawPond(ctx, f, t, P);
  }

  /** Une congère : un tas de neige tout doux, avec son ombre bleutée et ses paillettes */
  function drawDrift(ctx, f, t, P) {
    // l'ombre, devant (en bas), puis la neige, bleutée sur sa pente de devant, et le dessus qui brille
    ctx.fillStyle = 'rgba(110, 140, 185, 0.22)';
    blob(ctx, f.x + f.r * 0.04, f.y + f.r * 0.12, f.r, f.edge, 0.94, 0.85);
    ctx.fill();
    ctx.save();
    blob(ctx, f.x, f.y, f.r, f.edge, 0.92, 0.85);
    ctx.fillStyle = P.drift;
    ctx.fill();
    ctx.clip();
    const g = ctx.createLinearGradient(0, f.y - f.r * 0.2, 0, f.y + f.r * 0.85);
    g.addColorStop(0, 'rgba(170, 195, 230, 0)');
    g.addColorStop(1, 'rgba(150, 180, 225, 0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    blob(ctx, f.x - f.r * 0.12, f.y - f.r * 0.18, f.r, f.edge, 0.55, 0.6);
    ctx.fill();
    // les paillettes qui scintillent
    const rnd = mulberry32(f.seed);
    for (let i = 0; i < 10; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * f.r * 0.75;
      const k = 0.5 + Math.sin(t * 3 + i * 1.7 + f.seed) * 0.5;
      ctx.fillStyle = `rgba(200, 225, 255, ${0.3 + k * 0.6})`;
      ctx.beginPath();
      ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * 0.85, 2 + k * 1.5, 0, TAU);
      ctx.fill();
    }
  }

  /** Une mare : la berge, le sable, l'eau (plus foncée au milieu), ses reflets ; gelée au bord à l'âge de glace */
  function drawPond(ctx, f, t, P) {
    ctx.fillStyle = P.bank;
    blob(ctx, f.x, f.y, f.r, f.edge, 1.02);
    ctx.fill();
    ctx.fillStyle = P.sand;
    blob(ctx, f.x, f.y, f.r, f.edge, 0.95);
    ctx.fill();
    ctx.fillStyle = P.pond;
    blob(ctx, f.x, f.y, f.r, f.edge, 0.86);
    ctx.fill();
    ctx.fillStyle = shade(P.pond, -0.16);
    blob(ctx, f.x + f.r * 0.04, f.y + f.r * 0.05, f.r, f.edge, 0.55);
    ctx.fill();
    if (P.ice) {
      // la glace, sur les bords, et ses fissures
      ctx.strokeStyle = 'rgba(235, 245, 255, 0.85)';
      ctx.lineWidth = f.r * 0.12;
      blob(ctx, f.x, f.y, f.r, f.edge, 0.8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(160, 190, 215, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + f.seed;
        ctx.moveTo(f.x + Math.cos(a) * f.r * 0.86, f.y + Math.sin(a) * f.r * 0.86);
        ctx.lineTo(f.x + Math.cos(a + 0.12) * f.r * 0.72, f.y + Math.sin(a + 0.12) * f.r * 0.72);
      }
      ctx.stroke();
    }
    // les reflets du ciel, qui bougent doucement
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const u = (t * 0.05 + i * 0.27 + f.seed * 0.001) % 1;
      const xx = f.x + (u - 0.5) * f.r * 1.0, yy = f.y + (i - 1.5) * f.r * 0.22;
      ctx.moveTo(xx - f.r * 0.12, yy);
      ctx.lineTo(xx + f.r * 0.12, yy);
    }
    ctx.stroke();
  }

  /* ============================================================================
     CE QUI EST DEBOUT (rangé avec les animaux, du fond vers le devant)
     ============================================================================ */
  function uprights(x0, x1, y0, y1) {
    const out = [];
    inCells(grid, x0 - 250, x1 + 250, y0 - 100, y1 + 450, (o) => {
      if (now(o) && o.x + o.r * 1.6 > x0 && o.x - o.r * 1.6 < x1) out.push({ y: o.y, deco: o });
    });
    return out;
  }

  /** Sa hauteur et sa demi-largeur (pour savoir s'il cache le joueur) */
  function box(o) {
    switch (o.type) {
      case 'arbre': return [o.r * (o.kind === 'pin' ? 3.0 : 3.1), o.r * 1.05];
      case 'tente': return [o.r * 2.3, o.r];
      case 'hutte': return [o.r * 1.9, o.r * 1.1];
      default: return [o.r * 1.1, o.r];
    }
  }

  function drawUpright(ctx, u, t) {
    const o = u.deco, P = pal();
    const p = api.player();
    let fade = false;
    if (p && !p.dead && (o.tall || o.type === 'tente' || o.type === 'hutte')) {
      // devant le joueur, et assez grand pour le cacher : on le voit à travers
      const [H, w] = box(o);
      fade = o.y > p.y + 4 && o.y - H < p.y - p.size * 0.3 && Math.abs(o.x - p.x) < w + p.size * 0.6;
    }
    if (fade) ctx.globalAlpha = 0.42;
    switch (o.type) {
      case 'arbre': drawTree(ctx, o, t, P); break;
      case 'rocher': drawRock(ctx, o, P); break;
      case 'herbes': drawGrass(ctx, o, t, P); break;
      case 'buisson': drawBush(ctx, o, t, P); break;
      case 'fougere': drawFern(ctx, o, t, P); break;
      case 'fleurs': drawFlowers(ctx, o, t, P); break;
      case 'roseaux': drawReeds(ctx, o, t, P); break;
      case 'os': drawBones(ctx, o); break;
      case 'feu': drawHearth(ctx, o, t, true, true); break;
      case 'tente': drawTent(ctx, o, t, P); break;
      case 'sechoir': drawRack(ctx, o); break;
      case 'hutte': drawHut(ctx, o, t, P); break;
      case 'piquet': drawPost(ctx, o); break;
      default: break;
    }
    if (fade) ctx.globalAlpha = 1;
  }

  return { on, build, drawGround, uprights, drawUpright };
}
