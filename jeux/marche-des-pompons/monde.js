// ============================================================================
// La simulation d'un niveau, sans aucun dessin : les Pompons tombent du
// nuage, marchent tout droit, font leur métier (Stop, Pont, Creuseur, Tunnel,
// Grimpeur, Parapluie), rentrent à la maison… ou se perdent.
// Tout avance par petits pas réguliers (30 par seconde), toujours de la même
// façon : une même partie rejouée donne exactement le même résultat, ce qui
// permet au pilote automatique (?debug) de vérifier les solutions des niveaux.
// Le jeu (script.js) lit w.events pour les bruits, les étincelles et Plume.
// ============================================================================

import { parseLevel, makeQueries, VIDE, TERRE, ROCHE, BRIQUE, PLANCHE, EAU, RONCES } from './terrain.js';

export const TICK_RATE = 30;       // pas de simulation par seconde

const STEP = 6;                    // une marche plus haute que 6 pixels = un mur
const BODY_H = 13;                 // la hauteur d'un Pompon
const FALL_V = 3;                  // pixels par pas en tombant
const FLOAT_V = 1;                 // … avec le parapluie ouvert
const FLOAT_OPEN = 10;             // le parapluie s'ouvre après 10 pixels de chute
export const MAX_FALL = 70;        // plus de 4 cubes de chute : aïe !
export const BRICKS = 12;          // briques d'un Pont
const BRICK_TICKS = 10;
const BASH_TICKS = 2;
const DIG_TICKS = 3;
const SHRUG_TICKS = 40;
const SAVE_ANIM = 24;
const LOST_ANIM = 70;

/* les métiers qu'un Pompon garde pour toujours (en plus de son travail) */
export const PERMANENT = { grimpe: true, parapluie: true };
/* les états où un Pompon peut recevoir un métier de travail */
const WORKABLE = ['marche', 'pont', 'tunnel', 'creuse', 'hausse', 'stop'];

const diggable = (k) => k === TERRE || k === BRIQUE || k === PLANCHE;

