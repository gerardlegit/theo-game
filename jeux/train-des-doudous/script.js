import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";
import {
  FAMILIES, doudouInner, doudouSVG, faceSVG, skierInner, trainSide,
  stationScene, alpsScene, ySlope, slopeAngle, CONTROLLER_SVG,
} from "./art.js";
import { LEVELS, SEAT_COUNT } from "./levels.js";
import { sfx, isSoundOn, toggleSound } from "./sound.js";

const GAME_ID = 'train-des-doudous';
const SAVE_KEY = 'train-des-doudous-progress';
const MAX_POINTS = LEVELS.length;

/* ---------- Classement : le module partagé classe "le plus petit d'abord" ----------
 * On enregistre donc (points max − points + 1), toujours > 0.
 */
const encodeScore = (pts) => MAX_POINTS - pts + 1;
const decodePoints = (value) => MAX_POINTS + 1 - value;

const $ = (id) => document.getElementById(id);
const screens = { intro: $('screenIntro'), game: $('screenGame'), outro: $('screenOutro') };
const introSvg = $('introSvg');
const introCaption = $('introCaption');
const outroSvg = $('outroSvg');
const outroCaption = $('outroCaption');
const startCard = $('startCard');
const skipIntroBtn = $('skipIntro');
const continueBtn = $('continueBtn');
const resetBtn = $('resetBtn');
const wagon = $('wagon');
const quai = $('quai');
const quaiLabel = $('quaiLabel');
const quaiSlots = $('quaiSlots');
const checkBtn = $('checkBtn');
const remainingEl = $('remaining');
const carnetRows = $('carnetRows');
const carnetSums = $('carnetSums');
const feedbackEl = $('feedback');
const levelStrip = $('levelStrip');
const levelModal = $('levelModal');
const scoreModal = $('scoreModal');
const pseudoInput = $('pseudoInput');
const scoreForm = $('scoreForm');
const scoreSaved = $('scoreSaved');
const leaderboardList = $('leaderboardList');
const openScoreBtn = $('openScoreBtn');
const toastEl = $('toast');
const endCard = $('endCard');

// Les 10 doudous : un gros et un petit par famille
const DOUDOUS = FAMILIES.flatMap((f, fam) => [
  { id: `${f.id}-gros`, fam, sp: f.id, kid: false },
  { id: `${f.id}-petit`, fam, sp: f.id, kid: true },
]);
const familyName = (fam) => FAMILIES[fam].name;

/* ---------- Progression (gardée dans le navigateur) ---------- */
function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (p && Array.isArray(p.done)) {
      return { done: p.done.filter((i) => Number.isInteger(i) && i >= 0 && i < LEVELS.length), level: Math.min(Math.max(0, p.level | 0), LEVELS.length - 1) };
    }
  } catch { /* stockage indisponible */ }
  return { done: [], level: 0 };
}
function saveProgress() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* stockage indisponible */ }
}
let progress = loadProgress();
const points = () => progress.done.length;
const highestUnlocked = () => Math.min(LEVELS.length - 1, progress.done.reduce((m, i) => Math.max(m, i + 1), 0));

/* ---------- État du niveau ---------- */
let levelIdx = 0;
let seats = [];          // numéro de chaque siège
let plant = [];          // la solution cachée : 5 couples [gros, petit]
let seatOf = {};         // id du doudou → index du siège (ou null s'il est sur le quai)
let selected = null;     // doudou choisi d'un toucher, en attente d'un siège
let locked = false;      // pendant la célébration
let savedForPoints = -1; // pour ne pas inscrire deux fois le même score

/* ======================================================================
 * Le wagon vu d'en haut
 * Le long du wagon : siège, table, siège, passage, siège, table, siège…
 * En travers : fenêtre, 2 sièges, allée, 2 sièges, fenêtre.
 * ==================================================================== */
const SEAT_POS = [1, 3, 5, 7, 9, 11];
const TABLE_POS = [2, 6, 10];
const SEAT_LANES = [2, 3, 5, 6];
const TABLE_TREATS = ['☕', '🥐', '🧃', '🍪', '📖', '🥨'];
const seatEls = [];
const tokens = {};
const slots = {};

function placeInGrid(el, pos, lane, pspan = 1, lspan = 1) {
  el.style.setProperty('--pos', pos);
  el.style.setProperty('--lane', lane);
  el.style.setProperty('--pspan', pspan);
  el.style.setProperty('--lspan', lspan);
}

