// ============================================================================
// Bac à sable du jalon M0 : une cellule seule dans l'océan primitif, pour
// régler les déplacements, la caméra et les commandes. Sera remplacé par
// les vraies étapes (cell.js, nucleus.js…) au jalon M1.
// ============================================================================

export const SANDBOX = {
  id: 'sandbox',
  medium: 'water',
  arena: { w: 4800, h: 2700 },    // environ 3 × 3 écrans
  player: {
    size: 20,
    maxSpeed: 140,
    accel: 380,                   // unités / s²
    friction: 0.6,                // eau : forte inertie
    turnRate: 8,                  // rad / s
  },
  sprint: { speed: 1.6, accel: 1.5 },
  palette: { top: '#1F7A72', bottom: '#0B3C4A', specks: 'rgba(200, 255, 235, 0.35)' },
};
