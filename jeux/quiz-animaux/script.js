import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";
import { ANIMALS, imageUrl } from "./data.js";

const GAME_ID = "quiz-animaux";
const TIME_PER_ANIMAL = 10000;     // 10 secondes pour trouver chaque animal
const HURRY_AT = 3000;             // le compte à rebours passe au rouge
const TOTAL = ANIMALS.length;      // 64
const RING_LENGTH = 2 * Math.PI * 44;

/* ---------- Éléments de la page ---------- */
const grid = document.getElementById('grid');
const pointsEl = document.getElementById('points');
const questionNumEl = document.getElementById('questionNum');
const questionTotalEl = document.getElementById('questionTotal');
const questionEl = document.getElementById('question');
const questionNameEl = document.getElementById('questionName');
const countdownEl = document.getElementById('countdown');
const countdownNumEl = document.getElementById('countdownNum');
const countdownRing = document.getElementById('countdownRing');
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');

const winBanner = document.getElementById('winBanner');
const winTitle = document.getElementById('winTitle');
const winStats = document.getElementById('winStats');
const confettiLayer = document.getElementById('confettiLayer');
const scoreForm = document.getElementById('scoreForm');
const pseudoInput = document.getElementById('pseudoInput');
const scoreSaved = document.getElementById('scoreSaved');
const leaderboardList = document.getElementById('leaderboardList');

/* ---------- État ---------- */
let state = 'loading';             // 'loading' | 'ready' | 'asking' | 'feedback' | 'done'
let order = [];                    // ordre des questions
let index = 0;
let points = 0;
let totalResponseMs = 0;           // pour départager les égalités
let tilesById = new Map();
let askedAt = 0;
let rafId = null;
let timeoutId = null;
let nextTimeout = null;

/* ---------- Classement : le module partagé classe "le plus petit d'abord" ----------
 * On range donc (animaux ratés, puis temps de réponse) dans un seul nombre :
 *   valeur = ratés × 10000 + temps total en dixièmes de seconde + 1
 * (le temps total ne dépasse jamais 64 × 10 s = 6400 dixièmes).
 */
const encodeScore = (pts, ms) => (TOTAL - pts) * 10000 + Math.round(ms / 100) + 1;
const decodePoints = (value) => TOTAL - Math.floor((value - 1) / 10000);

/* ---------- Utilitaires ---------- */
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

/* ---------- Préchargement des 64 dessins ---------- */
function preloadImages() {
  let loaded = 0;
  return Promise.all(ANIMALS.map((animal) => new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded += 1;
      startBtn.textContent = `Chargement des animaux… ${loaded} / ${TOTAL}`;
      resolve();
    };
    img.src = imageUrl(animal);
  })));
}

/* ---------- Plateau ---------- */
function buildGrid() {
  grid.innerHTML = '';
  tilesById = new Map();
  shuffle(ANIMALS).forEach((animal) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.dataset.id = animal.id;
    const img = document.createElement('img');
    img.src = imageUrl(animal);
    img.alt = animal.name;
    img.draggable = false;
    // Si une image ne charge pas, on affiche au moins le nom
    img.onerror = () => { tile.classList.add('no-image'); tile.textContent = animal.name; };
    tile.appendChild(img);
    tile.addEventListener('click', () => onTileClick(tile));
    grid.appendChild(tile);
    tilesById.set(animal.id, tile);
  });
}

function newGame() {
  cancelTimers();
  order = shuffle(ANIMALS);
  index = 0;
  points = 0;
  totalResponseMs = 0;
  pointsEl.textContent = '0';
  questionNumEl.textContent = '0';
  questionTotalEl.textContent = String(TOTAL);
  questionNameEl.textContent = '…';
  setCountdown(TIME_PER_ANIMAL);
  winBanner.classList.remove('show');
  buildGrid();
}

function startGame() {
  if (state !== 'ready') return;
  startOverlay.hidden = true;
  document.body.classList.add('playing');
  askNext();
}

/* ---------- Questions et compte à rebours ---------- */
function setCountdown(remainingMs) {
  const ratio = Math.max(0, remainingMs) / TIME_PER_ANIMAL;
  countdownRing.style.strokeDashoffset = String(RING_LENGTH * (1 - ratio));
  countdownNumEl.textContent = String(Math.ceil(Math.max(0, remainingMs) / 1000));
  countdownEl.classList.toggle('hurry', remainingMs <= HURRY_AT);
}

function askNext() {
  const animal = order[index];
  state = 'asking';
  questionNumEl.textContent = String(index + 1);
  questionNameEl.textContent = animal.the;
  questionEl.classList.remove('pop');
  void questionEl.offsetWidth; // relance l'animation d'apparition
  questionEl.classList.add('pop');
  askedAt = performance.now();
  // Le vrai chrono : un minuteur fiable, même si l'animation est ralentie
  timeoutId = setTimeout(onTimeout, TIME_PER_ANIMAL);
  tick();
}