function buildWagon() {
  const aisle = document.createElement('div');
  aisle.className = 'aisle';
  placeInGrid(aisle, 1, 4, 11);
  wagon.appendChild(aisle);

  SEAT_POS.forEach((pos) => [1, 7].forEach((lane) => {
    const w = document.createElement('span');
    w.className = 'win';
    placeInGrid(w, pos, lane);
    wagon.appendChild(w);
  }));

  TABLE_POS.forEach((pos, t) => [2, 5].forEach((lane, k) => {
    const table = document.createElement('div');
    table.className = 'table';
    table.textContent = TABLE_TREATS[t * 2 + k];
    placeInGrid(table, pos, lane, 1, 2);
    wagon.appendChild(table);
  }));

  SEAT_POS.forEach((pos, c) => SEAT_LANES.forEach((lane) => {
    const i = seatEls.length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `seat ${c % 2 === 0 ? 'back-start' : 'back-end'}`;
    b.dataset.seat = String(i);
    placeInGrid(b, pos, lane);
    b.innerHTML = '<span class="seat-back"></span><span class="seat-cushion"></span><span class="seat-spot"></span><span class="seat-num"></span>';
    b.addEventListener('click', (e) => {
      if (e.target.closest('.doudou')) return;
      onSeatTap(i);
    });
    wagon.appendChild(b);
    seatEls.push(b);
  }));
  if (seatEls.length !== SEAT_COUNT) throw new Error('Nombre de sièges incohérent');
}

function buildQuai() {
  FAMILIES.forEach((f, fam) => {
    const group = document.createElement('div');
    group.className = 'fam';
    group.style.setProperty('--fam', f.color);
    group.title = `Famille ${f.name}`;
    DOUDOUS.filter((d) => d.fam === fam).forEach((d) => {
      const slot = document.createElement('div');
      slot.className = `slot ${d.kid ? 'small' : 'big'}`;
      group.appendChild(slot);
      slots[d.id] = slot;

      const t = document.createElement('div');
      t.className = `doudou ${d.kid ? 'small' : 'big'}`;
      t.dataset.id = d.id;
      t.tabIndex = 0;
      t.setAttribute('role', 'button');
      t.setAttribute('aria-label', `${d.kid ? 'Petit' : 'Gros'} ${f.name.toLowerCase()}`);
      t.innerHTML = doudouSVG(d.sp, { kid: d.kid });
      t.addEventListener('pointerdown', onPointerDown);
      t.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTokenTap(d.id);
        }
      });
      tokens[d.id] = t;
    });
    quaiSlots.appendChild(group);
  });

  quai.addEventListener('click', (e) => {
    if (e.target.closest('.doudou') || !selected || locked) return;
    sendToQuai(selected);
    setSelected(null);
  });
}

/* ---------- Placer / déplacer les doudous ---------- */
const occupantOf = (seat) => DOUDOUS.find((d) => seatOf[d.id] === seat)?.id ?? null;

function placeDoudou(id, seat) {
  if (locked) return;
  const prev = seatOf[id];
  if (prev === seat) return;
  const other = occupantOf(seat);
  if (other) seatOf[other] = prev; // échange de places (ou retour au quai)
  seatOf[id] = seat;
  sfx.drop();
  onBoardChange();
}

function sendToQuai(id) {
  if (locked || seatOf[id] === null) return;
  seatOf[id] = null;
  sfx.back();
  onBoardChange();
}

function renderBoard() {
  DOUDOUS.forEach((d) => {
    const s = seatOf[d.id];
    const host = s === null ? slots[d.id] : seatEls[s];
    if (tokens[d.id].parentElement !== host) host.appendChild(tokens[d.id]);
  });
  seatEls.forEach((el, i) => {
    el.querySelector('.seat-num').textContent = String(seats[i]);
    const occ = occupantOf(i);
    el.classList.toggle('full', !!occ);
    el.setAttribute('aria-label', occ ? `Siège ${seats[i]}, occupé` : `Siège ${seats[i]}`);
  });
  const left = DOUDOUS.filter((d) => seatOf[d.id] === null).length;
  quai.classList.toggle('all-seated', left === 0);
  quaiLabel.textContent = left === 0
    ? '👍 Tout le monde est assis ! Tu peux encore échanger des places.'
    : '🛤️ Sur le quai : fais glisser chaque doudou sur un siège (ou touche le doudou, puis le siège)';
  checkBtn.disabled = left > 0 || locked;
  remainingEl.textContent = left > 0
    ? `Encore ${left} doudou${left > 1 ? 's' : ''} à installer`
    : 'Tout le monde est assis : vérifie !';
}

function onBoardChange() {
  clearResults();
  renderBoard();
  renderCarnet();
}

function setSelected(id) {
  if (selected) tokens[selected].classList.remove('selected');
  selected = id;
  if (id) tokens[id].classList.add('selected');
  wagon.classList.toggle('picking', !!id);
}

function onTokenTap(id) {
  if (locked) return;
  if (selected && selected !== id && seatOf[id] !== null) {
    // un doudou est déjà choisi : on le pose à la place de celui-ci (ils échangent)
    placeDoudou(selected, seatOf[id]);
    setSelected(null);
    return;
  }
  if (selected === id) {
    setSelected(null);
    return;
  }
  sfx.pick();
  setSelected(id);
}

function onSeatTap(i) {
  if (locked) return;
  if (selected) {
    placeDoudou(selected, i);
    setSelected(null);
  }
}

/* ---------- Glisser-déposer (souris et doigt) ---------- */
let drag = null;

function onPointerDown(e) {
  if (locked || e.button > 0) return;
  e.preventDefault();
  const id = e.currentTarget.dataset.id;
  drag = { id, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, target: null };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
}

