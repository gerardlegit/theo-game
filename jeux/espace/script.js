import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";
import { SPACE_OBJECTS, OBJECT_BY_ID, MISSION_STORIES, BIP } from "./data.js";
import { renderArt } from "./art.js";
import { sfx, isSoundOn, toggleSound } from "./sound.js";

/* ---------- Niveaux (chacun a son propre classement) ---------- */
const MODES = {
  cadet: { gameId: 'espace-cadet' },
  commandant: { gameId: 'espace-commandant' },
};
const MODE_KEY = 'espace-mode';
const CARNET_KEY = 'espace-carnet';

/* ---------- Réglages du jeu ---------- */
const TAU = Math.PI * 2;
const WORLD_R = 4200;              // rayon de la carte
const EDGE_ZONE = 160;             // bande où l'on est repoussé vers l'intérieur
const MISSION_SIZE = 6;

const ACCEL = 1150;                // px/s²
const DRAG = 0.35;                 // part de la vitesse gardée après 1 s sans moteur
const MAX_SPEED = 430;
const TURBO_ACCEL = 2600;
const TURBO_SPEED = 950;
const TURBO_TIME = 1.6;            // s de turbo
const TURBO_RECHARGE = 3.5;        // s pour recharger complètement

const PHOTO_TIME = 0.7;            // s à rester près d'un objet pour le photographier
const STAR_COUNT = 70;

const SUN_BURN = 180;              // trop près du Soleil : ça brûle
const BH_PULL_R = 620;             // le trou noir attire dans ce rayon
const BH_PULL = 90000;
const BH_DEATH = 48;               // spaghettification !
const WORMHOLE_R = 46;

/* Le système solaire : pas à l'échelle, mais tout est dans le bon ordre ! */
const MERCURY_PERIOD = 110;        // s pour un tour du Soleil (les autres suivent la loi de Kepler)
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
const OVNI_HOME = { x: 1700, y: 3150 };
const OVNI_FLEE_SPEED = 170;       // bien moins vite que le vaisseau (430)
const OVNI_ENERGY = 1.6;           // s de fuite avant d'être tout essoufflé
const SOCK_HOME = { x: 330, y: 320 };   // entre Mercure et Vénus
const WORMHOLES = [{ x: -1540, y: -560 }, { x: -450, y: -3600 }];

/* Couleurs de chaque objet sur la mini-carte */
const MAP_COLORS = {
  soleil: '#FFC93C', mercure: '#B8ADA2', venus: '#EBC989', terre: '#4FA8F0', lune: '#DADAD6',
  mars: '#E0703A', jupiter: '#D9B48A', saturne: '#E8CF95', uranus: '#97E1E7', neptune: '#5A84F0',
  pluton: '#D8BFA4', comete: '#BFEFFF', asteroide: '#9C8B78', galaxie: '#B9A8FF', nebuleuse: '#FF7FC8',
  trounoir: '#FF8A3C', satellite: '#F2C14E', iss: '#E8B254', astronaute: '#FFFFFF', rover: '#F2F4F8',
  telescope: '#F2BE3A', fusee: '#FF6F91', ovni: '#7CE07A', chaussette: '#FF6F91', io: '#EBCB52',
  europe: '#EDE3D2', titan: '#E8A23F',
};

