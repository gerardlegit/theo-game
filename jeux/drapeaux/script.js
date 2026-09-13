const board = document.getElementById('board');
const foundEl = document.getElementById('found');
const progressFill = document.getElementById('progressFill');

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
const confettiLayer = document.getElementById('confettiLayer');

let found = new Set();
let currentCountry = null;
let currentTile = null;
let busy = false;

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

function buildBoard() {
  board.innerHTML = '';
  found = new Set();
  updateHud();

  COUNTRIES.forEach((country) => {
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
  progressFill.style.width = `${(found.size / COUNTRIES.length) * 100}%`;
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
  if (found.size === COUNTRIES.length) {
    setTimeout(() => winBanner.classList.add('show'), 300);
  }
});

document.getElementById('restart').addEventListener('click', buildBoard);
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

buildBoard();
