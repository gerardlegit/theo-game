// ============================================================================
// LA MARCHE DES POMPONS — le jeu
// Les Pompons tombent d'un nuage et marchent tout droit. L'enfant choisit un
// métier en bas de l'écran (Stop, Pont, Creuseur, Tunnel, Grimpeur,
// Parapluie) puis touche un Pompon pour le lui donner, afin d'en ramener assez
// à la maison-champignon. 20 niveaux en 4 mondes (levels/), Plume la chouette
// guide et donne des indices, 3 étoiles par niveau, sauvegarde automatique.
//
// Ce fichier : le déroulé (écran de départ, carte des niveaux, fenêtres),
// la caméra, le toucher et la souris, la boucle de dessin, les étincelles et
// les bruits. La simulation elle-même est dans monde.js, le terrain dans
// terrain.js, les dessins dans art.js.
// Avec ?debug : tous les niveaux sont ouverts, ?debug&niveau=N ouvre le
// niveau N, et window.__pom donne verifie(), auto(), niveau(i)…
// ============================================================================

import { createWorld, playSolution, TICK_RATE } from './monde.js';
import { TILE, TS, createTerrainPainter } from './terrain.js';
import {
  drawPompon, drawEntrance, drawHome, drawWater, drawThorns, buildDecor, drawDecor, drawBigDecor,
  drawBackground, drawSkillIcon, PLUME_SVG, POMPON_COLORS, drawLava, drawLavaGlow, drawLadder,
  drawClown, drawCandy, drawSlide,
} from './art.js';
import { SKILLS, SKILL_BY_ID, PLUME, STAR_TEXT } from './data.js';
import { WORLDS, LEVELS, BIENTOT } from './levels/index.js';
import { playStory } from './intro.js';
import { sfx, isSoundOn, toggleSound } from './sound.js';

const SAVE_KEY = 'marche-des-pompons-v1';
const SAVE_VERSION = 1;
const STEP_S = 1 / TICK_RATE;
const DIFF_LABEL = { difficile: '🔥 Difficile', 'tres-difficile': '🔥🔥 Très difficile' };
const FAST = 3;                    // vitesse du bouton ⏩
const MIN_VIEW_W = 300;            // on voit toujours au moins 300 pixels du monde en largeur
const MAX_ZOOM = 2.6;
const PAN_SPEED = 520;             // pixels d'écran par seconde avec les flèches

const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
/* typographie française : « ! ? : ; » restent collés au mot d'avant (espace insécable) */
const fr = (text) => String(text).replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

/* ---------- Les éléments de la page ---------- */
const stage = $('stage');
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const minimap = $('minimap');
const mctx = minimap.getContext('2d');
const bubble = $('bubble');
const copilot = $('copilot');
const skillsEl = $('skills');
const dialog = $('dialog');
const dialogCard = $('dialogCard');
const startOverlay = $('startOverlay');
const levelsOverlay = $('levelsOverlay');
const introOverlay = $('introOverlay');
const endOverlay = $('endOverlay');
const quitOverlay = $('quitOverlay');
const confettiLayer = $('confettiLayer');
$('plumeSlot').innerHTML = PLUME_SVG;

/* ---------- La sauvegarde ---------- */
let save = { v: SAVE_VERSION, best: {}, seenIntro: false, seenSkills: {}, seenWorlds: {}, last: 0, ending: false };
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
  save = { v: SAVE_VERSION, best: {}, seenIntro: save.seenIntro, seenSkills: {}, seenWorlds: {}, last: 0, ending: false };
  writeSave();
}
loadSave();

const starsFor = (lv, saved) => lv.etoiles.filter((n) => saved >= n).length;
const bestOf = (lv) => save.best[lv.id] || 0;
const isWon = (lv) => bestOf(lv) >= lv.besoin;
const isOpen = (i) => DEBUG || i === 0 || isWon(LEVELS[i - 1]);
const totalStars = () => LEVELS.reduce((n, lv) => n + starsFor(lv, bestOf(lv)), 0);
const firstUnfinished = () => {
  const i = LEVELS.findIndex((lv) => !isWon(lv));
  return i < 0 ? LEVELS.length - 1 : i;
};

/* ---------- L'état du jeu ---------- */
let mode = 'menu';                 // 'menu' (écran de départ), 'play', 'result'
let levelIndex = 0;
let LV = null;                     // le niveau en cours (levels/)
let W_ = null;                     // la simulation (monde.js)
let theme = WORLDS[0].theme;
let painter = null;
let decor = { list: [], big: [] };
let selected = null;               // le métier choisi
let paused = false;
let fast = false;
let acc = 0;
let hover = null;
let homeGlow = 0;
let hatch = 0;
let particles = [];
let floaters = [];
let shake = 0;
let flags = {};                    // ce que Plume a déjà dit dans ce niveau
let autoSteps = null;              // pilote automatique (?debug)
let thumbDirty = true;
let lastThumb = 0;
const thumb = document.createElement('canvas');

/* la caméra : zoom z, décalage de l'écran, position dans le monde */
const view = { W: 800, H: 600, dpr: 1, z: 2, offX: 0, offY: 0, camX: 0, minX: 0, maxX: 0 };

/* ---------- Plume ---------- */
let plume = { until: 0, prio: 0 };
let lastTalk = 0;
function say(text, prio = 1, dur = 4200) {
  const now = performance.now();
  if (now < plume.until && prio < plume.prio) return;
  bubble.textContent = fr(text);
  bubble.classList.remove('show');
  void bubble.offsetWidth;
  bubble.classList.add('show');
  copilot.classList.add('talking');
  plume = { until: now + dur, prio };
  lastTalk = now;
  sfx.hoot();
}
function sayOnce(key, text, prio = 1, dur) {
  if (flags[key]) return;
  flags[key] = true;
  say(typeof text === 'string' ? text : pick(text), prio, dur);
}
function updatePlume(now) {
  if (plume.until && now > plume.until) {
    bubble.classList.remove('show');
    copilot.classList.remove('talking');
    plume = { until: 0, prio: 0 };
  }
  /* un petit conseil ou une blague quand tout est calme */
  if (mode === 'play' && !paused && !anyOverlay() && now - lastTalk > 32000) {
    say(Math.random() < 0.6 ? pick(PLUME.idle) : pick(PLUME.jokes), 0, 5000);
  }
}

/* ---------- La taille de l'écran et la caméra ---------- */
function barHeight() {
  const bar = $('skillBar');
  return bar ? bar.offsetHeight + 16 : 90;
}
function fit() {
  const r = stage.getBoundingClientRect();
  view.W = Math.max(200, r.width);
  view.H = Math.max(200, r.height);
  view.dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(view.W * view.dpr);
  canvas.height = Math.round(view.H * view.dpr);
  if (!W_) return;
  const T = W_.T;
  const phone = document.body.classList.contains('phone');
  const top = phone ? 46 : 58;
  const bottom = barHeight();
  const availH = Math.max(120, view.H - top - bottom);
  /* on remplit la hauteur (sans trop grossir) ; si en dézoomant un peu on voit
     tout le niveau d'un coup, on le fait */
  view.z = Math.min(availH / T.H, view.W / MIN_VIEW_W, MAX_ZOOM);
  if (T.W * view.z > view.W && view.W / T.W >= view.z * 0.75) view.z = view.W / T.W;
  view.z = Math.max(0.6, view.z);
  view.offY = top + (availH - T.H * view.z) / 2;
  const worldW = view.W / view.z;
  if (worldW >= T.W) {
    view.offX = (view.W - T.W * view.z) / 2;
    view.minX = view.maxX = 0;
  } else {
    view.offX = 0;
    view.minX = 0;
    view.maxX = T.W - worldW;
  }
  setCam(view.camX);
}
function setCam(x) {
  view.camX = Math.max(view.minX, Math.min(view.maxX, x));
}
function centerOn(wx) { setCam(wx - view.W / view.z / 2); }
const toWorld = (sx, sy) => [(sx - view.offX) / view.z + view.camX, (sy - view.offY) / view.z];
const toScreen = (wx, wy) => [(wx - view.camX) * view.z + view.offX, wy * view.z + view.offY];

