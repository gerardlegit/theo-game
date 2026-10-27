// ============================================================================
// Tests du jalon M1 : règle de taille, croissance, cœurs, énergie, dangers,
// IA des prédateurs, et deux « bots » qui jouent les étapes 1 et 2 en entier.
// ============================================================================

import { test, ok, eq, near } from './runner.js';
import { STEP } from '../js/core/loop.js';
import { createRng } from '../js/core/rng.js';
import { relation, sizeAt, restartGrowth, crossedHalf, stepEnergy, ENERGY_DRAIN, ENERGY_REFILL } from '../js/systems/rules.js';
import { inHeat, currentPush } from '../js/systems/hazards.js';
import { createGrid } from '../js/systems/collision.js';
import { topSpeed, isActiveHunter, AIM_TIME } from '../js/systems/ai.js';
import { createWorld, stepWorld, spawn, INVINCIBLE_TIME } from '../js/systems/world.js';
import { STAGES } from '../js/stages/index.js';
import { CREATURES } from '../js/stages/creatures.js';
import { FR } from '../js/content/fr.js';
import { formatAgo } from '../js/content/time.js';

const { cell: CELL, nucleus: NUCLEUS } = STAGES;
const STILL = { move: { x: 0, y: 0 }, sprint: false };
const steps = (world, seconds, input = STILL) => {
  const out = [];
  for (let i = 0; i < Math.round(seconds / STEP); i++) {
    stepWorld(world, input, STEP);
    out.push(...world.events);
  }
  return out;
};
/* Monde vide (sans spawns) pour tester une règle à la fois */
const emptyWorld = (stage, opts = {}) => createWorld({ ...stage, spawns: [] }, { rng: createRng(1), ...opts });
const addCreature = (world, def, x, y, size) => {
  const c = spawn(world, { def, count: 1, respawnSec: 5 });
  c.x = c.px = x;
  c.y = c.py = y;
  if (size) c.size = size;
  return c;
};

/* ---------- Règle de taille ---------- */
test('taille : < 80 % mangeable, > 120 % dangereux, entre les deux neutre', () => {
  eq(relation(10, 7.9), 'edible');
  eq(relation(10, 8), 'neutral');
  eq(relation(10, 12), 'neutral');
  eq(relation(10, 12.1), 'danger');
});

test('taille : la croissance fait passer un prédateur du rouge au vert (étape 2)', () => {
  for (const size of [17, 20]) {
    eq(relation(sizeAt(NUCLEUS, 0), size), 'danger', `amibe ${size} au début`);
    eq(relation(sizeAt(NUCLEUS, NUCLEUS.growthGoal), size), 'edible', `amibe ${size} à la fin`);
  }
});

test('taille : la nourriture est toujours mangeable dès le début', () => {
  for (const stage of [CELL, NUCLEUS]) {
    const def = CREATURES[stage.spawns[0].def];
    eq(relation(stage.playerStart.size, def.size), 'edible', stage.id);
  }
});

/* ---------- Croissance ---------- */
test('croissance : la taille va du début à la fin de l’étape', () => {
  eq(sizeAt(CELL, 0), 10);
  eq(sizeAt(CELL, 5), 15);
  eq(sizeAt(CELL, 10), 20);
  eq(sizeAt(CELL, 99), 20);
});

test('croissance : on garde la moitié de la jauge après un échec', () => {
  eq(restartGrowth(7), 3);
  eq(restartGrowth(10), 5);
  eq(restartGrowth(0), 0);
});

test('croissance : le palier de 50 % ne se déclenche qu’une fois', () => {
  ok(crossedHalf(4, 5, 10));
  ok(!crossedHalf(5, 6, 10));
  ok(crossedHalf(5, 6, 12));
});

/* ---------- Énergie ---------- */
test('énergie : se vide en sprintant, se recharge en 3 s', () => {
  const s = { energy: 1, tired: false };
  let sprinted = 0;
  for (let i = 0; i < 400 && !s.tired; i++) if (stepEnergy(s, true, STEP)) sprinted += STEP;
  near(sprinted, ENERGY_DRAIN, 0.05);
  ok(s.tired, 'fatigué quand la jauge est vide');
  for (let i = 0; i < Math.round(ENERGY_REFILL / STEP); i++) stepEnergy(s, false, STEP);
  near(s.energy, 1, 0.01);
});

