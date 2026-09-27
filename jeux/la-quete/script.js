// ============================================================================
// LA QUÊTE — le déroulement du jeu : titre, histoire, choix du héros, carte,
// combats contre les six robots, combat final contre OMÉGA, classement.
//
// Le chronomètre ne tourne que pendant qu'une énigme attend une réponse :
// le temps de lecture des dialogues n'est pas compté.
// ============================================================================

import { HEROES, STORY, BIP_INTRO, ZONES, BOSS } from './story.js';
import { heroSVG, bipSVG, robotSVG, omegaSVG, background, mapSVG, mapPoints, mapSegments, SHIELD_COLORS } from './art.js';
import { makePuzzle } from './puzzles.js';
import { sfx, playMusic, stopMusic, unlockAudio, cycleSound, soundMode } from './audio.js';
import { FX } from './fx.js';

const GAME_ID = 'la-quete';
const SAVE_KEY = 'la-quete-save-v1';
const POWER_IC = { shield: '🛡️', scan: '📡', heal: '💚' };
const GOOD = ['Bien joué !', 'Excellent !', 'Parfait !', 'Logique imparable !', 'Cerveau en feu !', 'Impressionnant !'];
const BAD = ['Raté…', 'Aïe, pas tout à fait !', 'Oups !', 'Presque !'];
const FOE_WIN = ['HA HA HA ! ÉNERGIE ÉPUISÉE !', 'TROP FACILE ! RETOURNE D\'OÙ TU VIENS !', 'OMÉGA SERA FIÈRE DE MOI !'];

const $ = (id) => document.getElementById(id);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   Interruption des séquences (retour à la carte / au titre depuis le menu)
   ========================================================================== */

const ABORT = Symbol('abort');
let flowId = 0;
const pending = new Set();

/** Enveloppe une promesse : si la séquence est interrompue, elle échoue avec ABORT. */
function guard(promise) {
  const f = flowId;
  return new Promise((resolve, reject) => {
    const entry = { reject };
    pending.add(entry);
    promise.then(
      (v) => { pending.delete(entry); if (f === flowId) resolve(v); else reject(ABORT); },
      (e) => { pending.delete(entry); reject(e); },
    );
  });
}

function abortFlow() {
  flowId++;
  pending.forEach((e) => e.reject(ABORT));
  pending.clear();
  clock.stop();
  active = null;
  nextResolve = null;
  dialogAdvance = null;
  storyAdvance = null;
  clearInterval(typingTimer);
  $('dialog').classList.remove('show');
}

const wait = (ms) => guard(new Promise((r) => setTimeout(r, reduceMotion ? Math.min(ms, 250) : ms)));

function run(fn) {
  fn().catch((e) => { if (e !== ABORT) console.error(e); });
}

/* ==========================================================================
   Sauvegarde et chronomètre
   ========================================================================== */

let state = freshState(null);

function freshState(hero) {
  return { hero, freed: 0, ms: 0, bipMet: false, solved: 0, errors: 0, retries: 0 };
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* stockage indisponible */ }
}
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && HEROES[s.hero] && Number.isInteger(s.freed) && s.freed <= 6) return { ...freshState(s.hero), ...s };
  } catch { /* ignore */ }
  return null;
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

const clock = {
  t0: 0, running: false, iv: null,
  start() {
    if (this.running) return;
    this.running = true;
    this.t0 = performance.now();
    this.iv = setInterval(renderTime, 250);
    document.body.classList.add('ticking');
  },
  stop() {
    if (!this.running) return;
    state.ms += performance.now() - this.t0;
    this.running = false;
    clearInterval(this.iv);
    document.body.classList.remove('ticking');
    renderTime();
  },
  total() { return state.ms + (this.running ? performance.now() - this.t0 : 0); },
};

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function renderTime() { $('hudTime').textContent = fmt(clock.total() / 1000); }

const heroName = () => (state.hero ? HEROES[state.hero].name : '');
const fillText = (t) => t.replaceAll('{name}', heroName()).replaceAll('{NAME}', heroName().toUpperCase());

/* ==========================================================================
   Écrans, transitions, particules
   ========================================================================== */

const fxs = { title: new FX($('titleFx')), select: new FX($('selectFx')), stage: new FX($('stageFx')), end: new FX($('endFx')) };
const SCREEN_FX = { scrTitle: 'title', scrSelect: 'select', scrBattle: 'stage', scrEnd: 'end' };

/** Change d'écran derrière un volet ; `setup` prépare le nouvel écran pendant qu'il est caché. */
async function go(id, setup) {
  const wipe = $('wipe');
  wipe.className = 'wipe in';
  sfx.whoosh();
  await wait(430);
  setup?.();
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  Object.entries(SCREEN_FX).forEach(([sid, k]) => (sid === id ? fxs[k].start() : fxs[k].stop()));
  document.body.dataset.screen = id;
  $('hud').classList.toggle('show', id === 'scrMap' || id === 'scrBattle');
  await wait(80);
  wipe.className = 'wipe out';
  await wait(430);
  wipe.className = 'wipe';
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
}

/* ==========================================================================
   Dialogues
   ========================================================================== */

let dialogAdvance = null, typingTimer = null, currentFoe = null;

const SPEAKERS = {
  bip: () => ({ name: 'BIP', art: bipSVG(), cls: 'sp-bip' }),
  hero: () => ({ name: heroName().toUpperCase(), art: heroSVG(state.hero, true), cls: `sp-hero sp-${state.hero}` }),
  omega: () => {
    const freed = currentFoe?.name === 'OMÉGA' && currentFoe.freed;
    return { name: 'OMÉGA', art: `<div class="robot omega ${freed ? 'freed' : ''}">${omegaSVG({ shields: false })}</div>`, cls: `sp-omega ${freed ? 'freed' : ''}` };
  },
  foe: () => ({
    name: currentFoe.name,
    art: `<div class="robot ${currentFoe.freed ? 'freed' : ''}">${robotSVG(currentFoe.key)}</div>`,
    cls: `sp-foe ${currentFoe.freed ? 'freed' : ''}`,
  }),
};

function say(who, text) {
  const sp = SPEAKERS[who]();
  const d = $('dialog');
  d.className = `dialog show ${sp.cls}`;
  $('dPortrait').innerHTML = sp.art;
  $('dName').textContent = sp.name;
  const full = fillText(text);
  const el = $('dText');
  el.textContent = '';
  let i = 0;
  const finish = () => {
    clearInterval(typingTimer);
    typingTimer = null;
    el.textContent = full;
    d.classList.add('done');
  };
  clearInterval(typingTimer);
  typingTimer = setInterval(() => {
    i += 1;
    el.textContent = full.slice(0, i);
    if (i % 3 === 0) sfx.type();
    if (i >= full.length) finish();
  }, who === 'omega' ? 32 : 20);
  return guard(new Promise((resolve) => {
    dialogAdvance = () => {
      if (typingTimer) { finish(); return; }
      dialogAdvance = null;
      sfx.click();
      resolve();
    };
  }));
}

