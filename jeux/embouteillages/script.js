// ============================================================================
// LES EMBOUTEILLAGES DE BOUCHONVILLE — le jeu
// Une ville vue de dessus où plus personne ne connaît les règles : aux
// carrefours, les conducteurs se disputent, klaxonnent et s'énervent.
// L'enfant choisit un panneau en bas de l'écran (STOP, Cédez-le-passage) et
// le plante au bord d'un carrefour, pour que toutes les voitures arrivent à
// leur lieu (école, hôpital, boulangerie, piscine…). Les étoiles récompensent
// les conducteurs restés calmes. Zaza, la zèbre agente de la circulation,
// guide l'enfant et explique chaque panneau.
//
// Ce fichier : le déroulé (écran de départ, carte des quartiers, fenêtres),
// la caméra, le toucher et la souris, la boucle de dessin, les étincelles et
// les bruits, la leçon guidée du premier niveau et le « Montre-moi » du
// conseil. Sur téléphone : le jeu se joue couché (barre des panneaux à
// droite), et un toucher près d'un carrefour vu de loin zoome d'abord dessus.
// La simulation est dans ville.js, les dessins dans art.js.
// Avec ?debug : tous les niveaux sont ouverts, ?debug&niveau=N ouvre le
// niveau N, et window.__emb donne verifie(), auto(), bench(), cible()…
// ============================================================================

import { createWorld, playSolution, pointAt, turnOf, TICK_RATE, TILE } from './ville.js';
import {
  buildCity, drawCityStatic, drawFountainWater, drawRiverShine, drawPeds, drawCloudShadows, drawCar, carLook,
  drawCarBubble, drawSteam, drawSignPost, drawRoadMarking, drawBlindBadge, drawLieuBadge, drawToolIcon, ZAZA_SVG, INK,
} from './art.js';
import { PANNEAUX, PANNEAU_BY_ID, LIEUX, ZAZA, STAR_TEXT } from './data.js';
import { QUARTIERS, LEVELS, BIENTOT } from './levels/index.js';
import { playStory } from './intro.js';
import { sfx, isSoundOn, toggleSound } from './sound.js';

const SAVE_KEY = 'embouteillages-v1';
const SAVE_VERSION = 1;
const STEP_S = 1 / TICK_RATE;
const FAST = 3;
const MAX_ZOOM = 3;
const TAU = Math.PI * 2;

const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
/* typographie française : « ! ? : ; » restent collés au mot d'avant (espace insécable) */
const fr = (text) => String(text).replace(/ ([!?:;»])/g, ' $1').replace(/« /g, '« ');
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

/* ---------- Les éléments de la page ---------- */
const stage = $('stage');
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const bubble = $('bubble');
const copilot = $('copilot');
const toolsEl = $('tools');
const dialog = $('dialog');
const dialogCard = $('dialogCard');
const startOverlay = $('startOverlay');
const levelsOverlay = $('levelsOverlay');
const introOverlay = $('introOverlay');
const quitOverlay = $('quitOverlay');
const confettiLayer = $('confettiLayer');
const tutoEl = $('tuto');
const tutoHand = $('tutoHand');
const rotateOverlay = $('rotateOverlay');
$('zazaSlot').innerHTML = ZAZA_SVG;
$('tutoFace').innerHTML = ZAZA_SVG;

/* ---------- La sauvegarde ---------- */
let save = { v: SAVE_VERSION, best: {}, seenIntro: false, seenSigns: {}, seenQuartiers: {}, last: 0 };
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d && d.v === SAVE_VERSION) save = { ...save, ...d };
  } catch (e) { /* stockage indisponible */ }
}
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* stockage indisponible */ }
}
function resetSave() {
  save = { v: SAVE_VERSION, best: {}, seenIntro: save.seenIntro, seenSigns: {}, seenQuartiers: {}, last: 0 };
  writeSave();
}
loadSave();

const starsFor = (lv, calm) => lv.etoiles.filter((n) => calm >= n).length;
const bestOf = (lv) => save.best[lv.id] || null;
const bestStars = (lv) => (bestOf(lv) ? bestOf(lv).stars : 0);
const isWon = (lv) => bestStars(lv) > 0;
const isOpen = (i) => DEBUG || i === 0 || isWon(LEVELS[i - 1]) || isWon(LEVELS[i]);
const totalStars = () => LEVELS.reduce((n, lv) => n + bestStars(lv), 0);
const firstUnfinished = () => {
  const i = LEVELS.findIndex((lv) => !isWon(lv));
  return i < 0 ? LEVELS.length - 1 : i;
};

/* ---------- L'état du jeu ---------- */
let mode = 'menu';                 // 'menu', 'play', 'fete' (la petite fête de fin), 'result'
let levelIndex = 0;
let LV = null;                     // le niveau en cours
let W_ = null;                     // la simulation (ville.js)
let M = null;                      // le plan dessiné (art.js)
let staticCv = null;               // la ville déjà dessinée
let staticK = 0;
let tool = null;                   // le panneau choisi
let paused = false;
let fast = false;
let acc = 0;
let hoverSlot = null;
let hoverCar = null;
let focusCar = null;               // la voiture dont on montre le chemin
let particles = [];
let floaters = [];
let skids = [];
let shake = 0;
let flags = {};
let pulses = {};                   // les lieux qui viennent d'accueillir une voiture
let posePop = {};                  // l'animation d'un panneau qu'on vient de planter
let jamSince = {};                 // depuis quand un carrefour est bloqué
let autoSteps = null;
let feteT = 0;
let animT = 0;
let tuto = null;                   // la leçon guidée en cours (ou un « Montre-moi »)
let cam = null;                    // un mouvement de caméra en cours
let camFocus = null;               // le point que la caméra garde en vue (leçon, loupe)
let loupeBack = 0;                 // le retour à toute la ville, après un zoom « loupe »

/* la caméra : zoom z (zoom pour tout voir × zoom de l'enfant), centre (cx, cy) dans le monde */
const view = { W: 800, H: 600, dpr: 1, z: 1, fitZ: 1, user: 1, cx: 0, cy: 0, top: 58, bottom: 100, left: 0, right: 0 };

/* ---------- Zaza ---------- */
let zaza = { until: 0, prio: 0 };
let lastTalk = 0;
function say(text, prio = 1, dur = 4800) {
  /* pendant la leçon, Zaza parle seulement dans sa grande bulle */
  if (tuto) return;
  const now = performance.now();
  if (now < zaza.until && prio < zaza.prio) return;
  bubble.textContent = fr(text);
  bubble.classList.remove('show');
  void bubble.offsetWidth;
  bubble.classList.add('show');
  copilot.classList.add('talking');
  zaza = { until: now + dur, prio };
  lastTalk = now;
  sfx.zaza();
}
function sayOnce(key, text, prio = 1, dur) {
  if (flags[key]) return;
  flags[key] = true;
  say(typeof text === 'string' ? text : pick(text), prio, dur);
}
function updateZaza(now) {
  if (zaza.until && now > zaza.until) {
    bubble.classList.remove('show');
    copilot.classList.remove('talking');
    zaza = { until: 0, prio: 0 };
  }
  if (mode === 'play' && !paused && !anyOverlay() && !tuto && now - lastTalk > 30000) {
    say(Math.random() < 0.65 ? pick(ZAZA.idle) : pick(ZAZA.blagues), 0, 6000);
  }
}

/* ---------- La taille de l'écran et la caméra ---------- */
function fit() {
  const r = stage.getBoundingClientRect();
  view.W = Math.max(200, r.width);
  view.H = Math.max(200, r.height);
  view.dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(view.W * view.dpr);
  canvas.height = Math.round(view.H * view.dpr);
  if (!W_) return;
  const phone = document.body.classList.contains('phone');
  const side = document.body.classList.contains('side-bar');
  const bar = $('toolBar');
  view.top = phone ? 44 : 56;
  /* téléphone couché : la barre des panneaux est debout, à droite */
  view.bottom = side ? 6 : (bar ? bar.offsetHeight : 80) + (phone ? 10 : 16);
  view.right = side && bar ? bar.offsetWidth + 14 : 0;
  const mapW = M.W * TILE, mapH = M.H * TILE;
  const availH = Math.max(120, view.H - view.top - view.bottom);
  view.left = 0;
  view.fitZ = Math.min(availH / mapH, (view.W - view.right - 16) / mapW);
  /* s'il y a la place, la ville se pousse à droite du panneau de l'objectif */
  const panel = $('goalPanel');
  if (!phone && panel && !panel.classList.contains('collapsed')) {
    const reserve = panel.offsetWidth + 18;
    const z2 = Math.min(availH / mapH, (view.W - view.right - reserve - 12) / mapW);
    if (z2 >= view.fitZ * 0.9) { view.fitZ = z2; view.left = reserve; }
  }
  /* la leçon garde son carrefour bien en vue */
  cam = null;
  if (camFocus) camTo(camFocus.pt, camFocus.user, true, camFocus.loupe);
  else setZoom(view.user);
}
function setZoom(u, ax, ay) {
  const mapW = M.W * TILE, mapH = M.H * TILE;
  const old = view.z;
  view.user = Math.max(1, Math.min(MAX_ZOOM / view.fitZ, u));
  view.z = view.fitZ * view.user;
  /* on zoome autour du doigt (ou de la souris) */
  if (ax != null && old) {
    const [wx, wy] = toWorld(ax, ay, old);
    view.cx = wx - (ax - midX()) / view.z;
    view.cy = wy - (ay - midY()) / view.z;
  }
  if (view.user === 1) { view.cx = mapW / 2; view.cy = mapH / 2; }
  clampCam();
}
const midX = () => view.left + (view.W - view.left - view.right) / 2;
const midY = () => view.top + (view.H - view.top - view.bottom) / 2;
function clampCam() {
  const mapW = M.W * TILE, mapH = M.H * TILE;
  const hw = (view.W - view.left - view.right) / view.z / 2;
  const hh = (view.H - view.top - view.bottom) / view.z / 2;
  view.cx = mapW <= hw * 2 ? mapW / 2 : Math.max(hw - 20, Math.min(mapW - hw + 20, view.cx));
  view.cy = mapH <= hh * 2 ? mapH / 2 : Math.max(hh - 20, Math.min(mapH - hh + 20, view.cy));
}
function toWorld(sx, sy, z = view.z) { return [(sx - midX()) / z + view.cx, (sy - midY()) / z + view.cy]; }
function toScreen(wx, wy) { return [(wx - view.cx) * view.z + midX(), (wy - view.cy) * view.z + midY()]; }

/* La caméra qui glisse jusqu'à un carrefour (leçon, loupe) ou recule pour
   montrer toute la ville (pt = null). user : le zoom voulu, sinon celui où un
   carrefour et ses rues remplissent l'écran. */