test('énergie : manger redonne de l’énergie, le sprint va plus vite', () => {
  const w = emptyWorld(NUCLEUS);
  w.player.energy = 0.2;
  addCreature(w, 'bacterium', w.player.x + 5, w.player.y);
  stepWorld(w, STILL, STEP);
  ok(w.player.energy > 0.4, `énergie ${w.player.energy}`);
  const a = emptyWorld(NUCLEUS);
  const b = emptyWorld(NUCLEUS);
  steps(a, 1, { move: { x: 1, y: 0 }, sprint: false });
  steps(b, 1, { move: { x: 1, y: 0 }, sprint: true });
  ok(b.player.x > a.player.x + 40, 'le sprint ne va pas plus vite');
});

test('énergie : pas de sprint à l’étape 1', () => {
  const a = emptyWorld(CELL);
  const b = emptyWorld(CELL);
  steps(a, 1, { move: { x: 1, y: 0 }, sprint: false });
  steps(b, 1, { move: { x: 1, y: 0 }, sprint: true });
  near(b.player.x, a.player.x, 1e-6);
});

/* ---------- Manger ---------- */
test('manger : +1 croissance, le corps grossit, la molécule réapparaît plus tard', () => {
  const w = emptyWorld(CELL);
  const p = w.player;
  addCreature(w, 'molecule', p.x + 4, p.y);
  const ev = steps(w, STEP);
  ok(ev.some((e) => e.type === 'eat'), 'pas mangé');
  eq(w.growth, 1);
  eq(w.creatures.length, 0);
  steps(w, 1);
  ok(p.size > 10.5, `taille ${p.size}`);
  steps(w, 4.5);
  eq(w.creatures.length, 1, 'réapparition (5 s pour cette molécule de test)');
});

test('manger : on ne mange pas ce qui est neutre, on se repousse', () => {
  const w = emptyWorld(NUCLEUS);
  const p = w.player;
  const c = addCreature(w, 'amoeba', p.x + 10, p.y, 12);
  steps(w, STEP);
  eq(w.growth, 0);
  ok(Math.hypot(c.x - p.x, c.y - p.y) >= p.size + c.size - 0.01, 'toujours superposés');
});

test('palier 50 % : une cellule rapide arrive à l’étape 2', () => {
  const w = emptyWorld(NUCLEUS, { growth: 5 });
  addCreature(w, 'bacterium', w.player.x + 5, w.player.y);
  const ev = steps(w, STEP);
  ok(ev.some((e) => e.type === 'milestone'), 'pas de palier');
  ok(w.creatures.some((c) => c.def.id === 'fastAmoeba'), 'pas de nouvelle cellule');
});

test('jauge pleine : l’étape est gagnée', () => {
  const w = emptyWorld(CELL, { growth: 9 });
  addCreature(w, 'molecule', w.player.x + 3, w.player.y);
  const ev = steps(w, STEP);
  ok(ev.some((e) => e.type === 'complete'));
  ok(w.done);
});

/* ---------- Cœurs ---------- */
test('cœurs : touché par un prédateur → 1 cœur perdu, invincible 2 s', () => {
  const w = emptyWorld(NUCLEUS);
  const p = w.player;
  const c = addCreature(w, 'bigAmoeba', p.x + 20, p.y);
  c.state = 'chase';
  const ev = steps(w, STEP);
  ok(ev.some((e) => e.type === 'hurt' && e.cause === 'predator'), 'pas touché');
  eq(w.hearts, 2);
  near(p.invincible, INVINCIBLE_TIME, 0.02);
  ok(!isActiveHunter(c), 'le prédateur doit se calmer');
  c.x = p.x + 5;
  c.y = p.y;
  steps(w, 1);
  eq(w.hearts, 2, 'invincible pendant 2 s');
});

test('cœurs : 3 cœurs perdus → l’étape recommence avec la moitié de la jauge', () => {
  const w = emptyWorld(NUCLEUS, { growth: 7 });
  const p = w.player;
  const c = addCreature(w, 'bigAmoeba', p.x, p.y);
  let dead = false;
  for (let i = 0; i < 3; i++) {
    p.invincible = 0;
    c.x = p.x + 5;
    c.y = p.y;
    dead = steps(w, STEP).some((e) => e.type === 'dead');
  }
  ok(dead && w.dead, 'pas d’événement dead');
  const again = createWorld(NUCLEUS, { rng: createRng(2), growth: restartGrowth(w.growth) });
  eq(again.growth, 3);
  eq(again.hearts, 3);
  near(again.player.size, sizeAt(NUCLEUS, 3), 1e-9);
});

test('cœurs : mode facile = 5 cœurs, prédateurs 30 % plus lents', () => {
  const w = emptyWorld(NUCLEUS, { easy: true });
  eq(w.hearts, 5);
  near(w.speedFactor, 0.7, 1e-9);
  eq(w.maxActiveHunters, 1);
});

