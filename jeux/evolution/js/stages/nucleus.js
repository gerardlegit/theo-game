// ============================================================================
// Étape 2 — Cellule à noyau (il y a 2 milliards d'années).
// Premier sprint, premiers prédateurs : de grosses cellules qui mangent les
// petites. Les deux amibes moyennes deviennent des proies en fin d'étape ;
// la grosse reste dangereuse jusqu'au bout.
// ============================================================================

export const NUCLEUS = {
  id: 'nucleus',
  ago: 2000,
  medium: 'water',
  arena: { w: 2800, h: 1900 },
  growthGoal: 12,
  food: 'bacterium',
  playerStart: { size: 12, maxSpeed: 160 },
  playerEndSize: 28,
  physics: { accel: 420, friction: 0.6, turnRate: 8 },
  look: 'nucleus',
  sprint: { speed: 1.6, accel: 1.6 },
  palette: { top: '#2479A0', bottom: '#0C3A5A', specks: 'rgba(200, 235, 255, 0.35)' },
  spawns: [
    { def: 'bacterium', count: 45, respawnSec: 2 },
    { def: 'amoeba', count: 2, respawnSec: 10, sizes: [17, 20] },
    { def: 'bigAmoeba', count: 1, respawnSec: 12 },
  ],
  hazards: [],
  // à mi-parcours : une cellule plus rapide arrive
  milestone50: { spawn: { def: 'fastAmoeba', count: 1, respawnSec: 12 } },
  next: 'multicell',
};
