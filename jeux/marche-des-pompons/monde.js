// ============================================================================
// La simulation d'un niveau, sans aucun dessin : les Pompons tombent du
// nuage, marchent tout droit, font leur métier (Stop, Pont, Creuseur, Tunnel,
// Grimpeur, Parapluie, Échelle, Friandise, Toboggan), rentrent à la maison…
// ou se perdent (dans l'eau, la lave, les ronces… ou dans la bouche d'un clown).
// Tout avance par petits pas réguliers (30 par seconde), toujours de la même
// façon : une même partie rejouée donne exactement le même résultat, ce qui
// permet au pilote automatique (?debug) de vérifier les solutions des niveaux.
// Le jeu (script.js) lit w.events pour les bruits, les étincelles et Plume.
// ============================================================================

import { parseLevel, makeQueries, VIDE, TERRE, ROCHE, BRIQUE, PLANCHE, EAU, RONCES, LAVE } from './terrain.js';

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
/* l'Échelle : on la pose contre un mur (pour monter) ou au bord d'un trou (pour descendre) */
export const MAX_LADDER = 112;     // 7 cubes au plus
const LADDER_REACH = 24;           // le mur ou le bord doit être à 1 cube et demi devant
const LADDER_TICKS = 14;           // le temps de dresser l'échelle
/* la Fête foraine : les clowns, les friandises qu'on leur lance, les toboggans */
const CLOWN_EVERY = 2;             // un clown avance d'un pixel tous les 2 pas (deux fois moins vite qu'un Pompon)
const CHEW_TICKS = 36;             // il mâche un moment après avoir gobé un Pompon
const THROW_TICKS = 12;
const CANDY_VX = 3.5, CANDY_VY = -1.5, CANDY_G = 0.08;   // une friandise part en cloche…
const CANDY_ROLL = 3;              // … rebondit, puis roule tout droit jusqu'à un clown ou un mur
const CANDY_LIFE = 900;            // (30 secondes au plus)
const SLIDE_TICKS = 14;
export const MAX_SLIDE = 160;      // un toboggan descend de 10 cubes au plus (et avance d'autant)
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
    ladders: [],             // les échelles posées : { x, top, bottom, up }
    slides: [],              // les toboggans : { x0, top, x1, bottom, dir }
    candies: [],             // les friandises en vol
    clowns: (T.clowns || []).map((c, i) => ({ id: i, x: c.x, y: c.y, dir: -1, still: c.still, state: 'marche', work: 0, anim: i * 11 })),
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
    if (d) { lose(p, d === EAU ? 'eau' : d === LAVE ? 'lave' : 'ronces'); return true; }
    if (eatenBy(p)) return true;
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
      if (b !== p && (b.state === 'stop' || (b.state === 'lance' && b.after === 'stop')) && Math.abs(b.y - p.y) <= 10
        && (b.x - p.x) * p.dir > 0 && Math.abs(b.x - p.x) <= 6) {
        p.dir = -p.dir;
        return;
      }
    }
    /* une échelle juste devant : on monte (en bas) ou on descend (en haut), dans les deux sens */
    for (const L of w.ladders) {
      const ahead = (L.x - p.x) * p.dir;
      if (ahead < 1 || ahead > 4) continue;
      if (Math.abs(p.y - L.bottom) <= 3) { mount(p, L, 'monte'); return; }
      if (Math.abs(p.y - L.top) <= 3) { mount(p, L, 'descend'); return; }
    }
    /* le haut d'un toboggan, dans le bon sens : on glisse ! */
    for (const S of w.slides) {
      const ahead = (S.x0 - p.x) * p.dir;
      if (p.dir !== S.dir || ahead < 1 || ahead > 4 || Math.abs(p.y - S.top) > 3) continue;
      p.x = S.x0; p.y = S.top; p.state = 'glisse'; p.slide = S;
      ev('slideOn', p);
      return;
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

  /* ---------- L'Échelle ---------- */
  function mount(p, L, way) {
    p.x = L.x;
    p.y = way === 'monte' ? L.bottom : L.top;
    p.state = way;
    p.ladder = L;
    ev('ladderOn', p);
  }
  function climbLadder(p) {
    const L = p.ladder;
    if (p.state === 'monte') {
      p.y -= 1;
      if (checkFate(p)) return;
      if (p.y <= L.top) {
        /* en haut : on pose le pied sur le sol d'en haut */
        p.y = L.top; p.x = L.x + L.up * 4; p.dir = L.up; p.state = 'marche';
        ev('ladderOff', p);
      }
    } else {
      p.y += 1;
      if (checkFate(p)) return;
      if (p.y >= L.bottom) {
        p.y = L.bottom; p.x = L.x - L.up * 2; p.dir = -L.up; p.state = 'marche';
        ev('ladderOff', p);
      }
    }
  }
  /* où l'échelle irait si ce Pompon la posait maintenant (ou pourquoi c'est impossible) */
  function planLadder(p) {
    const { dir } = p;
    for (let dx = 1; dx <= LADDER_REACH; dx++) {
      const cx = p.x + dir * dx;
      if (cx < 0 || cx >= W) return { why: 'nothing' };
      if (solid(cx, p.y - 1)) {
        /* un mur : on mesure sa hauteur */
        let t = p.y - 1;
        while (t >= 0 && solid(cx, t)) t--;
        const top = t + 1;
        const h = p.y - top;
        if (h <= STEP) return { why: 'nothing' };
        if (t < 0 || h > MAX_LADDER) return { why: 'tooHigh' };
        const lx = cx - dir * 3;
        if (anyIn(lx, top - BODY_H, lx, p.y - 1, (k) => k !== VIDE)) return { why: 'blocked' };
        return { L: { x: lx, top, bottom: p.y, up: dir } };
      }
      if (!solid(cx, p.y)) {
        let k = 1;
        while (k <= STEP && !solid(cx, p.y + k)) k++;
        if (k <= STEP) continue;            // une petite marche qui descend : ce n'est pas un bord
        /* un bord : l'échelle pend dans le vide jusqu'au sol d'en bas */
        const lx = cx + dir * 2;
        let g = p.y;
        while (g < H && !solid(lx, g)) g++;
        if (g >= H || g - p.y > MAX_LADDER) return { why: 'tooHigh' };
        if (anyIn(lx, p.y - BODY_H, lx, g - 1, (q) => q !== VIDE)) return { why: 'blocked' };
        return { L: { x: lx, top: p.y, bottom: g, up: -dir } };
      }
    }
    return { why: 'nothing' };
  }
  /* ---------- Le Toboggan ---------- */
  function planSlide(p) {
    const { dir } = p;
    let ex = -1;
    for (let dx = 1; dx <= LADDER_REACH; dx++) {
      const cx = p.x + dir * dx;
      if (cx < 0 || cx >= W || solid(cx, p.y - 1)) return { why: 'nothing' };
      if (!solid(cx, p.y)) {
        let k = 1;
        while (k <= STEP && !solid(cx, p.y + k)) k++;
        if (k <= STEP) continue;
        ex = cx;
        break;
      }
    }
    if (ex < 0) return { why: 'nothing' };
    /* il descend en diagonale (on avance autant qu'on descend) jusqu'au premier sol */
    for (let k = 1; k <= MAX_SLIDE; k++) {
      const x = ex + dir * k;
      const y = p.y + k;
      if (x < 0 || x >= W || y >= H) return { why: 'tooHigh' };
      if (solid(x, y)) {
        if (solid(x, y - 1)) return { why: 'blocked' };
        return { S: { x0: ex, top: p.y, x1: x, bottom: y, dir } };
      }
    }
    return { why: 'tooHigh' };
  }
  function raiseSlide(p) {
    p.work++;
    if (p.work < SLIDE_TICKS) return;
    const S = { ...p.plan, id: w.slides.length, born: w.tick };
    w.slides.push(S);
    ev('slide', p, { S });
    p.x = S.x0; p.y = S.top; p.dir = S.dir; p.state = 'glisse'; p.slide = S;
  }
  function slide(p) {
    const S = p.slide;
    p.x += S.dir * 2;
    p.y += 2;
    if ((p.x - S.x1) * S.dir >= 0) {
      p.x = S.x1; p.y = S.bottom; p.dir = S.dir; p.state = 'marche';
      ev('slideOff', p);
    }
    checkFate(p);
  }

  /* ---------- La Friandise ---------- */
  function throwCandy(p) {
    p.work++;
    if (p.work === 6) {
      w.candies.push({ x: p.x + p.dir * 4, y: p.y - 10, vx: CANDY_VX * p.dir, vy: CANDY_VY, t: 0, alive: true, id: w.tick * 100 + p.id });
      ev('throw', p);
    }
    if (p.work >= THROW_TICKS) p.state = p.after || 'marche';
  }
  const candyStops = (k, why) => { k.alive = false; ev('candyLand', null, { x: k.x, y: Math.min(k.y, H), why }); };
  /* la friandise touche le terrain : un mur l'arrête, un sol la fait rebondir, puis rouler */
  function bounceCandy(k) {
    const rx = Math.round(k.x);
    const ry = Math.round(k.y);
    if (rx < 0 || rx >= W) { candyStops(k, 'mur'); return; }
    if (ry > H + 20 || k.t > CANDY_LIFE) { candyStops(k, 'vide'); return; }
    if (danger(rx, ry)) { candyStops(k, 'eau'); return; }
    if (!solid(rx, ry)) return;
    const dir = Math.sign(k.vx) || 1;
    /* on regarde le sol à cet endroit : une petite marche, on monte dessus ; plus haut, c'est un mur */
    let up = 0;
    while (up <= STEP + 1 && solid(rx, ry - up)) up++;
    const sideways = solid(rx, Math.round(k.y - k.vy)) && !solid(rx - dir * 4, Math.round(k.y - k.vy));
    if (sideways && up > STEP) { candyStops(k, 'mur'); return; }
    k.y = ry - up;
    if (k.rolling || Math.abs(k.vy) < 1.2) {
      k.rolling = true;
      k.vy = 0;
      k.vx = dir * CANDY_ROLL;
    } else {
      k.vy = -Math.abs(k.vy) * 0.5;
      k.vx = dir * Math.max(CANDY_ROLL, Math.abs(k.vx) * 0.9);
      ev('candyBounce', null, { x: k.x, y: k.y });
    }
  }
  function moveCandies() {
    for (const k of w.candies) {
      k.t++;
      if (k.rolling) {
        /* elle roule : elle suit le sol, et retombe si le sol s'arrête */
        k.x += k.vx;
        const rx = Math.round(k.x);
        const ry = Math.round(k.y);
        if (!solid(rx, ry + 1)) {
          let d = 1;
          while (d <= STEP && !solid(rx, ry + 1 + d)) d++;
          if (d <= STEP) k.y += d;
          else { k.rolling = false; k.vy = 0; }
        }
      } else {
        k.x += k.vx;
        k.y += k.vy;
        k.vy += CANDY_G;
      }
      for (const c of w.clowns) {
        if (c.state === 'pouf' || c.state === 'parti') continue;
        if (Math.abs(k.x - c.x) <= 9 && k.y >= c.y - 26 && k.y <= c.y + 1) {
          k.alive = false;
          c.state = 'pouf'; c.work = 0;
          ev('clownDown', null, { x: c.x, y: c.y });
          break;
        }
      }
      if (!k.alive) continue;
      bounceCandy(k);
    }
    w.candies = w.candies.filter((k) => k.alive);
  }

  /* ---------- Les méchants clowns ---------- */
  /* un Pompon qui arrive sur un clown se fait gober */
  const onLadder = (p) => p.state === 'monte' || p.state === 'descend' || p.state === 'glisse';
  function eatenBy(p) {
    if (onLadder(p)) return false;            // sur une échelle ou un toboggan, un clown ne peut pas l'attraper
    for (const c of w.clowns) {
      if (c.state === 'pouf' || c.state === 'parti') continue;
      if (Math.abs(p.x - c.x) <= 6 && p.y >= c.y - 20 && p.y <= c.y + 3) {
        c.state = 'mange'; c.work = CHEW_TICKS;
        lose(p, 'clown');
        ev('chomp', null, { x: c.x, y: c.y });
        return true;
      }
    }
    return false;
  }
  function clownStep(c) {
    const nx = c.x + c.dir;
    if (nx < 3 || nx >= W - 3) { c.dir = -c.dir; return; }
    let ny = c.y;
    if (solid(nx, c.y - 1)) {
      let k = 1;
      while (k <= STEP && solid(nx, c.y - 1 - k)) k++;
      if (k > STEP) { c.dir = -c.dir; return; }
      ny = c.y - k;
    } else if (!solid(nx, c.y)) {
      let k = 1;
      while (k <= STEP && !solid(nx, c.y + k)) k++;
      if (k > STEP) { c.dir = -c.dir; return; }   // un clown ne saute jamais dans le vide
      ny = c.y + k;
    }
    if (danger(nx + c.dir * 4, ny - 1)) { c.dir = -c.dir; return; }
    c.x = nx; c.y = ny;
  }
  function moveClowns() {
    for (const c of w.clowns) {
      c.anim++;
      if (c.state === 'parti') continue;
      if (c.state === 'pouf') { if (++c.work > 30) c.state = 'parti'; continue; }
      if (c.state === 'mange') { if (--c.work <= 0) c.state = 'marche'; }
      else if (!c.still && c.anim % CLOWN_EVERY === 0) clownStep(c);
      /* un clown qui avance sur un Pompon le gobe aussi */
      for (const p of w.pompons) {
        if (p.state === 'parti' || p.state === 'sauve' || p.state === 'perdu' || onLadder(p)) continue;
        if (Math.abs(p.x - c.x) <= 6 && p.y >= c.y - 20 && p.y <= c.y + 3) {
          c.state = 'mange'; c.work = CHEW_TICKS;
          lose(p, 'clown');
          ev('chomp', null, { x: c.x, y: c.y });
        }
      }
    }
  }

  function raiseLadder(p) {
    p.work++;
    if (p.work < LADDER_TICKS) return;
    const L = { ...p.plan, id: w.ladders.length, born: w.tick };
    w.ladders.push(L);
    ev('ladder', p, { L });
    /* celui qui l'a posée l'essaie le premier */
    mount(p, L, L.up === p.dir ? 'monte' : 'descend');
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
    if (s === 'monte' || s === 'descend') { climbLadder(p); return; }
    if (s === 'glisse') { slide(p); return; }
    if (s !== 'tombe' && s !== 'grimpe' && !solid(p.x, p.y)) { p.state = 'tombe'; p.fall = 0; }
    switch (p.state) {
      case 'tombe': fall(p); return;
      case 'marche': walk(p); break;
      case 'grimpe': climb(p); return;
      case 'pont': build(p); break;
      case 'tunnel': bash(p); break;
      case 'creuse': dig(p); return;
      case 'echelle': raiseLadder(p); return;
      case 'toboggan': raiseSlide(p); return;
      case 'lance': throwCandy(p); return;
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
    moveCandies();
    moveClowns();
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
    if (skill === 'friandise' && (p.state === 'monte' || p.state === 'descend' || p.state === 'glisse')) return 'ok';   // on peut lancer depuis une échelle ou un toboggan
    if (!WORKABLE.includes(p.state)) return 'busy';
    if (skill === 'friandise') return 'ok';      // même un Stop peut lancer une friandise (et il reste un Stop)
    if (skill === 'tunnel') {
      if (rockAhead(p)) return 'rock';
      if (!anyIn(p.x + p.dir, p.y - BODY_H, p.x + p.dir * 14, p.y - 1, diggable)) return 'nothing';
    }
    if (skill === 'creuse') {
      if (anyIn(p.x - 3, p.y, p.x + 3, p.y, (k) => k === ROCHE)) return 'rock';
    }
    if (skill === 'echelle') {
      if (p.state === 'stop') return 'busy';
      const plan = planLadder(p);
      if (!plan.L) return plan.why;
    }
    if (skill === 'toboggan') {
      if (p.state === 'stop') return 'busy';
      const plan = planSlide(p);
      if (!plan.S) return plan.why;
    }
    return 'ok';
  };

  w.assign = function assign(p, skill) {
    const why = w.canTake(p, skill);
    if (why !== 'ok') return why;
    w.skills[skill]--;
    if (skill === 'friandise' && (p.state === 'monte' || p.state === 'descend' || p.state === 'glisse')) {
      /* lancée depuis l'échelle ou le toboggan, vers le côté où l'on va arriver */
      const d = p.state === 'glisse' ? p.slide.dir : p.state === 'monte' ? p.ladder.up : -p.ladder.up;
      w.candies.push({ x: p.x + d * 4, y: p.y - 10, vx: CANDY_VX * d, vy: CANDY_VY, t: 0, alive: true, id: w.tick * 100 + p.id });
      ev('assign', p, { skill });
      ev('throw', p);
      return 'ok';
    }
    p.prev = p.state;
    if (skill === 'grimpe') p.grimpe = true;
    else if (skill === 'parapluie') p.parapluie = true;
    else {
      p.state = skill; p.work = 0;
      if (skill === 'pont') p.bricks = BRICKS;
      if (skill === 'echelle') p.plan = planLadder(p).L;
      if (skill === 'toboggan') p.plan = planSlide(p).S;
      if (skill === 'friandise') { p.after = p.prev === 'stop' ? 'stop' : 'marche'; p.state = 'lance'; }
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