function dropTargetAt(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const seat = el.closest('.seat');
  if (seat) return { seat: Number(seat.dataset.seat), el: seat };
  if (el.closest('#quai')) return { quai: true, el: quai };
  return null;
}

function onPointerMove(e) {
  if (!drag) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    drag.moved = true;
    setSelected(null);
    const token = tokens[drag.id];
    const ghost = document.createElement('div');
    ghost.className = `drag-ghost ${token.classList.contains('small') ? 'small' : ''}`;
    ghost.innerHTML = token.innerHTML;
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    token.classList.add('dragging');
    sfx.pick();
  }
  const g = drag.ghost;
  g.style.transform = `translate(${e.clientX - g.offsetWidth / 2}px, ${e.clientY - g.offsetHeight * 0.75}px)`;

  const t = dropTargetAt(e.clientX, e.clientY);
  if (drag.target?.el !== t?.el) {
    drag.target?.el.classList.remove('drop');
    t?.el.classList.add('drop');
  }
  drag.target = t;

  // fait défiler la page quand on approche du bord de l'écran
  if (e.clientY < 70) window.scrollBy(0, -14);
  else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
}

function endDrag() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerCancel);
  if (!drag) return;
  drag.ghost?.remove();
  drag.target?.el.classList.remove('drop');
  tokens[drag.id].classList.remove('dragging');
}

function onPointerUp(e) {
  if (!drag) return;
  const d = drag;
  endDrag();
  drag = null;
  if (!d.moved) {
    onTokenTap(d.id);
    return;
  }
  const t = dropTargetAt(e.clientX, e.clientY);
  if (t?.seat !== undefined) placeDoudou(d.id, t.seat);
  else if (t?.quai) sendToQuai(d.id);
}

function onPointerCancel() {
  endDrag();
  drag = null;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setSelected(null);
});

/* ======================================================================
 * Les niveaux
 * ==================================================================== */
const famNumbers = () => FAMILIES.map((f) => {
  const g = seatOf[`${f.id}-gros`];
  const e = seatOf[`${f.id}-petit`];
  return { g: g === null ? null : seats[g], e: e === null ? null : seats[e] };
});

function startLevel(i) {
  levelIdx = i;
  progress.level = i;
  saveProgress();
  const L = LEVELS[i];
  ({ seats, plant } = L.generate());
  DOUDOUS.forEach((d) => { seatOf[d.id] = null; });
  locked = false;
  setSelected(null);
  DOUDOUS.forEach((d) => tokens[d.id].classList.remove('cheer'));

  $('levelNum').textContent = String(i + 1);
  $('ruleLevel').textContent = String(i + 1);
  $('ruleTitle').textContent = L.title;
  $('ruleText').innerHTML = L.rule;
  $('ruleFormula').innerHTML = L.formula;
  $('ruleExample').textContent = L.example;
  renderLevelStrip();
  onBoardChange();
}

function renderLevelStrip() {
  levelStrip.innerHTML = '';
  const maxOpen = highestUnlocked();
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lvl';
    b.textContent = String(i + 1);
    b.title = L.title;
    if (progress.done.includes(i)) b.classList.add('done');
    if (i === levelIdx) b.classList.add('current');
    b.disabled = i > maxOpen;
    b.setAttribute('aria-label', `Niveau ${i + 1}${progress.done.includes(i) ? ', réussi' : ''}${b.disabled ? ', verrouillé' : ''}`);
    b.addEventListener('click', () => { if (!locked) startLevel(i); });
    levelStrip.appendChild(b);
  });
}

function renderPoints() {
  const p = points();
  $('pointsCount').textContent = String(p);
  $('pointsPlural').textContent = p > 1 ? 's' : '';
  openScoreBtn.disabled = p === 0 || savedForPoints === p;
  openScoreBtn.textContent = `🏆 Inscrire mes ${p} point${p > 1 ? 's' : ''}`;
}

/* ---------- Carnet du contrôleur ---------- */
let lastResult = null;

function renderCarnet() {
  const nums = famNumbers();
  carnetRows.innerHTML = '';
  FAMILIES.forEach((f, fam) => {
    const { g, e } = nums[fam];
    const row = document.createElement('div');
    row.className = 'crow';
    const r = lastResult?.fams[fam];
    let status = '';
    if (r === true) { row.classList.add('ok'); status = '✅'; }
    if (r === false) { row.classList.add('ko'); status = '❌'; }
    row.innerHTML = `
      <span class="face">${faceSVG(f.id)}</span>
      <span class="cval"><small>gros</small>${g ?? '–'}</span>
      <span class="cval"><small>petit</small>${e ?? '–'}</span>
      <span class="cstatus">${status}</span>`;
    if (lastResult && LEVELS[levelIdx].pair) {
      const calc = document.createElement('span');
      calc.className = 'ccalc';
      calc.textContent = LEVELS[levelIdx].pair.calc(g, e);
      row.appendChild(calc);
    }
    carnetRows.appendChild(row);
  });

  carnetSums.innerHTML = '';
  if (lastResult?.sumLines) {
    lastResult.sumLines.forEach((line) => {
      const p = document.createElement('p');
      p.className = lastResult.sumOk ? 'ok' : 'ko';
      p.textContent = line;
      carnetSums.appendChild(p);
    });
  }
}

