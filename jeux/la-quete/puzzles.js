// ============================================================================
// ÉNIGMES DE LA QUÊTE — six familles, trois niveaux de difficulté chacune.
//
// makePuzzle(type, niveau) renvoie :
//   { title, question, visual (HTML), choices: [{ html, correct }],
//     layout ('grid' | 'list' | 'row'), explain (HTML), reveal?(el) }
//
// Toutes les énigmes sont générées au hasard, puis vérifiées : il y a
// toujours une seule bonne réponse parmi les choix proposés.
// ============================================================================

import { arrowIcon, rotIcon, gearPath, symbolIcon, droneIcon, keyIcon, doorIcon, racerIcon } from './art.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 choix numériques : la réponse + des pièges plausibles, tous différents et positifs. */
function numberChoices(answer, traps) {
  const out = [answer];
  for (const v of shuffle(traps)) {
    if (out.length >= 4) break;
    if (Number.isInteger(v) && v > 0 && !out.includes(v)) out.push(v);
  }
  for (let k = 1; out.length < 4; k++) {
    for (const v of [answer + k, answer - k]) if (out.length < 4 && v > 0 && !out.includes(v)) out.push(v);
  }
  return shuffle(out).map((v) => ({ html: `<span class="big-num">${v}</span>`, correct: v === answer }));
}

const ORD = ['1er', '2e', '3e', '4e', '5e', '6e', '7e', '8e'];

/* ==========================================================================
   1. SUITES LOGIQUES — BOULON-3
   ========================================================================== */

function seqVisual(items) {
  return `<div class="seq">${items.map((t, i) => `<span class="seq-cell" style="--i:${i}">${t}</span>`).join('')}<span class="seq-cell q" style="--i:${items.length}">?</span></div>`;
}

const ARROW_COLORS = [['#35F2FF', 'bleu'], ['#FF4FD8', 'rose'], ['#FFD23F', 'jaune']];
const norm = (a) => ((a % 360) + 360) % 360;

function genSequence(level) {
  const kinds = {
    1: ['add', 'add', 'sub', 'arrows'],
    2: ['mul', 'alt', 'grow', 'arrowsColor'],
    3: ['fib', 'square', 'interleave', 'altMul', 'double'],
  }[level];
  const kind = pick(kinds);
  const base = { type: 'sequence', title: 'Suite logique', question: 'Quel nombre vient ensuite ?', layout: 'grid' };

  if (kind === 'arrows') {
    const start = pick([0, 90, 180, 270]), step = pick([90, -90]);
    const items = [0, 1, 2, 3].map((i) => arrowIcon(norm(start + i * step)));
    const ans = norm(start + 4 * step);
    return {
      ...base, question: 'Quelle flèche vient ensuite ?', visual: seqVisual(items),
      choices: shuffle([0, 90, 180, 270]).map((a) => ({ html: arrowIcon(a), correct: a === ans })),
      explain: `La flèche tourne d'un quart de tour ${step > 0 ? "dans le sens des aiguilles d'une montre" : "dans le sens inverse des aiguilles d'une montre"} à chaque fois.`,
    };
  }
  if (kind === 'arrowsColor') {
    const start = pick([0, 45, 90, 135, 180, 225, 270, 315]), step = pick([45, -45]);
    const items = [0, 1, 2, 3, 4].map((i) => arrowIcon(norm(start + i * step), ARROW_COLORS[i % 3][0]));
    const ans = norm(start + 5 * step), col = ARROW_COLORS[5 % 3][0];
    const wrongA = norm(ans + pick([90, 180, -90])), wrongC = ARROW_COLORS[pick([0, 1])][0];
    const opts = [[ans, col, true], [ans, wrongC, false], [wrongA, col, false], [norm(ans + 45 * (step > 0 ? -1 : 1)), wrongC, false]];
    return {
      ...base, question: 'Quelle flèche vient ensuite ? Attention à la couleur !', visual: seqVisual(items),
      choices: shuffle(opts).map(([a, c, ok]) => ({ html: arrowIcon(a, c), correct: ok })),
      explain: `La flèche tourne d'un huitième de tour à chaque fois, et les couleurs se répètent : bleu, rose, jaune… La prochaine est donc jaune.`,
    };
  }

  let terms, ans, traps, explain;
  switch (kind) {
    case 'add': {
      const a = ri(1, 20), d = ri(2, 9);
      terms = [0, 1, 2, 3, 4].map((i) => a + i * d); ans = a + 5 * d;
      traps = [ans + d, ans - 1, ans + 1, ans + 2, ans - 2];
      explain = `On ajoute <b>${d}</b> à chaque fois : ${terms[4]} + ${d} = <b>${ans}</b>.`;
      break;
    }
    case 'sub': {
      const a = ri(60, 99), d = ri(3, 9);
      terms = [0, 1, 2, 3, 4].map((i) => a - i * d); ans = a - 5 * d;
      traps = [ans - d, ans + 1, ans - 1, ans + 2, terms[4] + d];
      explain = `On enlève <b>${d}</b> à chaque fois : ${terms[4]} − ${d} = <b>${ans}</b>.`;
      break;
    }
    case 'mul': {
      const r = pick([2, 2, 3]);
      const a = r === 2 ? pick([1, 2, 3, 5]) : pick([1, 2]);
      const n = r === 2 ? 5 : 4;
      terms = Array.from({ length: n }, (_, i) => a * r ** i); ans = a * r ** n;
      const last = terms[n - 1];
      traps = [last + (last - terms[n - 2]), ans + r, ans - r, ans + 10, ans - 10];
      explain = `Chaque nombre est multiplié par <b>${r}</b> : ${last} × ${r} = <b>${ans}</b>.`;
      break;
    }
    case 'alt': {
      const a = ri(2, 15), p = ri(4, 9), m = ri(1, p - 1);
      terms = [a];
      for (let i = 1; i < 6; i++) terms.push(i % 2 ? terms[i - 1] + p : terms[i - 1] - m);
      ans = terms[5] - m;
      traps = [terms[5] + p, ans + 1, ans - 1, terms[5] + p - m];
      explain = `On ajoute <b>${p}</b>, puis on enlève <b>${m}</b>, et on recommence : ${terms[5]} − ${m} = <b>${ans}</b>.`;
      break;
    }
    case 'grow': {
      const s = ri(1, 10), k = ri(1, 3);
      terms = [s];
      for (let i = 0; i < 4; i++) terms.push(terms[i] + k + i);
      ans = terms[4] + k + 4;
      traps = [terms[4] + k + 3, terms[4] + k + 5, ans + 2, ans - 2];
      explain = `L'écart grandit de 1 à chaque fois : +${k}, +${k + 1}, +${k + 2}, +${k + 3}… puis <b>+${k + 4}</b> : ${terms[4]} + ${k + 4} = <b>${ans}</b>.`;
      break;
    }
    case 'fib': {
      const a = ri(1, 4), b = ri(1, 6);
      terms = [a, b];
      for (let i = 2; i < 6; i++) terms.push(terms[i - 1] + terms[i - 2]);
      ans = terms[4] + terms[5];
      traps = [terms[5] + (terms[5] - terms[4]), ans + 1, ans - 1, terms[5] * 2];
      explain = `Chaque nombre est la somme des deux précédents : ${terms[4]} + ${terms[5]} = <b>${ans}</b>.`;
      break;
    }
    case 'square': {
      const n0 = ri(1, 4);
      terms = [0, 1, 2, 3, 4].map((i) => (n0 + i) ** 2); ans = (n0 + 5) ** 2;
      const diff = terms[4] - terms[3];
      traps = [terms[4] + diff, terms[4] + diff + 1, ans + 1, ans - 1];
      explain = `Ce sont des nombres multipliés par eux-mêmes : ${n0}×${n0}, ${n0 + 1}×${n0 + 1}… donc ${n0 + 5}×${n0 + 5} = <b>${ans}</b>.`;
      break;
    }
    case 'interleave': {
      const a0 = ri(1, 5), sa = ri(1, 3), b0 = ri(24, 40), sb = ri(2, 5);
      const A = [0, 1, 2, 3, 4].map((i) => a0 + i * sa), B = [0, 1, 2, 3].map((i) => b0 - i * sb);
      terms = [A[0], B[0], A[1], B[1], A[2], B[2], A[3]];
      ans = B[3];
      traps = [A[4], B[2] - 1, ans - 1, ans + 1, ans - sb];
      explain = `Deux suites sont mélangées ! Une qui monte : ${A.slice(0, 4).join(', ')}… et une qui descend de ${sb} : ${B.slice(0, 3).join(', ')}, <b>${ans}</b>.`;
      break;
    }
    case 'altMul': {
      const a = ri(1, 4), k = ri(1, 5);
      terms = [a];
      for (let i = 1; i < 6; i++) terms.push(i % 2 ? terms[i - 1] * 2 : terms[i - 1] + k);
      ans = terms[5] + k;
      traps = [terms[5] * 2, ans + 1, ans - 1, terms[5] + 2 * k];
      explain = `On multiplie par 2, puis on ajoute ${k}, et on recommence : ${terms[5]} + ${k} = <b>${ans}</b>.`;
      break;
    }
    case 'double': {
      const s = ri(1, 9);
      terms = [s, s + 1, s + 3, s + 7, s + 15]; ans = s + 31;
      traps = [terms[4] + 9, terms[4] + 15, terms[4] + 17, terms[4] + 32];
      explain = `L'écart double à chaque fois : +1, +2, +4, +8… puis <b>+16</b> : ${terms[4]} + 16 = <b>${ans}</b>.`;
      break;
    }
  }
  return { ...base, visual: seqVisual(terms.map((t) => `<b>${t}</b>`)), choices: numberChoices(ans, traps), explain };
}

