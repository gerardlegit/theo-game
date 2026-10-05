import { ERAS, ERA_BY_ID, EVENTS } from './data.js';
import { renderArt, OWL } from './art.js';
import { sfx, isSoundOn, toggleSound } from './sound.js';

// Le classement mondial est facultatif : si Firebase ne se charge pas
// (pas de réseau…), le jeu marche quand même.
const leaderboard = import('../../shared/leaderboard.js').catch(() => null);

/* ---------- Réglages ---------- */
const ROUNDS = 10;                 // cartes à placer (+ 1 carte de départ déjà posée)
const MODES = {
  apprenti: { label: 'Apprenti historien', short: 'Apprenti', icon: '🧒', gameId: 'frise-du-temps-apprenti', showDate: true },
  historien: { label: 'Grand historien', short: 'Historien', icon: '🦉', gameId: 'frise-du-temps-historien', showDate: false },
};
const THIS_YEAR = new Date().getFullYear();

/* ---------- Éléments de la page ---------- */
const $ = (id) => document.getElementById(id);
const els = {
  hud: $('hud'), roundNum: $('roundNum'), dots: $('dots'), score: $('score'), hudScore: $('hudScore'),
  soundBtn: $('soundBtn'),
  eventZone: $('eventZone'), eventCard: $('eventCard'), evArt: $('evArt'), evArtPic: $('evArtPic'),
  evKicker: $('evKicker'), evTitle: $('evTitle'), evDate: $('evDate'), evText: $('evText'),
  verdict: $('verdict'), verdictHead: $('verdictHead'), verdictDate: $('verdictDate'), verdictAgo: $('verdictAgo'),
  verdictEra: $('verdictEra'), verdictFact: $('verdictFact'),
  help: $('help'), actionBtn: $('actionBtn'),
  frieze: $('frieze'), track: $('track'), items: $('items'), bands: $('bands'),
  intro: $('intro'), erasLegend: $('erasLegend'), introBoard: $('introBoard'),
  endModal: $('endModal'), endOwl: $('endOwl'), endTitle: $('endTitle'), endStars: $('endStars'),
  endScore: $('endScore'), endTime: $('endTime'), endMsg: $('endMsg'), endBest: $('endBest'),
  scoreForm: $('scoreForm'), pseudo: $('pseudo'), saveBtn: $('saveBtn'), scoreSaved: $('scoreSaved'), endBoard: $('endBoard'),
  againBtn: $('againBtn'), viewBtn: $('viewBtn'), menuBtn: $('menuBtn'),
  confetti: $('confetti'),
};

/* ---------- État de la partie ---------- */
const state = {
  mode: 'apprenti',
  deck: [],          // les 10 cartes à placer, dans l'ordre du jeu
  placed: [],        // la frise : [{ ev, status: 'start' | 'good' | 'bad' }], triée par date
  round: 0,
  score: 0,
  results: [],       // true / false pour chaque carte
  pending: null,     // emplacement choisi (pas encore validé)
  phase: 'intro',    // 'place' | 'busy' | 'reveal' | 'end'
  t0: 0,
  seconds: 0,
  lastId: null,      // la dernière carte posée (mise en valeur sur la frise)
};

/* ---------- Petits utilitaires ---------- */
function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* stockage indisponible */ }
  return null;
}

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const fmtNumber = (n) => n.toLocaleString('fr-FR');

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

/** « il y a environ 2 800 ans » — sauf si la date le dit déjà. */
function agoText(ev) {
  if (/^il y a/i.test(ev.date)) return '';
  // Il n'y a pas d'année 0 : de 1 av. J.-C. à 1 apr. J.-C., il s'écoule 1 an.
  const years = ev.year < 0 ? THIS_YEAR - ev.year - 1 : THIS_YEAR - ev.year;
  if (years < 100) return `il y a ${years} ans`;
  const step = years < 1000 ? 10 : 100;
  return `il y a environ ${fmtNumber(Math.round(years / step) * step)} ans`;
}

/** La date courte écrite sur les petites cartes de la frise. */
function shortDate(ev) {
  if (/^il y a/i.test(ev.date)) return ev.date.replace('environ ', '');
  if (ev.year < 0) return `${fmtNumber(-ev.year)} av. J.-C.`;
  return String(ev.year);
}

