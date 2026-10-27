// ============================================================================
// Évolution : point d'entrée. Prépare l'écran, les commandes, la caméra et
// la boucle de jeu, branche le menu pause et le plein écran, et enchaîne les
// scènes : titre → étape → fiche découverte → « des millions d'années plus
// tard… » → étape suivante.
// ============================================================================

import { createLoop } from './core/loop.js';
import { createScreen, canFullscreen, toggleFullscreen, isFullscreen, isIOS, isStandalone } from './core/screen.js';
import { createCamera } from './core/camera.js';
import { createInput } from './core/input.js';
import { createSceneManager } from './core/scenes.js';
import { createRng } from './core/rng.js';
import { isSoundOn, toggleSound } from './core/audio.js';
import { STAGES, FIRST_STAGE } from './stages/index.js';
import { createStageScene } from './scenes/stage.js';
import { createTitleScene, createCardScene, createSequelScene } from './scenes/menus.js';
import { createTransitionScene } from './scenes/transition.js';
import { createHud } from './ui/hud.js';
import { showScreen, hideScreen, installMenuKeys } from './ui/screens.js';
import { FR, typo } from './content/fr.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const SEED = params.has('seed') ? Number(params.get('seed')) : null;

const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
const scenes = createSceneManager();
const camera = createCamera();
const game = {
  ctx, camera, scenes,
  view: null,
  input: null,
  hud: createHud(),
  paused: false,
  settings: { easy: false },       // options complètes au jalon M5
  newRng: () => createRng(SEED === null ? undefined : SEED),
};

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
installMenuKeys();

/* ---------- Enchaînement des scènes ---------- */
game.flow = {
  title() { scenes.set(createTitleScene(game)); },
  play() { game.flow.stage(FIRST_STAGE); },
  stage(id, opts) { scenes.set(createStageScene(game, id, opts)); },
  stageDone(id) { scenes.set(createCardScene(game, id)); },
  afterCard(id) {
    const next = STAGES[id].next;
    if (STAGES[next]) scenes.set(createTransitionScene(game, id, next));
    else scenes.set(createSequelScene(game));
  },
};

/* ---------- Aides selon la dernière entrée utilisée ---------- */
let hint = null;
let hintTimer = 0;
function showDevice(device) {
  document.body.dataset.input = device;
  if (hint && $('hint').classList.contains('show')) $('hint').textContent = typo(hint[device]);
}
game.showHint = (h) => {
  hint = h;
  if (!h) return;
  const el = $('hint');
  el.textContent = typo(h[game.input.device || 'keyboard']);
  el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('show'), 6000);
};
game.hideHint = () => {
  clearTimeout(hintTimer);
  $('hint').classList.remove('show');
};
showDevice('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches ? 'touch' : 'keyboard');

/* ---------- Pause (bouton, Échap / P, onglet caché) ---------- */
function setPaused(paused) {
  if (game.paused === paused) return;
  if (paused && !(scenes.current && scenes.current.canPause)) return;
  game.paused = paused;
  game.input.reset();
  if (paused) {
    syncSoundLabel();
    showScreen('pauseOverlay');
  } else {
    hideScreen('pauseOverlay');
    $('iosTip').hidden = true;
  }
}
function togglePause() { setPaused(!game.paused); }

function syncSoundLabel() {
  $('soundBtn').textContent = isSoundOn() ? '🔊 Son : oui' : '🔈 Son : non';
}

$('pauseBtn').addEventListener('click', (e) => { e.currentTarget.blur(); togglePause(); });
$('resumeBtn').addEventListener('click', () => setPaused(false));
$('restartBtn').addEventListener('click', () => {
  const id = scenes.current.id;
  setPaused(false);
  game.flow.stage(id, { intro: false });
});
$('soundBtn').addEventListener('click', () => { toggleSound(); syncSoundLabel(); });
$('menuBtn').addEventListener('click', () => {
  setPaused(false);
  game.flow.title();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
window.addEventListener('blur', () => setPaused(true));

/* ---------- Plein écran (ou astuce iPhone) ---------- */
function onFullscreen() {
  if (canFullscreen()) {
    toggleFullscreen();
  } else if (isIOS()) {
    const tip = $('iosTip');
    tip.textContent = typo(FR.fullscreen.ios);
    // l'astuce s'affiche sous le menu ouvert (titre ou pause)
    const host = $('pauseOverlay').hidden ? $('titleTip') : tip;
    host.textContent = tip.textContent;
    host.hidden = false;
  }
}
for (const btn of document.querySelectorAll('.fs-toggle')) {
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
    const scene = scenes.current;
    game.input.enabled = !game.paused && !!(scene && scene.interactive);
    if (game.paused) return;
    if (game.input.enabled) game.input.update(dt);
    scenes.update(dt);
  },
  render(alpha, frameDt) {
    scenes.render(ctx, game.paused ? 1 : alpha, frameDt);
    if (DEBUG) fpsEl.textContent = `${Math.round(loop.stats.fps)} i/s`;
  },
});

// ?debug&etape=nucleus ou ?debug&fiche=cell : aller directement à une étape ou à une fiche
if (DEBUG && STAGES[params.get('etape')]) game.flow.stage(params.get('etape'));
else if (DEBUG && STAGES[params.get('fiche')]) game.flow.stageDone(params.get('fiche'));
else game.flow.title();
loop.start();

if (DEBUG) {
  fpsEl.hidden = false;
  game.loop = loop;
  window.__evolution = game;       // pour les tests automatiques
}