/* ==========================================================================
   2. ENGRENAGES — ENGRENOX
   Des machines entières : roues qui se ramifient, courroies droites ou
   croisées, boucles (qui tournent ou se bloquent), roues piège reliées à rien.
   ========================================================================== */

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const GAP = 2;        // les dents s'emboîtent légèrement
const TOOTH = 6;      // hauteur des dents
const PITCH = 12;     // écart entre deux dents : le rayon dépend du nombre de dents
const CLEAR = 18;     // espace minimum entre deux roues qui ne se touchent pas
const HUB = 0.55;     // taille d'une poulie de courroie, par rapport à sa roue
const TEETH = [10, 12, 15, 16, 18, 20, 24, 30, 36];
const radiusOf = (t) => (t * PITCH) / (2 * Math.PI);
const deg = (d) => (d * Math.PI) / 180;

function distSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Une nouvelle roue a-t-elle de la place (sans toucher les roues, les courroies ni la flèche du moteur) ? */
function roomFor(sys, g, ignore = []) {
  if (!sys.gears.every((o, k) => ignore.includes(k) || dist(o, g) >= o.r + g.r + 2 * TOOTH + CLEAR)) return false;
  const m = sys.gears[0], R = m.r + TOOTH + 9;
  for (const a of [-150, -90, -30]) {
    const p = { x: m.x + Math.cos(deg(a)) * R, y: m.y + Math.sin(deg(a)) * R };
    if (dist(p, g) < g.r + TOOTH + 12) return false;
  }
  return sys.links.every((l) => l.type === 'mesh'
    || distSeg(g, sys.gears[l.a], sys.gears[l.b]) > g.r + TOOTH + HUB * Math.max(sys.gears[l.a].r, sys.gears[l.b].r) + 10);
}

const degree = (sys, i) => sys.links.filter((l) => l.a === i || l.b === i).length;

function addMesh(sys, parent, teeth, angle) {
  const p = sys.gears[parent], r = radiusOf(teeth), d = p.r + r + GAP;
  const g = { x: p.x + Math.cos(angle) * d, y: p.y + Math.sin(angle) * d, r, teeth };
  if (!roomFor(sys, g, [parent])) return -1;
  sys.gears.push(g);
  sys.links.push({ a: parent, b: sys.gears.length - 1, type: 'mesh' });
  return sys.gears.length - 1;
}

function addBelt(sys, parent, teeth, angle, crossed) {
  const p = sys.gears[parent], r = radiusOf(teeth), d = p.r + r + 2 * TOOTH + ri(55, 95);
  const g = { x: p.x + Math.cos(angle) * d, y: p.y + Math.sin(angle) * d, r, teeth };
  if (!roomFor(sys, g)) return -1;
  // Le trajet de la courroie ne doit passer sur aucune autre roue.
  const clear = sys.gears.every((o, k) => k === parent || distSeg(o, p, g) > o.r + TOOTH + HUB * Math.max(p.r, r) + 10);
  if (!clear) return -1;
  sys.gears.push(g);
  sys.links.push({ a: parent, b: sys.gears.length - 1, type: crossed ? 'cross' : 'belt' });
  return sys.gears.length - 1;
}

/** Une roue qui touche deux roues à la fois : ça ferme une boucle, qui bloque tout (jam) ou non. */
function addBridge(sys, jam) {
  const n = sys.gears.length;
  const { dir } = solveSystem(sys, 1);
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    // La nouvelle roue tourne à l'inverse de ses deux voisines : possible seulement si elles tournent pareil.
    // (Deux roues déjà en contact + la nouvelle = un triangle, le blocage classique.)
    if ((dir[i] !== dir[j]) === jam) pairs.push([i, j]);
  }
  for (const [i, j] of shuffle(pairs)) {
    for (const teeth of shuffle(TEETH.slice(0, 7))) {
      const A = sys.gears[i], B = sys.gears[j], r = radiusOf(teeth);
      const ra = A.r + r + GAP, rb = B.r + r + GAP, d = dist(A, B);
      if (d > ra + rb - 4 || d < Math.abs(ra - rb)) continue;
      const aa = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - aa * aa));
      const mx = A.x + (aa * (B.x - A.x)) / d, my = A.y + (aa * (B.y - A.y)) / d;
      for (const s of shuffle([1, -1])) {
        const g = { x: mx + (s * h * (B.y - A.y)) / d, y: my - (s * h * (B.x - A.x)) / d, r, teeth };
        if (roomFor(sys, g, [i, j])) {
          sys.gears.push(g);
          const k = sys.gears.length - 1;
          sys.links.push({ a: i, b: k, type: 'mesh' }, { a: j, b: k, type: 'mesh' });
          return k;
        }
      }
    }
  }
  return -1;
}

/** Une roue piège : tout près d'une autre, mais sans la toucher. */
function addDecoy(sys) {
  for (const o of shuffle([...sys.gears.keys()].slice(1))) {
    for (let t = 0; t < 14; t++) {
      const O = sys.gears[o], teeth = pick(TEETH.slice(1, 7)), r = radiusOf(teeth);
      const a = Math.random() * Math.PI * 2, d = O.r + r + 2 * TOOTH + ri(11, 14);
      const g = { x: O.x + Math.cos(a) * d, y: O.y + Math.sin(a) * d, r, teeth };
      if (roomFor(sys, g, [o])) { sys.gears.push(g); return sys.gears.length - 1; }
    }
  }
  return -1;
}

