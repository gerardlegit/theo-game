// ============================================================================
// Le monde d'une étape : le joueur, les créatures, les dangers, et toutes les
// règles (manger, être mangé, grandir, perdre un cœur). Aucun dessin ni DOM
// ici : la scène lit l'état et la liste d'événements, les tests aussi.
//
// Événements produits à chaque pas (world.events) :
//   { type: 'eat', x, y, def }        le joueur a mangé quelque chose
//   { type: 'hurt', cause, x, y }     cœur perdu ('predator' ou 'heat')
//   { type: 'milestone' }             la jauge passe la moitié
//   { type: 'complete' }              jauge pleine : l'étape est gagnée
//   { type: 'dead' }                  plus de cœurs
// ============================================================================

import { CREATURES } from '../stages/creatures.js';
import { createPlayer, createCreature } from '../entities/creature.js';
import { steerBody, clampToArena, turnToward } from './movement.js';
import { relation, sizeAt, crossedHalf, stepEnergy, HEARTS, ENERGY_BITE } from './rules.js';
import { inHeat, currentPush, stepHeat } from './hazards.js';
import { updateDrifter, updateHunter, calmHunters, isActiveHunter } from './ai.js';
import { createGrid } from './collision.js';

export const INVINCIBLE_TIME = 2;  // s après un cœur perdu
const GROW_RATE = 6;               // vitesse à laquelle le corps atteint sa nouvelle taille
const KNOCKBACK = 220;             // unités / s : on est repoussé quand on est attrapé
const MAX_CREATURE_SIZE = 60;      // pour la recherche dans la grille

/**
 * options : rng (hasard), growth (croissance de départ, ex. moitié après un échec),
 *           easy (mode facile : 5 cœurs, prédateurs 30 % plus lents, 1 chasseur actif)
 */
export function createWorld(stage, { rng = Math.random, growth = 0, easy = false } = {}) {
  if (!rng.range) rng.range = (a, b) => a + (b - a) * rng();
  const start = sizeAt(stage, growth);
  const world = {
    stage, rng, easy,
    arena: stage.arena,
    hazards: stage.hazards,
    time: 0,
    player: createPlayer(stage.arena.w / 2, stage.arena.h / 2, start),
    creatures: [],
    respawns: [],
    events: [],
    growth,
    goal: stage.growthGoal,
    hearts: easy ? 5 : HEARTS,
    maxHearts: easy ? 5 : HEARTS,
    milestoneDone: growth >= stage.growthGoal / 2,
    done: false,
    dead: false,
    eaten: false,                  // une créature mangée à retirer de la liste
    hidden: false,                 // le joueur est-il caché (terrier, sable… plus tard)
    speedFactor: easy ? 0.7 : 1,
    maxActiveHunters: easy ? 1 : 2,
    grid: createGrid(),
    near: [],
    push: { x: 0, y: 0 },
  };
  for (const entry of stage.spawns) {
    for (let i = 0; i < entry.count; i++) spawn(world, entry, i, true);
  }
  return world;
}

/* Fait apparaître une créature de la ligne de spawn entry, loin du joueur et hors des dangers */
export function spawn(world, entry, index = 0, initial = false) {
  const def = CREATURES[entry.def];
  const size = entry.sizes ? entry.sizes[index % entry.sizes.length] : def.size;
  const { arena, rng, player } = world;
  // les prédateurs apparaissent loin, la nourriture peut être plus près (mais jamais dessus)
  const minDist = def.ai === 'hunter' ? 650 : (initial ? 80 : 300);
  const m = size + 30;
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 30; tries++) {
    x = rng.range(m, arena.w - m);
    y = rng.range(m, arena.h - m);
    if (Math.hypot(x - player.x, y - player.y) < minDist) continue;
    if (inHeat(world.hazards, x, y, size + 10)) continue;
    break;
  }
  const c = createCreature(def, x, y, size, entry, rng);
  c.index = index;
  world.creatures.push(c);
  return c;
}

