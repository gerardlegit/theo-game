// ============================================================================
// Les dessins des Embouteillages de Bouchonville, tout en code (aucune image) :
//   - la ville vue de dessus : herbe, trottoirs, routes et leurs marquages,
//     maisons, immeubles, boutiques, jardins, parc et fontaine, rivière et
//     ponts, stade, et les lieux d'arrivée (école, hôpital, boulangerie,
//     piscine) avec leur parking. Tout ce qui ne bouge pas est dessiné une
//     seule fois dans une image (buildCity + drawCityStatic) ;
//   - ce qui bouge : les voitures décapotables et leur conducteur (yeux,
//     sourcils, bouche selon sa colère), les clignotants, les panneaux sur
//     leur poteau et leurs marquages au sol, les passants, les nageurs, les
//     joueurs du stade, l'eau de la fontaine, les ombres des nuages ;
//   - Zaza, la zèbre agente de la circulation (SVG pour la bulle, canvas
//     pour les films).
// ============================================================================

import { TILE, LANE } from './ville.js';
import { LIEUX } from './data.js';

export const INK = '#2E2A4D';
const TAU = Math.PI * 2;
const HALF = TILE / 2;
const SIDEWALK = 7;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

/* ========================================================================
   LE PLAN DE LA VILLE : ce qu'il y a sur chaque carreau
   ======================================================================== */
const ROOFS = ['#D9603B', '#C94F3D', '#E07A45', '#8E5A9B', '#4F7FB8', '#B5583F', '#7A6A5A', '#5E9C6A'];
const WALLS = ['#F4E3C9', '#FBEFD9', '#EADCCB', '#F7D9C4'];
const AWNINGS = [['#F25C54', '#FFFFFF'], ['#3FA7E0', '#FFFFFF'], ['#5BC46A', '#FFF6D6'], ['#FFC53D', '#FFFFFF'], ['#9C6ADE', '#FFFFFF']];

export function buildCity(level, city, seed = 1) {
  const R = rng(seed);
  const { W, H, at } = city;
  const kind = (c, r) => {
    const ch = at(c, r);
    if (city.road(c, r)) return 'route';
    if (ch === '~') return 'eau';
    if (ch === 'p' || ch === 'f') return 'parc';
    return 'bloc';
  };
  const inZone = (z, c, r) => c >= z[0] && c <= z[2] && r >= z[1] && r <= z[3];
  const lieux = Object.entries(level.lieux || {}).map(([ch, l]) => {
    const node = city.nodes.find((n) => n.ch === ch);
    return { ch, ...l, ...LIEUX[l.type], node, zone: l.zone };
  });
  const decorZones = (level.decor || []).map((d) => ({ ...d }));
  const taken = (c, r) => lieux.some((l) => inZone(l.zone, c, r)) || decorZones.some((d) => inZone(d.zone, c, r));
  /* les places de parking de chaque lieu : la rangée du lieu qui touche son entrée */
  for (const l of lieux) {
    const [c0, r0, c1, r1] = l.zone;
    const n = l.node;
    let side = 'haut';
    if (n.r === r1 + 1) side = 'bas';
    else if (n.c === c0 - 1) side = 'gauche';
    else if (n.c === c1 + 1) side = 'droite';
    l.side = side;
    l.places = [];
    if (side === 'haut' || side === 'bas') {
      const r = side === 'haut' ? r0 : r1;
      const cols = [];
      for (let c = c0; c <= c1; c++) cols.push(c);
      cols.sort((a, b) => Math.abs(a - n.c) - Math.abs(b - n.c) || a - b);
      for (const c of cols) {
        for (const k of [0, 1]) {
          const x = c * TILE + 12 + k * 24;
          const y = r * TILE + (side === 'haut' ? 25 : 23);
          l.places.push({ x, y, a: side === 'haut' ? Math.PI / 2 : -Math.PI / 2 });
        }
      }
      l.places.sort((p, q) => Math.abs(p.x - n.x) - Math.abs(q.x - n.x));
      l.lot = side === 'haut' ? [c0 * TILE, r0 * TILE + SIDEWALK, (c1 - c0 + 1) * TILE, TILE - SIDEWALK - 2]
        : [c0 * TILE, r1 * TILE + 2, (c1 - c0 + 1) * TILE, TILE - SIDEWALK - 2];
      l.bat = side === 'haut' ? [c0 * TILE, (r0 + 1) * TILE, (c1 - c0 + 1) * TILE, (r1 - r0) * TILE]
        : [c0 * TILE, r0 * TILE, (c1 - c0 + 1) * TILE, (r1 - r0) * TILE];
    } else {
      l.places = [{ x: n.x, y: n.y, a: 0 }];
      l.lot = [c0 * TILE, r0 * TILE, TILE, (r1 - r0 + 1) * TILE];
      l.bat = [(c0 + 1) * TILE, r0 * TILE, (c1 - c0) * TILE, (r1 - r0 + 1) * TILE];
    }
  }
  /* les bâtiments ordinaires, carreau par carreau */
  const lots = [];
  const used = new Set();
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (kind(c, r) !== 'bloc' || taken(c, r) || used.has(`${c},${r}`)) continue;
      const roadSides = ['n', 's', 'e', 'o'].filter((s) => {
        const [dx, dy] = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] }[s];
        return city.road(c + dx, r + dy);
      });
      const blind = [[-1, -1], [1, -1], [-1, 1], [1, 1]].some(([dx, dy]) => at(c + dx, r + dy) === 'x');
      let type;
      const x = R();
      if (blind) type = 'haie';
      else if (!roadSides.length) type = x < 0.55 ? 'jardin' : 'maison';
      else if (x < 0.42) type = 'maison';
      else if (x < 0.66) type = 'immeuble';
      else if (x < 0.82) type = 'boutique';
      else type = 'jardin';
      let w = 1;
      /* un grand immeuble sur deux carreaux */
      if (type === 'immeuble' && kind(c + 1, r) === 'bloc' && !taken(c + 1, r) && R() < 0.5
        && ![[0, -1], [2, -1], [0, 1], [2, 1]].some(([dx, dy]) => at(c + dx, r + dy) === 'x')) {
        w = 2;
        used.add(`${c + 1},${r}`);
      }
      used.add(`${c},${r}`);
      lots.push({
        c, r, w, type, roadSides, seed: Math.floor(R() * 1e9),
        roof: ROOFS[Math.floor(R() * ROOFS.length)], wall: WALLS[Math.floor(R() * WALLS.length)],
        awning: AWNINGS[Math.floor(R() * AWNINGS.length)],
      });
    }
  }
  /* les arbres du parc et des jardins */
  const trees = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (at(c, r) !== 'p') continue;
      if (R() < 0.55) trees.push({ x: c * TILE + 10 + R() * 28, y: r * TILE + 10 + R() * 28, s: 0.8 + R() * 0.5, hue: R() });
    }
  }
  for (const lot of lots) {
    if (lot.type !== 'jardin') continue;
    const n = 1 + Math.floor(R() * 2);
    for (let i = 0; i < n; i++) trees.push({ x: lot.c * TILE + 14 + R() * 20, y: lot.r * TILE + 14 + R() * 20, s: 0.7 + R() * 0.4, hue: R() });
  }
  /* la fontaine */
  const fontaines = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (at(c, r) === 'f') fontaines.push({ x: c * TILE + HALF, y: r * TILE + HALF });
  /* les passants : ils font le tour des pâtés de maisons sur le trottoir */
  const loops = [];
  const seenB = new Set();
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const k = kind(c, r);
      if (k === 'route' || k === 'eau' || seenB.has(`${c},${r}`)) continue;
      /* le pâté : tous les carreaux qui ne sont ni route ni eau, reliés entre eux */
      const stack = [[c, r]];
      let mc = c, Mc = c, mr = r, Mr = r;
      seenB.add(`${c},${r}`);
      while (stack.length) {
        const [a, b] = stack.pop();
        mc = Math.min(mc, a); Mc = Math.max(Mc, a); mr = Math.min(mr, b); Mr = Math.max(Mr, b);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const na = a + dx, nb = b + dy;
          if (na < 0 || nb < 0 || na >= W || nb >= H || seenB.has(`${na},${nb}`)) continue;
          const kk = kind(na, nb);
          if (kk === 'route' || kk === 'eau') continue;
          seenB.add(`${na},${nb}`);
          stack.push([na, nb]);
        }
      }
      const x0 = mc * TILE + 3.5, y0 = mr * TILE + 3.5, x1 = (Mc + 1) * TILE - 3.5, y1 = (Mr + 1) * TILE - 3.5;
      if (x1 - x0 > 60 && y1 - y0 > 60) loops.push([x0, y0, x1, y1]);
    }
  }
  const SKIN = ['#F5CFA6', '#E8B48A', '#C98B5E', '#8D5A3B', '#F9DCC0'];
  const peds = [];
  loops.forEach((lp, i) => {
    const per = 2 * (lp[2] - lp[0] + lp[3] - lp[1]);
    const n = per > 500 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      peds.push({ loop: lp, per, u: R() * per, v: (8 + R() * 8) * (R() < 0.5 ? 1 : -1), skin: SKIN[Math.floor(R() * SKIN.length)],
        shirt: ['#E85D75', '#3FA7E0', '#FFC53D', '#5BC46A', '#9C6ADE', '#F28C38'][Math.floor(R() * 6)], dog: R() < 0.2, id: i * 3 + k });
    }
  });
  /* les nuages qui passent (leur ombre) */
  const clouds = [];
  for (let i = 0; i < 4; i++) clouds.push({ x: R() * W * TILE, y: R() * H * TILE, s: 0.7 + R() * 0.8, v: 6 + R() * 6 });
  /* les joueurs du stade et les nageurs de la piscine */
  const extras = [];
  for (const d of decorZones) {
    if (d.type === 'stade') for (let i = 0; i < 8; i++) extras.push({ type: 'joueur', zone: d.zone, team: i % 2, ph: R() * 10, sp: 0.3 + R() * 0.4 });
  }
  for (const l of lieux) {
    if (l.type === 'piscine') for (let i = 0; i < 4; i++) extras.push({ type: 'nageur', lieu: l, lane: i, ph: R() * 10, sp: 0.15 + R() * 0.1 });
  }
  return { W, H, kind, at, city, lots, trees, lieux, decorZones, fontaines, peds, clouds, extras, level };
}

