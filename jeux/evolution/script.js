// ============================================================================
// Évolution — le moteur du jeu. Le joueur est un être vivant qui nage dans
// l'océan : il mange ce qui est plus petit que lui pour grandir et gagner de
// l'ADN, évite de se faire croquer par plus gros, et fait évoluer son corps.
// Tout ce qui décrit un niveau (espèces, évolutions, chapitres, missions) est
// dans levels/ : ce fichier ne connaît aucune espèce par son nom.
// ============================================================================

import { LEVELS } from './levels/index.js';
import {
  drawCreature, drawPlayer, drawDecor, drawAlgaeFronds, drawDrop, drawSweat, drawAlert,
  buildFloorTile, buildCaustics, speciesThumb, playerThumb, makeSpine, SPINES, AMMO_SVG,
} from './art.js';
import { LINES } from './data.js';
import { createIntro } from './intro.js';
import { sfx, isSoundOn, toggleSound } from './sound.js';

const SAVE_KEY = 'evolution-save';
const SAVE_VERSION = 1;
const TAU = Math.PI * 2;

/* ---------- Réglages de la nage ---------- */
const DRAG = 3;                    // l'eau freine : sans nager, on s'arrête en ~1 s
const TURN = 7;                    // rad/s pour se tourner
const BASE_SPEED = 110;            // vitesse = BASE_SPEED + SPEED_PER_SIZE × taille
const SPEED_PER_SIZE = 1.4;
const DASH_TIME = 0.75;            // s de sprint
const DASH_BOOST = 2.1;
const DASH_RECHARGE = 3.2;         // s pour le recharger (2,2 s avec des nageoires)

/* ---------- Manger et se faire manger ---------- */
const BASE_RATIO = 0.85;           // on avale ce qui fait moins de 85 % de sa taille
const DANGER_RATIO = 0.9;          // un chasseur nous croque si on fait moins de 90 % de la sienne
const EATEN_ADN_LOSS = 0.5;        // se faire manger : on perd la moitié de son ADN…
const EATEN_GROWTH_LOSS = 0.12;    // …et un peu de sa taille
const RESPAWN_TIME = 1.5;
const INVUL_TIME = 2.5;
const SHIELD_RECHARGE = 18;        // s pour qu'une carapace se « répare »
const DROP_LIFE = 22;              // s avant que l'ADN perdu ne disparaisse

/* ---------- Les chasseurs ---------- */
const ALERT_TIME = 0.55;           // ils s'arrêtent un instant (« ! ») avant de foncer
const CHASE_TIME = 6;
const LUNGE_TIME = 0.7;            // l'élan du début de la poursuite
const LUNGE = 1.35;
const MAX_CHASERS = 2;
const GIVE_UP_REST = 3;
const FULL_REST = 6;               // après avoir mangé le joueur, il digère

/* ---------- Le niveau en cours (tout ce qui le décrit est dans levels/) ---------- */
let LV = null;
let SPECIES = {};
let EVOS = {};
let CHAPTERS = [];
let CH = null;                     // le chapitre en cours

function useLevel(i) {
  LV = LEVELS[i];
  SPECIES = LV.species;
  EVOS = LV.evolutions;
  CHAPTERS = LV.chapters;
}

/* ---------- Éléments de la page ---------- */
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('seaCanvas');
const ctx = canvas.getContext('2d');
const minimap = $('minimap');
const mctx = minimap.getContext('2d');
const adnEl = $('adn');
const adnItem = $('adnItem');
const sizeBar = $('sizeBar');
const eraEl = $('era');
const shieldItem = $('shieldItem');
const shieldsEl = $('shields');
const evoBtn = $('evoBtn');
const soundBtn = $('soundBtn');
const missionPanel = $('missionPanel');
const missionList = $('missionList');
const missionTitle = $('missionTitle');
const factCard = $('factCard');
const copilot = $('copilot');
const bubble = $('bubble');
const startOverlay = $('startOverlay');
const dialogEl = $('dialog');
const dialogCard = $('dialogCard');
const timeOverlay = $('timeOverlay');
const endOverlay = $('endOverlay');
const endCanvas = $('endCanvas');
const ectx = endCanvas.getContext('2d');
const introOverlay = $('introOverlay');
const introCanvas = $('introCanvas');
const ictx = introCanvas.getContext('2d');
const quitOverlay = $('quitOverlay');
const confettiLayer = $('confettiLayer');
const dashBtn = $('dashBtn');
const phoneMQ = window.matchMedia('(pointer: coarse) and (max-width: 900px), (pointer: coarse) and (max-height: 520px)');
const DEBUG = new URLSearchParams(location.search).has('debug');

/* ---------- État ---------- */
let game = null;                   // tout ce qui est sauvegardé
let state = 'loading';             // 'loading' | 'ready' | 'intro' | 'playing' | 'time' | 'ending'

let cssW = 0, cssH = 0, dpr = 1, zoom = 1, viewW = 0, viewH = 0;
const cam = { x: 0, y: 0 };
let worldT = 0;
let player = null;
let creatures = [];
let drops = [];
let particles = [];
let floaters = [];
let decor = [];                    // ce qui est posé au fond (rochers, éponges…)
let algae = [];                    // les forêts d'algues (cachettes)
let motes = [];                    // particules en suspension dans l'eau
let floorTile = null;
let caustics = null;
let stats = null;                  // effets des évolutions achetées
let shake = 0;
let flash = { a: 0, color: '255,255,255' };
let heartT = 0;
let heartPulse = 0;
let spawnT = 0;
let seenT = 0;
let eatHintAt = 0;
let evolving = null;               // animation d'évolution en cours
let ammo = { until: 0, prio: 0 };
const cooldowns = {};
let nextTipAt = 0;
let nextJokeAt = 0;
let lastMoveAt = 0;
let saveAt = 0;
let factTimer = null;
const factQueue = [];
let dialogActions = {};
let thumbImgs = {};
let intro = null;
let endT = 0;
let endFx = [];
let wasChased = false;
let missionsShown = '';
let clock = 0;                     // temps de jeu (pour les petits délais de l'histoire)
const timers = [];
let botInput = null;               // (?debug) pilote automatique, pour tester l'équilibrage

const keys = { left: false, right: false, up: false, down: false };
const touchDirs = { left: false, right: false, up: false, down: false };
const pointer = { active: false, id: null, x: 0, y: 0, lastDown: 0 };

/* ---------- Utilitaires ---------- */
/** Comme setTimeout, mais sur le temps du jeu */
function later(fn, ms) {
  timers.push({ at: clock + ms / 1000, fn });
}

function runTimers(dt) {
  clock += dt;
  for (let i = timers.length - 1; i >= 0; i--) {
    if (timers[i].at <= clock) timers.splice(i, 1)[0].fn();
  }
}

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function turnToward(a, target, max) {
  let d = ((target - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return a + clamp(d, -max, max);
}

/** « 1,5 milliard d'années », « 520 millions d'années » */
function fmtAgo(ma, short = false) {
  if (ma >= 1000) {
    const g = Math.round(ma / 100) / 10;
    return `${String(g).replace('.', ',')} milliard${g >= 2 ? 's' : ''}${short ? '' : " d'années"}`;
  }
  return `${Math.round(ma)} millions${short ? '' : " d'années"}`;
}

function thumbImg(url) {
  if (!thumbImgs[url]) {
    const img = new Image();
    img.src = url;
    thumbImgs[url] = img;
  }
  return thumbImgs[url];
}

/* ---------- Sauvegarde ---------- */
/** Ce qui repart à zéro à chaque nouveau chapitre */
function freshChapter() {
  return { earned: 0, eaten: {}, done: [], maxSaid: false };
}

function newGame() {
  useLevel(0);
  game = {
    v: SAVE_VERSION,
    level: 0,
    chapter: 0,
    adn: 0,
    owned: {},
    seen: {},
    stats: { eaten: 0, escapes: 0, deaths: 0, evolutions: 0 },
    started: false,
    finished: false,
    path: null,
    pos: null,
    ...freshChapter(),
  };
}

function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && data.v === SAVE_VERSION && data.owned && data.stats && LEVELS[data.level]) {
      if (!LEVELS[data.level].chapters[data.chapter]) data.chapter = 0;
      return data;
    }
  } catch (e) { /* stockage indisponible ou abîmé */ }
  return null;
}

function saveGame() {
  if (!game) return;
  if (player && !player.dead) game.pos = { x: Math.round(player.x), y: Math.round(player.y) };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) { /* stockage indisponible */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignoré */ }
}

/* ---------- Les effets des évolutions ---------- */
function recalc() {
  const s = { speed: 1, ratio: BASE_RATIO, reach: 1, vision: 1, shield: 0, armored: false, dash: false };
  for (const id of Object.keys(game.owned)) {
    const e = EVOS[id] && EVOS[id].effect;
    if (!e) continue;
    if (e.speed) s.speed *= e.speed;
    if (e.ratio) s.ratio = Math.max(s.ratio, e.ratio);
    if (e.reach) s.reach = Math.max(s.reach, e.reach);
    if (e.vision) s.vision = Math.max(s.vision, e.vision);
    if (e.shield) s.shield = Math.max(s.shield, e.shield);
    if (e.armored) s.armored = true;
    if (e.dash) s.dash = true;
  }
  stats = s;
}

const growthK = () => clamp(game.earned / CH.growth, 0, 1);
const targetSize = () => CH.size[0] + (CH.size[1] - CH.size[0]) * growthK();
const maxSpeed = () => (BASE_SPEED + SPEED_PER_SIZE * player.size) * stats.speed;
const visionR = () => (140 + player.size * 9) * stats.vision;

/* Qui peut manger qui ? */
function canEat(c) {
  return c.size <= player.size * stats.ratio && (!c.sp.armored || stats.armored);
}
function isDanger(c) {
  return (c.sp.kind === 'hunter' || c.sp.kind === 'stinger') && player.size < c.size * DANGER_RATIO && !canEat(c);
}

/* ---------- Taille de l'écran ---------- */
function baseZoom() { return clamp(cssW / 950, 0.58, 1.1); }
/** Plus on est gros, plus la caméra recule (on voit plus loin) */
function targetZoom() {
  return baseZoom() * clamp(Math.pow(26 / player.size, 0.6), 0.3, 1.8);
}

function resize() {
  const rect = stage.getBoundingClientRect();
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  if (player) zoom = targetZoom();
  viewW = cssW / zoom;
  viewH = cssH / zoom;
  const m = minimap.getBoundingClientRect();
  minimap.width = Math.round(m.width * dpr);
  minimap.height = Math.round(m.height * dpr);
  if (state === 'ending') sizeCanvas(endCanvas, endOverlay);
  if (state === 'intro') sizeCanvas(introCanvas, introOverlay);
}

function sizeCanvas(c, host) {
  const r = host.getBoundingClientRect();
  c.width = Math.round(r.width * dpr);
  c.height = Math.round(r.height * dpr);
}