function focusZoom() {
  const w = view.W - view.left - view.right, h = view.H - view.top - view.bottom;
  /* assez près pour viser les ronds au doigt, sans perdre les rues autour */
  return Math.max(1, Math.min(1.6, w / (8 * TILE), h / (5 * TILE)) / view.fitZ);
}
function camTo(pt, user, instant = false, loupe = false) {
  if (!M) return;
  camFocus = pt ? { pt, user, loupe } : null;
  const u = pt ? Math.max(1, Math.min(MAX_ZOOM / view.fitZ, user || focusZoom())) : 1;
  const z = view.fitZ * u;
  let to = { x: M.W * TILE / 2, y: M.H * TILE / 2, u };
  if (pt) {
    /* le carrefour se place au milieu de ce qui reste visible sous la bulle de la leçon */
    let shift = 0;
    if (!tutoEl.hidden) {
      const sr = stage.getBoundingClientRect();
      const b = tutoEl.getBoundingClientRect().bottom - sr.top;
      shift = Math.max(0, (b - view.top) / 2);
    }
    to = { x: pt.x, y: pt.y - shift / z, u };
  }
  if (instant) { cam = { t: 1, dur: 1, from: to, to }; updateCam(0); return; }
  cam = { t: 0, dur: 0.8, from: { x: view.cx, y: view.cy, u: view.user }, to };
}
function updateCam(dt) {
  if (!cam) return;
  cam.t = Math.min(cam.dur, cam.t + dt);
  const k0 = cam.t / cam.dur;
  const k = k0 * k0 * (3 - 2 * k0);
  view.user = cam.from.u + (cam.to.u - cam.from.u) * k;
  view.z = view.fitZ * view.user;
  view.cx = cam.from.x + (cam.to.x - cam.from.x) * k;
  view.cy = cam.from.y + (cam.to.y - cam.from.y) * k;
  clampCam();
  if (k0 >= 1) cam = null;
}
const nodeAt = (c, r) => W_.city.nodes.find((n) => n.c === c && n.r === r);

/* la ville déjà dessinée, à la bonne finesse pour le zoom */
function ensureStatic() {
  const k = Math.max(0.75, Math.min(3, view.z * view.dpr));
  if (staticCv && Math.abs(k - staticK) / staticK < 0.2) return;
  staticK = k;
  staticCv = document.createElement('canvas');
  staticCv.width = Math.ceil(M.W * TILE * k);
  staticCv.height = Math.ceil(M.H * TILE * k);
  const c = staticCv.getContext('2d');
  c.scale(k, k);
  drawCityStatic(c, M);
}

/* ---------- Commencer un niveau ---------- */
function loadLevel(i) {
  levelIndex = Math.max(0, Math.min(LEVELS.length - 1, i));
  LV = LEVELS[levelIndex];
  W_ = createWorld(LV);
  M = buildCity(LV, W_.city, levelIndex * 31 + 7);
  for (const car of W_.cars) {
    const l = M.lieux.find((x) => x.ch === car.vers);
    car.lieu = l;
    car.look2 = carLook(car.look);
    car.px = car.x; car.py = car.y; car.pa = car.a;
    car.honkT = 0;
    car.nextHonk = 1 + (car.id % 5) * 0.4;
    car.vPrev = 0;
  }
  staticCv = null;
  tool = null;
  hoverSlot = hoverCar = focusCar = null;
  particles = []; floaters = []; skids = [];
  flags = {}; pulses = {}; posePop = {}; jamSince = {};
  acc = 0; shake = 0; feteT = 0;
  view.user = 1;
  stopTuto();
  cam = null; camFocus = null;
  clearTimeout(loupeBack);
  document.body.classList.toggle('lecon', !!LV.lecon);
  if (LV.lecon) $('goalPanel').classList.add('collapsed');
  buildToolBar();
  renderGoal();
  renderHud(true);
  fit();
}

function startLevel(i) {
  closeAll();
  loadLevel(i);
  mode = 'play';
  setPaused(false);
  setFast(false);
  autoSteps = null;
  /* la leçon de Zaza présente elle-même le quartier et les panneaux */
  if (LV.lecon) {
    save.seenQuartiers[LV.quartier.id] = true;
    writeSave();
    beginLevel();
    return;
  }
  const queue = [];
  const q = LV.quartier;
  if (!save.seenQuartiers[q.id]) queue.push((next) => quartierDialog(q, next));
  for (const id of Object.keys(LV.panneaux || {})) {
    const p = PANNEAU_BY_ID[id];
    if (p && !save.seenSigns[id]) queue.push((next) => signDialog(p, next));
  }
  if (!queue.length) { beginLevel(); return; }
  paused = true;
  runQueue(queue, () => { setPaused(false); beginLevel(); });
}
function runQueue(queue, done) {
  const next = () => {
    const f = queue.shift();
    if (f) f(next); else done();
  };
  next();
}
function beginLevel() {
  sfx.go();
  if (LV.lecon) { startTuto(LV.lecon); return; }
  showBanner();
  const first = levelIndex === 0 && !flags.premier && !Object.keys(save.best).length;
  if (first) { flags.premier = true; say(ZAZA.premier, 2, 7000); setTimeout(() => { if (mode === 'play') say(LV.intro, 2, 7000); }, 7200); }
  else say(LV.intro, 1, 6000);
}
function showBanner() {
  const b = $('levelBanner');
  b.innerHTML = '';
  b.append(el('small', null, `${LV.quartier.icone} ${LV.quartier.nom} · niveau ${LV.li + 1}`));
  b.append(el('b', null, LV.nom));
  b.hidden = false;
  b.style.animation = 'none';
  void b.offsetWidth;
  b.style.animation = '';
  setTimeout(() => { b.hidden = true; }, 2500);
}

/* ---------- La barre des panneaux ---------- */
function toolList() {
  return [...Object.keys(LV.panneaux || {}).map((id) => PANNEAU_BY_ID[id]).filter(Boolean), PANNEAU_BY_ID.enlever];
}
function buildToolBar() {
  toolsEl.innerHTML = '';
  toolList().forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'tool-btn';
    b.dataset.tool = p.id;
    b.title = `${p.nom} : ${p.court}`;
    b.setAttribute('aria-label', `${p.nom} : ${p.court}`);
    const cv = document.createElement('canvas');
    cv.width = 96; cv.height = 96;
    drawToolIcon(cv, p.id);
    b.append(cv);
    b.append(el('span', 'tl-name', p.nom));
    if (!p.outil) b.append(el('span', 'tl-count', '0'));
    const k = document.createElement('kbd');
    k.textContent = String(i + 1);
    b.append(k);
    b.addEventListener('click', (e) => { e.currentTarget.blur(); selectTool(tool === p.id ? null : p.id); });
    toolsEl.append(b);
  });
  renderToolCounts();
}
function renderToolCounts() {
  for (const b of toolsEl.querySelectorAll('.tool-btn')) {
    const id = b.dataset.tool;
    b.classList.toggle('on', tool === id);
    const cnt = b.querySelector('.tl-count');
    if (cnt) {
      const n = W_.stock[id] || 0;
      cnt.textContent = String(n);
      b.classList.toggle('empty', n === 0);
    }
  }
  canvas.classList.toggle('tooling', !!tool);
}
function selectTool(id, silent = false) {
  tool = id;
  renderToolCounts();
  if (!silent) sfx.select();
  if (tuto) { tutoCheck(); return; }
  if (id && id !== 'enlever' && !flags[`tool-${id}`]) {
    flags[`tool-${id}`] = true;
    say(id === 'stop' ? ZAZA.poseStop : ZAZA.poseCede, 1, 4200);
    if (W_.city.nodes.some((n) => n.aveugle)) setTimeout(() => sayOnce('aveugle', ZAZA.aveugle, 1, 5000), 4400);
  }
}
function pulseTool(id) {
  const b = toolsEl.querySelector(`[data-tool="${id}"]`);
  if (!b) return;
  b.classList.remove('pop');
  void b.offsetWidth;
  b.classList.add('pop');
}

/* ---------- L'objectif et le HUD ---------- */
function renderGoal() {
  const body = $('goalBody');
  body.innerHTML = '';
  body.append(el('p', 'goal-name', LV.nom));
  body.append(el('p', 'goal-line', `Amène les ${W_.total} voitures à bon port, sans que les conducteurs s’énervent !`));
  const list = el('div', 'goal-lieux');
  for (const l of M.lieux) {
    const n = W_.cars.filter((c) => c.vers === l.ch).length;
    if (!n) continue;
    const it = el('span', 'goal-lieu');
    it.dataset.lieu = l.ch;
    it.style.setProperty('--c', l.couleur);
    it.append(el('i', null, l.icone), el('b', null, `0/${n}`));
    it.title = l.nom;
    list.append(it);
  }
  body.append(list);
  const calm = el('p', 'goal-calm');
  calm.innerHTML = '';
  calm.append(document.createTextNode('😊 Conducteurs calmes : '), el('b', null, String(W_.total)));
  calm.id = 'goalCalm';
  body.append(calm);
  const st = el('p', 'goal-stars');
  st.append(el('span', null, `⭐ toutes arrivées · ⭐⭐ ${LV.etoiles[1]} calmes · ⭐⭐⭐ ${LV.etoiles[2]} calmes`));
  body.append(st);
  const best = bestOf(LV);
  if (best) body.append(el('p', 'goal-best', `Ton record : ${'⭐'.repeat(best.stars)} (${best.calm} conducteurs calmes)`));
}
let hudCache = {};
function renderHud(force = false) {
  const left = Math.max(0, Math.ceil((LV.temps || 0) - W_.time));
  const calm = W_.calm();
  const vals = {
    arrived: W_.arrived, total: W_.total, calm, time: left,
    name: `${LV.qi + 1}-${LV.li + 1} ${LV.nom}`,
  };
  if (force || vals.name !== hudCache.name) $('levelName').textContent = vals.name;
  if (force || vals.arrived !== hudCache.arrived) {
    $('arrivedCount').textContent = String(vals.arrived);
    $('totalCount').textContent = String(vals.total);
    if (!force) { const it = $('arrivedItem'); it.classList.remove('bump'); void it.offsetWidth; it.classList.add('bump'); }
    for (const it of document.querySelectorAll('.goal-lieu')) {
      const ch = it.dataset.lieu;
      const n = W_.cars.filter((c) => c.vers === ch).length;
      const a = W_.cars.filter((c) => c.vers === ch && (c.mode === 'gare' || c.mode === 'fini')).length;
      it.querySelector('b').textContent = `${a}/${n}`;
      it.classList.toggle('done', a >= n);
    }
  }
  if (force || vals.calm !== hudCache.calm) {
    $('calmCount').textContent = String(calm);
    const g = $('goalCalm');
    if (g) g.querySelector('b').textContent = String(calm);
    if (!force && calm < hudCache.calm) { const it = $('calmItem'); it.classList.remove('bump'); void it.offsetWidth; it.classList.add('bump'); }
  }
  if (force || vals.time !== hudCache.time) {
    $('timeLeft').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    $('timeItem').classList.toggle('low', left <= 20 && mode === 'play');
  }
  hudCache = vals;
}

/* ---------- Un pas de simulation ---------- */
function stepWorld() {
  for (const car of W_.cars) { car.px = car.x; car.py = car.y; car.pa = car.a; car.vPrev = car.v; }
  if (autoSteps) applyAuto();
  W_.step();
  for (const e of W_.events) handleEvent(e);
  W_.events.length = 0;
  if (mode === 'play' && W_.time >= (LV.temps || 999) && !W_.over) finishLevel();
}