/* ========================================================================
   LE DESSIN QUI NE BOUGE PAS (une seule fois par niveau)
   ======================================================================== */
export function drawCityStatic(c, M) {
  const { W, H, kind, at, city } = M;
  const R = rng(99);
  /* l'herbe */
  c.fillStyle = '#93D483';
  c.fillRect(0, 0, W * TILE, H * TILE);
  for (let i = 0; i < W * H * 2; i++) {
    c.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(40,110,50,0.08)';
    c.beginPath();
    c.ellipse(R() * W * TILE, R() * H * TILE, 6 + R() * 14, 4 + R() * 8, R() * 3, 0, TAU);
    c.fill();
  }
  /* la rivière */
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      if (kind(cc, r) !== 'eau' && !(city.road(cc, r) && (at(cc, r - 1) === '~' || at(cc, r + 1) === '~'))) continue;
      const x = cc * TILE, y = r * TILE;
      c.fillStyle = '#6FC0A0';
      c.fillRect(x, y, TILE, TILE);
      c.fillStyle = '#3EA6DD';
      c.fillRect(x + 6, y, TILE - 12, TILE);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.fillRect(x + 6, y, 4, TILE);
      c.fillStyle = 'rgba(20,60,120,0.15)';
      c.fillRect(x + TILE - 12, y, 6, TILE);
      /* des roseaux sur la rive */
      for (let k = 0; k < 3; k++) {
        const side = R() < 0.5 ? x + 3 : x + TILE - 3;
        const yy = y + R() * TILE;
        c.strokeStyle = '#3E8E4E';
        c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(side, yy); c.lineTo(side + (R() - 0.5) * 4, yy - 6); c.stroke();
      }
    }
  }
  /* le parc */
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      if (kind(cc, r) !== 'parc') continue;
      c.fillStyle = '#7FCB6E';
      c.fillRect(cc * TILE, r * TILE, TILE, TILE);
    }
  }
  drawParkPaths(c, M);
  /* les trottoirs, le long des routes */
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      const k = kind(cc, r);
      if (k === 'route' || k === 'eau') continue;
      const x = cc * TILE, y = r * TILE;
      c.fillStyle = '#E4DED3';
      if (city.road(cc, r - 1)) c.fillRect(x, y, TILE, SIDEWALK);
      if (city.road(cc, r + 1)) c.fillRect(x, y + TILE - SIDEWALK, TILE, SIDEWALK);
      if (city.road(cc - 1, r)) c.fillRect(x, y, SIDEWALK, TILE);
      if (city.road(cc + 1, r)) c.fillRect(x + TILE - SIDEWALK, y, SIDEWALK, TILE);
      /* le coin du trottoir, au bord d'un carrefour */
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        if (city.road(cc + dx, r + dy) && !city.road(cc + dx, r) && !city.road(cc, r + dy)) {
          c.fillRect(dx < 0 ? x : x + TILE - SIDEWALK, dy < 0 ? y : y + TILE - SIDEWALK, SIDEWALK, SIDEWALK);
        }
      }
    }
  }
  /* les dalles du trottoir */
  c.strokeStyle = 'rgba(120,110,95,0.25)';
  c.lineWidth = 0.8;
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      const k = kind(cc, r);
      if (k === 'route' || k === 'eau') continue;
      const x = cc * TILE, y = r * TILE;
      c.beginPath();
      if (city.road(cc, r - 1) || city.road(cc, r + 1)) {
        const yy = city.road(cc, r - 1) ? y : y + TILE - SIDEWALK;
        for (let k2 = 0; k2 <= TILE; k2 += 12) { c.moveTo(x + k2, yy); c.lineTo(x + k2, yy + SIDEWALK); }
        c.moveTo(x, city.road(cc, r - 1) ? y + SIDEWALK : yy); c.lineTo(x + TILE, city.road(cc, r - 1) ? y + SIDEWALK : yy);
      }
      if (city.road(cc - 1, r) || city.road(cc + 1, r)) {
        const xx = city.road(cc - 1, r) ? x : x + TILE - SIDEWALK;
        for (let k2 = 0; k2 <= TILE; k2 += 12) { c.moveTo(xx, y + k2); c.lineTo(xx + SIDEWALK, y + k2); }
        c.moveTo(city.road(cc - 1, r) ? x + SIDEWALK : xx, y); c.lineTo(city.road(cc - 1, r) ? x + SIDEWALK : xx, y + TILE);
      }
      c.stroke();
    }
  }
  /* les routes */
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      if (!city.road(cc, r)) continue;
      c.fillStyle = '#5B6070';
      c.fillRect(cc * TILE, r * TILE, TILE, TILE);
    }
  }
  /* le grain du goudron */
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      if (!city.road(cc, r)) continue;
      for (let i = 0; i < 10; i++) {
        c.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
        c.fillRect(cc * TILE + R() * TILE, r * TILE + R() * TILE, 2, 2);
      }
    }
  }
  /* la bordure du trottoir (le petit rebord) */
  c.strokeStyle = '#A9A297';
  c.lineWidth = 1.5;
  c.beginPath();
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      if (!city.road(cc, r)) continue;
      const x = cc * TILE, y = r * TILE;
      const side = (dc, dr) => { const k = kind(cc + dc, r + dr); return cc + dc >= 0 && r + dr >= 0 && cc + dc < W && r + dr < H && k !== 'route' && k !== 'eau'; };
      if (side(0, -1)) { c.moveTo(x, y); c.lineTo(x + TILE, y); }
      if (side(0, 1)) { c.moveTo(x, y + TILE); c.lineTo(x + TILE, y + TILE); }
      if (side(-1, 0)) { c.moveTo(x, y); c.lineTo(x, y + TILE); }
      if (side(1, 0)) { c.moveTo(x + TILE, y); c.lineTo(x + TILE, y + TILE); }
    }
  }
  c.stroke();
  /* les ponts : un parapet de chaque côté */
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      if (!city.road(cc, r)) continue;
      const x = cc * TILE, y = r * TILE;
      if (at(cc, r - 1) === '~') drawParapet(c, x - 4, y - 5, TILE + 8, 6);
      if (at(cc, r + 1) === '~') drawParapet(c, x - 4, y + TILE - 1, TILE + 8, 6);
    }
  }
  /* la ligne blanche du milieu, en tirets */
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = 2;
  c.setLineDash([9, 9]);
  for (const sg of city.segments) {
    const pts = sg.tiles.map(([tc, tr]) => [tc * TILE + HALF, tr * TILE + HALF]);
    const a = pts[0], b = pts[pts.length - 1];
    const da = [Math.sign(pts[1][0] - a[0]), Math.sign(pts[1][1] - a[1])];
    const db = [Math.sign(pts[pts.length - 2][0] - b[0]), Math.sign(pts[pts.length - 2][1] - b[1])];
    const cutA = sg.a.kind === 'carrefour' ? HALF + 2 : (sg.a.kind === 'depart' ? -HALF : 0);
    const cutB = sg.b.kind === 'carrefour' ? HALF + 2 : (sg.b.kind === 'depart' ? -HALF : 0);
    c.beginPath();
    c.moveTo(a[0] + da[0] * cutA, a[1] + da[1] * cutA);
    for (let i = 1; i < pts.length - 1; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.lineTo(b[0] + db[0] * cutB, b[1] + db[1] * cutB);
    c.stroke();
  }
  c.setLineDash([]);
  /* les lieux et le décor spécial */
  for (const d of M.decorZones) if (d.type === 'stade') drawStadium(c, d.zone);
  for (const l of M.lieux) drawLieu(c, l, R);
  /* les bâtiments */
  for (const lot of M.lots) drawLot(c, lot, M);
  /* la fontaine (le bassin) */
  for (const f of M.fontaines) drawFountainBase(c, f.x, f.y);
  /* les arbres */
  for (const t of M.trees) drawTree(c, t.x, t.y, t.s, t.hue);
  /* le bout des routes d'entrée : un panneau de direction bleu */
  for (const n of city.nodes) {
    if (n.kind !== 'depart') continue;
    const name = (M.level.entrees && M.level.entrees[n.ch] && M.level.entrees[n.ch].nom) || '';
    drawDirectionSign(c, n, name, city);
  }
}

function drawParapet(c, x, y, w, h) {
  c.fillStyle = '#C9C1B4';
  rrect(c, x, y, w, h, 2);
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 1.2;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.fillRect(x + 2, y + 1, w - 4, 1.5);
}

