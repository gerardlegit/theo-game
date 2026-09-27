// ============================================================================
// ART DE LA QUÊTE — tous les dessins du jeu sont en SVG, générés en code.
//
// - Chaque appel crée ses propres identifiants de dégradés (uid), pour que
//   plusieurs copies d'un même dessin puissent vivre dans la page.
// - Les robots ont deux humeurs : les éléments .angry sont visibles quand
//   OMÉGA les contrôle, les éléments .happy quand ils sont libérés
//   (classe .freed sur le conteneur). La couleur des yeux (.eye / .eye-s /
//   .eye-stop) passe du rouge au vert via le CSS.
// - Les décors utilisent un générateur aléatoire à graine fixe : ils sont
//   identiques d'une partie à l'autre.
// ============================================================================

let uidCounter = 0;
const uid = (p) => `${p}${++uidCounter}`;

function rng(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n) => Math.round(n * 10) / 10;
const polar = (r, a) => [f1(Math.cos(a) * r), f1(Math.sin(a) * r)];

function svg(inner, vb, cls = '', par = 'xMidYMid meet') {
  return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="${par}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

function lin(id, stops, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</linearGradient>`;
}

function rad(id, stops, cx = '50%', cy = '50%', r = '50%') {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</radialGradient>`;
}

/** Contour d'une roue dentée centrée sur (0, 0). */
export function gearPath(r, teeth, depth = 6) {
  const step = (Math.PI * 2) / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    pts.push(polar(r, a - step * 0.27), polar(r + depth, a - step * 0.13),
      polar(r + depth, a + step * 0.13), polar(r, a + step * 0.27));
  }
  return 'M' + pts.map((p) => p.join(' ')).join(' L') + 'Z';
}

/** Spirale d'Archimède centrée sur (0, 0). */
function spiralPath(turns, maxR) {
  const pts = [];
  const n = turns * 40;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * turns * Math.PI * 2;
    const r = (i / n) * maxR;
    pts.push(polar(r, t));
  }
  return 'M' + pts.map((p) => p.join(' ')).join(' L');
}

