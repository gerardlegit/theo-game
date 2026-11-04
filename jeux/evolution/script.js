// ============================================================================
// Évolution — le moteur du jeu. Le joueur est un être vivant qui nage dans
// l'océan, puis court sur la terre ferme (voir terre.js) ou
// retourne dans la mer : il mange ce qui est plus petit que
// lui pour grandir et gagner de l'ADN, évite de se faire croquer par plus
// gros, et fait évoluer son corps. Au niveau du loup, il chasse avec sa meute,
// gagne la confiance des humains, aboie et rassemble les moutons.
// Tout ce qui décrit un niveau (espèces, évolutions, chapitres, missions) est
// dans levels/ : ce fichier ne connaît aucune espèce par son nom.
// ============================================================================

import { LEVELS } from './levels/index.js';
import {
  drawCreature, drawPlayer, drawDecor, drawCover, drawDrop, drawSweat, drawAlert,
  buildFloorTile, buildCaustics, speciesThumb, playerThumb, makeSpine, SPINES, FORM_SPINE, SNOUT, AMMO_SVG, PLAYER, shade,
} from './art.js';
import { drawCloudShadows, SIDE } from './art-terre.js';
import './art-dinos.js';
import './art-mer.js';
import './art-mammiferes.js';
import { BREED_PARADE, campFire } from './art-loup.js';
import './art-requins.js';
import { createTerre, LAND_SPEED, LAND_MAX } from './terre.js';
import { LINES } from './data.js';
import { createIntro, createLandIntro, createSeaIntro, createMammalIntro, createWolfIntro, createSharkIntro, drawCaptionBox } from './intro.js';
import { sfx, isSoundOn, toggleSound } from './sound.js';

const SAVE_KEY = 'evolution-save';
const SAVE_VERSION = 1;
const TAU = Math.PI * 2;
const MAX_PIXELS = 3.6e6;          // pixels au plus dans une toile plein écran

/* ---------- Typographie : espaces insécables avant ! ? : ; » et après « ---------- */
// (sinon, sur un petit écran, un « ! » peut se retrouver tout seul en début de ligne)
function fixTypo(o) {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') o[k] = v.replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
    else if (v && typeof v === 'object') fixTypo(v);
  }
}
fixTypo(LEVELS);
fixTypo(LINES);

/* ---------- Réglages de la nage ---------- */
const DRAG = 3;                    // l'eau freine : sans nager, on s'arrête en ~1 s
const TURN = 7;                    // rad/s pour se tourner
const TURN_LAND = 13;              // (sur la terre) on se tourne bien plus vite
const LAND_CHASE = 1.1;            // (sur la terre) les chasseurs foncent, car tu vas bien plus vite
const LAND_MUD = 0.85;             // (sur la terre) la boue et la neige ralentissent à peine…
const LAND_WATER = 0.78;           // …et l'eau aussi (en sautant, on passe au-dessus)
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
const MAX_CHASERS = 2;              // (un niveau peut en mettre plus : world.maxChasers)
const GIVE_UP_REST = 3;
const FULL_REST = 6;               // après avoir mangé le joueur, il digère

/* ---------- Le loup et l'humain : la meute, les humains, l'aboiement ---------- */
const PACK_RANGE = 700;            // un loup compte dans la meute s'il est à moins de ça de toi
const FENCE = 0.85;                // la barrière de l'enclos, en part de son rayon
const PACK_MAX = 5;                // au plus, dans ta meute
const HUNT_BITE = 4;               // la vie (sur 100) qu'enlève chaque loup, par seconde
const SHOO_TRUST = 0.3;            // en dessous, les humains te chassent si tu t'approches trop
const SAFE_TRUST = 0.5;            // au-dessus, leur camp est un refuge : le feu fait peur aux chasseurs
const PLAY_TRUST = 0.4;            // à partir de là, les enfants viennent jouer avec toi
const BARK_RECHARGE = 3;           // s entre deux aboiements
const BARK_SCARE = 2.8;            // s pendant lesquelles un aboiement fait fuir

/* ---------- Le coup de queue ou de griffe (world.strike) ---------- */
const STRIKE_RECHARGE = 4;         // s entre deux coups
const STUN_TIME = 2;               // s pendant lesquelles l'adversaire reste assommé
const BREACH_TIME = 1;             // s dans les airs, quand le mégalodon saute

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
const waterItem = $('waterItem');
const waterBar = $('waterBar');
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
const barkBtn = $('barkBtn');
const strikeBtn = $('strikeBtn');
const phoneMQ = window.matchMedia('(pointer: coarse) and (max-width: 900px), (pointer: coarse) and (max-height: 520px)');
const portraitMQ = window.matchMedia('(orientation: portrait)');
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
let hides = [];                    // les cachettes (algues, fougères)
let covers = [];                   // ce qui se dessine par-dessus les créatures (cachettes, feuillages)
let zones = [];                    // les mares et la boue
let levelDecor = null;             // tout le décor du niveau ; zones / hides / covers = celui du chapitre
let clouds = [];                   // (sur la terre) les ombres des nuages
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
let endDecor = [];
const endCues = new Set();
let wasChased = false;
let packNear = 0;                  // les loups de ta meute tout près de toi
let huntTarget = null;             // la grosse bête que la meute attaque
let comboN = 0, comboT = 0;        // la frénésie : les repas à la suite (world.combo)
let pens = [];                     // les enclos de ce chapitre (leur barrière bloque les animaux)
let boneT = 0;                     // avant le prochain os lancé par les humains
let heartFxT = 0;
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

/** « 1,5 milliard d'années », « 520 millions d'années », « 40 000 ans » */
function fmtAgo(ma, short = false) {
  if (ma >= 1000) {
    const g = Math.round(ma / 100) / 10;
    return `${String(g).replace('.', ',')} milliard${g >= 2 ? 's' : ''}${short ? '' : " d'années"}`;
  }
  if (ma < 1) {
    // moins d'un million d'années : on compte en milliers d'années
    const k = Math.max(1, Math.round(ma * 1000));
    return `${k >= 1000 ? Math.floor(k / 1000) + '\u00a0' + String(k % 1000).padStart(3, '0') : k}\u00a0000 ans`;
  }
  const n = Math.round(ma);
  return `${n} million${n >= 2 ? 's' : ''}${short ? '' : " d'années"}`;
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
  return { earned: 0, eaten: {}, done: [], maxSaid: false, barked: {}, penned: {}, played: {}, packN: 0, packMax: 0, stunned: {}, hits: {} };
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

/* ---------- La carte : les niveaux terminés, les parties laissées en cours ----------
   done[id] = les choix de fin déjà faits dans ce niveau ; paused[id] = la partie
   mise de côté quand on part jouer un autre niveau depuis la carte.
   « Nouvelle partie » ne l'efface pas : les niveaux terminés restent sur la carte. */
const MAP_KEY = 'evolution-carte';
const MAP_VERSION = 1;
const blankProgress = () => ({ v: MAP_VERSION, done: {}, paused: {} });
let progress = loadProgress();

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(MAP_KEY));
    if (data && data.v === MAP_VERSION && data.done && data.paused) return data;
  } catch (e) { /* stockage indisponible ou abîmé */ }
  return blankProgress();
}

function saveProgress() {
  try { localStorage.setItem(MAP_KEY, JSON.stringify(progress)); } catch (e) { /* stockage indisponible */ }
}

function markDone(id, choice) {
  const list = progress.done[id] || (progress.done[id] = []);
  if (choice && !list.includes(choice)) list.push(choice);
  saveProgress();
}

/* ---------- Les effets des évolutions ---------- */
function recalc() {
  const s = {
    speed: 1, ratio: BASE_RATIO, reach: 1, vision: 1, shield: 0, armored: false, dash: false, dry: 1, cones: false, radar: false,
    howl: false, trust: 1, bark: false, treats: 1, herd: 1, power: 1,
  };
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
    if (e.dry !== undefined) s.dry = Math.min(s.dry, e.dry);
    if (e.cones) s.cones = true;
    if (e.radar) s.radar = true;
    if (e.howl) s.howl = true;
    if (e.power) s.power = Math.max(s.power, e.power);
    if (e.trust) s.trust = Math.max(s.trust, e.trust);
    if (e.bark) s.bark = true;
    if (e.treats) s.treats = Math.max(s.treats, e.treats);
    if (e.herd) s.herd = Math.max(s.herd, e.herd);
  }
  stats = s;
}

// (world.noGrow : dans ce niveau, manger ne fait pas grandir)
const growthK = () => (LV.world.noGrow ? 0 : clamp(game.earned / CH.growth, 0, 1));
const targetSize = () => CH.size[0] + (CH.size[1] - CH.size[0]) * growthK();
const maxSpeed = () => {
  const v = (BASE_SPEED + SPEED_PER_SIZE * player.size) * stats.speed * (CH.speed || 1);
  return LV.world.ground === 'land' ? Math.min(LAND_MAX, v * LAND_SPEED) : v * (LV.world.speed || 1);
};
const visionR = () => (140 + player.size * 9) * stats.vision * (CH.vision || 1) * (player.litT > 0 ? 2.6 : 1);
const drying = () => !!CH.dry && stats.dry > 0;

/* La jauge qui baisse : sur la terre, la peau sèche (on la remplit dans une
   mare) ; dans la mer, les reptiles marins respirent de l'air (on le remplit à
   la surface). Un niveau la décrit dans world.meter. */
const METER_WATER = {
  zone: 'water', icon: '💧', low: 'dry', out: 'dried', refill: 'Aaah, de l’eau !', dead: 'Desséché !',
  title: "Ta réserve d'eau : sur la terre, ta peau sèche. Plonge dans une mare !",
};
const meter = () => LV.world.meter || METER_WATER;

/* Qui peut manger qui ? (jamais un humain, un mouton ou un ami) */
function canEat(c) {
  const k = c.sp.kind;
  if (c.buried) return false;
  if (k === 'ally' || k === 'stray' || k === 'human' || k === 'flock' || k === 'shepherd' || c.sp.noEat) return false;
  return c.size <= player.size * stats.ratio && (!c.sp.armored || stats.armored);
}
/* Une meute assez grande fait fuir ce chasseur (packFear = le nombre de loups qu'il faut) */
const fearsPack = (c) => !!CH.pack && !!c.sp.packFear && packNear >= c.sp.packFear;
function isDanger(c) {
  return !(c.stunT > 0) && (c.sp.kind === 'hunter' || c.sp.kind === 'stinger') && player.size < c.size * DANGER_RATIO && !canEat(c) && !fearsPack(c);
}
/* Tout ce qui peut faire mal : chasseurs, méduses, herbivores qui chargent, géants qui écrasent */
function isThreat(c) {
  if (c.stunT > 0) return false;
  return isDanger(c) || ((c.sp.kind === 'defender' || c.sp.kind === 'giant') && !canEat(c));
}

/** Où est la gueule d'un animal (ou du joueur) */
function mouthPoint(e, k = 0.8) {
  if (e.side) return terre.bodyPoint(e, e.side[0], e.side[1]);
  k = SNOUT[e === player ? CH.form : e.sp.look] ?? k;
  return { x: e.x + Math.cos(e.angle) * e.size * k, y: e.y + Math.sin(e.angle) * e.size * k };
}

/** Distance entre la gueule et un point. De profil, on mange aussi avec l'avant du
    corps, dans la direction où l'on avance (sinon impossible d'attraper ce qui est
    juste au-dessus ou en dessous). */
function mouthDist(e, x, y) {
  const m = mouthPoint(e);
  let d = Math.hypot(m.x - x, m.y - y);
  if (e.side) {
    const fx = e.x + Math.cos(e.angle) * e.size * 0.8, fy = e.y + Math.sin(e.angle) * e.size * 0.8;
    d = Math.min(d, Math.hypot(fx - x, fy - y));
  }
  return d;
}

/** Le bout de la queue (pointes du stégosaure, massue de l'ankylosaure) */
function tailPoint(c) {
  if (c.side) return terre.bodyPoint(c, -2.2, 0);
  return c.spine ? c.spine[c.spine.length - 1] : c;
}

/** De profil, on regarde à droite ou à gauche (on ne se retourne pas pour un rien) */
function updateFace(e) {
  if (!e.side) return;
  const cx = Math.cos(e.angle);
  if (cx > 0.25) e.face = 1; else if (cx < -0.25) e.face = -1;
}

/** Petit écart d'angle (de -π à π) */
function angleDiff(a, b) {
  return ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

/** Dans quelle zone est ce point : 'water' (mare), 'mud' (boue) ou null ? */
function zoneAt(x, y) {
  for (const z of zones) {
    const dx = x - z.x, dy = y - z.y;
    if (dx * dx + dy * dy < z.r * z.r * 0.72) return z.zone;
  }
  return null;
}

function nearestZone(x, y, kind) {
  let best = null, bd = Infinity;
  for (const z of zones) {
    if (z.zone !== kind) continue;
    const d = Math.hypot(z.x - x, z.y - y);
    if (d < bd) { bd = d; best = z; }
  }
  return best;
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
  // sur un très grand écran, on limite le nombre de pixels (sinon le jeu rame et
  // chaque toile prend des dizaines de Mo)
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1, Math.sqrt(MAX_PIXELS / (cssW * cssH))));
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

/** Une toile qui ne sert plus (intro, fin) : on rend sa mémoire */
function freeCanvas(c) {
  c.width = c.height = 1;
}

/* ---------- Construction du monde (décor) ---------- */
function buildWorld() {
  const W = LV.world;
  const rnd = mulberry32(1234 + game.level * 77);
  decor = [];
  hides = [];
  covers = [];
  zones = [];
  for (const d of W.decor) {
    for (let i = 0; i < d.count; i++) {
      let x = 0, y = 0;
      if (d.atStart && i === 0) {
        // le premier est juste au point de départ (on commence caché, ou dans l'eau)
        x = W.start.x; y = W.start.y;
      } else if (d.at) {
        x = d.at.x; y = d.at.y;
      } else {
        x = 150 + rnd() * (W.w - 300);
        y = 150 + rnd() * (W.h - 300);
      }
      const item = {
        type: d.type, x, y, r: d.r[0] + rnd() * (d.r[1] - d.r[0]), seed: Math.floor(rnd() * 1e6),
        from: d.from || 1, to: d.to || 99, zone: d.zone || null, hide: !!d.hide, canopy: !!d.canopy,
        clear: !!d.clear, gate: d.gate || 0, gateW: d.gateW || 0,
      };
      if (d.atStart && i === 0) item.r = Math.max(item.r, 220);
      if (item.zone) zones.push(item);
      else decor.push(item);
      if (item.hide) hides.push(item);
      if (item.hide || item.canopy) covers.push(item);
    }
  }
  // (clear) rien ne pousse dans le grand enclos
  for (const p of zones.filter((z) => z.clear)) {
    const free = (o) => o === p || o.from > p.to || o.to < p.from || Math.hypot(o.x - p.x, o.y - p.y) > p.r + o.r * 0.7;
    zones = zones.filter(free);
    decor = decor.filter(free);
    hides = hides.filter(free);
    covers = covers.filter(free);
  }
  levelDecor = { zones, hides, covers };
  clouds = W.ground === 'land' ? Array.from({ length: 16 }, () => ({ x: rnd() * W.w - 2000, y: rnd() * W.h - 800, r: 300 + rnd() * 500 })) : [];
  motes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: rand(1, 2.6), d: rand(0.25, 0.7), p: rand(0, TAU) }));
}

/* ---------- La terre ferme : la course et les vues en volume (voir terre.js) ---------- */
const terre = createTerre({
  level: () => LV, chapter: () => CH, player: () => player,
  particles: () => particles, ctx: () => ctx,
  worldT: () => worldT, shade,
  });

/* ---------- Le joueur ---------- */
function formLook() {
  return FORM_SPINE[CH.form] || null;
}

function placePlayer(x, y) {
  const size = targetSize();
  player = {
    x, y, vx: 0, vy: 0, angle: -0.4, size,
    spine: null, mouth: 0, blink: 0, mood: 'happy', speed: 0,
    dash: 0, charge: 1, shield: stats.shield, shieldT: 0,
    invul: 1.5, hidden: false, dead: false, deadT: 0, squash: 0,
    walk: 0, wet: 1, dryT: 0, zone: null,
    side: SIDE[CH.form] || null, face: 1,
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
  const minD = initial ? (hunter ? half * 1.05 : sp.size + 120) : half + sp.size * 2;
  for (let tries = 0; tries < 14; tries++) {
    let x, y, home = null;
    if (sp.habitat) {
      // les poissons et les crocodiles ne vivent que dans les mares (les humains, dans leur camp)
      const ponds = zones.filter((z) => z.zone === sp.habitat && z.r > sp.size * 1.6 && dist(z, player) < far + z.r);
      if (!ponds.length) return null;
      home = pick(ponds);
      const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * home.r * 0.55;
      x = home.x + Math.cos(a) * d;
      y = home.y + Math.sin(a) * d;
      if (dist({ x, y }, player) < (hunter ? half * 0.8 : sp.size + 100)) continue;
    } else if (sp.near && zones.some((z) => z.zone === sp.near)) {
      // il broute près d'un enclos (le troupeau du village)
      const z = nearestZone(player.x + rand(-1, 1) * far, player.y + rand(-1, 1) * far, sp.near);
      const a = Math.random() * TAU, d = z.r + rand(250, 800);
      x = z.x + Math.cos(a) * d;
      y = z.y + Math.sin(a) * d;
      const dp = dist({ x, y }, player);
      if (dp < minD || dp > far * 1.3 || zoneAt(x, y)) continue;
    } else if (sp.kind === 'ally') {
      // ta meute est autour de toi
      x = player.x + rand(-1, 1) * (player.size * 3 + 80);
      y = player.y + rand(-1, 1) * (player.size * 3 + 80);
    } else {
      const a = Math.random() * TAU;
      const d = rand(minD, far);
      x = player.x + Math.cos(a) * d;
      y = player.y + Math.sin(a) * d;
      if (!sp.flying && zoneAt(x, y)) continue;
    }
    if (x < sp.size + 60 || y < sp.size + 60 || x > W.w - sp.size - 60 || y > W.h - sp.size - 60) continue;
    if (!sp.flying && pens.some((z) => Math.hypot(z.x - x, z.y - y) < z.r + sp.size + 30)) continue;
    const n = sp.pack || 1;
    let leader = null;
    for (let k = 0; k < n; k++) {
      // une meute : les autres apparaissent juste à côté
      const px = k ? x + rand(-1, 1) * sp.size * 2.5 : x, py = k ? y + rand(-1, 1) * sp.size * 2.5 : y;
      const vary = sp.kind === 'hunter' ? 1 : rand(0.9, 1.1);
      const c = makeCreature(id, px, py, home, sp.size * vary);
      creatures.push(c);
      if (!leader) leader = c;
    }
    return leader;
  }
  return null;
}

function makeCreature(id, x, y, home = null, size = SPECIES[id].size) {
  const sp = SPECIES[id];
  const c = {
    id, sp, x, y, vx: 0, vy: 0, angle: Math.random() * TAU,
    size, spine: null, home,
    state: 'wander', timer: 0, rest: 0, lunge: 0, wx: x, wy: y,
    seed: Math.random() * 10, mouth: 0, blink: 0, mood: 'calm',
    mark: null, markT: 0, eatT: rand(0, 0.3), chased: false,
    walk: Math.random() * 10, stepT: rand(0, 1), noiseT: 0, scaredT: 0, stunT: 0, playT: 0, lureT: 0, hitT: 0, buried: !!sp.buried, hp: sp.hp || 0,
    side: SIDE[sp.look] || null, face: 1,
  };
  resetSpine(c, SPINES[sp.look] ? sp.look : null);
  return c;
}

function populate() {
  creatures = [];
  for (const [id, n] of Object.entries(CH.species)) {
    for (let i = 0; i < n; i += SPECIES[id].pack || 1) spawnCreature(id, true);
  }
  // le berger, à l'entrée de l'enclos, et les moutons déjà rentrés
  for (const z of pens) {
    if (!CH.shepherd) break;
    const R = z.r * FENCE, a = z.gate + z.gateW * 0.75;
    creatures.push(makeCreature(CH.shepherd, z.x + Math.cos(a) * (R + 90), z.y + Math.sin(a) * (R + 90)));
    for (const [id, n] of Object.entries(game.penned || {})) {
      for (let i = 0; i < n; i++) {
        const b = Math.random() * TAU, d = Math.sqrt(Math.random()) * R * 0.6;
        const c = makeCreature(id, z.x + Math.cos(b) * d, z.y + Math.sin(b) * d);
        c.penned = true;
        creatures.push(c);
      }
    }
  }
  // la meute déjà rassemblée est autour de toi
  if (CH.pack) {
    game.packN = Math.min(game.packN || 0, PACK_MAX);   // (une ancienne sauvegarde pouvait en avoir 8)
    const ally = Object.keys(SPECIES).find((id) => SPECIES[id].kind === 'ally');
    for (let i = 0; i < (game.packN || 0); i++) creatures.push(makeCreature(ally, player.x + rand(-150, 150), player.y + rand(-150, 150), null, player.size * 0.92));
  }
}

/** Garde le bon nombre de créatures autour du joueur (elles apparaissent hors de l'écran) */
function maintainPopulation(dt) {
  spawnT -= dt;
  if (spawnT > 0) return;
  spawnT = 0.3;
  const half = Math.hypot(viewW, viewH) / 2;
  const far = half * 1.7;
  creatures = creatures.filter((c) => c.state === 'chase' || c.sp.kind === 'ally' || c.sp.kind === 'shepherd' || c.penned || c === huntTarget || dist(c, player) < far * 1.35);
  const counts = {};
  for (const c of creatures) if (!c.penned) counts[c.id] = (counts[c.id] || 0) + 1;
  for (const [id, n] of Object.entries(CH.species)) {
    let missing = n - (counts[id] || 0);
    while (missing > 0) {
      if (!spawnCreature(id)) break;
      missing -= SPECIES[id].pack || 1;
    }
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
  } else if (e.code === 'KeyB') {
    if (!e.repeat) activateBark();
  } else if (e.code === 'KeyF') {
    if (!e.repeat) activateStrike();
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
barkBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); activateBark(); });
strikeBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); activateStrike(); });

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
  // sur la terre, courir fait du bruit : les chasseurs proches t'entendent
  const noise = LV.world.noise;
  if (noise) {
    let heard = false;
    for (const c of creatures) {
      if (c.sp.kind !== 'hunter' || !isDanger(c) || dist(c, player) > noise + c.size) continue;
      c.noiseT = 0.4;
      heard = true;
    }
    if (heard) sayOnce('noise', LINES.noise, 45, 2);
  }
  if (CH.trust) startleHumans();
  if (terre.on()) terre.dust(player.x, player.y + player.size * 0.85, 10, 130, Math.max(5, player.size * 0.25));
  else for (let i = 0; i < 10; i++) bubbleAt(player.x - Math.cos(player.angle) * player.size, player.y - Math.sin(player.angle) * player.size, player.size * 0.25);
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