function drawParkPaths(c, M) {
  const { W, H, at } = M;
  /* une allée en croix au milieu du parc, autour de la fontaine */
  for (const f of M.fontaines) {
    let x0 = f.x, x1 = f.x, y0 = f.y, y1 = f.y;
    const tc = Math.floor(f.x / TILE), tr = Math.floor(f.y / TILE);
    let k = tc; while (k > 0 && (at(k - 1, tr) === 'p' || at(k - 1, tr) === 'f')) k--; x0 = k * TILE;
    k = tc; while (k < W - 1 && (at(k + 1, tr) === 'p' || at(k + 1, tr) === 'f')) k++; x1 = (k + 1) * TILE;
    k = tr; while (k > 0 && (at(tc, k - 1) === 'p' || at(tc, k - 1) === 'f')) k--; y0 = k * TILE;
    k = tr; while (k < H - 1 && (at(tc, k + 1) === 'p' || at(tc, k + 1) === 'f')) k++; y1 = (k + 1) * TILE;
    c.fillStyle = '#EAD9B0';
    c.fillRect(x0, f.y - 7, x1 - x0, 14);
    c.fillRect(f.x - 7, y0, 14, y1 - y0);
    c.beginPath(); c.arc(f.x, f.y, 34, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(160,130,80,0.35)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(f.x, f.y, 34, 0, TAU); c.stroke();
    /* des massifs de fleurs */
    const R = rng(7);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cx = f.x + dx * 62, cy = f.y + dy * 30;
      c.fillStyle = '#6A4A2E';
      c.beginPath(); c.ellipse(cx, cy, 20, 11, 0, 0, TAU); c.fill();
      for (let i = 0; i < 14; i++) {
        c.fillStyle = ['#FF6F91', '#FFC53D', '#FFFFFF', '#B57BFF'][i % 4];
        c.beginPath(); c.arc(cx + (R() - 0.5) * 32, cy + (R() - 0.5) * 16, 2.4, 0, TAU); c.fill();
      }
    }
    /* deux bancs */
    for (const dx of [-1, 1]) {
      c.fillStyle = '#9A6B3F';
      rrect(c, f.x + dx * 46 - 9, f.y - 16, 18, 5, 1.5); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    }
  }
}

function drawTree(c, x, y, s, hue) {
  const greens = hue < 0.33 ? ['#3E9B55', '#5DBB63', '#8FDC7A'] : hue < 0.66 ? ['#2F8A5A', '#4FAE6E', '#86D492'] : ['#4E9A3A', '#74BE4C', '#A6DE6A'];
  const blobs = [[0, 0, 11], [-7, 3, 8], [6, 4, 8], [2, -6, 8]];
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = 'rgba(30,50,30,0.25)';
  c.beginPath(); c.ellipse(5, 6, 14, 11, 0, 0, TAU); c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 3;
  for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br, 0, TAU); c.stroke(); }
  c.fillStyle = greens[1];
  for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); }
  c.fillStyle = greens[0];
  c.beginPath(); c.arc(3, 4, 7, 0, TAU); c.fill();
  c.fillStyle = greens[2];
  c.beginPath(); c.arc(-3, -4, 5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.arc(-5, -6, 2, 0, TAU); c.fill();
  c.restore();
}

/* une maison, un immeuble, une boutique, un jardin ou une haie */
function drawLot(c, lot, M) {
  const R = rng(lot.seed);
  const pad = SIDEWALK + 3;
  const near = (s) => lot.roadSides.includes(s);
  const x = lot.c * TILE + (near('o') ? pad : 4);
  const y = lot.r * TILE + (near('n') ? pad : 4);
  const w = lot.w * TILE - (near('o') ? pad : 4) - (near('e') ? pad : 4);
  const h = TILE - (near('n') ? pad : 4) - (near('s') ? pad : 4);
  if (lot.type === 'haie') { drawHedge(c, lot, M); return; }
  if (lot.type === 'jardin') {
    c.fillStyle = '#86CC72';
    rrect(c, x, y, w, h, 4); c.fill();
    /* une petite clôture blanche */
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 1.5;
    c.setLineDash([3, 2]);
    rrect(c, x + 1, y + 1, w - 2, h - 2, 4); c.stroke();
    c.setLineDash([]);
    const k = R();
    if (k < 0.35) {
      /* une petite piscine */
      c.fillStyle = '#62CFF2';
      rrect(c, x + w * 0.2, y + h * 0.5, w * 0.45, h * 0.32, 4); c.fill();
      c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.stroke();
    } else if (k < 0.65) {
      /* un trampoline */
      c.fillStyle = '#2E2A4D';
      c.beginPath(); c.arc(x + w * 0.66, y + h * 0.66, 8, 0, TAU); c.fill();
      c.strokeStyle = '#3FA7E0'; c.lineWidth = 2.5; c.stroke();
    } else {
      /* le potager */
      for (let i = 0; i < 3; i++) {
        c.fillStyle = '#8A5A34';
        c.fillRect(x + 6, y + h * 0.45 + i * 6, w * 0.55, 3.5);
        c.fillStyle = '#5DBB63';
        for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x + 9 + j * 6, y + h * 0.45 + i * 6 + 1.5, 1.8, 0, TAU); c.fill(); }
      }
    }
    return;
  }
  /* l'ombre portée (le soleil est en haut à gauche) */
  c.fillStyle = 'rgba(30,30,50,0.28)';
  rrect(c, x + 4, y + 4, w, h, 3); c.fill();
  if (lot.type === 'maison') {
    const horiz = w >= h;
    c.fillStyle = lot.roof;
    rrect(c, x, y, w, h, 2); c.fill();
    /* les deux pans du toit : un clair (au soleil), un foncé */
    c.fillStyle = shade(lot.roof, 0.18);
    if (horiz) c.fillRect(x, y, w, h / 2); else c.fillRect(x, y, w / 2, h);
    /* les tuiles */
    c.strokeStyle = 'rgba(0,0,0,0.13)';
    c.lineWidth = 1;
    c.beginPath();
    if (horiz) for (let yy = y + 4; yy < y + h; yy += 4) { c.moveTo(x, yy); c.lineTo(x + w, yy); }
    else for (let xx = x + 4; xx < x + w; xx += 4) { c.moveTo(xx, y); c.lineTo(xx, y + h); }
    c.stroke();
    c.strokeStyle = shade(lot.roof, -0.35);
    c.lineWidth = 2;
    c.beginPath();
    if (horiz) { c.moveTo(x + 2, y + h / 2); c.lineTo(x + w - 2, y + h / 2); } else { c.moveTo(x + w / 2, y + 2); c.lineTo(x + w / 2, y + h - 2); }
    c.stroke();
    c.strokeStyle = INK;
    c.lineWidth = 1.6;
    rrect(c, x, y, w, h, 2); c.stroke();
    /* la cheminée */
    const cx = x + w * (0.25 + R() * 0.5), cy = y + h * (horiz ? 0.22 : 0.3);
    c.fillStyle = '#9C8A7A';
    c.fillRect(cx - 3, cy - 3, 6, 6);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(cx - 3, cy - 3, 6, 6);
    c.fillStyle = '#3A3340'; c.fillRect(cx - 1.5, cy - 1.5, 3, 3);
    /* une fenêtre de toit */
    if (R() < 0.6) {
      c.fillStyle = '#9ED8F5';
      c.fillRect(x + w * 0.62, y + h * (horiz ? 0.62 : 0.6), 6, 5);
      c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x + w * 0.62, y + h * (horiz ? 0.62 : 0.6), 6, 5);
    }
  } else if (lot.type === 'immeuble' || lot.type === 'boutique') {
    const roof = lot.type === 'immeuble' ? '#CFC9C0' : shade(lot.awning[0], 0.55);
    c.fillStyle = roof;
    rrect(c, x, y, w, h, 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    /* le petit muret du toit */
    c.strokeStyle = shade(roof === '#CFC9C0' ? '#CFC9C0' : lot.awning[0], -0.25);
    c.lineWidth = 2;
    rrect(c, x + 3, y + 3, w - 6, h - 6, 1.5); c.stroke();
    /* des gravillons */
    for (let i = 0; i < w * h / 30; i++) {
      c.fillStyle = 'rgba(0,0,0,0.08)';
      c.fillRect(x + 4 + R() * (w - 8), y + 4 + R() * (h - 8), 1.5, 1.5);
    }
    if (lot.type === 'immeuble') {
      const k = R();
      if (k < 0.4) {
        /* des panneaux solaires */
        for (let i = 0; i < Math.floor((w - 12) / 9); i++) {
          c.fillStyle = '#2F4F8F';
          c.fillRect(x + 6 + i * 9, y + 7, 7, 10);
          c.strokeStyle = '#9EC3FF'; c.lineWidth = 0.6;
          c.strokeRect(x + 6 + i * 9, y + 7, 7, 10);
        }
      } else if (k < 0.7) {
        /* un toit jardin */
        c.fillStyle = '#7FCB6E';
        rrect(c, x + 6, y + 6, w * 0.5, h * 0.45, 3); c.fill();
        c.fillStyle = '#4FAE6E';
        c.beginPath(); c.arc(x + 10, y + 10, 3, 0, TAU); c.arc(x + 16, y + 13, 2.5, 0, TAU); c.fill();
      }
      /* la climatisation */
      const ax = x + w - 16, ay = y + h - 15;
      c.fillStyle = '#E9E6E0';
      c.fillRect(ax, ay, 10, 9);
      c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(ax, ay, 10, 9);
      c.beginPath(); c.arc(ax + 5, ay + 4.5, 3, 0, TAU); c.stroke();
    }
    /* le store rayé de la boutique, côté rue */
    if (lot.type === 'boutique' && lot.roadSides.length) {
      const s = lot.roadSides[0];
      const [ca, cb] = lot.awning;
      const deep = 7;
      let ax, ay, aw, ah;
      if (s === 'n') { ax = x; ay = y - 2; aw = w; ah = deep; }
      else if (s === 's') { ax = x; ay = y + h - deep + 2; aw = w; ah = deep; }
      else if (s === 'o') { ax = x - 2; ay = y; aw = deep; ah = h; }
      else { ax = x + w - deep + 2; ay = y; aw = deep; ah = h; }
      const n = Math.max(3, Math.round((aw > ah ? aw : ah) / 5));
      for (let i = 0; i < n; i++) {
        c.fillStyle = i % 2 ? cb : ca;
        if (aw > ah) c.fillRect(ax + (aw / n) * i, ay, aw / n + 0.5, ah);
        else c.fillRect(ax, ay + (ah / n) * i, aw, ah / n + 0.5);
      }
      c.strokeStyle = INK; c.lineWidth = 1.3; c.strokeRect(ax, ay, aw, ah);
    }
  }
}

