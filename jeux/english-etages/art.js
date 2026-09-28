// ============================================================================
// Tous les dessins du jeu, en SVG : Colette, les immeubles vus de la rue,
// la tour Eiffel, les toits de Paris, les pigeons, le réverbère, la terrasse.
// ============================================================================

/* ---------- Colette : pantalon bleu, baskets beiges, veste beige,
   longs cheveux blonds ondulés, petites lunettes (et parfois une baguette) ---------- */
export function ladySVG() {
  return `
<svg class="lady-svg" viewBox="0 0 100 230" aria-hidden="true">
  <path class="ld-hair-back" d="M34 24 Q29 40 33 54 Q27 66 32 78 Q28 90 36 98 Q44 102 50 99 Q56 102 64 98 Q72 90 68 78 Q73 66 67 54 Q71 40 66 24 Q50 6 34 24 Z" fill="#EFC862" stroke="#C99E3F" stroke-width="1.2"/>

  <g class="ld-leg ld-leg-r">
    <path d="M50 120 L61 120 L60 196 L51 196 Z" fill="#2B57A3"/>
    <path d="M50 195 L60 195 Q66 198 67 204 L49 204 Z" fill="#E6D3AE" stroke="#BFA77C" stroke-width=".8"/>
    <rect x="49" y="203.5" width="18.5" height="3" rx="1.2" fill="#FFFDF7" stroke="#BFA77C" stroke-width=".6"/>
  </g>
  <g class="ld-leg ld-leg-l">
    <path d="M39 120 L50 120 L49 196 L40 196 Z" fill="#3A69BD"/>
    <path d="M39 195 L49 195 Q55 198 56 204 L38 204 Z" fill="#EDDBB8" stroke="#BFA77C" stroke-width=".8"/>
    <rect x="38" y="203.5" width="18.5" height="3" rx="1.2" fill="#FFFDF7" stroke="#BFA77C" stroke-width=".6"/>
  </g>

  <g class="ld-arm ld-arm-r">
    <path d="M58 55 L66 53 L69 104 L61 106 Z" fill="#CDB286"/>
    <circle cx="65" cy="109" r="4.6" fill="#F2CDB3"/>
  </g>

  <g class="ld-body">
    <rect x="46" y="42" width="8" height="12" fill="#F2CDB3"/>
    <path d="M35 53 Q50 47 65 53 L69 126 Q50 133 31 126 Z" fill="#DCC398"/>
    <path d="M45 51 L50 66 L55 51 Z" fill="#FFFFFF"/>
    <path d="M44 51 L50 74 L56 51" fill="none" stroke="#B3966A" stroke-width="1.6"/>
    <line x1="50" y1="74" x2="50" y2="127" stroke="#B3966A" stroke-width="1"/>
    <rect x="33" y="93" width="34" height="5" rx="1" fill="#C4A676"/>
    <circle cx="53.5" cy="82" r="1.4" fill="#8A7050"/>
    <circle cx="53.5" cy="106" r="1.4" fill="#8A7050"/>
    <path d="M57 100 L64 100 L63 108 L58 108 Z" fill="none" stroke="#B3966A" stroke-width=".8"/>
  </g>

  <g class="ld-arm ld-arm-l">
    <g class="ld-baguette">
      <rect x="31" y="84" width="8" height="54" rx="4" fill="#D99A4E" stroke="#B0722F" stroke-width="1" transform="rotate(-28 35 111)"/>
      <path d="M27 99 l6 -3 M29 108 l6 -3 M32 117 l6 -3 M35 126 l6 -3" stroke="#F3CF8E" stroke-width="1.6" stroke-linecap="round" transform="rotate(-8 35 111)"/>
    </g>
    <path d="M34 53 L42 55 L39 106 L31 104 Z" fill="#DCC398" stroke="#B3966A" stroke-width=".6"/>
    <circle cx="35" cy="109" r="4.6" fill="#F4D3BC"/>
  </g>

  <g class="ld-head">
    <ellipse cx="50" cy="30" rx="13" ry="15" fill="#F6D6C0"/>
    <circle cx="41" cy="37" r="2.8" fill="#F59C9C" opacity=".6"/>
    <circle cx="59" cy="37" r="2.8" fill="#F59C9C" opacity=".6"/>
    <circle cx="45" cy="31" r="1.3" fill="#2E2A4D"/>
    <circle cx="55" cy="31" r="1.3" fill="#2E2A4D"/>
    <circle cx="45" cy="31" r="4" fill="rgba(255,255,255,.25)" stroke="#6B4A34" stroke-width="1.2"/>
    <circle cx="55" cy="31" r="4" fill="rgba(255,255,255,.25)" stroke="#6B4A34" stroke-width="1.2"/>
    <line x1="49" y1="31" x2="51" y2="31" stroke="#6B4A34" stroke-width="1.2"/>
    <path class="ld-mouth-happy" d="M45.5 38.5 Q50 43 54.5 38.5" fill="#fff" stroke="#C0504D" stroke-width="1.5" stroke-linecap="round"/>
    <path class="ld-mouth-sad" d="M45.5 41 Q50 37 54.5 41" fill="none" stroke="#C0504D" stroke-width="1.5" stroke-linecap="round"/>
    <path class="ld-tear" d="M44 36 Q42.5 39 44 40.5 Q45.5 39 44 36 Z" fill="#6EC3F0"/>
    <circle cx="36.5" cy="36" r="1.4" fill="#FFF8EC" stroke="#D9C9A8" stroke-width=".5"/>
    <circle cx="63.5" cy="36" r="1.4" fill="#FFF8EC" stroke="#D9C9A8" stroke-width=".5"/>
    <path d="M36 30 Q35 13 51 12 Q66 13 65 29 Q61 20 54 19 Q56 23 53 25 Q50 20 44 21 Q39 24 36 30 Z" fill="#F4D173" stroke="#C99E3F" stroke-width="1"/>
    <path d="M36 29 Q33 38 36 46 Q33 52 36 58" fill="none" stroke="#C99E3F" stroke-width="1.2"/>
    <path d="M64 29 Q67 38 64 46 Q67 52 64 58" fill="none" stroke="#C99E3F" stroke-width="1.2"/>
  </g>
</svg>`;
}