async function talk(lines) {
  for (const [who, text] of lines) await say(who, text);
  $('dialog').classList.remove('show');
  await wait(120);
}

$('dialog').addEventListener('click', () => dialogAdvance?.());

/* ==========================================================================
   Écran titre
   ========================================================================== */

function buildTitle() {
  $('titleBg').innerHTML = background('title');
  $('titleOmega').innerHTML = `<div class="robot omega">${omegaSVG()}</div>`;
  fxs.title.setMode('stars');
}

function lookAt(root, clientX, clientY, amount = 16) {
  const pupil = root?.querySelector('.om-pupil');
  if (!pupil) return;
  const r = root.getBoundingClientRect();
  const dx = clientX - (r.left + r.width / 2), dy = clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / 300) * amount;
  pupil.setAttribute('transform', `translate(${((dx / d) * k).toFixed(1)} ${((dy / d) * k * 0.6).toFixed(1)})`);
}

window.addEventListener('pointermove', (e) => {
  if (document.body.dataset.screen === 'scrTitle') lookAt($('titleOmega'), e.clientX, e.clientY);
});

let titleBusy = false;

async function showTitle() {
  await go('scrTitle', () => {
    $('btnContinue').hidden = !loadSave();
    titleBusy = false;
  });
  playMusic('title');
}

/* ==========================================================================
   Histoire d'introduction
   ========================================================================== */

let storyAdvance = null;
const ROBOT_KEYS = ZONES.map((z) => z.robot);

function storyArt(key) {
  switch (key) {
    case 'city': return background('title') + `<div class="story-omega"><div class="robot omega">${omegaSVG({ shields: false })}</div></div>`;
    case 'sleepers': return background('city');
    case 'forest': return background('forest') + `<div class="story-robots">${ROBOT_KEYS.map((k, i) => `<div class="robot sil" style="--i:${i}">${robotSVG(k)}</div>`).join('')}</div>`;
    default: return background('hall') + `<div class="story-heroes">${Object.keys(HEROES).map((k, i) => `<div class="sil-hero" style="--i:${i}">${heroSVG(k)}</div>`).join('')}</div>`;
  }
}

async function playStory() {
  let skipped = false;
  await go('scrStory');
  playMusic('title');
  $('storySkip').onclick = () => { skipped = true; storyAdvance?.(true); };
  for (let i = 0; i < STORY.length && !skipped; i++) {
    const art = $('storyArt');
    art.innerHTML = `<div class="story-layer">${storyArt(STORY[i].art)}</div>`;
    $('storyDots').innerHTML = STORY.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    const el = $('storyText');
    const full = STORY[i].text;
    let n = 0;
    el.textContent = '';
    clearInterval(typingTimer);
    typingTimer = setInterval(() => {
      n += 1;
      el.textContent = full.slice(0, n);
      if (n % 3 === 0) sfx.type();
      if (n >= full.length) { clearInterval(typingTimer); typingTimer = null; }
    }, 26);
    await guard(new Promise((resolve) => {
      storyAdvance = (skip) => {
        if (typingTimer && !skip) { clearInterval(typingTimer); typingTimer = null; el.textContent = full; return; }
        storyAdvance = null;
        resolve();
      };
    }));
    sfx.click();
  }
  await goSelect();
}

$('storyNext').addEventListener('click', () => storyAdvance?.());

/* ==========================================================================
   Choix du héros
   ========================================================================== */

let chosenHero = null;

async function goSelect() {
  chosenHero = null;
  await go('scrSelect', () => {
    $('selectBg').innerHTML = background('hall');
    fxs.select.setMode('dust');
    $('heroCards').innerHTML = Object.entries(HEROES).map(([k, h], i) => `
      <button class="hero-card" data-hero="${k}" style="--c:${h.color};--i:${i}">
        <span class="pedestal"><span class="hero-sprite">${heroSVG(k)}</span></span>
        <span class="hc-name">${h.name}</span>
        <span class="hc-role">${h.role}</span>
        <span class="hc-desc">${h.desc}</span>
        <span class="hc-power"><span class="hc-power-ic">${POWER_IC[h.power]}</span><span><b>${h.powerName}</b> — ${h.powerDesc}</span></span>
      </button>`).join('');
    $('btnChoose').disabled = true;
  });
}

$('heroCards').addEventListener('click', (e) => {
  const card = e.target.closest('.hero-card');
  if (!card) return;
  chosenHero = card.dataset.hero;
  document.querySelectorAll('.hero-card').forEach((c) => c.classList.toggle('selected', c === card));
  $('btnChoose').disabled = false;
  $('btnChoose').textContent = `Partir avec ${HEROES[chosenHero].name} ▸`;
  sfx.select();
});

$('btnChoose').addEventListener('click', () => {
  if (!chosenHero) return;
  $('btnChoose').disabled = true;
  state = freshState(chosenHero);
  save();
  run(() => goMap(false));
});

/* ==========================================================================
   Barre du haut
   ========================================================================== */

function renderHud(count = state.freed) {
  $('hudHero').innerHTML = `<span class="hud-face">${heroSVG(state.hero, true)}</span><span class="hud-name">${heroName()}</span>`;
  $('hudFrags').innerHTML = ZONES.map((z, i) =>
    `<span class="frag ${i < count ? 'on' : ''}" style="--c:${z.color}">${i < count ? z.letter : ''}</span>`).join('');
  renderTime();
}

/* ==========================================================================
   Carte du monde
   ========================================================================== */

let mapPortrait = null;

function renderMap(tokenAt = state.freed) {
  const portrait = window.innerWidth < window.innerHeight * 0.95;
  mapPortrait = portrait;
  const frame = $('mapFrame');
  frame.classList.toggle('portrait', portrait);
  const pts = mapPoints(portrait);
  const W = portrait ? 900 : 1600, H = portrait ? 1600 : 900;
  const cur = state.freed;
  const segs = mapSegments(pts);
  let html = mapSVG(portrait);
  html += `<svg class="map-path" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${segs.map((d, i) => `<path class="seg-bg" d="${d}"/><path class="seg ${i < Math.min(cur, tokenAt) ? 'done' : ''}" d="${d}"/>`).join('')}</svg>`;
  html += pts.map(([x, y], i) => {
    const boss = i === 6;
    const zone = ZONES[i];
    const status = i < cur ? 'done' : i === cur ? 'current' : 'locked';
    const color = boss ? BOSS.color : zone.color;
    const thumb = boss ? `<span class="robot omega">${omegaSVG({ shields: false })}</span>` : `<span class="robot ${status === 'done' ? 'freed' : ''}">${robotSVG(zone.robot)}</span>`;
    return `<button class="node ${status}${boss ? ' boss' : ''}" data-i="${i}" style="left:${(x / W) * 100}%;top:${(y / H) * 100}%;--c:${color}" aria-label="${boss ? "La Tour d'OMÉGA" : zone.name}">
      <span class="node-disc">${thumb}</span>
      ${status === 'done' ? `<span class="node-letter">${zone.letter}</span>` : ''}
      ${status === 'locked' ? '<span class="node-lock">🔒</span>' : ''}
      <span class="node-label">${boss ? "Tour d'OMÉGA" : zone.name}</span>
    </button>`;
  }).join('');
  const [tx, ty] = pts[Math.min(tokenAt, 6)];
  html += `<div class="token" id="token" style="left:${(tx / W) * 100}%;top:${(ty / H) * 100}%"><span class="token-face">${heroSVG(state.hero, true)}</span></div>`;
  frame.innerHTML = html;
}