/* ---------- Score encodé pour le classement (plus petit = meilleur) ---------- */
const encodeScore = (points, secs) => (ROUNDS - points) * 10000 + Math.min(secs, 9998) + 1;
const decodeScore = (v) => ({ points: ROUNDS - Math.floor((v - 1) / 10000), secs: (v - 1) % 10000 });

/* ================================================================== tirage des cartes */

function pickEvents() {
  const recent = new Set(store('frise-recent') || []);
  // Les cartes de la partie précédente passent en dernier.
  const order = (list) => [...shuffle(list.filter((e) => !recent.has(e.id))), ...shuffle(list.filter((e) => recent.has(e.id)))];

  const chosen = [];
  // Au moins un événement de chaque grande période…
  for (const era of ERAS) chosen.push(order(EVENTS.filter((e) => e.era === era.id))[0]);
  // …puis on complète au hasard.
  for (const ev of order(EVENTS.filter((e) => !chosen.includes(e)))) {
    if (chosen.length >= ROUNDS + 1) break;
    chosen.push(ev);
  }
  store('frise-recent', chosen.map((e) => e.id));

  // La carte de départ est prise vers le milieu de l'histoire :
  // on peut ainsi placer les suivantes avant ou après elle.
  const byYear = chosen.slice().sort((a, b) => a.year - b.year);
  const mid = Math.floor(byYear.length / 2);
  const starter = byYear[mid - 1 + Math.floor(Math.random() * 3)];
  return { starter, deck: shuffle(chosen.filter((e) => e !== starter)) };
}

/* ================================================================== la frise */

/** L'emplacement correct d'un événement dans la frise actuelle. */
function correctIndex(ev, placed = state.placed) {
  let i = 0;
  while (i < placed.length && placed[i].ev.year < ev.year) i++;
  return i;
}

function cardHtml(ev, { status = null, ghost = false } = {}) {
  const era = ERA_BY_ID[ev.era];
  const showDate = !ghost || MODES[state.mode].showDate;
  const badge = { start: '📍', good: '✓', bad: '✗' }[status];
  const style = ghost ? '' : ` style="--c:${era.color}"`;
  return `
    <div class="fitem${ghost ? ' is-ghost' : ''}${ev.id === state.lastId && !ghost ? ' is-new' : ''}" data-key="${ev.id}"${style}>
      <div class="fcard">
        ${renderArt(ev.id, ev.title)}
        ${badge ? `<span class="f-badge ${status}" title="${status === 'start' ? 'Carte de départ' : status === 'good' ? 'Bien placée' : 'Mal placée au départ'}">${badge}</span>` : ''}
        <p class="f-title">${escapeHtml(ev.short)}</p>
        <span class="f-date">${showDate ? escapeHtml(shortDate(ev)) : '❓ ???'}</span>
      </div>
      <span class="stem"></span>
    </div>`;
}

const slotHtml = (i) => `<button class="slot" data-slot="${i}" aria-label="Placer la carte ici (emplacement ${i + 1})"><i>+</i></button>`;

function renderFrieze() {
  const current = state.phase === 'place' || state.phase === 'busy' ? state.deck[state.round] : null;
  let html = '<div class="cap" data-key="cap-start"><span>🌋</span>Il y a très, très longtemps</div>';
  const n = state.placed.length;
  for (let i = 0; i <= n; i++) {
    if (current && state.pending === i) html += cardHtml(current, { ghost: true });
    else html += slotHtml(i);
    if (i < n) html += cardHtml(state.placed[i].ev, { status: state.placed[i].status });
  }
  html += `<div class="cap" data-key="cap-end"><span>🧒</span>Aujourd'hui<br>(${THIS_YEAR})</div>`;
  els.items.innerHTML = html;
}

/** Re-dessine la frise en faisant glisser les cartes de leur ancienne place à la nouvelle. */
function flipRender(duration = 480) {
  const before = new Map();
  els.items.querySelectorAll('[data-key]').forEach((el) => before.set(el.dataset.key, el.getBoundingClientRect()));
  renderFrieze();
  els.items.querySelectorAll('[data-key]').forEach((el) => {
    const b = before.get(el.dataset.key);
    if (!b) return;
    const a = el.getBoundingClientRect();
    const dx = b.left - a.left;
    if (Math.abs(dx) > 1) {
      el.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration, easing: 'cubic-bezier(.3,.8,.3,1)' });
    }
  });
  updateBands();
}