/* ---------- Dangers ---------- */
test('eau trop chaude : y rester 1 s retire 1 cœur', () => {
  const w = emptyWorld(CELL);
  const h = CELL.hazards.find((z) => z.type === 'heat');
  const p = w.player;
  ok(inHeat(CELL.hazards, h.x, h.y));
  let hurt = 0;
  for (let i = 0; i < Math.round(1.5 / STEP); i++) {
    p.x = h.x;
    p.y = h.y;
    stepWorld(w, STILL, STEP);
    hurt += w.events.filter((e) => e.type === 'hurt' && e.cause === 'heat').length;
    if (i === Math.round(0.9 / STEP)) eq(hurt, 0, 'trop tôt');
  }
  eq(hurt, 1);
});

test('courant : pousse le joueur dans son sens', () => {
  const cur = CELL.hazards.find((z) => z.type === 'current');
  const push = currentPush(CELL.hazards, cur.x + 10, cur.y + 10);
  near(push.x, cur.speed * cur.dx, 1e-9);
  const w = emptyWorld(CELL);
  w.player.x = cur.x + cur.w / 2;
  w.player.y = cur.y + cur.h / 2;
  const x0 = w.player.x;
  steps(w, 1);
  ok(w.player.x > x0 + cur.speed * 0.8, `x ${x0} → ${w.player.x}`);
});

test('courant : le joueur peut nager contre le courant', () => {
  const cur = CELL.hazards.find((z) => z.type === 'current');
  ok(CELL.playerStart.maxSpeed > cur.speed * 1.5);
});

/* ---------- IA des prédateurs ---------- */
test('hunter : s’arrête 0,4 s, yeux rouges, avant de foncer', () => {
  const w = emptyWorld(NUCLEUS);
  const p = w.player;
  const c = addCreature(w, 'amoeba', p.x + 200, p.y);
  steps(w, STEP);
  eq(c.state, 'aim', 'doit viser');
  steps(w, AIM_TIME - 2 * STEP);
  eq(c.state, 'aim', 'fonce trop tôt');
  steps(w, 4 * STEP);
  eq(c.state, 'chase');
});

test('hunter : abandonne après 4 s de poursuite', () => {
  const w = emptyWorld(NUCLEUS);
  const p = w.player;
  const c = addCreature(w, 'amoeba', p.x + 300, p.y);
  // le joueur fuit en sprintant de temps en temps : il ne se fait pas attraper
  let gaveUp = false;
  for (let i = 0; i < Math.round(6 / STEP); i++) {
    p.x = c.x - 260;
    p.y = c.y;
    p.invincible = 1;
    stepWorld(w, STILL, STEP);
    if (i * STEP > AIM_TIME + 0.1 && c.state === 'patrol') { gaveUp = true; break; }
  }
  ok(gaveUp, `état ${c.state}`);
  ok(c.cooldown > 0, 'pause avant de recommencer');
});

test('hunter : fuit quand le joueur est devenu plus gros', () => {
  const w = emptyWorld(NUCLEUS, { growth: 12 });
  w.player.size = sizeAt(NUCLEUS, 12);
  const c = addCreature(w, 'amoeba', w.player.x + 150, w.player.y, 17);
  const d0 = Math.hypot(c.x - w.player.x, c.y - w.player.y);
  steps(w, 0.5);
  eq(c.state, 'flee');
  ok(Math.hypot(c.x - w.player.x, c.y - w.player.y) > d0);
});

test('hunter : jamais plus de 2 chasseurs actifs (1 en mode facile)', () => {
  for (const [easy, max] of [[false, 2], [true, 1]]) {
    const w = emptyWorld(NUCLEUS, { easy });
    const p = w.player;
    for (let i = 0; i < 4; i++) addCreature(w, 'amoeba', p.x + Math.cos(i * 1.6) * 220, p.y + Math.sin(i * 1.6) * 220);
    let most = 0;
    for (let i = 0; i < 120; i++) {
      p.invincible = 1;
      stepWorld(w, STILL, STEP);
      most = Math.max(most, w.creatures.filter(isActiveHunter).length);
    }
    eq(most, max, easy ? 'mode facile' : 'mode normal');
  }
});

test('équilibrage : aucun prédateur ne dépasse 95 % du sprint du joueur', () => {
  for (const stage of Object.values(STAGES)) {
    const defs = [...stage.spawns, ...(stage.milestone50 && stage.milestone50.spawn ? [stage.milestone50.spawn] : [])]
      .map((s) => CREATURES[s.def]).filter((d) => d.ai === 'hunter');
    if (!defs.length) continue;
    ok(stage.sprint, `${stage.id} : des prédateurs mais pas de sprint`);
    const sprint = stage.playerStart.maxSpeed * stage.sprint.speed;
    for (const d of defs) ok(topSpeed(d) <= sprint * 0.95, `${stage.id} / ${d.id} : ${topSpeed(d)} > ${sprint * 0.95}`);
  }
});