/* les hautes haies qui cachent un carrefour */
function drawHedge(c, lot, M) {
  const x = lot.c * TILE, y = lot.r * TILE;
  const R = rng(lot.seed);
  c.fillStyle = 'rgba(20,50,20,0.3)';
  c.fillRect(x + 6, y + 6, TILE - 4, TILE - 4);
  c.strokeStyle = INK;
  c.lineWidth = 3;
  const blobs = [];
  for (let i = 0; i < 9; i++) blobs.push([x + 6 + (i % 3) * 18 + R() * 4, y + 6 + Math.floor(i / 3) * 18 + R() * 4, 9 + R() * 3]);
  for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br, 0, TAU); c.stroke(); }
  for (const [bx, by, br] of blobs) { c.fillStyle = '#2E7D46'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); }
  for (const [bx, by, br] of blobs) { c.fillStyle = '#46A05C'; c.beginPath(); c.arc(bx - 2, by - 2, br * 0.6, 0, TAU); c.fill(); }
  for (let i = 0; i < 10; i++) {
    c.fillStyle = 'rgba(200,255,180,0.35)';
    c.beginPath(); c.arc(x + 4 + R() * 40, y + 4 + R() * 40, 1.5, 0, TAU); c.fill();
  }
}

function drawStadium(c, z) {
  const x = z[0] * TILE + 4, y = z[1] * TILE + 4;
  const w = (z[2] - z[0] + 1) * TILE - 8, h = (z[3] - z[1] + 1) * TILE - 8;
  c.fillStyle = 'rgba(30,30,50,0.25)';
  rrect(c, x + 4, y + 4, w, h, 18); c.fill();
  /* les tribunes */
  c.fillStyle = '#8A8FA3';
  rrect(c, x, y, w, h, 18); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  const R = rng(5);
  const seatCols = ['#F2555A', '#FFC53D', '#36B8E8', '#FFFFFF', '#5BC46A'];
  for (let i = 0; i < 160; i++) {
    const t = R();
    let sx, sy;
    if (t < 0.5) { sx = x + 10 + R() * (w - 20); sy = R() < 0.5 ? y + 4 + R() * 8 : y + h - 12 + R() * 8; }
    else { sy = y + 10 + R() * (h - 20); sx = R() < 0.5 ? x + 4 + R() * 8 : x + w - 12 + R() * 8; }
    c.fillStyle = seatCols[Math.floor(R() * seatCols.length)];
    c.fillRect(sx, sy, 2.4, 2.4);
  }
  /* la pelouse rayée */
  const px = x + 16, py = y + 16, pw = w - 32, ph = h - 32;
  for (let i = 0; i < 10; i++) {
    c.fillStyle = i % 2 ? '#5DBB55' : '#6CC862';
    c.fillRect(px + (pw / 10) * i, py, pw / 10 + 0.5, ph);
  }
  c.strokeStyle = '#FFFFFF';
  c.lineWidth = 1.6;
  c.strokeRect(px + 4, py + 4, pw - 8, ph - 8);
  c.beginPath();
  c.moveTo(px + pw / 2, py + 4); c.lineTo(px + pw / 2, py + ph - 4);
  c.moveTo(px + pw / 2 + 14, py + ph / 2); c.arc(px + pw / 2, py + ph / 2, 14, 0, TAU);
  c.stroke();
  c.strokeRect(px + 4, py + ph / 2 - 18, 18, 36);
  c.strokeRect(px + pw - 22, py + ph / 2 - 18, 18, 36);
  /* les buts */
  c.fillStyle = '#FFFFFF';
  c.fillRect(px + 1, py + ph / 2 - 8, 3, 16);
  c.fillRect(px + pw - 4, py + ph / 2 - 8, 3, 16);
}

/* un lieu d'arrivée : son parking, son bâtiment et ses détails */
function drawLieu(c, l, R) {
  const [lx, ly, lw, lh] = l.lot;
  /* le parking */
  c.fillStyle = '#7D8294';
  rrect(c, lx + 3, ly, lw - 6, lh, 4); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = l.couleur;
  c.fillRect(lx + 3, l.side === 'haut' ? ly + lh - 4 : ly, lw - 6, 4);
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = 1.4;
  c.beginPath();
  for (const p of l.places) {
    c.moveTo(p.x - 12, ly + 3); c.lineTo(p.x - 12, ly + lh - 6);
    c.moveTo(p.x + 12, ly + 3); c.lineTo(p.x + 12, ly + lh - 6);
  }
  c.stroke();
  const [bx, by, bw, bh] = l.bat;
  c.save();
  if (l.type === 'ecole') drawEcole(c, bx, by, bw, bh, l);
  else if (l.type === 'hopital') drawHopital(c, bx, by, bw, bh, l);
  else if (l.type === 'boulangerie') drawBoulangerie(c, bx, by, bw, bh, l);
  else if (l.type === 'piscine') drawPiscine(c, bx, by, bw, bh, l);
  c.restore();
}

function building(c, x, y, w, h, roof, line = INK) {
  c.fillStyle = 'rgba(30,30,50,0.28)';
  rrect(c, x + 5, y + 5, w, h, 4); c.fill();
  c.fillStyle = roof;
  rrect(c, x, y, w, h, 4); c.fill();
  c.strokeStyle = line; c.lineWidth = 2; c.stroke();
  c.strokeStyle = 'rgba(0,0,0,0.15)';
  c.lineWidth = 2;
  rrect(c, x + 4, y + 4, w - 8, h - 8, 2); c.stroke();
}

