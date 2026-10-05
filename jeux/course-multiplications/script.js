import { MODES, makeQuestion, shuffle } from './questions.js';
import {
  buildScenery, carSprite, CAR_COLORS, CAR_SPRITE_W, CAR_SPRITE_H, TAIL_LIGHTS,
  drawGrandpa, drawBoy, drawNotes, drawWindmillBlades, starPath,
} from './art.js';
import { sfx, unlockAudio, isSoundOn, toggleSound, engineStart, engineSpeed, engineStop } from './sound.js';

// Le classement mondial est chargé à part : sans connexion, le jeu marche quand même
const leaderboard = import('../../shared/leaderboard.js').catch((err) => {
  console.warn('Classement indisponible :', err);
  return null;
});

/* ---------- Règles ---------- */
const GAME_DURATION = 180;     // la route dure 3 minutes
const QUESTION_EVERY = 20;     // un calcul toutes les 20 secondes
const FIRST_QUESTION_AT = 1;
const ANSWER_DELAY = 13;       // secondes entre l'apparition du calcul et le passage des panneaux
const TOTAL_QUESTIONS = 9;     // calculs à 1 s, 21 s, … 161 s : le dernier passe à 174 s, avant l'arrivée
const MAX_POINTS = TOTAL_QUESTIONS * 2;   // avec un bonus ×2 à chaque calcul
// Entre deux calculs, parfois un bonus ×2 : on le croise 6 s après les panneaux
const EVENT_DELAY = 6;
const GRANDPA_WALK = 1;        // m/s : le papi ne court pas !
// De plus en plus de papis au fil de la course : 1, 1, 2, 2, 3, 3, 4, 4 entre deux réponses
const grandpaCountForGap = (k) => Math.min(4, 1 + Math.floor(k / 2));
// Moments où un papi peut être croisé (en s après les panneaux) : jamais en même temps que
// le bonus (6 s), le tremplin (13 s) ou un autre papi, pour qu'on puisse toujours l'éviter
const GRANDPA_SLOTS = [2.5, 4, 7.5, 9, 10.5, 15, 16.5];
// Tremplins : on les croise 13 s après les panneaux
const RAMP_DELAY = 13;
const RAMP_LEN = 5, RAMP_H = 0.9, RAMP_HALF_W = 1.3;
const JUMP_SPEED = 6.5, GRAVITY = 13;   // environ 1 s en l'air
const DANCE_TIME = 4.5;        // le temps de regarder la danse avant le score
const COUNTDOWN = 3;

/* ---------- Monde (en mètres) ---------- */
const SPEED = 25;                          // 90 km/h
const MENU_SPEED = 13;
const ROUTE_LEN = SPEED * GAME_DURATION;   // 4,5 km de la ville à la plage
const SPAWN_AHEAD = SPEED * ANSWER_DELAY;  // distance à laquelle les panneaux apparaissent
const DRAW_DIST = 340;
const LANE_W = 3.5;
const ROAD_HALF = LANE_W * 1.5;
const CURB_W = 0.55, SHOULDER_W = 0.9;
const SEG_L = 6;                           // longueur d'une bande de route
const GATE_W = 2.9, GATE_BOTTOM = 0.35, GATE_TOP = 2.45;
const HIT_Z = 1.2;                         // distance à laquelle on traverse un panneau
const CAR_W = 2.3, CAR_H = CAR_W * CAR_SPRITE_H / CAR_SPRITE_W;
const LANE_COLORS = ['#FF4D8B', '#3D9BFF', '#FFA51F'];
const START_S = 3;                         // la ligne de départ, juste devant la voiture
const ROAD_AFTER_FINISH = 40;  // la route s'arrête 40 m après l'arche…
const BEACH_LEN = 30;          // … puis 30 m de plage avant la mer
const STOP_ON_SAND = 6;        // la voiture s'arrête un peu sur le sable
const BOY_AHEAD = 5, BOY_X = 2.6;
const NEAR_ZC = 0.8;           // rien n'est dessiné plus près de la caméra

/* ---------- Éléments de la page ---------- */
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('game');
const ctx = canvas.getContext('2d');
const hud = $('hud');
const timerEl = $('timer');
const timerPill = timerEl.parentElement;
const pointsEl = $('points');
const pointsPill = $('pointsPill');
const bonusBadge = $('bonusBadge');
const tripFill = $('tripFill');
const tripCar = $('tripCar');
const tripTicks = $('tripTicks');
const qcard = $('qcard');
const qNum = $('qNum');
const qText = $('qText');
const qBonus = $('qBonus');
const qBar = $('qBar');
const qFeedback = $('qFeedback');
const optionEls = [...document.querySelectorAll('#qOpts .opt')];
const toastEl = $('toast');
const touchControls = $('touchControls');
const countdownEl = $('countdown');
const countdownNum = $('countdownNum');
const lights = [...countdownEl.querySelectorAll('.lights i')];
const menuScreen = $('menuScreen');
const helpScreen = $('helpScreen');
const boardScreen = $('boardScreen');
const pauseScreen = $('pauseScreen');
const endScreen = $('endScreen');
const danceCanvas = $('danceCanvas');
const danceCtx = danceCanvas.getContext('2d');
const pseudoInput = $('pseudoInput');
const scoreForm = $('scoreForm');
const scoreMsg = $('scoreMsg');

$('qTotal').textContent = String(TOTAL_QUESTIONS);

const isTouch = window.matchMedia('(pointer: coarse)').matches;

/* ---------- Petits outils ---------- */
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
// Petit hasard "fixe" : le même arbre reste au même endroit d'une image à l'autre
function hash(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, alpha = 1) => `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${alpha})`;

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function storeGet(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch (e) { return fallback; }
}
function storeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* stockage indisponible */ }
}

/* ---------- Paysages : campagne → forêt et montagnes → bord de mer ---------- */
const ZONES = [
  { grassA: '#8ADB72', grassB: '#7ED267', shoulder: '#E9D59D', hillNear: '#6CC35E', hillFar: '#A4D8B0', mount: '#9EC1E4', mountAmp: 0.55 },
  { grassA: '#62C266', grassB: '#57B85C', shoulder: '#D8C493', hillNear: '#3E9C59', hillFar: '#78B59C', mount: '#8099D0', mountAmp: 1.15 },
  { grassA: '#BCE073', grassB: '#B0D769', shoulder: '#F3DFA8', hillNear: '#9ACB6C', hillFar: '#C5DCAF', mount: '#B6C6E6', mountAmp: 0.4 },
].map((z) => {
  const out = { mountAmp: z.mountAmp };
  Object.entries(z).forEach(([k, v]) => { if (typeof v === 'string') out[k] = hex(v); });
  return out;
});
// 0 = campagne … 2 = bord de mer, en continu selon la position sur la route
const zoneAt = (s) => (state === 'menu' ? 0 : clamp((s / ROUTE_LEN) * 3 - 0.5, 0, 2));
function zoneColor(key, zf) {
  const i = Math.min(1, Math.floor(zf));
  return mix(ZONES[i][key], ZONES[i + 1][key], zf - i);
}
const zoneValue = (key, zf) => {
  const i = Math.min(1, Math.floor(zf));
  return lerp(ZONES[i][key], ZONES[i + 1][key], zf - i);
};

// Le ciel passe du matin au coucher de soleil au fil de la course
const SKY = [
  [0, '#3E9EF0', '#86CBF7', '#D3F0FF'],
  [0.55, '#3593EA', '#7EC2F5', '#D6F2FF'],
  [0.8, '#5279D6', '#A9A7EA', '#FFD9B8'],
  [1, '#4A56BE', '#E58BB5', '#FFC27A'],
].map(([p, ...cols]) => [p, cols.map(hex)]);
function skyAt(p) {
  let i = 0;
  while (i < SKY.length - 2 && p > SKY[i + 1][0]) i++;
  const [p0, a] = SKY[i], [p1, b] = SKY[i + 1];
  const t = clamp((p - p0) / (p1 - p0), 0, 1);
  return a.map((c, k) => mix(c, b[k], t));
}

const SEA = [hex('#2F9BDB'), hex('#3AA7E3')];

/* ---------- Sprites ---------- */
const SPR = buildScenery();
let carColor = CAR_COLORS.find((c) => c.id === storeGet('course-car', 'rouge')) || CAR_COLORS[0];
let mode = storeGet('course-mode', 'mul') === 'add' ? 'add' : 'mul';
let carSpr = carSprite(carColor, MODES[mode].symbol);
function refreshCar() {
  carSpr = carSprite(carColor, MODES[mode].symbol);
  stage.style.setProperty('--car', carColor.body);
  stage.classList.toggle('mode-add', mode === 'add');
}

/* ---------- Écran et caméra ---------- */
let W = 1000, H = 625, dpr = 1;
let K = 60;            // pixels par mètre au niveau de la voiture
let HORIZON = 260, FOCAL = 600, CAM_H = 5, CAM_BACK = 10;

