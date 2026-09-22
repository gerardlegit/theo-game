import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";

// Un classement par continent : ils n'ont pas tous le même nombre de pays
const gameIdFor = (continentKey) => `continents-${continentKey}`;
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
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
const leaderboardSub = document.getElementById('leaderboardSub');

let topology = null;
let geometriesByKey = null;
let currentContinentKey = null;
let centroids = {};
let svgEl = null;
let zoomLayer = null;
let flagGroup = null;
let zoomBehavior = null;
let zoomK = 1;

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
  if (topology) return topology;
  const res = await fetch(WORLD_URL);
  topology = await res.json();
  geometriesByKey = new Map();
  topology.objects.countries.geometries.forEach((g) => {
    // Clé = code numérique ISO, ou nom anglais pour les rares territoires sans code
    const key = g.id != null ? Number(g.id) : g.properties.name;
    if (!geometriesByKey.has(key)) geometriesByKey.set(key, []);
    geometriesByKey.get(key).push(g);
  });
  return topology;
}

function inBox([lon, lat], [lonMin, lonMax, latMin, latMax]) {
  return lon >= lonMin && lon <= lonMax && lat >= latMin && lat <= latMax;
}

function ringCenter(ring) {
  let lon = 0, lat = 0;
  ring.forEach(([x, y]) => { lon += x; lat += y; });
  return [lon / ring.length, lat / ring.length];
}

/**
 * Fusionne les morceaux de carte "ids" en une seule forme (sans frontière
 * intérieure), puis ne garde que les morceaux (îles, territoires) dont le
 * centre tombe dans la zone "clip" et hors des zones "exclude". C'est ce qui
 * retire la Guyane de la France sur la carte d'Europe, Hawaï des États-Unis…
 * Renvoie null s'il ne reste rien.
 */
function buildShape(ids, clip, exclude = []) {
  const geoms = ids.flatMap((id) => geometriesByKey.get(id) || []);
  if (geoms.length === 0) return null;
  const merged = topojson.merge(topology, geoms);

  const polygons = merged.coordinates.filter((poly) => {
    if (!clip) return true;
    const c = ringCenter(poly[0]);
    return inBox(c, clip) && !exclude.some((box) => inBox(c, box));
  });
  if (polygons.length === 0) return null;
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polygons } };
}

/* ---------- Zoom (molette, pincement, boutons) ---------- */
// Tailles "à l'écran" des ronds des petits pays et des drapeaux posés :
// elles restent identiques quel que soit le niveau de zoom.
const TINY_R = 9;
const FLAG_SIZE = 26;

function onZoom(event) {
  const t = event.transform;
  zoomK = t.k;
  zoomLayer.attr('transform', t);
  zoomLayer.selectAll('circle.country-target').attr('r', TINY_R / t.k);
  zoomLayer.selectAll('image.placed-flag').each(function () {
    const img = d3.select(this);
    const [cx, cy] = [Number(img.attr('data-cx')), Number(img.attr('data-cy'))];
    const w = FLAG_SIZE / t.k, h = w * 0.75;
    img.attr('x', cx - w / 2).attr('y', cy - h / 2).attr('width', w).attr('height', h);
  });
}

document.getElementById('zoomIn').addEventListener('click', () => {
  if (svgEl) d3.select(svgEl).transition().duration(250).call(zoomBehavior.scaleBy, 1.6);
});
document.getElementById('zoomOut').addEventListener('click', () => {
  if (svgEl) d3.select(svgEl).transition().duration(250).call(zoomBehavior.scaleBy, 1 / 1.6);
});
document.getElementById('zoomReset').addEventListener('click', () => {
  if (svgEl) d3.select(svgEl).transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
});