function drawEcole(c, x, y, w, h, l) {
  /* la cour de récréation */
  c.fillStyle = '#D9CDB8';
  rrect(c, x + 3, y + 2, w - 6, h - 6, 6); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  /* la marelle */
  c.strokeStyle = '#FFFFFF';
  c.lineWidth = 1.2;
  const mx = x + w * 0.62, my = y + 10;
  for (let i = 0; i < 5; i++) c.strokeRect(mx + i * 9, my, 9, 9);
  c.strokeRect(mx + 9, my + 9, 9, 9);
  c.strokeRect(mx + 27, my + 9, 9, 9);
  c.fillStyle = '#FF6F91';
  c.font = 'bold 6px sans-serif';
  c.fillText('1 2 3', mx + 2, my + 7);
  /* le bâtiment */
  building(c, x + 6, y + h * 0.42, w * 0.62, h * 0.5, '#F2A23A');
  c.fillStyle = '#FFFFFF';
  c.font = `800 ${Math.round(h * 0.2)}px "Baloo 2", sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('ÉCOLE', x + 6 + w * 0.31, y + h * 0.42 + h * 0.25);
  /* le drapeau */
  const fx = x + w * 0.66, fy = y + h - 22;
  c.fillStyle = '#0055A4'; c.fillRect(fx, fy, 5, 9);
  c.fillStyle = '#FFFFFF'; c.fillRect(fx + 5, fy, 5, 9);
  c.fillStyle = '#EF4135'; c.fillRect(fx + 10, fy, 5, 9);
  c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(fx, fy, 15, 9);
  drawTree(c, x + w * 0.7, y + 30, 0.8, 0.2);
}

function drawHopital(c, x, y, w, h) {
  c.fillStyle = '#A5D99A';
  rrect(c, x + 3, y + 2, w - 6, h - 6, 6); c.fill();
  building(c, x + 8, y + 6, w - 16, h - 18, '#EEF2F7');
  /* la grande croix rouge */
  const cx = x + w * 0.36, cy = y + h * 0.45, s = Math.min(w, h) * 0.16;
  c.fillStyle = '#F2555A';
  c.fillRect(cx - s, cy - s / 3, s * 2, s * 0.66);
  c.fillRect(cx - s / 3, cy - s, s * 0.66, s * 2);
  /* l'hélistation */
  const hx = x + w * 0.58, hy = y + h * 0.45;
  c.fillStyle = '#5B6070';
  c.beginPath(); c.arc(hx, hy, 15, 0, TAU); c.fill();
  c.strokeStyle = '#FFC53D'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#FFFFFF';
  c.font = '800 16px "Baloo 2", sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('H', hx, hy + 1);
}

function drawBoulangerie(c, x, y, w, h, l) {
  c.fillStyle = '#E8DCC6';
  rrect(c, x + 3, y + 2, w - 6, h - 6, 6); c.fill();
  /* la terrasse : tables et parasols */
  for (let i = 0; i < 3; i++) {
    const tx = x + 18 + i * 30, ty = y + 16;
    for (let k = 0; k < 8; k++) {
      c.fillStyle = k % 2 ? '#FFFFFF' : '#F28C38';
      c.beginPath(); c.moveTo(tx, ty); c.arc(tx, ty, 10, (k / 8) * TAU, ((k + 1) / 8) * TAU); c.closePath(); c.fill();
    }
    c.strokeStyle = INK; c.lineWidth = 1.2;
    c.beginPath(); c.arc(tx, ty, 10, 0, TAU); c.stroke();
  }
  building(c, x + 8, y + h * 0.42, w - 16, h * 0.5, '#B86B3E');
  /* le store et la baguette géante */
  const ay = y + h * 0.42 - 6;
  for (let i = 0; i < 14; i++) {
    c.fillStyle = i % 2 ? '#FFFFFF' : '#F28C38';
    c.fillRect(x + 8 + ((w - 16) / 14) * i, ay, (w - 16) / 14 + 0.5, 8);
  }
  c.strokeStyle = INK; c.lineWidth = 1.3; c.strokeRect(x + 8, ay, w - 16, 8);
  c.save();
  c.translate(x + w * 0.4, y + h * 0.7);
  c.rotate(-0.15);
  c.fillStyle = '#E8B05A';
  rrect(c, -26, -5, 52, 10, 5); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  c.strokeStyle = '#B87A2A'; c.lineWidth = 1.5;
  for (let i = -18; i <= 18; i += 9) { c.beginPath(); c.moveTo(i - 3, -3); c.lineTo(i + 3, 3); c.stroke(); }
  c.restore();
}

function drawPiscine(c, x, y, w, h, l) {
  /* les dalles autour du bassin */
  c.fillStyle = '#F1E9DA';
  rrect(c, x + 3, y + 2, w - 6, h - 6, 6); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  const px = x + 12, py = y + 10, pw = w * 0.56, ph = h - 26;
  l.bassin = [px, py, pw, ph];
  c.fillStyle = '#3EC1F0';
  rrect(c, px, py, pw, ph, 4); c.fill();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.2;
  rrect(c, px - 1.5, py - 1.5, pw + 3, ph + 3, 5); c.stroke();
  /* les lignes d'eau */
  for (let i = 1; i < 4; i++) {
    const yy = py + (ph / 4) * i;
    for (let k = 0; k < pw; k += 6) {
      c.fillStyle = k % 12 ? '#FFFFFF' : '#F2555A';
      c.fillRect(px + k, yy - 1, 4, 2);
    }
  }
  /* les transats et un parasol */
  for (let i = 0; i < 3; i++) {
    c.fillStyle = ['#FFC53D', '#F2555A', '#5BC46A'][i];
    rrect(c, px + pw + 18, y + 14 + i * 16, 18, 8, 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  }
  /* le toboggan */
  c.strokeStyle = '#FF6F91';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px + pw + 6, py + ph - 4);
  c.quadraticCurveTo(px + pw + 18, py + ph / 2, px + pw - 4, py + ph / 2 + 4);
  c.stroke();
  c.lineCap = 'butt';
}

function drawFountainBase(c, x, y) {
  c.fillStyle = 'rgba(30,30,50,0.25)';
  c.beginPath(); c.arc(x + 3, y + 3, 22, 0, TAU); c.fill();
  c.fillStyle = '#C9C1B4';
  c.beginPath(); c.arc(x, y, 22, 0, TAU); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#5CC8F2';
  c.beginPath(); c.arc(x, y, 17, 0, TAU); c.fill();
  c.fillStyle = '#C9C1B4';
  c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
}

function drawDirectionSign(c, n, name, city) {
  /* le panneau bleu, sur le trottoir à côté de la route d'entrée */
  const d = n.arms[0];
  let x = n.x, y = n.y;
  const horiz = d === 'e' || d === 'o';
  if (horiz) y = n.y + HALF + 12; else x = n.x + HALF + 4;
  const label = name.toUpperCase();
  c.font = '800 8px "Baloo 2", sans-serif';
  const tw = c.measureText(label).width + 12;
  let bx = x - tw / 2;
  if (horiz) bx = n.c === 0 ? 2 : x + HALF - tw - 2;
  else bx = x;
  const by = horiz ? y - 6 : (n.r === 0 ? 3 : y + HALF - 16);
  c.fillStyle = '#2F6FD1';
  rrect(c, bx, by, tw, 13, 2.5); c.fill();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.2;
  rrect(c, bx + 1.5, by + 1.5, tw - 3, 10, 1.5); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1;
  rrect(c, bx, by, tw, 13, 2.5); c.stroke();
  c.fillStyle = '#FFFFFF';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(label, bx + tw / 2, by + 7);
}

/* ========================================================================
   CE QUI BOUGE
   ======================================================================== */
/* l'eau de la fontaine et ses gouttes */
export function drawFountainWater(c, x, y, t) {
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i / 3) % 1;
    c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`;
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(x, y, 6 + k * 11, 0, TAU); c.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + t * 0.8;
    const k = (t * 1.3 + i * 0.37) % 1;
    const r = 3 + k * 12;
    c.fillStyle = `rgba(220,245,255,${0.9 - k * 0.6})`;
    c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r - Math.sin(k * Math.PI) * 6, 1.6, 0, TAU); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath(); c.arc(x, y - 2, 2.5 + Math.sin(t * 9) * 0.6, 0, TAU); c.fill();
}

/* les reflets qui coulent sur la rivière */
export function drawRiverShine(c, M, t) {
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 1.4;
  c.beginPath();
  for (let r = 0; r < M.H; r++) {
    for (let cc = 0; cc < M.W; cc++) {
      if (M.at(cc, r) !== '~') continue;
      for (let k = 0; k < 2; k++) {
        const yy = r * TILE + ((t * 14 + k * 24 + cc * 7) % TILE);
        const xx = cc * TILE + 12 + k * 12 + Math.sin(t + r + k) * 3;
        c.moveTo(xx, yy); c.lineTo(xx + 5, yy);
      }
    }
  }
  c.stroke();
}

/* les petits personnages : passants, joueurs, nageurs */
export function drawPeds(c, M, t, dt) {
  for (const p of M.peds) {
    p.u = (p.u + p.v * dt + p.per) % p.per;
    const [x0, y0, x1, y1] = p.loop;
    const w = x1 - x0, h = y1 - y0;
    let u = p.u, x, y, a;
    if (u < w) { x = x0 + u; y = y0; a = 0; }
    else if ((u -= w) < h) { x = x1; y = y0 + u; a = Math.PI / 2; }
    else if ((u -= h) < w) { x = x1 - u; y = y1; a = Math.PI; }
    else { u -= w; x = x0; y = y1 - u; a = -Math.PI / 2; }
    if (p.v < 0) a += Math.PI;
    drawPerson(c, x, y, a, t + p.id, p);
  }
  for (const e of M.extras) {
    if (e.type === 'joueur') {
      const z = e.zone;
      const px = z[0] * TILE + 28, py = z[1] * TILE + 28;
      const pw = (z[2] - z[0] + 1) * TILE - 56, ph = (z[3] - z[1] + 1) * TILE - 56;
      const k = t * e.sp + e.ph;
      const x = px + pw * (0.5 + 0.42 * Math.sin(k * 0.9 + e.ph) * (e.team ? 1 : -1) * 0.8);
      const y = py + ph * (0.5 + 0.4 * Math.sin(k * 1.3 + e.ph * 2));
      c.fillStyle = e.team ? '#F2555A' : '#2F6FD1';
      c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    } else if (e.type === 'nageur' && e.lieu.bassin) {
      const [px, py, pw, ph] = e.lieu.bassin;
      const k = (t * e.sp + e.ph) % 2;
      const u = k < 1 ? k : 2 - k;
      const x = px + 6 + u * (pw - 12);
      const y = py + (ph / 4) * (e.lane + 0.5);
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath(); c.ellipse(x - (k < 1 ? 5 : -5), y, 5, 2, 0, 0, TAU); c.fill();
      c.fillStyle = ['#FFC53D', '#F2555A', '#5BC46A', '#9C6ADE'][e.lane];
      c.beginPath(); c.arc(x, y, 2.8, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
    }
  }
}
function drawPerson(c, x, y, a, t, p) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.scale(1.35, 1.35);
  const swing = Math.sin(t * 8) * 2.2;
  c.fillStyle = 'rgba(30,30,50,0.2)';
  c.beginPath(); c.ellipse(1.5, 1.5, 4, 3.4, 0, 0, TAU); c.fill();
  /* les bras qui se balancent */
  c.fillStyle = p.skin;
  c.beginPath(); c.arc(swing, -4, 1.4, 0, TAU); c.arc(-swing, 4, 1.4, 0, TAU); c.fill();
  c.fillStyle = p.shirt;
  c.beginPath(); c.ellipse(0, 0, 2.6, 4, 0, 0, TAU); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = p.skin;
  c.beginPath(); c.arc(0.4, 0, 2.2, 0, TAU); c.fill();
  c.stroke();
  if (p.dog) {
    c.fillStyle = '#B98552';
    c.beginPath(); c.ellipse(-8, 3, 3, 1.8, 0, 0, TAU); c.fill();
    c.stroke();
    c.strokeStyle = 'rgba(46,42,77,0.5)'; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(0, 2); c.lineTo(-6, 3); c.stroke();
  }
  c.restore();
}

/* les ombres des nuages qui glissent sur la ville */
export function drawCloudShadows(c, M, t) {
  const Wpx = M.W * TILE, Hpx = M.H * TILE;
  c.fillStyle = 'rgba(30,40,80,0.07)';
  for (const cl of M.clouds) {
    const x = ((cl.x + t * cl.v) % (Wpx + 300)) - 150;
    const y = cl.y;
    c.beginPath();
    c.ellipse(x, y, 70 * cl.s, 34 * cl.s, 0, 0, TAU);
    c.ellipse(x + 40 * cl.s, y + 10 * cl.s, 50 * cl.s, 28 * cl.s, 0, 0, TAU);
    c.ellipse(x - 44 * cl.s, y + 8 * cl.s, 40 * cl.s, 22 * cl.s, 0, 0, TAU);
    c.fill();
  }
  void Hpx;
}

/* ------------------------------------------------------------------------
   Les voitures. Vue de dessus, l'avant vers +x. Décapotables : on voit le
   conducteur, son visage et sa colère.
   ------------------------------------------------------------------------ */
