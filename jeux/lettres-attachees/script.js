// ============================================================================
// Lettres Magiques — le moteur du jeu. Gribouille a soufflé sur le Grimoire
// Magique de Plume : les lettres et les mots se sont envolés dans des bulles.
// À chaque « sort », le parchemin montre un modèle (une lettre, une image,
// un mot, deux mots) ; le joueur éclate avec sa baguette la bulle qui
// contient la même chose dans une autre écriture (MAJUSCULES, script ou
// attachée). Chaque page réparée rapproche de la fin du niveau.
// Tout ce qui décrit un niveau (pages, mots, pièges, conseils) est dans
// levels/ : ce fichier ne connaît aucune lettre ni aucun mot par son nom.
// ============================================================================

import { LEVELS } from './levels/index.js';
import {
  buildScene, drawSceneFx, drawBubble, drawSmoke, drawParchment, drawTag, drawGrimoire, grimoireSlot,
  drawWand, drawShootingStar, drawGribouille, drawWindLines, drawSpark, drawWritten, fitFont,
  plumeSvg, wandSvg, written, SCRIPTS, INK,
} from './art.js';
import { LINES, WANDS, HATS } from './data.js';
import { createIntro, createEnding } from './intro.js';
import { sfx, isSoundOn, toggleSound, speak, canSpeak } from './sound.js';

const SAVE_KEY = 'lettres-magiques-v1';
const SAVE_VERSION = 1;
const TAU = Math.PI * 2;
const MAX_PIXELS = 3.6e6;          // pixels au plus dans une toile plein écran
const IMG_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest/';
const MAX_SCORE = 99;              // (classement) étoiles comptées au plus par niveau

/* ---------- Typographie : espaces insécables avant ! ? : ; » et après « ---------- */
// (sinon, sur un petit écran, un « ! » peut se retrouver tout seul en début de ligne)
function fixTypo(o) {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') o[k] = v.replace(/ ([!?:;»])/g, ' $1').replace(/« /g, '« ');
    else if (v && typeof v === 'object') fixTypo(v);
  }
}
fixTypo(LEVELS);
fixTypo(LINES);
fixTypo(WANDS);
fixTypo(HATS);

/* ---------- Réglages ---------- */
const GLOW_AFTER = 2;              // après 2 erreurs, la bonne bulle brille un peu
const NEXT_ROUND_DELAY = 1.15;     // s entre la bonne réponse et le sort suivant
const STREAK_BONUS = 3;            // une étoile de plus tous les 3 sorts réussis d'affilée
const STAR_STARS = 3;              // ce que rapporte une étoile filante
const MISSION_STARS = 2;           // ce que rapporte une mission bonus

/* ---------- Le niveau en cours (tout ce qui le décrit est dans levels/) ---------- */
let LV = null;
let CH = null;

/* ---------- Éléments de la page ---------- */
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('magicCanvas');
const ctx = canvas.getContext('2d');
const starsEl = $('stars');
const starsItem = $('starsItem');
const pageLabel = $('pageLabel');
const pageBar = $('pageBar');
const streakItem = $('streakItem');
const streakEl = $('streak');
const shopBtn = $('shopBtn');
const soundBtn = $('soundBtn');
const listenBtn = $('listenBtn');
const missionPanel = $('missionPanel');
const missionList = $('missionList');
const missionTitle = $('missionTitle');
const factCard = $('factCard');
const copilot = $('copilot');
const bubble = $('bubble');
const startOverlay = $('startOverlay');
const dialogEl = $('dialog');
const dialogCard = $('dialogCard');
const pageOverlay = $('pageOverlay');
const endOverlay = $('endOverlay');
const endCanvas = $('endCanvas');
const ectx = endCanvas.getContext('2d');
const introOverlay = $('introOverlay');
const introCanvas = $('introCanvas');
const ictx = introCanvas.getContext('2d');
const quitOverlay = $('quitOverlay');
const confettiLayer = $('confettiLayer');
const guideEl = $('guide');
const phoneMQ = window.matchMedia('(pointer: coarse) and (max-width: 900px), (pointer: coarse) and (max-height: 520px)');
const touchMQ = window.matchMedia('(pointer: coarse)');
const DEBUG = new URLSearchParams(location.search).has('debug');

/* ---------- État ---------- */
let save = null;                   // tout ce qui est sauvegardé
let run = null;                    // le niveau en cours (save.runs[id])
let state = 'loading';             // 'loading' | 'ready' | 'intro' | 'playing' | 'page' | 'ending'
let cssW = 0, cssH = 0, dpr = 1;
let sceneImg = null;
let sceneKind = '';
const sceneFx = {};
let T = 0;                         // temps qui passe (animations)
let round = null;                  // le sort en cours
let layout = null;                 // où sont le parchemin, les bulles, le grimoire
let particles = [];
let floaters = [];
let smokes = [];
let flyers = [];
let beams = [];
let entries = [];                  // les sorts écrits sur la page du grimoire
let grimGlow = 0;
let parchGlow = 0;
let shake = 0;
let flash = { a: 0, color: '255,255,255' };
let shooting = null;               // l'étoile filante
let nextStarAt = 0;
let grib = null;                   // Gribouille, quand il passe
let nextGribAt = 0;
let gust = 0;                      // un coup de vent de Gribouille (0 → 1)
let plume = { until: 0, prio: 0 };
const cooldowns = {};
let nextTipAt = 0;
let nextJokeAt = 0;
let lastTapAt = 0;
let shopHinted = false;
let factTimer = null;
const factQueue = [];
let dialogActions = {};
let intro = null;
let ending = null;
let clock = 0;                     // temps de jeu (s'arrête quand une fenêtre est ouverte)
const timers = [];
const imgCache = {};
const pointer = { x: -100, y: -100, inside: false };

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
const ease = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const back = (k) => { k = clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

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

const ORDINALS = ['première', 'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième', 'septième', 'huitième', 'neuvième', 'dixième'];
const isEmojiCode = (s) => typeof s === 'string' && /^[0-9a-f]{4,}(_[0-9a-f]{2,})*$/.test(s);
const emojiChar = (code) => String.fromCodePoint(...code.split('_').map((h) => parseInt(h, 16)));
const imgUrl = (code) => `${IMG_BASE}${code}/emoji.svg`;

function image(code) {
  if (!imgCache[code]) {
    const img = new Image();
    img.src = imgUrl(code);
    imgCache[code] = img;
  }
  return imgCache[code];
}

/** Un petit texte dans ses écritures (cartes des niveaux, fiches) */
function writtenHtml(parts) {
  return parts.map(([script, text]) => script === 'img'
    ? `<img class="w-img" src="${imgUrl(text)}" alt="">`
    : `<span class="w-${script}">${escapeHtml(written(text, script))}</span>`).join(' ');
}

/* ---------- Sauvegarde ---------- */
function freshSave() {
  return {
    v: SAVE_VERSION,
    stars: 0,
    wands: { etoiles: true },
    hats: { sorcier: true },
    wand: 'etoiles',
    hat: 'sorcier',
    introSeen: false,
    levels: {},                    // id → { done, medal, best }
    runs: {},                      // id → le niveau en cours
  };
}

function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && data.v === SAVE_VERSION && data.levels && data.runs) {
      for (const id of Object.keys(data.runs)) {
        const r = data.runs[id];
        const lv = LEVELS.find((l) => l.id === id);
        if (!lv || !lv.chapters[r.chapter]) delete data.runs[id];
      }
      return { ...freshSave(), ...data };
    }
  } catch (e) { /* stockage indisponible ou abîmé */ }
  return freshSave();
}

