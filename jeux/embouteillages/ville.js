// ============================================================================
// LES EMBOUTEILLAGES DE BOUCHONVILLE — la simulation (aucun dessin ici)
// La ville est un plan de lettres (levels/) : les routes deviennent des voies
// (on roule à droite, comme en France), les carrefours des « nœuds ». Les
// voitures sortent des entrées de la ville, suivent le plus court chemin
// jusqu'à leur lieu d'arrivée et se suivent sans se rentrer dedans.
//
// Les règles d'un carrefour, pour chaque voiture qui y arrive :
//   - une route sans panneau a le rang 2, une route avec un STOP ou un
//     Cédez-le-passage a le rang 1 ;
//   - on laisse passer les voitures qui arrivent sur une route de rang plus
//     fort (si on les voit : avec un Cédez-le-passage dans un carrefour caché
//     par des haies, on ne voit rien… et c'est la frayeur) ;
//   - deux voitures du même rang qui arrivent par deux routes qui se
//     croisent (pas en face l'une de l'autre) : personne ne sait qui doit
//     passer, elles se bloquent et klaxonnent. C'est ce qui arrive partout
//     à Bouchonville au début, quand il n'y a encore aucun panneau ;
//   - au STOP, on s'arrête complètement un petit moment avant de repartir ;
//   - on n'entre dans le carrefour que si l'on peut en ressortir.
// Le monde avance à pas fixes (30 par seconde) : une même partie rejouée
// donne toujours le même résultat (pilote automatique et vérification).
// ============================================================================

export const TILE = 48;            // un carreau du plan, en pixels du monde
export const TICK_RATE = 30;
const DT = 1 / TICK_RATE;
const HALF = TILE / 2;
export const LANE = 11;            // une voie est à 11 px du milieu de la route
const GAP = 34;                    // distance mini entre deux voitures (centre à centre)
const VMAX = 74;                   // vitesse en ligne droite (px/s)
const VTURN = 44;                  // vitesse dans un virage de carrefour
const ACC = 95;
const DEC = 230;
const D_DECIDE = 46;               // à cette distance de la ligne, on décide si on passe
const R_ARGUE = 72;                // une voiture « arrive » à moins de 72 px de sa ligne
const R_CHAOS = 125;               // … et de bien plus loin dans un carrefour sans aucun panneau
const V_SEE = 150;                 // jusqu'où l'on voit les voitures prioritaires
const V_BLIND = 14;                // dans un carrefour caché (seulement celles déjà à la ligne)
const STOP_TIME = 0.9;             // secondes d'arrêt au STOP
export const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] };
const SIDE_OF = (dx, dy) => (dx === 1 ? 'e' : dx === -1 ? 'o' : dy === 1 ? 's' : 'n');
export const RANG = { aucun: 2, cede: 1, stop: 1 };

const isRoadChar = (ch) => ch === '#' || ch === 'x' || /[A-Z0-9]/.test(ch);

/* ---------- Les morceaux de chemin (polylignes) ---------- */
function makePiece(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, cum, len: cum[cum.length - 1] };
}
/* la position et l'angle à la distance s le long d'un morceau */
export function pointAt(piece, s) {
  const { pts, cum } = piece;
  if (s <= 0) return [pts[0][0], pts[0][1], Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0])];
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i];
  const seg = cum[i] - cum[i - 1] || 1;
  const k = Math.min(1, (s - cum[i - 1]) / seg);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
}
function quad(p0, c, p1, n = 10) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
  return out;
}
const rn = (d) => [-d[1], d[0]];   // la normale à droite d'une direction (y vers le bas)