function star(cx, cy, r, fill, extra = '') {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${f1(cx + Math.cos(a) * rr)},${f1(cy + Math.sin(a) * rr)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`;
}

/* ==========================================================================
   HÉROS — style « chibi » : grosse tête, petit corps. viewBox 0 0 160 220.
   ========================================================================== */

function heroLegs(pants, shoes) {
  return `
  <ellipse cx="80" cy="210" rx="42" ry="7" fill="#000" opacity=".35"/>
  <rect x="62" y="158" width="15" height="40" rx="6" fill="${pants}"/>
  <rect x="83" y="158" width="15" height="40" rx="6" fill="${pants}"/>
  <path d="M57 208 Q56 194 68 194 Q79 194 79 201 V208 Z" fill="${shoes}"/>
  <path d="M81 208 V201 Q81 194 92 194 Q104 194 103 208 Z" fill="${shoes}"/>`;
}

function heroTorso(fill) {
  return `<path d="M55 117 Q80 107 105 117 L111 166 Q80 175 49 166 Z" fill="${fill}"/>`;
}

function heroArms(sleeve, skin) {
  return `
  <path d="M58 121 Q46 136 47 154" fill="none" stroke="${sleeve}" stroke-width="13" stroke-linecap="round"/>
  <path d="M102 121 Q115 132 120 146" fill="none" stroke="${sleeve}" stroke-width="13" stroke-linecap="round"/>
  <circle cx="47" cy="158" r="7.5" fill="${skin}"/>`;
}

function heroHead(skin, shade) {
  return `
  <rect x="73" y="100" width="14" height="18" rx="5" fill="${shade}"/>
  <circle cx="43" cy="78" r="7" fill="${skin}"/>
  <circle cx="117" cy="78" r="7" fill="${skin}"/>
  <circle cx="80" cy="72" r="38" fill="${skin}"/>
  <path d="M112 86 Q104 106 80 110 Q101 101 112 86Z" fill="${shade}" opacity=".45"/>`;
}

function heroFace(brow) {
  return `
  <g class="blink">
    <ellipse cx="66" cy="77" rx="6.4" ry="7.8" fill="#1B1633"/>
    <ellipse cx="94" cy="77" rx="6.4" ry="7.8" fill="#1B1633"/>
    <circle cx="68.4" cy="73.8" r="2.5" fill="#fff"/>
    <circle cx="96.4" cy="73.8" r="2.5" fill="#fff"/>
    <circle cx="64.2" cy="80.4" r="1.2" fill="#fff" opacity=".8"/>
    <circle cx="92.2" cy="80.4" r="1.2" fill="#fff" opacity=".8"/>
  </g>
  <path d="M58 64 Q65 61 72 65.5" stroke="${brow}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M88 65.5 Q95 61 102 64" stroke="${brow}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <ellipse cx="56" cy="89" rx="6" ry="3.4" fill="#FF6F91" opacity=".42"/>
  <ellipse cx="104" cy="89" rx="6" ry="3.4" fill="#FF6F91" opacity=".42"/>
  <path d="M74 92 Q80 98 86 92" stroke="#6E2436" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
}

function novaArt(id) {
  const skin = '#F6CBA5', shade = '#DFA079', hair = '#D4572B', hairS = '#9E3A1A';
  return `
  <defs>
    ${lin(`${id}s`, [[0, '#FF9A52'], [1, '#D9621C']])}
    ${rad(`${id}l`, [[0, '#F2FFFF'], [0.45, '#35F2FF'], [1, '#0A6C8C']], '35%', '35%', '70%')}
    ${rad(`${id}g`, [[0, '#35F2FF', 0.9], [1, '#35F2FF', 0]])}
  </defs>
  <ellipse cx="80" cy="64" rx="42" ry="36" fill="${hairS}"/>
  ${heroLegs('#3A3350', '#231F33')}
  ${heroTorso(`url(#${id}s)`)}
  <path d="M68 113 L80 127 L92 113" fill="none" stroke="#B8520F" stroke-width="3"/>
  <line x1="80" y1="127" x2="80" y2="150" stroke="#B8520F" stroke-width="2"/>
  <path d="M91 128 l-5 8 h4 l-3 7 l8 -10 h-4 l3 -5z" fill="#35F2FF"/>
  <rect x="49" y="149" width="62" height="9" rx="3" fill="#6B3F1D"/>
  <rect x="53" y="151" width="12" height="12" rx="3" fill="#8A5428"/>
  <rect x="95" y="151" width="12" height="12" rx="3" fill="#8A5428"/>
  <rect x="75" y="149" width="10" height="9" rx="2" fill="#FFD23F"/>
  ${heroArms('#E8732B', skin)}
  <g transform="rotate(-28 121 148)">
    <circle cx="121" cy="110" r="14" fill="url(#${id}g)" class="pulse"/>
    <rect x="118" y="116" width="6" height="36" rx="3" fill="#9AA3B5"/>
    <path d="M114 118 A8 8 0 1 1 128 118 L124 114 L118 114 Z" fill="#9AA3B5"/>
    <circle cx="121" cy="110" r="3" fill="#E9FFFF"/>
  </g>
  <circle cx="120" cy="149" r="7.5" fill="${skin}"/>
  ${heroHead(skin, shade)}
  ${heroFace('#7A2A12')}
  <circle cx="80" cy="30" r="13" fill="${hair}"/>
  <path d="M73 24 Q80 19 87 24" stroke="#F08A5D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M42 72 Q38 32 80 30 Q122 32 118 72 Q113 58 104 54 Q98 63 90 56 Q84 65 76 56 Q68 64 62 56 Q51 60 42 72 Z" fill="${hair}"/>
  <path d="M52 44 Q62 36 74 35" stroke="#F08A5D" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
  <path d="M40 58 Q80 42 120 58" stroke="#2B2440" stroke-width="5" fill="none"/>
  <circle cx="65" cy="49" r="10" fill="url(#${id}l)" stroke="#3B3450" stroke-width="3.5"/>
  <circle cx="95" cy="49" r="10" fill="url(#${id}l)" stroke="#3B3450" stroke-width="3.5"/>
  <circle cx="62" cy="46" r="2.5" fill="#fff"/>
  <circle cx="92" cy="46" r="2.5" fill="#fff"/>`;
}

function kaiArt(id) {
  const skin = '#8D5A3B', shade = '#6E4127', hood = '#2F4BFF', hoodS = '#1F32B8';
  return `
  <defs>
    ${lin(`${id}s`, [[0, '#3D5BFF'], [1, '#2238C9']])}
    ${lin(`${id}t`, [[0, '#35F2FF', 0.45], [1, '#35F2FF', 0.1]])}
  </defs>
  ${heroLegs('#232042', '#EDEFFF')}
  <path d="M57 205 H79 M81 205 H103" stroke="#35F2FF" stroke-width="3"/>
  ${heroTorso(`url(#${id}s)`)}
  <path d="M63 146 H97 L93 162 H67 Z" fill="${hoodS}" opacity=".7"/>
  <path d="M58 131 H66 L70 136 H76" stroke="#35F2FF" stroke-width="1.8" fill="none"/>
  <circle cx="76" cy="136" r="2" fill="#35F2FF"/>
  <path d="M104 138 H96 L92 142 H88" stroke="#35F2FF" stroke-width="1.8" fill="none"/>
  <circle cx="88" cy="142" r="2" fill="#35F2FF"/>
  ${heroArms(hood, skin)}
  <path d="M55 117 Q80 134 105 117 Q101 103 80 103 Q59 103 55 117Z" fill="${hoodS}"/>
  <path d="M74 121 L72 140 M86 121 L88 140" stroke="#EDEFFF" stroke-width="2" stroke-linecap="round"/>
  <g class="holo" transform="rotate(-12 124 134)">
    <rect x="108" y="112" width="32" height="42" rx="4" fill="url(#${id}t)" stroke="#35F2FF" stroke-width="2"/>
    <path d="M113 121 H135 M113 128 H129 M113 135 H133 M113 142 H125" stroke="#B9FBFF" stroke-width="2" stroke-linecap="round"/>
  </g>
  <circle cx="120" cy="149" r="7.5" fill="${skin}"/>
  ${heroHead(skin, shade)}
  ${heroFace('#1C1420')}
  <path d="M42 68 Q38 50 46 44 Q44 32 56 30 Q60 20 72 24 Q80 16 90 23 Q102 20 106 30 Q118 32 116 44 Q124 52 118 68 Q114 56 104 52 Q92 58 80 52 Q68 58 56 52 Q46 56 42 68Z" fill="#1C1420"/>
  <path d="M60 32 Q66 27 72 29 M86 26 Q92 24 98 28" stroke="#3E3140" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M39 72 Q38 20 80 20 Q122 20 121 72" stroke="#39FF88" stroke-width="5" fill="none"/>
  <rect x="31" y="62" width="15" height="26" rx="7" fill="#1D2A3A" stroke="#39FF88" stroke-width="2.5"/>
  <rect x="114" y="62" width="15" height="26" rx="7" fill="#1D2A3A" stroke="#39FF88" stroke-width="2.5"/>`;
}

function ziaArt(id) {
  const skin = '#C98D5E', shade = '#A86E43', hair = '#3A2218', hairS = '#26150F';
  const braid = (x) => [0, 1, 2, 3, 4, 5].map((i) =>
    `<ellipse cx="${x + (i % 2 ? 1 : -1)}" cy="${98 + i * 11}" rx="7.5" ry="7" fill="${hair}" stroke="${hairS}" stroke-width="1.5"/>`
  ).join('') + `<circle cx="${x}" cy="${166}" r="4.5" fill="#FF4FD8" class="glow-dot"/>`;
  return `
  <defs>
    ${lin(`${id}s`, [[0, '#9B5CFF'], [1, '#6A2FD4']])}
    ${lin(`${id}c`, [[0, '#FF4FD8'], [0.5, '#C77DFF'], [1, '#35F2FF']])}
    ${rad(`${id}g`, [[0, '#FF4FD8', 0.9], [1, '#FF4FD8', 0]])}
  </defs>
  <ellipse cx="80" cy="70" rx="44" ry="42" fill="${hairS}"/>
  <path d="M56 116 L32 200 Q80 213 128 200 L104 116Z" fill="#3E1A8C"/>
  <path d="M32 200 Q80 213 128 200" stroke="#FF4FD8" stroke-width="2" fill="none" opacity=".7"/>
  ${star(46, 176, 3, '#FFD23F')}${star(112, 186, 2.5, '#FFD23F')}${star(98, 164, 2, '#FFD23F')}
  ${heroLegs('#1E4D5C', '#2A1B3D')}
  ${heroTorso(`url(#${id}s)`)}
  <path d="M68 114 L80 128 L92 114" fill="none" stroke="#FFD23F" stroke-width="2.5"/>
  <rect x="50" y="148" width="60" height="7" rx="3" fill="#FFD23F"/>
  <circle cx="80" cy="151.5" r="5" fill="#FF4FD8" stroke="#FFD23F" stroke-width="2"/>
  ${heroArms('#8547F0', skin)}
  <line x1="124" y1="206" x2="124" y2="88" stroke="#8B5A2B" stroke-width="5" stroke-linecap="round"/>
  <circle cx="124" cy="76" r="20" fill="url(#${id}g)" class="pulse"/>
  <polygon points="124,56 134,76 124,96 114,76" fill="url(#${id}c)" stroke="#fff" stroke-width="1.5"/>
  <polygon points="124,60 128,76 124,70" fill="#fff" opacity=".7"/>
  <circle cx="122" cy="149" r="7.5" fill="${skin}"/>
  ${heroHead(skin, shade)}
  ${heroFace(hairS)}
  <path d="M42 72 Q38 32 80 30 Q122 32 118 72 Q114 52 98 46 Q80 58 58 50 Q46 56 42 72Z" fill="${hair}"/>
  <path d="M56 40 Q70 32 86 33" stroke="#5A3A2A" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${star(106, 46, 7, '#FFD23F', 'stroke="#C98A00" stroke-width="1"')}
  ${braid(44)}${braid(116)}`;
}

const HERO_ART = { nova: novaArt, kai: kaiArt, zia: ziaArt };

/** Un héros entier, ou seulement sa tête (crop) pour les portraits. */
export function heroSVG(key, crop = false) {
  const id = uid('h');
  const vb = crop ? '32 18 96 96' : '0 0 160 220';
  return svg(HERO_ART[key](id), vb, `hero-art hero-${key}`);
}

/* ==========================================================================
   BIP — le petit robot compagnon. viewBox 0 0 100 110.
   ========================================================================== */

export function bipSVG() {
  const id = uid('b');
  return svg(`
  <defs>
    ${rad(`${id}b`, [[0, '#FFFFFF'], [0.7, '#D6E8F5'], [1, '#8FB3CC']], '38%', '32%', '70%')}
    ${rad(`${id}f`, [[0, '#B9FBFF'], [0.5, '#35F2FF', 0.8], [1, '#35F2FF', 0]])}
  </defs>
  <ellipse class="bip-flame" cx="50" cy="94" rx="9" ry="12" fill="url(#${id}f)"/>
  <line x1="50" y1="26" x2="50" y2="12" stroke="#5D7A91" stroke-width="3"/>
  <circle class="bip-light" cx="50" cy="10" r="5" fill="#35F2FF"/>
  <circle cx="18" cy="56" r="7" fill="#1FB5C7" stroke="#12798A" stroke-width="2"/>
  <circle cx="82" cy="56" r="7" fill="#1FB5C7" stroke="#12798A" stroke-width="2"/>
  <circle cx="50" cy="56" r="31" fill="url(#${id}b)" stroke="#6F8FA6" stroke-width="2"/>
  <rect x="29" y="42" width="42" height="27" rx="11" fill="#0D1B2A"/>
  <g class="blink">
    <path d="M36 57 Q41 49 46 57" stroke="#35F2FF" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M54 57 Q59 49 64 57" stroke="#35F2FF" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  </g>
  <path d="M45 62 Q50 66 55 62" stroke="#35F2FF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="40" cy="36" rx="8" ry="4" fill="#fff" opacity=".8" transform="rotate(-20 40 36)"/>
  <circle cx="32" cy="75" r="2.5" fill="#FF6F91" opacity=".6"/>
  <circle cx="68" cy="75" r="2.5" fill="#FF6F91" opacity=".6"/>`, '0 0 100 110', 'bip-art');
}

/* ==========================================================================
   ROBOTS GARDIENS — viewBox 0 0 240 260, sol à y≈250.
   ========================================================================== */

function boulon(id) {
  const wheels = [76, 98, 120, 142, 164].map((x) =>
    `<circle cx="${x}" cy="226" r="10" fill="#5A5662" stroke="#1D1B21" stroke-width="3"/><circle cx="${x}" cy="226" r="3" fill="#1D1B21"/>`).join('');
  const arm = (m) => `
    <path d="M${m(62)} 140 Q${m(34)} 152 ${m(30)} 184" stroke="#4D4852" stroke-width="13" fill="none" stroke-linecap="round"/>
    <circle cx="${m(62)}" cy="140" r="12" fill="#6A6470" stroke="#2B272E" stroke-width="2"/>
    <circle cx="${m(30)}" cy="186" r="8" fill="#6A6470"/>
    <path d="M${m(24)} 190 Q${m(12)} 208 ${m(26)} 218" stroke="#8A8390" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M${m(36)} 191 Q${m(46)} 208 ${m(34)} 218" stroke="#8A8390" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const leaf = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="#6FBF4A" transform="rotate(${r} ${x} ${y})"/>`;
  return `
  <defs>
    ${lin(`${id}r`, [[0, '#E08A4A'], [0.5, '#A94B20'], [1, '#6A2A10']], 1, 1)}
  </defs>
  <ellipse cx="120" cy="250" rx="80" ry="8" fill="#000" opacity=".4"/>
  <rect x="54" y="206" width="132" height="40" rx="20" fill="#26242B"/>
  <rect x="60" y="212" width="120" height="28" rx="14" fill="#3A3740"/>
  ${wheels}
  ${arm((x) => x)}${arm((x) => 240 - x)}
  <rect x="58" y="108" width="124" height="104" rx="24" fill="url(#${id}r)" stroke="#4A1F0C" stroke-width="3"/>
  <path d="M68 178 q10 -8 22 0 q8 10 -4 16 q-14 4 -18 -16z" fill="#6A2A10" opacity=".55"/>
  <path d="M152 124 q10 -2 14 8 q0 10 -10 8 q-8 -6 -4 -16z" fill="#6A2A10" opacity=".5"/>
  <rect x="90" y="130" width="60" height="44" rx="8" fill="#2A1A14" stroke="#4A2A1A" stroke-width="2"/>
  ${[140, 148, 156, 164].map((y) => `<line x1="98" y1="${y}" x2="142" y2="${y}" stroke="#5C3A28" stroke-width="3.5" stroke-linecap="round"/>`).join('')}
  <circle class="blinkl" cx="102" cy="192" r="5" fill="#FF3B3B"/>
  <circle class="blinkl d2" cx="120" cy="192" r="5" fill="#FFC93C"/>
  <circle class="blinkl d3" cx="138" cy="192" r="5" fill="#3DFF88"/>
  ${[[68, 118], [172, 118], [68, 202], [172, 202]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#F0A56A"/>`).join('')}
  <path d="M58 132 q4 -22 22 -20 q8 -12 20 -4 q-8 10 -20 12 q-12 10 -22 12z" fill="#4E8A3A"/>
  ${leaf(66, 116, -30)}${leaf(84, 108, 20)}
  <rect x="106" y="98" width="28" height="14" rx="4" fill="#3A3740"/>
  <rect x="80" y="44" width="80" height="60" rx="18" fill="url(#${id}r)" stroke="#4A1F0C" stroke-width="3"/>
  <circle cx="87" cy="74" r="4.5" fill="#F0A56A"/><circle cx="153" cy="74" r="4.5" fill="#F0A56A"/>
  <circle cx="120" cy="74" r="22" fill="#1A1016" stroke="#3A2A2A" stroke-width="4"/>
  <circle class="eye" cx="120" cy="74" r="13"/>
  <circle cx="120" cy="74" r="5" fill="#1A1016"/>
  <circle cx="114" cy="68" r="3.2" fill="#fff" opacity=".85"/>
  <polygon class="angry" points="94,46 147,46 147,58 94,70" fill="#8A3A18"/>
  <path class="happy" d="M96 82 Q120 62 144 82 L144 98 L96 98Z" fill="#B5541F"/>
  <path d="M104 44 L100 26 L90 16" stroke="#4D4852" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle class="eye blinkl" cx="89" cy="15" r="5.5"/>
  <path d="M84 58 Q68 82 76 110 Q82 132 70 152" stroke="#1F3B22" stroke-width="4" fill="none" stroke-linecap="round"/>
  ${leaf(72, 92, 40)}${leaf(78, 124, -20)}${leaf(71, 146, 30)}
  <path d="M156 60 Q170 80 166 102" stroke="#1F3B22" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  ${leaf(168, 84, -40)}`;
}

function engrenox(id) {
  const arm = (m) => `
    <path d="M${m(44)} 112 L${m(34)} 180" stroke="#4B5663" stroke-width="16" stroke-linecap="round"/>
    <circle cx="${m(44)}" cy="110" r="20" fill="url(#${id}m)" stroke="#2A3039" stroke-width="3"/>
    <circle cx="${m(44)}" cy="110" r="6" fill="#2A3039"/>
    <path d="M${m(22)} 186 Q${m(18)} 214 ${m(34)} 220" stroke="#2A3039" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M${m(46)} 186 Q${m(52)} 214 ${m(36)} 220" stroke="#2A3039" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="${m(34)}" cy="182" r="10" fill="#FFC93C" stroke="#2A3039" stroke-width="3"/>`;
  return `
  <defs>
    ${lin(`${id}m`, [[0, '#B4C0CC'], [0.5, '#7D8A98'], [1, '#48525E']], 1, 1)}
    <pattern id="${id}h" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="20" height="20" fill="#FFC93C"/><rect width="10" height="20" fill="#1A1A1A"/>
    </pattern>
  </defs>
  <ellipse cx="120" cy="250" rx="84" ry="8" fill="#000" opacity=".4"/>
  <rect x="54" y="40" width="22" height="62" rx="4" fill="#3D4652"/>
  <rect x="50" y="34" width="30" height="10" rx="3" fill="#2A3039"/>
  <circle class="smoke" cx="65" cy="26" r="9" fill="#9AA0A8"/>
  <circle class="smoke d2" cx="65" cy="26" r="9" fill="#9AA0A8"/>
  <circle class="smoke d3" cx="65" cy="26" r="9" fill="#9AA0A8"/>
  <rect x="80" y="196" width="28" height="42" rx="6" fill="#3D4652"/>
  <rect x="132" y="196" width="28" height="42" rx="6" fill="#3D4652"/>
  <path d="M84 206 H104 M84 214 H104 M136 206 H156 M136 214 H156" stroke="#7D8A98" stroke-width="3"/>
  <rect x="70" y="232" width="46" height="16" rx="6" fill="#2A3039"/>
  <rect x="124" y="232" width="46" height="16" rx="6" fill="#2A3039"/>
  ${arm((x) => x)}${arm((x) => 240 - x)}
  <path d="M48 94 L192 94 L178 206 L62 206 Z" fill="url(#${id}m)" stroke="#2A3039" stroke-width="3" stroke-linejoin="round"/>
  <path d="M59.5 182 L180.5 182 L178 206 L62 206 Z" fill="url(#${id}h)" stroke="#2A3039" stroke-width="3"/>
  ${[64, 88, 152, 176].map((x) => `<circle cx="${x}" cy="104" r="3.5" fill="#2A3039"/>`).join('')}
  <circle cx="120" cy="140" r="33" fill="#161B22" stroke="#2A3039" stroke-width="5"/>
  <g transform="translate(120 140)"><g class="spin">
    <circle r="30" fill="none"/>
    <path d="${gearPath(21, 10, 6)}" fill="#E8B53A" stroke="#8A6410" stroke-width="2"/>
    <circle r="8" fill="#161B22"/><circle r="3" fill="#E8B53A"/>
  </g></g>
  <rect x="94" y="52" width="52" height="44" rx="10" fill="url(#${id}m)" stroke="#2A3039" stroke-width="3"/>
  <rect x="102" y="64" width="36" height="12" rx="6" fill="#161B22"/>
  <rect class="eye" x="105" y="67" width="30" height="6" rx="3"/>
  <path class="angry" d="M100 58 L117 65 M140 58 L123 65" stroke="#1A1F26" stroke-width="4" stroke-linecap="round"/>
  <path class="angry" d="M109 86 H131" stroke="#1A1F26" stroke-width="3.5" stroke-linecap="round"/>
  <path class="happy" d="M108 83 Q120 92 132 83" stroke="#1A1F26" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle class="eye blinkl" cx="120" cy="47" r="6"/>`;
}

