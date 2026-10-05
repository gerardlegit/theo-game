// ============================================================================
// MOTEUR DES ÉPREUVES — affiche une question, quel que soit son type,
// vérifie la réponse et montre la correction.
//
// Types : mcq (QCM), tap (toucher des mots), sort (ranger dans des coffres),
// match (relier des paires), order (remettre dans l'ordre), type (écrire).
// ============================================================================

import { esc, shuffle, h, pick, cap } from './util.js';
import { sfx, speak, canSpeak, stopSpeech } from './audio.js';
import { fill } from './save.js';

const PRAISE = ['Bien joué !', 'Excellent !', 'Magnifique !', 'Touché !', 'Par ma barbe, c’est juste !', 'Bravo, {heros} !', 'Quelle plume !', 'Digne d’un chevalier !', 'Parfait !', 'Splendide !'];
const OOPS = ['Pas tout à fait…', 'Presque !', 'Oups, un piège !', 'Pas cette fois…', 'Le Charabia t’a joué un tour !'];

// ------------------------------------------------------------ renderers ---
function renderMCQ(q, body, setReady, card) {
  let chosen = null;
  const wrap = h('<div class="choices"></div>');
  if (q.choices.some((c) => c.length > 28)) wrap.classList.add('long');
  q.choices.forEach((c, i) => {
    const b = h(`<button type="button" class="choice"><span class="key">${i + 1}</span><span class="txt">${esc(c)}</span></button>`);
    b.addEventListener('click', () => {
      sfx.select();
      wrap.querySelectorAll('.choice').forEach((x) => x.classList.remove('picked'));
      b.classList.add('picked');
      chosen = i;
      setReady(true);
    });
    wrap.appendChild(b);
  });
  body.appendChild(wrap);
  return {
    key(k) { const b = wrap.children[k - 1]; if (b) b.click(); },
    check: () => chosen === q.answer,
    reveal() {
      wrap.querySelectorAll('.choice').forEach((b, i) => {
        b.disabled = true;
        if (i === q.answer) b.classList.add('right');
        else if (i === chosen) b.classList.add('wrong');
      });
      const atStart = /^<span class="blank/.test((q.sentence || '').trim());
      card.querySelectorAll('.blank').forEach((bl, k) => {
        bl.textContent = atStart && k === 0 ? cap(q.choices[q.answer]) : q.choices[q.answer];
        bl.classList.add('filled');
      });
    },
  };
}

