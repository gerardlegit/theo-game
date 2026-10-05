// ============================================================================
// ART DU ROYAUME — tous les dessins sont en SVG, générés par le code :
// la carte d'Alphabelle, les blasons, le domaine à construire, les décors
// des régions et le mage Embrouillard.
// Les décors aléatoires utilisent une graine fixe : ils sont toujours pareils.
// ============================================================================

import { TINCTURES } from './world.js';

let uidN = 0;
const uid = (p) => `${p}${++uidN}`;

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;
const tint = (id) => (TINCTURES.find((t) => t.id === id) || TINCTURES[0]).color;

function svg(inner, vb, cls = '', par = 'xMidYMid meet') {
  return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="${par}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, stops) => `<radialGradient id="${id}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
const emoji = (e, x, y, size, cls = '') => `<text class="${cls}" x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${e}</text>`;

// ------------------------------------------------------------- blason ---
const SHIELD = 'M10 8 H90 V48 C90 78 70 94 50 104 C30 94 10 78 10 48 Z';

export function blasonSVG(b, cls = 'blason') {
  const id = uid('bl');
  const field = tint(b?.field || 'azur');
  const second = tint(b?.second || 'or');
  let parts = '';
  if (b?.part === 'parti') parts = `<rect x="50" y="0" width="50" height="110" fill="${second}"/>`;
  else if (b?.part === 'coupe') parts = `<rect x="0" y="52" width="100" height="60" fill="${second}"/>`;
  else if (b?.part === 'bande') parts = `<path d="M0 0 L32 0 L100 80 L100 112 Z" fill="${second}"/>`;
  return svg(`
    <defs><clipPath id="${id}"><path d="${SHIELD}"/></clipPath>
    ${lin(`${id}g`, [[0, '#fff', 0.35], [0.5, '#fff', 0], [1, '#000', 0.25]], 1, 1)}</defs>
    <g clip-path="url(#${id})"><rect width="100" height="112" fill="${field}"/>${parts}
      <rect width="100" height="112" fill="url(#${id}g)"/></g>
    <path d="${SHIELD}" fill="none" stroke="#C99A2E" stroke-width="5"/>
    <path d="${SHIELD}" fill="none" stroke="#7A5512" stroke-width="1.2" transform="translate(0 0)"/>
    ${emoji(b?.emblem || '🦁', 50, 52, 40)}`, '0 0 100 112', cls);
}

// --------------------------------------------------------------- carte ---
export const MAP_POS = {
  conj: [210, 205], gram: [500, 385], ortho: [215, 530], vocab: [790, 515], lect: [800, 215], final: [500, 120],
};

function mountains(R) {
  let s = '';
  const peaks = [[150, 285, 70], [215, 275, 95], [290, 290, 75], [120, 300, 50], [345, 300, 55], [255, 300, 60]];
  peaks.forEach(([x, base, h]) => {
    const w = h * 0.9;
    s += `<path d="M${x - w} ${base} L${x} ${base - h} L${x + w} ${base} Z" fill="#9C8B78" stroke="#5B4A3A" stroke-width="2"/>
      <path d="M${x} ${base - h} L${x + w} ${base} L${x + w * 0.3} ${base} Z" fill="#7D6E5E"/>
      <path d="M${x - w * 0.28} ${base - h * 0.7} L${x} ${base - h} L${x + w * 0.28} ${base - h * 0.7} L${x + w * 0.1} ${base - h * 0.62} L${x - w * 0.05} ${base - h * 0.72} Z" fill="#F7F3EA"/>`;
  });
  // Volcan de la forge
  s += `<path d="M175 240 L215 160 L240 160 L280 240 Z" fill="#6E4B3A" stroke="#3E2A1E" stroke-width="2"/>
    <ellipse cx="227" cy="160" rx="14" ry="4" fill="#FF7A1A"/>
    <path class="smoke" d="M227 155 C215 135 240 125 228 105 C220 92 236 84 230 72" stroke="#8E8E8E" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="M222 162 L216 190 M232 162 L240 185" stroke="#FF9A3C" stroke-width="3" stroke-linecap="round"/>`;
  return s;
}

function trees(R, cx, cy, n, spread) {
  let s = '';
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R()) * spread;
    items.push([cx + Math.cos(a) * d * 1.4, cy + Math.sin(a) * d * 0.8, R()]);
  }
  items.sort((a, b) => a[1] - b[1]).forEach(([x, y, k]) => {
    if (k < 0.45) {
      s += `<path d="M${r1(x)} ${r1(y - 26)} L${r1(x + 11)} ${r1(y)} L${r1(x - 11)} ${r1(y)} Z" fill="#2F6B3A" stroke="#1C4224" stroke-width="1.5"/>`;
    } else {
      s += `<rect x="${r1(x - 2)}" y="${r1(y - 4)}" width="4" height="8" fill="#5B3A1E"/>
        <circle cx="${r1(x)}" cy="${r1(y - 12)}" r="${r1(10 + k * 4)}" fill="${k > 0.8 ? '#5C9A3E' : '#3F8540'}" stroke="#1F4A25" stroke-width="1.5"/>`;
    }
  });
  return s;
}

