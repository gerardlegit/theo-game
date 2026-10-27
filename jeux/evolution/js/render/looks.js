// ============================================================================
// L'apparence du joueur à chaque étape (« look ») : utilisée en jeu, sur les
// fiches découverte et pendant la transition entre deux formes.
// ============================================================================

import { drawCell } from './cell.js';

export const LOOKS = {
  cell: { fill: '#8FE3B0', edge: '#FFFFFF' },
  nucleus: { fill: '#9AD8F5', edge: '#FFFFFF', nucleus: '#5B8FD9' },
};

/* o : { squash, alpha } */
export function drawLook(ctx, look, x, y, r, angle, t, o = {}) {
  const l = LOOKS[look] || LOOKS.cell;
  drawCell(ctx, x, y, r, angle, t, {
    fill: l.fill,
    edge: l.edge,
    nucleus: l.nucleus,
    squash: o.squash || 0,
    lineScale: 1.15,
  });
}