async function moveToken(from, to) {
  const seg = $('mapFrame').querySelectorAll('.map-path .seg')[from];
  const token = $('token');
  if (!seg || !token) return;
  const W = mapPortrait ? 900 : 1600, H = mapPortrait ? 1600 : 900;
  const L = seg.getTotalLength();
  const dur = reduceMotion ? 200 : 1700;
  token.classList.add('walking');
  sfx.whoosh();
  await guard(new Promise((resolve) => {
    const t0 = performance.now();
    let finished = false;
    const place = (t) => {
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const p = seg.getPointAtLength(e * L);
      token.style.left = `${(p.x / W) * 100}%`;
      token.style.top = `${(p.y / H) * 100}%`;
    };
    const end = () => { if (!finished) { finished = true; place(1); resolve(); } };
    const step = (now) => {
      if (finished) return;
      const t = Math.min(1, (now - t0) / dur);
      place(t);
      if (t < 1) requestAnimationFrame(step); else end();
    };
    requestAnimationFrame(step);
    setTimeout(end, dur + 300); // si l'onglet est en arrière-plan, requestAnimationFrame est suspendu
  }));
  token.classList.remove('walking');
  seg.classList.add('done');
  const node = $('mapFrame').querySelector(`.node[data-i="${to}"]`);
  node?.classList.add('arrive');
  sfx.select();
}

function showMapCard(i) {
  const card = $('mapCard');
  const cur = state.freed;
  let html;
  if (i === 6) {
    const open = cur >= 6;
    html = `<span class="mc-thumb robot omega">${omegaSVG({ shields: false })}</span>
      <div class="mc-body"><p class="mc-kicker">Étape finale</p><h3>La Tour d'OMÉGA</h3>
      <p>${open ? "Tu as les six fragments. OMÉGA t'attend au sommet…" : `Il faut les six fragments pour entrer (${cur} / 6).`}</p>
      ${open ? '<button class="neon-btn primary danger" id="mcGo">Affronter OMÉGA ▸</button>' : ''}</div>`;
    card.style.setProperty('--c', BOSS.color);
  } else {
    const z = ZONES[i];
    const done = i < cur, now = i === cur;
    html = `<span class="mc-thumb robot ${done ? 'freed' : ''}">${robotSVG(z.robot)}</span>
      <div class="mc-body"><p class="mc-kicker">Zone ${i + 1} · ${z.puzzleName}</p><h3>${z.name}</h3>
      <p>Gardien : <b>${z.robotName}</b>${done ? ' — libéré ✔' : ''}</p>
      ${now ? '<button class="neon-btn primary" id="mcGo">Entrer dans la zone ▸</button>' : ''}
      ${done ? `<p class="mc-done">Fragment « ${z.letter} » récupéré</p>` : ''}
      ${!done && !now ? '<p class="mc-locked">🔒 Libère d\'abord les robots précédents.</p>' : ''}</div>`;
    card.style.setProperty('--c', z.color);
  }
  card.innerHTML = html;
  card.classList.remove('show');
  void card.offsetWidth;
  card.classList.add('show');
  $('mcGo')?.addEventListener('click', (e) => {
    e.currentTarget.disabled = true;
    card.classList.remove('show');
    sfx.select();
    run(i === 6 ? playBoss : () => playZone(i));
  });
}

$('mapFrame').addEventListener('click', (e) => {
  const node = e.target.closest('.node');
  if (!node) return;
  const i = Number(node.dataset.i);
  if (i > state.freed) { sfx.wrong(); toast('Cette zone est encore verrouillée !'); return; }
  sfx.click();
  showMapCard(i);
});

async function goMap(arrived) {
  await go('scrMap', () => {
    renderHud();
    renderMap(arrived ? state.freed - 1 : state.freed);
    $('mapCard').classList.remove('show');
  });
  playMusic('map');
  if (arrived && state.freed > 0) await moveToken(state.freed - 1, state.freed);
  if (!state.bipMet) {
    await wait(300);
    await talk(BIP_INTRO);
    state.bipMet = true;
    save();
  }
  showMapCard(Math.min(state.freed, 6));
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (document.body.dataset.screen !== 'scrMap') return;
    const portrait = window.innerWidth < window.innerHeight * 0.95;
    if (portrait !== mapPortrait) renderMap();
  }, 200);
});

/* ==========================================================================
   Combat : scène, barres, pouvoirs
   ========================================================================== */

let battle = null;

function setupStage({ bg, fxMode, foeHTML, boss }) {
  $('stageBg').innerHTML = background(bg);
  fxs.stage.setMode(fxMode);
  $('heroSprite').innerHTML = heroSVG(state.hero);
  $('fBip').innerHTML = bipSVG();
  $('foeSprite').innerHTML = foeHTML;
  $('stage').className = boss ? 'stage boss' : 'stage';
  $('fHero').className = 'fighter hero-f away';
  $('fBip').className = 'bip-f away';
  $('fFoe').className = 'fighter foe-f away';
  $('shieldBubble').className = 'shield-bubble';
  $('heroName').textContent = heroName();
  $('fxLayer').innerHTML = '';
  renderHud();
  panelIdle();
}

function panelIdle() {
  const p = $('panel');
  p.classList.add('idle');
  $('pType').textContent = battle?.boss ? 'Combat final' : battle?.zone?.name || '';
  $('pStep').textContent = '';
  $('pQuestion').innerHTML = '';
  $('pVisual').innerHTML = `<div class="idle-art"><span class="idle-ring"></span><span class="idle-text">${battle?.boss ? 'OMÉGA' : battle?.foeName || ''}</span></div>`;
  $('pChoices').innerHTML = '';
  $('pFeedback').className = 'p-feedback';
}

const HEART = '<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21 C5 15 1 11.5 1 7 A5.5 5.5 0 0 1 12 4.5 A5.5 5.5 0 0 1 23 7 C23 11.5 19 15 12 21Z"/></svg>';