function resize() {
  const r = stage.getBoundingClientRect();
  W = Math.max(280, r.width);
  H = Math.max(260, r.height);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (W * H * dpr * dpr > 4.5e6) dpr = Math.max(1, Math.sqrt(4.5e6 / (W * H)));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  const portrait = H > W * 1.05;
  const short = !portrait && H < 520;
  // La route remplit presque l'écran en portrait, un peu plus de paysage en largeur
  K = Math.min(((portrait ? 0.46 : 0.29) * W) / ROAD_HALF, H * 0.16);
  HORIZON = H * (portrait ? 0.43 : short ? 0.47 : 0.42);
  const carY = H * (portrait ? 0.87 : 0.92);
  CAM_BACK = portrait ? 14 : 10;
  CAM_H = (carY - HORIZON) / K;
  FOCAL = K * CAM_BACK;

  const dw = danceCanvas.clientWidth || 150, dh = danceCanvas.clientHeight || 160;
  danceCanvas.width = Math.round(dw * dpr);
  danceCanvas.height = Math.round(dh * dpr);
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------- État de la partie ---------- */
let state = 'menu';    // menu → countdown → playing → finishing → done
let paused = false;
let gameTime = 0, countdownT = 0;
let dist = 0, speed = 0;
let lane = 1, carX = 0, carY = 0, camX = 0, tilt = 0, squash = 0;
let curve = 0, curveTarget = 0, nextCurveChangeAt = 0, nextMenuLane = 0;
let bgOffset = 0, clock = 0;
let points = 0, correctCount = 0, bonusCaught = 0, papisHit = 0;
let bonusActive = false;
let events = [], nextEventIdx = 0, bonuses = [];
let grandpas = [], grandpaPlan = [], nextGrandpaIdx = 0;
let rampPlan = [], nextRampIdx = 0, ramps = [], onRamp = null, jumpV = 0, airborne = false;
let toastHideAt = null;
let roadEnd = Infinity, seaStart = Infinity, decel = 12;
let questionIndex = 0, nextQuestionAt = FIRST_QUESTION_AT;
let currentQuestion = null, usedQuestions = new Set();
let gates = [], finishLine = null, hideCardAt = null;
let results = [];            // pour chaque calcul : true / false
let particles = [], confetti = [], floaters = [];
let flash = null, shake = 0;
let doneAt = null, braking = false;

/* ---------- Calculs ---------- */
function spawnQuestion() {
  const q = makeQuestion(mode, questionIndex, usedQuestions);
  q.s = dist + SPAWN_AHEAD;
  q.resolved = false;
  currentQuestion = q;
  questionIndex += 1;
  gates = q.options.map((value, i) => ({ s: q.s, lane: i, value, correct: value === q.answer, hit: false }));

  qNum.textContent = String(questionIndex);
  qText.innerHTML = `${q.a} ${q.symbol} ${q.b} = <span class="q-mark">?</span>`;
  optionEls.forEach((el, i) => { el.textContent = q.options[i]; });
  qcard.classList.remove('answered', 'good', 'bad');
  qcard.hidden = false;
  // relance l'animation d'apparition
  qcard.style.animation = 'none';
  void qcard.offsetWidth;
  qcard.style.animation = '';
  hideCardAt = null;
  sfx.tap();
}

const currentLane = () => clamp(Math.round(carX / LANE_W) + 1, 0, 2);

function resolveQuestion() {
  const q = currentQuestion;
  q.resolved = true;
  const gate = gates[currentLane()];
  gate.hit = true;
  const gain = bonusActive ? 2 : 1;
  const gx = (gate.lane - 1) * LANE_W;

  qText.textContent = `${q.a} ${q.symbol} ${q.b} = ${q.answer}`;
  qcard.classList.add('answered');
  results.push(gate.correct);
  tripTicks.children[questionIndex - 1]?.classList.add(gate.correct ? 'ok' : 'ko');
  if (gate.correct) {
    points += gain;
    correctCount += 1;
    qcard.classList.add('good');
    qFeedback.textContent = gain === 2 ? 'Bravo ! Bonus ×2 : +2 points' : 'Bravo ! +1 point';
    paperBurst(gx, gate.s, ['#22C97A', '#FFE27A', '#FFFFFF', LANE_COLORS[gate.lane]], 70);
    screenBurst('star', gain === 2 ? 26 : 16);
    floatText(gain === 2 ? '+2' : '+1', '#FFE27A');
    flash = { color: '34, 201, 122', life: 1 };
    pointsPill.classList.remove('bump', 'drop');
    void pointsPill.offsetWidth;
    pointsPill.classList.add('bump');
    sfx.good();
  } else {
    qcard.classList.add('bad');
    qFeedback.textContent = `Oups ! C'était ${q.answer}${bonusActive ? ' (bonus ×2 perdu)' : ''}`;
    paperBurst(gx, gate.s, ['#B9B5C9', '#8F8AA8', LANE_COLORS[gate.lane]], 40);
    flash = { color: '255, 77, 94', life: 1 };
    shake = 0.5;
    sfx.bad();
  }
  bonusActive = false;
  hideCardAt = gameTime + 3.2;
}

/* ---------- Bonus ×2, papis et tremplins ---------- */
function planEvents() {
  // 2 ou 3 bonus, répartis au hasard entre les 9 calculs
  const list = Array(randInt(2, 3)).fill('bonus');
  while (list.length < TOTAL_QUESTIONS - 1) list.push(null);
  return shuffle(list);
}

function planGrandpas() {
  const times = [];
  for (let k = 0; k < TOTAL_QUESTIONS - 1; k++) {
    shuffle(GRANDPA_SLOTS).slice(0, grandpaCountForGap(k)).forEach((slot) => {
      times.push(FIRST_QUESTION_AT + k * QUESTION_EVERY + slot);
    });
  }
  return times.sort((a, b) => a - b);
}

const eventSpawnTime = (k) => FIRST_QUESTION_AT + k * QUESTION_EVERY + EVENT_DELAY;

function spawnGrandpa() {
  // Le papi marche à vitesse constante et sera pile au milieu d'une voie quand la voiture arrive
  const l = randInt(0, 2);
  const dir = Math.random() < 0.5 ? 1 : -1;
  const targetX = (l - 1) * LANE_W;
  grandpas.push({
    s: dist + SPAWN_AHEAD,
    startX: targetX - dir * GRANDPA_WALK * ANSWER_DELAY,
    dir,
    spawnT: gameTime,
    resolved: false,
    hit: false,
    hitAt: 0,
    fleeDir: 1,
  });
}

const grandpaX = (g) => g.startX + g.dir * GRANDPA_WALK * (Math.min(gameTime, g.hit ? g.hitGameT : gameTime) - g.spawnT);

function showToast(text, kind) {
  toastEl.textContent = text;
  toastEl.className = `toast ${kind}`;
  toastEl.hidden = false;
  toastEl.style.animation = 'none';
  void toastEl.offsetWidth;
  toastEl.style.animation = '';
  toastHideAt = clock + 2.2;
}

function resolveEvents() {
  bonuses.forEach((b) => {
    if (b.resolved || b.s - dist > HIT_Z) return;
    b.resolved = true;
    if (currentLane() === b.lane) {
      b.hit = true;
      bonusActive = true;
      bonusCaught += 1;
      showToast('Bonus ×2 ! La prochaine bonne réponse vaut 2 points', 'good');
      screenBurst('spark', 26);
      flash = { color: '255, 194, 26', life: 1 };
      sfx.bonus();
    }
  });
  grandpas.forEach((g) => {
    if (g.resolved || g.s - dist > HIT_Z) return;
    g.resolved = true;
    const gx = grandpaX(g);
    if (Math.abs(gx - carX) < 1.5 && carY < 1.1) {
      g.hit = true;
      g.hitAt = clock;
      g.hitGameT = gameTime;
      g.fleeDir = gx >= carX ? 1 : -1;
      papisHit += 1;
      const lost = points > 0;
      points = Math.max(0, points - 1);
      showToast('Attention à Papi ! −1 point', 'bad');
      if (lost) floatText('−1', '#FF7A88');
      flash = { color: '255, 77, 94', life: 1 };
      shake = 0.7;
      pointsPill.classList.remove('bump', 'drop');
      void pointsPill.offsetWidth;
      pointsPill.classList.add('drop');
      sfx.honk();
    }
  });
}

/* ---------- Déroulement ---------- */
function resetRace() {
  gameTime = 0;
  countdownT = 0;
  dist = 0;
  speed = 0;
  lane = 1;
  carX = 0;
  carY = 0;
  camX = 0;
  tilt = 0;
  curve = 0;
  curveTarget = 0;
  nextCurveChangeAt = 4;
  points = 0;
  correctCount = 0;
  bonusCaught = 0;
  papisHit = 0;
  bonusActive = false;
  events = planEvents();
  nextEventIdx = 0;
  rampPlan = shuffle([true, true, true, ...Array(TOTAL_QUESTIONS - 1 - 3).fill(false)]);
  if (Math.random() < 0.5) rampPlan[rampPlan.indexOf(false)] = true; // 3 ou 4 tremplins
  nextRampIdx = 0;
  ramps = [];
  onRamp = null;
  jumpV = 0;
  airborne = false;
  bonuses = [];
  grandpas = [];
  grandpaPlan = planGrandpas();
  nextGrandpaIdx = 0;
  toastHideAt = null;
  toastEl.hidden = true;
  roadEnd = Infinity;
  seaStart = Infinity;
  decel = 12;
  questionIndex = 0;
  nextQuestionAt = FIRST_QUESTION_AT;
  currentQuestion = null;
  usedQuestions = new Set();
  gates = [];
  finishLine = null;
  hideCardAt = null;
  results = [];
  particles = [];
  confetti = [];
  floaters = [];
  flash = null;
  shake = 0;
  doneAt = null;
  braking = false;
  qcard.hidden = true;
  [...tripTicks.children].forEach((t) => t.classList.remove('ok', 'ko'));
}

function showOnly(screen) {
  [menuScreen, helpScreen, boardScreen, pauseScreen, endScreen].forEach((s) => { s.hidden = s !== screen; });
}

function startRace(newMode = mode) {
  unlockAudio();
  if (newMode !== mode) {
    mode = newMode;
    storeSet('course-mode', mode);
    refreshCar();
  }
  resetRace();
  countdownT = -0.001;   // pour que le premier feu s'allume tout de suite
  paused = false;
  state = 'countdown';
  showOnly(null);
  hud.hidden = false;
  touchControls.hidden = !isTouch;
  countdownEl.hidden = false;
  lights.forEach((l) => l.classList.remove('on'));
  countdownEl.querySelector('.lights').classList.remove('go');
  countdownNum.textContent = '';
  if (document.activeElement) document.activeElement.blur();
  engineStart();
}

function goToMenu() {
  state = 'menu';
  paused = false;
  hud.hidden = true;
  touchControls.hidden = true;
  countdownEl.hidden = true;
  showOnly(menuScreen);
  resetRace();
  dist = 0;
  engineStop();
  updateBestBadges();
}

function setPaused(on) {
  if (on === paused || !['countdown', 'playing', 'finishing'].includes(state)) return;
  paused = on;
  pauseScreen.hidden = !on;
  if (on) engineStop();
  else engineStart();
}

function updateCountdown(dt) {
  const before = countdownT;
  countdownT += dt;
  for (let k = 0; k < COUNTDOWN; k++) {
    if (before < k && countdownT >= k) {
      lights[k].classList.add('on');
      countdownNum.textContent = String(COUNTDOWN - k);
      countdownNum.className = 'countdown-num pop';
      sfx.beep();
    }
  }
  if (countdownT >= COUNTDOWN) {
    countdownEl.querySelector('.lights').classList.add('go');
    countdownNum.textContent = 'Partez !';
    countdownNum.className = 'countdown-num go pop';
    sfx.go();
    state = 'playing';
    setTimeout(() => { if (state !== 'countdown') countdownEl.hidden = true; }, 900);
  }
  engineSpeed(0.1 + Math.abs(Math.sin(countdownT * 3)) * 0.15);
}

function endGame() {
  state = 'done';
  engineStop();
  hud.hidden = true;
  touchControls.hidden = true;
  showOnly(endScreen);
  endScreen.scrollTop = 0;

  const plural = (n) => (n > 1 ? 's' : '');
  const stars = correctCount >= TOTAL_QUESTIONS ? 3 : correctCount >= 6 ? 2 : correctCount >= 3 ? 1 : 0;
  [...$('endStars').children].forEach((s, i) => s.classList.toggle('on', i < stars));
  $('endPoints').textContent = String(points);
  $('endPointsLabel').textContent = `point${plural(points)}`;
  $('statGood').textContent = `${correctCount}/${TOTAL_QUESTIONS}`;
  $('statBonus').textContent = String(bonusCaught);
  $('statPapi').textContent = String(papisHit);
  const word = mode === 'add' ? 'des additions' : 'des multiplications';
  let cheer = 'Continue de t’entraîner, tu vas y arriver !';
  if (correctCount === TOTAL_QUESTIONS) cheer = `Un sans-faute, champion ${word} !`;
  else if (correctCount >= TOTAL_QUESTIONS - 2) cheer = 'Superbe course, bravo !';
  else if (correctCount >= TOTAL_QUESTIONS / 2) cheer = 'Belle course, bien joué !';
  $('endCheer').textContent = cheer;

  const bestKey = `course-best-${mode}`;
  const best = Number(storeGet(bestKey, '-1'));
  const record = points > best && points > 0;
  if (points > best) storeSet(bestKey, String(points));
  $('endRecord').hidden = !record;

  scoreForm.hidden = false;
  scoreMsg.hidden = true;
  pseudoInput.value = storeGet('course-pseudo', '');
  $('endBoardTitle').textContent = `Top 10 ${MODES[mode].name.toLowerCase()}`;
  renderBoard($('endBoardList'), mode, 10);
  sfx.win();
}

function steer(dir) {
  if (state !== 'playing' || paused) return;
  const next = clamp(lane + dir, 0, 2);
  if (next !== lane) {
    lane = next;
    sfx.lane();
  }
}

/* ---------- Mise à jour ---------- */
function update(dt) {
  if (paused) return;
  clock += dt;

  if (state === 'menu') {
    speed += (MENU_SPEED - speed) * Math.min(1, dt * 1.5);
    if (clock >= nextMenuLane) {
      lane = randInt(0, 2);
      nextMenuLane = clock + 2.5 + Math.random() * 3;
    }
  } else if (state === 'countdown') {
    speed = 0;
    updateCountdown(dt);
  } else if (state === 'playing') {
    gameTime += dt;
    speed = Math.min(SPEED, speed + 24 * dt);
  } else if (state === 'finishing' || state === 'done') {
    speed = Math.max(0, speed - decel * dt);
    braking = speed > 0;
    if (speed === 0 && state === 'finishing') {
      if (doneAt === null) doneAt = clock + DANCE_TIME; // le temps d'admirer la plage et la danse
      else if (clock >= doneAt) endGame();
    }
  }
  dist += speed * dt;

  if (state === 'playing') updateRace();

  // Virages doux (tout droit pour l'arrivée)
  if (finishLine || state === 'countdown') {
    curveTarget = 0;
  } else if ((state === 'playing' ? gameTime : clock) >= nextCurveChangeAt) {
    curveTarget = [-0.0008, -0.0004, 0, 0, 0.0004, 0.0008][randInt(0, 5)];
    nextCurveChangeAt = (state === 'playing' ? gameTime : clock) + 5 + Math.random() * 4;
  }
  curve += (curveTarget - curve) * Math.min(1, dt * 0.6);
  bgOffset += curve * speed * dt * 900;

  updateCarPhysics(dt);
  updateEffects(dt);

  if (toastHideAt !== null && clock >= toastHideAt) {
    toastEl.hidden = true;
    toastHideAt = null;
  }
  if (engineRunning()) engineSpeed(speed / SPEED);
}
const engineRunning = () => ['countdown', 'playing', 'finishing'].includes(state);

function updateRace() {
  if (questionIndex < TOTAL_QUESTIONS && gameTime >= nextQuestionAt) {
    spawnQuestion();
    nextQuestionAt += QUESTION_EVERY;
  }
  if (nextRampIdx < rampPlan.length && gameTime >= FIRST_QUESTION_AT + nextRampIdx * QUESTION_EVERY + RAMP_DELAY) {
    if (rampPlan[nextRampIdx]) ramps.push({ s: dist + SPAWN_AHEAD, lane: randInt(0, 2), used: false });
    nextRampIdx += 1;
  }
  // On monte sur le tremplin si on est dans sa voie en arrivant dessus
  ramps.forEach((r) => {
    if (r.used || r.s - dist > 0) return;
    r.used = true;
    if (currentLane() === r.lane && !airborne) onRamp = r;
  });
  while (nextGrandpaIdx < grandpaPlan.length && gameTime >= grandpaPlan[nextGrandpaIdx]) {
    spawnGrandpa();
    nextGrandpaIdx += 1;
  }
  if (nextEventIdx < events.length && gameTime >= eventSpawnTime(nextEventIdx)) {
    if (events[nextEventIdx] === 'bonus') bonuses.push({ s: dist + SPAWN_AHEAD, lane: randInt(0, 2), resolved: false, hit: false });
    nextEventIdx += 1;
  }
  if (currentQuestion && !currentQuestion.resolved && currentQuestion.s - dist <= HIT_Z) {
    resolveQuestion();
  }
  resolveEvents();
  if (hideCardAt !== null && gameTime >= hideCardAt) {
    qcard.hidden = true;
    hideCardAt = null;
  }
  // L'arche d'arrivée apparaît au loin pour être franchie pile à 3:00 ; après elle, la plage
  if (!finishLine && gameTime >= GAME_DURATION - ANSWER_DELAY) {
    finishLine = { s: dist + SPEED * (GAME_DURATION - gameTime) };
    roadEnd = Math.ceil((finishLine.s + ROAD_AFTER_FINISH) / SEG_L) * SEG_L;
    seaStart = roadEnd + BEACH_LEN;
  }
  if (finishLine && dist >= finishLine.s) {
    state = 'finishing';
    qcard.hidden = true;
    lane = 1;
    // freinage calculé pour s'arrêter juste après la fin de la route, sur le sable
    decel = (speed * speed) / (2 * Math.max(1, roadEnd + STOP_ON_SAND - dist));
    paperBurst(0, finishLine.s, ['#FF4D8B', '#3D9BFF', '#FFC21A', '#22C97A', '#FFFFFF'], 120);
    screenBurst('star', 24);
    showToast('Arrivée ! Direction la plage !', 'fun');
    sfx.finish();
  }
}

function updateCarPhysics(dt) {
  const targetX = (lane - 1) * LANE_W;
  const prevX = carX;
  carX += (targetX - carX) * Math.min(1, dt * 8);
  tilt += (clamp((carX - prevX) / Math.max(dt, 1e-3) * 0.012, -0.13, 0.13) - tilt) * Math.min(1, dt * 10);

  // Sur le tremplin : la voiture monte la pente puis décolle au bout
  if (onRamp) {
    const along = dist - onRamp.s;
    if (Math.abs(carX - (onRamp.lane - 1) * LANE_W) > RAMP_HALF_W + 0.3) {
      onRamp = null;             // on a quitté la pente par le côté
      airborne = carY > 0;
      jumpV = 0;
    } else if (along >= RAMP_LEN) {
      onRamp = null;
      airborne = true;
      jumpV = JUMP_SPEED;
      squash = -0.12;
      showToast('Youpiii !', 'fun');
      screenBurst('spark', 12);
      sfx.jump();
    } else {
      carY = (clamp(along, 0, RAMP_LEN) / RAMP_LEN) * RAMP_H;
    }
  }
  if (airborne) {
    jumpV -= GRAVITY * dt;
    carY += jumpV * dt;
    if (carY <= 0) {
      carY = 0;
      jumpV = 0;
      airborne = false;
      squash = 0.16;
      shake = Math.max(shake, 0.35);
      dustPuff(carX, 10);
      sfx.land();
    }
  }
  squash *= Math.pow(0.0005, dt);

  // La caméra suit la voiture avec un peu de retard (et regarde le petit garçon à l'arrivée)
  const camTarget = carX * 0.7 + (state === 'finishing' || state === 'done' ? 1.1 : 0);
  camX += (camTarget - camX) * Math.min(1, dt * 3);

  // Petits nuages de fumée du pot d'échappement
  if (state === 'playing' && speed > 1 && speed < SPEED && Math.random() < dt * 30) {
    confetti.push({
      puff: true, x: carX + 0.65 + (Math.random() - 0.5) * 0.2, y: carY + 0.25, s: dist - 0.3,
      vx: (Math.random() - 0.5) * 0.6, vy: 0.4, vs: speed * 0.82, r: 0.18, life: 0.7, max: 0.7,
    });
  }
}

function updateEffects(dt) {
  particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.g * dt;
    p.rot += p.vr * dt;
    p.life -= dt;
  });
  particles = particles.filter((p) => p.life > 0);

  confetti.forEach((c) => {
    c.life -= dt;
    c.x += c.vx * dt;
    c.s += c.vs * dt;
    if (c.puff) {
      c.y += c.vy * dt;
      c.r += dt * 0.9;
      return;
    }
    c.vy -= 9.8 * dt * 0.55;
    c.y += c.vy * dt;
    c.vx *= Math.pow(0.6, dt);
    c.vs *= Math.pow(0.6, dt);
    c.rot += c.vr * dt;
    if (c.y < 0) { c.y = 0; c.vy *= -0.25; c.vx *= 0.5; c.vs *= 0.5; c.vr *= 0.5; }
  });
  confetti = confetti.filter((c) => c.life > 0 && c.s - dist + CAM_BACK > NEAR_ZC);

  floaters.forEach((f) => { f.y -= 70 * dt; f.life -= dt; });
  floaters = floaters.filter((f) => f.life > 0);

  if (flash) {
    flash.life -= dt * 2.2;
    if (flash.life <= 0) flash = null;
  }
  shake = Math.max(0, shake - dt * 2);
}

