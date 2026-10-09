import { renderArt } from "../espace/art.js";
import { OBJECT_BY_ID, BIP } from "../espace/data.js";
import {
  RESOURCES, RESOURCE_IDS, CHARACTERS, CHAR_BY_ID, UPGRADES, PAINTS, ACCESSORIES, SHOPS, EARTH_PRICE, LINES,
} from "./data.js";
import { drawCharacter, characterThumb } from "./chars.js";
import { sfx, isSoundOn, toggleSound } from "./sound.js";

const SAVE_KEY = 'livraisons-save';
const SAVE_VERSION = 1;

/* ---------- Réglages du vol (comme Mission Cosmos) ---------- */
const TAU = Math.PI * 2;
const WORLD_R = 4200;              // rayon de la carte
const EDGE_ZONE = 160;             // bande où l'on est repoussé vers l'intérieur
const ACCEL = 1100;                // px/s²
const DRAG = 0.35;                 // part de la vitesse gardée après 1 s sans moteur
const TURBO_ACCEL = 2600;
const TURBO_SPEED = 900;
const TURBO_TIME = 1.6;            // s de turbo

const SUN_BURN = 180;              // trop près du Soleil : ça brûle
const BH_PULL_R = 620;             // le trou noir attire dans ce rayon
const BH_PULL = 90000;
const BH_DEATH = 48;
const WORMHOLE_R = 46;

/* ---------- Réglages des livraisons ---------- */
const SAFE_R = 1300;               // zone calme autour du Soleil : jamais d'OVNI
const EXTRACT_TIME = 0.55;         // s pour charger une ressource
const CHAR_RANGE = 125;            // distance pour parler à un habitant
const SHOP_RANGE = 135;
const CRATE_LIFE = 16;             // s avant que les caisses perdues ne disparaissent
const OFFER_DELAY = 8;             // s avant qu'un habitant propose une nouvelle quête
const SLOW_SPEED = 140;            // vitesse sous laquelle on « s'arrête » pour parler

/* ---------- OVNI et combats ---------- */
const UFO_HP = 6;
const UFO_SPEED = 210;             // moins vite que la fusée : on peut toujours fuir
const UFO_SIGHT = 650;
const UFO_LEASH = 1300;            // un OVNI ne s'éloigne pas trop de chez lui
const UFO_RESPAWN = 30;
const MISSILE_SPEED = 330;
const MISSILE_TURN = 1.7;          // rad/s : un virage serré fait rater le missile
const MISSILE_LIFE = 5.5;
const BOLT_SPEED = 950;
const BOLT_LIFE = 0.75;
const FIRE_RANGE = 680;
const WEAPONS = [
  null,
  { bolts: 1, dmg: 1, cd: 0.38, color: '#FF6F91' },
  { bolts: 2, dmg: 1, cd: 0.34, color: '#7CF0A0' },
  { bolts: 2, dmg: 2, cd: 0.28, color: '#FFC93C', big: true },
];

/* Le système solaire de Mission Cosmos : pas à l'échelle, mais dans le bon ordre */
const MERCURY_PERIOD = 110;
const PLANETS = [
  { id: 'mercure', r: 26, dist: 380 },
  { id: 'venus', r: 38, dist: 540 },
  { id: 'terre', r: 46, dist: 830 },
  { id: 'mars', r: 34, dist: 1140 },
  { id: 'jupiter', r: 100, dist: 1800 },
  { id: 'saturne', r: 96, dist: 2260 },
  { id: 'uranus', r: 60, dist: 2690 },
  { id: 'neptune', r: 58, dist: 3050 },
  { id: 'pluton', r: 26, dist: 3370 },
];
const MOONS = [
  { id: 'iss', parent: 'terre', r: 28, dist: 120, period: 28 },
  { id: 'satellite', parent: 'terre', r: 22, dist: 185, period: 36, phase: Math.PI },
  { id: 'lune', parent: 'terre', r: 18, dist: 255, period: 46 },
  { id: 'rover', parent: 'mars', r: 26, dist: 98, period: 40 },
  { id: 'io', parent: 'jupiter', r: 19, dist: 185, period: 22 },
  { id: 'europe', parent: 'jupiter', r: 17, dist: 248, period: 34 },
  { id: 'titan', parent: 'saturne', r: 22, dist: 245, period: 44 },
];
const BELT = { inner: 1340, outer: 1530, count: 95 };
const FAR = {
  nebuleuse: { x: 2800, y: -2300, r: 210 },
  galaxie: { x: -3100, y: -1850, r: 180 },
  trounoir: { x: -2550, y: 2550, r: 80 },
};
const SOCK_HOME = { x: 330, y: 320 };
const WORMHOLES = [{ x: -1540, y: -560 }, { x: -450, y: -3600 }];

const MAP_COLORS = {
  soleil: '#FFC93C', mercure: '#B8ADA2', venus: '#EBC989', terre: '#4FA8F0', lune: '#DADAD6',
  mars: '#E0703A', jupiter: '#D9B48A', saturne: '#E8CF95', uranus: '#97E1E7', neptune: '#5A84F0',
  pluton: '#D8BFA4', comete: '#BFEFFF', galaxie: '#B9A8FF', nebuleuse: '#FF7FC8',
  trounoir: '#FF8A3C', satellite: '#F2C14E', iss: '#E8B254', astronaute: '#FFFFFF', rover: '#F2F4F8',
  telescope: '#F2BE3A', fusee: '#FF6F91', chaussette: '#FF6F91', io: '#EBCB52',
  europe: '#EDE3D2', titan: '#E8A23F',
};

/* ---------- Éléments de la page ---------- */
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('spaceCanvas');
const ctx = canvas.getContext('2d');
const minimap = $('minimap');
const mctx = minimap.getContext('2d');
const goldEl = $('gold');
const goldBar = $('goldBar');
const cargoCountEl = $('cargoCount');
const soundBtn = $('soundBtn');
const questPanel = $('questPanel');
const questList = $('questList');
const cargoSlots = $('cargoSlots');
const factCard = $('factCard');
const copilot = $('copilot');
const bubble = $('bubble');
const startOverlay = $('startOverlay');
const dialogEl = $('dialog');
const dialogCard = $('dialogCard');
const mapOverlay = $('mapOverlay');
const bigMap = $('bigMap');
const bctx = bigMap.getContext('2d');
const endOverlay = $('endOverlay');
const endCanvas = $('endCanvas');
const ectx = endCanvas.getContext('2d');
const quitOverlay = $('quitOverlay');
const confettiLayer = $('confettiLayer');
const fireBtn = $('fireBtn');
const phoneMQ = window.matchMedia('(pointer: coarse) and (max-width: 900px), (pointer: coarse) and (max-height: 520px)');

/* ---------- État ---------- */
let game = null;                   // tout ce qui est sauvegardé
let state = 'loading';             // 'loading' | 'ready' | 'playing' | 'ending'

const arts = {};                   // dessins pré-rendus des astres
const thumbs = {};                 // petites images (dataURL) des astres
const faces = {};                  // petites images des personnages
const faceImgs = {};               // les mêmes, en <img> pour le canvas
let rockArts = [];
let ufoArt = null;
let starTiles = [];
let hazeTile = null;

let cssW = 0, cssH = 0, dpr = 1, zoom = 1, viewW = 0, viewH = 0;
let bodies = [];
let byId = {};
let rocks = [];
let ship = null;
let ufos = [];
let missiles = [];
let bolts = [];
let crates = [];
let coins = [];
let particles = [];
let floaters = [];
let talk = {};                     // bulles au-dessus des personnages : id -> { text, until }
let extract = { res: null, p: 0 };
const near = new Set();            // ce qu'on a déjà « visité » tant qu'on reste à côté
const offerShown = new Set();      // offres déjà montrées pendant ce passage
const dismissed = new Set();       // fenêtres déjà refermées une fois
let dialogId = null;
let fireCd = 0;
let fireHeld = false;
let shieldCharge = 1;
let ufoRespawn = 0;
let flash = { a: 0, color: '255,255,255' };
let shake = 0;
let lastMoveAt = 0;
let nextJokeAt = 0;
const cooldowns = {};
let bip = { until: 0, prio: 0 };
let factTimer = null;
let saveAt = 0;
let dialogActions = {};
let endT = 0;
let endFx = [];
let kingTitle = 'Roi';

const keys = { left: false, right: false, up: false, down: false };
const touchDirs = { left: false, right: false, up: false, down: false };
const pointer = { active: false, id: null, dx: 0, dy: 0, lastDown: 0 };

/* ---------- Utilitaires ---------- */
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const polar = (a, d) => ({ x: Math.cos(a) * d, y: Math.sin(a) * d });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % TAU) - Math.PI;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
}

/* ---------- Améliorations ---------- */
const upVal = (k) => UPGRADES[k].values[game.up[k]];
const capacity = () => upVal('cargo');
const maxQuests = () => upVal('slots');
const maxSpeed = () => upVal('engine');
const weapon = () => WEAPONS[upVal('weapon')];
const shieldTime = () => upVal('shield');

/* ---------- Sauvegarde (la partie continue la prochaine fois) ---------- */
function newGame() {
  game = {
    v: SAVE_VERSION,
    seed: Math.floor(Math.random() * 1e9),
    worldT: 0,
    gold: 0, earned: 0, questsDone: 0, delivered: 0, ufoKills: 0,
    cargo: [],
    up: { cargo: 0, slots: 0, engine: 0, turbo: 0, weapon: 0, shield: 0 },
    paints: ['classique'], paint: 'classique',
    accs: ['aucun'], acc: 'aucun',
    quests: [], offers: {}, offerAt: {},
    seen: {}, tips: {},
    ship: null, won: false, started: false,
  };
  CHARACTERS.forEach((c) => { game.offers[c.id] = makeOffer(c.id); });
  // La toute première quête est facile : du fer de Mercure pour Capitaine Lila
  game.offers.lila = { needs: { fer: 2 }, reward: 25, reason: CHAR_BY_ID.lila.reasons[0] };
}

function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && data.v === SAVE_VERSION && data.up && data.offers) return data;
  } catch (e) { /* stockage indisponible ou abîmé */ }
  return null;
}

function saveGame() {
  if (!game) return;
  game.worldT = worldT;
  if (ship) game.ship = { x: Math.round(ship.x), y: Math.round(ship.y) };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) { /* stockage indisponible */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignoré */ }
}

/* ---------- Taille de l'écran ---------- */
function resize() {
  const rect = stage.getBoundingClientRect();
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
  dpr = Math.min(2, window.devicePixelRatio || 1);
  zoom = clamp(cssW / 950, 0.58, 1.1);
  viewW = cssW / zoom;
  viewH = cssH / zoom;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const m = minimap.getBoundingClientRect();
  minimap.width = Math.round(m.width * dpr);
  minimap.height = Math.round(m.height * dpr);
  if (!mapOverlay.hidden) drawBigMap();
  if (state === 'ending') sizeEndCanvas();
}

/* ---------- Fond étoilé (3 couches qui défilent à des vitesses différentes) ---------- */
const TILE = 512;

function buildBackground() {
  starTiles = [
    { factor: 0.08, count: 140, size: [0.4, 0.9], alpha: [0.2, 0.55] },
    { factor: 0.22, count: 70, size: [0.6, 1.3], alpha: [0.3, 0.75] },
    { factor: 0.45, count: 26, size: [1.1, 1.9], alpha: [0.5, 0.95] },
  ].map((layer) => {
    const c = document.createElement('canvas');
    c.width = c.height = TILE * 2;
    const b = c.getContext('2d');
    b.scale(2, 2);
    for (let i = 0; i < layer.count; i++) {
      const tint = Math.random();
      const col = tint < 0.15 ? '255,220,180' : tint < 0.3 ? '180,210,255' : '255,255,255';
      b.fillStyle = `rgba(${col},${rand(...layer.alpha)})`;
      b.beginPath();
      b.arc(Math.random() * TILE, Math.random() * TILE, rand(...layer.size), 0, TAU);
      b.fill();
    }
    const twinkles = Array.from({ length: Math.round(layer.count / 8) }, () => ({
      x: Math.random() * TILE, y: Math.random() * TILE,
      s: rand(layer.size[0] + 0.4, layer.size[1] + 0.6),
      phase: Math.random() * TAU, speed: rand(1.2, 3),
    }));
    return { canvas: c, factor: layer.factor, twinkles };
  });

  const H = 1024;
  hazeTile = document.createElement('canvas');
  hazeTile.width = hazeTile.height = H;
  const h = hazeTile.getContext('2d');
  [[200, 300, 380, '120,70,220', 0.13], [760, 180, 320, '40,120,220', 0.12], [600, 760, 420, '220,70,150', 0.08], [120, 860, 260, '60,200,200', 0.06]]
    .forEach(([x, y, r, c, a]) => {
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cx = x + ox * H, cy = y + oy * H;
          const g = h.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `rgba(${c},${a})`);
          g.addColorStop(1, `rgba(${c},0)`);
          h.fillStyle = g;
          h.fillRect(0, 0, H, H);
        }
      }
    });
}

/* ---------- Construction du monde ---------- */
let worldT = 0;                    // temps qui fait tourner les planètes

function makeBody(id, r, extra = {}) {
  const b = { id, obj: OBJECT_BY_ID[id], r, x: 0, y: 0, rot: 0, ...extra };
  if (!arts[id]) arts[id] = renderArt(id, r);
  bodies.push(b);
  byId[id] = b;
  return b;
}

/** Le monde dépend de la graine de la partie : les planètes reviennent à la même place après une sauvegarde. */
function buildWorld(seed) {
  const R = mulberry32(seed);
  bodies = [];
  byId = {};
  Object.entries(FAR).forEach(([id, f]) => makeBody(id, f.r, { motion: 'fixed', x: f.x, y: f.y }));
  makeBody('soleil', 130, { motion: 'fixed' });
  PLANETS.forEach((p) => {
    const period = MERCURY_PERIOD * Math.pow(p.dist / PLANETS[0].dist, 1.5);
    makeBody(p.id, p.r, { motion: 'orbit', dist: p.dist, period, phase: R() * TAU });
  });
  MOONS.forEach((m) => {
    makeBody(m.id, m.r, { motion: 'moon', parent: m.parent, dist: m.dist, period: m.period, phase: m.phase ?? R() * TAU });
  });
  makeBody('telescope', 34, { motion: 'l2' });
  makeBody('astronaute', 22, { motion: 'spacewalk' });
  makeBody('fusee', 30, { motion: 'rocket', dist: 690, period: 55, phase: R() * TAU });
  makeBody('chaussette', 24, { motion: 'drift' });
  makeBody('comete', 40, { motion: 'comet', a: 1950, e: 0.78, period: 150, tilt: R() * TAU, phase: R() * TAU });

  // Les mines : chaque ressource a son astre
  RESOURCE_IDS.forEach((res) => {
    const b = byId[RESOURCES[res].source];
    b.res = res;
    b.range = b.id === 'nebuleuse' ? 250 : b.r + 85;
  });

  if (!rockArts.length) rockArts = Array.from({ length: 6 }, (_, i) => renderArt('asteroide', 24, 2, 1000 + i * 7919));
  rocks = Array.from({ length: BELT.count }, (_, i) => {
    const d = BELT.inner + R() * (BELT.outer - BELT.inner);
    const r = R() < 0.15 ? 24 + R() * 8 : 10 + R() * 12;
    return {
      id: 'asteroide', r, rock: true, art: rockArts[i % rockArts.length],
      dist: d, phase: (i / BELT.count) * TAU + (R() - 0.5) * 0.06,
      period: MERCURY_PERIOD * Math.pow(d / PLANETS[0].dist, 1.5),
      spin: (R() - 0.5) * 1.2, rot: R() * TAU, x: 0, y: 0,
    };
  });
  updateBodies(0);
}

