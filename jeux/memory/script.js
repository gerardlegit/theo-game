const ANIMALS = ['🐶','🐱','🦊','🐼','🦁','🐸','🐵','🐨'];

const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const foundEl = document.getElementById('found');
const winBanner = document.getElementById('winBanner');
const winStats = document.getElementById('winStats');

let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let lock = false;

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
          winStats.textContent = `Terminé en ${moves} coups !`;
          winBanner.classList.add('show');
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

document.getElementById('restart').addEventListener('click', buildBoard);
document.getElementById('playAgain').addEventListener('click', buildBoard);

buildBoard();