function renderTap(q, body, setReady) {
  const picked = new Set();
  const line = h('<div class="tap-line"></div>');
  q.tokens.forEach((tok, i) => {
    const prev = q.tokens[i - 1];
    const glue = i === 0 || /^[.,]$/.test(tok.t) || (prev && /[’']$/.test(prev.t));
    if (!glue) line.appendChild(document.createTextNode(/^[!?;:]$/.test(tok.t) ? ' ' : ' '));
    if (!tok.tap) { line.appendChild(h(`<span class="punct">${esc(tok.t)}</span>`)); return; }
    const b = h(`<button type="button" class="tok">${esc(tok.t)}</button>`);
    b.dataset.i = i;
    b.addEventListener('click', () => {
      sfx.click();
      if (picked.has(i)) { picked.delete(i); b.classList.remove('picked'); } else { picked.add(i); b.classList.add('picked'); }
      setReady(picked.size > 0);
    });
    line.appendChild(b);
  });
  body.appendChild(line);
  return {
    check: () => picked.size === q.targets.length && q.targets.every((i) => picked.has(i)),
    reveal() {
      line.querySelectorAll('.tok').forEach((b) => {
        const i = Number(b.dataset.i);
        b.disabled = true;
        const target = q.targets.includes(i);
        if (target && picked.has(i)) b.classList.add('right');
        else if (target) b.classList.add('missed');
        else if (picked.has(i)) b.classList.add('wrong');
      });
    },
  };
}

function renderSort(q, body, setReady) {
  let sel = null;
  const place = new Map(); // index d'item → id du coffre
  const pool = h('<div class="sort-pool"></div>');
  const bins = h('<div class="sort-bins"></div>');
  const chips = q.items.map((it, i) => {
    const c = h(`<button type="button" class="chip">${esc(it.t)}</button>`);
    c.addEventListener('click', () => {
      sfx.click();
      if (sel === c) { c.classList.remove('sel'); sel = null; return; }
      chips.forEach((x) => x.classList.remove('sel'));
      if (place.has(i)) { // retour dans la réserve
        place.delete(i);
        pool.appendChild(c);
        setReady(false);
        return;
      }
      sel = c; c.classList.add('sel');
    });
    c.dataset.i = i;
    pool.appendChild(c);
    return c;
  });
  q.bins.forEach((b) => {
    const bin = h(`<div class="bin" role="button" tabindex="0"><div class="bin-lid">🧰 ${esc(b.label)}</div><div class="bin-in"></div></div>`);
    const drop = () => {
      if (!sel) return;
      sfx.select();
      const i = Number(sel.dataset.i);
      place.set(i, b.id);
      sel.classList.remove('sel');
      bin.querySelector('.bin-in').appendChild(sel);
      sel = null;
      setReady(place.size === q.items.length);
    };
    bin.addEventListener('click', (e) => { if (!e.target.closest('.chip')) drop(); });
    bin.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop(); } });
    bins.appendChild(bin);
  });
  body.appendChild(h('<p class="hint">Touche un mot, puis le coffre où il doit aller.</p>'));
  body.appendChild(pool);
  body.appendChild(bins);
  return {
    check: () => q.items.every((it, i) => place.get(i) === it.bin),
    reveal() {
      chips.forEach((c, i) => {
        c.disabled = true;
        const ok = place.get(i) === q.items[i].bin;
        c.classList.add(ok ? 'right' : 'wrong');
        if (!ok) c.title = q.bins.find((b) => b.id === q.items[i].bin).label;
        if (!ok) c.insertAdjacentHTML('beforeend', ` <small>→ ${esc(q.bins.find((b) => b.id === q.items[i].bin).label)}</small>`);
      });
    },
  };
}

function renderMatch(q, body, setReady) {
  const lefts = q.pairs.map(([a]) => a);
  const rights = shuffle(q.pairs.map(([, b]) => b));
  const link = new Map(); // gauche → droite
  let selL = null;
  const COLORS = ['c1', 'c2', 'c3', 'c4', 'c5'];
  const grid = h('<div class="match-grid"><div class="col L"></div><div class="col R"></div></div>');
  const colL = grid.querySelector('.L');
  const colR = grid.querySelector('.R');
  const bL = lefts.map((t, i) => {
    const b = h(`<button type="button" class="mitem">${esc(t)}</button>`);
    b.addEventListener('click', () => {
      sfx.click();
      if (link.has(i)) { unlink(i); return; }
      bL.forEach((x) => x.classList.remove('sel'));
      selL = i; b.classList.add('sel');
    });
    colL.appendChild(b);
    return b;
  });
  const bR = rights.map((t, j) => {
    const b = h(`<button type="button" class="mitem">${esc(t)}</button>`);
    b.addEventListener('click', () => {
      const owner = [...link.entries()].find(([, r]) => r === j);
      if (owner) { sfx.click(); unlink(owner[0]); return; }
      if (selL === null) return;
      sfx.select();
      link.set(selL, j);
      paint();
      bL[selL].classList.remove('sel');
      selL = null;
      setReady(link.size === lefts.length);
    });
    colR.appendChild(b);
    return b;
  });
  function unlink(i) { link.delete(i); paint(); setReady(false); }
  function paint() {
    [...bL, ...bR].forEach((b) => COLORS.forEach((c) => b.classList.remove(c)));
    [...link.entries()].forEach(([i, j], k) => {
      const c = COLORS[i % COLORS.length];
      bL[i].classList.add(c); bR[j].classList.add(c);
      bL[i].dataset.k = k;
    });
  }
  body.appendChild(h('<p class="hint">Touche un mot à gauche, puis son partenaire à droite.</p>'));
  body.appendChild(grid);
  return {
    check: () => lefts.every((a, i) => link.has(i) && rights[link.get(i)] === q.pairs[i][1]),
    reveal() {
      lefts.forEach((a, i) => {
        const ok = link.has(i) && rights[link.get(i)] === q.pairs[i][1];
        bL[i].classList.add(ok ? 'right' : 'wrong');
        if (link.has(i)) bR[link.get(i)].classList.add(ok ? 'right' : 'wrong');
      });
      [...bL, ...bR].forEach((b) => { b.disabled = true; });
    },
  };
}