function castleIcon(x, y, sc = 1, flag = '#C8102E') {
  return `<g transform="translate(${x} ${y}) scale(${sc})">
    <rect x="-40" y="-30" width="80" height="40" fill="#D9CFC0" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M-40 -30 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6" fill="#D9CFC0" stroke="#5B4A3A" stroke-width="2"/>
    <rect x="-55" y="-50" width="20" height="60" fill="#E6DDCF" stroke="#5B4A3A" stroke-width="2"/>
    <rect x="35" y="-50" width="20" height="60" fill="#E6DDCF" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M-58 -50 L-45 -70 L-32 -50 Z M32 -50 L45 -70 L58 -50 Z" fill="#3D6FD6" stroke="#22407F" stroke-width="2"/>
    <rect x="-14" y="-62" width="28" height="72" fill="#EFE7DA" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M-18 -62 L0 -88 L18 -62 Z" fill="#3D6FD6" stroke="#22407F" stroke-width="2"/>
    <line x1="0" y1="-88" x2="0" y2="-104" stroke="#5B4A3A" stroke-width="2"/>
    <path class="flag" d="M0 -104 L18 -99 L0 -94 Z" fill="${flag}"/>
    <path d="M-8 10 v-14 a8 8 0 0 1 16 0 v14 Z" fill="#5B3A1E"/>
    <rect x="-4" y="-48" width="8" height="10" rx="4" fill="#4A3B2C"/>
  </g>`;
}

function abbey(x, y) {
  return `<g transform="translate(${x} ${y})">
    <ellipse cx="0" cy="18" rx="95" ry="26" fill="#9CBF6E" stroke="#5E7F3A" stroke-width="2"/>
    <rect x="-50" y="-22" width="70" height="38" fill="#E6D8C3" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M-56 -22 L-15 -48 L26 -22 Z" fill="#A0522D" stroke="#5B2E17" stroke-width="2"/>
    <rect x="22" y="-60" width="24" height="76" fill="#EFE3CE" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M18 -60 L34 -86 L50 -60 Z" fill="#A0522D" stroke="#5B2E17" stroke-width="2"/>
    <circle cx="34" cy="-44" r="6" fill="#E7B416" stroke="#7A5512" stroke-width="1.5"/>
    <path d="M-38 -4 v-10 a5 5 0 0 1 10 0 v10 Z M-18 -4 v-10 a5 5 0 0 1 10 0 v10 Z" fill="#6E8FD6"/>
    <path d="M-2 16 v-12 a6 6 0 0 1 12 0 v12 Z" fill="#5B3A1E"/>
  </g>`;
}