/* input : { move: {x, y} (longueur 0..1), sprint: bool } */
export function stepWorld(world, input, dt) {
  world.events.length = 0;
  if (world.done || world.dead) return;
  world.time += dt;
  const { stage, player: p } = world;

  /* ---------- Joueur ---------- */
  p.px = p.x;
  p.py = p.y;
  p.pa = p.angle;
  p.ps = p.size;
  const moving = Math.hypot(input.move.x, input.move.y) > 0.05;
  p.sprinting = stage.sprint ? stepEnergy(p, input.sprint && moving, dt) : false;
  const sp = p.sprinting ? stage.sprint : null;
  steerBody(p, input.move, {
    maxSpeed: stage.playerStart.maxSpeed * (sp ? sp.speed : 1),
    accel: stage.physics.accel * (sp ? sp.accel : 1),
    friction: stage.physics.friction,
  }, dt);
  const push = currentPush(world.hazards, p.x, p.y, world.push);
  p.x += push.x * dt;
  p.y += push.y * dt;
  clampToArena(p, p.size, world.arena);
  if (Math.hypot(p.vx, p.vy) > 5) {
    p.angle = turnToward(p.angle, Math.atan2(p.vy, p.vx), stage.physics.turnRate, dt);
  }
  p.size += (sizeAt(stage, world.growth) - p.size) * (1 - Math.exp(-GROW_RATE * dt));
  p.invincible = Math.max(0, p.invincible - dt);

  if (stepHeat(p, inHeat(world.hazards, p.x, p.y, -p.size * 0.3), dt)) hurt(world, 'heat', null);
  if (world.dead) return;

  /* ---------- Créatures ---------- */
  let active = 0;
  for (const c of world.creatures) if (isActiveHunter(c)) active++;
  const ctx = { player: p, rel: 'neutral', hidden: world.hidden, canStart: false, speedFactor: world.speedFactor };
  world.grid.clear();
  for (const c of world.creatures) {
    c.px = c.x;
    c.py = c.y;
    c.pa = c.angle;
    if (c.def.ai === 'hunter') {
      const wasActive = isActiveHunter(c);
      ctx.rel = relation(p.size, c.size);
      ctx.canStart = active < world.maxActiveHunters;
      updateHunter(c, world, ctx, dt);
      if (!wasActive && isActiveHunter(c)) active++;
      else if (wasActive && !isActiveHunter(c)) active--;
    } else {
      updateDrifter(c, world, dt);
    }
    const cp = currentPush(world.hazards, c.x, c.y, world.push);
    c.x += cp.x * dt;
    c.y += cp.y * dt;
    clampToArena(c, c.size, world.arena);
    world.grid.insert(c);
  }

  /* ---------- Contacts avec le joueur ---------- */
  const near = world.grid.query(p.x, p.y, p.size + MAX_CREATURE_SIZE, world.near);
  for (const c of near) {
    if (!c.alive) continue;
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    const d = Math.hypot(dx, dy) || 0.001;
    const rel = relation(p.size, c.size);
    if (rel === 'edible') {
      if (d < p.size + c.size * 0.4) eat(world, c);
    } else if (rel === 'danger') {
      if (d < c.size + p.size * 0.6 && p.invincible <= 0) {
        hurt(world, 'predator', c);
        p.vx = -dx / d * KNOCKBACK;
        p.vy = -dy / d * KNOCKBACK;
        if (world.dead) return;
      }
    } else if (d < p.size + c.size) {
      // tailles proches : on se repousse
      const overlap = (p.size + c.size - d) / 2;
      p.x -= dx / d * overlap;
      p.y -= dy / d * overlap;
      c.x += dx / d * overlap;
      c.y += dy / d * overlap;
    }
  }
  if (world.eaten) {
    world.creatures = world.creatures.filter((c) => c.alive);
    world.eaten = false;
  }

  /* ---------- Réapparitions ---------- */
  for (let i = world.respawns.length - 1; i >= 0; i--) {
    const r = world.respawns[i];
    if (world.time >= r.at) {
      spawn(world, r.entry, r.index);
      world.respawns.splice(i, 1);
    }
  }
}

function eat(world, c) {
  const before = world.growth;
  c.alive = false;
  world.eaten = true;
  world.growth = Math.min(world.goal, world.growth + c.def.growthValue);
  world.player.energy = Math.min(1, world.player.energy + ENERGY_BITE);
  world.events.push({ type: 'eat', x: c.x, y: c.y, def: c.def });
  world.respawns.push({ entry: c.entry, index: c.index, at: world.time + c.entry.respawnSec });

  if (!world.milestoneDone && crossedHalf(before, world.growth, world.goal)) {
    world.milestoneDone = true;
    world.events.push({ type: 'milestone' });
    const extra = world.stage.milestone50 && world.stage.milestone50.spawn;
    if (extra) for (let i = 0; i < extra.count; i++) spawn(world, extra, i);
  }
  if (world.growth >= world.goal) {
    world.done = true;
    world.events.push({ type: 'complete' });
  }
}

/* Un descendant a été mangé (ou a eu trop chaud) : un autre prend le relais */
export function hurt(world, cause, by) {
  const p = world.player;
  world.hearts--;
  p.invincible = INVINCIBLE_TIME;
  p.heat = 0;
  calmHunters(world.creatures);
  world.events.push({ type: 'hurt', cause, x: by ? by.x : p.x, y: by ? by.y : p.y });
  if (world.hearts <= 0) {
    world.dead = true;
    world.events.push({ type: 'dead' });
  }
}