function updateBodies(dt) {
  const t = worldT;
  for (const b of bodies) {
    switch (b.motion) {
      case 'orbit': {
        const p = polar(b.phase + (TAU * t) / b.period, b.dist);
        b.x = p.x; b.y = p.y;
        break;
      }
      case 'moon': {
        const parent = byId[b.parent];
        const p = polar(b.phase + (TAU * t) / b.period, b.dist);
        b.x = parent.x + p.x; b.y = parent.y + p.y;
        break;
      }
      case 'l2': {
        const e = byId.terre;
        const d = Math.hypot(e.x, e.y) || 1;
        b.x = e.x + (e.x / d) * 350; b.y = e.y + (e.y / d) * 350;
        break;
      }
      case 'spacewalk': {
        const iss = byId.iss;
        const p = polar(t * 0.5, 85);
        b.x = iss.x + p.x; b.y = iss.y + p.y;
        b.rot = Math.sin(t * 0.8) * 0.4;
        break;
      }
      case 'rocket': {
        const a = b.phase + (TAU * t) / b.period;
        const p = polar(a, b.dist);
        b.x = p.x; b.y = p.y;
        b.rot = a + Math.PI - 0.6;
        if (dt && Math.random() < 0.5) {
          const back = polar(a - Math.PI / 2, 34);
          particles.push({ x: b.x + back.x, y: b.y + back.y, vx: rand(-15, 15), vy: rand(-15, 15), life: 0, max: rand(0.5, 1), size: rand(2, 4), color: Math.random() < 0.5 ? '#FFC93C' : '#FFFFFF' });
        }
        break;
      }
      case 'drift':
        b.x = SOCK_HOME.x + Math.cos(t * 0.3) * 50;
        b.y = SOCK_HOME.y + Math.sin(t * 0.4) * 40;
        b.rot = t * 0.5;
        break;
      case 'comet': {
        // Vraie orbite en ellipse : la comète accélère près du Soleil (loi de Kepler)
        const M = b.phase + (TAU * t) / b.period;
        let E = M;
        for (let i = 0; i < 6; i++) E -= (E - b.e * Math.sin(E) - M) / (1 - b.e * Math.cos(E));
        const bb = b.a * Math.sqrt(1 - b.e * b.e);
        const ex = b.a * (Math.cos(E) - b.e), ey = bb * Math.sin(E);
        const c = Math.cos(b.tilt), s = Math.sin(b.tilt);
        b.x = ex * c - ey * s; b.y = ex * s + ey * c;
        b.rot = Math.atan2(b.y, b.x) - (3 * Math.PI) / 4;
        break;
      }
      default:
        break;
    }
  }
  for (const k of rocks) {
    const p = polar(k.phase + (TAU * t) / k.period, k.dist);
    k.x = p.x; k.y = p.y;
    k.rot += k.spin * dt;
  }
}

/* ---------- Où vivent les habitants et les marchands ---------- */
function charPos(id) {
  const b = byId[CHAR_BY_ID[id].home];
  const lift = (b.id === 'saturne' ? b.r * 0.72 : b.r) + 46;
  return { x: b.x, y: b.y - lift };
}

const SHOP_POS = Object.fromEntries(SHOPS.map((s) => [s.id, polar(s.angle, s.dist)]));
const SHOP_BY_ID = Object.fromEntries(SHOPS.map((s) => [s.id, s]));

/** Distance moyenne au Soleil d'un astre (pour calculer la récompense d'une quête). */
function orbitDist(id) {
  if (id === 'iss' || id === 'lune') return 830;
  if (id === 'io' || id === 'europe') return 1800;
  if (id === 'titan') return 2260;
  if (id === 'comete') return 1950;
  if (FAR[id]) return Math.hypot(FAR[id].x, FAR[id].y);
  return PLANETS.find((p) => p.id === id).dist;
}

/* ---------- Quêtes ---------- */
function unitValue(charId, res) {
  const d = Math.abs(orbitDist(RESOURCES[res].source) - orbitDist(CHAR_BY_ID[charId].home)) + 400;
  return 3 + d / 110;
}

/** Une commande au hasard, de plus en plus grosse au fil de la partie. */
function makeOffer(charId) {
  const c = CHAR_BY_ID[charId];
  const done = game ? game.questsDone : 0;
  let tier;
  if (done < 3) tier = 1;
  else if (done < 8) tier = Math.random() < 0.65 ? 2 : 1;
  else tier = Math.random() < 0.55 ? 3 : 2;

  let pool = shuffle(c.likes);
  // Au début, on demande plutôt des ressources pas trop loin
  if (done < 3) pool = pool.sort((a, b) => unitValue(charId, a) - unitValue(charId, b)).slice(0, 2);
  const types = tier === 1 ? 1 : tier === 2 ? 2 : (Math.random() < 0.5 ? 2 : 3);
  const chosen = shuffle(pool).slice(0, types);
  const total = tier === 1 ? randInt(2, 3) : tier === 2 ? randInt(3, 5) : randInt(5, 8);
  const needs = {};
  chosen.forEach((r) => { needs[r] = 1; });
  for (let i = chosen.length; i < total; i++) needs[pick(chosen)] += 1;

  let sum = 0;
  Object.entries(needs).forEach(([r, n]) => { sum += n * unitValue(charId, r); });
  const reward = Math.round((sum * (1 + 0.15 * (chosen.length - 1)) + 5) / 5) * 5;
  return { needs, reward, reason: pick(c.reasons) };
}

const carried = (res) => game.cargo.filter((r) => r === res).length;

/** Combien il en faut encore, toutes quêtes confondues */
function outstanding(res) {
  return game.quests.reduce((n, q) => n + Math.max(0, (q.needs[res] || 0) - (q.got[res] || 0)), 0);
}

function questDone(q) {
  return Object.entries(q.needs).every(([r, n]) => (q.got[r] || 0) >= n);
}

function removeCargo(res) {
  const i = game.cargo.indexOf(res);
  if (i < 0) return false;
  game.cargo.splice(i, 1);
  return true;
}

function deliverTo(charId) {
  const q = game.quests.find((x) => x.char === charId);
  if (!q) return false;
  const pos = charPos(charId);
  let given = 0;
  Object.entries(q.needs).forEach(([r, n]) => {
    let k = 0;
    while ((q.got[r] || 0) < n && removeCargo(r)) {
      q.got[r] = (q.got[r] || 0) + 1;
      k += 1;
    }
    if (k) {
      given += k;
      // les ressources volent de la fusée jusqu'au personnage
      for (let i = 0; i < k; i++) {
        floaters.push({ text: RESOURCES[r].icon, x: ship.x, y: ship.y, tx: pos.x, ty: pos.y, life: -i * 0.12, max: 0.7, size: 26, fly: true });
      }
    }
  });
  if (!given) return false;
  game.delivered += given;
  if (questDone(q)) {
    completeQuest(q);
  } else {
    sfx.deliver();
    addFloater(`+${given} livré${given > 1 ? 's' : ''}`, pos.x, pos.y - 50, '#9EE7FF', 22);
    say(pick(LINES.partial), 2, 3800);
  }
  renderUI();
  saveGame();
  return true;
}

function completeQuest(q) {
  const c = CHAR_BY_ID[q.char];
  const pos = charPos(q.char);
  game.quests = game.quests.filter((x) => x !== q);
  game.questsDone += 1;
  game.offerAt[q.char] = worldT + OFFER_DELAY;
  setTimeout(() => sfx.cash(), 250);
  addFloater(`+${q.reward} 💰`, pos.x, pos.y - 60, '#FFD24A', 30);
  burst(pos.x, pos.y, 40, ['#FFC93C', '#FF6F91', '#4FB8E8', '#58C97B', '#FFFFFF'], 280);
  spawnCoins(pos.x, pos.y, Math.min(24, 6 + Math.round(q.reward / 10)));
  addGold(q.reward);
  talk[q.char] = { text: c.thanks, until: worldT + 4.5 };
  if (!game.tips.firstDone) {
    game.tips.firstDone = true;
    say(LINES.firstDone, 4, 7500);
  } else {
    say(pick(LINES.done), 3, 3800);
  }
}

function addGold(n) {
  const before = game.gold;
  game.gold += n;
  game.earned += n;
  goldEl.parentElement.classList.remove('bump');
  void goldEl.parentElement.offsetWidth;
  goldEl.parentElement.classList.add('bump');
  if (before < EARTH_PRICE && game.gold >= EARTH_PRICE) {
    setTimeout(() => say(LINES.rich, 5, 7000), 1800);
  } else if (!game.tips.richGus && game.gold >= UPGRADES.cargo.prices[0] && game.up.cargo === 0) {
    game.tips.richGus = true;
    setTimeout(() => say(LINES.richGus, 3, 6500), 2500);
  }
}

function acceptOffer(charId) {
  const offer = game.offers[charId];
  if (!offer || game.quests.length >= maxQuests()) return;
  game.quests.push({ char: charId, needs: offer.needs, got: {}, reward: offer.reward, reason: offer.reason });
  game.offers[charId] = null;
  game.offerAt[charId] = Infinity;
  dismissed.delete(charId);
  dialogId = null;               // accepter n'est pas « refermer »
  sfx.quest();
  if (!game.tips.firstQuest) {
    game.tips.firstQuest = true;
    const res = RESOURCES[Object.keys(offer.needs)[0]];
    say(LINES.firstQuest(res.icon, res.name, res.place || OBJECT_BY_ID[res.source].name), 4, 8000);
  } else {
    say(pick(LINES.quest), 2, 3500);
  }
  closeDialog();
  deliverTo(charId);       // on a peut-être déjà ce qu'il faut dans la soute !
  renderUI();
  saveGame();
}

function abandonQuest(q) {
  game.quests = game.quests.filter((x) => x !== q);
  // la commande redevient une offre (ce qui a déjà été livré est perdu)
  game.offers[q.char] = { needs: q.needs, reward: q.reward, reason: q.reason };
  game.offerAt[q.char] = 0;
  renderUI();
  saveGame();
}

function updateOffers() {
  CHARACTERS.forEach((c) => {
    if (!game.offers[c.id] && !game.quests.some((q) => q.char === c.id) && worldT >= (game.offerAt[c.id] ?? 0)) {
      game.offers[c.id] = makeOffer(c.id);
    }
  });
}

/* ---------- Nouvelle partie / reprise ---------- */
function resetShip() {
  const e = byId.terre;
  const a = Math.atan2(e.y, e.x) - 0.45;
  const p = polar(a, Math.hypot(e.x, e.y));
  placeShip(p.x, p.y);
}

function placeShip(x, y) {
  ship = { x, y, vx: 0, vy: 0, angle: -Math.PI / 2, thrust: false, turbo: 0, charge: 1, spin: 0, spaghetti: 0, wormCooldown: 0, invul: 0 };
}

function setupGame() {
  worldT = game.worldT || 0;
  buildWorld(game.seed);
  if (game.ship) placeShip(game.ship.x, game.ship.y);
  else resetShip();
  ufos = [];
  missiles = [];
  bolts = [];
  crates = [];
  coins = [];
  particles = [];
  floaters = [];
  talk = {};
  near.clear();
  offerShown.clear();
  dismissed.clear();
  extract = { res: null, p: 0 };
  shieldCharge = 1;
  ufoRespawn = 0;
  for (let i = 0; i < ufoTarget(); i++) spawnUfo(true);
  renderUI();
}

function showStartScreen() {
  const saved = loadGame();
  const hasSave = saved && saved.started;
  $('startBtn').textContent = hasSave ? `🚀 Continuer (💰 ${saved.gold})` : '🚀 Décoller !';
  $('newGameBtn').hidden = !hasSave;
  game = hasSave ? saved : null;
  if (!game) newGame();
  setupGame();
  state = 'ready';
  startOverlay.hidden = false;
  setTimeout(() => $('startBtn').focus({ preventScroll: true }), 50);
}

function startGame() {
  if (state !== 'ready') return;
  startOverlay.hidden = true;
  state = 'playing';
  lastMoveAt = performance.now();
  nextJokeAt = lastMoveAt + rand(40000, 55000);
  if (!game.started) {
    game.started = true;
    say(LINES.firstStart, 4, 8000);
  } else {
    say(pick(LINES.resume), 2, 3500);
  }
  if (phoneMQ.matches || window.matchMedia('(max-width: 700px)').matches) setQuestCollapsed(true);
  if (phoneMQ.matches) enterFullscreen();
  saveGame();
}

/* ---------- Commandes ---------- */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',     // KeyA = touche Q sur un clavier AZERTY
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',           // KeyW = touche Z sur un clavier AZERTY
  ArrowDown: 'down', KeyS: 'down',
};

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
}

window.addEventListener('keydown', (e) => {
  if (isTyping(e)) return;
  const key = e.key.toLowerCase();
  if (state === 'ending') return;
  if (!quitOverlay.hidden) {
    if (e.code === 'Escape') closeQuit();
    return;
  }
  if (!dialogEl.hidden) {
    if (e.code === 'Escape') closeDialog();
    return;
  }
  if (!mapOverlay.hidden) {
    if (e.code === 'Escape' || key === 'm') closeMap();
    return;
  }
  if (state === 'ready') {
    if (e.code === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      startGame();
    }
    return;
  }
  const dir = KEYMAP[e.code];
  if (dir) {
    keys[dir] = true;
    e.preventDefault();
    return;
  }
  if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    if (!e.repeat) activateTurbo();
  } else if (key === 'f' || key === 'x' || e.code === 'Enter') {
    e.preventDefault();
    fireHeld = true;
    if (!e.repeat) tryFire(true);
  } else if (key === 'm') {
    openMap();
  }
});

window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) keys[dir] = false;
  const key = e.key.toLowerCase();
  if (key === 'f' || key === 'x' || e.code === 'Enter') fireHeld = false;
});

window.addEventListener('blur', () => {
  Object.keys(keys).forEach((k) => { keys[k] = false; });
  pointer.active = false;
  fireHeld = false;
});

document.querySelectorAll('.dpad button').forEach((btn) => {
  const dir = btn.dataset.dir;
  const press = (e) => {
    e.preventDefault();
    touchDirs[dir] = true;
    btn.classList.add('pressed');
  };
  const release = () => {
    touchDirs[dir] = false;
    btn.classList.remove('pressed');
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
});
$('turboBtn').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  activateTurbo();
});
fireBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  fireHeld = true;
  tryFire(true);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => fireBtn.addEventListener(ev, () => { fireHeld = false; }));