/* ---------- Lire le plan ---------- */
export function parseCity(level) {
  const plan = level.plan;
  const H = plan.length;
  const W = Math.max(...plan.map((r) => r.length));
  const at = (c, r) => (r >= 0 && r < H && c >= 0 && c < W ? (plan[r][c] || '.') : '.');
  const road = (c, r) => isRoadChar(at(c, r));
  const nodes = [];
  const nodeAt = new Map();
  const key = (c, r) => `${c},${r}`;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (!road(c, r)) continue;
      const ch = at(c, r);
      const arms = Object.entries(DIRS).filter(([, [dx, dy]]) => road(c + dx, r + dy)).map(([k]) => k);
      const endpoint = /[A-Z0-9]/.test(ch);
      if (arms.length === 2 && !endpoint) {
        /* une ligne droite ou un virage : pas un nœud */
        continue;
      }
      const n = {
        id: nodes.length, c, r, x: c * TILE + HALF, y: r * TILE + HALF, ch,
        kind: endpoint ? (/[0-9]/.test(ch) ? 'arrivee' : 'depart') : (arms.length >= 3 ? 'carrefour' : 'impasse'),
        aveugle: ch === 'x', arms, inLanes: [], outLanes: [], inside: [],
      };
      nodes.push(n);
      nodeAt.set(key(c, r), n);
    }
  }
  /* les tronçons : d'un nœud à l'autre en suivant la route */
  const segments = [];
  const seen = new Set();
  for (const n of nodes) {
    for (const side of n.arms) {
      const [dx, dy] = DIRS[side];
      const tiles = [[n.c, n.r]];
      let c = n.c + dx, r = n.r + dy, pd = [dx, dy];
      let guard = 0;
      while (!nodeAt.has(key(c, r)) && guard++ < 999) {
        tiles.push([c, r]);
        /* on continue tout droit, sinon on tourne (virage) */
        const options = Object.values(DIRS).filter(([ex, ey]) => !(ex === -pd[0] && ey === -pd[1]) && road(c + ex, r + ey));
        const next = options.find(([ex, ey]) => ex === pd[0] && ey === pd[1]) || options[0];
        if (!next) break;
        pd = next;
        c += next[0]; r += next[1];
      }
      const end = nodeAt.get(key(c, r));
      if (!end) continue;
      tiles.push([c, r]);
      const sig = [key(n.c, n.r), key(tiles[1][0], tiles[1][1])].join('>');
      const sigBack = [key(c, r), key(tiles[tiles.length - 2][0], tiles[tiles.length - 2][1])].join('>');
      if (seen.has(sig)) continue;
      seen.add(sig); seen.add(sigBack);
      segments.push({ id: segments.length, a: n, b: end, tiles });
    }
  }
  /* les voies : deux par tronçon, une dans chaque sens */
  const lanes = [];
  for (const sg of segments) {
    for (const back of [false, true]) {
      const tiles = back ? [...sg.tiles].reverse() : sg.tiles;
      const from = back ? sg.b : sg.a;
      const to = back ? sg.a : sg.b;
      const lane = buildLane(tiles, from, to);
      lane.id = lanes.length;
      lane.seg = sg;
      lane.from = from;
      lane.to = to;
      lane.cars = [];
      lanes.push(lane);
      from.outLanes.push(lane);
      to.inLanes.push(lane);
    }
  }
  for (const lane of lanes) {
    lane.reverse = lanes.find((l) => l.seg === lane.seg && l !== lane);
    lane.side = SIDE_OF(-lane.dirIn[0], -lane.dirIn[1]);   // le côté du carrefour d'où l'on arrive
  }
  return { W, H, at, road, nodes, nodeAt, segments, lanes, key };
}