/* ---------- Commencer un niveau ---------- */
function loadLevel(i) {
  levelIndex = Math.max(0, Math.min(LEVELS.length - 1, i));
  LV = LEVELS[levelIndex];
  theme = LV.world.theme;
  W_ = createWorld(LV);
  painter = createTerrainPainter(W_.T, theme, levelIndex * 17 + 3);
  const avoid = [W_.T.sortie ? W_.T.sortie.x : -999, W_.T.entree ? W_.T.entree.x : -999];
  decor = buildDecor(W_.T, W_.solid, theme, levelIndex * 31 + 7, avoid);
  particles = [];
  floaters = [];
  hover = null;
  homeGlow = 0;
  hatch = 0;
  acc = 0;
  flags = {};
  thumbDirty = true;
  bubble.classList.remove('show');
  copilot.classList.remove('talking');
  plume = { until: 0, prio: 0 };
  fit();
  centerOn(W_.T.entree ? W_.T.entree.x + 60 : 0);
  buildSkillBar();
  renderGoal();
  renderHud(true);
  $('finishBtn').hidden = true;
  const sk = SKILLS.find((s) => LV.metiers[s.id] > 0);
  selectSkill(sk ? sk.id : null, true);
}

function startLevel(i) {
  closeAll();
  loadLevel(i);
  save.last = levelIndex;
  writeSave();
  mode = 'play';
  setPaused(false);
  setFast(false);
  autoSteps = null;
  showBanner();
  /* un nouveau monde, puis les nouveaux métiers, avant de jouer */
  const queue = [];
  if (!save.seenWorlds[LV.world.id]) queue.push((next) => worldDialog(LV.world, next));
  SKILLS.forEach((s) => {
    if (LV.metiers[s.id] > 0 && !save.seenSkills[s.id]) queue.push((next) => skillDialog(s, next));
  });
  runQueue(queue, () => {
    if (levelIndex === 0 && !bestOf(LV)) {
      say(PLUME.hello, 2, 6500);
      setTimeout(() => { if (mode === 'play' && LV === LEVELS[0]) say(LV.intro, 2, 6000); }, 6800);
    } else say(LV.intro, 2, 6000);
  });
}

function runQueue(queue, done) {
  const next = () => {
    const f = queue.shift();
    if (f) f(next); else if (done) done();
  };
  next();
}

function showBanner() {
  const el = $('levelBanner');
  el.innerHTML = '';
  const sm = document.createElement('small');
  sm.textContent = `${LV.world.icone} ${LV.world.nom} · niveau ${LV.li + 1}${LV.difficulte ? ` · ${DIFF_LABEL[LV.difficulte]}` : ''}`;
  const b = document.createElement('b');
  b.textContent = LV.nom;
  el.append(sm, b);
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  clearTimeout(showBanner.t);
  showBanner.t = setTimeout(() => { el.hidden = true; }, 2500);
}

/* ---------- La barre des métiers ---------- */
function buildSkillBar() {
  skillsEl.innerHTML = '';
  SKILLS.forEach((s) => {
    if (!(s.id in LV.metiers)) return;
    const b = document.createElement('button');
    b.className = 'skill-btn';
    b.dataset.skill = s.id;
    b.title = `${s.nom} : ${s.court}`;
    b.setAttribute('aria-label', `${s.nom} : ${s.court}`);
    const cv = document.createElement('canvas');
    cv.width = 96; cv.height = 96;
    drawSkillIcon(cv, s.id);
    const name = document.createElement('span');
    name.className = 'sk-name';
    name.textContent = s.nom;
    const count = document.createElement('span');
    count.className = 'sk-count';
    const kbd = document.createElement('kbd');
    kbd.className = 'desktop-only';
    kbd.textContent = String(SKILLS.indexOf(s) + 1);
    b.append(cv, name, count, kbd);
    b.addEventListener('click', (e) => {
      e.currentTarget.blur();
      selectSkill(s.id);
    });
    skillsEl.appendChild(b);
  });
  renderSkillCounts();
}
function renderSkillCounts() {
  skillsEl.querySelectorAll('.skill-btn').forEach((b) => {
    const n = W_.skills[b.dataset.skill] || 0;
    b.querySelector('.sk-count').textContent = String(n);
    b.classList.toggle('empty', n <= 0);
    b.classList.toggle('on', b.dataset.skill === selected);
  });
}
function selectSkill(id, silent = false) {
  if (!id || !(id in LV.metiers)) return;
  selected = id;
  renderSkillCounts();
  if (!silent) {
    sfx.select();
    if ((W_.skills[id] || 0) <= 0) say(PLUME.empty(SKILL_BY_ID[id].nom), 1, 2600);
    else if (!flags.chose) { flags.chose = true; say(pick(PLUME.choose), 1, 3000); }
  }
}

/* ---------- Le panneau « Objectif » et le HUD ---------- */
function renderGoal() {
  const body = $('goalBody');
  body.innerHTML = '';
  const name = document.createElement('p');
  name.className = 'goal-name';
  name.textContent = LV.nom;
  const sm = document.createElement('small');
  sm.textContent = `${LV.world.nom} · niveau ${LV.li + 1} / ${LV.world.niveaux.length}${LV.difficulte ? ` · ${DIFF_LABEL[LV.difficulte]}` : ''}`;
  name.appendChild(sm);
  const line = document.createElement('p');
  line.className = 'goal-line';
  line.innerHTML = '';
  line.append('Ramène ');
  const b = document.createElement('b');
  b.textContent = `${LV.besoin} Pompons`;
  line.append(b, ` sur ${LV.pompons} à la maison 🏡`);
  const bar = document.createElement('div');
  bar.className = 'goal-bar';
  bar.innerHTML = '<i></i>';
  LV.etoiles.forEach((n, k) => {
    const m = document.createElement('span');
    m.className = 'mark';
    m.style.left = `${(n / LV.pompons) * 100}%`;
    m.textContent = '⭐';
    m.title = `${k + 1} étoile${k ? 's' : ''} : ${n} Pompons`;
    bar.appendChild(m);
  });
  const best = document.createElement('p');
  best.className = 'goal-best';
  const bs = bestOf(LV);
  best.textContent = bs ? `Ton record : ${bs} Pompons ${'⭐'.repeat(starsFor(LV, bs))}` : 'Pas encore de record';
  body.append(name, line, bar, best);
}
let hudCache = {};
function renderHud(force = false) {
  if (!W_) return;
  const out = W_.pompons.filter((p) => p.state !== 'parti' && p.state !== 'sauve' && p.state !== 'perdu').length;
  const secs = Math.ceil(W_.timeLeft / TICK_RATE);
  const vals = { saved: W_.saved, out, secs, need: LV.besoin };
  if (!force && Object.keys(vals).every((k) => hudCache[k] === vals[k])) return;
  if (vals.saved !== hudCache.saved && !force) {
    const it = $('savedItem');
    it.classList.remove('bump'); void it.offsetWidth; it.classList.add('bump');
  }
  hudCache = vals;
  $('savedCount').textContent = String(W_.saved);
  $('needCount').textContent = String(LV.besoin);
  $('outCount').textContent = String(out);
  $('timeLeft').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  $('timeItem').classList.toggle('low', secs <= 20 && mode === 'play');
  $('savedItem').classList.toggle('won', W_.saved >= LV.besoin);
  $('levelName').textContent = `${LV.wi + 1}-${LV.li + 1} ${LV.nom}`;
  const bar = document.querySelector('.goal-bar > i');
  if (bar) bar.style.width = `${Math.min(100, (W_.saved / LV.pompons) * 100)}%`;
  document.querySelectorAll('.goal-bar .mark').forEach((m, k) => m.classList.toggle('got', W_.saved >= LV.etoiles[k]));
}