/* L'aboiement (le loup et l'humain) : les chasseurs proches s'enfuient… et les proies aussi */
function activateBark() {
  const p = player;
  if (state !== 'playing' || isBlocked() || !p || p.dead || !stats.bark || p.barkT > 0) return;
  p.barkT = BARK_RECHARGE;
  p.mouth = 1;
  sfx.bark();
  shake = Math.max(shake, 0.1);
  addFloater('WOUF !', p.x, p.y - p.size * 1.8, '#FFFFFF', 1.3);
  const R = 480 + p.size * 2;
  particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0, max: 0.55, size: R, color: '#FFFFFF', ring: true });
  let hunters = 0;
  for (const c of creatures) {
    const k = c.sp.kind;
    if (k === 'ally' || k === 'food' || k === 'human' || k === 'flock' || k === 'shepherd' || dist(c, p) > R + c.size) continue;
    c.scaredT = BARK_SCARE;
    c.barkX = p.x;
    c.barkY = p.y;
    if (k === 'hunter') {
      hunters++;
      c.rest = Math.max(c.rest, 3);
    }
    if (!c.barked) {
      // chaque animal ne compte qu'une fois pour les missions
      c.barked = true;
      game.barked = game.barked || {};
      game.barked[c.id] = (game.barked[c.id] || 0) + 1;
      if (c.sp.barkLine) addFloater(c.sp.barkLine, c.x, c.y - c.size * 1.6, '#FFE58A', 1);
      if (k === 'hunter' || c.sp.barkLine) deed(10, c.x, c.y - c.size * 2);
    }
  }
  if (hunters) {
    const camp = nearestZone(p.x, p.y, 'camp');
    if (camp && dist(camp, p) < 1400) sayOnce('barkHunter', LINES.barkHunter, 40, 2);
  }
  checkMissions();
}

/* Le coup de queue ou de griffe (world.strike) : les adversaires à portée restent assommés */
const canStrike = () => !!CH.power || (!!LV.world.strike && game.chapter + 1 >= LV.world.strike.from);
const strikeMax = () => (CH.power ? CH.power.recharge : STRIKE_RECHARGE);
const inStrikeReach = (c) => ['hunter', 'rival', 'defender'].includes(c.sp.kind) && dist(c, player) < player.size * 2.6 + c.size * 0.9;

function activateStrike() {
  const p = player;
  if (state !== 'playing' || isBlocked() || !p || p.dead || !canStrike() || p.strikeT > 0 || p.airT > 0) return;
  if (CH.power) { firePower(); return; }
  p.strikeT = STRIKE_RECHARGE;
  p.mouth = 1;
  sfx.thud();
  particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0, max: 0.3, size: p.size, face: p.face || 1, color: '#FFFFFF', slash: LV.world.strike.type });
  let hits = 0;
  for (const c of creatures) {
    if (!inStrikeReach(c)) continue;
    c.stunT = STUN_TIME;
    c.rest = Math.max(c.rest, STUN_TIME + 1);
    hits++;
    burst(c.x, c.y - c.size * 0.5, 8, ['#FFD24A', '#FFFFFF'], c.size * 4 + 40, Math.max(2, c.size * 0.08));
    addFloater('BAM !', c.x, c.y - c.size * 1.6, '#FFD24A', 1.3);
  }
  if (hits) {
    shake = Math.max(shake, 0.3);
    sayOnce('stunned', LINES.stunned, 40, 2);
  }
}

let shownStrike = -1;
function renderStrikeBtn() {
  const k = !canStrike() ? -2 : Math.round((1 - (player.strikeT || 0) / strikeMax()) * 20) / 20;
  if (k === shownStrike) return;
  shownStrike = k;
  strikeBtn.hidden = k === -2;
  strikeBtn.style.setProperty('--charge', `${Math.max(0, k) * 100}%`);
  strikeBtn.classList.toggle('charging', k < 1);
}