function clearResults() {
  lastResult = null;
  feedbackEl.innerHTML = '';
  seatEls.forEach((s) => s.classList.remove('bad', 'good', 'hint'));
}

function evaluate() {
  const L = LEVELS[levelIdx];
  const nums = famNumbers();
  const gs = nums.map((n) => n.g);
  const es = nums.map((n) => n.e);
  const fams = nums.map(({ g, e }) => (L.pair ? L.pair.ok(g, e) : null));
  const sumOk = L.sum ? L.sum.ok(gs, es) : null;
  return {
    fams,
    sumOk,
    sumLines: L.sum ? L.sum.lines(gs, es) : null,
    ok: fams.every((r) => r !== false) && sumOk !== false,
    nums, gs, es,
  };
}

function check() {
  if (locked || DOUDOUS.some((d) => seatOf[d.id] === null)) return;
  setSelected(null);
  const L = LEVELS[levelIdx];
  const res = evaluate();
  lastResult = res;
  renderCarnet();
  feedbackEl.innerHTML = '';

  if (res.ok) {
    celebrate();
    return;
  }

  sfx.oops();
  wagon.classList.remove('shake');
  void wagon.offsetWidth; // relance l'animation
  wagon.classList.add('shake');
  res.fams.forEach((r, fam) => {
    if (r !== false) return;
    const { g, e } = res.nums[fam];
    addFeedback(`<b>Famille ${familyName(fam)}</b> : ${L.pair.wrong(g, e)}`);
    seatEls[seatOf[`${FAMILIES[fam].id}-gros`]].classList.add('bad');
    seatEls[seatOf[`${FAMILIES[fam].id}-petit`]].classList.add('bad');
  });
  if (res.sumOk === false) addFeedback(L.sum.wrong(res.gs, res.es));
  if (res.fams.every((r) => r !== false) && res.sumOk === false && L.pair) {
    addFeedback('Toutes les familles respectent la règle… mais pas le total ! Essaie d\'autres numéros.', true);
  }
  showToast('Pas encore ! Regarde le carnet du contrôleur 📒');
}

function addFeedback(html, good = false) {
  const li = document.createElement('li');
  if (good) li.className = 'good';
  li.innerHTML = html;
  feedbackEl.appendChild(li);
}

function celebrate() {
  locked = true;
  renderBoard();
  sfx.win();
  seatEls.forEach((s, i) => { if (occupantOf(i)) s.classList.add('good'); });
  DOUDOUS.forEach((d) => tokens[d.id].classList.add('cheer'));
  addFeedback('🎉 Bravo ! Tous les doudous sont bien assis.', true);
  launchConfetti();

  const first = !progress.done.includes(levelIdx);
  if (first) {
    progress.done.push(levelIdx);
    saveProgress();
    setTimeout(() => {
      sfx.point();
      $('pointsPill').classList.remove('bump');
      void $('pointsPill').offsetWidth;
      $('pointsPill').classList.add('bump');
    }, 500);
  }
  renderPoints();
  renderLevelStrip();
  setTimeout(() => showLevelModal(first), 1300);
}

function showLevelModal(firstTime) {
  const last = levelIdx === LEVELS.length - 1;
  const p = points();
  $('modalDoudous').innerHTML = DOUDOUS.map((d, i) =>
    `<span class="${d.kid ? 'small' : 'big'}" style="animation-delay:${i * 0.07}s">${doudouSVG(d.sp, { kid: d.kid, mood: 'laugh' })}</span>`).join('');
  $('modalTitle').textContent = `Niveau ${levelIdx + 1} réussi !`;
  $('modalText').innerHTML = (firstTime
    ? `⭐ <strong>+1 point</strong> au classement général !`
    : `Tu avais déjà gagné le point de ce niveau, mais bravo encore !`) +
    `<br>Tu as maintenant <strong>${p} point${p > 1 ? 's' : ''}</strong> sur ${MAX_POINTS}.`;
  $('nextBtn').textContent = last ? '🏔️ Direction les Alpes !' : 'Niveau suivant ➡️';
  levelModal.hidden = false;
  $('nextBtn').focus();
}