function saveGame() {
  if (!save) return;
  if (run) run.entries = entries.map((e) => e.text);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* stockage indisponible */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignoré */ }
  save = freshSave();
}

function freshChapter() {
  return { found: 0, entries: [], used: [], streak: 0, bonus: {}, introShown: false, factsShown: 0 };
}

function newRun(levelIndex) {
  return {
    level: levelIndex, chapter: 0, rounds: 0, firstTry: 0, earned: 0, time: 0, bestStreak: 0, words: [],
    ...freshChapter(),
  };
}

const levelIndex = (id) => LEVELS.findIndex((l) => l.id === id);
const currentWand = () => WANDS.find((w) => w.id === save.wand) || WANDS[0];

/* ---------- Taille de l'écran et mise en page ---------- */
function resize() {
  const rect = stage.getBoundingClientRect();
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
  // sur un très grand écran, on limite le nombre de pixels (sinon le jeu rame)
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1, Math.sqrt(MAX_PIXELS / (cssW * cssH))));
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  sceneImg = null;
  computeLayout();
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

function computeLayout() {
  const W = cssW, H = cssH;
  const phone = document.body.classList.contains('phone');
  const top = phone ? 50 : 62;
  // le parchemin, en haut au milieu (sous les missions s'il les touche)
  const pw = W < 640 ? Math.min(W - 60, 440) : clamp(W * 0.36, 260, 440);
  const ph = clamp(H * (W < H ? 0.17 : 0.2), 90, 170);
  const px = (W - pw) / 2;
  let py = top + 10;
  const mp = missionPanel.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  if (mp.width && mp.right - sr.left > px - 16 && mp.bottom - sr.top > py) py = Math.max(py, mp.bottom - sr.top + 14);
  // le grimoire, en bas au milieu
  const gw = Math.min(clamp(W * 0.34, 200, 420), (H * 0.2) / 0.42);
  const gh = gw * 0.42;
  const gy = H - gh / 2 - (phone ? 10 : 18);
  // les bulles, entre les deux
  const bandTop = py + ph + 18;
  const bandBottom = gy - gh / 2 - 8;
  const bandW = Math.min(W - 24, 1040);
  layout = { W, H, px, py, pw, ph, gx: W / 2, gy, gw, gh, bandTop, bandBottom: Math.max(bandTop + 80, bandBottom), bandW };
  if (round) placeBubbles(round.bubbles);
  placeListenBtn();
}

/** Les places des bulles : une ligne sur un écran large, deux colonnes sinon */
function placeBubbles(bubbles) {
  const L = layout;
  const n = bubbles.length;
  const cols = L.W >= L.H * 1.05 ? n : 2;
  const rows = Math.ceil(n / cols);
  const bandH = L.bandBottom - L.bandTop;
  const cellW = L.bandW / cols, cellH = bandH / rows;
  const r = Math.max(34, Math.min(cellW * 0.4, cellH * 0.43, 150));
  bubbles.forEach((b, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const col = i - row * cols;
    const rowW = inRow * cellW;
    b.baseX = (L.W - rowW) / 2 + (col + 0.5) * cellW;
    b.baseY = L.bandTop + (row + 0.5) * cellH;
    // une bulle plus large pour les mots longs
    const size = fitFont(ctx, b.text, b.script, 10000, r * 0.62);
    ctx.font = SCRIPTS[b.script].font(size);
    const tw = ctx.measureText(written(b.text, b.script)).width;
    b.rx = clamp(tw * 0.62 + r * 0.25, r, Math.min(cellW * 0.47, r * 1.9));
    b.ry = b.rx > r * 1.3 ? r * 0.82 : r;
    b.cellW = cellW;
  });
}

function placeListenBtn() {
  if (!layout) return;
  const L = layout;
  listenBtn.style.left = `${L.px + L.pw - 26}px`;
  listenBtn.style.top = `${L.py + L.ph - 30}px`;
}

/* ---------- Plume, le guide ---------- */
function say(text, prio = 1, dur = 4500) {
  const now = performance.now();
  if (now < plume.until && prio < plume.prio) return;
  bubble.textContent = text;
  bubble.classList.remove('show');
  void bubble.offsetWidth;
  bubble.classList.add('show');
  copilot.classList.add('talking');
  plume = { until: now + dur, prio };
  if (dur > 2500) sfx.hoot();
  nextJokeAt = Math.max(nextJokeAt, now + 30000);
}

function sayOnce(key, lines, cooldownS, prio = 1) {
  const now = performance.now();
  if ((cooldowns[key] || 0) > now) return false;
  cooldowns[key] = now + cooldownS * 1000;
  say(typeof lines === 'string' ? lines : pick(lines), prio);
  return true;
}

function updatePlume(now) {
  if (plume.until && now > plume.until) {
    bubble.classList.remove('show');
    copilot.classList.remove('talking');
    plume = { until: 0, prio: 0 };
  }
  if (state !== 'playing' || isBlocked()) return;
  // les conseils de la page, un de temps en temps
  if (now > nextTipAt && !plume.until && CH.tips) {
    run.tipsSaid = run.tipsSaid || {};
    const i = CH.tips.findIndex((_, k) => !run.tipsSaid[`${run.chapter}-${k}`]);
    if (i >= 0) {
      run.tipsSaid[`${run.chapter}-${i}`] = true;
      say(CH.tips[i], 1, 6500);
    }
    nextTipAt = now + rand(35000, 50000);
  }
  if (now > nextJokeAt && !plume.until) {
    say(pick(LINES.jokes), 0, 7000);
    nextJokeAt = now + rand(70000, 100000);
  }
  if (now - lastTapAt > 16000) {
    sayOnce('idle', LINES.idle, 40, 1);
    lastTapAt = now;
  }
}

function renderPlume() {
  copilot.querySelector('.plume')?.remove();
  copilot.insertAdjacentHTML('afterbegin', plumeSvg(save.hat));
}

/* ---------- Effets ---------- */
function burst(x, y, count, speed, size, wand = currentWand()) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU;
    const s = rand(speed * 0.3, speed);
    particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.2, life: 0, max: rand(0.55, 1.1),
      size: rand(size * 0.5, size), color: pick(wand.colors), shape: wand.shape, rot: Math.random() * TAU, vr: rand(-4, 4),
    });
  }
  // le feu d'artifice : quelques petites gerbes de plus
  if (wand.shape === 'firework') {
    for (let k = 0; k < 3; k++) {
      later(() => burst(x + rand(-60, 60), y + rand(-50, 30), 12, speed * 0.6, size * 0.7, { ...wand, shape: 'star' }), 150 + k * 140);
    }
  }
}