// Garder le doigt (ou la souris) appuyé : la fusée vole vers lui. Double-tape : turbo !
function updatePointer(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.dx = (e.clientX - rect.left - rect.width / 2) / zoom;
  pointer.dy = (e.clientY - rect.top - rect.height / 2) / zoom;
}
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'playing') return;
  e.preventDefault();
  pointer.active = true;
  pointer.id = e.pointerId;
  updatePointer(e);
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
  const now = performance.now();
  if (now - pointer.lastDown < 320) activateTurbo();
  pointer.lastDown = now;
});
canvas.addEventListener('pointermove', (e) => {
  if (pointer.active && e.pointerId === pointer.id) updatePointer(e);
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => {
  canvas.addEventListener(ev, (e) => {
    if (e.pointerId === pointer.id) pointer.active = false;
  });
});

function isDown(dir) {
  return keys[dir] || touchDirs[dir];
}

function activateTurbo() {
  if (state !== 'playing' || isBlocked() || !ship || ship.spaghetti > 0) return;
  if (ship.charge < 1) {
    addFloater('Turbo en charge…', ship.x, ship.y - 40, '#9EE7FF');
    return;
  }
  ship.turbo = TURBO_TIME;
  ship.charge = 0;
  shake = Math.max(shake, 0.15);
  sfx.turbo();
  sayOnce('turbo', BIP.turbo, 25, 1);
}

/* ---------- Bip, le copilote ---------- */
function say(text, prio = 1, dur = 4200) {
  const now = performance.now();
  if (now < bip.until && prio < bip.prio) return;
  bubble.textContent = text;
  bubble.classList.remove('show');
  void bubble.offsetWidth;
  bubble.classList.add('show');
  copilot.classList.add('talking');
  bip = { until: now + dur, prio };
  sfx.bip();
  nextJokeAt = Math.max(nextJokeAt, now + 25000);
}

function sayOnce(key, lines, cooldownS, prio = 1) {
  const now = performance.now();
  if ((cooldowns[key] || 0) > now) return;
  cooldowns[key] = now + cooldownS * 1000;
  say(typeof lines === 'string' ? lines : pick(lines), prio);
}

function updateBip(now) {
  if (bip.until && now > bip.until) {
    bubble.classList.remove('show');
    copilot.classList.remove('talking');
    bip = { until: 0, prio: 0 };
  }
  if (state === 'playing' && !isBlocked()) {
    if (now > nextJokeAt && !bip.until) {
      say(pick(BIP.jokes), 0, 7000);
      nextJokeAt = now + rand(45000, 70000);
    }
    if (now - lastMoveAt > 12000) {
      sayOnce('idle', BIP.idle, 30, 1);
      lastMoveAt = now;
    }
  }
}

/* ---------- Effets ---------- */
function burst(x, y, count, colors, speed = 220) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU;
    const s = rand(speed * 0.3, speed);
    particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0, max: rand(0.5, 1.1), size: rand(2, 4.5),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function addFloater(text, x, y, color, size = 22) {
  floaters.push({ text, x, y, life: 0, max: 1.4, color, size });
}

/** Pièces d'or qui volent jusqu'à la fusée */
function spawnCoins(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = rand(120, 320);
    coins.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, spin: Math.random() * TAU });
  }
}

/* ---------- Fiche « Le savais-tu ? » (la première fois qu'on visite une mine) ---------- */
function showFactCard(res) {
  const r = RESOURCES[res];
  const obj = OBJECT_BY_ID[r.source];
  $('fcImg').src = thumbs[r.source];
  $('fcIcon').textContent = r.icon;
  $('fcName').textContent = r.name;
  $('fcWhere').textContent = `sur ${obj.name}`;
  $('fcFact').textContent = r.fact;
  factCard.hidden = false;
  factCard.style.animation = 'none';
  void factCard.offsetWidth;
  factCard.style.animation = '';
  clearTimeout(factTimer);
  factTimer = setTimeout(hideFactCard, 9000);
}

function hideFactCard() {
  clearTimeout(factTimer);
  factCard.hidden = true;
}

/* ---------- Mises à jour ---------- */
function updateShip(dt, now) {
  if (ship.spaghetti > 0) {
    ship.spaghetti -= dt;
    const bh = byId.trounoir;
    ship.x += (bh.x - ship.x) * Math.min(1, dt * 3);
    ship.y += (bh.y - ship.y) * Math.min(1, dt * 3);
    ship.angle += dt * 14;
    if (ship.spaghetti <= 0) {
      resetShip();
      flash = { a: 0.9, color: '255,240,200' };
    }
    return;
  }

  let ax = 0, ay = 0;
  if (isDown('left')) ax -= 1;
  if (isDown('right')) ax += 1;
  if (isDown('up')) ay -= 1;
  if (isDown('down')) ay += 1;
  if (pointer.active && !ax && !ay) {
    const d = Math.hypot(pointer.dx, pointer.dy);
    if (d > 26) { ax = pointer.dx / d; ay = pointer.dy / d; }
  }
  const len = Math.hypot(ax, ay);
  ship.thrust = len > 0;
  if (ship.thrust) lastMoveAt = now;

  ship.turbo = Math.max(0, ship.turbo - dt);
  if (ship.turbo === 0) ship.charge = Math.min(1, ship.charge + dt / upVal('turbo'));
  const turbo = ship.turbo > 0;
  const accel = turbo ? TURBO_ACCEL : ACCEL;
  const top = turbo ? TURBO_SPEED : maxSpeed();

  if (len) {
    ship.vx += (ax / len) * accel * dt;
    ship.vy += (ay / len) * accel * dt;
    ship.angle = lerpAngle(ship.angle, Math.atan2(ay, ax), Math.min(1, dt * 9));
  } else if (turbo) {
    ship.vx += Math.cos(ship.angle) * accel * dt;
    ship.vy += Math.sin(ship.angle) * accel * dt;
  }

  // Le trou noir attire tout ce qui passe près de lui
  const bh = byId.trounoir;
  const bdx = bh.x - ship.x, bdy = bh.y - ship.y;
  const bd = Math.hypot(bdx, bdy);
  if (bd < BH_PULL_R) {
    const pull = BH_PULL / Math.max(bd, 50);
    ship.vx += (bdx / bd) * pull * dt;
    ship.vy += (bdy / bd) * pull * dt;
    sayOnce('blackhole', BIP.blackhole, 12, 3);
    if (Math.random() < 0.3) shake = Math.max(shake, 0.08);
    if (bd < BH_DEATH) {
      ship.spaghetti = 1.8;
      ship.vx = ship.vy = 0;
      const lost = game.cargo.length;
      game.cargo = [];
      renderUI();
      sfx.spaghetti();
      buzz([120, 60, 120]);
      say(lost ? LINES.blackhole : pick(BIP.spaghetti), 4, 5000);
      addFloater('🍝 SPAGHETTIFICATION !', ship.x, ship.y - 50, '#FFC93C', 26);
      return;
    }
  }

  // Le Soleil brûle : on est repoussé
  const sd = Math.hypot(ship.x, ship.y);
  if (sd < SUN_BURN) {
    const nx = ship.x / (sd || 1), ny = ship.y / (sd || 1);
    const inward = ship.vx * nx + ship.vy * ny;
    if (inward < 0) { ship.vx -= inward * nx * 1.6; ship.vy -= inward * ny * 1.6; }
    ship.vx += nx * 1800 * dt;
    ship.vy += ny * 1800 * dt;
    sayOnce('sun', BIP.sun, 8, 3);
    if (!cooldowns.hotSfx || cooldowns.hotSfx < now) { sfx.hot(); cooldowns.hotSfx = now + 700; }
    if (Math.random() < 0.6) burst(ship.x, ship.y, 2, ['#FF8A3C', '#FFC93C'], 120);
  }

  // Bord de la carte
  if (sd > WORLD_R - EDGE_ZONE) {
    const over = (sd - (WORLD_R - EDGE_ZONE)) / EDGE_ZONE;
    ship.vx -= (ship.x / sd) * 1500 * over * dt;
    ship.vy -= (ship.y / sd) * 1500 * over * dt;
    sayOnce('edge', BIP.edge, 12, 2);
    if (sd > WORLD_R) { ship.x *= WORLD_R / sd; ship.y *= WORLD_R / sd; }
  }

  const drag = Math.pow(DRAG, dt);
  ship.vx *= drag;
  ship.vy *= drag;
  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > top) {
    const target = top + (speed - top) * Math.pow(0.04, dt);
    ship.vx *= target / speed;
    ship.vy *= target / speed;
  }
  if (!len && speed > 30) {
    ship.angle = lerpAngle(ship.angle, Math.atan2(ship.vy, ship.vx), Math.min(1, dt * 5));
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  ship.spin = Math.max(0, ship.spin - dt);
  ship.invul = Math.max(0, ship.invul - dt);
  ship.wormCooldown = Math.max(0, ship.wormCooldown - dt);

  // Traînée du réacteur
  if ((ship.thrust || turbo) && Math.random() < (turbo ? 1 : 0.8)) {
    const flame = (PAINTS[game.paint] || PAINTS.classique).flame;
    const n = turbo ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const bx = ship.x - Math.cos(ship.angle) * 24;
      const by = ship.y - Math.sin(ship.angle) * 24;
      particles.push({
        x: bx + rand(-3, 3), y: by + rand(-3, 3),
        vx: -Math.cos(ship.angle) * 110 + rand(-25, 25),
        vy: -Math.sin(ship.angle) * 110 + rand(-25, 25),
        life: 0, max: rand(0.25, 0.5), size: rand(2, turbo ? 5 : 3.5),
        color: turbo ? (Math.random() < 0.5 ? '#9EE7FF' : '#FFFFFF') : pick(flame),
      });
    }
  }
}

function updateHazards(now) {
  if (ship.spaghetti > 0) return;

  for (const k of rocks) {
    const dx = ship.x - k.x, dy = ship.y - k.y;
    const d = Math.hypot(dx, dy);
    const minD = k.r * 0.85 + 14;
    if (d < minD && d > 0.01) {
      const nx = dx / d, ny = dy / d;
      ship.x = k.x + nx * minD;
      ship.y = k.y + ny * minD;
      const vn = ship.vx * nx + ship.vy * ny;
      if (vn < 0) {
        ship.vx -= vn * nx * 1.8;
        ship.vy -= vn * ny * 1.8;
      }
      ship.vx += nx * 160;
      ship.vy += ny * 160;
      ship.spin = 0.6;
      shake = Math.max(shake, 0.3);
      sfx.bonk();
      buzz(70);
      burst(ship.x - nx * 14, ship.y - ny * 14, 12, ['#BCAB95', '#FFFFFF', '#FFC93C'], 160);
      addFloater(pick(['BONK !', 'PAF !', 'BOING !', 'AÏE !']), ship.x, ship.y - 34, '#FFC93C', 24);
      sayOnce('bonk', BIP.bonk, 8, 1);
      break;
    }
  }

  if (ship.wormCooldown === 0) {
    WORMHOLES.forEach((w, i) => {
      if (ship.wormCooldown > 0) return;
      if (Math.hypot(ship.x - w.x, ship.y - w.y) < WORMHOLE_R) {
        const out = WORMHOLES[1 - i];
        const sp = Math.hypot(ship.vx, ship.vy) || 1;
        const dirx = sp > 20 ? ship.vx / sp : Math.cos(ship.angle);
        const diry = sp > 20 ? ship.vy / sp : Math.sin(ship.angle);
        ship.x = out.x + dirx * (WORMHOLE_R + 50);
        ship.y = out.y + diry * (WORMHOLE_R + 50);
        ship.wormCooldown = 1.5;
        flash = { a: 0.8, color: '190,120,255' };
        sfx.wormhole();
        burst(ship.x, ship.y, 30, ['#C38BFF', '#FFFFFF', '#7FD8FF'], 260);
        sayOnce('wormhole', BIP.wormhole, 60, 2);
      }
    });
  }

  const ur = byId.uranus;
  if (Math.hypot(ship.x - ur.x, ship.y - ur.y) < 280) {
    sayOnce('uranus', BIP.uranus, 60, 1);
    if (Math.random() < 0.15) particles.push({ x: ship.x + rand(-30, 30), y: ship.y + rand(-30, 30), vx: rand(-20, 20), vy: -40, life: 0, max: 1.2, size: rand(3, 6), color: '#A6E86A' });
  }
}

/** Remplir la soute près d'une mine */
function updateExtraction(dt) {
  let best = null, bestD = Infinity;
  for (const b of bodies) {
    if (!b.res) continue;
    const d = Math.hypot(ship.x - b.x, ship.y - b.y);
    if (d < b.range && d / b.range < bestD) { best = b; bestD = d / b.range; }
  }
  if (!best || ship.spaghetti > 0) {
    extract = { res: null, p: Math.max(0, extract.p - dt * 3) };
    return;
  }
  const res = best.res;
  const r = RESOURCES[res];
  if (!game.seen[res]) {
    game.seen[res] = true;
    showFactCard(res);
    saveGame();
  }
  if (outstanding(res) <= carried(res)) {
    extract = { res: null, p: 0 };
    if ((cooldowns[`need-${res}`] || 0) < performance.now()) {
      cooldowns[`need-${res}`] = performance.now() + 9000;
      addFloater(game.quests.length ? `Pas besoin de ${r.icon}` : `${r.icon} ${r.name}`, best.x, best.y - best.r - 40, 'rgba(255,255,255,0.8)', 20);
      if (!game.quests.length) sayOnce('noQuest', "Prends d'abord une quête chez un personnage avec un « ! ». Ensuite, je remplirai la soute !", 30, 2);
      else sayOnce('notNeeded', LINES.notNeeded, 20, 1);
    }
    return;
  }
  if (game.cargo.length >= capacity()) {
    extract = { res: null, p: 0 };
    if ((cooldowns.fullFloat || 0) < performance.now()) {
      cooldowns.fullFloat = performance.now() + 4000;
      addFloater('Soute pleine !', ship.x, ship.y - 44, '#FF6F91', 22);
      sfx.full();
    }
    sayOnce('cargoFull', LINES.cargoFull, 25, 2);
    return;
  }
  if (extract.res !== res) extract = { res, p: 0, body: best };
  extract.body = best;
  extract.p += dt / EXTRACT_TIME;
  if (extract.p >= 1) {
    extract.p = 0;
    game.cargo.push(res);
    sfx.load();
    floaters.push({ text: r.icon, x: best.x, y: best.y, tx: ship.x, ty: ship.y, life: 0, max: 0.45, size: 24, fly: true });
    addFloater(`+1 ${r.icon}`, ship.x, ship.y - 40, '#FFFFFF', 20);
    const q = game.quests.find((x) => x.needs[res]);
    if (!game.tips.firstLoad && q && Object.keys(q.needs).every((r) => outstanding(r) <= carried(r))) {
      game.tips.firstLoad = true;
      say(LINES.firstLoad(CHAR_BY_ID[q.char].name), 3, 5000);
    }
    renderUI();
  }
}

/** Rencontres : habitants, marchands, et la Terre à vendre.
 *  La première fois, la fenêtre s'ouvre toute seule. Si on l'a refermée,
 *  il faut ralentir à côté pour la rouvrir (sinon elle s'ouvrirait à chaque passage). */
function canPopup(id) {
  return !dismissed.has(id) || Math.hypot(ship.vx, ship.vy) < SLOW_SPEED;
}

function hintSlow(id, pos, who) {
  if ((cooldowns[`slow-${id}`] || 0) > performance.now()) return;
  cooldowns[`slow-${id}`] = performance.now() + 5000;
  addFloater(`Ralentis pour voir ${who}`, pos.x, pos.y - 80, '#9EE7FF', 18);
}

function updateVisits() {
  if (ship.spaghetti > 0 || !dialogEl.hidden) return;
  CHARACTERS.forEach((c) => {
    const pos = charPos(c.id);
    const d = dist(ship, pos);
    if (d < CHAR_RANGE) {
      if (!near.has(c.id)) {
        near.add(c.id);
        arriveAtChar(c);
      } else if (!offerShown.has(c.id) && game.offers[c.id] && !game.quests.some((q) => q.char === c.id) && canPopup(c.id)) {
        offerShown.add(c.id);
        openOffer(c.id);
      }
    } else if (d > CHAR_RANGE + 60) {
      near.delete(c.id);
      offerShown.delete(c.id);
    }
  });
  SHOPS.forEach((sh) => {
    const pos = SHOP_POS[sh.id];
    const d = dist(ship, pos);
    if (d < SHOP_RANGE) {
      if (near.has(sh.id)) return;
      if (canPopup(sh.id)) {
        near.add(sh.id);
        openShop(sh.id);
      } else hintSlow(sh.id, pos, sh.who);
    } else if (d > SHOP_RANGE + 60) near.delete(sh.id);
  });
  const earth = byId.terre;
  const d = dist(ship, earth);
  if (d < earth.r + 70) {
    if (near.has('terre') || game.won) return;
    if (game.gold < EARTH_PRICE) {
      near.add('terre');
      sayOnce('earthPrice', LINES.earthPrice, 40, 1);
      addFloater(`À vendre : ${EARTH_PRICE} 💰`, earth.x, earth.y - earth.r - 30, '#FFD24A', 22);
    } else if (canPopup('terre')) {
      near.add('terre');
      openBuyEarth();
    } else hintSlow('terre', earth, 'la Terre');
  } else if (d > earth.r + 130) near.delete('terre');
}

