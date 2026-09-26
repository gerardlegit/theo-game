// ============================================================================
// Colette, la dame parisienne : pantalon bleu, baskets beiges, veste beige,
// longs cheveux blonds ondulés et petites lunettes.
// Chaque partie du corps est un groupe (ld-leg-l, ld-arm-r, ld-head…) que le
// CSS anime : marche, danse joyeuse, danse triste.
// ============================================================================

export function ladySVG() {
  return `
<svg class="lady-svg" viewBox="0 0 100 230" aria-hidden="true">
  <!-- cheveux (arrière) -->
  <path class="ld-hair-back" d="M34 24 Q29 40 33 54 Q27 66 32 78 Q28 90 36 98 Q44 102 50 99 Q56 102 64 98 Q72 90 68 78 Q73 66 67 54 Q71 40 66 24 Q50 6 34 24 Z" fill="#E9C46A" stroke="#C9A24A" stroke-width="1.2"/>

  <!-- jambes : pantalon bleu + baskets beiges -->
  <g class="ld-leg ld-leg-r">
    <path d="M50 120 L61 120 L60 196 L51 196 Z" fill="#2F5DA8"/>
    <path d="M50 195 L60 195 Q66 198 67 204 L49 204 Z" fill="#E6D3AE" stroke="#BFA77C" stroke-width=".8"/>
    <rect x="49" y="203.5" width="18.5" height="3" rx="1.2" fill="#FFFDF7" stroke="#BFA77C" stroke-width=".6"/>
  </g>
  <g class="ld-leg ld-leg-l">
    <path d="M39 120 L50 120 L49 196 L40 196 Z" fill="#3D6CB9"/>
    <path d="M39 195 L49 195 Q55 198 56 204 L38 204 Z" fill="#EBD9B6" stroke="#BFA77C" stroke-width=".8"/>
    <rect x="38" y="203.5" width="18.5" height="3" rx="1.2" fill="#FFFDF7" stroke="#BFA77C" stroke-width=".6"/>
  </g>

  <!-- bras arrière -->
  <g class="ld-arm ld-arm-r">
    <path d="M58 55 L66 53 L69 104 L61 106 Z" fill="#CDB286"/>
    <circle cx="65" cy="109" r="4.6" fill="#F2CDB3"/>
  </g>

  <!-- veste beige -->
  <g class="ld-body">
    <rect x="46" y="42" width="8" height="12" fill="#F2CDB3"/>
    <path d="M35 53 Q50 47 65 53 L69 126 Q50 133 31 126 Z" fill="#D8BF94"/>
    <path d="M45 51 L50 66 L55 51 Z" fill="#FFFFFF"/>
    <path d="M44 51 L50 74 L56 51" fill="none" stroke="#B3966A" stroke-width="1.6"/>
    <line x1="50" y1="74" x2="50" y2="127" stroke="#B3966A" stroke-width="1"/>
    <rect x="33" y="93" width="34" height="5" rx="1" fill="#C4A676"/>
    <circle cx="53.5" cy="82" r="1.4" fill="#8A7050"/>
    <circle cx="53.5" cy="106" r="1.4" fill="#8A7050"/>
  </g>

  <!-- bras avant -->
  <g class="ld-arm ld-arm-l">
    <path d="M34 53 L42 55 L39 106 L31 104 Z" fill="#D8BF94" stroke="#B3966A" stroke-width=".6"/>
    <circle cx="35" cy="109" r="4.6" fill="#F4D3BC"/>
  </g>

  <!-- tête -->
  <g class="ld-head">
    <ellipse cx="50" cy="30" rx="13" ry="15" fill="#F4D3BC"/>
    <circle cx="41" cy="37" r="2.6" fill="#F4A6A0" opacity=".6"/>
    <circle cx="59" cy="37" r="2.6" fill="#F4A6A0" opacity=".6"/>
    <circle cx="45" cy="31" r="1.3" fill="#2E2A4D"/>
    <circle cx="55" cy="31" r="1.3" fill="#2E2A4D"/>
    <!-- petites lunettes -->
    <circle cx="45" cy="31" r="4" fill="rgba(255,255,255,.25)" stroke="#6B4A34" stroke-width="1.2"/>
    <circle cx="55" cy="31" r="4" fill="rgba(255,255,255,.25)" stroke="#6B4A34" stroke-width="1.2"/>
    <line x1="49" y1="31" x2="51" y2="31" stroke="#6B4A34" stroke-width="1.2"/>
    <path class="ld-mouth-happy" d="M45.5 38.5 Q50 42.5 54.5 38.5" fill="none" stroke="#B5524F" stroke-width="1.5" stroke-linecap="round"/>
    <path class="ld-mouth-sad" d="M45.5 41 Q50 37 54.5 41" fill="none" stroke="#B5524F" stroke-width="1.5" stroke-linecap="round"/>
    <path class="ld-tear" d="M44 36 Q42.5 39 44 40.5 Q45.5 39 44 36 Z" fill="#6EC3F0"/>
    <!-- cheveux (devant) : mèches ondulées -->
    <path d="M36 30 Q35 13 51 12 Q66 13 65 29 Q61 20 54 19 Q56 23 53 25 Q50 20 44 21 Q39 24 36 30 Z" fill="#EFCB72" stroke="#C9A24A" stroke-width="1"/>
    <path d="M36 29 Q33 38 36 46 Q33 52 36 58" fill="none" stroke="#C9A24A" stroke-width="1.2"/>
    <path d="M64 29 Q67 38 64 46 Q67 52 64 58" fill="none" stroke="#C9A24A" stroke-width="1.2"/>
  </g>
</svg>`;
}