/** Texte qui monte et s'efface */
function addFloater(text, x, y, color, size = 26) {
  floaters.push({ text, x, y, life: 0, max: 1.3, color, size });
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

function bump(el) {
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

/** Gagner des étoiles (avec une petite étoile qui vole jusqu'au compteur) */
function gainStars(n, x, y) {
  if (n <= 0) return;
  save.stars += n;
  run.earned += n;
  addFloater(`+${n} ⭐`, x, y - 30, '#FFE066', 28);
  sfx.coin();
  bump(starsItem);
  renderHud();
}

/* ---------- Fiche « Le savais-tu ? » ---------- */
function showFact(fact) {
  if (!factCard.hidden) {
    factQueue.push(fact);
    return;
  }
  const pic = $('fcPic');
  if (isEmojiCode(fact.pic)) pic.innerHTML = `<img src="${imgUrl(fact.pic)}" alt="">`;
  else if (Array.isArray(fact.pic)) pic.innerHTML = writtenHtml(fact.pic);
  else pic.innerHTML = `<span class="w-cap">${escapeHtml(fact.pic || '✨')}</span>`;
  $('fcName').textContent = fact.title;
  $('fcFact').textContent = fact.text;
  factCard.hidden = false;
  factCard.classList.remove('pop');
  void factCard.offsetWidth;
  factCard.classList.add('pop');
  clearTimeout(factTimer);
  factTimer = setTimeout(hideFact, 11000);
}

function hideFact() {
  factCard.hidden = true;
  clearTimeout(factTimer);
  if (factQueue.length && state === 'playing') setTimeout(() => showFact(factQueue.shift()), 600);
}
factCard.addEventListener('click', hideFact);

/** Les fiches de la page : la première après le premier sort, puis au milieu, puis vers la fin */
function maybeFact() {
  const facts = CH.facts || [];
  const at = [1, Math.ceil(CH.count / 2), CH.count - 1];
  const i = run.factsShown;
  if (i < facts.length && run.found >= at[i]) {
    run.factsShown++;
    later(() => { if (state === 'playing') showFact(facts[i]); }, 900);
  }
}

/* ---------- Les sorts ---------- */
function pickItem() {
  const pool = CH.items.filter((it) => !run.used.includes(it.t));
  const item = pick(pool.length ? pool : CH.items);
  if (!pool.length) run.used = [];
  run.used.push(item.t);
  return item;
}

function newRound() {
  if (state !== 'playing') return;
  const item = pickItem();
  const [from, to] = pick(CH.pairs);
  // les pièges : on garde ceux qui s'écrivent autrement que la bonne réponse
  const shown = new Set([written(item.t, to)]);
  const traps = [];
  for (const tr of shuffle(item.traps)) {
    const w = written(tr, to);
    if (tr !== item.t && !shown.has(w)) { shown.add(w); traps.push(tr); }
    if (traps.length >= CH.choices - 1) break;
  }
  const texts = shuffle([item.t, ...traps]);
  const showNums = !touchMQ.matches;
  const bubbles = texts.map((text, i) => ({
    text, script: to, correct: text === item.t, num: showNums ? i + 1 : 0,
    x: 0, y: 0, rx: 60, ry: 60, ph: Math.random() * TAU, scale: 0, alpha: 1, glow: 0, grey: false, hover: false,
    state: 'in', st: -i * 0.12, inflated: false,
  }));
  round = { item, from, to, bubbles, tries: 0, done: false, t: 0 };
  placeBubbles(bubbles);
  for (const b of bubbles) { b.x = b.baseX; b.y = b.baseY; }
  if (from === 'img') image(item.img);
  parchGlow = 1;
  listenBtn.hidden = !canSpeak();
  renderHud();
}

/** Ce que dit Plume quand on se trompe */
function hintFor(target, chosen) {
  const hint = LV.hints && LV.hints[[target, chosen].sort().join('|')];
  if (hint) return hint;
  if (round.from === 'img') return pick(LINES.wrongImg).replace('{w}', chosen);
  if (target.length === 1) return pick(LINES.wrong);
  const tw = target.split(' '), cw = chosen.split(' ');
  if (tw.length > 1 && tw.length === cw.length) {
    const i = tw.findIndex((w, k) => w !== cw[k]);
    return LINES.diffWord.replace('{n}', i === 0 ? 'premier' : 'deuxième');
  }
  if (target.length !== chosen.length) return LINES.diffLen.replace('{len}', target.replace(/ /g, '').length);
  const i = [...target].findIndex((c, k) => c !== chosen[k]);
  if (i <= 0) return LINES.diffFirst;
  return pick(LINES.diffAt).replace('{n}', ORDINALS[i] || `${i + 1}e`);
}

/** D'où part le rayon de la baguette */
function wandTip() {
  if (pointer.inside && !touchMQ.matches) return { x: pointer.x, y: pointer.y };
  return { x: layout.gx, y: layout.gy - layout.gh * 0.3 };
}

function choose(b) {
  if (!round || round.done || b.state !== 'idle') return;
  const tip = wandTip();
  beams.push({ x0: tip.x, y0: tip.y, x1: b.x, y1: b.y, life: 0 });
  sfx.zap();
  if (b.correct) rightAnswer(b);
  else wrongAnswer(b);
}

function rightAnswer(b) {
  round.done = true;
  b.state = 'right';
  b.st = 0;
  const first = round.tries === 0;
  run.rounds++;
  run.found++;
  sfx.pop();
  sfx.right(run.streak);
  burst(b.x, b.y, 34, 340, 9);
  shake = Math.max(shake, 4);
  flash = { a: 0.18, color: '255,240,180' };
  buzz(20);
  const text = round.item.t;
  run.words.push(text);
  plume.until = 0;                 // l'indice d'avant n'a plus lieu d'être
  // le mot vole jusqu'à sa ligne du grimoire
  const slot = grimoireSlot(layout.gx, layout.gy, layout.gw, entries.length, CH.count);
  flyers.push({ text, x0: b.x, y0: b.y, x1: slot.x, y1: slot.y, t: 0, dur: 0.75, size: Math.min(b.ry * 0.7, 60) });
  if (first) {
    run.firstTry++;
    run.streak++;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    let n = 1;
    if (run.streak % STREAK_BONUS === 0) {
      n++;
      sfx.streak();
      addFloater(`Série de ${run.streak} ⚡`, b.x, b.y - 70, '#FF9DBB', 30);
      if (run.streak >= 3) sayOnce('streak', pick(LINES.streak).replace('{n}', run.streak), 8, 2);
    }
    gainStars(n, b.x, b.y);
    if (!run.bonus.streak && run.streak >= (CH.streak || 3)) completeBonus('streak');
    say(pick(LINES.right), 1, 1800);
  } else {
    run.streak = 0;
    say(pick(LINES.afterRetry), 1, 2200);
  }
  speak(round.item.say || text);
  bump(streakItem);
  maybeFact();
  renderAll();
  saveGame();
  later(() => {
    if (!round) return;
    for (const o of round.bubbles) if (o !== b && o.state !== 'gone') { o.state = 'out'; o.st = 0; }
  }, 450);
  later(() => {
    if (state !== 'playing') return;
    if (run.found >= CH.count) pageComplete();
    else newRound();
  }, NEXT_ROUND_DELAY * 1000);
}

function wrongAnswer(b) {
  round.tries++;
  run.streak = 0;
  b.state = 'wrong';
  b.st = 0;
  sfx.wrong();
  shake = Math.max(shake, 7);
  buzz([30, 40, 30]);
  say(hintFor(round.item.t, b.text), 3, 5000);
  if (round.from === 'img') later(() => speak(b.text), 250);
  if (round.tries >= GLOW_AFTER) {
    const right = round.bubbles.find((o) => o.correct);
    if (right && !right.glow) {
      right.glow = 0.01;
      later(() => say(LINES.glow, 2, 3500), 2400);
    }
  }
  // Gribouille vient rigoler (pas à chaque fois)
  if (!grib && Math.random() < 0.45) gribouille('laugh');
  renderHud();
}

/* ---------- Missions bonus ---------- */
function completeBonus(kind) {
  if (run.bonus[kind]) return;
  run.bonus[kind] = true;
  const x = layout.W * 0.2, y = layout.bandTop + 30;
  later(() => {
    gainStars(MISSION_STARS, x, y);
    sfx.streak();
    confetti(24);
    renderMissions();
  }, 500);
}

function missionRows() {
  const rows = [{ icon: '📖', text: `Retrouve ${CH.count} sorts`, sub: `${Math.min(run.found, CH.count)} / ${CH.count}`, done: run.found >= CH.count }];
  rows.push({ icon: '⚡', text: `Une série de ${CH.streak || 3}`, sub: `Bonus : ${CH.streak || 3} du premier coup, d'affilée`, done: !!run.bonus.streak, bonus: true });
  if (CH.star) rows.push({ icon: '🌠', text: 'Une étoile filante', sub: 'Bonus : touche-la quand elle passe', done: !!run.bonus.star, bonus: true });
  return rows;
}

let missionsShown = '';
function renderMissions() {
  if (!CH || !run) return;
  const rows = missionRows();
  const key = JSON.stringify(rows) + run.chapter + LV.id;
  if (key === missionsShown) return;
  missionsShown = key;
  missionTitle.textContent = `Page ${run.chapter + 1} : ${CH.title}`;
  missionList.innerHTML = rows.map((r) => `
    <li class="m-item${r.done ? ' done' : ''}${r.bonus ? ' bonus' : ''}">
      <span class="m-thumb">${r.icon}</span>
      <span class="m-text"><strong>${escapeHtml(r.text)}</strong><span class="m-riddle">${escapeHtml(r.sub)}</span></span>
      <span class="m-check">✓</span>
    </li>`).join('');
}

/* ---------- L'étoile filante et Gribouille ---------- */
function launchStar() {
  const fromLeft = Math.random() < 0.5;
  const y0 = rand(layout.H * 0.12, layout.H * 0.3);
  const speed = clamp(layout.W / 4.2, 160, 300);
  shooting = { x: fromLeft ? -40 : layout.W + 40, y: y0, vx: fromLeft ? speed : -speed, vy: speed * 0.22 };
  sfx.starPass();
  sayOnce('star', LINES.star, 20, 3);
}

function catchStar() {
  const s = shooting;
  shooting = null;
  sfx.starCatch();
  burst(s.x, s.y, 40, 380, 10, { ...currentWand(), colors: ['#FFE066', '#FFFFFF', '#FFC93C'], shape: 'star' });
  flash = { a: 0.3, color: '255,245,190' };
  gainStars(STAR_STARS, s.x, s.y);
  say(pick(LINES.starCaught), 3, 3000);
  if (CH.star && !run.bonus.star) completeBonus('star');
  saveGame();
}

/** Gribouille passe : il rigole (après une erreur) ou souffle sur les bulles */
function gribouille(mood) {
  const side = Math.random() < 0.5 ? -1 : 1;
  grib = { mood, side, t: 0, life: mood === 'blow' ? 3.2 : 2.2 };
  if (mood === 'laugh') {
    sfx.giggle();
    if (Math.random() < 0.4) later(() => sayOnce('gribLaugh', LINES.gribouilleLaugh, 25, 1), 900);
  } else {
    sfx.wind();
    sayOnce('gribBlow', LINES.gribouille, 30, 1);
  }
}

/* ---------- Pages et niveaux ---------- */
function useLevel(i) {
  LV = LEVELS[i];
  CH = LV.chapters[run ? run.chapter : 0];
}

function startLevel(i) {
  const lv = LEVELS[i];
  run = save.runs[lv.id] || newRun(i);
  run.level = i;
  save.runs[lv.id] = run;
  useLevel(i);
  entries = (run.entries || []).map((text) => ({ text, age: 1 }));
  resetFx();
  state = 'playing';
  startOverlay.hidden = true;
  endOverlay.hidden = true;
  enterFullscreen();
  computeLayout();
  renderAll();
  preloadImages();
  const now = performance.now();
  lastTapAt = now;
  nextTipAt = now + 22000;
  nextJokeAt = now + rand(60000, 80000);
  scheduleExtras();
  if (!run.introShown) openChapterIntro();
  else {
    say(pick(LINES.resume), 2, 3500);
    newRound();
  }
  saveGame();
}

function resetFx() {
  particles = []; floaters = []; smokes = []; flyers = []; beams = [];
  round = null; shooting = null; grib = null; gust = 0; timers.length = 0;
  hideFact();
  factQueue.length = 0;
  listenBtn.hidden = true;
  plume.until = 1;                 // la bulle de Plume se ferme à la prochaine image
}

function scheduleExtras() {
  nextStarAt = clock + rand(14, 24);
  nextGribAt = clock + rand(6, 10);
}

function preloadImages() {
  for (const it of CH.items) if (it.img) image(it.img);
}

function openChapterIntro() {
  const rows = missionRows();
  const [from, to] = CH.pairs[0];
  const sample = CH.items[0];
  openDialog(`
    <div class="dlg-head">
      <div class="dlg-face">${plumeSvg(save.hat)}</div>
      <div>
        <p class="dlg-name">Page ${run.chapter + 1} : ${escapeHtml(CH.title)}</p>
        <p class="dlg-chapter">${LV.icon} Niveau ${run.level + 1} · ${escapeHtml(LV.name)} · page ${run.chapter + 1} sur ${LV.chapters.length}</p>
      </div>
    </div>
    <p class="dlg-say">${escapeHtml(CH.say)}</p>
    <ul class="mission-rows">
      ${rows.map((r) => `<li><span class="mr-icon">${r.icon}</span><span>${escapeHtml(r.text)}${r.bonus ? ' <small>bonus</small>' : ''}</span></li>`).join('')}
    </ul>
    <p class="dlg-scripts">${writtenHtml([[from, from === 'img' ? sample.img : sample.t]])} <b class="arrow">→</b> ${writtenHtml([[to, sample.t]])}</p>
    <div class="dlg-actions"><button class="primary" data-act="go">C'est parti ✨</button></div>`, {
    go: () => {
      closeDialog();
      run.introShown = true;
      if (run.chapter === 0) say(LV.lines.start, 3, 6500);
      else say(CH.say, 2, 5000);
      if (CH.wind) later(() => { if (state === 'playing') gribouille('blow'); }, 2500);
      newRound();
      saveGame();
    },
  });
  speak(CH.say.replace(/[«»]/g, ''), 0.95);
}

function pageComplete() {
  state = 'page';
  round = null;
  listenBtn.hidden = true;
  sfx.page();
  confetti(70);
  grimGlow = 1;
  const last = run.chapter >= LV.chapters.length - 1;
  $('pageTitle').textContent = `La page ${run.chapter + 1} est réparée !`;
  const bonus = ['streak', 'star'].filter((k) => run.bonus[k]).length;
  $('pageSub').textContent = last ? 'Le niveau est presque fini…' : `Prochaine page : ${LV.chapters[run.chapter + 1].title}`;
  $('pageBonus').textContent = bonus ? `+ ${bonus} mission${bonus > 1 ? 's' : ''} bonus ⭐` : '';
  pageOverlay.hidden = false;
  pageOverlay.classList.remove('go');
  void pageOverlay.offsetWidth;
  pageOverlay.classList.add('go');
  setTimeout(() => {
    pageOverlay.hidden = true;
    if (last) { startEnding(); return; }
    run.chapter++;
    Object.assign(run, freshChapter());
    CH = LV.chapters[run.chapter];
    entries = [];
    state = 'playing';
    preloadImages();
    scheduleExtras();
    renderAll();
    saveGame();
    openChapterIntro();
  }, 3000);
}

/* ---------- La fin d'un niveau ---------- */
const medalOf = (ratio) => (ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1);
const MEDALS = ['', '🥉', '🥈', '🥇'];
let endRun = null;

function startEnding() {
  state = 'ending';
  endRun = run;
  const ratio = run.rounds ? run.firstTry / run.rounds : 1;
  const medal = medalOf(ratio);
  const prev = save.levels[LV.id] || {};
  save.levels[LV.id] = { done: true, medal: Math.max(prev.medal || 0, medal), best: Math.max(prev.best || 0, run.earned) };
  delete save.runs[LV.id];
  saveGame();
  sfx.fanfare();
  confetti(110);
  const next = run.level + 1 < LEVELS.length ? run.level + 1 : -1;
  const allDone = LEVELS.every((l) => save.levels[l.id]?.done);
  $('endTitle').textContent = allDone && next < 0 ? 'Le grimoire est réparé !' : LV.ending.title;
  $('endMedal').textContent = MEDALS[medal];
  $('endSub').textContent = LV.ending.sub;
  const mins = Math.floor(run.time / 60), secs = Math.round(run.time % 60);
  $('endStats').innerHTML = `${run.rounds} sorts retrouvés, dont <b>${run.firstTry} du premier coup</b> · `
    + `⭐ ${run.earned} étoiles gagnées · ⏱️ ${mins ? `${mins} min ` : ''}${secs} s`;
  $('endFact').textContent = LV.ending.fact;
  $('endNext').hidden = next < 0;
  if (next >= 0) $('endNext').textContent = `${LEVELS[next].icon} Niveau ${next + 1} : ${LEVELS[next].name} ▶`;
  $('scoreForm').hidden = false;
  $('scoreSaved').hidden = true;
  endOverlay.hidden = false;
  endOverlay.classList.remove('show-text');
  sizeCanvas(endCanvas, endOverlay);
  ending = createEnding({ sfx, scene: LV.scene, hat: save.hat, words: run.words.slice(-12), wand: currentWand() });
  setTimeout(() => endOverlay.classList.add('show-text'), 900);
  renderBoard();
}

/* ---------- Le classement mondial (un par niveau) ---------- */
// Le module partagé classe « le plus petit d'abord » : on enregistre donc
// (MAX_SCORE − étoiles) × 1000 + secondes + 1 (plus d'étoiles, puis plus rapide).
const boardId = (lv) => `lettres-magiques-${lv.id}`;
const encodeScore = (stars, secs) => (MAX_SCORE - Math.min(MAX_SCORE, stars)) * 1000 + Math.min(998, Math.round(secs)) + 1;
const decodeScore = (value) => ({ stars: MAX_SCORE - Math.floor((value - 1) / 1000), secs: (value - 1) % 1000 });
let lbModule;
const leaderboard = () => {
  if (lbModule === undefined) lbModule = import('../../shared/leaderboard.js').catch(() => null);
  return lbModule;
};

async function renderBoard() {
  const list = $('endBoardList');
  const lv = LV;
  list.innerHTML = '<li class="leaderboard-empty">Chargement…</li>';
  const lb = await leaderboard();
  if (!lb || !lb.isLeaderboardConfigured()) {
    list.innerHTML = '<li class="leaderboard-empty">Classement indisponible pour le moment.</li>';
    $('scoreForm').hidden = true;
    return;
  }
  let top = [];
  try { top = await lb.fetchTopScores(boardId(lv), 10); } catch (e) { top = []; }
  if (lv !== LV) return;
  if (!top.length) {
    list.innerHTML = '<li class="leaderboard-empty">Sois le premier du classement !</li>';
    return;
  }
  list.innerHTML = top.map((e, i) => {
    const { stars, secs } = decodeScore(e.value);
    const m = Math.floor(secs / 60), s = secs % 60;
    return `<li><span class="rank">${i + 1}</span><span class="lb-name">${escapeHtml(e.name)}</span><span class="lb-time">⭐ ${stars} · ${m ? `${m} min ` : ''}${s} s</span></li>`;
  }).join('');
}

async function submitBoard() {
  const input = $('pseudoInput');
  const name = input.value.trim();
  if (!name) { input.focus(); return; }
  const btn = $('saveScore');
  btn.disabled = true;
  btn.textContent = 'Envoi…';
  const lb = await leaderboard();
  let ok = false;
  try { ok = !!lb && await lb.submitScore(boardId(LV), name, encodeScore(endRun.earned, endRun.time)); } catch (e) { ok = false; }
  btn.disabled = false;
  btn.textContent = 'Enregistrer';
  const msg = $('scoreSaved');
  msg.hidden = false;
  if (ok) {
    $('scoreForm').hidden = true;
    msg.textContent = 'Score enregistré ! 🎉';
    msg.classList.remove('ko');
    renderBoard();
  } else {
    msg.textContent = "Oups, l'enregistrement a échoué. Réessaie !";
    msg.classList.add('ko');
  }
}
$('saveScore').addEventListener('click', submitBoard);
$('pseudoInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBoard(); e.stopPropagation(); });

function leaveEnding() {
  ending = null;
  endOverlay.hidden = true;
  freeCanvas(endCanvas);
}

$('endNext').addEventListener('click', () => { leaveEnding(); startLevel(endRun.level + 1); });
$('endAgain').addEventListener('click', () => { leaveEnding(); startLevel(endRun.level); });
$('endLevels').addEventListener('click', () => { leaveEnding(); showStartScreen(); });

/* ---------- Boutique magique ---------- */
function openShop() {
  if (state !== 'playing' && state !== 'ready') return;
  const row = (kind, it, owned, worn, preview) => `
    <li class="shop-row${worn ? ' worn' : ''}">
      <span class="shop-pic">${preview}</span>
      <span class="sr-text"><b>${escapeHtml(it.name)}</b><small>${escapeHtml(it.desc)}</small></span>
      ${worn ? '<span class="shop-max">✓ Choisi</span>'
    : owned ? `<button class="buy wear" data-act="wear:${kind}:${it.id}">Choisir</button>`
      : `<button class="buy" data-act="buy:${kind}:${it.id}" ${save.stars < it.price ? 'disabled' : ''}>⭐ ${it.price}</button>`}
    </li>`;
  const html = `
    <p class="dlg-title">🛍️ La boutique magique</p>
    <p class="dlg-sub shop-purse">Tu as <b>⭐ ${save.stars}</b> étoile${save.stars > 1 ? 's' : ''}. Gagne-en en trouvant les sorts du premier coup !</p>
    <p class="shop-head">✨ La baguette</p>
    <ul class="shop-rows">${WANDS.map((w) => row('wand', w, save.wands[w.id], save.wand === w.id, wandSvg(w.colors))).join('')}</ul>
    <p class="shop-head">🎩 Le chapeau de Plume</p>
    <ul class="shop-rows">${HATS.map((h) => row('hat', h, save.hats[h.id], save.hat === h.id, plumeSvg(h.id))).join('')}</ul>
    <div class="dlg-actions"><button class="primary" data-act="close">Fermer</button></div>`;
  const actions = { close: closeDialog };
  for (const [kind, list] of [['wand', WANDS], ['hat', HATS]]) {
    for (const it of list) {
      actions[`buy:${kind}:${it.id}`] = () => {
        if (save.stars < it.price) return;
        save.stars -= it.price;
        (kind === 'wand' ? save.wands : save.hats)[it.id] = true;
        wear(kind, it.id);
        sfx.starCatch();
        confetti(30);
      };
      actions[`wear:${kind}:${it.id}`] = () => { wear(kind, it.id); sfx.click(); };
    }
  }
  openDialog(html, actions, true);
}

function wear(kind, id) {
  if (kind === 'wand') save.wand = id;
  else { save.hat = id; renderPlume(); }
  saveGame();
  renderHud();
  openShop();
}

shopBtn.addEventListener('click', (e) => { e.currentTarget.blur(); openShop(); });

function cheapestLeft() {
  const prices = [...WANDS.filter((w) => !save.wands[w.id]), ...HATS.filter((h) => !save.hats[h.id])].map((it) => it.price);
  return prices.length ? Math.min(...prices) : Infinity;
}

/* ---------- Fenêtres ---------- */
function openDialog(html, actions, wide = false) {
  dialogCard.innerHTML = html;
  dialogCard.classList.toggle('dlg-wide', wide);
  dialogActions = actions || {};
  dialogEl.hidden = false;
  const first = dialogCard.querySelector('button.primary, button.danger');
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

const isBlocked = () => !dialogEl.hidden || !quitOverlay.hidden || (guideEl && !guideEl.hidden);

/* ---------- Mises à jour ---------- */
function update(dt) {
  T += dt;
  run.time += dt;
  grimGlow = Math.max(0, grimGlow - dt * 0.8);
  parchGlow = Math.max(0, parchGlow - dt * 1.5);
  gust = Math.max(0, gust - dt * 0.6);
  for (const e of entries) e.age = Math.min(1, e.age + dt);

  // les bulles
  if (round) {
    round.t += dt;
    const wind = CH.wind || 0;
    // le vent pousse toutes les bulles du même côté (elles ne se cognent pas),
    // sans les faire sortir de l'écran
    const live = round.bubbles.filter((b) => b.state !== 'gone');
    const left = Math.min(...live.map((b) => b.baseX - b.rx * 1.06)), right = Math.max(...live.map((b) => b.baseX + b.rx * 1.06));
    const cellW = round.bubbles[0].cellW || 200;
    const windX = clamp(Math.sin(T * 0.55) * wind * (0.6 + gust) * 0.3 * cellW, Math.min(0, 6 - left), Math.max(0, layout.W - 6 - right));
    const windY = Math.cos(T * 0.8) * wind * (0.6 + gust) * 0.05 * layout.H;
    for (const b of round.bubbles) {
      b.st += dt;
      if (b.state === 'in') {
        if (b.st > 0 && !b.inflated) { b.inflated = true; sfx.inflate(round.bubbles.indexOf(b)); }
        b.scale = back(b.st / 0.45);
        if (b.st >= 0.45) { b.state = 'idle'; b.scale = 1; }
      } else if (b.state === 'wrong') {
        b.grey = true;
        b.scale = 1 - ease((b.st - 0.35) / 0.3) * 0.2;
        if (b.st > 0.55) {
          b.state = 'gone';
          smokes.push({ x: b.x, y: b.y, r: b.ry * 0.7, life: 0 });
          sfx.pop();
        }
      } else if (b.state === 'right') {
        b.scale = 1 + ease(b.st / 0.15) * 0.15;
        b.alpha = 1 - ease(b.st / 0.18);
        if (b.st > 0.2) b.state = 'gone';
      } else if (b.state === 'out') {
        b.scale = 1 - ease(b.st / 0.3);
        if (b.st > 0.3) { b.state = 'gone'; b.scale = 0; }
      }
      if (b.glow > 0) b.glow = Math.min(1, b.glow + dt);
      const shakeX = b.state === 'wrong' ? Math.sin(b.st * 60) * 8 * (1 - b.st / 0.6) : 0;
      b.x = b.baseX + Math.sin(T * 0.9 + b.ph) * b.rx * 0.04 + windX + shakeX;
      b.y = b.baseY + Math.sin(T * 1.3 + b.ph * 1.7) * b.ry * 0.07 + windY;
      b.hover = b.state === 'idle' && pointer.inside && !touchMQ.matches && hitBubble(b, pointer.x, pointer.y);
    }
  }

  // l'étoile filante
  if (CH.star && !shooting && clock > nextStarAt && round && !round.done) {
    if (!run.bonus.star || Math.random() < 0.5) launchStar();
    nextStarAt = clock + rand(22, 38);
  }
  if (shooting) {
    shooting.x += shooting.vx * dt;
    shooting.y += shooting.vy * dt;
    if (Math.random() < 0.7) particles.push({ x: shooting.x, y: shooting.y, vx: rand(-20, 20), vy: rand(10, 40), life: 0, max: 0.6, size: 4, color: '#FFF4B0', shape: 'star', rot: 0, vr: 3 });
    if (shooting.x < -80 || shooting.x > layout.W + 80) shooting = null;
  }

  // Gribouille
  if (grib) {
    grib.t += dt;
    if (grib.mood === 'blow' && grib.t > 0.6 && grib.t < 2.6) gust = Math.min(1.5, gust + dt * 2);
    if (grib.t > grib.life) grib = null;
  } else if (CH.wind && clock > nextGribAt && round && !round.done) {
    gribouille('blow');
    nextGribAt = clock + rand(16, 26);
  }

  // les effets
  for (const p of particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy = p.vy * 0.96 + 220 * dt;
    p.rot += p.vr * dt;
  }
  particles = particles.filter((p) => p.life < p.max);
  for (const f of floaters) { f.life += dt; f.y -= 40 * dt; }
  floaters = floaters.filter((f) => f.life < f.max);
  for (const s of smokes) { s.life += dt; s.y -= 30 * dt; s.r += 20 * dt; }
  smokes = smokes.filter((s) => s.life < 0.8);
  for (const bm of beams) bm.life += dt;
  beams = beams.filter((bm) => bm.life < 0.3);
  for (const f of flyers) {
    f.t += dt;
    if (f.t >= f.dur && !f.landed) {
      f.landed = true;
      entries.push({ text: f.text, age: 0 });
      grimGlow = 1;
      burst(f.x1, f.y1, 12, 160, 6);
    }
  }
  flyers = flyers.filter((f) => !f.landed);
  shake = Math.max(0, shake - dt * 30);
  flash.a = Math.max(0, flash.a - dt * 1.6);

  // la boutique : on le dit une fois quand on peut acheter quelque chose
  if (!shopHinted && save.stars >= cheapestLeft()) {
    shopHinted = true;
    later(() => sayOnce('shop', LINES.shop, 999, 1), 2500);
  }
}

function hitBubble(b, x, y) {
  const dx = (x - b.x) / (b.rx * b.scale), dy = (y - b.y) / (b.ry * b.scale);
  return dx * dx + dy * dy <= 1.08;
}

/* ---------- Dessin ---------- */
function draw() {
  const L = layout;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!sceneImg || sceneKind !== LV.scene) {
    sceneImg = buildScene(LV.scene, L.W, L.H, dpr);
    sceneKind = LV.scene;
  }
  const sx = shake ? rand(-shake, shake) : 0, sy = shake ? rand(-shake, shake) : 0;
  ctx.drawImage(sceneImg, 0, 0, L.W, L.H);
  drawSceneFx(ctx, LV.scene, L.W, L.H, T, sceneFx);
  ctx.save();
  ctx.translate(sx, sy);
  drawGrib();
  if (round) {
    for (const s of smokes) drawSmoke(ctx, s.x, s.y, s.r, 1 - s.life / 0.8);
    for (const b of round.bubbles) if (b.state !== 'gone') drawBubble(ctx, b, T);
    drawModel();
  }
  if (shooting) drawShootingStar(ctx, shooting, T);
  drawGrimoire(ctx, L.gx, L.gy, L.gw, T, grimGlow, entries, CH.count);
  for (const f of flyers) {
    const k = ease(f.t / f.dur);
    const x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * 80;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 230, 120, 0.9)';
    ctx.shadowBlur = 14;
    drawWritten(ctx, f.text, 'cursive', x, y, 400, f.size * (1 - k * 0.6), '#FFF4C8');
    ctx.restore();
  }
  drawBeams();
  for (const p of particles) {
    ctx.globalAlpha = 1 - p.life / p.max;
    drawSpark(ctx, p.shape, p.x, p.y, p.size, p.color, p.rot);
  }
  ctx.globalAlpha = 1;
  for (const f of floaters) {
    ctx.globalAlpha = 1 - Math.max(0, f.life / f.max - 0.6) / 0.4;
    ctx.font = `800 ${f.size}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(46, 42, 77, 0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (pointer.inside && !touchMQ.matches && state === 'playing') drawWand(ctx, pointer.x, pointer.y, T, currentWand().colors);
  if (flash.a > 0) {
    ctx.fillStyle = `rgba(${flash.color}, ${flash.a})`;
    ctx.fillRect(0, 0, L.W, L.H);
  }
}

/** Le parchemin : le modèle à retrouver, son écriture, et la consigne */
function drawModel() {
  const L = layout;
  const { item, from, to } = round;
  drawParchment(ctx, L.px, L.py, L.pw, L.ph, T, parchGlow);
  // l'attachée a de grandes boucles (j, g, l…) : on la fait un peu plus petite
  const curs = from === 'cursive';
  const cx = L.px + L.pw / 2, cy = L.py + L.ph * (curs ? 0.43 : 0.47);
  const modelH = L.ph * (curs ? 0.5 : 0.58);
  if (from === 'img') {
    const img = image(item.img);
    const s = modelH * 1.05;
    if (img.complete && img.naturalWidth) ctx.drawImage(img, cx - s / 2, cy - s / 2 + Math.sin(T * 2) * 2, s, s);
    else {
      ctx.font = `${s * 0.8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojiChar(item.img), cx, cy);
    }
  } else {
    drawWritten(ctx, item.t, from, cx, cy, L.pw * 0.78, modelH, INK);
  }
  drawTag(ctx, cx, L.py, from === 'img' ? 'IMAGE' : SCRIPTS[from].label, from === 'img' ? '#FF8A3C' : TAG_COLORS[from]);
  // la consigne
  const what = from === 'img' ? 'Trouve son nom en' : item.t.length === 1 ? 'Trouve-la en' : 'Trouve-le en';
  const line = `${what} ${to === 'cap' ? 'MAJUSCULES' : to === 'script' ? 'script' : 'attachée'}`;
  let fs = clamp(L.ph * 0.12, 11, 17);
  ctx.font = `700 ${fs}px 'Quicksand', sans-serif`;
  fs = Math.max(10, fs * Math.min(1, (L.pw - 110) / ctx.measureText(line).width));
  ctx.font = `700 ${fs}px 'Quicksand', sans-serif`;
  ctx.fillStyle = '#7A5A3A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(line, cx, L.py + L.ph - fs * 0.95);
}

const TAG_COLORS = { cap: '#4FB8E8', script: '#58C97B', cursive: '#B058C9' };

function drawBeams() {
  for (const bm of beams) {
    const a = 1 - bm.life / 0.3;
    const wand = currentWand();
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = wand.colors[0];
    ctx.shadowColor = wand.colors[0];
    ctx.shadowBlur = 18;
    ctx.lineWidth = 6 * a + 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bm.x0, bm.y0);
    const mx = (bm.x0 + bm.x1) / 2 + Math.sin(bm.life * 40) * 14, my = (bm.y0 + bm.y1) / 2 - 30;
    ctx.quadraticCurveTo(mx, my, bm.x1, bm.y1);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGrib() {
  if (!grib) return;
  const L = layout;
  const r = clamp(L.W * 0.05, 34, 64);
  const k = Math.min(ease(grib.t / 0.5), ease((grib.life - grib.t) / 0.5));
  const edge = grib.side < 0 ? -r * 1.5 : L.W + r * 1.5;
  const inX = grib.side < 0 ? r * 1.4 : L.W - r * 1.4;
  const x = edge + (inX - edge) * k;
  const y = (L.bandTop + L.bandBottom) / 2 - L.H * 0.05;
  drawGribouille(ctx, x, y, r, T, grib.mood, -grib.side);
  if (grib.mood === 'blow' && grib.t > 0.5 && grib.t < grib.life - 0.4) {
    drawWindLines(ctx, x - grib.side * r * 1.2, y, -grib.side, L.W * 0.5, T, 0.8);
  }
}

/* ---------- Panneaux ---------- */
function renderHud() {
  if (!save) return;
  starsEl.textContent = String(save.stars);
  if (run && CH) {
    pageLabel.textContent = `Page ${run.chapter + 1}/${LV.chapters.length}`;
    pageBar.style.width = `${Math.round((Math.min(run.found, CH.count) / CH.count) * 100)}%`;
    streakEl.textContent = String(run.streak);
    streakItem.classList.toggle('hot', run.streak >= 3);
  }
  shopBtn.classList.toggle('ready', save.stars >= cheapestLeft());
}

function renderAll() {
  renderHud();
  renderMissions();
}

/* ---------- Commandes ---------- */
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'playing' || isBlocked()) return;
  const p = canvasPoint(e);
  pointer.x = p.x;
  pointer.y = p.y;
  lastTapAt = performance.now();
  if (shooting && Math.hypot(p.x - shooting.x, p.y - shooting.y) < 56) { catchStar(); return; }
  if (!round || round.done) return;
  // la bulle touchée (la plus proche de son centre, si deux se chevauchent)
  let best = null, bestD = Infinity;
  for (const b of round.bubbles) {
    if (b.state !== 'idle' || !hitBubble(b, p.x, p.y)) continue;
    const d = Math.hypot((p.x - b.x) / b.rx, (p.y - b.y) / b.ry);
    if (d < bestD) { best = b; bestD = d; }
  }
  if (best) choose(best);
  else if (!touchMQ.matches) burst(p.x, p.y, 6, 120, 5);
});
canvas.addEventListener('pointermove', (e) => {
  const p = canvasPoint(e);
  pointer.x = p.x;
  pointer.y = p.y;
  pointer.inside = e.pointerType === 'mouse';
});
canvas.addEventListener('pointerleave', () => { pointer.inside = false; });

