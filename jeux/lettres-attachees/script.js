import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";
import {
  LETTERS, SYLLABLES, SOUNDS, VOWELS, LOOKALIKE_LETTERS, LOOKALIKE_CONSONANTS,
} from "./data.js";

const GAME_ID = "lettres-attachees";
const TOTAL_CARDS = 25;
// Répartition des 25 cartes d'une partie
const MIX = { letter: 10, syllable: 10, sound: 5 };

const board = document.getElementById('board');
const doneEl = document.getElementById('done');
const goodEl = document.getElementById('good');
const overlay = document.getElementById('questionOverlay');
const questionHint = document.getElementById('questionHint');
const questionModel = document.getElementById('questionModel');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const winBanner = document.getElementById('winBanner');
const winStars = document.getElementById('winStars');
const winStats = document.getElementById('winStats');
const scoreForm = document.getElementById('scoreForm');
const pseudoInput = document.getElementById('pseudoInput');
const scoreSaved = document.getElementById('scoreSaved');
const leaderboardList = document.getElementById('leaderboardList');

/* ---------- Classement : le module partagé classe "le plus petit d'abord" ----------
 * On enregistre donc (25 − bonnes réponses + 1), toujours > 0.
 */
const encodeScore = (good) => TOTAL_CARDS - good + 1;
const decodeScore = (value) => TOTAL_CARDS + 1 - value;

let deck = [];
let done = 0;
let good = 0;
let lock = false;
let finalGood = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Pièges : des propositions qui ressemblent à la bonne ---------- */
function distractorsFor(item) {
  const { text, kind } = item;
  let candidates = [];

  if (kind === 'letter') {
    candidates = shuffle(LOOKALIKE_LETTERS[text]);
  } else if (kind === 'syllable') {
    const [c, v] = text;
    // un piège sur la consonne (ou la syllabe à l'envers : ma → am)…
    const consonantTraps = shuffle([v + c, ...LOOKALIKE_CONSONANTS[c].map((x) => x + v)]);
    // …et un piège sur la voyelle (ma → mo)
    const vowelTraps = shuffle(VOWELS.filter((x) => x !== v).map((x) => c + x));
    candidates = [consonantTraps[0], vowelTraps[0], ...consonantTraps.slice(1), ...vowelTraps.slice(1)];
  } else {
    const reversed = text[1] + text[0];
    const sharing = shuffle(SOUNDS.filter((s) => s !== text && (s.includes(text[0]) || s.includes(text[1]))));
    candidates = [...shuffle([reversed, sharing[0]]), ...sharing.slice(1), ...shuffle(SOUNDS)];
  }

  const traps = [];
  for (const c of candidates) {
    if (c && c !== text && !traps.includes(c)) traps.push(c);
    if (traps.length === 2) break;
  }
  return traps;
}

function buildDeck() {
  const items = [
    ...shuffle(LETTERS).slice(0, MIX.letter).map((text) => ({ text, kind: 'letter' })),
    ...shuffle(SYLLABLES).slice(0, MIX.syllable).map((text) => ({ text, kind: 'syllable' })),
    ...shuffle(SOUNDS).slice(0, MIX.sound).map((text) => ({ text, kind: 'sound' })),
  ];
  // Moitié des cartes en MAJUSCULES, moitié en écriture attachée
  const scripts = shuffle(items.map((_, i) => (i % 2 === 0 ? 'print' : 'cursive')));
  return shuffle(items).map((item, i) => {
    const script = scripts[i];
    const answerScript = script === 'print' ? 'cursive' : 'print';
    return {
      ...item,
      script,
      answerScript,
      choices: shuffle([item.text, ...distractorsFor(item)]),
      answered: false,
    };
  });
}

/* ---------- Affichage d'un texte dans une écriture ---------- */
function writtenAs(text, script) {
  const span = document.createElement('span');
  span.className = `writing ${script}`;
  span.textContent = script === 'print' ? text.toUpperCase() : text;
  return span;
}

function buildBoard() {
  board.innerHTML = '';
  deck = buildDeck();
  done = 0;
  good = 0;
  lock = false;
  finalGood = null;
  doneEl.textContent = '0';
  goodEl.textContent = '0';
  winBanner.classList.remove('show');
  overlay.classList.remove('show');

  deck.forEach((card, i) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.setAttribute('aria-label', `Carte ${i + 1}`);
    tile.innerHTML = `
      <div class="tile-inner">
        <div class="tile-face tile-back"><span>?</span></div>
        <div class="tile-face tile-front"><span class="tile-badge"></span></div>
      </div>
    `;
    tile.querySelector('.tile-front').prepend(writtenAs(card.text, card.script));
    tile.addEventListener('click', () => onTileClick(tile, card));
    board.appendChild(tile);
  });
}

/* ---------- Une carte : question en grand ---------- */
function hintFor(card) {
  return card.answerScript === 'cursive'
    ? "Trouve la même en écriture attachée"
    : "Trouve la même en majuscules";
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'fr-FR';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

function onTileClick(tile, card) {
  if (lock || card.answered) return;
  lock = true;
  tile.classList.add('flipped');
  setTimeout(() => openQuestion(tile, card), 450);
}

function openQuestion(tile, card) {
  questionHint.textContent = hintFor(card);
  questionModel.innerHTML = '';
  questionModel.appendChild(writtenAs(card.text, card.script));
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  choicesEl.innerHTML = '';

  card.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.dataset.value = choice;
    btn.appendChild(writtenAs(choice, card.answerScript));
    btn.addEventListener('click', () => onChoice(tile, card, btn));
    choicesEl.appendChild(btn);
  });

  overlay.classList.add('show');
  document.getElementById('speakBtn').onclick = () => speak(hintFor(card));
}

function onChoice(tile, card, btn) {
  if (card.answered) return;
  card.answered = true;
  const isRight = btn.dataset.value === card.text;

  choicesEl.querySelectorAll('.choice').forEach((b) => {
    b.disabled = true;
    if (b.dataset.value === card.text) b.classList.add('right');
  });

  if (isRight) {
    good++;
    feedbackEl.textContent = 'Bravo ! 🎉';
    feedbackEl.classList.add('ok');
  } else {
    btn.classList.add('wrong');
    feedbackEl.textContent = "Oups ! C'était celle-là 👆";
    feedbackEl.classList.add('ko');
  }
  done++;

  setTimeout(() => {
    overlay.classList.remove('show');
    tile.classList.add(isRight ? 'right' : 'wrong');
    tile.querySelector('.tile-badge').textContent = isRight ? '✓' : '✗';
    tile.setAttribute('aria-label', `${card.text} : ${isRight ? 'réussie' : 'ratée'}`);
    doneEl.textContent = String(done);
    goodEl.textContent = String(good);
    lock = false;
    if (done === TOTAL_CARDS) {
      finalGood = good;
      setTimeout(showWin, 500);
    }
  }, isRight ? 1200 : 2200);
}

function showWin() {
  const stars = finalGood >= 23 ? 3 : finalGood >= 16 ? 2 : 1;
  winStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  winStats.textContent = `Tu as trouvé ${finalGood} bonne${finalGood > 1 ? 's' : ''} réponse${finalGood > 1 ? 's' : ''} sur ${TOTAL_CARDS} !`;
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
      <span class="lb-time">${decodeScore(entry.value)} / ${TOTAL_CARDS}</span>
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
  const ok = await submitScore(GAME_ID, name, encodeScore(finalGood));
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