function buildLane(tiles, from, to) {
  const C = tiles.map(([c, r]) => [c * TILE + HALF, r * TILE + HALF]);
  const dirs = [];
  for (let i = 1; i < C.length; i++) dirs.push([Math.sign(C[i][0] - C[i - 1][0]), Math.sign(C[i][1] - C[i - 1][1])]);
  const dirOut = dirs[0];
  const dirIn = dirs[dirs.length - 1];
  const pts = [];
  /* le départ : au bord du carrefour, ou au fond de l'entrée de la ville */
  const o0 = rn(dirOut);
  const startBack = from.kind === 'depart' ? -HALF : HALF;
  pts.push([C[0][0] + dirOut[0] * startBack + o0[0] * LANE, C[0][1] + dirOut[1] * startBack + o0[1] * LANE]);
  for (let i = 1; i < C.length - 1; i++) {
    const a = dirs[i - 1], b = dirs[i];
    const na = rn(a), nb = rn(b);
    if (a[0] === b[0] && a[1] === b[1]) continue;
    /* un virage : on arrondit le coin */
    const m = [C[i][0] + (na[0] + nb[0]) * LANE, C[i][1] + (na[1] + nb[1]) * LANE];
    const turnR = a[0] * b[1] - a[1] * b[0] > 0;   // virage à droite : petit rayon
    const rad = turnR ? HALF - LANE : HALF + LANE - 4;
    const p0 = [m[0] - a[0] * rad, m[1] - a[1] * rad];
    const p1 = [m[0] + b[0] * rad, m[1] + b[1] * rad];
    pts.push(...quad(p0, m, p1, 8));
  }
  const o1 = rn(dirIn);
  const last = C[C.length - 1];
  const endBack = to.kind === 'arrivee' ? 4 : -HALF;
  pts.push([last[0] + dirIn[0] * endBack + o1[0] * LANE, last[1] + dirIn[1] * endBack + o1[1] * LANE]);
  const piece = makePiece(pts);
  return { ...piece, dirOut, dirIn };
}

/* le chemin dans un carrefour, de la fin d'une voie au début de la suivante */
function crossingPiece(inLane, outLane) {
  const a = inLane.pts[inLane.pts.length - 1];
  const b = outLane.pts[0];
  const d1 = inLane.dirIn, d2 = outLane.dirOut;
  if (d1[0] === d2[0] && d1[1] === d2[1]) return makePiece([a, b]);
  const ctrl = d1[0] !== 0 ? [b[0], a[1]] : [a[0], b[1]];
  return makePiece(quad(a, ctrl, b, 10));
}
export function turnOf(inLane, outLane) {
  const d1 = inLane.dirIn, d2 = outLane.dirOut;
  const cr = d1[0] * d2[1] - d1[1] * d2[0];
  return cr > 0 ? 'droite' : cr < 0 ? 'gauche' : 'tout-droit';
}

/* ---------- Le plus court chemin ---------- */
function findRoute(city, start, goal) {
  const dist = new Map();
  const prev = new Map();
  const queue = [];
  for (const l of start.outLanes) { dist.set(l, l.len); queue.push(l); }
  while (queue.length) {
    queue.sort((p, q) => dist.get(p) - dist.get(q) || p.id - q.id);
    const l = queue.shift();
    if (l.to === goal) {
      const route = [l];
      let p = prev.get(l);
      while (p) { route.unshift(p); p = prev.get(p); }
      return route;
    }
    if (l.to.kind !== 'carrefour' && l.to.kind !== 'impasse') continue;
    for (const nx of l.to.outLanes) {
      if (nx === l.reverse || nx.interdit) continue;
      if (nx.to.kind === 'depart') continue;
      const d = dist.get(l) + TILE * 0.9 + nx.len + (turnOf(l, nx) === 'tout-droit' ? 0 : 6);
      if (!dist.has(nx) || d < dist.get(nx)) {
        dist.set(nx, d);
        prev.set(nx, l);
        if (!queue.includes(nx)) queue.push(nx);
      }
    }
  }
  return null;
}