/* ---------- La simulation qui avance ---------- */
function stepWorld() {
  if (autoSteps) applyAuto();
  W_.step();
  for (const e of W_.events) handleEvent(e);
  W_.events.length = 0;
  if (W_.dirty.length) {
    for (const [x0, y0, x1, y1] of W_.dirty) painter.paint(x0, y0, x1 + 1, y1 + 1);
    W_.dirty.length = 0;
    thumbDirty = true;
  }
  if (W_.onlyStops && !flags.onlyStops) {
    flags.onlyStops = true;
    $('finishBtn').hidden = false;
    say(PLUME.onlyStops, 2, 6000);
  }
  if (!W_.onlyStops && !$('finishBtn').hidden && !flags.keepFinish) $('finishBtn').hidden = true;
  if (W_.timeLeft === 20 * TICK_RATE) say(PLUME.timeLow, 2);
  if (W_.over) finishLevel();
}

function handleEvent(e) {
  const p = e.p;
  switch (e.type) {
    case 'release':
      hatch = 1;
      sfx.release();
      break;
    case 'saved':
      homeGlow = 1;
      sfx.saved();
      for (let i = 0; i < 10; i++) burst(e.x, e.y - 10, i % 2 ? '#FFD45E' : POMPON_COLORS[p.id % POMPON_COLORS.length], 'star');
      floatText('+1', e.x, e.y - 30, '#9BE58A');
      if (W_.saved === LV.besoin) say(W_.saved < LV.pompons ? PLUME.needReached : pick(PLUME.saved), 2);
      else if (W_.saved === 1) say(pick(PLUME.saved), 1, 2500);
      buzz(15);
      break;
    case 'lost':
      sfx.lost(e.why);
      if (e.why === 'eau') for (let i = 0; i < 14; i++) burst(e.x, e.y - 2, '#BFE8FF', 'drop');
      if (e.why === 'ronces') for (let i = 0; i < 8; i++) burst(e.x, e.y - 6, '#C9E07A', 'dot');
      if (e.why === 'chute') { shake = 0.25; for (let i = 0; i < 8; i++) burst(e.x, e.y - 3, '#FFFFFF', 'star'); }
      if (e.why === 'lave') { shake = 0.3; for (let i = 0; i < 16; i++) burst(e.x, e.y - 3, i % 3 ? '#FF8A20' : '#FFE680', 'spark'); }
      say(pick(PLUME.lost[e.why] || PLUME.lost.vide), 1, 3600);
      buzz([30, 40, 30]);
      break;
    case 'land':
      if (!e.soft) sfx.land();
      for (let i = 0; i < 4; i++) burst(e.x, e.y, 'rgba(255,255,255,0.8)', 'dust');
      break;
    case 'umbrella': sfx.umbrella(); break;
    case 'brick':
      sfx.brick();
      burst(e.x + p.dir * 6, e.y, '#EDA65A', 'dust');
      if (e.left === 2 && !flags.brickWarn) { flags.brickWarn = true; floatText('Plus que 2 briques !', e.x, e.y - 26, '#FFD45E'); }
      break;
    case 'bricksDone':
      sayOnce('bricksDone', PLUME.bricksDone, 1);
      floatText('Plus de briques !', e.x, e.y - 26, '#FFD45E');
      break;
    case 'bonk':
      sfx.bonk();
      sayOnce('bonk', PLUME.bonk, 1);
      break;
    case 'dig':
      sfx.dig();
      for (let i = 0; i < 3; i++) burst(e.x, e.y, theme.terre, 'chunk');
      break;
    case 'bash':
      sfx.bash();
      for (let i = 0; i < 3; i++) burst(e.x + p.dir * 8, e.y - 6, theme.terre, 'chunk');
      break;
    case 'rock':
      sfx.rock();
      for (let i = 0; i < 6; i++) burst(e.x + p.dir * 6, e.y - 6, '#FFF3A0', 'spark');
      sayOnce('rock', PLUME.rock, 1);
      break;
    case 'climb': sfx.climb(); break;
    case 'climbTop': sfx.climb(); break;
    case 'ladder':
      sfx.ladder();
      e.L.drawUp = e.L.up === p.dir;
      for (let i = 0; i < 6; i++) burst(e.L.x, e.L.drawUp ? e.L.top : e.L.bottom, '#FFFFFF', 'dust');
      sayOnce('ladder', PLUME.ladder, 1);
      break;
    case 'ladderOn': sfx.climb(); break;
    case 'slide':
      sfx.slide();
      for (let i = 0; i < 6; i++) burst(e.S.x0, e.S.top, '#FFFFFF', 'dust');
      sayOnce('slide', PLUME.slide, 1);
      break;
    case 'slideOn': sfx.whee(); break;
    case 'throw': sfx.throw(); break;
    case 'clownDown':
      sfx.pouf();
      shake = Math.max(shake, 0.15);
      for (let i = 0; i < 30; i++) burst(e.x, e.y - 16, POMPON_COLORS[i % POMPON_COLORS.length], i % 3 ? 'spark' : 'star');
      floatText('Pouf !', e.x, e.y - 40, '#FFD45E');
      say(pick(PLUME.clownDown), 2, 2600);
      buzz(20);
      break;
    case 'candyLand':
      for (let i = 0; i < 5; i++) burst(e.x, e.y - 1, POMPON_COLORS[i % POMPON_COLORS.length], 'spark');
      if (W_.clowns.some((cl) => cl.state !== 'pouf' && cl.state !== 'parti')) sayOnce('candyMiss', PLUME.candyMiss, 1);
      break;
    case 'chomp':
      sfx.chomp();
      for (let i = 0; i < 6; i++) burst(e.x, e.y - 24, '#FFF3C9', 'dust');
      break;
    case 'assign':
      sfx.assign();
      for (let i = 0; i < 8; i++) burst(e.x, e.y - 7, '#FFFFFF', 'spark');
      renderSkillCounts();
      pulseSkill(e.skill);
      break;
    case 'free':
      sfx.free();
      floatText('C’est reparti !', e.x, e.y - 22, '#FFFFFF');
      break;
    default: break;
  }
}

function pulseSkill(id) {
  const b = skillsEl.querySelector(`[data-skill="${id}"]`);
  if (!b) return;
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
}