/* ---------- Construction du monde (décor) ---------- */
function buildWorld() {
  const W = LV.world;
  const rnd = mulberry32(1234 + game.level * 77);
  decor = [];
  algae = [];
  for (const d of W.decor) {
    for (let i = 0; i < d.count; i++) {
      let x = 0, y = 0;
      if (d.type === 'algues' && i === 0) {
        // la première forêt d'algues est juste au point de départ : on commence caché
        x = W.start.x; y = W.start.y;
      } else {
        x = 150 + rnd() * (W.w - 300);
        y = 150 + rnd() * (W.h - 300);
      }
      const item = { type: d.type, x, y, r: d.r[0] + rnd() * (d.r[1] - d.r[0]), seed: Math.floor(rnd() * 1e6), from: d.from || 1, to: d.to || 99 };
      if (d.type === 'algues') algae.push(item); else decor.push(item);
    }
  }
  if (algae[0]) algae[0].r = 220;
  motes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: rand(1, 2.6), d: rand(0.25, 0.7), p: rand(0, TAU) }));
}

/* ---------- Le joueur ---------- */
function formLook() {
  return CH.form === 'cellule' ? null : CH.form === 'ver' ? 'ver' : 'poisson';
}

function placePlayer(x, y) {
  const size = targetSize();
  player = {
    x, y, vx: 0, vy: 0, angle: -0.4, size,
    spine: null, mouth: 0, blink: 0, mood: 'happy', speed: 0,
    dash: 0, charge: 1, shield: stats.shield, shieldT: 0,
    invul: 1.5, hidden: false, dead: false, deadT: 0, squash: 0,
  };
  resetSpine(player, formLook());
  zoom = targetZoom();
  viewW = cssW / zoom;
  viewH = cssH / zoom;
  cam.x = x;
  cam.y = y;
}

function resetSpine(e, look) {
  e.spine = look ? makeSpine(e.x, e.y, e.angle, e.size, look) : null;
}

/** La colonne suit la tête : chaque point reste à la même distance du précédent */
function followSpine(e, look) {
  if (!e.spine) return;
  const gap = SPINES[look].gap * e.size;
  e.spine[0].x = e.x;
  e.spine[0].y = e.y;
  for (let i = 1; i < e.spine.length; i++) {
    const a = e.spine[i - 1], b = e.spine[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    b.x = a.x + dx / d * gap;
    b.y = a.y + dy / d * gap;
  }
}

/* ---------- Les créatures ---------- */
function spawnCreature(id, initial = false) {
  const sp = SPECIES[id];
  const W = LV.world;
  const half = Math.hypot(viewW, viewH) / 2;
  const far = half * 1.7;
  const hunter = sp.kind === 'hunter' || sp.kind === 'stinger';
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * TAU;
    const minD = initial ? (hunter ? half * 1.05 : sp.size + 120) : half + sp.size * 2;
    const d = rand(minD, far);
    const x = player.x + Math.cos(a) * d, y = player.y + Math.sin(a) * d;
    if (x < sp.size + 60 || y < sp.size + 60 || x > W.w - sp.size - 60 || y > W.h - sp.size - 60) continue;
    const vary = sp.kind === 'hunter' ? 1 : rand(0.9, 1.1);
    const c = {
      id, sp, x, y, vx: 0, vy: 0, angle: Math.random() * TAU,
      size: sp.size * vary, spine: null,
      state: 'wander', timer: 0, rest: 0, lunge: 0, wx: x, wy: y,
      seed: Math.random() * 10, mouth: 0, blink: 0, mood: 'calm',
      mark: null, markT: 0, eatT: rand(0, 0.3), chased: false,
    };
    resetSpine(c, SPINES[sp.look] ? sp.look : null);
    creatures.push(c);
    return c;
  }
  return null;
}

function populate() {
  creatures = [];
  for (const [id, n] of Object.entries(CH.species)) {
    for (let i = 0; i < n; i++) spawnCreature(id, true);
  }
}

/** Garde le bon nombre de créatures autour du joueur (elles apparaissent hors de l'écran) */
function maintainPopulation(dt) {
  spawnT -= dt;
  if (spawnT > 0) return;
  spawnT = 0.3;
  const half = Math.hypot(viewW, viewH) / 2;
  const far = half * 1.7;
  creatures = creatures.filter((c) => c.state === 'chase' || dist(c, player) < far * 1.35);
  const counts = {};
  for (const c of creatures) counts[c.id] = (counts[c.id] || 0) + 1;
  for (const [id, n] of Object.entries(CH.species)) {
    let missing = n - (counts[id] || 0);
    while (missing-- > 0) spawnCreature(id);
  }
}

/* ---------- Commandes ---------- */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',     // KeyA = touche Q sur un clavier AZERTY
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',           // KeyW = touche Z sur un clavier AZERTY
  ArrowDown: 'down', KeyS: 'down',
};

function isBlocked() {
  return !dialogEl.hidden || !quitOverlay.hidden || state !== 'playing';
}

window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (state === 'intro') {
    if (['Escape', 'Enter', 'Space'].includes(e.code)) { e.preventDefault(); endIntro(); }
    return;
  }
  if (!quitOverlay.hidden) {
    if (e.code === 'Escape') closeQuit();
    return;
  }
  if (!dialogEl.hidden) {
    if (e.code === 'Escape' && dialogActions.close) closeDialog();
    return;
  }
  if (state === 'ready') {
    if (e.code === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); startGame(); }
    return;
  }
  if (state !== 'playing') return;
  const dir = KEYMAP[e.code];
  if (dir) {
    keys[dir] = true;
    e.preventDefault();
    return;
  }
  if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    if (!e.repeat) activateDash();
  } else if (e.code === 'KeyE' || e.code === 'KeyV') {
    openEvolutions();
  }
});

window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) keys[dir] = false;
});

function releaseAll() {
  Object.keys(keys).forEach((k) => { keys[k] = false; });
  Object.keys(touchDirs).forEach((k) => { touchDirs[k] = false; });
  pointer.active = false;
}
window.addEventListener('blur', releaseAll);

document.querySelectorAll('.dpad button').forEach((btn) => {
  const dir = btn.dataset.dir;
  const press = (e) => { e.preventDefault(); touchDirs[dir] = true; btn.classList.add('pressed'); };
  const release = () => { touchDirs[dir] = false; btn.classList.remove('pressed'); };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
});
dashBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); activateDash(); });

// Garder le doigt (ou la souris) appuyé : on nage vers lui. Double-tape : sprint !
function updatePointer(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = e.clientX - rect.left;
  pointer.y = e.clientY - rect.top;
}
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'playing' || isBlocked()) return;
  e.preventDefault();
  pointer.active = true;
  pointer.id = e.pointerId;
  updatePointer(e);
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
  const now = performance.now();
  if (now - pointer.lastDown < 320) activateDash();
  pointer.lastDown = now;
});
canvas.addEventListener('pointermove', (e) => {
  if (pointer.active && e.pointerId === pointer.id) updatePointer(e);
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => {
  canvas.addEventListener(ev, (e) => { if (e.pointerId === pointer.id) pointer.active = false; });
});

function inputDir() {
  if (botInput) return botInput();
  let dx = 0, dy = 0;
  if (keys.left || touchDirs.left) dx -= 1;
  if (keys.right || touchDirs.right) dx += 1;
  if (keys.up || touchDirs.up) dy -= 1;
  if (keys.down || touchDirs.down) dy += 1;
  if (pointer.active && !dx && !dy) {
    const s = worldToScreen(player.x, player.y);
    const px = pointer.x - s.x, py = pointer.y - s.y;
    const d = Math.hypot(px, py);
    if (d > 12) { dx = px / d; dy = py / d; }
  }
  const d = Math.hypot(dx, dy);
  return d > 0 ? { x: dx / d, y: dy / d } : null;
}

function activateDash() {
  if (state !== 'playing' || isBlocked() || !player || player.dead) return;
  if (player.charge < 1) {
    addFloater('Sprint en charge…', player.x, player.y - player.size * 1.6, '#9EE7FF', 0.7);
    return;
  }
  player.dash = DASH_TIME;
  player.charge = 0;
  game.dashUsed = true;
  shake = Math.max(shake, 0.12);
  sfx.dash();
  for (let i = 0; i < 10; i++) bubbleAt(player.x - Math.cos(player.angle) * player.size, player.y - Math.sin(player.angle) * player.size, player.size * 0.25);
}

/* Le bouton Fonce se remplit pendant la recharge */
let shownCharge = -1;
function renderDashBtn() {
  const k = player.dash > 0 ? 0 : Math.round(player.charge * 20) / 20;
  if (k === shownCharge) return;
  shownCharge = k;
  dashBtn.style.setProperty('--charge', `${k * 100}%`);
  dashBtn.classList.toggle('charging', k < 1);
}

/* ---------- Ammo, le guide ---------- */
function say(text, prio = 1, dur = 4500) {
  const now = performance.now();
  if (now < ammo.until && prio < ammo.prio) return;
  bubble.textContent = text;
  bubble.classList.remove('show');
  void bubble.offsetWidth;
  bubble.classList.add('show');
  copilot.classList.add('talking');
  ammo = { until: now + dur, prio };
  sfx.ammo();
  nextJokeAt = Math.max(nextJokeAt, now + 30000);
}

function sayOnce(key, lines, cooldownS, prio = 1) {
  const now = performance.now();
  if ((cooldowns[key] || 0) > now) return false;
  cooldowns[key] = now + cooldownS * 1000;
  say(typeof lines === 'string' ? lines : pick(lines), prio);
  return true;
}

function updateAmmo(now) {
  if (ammo.until && now > ammo.until) {
    bubble.classList.remove('show');
    copilot.classList.remove('talking');
    ammo = { until: 0, prio: 0 };
  }
  if (state !== 'playing' || isBlocked()) return;
  // les conseils du chapitre, un de temps en temps
  if (now > nextTipAt && !ammo.until && CH.tips) {
    const i = CH.tips.findIndex((_, k) => !game.tipsSaid || !game.tipsSaid[`${game.chapter}-${k}`]);
    if (i >= 0) {
      game.tipsSaid = game.tipsSaid || {};
      game.tipsSaid[`${game.chapter}-${i}`] = true;
      say(CH.tips[i], 1, 6000);
    }
    nextTipAt = now + rand(35000, 50000);
  }
  if (now > nextJokeAt && !ammo.until) {
    say(pick(LINES.jokes), 0, 7000);
    nextJokeAt = now + rand(60000, 90000);
  }
  if (now - lastMoveAt > 14000) {
    sayOnce('idle', LINES.idle, 40, 1);
    lastMoveAt = now;
  }
}

/* ---------- Effets ---------- */
function burst(x, y, count, colors, speed, size) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU;
    const s = rand(speed * 0.3, speed);
    particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0, max: rand(0.45, 0.9), size: rand(size * 0.5, size),
      color: colors[Math.floor(Math.random() * colors.length)], bubble: false,
    });
  }
}

function bubbleAt(x, y, size) {
  particles.push({
    x: x + rand(-size, size), y: y + rand(-size, size), vx: rand(-20, 20), vy: rand(-40, -10),
    life: 0, max: rand(0.6, 1.2), size: rand(size * 0.4, size), color: '#FFFFFF', bubble: true,
  });
}

/** Texte qui monte et s'efface ; size en part de la taille de l'écran (1 = normal) */
function addFloater(text, x, y, color, size = 1) {
  floaters.push({ text, x, y, life: 0, max: 1.4, color, size });
}

