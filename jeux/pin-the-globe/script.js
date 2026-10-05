import { Globe, distanceKm } from './globe.js';
import { CITIES, CONTINENTS } from './data.js';
import { PLACES, KINDS } from './places.js';
import { ANIMALS, ANIMAL_KINDS } from './animals.js';
import { sfx, isSoundOn, toggleSound } from './sound.js';

// Le classement mondial est chargé à part : si Firebase est injoignable,
// le jeu marche quand même.
const leaderboard = import('../../shared/leaderboard.js').catch(() => null);

const ROUNDS = 10;
const HINT_PENALTY = 500;

// Titres de fin de partie des modes à points, du meilleur au moins bon.
const RANKS_MONUMENTS = [
  { min: 10, emoji: '🏆', title: 'Maître des merveilles', text: 'Un sans-faute ! Tu connais les trésors de la planète par cœur.' },
  { min: 8, emoji: '🌟', title: 'Grand explorateur', text: 'Bravo ! Presque toutes les merveilles sont à leur place.' },
  { min: 6, emoji: '🧭', title: 'Aventurier', text: 'Très beau voyage ! Encore un petit effort pour le sans-faute.' },
  { min: 4, emoji: '🎒', title: 'Curieux du monde', text: 'Joli parcours ! Relis les fiches et rejoue pour progresser.' },
  { min: 0, emoji: '🗺️', title: 'Apprenti voyageur', text: "Les merveilles du monde n'ont pas fini de te surprendre. Rejoue !" },
];
const RANKS_ANIMALS = [
  { min: 10, emoji: '🏆', title: 'Grand naturaliste', text: 'Un sans-faute ! Tous les animaux sont rentrés chez eux.' },
  { min: 8, emoji: '🌟', title: 'Expert de la nature', text: 'Bravo ! Presque tous les animaux ont retrouvé leur maison.' },
  { min: 6, emoji: '🧭', title: 'Explorateur de la nature', text: 'Très beau safari ! Encore un petit effort pour le sans-faute.' },
  { min: 4, emoji: '🎒', title: 'Apprenti soigneur', text: 'Joli parcours ! Relis les fiches et rejoue pour progresser.' },
  { min: 0, emoji: '🔍', title: 'Petit curieux', text: "Les animaux du monde n'ont pas fini de te surprendre. Rejoue !" },
];

// kind 'cities' : on plante une épingle, score = km (le plus petit gagne).
// kind 'places' : on choisit parmi 10 points dorés, 1 point par bonne réponse.
//   items : les lieux ou animaux possibles ; kinds : leurs catégories ;
//   balance : catégories à équilibrer dans une partie ; words : les mots affichés.
// Deux jeux partagent ce moteur : Pin the Globe et Safari Planète
// (choisi par <body data-game="…">).
const GAMES = {
  pin: {
    explorateur: { kind: 'cities', label: 'Explorateur', short: 'Explorateur', icon: '🧭', gameId: 'pin-the-globe-explorateur' },
    voyageur: { kind: 'cities', label: 'Grand voyageur', short: 'Voyageur', icon: '✈️', gameId: 'pin-the-globe-voyageur' },
    monuments: {
      kind: 'places', label: 'Monuments & merveilles', short: 'Monuments', icon: '🗽', gameId: 'pin-the-globe-monuments',
      items: PLACES, kinds: KINDS, balance: ['monument', 'nature'], recentKey: 'pin-the-globe-recent-places', ranks: RANKS_MONUMENTS,
      words: {
        round: 'Lieu', next: 'Lieu suivant →', tip: 'Touche le point doré ❓ où se trouve ce lieu.', other: 'un autre lieu',
        recapHint: 'Touche un lieu pour le revoir sur le globe.', typeLabel: '🏷️ Type',
      },
    },
  },
  safari: {
    animaux: {
      kind: 'places', label: 'Safari Planète', short: 'Animaux', icon: '🐾', gameId: 'safari-planete',
      items: ANIMALS, kinds: ANIMAL_KINDS, balance: null, recentKey: 'safari-planete-recent', ranks: RANKS_ANIMALS,
      words: {
        round: 'Animal', next: 'Animal suivant →', tip: 'Touche le point doré ❓ où vit cet animal.', other: 'un autre animal',
        recapHint: 'Touche un animal pour revoir sa maison sur le globe.', typeLabel: '🧬 Classe', hemiSubject: 'Ce lieu de vie',
      },
    },
  },
};
const GAME = document.body.dataset.game in GAMES ? document.body.dataset.game : 'pin';
const MODES = GAMES[GAME];

