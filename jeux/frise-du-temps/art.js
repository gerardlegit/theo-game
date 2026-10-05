// ============================================================================
// Illustrations de La Frise du Temps : 20 petites scènes dessinées en SVG
// (aucune image à télécharger, tout marche hors-ligne).
//
// renderArt(id, uid) renvoie le <svg> complet. "uid" rend les identifiants
// de dégradés uniques, car la même scène peut être affichée deux fois
// (grande carte + petite carte de la frise).
// ============================================================================

const O = '#2E2A4D';

const lin = (id, c1, c2, { x2 = 0, y2 = 1 } = {}) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;

const glow = (id, c, o = 0.8) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

const gold = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#FFE98A"/><stop offset="0.55" stop-color="#F2B92C"/><stop offset="1" stop-color="#C98A12"/></linearGradient>`;

/* Petit générateur pseudo-aléatoire : les étoiles sont toujours au même endroit. */
function rand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function stars(n, seed, maxY = 200, color = '#FFFFFF') {
  const r = rand(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<circle cx="${(r() * 320).toFixed(1)}" cy="${(r() * maxY).toFixed(1)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="${color}" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

const cloud = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="#FFFFFF" opacity="0.92"><ellipse cx="0" cy="0" rx="22" ry="10"/><ellipse cx="-12" cy="-6" rx="11" ry="9"/><ellipse cx="6" cy="-10" rx="13" ry="11"/></g>`;

const bird = (x, y, s = 1) =>
  `<path d="M${x - 7 * s} ${y} q${4 * s} ${-5 * s} ${7 * s} 0 q${3 * s} ${-5 * s} ${7 * s} 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

/* ------------------------------------------------------------------ scènes */

const SCENES = {
  dinosaures: (g) => `
    <defs>
      ${lin(g('sky'), '#4B1F5E', '#FF8A4C')}
      ${lin(g('trail'), '#FFE07A', '#FF6B3D', { x2: 1, y2: -1 })}
      ${glow(g('glow'), '#FFD25A', 0.9)}
    </defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${stars(18, 3, 90)}
    <path d="M262 30 L366 -50 L376 -32 L276 46 Z" fill="url(#${g('trail')})" opacity="0.85"/>
    <circle cx="270" cy="38" r="34" fill="url(#${g('glow')})"/>
    <circle cx="270" cy="38" r="13" fill="#FFD25A" stroke="${O}" stroke-width="3"/>
    <circle cx="266" cy="35" r="3" fill="#FF8A3D"/><circle cx="274" cy="42" r="2" fill="#FF8A3D"/>
    <circle cx="48" cy="70" r="12" fill="#8E6E86" opacity="0.8"/>
    <circle cx="60" cy="56" r="15" fill="#8E6E86" opacity="0.7"/>
    <circle cx="44" cy="44" r="11" fill="#8E6E86" opacity="0.6"/>
    <path d="M-4 152 L38 92 L60 92 L112 152 Z" fill="#5A3A4A" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M38 92 L60 92 L56 104 L50 100 L44 108 Z" fill="#FF6B3D" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M0 160 Q80 140 160 158 T320 150 V200 H0 Z" fill="#3E8E5A" stroke="${O}" stroke-width="3"/>
    <g fill="#2F7247" stroke="${O}" stroke-width="2">
      <path d="M282 160 Q270 130 250 124 Q272 132 286 156 Z"/><path d="M286 158 Q296 126 316 118 Q298 134 290 160 Z"/>
      <path d="M22 178 Q14 156 0 150 Q18 156 26 176 Z"/>
    </g>
    <path d="M110 146 Q72 150 40 174 Q80 162 112 162 Z" fill="#7BD37E" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="122" y="160" width="13" height="28" rx="5" fill="#5DB862" stroke="${O}" stroke-width="3"/>
    <rect x="166" y="160" width="13" height="28" rx="5" fill="#5DB862" stroke="${O}" stroke-width="3"/>
    <ellipse cx="150" cy="150" rx="48" ry="27" fill="#7BD37E" stroke="${O}" stroke-width="3"/>
    <path d="M176 140 Q200 122 206 86 Q208 72 220 72 Q232 74 230 88 Q224 128 188 162 Z" fill="#7BD37E" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="225" cy="79" rx="17" ry="11" fill="#7BD37E" stroke="${O}" stroke-width="3"/>
    <circle cx="229" cy="75" r="4.5" fill="#FFFFFF" stroke="${O}" stroke-width="1.5"/>
    <circle cx="230.5" cy="73.5" r="2.2" fill="${O}"/>
    <ellipse cx="238" cy="84" rx="2.5" ry="3" fill="${O}"/>
    <ellipse cx="136" cy="138" rx="8" ry="5" fill="#A6E59F"/><ellipse cx="158" cy="132" rx="6" ry="4" fill="#A6E59F"/><ellipse cx="176" cy="142" rx="5" ry="3.5" fill="#A6E59F"/>
    <rect x="132" y="164" width="13" height="26" rx="5" fill="#7BD37E" stroke="${O}" stroke-width="3"/>
    <rect x="178" y="164" width="13" height="26" rx="5" fill="#7BD37E" stroke="${O}" stroke-width="3"/>`,

  feu: (g) => `
    <defs>
      ${lin(g('sky'), '#0E1440', '#2B2466')}
      ${glow(g('glow'), '#FFB347', 0.6)}
    </defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${stars(40, 7, 120)}
    <circle cx="272" cy="38" r="14" fill="#FFF1B8"/><circle cx="279" cy="33" r="12" fill="#141A4C"/>
    <path d="M0 172 Q160 158 320 172 V200 H0 Z" fill="#3B2F4A" stroke="${O}" stroke-width="3"/>
    <path d="M-10 200 L-10 40 Q40 10 110 40 Q150 62 148 112 Q146 160 124 200 Z" fill="#4A3B5C" stroke="${O}" stroke-width="3"/>
    <path d="M18 200 Q18 122 60 112 Q102 110 106 200 Z" fill="#1A1228"/>
    <circle cx="200" cy="150" r="100" fill="url(#${g('glow')})"/>
    <line x1="120" y1="178" x2="100" y2="104" stroke="#7A5232" stroke-width="4" stroke-linecap="round"/>
    <path d="M96 106 L100 88 L106 104 Z" fill="#9AA3B0" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="172" y="166" width="56" height="11" rx="5" fill="#8B5A2B" stroke="${O}" stroke-width="2.5" transform="rotate(-14 200 171)"/>
    <rect x="172" y="166" width="56" height="11" rx="5" fill="#A06A35" stroke="${O}" stroke-width="2.5" transform="rotate(14 200 171)"/>
    <g class="art-flicker">
      <path d="M200 104 Q224 132 220 152 Q217 170 200 171 Q183 170 180 152 Q176 132 200 104 Z" fill="#FF7A2F" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M200 124 Q214 142 212 155 Q210 167 200 167 Q190 167 188 155 Q186 142 200 124 Z" fill="#FFC23D"/>
      <path d="M200 142 Q207 152 206 159 Q204 165 200 165 Q196 165 194 159 Q193 152 200 142 Z" fill="#FFF2A8"/>
    </g>
    <circle cx="190" cy="94" r="2" fill="#FFC23D"/><circle cx="212" cy="86" r="1.6" fill="#FFC23D"/><circle cx="204" cy="76" r="1.3" fill="#FFE08A"/>
    <g fill="#1A1228">
      <circle cx="146" cy="134" r="10"/><path d="M130 174 Q128 150 146 145 Q162 150 162 174 Z"/>
      <circle cx="262" cy="146" r="8"/><path d="M249 176 Q248 158 262 154 Q276 158 275 176 Z"/>
    </g>`,

  lascaux: (g) => `
    <defs>
      <radialGradient id="${g('wall')}" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#F4D7A1"/><stop offset="0.6" stop-color="#D9A066"/><stop offset="1" stop-color="#6B3F22"/></radialGradient>
      ${glow(g('ochre'), '#B5452A', 0.75)}
    </defs>
    <rect width="320" height="200" fill="url(#${g('wall')})"/>
    <g fill="#B8834F" opacity="0.35"><ellipse cx="60" cy="170" rx="60" ry="18"/><ellipse cx="250" cy="30" rx="70" ry="16"/><ellipse cx="200" cy="175" rx="40" ry="10"/></g>
    <circle cx="70" cy="56" r="30" fill="url(#${g('ochre')})"/>
    <g fill="#F2CF95">
      <rect x="60" y="56" width="22" height="26" rx="9"/>
      <rect x="60" y="38" width="6" height="22" rx="3"/><rect x="66.5" y="33" width="6" height="26" rx="3"/>
      <rect x="73" y="35" width="6" height="24" rx="3"/><rect x="79" y="41" width="5.5" height="20" rx="3"/>
      <rect x="50" y="58" width="6" height="18" rx="3" transform="rotate(-35 53 67)"/>
    </g>
    <g fill="#A8432A">
      <path d="M36 128 Q44 106 78 106 Q106 104 116 116 Q120 130 106 134 Q80 138 54 136 Q38 136 36 128 Z"/>
      <path d="M106 114 Q114 92 128 88 Q138 90 136 98 Q126 104 120 118 Z"/>
    </g>
    <g stroke="#A8432A" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M52 134 L46 158"/><path d="M64 136 L64 160"/><path d="M96 134 L100 158"/><path d="M106 132 L114 154"/>
      <path d="M38 124 Q24 128 22 144"/>
    </g>
    <g stroke="#3A2418" stroke-width="3" stroke-linecap="round"><path d="M112 98 l-6 -6"/><path d="M118 94 l-5 -7"/><path d="M124 90 l-3 -7"/></g>
    <g fill="#3A2418">
      <path d="M150 112 Q160 80 206 82 Q246 80 262 96 Q276 104 280 118 Q270 132 250 132 Q230 138 200 136 Q168 138 150 112 Z"/>
      <path d="M262 96 Q286 88 294 104 Q292 118 278 120 Z"/>
    </g>
    <g stroke="#3A2418" stroke-width="6" stroke-linecap="round" fill="none">
      <path d="M172 132 L168 162"/><path d="M188 134 L188 164"/><path d="M238 132 L242 160"/><path d="M256 128 L262 156"/>
      <path d="M152 112 Q138 118 136 136"/>
    </g>
    <g stroke="#3A2418" stroke-width="4" stroke-linecap="round" fill="none"><path d="M284 94 Q294 72 306 74"/><path d="M276 94 Q276 72 290 64"/></g>
    <ellipse cx="200" cy="100" rx="14" ry="6" fill="#A8432A" opacity="0.8"/>
    <g fill="#A8432A"><circle cx="160" cy="40" r="3.5"/><circle cx="172" cy="40" r="3.5"/><circle cx="184" cy="40" r="3.5"/><circle cx="196" cy="40" r="3.5"/></g>`,

  paysans: (g) => {
    let wheat = '';
    for (let row = 0; row < 2; row++) {
      for (let x = 150 + row * 6; x < 330; x += 12) {
        const y = 160 + row * 18;
        wheat += `<path d="M${x} ${y + 26} Q${x + 2} ${y + 8} ${x} ${y}" stroke="#B58A1E" stroke-width="2" fill="none"/><ellipse cx="${x}" cy="${y - 4}" rx="3.5" ry="8" fill="#F5C842" stroke="#B58A1E" stroke-width="1.5"/>`;
      }
    }
    return `
    <defs>${lin(g('sky'), '#7FD1F5', '#DDF4FF')}${glow(g('sun'), '#FFE27A', 0.9)}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    <circle cx="272" cy="40" r="34" fill="url(#${g('sun')})"/><circle cx="272" cy="40" r="17" fill="#FFD54A" stroke="${O}" stroke-width="2.5"/>
    ${cloud(70, 34)}${cloud(190, 52, 0.8)}
    <path d="M0 130 Q60 104 130 124 Q200 100 320 126 V200 H0 Z" fill="#A7D987"/>
    <path d="M140 156 Q230 140 320 150 V200 H140 Z" fill="#E8C04A" stroke="${O}" stroke-width="3"/>
    <path d="M0 156 Q80 146 150 158 V200 H0 Z" fill="#7CC26A" stroke="${O}" stroke-width="3"/>
    ${wheat}
    <rect x="34" y="110" width="76" height="48" rx="6" fill="#C98E5A" stroke="${O}" stroke-width="3"/>
    <path d="M24 118 L72 66 L120 118 Z" fill="#E3B34C" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <g stroke="#B5862C" stroke-width="2"><path d="M40 112 L72 78"/><path d="M104 112 L72 78"/><path d="M72 78 L72 114"/></g>
    <path d="M62 158 V136 Q72 124 82 136 V158 Z" fill="#5A3A22" stroke="${O}" stroke-width="2.5"/>
    <g fill="#FFFFFF" stroke="${O}" stroke-width="2">
      <circle cx="100" cy="174" r="9"/><circle cx="112" cy="168" r="10"/><circle cx="124" cy="174" r="9"/><circle cx="112" cy="178" r="9"/>
    </g>
    <g stroke="${O}" stroke-width="3" stroke-linecap="round"><path d="M104 184 v8"/><path d="M120 184 v8"/></g>
    <ellipse cx="134" cy="168" rx="7" ry="5.5" fill="#3A3346"/>
    <circle cx="136" cy="167" r="1.3" fill="#FFFFFF"/>`;
  },

  ecriture: (g) => {
    const r = rand(11);
    let marks = '';
    for (let row = 0; row < 5; row++) {
      const y = 62 + row * 22;
      let x = 92;
      while (x < 196) {
        const big = r() > 0.5;
        marks += big
          ? `<path d="M${x} ${y - 5} l9 5 l-9 5 z" fill="#7A4022"/><path d="M${x + 8} ${y} h${8 + r() * 8}" stroke="#7A4022" stroke-width="2.5" stroke-linecap="round"/>`
          : `<path d="M${x} ${y - 6} l5 9 l5 -9 z" fill="#7A4022"/><path d="M${x + 5} ${y + 2} v6" stroke="#7A4022" stroke-width="2.5" stroke-linecap="round"/>`;
        x += big ? 26 + r() * 6 : 15 + r() * 6;
      }
    }
    return `
    <defs>${lin(g('bg'), '#FBE3B0', '#E5B66E')}</defs>
    <rect width="320" height="200" fill="url(#${g('bg')})"/>
    <g fill="#D29A55" opacity="0.55">
      <rect x="196" y="118" width="118" height="44"/><rect x="212" y="98" width="86" height="22"/><rect x="230" y="80" width="50" height="20"/>
    </g>
    <rect y="160" width="320" height="40" fill="#D79E5C"/>
    <path d="M0 160 H320" stroke="${O}" stroke-width="3"/>
    <g transform="rotate(-6 140 100)">
      <rect x="72" y="32" width="148" height="136" rx="18" fill="#C77B47" stroke="${O}" stroke-width="3"/>
      <rect x="80" y="40" width="132" height="120" rx="13" fill="#D48C58"/>
      ${marks}
    </g>
    <g transform="rotate(30 258 92)">
      <rect x="252" y="24" width="12" height="128" rx="5" fill="#D9C27A" stroke="${O}" stroke-width="3"/>
      <path d="M252 148 L258 166 L264 148 Z" fill="#B59B55" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M252 60 h12 M252 100 h12" stroke="#B59B55" stroke-width="2"/>
    </g>`;
  },

  pyramides: (g) => `
    <defs>${lin(g('sky'), '#5EC6F2', '#FFE3A1')}${glow(g('sun'), '#FFE27A', 0.9)}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    <circle cx="252" cy="46" r="40" fill="url(#${g('sun')})"/>
    <circle cx="252" cy="46" r="20" fill="#FFD23F" stroke="${O}" stroke-width="2.5"/>
    ${bird(90, 40)}${bird(112, 30, 0.8)}
    <path d="M0 150 Q80 128 170 146 Q250 132 320 148 V200 H0 Z" fill="#F2CF84"/>
    <path d="M4 160 L44 116 L84 160 Z" fill="#EBC170" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M44 116 L84 160 L58 160 Z" fill="#C9933F"/>
    <path d="M196 160 L252 98 L308 160 Z" fill="#F0C46C" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M252 98 L308 160 L270 160 Z" fill="#C9933F" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M66 162 L150 60 L234 162 Z" fill="#F7CD72" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M150 60 L234 162 L176 162 Z" fill="#CF9A45" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <g stroke="#B9822F" stroke-width="1.5" opacity="0.7">
      <path d="M133 80 H156"/><path d="M116 101 H162"/><path d="M99 122 H168"/><path d="M82 142 H172"/>
    </g>
    <path d="M0 158 Q160 150 320 160 V200 H0 Z" fill="#F0BE62" stroke="${O}" stroke-width="3"/>
    <path d="M298 196 Q292 168 300 136" stroke="#8B5A2B" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g fill="#4FAE4A" stroke="${O}" stroke-width="2" stroke-linejoin="round">
      <path d="M300 136 Q280 122 262 132 Q282 128 300 140 Z"/><path d="M300 136 Q318 120 334 128 Q316 128 302 140 Z"/>
      <path d="M300 136 Q290 114 276 110 Q294 118 302 138 Z"/><path d="M300 136 Q312 112 326 108 Q312 120 302 138 Z"/>
    </g>`,

  'jeux-olympiques': (g) => {
    let leaves = '';
    for (let a = -55; a <= 235; a += 20) {
      const rad = (a * Math.PI) / 180;
      const x = 150 + Math.cos(rad) * 28;
      const y = 54 + Math.sin(rad) * 28;
      const rot = a + (a < 90 ? -60 : 60);
      leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="3.8" fill="#5FA845" stroke="${O}" stroke-width="1.5" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    let cols = '';
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 23;
      cols += `<rect x="${x}" y="96" width="11" height="48" fill="#FFF8E8" stroke="${O}" stroke-width="2"/><path d="M${x + 3.5} 100 v40 M${x + 7.5} 100 v40" stroke="#D9CFB8" stroke-width="1"/>`;
    }
    return `
    <defs>${lin(g('sky'), '#6FCBF7', '#E9F8FF')}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${cloud(270, 30, 0.8)}
    <path d="M0 140 Q90 118 180 136 Q250 120 320 134 V200 H0 Z" fill="#B8D58A"/>
    <rect x="192" y="144" width="122" height="8" fill="#FFF8E8" stroke="${O}" stroke-width="2"/>
    <rect x="186" y="152" width="134" height="8" fill="#FFF8E8" stroke="${O}" stroke-width="2"/>
    ${cols}
    <rect x="194" y="86" width="118" height="11" fill="#FFF8E8" stroke="${O}" stroke-width="2"/>
    <path d="M190 86 L253 58 L316 86 Z" fill="#FFF8E8" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M0 158 Q160 150 320 160 V200 H0 Z" fill="#E7D29C" stroke="${O}" stroke-width="3"/>
    ${leaves}
    <path d="M144 82 L136 96 L146 92 Z M156 82 L164 96 L154 92 Z" fill="#E23B3B" stroke="${O}" stroke-width="1.5"/>
    <circle cx="150" cy="82" r="4" fill="#E23B3B" stroke="${O}" stroke-width="1.5"/>
    <g stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"><path d="M50 86 Q32 80 40 110"/><path d="M106 86 Q124 80 116 110"/></g>
    <path d="M62 66 H94 L92 80 Q120 92 122 124 Q122 160 78 172 Q34 160 34 124 Q36 92 64 80 Z" fill="#E07A3A" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="58" y="60" width="40" height="8" rx="3" fill="#E07A3A" stroke="${O}" stroke-width="2.5"/>
    <path d="M60 172 H96 L100 182 H56 Z" fill="#C9632B" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M40 100 H116" stroke="${O}" stroke-width="4"/><path d="M38 148 H118" stroke="${O}" stroke-width="4"/>
    <g stroke="${O}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M76 116 L72 132"/><path d="M75 120 L62 116"/><path d="M75 120 L88 128"/>
      <path d="M72 132 L62 142"/><path d="M72 132 L84 136 L88 144"/>
    </g>
    <circle cx="78" cy="110" r="5.5" fill="${O}"/>`;
  },

  muraille: (g) => {
    const wall = 'M-10 152 Q50 118 100 134 Q150 150 190 120 Q230 92 270 108 Q300 120 330 100';
    const tower = (x, y) => `
      <rect x="${x - 12}" y="${y - 30}" width="24" height="32" fill="#E2BE86" stroke="${O}" stroke-width="2.5"/>
      <path d="M${x - 14} ${y - 30} v-6 h6 v4 h5 v-4 h6 v4 h5 v-4 h6 v6 Z" fill="#E2BE86" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="${x - 4}" y="${y - 22}" width="8" height="10" rx="4" fill="#5A3A22"/>`;
    return `
    <defs>${lin(g('sky'), '#BFE6F7', '#F7FCFF')}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${bird(60, 36)}${bird(80, 28, 0.7)}
    <path d="M0 116 L40 76 L80 106 L130 56 L180 100 L230 66 L280 96 L320 72 V200 H0 Z" fill="#B3CFC0"/>
    <path d="M0 150 Q60 100 110 128 Q160 90 210 126 Q260 94 320 116 V200 H0 Z" fill="#6FAE79" stroke="${O}" stroke-width="3"/>
    <ellipse cx="60" cy="118" rx="60" ry="7" fill="#FFFFFF" opacity="0.5"/>
    <path d="${wall}" stroke="${O}" stroke-width="22" fill="none"/>
    <path d="${wall}" stroke="#D6B07A" stroke-width="16" fill="none"/>
    <path d="${wall}" stroke="#C49A5E" stroke-width="7" fill="none" stroke-dasharray="6 6" transform="translate(0 -11)"/>
    ${tower(100, 134)}${tower(190, 120)}${tower(270, 108)}
    <path d="M0 178 Q100 160 200 180 T320 170 V200 H0 Z" fill="#4E9A5E" stroke="${O}" stroke-width="3"/>
    <ellipse cx="250" cy="150" rx="70" ry="6" fill="#FFFFFF" opacity="0.45"/>`;
  },

  cesar: (g) => {
    let leaves = '';
    for (let a = 150; a <= 300; a += 15) {
      const rad = (a * Math.PI) / 180;
      const x = 162 + Math.cos(rad) * 38;
      const y = 104 + Math.sin(rad) * 38;
      leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="3.6" fill="#4E8F35" stroke="#2E5A1E" stroke-width="1.2" transform="rotate(${a + 60} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return `
    <defs>
      <radialGradient id="${g('bg')}" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#D23A42"/><stop offset="1" stop-color="#6E1020"/></radialGradient>
      <radialGradient id="${g('coin')}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFF0A8"/><stop offset="0.5" stop-color="#F2BE34"/><stop offset="1" stop-color="#C98A12"/></radialGradient>
      <path id="${g('arc')}" d="M92 112 A70 70 0 0 0 232 112"/>
    </defs>
    <rect width="320" height="200" fill="url(#${g('bg')})"/>
    ${stars(14, 21, 200, '#FFD54A')}
    <circle cx="160" cy="102" r="82" fill="#8A1420" opacity="0.5"/>
    <circle cx="160" cy="100" r="80" fill="url(#${g('coin')})" stroke="${O}" stroke-width="3"/>
    <circle cx="160" cy="100" r="70" fill="none" stroke="#B98516" stroke-width="2.5" stroke-dasharray="1 5" stroke-linecap="round"/>
    <path d="M140 160 L142 142 Q126 134 126 112 Q124 84 144 70 Q164 58 182 68 Q194 76 194 92 L203 105 L195 108 Q197 113 193 116 L197 121 Q192 127 186 129 Q176 133 174 142 L176 160 Z" fill="#E8B232" stroke="#8A5B05" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="153" cy="104" rx="6" ry="9" fill="none" stroke="#8A5B05" stroke-width="2"/>
    <path d="M180 89 q5 -3 9 1" stroke="#8A5B05" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${leaves}
    <text font-family="'Baloo 2', sans-serif" font-weight="800" font-size="17" fill="#8A5B05" letter-spacing="4"><textPath href="#${g('arc')}" startOffset="50%" text-anchor="middle">CAESAR</textPath></text>
    <ellipse cx="126" cy="54" rx="22" ry="10" fill="#FFFFFF" opacity="0.35" transform="rotate(-30 126 54)"/>`;
  },

  'chute-rome': (g) => {
    const column = (x, top, h) => `
      <rect x="${x}" y="${top}" width="26" height="${h}" fill="#F3E3C3" stroke="${O}" stroke-width="2.5"/>
      <path d="M${x + 7} ${top + 4} v${h - 8} M${x + 13} ${top + 4} v${h - 8} M${x + 19} ${top + 4} v${h - 8}" stroke="#D8C49C" stroke-width="1.5"/>`;
    return `
    <defs>${lin(g('sky'), '#3B2A6B', '#FF9A5A')}${glow(g('sun'), '#FFC35A', 0.9)}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${stars(12, 5, 60)}
    <circle cx="230" cy="150" r="70" fill="url(#${g('sun')})"/>
    <circle cx="230" cy="150" r="36" fill="#FFC35A"/>
    ${bird(250, 50)}${bird(272, 62, 0.8)}${bird(230, 70, 0.6)}
    ${column(40, 58, 102)}
    <rect x="34" y="50" width="38" height="10" fill="#F3E3C3" stroke="${O}" stroke-width="2.5"/>
    ${column(96, 58, 102)}
    <rect x="90" y="50" width="38" height="10" fill="#F3E3C3" stroke="${O}" stroke-width="2.5"/>
    <path d="M26 36 H130 L122 44 L130 50 H26 Z" fill="#F3E3C3" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M150 160 V110 L156 102 L162 110 L168 100 L176 108 V160 Z" fill="#F3E3C3" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M157 112 v44 M163 112 v44 M169 112 v44" stroke="#D8C49C" stroke-width="1.5"/>
    <path d="M268 160 V130 L274 124 L282 132 L294 126 V160 Z" fill="#F3E3C3" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <g fill="#5FA845" stroke="#2E5A1E" stroke-width="1">
      <ellipse cx="44" cy="96" rx="5" ry="3" transform="rotate(-30 44 96)"/><ellipse cx="62" cy="110" rx="5" ry="3" transform="rotate(30 62 110)"/>
      <ellipse cx="48" cy="126" rx="5" ry="3" transform="rotate(-20 48 126)"/><ellipse cx="104" cy="140" rx="5" ry="3" transform="rotate(20 104 140)"/>
      <ellipse cx="160" cy="130" rx="5" ry="3" transform="rotate(-20 160 130)"/>
    </g>
    <path d="M0 160 Q160 150 320 162 V200 H0 Z" fill="#5B3C5E" stroke="${O}" stroke-width="3"/>
    <g transform="rotate(-8 214 174)">
      <rect x="188" y="164" width="52" height="22" rx="4" fill="#F3E3C3" stroke="${O}" stroke-width="2.5"/>
      <ellipse cx="240" cy="175" rx="6" ry="11" fill="#E6D2AA" stroke="${O}" stroke-width="2.5"/>
    </g>
    <rect x="100" y="172" width="34" height="16" rx="3" fill="#E6D2AA" stroke="${O}" stroke-width="2.5" transform="rotate(12 117 180)"/>`;
  },

  charlemagne: (g) => {
    const flake = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.85"><path d="M-6 0 H6 M-3 -5 L3 5 M-3 5 L3 -5"/></g>`;
    return `
    <defs>${lin(g('bg'), '#152A6E', '#3F7FE0')}${gold(g('gold'))}${glow(g('halo'), '#FFE27A', 0.55)}</defs>
    <rect width="320" height="200" fill="url(#${g('bg')})"/>
    ${stars(26, 13, 200)}
    ${flake(40, 40, 1)}${flake(280, 60, 1.2)}${flake(60, 150, 0.8)}${flake(270, 160, 0.9)}${flake(250, 24, 0.7)}
    <circle cx="160" cy="100" r="90" fill="url(#${g('halo')})"/>
    <path d="M58 160 Q58 140 90 138 H230 Q262 140 262 160 Q262 180 230 182 H90 Q58 180 58 160 Z" fill="#C4283A" stroke="${O}" stroke-width="3"/>
    <path d="M78 150 Q160 160 242 150" stroke="#E5566A" stroke-width="3" fill="none" opacity="0.7"/>
    <g fill="#F2B92C" stroke="${O}" stroke-width="2"><circle cx="60" cy="142" r="5"/><circle cx="260" cy="142" r="5"/><circle cx="60" cy="178" r="5"/><circle cx="260" cy="178" r="5"/></g>
    <path d="M100 116 L100 70 L130 94 L160 54 L190 94 L220 70 L220 116 Z" fill="url(#${g('gold')})" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 112 L112 86 L130 102 L160 70 L190 102 L208 86 L210 112 Z" fill="#7A1828" opacity="0.45"/>
    <rect x="96" y="110" width="128" height="32" rx="5" fill="url(#${g('gold')})" stroke="${O}" stroke-width="3"/>
    <rect x="155" y="26" width="10" height="30" rx="2" fill="url(#${g('gold')})" stroke="${O}" stroke-width="2.5"/>
    <rect x="146" y="33" width="28" height="9" rx="2" fill="url(#${g('gold')})" stroke="${O}" stroke-width="2.5"/>
    <g stroke="${O}" stroke-width="2">
      <circle cx="116" cy="126" r="6" fill="#E23B3B"/><circle cx="138" cy="126" r="6" fill="#2F9E5B"/>
      <ellipse cx="160" cy="126" rx="8" ry="9" fill="#3F7FE0"/>
      <circle cx="182" cy="126" r="6" fill="#2F9E5B"/><circle cx="204" cy="126" r="6" fill="#E23B3B"/>
    </g>
    <g fill="#FFFFFF" stroke="${O}" stroke-width="1.5"><circle cx="100" cy="68" r="5"/><circle cx="220" cy="68" r="5"/><circle cx="130" cy="92" r="4"/><circle cx="190" cy="92" r="4"/></g>
    <ellipse cx="126" cy="118" rx="12" ry="3" fill="#FFFFFF" opacity="0.5"/>`;
  },

  'jeanne-arc': (g) => {
    const lys = (x, y, s) => `
      <g transform="translate(${x} ${y}) scale(${s})" fill="#E2A21A" stroke="#8A5B05" stroke-width="1.2" stroke-linejoin="round">
        <path d="M0 -16 C5 -10 6 -2 2 6 L-2 6 C-6 -2 -5 -10 0 -16 Z"/>
        <path d="M-2 4 C-8 6 -14 0 -12 -8 C-10 -4 -7 -2 -2 0 Z"/>
        <path d="M2 4 C8 6 14 0 12 -8 C10 -4 7 -2 2 0 Z"/>
        <rect x="-7" y="4" width="14" height="3.5" rx="1"/>
        <path d="M-2 7.5 L-6 14 L0 11 L6 14 L2 7.5 Z"/>
      </g>`;
    const tower = (x, y, w, h) => `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#D8D2E2" stroke="${O}" stroke-width="2.5"/>
      <path d="M${x - 4} ${y} L${x + w / 2} ${y - w * 1.1} L${x + w + 4} ${y} Z" fill="#3F7FE0" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="${x + w / 2 - 3}" y="${y + 10}" width="6" height="10" rx="3" fill="${O}"/>`;
    return `
    <defs>${lin(g('sky'), '#9AD8F5', '#F2FAFF')}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${cloud(240, 30)}${cloud(150, 20, 0.6)}
    <path d="M0 150 Q120 128 320 146 V200 H0 Z" fill="#9CCB7A"/>
    <rect x="186" y="112" width="120" height="44" fill="#D8D2E2" stroke="${O}" stroke-width="2.5"/>
    <path d="M186 112 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6" fill="none" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    ${tower(176, 90, 26, 66)}${tower(234, 76, 30, 80)}${tower(292, 94, 24, 62)}
    <path d="M236 156 V134 Q249 120 262 134 V156 Z" fill="#5A3A22" stroke="${O}" stroke-width="2.5"/>
    <path d="M0 166 Q160 152 320 168 V200 H0 Z" fill="#6DB85C" stroke="${O}" stroke-width="3"/>
    <line x1="64" y1="196" x2="64" y2="30" stroke="#7A4A22" stroke-width="6" stroke-linecap="round"/>
    <path d="M58 32 L64 14 L70 32 Z" fill="#B7C0CC" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M67 36 Q110 26 150 40 Q190 54 228 42 L218 68 L228 94 Q190 106 150 92 Q110 78 67 90 Z" fill="#FFFFFF" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M150 40 Q154 66 150 92" stroke="#E6E2EE" stroke-width="3" fill="none"/>
    ${lys(104, 62, 1.1)}${lys(184, 70, 1.1)}`;
  },

  imprimerie: (g) => {
    const page = (x, y, rot, letter) => `
      <g transform="rotate(${rot} ${x + 28} ${y + 36})">
        <rect x="${x}" y="${y}" width="56" height="72" rx="3" fill="#FFF8E8" stroke="${O}" stroke-width="2.5"/>
        <text x="${x + 8}" y="${y + 24}" font-family="Georgia, serif" font-weight="700" font-size="20" fill="#C4283A">${letter}</text>
        <path d="M${x + 24} ${y + 12} h24 M${x + 24} ${y + 20} h24 M${x + 8} ${y + 32} h40 M${x + 8} ${y + 40} h40 M${x + 8} ${y + 48} h40 M${x + 8} ${y + 56} h28" stroke="#6B5B7B" stroke-width="2" stroke-linecap="round"/>
      </g>`;
    const type = (x, y, l) => `
      <rect x="${x}" y="${y}" width="24" height="24" rx="3" fill="#B7C0CC" stroke="${O}" stroke-width="2.5"/>
      <text x="${x + 12}" y="${y + 18}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="16" fill="${O}">${l}</text>`;
    return `
    <defs>${lin(g('bg'), '#7A5030', '#3A2414')}</defs>
    <rect width="320" height="200" fill="url(#${g('bg')})"/>
    <rect x="214" y="14" width="60" height="44" rx="4" fill="#FFE9A8" stroke="${O}" stroke-width="2.5"/>
    <path d="M244 14 V58 M214 36 H274" stroke="${O}" stroke-width="2"/>
    <path d="M214 58 L274 58 L320 200 L170 200 Z" fill="#FFE9A8" opacity="0.12"/>
    <rect y="174" width="320" height="26" fill="#2A190E"/>
    <rect x="58" y="30" width="16" height="146" fill="#A9713F" stroke="${O}" stroke-width="3"/>
    <rect x="160" y="30" width="16" height="146" fill="#A9713F" stroke="${O}" stroke-width="3"/>
    <rect x="48" y="20" width="138" height="18" rx="3" fill="#B97D47" stroke="${O}" stroke-width="3"/>
    <rect x="54" y="68" width="126" height="14" rx="2" fill="#B97D47" stroke="${O}" stroke-width="3"/>
    <rect x="111" y="38" width="14" height="52" fill="#9AA3B0" stroke="${O}" stroke-width="2.5"/>
    <path d="M111 44 l14 6 M111 54 l14 6 M111 64 l14 6" stroke="${O}" stroke-width="1.5"/>
    <rect x="70" y="50" width="96" height="7" rx="3" fill="#7A4A22" stroke="${O}" stroke-width="2" transform="rotate(-12 118 54)"/>
    <rect x="86" y="90" width="64" height="14" rx="2" fill="#8D99AB" stroke="${O}" stroke-width="2.5"/>
    <rect x="86" y="114" width="64" height="8" fill="#FFF8E8" stroke="${O}" stroke-width="2"/>
    <rect x="64" y="122" width="108" height="14" rx="2" fill="#B97D47" stroke="${O}" stroke-width="3"/>
    ${page(196, 70, 14, 'G')}${page(250, 96, -10, 'A')}
    ${type(196, 160, 'B')}${type(222, 158, 'C')}${type(248, 162, 'D')}`;
  },

  amerique: (g) => {
    const sail = (cx, top, w, h) => `
      <path d="M${cx - w / 2} ${top} Q${cx} ${top + 8} ${cx + w / 2} ${top} Q${cx + w / 2 + 6} ${top + h / 2} ${cx + w / 2} ${top + h} Q${cx} ${top + h + 8} ${cx - w / 2} ${top + h} Q${cx - w / 2 - 6} ${top + h / 2} ${cx - w / 2} ${top} Z" fill="#FFFDF3" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="${cx - 4}" y="${top + 9}" width="8" height="${h - 14}" fill="#D7263D"/>
      <rect x="${cx - w / 2 + 6}" y="${top + h / 2 - 6}" width="${w - 12}" height="8" fill="#D7263D"/>`;
    return `
    <defs>${lin(g('sky'), '#78CDF4', '#E4F7FF')}${lin(g('sea'), '#2C8FD6', '#174F94')}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    <circle cx="60" cy="34" r="16" fill="#FFD54A" stroke="${O}" stroke-width="2.5"/>
    ${cloud(250, 34)}${cloud(150, 22, 0.7)}
    ${bird(230, 70)}${bird(250, 80, 0.7)}
    <path d="M228 132 Q262 108 300 124 Q312 128 330 128 V136 H228 Z" fill="#6FBF6A" stroke="${O}" stroke-width="2.5"/>
    <path d="M276 118 Q274 104 280 94" stroke="#8B5A2B" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <g fill="#4FAE4A" stroke="${O}" stroke-width="1.5"><path d="M280 94 Q268 88 260 94 Q270 92 280 97 Z"/><path d="M280 94 Q292 86 300 92 Q290 92 281 97 Z"/><path d="M280 94 Q278 82 286 78 Q282 88 282 96 Z"/></g>
    <rect y="132" width="320" height="68" fill="url(#${g('sea')})"/>
    <path d="M0 132 H320" stroke="${O}" stroke-width="2.5"/>
    <g stroke="#6B3E1C" stroke-width="4" stroke-linecap="round"><path d="M100 146 V44"/><path d="M140 146 V28"/><path d="M180 140 V60"/></g>
    <path d="M100 44 L116 48 L100 52 Z M140 28 L158 32 L140 36 Z M180 60 L194 64 L180 68 Z" fill="#D7263D" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>
    ${sail(100, 60, 34, 44)}${sail(140, 42, 44, 58)}
    <path d="M182 66 L214 128 L182 128 Z" fill="#FFFDF3" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M46 140 L70 174 H182 L208 136 Q186 146 160 146 H92 Q66 146 46 140 Z" fill="#9A5B2E" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 120 L54 146 H88 L86 120 Z" fill="#B5703B" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M58 158 H196" stroke="#6B3E1C" stroke-width="3"/>
    <g fill="#FFE08A" stroke="${O}" stroke-width="1.5"><circle cx="90" cy="152" r="3"/><circle cx="116" cy="152" r="3"/><circle cx="142" cy="152" r="3"/><circle cx="168" cy="152" r="3"/></g>
    <g stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.85">
      <path d="M20 182 q10 -8 20 0 q10 8 20 0"/><path d="M200 186 q10 -8 20 0 q10 8 20 0"/><path d="M260 158 q8 -6 16 0 q8 6 16 0"/><path d="M30 156 q6 -5 12 0"/>
    </g>`;
  },

  joconde: (g) => `
    <defs>
      ${lin(g('wall'), '#8A3442', '#4A1A28')}
      ${gold(g('frame'))}
      ${lin(g('land'), '#AFC3A0', '#5D7A5A')}
      <clipPath id="${g('clip')}"><rect x="106" y="30" width="108" height="140" rx="2"/></clipPath>
    </defs>
    <rect width="320" height="200" fill="url(#${g('wall')})"/>
    <path d="M120 0 L200 0 L250 200 L70 200 Z" fill="#FFF3C4" opacity="0.1"/>
    <rect x="92" y="16" width="136" height="168" rx="6" fill="url(#${g('frame')})" stroke="${O}" stroke-width="3"/>
    <rect x="99" y="23" width="122" height="154" rx="4" fill="none" stroke="#B98516" stroke-width="2" stroke-dasharray="2 4"/>
    <g fill="#FFE98A" stroke="#B98516" stroke-width="1.5"><circle cx="98" cy="22" r="5"/><circle cx="222" cy="22" r="5"/><circle cx="98" cy="178" r="5"/><circle cx="222" cy="178" r="5"/></g>
    <rect x="106" y="30" width="108" height="140" rx="2" fill="url(#${g('land')})" stroke="${O}" stroke-width="2"/>
    <g clip-path="url(#${g('clip')})">
      <path d="M106 96 Q130 80 150 94 Q176 78 214 90 V170 H106 Z" fill="#7D8A5E"/>
      <path d="M200 90 Q186 110 204 126 Q218 140 214 150" stroke="#C9D6B8" stroke-width="3" fill="none"/>
      <path d="M160 52 Q132 52 130 86 Q128 122 122 172 H198 Q192 122 190 86 Q188 52 160 52 Z" fill="#3A2618"/>
      <path d="M116 172 Q120 126 142 114 Q160 120 178 114 Q200 126 204 172 Z" fill="#2F3A22"/>
      <path d="M146 114 Q160 130 174 114 Q168 107 160 107 Q152 107 146 114 Z" fill="#E9C08A"/>
      <ellipse cx="160" cy="84" rx="17" ry="22" fill="#E9C08A" stroke="#7A4E2A" stroke-width="1.2"/>
      <path d="M142 70 Q160 58 178 70" stroke="#3A2618" stroke-width="5" fill="none"/>
      <path d="M152 82 q3 -2 6 0 M163 82 q3 -2 6 0" stroke="#3A2618" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M160 86 q-1 5 1 7" stroke="#B88A5A" stroke-width="1.4" fill="none"/>
      <path d="M154 96 Q160 99 166 96" stroke="#8A3B2A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <ellipse cx="150" cy="162" rx="12" ry="6" fill="#E9C08A" stroke="#7A4E2A" stroke-width="1"/>
      <ellipse cx="168" cy="158" rx="12" ry="6" fill="#E9C08A" stroke="#7A4E2A" stroke-width="1"/>
    </g>
    <rect x="140" y="188" width="40" height="8" rx="2" fill="#F2B92C" stroke="${O}" stroke-width="1.5"/>`,

  versailles: (g) => {
    let rays = '';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const len = i % 2 ? 36 : 44;
      const x1 = 160 + Math.cos(a - 0.12) * 24, y1 = 48 + Math.sin(a - 0.12) * 24;
      const x2 = 160 + Math.cos(a + 0.12) * 24, y2 = 48 + Math.sin(a + 0.12) * 24;
      const x3 = 160 + Math.cos(a) * len, y3 = 48 + Math.sin(a) * len;
      rays += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="#F2B92C" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }
    let windows = '';
    for (let x = 30; x < 296; x += 16) {
      if (x > 118 && x < 196) continue;
      windows += `<rect x="${x}" y="114" width="8" height="14" rx="4" fill="#7BA7D6" stroke="${O}" stroke-width="1.2"/><rect x="${x}" y="134" width="8" height="14" rx="4" fill="#7BA7D6" stroke="${O}" stroke-width="1.2"/>`;
    }
    let bars = '';
    for (let x = 8; x < 320; x += 11) {
      bars += `<path d="M${x} 186 V160" stroke="#C98A12" stroke-width="3"/><path d="M${x - 3} 161 L${x} 154 L${x + 3} 161 Z" fill="#F2B92C"/>`;
    }
    return `
    <defs>${lin(g('sky'), '#7FD3F7', '#FFF3C4')}${gold(g('gold'))}${glow(g('halo'), '#FFE27A', 0.8)}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    <circle cx="160" cy="48" r="64" fill="url(#${g('halo')})"/>
    ${rays}
    <circle cx="160" cy="48" r="24" fill="url(#${g('gold')})" stroke="${O}" stroke-width="2.5"/>
    <circle cx="152" cy="45" r="2.5" fill="${O}"/><circle cx="168" cy="45" r="2.5" fill="${O}"/>
    <path d="M151 54 Q160 61 169 54" stroke="${O}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <circle cx="148" cy="52" r="3" fill="#FF9A6A" opacity="0.6"/><circle cx="172" cy="52" r="3" fill="#FF9A6A" opacity="0.6"/>
    <g fill="#3E8E5A" stroke="${O}" stroke-width="2"><path d="M8 156 L18 118 L28 156 Z"/><path d="M292 156 L302 118 L312 156 Z"/></g>
    <rect x="22" y="104" width="276" height="52" fill="#F6E7C8" stroke="${O}" stroke-width="2.5"/>
    <rect x="22" y="96" width="276" height="10" fill="#5A6B8E" stroke="${O}" stroke-width="2.5"/>
    <rect x="120" y="90" width="80" height="66" fill="#FBEFD6" stroke="${O}" stroke-width="2.5"/>
    <path d="M116 90 L160 70 L204 90 Z" fill="#FBEFD6" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="160" cy="82" r="5" fill="#F2B92C" stroke="${O}" stroke-width="1.5"/>
    ${windows}
    <g fill="#7BA7D6" stroke="${O}" stroke-width="1.2"><rect x="130" y="102" width="10" height="20" rx="5"/><rect x="155" y="102" width="10" height="20" rx="5"/><rect x="180" y="102" width="10" height="20" rx="5"/></g>
    <rect x="148" y="130" width="24" height="26" rx="10" fill="#5A3A22" stroke="${O}" stroke-width="2"/>
    <rect y="156" width="320" height="44" fill="#E8D7B0"/>
    <path d="M0 156 H320" stroke="${O}" stroke-width="2.5"/>
    ${bars}
    <path d="M0 166 H320 M0 182 H320" stroke="#C98A12" stroke-width="3"/>
    <circle cx="160" cy="170" r="11" fill="url(#${g('gold')})" stroke="${O}" stroke-width="2"/>`;
  },

  bastille: (g) => {
    const tower = (x) => `
      <rect x="${x}" y="72" width="32" height="90" fill="#7E7A8E" stroke="${O}" stroke-width="2.5"/>
      <path d="M${x - 2} 72 v-8 h7 v5 h6 v-5 h7 v5 h6 v-5 h8 v8 Z" fill="#7E7A8E" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="${x + 13}" y="90" width="6" height="14" rx="3" fill="${O}"/>`;
    const people = [[30, 176], [52, 170], [76, 178], [100, 172], [124, 178], [150, 174], [176, 180], [204, 176], [230, 180], [256, 176], [282, 180], [306, 176]]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y - 14}" r="8" fill="#3A2E5C"/><path d="M${x - 12} 200 Q${x - 12} ${y - 4} ${x} ${y - 4} Q${x + 12} ${y - 4} ${x + 12} 200 Z" fill="#3A2E5C"/>${i % 3 === 0 ? `<path d="M${x + 8} ${y - 6} L${x + 16} ${y - 44}" stroke="#5A3A22" stroke-width="3" stroke-linecap="round"/><path d="M${x + 13} ${y - 44} L${x + 17} ${y - 54} L${x + 20} ${y - 43} Z" fill="#B7C0CC" stroke="${O}" stroke-width="1"/>` : ''}${i % 4 === 1 ? `<path d="M${x - 11} ${y - 18} L${x} ${y - 28} L${x + 11} ${y - 18} Z" fill="#1E1838"/><circle cx="${x + 3}" cy="${y - 22}" r="2.5" fill="#E23B3B"/>` : ''}`)
      .join('');
    return `
    <defs>${lin(g('sky'), '#9CC9EA', '#FDE2C4')}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    <g fill="#8E8AA0" opacity="0.65"><circle cx="270" cy="40" r="20"/><circle cx="292" cy="28" r="16"/><circle cx="250" cy="30" r="14"/><circle cx="300" cy="52" r="12"/></g>
    <rect x="168" y="90" width="140" height="72" fill="#8E8AA0" stroke="${O}" stroke-width="2.5"/>
    ${tower(160)}${tower(218)}${tower(278)}
    <path d="M226 162 V140 Q238 128 250 140 V162 Z" fill="#3A2E5C" stroke="${O}" stroke-width="2"/>
    <path d="M0 160 Q160 152 320 162 V200 H0 Z" fill="#B7A27C" stroke="${O}" stroke-width="3"/>
    <line x1="60" y1="196" x2="60" y2="22" stroke="#5A3A22" stroke-width="5" stroke-linecap="round"/>
    <circle cx="60" cy="20" r="5" fill="#F2B92C" stroke="${O}" stroke-width="2"/>
    <path d="M63 30 Q83 20 103 26 L103 106 Q83 100 63 110 Z" fill="#2B54C4" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M103 26 Q123 32 143 30 L143 110 Q123 112 103 106 Z" fill="#FFFFFF" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M143 30 Q163 28 183 22 L183 102 Q163 108 143 110 Z" fill="#E23B3B" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    ${people}`;
  },

  avion: (g) => {
    let struts = '';
    for (const x of [72, 100, 128, 192, 220, 248]) struts += `<path d="M${x} 80 V104" stroke="${O}" stroke-width="2"/>`;
    return `
    <defs>${lin(g('sky'), '#58BFF0', '#D8F2FF')}</defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${cloud(60, 40)}${cloud(260, 30, 0.9)}${cloud(200, 150, 0.7)}
    <path d="M0 172 Q80 150 160 168 T320 160 V200 H0 Z" fill="#F1D592" stroke="${O}" stroke-width="3"/>
    <g stroke="#7FA34A" stroke-width="2.5" stroke-linecap="round"><path d="M40 176 l-4 -10 M44 176 l2 -12 M48 176 l5 -9"/><path d="M262 166 l-4 -10 M266 166 l2 -12"/></g>
    <ellipse cx="170" cy="182" rx="80" ry="5" fill="#C9A85E" opacity="0.6"/>
    <g stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.9"><path d="M290 70 h24"/><path d="M296 92 h22"/><path d="M288 114 h26"/></g>
    <g transform="rotate(-6 160 92)">
      <path d="M24 86 H60 M24 98 H60" stroke="${O}" stroke-width="2"/>
      <rect x="18" y="82" width="40" height="6" rx="3" fill="#FFF6DD" stroke="${O}" stroke-width="2"/>
      <rect x="18" y="94" width="40" height="6" rx="3" fill="#FFF6DD" stroke="${O}" stroke-width="2"/>
      <path d="M58 86 L70 80 M58 98 L70 104" stroke="${O}" stroke-width="2"/>
      ${struts}
      <path d="M260 80 H282 M260 104 H282" stroke="${O}" stroke-width="2"/>
      <rect x="280" y="74" width="7" height="36" rx="2" fill="#FFF6DD" stroke="${O}" stroke-width="2"/>
      <rect x="290" y="74" width="7" height="36" rx="2" fill="#FFF6DD" stroke="${O}" stroke-width="2"/>
      <ellipse cx="236" cy="92" rx="4" ry="20" fill="#8B5A2B" opacity="0.6"/>
      <ellipse cx="208" cy="92" rx="4" ry="20" fill="#8B5A2B" opacity="0.6"/>
      <rect x="62" y="72" width="200" height="10" rx="4" fill="#FFF6DD" stroke="${O}" stroke-width="2.5"/>
      <rect x="62" y="102" width="200" height="10" rx="4" fill="#FFF6DD" stroke="${O}" stroke-width="2.5"/>
      <rect x="150" y="90" width="18" height="12" rx="2" fill="#9AA3B0" stroke="${O}" stroke-width="2"/>
      <ellipse cx="136" cy="98" rx="14" ry="4.5" fill="#3A2E5C"/>
      <circle cx="120" cy="96" r="5.5" fill="#E9C08A" stroke="${O}" stroke-width="1.5"/>
      <path d="M115 94 Q120 88 125 94 Z" fill="#5A3A22"/>
    </g>`;
  },

  lune: (g) => `
    <defs>
      ${lin(g('sky'), '#05061A', '#1B1D4A')}
      ${lin(g('visor'), '#FFE08A', '#C07A1C', { x2: 0.6, y2: 1 })}
      ${glow(g('earthglow'), '#7FC8FF', 0.5)}
    </defs>
    <rect width="320" height="200" fill="url(#${g('sky')})"/>
    ${stars(55, 17, 140)}
    <circle cx="256" cy="48" r="38" fill="url(#${g('earthglow')})"/>
    <circle cx="256" cy="48" r="24" fill="#3C8CE7" stroke="${O}" stroke-width="2"/>
    <path d="M240 38 Q248 30 256 36 Q262 44 254 50 Q246 52 240 38 Z M262 54 Q272 50 276 58 Q270 66 262 62 Z" fill="#58C97B"/>
    <path d="M236 54 Q246 50 252 58" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M0 140 Q80 124 170 136 Q250 146 320 132 V200 H0 Z" fill="#C9CAD6" stroke="${O}" stroke-width="3"/>
    <g fill="#A9AAB9"><ellipse cx="40" cy="168" rx="18" ry="6"/><ellipse cx="270" cy="176" rx="24" ry="7"/><ellipse cx="190" cy="186" rx="12" ry="4"/><ellipse cx="240" cy="150" rx="9" ry="3"/></g>
    <g fill="#A9AAB9"><ellipse cx="160" cy="166" rx="5" ry="2.5"/><ellipse cx="174" cy="174" rx="5" ry="2.5"/><ellipse cx="188" cy="166" rx="5" ry="2.5"/><ellipse cx="202" cy="174" rx="5" ry="2.5"/></g>
    <line x1="214" y1="148" x2="214" y2="76" stroke="#E6E8F0" stroke-width="3" stroke-linecap="round"/>
    <g stroke="${O}" stroke-width="1.5">
      <rect x="216" y="78" width="46" height="30" fill="#FFFFFF"/>
      <path d="M216 82.3 H262 M216 90.9 H262 M216 99.5 H262" stroke="#E04545" stroke-width="4.3"/>
      <rect x="216" y="78" width="20" height="16" fill="#2B54C4"/>
    </g>
    <g fill="#FFFFFF"><circle cx="221" cy="83" r="1"/><circle cx="227" cy="83" r="1"/><circle cx="231" cy="88" r="1"/><circle cx="224" cy="89" r="1"/></g>
    <rect x="94" y="90" width="22" height="34" rx="5" fill="#D9DCE6" stroke="${O}" stroke-width="2.5"/>
    <rect x="100" y="120" width="13" height="26" rx="5" fill="#FFFFFF" stroke="${O}" stroke-width="2.5"/>
    <rect x="122" y="120" width="13" height="26" rx="5" fill="#FFFFFF" stroke="${O}" stroke-width="2.5"/>
    <rect x="98" y="142" width="17" height="9" rx="4" fill="#8E92A6" stroke="${O}" stroke-width="2"/>
    <rect x="120" y="142" width="17" height="9" rx="4" fill="#8E92A6" stroke="${O}" stroke-width="2"/>
    <rect x="102" y="86" width="38" height="40" rx="13" fill="#FFFFFF" stroke="${O}" stroke-width="2.5"/>
    <rect x="112" y="98" width="18" height="11" rx="2" fill="#D9DCE6" stroke="${O}" stroke-width="1.5"/>
    <circle cx="117" cy="103.5" r="2" fill="#E04545"/><circle cx="124" cy="103.5" r="2" fill="#3F7FE0"/>
    <rect x="136" y="72" width="11" height="28" rx="5.5" fill="#FFFFFF" stroke="${O}" stroke-width="2.5" transform="rotate(30 141 86)"/>
    <rect x="92" y="94" width="11" height="26" rx="5.5" fill="#FFFFFF" stroke="${O}" stroke-width="2.5" transform="rotate(14 97 107)"/>
    <circle cx="121" cy="70" r="19" fill="#FFFFFF" stroke="${O}" stroke-width="2.5"/>
    <ellipse cx="125" cy="71" rx="13" ry="11" fill="url(#${g('visor')})" stroke="${O}" stroke-width="2"/>
    <ellipse cx="120" cy="66" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.8"/>`,

  web: (g) => {
    let webLines = '';
    for (let i = 0; i < 6; i++) {
      const a = (i / 5) * (Math.PI / 2);
      webLines += `<path d="M0 0 L${(Math.cos(a) * 90).toFixed(1)} ${(Math.sin(a) * 90).toFixed(1)}"/>`;
    }
    for (const r of [24, 46, 68]) {
      webLines += `<path d="M${r} 0 Q${r * 0.85} ${r * 0.35} ${(r * 0.71).toFixed(1)} ${(r * 0.71).toFixed(1)} Q${r * 0.35} ${r * 0.85} 0 ${r}"/>`;
    }
    const node = (x, y, c) => `<rect x="${x - 14}" y="${y - 10}" width="28" height="20" rx="4" fill="#FFFFFF" stroke="${O}" stroke-width="2"/><rect x="${x - 14}" y="${y - 10}" width="28" height="6" rx="3" fill="${c}"/><path d="M${x - 9} ${y + 2} h18 M${x - 9} ${y + 6} h12" stroke="#B9B4D6" stroke-width="1.5"/>`;
    return `
    <defs>${lin(g('bg'), '#2B1F7A', '#6B4FD8')}${glow(g('screen'), '#9EE7FF', 0.35)}</defs>
    <rect width="320" height="200" fill="url(#${g('bg')})"/>
    ${stars(20, 31, 200, '#C9BEFF')}
    <g stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.35">${webLines}</g>
    <g transform="translate(320 200) rotate(180)" stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.25">${webLines}</g>
    <g stroke="#9EE7FF" stroke-width="2" stroke-dasharray="3 4" opacity="0.8"><path d="M44 60 L100 80"/><path d="M276 56 L222 76"/><path d="M50 150 L100 120"/><path d="M276 140 L222 118"/></g>
    ${node(40, 56, '#FF6F91')}${node(280, 52, '#FFC93C')}${node(44, 152, '#58C97B')}${node(282, 144, '#4FB8E8')}
    <rect x="86" y="30" width="148" height="114" rx="14" fill="#EDE6D3" stroke="${O}" stroke-width="3"/>
    <rect x="100" y="42" width="120" height="86" rx="8" fill="#0E1B3A" stroke="${O}" stroke-width="2.5"/>
    <circle cx="160" cy="80" r="40" fill="url(#${g('screen')})"/>
    <circle cx="160" cy="78" r="22" fill="#3C8CE7" stroke="#9EE7FF" stroke-width="2"/>
    <g stroke="#9EE7FF" stroke-width="1.5" fill="none"><ellipse cx="160" cy="78" rx="9" ry="22"/><path d="M138 78 H182 M142 66 H178 M142 90 H178"/></g>
    <text x="160" y="120" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="13" fill="#9EE7FF">www</text>
    <circle cx="214" cy="136" r="3" fill="#58C97B"/>
    <path d="M142 144 L136 162 H184 L178 144 Z" fill="#D5CDB6" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="96" y="172" width="128" height="18" rx="5" fill="#EDE6D3" stroke="${O}" stroke-width="2.5"/>
    <g fill="#C9C0A8"><rect x="104" y="177" width="10" height="4" rx="1"/><rect x="118" y="177" width="10" height="4" rx="1"/><rect x="132" y="177" width="10" height="4" rx="1"/><rect x="146" y="177" width="10" height="4" rx="1"/><rect x="160" y="177" width="10" height="4" rx="1"/><rect x="174" y="177" width="10" height="4" rx="1"/><rect x="188" y="177" width="10" height="4" rx="1"/><rect x="202" y="177" width="12" height="4" rx="1"/><rect x="120" y="183" width="80" height="4" rx="1"/></g>
    <ellipse cx="248" cy="182" rx="10" ry="13" fill="#EDE6D3" stroke="${O}" stroke-width="2.5"/>
    <path d="M248 169 V180" stroke="${O}" stroke-width="2"/>`;
  },
};

let counter = 0;

/** Renvoie le dessin d'un événement, prêt à être inséré dans la page. */
export function renderArt(id, label = '') {
  const scene = SCENES[id];
  if (!scene) return '';
  const uid = `fa${++counter}`;
  const g = (name) => `${uid}-${name}`;
  return `<svg class="art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">${scene(g)}</svg>`;
}

/* Professeur Hibou, la mascotte historienne. */
export const OWL = `
<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
  <path d="M28 46 L20 14 L46 36 Z" fill="#A0704A" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M92 46 L100 14 L74 36 Z" fill="#A0704A" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="60" cy="78" rx="42" ry="46" fill="#A0704A" stroke="${O}" stroke-width="3"/>
  <ellipse cx="60" cy="92" rx="27" ry="29" fill="#F3D9AE"/>
  <g stroke="#C9A06A" stroke-width="2" fill="none" stroke-linecap="round"><path d="M50 88 l4 4 l4 -4"/><path d="M62 88 l4 4 l4 -4"/><path d="M56 100 l4 4 l4 -4"/><path d="M46 102 l4 4 l4 -4"/><path d="M66 102 l4 4 l4 -4"/></g>
  <path d="M20 76 Q12 100 30 116 Q28 96 34 82 Z" fill="#8A5B38" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M100 76 Q108 100 90 116 Q92 96 86 82 Z" fill="#8A5B38" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
  <g class="owl-eyes">
    <circle cx="44" cy="56" r="14" fill="#FFFFFF" stroke="${O}" stroke-width="2.5"/>
    <circle cx="76" cy="56" r="14" fill="#FFFFFF" stroke="${O}" stroke-width="2.5"/>
    <circle cx="46" cy="57" r="6" fill="${O}"/><circle cx="78" cy="57" r="6" fill="${O}"/>
    <circle cx="48" cy="55" r="2" fill="#FFFFFF"/><circle cx="80" cy="55" r="2" fill="#FFFFFF"/>
  </g>
  <g fill="none" stroke="#E2A21A" stroke-width="3"><circle cx="44" cy="56" r="17"/><circle cx="76" cy="56" r="17"/><path d="M61 54 Q60 51 59 54"/></g>
  <path d="M55 68 L65 68 L60 79 Z" fill="#FFB23D" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
  <g fill="#FFB23D" stroke="${O}" stroke-width="2"><ellipse cx="46" cy="124" rx="8" ry="4"/><ellipse cx="74" cy="124" rx="8" ry="4"/></g>
</svg>`;
