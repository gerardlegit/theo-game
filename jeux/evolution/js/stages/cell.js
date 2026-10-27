// ============================================================================
// Étape 1 — Première cellule (il y a 3,8 milliards d'années).
// Océan primitif et cheminées hydrothermales. Étape tutoriel : pas de
// prédateur, seulement l'eau trop chaude et un courant.
// ============================================================================

export const CELL = {
  id: 'cell',
  ago: 3800,                       // il y a … millions d'années
  medium: 'water',
  arena: { w: 2000, h: 1400 },
  growthGoal: 10,
  food: 'molecule',                // icône de la jauge de croissance
  playerStart: { size: 10, maxSpeed: 140 },
  playerEndSize: 20,
  physics: { accel: 380, friction: 0.6, turnRate: 8 },
  look: 'cell',
  sprint: null,                    // pas de sprint avant l'étape 2
  palette: { top: '#2C8C78', bottom: '#0F4A4F', specks: 'rgba(210, 255, 230, 0.35)' },
  spawns: [
    { def: 'molecule', count: 60, respawnSec: 1.5 },
  ],
  hazards: [
    { type: 'heat', x: 480, y: 420, r: 110 },
    { type: 'heat', x: 1520, y: 1010, r: 120 },
    { type: 'heat', x: 1500, y: 330, r: 90 },
    { type: 'current', x: 160, y: 900, w: 1000, h: 170, dx: 1, dy: 0, speed: 70 },
  ],
  milestone50: {},
  next: 'nucleus',
};