/* ---------- Étincelles, poussière, gouttes… (en coordonnées du monde) ---------- */
function burst(x, y, col, kind) {
  const a = Math.random() * Math.PI * 2;
  const sp = kind === 'spark' ? 40 + Math.random() * 60 : kind === 'drop' ? 30 + Math.random() * 50 : 15 + Math.random() * 35;
  particles.push({
    x, y, col, kind,
    vx: Math.cos(a) * sp,
    vy: kind === 'drop' ? -40 - Math.random() * 50 : Math.sin(a) * sp - (kind === 'star' ? 30 : 10),
    life: 0,
    max: kind === 'star' ? 0.9 : kind === 'dust' ? 0.45 : 0.7,
    size: kind === 'chunk' ? 1.2 + Math.random() * 1.2 : kind === 'star' ? 2.2 : 1.2,
  });
  if (particles.length > 400) particles.splice(0, particles.length - 400);
}
function floatText(text, x, y, col) {
  floaters.push({ text, x, y, col, life: 0, max: 1.4 });
}
function updateParticles(dt) {
  for (const q of particles) {
    q.life += dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.kind === 'chunk' || q.kind === 'drop' || q.kind === 'spark') q.vy += 220 * dt;
    else if (q.kind === 'ember') { q.vy -= 10 * dt; q.vx += Math.sin(q.life * 6 + q.x) * 20 * dt; }
    else q.vy *= 0.92;
    q.vx *= 0.96;
  }
  particles = particles.filter((q) => q.life < q.max);
  for (const f of floaters) { f.life += dt; f.y -= 18 * dt; }
  floaters = floaters.filter((f) => f.life < f.max);
}
function drawParticles(c) {
  for (const q of particles) {
    const k = 1 - q.life / q.max;
    c.globalAlpha = Math.max(0, k);
    c.fillStyle = q.col;
    if (q.kind === 'star') {
      const r = q.size * (0.6 + k * 0.6);
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? r * 0.45 : r;
        c.lineTo(q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
    } else if (q.kind === 'dust') {
      c.beginPath(); c.arc(q.x, q.y, 1.5 + (1 - k) * 2.5, 0, Math.PI * 2); c.fill();
    } else if (q.kind === 'ember') {
      c.globalCompositeOperation = 'lighter';
      c.beginPath(); c.arc(q.x, q.y, q.size, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = 'source-over';
    } else {
      c.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
  }
  c.globalAlpha = 1;
}

/* ---------- Le dessin ---------- */
const STATE_NAME = {
  marche: 'Marcheur', tombe: 'Il tombe !', grimpe: 'Grimpeur', stop: 'Stop', pont: 'Bâtisseur',
  tunnel: 'Tunnel', creuse: 'Creuseur', hausse: 'Il hausse les épaules',
  echelle: 'Il pose une échelle', monte: 'Il monte l’échelle', descend: 'Il descend l’échelle',
  toboggan: 'Il pose un toboggan', glisse: 'Il glisse !', lance: 'Il lance une friandise',
};
function render(now, dt) {
  const t = now / 1000;
  const c = ctx;
  const { W, H, dpr, z } = view;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!W_) { c.fillStyle = '#173A57'; c.fillRect(0, 0, W, H); return; }
  drawBackground(c, theme, view.camX, z, W, H, t);
  let sx = 0;
  let sy = 0;
  if (shake > 0) { sx = (Math.random() - 0.5) * 6 * shake; sy = (Math.random() - 0.5) * 6 * shake; }
  c.save();
  c.translate(view.offX - view.camX * z + sx, view.offY + sy);
  c.scale(z, z);
  const T = W_.T;
  /* le fond de la terre (grottes, trous) puis le bas du monde qui continue sous l'écran */
  c.imageSmoothingEnabled = true;
  c.drawImage(painter.back, 0, 0, T.W, T.H);
  c.fillStyle = painter.deep;
  for (const [x0, x1] of painter.bottomRuns) c.fillRect(x0, T.H - 0.5, x1 - x0, 4000);
  drawBigDecor(c, decor.big, W_.solid, theme, t);
  c.drawImage(painter.canvas, 0, 0, T.W, T.H);
  /* au-delà des bords gauche et droit, on ne passe pas : c'est un mur */
  c.fillStyle = 'rgba(16, 26, 48, 0.55)';
  c.fillRect(-4000, -4000, 4000, T.H + 8000);
  c.fillRect(T.W, -4000, 4000, T.H + 8000);
  c.fillStyle = 'rgba(255, 255, 255, 0.5)';
  c.fillRect(-1.2, -4000, 1.2, T.H + 8000);
  c.fillRect(T.W, -4000, 1.2, T.H + 8000);
  drawThorns(c, T.thorns, TILE);
  drawDecor(c, decor.list, W_.solid, theme, t);
  if (T.sortie) drawHome(c, T.sortie, t, homeGlow);
  for (const S of W_.slides) drawSlide(c, S, t, (W_.tick - S.born) / TICK_RATE, W_.solid);
  for (const L of W_.ladders) drawLadder(c, L, t, (W_.tick - L.born) / TICK_RATE);
  for (const cl of W_.clowns) drawClown(c, cl, t);
  for (const p of W_.pompons) if (p.state !== 'parti') drawPompon(c, p, t, { hover: p === hover });
  drawWater(c, T.water, t, theme.eau, TILE);
  drawLava(c, T.lava, t, TILE);
  drawLavaGlow(c, T.lava, t, TILE);
  for (const k of W_.candies) drawCandy(c, k, t);
  if (T.entree) drawEntrance(c, T.entree, t, hatch, W_.total - W_.released);
  drawParticles(c);
  /* le nom du métier du Pompon sous la souris */
  if (hover && hover.state !== 'parti') {
    const label = `${STATE_NAME[hover.state] || ''}${hover.grimpe ? ' 🧗' : ''}${hover.parapluie ? ' ☂️' : ''}`;
    c.font = '800 6px "Baloo 2", sans-serif';
    c.textAlign = 'center';
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(46,42,77,0.85)';
    c.strokeText(label, hover.x, hover.y - 20);
    c.fillStyle = '#FFFFFF';
    c.fillText(label, hover.x, hover.y - 20);
  }
  /* les petits mots qui s'envolent */
  for (const f of floaters) {
    const k = 1 - f.life / f.max;
    c.globalAlpha = Math.min(1, k * 2);
    c.font = '800 7px "Baloo 2", sans-serif';
    c.textAlign = 'center';
    c.lineWidth = 2.2;
    c.strokeStyle = 'rgba(46,42,77,0.9)';
    c.strokeText(f.text, f.x, f.y);
    c.fillStyle = f.col;
    c.fillText(f.text, f.x, f.y);
  }
  c.globalAlpha = 1;
  c.restore();
  if (theme.fond === 'volcan') drawHeat(c, W, H, t);
  drawMinimap(now);
}

/* au Volcan : les bords de l'écran rougeoient, et tout flashe quand ça gronde */
function drawHeat(c, W, H, t) {
  const pulse = 0.28 + Math.sin(t * 1.7) * 0.08 + shake * 0.5;
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(255,60,0,0)');
  g.addColorStop(1, `rgba(200,30,0,${pulse})`);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  if (shake > 0.2) {
    c.fillStyle = `rgba(255,140,40,${(shake - 0.2) * 0.35})`;
    c.fillRect(0, 0, W, H);
  }
}

/* les braises qui s'échappent de la lave, et le volcan qui gronde de temps en temps */
let rumbleIn = 9;
function volcanoLife(dt) {
  if (!W_ || theme.fond !== 'volcan' || paused) return;
  const tops = W_.T.lava;
  if (tops.length && Math.random() < dt * 14) {
    const l = tops[Math.floor(Math.random() * tops.length)];
    if (l.top || l.fall) {
      particles.push({
        x: l.c * TILE + Math.random() * TILE, y: l.r * TILE + 1, col: Math.random() < 0.3 ? '#FFE680' : '#FF8A20', kind: 'ember',
        vx: (Math.random() - 0.5) * 8, vy: -10 - Math.random() * 20, life: 0, max: 1.5 + Math.random() * 1.5, size: 0.6 + Math.random() * 0.8,
      });
    }
  }
  if (mode !== 'play') return;
  rumbleIn -= dt;
  if (rumbleIn <= 0) {
    rumbleIn = 10 + Math.random() * 8;
    shake = 0.7;
    sfx.rumble();
    buzz([60, 40, 80]);
    if (!flags.rumble) { flags.rumble = true; say(pick(PLUME.rumble), 0, 2500); }
    /* des cendres et des braises tombent du plafond */
    const x0 = view.camX;
    for (let i = 0; i < 14; i++) {
      particles.push({
        x: x0 + Math.random() * (view.W / view.z), y: -4, col: i % 3 ? '#FF7A20' : '#5A4A48', kind: i % 3 ? 'ember' : 'chunk',
        vx: (Math.random() - 0.5) * 10, vy: 30 + Math.random() * 40, life: 0, max: 2.4, size: 0.8 + Math.random(),
      });
    }
  }
}

function drawMinimap(now) {
  if (!W_) return;
  const r = minimap.getBoundingClientRect();
  const dpr = view.dpr;
  const mw = Math.round(r.width * dpr);
  const mh = Math.round(r.height * dpr);
  if (!mw || !mh) return;
  if (minimap.width !== mw || minimap.height !== mh) { minimap.width = mw; minimap.height = mh; thumbDirty = true; }
  const T = W_.T;
  const k = Math.min(mw / T.W, mh / T.H);
  const ox = (mw - T.W * k) / 2;
  const oy = (mh - T.H * k) / 2;
  if (thumbDirty && now - lastThumb > 200) {
    thumb.width = mw; thumb.height = mh;
    const tc = thumb.getContext('2d');
    tc.clearRect(0, 0, mw, mh);
    tc.imageSmoothingEnabled = true;
    tc.drawImage(painter.canvas, ox, oy, T.W * k, T.H * k);
    tc.fillStyle = theme.eau;
    for (const w of T.water) tc.fillRect(ox + w.c * TILE * k, oy + w.r * TILE * k, TILE * k + 0.5, TILE * k + 0.5);
    tc.fillStyle = '#FF7A1A';
    for (const l of T.lava) tc.fillRect(ox + l.c * TILE * k, oy + l.r * TILE * k, TILE * k + 0.5, TILE * k + 0.5);
    thumbDirty = false;
    lastThumb = now;
  }
  const m = mctx;
  m.clearRect(0, 0, mw, mh);
  m.drawImage(thumb, 0, 0);
  if (T.sortie) {
    m.fillStyle = '#E8414E';
    m.beginPath(); m.arc(ox + T.sortie.x * k, oy + (T.sortie.y - 8) * k, 3.5 * dpr, 0, Math.PI * 2); m.fill();
  }
  if (T.entree) {
    m.fillStyle = '#FFFFFF';
    m.beginPath(); m.arc(ox + T.entree.x * k, oy + T.entree.y * k, 3 * dpr, 0, Math.PI * 2); m.fill();
  }
  for (const p of W_.pompons) {
    if (p.state === 'parti' || p.state === 'perdu') continue;
    m.fillStyle = POMPON_COLORS[p.id % POMPON_COLORS.length];
    m.fillRect(ox + p.x * k - dpr, oy + (p.y - 6) * k - dpr, 2.4 * dpr, 2.4 * dpr);
  }
  for (const cl of W_.clowns) {
    if (cl.state === 'pouf' || cl.state === 'parti') continue;
    m.fillStyle = '#9B6BF2';
    m.beginPath(); m.arc(ox + cl.x * k, oy + (cl.y - 12) * k, 3 * dpr, 0, Math.PI * 2); m.fill();
  }
  /* ce qu'on voit à l'écran */
  if (view.maxX > 0) {
    m.strokeStyle = '#FFFFFF';
    m.lineWidth = 1.5 * dpr;
    m.strokeRect(ox + view.camX * k, oy + 1, (view.W / view.z) * k, T.H * k - 2);
  }
}

/* ---------- La boucle ---------- */
let lastNow = 0;
const keysHeld = {};
function frame(now) {
  const dt = Math.min(0.1, lastNow ? (now - lastNow) / 1000 : 0);
  lastNow = now;
  if (W_ && mode === 'play' && !paused && !anyOverlay()) {
    acc += dt * (fast ? FAST : 1);
    let n = 0;
    while (acc >= STEP_S && n < 12 && mode === 'play') {
      stepWorld();
      acc -= STEP_S;
      n++;
    }
    if (n >= 12) acc = 0;
  }
  if (W_) {
    const pan = (keysHeld.ArrowRight || keysHeld.KeyD ? 1 : 0) - (keysHeld.ArrowLeft || keysHeld.KeyA || keysHeld.KeyQ ? 1 : 0);
    if (pan) setCam(view.camX + (pan * PAN_SPEED * dt) / view.z);
  }
  homeGlow = Math.max(0, homeGlow - dt * 1.5);
  hatch = Math.max(0, hatch - dt * 2.5);
  shake = Math.max(0, shake - dt);
  volcanoLife(dt);
  updateParticles(dt * (paused ? 0 : 1));
  if (mode === 'play') renderHud();
  updatePlume(now);
  render(now, dt);
  requestAnimationFrame(frame);
}

/* ---------- Toucher et souris ---------- */
function findPompon(sx, sy) {
  if (!W_) return null;
  const [wx, wy] = toWorld(sx, sy);
  const rad = Math.max(16, 10 * view.z) / view.z;
  let best = null;
  let bestScore = Infinity;
  for (const p of W_.pompons) {
    if (p.state === 'parti' || p.state === 'sauve' || p.state === 'perdu') continue;
    const d = Math.hypot(p.x - wx, p.y - 7 - wy);
    if (d > rad) continue;
    /* on préfère un Pompon qui peut vraiment recevoir le métier choisi */
    const ok = selected && W_.canTake(p, selected) === 'ok';
    const score = d - (ok ? 100 : 0);
    if (score < bestScore) { bestScore = score; best = p; }
  }
  return best;
}

function tapPompon(p) {
  if (!p) return;
  if (p.state === 'stop' && (!selected || selected === 'stop' || (W_.skills[selected] || 0) <= 0)) {
    W_.free(p);
    for (const e of W_.events) handleEvent(e);
    W_.events.length = 0;
    return;
  }
  if (!selected) { say(PLUME.noSkill, 3, 2600); sfx.nope(); return; }
  const r = W_.assign(p, selected);
  for (const e of W_.events) handleEvent(e);
  W_.events.length = 0;
  if (r === 'ok') return;
  sfx.nope();
  const sk = SKILL_BY_ID[selected];
  if (r === 'empty') say(PLUME.empty(sk.nom), 3, 2600);
  else if (r === 'already') say(PLUME.already[selected] || PLUME.already.autre, 3, 2400);
  else if (r === 'busy') say(PLUME.busy, 3, 2400);
  else if (r === 'rock') say(PLUME.rockAssign, 3, 3000);
  else if (r === 'nothing') say(selected === 'echelle' ? PLUME.ladderNothing : selected === 'toboggan' ? PLUME.slideNothing : PLUME.nothing, 3, 3000);
  else if (r === 'tooHigh') say(selected === 'toboggan' ? PLUME.slideHigh : PLUME.ladderHigh, 3, 3000);
  else if (r === 'blocked') say(selected === 'toboggan' ? PLUME.slideBlocked : PLUME.ladderBlocked, 3, 3000);
  else if (r === 'gone') say(PLUME.gone, 3, 2000);
}

const ptr = { down: false, id: null, x0: 0, y0: 0, cam0: 0, drag: false };
canvas.addEventListener('pointerdown', (e) => {
  if (!W_) return;
  ptr.down = true; ptr.id = e.pointerId; ptr.x0 = e.clientX; ptr.y0 = e.clientY; ptr.cam0 = view.camX; ptr.drag = false;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
});
canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  if (ptr.down && e.pointerId === ptr.id) {
    const dx = e.clientX - ptr.x0;
    if (!ptr.drag && Math.hypot(dx, e.clientY - ptr.y0) > 10) { ptr.drag = true; canvas.classList.add('dragging'); }
    if (ptr.drag) setCam(ptr.cam0 - dx / view.z);
  }
  if (e.pointerType === 'mouse') {
    hover = ptr.drag ? null : findPompon(e.clientX - r.left, e.clientY - r.top);
    canvas.classList.toggle('over-pompon', !!hover);
  }
});
function endPointer(e) {
  if (!ptr.down || e.pointerId !== ptr.id) return;
  ptr.down = false;
  canvas.classList.remove('dragging');
  if (!ptr.drag && mode === 'play') {
    const r = canvas.getBoundingClientRect();
    tapPompon(findPompon(e.clientX - r.left, e.clientY - r.top));
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => { ptr.down = false; ptr.drag = false; canvas.classList.remove('dragging'); });
canvas.addEventListener('pointerleave', () => { hover = null; });
canvas.addEventListener('wheel', (e) => {
  if (!W_ || view.maxX <= 0) return;
  e.preventDefault();
  setCam(view.camX + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / view.z);
}, { passive: false });

/* la mini-carte : on la touche pour regarder ailleurs */
function minimapLook(e) {
  if (!W_) return;
  const r = minimap.getBoundingClientRect();
  const T = W_.T;
  const k = Math.min(r.width / T.W, r.height / T.H);
  const ox = (r.width - T.W * k) / 2;
  centerOn((e.clientX - r.left - ox) / k);
}
let mmDown = false;
minimap.addEventListener('pointerdown', (e) => { mmDown = true; minimapLook(e); try { minimap.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ } });
minimap.addEventListener('pointermove', (e) => { if (mmDown) minimapLook(e); });
minimap.addEventListener('pointerup', () => { mmDown = false; });

/* ---------- Clavier ---------- */
document.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (!$('guide').hidden) return;
  if (e.code === 'Escape') {
    if (!quitOverlay.hidden) { quitOverlay.hidden = true; return; }
    if (!levelsOverlay.hidden && mode === 'play') { closeLevels(); return; }
    if (mode === 'play' && !anyOverlay()) openQuit();
    return;
  }
  if (anyOverlay() || mode !== 'play') return;
  keysHeld[e.code] = true;
  const n = Number(e.key);
  if (n >= 1 && n <= SKILLS.length) { selectSkill(SKILLS[n - 1].id); e.preventDefault(); return; }
  if (e.code === 'Space') { setPaused(!paused); e.preventDefault(); }
  else if (e.code === 'KeyF') setFast(!fast);
  else if (e.code === 'KeyR') restart();
  else if (e.code === 'KeyM') openLevels();
});
document.addEventListener('keyup', (e) => { keysHeld[e.code] = false; });

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
/* recommencer sans les fenêtres d'introduction */
function startLevelQuick(i) {
  closeAll();
  loadLevel(i);
  mode = 'play';
  setPaused(false);
  setFast(false);
  autoSteps = null;
  showBanner();
  say(LV.intro, 1, 4500);
}
$('pauseBtn').addEventListener('click', (e) => { e.currentTarget.blur(); if (mode === 'play') setPaused(!paused); });
$('fastBtn').addEventListener('click', (e) => { e.currentTarget.blur(); setFast(!fast); });
$('restartBtn').addEventListener('click', (e) => { e.currentTarget.blur(); restart(); });
$('hintBtn').addEventListener('click', (e) => { e.currentTarget.blur(); if (mode === 'play') hintDialog(); });
$('finishBtn').addEventListener('click', (e) => { e.currentTarget.blur(); if (mode === 'play') finishLevel(); });
$('goalToggle').addEventListener('click', (e) => {
  e.currentTarget.blur();
  const p = $('goalPanel');
  p.classList.toggle('collapsed');
  e.currentTarget.setAttribute('aria-expanded', String(!p.classList.contains('collapsed')));
});