function arriveAtChar(c) {
  const hadQuest = game.quests.some((q) => q.char === c.id);
  const delivered = deliverTo(c.id);
  const q = game.quests.find((x) => x.char === c.id);
  if (q) {
    if (!delivered) talk[c.id] = { text: `Il me manque encore : ${needsText(q)}`, until: worldT + 4 };
    return;
  }
  if (hadQuest) return;             // quête terminée à l'instant
  if (!game.offers[c.id]) {
    talk[c.id] = { text: 'Reviens bientôt, je réfléchis à une nouvelle commande…', until: worldT + 3.5 };
  } else if (canPopup(c.id)) {
    offerShown.add(c.id);
    openOffer(c.id);
  } else {
    hintSlow(c.id, charPos(c.id), c.name);
  }
}

function needsText(q) {
  return Object.entries(q.needs)
    .filter(([r, n]) => (q.got[r] || 0) < n)
    .map(([r, n]) => `${RESOURCES[r].icon}×${n - (q.got[r] || 0)}`)
    .join(' ');
}

/* ---------- Caisses perdues et pièces d'or ---------- */
function spillCargo(fromX, fromY) {
  game.cargo.forEach((res) => {
    const a = Math.random() * TAU, s = rand(90, 220);
    crates.push({ res, x: fromX, y: fromY, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: CRATE_LIFE, delay: 0.8, rot: rand(0, TAU), spin: rand(-2, 2) });
  });
  game.cargo = [];
  renderUI();
}

function updateCratesAndCoins(dt) {
  for (const c of crates) {
    c.life -= dt;
    c.delay -= dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    const k = Math.pow(0.4, dt);
    c.vx *= k;
    c.vy *= k;
    c.rot += c.spin * dt;
    if (c.delay <= 0 && ship.spaghetti <= 0 && dist(c, ship) < 40) {
      if (game.cargo.length < capacity()) {
        game.cargo.push(c.res);
        c.life = 0;
        sfx.load();
        addFloater(`+1 ${RESOURCES[c.res].icon}`, ship.x, ship.y - 40, '#FFFFFF', 20);
        renderUI();
      } else if ((cooldowns.fullFloat || 0) < performance.now()) {
        cooldowns.fullFloat = performance.now() + 3000;
        addFloater('Soute pleine !', ship.x, ship.y - 44, '#FF6F91', 22);
      }
    }
  }
  crates = crates.filter((c) => c.life > 0);

  for (const c of coins) {
    c.t += dt;
    c.spin += dt * 8;
    if (c.t > 0.35) {
      // aimantées par la fusée
      const dx = ship.x - c.x, dy = ship.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = 300 + c.t * 900;
      c.vx += ((dx / d) * sp - c.vx) * Math.min(1, dt * 6);
      c.vy += ((dy / d) * sp - c.vy) * Math.min(1, dt * 6);
      if (d < 22) {
        c.done = true;
        if (Math.random() < 0.4) sfx.coin();
      }
    } else {
      c.vx *= Math.pow(0.1, dt);
      c.vy *= Math.pow(0.1, dt);
    }
    c.x += c.vx * dt;
    c.y += c.vy * dt;
  }
  coins = coins.filter((c) => !c.done && c.t < 4);
}

/* ---------- OVNI, missiles et laser ---------- */
const ufoTarget = () => 4 + Math.min(3, Math.floor((game ? game.earned : 0) / 300));

function spawnUfo(anywhere = false) {
  for (let tries = 0; tries < 40; tries++) {
    const p = polar(rand(0, TAU), rand(SAFE_R + 450, WORLD_R - 300));
    if (ship && dist(p, ship) < (anywhere ? 900 : 1300)) continue;
    if (dist(p, byId.trounoir) < 700) continue;
    ufos.push({ x: p.x, y: p.y, hx: p.x, hy: p.y, vx: 0, vy: 0, hp: UFO_HP, fire: rand(1.2, 2.2), hit: 0, phase: rand(0, TAU), chasing: false, orbit: rand(0, TAU) });
    return;
  }
}

function updateUfos(dt) {
  if (ufos.length < ufoTarget()) {
    ufoRespawn -= dt;
    if (ufoRespawn <= 0) {
      spawnUfo();
      ufoRespawn = UFO_RESPAWN;
    }
  }
  const shipSafe = Math.hypot(ship.x, ship.y) < SAFE_R || ship.spaghetti > 0;
  for (const u of ufos) {
    const d = dist(u, ship);
    const fromHome = Math.hypot(u.x - u.hx, u.y - u.hy);
    const chase = !shipSafe && d < UFO_SIGHT && fromHome < UFO_LEASH;
    if (chase && !u.chasing && !game.tips.firstUfo) {
      game.tips.firstUfo = true;
      say(LINES.firstUfo, 4, 8000);
    }
    u.chasing = chase;
    let tx, ty;
    if (chase) {
      // il tourne autour de la fusée en gardant ses distances
      u.orbit += dt * 0.7;
      tx = ship.x + Math.cos(u.orbit) * 300;
      ty = ship.y + Math.sin(u.orbit) * 300;
      u.fire -= dt;
      if (u.fire <= 0) {
        fireMissile(u);
        u.fire = rand(2.6, 3.6);
      }
    } else {
      tx = u.hx + Math.sin(worldT * 0.4 + u.phase) * 240;
      ty = u.hy + Math.cos(worldT * 0.31 + u.phase) * 170;
      u.fire = Math.max(u.fire, 1.2);
    }
    let dvx = (tx - u.x) * 1.5, dvy = (ty - u.y) * 1.5;
    const sp = Math.hypot(dvx, dvy);
    if (sp > UFO_SPEED) { dvx *= UFO_SPEED / sp; dvy *= UFO_SPEED / sp; }
    u.vx += (dvx - u.vx) * Math.min(1, dt * 2);
    u.vy += (dvy - u.vy) * Math.min(1, dt * 2);
    u.x += u.vx * dt;
    u.y += u.vy * dt;
    // la zone calme est interdite aux OVNI
    const ud = Math.hypot(u.x, u.y);
    if (ud < SAFE_R + 60) { u.x *= (SAFE_R + 60) / ud; u.y *= (SAFE_R + 60) / ud; }
    if (ud > WORLD_R - 150) { u.x *= (WORLD_R - 150) / ud; u.y *= (WORLD_R - 150) / ud; }
    u.hit = Math.max(0, u.hit - dt);
  }
}

function fireMissile(u) {
  const a = Math.atan2(ship.y - u.y, ship.x - u.x);
  missiles.push({ x: u.x, y: u.y, a, speed: 140, life: MISSILE_LIFE });
  sfx.missile();
  sayOnce('missile', LINES.missile, 14, 2);
}

function updateMissiles(dt) {
  for (const m of missiles) {
    m.life -= dt;
    m.speed = Math.min(MISSILE_SPEED, m.speed + 400 * dt);
    if (ship.spaghetti <= 0) {
      const want = Math.atan2(ship.y - m.y, ship.x - m.x);
      let diff = ((want - m.a + Math.PI) % TAU + TAU) % TAU - Math.PI;
      diff = clamp(diff, -MISSILE_TURN * dt, MISSILE_TURN * dt);
      m.a += diff;
    }
    m.x += Math.cos(m.a) * m.speed * dt;
    m.y += Math.sin(m.a) * m.speed * dt;
    if (Math.random() < 0.7) {
      particles.push({ x: m.x - Math.cos(m.a) * 12, y: m.y - Math.sin(m.a) * 12, vx: rand(-20, 20), vy: rand(-20, 20), life: 0, max: rand(0.3, 0.6), size: rand(2, 3.5), color: Math.random() < 0.5 ? '#FF8A3C' : '#C9CED8' });
    }
    if (ship.spaghetti <= 0 && dist(m, ship) < 24) {
      m.life = 0;
      hitShip(m);
    } else if (Math.hypot(m.x, m.y) < SUN_BURN) {
      m.life = 0;
    }
    if (m.life <= 0) burst(m.x, m.y, 14, ['#FF8A3C', '#FFC93C', '#FFFFFF'], 180);
  }
  missiles = missiles.filter((m) => m.life > 0);
}

function hitShip(m) {
  if (ship.invul > 0) return;
  if (shieldTime() && shieldCharge >= 1) {
    shieldCharge = 0;
    ship.invul = 0.8;
    sfx.shield();
    flash = { a: 0.5, color: '158,231,255' };
    addFloater('🛡️ Bouclier !', ship.x, ship.y - 44, '#9EE7FF', 24);
    sayOnce('shield', LINES.shield, 10, 2);
    return;
  }
  ship.invul = 2.2;
  ship.spin = 0.6;
  ship.vx += Math.cos(m.a) * 260;
  ship.vy += Math.sin(m.a) * 260;
  shake = Math.max(shake, 0.6);
  flash = { a: 0.6, color: '255,120,90' };
  sfx.crash();
  buzz([100, 50, 150]);
  burst(ship.x, ship.y, 40, ['#FF8A3C', '#FFC93C', '#FFFFFF', '#FF6F91'], 300);
  if (game.cargo.length) {
    addFloater('Chargement perdu !', ship.x, ship.y - 50, '#FF6F91', 26);
    spillCargo(ship.x, ship.y);
    say(pick(LINES.hit), 4, 5000);
  } else {
    say(pick(LINES.hitEmpty), 3, 3500);
  }
  saveGame();
}

function nearestUfo(range) {
  let best = null, bd = range;
  for (const u of ufos) {
    const d = dist(u, ship);
    if (d < bd) { bd = d; best = u; }
  }
  return best;
}

function tryFire(manual = false) {
  if (state !== 'playing' || isBlocked() || ship.spaghetti > 0) return;
  const w = weapon();
  if (!w) {
    if (manual) sayOnce('noWeapon', LINES.noWeapon, 8, 2);
    return;
  }
  if (fireCd > 0) return;
  fireCd = w.cd;
  // visée automatique : l'OVNI le plus proche (en visant un peu devant lui)
  const target = nearestUfo(FIRE_RANGE);
  let a = ship.angle;
  if (target) {
    const t = dist(target, ship) / BOLT_SPEED;
    a = Math.atan2(target.y + target.vy * t - ship.y, target.x + target.vx * t - ship.x);
    ship.angle = a;
  }
  const nx = Math.cos(a), ny = Math.sin(a);
  for (let i = 0; i < w.bolts; i++) {
    const off = w.bolts > 1 ? (i ? 8 : -8) : 0;
    bolts.push({
      x: ship.x + nx * 24 - ny * off, y: ship.y + ny * 24 + nx * off,
      vx: nx * BOLT_SPEED + ship.vx * 0.5, vy: ny * BOLT_SPEED + ship.vy * 0.5,
      life: BOLT_LIFE, dmg: w.dmg, color: w.color, big: !!w.big,
    });
  }
  sfx.laser();
}

function updateBolts(dt) {
  fireCd = Math.max(0, fireCd - dt);
  if (fireHeld) tryFire();
  for (const b of bolts) {
    b.life -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    for (const u of ufos) {
      if (u.hp > 0 && Math.hypot(b.x - u.x, b.y - u.y) < 36) {
        b.life = 0;
        u.hp -= b.dmg;
        u.hit = 0.15;
        sfx.ufoHit();
        burst(b.x, b.y, 6, [b.color, '#FFFFFF'], 140);
        if (u.hp <= 0) killUfo(u);
        break;
      }
    }
    if (b.life > 0) {
      for (const m of missiles) {
        if (Math.hypot(b.x - m.x, b.y - m.y) < 20) {
          m.life = 0;
          b.life = 0;
          burst(m.x, m.y, 14, ['#FF8A3C', '#FFC93C', '#FFFFFF'], 180);
          addFloater('Missile détruit !', m.x, m.y - 24, '#9EE7FF', 18);
          break;
        }
      }
    }
  }
  bolts = bolts.filter((b) => b.life > 0);
  missiles = missiles.filter((m) => m.life > 0);
}

function killUfo(u) {
  ufos = ufos.filter((x) => x !== u);
  const loot = 30 + 5 * randInt(0, 4);
  game.ufoKills += 1;
  sfx.boom();
  shake = Math.max(shake, 0.4);
  flash = { a: 0.35, color: '255,220,150' };
  burst(u.x, u.y, 60, ['#7CE07A', '#FFC93C', '#FFFFFF', '#FF8A3C'], 360);
  spawnCoins(u.x, u.y, 18);
  addFloater(`+${loot} 💰`, u.x, u.y - 40, '#FFD24A', 30);
  addGold(loot);
  ufoRespawn = Math.max(ufoRespawn, UFO_RESPAWN);
  sayOnce('kill', LINES.kill, 6, 2);
  renderUI();
  saveGame();
}

function updateEffects(dt) {
  for (const p of particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.2, dt);
    p.vy *= Math.pow(0.2, dt);
  }
  particles = particles.filter((p) => p.life < p.max);
  if (particles.length > 700) particles.splice(0, particles.length - 700);

  for (const f of floaters) {
    f.life += dt;
    if (!f.fly) f.y -= 34 * dt;
  }
  floaters = floaters.filter((f) => f.life < f.max);

  flash.a = Math.max(0, flash.a - dt * 3);
  shake = Math.max(0, shake - dt);
}

function update(dt, now) {
  if (state === 'playing' && !isBlocked()) {
    worldT += dt;
    updateBodies(dt);
    updateShip(dt, now);
    updateHazards(now);
    updateExtraction(dt);
    updateVisits();
    updateOffers();
    updateCratesAndCoins(dt);
    updateUfos(dt);
    updateMissiles(dt);
    updateBolts(dt);
    if (shieldTime()) shieldCharge = Math.min(1, shieldCharge + dt / shieldTime());
    updateEffects(dt);
    if (now > saveAt) {
      saveAt = now + 4000;
      saveGame();
    }
  } else if (state === 'ready') {
    // derrière l'écran de départ, les planètes tournent doucement
    worldT += dt * 0.3;
    updateBodies(0);
    updateEffects(dt);
  }
}

