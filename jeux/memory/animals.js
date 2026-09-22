// ============================================================================
// ANIMAUX RARES ET RIGOLOS — dessinés en SVG, chacun fait sa grimace.
// Chaque dessin tient dans un carré de 200 x 200. "bg" = les deux couleurs du
// dégradé de fond de la carte.
// ============================================================================

const INK = '#2E2A4D';
// Contour épais façon dessin animé, appliqué à tout le dessin
const wrap = (inner) =>
  `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
  </svg>`;

// Œil rond avec pupille et petit reflet
const eye = (cx, cy, r, px, py, pr, white = '#FFFFFF') => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${white}"/>
  <circle cx="${px}" cy="${py}" r="${pr}" fill="${INK}" stroke="none"/>
  <circle cx="${px + pr * 0.4}" cy="${py - pr * 0.4}" r="${Math.max(1.5, pr * 0.35)}" fill="#FFFFFF" stroke="none"/>`;

export const ANIMALS = [
  {
    id: 'axolotl',
    name: 'Axolotl',
    bg: ['#FFE3F0', '#FFB8D6'],
    svg: wrap(`
      <ellipse cx="100" cy="158" rx="44" ry="30" fill="#FFB3D1"/>
      <ellipse cx="66" cy="180" rx="12" ry="8" fill="#FFB3D1"/>
      <ellipse cx="134" cy="180" rx="12" ry="8" fill="#FFB3D1"/>
      <g fill="#FF5E9A">
        <path d="M52 92 C30 80 22 66 26 56 C38 60 46 74 58 86 Z"/>
        <path d="M48 106 C24 104 12 94 10 84 C24 84 36 92 50 100 Z"/>
        <path d="M52 122 C32 130 18 128 14 120 C26 114 40 114 54 116 Z"/>
        <path d="M148 92 C170 80 178 66 174 56 C162 60 154 74 142 86 Z"/>
        <path d="M152 106 C176 104 188 94 190 84 C176 84 164 92 150 100 Z"/>
        <path d="M148 122 C168 130 182 128 186 120 C174 114 160 114 146 116 Z"/>
      </g>
      <ellipse cx="100" cy="110" rx="56" ry="46" fill="#FFB3D1"/>
      <circle cx="66" cy="124" r="9" fill="#FF7FB0" stroke="none" opacity=".7"/>
      <circle cx="134" cy="124" r="9" fill="#FF7FB0" stroke="none" opacity=".7"/>
      ${eye(78, 100, 13, 80, 102, 7)}
      <path d="M112 102 Q122 90 134 102" fill="none"/>
      <path d="M76 126 Q100 146 124 126" fill="none"/>
      <path d="M96 136 C94 156 116 160 114 138 Z" fill="#FF4F7B"/>
      <path d="M105 140 L105 150" stroke-width="2.5"/>
    `),
  },
  {
    id: 'blobfish',
    name: 'Blobfish',
    bg: ['#E3F4FF', '#9FD3F5'],
    svg: wrap(`
      <path d="M36 128 C20 120 16 106 22 98 C30 108 38 112 44 114 Z" fill="#E58D88"/>
      <path d="M164 128 C180 120 184 106 178 98 C170 108 162 112 156 114 Z" fill="#E58D88"/>
      <path d="M40 120 C36 70 70 50 100 50 C130 50 164 70 160 120 C158 152 134 168 100 168 C66 168 42 152 40 120 Z" fill="#F7AFA8"/>
      <g fill="#E58D88" stroke="none">
        <circle cx="70" cy="70" r="4"/><circle cx="128" cy="66" r="5"/><circle cx="142" cy="130" r="4"/>
        <circle cx="58" cy="136" r="5"/><circle cx="112" cy="78" r="3"/>
      </g>
      <path d="M62 82 L86 90" fill="none"/>
      <path d="M138 82 L114 90" fill="none"/>
      <circle cx="76" cy="102" r="8" fill="#FFFFFF"/>
      <circle cx="124" cy="102" r="8" fill="#FFFFFF"/>
      <circle cx="76" cy="104" r="4" fill="${INK}" stroke="none"/>
      <circle cx="124" cy="104" r="4" fill="${INK}" stroke="none"/>
      <path d="M68 102 A8 8 0 0 1 84 102 Z" fill="#E58D88"/>
      <path d="M116 102 A8 8 0 0 1 132 102 Z" fill="#E58D88"/>
      <path d="M88 106 C82 132 88 146 100 146 C112 146 118 132 112 106 Z" fill="#FF8F8A"/>
      <path d="M94 138 Q100 142 106 138" fill="none" stroke-width="2.5"/>
      <path d="M68 158 Q100 138 132 158" fill="none"/>
      <path d="M140 60 C146 50 152 50 154 58 C156 66 146 68 140 60 Z" fill="#BFE6FF" stroke-width="2.5"/>
    `),
  },
  {
    id: 'tarsier',
    name: 'Tarsier',
    bg: ['#FFF4D6', '#FFD98A'],
    svg: wrap(`
      <ellipse cx="46" cy="62" rx="20" ry="28" transform="rotate(-25 46 62)" fill="#C9A27A"/>
      <ellipse cx="46" cy="64" rx="10" ry="17" transform="rotate(-25 46 64)" fill="#F2B8A0" stroke="none"/>
      <ellipse cx="154" cy="62" rx="20" ry="28" transform="rotate(25 154 62)" fill="#C9A27A"/>
      <ellipse cx="154" cy="64" rx="10" ry="17" transform="rotate(25 154 64)" fill="#F2B8A0" stroke="none"/>
      <circle cx="100" cy="112" r="60" fill="#D8B48A"/>
      <ellipse cx="100" cy="128" rx="44" ry="38" fill="#EFD6B2" stroke="none"/>
      ${eye(72, 104, 27, 86, 108, 13, '#FFD24A')}
      ${eye(128, 104, 27, 114, 108, 13, '#FFD24A')}
      <path d="M95 132 L105 132 L100 139 Z" fill="${INK}"/>
      <path d="M80 152 Q88 144 96 152 Q104 160 112 152 Q118 146 122 150" fill="none"/>
      <g fill="#C9A27A">
        <ellipse cx="62" cy="176" rx="10" ry="8"/><ellipse cx="80" cy="180" rx="9" ry="7"/>
        <ellipse cx="138" cy="176" rx="10" ry="8"/><ellipse cx="120" cy="180" rx="9" ry="7"/>
      </g>
    `),
  },
  {
    id: 'ayeaye',
    name: 'Aye-aye',
    bg: ['#EFE6FF', '#C3A8F5'],
    svg: wrap(`
      <ellipse cx="44" cy="64" rx="30" ry="42" transform="rotate(-30 44 64)" fill="#4E4460"/>
      <ellipse cx="46" cy="66" rx="17" ry="28" transform="rotate(-30 46 66)" fill="#F2A3B8" stroke="none"/>
      <ellipse cx="156" cy="64" rx="30" ry="42" transform="rotate(30 156 64)" fill="#4E4460"/>
      <ellipse cx="154" cy="66" rx="17" ry="28" transform="rotate(30 154 66)" fill="#F2A3B8" stroke="none"/>
      <path d="M70 70 L78 50 L88 66 L98 44 L106 64 L118 48 L124 70 Z" fill="#6B5A7A"/>
      <ellipse cx="100" cy="112" rx="54" ry="50" fill="#6B5A7A"/>
      <ellipse cx="100" cy="124" rx="37" ry="32" fill="#D9CFC0" stroke="none"/>
      ${eye(78, 104, 18, 73, 99, 7, '#FFB23E')}
      ${eye(122, 104, 18, 127, 111, 7, '#FFB23E')}
      <ellipse cx="100" cy="126" rx="7" ry="5" fill="#F28BA8"/>
      <path d="M78 138 Q100 162 122 138 Z" fill="#7A2440"/>
      <rect x="91" y="138" width="8" height="11" rx="2" fill="#FFFFFF" stroke-width="2.5"/>
      <rect x="101" y="138" width="8" height="11" rx="2" fill="#FFFFFF" stroke-width="2.5"/>
      <path d="M156 172 L158 136 L166 104" fill="none" stroke-width="9"/>
      <path d="M156 172 L158 136 L166 104" fill="none" stroke="#4E4460" stroke-width="4"/>
      <circle cx="166" cy="102" r="4" fill="#4E4460"/>
      <path d="M140 196 C136 180 142 166 156 166 C170 166 176 180 172 196 Z" fill="#4E4460"/>
      <path d="M148 172 L146 162 M164 172 L168 162" fill="none" stroke-width="3"/>
    `),
  },
  {
    id: 'nasique',
    name: 'Nasique',
    bg: ['#FFEBD9', '#FFBE8A'],
    svg: wrap(`
      <path d="M38 200 C40 164 66 150 100 150 C134 150 160 164 162 200 Z" fill="#D9955A"/>
      <circle cx="44" cy="100" r="13" fill="#E8A86B"/>
      <circle cx="156" cy="100" r="13" fill="#E8A86B"/>
      <circle cx="100" cy="96" r="58" fill="#E8A86B"/>
      <path d="M84 40 Q92 26 100 38 Q108 24 116 40" fill="#E8A86B"/>
      <ellipse cx="100" cy="110" rx="42" ry="48" fill="#F7CFA6"/>
      ${eye(80, 88, 10, 80, 90, 6)}
      <path d="M110 84 L126 90 L110 96" fill="none"/>
      <path d="M68 74 Q80 66 92 74" fill="none"/>
      <path d="M108 72 Q120 64 132 72" fill="none"/>
      <path d="M92 94 C76 122 76 158 100 160 C124 158 124 122 108 94 Z" fill="#F39C8B"/>
      <ellipse cx="92" cy="150" rx="4" ry="3" fill="${INK}" stroke="none"/>
      <ellipse cx="108" cy="150" rx="4" ry="3" fill="${INK}" stroke="none"/>
      <path d="M110 150 Q120 156 128 146" fill="none"/>
      <circle cx="68" cy="124" r="8" fill="#FF9C8A" stroke="none" opacity=".7"/>
      <circle cx="136" cy="124" r="8" fill="#FF9C8A" stroke="none" opacity=".7"/>
    `),
  },
  {
    id: 'quokka',
    name: 'Quokka',
    bg: ['#E6F9E6', '#A6E3A1'],
    svg: wrap(`
      <circle cx="56" cy="58" r="20" fill="#9C7656"/>
      <circle cx="56" cy="58" r="10" fill="#E8B7A0" stroke="none"/>
      <circle cx="144" cy="58" r="20" fill="#9C7656"/>
      <circle cx="144" cy="58" r="10" fill="#E8B7A0" stroke="none"/>
      <ellipse cx="100" cy="108" rx="60" ry="56" fill="#B98F6B"/>
      <ellipse cx="100" cy="132" rx="38" ry="28" fill="#E7CBA9" stroke="none"/>
      ${eye(76, 96, 9, 77, 97, 6)}
      <path d="M114 98 Q124 86 134 98" fill="none"/>
      <ellipse cx="100" cy="116" rx="10" ry="7" fill="${INK}"/>
      <path d="M72 128 Q100 172 128 128 Z" fill="#7A2440"/>
      <path d="M86 136 Q100 128 114 136 L112 142 L88 142 Z" fill="#FFFFFF" stroke-width="2.5"/>
      <path d="M100 136 L100 142" stroke-width="2"/>
      <ellipse cx="100" cy="155" rx="12" ry="6" fill="#FF6F91" stroke="none"/>
      <circle cx="62" cy="124" r="9" fill="#F2A38A" stroke="none" opacity=".75"/>
      <circle cx="138" cy="124" r="9" fill="#F2A38A" stroke="none" opacity=".75"/>
    `),
  },
  {
    id: 'becensabot',
    name: 'Bec-en-sabot',
    bg: ['#E4EEF7', '#A9C3DB'],
    svg: wrap(`
      <ellipse cx="100" cy="184" rx="54" ry="30" fill="#8397AB"/>
      <path d="M118 44 C128 30 142 28 150 34 C140 38 134 44 132 52 Z" fill="#9BAFC2"/>
      <circle cx="100" cy="88" r="52" fill="#9BAFC2"/>
      <path d="M58 72 L90 82" fill="none" stroke-width="5"/>
      <path d="M142 72 L110 82" fill="none" stroke-width="5"/>
      <circle cx="78" cy="92" r="11" fill="#FFF6C9"/>
      <circle cx="122" cy="92" r="11" fill="#FFF6C9"/>
      <circle cx="80" cy="93" r="3" fill="${INK}" stroke="none"/>
      <circle cx="120" cy="93" r="3" fill="${INK}" stroke="none"/>
      <path d="M68 112 C68 100 132 100 132 112 C134 150 120 178 100 184 C80 178 66 150 68 112 Z" fill="#E3C88E"/>
      <path d="M100 106 L100 176" fill="none" stroke-width="3"/>
      <path d="M92 178 Q100 192 108 178" fill="#C9A866"/>
      <path d="M78 150 Q100 144 122 150" fill="none" stroke-width="3"/>
      <path d="M152 46 L162 56 M162 46 L152 56" stroke="#E85757" stroke-width="4"/>
      <path d="M160 40 L168 30 M168 40 L176 30" stroke="#E85757" stroke-width="3"/>
    `),
  },
  {
    id: 'narval',
    name: 'Narval',
    bg: ['#E0F2FF', '#8FCBF5'],
    svg: wrap(`
      <g fill="#6FC3F7" stroke-width="3">
        <path d="M74 46 C70 36 76 30 80 36 C84 42 80 50 74 46 Z"/>
        <path d="M90 34 C88 24 94 20 97 26 C100 32 96 38 90 34 Z"/>
        <path d="M60 36 C56 28 60 22 64 27 C68 32 64 40 60 36 Z"/>
      </g>
      <path d="M36 120 C22 108 10 96 8 84 C22 90 30 98 36 106 C34 94 36 82 42 74 C46 90 46 106 44 118 Z" fill="#6FA8D8"/>
      <path d="M156 100 L196 38 L166 106 Z" fill="#FFF4D6"/>
      <path d="M166 86 L176 84 M174 72 L184 70 M182 60 L190 58" fill="none" stroke-width="2.5"/>
      <path d="M36 122 C36 86 72 70 112 74 C150 78 172 100 170 126 C168 152 142 166 104 166 C64 166 36 152 36 122 Z" fill="#8EC1EC"/>
      <path d="M50 136 C70 160 142 162 164 136 C156 156 132 166 104 166 C74 166 54 154 50 136 Z" fill="#D6ECFA" stroke="none"/>
      <g fill="#6FA8D8" stroke="none">
        <circle cx="70" cy="98" r="5"/><circle cx="88" cy="88" r="4"/><circle cx="60" cy="116" r="4"/>
      </g>
      ${eye(116, 108, 11, 122, 110, 6)}
      ${eye(146, 108, 11, 140, 110, 6)}
      <path d="M112 134 Q130 148 152 132" fill="none"/>
      <path d="M126 140 C124 156 142 158 140 140 Z" fill="#FF6F91"/>
      <path d="M88 146 C82 160 92 166 100 156 Z" fill="#6FA8D8"/>
      <circle cx="104" cy="126" r="6" fill="#FF9EC4" stroke="none" opacity=".7"/>
      <circle cx="160" cy="124" r="5" fill="#FF9EC4" stroke="none" opacity=".7"/>
    `),
  },
];