function hypnos(id) {
  return `
  <defs>
    ${lin(`${id}p`, [[0, '#8C4BF0'], [1, '#3A1478']], 1, 1)}
    <clipPath id="${id}c"><rect x="80" y="45" width="80" height="58" rx="12"/></clipPath>
  </defs>
  <ellipse class="eye hover-glow" cx="120" cy="248" rx="44" ry="8" opacity=".45"/>
  <g class="float">
    <path d="M100 200 L120 238 L140 200Z" fill="#2A0F5C"/>
    <path d="M98 128 Q72 142 66 172" stroke="#5A2AB8" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M66 172 l-8 10 M66 172 l0 13 M66 172 l8 10" stroke="#5A2AB8" stroke-width="4" stroke-linecap="round"/>
    <path d="M142 128 Q170 122 178 96" stroke="#5A2AB8" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M178 96 l-10 -8 M178 96 l2 -13 M178 96 l12 -6" stroke="#5A2AB8" stroke-width="4" stroke-linecap="round"/>
    <g class="flicker">${star(192, 80, 5, '#FF4FD8')}${star(166, 74, 3.5, '#FF4FD8')}</g>
    <path d="M94 118 Q120 104 146 118 L138 204 Q120 214 102 204Z" fill="url(#${id}p)" stroke="#1D0A42" stroke-width="3"/>
    <circle cx="120" cy="150" r="13" fill="#1D0A42"/>
    <path class="eye-s" d="M109 150 Q120 141 131 150 Q120 159 109 150Z" fill="none" stroke-width="2"/>
    <circle class="eye" cx="120" cy="150" r="3.5"/>
    <path d="M104 176 Q120 184 136 176" stroke="#1D0A42" stroke-width="3" fill="none"/>
    <rect x="112" y="104" width="16" height="12" fill="#1D0A42"/>
    <path d="M92 40 L76 12 M148 40 L164 12" stroke="#5A2AB8" stroke-width="4" stroke-linecap="round"/>
    <circle class="eye blinkl" cx="76" cy="11" r="5"/>
    <circle class="eye blinkl d2" cx="164" cy="11" r="5"/>
    <rect x="70" y="36" width="100" height="76" rx="20" fill="#2A1860" stroke="#12072E" stroke-width="3"/>
    <rect x="80" y="45" width="80" height="58" rx="12" fill="#07031A"/>
    <g clip-path="url(#${id}c)">
      <g class="angry"><g transform="translate(120 74)"><g class="spin">
        <circle r="46" fill="none"/>
        <path class="eye-s" d="${spiralPath(4, 44)}" fill="none" stroke-width="3.5" stroke-linecap="round"/>
      </g></g></g>
      <g class="happy">
        <path class="eye-s" d="M98 74 Q104 64 110 74 M130 74 Q136 64 142 74" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path class="eye-s" d="M108 86 Q120 96 132 86" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
    </g>
    <path d="M84 50 L104 50 L90 72Z" fill="#fff" opacity=".08"/>
  </g>`;
}

function labyrinthor(id) {
  const cube = (x, y, s, d) => `<g class="float ${d}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="2" fill="rgba(53,242,255,.12)" stroke="#35F2FF" stroke-width="2"/></g>`;
  return `
  <defs>
    ${lin(`${id}b`, [[0, '#123352'], [1, '#081626']])}
  </defs>
  <ellipse cx="120" cy="250" rx="80" ry="8" fill="#000" opacity=".4"/>
  ${cube(24, 70, 16, '')}${cube(202, 54, 12, 'd2')}${cube(208, 150, 18, 'd3')}
  <rect x="88" y="196" width="24" height="40" rx="5" fill="url(#${id}b)" stroke="#35F2FF" stroke-width="2"/>
  <rect x="128" y="196" width="24" height="40" rx="5" fill="url(#${id}b)" stroke="#35F2FF" stroke-width="2"/>
  <rect x="82" y="232" width="36" height="14" rx="4" fill="#0A1A2A" stroke="#35F2FF" stroke-width="2"/>
  <rect x="122" y="232" width="36" height="14" rx="4" fill="#0A1A2A" stroke="#35F2FF" stroke-width="2"/>
  <rect x="40" y="116" width="24" height="64" rx="8" fill="url(#${id}b)" stroke="#35F2FF" stroke-width="2"/>
  <rect x="176" y="116" width="24" height="64" rx="8" fill="url(#${id}b)" stroke="#35F2FF" stroke-width="2"/>
  <rect x="35" y="176" width="34" height="28" rx="8" fill="#0A1A2A" stroke="#35F2FF" stroke-width="2.5"/>
  <rect x="171" y="176" width="34" height="28" rx="8" fill="#0A1A2A" stroke="#35F2FF" stroke-width="2.5"/>
  <rect x="62" y="108" width="116" height="96" rx="14" fill="url(#${id}b)" stroke="#35F2FF" stroke-width="3"/>
  <path d="M78 122 H162 V190 H78 V138 H146 V174 H94 V154 H128" stroke="#35F2FF" stroke-width="3" fill="none" opacity=".55" stroke-linejoin="round"/>
  <circle class="eye blinkl" cx="128" cy="154" r="5"/>
  <path d="M86 62 Q52 60 46 22 Q66 42 90 50Z" fill="#DFF6FF" stroke="#35F2FF" stroke-width="2"/>
  <path d="M154 62 Q188 60 194 22 Q174 42 150 50Z" fill="#DFF6FF" stroke="#35F2FF" stroke-width="2"/>
  <path d="M84 72 L70 66 L84 84Z M156 72 L170 66 L156 84Z" fill="#123352" stroke="#35F2FF" stroke-width="2"/>
  <rect x="82" y="46" width="76" height="66" rx="14" fill="url(#${id}b)" stroke="#35F2FF" stroke-width="3"/>
  <rect class="eye" x="97" y="66" width="15" height="10" rx="2"/>
  <rect class="eye" x="128" y="66" width="15" height="10" rx="2"/>
  <path class="angry" d="M95 58 L114 65 M145 58 L126 65" stroke="#35F2FF" stroke-width="3.5" stroke-linecap="round"/>
  <path class="happy" d="M95 61 Q104 54 113 61 M127 61 Q136 54 145 61" stroke="#35F2FF" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <rect x="98" y="84" width="44" height="22" rx="10" fill="#1A4468" stroke="#35F2FF" stroke-width="2"/>
  <ellipse cx="110" cy="95" rx="4" ry="3" fill="#07121E"/>
  <ellipse cx="130" cy="95" rx="4" ry="3" fill="#07121E"/>
  <circle cx="120" cy="108" r="7" fill="none" stroke="#FFD23F" stroke-width="3"/>`;
}

