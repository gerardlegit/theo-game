// ============================================================================
// Création des entités : le joueur et les créatures. Toutes partagent la même
// forme de données (position, vitesse, position au pas précédent pour
// l'interpolation du dessin, angle, taille).
// ============================================================================

export function createPlayer(x, y, size) {
  return {
    x, y, vx: 0, vy: 0, px: x, py: y,
    angle: 0, pa: 0,
    size, ps: size,
    invincible: 0,                 // s d'invincibilité restantes (clignotement)
    heat: 0,                       // s passées dans l'eau trop chaude
    energy: 1, tired: false,       // jauge de sprint
    sprinting: false,
  };
}

/* entry : la ligne de spawn de l'étape (pour la faire réapparaître pareille) */
export function createCreature(def, x, y, size, entry, rng) {
  const heading = rng() * Math.PI * 2;
  return {
    def, entry,
    x, y, vx: 0, vy: 0, px: x, py: y,
    size,
    angle: heading, pa: heading, heading,
    seed: rng() * 10,
    state: 'patrol', timer: 0, cooldown: 0, dash: 0,
    alive: true,
  };
}
