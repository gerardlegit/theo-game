// ============================================================================
// Écran : le canvas occupe toute la fenêtre, se redimensionne à chaque
// rotation du téléphone, et gère le plein écran (ou l'astuce iPhone).
// ============================================================================

export const DPR_MAX = 2;          // au-delà, trop de pixels pour un petit téléphone

export function createScreen(canvas, onResize) {
  const view = { w: 1, h: 1, dpr: 1 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    view.w = w;
    view.h = h;
    view.dpr = dpr;
    if (onResize) onResize(view);
  }

  window.addEventListener('resize', resize);
  // iOS donne parfois l'ancienne taille juste après la rotation
  window.addEventListener('orientationchange', () => setTimeout(resize, 150));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();
  return view;
}

/* ---------- Plein écran ---------- */
export function canFullscreen() {
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

export function toggleFullscreen() {
  try {
    if (isFullscreen()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) return Promise.resolve(exit.call(document)).catch(() => {});
    } else {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) return Promise.resolve(req.call(el, { navigationUI: 'hide' })).catch(() => {});
    }
  } catch (e) { /* refusé par le navigateur */ }
  return Promise.resolve();
}

/* iPhone : pas de plein écran pour une page, il faut l'ajouter à l'écran d'accueil */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone() {
  return navigator.standalone === true
    || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}