function renderBars(lostHeart = -1) {
  const b = battle;
  $('foeName').textContent = b.foeName;
  const broken = b.foeMax - b.foeHp;
  $('foeHp').innerHTML = Array.from({ length: b.foeMax }, (_, i) => {
    const gone = b.boss ? i < broken : i >= b.foeHp;
    return `<span class="seg ${gone ? 'gone' : ''}" style="--c:${b.boss ? SHIELD_COLORS[i] : b.color}"></span>`;
  }).join('');
  $('hearts').innerHTML = Array.from({ length: b.maxHearts }, (_, i) =>
    `<span class="heart ${i < b.hearts ? '' : 'empty'} ${i === lostHeart ? 'lost' : ''}">${HEART}</span>`).join('');
}

function updatePowerBtn() {
  const btn = $('btnPower');
  if (!state.hero || !battle) { btn.disabled = true; return; }
  const h = HEROES[state.hero];
  btn.innerHTML = `<span class="pw-ic">${POWER_IC[h.power]}</span><span class="pw-name">${h.powerName}</span><span class="pw-n">×${battle.power}</span>`;
  btn.title = h.powerDesc;
  let usable = !!active && !active.answered && battle.power > 0;
  if (usable && h.power === 'heal') usable = battle.hearts < battle.maxHearts;
  if (usable && h.power === 'shield') usable = !battle.shield;
  if (usable && h.power === 'scan') {
    usable = active.pz.choices.length >= 3 && !$('pChoices').querySelector('.scanned');
  }
  btn.disabled = !usable;
  btn.classList.toggle('ready', usable);
}

$('btnPower').addEventListener('click', () => {
  if (!active || active.answered || battle.power <= 0) return;
  const p = HEROES[state.hero].power;
  const stage = $('stage');
  const hero = rectIn($('heroSprite'), stage);
  if (p === 'shield') {
    if (battle.shield) return;
    battle.shield = true;
    $('shieldBubble').className = 'shield-bubble on';
    sfx.shield();
    toast('🛡️ Bouclier activé : ta prochaine erreur ne te coûtera rien !');
  } else if (p === 'scan') {
    const btns = [...$('pChoices').children];
    const wrong = btns.filter((b, k) => !active.pz.choices[k].correct);
    const n = wrong.length >= 3 ? 2 : 1;
    wrong.sort(() => Math.random() - 0.5).slice(0, n).forEach((b) => { b.disabled = true; b.classList.add('scanned'); });
    sfx.scan();
    toast(`📡 Scan terminé : ${n} mauvaise${n > 1 ? 's' : ''} réponse${n > 1 ? 's' : ''} éliminée${n > 1 ? 's' : ''} !`);
  } else if (p === 'heal') {
    if (battle.hearts >= battle.maxHearts) return;
    battle.hearts++;
    renderBars();
    sfx.heal();
    fxs.stage.burst(hero.x, hero.y, { color: '#3DFFB0', count: 30, speed: 180 });
    damageText(hero.x, hero.y - hero.h * 0.45, '+1 ❤', '#3DFFB0');
  }
  battle.power--;
  $('fHero').classList.remove('cast');
  void $('fHero').offsetWidth;
  $('fHero').classList.add('cast');
  updatePowerBtn();
});

/* ==========================================================================
   Combat : énigmes
   ========================================================================== */

let active = null, nextResolve = null;

function askPuzzle(pz, stepLabel) {
  $('panel').classList.remove('idle', 'good', 'bad');
  $('pType').textContent = pz.title;
  $('pStep').textContent = stepLabel;
  $('pQuestion').innerHTML = pz.question;
  $('pVisual').innerHTML = pz.visual;
  $('pVisual').onclick = null;
  const box = $('pChoices');
  box.className = `p-choices ${pz.layout || 'grid'}`;
  box.innerHTML = pz.choices.map((c, i) =>
    `<button class="choice" data-i="${i}" style="--i:${i}"><span class="choice-key">${i + 1}</span><span class="choice-body">${c.html}</span></button>`).join('');
  $('pFeedback').className = 'p-feedback';
  const inner = $('panel').querySelector('.panel-inner');
  inner.classList.remove('enter');
  void inner.offsetWidth;
  inner.classList.add('enter');
  $('panel').scrollTop = 0;
  return guard(new Promise((resolve) => {
    active = { pz, answered: false, resolve };
    updatePowerBtn();
    clock.start();
  }));
}

$('pChoices').addEventListener('click', (e) => {
  const b = e.target.closest('.choice');
  if (b && !b.disabled) run(() => answer(Number(b.dataset.i)));
});

async function answer(i) {
  if (!active || active.answered) return;
  const cur = active;
  const { pz } = cur;
  cur.answered = true;
  clock.stop();
  const ok = pz.choices[i].correct;
  const btns = [...$('pChoices').children];
  btns.forEach((b, k) => {
    b.disabled = true;
    if (pz.choices[k].correct) b.classList.add('right');
  });
  if (!ok) btns[i].classList.add('wrong');
  $('panel').classList.add(ok ? 'good' : 'bad');
  pz.reveal?.($('pVisual'));
  updatePowerBtn();
  if (ok) { state.solved++; sfx.correct(); } else { state.errors++; sfx.wrong(); }

  const anim = ok ? heroAttack() : foeAttack();
  await wait(450);
  $('fbTitle').textContent = ok ? pick(GOOD) : pick(BAD);
  $('fbText').innerHTML = pz.explain;
  $('pFeedback').className = `p-feedback show ${ok ? 'ok' : 'ko'}`;
  $('pFeedback').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  const clicked = guard(new Promise((r) => { nextResolve = r; }));
  await Promise.all([anim, clicked]);
  nextResolve = null;
  if (active === cur) active = null;
  cur.resolve(ok);
}

$('btnNext').addEventListener('click', () => { sfx.click(); nextResolve?.(); });

/* ==========================================================================
   Combat : animations
   ========================================================================== */

function rectIn(el, host) {
  const a = el.getBoundingClientRect(), b = host.getBoundingClientRect();
  return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2, w: a.width, h: a.height };
}

/** Fin d'une animation Web — avec un filet de sécurité si le navigateur la met en pause. */
function animDone(anim, dur) {
  return guard(Promise.race([anim.finished.catch(() => {}), new Promise((r) => setTimeout(r, dur + 250))]));
}