/* ---------- Un immeuble haussmannien vu de loin (écran de choix du niveau) ---------- */
const PALETTES = {
  debutant:      { stone: '#F3E6CB', dark: '#DCC8A3', awning: '#D94A4A', door: '#2F6B4F', flower: '#E8384F' },
  intermediaire: { stone: '#F1DDBF', dark: '#D9BF97', awning: '#2D6CC0', door: '#1F4E7A', flower: '#F28C28' },
  expert:        { stone: '#EDDCD2', dark: '#D3BBAE', awning: '#8A2346', door: '#4A2440', flower: '#C04BD6' },
};

export function buildingSVG(levelId, shopName) {
  const p = PALETTES[levelId];
  let floors = '';
  for (let f = 0; f < 10; f++) {
    const y = 78 + f * 27;
    const longBalcony = f === 2 || f === 5 || f === 8;
    for (let i = 0; i < 5; i++) {
      const x = 24 + i * 32;
      const lit = (f * 5 + i * 3) % 7 === 0;   // quelques fenêtres ouvertes et allumées
      floors += `<rect x="${x - 1.5}" y="${y - 3}" width="23" height="2.4" fill="${p.dark}"/>`;
      floors += lit
        ? `<rect x="${x}" y="${y}" width="20" height="19" fill="#FFD46E"/><rect x="${x}" y="${y}" width="4" height="19" fill="#E87A8C"/><rect x="${x + 16}" y="${y}" width="4" height="19" fill="#E87A8C"/>`
        : `<rect x="${x}" y="${y}" width="20" height="19" fill="#8FA0B3"/><line x1="${x + 10}" y1="${y}" x2="${x + 10}" y2="${y + 19}" stroke="#6F8094" stroke-width="1"/>`;
      if (!longBalcony) {
        floors += `<rect x="${x - 1.5}" y="${y + 13}" width="23" height="6" fill="none" stroke="#2B2A2E" stroke-width="1.2"/>`;
      }
      if ((f + i) % 3 === 0) {
        floors += `<circle cx="${x + 5}" cy="${y + 13}" r="2.2" fill="${p.flower}"/><circle cx="${x + 10}" cy="${y + 12.4}" r="2.2" fill="${p.flower}"/><circle cx="${x + 15}" cy="${y + 13}" r="2.2" fill="${p.flower}"/>`;
      }
    }
    if (longBalcony) {
      floors += `<rect x="20" y="${y + 13}" width="160" height="6" fill="none" stroke="#2B2A2E" stroke-width="1.3"/><rect x="18" y="${y + 19}" width="164" height="2.5" fill="${p.dark}"/>`;
    }
    floors += `<rect x="12" y="${y + 21.5}" width="176" height="2" fill="${p.dark}" opacity=".7"/>`;
  }

  const stripes = Array.from({ length: 8 }, (_, i) =>
    `<rect x="${14 + i * 8}" y="355" width="4" height="11" fill="#fff"/><rect x="${118 + i * 8}" y="355" width="4" height="11" fill="#fff"/>`).join('');

  return `
<svg class="bld-svg" viewBox="0 0 200 410" aria-hidden="true">
  <rect x="44" y="4" width="14" height="24" fill="#C9785A"/><rect x="44" y="2" width="14" height="4" fill="#A85F45"/>
  <rect x="47" y="-3" width="3" height="6" fill="#B86A4E"/><rect x="52" y="-3" width="3" height="6" fill="#B86A4E"/>
  <rect x="140" y="8" width="14" height="20" fill="#C9785A"/><rect x="140" y="6" width="14" height="4" fill="#A85F45"/>
  <path d="M10 70 L28 22 L172 22 L190 70 Z" fill="#7F8EA1"/>
  <path d="M28 22 L172 22 L174 27 L26 27 Z" fill="#9AA7B8"/>
  ${[40, 70, 100, 130, 160].map((x) => `<path d="M${x - 8} 62 L${x - 8} 42 Q${x} 32 ${x + 8} 42 L${x + 8} 62 Z" fill="${p.stone}"/><path d="M${x - 5} 60 L${x - 5} 44 Q${x} 37 ${x + 5} 44 L${x + 5} 60 Z" fill="#3C4655"/>`).join('')}
  <rect x="6" y="68" width="188" height="7" rx="1.5" fill="${p.dark}"/>
  <rect x="12" y="75" width="176" height="273" fill="${p.stone}"/>
  <rect x="12" y="75" width="6" height="273" fill="${p.dark}" opacity=".6"/><rect x="182" y="75" width="6" height="273" fill="${p.dark}" opacity=".6"/>
  ${floors}
  <rect x="8" y="345" width="184" height="6" fill="${p.dark}"/>
  <rect x="12" y="351" width="176" height="55" fill="${p.stone}"/>
  <rect x="16" y="364" width="66" height="42" fill="#3C4655"/><rect x="118" y="364" width="66" height="42" fill="#3C4655"/>
  <rect x="12" y="355" width="74" height="11" fill="${p.awning}"/><rect x="114" y="355" width="74" height="11" fill="${p.awning}"/>
  ${stripes}
  <path d="M86 406 L86 372 Q100 356 114 372 L114 406 Z" fill="${p.door}" stroke="${p.dark}" stroke-width="2"/>
  <line x1="100" y1="366" x2="100" y2="406" stroke="rgba(0,0,0,.3)" stroke-width="1"/>
  <text x="49" y="386" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="10" fill="#FFE8A8">${shopName}</text>
</svg>`;
}

