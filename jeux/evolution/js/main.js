// ============================================================================
// Évolution : point d'entrée. Prépare l'écran, les commandes, la caméra et
// la boucle de jeu, branche le menu pause et le plein écran, puis lance la
// première scène.
// ============================================================================

import { createLoop } from './core/loop.js';
import { createScreen, canFullscreen, toggleFullscreen, isFullscreen, isIOS, isStandalone } from './core/screen.js';
import { createCamera } from './core/camera.js';
import { createInput } from './core/input.js';
import { createSceneManager } from './core/scenes.js';
import { createSandboxScene } from './scenes/sandbox.js';
import { FR } from './content/fr.js';

const $ = (id) => document.getElementById(id);
const DEBUG = new URLSearchParams(location.search).has('debug');

const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
const scenes = createSceneManager();
const camera = createCamera();
const game = { ctx, view: null, camera, input: null, scenes, paused: false };

game.view = createScreen(canvas, (view) => {
  camera.resize(view);
  scenes.resize(view);
});

game.input = createInput({
  surface: canvas,
  joyBase: $('joyBase'),
  joyKnob: $('joyKnob'),
  actionBtn: $('actionBtn'),
  on: { pause: togglePause, fullscreen: onFullscreen, device: showDevice },
});

/* ---------- Aides selon la dernière entrée utilisée ---------- */
let hintTimer = 0;
function showDevice(device) {
  document.body.dataset.input = device;
  const hint = $('hint');
  hint.textContent = FR.hint[device];
  hint.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.classList.remove('show'), 6000);
}
showDevice('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches ? 'touch' : 'keyboard');

/* ---------- Pause (bouton, Échap / P, onglet caché) ---------- */
function setPaused(paused) {
  if (game.paused === paused) return;
  game.paused = paused;
  game.input.enabled = !paused;
  game.input.reset();
  $('pauseOverlay').hidden = !paused;
  if (paused) $('resumeBtn').focus();
  else $('iosTip').hidden = true;
}
function togglePause() { setPaused(!game.paused); }

$('pauseBtn').addEventListener('click', (e) => { e.currentTarget.blur(); togglePause(); });
$('resumeBtn').addEventListener('click', () => setPaused(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
window.addEventListener('blur', () => setPaused(true));

/* ---------- Plein écran (ou astuce iPhone) ---------- */
function onFullscreen() {
  if (canFullscreen()) {
    toggleFullscreen();
  } else {
    setPaused(true);
    $('iosTip').hidden = false;
  }
}
$('iosTip').textContent = FR.fullscreen.ios;
for (const btn of [$('fsBtn'), $('fsBtn2')]) {
  btn.hidden = isStandalone() || (!canFullscreen() && !isIOS());
  btn.addEventListener('click', (e) => { e.currentTarget.blur(); onFullscreen(); });
}
const syncFullscreen = () => document.body.classList.toggle('is-fullscreen', isFullscreen());
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('webkitfullscreenchange', syncFullscreen);

/* ---------- Boucle ---------- */
const fpsEl = $('fps');
const loop = createLoop({
  update(dt) {
    if (game.paused) return;
    game.input.update(dt);
    scenes.update(dt);
  },
  render(alpha, frameDt) {
    scenes.render(ctx, game.paused ? 1 : alpha, frameDt);
    if (DEBUG) fpsEl.textContent = `${Math.round(loop.stats.fps)} i/s`;
  },
});

scenes.set(createSandboxScene(game));
loop.start();

if (DEBUG) {
  fpsEl.hidden = false;
  game.loop = loop;
  window.__evolution = game;       // pour les tests automatiques
}