function handleEvent(e) {
  if (e.type === 'arrive') {
    const car = e.car;
    sfx.arrive(car.id);
    burst(car.x, car.y, car.lieu ? car.lieu.couleur : '#FFC53D', 'confetti');
    floatText('+1', car.x, car.y - 10, car.lieu ? car.lieu.fonce : '#3A9C58');
    pulses[car.vers] = 1;
    if (focusCar === car) focusCar = null;
    renderHud();
    const left = W_.total - W_.arrived;
    if (left === 3) sayOnce('presque', ZAZA.presque, 0);
    else if (Math.random() < 0.25) say(pick(ZAZA.arrive), 0, 2500);
  } else if (e.type === 'frayeur') {
    sfx.frayeur();
    shake = 0.45;
    buzz([60, 40, 90]);
    for (const car of e.cars) {
      skids.push({ x: car.x, y: car.y, a: car.a, life: 7 });
      burst(car.x, car.y, '#FFFFFF', 'dust');
    }
    floatText('Ouh là !', e.node.x, e.node.y - 20, '#E3262E');
    say(e.node.aveugle ? pick(ZAZA.frayeur) : 'Ouh là ! Une grosse frayeur…', 3, 7000);
    renderHud();
  } else if (e.type === 'furieux') {
    floatText('😡', e.car.x, e.car.y - 14, '#E3262E');
    sayOnce('furieux', ZAZA.furieux, 1);
    renderHud();
  } else if (e.type === 'fini') {
    finishLevel();
  }
}

/* les klaxons, la colère qui fume, et les carrefours bloqués (pour Zaza) */
function liveEffects(dt) {
  const now = W_.time;
  for (const car of W_.cars) {
    car.honkT = Math.max(0, car.honkT - dt);
    if (car.mode !== 'voie' && car.mode !== 'carrefour') continue;
    const waiting = car.v < 4 && (car.why === 'dispute' || car.waitT > 2.2 || car.why === 'garage');
    if (!waiting) { car.nextHonk = Math.max(car.nextHonk, 0.8); continue; }
    car.nextHonk -= dt * (0.6 + car.colere * 1.6) * (car.why === 'dispute' ? 1.4 : 0.6);
    if (car.why === 'stop' || car.why === 'cede') car.nextHonk += dt * 0.9;
    if (car.nextHonk <= 0) {
      car.nextHonk = 1.4 + ((car.id * 7 + Math.floor(now)) % 5) * 0.35;
      car.honkT = car.colere > 0.8 ? 0.7 : 0.45;
      sfx.klaxon(car.id, car.colere > 0.8);
    }
  }
  /* les carrefours où l'on se dispute */
  const jammed = new Set();
  for (const car of W_.cars) {
    if (car.why === 'dispute' && car.v < 4 && car.lane) jammed.add(car.lane.to);
  }
  for (const n of W_.city.nodes) {
    if (jammed.has(n)) jamSince[n.id] = (jamSince[n.id] || 0) + dt;
    else delete jamSince[n.id];
  }
  for (const n of W_.city.nodes) {
    if ((jamSince[n.id] || 0) < 1.6) continue;
    const signed = W_.slots.filter((s) => s.node === n && W_.signs[s.key]);
    if (!signed.length) {
      if (!flags.dispute1) { flags.dispute1 = true; say(ZAZA.dispute[0], 2, 6000); }
      else if (!flags.disputeT || performance.now() - flags.disputeT > 20000) { flags.disputeT = performance.now(); say(pick(ZAZA.dispute), 1, 5000); }
    } else {
      /* il y a des panneaux, mais deux routes du même rang se croisent */
      const cars = W_.cars.filter((c) => c.why === 'dispute' && c.lane && c.lane.to === n);
      const rang = cars.length ? W_.signOf(cars[0].lane) : 'aucun';
      sayOnce(`rang-${n.id}-${rang}`, rang === 'aucun' ? ZAZA.deuxPrio : ZAZA.memeRang, 2, 8000);
    }
  }
}

/* ---------- Les étincelles et les petits textes ---------- */
function burst(x, y, col, kind) {
  const n = kind === 'confetti' ? 16 : kind === 'pose' ? 10 : 8;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const sp = kind === 'confetti' ? 40 + Math.random() * 60 : 20 + Math.random() * 30;
    particles.push({
      kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'confetti' ? 30 : 0),
      life: kind === 'confetti' ? 1.2 + Math.random() * 0.6 : 0.6 + Math.random() * 0.3, t: 0,
      col: kind === 'confetti' ? pick([col, '#FFC53D', '#FF6F91', '#5BC46A', '#36B8E8', '#FFFFFF']) : col,
      rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, s: 2 + Math.random() * 2,
    });
  }
}
function floatText(text, x, y, col) { floaters.push({ text, x, y, col, t: 0 }); }
function updateParticles(dt) {
  for (const p of particles) {
    p.t += dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 1 - dt * 2.5; p.vy *= 1 - dt * 2.5;
    if (p.kind === 'confetti') p.vy += 40 * dt;
    p.rot += p.vr * dt;
  }
  particles = particles.filter((p) => p.t < p.life);
  for (const f of floaters) f.t += dt;
  floaters = floaters.filter((f) => f.t < 1.6);
  for (const s of skids) s.life -= dt;
  skids = skids.filter((s) => s.life > 0);
  for (const k of Object.keys(pulses)) { pulses[k] = Math.max(0, pulses[k] - dt * 2.5); }
  for (const k of Object.keys(posePop)) { posePop[k] -= dt * 3; if (posePop[k] <= 0) delete posePop[k]; }
}
function drawParticles(c) {
  for (const p of particles) {
    const k = 1 - p.t / p.life;
    c.save();
    c.globalAlpha = Math.min(1, k * 1.5);
    c.translate(p.x, p.y);
    if (p.kind === 'confetti') {
      c.rotate(p.rot);
      c.fillStyle = p.col;
      c.fillRect(-p.s, -p.s / 2, p.s * 2, p.s);
    } else {
      c.fillStyle = p.kind === 'pose' ? 'rgba(200,190,170,0.9)' : 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(0, 0, p.s * (1.6 - k), 0, TAU); c.fill();
    }
    c.restore();
  }
}
function drawFloaters(c) {
  const s = Math.min(2, Math.max(1, 1 / view.z));
  for (const f of floaters) {
    const k = f.t / 1.6;
    c.save();
    c.globalAlpha = Math.min(1, (1 - k) * 2.5);
    c.translate(f.x, f.y - k * 26);
    c.scale(s, s);
    c.font = '800 14px "Baloo 2", sans-serif';
    c.textAlign = 'center';
    c.lineWidth = 3.5;
    c.strokeStyle = '#FFFFFF';
    c.strokeText(f.text, 0, 0);
    c.fillStyle = f.col;
    c.fillText(f.text, 0, 0);
    c.restore();
  }
}

/* ---------- Le dessin ---------- */
const lerpA = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * k; };
function render(now, dt) {
  const c = ctx;
  const t = now / 1000;
  animT += paused ? 0 : dt;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#5FA85A';
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (!W_) return;
  ensureStatic();
  let sx = 0, sy = 0;
  if (shake > 0) { sx = (Math.random() - 0.5) * shake * 14; sy = (Math.random() - 0.5) * shake * 14; }
  const z = view.z * view.dpr;
  c.setTransform(z, 0, 0, z, (midX() - view.cx * view.z + sx) * view.dpr, (midY() - view.cy * view.z + sy) * view.dpr);
  /* un cadre autour de la ville */
  c.fillStyle = 'rgba(20,40,20,0.35)';
  c.fillRect(-6, -6, M.W * TILE + 12, M.H * TILE + 12);
  c.drawImage(staticCv, 0, 0, M.W * TILE, M.H * TILE);
  drawRiverShine(c, M, animT);
  for (const f of M.fontaines) drawFountainWater(c, f.x, f.y, animT);

  /* les marques de pneus */
  for (const s of skids) {
    c.save();
    c.globalAlpha = Math.min(0.55, s.life / 7);
    c.translate(s.x, s.y);
    c.rotate(s.a);
    c.fillStyle = '#1E1B2E';
    c.fillRect(-26, -6, 22, 2.2);
    c.fillRect(-26, 4, 22, 2.2);
    c.restore();
  }
  /* les marquages au sol des panneaux */
  for (const slot of W_.slots) {
    const type = W_.signs[slot.key];
    if (type) drawRoadMarking(c, slot, type);
  }
  drawTutoZones(c, t);
  /* le chemin de la voiture choisie */
  const shown = focusCar || hoverCar;
  if (shown && (shown.mode === 'voie' || shown.mode === 'carrefour' || shown.mode === 'attente')) drawRoute(c, shown, animT);

  drawPeds(c, M, animT, paused ? 0 : dt * (fast ? FAST : 1));

  /* les voitures garées */
  const alpha = paused ? 1 : Math.min(1, acc / STEP_S);
  for (const car of W_.cars) {
    if ((car.mode !== 'gare' && car.mode !== 'fini') || !car.lieu) continue;
    const pl = car.lieu.places[car.place] || car.lieu.places[car.lieu.places.length - 1];
    const k = car.mode === 'fini' ? 1 : Math.min(1, car.parkT / 1.1);
    const e = k * k * (3 - 2 * k);
    const x = car.x + (pl.x - car.x) * e, y = car.y + (pl.y - car.y) * e;
    const a = lerpA(car.a, pl.a, e);
    drawCar(c, x, y, a, carOpts(car, t, { mood: Math.max(0, car.colere - 0.6), happy: true, brake: false }));
  }
  /* les voitures qui roulent */
  for (const car of W_.cars) {
    if (car.mode !== 'voie' && car.mode !== 'carrefour') continue;
    const x = car.px + (car.x - car.px) * alpha, y = car.py + (car.y - car.py) * alpha;
    const a = lerpA(car.pa, car.a, alpha);
    car.rx = x; car.ry = y;
    if (car === shown) {
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 2.5;
      c.beginPath(); c.arc(x, y, 19, 0, TAU); c.stroke();
    }
    drawCar(c, x, y, a, carOpts(car, t));
  }
  /* les poteaux des panneaux */
  const sel = tool && tool !== 'enlever';
  for (const slot of W_.slots) {
    const type = W_.signs[slot.key];
    if (type) {
      const pop = posePop[slot.key] || 0;
      const s = 1 + Math.sin(pop * Math.PI) * 0.45;
      if (tool === 'enlever' || (slot === hoverSlot && sel)) {
        c.strokeStyle = tool === 'enlever' ? '#FF5A4E' : '#FFE14D';
        c.lineWidth = 2;
        c.beginPath(); c.arc(slot.x, slot.y - 18, 13 + Math.sin(t * 6) * 1.5, 0, TAU); c.stroke();
      }
      drawSignPost(c, slot.x, slot.y, type, s);
    } else {
      /* l'emplacement d'un panneau : un petit rond, qui clignote quand on a choisi un panneau */
      const hot = slot === hoverSlot;
      const s = Math.min(1.8, Math.max(1, 1.1 / view.z));
      c.save();
      c.translate(slot.x, slot.y - 4);
      c.scale(s, s);
      /* pendant la leçon, seuls les ronds montrés par Zaza s'allument */
      if (tuto ? tutoRonds().includes(slot.key) : sel) {
        /* un rond jaune qui respire : « pose ton panneau ici » */
        const k = 1 + Math.sin(t * 5 + slot.x * 0.05) * 0.15;
        c.fillStyle = 'rgba(46,42,77,0.35)';
        c.beginPath(); c.arc(1, 1.5, 9.5 * k, 0, TAU); c.fill();
        c.fillStyle = hot ? '#FFFFFF' : '#FFE14D';
        c.strokeStyle = INK;
        c.lineWidth = 1.6;
        c.beginPath(); c.arc(0, 0, 8.5 * k, 0, TAU); c.fill(); c.stroke();
        c.strokeStyle = INK;
        c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(-4, 0); c.lineTo(4, 0); c.moveTo(0, -4); c.lineTo(0, 4); c.stroke();
      } else {
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.strokeStyle = 'rgba(255,255,255,0.75)';
        c.lineWidth = 1.3;
        c.setLineDash([3, 2.5]);
        c.beginPath(); c.arc(0, 0, 5.5, 0, TAU); c.fill(); c.stroke();
        c.setLineDash([]);
      }
      c.restore();
      if (hot && sel) drawSignPost(c, slot.x, slot.y, tool, 1, 0.65);
    }
  }
  /* les carrefours cachés (quand on tient un panneau) et les carrefours bloqués */
  for (const n of W_.city.nodes) {
    if (n.kind !== 'carrefour') continue;
    if ((sel || tutoShows(n)) && n.aveugle) drawBlindBadge(c, n.x, n.y, Math.min(1.6, Math.max(0.9, 1 / view.z)), t);
    const jam = jamSince[n.id] || 0;
    if (jam > 1.2 && mode === 'play') {
      const k = Math.min(1, (jam - 1.2) * 2);
      c.save();
      c.globalAlpha = k * (0.55 + Math.sin(t * 6) * 0.25);
      c.strokeStyle = '#FF5A4E';
      c.lineWidth = 3;
      c.setLineDash([6, 4]);
      c.beginPath(); c.arc(n.x, n.y, 36 + Math.sin(t * 6) * 2, 0, TAU); c.stroke();
      c.setLineDash([]);
      c.restore();
    }
  }
  /* les bulles, la fumée de colère */
  for (const car of W_.cars) {
    if (car.mode !== 'voie' && car.mode !== 'carrefour') continue;
    const x = car.rx, y = car.ry;
    if (car.colere > 0.72) drawSteam(c, x, y, t + car.id, Math.min(1, (car.colere - 0.72) * 4));
    let kind = null;
    if (car.honkT > 0) kind = car.colere > 0.8 ? 'tuutRouge' : 'tuut';
    else if (car.v < 4 && (car.why === 'dispute' || car.waitT > 1.6)) kind = car.colere > 0.5 || car.why === 'dispute' ? 'colere' : 'attend';
    if (kind) {
      car.bubK = (car.bubKind === kind ? car.bubK || 0 : 0) + dt;
      car.bubKind = kind;
      drawCarBubble(c, x, y, kind, car.bubK, t, view.z);
    } else car.bubKind = null;
  }
  /* les voitures qui attendent à l'entrée de la ville */
  for (const n of W_.city.nodes) {
    if (n.kind !== 'depart') continue;
    const q = W_.cars.filter((car) => car.mode === 'attente' && car.de === n.ch && car.t0 <= W_.time).length;
    if (!q) continue;
    drawQueueBadge(c, n, q, t);
  }
  /* les lieux et leur compteur */
  for (const l of M.lieux) {
    const total = W_.cars.filter((car) => car.vers === l.ch).length;
    const n = W_.cars.filter((car) => car.vers === l.ch && (car.mode === 'gare' || car.mode === 'fini')).length;
    const hot = (focusCar || hoverCar) && (focusCar || hoverCar).vers === l.ch ? 0.35 + Math.sin(t * 6) * 0.2 : 0;
    drawLieuBadge(c, l, n, total, t, Math.max(pulses[l.ch] || 0, hot), view.z);
  }
  drawTutoRings(c, t);
  drawParticles(c);
  drawCloudShadows(c, M, animT);
  drawFloaters(c);
  if (mode === 'fete') drawFete(c, t);
}