/* ---------- Effets ---------- */
// Le panneau traversé s'envole en confettis de papier (dans le monde 3D)
function paperBurst(x, s, colors, count) {
  for (let i = 0; i < count; i++) {
    confetti.push({
      x: x + (Math.random() - 0.5) * GATE_W,
      y: GATE_BOTTOM + Math.random() * (GATE_TOP - GATE_BOTTOM),
      s,
      vx: (Math.random() - 0.5) * 9,
      vy: 2 + Math.random() * 6,
      vs: speed * (0.85 + Math.random() * 0.35),   // ils restent autour de la voiture
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 16,
      w: 0.12 + Math.random() * 0.14,
      h: 0.08 + Math.random() * 0.1,
      color: colors[i % colors.length],
      life: 1.4 + Math.random() * 0.8,
    });
  }
}

function dustPuff(x, count) {
  for (let i = 0; i < count; i++) {
    confetti.push({
      puff: true, x: x + (Math.random() - 0.5) * CAR_W, y: 0.1, s: dist + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 3, vy: 0.6 + Math.random(), vs: speed * 0.85, r: 0.25, life: 0.6, max: 0.6,
    });
  }
}

// Étoiles et étincelles qui jaillissent de la voiture (à l'écran)
const STAR_COLORS = ['#FFE27A', '#FFC21A', '#FFFFFF', '#7BE0FF', '#FF9AC1'];
function screenBurst(kind, count) {
  const p = proj(carX, carY + CAR_H * 0.6, 0);
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const v = (0.6 + Math.random() * 0.9) * Math.min(W, H) * 0.9;
    particles.push({
      kind,
      x: p.x + (Math.random() - 0.5) * K,
      y: p.y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      g: Math.min(W, H) * 1.6,
      life: 0.8 + Math.random() * 0.6,
      size: (0.22 + Math.random() * 0.25) * K,
      color: STAR_COLORS[i % STAR_COLORS.length],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 8,
    });
  }
}