$('replayBtn').addEventListener('click', () => {
  levelModal.hidden = true;
  startLevel(levelIdx);
});
$('nextBtn').addEventListener('click', () => {
  levelModal.hidden = true;
  if (levelIdx === LEVELS.length - 1) {
    playOutro();
  } else {
    startLevel(levelIdx + 1);
    screens.game.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* ---------- Indice ---------- */
function flashSeats(numbers) {
  seatEls.forEach((s) => s.classList.remove('hint'));
  void wagon.offsetWidth;
  numbers.forEach((n) => {
    const i = seats.indexOf(n);
    if (i >= 0) seatEls[i].classList.add('hint');
  });
}

const listFr = (list) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} et ${list[list.length - 1]}` : String(list[0]));

function giveHint() {
  if (locked) return;
  const L = LEVELS[levelIdx];
  sfx.hint();
  if (!L.pair) {
    const es = plant.map((p) => p[1]).sort((a, b) => a - b);
    flashSeats(es);
    showToast(`💡 Psst… les petits pourraient s'asseoir sur ${listFr(es)}.`);
    return;
  }
  const nums = famNumbers();
  let fam = nums.findIndex(({ g, e }) => g === null || e === null || !L.pair.ok(g, e));
  if (fam < 0) {
    // toutes les familles respectent la règle : c'est le total qui coince
    fam = plant.findIndex(([g, e]) => !nums.some((n) => n.g === g && n.e === e));
    if (fam < 0) fam = 0;
  }
  const [g, e] = plant[fam];
  flashSeats([g, e]);
  showToast(`💡 Psst… essaie le petit ${familyName(fam).toLowerCase()} sur ${e} et le gros ${familyName(fam).toLowerCase()} sur ${g} !`);
}

/* ---------- Toast + confettis ---------- */
let toastTimer = null;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  toastEl.style.animation = 'none';
  void toastEl.offsetWidth;
  toastEl.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4200);
}

function launchConfetti() {
  const pieces = ['🎉', '⭐', '🎊', '✨', '🧸', '🚂'];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    span.className = 'confetti-piece';
    span.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    span.style.left = `${Math.random() * 100}vw`;
    span.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
    span.style.fontSize = `${1 + Math.random() * 1.2}rem`;
    $('confettiLayer').appendChild(span);
    setTimeout(() => span.remove(), 3000);
  }
}

/* ======================================================================
 * Petit moteur d'animation pour les scènes (gare et Alpes)
 * ==================================================================== */
let animRun = 0; // change à chaque nouvelle scène : les anciennes animations s'arrêtent

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t * t;
const linear = (t) => t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));

function tween(ms, fn, ease = easeInOut) {
  const run = animRun;
  return new Promise((resolve) => {
    const t0 = performance.now();
    function step(now) {
      if (run !== animRun) return resolve(false);
      const t = clamp01((now - t0) / ms);
      fn(ease(t), t);
      if (t < 1) requestAnimationFrame(step);
      else resolve(true);
    }
    requestAnimationFrame(step);
  });
}
const wait = (ms) => tween(ms, () => {});

function setCaption(el, text) {
  el.classList.remove('show');
  if (!text) return;
  setTimeout(() => {
    el.textContent = text;
    el.classList.add('show');
  }, 180);
}