function restartClass(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function damageText(x, y, text, color) {
  const d = document.createElement('div');
  d.className = 'dmg';
  d.textContent = text;
  d.style.cssText = `left:${x}px;top:${y}px;--c:${color}`;
  $('fxLayer').appendChild(d);
  setTimeout(() => d.remove(), 1300);
}

function flash(color = '#fff', strong = false) {
  const f = $('flash');
  f.style.setProperty('--c', color);
  restartClass(f, strong ? 'on-strong' : 'on');
}

async function fireOrb(color, from, to, dur = 420) {
  const orb = document.createElement('div');
  orb.className = 'orb';
  orb.style.setProperty('--c', color);
  $('fxLayer').appendChild(orb);
  const a = orb.animate([
    { transform: `translate(${from.x}px, ${from.y}px) scale(.3)`, opacity: 0.6 },
    { transform: `translate(${(from.x + to.x) / 2}px, ${Math.min(from.y, to.y) - 40}px) scale(1)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${to.x}px, ${to.y}px) scale(1.3)`, opacity: 1 },
  ], { duration: reduceMotion ? 120 : dur, easing: 'ease-in' });
  await animDone(a, dur);
  orb.remove();
}

async function heroAttack() {
  const stage = $('stage');
  restartClass($('fHero'), 'cast');
  sfx.zap();
  const from = rectIn($('heroSprite'), stage), to = rectIn($('foeSprite'), stage);
  from.x += from.w * 0.3;
  from.y -= from.h * 0.1;
  if (battle.boss) to.y -= to.h * 0.02;
  const k = battle.foeMax - battle.foeHp;
  const color = battle.boss ? SHIELD_COLORS[k] : HEROES[state.hero].color;
  await fireOrb(color, from, to);
  sfx.hit();
  fxs.stage.burst(to.x, to.y, { color, count: 46, speed: 340, colors: [color, '#FFFFFF'] });
  restartClass($('fFoe'), 'hit');
  restartClass(stage, 'shake-s');
  flash(color);
  if (battle.boss) {
    breakShield(k);
    damageText(to.x, to.y - to.h * 0.35, 'BOUCLIER BRISÉ !', color);
  } else {
    damageText(to.x, to.y - to.h * 0.3, pick(['-1', 'CRITIQUE !', 'BZZT !', 'CLONK !']), color);
  }
  battle.foeHp--;
  renderBars();
  await wait(550);
}

async function foeAttack() {
  const stage = $('stage');
  restartClass($('fFoe'), 'lunge');
  await wait(200);
  sfx.laser();
  const from = rectIn($('foeSprite'), stage), to = rectIn($('heroSprite'), stage);
  from.y -= from.h * (battle.boss ? 0 : 0.2);
  const dx = to.x - from.x, dy = to.y - from.y;
  const beam = document.createElement('div');
  beam.className = 'laser';
  beam.style.cssText = `left:${from.x}px;top:${from.y}px;width:${Math.hypot(dx, dy)}px;transform:rotate(${Math.atan2(dy, dx)}rad)`;
  $('fxLayer').appendChild(beam);
  await wait(240);
  if (battle.shield) {
    battle.shield = false;
    $('shieldBubble').className = 'shield-bubble pop';
    sfx.shield();
    fxs.stage.burst(to.x, to.y, { color: '#35F2FF', count: 36, speed: 260 });
    damageText(to.x, to.y - to.h * 0.45, 'BLOQUÉ !', '#35F2FF');
  } else {
    sfx.hurt();
    restartClass($('fHero'), 'hurt');
    restartClass(stage, 'shake');
    flash('#FF2D55', true);
    battle.hearts--;
    renderBars(battle.hearts);
    fxs.stage.burst(to.x, to.y, { color: '#FF4D6D', count: 28, speed: 220 });
    damageText(to.x, to.y - to.h * 0.45, '-1 ❤', '#FF4D6D');
  }
  await wait(380);
  beam.remove();
  updatePowerBtn();
}

function breakShield(k) {
  const s = $('foeSprite').querySelector(`.shield.s${k}`);
  if (!s) return;
  s.classList.add('broken');
  sfx.shatter();
  const r = rectIn(s, $('stage'));
  fxs.stage.burst(r.x, r.y, { color: SHIELD_COLORS[k], count: 40, speed: 300, size: 4 });
}

async function heroEnter() {
  $('fHero').className = 'fighter hero-f enter';
  $('fBip').className = 'bip-f enter';
  sfx.whoosh();
  await wait(900);
}

async function foeEnter() {
  sfx.enter();
  $('fFoe').className = 'fighter foe-f materialize';
  const om = $('foeSprite').querySelector('.omega');
  if (om) {
    await wait(700);
    om.classList.remove('sleeping');
    lookAt(om, $('heroSprite').getBoundingClientRect().left, $('heroSprite').getBoundingClientRect().top + 80, 14);
    sfx.glitch();
    flash('#FF2D55');
  }
  await wait(1100);
}

/* ==========================================================================
   Combat : déroulement
   ========================================================================== */

async function fight() {
  while (battle.foeHp > 0 && battle.hearts > 0) {
    const done = battle.foeMax - battle.foeHp;
    let pz, label;
    if (battle.boss) {
      pz = makePuzzle(ZONES[done].puzzle, 3);
      const n = ZONES[done].robotName;
      pz.title = `Bouclier ${/^[AEIOUYH]/.test(n) ? "d'" : 'de '}${n}`;
      label = `${done + 1} / 6`;
    } else {
      pz = makePuzzle(battle.type, done + 1);
      label = `Énigme ${done + 1} / ${battle.foeMax}`;
    }
    await askPuzzle(pz, label);
  }
  return battle.foeHp <= 0 ? 'win' : 'lose';
}

async function recoverFromDefeat() {
  panelIdle();
  stopMusic();
  sfx.defeat();
  $('fHero').classList.add('down');
  await wait(900);
  if (battle.boss) await talk(BOSS.lose);
  else {
    await talk([
      ['foe', pick(FOE_WIN)],
      ['bip', "Je t'ai téléporté à l'abri juste à temps ! Respire… On recommence ce combat, tu vas y arriver !"],
    ]);
  }
  state.retries++;
  $('fHero').classList.remove('down');
  restartClass($('fHero'), 'teleport');
  sfx.heal();
  battle.hearts = battle.maxHearts;
  battle.foeHp = battle.foeMax;
  battle.power = battle.boss ? 2 : 1;
  battle.shield = false;
  $('shieldBubble').className = 'shield-bubble';
  $('foeSprite').querySelectorAll('.shield.broken').forEach((s) => s.classList.remove('broken'));
  renderBars();
  await wait(700);
  playMusic(battle.boss ? 'boss' : 'battle');
}

async function playZone(i) {
  const zone = ZONES[i];
  currentFoe = { name: zone.robotName, key: zone.robot, freed: false };
  battle = {
    zone, boss: false, type: zone.puzzle, foeName: zone.robotName, color: zone.color,
    foeMax: 3, foeHp: 3, maxHearts: 3, hearts: 3, power: 1, shield: false,
  };
  await go('scrBattle', () => {
    setupStage({ bg: zone.bg, fxMode: zone.fx, foeHTML: `<div class="robot">${robotSVG(zone.robot)}</div>` });
    renderBars();
    updatePowerBtn();
  });
  playMusic('map');
  await heroEnter();
  await talk(zone.arrive);
  await foeEnter();
  await talk(zone.taunt);
  await talk(zone.tip);
  playMusic('battle');
  while ((await fight()) !== 'win') await recoverFromDefeat();
  await freeFoe(zone, i);
  state.freed = Math.max(state.freed, i + 1);
  save();
  await goMap(true);
}

async function freeFoe(zone, i) {
  panelIdle();
  stopMusic();
  const foe = $('fFoe');
  const robot = $('foeSprite').querySelector('.robot');
  foe.classList.add('glitching');
  sfx.glitch();
  await wait(1200);
  flash('#FFFFFF', true);
  foe.classList.remove('glitching');
  robot.classList.add('freed');
  currentFoe.freed = true;
  sfx.freed();
  const r = rectIn($('foeSprite'), $('stage'));
  fxs.stage.burst(r.x, r.y, { count: 70, speed: 380, colors: ['#3DFFB0', zone.color, '#FFFFFF'] });
  restartClass(foe, 'happy');
  await wait(900);
  await talk(zone.freed);
  await flyFragment(zone.letter, zone.color, i);
  await talk(zone.after);
}

async function flyFragment(letter, color, slot) {
  const f = document.createElement('div');
  f.className = 'frag-fly';
  f.textContent = letter;
  f.style.setProperty('--c', color);
  document.body.appendChild(f);
  const foe = $('foeSprite').getBoundingClientRect();
  renderHud(slot);
  const target = $('hudFrags').children[slot].getBoundingClientRect();
  const x0 = foe.left + foe.width / 2, y0 = foe.top + foe.height * 0.3;
  const x1 = target.left + target.width / 2, y1 = target.top + target.height / 2;
  sfx.fragment();
  const a = f.animate([
    { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(0) rotate(-180deg)` },
    { transform: `translate(${x0}px, ${y0 - 60}px) translate(-50%, -50%) scale(2.2) rotate(0deg)`, offset: 0.35 },
    { transform: `translate(${x0}px, ${y0 - 60}px) translate(-50%, -50%) scale(2.2) rotate(0deg)`, offset: 0.6 },
    { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(.8) rotate(360deg)` },
  ], { duration: reduceMotion ? 300 : 2000, easing: 'ease-in-out' });
  await animDone(a, 2000).finally(() => f.remove());
  renderHud(slot + 1);
  const s = $('hudFrags').children[slot];
  restartClass(s, 'pop');
  sfx.select();
  await wait(500);
}

/* ==========================================================================
   Combat final contre OMÉGA
   ========================================================================== */

async function playBoss() {
  currentFoe = { name: 'OMÉGA', key: null, freed: false };
  battle = {
    boss: true, foeName: 'OMÉGA', color: BOSS.color,
    foeMax: 6, foeHp: 6, maxHearts: 5, hearts: 5, power: 2, shield: false,
  };
  await go('scrBattle', () => {
    setupStage({ bg: 'core', fxMode: 'glitch', foeHTML: `<div class="robot omega sleeping">${omegaSVG()}</div>`, boss: true });
    renderBars();
    updatePowerBtn();
  });
  stopMusic();
  await heroEnter();
  await talk(BOSS.arrive);
  await foeEnter();
  await talk(BOSS.taunt);
  await talk(BOSS.tip);
  playMusic('boss');
  while ((await fight()) !== 'win') await recoverFromDefeat();
  panelIdle();
  $('fFoe').classList.add('weak');
  await talk(BOSS.lastStand);
  await wordPuzzle();
  await bossFinale();
}

function wordPuzzle() {
  const word = BOSS.word;
  const tiles = ZONES.map((z) => ({ l: z.letter, c: z.color, used: false }));
  const slots = Array(word.length).fill(null);
  let locked = 0, fails = 0, done = false;

  $('panel').classList.remove('idle', 'good', 'bad');
  $('pType').textContent = 'Le cœur de code';
  $('pStep').textContent = 'Dernière épreuve';
  $('pQuestion').innerHTML = "Remets les six fragments dans l'ordre pour former le mot qu'OMÉGA n'a jamais compris.";
  $('pChoices').className = 'p-choices';
  $('pChoices').innerHTML = '';
  $('pFeedback').className = 'p-feedback';

  const render = () => {
    $('pVisual').innerHTML = `
      <div class="word-slots">${slots.map((t, i) => `<button class="w-slot ${t !== null ? 'filled' : ''} ${i < locked ? 'locked' : ''}" data-s="${i}" style="--c:${t !== null ? tiles[t].c : '#35F2FF'}">${t !== null ? tiles[t].l : ''}</button>`).join('')}</div>
      <div class="word-tiles">${tiles.map((t, i) => `<button class="w-tile ${t.used ? 'used' : ''}" data-t="${i}" style="--c:${t.c}" ${t.used ? 'disabled' : ''}>${t.l}</button>`).join('')}</div>
      <p class="word-hint" id="wordHint">${fails === 0 ? 'Touche une lettre pour la placer. Touche une case pour la retirer.'
        : fails === 1 ? 'Indice de Bip : « Ce qui nous unit, toi et moi… »'
          : `Indice de Bip : « Ce qui nous unit, toi et moi… » Les ${locked} première${locked > 1 ? 's' : ''} lettre${locked > 1 ? 's sont placées' : ' est placée'} !`}</p>`;
  };

  const lockPrefix = () => {
    slots.forEach((t, i) => { if (t !== null) { tiles[t].used = false; slots[i] = null; } });
    for (let p = 0; p < locked; p++) {
      const t = tiles.findIndex((x) => !x.used && x.l === word[p]);
      tiles[t].used = true;
      slots[p] = t;
    }
  };

  render();
  clock.start();

  return guard(new Promise((resolve) => {
    const onClick = (e) => {
      if (done) return;
      const tile = e.target.closest('.w-tile');
      const slot = e.target.closest('.w-slot');
      if (tile) {
        const t = Number(tile.dataset.t);
        const s = slots.findIndex((x, i) => x === null && i >= locked);
        if (s < 0 || tiles[t].used) return;
        tiles[t].used = true;
        slots[s] = t;
        sfx.click();
      } else if (slot) {
        const s = Number(slot.dataset.s);
        if (s < locked || slots[s] === null) return;
        tiles[slots[s]].used = false;
        slots[s] = null;
        sfx.hover();
      } else return;
      render();
      if (slots.every((x) => x !== null)) {
        const guess = slots.map((t) => tiles[t].l).join('');
        if (guess === word) {
          done = true;
          clock.stop();
          state.solved++;
          sfx.correct();
          $('pVisual').querySelector('.word-slots').classList.add('win');
          $('pVisual').onclick = null;
          setTimeout(resolve, 1400);
        } else {
          fails++;
          state.errors++;
          sfx.wrong();
          restartClass($('pVisual').querySelector('.word-slots'), 'nope');
          locked = fails >= 2 ? Math.min(fails - 1, word.length - 2) : 0;
          setTimeout(() => { lockPrefix(); render(); }, 650);
        }
      }
    };
    $('pVisual').onclick = onClick;
  }));
}

async function bossFinale() {
  panelIdle();
  stopMusic();
  const stage = $('stage');
  const from = rectIn($('heroSprite'), stage), to = rectIn($('foeSprite'), stage);
  from.x += from.w * 0.3;
  restartClass($('fHero'), 'cast');
  for (let k = 0; k < 6; k++) {
    sfx.zap();
    fireOrb(SHIELD_COLORS[k], { ...from, y: from.y - 30 + k * 12 }, to, 600).catch(() => {});
    await wait(140);
  }
  await wait(500);
  sfx.hit();
  flash('#FFFFFF', true);
  fxs.stage.burst(to.x, to.y, { count: 120, speed: 460, size: 4, colors: SHIELD_COLORS });
  const om = $('foeSprite').querySelector('.omega');
  $('fFoe').classList.add('glitching');
  fxs.stage.setMode(null);
  sfx.glitch();
  await wait(1600);
  sfx.glitch();
  await wait(700);
  flash('#FFFFFF', true);
  $('fFoe').classList.remove('glitching', 'weak');
  om.classList.add('freed');
  currentFoe.freed = true;
  $('stage').classList.add('peace');
  fxs.stage.setMode('stars');
  sfx.freed();
  await wait(1200);
  playMusic('victory');
  await talk(BOSS.win);
  clearSave();
  await showEnding();
}

/* ==========================================================================
   Fin et classement mondial
   ========================================================================== */

let finalSeconds = 0;
let lbPromise = null;
const leaderboard = () => (lbPromise ??= import('../../shared/leaderboard.js').catch(() => null));

async function showEnding() {
  finalSeconds = Math.max(1, Math.round(state.ms / 1000));
  await go('scrEnd', () => {
    $('endBg').innerHTML = background('dawn');
    fxs.end.setMode('confetti');
    $('endParade').innerHTML = `
      <div class="parade-robots">${ZONES.map((z, i) => `${i === 3 ? '<div class="pr-gap"></div>' : ''}<div class="pr robot freed" style="--i:${i}">${robotSVG(z.robot)}</div>`).join('')}</div>
      <div class="parade-hero">${heroSVG(state.hero)}</div>
      <div class="parade-bip">${bipSVG()}</div>`;
    $('endText').textContent = `Grâce à toi, ${heroName()}, OMÉGA a compris ce qu'est l'amitié. Les humains ont retiré leurs casques, et les six robots sont libres.`;
    $('endStats').innerHTML = `
      <div class="stat"><b>${fmt(finalSeconds)}</b><span>temps de réflexion</span></div>
      <div class="stat"><b>${state.solved}</b><span>énigmes résolues</span></div>
      <div class="stat"><b>${state.errors}</b><span>erreur${state.errors > 1 ? 's' : ''}</span></div>`;
    $('scoreForm').style.display = '';
    $('btnReplay').disabled = false;
    $('scoreMsg').textContent = '';
    $('pseudoInput').value = '';
  });
  sfx.victory();
  playMusic('victory');
}

$('saveScore').addEventListener('click', async () => {
  const name = $('pseudoInput').value.trim();
  if (!name) { $('pseudoInput').focus(); return; }
  const btn = $('saveScore');
  btn.disabled = true;
  btn.textContent = 'Envoi…';
  const lb = await leaderboard();
  const ok = lb && lb.isLeaderboardConfigured() ? await lb.submitScore(GAME_ID, name, finalSeconds) : false;
  btn.disabled = false;
  btn.textContent = 'Enregistrer';
  if (ok) {
    $('scoreForm').style.display = 'none';
    $('scoreMsg').textContent = 'Ton temps est enregistré dans le classement mondial ! 🎉';
    $('scoreMsg').className = 'score-msg ok';
    sfx.fragment();
    openScores();
  } else {
    $('scoreMsg').textContent = "Oups, l'enregistrement a échoué. Réessaie !";
    $('scoreMsg').className = 'score-msg ko';
  }
});
$('pseudoInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('saveScore').click(); });

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function openScores() {
  $('scoresModal').classList.add('show');
  const list = $('lbList');
  list.innerHTML = '<li class="lb-empty">Chargement…</li>';
  const lb = await leaderboard();
  if (!lb || !lb.isLeaderboardConfigured()) {
    list.innerHTML = '<li class="lb-empty">Le classement mondial est indisponible pour le moment.</li>';
    return;
  }
  const rows = await lb.fetchTopScores(GAME_ID, 20);
  if (!rows.length) {
    list.innerHTML = '<li class="lb-empty">Personne n\'a encore vaincu OMÉGA… Sois le premier !</li>';
    return;
  }
  list.innerHTML = rows.map((r, i) =>
    `<li class="${i < 3 ? `top top${i + 1}` : ''}"><span class="lb-rank">${i + 1}</span><span class="lb-name">${escapeHtml(r.name)}</span><span class="lb-time">${fmt(r.value)}</span></li>`).join('');
}

$('btnScores').addEventListener('click', () => { sfx.click(); openScores(); });
$('btnShowScores').addEventListener('click', () => { sfx.click(); openScores(); });
$('closeScores').addEventListener('click', () => { sfx.click(); $('scoresModal').classList.remove('show'); });
$('btnReplay').addEventListener('click', () => {
  if ($('btnReplay').disabled) return;
  $('btnReplay').disabled = true;
  sfx.click();
  run(showTitle);
});

/* ==========================================================================
   Menu pause, son, clavier
   ========================================================================== */

let pausedClock = false;

$('btnMenu').addEventListener('click', () => {
  sfx.click();
  pausedClock = clock.running;
  clock.stop();
  $('mMap').hidden = document.body.dataset.screen !== 'scrBattle';
  $('menuModal').classList.add('show');
});
$('mResume').addEventListener('click', () => {
  sfx.click();
  $('menuModal').classList.remove('show');
  if (pausedClock) clock.start();
});
$('mMap').addEventListener('click', () => {
  $('menuModal').classList.remove('show');
  abortFlow();
  stopMusic();
  run(() => goMap(false));
});
$('mTitle').addEventListener('click', () => {
  $('menuModal').classList.remove('show');
  abortFlow();
  stopMusic();
  save();
  run(showTitle);
});

const SOUND_IC = { all: '🔊', sfx: '🔉', off: '🔇' };
const SOUND_TXT = { all: 'Musique et effets', sfx: 'Effets seulement', off: 'Son coupé' };
function renderSoundBtn() {
  const m = soundMode();
  $('btnSound').textContent = SOUND_IC[m];
  $('btnSound').title = SOUND_TXT[m];
}
$('btnSound').addEventListener('click', () => {
  unlockAudio();
  const m = cycleSound();
  renderSoundBtn();
  toast(SOUND_TXT[m]);
});

window.addEventListener('pointerdown', () => unlockAudio(), { once: false, passive: true });

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if ((e.key === 'Enter' || e.key === ' ') && dialogAdvance && $('dialog').classList.contains('show')) {
    e.preventDefault(); dialogAdvance(); return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && storyAdvance) { e.preventDefault(); storyAdvance(); return; }
  if (/^[1-4]$/.test(e.key) && active && !active.answered) {
    const b = $('pChoices').children[Number(e.key) - 1];
    if (b && !b.disabled) b.click();
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach((m) => m.classList.remove('show'));
  }
});