let shownBark = -1;
function renderBarkBtn() {
  const k = !stats.bark ? -2 : Math.round((1 - (player.barkT || 0) / BARK_RECHARGE) * 20) / 20;
  if (k === shownBark) return;
  shownBark = k;
  barkBtn.hidden = k === -2;
  barkBtn.style.setProperty('--charge', `${Math.max(0, k) * 100}%`);
  barkBtn.classList.toggle('charging', k < 1);
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
  // dans l'eau ou dans la boue, on avance moins vite (sauf le tétrapode, qui nage bien)
  const onLand = terre.on();
  const zone = zoneAt(p.x, p.y);
  if (zone !== p.zone) enterZone(zone);
  const zk = onLand ? (zone === 'mud' ? LAND_MUD : zone === 'water' ? LAND_WATER : 1)
    : zone === 'mud' ? (LV.world.mudSpeed ?? 0.4) : zone === 'water' ? (CH.waterSpeed ?? 0.7) : 1;
  const ms = maxSpeed() * zk;
  const dashing = p.dash > 0;
  const boost = dashing ? DASH_BOOST * (stats.dash ? 1.1 : 1) : 1;
  let want = dir;
  if (dashing && !want) want = { x: Math.cos(p.angle), y: Math.sin(p.angle) };
  if (onLand) {
    terre.run(p, want, ms * boost, dt, dashing);
  } else {
    if (want && !(p.airT > 0)) {
      const acc = ms * boost * DRAG;
      p.vx += want.x * acc * dt;
      p.vy += want.y * acc * dt;
    }
    const k = p.airT > 0 ? 1 : Math.exp(-DRAG * dt);
    p.vx *= k;
    p.vy *= k;
  }
  const ox = p.x, oy = p.y;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  fence(p, ox, oy, true, p.size * 0.5);
  const W = LV.world;
  const m = p.size + 20;
  if (p.x < m) { p.x = m; p.vx = Math.abs(p.vx) * 0.3; }
  if (p.y < m) { p.y = m; p.vy = Math.abs(p.vy) * 0.3; }
  if (p.x > W.w - m) { p.x = W.w - m; p.vx = -Math.abs(p.vx) * 0.3; }
  if (p.y > W.h - m) { p.y = W.h - m; p.vy = -Math.abs(p.vy) * 0.3; }
  const sp = Math.hypot(p.vx, p.vy);
  p.speed = clamp(sp / ms, 0, 1.5);
  p.walk += sp * dt / Math.max(10, p.size) * 1.3;
  if (sp > 8) p.angle = turnToward(p.angle, Math.atan2(p.vy, p.vx), (onLand ? TURN_LAND : stats.dash ? 10 : TURN) * dt);
  updateFace(p);
  terre.turn(p, dt);
  if (dashing) {
    p.dash -= dt;
    if (!onLand && Math.random() < dt * 30) bubbleAt(p.x - Math.cos(p.angle) * p.size, p.y - Math.sin(p.angle) * p.size, p.size * 0.22);
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
  updateDrying(dt, zone);
  // caché dans les algues (ou les fougères) ?
  const wasHidden = p.hidden;
  p.hidden = hides.some((a) => dist(a, p) < a.r * 0.85 - p.size * 0.5);
  // près du feu des humains qui te font confiance, aucun chasseur n'ose venir
  p.safe = zone === 'camp' && (game.trust || 0) >= SAFE_TRUST;
  p.barkT = Math.max(0, (p.barkT || 0) - dt);
  p.strikeT = Math.max(0, (p.strikeT || 0) - dt);
  p.swim = (p.swim || 0) + dt * (0.4 + Math.min(1.5, p.speed) * 0.8);
  p.litT = Math.max(0, (p.litT || 0) - dt);
  p.flashT = Math.max(0, (p.flashT || 0) - dt);
  p.whipT = Math.max(0, (p.whipT || 0) - dt);
  p.bongT = Math.max(0, (p.bongT || 0) - dt);
  if (p.gulpT > 0) {
    // l'aspirateur : tout ce qui se mange arrive dans sa bouche
    p.gulpT -= dt;
    const R = CH.power.range * stats.power;
    for (const c of creatures) if (canEat(c) && dist(c, p) < R + c.size) c.lureT = 0.25;
  }
  if (p.airT > 0) {
    p.airT -= dt;
    p.invul = Math.max(p.invul, 0.1);
    if (p.airT <= 0) {
      p.vx *= 0.4;
      p.vy *= 0.4;
      landBreach();
    }
  }
  if (p.hidden && !wasHidden && creatures.some((c) => c.state === 'chase')) sayOnce('hidden', LINES.hidden, 20, 2);
  // la bouche s'ouvre quand il y a quelque chose à croquer devant
  let wantMouth = 0;
  for (const c of creatures) {
    if (!canEat(c)) continue;
    if (mouthDist(p, c.x, c.y) < c.size + p.size * 1.6) { wantMouth = 1; break; }
  }
  if (p.gulpT > 0) wantMouth = 1;
  p.mouth += (wantMouth - p.mouth) * (1 - Math.exp(-12 * dt));
  p.mood = creatures.some((c) => c.state === 'chase') ? 'scared' : 'happy';
}

/** On entre dans une mare ou dans la boue */
function enterZone(zone) {
  const p = player;
  p.zone = zone;
  if (zone === 'water') {
    sfx.splash();
    for (let i = 0; i < 10; i++) bubbleAt(p.x, p.y, p.size * 0.3);
  } else if (zone === 'air') {
    for (let i = 0; i < 8; i++) bubbleAt(p.x, p.y, p.size * 0.3);
  } else if (zone === 'mud') {
    const snow = zones.some((z) => z.type === 'neige' && dist(z, p) < z.r);
    addFloater(snow ? 'Brrr !' : 'Ça colle !', p.x, p.y - p.size * 1.6, snow ? '#E6F2FF' : '#C9A06A', 1);
    if (snow && !LV.world.mudSpeed) sayOnce('snow', LINES.snow, 60, 1);
    else sayOnce('mud', LINES.mud, 60, 1);
  }
}

/** Sur la terre, la peau sèche : il faut retourner dans l'eau (jusqu'à l'œuf à coquille) */
function updateDrying(dt, zone) {
  const p = player;
  if (!drying()) { p.wet = 1; p.dryT = 0; return; }
  if (zone === meter().zone) {
    if (p.wet < 0.6 && performance.now() > (cooldowns.wetSaid || 0)) {
      cooldowns.wetSaid = performance.now() + 20000;
      addFloater(meter().refill, p.x, p.y - p.size * 1.6, '#9EE7FF', 1);
    }
    p.wet = Math.min(1, p.wet + dt * 0.8);
    p.dryT = 0;
    return;
  }
  p.wet = Math.max(0, p.wet - CH.dry * stats.dry * dt);
  if (p.wet < 0.3) sayOnce('dry', LINES[meter().low], 25, 3);
  if (p.wet <= 0) {
    p.dryT += dt;
    if (p.dryT > 2.5) loseLife(null, 'dry');
  }
}

function respawn() {
  const p = player;
  // on renaît dans la cachette la plus proche (mais pas sous le nez du chasseur) ;
  // tant que la jauge baisse, on renaît là où on la remplit (une mare, la surface)
  const spots = drying() ? zones.filter((z) => z.zone === meter().zone) : hides;
  let best = spots[0] || { x: LV.world.start.x, y: LV.world.start.y }, bd = Infinity;
  for (const a of spots) {
    const d = dist(a, p);
    if (d > 500 && d < bd && a.r > p.size * 1.5) { bd = d; best = a; }
  }
  p.x = best.x;
  p.y = best.y;
  p.vx = p.vy = 0;
  p.dead = false;
  p.wet = 1;
  p.dryT = 0;
  p.invul = INVUL_TIME;
  p.size = targetSize();
  resetSpine(p, formLook());
  // ta meute te retrouve
  for (const c of creatures) {
    if (c.sp.kind !== 'ally') continue;
    c.x = p.x + rand(-1, 1) * (p.size * 3 + 80);
    c.y = p.y + rand(-1, 1) * (p.size * 3 + 80);
  }
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
  const maxChasers = W.maxChasers || MAX_CHASERS;
  const hearR = Math.hypot(viewW, viewH) * 0.9;     // on entend les grands pas jusque-là
  let chasers = creatures.filter((c) => c.state === 'chase' || c.state === 'alert').length;
  packNear = p.dead ? 0 : creatures.filter((c) => c.sp.kind === 'ally' && dist(c, p) < PACK_RANGE).length;
  if (CH.pack) updateHunt();
  for (const c of creatures) {
    const sp = c.sp;
    const dx = p.x - c.x, dy = p.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    c.rest = Math.max(0, c.rest - dt);
    c.markT = Math.max(0, c.markT - dt);
    c.noiseT = Math.max(0, c.noiseT - dt);
    if (c.markT <= 0) c.mark = null;
    c.blink = ((worldT + c.seed) % 4.3) < 0.12 ? 1 : 0;
    const edible = !p.dead && (canEat(c) || fearsPack(c));
    const danger = !p.dead && isDanger(c);
    // un poisson (ou un crocodile) ne te suit pas hors de sa mare
    const reachable = !c.home || dist(p, c.home) < c.home.r * (sp.reach || 0.85) + p.size * 0.5;
    let mouthTarget = 0;

    c.hitT = Math.max(0, (c.hitT || 0) - dt);
    if (c.buried) {
      // cachée dans le sable, elle ne bouge pas
      steer(c, 0, 0, 0, dt);
    } else if (c.lureT > 0) {
      // attiré par la lumière, aspiré par le requin-tigre…
      c.lureT -= dt;
      steer(c, dx / d, dy / d, Math.max(sp.speed, 320) * 1.5, dt);
      c.mood = 'scared';
      c.fleeing = true;
    } else if (c.stunT > 0) {
      // assommé : il ne bouge plus, il ne mord plus
      c.stunT -= dt;
      if (c.state === 'chase' || c.state === 'alert') chasers--;
      c.state = 'wander';
      steer(c, 0, 0, 0, dt);
      c.mood = 'scared';
      c.fleeing = false;
      if (c === huntTarget) huntBites(c, dt);
    } else if (c.scaredT > 0) {
      // un aboiement : il file sans demander son reste
      c.scaredT -= dt;
      if (c.state === 'chase' || c.state === 'alert') chasers--;
      if (c.state !== 'wander') c.state = 'wander';
      const a = Math.atan2(c.y - c.barkY, c.x - c.barkX);
      steer(c, Math.cos(a), Math.sin(a), sp.speed * 0.9, dt);
      c.mood = 'scared';
      c.fleeing = true;
    } else if (c === huntTarget) {
      updateHunted(c, dt);
    } else if (sp.kind === 'stray') {
      updateStray(c, d, dx, dy, dt);
    } else if (sp.kind === 'ally') {
      updateAlly(c, dt);
    } else if (sp.kind === 'human') {
      updateHuman(c, d, dx, dy, dt);
    } else if (sp.kind === 'flock') {
      updateFlock(c, d, dt);
    } else if (sp.kind === 'shepherd') {
      // le berger attend à l'entrée, et te regarde
      steer(c, 0, 0, 0, dt);
      c.angle = Math.atan2(dy, dx);
      c.mood = 'happy';
    } else if (sp.kind === 'food' || sp.kind === 'stinger') {
      // dérive tranquille
      c.angle += Math.sin(worldT * 0.5 + c.seed * 3) * dt * 0.6;
      steer(c, Math.cos(c.angle), Math.sin(c.angle), sp.speed, dt);
      c.mood = 'calm';
    } else if (edible && d < (sp.sense || 200) && !p.hidden && sp.kind !== 'neutral' && sp.kind !== 'giant') {
      // il a peur : il s'enfuit en zigzag
      if (c.state === 'chase' || c.state === 'alert') { c.state = 'wander'; chasers--; }
      if (c.state === 'charge') c.state = 'wander';
      const zig = Math.sin(worldT * 5 + c.seed * 4) * 0.6;
      const a = Math.atan2(-dy, -dx) + zig;
      steer(c, Math.cos(a), Math.sin(a), sp.speed * (sp.kind === 'hunter' ? 0.85 : 1), dt);
      c.mood = 'scared';
      c.fleeing = true;
    } else if (sp.kind === 'hunter' && danger) {
      c.fleeing = false;
      c.mood = 'angry';
      if (c.state === 'wander') {
        if (!prowl(c, dt)) wander(c, sp.speed * 0.42, dt);
        // il ne voit que devant lui (cône), sauf tout près ; mais il entend quand on court
        const inView = !sp.cone || Math.abs(angleDiff(c.angle, Math.atan2(dy, dx))) <= sp.cone / 2 || d < sp.sense * 0.3;
        const sees = !p.hidden && !p.safe && p.invul <= 0 && reachable && c.rest <= 0 && ((d < sp.sense && inView) || c.noiseT > 0);
        if (sees && chasers < maxChasers) {
          spot(c);
          chasers += 1 + callPack(c);
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
        steer(c, lx / ld, ly / ld, sp.speed * (c.lunge > 0 ? LUNGE : 1) * (terre.on() ? LAND_CHASE : 1), dt);
        if (d < c.size * 2.6 + p.size) {
          mouthTarget = 0.5 + 0.5 * Math.abs(Math.sin(worldT * 9));
          if (Math.random() < dt * 2.5 && onScreen(c, 0)) sfx.snap();
        }
        if (p.hidden || p.safe || !reachable || d > sp.sense * 1.6 || c.timer <= 0) loseTrack(c, true);
      }
    } else if (sp.kind === 'rival') {
      // un animal de ton espèce : de temps en temps, il a faim et file vers une proie… la tienne !
      c.fleeing = false;
      c.mood = 'happy';
      c.hungerT = (c.hungerT ?? rand(0, 8)) - dt;
      if (c.hungerT <= 0) { c.hungry = !c.hungry; c.hungerT = c.hungry ? rand(6, 10) : rand(5, 9); c.prey = null; }
      if (c.prey && (c.prey.dead || dist(c, c.prey) > sp.sense * 1.5)) c.prey = null;
      if (c.hungry && !c.prey && Math.random() < dt * 2) c.prey = rivalTarget(c);
      if (c.prey) {
        const tx = c.prey.x - c.x, ty = c.prey.y - c.y, td = Math.hypot(tx, ty) || 1;
        steer(c, tx / td, ty / td, sp.speed, dt);
        c.mood = 'angry';
      } else {
        wander(c, sp.speed * 0.4, dt);
      }
    } else if (sp.kind === 'defender' && !p.dead) {
      // un gros herbivore : il fonce sur toi si tu t'approches trop
      c.fleeing = false;
      if (c.state === 'charge') {
        c.mood = 'angry';
        c.timer -= dt;
        steer(c, dx / d, dy / d, sp.speed * 1.8, dt);
        if (c.timer <= 0 || d > sp.sense * 2) { c.state = 'wander'; c.rest = 3; }
      } else if (c.state === 'alert') {
        c.mood = 'angry';
        steer(c, 0, 0, 0, dt);
        c.angle = turnToward(c.angle, Math.atan2(dy, dx), 6 * dt);
        c.timer -= dt;
        if (c.timer <= 0) { c.state = 'charge'; c.timer = 1.6; }
      } else {
        c.mood = 'calm';
        wander(c, sp.speed * 0.3, dt);
        if (p.invul <= 0 && c.rest <= 0 && d < sp.sense && !p.hidden) {
          c.state = 'alert';
          c.timer = 0.6;
          c.mark = '!';
          c.markT = 1;
          if (onScreen(c, 40)) {
            sfx.alert();
            sayOnce('defender', LINES.defender, 30, 2);
          }
        }
      }
    } else {
      // ni proie ni danger : il se promène
      if (c.state === 'chase' || c.state === 'alert' || c.state === 'charge') loseTrack(c, false);
      c.fleeing = false;
      c.mood = sp.kind === 'hunter' ? 'angry' : 'calm';
      if (!prowl(c, dt)) wander(c, sp.speed * (sp.kind === 'giant' ? 0.6 : 0.35), dt);
    }

    // les chasseurs (et les rivaux) grignotent les petites bêtes qui passent devant leur gueule
    if ((sp.kind === 'hunter' || sp.kind === 'rival') && !(c.stunT > 0)) {
      c.eatT -= dt;
      if (c.eatT <= 0) {
        c.eatT = 0.25;
        const most = sp.kind === 'rival' ? 0.7 : 0.55;
        for (const o of creatures) {
          if (o === c || o.dead || o.size > c.size * most || o.penned || o.buried || ['rival', 'human', 'ally', 'stray', 'shepherd'].includes(o.sp.kind)) continue;
          if (mouthDist(c, o.x, o.y) < o.size + c.size * 0.35) {
            o.dead = true;
            c.chomp = 0.35;
            if (o === c.prey) c.prey = null;
            if (onScreen(o, 0)) {
              burst(o.x, o.y, 6, [o.sp.color || '#FFFFFF', '#FFFFFF'], o.size * 6, o.size * 0.25);
              if (dist(o, p) < viewW * 0.4) sfx.eat(0.6);
              if (sp.kind === 'rival') {
                addFloater('Volé !', c.x, c.y - c.size * 1.4, '#FFB36B', 1.1);
                sayOnce('stolen', LINES.stolen, 40, 1);
              }
              if (o.sp.kind === 'flock') {
                addFloater(`${o.sp.name} croqué !`, o.x, o.y - o.size * 1.4, '#FF8A8A', 1.1);
                sayOnce('flockEaten', LINES.flockEaten, 30, 2);
              }
            }
            break;
          }
        }
      }
    }
    if (c.chomp > 0) { c.chomp -= dt; mouthTarget = c.chomp > 0.15 ? 1 : 0; }
    c.mouth += (mouthTarget - c.mouth) * (1 - Math.exp(-14 * dt));

    // les géants ne pivotent pas sur place : ils tournent en larges courbes (on leur échappe en virant)
    if (sp.maxTurn) {
      const vv = Math.hypot(c.vx, c.vy);
      if (vv > 1) {
        c.heading = turnToward(c.heading ?? c.angle, Math.atan2(c.vy, c.vx), sp.maxTurn * dt);
        c.vx = Math.cos(c.heading) * vv;
        c.vy = Math.sin(c.heading) * vv;
      }
    }
    // la boue colle, l'eau ralentit ceux qui marchent
    const zone = sp.flying || c.home ? null : zoneAt(c.x, c.y);
    const zk = terre.on() ? (zone === 'mud' ? LAND_MUD : zone === 'water' ? LAND_WATER : 1) : zone === 'mud' ? (LV.world.mudSpeed ?? 0.4) : zone === 'water' ? 0.6 : 1;
    const ox = c.x, oy = c.y;
    c.x += c.vx * dt * zk;
    c.y += c.vy * dt * zk;
    if (!sp.flying) fence(c, ox, oy, sp.kind === 'flock' && !c.penned, c.size * 0.6);
    if (c.home) keepInPond(c);
    const m = c.size + 40;
    if (c.x < m || c.x > W.w - m) { c.vx = -c.vx; c.x = clamp(c.x, m, W.w - m); c.wx = W.w / 2; }
    if (c.y < m || c.y > W.h - m) { c.vy = -c.vy; c.y = clamp(c.y, m, W.h - m); c.wy = W.h / 2; }
    const v = Math.hypot(c.vx, c.vy);
    if (v > 4 && c.state !== 'alert') c.angle = turnToward(c.angle, Math.atan2(c.vy, c.vx), 5 * dt);
    updateFace(c);
    terre.turn(c, dt);
    c.speed = sp.speed ? Math.min(1, v / sp.speed) : 0;
    c.swim = (c.swim || 0) + dt * (0.35 + c.speed * 0.8);
    c.walk += v * zk * dt / Math.max(8, c.size) * 1.3;
    followSpine(c, sp.look);

    // boum… boum… les pas des géants font trembler le sol
    if (sp.stomp && v > 15) {
      c.stepT -= dt * (0.7 + 1.6 * v / sp.speed);
      if (c.stepT <= 0) {
        c.stepT = 1;
        const k = clamp(1 - d / hearR, 0, 1) * clamp(c.size / 250, 0.5, 1.3);
        if (k > 0.05) {
          sfx.stomp(k);
          shake = Math.max(shake, k * 0.3);
          if (k > 0.45) sayOnce('stomp', LINES.stomp, 50, 1);
        }
      }
    }
  }
  if (creatures.some((c) => c.dead)) creatures = creatures.filter((c) => !c.dead);
}

/** La proie qu'un rival va te voler : une petite bête près de lui… et près de toi */
function rivalTarget(c) {
  let best = null, bd = Infinity;
  for (const o of creatures) {
    if (o.dead || (o.sp.kind !== 'food' && o.sp.kind !== 'prey') || o.size > c.size * 0.7) continue;
    const d = dist(o, c);
    if (d > c.sp.sense) continue;
    const score = d + dist(o, player) * 0.5;
    if (score < bd) { bd = score; best = o; }
  }
  return best;
}

/** Un loup de ta meute : il te suit, un peu derrière toi (chacun à sa place) */
function updateAlly(c, dt) {
  const p = player;
  c.fleeing = false;
  c.mood = 'happy';
  c.size += (p.size * 0.92 - c.size) * (1 - Math.exp(-dt));
  if (p.dead) { wander(c, c.sp.speed * 0.3, dt); return; }
  if (huntTarget) {
    // toute la meute attaque !
    const hx = huntTarget.x - c.x, hy = huntTarget.y - c.y, hd = Math.hypot(hx, hy) || 1;
    c.mood = 'angry';
    steer(c, hx / hd, hy / hd, maxSpeed() * 1.2, dt);
    if (hd < (huntTarget.size + c.size) * 0.8 && Math.random() < dt * 3) c.chomp = 0.3;
    return;
  }
  const slot = c.seed * 2.4;
  const back = p.size * 2.2 + 70;
  const a = p.angle + Math.PI + Math.sin(slot) * 1.1;
  const tx = p.x + Math.cos(a) * back, ty = p.y + Math.sin(a) * back;
  const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
  if (d < 25) { steer(c, 0, 0, 0, dt); return; }
  steer(c, dx / d, dy / d, maxSpeed() * (d > 500 ? 1.6 : d > 150 ? 1.1 : 0.6), dt);
}

/** Une bonne action rapporte de l'ADN (dans ce niveau, manger n'est pas le seul moyen d'évoluer) */
function deed(n, x, y) {
  game.adn += n;
  addFloater(`+${n} 🧬`, x, y, '#FFE58A', 0.9);
  bump(adnItem);
}

/** Un loup solitaire : il se promène ; touche-le, et il rejoint ta meute */
function updateStray(c, d, dx, dy, dt) {
  const p = player;
  c.fleeing = false;
  c.mood = 'happy';
  if (p.dead) { wander(c, c.sp.speed, dt); return; }
  // il entend ton hurlement et vient vers toi
  if (stats.howl && d < 900 && game.packN < PACK_MAX) steer(c, dx / d, dy / d, c.sp.speed * 2.5, dt);
  else wander(c, c.sp.speed, dt);
  if (d >= c.size + p.size + 50 || game.packN >= PACK_MAX) return;
  c.id = c.sp.joins;
  c.sp = SPECIES[c.id];
  game.packN++;
  game.packMax = Math.max(game.packMax || 0, game.packN);
  sfx.howl();
  addFloater(game.packN >= PACK_MAX ? 'Ta meute est au complet !' : 'Un loup de plus !', c.x, c.y - c.size * 2, '#7CF0A0', 1.2);
  deed(12, c.x, c.y - c.size * 2.8);
  sayOnce('packJoin', LINES.packJoin, 60, 1);
  shown.size = null;
  checkMissions();
}

/** Tu t'es fait croquer : un loup de ta meute s'enfuit (il redevient solitaire, pas loin) */
function loseWolf() {
  if (!(game.packN > 0)) return;
  const c = creatures.find((o) => o.sp.kind === 'ally');
  const stray = Object.keys(SPECIES).find((id) => SPECIES[id].kind === 'stray');
  game.packN--;
  shown.size = null;
  if (c) {
    c.id = stray;
    c.sp = SPECIES[stray];
    addFloater('Un loup s’enfuit !', c.x, c.y - c.size * 2, '#FFB36B', 1.1);
  }
  later(() => say(LINES.packLost, 2, 5000), 1500);
}

/** La meute se lance quand tu arrives près d'une grosse bête, si elle est assez grande */
function updateHunt() {
  const p = player;
  if (huntTarget && (huntTarget.dead || p.dead || dist(huntTarget, p) > 1500)) {
    // il s'échappe : il reprend des forces
    huntTarget.hp = huntTarget.sp.hp;
    if (huntTarget.sp.fights) { huntTarget.state = 'wander'; huntTarget.rest = 3; }
    huntTarget = null;
  }
  if (huntTarget || p.dead) return;
  for (const c of creatures) {
    if (!c.sp.hp || dist(c, p) > c.size + p.size + 220) continue;
    if (packNear < c.sp.need) {
      if (sayOnce('packSmall', LINES.packSmall, 25, 2)) addFloater(`Il faut ${c.sp.need} loups !`, c.x, c.y - c.size * 2.6, '#FFD24A', 1.2);
      continue;
    }
    huntTarget = c;
    sfx.howl();
    sayOnce('huntGo', LINES.huntGo, 40, 2);
    return;
  }
}

/** La bête attaquée : elle s'enfuit, plus lentement… ou elle se défend (fights) : elle se
    tourne vers toi, souffle, puis fonce. Chaque loup qui la touche lui enlève de la vie. */
function updateHunted(c, dt) {
  const p = player;
  const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy) || 1;
  if (c.sp.fights) {
    c.mood = 'angry';
    c.fleeing = false;
    c.timer -= dt;
    if (c.state !== 'charge' && c.state !== 'snort') {
      c.state = 'snort';
      c.timer = 1.2;
    } else if (c.timer <= 0) {
      c.state = c.state === 'charge' ? 'snort' : 'charge';
      c.timer = c.state === 'charge' ? 1.5 : 1.8;
    }
    if (c.state === 'charge') {
      steer(c, -dx / d, -dy / d, c.sp.speed * 2.2, dt);
    } else {
      steer(c, 0, 0, 0, dt);
      c.angle = turnToward(c.angle, Math.atan2(-dy, -dx), 4 * dt);
      if (c.timer < 0.6 && !c.mark) {
        c.mark = '!';
        c.markT = 0.8;
        if (onScreen(c, 40)) sfx.alert();
      }
    }
  } else {
    c.mood = 'scared';
    c.fleeing = true;
    const zig = Math.sin(worldT * 3 + c.seed) * 0.5;
    const a = Math.atan2(dy, dx) + zig;
    steer(c, Math.cos(a), Math.sin(a), c.sp.speed * 0.7, dt);
  }
  huntBites(c, dt);
}

/** Chaque loup qui touche la bête lui enlève de la vie */
function huntBites(c, dt) {
  const d = dist(c, player);
  let bites = d < (c.size + player.size) * 0.9 ? 1 : 0;
  for (const o of creatures) {
    if (o.sp.kind === 'ally' && dist(o, c) < (c.size + o.size) * 0.9) bites++;
  }
  if (!bites) return;
  c.hp -= bites * HUNT_BITE * dt;
  if (Math.random() < dt * 4) {
    sfx.snap();
    burst(c.x + rand(-1, 1) * c.size * 0.6, c.y + rand(-1, 1) * c.size * 0.5, 3, ['#FFFFFF', '#E8D9A0'], c.size * 2, Math.max(2, c.size * 0.06));
  }
  if (c.hp > 0) return;
  // la meute a gagné !
  c.dead = true;
  huntTarget = null;
  game.eaten[c.id] = (game.eaten[c.id] || 0) + 1;
  game.stats.eaten++;
  sfx.victory();
  shake = Math.max(shake, 0.4);
  confetti(30);
  burst(c.x, c.y, 24, [c.sp.color, '#FFFFFF', '#FFE58A'], c.size * 5, Math.max(3, c.size * 0.1));
  addFloater('Tous ensemble !', c.x, c.y - c.size * 2, '#7CF0A0', 1.5);
  deed(c.sp.adn, c.x, c.y - c.size * 1.2);
  if (c.sp.eatLine) say(c.sp.eatLine, 2, 5000);
  checkMissions();
}

/** Un humain, dans son camp. S'il ne te connaît pas encore, il te chasse quand tu
    t'approches trop ; s'il te fait confiance, il te laisse venir, et les enfants
    viennent jouer avec toi. */
function updateHuman(c, d, dx, dy, dt) {
  const p = player;
  const trust = game.trust || 0;
  c.fleeing = false;
  c.playT = Math.max(0, c.playT - dt);
  if (c.state === 'charge') {
    c.mood = 'angry';
    c.timer -= dt;
    steer(c, dx / d, dy / d, c.sp.speed * 2.2, dt);
    if (c.timer <= 0 || p.dead) { c.state = 'wander'; c.rest = 4; }
    return;
  }
  if (c.state === 'alert') {
    c.mood = 'angry';
    steer(c, 0, 0, 0, dt);
    c.angle = turnToward(c.angle, Math.atan2(dy, dx), 6 * dt);
    c.timer -= dt;
    if (c.timer <= 0) {
      c.state = 'charge';
      c.timer = 1.4;
      addFloater(c.sp.hurt || 'Ouste !', c.x, c.y - c.size * 2.4, '#FFB36B', 1.2);
    }
    return;
  }
  if (c.state !== 'wander') c.state = 'wander';
  c.mood = trust >= SHOO_TRUST ? 'happy' : 'calm';
  // tu avances vers lui alors qu'il ne te connaît pas : « Ouste ! » (si tu restes immobile, il peut venir tout près)
  const toward = -(p.vx * dx + p.vy * dy) / d;
  if (!p.dead && p.invul <= 0 && c.rest <= 0 && trust < SHOO_TRUST && d < c.sp.sense && toward > maxSpeed() * 0.25) {
    shoo(c);
    return;
  }
  if (c.sp.play && !c.played && trust >= PLAY_TRUST && !p.dead && d < 650 && d > p.size + c.size) {
    // un enfant vient jouer avec toi
    steer(c, dx / d, dy / d, c.sp.speed * 0.8, dt);
    c.mood = 'happy';
    return;
  }
  wander(c, c.sp.speed * 0.3, dt);
}

/** « Ouste ! » : tu t'approches d'un humain qui ne te connaît pas encore */
function shoo(c) {
  c.state = 'alert';
  c.timer = 0.5;
  c.mark = '!';
  c.markT = 1;
  if (onScreen(c, 40)) {
    sfx.alert();
    sayOnce('shoo', LINES.shoo, 25, 2);
  }
}

/** Un mouton (ou une chèvre) : il broute, reste près des autres et s'écarte devant toi.
    Une fois dans l'enclos, il y reste. */
function updateFlock(c, d, dt) {
  const p = player;
  c.fleeing = false;
  c.mood = 'calm';
  if (c.penned) {
    // il reste vers le milieu de l'enclos
    const z = pens[0];
    if (z && dist(c, z) > z.r * 0.6) {
      const gd = dist(c, z) || 1;
      steer(c, (z.x - c.x) / gd, (z.y - c.y) / gd, c.sp.speed * 0.5, dt);
    } else {
      wander(c, c.sp.speed * 0.15, dt);
    }
    return;
  }
  let fx = 0, fy = 0;
  const herdR = (c.sp.sense + p.size * 2) * stats.herd;
  if (!p.dead && d < herdR) {
    const k = (herdR - d) / herdR;
    fx += (c.x - p.x) / d * (0.6 + k);
    fy += (c.y - p.y) / d * (0.6 + k);
  }
  // les loups sauvages leur font peur, à eux aussi
  for (const o of creatures) {
    if (o.sp.kind !== 'hunter') continue;
    const od = dist(o, c) || 1;
    if (od < 380) { fx += (c.x - o.x) / od * 1.2; fy += (c.y - o.y) / od * 1.2; }
  }
  // tout près de la porte, le berger l'appelle : il entre
  const pen = pens[0];
  if (pen) {
    const R = pen.r * FENCE;
    const gx = pen.x + Math.cos(pen.gate) * (R - 120), gy = pen.y + Math.sin(pen.gate) * (R - 120);
    const gd = Math.hypot(gx - c.x, gy - c.y) || 1;
    if (gd < 420) { fx += (gx - c.x) / gd * 1.5; fy += (gy - c.y) / gd * 1.5; }
  }
  if (fx || fy) {
    // ils restent groupés : un peu vers le milieu du troupeau
    let cx = 0, cy = 0, n = 0;
    for (const o of creatures) {
      if (o === c || o.id !== c.id || o.penned || dist(o, c) > 350) continue;
      cx += o.x;
      cy += o.y;
      n++;
    }
    if (n) {
      const gx = cx / n - c.x, gy = cy / n - c.y, gd = Math.hypot(gx, gy) || 1;
      fx += gx / gd * 0.35;
      fy += gy / gd * 0.35;
    }
    const f = Math.hypot(fx, fy) || 1;
    steer(c, fx / f, fy / f, c.sp.speed * Math.min(1, 0.55 + f * 0.4), dt);
    c.mood = 'scared';
  } else {
    wander(c, c.sp.speed * 0.15, dt);
  }
  // le voilà dans l'enclos !
  for (const z of pens) {
    if (dist(c, z) > z.r * FENCE) continue;
    c.penned = true;
    game.penned = game.penned || {};
    game.penned[c.id] = (game.penned[c.id] || 0) + 1;
    sfx.pickup();
    addFloater('Dans l’enclos !', c.x, c.y - c.size * 1.6, '#7CF0A0', 1.1);
    sayOnce('penned', LINES.penned, 60, 1);
    deed(12, c.x, c.y - c.size * 2.4);
    checkMissions();
    break;
  }
}

/** La barrière de l'enclos : on la longe sans la traverser. La porte ne laisse passer que
    ceux qui ont le droit (open) : le joueur et les moutons, pas les loups. */
function fence(e, ox, oy, open, rad) {
  for (const z of pens) {
    const R = z.r * FENCE;
    const inside = Math.hypot(ox - z.x, oy - z.y) < R;
    const dx = e.x - z.x, dy = e.y - z.y, d = Math.hypot(dx, dy) || 1;
    if (inside ? d < R - rad : d > R + rad) continue;
    if (open && Math.abs(angleDiff(z.gate, Math.atan2(dy, dx))) < z.gateW / 2) continue;
    const to = inside ? R - rad : R + rad;
    e.x = z.x + dx / d * to;
    e.y = z.y + dy / d * to;
    // (un animal qui se promène change de direction)
    if (e.wx !== undefined) {
      e.wx = e.x + dx / d * (inside ? -300 : 300);
      e.wy = e.y + dy / d * (inside ? -300 : 300);
    }
  }
}

/* ---------- Les pouvoirs des requins (chapters[].power) ----------
   flash   le requin-lanterne s'allume : il éblouit les chasseurs, les proies accourent
   whip    le requin-renard fouette de la queue : les poissons autour sont assommés
   gulp    le requin-tigre aspire tout ce qui passe… puis il rote
   hammer  le requin-marteau : BONG ! et son sens électrique révèle les raies cachées
   breach  le mégalodon saute hors de l'eau, et retombe de tout son poids */
function noteStun(c) {
  if (c.stunNoted) return;
  c.stunNoted = true;
  game.stunned = game.stunned || {};
  game.stunned[c.id] = (game.stunned[c.id] || 0) + 1;
}

function ringFx(R, color) {
  particles.push({ x: player.x, y: player.y, vx: 0, vy: 0, life: 0, max: 0.55, size: R, color, ring: true });
}

function firePower() {
  const P = CH.power, p = player;
  const R = P.range * stats.power;
  p.strikeT = P.recharge;
  p.mouth = 1;
  const near = creatures.filter((c) => dist(c, p) < R + c.size);
  if (P.type === 'flash') {
    sfx.flashy();
    p.flashT = 0.5;
    p.litT = 3;
    flash = { a: 0.7, color: '190,255,245' };
    ringFx(R, '#9EFFEF');
    addFloater('FLASH !', p.x, p.y - p.size * 2.4, '#9EFFEF', 1.3);
    for (const c of near) {
      if (c.sp.kind === 'hunter') {
        c.stunT = 2.5;
        noteStun(c);
      } else if (canEat(c)) {
        c.lureT = 3;                   // les proies adorent la lumière…
      }
    }
  } else if (P.type === 'whip') {
    sfx.whip();
    p.whipT = 0.45;
    shake = Math.max(shake, 0.25);
    ringFx(R, '#FFFFFF');
    particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0, max: 0.35, size: p.size * 1.4, face: p.face || 1, color: '#FFFFFF', slash: 'queue', ang: p.angle });
    addFloater('FLAC !', p.x, p.y - p.size * 2, '#FFFFFF', 1.3);
    for (const c of near) {
      if (c.sp.kind === 'hunter') {
        c.stunT = 2;
        noteStun(c);
        addFloater('Aïe !', c.x, c.y - c.size * 1.6, '#FFD24A', 1);
      } else if (canEat(c)) {
        c.stunT = 3.5;
      }
    }
  } else if (P.type === 'gulp') {
    sfx.gulp();
    p.gulpT = 2;
    addFloater('AAAAH…', p.x, p.y - p.size * 2, '#FFE58A', 1.3);
    later(() => {
      if (state !== 'playing' || !player) return;
      sfx.burp();
      shake = Math.max(shake, 0.2);
      addFloater('BUUURP !', player.x, player.y - player.size * 2.2, '#B8F36B', 1.6);
      sayOnce('burp', LINES.burp, 60, 1);
      for (let i = 0; i < 8; i++) bubbleAt(player.x + Math.cos(player.angle) * player.size, player.y + Math.sin(player.angle) * player.size, player.size * 0.3);
    }, 2300);
  } else if (P.type === 'hammer') {
    sfx.bong();
    p.bongT = 0.3;
    shake = Math.max(shake, 0.3);
    ringFx(R, '#FFE58A');
    addFloater('BONG !', p.x, p.y - p.size * 1.8, '#FFD24A', 1.4);
    let found = 0;
    for (const c of near) {
      if (c.buried) {
        // le sens électrique : la raie sort du sable, tout étourdie
        c.buried = false;
        c.stunT = 2;
        found++;
        continue;
      }
      if (dist(c, p) > p.size * 2.6 + c.size * 0.9) continue;
      if (c.sp.kind === 'hunter' || canEat(c)) {
        c.stunT = c.sp.kind === 'hunter' ? 2.5 : 3;
        noteStun(c);
        burst(c.x, c.y - c.size * 0.5, 8, ['#FFD24A', '#FFFFFF'], c.size * 4 + 40, Math.max(2, c.size * 0.08));
      }
    }
    if (found) {
      addFloater(`${found} trouvée${found > 1 ? 's' : ''} !`, p.x, p.y - p.size * 2.8, '#7CF0A0', 1.2);
      sayOnce('found', LINES.found, 40, 1);
    }
  } else if (P.type === 'breach') {
    // il jaillit hors de l'eau : plus rien ne peut le toucher tant qu'il vole
    sfx.dash();
    p.airT = BREACH_TIME;
    p.vx = Math.cos(p.angle) * maxSpeed() * 1.5;
    p.vy = Math.sin(p.angle) * maxSpeed() * 1.5;
    for (let i = 0; i < 16; i++) bubbleAt(p.x, p.y, p.size * 0.5);
    addFloater('HOP !', p.x, p.y - p.size * 2, '#FFFFFF', 1.4);
  }
  checkMissions();
}

/** Il retombe, de tout son poids : une vague qui assomme tout ce qui est autour */
function landBreach() {
  const p = player;
  const R = CH.power.range * stats.power;
  sfx.thud();
  sfx.splash();
  shake = Math.max(shake, 0.8);
  flash = { a: 0.35, color: '230,245,255' };
  buzz([60, 40, 80]);
  ringFx(R, '#E6F6FF');
  addFloater('SPLAAASH !', p.x, p.y - p.size * 1.8, '#E6F6FF', 1.8);
  for (let i = 0; i < 40; i++) bubbleAt(p.x + rand(-1, 1) * p.size * 2, p.y + rand(-1, 1) * p.size * 2, p.size * 0.35);
  for (const c of creatures) {
    if (dist(c, p) > R + c.size) continue;
    if (c.sp.kind === 'hunter') {
      c.stunT = 2.5;
      noteStun(c);
    } else if (canEat(c)) {
      c.stunT = 3;
    }
    if (c.sp.breachHit) hitBoss(c);
  }
  checkMissions();
}

/** Un boss touché : sa barre descend, et il n'est vraiment pas content */
function hitBoss(c) {
  if (c.hitT > 0) return;
  c.hitT = 1.5;
  game.hits = game.hits || {};
  game.hits[c.id] = (game.hits[c.id] || 0) + 1;
  sfx.snap();
  sfx.thud();
  shake = Math.max(shake, 0.45);
  burst(c.x, c.y, 16, ['#FFFFFF', '#FFD24A'], c.size * 3 + 60, Math.max(3, c.size * 0.05));
  addFloater(c.sp.hitLine || 'AÏE !', c.x, c.y - c.size * 1.8, '#FF8FA8', 1.5);
  deed(30, c.x, c.y - c.size * 2.3);
  sayOnce('bossHit', LINES.bossHit, 30, 2);
  if (!(c.stunT > 0) && c.state === 'wander') {
    c.rest = 0;
    spot(c);
  }
  checkMissions();
}

