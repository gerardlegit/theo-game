// ============================================================================
// Évolution — le code commun à TOUS les niveaux sur la terre ferme
// (world.ground === 'land'). Rien ici ne connaît une espèce par son nom.
//
//   - La course : réactive, avec de l'élan quand on garde sa direction.
//   - La poussière sous les pattes, les traits de vitesse, le dérapage.
// (Les animaux eux-mêmes sont dessinés vus de dessus : art-dessus.js.)
// ============================================================================

import { sfx } from './sound.js';

const TAU = Math.PI * 2;

/* ---------- Réglages de la course ---------- */
export const LAND_SPEED = 1.85;    // tous les niveaux sur terre vont à la même vitesse
export const LAND_MAX = 680;       // vitesse maximale (pour les très gros animaux)
const GRIP = 11;                   // on suit vite ce que demande le joueur
const GRIP_STOP = 9;               // et on s'arrête vite quand on lâche
const ELAN_TIME = 1.3;             // s à garder sa direction pour être lancé à fond
const ELAN_BONUS = 0.28;           // lancé à fond : 28 % plus vite

export function createTerre(api) {
  const on = () => api.level().world.ground === 'land';
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- La poussière (la couleur vient du sol du chapitre) ---------- */
  function dustColor() {
    const pal = api.chapter().palette;
    return pal.dust || api.shade(pal.floor, 0.28);
  }
  function dust(x, y, n, spread, size) {
    const col = dustColor();
    const list = api.particles();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = rnd(spread * 0.25, spread);
      list.push({ x: x + Math.cos(a) * size, y: y + Math.sin(a) * size * 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.45 - 12, life: 0, max: rnd(0.3, 0.6), size: rnd(size * 0.35, size * 0.8), color: col });
    }
  }

  /* ---------- La course du joueur (remplace la nage) ---------- */
  function run(p, want, top, dt, dashing) {
    const sp = Math.hypot(p.vx, p.vy);
    const along = want && sp > 20 ? (p.vx * want.x + p.vy * want.y) / sp : 1;
    // l'élan : il monte tant qu'on garde sa direction, il tombe quand on tourne fort
    if (want && along > 0.75) p.elan = Math.min(1, (p.elan || 0) + dt / ELAN_TIME);
    else p.elan = Math.max(0, (p.elan || 0) - dt * (want ? (along < 0 ? 4 : 1.2) : 2.5));
    const v = top * (1 + p.elan * ELAN_BONUS);
    const tx = want ? want.x * v : 0, ty = want ? want.y * v : 0;
    const k = 1 - Math.exp(-(want ? GRIP : GRIP_STOP) * dt);
    p.vx += (tx - p.vx) * k;
    p.vy += (ty - p.vy) * k;
    // demi-tour à pleine vitesse : on dérape !
    if (want && along < -0.2 && sp > top * 0.6 && performance.now() > (p.skidAt || 0)) {
      p.skidAt = performance.now() + 450;
      dust(p.x, p.y + p.size * 0.85, 7, 90 + p.size, Math.max(5, p.size * 0.22));
      sfx.skid();
    }
    // la poussière sous les pattes ; lancé à fond, des traits de vitesse
    const speedK = Math.min(1.5, sp / Math.max(1, top));
    if (speedK > 0.55 && Math.random() < dt * (6 + speedK * 16)) dust(p.x - p.vx * 0.03, p.y + p.size * 0.85, 1, 40, Math.max(4, p.size * 0.2));
    if ((p.elan > 0.85 || dashing) && Math.random() < dt * 24) {
      const a = Math.atan2(p.vy, p.vx), o = rnd(-1, 1) * p.size * 1.1;
      api.particles().push({ x: p.x - Math.cos(a) * p.size - Math.sin(a) * o, y: p.y - p.size * 0.2 - Math.sin(a) * p.size + Math.cos(a) * o, vx: p.vx * 0.2, vy: p.vy * 0.2, life: 0, max: 0.22, size: p.size * rnd(0.6, 1.1), color: '#FFFFFF', streak: a });
    }
  }

  return { on, run, dust };
}