const MISSION_GROUPS = [
  { ids: ['soleil', 'mercure', 'venus', 'terre', 'lune', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune', 'pluton'], take: 2 },
  { ids: ['iss', 'astronaute', 'satellite', 'rover', 'telescope', 'fusee'], take: 1 },
  { ids: ['comete', 'asteroide', 'io', 'europe', 'titan'], take: 1 },
  { ids: ['galaxie', 'nebuleuse', 'trounoir', 'ovni', 'chaussette'], take: 1 },
];

/* ---------- Éléments de la page ---------- */
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('spaceCanvas');
const ctx = canvas.getContext('2d');
const minimap = $('minimap');
const mctx = minimap.getContext('2d');
const timerEl = $('timer');
const photoCountEl = $('photoCount');
const totalCountEl = $('totalCount');
const starCountEl = $('starCount');
const carnetCountEl = $('carnetCount');
const soundBtn = $('soundBtn');
const missionPanel = $('missionPanel');
const missionList = $('missionList');
const photoCard = $('photoCard');
const copilot = $('copilot');
const bubble = $('bubble');
const startOverlay = $('startOverlay');
const orderList = $('orderList');
const winBanner = $('winBanner');
const confettiLayer = $('confettiLayer');
const scoreForm = $('scoreForm');
const pseudoInput = $('pseudoInput');
const scoreSaved = $('scoreSaved');
const leaderboardList = $('leaderboardList');
const carnetOverlay = $('carnet');
const carnetGrid = $('carnetGrid');
const carnetDetail = $('carnetDetail');

/* ---------- État ---------- */
let mode = 'cadet';
try { if (MODES[localStorage.getItem(MODE_KEY)]) mode = localStorage.getItem(MODE_KEY); } catch (e) { /* stockage indisponible */ }
let lbMode = mode;
let carnet = loadCarnet();         // id -> nombre de photos prises (toutes parties confondues)

const arts = {};                   // dessins pré-rendus pour la carte
const thumbs = {};                 // petites images (dataURL) pour les listes
let rockArts = [];
let starSprite = null;
let starTiles = [];
let hazeTile = null;

let cssW = 0, cssH = 0, dpr = 1, zoom = 1, viewW = 0, viewH = 0;
let worldT = 0;                    // temps qui fait tourner les planètes
let state = 'loading';             // 'loading' | 'ready' | 'playing' | 'won'
let paused = false;
let pauseStart = 0;
let startTime = 0;
let finalScore = null;

let bodies = [];
let byId = {};
let rocks = [];
let goldStars = [];
let mission = [];
let missionStory = '';
let missionNumber = 0;
let photographed = new Set();
let newInCarnet = [];
let starsTaken = 0;
let ship = null;
let scan = { body: null, p: 0 };
let particles = [];
let floaters = [];
let flash = { a: 0, color: '255,255,255' };
let shake = 0;
let bonkStreak = { n: 0, t: 0 };
let lastMoveAt = 0;
let nextJokeAt = 0;
const cooldowns = {};
let bip = { until: 0, prio: 0 };
let photoCardTimer = null;
let lastShownSecond = -1;

const keys = { left: false, right: false, up: false, down: false };
const touchDirs = { left: false, right: false, up: false, down: false };
const pointer = { active: false, id: null, dx: 0, dy: 0, lastDown: 0 };

/* ---------- Utilitaires ---------- */
const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const polar = (a, d) => ({ x: Math.cos(a) * d, y: Math.sin(a) * d });

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

function elapsedSeconds() {
  return ((paused ? pauseStart : performance.now()) - startTime) / 1000;
}

/* ---------- Carnet de l'explorateur (gardé dans le navigateur) ---------- */
function loadCarnet() {
  try {
    const data = JSON.parse(localStorage.getItem(CARNET_KEY));
    return data && typeof data === 'object' ? data : {};
  } catch (e) {
    return {};
  }
}

function saveCarnet() {
  try { localStorage.setItem(CARNET_KEY, JSON.stringify(carnet)); } catch (e) { /* stockage indisponible */ }
}

const discoveredCount = () => SPACE_OBJECTS.filter((o) => carnet[o.id]).length;

/* ---------- Taille de l'écran ---------- */
function resize() {
  const rect = stage.getBoundingClientRect();
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
  dpr = Math.min(2, window.devicePixelRatio || 1);
  // Sur petit écran on dézoome un peu pour voir assez d'espace autour du vaisseau
  zoom = clamp(cssW / 950, 0.58, 1.1);
  viewW = cssW / zoom;
  viewH = cssH / zoom;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const m = minimap.getBoundingClientRect();
  minimap.width = Math.round(m.width * dpr);
  minimap.height = Math.round(m.height * dpr);
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

  // Voiles colorés qui se répètent sans couture
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

  // Petite étoile d'or (bonus)
  starSprite = document.createElement('canvas');
  starSprite.width = starSprite.height = 64;
  const s = starSprite.getContext('2d');
  s.translate(32, 32);
  const g = s.createRadialGradient(0, 0, 0, 0, 0, 30);
  g.addColorStop(0, 'rgba(255,220,90,0.7)');
  g.addColorStop(1, 'rgba(255,200,60,0)');
  s.fillStyle = g;
  s.fillRect(-32, -32, 64, 64);
  s.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rr = i % 2 ? 7 : 16;
    s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath();
  s.fillStyle = '#FFD24A';
  s.fill();
  s.strokeStyle = '#FFF6C8';
  s.lineWidth = 2;
  s.stroke();
}

/* ---------- Construction du monde ---------- */
function makeBody(id, r, extra = {}) {
  const obj = OBJECT_BY_ID[id];
  const b = { id, obj, r, x: 0, y: 0, rot: 0, range: r + 80, ...extra };
  if (!arts[id]) arts[id] = renderArt(id, r);
  bodies.push(b);
  byId[id] = b;
  return b;
}

function buildWorld() {
  bodies = [];
  byId = {};

  // Les objets lointains d'abord : ils sont dessinés derrière tout le reste
  Object.entries(FAR).forEach(([id, f]) => {
    const b = makeBody(id, f.r, { motion: 'fixed', x: f.x, y: f.y });
    // le trou noir se photographie de loin, là où il n'attire encore que doucement
    b.range = id === 'trounoir' ? 460 : f.r + 50;
  });
  makeBody('soleil', 130, { motion: 'fixed', range: 310 });

  PLANETS.forEach((p) => {
    const period = MERCURY_PERIOD * Math.pow(p.dist / PLANETS[0].dist, 1.5);
    makeBody(p.id, p.r, { motion: 'orbit', dist: p.dist, period, phase: Math.random() * TAU });
  });
  // Saturne est dessinée avec ses anneaux : la planète elle-même est plus petite
  byId.saturne.range = 96 * 0.72 + 90;

  MOONS.forEach((m) => {
    makeBody(m.id, m.r, { motion: 'moon', parent: m.parent, dist: m.dist, period: m.period, phase: m.phase ?? Math.random() * TAU });
  });

  makeBody('telescope', 34, { motion: 'l2' });
  makeBody('astronaute', 22, { motion: 'spacewalk' });
  makeBody('fusee', 30, { motion: 'rocket', dist: 690, period: 55, phase: Math.random() * TAU });
  makeBody('chaussette', 24, { motion: 'drift' });
  makeBody('comete', 40, { motion: 'comet', a: 1950, e: 0.78, period: 150, tilt: rand(0, TAU), phase: Math.random() * TAU });
  makeBody('ovni', 36, { motion: 'ovni', ox: 0, oy: 0, energy: OVNI_ENERGY, range: 36 + 130 });

  // La ceinture d'astéroïdes, entre Mars et Jupiter
  if (!rockArts.length) rockArts = Array.from({ length: 6 }, (_, i) => renderArt('asteroide', 24, 2, 1000 + i * 7919));
  rocks = Array.from({ length: BELT.count }, (_, i) => {
    const dist = rand(BELT.inner, BELT.outer);
    const r = Math.random() < 0.15 ? rand(24, 32) : rand(10, 22);
    return {
      id: 'asteroide', obj: OBJECT_BY_ID.asteroide, r, range: r + 70, rock: true,
      art: rockArts[i % rockArts.length],
      dist, phase: (i / BELT.count) * TAU + rand(-0.03, 0.03),
      period: MERCURY_PERIOD * Math.pow(dist / PLANETS[0].dist, 1.5),
      spin: rand(-0.6, 0.6), rot: rand(0, TAU), x: 0, y: 0,
    };
  });

  updateBodies(0);
}

function placeGoldStars() {
  goldStars = [];
  while (goldStars.length < STAR_COUNT) {
    const p = polar(rand(0, TAU), rand(360, WORLD_R - 300));
    // pas dans la ceinture d'astéroïdes : trop dangereux pour les petits pilotes
    const d = Math.hypot(p.x, p.y);
    if (d > BELT.inner - 40 && d < BELT.outer + 40) continue;
    goldStars.push({ x: p.x, y: p.y, phase: Math.random() * TAU, taken: false });
  }
}

/* ---------- Mouvement des astres ---------- */
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
        // Le télescope James Webb reste toujours derrière la Terre, à l'opposé du Soleil
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
        // la fusée pointe dans le sens de son vol
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
        // la queue fuit toujours le Soleil
        b.rot = Math.atan2(b.y, b.x) - (3 * Math.PI) / 4;
        break;
      }
      case 'ovni': {
        const hx = OVNI_HOME.x + Math.sin(t * 0.3) * 260;
        const hy = OVNI_HOME.y + Math.sin(t * 0.47) * 180;
        if (dt && ship && state === 'playing' && !photographed.has('ovni')) {
          const dx = b.x - ship.x, dy = b.y - ship.y;
          const d = Math.hypot(dx, dy);
          if (d < 300 && d > 1 && b.energy > 0) {
            b.ox += (dx / d) * OVNI_FLEE_SPEED * dt;
            b.oy += (dy / d) * OVNI_FLEE_SPEED * dt;
            b.energy -= dt;
            if (b.energy <= 0) sayOnce('ovniTired', BIP.ovniTired, 15, 3);
            else sayOnce('ovni', BIP.ovni, 15, 2);
          } else if (d < 500) {
            // essoufflé : il ne fuit plus, c'est le moment de la photo !
          } else {
            b.energy = Math.min(OVNI_ENERGY, b.energy + dt * 0.5);
            const k = Math.pow(0.7, dt);
            b.ox *= k; b.oy *= k;
          }
          const ol = Math.hypot(b.ox, b.oy);
          if (ol > 700) { b.ox *= 700 / ol; b.oy *= 700 / ol; }
        }
        b.x = hx + b.ox; b.y = hy + b.oy;
        const d0 = Math.hypot(b.x, b.y);
        if (d0 > WORLD_R - 260) { b.x *= (WORLD_R - 260) / d0; b.y *= (WORLD_R - 260) / d0; }
        b.rot = Math.sin(t * 3) * 0.15;
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

/* ---------- Mission ---------- */
function pickMission() {
  const ranked = (ids) => ids
    .map((id) => ({ id, score: (carnet[id] ? 1 : 0) + Math.random() * 1.3 }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.id);

  const chosen = [];
  MISSION_GROUPS.forEach((g) => chosen.push(...ranked(g.ids).slice(0, g.take)));
  const rest = ranked(SPACE_OBJECTS.map((o) => o.id).filter((id) => !chosen.includes(id)));
  while (chosen.length < MISSION_SIZE) chosen.push(rest.shift());

  mission = shuffle(chosen).map((id) => ({ obj: OBJECT_BY_ID[id], done: false }));
  missionStory = pick(MISSION_STORIES);
  missionNumber = Math.floor(rand(1, 999));
}

function renderMissionLists() {
  const item = (m, i, big) => {
    const showPic = mode === 'cadet' || m.done;
    const pic = showPic
      ? `<img src="${thumbs[m.obj.id]}" alt="">`
      : `<span class="m-q">${i + 1}</span>`;
    const name = mode === 'cadet' || m.done ? `<strong>${escapeHtml(m.obj.name)}</strong>` : '';
    const riddle = mode === 'commandant' ? `<span class="m-riddle">${escapeHtml(m.obj.riddle)}</span>` : '';
    return `<li class="m-item${m.done ? ' done' : ''}${big ? ' big' : ''}">
      <span class="m-thumb">${pic}</span>
      <span class="m-text">${name}${riddle}</span>
      <span class="m-check" aria-label="${m.done ? 'photographié' : 'à trouver'}">${m.done ? '✓' : ''}</span>
    </li>`;
  };
  missionList.innerHTML = mission.map((m, i) => item(m, i, false)).join('');
  orderList.innerHTML = mission.map((m, i) => item(m, i, true)).join('');
  missionPanel.classList.toggle('riddles', mode === 'commandant');

  $('orderStory').textContent = missionStory;
  $('orderNumber').textContent = `n° ${String(missionNumber).padStart(3, '0')}`;
  document.querySelectorAll('.mode-btn').forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });

  const done = mission.filter((m) => m.done).length;
  photoCountEl.textContent = String(done);
  totalCountEl.textContent = String(mission.length);
}

function setMode(m) {
  mode = m;
  try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignoré */ }
  renderMissionLists();
  showLeaderboard(m);
}

