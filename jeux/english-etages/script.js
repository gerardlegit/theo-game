import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";
import { LEVELS } from "./words.js";
import {
  ladySVG, buildingSVG, eiffelSVG, skylineSVG, pigeonSVG, lampSVG, cafeSVG, FLAG_UK, FLAG_FR,
} from "./art.js";
import { sfx, isSoundOn, toggleSound } from "./sound.js";

const CARDS_PER_FLOOR = 5;
const FLOORS = 10;
const gameIdFor = (level) => `english-etages-${level.id}`;

const $ = (id) => document.getElementById(id);
const screenSelect = $('screenSelect');
const screenClimb = $('screenClimb');
const selectScene = $('selectScene');
const selectLady = $('selectLady');
const buildingsEl = $('buildings');
const climbView = $('climbView');
const tower = $('tower');
const facade = $('facade');
const gameLady = $('gameLady');
const climbSkyline = $('climbSkyline');
const climbEiffel = $('climbEiffel');
const clockEl = $('clock');
const floorNumEl = $('floorNum');
const levelPill = $('levelPill');
const climbHint = $('climbHint');
const qOverlay = $('qOverlay');
const qWhere = $('qWhere');
const qCount = $('qCount');
const qLang = $('qLang');
const qWord = $('qWord');
const qInstr = $('qInstr');
const qShow = $('qShow');
const qBar = $('qBar');
const qAnswer = $('qAnswer');
const qChoices = $('qChoices');
const qFeedback = $('qFeedback');
const relistenBtn = $('relistenBtn');
const listenBtn = $('listenBtn');
const toast = $('toast');
const endScreen = $('endScreen');
const endScene = $('endScene');
const endLady = $('endLady');
const endTitle = $('endTitle');
const endText = $('endText');
const scoreForm = $('scoreForm');
const pseudoInput = $('pseudoInput');
const scoreSaved = $('scoreSaved');
const endRanking = $('endRanking');

let level = null;        // le niveau (l'immeuble) choisi
let deck = [];           // deck[étage][carte] = { en, fr, emoji, prompt, answer, choices }
let floor = 0;           // étage en cours (0 = 1er étage)
let cardsDone = 0;
let lock = false;
let startTime = 0;
let clockTimer = null;
let finalSeconds = null;
let showTimer = null;
let currentCard = null;
let selectReady = false;
let rankTab = 0;

/* ---------- Outils ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ordinalHTML = (n) => (n === 1 ? '1<sup>er</sup>' : `${n}<sup>e</sup>`);
const ordinalText = (n) => (n === 1 ? '1er' : `${n}e`);

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* Étages impairs (1, 3, 5…) : anglais → français. Étages pairs : français → anglais. */
const isEnglishFirst = (floorIdx) => floorIdx % 2 === 0;

function buildDeck(lvl) {
  return lvl.floors.map((f, floorIdx) => {
    const englishFirst = isEnglishFirst(floorIdx);
    const pick = (w) => (englishFirst ? w[1] : w[0]);
    return shuffle(f.words).slice(0, CARDS_PER_FLOOR).map((w) => {
      const others = shuffle(f.words.filter((o) => o !== w)).slice(0, 3);
      return {
        en: w[0],
        fr: w[1],
        emoji: w[2] || f.emoji,
        prompt: englishFirst ? w[0] : w[1],
        answer: englishFirst ? w[1] : w[0],
        choices: shuffle([pick(w), ...others.map(pick)]),
      };
    });
  });
}