/** Les bandes de couleur des grandes périodes, sous les cartes. */
function updateBands() {
  if (!els.bands.children.length) {
    els.bands.innerHTML = ERAS.map((e) => `<div class="band off" data-era="${e.id}" style="--c:${e.color}" title="${e.name}">${e.icon} ${e.short}</div>`).join('');
  }
  const offset = els.items.offsetLeft;
  const spans = {};
  els.items.querySelectorAll('.fitem:not(.is-ghost)').forEach((el) => {
    const entry = state.placed.find((p) => p.ev.id === el.dataset.key);
    if (!entry || entry.moving) return;
    const left = offset + el.offsetLeft;
    const right = left + el.offsetWidth;
    const s = spans[entry.ev.era] || (spans[entry.ev.era] = { left, right });
    s.left = Math.min(s.left, left);
    s.right = Math.max(s.right, right);
  });
  for (const band of els.bands.children) {
    const s = spans[band.dataset.era];
    band.classList.toggle('off', !s);
    if (s) {
      band.style.left = `${s.left}px`;
      band.style.width = `${s.right - s.left}px`;
    }
  }
}

function scrollToKey(key, behavior = 'smooth') {
  const el = els.items.querySelector(`[data-key="${key}"]`);
  if (!el) return;
  const left = els.items.offsetLeft + el.offsetLeft + el.offsetWidth / 2 - els.frieze.clientWidth / 2;
  els.frieze.scrollTo({ left: Math.max(0, left), behavior });
}

/* ================================================================== déroulement */

function startGame(mode) {
  state.mode = mode;
  store('frise-mode', mode);
  const { starter, deck } = pickEvents();
  state.deck = deck;
  state.placed = [{ ev: starter, status: 'start' }];
  state.round = 0;
  state.score = 0;
  state.results = [];
  state.pending = null;
  state.lastId = starter.id;
  state.t0 = performance.now();

  document.body.classList.remove('is-intro', 'is-revealed');
  els.intro.hidden = true;
  els.endModal.hidden = true;
  els.hud.hidden = false;
  els.score.textContent = '0';
  els.dots.innerHTML = Array.from({ length: ROUNDS }, () => '<li></li>').join('');

  showRound();
  requestAnimationFrame(() => scrollToKey(starter.id, 'auto'));
}

function showRound() {
  const ev = state.deck[state.round];
  state.phase = 'place';
  state.pending = null;
  document.body.classList.add('is-placing');
  document.body.classList.remove('is-revealed');

  els.roundNum.textContent = state.round + 1;
  [...els.dots.children].forEach((li, i) => {
    li.className = i < state.round ? (state.results[i] ? 'good' : 'bad') : i === state.round ? 'current' : '';
  });

  els.evArtPic.innerHTML = renderArt(ev.id, ev.title);
  els.evKicker.textContent = state.round === 0 ? 'Première carte' : state.round === ROUNDS - 1 ? 'Dernière carte !' : `Carte ${state.round + 1}`;
  els.evTitle.textContent = ev.title;
  els.evText.textContent = ev.text;
  els.evDate.hidden = !MODES[state.mode].showDate;
  els.evDate.textContent = `📅 ${ev.date}`;
  els.verdict.hidden = true;
  els.eventZone.scrollTop = 0;

  els.eventCard.classList.remove('deal');
  void els.eventCard.offsetWidth;
  els.eventCard.classList.add('deal');

  setAction('validate');
  flipRender();
  updateHelp();
}

function updateHelp() {
  const touch = matchMedia('(hover: none)').matches;
  if (state.phase === 'place') {
    els.help.innerHTML = state.pending === null
      ? `👉 Où va cette carte ? ${touch ? 'Touche' : 'Clique sur'} un <b>＋</b> de la frise, ou glisse l'image.`
      : 'Tu peux encore changer de place… ou <b>valider</b> ✅';
  }
}

function setAction(kind) {
  const btn = els.actionBtn;
  btn.dataset.kind = kind;
  btn.classList.remove('ready');
  if (kind === 'validate') {
    btn.textContent = '✅ Valider';
    btn.disabled = state.pending === null;
    btn.classList.toggle('ready', state.pending !== null);
  } else if (kind === 'next') {
    btn.disabled = false;
    btn.textContent = state.round === ROUNDS - 1 ? '🏆 Voir mon score' : 'Carte suivante ➜';
    btn.classList.add('ready');
  } else {
    btn.disabled = true;
  }
}

