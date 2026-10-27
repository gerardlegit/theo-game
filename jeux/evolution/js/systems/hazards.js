// ============================================================================
// Dangers du milieu : eau trop chaude près des cheminées (y rester 1 s coûte
// un cœur) et courants qui poussent tout ce qui nage dedans.
// ============================================================================

export const HEAT_TIME = 1;        // s dans l'eau trop chaude avant de perdre un cœur

/* Le point (x, y), avec une marge r, est-il dans une zone d'eau trop chaude ? */
export function inHeat(hazards, x, y, r = 0) {
  for (const h of hazards) {
    if (h.type === 'heat' && Math.hypot(x - h.x, y - h.y) < h.r + r) return true;
  }
  return false;
}

/* Vitesse ajoutée par les courants au point (x, y), en unités / s */
export function currentPush(hazards, x, y, out = { x: 0, y: 0 }) {
  out.x = 0;
  out.y = 0;
  for (const h of hazards) {
    if (h.type !== 'current') continue;
    if (x < h.x || x > h.x + h.w || y < h.y || y > h.y + h.h) continue;
    out.x += h.dx * h.speed;
    out.y += h.dy * h.speed;
  }
  return out;
}

/* Avance la minuterie de chaleur du joueur ; renvoie true quand il faut retirer un cœur */
export function stepHeat(player, hot, dt) {
  if (hot && player.invincible <= 0) {
    player.heat += dt;
    if (player.heat >= HEAT_TIME) {
      player.heat = 0;
      return true;
    }
  } else {
    player.heat = Math.max(0, player.heat - dt * 2);
  }
  return false;
}