window.addEventListener('keydown', (e) => {
  if (state !== 'playing' || isBlocked() || e.repeat) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 4 && round && !round.done) {
    const b = round.bubbles.find((o) => o.num === n);
    if (b) { lastTapAt = performance.now(); choose(b); }
  } else if (e.key === ' ' || e.key.toLowerCase() === 'l') {
    e.preventDefault();
    listen();
  }
});

function listen() {
  if (!round) return;
  const it = round.item;
  speak(it.say || it.t);
  bump(listenBtn);
}
listenBtn.addEventListener('click', (e) => { e.currentTarget.blur(); listen(); });

$('missionToggle').addEventListener('click', () => {
  const collapsed = missionPanel.classList.toggle('collapsed');
  $('missionToggle').setAttribute('aria-expanded', String(!collapsed));
  computeLayout();
});

/* ---------- Boucle principale ---------- */
let last = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
  last = now;
  if (state === 'intro' && intro) {
    intro.update(dt);
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    intro.draw(ictx, introCanvas.width / dpr, introCanvas.height / dpr);
    if (intro.done) endIntro();
    return;
  }
  if (state === 'ending' && ending) {
    ending.update(dt);
    ectx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ending.draw(ectx, endCanvas.width / dpr, endCanvas.height / dpr);
    return;
  }
  if (!LV || !layout || !CH) return;
  const blocked = isBlocked();
  runTimers(state === 'playing' && !blocked ? dt : 0);
  if (state === 'playing' && !blocked) update(dt);
  else T += dt * 0.3;
  draw();
  updatePlume(now);
}