function carOpts(car, t, extra = {}) {
  let blink = null;
  if (car.mode === 'voie' && car.route[car.ri + 1]) {
    const lane = car.route[car.ri];
    if (lane.len - car.s < 95) {
      const tr = turnOf(lane, car.route[car.ri + 1]);
      if (tr !== 'tout-droit') blink = tr;
    }
  } else if (car.mode === 'carrefour' && car.turn !== 'tout-droit') blink = car.turn;
  return {
    color: car.lieu ? car.lieu.couleur : '#FFC53D', dark: car.lieu ? car.lieu.fonce : '#B8601E',
    look: car.look2, idx: car.id, mood: car.colere, honk: car.honkT > 0 ? 1 : 0, blink,
    brake: car.v < car.vPrev - 0.5 || (car.v < 3 && car.mode === 'voie'), t: t + car.id, furieux: car.furieux,
    stopped: car.v < 3, ...extra,
  };
}

function drawRoute(c, car, t) {
  const pts = [];
  const push = (piece, from = 0) => {
    for (let s = from; s < piece.len; s += 8) { const p = pointAt(piece, s); pts.push([p[0], p[1]]); }
  };
  if (car.mode === 'carrefour') push(car.cross, car.s);
  else if (car.mode === 'voie') push(car.route[car.ri], car.s);
  for (let i = car.mode === 'attente' ? 0 : car.ri + 1; i < car.route.length; i++) {
    const prev = car.route[i - 1];
    if (prev && i > car.ri + (car.mode === 'carrefour' ? 1 : 0)) {
      const a = prev.pts[prev.pts.length - 1], b = car.route[i].pts[0];
      pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    }
    push(car.route[i]);
  }
  if (pts.length < 2) return;
  c.save();
  c.strokeStyle = car.lieu ? car.lieu.couleur : '#FFFFFF';
  c.globalAlpha = 0.9;
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.setLineDash([2, 9]);
  c.lineDashOffset = -t * 30;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) c.lineTo(p[0], p[1]);
  c.stroke();
  c.restore();
}

function drawQueueBadge(c, n, q, t) {
  const s = Math.min(1.6, Math.max(1, 1 / view.z));
  const x = n.x + (n.c === 0 ? 30 : n.c === M.W - 1 ? -30 : 26), y = n.y + (n.r === 0 ? 26 : -26);
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const k = 1 + Math.sin(t * 5) * 0.06;
  c.scale(k, k);
  c.fillStyle = '#FF5A4E';
  c.beginPath(); c.roundRect(-16, -9, 32, 18, 9); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.fillStyle = '#FFFFFF';
  c.font = '800 11px "Baloo 2", sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(`🚗×${q}`, 0, 1);
  c.restore();
}

/* la petite fête quand tout le monde est arrivé */
function drawFete(c, t) {
  if (Math.random() < 0.4) {
    const l = pick(M.lieux);
    burst(l.bat[0] + Math.random() * l.bat[2], l.bat[1] + Math.random() * l.bat[3], l.couleur, 'confetti');
  }
}

/* ---------- La boucle ---------- */
let lastNow = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - (lastNow || now)) / 1000);
  lastNow = now;
  checkRotate();
  if (W_ && (mode === 'play' || mode === 'fete') && !paused && !anyOverlay() && !tutoHolds()) {
    acc += dt * (fast ? FAST : 1);
    let n = 0;
    while (acc >= STEP_S && n < 12) {
      acc -= STEP_S;
      n++;
      if (mode === 'play') stepWorld();
    }
    if (mode === 'play') liveEffects(dt * (fast ? FAST : 1));
    renderHud();
  }
  if (mode === 'fete') {
    feteT += dt;
    if (feteT > 1.8) showResult(true);
  }
  shake = Math.max(0, shake - dt * 1.5);
  updateParticles(paused ? 0 : dt);
  updateCam(dt);
  updateZaza(now);
  updateTuto();
  render(now, dt);
  placeHand();
  $('zoomOutBtn').hidden = !(W_ && mode === 'play' && view.user > 1.05 && !anyOverlay());
  requestAnimationFrame(frame);
}

/* ---------- Toucher, souris, clavier ---------- */
function findSlot(wx, wy) {
  const r = Math.max(15, 22 / view.z);
  let best = null, bd = r;
  for (const s of W_.slots) {
    /* on vise le rond au sol ou le panneau, un peu plus haut */
    const d = Math.min(Math.hypot(s.x - wx, s.y - 4 - wy), W_.signs[s.key] ? Math.hypot(s.x - wx, s.y - 20 - wy) : 99);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
function findCar(wx, wy) {
  const r = Math.max(14, 18 / view.z);
  let best = null, bd = r;
  for (const car of W_.cars) {
    if (car.mode !== 'voie' && car.mode !== 'carrefour') continue;
    const d = Math.hypot(car.x - wx, car.y - wy);
    if (d < bd) { bd = d; best = car; }
  }
  return best;
}
/* Au doigt, quand la ville est vue de loin, les ronds d'un carrefour sont
   trop serrés pour viser : le premier toucher zoome sur le carrefour (la loupe),
   le suivant pose le panneau. */
const LOUPE_GAP = 62;              // l'écart entre deux ronds d'un carrefour, dans le monde
function tapAt(sx, sy, touch = false) {
  if (!W_ || (mode !== 'play')) return;
  const [wx, wy] = toWorld(sx, sy);
  const slot = findSlot(wx, wy);
  if (slot && touch && tool && view.z * LOUPE_GAP < 46) {
    const u = Math.max(view.user, 78 / LOUPE_GAP / view.fitZ);
    camTo({ x: slot.node.x, y: slot.node.y }, u, false, true);
    sfx.open();
    return;
  }
  if (slot) { tapSlot(slot); return; }
  const car = findCar(wx, wy);
  if (car) {
    focusCar = focusCar === car ? null : car;
    if (focusCar) {
      sfx.select();
      say(`Cette voiture va à ${car.lieu ? car.lieu.nom.replace(/^L’/, 'l’').replace(/^La /, 'la ') : 'son lieu'} ${car.lieu ? car.lieu.icone : ''}`, 0, 2500);
    }
    return;
  }
  focusCar = null;
}
function tapSlot(slot) {
  const cur = W_.signs[slot.key];
  /* pendant la leçon, seul le rond montré par Zaza répond */
  if (tuto && !tutoAllows(slot)) { tutoNope(); return; }
  if (tool === 'enlever' || (cur && (!tool || tool === cur))) {
    if (cur && W_.remove(slot.key)) {
      sfx.enleve();
      burst(slot.x, slot.y - 14, '#FFFFFF', 'pose');
      renderToolCounts();
      pulseTool(cur);
      sayOnce('enleve', ZAZA.enleve, 0, 3000);
      tutoCheck();
    }
    return;
  }
  if (!tool) { sfx.refus(); say(ZAZA.choisis, 1, 3500); return; }
  if (!W_.place(slot.key, tool)) {
    sfx.refus();
    say(ZAZA.vide, 1, 4000);
    pulseTool(tool);
    return;
  }
  sfx.pose();
  setTimeout(() => sfx.sifflet(), 120);
  posePop[slot.key] = 1;
  burst(slot.x, slot.y, '#FFFFFF', 'pose');
  renderToolCounts();
  pulseTool(tool);
  buzz(25);
  if (!flags.pose1) { flags.pose1 = true; say(pick(ZAZA.pose), 1, 3500); }
  /* plus de panneau de ce type : on repose l'outil */
  if ((W_.stock[tool] || 0) === 0) selectTool(null, true);
  /* sur téléphone, après un zoom « loupe », on revoit toute la ville */
  if (camFocus && camFocus.loupe && !tuto) {
    clearTimeout(loupeBack);
    loupeBack = setTimeout(() => { if (camFocus && camFocus.loupe) camTo(null); }, 2200);
  }
  tutoCheck();
}

const pointers = new Map();
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  clearTimeout(loupeBack);
  pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  if (pointers.size === 1) drag = { x0: e.offsetX, y0: e.offsetY, cx: view.cx, cy: view.cy, moved: false };
  else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), user: view.user, moved: true };
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  if (!W_) return;
  if (drag && drag.pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    takeCamera();
    setZoom(drag.user * d / drag.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
    return;
  }
  if (drag && pointers.size === 1) {
    const dx = e.offsetX - drag.x0, dy = e.offsetY - drag.y0;
    if (Math.hypot(dx, dy) > 8) drag.moved = true;
    if (drag.moved && view.user > 1) {
      if (cam || camFocus) { takeCamera(); drag.cx = view.cx + dx / view.z; drag.cy = view.cy + dy / view.z; }
      view.cx = drag.cx - dx / view.z;
      view.cy = drag.cy - dy / view.z;
      clampCam();
      canvas.classList.add('dragging');
    }
    return;
  }
  if (e.pointerType === 'mouse') {
    const [wx, wy] = toWorld(e.offsetX, e.offsetY);
    hoverSlot = findSlot(wx, wy);
    hoverCar = hoverSlot ? null : findCar(wx, wy);
    canvas.classList.toggle('over-thing', !!(hoverSlot || hoverCar));
  }
});
function endPointer(e) {
  const had = pointers.has(e.pointerId);
  pointers.delete(e.pointerId);
  canvas.classList.remove('dragging');
  if (!had) return;
  if (drag && !drag.moved && !drag.pinch && pointers.size === 0) tapAt(e.offsetX, e.offsetY, e.pointerType !== 'mouse');
  if (pointers.size === 0) drag = null;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); drag = null; canvas.classList.remove('dragging'); });
