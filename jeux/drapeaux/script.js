import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";

const GAME_ID = "drapeaux";
const BOARD_SIZE = 64;

const board = document.getElementById('board');
const foundEl = document.getElementById('found');
const progressFill = document.getElementById('progressFill');
const timerEl = document.getElementById('timer');
const wrongEl = document.getElementById('wrongCount');

const quizOverlay = document.getElementById('quizOverlay');
const quizFlag = document.getElementById('quizFlag');
const quizOptions = document.getElementById('quizOptions');
const feedback = document.getElementById('feedback');

const sheetOverlay = document.getElementById('sheetOverlay');
const sheetFlag = document.getElementById('sheetFlag');
const sheetName = document.getElementById('sheetName');
const sheetContinent = document.getElementById('sheetContinent');
const sheetPopulation = document.getElementById('sheetPopulation');
const sheetFact = document.getElementById('sheetFact');

const winBanner = document.getElementById('winBanner');
const winTime = document.getElementById('winTime');
const confettiLayer = document.getElementById('confettiLayer');
const scoreForm = document.getElementById('scoreForm');
const pseudoInput = document.getElementById('pseudoInput');
const scoreSaved = document.getElementById('scoreSaved');
const leaderboardList = document.getElementById('leaderboardList');

let boardCountries = [];
let found = new Set();
let currentCountry = null;
let currentTile = null;
let busy = false;

let elapsedSeconds = 0;
let timerInterval = null;
let finalTime = null;
let wrongAnswers = 0;
let finalScore = null;

const POINTS_PER_SECOND = 1;
const POINTS_PER_WRONG_ANSWER = 10;

function flagHtml(code, square) {
  const cls = square ? `fi fi-${code.toLowerCase()} fis` : `fi fi-${code.toLowerCase()}`;
  return `<span class="${cls}" aria-hidden="true"></span>`;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Chronomètre ---------- */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  timerEl.textContent = formatTime(0);
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    timerEl.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/* ---------- Plateau ---------- */
function buildBoard() {
  board.innerHTML = '';
  found = new Set();
  finalTime = null;
  finalScore = null;
  wrongAnswers = 0;
  wrongEl.textContent = '0';
  boardCountries = shuffle(COUNTRIES).slice(0, BOARD_SIZE);
  updateHud();
  startTimer();

  boardCountries.forEach((country) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.setAttribute('aria-label', 'Drapeau mystère');
    tile.dataset.code = country.code;
    tile.innerHTML = `${flagHtml(country.code, true)}<span class="tile-check">✓</span>`;
    tile.addEventListener('click', () => onTileClick(tile, country));
    board.appendChild(tile);
  });
}

function updateHud() {
  foundEl.textContent = String(found.size);
  progressFill.style.width = `${(found.size / BOARD_SIZE) * 100}%`;
}

function onTileClick(tile, country) {
  if (busy) return;
  if (found.has(country.code)) {
    openSheet(country, true);
    return;
  }
  openQuiz(tile, country);
}

function openQuiz(tile, country) {
  currentCountry = country;
  currentTile = tile;
  busy = true;

  quizFlag.innerHTML = flagHtml(country.code, false);
  feedback.textContent = '';
  feedback.className = 'feedback';

  const distractors = shuffle(
    COUNTRIES.filter((c) => c.code !== country.code)
  ).slice(0, 3);
  const options = shuffle([country, ...distractors]);

  quizOptions.innerHTML = '';
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.textContent = opt.name;
    btn.addEventListener('click', () => onAnswer(btn, opt));
    quizOptions.appendChild(btn);
  });

  quizOverlay.classList.add('show');
}