/* ---------- Nouvelle partie ---------- */
function resetShip() {
  const e = byId.terre;
  const a = Math.atan2(e.y, e.x) - 0.45;
  const p = polar(a, Math.hypot(e.x, e.y));
  ship = { x: p.x, y: p.y, vx: 0, vy: 0, angle: -Math.PI / 2, thrust: false, turbo: 0, charge: 1, spin: 0, spaghetti: 0, wormCooldown: 0 };
}

function prepareGame(newMission = true) {
  if (newMission) pickMission();
  mission.forEach((m) => { m.done = false; });
  photographed = new Set();
  newInCarnet = [];
  starsTaken = 0;
  placeGoldStars();
  resetShip();
  scan = { body: null, p: 0 };
  particles = [];
  floaters = [];
  finalScore = null;
  lastShownSecond = -1;
  timerEl.textContent = '0';
  starCountEl.textContent = '0';
  hidePhotoCard();
  renderMissionLists();
}

function showStartScreen(newMission = true) {
  prepareGame(newMission);
  bip = { until: 0, prio: 0 };
  bubble.classList.remove('show');
  copilot.classList.remove('talking');
  state = 'ready';
  paused = false;
  startOverlay.hidden = false;
  setTimeout(() => $('startBtn').focus({ preventScroll: true }), 50);
}

function startGame() {
  if (state !== 'ready') return;
  startOverlay.hidden = true;
  state = 'playing';
  startTime = performance.now();
  lastMoveAt = startTime;
  nextJokeAt = startTime + rand(28000, 40000);
  say(pick(BIP.start), 3, 4500);
  if (window.matchMedia('(max-width: 700px)').matches) setMissionCollapsed(true);
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
  if (isTyping(e) || winBanner.classList.contains('show')) return;
  if (!carnetOverlay.hidden) {
    if (e.code === 'Escape') closeCarnet();
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
  }
});

window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) keys[dir] = false;
});

window.addEventListener('blur', () => {
  Object.keys(keys).forEach((k) => { keys[k] = false; });
  pointer.active = false;
});

// Croix directionnelle tactile
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