/** Le joueur choisit un emplacement (pas encore validé). */
function choose(slot, fromRect = null) {
  if (state.phase !== 'place') return;
  const first = state.pending === null;
  state.pending = slot;
  sfx.place();
  flipRender();
  const ev = state.deck[state.round];
  const ghost = els.items.querySelector('.is-ghost');
  if (ghost && (first || fromRect)) flyTo(fromRect || els.evArt.getBoundingClientRect(), ghost);
  scrollToKey(ev.id);
  setAction('validate');
  updateHelp();
}

/** Une copie de la carte vole jusqu'à sa place sur la frise. */
function flyTo(fromRect, target) {
  const card = target.querySelector('.fcard');
  const to = card.getBoundingClientRect();
  const clone = card.cloneNode(true);
  clone.classList.add('fly-card');
  clone.style.width = `${to.width}px`;
  clone.style.height = `${to.height}px`;
  clone.style.left = `${to.left}px`;
  clone.style.top = `${to.top}px`;
  document.body.appendChild(clone);
  card.style.visibility = 'hidden';
  const sx = fromRect.width / to.width;
  const dx = fromRect.left - to.left;
  const dy = fromRect.top - to.top;
  const anim = clone.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(${sx})`, transformOrigin: 'top left', opacity: 0.6 },
    { transform: 'translate(0, 0) scale(1)', transformOrigin: 'top left', opacity: 1 },
  ], { duration: 420, easing: 'cubic-bezier(.25,.8,.35,1.05)' });
  const done = () => { clone.remove(); card.style.visibility = ''; };
  anim.onfinish = done;
  anim.oncancel = done;
}

/** Le joueur valide : la carte se retourne et on découvre si elle est bien placée. */
function validate() {
  if (state.phase !== 'place' || state.pending === null) return;
  state.phase = 'busy';
  setAction('busy');
  document.body.classList.remove('is-placing');

  const ev = state.deck[state.round];
  const good = correctIndex(ev) === state.pending;
  const entry = { ev, status: good ? 'good' : 'bad', moving: !good };
  state.placed.splice(state.pending, 0, entry);
  state.pending = null;
  state.lastId = ev.id;
  state.results.push(good);
  sfx.flip();
  flipRender();

  const card = () => els.items.querySelector(`[data-key="${ev.id}"] .fcard`);
  card().classList.add(good ? 'win' : 'reveal');

  if (good) {
    state.score++;
    setTimeout(() => {
      sfx.good();
      els.score.textContent = state.score;
      els.hudScore.classList.remove('bump');
      void els.hudScore.offsetWidth;
      els.hudScore.classList.add('bump');
      const r = card().getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 3, 28);
      showVerdict(ev, true);
    }, 300);
  } else {
    setTimeout(() => {
      sfx.bad();
      card().classList.add('shake');
    }, 350);
    // …puis la carte glisse jusqu'à sa vraie place.
    setTimeout(() => {
      state.placed.splice(state.placed.indexOf(entry), 1);
      state.placed.splice(correctIndex(ev), 0, entry);
      entry.moving = false;
      sfx.slide();
      flipRender(700);
      scrollToKey(ev.id);
      showVerdict(ev, false);
    }, 1150);
  }
}

function showVerdict(ev, good) {
  state.phase = 'reveal';
  document.body.classList.add('is-revealed');
  const era = ERA_BY_ID[ev.era];
  els.verdict.className = `verdict ${good ? 'good' : 'bad'}`;
  els.verdictHead.innerHTML = good
    ? `🎉 Bravo, c'est la bonne place ! <small>+1 ⭐ — tu as ${state.score} point${state.score > 1 ? 's' : ''}.</small>`
    : '😮 Oups, pas tout à fait ! <small>Regarde la frise : la carte a glissé à sa vraie place.</small>';
  els.verdictDate.textContent = ev.date;
  els.verdictAgo.textContent = agoText(ev) ? `(${agoText(ev)})` : '';
  els.verdictEra.textContent = `${era.icon} ${era.name}`;
  els.verdictEra.style.background = era.color;
  els.verdictFact.textContent = ev.fact;
  els.evDate.hidden = true;
  els.verdict.hidden = false;
  els.help.innerHTML = good ? 'Super ! Lis le <b>Le savais-tu ?</b> puis continue.' : 'Pas grave, on apprend en se trompant ! 💪';
  setAction('next');
  // Sur petit écran, on fait défiler jusqu'au verdict.
  requestAnimationFrame(() => {
    if (els.eventZone.scrollHeight > els.eventZone.clientHeight) els.verdict.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function next() {
  if (state.phase !== 'reveal') return;
  state.round++;
  [...els.dots.children].forEach((li, i) => {
    if (i < state.round) li.className = state.results[i] ? 'good' : 'bad';
  });
  if (state.round >= ROUNDS) endGame();
  else showRound();
}

/* ================================================================== fin de partie */

const RANKS = [
  { min: 10, title: 'Maître du temps ! 👑', msg: 'Un sans-faute ! Tu connais l\'histoire sur le bout des doigts. Le Professeur Hibou est épaté !' },
  { min: 8, title: 'Grand historien ! 🏛️', msg: 'Presque parfait ! Encore une partie et tu deviens Maître du temps.' },
  { min: 5, title: 'Voyageur du temps ! ⏳', msg: 'Bien joué ! Tu sais déjà ranger beaucoup d\'événements. Rejoue pour découvrir d\'autres cartes.' },
  { min: 0, title: 'Apprenti explorateur ! 🧭', msg: 'L\'histoire, c\'est long ! Regarde bien ta frise : à la prochaine partie, tu feras encore mieux.' },
];

function endGame() {
  state.phase = 'end';
  state.seconds = Math.round((performance.now() - state.t0) / 1000);
  document.body.classList.remove('is-placing');
  els.hud.hidden = false;
  [...els.dots.children].forEach((li, i) => { li.className = state.results[i] ? 'good' : 'bad'; });
  els.help.textContent = '🎉 Ta frise est complète ! Fais-la défiler pour revoir toute l\'histoire.';
  setAction('busy');
  els.actionBtn.textContent = '🏆 Résultats';
  els.actionBtn.disabled = false;
  els.actionBtn.dataset.kind = 'results';
  state.lastId = null;
  flipRender();

  const rank = RANKS.find((r) => state.score >= r.min);
  els.endOwl.innerHTML = OWL;
  els.endTitle.textContent = rank.title;
  els.endMsg.textContent = rank.msg;
  els.endScore.textContent = state.score;
  els.endTime.textContent = fmtDuration(state.seconds);
  els.endStars.innerHTML = state.results.map((ok, i) => `<span class="${ok ? '' : 'off'}" style="animation-delay:${0.25 + i * 0.08}s">⭐</span>`).join('');

  // Record personnel
  const value = encodeScore(state.score, state.seconds);
  const bestKey = `frise-best-${state.mode}`;
  const best = store(bestKey);
  if (!best || value < best) {
    store(bestKey, value);
    els.endBest.textContent = best ? '🏅 Nouveau record personnel !' : '';
  } else {
    const b = decodeScore(best);
    els.endBest.textContent = `Ton record : ${b.points}/10 en ${fmtDuration(b.secs)}`;
  }

  els.scoreSaved.hidden = true;
  els.scoreForm.hidden = true;
  els.saveBtn.disabled = false;
  els.pseudo.value = store('frise-pseudo') || '';
  leaderboard.then((lb) => {
    if (lb && lb.isLeaderboardConfigured() && state.score > 0) els.scoreForm.hidden = false;
  });
  renderBoard(els.endBoard, state.mode);

  openResults();
  sfx.win();
  burst(window.innerWidth / 2, window.innerHeight / 3, 90);
}

function openResults() {
  els.endModal.hidden = false;
  els.endModal.scrollTop = 0;
}

async function saveScore(e) {
  e.preventDefault();
  const name = els.pseudo.value.trim();
  if (!name) { els.pseudo.focus(); return; }
  els.saveBtn.disabled = true;
  store('frise-pseudo', name);
  const lb = await leaderboard;
  const ok = lb ? await lb.submitScore(MODES[state.mode].gameId, name, encodeScore(state.score, state.seconds)) : false;
  els.scoreForm.hidden = ok;
  els.saveBtn.disabled = ok;
  els.scoreSaved.hidden = false;
  els.scoreSaved.textContent = ok ? 'Score enregistré ! 🎉' : 'Oups, le score n\'a pas pu être envoyé. Réessaie plus tard.';
  if (ok) renderBoard(els.endBoard, state.mode, name);
}

/* ================================================================== classement */

async function renderBoard(container, mode, me = null) {
  const lb = await leaderboard;
  if (!lb || !lb.isLeaderboardConfigured()) { container.hidden = true; return; }
  container.hidden = false;
  const tabs = Object.entries(MODES)
    .map(([key, m]) => `<button type="button" data-board="${key}" class="${key === mode ? 'on' : ''}">${m.icon} ${m.short}</button>`).join('');
  container.innerHTML = `<div class="board-head"><h3>🏆 Classement mondial</h3><div class="board-tabs">${tabs}</div></div><p class="board-empty">Chargement…</p>`;
  container.querySelectorAll('[data-board]').forEach((b) => b.addEventListener('click', () => renderBoard(container, b.dataset.board, me)));
  const list = await lb.fetchTopScores(MODES[mode].gameId, 10);
  const body = list.length
    ? `<ol>${list.map((e, i) => {
      const { points, secs } = decodeScore(e.value);
      return `<li class="${me && e.name === me ? 'me' : ''}"><span class="board-rank">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="board-name">${escapeHtml(e.name)}</span><span class="board-val">${points}/10 · ${fmtDuration(secs)}</span></li>`;
    }).join('')}</ol>`
    : '<p class="board-empty">Personne encore… sois le premier du classement !</p>';
  container.querySelector('.board-empty').outerHTML = body;
}

/* ================================================================== confettis */

const CONFETTI_COLORS = ['#FFC93C', '#EC4F78', '#3F7FE0', '#2FB36B', '#9256DB', '#D9773F'];

function burst(x, y, count) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 180;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--y', `${Math.sin(angle) * dist + 160}px`);
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--d', `${0.9 + Math.random() * 0.8}s`);
    els.confetti.appendChild(p);
    setTimeout(() => p.remove(), 1900);
  }
}

/* ================================================================== glisser-déposer */

let drag = null;

function nearestSlot(x, y) {
  const fr = els.frieze.getBoundingClientRect();
  if (y < fr.top - 80 || y > fr.bottom + 20 || x < fr.left || x > fr.right) return null;
  let best = null;
  let bestD = Infinity;
  // L'emplacement de la carte fantôme compte aussi.
  els.items.querySelectorAll('.slot, .is-ghost').forEach((el) => {
    const r = el.getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - x);
    if (d < bestD) { bestD = d; best = el; }
  });
  if (!best) return null;
  return best.classList.contains('is-ghost') ? { el: best, slot: state.pending } : { el: best, slot: Number(best.dataset.slot) };
}