/** Un doudou dans une scène : (x, y) = le point entre ses pieds. */
function makeActor(parent, d, s) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  el.innerHTML = doudouInner(d.sp, { kid: d.kid });
  parent.appendChild(el);
  const a = { ...d, el, x: -200, y: 0, s, r: 0, o: 1 };
  drawActor(a);
  return a;
}
function drawActor(a) {
  a.el.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${a.r.toFixed(1)}) scale(${a.s}) translate(-50 -100)`);
  a.el.setAttribute('opacity', a.o.toFixed(2));
}

function nameTag(parent, text, color) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const w = text.length * 9 + 22;
  el.innerHTML = `<rect x="${-w / 2}" y="-15" width="${w}" height="24" rx="12" fill="${color}"/><path d="M-6 8L0 15L6 8Z" fill="${color}"/>` +
    `<text x="0" y="2" text-anchor="middle" fill="#fff" font-family="Baloo 2, sans-serif" font-weight="800" font-size="15">${text}</text>`;
  el.setAttribute('opacity', '0');
  parent.appendChild(el);
  return el;
}

/* ---------- Intro : départ de la gare du Nord ---------- */
const TRAIN_Y = 321;
const TRAIN_S = 0.9;
const DOOR_X = 330 + 211 * TRAIN_S;     // milieu de la porte de la 1re voiture
const DOOR_Y = TRAIN_Y + 100 * TRAIN_S; // bas de la porte
const PLATFORM_Y = 535;

function drawStation() {
  introSvg.innerHTML = stationScene();
  const train = introSvg.querySelector('#introTrain');
  train.setAttribute('transform', `translate(330 ${TRAIN_Y}) scale(${TRAIN_S})`);
  train.innerHTML = trainSide({ doorsOpen: true });
  return train;
}

async function playIntro() {
  const run = ++animRun;
  showScreen('intro');
  startCard.hidden = true;
  skipIntroBtn.hidden = false;
  const train = drawStation();
  const actorsG = introSvg.querySelector('#introActors');

  // la file des familles sur le quai, la plus proche de la porte en premier
  const actors = [];
  const tags = [];
  FAMILIES.forEach((f, fam) => {
    const px = 440 - fam * 92;
    const parent = makeActor(actorsG, DOUDOUS[fam * 2], 0.55);
    const kid = makeActor(actorsG, DOUDOUS[fam * 2 + 1], 0.36);
    parent.tx = px;
    kid.tx = px + 38;
    actors.push(kid, parent);
    tags.push({ el: nameTag(actorsG, f.name, f.color), x: px + 18, parent, kid });
  });
  actors.forEach((a, i) => { a.y = PLATFORM_Y; a.phase = i * 0.9; });

  // 1. les doudous arrivent sur le quai en trottinant
  setCaption(introCaption, 'Paris, gare du Nord. Le Train des Doudous part pour les Alpes !');
  await tween(3400, (e) => {
    actors.forEach((a) => {
      a.x = a.tx - 650 * (1 - e);
      const step = a.x / 9 + a.phase;
      const moving = e < 1;
      a.y = PLATFORM_Y - (moving ? Math.abs(Math.sin(step)) * 5 : 0);
      a.r = moving ? Math.sin(step) * 4 : 0;
      drawActor(a);
    });
  }, easeOut);
  if (run !== animRun) return;

  // 2. présentation des familles
  setCaption(introCaption, 'Un ours, un panda, un chien, un tigre et un wombat… avec leurs petits !');
  for (const t of tags) {
    await tween(480, (e) => {
      const jump = Math.sin(Math.PI * e) * 22;
      t.parent.y = PLATFORM_Y - jump;
      t.kid.y = PLATFORM_Y - jump * 1.2;
      drawActor(t.parent);
      drawActor(t.kid);
      t.el.setAttribute('opacity', String(Math.min(1, e * 3)));
      t.el.setAttribute('transform', `translate(${t.x} ${PLATFORM_Y - 78 - jump})`);
    }, linear);
    if (run !== animRun) return;
  }
  await wait(500);
  if (run !== animRun) return;

  // 3. tout le monde monte dans le train, un par un
  setCaption(introCaption, 'En voiture ! Chaque siège porte un numéro… gare aux énigmes du contrôleur !');
  tags.forEach((t) => t.el.remove());
  const passengers = Array(10).fill(null);
  const order = [...actors].sort((a, b) => b.tx - a.tx);
  await Promise.all(order.map(async (a, k) => {
    await wait(k * 330);
    const x0 = a.x;
    const dist = Math.max(0, DOOR_X - x0);
    await tween(Math.max(250, dist / 0.38), (e) => {
      a.x = x0 + dist * e;
      const step = a.x / 9 + a.phase;
      a.y = PLATFORM_Y - Math.abs(Math.sin(step)) * 5;
      a.r = Math.sin(step) * 4;
      drawActor(a);
    }, linear);
    await tween(380, (e) => {
      a.y = PLATFORM_Y + (DOOR_Y - PLATFORM_Y) * e - Math.sin(Math.PI * e) * 40;
      a.s = (a.kid ? 0.36 : 0.55) * (1 - 0.3 * e);
      a.r = 0;
      a.o = 1 - clamp01((e - 0.6) / 0.4);
      drawActor(a);
    }, linear);
    if (run !== animRun) return;
    passengers[k] = { sp: a.sp, kid: a.kid };
    train.innerHTML = trainSide({ passengers, doorsOpen: true });
    sfx.pick();
  }));
  if (run !== animRun) return;

  // 4. les portes se ferment… tchou tchou !
  await wait(400);
  train.innerHTML = trainSide({ passengers, doorsOpen: false });
  setCaption(introCaption, 'Tchou tchou ! Direction les montagnes !');
  sfx.whistle();
  await wait(900);
  await tween(2800, (e) => {
    train.setAttribute('transform', `translate(${330 + 900 * e} ${TRAIN_Y}) scale(${TRAIN_S})`);
  }, easeIn);
  if (run !== animRun) return;
  finishIntro();
}

function finishIntro() {
  animRun++;
  setCaption(introCaption, '');
  skipIntroBtn.hidden = true;
  showScreen('game');
  startLevel(progress.level);
  screens.game.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Fin : les Alpes et le ski ---------- */
const LAUGHS = ['Hihihi !', 'Youpiii !', 'Wouhou !', 'Ha ha ha !', 'Trop bien !', 'Hi hi !', 'Yaaah !'];

async function playOutro() {
  const run = ++animRun;
  showScreen('outro');
  endCard.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  outroSvg.innerHTML = alpsScene();
  const train = outroSvg.querySelector('#alpsTrain');
  const skiersG = outroSvg.querySelector('#alpsSkiers');
  const sprayG = outroSvg.querySelector('#alpsSpray');
  const snowG = outroSvg.querySelector('#alpsSnow');
  const TS = 0.5;
  const TY = 314 - 121 * TS;
  const allAboard = DOUDOUS.map((d) => ({ sp: d.sp, kid: d.kid }));
  train.innerHTML = trainSide({ passengers: allAboard });

  // flocons de neige
  const flakes = Array.from({ length: 55 }, () => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('fill', '#FFFFFF');
    c.setAttribute('opacity', (0.6 + Math.random() * 0.4).toFixed(2));
    snowG.appendChild(c);
    return { el: c, x: Math.random() * 1000, y: Math.random() * 560, r: 1.2 + Math.random() * 2.6, v: 0.02 + Math.random() * 0.04, p: Math.random() * 6 };
  });

  // les skieurs
  const skiers = DOUDOUS.map((d, i) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = skierInner(d.sp, d.kid);
    g.setAttribute('opacity', '0');
    const bubble = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bubble.setAttribute('opacity', '0');
    skiersG.appendChild(g);
    skiersG.appendChild(bubble);
    return { ...d, el: g, bubble, s: d.kid ? 0.48 : 0.68, x: -120, start: i * 650, speed: 0.15 + Math.random() * 0.06, phase: Math.random() * 6, bubbleUntil: 0, nextBubble: 600 + Math.random() * 2000 };
  });
  const spray = [];
  let skiing = false;
  let skiT0 = 0;

  // boucle d'animation continue : neige + skieurs
  let last = performance.now();
  function loop(now) {
    if (run !== animRun) return;
    const dt = Math.min(50, now - last);
    last = now;
    flakes.forEach((f) => {
      f.y += f.v * dt;
      f.x += Math.sin(now / 900 + f.p) * 0.15;
      if (f.y > 565) { f.y = -5; f.x = Math.random() * 1000; }
      f.el.setAttribute('cx', f.x.toFixed(1));
      f.el.setAttribute('cy', f.y.toFixed(1));
      f.el.setAttribute('r', f.r.toFixed(1));
    });
    if (skiing) {
      const t = now - skiT0;
      skiers.forEach((k) => {
        if (t < k.start) { k.el.setAttribute('opacity', '0'); return; }
        k.el.setAttribute('opacity', '1');
        k.x += k.speed * dt;
        if (k.x > 1100) {
          // on remonte au sommet pour une nouvelle descente
          k.x = -120 - Math.random() * 300;
          k.speed = 0.15 + Math.random() * 0.06;
        }
        let y = ySlope(k.x) + 2;
        let rot = slopeAngle(k.x) + Math.sin(now / 260 + k.phase) * 6;
        if (k.x > 560 && k.x < 690) {
          // petit saut de joie sur la bosse
          const u = (k.x - 560) / 130;
          y -= Math.sin(Math.PI * u) * 34;
          rot -= Math.sin(Math.PI * u) * 14;
        }
        k.el.setAttribute('transform', `translate(${k.x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${k.s}) translate(-50 -100)`);
        if (Math.random() < dt / 45 && k.x > -40 && k.x < 1040) {
          spray.push({ x: k.x - 30 * k.s * 2, y: y - 2, vx: -0.03 - Math.random() * 0.05, vy: -0.03 - Math.random() * 0.05, life: 600, r: 2 + Math.random() * 3 });
        }
        // bulles de rire
        if (now > k.nextBubble + skiT0 && k.x > 40 && k.x < 900) {
          const text = LAUGHS[Math.floor(Math.random() * LAUGHS.length)];
          const w = text.length * 8.5 + 20;
          k.bubble.innerHTML = `<rect x="${-w / 2}" y="-26" width="${w}" height="24" rx="12" fill="#FFFFFF" stroke="${FAMILIES[k.fam].color}" stroke-width="2"/><path d="M-5 -3L0 6L5 -3Z" fill="#FFFFFF"/>` +
            `<text x="0" y="-9" text-anchor="middle" fill="#2E2A4D" font-family="Baloo 2, sans-serif" font-weight="800" font-size="14">${text}</text>`;
          k.bubbleUntil = now + 1400;
          k.nextBubble = now - skiT0 + 2400 + Math.random() * 3000;
          if (Math.random() < 0.35) sfx.giggle();
        }
        const showBubble = now < k.bubbleUntil;
        k.bubble.setAttribute('opacity', showBubble ? '1' : '0');
        if (showBubble) k.bubble.setAttribute('transform', `translate(${k.x.toFixed(1)} ${(y - 100 * k.s - 6).toFixed(1)})`);
      });
      for (let i = spray.length - 1; i >= 0; i--) {
        const p = spray[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.0002 * dt;
        if (p.life <= 0) spray.splice(i, 1);
      }
      sprayG.innerHTML = spray.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="#FFFFFF" opacity="${(p.life / 600).toFixed(2)}"/>`).join('');
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // 1. le train traverse le grand viaduc
  setCaption(outroCaption, 'Après un long voyage… voici enfin les Alpes ! 🏔️');
  sfx.whistle();
  await tween(4200, (e) => {
    train.setAttribute('transform', `translate(${-420 + 910 * e} ${TY}) scale(${TS})`);
  }, easeOut);
  if (run !== animRun) return;

  // 2. tout le monde descend… et chausse ses skis !
  setCaption(outroCaption, 'Tout le monde descend… et chausse ses skis ! ⛷️');
  await wait(1200);
  if (run !== animRun) return;
  train.innerHTML = trainSide({ passengers: [] });
  skiing = true;
  skiT0 = performance.now();
  await wait(1500);
  if (run !== animRun) return;
  setCaption(outroCaption, 'Hihihi ! Les doudous dévalent les pistes en rigolant !');

  // 3. la carte de fin
  await wait(6500);
  if (run !== animRun) return;
  const p = points();
  $('endText').innerHTML = `Les 10 doudous sont arrivés dans les Alpes grâce à toi.<br>Tu as gagné <strong>${p} point${p > 1 ? 's' : ''}</strong> sur ${MAX_POINTS} au classement général !`;
  $('endScoreBtn').disabled = p === 0 || savedForPoints === p;
  setCaption(outroCaption, '');
  endCard.hidden = false;
}