const $ = (id) => document.getElementById(id);
const els = {
  stage: $('stage'), topbar: $('topbar'), hud: $('hud'), dots: $('dots'),
  roundNum: $('roundNum'), hudRoundLabel: $('hudRoundLabel'), totalKm: $('totalKm'),
  hudTotalLabel: $('hudTotalLabel'), hudTotalUnit: $('hudTotalUnit'), soundBtn: $('soundBtn'),
  coords: $('coords'), loader: $('loader'), toast: $('toast'), confetti: $('confetti'),
  intro: $('intro'), play: $('play'), result: $('result'), end: $('end'),
  askCity: $('askCity'), askCountry: $('askCountry'), tip: $('tip'),
  hintBtn: $('hintBtn'), validateBtn: $('validateBtn'), nextBtn: $('nextBtn'),
  verdict: $('verdict'), verdictEmoji: $('verdictEmoji'), verdictLabel: $('verdictLabel'),
  verdictKm: $('verdictKm'), verdictUnit: $('verdictUnit'), verdictPenalty: $('verdictPenalty'), compare: $('compare'),
  cityIcon: $('cityIcon'), cityName: $('cityName'), cityRole: $('cityRole'),
  cityContinent: $('cityContinent'), cityPop: $('cityPop'), cityPopLabel: $('cityPopLabel'),
  cityLang: $('cityLang'), cityLangLabel: $('cityLangLabel'),
  cityCoords: $('cityCoords'), cityHemi: $('cityHemi'), cityFacts: $('cityFacts'),
  endMode: $('endMode'), rankEmoji: $('rankEmoji'), rankTitle: $('rankTitle'), rankText: $('rankText'),
  endTotal: $('endTotal'), endTotalLabel: $('endTotalLabel'), endTotalUnit: $('endTotalUnit'),
  endBest: $('endBest'), recap: $('recap'), recapHint: $('recapHint'),
  scoreForm: $('scoreForm'), pseudo: $('pseudo'), saveScore: $('saveScore'), scoreMsg: $('scoreMsg'),
  introBoard: $('introBoard'), endBoard: $('endBoard'), cityHabitat: $('cityHabitat'),
  lightbox: $('lightbox'), lightboxImg: $('lightboxImg'), lightboxCaption: $('lightboxCaption'),
};

const state = {
  phase: 'loading', // loading | intro | aim | reveal | end
  mode: Object.keys(MODES)[0],
  rounds: [],
  index: 0,
  submitted: false,
  startedAt: 0,
  seconds: 0,
  // mode Villes
  pin: null,
  guess: null,
  hintUsed: false,
  // mode Monuments
  spots: [],
  selected: null,
};

const isPlaces = (mode = state.mode) => MODES[mode].kind === 'places';
const words = () => MODES[state.mode].words;

// ============================================================ utilitaires

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const fmtKm = (km) => nf.format(Math.round(km));
const fmtDeg = (v) => Math.abs(v).toFixed(1).replace('.', ',') + '°';
const fmtLat = (lat) => `${fmtDeg(lat)} ${lat >= 0 ? 'N' : 'S'}`;
const fmtLon = (lon) => `${fmtDeg(lon)} ${lon >= 0 ? 'E' : 'O'}`;
const fmtCoords = (p) => `${fmtLat(p.lat)} · ${fmtLon(p.lon)}`;
const flag = (cc) => `<span class="fi fi-${cc}"></span>`;
const flags = (list) => (list.length ? list.map(flag).join(' ') : '🌊');

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

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

const roundTone = (r) => (r.place ? (r.correct ? 'perfect' : 'lost') : verdictFor(r.km).tone);