/* ---------- L'écran de départ : choisir son niveau, ou le grand voyage ---------- */
function voyageLevel() {
  const i = LEVELS.findIndex((l) => !save.levels[l.id]?.done);
  return i < 0 ? 0 : i;
}

function showStartScreen() {
  state = 'ready';
  closeDialog();
  listenBtn.hidden = true;
  const allDone = LEVELS.every((l) => save.levels[l.id]?.done);
  $('levelGrid').innerHTML = LEVELS.map((lv, i) => {
    const res = save.levels[lv.id];
    const r = save.runs[lv.id];
    const status = r ? `<span class="lv-status going">▶ Page ${r.chapter + 1}/${lv.chapters.length}</span>`
      : res?.done ? `<span class="lv-status won">${MEDALS[res.medal]} Réussi</span>` : '<span class="lv-status">Nouveau</span>';
    const [a, b] = lv.example;
    return `
      <button class="lv-card" data-level="${i}" style="--lv:${i}">
        <span class="lv-num">Niveau ${i + 1}</span>
        <span class="lv-icon">${lv.icon}</span>
        <span class="lv-name">${escapeHtml(lv.name)}</span>
        <span class="lv-example">${writtenHtml([a])} <b class="arrow">→</b> ${writtenHtml([b])}</span>
        <span class="lv-age">${escapeHtml(lv.short)} · ${escapeHtml(lv.age)}</span>
        ${status}
      </button>`;
  }).join('');
  const vi = voyageLevel();
  const vr = save.runs[LEVELS[vi].id];
  const started = Object.keys(save.levels).length || Object.keys(save.runs).length;
  $('startBtn').textContent = allDone ? '✨ Refaire le grand voyage'
    : vr ? `✨ Continuer le grand voyage : niveau ${vi + 1}, page ${vr.chapter + 1}`
      : started ? `✨ Continuer le grand voyage : niveau ${vi + 1}` : '✨ Commencer le grand voyage';
  $('startDone').hidden = !allDone;
  $('resetBtn').hidden = !started && !save.stars;
  startOverlay.hidden = false;
  renderHud();
  setTimeout(() => $('startBtn').focus({ preventScroll: true }), 50);
}