/* ======================================================================
 * Écrans
 * ==================================================================== */
function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
  if (name !== 'outro') outroSvg.innerHTML = '';
}

function showStart() {
  animRun++;
  showScreen('intro');
  drawStation();
  setCaption(introCaption, '');
  skipIntroBtn.hidden = true;
  startCard.hidden = false;
  const started = progress.done.length > 0 || progress.level > 0;
  continueBtn.hidden = !started;
  resetBtn.hidden = !started;
  continueBtn.textContent = `🚃 Continuer (niveau ${progress.level + 1})`;
}

$('startLineup').innerHTML = DOUDOUS.map((d, i) =>
  `<span class="${d.kid ? 'small' : 'big'}" style="animation-delay:${(i * 0.13).toFixed(2)}s">${doudouSVG(d.sp, { kid: d.kid })}</span>`).join('');

$('startBtn').addEventListener('click', playIntro);
skipIntroBtn.addEventListener('click', finishIntro);
continueBtn.addEventListener('click', () => {
  animRun++;
  showScreen('game');
  startLevel(progress.level);
});
resetBtn.addEventListener('click', () => {
  if (!window.confirm('Recommencer une nouvelle partie ? Tes points repartent à zéro.')) return;
  progress = { done: [], level: 0 };
  saveProgress();
  renderPoints();
  showStart();
});

