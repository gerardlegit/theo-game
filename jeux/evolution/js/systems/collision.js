// ============================================================================
// Grille spatiale (cases de 128 unités) : pour trouver vite les créatures
// proches d'un point, sans tester toutes les paires.
// ============================================================================

export const CELL_SIZE = 128;

export function createGrid(cellSize = CELL_SIZE) {
  const cells = new Map();
  const used = [];                 // cases remplies, vidées au prochain clear()
  const key = (cx, cy) => cx * 65536 + cy;

  return {
    clear() {
      for (const list of used) list.length = 0;
      used.length = 0;
    },

    /* Range une entité (par son centre) */
    insert(e) {
      const k = key(Math.floor(e.x / cellSize), Math.floor(e.y / cellSize));
      let list = cells.get(k);
      if (!list) { list = []; cells.set(k, list); }
      if (list.length === 0) used.push(list);
      list.push(e);
    },

    /* Entités dont le centre est dans le carré de demi-côté r autour de (x, y) */
    query(x, y, r, out = []) {
      out.length = 0;
      const x0 = Math.floor((x - r) / cellSize);
      const x1 = Math.floor((x + r) / cellSize);
      const y0 = Math.floor((y - r) / cellSize);
      const y1 = Math.floor((y + r) / cellSize);
      for (let cx = x0; cx <= x1; cx++) {
        for (let cy = y0; cy <= y1; cy++) {
          const list = cells.get(key(cx, cy));
          if (list) for (const e of list) out.push(e);
        }
      }
      return out;
    },
  };
}