canvas.addEventListener('pointerleave', () => { hoverSlot = null; hoverCar = null; });
/* l'enfant reprend la caméra en main (glisser, pincer, molette) */
function takeCamera() {
  cam = null;
  camFocus = null;
  clearTimeout(loupeBack);
}
canvas.addEventListener('wheel', (e) => {
  if (!W_) return;
  e.preventDefault();
  takeCamera();
  setZoom(view.user * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.offsetX, e.offsetY);
}, { passive: false });
canvas.addEventListener('dblclick', () => { if (W_) { takeCamera(); setZoom(1); } });

document.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.code === 'Escape') {
    if (!quitOverlay.hidden) { quitOverlay.hidden = true; return; }
    if (!levelsOverlay.hidden) { closeLevels(); return; }
    if (tool) { selectTool(null); return; }
  }
  if (mode !== 'play' || anyOverlay()) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 9) {
    const list = toolList();
    if (list[n - 1]) selectTool(tool === list[n - 1].id ? null : list[n - 1].id);
    return;
  }
  if (e.code === 'Space') { e.preventDefault(); setPaused(!paused); }
  else if (e.code === 'KeyF') setFast(!fast);
  else if (e.code === 'KeyR') restart();
});

/* ---------- Pause, vitesse, recommencer ---------- */
function setPaused(v) {
  paused = v;
  $('pauseBtn').classList.toggle('on', paused);
  $('pauseBtn').textContent = paused ? '▶' : '⏸';
  $('pauseBtn').setAttribute('aria-label', paused ? 'Reprendre' : 'Pause');
  $('pauseVeil').hidden = !paused || mode !== 'play';
}
function setFast(v) {
  fast = v;
  $('fastBtn').classList.toggle('on', fast);
}
function restart() {
  if (mode !== 'play' && mode !== 'result') return;
  startLevelQuick(levelIndex);
}
function startLevelQuick(i) {
  closeAll();
  loadLevel(i);
  mode = 'play';
  setPaused(false);
  setFast(false);
  autoSteps = null;
  sfx.go();
  if (LV.lecon) { startTuto(LV.lecon); return; }
  showBanner();
  say(LV.intro, 1, 5000);
}
$('pauseBtn').addEventListener('click', (e) => { e.currentTarget.blur(); if (mode === 'play') setPaused(!paused); });
$('fastBtn').addEventListener('click', (e) => { e.currentTarget.blur(); setFast(!fast); });
$('restartBtn').addEventListener('click', (e) => { e.currentTarget.blur(); restart(); });
$('hintBtn').addEventListener('click', (e) => { e.currentTarget.blur(); if (mode === 'play') hintDialog(); });
$('goalToggle').addEventListener('click', (e) => {
  e.currentTarget.blur();
  const p = $('goalPanel');
  p.classList.toggle('collapsed');
  e.currentTarget.setAttribute('aria-expanded', String(!p.classList.contains('collapsed')));
  fit();
});

/* ---------- Le son ---------- */
const soundBtn = $('soundBtn');
const renderSoundBtn = () => { soundBtn.textContent = isSoundOn() ? '🔊' : '🔇'; };
renderSoundBtn();
soundBtn.addEventListener('click', (e) => { e.currentTarget.blur(); toggleSound(); renderSoundBtn(); });

/* ---------- Les fenêtres ---------- */
const anyOverlay = () => !dialog.hidden || !levelsOverlay.hidden || !startOverlay.hidden || !introOverlay.hidden
  || !quitOverlay.hidden || !$('guide').hidden || !rotateOverlay.hidden;
function closeAll() {
  dialog.hidden = true;
  levelsOverlay.hidden = true;
  startOverlay.hidden = true;
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = fr(text);
  return n;
}
function openDialog(build) {
  dialogCard.innerHTML = '';
  dialogCard.className = 'dlg-card';
  build(dialogCard);
  dialog.hidden = false;
  sfx.open();
  const b = dialogCard.querySelector('button');
  if (b) b.focus({ preventScroll: true });
}
function zazaFace() {
  const f = el('div', 'dlg-face');
  f.innerHTML = ZAZA_SVG;
  return f;
}
function head(card, face, name, where) {
  const h = el('div', 'dlg-head');
  const txt = el('div');
  txt.append(el('p', 'dlg-name', name));
  if (where) txt.append(el('p', 'dlg-where', where));
  h.append(face, txt);
  card.append(h);
}
function actions(card, list) {
  const row = el('div', 'dlg-actions');
  for (const [label, cls, fn] of list) {
    const b = el('button', cls, label);
    b.addEventListener('click', (e) => { e.currentTarget.blur(); fn(); });
    row.append(b);
  }
  card.append(row);
}
function quartierDialog(q, next) {
  openDialog((card) => {
    head(card, zazaFace(), `${q.icone} ${q.nom}`, `Quartier ${QUARTIERS.indexOf(q) + 1} de Bouchonville`);
    card.append(el('p', 'dlg-say', q.histoire));
    actions(card, [['C’est parti ! 🚗', 'primary', () => {
      save.seenQuartiers[q.id] = true; writeSave();
      dialog.hidden = true;
      if (next) next();
    }]]);
  });
}
function signDialog(p, next) {
  openDialog((card) => {
    const face = el('div', 'dlg-face sign-face');
    const cv = document.createElement('canvas');
    cv.width = 140; cv.height = 140;
    drawToolIcon(cv, p.id);
    face.append(cv);
    head(card, face, `Nouveau panneau : ${p.nom === 'Cédez' ? 'Cédez-le-passage' : p.nom} !`, p.court);
    card.append(el('p', 'dlg-say', p.comment));
    const fact = el('p', 'dlg-fact');
    fact.append(el('b', null, '💡 Le savais-tu ?'), document.createTextNode(fr(p.fait)));
    card.append(fact);
    actions(card, [['J’ai compris ! 👍', 'primary', () => {
      save.seenSigns[p.id] = true; writeSave();
      dialog.hidden = true;
      if (next) next();
    }]]);
  });
}
function hintDialog() {
  openDialog((card) => {
    head(card, zazaFace(), 'Un conseil de Zaza', LV.nom);
    card.append(el('p', 'dlg-say', LV.astuce));
    const list = [['Merci Zaza ! 🦓', 'primary', () => { dialog.hidden = true; }]];
    /* Zaza montre un panneau de la solution, carrefour par carrefour */
    if (mode === 'play' && (LV.solution || []).length) list.push(['👀 Montre-moi', 'secondary', () => { dialog.hidden = true; showMe(); }]);
    list.push(['🔁 Recommencer', 'secondary', () => { dialog.hidden = true; restart(); }]);
    actions(card, list);
  });
}