function sentinelle(id) {
  return `
  <defs>
    ${rad(`${id}m`, [[0, '#5A6278'], [0.6, '#2A2F3D'], [1, '#12151E']], '35%', '30%', '75%')}
    <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1">
      <stop class="eye-stop" offset="0" stop-opacity=".55"/><stop class="eye-stop" offset="1" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${id}k"><circle cx="120" cy="116" r="32"/></clipPath>
  </defs>
  <g class="sweep-beam"><polygon points="106,160 134,160 200,262 40,262" fill="url(#${id}l)"/></g>
  <g class="float">
    <path d="M82 92 L50 72 M158 92 L190 72" stroke="#3A3F4F" stroke-width="7" stroke-linecap="round"/>
    <ellipse class="prop" cx="50" cy="68" rx="24" ry="4" fill="#9AA3B5" opacity=".75"/>
    <ellipse class="prop" cx="190" cy="68" rx="24" ry="4" fill="#9AA3B5" opacity=".75"/>
    <line x1="120" y1="62" x2="120" y2="38" stroke="#3A3F4F" stroke-width="4"/>
    <circle class="eye blinkl" cx="120" cy="36" r="5"/>
    <circle cx="120" cy="116" r="56" fill="url(#${id}m)" stroke="#0C0E15" stroke-width="3"/>
    <path d="M68 104 Q120 92 172 104 M70 134 Q120 146 170 134" stroke="#0C0E15" stroke-width="2" fill="none" opacity=".6"/>
    <g transform="translate(120 116)"><g class="spin-slow">
      <circle r="74" fill="none" stroke="#596075" stroke-width="3" stroke-dasharray="16 9"/>
      <circle class="eye" cx="74" cy="0" r="4"/><circle class="eye" cx="-74" cy="0" r="4"/>
      <circle class="eye" cx="0" cy="74" r="4"/><circle class="eye" cx="0" cy="-74" r="4"/>
    </g></g>
    <circle cx="120" cy="116" r="34" fill="#0A0B10" stroke="#596075" stroke-width="3"/>
    <g clip-path="url(#${id}k)">
      <circle class="eye" cx="120" cy="116" r="25"/>
      <circle cx="120" cy="116" r="17" fill="none" stroke="#0A0B10" stroke-width="2" opacity=".5"/>
      <circle cx="120" cy="116" r="9" fill="#0A0B10"/>
      <circle cx="113" cy="108" r="4" fill="#fff" opacity=".8"/>
      <polygon class="angry" points="84,78 156,78 156,86 120,103 84,86" fill="#2A2F3D"/>
      <path class="happy" d="M84 152 L84 126 Q120 100 156 126 L156 152Z" fill="#2A2F3D"/>
    </g>
  </g>`;
}