/* ---------- Dessin ---------- */
function drawBackground(now) {
  const g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, '#0B0F33');
  g.addColorStop(1, '#05061A');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);

  const tiled = (img, size, factor, draw) => {
    const ox = -(((ship.x * factor) % size) + size) % size;
    const oy = -(((ship.y * factor) % size) + size) % size;
    for (let x = ox; x < viewW; x += size) {
      for (let y = oy; y < viewH; y += size) draw(img, x, y, size);
    }
  };
  tiled(hazeTile, 1024, 0.15, (img, x, y, s) => ctx.drawImage(img, x, y, s, s));
  const t = now / 1000;
  for (const layer of starTiles) {
    tiled(layer.canvas, TILE, layer.factor, (img, x, y, s) => {
      ctx.drawImage(img, x, y, s, s);
      for (const tw of layer.twinkles) {
        const a = 0.3 + 0.7 * Math.abs(Math.sin(t * tw.speed + tw.phase));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(x + tw.x, y + tw.y, tw.s, 0, TAU);
        ctx.fill();
      }
    });
  }
  const sp = Math.hypot(ship.vx, ship.vy);
  if (sp > maxSpeed() + 60) {
    const k = Math.min(1, (sp - maxSpeed()) / (TURBO_SPEED - maxSpeed()));
    const nx = ship.vx / sp, ny = ship.vy / sp;
    ctx.save();
    ctx.strokeStyle = `rgba(200,235,255,${0.35 * k})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * viewW, y = Math.random() * viewH;
      const l = rand(40, 120) * k;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - nx * l, y - ny * l);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function inView(x, y, margin) {
  return Math.abs(x - ship.x) < viewW / 2 + margin && Math.abs(y - ship.y) < viewH / 2 + margin;
}

function drawOrbits() {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 14]);
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  const sd = Math.hypot(ship.x, ship.y);
  const reach = Math.hypot(viewW, viewH) / 2;
  for (const p of PLANETS) {
    if (Math.abs(p.dist - sd) > reach) continue;
    ctx.beginPath();
    ctx.arc(0, 0, p.dist, 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Frontière de la zone calme : les OVNI ne la franchissent jamais
  if (Math.abs(SAFE_R - sd) < reach + 40) {
    ctx.strokeStyle = 'rgba(124,240,160,0.18)';
    ctx.lineWidth = 6;
    ctx.setLineDash([4, 18]);
    ctx.beginPath();
    ctx.arc(0, 0, SAFE_R, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (Math.abs((BELT.inner + BELT.outer) / 2 - sd) < reach + 200) {
    ctx.strokeStyle = 'rgba(200,170,130,0.06)';
    ctx.lineWidth = BELT.outer - BELT.inner + 60;
    ctx.beginPath();
    ctx.arc(0, 0, (BELT.inner + BELT.outer) / 2, 0, TAU);
    ctx.stroke();
  }

  if (sd > WORLD_R - reach - 20) {
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(255,111,145,0.25)';
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -worldT * 30;
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_R, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWormholes() {
  for (const w of WORMHOLES) {
    if (!inView(w.x, w.y, 120)) continue;
    ctx.save();
    ctx.translate(w.x, w.y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
    g.addColorStop(0, 'rgba(10,0,30,1)');
    g.addColorStop(0.35, 'rgba(120,60,220,0.8)');
    g.addColorStop(1, 'rgba(120,60,220,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, TAU);
    ctx.fill();
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${i % 2 ? '127,216,255' : '210,160,255'},${0.7 - i * 0.1})`;
      ctx.beginPath();
      const a0 = worldT * (2 + i * 0.4) + i * 1.3;
      ctx.arc(0, 0, 18 + i * 12, a0, a0 + 3.6);
      ctx.stroke();
    }
    ctx.font = '700 16px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,190,255,0.85)';
    ctx.fillText('Trou de ver (raccourci)', 0, 108);
    ctx.restore();
  }
}

function drawBody(b) {
  const art = b.art || arts[b.id];
  const scale = b.rock ? b.r / 24 : 1;
  const half = art.half * scale;
  if (!inView(b.x, b.y, half)) return;
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.rot) ctx.rotate(b.rot);
  if (b.id === 'comete') {
    ctx.drawImage(art.canvas, -half - 0.6 * b.r, -half + 0.6 * b.r, half * 2, half * 2);
  } else {
    ctx.drawImage(art.canvas, -half, -half, half * 2, half * 2);
  }
  ctx.restore();

  if (b.id === 'trounoir') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const life = ((worldT * 0.25 + i / 40) % 1);
      const d = 300 * (1 - life) + 30;
      const a = i * 2.4 + life * 9;
      ctx.fillStyle = `rgba(255,${150 + (i % 3) * 30},80,${0.6 * life})`;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d * 0.6, 2 + life * 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function textOutlined(text, x, y, color, font, width = 4) {
  ctx.font = font;
  if (width > 0) {
    ctx.lineWidth = width;
    ctx.strokeStyle = 'rgba(7,9,32,0.85)';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawLabels() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const b of bodies) {
    if (!inView(b.x, b.y, b.r + 60)) continue;
    const y = b.y + (b.id === 'saturne' ? b.r * 0.85 : b.id === 'galaxie' || b.id === 'nebuleuse' ? b.r * 0.95 : b.r + 22);
    textOutlined(b.obj.name, b.x, y, 'rgba(255,255,255,0.85)', '700 17px "Baloo 2", "Quicksand", sans-serif');
    if (b.res) {
      const r = RESOURCES[b.res];
      const wanted = outstanding(b.res) > carried(b.res);
      const label = `${r.icon} ${r.name}`;
      ctx.font = '700 15px "Baloo 2", "Quicksand", sans-serif';
      const w = ctx.measureText(label).width + 18;
      ctx.fillStyle = wanted ? 'rgba(255,201,60,0.95)' : 'rgba(11,15,51,0.8)';
      ctx.beginPath();
      ctx.roundRect(b.x - w / 2, y + 12, w, 24, 12);
      ctx.fill();
      ctx.fillStyle = wanted ? '#2E2A4D' : '#FFFFFF';
      ctx.fillText(label, b.x, y + 25);
    }
  }
  ctx.restore();
}

/** Anneau qui tourne autour des mines dont on a besoin */
function drawWantedMines() {
  for (const b of bodies) {
    if (!b.res || !inView(b.x, b.y, b.r + 40)) continue;
    if (outstanding(b.res) <= carried(b.res)) continue;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,201,60,0.75)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -worldT * 30;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.range - 10 + Math.sin(worldT * 4) * 3, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawExtraction() {
  if (!extract.res || extract.p <= 0 || !extract.body) return;
  const b = extract.body;
  ctx.save();
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, 34, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = RESOURCES[extract.res].color;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, 34, -Math.PI / 2, -Math.PI / 2 + extract.p * TAU);
  ctx.stroke();
  // faisceau d'aspiration entre la mine et la fusée
  ctx.globalAlpha = 0.35 + Math.sin(worldT * 20) * 0.1;
  ctx.strokeStyle = RESOURCES[extract.res].color;
  ctx.lineWidth = 10;
  ctx.setLineDash([6, 10]);
  ctx.lineDashOffset = worldT * 60;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(ship.x, ship.y);
  ctx.stroke();
  ctx.restore();
}

function drawSpeech(x, y, text, maxW = 230) {
  ctx.save();
  ctx.font = '700 15px "Quicksand", sans-serif';
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  lines.push(line);
  const w = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width))) + 20;
  const h = lines.length * 19 + 12;
  const bx = x - w / 2, by = y - h - 12;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 8, by + h);
  ctx.lineTo(x, by + h + 10);
  ctx.lineTo(x + 8, by + h);
  ctx.fill();
  ctx.fillStyle = '#2E2A4D';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x, by + 7 + i * 19));
  ctx.restore();
}

function drawCharacters() {
  for (const c of CHARACTERS) {
    const p = charPos(c.id);
    if (!inView(p.x, p.y, 120)) continue;
    const q = game.quests.find((x) => x.char === c.id);
    const offer = game.offers[c.id];
    const canDeliver = q && Object.keys(q.needs).some((r) => carried(r) > 0 && (q.got[r] || 0) < q.needs[r]);
    const bob = Math.sin(worldT * 2 + c.id.length) * 4;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    // halo
    const col = canDeliver ? '124,240,160' : q ? '79,184,232' : offer ? '255,201,60' : '200,200,255';
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 52);
    g.addColorStop(0, `rgba(${col},0.45)`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, TAU);
    ctx.fill();
    // petit disque où il se tient
    ctx.fillStyle = 'rgba(200,210,235,0.9)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 30, 8, 0, 0, TAU);
    ctx.fill();
    drawCharacter(ctx, c.id, 27, worldT);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    textOutlined(c.name, p.x, p.y + bob + 50, '#FFFFFF', '800 16px "Baloo 2", sans-serif');
    // ce qu'il attend
    if (offer && !q) {
      const jump = Math.abs(Math.sin(worldT * 5)) * 8;
      ctx.fillStyle = '#FFC93C';
      ctx.strokeStyle = '#2E2A4D';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x + 26, p.y + bob - 36 - jump, 14, 0, TAU);
      ctx.fill();
      ctx.stroke();
      textOutlined('!', p.x + 26, p.y + bob - 35 - jump, '#2E2A4D', '800 22px "Baloo 2", sans-serif', 0);
    } else if (q) {
      const txt = needsText(q);
      ctx.font = '700 15px "Baloo 2", sans-serif';
      const w = ctx.measureText(txt).width + 16;
      ctx.fillStyle = canDeliver ? 'rgba(88,201,123,0.95)' : 'rgba(11,15,51,0.85)';
      ctx.beginPath();
      ctx.roundRect(p.x - w / 2, p.y + bob - 66, w, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(txt, p.x, p.y + bob - 53);
    }
    ctx.restore();
    const tk = talk[c.id];
    if (tk && tk.until > worldT) drawSpeech(p.x, p.y + bob - (q ? 70 : 40), tk.text);
  }
}

function drawShops() {
  for (const s of SHOPS) {
    const p = SHOP_POS[s.id];
    if (!inView(p.x, p.y, 140)) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    // station : plateforme, auvent rayé et lumières
    ctx.fillStyle = '#5A6488';
    ctx.beginPath();
    ctx.ellipse(0, 34, 62, 16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8C97BC';
    ctx.beginPath();
    ctx.ellipse(0, 30, 62, 14, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + worldT;
      ctx.fillStyle = Math.sin(worldT * 4 + i) > 0 ? '#FFC93C' : '#FF6F91';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 54, 30 + Math.sin(a) * 11, 3, 0, TAU);
      ctx.fill();
    }
    drawCharacter(ctx, s.id, 26, worldT);
    const stripes = ['#FF6F91', '#FFFFFF'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = stripes[i % 2];
      ctx.beginPath();
      ctx.moveTo(-60 + i * 20, -44);
      ctx.lineTo(-40 + i * 20, -44);
      ctx.lineTo(-40 + i * 20, -34);
      ctx.quadraticCurveTo(-50 + i * 20, -26, -60 + i * 20, -34);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 16px "Baloo 2", sans-serif';
    const label = `${s.icon} ${s.name}`;
    const w = ctx.measureText(label).width + 22;
    ctx.fillStyle = '#FFFCF3';
    ctx.strokeStyle = '#2E2A4D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(p.x - w / 2, p.y - 76, w, 28, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2E2A4D';
    ctx.fillText(label, p.x, p.y - 61);
    ctx.restore();
  }
}

/** Le panneau « À VENDRE » planté à côté de la Terre */
function drawEarthSign() {
  const e = byId.terre;
  if (!inView(e.x, e.y, 200) || game.won) return;
  const x = e.x + e.r + 38, y = e.y - e.r + 6;
  ctx.save();
  ctx.fillStyle = '#8A5A2B';
  ctx.fillRect(x - 3, y, 6, 50);
  ctx.translate(x, y);
  ctx.rotate(Math.sin(worldT * 1.5) * 0.04);
  ctx.fillStyle = '#FFFCF3';
  ctx.strokeStyle = '#8A5A2B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-52, -44, 104, 50, 8);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#E85757';
  ctx.font = '800 17px "Baloo 2", sans-serif';
  ctx.fillText('À VENDRE', 0, -30);
  ctx.fillStyle = '#2E2A4D';
  ctx.font = '800 16px "Baloo 2", sans-serif';
  ctx.fillText(`${EARTH_PRICE} 💰`, 0, -10);
  ctx.restore();
}

function drawCrates() {
  for (const c of crates) {
    if (!inView(c.x, c.y, 30)) continue;
    if (c.life < 4 && Math.floor(c.life * 6) % 2) continue;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = '#C98A4B';
    ctx.strokeStyle = '#7A4E22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 30, 5);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-c.rot);
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(RESOURCES[c.res].icon, 0, 1);
    ctx.restore();
  }
}

function drawCoins() {
  for (const c of coins) {
    if (!inView(c.x, c.y, 20)) continue;
    const w = Math.abs(Math.cos(c.spin)) * 8 + 2;
    ctx.fillStyle = '#FFD24A';
    ctx.strokeStyle = '#C99212';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, w, 10, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

function drawUfos() {
  for (const u of ufos) {
    if (!inView(u.x, u.y, 80)) continue;
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate(Math.sin(worldT * 3 + u.phase) * 0.15);
    if (u.chasing) {
      // rayon rouge menaçant
      ctx.fillStyle = `rgba(255,80,80,${0.12 + Math.sin(worldT * 8) * 0.05})`;
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, TAU);
      ctx.fill();
    }
    if (u.hit > 0) ctx.filter = 'brightness(2.5)';
    ctx.drawImage(ufoArt.canvas, -ufoArt.half, -ufoArt.half, ufoArt.half * 2, ufoArt.half * 2);
    ctx.restore();
    if (u.hp < UFO_HP) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(u.x - 26, u.y - 52, 52, 7);
      ctx.fillStyle = '#7CF0A0';
      ctx.fillRect(u.x - 26, u.y - 52, 52 * (u.hp / UFO_HP), 7);
    }
  }
}

function drawMissiles() {
  for (const m of missiles) {
    if (!inView(m.x, m.y, 30)) continue;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.a);
    ctx.fillStyle = '#E85757';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(4, -5);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-10, 5);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-4, -5, 3, 10);
    ctx.fillStyle = '#FFC93C';
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-18 - Math.random() * 6, 0);
    ctx.lineTo(-10, 4);
    ctx.fill();
    ctx.restore();
  }
}