function startDrag(e) {
  const ev = state.deck[state.round];
  const card = document.createElement('div');
  card.className = 'drag-card';
  card.innerHTML = `${renderArt(ev.id, ev.title)}<p>${escapeHtml(ev.short)}</p>`;
  document.body.appendChild(card);
  drag.card = card;
  drag.started = true;
  document.body.classList.add('is-dragging');
  sfx.pick();
  autoScroll();
}

function moveDrag(e) {
  drag.x = e.clientX;
  drag.y = e.clientY;
  const w = drag.card.offsetWidth;
  drag.card.style.transform = `translate(${e.clientX - w / 2}px, ${e.clientY - 30}px) rotate(-4deg)`;
  const target = nearestSlot(e.clientX, e.clientY);
  if (drag.target?.el !== target?.el) {
    drag.target?.el.classList.remove('is-hover');
    target?.el.classList.add('is-hover');
    drag.target = target;
  }
}

function endDrag(drop) {
  const d = drag;
  drag = null;
  document.body.classList.remove('is-dragging');
  if (!d || !d.started) return;
  d.target?.el.classList.remove('is-hover');
  const rect = d.card.getBoundingClientRect();
  if (drop && d.target) {
    d.card.remove();
    choose(d.target.slot, rect);
  } else {
    // Retour à la maison
    const home = els.evArt.getBoundingClientRect();
    const anim = d.card.animate([
      { opacity: 1 },
      { transform: `translate(${home.left + home.width / 2 - rect.width / 2}px, ${home.top + home.height / 2 - rect.height / 2}px) scale(0.6)`, opacity: 0 },
    ], { duration: 280, easing: 'ease-in' });
    anim.onfinish = () => d.card.remove();
  }
}