function begin(i) {
  if (state !== 'ready') return;
  sfx.click();
  startOverlay.hidden = true;
  if (!save.introSeen) { playIntro(i); return; }
  startLevel(i);
}

$('levelGrid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-level]');
  if (card) begin(Number(card.dataset.level));
});
$('startBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  const allDone = LEVELS.every((l) => save.levels[l.id]?.done);
  if (allDone) for (const l of LEVELS) delete save.runs[l.id];
  begin(allDone ? 0 : voyageLevel());
});
$('resetBtn').addEventListener('click', () => {
  openDialog(`
    <p class="dlg-title">Tout recommencer ?</p>
    <p class="dlg-sub">Tes niveaux, tes médailles, tes étoiles et ta boutique seront effacés.</p>
    <div class="dlg-actions">
      <button class="danger" data-act="yes">Oui, tout effacer</button>
      <button class="primary" data-act="close">Non, je garde tout</button>
    </div>`, {
    yes: () => { clearSave(); renderPlume(); showStartScreen(); },
    close: closeDialog,
  });
});

/* ---------- L'animation de départ (intro.js) ---------- */
let introNext = 0;
function playIntro(levelI) {
  state = 'intro';
  introNext = levelI;
  intro = createIntro({ sfx, hat: save.hat });
  introOverlay.hidden = false;
  enterFullscreen();
  sizeCanvas(introCanvas, introOverlay);
  $('introSkip').focus({ preventScroll: true });
}