function swamp(R) {
  let s = '';
  [[200, 545, 95, 40], [150, 505, 50, 22], [280, 575, 55, 20], [250, 500, 40, 16]].forEach(([x, y, rx, ry]) => {
    s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#7E9C6A" stroke="#4F6B3E" stroke-width="2"/>
      <ellipse cx="${x}" cy="${y + 2}" rx="${rx * 0.7}" ry="${ry * 0.55}" fill="#6B8E7A" opacity=".8"/>`;
  });
  for (let i = 0; i < 26; i++) {
    const x = 120 + R() * 200, y = 490 + R() * 100;
    s += `<path d="M${r1(x)} ${r1(y)} q2 -14 ${r1(-3 + R() * 6)} -22" stroke="#4F6B3E" stroke-width="2" fill="none"/>`;
    if (R() < 0.3) s += `<ellipse cx="${r1(x + 2)}" cy="${r1(y - 20)}" rx="2.5" ry="6" fill="#7A4A26"/>`;
  }
  for (let i = 0; i < 6; i++) s += `<ellipse cx="${r1(150 + R() * 120)}" cy="${r1(530 + R() * 40)}" rx="6" ry="3" fill="#8CC46B" stroke="#4F6B3E"/>`;
  return s;
}

function darkTower(x, y) {
  return `<g transform="translate(${x} ${y})">
    <path class="storm" d="M-70 -70 C-90 -90 -60 -115 -35 -100 C-25 -125 15 -125 25 -100 C50 -115 85 -95 70 -70 Z" fill="#4A3B63" opacity=".9"/>
    <path class="bolt" d="M-10 -78 L-18 -55 L-8 -58 L-16 -36" stroke="#E7C6FF" stroke-width="3" fill="none"/>
    <path d="M-22 40 L-16 -40 L16 -40 L22 40 Z" fill="#2B2238" stroke="#120D1A" stroke-width="2"/>
    <path d="M-24 -40 L0 -72 L24 -40 Z" fill="#3D2E55" stroke="#120D1A" stroke-width="2"/>
    <rect x="-5" y="-25" width="10" height="14" rx="5" fill="#C77DFF" class="glow"/>
    <rect x="-4" y="5" width="8" height="10" rx="4" fill="#C77DFF" class="glow"/>
  </g>`;
}

export function mapSVG() {
  const R = rng(42);
  const fogF = uid('fog');
  const paper = uid('paper');
  let waves = '';
  for (let i = 0; i < 40; i++) {
    const x = R() * 1000, y = R() * 700;
    if (x > 90 && x < 920 && y > 60 && y < 640) continue;
    waves += `<path d="M${r1(x)} ${r1(y)} q6 -5 12 0 t12 0" stroke="#5E8C99" stroke-width="1.6" fill="none" opacity=".7"/>`;
  }
  let fields = '';
  const fc = ['#D8C77E', '#C9D88A', '#E2CF8F', '#B8CF7A'];
  for (let i = 0; i < 9; i++) {
    const x = 400 + (i % 3) * 52 + R() * 8, y = 440 + Math.floor(i / 3) * 34 + R() * 6;
    fields += `<path d="M${r1(x)} ${r1(y)} l48 -6 l4 30 l-50 4 Z" fill="${fc[i % 4]}" stroke="#9B8B5A" stroke-width="1"/>`;
  }
  let houses = '';
  [[600, 420], [622, 440], [585, 450], [395, 330], [610, 345]].forEach(([x, y]) => {
    houses += `<rect x="${x - 7}" y="${y - 7}" width="14" height="11" fill="#EADBC0" stroke="#5B4A3A" stroke-width="1.2"/><path d="M${x - 10} ${y - 7} L${x} ${y - 16} L${x + 10} ${y - 7} Z" fill="#B5532E" stroke="#5B2E17" stroke-width="1.2"/>`;
  });
  const roads = ['conj', 'ortho', 'vocab', 'lect', 'final'].map((k) => {
    const [x, y] = MAP_POS[k];
    const [cx, cy] = MAP_POS.gram;
    const mx = (x + cx) / 2 + (y - cy) * 0.15, my = (y + cy) / 2 - (x - cx) * 0.1;
    return `<path d="M${cx} ${cy} Q${r1(mx)} ${r1(my)} ${x} ${y}" stroke="#8A6A3E" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" fill="none"/>`;
  }).join('');
  const fog = (k, r) => {
    const [x, y] = MAP_POS[k];
    return `<g class="fog" data-region="${k}" filter="url(#${fogF})">
      <circle cx="${x - 30}" cy="${y + 10}" r="${r}" fill="#5B2A86" opacity=".55"/>
      <circle cx="${x + 35}" cy="${y - 10}" r="${r * 0.9}" fill="#7A3FB0" opacity=".5"/>
      <circle cx="${x}" cy="${y + 25}" r="${r * 0.8}" fill="#3E1F5E" opacity=".5"/></g>`;
  };
  return svg(`
    <defs>
      ${rad(paper, [[0, '#F6E9C8'], [0.75, '#EAD5A4'], [1, '#C9A86A']])}
      <filter id="${fogF}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <rect width="1000" height="700" fill="url(#${paper})"/>
    <rect width="1000" height="700" fill="#7FB3BE" opacity=".35"/>
    ${waves}
    <path d="M120 120 C200 40 380 60 470 50 C560 40 700 30 800 70 C900 110 960 200 930 300 C910 380 960 450 920 540 C880 630 760 670 640 650 C540 635 470 680 360 660 C240 640 120 640 80 560 C40 480 90 420 70 340 C50 260 60 180 120 120 Z"
      fill="#EBD9A8" stroke="#6B4E2E" stroke-width="4"/>
    <path d="M120 120 C200 40 380 60 470 50 C560 40 700 30 800 70 C900 110 960 200 930 300 C910 380 960 450 920 540 C880 630 760 670 640 650 C540 635 470 680 360 660 C240 640 120 640 80 560 C40 480 90 420 70 340 C50 260 60 180 120 120 Z"
      fill="none" stroke="#6B4E2E" stroke-width="1.5" stroke-dasharray="3 6" transform="translate(500 350) scale(1.03) translate(-500 -350)" opacity=".6"/>
    <path d="M290 270 C340 330 390 360 365 420 C340 480 280 500 235 560 C205 600 160 630 110 652" stroke="#6FA8C7" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M290 270 C340 330 390 360 365 420 C340 480 280 500 235 560 C205 600 160 630 110 652" stroke="#A8D2E4" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${fields}
    ${roads}
    ${mountains(R)}
    ${swamp(R)}
    ${trees(R, 790, 520, 46, 85)}
    ${trees(R, 640, 250, 10, 30)}
    ${trees(R, 380, 560, 8, 25)}
    ${abbey(800, 225)}
    ${castleIcon(500, 395, 1.15)}
    ${houses}
    ${darkTower(500, 130)}
    <g transform="translate(70 640)" opacity=".8">
      <circle r="34" fill="none" stroke="#6B4E2E" stroke-width="2"/>
      <path d="M0 -40 L7 0 L0 40 L-7 0 Z" fill="#6B4E2E"/><path d="M-40 0 L0 -7 L40 0 L0 7 Z" fill="#A88A5A"/>
      <text y="-46" text-anchor="middle" font-size="16" fill="#6B4E2E" font-family="serif" font-weight="bold">N</text>
    </g>
    <g transform="translate(905 640)">
      <path d="M-30 0 Q0 18 30 0 L24 10 Q0 24 -24 10 Z" fill="#8A5A2E" stroke="#4A2E14" stroke-width="2"/>
      <line x1="0" y1="2" x2="0" y2="-40" stroke="#4A2E14" stroke-width="2.5"/>
      <path d="M2 -38 Q22 -24 2 -8 Z" fill="#F5EBD7" stroke="#8A6A3E"/>
    </g>
    <g transform="translate(940 90)" class="serpent">
      <path d="M-40 10 q10 -25 20 0 q10 25 20 0 q10 -25 20 0" stroke="#3E7F6E" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="22" cy="2" r="7" fill="#3E7F6E"/><circle cx="25" cy="0" r="1.6" fill="#fff"/>
    </g>
    ${fog('conj', 85)}${fog('ortho', 85)}${fog('vocab', 90)}${fog('lect', 85)}${fog('gram', 80)}
  `, '0 0 1000 700', 'map-svg', 'xMidYMid meet');
}