function floatText(text, color) {
  const p = proj(carX, carY + CAR_H, 0);
  floaters.push({ text, color, x: p.x, y: p.y - K * 0.4, life: 1.2 });
}

/* ======================= Dessin ======================= */
let horizonY = HORIZON, camY = CAM_H, tripP = 0;

function proj(x, y, z) {
  const zc = Math.max(0.3, z + CAM_BACK);
  const sc = FOCAL / zc;
  return {
    x: W / 2 + (x + curve * z * z - camX) * sc,
    y: horizonY + (camY - y) * sc,
    sc,
  };
}

const fogAlpha = (z) => clamp((DRAW_DIST - z) / 70, 0, 1);

function drawSky(skyCols, zf) {
  const [top, midC, bottom] = skyCols;
  const g = ctx.createLinearGradient(0, 0, 0, horizonY);
  g.addColorStop(0, rgb(top));
  g.addColorStop(0.55, rgb(midC));
  g.addColorStop(1, rgb(bottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, horizonY + 2);

  // Le soleil descend vers l'horizon au fil de la course
  const m = Math.min(W, H);
  const sunR = m * lerp(0.05, 0.075, tripP);
  const sunX = W * 0.7 + Math.sin(bgOffset * 0.0005) * W * 0.12;
  const sunY = lerp(horizonY * 0.3, horizonY - sunR * 0.35, smooth(clamp((tripP - 0.2) / 0.8, 0, 1)));
  const sunCol = mix(hex('#FFF6C2'), hex('#FFB067'), smooth(tripP));
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.6, sunX, sunY, sunR * 4.5);
  halo.addColorStop(0, rgb(sunCol, 0.55));
  halo.addColorStop(1, rgb(sunCol, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - sunR * 5, sunY - sunR * 5, sunR * 10, sunR * 10);
  ctx.fillStyle = rgb(sunCol);
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(sunX - sunR * 0.3, sunY - sunR * 0.3, sunR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Montgolfières (à la campagne et dans les montagnes)
  const balloonAlpha = 1 - smooth(clamp((tripP - 0.5) / 0.25, 0, 1));
  if (balloonAlpha > 0) {
    ctx.globalAlpha = balloonAlpha;
    [[0.15, 0.2, SPR.balloonA, 1], [0.55, 0.12, SPR.balloonB, 0.7], [0.88, 0.28, SPR.balloonC, 0.85]].forEach(([bx, by, spr, sz], i) => {
      const span = W + 200;
      const x = (((bx * W - bgOffset * 0.12 * (W / 1000) + clock * (3 + i)) % span) + span) % span - 100;
      const y = horizonY * by + Math.sin(clock * 0.6 + i * 2) * 6 + horizonY * 0.18;
      spr.draw(ctx, x, y, m * 0.11 * sz, dpr);
    });
    ctx.globalAlpha = 1;
  }

  // Nuages
  [[0.08, 0.12, 0.24, 2], [0.38, 0.06, 0.18, 4], [0.62, 0.2, 0.28, 3], [0.9, 0.1, 0.2, 5], [1.15, 0.26, 0.16, 6]].forEach(([cx, cy, cw, sp], i) => {
    const span = W * 1.5;
    const w = W * cw * (W < H ? 1.6 : 1);
    const x = (((cx * W - bgOffset * 0.15 * (W / 1000) + clock * sp) % span) + span) % span - W * 0.25;
    ctx.globalAlpha = 0.92 - i * 0.05;
    SPR.cloud.draw(ctx, x, horizonY * (cy + 0.12) + w * 0.47 * 0.5, (w * 150) / 320, dpr);
  });
  ctx.globalAlpha = 1;

  // Montagnes et collines (elles s'effacent quand on approche de la mer)
  const near = clamp((seaStart - dist - 80) / 250, 0, 1);
  if (near > 0) {
    ctx.globalAlpha = near;
    const haze = bottom;
    const amp = zoneValue('mountAmp', zf);
    const snow = clamp(1 - Math.abs(zf - 1) * 1.6, 0, 1);
    drawRidge(bgOffset * 0.2, rgb(mix(zoneColor('mount', zf), haze, 0.35)), H * 0.15 * amp, 0.0055, true, snow);
    drawRidge(bgOffset * 0.35 + 300, rgb(mix(zoneColor('hillFar', zf), haze, 0.25)), H * 0.075, 0.009, false, 0);
    drawRidge(bgOffset * 0.55 + 900, rgb(zoneColor('hillNear', zf)), H * 0.04, 0.016, false, 0);
    ctx.globalAlpha = 1;
  }
}

function drawRidge(off, color, amp, freq, peaky, snow) {
  const step = Math.max(5, W / 140);
  const scale = 1000 / W;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 2);
  for (let x = 0; x <= W + step; x += step) {
    const u = x * scale + off;
    const h = peaky
      ? amp * (0.3 + 0.7 * Math.pow(1 - Math.abs(Math.sin(u * freq)), 1.7) + 0.12 * Math.sin(u * freq * 3.3 + 2))
      : amp * (0.6 + 0.3 * Math.sin(u * freq) + 0.2 * Math.sin(u * freq * 2.7 + 1.3));
    ctx.lineTo(x, horizonY - h);
  }
  ctx.lineTo(W, horizonY + 2);
  ctx.closePath();
  ctx.fill();
  if (snow > 0) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = `rgba(250, 252, 255, ${0.95 * snow})`;
    ctx.fillRect(0, 0, W, horizonY - amp * 0.74);
    ctx.restore();
  }
}