function voltar(id) {
  const spring = (x) => {
    let d = `M${x} 204`;
    for (let i = 0; i < 6; i++) d += ` L${x + (i % 2 ? -9 : 9)} ${208 + i * 5}`;
    return `<path d="${d} L${x} 238" stroke="#8A93B8" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
  };
  const bolt = (m) => `<polygon points="${[[72, 122], [44, 150], [60, 152], [34, 186], [72, 146], [56, 144], [82, 126]]
    .map(([x, y]) => `${m(x)},${y}`).join(' ')}" fill="#FFD23F" stroke="#B58A00" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${m(34)}" cy="190" r="10" fill="#1E2A5A" stroke="#FFD23F" stroke-width="2.5"/>`;
  return `
  <defs>
    ${lin(`${id}b`, [[0, '#2A3A7A'], [1, '#0E1533']])}
    ${rad(`${id}d`, [[0, '#9FD4FF'], [0.6, '#3F7FD9'], [1, '#1B3A80']], '40%', '30%', '75%')}
    ${rad(`${id}g`, [[0, '#FFF7B0'], [0.4, '#FFD23F', 0.7], [1, '#FFD23F', 0]])}
  </defs>
  <ellipse cx="120" cy="250" rx="76" ry="8" fill="#000" opacity=".4"/>
  ${spring(98)}${spring(142)}
  <ellipse cx="98" cy="242" rx="18" ry="7" fill="#1E2A5A" stroke="#8A93B8" stroke-width="2"/>
  <ellipse cx="142" cy="242" rx="18" ry="7" fill="#1E2A5A" stroke="#8A93B8" stroke-width="2"/>
  ${bolt((x) => x)}${bolt((x) => 240 - x)}
  <rect x="104" y="92" width="32" height="12" rx="3" fill="#8A93B8"/>
  <rect x="70" y="100" width="100" height="108" rx="16" fill="url(#${id}b)" stroke="#070B1F" stroke-width="3"/>
  <rect x="84" y="120" width="72" height="72" rx="8" fill="#050818" stroke="#3A4A8A" stroke-width="2"/>
  <rect class="charge c1" x="91" y="174" width="58" height="11" rx="3"/>
  <rect class="charge c2" x="91" y="160" width="58" height="11" rx="3"/>
  <rect class="charge c3" x="91" y="146" width="58" height="11" rx="3"/>
  <rect class="charge c4" x="91" y="132" width="58" height="11" rx="3"/>
  <circle cx="120" cy="14" r="22" fill="url(#${id}g)" class="pulse"/>
  <rect x="116" y="18" width="8" height="28" fill="#8A93B8"/>
  <ellipse cx="120" cy="38" rx="13" ry="3.5" fill="none" stroke="#D9843A" stroke-width="3"/>
  <ellipse cx="120" cy="31" rx="11" ry="3" fill="none" stroke="#D9843A" stroke-width="3"/>
  <ellipse cx="120" cy="24" rx="9" ry="2.5" fill="none" stroke="#D9843A" stroke-width="3"/>
  <circle cx="120" cy="14" r="8" fill="#FFF7B0"/>
  <g class="flicker">
    <path d="M128 12 L146 4 L140 16 L162 10" stroke="#BFE9FF" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
    <path d="M112 12 L94 2 L100 15 L78 9" stroke="#BFE9FF" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
  </g>
  <rect x="84" y="44" width="72" height="54" rx="26" fill="url(#${id}d)" stroke="#070B1F" stroke-width="3"/>
  <ellipse cx="100" cy="56" rx="10" ry="5" fill="#fff" opacity=".35" transform="rotate(-20 100 56)"/>
  <ellipse class="eye" cx="106" cy="70" rx="7" ry="9"/>
  <ellipse class="eye" cx="134" cy="70" rx="7" ry="9"/>
  <path class="angry" d="M96 58 L113 64 M144 58 L127 64" stroke="#070B1F" stroke-width="3.5" stroke-linecap="round"/>
  <path class="angry" d="M104 88 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" stroke="#070B1F" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
  <path class="happy" d="M106 84 Q120 94 134 84" stroke="#070B1F" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
}

const ROBOT_ART = { boulon, engrenox, hypnos, labyrinthor, sentinelle, voltar };

export function robotSVG(key) {
  return svg(ROBOT_ART[key](uid('r')), '0 0 240 260', `robot-art robot-${key}`);
}

/* ==========================================================================
   OMÉGA — la grande IA. viewBox centré sur (0, 0).
   ========================================================================== */

export const SHIELD_COLORS = ['#3DFFB0', '#FFC93C', '#FF4FD8', '#35F2FF', '#FF4D6D', '#5CA8FF'];

function hexPoints(r) {
  return Array.from({ length: 6 }, (_, i) => polar(r, (Math.PI / 3) * i + Math.PI / 6).join(',')).join(' ');
}

export function omegaSVG({ shields = true } = {}) {
  const id = uid('o');
  const cables = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 + 15) * Math.PI) / 180;
    const [x1, y1] = polar(84, a);
    const [cx, cy] = polar(150, a + 0.35);
    const [x2, y2] = polar(215, a + 0.1);
    const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
    return `<path d="${d}" stroke="#1A0B14" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path class="om-line om-flow" d="${d}" stroke-width="2.5" fill="none" stroke-dasharray="10 16" style="animation-delay:-${(i * 0.37).toFixed(2)}s"/>`;
  }).join('');
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180;
    const [x1, y1] = polar(168, a);
    const [x2, y2] = polar(i % 6 === 0 ? 184 : 176, a);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');
  const irisLines = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const [x1, y1] = polar(22, a);
    const [x2, y2] = polar(44, a);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');
  const shieldEls = shields ? SHIELD_COLORS.map((c, k) => {
    const [x, y] = polar(142, ((k * 60 - 90) * Math.PI) / 180);
    return `<g transform="translate(${x} ${y})"><g class="shield s${k}">
      <polygon points="${hexPoints(28)}" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width="3.5"/>
      <polygon points="${hexPoints(17)}" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>
      <circle r="5" fill="${c}"/>
    </g></g>`;
  }).join('') : '';
  const bolts = Array.from({ length: 8 }, (_, i) => {
    const [x, y] = polar(86, (i / 8) * Math.PI * 2 + 0.2);
    return `<circle cx="${x}" cy="${y}" r="4" fill="#3A1626" stroke="#12050B" stroke-width="1.5"/>`;
  }).join('');
  return svg(`
  <defs>
    <radialGradient id="${id}h"><stop class="om-halo" offset="0" stop-opacity=".55"/><stop class="om-halo" offset=".55" stop-opacity=".12"/><stop class="om-halo" offset="1" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}i" cx="50%" cy="50%" r="50%">
      <stop class="om-iris-a" offset="0"/><stop class="om-iris-b" offset=".55"/><stop class="om-iris-c" offset="1"/>
    </radialGradient>
    ${rad(`${id}m`, [[0, '#4A2233'], [0.7, '#23101A'], [1, '#0E050A']], '40%', '30%', '75%')}
    <clipPath id="${id}a"><path d="M-84 0 Q0 -76 84 0 Q0 76 -84 0Z"/></clipPath>
  </defs>
  <circle r="200" fill="url(#${id}h)"/>
  ${cables}
  <g class="spin-vslow"><circle r="168" fill="none" stroke="#3A1624" stroke-width="2"/><g stroke="#5A2236" stroke-width="2">${ticks}</g>
    <path class="om-line" d="M-160 -50 A168 168 0 0 1 -50 -160" stroke-width="4" fill="none"/>
    <path class="om-line" d="M160 50 A168 168 0 0 1 50 160" stroke-width="4" fill="none"/>
  </g>
  <g class="om-shields">${shieldEls}</g>
  <g class="spin-rev"><circle class="om-line" r="110" fill="none" stroke-width="4" stroke-dasharray="44 12 6 12" opacity=".8"/></g>
  <circle r="94" fill="url(#${id}m)" stroke="#0A0508" stroke-width="4"/>
  ${bolts}
  <path d="M-84 0 Q0 -76 84 0 Q0 76 -84 0Z" fill="#050106" stroke="#6A2A3E" stroke-width="3"/>
  <g clip-path="url(#${id}a)">
    <g class="om-pupil">
      <circle r="46" fill="url(#${id}i)"/>
      <g stroke="#fff" stroke-opacity=".13" stroke-width="1.5">${irisLines}</g>
      <circle class="om-line" r="31" fill="none" stroke-width="1.5" opacity=".6"/>
      <ellipse class="angry" rx="9" ry="21" fill="#050106"/>
      <circle class="happy" r="15" fill="#050106"/>
      <circle cx="-15" cy="-17" r="6.5" fill="#fff" opacity=".75"/>
      <circle cx="12" cy="14" r="2.5" fill="#fff" opacity=".4"/>
    </g>
    <rect class="om-lid" x="-90" y="-82" width="180" height="82" fill="#1A0A12"/>
    <rect class="om-lid bottom" x="-90" y="0" width="180" height="82" fill="#1A0A12"/>
  </g>`, '-200 -200 400 400', 'omega-art');
}

/* ==========================================================================
   DÉCORS — viewBox 0 0 1600 900, recadrés pour remplir l'écran.
   ========================================================================== */

function sky(id, stops) {
  return `<defs>${lin(id, stops)}</defs><rect width="1600" height="900" fill="url(#${id})"/>`;
}

function starsLayer(r, n, maxY, color = '#fff') {
  let s = '';
  for (let i = 0; i < n; i++) {
    const cls = i % 4 === 0 ? ` class="twinkle" style="animation-delay:-${(r() * 4).toFixed(1)}s"` : '';
    s += `<circle cx="${f1(r() * 1600)}" cy="${f1(r() * maxY)}" r="${f1(0.6 + r() * 1.6)}" fill="${color}" opacity="${f1(0.3 + r() * 0.6)}"${cls}/>`;
  }
  return s;
}

function catenary(x1, x2, y, sag) {
  const mx = (x1 + x2) / 2;
  return `M${f1(x1)} ${f1(y)} Q${f1(mx)} ${f1(y + sag * 2)} ${f1(x2)} ${f1(y)}`;
}

function cableTree(r, x, gy, h, w, color) {
  const top = gy - h;
  const sway = (r() - 0.5) * 60;
  let s = '';
  for (let k = -1; k <= 1; k++) {
    s += `<path d="M${f1(x + k * w * 0.35)} ${gy} Q${f1(x + sway * 0.3 + k * w * 0.2)} ${f1(gy - h * 0.5)} ${f1(x + sway)} ${f1(top)}" stroke="${color}" stroke-width="${f1(w * 0.5)}" fill="none" stroke-linecap="round"/>`;
  }
  const n = 3 + Math.floor(r() * 3);
  for (let j = 0; j < n; j++) {
    const t = 0.35 + r() * 0.6;
    const bx = x + sway * t;
    const by = gy - h * t;
    const side = r() < 0.5 ? -1 : 1;
    const L = 60 + r() * 130;
    const ex = bx + side * L;
    const ey = by + 10 + r() * 70;
    s += `<path d="M${f1(bx)} ${f1(by)} Q${f1(bx + side * L * 0.45)} ${f1(by - 40 - r() * 40)} ${f1(ex)} ${f1(ey)}" stroke="${color}" stroke-width="${f1(w * 0.28)}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${f1(ex)} ${f1(ey)} q${f1(side * 6)} ${f1(40 + r() * 60)} 0 ${f1(60 + r() * 90)}" stroke="${color}" stroke-width="${f1(w * 0.12)}" fill="none"/>`;
  }
  return s;
}

function bgForest() {
  const r = rng(11), id = uid('bf');
  let far = '', mid = '', hang = '';
  for (let i = 0; i < 15; i++) far += cableTree(r, i * 115 + r() * 50, 740, 280 + r() * 200, 12 + r() * 6, '#0E302A');
  for (let i = 0; i < 8; i++) mid += cableTree(r, i * 220 + r() * 90 - 40, 790, 480 + r() * 220, 22 + r() * 10, '#061613');
  for (let i = 0; i < 9; i++) {
    const x1 = r() * 1500, x2 = x1 + 160 + r() * 280, sag = 50 + r() * 110;
    hang += `<path d="${catenary(x1, x2, -4, sag)}" stroke="#020A09" stroke-width="${f1(3 + r() * 4)}" fill="none"/>`;
    for (let k = 1; k < 4; k++) {
      const t = k / 4, x = x1 + (x2 - x1) * t, y = -4 + 4 * sag * t * (1 - t);
      hang += `<circle class="blinkl" style="animation-delay:-${(r() * 3).toFixed(1)}s" cx="${f1(x)}" cy="${f1(y)}" r="3.2" fill="#3DFF9A"/>`;
    }
  }
  return svg(`
    ${sky(id, [[0, '#030D0C'], [0.55, '#0A2622'], [1, '#18422F']])}
    <defs>${rad(`${id}m`, [[0, '#C9F5B0', 0.35], [1, '#C9F5B0', 0]])}${lin(`${id}f`, [[0, '#BFFFE0', 0], [0.5, '#BFFFE0', 0.1], [1, '#BFFFE0', 0]])}</defs>
    ${starsLayer(r, 60, 420, '#CFFFE6')}
    <circle cx="1210" cy="200" r="230" fill="url(#${id}m)"/>
    <circle cx="1210" cy="200" r="72" fill="#DDF7C8" opacity=".92"/>
    <circle cx="1188" cy="184" r="14" fill="#BFE3AA" opacity=".6"/><circle cx="1232" cy="226" r="9" fill="#BFE3AA" opacity=".6"/>
    ${far}
    <rect class="drift" x="-200" y="560" width="2000" height="220" fill="url(#${id}f)"/>
    ${mid}
    <path d="M0 770 Q300 720 640 760 T1250 745 T1600 760 V900 H0Z" fill="#020B08"/>
    <path d="M80 800 q60 -30 130 -6 M520 812 q80 -26 170 0 M1100 806 q70 -28 150 -4" stroke="#0E3A2A" stroke-width="5" fill="none"/>
    ${hang}
    <rect class="drift slow" x="-200" y="700" width="2000" height="200" fill="url(#${id}f)"/>`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function factoryBlock(r, x0, x1, base, hMin, hMax, color, lights) {
  let s = '', x = x0;
  while (x < x1) {
    const w = 90 + r() * 140, h = hMin + r() * (hMax - hMin);
    if (r() < 0.45) {
      let d = `M${f1(x)} ${base} V${f1(base - h)}`;
      const teeth = Math.max(2, Math.round(w / 40)), tw = w / teeth;
      for (let t = 0; t < teeth; t++) d += ` l${f1(tw)} -30 v30`;
      s += `<path d="${d} V${base}Z" fill="${color}"/>`;
    } else {
      s += `<rect x="${f1(x)}" y="${f1(base - h)}" width="${f1(w)}" height="${f1(h)}" fill="${color}"/>`;
    }
    if (r() < 0.6) {
      const cx = x + r() * (w - 24), ch = 90 + r() * 150;
      s += `<rect x="${f1(cx)}" y="${f1(base - h - ch)}" width="22" height="${f1(ch)}" fill="${color}"/><rect x="${f1(cx - 4)}" y="${f1(base - h - ch)}" width="30" height="10" fill="${color}"/>`;
      s += `<circle class="smoke-bg" style="animation-delay:-${(r() * 8).toFixed(1)}s" cx="${f1(cx + 11)}" cy="${f1(base - h - ch - 20)}" r="30" fill="#5B4032"/>`;
    }
    if (lights) {
      for (let k = 0; k < 4; k++) if (r() < 0.5) s += `<rect x="${f1(x + 10 + r() * (w - 30))}" y="${f1(base - h + 20 + r() * (h - 50))}" width="12" height="7" fill="#FF9A3D" opacity="${f1(0.4 + r() * 0.5)}"/>`;
    }
    x += w + r() * 20;
  }
  return s;
}

function bgFactory() {
  const r = rng(23), id = uid('bu');
  const helmets = Array.from({ length: 11 }, (_, i) =>
    `<g transform="translate(${i * 200} 742)"><path d="M-26 0 Q-26 -30 0 -30 Q26 -30 26 0Z" fill="#2A2F3A"/><rect x="-22" y="-14" width="44" height="8" rx="4" fill="#FF2D55" opacity=".85"/></g>`).join('');
  return svg(`
    ${sky(id, [[0, '#120806'], [0.5, '#2E160C'], [1, '#7A3A16']])}
    <defs>${rad(`${id}s`, [[0, '#FF9A52', 0.55], [1, '#FF9A52', 0]])}${lin(`${id}g`, [[0, '#6B3417', 0], [1, '#6B3417', 0.6]])}
      <pattern id="${id}h" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="40" height="40" fill="#FFC93C"/><rect width="20" height="40" fill="#15100C"/></pattern></defs>
    <circle cx="420" cy="430" r="260" fill="url(#${id}s)"/>
    <circle cx="420" cy="430" r="80" fill="#FFB36B" opacity=".45"/>
    <g transform="translate(1260 360)"><g class="spin-vslow"><circle r="200" fill="none"/><path d="${gearPath(170, 22, 26)}" fill="#1E110B"/><circle r="70" fill="#2E160C"/></g></g>
    <g transform="translate(1515 600)"><g class="spin-rev-slow"><circle r="140" fill="none"/><path d="${gearPath(110, 15, 22)}" fill="#1A0E09"/><circle r="40" fill="#2E160C"/></g></g>
    <g transform="translate(160 250)"><g class="spin-slow"><circle r="110" fill="none"/><path d="${gearPath(80, 12, 18)}" fill="#1E110B" opacity=".8"/><circle r="28" fill="#2E160C"/></g></g>
    ${factoryBlock(r, -40, 1640, 700, 120, 280, '#1C0F09', true)}
    <rect y="600" width="1600" height="120" fill="url(#${id}g)"/>
    ${factoryBlock(r, -80, 1680, 760, 60, 150, '#120905', false)}
    <rect x="0" y="648" width="1600" height="18" fill="#241510"/>
    <rect x="0" y="640" width="1600" height="6" fill="#3A2418"/>
    ${[120, 480, 860, 1240].map((x) => `<rect x="${x}" y="636" width="16" height="34" fill="#3A2418"/>`).join('')}
    <rect x="0" y="742" width="1600" height="30" rx="15" fill="#1D1C22"/>
    <g class="conveyor">${helmets}</g>
    ${Array.from({ length: 17 }, (_, i) => `<circle cx="${i * 100}" cy="757" r="9" fill="#34323B" stroke="#15141A" stroke-width="3"/>`).join('')}
    <rect x="0" y="772" width="1600" height="128" fill="#0D0806"/>
    <rect x="0" y="772" width="1600" height="12" fill="url(#${id}h)" opacity=".75"/>
    ${[200, 700, 1180].map((x, i) => `<circle class="blinkl d${i + 1}" cx="${x}" cy="600" r="8" fill="#FF8A3D"/>`).join('')}`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function sleeper(x, base, s, visor = '#35F2FF') {
  return `<g transform="translate(${x} ${base}) scale(${s})" class="sleeper">
    <rect x="-14" y="-52" width="11" height="52" rx="5" fill="#05020F"/><rect x="3" y="-52" width="11" height="52" rx="5" fill="#05020F"/>
    <path d="M-20 -112 Q0 -120 20 -112 L23 -46 H-23 Z" fill="#05020F"/>
    <path d="M-20 -108 L-26 -58 M20 -108 L26 -58" stroke="#05020F" stroke-width="10" stroke-linecap="round"/>
    <circle cx="0" cy="-132" r="17" fill="#05020F"/>
    <path d="M-19 -140 Q0 -156 19 -140 V-128 H-19Z" fill="#171028"/>
    <rect x="-17" y="-134" width="34" height="7" rx="3.5" fill="${visor}" class="visor"/>
  </g>`;
}

function skyline(r, base, hMin, hMax, color, winColors, winRate, x0 = -20, x1 = 1640) {
  let s = '', x = x0;
  while (x < x1) {
    const w = 60 + r() * 110, h = hMin + r() * (hMax - hMin);
    s += `<rect x="${f1(x)}" y="${f1(base - h)}" width="${f1(w)}" height="${f1(h + 2)}" fill="${color}"/>`;
    if (r() < 0.3) s += `<rect x="${f1(x + w / 2 - 2)}" y="${f1(base - h - 40)}" width="4" height="40" fill="${color}"/><circle class="blinkl" style="animation-delay:-${(r() * 3).toFixed(1)}s" cx="${f1(x + w / 2)}" cy="${f1(base - h - 42)}" r="3.5" fill="#FF2D55"/>`;
    if (winColors) {
      for (let wy = base - h + 16; wy < base - 20; wy += 22) {
        for (let wx = x + 10; wx < x + w - 14; wx += 18) {
          if (r() < winRate) s += `<rect x="${f1(wx)}" y="${f1(wy)}" width="8" height="10" fill="${winColors[Math.floor(r() * winColors.length)]}" opacity="${f1(0.35 + r() * 0.6)}"/>`;
        }
      }
    }
    x += w + 4 + r() * 16;
  }
  return s;
}

function bgCity() {
  const r = rng(37), id = uid('bc');
  const people = [[140, 800, 0.95], [300, 790, 0.8], [520, 795, 0.72], [1030, 792, 0.75], [1260, 800, 0.9], [1440, 790, 0.82], [760, 780, 0.6]]
    .map(([x, b, s]) => sleeper(x, b, s)).join('');
  return svg(`
    ${sky(id, [[0, '#06021A'], [0.6, '#1D0A45'], [1, '#48167A']])}
    <defs>${lin(`${id}g`, [[0, '#FF4FD8', 0], [1, '#FF4FD8', 0.25]])}${lin(`${id}r`, [[0, '#2A0F55'], [1, '#07031A']])}</defs>
    ${starsLayer(r, 90, 380)}
    <g opacity=".22" transform="translate(800 190)">
      <path d="M-260 0 Q0 -170 260 0 Q0 170 -260 0Z" fill="none" stroke="#FF2D55" stroke-width="4"/>
      <circle r="80" fill="none" stroke="#FF2D55" stroke-width="4"/><circle r="30" fill="#FF2D55"/>
    </g>
    ${skyline(r, 700, 220, 440, '#170932', ['#6A3AB8'], 0.18)}
    <rect y="520" width="1600" height="180" fill="url(#${id}g)"/>
    ${skyline(r, 740, 120, 330, '#0C0520', ['#FF4FD8', '#35F2FF', '#FFD23F'], 0.28)}
    <g transform="translate(330 470)"><rect x="-80" y="-60" width="160" height="120" rx="8" fill="#0C0520" stroke="#FF4FD8" stroke-width="3"/>
      <g class="spin"><circle r="56" fill="none"/><path d="${spiralPath(4, 52)}" stroke="#FF4FD8" stroke-width="4" fill="none" opacity=".85"/></g></g>
    <g transform="translate(1250 430)"><rect x="-70" y="-52" width="140" height="104" rx="8" fill="#0C0520" stroke="#35F2FF" stroke-width="3"/>
      <g class="spin-rev"><circle r="48" fill="none"/><path d="${spiralPath(3.5, 44)}" stroke="#35F2FF" stroke-width="4" fill="none" opacity=".85"/></g></g>
    <rect y="740" width="1600" height="160" fill="url(#${id}r)"/>
    <path d="M0 820 H1600" stroke="#FF4FD8" stroke-width="3" stroke-dasharray="60 50" opacity=".35"/>
    ${people}`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function bgMaze() {
  const r = rng(41), id = uid('bm');
  let bin = '';
  for (let y = 60; y < 480; y += 30) {
    let str = '';
    for (let i = 0; i < 90; i++) str += r() < 0.5 ? '0' : '1';
    bin += `<text x="${f1(-20 + r() * 20)}" y="${y}" font-family="monospace" font-size="20" letter-spacing="4" fill="#35F2FF" opacity="${f1(0.05 + r() * 0.1)}">${str}</text>`;
  }
  let grid = '';
  for (let i = -24; i <= 24; i++) grid += `<line x1="${800 + i * 22}" y1="520" x2="${800 + i * 240}" y2="900"/>`;
  for (let k = 1; k <= 14; k++) { const y = 520 + 380 * Math.pow(k / 14, 2); grid += `<line x1="0" y1="${f1(y)}" x2="1600" y2="${f1(y)}"/>`; }
  const wall = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(53,242,255,.06)" stroke="#35F2FF" stroke-width="2.5" opacity=".75"/><line x1="${x}" y1="${y + 12}" x2="${x + w}" y2="${y + 12}" stroke="#35F2FF" stroke-width="1" opacity=".5"/>`;
  const wcube = (x, y, s, d) => `<g class="float ${d}" transform="translate(${x} ${y})"><path d="M0 ${-s} L${s} ${-s / 2} L${s} ${s / 2} L0 ${s} L${-s} ${s / 2} L${-s} ${-s / 2}Z M0 ${-s} V0 M0 0 L${s} ${-s / 2} M0 0 L${-s} ${-s / 2} M0 0 V${s}" fill="rgba(53,242,255,.05)" stroke="#35F2FF" stroke-width="2" opacity=".8"/></g>`;
  let streams = '';
  for (let i = 0; i < 14; i++) { const x = f1(r() * 1600); streams += `<line class="stream" style="animation-delay:-${(r() * 4).toFixed(1)}s" x1="${x}" y1="0" x2="${x}" y2="520" stroke="#35F2FF" stroke-width="2" stroke-dasharray="4 40" opacity=".35"/>`; }
  return svg(`
    ${sky(id, [[0, '#010510'], [0.58, '#04152C'], [1, '#021018']])}
    <defs>${lin(`${id}h`, [[0, '#35F2FF', 0], [1, '#35F2FF', 0.35]])}</defs>
    ${bin}${streams}
    <rect y="420" width="1600" height="100" fill="url(#${id}h)"/>
    <line x1="0" y1="520" x2="1600" y2="520" stroke="#9FFBFF" stroke-width="2"/>
    <g stroke="#35F2FF" stroke-width="1.5" opacity=".45">${grid}</g>
    ${wall(180, 380, 170, 140)}${wall(420, 430, 110, 90)}${wall(1090, 420, 120, 100)}${wall(1270, 360, 200, 160)}${wall(650, 460, 70, 60)}${wall(900, 470, 60, 50)}
    ${wcube(260, 220, 34, '')}${wcube(1380, 180, 44, 'd2')}${wcube(760, 140, 22, 'd3')}${wcube(1050, 260, 28, '')}`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function mast(x, base, h) {
  let s = `<path d="M${x - 16} ${base} L${x} ${base - h} L${x + 16} ${base}" stroke="#1A060C" stroke-width="4" fill="none"/>`;
  for (let y = base - 20; y > base - h + 20; y -= 34) {
    const w = 16 * (base - y) / h;
    s += `<path d="M${f1(x - 16 + w)} ${y} L${f1(x + 16 - w)} ${y - 34}" stroke="#1A060C" stroke-width="2"/>`;
  }
  return s + `<circle class="blinkl" cx="${x}" cy="${base - h - 6}" r="6" fill="#FF2D55"/>`;
}

function bgTower() {
  const r = rng(53), id = uid('bt');
  const beam = (rot, cls) => `<g transform="translate(800 190) rotate(${rot})"><g class="${cls}"><polygon points="0,0 -70,760 70,760" fill="url(#${id}b)"/></g></g>`;
  let clouds = '';
  for (let i = 0; i < 9; i++) clouds += `<ellipse cx="${f1(r() * 1600)}" cy="${f1(40 + r() * 200)}" rx="${f1(160 + r() * 200)}" ry="${f1(30 + r() * 40)}" fill="#1C050C" opacity=".85"/>`;
  return svg(`
    ${sky(id, [[0, '#0A0205'], [0.55, '#25070F'], [1, '#4A0D1C']])}
    <defs>${lin(`${id}b`, [[0, '#FF3B5C', 0.45], [1, '#FF3B5C', 0]])}${lin(`${id}t`, [[0, '#2A0A14'], [1, '#12030A']], 1, 0)}${lin(`${id}w`, [[0, '#FF2D55', 0.25], [1, '#FF2D55', 0]])}</defs>
    ${clouds}
    ${beam(-30, 'sweep')}${beam(25, 'sweep d2')}${beam(0, 'sweep d3')}
    ${skyline(r, 760, 80, 220, '#14040A', ['#FF2D55'], 0.1)}
    ${mast(260, 760, 380)}${mast(1360, 760, 420)}${mast(520, 760, 260)}${mast(1120, 760, 300)}
    <path d="M730 760 L776 230 H824 L870 760Z" fill="url(#${id}t)"/>
    <ellipse cx="800" cy="300" rx="90" ry="18" fill="#2A0A14" stroke="#FF2D55" stroke-width="2" opacity=".9"/>
    <ellipse cx="800" cy="470" rx="70" ry="14" fill="#2A0A14" stroke="#FF2D55" stroke-width="2" opacity=".8"/>
    <rect x="760" y="170" width="80" height="60" rx="10" fill="#2A0A14"/>
    <circle class="blinkl" cx="800" cy="200" r="16" fill="#FF2D55"/>
    <line x1="800" y1="170" x2="800" y2="90" stroke="#2A0A14" stroke-width="6"/>
    ${[560, 600, 640, 680, 720].map((y) => `<rect x="${f1(790 - (y - 230) * 0.02)}" y="${y}" width="${f1(20 + (y - 230) * 0.04)}" height="8" fill="#FF2D55" opacity=".5"/>`).join('')}
    <rect y="760" width="1600" height="140" fill="#080204"/>
    ${[160, 420, 780, 1080, 1400].map((x) => `<rect x="${x}" y="770" width="${f1(60 + r() * 80)}" height="${f1(60 + r() * 60)}" fill="url(#${id}w)"/>`).join('')}`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function pylon(x, base, h) {
  const w = h * 0.18;
  let s = `<path d="M${f1(x - w)} ${base} L${f1(x - w * 0.18)} ${f1(base - h)} H${f1(x + w * 0.18)} L${f1(x + w)} ${base}" stroke="#081230" stroke-width="5" fill="none"/>`;
  for (let i = 0; i < 6; i++) {
    const y0 = base - (h * i) / 6, y1 = base - (h * (i + 1)) / 6;
    const w0 = w - (w * 0.82 * i) / 6, w1 = w - (w * 0.82 * (i + 1)) / 6;
    s += `<path d="M${f1(x - w0)} ${f1(y0)} L${f1(x + w1)} ${f1(y1)} M${f1(x + w0)} ${f1(y0)} L${f1(x - w1)} ${f1(y1)}" stroke="#081230" stroke-width="2.5"/>`;
  }
  s += `<path d="M${f1(x - w * 1.6)} ${f1(base - h * 0.82)} H${f1(x + w * 1.6)} M${f1(x - w * 1.2)} ${f1(base - h * 0.66)} H${f1(x + w * 1.2)}" stroke="#081230" stroke-width="5"/>`;
  return s;
}

function boltPath(r, x, y, len) {
  let d = `M${x} ${y}`, cx = x, cy = y;
  while (cy < y + len) { cx += (r() - 0.5) * 70; cy += 30 + r() * 40; d += ` L${f1(cx)} ${f1(cy)}`; }
  return d;
}

function bgPower() {
  const r = rng(67), id = uid('bp');
  let clouds = '';
  for (let i = 0; i < 12; i++) clouds += `<ellipse cx="${f1(r() * 1600)}" cy="${f1(20 + r() * 180)}" rx="${f1(140 + r() * 220)}" ry="${f1(40 + r() * 50)}" fill="${i % 2 ? '#060D24' : '#0C1838'}"/>`;
  const b1 = boltPath(r, 1180, 120, 420), b2 = boltPath(r, 360, 90, 380);
  const cool = (x, s) => `<g transform="translate(${x} 760) scale(${s})"><path d="M-90 0 Q-50 -130 -70 -250 H70 Q50 -130 90 0Z" fill="#0A1433"/><ellipse cx="0" cy="-250" rx="70" ry="12" fill="#13245A"/><ellipse class="steam" cx="0" cy="-290" rx="80" ry="40" fill="#8FB8FF" opacity=".12"/></g>`;
  const coil = (x, s, d) => `<g transform="translate(${x} 760) scale(${s})"><rect x="-8" y="-230" width="16" height="230" fill="#0A1433"/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="0" cy="${-60 - i * 34}" rx="${30 - i * 3}" ry="7" fill="none" stroke="#D9843A" stroke-width="4" opacity=".8"/>`).join('')}<circle cy="-244" r="22" fill="#BFE9FF" opacity=".9"/><g class="flicker ${d}"><path d="M0 -244 L-40 -280 L-26 -300 L-70 -330" stroke="#DFF3FF" stroke-width="3" fill="none"/><path d="M0 -244 L44 -270 L36 -296 L80 -310" stroke="#DFF3FF" stroke-width="3" fill="none"/></g></g>`;
  let lines = '';
  const tops = [[120, 560], [560, 520], [1020, 540], [1480, 560]];
  for (let i = 0; i < tops.length - 1; i++) {
    lines += `<path d="${catenary(tops[i][0], tops[i + 1][0], tops[i][1], 30)}" stroke="#050B1D" stroke-width="2" fill="none"/>`;
    lines += `<path d="${catenary(tops[i][0], tops[i + 1][0], tops[i][1] + 30, 34)}" stroke="#050B1D" stroke-width="2" fill="none"/>`;
  }
  return svg(`
    ${sky(id, [[0, '#02050F'], [0.55, '#0A1A3D'], [1, '#1B3470']])}
    ${clouds}
    <rect class="skyflash" width="1600" height="900" fill="#CFE6FF"/>
    <g class="bolt"><path d="${b1}" stroke="#8FC8FF" stroke-width="14" fill="none" opacity=".3"/><path d="${b1}" stroke="#F2FAFF" stroke-width="4" fill="none"/></g>
    <g class="bolt d2"><path d="${b2}" stroke="#8FC8FF" stroke-width="14" fill="none" opacity=".3"/><path d="${b2}" stroke="#F2FAFF" stroke-width="4" fill="none"/></g>
    ${cool(820, 1.1)}${cool(1300, 0.8)}
    ${pylon(120, 760, 250)}${pylon(560, 760, 280)}${pylon(1020, 760, 260)}${pylon(1480, 760, 240)}
    ${lines}
    ${coil(330, 0.9, '')}${coil(1170, 1, 'd2')}
    <rect y="760" width="1600" height="140" fill="#02040A"/>
    <path d="M0 760 H1600" stroke="#5CA8FF" stroke-width="2" opacity=".35"/>`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function bgCore() {
  const r = rng(71), id = uid('bo');
  let streams = '';
  for (let i = 0; i < 22; i++) { const x = f1(r() * 1600); streams += `<line class="stream" style="animation-delay:-${(r() * 4).toFixed(1)}s" x1="${x}" y1="0" x2="${x}" y2="900" stroke="#FF2D55" stroke-width="2" stroke-dasharray="3 46" opacity=".3"/>`; }
  return svg(`
    <defs>
      ${rad(`${id}g`, [[0, '#3A0016'], [0.5, '#12000A'], [1, '#030004']], '50%', '42%', '70%')}
      <pattern id="${id}x" width="60" height="104" patternUnits="userSpaceOnUse">
        <path d="M30 0 L60 17 V52 L30 69 L0 52 V17Z M30 69 V104" fill="none" stroke="#FF2D55" stroke-width="1.5"/>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="url(#${id}g)"/>
    <rect width="1600" height="900" fill="url(#${id}x)" opacity=".09"/>
    ${streams}
    <g transform="translate(800 380)">
      <g class="spin-vslow"><circle r="330" fill="none" stroke="#3A0A1A" stroke-width="3" stroke-dasharray="80 20 10 20"/></g>
      <g class="spin-rev-slow"><circle r="410" fill="none" stroke="#2A0612" stroke-width="8" stroke-dasharray="200 60"/></g>
      <g class="spin-slow"><circle r="500" fill="none" stroke="#FF2D55" stroke-width="2" stroke-dasharray="4 30" opacity=".4"/></g>
    </g>
    <ellipse cx="800" cy="860" rx="900" ry="120" fill="#0A0006"/>
    <ellipse cx="800" cy="860" rx="700" ry="80" fill="none" stroke="#FF2D55" stroke-width="2" opacity=".35"/>`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function bgHall() {
  const r = rng(83), id = uid('bh');
  const spot = (x) => `<polygon points="${x - 30},0 ${x + 30},0 ${x + 190},900 ${x - 190},900" fill="url(#${id}s)"/>`;
  return svg(`
    <defs>
      ${rad(`${id}g`, [[0, '#1E1250'], [0.6, '#0B0624'], [1, '#04020E']], '50%', '60%', '75%')}
      ${lin(`${id}s`, [[0, '#8FD8FF', 0.25], [1, '#8FD8FF', 0]])}
      <pattern id="${id}x" width="60" height="104" patternUnits="userSpaceOnUse">
        <path d="M30 0 L60 17 V52 L30 69 L0 52 V17Z M30 69 V104" fill="none" stroke="#35F2FF" stroke-width="1.5"/>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="url(#${id}g)"/>
    <rect width="1600" height="900" fill="url(#${id}x)" opacity=".06"/>
    ${starsLayer(r, 50, 900, '#9FE8FF')}
    ${spot(400)}${spot(800)}${spot(1200)}`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function bgTitle() {
  const r = rng(97), id = uid('bi');
  const beam = (x, rot, cls) => `<g transform="translate(${x} 900) rotate(${rot})"><g class="${cls}"><polygon points="0,0 -60,-900 60,-900" fill="url(#${id}b)"/></g></g>`;
  return svg(`
    ${sky(id, [[0, '#05010C'], [0.55, '#1A0620'], [1, '#4A0A2C']])}
    <defs>${lin(`${id}b`, [[0, '#FF3B7A', 0.3], [1, '#FF3B7A', 0]], 0, 1)}</defs>
    ${starsLayer(r, 120, 500)}
    ${beam(300, 10, 'sweep-up')}${beam(1300, -12, 'sweep-up d2')}
    ${skyline(r, 780, 200, 420, '#12041A', ['#FF2D55', '#7A2AB8'], 0.12)}
    ${skyline(r, 840, 90, 260, '#07010C', ['#FF4FD8', '#35F2FF'], 0.2)}
    <rect y="838" width="1600" height="62" fill="#040008"/>`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

function bgDawn() {
  const r = rng(101), id = uid('bd');
  const rays = Array.from({ length: 16 }, (_, i) => `<polygon points="0,0 -40,-1100 40,-1100" transform="rotate(${i * 22.5})" fill="#FFF6D0" opacity=".13"/>`).join('');
  const tree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-40" width="12" height="44" fill="#2F5A3A"/><circle cy="-70" r="42" fill="#3E9B63"/><circle cx="-26" cy="-50" r="28" fill="#358A57"/><circle cx="28" cy="-52" r="30" fill="#47AD70"/></g>`;
  let clouds = '';
  for (let i = 0; i < 7; i++) clouds += `<ellipse class="drift" style="animation-delay:-${(r() * 30).toFixed(0)}s" cx="${f1(r() * 1600)}" cy="${f1(80 + r() * 260)}" rx="${f1(90 + r() * 120)}" ry="${f1(20 + r() * 20)}" fill="#FFE3F0" opacity=".55"/>`;
  const birds = [[300, 220], [340, 250], [1200, 180], [1240, 200], [1170, 210]].map(([x, y], i) =>
    `<path class="bird d${(i % 3) + 1}" d="M${x - 12} ${y} Q${x - 6} ${y - 8} ${x} ${y} Q${x + 6} ${y - 8} ${x + 12} ${y}" stroke="#4A2D6B" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
  return svg(`
    ${sky(id, [[0, '#2B3A8F'], [0.35, '#8A5CC7'], [0.68, '#FF8FAB'], [1, '#FFD27A']])}
    <defs>${rad(`${id}s`, [[0, '#FFF6C8'], [0.3, '#FFE08A', 0.8], [1, '#FFB36B', 0]])}</defs>
    <g transform="translate(800 700)"><g class="spin-vslow"><circle r="1100" fill="none"/>${rays}</g></g>
    <circle cx="800" cy="700" r="420" fill="url(#${id}s)"/>
    <circle cx="800" cy="700" r="140" fill="#FFF3C4"/>
    ${clouds}${birds}
    ${skyline(r, 760, 200, 400, '#7A5BA8', ['#FFE08A', '#FFF3C4'], 0.35)}
    ${skyline(r, 800, 90, 220, '#5A3F86', ['#FFE08A'], 0.3)}
    <path d="M0 780 Q400 730 800 770 T1600 760 V900 H0Z" fill="#3B8F6A"/>
    <path d="M0 830 Q500 790 1000 830 T1600 820 V900 H0Z" fill="#2F7A58"/>
    ${tree(120, 790, 1)}${tree(260, 800, 0.8)}${tree(1380, 790, 1.1)}${tree(1520, 805, 0.85)}${tree(560, 790, 0.6)}${tree(1060, 785, 0.65)}`, '0 0 1600 900', 'bg-art', 'xMidYMid slice');
}

/** Scène d'intro : les trois héros en ombre chinoise sous un projecteur. */
function bgHeroes() {
  return bgHall();
}

export const BACKGROUNDS = {
  forest: bgForest, factory: bgFactory, city: bgCity, maze: bgMaze, tower: bgTower,
  power: bgPower, core: bgCore, hall: bgHall, title: bgTitle, dawn: bgDawn,
  sleepers: bgCity, heroes: bgHeroes,
};

export function background(key) {
  return BACKGROUNDS[key]();
}

/* ==========================================================================
   CARTE DU MONDE — terrain dessiné autour des 7 étapes du chemin.
   Les positions sont données pour l'écran large (1600×900) ; en mode
   portrait, la carte est retournée (900×1600) et le chemin monte.
   ========================================================================== */

const MAP_POINTS = [[170, 745], [440, 640], [330, 410], [640, 300], [900, 500], [1150, 650], [1400, 330]];

export function mapPoints(portrait) {
  return portrait ? MAP_POINTS.map(([x, y]) => [y, 1600 - x]) : MAP_POINTS.slice();
}

/** Courbe douce passant par tous les points (Catmull-Rom → Bézier), segment par segment. */
export function mapSegments(pts) {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    segs.push(`M${f1(p1[0])} ${f1(p1[1])} C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`);
  }
  return segs;
}

function mapDecor(kind, x, y, r) {
  const g = (inner) => `<g transform="translate(${f1(x)} ${f1(y)})">${inner}</g>`;
  let s = '';
  switch (kind) {
    case 0: // forêt de câbles
      for (let i = 0; i < 7; i++) {
        const dx = (r() - 0.5) * 260, dy = (r() - 0.5) * 120, h = 50 + r() * 50;
        s += g(`<path d="M${f1(dx)} ${f1(dy)} q${f1((r() - 0.5) * 20)} ${f1(-h / 2)} 0 ${f1(-h)} M${f1(dx)} ${f1(dy - h * 0.7)} q-20 -14 -34 6 M${f1(dx)} ${f1(dy - h * 0.85)} q20 -14 30 8" stroke="#0F4A3A" stroke-width="5" fill="none" stroke-linecap="round"/>`);
      }
      break;
    case 1: // usine
      for (let i = 0; i < 4; i++) {
        const dx = -120 + i * 70 + r() * 20, h = 40 + r() * 50;
        s += g(`<rect x="${f1(dx)}" y="${f1(20 - h)}" width="54" height="${f1(h)}" fill="#3A2A12"/><rect x="${f1(dx + 34)}" y="${f1(20 - h - 40)}" width="12" height="40" fill="#3A2A12"/>`);
      }
      break;
    case 2: // cité
      for (let i = 0; i < 6; i++) {
        const dx = -150 + i * 55, h = 50 + r() * 90;
        s += g(`<rect x="${f1(dx)}" y="${f1(40 - h)}" width="44" height="${f1(h)}" fill="#2E1450"/><rect x="${f1(dx + 8)}" y="${f1(50 - h)}" width="6" height="8" fill="#FF4FD8" opacity=".7"/><rect x="${f1(dx + 26)}" y="${f1(70 - h)}" width="6" height="8" fill="#35F2FF" opacity=".6"/>`);
      }
      break;
    case 3: // labyrinthe
      s += g(`<path d="M-120 -60 H120 V60 H-120 V-30 H90 V30 H-90 V0 H40" stroke="#1C6E86" stroke-width="6" fill="none" opacity=".8"/>`);
      break;
    case 4: // tour
      s += g(`<path d="M-160 50 L-150 -60 L-140 50 M150 50 L162 -80 L174 50" stroke="#4A1020" stroke-width="6" fill="none"/><circle cx="-150" cy="-66" r="5" fill="#FF2D55" class="blinkl"/><circle cx="162" cy="-86" r="5" fill="#FF2D55" class="blinkl d2"/>`);
      break;
    case 5: // centrale
      s += g(`${[-140, 120].map((dx) => `<path d="M${dx - 16} 50 L${dx} -50 L${dx + 16} 50 M${dx - 24} -30 H${dx + 24}" stroke="#1B3470" stroke-width="5" fill="none"/>`).join('')}<path d="M-100 -90 L-80 -60 L-94 -56 L-70 -20" stroke="#BFE9FF" stroke-width="3" fill="none" class="flicker"/>`);
      break;
    case 6: // tour d'OMÉGA
      s += g(`<path d="M-50 90 L-24 -150 H24 L50 90Z" fill="#2A0614"/><rect x="-34" y="-190" width="68" height="44" rx="10" fill="#2A0614"/><circle cy="-168" r="12" fill="#FF2D55" class="pulse"/><line x1="0" y1="-190" x2="0" y2="-250" stroke="#2A0614" stroke-width="6"/>`);
      break;
  }
  return s;
}

export function mapSVG(portrait) {
  const r = rng(131), id = uid('mp');
  const pts = mapPoints(portrait);
  const W = portrait ? 900 : 1600, H = portrait ? 1600 : 900;
  const colors = ['#3DFFB0', '#FFC93C', '#FF4FD8', '#35F2FF', '#FF4D6D', '#5CA8FF', '#FF2D55'];
  const blobs = pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 6 ? 300 : 230}" fill="url(#${id}z${i})"/>`).join('');
  const defs = colors.map((c, i) => rad(`${id}z${i}`, [[0, c, 0.22], [0.6, c, 0.06], [1, c, 0]])).join('');
  const decor = pts.map(([x, y], i) => mapDecor(i, x, y - 10, r)).join('');
  const omegaPos = portrait ? [620, 140] : [1360, 110];
  let dots = '';
  for (let i = 0; i < 140; i++) dots += `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(0.6 + r() * 1.4)}" fill="#9FE8FF" opacity="${f1(0.1 + r() * 0.3)}"/>`;
  return svg(`
    <defs>
      ${rad(`${id}g`, [[0, '#15123A'], [1, '#05040F']], '40%', '60%', '80%')}
      ${defs}
      <pattern id="${id}x" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0 H0 V48" fill="none" stroke="#35F2FF" stroke-width="1"/></pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${id}g)"/>
    <rect width="${W}" height="${H}" fill="url(#${id}x)" opacity=".05"/>
    ${dots}${blobs}${decor}
    <g transform="translate(${omegaPos[0]} ${omegaPos[1]}) scale(.9)" opacity=".85">
      <path d="M-110 0 Q0 -80 110 0 Q0 80 -110 0Z" fill="#12030A" stroke="#FF2D55" stroke-width="3"/>
      <circle r="36" fill="#FF2D55" class="pulse"/><ellipse rx="8" ry="22" fill="#12030A"/>
    </g>`, `0 0 ${W} ${H}`, 'map-art', 'xMidYMid meet');
}

/* ==========================================================================
   PETITES ICÔNES pour les énigmes.
   ========================================================================== */

export function arrowIcon(angle, color = '#35F2FF') {
  return `<svg class="ic-arrow" viewBox="-20 -20 40 40" aria-hidden="true"><g transform="rotate(${angle})"><path d="M0 -16 L12 -2 H4.5 V15 H-4.5 V-2 H-12Z" fill="${color}" stroke="rgba(0,0,0,.35)" stroke-width="1.5" stroke-linejoin="round"/></g></svg>`;
}

export function rotIcon(cw) {
  // Arc de cercle avec une pointe : sens des aiguilles d'une montre ou l'inverse.
  // Tracé de base dans le sens des aiguilles d'une montre ; miroir pour l'autre sens.
  const path = 'M-11 -8 A13.5 13.5 0 1 1 -12 6';
  const head = '<polygon points="-15.5,0 -5,4.5 -17,11.5" />';
  return `<svg class="ic-rot" viewBox="-20 -20 40 40" aria-hidden="true"><g transform="${cw ? '' : 'scale(-1 1)'}"><path d="${path}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><g fill="currentColor">${head}</g></g></svg>`;
}

export const SYMBOLS = {
  battery: { name: 'la pile', svg: '<rect x="-9" y="-13" width="18" height="28" rx="3" fill="#3DFFB0" stroke="#0B3D2A" stroke-width="2"/><rect x="-4" y="-17" width="8" height="5" rx="1" fill="#0B3D2A"/><path d="M-5 -2 H5 M0 -7 V3 M-5 8 H5" stroke="#0B3D2A" stroke-width="2.5" stroke-linecap="round"/>' },
  bolt: { name: "l'éclair", svg: '<polygon points="3,-17 -11,3 -1,3 -4,17 11,-4 1,-4" fill="#FFD23F" stroke="#7A5A00" stroke-width="2" stroke-linejoin="round"/>' },
  gear: { name: "l'engrenage", svg: `<path d="${gearPath(11, 8, 5)}" fill="#FF8A3D" stroke="#6A2A00" stroke-width="2"/><circle r="4.5" fill="#1A0F0A"/>` },
  chip: { name: 'la puce', svg: '<rect x="-11" y="-11" width="22" height="22" rx="3" fill="#C77DFF" stroke="#3A1470" stroke-width="2"/><rect x="-5" y="-5" width="10" height="10" fill="#3A1470"/><path d="M-6 -11 V-16 M0 -11 V-16 M6 -11 V-16 M-6 11 V16 M0 11 V16 M6 11 V16 M-11 -6 H-16 M-11 0 H-16 M-11 6 H-16 M11 -6 H16 M11 0 H16 M11 6 H16" stroke="#C77DFF" stroke-width="2.5"/>' },
};

export function symbolIcon(key) {
  return `<svg class="ic-sym" viewBox="-20 -20 40 40" aria-label="${SYMBOLS[key].name}">${SYMBOLS[key].svg}</svg>`;
}

export function droneIcon() {
  return `<g class="drone-ic"><ellipse rx="18" ry="5" cy="-12" fill="#9FFBFF" opacity=".5" class="prop"/><circle r="13" fill="#0D2C44" stroke="#35F2FF" stroke-width="3"/><circle r="5" fill="#35F2FF"/><line x1="-13" y1="-6" x2="-18" y2="-12" stroke="#35F2FF" stroke-width="2.5"/><line x1="13" y1="-6" x2="18" y2="-12" stroke="#35F2FF" stroke-width="2.5"/></g>`;
}

export function keyIcon() {
  return `<g class="key-ic"><circle r="18" fill="#FFD23F" opacity=".18" class="pulse"/><circle cx="-6" cy="0" r="7" fill="none" stroke="#FFD23F" stroke-width="4"/><path d="M1 0 H15 M11 0 V6 M15 0 V5" stroke="#FFD23F" stroke-width="4" stroke-linecap="round"/></g>`;
}

export function doorIcon(color) {
  return `<svg class="ic-door" viewBox="0 0 60 80" aria-hidden="true"><rect x="4" y="4" width="52" height="74" rx="6" fill="#0B0A18" stroke="${color}" stroke-width="3"/><rect x="11" y="11" width="38" height="64" rx="3" fill="${color}" fill-opacity=".22" stroke="${color}" stroke-width="2"/><circle cx="41" cy="44" r="3.5" fill="${color}"/><path d="M18 22 H42 M18 30 H36" stroke="${color}" stroke-width="2" opacity=".5"/></svg>`;
}

export function racerIcon(color) {
  return `<svg class="ic-racer" viewBox="-20 -20 40 40" aria-hidden="true"><rect x="-13" y="-12" width="26" height="22" rx="7" fill="${color}"/><rect x="-8" y="-6" width="16" height="9" rx="4" fill="#0A0B1A"/><circle cx="-3.5" cy="-1.5" r="2" fill="${color}"/><circle cx="3.5" cy="-1.5" r="2" fill="${color}"/><line x1="0" y1="-12" x2="0" y2="-18" stroke="${color}" stroke-width="2.5"/><circle cx="0" cy="-18" r="2.5" fill="${color}"/><rect x="-10" y="11" width="6" height="6" rx="2" fill="${color}"/><rect x="4" y="11" width="6" height="6" rx="2" fill="${color}"/></svg>`;
}