function confetti(n = 60) {
  const colors = ['#FFC93C', '#FF6F91', '#4FB8E8', '#58C97B', '#B58CF0'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = pick(colors);
    p.style.animationDuration = `${rand(1.8, 3.2)}s`;
    p.style.animationDelay = `${rand(0, 0.5)}s`;
    confettiLayer.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

function buzz(pattern) {
  if (!phoneMQ.matches || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (err) { /* ignoré */ }
}

/* ---------- Fiche « Le savais-tu ? » ---------- */
function showFact({ img, tag, name, where, fact }) {
  if (!factCard.hidden) {
    factQueue.push({ img, tag, name, where, fact });
    return;
  }
  $('fcImg').src = img;
  $('fcTag').textContent = tag;
  $('fcName').textContent = name;
  $('fcWhere').textContent = where || '';
  $('fcFact').textContent = fact;
  factCard.hidden = false;
  factCard.classList.remove('pop');
  void factCard.offsetWidth;
  factCard.classList.add('pop');
  clearTimeout(factTimer);
  factTimer = setTimeout(hideFact, 9000);
}

function hideFact() {
  factCard.hidden = true;
  clearTimeout(factTimer);
  const next = factQueue.shift();
  if (next) setTimeout(() => showFact(next), 400);
}
factCard.addEventListener('click', hideFact);

function speciesFact(id) {
  const sp = SPECIES[id];
  const tag = sp.kind === 'hunter' ? '⚠️ Chasseur !' : sp.kind === 'stinger' ? '⚠️ Ça pique !' : '👀 Nouvelle espèce';
  showFact({ img: speciesThumb(id, sp), tag, name: sp.name, where: `il y a ${fmtAgo(CH.ago[0])}`, fact: sp.fact });
}

/* ---------- Mise à jour du joueur ---------- */
function updatePlayer(dt) {
  const p = player;
  if (p.dead) {
    p.deadT -= dt;
    if (p.deadT <= 0) respawn();
    return;
  }
  const dir = inputDir();
  if (dir) lastMoveAt = performance.now();
  const ms = maxSpeed();
  const dashing = p.dash > 0;
  const boost = dashing ? DASH_BOOST * (stats.dash ? 1.1 : 1) : 1;
  let want = dir;
  if (dashing && !want) want = { x: Math.cos(p.angle), y: Math.sin(p.angle) };
  if (want) {
    const acc = ms * boost * DRAG;
    p.vx += want.x * acc * dt;
    p.vy += want.y * acc * dt;
  }
  const k = Math.exp(-DRAG * dt);
  p.vx *= k;
  p.vy *= k;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  const W = LV.world;
  const m = p.size + 20;
  if (p.x < m) { p.x = m; p.vx = Math.abs(p.vx) * 0.3; }
  if (p.y < m) { p.y = m; p.vy = Math.abs(p.vy) * 0.3; }
  if (p.x > W.w - m) { p.x = W.w - m; p.vx = -Math.abs(p.vx) * 0.3; }
  if (p.y > W.h - m) { p.y = W.h - m; p.vy = -Math.abs(p.vy) * 0.3; }
  const sp = Math.hypot(p.vx, p.vy);
  p.speed = clamp(sp / ms, 0, 1.5);
  if (sp > 8) p.angle = turnToward(p.angle, Math.atan2(p.vy, p.vx), (stats.dash ? 10 : TURN) * dt);
  if (dashing) {
    p.dash -= dt;
    if (Math.random() < dt * 30) bubbleAt(p.x - Math.cos(p.angle) * p.size, p.y - Math.sin(p.angle) * p.size, p.size * 0.22);
  } else {
    p.charge = Math.min(1, p.charge + dt / (stats.dash ? 2.2 : DASH_RECHARGE));
  }
  // la taille suit ce qu'on a mangé
  const ts = targetSize();
  p.size += (ts - p.size) * (1 - Math.exp(-3 * dt));
  followSpine(p, formLook());
  p.invul = Math.max(0, p.invul - dt);
  p.squash = Math.max(0, p.squash - dt * 4);
  p.blink = (worldT % 3.7) < 0.12 ? 1 : 0;
  // la carapace se répare toute seule
  if (p.shield < stats.shield) {
    p.shieldT += dt;
    if (p.shieldT >= SHIELD_RECHARGE) { p.shield++; p.shieldT = 0; }
  }
  // caché dans les algues ?
  const wasHidden = p.hidden;
  p.hidden = algae.some((a) => dist(a, p) < a.r * 0.85 - p.size * 0.5);
  if (p.hidden && !wasHidden && creatures.some((c) => c.state === 'chase')) sayOnce('hidden', LINES.hidden, 20, 2);
  // la bouche s'ouvre quand il y a quelque chose à croquer devant
  const mx = p.x + Math.cos(p.angle) * p.size * 0.8, my = p.y + Math.sin(p.angle) * p.size * 0.8;
  let wantMouth = 0;
  for (const c of creatures) {
    if (!canEat(c)) continue;
    if (Math.hypot(c.x - mx, c.y - my) < c.size + p.size * 1.6) { wantMouth = 1; break; }
  }
  p.mouth += (wantMouth - p.mouth) * (1 - Math.exp(-12 * dt));
  p.mood = creatures.some((c) => c.state === 'chase') ? 'scared' : 'happy';
}

function respawn() {
  const p = player;
  // on renaît dans la forêt d'algues la plus proche (mais pas sous le nez du chasseur)
  let best = algae[0], bd = Infinity;
  for (const a of algae) {
    const d = dist(a, p);
    if (d > 500 && d < bd && a.r > p.size * 1.5) { bd = d; best = a; }
  }
  p.x = best.x;
  p.y = best.y;
  p.vx = p.vy = 0;
  p.dead = false;
  p.invul = INVUL_TIME;
  p.size = targetSize();
  resetSpine(p, formLook());
  flash = { a: 0.6, color: '255,255,255' };
  for (let i = 0; i < 16; i++) bubbleAt(p.x, p.y, p.size * 0.5);
  sfx.pickup();
}

/* ---------- Mise à jour des créatures ---------- */
function steer(c, tx, ty, speed, dt) {
  const k = 1 - Math.exp(-3 * dt);
  c.vx += (tx * speed - c.vx) * k;
  c.vy += (ty * speed - c.vy) * k;
}

function updateCreatures(dt) {
  const p = player;
  const W = LV.world;
  let chasers = creatures.filter((c) => c.state === 'chase' || c.state === 'alert').length;
  for (const c of creatures) {
    const sp = c.sp;
    const dx = p.x - c.x, dy = p.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    c.rest = Math.max(0, c.rest - dt);
    c.markT = Math.max(0, c.markT - dt);
    if (c.markT <= 0) c.mark = null;
    c.blink = ((worldT + c.seed) % 4.3) < 0.12 ? 1 : 0;
    const edible = !p.dead && canEat(c);
    const danger = !p.dead && isDanger(c);
    let mouthTarget = 0;

    if (sp.kind === 'food' || sp.kind === 'stinger') {
      // dérive tranquille
      c.angle += Math.sin(worldT * 0.5 + c.seed * 3) * dt * 0.6;
      steer(c, Math.cos(c.angle), Math.sin(c.angle), sp.speed, dt);
      c.mood = 'calm';
    } else if (edible && d < (sp.sense || 200) && !p.hidden) {
      // il a peur : il s'enfuit en zigzag
      if (c.state === 'chase' || c.state === 'alert') { c.state = 'wander'; chasers--; }
      const zig = Math.sin(worldT * 5 + c.seed * 4) * 0.6;
      const a = Math.atan2(-dy, -dx) + zig;
      steer(c, Math.cos(a), Math.sin(a), sp.speed * (sp.kind === 'hunter' ? 0.85 : 1), dt);
      c.mood = 'scared';
      c.fleeing = true;
    } else if (sp.kind === 'hunter' && danger) {
      c.fleeing = false;
      c.mood = 'angry';
      if (c.state === 'wander') {
        wander(c, sp.speed * 0.42, dt);
        const sees = !p.hidden && p.invul <= 0 && d < sp.sense && c.rest <= 0;
        if (sees && chasers < MAX_CHASERS) {
          c.state = 'alert';
          c.timer = ALERT_TIME;
          c.mark = '!';
          c.markT = 1.1;
          chasers++;
          if (onScreen(c, 60)) {
            sfx.alert();
            buzz(40);
            if (sayOnce('spotted', LINES.spotted, 12, 2) && !game.dashUsed) later(() => sayOnce('dashHint', LINES.dashHint, 60, 2), 2200);
          }
        }
      } else if (c.state === 'alert') {
        steer(c, 0, 0, 0, dt);
        c.angle = turnToward(c.angle, Math.atan2(dy, dx), 9 * dt);
        mouthTarget = 0.4;
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = 'chase';
          c.timer = CHASE_TIME;
          c.lunge = LUNGE_TIME;
          c.chased = true;
        }
      } else if (c.state === 'chase') {
        c.timer -= dt;
        c.lunge -= dt;
        const lx = p.x + p.vx * 0.25 - c.x, ly = p.y + p.vy * 0.25 - c.y;
        const ld = Math.hypot(lx, ly) || 1;
        steer(c, lx / ld, ly / ld, sp.speed * (c.lunge > 0 ? LUNGE : 1), dt);
        if (d < c.size * 2.6 + p.size) {
          mouthTarget = 0.5 + 0.5 * Math.abs(Math.sin(worldT * 9));
          if (Math.random() < dt * 2.5 && onScreen(c, 0)) sfx.snap();
        }
        if (p.hidden || d > sp.sense * 1.6 || c.timer <= 0) loseTrack(c, true);
      }
    } else {
      // ni proie ni danger : il se promène
      if (c.state === 'chase' || c.state === 'alert') loseTrack(c, false);
      c.fleeing = false;
      c.mood = sp.kind === 'hunter' ? 'angry' : 'calm';
      wander(c, sp.speed * 0.35, dt);
    }

    // les chasseurs grignotent aussi les petites bêtes qui passent devant leur gueule
    if (sp.kind === 'hunter') {
      c.eatT -= dt;
      if (c.eatT <= 0) {
        c.eatT = 0.25;
        const mx = c.x + Math.cos(c.angle) * c.size * 0.8, my = c.y + Math.sin(c.angle) * c.size * 0.8;
        for (const o of creatures) {
          if (o === c || o.dead || o.size > c.size * 0.55) continue;
          if (Math.hypot(o.x - mx, o.y - my) < o.size + c.size * 0.35) {
            o.dead = true;
            c.chomp = 0.35;
            if (onScreen(o, 0)) {
              burst(o.x, o.y, 6, [o.sp.color || '#FFFFFF', '#FFFFFF'], o.size * 6, o.size * 0.25);
              if (dist(o, p) < viewW * 0.4) sfx.eat(0.6);
            }
            break;
          }
        }
      }
    }
    if (c.chomp > 0) { c.chomp -= dt; mouthTarget = c.chomp > 0.15 ? 1 : 0; }
    c.mouth += (mouthTarget - c.mouth) * (1 - Math.exp(-14 * dt));

    c.x += c.vx * dt;
    c.y += c.vy * dt;
    const m = c.size + 40;
    if (c.x < m || c.x > W.w - m) { c.vx = -c.vx; c.x = clamp(c.x, m, W.w - m); c.wx = W.w / 2; }
    if (c.y < m || c.y > W.h - m) { c.vy = -c.vy; c.y = clamp(c.y, m, W.h - m); c.wy = W.h / 2; }
    const v = Math.hypot(c.vx, c.vy);
    if (v > 4 && c.state !== 'alert') c.angle = turnToward(c.angle, Math.atan2(c.vy, c.vx), 5 * dt);
    followSpine(c, sp.look);
  }
  if (creatures.some((c) => c.dead)) creatures = creatures.filter((c) => !c.dead);
}

function wander(c, speed, dt) {
  if (Math.hypot(c.wx - c.x, c.wy - c.y) < c.size * 2 + 30 || Math.random() < dt * 0.15) {
    const a = Math.random() * TAU, d = rand(150, 600);
    c.wx = c.x + Math.cos(a) * d;
    c.wy = c.y + Math.sin(a) * d;
  }
  const dx = c.wx - c.x, dy = c.wy - c.y;
  const d = Math.hypot(dx, dy) || 1;
  steer(c, dx / d, dy / d, speed, dt);
}

/** Le chasseur abandonne : « ? » au-dessus de lui, et le joueur souffle */
function loseTrack(c, escaped) {
  const wasChasing = c.state === 'chase';
  c.state = 'wander';
  c.rest = GIVE_UP_REST;
  if (!wasChasing) return;
  c.mark = '?';
  c.markT = 1.2;
  if (escaped && !player.dead && !creatures.some((o) => o !== c && o.state === 'chase')) {
    game.stats.escapes++;
    sfx.phew();
    addFloater('Ouf !', player.x, player.y - player.size * 1.8, '#9EE7FF', 1.1);
    sayOnce('escaped', LINES.escaped, 15, 2);
  }
}

function onScreen(e, margin) {
  const s = worldToScreen(e.x, e.y);
  const r = (e.size || 0) * zoom + margin;
  return s.x > -r && s.y > -r && s.x < cssW + r && s.y < cssH + r;
}

/* ---------- Qui mange qui ---------- */
function updateContacts() {
  const p = player;
  if (p.dead) return;
  const fx = Math.cos(p.angle), fy = Math.sin(p.angle);
  const mx = p.x + fx * p.size * 0.8, my = p.y + fy * p.size * 0.8;
  for (const c of creatures) {
    if (c.dead) continue;
    const dm = Math.hypot(c.x - mx, c.y - my);
    // 1. le joueur croque
    if (canEat(c)) {
      if (dm < c.size * 0.9 + p.size * 0.38 * stats.reach) { playerEats(c); continue; }
    } else if (c.sp.armored && c.size <= p.size * stats.ratio && dm < c.size + p.size * 0.4) {
      // trop dur !
      if (performance.now() > eatHintAt) {
        eatHintAt = performance.now() + 2500;
        sfx.clank();
        addFloater('Trop dur !', c.x, c.y - c.size * 1.4, '#FFD24A', 0.9);
        sayOnce('tooHard', LINES.tooHard, 30, 1);
      }
    }
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    // 2. un chasseur nous croque avec sa gueule
    if (c.sp.kind === 'hunter' && isDanger(c) && p.invul <= 0) {
      const cmx = c.x + Math.cos(c.angle) * c.size * 0.8, cmy = c.y + Math.sin(c.angle) * c.size * 0.8;
      if (Math.hypot(cmx - p.x, cmy - p.y) < p.size * 0.85 + c.size * 0.3) {
        bitten(c);
        if (p.dead) return;
        continue;
      }
    }
    // 3. une méduse pique
    if (c.sp.kind === 'stinger' && isDanger(c) && p.invul <= 0 && d < c.size * 0.85 + p.size * 0.7) {
      stung(c);
      continue;
    }
    // 4. on se cogne
    const touch = c.size * 0.75 + p.size * 0.75;
    if (d < touch && !canEat(c) && !(c.sp.kind === 'food')) {
      const push = (touch - d) / 2;
      const nx = (c.x - p.x) / (d || 1), ny = (c.y - p.y) / (d || 1);
      const heavy = c.size / (c.size + p.size);
      p.x -= nx * push * heavy * 2;
      p.y -= ny * push * heavy * 2;
      c.x += nx * push * (1 - heavy) * 2;
      c.y += ny * push * (1 - heavy) * 2;
    }
  }
  // l'ADN perdu à récupérer
  for (const dr of drops) {
    if (dr.got) continue;
    if (dist(dr, p) < p.size + dr.r) {
      dr.got = true;
      game.adn += dr.adn;
      sfx.pickup();
      addFloater(`+${dr.adn} 🧬`, dr.x, dr.y, '#FFE58A', 0.9);
      bump(adnItem);
    }
  }
}

function playerEats(c) {
  const p = player;
  c.dead = true;
  const sp = c.sp;
  const before = growthK();
  game.adn += sp.adn;
  game.earned += sp.adn;
  game.eaten[c.id] = (game.eaten[c.id] || 0) + 1;
  game.stats.eaten++;
  const big = clamp(c.size / p.size, 0, 1);
  sfx.eat(big);
  p.squash = 1;
  p.mouth = 1;
  burst(c.x, c.y, 8 + Math.round(big * 12), [sp.color || '#FFE58A', '#FFFFFF'], c.size * 5 + 40, Math.max(2, c.size * 0.2));
  addFloater(`+${sp.adn} 🧬`, c.x, c.y - c.size, '#FFE58A', 0.8 + big * 0.5);
  bump(adnItem);
  if (big > 0.5) { shake = Math.max(shake, 0.2 + big * 0.2); buzz(30); }
  if (sp.kind === 'hunter') {
    addFloater('CROC !', c.x, c.y - c.size * 1.8, '#FF6F91', 1.4);
    sayOnce('revenge', LINES.revenge, 60, 2);
  }
  if (before < 1 && growthK() >= 1 && !game.maxSaid) {
    game.maxSaid = true;
    later(() => say(LINES.maxSize, 2, 6000), 600);
  }
  if (affordable() && !cooldowns.evoHintShown) {
    cooldowns.evoHintShown = true;
    say(LINES.canEvolve, 2, 6000);
  }
  checkMissions();
}

function bitten(c) {
  const p = player;
  const nx = (p.x - c.x) / (dist(p, c) || 1), ny = (p.y - c.y) / (dist(p, c) || 1);
  c.chomp = 0.4;
  if (p.shield > 0) {
    // la carapace encaisse
    p.shield--;
    p.shieldT = 0;
    p.invul = 1.3;
    p.vx = nx * maxSpeed() * 2.2;
    p.vy = ny * maxSpeed() * 2.2;
    c.state = 'wander';
    c.rest = 2.5;
    sfx.shield();
    shake = 0.35;
    flash = { a: 0.35, color: '255,240,180' };
    addFloater('CLANG !', p.x, p.y - p.size * 1.6, '#FFD24A', 1.3);
    sayOnce('shield', LINES.shield, 20, 2);
    buzz([30, 40, 30]);
    return;
  }
  playerEaten(c);
}

function playerEaten(by) {
  const p = player;
  sfx.gulp();
  buzz([80, 60, 120]);
  shake = 0.7;
  flash = { a: 0.55, color: '255,60,80' };
  by.chomp = 0.6;
  by.state = 'wander';
  by.rest = FULL_REST;
  by.mark = null;
  burst(p.x, p.y, 24, ['#6EE0B0', '#FFFFFF', '#B9F5DA'], p.size * 8 + 60, Math.max(2, p.size * 0.18));
  addFloater('GLOUPS !', p.x, p.y - p.size * 1.5, '#FF6F91', 1.8);
  // on perd la moitié de son ADN (il flotte là : on peut essayer de le récupérer)
  const lost = Math.floor(game.adn * EATEN_ADN_LOSS);
  if (lost > 0) {
    game.adn -= lost;
    const n = Math.min(6, Math.max(1, Math.ceil(lost / 8)));
    for (let i = 0; i < n; i++) {
      const share = Math.floor(lost / n) + (i < lost % n ? 1 : 0);
      const a = Math.random() * TAU, s = rand(60, 160);
      drops.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.max(8, p.size * 0.35), adn: share, life: DROP_LIFE, seed: Math.random() * 10 });
    }
  }
  game.earned = Math.max(0, game.earned - CH.growth * EATEN_GROWTH_LOSS);
  game.stats.deaths++;
  p.dead = true;
  p.deadT = RESPAWN_TIME;
  for (const c of creatures) if (c.state === 'chase' || c.state === 'alert') { c.state = 'wander'; c.rest = GIVE_UP_REST; }
  say(pick(LINES.eaten), 3, 6000);
  saveGame();
}