function drawBolts() {
  ctx.save();
  ctx.lineCap = 'round';
  for (const b of bolts) {
    const sp = Math.hypot(b.vx, b.vy);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.big ? 7 : 4;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - (b.vx / sp) * 22, b.y - (b.vy / sp) * 22);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- La fusée (et ses styles) ---------- */
function shipColors(paintId, t) {
  const p = PAINTS[paintId] || PAINTS.classique;
  const hue = (t * 140) % 360;
  return {
    hull: p.hull,
    accent: p.accent === 'rainbow' ? `hsl(${hue},90%,62%)` : p.accent,
    stripe: p.stripe === 'rainbow' ? `hsl(${(hue + 120) % 360},90%,62%)` : p.stripe,
    flame: p.flame,
  };
}

/** Dessine la fusée pointée vers la droite, centrée sur (0, 0). */
function drawShipShape(c, paintId, accId, t, { thrust = false, turbo = false, crown = false } = {}) {
  const col = shipColors(paintId, t);
  if (thrust || turbo) {
    const f = (turbo ? 26 : 14) + Math.sin(t * 28) * 4 + Math.random() * 4;
    const g = c.createLinearGradient(-17, 0, -17 - f * 1.6, 0);
    g.addColorStop(0, 'rgba(255,255,220,0.95)');
    g.addColorStop(0.4, turbo ? 'rgba(120,210,255,0.9)' : col.flame[0]);
    g.addColorStop(1, 'rgba(255,80,40,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-16, -7);
    c.quadraticCurveTo(-17 - f * 1.6, 0, -16, 7);
    c.closePath();
    c.fill();
  }

  if (accId === 'dragon') {
    const flap = Math.sin(t * 7) * 0.25;
    [-1, 1].forEach((side) => {
      c.save();
      c.scale(1, side);
      c.rotate(-flap);
      c.fillStyle = '#58C97B';
      c.strokeStyle = '#2F7A2A';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(4, -8);
      c.quadraticCurveTo(-2, -34, -14, -38);
      c.quadraticCurveTo(-12, -28, -20, -26);
      c.quadraticCurveTo(-16, -18, -22, -14);
      c.quadraticCurveTo(-12, -10, -8, -6);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    });
  }

  c.fillStyle = col.accent;
  c.strokeStyle = 'rgba(46,42,77,0.4)';
  c.lineWidth = 1;
  [-1, 1].forEach((side) => {
    c.beginPath();
    c.moveTo(-4, side * 8);
    c.lineTo(-20, side * 20);
    c.lineTo(-18, side * 5);
    c.closePath();
    c.fill();
    c.stroke();
  });

  if (accId === 'requin') {
    c.fillStyle = '#7C8DB0';
    c.strokeStyle = 'rgba(46,42,77,0.6)';
    c.beginPath();
    c.moveTo(6, -9);
    c.quadraticCurveTo(-6, -14, -10, -28);
    c.quadraticCurveTo(-4, -16, -12, -9);
    c.closePath();
    c.fill();
    c.stroke();
  }

  const bodyPath = () => {
    c.beginPath();
    c.moveTo(26, 0);
    c.bezierCurveTo(18, -13, -8, -13, -18, -8);
    c.lineTo(-18, 8);
    c.bezierCurveTo(-8, 13, 18, 13, 26, 0);
    c.closePath();
  };
  const bg = c.createLinearGradient(0, -12, 0, 12);
  bg.addColorStop(0, col.hull[0]);
  bg.addColorStop(0.5, col.hull[1]);
  bg.addColorStop(1, col.hull[2]);
  bodyPath();
  c.fillStyle = bg;
  c.fill();
  c.save();
  bodyPath();
  c.clip();
  c.fillStyle = col.accent;
  c.fillRect(15, -14, 14, 28);
  c.fillStyle = col.stripe;
  c.fillRect(-12, -14, 3, 28);
  c.restore();
  bodyPath();
  c.strokeStyle = 'rgba(46,42,77,0.45)';
  c.lineWidth = 1.3;
  c.stroke();

  if (accId === 'yeux') {
    [-5, 5].forEach((y, i) => {
      c.fillStyle = '#FFFFFF';
      c.strokeStyle = '#2E2A4D';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(11, y, 4.6, 0, TAU);
      c.fill();
      c.stroke();
      c.fillStyle = '#2E2A4D';
      c.beginPath();
      c.arc(12 + Math.cos(t * 6 + i) * 1.5, y + Math.sin(t * 7 + i) * 1.5, 2.2, 0, TAU);
      c.fill();
    });
  } else {
    const wg = c.createRadialGradient(1, -2, 1, 3, 0, 7);
    wg.addColorStop(0, '#DFFAFF');
    wg.addColorStop(1, '#2E8BD6');
    c.fillStyle = wg;
    c.beginPath();
    c.arc(3, 0, 6, 0, TAU);
    c.fill();
    c.strokeStyle = '#7C88A8';
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(1, -2, 1.8, 0, TAU);
    c.fill();
  }

  if (accId === 'licorne') {
    c.fillStyle = '#FFD24A';
    c.strokeStyle = '#C99212';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(23, -4);
    c.lineTo(44, 0);
    c.lineTo(23, 4);
    c.closePath();
    c.fill();
    c.stroke();
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(27 + i * 5, -3 + i * 0.7);
      c.lineTo(29 + i * 5, 3 - i * 0.7);
      c.stroke();
    }
  }

  if (crown) {
    c.save();
    c.translate(-2, -11);
    c.fillStyle = '#FFD24A';
    c.strokeStyle = '#C99212';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-8, 0);
    c.lineTo(-8, -9);
    c.lineTo(-4, -4);
    c.lineTo(0, -11);
    c.lineTo(4, -4);
    c.lineTo(8, -9);
    c.lineTo(8, 0);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
}

function drawShip(now) {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  if (state === 'playing' && ship.spaghetti <= 0) {
    // jauge du turbo
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 40, Math.PI * 0.25, Math.PI * 0.75);
    ctx.stroke();
    const full = ship.charge >= 1;
    const k = ship.turbo > 0 ? ship.turbo / TURBO_TIME : ship.charge;
    ctx.strokeStyle = full ? `rgba(158,231,255,${0.7 + Math.sin(now / 150) * 0.3})` : 'rgba(158,231,255,0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 40, Math.PI * 0.75 - k * Math.PI * 0.5, Math.PI * 0.75);
    ctx.stroke();
    // bouclier prêt
    if (shieldTime() && shieldCharge >= 1) {
      ctx.strokeStyle = `rgba(158,231,255,${0.35 + Math.sin(now / 300) * 0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, TAU);
      ctx.stroke();
    }
  }
  if (ship.invul > 0 && Math.floor(ship.invul * 10) % 2) ctx.globalAlpha = 0.4;

  let angle = ship.angle;
  if (ship.spin > 0) angle += (1 - ship.spin / 0.6) * TAU;
  ctx.rotate(angle);
  let sx = 1.15, sy = 1.15;
  if (ship.spaghetti > 0) {
    const k = 1 - ship.spaghetti / 1.8;
    sx *= 1 + k * 4;
    sy *= Math.max(0.12, 1 - k * 0.9);
  }
  ctx.scale(sx, sy);
  if (ship.turbo > 0) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    g.addColorStop(0, 'rgba(158,231,255,0.35)');
    g.addColorStop(1, 'rgba(158,231,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, TAU);
    ctx.fill();
  }
  drawShipShape(ctx, game.paint, game.acc, now / 1000, { thrust: ship.thrust, turbo: ship.turbo > 0, crown: game.won });
  ctx.restore();
}

function drawEffects() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    if (!inView(p.x, p.y, 10)) continue;
    const k = 1 - p.life / p.max;
    ctx.globalAlpha = k;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const f of floaters) {
    if (f.life < 0) continue;
    if (f.fly) {
      // une ressource qui vole d'un endroit à l'autre
      const k = Math.min(1, f.life / f.max);
      const e = k * k * (3 - 2 * k);
      const x = f.x + (f.tx - f.x) * e;
      const y = f.y + (f.ty - f.y) * e - Math.sin(k * Math.PI) * 40;
      ctx.font = `${f.size}px sans-serif`;
      ctx.globalAlpha = 1;
      ctx.fillText(f.text, x, y);
      continue;
    }
    ctx.font = `800 ${f.size}px "Baloo 2", "Quicksand", sans-serif`;
    ctx.globalAlpha = 1 - f.life / f.max;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(7,9,32,0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

/** Ce que la boussole montre autour de la fusée */
function compassTargets() {
  const list = [];
  RESOURCE_IDS.forEach((res) => {
    if (outstanding(res) > carried(res) && game.cargo.length < capacity()) {
      list.push({ x: byId[RESOURCES[res].source].x, y: byId[RESOURCES[res].source].y, icon: RESOURCES[res].icon, color: '#FFC93C' });
    }
  });
  game.quests.forEach((q) => {
    if (Object.keys(q.needs).some((r) => carried(r) > 0 && (q.got[r] || 0) < q.needs[r])) {
      list.push({ ...charPos(q.char), face: q.char, color: '#7CF0A0' });
    }
  });
  if (!game.quests.length || (!list.length && game.quests.length < maxQuests())) {
    CHARACTERS.forEach((c) => {
      if (game.offers[c.id] && !game.quests.some((q) => q.char === c.id)) list.push({ ...charPos(c.id), face: c.id, color: '#FFC93C', bang: true });
    });
  }
  if (crates.length) {
    const c = crates.reduce((a, b) => (dist(a, ship) < dist(b, ship) ? a : b));
    list.push({ x: c.x, y: c.y, icon: '📦', color: '#C98A4B' });
  }
  if (game.gold >= EARTH_PRICE && !game.won) list.push({ x: byId.terre.x, y: byId.terre.y, img: 'terre', color: '#4FA8F0' });
  return list;
}

function drawCompass() {
  if (state !== 'playing' || ship.spaghetti > 0) return;
  const cx = viewW / 2, cy = viewH / 2;
  const ringR = clamp(Math.min(viewW, viewH) / 2 - 70, 110, 230);
  const placed = [];
  const todo = compassTargets().sort((p, q) => dist(p, ship) - dist(q, ship));
  for (const t of todo) {
    if (inView(t.x, t.y, -30)) continue;
    const a = Math.atan2(t.y - ship.y, t.x - ship.x);
    let r = ringR;
    while (placed.some((p) => Math.hypot(p.x - Math.cos(a) * r, p.y - Math.sin(a) * r) < 46)) r += 48;
    placed.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(20, -10);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(11,15,51,0.88)';
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (t.face) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, TAU);
      ctx.clip();
      ctx.drawImage(faceImgs[t.face], -21, -21, 42, 42);
      ctx.restore();
      if (t.bang) textOutlined('!', 15, -15, '#FFC93C', '800 18px "Baloo 2", sans-serif', 3);
    } else if (t.img) {
      const art = arts[t.img];
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, TAU);
      ctx.clip();
      ctx.drawImage(art.canvas, -38, -38, 76, 76);
      ctx.restore();
    } else {
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.icon, 0, 1);
    }
    ctx.restore();
  }

  // Alerte : missile qui arrive hors de l'écran
  for (const m of missiles) {
    if (inView(m.x, m.y, -20)) continue;
    const a = Math.atan2(m.y - ship.y, m.x - ship.x);
    const r = Math.min(viewW, viewH) / 2 - 30;
    textOutlined('⚠️', cx + Math.cos(a) * r, cy + Math.sin(a) * r, '#FF6F91', '24px sans-serif', 0);
  }
}

function drawMinimap() {
  const w = minimap.width, h = minimap.height;
  if (!w || !h) return;
  const R = Math.min(w, h) / 2;
  const k = (R - 4) / WORLD_R;
  mctx.setTransform(1, 0, 0, 1, 0, 0);
  mctx.clearRect(0, 0, w, h);
  mctx.translate(w / 2, h / 2);
  mctx.fillStyle = 'rgba(7,9,32,0.78)';
  mctx.beginPath();
  mctx.arc(0, 0, R - 1, 0, TAU);
  mctx.fill();
  mctx.strokeStyle = 'rgba(255,255,255,0.25)';
  mctx.lineWidth = 1.5 * dpr;
  mctx.stroke();
  // zone des OVNI
  mctx.fillStyle = 'rgba(255,80,80,0.08)';
  mctx.beginPath();
  mctx.arc(0, 0, R - 1, 0, TAU);
  mctx.arc(0, 0, SAFE_R * k, 0, TAU, true);
  mctx.fill();

  mctx.strokeStyle = 'rgba(255,255,255,0.1)';
  mctx.lineWidth = dpr;
  PLANETS.forEach((p) => {
    mctx.beginPath();
    mctx.arc(0, 0, p.dist * k, 0, TAU);
    mctx.stroke();
  });

  const dot = (x, y, size, color) => {
    mctx.fillStyle = color;
    mctx.beginPath();
    mctx.arc(x * k, y * k, size * dpr, 0, TAU);
    mctx.fill();
  };
  for (const b of bodies) {
    const big = ['soleil', 'jupiter', 'saturne', 'galaxie', 'nebuleuse'].includes(b.id);
    dot(b.x, b.y, b.id === 'soleil' ? 5 : big ? 3.5 : b.r > 40 ? 3 : 2, MAP_COLORS[b.id] || '#FFFFFF');
    if (b.res && outstanding(b.res) > carried(b.res)) {
      mctx.strokeStyle = `rgba(255,201,60,${0.6 + Math.sin(worldT * 5) * 0.4})`;
      mctx.lineWidth = 1.5 * dpr;
      mctx.beginPath();
      mctx.arc(b.x * k, b.y * k, 6 * dpr, 0, TAU);
      mctx.stroke();
    }
  }
  SHOPS.forEach((s) => {
    const p = SHOP_POS[s.id];
    mctx.fillStyle = '#FFFFFF';
    mctx.fillRect(p.x * k - 2.5 * dpr, p.y * k - 2.5 * dpr, 5 * dpr, 5 * dpr);
  });
  CHARACTERS.forEach((c) => {
    const p = charPos(c.id);
    const q = game.quests.find((x) => x.char === c.id);
    const color = q ? '#4FB8E8' : game.offers[c.id] ? '#FFC93C' : '#C9CED8';
    dot(p.x, p.y, 3, color);
  });
  ufos.forEach((u) => dot(u.x, u.y, 2.2, '#FF5A5A'));

  mctx.save();
  mctx.translate(ship.x * k, ship.y * k);
  mctx.rotate(ship.angle);
  mctx.fillStyle = '#FFFFFF';
  mctx.strokeStyle = '#FF6F91';
  mctx.lineWidth = dpr;
  mctx.beginPath();
  mctx.moveTo(6 * dpr, 0);
  mctx.lineTo(-4 * dpr, -4 * dpr);
  mctx.lineTo(-4 * dpr, 4 * dpr);
  mctx.closePath();
  mctx.fill();
  mctx.stroke();
  mctx.restore();
}

function draw(now) {
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
  drawBackground(now);

  const sx = shake > 0 ? (Math.random() - 0.5) * 16 * shake : 0;
  const sy = shake > 0 ? (Math.random() - 0.5) * 16 * shake : 0;
  ctx.save();
  ctx.translate(viewW / 2 - ship.x + sx, viewH / 2 - ship.y + sy);
  drawOrbits();
  drawWormholes();
  bodies.forEach(drawBody);
  rocks.forEach(drawBody);
  drawWantedMines();
  drawEarthSign();
  drawShops();
  drawLabels();
  drawCharacters();
  drawCrates();
  drawExtraction();
  drawUfos();
  drawMissiles();
  drawBolts();
  drawEffects();
  drawCoins();
  drawShip(now);
  ctx.restore();

  drawCompass();

  if (flash.a > 0) {
    ctx.fillStyle = `rgba(${flash.color},${flash.a})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  drawMinimap();
}

/* ---------- Boucle principale ---------- */
let lastFrame = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (state === 'ending') {
    updateEnding(dt);
    drawEnding();
  } else if (ship) {
    update(dt, now);
    updateBip(now);
    draw(now);
  }
  requestAnimationFrame(loop);
}

/* ---------- Panneaux : quêtes, soute, or ---------- */
function renderUI() {
  if (!game) return;
  goldEl.textContent = String(game.gold);
  goldBar.style.width = `${Math.min(100, (game.gold / EARTH_PRICE) * 100)}%`;
  goldEl.parentElement.classList.toggle('rich', game.gold >= EARTH_PRICE);
  cargoCountEl.textContent = `${game.cargo.length}/${capacity()}`;
  $('questCount').textContent = `${game.quests.length}/${maxQuests()}`;
  fireBtn.hidden = !weapon();

  const items = game.quests.map((q, i) => {
    const c = CHAR_BY_ID[q.char];
    const needs = Object.entries(q.needs).map(([r, n]) => {
      const got = q.got[r] || 0;
      const res = RESOURCES[r];
      const cls = got >= n ? ' done' : carried(r) ? ' carry' : '';
      return `<span class="need${cls}" title="${escapeHtml(res.name)} : sur ${escapeHtml(OBJECT_BY_ID[res.source].name)}"><b>${res.icon}</b> ${got}/${n}<small>${escapeHtml(OBJECT_BY_ID[res.source].name)}</small></span>`;
    }).join('');
    return `<li class="q-item">
      <img class="q-face" src="${faces[q.char]}" alt="">
      <div class="q-body">
        <p class="q-top"><strong>${escapeHtml(c.name)}</strong><span class="q-reward">💰 ${q.reward}</span></p>
        <div class="q-needs">${needs}</div>
      </div>
      <button class="q-drop" data-i="${i}" aria-label="Abandonner cette quête" title="Abandonner">✕</button>
    </li>`;
  });
  for (let i = game.quests.length; i < maxQuests(); i++) {
    items.push('<li class="q-item q-empty">Place libre : va voir un personnage avec un <b>!</b></li>');
  }
  questList.innerHTML = items.join('');

  const cap = capacity();
  const slots = [];
  // on range la soute par ressource pour mieux s'y retrouver
  const sorted = game.cargo.slice().sort((a, b) => RESOURCE_IDS.indexOf(a) - RESOURCE_IDS.indexOf(b));
  for (let i = 0; i < cap; i++) {
    const r = sorted[i];
    slots.push(r
      ? `<button class="slot full" data-res="${r}" title="${escapeHtml(RESOURCES[r].name)} (clique pour le jeter)">${RESOURCES[r].icon}</button>`
      : '<span class="slot"></span>');
  }
  cargoSlots.innerHTML = slots.join('');
  $('cargoHead').textContent = `${game.cargo.length}/${cap}`;
}

questList.addEventListener('click', (e) => {
  const btn = e.target.closest('.q-drop');
  if (!btn) return;
  btn.blur();
  const q = game.quests[Number(btn.dataset.i)];
  if (q) openAbandon(q);
});

cargoSlots.addEventListener('click', (e) => {
  const btn = e.target.closest('.slot.full');
  if (!btn || state !== 'playing') return;
  btn.blur();
  const res = btn.dataset.res;
  if (!removeCargo(res)) return;
  // la caisse est jetée derrière la fusée : on peut la reprendre pendant quelques secondes
  const a = ship.angle + Math.PI + rand(-0.5, 0.5);
  crates.push({ res, x: ship.x, y: ship.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: CRATE_LIFE, delay: 2, rot: 0, spin: rand(-2, 2) });
  addFloater(`${RESOURCES[res].icon} jeté`, ship.x, ship.y - 40, '#C9CED8', 18);
  renderUI();
  saveGame();
});

function setQuestCollapsed(collapsed) {
  questPanel.classList.toggle('collapsed', collapsed);
  $('questToggle').setAttribute('aria-expanded', String(!collapsed));
}
$('questToggle').addEventListener('click', (e) => {
  e.currentTarget.blur();
  setQuestCollapsed(!questPanel.classList.contains('collapsed'));
});

/* ---------- Fenêtres (quêtes, marchands, achat de la Terre) ---------- */
function isBlocked() {
  return !dialogEl.hidden || !mapOverlay.hidden || !quitOverlay.hidden || document.hidden;
}

function openDialog(html, actions, cls = '', id = null) {
  dialogId = id;
  dialogCard.className = `dlg-card ${cls}`;
  dialogCard.innerHTML = html;
  dialogActions = actions;
  if (dialogEl.hidden) sfx.open();
  dialogEl.hidden = false;
  Object.keys(keys).forEach((k) => { keys[k] = false; });
  pointer.active = false;
  fireHeld = false;
  const first = dialogCard.querySelector('button.primary:not([disabled])') || dialogCard.querySelector('button');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 30);
}

