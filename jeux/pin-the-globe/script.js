import { Globe, distanceKm } from './globe.js';
import { CITIES, CONTINENTS } from './data.js';
import { sfx, isSoundOn, toggleSound } from './sound.js';

// Le classement mondial est chargé à part : si Firebase est injoignable,
// le jeu marche quand même.
const leaderboard = import('../../shared/leaderboard.js').catch(() => null);

const ROUNDS = 10;
const HINT_PENALTY = 500;
const MODES = {
  explorateur: { label: 'Explorateur', icon: '🧭', gameId: 'pin-the-globe-explorateur' },
  voyageur: { label: 'Grand voyageur', icon: '✈️', gameId: 'pin-the-globe-voyageur' },
};

const $ = (id) => document.getElementById(id);
const els = {
  stage: $('stage'), topbar: $('topbar'), hud: $('hud'), dots: $('dots'),
  roundNum: $('roundNum'), totalKm: $('totalKm'), soundBtn: $('soundBtn'),
  coords: $('coords'), loader: $('loader'), toast: $('toast'), confetti: $('confetti'),
  intro: $('intro'), play: $('play'), result: $('result'), end: $('end'),
  askCity: $('askCity'), askCountry: $('askCountry'), tip: $('tip'),
  hintBtn: $('hintBtn'), validateBtn: $('validateBtn'), nextBtn: $('nextBtn'),
  verdict: $('verdict'), verdictEmoji: $('verdictEmoji'), verdictLabel: $('verdictLabel'),
  verdictKm: $('verdictKm'), verdictPenalty: $('verdictPenalty'), compare: $('compare'),
  cityIcon: $('cityIcon'), cityName: $('cityName'), cityRole: $('cityRole'),
  cityContinent: $('cityContinent'), cityPop: $('cityPop'), cityLang: $('cityLang'),
  cityCoords: $('cityCoords'), cityHemi: $('cityHemi'), cityFacts: $('cityFacts'),
  endMode: $('endMode'), rankEmoji: $('rankEmoji'), rankTitle: $('rankTitle'), rankText: $('rankText'),
  endTotal: $('endTotal'), endBest: $('endBest'), recap: $('recap'),
  scoreForm: $('scoreForm'), pseudo: $('pseudo'), saveScore: $('saveScore'), scoreMsg: $('scoreMsg'),
  introBoard: $('introBoard'), endBoard: $('endBoard'),
};

const state = {
  phase: 'loading', // loading | intro | aim | reveal | end
  mode: 'explorateur',
  rounds: [],
  index: 0,
  pin: null,
  guess: null,
  hintUsed: false,
  submitted: false,
};

// ============================================================ utilitaires

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const fmtKm = (km) => nf.format(Math.round(km));
const fmtDeg = (v) => Math.abs(v).toFixed(1).replace('.', ',') + '°';
const fmtLat = (lat) => `${fmtDeg(lat)} ${lat >= 0 ? 'N' : 'S'}`;
const fmtLon = (lon) => `${fmtDeg(lon)} ${lon >= 0 ? 'E' : 'O'}`;
const fmtCoords = (p) => `${fmtLat(p.lat)} · ${fmtLon(p.lon)}`;
const flag = (cc) => `<span class="fi fi-${cc}"></span>`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* stockage indisponible */ }
  return null;
}