function stung(c) {
  const p = player;
  const d = dist(p, c) || 1;
  p.vx = (p.x - c.x) / d * maxSpeed() * 2;
  p.vy = (p.y - c.y) / d * maxSpeed() * 2;
  p.invul = 1.3;
  const lost = Math.floor(game.adn * 0.25);
  if (lost > 0) {
    game.adn -= lost;
    drops.push({ x: p.x, y: p.y, vx: rand(-80, 80), vy: rand(-80, 80), r: Math.max(8, p.size * 0.3), adn: lost, life: DROP_LIFE, seed: Math.random() * 10 });
  }
  sfx.sting();
  shake = 0.3;
  flash = { a: 0.35, color: '255,120,255' };
  addFloater('Aïe !', p.x, p.y - p.size * 1.6, '#F6A6FF', 1.3);
  sayOnce('stung', LINES.stung, 25, 2);
  buzz(60);
}

/* ---------- Missions et chapitres ---------- */
function missionInfo(m) {
  if (m.type === 'eat') {
    const sp = SPECIES[m.species];
    const cur = Math.min(m.n, game.eaten[m.species] || 0);
    const name = m.n > 1 ? sp.plural : sp.proper ? sp.name : sp.name.toLowerCase();
    return { text: `Croque ${m.n} ${name}`, cur, max: m.n, done: cur >= m.n, img: speciesThumb(m.species, sp), revenge: m.revenge };
  }
  if (m.type === 'evolve') {
    const e = EVOS[m.part];
    return { text: `Évolue : ${e.name}`, cur: game.owned[m.part] ? 1 : 0, max: 1, done: !!game.owned[m.part], img: playerThumb(CH.form, { ...game.owned, [m.part]: true }), evo: true };
  }
  const pct = Math.floor(growthK() * 100);
  return { text: 'Grandis au maximum', cur: pct, max: 100, done: pct >= 100, img: playerThumb(CH.form, game.owned), pct: true };
}

function checkMissions() {
  let all = true;
  CH.missions.forEach((m, i) => {
    const info = missionInfo(m);
    if (info.done && !game.done.includes(i)) {
      game.done.push(i);
      sfx.mission();
      addFloater('Mission réussie !', player.x, player.y - player.size * 2.4, '#7CF0A0', 1.2);
      confetti(30);
    }
    if (!info.done) all = false;
  });
  renderMissions();
  if (all && state === 'playing' && !game.chapterDone) {
    game.chapterDone = true;
    saveGame();
    later(chapterComplete, 900);
  }
}