/* La frénésie : manger vite de suite, ça rapporte de plus en plus (world.combo) */
function comboUp(c) {
  comboN++;
  comboT = 2.4;
  if (comboN < 2) return;
  const bonus = Math.min(comboN - 1, 6);
  game.adn += bonus;
  addFloater(`Combo x${comboN} !`, c.x, c.y - c.size * 1.2 - 40 / zoom, comboN >= 5 ? '#FF8FA8' : '#FFD24A', 1 + Math.min(0.6, comboN * 0.05));
  if (comboN >= 5) sfx.pickup();
  if (comboN === 8) say(pick(LINES.combo), 2, 4000);
}

/** Un loup sauvage rôde autour des moutons qui ne sont pas à l'abri… */
function prowl(c, dt) {
  if (!c.sp.eatsFlock) return false;
  let best = null, bd = c.sp.sense * 1.5;
  for (const o of creatures) {
    if (o.sp.kind !== 'flock' || o.penned) continue;
    const d = dist(o, c);
    if (d < bd) { bd = d; best = o; }
  }
  if (!best) return false;
  const dx = best.x - c.x, dy = best.y - c.y, d = Math.hypot(dx, dy) || 1;
  steer(c, dx / d, dy / d, c.sp.speed * 0.6, dt);
  c.mood = 'angry';
  return true;
}

/* ---------- La confiance des humains (le loup et l'humain) ----------
   Elle monte quand tu restes près d'eux sans foncer, et quand tu manges ce
   qu'ils te lancent ; elle baisse quand tu fonces près d'eux (ils ont peur). */
function gainTrust(k) {
  const before = game.trust || 0;
  game.trust = clamp(before + k, 0, 1);
  // tous les 10 % gagnés une première fois : un peu d'ADN
  const tens = Math.floor(game.trust * 10 + 1e-6);
  if (tens > (game.trustBest || 0)) {
    deed((tens - (game.trustBest || 0)) * 8, player.x, player.y - player.size * 2.6);
    game.trustBest = tens;
  }
  for (const [lim, line] of [[SHOO_TRUST, 'trustShoo'], [SAFE_TRUST, 'trustSafe'], [1, 'trustFull']]) {
    if (before < lim && game.trust >= lim) say(LINES[line], 2, 6000);
  }
  if (Math.floor(before * 100) !== Math.floor(game.trust * 100)) checkMissions();
}

function updateTrust(dt) {
  const p = player;
  if (!CH.trust || p.dead) return;
  let near = null, nd = Infinity;
  for (const c of creatures) {
    if (c.sp.kind !== 'human' || c.state !== 'wander') continue;
    const d = dist(c, p);
    if (d < nd) { nd = d; near = c; }
  }
  if (!near || nd > 460 || p.dash > 0) return;
  const trust = game.trust || 0;
  gainTrust(dt * (LV.world.noGrow ? 0.01 : 0.016) * stats.trust * (nd < 300 ? 1.5 : 1));
  sayOnce('trustHint', LINES.trustHint, 120, 1);
  heartFxT -= dt;
  if (heartFxT <= 0) {
    heartFxT = 1.4;
    addFloater('❤', near.x, near.y - near.size * 2.4, '#FF8FA8', 0.8);
  }
  // de temps en temps, il te lance quelque chose à manger
  if (trust >= 0.15 && CH.treat) {
    boneT -= dt * stats.treats;
    if (boneT <= 0) {
      boneT = rand(6, 9);
      const k = rand(0.35, 0.6);
      creatures.push(makeCreature(CH.treat, near.x + (p.x - near.x) * k + rand(-40, 40), near.y + (p.y - near.y) * k + rand(-40, 40)));
      addFloater(pick(LINES.treat), near.x, near.y - near.size * 2.4, '#FFE58A', 1);
      sfx.pickup();
    }
  }
}

/** Tu as foncé près des humains : ils ont eu peur */
function startleHumans() {
  let scared = false;
  for (const c of creatures) {
    if (c.sp.kind !== 'human' || dist(c, player) > 460) continue;
    scared = true;
    if ((game.trust || 0) < SHOO_TRUST && c.state === 'wander') shoo(c);
    else { c.mark = '!'; c.markT = 0.8; }
  }
  if (!scared) return;
  gainTrust(-0.08);
  addFloater('Ils ont eu peur !', player.x, player.y - player.size * 2, '#FFB36B', 1);
  sayOnce('startle', LINES.startle, 20, 2);
}

/** Un enfant joue avec toi (une seule fois chacun) */
function playWith(c) {
  if ((game.trust || 0) < PLAY_TRUST) {
    c.playT = 3;
    sayOnce('childShy', LINES.childShy, 30, 1);
    return;
  }
  c.played = true;
  c.playT = 1e9;
  game.played = game.played || {};
  game.played[c.id] = (game.played[c.id] || 0) + 1;
  sfx.phew();
  burst(c.x, c.y - c.size, 12, ['#FF8FA8', '#FFFFFF', '#FFD24A'], c.size * 4, Math.max(3, c.size * 0.12));
  addFloater('Ouaf ! ❤', player.x, player.y - player.size * 2, '#FF8FA8', 1.3);
  sayOnce('played', LINES.played, 30, 1);
  deed(20, c.x, c.y - c.size * 2.6);
  checkMissions();
}

/** Un chasseur te repère : « ! », et il rugit s'il est gros */
function spot(c) {
  c.state = 'alert';
  c.timer = ALERT_TIME;
  c.mark = '!';
  c.markT = 1.1;
  if (!onScreen(c, 60) && dist(c, player) > Math.hypot(viewW, viewH) * 0.6) return;
  if (c.sp.roar) {
    const k = clamp(c.size / 300, 0.4, 1.2);
    sfx.roar(k);
    shake = Math.max(shake, 0.25 + 0.3 * k);
    addFloater('ROAAAR !', c.x, c.y - c.size * 1.7, '#FF6F91', 1.5);
    sayOnce('roar', LINES.roar, 30, 2);
  } else {
    sfx.alert();
  }
  buzz(40);
  if (sayOnce('spotted', LINES.spotted, 12, 2) && !game.dashUsed) later(() => sayOnce('dashHint', LINES.dashHint, 60, 2), 2200);
}

/** Si c'est une meute, les autres membres arrivent aussi */
function callPack(c) {
  if (!c.sp.pack) return 0;
  let n = 0;
  for (const o of creatures) {
    if (o === c || o.id !== c.id || o.state !== 'wander' || dist(o, c) > 800 || !isDanger(o)) continue;
    o.state = 'alert';
    o.timer = ALERT_TIME + rand(0.1, 0.4);
    o.mark = '!';
    o.markT = 1.1;
    n++;
  }
  if (n) sayOnce('pack', LINES.pack, 30, 3);
  return n;
}

/** Un animal des mares reste dans sa mare */
function keepInPond(c) {
  const h = c.home;
  const dd = dist(c, h) || 1;
  const lim = Math.max(10, h.r * 0.78 - c.size * 0.4);
  if (dd > lim) {
    c.x = h.x + (c.x - h.x) / dd * lim;
    c.y = h.y + (c.y - h.y) / dd * lim;
    c.vx *= -0.4;
    c.vy *= -0.4;
    c.wx = h.x;
    c.wy = h.y;
  }
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
  if (p.dead || p.airT > 0) return;
  for (const c of creatures) {
    if (c.dead || c.buried) continue;
    // mordre la queue d'un boss
    if (c.sp.tailBite && c.spine && !(c.hitT > 0)) {
      const tp = c.spine[c.spine.length - 2];
      if (mouthDist(p, tp.x, tp.y) < p.size * 0.6 + c.size * 0.4) hitBoss(c);
    }
    const dm = mouthDist(p, c.x, c.y);
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
      if (mouthDist(c, p.x, p.y) < p.size * 0.85 + c.size * 0.3) {
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
    // 4. un herbivore qui charge (ou la queue à pointes), un géant qui écrase
    if (p.invul <= 0 && !canEat(c) && hurtsByContact(c, d)) {
      stung(c);
      continue;
    }
    // 5. un enfant qui joue avec toi
    if (c.sp.play && c.playT <= 0 && d < c.size + p.size * 1.1) playWith(c);
    // 6. on se cogne (sauf contre ce qui vole, très haut, et contre sa meute)
    const touch = c.size * 0.75 + p.size * 0.75;
    if (d < touch && !canEat(c) && c.sp.kind !== 'food' && !c.sp.flying && !['giant', 'ally', 'flock', 'shepherd'].includes(c.sp.kind)) {
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
  if (sp.eatLine) sayOnce(`eat-${c.id}`, LINES[sp.eatLine] || sp.eatLine, 300, 2);
  if (sp.trust) gainTrust(sp.trust);
  if (LV.world.combo || terre.on()) comboUp(c);
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
  loseLife(c, 'eaten');
}

/**
 * On perd une vie : mangé par un chasseur (by), ou desséché sur la terre (cause 'dry').
 * Un de tes descendants prend la relève, mais tu perds la moitié de ton ADN
 * (il reste là : on peut essayer de le récupérer) et un peu de taille.
 */
function loseLife(by, cause) {
  const p = player;
  if (p.dead) return;
  buzz([80, 60, 120]);
  shake = 0.7;
  if (cause === 'dry') {
    sfx.sting();
    flash = { a: 0.5, color: '255,210,120' };
    addFloater(meter().dead, p.x, p.y - p.size * 1.5, '#FFD24A', 1.6);
    burst(p.x, p.y, 20, ['#E8D9A0', '#FFFFFF', '#C9B27A'], p.size * 6 + 40, Math.max(2, p.size * 0.15));
  } else {
    sfx.gulp();
    flash = { a: 0.55, color: '255,60,80' };
    by.chomp = 0.6;
    by.state = 'wander';
    by.rest = FULL_REST;
    by.mark = null;
    addFloater('GLOUPS !', p.x, p.y - p.size * 1.5, '#FF6F91', 1.8);
    burst(p.x, p.y, 24, ['#6EE0B0', '#FFFFFF', '#B9F5DA'], p.size * 8 + 60, Math.max(2, p.size * 0.18));
  }
  const pen = LV.world.penalty || { adn: EATEN_ADN_LOSS, growth: EATEN_GROWTH_LOSS };
  const lost = Math.floor(game.adn * pen.adn);
  if (lost > 0) {
    game.adn -= lost;
    const n = Math.min(6, Math.max(1, Math.ceil(lost / 8)));
    for (let i = 0; i < n; i++) {
      const share = Math.floor(lost / n) + (i < lost % n ? 1 : 0);
      const a = Math.random() * TAU, s = rand(60, 160);
      drops.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.max(8, p.size * 0.35), adn: share, life: DROP_LIFE, seed: Math.random() * 10 });
    }
  }
  game.earned = Math.max(0, game.earned - (CH.growth || 0) * pen.growth);
  if (CH.pack) loseWolf();
  game.stats.deaths++;
  if (botInput) botDeaths[cause === 'dry' ? 'jauge' : by ? by.sp.look : '?'] = (botDeaths[cause === 'dry' ? 'jauge' : by ? by.sp.look : '?'] || 0) + 1;
  p.dead = true;
  p.deadT = RESPAWN_TIME;
  for (const c of creatures) if (c.state === 'chase' || c.state === 'alert' || c.state === 'charge') { c.state = 'wander'; c.rest = GIVE_UP_REST; }
  say(pick(cause === 'dry' ? LINES[meter().out] : LINES.eaten), 3, 6000);
  saveGame();
}

/** Ce qui fait mal quand on le touche, sans nous manger */
function hurtsByContact(c, d) {
  if (c.stunT > 0) return false;
  const p = player;
  const k = c.sp.kind;
  if (k === 'human') return c.state === 'charge' && d < c.size * 0.9 + p.size * 0.6;
  if (k === 'giant') {
    // sous les pattes du géant (le milieu de son corps)
    const mid = c.spine && !c.side ? c.spine[Math.floor(c.spine.length / 2)] : c;
    return Math.hypot(mid.x - p.x, mid.y - p.y) < c.size * 0.5 + p.size * 0.5;
  }
  if (k !== 'defender') return false;
  if (c.state === 'charge' && d < c.size * 0.8 + p.size * 0.6) return true;
  // la queue à pointes (ou la massue) fait mal même sans charger
  const b = c.sp.body || {};
  if (b.tailSpikes || b.club) {
    const tail = tailPoint(c);
    return Math.hypot(tail.x - p.x, tail.y - p.y) < c.size * 0.4 + p.size * 0.6;
  }
  return false;
}

/** Une méduse pique, une corne, une massue ou une patte de géant : ça fait mal ! */
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
  if (c.state === 'charge') { c.state = 'wander'; c.rest = 3; }
  const kind = c.sp.kind;
  if (kind === 'stinger') sfx.sting(); else sfx.thud();
  shake = kind === 'giant' ? 0.6 : 0.35;
  flash = { a: 0.35, color: kind === 'stinger' ? '255,120,255' : '255,160,90' };
  addFloater(c.sp.hurt || 'Aïe !', p.x, p.y - p.size * 1.6, kind === 'stinger' ? '#F6A6FF' : '#FFB36B', 1.3);
  sayOnce('hurt-' + kind, kind === 'giant' ? LINES.crushed : kind === 'defender' ? LINES.horned : kind === 'human' ? LINES.shooed : LINES.stung, 25, 2);
  if (kind === 'human') gainTrust(-0.04);
  buzz(60);
}