let toastTimer = null;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function countUp(el, to, duration = 900) {
  const t0 = performance.now();
  return new Promise((resolve) => {
    const step = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      el.textContent = fmtKm(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

// ============================================================ barèmes

function verdictFor(km) {
  if (km < 50) return { emoji: '🎯', label: 'Dans le mille !', tone: 'perfect' };
  if (km < 250) return { emoji: '🌟', label: 'Excellent !', tone: 'great' };
  if (km < 750) return { emoji: '👏', label: 'Très bien !', tone: 'good' };
  if (km < 1500) return { emoji: '👍', label: 'Pas mal !', tone: 'ok' };
  if (km < 3000) return { emoji: '🤔', label: 'Un peu loin…', tone: 'far' };
  return { emoji: '🙈', label: 'Oups, très loin !', tone: 'lost' };
}

function rankFor(total) {
  if (total < 1500) return { emoji: '🧭', title: 'Boussole humaine', text: "Incroyable ! Tu connais la Terre comme ta poche." };
  if (total < 4000) return { emoji: '🌟', title: 'Grand explorateur', text: 'Bravo ! Tes épingles tombent presque toujours au bon endroit.' };
  if (total < 8000) return { emoji: '🚢', title: 'Navigateur', text: 'Très beau voyage ! Encore un peu et tu deviens un grand explorateur.' };
  if (total < 15000) return { emoji: '🎒', title: 'Voyageur', text: 'Joli tour du monde ! Rejoue pour découvrir de nouvelles villes.' };
  if (total < 25000) return { emoji: '🗺️', title: 'Apprenti globe-trotter', text: "Chaque partie t'apprend où se trouvent de nouvelles villes. Continue !" };
  return { emoji: '🙃', title: 'Touriste égaré', text: "La Terre est grande ! Utilise les indices et rejoue : tu vas vite progresser." };
}

// Pour donner une idée de la distance : « c'est à peu près Paris → Rome ».
const byId = (id) => CITIES.find((c) => c.id === id);
const REFERENCES = [
  { km: 42, text: "la longueur d'un marathon" },
  ...[['paris', 'londres'], ['paris', 'marseille'], ['paris', 'rome'], ['paris', 'moscou'],
    ['paris', 'le-caire'], ['paris', 'new-york'], ['paris', 'tokyo']].map(([a, b]) => ({
    km: distanceKm(byId(a), byId(b)),
    text: `la distance ${byId(a).name} → ${byId(b).name}`,
  })),
  { km: 20015, text: 'la moitié du tour de la Terre' },
];

function compareText(km) {
  if (km < 25) return "📏 Moins de 25 km : ton épingle est presque dans la ville !";
  let best = REFERENCES[0];
  for (const r of REFERENCES) {
    if (Math.abs(Math.log(km / r.km)) < Math.abs(Math.log(km / best.km))) best = r;
  }
  return `📏 C'est à peu près ${best.text} (${fmtKm(best.km)} km).`;
}

function hemisphereText(c) {
  const ns = Math.abs(c.lat) < 3
    ? `juste au ${c.lat >= 0 ? 'nord' : 'sud'} de l'équateur`
    : `dans l'hémisphère ${c.lat >= 0 ? 'Nord' : 'Sud'}, au ${c.lat >= 0 ? 'nord' : 'sud'} de l'équateur`;
  const ew = Math.abs(c.lon) < 1
    ? 'presque pile sur le méridien de Greenwich, la ligne de longitude 0°'
    : `à l'${c.lon >= 0 ? 'est' : 'ouest'} du méridien de Greenwich`;
  return `${c.name} se trouve ${ns}, et ${ew}.`;
}

// ============================================================ choix des villes

function pickCities(mode) {
  const recent = store('pin-the-globe-recent') || [];
  const pool = mode === 'explorateur' ? CITIES.filter((c) => c.level === 1) : CITIES;
  // Les villes de la partie précédente passent en dernier.
  const ordered = [
    ...shuffle(pool.filter((c) => !recent.includes(c.id))),
    ...shuffle(pool.filter((c) => recent.includes(c.id))),
  ];
  const chosen = [];
  const free = (c) => !chosen.includes(c);

  // Au moins une ville par continent (en Grand voyageur, une ville difficile).
  for (const cont of shuffle(CONTINENTS)) {
    const pick = ordered.find((c) => c.continent === cont && free(c) && (mode !== 'voyageur' || c.level === 2))
      || ordered.find((c) => c.continent === cont && free(c));
    if (pick) chosen.push(pick);
  }
  // Puis on complète, en évitant d'abord deux villes du même pays.
  for (const sameCountryOk of [false, true]) {
    for (const c of ordered) {
      if (chosen.length >= ROUNDS) break;
      if (!free(c)) continue;
      if (!sameCountryOk && chosen.some((o) => o.cc === c.cc)) continue;
      chosen.push(c);
    }
  }
  store('pin-the-globe-recent', chosen.map((c) => c.id));
  return shuffle(chosen).map((city) => ({ city, guess: null, km: 0, hint: false, score: 0 }));
}

// ============================================================ globe

const globe = new Globe(els.stage, {
  onTap: (hit) => placePin(hit),
  onHover: (hit) => {
    if (!hit || state.phase !== 'aim') { els.coords.classList.remove('show'); return; }
    els.coords.textContent = `🧭 ${fmtCoords(hit)}`;
    els.coords.classList.add('show');
  },
});
globe.setAutoRotate(true);

// La zone du globe laissée libre par le panneau ouvert : le globe s'y recentre.
let activePanel = els.intro;
function updateInsets() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const top = els.topbar.getBoundingClientRect().bottom;
  const insets = { top, right: 0, bottom: 0, left: 0 };
  if (activePanel && !activePanel.hidden) {
    const r = activePanel.getBoundingClientRect();
    const side = r.width < W * 0.55 && r.height > H * 0.5;
    if (side && r.left < W / 2) insets.left = r.right;
    else if (side) insets.right = W - r.left;
    else insets.bottom = Math.max(0, H - r.top);
  }
  globe.setInsets(insets);
}
const panelObserver = new ResizeObserver(() => updateInsets());
[els.intro, els.play, els.result, els.end].forEach((p) => panelObserver.observe(p));
window.addEventListener('resize', updateInsets);

function showPanel(panel) {
  for (const p of [els.intro, els.play, els.result, els.end]) {
    p.hidden = p !== panel;
  }
  activePanel = panel;
  if (panel) {
    panel.classList.remove('enter');
    void panel.offsetWidth;
    panel.classList.add('enter');
    panel.scrollTop = 0;
  }
  document.body.className = `is-${state.phase}`;
  updateInsets();
}

// ============================================================ épingles

function pinElement(extra = '') {
  const el = document.createElement('div');
  el.className = `pin ${extra}`;
  el.innerHTML = `
    <span class="pin-shadow"></span>
    <svg class="pin-svg" viewBox="0 0 32 44" aria-hidden="true">
      <path d="M16 1C7.7 1 1 7.7 1 16c0 10.6 13.3 25.3 14.2 26.3a1 1 0 0 0 1.6 0C17.7 41.3 31 26.6 31 16 31 7.7 24.3 1 16 1z"/>
      <circle cx="16" cy="16" r="6.2"/>
      <ellipse class="shine" cx="10.5" cy="9.5" rx="3.6" ry="2.4" transform="rotate(-35 10.5 9.5)"/>
    </svg>`;
  return el;
}

function cityElement(city, extra = '') {
  const el = document.createElement('div');
  el.className = `city-pin ${extra}`;
  el.innerHTML = `
    <span class="pulse"></span><span class="pulse p2"></span>
    <span class="core"></span>
    <span class="tag">${city.icon} ${escapeHtml(city.name)}</span>`;
  return el;
}

function placePin(hit) {
  if (state.phase !== 'aim') return;
  state.guess = hit;
  if (!state.pin) {
    state.pin = globe.addMarker(pinElement('drop'), hit.lat, hit.lon);
  } else {
    state.pin.setLatLon(hit.lat, hit.lon);
    const el = state.pin.el;
    el.classList.remove('drop');
    void el.offsetWidth;
    el.classList.add('drop');
  }
  sfx.pin();
  els.validateBtn.disabled = false;
  els.tip.innerHTML = `Ton épingle : <b>${fmtCoords(hit)}</b><br><span>Touche ailleurs pour la déplacer.</span>`;
}

// ============================================================ déroulé

function updateHud() {
  els.roundNum.textContent = Math.min(state.index + 1, ROUNDS);
  const total = state.rounds.reduce((s, r) => s + r.score, 0);
  els.totalKm.textContent = fmtKm(total);
  els.dots.innerHTML = state.rounds.map((r, i) => {
    let cls = '';
    if (i < state.index || (i === state.index && state.phase === 'reveal')) cls = `done tone-${verdictFor(r.km).tone}`;
    else if (i === state.index) cls = 'current';
    return `<li class="${cls}"></li>`;
  }).join('');
}

function startGame(mode) {
  state.mode = mode;
  state.rounds = pickCities(mode);
  state.index = 0;
  state.submitted = false;
  globe.clearAll();
  globe.setAutoRotate(false);
  els.hud.hidden = false;
  startRound();
}

function startRound() {
  const round = state.rounds[state.index];
  const { city } = round;
  state.phase = 'aim';
  state.pin = null;
  state.guess = null;
  state.hintUsed = false;
  globe.clearAll();
  globe.tapEnabled = true;

  els.askCity.textContent = city.name;
  els.askCountry.innerHTML = `${flag(city.cc)} ${escapeHtml(city.country)}`;
  els.tip.textContent = 'Fais tourner le globe, puis touche-le pour planter ton épingle.';
  els.validateBtn.disabled = true;
  els.hintBtn.disabled = false;
  els.hintBtn.innerHTML = `💡 Indice <small>+${HINT_PENALTY} km</small>`;

  showPanel(els.play);
  updateHud();
  // On reprend de la hauteur pour voir toute la Terre, sans tourner vers la ville.
  globe.goHome(1100);
}

function useHint() {
  if (state.phase !== 'aim' || state.hintUsed) return;
  const { city } = state.rounds[state.index];
  const area = globe.highlightCountry(city.iso, city);
  if (!area) { toast("Oups, pas d'indice disponible pour cette ville."); return; }
  state.hintUsed = true;
  sfx.hint();
  els.hintBtn.disabled = true;
  els.hintBtn.textContent = '💡 Indice utilisé';
  els.tip.innerHTML = `La ville est quelque part dans la <b class="gold">zone dorée</b> : ${escapeHtml(city.country)}.`;
  // Même pour un tout petit pays, on garde assez de recul pour voir la région.
  const radius = Math.max(area.radius * 1.15 + 0.03, 0.16);
  globe.flyToLatLon(area.center.lat, area.center.lon, globe.fitDistance(radius), 1300);
}

async function validate() {
  if (state.phase !== 'aim' || !state.guess) return;
  const round = state.rounds[state.index];
  const { city } = round;
  state.phase = 'reveal';
  globe.tapEnabled = false;
  els.coords.classList.remove('show');

  round.guess = state.guess;
  round.km = distanceKm(state.guess, city);
  round.hint = state.hintUsed;
  round.score = round.km + (round.hint ? HINT_PENALTY : 0);

  fillResult(round);
  showPanel(els.result);
  els.nextBtn.disabled = true;

  sfx.whoosh();
  // Épingle à l'autre bout du monde : on montre surtout la vraie ville.
  if (round.km > 11000) await globe.flyToLatLon(city.lat, city.lon, globe.homeDistance(), 1400);
  else await globe.flyToFit([round.guess, city], 1300);
  const { apex } = await globe.addArc(round.guess, city, { duration: 900 });

  globe.addMarker(cityElement(city, 'drop'), city.lat, city.lon);
  const tag = document.createElement('div');
  tag.className = 'dist-tag';
  tag.innerHTML = `<span>${fmtKm(round.km)} km</span>`;
  globe.addMarker(tag, apex.lat, apex.lon, { altitude: apex.altitude });

  sfx.reveal();
  els.verdict.classList.add('show');
  await countUp(els.verdictKm, round.km);
  sfx.verdict(round.km);
  els.verdictLabel.classList.add('pop');
  els.nextBtn.disabled = false;
  updateHud();
}

function fillResult(round) {
  const { city } = round;
  const v = verdictFor(round.km);
  els.verdict.className = `verdict tone-${v.tone}`;
  els.verdictEmoji.textContent = v.emoji;
  els.verdictLabel.textContent = v.label;
  els.verdictLabel.classList.remove('pop');
  els.verdictKm.textContent = '0';
  els.verdictPenalty.hidden = !round.hint;
  els.compare.textContent = compareText(round.km);

  els.cityIcon.textContent = city.icon;
  els.cityName.textContent = city.name;
  const where = city.capital ? `Capitale · ${escapeHtml(city.country)}` : escapeHtml(city.country);
  els.cityRole.innerHTML = `${flag(city.cc)} ${where}`;
  els.cityContinent.textContent = city.continentLabel || city.continent;
  els.cityPop.textContent = city.pop;
  els.cityLang.textContent = city.lang;
  els.cityCoords.textContent = fmtCoords(city);
  els.cityHemi.textContent = hemisphereText(city);
  els.cityFacts.innerHTML = city.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('');

  const last = state.index === ROUNDS - 1;
  els.nextBtn.textContent = last ? 'Voir mon score 🏆' : 'Ville suivante →';
}

function next() {
  if (state.phase !== 'reveal' || els.nextBtn.disabled) return;
  sfx.click();
  state.index++;
  if (state.index >= ROUNDS) endGame();
  else startRound();
}

// ============================================================ fin de partie

function endGame() {
  state.phase = 'end';
  const total = state.rounds.reduce((s, r) => s + r.score, 0);
  const mode = MODES[state.mode];
  const rank = rankFor(total);

  const bestKey = `pin-the-globe-best-${state.mode}`;
  const prevBest = store(bestKey);
  const isRecord = prevBest == null || total < prevBest;
  if (isRecord) store(bestKey, Math.round(total));

  els.endMode.textContent = `${mode.icon} Partie terminée · ${mode.label}`;
  els.rankEmoji.textContent = rank.emoji;
  els.rankTitle.textContent = rank.title;
  els.rankText.textContent = rank.text;
  els.endTotal.textContent = '0';
  els.endBest.innerHTML = isRecord
    ? (prevBest == null ? '🏅 Ton premier record est enregistré !' : `🏅 <b>Nouveau record !</b> (avant : ${fmtKm(prevBest)} km)`)
    : `Ton record : ${fmtKm(prevBest)} km`;

  els.recap.innerHTML = state.rounds.map((r, i) => {
    const v = verdictFor(r.km);
    return `<li><button data-i="${i}" class="tone-${v.tone}">
      <span class="recap-n">${i + 1}</span>
      ${flag(r.city.cc)}
      <span class="recap-name">${escapeHtml(r.city.name)}${r.hint ? ' <i title="Indice utilisé">💡</i>' : ''}</span>
      <span class="recap-km">${fmtKm(r.score)} km</span>
    </button></li>`;
  }).join('');

  els.scoreMsg.hidden = true;
  showPanel(els.end);
  updateHud();
  els.hud.hidden = true;
  setupScoreForm();
  renderBoard(els.endBoard, state.mode);

  // Tout le voyage sur le globe : épingles, villes et arcs.
  globe.clearAll();
  for (const r of state.rounds) {
    globe.addMarker(pinElement('mini'), r.guess.lat, r.guess.lon);
    globe.addMarker(cityElement(r.city, 'mini'), r.city.lat, r.city.lon);
    globe.addArc(r.guess, r.city, { animate: false });
  }
  globe.goHome(1600).then(() => { if (state.phase === 'end') globe.setAutoRotate(true); });

  sfx.fanfare();
  countUp(els.endTotal, total, 1400);
  if (total < 8000) confetti();
  renderBests();
}

els.recap.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-i]');
  if (!btn) return;
  const r = state.rounds[Number(btn.dataset.i)];
  globe.setAutoRotate(false);
  globe.flyToFit([r.guess, r.city], 1200);
  sfx.click();
});