$('newGameBtn').addEventListener('click', () => {
  progress = { done: [], level: 0 };
  saveProgress();
  savedForPoints = -1;
  renderPoints();
  playIntro();
});
$('backToLevelsBtn').addEventListener('click', () => {
  animRun++;
  showScreen('game');
  startLevel(LEVELS.length - 1);
});

checkBtn.addEventListener('click', check);
$('hintBtn').addEventListener('click', giveHint);
$('shuffleBtn').addEventListener('click', () => { if (!locked) startLevel(levelIdx); });
const soundBtn = $('soundBtn');
function renderSoundBtn() {
  soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-label', isSoundOn() ? 'Couper le son' : 'Remettre le son');
}
soundBtn.addEventListener('click', () => { toggleSound(); renderSoundBtn(); });

/* ======================================================================
 * Classement général
 * ==================================================================== */
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function renderLeaderboard() {
  if (!isLeaderboardConfigured()) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty">Classement mondial pas encore activé sur ce site (configuration Firebase à faire par l\'administrateur).</li>';
    return;
  }
  leaderboardList.innerHTML = '<li class="leaderboard-empty">Chargement…</li>';
  const list = await fetchTopScores(GAME_ID, 20);
  leaderboardList.innerHTML = '';
  if (list.length === 0) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty">Sois le premier du classement mondial !</li>';
    return;
  }
  list.forEach((entry, i) => {
    const pts = decodePoints(entry.value);
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-pts">${pts} pt${pts > 1 ? 's' : ''}</span>`;
    leaderboardList.appendChild(li);
  });
}

function openScoreModal() {
  const p = points();
  if (p === 0) return;
  $('scoreText').innerHTML = `Tu as <strong>${p} point${p > 1 ? 's' : ''}</strong> (${p} niveau${p > 1 ? 'x' : ''} réussi${p > 1 ? 's' : ''} sur ${MAX_POINTS}).`;
  scoreForm.hidden = false;
  scoreSaved.textContent = '';
  $('closeScore').hidden = true;
  scoreModal.hidden = false;
  pseudoInput.focus();
}
openScoreBtn.addEventListener('click', openScoreModal);
$('endScoreBtn').addEventListener('click', openScoreModal);
$('skipScore').addEventListener('click', () => { scoreModal.hidden = true; });
$('closeScore').addEventListener('click', () => { scoreModal.hidden = true; });

$('saveScore').addEventListener('click', async () => {
  const name = pseudoInput.value.trim();
  if (!name) {
    pseudoInput.focus();
    return;
  }
  const p = points();
  const saveBtn = $('saveScore');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Envoi…';
  const ok = await submitScore(GAME_ID, name, encodeScore(p));
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer mon score';
  if (ok) {
    savedForPoints = p;
    scoreForm.hidden = true;
    scoreSaved.textContent = 'Score enregistré ! 🎉';
    scoreSaved.style.color = 'var(--green)';
    $('closeScore').hidden = false;
    $('endScoreBtn').disabled = true;
    renderPoints();
    renderLeaderboard();
  } else {
    scoreSaved.textContent = "Oups, l'enregistrement a échoué. Réessaie !";
    scoreSaved.style.color = 'var(--red)';
  }
});
pseudoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('saveScore').click(); });

/* ---------- C'est parti ! ---------- */
$('controller').innerHTML = CONTROLLER_SVG;
buildWagon();
buildQuai();
renderSoundBtn();
renderPoints();
renderLeaderboard();
showStart();