/* ---------- Missions et chapitres ---------- */
function missionInfo(m) {
  if (m.type === 'eat') {
    const sp = SPECIES[m.species];
    const cur = Math.min(m.n, game.eaten[m.species] || 0);
    const name = m.n > 1 ? sp.plural : sp.proper ? sp.name : sp.name.toLowerCase();
    return { text: m.text || `Croque ${m.n} ${name}`, cur, max: m.n, done: cur >= m.n, img: speciesThumb(m.species, sp), revenge: m.revenge };
  }
  if (m.type === 'stun' || m.type === 'hit') {
    // assommer avec son pouvoir, toucher un boss
    const sp = SPECIES[m.species];
    const cur = Math.min(m.n, (m.type === 'stun' ? game.stunned : game.hits)?.[m.species] || 0);
    return { text: m.text || `Assomme ${m.n} ${m.n > 1 ? sp.plural : sp.name}`, cur, max: m.n, done: cur >= m.n, img: speciesThumb(m.species, sp), revenge: m.type === 'hit' };
  }
  if (m.type === 'pack') {
    // rassembler une meute (le plus grand nombre de loups atteint)
    const cur = Math.min(m.n, game.packMax || 0);
    return { text: m.text || `Rassemble une meute de ${m.n} loups`, cur, max: m.n, done: cur >= m.n, img: speciesThumb(m.species, SPECIES[m.species]) };
  }
  if (m.type === 'trust') {
    // la confiance des humains (en %)
    const cur = Math.floor((game.trust || 0) * 100 + 1e-6);
    return { text: m.text || `Confiance des humains : ${m.n} %`, cur: Math.min(cur, m.n), max: m.n, done: cur >= m.n, img: speciesThumb(m.species, SPECIES[m.species]), pct: true };
  }
  if (m.type === 'bark' || m.type === 'herd' || m.type === 'play') {
    // aboyer sur, ramener dans l'enclos, jouer avec…
    const sp = SPECIES[m.species];
    const got = { bark: game.barked, herd: game.penned, play: game.played }[m.type] || {};
    const cur = Math.min(m.n, got[m.species] || 0);
    const name = m.n > 1 ? sp.plural : sp.name.toLowerCase();
    const text = { bark: `Fais fuir ${m.n} ${name}`, herd: `Ramène ${m.n} ${name} dans l’enclos`, play: `Joue avec ${m.n} ${name}` }[m.type];
    return { text: m.text || text, cur, max: m.n, done: cur >= m.n, img: speciesThumb(m.species, sp) };
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

const howToFirst = $('howToFirst');
const HOWTO_SEA = howToFirst.innerHTML;
const HOWTO_LAND = HOWTO_SEA.replace('pour nager', 'pour courir');

/** Sur la terre, on court ; dans la mer, on nage */
function setupLandUi() {
  const land = terre.on();
  const arrows = '<kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> ou <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd>';
  $('deskHelp').innerHTML = `${arrows} ${land ? 'courir' : 'nager'} · <kbd>Espace</kbd> foncer · <kbd>E</kbd> évoluer`;
}

/** Les couleurs du joueur changent à chaque chapitre (chapters[].skin) */
const PLAYER_DEFAULT = { ...PLAYER };
function applySkin() {
  Object.assign(PLAYER, PLAYER_DEFAULT, { stripe: null }, CH.skin || {});
  // les rivaux sont de ton espèce : ils ont tes couleurs
  for (const sp of Object.values(SPECIES)) {
    if (sp.kind === 'rival') Object.assign(sp, { color: PLAYER.body, belly: PLAYER.belly, stripe: PLAYER.stripe });
  }
}

/** Les mares, la boue, la neige et les cachettes de ce chapitre (un terrier ne sert plus à un tigre) */
function chapterDecor() {
  const ch = game.chapter + 1;
  const now = (d) => d.from <= ch && d.to >= ch;
  zones = levelDecor.zones.filter(now);
  hides = levelDecor.hides.filter(now);
  covers = levelDecor.covers.filter(now);
  pens = zones.filter((z) => z.zone === 'pen');
}

function setupChapter(keepPos) {
  chapterDecor();
  applySkin();
  $('waterIcon').textContent = CH.trust ? '🤝' : meter().icon;
  waterItem.title = CH.trust ? LINES.trustTitle : meter().title;
  shownBark = -1;
  shownStrike = -1;
  const pw = CH.power || LV.world.strike;
  if (pw) strikeBtn.innerHTML = `${pw.icon} ${escapeHtml(pw.name)} <kbd class="desktop-only">F</kbd>`;
  huntTarget = null;
  $('sizeIcon').textContent = CH.pack ? '🐺' : '📏';
  $('sizeLabel').textContent = CH.pack ? 'Meute' : 'Taille';
  $('sizeItem').title = CH.pack ? LINES.packTitle : 'Ta taille : mange pour grandir';
  floorTile = buildFloorTile(CH.palette.floor, game.chapter + 3);
  // (CH.start) ce chapitre commence à un endroit précis (quand on y arrive)
  const x = keepPos && CH.start ? CH.start.x : keepPos && player ? player.x : (game.pos ? game.pos.x : LV.world.start.x);
  const y = keepPos && CH.start ? CH.start.y : keepPos && player ? player.y : (game.pos ? game.pos.y : LV.world.start.y);
  placePlayer(x, y);
  drops = [];
  particles = [];
  floaters = [];
  setupLandUi();
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
    ${CH.power ? `<p class="dlg-say">🆕 ${escapeHtml(CH.power.intro)}</p>` : LV.world.strike && LV.world.strike.from === game.chapter + 1 ? `<p class="dlg-say">🆕 ${escapeHtml(LV.world.strike.intro)}</p>` : ''}
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
    <div class="dlg-actions"><button class="primary" data-act="close">${LV.world.ground === 'land' ? 'Retour à la terre ferme' : "Retour à l'océan"}</button></div>`, actions, true);
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
  comboT -= dt;
  if (comboT <= 0) comboN = 0;
  if (evolving) {
    updateEvolving(dt);
    updateFx(dt);
    return;
  }
  updatePlayer(dt);
  updateCreatures(dt);
  updateContacts();
  updateTrust(dt);
  maintainPopulation(dt);
  updateDrops(dt);
  updateFx(dt);
  // poursuite : le cœur bat, l'écran rougit
  const chasers = creatures.filter((c) => c.state === 'chase' || c.state === 'charge');
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
      if (game.seen[c.id] || c.buried || dist(c, player) > vr || !onScreen(c, 0)) continue;
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
  const land = W.ground === 'land';
  if (!land) {
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
  }

  const ch = game.chapter + 1;
  const inChapter = (d) => d.from <= ch && d.to >= ch;
  for (const z of zones) if (inView(z, z.r * 1.2)) drawDecor(ctx, z, worldT);
  for (const a of hides) if (inChapter(a) && inView(a, a.r)) drawDecor(ctx, a, worldT);
  ctx.globalAlpha = 0.82;
  for (const d of decor) if (!d.hide && inChapter(d) && inView(d, d.r * 1.3)) drawDecor(ctx, d, worldT);
  ctx.globalAlpha = 1;
  if (stats.cones) drawCones(inView);
  for (const d of drops) if (inView(d, d.r * 2)) drawDrop(ctx, d, worldT);

  // les créatures, des plus petites aux plus grosses ; le joueur à sa place ; ce qui vole, tout en haut
  const list = creatures.filter((c) => inView(c, c.size * 3.5)).sort(land ? (a, b) => a.y - b.y : (a, b) => a.size - b.size);
  let playerDrawn = false;
  for (const c of list) {
    if (c.sp.flying) continue;
    if (!playerDrawn && (land ? c.y > player.y : c.size > player.size)) { drawThePlayer(); playerDrawn = true; }
    terre.paint(c, () => drawCreature(ctx, c, worldT + c.seed));
  }
  if (!playerDrawn) drawThePlayer();

  // par-dessus : les cachettes (algues, fougères) et les feuillages, transparents quand on est dessous
  for (const a of covers) {
    if (!inChapter(a) || !inView(a, a.r + 200)) continue;
    if (a.canopy) ctx.globalAlpha = dist(a, player) < a.r + player.size ? 0.35 : 0.94;
    drawCover(ctx, a, worldT);
    ctx.globalAlpha = 1;
  }
  for (const c of list) if (c.sp.flying) drawCreature(ctx, c, worldT + c.seed);
  if (land) drawCloudShadows(ctx, clouds, worldT, x0, y0, x1, y1);

  // marques au-dessus des créatures
  for (const c of list) {
    if (CH.pack) drawPackMark(c);
    if (c.stunT > 0) drawStars(c);
    if (c.sp.hits) drawBossBar(c);
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

/** La barre de vie d'un boss : elle descend à chaque coup */
function drawBossBar(c) {
  const left = clamp(1 - (game.hits?.[c.id] || 0) / c.sp.hits, 0, 1);
  const w = c.size * 2, h = 14 / zoom, x = c.x - w / 2, y = c.y - c.size * 1.5;
  ctx.fillStyle = 'rgba(8, 30, 45, 0.85)';
  ctx.fillRect(x - 2 / zoom, y - 2 / zoom, w + 4 / zoom, h + 4 / zoom);
  ctx.fillStyle = left > 0.34 ? '#FF8FA8' : '#FF4B5E';
  ctx.fillRect(x, y, w * left, h);
}

/** Assommé : des étoiles tournent au-dessus de sa tête */
function drawStars(c) {
  const fs = Math.max(14 / zoom, c.size * 0.35);
  ctx.font = `${fs}px 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    const a = worldT * 6 + i * TAU / 3;
    ctx.fillText('⭐', c.x + Math.cos(a) * c.size * 0.7, c.y - c.size * 1.3 + Math.sin(a) * c.size * 0.2);
  }
}

/** La meute : un loup seul à rejoindre (un anneau doré), la barre de vie des grosses bêtes */
function drawPackMark(c) {
  if (c.sp.kind === 'stray') {
    if (game.packN >= PACK_MAX) return;
    ctx.strokeStyle = `rgba(255, 210, 74, ${0.6 + Math.sin(worldT * 5) * 0.3})`;
    ctx.lineWidth = 4 / zoom;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size * 1.7, 0, TAU);
    ctx.stroke();
    return;
  }
  if (!c.sp.hp) return;
  // (une très grosse bête : la barre reste à l'écran, sous les boutons du haut)
  const w = c.size * 1.7, h = 12 / zoom, x = c.x - w / 2;
  const top = cam.y - viewH / 2 + 84 / zoom;
  const y = c.y > top ? Math.max(c.y - c.size * 1.9, top) : c.y - c.size * 1.9;
  ctx.fillStyle = 'rgba(8, 30, 45, 0.85)';
  ctx.fillRect(x - 2 / zoom, y - 2 / zoom, w + 4 / zoom, h + 4 / zoom);
  ctx.fillStyle = c.hp > c.sp.hp * 0.35 ? '#7CF0A0' : '#FF6B6B';
  ctx.fillRect(x, y, w * clamp(c.hp / c.sp.hp, 0, 1), h);
  if (c === huntTarget) return;
  // combien de loups il faut pour l'attaquer
  ctx.font = `800 ${18 / zoom}px 'Baloo 2', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineWidth = 4 / zoom;
  ctx.strokeStyle = 'rgba(8, 30, 45, 0.85)';
  const label = `🐺 ${Math.min(packNear, c.sp.need)}/${c.sp.need}`;
  ctx.strokeText(label, c.x, y - 4 / zoom);
  ctx.fillStyle = packNear >= c.sp.need ? '#7CF0A0' : '#FFD24A';
  ctx.fillText(label, c.x, y - 4 / zoom);
}

/** (Gros cerveau) Ce que voient les chasseurs : un cône devant eux */
function drawCones(inView) {
  for (const c of creatures) {
    const sp = c.sp;
    if (sp.kind !== 'hunter' || !sp.cone || !isDanger(c) || !inView(c, sp.sense)) continue;
    const hot = c.state === 'alert' || c.state === 'chase';
    const g = ctx.createRadialGradient(c.x, c.y, c.size * 0.5, c.x, c.y, sp.sense);
    g.addColorStop(0, hot ? 'rgba(255, 60, 60, 0.32)' : 'rgba(255, 90, 90, 0.2)');
    g.addColorStop(1, 'rgba(255, 90, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, sp.sense, c.angle - sp.cone / 2, c.angle + sp.cone / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hot ? 'rgba(255, 70, 70, 0.6)' : 'rgba(255, 120, 120, 0.3)';
    ctx.lineWidth = 3 / zoom;
    ctx.setLineDash([12 / zoom, 10 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawThePlayer() {
  const p = player;
  if (p.dead) return;
  // le saut : son ombre reste dans l'eau, lui monte et grossit
  const air = p.airT > 0 ? Math.sin((1 - p.airT / BREACH_TIME) * Math.PI) : 0;
  if (air > 0) {
    ctx.fillStyle = `rgba(0, 10, 25, ${0.4 - air * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.size * 0.3, p.size * (1.6 - air * 0.4), p.size * (0.7 - air * 0.2), p.angle, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y - air * p.size * 1.4);
    ctx.scale(1 + air * 0.5, 1 + air * 0.5);
    ctx.translate(-p.x, -p.y);
  }
  const blinkOff = !air && p.invul > 0 && Math.floor(p.invul * 6) % 2 === 1;
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
  terre.paint(p, () => drawPlayer(ctx, p, CH.form, game.owned, worldT));
  if (sq !== 1) ctx.restore();
  if (air > 0) ctx.restore();
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
    if (p.slash) {
      // le coup de queue (un grand arc derrière toi) ou de griffe (trois griffures devant toi)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineCap = 'round';
      ctx.lineWidth = p.size * 0.14;
      ctx.beginPath();
      if (p.slash === 'queue') {
        const mid = p.ang !== undefined ? p.ang + Math.PI : p.face > 0 ? Math.PI : 0, R = p.size * (1.6 + k * 1.2);
        ctx.arc(p.x, p.y, R, mid - 1.3, mid + 1.3);
      } else {
        for (const o of [-0.6, 0, 0.6]) {
          const x = p.x + p.face * p.size * (1.2 + o * 0.3), y = p.y + o * p.size;
          ctx.moveTo(x - p.face * p.size * 0.5, y - p.size * 0.8);
          ctx.quadraticCurveTo(x + p.face * p.size * 0.5, y, x - p.face * p.size * 0.1, y + p.size * 0.8);
        }
      }
      ctx.stroke();
    } else if (p.streak !== undefined) {
      // (sur la terre) un trait de vitesse
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.5 / zoom, p.size * 0.04);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - Math.cos(p.streak) * p.size, p.y - Math.sin(p.streak) * p.size);
      ctx.stroke();
    } else if (p.ring) {
      // l'onde d'un aboiement
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 6 / zoom;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.2 + k * 0.8), 0, TAU);
      ctx.stroke();
    } else if (p.bubble) {
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
  ctx.fillStyle = CH.palette.motes || 'rgba(230, 255, 245, 0.55)';
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
  g.addColorStop(1, `rgba(3, 20, 34, ${CH.fog ?? 0.64})`);
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
    for (const side of c.side ? [0] : [-1, 1]) {
      let ex = cs.x + (fx * 0.3 - fy * 0.32 * side) * c.size * zoom, ey = cs.y + (fy * 0.3 + fx * 0.32 * side) * c.size * zoom;
      if (c.side) {
        ex = cs.x + c.face * c.side[0] * 0.65 * c.size * zoom;
        ey = cs.y + (c.side[1] - 0.15) * c.size * zoom;
      }
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

/** La créature la plus proche qui convient */
function nearestCreature(ok) {
  let best = null, bd = Infinity;
  for (const c of creatures) {
    if (!ok(c)) continue;
    const d = dist(c, player);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

/** Où aller pour la prochaine mission : une proie, un troupeau, l'enclos, les humains… */
function missionTarget() {
  const todo = CH.missions.filter((m) => !missionInfo(m).done);
  const eat = todo.filter((m) => m.type === 'eat').map((m) => m.species);
  const at = (c) => c && { x: c.x, y: c.y, size: c.size, img: speciesThumb(c.id, c.sp) };
  const prey = nearestCreature((c) => eat.includes(c.id) && canEat(c));
  if (prey) return at(prey);
  for (const m of todo) {
    if (m.type === 'stun' || m.type === 'hit') {
      const t = nearestCreature((c) => c.id === m.species);
      if (t) return at(t);
    }
    const hunt = m.type === 'eat' && SPECIES[m.species].hp;
    if (m.type === 'pack' || (hunt && (game.packN || 0) < SPECIES[m.species].need)) {
      const t = nearestCreature((c) => c.sp.kind === 'stray');
      if (t) return at(t);
    }
    if (hunt) {
      const t = nearestCreature((c) => c.id === m.species);
      if (t) return at(t);
    }
    if (m.type === 'bark' && stats.bark) {
      const t = nearestCreature((c) => c.id === m.species && !c.barked);
      if (t) return at(t);
    }
    if (m.type === 'herd') {
      const t = nearestCreature((c) => c.id === m.species && !c.penned);
      const pen = pens[0];
      // un mouton en vue (ou aucun) : la flèche montre la porte de l'enclos
      if (pen && (!t || onScreen(t, -20))) {
        return { x: pen.x + Math.cos(pen.gate) * pen.r * FENCE, y: pen.y + Math.sin(pen.gate) * pen.r * FENCE, size: 60, icon: '🚪' };
      }
      if (t) return at(t);
    }
    if (m.type === 'trust' || m.type === 'play' || (m.type === 'eat' && m.species === CH.treat)) {
      const h = nearestCreature((c) => c.sp.kind === 'human' && (m.type !== 'play' || (c.id === m.species && !c.played)));
      if (h) return at(h);
      const camp = nearestZone(player.x, player.y, 'camp');
      if (camp) return { x: camp.x, y: camp.y, size: camp.r * 0.5, icon: '🔥' };
    }
  }
  return null;
}

/** Flèche au bord de l'écran vers la prochaine mission (une proie, l'enclos, le camp…) */
function drawTargetArrow() {
  if (player.dead) return;
  const best = missionTarget();
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
  if (best.img) {
    const img = thumbImg(best.img);
    if (img.complete) ctx.drawImage(img, -19, -19, 38, 38);
  } else {
    ctx.font = "22px 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(best.icon, 0, 1);
  }
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
  for (const z of zones) {
    const m = toM(z.x, z.y);
    mctx.fillStyle = z.zone === 'water' ? 'rgba(90, 180, 220, 0.6)' : z.zone === 'air' ? 'rgba(225, 250, 255, 0.7)'
      : z.zone === 'camp' ? 'rgba(255, 150, 60, 0.85)' : z.zone === 'pen' ? 'rgba(240, 215, 120, 0.85)' : 'rgba(140, 100, 60, 0.6)';
    mctx.beginPath();
    mctx.arc(m.x, m.y, Math.max(2, z.r * k * 0.85), 0, TAU);
    mctx.fill();
  }
  mctx.fillStyle = 'rgba(80, 200, 110, 0.45)';
  for (const a of hides) {
    const m = toM(a.x, a.y);
    mctx.beginPath();
    mctx.arc(m.x, m.y, Math.max(2, a.r * k), 0, TAU);
    mctx.fill();
  }
  const wanted = CH.missions.filter((mm) => mm.type === 'eat' && !missionInfo(mm).done).map((mm) => mm.species);
  const vr = stats.vision > 1 || stats.radar ? range : visionR();
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
    } else if ((c.sp.kind === 'stray' && game.packN < PACK_MAX) || (CH.pack && c.sp.hp)) {
      mctx.fillStyle = '#FFD24A';
      mctx.beginPath();
      mctx.arc(m.x, m.y, 3, 0, TAU);
      mctx.fill();
    } else if (c.sp.kind === 'human' || c.sp.kind === 'ally' || (c.sp.kind === 'flock' && !c.penned)) {
      // les humains (orange), ta meute (bleu), les moutons à rassembler (blanc)
      mctx.fillStyle = c.sp.kind === 'human' ? '#FFB36B' : c.sp.kind === 'ally' ? '#9EE7FF' : '#FFFFFF';
      mctx.beginPath();
      mctx.arc(m.x, m.y, 2.5, 0, TAU);
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
  const raw = CH.ago[0] + (CH.ago[1] - CH.ago[0]) * missionsProgress();
  const era = raw >= 1 ? Math.round(raw) : Math.round(raw * 1000) / 1000;
  const v = {
    adn: game.adn,
    size: !LV.world.noGrow ? Math.round(growthK() * 100) : CH.pack ? Math.min(100, Math.round((game.packN || 0) / CH.pack * 100)) : -1,
    era,
    shields: `${player.shield}/${stats.shield}`,
    canEvolve: affordable(),
    water: drying() ? Math.round(player.wet * 50) : CH.trust ? Math.round((game.trust || 0) * 50) : -1,
  };
  if (v.adn !== shown.adn) adnEl.textContent = v.adn;
  if (v.size !== shown.size) {
    $('sizeItem').hidden = v.size < 0;
    sizeBar.style.width = `${Math.max(0, v.size)}%`;
    $('packCount').hidden = !CH.pack;
    if (CH.pack) $('packCount').textContent = `${game.packN || 0}/${CH.pack}`;
  }
  if (v.era !== shown.era) eraEl.textContent = phoneMQ.matches ? fmtAgo(era, true) : `il y a ${fmtAgo(era)}`;
  if (v.shields !== shown.shields) {
    shieldItem.hidden = stats.shield === 0;
    shieldsEl.textContent = '🛡️'.repeat(player.shield) + '▫️'.repeat(Math.max(0, stats.shield - player.shield));
  }
  if (v.canEvolve !== shown.canEvolve) evoBtn.classList.toggle('ready', v.canEvolve);
  if (v.water !== shown.water) {
    waterItem.hidden = v.water < 0;
    waterBar.style.width = `${Math.max(0, v.water) * 2}%`;
    waterItem.classList.toggle('low', drying() && v.water >= 0 && v.water < 15);
    waterItem.classList.toggle('trust', !!CH.trust);
  }
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
  if (mustRotate()) return;        // téléphone tenu debout : tout est en pause
  if (state === 'dino') return;    // le niveau en 3D a sa propre boucle (dino3d/jeu.js)
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
  if (player) {
    renderDashBtn();
    renderBarkBtn();
    renderStrikeBtn();
  }
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
  // (au niveau 2, on garde la partie même si on a quitté pendant l'animation de départ)
  const hasSave = saved && (saved.started || saved.level > 0);
  game = hasSave ? saved : null;
  if (!game) newGame();
  setupGame();
  rememberProgress();
  const choice = game.finished && LV.ending.choices.find((c) => c.id === game.path);
  const next = nextLevel(choice);
  mapHere = next >= 0 ? next : game.level;
  mapSel = LEVELS[mapHere].id;
  renderMap();
  renderStartInfo();
  state = 'ready';
  startOverlay.hidden = false;
  setTimeout(() => $('startBtn').focus({ preventScroll: true }), 50);
}

/** Le texte et les boutons de l'écran de départ, pour le niveau choisi sur la carte */
function renderStartInfo() {
  const n = evoMap().nodes.get(mapSel);
  const startBtn = $('startBtn'), newBtn = $('newGameBtn');
  $('howTo').hidden = true;
  $('startGoal').hidden = false;
  $('startDone').hidden = false;
  startBtn.hidden = false;
  if (n.idx === mapHere) {
    // le niveau où l'on en est : comme avant la carte
    const hasSave = game.started;
    const done = game.finished;
    const choice = done && LV.ending.choices.find((c) => c.id === game.path);
    const next = nextLevel(choice);
    const shown = next >= 0 ? next : game.level;
    $('startLevel').textContent = `Niveau ${levelNum(shown)} — ${LEVELS[shown].name}`;
    $('startGoal').innerHTML = LV.goal;
    startBtn.textContent = done
      ? (next >= 0 ? `${LEVELS[next].icon} Niveau ${levelNum(next)} : ${LEVELS[next].name}` : '🎬 Revoir la fin')
      : hasSave ? `${LV.icon} Continuer (chapitre ${game.chapter + 1})` : `${LV.icon} Plonger !`;
    newBtn.textContent = done ? '🔁 Recommencer au début' : '🆕 Nouvelle partie';
    newBtn.hidden = !hasSave;
    $('startDone').innerHTML = choice
      ? `🏆 Bravo ! ${escapeHtml(LV.ending.done)}, puis tu as choisi : <b>${choice.icon} ${escapeHtml(choice.title)}</b>.<br>`
        + (next >= 0 ? `Le niveau ${levelNum(next)} t'attend !` : `${escapeHtml(choice.soon)} : bientôt !`)
      : '';
    $('startDone').hidden = !done;
    $('startGoal').hidden = done;
    $('howTo').hidden = done || !!LV.world.noGrow;
    howToFirst.innerHTML = terre.on() ? HOWTO_LAND : HOWTO_SEA;
    return;
  }
  // un autre niveau de la carte
  const st = mapState(n);
  const lv = LEVELS[n.idx];
  const paused = progress.paused[n.id];
  const keep = game.started && !game.finished
    ? `<br>💾 Ta partie du niveau&nbsp;${levelNum(game.level)} reste sauvegardée.` : '';
  $('startLevel').textContent = `Niveau ${n.num} — ${n.name}`;
  $('startGoal').innerHTML = lv ? lv.goal : escapeHtml(n.soon.text);
  newBtn.hidden = true;
  if (st === 'soon') {
    $('startDone').innerHTML = "🚧 Ce niveau n'existe pas encore&nbsp;: il arrive bientôt&nbsp;!";
    startBtn.hidden = true;
  } else if (st === 'locked') {
    const p = n.parents[0], from = evoMap().nodes.get(p.id);
    $('startDone').innerHTML = `🔒 Pour l'ouvrir, termine le niveau&nbsp;${from.num} «&nbsp;${escapeHtml(from.name)}&nbsp;», puis choisis <b>${p.choice.icon} ${escapeHtml(p.choice.title)}</b>.`;
    startBtn.hidden = true;
  } else if (paused) {
    $('startDone').innerHTML = `💾 Ta partie t'attend au chapitre&nbsp;${paused.chapter + 1}.${keep}`;
    startBtn.textContent = `${lv.icon} Reprendre (chapitre ${paused.chapter + 1})`;
    newBtn.textContent = '🆕 Recommencer ce niveau';
    newBtn.hidden = false;
  } else if (st === 'done') {
    $('startDone').innerHTML = `✅ Tu as déjà terminé ce niveau&nbsp;: tu peux le rejouer&nbsp;!${keep}`;
    startBtn.textContent = '🔁 Rejouer ce niveau';
  } else {
    $('startDone').innerHTML = `🔓 Ce niveau est ouvert&nbsp;: à toi de jouer&nbsp;!${keep}`;
    startBtn.textContent = `${lv.icon} Jouer !`;
  }
}

function startGame() {
  if (state !== 'ready') return;
  const n = evoMap().nodes.get(mapSel);
  if (n.idx !== mapHere) {
    // un autre niveau, choisi sur la carte
    const st = mapState(n);
    if (st === 'soon' || st === 'locked') return;
    startOverlay.hidden = true;
    enterFullscreen();
    enterLevel(n.idx);
    return;
  }
  startOverlay.hidden = true;
  enterFullscreen();
  if (game.finished) {
    const next = nextLevel(LV.ending.choices.find((c) => c.id === game.path));
    if (next >= 0) enterLevel(next); else startEnding();
    return;
  }
  if (!game.started) { playIntro(); return; }
  beginPlay();
}

/* ---------- La carte de l'évolution (écran de départ) ----------
   Elle se construit toute seule à partir des choix de fin des niveaux : une
   colonne par numéro de niveau, une case par niveau (ou par niveau « bientôt »).
   Un niveau terminé (✅) peut être rejoué ; ceux où il mène sont ouverts. */
let mapHere = 0;                     // le niveau où l'on en est
let mapSel = null;                   // l'id du niveau choisi sur la carte
let mapCache = null;

function evoMap() {
  if (mapCache) return mapCache;
  const nodes = new Map();
  const root = { id: LEVELS[0].id, idx: 0, depth: 0, parents: [], kids: [] };
  nodes.set(root.id, root);
  const queue = [root];
  while (queue.length) {
    const n = queue.shift();
    for (const c of LEVELS[n.idx].ending.choices) {
      let k = nodes.get(c.level);
      if (!k) {
        k = { id: c.level, idx: LEVELS.findIndex((lv) => lv.id === c.level), depth: n.depth + 1, parents: [], kids: [], soon: c };
        nodes.set(k.id, k);
        if (k.idx >= 0) queue.push(k);
      }
      k.parents.push({ id: n.id, choice: c });
      if (!n.kids.includes(k.id)) n.kids.push(k.id);
    }
  }
  for (const n of nodes.values()) {
    if (n.idx >= 0) {
      Object.assign(n, { name: LEVELS[n.idx].name, icon: LEVELS[n.idx].mapIcon || LEVELS[n.idx].icon, num: levelNum(n.idx) });
    } else {
      // « Niveau 3 : La voie des airs »
      const m = n.soon.soon.match(/(\d+)\s*:\s*(.+)/);
      Object.assign(n, { name: m ? m[2] : n.soon.title, icon: n.soon.icon, num: m ? Number(m[1]) : n.depth + 1 });
    }
  }
  // les lignes : chaque feuille a la sienne, un parent se met au milieu de ses enfants.
  // Un niveau où mènent deux chemins se place au bord, du côté de son autre parent.
  let leaf = 0;
  const place = (n) => {
    const kids = n.kids.map((id) => nodes.get(id)).filter((k) => k.depth === n.depth + 1);
    const shared = (k) => (k.parents.length > 1 && k.row === undefined ? 1 : 0);
    kids.sort((a, b) => shared(a) - shared(b));
    for (const k of kids) if (k.row === undefined) place(k);
    n.row = kids.length ? kids.reduce((s, k) => s + k.row, 0) / kids.length : leaf++;
  };
  place(root);
  const all = [...nodes.values()];
  mapCache = { nodes, rows: Math.max(1, leaf), cols: Math.max(...all.map((n) => n.depth)) + 1 };
  return mapCache;
}

/** soon (pas encore construit), done (terminé), open (on peut y jouer), locked (fermé) */
function mapState(n) {
  if (n.idx < 0) return 'soon';
  if (progress.done[n.id]) return 'done';
  if (n.idx === mapHere || progress.paused[n.id] || n.parents.some((p) => progress.done[p.id])) return 'open';
  return 'locked';
}

/** Les niveaux déjà terminés, retrouvés à partir de la partie (pour les sauvegardes d'avant la carte) */
function rememberProgress() {
  if (game.finished) markDone(LV.id, game.path);
  // on est au niveau 3 : on a forcément terminé un niveau qui y mène
  let n = evoMap().nodes.get(LV.id);
  while (n && n.parents.length && !n.parents.some((p) => progress.done[p.id])) {
    const p = n.parents[0];
    markDone(p.id, p.choice.id);
    n = evoMap().nodes.get(p.id);
  }
}

function renderMap() {
  const { nodes, rows, cols } = evoMap();
  const X = (n) => ((n.depth + 0.5) / cols) * 100;
  const Y = (n) => ((n.row + 0.5) / rows) * 100;
  const all = [...nodes.values()];
  let lines = '';
  for (const n of all) {
    for (const p of n.parents) {
      const a = nodes.get(p.id), mx = X(a) === X(n) ? X(a) + 100 / cols * 0.4 : (X(a) + X(n)) / 2;
      const done = progress.done[p.id];
      const cls = done && done.includes(p.choice.id) ? 'taken' : done ? 'open' : '';
      lines += `<path class="${cls}" d="M${X(a)} ${Y(a)} C${mx} ${Y(a)} ${mx} ${Y(n)} ${X(n)} ${Y(n)}"/>`;
    }
  }
  const heads = Array.from({ length: cols }, (_, d) => {
    const n = all.find((k) => k.depth === d);
    return `<span class="map-col" style="left:${((d + 0.5) / cols) * 100}%">Niveau ${n.num}</span>`;
  }).join('');
  const BADGE = { done: '✅', locked: '🔒', soon: '🚧' };
  const SAY = { done: 'terminé', open: 'ouvert', locked: 'fermé', soon: 'bientôt' };
  const cells = all.map((n) => {
    const st = mapState(n);
    const sel = n.id === mapSel;
    const badge = progress.paused[n.id] && st !== 'done' ? '💾' : BADGE[st];
    const cls = [`map-node is-${st}`, n.idx === mapHere ? 'is-here' : '', sel ? 'is-sel' : ''].join(' ');
    return `<button type="button" class="${cls}" data-node="${n.id}" aria-pressed="${sel}"
        aria-label="Niveau ${n.num} : ${escapeHtml(n.name)} (${SAY[st]})"
        style="left:${X(n)}%; top:calc(var(--head) + (100% - var(--head)) * ${Y(n) / 100})">
        <span class="map-dot">${n.icon}${badge ? `<span class="map-badge">${badge}</span>` : ''}${n.idx === mapHere ? '<span class="map-pin">📍</span>' : ''}</span>
        <span class="map-name">${escapeHtml(n.name)}</span>
      </button>`;
  }).join('');
  const map = $('evoMap');
  map.style.setProperty('--rows', rows);
  map.style.setProperty('--cols', cols);
  map.innerHTML = `${heads}<svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${cells}`;
}

$('evoMap').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-node]');
  if (!btn || state !== 'ready') return;
  mapSel = btn.dataset.node;
  sfx.click();
  renderMap();
  renderStartInfo();
  $('evoMap').querySelector(`[data-node="${mapSel}"]`).focus({ preventScroll: true });
});

/** On part jouer un niveau : la partie en cours est mise de côté, celle de ce niveau reprend */
function enterLevel(i, fresh = false) {
  const id = LEVELS[i].id;
  if (game.started && !game.finished && game.level !== i) {
    saveGame();
    progress.paused[LEVELS[game.level].id] = JSON.parse(JSON.stringify(game));
  }
  const paused = !fresh && progress.paused[id];
  delete progress.paused[id];
  saveProgress();
  if (paused && paused.v === SAVE_VERSION && paused.owned && paused.stats && paused.level === i) {
    if (!LEVELS[i].chapters[paused.chapter]) paused.chapter = 0;
    // les statistiques et les espèces déjà vues sont celles du joueur, pas du niveau
    paused.stats = game.stats;
    paused.seen = { ...paused.seen, ...game.seen };
    endOverlay.hidden = true;
    freeCanvas(endCanvas);
    startOverlay.hidden = true;
    game = paused;
    setupGame();
    beginPlay();
    return;
  }
  goToLevel(i);
}

/* ---------- Le niveau en 3D (LV.engine) : il prend tout l'écran, puis rend la main pour la fin ---------- */
let dino3d = null;
function startEngine3d() {
  state = 'dino';
  game.started = true;
  saveGame();
  const bail = (err) => {
    // pas de 3D sur cet appareil (ou pas de réseau pour la charger) : on ne bloque pas l'enfant
    console.warn('Évolution 3D indisponible', err);
    if (dino3d) { dino3d.stop(); dino3d = null; }
    document.getElementById('dino3d')?.remove();
    document.body.classList.remove('dino-on');
    state = 'playing';
    openDialog(`
      <p class="dlg-title">🦖 Ce niveau est en 3D</p>
      <p class="dlg-say">Il ne peut pas s'afficher ici : ton appareil n'a pas assez de puissance, ou Internet ne répond pas. Tu peux réessayer plus tard, ou passer directement à la fin du niveau.</p>
      <div class="dlg-actions"><button class="primary" data-act="skip">Voir la fin du niveau</button><button class="ghost-btn" data-act="retry">Réessayer</button></div>`, {
      skip: () => { closeDialog(); finishEngine3d(); },
      retry: () => { closeDialog(); startEngine3d(); },
    });
  };
  import('./dino3d/jeu.js').then((m) => {
    if (state !== 'dino') return;
    try {
      dino3d = m.startDinoGame({
        level: LV, game, sfx, debug: DEBUG, isPhone: phoneMQ.matches, ammoSvg: AMMO_SVG,
        isSoundOn, toggleSound: () => { const on = toggleSound(); renderSoundBtn(); return on; },
        buzz, confetti, save: saveGame,
        isPaused: () => !quitOverlay.hidden || !rotateOverlay.hidden,
        onFinish: () => { dino3d = null; finishEngine3d(); },
      });
    } catch (err) { bail(err); }
  }).catch(bail);
}

/** Le niveau en 3D est fini : la météorite (le dessin de la fin) et le choix de la suite */
function finishEngine3d() {
  game.chapter = CHAPTERS.length - 1;
  CH = CHAPTERS[game.chapter];
  if (game.dino && game.dino.diet === 'herbivore') CH = { ...CH, form: 'roi-tricera' };
  setupChapter(false);
  startEnding();
  endT = METEOR_TEXT_AT - 0.3;     // la météorite vient de tomber, en 3D : place au choix de la suite
  for (const k of ['rumble', 'boom', 'sad', 'hope']) endCues.add(k);
}

function beginPlay() {
  if (LV.engine === 'dino3d') { startEngine3d(); return; }
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
  if (LV.intro === 'mer') {
    intro = createSeaIntro({
      sfx,
      drawHero: (c, x, y, r, angle, t, swim) => {
        // la colonne ondule un peu, comme quand on nage
        const spine = makeSpine(x, y, angle, r, 'nothosaure');
        spine.forEach((p, i) => {
          const w = Math.sin(swim * 2 - i * 0.7) * r * 0.08 * (i / spine.length);
          p.x -= Math.sin(angle) * w;
          p.y += Math.cos(angle) * w;
        });
        drawPlayer(c, { x, y, angle, size: r, mouth: 0, mood: t > 10.4 ? 'scared' : 'happy', blink: (t % 3) < 0.12 ? 1 : 0, speed: 0.3, spine }, 'nothosaure', {}, swim);
      },
    });
  } else if (LV.intro === 'mammiferes') {
    intro = createMammalIntro({
      sfx,
      drawHero: (c, x, y, r, angle, t, walk, mood) => drawPlayer(c, { x, y, angle, size: r, mouth: 0, mood, blink: (t % 3) < 0.12 ? 1 : 0, speed: 0.3, walk, spine: null }, 'musaraigne', {}, t),
    });
  } else if (LV.intro === 'requins') {
    intro = createSharkIntro({
      sfx,
      drawHero: (c, x, y, r, t, mood, flashT) => drawPlayer(c, { x, y, angle: -0.1, size: r, mouth: 0, mood, blink: (t % 3) < 0.12 ? 1 : 0, speed: 0.4, flashT, spine: null }, 'requin-lanterne', {}, t),
    });
  } else if (LV.intro === 'loup') {
    intro = createWolfIntro({
      sfx,
      drawHero: (c, x, y, r, t, walk, mood) => drawPlayer(c, { x, y, angle: 0, size: r, mouth: 0, mood, blink: (t % 3) < 0.12 ? 1 : 0, speed: 0.3, walk, spine: null }, 'louveteau', {}, t),
      drawAnimal: (c, look, color, x, y, r, face, t, walk, mouth) => drawCreature(c, { sp: { look, color, belly: '#E8E4DA' }, x, y, angle: face > 0 ? 0 : Math.PI, face, size: r, seed: x % 7, mood: 'calm', mouth, blink: 0, walk, spine: null }, t),
    });
  } else if (LV.intro === 'terre') {
    intro = createLandIntro({
      sfx,
      drawHero: (c, x, y, r, angle, t, walk) => drawPlayer(c, { x, y, angle, size: r, mouth: 0, mood: t > 9.6 ? 'scared' : 'happy', blink: (t % 3) < 0.12 ? 1 : 0, speed: 0.3, walk, spine: makeSpine(x, y, angle, r, 'tetrapode') }, 'tetrapode', {}, t),
    });
  } else {
    intro = createIntro({
      sfx,
      drawCell: (c, x, y, r, t) => drawPlayer(c, { x, y, angle: -0.3, size: r, mouth: 0, mood: 'happy', blink: (t % 3) < 0.12 ? 1 : 0, speed: 0.2, spine: null }, 'cellule', {}, t),
      drawCreature: (c, id, x, y, r, angle, t) => drawCreature(c, { sp: SPECIES[id], x, y, angle, size: r, seed: 2, mood: 'angry', mouth: 0.6, blink: 0, spine: makeSpine(x, y, angle, r, SPECIES[id].look) }, t),
    });
  }
  introOverlay.hidden = false;
  sizeCanvas(introCanvas, introOverlay);
  $('introSkip').focus({ preventScroll: true });
}

function endIntro() {
  if (state !== 'intro') return;
  intro = null;
  introOverlay.hidden = true;
  freeCanvas(introCanvas);
  flash = { a: 0.8, color: '255,255,255' };
  beginPlay();
}

$('introSkip').addEventListener('click', (e) => { e.currentTarget.blur(); endIntro(); });

/* ---------- La fin du niveau : le roi de l'océan, puis le grand choix ---------- */
const LAND_END = ['fougeres', 'cycas', 'conifere'];   // le décor de la fin sur la terre
const ICE_END = ['sapin-neige', 'herbes-gel', 'rocher'];  // le décor de la fin à l'âge de glace

function startEnding() {
  state = 'ending';
  endT = 0;
  endCues.clear();
  const crowd = LV.ending.crowd || [];
  const scene = LV.ending.scene;
  endFx = Array.from({ length: scene === 'meteorite' || scene === 'feu' || scene === 'chien' || scene === 'requins' ? 7 : 26 }, (_, i) => ({
    a: (i / 26) * TAU, d: rand(0.6, 1.3), s: rand(0.5, 1), sp: pick(crowd), seed: Math.random() * 10,
    x: rand(0.08, 0.92), y: rand(0.3, 0.92), ang: rand(0, TAU),
  }));
  endDecor = [];
  paintings = null;
  if (scene === 'feu') {
    // le troupeau, à gauche et au milieu (les humains arriveront par la droite)
    endFx.forEach((f, i) => { f.x = rand(0.06, 0.62); f.y = 0.3 + (i / endFx.length) * 0.62; f.ang = rand(-0.4, 0.4) + (i % 2 ? Math.PI : 0); });
  }
  if (scene === 'meteorite' || scene === 'feu') {
    // des plantes (ou des algues et des coraux) tout autour, mais pas sur le roi (au centre)
    const types = scene === 'feu' ? ICE_END : LV.world.ground === 'land' ? LAND_END : ['algues', 'corail', 'eponge'];
    while (endDecor.length < 16) {
      const fx = Math.random(), fy = Math.random();
      if (Math.hypot(fx - 0.45, (fy - 0.6) * 0.6) < 0.2) continue;
      const i = endDecor.length;
      const small = types === LAND_END ? false : types === ICE_END ? i >= 12 : i >= 7;   // dans la mer : de petits coraux et éponges
      endDecor.push({ type: types[i < 7 ? 0 : i < 12 ? 1 : 2], fx, fy, fr: small ? rand(0.025, 0.045) : rand(0.05, 0.1), seed: i * 977 + 13 });
    }
  }
  closeDialog();
  endOverlay.hidden = false;
  endOverlay.classList.remove('show-text', 'chosen');
  sizeCanvas(endCanvas, endOverlay);
  $('endTitle').textContent = LV.ending.title;
  $('endSub').textContent = LV.ending.sub;
  $('endStats').textContent = `🍽️ ${game.stats.eaten} repas · 💨 ${game.stats.escapes} fuites réussies · 😱 croqué ${game.stats.deaths} fois · 🧬 ${game.stats.evolutions} évolutions`;
  $('endChoices').classList.toggle('three', LV.ending.choices.length > 2);
  $('endChoices').innerHTML = LV.ending.choices.map((c) => `
    <button class="choice-card" data-choice="${c.id}">
      <span class="choice-icon">${c.icon}</span>
      <span class="choice-title">${escapeHtml(c.title)}</span>
      <span class="choice-text">${escapeHtml(c.text)}</span>
    </button>`).join('');
  $('endResult').hidden = true;
  if (scene === 'meteorite' || scene === 'feu') {
    sfx.roar(1.2);
    later(() => sfx.victory(), 600);
  } else if (scene === 'chien') {
    sfx.howl();
  } else if (scene === 'requins') {
    sfx.victory();
  } else {
    sfx.victory();
    confetti(120);
  }
}

/** Le numéro d'un niveau, tel qu'on l'affiche (deux niveaux peuvent avoir le même) */
const levelNum = (i) => LEVELS[i].num || i + 1;

/** L'index du niveau où mène un choix de fin (-1 s'il n'existe pas encore) */
function nextLevel(choice) {
  return choice ? LEVELS.findIndex((lv) => lv.id === choice.level) : -1;
}

$('endChoices').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-choice]');
  if (!btn) return;
  const c = LV.ending.choices.find((x) => x.id === btn.dataset.choice);
  game.path = c.id;
  game.finished = true;
  saveGame();
  markDone(LV.id, c.id);
  sfx.chapter();
  confetti(60);
  endOverlay.classList.add('chosen');
  $('endResult').hidden = false;
  $('endResultIcon').textContent = c.icon;
  $('endSoon').textContent = `${c.soon} : bientôt !`;
  $('endFact').textContent = c.fact || '';
  $('endFact').hidden = !c.fact;
  const next = nextLevel(c);
  $('endNext').hidden = next < 0;
  $('endNext').textContent = next >= 0 ? `${LEVELS[next].icon} Niveau ${levelNum(next)} : ${LEVELS[next].name} ▶` : '';
  $('endNext').onclick = () => enterLevel(next);
  $('endSoon').hidden = next >= 0;
  $('endAgain').hidden = game.level === 0;
  setTimeout(() => $('endReplay').focus({ preventScroll: true }), 50);
});