// Garder le doigt (ou la souris) appuyé : le vaisseau vole vers lui. Double-tape : turbo !
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
  if (state !== 'playing' || paused || !ship || ship.spaghetti > 0) return;
  if (ship.charge < 1) {
    addFloater('Turbo en charge…', ship.x, ship.y - 40, '#9EE7FF');
    return;
  }
  ship.turbo = TURBO_TIME;
  ship.charge = 0;
  shake = Math.max(shake, 0.15);
  sfx.turbo();
  sayOnce('turbo', BIP.turbo, 20, 1);
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
  nextJokeAt = Math.max(nextJokeAt, now + 20000);
}

function sayOnce(key, lines, cooldownS, prio = 1) {
  const now = performance.now();
  if ((cooldowns[key] || 0) > now) return;
  cooldowns[key] = now + cooldownS * 1000;
  say(pick(lines), prio);
}

function updateBip(now) {
  if (bip.until && now > bip.until) {
    bubble.classList.remove('show');
    copilot.classList.remove('talking');
    bip = { until: 0, prio: 0 };
  }
  if (state === 'playing' && !paused) {
    if (now > nextJokeAt && !bip.until) {
      say(pick(BIP.jokes), 0, 7000);
      nextJokeAt = now + rand(30000, 45000);
    }
    if (now - lastMoveAt > 9000) {
      sayOnce('idle', BIP.idle, 25, 1);
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

/* ---------- Photos ---------- */
function updateScan(dt) {
  let best = null, bestScore = Infinity;
  const wanted = new Set(mission.filter((m) => !m.done).map((m) => m.obj.id));
  const consider = (b) => {
    if (photographed.has(b.id)) return;
    const d = Math.hypot(ship.x - b.x, ship.y - b.y);
    if (d > b.range) return;
    // le plus proche (par rapport à sa taille) gagne, et ceux de la mission passent devant :
    // près de Jupiter, c'est bien Io qu'on photographie si c'est elle qu'on cherche
    const score = d / b.range - (wanted.has(b.id) ? 0.6 : 0);
    if (score < bestScore) { bestScore = score; best = b; }
  };
  bodies.forEach(consider);
  rocks.forEach(consider);

  if (best && ship.spaghetti <= 0) {
    if (scan.body === best || (scan.body && scan.body.id === best.id && best.rock)) {
      scan.body = best;
      scan.p += dt / PHOTO_TIME;
    } else {
      scan.body = best;
      scan.p = dt / PHOTO_TIME;
    }
    if (scan.p >= 1) {
      takePhoto(best);
      scan = { body: null, p: 0 };
    }
  } else {
    scan.p = Math.max(0, scan.p - dt * 2);
    if (scan.p === 0) scan.body = null;
  }
}

function takePhoto(b) {
  const obj = b.obj;
  photographed.add(obj.id);
  const factIndex = (carnet[obj.id] || 0) % obj.facts.length;
  const isNew = !carnet[obj.id];
  carnet[obj.id] = (carnet[obj.id] || 0) + 1;
  saveCarnet();
  if (isNew) newInCarnet.push(obj.id);
  carnetCountEl.textContent = `${discoveredCount()}/${SPACE_OBJECTS.length}`;

  flash = { a: 0.85, color: '255,255,255' };
  sfx.click();
  addFloater('📸 CLIC !', b.x, b.y - b.r - 24, '#FFFFFF', 26);

  const m = mission.find((x) => x.obj.id === obj.id && !x.done);
  if (m) {
    m.done = true;
    renderMissionLists();
    burst(b.x, b.y, 50, ['#FFC93C', '#FF6F91', '#4FB8E8', '#58C97B', '#FFFFFF'], 300);
    setTimeout(() => sfx.good(), 150);
    const left = mission.filter((x) => !x.done).length;
    if (left === 0) {
      showPhotoCard(obj, factIndex, true, isNew);
      finishGame();
      return;
    }
    if (left === 1) say(BIP.special[obj.id] || pick(BIP.almost), 3, 4500);
    else say(BIP.special[obj.id] || pick(BIP.goodPhoto), 2, 4000);
  } else {
    setTimeout(() => sfx.other(), 150);
    say(BIP.special[obj.id] || pick(BIP.otherPhoto), 1, 3800);
  }
  showPhotoCard(obj, factIndex, !!m, isNew);
}

function showPhotoCard(obj, factIndex, onMission, isNew) {
  $('pcImg').src = thumbs[obj.id];
  $('pcName').textContent = obj.name;
  $('pcKind').textContent = `(${obj.kind})`;
  $('pcFact').textContent = obj.facts[factIndex];
  $('pcWow').innerHTML = `<b>😲 Incroyable mais vrai :</b> ${escapeHtml(obj.wow)}`;
  const tags = [];
  tags.push(onMission ? '<span class="tag tag-ok">✓ Sur ta liste !</span>' : '<span class="tag tag-off">Pas sur ta liste</span>');
  if (isNew) tags.push('<span class="tag tag-new">★ Nouveau dans ton carnet</span>');
  $('pcTag').innerHTML = tags.join(' ');
  photoCard.classList.toggle('on-mission', onMission);
  photoCard.hidden = false;
  photoCard.style.animation = 'none';
  void photoCard.offsetWidth;
  photoCard.style.animation = '';
  clearTimeout(photoCardTimer);
  photoCardTimer = setTimeout(hidePhotoCard, 9000);
}

function hidePhotoCard() {
  clearTimeout(photoCardTimer);
  photoCard.hidden = true;
}

/* ---------- Mise à jour ---------- */
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
  if (ship.turbo === 0) ship.charge = Math.min(1, ship.charge + dt / TURBO_RECHARGE);
  const turbo = ship.turbo > 0;
  const accel = turbo ? TURBO_ACCEL : ACCEL;
  const maxSpeed = turbo ? TURBO_SPEED : MAX_SPEED;

  if (len) {
    ship.vx += (ax / len) * accel * dt;
    ship.vy += (ay / len) * accel * dt;
    ship.angle = lerpAngle(ship.angle, Math.atan2(ay, ax), Math.min(1, dt * 9));
  } else if (turbo) {
    // turbo sans direction : on fonce tout droit
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
      // l'appareil photo se déclenche toujours avant de finir en spaghetti
      const lastPhoto = !photographed.has('trounoir');
      if (lastPhoto) takePhoto(bh);
      ship.spaghetti = 1.8;
      ship.vx = ship.vy = 0;
      sfx.spaghetti();
      say(lastPhoto ? pick(BIP.spaghettiPhoto) : pick(BIP.spaghetti), 4, 5000);
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
  if (speed > maxSpeed) {
    // on ralentit en douceur (après un turbo ou un rebond)
    const target = maxSpeed + (speed - maxSpeed) * Math.pow(0.04, dt);
    ship.vx *= target / speed;
    ship.vy *= target / speed;
  }
  if (!len && speed > 30) {
    ship.angle = lerpAngle(ship.angle, Math.atan2(ship.vy, ship.vx), Math.min(1, dt * 5));
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  ship.spin = Math.max(0, ship.spin - dt);
  ship.wormCooldown = Math.max(0, ship.wormCooldown - dt);

  // Traînée du réacteur
  if ((ship.thrust || turbo) && Math.random() < (turbo ? 1 : 0.8)) {
    const n = turbo ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const bx = ship.x - Math.cos(ship.angle) * 24;
      const by = ship.y - Math.sin(ship.angle) * 24;
      particles.push({
        x: bx + rand(-3, 3), y: by + rand(-3, 3),
        vx: -Math.cos(ship.angle) * 110 + rand(-25, 25),
        vy: -Math.sin(ship.angle) * 110 + rand(-25, 25),
        life: 0, max: rand(0.25, 0.5), size: rand(2, turbo ? 5 : 3.5),
        color: turbo ? (Math.random() < 0.5 ? '#9EE7FF' : '#FFFFFF') : (Math.random() < 0.5 ? '#FFC93C' : '#FF8A3C'),
      });
    }
  }
}

function updateHazards(dt, now) {
  if (ship.spaghetti > 0) return;

  // Collisions avec les astéroïdes
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
      burst(ship.x - nx * 14, ship.y - ny * 14, 12, ['#BCAB95', '#FFFFFF', '#FFC93C'], 160);
      addFloater(pick(['BONK !', 'PAF !', 'BOING !', 'AÏE !']), ship.x, ship.y - 34, '#FFC93C', 24);
      if (now - bonkStreak.t < 6000) bonkStreak.n += 1; else bonkStreak.n = 1;
      bonkStreak.t = now;
      if (bonkStreak.n >= 4) { sayOnce('manyBonks', BIP.manyBonks, 15, 2); bonkStreak.n = 0; }
      else sayOnce('bonk', BIP.bonk, 5, 1);
      break;
    }
  }

  // Étoiles d'or
  for (const s of goldStars) {
    if (s.taken) continue;
    if (Math.abs(ship.x - s.x) < 34 && Math.abs(ship.y - s.y) < 34) {
      s.taken = true;
      starsTaken += 1;
      starCountEl.textContent = String(starsTaken);
      sfx.star();
      burst(s.x, s.y, 14, ['#FFD24A', '#FFF6C8'], 160);
      addFloater('⭐ −1 s', s.x, s.y - 20, '#FFD24A', 20);
      if (starsTaken === 1 || starsTaken % 10 === 0) sayOnce('star', BIP.star, 8, 1);
    }
  }

  // Trous de ver
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
        sayOnce('wormhole', BIP.wormhole, 40, 2);
      }
    });
  }

  // Petites remarques selon l'endroit
  const ur = byId.uranus;
  if (Math.hypot(ship.x - ur.x, ship.y - ur.y) < 280) {
    sayOnce('uranus', BIP.uranus, 45, 1);
    if (Math.random() < 0.15) particles.push({ x: ship.x + rand(-30, 30), y: ship.y + rand(-30, 30), vx: rand(-20, 20), vy: -40, life: 0, max: 1.2, size: rand(3, 6), color: '#A6E86A' });
  }
  const sock = byId.chaussette;
  if (Math.hypot(ship.x - sock.x, ship.y - sock.y) < 260) sayOnce('sock', BIP.sock, 45, 1);
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
  if (particles.length > 600) particles.splice(0, particles.length - 600);

  for (const f of floaters) {
    f.life += dt;
    f.y -= 34 * dt;
  }
  floaters = floaters.filter((f) => f.life < f.max);

  flash.a = Math.max(0, flash.a - dt * 3);
  shake = Math.max(0, shake - dt);
}