// Trapèze de route entre deux bords projetés a (près) et b (loin)
function band(a, b, cx, hw, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x + (cx - hw) * a.sc, a.y);
  ctx.lineTo(a.x + (cx + hw) * a.sc, a.y);
  ctx.lineTo(b.x + (cx + hw) * b.sc, b.y - 0.6);   // léger chevauchement : pas de jointure visible
  ctx.lineTo(b.x + (cx - hw) * b.sc, b.y - 0.6);
  ctx.closePath();
  ctx.fill();
}

function drawRoad(sunX) {
  const seaVisible = seaStart - dist < DRAW_DIST;
  ctx.fillStyle = seaVisible ? rgb(SEA[0]) : rgb(zoneColor('grassB', zoneAt(dist + DRAW_DIST)));
  ctx.fillRect(0, horizonY, W, H - horizonY + 1);

  const zStart = -CAM_BACK + NEAR_ZC;
  const first = Math.floor((dist + zStart) / SEG_L);
  const last = Math.ceil((dist + DRAW_DIST) / SEG_L);
  const wave = Math.floor(clock * 1.5);
  let seaNearY = null;
  for (let idx = last; idx >= first; idx--) {
    const s = idx * SEG_L;
    let zn = s - dist;
    const zf = zn + SEG_L;
    if (zf <= zStart) continue;
    if (zn < zStart) zn = zStart;
    const a = proj(0, 0, zn);
    const b = proj(0, 0, zf);
    if (b.y > H) continue;
    // arrondi vers le bas de l'écran : l'herbe d'un tronçon ne déborde pas sur la route du suivant
    const top = Math.ceil(b.y);
    const hgt = Math.ceil(a.y) - top + 1;
    const even = ((idx % 2) + 2) % 2 === 0;

    if (s >= seaStart) {
      // La mer, avec des vagues qui avancent et de l'écume sur le bord
      ctx.fillStyle = s === seaStart ? '#EAF8FF' : rgb(SEA[(idx + wave) % 2 === 0 ? 0 : 1]);
      ctx.fillRect(0, top, W, hgt);
      seaNearY = a.y;
      continue;
    }
    if (s >= roadEnd) {
      // La plage : plus de route
      ctx.fillStyle = s >= seaStart - SEG_L ? '#E5C886' : even ? '#F7E0A6' : '#F2D998';
      ctx.fillRect(0, top, W, hgt);
      continue;
    }

    const zfz = zoneAt(s);
    ctx.fillStyle = rgb(zoneColor(even ? 'grassA' : 'grassB', zfz));
    ctx.fillRect(0, top, W, hgt);
    const sh = zoneColor('shoulder', zfz);
    band(a, b, 0, ROAD_HALF + CURB_W + SHOULDER_W, rgb(even ? sh : mix(sh, [0, 0, 0], 0.04)));
    band(a, b, 0, ROAD_HALF + CURB_W, even ? '#FF5D73' : '#FFFFFF');
    band(a, b, 0, ROAD_HALF, even ? '#5F6280' : '#595C79');
    band(a, b, -(ROAD_HALF - 0.32), 0.09, '#EEF0F7');
    band(a, b, ROAD_HALF - 0.32, 0.09, '#EEF0F7');
    if (even) {
      band(a, b, -LANE_W / 2, 0.1, '#FFFFFF');
      band(a, b, LANE_W / 2, 0.1, '#FFFFFF');
    }
  }

  // Le reflet du soleil sur la mer
  if (seaVisible) {
    const bottomY = Math.min(H, seaNearY ?? H);
    ctx.fillStyle = 'rgba(255, 228, 160, 0.55)';
    for (let i = 0; i < 22; i++) {
      const t = i / 22;
      const y = horizonY + (bottomY - horizonY) * Math.pow(t, 1.6);
      if (y > bottomY - 2) break;
      const w = (8 + 70 * t) * (0.6 + 0.4 * Math.sin(clock * 3 + i * 1.7)) * (W / 1000 + 0.4);
      ctx.fillRect(sunX - w / 2 + Math.sin(clock * 2 + i) * 4, y, w, 1.5 + t * 4);
    }
  }
}