// ------------------------------------------------------ décors de région ---
const SCENES = {
  forge: { sky: [['0', '#2A0E0A'], ['0.6', '#8A2E12'], ['1', '#E0672F']], ground: '#2B1610', far: '#4A1E12', near: '#1E0D08' },
  castle: { sky: [['0', '#5FA8E8'], ['0.7', '#BFE3F7'], ['1', '#F5EBD7']], ground: '#5E9B4A', far: '#8DB4CF', near: '#3F7A3A' },
  swamp: { sky: [['0', '#1E3B3A'], ['0.6', '#4E7A6A'], ['1', '#A9C7A8']], ground: '#2E4A38', far: '#3B5E50', near: '#1B2E24' },
  forest: { sky: [['0', '#0F2E1E'], ['0.6', '#2F6B3A'], ['1', '#9CCB7A']], ground: '#1E3F22', far: '#2B5A31', near: '#12291A' },
  abbey: { sky: [['0', '#1C1238'], ['0.6', '#5B3A8A'], ['1', '#E7A06A']], ground: '#2A1E3A', far: '#3E2C5A', near: '#170F24' },
  tower: { sky: [['0', '#08040F'], ['0.6', '#2B1048'], ['1', '#5B2A86']], ground: '#120A1C', far: '#21123A', near: '#07040C' },
  meadow: { sky: [['0', '#F5B66A'], ['0.5', '#F7D9A0'], ['1', '#BFE3F7']], ground: '#5E9B4A', far: '#86B36A', near: '#3F7A3A' },
};