function update(dt, now) {
  if (paused) return;
  worldT += dt;
  updateBodies(dt);
  if (state === 'playing') {
    updateShip(dt, now);
    updateHazards(dt, now);
    updateScan(dt);
    const s = Math.floor(elapsedSeconds());
    if (s !== lastShownSecond) {
      lastShownSecond = s;
      timerEl.textContent = String(s);
    }
  } else if (state === 'won' && ship) {
    // le vaisseau fait des loopings de joie
    ship.angle += dt * 4;
  }
  updateEffects(dt);
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
  // Traits de vitesse en turbo
  const sp = Math.hypot(ship.vx, ship.vy);
  if (sp > MAX_SPEED + 60) {
    const k = Math.min(1, (sp - MAX_SPEED) / (TURBO_SPEED - MAX_SPEED));
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

  // Ceinture d'astéroïdes : une bande de poussière et son nom
  if (Math.abs((BELT.inner + BELT.outer) / 2 - sd) < reach + 200) {
    ctx.strokeStyle = 'rgba(200,170,130,0.06)';
    ctx.lineWidth = BELT.outer - BELT.inner + 60;
    ctx.beginPath();
    ctx.arc(0, 0, (BELT.inner + BELT.outer) / 2, 0, TAU);
    ctx.stroke();
    ctx.font = '700 22px "Baloo 2", sans-serif';
    ctx.fillStyle = 'rgba(255,225,180,0.35)';
    ctx.textAlign = 'center';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3;
      const p = polar(a, BELT.inner - 50);
      if (!inView(p.x, p.y, 200)) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText("Ceinture d'astéroïdes", 0, 0);
      ctx.restore();
    }
  }

  // Bord de la carte
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
    ctx.fillText('Trou de ver', 0, 108);
    ctx.restore();
  }
}

