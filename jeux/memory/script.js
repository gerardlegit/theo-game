import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";

const GAME_ID = "memory";
const ANIMALS = ['🐶','🐱','🦊','🐼','🦁','🐸','🐵','🐨'];

const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const foundEl = document.getElementById('found');
const winBanner = document.getElementById('winBanner');
const winStats = document.getElementById('winStats');
const scoreForm = document.getElementById('scoreForm');
const pseudoInput = document.getElementById('pseudoInput');
const scoreSaved = document.getElementById('scoreSaved');
const leaderboardList = document.getElementById('leaderboardList');

let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let lock = false;
let finalMoves = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBoard() {
  board.innerHTML = '';
  cards = shuffle([...ANIMALS, ...ANIMALS]);
  flipped = [];
  matched = 0;
  moves = 0;
  lock = false;
  finalMoves = null;
  movesEl.textContent = '0';
  foundEl.textContent = '0';
  winBanner.classList.remove('show');

  cards.forEach((animal, i) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.setAttribute('aria-label', 'Carte retournée');
    tile.dataset.animal = animal;
    tile.dataset.index = i;
    tile.innerHTML = `
      <div class="tile-inner">
        <div class="tile-face tile-back">?</div>
        <div class="tile-face tile-front">${animal}</div>
      </div>
    `;
    tile.addEventListener('click', () => onTileClick(tile));
    board.appendChild(tile);
  });
}

function onTileClick(tile) {
  if (lock) return;
  if (tile.classList.contains('flipped') || tile.classList.contains('matched')) return;
  if (flipped.length === 2) return;

  tile.classList.add('flipped');
  flipped.push(tile);

  if (flipped.length === 2) {
    moves++;
    movesEl.textContent = String(moves);
    lock = true;
    const [a, b] = flipped;
    if (a.dataset.animal === b.dataset.animal) {
      setTimeout(() => {
        a.classList.add('matched');
        b.classList.add('matched');
        matched++;
        foundEl.textContent = String(matched);
        flipped = [];
        lock = false;
        if (matched === ANIMALS.length) {
          finalMoves = moves;
          showWin();
        }
      }, 500);
    } else {
      setTimeout(() => {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        flipped = [];
        lock = false;
      }, 800);
    }
  }
}

function showWin() {
  winStats.textContent = `Terminé en ${finalMoves} coups !`;
  scoreForm.style.display = 'block';
  scoreSaved.style.display = 'none';
  scoreSaved.style.color = 'var(--green)';
  pseudoInput.value = '';
  winBanner.classList.add('show');
}

document.getElementById('restart').addEventListener('click', buildBoard);
document.getElementById('playAgain').addEventListener('click', buildBoard);

/* ---------- Classement mondial ---------- */
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
      <span class="lb-time">${entry.value} coups</span>
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
  const ok = await submitScore(GAME_ID, name, finalMoves);
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
renderLeaderboard();
buildBoard();