/* ---------- Le monde ---------- */
export function createWorld(level) {
  const city = parseCity(level);
  const byChar = (ch) => city.nodes.find((n) => n.ch === ch);
  const W = {
    level, city,
    tick: 0,
    get time() { return this.tick * DT; },
    cars: [],
    signs: {},                     // clé du bras ('c,r,côté') -> 'stop' | 'cede'
    stock: { ...(level.panneaux || {}) },
    events: [],
    arrived: 0,
    frayeurs: 0,
    over: false,
  };
  const crossCache = new Map();
  const crossing = (a, b) => {
    const k = `${a.id}>${b.id}`;
    if (!crossCache.has(k)) crossCache.set(k, crossingPiece(a, b));
    return crossCache.get(k);
  };

  /* les bras où l'on peut poser un panneau : là où des voitures arrivent dans un carrefour */
  W.slots = [];
  for (const n of city.nodes) {
    if (n.kind !== 'carrefour') continue;
    for (const l of n.inLanes) {
      if (l.from.kind === 'arrivee') continue;
      const end = l.pts[l.pts.length - 1];
      const o = rn(l.dirIn);
      W.slots.push({
        key: `${n.c},${n.r},${l.side}`, node: n, lane: l, side: l.side,
        /* le poteau, sur le trottoir à droite de la voie, juste avant la ligne */
        x: end[0] + o[0] * (HALF - LANE + 6) - l.dirIn[0] * 8,
        y: end[1] + o[1] * (HALF - LANE + 6) - l.dirIn[1] * 8,
      });
    }
  }
  const slotOf = (lane) => W.slots.find((s) => s.lane === lane);
  W.signOf = (lane) => { const s = slotOf(lane); return (s && W.signs[s.key]) || 'aucun'; };

  /* les voitures */
  (level.voitures || []).forEach((v, i) => {
    const start = byChar(v.de);
    const goal = byChar(v.vers);
    const route = start && goal ? findRoute(city, start, goal) : null;
    if (!route) throw new Error(`Pas de chemin pour la voiture ${i} (${v.de} → ${v.vers})`);
    W.cars.push({
      id: i, de: v.de, vers: v.vers, t0: v.t || 0, look: v.look ?? i,
      route, ri: 0, mode: 'attente', s: 0, v: 0,
      lane: null, cross: null, node: null, granted: false,
      stopT: 0, waitT: 0, why: null, partner: null,
      colere: 0, furieux: false, x: start.x, y: start.y, a: 0,
      parkT: 0, arriveT: 0, place: -1,
    });
  });
  W.total = W.cars.length;

  /* ---------- Poser et enlever les panneaux ---------- */
  W.canPlace = (key, type) => {
    const slot = W.slots.find((s) => s.key === key);
    if (!slot) return false;
    if (W.signs[key] === type) return true;
    return (W.stock[type] || 0) > 0;
  };
  W.place = (key, type) => {
    const slot = W.slots.find((s) => s.key === key);
    if (!slot) return false;
    const old = W.signs[key];
    if (old === type) return false;
    if (!((W.stock[type] || 0) > 0)) return false;
    if (old) W.stock[old] = (W.stock[old] || 0) + 1;
    W.stock[type]--;
    W.signs[key] = type;
    W.events.push({ type: 'pose', key, panneau: type, old });
    return true;
  };
  W.remove = (key) => {
    const old = W.signs[key];
    if (!old) return false;
    delete W.signs[key];
    W.stock[old] = (W.stock[old] || 0) + 1;
    W.events.push({ type: 'enleve', key, panneau: old });
    return true;
  };

  /* ---------- Un carrefour : qui peut passer ? ---------- */
  const frontOf = (lane) => {
    for (const car of lane.cars) if (!car.granted) return car;
    return null;
  };
  const relation = (l1, l2) => {
    const a = l1.dirIn, b = l2.dirIn;
    if (a[0] === b[0] && a[1] === b[1]) return 'meme';
    if (a[0] === -b[0] && a[1] === -b[1]) return 'face';
    return 'croise';
  };
  function compatible(car, other, node) {
    const l1 = car.route[car.ri], l2 = other.route[other.ri];
    const o1 = car.route[car.ri + 1], o2 = other.route[other.ri + 1];
    const rel = relation(l1, l2);
    if (rel === 'meme') return true;
    if (o1 === o2) return false;
    const t1 = turnOf(l1, o1), t2 = turnOf(l2, o2);
    if (rel === 'face') return t1 !== 'gauche' && t2 !== 'gauche';
    return t1 === 'droite' && t2 === 'droite';
  }
  function decideNode(node) {
    const cands = [];
    for (const lane of node.inLanes) {
      const f = frontOf(lane);
      if (!f || f.mode !== 'voie') continue;
      const d = lane.len - f.s;
      f.why = f.why === 'dispute' || f.why === 'cede' || f.why === 'stop' ? null : f.why;
      f.partner = null;
      if (d > D_DECIDE) continue;
      cands.push({ car: f, lane, d });
    }
    if (!cands.length) return;
    /* ceux qui attendent depuis le plus longtemps d'abord */
    cands.sort((p, q) => q.car.waitT - p.car.waitT || p.lane.id - q.lane.id);
    const present = node.inLanes.map((lane) => {
      const f = frontOf(lane);
      if (!f || f.mode !== 'voie') return null;
      return { car: f, lane, d: lane.len - f.s, rang: RANG[W.signOf(lane)] };
    }).filter(Boolean);
    /* sans aucun panneau, c'est la pagaille : chacun veut passer en premier */
    const chaos = !W.slots.some((sl) => sl.node === node && W.signs[sl.key]);
    const argue = chaos ? R_CHAOS : R_ARGUE;
    for (const { car, lane, d } of cands) {
      const sign = W.signOf(lane);
      const rang = RANG[sign];
      const out = car.route[car.ri + 1];
      if (!out) continue;
      /* le STOP : on s'arrête complètement d'abord */
      if (sign === 'stop' && (d > 5 || car.stopT < STOP_TIME)) { car.why = 'stop'; continue; }
      /* les prioritaires qu'on voit arriver : on les laisse passer */
      const see = sign === 'cede' && node.aveugle ? V_BLIND : V_SEE;
      const yieldTo = present.find((p) => p.car !== car && p.rang > rang && p.d < see);
      if (yieldTo) { car.why = 'cede'; continue; }
      /* même rang, routes qui se croisent : personne ne sait qui passe */
      const rival = present.find((p) => p.car !== car && p.rang === rang && p.d < argue && relation(lane, p.lane) === 'croise');
      if (rival) {
        car.why = 'dispute';
        car.partner = rival.car;
        continue;
      }
      /* tourner à gauche : on laisse passer celui d'en face */
      if (turnOf(lane, out) === 'gauche') {
        const face = present.find((p) => p.car !== car && p.rang === rang && p.d < R_ARGUE && relation(lane, p.lane) === 'face'
          && p.car.v > 8 && p.car.route[p.car.ri + 1] && turnOf(p.lane, p.car.route[p.car.ri + 1]) !== 'gauche');
        if (face) { car.why = 'cede'; continue; }
      }
      /* le carrefour doit être libre pour nous */
      let ok = true;
      for (const o of node.inside) {
        if (o.route[o.ri] === lane) {
          /* la voiture de devant, venue de la même route : on garde ses distances */
          const ahead = o.mode === 'carrefour' ? o.s + d : 0;
          if (ahead < GAP) { ok = false; break; }
        } else if (!compatible(car, o, node)) { ok = false; break; }
      }
      if (!ok) { car.why = 'occupe'; continue; }
      /* on ne s'engage que si l'on peut ressortir */
      const lastOut = out.cars[out.cars.length - 1];
      const goingOut = node.inside.filter((o) => o.route[o.ri + 1] === out).length;
      const room = out.to.kind === 'arrivee' ? 99 : Math.max(1, Math.floor(out.len / GAP));
      if ((lastOut && lastOut.s < GAP + 4) || (lastOut && goingOut && lastOut.s < GAP * 2) || out.cars.length + goingOut >= room) {
        car.why = 'bouche';
        continue;
      }
      /* c'est parti ! une frayeur si l'on coupe la route d'un prioritaire tout proche */
      for (const p of present) {
        if (p.car === car || p.rang <= rang) continue;
        if (p.d < 80 && p.car.v > 25) {
          W.frayeurs++;
          p.car.v = 0;
          /* une grosse peur : les deux conducteurs sont furieux */
          for (const who of [car, p.car]) {
            who.colere = 1;
            if (!who.furieux) { who.furieux = true; W.events.push({ type: 'furieux', car: who }); }
          }
          W.events.push({ type: 'frayeur', node, cars: [car, p.car] });
        }
      }
      car.granted = true;
      car.node = node;
      car.why = null;
      node.inside.push(car);
      const i = present.findIndex((p) => p.car === car);
      if (i >= 0) present.splice(i, 1);
      W.events.push({ type: 'passe', node, car });
    }
  }

  /* ---------- Un pas de simulation ---------- */
  function enterLane(car, lane, s) {
    car.lane = lane;
    car.mode = 'voie';
    car.s = s;
    lane.cars.push(car);
  }
  W.step = () => {
    if (W.over) return;
    W.tick++;
    const t = W.time;
    /* les voitures entrent dans la ville */
    for (const car of W.cars) {
      if (car.mode !== 'attente' || car.t0 > t) continue;
      const lane = car.route[0];
      const last = lane.cars[lane.cars.length - 1];
      if (last && last.s < GAP + 6) { car.waitT += DT; car.why = 'garage'; continue; }
      enterLane(car, lane, 0);
      car.v = VMAX * 0.7;
      car.why = null;
      W.events.push({ type: 'entre', car });
      break;                       // une seule par pas : elles se suivent
    }
    for (const n of W.city.nodes) if (n.kind === 'carrefour' || n.kind === 'impasse') decideNode(n);

    /* on avance */
    for (const car of W.cars) {
      if (car.mode === 'voie') moveOnLane(car);
      else if (car.mode === 'carrefour') moveInCrossing(car);
      else if (car.mode === 'gare') {
        car.parkT += DT;
        if (car.parkT > 1.1) car.mode = 'fini';
      }
      mood(car);
    }
    if (W.cars.every((c) => c.mode === 'gare' || c.mode === 'fini')) {
      W.over = true;
      W.events.push({ type: 'fini' });
    }
  };

  function speedTo(car, limit, vmax) {
    const room = Math.max(0, limit - car.s);
    const target = Math.min(vmax, Math.sqrt(2 * DEC * room));
    if (car.v < target) car.v = Math.min(target, car.v + ACC * DT);
    else car.v = target;
    car.s = Math.min(car.s + car.v * DT, Math.max(car.s, limit));
  }

  function moveOnLane(car) {
    const lane = car.lane;
    const idx = lane.cars.indexOf(car);
    const leader = idx > 0 ? lane.cars[idx - 1] : null;
    let limit;
    const toArrivee = lane.to.kind === 'arrivee';
    if (leader) limit = leader.s - GAP;
    else if (toArrivee) limit = lane.len + 50;
    else if (car.granted) {
      /* la voiture de devant, déjà dans le carrefour */
      const node = lane.to;
      const ahead = [...node.inside].reverse().find((o) => o !== car && o.mode === 'carrefour' && o.route[o.ri] === lane);
      limit = ahead ? lane.len + ahead.s - GAP : lane.len + 999;
    } else limit = lane.len - 2;
    speedTo(car, limit, VMAX);
    const pos = pointAt(lane, car.s);
    car.x = pos[0]; car.y = pos[1]; car.a = pos[2];
    if (car.v < 2 && !car.granted && !leader && lane.len - car.s < 6) car.stopT += DT; else if (car.v > 8) car.stopT = 0;
    if (toArrivee && car.s >= lane.len - 0.5) {
      lane.cars.splice(lane.cars.indexOf(car), 1);
      car.mode = 'gare';
      car.parkT = 0;
      car.lane = null;
      W.arrived++;
      car.arriveT = W.time;
      car.place = W.cars.filter((c) => c.vers === car.vers && (c.mode === 'gare' || c.mode === 'fini') && c !== car).length;
      W.events.push({ type: 'arrive', car });
      return;
    }
    if (car.granted && car.s >= lane.len) {
      lane.cars.splice(lane.cars.indexOf(car), 1);
      const out = car.route[car.ri + 1];
      car.cross = crossing(lane, out);
      car.mode = 'carrefour';
      car.s -= lane.len;
      car.lane = null;
      car.turn = turnOf(lane, out);
    }
  }

  function moveInCrossing(car) {
    const node = car.node;
    const out = car.route[car.ri + 1];
    const i = node.inside.indexOf(car);
    let limit = car.cross.len + 999;
    const lastOut = out.cars[out.cars.length - 1];
    if (lastOut) limit = car.cross.len + lastOut.s - GAP;
    for (let k = 0; k < i; k++) {
      const o = node.inside[k];
      if (o.mode === 'carrefour' && o.route[o.ri] === car.route[car.ri] && o.cross === car.cross) limit = Math.min(limit, o.s - GAP);
    }
    speedTo(car, limit, car.turn === 'tout-droit' ? VMAX : VTURN);
    const pos = pointAt(car.cross, car.s);
    car.x = pos[0]; car.y = pos[1]; car.a = pos[2];
    if (car.s >= car.cross.len) {
      node.inside.splice(i, 1);
      car.granted = false;
      car.node = null;
      car.ri++;
      enterLane(car, out, car.s - car.cross.len);
      car.cross = null;
    }
  }

  /* la colère des conducteurs : elle monte quand on attend, et vite quand on se dispute */
  function mood(car) {
    if (car.mode === 'fini' || car.mode === 'gare') return;
    if (car.mode === 'attente') {
      if (car.t0 <= W.time && car.why === 'garage') car.colere += 0.035 * DT;
      return;
    }
    if (car.v < 4) {
      car.waitT += DT;
      let rate = 0.05;                                        // coincé dans la file
      if (car.why === 'dispute') rate = 0.085;
      else if (car.why === 'stop') rate = 0.008;
      else if (car.why === 'cede') rate = 0.03;
      else if (car.why === 'bouche' || car.why === 'occupe') rate = 0.03;
      else {
        /* dans la file : c'est la raison de la voiture de devant qui compte */
        const lane = car.lane;
        const front = lane && lane.cars.find((c) => !c.granted);
        if (front && front !== car && front.why === 'stop') rate = 0.02;
        else if (front && front !== car && front.why === 'cede') rate = 0.035;
      }
      car.colere = Math.min(1, car.colere + rate * DT);
    } else {
      car.waitT = Math.max(0, car.waitT - DT * 2);
      car.colere = Math.max(0, car.colere - 0.03 * DT);
    }
    if (car.colere >= 1 && !car.furieux) {
      car.furieux = true;
      W.events.push({ type: 'furieux', car });
    }
  }

  W.calm = () => W.cars.filter((c) => !c.furieux).length;
  /* qui se dispute en ce moment ? (pour les klaxons et pour Zaza) */
  W.disputes = () => W.cars.filter((c) => c.why === 'dispute' && c.v < 4);
  W.slotKey = (c, r, side) => `${c},${r},${side}`;
  return W;
}

/* ---------- Rejouer une solution sans dessin (vérification, ?debug) ----------
   solution : [{ noeud: [c, r], cote: 'n'|'s'|'e'|'o', panneau: 'stop'|'cede', t? }]
   t : seconde à laquelle on pose le panneau (0 par défaut). */
export function playSolution(level, solution = level.solution || []) {
  const W = createWorld(level);
  const todo = solution.map((s) => ({ ...s }));
  const maxTicks = (level.temps || 180) * TICK_RATE;
  while (!W.over && W.tick < maxTicks) {
    for (const s of todo) {
      if (s.done || (s.t || 0) > W.time) continue;
      s.done = true;
      W.place(`${s.noeud[0]},${s.noeud[1]},${s.cote}`, s.panneau);
    }
    W.step();
    W.events.length = 0;
  }
  return {
    arrived: W.arrived, total: W.total, calm: W.calm(), frayeurs: W.frayeurs,
    time: Math.round(W.time), over: W.over,
    furieux: W.cars.filter((c) => c.furieux).map((c) => c.id),
    bloques: W.cars.filter((c) => c.mode !== 'fini' && c.mode !== 'gare').map((c) => `${c.id}:${c.why || c.mode}`),
  };
}