function drawCheckerLine(s, depth) {
  const z0 = s - dist;
  if (z0 + depth < -CAM_BACK + NEAR_ZC || z0 > DRAW_DIST) return;
  const cols = 12, rows = 2;
  for (let r = 0; r < rows; r++) {
    const za = Math.max(z0 + (r * depth) / rows, -CAM_BACK + NEAR_ZC);
    const zb = z0 + ((r + 1) * depth) / rows;
    if (zb <= za) continue;
    const a = proj(0, 0, za), b = proj(0, 0, zb);
    for (let c = 0; c < cols; c++) {
      const x0 = -ROAD_HALF + (c * 2 * ROAD_HALF) / cols, x1 = x0 + (2 * ROAD_HALF) / cols;
      ctx.fillStyle = (r + c) % 2 ? '#2E2A4D' : '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(a.x + x0 * a.sc, a.y);
      ctx.lineTo(a.x + x1 * a.sc, a.y);
      ctx.lineTo(b.x + x1 * b.sc, b.y);
      ctx.lineTo(b.x + x0 * b.sc, b.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawHaze(bottom) {
  const g = ctx.createLinearGradient(0, horizonY - H * 0.07, 0, horizonY + H * 0.05);
  g.addColorStop(0, rgb(bottom, 0));
  g.addColorStop(0.6, rgb(bottom, 0.55));
  g.addColorStop(1, rgb(bottom, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, horizonY - H * 0.07, W, H * 0.12);
}

/* ---------- Décors au bord de la route ---------- */
const SPACING = 11;
const LIGHTHOUSE_S = Math.round(ROUTE_LEN * 0.8 / SPACING) * SPACING;

function placeScenery(items, idx, side, s, z) {
  const seed = idx * 2 + (side > 0 ? 1 : 0);
  const r1 = hash(seed), r2 = hash(seed + 101.3), r3 = hash(seed * 1.7 + 57.1), r4 = hash(seed + 7.7);
  const zone = clamp(Math.round(zoneAt(s) + (hash(seed * 3.1) - 0.5) * 0.7), 0, 2);
  const edge = ROAD_HALF + CURB_W + SHOULDER_W;
  const add = (spr, x, h, extra) => items.push({ kind: 'sprite', z, x: side * x, h, spr, ...extra });

  if (s === LIGHTHOUSE_S && side < 0 && state !== 'menu') { add(SPR.lighthouse, 24, 20); return; }

  if (zone === 0) {
    if (r1 < 0.3) add(SPR.tulips, edge + 0.8 + r4 * 1.5, 0.8);
    else if (r1 < 0.55) add(r4 < 0.5 ? SPR.bushPink : SPR.bushYellow, edge + 1.2 + r4 * 1.5, 1.3);
    if (r2 < 0.5) {
      const tree = r3 < 0.5 ? SPR.treeGreen : r3 < 0.72 ? SPR.treeLight : r3 < 0.88 ? SPR.treeBlossom : SPR.treeAutumn;
      add(tree, 9.5 + r2 * 8, 6 + r4 * 1.5);
    } else if (r2 < 0.64) {
      add([SPR.houseRed, SPR.houseBlue, SPR.houseOrange][Math.floor(r4 * 3)], 15 + r2 * 6, 6.5);
    }
    if (r3 < 0.05) add(SPR.windmill, 26 + r4 * 18, 13, { windmill: true });
    else if (r3 < 0.45) add(r4 < 0.6 ? SPR.treeGreen : SPR.treeLight, 26 + r3 * 30, 8);
  } else if (zone === 1) {
    if (r1 < 0.2) add(SPR.rockMoss, edge + 1 + r4 * 2, 1.3);
    else if (r1 < 0.32) add(SPR.mushroom, edge + 1 + r4 * 1.5, 1.4);
    else if (r1 < 0.45) add(SPR.bush, edge + 1.2 + r4, 1.2);
    if (r2 < 0.75) add(r3 < 0.35 ? SPR.pineSnow : SPR.pine, 9 + r2 * 8, 8 + r4 * 3);
    else add(SPR.treeForest, 10 + r2 * 6, 7);
    if (r3 < 0.8) add(r4 < 0.4 ? SPR.pineSnow : SPR.pine, 20 + r3 * 25, 11);
  } else {
    if (r1 < 0.2) add(SPR.rock, edge + 1 + r4 * 2, 1);
    else if (r1 < 0.45) add(SPR.bushYellow, edge + 1.2 + r4, 1.1);
    if (r2 < 0.55) add(SPR.palm, 9 + r2 * 6, 7.5 + r4 * 1.5);
    else if (r2 < 0.64) add(r4 < 0.5 ? SPR.houseBlue : SPR.houseOrange, 16 + r2 * 4, 6);
    if (r3 < 0.3) add(SPR.palm, 22 + r3 * 30, 9);
  }
}

// ds = distance après la fin de la route (la mer commence à BEACH_LEN)
const BEACH_DECOR = [
  { ds: 8, x: 13, h: 7, spr: 'palm' },
  { ds: 11, x: -9, h: 6.5, spr: 'palm' },
  { ds: 14, x: 7.5, h: 2.4, spr: 'parasolRed' },
  { ds: 18, x: -5.5, h: 2.4, spr: 'parasolBlue' },
  { ds: 22, x: 4, h: 1.3, spr: 'castle' },
  { ds: 22, x: 16, h: 7.5, spr: 'palm' },
  { ds: 26, x: -15, h: 8, spr: 'palm' },
  { ds: BEACH_LEN + 60, x: -22, h: 9, spr: 'boat', boat: true },
  { ds: BEACH_LEN + 150, x: 34, h: 10, spr: 'boat', boat: true },
  { ds: BEACH_LEN + 260, x: 70, h: 18, spr: 'island' },
  { ds: BEACH_LEN + 300, x: -95, h: 13, spr: 'island' },
];

function collectObjects() {
  const items = [];
  const zMin = -CAM_BACK + NEAR_ZC;
  const first = Math.floor((dist + zMin) / SPACING) + 1;
  const last = Math.floor((dist + DRAW_DIST) / SPACING);
  for (let idx = first; idx <= last; idx++) {
    const s = idx * SPACING;
    if (s > roadEnd - 8) break;
    const z = s - dist;
    placeScenery(items, idx, -1, s, z);
    placeScenery(items, idx, 1, s, z);
  }

  if (roadEnd !== Infinity) {
    BEACH_DECOR.forEach((d) => {
      const z = roadEnd + d.ds - dist;
      if (z < zMin || z > DRAW_DIST) return;
      items.push({ kind: 'sprite', z, x: d.x, h: d.h, spr: SPR[d.spr], y: d.boat ? -0.4 + Math.sin(clock * 1.6 + d.ds) * 0.25 : 0 });
    });
    const zb = roadEnd + STOP_ON_SAND + BOY_AHEAD - dist;
    if (zb >= zMin && zb <= DRAW_DIST) items.push({ kind: 'boy', z: zb });
  }

  gates.forEach((g) => {
    const z = g.s - dist;
    if (g.hit || z < zMin || z > DRAW_DIST) return;
    items.push({ kind: 'gate', z, gate: g });
  });
  ramps.forEach((r) => {
    const z = r.s - dist;
    if (z + RAMP_LEN < zMin || z > DRAW_DIST) return;
    items.push({ kind: 'ramp', z: z + RAMP_LEN, ramp: r });   // trié par son bout le plus loin
  });
  bonuses.forEach((b) => {
    const z = b.s - dist;
    if (b.hit || z < zMin || z > DRAW_DIST) return;
    items.push({ kind: 'bonus', z, bonus: b });
  });
  grandpas.forEach((g) => {
    const z = g.s - dist;
    if (z < zMin || z > DRAW_DIST) return;
    items.push({ kind: 'grandpa', z, grandpa: g });
  });
  if (finishLine) {
    const z = finishLine.s - dist;
    if (z >= zMin && z <= DRAW_DIST) items.push({ kind: 'finish', z });
  }
  items.push({ kind: 'car', z: 0 });
  items.sort((p, q) => q.z - p.z);
  return items;
}

function drawSpriteItem(item) {
  const p = proj(item.x, item.y || 0, item.z);
  const hPx = item.h * p.sc;
  if (hPx < 3) return;
  const wPx = hPx * item.spr.aspect;
  if (p.x + wPx / 2 < 0 || p.x - wPx / 2 > W || p.y - hPx > H) return;
  ctx.globalAlpha = fogAlpha(item.z);
  item.spr.draw(ctx, p.x, p.y + hPx * 0.01, hPx, dpr);
  if (item.windmill) drawWindmillBlades(ctx, p.x, p.y - hPx * (1 - 92 / 300), hPx * 0.42, clock * 0.8 + item.x);
  ctx.globalAlpha = 1;
}

function shadow(x, y, rx, ry, alpha = 0.22) {
  ctx.fillStyle = `rgba(27, 24, 70, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGate(g, z) {
  const x = (g.lane - 1) * LANE_W;
  const gnd = proj(x, 0, z);
  const sc = gnd.sc;
  const w = GATE_W * sc;
  if (w < 3) return;
  const top = proj(x, GATE_TOP, z).y;
  const bot = proj(x, GATE_BOTTOM, z).y;
  const left = gnd.x - w / 2;
  ctx.globalAlpha = fogAlpha(z);

  // Après le passage : la bonne réponse devient verte, les autres grises
  let color = LANE_COLORS[g.lane];
  const resolved = currentQuestion && currentQuestion.resolved && g.s === currentQuestion.s;
  if (resolved) color = g.correct ? '#22C97A' : '#B9B5C9';

  shadow(gnd.x, gnd.y, w * 0.55, 0.18 * sc, 0.18);
  // poteaux
  [-1, 1].forEach((side) => {
    const px = gnd.x + side * (w / 2 - 0.05 * sc);
    ctx.fillStyle = '#EDEBF5';
    ctx.fillRect(px - 0.07 * sc, top - 0.2 * sc, 0.14 * sc, gnd.y - top + 0.2 * sc);
    ctx.fillStyle = '#C9C5DA';
    ctx.fillRect(px, top - 0.2 * sc, 0.07 * sc, gnd.y - top + 0.2 * sc);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, top - 0.25 * sc, 0.17 * sc, 0, Math.PI * 2);
    ctx.fill();
  });
  // le panneau en papier
  const grad = ctx.createLinearGradient(0, top, 0, bot);
  grad.addColorStop(0, rgb(mix(hex(color), [255, 255, 255], 0.25)));
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, rgb(mix(hex(color), [0, 0, 0], 0.18)));
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1, 0.12 * sc);
  ctx.beginPath();
  ctx.roundRect(left + 0.06 * sc, top, w - 0.12 * sc, bot - top, 0.3 * sc);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.roundRect(left + 0.22 * sc, top + 0.14 * sc, w - 0.44 * sc, (bot - top) * 0.22, 0.12 * sc);
  ctx.fill();

  const label = String(g.value);
  const fontPx = Math.min(1.5 * sc, (w * 0.88) / (label.length * 0.62));
  if (fontPx >= 6) {
    ctx.font = `${Math.round(fontPx)}px 'Lilita One', 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, 0.18 * sc);
    ctx.strokeStyle = 'rgba(27, 24, 70, 0.55)';
    const cy = (top + bot) / 2 + fontPx * 0.05;
    ctx.strokeText(label, gnd.x, cy);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, gnd.x, cy);
  }
  ctx.globalAlpha = 1;
}

function drawFinish(z) {
  const postX = ROAD_HALF + 1;
  const gnd = proj(0, 0, z);
  const sc = gnd.sc;
  const tl = proj(-postX, 6.2, z);
  const br = proj(postX, 4.5, z);
  ctx.globalAlpha = fogAlpha(z);

  // deux grands piliers gonflables rayés
  [-1, 1].forEach((side) => {
    const px = gnd.x + side * postX * sc;
    const r = 0.45 * sc;
    for (let k = 0; k < 6; k++) {
      const y0 = gnd.y - ((k + 1) * (gnd.y - tl.y)) / 6;
      ctx.fillStyle = k % 2 ? '#FFFFFF' : '#FF4D5E';
      ctx.beginPath();
      ctx.roundRect(px - r, y0, r * 2, (gnd.y - tl.y) / 6 + 1, r * 0.6);
      ctx.fill();
    }
    ctx.fillStyle = '#FFC21A';
    ctx.beginPath();
    ctx.arc(px, tl.y - r * 0.4, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });
  // banderole à damier
  const w = br.x - tl.x, h = br.y - tl.y;
  const cols = 18, cw = w / cols, ch = h / 5;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(tl.x, tl.y, w, h, 0.25 * sc);
  ctx.fill();
  ctx.fillStyle = '#2E2A4D';
  for (let c = 0; c < cols; c++) {
    ctx.fillRect(tl.x + c * cw, c % 2 ? tl.y : tl.y + ch, cw + 0.5, ch);
    ctx.fillRect(tl.x + c * cw, c % 2 ? br.y - ch : br.y - 2 * ch, cw + 0.5, ch);
  }
  const fontPx = h * 0.42;
  if (fontPx >= 5) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(tl.x + w * 0.24, tl.y + h * 0.2, w * 0.52, h * 0.6);
    ctx.fillStyle = '#FF4D8B';
    ctx.font = `${Math.round(fontPx)}px 'Lilita One', 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ARRIVÉE', tl.x + w / 2, tl.y + h / 2 + fontPx * 0.06);
  }
  ctx.globalAlpha = 1;
}

function drawBonus(b, z) {
  const x = (b.lane - 1) * LANE_W;
  const lift = 1.25 + Math.sin(clock * 4 + b.s) * 0.15;
  const gnd = proj(x, 0, z);
  const c = proj(x, lift, z);
  const r = 0.72 * gnd.sc;
  if (r < 1.5) return;
  ctx.globalAlpha = fogAlpha(z);
  shadow(gnd.x, gnd.y, r * 0.8, r * 0.2, 0.2);

  const halo = ctx.createRadialGradient(c.x, c.y, r * 0.5, c.x, c.y, r * 2.4);
  halo.addColorStop(0, 'rgba(255, 214, 80, 0.6)');
  halo.addColorStop(1, 'rgba(255, 214, 80, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(c.x - r * 2.5, c.y - r * 2.5, r * 5, r * 5);

  // La pièce tourne sur elle-même
  const spin = Math.cos(clock * 3 + b.lane);
  const sx = Math.max(0.16, Math.abs(spin));
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(sx, 1);
  ctx.fillStyle = '#C97A00';
  ctx.beginPath();
  ctx.arc(0, r * 0.06, r, 0, Math.PI * 2);
  ctx.fill();
  const face = ctx.createLinearGradient(0, -r, 0, r);
  face.addColorStop(0, '#FFF3A6');
  face.addColorStop(0.5, '#FFC21A');
  face.addColorStop(1, '#F29A00');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  if (sx > 0.4 && r > 6) {
    ctx.font = `${Math.round(r * 0.95)}px 'Lilita One', 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#A85A00';
    ctx.fillText('×2', 0, r * 0.06);
  }
  ctx.restore();
  // étincelles qui tournent autour
  for (let i = 0; i < 3; i++) {
    const a = clock * 2 + (i * Math.PI * 2) / 3;
    const tw = 0.5 + 0.5 * Math.sin(clock * 6 + i * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * tw})`;
    starPath(ctx, c.x + Math.cos(a) * r * 1.45, c.y + Math.sin(a) * r * 0.9, r * (0.18 + 0.12 * tw), 0.3, 4, a);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Un tremplin : une pente rayée orange et jaune posée sur une voie
function drawRamp(r) {
  const x = (r.lane - 1) * LANE_W;
  const z0 = r.s - dist;
  const STRIPES = 6;
  const zMin = -CAM_BACK + NEAR_ZC;
  ctx.globalAlpha = fogAlpha(z0);
  for (let i = STRIPES - 1; i >= 0; i--) {
    let za = z0 + (i / STRIPES) * RAMP_LEN;
    const zb = z0 + ((i + 1) / STRIPES) * RAMP_LEN;
    if (zb <= zMin) continue;
    if (za < zMin) za = zMin;
    const ha = ((za - z0) / RAMP_LEN) * RAMP_H;
    const hb = ((zb - z0) / RAMP_LEN) * RAMP_H;
    const nl = proj(x - RAMP_HALF_W, ha, za), nr = proj(x + RAMP_HALF_W, ha, za);
    const fl = proj(x - RAMP_HALF_W, hb, zb), fr = proj(x + RAMP_HALF_W, hb, zb);
    const gl = proj(x - RAMP_HALF_W, 0, zb), gr = proj(x + RAMP_HALF_W, 0, zb);
    const gnl = proj(x - RAMP_HALF_W, 0, za), gnr = proj(x + RAMP_HALF_W, 0, za);
    ctx.fillStyle = '#B8461E';
    [[gnl, nl, fl, gl], [gnr, nr, fr, gr]].forEach((pts) => {
      ctx.beginPath();
      pts.forEach((pt, k) => (k ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = i % 2 === 0 ? '#FF7A2E' : '#FFC21A';
    ctx.beginPath();
    ctx.moveTo(nl.x, nl.y);
    ctx.lineTo(nr.x, nr.y);
    ctx.lineTo(fr.x, fr.y);
    ctx.lineTo(fl.x, fl.y);
    ctx.closePath();
    ctx.fill();
    if (i === STRIPES - 1) {
      // le bord du haut, face à la route
      const back = proj(x - RAMP_HALF_W, 0, zb);
      ctx.fillStyle = '#8F3414';
      ctx.fillRect(fl.x, fl.y, fr.x - fl.x, Math.max(1, back.y - fl.y));
    }
  }
  ctx.globalAlpha = 1;
}

function drawGrandpaItem(g, z) {
  let x = grandpaX(g);
  let y = 0;
  let scared = 0;
  if (g.hit) {
    // Papi fait un bond de côté pour éviter la voiture
    const t = clamp((clock - g.hitAt) / 0.6, 0, 1);
    x += g.fleeDir * smooth(t) * 2.6;
    y = Math.sin(t * Math.PI) * 0.9;
    scared = 1;
  }
  const gnd = proj(x, 0, z);
  const p = proj(x, y, z);
  if (p.sc * 1.8 < 4) return;
  ctx.globalAlpha = fogAlpha(z);
  shadow(gnd.x, gnd.y, 0.45 * gnd.sc, 0.1 * gnd.sc, 0.2);
  drawGrandpa(ctx, p.x, p.y, p.sc, clock, g.dir, scared);
  ctx.globalAlpha = 1;
}

function drawBoyItem(z) {
  const p = proj(BOY_X, 0, z);
  ctx.globalAlpha = fogAlpha(z);
  drawBoy(ctx, p.x, p.y, p.sc * 1.5, clock);
  ctx.globalAlpha = 1;
  if (p.sc > 12) drawNotes(ctx, p.x, p.y, p.sc * 1.5, clock);
}

function drawCar() {
  const gnd = proj(carX, 0, 0);
  const p = proj(carX, carY, 0);
  const sc = p.sc;
  const h = CAR_H * sc;
  const w = CAR_W * sc;
  const lift = 1 / (1 + carY * 0.6);
  shadow(gnd.x, gnd.y - 0.04 * sc, w * 0.56 * lift, 0.3 * sc * lift, 0.32 * lift);

  const rattle = speed > 1 && carY === 0 ? Math.sin(clock * 40) * 0.012 * sc : 0;
  ctx.save();
  ctx.translate(p.x, p.y + rattle);
  ctx.rotate(tilt);
  ctx.scale(1 + squash * 0.6, 1 - squash);
  carSpr.draw(ctx, 0, 0, h, dpr);
  // Les feux s'allument quand on freine
  if (braking || state === 'countdown') {
    ctx.globalCompositeOperation = 'lighter';
    TAIL_LIGHTS.forEach(([lx, ly]) => {
      const gx = (lx / CAR_SPRITE_W - 0.5) * w;
      const gy = -(1 - ly / CAR_SPRITE_H) * h;
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 0.55 * sc);
      glow.addColorStop(0, 'rgba(255, 90, 90, 0.85)');
      glow.addColorStop(1, 'rgba(255, 40, 40, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(gx - 0.6 * sc, gy - 0.6 * sc, 1.2 * sc, 1.2 * sc);
    });
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawConfetti() {
  confetti.forEach((c) => {
    const z = c.s - dist;
    if (z + CAM_BACK < NEAR_ZC) return;
    const p = proj(c.x, c.y, z);
    if (c.puff) {
      const t = c.life / c.max;
      ctx.fillStyle = `rgba(240, 238, 248, ${0.35 * t})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, c.r * p.sc, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const w = c.w * p.sc, h = c.h * p.sc;
    if (w < 0.6) return;
    // ceux qui passent derrière la voiture s'effacent avant d'arriver sur la caméra
    ctx.globalAlpha = clamp(c.life / 0.5, 0, 1) * clamp((z + CAM_BACK * 0.6) / (CAM_BACK * 0.3), 0, 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(c.rot);
    ctx.scale(1, Math.abs(Math.cos(c.rot * 1.3)) + 0.15);
    ctx.fillStyle = c.color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
    ctx.fillStyle = p.color;
    starPath(ctx, p.x, p.y, p.size, p.kind === 'spark' ? 0.3 : 0.48, p.kind === 'spark' ? 4 : 5, p.rot);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  floaters.forEach((f) => {
    const t = 1 - f.life / 1.2;
    const size = Math.min(W, H) * 0.09 * (t < 0.15 ? 0.6 + t * 2.7 : 1);
    ctx.globalAlpha = clamp(f.life / 0.4, 0, 1);
    ctx.font = `${Math.round(size)}px 'Lilita One', 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = '#2E2A4D';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.globalAlpha = 1;
}

function drawFlash() {
  if (!flash) return;
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, `rgba(${flash.color}, 0)`);
  g.addColorStop(1, `rgba(${flash.color}, ${0.55 * flash.life})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function render() {
  tripP = state === 'menu' ? 0 : clamp(dist / ROUTE_LEN, 0, 1);
  // En l'air, la voiture se cabre : l'horizon bouge un peu, et la caméra suit le saut
  horizonY = HORIZON + jumpV * K * 0.06;
  camY = CAM_H + carY * 0.35;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 14, (Math.random() - 0.5) * shake * 10);

  const skyCols = skyAt(tripP);
  const bgZone = zoneAt(dist + 150);
  drawSky(skyCols, bgZone);
  const sunX = W * 0.7 + Math.sin(bgOffset * 0.0005) * W * 0.12;
  drawRoad(sunX);
  if (state !== 'menu') drawCheckerLine(START_S, 1.2);
  if (finishLine) drawCheckerLine(finishLine.s - 0.6, 1.2);
  drawHaze(skyCols[2]);

  collectObjects().forEach((item) => {
    switch (item.kind) {
      case 'sprite': drawSpriteItem(item); break;
      case 'gate': drawGate(item.gate, item.z); break;
      case 'bonus': drawBonus(item.bonus, item.z); break;
      case 'grandpa': drawGrandpaItem(item.grandpa, item.z); break;
      case 'ramp': drawRamp(item.ramp); break;
      case 'boy': drawBoyItem(item.z); break;
      case 'finish': drawFinish(item.z); break;
      case 'car': drawCar(); break;
      default: break;
    }
  });
  drawConfetti();
  drawParticles();
  drawFlash();
}

/* ---------- HUD ---------- */
const hudCache = {};
function setText(el, key, text) {
  if (hudCache[key] !== text) {
    hudCache[key] = text;
    el.textContent = text;
  }
}

function buildTripTicks() {
  tripTicks.innerHTML = '';
  for (let k = 0; k < TOTAL_QUESTIONS; k++) {
    const i = document.createElement('i');
    i.style.left = `${((FIRST_QUESTION_AT + k * QUESTION_EVERY + ANSWER_DELAY) / GAME_DURATION) * 100}%`;
    tripTicks.appendChild(i);
  }
}

function updateHud() {
  if (hud.hidden) return;
  const timeLeft = state === 'playing' ? GAME_DURATION - gameTime : state === 'countdown' ? GAME_DURATION : 0;
  setText(timerEl, 'timer', formatTime(timeLeft));
  timerPill.classList.toggle('hurry', state === 'playing' && timeLeft <= 15);
  setText(pointsEl, 'points', String(points));
  const pct = `${clamp(dist / ROUTE_LEN, 0, 1) * 100}%`;
  tripFill.style.width = pct;
  tripCar.style.left = pct;
  bonusBadge.hidden = !bonusActive;
  qBonus.hidden = !bonusActive;
  if (currentQuestion && !currentQuestion.resolved) {
    qBar.style.width = `${clamp((currentQuestion.s - dist) / SPAWN_AHEAD, 0, 1) * 100}%`;
    const me = currentLane();
    optionEls.forEach((el, i) => el.classList.toggle('me', i === me));
  }
}

/* ---------- Boucle ---------- */
let lastTs = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
  lastTs = ts;
  update(dt);
  render();
  updateHud();
  if (state === 'done') drawDanceCard();
  requestAnimationFrame(frame);
}

function drawDanceCard() {
  const w = danceCanvas.width / dpr, h = danceCanvas.height / dpr;
  danceCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  danceCtx.clearRect(0, 0, w, h);
  const s = h * 0.56;   // le garçon (cheveux compris) tient dans le cadre
  drawBoy(danceCtx, w / 2, h - 8, s, clock);
  drawNotes(danceCtx, w / 2, h - 8, s, clock);
}

/* ---------- Commandes ---------- */
document.addEventListener('keydown', (e) => {
  if (e.target === pseudoInput) return;
  const key = e.key.toLowerCase();
  if (key === 'arrowleft' || key === 'q' || key === 'a') {
    steer(-1);
    e.preventDefault();
  } else if (key === 'arrowright' || key === 'd') {
    steer(1);
    e.preventDefault();
  } else if (key === 'escape' || key === 'p') {
    if (!helpScreen.hidden || !boardScreen.hidden) closeSheets();
    else setPaused(!paused);
  }
});

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  steer(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
});
[['leftBtn', -1], ['rightBtn', 1]].forEach(([id, dir]) => {
  const btn = $(id);
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.classList.add('pressed');
    steer(dir);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => btn.addEventListener(ev, () => btn.classList.remove('pressed')));
});
document.addEventListener('contextmenu', (e) => { if (e.target.closest('.stage') && e.target !== pseudoInput) e.preventDefault(); });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPaused(true);
});

