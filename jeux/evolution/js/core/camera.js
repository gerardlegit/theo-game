// ============================================================================
// Caméra : suit le joueur en douceur. Le monde est en unités logiques et,
// comme dans Spore, le zoom suit la taille du joueur : on voit toujours
// environ 50 rayons de joueur de large en paysage (le format 1 600 × 900
// correspond à un joueur de rayon 32). Quand le joueur grandit, la caméra
// recule doucement et le monde paraît rapetisser.
// ============================================================================

export const VIEW_RADII = 50;      // largeur visible en paysage, en rayons de joueur
const ASPECT = 9 / 16;             // 1 600 × 900
const FOLLOW = 6;                  // raideur du suivi (plus grand = plus collé au joueur)
const ZOOM_RATE = 1.8;             // vitesse du recul quand le joueur grandit

/* Zoom (pixels CSS par unité) pour un écran de w × h pixels CSS et un joueur de rayon size */
export function computeZoom(w, h, size) {
  const vw = VIEW_RADII * size;
  const vh = vw * ASPECT;
  if (w >= h) return Math.min(w / vw, h / vh);
  return w / vh;                   // portrait : 900 de large pour 1 600 en paysage
}

/* Centre de caméra gardé dans l'arène (ou centré si l'arène est plus petite que la vue) */
export function clampCenter(c, half, size) {
  if (size <= half * 2) return size / 2;
  return Math.min(Math.max(c, half), size - half);
}

export function createCamera() {
  const cam = {
    x: 0, y: 0, px: 0, py: 0,      // position actuelle et au pas précédent
    zoom: 1, pzoom: 1, targetZoom: 1,
    size: 10,                      // rayon du joueur suivi
    view: { w: 1, h: 1, dpr: 1 },
    arena: null,
    // valeurs interpolées utilisées pour le dessin
    rx: 0, ry: 0, rz: 1,

    resize(view) {
      cam.view = view;
      cam.targetZoom = computeZoom(view.w, view.h, cam.size);
      cam.zoom = cam.pzoom = cam.rz = cam.targetZoom;
    },

    /* Taille du joueur suivi ; instant = sans animation (début d'étape) */
    setSize(size, instant = false) {
      cam.size = size;
      cam.targetZoom = computeZoom(cam.view.w, cam.view.h, size);
      if (instant) cam.zoom = cam.pzoom = cam.rz = cam.targetZoom;
    },

    snap(x, y) {
      cam.x = cam.px = cam.rx = cam.clampX(x);
      cam.y = cam.py = cam.ry = cam.clampY(y);
    },

    clampX(x) {
      return cam.arena ? clampCenter(x, cam.view.w / cam.zoom / 2, cam.arena.w) : x;
    },
    clampY(y) {
      return cam.arena ? clampCenter(y, cam.view.h / cam.zoom / 2, cam.arena.h) : y;
    },

    /* Pas logique : se rapproche de la cible et du bon zoom */
    follow(tx, ty, dt) {
      cam.px = cam.x;
      cam.py = cam.y;
      cam.pzoom = cam.zoom;
      cam.zoom += (cam.targetZoom - cam.zoom) * (1 - Math.exp(-ZOOM_RATE * dt));
      const k = 1 - Math.exp(-FOLLOW * dt);
      cam.x += (cam.clampX(tx) - cam.x) * k;
      cam.y += (cam.clampY(ty) - cam.y) * k;
    },

    /* Applique la transformation monde → écran au contexte de dessin */
    apply(ctx, alpha) {
      const view = cam.view;
      cam.rx = cam.px + (cam.x - cam.px) * alpha;
      cam.ry = cam.py + (cam.y - cam.py) * alpha;
      cam.rz = cam.pzoom + (cam.zoom - cam.pzoom) * alpha;
      const s = view.dpr * cam.rz;
      ctx.setTransform(s, 0, 0, s,
        view.dpr * (view.w / 2 - cam.rx * cam.rz),
        view.dpr * (view.h / 2 - cam.ry * cam.rz));
    },

    /* Monde → pixels CSS (après apply) */
    toScreen(x, y) {
      return {
        x: cam.view.w / 2 + (x - cam.rx) * cam.rz,
        y: cam.view.h / 2 + (y - cam.ry) * cam.rz,
      };
    },

    /* Rectangle visible en unités du monde (pour ne dessiner que ce qui se voit) */
    visibleRect(margin = 100) {
      const hw = cam.view.w / cam.rz / 2 + margin;
      const hh = cam.view.h / cam.rz / 2 + margin;
      return { x0: cam.rx - hw, y0: cam.ry - hh, x1: cam.rx + hw, y1: cam.ry + hh };
    },
  };
  return cam;
}