/* ---------- La fin d'un niveau ---------- */
function finishLevel() {
  if (mode !== 'play') return;
  const won = W_.arrived >= W_.total;
  if (tuto) endTuto();
  selectTool(null, true);
  focusCar = null;
  if (won) {
    mode = 'fete';
    feteT = 0;
    sfx.win();
    launchConfetti();
  } else {
    mode = 'result';
    setTimeout(() => showResult(false), 400);
  }
  setPaused(false);
  $('pauseVeil').hidden = true;
}
function showResult(won) {
  if (mode === 'result' && won) return;
  mode = 'result';
  const calm = W_.calm();
  const stars = won ? starsFor(LV, calm) : 0;
  const before = bestOf(LV);
  const record = won && (!before || stars > before.stars || (stars === before.stars && calm > before.calm));
  if (record) save.best[LV.id] = { stars, calm };
  const next = levelIndex + 1 < LEVELS.length ? levelIndex + 1 : -1;
  if (won && next >= 0) save.last = next;
  writeSave();
  if (!won) sfx.fail();
  openDialog((card) => {
    card.classList.add('result');
    const box = el('div', 'result');
    const title = won ? (LV.lecon ? 'Leçon réussie ! 🎓' : `${STAR_TEXT[stars] || 'Gagné !'} 🎉`) : 'Embouteillage !';
    box.append(el('p', `result-title${won ? '' : ' fail'}`, title));
    const st = el('div', 'result-stars');
    for (let k = 0; k < 3; k++) st.append(el('span', null, '⭐'));
    box.append(st);
    const count = el('p', 'result-count');
    count.append(el('b', null, String(W_.arrived)), document.createTextNode(` voiture${W_.arrived > 1 ? 's' : ''} sur ${W_.total} à bon port`));
    box.append(count);
    const faces = el('div', 'result-faces');
    for (const car of W_.cars) {
      const arrived = car.mode === 'gare' || car.mode === 'fini';
      const f = el('i', arrived ? 'ok' : '', car.furieux ? '😡' : arrived ? '😊' : '😴');
      f.style.setProperty('--c', car.lieu ? car.lieu.couleur : '#ccc');
      f.title = car.lieu ? car.lieu.nom : '';
      faces.append(f);
    }
    box.append(faces);
    box.append(el('p', 'result-calm', `😊 ${calm} conducteur${calm > 1 ? 's' : ''} calme${calm > 1 ? 's' : ''} sur ${W_.total}${W_.frayeurs ? ` · 😱 ${W_.frayeurs} frayeur${W_.frayeurs > 1 ? 's' : ''}` : ''}`));
    let msg = won ? (LV.fin || pick(ZAZA.win)) : `${pick(ZAZA.fail)} Il faut que toutes les voitures arrivent.`;
    if (won && stars < 3) msg += W_.frayeurs ? ' Pour les trois étoiles : pas de frayeur ! Un STOP là où l’on ne voit rien.' : ' Pour les trois étoiles, pose tes panneaux plus vite (tu peux mettre sur pause ⏸ pour réfléchir).';
    box.append(el('p', 'dlg-say', msg));
    if (record && before) box.append(el('p', 'result-best', `Nouveau record ! (avant : ${'⭐'.repeat(before.stars)})`));
    else if (!record && before) box.append(el('p', 'result-best', `Ton record : ${'⭐'.repeat(before.stars)} (${before.calm} calmes)`));
    if (won && next < 0) {
      const soon = el('p', 'result-soon');
      soon.textContent = fr(`${BIENTOT[0].icone} ${BIENTOT[0].texte}`);
      box.append(soon);
    }
    card.append(box);
    const list = [];
    if (won && next >= 0) list.push([LV.lecon ? `▶ À toi : ${LEVELS[next].nom}` : '▶ Niveau suivant', 'primary', () => startLevel(next)]);
    if (!won) list.push(['💡 Conseil', 'secondary', () => hintDialog()]);
    list.push([won ? '🔁 Rejouer' : '🔁 Réessayer', won && next >= 0 ? 'secondary' : 'primary', () => startLevelQuick(levelIndex)]);
    list.push(['🗺️ Les quartiers', 'secondary', () => { dialog.hidden = true; openLevels(); }]);
    actions(card, list);
    const spans = st.querySelectorAll('span');
    for (let k = 0; k < stars; k++) setTimeout(() => { spans[k].classList.add('on'); sfx.star(k); }, 350 + k * 380);
  });
}