const SKINS = ['#F5CFA6', '#E8B48A', '#C98B5E', '#8D5A3B', '#F9DCC0', '#D9A066'];
const HAIRS = ['#3A2A1E', '#7A4A22', '#E8C25A', '#2E2A4D', '#B5432E', '#9A9AA0', '#F2F2F2'];
const HATS = [null, null, 'casquette', null, 'chapeau', null, 'chignon', null, 'bonnet'];
export function carLook(i) {
  return {
    skin: SKINS[(i * 5 + 1) % SKINS.length],
    hair: HAIRS[(i * 3 + 2) % HAIRS.length],
    hat: HATS[(i * 7 + 3) % HATS.length],
    shape: ['berline', 'mini', 'camionnette', 'berline', 'mini', 'berline'][(i * 4 + 1) % 6],
    passager: i % 4 === 2 ? 'chien' : i % 5 === 3 ? 'enfant' : null,
  };
}

/* opts : { color, dark, look, mood (0..1), honk (0..1), blink ('gauche'|'droite'|null), brake, t, furieux, happy } */
export function drawCar(c, x, y, a, o) {
  o.a = a;
  const look = o.look;
  const L = look.shape === 'camionnette' ? 32 : look.shape === 'mini' ? 24 : 28;
  const Wd = look.shape === 'mini' ? 14 : 15;
  const hl = L / 2, hw = Wd / 2;
  c.save();
  c.translate(x, y);
  c.scale(1.12, 1.12);
  /* une voiture furieuse tremble */
  if (o.furieux && o.stopped) c.translate(Math.sin(o.t * 40) * 0.6, Math.cos(o.t * 33) * 0.5);
  c.rotate(a);
  /* l'ombre */
  c.fillStyle = 'rgba(20,20,40,0.3)';
  rrect(c, -hl + 2, -hw + 3, L, Wd, 5); c.fill();
  /* les roues */
  c.fillStyle = '#1E1B2E';
  for (const sx of [hl - 7, -hl + 7]) for (const sy of [-hw - 0.5, hw - 2.5]) { rrect(c, sx - 3.5, sy, 7, 3, 1.2); c.fill(); }
  /* la carrosserie */
  c.fillStyle = o.color;
  rrect(c, -hl, -hw, L, Wd, look.shape === 'mini' ? 6 : 4.5); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  /* le reflet du soleil */
  c.fillStyle = 'rgba(255,255,255,0.35)';
  rrect(c, -hl + 3, -hw + 1.5, L - 8, 2.5, 1.2); c.fill();
  if (look.shape === 'camionnette') {
    /* l'arrière fermé de la camionnette, avec ses barres de toit */
    c.fillStyle = shade(o.color, 0.25);
    rrect(c, -hl + 2, -hw + 2, L * 0.52, Wd - 4, 2); c.fill();
    c.strokeStyle = 'rgba(46,42,77,0.5)'; c.lineWidth = 1;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-hl + 5 + k * 5, -hw + 2.5); c.lineTo(-hl + 5 + k * 5, hw - 2.5); c.stroke(); }
  }
  /* le capot */
  c.strokeStyle = shade(o.color, -0.3);
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(hl - 3, -hw + 3); c.quadraticCurveTo(hl - 1, 0, hl - 3, hw - 3); c.stroke();
  /* les phares, les feux arrière (plus rouges quand on freine) */
  c.fillStyle = '#FFF4B8';
  c.beginPath(); c.arc(hl - 1.8, -hw + 2.6, 1.6, 0, TAU); c.arc(hl - 1.8, hw - 2.6, 1.6, 0, TAU); c.fill();
  c.fillStyle = o.brake ? '#FF2B2B' : '#B8303A';
  c.fillRect(-hl - 0.5, -hw + 1.5, 1.8, 3);
  c.fillRect(-hl - 0.5, hw - 4.5, 1.8, 3);
  if (o.brake) {
    c.fillStyle = 'rgba(255,60,60,0.35)';
    c.beginPath(); c.arc(-hl - 2, -hw + 3, 3.5, 0, TAU); c.arc(-hl - 2, hw - 3, 3.5, 0, TAU); c.fill();
  }
  /* le clignotant */
  if (o.blink && Math.sin(o.t * 12) > 0) {
    const sy = o.blink === 'gauche' ? -hw : hw;
    c.fillStyle = '#FFB020';
    c.beginPath(); c.arc(hl - 2.5, sy, 2, 0, TAU); c.arc(-hl + 2.5, sy, 2, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,176,32,0.35)';
    c.beginPath(); c.arc(hl - 2.5, sy, 4.5, 0, TAU); c.fill();
  }
  /* le pare-brise */
  const wsx = look.shape === 'camionnette' ? hl - 11 : hl - 10;
  c.fillStyle = '#BFE8FF';
  c.beginPath();
  c.moveTo(wsx, -hw + 2); c.lineTo(wsx + 3, -hw + 3); c.lineTo(wsx + 3, hw - 3); c.lineTo(wsx, hw - 2); c.closePath();
  c.fill();
  c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  /* l'intérieur, décapoté */
  const cabX = look.shape === 'camionnette' ? wsx - 8 : wsx - (look.shape === 'mini' ? 9 : 12);
  const cabW = wsx - cabX;
  c.fillStyle = '#3A3550';
  rrect(c, cabX, -hw + 2.5, cabW, Wd - 5, 2.5); c.fill();
  /* le passager à l'arrière */
  if (look.passager === 'chien' && look.shape !== 'camionnette') {
    const px = cabX + 2;
    c.fillStyle = '#C98B5E';
    c.beginPath(); c.arc(px, 2.2, 2.8, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#7A4A22';
    c.beginPath(); c.ellipse(px - 0.5, -0.4, 1.2, 2, 0.4, 0, TAU); c.ellipse(px - 0.5, 4.8, 1.2, 2, -0.4, 0, TAU); c.fill();
    c.fillStyle = INK;
    c.beginPath(); c.arc(px + 2.4, 2.2, 0.8, 0, TAU); c.fill();
  } else if (look.passager === 'enfant' && look.shape !== 'camionnette') {
    drawHead(c, cabX + 2.5, 2.6, 2.4, { skin: SKINS[(o.idx + 2) % SKINS.length], hair: HAIRS[(o.idx + 4) % HAIRS.length], hat: null }, o.mood * 0.5, o, 0.9);
  }
  /* le conducteur (à gauche, comme en France) */
  drawHead(c, cabX + cabW - 3.5, -1.8, 3.6, look, o.mood, o, 1);
  c.restore();
}