/* ---------- Menu ---------- */
document.querySelectorAll('.mode-card').forEach((btn) => {
  btn.addEventListener('click', () => startRace(btn.dataset.mode));
});

function buildSwatches() {
  const box = $('swatches');
  CAR_COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', `Voiture ${c.label.toLowerCase()}`);
    b.style.setProperty('--c', c.body);
    b.setAttribute('aria-checked', String(c.id === carColor.id));
    b.addEventListener('click', () => {
      unlockAudio();
      carColor = c;
      storeSet('course-car', c.id);
      box.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-checked', String(s === b)));
      refreshCar();
      squash = 0.2;   // la voiture fait un petit bond de joie
      sfx.tap();
    });
    box.appendChild(b);
  });
}

function updateBestBadges() {
  document.querySelectorAll('[data-best]').forEach((el) => {
    const best = Number(storeGet(`course-best-${el.dataset.best}`, '-1'));
    el.textContent = best >= 0 ? `Ton record : ${best} point${best > 1 ? 's' : ''}` : '';
  });
}

function syncSoundButtons() {
  const on = isSoundOn();
  document.querySelectorAll('.sound-btn').forEach((b) => {
    b.querySelector('use').setAttribute('href', on ? '#i-sound' : '#i-mute');
    b.setAttribute('aria-label', on ? 'Couper le son' : 'Remettre le son');
    const label = b.querySelector('span');
    if (label) label.textContent = on ? 'Son activé' : 'Son coupé';
  });
}
document.querySelectorAll('.sound-btn').forEach((b) => b.addEventListener('click', () => {
  toggleSound();
  syncSoundButtons();
  sfx.tap();
}));