function launchConfetti() {
  const pieces = ['⭐', '✨', '🌟', '🎉', '🚗', '🚙', '🎈'];
  for (let i = 0; i < 34; i++) {
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

/* ---------- La carte des quartiers ---------- */
function openLevels() {
  if (mode === 'play') setPaused(true);
  renderLevels();
  levelsOverlay.hidden = false;
  sfx.open();
}
function closeLevels() {
  levelsOverlay.hidden = true;
  if (mode === 'play') setPaused(false);
  else if (mode === 'menu') openStart();
  else if (mode === 'result' && dialog.hidden) startLevelQuick(levelIndex);
}
function levelButton(lv, i, onClick) {
  const b = el('button', 'lvl-btn');
  b.type = 'button';
  const open = isOpen(i);
  b.disabled = !open;
  const st = bestStars(lv);
  b.append(el('span', null, open ? String(lv.li + 1) : '🔒'));
  if (open) b.append(el('span', 'st', '⭐'.repeat(st) + '☆'.repeat(3 - st)));
  b.title = open ? lv.nom : 'Gagne le niveau d’avant pour l’ouvrir';
  b.setAttribute('aria-label', `Niveau ${lv.li + 1} : ${lv.nom}`);
  if (open && !isWon(lv)) b.classList.add('next');
  b.addEventListener('click', onClick);
  return b;
}
function renderLevels() {
  const list = $('worldsList');
  list.innerHTML = '';
  const sub = $('levelsSub');
  sub.innerHTML = '';
  sub.append('⭐ ', el('b', null, String(totalStars())), ` étoiles sur ${LEVELS.length * 3} · choisis un niveau`);
  QUARTIERS.forEach((q, qi) => {
    const card = el('div', 'world-card');
    card.style.setProperty('--w1', q.couleurs[0]);
    card.style.setProperty('--w2', q.couleurs[1]);
    const h = el('h3');
    h.append(el('span', null, q.icone), ` ${qi + 1}. ${q.nom}`);
    card.append(h, el('p', null, q.histoire));
    const row = el('div', 'lvl-row');
    LEVELS.forEach((lv, i) => {
      if (lv.qi !== qi) return;
      const b = levelButton(lv, i, () => startLevel(i));
      if (W_ && i === levelIndex && mode === 'play') b.classList.add('current');
      row.append(b);
    });
    card.append(row);
    list.append(card);
  });
  for (const s of BIENTOT) {
    const soon = el('div', 'world-soon');
    soon.append(el('span', null, s.icone), el('b', null, s.nom), el('small', null, 'bientôt'));
    list.append(soon);
  }
}
$('mapBtn').addEventListener('click', (e) => { e.currentTarget.blur(); if (mode !== 'menu') openLevels(); });
$('levelsClose').addEventListener('click', () => closeLevels());

/* ---------- L'écran de départ : la carte de Bouchonville ---------- */
const MAP_POS = [[12, 62], [32, 30], [52, 66], [72, 30], [90, 64]];
const MAP_DECOR = [['🏠', 4, 22], ['🌳', 22, 86], ['🏢', 42, 12], ['⛲', 23, 40], ['🚌', 62, 88], ['🌳', 82, 10], ['🏫', 96, 30], ['🚲', 44, 46]];
let mapSel = 0;
const quartierLevels = (qi) => LEVELS.filter((l) => l.qi === qi);
const quartierDone = (qi) => quartierLevels(qi).every(isWon);
const hereQuartier = () => (LEVELS.every(isWon) ? -1 : LEVELS[firstUnfinished()].qi);
function quartierState(qi) {
  if (qi >= QUARTIERS.length) return 'soon';
  if (quartierDone(qi)) return 'done';
  if (DEBUG || qi === hereQuartier()) return 'open';
  return 'locked';
}
function renderWorldMap() {
  const map = $('worldMap');
  map.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('wm-svg');
  /* une route qui relie les quartiers */
  for (let i = 1; i < MAP_POS.length; i++) {
    const [x0, y0] = MAP_POS[i - 1];
    const [x1, y1] = MAP_POS[i];
    const mx = (x0 + x1) / 2;
    const d = `M${x0} ${y0} C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
    const road = document.createElementNS(NS, 'path');
    road.setAttribute('d', d);
    road.setAttribute('class', 'wm-road');
    svg.appendChild(road);
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('d', d);
    line.setAttribute('class', `wm-line${quartierDone(i - 1) ? ' taken' : ''}`);
    svg.appendChild(line);
  }
  map.appendChild(svg);
  for (const [icon, x, y] of MAP_DECOR) {
    const d = el('span', 'wm-decor', icon);
    d.style.left = `${x}%`;
    d.style.top = `${y}%`;
    map.appendChild(d);
  }
  const here = hereQuartier();
  const BADGE = { done: '✅', locked: '🔒', soon: '🚧' };
  const all = [...QUARTIERS, ...BIENTOT].slice(0, MAP_POS.length);
  all.forEach((q, qi) => {
    const st = quartierState(qi);
    const b = el('button', `wm-node is-${st}${qi === mapSel ? ' is-sel' : ''}${qi === here ? ' is-here' : ''}`);
    b.type = 'button';
    b.style.left = `${MAP_POS[qi][0]}%`;
    b.style.top = `${MAP_POS[qi][1]}%`;
    b.setAttribute('aria-pressed', String(qi === mapSel));
    b.setAttribute('aria-label', `${q.nom}${st === 'soon' ? ' (bientôt)' : ''}`);
    const dot = el('span', 'wm-dot', q.icone);
    if (BADGE[st]) dot.append(el('span', 'wm-badge', BADGE[st]));
    if (qi === here) dot.append(el('span', 'wm-pin', '📍'));
    b.append(dot, el('span', 'wm-name', q.nom));
    if (st !== 'soon' && st !== 'locked') {
      const stars = quartierLevels(qi).reduce((n, lv) => n + bestStars(lv), 0);
      b.append(el('span', 'wm-stars', `⭐ ${stars}/${quartierLevels(qi).length * 3}`));
    }
    b.addEventListener('click', () => {
      mapSel = qi;
      sfx.select();
      renderWorldMap();
      renderStartInfo();
    });
    map.appendChild(b);
  });
}
function suggestedLevel(qi) {
  const lvls = quartierLevels(qi);
  const todo = lvls.find((lv) => !isWon(lv)) || lvls.find((lv) => bestStars(lv) < 3) || lvls[0];
  return LEVELS.indexOf(todo);
}
function renderStartInfo() {
  const any = Object.keys(save.best).length > 0;
  const st = quartierState(mapSel);
  const startBtn = $('startBtn');
  const levels = $('startLevels');
  const done = $('startDone');
  levels.innerHTML = '';
  $('newGameBtn').hidden = !any;
  $('howTo').hidden = any;
  if (st === 'soon') {
    const s = BIENTOT[mapSel - QUARTIERS.length];
    $('startLevel').textContent = `${s.icone} ${s.nom}`;
    $('startGoal').textContent = fr(s.texte);
    done.hidden = false;
    done.textContent = fr('🚧 Ce quartier est encore en travaux : il arrive bientôt !');
    startBtn.hidden = true;
    return;
  }
  const q = QUARTIERS[mapSel];
  $('startLevel').textContent = `${q.icone} Quartier ${mapSel + 1} : ${q.nom}`;
  $('startGoal').textContent = fr(any || mapSel ? q.histoire
    : 'Une grande tempête a emporté tous les panneaux de Bouchonville. Depuis, aux carrefours, plus personne ne sait qui doit passer : ça klaxonne, ça s’énerve… Remets les bons panneaux aux bons endroits !');
  if (st === 'locked') {
    done.hidden = false;
    done.textContent = fr(`🔒 Pour ouvrir ce quartier, finis d’abord ${QUARTIERS[mapSel - 1].nom}.`);
    startBtn.hidden = true;
    return;
  }
  const stars = totalStars();
  done.hidden = !any;
  done.textContent = st === 'done'
    ? fr(`✅ Quartier fini ! Rejoue ses niveaux pour gagner toutes les étoiles. (En tout : ${stars} ⭐ sur ${LEVELS.length * 3})`)
    : fr(`Bon retour ! Tu as déjà ${stars} étoile${stars > 1 ? 's' : ''} ⭐ sur ${LEVELS.length * 3}.`);
  LEVELS.forEach((lv, i) => { if (lv.qi === mapSel) levels.append(levelButton(lv, i, () => launchLevel(i))); });
  const target = suggestedLevel(mapSel);
  const lv = LEVELS[target];
  startBtn.hidden = false;
  startBtn.dataset.level = String(target);
  if (!any) startBtn.textContent = '▶ Jouer !';
  else if (st === 'done') startBtn.textContent = `🔁 Rejouer : ${lv.qi + 1}-${lv.li + 1} ${lv.nom}`;
  else startBtn.textContent = `▶ Continuer : ${lv.qi + 1}-${lv.li + 1} ${lv.nom}`;
}
function launchLevel(i) {
  phoneFullscreen();
  startOverlay.hidden = true;
  if (!save.seenIntro) playIntro(() => startLevel(i));
  else startLevel(i);
}
function openStart() {
  mode = 'menu';
  const here = hereQuartier();
  mapSel = here >= 0 ? here : QUARTIERS.length - 1;
  renderWorldMap();
  renderStartInfo();
  startOverlay.hidden = false;
}
$('startBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  launchLevel(Number(e.currentTarget.dataset.level) || 0);
});
$('newGameBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  resetSave();
  startOverlay.hidden = true;
  startLevel(0);
});
$('introBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  startOverlay.hidden = true;
  playIntro(() => openStart());
});

/* ---------- Le film du début ---------- */
let story = null;
function playIntro(done) {
  introOverlay.hidden = false;
  const finish = () => {
    if (story) story.stop();
    story = null;
    introOverlay.hidden = true;
    save.seenIntro = true;
    writeSave();
    done();
  };
  $('introSkip').onclick = finish;
  story = playStory('intro', $('introCanvas'), { onEnd: finish, sfx });
}

/* ---------- Quitter ---------- */
function goHome() { window.location.href = '../../'; }
function openQuit() {
  if (mode === 'menu') { goHome(); return; }
  quitOverlay.hidden = false;
  $('quitNo').focus({ preventScroll: true });
}
$('quitBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openQuit(); });
$('quitYes').addEventListener('click', goHome);
$('quitNo').addEventListener('click', () => { quitOverlay.hidden = true; });

/* ---------- Mode téléphone et plein écran ---------- */
const phoneMQ = window.matchMedia('(pointer: coarse) and (max-width: 900px), (pointer: coarse) and (max-height: 520px)');
const landMQ = window.matchMedia('(orientation: landscape)');
function applyPhoneMode() {
  document.body.classList.toggle('phone', phoneMQ.matches);
  document.body.classList.toggle('full', !phoneMQ.matches);
  /* téléphone couché : la ville prend toute la hauteur, les panneaux passent à droite */
  document.body.classList.toggle('side-bar', phoneMQ.matches && landMQ.matches);
  if (phoneMQ.matches) $('goalPanel').classList.add('collapsed');
  requestAnimationFrame(fit);
}
applyPhoneMode();
phoneMQ.addEventListener('change', applyPhoneMode);
landMQ.addEventListener('change', applyPhoneMode);
window.addEventListener('resize', () => fit());

/* Téléphone tenu debout pendant une partie : la ville est trop large, on
   demande de le tourner (une tablette debout garde assez de place). */
function checkRotate() {
  const on = phoneMQ.matches && !landMQ.matches && window.innerWidth < 600 && mode !== 'menu'
    && startOverlay.hidden && introOverlay.hidden && $('guide').hidden;
  if (rotateOverlay.hidden === on) rotateOverlay.hidden = !on;
}
/* sur téléphone, le jeu passe en plein écran et se bloque en paysage
   (Android ; sur iPhone, l'écran « Tourne ton téléphone » prend le relais) */
function phoneFullscreen() {
  if (!phoneMQ.matches) return;
  const lock = () => {
    try {
      const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape');
      if (p && p.catch) p.catch(() => {});
    } catch (err) { /* pas possible ici */ }
  };
  if (isFullscreen()) { lock(); return; }
  const root = document.documentElement;
  const req = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(root, { navigationUI: 'hide' });
    if (p && p.then) p.then(lock, () => {});
    else lock();
  } catch (err) { /* refusé par le navigateur */ }
}
/* sorti du plein écran (geste retour…) : on y retourne au prochain toucher */
document.addEventListener('pointerup', () => {
  if (phoneMQ.matches && mode !== 'menu' && startOverlay.hidden && !isFullscreen()) phoneFullscreen();
});
$('zoomOutBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  sfx.select();
  camTo(null);
});
if (window.ResizeObserver) new ResizeObserver(() => fit()).observe(stage);

const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFullscreen() {
  try {
    if (isFullscreen()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      const p = exit && exit.call(document);
      if (p && p.catch) p.catch(() => {});
    } else {
      const root = document.documentElement;
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      const p = req && req.call(root, { navigationUI: 'hide' });
      if (p && p.catch) p.catch(() => {});
    }
  } catch (err) { /* refusé par le navigateur */ }
}
const fsBtn = $('fsBtn');
function renderFsBtn() {
  const on = isFullscreen();
  fsBtn.classList.toggle('on', on);
  fsBtn.title = on ? 'Quitter le plein écran' : 'Plein écran';
}
fsBtn.addEventListener('click', (e) => { e.currentTarget.blur(); toggleFullscreen(); });
document.addEventListener('fullscreenchange', renderFsBtn);
document.addEventListener('webkitfullscreenchange', renderFsBtn);
renderFsBtn();

function buzz(pattern) {
  if (!phoneMQ.matches || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (err) { /* ignoré */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'play') setPaused(true);
});
stage.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------- La leçon de Zaza (et le « Montre-moi » du bouton 💡) ----------
   Une leçon est une liste d'étapes (levels/centre.js, champ « lecon ») :
   la ville roule jusqu'au moment voulu (quand), puis le temps s'arrête, la
   caméra glisse jusqu'au carrefour, Zaza explique dans sa grande bulle et une
   main montre quoi toucher. Seul le rond montré répond : impossible de se
   tromper. Le temps reste arrêté tant que l'enfant n'a pas fait le geste. */
const HAND = { haut: '👆', bas: '👇', droite: '👉' };
let handEl = null;                 // le bouton que la main montre (il brille)

function startTuto(steps, mini = false) {
  stopTuto();
  tuto = { steps, i: -1, mini, phase: 'run', t0: 0, nope: 0 };
  document.body.classList.add('tuto-on');
  bubble.classList.remove('show');
  copilot.classList.remove('talking');
  zaza = { until: 0, prio: 0 };
  nextTutoStep();
}
/* on range la leçon sans toucher à la caméra (nouveau niveau) */
function stopTuto() {
  tuto = null;
  tutoEl.hidden = true;
  tutoHand.hidden = true;
  setHandTarget(null);
  document.body.classList.remove('tuto-on');
}
function endTuto() {
  stopTuto();
  camTo(null);
}
const tutoStep = () => (tuto ? tuto.steps[tuto.i] || null : null);
const tutoAttend = () => { const st = tutoStep(); return (st && tuto.phase === 'run' && st.attend) || null; };
/* pendant une explication ou un geste demandé, le temps est arrêté */
function tutoHolds() {
  if (!tuto || tuto.phase === 'quand') return false;
  const st = tutoStep();
  return !(st && st.attend && st.attend.duree && tuto.phase === 'run');
}
function nextTutoStep() {
  if (!tuto) return;
  tuto.i++;
  const st = tutoStep();
  if (!st) { endTuto(); return; }
  if (st.quand) {
    /* la ville roule : on la regarde de loin jusqu'au prochain embouteillage */
    tuto.phase = 'quand';
    tutoEl.hidden = true;
    setHandTarget(null);
    if (camFocus) camTo(null);
    return;
  }
  showTutoStep(st);
}
function showTutoStep(st) {
  tuto.phase = 'run';
  tuto.t0 = W_.time;
  if (st.fiche) {
    tutoEl.hidden = true;
    setHandTarget(null);
    const p = PANNEAU_BY_ID[st.fiche];
    const tk = tuto;
    signDialog(p, () => { if (tuto === tk) nextTutoStep(); });
    return;
  }
  $('tutoText').textContent = fr(st.dit || '');
  const next = $('tutoNext');
  next.hidden = st.attend !== 'suivant';
  next.textContent = fr(st.bouton || 'Suivant ▶');
  tutoEl.hidden = false;
  tutoEl.classList.remove('show');
  void tutoEl.offsetWidth;
  tutoEl.classList.add('show');
  sfx.zaza();
  if (st.camera === 'tout') camTo(null);
  else if (st.camera) { const n = nodeAt(st.camera[0], st.camera[1]); if (n) camTo({ x: n.x, y: n.y }); }
  if (st.attend === 'suivant') setTimeout(() => { if (!next.hidden) next.focus({ preventScroll: true }); }, 60);
  /* un geste déjà fait (le bon panneau est déjà choisi) : on passe */
  tutoCheck();
}
function tutoAdvance(ms) {
  const tk = tuto, i = tuto.i;
  tuto.phase = 'fait';
  setHandTarget(null);
  tutoHand.hidden = true;
  setTimeout(() => { if (tuto === tk && tuto.i === i) nextTutoStep(); }, ms);
}
/* l'enfant a-t-il fait ce que Zaza demande ? */
function tutoCheck() {
  const a = tutoAttend();
  if (!a || a === 'suivant') return;
  if (a.outil && tool === a.outil) tutoAdvance(350);
  else if (a.pose && a.pose.every((k) => W_.signs[k] === a.panneau)) {
    tutoAdvance(700);
    selectTool(null, true);
  } else if (a.enleve && !W_.signs[a.enleve]) tutoAdvance(500);
}
function tutoAllows(slot) {
  const a = tutoAttend();
  if (!a) return false;
  if (a.pose) return a.pose.includes(slot.key) && W_.signs[slot.key] !== a.panneau && tool === a.panneau;
  if (a.enleve) return a.enleve === slot.key && (!tool || tool === 'enlever');
  return false;
}
/* pas là ! la bulle remue et la main se remet à montrer */
function tutoNope() {
  sfx.refus();
  if (tutoEl.hidden) return;
  tutoEl.classList.remove('nope');
  void tutoEl.offsetWidth;
  tutoEl.classList.add('nope');
}
function updateTuto() {
  if (!tuto || !W_) return;
  const st = tutoStep();
  if (!st) return;
  if (tuto.phase === 'quand') {
    const q = st.quand;
    let go = false;
    if (q.dispute) { const n = nodeAt(q.dispute[0], q.dispute[1]); go = !!n && (jamSince[n.id] || 0) >= 1.0; }
    if (q.temps != null) go = go || W_.time >= q.temps;
    if (go) showTutoStep(st);
    return;
  }
  const a = tutoAttend();
  if (a && a.duree && W_.time - tuto.t0 >= a.duree) tutoAdvance(0);
}
/* les ronds que Zaza montre (ils restent allumés même sans panneau choisi) */
function tutoRonds() {
  const st = tutoStep();
  if (!st || tuto.phase === 'quand' || !st.montre) return [];
  return st.montre.filter((m) => m.rond).map((m) => m.rond);
}
function tutoShows(n) {
  const st = tutoStep();
  return !!(st && tuto.phase !== 'quand' && st.montre && st.montre.some((m) => m.noeud && m.noeud[0] === n.c && m.noeud[1] === n.r));
}
/* les routes colorées : « grande route », « petite route » */
function drawTutoZones(c, t) {
  const st = tutoStep();
  if (!st || tuto.phase === 'quand' || !st.montre) return;
  /* l'étiquette garde la même taille à l'écran, quel que soit le zoom */
  const s = Math.min(2.4, Math.max(0.5, 1.25 / view.z));
  for (const m of st.montre) {
    if (!m.zone) continue;
    const [c0, r0, c1, r1] = m.zone;
    const x = c0 * TILE + 3, y = r0 * TILE + 3, w = (c1 - c0 + 1) * TILE - 6, h = (r1 - r0 + 1) * TILE - 6;
    c.save();
    c.globalAlpha = 0.3 + Math.sin(t * 4) * 0.08;
    c.fillStyle = m.couleur || '#FFE14D';
    c.beginPath(); c.roundRect(x, y, w, h, 14); c.fill();
    c.globalAlpha = 0.95;
    c.strokeStyle = m.couleur || '#FFE14D';
    c.lineWidth = 4;
    c.setLineDash([10, 7]);
    c.lineDashOffset = -t * 20;
    c.stroke();
    c.restore();
    if (m.texte) {
      /* l'étiquette se pose sur le carreau « etiquette » (loin du carrefour), sinon au milieu */
      const [lx, ly] = m.etiquette ? [m.etiquette[0] * TILE + TILE / 2, m.etiquette[1] * TILE + TILE / 2] : [x + w / 2, y + h / 2];
      c.save();
      c.translate(lx, ly);
      c.scale(s, s);
      c.font = '800 15px "Baloo 2", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const tw = c.measureText(m.texte).width;
      c.fillStyle = m.couleur || '#FFE14D';
      c.strokeStyle = INK;
      c.lineWidth = 2;
      c.beginPath(); c.roundRect(-tw / 2 - 9, -12, tw + 18, 24, 12); c.fill(); c.stroke();
      c.fillStyle = INK;
      c.fillText(m.texte, 0, 1);
      c.restore();
    }
  }
}
/* les cercles qui clignotent autour du carrefour et du rond à toucher */
function drawTutoRings(c, t) {
  const st = tutoStep();
  if (!st || tuto.phase === 'quand' || !st.montre) return;
  for (const m of st.montre) {
    if (m.noeud) {
      const n = nodeAt(m.noeud[0], m.noeud[1]);
      if (!n) continue;
      c.save();
      c.strokeStyle = '#FFE14D';
      c.lineWidth = 4;
      c.setLineDash([9, 6]);
      c.lineDashOffset = -t * 24;
      c.beginPath(); c.arc(n.x, n.y, 50 + Math.sin(t * 5) * 3, 0, TAU); c.stroke();
      c.restore();
    }
    if (m.rond && tuto.phase === 'run') {
      const slot = W_.slots.find((x) => x.key === m.rond);
      const a = tutoAttend();
      if (!slot || (a && a.pose && W_.signs[slot.key] === a.panneau)) continue;
      const k = (t * 1.6) % 1;
      c.save();
      c.strokeStyle = '#FFFFFF';
      c.globalAlpha = 1 - k;
      c.lineWidth = 3;
      c.beginPath(); c.arc(slot.x, slot.y - 4, 12 + k * 22, 0, TAU); c.stroke();
      c.restore();
    }
  }
}
/* la main : elle montre le bouton à toucher, ou le rond de la ville */
function setHandTarget(el) {
  if (handEl === el) return;
  if (handEl) handEl.classList.remove('tuto-glow');
  handEl = el;
  if (el) el.classList.add('tuto-glow');
}
function handTarget() {
  const st = tutoStep();
  if (!st || tuto.phase !== 'run' || !st.montre || anyOverlay()) return null;
  const a = tutoAttend();
  const want = a && (a.outil || a.panneau || (a.enleve && 'enlever'));
  /* d'abord le bon panneau, en bas… */
  const outil = st.montre.find((m) => m.outil);
  if (outil && tool !== (want || outil.outil)) return { el: toolsEl.querySelector(`[data-tool="${want || outil.outil}"]`) };
  /* … puis le rond où le poser */
  for (const m of st.montre) {
    if (!m.rond) continue;
    if (a && a.pose && W_.signs[m.rond] === a.panneau) continue;
    if (a && a.enleve && !W_.signs[m.rond]) continue;
    const slot = W_.slots.find((x) => x.key === m.rond);
    if (slot) return { world: [slot.x, slot.y - 4] };
  }
  const b = st.montre.find((m) => m.bouton);
  if (b) return { el: $(b.bouton) };
  return null;
}
function placeHand() {
  const tg = tuto ? handTarget() : null;
  setHandTarget(tg && tg.el ? tg.el : null);
  if (!tg) { tutoHand.hidden = true; return; }
  let x, y, dir;
  if (tg.el) {
    const r = tg.el.getBoundingClientRect();
    if (!r.width) { tutoHand.hidden = true; return; }
    if (r.left > window.innerWidth * 0.8 && r.top > 60) { dir = 'droite'; x = r.left - 4; y = r.top + r.height / 2; }
    else if (r.top > window.innerHeight * 0.55) { dir = 'bas'; x = r.left + r.width / 2; y = r.top - 2; }
    else { dir = 'haut'; x = r.left + r.width / 2; y = r.bottom + 2; }
  } else {
    const sr = stage.getBoundingClientRect();
    const [sx, sy] = toScreen(tg.world[0], tg.world[1]);
    x = sr.left + sx;
    y = sr.top + sy;
    if (sy > (view.H - view.bottom) * 0.72) { dir = 'bas'; y -= 12; } else { dir = 'haut'; y += 12; }
  }
  tutoHand.hidden = false;
  tutoHand.dataset.dir = dir;
  tutoHand.firstElementChild.textContent = HAND[dir];
  tutoHand.style.left = `${Math.round(x)}px`;
  tutoHand.style.top = `${Math.round(y)}px`;
}
$('tutoNext').addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (tutoAttend() === 'suivant') { sfx.select(); tutoAdvance(0); }
});

/* « Montre-moi » : Zaza montre un panneau de la solution qui manque encore
   (de préférence dans un carrefour bloqué), ou un panneau à enlever. */
const signName = (type) => (type === 'stop' ? 'un STOP' : 'un Cédez-le-passage');
function showMe() {
  const keyOf = (s) => `${s.noeud[0]},${s.noeud[1]},${s.cote}`;
  const sol = LV.solution || [];
  const want = new Map(sol.map((s) => [keyOf(s), s.panneau]));
  const missing = sol.filter((s) => W_.signs[keyOf(s)] !== s.panneau);
  missing.sort((p, q) => {
    const jp = jamSince[nodeAt(p.noeud[0], p.noeud[1]).id] || 0, jq = jamSince[nodeAt(q.noeud[0], q.noeud[1]).id] || 0;
    return jq - jp;
  });
  const wrong = Object.keys(W_.signs).filter((k) => want.get(k) !== W_.signs[k] && !missing.some((s) => keyOf(s) === k));
  const slotOf = (k) => W_.slots.find((s) => s.key === k);
  let step = null;
  const m = missing[0];
  if (m) {
    const k = keyOf(m);
    const n = nodeAt(m.noeud[0], m.noeud[1]);
    const freeStock = (W_.stock[m.panneau] || 0) > 0;
    if (freeStock) {
      step = {
        camera: m.noeud,
        dit: `Essaie ${signName(m.panneau)} ici${n.aveugle && m.panneau === 'stop' ? ' : les haies cachent la vue !' : ' !'}`,
        montre: [{ outil: m.panneau }, { rond: k }],
        attend: { pose: [k], panneau: m.panneau },
      };
    } else {
      /* plus de ce panneau en stock : il y en a un de trop ailleurs */
      const extra = Object.keys(W_.signs).find((x) => W_.signs[x] === m.panneau && want.get(x) !== m.panneau);
      if (extra) {
        const sl = slotOf(extra);
        step = { camera: [sl.node.c, sl.node.r], dit: 'Ce panneau-là n’est pas au bon endroit : enlève-le, tu pourras le poser ailleurs !', montre: [{ outil: 'enlever' }, { rond: extra }], attend: { enleve: extra } };
      }
    }
  } else if (wrong.length) {
    const sl = slotOf(wrong[0]);
    step = { camera: [sl.node.c, sl.node.r], dit: 'Ce panneau-là ne sert à rien : enlève-le !', montre: [{ outil: 'enlever' }, { rond: wrong[0] }], attend: { enleve: wrong[0] } };
  }
  if (!step) { say('Tous tes panneaux sont bien placés : laisse rouler les voitures !', 2, 4500); return; }
  startTuto([step], true);
}

/* ---------- Le pilote automatique (?debug) ---------- */
function applyAuto() {
  for (const s of autoSteps) {
    if (s.done || (s.t || 0) > W_.time) continue;
    s.done = true;
    const key = `${s.noeud[0]},${s.noeud[1]},${s.cote}`;
    if (W_.place(key, s.panneau)) { posePop[key] = 1; renderToolCounts(); }
  }
}
if (DEBUG) {
  window.__emb = {
    get world() { return W_; },
    get view() { return view; },
    get tuto() { return tuto && { i: tuto.i, phase: tuto.phase, n: tuto.steps.length, t: W_.time }; },
    montre: () => showMe(),
    /* où toucher maintenant (pour les tests) : le bouton de la fenêtre, de la bulle, ou ce que montre la main */
    cible: () => {
      const mid = (r) => [r.x + r.width / 2, r.y + r.height / 2];
      if (!dialog.hidden) return mid(dialogCard.querySelector('button').getBoundingClientRect());
      if (!$('tutoNext').hidden && !tutoEl.hidden) return mid($('tutoNext').getBoundingClientRect());
      const tg = tuto && handTarget();
      if (!tg) return [-5, -5];
      if (tg.el) return mid(tg.el.getBoundingClientRect());
      const sr = stage.getBoundingClientRect();
      const p = toScreen(tg.world[0], tg.world[1]);
      return [sr.left + p[0], sr.top + p[1]];
    },
    niveau: (i) => startLevel(i),
    auto: () => { autoSteps = (LV.solution || []).map((s) => ({ ...s })); },
    verifie: () => LEVELS.map((lv) => {
      const r = playSolution(lv);
      const none = playSolution(lv, []);
      return { id: lv.id, arrivees: `${r.arrived}/${r.total}`, calmes: r.calm, frayeurs: r.frayeurs, ok: r.arrived === r.total && r.calm >= lv.etoiles[2], sansRien: `${none.arrived}/${none.total}` };
    }),
    pas: (n = 1) => { for (let i = 0; i < n && mode === 'play'; i++) stepWorld(); },
    finir: () => finishLevel(),
    pause: (v = true) => setPaused(v),
    outil: (id) => selectTool(id),
    tape: (key) => { const s = W_.slots.find((x) => x.key === key); if (s) tapSlot(s); },
    ecran: (wx, wy) => toScreen(wx, wy),
    zoom: (u) => setZoom(u),
    bench: (n = 60) => { const t0 = performance.now(); for (let i = 0; i < n; i++) render(t0 + i * 16, 0.016); return (performance.now() - t0) / n; },
  };
}

/* ---------- C'est parti ---------- */
const askLevel = Number(params.get('niveau'));
if (DEBUG && askLevel >= 1) {
  save.seenIntro = true;
  QUARTIERS.forEach((q) => { save.seenQuartiers[q.id] = true; });
  PANNEAUX.forEach((p) => { save.seenSigns[p.id] = true; });
  startLevel(askLevel - 1);
} else {
  loadLevel(Math.min(save.last || 0, LEVELS.length - 1));
  openStart();
}
void LIEUX;
requestAnimationFrame(frame);