function renderOrder(q, body, setReady) {
  let order = shuffle(q.pieces.map((_, i) => i));
  for (let k = 0; k < 5 && order.every((v, i) => v === i); k++) order = shuffle(order);
  const line = h(`<div class="order-line ${q.vertical ? 'vertical' : ''}"></div>`);
  const pool = h(`<div class="order-pool ${q.vertical ? 'vertical' : ''}"></div>`);
  const placed = [];
  const update = () => {
    line.classList.toggle('empty', placed.length === 0);
    [...line.children].forEach((c, n) => { const num = c.querySelector('.num'); if (num) num.textContent = n + 1; });
    setReady(placed.length === q.pieces.length);
  };
  order.forEach((i) => {
    const c = h(`<button type="button" class="chip piece">${q.vertical ? '<span class="num"></span>' : ''}<span>${esc(q.pieces[i])}</span></button>`);
    c.addEventListener('click', () => {
      sfx.click();
      const at = placed.indexOf(i);
      if (at >= 0) { placed.splice(at, 1); pool.appendChild(c); } else { placed.push(i); line.appendChild(c); }
      update();
    });
    pool.appendChild(c);
  });
  body.appendChild(h(`<p class="hint">${q.vertical ? 'Touche les étapes dans l’ordre, de la première à la dernière.' : 'Touche les mots dans l’ordre.'}</p>`));
  body.appendChild(line);
  body.appendChild(pool);
  update();
  return {
    check: () => placed.map((i) => q.pieces[i]).join('|') === q.pieces.join('|'),
    reveal(ok) {
      [...line.children].forEach((c, n) => {
        c.disabled = true;
        c.classList.add(q.pieces[placed[n]] === q.pieces[n] ? 'right' : 'wrong');
      });
      if (!ok) {
        const sol = q.vertical
          ? `<ol class="solution">${q.pieces.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`
          : `<p class="solution">✔ ${esc(q.pieces.join(' '))}${esc(q.end || '')}</p>`;
        body.appendChild(h(`<div>${sol}</div>`));
      }
    },
  };
}