/* ---------- La tour Eiffel ---------- */
export function eiffelSVG(className = '') {
  const lattice = [];
  for (let y = 30; y < 230; y += 14) {
    const t = y / 240;
    const half = 3 + t * t * 44;
    lattice.push(`M${50 - half} ${y} L${50 + half * 0.6} ${y + 14} M${50 + half} ${y} L${50 - half * 0.6} ${y + 14}`);
  }
  return `
<svg class="eiffel ${className}" viewBox="0 0 100 240" aria-hidden="true">
  <line x1="50" y1="0" x2="50" y2="18" stroke="currentColor" stroke-width="1.6"/>
  <path d="M50 14 L54 22 L56 60 L61 100 L70 148 L92 240 L74 240 Q50 178 26 240 L8 240 L30 148 L39 100 L44 60 L46 22 Z" fill="currentColor"/>
  <path d="${lattice.join(' ')}" stroke="rgba(255,255,255,.18)" stroke-width="1" fill="none"/>
  <rect x="36" y="98" width="28" height="5" rx="1" fill="currentColor"/>
  <rect x="24" y="146" width="52" height="6" rx="1" fill="currentColor"/>
  <rect x="44" y="58" width="12" height="4" rx="1" fill="currentColor"/>
  <g class="sparkle-lights">
    ${Array.from({ length: 26 }, (_, i) => {
      const y = 20 + (i * 37) % 215;
      const t = y / 240;
      const half = 3 + t * t * 40;
      const x = 50 + (((i * 53) % 100) / 50 - 1) * half;
      return `<circle cx="${x.toFixed(1)}" cy="${y}" r="1.6" style="animation-delay:${(i * 0.13).toFixed(2)}s"/>`;
    }).join('')}
  </g>
</svg>`;
}