function closeDialog() {
  if (dialogId) dismissed.add(dialogId);
  dialogId = null;
  dialogEl.hidden = true;
  dialogActions = {};
}

dialogCard.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn || btn.disabled) return;
  const fn = dialogActions[btn.dataset.act];
  if (fn) fn(btn.dataset.arg);
});
dialogEl.addEventListener('click', (e) => { if (e.target === dialogEl) closeDialog(); });

function needRows(needs) {
  return Object.entries(needs).map(([r, n]) => {
    const res = RESOURCES[r];
    return `<li><span class="nr-icon">${res.icon}</span><span class="nr-count">×${n}</span>
      <span class="nr-name">${escapeHtml(res.name)}<small>à prendre sur <img src="${thumbs[res.source]}" alt=""> ${escapeHtml(OBJECT_BY_ID[res.source].name)}</small></span></li>`;
  }).join('');
}

function openOffer(charId) {
  const c = CHAR_BY_ID[charId];
  const offer = game.offers[charId];
  const full = game.quests.length >= maxQuests();
  const html = `
    <div class="dlg-head">
      <img class="dlg-face" src="${faces[charId]}" alt="">
      <div><p class="dlg-name">${escapeHtml(c.name)}</p><p class="dlg-where">habite ${escapeHtml(c.where)}</p></div>
    </div>
    <p class="dlg-say">« ${escapeHtml(offer.reason)} »</p>
    <p class="dlg-sub">📦 Apporte-moi :</p>
    <ul class="need-rows">${needRows(offer.needs)}</ul>
    <p class="dlg-reward">Récompense : <b>💰 ${offer.reward}</b> pièces d'or</p>
    ${full ? `<p class="dlg-warn">${escapeHtml(LINES.noSlot)}</p>` : ''}
    <div class="dlg-actions">
      <button class="primary" data-act="accept" ${full ? 'disabled' : ''}>✅ J'accepte !</button>
      <button class="ghost-btn" data-act="close">Plus tard</button>
    </div>`;
  openDialog(html, { accept: () => acceptOffer(charId), close: closeDialog }, 'dlg-offer', charId);
}

function openAbandon(q) {
  const c = CHAR_BY_ID[q.char];
  openDialog(`
    <p class="dlg-title">Abandonner la quête ?</p>
    <p class="dlg-sub">${escapeHtml(c.name)} attendait : ${escapeHtml(needsText(q))}.<br>Ce que tu as déjà livré sera perdu, mais tu pourras reprendre la quête plus tard.</p>
    <div class="dlg-actions">
      <button class="danger" data-act="yes">Oui, abandonner</button>
      <button class="primary" data-act="close">Non, je continue</button>
    </div>`, {
    yes: () => { abandonQuest(q); closeDialog(); },
    close: closeDialog,
  });
}

/* Les marchands */
function upgradeRow(key) {
  const u = UPGRADES[key];
  const lvl = game.up[key];
  const max = lvl >= u.prices.length;
  const now = u.label(u.values[lvl], lvl);
  const next = max ? '' : u.label(u.values[lvl + 1], lvl + 1);
  const price = max ? 0 : u.prices[lvl];
  const poor = !max && game.gold < price;
  const btn = max
    ? '<span class="shop-max">✓ Maximum</span>'
    : `<button class="buy" data-act="up" data-arg="${key}" ${poor ? 'disabled' : ''}>💰 ${price}</button>`;
  return `<li class="shop-row">
    <span class="sr-icon">${u.icon}</span>
    <span class="sr-text"><b>${escapeHtml(u.name)}</b>
      <small>${max ? escapeHtml(now) : `${escapeHtml(now)} → <b>${escapeHtml(next)}</b>`} · ${escapeHtml(u.help)}</small>
      ${poor ? `<small class="sr-poor">Il te manque ${price - game.gold} 💰</small>` : ''}</span>
    ${btn}
  </li>`;
}

function shipPreview(paintId, accId) {
  const c = document.createElement('canvas');
  c.width = 120;
  c.height = 96;
  const p = c.getContext('2d');
  p.translate(60, 52);
  p.scale(1.7, 1.7);
  p.rotate(-0.35);
  drawShipShape(p, paintId, accId, performance.now() / 1000, { thrust: true });
  return c.toDataURL();
}

function styleCard(kind, id, item) {
  const owned = kind === 'paint' ? game.paints.includes(id) : game.accs.includes(id);
  const equipped = kind === 'paint' ? game.paint === id : game.acc === id;
  const img = kind === 'paint' ? shipPreview(id, game.acc) : shipPreview(game.paint, id);
  const poor = !owned && game.gold < item.price;
  let btn;
  if (equipped) btn = '<span class="shop-max">✓ Sur ta fusée</span>';
  else if (owned) btn = `<button class="buy equip" data-act="${kind}" data-arg="${id}">Mettre</button>`;
  else btn = `<button class="buy" data-act="${kind}" data-arg="${id}" ${poor ? 'disabled' : ''}>💰 ${item.price}</button>`;
  return `<li class="style-card${equipped ? ' on' : ''}"><img src="${img}" alt=""><span>${escapeHtml(item.name)}</span>${btn}</li>`;
}

function openShop(shopId) {
  const s = SHOP_BY_ID[shopId];
  let body;
  if (shopId === 'stella') {
    body = `<p class="dlg-sub">🎨 Peintures</p>
      <ul class="style-grid">${Object.entries(PAINTS).map(([id, p]) => styleCard('paint', id, p)).join('')}</ul>
      <p class="dlg-sub">✨ Décorations</p>
      <ul class="style-grid">${Object.entries(ACCESSORIES).map(([id, a]) => styleCard('acc', id, a)).join('')}</ul>`;
  } else {
    const keysFor = Object.keys(UPGRADES).filter((k) => UPGRADES[k].shop === shopId);
    body = `<ul class="shop-rows">${keysFor.map(upgradeRow).join('')}</ul>`;
  }
  const html = `
    <div class="dlg-head">
      <img class="dlg-face" src="${faces[shopId]}" alt="">
      <div><p class="dlg-name">${s.icon} ${escapeHtml(s.name)}</p><p class="dlg-where">« ${escapeHtml(s.hello)} »</p></div>
      <p class="dlg-gold">💰 ${game.gold}</p>
    </div>
    ${body}
    <div class="dlg-actions"><button class="primary" data-act="close">Au revoir !</button></div>`;
  const reopen = () => {
    const scroll = dialogCard.scrollTop;
    openShop(shopId);
    dialogCard.scrollTop = scroll;
  };
  openDialog(html, {
    close: closeDialog,
    up: (key) => {
      const u = UPGRADES[key];
      const price = u.prices[game.up[key]];
      if (price === undefined || game.gold < price) { sfx.nope(); return; }
      game.gold -= price;
      game.up[key] += 1;
      sfx.buy();
      if (key === 'weapon' && game.up.weapon === 1) say(LINES.firstWeapon, 4, 7000);
      else say(pick(LINES.buy), 2, 3000);
      if (key === 'shield') shieldCharge = 1;
      renderUI();
      saveGame();
      reopen();
    },
    paint: (id) => buyStyle('paint', id, reopen),
    acc: (id) => buyStyle('acc', id, reopen),
  }, shopId === 'stella' ? 'dlg-shop dlg-wide' : 'dlg-shop', shopId);
}

function buyStyle(kind, id, reopen) {
  const list = kind === 'paint' ? game.paints : game.accs;
  const item = kind === 'paint' ? PAINTS[id] : ACCESSORIES[id];
  if (!list.includes(id)) {
    if (game.gold < item.price) { sfx.nope(); return; }
    game.gold -= item.price;
    list.push(id);
    sfx.buy();
    say(pick(LINES.paint), 2, 3000);
  }
  if (kind === 'paint') game.paint = id;
  else game.acc = id;
  renderUI();
  saveGame();
  reopen();
}

function openBuyEarth() {
  openDialog(`
    <div class="earth-buy">
      <img src="${thumbs.terre}" alt="">
      <p class="dlg-title">La Terre est à vendre !</p>
      <p class="dlg-sub">Tu as <b>💰 ${game.gold}</b> pièces d'or. La planète Terre coûte <b>💰 ${EARTH_PRICE}</b>.<br>Veux-tu l'acheter et devenir… le roi de la Terre ?</p>
    </div>
    <div class="dlg-actions">
      <button class="primary royal" data-act="buy">👑 Oui, j'achète la Terre !</button>
      <button class="ghost-btn" data-act="close">Pas encore</button>
    </div>`, {
    buy: () => {
      dialogId = null;
      closeDialog();
      game.gold -= EARTH_PRICE;
      game.won = true;
      saveGame();
      startEnding();
    },
    close: closeDialog,
  }, 'dlg-earth', 'terre');
}

/* ---------- La grande carte ---------- */
function openMap() {
  if (state !== 'playing') return;
  mapOverlay.hidden = false;
  Object.keys(keys).forEach((k) => { keys[k] = false; });
  pointer.active = false;
  renderMapSide();
  drawBigMap();
  sfx.open();
  $('mapClose').focus({ preventScroll: true });
}

function closeMap() {
  mapOverlay.hidden = true;
}

$('mapBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (mapOverlay.hidden) openMap(); else closeMap();
});
$('mapClose').addEventListener('click', closeMap);
mapOverlay.addEventListener('click', (e) => { if (e.target === mapOverlay) closeMap(); });

function renderMapSide() {
  const chars = CHARACTERS.map((c) => {
    const q = game.quests.find((x) => x.char === c.id);
    const offer = game.offers[c.id];
    let status;
    if (q) status = `<span class="ms-tag ms-active">En cours</span> il manque ${escapeHtml(needsText(q))} · 💰 ${q.reward}`;
    else if (offer) {
      const needs = Object.entries(offer.needs).map(([r, n]) => `${RESOURCES[r].icon}×${n}`).join(' ');
      status = `<span class="ms-tag ms-offer">! Quête</span> ${needs} · 💰 ${offer.reward}`;
    } else status = '<span class="ms-tag">…</span> réfléchit à une commande';
    return `<li><img src="${faces[c.id]}" alt=""><span><b>${escapeHtml(c.name)}</b> <small>(${escapeHtml(c.where)})</small><br>${status}</span></li>`;
  }).join('');
  const res = RESOURCE_IDS.map((r) => `<li class="ms-res"><span>${RESOURCES[r].icon}</span> ${escapeHtml(RESOURCES[r].name)} <small>→ ${escapeHtml(OBJECT_BY_ID[RESOURCES[r].source].name)}</small></li>`).join('');
  $('mapSide').innerHTML = `
    <p class="ms-head">Les habitants</p><ul class="ms-list">${chars}</ul>
    <p class="ms-head">Où trouver les ressources</p><ul class="ms-list ms-grid">${res}</ul>
    <p class="ms-note">🟢 Zone calme : pas d'OVNI · 🔴 Zone des OVNI · Les planètes tournent : la carte change avec le temps !</p>`;
}

/* La carte grossit le centre du système solaire, sinon les planètes proches seraient toutes collées */
const MAP_POW = 0.62;
const MOON_GAP = { iss: 20, lune: 36, io: 26, europe: 40, titan: 32 };
const mapRad = (d, R) => R * Math.pow(Math.min(d, WORLD_R) / WORLD_R, MAP_POW);

function mapPoint(x, y, R) {
  const d = Math.hypot(x, y);
  if (d < 1) return { x: 0, y: 0 };
  const r = mapRad(d, R);
  return { x: (x / d) * r, y: (y / d) * r };
}

function mapBody(b, R) {
  if (MOON_GAP[b.id]) {
    const parent = byId[b.parent];
    const p = mapPoint(parent.x, parent.y, R);
    const dx = b.x - parent.x, dy = b.y - parent.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / d) * MOON_GAP[b.id], y: p.y + (dy / d) * MOON_GAP[b.id] };
  }
  return mapPoint(b.x, b.y, R);
}

