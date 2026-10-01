// ============================================================================
// Dessins du Train des Doudous (SVG) : les 10 doudous, le contrôleur,
// le train, la gare de Paris et les Alpes.
// ============================================================================

export const FAMILIES = [
  { id: 'ours',   name: 'Ours',   color: '#E85757' },
  { id: 'panda',  name: 'Panda',  color: '#3FAE68' },
  { id: 'chien',  name: 'Chien',  color: '#3D9FD6' },
  { id: 'tigre',  name: 'Tigre',  color: '#9B6BD6' },
  { id: 'wombat', name: 'Wombat', color: '#F0A020' },
];
const familyOf = (sp) => FAMILIES.find((f) => f.id === sp);

const PAL = {
  ours:   { fur: '#B07443', dark: '#7B4B27', light: '#EDCFA6', nose: '#3B2416', ear: '#D9A577', pad: '#EDCFA6' },
  panda:  { fur: '#FBFAF5', dark: '#2D2D36', light: '#FFFFFF', nose: '#2D2D36', ear: '#2D2D36', pad: '#8A8A96' },
  chien:  { fur: '#F2DCB8', dark: '#A26D3F', light: '#FFF6E6', nose: '#3A2A20', ear: '#A26D3F', pad: '#C8935F' },
  tigre:  { fur: '#F4973A', dark: '#2E2626', light: '#FFF4E2', nose: '#E77B8A', ear: '#FFF4E2', pad: '#FFE3C2' },
  wombat: { fur: '#A08C78', dark: '#6F5D4D', light: '#D9CBB8', nose: '#4A3A31', ear: '#C9AE95', pad: '#D9CBB8' },
};
const LINE = 'stroke="rgba(60,40,25,.3)" stroke-width="1.4"';

function ears(sp, p) {
  switch (sp) {
    case 'ours':
      return [28, 72].map((x) => `<circle cx="${x}" cy="19" r="10" fill="${p.fur}" ${LINE}/><circle cx="${x}" cy="19" r="5.5" fill="${p.ear}"/>`).join('');
    case 'panda':
      return [28, 72].map((x) => `<circle cx="${x}" cy="19" r="10" fill="${p.dark}"/>`).join('');
    case 'tigre':
      return [29, 71].map((x) => `<circle cx="${x}" cy="19" r="9.5" fill="${p.fur}" ${LINE}/><circle cx="${x}" cy="19.5" r="5" fill="${p.ear}"/>`).join('');
    case 'wombat':
      return [[31, -25], [69, 25]].map(([x, a]) =>
        `<ellipse cx="${x}" cy="18" rx="7" ry="8.5" transform="rotate(${a} ${x} 18)" fill="${p.fur}" ${LINE}/>` +
        `<ellipse cx="${x}" cy="18.5" rx="3.5" ry="5" transform="rotate(${a} ${x} 18)" fill="${p.ear}"/>`).join('');
    default:
      return '';
  }
}