/* ---------- Construction de la carte d'un continent ---------- */
async function buildMap(continentKey) {
  const continent = CONTINENTS[continentKey];
  mapContainer.innerHTML = '';
  await loadWorld();

  const partial = new Set(continent.partial || []);
  const targets = continent.countries
    .map((c) => {
      const ids = c.ids || [c.numeric];
      // Un pays "partiel" (la Russie) garde tous ses morceaux : il est
      // simplement coupé au bord de la carte.
      const shape = partial.has(c.code)
        ? buildShape(ids, null)
        : buildShape(ids, continent.clip, continent.exclude);
      return shape ? { country: c, shape } : null;
    })
    .filter(Boolean);

  const contextShapes = (continent.context || [])
    .map((ctx) => buildShape(ctx.ids, ctx.clip || continent.clip, continent.exclude))
    .filter(Boolean);

  // La carte est cadrée uniquement sur les pays du continent (hors pays partiels)
  const framing = {
    type: 'FeatureCollection',
    features: targets.filter((t) => !partial.has(t.country.code)).map((t) => t.shape),
  };

  const projection = d3.geoAzimuthalEqualArea()
    .rotate([-continent.center[0], -continent.center[1]]);

  // Proportions de la carte adaptées à la forme du continent
  projection.fitSize([1000, 1000], framing);
  const [[bx0, by0], [bx1, by1]] = d3.geoPath(projection).bounds(framing);
  const width = 1000;
  const height = Math.round(Math.min(1.35, Math.max(0.55, (by1 - by0) / (bx1 - bx0))) * width);
  const pad = 14;
  projection.fitExtent([[pad, pad], [width - pad, height - pad]], framing);
  const pathGen = d3.geoPath(projection);
  // Même projection, mais coupée au cadre de la carte : sert à calculer le
  // centre de la partie *visible* d'un pays partiel (la Russie)
  const visibleGen = d3.geoPath(
    d3.geoAzimuthalEqualArea()
      .rotate(projection.rotate())
      .scale(projection.scale())
      .translate(projection.translate())
      .clipExtent([[0, 0], [width, height]])
  );

  const svg = d3.select(mapContainer)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  svgEl = svg.node();

  svg.append('rect')
    .attr('class', 'map-sea')
    .attr('width', width)
    .attr('height', height);

  // Tout ce qui dépasse du cadre de la carte est masqué (la Russie continue
  // bien au-delà), sans dessiner de faux contour le long du bord.
  const clipId = `map-clip-${continentKey}`;
  svg.append('clipPath')
    .attr('id', clipId)
    .append('rect')
    .attr('width', width)
    .attr('height', height);

  zoomLayer = svg.append('g').append('g');
  zoomLayer.node().parentNode.setAttribute('clip-path', `url(#${clipId})`);
  zoomK = 1;

  zoomLayer.append('g')
    .selectAll('path')
    .data(contextShapes)
    .join('path')
    .attr('class', 'country-context')
    .attr('d', pathGen);

  // Les très petits pays (Vatican, îles des Antilles…) sont quasi invisibles à
  // l'échelle d'un continent : on garde leur vraie forme, mais on ajoute
  // par-dessus un rond qui sert de vraie cible pour le glisser-déposer.
  const MIN_HIT_SIZE = 16;
  const MIN_HIT_AREA = 150;

  centroids = {};
  const shapeGroup = zoomLayer.append('g');
  const tinyGroup = zoomLayer.append('g');
  flagGroup = zoomLayer.append('g');

  targets.forEach(({ country, shape }) => {
    const code = country.code;
    const centroid = visibleGen.centroid(shape);
    if (!Number.isFinite(centroid[0])) return;
    centroids[code] = centroid;

    // Petit = minuscule, ou éparpillé en petites îles (Cap-Vert, Maldives…)
    const [[x0, y0], [x1, y1]] = visibleGen.bounds(shape);
    const isTiny = Math.max(x1 - x0, y1 - y0) < MIN_HIT_SIZE
      || visibleGen.area(shape) < MIN_HIT_AREA;

    if (isTiny) {
      shapeGroup.append('path')
        .datum(shape)
        .attr('class', 'country-target-shape tiny')
        .attr('d', pathGen);
      tinyGroup.append('circle')
        .attr('class', 'country-target')
        .attr('data-code', code)
        .attr('cx', centroid[0])
        .attr('cy', centroid[1])
        .attr('r', TINY_R);
    } else {
      shapeGroup.append('path')
        .datum(shape)
        .attr('class', 'country-target')
        .attr('data-code', code)
        .attr('d', pathGen);
    }
  });

  zoomBehavior = d3.zoom()
    .scaleExtent([1, 12])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on('zoom', onZoom);
  svg.call(zoomBehavior);

  return targets.length;
}

/* ---------- Drapeaux à glisser ---------- */
function renderChips(countries) {
  chipsPanel.innerHTML = '';
  shuffle(countries).forEach((country) => {
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
  if (centroid && flagGroup) {
    const w = FLAG_SIZE / zoomK, h = w * 0.75;
    const href = `${FLAG_SVG_BASE}${country.code.toLowerCase()}.svg`;
    flagGroup.append('image')
      .attr('class', 'placed-flag')
      .attr('href', href)
      .attr('data-cx', centroid[0])
      .attr('data-cy', centroid[1])
      .attr('x', centroid[0] - w / 2)
      .attr('y', centroid[1] - h / 2)
      .attr('width', w)
      .attr('height', h);
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
  placedCountEl.textContent = '0';
  renderLeaderboard();

  await buildMap(continentKey);
  // Seuls les pays effectivement dessinés sur la carte sont à placer
  const playable = continent.countries.filter((c) => centroids[c.code]);
  totalCountValue = playable.length;
  totalCountEl.textContent = String(totalCountValue);
  renderChips(playable);

  loadingNote.hidden = true;
  gameArea.hidden = false;
  gameArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  if (!currentContinentKey) return;
  const continentKey = currentContinentKey;
  leaderboardSub.textContent = `${CONTINENTS[continentKey].label} : top 20 mondial (le plus rapide !)`;
  leaderboardList.innerHTML = '<li class="leaderboard-empty" style="display:block;">Chargement…</li>';
  const list = await fetchTopScores(gameIdFor(continentKey), 20);
  if (continentKey !== currentContinentKey) return; // on a changé de continent entre-temps
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
  const ok = await submitScore(gameIdFor(currentContinentKey), name, finalTime);
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
document.querySelectorAll('.continent-btn').forEach((btn) => {
  const count = CONTINENTS[btn.dataset.continent].countries.length;
  const span = document.createElement('span');
  span.className = 'continent-count';
  span.textContent = `${count} pays`;
  btn.appendChild(span);
});