/* ---------- Le son ---------- */
const soundBtn = $('soundBtn');
const renderSoundBtn = () => { soundBtn.textContent = isSoundOn() ? '🔊' : '🔇'; };
renderSoundBtn();
soundBtn.addEventListener('click', (e) => { e.currentTarget.blur(); toggleSound(); renderSoundBtn(); });

/* ---------- Les fenêtres ---------- */
const anyOverlay = () => !dialog.hidden || !levelsOverlay.hidden || !startOverlay.hidden || !introOverlay.hidden
  || !endOverlay.hidden || !quitOverlay.hidden || !$('guide').hidden;
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
function plumeFace() {
  const f = el('div', 'dlg-face');
  f.innerHTML = PLUME_SVG;
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

function worldDialog(world, next) {
  openDialog((card) => {
    head(card, plumeFace(), `${world.icone} ${world.nom}`, `Monde ${WORLDS.indexOf(world) + 1} sur ${WORLDS.length}`);
    card.append(el('p', 'dlg-say', world.histoire));
    actions(card, [['C’est parti ! 🐾', 'primary', () => {
      save.seenWorlds[world.id] = true; writeSave();
      dialog.hidden = true;
      if (next) next();
    }]]);
  });
}

function skillDialog(s, next) {
  openDialog((card) => {
    const face = el('div', 'dlg-face skill-face');
    const cv = document.createElement('canvas');
    cv.width = 140; cv.height = 140;
    drawSkillIcon(cv, s.id);
    face.append(cv);
    head(card, face, `Nouveau métier : ${s.nom} !`, s.court);
    card.append(el('p', 'dlg-say', s.comment));
    const fact = el('p', 'dlg-fact');
    fact.append(el('b', null, '💡 Le savais-tu ?'), document.createTextNode(s.fait));
    card.append(fact);
    actions(card, [['J’ai compris ! 👍', 'primary', () => {
      save.seenSkills[s.id] = true; writeSave();
      dialog.hidden = true;
      if (next) next();
    }]]);
  });
}

function hintDialog() {
  openDialog((card) => {
    head(card, plumeFace(), 'Un indice de Plume', LV.nom);
    card.append(el('p', 'dlg-say', LV.astuce));
    actions(card, [
      ['Merci Plume ! 🦉', 'primary', () => { dialog.hidden = true; }],
      ['🔁 Recommencer', 'secondary', () => { dialog.hidden = true; restart(); }],
    ]);
  });
}

/* ---------- La fin d'un niveau ---------- */
function finishLevel() {
  if (mode !== 'play') return;
  mode = 'result';
  setPaused(false);
  $('pauseVeil').hidden = true;
  const saved = W_.saved;
  const won = saved >= LV.besoin;
  const stars = won ? starsFor(LV, saved) : 0;
  const before = bestOf(LV);
  const record = saved > before;
  if (record) save.best[LV.id] = saved;
  const next = levelIndex + 1 < LEVELS.length ? levelIndex + 1 : -1;
  if (won && next >= 0) save.last = next;
  writeSave();
  const lastLevel = won && levelIndex === LEVELS.length - 1;
  const firstEnding = lastLevel && save.ending !== LV.id;   // la fête, une fois, après le tout dernier niveau
  setTimeout(() => {
    if (won) { sfx.win(); launchConfetti(); } else sfx.fail();
    openDialog((card) => {
      card.classList.add('result');
      const box = el('div', 'result');
      box.append(el('p', `result-title${won ? '' : ' fail'}`, won ? `${STAR_TEXT[stars] || 'Gagné !'} 🎉` : 'Presque !'));
      const st = el('div', 'result-stars');
      for (let k = 0; k < 3; k++) st.append(el('span', null, '⭐'));
      box.append(st);
      const count = el('p', 'result-count');
      count.append(el('b', null, String(saved)), document.createTextNode(` Pompon${saved > 1 ? 's' : ''} sur ${LV.pompons} à la maison`));
      box.append(count);
      const homes = el('div', 'result-homes');
      for (let k = 0; k < LV.pompons; k++) homes.append(el('i', k < saved ? 'ok' : '', '🐾'));
      box.append(homes);
      box.append(el('p', 'dlg-say', won ? pick(PLUME.win) : `${pick(PLUME.fail)} Il en fallait ${LV.besoin}.`));
      if (record && before) box.append(el('p', 'result-best', `Nouveau record ! (avant : ${before})`));
      else if (!record && before) box.append(el('p', 'result-best', `Ton record : ${before} Pompons`));
      card.append(box);
      const list = [];
      if (firstEnding) list.push(['🎉 La grande fête !', 'royal', () => { dialog.hidden = true; startEnding(); }]);
      else if (won && next >= 0) list.push(['▶ Niveau suivant', 'primary', () => startLevel(next)]);
      if (!won) list.push(['💡 Indice', 'secondary', () => hintDialog()]);
      list.push([won ? '🔁 Rejouer' : '🔁 Réessayer', won ? 'secondary' : 'primary', () => startLevelQuick(levelIndex)]);
      list.push(['🗺️ Les niveaux', 'secondary', () => { dialog.hidden = true; openLevels(); }]);
      actions(card, list);
      const spans = st.querySelectorAll('span');
      for (let k = 0; k < stars; k++) setTimeout(() => { spans[k].classList.add('on'); sfx.star(k); }, 350 + k * 380);
    });
  }, won ? 700 : 500);
}

function launchConfetti() {
  const pieces = ['⭐', '✨', '🌟', '🎉', '💫', '🌼', '🍄'];
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

/* ---------- La carte des niveaux ---------- */
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
function renderLevels() {
  const list = $('worldsList');
  list.innerHTML = '';
  const nextI = firstUnfinished();
  const sub = $('levelsSub');
  sub.innerHTML = '';
  sub.append('⭐ ');
  sub.append(el('b', null, String(totalStars())));
  sub.append(` étoiles sur ${LEVELS.length * 3} · choisis un niveau`);
  WORLDS.forEach((world, wi) => {
    const card = el('div', 'world-card');
    const firstI = LEVELS.findIndex((l) => l.wi === wi);
    if (!isOpen(firstI)) card.classList.add('locked');
    card.style.setProperty('--w1', world.theme.ciel[0]);
    card.style.setProperty('--w2', world.theme.fond === 'montagne' ? '#7C93B5' : world.theme.herbe || world.theme.ciel[1]);
    if (world.theme.fond === 'grotte') card.style.setProperty('--w2', '#5B4C8A');
    const h = el('h3');
    h.append(el('span', null, world.icone), ` ${wi + 1}. ${world.nom}`);
    card.append(h, el('p', null, world.histoire));
    const row = el('div', 'lvl-row');
    LEVELS.forEach((lv, i) => {
      if (lv.wi !== wi) return;
      const b = el('button', 'lvl-btn');
      const open = isOpen(i);
      b.disabled = !open;
      const st = starsFor(lv, bestOf(lv));
      b.append(el('span', null, open ? String(lv.li + 1) : '🔒'));
      if (open) b.append(el('span', 'st', '⭐'.repeat(st) + '☆'.repeat(3 - st)));
      b.title = open ? `${lv.nom}${st ? ` — ${st} étoile${st > 1 ? 's' : ''}` : ''}` : 'Gagne le niveau d’avant pour l’ouvrir';
      b.setAttribute('aria-label', `Niveau ${lv.li + 1} : ${lv.nom}`);
      if (i === nextI && !isWon(lv)) b.classList.add('next');
      if (W_ && i === levelIndex && mode === 'play') b.classList.add('current');
      b.addEventListener('click', () => startLevel(i));
      row.append(b);
    });
    card.append(row);
    list.append(card);
  });
  const soon = el('div', 'world-soon');
  soon.append(el('span', null, BIENTOT.icone), BIENTOT.texte);
  list.append(soon);
}
$('mapBtn').addEventListener('click', (e) => { e.currentTarget.blur(); if (mode !== 'menu') openLevels(); });
$('levelsClose').addEventListener('click', () => closeLevels());

/* ---------- L'écran de départ et la carte des mondes ----------
   Un monde fini se rejoue quand on veut ; le monde où l'on en est s'ouvre au
   niveau à faire ; les mondes d'après restent fermés (tout est ouvert avec ?debug). */
const MAP_POS = [[8, 70], [22, 30], [36, 70], [50, 30], [64, 70], [79, 30], [93, 70]];    // en % de la carte
const MAP_DECOR = [
  ['🌼', 2, 38], ['🌷', 15, 90], ['🌲', 13, 10], ['🍄', 29, 48], ['💎', 44, 90], ['🦇', 29, 88], ['❄️', 42, 10],
  ['🏔️', 58, 10], ['🔥', 72, 92], ['🔥', 57, 92], ['🎈', 71, 10], ['🎪', 87, 12], ['🍭', 85, 52], ['☁️', 36, 12], ['✨', 98, 40],
];
let mapSel = 0;
const worldLevels = (wi) => LEVELS.filter((l) => l.wi === wi);
const worldDone = (wi) => worldLevels(wi).every(isWon);
const hereWorld = () => (LEVELS.every(isWon) ? -1 : LEVELS[firstUnfinished()].wi);
function worldState(wi) {
  if (wi >= WORLDS.length) return 'soon';
  if (worldDone(wi)) return 'done';
  if (DEBUG || wi === hereWorld()) return 'open';
  return 'locked';
}
const worldStars = (wi) => worldLevels(wi).reduce((n, lv) => n + starsFor(lv, bestOf(lv)), 0);
const REGION_COLORS = ['#7FD89A', '#3E9B55', '#8E7CC3', '#A9C4E8', '#F0603A', '#FF6FB1', '#B9B4C8'];

function renderWorldMap() {
  const map = $('worldMap');
  map.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('wm-svg');
  /* une tache de couleur par monde, comme une région sur une carte */
  MAP_POS.forEach(([x, y], i) => {
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('rx', 12); e.setAttribute('ry', 26);
    e.setAttribute('fill', REGION_COLORS[i % REGION_COLORS.length]);
    e.setAttribute('class', `wm-region is-${worldState(i)}`);
    svg.appendChild(e);
  });
  /* le chemin d'un monde à l'autre : plein quand on l'a parcouru */
  for (let i = 1; i < MAP_POS.length; i++) {
    const [x0, y0] = MAP_POS[i - 1];
    const [x1, y1] = MAP_POS[i];
    const mx = (x0 + x1) / 2;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', `M${x0} ${y0} C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`);
    if (worldDone(i - 1)) path.setAttribute('class', 'taken');
    svg.appendChild(path);
  }
  map.appendChild(svg);
  for (const [icon, x, y] of MAP_DECOR) {
    const d = el('span', 'wm-decor', icon);
    d.style.left = `${x}%`;
    d.style.top = `${y}%`;
    map.appendChild(d);
  }
  const here = hereWorld();
  const BADGE = { done: '✅', locked: '🔒', soon: '🚧' };
  const SAY = { done: 'fini', open: 'ouvert', locked: 'fermé', soon: 'bientôt' };
  [...WORLDS, null].forEach((w, wi) => {
    const st = worldState(wi);
    const b = el('button', `wm-node is-${st}${wi === mapSel ? ' is-sel' : ''}${wi === here ? ' is-here' : ''}`);
    b.type = 'button';
    b.style.left = `${MAP_POS[wi][0]}%`;
    b.style.top = `${MAP_POS[wi][1]}%`;
    b.setAttribute('aria-pressed', String(wi === mapSel));
    const name = w ? w.nom : BIENTOT.nom;
    b.setAttribute('aria-label', `${name} (${SAY[st]})`);
    const dot = el('span', 'wm-dot', w ? w.icone : BIENTOT.icone);
    if (BADGE[st]) dot.append(el('span', 'wm-badge', BADGE[st]));
    if (wi === here) dot.append(el('span', 'wm-pin', '📍'));
    b.append(dot, el('span', 'wm-name', name));
    if (w && st !== 'locked') b.append(el('span', 'wm-stars', `⭐ ${worldStars(wi)}/${worldLevels(wi).length * 3}`));
    b.addEventListener('click', () => {
      mapSel = wi;
      sfx.select();
      renderWorldMap();
      renderStartInfo();
      $('worldMap').querySelectorAll('.wm-node')[wi].focus({ preventScroll: true });
    });
    map.appendChild(b);
  });
}

/* le niveau proposé dans un monde : celui à faire, sinon le premier sans ses 3 étoiles */
function suggestedLevel(wi) {
  const lvls = worldLevels(wi);
  const todo = lvls.find((lv) => !isWon(lv)) || lvls.find((lv) => starsFor(lv, bestOf(lv)) < 3) || lvls[0];
  return LEVELS.indexOf(todo);
}

function renderStartInfo() {
  const any = Object.keys(save.best).length > 0;
  const st = worldState(mapSel);
  const w = WORLDS[mapSel];
  const startBtn = $('startBtn');
  const levels = $('startLevels');
  const done = $('startDone');
  levels.innerHTML = '';
  $('newGameBtn').hidden = !any;
  $('howTo').hidden = any;
  if (st === 'soon') {
    $('startLevel').textContent = `${BIENTOT.icone} ${BIENTOT.nom}`;
    $('startGoal').textContent = fr(BIENTOT.texte);
    done.hidden = false;
    done.textContent = fr('🚧 Ce monde n’existe pas encore : il arrive bientôt !');
    startBtn.hidden = true;
    return;
  }
  $('startLevel').textContent = `${w.icone} Monde ${mapSel + 1} : ${w.nom}`;
  $('startGoal').textContent = fr(any || mapSel
    ? w.histoire
    : 'Le grand vent a emporté les Pompons loin de leur village. Ils marchent toujours tout droit, sans jamais réfléchir… Donne-leur des métiers pour les ramener à la maison !');
  if (st === 'locked') {
    const prev = WORLDS[mapSel - 1];
    done.hidden = false;
    done.textContent = fr(`🔒 Pour ouvrir ce monde, finis d’abord tous les niveaux de ${prev.nom} ${prev.icone}.`);
    startBtn.hidden = true;
    return;
  }
  const stars = totalStars();
  done.hidden = !any;
  done.textContent = st === 'done'
    ? fr(`✅ Monde fini ! Rejoue ses niveaux pour gagner toutes les étoiles. (En tout : ${stars} ⭐ sur ${LEVELS.length * 3})`)
    : fr(`Bon retour ! Tu as déjà ${stars} étoile${stars > 1 ? 's' : ''} ⭐ sur ${LEVELS.length * 3}.`);
  /* les niveaux du monde choisi : on peut aussi en prendre un directement */
  LEVELS.forEach((lv, i) => {
    if (lv.wi !== mapSel) return;
    const open = isOpen(i);
    const b = el('button', 'lvl-btn');
    b.type = 'button';
    b.disabled = !open;
    const sN = starsFor(lv, bestOf(lv));
    b.append(el('span', null, open ? String(lv.li + 1) : '🔒'));
    if (open) b.append(el('span', 'st', '⭐'.repeat(sN) + '☆'.repeat(3 - sN)));
    b.title = open ? lv.nom : 'Gagne le niveau d’avant pour l’ouvrir';
    b.setAttribute('aria-label', `Niveau ${lv.li + 1} : ${lv.nom}`);
    if (open && !isWon(lv)) b.classList.add('next');
    b.addEventListener('click', () => launchLevel(i));
    levels.append(b);
  });
  const target = suggestedLevel(mapSel);
  const lv = LEVELS[target];
  startBtn.hidden = false;
  startBtn.dataset.level = String(target);
  if (!any) startBtn.textContent = '▶ Jouer !';
  else if (st === 'done') startBtn.textContent = `🔁 Rejouer : ${lv.wi + 1}-${lv.li + 1} ${lv.nom}`;
  else startBtn.textContent = `▶ Continuer : ${lv.wi + 1}-${lv.li + 1} ${lv.nom}`;
}

function launchLevel(i) {
  startOverlay.hidden = true;
  if (!save.seenIntro) playIntro(() => startLevel(i));
  else startLevel(i);
}

function openStart() {
  mode = 'menu';
  const here = hereWorld();
  mapSel = here >= 0 ? here : WORLDS.length - 1;
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

/* ---------- Les films ---------- */
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
function startEnding() {
  mode = 'result';
  endOverlay.hidden = false;
  endOverlay.classList.remove('show-text');
  $('endSub').textContent = `Tu as gagné ${totalStars()} étoiles sur ${LEVELS.length * 3}. Les Pompons n’oublieront jamais leur grand guide !`;
  $('endSoon').textContent = `${BIENTOT.icone} ${BIENTOT.texte}`;
  if (story) story.stop();
  story = playStory('ending', $('endCanvas'), {
    sfx,
    onEnd: () => { endOverlay.classList.add('show-text'); launchConfetti(); },
  });
  setTimeout(() => endOverlay.classList.add('show-text'), 15500);
  save.ending = LEVELS[LEVELS.length - 1].id;
  writeSave();
}
$('endReplay').addEventListener('click', (e) => { e.currentTarget.blur(); startEnding(); });
$('endMap').addEventListener('click', () => {
  if (story) story.stop();
  endOverlay.hidden = true;
  openLevels();
});

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
function applyPhoneMode() {
  document.body.classList.toggle('phone', phoneMQ.matches);
  document.body.classList.toggle('full', !phoneMQ.matches);
  if (phoneMQ.matches) $('goalPanel').classList.add('collapsed');
  requestAnimationFrame(fit);
}
applyPhoneMode();
phoneMQ.addEventListener('change', applyPhoneMode);
window.addEventListener('resize', () => fit());
if (window.ResizeObserver) new ResizeObserver(() => fit()).observe(stage);

const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFullscreen() {
  try {
    if (isFullscreen()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      const p = exit && exit.call(document);
      if (p && p.catch) p.catch(() => {});
    } else {
      const el2 = document.documentElement;
      const req = el2.requestFullscreen || el2.webkitRequestFullscreen;
      const p = req && req.call(el2, { navigationUI: 'hide' });
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

/* ---------- Le pilote automatique (?debug) ---------- */
function applyAuto() {
  for (const s of autoSteps) {
    if (s.done) continue;
    const p = W_.pompons[s.p];
    if (!p) continue;
    if (s.tick != null && W_.tick < s.tick) continue;
    if ((s.x != null || s.y != null) && p.state !== (s.etat || 'marche')) continue;
    if (s.x != null && p.x !== s.x) continue;
    if (s.y != null && p.y !== s.y) continue;
    s.done = true;
    if (s.metier === 'libere') W_.free(p); else W_.assign(p, s.metier);
  }
}
if (DEBUG) {
  window.__pom = {
    get world() { return W_; },
    get view() { return view; },
    niveau: (i) => startLevel(i),
    auto: () => { autoSteps = (LV.solution || []).map((s) => ({ ...s })); },
    verifie: () => LEVELS.map((lv) => {
      const r = playSolution(lv);
      const none = playSolution(lv, []);
      return { id: lv.id, saved: r.saved, besoin: lv.besoin, ok: r.saved >= lv.besoin, sansRien: none.saved };
    }),
    pas: (n = 1) => { for (let i = 0; i < n && mode === 'play'; i++) stepWorld(); },
    regarde: (x) => centerOn(x),
    finir: () => finishLevel(),
    /* millisecondes pour dessiner une image (à garder bien sous 16) */
    bench: (n = 60) => { const t0 = performance.now(); for (let i = 0; i < n; i++) render(t0 + i * 16, 0.016); return (performance.now() - t0) / n; },
    /* le point de l'écran où se trouve le Pompon n° i */
    ecran: (i) => { const p = W_.pompons[i]; return p ? toScreen(p.x, p.y - 7) : null; },
    fin: () => startEnding(),
  };
}

/* ---------- C'est parti ---------- */
const askLevel = Number(params.get('niveau'));
if (DEBUG && askLevel >= 1) {
  save.seenIntro = true;
  LEVELS.forEach((lv) => { save.seenWorlds[lv.world.id] = true; Object.keys(lv.metiers).forEach((k) => { save.seenSkills[k] = true; }); });
  startLevel(askLevel - 1);
} else {
  loadLevel(Math.min(save.last || 0, LEVELS.length - 1));
  openStart();
}
requestAnimationFrame(frame);