function faceMarks(sp, p) {
  switch (sp) {
    case 'panda':
      return `<ellipse cx="39" cy="39" rx="7" ry="9" transform="rotate(30 39 39)" fill="${p.dark}"/>` +
             `<ellipse cx="61" cy="39" rx="7" ry="9" transform="rotate(-30 61 39)" fill="${p.dark}"/>`;
    case 'chien':
      return `<ellipse cx="62" cy="35" rx="8.5" ry="7.5" fill="${p.dark}" opacity=".45"/>`;
    case 'tigre':
      return `<path d="M50 14V22M43 15.5Q45 19 44 23M57 15.5Q55 19 56 23" stroke="${p.dark}" stroke-width="2.6" stroke-linecap="round" fill="none"/>` +
             `<path d="M23.5 40L31 41.5M23.5 46H30M76.5 40L69 41.5M76.5 46H70" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

function muzzle(sp, p) {
  if (sp === 'panda') return '';
  if (sp === 'wombat') return `<ellipse cx="50" cy="50" rx="14" ry="10.5" fill="${p.light}"/>`;
  if (sp === 'tigre') return `<ellipse cx="45" cy="51" rx="7" ry="6" fill="${p.light}"/><ellipse cx="55" cy="51" rx="7" ry="6" fill="${p.light}"/>`;
  return `<ellipse cx="50" cy="50" rx="12" ry="9" fill="${p.light}"/>`;
}

/**
 * Un doudou en peluche, dans une boîte 100 × 100 (les pieds touchent y = 99).
 * @param {string} sp - espèce : ours, panda, chien, tigre, wombat
 * @param {object} opts - kid : petit doudou ; mood : 'happy' | 'laugh' ; bow : nœud sur la tête
 */
export function doudouInner(sp, { kid = false, mood = 'happy', bow = kid, scarf = !kid } = {}) {
  const p = PAL[sp];
  const fam = familyOf(sp);
  const limb = sp === 'panda' ? p.dark : p.fur;
  const out = [];

  // pieds
  for (const x of [37, 63]) {
    out.push(`<ellipse cx="${x}" cy="92" rx="10" ry="6.5" fill="${limb}" ${LINE}/>`);
    out.push(`<ellipse cx="${x}" cy="93" rx="5" ry="3.3" fill="${p.pad}"/>`);
  }
  // corps et ventre cousu
  out.push(`<ellipse cx="50" cy="73" rx="26" ry="21" fill="${p.fur}" ${LINE}/>`);
  out.push(`<ellipse cx="50" cy="77" rx="14.5" ry="12.5" fill="${p.light}"/>`);
  out.push(`<ellipse cx="50" cy="77" rx="14.5" ry="12.5" fill="none" stroke="${p.dark}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2.2 2.2"/>`);
  if (sp === 'tigre') {
    out.push(`<path d="M26 68L33 70M25 76L32 77M74 68L67 70M75 76L68 77" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>`);
  }
  // bras
  out.push(`<ellipse cx="26" cy="72" rx="7.5" ry="12" transform="rotate(28 26 72)" fill="${limb}" ${LINE}/>`);
  out.push(`<ellipse cx="74" cy="72" rx="7.5" ry="12" transform="rotate(-28 74 72)" fill="${limb}" ${LINE}/>`);
  // l'écharpe des gros doudous
  if (scarf) {
    out.push(`<path d="M27 62Q50 72 73 62L74 69Q50 80 26 69Z" fill="${fam.color}" ${LINE}/>`);
    out.push(`<path d="M57 70L65 69L68 86L59 87Z" fill="${fam.color}" ${LINE}/>`);
    out.push(`<path d="M60 87V90M63 86.6V89.6M66 86.2V89.2" stroke="${fam.color}" stroke-width="1.6" stroke-linecap="round"/>`);
  }
  // tête
  out.push(ears(sp, p));
  out.push(`<circle cx="50" cy="40" r="27" fill="${p.fur}" ${LINE}/>`);
  if (sp !== 'tigre') {
    out.push(`<path d="M41 16Q50 13 59 16" fill="none" stroke="${p.dark}" stroke-opacity=".3" stroke-width="1" stroke-dasharray="2 2"/>`);
  }
  out.push(faceMarks(sp, p));
  out.push(muzzle(sp, p));

  // yeux
  const eyeR = kid ? 4.4 : 3.8;
  const ey = 37.5;
  for (const x of [39, 61]) {
    if (mood === 'laugh') {
      const c = sp === 'panda' ? '#FFFFFF' : '#2A1E18';
      out.push(`<path d="M${x - 4.5} ${ey + 1}Q${x} ${ey - 4.5} ${x + 4.5} ${ey + 1}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
      const tx = x < 50 ? x - 6 : x + 6;
      out.push(`<path d="M${tx} ${ey + 2}q2 3 0 4.5q-2 -1.5 0 -4.5Z" fill="#8FD3FF"/>`);
    } else {
      if (sp === 'panda') out.push(`<circle cx="${x}" cy="${ey}" r="${eyeR + 0.8}" fill="#FFFFFF"/>`);
      out.push(`<circle cx="${x}" cy="${ey}" r="${sp === 'panda' ? eyeR - 0.6 : eyeR}" fill="#2A1E18"/>`);
      out.push(`<circle cx="${x - 1.2}" cy="${ey - 1.4}" r="${eyeR * 0.35}" fill="#FFFFFF"/>`);
    }
  }

  // nez et bouche
  const my = sp === 'wombat' ? 1.8 : 0;
  if (sp === 'wombat') {
    out.push(`<ellipse cx="50" cy="46.5" rx="8" ry="5.5" fill="${p.nose}"/><ellipse cx="47.5" cy="45" rx="2.4" ry="1.2" fill="#FFFFFF" opacity=".45"/>`);
  } else {
    out.push(`<path d="M44.5 45Q50 42.5 55.5 45Q53.5 50 50 50.5Q46.5 50 44.5 45Z" fill="${p.nose}"/><ellipse cx="48.5" cy="45.2" rx="1.8" ry="1" fill="#FFFFFF" opacity=".6"/>`);
  }
  if (mood === 'laugh') {
    out.push(`<path d="M43.5 ${53 + my}Q50 ${64 + my} 56.5 ${53 + my}Z" fill="#7A2E3A"/>`);
    out.push(`<path d="M46.5 ${58.4 + my}Q50 ${56 + my} 53.5 ${58.4 + my}Q50 ${62 + my} 46.5 ${58.4 + my}Z" fill="#FF8FA3"/>`);
  } else {
    out.push(`<path d="M50 ${50.5 + my}V${53 + my}M45.5 ${53 + my}Q47.8 ${56 + my} 50 ${53 + my}Q52.2 ${56 + my} 54.5 ${53 + my}" stroke="#3A2A20" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
  }
  // joues roses
  out.push(`<circle cx="31" cy="48" r="4.5" fill="#FF8FA3" opacity=".5"/><circle cx="69" cy="48" r="4.5" fill="#FF8FA3" opacity=".5"/>`);

  // les grandes oreilles tombantes du chien passent devant la tête
  if (sp === 'chien') {
    out.push(`<ellipse cx="24.5" cy="40" rx="8" ry="16.5" transform="rotate(16 24.5 40)" fill="${p.dark}" ${LINE}/>`);
    out.push(`<ellipse cx="75.5" cy="40" rx="8" ry="16.5" transform="rotate(-16 75.5 40)" fill="${p.dark}" ${LINE}/>`);
  }
  // le nœud des petits doudous
  if (bow) {
    out.push(`<path d="M64 15L55 9.5L56 20.5ZM64 15L73 9.5L72 20.5Z" fill="${fam.color}" ${LINE}/><circle cx="64" cy="15" r="3" fill="${fam.color}" ${LINE}/>`);
  }
  return out.join('');
}

export function doudouSVG(sp, opts = {}) {
  return `<svg viewBox="0 6 100 94" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${doudouInner(sp, opts)}</svg>`;
}

/** Juste la tête du doudou (pour le carnet du contrôleur). */
export function faceSVG(sp, opts = {}) {
  return `<svg viewBox="15 5 70 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${doudouInner(sp, { ...opts, scarf: false })}</svg>`;
}

/** Le doudou à ski : bonnet à pompon, skis et bâtons, et il rigole ! */
export function skierInner(sp, kid) {
  const fam = familyOf(sp);
  return (
    `<path d="M26 70L6 100" stroke="#5A5F6E" stroke-width="2.2" stroke-linecap="round"/><circle cx="8" cy="97" r="2.6" fill="none" stroke="#5A5F6E" stroke-width="1.5"/>` +
    doudouInner(sp, { kid, mood: 'laugh', bow: false }) +
    `<path d="M33 22Q50 4 67 22Q50 18 33 22Z" fill="${fam.color}" ${LINE}/>` +
    `<path d="M33 22Q50 17 67 22L66 25Q50 20 34 25Z" fill="#FFFFFF" ${LINE}/>` +
    `<circle cx="50" cy="7" r="5" fill="#FFFFFF" ${LINE}/>` +
    `<path d="M74 70L56 101" stroke="#5A5F6E" stroke-width="2.2" stroke-linecap="round"/><circle cx="58" cy="98" r="2.6" fill="none" stroke="#5A5F6E" stroke-width="1.5"/>` +
    `<path d="M0 98H104Q113 98 115 91" stroke="#2E2A4D" stroke-width="3.6" fill="none" stroke-linecap="round"/>` +
    `<path d="M6 101.5H108Q117 101.5 119 94.5" stroke="${fam.color}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
  );
}

/** Monsieur Hibou, le contrôleur du train. */
export const CONTROLLER_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="50" cy="64" rx="31" ry="32" fill="#8B6B4A" stroke="rgba(60,40,25,.3)" stroke-width="1.5"/>
  <ellipse cx="50" cy="73" rx="18" ry="19" fill="#E9D3B0"/>
  <path d="M40 66q3 3 6 0M48 72q3 3 6 0M42 79q3 3 6 0M51 84q3 3 6 0" stroke="#C9AE87" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="20" cy="66" rx="7" ry="15" transform="rotate(14 20 66)" fill="#6E5236"/>
  <ellipse cx="80" cy="66" rx="7" ry="15" transform="rotate(-14 80 66)" fill="#6E5236"/>
  <circle cx="37" cy="48" r="12.5" fill="#FFFFFF" stroke="#6E5236" stroke-width="2.5"/>
  <circle cx="63" cy="48" r="12.5" fill="#FFFFFF" stroke="#6E5236" stroke-width="2.5"/>
  <circle cx="38.5" cy="49" r="5.5" fill="#2A1E18"/><circle cx="61.5" cy="49" r="5.5" fill="#2A1E18"/>
  <circle cx="37" cy="47" r="1.8" fill="#FFFFFF"/><circle cx="60" cy="47" r="1.8" fill="#FFFFFF"/>
  <path d="M45.5 57L54.5 57L50 65Z" fill="#F2A33A"/>
  <path d="M22 34Q50 10 78 34L78 39L22 39Z" fill="#1E3A8A"/>
  <rect x="22" y="32" width="56" height="5" fill="#F2C94C"/>
  <path d="M26 39Q50 47 74 39L74 42Q50 51 26 42Z" fill="#0F2560"/>
  <circle cx="50" cy="26" r="4" fill="#F2C94C"/>
  <circle cx="72" cy="80" r="5" fill="#C0C6D0" stroke="#7A8290" stroke-width="1.5"/>
  <path d="M72 75V68" stroke="#7A8290" stroke-width="1.5"/>
</svg>`;

// ---------------------------------------------------------------------------
// Le train (vue de côté) : 2 voitures + la locomotive, environ 740 × 121
// ---------------------------------------------------------------------------
const rr = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

function wheels(xs) {
  return xs.map((x) =>
    `<rect x="${x - 26}" y="103" width="52" height="7" rx="3" fill="#4A4F60"/>` +
    [x - 13, x + 13].map((wx) => `<circle cx="${wx}" cy="112" r="9" fill="#34384A"/><circle cx="${wx}" cy="112" r="3.2" fill="#9AA3B5"/>`).join('')
  ).join('');
}

/**
 * @param {object} o - passengers : 10 cases { sp, kid } ou null (fenêtres 0-4 voiture A, 5-9 voiture B)
 *                     doorsOpen : portes ouvertes (dans la gare)
 */
export function trainSide({ passengers = [], doorsOpen = false } = {}) {
  const back = [];
  const front = [];
  [0, 250].forEach((cx, ci) => {
    let body = rr(cx, 10, 240, 95, 14);
    for (let w = 0; w < 5; w++) {
      const wx = cx + 12 + w * 36;
      const wy = 24;
      back.push(`<rect x="${wx}" y="${wy}" width="28" height="26" fill="#BFE3F2"/>`);
      const p = passengers[ci * 5 + w];
      if (p) {
        const s = p.kid ? 0.25 : 0.31;
        const hy = p.kid ? wy + 17 : wy + 15;
        back.push(`<g transform="translate(${wx + 14 - 50 * s} ${hy - 40 * s}) scale(${s})">${doudouInner(p.sp, { kid: p.kid })}</g>`);
      }
      body += `M${wx} ${wy}h28v26h-28Z`;
    }
    front.push(`<rect x="${cx + 6}" y="4" width="228" height="9" rx="4" fill="#C9CED6"/>`);
    front.push(`<path d="${body}" fill="#FFF8EC" fill-rule="evenodd" stroke="#2E5E73" stroke-width="2"/>`);
    for (let w = 0; w < 5; w++) {
      front.push(`<rect x="${cx + 12 + w * 36}" y="24" width="28" height="26" rx="3" fill="none" stroke="#2E5E73" stroke-width="2"/>`);
    }
    front.push(`<rect x="${cx + 1}" y="60" width="238" height="12" fill="#2E7D9A"/>`);
    front.push(`<rect x="${cx + 1}" y="74" width="238" height="4" fill="#E85757"/>`);
    if (ci === 1) {
      front.push(`<text x="${cx + 98}" y="69.5" font-size="8.5" fill="#FFFFFF" font-family="Baloo 2, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="1">TRAIN DES DOUDOUS</text>`);
    }
    // la porte
    const dx = cx + 196;
    if (doorsOpen) {
      front.push(`<rect x="${dx}" y="20" width="32" height="85" rx="3" fill="#4A4360" stroke="#2E5E73" stroke-width="2"/>`);
      front.push(`<rect x="${dx + 3}" y="96" width="26" height="6" rx="2" fill="#F2D04B"/>`);
    } else {
      front.push(`<rect x="${dx}" y="20" width="32" height="85" rx="3" fill="#FFF8EC" stroke="#2E5E73" stroke-width="2"/>`);
      front.push(`<path d="M${dx + 16} 20V105" stroke="#2E5E73" stroke-width="1.5"/>`);
      front.push(`<rect x="${dx + 5}" y="28" width="8" height="18" rx="2" fill="#BFE3F2"/><rect x="${dx + 19}" y="28" width="8" height="18" rx="2" fill="#BFE3F2"/>`);
      front.push(`<rect x="${dx}" y="60" width="32" height="12" fill="#2E7D9A"/>`);
    }
    front.push(wheels([cx + 45, cx + 170]));
  });
  // attelages
  front.push(`<rect x="238" y="82" width="14" height="8" rx="2" fill="#5A5F6E"/><rect x="488" y="82" width="14" height="8" rx="2" fill="#5A5F6E"/>`);

  // la locomotive (nez à droite)
  front.push(`<path d="M560 10L578 -6L596 10M566 -6H590" stroke="#5A5F6E" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
  front.push(`<path d="M500 22Q500 10 514 10L660 10Q702 12 728 50Q744 74 740 98L740 105L500 105Z" fill="#FFF8EC" stroke="#2E5E73" stroke-width="2"/>`);
  front.push(`<path d="M672 20Q702 24 720 52L672 52Z" fill="#2B4C6F"/><path d="M680 26L690 26" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`);
  front.push(`<rect x="610" y="22" width="40" height="26" rx="4" fill="#2B4C6F"/>`);
  front.push(`<path d="M501 60H735L738 72H501Z" fill="#2E7D9A"/><path d="M501 74H739L739.6 78H501Z" fill="#E85757"/>`);
  front.push(`<path d="M548 38c0 -6 8 -6 8 0c0 -6 8 -6 8 0c0 6 -8 10 -8 12c0 -2 -8 -6 -8 -12Z" fill="#E85757"/>`);
  front.push(`<ellipse cx="732" cy="88" rx="4.5" ry="3.2" fill="#FFE27A" stroke="#C9A43A" stroke-width="1"/>`);
  front.push(wheels([545, 680]));

  return `<g>${back.join('')}</g><g>${front.join('')}</g>`;
}

// ---------------------------------------------------------------------------
// Petits éléments de décor
// ---------------------------------------------------------------------------
function pigeon(x, y, flip = false) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)"><g class="pigeon">
    <path d="M-2 0V5M3 0V5" stroke="#E07A5F" stroke-width="1.6"/>
    <ellipse cx="0" cy="-8" rx="13" ry="9" fill="#8C95A6"/>
    <path d="M-12 -9L-22 -12L-14 -4Z" fill="#6E7788"/>
    <ellipse cx="-1" cy="-8" rx="7" ry="5" fill="#6E7788"/>
    <circle cx="10" cy="-17" r="6" fill="#7C8596"/>
    <path d="M7 -12Q10 -9 13 -12" stroke="#7FB49B" stroke-width="2" fill="none"/>
    <circle cx="12" cy="-18" r="1.4" fill="#222"/>
    <path d="M15.5 -17L20 -15.5L15.5 -14.5Z" fill="#E8B04A"/>
  </g></g>`;
}

function pine(x, y, h, dark = '#24573F') {
  const w = h * 0.42;
  return `<g>
    <rect x="${x - h * 0.04}" y="${y - h * 0.16}" width="${h * 0.08}" height="${h * 0.16}" fill="#6B4A2F"/>
    <path d="M${x} ${y - h}L${x + w * 0.6} ${y - h * 0.55}L${x - w * 0.6} ${y - h * 0.55}Z" fill="${dark}"/>
    <path d="M${x} ${y - h * 0.78}L${x + w * 0.85} ${y - h * 0.32}L${x - w * 0.85} ${y - h * 0.32}Z" fill="${dark}"/>
    <path d="M${x} ${y - h * 0.55}L${x + w} ${y - h * 0.12}L${x - w} ${y - h * 0.12}Z" fill="${dark}"/>
    <path d="M${x} ${y - h}L${x + w * 0.28} ${y - h * 0.79}Q${x} ${y - h * 0.84} ${x - w * 0.28} ${y - h * 0.79}Z" fill="#FFFFFF"/>
    <path d="M${x - w * 0.6} ${y - h * 0.55}Q${x - w * 0.3} ${y - h * 0.6} ${x} ${y - h * 0.57}Q${x + w * 0.3} ${y - h * 0.6} ${x + w * 0.6} ${y - h * 0.55}" stroke="#FFFFFF" stroke-width="${h * 0.04}" fill="none" stroke-linecap="round"/>
    <path d="M${x - w * 0.85} ${y - h * 0.32}Q${x - w * 0.4} ${y - h * 0.38} ${x} ${y - h * 0.34}Q${x + w * 0.4} ${y - h * 0.38} ${x + w * 0.85} ${y - h * 0.32}" stroke="#FFFFFF" stroke-width="${h * 0.04}" fill="none" stroke-linecap="round"/>
  </g>`;
}

function cloud(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="#FFFFFF" opacity=".92">
    <ellipse cx="0" cy="0" rx="40" ry="18"/><ellipse cx="-26" cy="6" rx="26" ry="14"/>
    <ellipse cx="28" cy="6" rx="28" ry="14"/><ellipse cx="6" cy="-12" rx="24" ry="16"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// La grande gare parisienne (1000 × 560)
// ---------------------------------------------------------------------------
export function stationScene() {
  const s = [];
  // mur de pierre
  s.push(`<rect width="1000" height="440" fill="#EADBC2"/>`);
  for (let y = 40; y < 440; y += 34) s.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="#DECBAD" stroke-width="2"/>`);

  // la grande verrière en éventail
  const cx = 500, cy = 300, R = 270;
  s.push(`<path d="M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}Z" fill="#D3EAF6"/>`);
  s.push(`<path d="M${cx - R + 30} ${cy}A${R - 30} ${R - 30} 0 0 1 ${cx - 40} ${cy - R + 32}" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="22"/>`);
  for (const r of [70, 140, 205]) {
    s.push(`<path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#4E5D6C" stroke-width="3"/>`);
  }
  for (let a = 15; a < 180; a += 15) {
    const rad = (a * Math.PI) / 180;
    const x1 = cx - 70 * Math.cos(rad), y1 = cy - 70 * Math.sin(rad);
    const x2 = cx - R * Math.cos(rad), y2 = cy - R * Math.sin(rad);
    s.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#4E5D6C" stroke-width="2.5"/>`);
  }
  s.push(`<path d="M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="#3F4C59" stroke-width="10"/>`);

  // la grande horloge
  s.push(`<circle cx="500" cy="212" r="39" fill="#3F4C59"/><circle cx="500" cy="212" r="33" fill="#FFFDF5"/>`);
  for (let h = 0; h < 12; h++) {
    const a = (h * 30 * Math.PI) / 180;
    const r1 = h % 3 === 0 ? 24 : 27;
    s.push(`<line x1="${(500 + r1 * Math.sin(a)).toFixed(1)}" y1="${(212 - r1 * Math.cos(a)).toFixed(1)}" x2="${(500 + 30 * Math.sin(a)).toFixed(1)}" y2="${(212 - 30 * Math.cos(a)).toFixed(1)}" stroke="#2E2A4D" stroke-width="${h % 3 === 0 ? 3 : 1.6}"/>`);
  }
  s.push(`<line x1="500" y1="212" x2="484" y2="203" stroke="#2E2A4D" stroke-width="4" stroke-linecap="round"/>`);
  s.push(`<line x1="500" y1="212" x2="500" y2="186" stroke="#2E2A4D" stroke-width="2.6" stroke-linecap="round"/>`);
  s.push(`<circle cx="500" cy="212" r="3" fill="#E85757"/>`);

  // la charpente métallique du haut
  s.push(`<rect width="1000" height="24" fill="#4E5D6C"/>`);
  let zig = 'M0 3';
  for (let x = 25; x <= 1000; x += 25) zig += `L${x} ${(x / 25) % 2 ? 21 : 3}`;
  s.push(`<path d="${zig}" stroke="#6D7E8F" stroke-width="2" fill="none"/>`);

  // le tableau des départs
  s.push(`<line x1="60" y1="24" x2="60" y2="96" stroke="#3F4C59" stroke-width="3"/><line x1="180" y1="24" x2="180" y2="96" stroke="#3F4C59" stroke-width="3"/>`);
  s.push(`<rect x="22" y="94" width="196" height="116" rx="7" fill="#1C1C24" stroke="#3F4C59" stroke-width="4"/>`);
  s.push(`<text x="120" y="114" fill="#FFD23F" font-family="Baloo 2, sans-serif" font-weight="800" font-size="14" text-anchor="middle" letter-spacing="2">DÉPARTS</text>`);
  const rows = [['10:00', 'LES ALPES', 'V3'], ['10:12', 'LILLE', 'V7'], ['10:25', 'LONDRES', 'V2'], ['10:40', 'AMSTERDAM', 'V5']];
  rows.forEach(([t, d, v], i) => {
    const y = 136 + i * 20;
    const hl = i === 0;
    if (hl) s.push(`<rect x="30" y="${y - 13}" width="180" height="18" rx="3" fill="#FFD23F" opacity=".18"><animate attributeName="opacity" values=".18;.4;.18" dur="1.4s" repeatCount="indefinite"/></rect>`);
    s.push(`<text x="36" y="${y}" fill="#FFD23F" font-family="Courier New, monospace" font-weight="700" font-size="12">${t}  ${d}</text>`);
    s.push(`<text x="204" y="${y}" fill="#FFD23F" font-family="Courier New, monospace" font-weight="700" font-size="12" text-anchor="end">${v}</text>`);
  });

  // grande fenêtre cintrée de droite
  s.push(`<path d="M822 292V160A69 69 0 0 1 960 160V292Z" fill="#D3EAF6" stroke="#4E5D6C" stroke-width="6"/>`);
  s.push(`<path d="M868 96V292M914 96V292M822 200H960M822 248H960" stroke="#4E5D6C" stroke-width="2.5"/>`);

  // poutre + colonnes en fonte
  s.push(`<rect x="0" y="296" width="1000" height="12" fill="#4E5D6C"/>`);
  for (let x = 12; x < 1000; x += 24) s.push(`<circle cx="${x}" cy="302" r="1.8" fill="#8696A6"/>`);
  for (const x of [60, 230, 770, 940]) {
    s.push(`<rect x="${x - 12}" y="306" width="24" height="10" rx="2" fill="#3F4C59"/><rect x="${x - 7}" y="314" width="14" height="124" fill="#50606E"/>`);
  }

  // voie + quai
  s.push(`<rect x="0" y="418" width="1000" height="22" fill="#4A4752"/><rect x="0" y="427" width="1000" height="4" fill="#8B8A96"/>`);
  s.push(`<g id="introTrain"></g>`);
  s.push(`<rect x="0" y="438" width="1000" height="122" fill="#D9D3C7"/><rect x="0" y="438" width="1000" height="9" fill="#F2D04B"/>`);
  for (let x = 40; x < 1100; x += 90) s.push(`<line x1="${x}" y1="447" x2="${x - 34}" y2="560" stroke="#CBC4B6" stroke-width="2"/>`);
  s.push(pigeon(870, 540), pigeon(925, 548, true));

  // panneau suspendu
  s.push(`<line x1="420" y1="308" x2="420" y2="318" stroke="#3F4C59" stroke-width="2.5"/><line x1="580" y1="308" x2="580" y2="318" stroke="#3F4C59" stroke-width="2.5"/>`);
  s.push(`<rect x="372" y="316" width="256" height="30" rx="5" fill="#1E3A8A" stroke="#FFFFFF" stroke-width="2"/>`);
  s.push(`<text x="500" y="337" fill="#FFFFFF" font-family="Baloo 2, sans-serif" font-weight="800" font-size="16" text-anchor="middle" letter-spacing="1.5">PARIS · GARE DU NORD</text>`);

  s.push(`<g id="introActors"></g>`);
  return s.join('');
}

// ---------------------------------------------------------------------------
// Les Alpes (1000 × 560)
// ---------------------------------------------------------------------------
/** Hauteur de la piste de ski (le bord du grand champ de neige) à l'abscisse x. */
export const ySlope = (x) => 360 + 0.18 * x + 12 * Math.sin(x / 110);
export const slopeAngle = (x) => (Math.atan(0.18 + (12 / 110) * Math.cos(x / 110)) * 180) / Math.PI;

function mountains(points, fill, capDepth) {
  let s = `<polygon points="${points.map((p) => p.join(',')).join(' ')}" fill="${fill}"/>`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const [lx, ly] = points[i - 1];
    const [rx, ry] = points[i + 1];
    if (!(py < ly && py < ry && py < 300)) continue;
    const d = Math.min(capDepth, (ly - py) * 0.6, (ry - py) * 0.6);
    const y = py + d;
    const lxAt = px + ((lx - px) * d) / (ly - py);
    const rxAt = px + ((rx - px) * d) / (ry - py);
    const pts = [[px, py], [rxAt, y]];
    const bumps = [-0.32, 0.12, -0.26];
    bumps.forEach((b, k) => pts.push([rxAt + ((lxAt - rxAt) * (k + 1)) / 4, y + d * b]));
    pts.push([lxAt, y]);
    s += `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="#FFFFFF"/>`;
  }
  return s;
}

export function alpsScene() {
  const s = [];
  s.push(`<defs>
    <linearGradient id="alpsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FA8EC"/><stop offset="1" stop-color="#D4EEFF"/></linearGradient>
    <linearGradient id="alpsSnowGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D6E7F8"/></linearGradient>
  </defs>`);
  s.push(`<rect width="1000" height="560" fill="url(#alpsSky)"/>`);
  // soleil
  s.push(`<circle cx="840" cy="88" r="88" fill="#FFF3B0" opacity=".18"/><circle cx="840" cy="88" r="60" fill="#FFF3B0" opacity=".3"/><circle cx="840" cy="88" r="36" fill="#FFE27A"/>`);
  s.push(cloud(170, 70, 1), cloud(560, 45, 0.75), cloud(990, 160, 0.7));

  // montagnes lointaines puis plus proches
  s.push(mountains([[0, 300], [70, 230], [140, 265], [250, 110], [330, 210], [410, 165], [520, 45], [620, 190], [700, 140], [790, 225], [880, 110], [960, 190], [1000, 170], [1000, 390], [0, 390]], '#9DB2DB', 55));
  s.push(mountains([[0, 330], [120, 245], [220, 300], [330, 205], [450, 300], [560, 235], [680, 310], [800, 220], [920, 290], [1000, 255], [1000, 410], [0, 410]], '#6E8DC0', 30));

  // téléphérique
  s.push(`<path d="M560 150L1000 62" stroke="#4A4F60" stroke-width="1.5"/>`);
  s.push(`<g transform="translate(758 110)"><line x1="0" y1="0" x2="0" y2="10" stroke="#4A4F60" stroke-width="2"/><rect x="-12" y="10" width="24" height="17" rx="4" fill="#E85757"/><rect x="-8" y="13" width="7" height="6" rx="1" fill="#D3EAF6"/><rect x="1" y="13" width="7" height="6" rx="1" fill="#D3EAF6"/></g>`);

  // fond de vallée
  s.push(`<rect x="0" y="396" width="1000" height="164" fill="#4F8A6B"/>`);

  // le viaduc
  let d = 'M-10 330H1010V450H-10Z';
  for (let i = 0; i < 11; i++) {
    const x = 8 + i * 100;
    d += `M${x} 450V388A32 32 0 0 1 ${x + 64} 388V450Z`;
  }
  s.push(`<path d="${d}" fill="#C4B08F" fill-rule="evenodd" stroke="#A28D6B" stroke-width="2"/>`);
  s.push(`<rect x="-10" y="314" width="1020" height="17" fill="#A99472"/><rect x="-10" y="309" width="1020" height="5" fill="#8E7A5A"/>`);
  for (let x = 0; x < 1000; x += 20) s.push(`<rect x="${x}" y="299" width="3" height="11" fill="#8E7A5A"/>`);

  // la petite gare des Alpes
  s.push(`<rect x="872" y="262" width="100" height="52" fill="#B5713F"/>`);
  for (let y = 270; y < 314; y += 8) s.push(`<line x1="872" y1="${y}" x2="972" y2="${y}" stroke="#9A5C30" stroke-width="1.5"/>`);
  s.push(`<path d="M858 266L922 228L986 266Z" fill="#8B4A2B"/>`);
  s.push(`<path d="M855 267L922 225L989 267L983 272Q952 263 922 268Q892 263 861 272Z" fill="#FFFFFF"/>`);
  s.push(`<rect x="886" y="276" width="72" height="18" rx="3" fill="#FFF6E0" stroke="#8B4A2B" stroke-width="1.5"/>`);
  s.push(`<text x="922" y="289.5" fill="#8B4A2B" font-family="Baloo 2, sans-serif" font-weight="800" font-size="11" text-anchor="middle">LES ALPES</text>`);
  s.push(`<rect x="900" y="298" width="14" height="16" fill="#FFE27A"/><rect x="930" y="298" width="14" height="16" fill="#FFE27A"/>`);

  s.push(`<g id="alpsTrain"></g>`);

  // forêt de sapins au pied du viaduc
  const hill = (x) => 412 + 9 * Math.sin(x / 70) + 6 * Math.sin(x / 23);
  let hd = 'M0 560';
  for (let x = 0; x <= 1000; x += 20) hd += `L${x} ${hill(x).toFixed(1)}`;
  s.push(`<path d="${hd}L1000 560Z" fill="#2F6B4F"/>`);
  for (let x = 14; x < 1000; x += 34) {
    const h = 44 + 16 * Math.abs(Math.sin(x * 1.7));
    s.push(pine(x, hill(x) + 10, h));
  }

  // la grande piste de ski
  let sd = 'M-20 560';
  for (let x = -20; x <= 1020; x += 20) sd += `L${x} ${ySlope(x).toFixed(1)}`;
  s.push(`<path d="${sd}L1020 560Z" fill="url(#alpsSnowGrad)"/>`);
  let edge = '';
  for (let x = -20; x <= 1020; x += 20) edge += `${edge ? 'L' : 'M'}${x} ${ySlope(x).toFixed(1)}`;
  s.push(`<path d="${edge}" stroke="#FFFFFF" stroke-width="4" fill="none"/>`);
  for (const [x0, len, off] of [[40, 220, 38], [300, 260, 30], [620, 260, 26], [140, 160, 90]]) {
    let st = '';
    for (let x = x0; x <= x0 + len; x += 20) st += `${st ? 'L' : 'M'}${x} ${(ySlope(x) + off).toFixed(1)}`;
    s.push(`<path d="${st}" stroke="#BFD6EE" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`);
  }
  // portes de slalom
  [260, 420, 790].forEach((x, i) => {
    const y = ySlope(x) + 6;
    s.push(`<line x1="${x}" y1="${y - 38}" x2="${x}" y2="${y}" stroke="#333" stroke-width="2.2"/>`);
    s.push(`<path d="M${x} ${y - 38}L${x + 17} ${y - 32}L${x} ${y - 26}Z" fill="${i % 2 ? '#3D9FD6' : '#E85757'}"/>`);
  });
  // sapins du premier plan
  s.push(pine(92, 520, 92, '#1F5A3E'), pine(175, 556, 70, '#1F5A3E'), pine(28, 560, 64, '#1F5A3E'));

  s.push(`<g id="alpsSpray"></g><g id="alpsSkiers"></g><g id="alpsSnow"></g>`);
  return s.join('');
}