/** Animation de l'anneau et du chiffre du compte à rebours. */
function tick() {
  setCountdown(TIME_PER_ANIMAL - (performance.now() - askedAt));
  rafId = requestAnimationFrame(tick);
}

function cancelTimers() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  clearTimeout(timeoutId);
  timeoutId = null;
  clearTimeout(nextTimeout);
  nextTimeout = null;
}

function onTileClick(tile) {
  if (state !== 'asking' || tile.classList.contains('asked')) return;
  const animal = order[index];
  cancelTimers();

  if (tile.dataset.id === animal.id) {
    totalResponseMs += performance.now() - askedAt;
    points += 1;
    pointsEl.textContent = String(points);
    tile.classList.add('asked', 'found');
    goNext(700);
  } else {
    totalResponseMs += TIME_PER_ANIMAL;
    tile.classList.add('wrong');
    setTimeout(() => tile.classList.remove('wrong'), 500);
    revealMissed(animal);
  }
}

function onTimeout() {
  if (state !== 'asking') return;
  cancelTimers();
  setCountdown(0);
  totalResponseMs += TIME_PER_ANIMAL;
  revealMissed(order[index]);
}

/** Montre où était l'animal raté, pour apprendre, puis passe au suivant. */
function revealMissed(animal) {
  const tile = tilesById.get(animal.id);
  tile.classList.add('asked', 'missed', 'reveal');
  setTimeout(() => tile.classList.remove('reveal'), 1400);
  goNext(1500);
}

function goNext(delay) {
  state = 'feedback';
  nextTimeout = setTimeout(() => {
    index += 1;
    if (index >= TOTAL) finishGame();
    else askNext();
  }, delay);
}

/* ---------- Fin de partie ---------- */
function launchConfetti() {
  const pieces = ['🦁', '🐼', '⭐', '🦒', '✨', '🐸'];
  for (let i = 0; i < 18; i++) {
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
  state = 'done';
  questionNameEl.textContent = '…';
  if (points >= 60) winTitle.textContent = 'Incroyable, expert des animaux ! 🏆';
  else if (points >= 45) winTitle.textContent = 'Super safari ! 🎉';
  else if (points >= 25) winTitle.textContent = 'Bien joué ! 👏';
  else winTitle.textContent = 'Bravo, continue de t\'entraîner ! 💪';
  winStats.innerHTML = `Tu as trouvé <strong>${points} animaux sur ${TOTAL}</strong><br>Ton score : <strong>${points} point${points > 1 ? 's' : ''}</strong>`;
  scoreForm.style.display = points > 0 ? 'block' : 'none';
  scoreSaved.style.display = 'none';
  pseudoInput.value = '';
  winBanner.classList.add('show');
  if (points > 0) launchConfetti();
}

/* ---------- Boutons ---------- */
startBtn.addEventListener('click', startGame);

document.getElementById('restart').addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (state === 'loading') return;
  newGame();
  state = 'ready';
  startGame();
});

document.getElementById('playAgain').addEventListener('click', () => {
  newGame();
  state = 'ready';
  document.body.classList.remove('playing');
  startOverlay.hidden = false;
});

/* ---------- Classement mondial ---------- */
async function renderLeaderboard() {
  if (!isLeaderboardConfigured()) {
    leaderboardList.innerHTML =
      '<li class="leaderboard-empty">Classement mondial pas encore activé sur ce site (configuration Firebase à faire par l\'administrateur).</li>';
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
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-time">${decodePoints(entry.value)} pts</span>
    `;
    leaderboardList.appendChild(li);
  });
}

document.getElementById('saveScore').addEventListener('click', async () => {
  const name = pseudoInput.value.trim();
  if (!name) {
    pseudoInput.focus();
    return;
  }
  const saveBtn = document.getElementById('saveScore');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Envoi…';
  const ok = await submitScore(GAME_ID, name, encodeScore(points, totalResponseMs));
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer mon score';

  if (ok) {
    scoreForm.style.display = 'none';
    scoreSaved.textContent = 'Score enregistré ! 🎉';
    scoreSaved.style.color = 'var(--green)';
    scoreSaved.style.display = 'block';
    renderLeaderboard();
  } else {
    scoreSaved.textContent = "Oups, l'enregistrement a échoué. Réessaie !";
    scoreSaved.style.color = 'var(--red)';
    scoreSaved.style.display = 'block';
  }
});

document.getElementById('skipScore').addEventListener('click', () => {
  scoreForm.style.display = 'none';
});

/* ---------- Démarrage ---------- */
async function init() {
  countdownRing.style.strokeDasharray = String(RING_LENGTH);
  newGame();
  await preloadImages();
  state = 'ready';
  startBtn.disabled = false;
  startBtn.textContent = '🚀 C\'est parti !';
}

init();
renderLeaderboard();