function confetti() {
  const colors = ['#FFD54A', '#FF5D73', '#5EC8FF', '#4ADE9B', '#B98CFF'];
  els.confetti.innerHTML = '';
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    p.style.animationDuration = `${2.4 + Math.random() * 1.8}s`;
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 220}px`);
    p.style.setProperty('--spin', `${(Math.random() - 0.5) * 1440}deg`);
    els.confetti.appendChild(p);
  }
  setTimeout(() => { els.confetti.innerHTML = ''; }, 5200);
}

// ============================================================ classement

async function setupScoreForm() {
  els.scoreForm.hidden = true;
  const lb = await leaderboard;
  if (!lb || !lb.isLeaderboardConfigured()) return;
  els.scoreForm.hidden = false;
  els.pseudo.value = store('pin-the-globe-pseudo') || '';
  els.saveScore.disabled = false;
  els.saveScore.textContent = 'Envoyer';
}

els.saveScore.addEventListener('click', async () => {
  const name = els.pseudo.value.trim();
  if (!name) { els.pseudo.focus(); return; }
  if (state.submitted) return;
  const lb = await leaderboard;
  if (!lb) return;
  els.saveScore.disabled = true;
  els.saveScore.textContent = 'Envoi…';
  const total = Math.max(1, Math.round(state.rounds.reduce((s, r) => s + r.score, 0)));
  const ok = await lb.submitScore(MODES[state.mode].gameId, name, total);
  store('pin-the-globe-pseudo', name);
  els.scoreMsg.hidden = false;
  if (ok) {
    state.submitted = true;
    els.scoreForm.hidden = true;
    els.scoreMsg.textContent = 'Score enregistré ! 🎉';
    els.scoreMsg.className = 'score-msg ok';
    renderBoard(els.endBoard, state.mode);
  } else {
    els.saveScore.disabled = false;
    els.saveScore.textContent = 'Envoyer';
    els.scoreMsg.textContent = "Oups, l'envoi a échoué. Réessaie !";
    els.scoreMsg.className = 'score-msg ko';
  }
});
els.pseudo.addEventListener('keydown', (e) => { if (e.key === 'Enter') els.saveScore.click(); });

async function renderBoard(container, mode) {
  const lb = await leaderboard;
  if (!lb || !lb.isLeaderboardConfigured()) { container.hidden = true; return; }
  container.hidden = false;
  container.innerHTML = `
    <div class="board-tabs">
      ${Object.entries(MODES).map(([k, m]) => `<button data-mode="${k}" class="${k === mode ? 'active' : ''}">${m.icon} ${m.label}</button>`).join('')}
    </div>
    <ol class="board-list"><li class="board-empty">Chargement…</li></ol>`;
  container.querySelectorAll('.board-tabs button').forEach((b) => {
    b.addEventListener('click', () => renderBoard(container, b.dataset.mode));
  });
  const list = await lb.fetchTopScores(MODES[mode].gameId, 10);
  const ol = container.querySelector('.board-list');
  if (!ol) return;
  ol.innerHTML = list.length
    ? list.map((e, i) => `<li><span class="board-rank">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="board-name">${escapeHtml(e.name)}</span><span class="board-km">${fmtKm(e.value)} km</span></li>`).join('')
    : '<li class="board-empty">Sois le premier du classement mondial !</li>';
}

function renderBests() {
  document.querySelectorAll('[data-best]').forEach((el) => {
    const best = store(`pin-the-globe-best-${el.dataset.best}`);
    el.innerHTML = best != null ? `🏅 Record<br><b>${fmtKm(best)} km</b>` : '';
  });
}

// ============================================================ accueil

function showIntro() {
  state.phase = 'intro';
  globe.clearAll();
  globe.tapEnabled = false;
  els.hud.hidden = true;
  showPanel(els.intro);
  globe.goHome(1400).then(() => { if (state.phase === 'intro') globe.setAutoRotate(true); });
  renderBests();
  renderBoard(els.introBoard, state.mode);
}

document.querySelectorAll('.mode').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.phase === 'loading') return;
    sfx.click();
    startGame(btn.dataset.mode);
  });
});

els.hintBtn.addEventListener('click', useHint);
els.validateBtn.addEventListener('click', validate);
els.nextBtn.addEventListener('click', next);
$('againBtn').addEventListener('click', () => { sfx.click(); startGame(state.mode); });
$('menuBtn').addEventListener('click', () => { sfx.click(); showIntro(); });

$('zoomIn').addEventListener('click', () => { globe.setAutoRotate(false); globe.zoomBy(0.72); });
$('zoomOut').addEventListener('click', () => globe.zoomBy(1.38));
$('zoomHome').addEventListener('click', () => globe.goHome(1000));

function renderSoundBtn() {
  els.soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
  els.soundBtn.setAttribute('aria-label', isSoundOn() ? 'Couper le son' : 'Activer le son');
}
els.soundBtn.addEventListener('click', () => { toggleSound(); renderSoundBtn(); sfx.click(); });
renderSoundBtn();

// Raccourcis clavier : Entrée pour valider / continuer.
document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'Enter') {
    if (state.phase === 'aim' && state.guess) validate();
    else if (state.phase === 'reveal') next();
  }
});

// ============================================================ démarrage

showPanel(els.intro);
renderBests();
const ready = Promise.race([globe.load(), new Promise((r) => setTimeout(() => r(null), 15000))]);
ready.then((res) => {
  els.loader.classList.add('hide');
  if (res && !res.textures) toast('Images satellite indisponibles : voici une Terre dessinée.');
  showIntro();
});