function missionsProgress() {
  const n = CH.missions.length;
  return CH.missions.filter((m) => missionInfo(m).done).length / n;
}

function chapterComplete() {
  const last = game.chapter >= CHAPTERS.length - 1;
  sfx.chapter();
  confetti(90);
  if (last) {
    later(startEnding, 1200);
    return;
  }
  const next = CHAPTERS[game.chapter + 1];
  openDialog(`
    <div class="dlg-head">
      <div class="dlg-face ammo-face">${AMMO_SVG}</div>
      <div><p class="dlg-chapter">Chapitre ${game.chapter + 1} terminé !</p><p class="dlg-name">Bravo ! 🎉</p></div>
    </div>
    <p class="dlg-say">Tu as survécu à « ${escapeHtml(CH.title)} ». Mais l'évolution ne s'arrête jamais… Tes descendants vont continuer à changer, génération après génération.</p>
    <p class="dlg-mission">⏳ Prochaine époque : <b>il y a ${fmtAgo(next.ago[0])}</b> — ${escapeHtml(next.title)}</p>
    <div class="dlg-actions"><button class="royal" data-act="go">⏩ Avancer dans le temps</button></div>`, {
    go: () => { closeDialog(); timeTravel(); },
  });
}

/** « Des millions d'années plus tard… » : on passe au chapitre suivant */
function timeTravel() {
  state = 'time';
  const from = CH.ago[1];
  game.chapter += 1;
  Object.assign(game, freshChapter());
  game.chapterDone = false;
  CH = CHAPTERS[game.chapter];
  const to = CH.ago[0];
  sfx.time();
  timeOverlay.hidden = false;
  timeOverlay.classList.remove('go');
  void timeOverlay.offsetWidth;
  timeOverlay.classList.add('go');
  const counter = $('timeCount');
  const t0 = performance.now();
  const tick = () => {
    const k = clamp((performance.now() - t0) / 2200, 0, 1);
    const e = 1 - (1 - k) ** 3;
    counter.textContent = `Il y a ${fmtAgo(from + (to - from) * e)}`;
    if (k < 1) requestAnimationFrame(tick);
  };
  tick();
  // pendant ce temps, le monde change
  setupChapter(true);
  later(() => {
    timeOverlay.hidden = true;
    state = 'playing';
    flash = { a: 0.7, color: '255,255,255' };
    for (let i = 0; i < 24; i++) bubbleAt(player.x, player.y, player.size * 0.6);
    openChapterIntro();
    saveGame();
  }, 3000);
}

function setupChapter(keepPos) {
  floorTile = buildFloorTile(CH.palette.floor, game.chapter + 3);
  const x = keepPos && player ? player.x : (game.pos ? game.pos.x : LV.world.start.x);
  const y = keepPos && player ? player.y : (game.pos ? game.pos.y : LV.world.start.y);
  placePlayer(x, y);
  drops = [];
  particles = [];
  floaters = [];
  populate();
  missionsShown = '';
  renderAll();
}

function openChapterIntro() {
  const rows = CH.missions.map((m) => {
    const info = missionInfo(m);
    return `<li><img src="${info.img}" alt=""><span>${escapeHtml(info.text)}${info.revenge ? ' <small>(ta revanche !)</small>' : ''}</span></li>`;
  }).join('');
  const unlocks = CH.unlock.map((id) => `<span class="chip">🧬 ${escapeHtml(EVOS[id].name)}</span>`).join(' ');
  openDialog(`
    <div class="dlg-head">
      <div class="dlg-face ammo-face">${AMMO_SVG}</div>
      <div><p class="dlg-chapter">Chapitre ${game.chapter + 1} / ${CHAPTERS.length} — il y a ${fmtAgo(CH.ago[0])}</p><p class="dlg-name">${escapeHtml(CH.title)}</p></div>
    </div>
    <p class="dlg-say">${escapeHtml(CH.intro)}</p>
    <p class="dlg-sub">🎯 Tes missions :</p>
    <ul class="mission-rows">${rows}</ul>
    <p class="dlg-unlocks">Nouvelles évolutions possibles : ${unlocks}</p>
    <div class="dlg-actions"><button class="primary" data-act="close">C'est parti !</button></div>`, {
    close: closeDialog,
  });
}

/* ---------- Évoluer ---------- */
function affordable() {
  return Object.entries(EVOS).some(([id, e]) => !game.owned[id] && e.ch <= game.chapter + 1 && e.cost <= game.adn);
}

function openEvolutions() {
  if (state !== 'playing' || !dialogEl.hidden || evolving) return;
  sfx.click();
  const rows = Object.entries(EVOS).map(([id, e]) => {
    const owned = !!game.owned[id];
    const open = e.ch <= game.chapter + 1;
    const img = playerThumb(CH.form, { ...game.owned, [id]: true });
    if (!open) {
      return `<li class="evo-row locked"><img src="${img}" alt=""><span class="sr-text"><b>${escapeHtml(e.name)}</b><small>🔒 Dans des millions d'années (chapitre ${e.ch})</small></span></li>`;
    }
    const btn = owned ? '<span class="shop-max">✓ Acquis</span>'
      : `<button class="buy" data-act="buy:${id}" ${game.adn < e.cost ? 'disabled' : ''}>${e.cost} 🧬</button>`;
    return `<li class="evo-row${owned ? ' owned' : ''}"><img src="${img}" alt=""><span class="sr-text"><b>${escapeHtml(e.name)}</b><small>${escapeHtml(e.short)}</small>${!owned && game.adn < e.cost ? `<small class="sr-poor">Il te manque ${e.cost - game.adn} 🧬</small>` : ''}</span>${btn}</li>`;
  }).join('');
  const actions = { close: closeDialog };
  for (const id of Object.keys(EVOS)) actions[`buy:${id}`] = () => { closeDialog(); evolve(id); };
  openDialog(`
    <p class="dlg-title">🧬 Évoluer</p>
    <p class="dlg-sub">Tu as <b>${game.adn} 🧬</b> d'ADN. Choisis comment tes descendants vont changer :</p>
    <ul class="shop-rows">${rows}</ul>
    <div class="dlg-actions"><button class="primary" data-act="close">Retour à l'océan</button></div>`, actions, true);
}

function evolve(id) {
  const e = EVOS[id];
  if (!e || game.owned[id] || game.adn < e.cost) return;
  game.adn -= e.cost;
  game.owned[id] = true;
  game.stats.evolutions++;
  recalc();
  player.shield = stats.shield;
  evolving = { t: 0, id };
  sfx.evolve();
  shake = 0.25;
  buzz([20, 40, 20, 40, 60]);
  saveGame();
}

function updateEvolving(dt) {
  evolving.t += dt;
  if (Math.random() < dt * 40) {
    const a = Math.random() * TAU, r = player.size * rand(1.2, 2.2);
    particles.push({ x: player.x + Math.cos(a) * r, y: player.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 1.5, vy: -Math.sin(a) * r * 1.5, life: 0, max: 0.6, size: player.size * 0.12, color: pick(['#FFE58A', '#9EE7FF', '#FFFFFF', '#B9F5DA']), bubble: false });
  }
  if (evolving.t >= 1.5) {
    const e = EVOS[evolving.id];
    flash = { a: 0.8, color: '255,255,255' };
    addFloater(`✨ ${e.name} !`, player.x, player.y - player.size * 2, '#FFE58A', 1.5);
    showFact({ img: playerThumb(CH.form, game.owned), tag: '🧬 Nouvelle évolution !', name: e.name, where: e.short, fact: e.fact });
    evolving = null;
    checkMissions();
    renderAll();
  }
}

/* ---------- Fenêtres ---------- */
function openDialog(html, actions, wide = false) {
  dialogCard.innerHTML = html;
  dialogCard.classList.toggle('dlg-wide', wide);
  dialogActions = actions || {};
  dialogEl.hidden = false;
  releaseAll();
  const first = dialogCard.querySelector('button.primary, button.royal, button.buy:not([disabled])');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 30);
}

function closeDialog() {
  dialogEl.hidden = true;
  dialogCard.innerHTML = '';
  dialogActions = {};
}

dialogCard.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn || btn.disabled) return;
  const fn = dialogActions[btn.dataset.act];
  if (fn) fn();
});
dialogEl.addEventListener('click', (e) => { if (e.target === dialogEl && dialogActions.close) closeDialog(); });
evoBtn.addEventListener('click', (e) => { e.currentTarget.blur(); openEvolutions(); });

/* ---------- Mises à jour ---------- */
function update(dt) {
  worldT += dt;
  if (evolving) {
    updateEvolving(dt);
    updateFx(dt);
    return;
  }
  updatePlayer(dt);
  updateCreatures(dt);
  updateContacts();
  maintainPopulation(dt);
  updateDrops(dt);
  updateFx(dt);
  // poursuite : le cœur bat, l'écran rougit
  const chasers = creatures.filter((c) => c.state === 'chase');
  if (chasers.length && !player.dead) {
    const close = chasers.some((c) => dist(c, player) < c.size * 3 + player.size * 3);
    heartT -= dt;
    if (heartT <= 0) {
      sfx.heart(close);
      heartPulse = 1;
      heartT = close ? 0.42 : 0.7;
    }
    wasChased = true;
  } else {
    heartT = 0;
    wasChased = false;
  }
  heartPulse = Math.max(0, heartPulse - dt * 2.5);
  // espèces vues pour la première fois : une fiche
  seenT -= dt;
  if (seenT <= 0) {
    seenT = 0.5;
    const vr = visionR();
    for (const c of creatures) {
      if (game.seen[c.id] || dist(c, player) > vr || !onScreen(c, 0)) continue;
      game.seen[c.id] = true;
      speciesFact(c.id);
    }
  }
  saveAt += dt;
  if (saveAt > 10) { saveAt = 0; saveGame(); }
}

function updateDrops(dt) {
  for (const d of drops) {
    d.life -= dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vx *= Math.exp(-2 * dt);
    d.vy *= Math.exp(-2 * dt);
  }
  drops = drops.filter((d) => d.life > 0 && !d.got);
}

function updateFx(dt) {
  for (const p of particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-2.5 * dt);
    p.vy *= Math.exp(-2.5 * dt);
  }
  particles = particles.filter((p) => p.life < p.max);
  if (particles.length > 400) particles.splice(0, particles.length - 400);
  for (const f of floaters) { f.life += dt; f.y -= 60 * dt / zoom; }
  floaters = floaters.filter((f) => f.life < f.max);
  shake = Math.max(0, shake - dt * 1.6);
  flash.a = Math.max(0, flash.a - dt * 1.8);
}

