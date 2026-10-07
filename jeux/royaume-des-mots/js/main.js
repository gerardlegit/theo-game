// ============================================================================
// LE ROYAUME DES MOTS — application principale : écrans et déroulement.
// ============================================================================

import { $, $$, h, esc, pick, shuffle, cap } from './util.js';
import {
  REGIONS, REGION_BY_ID, FINAL_BOSS, STORY_INTRO, STORY_END, SHOP, TINCTURES, EMBLEMS, PARTITIONS, AVATARS,
} from './world.js';
import {
  save, persist, resetSave, totalStars, rankOf, recordAnswer, addGold, stageStars, stageUnlocked, regionStars,
  bossUnlocked, dailyDone, completeDaily, fill,
} from './save.js';
import { mountQuestion } from './engine.js';
import { sfx, music, unlockAudio, cycleSound, soundMode, speak, stopSpeech, canSpeak } from './audio.js';
import { confetti, sparkle, flyCoins, floatText, shake } from './fx.js';
import { blasonSVG, mapSVG, MAP_POS, sceneSVG, mageSVG, castleSVG } from './art.js';

const app = $('#app');
const COIN = '<i class="coin" aria-hidden="true"></i>';
const freedWord = (B) => (B.g === 'f' ? 'délivrée' : 'délivré');

// ------------------------------------------------------------ outils ---
function show(html, cls = '') {
  stopSpeech();
  app.innerHTML = '';
  const scr = h(`<section class="screen ${cls}">${html}</section>`);
  app.appendChild(scr);
  window.scrollTo(0, 0);
  return scr;
}

const SOUND_ICON = { all: '🔊', sfx: '🔉', off: '🔇' };
const SOUND_LABEL = { all: 'Musique et sons', sfx: 'Sons seulement', off: 'Silence' };

function soundBtn() {
  return `<button type="button" class="icon-btn sound-btn" title="${SOUND_LABEL[soundMode()]}">${SOUND_ICON[soundMode()]}</button>`;
}
function wireSound(scr) {
  $$('.sound-btn', scr).forEach((b) => b.addEventListener('click', () => {
    unlockAudio();
    const m = cycleSound();
    $$('.sound-btn').forEach((x) => { x.textContent = SOUND_ICON[m]; x.title = SOUND_LABEL[m]; });
    toast(SOUND_LABEL[m]);
  }));
}

function hud() {
  const hero = save.hero;
  return `<header class="hud">
    <button type="button" class="hud-hero" data-go="settings" title="Mon héros">
      <span class="hud-blason">${blasonSVG(hero.blason)}</span>
      <span class="hud-id"><b>${esc(hero.name)}</b><small>${esc(rankOf())}</small></span>
    </button>
    <div class="hud-res">
      <span class="pill" title="Étoiles">⭐ <b>${totalStars()}</b></span>
      <span class="pill gold" title="Écus d’or">${COIN} <b class="gold-count">${save.gold}</b></span>
      ${soundBtn()}
    </div>
  </header>`;
}

function updateGold() {
  $$('.gold-count').forEach((g) => { g.textContent = save.gold; });
}

