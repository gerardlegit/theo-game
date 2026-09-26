import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";
import { FLOORS } from "./words.js";
import { ladySVG } from "./lady.js";

const GAME_ID = "english-etages";
const CARDS_PER_FLOOR = 5;
const SHOW_WORD_MS = 6000;   // temps pendant lequel le mot reste affiché

const $ = (id) => document.getElementById(id);
const facade = $('facade');
const buildingWrap = $('buildingWrap');
const gameLady = $('gameLady');
const clockEl = $('clock');
const floorNumEl = $('floorNum');
const cardNumEl = $('cardNum');
const intro = $('intro');
const introLady = $('introLady');
const qOverlay = $('qOverlay');
const qWhere = $('qWhere');
const qInstr = $('qInstr');
const qShow = $('qShow');
const qWord = $('qWord');
const qBar = $('qBar');
const qAnswer = $('qAnswer');
const qChoices = $('qChoices');
const qFeedback = $('qFeedback');
const toast = $('toast');
const endOverlay = $('endOverlay');
const endStage = $('endStage');
const endLady = $('endLady');
const endTitle = $('endTitle');
const endText = $('endText');
const scoreForm = $('scoreForm');
const pseudoInput = $('pseudoInput');
const scoreSaved = $('scoreSaved');
const leaderboardList = $('leaderboardList');

gameLady.innerHTML = ladySVG();
introLady.innerHTML = ladySVG();
endLady.innerHTML = ladySVG();

let deck = [];           // deck[étage][carte] = { en, fr, prompt, answer, choices }
let floor = 0;           // étage en cours (0 = 1er étage)
let cardsDone = 0;       // cartes réussies à l'étage en cours
let lock = false;
let startTime = 0;
let clockTimer = null;
let finalSeconds = null;
let showTimer = null;
let currentCard = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Étages impairs (1, 3, 5…) : anglais → français. Étages pairs : français → anglais. */
const isEnglishFirst = (floorIdx) => (floorIdx + 1) % 2 === 1;

function buildDeck() {
  return FLOORS.map((f, floorIdx) => {
    const englishFirst = isEnglishFirst(floorIdx);
    const words = shuffle(f.words);
    return words.slice(0, CARDS_PER_FLOOR).map(([en, fr]) => {
      const others = shuffle(f.words.filter((w) => w[0] !== en)).slice(0, 3);
      const pick = (w) => (englishFirst ? w[1] : w[0]);
      return {
        en,
        fr,
        prompt: englishFirst ? en : fr,
        answer: englishFirst ? fr : en,
        choices: shuffle([pick([en, fr]), ...others.map(pick)]),
      };
    });
  });
}

/* ---------- Chronomètre ---------- */
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
const elapsed = () => (performance.now() - startTime) / 1000;

function startClock() {
  startTime = performance.now();
  clearInterval(clockTimer);
  clockTimer = setInterval(() => { clockEl.textContent = formatTime(elapsed()); }, 250);
}
function stopClock() {
  clearInterval(clockTimer);
  clockTimer = null;
  finalSeconds = Math.max(1, Math.round(elapsed()));
  clockEl.textContent = formatTime(finalSeconds);
}

/* ---------- Voix anglaise ---------- */
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let englishVoice = null;
function pickVoice() {
  const voices = synth.getVoices();
  englishVoice = voices.find((v) => v.lang === 'en-GB')
    || voices.find((v) => v.lang.startsWith('en'))
    || null;
}
if (synth) {
  pickVoice();
  synth.addEventListener('voiceschanged', pickVoice);
} else {
  document.body.classList.add('no-speech');
}

function speakEnglish(text) {
  if (!synth) return;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = englishVoice ? englishVoice.lang : 'en-GB';
  if (englishVoice) utter.voice = englishVoice;
  utter.rate = 0.85;
  synth.speak(utter);
}

/* ---------- L'immeuble haussmannien ---------- */
const ordinal = (n) => (n === 1 ? '1<sup>er</sup>' : `${n}<sup>e</sup>`);

