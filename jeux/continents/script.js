import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";

const GAME_ID = "continents";
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const FLAG_SVG_BASE = "https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/flags/4x3/";

const continentPicker = document.getElementById('continentPicker');
const loadingNote = document.getElementById('loadingNote');
const gameArea = document.getElementById('gameArea');
const mapContainer = document.getElementById('mapContainer');
const chipsPanel = document.getElementById('chipsPanel');
const timerEl = document.getElementById('timer');
const placedCountEl = document.getElementById('placedCount');
const totalCountEl = document.getElementById('totalCount');

const winBanner = document.getElementById('winBanner');
const winTime = document.getElementById('winTime');
const confettiLayer = document.getElementById('confettiLayer');
const scoreForm = document.getElementById('scoreForm');
const pseudoInput = document.getElementById('pseudoInput');
const scoreSaved = document.getElementById('scoreSaved');
const leaderboardList = document.getElementById('leaderboardList');

let allFeatures = null;
let currentContinentKey = null;
let centroids = {};
let svgEl = null;

let placedCodes = new Set();
let totalCountValue = 0;

let elapsedSeconds = 0;
let timerInterval = null;
let finalTime = null;

/* ---------- Utilitaires ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Chronomètre ---------- */
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

/* ---------- Chargement de la carte du monde (une seule fois) ---------- */
async function loadWorld() {
  if (allFeatures) return allFeatures;
  const res = await fetch(WORLD_URL);
  const topology = await res.json();
  const fc = topojson.feature(topology, topology.objects.countries);
  allFeatures = fc.features;
  return allFeatures;
}

function codeForNumeric(continent, numericId) {
  const n = Number(numericId);
  const found = continent.countries.find((c) => c.numeric === n);
  return found ? found.code : null;
}

/**
 * Ne garde, dans une géométrie MultiPolygon, que les morceaux situés à
 * proximité de la zone du continent — ça retire par exemple les DOM-TOM
 * français (Guyane, Réunion, Antilles...) de la forme de la France quand on
 * affiche la carte d'Europe, sans toucher aux pays qui n'ont qu'un seul bloc.
 * Renvoie null si rien de la géométrie ne tombe dans la zone (+ marge).
 */
function clipToContinent(feature, bbox, margin) {
  const [lonMin, lonMax, latMin, latMax] = bbox;
  const minLon = lonMin - margin, maxLon = lonMax + margin;
  const minLat = latMin - margin, maxLat = latMax + margin;
  const inRange = ([lon, lat]) => lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;

  const geom = feature.geometry;
  if (!geom) return null;

  if (geom.type === 'Polygon') {
    return geom.coordinates[0].some(inRange) ? feature : null;
  }

  if (geom.type === 'MultiPolygon') {
    const kept = geom.coordinates.filter((poly) => poly[0].some(inRange));
    if (kept.length === 0) return null;
    return { ...feature, geometry: { type: 'MultiPolygon', coordinates: kept } };
  }

  return feature;
}

/* ---------- Construction de la carte d'un continent ---------- */
async function buildMap(continentKey) {
  const continent = CONTINENTS[continentKey];
  mapContainer.innerHTML = '';

  const features = await loadWorld();
  const targetNumerics = new Set(continent.countries.map((c) => c.numeric));

  const targetFeatures = continent.countries
    .map((c) => {
      const raw = features.find((f) => Number(f.id) === c.numeric);
      if (!raw) return null;
      return clipToContinent(raw, continent.bbox, 14) || raw;
    })
    .filter(Boolean);

  const contextFeatures = features
    .filter((f) => !targetNumerics.has(Number(f.id)) && !CONTEXT_EXCLUDE.has(Number(f.id)))
    .map((f) => clipToContinent(f, continent.bbox, 6))
    .filter(Boolean);

  const combined = { type: 'FeatureCollection', features: [...contextFeatures, ...targetFeatures] };

  const width = 600, height = 600;
  const svg = d3.select(mapContainer)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  svgEl = svg.node();

  const projection = d3.geoMercator();
  projection.fitSize([width, height], combined);
  const pathGen = d3.geoPath(projection);

  svg.append('g')
    .selectAll('path')
    .data(contextFeatures)
    .join('path')
    .attr('class', 'country-context')
    .attr('d', pathGen);

  // Les très petits pays (îles du Pacifique, etc.) sont quasi invisibles à
  // l'échelle d'un continent : on garde leur vraie forme à l'écran, mais on
  // ajoute par-dessus un rond invisible plus grand qui sert de vraie cible
  // pour le glisser-déposer, sinon ils sont injouables.
  const MIN_HIT_SIZE = 22;

  centroids = {};
  const targetGroup = svg.append('g');

  targetFeatures.forEach((f) => {
    const code = codeForNumeric(continent, f.id);
    if (!code) return;

    const centroid = pathGen.centroid(f);
    centroids[code] = centroid;

    const [[x0, y0], [x1, y1]] = pathGen.bounds(f);
    const isTiny = Math.max(x1 - x0, y1 - y0) < MIN_HIT_SIZE;

    if (isTiny) {
      targetGroup.append('path')
        .datum(f)
        .attr('class', 'country-target-shape tiny')
        .attr('d', pathGen);
      targetGroup.append('circle')
        .attr('class', 'country-target')
        .attr('data-code', code)
        .attr('cx', centroid[0])
        .attr('cy', centroid[1])
        .attr('r', 13);
    } else {
      targetGroup.append('path')
        .datum(f)
        .attr('class', 'country-target')
        .attr('data-code', code)
        .attr('d', pathGen);
    }
  });
}