function buildSystem({ meshes, belts, bridge, decoy, motorTeeth }) {
  const sys = { gears: [{ x: 0, y: 0, teeth: motorTeeth, r: radiusOf(motorTeeth) }], links: [], bridge: -1, decoy: -1 };
  const perPart = Math.ceil(meshes / (belts + 1));
  let from = 0, made = 0;
  for (let part = 0; part <= belts; part++) {
    let need = Math.min(perPart, meshes - made), tries = 0;
    while (need > 0 && tries++ < 300) {
      const cands = [...sys.gears.keys()].filter((k) => k >= from && degree(sys, k) < 3);
      if (!cands.length) return null;
      const parent = pick(cands.slice(-3));
      const angle = Math.random() < 0.75 ? deg(ri(-75, 75)) : Math.random() * Math.PI * 2;
      if (addMesh(sys, parent, pick(TEETH), angle) >= 0) { need--; made++; }
    }
    if (need > 0) return null;
    if (part < belts) {
      let k = -1;
      for (let t = 0; t < 80 && k < 0; t++) {
        const cands = [...sys.gears.keys()].filter((c) => c >= from && degree(sys, c) < 3);
        k = addBelt(sys, pick(cands.slice(-2)), pick(TEETH.slice(2)), deg(ri(-40, 40)), Math.random() < 0.5);
      }
      if (k < 0) return null;
      from = k;
    }
  }
  if (bridge && (sys.bridge = addBridge(sys, bridge === 'jam')) < 0) return null;
  if (decoy && (sys.decoy = addDecoy(sys)) < 0) return null;
  const xs = sys.gears.flatMap((g) => [g.x - g.r, g.x + g.r]), ys = sys.gears.flatMap((g) => [g.y - g.r, g.y + g.r]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  if (w / h < 0.9 || w / h > 3.4) return null;
  return sys;
}

/** Sens de chaque roue (1 horaire, -1 inverse, 0 immobile), chemin depuis le moteur, et blocage éventuel. */
function solveSystem(sys, motorDir) {
  const n = sys.gears.length;
  const dir = new Array(n).fill(0), par = new Array(n).fill(-1), via = new Array(n).fill(null), depth = new Array(n).fill(0);
  dir[0] = motorDir;
  const queue = [0];
  let conflict = null;
  while (queue.length) {
    const i = queue.shift();
    for (const l of sys.links) {
      const j = l.a === i ? l.b : l.b === i ? l.a : -1;
      if (j < 0) continue;
      const want = l.type === 'belt' ? dir[i] : -dir[i];
      if (dir[j] === 0) { dir[j] = want; par[j] = i; via[j] = l.type; depth[j] = depth[i] + 1; queue.push(j); }
      else if (dir[j] !== want && !conflict) conflict = [i, j];
    }
  }
  let loop = [];
  if (conflict) {
    const up = (k) => { const p = []; for (; k >= 0; k = par[k]) p.push(k); return p; };
    const pa = up(conflict[0]), pb = up(conflict[1]);
    const lca = pa.find((k) => pb.includes(k));
    loop = [...pa.slice(0, pa.indexOf(lca) + 1), ...pb.slice(0, pb.indexOf(lca))];
  }
  return { dir, par, via, depth, jam: !!conflict, loop };
}

function motorArrow(r, cw) {
  const R = r + TOOTH + 9;
  const a0 = deg(-150), a1 = deg(-30);
  const [sx, sy] = cw ? [Math.cos(a0) * R, Math.sin(a0) * R] : [Math.cos(a1) * R, Math.sin(a1) * R];
  const [ex, ey] = cw ? [Math.cos(a1) * R, Math.sin(a1) * R] : [Math.cos(a0) * R, Math.sin(a0) * R];
  const ea = cw ? a1 : a0;
  const t = cw ? [-Math.sin(ea), Math.cos(ea)] : [Math.sin(ea), -Math.cos(ea)];
  const n = [-t[1], t[0]];
  const tip = [ex + t[0] * 9, ey + t[1] * 9];
  const b1 = [ex + n[0] * 7, ey + n[1] * 7], b2 = [ex - n[0] * 7, ey - n[1] * 7];
  const arc = `M${sx.toFixed(1)} ${sy.toFixed(1)} A${R} ${R} 0 0 ${cw ? 1 : 0} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  const head = `${tip.map((v) => v.toFixed(1)).join(',')} ${b1.map((v) => v.toFixed(1)).join(',')} ${b2.map((v) => v.toFixed(1)).join(',')}`;
  return `<path d="${arc}" fill="none" stroke="#0A0F1C" stroke-width="10" stroke-linecap="round"/>
    <polygon points="${head}" fill="#0A0F1C" stroke="#0A0F1C" stroke-width="5" stroke-linejoin="round"/>
    <path d="${arc}" fill="none" stroke="#FF4FD8" stroke-width="5" stroke-linecap="round"/>
    <polygon points="${head}" fill="#FF4FD8"/>`;
}

/** Courroie entre deux poulies : tangentes extérieures (droite) ou intérieures (croisée). */
function beltSVG(A, B, crossed) {
  const ra = A.r * HUB, rb = B.r * HUB;
  const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
  const al = Math.acos((crossed ? ra + rb : ra - rb) / d);
  const lines = [1, -1].map((s) => {
    const a = th + s * al, k = crossed ? -1 : 1;
    return `M${(A.x + ra * Math.cos(a)).toFixed(1)} ${(A.y + ra * Math.sin(a)).toFixed(1)} L${(B.x + k * rb * Math.cos(a)).toFixed(1)} ${(B.y + k * rb * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  const pulley = (g, r) => `<circle cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="${r.toFixed(1)}" class="pulley"/>`;
  return `<g class="belt ${crossed ? 'crossed' : ''}">${pulley(A, ra)}${pulley(B, rb)}<path d="${lines}" class="belt-out"/><path d="${lines}" class="belt-in"/></g>`;
}

let gearUid = 0;
function systemSVG(sys, sol, motorDir, { target = -1, letters = {}, teeth = false } = {}) {
  const id = `gz${++gearUid}`;
  const pad = 46;
  const minX = Math.min(...sys.gears.map((g) => g.x - g.r)) - pad, maxX = Math.max(...sys.gears.map((g) => g.x + g.r)) + pad;
  const minY = Math.min(...sys.gears.map((g) => g.y - g.r)) - pad - 14, maxY = Math.max(...sys.gears.map((g) => g.y + g.r)) + pad;
  const s = Math.max(1, Math.max(maxX - minX, maxY - minY) / 520);
  const loop = new Set(sol.loop);
  const items = sys.gears.map((g, i) => {
    const fill = i === 0 ? `url(#${id}m)` : i === target ? `url(#${id}t)` : `url(#${id}s)`;
    const cls = sol.jam ? (loop.has(i) ? 'jam-part' : '') : sol.dir[i] > 0 ? 'cw' : sol.dir[i] < 0 ? 'ccw' : 'still';
    return `<g transform="translate(${g.x.toFixed(1)} ${g.y.toFixed(1)})">
      <g class="gear ${cls}" style="animation-duration:${(g.r / 10).toFixed(2)}s">
        <circle r="${g.r + TOOTH + 1}" fill="none"/>
        <path d="${gearPath(g.r, g.teeth, TOOTH)}" fill="${fill}" stroke="#0A0F1C" stroke-width="2.2" stroke-linejoin="round"/>
        <circle r="${(g.r * 0.7).toFixed(1)}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/>
        <circle r="${(g.r * 0.2).toFixed(1)}" fill="#0A0F1C"/>
        <circle cy="${(-g.r * 0.7).toFixed(1)}" r="3" fill="rgba(255,255,255,.6)"/>
      </g>
    </g>`;
  }).join('');
  const belts = sys.links.filter((l) => l.type !== 'mesh').map((l) => beltSVG(sys.gears[l.a], sys.gears[l.b], l.type === 'cross')).join('');
  const at = (g, inner) => `<g transform="translate(${g.x.toFixed(1)} ${g.y.toFixed(1)})">${inner}</g>`;
  let labels = at(sys.gears[0], `${motorArrow(sys.gears[0].r, motorDir > 0)}${teeth ? '' : `<text class="gear-label" y="${7 * s}" style="font-size:${20 * s}px">⚡</text>`}`);
  sys.gears.forEach((g, i) => {
    const big = Math.min(26 * s, g.r * 1.1);
    if (teeth) {
      const fs = Math.min(16 * s, g.r * 0.8);
      if (i === target) {
        labels += at(g, `<text class="gear-label star" y="${(-g.r * 0.08).toFixed(1)}" style="font-size:${(fs * 0.95).toFixed(1)}px">★</text>
          <text class="gear-label teeth" y="${(g.r * 0.62).toFixed(1)}" style="font-size:${(fs * 0.85).toFixed(1)}px">${g.teeth}</text>`);
      } else {
        labels += at(g, `<text class="gear-label teeth ${i === 0 ? 'motor' : ''}" y="${(fs * 0.36).toFixed(1)}" style="font-size:${fs.toFixed(1)}px">${g.teeth}</text>`);
      }
    } else if (i === target) {
      labels += at(g, `<text class="gear-label star" y="${(big * 0.36).toFixed(1)}" style="font-size:${big.toFixed(1)}px">★</text>`);
    } else if (letters[i]) {
      labels += at(g, `<text class="gear-label letter" y="${(big * 0.36).toFixed(1)}" style="font-size:${big.toFixed(1)}px">${letters[i]}</text>`);
    }
  });
  const hasBelt = sys.links.some((l) => l.type !== 'mesh');
  const legend = hasBelt ? `<div class="gear-legend"><span><i class="lg-belt"></i>Courroie droite : même sens</span><span><i class="lg-belt crossed"></i>Courroie croisée : sens inverse</span></div>` : '';
  return `${legend}<svg class="gears" viewBox="${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}" aria-label="Une machine à engrenages">
    <defs>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D3DE"/><stop offset="1" stop-color="#5F6B7A"/></linearGradient>
      <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9BE8"/><stop offset="1" stop-color="#9B2CC4"/></linearGradient>
      <linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE58A"/><stop offset="1" stop-color="#D9901A"/></linearGradient>
    </defs>${items}${belts}${labels}</svg>`;
}

const ARROW = (d) => (d > 0 ? '↻' : '↺');
const LINK_TXT = { mesh: '→', belt: '═', cross: '✕' };
const RULES = '<span class="rules">(→ roues qui se touchent : sens inverse · ═ courroie droite : même sens · ✕ courroie croisée : sens inverse)</span>';

/** « ⚡↻ → ↺ ═ ↺ ✕ ↻ » : le chemin du mouvement, du moteur jusqu'à la roue k. */
function pathText(sol, k) {
  const chain = [];
  for (let i = k; i >= 0; i = sol.par[i]) chain.unshift(i);
  return chain.map((i, n) => `${n === 0 ? '⚡' : ` ${LINK_TXT[sol.via[i]]} `}${ARROW(sol.dir[i])}`).join('');
}

const DIR_NAME = { 1: "dans le sens des aiguilles d'une montre", '-1': 'dans le sens inverse des aiguilles' };
const JAM_TXT = "Regarde la boucle de roues en rouge : en faisant le tour, chaque roue doit tourner à l'inverse de sa voisine… et on revient au départ avec le mauvais sens (la boucle a un nombre impair de roues). Impossible : <b>tout se bloque</b> !";

function gearChoices(ans) {
  return [
    { html: `${rotIcon(true)}<span>Sens des aiguilles d'une montre</span>`, correct: ans === 'cw' },
    { html: `${rotIcon(false)}<span>Sens inverse des aiguilles</span>`, correct: ans === 'ccw' },
    { html: `<span class="ic-jam">⛔</span><span>Tout se bloque !</span>`, correct: ans === 'jam' },
    { html: `<span class="ic-jam">💤</span><span>Elle n'est reliée à rien</span>`, correct: ans === 'still' },
  ];
}

const listFr = (arr) => (arr.length === 1 ? arr[0] : `${arr.slice(0, -1).join(', ')} et ${arr[arr.length - 1]}`);

function frac(num, den) {
  const g = (a, b) => (b ? g(b, a % b) : a);
  const k = g(num, den);
  return [num / k, den / k];
}
const FRAC_TXT = { '1/3': '⅓ de tour', '1/2': '½ tour', '2/3': '⅔ de tour', '1/1': '1 tour', '3/2': '1 tour ½', '2/1': '2 tours', '3/1': '3 tours', '4/1': '4 tours' };

function genGears(level) {
  const cfg = {
    1: { meshes: [5, 6], belts: [0, 0], bridge: 0.3, decoy: 0.3 },
    2: { meshes: [6, 7], belts: [1, 1], bridge: 0.35, decoy: 0.3 },
    3: { meshes: [7, 8], belts: [1, 2], bridge: 0.4, decoy: 0.35 },
  }[level];
  const kind = level === 1 ? 'dir'
    : level === 2 ? pick(['dir', 'dir', 'dir', 'count', 'multi'])
      : pick(['dir', 'dir', 'multi', 'multi', 'speed', 'speed']);

  let bridge = kind !== 'speed' && Math.random() < cfg.bridge
    ? (kind === 'dir' && Math.random() < 0.55 ? 'jam' : 'loop') : false;
  let decoy = !bridge && Math.random() < cfg.decoy;
  for (let attempt = 0; attempt < 400; attempt++) {
    if (attempt === 250) { bridge = false; decoy = false; }
    const sys = buildSystem({
      meshes: ri(...cfg.meshes), belts: ri(...cfg.belts), bridge, decoy,
      motorTeeth: kind === 'speed' ? pick([24, 30, 36]) : pick(TEETH.slice(2, 7)),
    });
    if (!sys) continue;
    const motorDir = pick([1, -1]);
    const sol = solveSystem(sys, motorDir);
    if (kind !== 'dir' && sol.jam) continue;
    const base = { type: 'gears', title: 'Engrenages', layout: 'grid' };
    const reveal = (el) => { const s = el.querySelector('.gears'); if (s) s.classList.add(sol.jam ? 'jam' : 'go'); };
    const Q = `Le moteur <b class="c-motor">⚡</b> tourne dans le sens de la flèche.`;
    const n = sys.gears.length;

    if (kind === 'dir') {
      let target;
      if (sys.decoy >= 0 && Math.random() < 0.45) target = sys.decoy;
      else {
        const minDepth = level + 1;
        const cands = [...sys.gears.keys()].filter((k) => k !== sys.decoy && k > 0 && sol.depth[k] >= minDepth);
        if (!cands.length) continue;
        target = pick(cands);
      }
      const ans = target === sys.decoy ? 'still' : sol.jam ? 'jam' : sol.dir[target] > 0 ? 'cw' : 'ccw';
      const explain = ans === 'still'
        ? "Regarde bien : la roue ★ ne touche aucune autre roue (il reste un petit espace entre les dents) et aucune courroie ne l'entraîne. <b>Elle ne tourne pas</b>, même si tout le reste bouge !"
        : ans === 'jam' ? JAM_TXT
          : `On suit le mouvement depuis le moteur jusqu'à la roue ★ : <span class="path">${pathText(sol, target)}</span> ${RULES}<br>La roue ★ tourne donc <b>${DIR_NAME[sol.dir[target]]}</b>.`;
      return {
        ...base, question: `${Q} Dans quel sens tourne la roue <b class="c-star">★</b> ?`,
        visual: systemSVG(sys, sol, motorDir, { target }), choices: gearChoices(ans), explain, reveal,
      };
    }

    if (kind === 'count') {
      const ccw = sol.dir.filter((d) => d < 0).length;
      const still = sol.dir.filter((d) => d === 0).length;
      return {
        ...base,
        question: `${Q} En comptant toutes les roues de la machine (moteur compris), combien tournent dans le sens <b>inverse</b> des aiguilles d'une montre ↺ ?`,
        visual: systemSVG(sys, sol, motorDir),
        choices: numberChoices(ccw, [n - ccw, ccw + 1, ccw - 1, n - ccw - still, ccw + still]),
        explain: `En suivant chaque chemin depuis le moteur, <b>${ccw}</b> roues tournent ↺ et ${n - ccw - still} tournent ↻${still ? `, et ${still} n'est reliée à rien (elle ne tourne pas)` : ''}. ${RULES}`,
        reveal,
      };
    }

    if (kind === 'multi') {
      const pool = shuffle([...sys.gears.keys()].filter((k) => k > 0 && (sol.depth[k] >= 2 || k === sys.decoy)));
      if (pool.length < 4) continue;
      const chosen = pool.slice(0, 4).sort((a, b) => sys.gears[a].x - sys.gears[b].x);
      const letters = {};
      chosen.forEach((k, i) => { letters[k] = 'ABCD'[i]; });
      const good = chosen.filter((k) => sol.dir[k] > 0).map((k) => letters[k]);
      if (good.length === 0 || good.length === 4) continue;
      const key = (set) => [...set].sort().join('');
      const opts = new Map([[key(good), good]]);
      for (let t = 0; t < 60 && opts.size < 4; t++) {
        const set = new Set(good);
        const flips = ri(1, 2);
        for (let f = 0; f < flips; f++) { const l = pick(['A', 'B', 'C', 'D']); if (set.has(l)) set.delete(l); else set.add(l); }
        if (set.size > 0) opts.set(key(set), [...set].sort());
      }
      if (opts.size < 4) continue;
      const detail = chosen.map((k) => `${letters[k]} ${sol.dir[k] === 0 ? '💤 (reliée à rien)' : ARROW(sol.dir[k])}`).join(' · ');
      return {
        ...base, layout: 'grid',
        question: `${Q} Quelles roues tournent dans le sens des aiguilles d'une montre ↻ ?`,
        visual: systemSVG(sys, sol, motorDir, { letters }),
        choices: shuffle([...opts.entries()]).map(([k, set]) => ({ html: `<span class="word">${listFr(set)}</span>`, correct: k === key(good) })),
        explain: `En suivant le mouvement depuis le moteur : ${detail}. ${RULES}<br>Les roues qui tournent ↻ sont donc <b>${listFr(good)}</b>.`,
        reveal,
      };
    }

    // kind === 'speed' : combien de tours fait la roue ★ quand le moteur fait 1 tour ?
    const tm = sys.gears[0].teeth;
    const cands = [...sys.gears.keys()].filter((k) => k > 0 && sol.depth[k] >= 3 && sol.dir[k] !== 0
      && FRAC_TXT[frac(tm, sys.gears[k].teeth).join('/')]);
    if (!cands.length) continue;
    const target = pick(cands);
    const tt = sys.gears[target].teeth;
    const good = frac(tm, tt).join('/');
    const inverse = frac(tt, tm).join('/');
    const pool = Object.keys(FRAC_TXT).filter((f) => f !== good);
    const traps = [...(FRAC_TXT[inverse] && inverse !== good ? [inverse] : []), ...shuffle(pool.filter((f) => f !== inverse))].slice(0, 3);
    return {
      ...base,
      question: `Chaque roue montre son nombre de dents. Quand le moteur <b class="c-motor">⚡</b> fait <b>1 tour</b>, combien de tours fait la roue <b class="c-star">★</b> ?`,
      visual: systemSVG(sys, sol, motorDir, { target, teeth: true }),
      choices: shuffle([good, ...traps]).map((f) => ({ html: `<span class="word">${FRAC_TXT[f]}</span>`, correct: f === good })),
      explain: `Chaque dent qui passe fait avancer une dent de la roue voisine (une courroie fait pareil). Les roues du milieu ne changent donc rien au total : on compare seulement le moteur (<b>${tm} dents</b>) et la roue ★ (<b>${tt} dents</b>). ${tm} ÷ ${tt} = <b>${FRAC_TXT[good]}</b>.`,
      reveal,
    };
  }
  return genGears(Math.max(1, level - 1));
}

/* ==========================================================================
   3. CODES SECRETS — HYPNOS
   ========================================================================== */

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WORDS = {
  4: ['CODE', 'LUNE', 'REVE', 'PONT', 'CIEL', 'VENT', 'LOUP', 'PAIX', 'JOUR', 'NUIT', 'ROSE', 'CHAT', 'TOUR', 'MAIN', 'BOIS', 'OURS', 'LION', 'MIEL', 'CAGE', 'FOOT'],
  5: ['ROBOT', 'PORTE', 'FORCE', 'LIBRE', 'AVION', 'PLUIE', 'HEROS', 'MAGIE', 'ARBRE', 'OCEAN', 'POMME', 'TIGRE', 'SUCRE', 'NUAGE', 'ZEBRE', 'CLOWN', 'PIANO', 'LAMPE', 'FUSEE', 'TRAIN', 'ORAGE', 'CARTE'],
  6: ['ESPOIR', 'SOLEIL', 'ETOILE', 'JARDIN', 'CASTOR', 'DRAGON', 'PLANTE', 'CERISE', 'CAMION', 'GIRAFE', 'PIRATE', 'MAISON', 'CHEVAL'],
};
const shiftWord = (w, k) => [...w].map((c) => ALPHA[(ALPHA.indexOf(c) + k + 26) % 26]).join('');
const mirrorWord = (w) => [...w].map((c) => ALPHA[25 - ALPHA.indexOf(c)]).join('');

function alphaStrip(withNums) {
  return `<div class="alpha${withNums ? ' nums' : ''}">${[...ALPHA].map((c, i) => `<span><b>${c}</b>${withNums ? `<i>${i + 1}</i>` : ''}</span>`).join('')}</div>`;
}
function cipher(parts, cls = '') {
  return `<div class="cipher ${cls}">${parts.map((p, i) => `<span style="--i:${i}">${p}</span>`).join('')}</div>`;
}

/** 3 autres mots de même longueur, de préférence avec la même première lettre. */
function wordDecoys(word) {
  const pool = WORDS[word.length].filter((w) => w !== word);
  const same = shuffle(pool.filter((w) => w[0] === word[0]));
  return [...same, ...shuffle(pool.filter((w) => w[0] !== word[0]))].slice(0, 3);
}
const wordChoice = (w, ok) => ({ html: `<span class="word">${w}</span>`, correct: ok });

function genCode(level) {
  const base = { type: 'code', title: 'Code secret', layout: 'grid' };
  if (level === 1) {
    const word = pick([...WORDS[4], ...WORDS[5]]);
    const nums = [...word].map((c) => ALPHA.indexOf(c) + 1);
    return {
      ...base,
      question: 'HYPNOS a caché un mot : chaque lettre est remplacée par son <b>numéro</b> dans l’alphabet (A = 1, B = 2…). Quel est ce mot ?',
      visual: cipher(nums) + alphaStrip(true),
      choices: shuffle([wordChoice(word, true), ...wordDecoys(word).map((w) => wordChoice(w, false))]),
      explain: `${nums.map((n, i) => `${n} = ${word[i]}`).join(', ')} → <b>${word}</b>.`,
    };
  }
  if (level === 2) {
    const word = pick(WORDS[5]), k = pick([1, 1, 2]);
    const enc = shiftWord(word, k);
    const rule = k === 1 ? 'la lettre <b>suivante</b> (A → B, B → C…)' : 'la lettre <b>deux places plus loin</b> (A → C, B → D…)';
    return {
      ...base,
      question: `Chaque lettre du message a été remplacée par ${rule}. Décode le message !`,
      visual: cipher([...enc]) + alphaStrip(false),
      choices: shuffle([wordChoice(word, true), ...wordDecoys(word).map((w) => wordChoice(w, false))]),
      explain: `Il faut reculer de ${k} dans l’alphabet : ${[...enc].map((c, i) => `${c} → ${word[i]}`).join(', ')}. Le mot est <b>${word}</b>.`,
    };
  }
  // Niveau 3 : deviner la règle à partir d'un exemple.
  const mirror = Math.random() < 0.3;
  const ex = pick(WORDS[4]);
  let target = pick([...WORDS[5], ...WORDS[6]]);
  const k = ri(1, 3);
  const enc = (w) => (mirror ? mirrorWord(w) : shiftWord(w, k));
  const good = enc(target);
  const traps = mirror
    ? [shiftWord(target, 1), shiftWord(target, -1), [...good].reverse().join('')]
    : [shiftWord(target, k + 1), shiftWord(target, -k), shiftWord(target, k === 1 ? 2 : k - 1)];
  const all = [good, ...traps.filter((w, i, a) => w !== good && a.indexOf(w) === i)];
  while (all.length < 4) { const w = shiftWord(target, ri(4, 20)); if (!all.includes(w)) all.push(w); }
  return {
    ...base, layout: 'list',
    question: `Si <b class="c-word">${ex}</b> s’écrit <b class="c-code">${enc(ex)}</b> en code HYPNOS, comment s’écrit <b class="c-word">${target}</b> ?`,
    visual: `<div class="code-pair">${cipher([...ex], 'small')}<span class="code-arrow">⟶</span>${cipher([...enc(ex)], 'small hot')}</div>` + alphaStrip(false),
    choices: shuffle(all.slice(0, 4).map((w) => ({ html: `<span class="word mono">${w}</span>`, correct: w === good }))),
    explain: mirror
      ? `L’alphabet est retourné : A ↔ Z, B ↔ Y, C ↔ X… Donc ${target} s’écrit <b>${good}</b>.`
      : `Chaque lettre avance de <b>${k}</b> : ${ex[0]} → ${enc(ex)[0]}, ${ex[1]} → ${enc(ex)[1]}… Donc ${target} s’écrit <b>${good}</b>.`,
  };
}

/* ==========================================================================
   4. PROGRAMMES DANS LE LABYRINTHE — LABYRINTHOR
   ========================================================================== */

const MOVES = { R: [1, 0, 90], L: [-1, 0, 270], D: [0, 1, 180], U: [0, -1, 0] };
const DIR_KEYS = ['R', 'L', 'D', 'U'];

function simulate(size, blocks, start, moves) {
  let [x, y] = start;
  const path = [[x, y]];
  for (const m of moves) {
    x += MOVES[m][0]; y += MOVES[m][1];
    if (x < 0 || y < 0 || x >= size || y >= size || blocks.has(`${x},${y}`)) return { crash: true, path, end: path[path.length - 1] };
    path.push([x, y]);
  }
  return { crash: false, path, end: [x, y] };
}

function bfs(size, blocks, start, goal) {
  const key = (p) => `${p[0]},${p[1]}`;
  const prev = new Map([[key(start), null]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (cur[0] === goal[0] && cur[1] === goal[1]) break;
    for (const m of shuffle(DIR_KEYS)) {
      const nx = cur[0] + MOVES[m][0], ny = cur[1] + MOVES[m][1];
      const k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || blocks.has(k) || prev.has(k)) continue;
      prev.set(k, [cur, m]);
      queue.push([nx, ny]);
    }
  }
  if (!prev.has(key(goal))) return null;
  const moves = [];
  let k = key(goal);
  while (prev.get(k)) { const [p, m] = prev.get(k); moves.unshift(m); k = key(p); }
  return moves;
}

const runs = (moves) => moves.reduce((acc, m) => {
  if (acc.length && acc[acc.length - 1][0] === m) acc[acc.length - 1][1]++;
  else acc.push([m, 1]);
  return acc;
}, []);
const turns = (moves) => runs(moves).length;

function progHTML(moves, compact) {
  if (!compact) return `<span class="prog">${moves.map((m) => `<span class="op">${arrowIcon(MOVES[m][2])}</span>`).join('')}</span>`;
  return `<span class="prog">${runs(moves).map(([m, n]) => `<span class="op">${n > 1 ? `<b>${n}</b>` : ''}${arrowIcon(MOVES[m][2])}</span>`).join('')}</span>`;
}

function mazeSVG(size, blocks, start, goal, labels) {
  const C = 60, W = size * C;
  let cells = '';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const b = blocks.has(`${x},${y}`);
    cells += b
      ? `<g transform="translate(${x * C} ${y * C})"><rect x="4" y="4" width="${C - 8}" height="${C - 8}" rx="6" class="fw"/><path d="M12 ${C / 2} H${C - 12} M${C / 2} 12 V${C - 12}" class="fw-x"/></g>`
      : `<rect x="${x * C + 2}" y="${y * C + 2}" width="${C - 4}" height="${C - 4}" rx="6" class="cell"/>`;
  }
  const lab = (labels || []).map(([x, y, t]) => `<text class="cell-label" x="${x * C + C / 2}" y="${y * C + C / 2 + 9}">${t}</text>`).join('');
  const goalEl = goal ? `<g transform="translate(${goal[0] * C + C / 2} ${goal[1] * C + C / 2})">${keyIcon()}</g>` : '';
  return `<svg class="maze" viewBox="-4 -4 ${W + 8} ${W + 8}" aria-label="Le labyrinthe">
    <rect x="-4" y="-4" width="${W + 8}" height="${W + 8}" rx="10" class="maze-bg"/>
    ${cells}${lab}${goalEl}
    <g class="drone" style="transform:translate(${start[0] * C + C / 2}px, ${start[1] * C + C / 2}px)">${droneIcon()}</g>
  </svg>`;
}

function animateDrone(el, path) {
  const drone = el.querySelector('.drone');
  if (!drone) return;
  const C = 60;
  path.forEach(([x, y], i) => {
    setTimeout(() => { drone.style.transform = `translate(${x * C + C / 2}px, ${y * C + C / 2}px)`; }, 300 + i * 280);
  });
}

function genMaze(level) {
  const size = level === 1 ? 4 : level === 2 ? 5 : 6;
  const nBlocks = level === 1 ? 3 : level === 2 ? 6 : 10;
  const [minLen, maxLen] = level === 1 ? [4, 6] : level === 2 ? [6, 9] : [8, 12];
  const dest = level === 3 && Math.random() < 0.5;
  const compact = level >= 2;

  for (let attempt = 0; attempt < 400; attempt++) {
    const start = [0, ri(0, size - 1)];
    const blocks = new Set();
    while (blocks.size < nBlocks) {
      const x = ri(0, size - 1), y = ri(0, size - 1);
      if (x === start[0] && y === start[1]) continue;
      blocks.add(`${x},${y}`);
    }

    if (dest) {
      // Le drone suit un programme : sur quelle case s'arrête-t-il ?
      const moves = [];
      let pos = start.slice(), last = null;
      const len = ri(6, 9);
      let tries = 0;
      while (moves.length < len && tries++ < 60) {
        const m = last && Math.random() < 0.55 ? last : pick(DIR_KEYS);
        const nx = pos[0] + MOVES[m][0], ny = pos[1] + MOVES[m][1];
        if (nx < 0 || ny < 0 || nx >= size || ny >= size || blocks.has(`${nx},${ny}`)) continue;
        if (last && MOVES[m][0] === -MOVES[last][0] && MOVES[m][1] === -MOVES[last][1]) continue;
        moves.push(m); pos = [nx, ny]; last = m;
      }
      if (moves.length < len || turns(moves) < 3) continue;
      const sim = simulate(size, blocks, start, moves);
      const end = sim.end;
      if (end[0] === start[0] && end[1] === start[1]) continue;
      const cand = [];
      const addCand = (p) => {
        const k = `${p[0]},${p[1]}`;
        if (p[0] < 0 || p[1] < 0 || p[0] >= size || p[1] >= size || blocks.has(k)) return;
        if ((p[0] === start[0] && p[1] === start[1]) || (p[0] === end[0] && p[1] === end[1])) return;
        if (!cand.some((c) => c[0] === p[0] && c[1] === p[1])) cand.push(p);
      };
      for (const m of DIR_KEYS) addCand([end[0] + MOVES[m][0], end[1] + MOVES[m][1]]);
      sim.path.slice(-4, -1).forEach(addCand);
      const picks = shuffle(cand).slice(0, 3);
      if (picks.length < 3) continue;
      const letters = shuffle(['A', 'B', 'C', 'D']);
      const labels = [[...end, letters[0]], ...picks.map((p, i) => [...p, letters[i + 1]])];
      return {
        type: 'maze', title: 'Programme', layout: 'grid',
        question: 'Le drone exécute ce programme. Sur quelle case s’arrête-t-il ?',
        visual: `<div class="prog-show">${progHTML(moves, true)}</div>${mazeSVG(size, blocks, start, null, labels)}`,
        choices: ['A', 'B', 'C', 'D'].map((l) => ({ html: `<span class="big-num">${l}</span>`, correct: l === letters[0] })),
        explain: `En suivant le programme case par case, le drone s’arrête sur la case <b>${letters[0]}</b>.`,
        reveal: (el) => animateDrone(el, sim.path),
      };
    }

    let goal = null;
    for (let t = 0; t < 20 && !goal; t++) {
      const g = [ri(Math.floor(size / 2), size - 1), ri(0, size - 1)];
      if (!blocks.has(`${g[0]},${g[1]}`) && (g[0] !== start[0] || g[1] !== start[1])) goal = g;
    }
    if (!goal) continue;
    const moves = bfs(size, blocks, start, goal);
    if (!moves || moves.length < minLen || moves.length > maxLen || turns(moves) < 2) continue;

    // Programmes pièges : on modifie le bon programme, et on vérifie qu'ils échouent.
    const good = moves.join('');
    const fails = new Map();
    for (let t = 0; t < 120 && fails.size < 8; t++) {
      const m = moves.slice();
      const op = ri(0, 3);
      const i = ri(0, m.length - 1);
      if (op === 0) m[i] = pick(DIR_KEYS.filter((d) => d !== m[i]));
      else if (op === 1 && i < m.length - 1 && m[i] !== m[i + 1]) [m[i], m[i + 1]] = [m[i + 1], m[i]];
      else if (op === 2 && m.length > 3) m.splice(i, 1);
      else m.splice(i, 0, m[i]);
      const s = m.join('');
      if (s === good || fails.has(s)) continue;
      const sim = simulate(size, blocks, start, m);
      const touchesKey = sim.path.some(([x, y]) => x === goal[0] && y === goal[1]);
      if (!touchesKey) fails.set(s, m);
    }
    if (fails.size < 3) continue;
    const traps = shuffle([...fails.values()]).slice(0, 3);
    const path = simulate(size, blocks, start, moves).path;
    return {
      type: 'maze', title: 'Programme', layout: 'list',
      question: `Quel programme conduit le drone jusqu’à la clé <b class="c-key">🔑</b> sans toucher les pare-feux rouges ?`,
      visual: mazeSVG(size, blocks, start, goal),
      choices: shuffle([{ m: moves, ok: true }, ...traps.map((m) => ({ m, ok: false }))])
        .map(({ m, ok }) => ({ html: progHTML(m, compact), correct: ok })),
      explain: `Le bon programme est ${progHTML(moves, compact)}. Les autres foncent dans un pare-feu ou s’arrêtent à côté de la clé.`,
      reveal: (el) => animateDrone(el, path),
    };
  }
  return genMaze(1);
}

/* ==========================================================================
   5. DÉDUCTIONS — SENTINELLE
   ========================================================================== */

const RACERS = [
  { name: 'Pixel', color: '#35F2FF' },
  { name: 'Bolt', color: '#FFD23F' },
  { name: 'Nano', color: '#FF4FD8' },
  { name: 'Turbo', color: '#3DFFB0' },
];

function permutations(n) {
  if (n === 1) return [[0]];
  const out = [];
  for (const p of permutations(n - 1)) for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}

function genOrder(n, askPos) {
  const racers = shuffle(RACERS).slice(0, n);
  const tag = (i) => `<b class="racer" style="--c:${racers[i].color}">${racers[i].name}</b>`;
  const perms = permutations(n); // perm[place] = coureur
  for (let attempt = 0; attempt < 200; attempt++) {
    const truth = pick(perms);
    const pos = (perm, x) => perm.indexOf(x);
    const all = [];
    for (let x = 0; x < n; x++) {
      all.push({ t: `${tag(x)} n’est pas arrivé premier.`, f: (p) => pos(p, x) !== 0 });
      all.push({ t: `${tag(x)} n’est pas arrivé dernier.`, f: (p) => pos(p, x) !== n - 1 });
      if (askPos !== 0) all.push({ t: `${tag(x)} est arrivé premier.`, f: (p) => pos(p, x) === 0 });
      if (askPos !== n - 1) all.push({ t: `${tag(x)} est arrivé dernier.`, f: (p) => pos(p, x) === n - 1 });
      for (let y = 0; y < n; y++) {
        if (x === y) continue;
        all.push({ t: `${tag(x)} est arrivé avant ${tag(y)}.`, f: (p) => pos(p, x) < pos(p, y) });
        all.push({ t: `${tag(y)} est arrivé juste après ${tag(x)}.`, f: (p) => pos(p, y) === pos(p, x) + 1 });
      }
    }
    const trueClues = shuffle(all.filter((c) => c.f(truth)));
    let cands = perms, chosen = [];
    for (const c of trueClues) {
      const next = cands.filter(c.f);
      if (next.length < cands.length) { chosen.push(c); cands = next; }
      if (cands.length === 1) break;
    }
    if (cands.length !== 1 || chosen.length > n || chosen.length < 2) continue;
    // Chaque indice doit servir : sans lui, la réponse ne serait plus unique.
    const useful = chosen.every((c) => perms.filter((p) => chosen.every((o) => o === c || o.f(p))).length > 1);
    if (!useful) continue;
    const winner = truth[askPos];
    const qs = askPos === 0 ? 'Qui a gagné la course ?' : askPos === n - 1 ? 'Qui est arrivé dernier ?' : `Qui est arrivé ${ORD[askPos]} ?`;
    return {
      type: 'logic', title: 'Déduction', layout: n > 3 ? 'grid' : 'row',
      question: `${n} robots ont fait la course. Lis les indices de SENTINELLE. <b>${qs}</b>`,
      visual: `<ul class="clues">${shuffle(chosen).map((c, i) => `<li style="--i:${i}">${c.t}</li>`).join('')}</ul>`,
      choices: racers.map((r, i) => ({ html: `${racerIcon(r.color)}<span>${r.name}</span>`, correct: i === winner })),
      explain: `Un seul ordre respecte tous les indices : ${truth.map((x, i) => `${ORD[i]} ${tag(x)}`).join(', ')}.`,
    };
  }
  return null;
}

const DOORS = [{ name: 'rouge', color: '#FF4D6D' }, { name: 'bleue', color: '#4D9BFF' }, { name: 'verte', color: '#3DFFB0' }];

function genDoors(mode) {
  const need = mode === 'oneTrue' ? 1 : 2;
  const says = {
    here: { t: () => 'La sortie est derrière moi.', f: (i, e) => e === i },
    nothere: { t: () => 'La sortie n’est pas derrière moi.', f: (i, e) => e !== i },
    is: { t: (j) => `La sortie est derrière la porte ${DOORS[j].name}.`, f: (i, e, j) => e === j },
    isnot: { t: (j) => `La sortie n’est pas derrière la porte ${DOORS[j].name}.`, f: (i, e, j) => e !== j },
  };
  for (let attempt = 0; attempt < 300; attempt++) {
    const st = [0, 1, 2].map((i) => {
      const kind = pick(Object.keys(says));
      const j = pick([0, 1, 2].filter((k) => k !== i));
      return { kind, i, j };
    });
    if (new Set(st.map((s) => s.kind)).size < 2) continue;
    const truths = [0, 1, 2].map((e) => st.filter((s) => says[s.kind].f(s.i, e, s.j)).length);
    const valid = [0, 1, 2].filter((e) => truths[e] === need);
    if (valid.length !== 1) continue;
    const exit = valid[0];
    const rule = mode === 'oneTrue' ? 'Une seule porte dit la vérité.' : 'Une seule porte ment.';
    const lines = [0, 1, 2].map((e) =>
      `Si la sortie est derrière la <b style="color:${DOORS[e].color}">${DOORS[e].name}</b> : ${truths[e]} porte${truths[e] > 1 ? 's disent' : ' dit'} vrai ${e === exit ? '✔' : '✘'}`).join('<br>');
    return {
      type: 'logic', title: 'Déduction', layout: 'row',
      question: `SENTINELLE garde trois portes. Une seule mène à la sortie. <b>${rule}</b> Derrière quelle porte est la sortie ?`,
      visual: `<div class="doors">${st.map((s, k) => `<div class="door" style="--c:${DOORS[k].color};--i:${k}">${doorIcon(DOORS[k].color)}<p class="bubble">« ${says[s.kind].t(s.j)} »</p></div>`).join('')}</div>`,
      choices: DOORS.map((d, k) => ({ html: `<span class="door-dot" style="background:${d.color}"></span><span>Porte ${d.name}</span>`, correct: k === exit })),
      explain: `On teste chaque possibilité :<br>${lines}<br>La sortie est derrière la porte <b>${DOORS[exit].name}</b> !`,
    };
  }
  return null;
}

function genLogic(level) {
  let p = null;
  if (level === 1) p = genOrder(3, pick([0, 2]));
  else if (level === 2) p = Math.random() < 0.55 ? genDoors('oneTrue') : genOrder(4, pick([0, 3]));
  else p = Math.random() < 0.5 ? genDoors(pick(['oneTrue', 'oneLie'])) : genOrder(4, pick([1, 2]));
  return p || genOrder(3, 0);
}

/* ==========================================================================
   6. ÉQUATIONS À SYMBOLES — VOLTAR
   ========================================================================== */

function genEquation(level) {
  const keys = shuffle(['battery', 'bolt', 'gear', 'chip']);
  const [A, B, C] = keys;
  const I = (k) => symbolIcon(k);
  const row = (terms, v) => `<div class="eq-row" style="--i:${row.n++}">${terms.join('')}<span class="op">=</span><span class="val">${v}</span></div>`;
  row.n = 0;
  const plus = '<span class="op">+</span>', times = '<span class="op">×</span>';
  let rows, ask, ans, traps, explain;

  if (level === 1) {
    const a = ri(2, 9), b = ri(1, 9);
    rows = [row([I(A), plus, I(A)], 2 * a), row([I(A), plus, I(B)], a + b)];
    ask = [I(B)]; ans = b;
    traps = [a, a + b, 2 * a - b, b + 1, b - 1];
    explain = `${I(A)} + ${I(A)} = ${2 * a}, donc ${I(A)} = <b>${a}</b>. Puis ${a} + ${I(B)} = ${a + b}, donc ${I(B)} = <b>${b}</b>.`;
  } else if (level === 2) {
    const a = ri(2, 6), b = ri(1, 9), c = ri(1, 9);
    rows = [row([I(A), plus, I(A), plus, I(A)], 3 * a), row([I(A), plus, I(B)], a + b), row([I(B), plus, I(C)], b + c)];
    ask = [I(C)]; ans = c;
    traps = [b, a, b + c - a, c + 1, c - 1, c + 2];
    explain = `${I(A)} × 3 = ${3 * a}, donc ${I(A)} = <b>${a}</b>. Puis ${I(B)} = ${a + b} − ${a} = <b>${b}</b>. Enfin ${I(C)} = ${b + c} − ${b} = <b>${c}</b>.`;
  } else {
    const a = ri(2, 6), b = ri(2, 5), c = ri(1, 9);
    const askSum = Math.random() < 0.5;
    rows = [row([I(A), plus, I(A)], 2 * a), row([I(A), times, I(B)], a * b), row([I(B), plus, I(C), plus, I(C)], b + 2 * c)];
    if (askSum) {
      ask = [I(A), plus, I(C)]; ans = a + c;
      traps = [a + b, b + c, ans + 1, ans - 1, ans + 2, a * c];
    } else {
      ask = [I(C)]; ans = c;
      traps = [b + 2 * c - b, a, b, c + 1, c - 1, 2 * c];
    }
    explain = `${I(A)} = ${2 * a} ÷ 2 = <b>${a}</b>. ${I(B)} = ${a * b} ÷ ${a} = <b>${b}</b>. ${I(C)} + ${I(C)} = ${b + 2 * c} − ${b} = ${2 * c}, donc ${I(C)} = <b>${c}</b>.${askSum ? ` Et ${a} + ${c} = <b>${ans}</b>.` : ''}`;
  }
  return {
    type: 'equation', title: 'Équations', layout: 'grid',
    question: 'Chaque symbole cache un nombre. Trouve la valeur demandée !',
    visual: `<div class="eqs">${rows.join('')}<div class="eq-row ask" style="--i:${rows.length}">${ask.join('')}<span class="op">=</span><span class="val q">?</span></div></div>`,
    choices: numberChoices(ans, traps),
    explain,
  };
}

/* ========================================================================== */

const GENERATORS = { sequence: genSequence, gears: genGears, code: genCode, maze: genMaze, logic: genLogic, equation: genEquation };

export function makePuzzle(type, level) {
  return GENERATORS[type](Math.max(1, Math.min(3, level)));
}

/** Pour les tests : vérifie qu'un grand nombre d'énigmes ont bien une seule bonne réponse. */
export function selfTest(n = 200) {
  const errors = [];
  for (const type of Object.keys(GENERATORS)) {
    for (let level = 1; level <= 3; level++) {
      for (let i = 0; i < n; i++) {
        const p = makePuzzle(type, level);
        const good = p.choices.filter((c) => c.correct).length;
        const htmls = p.choices.map((c) => c.html);
        if (good !== 1) errors.push(`${type} n${level}: ${good} bonnes réponses`);
        if (new Set(htmls).size !== htmls.length) errors.push(`${type} n${level}: choix en double`);
      }
    }
  }
  return errors;
}