/* la tête vue d'en haut : le visage regarde vers le haut de l'écran, les yeux vers l'avant */
function drawHead(c, x, y, r, look, mood, o, sz) {
  c.save();
  c.translate(x, y);
  /* la tête reste droite à l'écran : on annule la rotation de la voiture */
  c.rotate(-o.a);
  const red = Math.max(0, mood - 0.45) / 0.55;
  c.fillStyle = red > 0 ? mixColor(look.skin, '#FF5A4E', red * 0.7) : look.skin;
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.9 * sz; c.stroke();
  /* les cheveux ou le chapeau */
  c.fillStyle = look.hair;
  if (look.hat === 'casquette') {
    c.fillStyle = o.dark || '#2F6FD1';
    c.beginPath(); c.arc(0, -0.6, r, Math.PI, 0); c.fill();
    c.fillRect(-r * 0.2, -r * 0.4, r * 1.3, r * 0.4);
  } else if (look.hat === 'chapeau') {
    c.fillStyle = '#8A5A34';
    c.beginPath(); c.ellipse(0, -r * 0.55, r * 1.35, r * 0.45, 0, 0, TAU); c.fill();
    c.fillStyle = '#6A4224';
    c.beginPath(); c.arc(0, -r * 0.65, r * 0.7, Math.PI, 0); c.fill();
  } else if (look.hat === 'bonnet') {
    c.fillStyle = '#E85D75';
    c.beginPath(); c.arc(0, -0.5, r, Math.PI, 0); c.fill();
    c.fillStyle = '#FFFFFF';
    c.beginPath(); c.arc(0, -r - 0.3, r * 0.35, 0, TAU); c.fill();
  } else {
    c.beginPath(); c.arc(0, -0.4, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    if (look.hat === 'chignon') { c.beginPath(); c.arc(0, -r - 0.4, r * 0.45, 0, TAU); c.fill(); }
  }
  /* les yeux et les sourcils */
  const ex = r * 0.38, ey = r * 0.05;
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.arc(-ex, ey, r * 0.28, 0, TAU); c.arc(ex, ey, r * 0.28, 0, TAU); c.fill();
  c.fillStyle = INK;
  const look2 = Math.cos(o.a) * r * 0.08;
  c.beginPath(); c.arc(-ex + look2, ey + 0.1, r * 0.15, 0, TAU); c.arc(ex + look2, ey + 0.1, r * 0.15, 0, TAU); c.fill();
  if (mood > 0.3) {
    const k = Math.min(1, (mood - 0.3) / 0.5);
    c.strokeStyle = INK;
    c.lineWidth = 0.8 * sz;
    c.beginPath();
    c.moveTo(-ex - r * 0.3, ey - r * 0.32 - k * r * 0.12); c.lineTo(-ex + r * 0.25, ey - r * 0.32 + k * r * 0.12);
    c.moveTo(ex + r * 0.3, ey - r * 0.32 - k * r * 0.12); c.lineTo(ex - r * 0.25, ey - r * 0.32 + k * r * 0.12);
    c.stroke();
  }
  /* la bouche : sourire, trait, ou grande bouche qui crie */
  c.strokeStyle = INK;
  c.lineWidth = 0.8 * sz;
  const my = r * 0.55;
  if (o.honk > 0.2 || mood > 0.85) {
    c.fillStyle = '#7A1F2B';
    c.beginPath(); c.ellipse(0, my, r * 0.28, r * 0.22 + (o.honk || 0) * r * 0.1, 0, 0, TAU); c.fill();
  } else if (mood > 0.4) {
    c.beginPath(); c.moveTo(-r * 0.25, my); c.lineTo(r * 0.25, my); c.stroke();
  } else {
    c.beginPath(); c.arc(0, my - r * 0.18, r * 0.28, 0.2, Math.PI - 0.2); c.stroke();
  }
  c.restore();
}
function mixColor(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const m = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

/* la bulle au-dessus d'une voiture qui attend : klaxon, colère, attente calme */
export function drawCarBubble(c, x, y, kind, k, t, zoom) {
  const s = Math.min(2.2, Math.max(1, 1.25 / zoom));
  c.save();
  c.translate(x, y - 16);
  c.scale(s, s);
  const pop = Math.min(1, k * 4);
  c.scale(pop, pop);
  if (kind === 'tuut' || kind === 'tuutRouge') {
    const txt = kind === 'tuutRouge' ? 'TUUUT !' : 'TUUT !';
    c.font = '800 9px "Baloo 2", sans-serif';
    const w = c.measureText(txt).width + 10;
    c.fillStyle = kind === 'tuutRouge' ? '#FF5A4E' : '#FFE14D';
    /* une bulle en étoile, comme dans les BD */
    c.beginPath();
    const n = 12;
    for (let i = 0; i <= n * 2; i++) {
      const ang = (i / (n * 2)) * TAU;
      const rr = i % 2 ? 1 : 1.22;
      c.lineTo(Math.cos(ang) * (w / 2) * rr, Math.sin(ang) * 8 * rr);
    }
    c.closePath();
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    c.fillStyle = kind === 'tuutRouge' ? '#FFFFFF' : INK;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, 0, 0.5);
  } else {
    /* une petite tête ronde qui montre l'humeur */
    c.fillStyle = '#FFFCF3';
    c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.moveTo(-3, 7); c.lineTo(0, 12); c.lineTo(3, 7); c.fill();
    const face = kind === 'colere' ? '#FF7A5C' : kind === 'attend' ? '#FFE14D' : '#9BE58A';
    c.fillStyle = face;
    c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.fillStyle = INK;
    c.beginPath(); c.arc(-2.1, -0.8, 0.9, 0, TAU); c.arc(2.1, -0.8, 0.9, 0, TAU); c.fill();
    c.lineWidth = 1;
    c.beginPath();
    if (kind === 'colere') {
      c.moveTo(-3.4, -3.4); c.lineTo(-1, -2.2); c.moveTo(3.4, -3.4); c.lineTo(1, -2.2);
      c.moveTo(-2, 3); c.quadraticCurveTo(0, 1.5, 2, 3);
    } else if (kind === 'attend') {
      c.moveTo(-2, 2.6); c.lineTo(2, 2.6);
    } else {
      c.arc(0, 1, 2.4, 0.3, Math.PI - 0.3);
    }
    c.stroke();
    if (kind === 'attend') {
      /* les petits points de l'attente */
      for (let i = 0; i < 3; i++) {
        c.fillStyle = `rgba(46,42,77,${0.3 + 0.7 * (Math.floor(t * 3) % 3 === i ? 1 : 0)})`;
        c.beginPath(); c.arc(9 + i * 3.5, -7, 1.1, 0, TAU); c.fill();
      }
    }
  }
  c.restore();
}

/* la fumée de colère qui sort de la tête */
export function drawSteam(c, x, y, t, k) {
  for (let i = 0; i < 3; i++) {
    const u = (t * 1.6 + i / 3) % 1;
    c.fillStyle = `rgba(255,255,255,${(1 - u) * 0.75 * k})`;
    c.beginPath();
    c.arc(x + Math.sin(u * 6 + i) * 3, y - 6 - u * 16, 2 + u * 4, 0, TAU);
    c.fill();
  }
}

/* ------------------------------------------------------------------------
   Les panneaux
   ------------------------------------------------------------------------ */
export function drawSignFace(c, type, x, y, r) {
  c.save();
  c.translate(x, y);
  if (type === 'stop') {
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * TAU + TAU / 16;
      c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    c.closePath();
    c.fillStyle = '#FFFFFF'; c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(1, r * 0.12); c.stroke();
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * TAU + TAU / 16;
      c.lineTo(Math.cos(ang) * r * 0.86, Math.sin(ang) * r * 0.86);
    }
    c.closePath();
    c.fillStyle = '#E3262E'; c.fill();
    c.fillStyle = '#FFFFFF';
    c.font = `900 ${r * 0.62}px "Baloo 2", Arial, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('STOP', 0, r * 0.06);
  } else if (type === 'cede') {
    const tri = (k) => {
      c.beginPath();
      c.moveTo(-r * k, -r * 0.75 * k);
      c.lineTo(r * k, -r * 0.75 * k);
      c.lineTo(0, r * k);
      c.closePath();
    };
    c.lineJoin = 'round';
    tri(1.08);
    c.fillStyle = '#FFFFFF'; c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(1, r * 0.12); c.stroke();
    tri(0.95);
    c.fillStyle = '#E3262E'; c.fill();
    tri(0.55);
    c.fillStyle = '#FFFFFF'; c.fill();
  } else if (type === 'enlever') {
    /* le bouton « enlever » : une main qui attrape */
    c.font = `${r * 1.4}px sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🧹', 0, r * 0.1);
  }
  c.restore();
}

/* le panneau sur son poteau (vu d'un peu en biais, pour qu'on le reconnaisse) */
export function drawSignPost(c, x, y, type, s = 1, alpha = 1) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = 'rgba(20,20,40,0.3)';
  c.beginPath(); c.ellipse(4, 1, 5, 2.2, 0.3, 0, TAU); c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -14); c.stroke();
  c.strokeStyle = '#B7BCC8';
  c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -14); c.stroke();
  c.lineCap = 'butt';
  drawSignFace(c, type, 0, -20, 9);
  c.restore();
}

/* le marquage au sol : la ligne blanche (pleine pour le STOP, en pointillés
   pour le Cédez), et le mot STOP ou le triangle peint sur la route */
export function drawRoadMarking(c, slot, type) {
  const lane = slot.lane;
  const end = lane.pts[lane.pts.length - 1];
  const d = lane.dirIn;
  const n = [-d[1], d[0]];
  const ang = Math.atan2(d[1], d[0]);
  c.save();
  /* la ligne, de la ligne du milieu jusqu'au trottoir */
  const a0 = -LANE + 1.5, a1 = HALF - LANE - 1;
  const lx = end[0] - d[0] * 2, ly = end[1] - d[1] * 2;
  c.strokeStyle = '#FFFFFF';
  c.lineWidth = type === 'stop' ? 3.5 : 2.5;
  if (type === 'cede') c.setLineDash([3.5, 2.5]);
  c.beginPath();
  c.moveTo(lx + n[0] * a0, ly + n[1] * a0);
  c.lineTo(lx + n[0] * a1, ly + n[1] * a1);
  c.stroke();
  c.setLineDash([]);
  c.translate(end[0] - d[0] * 16, end[1] - d[1] * 16);
  c.rotate(ang + Math.PI / 2);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  if (type === 'stop') {
    c.font = '900 8px "Baloo 2", Arial, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('STOP', 0, 0);
  } else {
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-5, -4); c.lineTo(5, -4); c.lineTo(0, 6); c.closePath(); c.stroke();
  }
  c.restore();
}

/* un œil barré : « on n'y voit rien ici » */
export function drawBlindBadge(c, x, y, s, t) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const k = 1 + Math.sin(t * 4) * 0.06;
  c.scale(k, k);
  c.fillStyle = '#FFFCF3';
  c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill();
  c.strokeStyle = '#E3262E'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#FFFFFF';
  c.strokeStyle = INK; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(-7, 0); c.quadraticCurveTo(0, -6.5, 7, 0); c.quadraticCurveTo(0, 6.5, -7, 0); c.fill(); c.stroke();
  c.fillStyle = INK;
  c.beginPath(); c.arc(0, 0, 2.4, 0, TAU); c.fill();
  c.strokeStyle = '#E3262E'; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(-6, -6); c.lineTo(6, 6); c.stroke();
  c.restore();
}

/* le badge d'un lieu d'arrivée : son icône, son nom, et combien sont arrivés */
export function drawLieuBadge(c, l, n, total, t, pulse, zoom) {
  const [bx, by, bw, bh] = l.bat;
  const x = bx + bw - 30, y = by + bh / 2 - 2;
  const s = Math.min(1.35, Math.max(0.9, 1 / zoom));
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const k = 1 + pulse * 0.25;
  c.scale(k, k);
  c.fillStyle = 'rgba(20,20,40,0.25)';
  c.beginPath(); c.arc(2, 3, 15, 0, TAU); c.fill();
  c.fillStyle = '#FFFCF3';
  c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill();
  c.strokeStyle = l.couleur; c.lineWidth = 4; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.3;
  c.beginPath(); c.arc(0, 0, 17, 0, TAU); c.stroke();
  c.font = '17px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(l.icone, 0, 1);
  /* le compteur */
  if (total) {
    const txt = `${n}/${total}`;
    c.font = '800 9px "Baloo 2", sans-serif';
    const w = c.measureText(txt).width + 8;
    c.fillStyle = n >= total ? '#3A9C58' : l.couleur;
    rrect(c, -w / 2, 12, w, 11, 5.5); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#FFFFFF';
    c.fillText(txt, 0, 18);
  }
  c.restore();
}