function drawGoldStars() {
  const t = worldT;
  for (const s of goldStars) {
    if (s.taken || !inView(s.x, s.y, 40)) continue;
    const k = 1 + Math.sin(t * 4 + s.phase) * 0.12;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.sin(t * 1.5 + s.phase) * 0.3);
    ctx.drawImage(starSprite, -24 * k, -24 * k, 48 * k, 48 * k);
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
    // le dessin est décalé pour que la tête de la comète soit pile sur sa position
    ctx.drawImage(art.canvas, -half - 0.6 * b.r, -half + 0.6 * b.r, half * 2, half * 2);
  } else {
    ctx.drawImage(art.canvas, -half, -half, half * 2, half * 2);
  }
  ctx.restore();

  if (b.id === 'trounoir') {
    // de la matière qui tourbillonne et se fait avaler
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

function labelFor(b) {
  if (photographed.has(b.id)) return { text: `✓ ${b.obj.name}`, color: '#7CF0A0' };
  if (mode === 'commandant' && !carnet[b.id]) return { text: '???', color: 'rgba(255,255,255,0.55)' };
  return { text: b.obj.name, color: 'rgba(255,255,255,0.85)' };
}

function drawLabels() {
  ctx.save();
  ctx.font = '700 17px "Baloo 2", "Quicksand", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const b of bodies) {
    if (!inView(b.x, b.y, b.r + 40)) continue;
    const { text, color } = labelFor(b);
    const y = b.y + (b.id === 'saturne' ? b.r * 0.85 : b.id === 'galaxie' || b.id === 'nebuleuse' ? b.r * 0.95 : b.r + 22);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(7,9,32,0.85)';
    ctx.strokeText(text, b.x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, b.x, y);
  }
  ctx.restore();
}