function drawBigMap() {
  const rect = bigMap.getBoundingClientRect();
  const W = Math.max(1, rect.width), H = Math.max(1, rect.height);
  bigMap.width = Math.round(W * dpr);
  bigMap.height = Math.round(H * dpr);
  const c = bctx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const R = Math.min(W, H) / 2 - 6;
  const mp = (x, y) => mapPoint(x, y, R);
  c.translate(W / 2, H / 2);
  c.fillStyle = '#070920';
  c.beginPath();
  c.arc(0, 0, R, 0, TAU);
  c.fill();
  // zones
  const safe = mapRad(SAFE_R, R);
  c.fillStyle = 'rgba(255,80,80,0.1)';
  c.beginPath();
  c.arc(0, 0, R, 0, TAU);
  c.arc(0, 0, safe, 0, TAU, true);
  c.fill();
  c.fillStyle = 'rgba(124,240,160,0.07)';
  c.beginPath();
  c.arc(0, 0, safe, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(124,240,160,0.4)';
  c.setLineDash([3, 5]);
  c.lineWidth = 1.5;
  c.stroke();
  c.setLineDash([]);
  c.strokeStyle = 'rgba(255,255,255,0.12)';
  c.lineWidth = 1;
  PLANETS.forEach((p) => {
    c.beginPath();
    c.arc(0, 0, mapRad(p.dist, R), 0, TAU);
    c.stroke();
  });
  const b0 = mapRad(BELT.inner, R), b1 = mapRad(BELT.outer, R);
  c.strokeStyle = 'rgba(200,170,130,0.25)';
  c.lineWidth = b1 - b0;
  c.beginPath();
  c.arc(0, 0, (b0 + b1) / 2, 0, TAU);
  c.stroke();
  // trous de ver
  const w0 = mp(WORMHOLES[0].x, WORMHOLES[0].y), w1 = mp(WORMHOLES[1].x, WORMHOLES[1].y);
  c.strokeStyle = 'rgba(185,139,255,0.5)';
  c.lineWidth = 1.5;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(w0.x, w0.y);
  c.lineTo(w1.x, w1.y);
  c.stroke();
  c.setLineDash([]);
  [w0, w1].forEach((w) => {
    c.fillStyle = '#B98BFF';
    c.beginPath();
    c.arc(w.x, w.y, 5, 0, TAU);
    c.fill();
  });

  const fs = clamp(R / 26, 9, 14);
  const label = (text, x, y, color = 'rgba(255,255,255,0.85)', size = fs) => {
    c.font = `700 ${size}px "Baloo 2", sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(7,9,32,0.9)';
    c.strokeText(text, x, y);
    c.fillStyle = color;
    c.fillText(text, x, y);
  };
  const small = ['io', 'europe', 'titan', 'lune', 'iss'];
  const showIds = ['soleil', 'mercure', 'venus', 'terre', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune', 'pluton', 'comete', 'nebuleuse', 'galaxie', 'trounoir', ...small];
  const iconSize = clamp(R / 24, 8, 20);
  showIds.forEach((id) => {
    const b = byId[id];
    const m = mapBody(b, R);
    const size = id === 'soleil' ? iconSize * 1.5 : ['jupiter', 'saturne', 'nebuleuse', 'galaxie'].includes(id) ? iconSize * 1.25 : small.includes(id) ? iconSize * 0.6 : iconSize;
    const art = arts[id];
    c.drawImage(art.canvas, m.x - size, m.y - size, size * 2, size * 2);
    if (b.res) {
      if (outstanding(b.res) > carried(b.res)) {
        c.strokeStyle = '#FFC93C';
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(m.x, m.y, size * 0.7 + 6, 0, TAU);
        c.stroke();
      }
      c.font = `${fs + 3}px sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(RESOURCES[b.res].icon, m.x + size * 0.7 + 4, m.y - size * 0.7 - 2);
    }
    if (!small.includes(id) || b.res) {
      label(b.obj.name, m.x, m.y + size * 0.6 + fs * 0.6, b.res ? '#FFE9A8' : 'rgba(255,255,255,0.75)', fs * 0.9);
    }
  });
  const bh = mapBody(byId.trounoir, R);
  label('⚠️ Danger', bh.x, bh.y - iconSize - 4, '#FF8A3C', fs * 0.85);
  if (!game.won) {
    const e = mapBody(byId.terre, R);
    label(`À vendre 💰${EARTH_PRICE}`, e.x, e.y + iconSize + fs * 1.5, '#FFD24A', fs * 0.85);
  }

  // marchands
  SHOPS.forEach((s) => {
    const p = mp(SHOP_POS[s.id].x, SHOP_POS[s.id].y);
    c.fillStyle = '#FFFCF3';
    c.strokeStyle = '#2E2A4D';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(p.x - 12, p.y - 12, 24, 24, 6);
    c.fill();
    c.stroke();
    c.font = '14px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(s.icon, p.x, p.y + 1);
    label(s.who, p.x, p.y + 20, '#FFFFFF', fs * 0.8);
  });

  // habitants : leur visage au-dessus de chez eux
  CHARACTERS.forEach((ch) => {
    const home = mapBody(byId[ch.home], R);
    const q = game.quests.find((x) => x.char === ch.id);
    const offer = game.offers[ch.id];
    const canDeliver = q && Object.keys(q.needs).some((r) => carried(r) > 0 && (q.got[r] || 0) < q.needs[r]);
    const lift = ['jupiter', 'saturne'].includes(ch.home) ? iconSize * 1.25 + 14 : small.includes(ch.home) ? 18 : iconSize + 14;
    const x = home.x, y = home.y - lift;
    c.fillStyle = 'rgba(11,15,51,0.9)';
    c.strokeStyle = canDeliver ? '#7CF0A0' : q ? '#4FB8E8' : offer ? '#FFC93C' : '#C9CED8';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(x, y, 15, 0, TAU);
    c.fill();
    c.stroke();
    c.save();
    c.beginPath();
    c.arc(x, y, 13, 0, TAU);
    c.clip();
    c.drawImage(faceImgs[ch.id], x - 16, y - 16, 32, 32);
    c.restore();
    if (offer && !q) label('!', x + 14, y - 13, '#FFC93C', fs * 1.4);
  });

  // OVNI et caisses perdues
  ufos.forEach((u) => {
    const p = mp(u.x, u.y);
    c.drawImage(ufoArt.canvas, p.x - 9, p.y - 9, 18, 18);
  });
  crates.forEach((cr) => {
    const p = mp(cr.x, cr.y);
    c.font = '12px sans-serif';
    c.textAlign = 'center';
    c.fillText('📦', p.x, p.y);
  });

  // la fusée
  const sp = mp(ship.x, ship.y);
  c.save();
  c.translate(sp.x, sp.y);
  c.rotate(ship.angle);
  c.scale(0.8, 0.8);
  drawShipShape(c, game.paint, game.acc, worldT, { crown: game.won });
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(sp.x, sp.y, 24, 0, TAU);
  c.stroke();
  label('Toi', sp.x, sp.y + 32, '#FFFFFF', fs);
}

/* ---------- Mode téléphone : jeu en plein écran ---------- */
function applyPhoneMode() {
  document.body.classList.toggle('phone', phoneMQ.matches);
}
applyPhoneMode();
phoneMQ.addEventListener('change', applyPhoneMode);

function enterFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
  } catch (err) { /* refusé par le navigateur */ }
}

function buzz(pattern) {
  if (!phoneMQ.matches || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (err) { /* ignoré */ }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Object.keys(keys).forEach((k) => { keys[k] = false; });
    pointer.active = false;
    fireHeld = false;
    if (state === 'playing') saveGame();
  }
});
window.addEventListener('pagehide', () => { if (state === 'playing') saveGame(); });

stage.addEventListener('contextmenu', (e) => { if (phoneMQ.matches) e.preventDefault(); });

/* ---------- Quitter le jeu ---------- */
function goHome() {
  if (state === 'playing') saveGame();
  window.location.href = '../../index.html';
}
function openQuit() {
  if (state !== 'playing') { goHome(); return; }
  quitOverlay.hidden = false;
  $('quitNo').focus({ preventScroll: true });
}
function closeQuit() {
  quitOverlay.hidden = true;
}
$('quitBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openQuit(); });
$('quitYes').addEventListener('click', goHome);
$('quitNo').addEventListener('click', closeQuit);
quitOverlay.addEventListener('click', (e) => { if (e.target === quitOverlay) closeQuit(); });

/* ---------- Son ---------- */
function renderSoundBtn() {
  soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
}
soundBtn.addEventListener('click', (e) => {
  e.currentTarget.blur();
  toggleSound();
  renderSoundBtn();
});

/* ---------- Écran de départ ---------- */
$('startBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  startGame();
});
$('newGameBtn').addEventListener('click', () => {
  openDialog(`
    <p class="dlg-title">Recommencer à zéro ?</p>
    <p class="dlg-sub">Ton or, tes quêtes et les améliorations de ta fusée seront perdus.</p>
    <div class="dlg-actions">
      <button class="danger" data-act="yes">Oui, nouvelle partie</button>
      <button class="primary" data-act="close">Non, je garde ma partie</button>
    </div>`, {
    yes: () => {
      closeDialog();
      clearSave();
      newGame();
      setupGame();
      $('startBtn').textContent = '🚀 Décoller !';
      $('newGameBtn').hidden = true;
      $('startBtn').focus({ preventScroll: true });
    },
    close: closeDialog,
  });
});

/* ---------- La fin : le roi de la Terre ! ---------- */
const PARTY_ANIMALS = ['🐘', '🦒', '🐧', '🦁', '🐢', '🐙', '🦄', '🐸', '🐼', '🐨', '🦊', '🐰', '🐬', '🦋', '🐌', '🦖'];

function sizeEndCanvas() {
  const r = endOverlay.getBoundingClientRect();
  endCanvas.width = Math.round(r.width * dpr);
  endCanvas.height = Math.round(r.height * dpr);
}

function startEnding() {
  state = 'ending';
  endT = 0;
  endFx = [];
  endOverlay.hidden = false;
  endOverlay.classList.remove('show-text');
  sizeEndCanvas();
  renderKingTitle();
  $('endStats').textContent = `${game.questsDone} quêtes réussies · ${game.delivered} ressources livrées · ${game.ufoKills} OVNI vaincus`;
  setTimeout(() => sfx.royal(), 600);
  setTimeout(() => {
    endOverlay.classList.add('show-text');
    launchConfetti();
  }, 2600);
}

function renderKingTitle() {
  $('endTitle').textContent = `👑 Vive ${kingTitle === 'Roi' ? 'le Roi' : 'la Reine'} de la Terre ! 👑`;
  $('endSub').textContent = `Tu as acheté la planète Terre. Tu es maintenant ${kingTitle === 'Roi' ? 'son roi' : 'sa reine'}, et tous ses habitants font la fête !`;
  document.querySelectorAll('.title-btn').forEach((b) => b.classList.toggle('active', b.dataset.title === kingTitle));
}

document.querySelectorAll('.title-btn').forEach((b) => {
  b.addEventListener('click', () => { kingTitle = b.dataset.title; renderKingTitle(); });
});

function updateEnding(dt) {
  endT += dt;
  if (endT > 2 && Math.random() < dt * 1.6) {
    const W = endCanvas.width / dpr, H = endCanvas.height / dpr;
    const x = rand(W * 0.1, W * 0.9), y = rand(H * 0.08, H * 0.45);
    const color = pick(['#FFC93C', '#FF6F91', '#4FB8E8', '#7CF0A0', '#C38BFF', '#FFFFFF']);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU, s = rand(80, 200);
      endFx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rand(1, 1.6), color });
    }
    if (Math.random() < 0.5) sfx.firework();
  }
  for (const p of endFx) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    p.vx *= Math.pow(0.5, dt);
  }
  endFx = endFx.filter((p) => p.life < p.max);
}

function drawEnding() {
  const W = endCanvas.width / dpr, H = endCanvas.height / dpr;
  const c = ectx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const t = endT;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1C2260');
  g.addColorStop(1, '#3A2C84');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  // étoiles
  for (let i = 0; i < 90; i++) {
    const x = (i * 197.3) % W, y = (i * 83.7) % H;
    c.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i))})`;
    c.fillRect(x, y, 2, 2);
  }

  // La Terre arrive en grossissant
  const grow = Math.min(1, t / 2);
  const ease = 1 - Math.pow(1 - grow, 3);
  const ER = Math.min(W * 0.36, H * 0.34) * ease;
  const ex = W / 2, ey = H - ER * 0.35;
  if (ER > 1) {
    const halo = c.createRadialGradient(ex, ey, ER * 0.9, ex, ey, ER * 1.5);
    halo.addColorStop(0, 'rgba(120,200,255,0.45)');
    halo.addColorStop(1, 'rgba(120,200,255,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(ex, ey, ER * 1.5, 0, TAU);
    c.fill();
    c.save();
    c.translate(ex, ey);
    c.rotate(t * 0.15);
    const art = arts.terre;
    const s = ER * (art.half / 46);
    c.drawImage(art.canvas, -s, -s, s * 2, s * 2);
    c.restore();
  }

  if (t > 1.2) {
    const k = Math.min(1, (t - 1.2) / 0.8);
    // les animaux qui sautent de joie tout autour de la Terre
    c.font = `${Math.round(ER * 0.2)}px sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    PARTY_ANIMALS.forEach((a, i) => {
      const ang = Math.PI + 0.25 + (i / (PARTY_ANIMALS.length - 1)) * (Math.PI - 0.5);
      if (Math.abs(ang - Math.PI * 1.5) < 0.18) return; // la place du roi
      const hop = Math.abs(Math.sin(t * 4 + i)) * ER * 0.12;
      const d = ER * 1.08 + hop;
      c.save();
      c.globalAlpha = k;
      c.translate(ex + Math.cos(ang) * d, ey + Math.sin(ang) * d);
      c.rotate(ang + Math.PI / 2 + Math.sin(t * 3 + i) * 0.15);
      c.fillText(a, 0, 0);
      c.restore();
    });
    // les créatures étranges de l'espace dansent en rond
    const crew = ['martin', 'mamie', 'lila', 'zinzin', 'gloubi', 'reine', 'gus', 'stella', 'boum'];
    crew.forEach((id, i) => {
      const ang = (i / crew.length) * TAU + t * 0.35;
      const x = ex + Math.cos(ang) * Math.min(ER * 1.75, W * 0.42);
      const y = ey - ER * 0.55 + Math.sin(ang) * ER * 0.5;
      if (y > H - 20) return;
      c.save();
      c.globalAlpha = k;
      c.translate(x, y + Math.sin(t * 5 + i) * 8);
      c.rotate(Math.sin(t * 4 + i) * 0.2);
      drawCharacter(c, id, Math.max(14, ER * 0.15), t);
      c.restore();
    });
    // des OVNI devenus gentils font des loopings
    for (let i = 0; i < 3; i++) {
      const ang = t * 0.8 + i * 2.1;
      const x = W / 2 + Math.cos(ang) * W * 0.4;
      const y = H * 0.18 + Math.sin(ang * 2) * H * 0.06;
      c.save();
      c.globalAlpha = k;
      c.translate(x, y);
      c.rotate(Math.sin(ang * 2) * 0.3);
      const s = 26;
      c.drawImage(ufoArt.canvas, -s, -s, s * 2, s * 2);
      c.restore();
    }
  }

  // le roi (ou la reine) sur le dessus de la Terre, avec sa couronne
  if (t > 0.8) {
    const drop = Math.min(1, (t - 0.8) / 0.9);
    const bounce = drop < 1 ? (1 - drop) * -H * 0.5 : Math.abs(Math.sin(t * 3)) * -8;
    const ks = Math.max(22, ER * 0.3);
    c.save();
    c.translate(ex, ey - ER - ks * 1.05 + bounce);
    drawCharacter(c, 'king', ks, t);
    c.restore();
    // sa fusée garée juste à côté
    c.save();
    c.translate(ex + ER * 0.62, ey - ER * 1.02 + Math.sin(t * 2) * 4);
    c.rotate(-0.6);
    c.scale(ER / 140, ER / 140);
    drawShipShape(c, game.paint, game.acc, t, { crown: true });
    c.restore();
  }

  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const p of endFx) {
    c.globalAlpha = 1 - p.life / p.max;
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, 3, 0, TAU);
    c.fill();
  }
  c.restore();
}

function launchConfetti() {
  const pieces = ['👑', '⭐', '🌍', '✨', '🎉', '💰', '🎊', '🚀'];
  for (let i = 0; i < 36; i++) {
    const span = document.createElement('span');
    span.className = 'confetti-piece';
    span.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    span.style.left = `${Math.random() * 100}vw`;
    span.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    span.style.animationDelay = `${Math.random() * 0.8}s`;
    span.style.fontSize = `${1 + Math.random() * 1.2}rem`;
    confettiLayer.appendChild(span);
    setTimeout(() => span.remove(), 4500);
  }
}

$('endContinue').addEventListener('click', () => {
  // on continue à voler, avec une couronne sur la fusée
  endOverlay.hidden = true;
  state = 'playing';
  say('Bip bip ! À vos ordres, Majesté ! On continue les livraisons ?', 4, 5000);
  renderUI();
});
$('endNew').addEventListener('click', () => {
  endOverlay.hidden = true;
  clearSave();
  game = null;
  showStartScreen();
});

/* ---------- Démarrage ---------- */
async function init() {
  resize();
  new ResizeObserver(resize).observe(stage);
  buildBackground();
  ['soleil', 'mercure', 'venus', 'terre', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune', 'pluton', 'comete', 'io', 'europe', 'titan', 'nebuleuse']
    .forEach((id) => { thumbs[id] = renderArt(id, 34).canvas.toDataURL(); });
  ufoArt = renderArt('ovni', 30);
  [...CHARACTERS.map((c) => c.id), ...SHOPS.map((s) => s.id)].forEach((id) => {
    faces[id] = characterThumb(id);
    const img = new Image();
    img.src = faces[id];
    faceImgs[id] = img;
  });
  renderSoundBtn();
  try {
    await document.fonts.load('700 17px "Baloo 2"');
  } catch (err) {
    // tant pis, on garde la police de secours
  }
  showStartScreen();
  requestAnimationFrame(loop);
}

init();
