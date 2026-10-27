// ============================================================================
// Comportements des créatures :
//  - drifter : dérive lente au hasard, ignore le joueur (molécules, bactéries) ;
//  - hunter  : patrouille, prévient avant d'attaquer (s'arrête 0,4 s, yeux
//              rouges), poursuit 4 s au plus, puis abandonne ; fuit le joueur
//              quand il est devenu plus gros qu'elle.
// ============================================================================

import { steerBody, turnToward } from './movement.js';

export const AIM_TIME = 0.4;       // s d'arrêt « yeux rouges » avant de foncer
export const CHASE_TIME = 4;       // s de poursuite au maximum
export const DASH_TIME = 0.8;      // s d'élan au début de la poursuite (vitesse × def.dash)
export const GIVE_UP_REST = 1.5;   // s de calme après avoir abandonné
export const HIT_REST = 2;         // s de calme après avoir attrapé le joueur
const PATROL_SPEED = 0.45;         // part de la vitesse max en patrouille
const FLEE_SPEED = 0.75;           // part de la vitesse max en fuite (le joueur peut la rattraper)
const BRAKE = { maxSpeed: 0, accel: 0, friction: 0.995 };
const NO_MOVE = { x: 0, y: 0 };

/* Vitesse la plus haute que peut atteindre une créature (règle d'équilibrage) */
export function topSpeed(def) {
  return def.maxSpeed * (def.dash || 1);
}

export function isActiveHunter(c) {
  return c.state === 'aim' || c.state === 'chase';
}

/* ---------- drifter ---------- */
export function updateDrifter(c, world, dt) {
  const { arena, time } = world;
  // le cap tourne doucement, un peu au hasard
  c.heading += (Math.sin(time * 0.6 + c.seed * 7) * 0.8 + (world.rng() - 0.5) * 0.6) * dt;
  // près d'un bord : on repart vers le centre
  const m = c.size + 40;
  if (c.x < m || c.y < m || c.x > arena.w - m || c.y > arena.h - m) {
    c.heading = Math.atan2(arena.h / 2 - c.y, arena.w / 2 - c.x);
  }
  steerBody(c, { x: Math.cos(c.heading) * 0.7, y: Math.sin(c.heading) * 0.7 }, c.def, dt);
  c.angle = c.heading;
}

/* ---------- hunter ----------
 * ctx : { player, rel (ce qu'est la créature pour le joueur), hidden, canStart (place
 *         libre parmi les chasseurs actifs), speedFactor (mode facile) }
 */
export function updateHunter(c, world, ctx, dt) {
  const def = c.def;
  const p = ctx.player;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const dist = Math.hypot(dx, dy) || 1;
  const threat = ctx.rel === 'danger';   // elle peut manger le joueur
  const prey = ctx.rel === 'edible';     // le joueur peut la manger
  const speed = def.maxSpeed * ctx.speedFactor;
  c.cooldown = Math.max(0, c.cooldown - dt);
  c.timer -= dt;

  switch (c.state) {
    case 'aim':
      if (!threat || ctx.hidden) { c.state = 'patrol'; break; }
      steerBody(c, NO_MOVE, BRAKE, dt);
      c.angle = turnToward(c.angle, Math.atan2(dy, dx), 10, dt);
      if (c.timer <= 0) {
        c.state = 'chase';
        c.timer = CHASE_TIME;
        c.dash = DASH_TIME;
      }
      return;

    case 'chase': {
      if (!threat || ctx.hidden || c.timer <= 0 || dist > def.senseRadius * 1.6) {
        c.state = 'patrol';
        c.cooldown = GIVE_UP_REST;
        break;
      }
      c.dash -= dt;
      const s = speed * (c.dash > 0 ? (def.dash || 1) : 1);
      steerBody(c, { x: dx / dist, y: dy / dist }, { maxSpeed: s, accel: def.accel * 2, friction: def.friction }, dt);
      c.angle = turnToward(c.angle, Math.atan2(c.vy, c.vx), 8, dt);
      return;
    }

    case 'flee':
      if (!prey || dist > def.senseRadius * 1.3) { c.state = 'patrol'; break; }
      steerBody(c, { x: -dx / dist, y: -dy / dist }, { maxSpeed: speed * FLEE_SPEED, accel: def.accel, friction: def.friction }, dt);
      c.angle = turnToward(c.angle, Math.atan2(c.vy, c.vx), 8, dt);
      return;

    default:
      if (prey && dist < def.senseRadius) { c.state = 'flee'; return; }
      if (threat && !ctx.hidden && ctx.canStart && c.cooldown <= 0 && dist < def.senseRadius) {
        c.state = 'aim';
        c.timer = AIM_TIME;
        return;
      }
  }
  wander(c, world, speed * PATROL_SPEED, dt);
}

/* Le joueur vient de perdre un cœur : les chasseurs actifs le laissent tranquille */
export function calmHunters(creatures) {
  for (const c of creatures) {
    if (isActiveHunter(c)) {
      c.state = 'patrol';
      c.cooldown = HIT_REST;
    }
  }
}

/* Patrouille : va d'un point au hasard à un autre */
function wander(c, world, speed, dt) {
  const { arena, rng } = world;
  if (c.wx === undefined || Math.hypot(c.wx - c.x, c.wy - c.y) < 40 || c.timer < -8) {
    const m = 120;
    c.wx = rng.range(m, arena.w - m);
    c.wy = rng.range(m, arena.h - m);
    c.timer = 0;
  }
  const dx = c.wx - c.x;
  const dy = c.wy - c.y;
  const d = Math.hypot(dx, dy) || 1;
  steerBody(c, { x: dx / d, y: dy / d }, { maxSpeed: speed, accel: c.def.accel, friction: c.def.friction }, dt);
  if (Math.hypot(c.vx, c.vy) > 3) c.angle = turnToward(c.angle, Math.atan2(c.vy, c.vx), 4, dt);
}