function rankForKm(total) {
  if (total < 1500) return { emoji: '🧭', title: 'Boussole humaine', text: "Incroyable ! Tu connais la Terre comme ta poche." };
  if (total < 4000) return { emoji: '🌟', title: 'Grand explorateur', text: 'Bravo ! Tes épingles tombent presque toujours au bon endroit.' };
  if (total < 8000) return { emoji: '🚢', title: 'Navigateur', text: 'Très beau voyage ! Encore un peu et tu deviens un grand explorateur.' };
  if (total < 15000) return { emoji: '🎒', title: 'Voyageur', text: 'Joli tour du monde ! Rejoue pour découvrir de nouvelles villes.' };
  if (total < 25000) return { emoji: '🗺️', title: 'Apprenti globe-trotter', text: "Chaque partie t'apprend où se trouvent de nouvelles villes. Continue !" };
  return { emoji: '🙃', title: 'Touriste égaré', text: "La Terre est grande ! Utilise les indices et rejoue : tu vas vite progresser." };
}

const rankForPoints = (points) => MODES[state.mode].ranks.find((r) => points >= r.min);

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

function hemisphereText(c, subject = c.name) {
  const verb = /^Les /.test(subject) ? 'se trouvent' : 'se trouve';
  const ns = Math.abs(c.lat) < 3
    ? `juste au ${c.lat >= 0 ? 'nord' : 'sud'} de l'équateur`
    : `dans l'hémisphère ${c.lat >= 0 ? 'Nord' : 'Sud'}, au ${c.lat >= 0 ? 'nord' : 'sud'} de l'équateur`;
  const ew = Math.abs(c.lon) < 1
    ? 'presque pile sur le méridien de Greenwich, la ligne de longitude 0°'
    : `à l'${c.lon >= 0 ? 'est' : 'ouest'} du méridien de Greenwich`;
  return `${subject} ${verb} ${ns}, et ${ew}.`;
}

// Score du mode Monuments pour le classement partagé, où « plus petit = mieux » :
// d'abord le nombre d'erreurs, puis le temps pour départager.
const encodePlaces = (points, secs) => (ROUNDS - points) * 10000 + Math.min(9998, secs) + 1;
const decodePlaces = (v) => ({ points: ROUNDS - Math.floor((v - 1) / 10000), secs: (v - 1) % 10000 });
const betterPlaces = (a, b) => !b || a.points > b.points || (a.points === b.points && a.secs < b.secs);

// ============================================================ choix des villes et des lieux

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

// 10 lieux (ou animaux) bien espacés, pour que les points dorés ne se touchent
// pas, au moins un par continent, et moitié-moitié entre les catégories de
// `balance` (monuments et merveilles naturelles).
function pickPlaces() {
  const { items, balance, recentKey } = MODES[state.mode];
  const recent = store(recentKey) || [];
  const ordered = [
    ...shuffle(items.filter((p) => !recent.includes(p.id))),
    ...shuffle(items.filter((p) => recent.includes(p.id))),
  ];
  let chosen = [];
  for (const minKm of [1500, 1000, 600, 0]) {
    chosen = [];
    const ok = (p) => !chosen.includes(p) && chosen.every((o) => distanceKm(o, p) >= minKm);
    for (const cont of shuffle(CONTINENTS)) {
      const p = ordered.find((q) => q.continent === cont && ok(q));
      if (p) chosen.push(p);
    }
    while (chosen.length < ROUNDS) {
      let want = null;
      if (balance) {
        const firsts = chosen.filter((p) => p.kind === balance[0]).length;
        want = firsts * 2 <= chosen.length ? balance[0] : balance[1];
      }
      const p = ordered.find((q) => q.kind === want && ok(q)) || ordered.find(ok);
      if (!p) break;
      chosen.push(p);
    }
    if (chosen.length === ROUNDS) break;
  }
  store(recentKey, chosen.map((p) => p.id));
  return shuffle(chosen).map((place) => ({ place, chosen: null, correct: false, score: 0 }));
}

// ============================================================ globe