/** Corps le plus proche du vaisseau pour un objet de la mission (il y a beaucoup d'astéroïdes !) */
function nearestBodyFor(id) {
  if (id !== 'asteroide') return byId[id];
  let best = null, bd = Infinity;
  for (const k of rocks) {
    const d = (k.x - ship.x) ** 2 + (k.y - ship.y) ** 2;
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

function drawTargetsOnMap() {
  if (mode !== 'cadet' || state !== 'playing') return;
  const t = worldT;
  for (const m of mission) {
    if (m.done) continue;
    const b = nearestBodyFor(m.obj.id);
    if (!b || !inView(b.x, b.y, -20)) continue;
    // Anneau pointillé et flèche qui sautille au-dessus de l'objet
    ctx.save();
    ctx.strokeStyle = 'rgba(255,201,60,0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 18 + Math.sin(t * 4) * 3, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    const ay = b.y - b.r - 36 - Math.abs(Math.sin(t * 5)) * 12;
    ctx.fillStyle = '#FFC93C';
    ctx.strokeStyle = '#2E2A4D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, ay + 14);
    ctx.lineTo(b.x - 11, ay);
    ctx.lineTo(b.x - 5, ay);
    ctx.lineTo(b.x - 5, ay - 12);
    ctx.lineTo(b.x + 5, ay - 12);
    ctx.lineTo(b.x + 5, ay);
    ctx.lineTo(b.x + 11, ay);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawScan() {
  if (!scan.body || scan.p <= 0 || state !== 'playing') return;
  const b = scan.body;
  const p = Math.min(1, scan.p);
  const s = b.r + 16 + (1 - p) * 34;
  const L = Math.max(12, s * 0.35);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.strokeStyle = `rgba(255,255,255,${0.5 + p * 0.5})`;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(sx * s, sy * (s - L));
    ctx.lineTo(sx * s, sy * s);
    ctx.lineTo(sx * (s - L), sy * s);
    ctx.stroke();
  });
  ctx.strokeStyle = '#FFC93C';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, s + 12, -Math.PI / 2, -Math.PI / 2 + p * TAU);
  ctx.stroke();
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📸', s + 4, -s - 4);
  ctx.restore();
}

function drawShip(now) {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  // Jauge du turbo : un arc sous le vaisseau
  if (state === 'playing' && ship.spaghetti <= 0) {
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
  }

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

  // Flamme du réacteur
  if (ship.thrust || ship.turbo > 0) {
    const f = (ship.turbo > 0 ? 26 : 14) + Math.sin(now / 35) * 4 + Math.random() * 4;
    const g = ctx.createLinearGradient(-17, 0, -17 - f * 1.6, 0);
    g.addColorStop(0, 'rgba(255,255,220,0.95)');
    g.addColorStop(0.4, ship.turbo > 0 ? 'rgba(120,210,255,0.9)' : 'rgba(255,180,60,0.9)');
    g.addColorStop(1, 'rgba(255,80,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-16, -7);
    ctx.quadraticCurveTo(-17 - f * 1.6, 0, -16, 7);
    ctx.closePath();
    ctx.fill();
  }

  // Ailerons
  ctx.fillStyle = '#FF6F91';
  ctx.strokeStyle = 'rgba(46,42,77,0.4)';
  ctx.lineWidth = 1;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(-4, side * 8);
    ctx.lineTo(-20, side * 20);
    ctx.lineTo(-18, side * 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Coque
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.bezierCurveTo(18, -13, -8, -13, -18, -8);
    ctx.lineTo(-18, 8);
    ctx.bezierCurveTo(-8, 13, 18, 13, 26, 0);
    ctx.closePath();
  };
  const bg = ctx.createLinearGradient(0, -12, 0, 12);
  bg.addColorStop(0, '#FFFFFF');
  bg.addColorStop(0.5, '#E6EAF5');
  bg.addColorStop(1, '#A9B3CC');
  bodyPath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.save();
  bodyPath();
  ctx.clip();
  ctx.fillStyle = '#FF6F91';
  ctx.fillRect(15, -14, 14, 28);          // nez
  ctx.fillStyle = '#FFC93C';
  ctx.fillRect(-12, -14, 3, 28);          // bande décorative
  ctx.restore();
  bodyPath();
  ctx.strokeStyle = 'rgba(46,42,77,0.45)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Hublot
  const wg = ctx.createRadialGradient(1, -2, 1, 3, 0, 7);
  wg.addColorStop(0, '#DFFAFF');
  wg.addColorStop(1, '#2E8BD6');
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#7C88A8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(1, -2, 1.8, 0, TAU);
  ctx.fill();

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

/** Boussole autour du vaisseau : elle montre où sont les objets de la mission (mode Cadet) */
function drawCompass() {
  if (mode !== 'cadet' || state !== 'playing' || ship.spaghetti > 0) return;
  const cx = viewW / 2, cy = viewH / 2;
  const ringR = clamp(Math.min(viewW, viewH) / 2 - 80, 110, 220);
  const placed = [];
  const todo = mission
    .filter((m) => !m.done)
    .map((m) => nearestBodyFor(m.obj.id))
    .filter(Boolean)
    .sort((p, q) => Math.hypot(p.x - ship.x, p.y - ship.y) - Math.hypot(q.x - ship.x, q.y - ship.y));
  for (const b of todo) {
    if (inView(b.x, b.y, -20)) continue;
    const dx = b.x - ship.x, dy = b.y - ship.y;
    const a = Math.atan2(dy, dx);
    // deux objets dans la même direction : le plus lointain passe sur un cercle plus grand
    let r = ringR;
    while (placed.some((p) => Math.hypot(p.x - Math.cos(a) * r, p.y - Math.sin(a) * r) < 46)) r += 48;
    placed.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = '#FFC93C';
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(20, -10);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(11,15,51,0.85)';
    ctx.strokeStyle = '#FFC93C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, TAU);
    ctx.fill();
    ctx.stroke();
    const art = b.art || arts[b.id];
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, TAU);
    ctx.clip();
    const s = 19 * 2.2 * 0.9;
    ctx.drawImage(art.canvas, -s, -s, s * 2, s * 2);
    ctx.restore();
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

  mctx.strokeStyle = 'rgba(255,255,255,0.1)';
  mctx.lineWidth = dpr;
  PLANETS.forEach((p) => {
    mctx.beginPath();
    mctx.arc(0, 0, p.dist * k, 0, TAU);
    mctx.stroke();
  });
  mctx.strokeStyle = 'rgba(200,170,130,0.25)';
  mctx.lineWidth = (BELT.outer - BELT.inner) * k;
  mctx.beginPath();
  mctx.arc(0, 0, ((BELT.inner + BELT.outer) / 2) * k, 0, TAU);
  mctx.stroke();

  WORMHOLES.forEach((wh) => {
    mctx.fillStyle = '#B98BFF';
    mctx.beginPath();
    mctx.arc(wh.x * k, wh.y * k, 2.5 * dpr, 0, TAU);
    mctx.fill();
  });

  const t = worldT;
  const targetIds = new Set(mission.filter((m) => !m.done).map((m) => m.obj.id));
  for (const b of bodies) {
    const big = ['soleil', 'jupiter', 'saturne', 'galaxie', 'nebuleuse'].includes(b.id);
    const size = (b.id === 'soleil' ? 5 : big ? 3.5 : b.r > 40 ? 3 : 2) * dpr;
    mctx.fillStyle = photographed.has(b.id) ? '#7CF0A0' : MAP_COLORS[b.id] || '#FFFFFF';
    mctx.beginPath();
    mctx.arc(b.x * k, b.y * k, size, 0, TAU);
    mctx.fill();
    if (mode === 'cadet' && state === 'playing' && targetIds.has(b.id)) {
      mctx.strokeStyle = `rgba(255,201,60,${0.6 + Math.sin(t * 5) * 0.4})`;
      mctx.lineWidth = 1.5 * dpr;
      mctx.beginPath();
      mctx.arc(b.x * k, b.y * k, size + 3 * dpr, 0, TAU);
      mctx.stroke();
    }
  }

  // Le vaisseau
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
  drawGoldStars();
  drawLabels();
  drawTargetsOnMap();
  drawScan();
  drawEffects();
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
  update(dt, now);
  updateBip(now);
  draw(now);
  requestAnimationFrame(loop);
}

/* ---------- Panneau de mission ---------- */
function setMissionCollapsed(collapsed) {
  missionPanel.classList.toggle('collapsed', collapsed);
  $('missionToggle').setAttribute('aria-expanded', String(!collapsed));
}
$('missionToggle').addEventListener('click', (e) => {
  e.currentTarget.blur();
  setMissionCollapsed(!missionPanel.classList.contains('collapsed'));
});

/* ---------- Carnet de l'explorateur ---------- */
function renderCarnet() {
  $('carnetSub').textContent = `${discoveredCount()} / ${SPACE_OBJECTS.length} objets découverts — prends-les tous en photo !`;
  carnetGrid.innerHTML = SPACE_OBJECTS.map((o) => {
    const known = !!carnet[o.id];
    return `<button class="c-item${known ? '' : ' locked'}" data-id="${o.id}">
      <img src="${thumbs[o.id]}" alt="">
      <span>${known ? escapeHtml(o.name) : '???'}</span>
    </button>`;
  }).join('');
  carnetDetail.hidden = true;
}

function showCarnetDetail(id) {
  const o = OBJECT_BY_ID[id];
  const known = !!carnet[id];
  carnetDetail.innerHTML = known
    ? `<img src="${thumbs[id]}" alt="">
       <div>
         <p class="cd-name">${escapeHtml(o.name)} <small>(${escapeHtml(o.kind)})</small></p>
         <ul>${o.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
         <p class="cd-wow"><b>😲 Incroyable mais vrai :</b> ${escapeHtml(o.wow)}</p>
         <p class="cd-count">📸 Photographié ${carnet[id]} fois</p>
       </div>`
    : `<img class="locked" src="${thumbs[id]}" alt="">
       <div>
         <p class="cd-name">Objet mystère</p>
         <p class="cd-riddle">Indice : « ${escapeHtml(o.riddle)} »</p>
         <p>Trouve-le dans l'espace et prends-le en photo pour le débloquer !</p>
       </div>`;
  carnetDetail.hidden = false;
  carnetDetail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

carnetGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.c-item');
  if (btn) showCarnetDetail(btn.dataset.id);
});

function openCarnet() {
  renderCarnet();
  carnetOverlay.hidden = false;
  if (state === 'playing' && !paused) {
    paused = true;
    pauseStart = performance.now();
  }
  $('carnetClose').focus({ preventScroll: true });
}

function closeCarnet() {
  carnetOverlay.hidden = true;
  if (paused) {
    startTime += performance.now() - pauseStart;
    paused = false;
  }
}

$('carnetBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openCarnet(); });
$('winCarnetBtn').addEventListener('click', openCarnet);
$('carnetClose').addEventListener('click', closeCarnet);
carnetOverlay.addEventListener('click', (e) => { if (e.target === carnetOverlay) closeCarnet(); });

/* ---------- Son ---------- */
function renderSoundBtn() {
  soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
}
soundBtn.addEventListener('click', (e) => {
  e.currentTarget.blur();
  toggleSound();
  renderSoundBtn();
});

/* ---------- Victoire + classement ---------- */
function launchConfetti() {
  const pieces = ['🚀', '⭐', '🪐', '✨', '🌟', '☄️', '📸', '👽'];
  for (let i = 0; i < 24; i++) {
    const span = document.createElement('span');
    span.className = 'confetti-piece';
    span.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    span.style.left = `${Math.random() * 100}vw`;
    span.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
    span.style.fontSize = `${1 + Math.random() * 1.2}rem`;
    confettiLayer.appendChild(span);
    setTimeout(() => span.remove(), 3000);
  }
}

function finishGame() {
  state = 'won';
  ship.thrust = false;
  ship.turbo = 0;
  const seconds = Math.floor(elapsedSeconds());
  finalScore = Math.max(1, seconds - starsTaken);
  timerEl.textContent = String(seconds);
  say(pick(BIP.win), 5, 6000);
  setTimeout(() => sfx.win(), 300);

  setTimeout(() => {
    $('winPhotos').innerHTML = mission
      .map((m, i) => `<figure style="--tilt:${(i % 2 ? 1 : -1) * rand(2, 6)}deg"><img src="${thumbs[m.obj.id]}" alt=""><figcaption>${escapeHtml(m.obj.name)}</figcaption></figure>`)
      .join('');
    const bonus = starsTaken ? `<br>⭐ ${starsTaken} étoile${starsTaken > 1 ? 's' : ''} d'or : −${starsTaken} point${starsTaken > 1 ? 's' : ''}` : '';
    $('winTime').innerHTML = `Mission réussie en ${seconds} secondes.${bonus}<br>Ton score : <strong>${finalScore} points</strong><br><small>(le moins de points possible, c'est le mieux !)</small>`;
    $('winCarnet').textContent = newInCarnet.length
      ? `📖 ${newInCarnet.length} nouvel${newInCarnet.length > 1 ? 's' : ''} objet${newInCarnet.length > 1 ? 's' : ''} dans ton carnet (${discoveredCount()}/${SPACE_OBJECTS.length}) !`
      : `📖 Ton carnet : ${discoveredCount()}/${SPACE_OBJECTS.length} objets découverts.`;
    scoreForm.style.display = 'block';
    scoreSaved.style.display = 'none';
    pseudoInput.value = '';
    winBanner.classList.add('show');
    launchConfetti();
  }, 1600);
}

$('playAgain').addEventListener('click', (e) => {
  e.currentTarget.blur();
  winBanner.classList.remove('show');
  showStartScreen(true);
});

$('restart').addEventListener('click', (e) => {
  e.currentTarget.blur();
  winBanner.classList.remove('show');
  closeCarnet();
  showStartScreen(true);
});

$('startBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  startGame();
});

$('newOrderBtn').addEventListener('click', () => {
  pickMission();
  renderMissionLists();
});

document.querySelectorAll('.mode-btn').forEach((b) => {
  b.addEventListener('click', () => setMode(b.dataset.mode));
});

document.querySelectorAll('.lb-tabs button').forEach((b) => {
  b.addEventListener('click', () => showLeaderboard(b.dataset.lb));
});

function showLeaderboard(m) {
  lbMode = m;
  document.querySelectorAll('.lb-tabs button').forEach((b) => {
    const on = b.dataset.lb === m;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  renderLeaderboard();
}

async function renderLeaderboard() {
  if (!isLeaderboardConfigured()) {
    leaderboardList.innerHTML =
      '<li class="leaderboard-empty">Classement mondial pas encore activé sur ce site (configuration Firebase à faire par l\'administrateur).</li>';
    return;
  }

  const wanted = lbMode;
  leaderboardList.innerHTML = '<li class="leaderboard-empty">Chargement…</li>';
  const list = await fetchTopScores(MODES[wanted].gameId, 20);
  if (wanted !== lbMode) return; // on a changé d'onglet entre-temps
  leaderboardList.innerHTML = '';

  if (list.length === 0) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty">Sois le premier du classement mondial !</li>';
    return;
  }

  list.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-time">${entry.value} pts</span>
    `;
    leaderboardList.appendChild(li);
  });
}

$('saveScore').addEventListener('click', async () => {
  const name = pseudoInput.value.trim();
  if (!name) {
    pseudoInput.focus();
    return;
  }
  const saveBtn = $('saveScore');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Envoi…';
  const ok = await submitScore(MODES[mode].gameId, name, finalScore);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer mon score';

  if (ok) {
    scoreForm.style.display = 'none';
    scoreSaved.textContent = 'Score enregistré ! 🎉';
    scoreSaved.style.color = 'var(--green)';
    scoreSaved.style.display = 'block';
    showLeaderboard(mode);
  } else {
    scoreSaved.textContent = "Oups, l'enregistrement a échoué. Réessaie !";
    scoreSaved.style.color = 'var(--red)';
    scoreSaved.style.display = 'block';
  }
});

$('skipScore').addEventListener('click', () => {
  scoreForm.style.display = 'none';
});

/* ---------- Démarrage ---------- */
async function init() {
  resize();
  new ResizeObserver(resize).observe(stage);
  buildBackground();
  SPACE_OBJECTS.forEach((obj) => {
    thumbs[obj.id] = renderArt(obj.id, 34).canvas.toDataURL();
  });
  buildWorld();
  renderSoundBtn();
  carnetCountEl.textContent = `${discoveredCount()}/${SPACE_OBJECTS.length}`;
  try {
    await document.fonts.load('700 17px "Baloo 2"');
  } catch (err) {
    // tant pis, on garde la police de secours
  }
  showStartScreen(true);
  requestAnimationFrame(loop);
}

init();
showLeaderboard(mode);