/* ---------- Caméra ---------- */
function updateCamera(dt) {
  const tz = targetZoom();
  zoom += (tz - zoom) * (1 - Math.exp(-1.5 * dt));
  viewW = cssW / zoom;
  viewH = cssH / zoom;
  const lead = 0.25;
  const tx = player.x + player.vx * lead, ty = player.y + player.vy * lead;
  const k = 1 - Math.exp(-5 * dt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
}

function worldToScreen(x, y) {
  return { x: (x - cam.x) * zoom + cssW / 2, y: (y - cam.y) * zoom + cssH / 2 };
}

/* ---------- Dessin ---------- */
function draw() {
  const W = LV.world;
  const sx = shake > 0 ? (Math.random() - 0.5) * shake * 18 : 0;
  const sy = shake > 0 ? (Math.random() - 0.5) * shake * 18 : 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = CH.palette.water[1];
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (cssW / 2 - cam.x * zoom + sx), dpr * (cssH / 2 - cam.y * zoom + sy));
  const x0 = cam.x - viewW / 2 - 200, x1 = cam.x + viewW / 2 + 200;
  const y0 = cam.y - viewH / 2 - 200, y1 = cam.y + viewH / 2 + 200;
  const inView = (o, r) => o.x + r > x0 && o.x - r < x1 && o.y + r > y0 && o.y - r < y1;

  // le fond : sable, puis reflets de lumière qui dansent
  const T = 820;
  for (let tx = Math.floor(x0 / T) * T; tx < x1; tx += T) {
    for (let ty = Math.floor(y0 / T) * T; ty < y1; ty += T) ctx.drawImage(floorTile, tx, ty, T + 1, T + 1);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const [scale, sxv, syv, alpha] of [[2.1, 14, 8, 0.09], [3.3, -10, 12, 0.06]]) {
    const S = 256 * scale;
    const ox = (worldT * sxv) % S, oy = (worldT * syv) % S;
    ctx.globalAlpha = alpha;
    for (let tx = Math.floor((x0 - ox) / S) * S + ox; tx < x1; tx += S) {
      for (let ty = Math.floor((y0 - oy) / S) * S + oy; ty < y1; ty += S) ctx.drawImage(caustics, tx, ty, S + 1, S + 1);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const ch = game.chapter + 1;
  for (const a of algae) if (inView(a, a.r)) drawDecor(ctx, a, worldT);
  ctx.globalAlpha = 0.82;
  for (const d of decor) if (d.from <= ch && d.to >= ch && inView(d, d.r * 1.3)) drawDecor(ctx, d, worldT);
  ctx.globalAlpha = 1;
  for (const d of drops) if (inView(d, d.r * 2)) drawDrop(ctx, d, worldT);

  // les créatures, des plus petites aux plus grosses ; le joueur à sa place
  const list = creatures.filter((c) => inView(c, c.size * 3.5)).sort((a, b) => a.size - b.size);
  let playerDrawn = false;
  for (const c of list) {
    if (!playerDrawn && c.size > player.size) { drawThePlayer(); playerDrawn = true; }
    drawCreature(ctx, c, worldT + c.seed);
  }
  if (!playerDrawn) drawThePlayer();

  // les algues par-dessus : on s'y cache
  for (const a of algae) if (inView(a, a.r + 200)) drawAlgaeFronds(ctx, a, worldT);

  // marques au-dessus des créatures
  for (const c of list) {
    if (c.mark) {
      const pop = Math.min(1, (1.1 - c.markT) * 6 + 0.3);
      drawAlert(ctx, c.x, c.y - c.size * 1.5 - 14 / zoom, 15 / zoom, c.mark, pop);
    } else if (c.fleeing && c.sp.kind !== 'food') {
      drawSweat(ctx, c.x + c.size * 0.8, c.y - c.size * 0.9, Math.max(4, c.size * 0.28), worldT);
    }
  }
  drawFx();
  drawEdges(W);

  // écran : particules en suspension, obscurité, peur
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawMotes();
  drawDarkness();
  drawDanger();
  drawTargetArrow();
  if (flash.a > 0) {
    ctx.fillStyle = `rgba(${flash.color},${flash.a})`;
    ctx.fillRect(0, 0, cssW, cssH);
  }
  drawMinimap();
}

function drawThePlayer() {
  const p = player;
  if (p.dead) return;
  const blinkOff = p.invul > 0 && Math.floor(p.invul * 6) % 2 === 1;
  ctx.globalAlpha = p.hidden ? 0.6 : blinkOff ? 0.45 : 1;
  const sq = 1 + p.squash * 0.15;
  if (sq !== 1) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(sq, sq);
    ctx.translate(-p.x, -p.y);
  }
  if (evolving) {
    const k = evolving.t / 1.5;
    const g = ctx.createRadialGradient(p.x, p.y, p.size * 0.5, p.x, p.y, p.size * (2 + k * 2));
    g.addColorStop(0, `rgba(255, 245, 190, ${0.6 * k})`);
    g.addColorStop(1, 'rgba(255, 245, 190, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (2 + k * 2), 0, TAU);
    ctx.fill();
  }
  drawPlayer(ctx, p, CH.form, game.owned, worldT);
  if (sq !== 1) ctx.restore();
  ctx.globalAlpha = 1;
  // les coups que la carapace peut encore encaisser
  if (stats.shield > 0) {
    for (let i = 0; i < stats.shield; i++) {
      const a = -Math.PI / 2 + (i - (stats.shield - 1) / 2) * 0.5;
      ctx.fillStyle = i < p.shield ? '#FFD24A' : 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * p.size * 1.35, p.y + Math.sin(a) * p.size * 1.35, Math.max(3, p.size * 0.1), 0, TAU);
      ctx.fill();
    }
  }
}

function drawFx() {
  for (const p of particles) {
    const k = p.life / p.max;
    ctx.globalAlpha = 1 - k;
    if (p.bubble) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = Math.max(0.6, p.size * 0.15);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - k * 0.5), 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floaters) {
    const k = f.life / f.max;
    const px = (20 * f.size) / zoom;
    ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
    ctx.font = `800 ${px}px 'Baloo 2', sans-serif`;
    ctx.lineWidth = px * 0.18;
    ctx.strokeStyle = 'rgba(8, 30, 45, 0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

/** Les bords de la carte : de l'eau profonde et sombre */
function drawEdges(W) {
  const band = 400;
  ctx.fillStyle = 'rgba(2, 18, 32, 0.6)';
  ctx.fillRect(-band * 4, -band * 4, W.w + band * 8, band * 4);
  ctx.fillRect(-band * 4, W.h, W.w + band * 8, band * 4);
  ctx.fillRect(-band * 4, 0, band * 4, W.h);
  ctx.fillRect(W.w, 0, band * 4, W.h);
}

function drawMotes() {
  ctx.fillStyle = 'rgba(230, 255, 245, 0.55)';
  for (const m of motes) {
    const S = Math.max(cssW, cssH) + 40;
    const x = ((m.x * S - cam.x * zoom * m.d + Math.sin(worldT * 0.6 + m.p) * 8) % S + S) % S - 20;
    const y = ((m.y * S - cam.y * zoom * m.d + worldT * 6 * m.d) % S + S) % S - 20;
    if (x > cssW || y > cssH) continue;
    ctx.globalAlpha = 0.25 + m.d * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, m.s, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Sans yeux, on ne voit pas loin : tout est sombre autour… et les yeux des chasseurs brillent */
function drawDarkness() {
  const s = worldToScreen(player.x, player.y);
  const r = visionR() * zoom;
  const far = Math.hypot(cssW, cssH);
  const g = ctx.createRadialGradient(s.x, s.y, r * 0.55, s.x, s.y, Math.max(r * 1.05, r + 30));
  g.addColorStop(0, 'rgba(3, 20, 34, 0)');
  g.addColorStop(1, 'rgba(3, 20, 34, 0.64)');
  ctx.fillStyle = g;
  if (r < far) ctx.fillRect(0, 0, cssW, cssH);
  // bords de l'écran un peu plus sombres (toujours)
  const v = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.45, cssW / 2, cssH / 2, far * 0.62);
  v.addColorStop(0, 'rgba(0, 10, 25, 0)');
  v.addColorStop(1, 'rgba(0, 10, 25, 0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, cssW, cssH);
  // yeux rouges des chasseurs qui nous ont repérés
  for (const c of creatures) {
    if (c.state !== 'chase' && c.state !== 'alert') continue;
    const cs = worldToScreen(c.x, c.y);
    const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
    const er = Math.max(3, c.size * zoom * 0.1);
    for (const side of [-1, 1]) {
      const ex = cs.x + (fx * 0.3 - fy * 0.32 * side) * c.size * zoom, ey = cs.y + (fy * 0.3 + fx * 0.32 * side) * c.size * zoom;
      const gg = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 3);
      gg.addColorStop(0, 'rgba(255, 60, 60, 0.95)');
      gg.addColorStop(0.35, 'rgba(255, 40, 40, 0.45)');
      gg.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(ex, ey, er * 3, 0, TAU);
      ctx.fill();
    }
  }
}

/** Pendant une poursuite, les bords de l'écran rougissent au rythme du cœur */
function drawDanger() {
  if (!wasChased) return;
  const k = 0.22 + heartPulse * 0.3;
  const far = Math.hypot(cssW, cssH);
  const g = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.35, cssW / 2, cssH / 2, far * 0.6);
  g.addColorStop(0, 'rgba(255, 30, 60, 0)');
  g.addColorStop(1, `rgba(255, 30, 60, ${k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);
}

/** Flèche au bord de l'écran vers la plus proche proie d'une mission */
function drawTargetArrow() {
  if (player.dead) return;
  const wanted = CH.missions.filter((m) => m.type === 'eat' && !missionInfo(m).done).map((m) => m.species);
  let best = null, bd = Infinity;
  for (const c of creatures) {
    if (!wanted.includes(c.id) || !canEat(c)) continue;
    const d = dist(c, player);
    if (d < bd) { bd = d; best = c; }
  }
  if (!best || onScreen(best, -20)) return;
  const s = worldToScreen(best.x, best.y);
  const cx = cssW / 2, cy = cssH / 2;
  const a = Math.atan2(s.y - cy, s.x - cx);
  const mx = cssW / 2 - 50, my = cssH / 2 - 60;
  const k = Math.min(mx / Math.abs(Math.cos(a) || 1e-6), my / Math.abs(Math.sin(a) || 1e-6));
  const ax = cx + Math.cos(a) * k, ay = cy + Math.sin(a) * k;
  const pulse = 1 + Math.sin(worldT * 5) * 0.06;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(11, 40, 60, 0.75)';
  ctx.strokeStyle = '#FFD24A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(a);
  ctx.fillStyle = '#FFD24A';
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(24, -8);
  ctx.lineTo(24, 8);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(-a);
  const img = thumbImg(speciesThumb(best.id, best.sp));
  if (img.complete) ctx.drawImage(img, -19, -19, 38, 38);
  ctx.restore();
}

/** Le radar : algues (vert), proies des missions (jaune), chasseurs (rouge) */
function drawMinimap() {
  const S = minimap.width / dpr;
  if (!S) return;
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mctx.clearRect(0, 0, S, S);
  const R = S / 2;
  mctx.save();
  mctx.beginPath();
  mctx.arc(R, R, R - 1, 0, TAU);
  mctx.clip();
  mctx.fillStyle = 'rgba(6, 38, 56, 0.78)';
  mctx.fillRect(0, 0, S, S);
  const range = Math.max(viewW, viewH) * 1.3;
  const k = (R - 6) / range;
  const toM = (x, y) => ({ x: R + (x - player.x) * k, y: R + (y - player.y) * k });
  // bords du monde
  const W = LV.world;
  const tl = toM(0, 0), br = toM(W.w, W.h);
  mctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  mctx.lineWidth = 2;
  mctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  mctx.fillStyle = 'rgba(80, 200, 110, 0.45)';
  for (const a of algae) {
    const m = toM(a.x, a.y);
    mctx.beginPath();
    mctx.arc(m.x, m.y, Math.max(2, a.r * k), 0, TAU);
    mctx.fill();
  }
  const wanted = CH.missions.filter((mm) => mm.type === 'eat' && !missionInfo(mm).done).map((mm) => mm.species);
  const vr = stats.vision > 1 ? range : visionR();
  for (const c of creatures) {
    const d = dist(c, player);
    if (d > range) continue;
    const m = toM(c.x, c.y);
    if (isDanger(c) && c.sp.kind === 'hunter') {
      if (d > vr && c.state !== 'chase') continue;
      mctx.fillStyle = c.state === 'chase' ? '#FF3B4E' : '#FF8A8A';
      mctx.beginPath();
      mctx.arc(m.x, m.y, Math.max(3, Math.min(8, c.size * k)), 0, TAU);
      mctx.fill();
    } else if (wanted.includes(c.id) && canEat(c)) {
      mctx.fillStyle = '#FFD24A';
      mctx.beginPath();
      mctx.arc(m.x, m.y, 3, 0, TAU);
      mctx.fill();
    }
  }
  for (const d of drops) {
    const m = toM(d.x, d.y);
    mctx.fillStyle = '#FFF3A0';
    mctx.fillRect(m.x - 2, m.y - 2, 4, 4);
  }
  mctx.restore();
  // le joueur au centre
  mctx.fillStyle = '#FFFFFF';
  mctx.save();
  mctx.translate(R, R);
  mctx.rotate(player.angle);
  mctx.beginPath();
  mctx.moveTo(7, 0);
  mctx.lineTo(-5, -5);
  mctx.lineTo(-5, 5);
  mctx.closePath();
  mctx.fill();
  mctx.restore();
  mctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  mctx.lineWidth = 2;
  mctx.beginPath();
  mctx.arc(R, R, R - 1, 0, TAU);
  mctx.stroke();
}

/* ---------- Panneaux ---------- */
function bump(el) {
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

let shown = {};
function renderHud() {
  const era = Math.round(CH.ago[0] + (CH.ago[1] - CH.ago[0]) * missionsProgress());
  const v = {
    adn: game.adn,
    size: Math.round(growthK() * 100),
    era,
    shields: `${player.shield}/${stats.shield}`,
    canEvolve: affordable(),
  };
  if (v.adn !== shown.adn) adnEl.textContent = v.adn;
  if (v.size !== shown.size) sizeBar.style.width = `${v.size}%`;
  if (v.era !== shown.era) eraEl.textContent = phoneMQ.matches ? fmtAgo(era, true) : `il y a ${fmtAgo(era)}`;
  if (v.shields !== shown.shields) {
    shieldItem.hidden = stats.shield === 0;
    shieldsEl.textContent = '🛡️'.repeat(player.shield) + '▫️'.repeat(Math.max(0, stats.shield - player.shield));
  }
  if (v.canEvolve !== shown.canEvolve) evoBtn.classList.toggle('ready', v.canEvolve);
  shown = v;
}

function renderMissions() {
  const infos = CH.missions.map(missionInfo);
  const key = game.chapter + ':' + infos.map((i) => `${i.cur}/${i.done}`).join(',');
  if (key === missionsShown) return;
  missionsShown = key;
  missionTitle.textContent = `${game.chapter + 1}. ${CH.title}`;
  missionList.innerHTML = infos.map((info) => {
    const prog = info.pct ? `${info.cur} %` : info.max > 1 ? `${info.cur}/${info.max}` : '';
    return `<li class="m-item${info.done ? ' done' : ''}${info.revenge ? ' revenge' : ''}">
      <span class="m-thumb"><img src="${info.img}" alt=""></span>
      <span class="m-text"><strong>${escapeHtml(info.text)}</strong>${prog ? `<span class="m-riddle">${prog}</span>` : ''}</span>
      <span class="m-check">${info.done ? '✓' : ''}</span>
    </li>`;
  }).join('');
}

function renderAll() {
  shown = {};
  missionsShown = '';
  renderHud();
  renderMissions();
}

$('missionToggle').addEventListener('click', (e) => {
  e.currentTarget.blur();
  missionPanel.classList.toggle('collapsed');
});

/* ---------- Boucle principale ---------- */
let last = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
  last = now;
  if (state === 'playing' && isBlocked()) runTimers(0);
  else runTimers(dt);
  if (state === 'intro' && intro) {
    intro.update(dt);
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    intro.draw(ictx, introCanvas.width / dpr, introCanvas.height / dpr);
    if (intro.done) endIntro();
    return;
  }
  if (state === 'ending') {
    drawEnding(dt);
    return;
  }
  if (!player) return;
  if (state === 'playing' && !isBlocked()) update(dt);
  else worldT += dt * 0.2;
  updateCamera(dt);
  draw();
  renderHud();
  if (player) renderDashBtn();
  updateAmmo(now);
}

/* ---------- Démarrage d'une partie ---------- */
function setupGame() {
  useLevel(game.level);
  CH = CHAPTERS[game.chapter];
  recalc();
  buildWorld();
  setupChapter(false);
}

function showStartScreen() {
  const saved = loadGame();
  const hasSave = saved && saved.started;
  game = hasSave ? saved : null;
  if (!game) newGame();
  setupGame();
  const done = game.finished;
  const choice = done && LV.ending.choices.find((c) => c.id === game.path);
  $('startLevel').textContent = `Niveau ${game.level + 1} — ${LV.name}`;
  $('startGoal').innerHTML = LV.goal;
  $('startBtn').textContent = done ? '🎬 Revoir la fin' : hasSave ? `🌊 Continuer (chapitre ${game.chapter + 1})` : '🌊 Plonger !';
  $('newGameBtn').textContent = done ? '🔁 Recommencer au début' : '🆕 Nouvelle partie';
  $('newGameBtn').hidden = !hasSave;
  $('startDone').innerHTML = choice ? `🏆 Bravo ! Tu as régné sur l'océan, puis tu as choisi : <b>${choice.icon} ${escapeHtml(choice.title)}</b>.<br>${escapeHtml(choice.soon)} : bientôt !` : '';
  $('startDone').hidden = !done;
  $('startGoal').hidden = done;
  $('howTo').hidden = done;
  state = 'ready';
  startOverlay.hidden = false;
  setTimeout(() => $('startBtn').focus({ preventScroll: true }), 50);
}

function startGame() {
  if (state !== 'ready') return;
  startOverlay.hidden = true;
  enterFullscreen();
  if (game.finished) { startEnding(); return; }
  if (!game.started) { playIntro(); return; }
  beginPlay();
}

function beginPlay() {
  state = 'playing';
  lastMoveAt = performance.now();
  nextTipAt = lastMoveAt + 25000;
  nextJokeAt = lastMoveAt + rand(60000, 80000);
  if (!game.started) {
    game.started = true;
    say(LV.lines.start, 4, 7000);
    later(() => { if (state === 'playing') openChapterIntro(); }, 600);
  } else {
    say(pick(LINES.resume), 2, 3500);
  }
  if (phoneMQ.matches) missionPanel.classList.add('collapsed');
  saveGame();
}

/* ---------- L'animation de départ (intro.js) ---------- */
function playIntro() {
  state = 'intro';
  intro = createIntro({
    sfx,
    drawCell: (c, x, y, r, t) => drawPlayer(c, { x, y, angle: -0.3, size: r, mouth: 0, mood: 'happy', blink: (t % 3) < 0.12 ? 1 : 0, speed: 0.2, spine: null }, 'cellule', {}, t),
    drawCreature: (c, id, x, y, r, angle, t) => drawCreature(c, { sp: SPECIES[id], x, y, angle, size: r, seed: 2, mood: 'angry', mouth: 0.6, blink: 0, spine: makeSpine(x, y, angle, r, SPECIES[id].look) }, t),
  });
  introOverlay.hidden = false;
  sizeCanvas(introCanvas, introOverlay);
  $('introSkip').focus({ preventScroll: true });
}

function endIntro() {
  if (state !== 'intro') return;
  intro = null;
  introOverlay.hidden = true;
  flash = { a: 0.8, color: '255,255,255' };
  beginPlay();
}

$('introSkip').addEventListener('click', (e) => { e.currentTarget.blur(); endIntro(); });

/* ---------- La fin du niveau : le roi de l'océan, puis le grand choix ---------- */
function startEnding() {
  state = 'ending';
  endT = 0;
  endFx = Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * TAU, d: rand(0.6, 1.3), s: rand(0.5, 1), sp: pick(['petit-poisson', 'poisson-osseux', 'trilobite']), seed: Math.random() * 10 }));
  closeDialog();
  endOverlay.hidden = false;
  endOverlay.classList.remove('show-text', 'chosen');
  sizeCanvas(endCanvas, endOverlay);
  $('endTitle').textContent = LV.ending.title;
  $('endSub').textContent = LV.ending.sub;
  $('endStats').textContent = `🍽️ ${game.stats.eaten} repas · 💨 ${game.stats.escapes} fuites réussies · 😱 croqué ${game.stats.deaths} fois · 🧬 ${game.stats.evolutions} évolutions`;
  $('endChoices').innerHTML = LV.ending.choices.map((c) => `
    <button class="choice-card" data-choice="${c.id}">
      <span class="choice-icon">${c.icon}</span>
      <span class="choice-title">${escapeHtml(c.title)}</span>
      <span class="choice-text">${escapeHtml(c.text)}</span>
    </button>`).join('');
  $('endResult').hidden = true;
  sfx.victory();
  confetti(120);
}