const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'û', 'ù', '’'];
const norm = (s) => s.toLowerCase().replace(/'/g, '’').replace(/[.!?]+$/, '').replace(/\s+/g, ' ').trim();

function renderType(q, body, setReady, card) {
  const box = h(`<div class="type-box">
    <input type="text" class="type-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Écris ta réponse ici">
    <div class="accents">${ACCENTS.map((a) => `<button type="button" class="acc">${a}</button>`).join('')}</div></div>`);
  const input = box.querySelector('input');
  input.addEventListener('input', () => setReady(input.value.trim().length > 0));
  box.querySelectorAll('.acc').forEach((b) => b.addEventListener('click', () => {
    const s = input.selectionStart ?? input.value.length;
    const e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + b.textContent + input.value.slice(e);
    input.focus();
    input.setSelectionRange(s + 1, s + 1);
    setReady(true);
  }));
  body.appendChild(box);
  setTimeout(() => input.focus({ preventScroll: true }), 50);
  return {
    input,
    check: () => q.answers.some((a) => norm(a) === norm(input.value)),
    reveal(ok) {
      input.disabled = true;
      box.querySelectorAll('.acc').forEach((b) => { b.disabled = true; });
      input.classList.add(ok ? 'right' : 'wrong');
      card.querySelectorAll('.blank').forEach((bl) => { bl.textContent = q.answers[0]; bl.classList.add('filled'); });
      if (!ok) body.appendChild(h(`<p class="solution">✔ ${esc(q.display)}</p>`));
    },
  };
}

const RENDER = { mcq: renderMCQ, tap: renderTap, sort: renderSort, match: renderMatch, order: renderOrder, type: renderType };

// --------------------------------------------------------------- carte ---
/**
 * Affiche une question dans `host`.
 * opts.mentor : { emoji, name } qui commente la correction
 * opts.onResult(ok) : appelé dès la validation (animations de combat…)
 * opts.onDone(ok) : appelé quand le joueur clique sur « Continuer »
 */
export function mountQuestion(host, q, opts = {}) {
  host.innerHTML = '';
  const card = h(`<div class="qcard">
    ${q.passage ? `<details class="passage" open><summary>📜 ${esc(q.passage.title)}</summary><div class="passage-text">${esc(q.passage.text)}</div></details>` : ''}
    <div class="q-head"><p class="q-prompt">${q.prompt}</p>${canSpeak() ? '<button type="button" class="speak-btn" title="Écouter">🔊</button>' : ''}</div>
    ${q.sentence ? `<p class="q-sentence">${q.sentence}</p>` : ''}
    <div class="q-body"></div>
    <div class="q-actions"><button type="button" class="btn primary validate" disabled>Valider ⚔️</button></div>
    <div class="q-feedback" hidden></div>
  </div>`);
  host.appendChild(card);
  const body = card.querySelector('.q-body');
  const validate = card.querySelector('.validate');
  const feedback = card.querySelector('.q-feedback');
  let ready = false;
  let done = false;
  const setReady = (v) => { ready = v; validate.disabled = !v; };
  const r = RENDER[q.kind](q, body, setReady, card);

  const speakBtn = card.querySelector('.speak-btn');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      const parts = [];
      if (q.passage) parts.push(q.passage.text);
      parts.push(q.prompt);
      if (q.speak) parts.push(q.speak);
      else if (q.sentence) parts.push(q.sentence);
      if (q.kind === 'mcq' && q.choices) parts.push(q.choices.join(' ; '));
      speak(parts.join('. '));
    });
  }

  function onValidate() {
    if (!ready || done) return;
    done = true;
    stopSpeech();
    const ok = r.check();
    r.reveal(ok);
    validate.parentElement.hidden = true;
    if (ok) sfx.correct(); else sfx.wrong();
    card.classList.add(ok ? 'is-right' : 'is-wrong');
    opts.onResult?.(ok, card);
    const m = opts.mentor;
    feedback.innerHTML = `
      <div class="fb-row">
        ${m ? `<div class="fb-mentor" title="${esc(m.name)}">${m.emoji}</div>` : ''}
        <div class="fb-text">
          <p class="fb-title">${ok ? '✨ ' + esc(fill(pick(PRAISE))) : '💡 ' + esc(pick(OOPS))}</p>
          <p class="fb-explain">${q.explain || ''}</p>
        </div>
      </div>
      <button type="button" class="btn primary continue">${esc(opts.continueLabel || 'Continuer ➜')}</button>`;
    feedback.hidden = false;
    feedback.className = `q-feedback ${ok ? 'good' : 'bad'}`;
    const cont = feedback.querySelector('.continue');
    cont.addEventListener('click', () => { cleanup(); opts.onDone?.(ok); });
    setTimeout(() => {
      cont.focus({ preventScroll: true });
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  }
  validate.addEventListener('click', onValidate);

  function onKey(e) {
    if (!card.isConnected) { cleanup(); return; }
    if (e.target.closest && e.target.closest('input') && e.key !== 'Enter') return;
    if (e.key === 'Enter') {
      if (!done) { e.preventDefault(); onValidate(); } else if (document.activeElement?.classList?.contains('continue') === false) {
        e.preventDefault(); feedback.querySelector('.continue')?.click();
      }
    } else if (!done && r.key && /^[1-9]$/.test(e.key)) r.key(Number(e.key));
  }
  function cleanup() { document.removeEventListener('keydown', onKey); }
  document.addEventListener('keydown', onKey);
  return { card };
}