export function createWorld(level) {
  const T = parseLevel(level);
  const { solid, kind, danger } = makeQueries(T);
  const { W, H, ter } = T;

  const w = {
    T, level, solid, kind, danger,
    tick: 0,
    pompons: [],
    total: level.pompons,
    released: 0,
    saved: 0,
    lost: 0,
    cadence: Math.round((level.cadence || 2) * TICK_RATE),
    nextRelease: Math.round(TICK_RATE * 0.8),
    timeLeft: Math.round((level.temps || 180) * TICK_RATE),
    skills: { ...level.metiers },
    events: [],
    dirty: [],
    over: null,              // 'fini' ou 'temps' quand le niveau s'arrête
    onlyStops: false,        // il ne reste que des Stop debout
  };

  const ev = (type, p, extra) => w.events.push({ type, p, x: p ? p.x : 0, y: p ? p.y : 0, ...extra });

  /* ---------- Changer le terrain ---------- */
  function carve(x0, y0, x1, y1) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    let n = 0;
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
        const i = y * W + x;
        if (diggable(ter[i])) { ter[i] = VIDE; n++; }
      }
    }
    if (n) w.dirty.push([x0 - 2, y0 - 6, x1 + 3, y1 + 6]);
    return n;
  }
  function lay(x0, y0, x1, y1, k) {
    if (x0 > x1) [x0, x1] = [x1, x0];
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
        const i = y * W + x;
        if (ter[i] === VIDE) ter[i] = k;
      }
    }
    w.dirty.push([x0 - 2, y0 - 6, x1 + 3, y1 + 6]);
  }
  const anyIn = (x0, y0, x1, y1, test) => {
    if (x0 > x1) [x0, x1] = [x1, x0];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (test(kind(x, y), x, y)) return true;
    return false;
  };

  /* ---------- Sorties : maison, dangers, vide ---------- */
  function checkFate(p) {
    const S = T.sortie;
    if (S && Math.abs(p.x - S.x) <= 4 && p.y <= S.y + 1 && p.y >= S.y - 18) {
      p.state = 'sauve'; p.work = 0; w.saved++;
      ev('saved', p);
      return true;
    }
    const d = danger(p.x, p.y - 1) || danger(p.x, p.y - 6);
    if (d) { lose(p, d === EAU ? 'eau' : 'ronces'); return true; }
    if (p.y > H + 14) { lose(p, 'vide'); return true; }
    return false;
  }
  function lose(p, why) {
    p.state = 'perdu'; p.work = 0; p.why = why;
    w.lost++;
    ev('lost', p, { why });
  }

  /* ---------- Un pas en avant (marcheurs, creuseurs de tunnel) ---------- */
  function stepForward(p) {
    const nx = p.x + p.dir;
    if (nx < 0 || nx >= W) return 'edge';
    if (solid(nx, p.y - 1)) {
      let k = 1;
      while (k <= STEP && solid(nx, p.y - 1 - k)) k++;
      if (k > STEP) return 'wall';
      p.x = nx; p.y -= k;
      return 'ok';
    }
    if (solid(nx, p.y)) { p.x = nx; return 'ok'; }
    let k = 1;
    while (k <= STEP && !solid(nx, p.y + k)) k++;
    p.x = nx;
    if (k <= STEP) { p.y += k; return 'ok'; }
    p.state = 'tombe'; p.fall = 0;
    return 'fall';
  }

  function walk(p) {
    for (const b of w.pompons) {
      if (b !== p && b.state === 'stop' && Math.abs(b.y - p.y) <= 10
        && (b.x - p.x) * p.dir > 0 && Math.abs(b.x - p.x) <= 6) {
        p.dir = -p.dir;
        return;
      }
    }
    const r = stepForward(p);
    if (r === 'edge') p.dir = -p.dir;
    else if (r === 'wall') {
      if (p.grimpe) { p.state = 'grimpe'; p.work = 0; ev('climb', p); }
      else p.dir = -p.dir;
    }
  }

  function fall(p) {
    const v = p.parapluie && p.fall > FLOAT_OPEN ? FLOAT_V : FALL_V;
    for (let i = 0; i < v; i++) {
      if (solid(p.x, p.y)) {
        const soft = p.parapluie && p.fall > FLOAT_OPEN;
        if (p.fall > MAX_FALL && !soft) { lose(p, 'chute'); return; }
        p.state = 'marche';
        if (p.fall > 8) ev('land', p, { soft });
        return;
      }
      p.y++; p.fall++;
      if (p.parapluie && p.fall === FLOAT_OPEN + 1) ev('umbrella', p);
      if (checkFate(p)) return;
    }
  }

  function climb(p) {
    if (solid(p.x, p.y - BODY_H - 1)) {
      /* un plafond : on lâche et on retombe */
      p.dir = -p.dir; p.state = 'tombe'; p.fall = 0;
      ev('bonk', p);
      return;
    }
    p.y -= 1;
    if (p.y < -BODY_H) { p.dir = -p.dir; p.state = 'tombe'; p.fall = 0; return; }
    if (!solid(p.x + p.dir, p.y - 1)) {
      p.x += p.dir;
      p.state = 'marche';
      ev('climbTop', p);
    }
  }

  function build(p) {
    p.work++;
    if (p.work % BRICK_TICKS !== 0) return;
    if (anyIn(p.x + p.dir * 2, p.y - BODY_H, p.x + p.dir * 7, p.y - 3, (k) => k !== VIDE) || p.x + p.dir * 9 < 0 || p.x + p.dir * 9 >= W) {
      /* un mur ou un plafond : il s'arrête et hausse les épaules (on a le temps de lui donner un autre métier) */
      p.state = 'hausse'; p.work = 0;
      ev('bonk', p);
      return;
    }
    lay(p.x, p.y - 2, p.x + p.dir * 9, p.y - 1, BRIQUE);
    p.bricks--;
    p.x += p.dir * 4; p.y -= 2;
    ev('brick', p, { left: p.bricks });
    if (p.bricks <= 0) { p.state = 'hausse'; p.work = 0; ev('bricksDone', p); }
  }

  /* de la roche devant la tête ou le ventre (une petite marche de roche sous les pieds, on l'enjambe) */
  const rockAhead = (p) => anyIn(p.x + p.dir, p.y - BODY_H, p.x + p.dir * 7, p.y - STEP + 1, (k) => k === ROCHE);

  function bash(p) {
    p.work++;
    if (p.work % BASH_TICKS !== 0) return;
    if (rockAhead(p)) {
      p.state = 'marche';
      ev('rock', p);
      return;
    }
    if (carve(p.x + p.dir, p.y - BODY_H - 1, p.x + p.dir * 8, p.y - 1) && p.work % 6 === 0) ev('bash', p);
    const r = stepForward(p);
    if (r === 'fall') return;
    if (r !== 'ok') { p.state = 'marche'; return; }
    if (!anyIn(p.x + p.dir, p.y - BODY_H, p.x + p.dir * 14, p.y - 1, diggable)) p.state = 'marche';
  }

  function dig(p) {
    p.work++;
    if (p.work % DIG_TICKS !== 0) return;
    if (anyIn(p.x - 3, p.y, p.x + 3, p.y, (k) => k === ROCHE)) {
      p.state = 'marche';
      ev('rock', p);
      return;
    }
    if (carve(p.x - 5, p.y, p.x + 5, p.y) && p.work % 9 === 0) ev('dig', p);
    p.y += 1;
    if (!anyIn(p.x - 4, p.y, p.x + 4, p.y, (k) => k !== VIDE)) { p.state = 'tombe'; p.fall = 0; return; }
    checkFate(p);
  }

  function update(p) {
    p.anim++;
    const s = p.state;
    if (s === 'parti') return;
    if (s === 'sauve') { if (++p.work > SAVE_ANIM) p.state = 'parti'; return; }
    if (s === 'perdu') { if (++p.work > LOST_ANIM) p.state = 'parti'; return; }
    if (s !== 'tombe' && s !== 'grimpe' && !solid(p.x, p.y)) { p.state = 'tombe'; p.fall = 0; }
    switch (p.state) {
      case 'tombe': fall(p); return;
      case 'marche': walk(p); break;
      case 'grimpe': climb(p); return;
      case 'pont': build(p); break;
      case 'tunnel': bash(p); break;
      case 'creuse': dig(p); return;
      case 'hausse': if (++p.work > SHRUG_TICKS) p.state = 'marche'; return;
      case 'stop': return;
      default: return;
    }
    if (p.state !== 'tombe') checkFate(p);
  }

  /* ---------- Un pas de simulation ---------- */
  w.step = function step() {
    if (w.over) return;
    w.tick++;
    if (w.released < w.total && w.tick >= w.nextRelease && T.entree) {
      const id = w.released++;
      w.pompons.push({
        id, x: T.entree.x, y: T.entree.y, dir: level.dir || 1,
        state: 'tombe', fall: 0, work: 0, bricks: 0, anim: (id * 7) % 30,
        grimpe: false, parapluie: false, why: null,
      });
      w.nextRelease += w.cadence;
      ev('release', w.pompons[id]);
    }
    for (const p of w.pompons) update(p);
    if (w.timeLeft > 0) w.timeLeft--;
    if (w.timeLeft <= 0) { w.over = 'temps'; return; }
    if (w.released >= w.total) {
      let active = 0;
      let stops = 0;
      for (const p of w.pompons) {
        if (p.state === 'stop') stops++;
        else if (p.state !== 'parti' && p.state !== 'sauve' && p.state !== 'perdu') active++;
      }
      w.onlyStops = active === 0 && stops > 0;
      if (active === 0 && stops === 0 && w.pompons.every((p) => p.state === 'parti')) w.over = 'fini';
    }
  };

  /* ---------- Donner un métier ---------- */
  w.canTake = function canTake(p, skill) {
    if (!p || p.state === 'sauve' || p.state === 'perdu' || p.state === 'parti') return 'gone';
    if (!(w.skills[skill] > 0)) return 'empty';
    if (skill === 'grimpe') return p.grimpe ? 'already' : 'ok';
    if (skill === 'parapluie') return p.parapluie ? 'already' : 'ok';
    if (p.state === skill) return 'already';
    if (!WORKABLE.includes(p.state)) return 'busy';
    if (skill === 'tunnel') {
      if (rockAhead(p)) return 'rock';
      if (!anyIn(p.x + p.dir, p.y - BODY_H, p.x + p.dir * 14, p.y - 1, diggable)) return 'nothing';
    }
    if (skill === 'creuse') {
      if (anyIn(p.x - 3, p.y, p.x + 3, p.y, (k) => k === ROCHE)) return 'rock';
    }
    return 'ok';
  };

  w.assign = function assign(p, skill) {
    const why = w.canTake(p, skill);
    if (why !== 'ok') return why;
    w.skills[skill]--;
    if (skill === 'grimpe') p.grimpe = true;
    else if (skill === 'parapluie') p.parapluie = true;
    else {
      p.state = skill; p.work = 0;
      if (skill === 'pont') p.bricks = BRICKS;
    }
    ev('assign', p, { skill });
    return 'ok';
  };

  /* un Stop qu'on touche à nouveau repart dans son sens */
  w.free = function free(p) {
    if (!p || p.state !== 'stop') return false;
    p.state = 'marche';
    ev('free', p);
    return true;
  };

  return w;
}