function endIntro() {
  if (state !== 'intro') return;
  intro = null;
  introOverlay.hidden = true;
  freeCanvas(introCanvas);
  save.introSeen = true;
  state = 'ready';
  startLevel(introNext);
  flash = { a: 0.8, color: '255,255,255' };
}

$('introSkip').addEventListener('click', (e) => { e.currentTarget.blur(); endIntro(); });

/* ---------- Mode téléphone : jeu en plein écran ---------- */
function applyPhoneMode() {
  document.body.classList.toggle('phone', phoneMQ.matches);
  document.body.classList.toggle('full', !phoneMQ.matches);
  if (phoneMQ.matches) missionPanel.classList.add('collapsed');
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
  if (document.hidden && state === 'playing') saveGame();
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
$('quitLevels').addEventListener('click', () => {
  closeQuit();
  saveGame();
  resetFx();
  showStartScreen();
});
quitOverlay.addEventListener('click', (e) => { if (e.target === quitOverlay) closeQuit(); });

/* ---------- Son ---------- */
function renderSoundBtn() { soundBtn.textContent = isSoundOn() ? '🔊' : '🔇'; }
soundBtn.addEventListener('click', (e) => {
  e.currentTarget.blur();
  toggleSound();
  renderSoundBtn();
});

/* ---------- Démarrage ---------- */
async function init() {
  save = loadSave();
  renderPlume();
  resize();
  new ResizeObserver(resize).observe(stage);
  new ResizeObserver(computeLayout).observe(missionPanel);
  renderSoundBtn();
  // les trois écritures doivent être chargées avant de dessiner les bulles
  try {
    await Promise.all([
      document.fonts.load(`800 20px 'Baloo 2'`),
      document.fonts.load(`700 20px 'Quicksand'`),
      document.fonts.load(`400 20px 'Playwrite FR Moderne'`, 'abc'),
    ]);
  } catch (err) { /* police de secours */ }
  const params = new URLSearchParams(location.search);
  if (DEBUG && params.has('reset')) clearSave();
  // le décor de l'écran de départ : celui du prochain niveau à faire
  useLevel(voyageLevel());
  computeLayout();
  showStartScreen();
  requestAnimationFrame(loop);
  if (DEBUG) {
    // pour tester : ?debug, puis __lm.answer(), __lm.level(2), __lm.stars(50)…
    window.__lm = {
      get save() { return save; }, get run() { return run; }, get round() { return round; }, get state() { return state; },
      get layout() { return layout; },
      level(i, ch = 0) {
        save.introSeen = true;
        state = 'ready';
        delete save.runs[LEVELS[i].id];
        startLevel(i);
        if (ch) { run.chapter = ch; CH = LV.chapters[ch]; Object.assign(run, freshChapter()); run.introShown = true; renderAll(); newRound(); }
        if (!dialogEl.hidden && ch) closeDialog();
      },
      answer(right = true) {
        if (!round || round.done) return false;
        const b = round.bubbles.find((o) => o.correct === right && o.state === 'idle');
        if (b) choose(b);
        return !!b;
      },
      closeDialog() { if (dialogActions.go) dialogActions.go(); else closeDialog(); },
      stars(n) { save.stars += n; renderHud(); },
      star: () => launchStar(),
      grib: (m = 'blow') => gribouille(m),
      ending: () => startEnding(),
      update, draw, runTimers, fact: () => showFact(CH.facts[0]),
    };
  }
}

init();