/* les icônes des boutons (canvas carré) */
export function drawToolIcon(cv, id) {
  const c = cv.getContext('2d');
  const s = cv.width;
  c.clearRect(0, 0, s, s);
  if (id === 'enlever') {
    c.font = `${s * 0.62}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🧹', s / 2, s * 0.55);
    return;
  }
  drawSignFace(c, id, s / 2, s / 2, s * 0.4);
}

/* ========================================================================
   ZAZA, la zèbre agente de la circulation
   ======================================================================== */
export const ZAZA_SVG = `<svg class="bip zaza" viewBox="0 0 80 84" aria-hidden="true">
  <ellipse cx="17" cy="27" rx="7" ry="13" transform="rotate(-28 17 27)" fill="#FFFFFF" stroke="#2E2A4D" stroke-width="2.5"/>
  <ellipse cx="17" cy="28" rx="3.2" ry="7.5" transform="rotate(-28 17 28)" fill="#FFB3C7"/>
  <ellipse cx="63" cy="27" rx="7" ry="13" transform="rotate(28 63 27)" fill="#FFFFFF" stroke="#2E2A4D" stroke-width="2.5"/>
  <ellipse cx="63" cy="28" rx="3.2" ry="7.5" transform="rotate(28 63 28)" fill="#FFB3C7"/>
  <path d="M22 34 Q20 18 40 18 Q60 18 58 34 L57 56 Q55 79 40 79 Q25 79 23 56 Z" fill="#FFFFFF" stroke="#2E2A4D" stroke-width="3"/>
  <path d="M24 40 q5 2 9 0 M23 48 q5 2 8 0 M47 40 q4 2 9 0 M49 48 q4 2 8 0 M36 22 q4 4 8 0" stroke="#2E2A4D" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="40" cy="64" rx="14" ry="12" fill="#6E6684" stroke="#2E2A4D" stroke-width="2.5"/>
  <ellipse cx="34.5" cy="61" rx="2.2" ry="3" fill="#2E2A4D"/>
  <ellipse cx="45.5" cy="61" rx="2.2" ry="3" fill="#2E2A4D"/>
  <path class="bip-mouth" d="M34 69 Q40 74 46 69" stroke="#FFFFFF" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <g class="bip-eyes">
    <ellipse cx="31" cy="44" rx="6" ry="7" fill="#FFFFFF" stroke="#2E2A4D" stroke-width="2"/>
    <ellipse cx="49" cy="44" rx="6" ry="7" fill="#FFFFFF" stroke="#2E2A4D" stroke-width="2"/>
    <circle cx="32" cy="45" r="3.4" fill="#2E2A4D"/>
    <circle cx="48" cy="45" r="3.4" fill="#2E2A4D"/>
    <circle cx="30.8" cy="43.5" r="1.3" fill="#FFFFFF"/>
    <circle cx="46.8" cy="43.5" r="1.3" fill="#FFFFFF"/>
  </g>
  <path d="M33 14 l3 -8 l3 7 l3 -8 l3 8 l3 -6 l1 8 Z" fill="#2E2A4D"/>
  <path d="M18 27 Q40 4 62 27 Q40 21 18 27 Z" fill="#2F6FD1" stroke="#2E2A4D" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M20 27 Q40 33 60 27 Q40 24 20 27 Z" fill="#1C3F86" stroke="#2E2A4D" stroke-width="2"/>
  <path d="M40 11 l2 4 l4 0.5 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -0.5 Z" fill="#FFC53D" stroke="#2E2A4D" stroke-width="1"/>
  <path d="M52 70 q6 4 12 2" stroke="#E85D75" stroke-width="1.6" fill="none"/>
  <rect x="61" y="66" width="10" height="7" rx="3" fill="#FFC53D" stroke="#2E2A4D" stroke-width="1.8"/>
</svg>`;

/* Zaza sur un canvas (les films) : vue de face, en uniforme, avec son sifflet */
export function drawZaza(c, x, y, s, t, { whistle = 0, wave = 0, holding = null } = {}) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.lineJoin = 'round';
  /* le corps : la veste bleue */
  c.fillStyle = '#2F6FD1';
  c.beginPath();
  c.moveTo(-30, 40); c.quadraticCurveTo(-34, 110, -26, 120); c.lineTo(26, 120); c.quadraticCurveTo(34, 110, 30, 40);
  c.quadraticCurveTo(0, 28, -30, 40);
  c.fill(); c.stroke();
  /* le gilet jaune fluo et ses bandes */
  c.fillStyle = '#E9F542';
  c.beginPath(); c.moveTo(-24, 46); c.lineTo(-18, 118); c.lineTo(18, 118); c.lineTo(24, 46); c.quadraticCurveTo(0, 38, -24, 46); c.fill(); c.stroke();
  c.fillStyle = '#D9DDE6';
  c.fillRect(-21, 80, 42, 6); c.fillRect(-20, 96, 40, 6);
  /* les jambes rayées */
  for (const sx of [-12, 12]) {
    c.fillStyle = '#FFFFFF';
    c.fillRect(sx - 6, 118, 12, 24);
    c.strokeRect(sx - 6, 118, 12, 24);
    c.fillStyle = INK;
    c.fillRect(sx - 6, 124, 12, 3); c.fillRect(sx - 6, 132, 12, 3);
    c.fillStyle = '#2E2A4D';
    rrect(c, sx - 8, 140, 16, 7, 3); c.fill();
  }
  /* les bras : l'un fait signe, l'autre tient un panneau */
  /* le bras gauche fait coucou, le droit tient le poteau du panneau */
  const armA = 2.4 + Math.sin(wave) * 0.35;
  for (const side of [-1, 1]) {
    c.save();
    c.translate(side * 28, 50);
    c.rotate(side === -1 ? armA : (holding ? -0.45 : 0.25));
    c.fillStyle = '#2F6FD1';
    rrect(c, -6, 0, 12, 38, 6); c.fill(); c.stroke();
    c.fillStyle = '#FFFFFF';
    c.beginPath(); c.arc(0, 40, 7, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }
  if (holding) {
    c.strokeStyle = INK; c.lineWidth = 4;
    c.beginPath(); c.moveTo(44, 90); c.lineTo(44, 20); c.stroke();
    c.strokeStyle = '#B7BCC8'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(44, 90); c.lineTo(44, 20); c.stroke();
    drawSignFace(c, holding, 44, 10, 20);
  }
  /* la tête */
  c.save();
  c.translate(0, -2);
  c.lineWidth = 3;
  c.strokeStyle = INK;
  for (const side of [-1, 1]) {
    c.save();
    c.translate(side * 22, -26);
    c.rotate(side * 0.5);
    c.fillStyle = '#FFFFFF';
    c.beginPath(); c.ellipse(0, 0, 8, 15, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#FFB3C7';
    c.beginPath(); c.ellipse(0, 1, 3.5, 9, 0, 0, TAU); c.fill();
    c.restore();
  }
  c.fillStyle = '#FFFFFF';
  c.beginPath();
  c.moveTo(-22, -16); c.quadraticCurveTo(-24, -36, 0, -36); c.quadraticCurveTo(24, -36, 22, -16);
  c.lineTo(20, 14); c.quadraticCurveTo(18, 40, 0, 40); c.quadraticCurveTo(-18, 40, -20, 14); c.closePath();
  c.fill(); c.stroke();
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-20, -8); c.quadraticCurveTo(-14, -5, -10, -8);
  c.moveTo(-20, 2); c.quadraticCurveTo(-15, 5, -11, 2);
  c.moveTo(20, -8); c.quadraticCurveTo(14, -5, 10, -8);
  c.moveTo(20, 2); c.quadraticCurveTo(15, 5, 11, 2);
  c.stroke();
  c.lineCap = 'butt';
  c.fillStyle = '#6E6684';
  c.beginPath(); c.ellipse(0, 24, 16, 13, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = INK;
  c.beginPath(); c.ellipse(-6, 21, 2.5, 3.4, 0, 0, TAU); c.ellipse(6, 21, 2.5, 3.4, 0, 0, TAU); c.fill();
  const blink = Math.sin(t * 2.3) > 0.97;
  for (const side of [-1, 1]) {
    c.fillStyle = '#FFFFFF';
    c.beginPath(); c.ellipse(side * 9, -4, 7, blink ? 1 : 8, 0, 0, TAU); c.fill(); c.stroke();
    if (!blink) {
      c.fillStyle = INK;
      c.beginPath(); c.arc(side * 8, -3, 3.8, 0, TAU); c.fill();
      c.fillStyle = '#FFFFFF';
      c.beginPath(); c.arc(side * 8 - 1.4, -4.6, 1.4, 0, TAU); c.fill();
    }
  }
  /* la casquette */
  c.fillStyle = '#2F6FD1';
  c.beginPath(); c.moveTo(-24, -24); c.quadraticCurveTo(0, -54, 24, -24); c.quadraticCurveTo(0, -30, -24, -24); c.fill(); c.stroke();
  c.fillStyle = '#1C3F86';
  c.beginPath(); c.moveTo(-22, -24); c.quadraticCurveTo(0, -16, 22, -24); c.quadraticCurveTo(0, -27, -22, -24); c.fill(); c.stroke();
  c.fillStyle = '#FFC53D';
  c.beginPath(); c.arc(0, -36, 4.5, 0, TAU); c.fill(); c.stroke();
  /* le sifflet */
  if (whistle > 0) {
    c.fillStyle = '#FFC53D';
    rrect(c, 8, 30, 16, 8, 4); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = `rgba(46,42,77,${whistle})`;
      c.lineWidth = 2;
      c.beginPath(); c.arc(26, 34, 8 + i * 6 + (t * 30 % 6), -0.6, 0.6); c.stroke();
    }
  } else {
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-7, 31); c.quadraticCurveTo(0, 36, 7, 31); c.stroke();
  }
  c.restore();
  c.restore();
}