$('endChoices').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-choice]');
  if (!btn) return;
  const c = LV.ending.choices.find((x) => x.id === btn.dataset.choice);
  game.path = c.id;
  game.finished = true;
  saveGame();
  sfx.chapter();
  confetti(60);
  endOverlay.classList.add('chosen');
  $('endResult').hidden = false;
  $('endResultIcon').textContent = c.icon;
  $('endSoon').textContent = `${c.soon} : bientôt !`;
  $('endFact').textContent = c.fact || '';
  $('endFact').hidden = !c.fact;
  const next = LEVELS.findIndex((lv) => lv.id === c.level);
  $('endNext').hidden = next < 0;
  $('endNext').onclick = () => goToLevel(next);
  setTimeout(() => $('endReplay').focus({ preventScroll: true }), 50);
});

function goToLevel(i) {
  endOverlay.hidden = true;
  game.level = i;
  game.chapter = 0;
  game.owned = {};
  game.finished = false;
  game.path = null;
  game.pos = null;
  Object.assign(game, freshChapter());
  game.chapterDone = false;
  setupGame();
  state = 'playing';
  say(LV.lines.start, 4, 7000);
  later(openChapterIntro, 600);
  saveGame();
}

$('endReplay').addEventListener('click', () => {
  clearSave();
  endOverlay.hidden = true;
  game = null;
  showStartScreen();
});