function closeSheets() {
  helpScreen.hidden = true;
  boardScreen.hidden = true;
}
$('helpBtn').addEventListener('click', () => { sfx.tap(); helpScreen.hidden = false; });
$('boardBtn').addEventListener('click', () => { sfx.tap(); boardScreen.hidden = false; selectTab(mode); });
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheets));
[helpScreen, boardScreen].forEach((s) => s.addEventListener('click', (e) => { if (e.target === s) closeSheets(); }));

function selectTab(m) {
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === m)));
  renderBoard($('boardList'), m, 20);
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => selectTab(t.dataset.tab)));

/* ---------- Pause et fin ---------- */
$('pauseBtn').addEventListener('click', () => setPaused(true));
$('resumeBtn').addEventListener('click', () => setPaused(false));
$('restartBtn').addEventListener('click', () => startRace(mode));
$('quitBtn').addEventListener('click', goToMenu);
$('againBtn').addEventListener('click', () => startRace(mode));
$('menuBtn').addEventListener('click', goToMenu);

/* ---------- Classement : le module partagé classe "le plus petit d'abord" ----------
 * On enregistre donc (points max − points + 1), toujours > 0.
 */
const encodeScore = (pts) => MAX_POINTS - pts + 1;
const decodePoints = (value) => MAX_POINTS + 1 - value;
let boardRequest = 0;

async function renderBoard(listEl, m, max, highlight = null) {
  const req = ++boardRequest;
  listEl.innerHTML = '<li class="empty">Chargement…</li>';
  const lb = await leaderboard;
  if (!lb || !lb.isLeaderboardConfigured()) {
    listEl.innerHTML = '<li class="empty">Le classement mondial n’est pas disponible pour le moment.</li>';
    return;
  }
  const list = await lb.fetchTopScores(MODES[m].gameId, max);
  if (req !== boardRequest) return;
  if (list.length === 0) {
    listEl.innerHTML = '<li class="empty">Sois le premier du classement mondial !</li>';
    return;
  }
  listEl.innerHTML = '';
  let marked = false;
  list.forEach((entry, i) => {
    const li = document.createElement('li');
    const pts = decodePoints(entry.value);
    if (!marked && highlight && entry.name === highlight.name && pts === highlight.points) {
      li.className = 'mine';
      marked = true;
    }
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <span class="name">${escapeHtml(entry.name)}</span>
      <span class="pts">${pts} <small>pt${pts > 1 ? 's' : ''}</small></span>`;
    listEl.appendChild(li);
  });
}

scoreForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = pseudoInput.value.trim();
  if (!name) {
    pseudoInput.focus();
    return;
  }
  storeSet('course-pseudo', name);
  const saveBtn = $('saveScore');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Envoi…';
  const lb = await leaderboard;
  const ok = lb ? await lb.submitScore(MODES[mode].gameId, name, encodeScore(points)) : false;
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer';
  scoreMsg.hidden = false;
  if (ok) {
    scoreForm.hidden = true;
    scoreMsg.textContent = 'Score enregistré ! Bravo !';
    scoreMsg.classList.remove('error');
    renderBoard($('endBoardList'), mode, 10, { name: name.slice(0, 20), points });
  } else {
    scoreMsg.textContent = 'Oups, l’enregistrement a échoué. Réessaie !';
    scoreMsg.classList.add('error');
  }
});

/* ---------- C'est parti ---------- */
buildTripTicks();
buildSwatches();
refreshCar();
updateBestBadges();
syncSoundButtons();
showOnly(menuScreen);
// Les panneaux utilisent la police "Lilita One" : on la charge avant de les dessiner
if (document.fonts && document.fonts.load) document.fonts.load("40px 'Lilita One'").catch(() => {});
requestAnimationFrame(frame);