function silhouette(kind, color, R) {
  let s = '';
  if (kind === 'forge' || kind === 'tower') {
    s += `<path d="M0 300 L80 210 L150 260 L240 160 L330 250 L420 190 L520 270 L600 180 L700 250 L800 200 L800 400 L0 400 Z" fill="${color}"/>`;
  } else if (kind === 'forest' || kind === 'swamp') {
    s += `<path d="M0 280 Q200 240 400 270 T800 260 L800 400 L0 400 Z" fill="${color}"/>`;
    for (let i = 0; i < 14; i++) {
      const x = R() * 800, h = 120 + R() * 140, w = 30 + R() * 30;
      s += kind === 'forest'
        ? `<path d="M${r1(x)} ${r1(300 - h)} L${r1(x + w)} 300 L${r1(x - w)} 300 Z" fill="${color}"/>`
        : `<path d="M${r1(x)} 300 L${r1(x)} ${r1(300 - h * 0.6)} M${r1(x)} ${r1(300 - h * 0.4)} L${r1(x + 25)} ${r1(300 - h * 0.6)} M${r1(x)} ${r1(300 - h * 0.5)} L${r1(x - 20)} ${r1(300 - h * 0.7)}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;
    }
  } else {
    s += `<path d="M0 300 Q200 230 400 280 T800 250 L800 400 L0 400 Z" fill="${color}"/>`;
  }
  return s;
}

function sceneProps(kind, R) {
  if (kind === 'castle' || kind === 'meadow') {
    return `<g transform="translate(560 300) scale(1.6)" opacity=".95">${castleIcon(0, 0, 1)}</g>`;
  }
  if (kind === 'abbey') {
    let stars = '';
    for (let i = 0; i < 30; i++) stars += `<circle class="twinkle" style="animation-delay:${r1(R() * 3)}s" cx="${r1(R() * 800)}" cy="${r1(R() * 160)}" r="${r1(0.8 + R() * 1.5)}" fill="#FFF7D6"/>`;
    return `${stars}<g transform="translate(600 292) scale(1.5)">${abbey(0, 0)}</g>`;
  }
  if (kind === 'tower') {
    return `<g transform="translate(400 240) scale(1.9)">${darkTower(0, 0)}</g>`;
  }
  if (kind === 'forge') {
    let e = '';
    for (let i = 0; i < 18; i++) e += `<circle class="ember" style="animation-delay:${r1(R() * 4)}s;animation-duration:${r1(3 + R() * 3)}s" cx="${r1(R() * 800)}" cy="${r1(300 + R() * 80)}" r="${r1(1.5 + R() * 2)}" fill="#FFB347"/>`;
    return e;
  }
  if (kind === 'forest' || kind === 'swamp') {
    let f = '';
    for (let i = 0; i < 16; i++) f += `<circle class="firefly" style="animation-delay:${r1(R() * 4)}s" cx="${r1(R() * 800)}" cy="${r1(150 + R() * 200)}" r="2.2" fill="${kind === 'forest' ? '#E8FF8A' : '#C9F2D8'}"/>`;
    return f;
  }
  return '';
}

export function sceneSVG(kind = 'castle') {
  const S = SCENES[kind] || SCENES.castle;
  const R = rng(kind.length * 977);
  const sky = uid('sky');
  return svg(`
    <defs>${lin(sky, S.sky.map(([o, c]) => [o, c]))}</defs>
    <rect width="800" height="400" fill="url(#${sky})"/>
    ${silhouette(kind, S.far, R)}
    ${sceneProps(kind, R)}
    <path d="M0 340 Q200 320 400 335 T800 330 L800 400 L0 400 Z" fill="${S.near}"/>
  `, '0 0 800 400', 'scene-svg', 'xMidYMax slice');
}

// ----------------------------------------------------- mage Embrouillard ---
export function mageSVG(freed = false) {
  const robe = uid('robe');
  const orb = uid('orb');
  return svg(`
    <defs>${lin(robe, freed ? [[0, '#7B6BB5'], [1, '#3E3470']] : [[0, '#4B2A7A'], [1, '#1A0D2E']])}
      ${rad(orb, freed ? [[0, '#FFFFFF'], [0.5, '#9ED8FF'], [1, '#3A7BD5', 0]] : [[0, '#FFFFFF'], [0.4, '#E59BFF'], [1, '#7A1FB0', 0]])}</defs>
    <circle cx="150" cy="58" r="30" fill="url(#${orb})" class="orb"/>
    <line x1="150" y1="80" x2="150" y2="230" stroke="#5B3A1E" stroke-width="7" stroke-linecap="round"/>
    <path d="M60 230 L100 80 Q100 40 100 40 L130 82 L140 230 Z" fill="url(#${robe})" stroke="#0E0718" stroke-width="3"/>
    <path d="M100 40 Q60 40 52 90 Q80 70 100 72 Z" fill="url(#${robe})" stroke="#0E0718" stroke-width="3"/>
    <path d="M100 40 L118 -6 L132 54 Z" fill="url(#${robe})" stroke="#0E0718" stroke-width="3"/>
    <text x="114" y="30" font-size="12" fill="#FFD54A">✦</text>
    <ellipse cx="102" cy="90" rx="22" ry="26" fill="#0E0718"/>
    ${freed
      ? `<path d="M90 88 q4 -5 8 0 M106 88 q4 -5 8 0" stroke="#FFE8A3" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M94 102 q8 6 16 0" stroke="#FFE8A3" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : '<ellipse class="eye" cx="94" cy="88" rx="4" ry="3" fill="#E59BFF"/><ellipse class="eye" cx="110" cy="88" rx="4" ry="3" fill="#E59BFF"/>'}
    <path d="M86 104 Q100 160 114 104 Q102 140 100 170 Q96 140 86 104 Z" fill="#D9D4E8"/>
    <path d="M128 140 Q146 132 150 120" stroke="#2A1748" stroke-width="12" fill="none" stroke-linecap="round"/>
  `, '20 -20 180 260', 'mage-svg');
}

// ---------------------------------------------------------- le domaine ---
function wallSeg(x, y, w, h, fill = '#C9BEAD') {
  let cren = '';
  for (let cx = x; cx < x + w - 6; cx += 16) cren += `<rect x="${cx}" y="${y - 9}" width="10" height="10" fill="${fill}" stroke="#5B4A3A" stroke-width="1.5"/>`;
  let bricks = '';
  for (let by = y + 10; by < y + h - 4; by += 14) {
    for (let bx = x + ((by / 14) % 2 ? 8 : 0); bx < x + w - 10; bx += 26) bricks += `<rect x="${bx + 2}" y="${by}" width="20" height="9" fill="none" stroke="#A89A86" stroke-width="1"/>`;
  }
  return `${cren}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#5B4A3A" stroke-width="2"/>${bricks}`;
}

function flag(x, y, b, big = 1) {
  const c1 = tint(b?.field || 'azur');
  const c2 = tint(b?.second || 'or');
  return `<g transform="translate(${x} ${y}) scale(${big})"><line x1="0" y1="0" x2="0" y2="-34" stroke="#5B3A1E" stroke-width="2.5"/>
    <path class="flag" d="M1 -34 Q14 -38 26 -33 Q20 -26 26 -19 Q14 -24 1 -20 Z" fill="${c1}" stroke="${c2}" stroke-width="2"/></g>`;
}

const BUILDINGS = {
  chapelle: () => `<g transform="translate(95 205)">
    <rect x="-30" y="-10" width="60" height="50" fill="#EFE3CE" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M-36 -10 L0 -40 L36 -10 Z" fill="#8E3B2E" stroke="#4A1E14" stroke-width="2"/>
    <rect x="-8" y="-62" width="16" height="30" fill="#EFE3CE" stroke="#5B4A3A" stroke-width="2"/><path d="M-11 -62 L0 -78 L11 -62 Z" fill="#8E3B2E"/>
    <circle cx="0" cy="8" r="10" fill="#6E8FD6" stroke="#5B4A3A" stroke-width="1.5"/><path d="M0 -2 V18 M-10 8 H10" stroke="#E7B416" stroke-width="1.5"/>
    <path d="M-20 40 v-16 a6 6 0 0 1 12 0 v16 Z M8 40 v-16 a6 6 0 0 1 12 0 v16 Z" fill="#C2410C" opacity=".8"/></g>`,
  moulin: () => `<g transform="translate(715 200)">
    <path d="M-16 50 L-10 -10 L10 -10 L16 50 Z" fill="#EADBC0" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M-13 -10 L0 -26 L13 -10 Z" fill="#8E3B2E"/>
    <g class="mill-blades" style="transform-origin:0px -14px"><path d="M0 -14 L-6 -60 L6 -60 Z M0 -14 L46 -20 L46 -8 Z M0 -14 L6 32 L-6 32 Z M0 -14 L-46 -8 L-46 -20 Z" fill="#F5EBD7" stroke="#5B4A3A" stroke-width="1.5"/></g>
    <circle cx="0" cy="-14" r="4" fill="#5B3A1E"/></g>`,
  tourmage: () => `<g transform="translate(640 300)">
    <rect x="-16" y="-150" width="32" height="150" fill="#B9AFCF" stroke="#3E3470" stroke-width="2"/>
    <path d="M-24 -150 L0 -215 L24 -150 Z" fill="#5B2A86" stroke="#2B1048" stroke-width="2"/>
    <text x="-6" y="-170" font-size="12" fill="#FFD54A">✦</text><text x="4" y="-185" font-size="9" fill="#FFD54A">✦</text>
    <rect x="-6" y="-120" width="12" height="18" rx="6" fill="#C77DFF" class="glow"/><rect x="-6" y="-70" width="12" height="18" rx="6" fill="#C77DFF" class="glow"/></g>`,
  tour: () => `<g transform="translate(205 300)">
    <rect x="-26" y="-130" width="52" height="130" fill="#D9CFC0" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M-34 -130 L0 -182 L34 -130 Z" fill="#C8102E" stroke="#6E0A18" stroke-width="2"/>
    <rect x="-6" y="-100" width="12" height="20" rx="6" fill="#4A3B2C"/><rect x="-6" y="-55" width="12" height="20" rx="6" fill="#4A3B2C"/></g>`,
  donjon: () => `<g transform="translate(400 300)">
    ${wallSeg(-60, -175, 120, 175, '#D9CFC0')}
    <rect x="-10" y="-150" width="20" height="28" rx="10" fill="#4A3B2C"/><rect x="-40" y="-110" width="14" height="22" rx="7" fill="#4A3B2C"/><rect x="26" y="-110" width="14" height="22" rx="7" fill="#4A3B2C"/>
    <path d="M-16 0 v-30 a16 16 0 0 1 32 0 v30 Z" fill="#5B3A1E" stroke="#2E1C0E" stroke-width="2"/></g>`,
  muraille: () => `<g>${wallSeg(150, 262, 200, 58)}${wallSeg(450, 262, 200, 58)}
    <rect x="128" y="236" width="34" height="84" fill="#D2C7B6" stroke="#5B4A3A" stroke-width="2"/><rect x="638" y="236" width="34" height="84" fill="#D2C7B6" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M124 236 h42 v-8 h-42 Z M634 236 h42 v-8 h-42 Z" fill="#C9BEAD" stroke="#5B4A3A" stroke-width="1.5"/>
    <rect x="345" y="248" width="110" height="72" fill="#CFC4B2" stroke="#5B4A3A" stroke-width="2"/>
    <path d="M372 320 v-38 a28 28 0 0 1 56 0 v38 Z" fill="#3A2A1C"/>
    <path d="M374 284 h52 M374 296 h52 M374 308 h52 M386 270 v50 M400 266 v54 M414 270 v50" stroke="#8A7A66" stroke-width="2"/></g>`,
  douves: () => `<g><path d="M110 322 Q400 316 690 322 L700 346 Q400 340 100 346 Z" fill="#4F8FB8" stroke="#2E5E80" stroke-width="2"/>
    <path class="wave" d="M140 334 q10 -4 20 0 t20 0 M240 333 q10 -4 20 0 t20 0 M520 333 q10 -4 20 0 t20 0 M600 334 q10 -4 20 0 t20 0" stroke="#A8D2E4" stroke-width="1.5" fill="none"/>
    <path d="M372 320 L428 320 L436 352 L364 352 Z" fill="#8A5A2E" stroke="#4A2E14" stroke-width="2"/>
    <path d="M370 330 h62 M368 341 h66" stroke="#5B3A1E" stroke-width="1.5"/>
    <line x1="372" y1="282" x2="366" y2="350" stroke="#3A3A3A" stroke-width="1.5"/><line x1="428" y1="282" x2="434" y2="350" stroke="#3A3A3A" stroke-width="1.5"/></g>`,
  forge: () => `<g transform="translate(720 368)">
    <rect x="-34" y="-30" width="68" height="40" fill="#8A6A4E" stroke="#3E2A1E" stroke-width="2"/>
    <path d="M-40 -30 L0 -52 L40 -30 Z" fill="#5B3A2E" stroke="#2E1C0E" stroke-width="2"/>
    <rect x="18" y="-64" width="10" height="24" fill="#6E6E6E" stroke="#333" stroke-width="1.5"/>
    <circle class="smoke-puff" cx="23" cy="-72" r="7" fill="#AAA" opacity=".6"/>
    <rect x="-22" y="-14" width="22" height="24" fill="#2E1C0E"/><rect x="-18" y="-6" width="14" height="10" fill="#FF7A1A" class="glow"/>
    <text x="16" y="2" font-size="18" text-anchor="middle">⚒️</text></g>`,
  ecurie: () => `<g transform="translate(600 360)">
    <rect x="-46" y="-24" width="92" height="40" fill="#B07A45" stroke="#4A2E14" stroke-width="2"/>
    <path d="M-52 -24 L0 -46 L52 -24 Z" fill="#7A4A26" stroke="#4A2E14" stroke-width="2"/>
    <path d="M-40 16 v-26 h24 v26 M16 16 v-26 h24 v26" fill="#5B3A1E" stroke="#2E1C0E" stroke-width="1.5"/>
    ${emoji('🐎', 0, 30, 34)}</g>`,
  puits: () => `<g transform="translate(250 382)">
    <ellipse cx="0" cy="10" rx="24" ry="8" fill="#8A8A8A" stroke="#444" stroke-width="2"/>
    <rect x="-24" y="-6" width="48" height="16" fill="#A8A29A" stroke="#444" stroke-width="2"/>
    <line x1="-20" y1="-6" x2="-20" y2="-40" stroke="#5B3A1E" stroke-width="4"/><line x1="20" y1="-6" x2="20" y2="-40" stroke="#5B3A1E" stroke-width="4"/>
    <path d="M-28 -38 L0 -54 L28 -38 Z" fill="#8E3B2E" stroke="#4A1E14" stroke-width="2"/>
    <line x1="0" y1="-38" x2="0" y2="-18" stroke="#333"/><rect x="-5" y="-18" width="10" height="9" fill="#7A5A3A"/></g>`,
  jardin: () => `<g transform="translate(505 398)">
    <rect x="-50" y="-12" width="44" height="24" fill="#6B4A2E" stroke="#3E2A1E" stroke-width="1.5"/><rect x="4" y="-12" width="44" height="24" fill="#6B4A2E" stroke="#3E2A1E" stroke-width="1.5"/>
    ${emoji('🌿', -38, -8, 16)}${emoji('🌸', -18, -6, 14)}${emoji('🥕', 16, -6, 14)}${emoji('🌱', 36, -8, 14)}</g>`,
  feux: () => `<g transform="translate(470 420)">
    <path d="M-16 6 L16 -2 M-16 -2 L16 6" stroke="#5B3A1E" stroke-width="5" stroke-linecap="round"/>
    <path class="flame" d="M0 -30 C10 -16 14 -8 8 2 C4 -6 0 -6 -2 0 C-6 -6 -12 -10 -8 -18 C-6 -12 -2 -12 0 -30 Z" fill="#FF8A1A"/>
    <path class="flame" d="M0 -18 C5 -10 6 -4 3 2 C1 -2 -1 -2 -2 2 C-4 -4 -4 -10 0 -18 Z" fill="#FFE066"/></g>`,
  palissade: () => {
    let s = '';
    const stake = (x, y) => `<path d="M${x - 5} ${y} v-34 l5 -8 l5 8 v34 Z" fill="#9A6A3A" stroke="#4A2E14" stroke-width="1.5"/>`;
    for (let x = 18; x < 190; x += 13) s += stake(x, 446);
    for (let x = 615; x < 790; x += 13) s += stake(x, 446);
    return `<g>${s}<path d="M10 425 H195 M608 425 H795" stroke="#4A2E14" stroke-width="3"/></g>`;
  },
};

const FRIEND_SPOT = {
  conj: ['🐉', 755, 312, 38], gram: ['🗿', 320, 300, 34], ortho: ['🐍', 540, 336, 26], vocab: ['👹', 575, 428, 30], lect: ['👻', 150, 150, 32],
};

export function castleSVG({ owned = {}, blason, freed = {}, hero = '🤴', night = false } = {}) {
  const sky = uid('csky');
  const has = (k) => !!owned[k];
  const layers = [];
  if (has('chapelle')) layers.push(BUILDINGS.chapelle());
  if (has('moulin')) layers.push(BUILDINGS.moulin());
  if (has('tourmage')) layers.push(BUILDINGS.tourmage());
  if (has('tour')) layers.push(BUILDINGS.tour());
  if (has('donjon')) layers.push(BUILDINGS.donjon());
  if (has('bannieres')) {
    if (has('donjon')) layers.push(flag(400, 136, blason, 1.4));
    if (has('tour')) layers.push(flag(205, 120, blason));
    if (has('tourmage')) layers.push(flag(640, 88, blason, 0.9));
    if (!has('donjon') && !has('tour')) layers.push(flag(160, 330, blason, 1.2), flag(300, 340, blason, 1.2));
  }
  if (has('muraille')) layers.push(BUILDINGS.muraille());
  if (has('douves') && has('muraille')) layers.push(BUILDINGS.douves());
  const front = [];
  if (has('ecurie')) front.push(BUILDINGS.ecurie());
  if (has('forge')) front.push(BUILDINGS.forge());
  if (has('puits')) front.push(BUILDINGS.puits());
  if (has('jardin')) front.push(BUILDINGS.jardin());
  if (has('feux')) front.push(BUILDINGS.feux());
  const c1 = tint(blason?.field || 'azur');
  const c2 = tint(blason?.second || 'or');
  const tent = `<g transform="translate(95 395)">
    <path d="M-38 30 L0 -34 L38 30 Z" fill="${c1}" stroke="#3E2A1E" stroke-width="2"/>
    <path d="M-12 30 L0 -34 L12 30 Z" fill="${c2}"/>
    <path d="M-6 30 L0 4 L6 30 Z" fill="#2E1C0E"/>
    <line x1="0" y1="-34" x2="0" y2="-48" stroke="#5B3A1E" stroke-width="2"/><path class="flag" d="M0 -48 L14 -44 L0 -40 Z" fill="${c2}"/></g>`;
  const friends = Object.keys(FRIEND_SPOT).filter((k) => freed[k]).map((k) => {
    const [e, x, y, s] = FRIEND_SPOT[k];
    return `<g class="friend">${emoji(e, x, y, s)}${emoji('💜', x + s * 0.45, y - s * 0.45, s * 0.35)}</g>`;
  }).join('');
  return svg(`
    <defs>${lin(sky, night ? [[0, '#0B1030'], [1, '#3E3470']] : [[0, '#6FB7EC'], [0.7, '#CDEBFA'], [1, '#FFF4DC']])}</defs>
    <rect width="800" height="450" fill="url(#${sky})"/>
    <circle cx="690" cy="70" r="30" fill="#FFE27A" opacity=".95"/><circle cx="690" cy="70" r="44" fill="#FFE27A" opacity=".25"/>
    <g class="cloud"><ellipse cx="160" cy="70" rx="46" ry="16" fill="#fff" opacity=".9"/><ellipse cx="190" cy="60" rx="30" ry="16" fill="#fff" opacity=".9"/></g>
    <g class="cloud slow"><ellipse cx="470" cy="50" rx="56" ry="15" fill="#fff" opacity=".8"/><ellipse cx="440" cy="42" rx="30" ry="14" fill="#fff" opacity=".8"/></g>
    <path d="M0 250 Q140 175 300 225 T600 205 T800 215 L800 450 L0 450 Z" fill="#9CC77E"/>
    <path d="M0 300 Q200 270 400 292 T800 285 L800 450 L0 450 Z" fill="#6FAE58"/>
    ${layers.join('')}
    <path d="M0 340 Q200 330 400 345 T800 338 L800 450 L0 450 Z" fill="#5E9B4A"/>
    ${tent}
    ${front.join('')}
    ${has('palissade') ? BUILDINGS.palissade() : ''}
    ${has('licorne') ? `<g class="unicorn">${emoji('🦄', 330, 410, 38)}</g>` : ''}
    ${has('dragon') ? `<g class="pet-dragon">${emoji('🐲', 560, 110, 40)}</g>` : ''}
    ${friends}
    <g class="hero-stand">${emoji(hero, 400, 412, 44)}</g>
  `, '0 0 800 450', 'castle-svg', 'xMidYMid meet');
}