function drawEnding(dt) {
  endT += dt;
  if (endT > 2.4 && !endOverlay.classList.contains('show-text')) endOverlay.classList.add('show-text');
  const w = endCanvas.width / dpr, h = endCanvas.height / dpr;
  const c = ectx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2FA6C8');
  g.addColorStop(1, '#06304F');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  // rayons de lumière
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const x = w * (0.1 + i * 0.17) + Math.sin(endT * 0.4 + i) * 30;
    const gg = c.createLinearGradient(x, 0, x + 120, h);
    gg.addColorStop(0, 'rgba(255, 255, 220, 0.12)');
    gg.addColorStop(1, 'rgba(255, 255, 220, 0)');
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(x - 30, 0);
    c.lineTo(x + 30, 0);
    c.lineTo(x + 200, h);
    c.lineTo(x + 60, h);
    c.closePath();
    c.fill();
  }
  c.globalCompositeOperation = 'source-over';
  const m = Math.min(w, h);
  const cx = w / 2, cy = h * 0.66;
  // les autres poissons tournent autour du roi… en gardant leurs distances
  for (const f of endFx) {
    f.a += dt * 0.5 * f.s;
    const r = m * 0.32 * f.d;
    const x = cx + Math.cos(f.a) * r * 1.4, y = cy + Math.sin(f.a) * r * 0.6;
    const sp = SPECIES[f.sp];
    if (!sp) continue;
    const ang = f.a + Math.PI / 2;
    drawCreature(c, { sp, x, y, angle: ang, size: m * 0.02 * (0.8 + f.s * 0.4), seed: f.seed, mood: 'scared', mouth: 0, blink: 0, spine: makeSpine(x, y, ang, m * 0.025, sp.look) }, endT + f.seed);
  }
  // le joueur, énorme, avec sa couronne
  const size = m * 0.11;
  const a = Math.sin(endT * 0.8) * 0.25;
  const px = cx + Math.sin(endT * 0.6) * m * 0.05, py = cy + Math.cos(endT * 0.9) * m * 0.02;
  const p = { x: px, y: py, angle: a, size, mouth: 0.3 + Math.abs(Math.sin(endT * 2)) * 0.4, mood: 'happy', blink: 0, speed: 0.5, spine: makeSpine(px, py, a, size, formLook() || 'poisson') };
  drawPlayer(c, p, CH.form, game.owned, endT);
  drawCrown(c, px + Math.cos(a) * size * 0.1, py - size * 1.15 + Math.sin(endT * 3) * 4, size * 0.75);
}

/** Une couronne d'or, avec ses pierres précieuses */
function drawCrown(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(endT * 2) * 0.08);
  c.fillStyle = '#FFD24A';
  c.strokeStyle = '#B07A12';
  c.lineWidth = s * 0.06;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-s * 0.5, s * 0.3);
  c.lineTo(-s * 0.55, -s * 0.25);
  c.lineTo(-s * 0.25, s * 0.02);
  c.lineTo(0, -s * 0.38);
  c.lineTo(s * 0.25, s * 0.02);
  c.lineTo(s * 0.55, -s * 0.25);
  c.lineTo(s * 0.5, s * 0.3);
  c.closePath();
  c.fill();
  c.stroke();
  for (const [gx, gy, col] of [[-s * 0.55, -s * 0.28, '#FF6F91'], [0, -s * 0.42, '#4FB8E8'], [s * 0.55, -s * 0.28, '#58C97B'], [0, s * 0.14, '#FF6F91']]) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(gx, gy, s * 0.08, 0, TAU);
    c.fill();
    c.stroke();
  }
  c.fillStyle = 'rgba(255, 255, 255, 0.55)';
  c.fillRect(-s * 0.42, s * 0.18, s * 0.84, s * 0.05);
  c.restore();
}

/* ---------- Mode téléphone : jeu en plein écran ---------- */
function applyPhoneMode() {
  document.body.classList.toggle('phone', phoneMQ.matches);
  document.body.classList.toggle('full', !phoneMQ.matches);
}
applyPhoneMode();
phoneMQ.addEventListener('change', applyPhoneMode);

const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

function enterFullscreen() {
  const el = document.documentElement;
  if (isFullscreen()) return;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
  } catch (err) { /* refusé par le navigateur */ }
}

function exitFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!exit || !isFullscreen()) return;
  try {
    const p = exit.call(document);
    if (p && p.catch) p.catch(() => {});
  } catch (err) { /* ignoré */ }
}

const fsBtn = $('fsBtn');
function renderFsBtn() {
  const on = isFullscreen();
  fsBtn.classList.toggle('on', on);
  fsBtn.title = on ? 'Quitter le plein écran' : 'Plein écran';
  fsBtn.setAttribute('aria-label', fsBtn.title);
}
fsBtn.addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (isFullscreen()) exitFullscreen(); else enterFullscreen();
});
document.addEventListener('fullscreenchange', renderFsBtn);
document.addEventListener('webkitfullscreenchange', renderFsBtn);
renderFsBtn();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    releaseAll();
    if (state === 'playing') saveGame();
  }
});
window.addEventListener('pagehide', () => { if (state === 'playing') saveGame(); });
stage.addEventListener('contextmenu', (e) => { if (phoneMQ.matches) e.preventDefault(); });

/* ---------- Quitter le jeu ---------- */
function goHome() {
  if (state === 'playing') saveGame();
  window.location.href = '../../';
}
function openQuit() {
  if (state !== 'playing') { goHome(); return; }
  quitOverlay.hidden = false;
  $('quitNo').focus({ preventScroll: true });
}
function closeQuit() { quitOverlay.hidden = true; }
$('quitBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openQuit(); });
$('quitYes').addEventListener('click', goHome);
$('quitNo').addEventListener('click', closeQuit);
quitOverlay.addEventListener('click', (e) => { if (e.target === quitOverlay) closeQuit(); });

/* ---------- Son ---------- */
function renderSoundBtn() { soundBtn.textContent = isSoundOn() ? '🔊' : '🔇'; }
soundBtn.addEventListener('click', (e) => {
  e.currentTarget.blur();
  toggleSound();
  renderSoundBtn();
});

/* ---------- Écran de départ ---------- */
$('startBtn').addEventListener('click', (e) => { e.currentTarget.blur(); startGame(); });
$('newGameBtn').addEventListener('click', () => {
  if (game.finished) { clearSave(); game = null; showStartScreen(); return; }
  openDialog(`
    <p class="dlg-title">Recommencer à zéro ?</p>
    <p class="dlg-sub">Ton ADN, tes évolutions et tes chapitres seront perdus.</p>
    <div class="dlg-actions">
      <button class="danger" data-act="yes">Oui, nouvelle partie</button>
      <button class="primary" data-act="close">Non, je garde ma partie</button>
    </div>`, {
    yes: () => { closeDialog(); clearSave(); game = null; showStartScreen(); },
    close: closeDialog,
  });
});

/* ---------- (?debug) Pilote automatique : joue en accéléré pour tester l'équilibrage ----------
   Il fuit ce qui est dangereux, file vers la proie la plus proche (celles des missions d'abord)
   et achète les évolutions des missions dès qu'il peut. */
let botCareful = true;               // false = un enfant distrait, qui ne fuit qu'au dernier moment
function botDir() {
  const p = player;
  let fx = 0, fy = 0, threat = 0;
  for (const c of creatures) {
    if (!isDanger(c)) continue;
    if (!botCareful && c.state !== 'chase') continue;
    const d = dist(c, p) || 1;
    const R = botCareful ? c.size * 2.5 + p.size * 3 + (c.state === 'chase' ? 260 : 120) : c.size * 1.6 + p.size * 2;
    if (d < R) { fx += (p.x - c.x) / d * (R - d) / R; fy += (p.y - c.y) / d * (R - d) / R; threat = Math.max(threat, (R - d) / R); }
  }
  if (threat > 0.15) {
    if (threat > 0.55 && p.charge >= 1) activateDash();
    const d = Math.hypot(fx, fy) || 1;
    return { x: fx / d, y: fy / d };
  }
  const wanted = CH.missions.filter((m) => m.type === 'eat' && !missionInfo(m).done).map((m) => m.species);
  let best = null, bd = Infinity;
  for (const c of creatures) {
    if (!canEat(c)) continue;
    const d = dist(c, p) * (wanted.includes(c.id) ? 0.12 : 1);
    if (d < bd) { bd = d; best = c; }
  }
  if (!best) return { x: Math.cos(worldT * 0.3), y: Math.sin(worldT * 0.2) };
  const dx = best.x - p.x, dy = best.y - p.y, d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

function simulate(seconds, careful = true, log = []) {
  botInput = botDir;
  botCareful = careful;
  const dt = 1 / 30;
  const t0 = { chapter: game.chapter, deaths: game.stats.deaths };
  let t = 0, chapterT = 0, prev = game.chapter;
  while (t < seconds && state !== 'ending') {
    if (!dialogEl.hidden) {
      if (dialogActions.go) dialogActions.go(); else closeDialog();
    }
    if (state === 'playing' && !evolving) {
      for (const m of CH.missions) {
        if (m.type === 'evolve' && !game.owned[m.part] && game.adn >= EVOS[m.part].cost) evolve(m.part);
      }
    }
    if (state === 'playing') update(dt);
    updateCamera(dt);
    runTimers(dt);
    t += dt;
    chapterT += dt;
    if (game.chapter !== prev || state === 'ending') {
      log.push({ chapter: prev + 1, seconds: Math.round(chapterT), deaths: game.stats.deaths });
      prev = game.chapter;
      chapterT = 0;
    }
  }
  botInput = null;
  return { seconds: Math.round(t), chapter: game.chapter + 1, state, deaths: game.stats.deaths - t0.deaths, log, adn: game.adn, growth: Math.round(growthK() * 100), done: game.done };
}

/* ---------- Démarrage ---------- */
async function init() {
  copilot.insertAdjacentHTML('afterbegin', AMMO_SVG);
  caustics = buildCaustics();
  resize();
  new ResizeObserver(resize).observe(stage);
  renderSoundBtn();
  try { await document.fonts.load('700 17px "Baloo 2"'); } catch (err) { /* police de secours */ }
  if (DEBUG && new URLSearchParams(location.search).has('reset')) clearSave();
  showStartScreen();
  requestAnimationFrame(loop);
  if (DEBUG) {
    // pour tester : ?debug, puis __evo.chapter(3), __evo.adn(500)…
    window.__evo = {
      get game() { return game; }, get player() { return player; }, get creatures() { return creatures; }, get state() { return state; },
      chapter(i) { game.chapter = i; Object.assign(game, freshChapter()); game.chapterDone = false; CH = CHAPTERS[i]; setupChapter(true); },
      adn(n) { game.adn += n; },
      grow() { game.earned = CH.growth; },
      own(id) { game.owned[id] = true; recalc(); player.shield = stats.shield; },
      spawn(id, dx = 200, dy = 0) { const c = spawnCreature(id, true); if (c) { c.x = player.x + dx; c.y = player.y + dy; resetSpine(c, SPINES[c.sp.look] ? c.sp.look : null); } return c; },
      ending: startEnding,
      simulate,
    };
  }
}

init();