/* Faire défiler la frise quand on approche la carte de ses bords. */
function autoScroll() {
  if (!drag || !drag.started) return;
  const fr = els.frieze.getBoundingClientRect();
  if (drag.y > fr.top - 80 && drag.x != null) {
    const edge = 70;
    if (drag.x < fr.left + edge) els.frieze.scrollLeft -= Math.ceil((fr.left + edge - drag.x) / 5);
    else if (drag.x > fr.right - edge) els.frieze.scrollLeft += Math.ceil((drag.x - (fr.right - edge)) / 5);
  }
  requestAnimationFrame(autoScroll);
}

els.evArt.addEventListener('pointerdown', (e) => {
  if (state.phase !== 'place' || drag) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, started: false };
  els.evArt.setPointerCapture(e.pointerId);
});
els.evArt.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.started) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    startDrag(e);
  }
  moveDrag(e);
});
els.evArt.addEventListener('pointerup', (e) => { if (drag && e.pointerId === drag.id) endDrag(true); });
els.evArt.addEventListener('pointercancel', () => endDrag(false));

/* ================================================================== événements */

els.items.addEventListener('click', (e) => {
  const slot = e.target.closest('.slot');
  if (slot) choose(Number(slot.dataset.slot));
});

els.actionBtn.addEventListener('click', () => {
  const kind = els.actionBtn.dataset.kind;
  if (kind === 'validate') validate();
  else if (kind === 'next') next();
  else if (kind === 'results') openResults();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target.closest('input, button, a')) return;
  if (state.phase === 'place' && state.pending !== null) validate();
  else if (state.phase === 'reveal') next();
});