/** On passe au niveau suivant : on garde son ADN et ses statistiques, le reste repart à zéro */
function goToLevel(i) {
  endOverlay.hidden = true;
  freeCanvas(endCanvas);
  game.adn = 0;                      // un nouveau niveau : on repart de zéro
  game.trust = 0;
  game.trustBest = 0;
  startOverlay.hidden = true;
  game.level = i;
  game.chapter = 0;
  game.owned = {};
  game.finished = false;
  game.path = null;
  game.pos = null;
  game.started = false;
  game.tipsSaid = {};
  game.dino = null;
  Object.assign(game, freshChapter());
  game.chapterDone = false;
  setupGame();
  saveGame();
  playIntro();
}

$('endAgain').addEventListener('click', () => goToLevel(game.level));
$('endReplay').addEventListener('click', () => {
  clearSave();
  endOverlay.hidden = true;
  freeCanvas(endCanvas);
  game = null;
  showStartScreen();
});

function drawEnding(dt) {
  if (LV.ending.scene === 'meteorite') { drawMeteorEnding(dt); return; }
  if (LV.ending.scene === 'feu') { drawFireEnding(dt); return; }
  if (LV.ending.scene === 'chien') { drawDogEnding(dt); return; }
  if (LV.ending.scene === 'requins') { drawSharkEnding(dt); return; }
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

/* ---------- La fin du niveau 2 : on domine la Terre (ou la mer)… puis la météorite ----------
   0 → 4 s       le joueur, couronné, rugit au milieu des herbivores (ou des proies de la mer)
   4,2 → 7,3 s   le ciel rougit, une boule de feu traverse le ciel
   7,3 s         impact : flash, onde de choc, pluie de débris, cendres
   8 → 11 s      les grands dinosaures disparaissent
   11,8 → 15 s   les survivants : un petit oiseau, un petit mammifère, un crocodile
                 (dans la mer : un requin et une tortue de mer)
   15 s →        le texte et les trois chemins */
const METEOR_TEXT_AT = 15;
const IMPACT = 7.3;
const ASH = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2.5, v: 0.02 + Math.random() * 0.05 }));
const DEBRIS = Array.from({ length: 12 }, (_, i) => ({ x: 0.1 + Math.random() * 0.8, y: 0.25 + Math.random() * 0.7, at: IMPACT + 0.3 + i * 0.28 }));
const FIRES = Array.from({ length: 7 }, () => ({ x: 0.1 + Math.random() * 0.85, y: 0.2 + Math.random() * 0.75, s: 0.5 + Math.random() }));

function cueEnd(name, at, fn) {
  if (endT >= at && !endCues.has(name)) { endCues.add(name); fn(); }
}