/* ---------- Grille spatiale ---------- */
test('grille : trouve les voisins, pas les lointains', () => {
  const g = createGrid(128);
  const a = { x: 100, y: 100 };
  const b = { x: 180, y: 120 };
  const far = { x: 900, y: 900 };
  [a, b, far].forEach((e) => g.insert(e));
  const found = g.query(110, 110, 100);
  ok(found.includes(a) && found.includes(b), 'voisins manquants');
  ok(!found.includes(far), 'trop loin');
  g.clear();
  eq(g.query(110, 110, 100).length, 0);
});

/* ---------- Contenu ---------- */
test('contenu : chaque étape a ses textes, sa fiche et une époque', () => {
  for (const id of Object.keys(STAGES)) {
    ok(FR.stages[id] && FR.stages[id].name, `${id} : nom`);
    ok(FR.cards[id] && FR.cards[id].fact, `${id} : fiche`);
    ok(FR.hint[id], `${id} : aide`);
    ok(STAGES[id].ago > 0, `${id} : époque`);
  }
});

test('contenu : phrases courtes (moins de 15 mots)', () => {
  const sentences = [];
  const walk = (o) => Object.values(o).forEach((v) => (typeof v === 'string' ? sentences.push(...v.split(/[.!?…]\s/)) : walk(v)));
  walk(FR.stages);
  walk(FR.milestones);
  walk(FR.hurt);
  walk(FR.cards);
  const words = (s) => s.trim().split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  for (const s of sentences) ok(words(s) < 15, `trop long : « ${s} »`);
});

test('époques : affichage en milliards et millions', () => {
  eq(formatAgo(3800), '3,8 milliards d’années');
  eq(formatAgo(1500), '1,5 milliard d’années');
  eq(formatAgo(2000), '2 milliards d’années');
  eq(formatAgo(600), '600 millions d’années');
});

/* ---------- Parties complètes jouées par un bot ---------- */
/* Le bot fuit ce qui est rouge et l'eau chaude, et va vers ce qui est vert le plus proche */
function bot(world) {
  const p = world.player;
  let fx = 0;
  let fy = 0;
  for (const c of world.creatures) {
    if (relation(p.size, c.size) !== 'danger') continue;
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy);
    const r = 260 + c.size;
    if (d < r) { fx += dx / d * (r - d) / r; fy += dy / d * (r - d) / r; }
  }
  for (const h of world.hazards) {
    if (h.type !== 'heat') continue;
    const dx = p.x - h.x;
    const dy = p.y - h.y;
    const d = Math.hypot(dx, dy);
    if (d < h.r + p.size + 50) { fx += dx / d; fy += dy / d; }
  }
  if (fx || fy) {
    const d = Math.hypot(fx, fy);
    return { move: { x: fx / d, y: fy / d }, sprint: true };
  }
  let best = null;
  let bd = Infinity;
  for (const c of world.creatures) {
    if (relation(p.size, c.size) !== 'edible') continue;
    if (inHeat(world.hazards, c.x, c.y, p.size + 20)) continue;
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bd) { bd = d; best = c; }
  }
  if (!best) return STILL;
  return { move: { x: (best.x - p.x) / bd, y: (best.y - p.y) / bd }, sprint: false };
}

function playStage(stage, seed, limit = 600) {
  let world = createWorld(stage, { rng: createRng(seed) });
  let time = 0;
  let restarts = 0;
  while (time < limit) {
    stepWorld(world, bot(world), STEP);
    time += STEP;
    if (world.done) return { time, restarts };
    if (world.dead) {
      restarts++;
      world = createWorld(stage, { rng: createRng(seed + restarts), growth: restartGrowth(world.growth) });
    }
  }
  return { time, restarts, failed: true };
}

test('bot : l’étape 1 se termine en 1 à 3 minutes de jeu', () => {
  for (const seed of [1, 2, 3]) {
    const r = playStage(CELL, seed);
    ok(!r.failed, `graine ${seed} : pas fini`);
    ok(r.time < 180, `graine ${seed} : ${r.time.toFixed(0)} s`);
  }
});

test('bot : l’étape 2 se termine (prédateurs compris)', () => {
  for (const seed of [1, 2, 3]) {
    const r = playStage(NUCLEUS, seed);
    ok(!r.failed, `graine ${seed} : pas fini après ${r.time.toFixed(0)} s`);
    ok(r.time < 240, `graine ${seed} : ${r.time.toFixed(0)} s, ${r.restarts} reprise(s)`);
  }
});