function buildFacade(target, interactive) {
  target.innerHTML = '';

  const roof = document.createElement('div');
  roof.className = 'roof';
  roof.innerHTML = `
    <span class="chimney ch1"></span><span class="chimney ch2"></span>
    <div class="dormers">${'<span class="dormer"></span>'.repeat(5)}</div>`;
  target.appendChild(roof);
  target.insertAdjacentHTML('beforeend', '<div class="cornice"></div>');

  for (let n = FLOORS.length; n >= 1; n--) {
    const floorEl = document.createElement('div');
    // balcons filants aux 2e, 5e et 8e étages, comme sur les vrais immeubles
    floorEl.className = `floor${[2, 5, 8].includes(n) ? ' long-balcony' : ''}`;
    floorEl.dataset.floor = String(n);
    floorEl.innerHTML = `<div class="floor-side"></div><div class="windows"></div><div class="floor-num"><span class="plaque">${ordinal(n)}</span></div>`;
    const windows = floorEl.querySelector('.windows');

    for (let c = 0; c < CARDS_PER_FLOOR; c++) {
      const win = document.createElement(interactive ? 'button' : 'div');
      win.className = 'win';
      win.innerHTML = `
        <span class="pane"><span class="win-word"></span></span>
        <span class="shutter sl"></span><span class="shutter sr"></span>`;
      if (interactive) {
        win.setAttribute('aria-label', `Étage ${n}, carte ${c + 1}`);
        win.addEventListener('click', () => openCard(n - 1, c, win));
      }
      windows.appendChild(win);
    }
    target.appendChild(floorEl);
  }

  target.insertAdjacentHTML('beforeend', `
    <div class="ground">
      <div class="ground-side"></div>
      <div class="shop"><span>Boulangerie</span></div>
      <div class="porte"><span class="porte-num">10</span></div>
      <div class="shop"><span>Café</span></div>
      <div class="ground-side"></div>
    </div>
    <div class="sidewalk"></div>`);
}

const floorEl = (floorIdx) => facade.querySelector(`.floor[data-floor="${floorIdx + 1}"]`);

function refreshFloors() {
  facade.querySelectorAll('.floor').forEach((el) => {
    const idx = Number(el.dataset.floor) - 1;
    el.classList.toggle('done', idx < floor);
    el.classList.toggle('current', idx === floor);
    el.classList.toggle('locked', idx > floor);
  });
  floorNumEl.textContent = String(floor + 1);
  cardNumEl.textContent = String(cardsDone);
}

/* Colette se tient sur le balcon de l'étage en cours */
function placeLady(floorIdx, animate) {
  const el = floorEl(floorIdx);
  if (!el) return;
  const side = el.querySelector('.floor-side');
  const wrapBox = buildingWrap.getBoundingClientRect();
  const floorBox = el.getBoundingClientRect();
  const sideBox = side.getBoundingClientRect();
  const height = floorBox.height * 0.9;
  const width = height * 100 / 230;

  gameLady.classList.toggle('moving', animate);
  gameLady.style.height = `${height}px`;
  gameLady.style.width = `${width}px`;
  gameLady.style.top = `${floorBox.bottom - wrapBox.top - height}px`;
  gameLady.style.left = `${sideBox.left - wrapBox.left + (sideBox.width - width) / 2}px`;

  if (animate) {
    gameLady.classList.add('walking');
    setTimeout(() => gameLady.classList.remove('walking', 'moving'), 1300);
  }
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- Une carte ---------- */
function openCard(floorIdx, cardIdx, win) {
  if (lock || floorIdx !== floor || win.classList.contains('open')) return;
  lock = true;
  const card = deck[floorIdx][cardIdx];
  const englishFirst = isEnglishFirst(floorIdx);
  currentCard = { card, win, englishFirst };

  win.classList.add('peek');
  qWhere.innerHTML = `${ordinal(floorIdx + 1)} étage · carte ${cardsDone + 1} / ${CARDS_PER_FLOOR}`;
  qInstr.textContent = englishFirst ? 'Voici un mot en anglais :' : 'Voici un mot en français :';
  qWord.textContent = card.prompt;
  qWord.lang = englishFirst ? 'en' : 'fr';
  qShow.classList.toggle('french', !englishFirst);
  qShow.style.display = '';
  qAnswer.style.display = 'none';

  // barre du temps restant avant que le mot disparaisse
  qBar.style.transition = 'none';
  qBar.style.width = '100%';
  void qBar.offsetWidth;
  qBar.style.transition = `width ${SHOW_WORD_MS}ms linear`;
  qBar.style.width = '0%';

  qOverlay.classList.add('show');
  clearTimeout(showTimer);
  showTimer = setTimeout(showChoices, SHOW_WORD_MS);
}

function showChoices() {
  clearTimeout(showTimer);
  const { card, englishFirst } = currentCard;
  qInstr.textContent = englishFirst
    ? 'Que veut dire ce mot en français ?'
    : 'Comment dit-on ce mot en anglais ?';
  qShow.style.display = 'none';
  qAnswer.style.display = '';
  qAnswer.classList.toggle('french', !englishFirst);
  qFeedback.textContent = '';
  qFeedback.className = 'q-feedback';
  qChoices.innerHTML = '';

  card.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.textContent = choice;
    btn.lang = englishFirst ? 'fr' : 'en';
    btn.addEventListener('click', () => onChoice(btn, choice));
    qChoices.appendChild(btn);
  });
}