/* ---------- Décors ---------- */
function decorate() {
  document.querySelectorAll('[data-sky]').forEach((sky) => {
    sky.innerHTML = `
      <div class="sun"></div>
      <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
      <div class="pigeon p1">${pigeonSVG()}</div>
      <div class="pigeon p2">${pigeonSVG()}</div>`;
  });
  document.querySelectorAll('[data-eiffel]').forEach((el) => { el.innerHTML = eiffelSVG(); });
  document.querySelectorAll('[data-skyline]').forEach((el) => { el.innerHTML = skylineSVG(); });
  document.querySelectorAll('[data-lamp]').forEach((el) => { el.innerHTML = lampSVG(); });
  document.querySelectorAll('[data-cafe]').forEach((el) => { el.innerHTML = cafeSVG(); });
  document.querySelector('[data-flag="uk"]').innerHTML = FLAG_UK;
  document.querySelector('[data-flag="fr"]').innerHTML = FLAG_FR;
  selectLady.innerHTML = ladySVG();
  gameLady.innerHTML = ladySVG();
  endLady.innerHTML = ladySVG();
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
  clockEl.textContent = '0:00';
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

/* ---------- Son ---------- */
function refreshSoundButtons() {
  document.querySelectorAll('.sound-btn').forEach((b) => {
    b.textContent = isSoundOn() ? '🔔' : '🔕';
    b.setAttribute('aria-pressed', String(isSoundOn()));
  });
}
document.querySelectorAll('.sound-btn').forEach((b) => b.addEventListener('click', () => {
  toggleSound();
  refreshSoundButtons();
  sfx.tap();
}));

/* ---------- Fenêtres superposées ---------- */
function openSheet(el) { el.hidden = false; }
function closeSheet(el) { el.hidden = true; }
document.querySelectorAll('[data-close]').forEach((b) =>
  b.addEventListener('click', () => closeSheet(b.closest('.sheet-overlay'))));

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ================================================================
   ÉCRAN 1 : Colette arrive dans la rue, trois immeubles apparaissent
   ================================================================ */
function buildBuildings() {
  buildingsEl.innerHTML = '';
  LEVELS.forEach((lvl, i) => {
    const btn = document.createElement('button');
    btn.className = `bld bld-${lvl.id}`;
    btn.style.setProperty('--i', i);
    btn.setAttribute('aria-label', `Immeuble ${lvl.name} : ${lvl.blurb}`);
    btn.innerHTML = `
      <span class="bld-sign"><b>${lvl.name}</b><span class="bld-stars">${'★'.repeat(lvl.stars)}${'☆'.repeat(3 - lvl.stars)}</span></span>
      ${buildingSVG(lvl.id, lvl.shop)}
      <span class="bld-blurb">${lvl.blurb}</span>`;
    btn.addEventListener('click', () => chooseLevel(i, btn));
    buildingsEl.appendChild(btn);
  });
}

function setLadyLeft(el, px) { el.style.left = `${px}px`; }

async function playSelectIntro(firstTime) {
  selectReady = false;
  selectScene.classList.remove('ready');
  selectLady.classList.remove('entering', 'walking');
  selectLady.style.transition = 'none';
  const sceneW = selectScene.clientWidth;
  const ladyW = selectLady.offsetWidth;
  const center = sceneW / 2 - ladyW / 2;

  if (!firstTime) {
    setLadyLeft(selectLady, center);
    void selectLady.offsetWidth;
    selectScene.classList.add('ready');
    selectReady = true;
    return;
  }

  setLadyLeft(selectLady, -ladyW - 20);
  void selectLady.offsetWidth;
  selectLady.style.transition = 'left 2.6s linear';
  selectLady.classList.add('walking');
  setLadyLeft(selectLady, center);
  await wait(2600);
  selectLady.classList.remove('walking');
  selectScene.classList.add('ready');      // les trois immeubles surgissent
  sfx.floor();
  await wait(1400);
  selectReady = true;

  let seen = false;
  try { seen = localStorage.getItem('english-etages-rules') === 'seen'; } catch (e) { /* ignoré */ }
  if (!seen) {
    openSheet($('rulesOverlay'));
    try { localStorage.setItem('english-etages-rules', 'seen'); } catch (e) { /* ignoré */ }
  }
}

async function chooseLevel(i, btn) {
  if (!selectReady) return;
  selectReady = false;
  sfx.tap();
  // Colette marche jusqu'à la porte de l'immeuble choisi, puis entre
  const sceneBox = selectScene.getBoundingClientRect();
  const bldBox = btn.getBoundingClientRect();
  const target = bldBox.left - sceneBox.left + bldBox.width / 2 - selectLady.offsetWidth / 2;
  btn.classList.add('chosen');
  selectLady.style.transition = 'left 1s linear';
  selectLady.classList.add('walking');
  setLadyLeft(selectLady, target);
  await wait(1000);
  selectLady.classList.remove('walking');
  selectLady.classList.add('entering');
  await wait(600);
  btn.classList.remove('chosen');
  startClimb(i);
}

/* ================================================================
   ÉCRAN 2 : l'ascension
   ================================================================ */
function buildFacade() {
  facade.innerHTML = '';
  facade.dataset.level = level.id;

  facade.insertAdjacentHTML('beforeend', `
    <div class="roof">
      <span class="chimney ch1"></span><span class="chimney ch2"></span>
      <div class="dormers">${'<span class="dormer"></span>'.repeat(5)}</div>
    </div>
    <div class="cornice"></div>`);

  for (let n = FLOORS; n >= 1; n--) {
    const floorEl = document.createElement('div');
    // balcons filants aux 2e, 5e et 8e étages, comme sur les vrais immeubles
    floorEl.className = `floor${[2, 5, 8].includes(n) ? ' long-balcony' : ''}`;
    floorEl.dataset.floor = String(n);
    floorEl.innerHTML = `<div class="floor-side"><span class="plaque">${ordinalHTML(n)}</span></div><div class="windows"></div>`;
    const windows = floorEl.querySelector('.windows');
    for (let c = 0; c < CARDS_PER_FLOOR; c++) {
      const win = document.createElement('button');
      win.className = 'win';
      win.setAttribute('aria-label', `${ordinalText(n)} étage, fenêtre ${c + 1}`);
      win.innerHTML = `
        <span class="pane"><span class="win-emoji"></span></span>
        <span class="shutter sl"></span><span class="shutter sr"></span>
        <span class="flowers"></span>`;
      win.addEventListener('click', () => openCard(n - 1, c, win));
      windows.appendChild(win);
    }
    facade.appendChild(floorEl);
  }

  facade.insertAdjacentHTML('beforeend', `
    <div class="ground">
      <div class="shop"><span class="awning"></span><span class="shop-name">${level.shop}</span></div>
      <div class="porte"><span class="porte-num">${LEVELS.indexOf(level) + 1}</span></div>
      <div class="shop"><span class="awning"></span><span class="shop-name">Fleuriste</span></div>
    </div>
    <div class="street-front">
      <div class="lamp">${lampSVG()}</div>
      <div class="cafe">${cafeSVG()}</div>
    </div>`);
}

const floorEl = (idx) => facade.querySelector(`.floor[data-floor="${idx + 1}"]`);

function refreshFloors() {
  facade.querySelectorAll('.floor').forEach((el) => {
    const idx = Number(el.dataset.floor) - 1;
    el.classList.toggle('done', idx < floor);
    el.classList.toggle('current', idx === floor);
    el.classList.toggle('locked', idx > floor);
  });
  floorNumEl.textContent = String(floor + 1);
  const f = level.floors[floor];
  climbHint.innerHTML = `<b>${ordinalHTML(floor + 1)} étage</b> · ${f.theme} ${f.emoji}<br><span>Touchez une fenêtre qui brille ✨ (${cardsDone}/${CARDS_PER_FLOOR})</span>`;
}

/* La « caméra » suit Colette : l'immeuble glisse, le ciel défile plus lentement */
function moveCamera(animate) {
  const el = floorEl(floor);
  if (!el) return;
  const viewH = climbView.clientHeight;
  const facadeH = facade.offsetHeight;
  const floorBottom = el.offsetTop + el.offsetHeight;
  let y;
  if (facadeH <= viewH) {
    y = viewH - facadeH;
  } else {
    y = viewH * 0.66 - floorBottom;
    y = Math.max(y, viewH - facadeH);
    y = Math.min(y, viewH * 0.25);
  }
  tower.classList.toggle('panning', animate);
  tower.style.transform = `translateY(${y}px)`;
  const progress = floor / (FLOORS - 1);
  climbSkyline.style.transform = `translateY(${progress * viewH * 0.45}px)`;
  climbEiffel.style.transform = `translateY(${progress * viewH * 0.22}px)`;
}

/* Colette se tient sur le balcon de l'étage en cours */
function placeLady(animate) {
  const el = floorEl(floor);
  if (!el) return;
  const side = el.querySelector('.floor-side');
  const height = el.offsetHeight * 0.72;
  const width = height * 100 / 230;
  gameLady.classList.toggle('moving', animate);
  gameLady.style.height = `${height}px`;
  gameLady.style.width = `${width}px`;
  gameLady.style.top = `${el.offsetTop + el.offsetHeight - height - el.offsetHeight * 0.06}px`;
  gameLady.style.left = `${facade.offsetLeft + side.offsetLeft + (side.offsetWidth - width) / 2}px`;
  if (animate) {
    gameLady.classList.add('walking');
    setTimeout(() => gameLady.classList.remove('walking', 'moving'), 1300);
  }
}

function layoutClimb(animate) {
  placeLady(animate);
  moveCamera(animate);
}

function startClimb(levelIdx) {
  level = LEVELS[levelIdx];
  deck = buildDeck(level);
  floor = 0;
  cardsDone = 0;
  lock = false;
  finalSeconds = null;
  clearTimeout(showTimer);
  if (synth) synth.cancel();

  screenSelect.hidden = true;
  endScreen.hidden = true;
  qOverlay.hidden = true;
  screenClimb.hidden = false;
  screenClimb.dataset.level = level.id;
  levelPill.innerHTML = `<span class="lvl-name">${level.name}</span> <span class="lvl-stars">${'★'.repeat(level.stars)}</span>`;

  buildFacade();
  refreshFloors();
  requestAnimationFrame(() => {
    layoutClimb(false);
    startClock();
  });
}

function backToSelect() {
  clearInterval(clockTimer);
  clearTimeout(showTimer);
  if (synth) synth.cancel();
  screenClimb.hidden = true;
  endScreen.hidden = true;
  qOverlay.hidden = true;
  screenSelect.hidden = false;
  requestAnimationFrame(() => playSelectIntro(false));
}

/* ---------- Une carte ---------- */
function readingTime(text) {
  return Math.min(10000, 4500 + text.length * 110);
}

function openCard(floorIdx, cardIdx, win) {
  if (lock || floorIdx !== floor || win.classList.contains('open')) return;
  lock = true;
  sfx.tap();
  const card = deck[floorIdx][cardIdx];
  const englishFirst = isEnglishFirst(floorIdx);
  currentCard = { card, win, englishFirst };
  const f = level.floors[floorIdx];

  win.classList.add('peek');
  qWhere.innerHTML = `${ordinalHTML(floorIdx + 1)} étage · ${f.theme} ${f.emoji}`;
  qCount.textContent = `${cardsDone + 1}/${CARDS_PER_FLOOR}`;
  qLang.innerHTML = englishFirst ? `${FLAG_UK} En anglais` : `${FLAG_FR} En français`;
  qWord.textContent = card.prompt;
  qWord.lang = englishFirst ? 'en' : 'fr';
  qWord.classList.toggle('long', card.prompt.length > 22);
  qOverlay.classList.remove('answering');
  qOverlay.classList.toggle('french', !englishFirst);
  qInstr.textContent = 'Lisez bien… le mot va s’effacer !';
  qShow.hidden = false;
  qAnswer.hidden = true;

  const ms = readingTime(card.prompt);
  qBar.style.transition = 'none';
  qBar.style.width = '100%';
  void qBar.offsetWidth;
  qBar.style.transition = `width ${ms}ms linear`;
  qBar.style.width = '0%';

  openSheet(qOverlay);
  clearTimeout(showTimer);
  showTimer = setTimeout(showChoices, ms);
}

function showChoices() {
  clearTimeout(showTimer);
  const { card, englishFirst } = currentCard;
  qOverlay.classList.add('answering');       // le mot s'efface de l'ardoise
  qInstr.textContent = englishFirst
    ? 'Que veut dire ce mot en français ?'
    : 'Comment dit-on ce mot en anglais ?';
  qShow.hidden = true;
  qAnswer.hidden = false;
  qFeedback.textContent = '';
  qFeedback.className = 'q-feedback';
  qChoices.innerHTML = '';
  qChoices.classList.toggle('long', card.choices.some((c) => c.length > 13));

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
  qOverlay.classList.remove('answering');    // le mot réapparaît sur l'ardoise

  if (isRight) {
    sfx.good();
    qFeedback.textContent = ['Bravo ! 🎉', 'Magnifique ! 🌟', 'Parfait ! 👏', 'Excellent ! 🥐'][Math.floor(Math.random() * 4)];
    qFeedback.classList.add('ok');
    if (!englishFirst) setTimeout(() => speakEnglish(card.en), 250);
    setTimeout(() => {
      closeSheet(qOverlay);
      win.classList.remove('peek');
      win.classList.add('open');
      win.querySelector('.win-emoji').textContent = card.emoji;
      win.setAttribute('aria-label', `${card.en} : ${card.fr}`);
      cardsDone++;
      refreshFloors();
      if (cardsDone === CARDS_PER_FLOOR) floorComplete();
      else lock = false;
    }, 1400);
  } else {
    sfx.bad();
    btn.classList.add('wrong');
    qFeedback.innerHTML = `Oh là là… c'était «&nbsp;${escapeHtml(card.answer)}&nbsp;»`;
    qFeedback.classList.add('ko');
    stopClock();
    setTimeout(() => {
      closeSheet(qOverlay);
      win.classList.remove('peek');
      win.classList.add('failed');
      showEnd(false, card);
    }, 3000);
  }
}

function floorComplete() {
  sfx.floor();
  if (floor === FLOORS - 1) {
    stopClock();
    showToast('Tout en haut ! 🎉');
    setTimeout(() => showEnd(true), 1300);
    return;
  }
  floor++;
  cardsDone = 0;
  showToast(`Bravo ! Direction le ${ordinalText(floor + 1)} étage ⬆️`);
  refreshFloors();
  layoutClimb(true);
  setTimeout(() => { lock = false; }, 1300);
}

/* ================================================================
   Fin de partie : Colette danse sur les toits… ou sous la pluie
   ================================================================ */
function showEnd(won, failedCard) {
  endScreen.hidden = false;
  endScene.className = `end-scene ${won ? 'is-win' : 'is-lose'}`;
  endLady.className = `lady lady-end ${won ? 'dance-happy with-baguette' : 'dance-sad'}`;
  scoreSaved.textContent = '';
  pseudoInput.value = '';
  const saveBtn = $('saveScore');
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer mon temps';

  if (won) {
    sfx.win();
    endTitle.textContent = 'Bravo, vous êtes au sommet ! 🎉';
    endText.innerHTML = `Immeuble <b>${level.name}</b> : 50 bonnes réponses, sans une seule erreur, en <b>${formatTime(finalSeconds)}</b> !`;
    scoreForm.hidden = !isLeaderboardConfigured();
  } else {
    sfx.lose();
    endTitle.textContent = 'Oh là là… 🌧️';
    endText.innerHTML = `«&nbsp;${escapeHtml(failedCard.prompt)}&nbsp;» se dit «&nbsp;<b>${escapeHtml(failedCard.answer)}</b>&nbsp;».<br>Colette s'est arrêtée au ${ordinalText(floor + 1)} étage. Ce n'est que partie remise !`;
    scoreForm.hidden = true;
  }
  renderRanking(level, endRanking, 5);
}

$('againBtn').addEventListener('click', () => startClimb(LEVELS.indexOf(level)));
$('otherBtn').addEventListener('click', backToSelect);
$('quitBtn').addEventListener('click', () => {
  if (window.confirm('Quitter cet immeuble ? La partie en cours sera perdue.')) backToSelect();
});
$('readyBtn').addEventListener('click', showChoices);
listenBtn.addEventListener('click', () => speakEnglish(currentCard.card.en));
relistenBtn.addEventListener('click', () => speakEnglish(currentCard.card.en));
$('rulesBtn').addEventListener('click', () => openSheet($('rulesOverlay')));

/* ---------- Classements (un par immeuble) ---------- */
async function renderRanking(lvl, listEl, max) {
  if (!isLeaderboardConfigured()) {
    listEl.innerHTML = '<li class="empty">Classement mondial pas encore activé sur ce site.</li>';
    return;
  }
  listEl.innerHTML = '<li class="empty">Chargement…</li>';
  const list = await fetchTopScores(gameIdFor(lvl), max);
  if (list.length === 0) {
    listEl.innerHTML = '<li class="empty">Personne n’a encore atteint le sommet. Soyez le premier !</li>';
    return;
  }
  listEl.innerHTML = list.map((entry, i) => `
    <li><span class="rank">${['🥇', '🥈', '🥉'][i] || i + 1}</span>
    <span class="name">${escapeHtml(entry.name)}</span>
    <span class="time">${formatTime(entry.value)}</span></li>`).join('');
}

function renderRankTabs() {
  const tabs = $('rankTabs');
  tabs.innerHTML = LEVELS.map((lvl, i) =>
    `<button role="tab" aria-selected="${i === rankTab}" data-i="${i}">${lvl.name}</button>`).join('');
  tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    rankTab = Number(b.dataset.i);
    renderRankTabs();
  }));
  renderRanking(LEVELS[rankTab], $('rankList'), 20);
}
$('rankBtn').addEventListener('click', () => {
  renderRankTabs();
  openSheet($('rankOverlay'));
});

$('saveScore').addEventListener('click', async () => {
  const name = pseudoInput.value.trim();
  if (!name) {
    pseudoInput.focus();
    return;
  }
  const saveBtn = $('saveScore');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Envoi…';
  const ok = await submitScore(gameIdFor(level), name, finalSeconds);
  if (ok) {
    scoreForm.hidden = true;
    scoreSaved.textContent = 'Temps enregistré ! 🎉';
    scoreSaved.className = 'score-saved ok';
    renderRanking(level, endRanking, 5);
  } else {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Enregistrer mon temps';
    scoreSaved.textContent = "Oups, l'enregistrement a échoué. Réessayez !";
    scoreSaved.className = 'score-saved ko';
  }
});

window.addEventListener('resize', () => {
  if (!screenClimb.hidden) layoutClimb(false);
  else if (selectReady) playSelectIntro(false);
});

/* ---------- Démarrage ---------- */
decorate();
refreshSoundButtons();
buildBuildings();
requestAnimationFrame(() => playSelectIntro(true));
