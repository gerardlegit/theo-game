// ============================================================================
// Caméra : suit le joueur en douceur. Le monde est en unités logiques ; le zoom
// s'adapte pour qu'on voie toujours environ 1 600 × 900 unités en paysage
// (900 de large en portrait), quel que soit l'écran.
// ============================================================================

export const VIEW_W = 1600;
export const VIEW_H = 900;
export const VIEW_W_PORTRAIT = 900;
const FOLLOW = 6;                  // raideur du suivi (plus grand = plus collé au joueur)

/* Zoom (pixels CSS par unité) pour un écran de w × h pixels CSS */
export function computeZoom(w, h) {
  if (w >= h) return Math.min(w / VIEW_W, h / VIEW_H);
  return w / VIEW_W_PORTRAIT;
}

/* Centre de caméra gardé dans l'arène (ou centré si l'arène est plus petite que la vue) */
export function clampCenter(c, half, size) {
  if (size <= half * 2) return size / 2;
  return Math.min(Math.max(c, half), size - half);
}

export function createCamera() {
  const cam = {
    x: 0, y: 0, px: 0, py: 0,      // position actuelle et au pas précédent
    zoom: 1,
    arena: null,
    // valeurs interpolées utilisées pour le dessin
    rx: 0, ry: 0,

    resize(view) {
      cam.zoom = computeZoom(view.w, view.h);
    },

    snap(x, y, view) {
      cam.x = cam.px = cam.rx = cam.clampX(x, view);
      cam.y = cam.py = cam.ry = cam.clampY(y, view);
    },

    clampX(x, view) {
      return cam.arena ? clampCenter(x, view.w / cam.zoom / 2, cam.arena.w) : x;
    },
    clampY(y, view) {
      return cam.arena ? clampCenter(y, view.h / cam.zoom / 2, cam.arena.h) : y;
    },

    /* Pas logique : se rapproche de la cible */
    follow(tx, ty, view, dt) {
      cam.px = cam.x;
      cam.py = cam.y;
      const k = 1 - Math.exp(-FOLLOW * dt);
      cam.x += (cam.clampX(tx, view) - cam.x) * k;
      cam.y += (cam.clampY(ty, view) - cam.y) * k;
    },

    /* Applique la transformation monde → écran au contexte de dessin */
    apply(ctx, view, alpha) {
      cam.rx = cam.px + (cam.x - cam.px) * alpha;
      cam.ry = cam.py + (cam.y - cam.py) * alpha;
      const s = view.dpr * cam.zoom;
      ctx.setTransform(s, 0, 0, s,
        view.dpr * (view.w / 2 - cam.rx * cam.zoom),
        view.dpr * (view.h / 2 - cam.ry * cam.zoom));
    },

    /* Rectangle visible en unités du monde (pour ne dessiner que ce qui se voit) */
    visibleRect(view, margin = 100) {
      const hw = view.w / cam.zoom / 2 + margin;
      const hh = view.h / cam.zoom / 2 + margin;
      return { x0: cam.rx - hw, y0: cam.ry - hh, x1: cam.rx + hw, y1: cam.ry + hh };
    },
  };
  return cam;
}