function toast(text, ms = 1800) {
  const t = h(`<div class="toast">${text}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

function modal(html, { cls = '' } = {}) {
  const m = h(`<div class="modal-back"><div class="modal ${cls}">${html}</div></div>`);
  document.body.appendChild(m);
  const close = () => m.remove();
  m.addEventListener('click', (e) => { if (e.target === m) close(); });
  return { el: m.querySelector('.modal'), close };
}

function confirmBox(text, yes = 'Oui', no = 'Non') {
  return new Promise((res) => {
    const { el, close } = modal(`<p class="modal-text">${text}</p><div class="row"><button class="btn ghost no">${esc(no)}</button><button class="btn primary yes">${esc(yes)}</button></div>`);
    el.querySelector('.yes').addEventListener('click', () => { close(); res(true); });
    el.querySelector('.no').addEventListener('click', () => { close(); res(false); });
  });
}

function starsHtml(n, max = 3) {
  return Array.from({ length: max }, (_, i) => `<span class="st ${i < n ? 'on' : ''}">★</span>`).join('');
}

// Premier geste : on débloque le son.
document.addEventListener('pointerdown', () => unlockAudio(), { once: true });
document.addEventListener('keydown', () => unlockAudio(), { once: true });

// =========================================================== ÉCRAN TITRE ===
function titleScreen() {
  music('map');
  const scr = show(`
    <div class="scene-bg">${sceneSVG('meadow')}</div>
    <a class="back-link" href="../../index.html">← La Cabane</a>
    <div class="top-right">${soundBtn()}</div>
    <div class="title-wrap">
      <p class="eyebrow">La Cabane à Jeux présente</p>
      <h1 class="logo"><span>Le Royaume</span><span class="big">des Mots</span></h1>
      <p class="tagline">Brise le sortilège du Grand Charabia : conjugaison, grammaire, orthographe, vocabulaire et lecture !</p>
      <div class="title-btns">
        ${save.hero
          ? `<button class="btn primary big" id="bContinue">⚔️ Continuer l’aventure</button>
             <p class="welcome">${esc(save.hero.name)}, ${esc(rankOf())} · ⭐ ${totalStars()}</p>`
          : '<button class="btn primary big" id="bNew">⚔️ Commencer l’aventure</button>'}
      </div>
      <p class="tiny">Pour les 8 – 11 ans (CM1 – CM2)</p>
    </div>`, 'title');
  wireSound(scr);
  $('#bNew', scr)?.addEventListener('click', () => { sfx.fanfare(); storyScreen(STORY_INTRO, () => createScreen()); });
  $('#bContinue', scr)?.addEventListener('click', () => { sfx.select(); mapScreen(); });
}

// ============================================================= HISTOIRE ===
function storyArt(kind) {
  const L = (e, cls = '') => `<span class="sa ${cls}">${e}</span>`;
  switch (kind) {
    case 'kingdom': return `${sceneSVG('castle')}<div class="sa-layer">${L('🏰', 'xl float')}${L('📜', 'a1')}${L('✒️', 'a2')}</div>`;
    case 'mage': return `${sceneSVG('tower')}<div class="sa-layer"><div class="sa-mage float">${mageSVG()}</div>${L('⚡', 'a1 flash')}${L('🌀', 'a2 spin')}</div>`;
    case 'guardians': return `${sceneSVG('abbey')}<div class="sa-layer row">${['🐉', '🗿', '🐍', '👹', '👻'].map((e, i) => `<span class="sa g cursed" style="animation-delay:${i * 0.15}s">${e}</span>`).join('')}</div>`;
    case 'owl': return `${sceneSVG('forest')}<div class="sa-layer">${L('🦉', 'xl float')}${L('✨', 'a1 twinkle')}</div>`;
    case 'hero': return `${sceneSVG('meadow')}<div class="sa-layer">${L(save.hero?.avatar || '🤴', 'xl float')}${L('✒️', 'a1')}${L('⚔️', 'a2')}</div>`;
    case 'tower': return `${sceneSVG('tower')}<div class="sa-layer">${L('💥', 'xl flash')}</div>`;
    case 'mage-free': return `${sceneSVG('meadow')}<div class="sa-layer"><div class="sa-mage">${mageSVG(true)}</div>${L(save.hero?.avatar || '🤴', 'big')}</div>`;
    case 'crown': return `${sceneSVG('castle')}<div class="sa-layer">${L('👑', 'xl float')}${L(save.hero?.avatar || '🤴', 'big')}</div>`;
    default: return sceneSVG('castle');
  }
}

function storyScreen(slides, onEnd) {
  music('map');
  let i = 0;
  const scr = show(`
    <div class="story-art"></div>
    <div class="story-box">
      <div class="narrator">🦉</div>
      <p class="story-text"></p>
      <div class="story-foot">
        <span class="dots"></span>
        ${canSpeak() ? '<button class="icon-btn speak-story" title="Écouter">🔊</button>' : ''}
        <button class="btn primary next">Suivant ➜</button>
      </div>
    </div>
    <button class="btn ghost skip">Passer ⏭</button>`, 'story');
  const art = $('.story-art', scr);
  const text = $('.story-text', scr);
  const dots = $('.dots', scr);
  const next = $('.next', scr);
  const render = () => {
    const s = slides[i];
    art.innerHTML = storyArt(s.art);
    text.innerHTML = fill(s.text);
    text.classList.remove('appear'); void text.offsetWidth; text.classList.add('appear');
    dots.innerHTML = slides.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    next.textContent = i === slides.length - 1 ? 'C’est parti ! ⚔️' : 'Suivant ➜';
    sfx.page();
  };
  next.addEventListener('click', () => { i++; if (i >= slides.length) { stopSpeech(); onEnd(); } else render(); });
  $('.skip', scr).addEventListener('click', () => { stopSpeech(); onEnd(); });
  $('.speak-story', scr)?.addEventListener('click', () => speak(text.textContent));
  render();
}

// ====================================================== CRÉATION DU HÉROS ===
function createScreen(editing = false) {
  music('map');
  const draft = JSON.parse(JSON.stringify(save.hero || {
    name: '', g: 'm', avatar: '🤴', blason: { field: 'azur', second: 'or', part: 'plein', emblem: '🦁' },
  }));
  const scr = show(`
    <div class="scene-bg dim">${sceneSVG('castle')}</div>
    <div class="panel parchment create">
      <h2 class="h-title">${editing ? 'Ton héros' : 'Qui es-tu, jeune héros ?'}</h2>
      <label class="field"><span>Ton prénom</span>
        <input id="cName" maxlength="14" autocomplete="off" placeholder="Écris ton prénom" value="${esc(draft.name)}"></label>
      <div class="field"><span>Tu deviens…</span>
        <div class="seg" id="cGender">
          <button type="button" data-g="m">un chevalier</button><button type="button" data-g="f">une chevalière</button>
        </div></div>
      <div class="field"><span>Ton apparence</span><div class="avatars" id="cAvatar">
        ${AVATARS.map((a) => `<button type="button" class="av" data-a="${a}">${a}</button>`).join('')}</div></div>
      <div class="blason-maker">
        <div class="bm-preview" id="cPreview"></div>
        <div class="bm-controls">
          <p class="bm-title">Ton blason</p>
          <div class="bm-row"><span>Couleur</span><div class="swatches" data-k="field">${TINCTURES.map((t) => `<button type="button" class="sw" data-v="${t.id}" style="--c:${t.color}" title="${t.name} (${t.hint})"></button>`).join('')}</div></div>
          <div class="bm-row"><span>Partition</span><div class="seg small" data-k="part">${PARTITIONS.map((p) => `<button type="button" data-v="${p.id}">${p.name}</button>`).join('')}</div></div>
          <div class="bm-row second-row"><span>2e couleur</span><div class="swatches" data-k="second">${TINCTURES.map((t) => `<button type="button" class="sw" data-v="${t.id}" style="--c:${t.color}" title="${t.name} (${t.hint})"></button>`).join('')}</div></div>
          <div class="bm-row"><span>Emblème</span><div class="emblems" data-k="emblem">${EMBLEMS.map((e) => `<button type="button" data-v="${e}">${e}</button>`).join('')}</div></div>
          <p class="bm-heraldry" id="cHeraldry"></p>
        </div>
      </div>
      <button class="btn primary big" id="cOk">${editing ? 'Enregistrer ✔' : 'Prêter serment ⚔️'}</button>
      ${editing ? '<button class="btn ghost" id="cBack">Annuler</button>' : ''}
    </div>`, 'create-screen');

  const refresh = () => {
    $('#cPreview', scr).innerHTML = blasonSVG(draft.blason);
    $$('#cGender button', scr).forEach((b) => b.classList.toggle('on', b.dataset.g === draft.g));
    $$('#cAvatar .av', scr).forEach((b) => b.classList.toggle('on', b.dataset.a === draft.avatar));
    $$('[data-k]', scr).forEach((group) => {
      $$('button', group).forEach((b) => b.classList.toggle('on', b.dataset.v === draft.blason[group.dataset.k]));
    });
    $('.second-row', scr).hidden = draft.blason.part === 'plein';
    const T = (id) => TINCTURES.find((t) => t.id === id);
    const part = PARTITIONS.find((p) => p.id === draft.blason.part);
    $('#cHeraldry', scr).innerHTML = `En langage des chevaliers : <b>${part.id === 'plein' ? '' : `${part.name} `}${T(draft.blason.field).name}${part.id === 'plein' ? '' : ` et ${T(draft.blason.second).name}`}</b> <small>(${T(draft.blason.field).hint}${part.id === 'plein' ? '' : ` et ${T(draft.blason.second).hint}`})</small>`;
  };
  $$('#cGender button', scr).forEach((b) => b.addEventListener('click', () => { sfx.click(); draft.g = b.dataset.g; refresh(); }));
  $$('#cAvatar .av', scr).forEach((b) => b.addEventListener('click', () => { sfx.select(); draft.avatar = b.dataset.a; refresh(); }));
  $$('[data-k]', scr).forEach((group) => $$('button', group).forEach((b) => b.addEventListener('click', () => {
    sfx.click();
    draft.blason[group.dataset.k] = b.dataset.v;
    if (group.dataset.k === 'field' && draft.blason.second === b.dataset.v) draft.blason.second = b.dataset.v === 'or' ? 'argent' : 'or';
    refresh();
  })));
  $('#cOk', scr).addEventListener('click', () => {
    const name = $('#cName', scr).value.trim();
    if (!name) { shake($('#cName', scr)); $('#cName', scr).focus(); toast('Écris ton prénom !'); return; }
    draft.name = name.charAt(0).toUpperCase() + name.slice(1);
    save.hero = draft;
    persist();
    sfx.fanfare();
    if (editing) mapScreen();
    else storyScreen([STORY_INTRO[STORY_INTRO.length - 1]], () => mapScreen());
  });
  $('#cBack', scr)?.addEventListener('click', () => mapScreen());
  refresh();
}

// ================================================================ CARTE ===
function mapScreen({ justFreed = null } = {}) {
  if (!save.hero) { titleScreen(); return; }
  music('map');
  const freedCount = Object.keys(save.bosses).length;
  const scr = show(`
    ${hud()}
    <div class="map-wrap">
      <div class="map">${mapSVG()}
        ${REGIONS.map((r) => {
          const [x, y] = MAP_POS[r.id];
          const freed = !!save.bosses[r.id];
          return `<button class="marker ${freed ? 'freed' : ''}" data-r="${r.id}" style="left:${x / 10}%;top:${y / 7}%;--rc:${r.color}">
            <span class="m-name">${esc(r.name)}</span>
            <span class="m-sub">${esc(r.subject)} · ⭐ ${regionStars(r.id)}/15 ${freed ? '· 💜' : ''}</span></button>`;
        }).join('')}
        <button class="marker final ${freedCount >= 5 ? '' : 'locked'} ${save.finalWon ? 'freed' : ''}" data-r="final" style="left:${MAP_POS.final[0] / 10}%;top:${MAP_POS.final[1] / 7}%">
          <span class="m-name">${freedCount >= 5 ? 'Tour d’Embrouillard' : '🔒 Tour d’Embrouillard'}</span>
          <span class="m-sub">${save.finalWon ? 'Sortilège brisé ! 👑' : `Gardiens délivrés : ${freedCount}/5`}</span></button>
      </div>
    </div>
    <nav class="bottom-nav">
      <button data-go="daily" class="${dailyDone() ? '' : 'glow-btn'}">☀️<span>Quête du jour</span>${dailyDone() ? '' : '<i class="badge">!</i>'}</button>
      <button data-go="domain">🏰<span>Mon domaine</span></button>
      <button data-go="grimoire">📖<span>Grimoire</span></button>
      <button data-go="tournoi">🏇<span>Tournoi</span></button>
    </nav>`, 'map-screen');
  wireSound(scr);
  // Brouillard : levé sur les régions libérées.
  $$('.fog', scr).forEach((f) => {
    const id = f.dataset.region;
    if (save.bosses[id]) {
      if (id === justFreed) setTimeout(() => f.classList.add('clearing'), 400);
      else f.style.display = 'none';
    }
  });
  if (justFreed) {
    setTimeout(() => { sfx.magic(); sparkle($(`.marker[data-r="${justFreed}"]`, scr), 40, '#E9C6FF'); }, 700);
  }
  $$('.marker', scr).forEach((m) => m.addEventListener('click', () => {
    sfx.select();
    const id = m.dataset.r;
    if (id === 'final') {
      if (freedCount >= 5) finalIntro();
      else toast(`🔒 Délivre les 5 gardiens pour entrer dans la tour (${freedCount}/5)`, 2600);
      return;
    }
    regionScreen(id);
  }));
  wireNav(scr);
}

function wireNav(scr) {
  $$('[data-go]', scr).forEach((b) => b.addEventListener('click', () => {
    sfx.click();
    ({ daily: dailyScreen, domain: domainScreen, grimoire: grimoireScreen, tournoi: tournamentIntro, settings: settingsModal, map: mapScreen })[b.dataset.go]();
  }));
}

// =============================================================== RÉGION ===
function regionScreen(id) {
  const R = REGION_BY_ID[id];
  music('map');
  const first = !save.greeted[id];
  const nextIdx = [0, 1, 2, 3, 4].find((i) => stageStars(id, i) === 0);
  let say;
  if (first) say = fill(R.greet);
  else if (save.bosses[id]) say = `Grâce à toi, ${save.hero.name}, ${R.boss.name} est ${freedWord(R.boss)} ! Tu peux rejouer les épreuves pour gagner encore plus d’étoiles.`;
  else if (nextIdx === undefined) say = `Tu es prêt${save.hero.g === 'f' ? 'e' : ''} ! ${cap(R.boss.name)} t’attend au bout du chemin. Courage, ${save.hero.name} !`;
  else say = `Prochaine épreuve : <b>${esc(R.stages[nextIdx].title)}</b>. Astuce : ${esc(R.lessons[nextIdx].tip)}`;
  save.greeted[id] = true;
  persist();

  const nodes = R.stages.map((s, i) => {
    const st = stageStars(id, i);
    const open = stageUnlocked(id, i);
    return `<button class="node ${open ? '' : 'locked'} ${st ? 'done' : ''} ${open && !st ? 'current' : ''}" data-i="${i}">
      <span class="n-num">${open ? i + 1 : '🔒'}</span>
      <span class="n-title">${esc(s.title)}</span>
      <span class="n-stars">${starsHtml(st)}</span></button>`;
  }).join('');
  const bossOpen = bossUnlocked(id);
  const freed = !!save.bosses[id];
  const scr = show(`
    <div class="scene-bg">${sceneSVG(R.bg)}</div>
    ${hud()}
    <div class="region-head">
      <button class="btn ghost small back">← Carte</button>
      <h2 class="h-title light" style="--rc:${R.color}">${esc(R.name)}<small>${esc(R.subject)}</small></h2>
    </div>
    <div class="mentor-card">
      <div class="mentor-face"><span>${R.mentor.emoji}</span><i>${R.mentor.badge}</i></div>
      <div class="bubble"><b>${esc(R.mentor.name)}</b>, ${esc(R.mentor.role)}<p>${say}</p></div>
    </div>
    <div class="path" style="--rc:${R.color}">
      ${nodes}
      <button class="node boss ${bossOpen ? '' : 'locked'} ${freed ? 'done' : ''}" data-boss="1">
        <span class="n-num boss-face ${freed ? '' : 'cursed'}">${bossOpen ? R.boss.emoji : '🔒'}</span>
        <span class="n-title">${freed ? `${esc(cap(R.boss.name))} est ${freedWord(R.boss)}` : `Délivrer ${esc(R.boss.name)}`}</span>
        <span class="n-stars">${freed ? '💜 Ami du royaume' : bossOpen ? '⚔️ Combat !' : 'Termine les 5 épreuves'}</span></button>
    </div>`, `region-screen bg-${R.bg}`);
  wireSound(scr);
  wireNav(scr);
  $('.back', scr).addEventListener('click', () => { sfx.click(); mapScreen(); });
  $$('.node[data-i]', scr).forEach((n) => n.addEventListener('click', () => {
    const i = Number(n.dataset.i);
    if (!stageUnlocked(id, i)) { sfx.wrong(); toast('🔒 Réussis d’abord l’épreuve précédente !'); return; }
    sfx.select();
    lessonScreen(id, i);
  }));
  $('.node.boss', scr).addEventListener('click', () => {
    if (!bossOpen) { sfx.wrong(); toast('🔒 Réussis les 5 épreuves pour affronter le gardien !', 2400); return; }
    sfx.select();
    battleScreen(id);
  });
  if (first && canSpeak()) $('.bubble', scr).insertAdjacentHTML('beforeend', '<button class="icon-btn mini speak-bubble">🔊</button>');
  $('.speak-bubble', scr)?.addEventListener('click', () => speak($('.bubble p', scr).textContent));
}

// =============================================================== LEÇON ===
function lessonScreen(id, i, { fromGrimoire = false } = {}) {
  const R = REGION_BY_ID[id];
  const L = R.lessons[i];
  const key = `${id}-${i + 1}`;
  const firstTime = !save.lessons[key];
  save.lessons[key] = true;
  persist();
  sfx.page();
  const scr = show(`
    <div class="scene-bg dim">${sceneSVG(R.bg)}</div>
    <div class="panel parchment lesson">
      <p class="lesson-kicker" style="--rc:${R.color}">${esc(R.subject)} · ${fromGrimoire ? 'Grimoire' : `Épreuve ${i + 1} : ${esc(R.stages[i].title)}`}</p>
      <h2 class="h-title">📜 ${esc(L.title)}</h2>
      <div class="lesson-body">${L.html}</div>
      <div class="lesson-tip"><span class="mentor-mini">${R.mentor.emoji}</span><p><b>L’astuce de ${esc(R.mentor.name)} :</b> ${esc(L.tip)}</p></div>
      ${firstTime && !fromGrimoire ? '<p class="new-page">✨ Nouvelle page ajoutée à ton Grimoire !</p>' : ''}
      <div class="row">
        <button class="btn ghost back">← Retour</button>
        ${canSpeak() ? '<button class="btn ghost listen">🔊 Écouter</button>' : ''}
        ${fromGrimoire ? '' : `<button class="btn primary go">Je suis prêt${save.hero.g === 'f' ? 'e' : ''} ! ⚔️</button>`}
      </div>
    </div>`, 'lesson-screen');
  $('.back', scr).addEventListener('click', () => (fromGrimoire ? grimoireScreen(id) : regionScreen(id)));
  $('.listen', scr)?.addEventListener('click', () => speak(`${L.title}. ${$('.lesson-body', scr).textContent}. ${L.tip}`));
  $('.go', scr)?.addEventListener('click', () => { sfx.select(); stageScreen(id, i); });
}

// ======================================================= SESSION D'ÉPREUVES ===
/**
 * Enchaîne une série de questions. Les erreurs reviennent une fois en fin de
 * série (on apprend de ses erreurs !).
 */
function runSession({ head, questions, mentor, bg, requeue = true, onEnd, onQuit }) {
  music('map');
  const queue = questions.slice();
  const total = questions.length;
  let solved = 0, errors = 0, firstFails = 0, combo = 0, bestCombo = 0, goldWon = 0;
  const scr = show(`
    <div class="scene-bg dim">${sceneSVG(bg)}</div>
    <header class="play-top">
      <button class="icon-btn quit" title="Quitter">✖</button>
      <div class="play-title">${head}</div>
      <span class="pill gold">${COIN} <b class="gold-count">${save.gold}</b></span>
      ${soundBtn()}
    </header>
    <div class="torches">${Array.from({ length: total }, () => '<i></i>').join('')}</div>
    <div class="combo" hidden></div>
    <div class="q-host"></div>`, 'play-screen');
  wireSound(scr);
  const host = $('.q-host', scr);
  const torches = $$('.torches i', scr);
  const comboEl = $('.combo', scr);
  $('.quit', scr).addEventListener('click', async () => {
    if (await confirmBox('Quitter l’épreuve ? Ta progression dans cette épreuve sera perdue.', 'Quitter', 'Rester')) onQuit();
  });

  function next() {
    if (!queue.length) { onEnd({ errors, firstFails, total, bestCombo, goldWon }); return; }
    const q = queue.shift();
    mountQuestion(host, q, {
      mentor,
      onResult(ok, card) {
        recordAnswer(q.skill, ok);
        if (ok) {
          combo++; bestCombo = Math.max(bestCombo, combo);
          if (!q.retry) {
            const gain = 2 + (combo >= 3 ? 1 : 0);
            goldWon += gain;
            addGold(gain);
            flyCoins(card.querySelector('.right') || card, $('.gold-count', scr).parentElement, gain);
            setTimeout(updateGold, 700);
          }
          solved++;
          torches[solved - 1]?.classList.add('lit');
          sparkle(card.querySelector('.right') || card, 18);
          if (combo >= 3) {
            comboEl.hidden = false;
            comboEl.innerHTML = `🔥 Série de ${combo} !`;
            comboEl.classList.remove('pop'); void comboEl.offsetWidth; comboEl.classList.add('pop');
            sfx.combo();
          }
        } else {
          combo = 0; errors++;
          if (!q.retry) firstFails++;
          comboEl.hidden = true;
          if (requeue && !q.retry) {
            queue.push({ ...q, retry: true, prompt: `🔁 <i>Le piège revient !</i> ${q.prompt}` });
          } else {
            solved++;
            torches[solved - 1]?.classList.add('dim');
          }
        }
        persist();
      },
      onDone: next,
    });
  }
  next();
}

const starsFor = (errors) => (errors <= 1 ? 3 : errors <= 3 ? 2 : 1);

function stageScreen(id, i) {
  const R = REGION_BY_ID[id];
  const skill = `${id}-${i + 1}`;
  const questions = R.stages[i].gen(skill);
  const before = { stars: stageStars(id, i), rank: rankOf() };
  runSession({
    head: `<b>${esc(R.stages[i].title)}</b><small>${esc(R.name)}</small>`,
    questions,
    mentor: R.mentor,
    bg: R.bg,
    onQuit: () => regionScreen(id),
    onEnd: ({ errors, firstFails, total, goldWon, bestCombo }) => {
      if (firstFails > total / 2) {
        resultScreen({
          title: 'Presque !',
          stars: 0, gold: goldWon, errors, bestCombo, rankUp: null, quiet: true,
          extra: `<p class="unlock-note">${R.mentor.emoji} « Le sortilège résiste encore… Relis la page du Grimoire, puis retente l’épreuve : tu vas y arriver ! »</p>`,
          buttons: [
            ['📜 Relire la leçon', 'ghost', () => lessonScreen(id, i)],
            ['Réessayer ⚔️', 'primary', () => stageScreen(id, i)],
            ['Retour', 'ghost', () => regionScreen(id)],
          ],
        });
        return;
      }
      const stars = starsFor(errors);
      let bonus = stars * 5;
      if (stars === 3 && before.stars < 3) bonus += 10;
      addGold(bonus);
      if (stars > before.stars) save.stars[skill] = stars;
      persist();
      const unlockedBoss = i === 4 && before.stars === 0;
      resultScreen({
        title: stars === 3 ? 'Épreuve parfaite !' : 'Épreuve réussie !',
        stars, gold: goldWon + bonus, errors, bestCombo,
        rankUp: rankOf() !== before.rank ? rankOf() : null,
        extra: unlockedBoss ? `<p class="unlock-note">${R.boss.emoji} Le chemin vers <b>${esc(R.boss.name)}</b> est ouvert ! Délivre ${R.boss.g === 'f' ? 'la gardienne' : 'le gardien'} !</p>` : '',
        buttons: [
          ['Rejouer', 'ghost', () => stageScreen(id, i)],
          ...(i < 4 ? [['Épreuve suivante ➜', 'primary', () => lessonScreen(id, i + 1)]] : [[`Affronter ${R.boss.name} ⚔️`, 'primary', () => battleScreen(id)]]),
          ['Retour', 'ghost', () => regionScreen(id)],
        ],
      });
    },
  });
}

function resultScreen({ title, stars, gold, errors, bestCombo, rankUp, extra = '', buttons, quiet = false }) {
  if (quiet) sfx.unlock(); else sfx.victory();
  const scr = show(`
    <div class="scene-bg dim">${sceneSVG('castle')}</div>
    <div class="panel parchment result">
      <h2 class="h-title">${esc(title)}</h2>
      <div class="big-stars">${[0, 1, 2].map((k) => `<span class="bst ${k < stars ? 'on' : ''}" style="animation-delay:${0.3 + k * 0.35}s">★</span>`).join('')}</div>
      <div class="result-stats">
        <div><b>${COIN} +${gold}</b><small>écus d’or</small></div>
        <div><b>${errors === 0 ? '0 🎯' : errors}</b><small>erreur${errors > 1 ? 's' : ''}</small></div>
        <div><b>🔥 ${bestCombo}</b><small>meilleure série</small></div>
      </div>
      ${rankUp ? `<p class="rank-up">🎖️ Tu deviens <b>${esc(rankUp)}</b> !</p>` : ''}
      ${extra}
      <div class="row wrap">${buttons.map(([l, c], k) => `<button class="btn ${c}" data-k="${k}">${esc(l)}</button>`).join('')}</div>
    </div>`, 'result-screen');
  $$('.row button', scr).forEach((b) => b.addEventListener('click', () => { sfx.click(); buttons[Number(b.dataset.k)][2](); }));
  if (!quiet) setTimeout(() => confetti(stars === 3 ? 160 : 80), 400);
  if (rankUp) setTimeout(() => sfx.fanfare(), 1600);
}

// ============================================================== COMBAT ===
function battleScreen(id) {
  const isFinal = id === 'final';
  const R = isFinal ? null : REGION_BY_ID[id];
  const B = isFinal ? FINAL_BOSS : R.boss;
  const mentor = isFinal ? { emoji: '🦉', name: 'Plume' } : R.mentor;
  const pool = isFinal
    ? shuffle(REGIONS.flatMap((r) => r.bossGen(`${r.id}-boss`, 8)))
    : R.bossGen(`${id}-boss`, 30);
  const maxHp = B.hp;
  let hp = maxHp, hearts = 5, combo = 0, qi = 0;
  music('battle');
  const scr = show(`
    <div class="scene-bg">${sceneSVG(isFinal ? 'tower' : R.bg)}</div>
    <header class="play-top">
      <button class="icon-btn quit" title="Fuir">🏳️</button>
      <div class="play-title"><b>${esc(B.name)}</b><small>${esc(B.title)}</small></div>
      ${soundBtn()}
    </header>
    <div class="arena">
      <div class="boss-side">
        <div class="boss-bubble"></div>
        <div class="boss ${isFinal ? 'mage' : ''} cursed">${isFinal ? mageSVG() : `<span>${B.emoji}</span>`}</div>
        <div class="hpbar"><i style="width:100%"></i><span>${hp} / ${maxHp}</span></div>
      </div>
      <div class="hero-side">
        <div class="hero-face">${save.hero.avatar}<span class="mini-blason">${blasonSVG(save.hero.blason)}</span></div>
        <div class="hearts">${'<i>❤️</i>'.repeat(hearts)}</div>
      </div>
    </div>
    <div class="q-host"></div>`, `battle-screen ${isFinal ? 'final' : ''}`);
  wireSound(scr);
  const bossEl = $('.boss', scr);
  const bubble = $('.boss-bubble', scr);
  const host = $('.q-host', scr);
  const say = (t) => { bubble.innerHTML = esc(fill(t)); bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop'); };
  $('.quit', scr).addEventListener('click', async () => {
    if (await confirmBox('Battre en retraite ? Tu pourras revenir quand tu voudras.', 'Fuir', 'Combattre')) (isFinal ? mapScreen() : regionScreen(id));
  });

  const updateBars = () => {
    $('.hpbar i', scr).style.width = `${(hp / maxHp) * 100}%`;
    $('.hpbar span', scr).textContent = `${Math.max(0, hp)} / ${maxHp}`;
    $('.hearts', scr).innerHTML = Array.from({ length: 5 }, (_, k) => `<i class="${k < hearts ? '' : 'lost'}">${k < hearts ? '❤️' : '🖤'}</i>`).join('');
  };

  async function intro() {
    sfx.roar();
    shake(bossEl, 'big');
    say(B.intro);
    host.innerHTML = `<div class="battle-intro panel parchment"><p>${mentor.emoji} <b>${esc(mentor.name)}</b> : « ${isFinal
      ? 'Le voici enfin ! Chaque bonne réponse est un coup d’épée. Tous les savoirs du royaume sont avec toi !'
      : `Chaque bonne réponse est un coup d’épée qui brise le sortilège. Tu as 5 cœurs : courage, ${esc(save.hero.name)} !`} »</p>
      <button class="btn primary big start">⚔️ En garde !</button></div>`;
    $('.start', host).addEventListener('click', () => { sfx.select(); nextQ(); });
  }

  function nextQ() {
    if (hp <= 0) { victory(); return; }
    if (hearts <= 0) { defeat(); return; }
    if (qi >= pool.length) pool.push(...(isFinal ? REGIONS.flatMap((r) => r.bossGen(`${r.id}-boss`, 4)) : R.bossGen(`${id}-boss`, 10)));
    const q = pool[qi++];
    if (Math.random() < 0.5) say(pick(B.taunts));
    mountQuestion(host, q, {
      mentor,
      continueLabel: 'Suite du combat ➜',
      onResult(ok) {
        recordAnswer(q.skill, ok);
        if (ok) {
          combo++;
          const crit = combo % 3 === 0;
          const dmg = crit ? 2 : 1;
          hp -= dmg;
          sfx.slash();
          setTimeout(() => sfx.hit(), 120);
          bossEl.classList.remove('hit'); void bossEl.offsetWidth; bossEl.classList.add('hit');
          floatText(bossEl, crit ? `COUP CRITIQUE ! -${dmg}` : `-${dmg}`, crit ? 'crit' : 'dmg');
          sparkle(bossEl, crit ? 40 : 20, crit ? '#FFD54A' : '#FFFFFF');
          if (hp > 0 && hp <= maxHp / 2 && hp + dmg > maxHp / 2) say(isFinal ? 'Impossible ! Mes sortilèges faiblissent !' : 'Grrr… Ma tête… le sortilège se fissure !');
        } else {
          combo = 0;
          hearts--;
          sfx.hurt();
          shake(scr.querySelector('.arena'), 'big');
          floatText($('.hero-face', scr), '-❤️', 'hurt');
          say(pick(B.taunts));
        }
        updateBars();
      },
      onDone: nextQ,
    });
  }

  function victory() {
    music(null);
    sfx.victory();
    bossEl.classList.remove('cursed');
    bossEl.classList.add('freed');
    if (isFinal) bossEl.innerHTML = mageSVG(true);
    confetti(180);
    const first = isFinal ? !save.finalWon : !save.bosses[id];
    const reward = first ? (isFinal ? 150 : 60) : 20;
    addGold(reward);
    if (isFinal) save.finalWon = true; else save.bosses[id] = true;
    persist();
    say(isFinal ? 'Non… NOOOON ! Ma magie… s’envole…' : fill(B.freed));
    host.innerHTML = `<div class="panel parchment result">
      <h2 class="h-title">${isFinal ? 'Le Grand Charabia est brisé !' : `${esc(cap(B.name))} est ${freedWord(B)} !`}</h2>
      <p class="big-emoji">${isFinal ? '👑' : `${B.emoji}💜`}</p>
      <p>Tu gagnes <b>${COIN} ${reward} écus d’or</b>${first && !isFinal ? ` et ${B.g === 'f' ? 'une nouvelle amie' : 'un nouvel ami'} pour ton domaine !` : '.'}</p>
      <div class="row"><button class="btn primary big go">${isFinal ? 'Voir la fin de l’histoire ✨' : 'Retour à la carte 🗺️'}</button></div></div>`;
    $('.go', host).addEventListener('click', () => {
      if (isFinal) storyScreen(STORY_END, () => { save.endingSeen = true; persist(); mapScreen(); });
      else mapScreen({ justFreed: id });
    });
  }

  function defeat() {
    music(null);
    sfx.defeat();
    const f = save.hero.g === 'f';
    say(isFinal ? 'Ha ha ha ! Reviens quand tu auras révisé ton Grimoire !' : `Ha ! Tu n’es pas encore assez fort${f ? 'e' : ''} pour me délivrer !`);
    host.innerHTML = `<div class="panel parchment result">
      <h2 class="h-title">Retraite !</h2>
      <p>Tu n’as plus de cœurs… mais ${f ? 'une vraie chevalière' : 'un vrai chevalier'} se relève toujours ! Relis les pages du <b>Grimoire</b> et reviens.</p>
      <p>Il restait <b>${hp}</b> point${hp > 1 ? 's' : ''} de sortilège à briser.</p>
      <div class="row"><button class="btn ghost book">📖 Grimoire</button><button class="btn primary retry">Réessayer ⚔️</button></div></div>`;
    $('.retry', host).addEventListener('click', () => battleScreen(id));
    $('.book', host).addEventListener('click', () => grimoireScreen(isFinal ? 'conj' : id));
  }

  updateBars();
  intro();
}

function finalIntro() {
  const scr = show(`
    <div class="scene-bg">${sceneSVG('tower')}</div>
    <div class="panel parchment lesson">
      <h2 class="h-title">🌩️ La Tour d’Embrouillard</h2>
      <div class="final-mage">${mageSVG(save.finalWon)}</div>
      <p>${save.finalWon
        ? 'Embrouillard est devenu ton ami et révise avec toi. Tu peux le défier à nouveau pour t’entraîner !'
        : fill('Les cinq gardiens délivrés t’accompagnent jusqu’au pied de la tour. Là-haut, le mage Embrouillard t’attend. Ce combat mêlera <b>tous</b> les savoirs du royaume, {heros}.')}</p>
      <div class="row"><button class="btn ghost back">← Carte</button><button class="btn primary big go">Monter dans la tour ⚔️</button></div>
    </div>`, 'lesson-screen');
  music('battle');
  $('.back', scr).addEventListener('click', () => mapScreen());
  $('.go', scr).addEventListener('click', () => battleScreen('final'));
}

// ============================================================== DOMAINE ===
function domainScreen() {
  music('map');
  const scr = show(`
    ${hud()}
    <div class="sub-head"><button class="btn ghost small back">← Carte</button><h2 class="h-title">🏰 Mon domaine</h2></div>
    <div class="castle-view">${castleSVG({ owned: save.owned, blason: save.hero.blason, freed: save.bosses, hero: save.hero.avatar })}</div>
    <p class="hint center">Gagne des écus d’or dans les épreuves pour bâtir ton château. Les gardiens délivrés viennent y vivre !</p>
    <div class="shop"></div>`, 'domain-screen');
  wireSound(scr);
  wireNav(scr);
  $('.back', scr).addEventListener('click', () => mapScreen());
  const shop = $('.shop', scr);
  const render = () => {
    shop.innerHTML = SHOP.map((it) => {
      const owned = !!save.owned[it.id];
      const blocked = it.needs && !save.owned[it.needs];
      const afford = save.gold >= it.price;
      return `<div class="shop-item ${owned ? 'owned' : ''}">
        <span class="si-icon">${it.icon}</span>
        <div class="si-txt"><b>${esc(it.name)}</b><small>${esc(blocked ? `Il faut d’abord : ${SHOP.find((x) => x.id === it.needs).name}` : it.desc)}</small></div>
        ${owned ? '<span class="si-done">✔ Construit</span>' : `<button class="btn ${afford && !blocked ? 'primary' : 'ghost'} small buy" data-id="${it.id}" ${afford && !blocked ? '' : 'disabled'}>${COIN} ${it.price}</button>`}
      </div>`;
    }).join('');
    $$('.buy', shop).forEach((b) => b.addEventListener('click', () => {
      const it = SHOP.find((x) => x.id === b.dataset.id);
      if (save.gold < it.price) return;
      addGold(-it.price);
      save.owned[it.id] = true;
      persist();
      sfx.build();
      $('.castle-view', scr).innerHTML = castleSVG({ owned: save.owned, blason: save.hero.blason, freed: save.bosses, hero: save.hero.avatar });
      $('.castle-view', scr).classList.remove('built'); void scr.offsetWidth; $('.castle-view', scr).classList.add('built');
      setTimeout(() => sparkle($('.castle-view', scr), 40), 500);
      toast(`${it.icon} ${it.name} : c’est fait !`);
      updateGold();
      render();
    }));
  };
  render();
}

// ============================================================= GRIMOIRE ===
function grimoireScreen(tab = 'conj') {
  music('map');
  const scr = show(`
    ${hud()}
    <div class="sub-head"><button class="btn ghost small back">← Carte</button><h2 class="h-title">📖 Le Grimoire</h2></div>
    <div class="tabs">${REGIONS.map((r) => `<button class="tab ${r.id === tab ? 'on' : ''}" data-t="${r.id}" style="--rc:${r.color}">${r.mentor.badge} <span>${esc(r.subject)}</span></button>`).join('')}</div>
    <div class="panel parchment grimoire"></div>`, 'grimoire-screen');
  wireSound(scr);
  wireNav(scr);
  $('.back', scr).addEventListener('click', () => mapScreen());
  const book = $('.grimoire', scr);
  const render = (id) => {
    const R = REGION_BY_ID[id];
    $$('.tab', scr).forEach((t) => t.classList.toggle('on', t.dataset.t === id));
    book.innerHTML = `<h3 style="--rc:${R.color}">${esc(R.name)}</h3>
      <ul class="pages">${R.lessons.map((L, i) => {
        const key = `${id}-${i + 1}`;
        const open = !!save.lessons[key];
        const st = save.stats[key];
        const pct = st && st.ok + st.ko ? Math.round((st.ok / (st.ok + st.ko)) * 100) : null;
        return `<li class="${open ? '' : 'locked'}" data-i="${i}">
          <span class="pg-num">${open ? i + 1 : '🔒'}</span>
          <span class="pg-title">${open ? esc(L.title) : 'Page encore scellée'}<small>${open ? `${esc(R.stages[i].title)} ${starsHtml(stageStars(id, i))}` : 'Commence l’épreuve pour la découvrir'}</small></span>
          ${pct !== null ? `<span class="mastery" title="Bonnes réponses"><i style="width:${pct}%"></i><b>${pct}%</b></span>` : ''}
        </li>`;
      }).join('')}</ul>`;
    $$('.pages li', book).forEach((li) => li.addEventListener('click', () => {
      if (li.classList.contains('locked')) { sfx.wrong(); return; }
      lessonScreen(id, Number(li.dataset.i), { fromGrimoire: true });
    }));
  };
  $$('.tab', scr).forEach((t) => t.addEventListener('click', () => { sfx.page(); render(t.dataset.t); }));
  render(tab);
}

// ========================================================= QUÊTE DU JOUR ===
function weakSkills() {
  // Étapes déjà jouées, triées de la moins bien réussie à la mieux réussie.
  const played = [];
  REGIONS.forEach((r) => r.stages.forEach((s, i) => {
    const key = `${r.id}-${i + 1}`;
    const st = save.stats[key];
    if (st && st.ok + st.ko > 0) played.push({ r, i, key, score: st.ok / (st.ok + st.ko) + Math.random() * 0.15 });
  }));
  played.sort((a, b) => a.score - b.score);
  if (played.length < 5) REGIONS.forEach((r) => { if (!played.some((p) => p.r === r)) played.push({ r, i: 0, key: `${r.id}-1`, score: 1 }); });
  return played.slice(0, 5);
}

function dailyScreen() {
  const done = dailyDone();
  const weak = weakSkills();
  const scr = show(`
    ${hud()}
    <div class="sub-head"><button class="btn ghost small back">← Carte</button><h2 class="h-title">☀️ La Quête du jour</h2></div>
    <div class="panel parchment">
      <div class="owl-talk"><span>🦉</span><p>${done
        ? 'Tu as déjà accompli la quête du jour ! Tu peux la refaire pour t’entraîner (sans récompense). Reviens demain pour une nouvelle quête !'
        : `Chaque jour, je prépare une quête sur mesure avec les épreuves où tu peux encore progresser. Récompense : <b>${COIN} 30</b>${save.daily.streak > 0 ? ` + bonus de série` : ''} !`}</p></div>
      <p class="streak">🔥 Série : <b>${save.daily.streak}</b> jour${save.daily.streak > 1 ? 's' : ''} d’affilée</p>
      <ul class="daily-list">${weak.map((w) => `<li><span style="color:${w.r.color}">${w.r.mentor.badge}</span> ${esc(w.r.subject)} — ${esc(w.r.stages[w.i].title)}</li>`).join('')}</ul>
      <div class="row"><button class="btn primary big go">Partir en quête ⚔️</button></div>
    </div>`, 'daily-screen');
  wireSound(scr);
  wireNav(scr);
  $('.back', scr).addEventListener('click', () => mapScreen());
  $('.go', scr).addEventListener('click', () => {
    const questions = shuffle(weak.flatMap((w) => shuffle(w.r.stages[w.i].gen(w.key)).filter((q) => !q.passage).slice(0, 2)));
    runSession({
      head: '<b>Quête du jour</b><small>Les conseils de Plume</small>',
      questions,
      mentor: { emoji: '🦉', name: 'Plume' },
      bg: 'meadow',
      onQuit: () => mapScreen(),
      onEnd: ({ errors, goldWon, bestCombo }) => {
        let bonus = 0;
        if (!done) {
          completeDaily();
          bonus = 30 + Math.min(50, (save.daily.streak - 1) * 5);
          addGold(bonus);
        }
        resultScreen({
          title: done ? 'Entraînement terminé !' : 'Quête du jour accomplie !',
          stars: starsFor(errors), gold: goldWon + bonus, errors, bestCombo, rankUp: null,
          extra: done ? '' : `<p class="unlock-note">🔥 Série de ${save.daily.streak} jour${save.daily.streak > 1 ? 's' : ''} ! Reviens demain pour la continuer.</p>`,
          buttons: [['Retour à la carte', 'primary', () => mapScreen()]],
        });
      },
    });
  });
}

// ============================================================== TOURNOI ===
function tournamentIntro() {
  const scr = show(`
    ${hud()}
    <div class="sub-head"><button class="btn ghost small back">← Carte</button><h2 class="h-title">🏇 Le Grand Tournoi</h2></div>
    <div class="panel parchment">
      <div class="owl-talk"><span>🎺</span><p>Oyez, oyez ! Affronte les chevaliers du royaume dans une joute sans fin. Chaque bonne réponse fait tomber un adversaire, et les questions deviennent de plus en plus difficiles. Trois erreurs, et la joute est finie !</p></div>
      <p class="record">🏆 Ton record : <b>${save.tourBest}</b> adversaire${save.tourBest > 1 ? 's' : ''}</p>
      <div class="row"><button class="btn primary big go">Entrer dans la lice ⚔️</button></div>
    </div>`, 'tour-screen');
  wireSound(scr);
  wireNav(scr);
  $('.back', scr).addEventListener('click', () => mapScreen());
  $('.go', scr).addEventListener('click', tournament);
}

const KNIGHTS = ['Messire Gontran', 'Dame Mahaut', 'le Chevalier Vert', 'Sire Bertrand', 'Dame Ysolde', 'le Baron Noir', 'Sire Lancelin', 'Dame Hersende', 'le Comte Rouge', 'Sire Perceval'];

function tournament() {
  music('battle');
  let score = 0, lives = 3;
  const scr = show(`
    <div class="scene-bg">${sceneSVG('castle')}</div>
    <header class="play-top">
      <button class="icon-btn quit" title="Quitter">✖</button>
      <div class="play-title"><b>Le Grand Tournoi</b><small class="foe"></small></div>
      ${soundBtn()}
    </header>
    <div class="joust">
      <span class="score">🏆 <b>0</b></span>
      <span class="lances"></span>
    </div>
    <div class="q-host"></div>`, 'play-screen tour-play');
  wireSound(scr);
  const host = $('.q-host', scr);
  const upd = () => {
    $('.score b', scr).textContent = score;
    $('.lances', scr).innerHTML = Array.from({ length: 3 }, (_, k) => `<i class="${k < lives ? '' : 'lost'}">🛡️</i>`).join('');
  };
  $('.quit', scr).addEventListener('click', async () => { if (await confirmBox('Quitter le tournoi ?', 'Quitter', 'Rester')) end(); });
  const pickQuestion = () => {
    const level = Math.min(4, Math.floor(score / 4));
    const r = pick(REGIONS);
    const i = Math.max(0, level - (Math.random() < 0.4 ? 1 : 0));
    const qs = r.stages[i].gen(`${r.id}-${i + 1}`).filter((q) => q.kind !== 'sort' || level > 1);
    return pick(qs);
  };
  function next() {
    if (lives <= 0) { end(); return; }
    $('.foe', scr).textContent = `Adversaire : ${pick(KNIGHTS)}`;
    const q = pickQuestion();
    mountQuestion(host, q, {
      mentor: { emoji: '🎺', name: 'Le héraut' },
      onResult(ok, card) {
        recordAnswer(q.skill, ok);
        if (ok) { score++; sfx.hit(); sparkle(card, 20); } else { lives--; sfx.hurt(); shake(card); }
        upd();
        persist();
      },
      onDone: next,
    });
  }
  function end() {
    const record = score > save.tourBest;
    if (record) save.tourBest = score;
    addGold(score);
    persist();
    resultScreen({
      title: record ? 'Nouveau record !' : 'Fin de la joute !',
      stars: score >= 15 ? 3 : score >= 7 ? 2 : score >= 1 ? 1 : 0,
      gold: score, errors: 3 - lives, bestCombo: score, rankUp: null,
      extra: `<p class="unlock-note">🏆 ${score} adversaire${score > 1 ? 's' : ''} renversé${score > 1 ? 's' : ''} · Record : ${save.tourBest}</p>`,
      buttons: [['Nouvelle joute ⚔️', 'primary', () => tournament()], ['Retour à la carte', 'ghost', () => mapScreen()]],
    });
  }
  upd();
  next();
}

// ============================================================ RÉGLAGES ===
function settingsModal() {
  const { el, close } = modal(`
    <div class="settings">
      <div class="set-hero">${blasonSVG(save.hero.blason)}<div><b>${esc(save.hero.avatar)} ${esc(save.hero.name)}</b><small>${esc(rankOf())} · ⭐ ${totalStars()} · ${COIN} ${save.gold}</small></div></div>
      <button class="btn ghost wide" data-a="hero">✏️ Modifier mon héros et mon blason</button>
      <button class="btn ghost wide" data-a="sound">${SOUND_ICON[soundMode()]} ${SOUND_LABEL[soundMode()]}</button>
      <button class="btn ghost wide" data-a="story">📜 Revoir l’histoire</button>
      <button class="btn ghost wide danger" data-a="reset">🗑️ Recommencer l’aventure</button>
      <button class="btn primary wide" data-a="close">Fermer</button>
    </div>`);
  el.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    sfx.click();
    if (a === 'close') close();
    if (a === 'hero') { close(); createScreen(true); }
    if (a === 'sound') { unlockAudio(); const m = cycleSound(); e.target.closest('button').textContent = `${SOUND_ICON[m]} ${SOUND_LABEL[m]}`; $$('.sound-btn').forEach((x) => { x.textContent = SOUND_ICON[m]; }); }
    if (a === 'story') { close(); storyScreen(save.finalWon ? [...STORY_INTRO, ...STORY_END] : STORY_INTRO, () => mapScreen()); }
    if (a === 'reset') {
      close();
      if (await confirmBox('Effacer toute ta progression (étoiles, or, château) ?', 'Effacer', 'Annuler')
        && await confirmBox('Vraiment sûr ? On ne pourra pas revenir en arrière.', 'Oui, tout effacer', 'Non')) {
        resetSave();
        titleScreen();
      }
    }
  });
}

// ============================================================ DÉMARRAGE ===
titleScreen();