function drawMeteorEnding(dt) {
  endT += dt;
  const t = endT;
  cueEnd('rumble', 4.2, () => sfx.rumble());
  cueEnd('boom', IMPACT, () => { sfx.boom(); buzz([200, 100, 300]); });
  cueEnd('sad', 9, () => sfx.sad());
  cueEnd('hope', 12.2, () => sfx.evolve());
  if (t > METEOR_TEXT_AT && !endOverlay.classList.contains('show-text')) endOverlay.classList.add('show-text');
  const w = endCanvas.width / dpr, h = endCanvas.height / dpr;
  const c = ectx;
  const m = Math.min(w, h);
  const quake = t > IMPACT && t < IMPACT + 2.5 ? (1 - (t - IMPACT) / 2.5) * 16 : t > 4.2 && t < IMPACT ? (t - 4.2) * 1.5 : 0;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.save();
  c.translate((Math.random() - 0.5) * quake, (Math.random() - 0.5) * quake);

  // le sol, une mare, des fougères et des arbres (ou le fond de la mer, ses algues et ses coraux)
  const sea = LV.world.ground !== 'land';
  const T = 420;
  for (let x = -T; x < w + T; x += T) for (let y = -T; y < h + T; y += T) c.drawImage(floorTile, x, y, T + 1, T + 1);
  if (sea) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.08 * (1 - clamp((t - IMPACT) / 2, 0, 0.8));
    const S = 540;
    const o = (t * 14) % S;
    for (let x = -S + o; x < w + S; x += S) for (let y = -S + o * 0.5; y < h + S; y += S) c.drawImage(caustics, x, y, S + 1, S + 1);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  const pond = sea ? null : { type: 'mare', zone: 'water', x: w * 0.8, y: h * 0.8, r: m * 0.14, seed: 4242 };
  if (pond) drawDecor(c, pond, t);
  for (const d of endDecor) {
    d.x = d.fx * w;
    d.y = d.fy * h;
    d.r = d.fr * m;
    drawDecor(c, d, t);
  }

  // les grands dinosaures : ils broutent… puis fuient et disparaissent
  const dying = clamp((t - IMPACT - 0.5) / 2.8, 0, 1);
  for (const f of endFx) {
    const sp = SPECIES[f.sp];
    if (!sp) continue;
    if (t > IMPACT) {
      f.ang = turnToward(f.ang, Math.atan2(f.y - 0.3, f.x - 0.85), dt * 4);
      f.x += Math.cos(f.ang) * dt * 0.09;
      f.y += Math.sin(f.ang) * dt * 0.09;
    } else {
      f.ang += Math.sin(t * 0.7 + f.seed) * dt * 0.4;
      f.x += Math.cos(f.ang) * dt * 0.008;
      f.y += Math.sin(f.ang) * dt * 0.008;
    }
    const x = f.x * w, y = f.y * h, r = m * 0.04 * (0.8 + f.s * 0.4);
    c.globalAlpha = 1 - dying;
    drawCreature(c, { sp, x, y, angle: f.ang, size: r, seed: f.seed, mood: t > IMPACT ? 'scared' : 'calm', mouth: 0, blink: 0, walk: t * (t > IMPACT ? 5 : 1), spine: makeSpine(x, y, f.ang, r, sp.look) }, t + f.seed);
  }
  // toi, le roi… qui disparaît aussi
  const size = m * 0.085;
  const px = w * 0.45, py = h * 0.6;
  const a = t > IMPACT ? -0.5 : Math.sin(t * 0.7) * 0.25 - 0.2;
  const roaring = t < 1.8 || (t > 3 && t < 3.6);
  drawPlayer(c, { x: px, y: py, angle: a, size, mouth: roaring ? 0.9 : 0.15, mood: t > IMPACT ? 'scared' : 'happy', blink: 0, speed: 0.3, walk: t, spine: makeSpine(px, py, a, size, formLook()) }, CH.form, game.owned, t);
  // la couronne tombe au moment de l'impact
  const fall = t > IMPACT ? Math.min(1, (t - IMPACT) / 1.2) : 0;
  c.globalAlpha = Math.max(0, 1 - clamp((t - IMPACT - 1.5) / 1.5, 0, 1));
  drawCrown(c, px + Math.cos(a) * size * 0.2 + fall * size, py - size * 1.2 + fall * size * 1.6, size * 0.6);
  c.globalAlpha = 1;
  for (const d of endDecor) if (['fougeres', 'conifere', 'algues'].includes(d.type)) drawCover(c, d, t);

  // pluie de débris en feu
  for (const db of DEBRIS) {
    if (t < db.at - 0.6 || t > db.at + 0.8) continue;
    const x = db.x * w, y = db.y * h;
    if (t < db.at) {
      const k = 1 - (db.at - t) / 0.6;
      c.fillStyle = `rgba(0, 0, 0, ${0.35 * k})`;
      c.beginPath();
      c.arc(x, y, m * 0.02 * k, 0, TAU);
      c.fill();
    } else {
      const k = (t - db.at) / 0.8;
      const g = c.createRadialGradient(x, y, 0, x, y, m * 0.08 * (0.4 + k));
      g.addColorStop(0, `rgba(255, 230, 150, ${1 - k})`);
      g.addColorStop(0.5, `rgba(255, 120, 40, ${0.7 * (1 - k)})`);
      g.addColorStop(1, 'rgba(255, 60, 20, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, m * 0.08 * (0.4 + k), 0, TAU);
      c.fill();
    }
  }
  // incendies (sur la terre)
  if (!sea && t > IMPACT + 0.5) {
    const k = clamp((t - IMPACT - 0.5) / 1.5, 0, 1) * (1 - clamp((t - 11.5) / 2, 0, 1) * 0.7);
    for (const f of FIRES) {
      const fl = 0.75 + Math.sin(t * 9 + f.x * 20) * 0.25;
      const x = f.x * w, y = f.y * h, r = m * 0.05 * f.s * fl;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255, 200, 80, ${0.8 * k})`);
      g.addColorStop(1, 'rgba(255, 80, 20, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
  }
  // les survivants
  if (t > 11.8) {
    if (sea) drawSeaSurvivors(c, w, h, m, t);
    else drawSurvivors(c, w, h, m, t, pond);
  }
  c.restore();

  // le ciel rougit, puis tout devient gris de cendres
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const dusk = clamp((t - 4.2) / 3, 0, 1);
  const ash = clamp((t - IMPACT) / 2, 0, 1);
  const hope = clamp((t - 12) / 3, 0, 1);
  if (dusk > 0) {
    c.fillStyle = `rgba(140, 40, 20, ${0.35 * dusk * (1 - ash)})`;
    c.fillRect(0, 0, w, h);
  }
  if (ash > 0) {
    c.fillStyle = `rgba(55, 55, 60, ${0.55 * ash * (1 - hope * 0.6)})`;
    c.fillRect(0, 0, w, h);
  }
  // la boule de feu
  if (t > 4.2 && t < IMPACT) {
    const k = (t - 4.2) / (IMPACT - 4.2);
    const e = k * k;
    const x = -0.1 * w + (0.95 * w) * e, y = 0.2 * h + 0.1 * h * e;
    const r = m * (0.012 + 0.07 * e);
    c.strokeStyle = 'rgba(255, 170, 60, 0.6)';
    c.lineCap = 'round';
    c.lineWidth = r * 1.2;
    c.beginPath();
    c.moveTo(x - r * 8, y - r * 0.8);
    c.lineTo(x, y);
    c.stroke();
    const g = c.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, 'rgba(255, 255, 220, 1)');
    g.addColorStop(0.25, 'rgba(255, 190, 80, 0.9)');
    g.addColorStop(1, 'rgba(255, 80, 20, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r * 4, 0, TAU);
    c.fill();
  }
  // l'impact : un éclair blanc, puis l'onde de choc
  if (t > IMPACT) {
    const k = t - IMPACT;
    if (k < 1.4) {
      c.fillStyle = `rgba(255, 250, 235, ${1 - k / 1.4})`;
      c.fillRect(0, 0, w, h);
    }
    if (k < 3) {
      c.strokeStyle = `rgba(255, 220, 170, ${0.7 * (1 - k / 3)})`;
      c.lineWidth = m * 0.03 * (1 - k / 3) + 2;
      c.beginPath();
      c.arc(w * 0.85, h * 0.3, k * Math.hypot(w, h) * 0.45, 0, TAU);
      c.stroke();
    }
    // les cendres qui tombent
    c.fillStyle = 'rgba(200, 200, 200, 0.7)';
    for (const f of ASH) {
      const y = ((f.y + (t - IMPACT) * f.v) % 1) * h;
      const x = (f.x * w + Math.sin(t + f.x * 10) * 12) % w;
      c.globalAlpha = Math.min(1, k) * (1 - hope * 0.7);
      c.beginPath();
      c.arc(x, y, f.s, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  const cap = LV.ending.captions.find(([a0, b0]) => t >= a0 && t < b0);
  if (cap && t < METEOR_TEXT_AT) drawCaptionBox(c, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}

/* ---------- La fin du niveau 3 : on règne sur l'âge de glace… puis les humains arrivent ----------
   0 → 4 s       le joueur, couronné, rugit au milieu des mammouths et des bisons
   4,2 → 7,6 s   la nuit tombe ; une lueur orange brille au loin
   7,6 → 11,6 s  des humains arrivent avec leurs torches et allument un feu : tout le monde recule
   11,8 → 15 s   le mur d'une grotte, éclairé par une torche : les animaux peints, des mains
   15 s →        le texte et les deux chemins */
const FIRE_TEXT_AT = 15;
const CAVE_AT = 11.8;
const SNOWFLAKES = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2.2, v: 0.03 + Math.random() * 0.05 }));
const HUMANS = [{ y: 0.5, d: 0, k: 1 }, { y: 0.64, d: 0.45, k: 0.9 }, { y: 0.8, d: 0.9, k: 1.05 }];
/* Les peintures de la grotte : [espèce, x, y, taille, couleur, apparition, tournée vers la gauche] */
const PAINTINGS = [
  ['mammouth', 0.3, 0.42, 0.085, '#8E2F1C', 12.2, false],
  ['cheval', 0.7, 0.32, 0.06, '#2A1C14', 12.8, true],
  ['bison', 0.7, 0.72, 0.065, '#A13D22', 13.3, true],
  ['lion-des-cavernes', 0.3, 0.8, 0.05, '#2A1C14', 13.8, false],
];
const HANDS = [[0.1, 0.25, 12.5, '#A33A22'], [0.9, 0.55, 13.1, '#2A1C14'], [0.53, 0.88, 13.6, '#A33A22']];
const WALL = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), r: 0.02 + Math.random() * 0.06, l: Math.random() < 0.5 }));
let paintings = null;              // les peintures, dessinées une fois dans de petites toiles

/** Une flamme qui danse (avec sa lueur) */
function drawFlame(c, x, y, s, t) {
  const f = 0.85 + Math.sin(t * 14 + x * 0.1) * 0.15;
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, s * 7);
  g.addColorStop(0, 'rgba(255, 170, 60, 0.45)');
  g.addColorStop(1, 'rgba(255, 120, 30, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, s * 7, 0, TAU);
  c.fill();
  c.globalCompositeOperation = 'source-over';
  for (const [k, col] of [[1, '#FF7A1A'], [0.6, '#FFD45A']]) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - s * 0.55 * k, y);
    c.quadraticCurveTo(x - s * 0.5 * k, y - s * 0.9 * k * f, x + Math.sin(t * 9) * s * 0.15, y - s * 1.7 * k * f);
    c.quadraticCurveTo(x + s * 0.5 * k, y - s * 0.9 * k * f, x + s * 0.55 * k, y);
    c.arc(x, y, s * 0.55 * k, 0, Math.PI);
    c.fill();
  }
}

/** Un humain de l'âge de glace, à contre-jour, une torche à la main */
function drawHuman(c, x, y, s, t) {
  const step = Math.sin(t * 6);
  c.fillStyle = '#1C1411';
  c.strokeStyle = '#1C1411';
  c.lineCap = 'round';
  c.lineWidth = s * 0.17;
  c.beginPath();
  c.moveTo(x, y - s * 0.9);
  c.lineTo(x + step * s * 0.25, y);
  c.moveTo(x, y - s * 0.9);
  c.lineTo(x - step * s * 0.25, y);
  c.stroke();
  // une tunique en fourrure
  c.beginPath();
  c.moveTo(x - s * 0.26, y - s * 0.8);
  c.lineTo(x + s * 0.26, y - s * 0.8);
  c.lineTo(x + s * 0.17, y - s * 1.7);
  c.lineTo(x - s * 0.17, y - s * 1.7);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(x, y - s * 1.92, s * 0.21, 0, TAU);
  c.fill();
  // un bras levé tient la torche, l'autre une lance
  c.lineWidth = s * 0.12;
  c.beginPath();
  c.moveTo(x - s * 0.08, y - s * 1.6);
  c.lineTo(x - s * 0.38, y - s * 2.05);
  c.moveTo(x + s * 0.08, y - s * 1.6);
  c.lineTo(x + s * 0.3, y - s * 1.15);
  c.stroke();
  c.lineWidth = s * 0.05;
  c.beginPath();
  c.moveTo(x + s * 0.45, y - s * 0.3);
  c.lineTo(x + s * 0.15, y - s * 2.5);
  c.stroke();
  c.strokeStyle = '#5A3A20';
  c.lineWidth = s * 0.08;
  c.beginPath();
  c.moveTo(x - s * 0.34, y - s * 1.98);
  c.lineTo(x - s * 0.46, y - s * 2.4);
  c.stroke();
  drawFlame(c, x - s * 0.47, y - s * 2.42, s * 0.2, t + x);
}

/** Les peintures et les mains de la grotte, préparées une fois (couleur unie, comme de l'ocre) */
function buildPaintings(m) {
  const out = [];
  for (const [id, , , k, col, , left] of PAINTINGS) {
    const sp = SPECIES[id];
    const r = m * k;
    const W = Math.ceil(r * 4.4), H = Math.ceil(r * 4.4);
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const g = cv.getContext('2d');
    if (sp) drawCreature(g, { sp, x: W * 0.47, y: H * 0.6, angle: left ? Math.PI : 0, face: left ? -1 : 1, size: r, seed: 1, mood: 'calm', mouth: 0, blink: 0, walk: 0.6, spine: null }, 0.3);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = col;
    g.fillRect(0, 0, W, H);
    out.push(cv);
  }
  for (const [, , , col] of HANDS) {
    // une main « en négatif » : on souffle la couleur autour de la main posée sur la paroi
    const R = Math.ceil(m * 0.07);
    const cv = document.createElement('canvas');
    cv.width = cv.height = R * 2;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(R, R, R * 0.2, R, R, R);
    grd.addColorStop(0, col);
    grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grd;
    g.globalAlpha = 0.75;
    g.fillRect(0, 0, R * 2, R * 2);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.ellipse(R, R * 1.15, R * 0.3, R * 0.34, 0, 0, TAU);
    g.fill();
    g.lineCap = 'round';
    g.lineWidth = R * 0.13;
    g.beginPath();
    for (const [a, l] of [[-2.4, 0.45], [-1.85, 0.6], [-1.57, 0.66], [-1.3, 0.6], [-1.05, 0.48]]) {
      g.moveTo(R + Math.cos(a) * R * 0.2, R * 1.1 + Math.sin(a) * R * 0.2);
      g.lineTo(R + Math.cos(a) * R * l * 1.25, R * 1.1 + Math.sin(a) * R * l * 1.25);
    }
    g.stroke();
    out.push(cv);
  }
  return out;
}

function drawFireEnding(dt) {
  endT += dt;
  const t = endT;
  cueEnd('night', 4.2, () => sfx.sad());
  cueEnd('steps', 7.6, () => sfx.alert());
  cueEnd('fire', 8.4, () => sfx.dash());
  cueEnd('h1', 9.2, () => sfx.heart(false));
  cueEnd('h2', 9.9, () => sfx.heart(true));
  cueEnd('cave', CAVE_AT + 0.3, () => sfx.evolve());
  if (t > FIRE_TEXT_AT && !endOverlay.classList.contains('show-text')) endOverlay.classList.add('show-text');
  const w = endCanvas.width / dpr, h = endCanvas.height / dpr;
  const c = ectx;
  const m = Math.min(w, h);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (t < CAVE_AT) {
    // la steppe enneigée, ses sapins, et le troupeau
    const T = 420;
    for (let x = 0; x < w + T; x += T) for (let y = 0; y < h + T; y += T) c.drawImage(floorTile, x, y, T + 1, T + 1);
    for (const d of endDecor) {
      d.x = d.fx * w;
      d.y = d.fy * h;
      d.r = d.fr * m;
      drawDecor(c, d, t);
    }
    const fire = { x: w * 0.84, y: h * 0.62 };
    const scare = t > 7.6;
    for (const f of endFx) {
      const sp = SPECIES[f.sp];
      if (!sp) continue;
      if (scare) {
        // tout le monde s'éloigne du feu
        f.ang = turnToward(f.ang, Math.PI + Math.sin(f.seed) * 0.3, dt * 3);
        f.x += Math.cos(f.ang) * dt * 0.07;
        f.y += Math.sin(f.ang) * dt * 0.07;
      } else {
        f.ang += Math.sin(t * 0.7 + f.seed) * dt * 0.3;
        f.x += Math.cos(f.ang) * dt * 0.01;
        f.y += Math.sin(f.ang) * dt * 0.006;
      }
      const x = f.x * w, y = f.y * h, r = m * 0.04 * (0.8 + f.s * 0.4);
      drawCreature(c, { sp, x, y, angle: f.ang, size: r, seed: f.seed, mood: scare ? 'scared' : 'calm', mouth: 0, blink: 0, walk: t * (scare ? 4 : 1) + f.seed, spine: null }, t + f.seed);
    }
    // toi, le roi de l'âge de glace… qui recule devant le feu
    const size = m * 0.07;
    const back = scare ? Math.min(1, (t - 7.6) / 3) : 0;
    const px = w * (0.5 - back * 0.14), py = h * 0.6;
    const roaring = t < 1.8 || (t > 3 && t < 3.6);
    drawPlayer(c, { x: px, y: py, angle: 0, size, mouth: roaring ? 0.9 : 0.15, mood: scare ? 'scared' : 'happy', blink: 0, speed: 0.3, walk: t * (scare ? 2 : 0.6), spine: null }, CH.form, game.owned, t);
    const fall = t > 8.6 ? Math.min(1, (t - 8.6) / 1) : 0;
    c.globalAlpha = 1 - clamp((t - 9.8) / 1, 0, 1);
    drawCrown(c, px + size * 0.9 - fall * size * 0.6, py - size * 1.35 + fall * size * 1.9, size * 0.55);
    c.globalAlpha = 1;
    for (const d of endDecor) if (d.type !== 'rocher') drawCover(c, d, t);
    // la nuit tombe
    const night = clamp((t - 4.2) / 2.5, 0, 1);
    if (night > 0) {
      c.fillStyle = `rgba(8, 16, 45, ${0.6 * night})`;
      c.fillRect(0, 0, w, h);
    }
    // une lueur au loin… puis les humains, leurs torches et leur feu
    if (t > 5.4) {
      const k = clamp((t - 5.4) / 2, 0, 1);
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(w * 1.02, fire.y, 0, w * 1.02, fire.y, m * 0.45);
      g.addColorStop(0, `rgba(255, 150, 50, ${0.35 * k})`);
      g.addColorStop(1, 'rgba(255, 120, 30, 0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'source-over';
    }
    if (t > 8.4) {
      const k = clamp((t - 8.4) / 0.6, 0, 1);
      c.strokeStyle = '#4A2E18';
      c.lineCap = 'round';
      c.lineWidth = m * 0.016;
      c.beginPath();
      c.moveTo(fire.x - m * 0.04, fire.y + m * 0.01);
      c.lineTo(fire.x + m * 0.04, fire.y - m * 0.01);
      c.moveTo(fire.x - m * 0.04, fire.y - m * 0.01);
      c.lineTo(fire.x + m * 0.04, fire.y + m * 0.01);
      c.stroke();
      drawFlame(c, fire.x, fire.y, m * 0.035 * k, t);
      // des étincelles qui montent
      c.fillStyle = 'rgba(255, 210, 120, 0.9)';
      for (let i = 0; i < 8; i++) {
        const u = (t * 0.6 + i / 8) % 1;
        c.globalAlpha = (1 - u) * k;
        c.beginPath();
        c.arc(fire.x + Math.sin(i * 2.3 + t * 2) * m * 0.03, fire.y - u * m * 0.22, 1.5, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
    }
    if (t > 7) {
      for (const hm of HUMANS) {
        const k = clamp((t - 7 - hm.d) / 2.6, 0, 1);
        const x = w * (1.1 - 0.2 * (k * k * (3 - 2 * k))) + hm.d * m * 0.06;
        drawHuman(c, x, h * hm.y, m * 0.055 * hm.k, k < 1 ? t : 0);
      }
    }
    // il neige
    c.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const f of SNOWFLAKES) {
      const y = ((f.y + t * f.v) % 1) * h;
      const x = (f.x * w + Math.sin(t + f.x * 10) * 14) % w;
      c.beginPath();
      c.arc(x, y, f.s, 0, TAU);
      c.fill();
    }
    if (t > CAVE_AT - 0.6) {
      c.fillStyle = `rgba(0, 0, 0, ${(t - (CAVE_AT - 0.6)) / 0.6})`;
      c.fillRect(0, 0, w, h);
    }
  } else {
    // le mur de la grotte, éclairé par une torche qui vacille
    if (!paintings) paintings = buildPaintings(m);
    const flick = 0.92 + Math.sin(t * 11) * 0.04 + Math.sin(t * 17) * 0.03;
    const lx = w * 0.5, ly = h * 0.55;
    const g = c.createRadialGradient(lx, ly, m * 0.05, lx, ly, Math.hypot(w, h) * 0.6 * flick);
    g.addColorStop(0, '#D9B48A');
    g.addColorStop(0.6, '#A57E58');
    g.addColorStop(1, '#4A3324');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    for (const b of WALL) {
      c.fillStyle = b.l ? 'rgba(255, 240, 210, 0.07)' : 'rgba(60, 35, 20, 0.08)';
      c.beginPath();
      c.ellipse(b.x * w, b.y * h, b.r * m * 1.6, b.r * m, b.x * 3, 0, TAU);
      c.fill();
    }
    // les animaux peints apparaissent un à un, éclairés par la torche
    PAINTINGS.forEach(([, x, y, , , at], i) => {
      const k = clamp((t - at) / 0.8, 0, 1);
      if (k <= 0) return;
      const cv = paintings[i];
      c.globalAlpha = 0.82 * k;
      c.drawImage(cv, x * w - cv.width * 0.47, y * h - cv.height * 0.6);
    });
    HANDS.forEach(([x, y, at], i) => {
      const k = clamp((t - at) / 0.5, 0, 1);
      if (k <= 0) return;
      const cv = paintings[PAINTINGS.length + i];
      c.globalAlpha = k;
      c.drawImage(cv, x * w - cv.width / 2, y * h - cv.height / 2);
    });
    c.globalAlpha = 1;
    const v = c.createRadialGradient(lx, ly, m * 0.3, lx, ly, Math.hypot(w, h) * 0.62);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, `rgba(20, 10, 5, ${0.6 / flick})`);
    c.fillStyle = v;
    c.fillRect(0, 0, w, h);
    if (t < CAVE_AT + 0.8) {
      c.fillStyle = `rgba(0, 0, 0, ${1 - (t - CAVE_AT) / 0.8})`;
      c.fillRect(0, 0, w, h);
    }
  }
  const cap = LV.ending.captions.find(([a0, b0]) => t >= a0 && t < b0);
  if (cap && t < FIRE_TEXT_AT) drawCaptionBox(c, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}

/* ---------- La fin de la voie des requins : le mégalodon disparaît, ses cousins restent ----------
   0 → 4,6 s    tu règnes sur toutes les mers, entouré de baleines
   4,6 → 9 s    la mer se refroidit, les baleines partent : tu t'éloignes dans le noir
   9 → 14 s     aujourd'hui : le défilé des requins, le grand requin blanc en tête
   14 s →       le texte et le chemin suivant */
const SHARK_TEXT_AT = 14;
const SHARK_PARADE_AT = 9;
const SHARK_PARADE = [
  { look: 'requin-blanc', name: 'Grand requin blanc', color: '#8A98A6', k: 1.25 },
  { look: 'requin-tigre', name: 'Requin-tigre', color: '#8E8A6A', k: 1.05 },
  { look: 'requin-marteau', name: 'Requin-marteau', color: '#7E96A2', k: 0.95 },
  { look: 'requin-renard', name: 'Requin-renard', color: '#6E7EA0', k: 0.8 },
  { look: 'requin-lanterne', name: 'Requin-lanterne', color: '#4A6A78', k: 0.55 },
];

function drawSharkEnding(dt) {
  endT += dt;
  const t = endT;
  cueEnd('cold', 4.6, () => sfx.sad());
  cueEnd('parade', SHARK_PARADE_AT + 0.3, () => { sfx.victory(); confetti(80); });
  if (t > SHARK_TEXT_AT && !endOverlay.classList.contains('show-text')) endOverlay.classList.add('show-text');
  const w = endCanvas.width / dpr, h = endCanvas.height / dpr;
  const c = ectx;
  const m = Math.min(w, h);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const T = 420;
  for (let x = 0; x < w + T; x += T) for (let y = 0; y < h + T; y += T) c.drawImage(floorTile, x, y, T + 1, T + 1);
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.09;
  const S = 540, o = (t * 14) % S;
  for (let x = -S + o; x < w + S; x += S) for (let y = -S + o * 0.5; y < h + S; y += S) c.drawImage(caustics, x, y, S + 1, S + 1);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';

  if (t < SHARK_PARADE_AT) {
    const cold = clamp((t - 4.6) / 3, 0, 1);
    // les baleines autour de toi… elles s'en vont vers le froid
    endFx.forEach((f, i) => {
      const sp = SPECIES[f.sp];
      if (!sp) return;
      const x = (f.x + cold * (f.x < 0.5 ? -0.6 : 0.6)) * w + Math.sin(t * 0.3 + i) * 20, y = f.y * h;
      const left = f.x < 0.5 ? cold > 0 : cold <= 0;
      drawCreature(c, { sp, x, y, angle: left ? Math.PI : 0, size: m * 0.05, seed: f.seed, mood: 'calm', mouth: 0, blink: 0, speed: 0.4, spine: null }, t);
    });
    // toi, le plus grand requin de tous les temps
    const size = m * 0.11;
    const px = w * (0.45 + cold * 0.75), py = h * 0.58 + Math.sin(t * 0.7) * m * 0.02;
    c.globalAlpha = 1 - clamp((t - 7) / 1.6, 0, 1);
    drawPlayer(c, { x: px, y: py, angle: -0.08, size, mouth: t < 1.6 ? 0.9 : 0, mood: 'happy', blink: 0, speed: 0.5, spine: null }, CH.form, game.owned, t);
    c.globalAlpha = 1;
    if (t < 4.6) drawCrown(c, px + size * 0.3, py - size * 1.3, size * 0.5);
    // la mer devient froide et sombre
    if (cold > 0) {
      c.fillStyle = `rgba(190, 215, 235, ${0.28 * cold})`;
      c.fillRect(0, 0, w, h);
      c.fillStyle = `rgba(6, 20, 40, ${0.45 * cold})`;
      c.fillRect(0, 0, w, h);
    }
    if (t > SHARK_PARADE_AT - 0.6) {
      c.fillStyle = `rgba(0, 0, 0, ${(t - (SHARK_PARADE_AT - 0.6)) / 0.6})`;
      c.fillRect(0, 0, w, h);
    }
  } else {
    const u = t - SHARK_PARADE_AT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const base = m * 0.08;
    SHARK_PARADE.forEach((d, i) => {
      const k = clamp((u - i * 0.35) / 1.5, 0, 1);
      if (k <= 0) return;
      const e = 1 - (1 - k) ** 3;
      const size = base * d.k;
      const x = w * (i % 2 ? 0.68 : 0.3) + (1 - e) * w;
      const y = h * (0.34 + i * 0.125) + Math.sin(t * 0.9 + i) * m * 0.01;
      drawCreature(c, { sp: { look: d.look, color: d.color }, x, y, angle: Math.PI, size, seed: i, mood: 'calm', mouth: 0, blink: 0, speed: 0.6, spine: null }, t);
      c.globalAlpha = k;
      c.font = `800 ${Math.max(11, Math.round(m * 0.03))}px 'Baloo 2', sans-serif`;
      c.lineWidth = 4;
      c.strokeStyle = 'rgba(6, 30, 50, 0.85)';
      c.strokeText(d.name, x, y + size * 0.95);
      c.fillStyle = '#FFFFFF';
      c.fillText(d.name, x, y + size * 0.95);
      c.globalAlpha = 1;
    });
    if (u < 0.6) {
      c.fillStyle = `rgba(0, 0, 0, ${1 - u / 0.6})`;
      c.fillRect(0, 0, w, h);
    }
    const dim = clamp((t - SHARK_TEXT_AT + 0.6) / 0.8, 0, 1);
    if (dim > 0) {
      c.fillStyle = `rgba(6, 20, 40, ${0.55 * dim})`;
      c.fillRect(0, 0, w, h);
    }
  }
  const cap = LV.ending.captions.find(([a0, b0]) => t >= a0 && t < b0);
  if (cap && t < SHARK_TEXT_AT) drawCaptionBox(c, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}

/* ---------- La fin du niveau 4 : le chien, meilleur ami de l'humain ----------
   0 → 8,8 s    la nuit, au village : le feu, les humains… et toi, qui viens te
                coucher près d'un enfant
   8,8 → 14 s   le défilé, en plein jour : le loup, puis les chiens d'aujourd'hui
   14 s →       le texte et le chemin suivant */
const DOG_TEXT_AT = 14;
const PARADE_AT = 8.8;
const VILLAGE = { type: 'village', x: 0, y: 0, r: 0, seed: 1, v: 1 };
/* Les humains autour du feu : [x, y, look, couleur, tourné vers la gauche] */
const FOLK = [[0.68, 0.5, 'chasseur', '#6E5238', true], [0.62, 0.74, 'humain', '#8A6A48', true], [0.36, 0.42, 'humain', '#9A7A52', false]];

function drawDogEnding(dt) {
  endT += dt;
  const t = endT;
  cueEnd('wouf', 4.5, () => sfx.bark());
  cueEnd('parade', PARADE_AT + 0.3, () => { sfx.victory(); confetti(80); });
  if (t > DOG_TEXT_AT && !endOverlay.classList.contains('show-text')) endOverlay.classList.add('show-text');
  const w = endCanvas.width / dpr, h = endCanvas.height / dpr;
  const c = ectx;
  const m = Math.min(w, h);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (t < PARADE_AT) {
    // le village, la nuit, autour du feu
    const T = 420;
    for (let x = 0; x < w + T; x += T) for (let y = 0; y < h + T; y += T) c.drawImage(floorTile, x, y, T + 1, T + 1);
    Object.assign(VILLAGE, { x: w * 0.5, y: h * 0.55, r: m * 0.42 });
    drawDecor(c, VILLAGE, t);
    c.fillStyle = 'rgba(8, 16, 45, 0.5)';
    c.fillRect(0, 0, w, h);
    campFire(c, VILLAGE.x, VILLAGE.y, VILLAGE.r * 0.07, t);
    const r = m * 0.075;
    for (const [fx, fy, look, color, left] of FOLK) {
      drawCreature(c, { sp: { look, color }, x: w * fx, y: h * fy, angle: left ? Math.PI : 0, face: left ? -1 : 1, size: r * 0.9, seed: fx * 10, mood: 'happy', state: 'wander', mouth: 0, blink: 0, walk: 0, spine: null }, t);
    }
    // toi : tu arrives… et tu t'arrêtes près de l'enfant
    const k = clamp(t / 3.2, 0, 1);
    const px = w * (-0.1 + 0.46 * (1 - (1 - k) ** 2)), py = h * 0.68;
    if (t > 1.6) {
      const kk = clamp((t - 1.6) / 2.2, 0, 1);
      drawCreature(c, { sp: { look: 'enfant', color: '#B08A5A' }, x: w * (0.62 - 0.1 * kk), y: py + r * 0.05, angle: Math.PI, face: -1, size: r * 0.7, seed: 3, mood: 'happy', state: 'wander', mouth: 0, blink: 0, walk: kk < 1 ? t * 2 : 0, spine: null }, t);
    }
    drawPlayer(c, { x: px, y: py, angle: 0, size: r, mouth: t > 4.4 && t < 4.9 ? 0.8 : 0, mood: 'happy', blink: 0, speed: 0.3, walk: k < 1 ? t * 3 : 0, spine: null }, CH.form, game.owned, t);
    // des cœurs qui montent
    if (t > 5) {
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `${Math.round(r * 0.5)}px 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
      for (let i = 0; i < 5; i++) {
        const u = ((t - 5) * 0.45 + i / 5) % 1;
        c.globalAlpha = Math.min(1, (t - 5) * 2) * (1 - u);
        c.fillText('❤', px + r * 1.2 + Math.sin(i * 2.1 + t * 2) * r * 0.5, py - r * 1.4 - u * r * 2.4);
      }
      c.globalAlpha = 1;
    }
    const v = c.createRadialGradient(w / 2, h * 0.55, m * 0.3, w / 2, h * 0.55, Math.hypot(w, h) * 0.62);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, 'rgba(5, 8, 25, 0.6)');
    c.fillStyle = v;
    c.fillRect(0, 0, w, h);
    if (t > PARADE_AT - 0.6) {
      c.fillStyle = `rgba(255, 255, 255, ${(t - (PARADE_AT - 0.6)) / 0.6})`;
      c.fillRect(0, 0, w, h);
    }
  } else {
    // le défilé : en tête, le loup… puis tous les chiens d'aujourd'hui
    const u = t - PARADE_AT;
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#BFE6F5');
    g.addColorStop(0.4, '#DDF2D0');
    g.addColorStop(1, '#8CC46A');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(205, 175, 115, 0.6)';
    c.fillRect(0, h * 0.62, w, h * 0.14);
    const n = BREED_PARADE.length;
    const base = Math.min(m * 0.07, w / (n * 2.4));
    const gy = h * 0.72;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    BREED_PARADE.forEach((d, i) => {
      const k = clamp((u - i * 0.28) / 1.3, 0, 1);
      if (k <= 0) return;
      const e = 1 - (1 - k) ** 3;
      const size = base * d.k;
      const x = w * (0.07 + 0.86 * i / (n - 1)) + (1 - e) * w * 1.1;
      drawCreature(c, { sp: { look: d.look, color: d.color, belly: d.belly }, x, y: gy - d.ground * size, angle: Math.PI, face: -1, size, seed: i, mood: 'happy', mouth: 0, blink: 0, walk: k < 1 ? u * 4 : 0, spine: null }, t);
      c.globalAlpha = k;
      c.font = `800 ${Math.max(10, Math.round(base * 0.36))}px 'Baloo 2', sans-serif`;
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      const ly = gy + base * (i % 2 ? 0.75 : 0.4);
      c.strokeText(d.name, x, ly);
      c.fillStyle = i === 0 ? '#5E3A12' : '#2E2A4D';
      c.fillText(d.name, x, ly);
      c.globalAlpha = 1;
    });
    if (u < 0.6) {
      c.fillStyle = `rgba(255, 255, 255, ${1 - u / 0.6})`;
      c.fillRect(0, 0, w, h);
    }
    // le ciel s'assombrit sous le texte de la fin (sinon, on ne le lit pas)
    const dim = clamp((t - DOG_TEXT_AT + 0.6) / 0.8, 0, 1);
    if (dim > 0) {
      const v = c.createLinearGradient(0, 0, 0, h * 0.62);
      v.addColorStop(0, `rgba(12, 32, 52, ${0.78 * dim})`);
      v.addColorStop(0.8, `rgba(12, 32, 52, ${0.5 * dim})`);
      v.addColorStop(1, 'rgba(12, 32, 52, 0)');
      c.fillStyle = v;
      c.fillRect(0, 0, w, h * 0.62);
    }
  }
  const cap = LV.ending.captions.find(([a0, b0]) => t >= a0 && t < b0);
  if (cap && t < DOG_TEXT_AT) drawCaptionBox(c, w, h, cap[2], Math.min(1, (t - cap[0]) / 0.4, (cap[1] - t) / 0.3));
}