function onChoice(btn, choice) {
  const { card, win, englishFirst } = currentCard;
  if (btn.disabled) return;
  const isRight = choice === card.answer;

  qChoices.querySelectorAll('.choice').forEach((b) => {
    b.disabled = true;
    if (b.textContent === card.answer) b.classList.add('right');
  });

  if (isRight) {
    qFeedback.textContent = 'Bravo ! 🎉';
    qFeedback.classList.add('ok');
    if (!englishFirst) speakEnglish(card.en);
    setTimeout(() => {
      qOverlay.classList.remove('show');
      win.classList.remove('peek');
      win.classList.add('open');
      win.querySelector('.win-word').textContent = card.en;
      win.setAttribute('aria-label', `${card.en} : ${card.fr}`);
      cardsDone++;
      refreshFloors();
      if (cardsDone === CARDS_PER_FLOOR) floorComplete();
      else lock = false;
    }, 1300);
  } else {
    btn.classList.add('wrong');
    qFeedback.textContent = `Dommage… c'était « ${card.answer} »`;
    qFeedback.classList.add('ko');
    stopClock();
    setTimeout(() => {
      qOverlay.classList.remove('show');
      win.classList.remove('peek');
      win.classList.add('failed');
      showEnd(false, card);
    }, 2800);
  }
}

function floorComplete() {
  if (floor === FLOORS.length - 1) {
    stopClock();
    showToast('Tout en haut ! 🎉');
    setTimeout(() => showEnd(true), 1200);
    return;
  }
  showToast(`${floor + 1 === 1 ? '1er' : `${floor + 1}e`} étage réussi ! On monte ⬆️`);
  floor++;
  cardsDone = 0;
  refreshFloors();
  placeLady(floor, true);
  floorEl(floor).scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { lock = false; }, 1300);
}

/* ---------- Fin de partie : la danse de Colette ---------- */
function showEnd(won, failedCard) {
  endStage.className = `end-stage ${won ? 'is-win' : 'is-lose'}`;
  endLady.className = `lady lady-end ${won ? 'dance-happy' : 'dance-sad'}`;
  if (won) {
    endTitle.textContent = 'Bravo, vous êtes au sommet ! 🎉';
    endText.textContent = `Les 10 étages sans une seule erreur, en ${formatTime(finalSeconds)} !`;
    scoreForm.style.display = 'block';
  } else {
    endTitle.textContent = 'Oh non… 😢';
    endText.textContent = `« ${failedCard.prompt} » se dit « ${failedCard.answer} ». Colette s'est arrêtée au ${floor + 1 === 1 ? '1er' : `${floor + 1}e`} étage.`;
    scoreForm.style.display = 'none';
  }
  scoreSaved.style.display = 'none';
  pseudoInput.value = '';
  endOverlay.classList.add('show');
}

/* ---------- Introduction ---------- */
function showIntro() {
  intro.classList.remove('show', 'played');
  void intro.offsetWidth; // relance l'animation d'arrivée
  intro.classList.add('show', 'played');
}

function resetGame() {
  clearInterval(clockTimer);
  clearTimeout(showTimer);
  if (synth) synth.cancel();
  deck = buildDeck();
  floor = 0;
  cardsDone = 0;
  lock = false;
  finalSeconds = null;
  clockEl.textContent = '0:00';
  qOverlay.classList.remove('show');
  endOverlay.classList.remove('show');
  buildFacade(facade, true);
  refreshFloors();
  requestAnimationFrame(() => placeLady(0, false));
}

function startGame() {
  intro.classList.remove('show');
  placeLady(0, false);
  floorEl(0).scrollIntoView({ behavior: 'smooth', block: 'center' });
  startClock();
}

$('startBtn').addEventListener('click', startGame);
$('restart').addEventListener('click', () => { resetGame(); showIntro(); });
$('playAgain').addEventListener('click', () => { resetGame(); showIntro(); });
$('readyBtn').addEventListener('click', showChoices);
$('listenBtn').addEventListener('click', () => speakEnglish(currentCard.card.en));
$('relistenBtn').addEventListener('click', () => speakEnglish(currentCard.card.en));
window.addEventListener('resize', () => placeLady(floor, false));

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
    leaderboardList.innerHTML = '<li class="leaderboard-empty" style="display:block;">Soyez le premier du classement mondial !</li>';
    return;
  }

  list.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-time">${formatTime(entry.value)}</span>
    `;
    leaderboardList.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
  const ok = await submitScore(GAME_ID, name, finalSeconds);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer mon temps';

  if (ok) {
    scoreForm.style.display = 'none';
    scoreSaved.textContent = 'Temps enregistré ! 🎉';
    scoreSaved.style.color = 'var(--green)';
    scoreSaved.style.display = 'block';
    renderLeaderboard();
  } else {
    scoreSaved.textContent = "Oups, l'enregistrement a échoué. Réessayez !";
    scoreSaved.style.color = 'var(--red)';
    scoreSaved.style.display = 'block';
  }
});

$('skipScore').addEventListener('click', () => {
  scoreForm.style.display = 'none';
});

/* ---------- Démarrage ---------- */
buildFacade($('miniFacade'), false);
renderLeaderboard();
resetGame();
showIntro();