/* ---------- Le pilote automatique : rejoue la solution d'un niveau ----------
   Chaque étape : { p, metier, x?, tick? } — le Pompon n° p (dans l'ordre de
   sortie) reçoit son métier quand il marche exactement en x (et pas avant le
   pas « tick »). « libere » remet un Stop en route. */
export function playSolution(level, steps = level.solution || [], maxTicks = 20000) {
  const w = createWorld(level);
  const todo = steps.map((s) => ({ ...s, done: false }));
  const fails = [];
  while (!w.over && w.tick < maxTicks) {
    for (const s of todo) {
      if (s.done) continue;
      const p = w.pompons[s.p];
      if (!p) continue;
      if (s.tick != null && w.tick < s.tick) continue;
      if ((s.x != null || s.y != null) && p.state !== (s.etat || 'marche')) continue;
      if (s.x != null && p.x !== s.x) continue;
      if (s.y != null && p.y !== s.y) continue;
      s.done = true;
      if (s.metier === 'libere') { if (!w.free(p)) fails.push({ ...s, why: 'pas un Stop' }); continue; }
      const r = w.assign(p, s.metier);
      if (r !== 'ok') fails.push({ ...s, why: r, state: p.state, at: [p.x, p.y] });
    }
    w.step();
    w.events.length = 0;
    w.dirty.length = 0;
    if (w.onlyStops && todo.every((s) => s.done)) break;
  }
  return {
    saved: w.saved, lost: w.lost, total: w.total, ticks: w.tick, over: w.over,
    fails, pending: todo.filter((s) => !s.done).map((s) => `${s.p}:${s.metier}@${s.x}`),
    lostWhy: w.pompons.filter((p) => p.why).map((p) => `${p.id}:${p.why}@${p.x},${p.y}`),
  };
}
