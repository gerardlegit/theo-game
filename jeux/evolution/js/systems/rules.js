// ============================================================================
// Règles de base : qui peut manger qui (règle de taille), croissance,
// énergie du sprint. Uniquement des calculs, testés dans tests/.
// ============================================================================

/* ---------- Règle de taille (comme Spore) ---------- */
export const EAT_RATIO = 0.8;      // je mange ce qui fait moins de 80 % de ma taille
export const DANGER_RATIO = 1.2;   // ce qui dépasse 120 % de ma taille peut me manger

/* Ce que représente l'autre pour le joueur : 'edible' (vert), 'neutral' (blanc), 'danger' (rouge) */
export function relation(playerSize, otherSize) {
  if (otherSize < playerSize * EAT_RATIO) return 'edible';
  if (otherSize > playerSize * DANGER_RATIO) return 'danger';
  return 'neutral';
}

/* ---------- Croissance ---------- */
export const HEARTS = 3;

/* Taille du joueur pour une croissance donnée (de playerStart.size à playerEndSize) */
export function sizeAt(stage, growth) {
  const k = Math.min(1, Math.max(0, growth / stage.growthGoal));
  return stage.playerStart.size + (stage.playerEndSize - stage.playerStart.size) * k;
}

/* Plus de cœurs : on recommence l'étape avec la moitié de la jauge */
export function restartGrowth(growth) {
  return Math.floor(growth / 2);
}

/* La jauge vient-elle de passer la moitié ? */
export function crossedHalf(before, after, goal) {
  return before < goal / 2 && after >= goal / 2;
}

/* ---------- Énergie (sprint, dès l'étape 2) ---------- */
export const ENERGY_DRAIN = 2.5;   // s de sprint avec une jauge pleine
export const ENERGY_REFILL = 3;    // s pour la remplir quand on ne sprinte pas
export const ENERGY_BITE = 0.25;   // une bouchée redonne un quart de la jauge
const ENERGY_RESTART = 0.25;       // jauge vide : on attend d'en avoir un quart pour resprinter

/* Avance l'énergie d'un pas ; renvoie true si le joueur sprinte vraiment */
export function stepEnergy(state, wantSprint, dt) {
  if (state.tired && state.energy >= ENERGY_RESTART) state.tired = false;
  const sprinting = wantSprint && !state.tired && state.energy > 0;
  if (sprinting) {
    state.energy = Math.max(0, state.energy - dt / ENERGY_DRAIN);
    if (state.energy === 0) state.tired = true;
  } else {
    state.energy = Math.min(1, state.energy + dt / ENERGY_REFILL);
  }
  return sprinting;
}