document.querySelectorAll('.mode').forEach((b) => b.addEventListener('click', () => startGame(b.dataset.mode)));

els.againBtn.addEventListener('click', () => startGame(state.mode));
els.menuBtn.addEventListener('click', showIntro);
els.viewBtn.addEventListener('click', () => {
  els.endModal.hidden = true;
  els.frieze.scrollTo({ left: 0, behavior: 'smooth' });
});
els.scoreForm.addEventListener('submit', saveScore);

els.soundBtn.addEventListener('click', () => {
  const on = toggleSound();
  els.soundBtn.textContent = on ? '🔊' : '🔇';
  els.soundBtn.setAttribute('aria-label', on ? 'Couper le son' : 'Remettre le son');
});

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updateBands, 120);
});

/* ================================================================== accueil */

function showIntro() {
  state.phase = 'intro';
  document.body.classList.add('is-intro');
  document.body.classList.remove('is-placing', 'is-revealed');
  els.endModal.hidden = true;
  els.intro.hidden = false;
  els.intro.scrollTop = 0;

  document.querySelectorAll('[data-best]').forEach((el) => {
    const best = store(`frise-best-${el.dataset.best}`);
    if (!best) { el.textContent = ''; return; }
    const { points } = decodeScore(best);
    el.textContent = `🏅 Record : ${points}/10`;
  });
  renderBoard(els.introBoard, store('frise-mode') || 'apprenti');
}

function initDemo() {
  // Derrière l'accueil : une jolie frise d'exemple, une carte par période.
  state.placed = ERAS.map((era) => ({ ev: EVENTS.find((e) => e.era === era.id && ['dinosaures', 'lascaux', 'pyramides', 'charlemagne', 'amerique', 'lune'].includes(e.id)), status: null }));
  const demo = EVENTS.find((e) => e.id === 'jeux-olympiques');
  state.deck = [demo];
  els.evArtPic.innerHTML = renderArt(demo.id, demo.title);
  els.evTitle.textContent = demo.title;
  els.evText.textContent = demo.text;
  renderFrieze();
  updateBands();
}

els.soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
$('introOwl').innerHTML = OWL;
els.erasLegend.innerHTML = ERAS.map((e) => `<li style="--c:${e.color}"><span>${e.icon}</span>${e.name}<small>${e.range}</small></li>`).join('');
initDemo();
showIntro();