/** Ceux qui survivent : un petit oiseau, un petit mammifère, un crocodile (les trois chemins) */
function drawSurvivors(c, w, h, m, t, pond) {
  const k = clamp((t - 11.8) / 1.5, 0, 1);
  const glow = (x, y, r) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255, 245, 190, ${0.45 * k})`);
    g.addColorStop(1, 'rgba(255, 245, 190, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  };
  // le crocodile, dans la mare
  const cx = pond.x, cy = pond.y, cr = m * 0.055;
  glow(cx, cy, cr * 4);
  c.globalAlpha = k;
  const croc = { look: 'lezard', color: '#4F7A3A', kind: 'prey', body: { snout: 1.4 } };
  drawCreature(c, { sp: croc, x: cx, y: cy, angle: Math.PI + 0.3, size: cr, seed: 3, mood: 'calm', mouth: 0, blink: 0, walk: t, spine: makeSpine(cx, cy, Math.PI + 0.3, cr, 'lezard') }, t);
  // le petit mammifère, qui sort de son terrier
  const mx = w * 0.22, my = h * 0.72, mr = m * 0.05;
  c.globalAlpha = 1;
  glow(mx, my, mr * 4);
  c.fillStyle = 'rgba(40, 25, 10, 0.8)';
  c.beginPath();
  c.ellipse(mx - mr * 1.2, my + mr * 0.4, mr * 1.4, mr * 0.9, 0, 0, TAU);
  c.fill();
  c.globalAlpha = k;
  const furry = { look: 'lezard', color: '#A0785A', kind: 'prey', body: { fur: true } };
  drawCreature(c, { sp: furry, x: mx, y: my, angle: -0.4, size: mr, seed: 5, mood: 'calm', mouth: 0, blink: (t % 2.5) < 0.12 ? 1 : 0, walk: 0, spine: makeSpine(mx, my, -0.4, mr, 'lezard') }, t);
  // le petit oiseau, qui s'envole
  const bx = w * (0.1 + (t - 11.8) * 0.1), by = h * (0.42 - Math.sin((t - 11.8) * 0.8) * 0.06), br = m * 0.05;
  c.globalAlpha = 1;
  glow(bx, by, br * 4);
  c.globalAlpha = k;
  drawBird(c, bx, by, br, t);
  c.globalAlpha = 1;
}

/** Dans la mer, ceux qui survivent : un requin et une tortue de mer (les deux chemins) */
function drawSeaSurvivors(c, w, h, m, t) {
  const k = clamp((t - 11.8) / 1.5, 0, 1);
  const glow = (x, y, r) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(220, 250, 255, ${0.45 * k})`);
    g.addColorStop(1, 'rgba(220, 250, 255, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  };
  // le requin, qui traverse l'écran
  const sx = w * (0.05 + (t - 11.8) * 0.07), sy = h * 0.4 + Math.sin(t * 0.9) * h * 0.03, sr = m * 0.06;
  const sa = Math.sin(t * 0.9) * 0.15;
  glow(sx, sy, sr * 4);
  c.globalAlpha = k;
  const shark = { look: 'requin', color: '#7D8FA3', kind: 'prey' };
  drawCreature(c, { sp: shark, x: sx, y: sy, angle: sa, size: sr, seed: 2, mood: 'calm', mouth: 0, blink: 0, spine: makeSpine(sx, sy, sa, sr, 'requin') }, t);
  // la tortue de mer, qui nage vers la plage
  const tx = w * 0.72, ty = h * (0.8 - (t - 11.8) * 0.03), tr = m * 0.06;
  c.globalAlpha = 1;
  glow(tx, ty, tr * 4);
  c.globalAlpha = k;
  const turtle = { look: 'tortue', color: '#6F9A5A', kind: 'prey' };
  drawCreature(c, { sp: turtle, x: tx, y: ty, angle: -Math.PI / 2 + 0.3, size: tr, seed: 4, mood: 'calm', mouth: 0, blink: (t % 2.5) < 0.12 ? 1 : 0 }, t);
  c.globalAlpha = 1;
}

/** Un petit oiseau vu de dessus, qui bat des ailes */
function drawBird(c, x, y, r, t) {
  const flap = Math.sin(t * 12) * 0.5;
  c.fillStyle = '#5FA8E8';
  c.strokeStyle = '#1F4E7A';
  c.lineWidth = Math.max(1, r * 0.12);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x - r * 0.4, y + s * r * (1.4 + flap), x - r * 1.1, y + s * r * (2 + flap));
    c.quadraticCurveTo(x - r * 0.2, y + s * r * 0.9, x - r * 0.6, y);
    c.closePath();
    c.fill();
    c.stroke();
  }
  c.beginPath();
  c.ellipse(x, y, r * 0.9, r * 0.5, 0, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = '#FFB000';
  c.beginPath();
  c.moveTo(x + r * 1.3, y);
  c.lineTo(x + r * 0.85, y - r * 0.18);
  c.lineTo(x + r * 0.85, y + r * 0.18);
  c.closePath();
  c.fill();
  c.fillStyle = '#FFFFFF';
  c.beginPath();
  c.arc(x + r * 0.6, y - r * 0.2, r * 0.18, 0, TAU);
  c.fill();
  c.fillStyle = '#1E2A3A';
  c.beginPath();
  c.arc(x + r * 0.65, y - r * 0.2, r * 0.09, 0, TAU);
  c.fill();
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
  if (isFullscreen()) { lockLandscape(); return; }
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.then) p.then(lockLandscape, () => {});
    else lockLandscape();
  } catch (err) { /* refusé par le navigateur */ }
}

/** Sur téléphone, on bloque l'écran en paysage (possible seulement en plein écran, pas sur iPhone) */
function lockLandscape() {
  if (!phoneMQ.matches) return;
  try {
    const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape');
    if (p && p.catch) p.catch(() => {});
  } catch (err) { /* pas possible ici : l'écran « Tourne ton téléphone » prend le relais */ }
}

/** Téléphone tenu debout pendant le jeu : on demande de le tourner */
const rotateOverlay = $('rotateOverlay');
function mustRotate() {
  const on = phoneMQ.matches && portraitMQ.matches && state !== 'loading' && startOverlay.hidden;
  if (rotateOverlay.hidden === on) {
    rotateOverlay.hidden = !on;
    if (on) releaseAll();
  }
  return on;
}

// sorti du plein écran (geste retour…) : on y retourne au prochain toucher
document.addEventListener('pointerup', () => {
  if (phoneMQ.matches && state !== 'loading' && startOverlay.hidden && !isFullscreen()) enterFullscreen();
});

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
  if (state !== 'playing' && state !== 'dino') { goHome(); return; }
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
  const n = evoMap().nodes.get(mapSel);
  if (n.idx !== mapHere) {
    // une partie laissée en cours sur un autre niveau de la carte
    openDialog(`
      <p class="dlg-title">Recommencer ce niveau ?</p>
      <p class="dlg-sub">Tu repartiras du chapitre 1 de «&nbsp;${escapeHtml(n.name)}&nbsp;».</p>
      <div class="dlg-actions">
        <button class="danger" data-act="yes">Oui, je recommence</button>
        <button class="primary" data-act="close">Non, je garde ma partie</button>
      </div>`, {
      yes: () => { closeDialog(); startOverlay.hidden = true; enterFullscreen(); enterLevel(n.idx, true); },
      close: closeDialog,
    });
    return;
  }
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
let botDeaths = {};                  // (?debug) de quoi meurt le pilote automatique
let botCareful = true;               // false = un enfant distrait, qui ne fuit qu'au dernier moment
function botPower() {
  const p = player;
  if (!CH.power || p.strikeT > 0 || p.airT > 0) return;
  if (CH.power.type !== 'breach') { activateStrike(); return; }
  // le saut : seulement si on retombera près de sa cible
  const R = CH.power.range * stats.power;
  const t = nearestCreature((c) => c.sp.breachHit || (c.sp.kind === 'hunter' && dist(c, p) < 600));
  if (t && dist(t, p) < R + t.size + maxSpeed() * 1.5) activateStrike();
}

function botDir() {
  botPower();
  const p = player;
  let fx = 0, fy = 0, threat = 0;
  // la jauge baisse : direction la mare (ou la surface) la plus proche
  if (drying() && p.wet < 0.4 && p.zone !== meter().zone) {
    const pond = nearestZone(p.x, p.y, meter().zone);
    if (pond) {
      // on boit au bord (au milieu, il y a des poissons géants)
      const dx = pond.x - p.x, dy = pond.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d > pond.r * 0.7) return { x: dx / d, y: dy / d };
      return { x: 0, y: 0 };
    }
  }
  // (le loup et l'humain) un chasseur sur qui il faut aboyer : on ne le fuit pas tant qu'on peut aboyer
  const barkAt = stats.bark && p.barkT <= 0 ? CH.missions.filter((m) => m.type === 'bark' && !missionInfo(m).done).map((m) => m.species) : [];
  // (les requins) la cible d'une mission : on y va
  for (const m of CH.missions) if ((m.type === 'stun' || m.type === 'hit') && !missionInfo(m).done) barkAt.push(m.species);
  for (const c of creatures) {
    if (!isThreat(c) || (barkAt.includes(c.id) && !c.barked && !(c.sp.kind === 'hunter' && p.strikeT > 1 && CH.power && !c.sp.tailBite))) continue;
    // un poisson géant ne peut rien contre nous si on reste au bord de sa mare
    if (c.home && dist(p, c.home) > c.home.r * (c.sp.reach || 0.85) + p.size + 150) continue;
    if (!botCareful && c.state !== 'chase') continue;
    const d = dist(c, p) || 1;
    const big = c.sp.kind === 'giant' || c.sp.kind === 'defender';
    const R = big ? c.size * 1.3 + p.size * 2
      : botCareful ? c.size * 2.5 + p.size * 3 + (c.state === 'chase' ? 260 : 120) : c.size * 1.6 + p.size * 2;
    if (d < R) { fx += (p.x - c.x) / d * (R - d) / R; fy += (p.y - c.y) / d * (R - d) / R; threat = Math.max(threat, (R - d) / R); }
  }
  if (threat > 0.15) {
    if (canStrike() && p.strikeT <= 0 && creatures.some((c) => inStrikeReach(c) && isThreat(c))) activateStrike();
    // (le loup et l'humain) un aboiement fait fuir les chasseurs
    if (stats.bark && p.barkT <= 0 && creatures.some((c) => c.sp.kind === 'hunter' && dist(c, p) < 420 + p.size * 2)) activateBark();
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
  // (le loup et l'humain) les missions sans proie : les humains, l'aboiement, les moutons
  if (!best || !wanted.includes(best.id)) {
    const job = botJob();
    if (job) return job;
  }
  if (!best) {
    // rien à manger en vue : on explore (en restant près de l'eau si la peau sèche)
    const a = worldT * 0.3 + p.walk * 0.01;
    return { x: Math.cos(a), y: Math.sin(a * 0.8) };
  }
  // on vise avec la gueule (une proie sous le ventre : on fait demi-tour)
  const mo = mouthPoint(p);
  const dx = best.x - mo.x, dy = best.y - mo.y, d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

/** (?debug) Ce que fait le pilote automatique pour les missions sans proie */
function botJob() {
  const p = player;
  const go = (x, y, stop = 0) => {
    const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy) || 1;
    return d <= stop ? { x: 0, y: 0 } : { x: dx / d, y: dy / d };
  };
  for (const m of CH.missions) {
    if (missionInfo(m).done) continue;
    if (m.type === 'stun' || m.type === 'hit') {
      const t = nearestCreature((c) => c.id === m.species && !c.stunNoted);
      if (t && t.sp.tailBite) {
        // on file vers le bout de sa queue
        const tp = t.spine[t.spine.length - 2];
        return go(tp.x, tp.y);
      }
      if (t) return go(t.x, t.y);
    }
    const hunt = m.type === 'eat' && SPECIES[m.species].hp;
    if (m.type === 'pack' || (hunt && (game.packN || 0) < SPECIES[m.species].need)) {
      const t = nearestCreature((c) => c.sp.kind === 'stray');
      if (t) return go(t.x, t.y);
    }
    if (hunt) {
      const t = nearestCreature((c) => c.id === m.species);
      if (t) return go(t.x, t.y);
    }
    if (m.type === 'bark' && stats.bark) {
      const t = nearestCreature((c) => c.id === m.species && !c.barked);
      if (t) {
        if (dist(t, p) < 420 + p.size * 2) activateBark();
        return go(t.x, t.y);
      }
    }
    if (m.type === 'herd') {
      // se placer derrière le mouton, à l'opposé de là où il doit aller : la porte
      // (s'il est de l'autre côté de l'enclos, on le fait d'abord tourner autour)
      const t = nearestCreature((c) => c.id === m.species && !c.penned);
      const pen = pens[0];
      if (t && pen) {
        const R = pen.r * FENCE;
        const a = Math.atan2(t.y - pen.y, t.x - pen.x), off = angleDiff(a, pen.gate);
        const wa = Math.abs(off) < 0.5 ? pen.gate : a + Math.sign(off) * 0.6;
        const wr = Math.abs(off) < 0.5 ? R : R + 250;
        const dx = t.x - (pen.x + Math.cos(wa) * wr), dy = t.y - (pen.y + Math.sin(wa) * wr), d = Math.hypot(dx, dy) || 1;
        return go(t.x + dx / d * (t.size + p.size + 40), t.y + dy / d * (t.size + p.size + 40));
      }
      if (pen) return go(pen.x + Math.cos(pen.gate) * (pen.r + 300), pen.y + Math.sin(pen.gate) * (pen.r + 300));
    }
    if (m.type === 'trust' || m.type === 'play' || (m.type === 'eat' && m.species === CH.treat)) {
      const h = nearestCreature((c) => c.sp.kind === 'human' && (m.type !== 'play' || (c.id === m.species && !c.played)));
      const trust = game.trust || 0;
      if (h) return go(h.x, h.y, m.type === 'play' && trust >= PLAY_TRUST ? 0 : trust < SHOO_TRUST ? h.sp.sense + 50 : 140);
      const camp = nearestZone(p.x, p.y, 'camp');
      if (camp) return go(camp.x, camp.y);
    }
  }
  return null;
}

function simulate(seconds, careful = true, log = []) {
  botInput = botDir;
  botCareful = careful;
  botDeaths = {};
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
  return { seconds: Math.round(t), chapter: game.chapter + 1, state, deaths: game.stats.deaths - t0.deaths, causes: botDeaths, log, adn: game.adn, growth: Math.round(growthK() * 100), done: game.done };
}

/* ---------- Démarrage ---------- */
async function init() {
  copilot.insertAdjacentHTML('afterbegin', AMMO_SVG);
  caustics = buildCaustics();
  resize();
  new ResizeObserver(resize).observe(stage);
  renderSoundBtn();
  try { await document.fonts.load('700 17px "Baloo 2"'); } catch (err) { /* police de secours */ }
  const params = new URLSearchParams(location.search);
  if (DEBUG && params.has('reset')) { clearSave(); progress = blankProgress(); saveProgress(); }
  showStartScreen();
  // ?debug&niveau=2 : aller directement au début d'un niveau
  if (DEBUG && LEVELS[Number(params.get('niveau')) - 1]) {
    startOverlay.hidden = true;
    goToLevel(Number(params.get('niveau')) - 1);
  }
  requestAnimationFrame(loop);
  if (DEBUG) {
    // pour tester : ?debug, puis __evo.chapter(3), __evo.adn(500)…
    window.__evo = {
      get dino() { return dino3d; },
      get game() { return game; }, get player() { return player; }, get creatures() { return creatures; }, get state() { return state; },
      get zones() { return zones; },
      chapter(i) { game.chapter = i; Object.assign(game, freshChapter()); game.chapterDone = false; CH = CHAPTERS[i]; setupChapter(true); },
      adn(n) { game.adn += n; },
      grow() { game.earned = CH.growth; },
      own(id) { game.owned[id] = true; recalc(); player.shield = stats.shield; },
      spawn(id, dx = 200, dy = 0) { const c = spawnCreature(id, true); if (c) { c.x = player.x + dx; c.y = player.y + dy; resetSpine(c, SPINES[c.sp.look] ? c.sp.look : null); } return c; },
      ending: startEnding,
      level: goToLevel,
      simulate,
    };
  }
}

init();