/* ---------- Les toits de Paris (et le Sacré-Cœur au loin) ---------- */
export function skylineSVG() {
  return `
<svg class="skyline" viewBox="0 0 800 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <g fill="#C7D3E3">
    <path d="M40 120 L40 60 Q55 52 70 60 L70 48 Q90 20 110 48 L110 60 Q125 52 140 60 L140 120 Z"/>
    <rect x="86" y="14" width="3" height="12"/><circle cx="87.5" cy="12" r="3"/>
  </g>
  <g fill="#AFBED2">
    <path d="M0 120 L0 78 L14 66 L60 66 L74 78 L74 120 Z"/>
    <path d="M150 120 L150 72 L166 58 L230 58 L246 72 L246 120 Z"/>
    <path d="M330 120 L330 80 L344 68 L396 68 L410 80 L410 120 Z"/>
    <path d="M470 120 L470 70 L486 56 L556 56 L572 70 L572 120 Z"/>
    <path d="M640 120 L640 76 L654 64 L714 64 L728 76 L728 120 Z"/>
    <rect x="178" y="44" width="8" height="16"/><rect x="214" y="48" width="8" height="12"/>
    <rect x="500" y="42" width="8" height="16"/><rect x="530" y="46" width="8" height="12"/>
    <rect x="670" y="50" width="8" height="16"/>
  </g>
  <g fill="#98A9C0">
    <path d="M60 120 L60 90 L72 80 L140 80 L152 90 L152 120 Z"/>
    <path d="M240 120 L240 86 L254 76 L320 76 L334 86 L334 120 Z"/>
    <path d="M400 120 L400 92 L412 82 L470 82 L482 92 L482 120 Z"/>
    <path d="M566 120 L566 88 L580 78 L640 78 L654 88 L654 120 Z"/>
    <path d="M722 120 L722 84 L736 74 L800 74 L800 120 Z"/>
    <rect x="270" y="64" width="8" height="14"/><rect x="600" y="66" width="8" height="14"/>
  </g>
</svg>`;
}

/* ---------- Un pigeon parisien ---------- */
export function pigeonSVG() {
  return `<svg class="pigeon-svg" viewBox="0 0 40 20" aria-hidden="true"><path class="pg-wings" d="M2 10 Q10 1 19 10 Q28 1 38 10" fill="none" stroke="#5B6475" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="20" cy="11" rx="4" ry="2.6" fill="#5B6475"/></svg>`;
}

/* ---------- Le réverbère ---------- */
export function lampSVG() {
  return `
<svg class="lamp-svg" viewBox="0 0 40 160" aria-hidden="true">
  <circle cx="20" cy="22" r="16" fill="#FFE9A6" opacity=".35"/>
  <path d="M12 10 L28 10 L25 30 L15 30 Z" fill="#FFE39A" stroke="#23392E" stroke-width="2"/>
  <path d="M10 10 L20 3 L30 10 Z" fill="#23392E"/>
  <rect x="17" y="30" width="6" height="4" fill="#23392E"/>
  <rect x="18" y="34" width="4" height="110" fill="#23392E"/>
  <path d="M12 160 L14 146 L26 146 L28 160 Z" fill="#23392E"/>
  <path d="M20 52 q-10 4 -8 12 M20 52 q10 4 8 12" fill="none" stroke="#23392E" stroke-width="2"/>
</svg>`;
}

/* ---------- La petite terrasse de café ---------- */
export function cafeSVG() {
  return `
<svg class="cafe-svg" viewBox="0 0 110 70" aria-hidden="true">
  <g stroke="#8B5A2B" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M14 30 L14 68 M14 44 L32 44 L34 68 M30 44 L30 66"/>
    <path d="M96 30 L96 68 M96 44 L78 44 L76 68 M80 44 L80 66"/>
  </g>
  <path d="M10 30 Q14 26 18 30" stroke="#8B5A2B" stroke-width="3" fill="none"/>
  <path d="M92 30 Q96 26 100 30" stroke="#8B5A2B" stroke-width="3" fill="none"/>
  <rect x="12" y="40" width="22" height="5" rx="2" fill="#D94A4A"/><rect x="76" y="40" width="22" height="5" rx="2" fill="#D94A4A"/>
  <ellipse cx="55" cy="34" rx="20" ry="4.5" fill="#E9E4DA" stroke="#9A948A" stroke-width="1.2"/>
  <rect x="53" y="36" width="4" height="28" fill="#3A3A3A"/>
  <path d="M45 68 L55 62 L65 68" stroke="#3A3A3A" stroke-width="3" fill="none"/>
  <rect x="47" y="27" width="7" height="6" rx="1.5" fill="#fff" stroke="#9A948A"/>
  <path d="M54 29 q3 1 0 3" stroke="#9A948A" fill="none"/>
  <path d="M60 32 l3 -8 l3 8 Z" fill="#E8B04A"/>
</svg>`;
}

/* ---------- Petits drapeaux (les emoji drapeaux ne s'affichent pas partout) ---------- */
export const FLAG_UK = `<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><clipPath id="ukc"><path d="M0 0v30h60V0z"/></clipPath><g clip-path="url(#ukc)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" stroke="#C8102E" stroke-width="2.4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>`;
export const FLAG_FR = `<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><rect width="20" height="30" fill="#002395"/><rect x="20" width="20" height="30" fill="#fff"/><rect x="40" width="20" height="30" fill="#ED2939"/></svg>`;