const globe = new Globe(els.stage, {
  onTap: (hit, pt) => {
    if (state.phase !== 'aim') return;
    if (isPlaces()) tapSpot(pt);
    else if (hit) placePin(hit);
  },
  onHover: (hit) => {
    if (!hit || state.phase !== 'aim' || isPlaces()) { els.coords.classList.remove('show'); return; }
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

// ============================================================ marqueurs

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

function spotElement() {
  const el = document.createElement('div');
  el.className = 'spot';
  el.innerHTML = '<span class="spot-ring"></span><span class="spot-core">?</span><span class="tag"></span>';
  return el;
}

/** Range le lieu sur son point : vert si trouvé, orange si c'est le jeu qui l'a placé. */
function fillSpot(spot, how) {
  spot.filled = true;
  spot.el.classList.remove('selected');
  spot.el.classList.add('filled', how);
  spot.el.querySelector('.spot-core').textContent = spot.place.icon;
  spot.el.querySelector('.tag').textContent = spot.place.name;
}

// ============================================================ photos des lieux

const photoPlaces = {}; // quel lieu est affiché dans chaque cadre photo ('ask', 'card')

function creditHtml(place) {
  const { author, license, page } = place.credit;
  return `📷 <a href="${escapeHtml(page)}" target="_blank" rel="noopener">${escapeHtml(author)}</a> · ${escapeHtml(license)}`;
}

/** Affiche la photo d'un lieu dans un cadre ('ask' ou 'card'), ou cache le cadre. */
function setPhoto(frame, place) {
  const fig = $(`${frame}Photo`);
  const img = $(`${frame}PhotoImg`);
  photoPlaces[frame] = place;
  fig.hidden = !place?.photo;
  els.play.classList.toggle('has-photo', frame === 'ask' && !fig.hidden);
  if (fig.hidden) return;
  fig.classList.add('loading');
  img.onload = () => fig.classList.remove('loading');
  img.onerror = () => { fig.hidden = true; els.play.classList.remove('has-photo'); };
  img.alt = `Photo : ${place.name}`;
  img.src = place.photo;
  fig.querySelector('.photo-btn').style.setProperty('--photo', `url("${place.photo}")`);
  $(`${frame}PhotoCredit`).innerHTML = creditHtml(place);
}

function openLightbox(place) {
  if (!place) return;
  sfx.click();
  els.lightboxImg.src = place.photo;
  els.lightboxImg.alt = `Photo : ${place.name}`;
  els.lightboxCaption.innerHTML = `<strong>${place.icon} ${escapeHtml(place.name)}</strong>`
    + (place.photoNote ? `<span>${escapeHtml(place.photoNote)}</span>` : '')
    + `<small>${creditHtml(place)} — photo de Wikimedia Commons</small>`;
  els.lightbox.hidden = false;
  $('lightboxClose').focus();
}

function closeLightbox() {
  els.lightbox.hidden = true;
}

document.querySelectorAll('.photo-btn').forEach((btn) => {
  btn.addEventListener('click', () => openLightbox(photoPlaces[btn.dataset.photo]));
});
$('lightboxClose').addEventListener('click', closeLightbox);
els.lightbox.addEventListener('click', (e) => { if (e.target === els.lightbox) closeLightbox(); });

// ============================================================ mode Villes : l'épingle

function placePin(hit) {
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

// ============================================================ mode Monuments : les points dorés

// On choisit le point libre le plus proche du doigt (dans un rayon confortable).
function tapSpot(pt) {
  let best = null;
  let bestD = Infinity;
  for (const spot of state.spots) {
    if (spot.filled) continue;
    const p = globe.project(spot.place.lat, spot.place.lon);
    if (!p.visible) continue;
    const d = Math.hypot(p.x - pt.x, p.y - pt.y);
    if (d < bestD) { bestD = d; best = spot; }
  }
  if (best && bestD < 48) selectSpot(best);
  else toast('Touche un des points dorés ❓ sur le globe.');
}

function selectSpot(spot) {
  if (state.selected) state.selected.el.classList.remove('selected');
  state.selected = spot;
  spot.el.classList.remove('selected');
  void spot.el.offsetWidth;
  spot.el.classList.add('selected');
  sfx.pin();
  els.validateBtn.disabled = false;
  const open = state.spots.filter((s) => !s.filled).length;
  els.tip.querySelector('.tip-action').textContent = open === 1
    ? 'C\'est le dernier point libre : valide !'
    : 'Point choisi ! Touche un autre point pour changer d\'avis.';
}

// ============================================================ déroulé

function updateHud() {
  const places = isPlaces();
  els.roundNum.textContent = Math.min(state.index + 1, ROUNDS);
  els.hudRoundLabel.textContent = places ? words().round : 'Ville';
  els.hudTotalLabel.textContent = places ? 'Score' : 'Total';
  els.hudTotalUnit.textContent = places ? 'pts' : 'km';
  const total = state.rounds.reduce((s, r) => s + r.score, 0);
  els.totalKm.textContent = fmtKm(total);
  els.dots.innerHTML = state.rounds.map((r, i) => {
    let cls = '';
    if (i < state.index || (i === state.index && state.phase === 'reveal')) cls = `done tone-${roundTone(r)}`;
    else if (i === state.index) cls = 'current';
    return `<li class="${cls}"></li>`;
  }).join('');
}

function startGame(mode) {
  state.mode = mode;
  state.index = 0;
  state.submitted = false;
  state.startedAt = performance.now();
  state.spots = [];
  globe.clearAll();
  globe.setAutoRotate(false);
  els.hud.hidden = false;

  if (isPlaces()) {
    state.rounds = pickPlaces();
    // On précharge les 10 photos pour qu'elles s'affichent tout de suite.
    state.rounds.forEach(({ place }) => { new Image().src = place.photo; });
    state.spots = state.rounds.map(({ place }) => {
      const el = spotElement();
      return { place, el, marker: globe.addMarker(el, place.lat, place.lon), filled: false };
    });
  } else {
    state.rounds = pickCities(mode);
  }
  startRound();
}

function startRound() {
  state.phase = 'aim';
  globe.tapEnabled = true;
  els.validateBtn.disabled = true;
  if (isPlaces()) startPlaceRound();
  else startCityRound();
  showPanel(els.play);
  updateHud();
  // On reprend de la hauteur pour voir toute la Terre, sans tourner vers la réponse.
  globe.goHome(1100);
}

function startCityRound() {
  const { city } = state.rounds[state.index];
  state.pin = null;
  state.guess = null;
  state.hintUsed = false;
  globe.clearAll();

  els.askCity.textContent = city.name;
  els.askCountry.innerHTML = `${flag(city.cc)} ${escapeHtml(city.country)}`;
  els.tip.textContent = 'Fais tourner le globe, puis touche-le pour planter ton épingle.';
  els.hintBtn.hidden = false;
  els.hintBtn.disabled = false;
  setPhoto('ask', null);
  els.hintBtn.innerHTML = `💡 Indice <small>+${HINT_PENALTY} km</small>`;
}

function startPlaceRound() {
  const { place } = state.rounds[state.index];
  state.selected = null;
  globe.clearArcs();
  for (const s of state.spots) s.el.classList.remove('selected');

  const kind = MODES[state.mode].kinds[place.kind];
  els.askCity.textContent = `${place.icon} ${place.name}`;
  els.askCountry.innerHTML = `<span class="kind-badge kind-${place.kind}">${kind.icon} ${kind.label}</span>`;
  els.tip.innerHTML = `<em class="clue">${escapeHtml(place.clue)}</em><span class="tip-action">${words().tip}</span>`;
  els.hintBtn.hidden = true;
  setPhoto('ask', place);

  // Dernier lieu : il ne reste qu'un point, on le choisit d'office.
  const open = state.spots.filter((s) => !s.filled);
  if (open.length === 1) selectSpot(open[0]);
}

function useHint() {
  if (state.phase !== 'aim' || state.hintUsed || isPlaces()) return;
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

function validate() {
  if (state.phase !== 'aim') return;
  if (isPlaces()) { if (state.selected) validatePlace(); } else if (state.guess) validateCity();
}

async function validateCity() {
  const round = state.rounds[state.index];
  const { city } = round;
  state.phase = 'reveal';
  globe.tapEnabled = false;
  els.coords.classList.remove('show');

  round.guess = state.guess;
  round.km = distanceKm(state.guess, city);
  round.hint = state.hintUsed;
  round.score = round.km + (round.hint ? HINT_PENALTY : 0);

  fillCityResult(round);
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

async function validatePlace() {
  const round = state.rounds[state.index];
  const { place } = round;
  const chosen = state.selected;
  const target = state.spots.find((s) => s.place === place);
  state.phase = 'reveal';
  globe.tapEnabled = false;

  round.chosen = chosen.place;
  round.correct = chosen === target;
  round.score = round.correct ? 1 : 0;

  fillPlaceResult(round);
  showPanel(els.result);
  els.nextBtn.disabled = true;
  sfx.whoosh();

  if (round.correct) {
    await globe.flyToLatLon(place.lat, place.lon, globe.fitDistance(0.4), 1200);
    fillSpot(target, 'good');
  } else {
    // Le point choisi tremble puis redevient libre ; l'arc mène au bon point.
    chosen.el.classList.remove('selected');
    chosen.el.classList.add('wrong');
    setTimeout(() => chosen.el.classList.remove('wrong'), 900);
    const km = distanceKm(chosen.place, place);
    if (km > 11000) await globe.flyToLatLon(place.lat, place.lon, globe.homeDistance(), 1400);
    else await globe.flyToFit([chosen.place, place], 1300);
    await globe.addArc(chosen.place, place, { duration: 800, color: 0xff8a4c });
    fillSpot(target, 'missed');
  }

  sfx.reveal();
  els.verdict.classList.add('show');
  sfx.verdict(round.correct ? 0 : Infinity);
  els.verdictLabel.classList.add('pop');
  els.nextBtn.disabled = false;
  updateHud();
}

function setVerdict(v, valueText, unit) {
  els.verdict.className = `verdict tone-${v.tone}`;
  els.verdictEmoji.textContent = v.emoji;
  els.verdictLabel.textContent = v.label;
  els.verdictLabel.classList.remove('pop');
  els.verdictKm.textContent = valueText;
  els.verdictUnit.textContent = unit;
}

function fillCityResult(round) {
  const { city } = round;
  setVerdict(verdictFor(round.km), '0', 'km');
  els.verdictPenalty.hidden = !round.hint;
  els.compare.textContent = compareText(round.km);

  els.cityIcon.textContent = city.icon;
  els.cityName.textContent = city.name;
  const where = city.capital ? `Capitale · ${escapeHtml(city.country)}` : escapeHtml(city.country);
  els.cityRole.innerHTML = `${flag(city.cc)} ${where}`;
  els.cityContinent.textContent = city.continentLabel || city.continent;
  els.cityPopLabel.textContent = '👥 Habitants';
  els.cityPop.textContent = city.pop;
  els.cityLangLabel.textContent = '🗣️ Langue';
  els.cityLang.textContent = city.lang;
  setPhoto('card', null);
  fillCommon(city, 'Ville suivante →');
}

function fillPlaceResult(round) {
  const { place } = round;
  setVerdict(
    round.correct
      ? { emoji: '✅', label: 'Bonne réponse !', tone: 'perfect' }
      : { emoji: '❌', label: 'Raté, pas ce point-là !', tone: 'lost' },
    round.correct ? '+1' : '0',
    'point',
  );
  els.verdictPenalty.hidden = true;
  els.compare.textContent = round.correct
    ? '🎯 Tu as trouvé le bon point du premier coup !'
    : `📍 Le point que tu as choisi était à ${fmtKm(distanceKm(round.chosen, place))} km de là. Il reste libre pour ${words().other} !`;

  const kind = MODES[state.mode].kinds[place.kind];
  els.cityIcon.textContent = place.icon;
  els.cityName.textContent = place.name;
  els.cityRole.innerHTML = `${flags(place.flags)} ${escapeHtml(place.country)}`;
  els.cityContinent.textContent = place.continent;
  els.cityPopLabel.textContent = `📊 ${place.stat.label}`;
  els.cityPop.textContent = place.stat.value;
  els.cityLangLabel.textContent = words().typeLabel;
  els.cityLang.textContent = `${kind.icon} ${kind.label}`;
  setPhoto('card', place);
  fillCommon(place, words().next, words().hemiSubject);
}

function fillCommon(item, nextLabel, hemiSubject) {
  els.cityCoords.textContent = fmtCoords(item);
  els.cityHemi.textContent = hemisphereText(item, hemiSubject);
  els.cityHabitat.hidden = !item.habitat;
  if (item.habitat) els.cityHabitat.innerHTML = `🌳 Milieu naturel : <b>${escapeHtml(item.habitat)}</b>`;
  els.cityFacts.innerHTML = item.facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
  els.nextBtn.textContent = state.index === ROUNDS - 1 ? 'Voir mon score 🏆' : nextLabel;
}

function next() {
  if (state.phase !== 'reveal' || els.nextBtn.disabled) return;
  sfx.click();
  state.index++;
  if (state.index >= ROUNDS) endGame();
  else startRound();
}

// ============================================================ fin de partie

function finalValue() {
  if (isPlaces()) {
    const points = state.rounds.reduce((s, r) => s + r.score, 0);
    return encodePlaces(points, state.seconds);
  }
  return Math.max(1, Math.round(state.rounds.reduce((s, r) => s + r.score, 0)));
}

function endGame() {
  state.phase = 'end';
  state.seconds = Math.round((performance.now() - state.startedAt) / 1000);
  const total = state.rounds.reduce((s, r) => s + r.score, 0);
  const mode = MODES[state.mode];
  const places = isPlaces();
  const bestKey = `pin-the-globe-best-${state.mode}`;
  const prevBest = store(bestKey);

  els.endMode.textContent = `${mode.icon} Partie terminée · ${mode.label}`;
  els.endTotal.textContent = '0';

  let rank;
  if (places) {
    rank = rankForPoints(total);
    const result = { points: total, secs: state.seconds };
    const isRecord = betterPlaces(result, prevBest);
    if (isRecord) store(bestKey, result);
    els.endTotalLabel.textContent = 'Ton score';
    els.endTotalUnit.textContent = `/ ${ROUNDS}`;
    const time = `⏱️ En ${fmtDuration(state.seconds)}`;
    els.endBest.innerHTML = isRecord
      ? `${time} · ${prevBest ? `🏅 <b>Nouveau record !</b> (avant : ${prevBest.points}/${ROUNDS})` : '🏅 Ton premier record est enregistré !'}`
      : `${time} · Ton record : ${prevBest.points}/${ROUNDS} en ${fmtDuration(prevBest.secs)}`;
    els.recapHint.textContent = words().recapHint;
  } else {
    rank = rankForKm(total);
    const isRecord = prevBest == null || total < prevBest;
    if (isRecord) store(bestKey, Math.round(total));
    els.endTotalLabel.textContent = 'Ton total';
    els.endTotalUnit.textContent = 'km';
    els.endBest.innerHTML = isRecord
      ? (prevBest == null ? '🏅 Ton premier record est enregistré !' : `🏅 <b>Nouveau record !</b> (avant : ${fmtKm(prevBest)} km)`)
      : `Ton record : ${fmtKm(prevBest)} km`;
    els.recapHint.textContent = 'Touche une ville pour la revoir sur le globe.';
  }

  els.rankEmoji.textContent = rank.emoji;
  els.rankTitle.textContent = rank.title;
  els.rankText.textContent = rank.text;

  els.recap.innerHTML = state.rounds.map((r, i) => {
    const name = places
      ? `${r.place.icon} ${escapeHtml(r.place.name)}`
      : `${escapeHtml(r.city.name)}${r.hint ? ' <i title="Indice utilisé">💡</i>' : ''}`;
    const lead = places ? (r.correct ? '✅' : '❌') : flag(r.city.cc);
    const value = places ? (r.correct ? '+1' : '0') : `${fmtKm(r.score)} km`;
    return `<li><button data-i="${i}" class="tone-${roundTone(r)}">
      <span class="recap-n">${i + 1}</span>
      ${lead}
      <span class="recap-name">${name}</span>
      <span class="recap-km">${value}</span>
    </button></li>`;
  }).join('');

  els.scoreMsg.hidden = true;
  showPanel(els.end);
  updateHud();
  els.hud.hidden = true;
  setupScoreForm();
  renderBoard(els.endBoard, state.mode);

  // Tout le voyage sur le globe.
  if (places) {
    globe.clearArcs(); // les 10 lieux restent rangés sur leurs points
  } else {
    globe.clearAll();
    for (const r of state.rounds) {
      globe.addMarker(pinElement('mini'), r.guess.lat, r.guess.lon);
      globe.addMarker(cityElement(r.city, 'mini'), r.city.lat, r.city.lon);
      globe.addArc(r.guess, r.city, { animate: false });
    }
  }
  globe.goHome(1600).then(() => { if (state.phase === 'end') globe.setAutoRotate(true); });

  sfx.fanfare();
  countUp(els.endTotal, total, places ? 700 : 1400);
  if (places ? total >= 7 : total < 8000) confetti();
  renderBests();
}

els.recap.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-i]');
  if (!btn) return;
  const r = state.rounds[Number(btn.dataset.i)];
  globe.setAutoRotate(false);
  if (r.place) globe.flyToLatLon(r.place.lat, r.place.lon, globe.fitDistance(0.4), 1200);
  else globe.flyToFit([r.guess, r.city], 1200);
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
  const ok = await lb.submitScore(MODES[state.mode].gameId, name, finalValue());
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

function boardValue(mode, value) {
  if (!isPlaces(mode)) return `${fmtKm(value)} km`;
  const { points, secs } = decodePlaces(value);
  return `${points}/${ROUNDS} · ${fmtDuration(secs)}`;
}

async function renderBoard(container, mode) {
  const lb = await leaderboard;
  if (!lb || !lb.isLeaderboardConfigured()) { container.hidden = true; return; }
  container.hidden = false;
  // Un seul mode (Safari Planète) : un simple titre au lieu des onglets.
  const tabs = Object.keys(MODES).length > 1
    ? `<div class="board-tabs">
      ${Object.entries(MODES).map(([k, m]) => `<button data-mode="${k}" class="${k === mode ? 'active' : ''}">${m.icon} ${m.short}</button>`).join('')}
    </div>`
    : '<p class="board-title">🏆 Classement mondial</p>';
  container.innerHTML = `
    ${tabs}
    <ol class="board-list"><li class="board-empty">Chargement…</li></ol>`;
  container.querySelectorAll('.board-tabs button').forEach((b) => {
    b.addEventListener('click', () => renderBoard(container, b.dataset.mode));
  });
  const list = await lb.fetchTopScores(MODES[mode].gameId, 10);
  const ol = container.querySelector('.board-list');
  if (!ol) return;
  ol.innerHTML = list.length
    ? list.map((e, i) => `<li><span class="board-rank">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="board-name">${escapeHtml(e.name)}</span><span class="board-km">${boardValue(mode, e.value)}</span></li>`).join('')
    : '<li class="board-empty">Sois le premier du classement mondial !</li>';
}

function renderBests() {
  document.querySelectorAll('[data-best]').forEach((el) => {
    const best = store(`pin-the-globe-best-${el.dataset.best}`);
    if (best == null) { el.innerHTML = ''; return; }
    el.innerHTML = isPlaces(el.dataset.best)
      ? `🏅 Record<br> <b>${best.points}/${ROUNDS}</b>`
      : `🏅 Record<br> <b>${fmtKm(best)} km</b>`;
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
  if (!els.lightbox.hidden) {
    if (e.key === 'Escape') closeLightbox();
    return;
  }
  // Un bouton qui a le focus réagit déjà tout seul à Entrée.
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
  if (e.key === 'Enter') {
    if (state.phase === 'aim') validate();
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