function onAnswer(btn, chosen) {
  const buttons = Array.from(quizOptions.children);
  buttons.forEach((b) => (b.disabled = true));

  if (chosen.code === currentCountry.code) {
    btn.classList.add('correct');
    feedback.textContent = 'Bravo, bonne réponse ! 🎉';
    feedback.className = 'feedback good';
    found.add(currentCountry.code);
    updateHud();
    currentTile.classList.add('found', 'pop');
    setTimeout(() => currentTile.classList.remove('pop'), 500);

    setTimeout(() => {
      quizOverlay.classList.remove('show');
      openSheet(currentCountry, false);
    }, 700);
  } else {
    btn.classList.add('wrong');
    const correctBtn = buttons.find((b) => b.textContent === currentCountry.name);
    if (correctBtn) correctBtn.classList.add('correct');
    feedback.textContent = 'Oups, ce n\'est pas ça… le drapeau reprend sa forme !';
    feedback.className = 'feedback bad';
    currentTile.classList.add('shake');
    setTimeout(() => currentTile.classList.remove('shake'), 500);

    wrongAnswers += 1;
    wrongEl.textContent = String(wrongAnswers);

    setTimeout(() => {
      quizOverlay.classList.remove('show');
      busy = false;
    }, 1100);
  }
}

function openSheet(country, fromAlreadyFound) {
  sheetFlag.innerHTML = flagHtml(country.code, false);
  sheetName.textContent = country.name;
  sheetContinent.textContent = country.continent;
  sheetPopulation.textContent = country.population;
  sheetFact.textContent = country.fact;
  sheetOverlay.classList.add('show');

  if (!fromAlreadyFound) {
    launchConfetti();
  }
}

document.getElementById('closeSheet').addEventListener('click', () => {
  sheetOverlay.classList.remove('show');
  busy = false;
  if (found.size === BOARD_SIZE) {
    finalTime = elapsedSeconds;
    finalScore = finalTime * POINTS_PER_SECOND + wrongAnswers * POINTS_PER_WRONG_ANSWER;
    stopTimer();
    setTimeout(() => showWin(), 300);
  }
});

document.getElementById('restart').addEventListener('click', () => {
  winBanner.classList.remove('show');
  buildBoard();
});
document.getElementById('playAgain').addEventListener('click', () => {
  winBanner.classList.remove('show');
  buildBoard();
});

function launchConfetti() {
  const pieces = ['🎉', '⭐', '🎊', '✨', '🏆'];
  for (let i = 0; i < 16; i++) {
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

/* ---------- Victoire + classement ---------- */
function showWin() {
  const wrongLabel = wrongAnswers === 0
    ? 'aucune erreur'
    : wrongAnswers === 1
      ? '1 erreur'
      : `${wrongAnswers} erreurs`;
  winTime.textContent =
    `Trouvé en ${formatTime(finalTime)} avec ${wrongLabel} → Score : ${finalScore} points !`;
  scoreForm.style.display = 'block';
  scoreSaved.style.display = 'none';
  pseudoInput.value = '';
  winBanner.classList.add('show');
  launchConfetti();
}

async function addScore(name, points) {
  return submitScore(GAME_ID, name, points);
}

async function renderLeaderboard() {
  if (!isLeaderboardConfigured()) {
    leaderboardList.innerHTML =
      '<li class="leaderboard-empty" style="display:block;">Classement mondial pas encore activé sur ce site (configuration Firebase à faire par l\'administrateur).</li>';
    return;
  }

  leaderboardList.innerHTML = '<li class="leaderboard-empty" style="display:block;">Chargement…</li>';
  const list = await fetchTopScores(GAME_ID, 20);
  leaderboardList.innerHTML = '';

  if (list.length === 0) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty" style="display:block;">Sois le premier du classement mondial !</li>';
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
  const ok = await addScore(name, finalScore);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer mon score';

  if (ok) {
    scoreForm.style.display = 'none';
    scoreSaved.style.display = 'block';
    renderLeaderboard();
  } else {
    feedback.textContent = '';
    scoreSaved.textContent = "Oups, l'enregistrement a échoué. Réessaie !";
    scoreSaved.style.display = 'block';
    scoreSaved.style.color = 'var(--red)';
  }
});

document.getElementById('skipScore').addEventListener('click', () => {
  scoreForm.style.display = 'none';
});

/* ---------- Démarrage ---------- */
renderLeaderboard();
buildBoard();