/* ---------- Drapeaux à glisser ---------- */
function renderChips(continent) {
  chipsPanel.innerHTML = '';
  shuffle(continent.countries).forEach((country) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.dataset.code = country.code;
    chip.innerHTML = `<span class="fi fi-${country.code.toLowerCase()}"></span><span class="chip-name">${escapeHtml(country.name)}</span>`;
    chip.addEventListener('pointerdown', (e) => startDrag(e, chip, country));
    chipsPanel.appendChild(chip);
  });
}

function positionGhost(ghost, x, y) {
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function startDrag(e, chip, country) {
  if (chip.classList.contains('placed')) return;
  e.preventDefault();

  const ghost = document.createElement('div');
  ghost.className = 'chip-ghost';
  ghost.innerHTML = `<span class="fi fi-${country.code.toLowerCase()}"></span><span class="chip-name">${escapeHtml(country.name)}</span>`;
  document.body.appendChild(ghost);
  positionGhost(ghost, e.clientX, e.clientY);

  chip.classList.add('dragging-source');
  let hoveredPath = null;

  function onMove(ev) {
    positionGhost(ghost, ev.clientX, ev.clientY);
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const path = el && el.closest ? el.closest('.country-target') : null;
    if (path !== hoveredPath) {
      if (hoveredPath) hoveredPath.classList.remove('drag-over');
      hoveredPath = path;
      if (hoveredPath) hoveredPath.classList.add('drag-over');
    }
  }

  function onUp(ev) {
    document.removeEventListener('pointermove', onMove);
    ghost.remove();
    chip.classList.remove('dragging-source');
    if (hoveredPath) hoveredPath.classList.remove('drag-over');

    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const path = el && el.closest ? el.closest('.country-target') : null;

    if (path && path.dataset.code === country.code) {
      onCorrectDrop(chip, path, country);
    } else {
      onWrongDrop(chip, path);
    }
  }

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp, { once: true });
}

function onCorrectDrop(chip, path, country) {
  chip.classList.add('placed');
  path.classList.add('placed');
  path.classList.remove('drag-over');

  const centroid = centroids[country.code];
  if (centroid && svgEl) {
    const size = 28;
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `${FLAG_SVG_BASE}${country.code.toLowerCase()}.svg`);
    img.setAttribute('href', `${FLAG_SVG_BASE}${country.code.toLowerCase()}.svg`);
    img.setAttribute('x', String(centroid[0] - size / 2));
    img.setAttribute('y', String(centroid[1] - (size * 0.75) / 2));
    img.setAttribute('width', String(size));
    img.setAttribute('height', String(size * 0.75));
    img.setAttribute('class', 'placed-flag');
    svgEl.appendChild(img);
  }

  placedCodes.add(country.code);
  placedCountEl.textContent = String(placedCodes.size);

  if (placedCodes.size === totalCountValue) {
    finishGame();
  }
}

function onWrongDrop(chip, path) {
  chip.classList.add('wrong-shake');
  setTimeout(() => chip.classList.remove('wrong-shake'), 400);
  if (path) {
    path.classList.add('shake-wrong');
    setTimeout(() => path.classList.remove('shake-wrong'), 400);
  }
}

/* ---------- Démarrer une partie sur un continent ---------- */
async function startContinent(continentKey) {
  currentContinentKey = continentKey;
  const continent = CONTINENTS[continentKey];

  continentPicker.hidden = true;
  loadingNote.hidden = false;
  gameArea.hidden = true;

  placedCodes = new Set();
  totalCountValue = continent.countries.length;
  placedCountEl.textContent = '0';
  totalCountEl.textContent = String(totalCountValue);

  await buildMap(continentKey);
  renderChips(continent);

  loadingNote.hidden = true;
  gameArea.hidden = false;
  startTimer();
}

document.querySelectorAll('.continent-btn').forEach((btn) => {
  btn.addEventListener('click', () => startContinent(btn.dataset.continent));
});

document.getElementById('restart').addEventListener('click', () => {
  if (currentContinentKey) startContinent(currentContinentKey);
});

document.getElementById('changeContinent').addEventListener('click', () => {
  stopTimer();
  gameArea.hidden = true;
  continentPicker.hidden = false;
});

/* ---------- Victoire + classement ---------- */
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

function finishGame() {
  stopTimer();
  finalTime = elapsedSeconds;
  winTime.textContent = `Continent terminé en ${finalTime} secondes (${formatTime(finalTime)}) !`;
  scoreForm.style.display = 'block';
  scoreSaved.style.display = 'none';
  pseudoInput.value = '';
  winBanner.classList.add('show');
  launchConfetti();
}

document.getElementById('playAgain').addEventListener('click', () => {
  winBanner.classList.remove('show');
  gameArea.hidden = true;
  continentPicker.hidden = false;
});

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
      <span class="lb-time">${entry.value}s</span>
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
  const ok = await submitScore(GAME_ID, name, finalTime);
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