/* ==========================================================================
   Démarrage
   ========================================================================== */

$('btnNew').addEventListener('click', () => {
  if (titleBusy) return;
  titleBusy = true;
  unlockAudio();
  sfx.select();
  run(playStory);
});

$('btnContinue').addEventListener('click', () => {
  const s = loadSave();
  if (!s || titleBusy) return;
  titleBusy = true;
  unlockAudio();
  sfx.select();
  state = s;
  run(() => goMap(false));
});

renderSoundBtn();
buildTitle();

// Raccourci de test : ?debug=boss ou ?debug=zone3 (0 à 5) pour aller directement à un combat.
const debug = new URLSearchParams(location.search).get('debug');
if (!debug) run(showTitle);
else {
  state = freshState(HEROES[new URLSearchParams(location.search).get('hero')] ? new URLSearchParams(location.search).get('hero') : 'kai');
  state.bipMet = true;
  if (debug === 'boss') { state.freed = 6; run(playBoss); }
  else if (debug === 'autoplay') {
    // Joue une partie entière toute seule (tests) : quelques erreurs exprès pour tester les défaites.
    const errs = [];
    window.addEventListener('error', (e) => errs.push(e.message));
    window.addEventListener('unhandledrejection', (e) => { if (e.reason !== ABORT) errs.push(String(e.reason)); });
    const origError = console.error;
    console.error = (...a) => { errs.push(a.map(String).join(' ')); origError(...a); };
    let wordTries = 0;
    setInterval(() => {
      document.body.dataset.errors = errs.join(' | ');
      document.body.dataset.progress = `${document.body.dataset.screen}|freed=${state.freed}|solved=${state.solved}|errors=${state.errors}|retries=${state.retries}|t=${Math.round(state.ms)}`;
      if (dialogAdvance) { dialogAdvance(); return; }
      if (storyAdvance) { storyAdvance(); return; }
      if (nextResolve) { $('btnNext').click(); return; }
      if (active && !active.answered) {
        if (battle.wrongLeft === undefined) battle.wrongLeft = battle.boss ? 5 : state.freed === 0 ? 3 : state.freed === 2 ? 1 : 0;
        const wantWrong = battle.wrongLeft > 0;
        if (wantWrong) battle.wrongLeft--;
        if (!$('btnPower').disabled) $('btnPower').click();
        const i = active.pz.choices.findIndex((c) => c.correct !== wantWrong);
        const b = $('pChoices').children[i];
        if (b && !b.disabled) b.click();
        return;
      }
      const tiles = [...document.querySelectorAll('.w-tile:not(.used)')];
      if (tiles.length === 6) {
        const order = wordTries++ === 0 ? 'ITAEMI' : 'AMITIE';
        for (const l of order) {
          [...document.querySelectorAll('.w-tile:not(.used)')].find((x) => x.textContent === l)?.click();
        }
        return;
      }
      if (document.body.dataset.screen === 'scrSelect' && $('btnChoose').disabled) { document.querySelector(`.hero-card[data-hero="${new URLSearchParams(location.search).get('hero') || 'zia'}"]`)?.click(); return; }
      if (document.body.dataset.screen === 'scrSelect') { $('btnChoose').click(); return; }
      if ($('mcGo') && $('mapCard').classList.contains('show')) { $('mcGo').click(); }
    }, 60);
    run(playStory);
  }
  else if (debug === 'bosspz' || debug === 'word') {
    state.freed = 6;
    currentFoe = { name: 'OMÉGA', key: null, freed: false };
    battle = { boss: true, foeName: 'OMÉGA', color: BOSS.color, foeMax: 6, foeHp: 4, maxHearts: 5, hearts: 4, power: 2, shield: false };
    run(async () => {
      await go('scrBattle', () => {
        setupStage({ bg: 'core', fxMode: 'glitch', foeHTML: `<div class="robot omega">${omegaSVG()}</div>`, boss: true });
        $('fHero').className = 'fighter hero-f';
        $('fBip').className = 'bip-f';
        $('fFoe').className = 'fighter foe-f';
        $('foeSprite').querySelectorAll('.shield.s0, .shield.s1').forEach((el) => el.classList.add('broken'));
        renderBars();
      });
      if (debug === 'word') { await wordPuzzle(); await bossFinale(); return; }
      await fight();
    });
  }
  else if (debug === 'end') { state.freed = 6; state.ms = 754000; state.solved = 25; run(showEnding); }
  else if (debug === 'map') { state.freed = 3; run(() => goMap(true)); }
  else if (debug === 'select') run(goSelect);
  else if (debug === 'story') run(playStory);
  else if (/^zone[0-5]$/.test(debug)) { state.freed = Number(debug[4]); run(() => playZone(state.freed)); }
  else if (debug.startsWith('pz:')) {
    // ?debug=pz:gears:3&answer=0 — affiche directement une énigme (et y répond).
    const [, type, level] = debug.split(':');
    const zi = ZONES.findIndex((z) => z.puzzle === type);
    const zone = ZONES[zi];
    state.freed = zi;
    currentFoe = { name: zone.robotName, key: zone.robot, freed: false };
    battle = { zone, boss: false, type, foeName: zone.robotName, color: zone.color, foeMax: 3, foeHp: 3, maxHearts: 3, hearts: 3, power: 1, shield: false };
    run(async () => {
      await go('scrBattle', () => {
        setupStage({ bg: zone.bg, fxMode: zone.fx, foeHTML: `<div class="robot">${robotSVG(zone.robot)}</div>` });
        $('fHero').className = 'fighter hero-f';
        $('fBip').className = 'bip-f';
        $('fFoe').className = 'fighter foe-f';
        renderBars();
      });
      const ans = new URLSearchParams(location.search).get('answer');
      const p = askPuzzle(makePuzzle(type, Number(level) || 1), 'Énigme 1 / 3');
      if (ans !== null) setTimeout(() => $('pChoices').children[Number(ans)]?.click(), 300);
      await p;
    });
  }
}
