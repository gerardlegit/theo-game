// ============================================================================
// Évolution — les dessins des PREMIÈRES VILLES (vue de trois quarts, comme
// la voie des humains : le sol vu d'en haut, tout ce qui est debout dessiné
// debout, de face, et rangé du fond vers le devant ; voir tqv.js et villes.js).
//
//   - Les gens (looks « th-… ») : les habitants de ta ville, en tuniques de
//     couleur ; ceux des autres villages ; les soldats ennemis (casque de
//     bronze, lance, bouclier) ; les marchands ; les ouvriers qui portent les
//     blocs ; les touristes d'aujourd'hui et leur guide (la fin du niveau).
//   - Les icônes : la pierre, la laine, les pièces d'argent, le pont, l'école,
//     le bateau, l'ouvrier, le monument…
//   - La ville : le sol (la terre battue, les rues pavées, la place du marché),
//     les remparts et leurs tours, les quatre portes, les maisons de pierre à
//     toit de chaume, les étals du marché, le puits, les écoles.
//   - Autour : la carrière et ses pierres taillées, les balles de laine, le pont
//     de pierre en arches, la route pavée, le port et sa grue, les bateaux à
//     voile, les charrettes des marchands, les villages voisins (huttes,
//     palissade, drapeau, étal), la cabane du chantier et ses tas de pierres.
//   - Le grand monument (au choix : la pyramide, la ziggourat, le temple, le
//     phare), qui monte étage par étage (k : 0 → 1), avec ses échafaudages.
// Le décor immobile (les maisons, les remparts, les étals…) est dessiné une
// fois dans une petite toile (cached()), puis collé : la ville ne ralentit pas.
// Repère : (x, y) = l'endroit où ça touche le sol ; tout monte vers le haut.
// ============================================================================

import { LOOKS, FRAMES, shade } from './art.js';
import { drawHuman, groundShadow, drawHut, drawStake, drawTower, drawHearth, flame, EXTRA_ICONS } from './art-humains.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, k) => a + (b - a) * k;
const seeded = (s) => {
  let a = (Math.abs(Math.floor(s)) * 9301 + 49297) % 233280;
  return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; };
};
function ell(ctx, x, y, rx, ry, a = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a, 0, TAU);
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

/* ---------- Le décor immobile, dessiné une fois dans une petite toile ----------
   key = ce qui le décrit ; (up, hw, down) = la place qu'il lui faut autour de (x, y) */
const SPR = new Map();
export function cached(ctx, key, x, y, up, hw, down, paint) {
  const m = ctx.getTransform();
  const sc = Math.max(0.2, Math.round(Math.hypot(m.a, m.b) * 6) / 6);
  const w = Math.ceil(hw * 2 * sc), h = Math.ceil((up + down) * sc);
  if (w * h > 5e6 || w < 2 || h < 2) { paint(ctx, x, y); return; }
  const k = `${key}|${sc}`;
  let cv = SPR.get(k);
  if (!cv) {
    if (SPR.size > 700) SPR.clear();
    cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    g.scale(sc, sc);
    paint(g, hw, up);
    SPR.set(k, cv);
  }
  ctx.drawImage(cv, x - hw, y - up, hw * 2, up + down);
}

/* ============================================================================
   LES GENS
   ============================================================================ */
const SKINS = ['#8D5A3A', '#C68A5A', '#A8704A', '#6E4630', '#E2B48A', '#B07A52'];
const HAIRS = ['#2A1C14', '#4A2E1A', '#1C1411', '#6A4628', '#8A5A2A', '#3A2618'];
const TUNICS = ['#E8DCC4', '#C2A878', '#D8C8A0', '#B8643A', '#3A6AC8', '#C8302A', '#6A8A3A', '#E8C05A', '#8A4AB8'];
const BORDERS = ['#A8442A', '#3A6A9A', '#C9A030', '#2E2A26', '#F2EEE4'];
const folk = (c, k = 0) => {
  const r = seeded(Math.floor((c.seed || 0) * 1000) + 7 + k);
  return { skin: SKINS[Math.floor(r() * SKINS.length)], hair: HAIRS[Math.floor(r() * HAIRS.length)], r };
};

/** Les habitants de ta ville : des tuniques de toutes les couleurs, des paniers, des jarres, des sacs de blé */
LOOKS['th-citadin'] = (ctx, c, t) => {
  const b = folk(c);
  const child = b.r() < 0.25;
  const female = b.r() < 0.5;
  const u = b.r();
  drawHuman(ctx, c, t, {
    skin: b.skin, hair: b.hair, cloth: TUNICS[Math.floor(b.r() * TUNICS.length)], woven: true, smooth: true, long: female && !child,
    border: BORDERS[Math.floor(b.r() * BORDERS.length)], child, style: female ? 'long' : b.r() < 0.5 ? 'court' : 'hirsute',
    beard: !female && !child && b.r() < 0.4, necklace: !child && b.r() < 0.3,
    tool: child ? null : u < 0.15 ? 'jarre' : u < 0.25 ? 'houe' : u < 0.32 ? 'tablette' : null,
    carry: c.carry || (!child && u > 0.85 ? 'sac' : null), hat: !child && b.r() < 0.15 ? 'paille' : null,
  });
};
/** Les habitants des autres villages : la couleur de leur village (c.dress), parfois un chapeau de paille */
LOOKS['th-habitant'] = (ctx, c, t) => {
  const b = folk(c, 3);
  const child = b.r() < 0.2;
  const female = b.r() < 0.5;
  drawHuman(ctx, c, t, {
    skin: b.skin, hair: b.hair, cloth: b.r() < 0.5 ? (c.dress || '#C2A878') : '#D8C8A0', woven: true, smooth: true, border: c.dress || '#A8442A',
    child, style: female ? 'long' : 'court', beard: !female && !child && b.r() < 0.5, necklace: b.r() < 0.4,
    hat: !child && b.r() < 0.35 ? 'paille' : null, hatBand: c.dress, tool: !child && b.r() < 0.25 ? 'houe' : null,
  });
};
/** Les soldats ennemis : casque de bronze à crête rouge, lance, bouclier */
LOOKS['th-soldat'] = (ctx, c, t) => {
  const b = folk(c, 5);
  drawHuman(ctx, c, t, {
    skin: b.skin, hair: b.hair, cloth: '#8A3A2A', cloth2: '#5A2418', woven: true, smooth: true, border: '#C9963A', style: 'court', beard: b.r() < 0.6,
    helmet: true, tool: 'lance', shield: true, legs: shade(b.skin, -0.1), shoes: '#3A2418',
  });
};
/** Le marchand qui mène la charrette */
LOOKS['th-negociant'] = (ctx, c, t) => {
  const b = folk(c, 7);
  drawHuman(ctx, c, t, { skin: b.skin, hair: b.hair, cloth: c.dress || '#3A6AC8', woven: true, smooth: true, border: '#F2C24A', style: 'court', beard: true, necklace: true, hat: 'paille', hatBand: c.dress });
};
/** L'ouvrier du chantier : un pagne, et un bloc de pierre sur l'épaule (quand il en porte un) */
LOOKS['th-ouvrier'] = (ctx, c, t) => {
  const b = folk(c, 9);
  drawHuman(ctx, c, t, {
    skin: b.skin, hair: b.hair, cloth: '#F2EEE4', bare: true, style: 'court', beard: b.r() < 0.4, carry: c.carry,
    tool: c.carry ? null : b.r() < 0.5 ? 'marteau' : null, band: b.r() < 0.5 ? '#F2EEE4' : null,
  });
};
/** Les touristes d'aujourd'hui : t-shirts de couleur, shorts, casquettes, appareils photo */
const TEES = ['#E8443A', '#3A8AE8', '#F2C24A', '#5AC87A', '#FFFFFF', '#E86A9A', '#8A6AD8', '#F28A3A'];
LOOKS['th-touriste'] = (ctx, c, t) => {
  const b = folk(c, 11);
  const child = b.r() < 0.25;
  const female = b.r() < 0.5;
  const tee = TEES[Math.floor(b.r() * TEES.length)];
  drawHuman(ctx, c, t, {
    skin: b.skin, hair: b.hair, cloth: tee, cloth2: shade(tee, -0.1), smooth: true, child, style: female ? 'long' : 'court',
    legs: b.r() < 0.5 ? b.skin : '#3A5A8A', shoes: '#F2F2F2', beard: !female && !child && b.r() < 0.2,
    hat: b.r() < 0.4 ? 'casquette' : b.r() < 0.3 ? 'paille' : null, hatCol: TEES[Math.floor(b.r() * TEES.length)],
    tool: child ? null : b.r() < 0.6 ? 'appareil' : null, sleeves: false,
  });
};
/** Le guide des touristes, avec son petit drapeau jaune */
/** Un élève de l'école, avec sa tablette d'argile */
LOOKS['th-eleve'] = (ctx, c, t) => {
  const b = folk(c, 13);
  drawHuman(ctx, c, t, { skin: b.skin, hair: b.hair, cloth: TUNICS[Math.floor(b.r() * TUNICS.length)], woven: true, smooth: true, border: '#F2EEE4', child: true, style: b.r() < 0.5 ? 'long' : 'court', tool: 'tablette' });
};
LOOKS['th-guide'] = (ctx, c, t) => drawHuman(ctx, c, t, { skin: '#C68A5A', hair: '#2A1C14', cloth: '#2E8A6A', smooth: true, style: 'court', legs: '#3A3A44', shoes: '#2A2A2A', hat: 'casquette', hatCol: '#F2C24A', tool: 'drapeau', flag: '#F2C24A', sleeves: false });
for (const id of ['citadin', 'habitant', 'soldat', 'negociant', 'ouvrier', 'touriste', 'guide', 'eleve']) FRAMES[`th-${id}`] = { r: 0.28, x: 0.5, y: 0.9 };

/* ============================================================================
   LES ICÔNES (le compteur en haut de l'écran, le coût des plans, les missions)
   ============================================================================ */
EXTRA_ICONS.pierre = (ctx, s) => {
  // deux blocs de pierre taillée, l'un sur l'autre
  cutBlock(ctx, -s * 0.08, s * 0.82, s * 1.6, s * 0.62, s * 0.36, '#CEC2A6', 3);
  cutBlock(ctx, s * 0.12, s * 0.02, s * 1.05, s * 0.5, s * 0.3, '#D8CCB0', 5);
};
EXTRA_ICONS.laine = (ctx, s) => {
  ctx.fillStyle = '#F8F4EA';
  ctx.strokeStyle = '#8A7A62';
  for (const [dx, dy, r] of [[-0.38, 0.12, 0.38], [0.36, 0.14, 0.38], [0, -0.22, 0.42], [0, 0.28, 0.4]]) {
    ell(ctx, dx * s, dy * s, r * s, r * s * 0.9);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = '#C8B89A';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.18, 0, Math.PI * 1.5);
  ctx.stroke();
};
EXTRA_ICONS.argent = (ctx, s) => {
  // deux pièces d'argent, l'une sur l'autre
  for (const [dx, dy] of [[-0.22, 0.2], [0.18, -0.12]]) {
    const g = ctx.createRadialGradient(dx * s - s * 0.15, dy * s - s * 0.15, s * 0.05, dx * s, dy * s, s * 0.6);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(1, '#A8B0BC');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#4A5260';
    ell(ctx, dx * s, dy * s, s * 0.55, s * 0.55);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#6A7280';
    ell(ctx, dx * s, dy * s, s * 0.36, s * 0.36);
    ctx.stroke();
  }
};
EXTRA_ICONS.pont = (ctx, s) => {
  ctx.fillStyle = '#5AB0E0';
  ctx.fillRect(-s * 0.9, s * 0.25, s * 1.8, s * 0.45);
  ctx.fillStyle = '#C8BCA4';
  ctx.strokeStyle = '#4A4236';
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, -s * 0.35);
  ctx.lineTo(s * 0.95, -s * 0.35);
  ctx.lineTo(s * 0.95, s * 0.6);
  ctx.lineTo(s * 0.6, s * 0.6);
  ctx.arc(s * 0.32, s * 0.6, s * 0.28, 0, Math.PI, true);
  ctx.lineTo(s * 0.0, s * 0.6);
  ctx.arc(-s * 0.32, s * 0.6, s * 0.28, 0, Math.PI, true);
  ctx.lineTo(-s * 0.95, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};
EXTRA_ICONS.tablette = (ctx, s) => {
  ctx.fillStyle = '#C9A274';
  ctx.strokeStyle = '#5A3A22';
  rrect(ctx, -s * 0.65, -s * 0.8, s * 1.3, s * 1.6, s * 0.15);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#6A4A2A';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const x = -s * 0.4 + j * s * 0.32, y = -s * 0.5 + i * s * 0.34;
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * 0.14, y + s * 0.08);
      ctx.moveTo(x + s * 0.04, y + s * 0.12);
      ctx.lineTo(x + s * 0.12, y);
    }
  }
  ctx.stroke();
};
EXTRA_ICONS.ecole = EXTRA_ICONS.tablette;
EXTRA_ICONS.bateau = (ctx, s) => {
  ctx.fillStyle = '#5AB0E0';
  ctx.fillRect(-s, s * 0.45, s * 2, s * 0.4);
  ctx.fillStyle = '#8A5A30';
  ctx.strokeStyle = '#3A2414';
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, s * 0.15);
  ctx.quadraticCurveTo(0, s * 0.85, s * 0.95, s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.2);
  ctx.lineTo(0, -s * 0.95);
  ctx.stroke();
  ctx.fillStyle = '#F8F0DC';
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, -s * 0.8);
  ctx.quadraticCurveTo(0, -s * 0.55, s * 0.6, -s * 0.8);
  ctx.lineTo(s * 0.55, s * 0.0);
  ctx.quadraticCurveTo(0, s * 0.15, -s * 0.55, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#C8302A';
  ctx.fillRect(-s * 0.58, -s * 0.45, s * 1.14, s * 0.12);
};
EXTRA_ICONS.ouvrier = (ctx, s) => {
  EXTRA_ICONS.pierre(ctx, s * 0.6);
  ctx.save();
  ctx.translate(s * 0.25, -s * 0.35);
  ctx.rotate(-0.6);
  ctx.fillStyle = '#7A5434';
  ctx.strokeStyle = '#3A2414';
  ctx.beginPath();
  ctx.rect(-s * 0.06, -s * 0.1, s * 0.12, s * 0.9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#C9963A';
  ctx.beginPath();
  ctx.rect(-s * 0.3, -s * 0.28, s * 0.6, s * 0.24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};
EXTRA_ICONS.ami = (ctx, s) => {
  ctx.fillStyle = '#FF6F91';
  ctx.strokeStyle = '#8A1E3A';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.8);
  ctx.bezierCurveTo(-s * 1.1, 0, -s * 0.6, -s * 0.9, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.6, -s * 0.9, s * 1.1, 0, 0, s * 0.8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ell(ctx, -s * 0.35, -s * 0.25, s * 0.15, s * 0.1, -0.5);
  ctx.fill();
};
EXTRA_ICONS.carte = (ctx, s) => {
  // une rose des vents
  ctx.fillStyle = '#F2E6C4';
  ctx.strokeStyle = '#5A4020';
  ell(ctx, 0, 0, s * 0.85, s * 0.85);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    ctx.fillStyle = i === 0 ? '#C8302A' : '#3A3A44';
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - Math.PI / 2) * s * 0.75, Math.sin(a - Math.PI / 2) * s * 0.75);
    ctx.lineTo(Math.cos(a) * s * 0.16, Math.sin(a) * s * 0.16);
    ctx.lineTo(Math.cos(a + Math.PI) * s * 0.16, Math.sin(a + Math.PI) * s * 0.16);
    ctx.closePath();
    ctx.fill();
  }
};
EXTRA_ICONS.monument = (ctx, s) => {
  ctx.fillStyle = '#E2C890';
  ctx.strokeStyle = '#6A5030';
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, s * 0.7);
  ctx.lineTo(0, -s * 0.85);
  ctx.lineTo(s * 0.95, s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#B89A62';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.85);
  ctx.lineTo(s * 0.95, s * 0.7);
  ctx.lineTo(s * 0.3, s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F2C24A';
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, -s * 0.6);
  ctx.lineTo(0, -s * 0.85);
  ctx.lineTo(s * 0.15, -s * 0.6);
  ctx.closePath();
  ctx.fill();
};
EXTRA_ICONS.plans = (ctx, s) => {
  ctx.fillStyle = '#F2E6C4';
  ctx.strokeStyle = '#6A5030';
  ctx.beginPath();
  ctx.rect(-s * 0.8, -s * 0.6, s * 1.6, s * 1.2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#2E5AA8';
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, s * 0.4);
  ctx.lineTo(0, -s * 0.4);
  ctx.lineTo(s * 0.55, s * 0.4);
  ctx.closePath();
  ctx.moveTo(-s * 0.55, s * 0.4);
  ctx.lineTo(s * 0.55, s * 0.4);
  ctx.stroke();
};

/* ============================================================================
   LA VILLE : le sol, les remparts, les portes, les maisons, le marché
   ============================================================================ */
const STONE = '#C9BCA2';
const STONE_DARK = '#8A7E68';
const INKS = '#3E3628';

let cobbles = null;
/** Le motif des pavés (une petite toile, répétée) */
function cobblePattern(ctx) {
  if (cobbles) return cobbles;
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#BFAE8C';
  g.fillRect(0, 0, 96, 96);
  const r = seeded(5);
  for (let y = 0; y < 96; y += 16) {
    for (let x = (y / 16) % 2 ? -12 : 0; x < 96; x += 24) {
      const col = ['#C9B894', '#B3A282', '#D2C29E', '#AE9C7A'][Math.floor(r() * 4)];
      g.fillStyle = col;
      g.strokeStyle = 'rgba(70, 56, 36, 0.55)';
      g.lineWidth = 1.5;
      g.beginPath();
      if (g.roundRect) g.roundRect(x + 1, y + 1, 22, 14, 4); else g.rect(x + 1, y + 1, 22, 14);
      g.fill();
      g.stroke();
    }
  }
  cobbles = ctx.createPattern(c, 'repeat');
  return cobbles;
}

/** Le sol de la ville : la terre battue, les deux grandes rues pavées, la place du marché ronde */
export function drawCityGround(ctx, C, t) {
  const { x, y, half } = C;
  // la terre battue (un peu plus large que les remparts)
  ctx.fillStyle = '#B8A276';
  ctx.beginPath();
  ctx.rect(x - half - 60, y - half - 60, (half + 60) * 2, (half + 60) * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(120, 100, 60, 0.18)';
  const r = seeded(17);
  for (let i = 0; i < 70; i++) {
    ell(ctx, x + (r() * 2 - 1) * half, y + (r() * 2 - 1) * half, 30 + r() * 70, 14 + r() * 30);
    ctx.fill();
  }
  // l'ombre des remparts, par terre : au pied du rempart ouest (dedans) et du rempart nord (dedans)
  ctx.fillStyle = 'rgba(40, 32, 14, 0.16)';
  ctx.fillRect(x - half + 26, y - half, 40, half * 2);
  ctx.fillRect(x - half, y - half + 4, half * 2, 34);
  // les rues : du marché jusqu'aux quatre portes
  ctx.fillStyle = cobblePattern(ctx);
  const sw = C.street || 150;
  ctx.fillRect(x - sw / 2, y - half - 80, sw, half * 2 + 160);
  ctx.fillRect(x - half - 80, y - sw / 2, half * 2 + 160, sw);
  // la place du marché
  ell(ctx, x, y, C.plaza || 360, (C.plaza || 360) * 0.82);
  ctx.fill();
  ctx.strokeStyle = 'rgba(80, 64, 40, 0.6)';
  ctx.lineWidth = 6;
  ctx.stroke();
}

/* ---------- La pierre, bloc par bloc ----------
   Chaque pierre a sa couleur, sa lumière en haut et à gauche, son ombre en bas, parfois une
   fissure, de petits trous ou une tache de lichen ; entre les pierres, le mortier. (Tout cela
   est dessiné une seule fois, dans les petites toiles de cached().) */
const STONES = ['#D3C6AA', '#C8BA9C', '#DCD0B4', '#C0B294', '#CEC2A6', '#BCAE92', '#D6C8A8'];
const DARK_STONES = ['#A89A7E', '#9C8E74', '#B0A286', '#968A70'];
const FLAGS = ['#DDD2B8', '#D4C8AC', '#E2D8C0', '#D8CCB2'];
const MORTAR = '#7E705A';

/** Une pierre (x, y, w, h), aux coins arrondis, éclairée d'en haut à gauche */
function stone(g, x, y, w, h, col, r) {
  if (w < 3 || h < 3) return;
  const rad = Math.min(5, h * 0.3, w * 0.3);
  g.save();
  rrect(g, x, y, w, h, rad);
  g.fillStyle = col;
  g.fill();
  g.clip();
  g.fillStyle = 'rgba(255, 252, 238, 0.38)';
  g.fillRect(x, y, w, Math.max(1.5, h * 0.2));
  g.fillStyle = 'rgba(255, 252, 238, 0.16)';
  g.fillRect(x, y, Math.max(1.5, w * 0.08), h);
  g.fillStyle = 'rgba(60, 44, 24, 0.24)';
  g.fillRect(x, y + h * 0.74, w, h * 0.26);
  const u = r();
  if (u < 0.2) {
    // une fissure
    g.strokeStyle = 'rgba(70, 54, 32, 0.5)';
    g.lineWidth = 1;
    g.beginPath();
    const cx = x + w * (0.25 + r() * 0.5);
    g.moveTo(cx, y);
    g.lineTo(cx + (r() - 0.5) * 6, y + h * 0.45);
    g.lineTo(cx + (r() - 0.5) * 10, y + h);
    g.stroke();
  } else if (u < 0.5) {
    // de petits trous
    g.fillStyle = 'rgba(80, 64, 40, 0.35)';
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.arc(x + r() * w, y + h * (0.3 + r() * 0.5), 0.8 + r() * 1.2, 0, TAU);
      g.fill();
    }
  } else if (u > 0.93) {
    // une tache de lichen
    g.fillStyle = 'rgba(150, 160, 90, 0.45)';
    ell(g, x + r() * w, y + h * 0.4, w * 0.18, h * 0.22);
    g.fill();
  }
  g.restore();
  rrect(g, x, y, w, h, rad);
  g.strokeStyle = 'rgba(58, 46, 30, 0.55)';
  g.lineWidth = 1;
  g.stroke();
}

/** Un pan de mur en pierres taillées, rang par rang (du bas vers le haut), dans le rectangle (x, y, w, h)
    o : { row (la hauteur d'un rang), wide (des pierres plus longues), cols, seed, mortar, shadeDown } */
function masonry(g, x, y, w, h, o = {}) {
  const r = seeded(o.seed ?? 7);
  const rowH = o.row || 22, cols = o.cols || STONES, gap = o.gap ?? 2.4;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = o.mortar || MORTAR;
  g.fillRect(x, y, w, h);
  let row = 0;
  for (let yy = y + h; yy > y; yy -= rowH, row++) {
    let xx = x - r() * rowH * 1.2 - (row % 2) * rowH * 0.6;
    while (xx < x + w) {
      const bw = rowH * (o.wide || 1) * (1.2 + r() * 1.6);
      stone(g, xx + gap / 2, yy - rowH + gap / 2, bw - gap, rowH - gap, shade(cols[Math.floor(r() * cols.length)], (r() - 0.5) * 0.08), r);
      xx += bw;
    }
  }
  if (o.shadeDown !== false) {
    // un peu plus sombre vers le bas
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, 'rgba(255, 245, 220, 0.06)');
    gr.addColorStop(1, 'rgba(40, 30, 15, 0.16)');
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  }
  g.restore();
}

/** Un créneau : une grosse pierre debout sur le bord du chemin de ronde ((x, y) = le bas de sa face, à gauche) */
function merlon(g, x, y, w, h, d, seed) {
  // son ombre, sur les dalles derrière lui
  g.fillStyle = 'rgba(40, 30, 15, 0.22)';
  g.fillRect(x + w, y - d - 2, 7, d + 2);
  masonry(g, x, y - h, w, h, { row: h / 2, wide: 1.4, seed, shadeDown: false });
  g.fillStyle = '#E6DCC4';
  g.fillRect(x, y - h - d, w, d);
  g.fillStyle = 'rgba(255, 255, 245, 0.5)';
  g.fillRect(x + 1, y - h - d + 1, w - 2, 2);
  g.strokeStyle = INKS;
  g.lineWidth = 2;
  g.strokeRect(x, y - h - d, w, h + d);
  g.beginPath();
  g.moveTo(x, y - h);
  g.lineTo(x + w, y - h);
  g.stroke();
}

/** Une meurtrière, encadrée de pierres claires */
function arrowSlit(g, x, y) {
  g.fillStyle = '#E2D7BE';
  g.strokeStyle = 'rgba(58, 46, 30, 0.6)';
  g.lineWidth = 1.2;
  rrect(g, x - 9, y - 22, 18, 46, 4);
  g.fill();
  g.stroke();
  g.fillStyle = '#1E1810';
  rrect(g, x - 3, y - 16, 6, 34, 3);
  g.fill();
}

/** Au pied d'un mur : de la mousse, des touffes d'herbe */
function wallFoot(g, x0, len, oy, r) {
  for (let xx = x0 + r() * 30; xx < x0 + len - 8; xx += 30 + r() * 40) {
    g.fillStyle = 'rgba(88, 118, 52, 0.55)';
    ell(g, xx, oy - 3, 10 + r() * 10, 4 + r() * 3);
    g.fill();
    g.strokeStyle = '#5E8A36';
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.beginPath();
    for (const k of [-1, 0, 1]) {
      g.moveTo(xx + k * 4, oy);
      g.lineTo(xx + k * 6 + (r() - 0.5) * 3, oy - 8 - r() * 6);
    }
    g.stroke();
  }
}

/** Un morceau de rempart (est-ouest) : sa base, sa face de pierres, son cordon, son chemin de ronde
    dallé et ses créneaux (side : -1 = au nord, créneaux au fond ; 1 = au sud, créneaux devant) */
const WALL_H = 150, WALL_T = 44;
function paintWallH(g, ox, oy, len, side, v) {
  const x0 = ox - len / 2, top = oy - WALL_H, wt = WALL_T * 0.55;
  const seed = Math.round(len) * 7 + v * 131 + (side > 0 ? 3 : 0);
  const r = seeded(seed + 17);
  // le chemin de ronde : des dalles
  masonry(g, x0 - 2, top - wt, len + 4, wt, { row: 11, wide: 2.4, cols: FLAGS, seed: seed + 1, shadeDown: false });
  g.fillStyle = 'rgba(40, 30, 15, 0.12)';
  g.fillRect(x0, top - wt, len, 4);
  if (side < 0) for (let xx = x0 + 6; xx < x0 + len - 16; xx += 36) merlon(g, xx, top - wt + 6, 22, 24, 8, seed + xx);
  // la face, puis la grosse base en pierres sombres
  masonry(g, x0 - 2, top, len + 4, WALL_H - 26, { row: 21, seed });
  masonry(g, x0 - 2, oy - 26, len + 4, 26, { row: 26, wide: 1.6, cols: DARK_STONES, seed: seed + 5 });
  g.fillStyle = 'rgba(30, 22, 10, 0.25)';
  g.fillRect(x0, oy - 28, len, 3);
  // des coulures sombres sous le cordon
  for (let i = 0; i < 3; i++) {
    const sx = x0 + 10 + r() * (len - 30), sw = 5 + r() * 8, sh = 24 + r() * 36;
    const gr = g.createLinearGradient(0, top + 8, 0, top + 8 + sh);
    gr.addColorStop(0, 'rgba(70, 60, 40, 0.14)');
    gr.addColorStop(1, 'rgba(70, 60, 40, 0)');
    g.fillStyle = gr;
    g.fillRect(sx, top + 8, sw, sh);
  }
  // une meurtrière (pas toujours)
  if (r() < 0.6) arrowSlit(g, x0 + len * (0.3 + r() * 0.4), top + 62);
  // le cordon : une moulure qui dépasse, et son ombre dessous
  g.fillStyle = 'rgba(30, 22, 10, 0.3)';
  g.fillRect(x0, top + 6, len, 6);
  masonry(g, x0 - 2, top - 3, len + 4, 9, { row: 9, wide: 3, cols: FLAGS, seed: seed + 9, shadeDown: false });
  g.strokeStyle = INKS;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x0, top - 3);
  g.lineTo(x0 + len, top - 3);
  g.moveTo(x0, top + 6);
  g.lineTo(x0 + len, top + 6);
  g.stroke();
  if (side > 0) for (let xx = x0 + 6; xx < x0 + len - 16; xx += 36) merlon(g, xx, top - 1, 22, 24, 8, seed + xx);
  // les bords
  g.strokeStyle = INKS;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(x0, top - wt);
  g.lineTo(x0 + len, top - wt);
  g.moveTo(x0, oy);
  g.lineTo(x0 + len, oy);
  g.stroke();
  wallFoot(g, x0, len, oy, r);
}
export function drawWallH(ctx, w) {
  const side = w.side ?? 1, v = Math.abs(Math.round(w.x / 125)) % 4;
  cached(ctx, `murH|${Math.round(w.len)}|${side}|${v}`, w.x, w.y, WALL_H + 70, w.len / 2 + 6, 10, (g, ox, oy) => paintWallH(g, ox, oy, w.len, side, v));
}

/** Un bloc du rempart nord-sud (vu par le bout : on voit son chemin de ronde dallé, son muret
    intérieur et un créneau sur le bord extérieur ; side : -1 = à l'ouest, 1 = à l'est) */
function paintWallV(g, ox, oy, len, side, v) {
  const w = WALL_T + 12, x0 = ox - w / 2, top = oy - WALL_H;
  const seed = 31 + Math.round(len) + v * 97 + (side > 0 ? 5 : 0);
  // la face (on la voit au bout du mur, près des portes et des tours)
  masonry(g, x0, top, w, WALL_H - 24, { row: 21, seed });
  masonry(g, x0, oy - 24, w, 24, { row: 24, cols: DARK_STONES, seed: seed + 3 });
  // le dessus : le chemin de ronde, dallé
  masonry(g, x0, top - len - 2, w, len + 4, { row: 15, wide: 1.3, cols: FLAGS, seed: seed + 7, shadeDown: false });
  g.fillStyle = 'rgba(60, 45, 25, 0.14)';
  g.fillRect(x0 + 12, top - len, w - 24, len);
  // le muret intérieur, et le créneau sur le bord extérieur
  const outer = side < 0 ? x0 : x0 + w - 13, inner = side < 0 ? x0 + w - 9 : x0;
  masonry(g, inner, top - len, 9, len, { row: len / 2, cols: FLAGS, seed: seed + 11, shadeDown: false });
  g.fillStyle = 'rgba(40, 30, 15, 0.22)';
  g.fillRect(side < 0 ? inner - 4 : inner + 9, top - len, 4, len);
  const my = top - len * 0.2;
  masonry(g, outer, my - 20, 13, 20, { row: 10, seed: seed + 13, shadeDown: false });
  g.fillStyle = '#E6DCC4';
  g.fillRect(outer, my - 20 - len * 0.38, 13, len * 0.38);
  g.strokeStyle = INKS;
  g.lineWidth = 1.5;
  g.strokeRect(outer, my - 20 - len * 0.38, 13, 20 + len * 0.38);
  // le cordon, sur la face
  g.fillStyle = 'rgba(30, 22, 10, 0.3)';
  g.fillRect(x0, top + 6, w, 5);
  g.fillStyle = '#E2D7BE';
  g.fillRect(x0, top - 3, w, 9);
  // les deux grands côtés
  g.strokeStyle = INKS;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(x0, top - len);
  g.lineTo(x0, oy);
  g.moveTo(x0 + w, top - len);
  g.lineTo(x0 + w, oy);
  g.moveTo(x0, oy);
  g.lineTo(x0 + w, oy);
  g.stroke();
}
export function drawWallV(ctx, w) {
  const side = w.side ?? -1, v = Math.abs(Math.round(w.y / 60)) % 4;
  cached(ctx, `murV|${Math.round(w.len)}|${side}|${v}`, w.x, w.y, WALL_H + w.len + 50, WALL_T / 2 + 14, 6, (g, ox, oy) => paintWallV(g, ox, oy, w.len, side, v));
}

/** Une tour ronde du rempart (r = son rayon) : des rangs de pierres, l'ombre du côté droit, un
    cordon, une meurtrière, et une couronne de créneaux autour du chemin de ronde */
function paintTower(g, ox, oy, r, H, flag) {
  groundShadow(g, ox + r * 0.2, oy, r * 1.2, r * 0.38, 0.3);
  const body = () => {
    g.beginPath();
    g.moveTo(ox - r, oy - H);
    g.lineTo(ox - r, oy);
    g.ellipse(ox, oy, r, r * 0.35, 0, Math.PI, 0, true);
    g.lineTo(ox + r, oy - H);
    g.closePath();
  };
  g.save();
  body();
  g.clip();
  masonry(g, ox - r, oy - H, r * 2, H + r * 0.4, { row: 20, wide: 0.8, seed: r * 3 + H });
  masonry(g, ox - r, oy - 26, r * 2, 26 + r * 0.4, { row: 26, wide: 0.9, cols: DARK_STONES, seed: r * 5 + H });
  // le volume : clair à gauche, sombre à droite, et les rangs qui s'arrondissent
  const gr = g.createLinearGradient(ox - r, 0, ox + r, 0);
  gr.addColorStop(0, 'rgba(255, 250, 230, 0.26)');
  gr.addColorStop(0.35, 'rgba(255, 250, 230, 0)');
  gr.addColorStop(0.7, 'rgba(40, 30, 15, 0.14)');
  gr.addColorStop(1, 'rgba(40, 30, 15, 0.5)');
  g.fillStyle = gr;
  g.fillRect(ox - r, oy - H - 10, r * 2, H + r);
  g.strokeStyle = 'rgba(60, 45, 25, 0.22)';
  g.lineWidth = 2;
  for (let yy = oy - 21; yy > oy - H; yy -= 20) {
    g.beginPath();
    g.ellipse(ox, yy, r, r * 0.3, 0, 0.15, Math.PI - 0.15);
    g.stroke();
  }
  g.restore();
  body();
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  g.stroke();
  // une meurtrière
  arrowSlit(g, ox - r * 0.18, oy - H * 0.58);
  // le cordon, tout autour
  g.fillStyle = 'rgba(30, 22, 10, 0.3)';
  g.beginPath();
  g.ellipse(ox, oy - H + 10, r, r * 0.35, 0, 0, Math.PI);
  g.ellipse(ox, oy - H + 2, r, r * 0.35, 0, Math.PI, 0, true);
  g.fill();
  // le dessus : le chemin de ronde dallé…
  g.save();
  ell(g, ox, oy - H, r * 1.06, r * 0.37);
  g.clip();
  masonry(g, ox - r * 1.1, oy - H - r * 0.4, r * 2.2, r * 0.8, { row: 12, wide: 1.6, cols: FLAGS, seed: r + 5, shadeDown: false });
  g.restore();
  ell(g, ox, oy - H, r * 1.06, r * 0.37);
  g.strokeStyle = INKS;
  g.lineWidth = 2.5;
  g.stroke();
  // …et sa couronne de créneaux (ceux du fond, puis ceux de devant)
  const n = Math.max(7, Math.round(r / 9));
  const spots = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    spots.push({ x: ox + Math.cos(a) * r * 0.98, y: oy - H + Math.sin(a) * r * 0.35, i });
  }
  spots.sort((a, b) => a.y - b.y);
  for (const s of spots) merlon(g, s.x - 9, s.y + 4, 18, 22, 7, r * 11 + s.i);
  if (flag) {
    g.strokeStyle = '#3A2414';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(ox, oy - H - 10);
    g.lineTo(ox, oy - H - 100);
    g.stroke();
    g.fillStyle = flag;
    g.strokeStyle = shade(flag, -0.5);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(ox, oy - H - 100);
    g.quadraticCurveTo(ox + 30, oy - H - 92, ox + 54, oy - H - 84);
    g.lineTo(ox, oy - H - 66);
    g.closePath();
    g.fill();
    g.stroke();
  }
}
export function drawCityTower(ctx, tw) {
  const r = tw.r || 80, H = tw.h || 220;
  cached(ctx, `tour|${r}|${H}|${tw.flag || ''}`, tw.x, tw.y, H + (tw.flag ? 110 : 50), r * 1.2 + 60, r * 0.5, (g, ox, oy) => paintTower(g, ox, oy, r, H, tw.flag));
}

/** Une arche de pierre : ses voussoirs (les pierres en coin, tout autour), sa clé de voûte dorée.
    (cx, cy) = le milieu de la naissance de l'arche ; rx, ry = ses rayons ; th = l'épaisseur des voussoirs */
function voussoirs(g, cx, cy, rx, ry, th, n, seed, key = '#E8C05A') {
  const r = seeded(seed);
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI, a1 = Math.PI + ((i + 1) / n) * Math.PI;
    const P = (a, k) => ({ x: cx + Math.cos(a) * (rx + k), y: cy + Math.sin(a) * (ry + k * 0.9) });
    const p = [P(a0 + 0.01, 0), P(a1 - 0.01, 0), P(a1 - 0.01, th), P(a0 + 0.01, th)];
    const mid = i === Math.floor(n / 2);
    g.beginPath();
    p.forEach((q, k) => (k ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
    g.closePath();
    g.fillStyle = mid && key ? key : shade(STONES[Math.floor(r() * STONES.length)], 0.05 + (i % 2) * 0.05);
    g.fill();
    g.strokeStyle = 'rgba(58, 46, 30, 0.7)';
    g.lineWidth = 1.4;
    g.stroke();
    // la lumière sur le bord intérieur
    g.strokeStyle = 'rgba(255, 252, 236, 0.45)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(p[3].x, p[3].y);
    g.lineTo(p[2].x, p[2].y);
    g.stroke();
  }
}

/** Le grand portail d'une porte nord ou sud : l'arche par-dessus le passage (gw = sa largeur) */
function paintGateArch(g, ox, oy, gw) {
  const H = WALL_H + 30, top = oy - H, L = ox - gw / 2 - 10, R = ox + gw / 2 + 10;
  const spring = oy - 100, rx = gw / 2 + 2, ry = 70;
  // la maçonnerie au-dessus de l'arche
  g.save();
  g.beginPath();
  g.rect(L, top, R - L, spring - top);
  g.moveTo(ox + rx, spring);
  g.ellipse(ox, spring, rx, ry, 0, 0, Math.PI, true);
  g.closePath();
  g.clip('evenodd');
  masonry(g, L, top, R - L, spring - top + 2, { row: 20, seed: Math.round(gw) });
  g.restore();
  voussoirs(g, ox, spring, rx, ry, 20, 11, Math.round(gw) + 3);
  // le cordon, et le contour
  g.fillStyle = 'rgba(30, 22, 10, 0.3)';
  g.fillRect(L, top + 6, R - L, 6);
  masonry(g, L, top - 3, R - L, 9, { row: 9, wide: 3, cols: FLAGS, seed: 5, shadeDown: false });
  g.strokeStyle = INKS;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(L, spring);
  g.lineTo(L, top - 3);
  g.lineTo(R, top - 3);
  g.lineTo(R, spring);
  g.stroke();
  for (let xx = L + 4; xx < R - 16; xx += 36) merlon(g, xx, top - 1, 22, 24, 8, 77 + xx);
}
export function drawGateArch(ctx, ga) {
  cached(ctx, `porte|${ga.w}`, ga.x, ga.y, WALL_H + 80, ga.w / 2 + 24, 4, (g, ox, oy) => paintGateArch(g, ox, oy, ga.w));
}

/** Une maison de pierre, avec son toit de chaume (v = la variante : la porte, les fenêtres, les pots…) */
const HOUSE_WALLS = ['#D2C4A6', '#C8B898', '#DCCFAE', '#C2B08C', '#D8C8A2'];
function paintHouse(g, ox, oy, v, thatch) {
  const r = seeded(v * 97 + 11);
  const W = 190 + Math.floor(r() * 3) * 16, Hw = 88 + Math.floor(r() * 3) * 8;
  const wall = HOUSE_WALLS[v % HOUSE_WALLS.length];
  groundShadow(g, ox + 10, oy + 2, W * 0.6, 26, 0.3);
  // le mur de devant, en pierres (de la couleur de la maison)
  masonry(g, ox - W / 2, oy - Hw, W, Hw, { row: 17, seed: v * 13 + 5, cols: [wall, shade(wall, 0.06), shade(wall, -0.06), shade(wall, 0.11), shade(wall, -0.1)] });
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  g.strokeRect(ox - W / 2, oy - Hw, W, Hw);
  // la porte en bois, et ses clous
  const dx = (r() - 0.5) * W * 0.4;
  g.fillStyle = '#6A4A2A';
  g.strokeStyle = '#2A1A0C';
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(ox + dx - 20, oy);
  g.lineTo(ox + dx - 20, oy - 54);
  g.quadraticCurveTo(ox + dx, oy - 70, ox + dx + 20, oy - 54);
  g.lineTo(ox + dx + 20, oy);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(30, 18, 8, 0.5)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(ox + dx, oy - 62);
  g.lineTo(ox + dx, oy - 2);
  g.stroke();
  // les fenêtres, avec leurs volets
  for (const fx of [-0.32, 0.32]) {
    const wx = ox + fx * W;
    if (Math.abs(wx - (ox + dx)) < 50) continue;
    g.fillStyle = '#2A2218';
    g.beginPath();
    g.rect(wx - 12, oy - Hw + 22, 24, 22);
    g.fill();
    g.fillStyle = ['#3A6A9A', '#6A8A3A', '#A8442A'][v % 3];
    g.strokeStyle = '#2A1A0C';
    g.lineWidth = 2;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.rect(wx + s * 12 - (s > 0 ? 0 : 10), oy - Hw + 21, 10, 24);
      g.fill();
      g.stroke();
    }
  }
  // le toit de chaume : la pente de devant (le faîte court d'est en ouest)
  const roof = thatch || '#D2B060';
  const eave = oy - Hw + 8, ridge = oy - Hw - 92;
  const rg = g.createLinearGradient(0, ridge, 0, eave);
  rg.addColorStop(0, shade(roof, 0.14));
  rg.addColorStop(1, shade(roof, -0.12));
  g.fillStyle = rg;
  g.strokeStyle = shade(roof, -0.55);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(ox - W / 2 - 18, eave);
  g.quadraticCurveTo(ox - W / 2 - 6, (eave + ridge) / 2, ox - W / 2 + 22, ridge);
  g.lineTo(ox + W / 2 - 22, ridge);
  g.quadraticCurveTo(ox + W / 2 + 6, (eave + ridge) / 2, ox + W / 2 + 18, eave);
  g.quadraticCurveTo(ox, eave + 10, ox - W / 2 - 18, eave);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(110, 80, 30, 0.35)';
  g.lineWidth = 2;
  g.beginPath();
  for (let xx = ox - W / 2; xx < ox + W / 2; xx += 12) {
    g.moveTo(xx, ridge + 6);
    g.lineTo(xx + (xx - ox) * 0.08, eave + 2);
  }
  g.stroke();
  // le faîte, bien épais
  g.fillStyle = shade(roof, -0.2);
  g.strokeStyle = shade(roof, -0.55);
  g.lineWidth = 2.5;
  rrect(g, ox - W / 2 + 16, ridge - 10, W - 32, 14, 7);
  g.fill();
  g.stroke();
  // des jarres, un banc, des fleurs…
  const extra = v % 4;
  if (extra === 0) {
    for (const jx of [W / 2 - 26, W / 2 - 46]) {
      g.fillStyle = '#B8643A';
      g.strokeStyle = '#5A2A14';
      g.lineWidth = 2;
      ell(g, ox + jx, oy - 12, 9, 12);
      g.fill();
      g.stroke();
    }
  } else if (extra === 1) {
    g.fillStyle = '#8A6440';
    g.strokeStyle = '#3A2414';
    g.lineWidth = 2;
    g.beginPath();
    g.rect(ox - W / 2 + 12, oy - 18, 50, 8);
    g.fill();
    g.stroke();
  } else if (extra === 2) {
    for (const [fx, col] of [[-W / 2 + 22, '#E86A9A'], [-W / 2 + 40, '#F2E25A']]) {
      g.fillStyle = '#B8643A';
      g.fillRect(ox + fx - 7, oy - 14, 14, 14);
      g.fillStyle = '#4E8A34';
      ell(g, ox + fx, oy - 20, 10, 7);
      g.fill();
      g.fillStyle = col;
      ell(g, ox + fx, oy - 24, 4, 4);
      g.fill();
    }
  }
}
export function drawStoneHouse(ctx, h, thatch) {
  cached(ctx, `maison|${h.v}|${thatch}`, h.x, h.y, 240, 150, 30, (g, ox, oy) => paintHouse(g, ox, oy, h.v, thatch));
}

/** Un étal du marché : un auvent rayé, un comptoir, et ce qu'on y vend (goods) */
const GOODS = ['ble', 'jarres', 'poissons', 'fruits', 'tissus', 'laine', 'pain'];
function paintStall(g, ox, oy, col, goods) {
  groundShadow(g, ox, oy + 2, 80, 18, 0.25);
  g.strokeStyle = '#3A2414';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  for (const x of [-62, 62]) {
    g.moveTo(ox + x, oy);
    g.lineTo(ox + x, oy - 110);
  }
  g.stroke();
  g.strokeStyle = '#8A6440';
  g.lineWidth = 3.5;
  g.stroke();
  // le comptoir
  g.fillStyle = '#9A7A4E';
  g.strokeStyle = '#3A2414';
  g.lineWidth = 3;
  g.beginPath();
  g.rect(ox - 70, oy - 44, 140, 44);
  g.fill();
  g.stroke();
  g.fillStyle = '#B89262';
  g.beginPath();
  g.rect(ox - 74, oy - 52, 148, 10);
  g.fill();
  g.stroke();
  // ce qu'on vend
  const top = oy - 52;
  if (goods === 'ble' || goods === 'pain') {
    for (const x of [-46, -14, 18, 48]) {
      g.fillStyle = goods === 'ble' ? '#D8C08A' : '#C8883A';
      g.strokeStyle = goods === 'ble' ? '#7A5A2A' : '#6A3A14';
      g.lineWidth = 2;
      ell(g, ox + x, top - 12, 16, goods === 'ble' ? 16 : 9);
      g.fill();
      g.stroke();
      if (goods === 'ble') {
        g.strokeStyle = '#C9A040';
        g.beginPath();
        for (const dx of [-5, 0, 5]) { g.moveTo(ox + x + dx, top - 26); g.lineTo(ox + x + dx * 1.4, top - 38); }
        g.stroke();
      }
    }
  } else if (goods === 'jarres') {
    for (const [x, s] of [[-44, 1], [-14, 1.2], [18, 0.9], [46, 1.1]]) {
      g.fillStyle = '#B8643A';
      g.strokeStyle = '#5A2A14';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(ox + x - 7 * s, top - 30 * s);
      g.quadraticCurveTo(ox + x - 18 * s, top - 14 * s, ox + x - 9 * s, top);
      g.lineTo(ox + x + 9 * s, top);
      g.quadraticCurveTo(ox + x + 18 * s, top - 14 * s, ox + x + 7 * s, top - 30 * s);
      g.closePath();
      g.fill();
      g.stroke();
      g.strokeStyle = '#F2E2B0';
      g.beginPath();
      g.moveTo(ox + x - 12 * s, top - 14 * s);
      g.lineTo(ox + x + 12 * s, top - 14 * s);
      g.stroke();
    }
  } else if (goods === 'poissons') {
    for (let i = 0; i < 5; i++) {
      const x = ox - 50 + i * 25, y = top - 6 - (i % 2) * 6;
      g.fillStyle = '#9AB0C0';
      g.strokeStyle = '#3A4A5A';
      g.lineWidth = 1.5;
      ell(g, x, y, 13, 5);
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(x + 12, y);
      g.lineTo(x + 20, y - 5);
      g.lineTo(x + 20, y + 5);
      g.closePath();
      g.fill();
      g.stroke();
    }
  } else if (goods === 'fruits') {
    const cols = ['#E8443A', '#F28A3A', '#7AB83A', '#8A3A9A'];
    for (let i = 0; i < 12; i++) {
      g.fillStyle = cols[i % 4];
      g.strokeStyle = 'rgba(40, 20, 10, 0.5)';
      g.lineWidth = 1;
      ell(g, ox - 52 + (i % 6) * 21, top - 6 - Math.floor(i / 6) * 10, 8, 8);
      g.fill();
      g.stroke();
    }
  } else {
    // des rouleaux de tissu (ou des balles de laine)
    const cols = goods === 'laine' ? ['#F8F4EA', '#EDE6D6', '#F8F4EA'] : ['#C8302A', '#3A6AC8', '#E8C05A', '#6A8A3A'];
    for (let i = 0; i < 4; i++) {
      g.fillStyle = cols[i % cols.length];
      g.strokeStyle = 'rgba(40, 20, 10, 0.55)';
      g.lineWidth = 2;
      if (goods === 'laine') ell(g, ox - 44 + i * 30, top - 14, 15, 13);
      else rrect(g, ox - 58 + i * 30, top - 22, 26, 22, 8);
      g.fill();
      g.stroke();
    }
  }
  // l'auvent rayé
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#F8F0DC' : col;
    g.strokeStyle = 'rgba(40, 20, 10, 0.6)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(ox - 84 + i * 21, oy - 128);
    g.lineTo(ox - 63 + i * 21, oy - 128);
    g.lineTo(ox - 61 + i * 21, oy - 106);
    g.quadraticCurveTo(ox - 72 + i * 21, oy - 98, ox - 82 + i * 21, oy - 106);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.fillStyle = shade(col, 0.15);
  g.strokeStyle = 'rgba(40, 20, 10, 0.6)';
  g.beginPath();
  g.moveTo(ox - 84, oy - 128);
  g.lineTo(ox - 70, oy - 150);
  g.lineTo(ox + 70, oy - 150);
  g.lineTo(ox + 84, oy - 128);
  g.closePath();
  g.fill();
  g.stroke();
}
export function drawStall(ctx, s) {
  const goods = s.goods || GOODS[(s.v || 0) % GOODS.length];
  cached(ctx, `etal|${s.col}|${goods}`, s.x, s.y, 160, 92, 24, (g, ox, oy) => paintStall(g, ox, oy, s.col, goods));
}

/** Le puits, au milieu du marché */
export function drawWell(ctx, w, t) {
  cached(ctx, 'puits', w.x, w.y, 170, 80, 30, (g, ox, oy) => {
    groundShadow(g, ox, oy + 2, 66, 20, 0.3);
    const gr = g.createLinearGradient(ox - 55, 0, ox + 55, 0);
    gr.addColorStop(0, shade(STONE, 0.1));
    gr.addColorStop(1, shade(STONE, -0.25));
    g.fillStyle = gr;
    g.strokeStyle = INKS;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ox - 55, oy - 50);
    g.lineTo(ox - 55, oy);
    g.ellipse(ox, oy, 55, 18, 0, Math.PI, 0, true);
    g.lineTo(ox + 55, oy - 50);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#2A4A5A';
    ell(g, ox, oy - 50, 55, 18);
    g.fill();
    g.stroke();
    g.fillStyle = '#5AA8D0';
    ell(g, ox, oy - 48, 40, 11);
    g.fill();
    // le portique, la corde et le seau
    g.strokeStyle = '#3A2414';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(ox - 48, oy - 50);
    g.lineTo(ox - 48, oy - 150);
    g.moveTo(ox + 48, oy - 50);
    g.lineTo(ox + 48, oy - 150);
    g.moveTo(ox - 56, oy - 146);
    g.lineTo(ox + 56, oy - 146);
    g.stroke();
    g.strokeStyle = '#8A6440';
    g.lineWidth = 4;
    g.stroke();
    g.strokeStyle = '#C9A860';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(ox + 6, oy - 146);
    g.lineTo(ox + 6, oy - 96);
    g.stroke();
    g.fillStyle = '#7A5434';
    g.strokeStyle = '#2A1A0C';
    g.beginPath();
    g.rect(ox - 6, oy - 96, 24, 22);
    g.fill();
    g.stroke();
  });
}

/** Le grand grenier de pierre (un silo rond, au toit de chaume pointu) */
export function drawSilo(ctx, s, thatch) {
  cached(ctx, `silo|${thatch}`, s.x, s.y, 300, 110, 30, (g, ox, oy) => {
    const R = 80, H = 150;
    groundShadow(g, ox + 8, oy + 2, R * 1.15, R * 0.36, 0.3);
    const gr = g.createLinearGradient(ox - R, 0, ox + R, 0);
    gr.addColorStop(0, shade(STONE, 0.12));
    gr.addColorStop(1, shade(STONE, -0.28));
    g.fillStyle = gr;
    g.strokeStyle = INKS;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ox - R, oy - H);
    g.lineTo(ox - R, oy);
    g.ellipse(ox, oy, R, R * 0.33, 0, Math.PI, 0, true);
    g.lineTo(ox + R, oy - H);
    g.closePath();
    g.fill();
    g.stroke();
    g.strokeStyle = 'rgba(70, 58, 40, 0.45)';
    g.lineWidth = 1.5;
    g.beginPath();
    for (let yy = oy - 20; yy > oy - H; yy -= 20) {
      g.moveTo(ox - R + 2, yy);
      g.ellipse(ox, yy, R - 2, R * 0.3, 0, Math.PI, 0, true);
    }
    g.stroke();
    g.fillStyle = '#5A3A22';
    rrect(g, ox - 14, oy - 50, 28, 44, 6);
    g.fill();
    const roof = thatch || '#D2B060';
    g.fillStyle = roof;
    g.strokeStyle = shade(roof, -0.55);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ox - R - 14, oy - H + 8);
    g.lineTo(ox, oy - H - 120);
    g.lineTo(ox + R + 14, oy - H + 8);
    g.quadraticCurveTo(ox, oy - H + 30, ox - R - 14, oy - H + 8);
    g.closePath();
    g.fill();
    g.stroke();
    g.strokeStyle = 'rgba(110, 80, 30, 0.35)';
    g.lineWidth = 2;
    g.beginPath();
    for (let i = -5; i <= 5; i++) {
      g.moveTo(ox + i * 2, oy - H - 112);
      g.lineTo(ox + i * 17, oy - H + 14);
    }
    g.stroke();
  });
}

/** Une école : une maison de pierre, son enseigne (une tablette), un banc devant */
export function drawSchool(ctx, s, thatch) {
  cached(ctx, `ecole|${thatch}`, s.x, s.y, 260, 170, 40, (g, ox, oy) => {
    paintHouse(g, ox, oy, 7, thatch);
    // l'enseigne : une grande tablette d'argile au-dessus de la porte
    g.save();
    g.translate(ox + 62, oy - 128);
    EXTRA_ICONS.tablette(g, 20);
    g.restore();
    // le banc des élèves, et la jarre d'argile fraîche
    g.fillStyle = '#8A6440';
    g.strokeStyle = '#3A2414';
    g.lineWidth = 2.5;
    g.beginPath();
    g.rect(ox - 140, oy + 6, 110, 10);
    g.fill();
    g.stroke();
    for (const x of [-132, -40]) {
      g.beginPath();
      g.rect(ox + x, oy + 14, 8, 16);
      g.fill();
      g.stroke();
    }
  });
}

/* ============================================================================
   AUTOUR DE LA VILLE
   ============================================================================ */
/** La carrière, vue de trois quarts : un plateau de roche, et un grand trou creusé en deux gradins.
    On voit les falaises du fond (striées, avec les entailles des blocs déjà sortis), les gravats,
    un bloc à moitié découpé, une échelle, des coins de bois. */
function paintQuarry(g, cx, cy, R) {
  const r = seeded(31);
  const N = 44;
  const J = Array.from({ length: N }, () => 0.88 + r() * 0.2);
  const P = (i, kx, ky, dy = 0) => {
    const a = (i / N) * TAU, j = J[((i % N) + N) % N];
    return { x: cx + Math.cos(a) * R * kx * j, y: cy + Math.sin(a) * R * ky * j + dy };
  };
  const ring = (kx, ky, dy) => Array.from({ length: N }, (_, i) => P(i, kx, ky, dy));
  const poly = (pts) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
  };
  // 1. la poussière et les gravats tout autour
  poly(ring(1.14, 0.8, 0));
  g.fillStyle = '#CDC2A8';
  g.fill();
  for (let i = 0; i < 90; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const x = cx + Math.cos(a) * R * 1.08 * d, y = cy + Math.sin(a) * R * 0.76 * d;
    g.fillStyle = ['#B4A890', '#E2D8C0', '#A49880'][i % 3];
    g.beginPath();
    g.moveTo(x - 3 - r() * 4, y);
    g.lineTo(x, y - 3 - r() * 3);
    g.lineTo(x + 3 + r() * 4, y + 1);
    g.closePath();
    g.fill();
  }
  // 2. le plateau de roche, avec ses fissures
  const plateau = ring(0.98, 0.69, 0);
  poly(plateau);
  g.fillStyle = '#BFB49A';
  g.fill();
  g.strokeStyle = 'rgba(90, 76, 52, 0.55)';
  g.lineWidth = 3;
  g.stroke();
  g.strokeStyle = 'rgba(90, 76, 52, 0.35)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) {
    const p = P(Math.floor(r() * N), 0.9, 0.62);
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.x + (r() - 0.5) * 50, p.y + (r() - 0.5) * 24);
    g.lineTo(p.x + (r() - 0.5) * 80, p.y + (r() - 0.5) * 40);
    g.stroke();
  }
  /** Un gradin : le trou (top = son bord), son fond (bot), et la falaise du fond, striée */
  const step = (top, bot, cols, seed) => {
    const rr = seeded(seed);
    poly(top);
    g.fillStyle = '#6E6450';
    g.fill();
    poly(bot);
    g.fillStyle = cols.floor;
    g.fill();
    // la falaise : la moitié du fond du trou (on la voit, elle est tournée vers nous)
    const ids = [];
    for (let i = Math.floor(N * 0.46); i <= Math.ceil(N * 1.04); i++) ids.push(i % N);
    g.save();
    g.beginPath();
    ids.forEach((i, k) => (k ? g.lineTo(top[i].x, top[i].y) : g.moveTo(top[i].x, top[i].y)));
    for (let k = ids.length - 1; k >= 0; k--) g.lineTo(bot[ids[k]].x, bot[ids[k]].y);
    g.closePath();
    const yTop = Math.min(...ids.map((i) => top[i].y)), yBot = Math.max(...ids.map((i) => bot[i].y));
    const gr = g.createLinearGradient(0, yTop, 0, yBot);
    gr.addColorStop(0, cols.cliffTop);
    gr.addColorStop(1, cols.cliffBot);
    g.fillStyle = gr;
    g.fill();
    g.clip();
    // les couches de roche (les strates)
    for (let s = 1; s < 4; s++) {
      g.strokeStyle = s % 2 ? 'rgba(110, 92, 62, 0.45)' : 'rgba(255, 248, 228, 0.35)';
      g.lineWidth = s % 2 ? 2.5 : 2;
      g.beginPath();
      ids.forEach((i, k) => {
        const x = lerp(top[i].x, bot[i].x, s / 4), y = lerp(top[i].y, bot[i].y, s / 4) + Math.sin(i * 1.7 + s) * 2;
        if (k) g.lineTo(x, y); else g.moveTo(x, y);
      });
      g.stroke();
    }
    // les entailles des blocs déjà sortis : de grandes marches carrées, plus sombres
    for (let k = 1; k < ids.length - 2; k += 3) {
      const a = top[ids[k]], b = bot[ids[k]], c = top[ids[k + 1]];
      if (rr() < 0.45) {
        g.fillStyle = 'rgba(70, 58, 40, 0.28)';
        g.beginPath();
        g.moveTo(a.x, lerp(a.y, b.y, 0.15));
        g.lineTo(c.x, lerp(c.y, bot[ids[k + 1]].y, 0.15));
        g.lineTo(c.x, lerp(c.y, bot[ids[k + 1]].y, 0.6));
        g.lineTo(a.x, lerp(a.y, b.y, 0.6));
        g.closePath();
        g.fill();
      }
      // les traces du ciseau, bien droites
      g.strokeStyle = 'rgba(80, 66, 44, 0.35)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(a.x, a.y + 3);
      g.lineTo(b.x, b.y - 2);
      g.stroke();
    }
    g.restore();
    // le bord : une lèvre claire en haut, une ligne sombre en bas
    g.strokeStyle = 'rgba(255, 250, 232, 0.65)';
    g.lineWidth = 2.5;
    g.beginPath();
    ids.forEach((i, k) => (k ? g.lineTo(top[i].x, top[i].y) : g.moveTo(top[i].x, top[i].y)));
    g.stroke();
    g.strokeStyle = 'rgba(60, 48, 30, 0.6)';
    g.lineWidth = 2;
    poly(top);
    g.stroke();
    g.beginPath();
    ids.forEach((i, k) => (k ? g.lineTo(bot[i].x, bot[i].y) : g.moveTo(bot[i].x, bot[i].y)));
    g.stroke();
  };
  step(ring(0.8, 0.53, 0), ring(0.77, 0.5, 58), { floor: '#AEA289', cliffTop: '#CFC4AA', cliffBot: '#958970' }, 3);
  step(ring(0.5, 0.33, 58), ring(0.47, 0.3, 104), { floor: '#9E9279', cliffTop: '#BFB49A', cliffBot: '#857A62' }, 9);
  // 3. au fond : un bloc à moitié découpé (ses rainures), des éclats de pierre
  const bx = cx - R * 0.12, by = cy + 104 + R * 0.1;
  g.fillStyle = '#B2A68C';
  g.strokeStyle = 'rgba(60, 48, 30, 0.7)';
  g.lineWidth = 2;
  rrect(g, bx - 46, by - 26, 92, 40, 4);
  g.fill();
  g.stroke();
  g.strokeStyle = '#4A3E2A';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(bx - 46, by - 26);
  g.lineTo(bx + 46, by - 26);
  g.moveTo(bx + 46, by - 26);
  g.lineTo(bx + 46, by + 14);
  g.stroke();
  // les coins de bois, plantés dans la rainure (on les mouille : ils gonflent, et la pierre se fend)
  for (const dx of [-30, -6, 18, 40]) {
    g.fillStyle = '#8A6440';
    g.strokeStyle = '#3A2414';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(bx + dx - 4, by - 26);
    g.lineTo(bx + dx + 4, by - 26);
    g.lineTo(bx + dx + 2, by - 38);
    g.lineTo(bx + dx - 2, by - 38);
    g.closePath();
    g.fill();
    g.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const x = cx + Math.cos(a) * R * 0.42 * d, y = cy + 104 + Math.sin(a) * R * 0.26 * d;
    g.fillStyle = ['#D4C8AE', '#A89C82', '#C2B69C'][i % 3];
    g.strokeStyle = 'rgba(60, 48, 30, 0.45)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - 4 - r() * 5, y + 2);
    g.lineTo(x - 1, y - 3 - r() * 4);
    g.lineTo(x + 4 + r() * 5, y + 1);
    g.closePath();
    g.fill();
    g.stroke();
  }
  // 4. une échelle de bois, contre la falaise du premier gradin
  const lx = cx + R * 0.32, ly = cy - R * 0.26;
  g.strokeStyle = '#5A3A22';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  for (const dx of [0, 18]) {
    g.moveTo(lx + dx, ly - 8);
    g.lineTo(lx + dx + 6, ly + 66);
  }
  for (let k = 0; k < 6; k++) {
    const yy = ly + k * 12;
    g.moveTo(lx + k * 0.5, yy);
    g.lineTo(lx + 18 + k * 0.5, yy);
  }
  g.stroke();
}
export function drawQuarryGround(ctx, q) {
  cached(ctx, `carriere|${Math.round(q.r)}`, q.x, q.y, q.r * 0.88, q.r * 1.27, q.r * 0.9, (g, ox, oy) => paintQuarry(g, ox, oy, q.r));
}

/** Un bloc de pierre taillée vu de trois quarts ((x, y) = le milieu du bas de sa face) : sa face
    avec les traces du ciseau, son dessus éclairé, un coin ébréché */
function cutBlock(g, x, y, w, h, d, col, seed) {
  const r = seeded(seed);
  const x0 = x - w / 2;
  // le dessus
  g.fillStyle = shade(col, 0.16);
  g.fillRect(x0, y - h - d, w, d);
  g.fillStyle = 'rgba(255, 255, 245, 0.35)';
  g.fillRect(x0 + 2, y - h - d + 1, w - 4, Math.max(1.5, d * 0.2));
  // la face
  const gr = g.createLinearGradient(0, y - h, 0, y);
  gr.addColorStop(0, col);
  gr.addColorStop(1, shade(col, -0.16));
  g.fillStyle = gr;
  g.fillRect(x0, y - h, w, h);
  if (w > 26) {
    // les traces du ciseau : de petits coups obliques, en rangs
    g.strokeStyle = 'rgba(80, 64, 40, 0.28)';
    g.lineWidth = 1;
    g.beginPath();
    for (let yy = y - h + 6; yy < y - 3; yy += 6) {
      for (let xx = x0 + 4 + r() * 4; xx < x0 + w - 5; xx += 7 + r() * 3) {
        g.moveTo(xx, yy + 3);
        g.lineTo(xx + 3, yy - 1);
      }
    }
    g.stroke();
    // un coin ébréché
    const left = r() < 0.5;
    g.fillStyle = shade(col, -0.3);
    g.beginPath();
    const cxx = left ? x0 : x0 + w;
    g.moveTo(cxx, y - h - d + 2);
    g.lineTo(cxx + (left ? 9 : -9), y - h - d + 2);
    g.lineTo(cxx, y - h + 8);
    g.closePath();
    g.fill();
  }
  // la lumière sur l'arête, puis le contour
  g.strokeStyle = 'rgba(255, 252, 236, 0.6)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x0 + 2, y - h + 1);
  g.lineTo(x0 + w - 2, y - h + 1);
  g.moveTo(x0 + 1.5, y - h + 2);
  g.lineTo(x0 + 1.5, y - 2);
  g.stroke();
  g.strokeStyle = '#4A4030';
  g.lineWidth = 2;
  g.strokeRect(x0, y - h - d, w, h + d);
  g.beginPath();
  g.moveTo(x0, y - h);
  g.lineTo(x0 + w, y - h);
  g.stroke();
}

/** Un tas de pierres taillées, sur son traîneau de bois (n = combien de blocs il reste, sur 6) */
const PILE = [[-0.62, 0], [0, 0], [0.62, 0], [-0.31, 1], [0.31, 1], [0, 2]];
function paintPile(g, ox, oy, R, n, seed) {
  const r = seeded(seed + 1);
  // la poussière de pierre, et quelques éclats
  g.fillStyle = 'rgba(236, 228, 208, 0.75)';
  ell(g, ox, oy + 4, R * 1.25, R * 0.38);
  g.fill();
  groundShadow(g, ox + 6, oy + 2, R * 1.05, R * 0.26, 0.28);
  for (let i = 0; i < 10; i++) {
    const x = ox + (r() - 0.5) * R * 2.3, y = oy + 4 + (r() - 0.5) * R * 0.5;
    g.fillStyle = r() < 0.5 ? '#C8BCA2' : '#A89C82';
    g.beginPath();
    g.moveTo(x - 4, y + 2);
    g.lineTo(x, y - 3);
    g.lineTo(x + 4, y + 2);
    g.closePath();
    g.fill();
  }
  // le traîneau : deux patins recourbés, et des planches
  const sw = R * 1.95, sx = ox - sw / 2;
  g.strokeStyle = '#3A2414';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  for (const dy of [-2, 8]) {
    g.moveTo(sx - 8, oy + dy - 12);
    g.quadraticCurveTo(sx - 6, oy + dy, sx + 10, oy + dy);
    g.lineTo(sx + sw, oy + dy);
  }
  g.stroke();
  g.strokeStyle = '#8A6440';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = '#9A7448';
  g.strokeStyle = '#3A2414';
  g.lineWidth = 2;
  g.beginPath();
  g.rect(sx, oy - 10, sw, 10);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(50, 30, 14, 0.5)';
  g.lineWidth = 1.5;
  g.beginPath();
  for (let xx = sx + 18; xx < sx + sw; xx += 18) {
    g.moveTo(xx, oy - 10);
    g.lineTo(xx, oy);
  }
  g.stroke();
  // les blocs, du bas vers le haut
  const w = R * 0.6, h = R * 0.36, d = R * 0.22;
  for (let i = 0; i < n; i++) {
    const [fx, row] = PILE[i];
    cutBlock(g, ox + fx * R, oy - 10 - row * (h + d * 0.5), w, h, d, STONES[(seed + i * 3) % STONES.length], seed * 7 + i);
  }
  if (!n) {
    // (plus rien) le maillet et le ciseau, posés sur le traîneau
    g.strokeStyle = '#5A3A22';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(ox - 22, oy - 14);
    g.lineTo(ox + 6, oy - 20);
    g.stroke();
    g.fillStyle = '#7A5434';
    g.strokeStyle = '#2A1A0C';
    g.lineWidth = 1.5;
    rrect(g, ox + 2, oy - 30, 18, 14, 3);
    g.fill();
    g.stroke();
    g.strokeStyle = '#9A968C';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ox + 18, oy - 13);
    g.lineTo(ox + 38, oy - 18);
    g.stroke();
  }
}
export function drawStonePile(ctx, d, t) {
  const amount = Math.max(0, d.amount ?? 4), max = d.max || 4;
  const n = Math.ceil((amount / max) * PILE.length);
  const R = Math.round(d.r), v = (d.seed || 0) % 3;
  cached(ctx, `tas|${R}|${n}|${v}`, d.x, d.y, R * 1.7, R * 1.35, R * 0.55, (g, ox, oy) => paintPile(g, ox, oy, R, n, v));
  if (amount > 0) {
    // un petit éclat de lumière : on peut les prendre
    const k = 0.5 + Math.sin(t * 3 + (d.seed || 0)) * 0.5;
    const x = d.x - R * 0.35, y = d.y - R * 0.9;
    ctx.fillStyle = `rgba(255, 255, 240, ${0.25 + k * 0.6})`;
    ctx.beginPath();
    ctx.moveTo(x, y - 7 * k - 2);
    ctx.lineTo(x + 2, y);
    ctx.lineTo(x, y + 7 * k + 2);
    ctx.lineTo(x - 2, y);
    ctx.closePath();
    ctx.moveTo(x - 7 * k - 2, y);
    ctx.lineTo(x, y + 2);
    ctx.lineTo(x + 7 * k + 2, y);
    ctx.lineTo(x, y - 2);
    ctx.closePath();
    ctx.fill();
  }
}

/** Des balles de laine, près du parc à moutons */
export function drawWoolBales(ctx, d, t) {
  const n = Math.max(0, d.amount ?? 2);
  groundShadow(ctx, d.x, d.y, d.r * 0.9, d.r * 0.28);
  for (let i = 0; i < Math.max(0, n) + (n ? 1 : 0); i++) {
    const x = d.x + (i - 1) * d.r * 0.55, y = d.y - (i === 2 ? d.r * 0.5 : 0);
    ctx.fillStyle = '#F8F4EA';
    ctx.strokeStyle = '#8A7A62';
    ctx.lineWidth = 2.5;
    for (const [dx, dy, r] of [[-0.25, -0.35, 0.3], [0.22, -0.4, 0.3], [0, -0.62, 0.32]]) {
      ell(ctx, x + dx * d.r, y + dy * d.r, r * d.r, r * d.r * 0.85);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (!n) {
    ctx.fillStyle = 'rgba(248, 244, 234, 0.6)';
    ell(ctx, d.x, d.y - 4, d.r * 0.5, d.r * 0.15);
    ctx.fill();
  }
}

/** Le pont de pierre (au sol : on marche dessus). Du fond vers le devant : le parapet du nord, le
    tablier pavé, le parapet du sud ; puis la grande face de pierre qui descend jusqu'à l'eau, percée
    d'arches (leurs voussoirs, leur ombre, l'eau qui brille de l'autre côté), les piles et leurs
    éperons, les culées qui s'appuient sur les berges, et le reflet dans l'eau. */
const BRIDGE_FACE = 104;
function bridgeArches(x0, x1) {
  const wx0 = x0 + 80, wx1 = x1 - 80;              // (le pont dépasse de 80 sur chaque berge)
  const n = Math.max(2, Math.round((wx1 - wx0) / 150)), step = (wx1 - wx0) / n;
  return { wx0, wx1, n, step, span: step * 0.72 };
}
function paintBridge(g, x0, x1, y, hw) {
  const { wx0, wx1, n, step, span } = bridgeArches(x0, x1);
  const top = y + hw, bottom = top + BRIDGE_FACE;
  const spring = top + 56, ry = 34, rx = span / 2;
  // le reflet du pont dans l'eau
  const rg = g.createLinearGradient(0, bottom, 0, bottom + 50);
  rg.addColorStop(0, 'rgba(40, 52, 60, 0.4)');
  rg.addColorStop(1, 'rgba(40, 52, 60, 0)');
  g.fillStyle = rg;
  g.fillRect(wx0, bottom, wx1 - wx0, 50);
  // ---- le tablier ----
  // le parapet du nord : son dessus, sa face (tournée vers nous)
  masonry(g, x0, y - hw - 22, x1 - x0, 22, { row: 11, wide: 1.6, seed: 41 });
  masonry(g, x0, y - hw - 30, x1 - x0, 8, { row: 8, wide: 3.5, cols: FLAGS, seed: 43, shadeDown: false });
  // les pavés, et leurs bordures
  g.fillStyle = cobblePattern(g);
  g.fillRect(x0, y - hw, x1 - x0, hw * 2 - 22);
  g.fillStyle = 'rgba(40, 30, 15, 0.25)';
  g.fillRect(x0, y - hw, x1 - x0, 8);
  g.fillStyle = '#B9AA88';
  g.fillRect(x0, y + hw - 30, x1 - x0, 8);
  // ---- la grande face du sud (avec son parapet en haut) ----
  const face = () => {
    g.beginPath();
    g.moveTo(x0, top - 22);
    g.lineTo(x1, top - 22);
    g.lineTo(x1, top + 22);
    g.lineTo(wx1 + 10, bottom);
    g.lineTo(wx0 - 10, bottom);
    g.lineTo(x0, top + 22);
    g.closePath();
  };
  const holes = () => {
    for (let i = 0; i < n; i++) {
      const ax = wx0 + (i + 0.5) * step;
      g.moveTo(ax + rx, bottom + 2);
      g.lineTo(ax + rx, spring);
      g.ellipse(ax, spring, rx, ry, 0, 0, Math.PI, true);
      g.lineTo(ax - rx, bottom + 2);
      g.closePath();
    }
  };
  g.save();
  face();
  holes();
  g.clip('evenodd');
  masonry(g, x0, top - 22, x1 - x0, BRIDGE_FACE + 24, { row: 20, seed: 47 });
  // la ligne d'eau : la pierre mouillée, verte d'algues
  const wg = g.createLinearGradient(0, bottom - 22, 0, bottom);
  wg.addColorStop(0, 'rgba(60, 90, 50, 0)');
  wg.addColorStop(1, 'rgba(50, 80, 46, 0.55)');
  g.fillStyle = wg;
  g.fillRect(x0, bottom - 22, x1 - x0, 22);
  g.restore();
  // ---- les arches : l'ombre sous le pont, l'eau qui brille de l'autre côté ----
  for (let i = 0; i < n; i++) {
    const ax = wx0 + (i + 0.5) * step;
    g.save();
    g.beginPath();
    g.moveTo(ax + rx, bottom + 2);
    g.lineTo(ax + rx, spring);
    g.ellipse(ax, spring, rx, ry, 0, 0, Math.PI, true);
    g.lineTo(ax - rx, bottom + 2);
    g.closePath();
    g.clip();
    const ag = g.createLinearGradient(0, spring - ry, 0, bottom);
    ag.addColorStop(0, '#1A262C');
    ag.addColorStop(0.55, '#24414E');
    ag.addColorStop(1, '#3A7298');
    g.fillStyle = ag;
    g.fillRect(ax - rx, spring - ry, span, bottom - spring + ry + 4);
    g.fillStyle = 'rgba(160, 210, 235, 0.35)';
    ell(g, ax, bottom - 6, rx * 0.7, 10);
    g.fill();
    g.strokeStyle = 'rgba(220, 240, 255, 0.4)';
    g.lineWidth = 2;
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      const yy = bottom - 18 + k * 7, ww = rx * (0.3 + k * 0.15);
      g.moveTo(ax - ww, yy);
      g.lineTo(ax + ww * 0.6, yy);
    }
    g.stroke();
    g.restore();
    // les voussoirs, et les pierres d'angle des montants
    voussoirs(g, ax, spring, rx, ry, 15, 9, 53 + i, '#E2D7BE');
    for (const s of [-1, 1]) {
      for (let yy = spring; yy < bottom - 8; yy += 16) {
        const wq = (Math.round((yy - spring) / 16) % 2) ? 10 : 16;
        g.fillStyle = shade(STONES[(i + Math.round(yy)) % STONES.length], 0.06);
        g.strokeStyle = 'rgba(58, 46, 30, 0.6)';
        g.lineWidth = 1;
        const qx = s < 0 ? ax - rx - wq : ax + rx;
        g.fillRect(qx, yy + 1, wq, 14);
        g.strokeRect(qx, yy + 1, wq, 14);
      }
    }
  }
  // ---- les piles : un éperon arrondi au pied, contre le courant ----
  for (let i = 1; i < n; i++) {
    const px = wx0 + i * step, pw = (step - span) * 0.9;
    const eg = g.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
    eg.addColorStop(0, '#DCD0B4');
    eg.addColorStop(0.5, '#C8BA9C');
    eg.addColorStop(1, '#94876C');
    g.fillStyle = eg;
    g.strokeStyle = INKS;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(px - pw / 2, bottom + 4);
    g.lineTo(px - pw / 2, bottom - 30);
    g.ellipse(px, bottom - 30, pw / 2, pw * 0.4, 0, Math.PI, 0, false);
    g.lineTo(px + pw / 2, bottom + 4);
    g.closePath();
    g.fill();
    g.stroke();
    g.strokeStyle = 'rgba(58, 46, 30, 0.4)';
    g.lineWidth = 1;
    g.beginPath();
    for (let yy = bottom - 16; yy > bottom - 34; yy -= 12) {
      g.moveTo(px - pw / 2 + 2, yy);
      g.lineTo(px + pw / 2 - 2, yy);
    }
    g.stroke();
  }
  // ---- le cordon (sous le parapet), le dessus du parapet, les quatre bornes des bouts ----
  g.fillStyle = 'rgba(30, 22, 10, 0.3)';
  g.fillRect(x0, top + 6, x1 - x0, 6);
  masonry(g, x0, top - 3, x1 - x0, 9, { row: 9, wide: 3, cols: FLAGS, seed: 59, shadeDown: false });
  masonry(g, x0, top - 30, x1 - x0, 8, { row: 8, wide: 3.5, cols: FLAGS, seed: 61, shadeDown: false });
  g.strokeStyle = INKS;
  g.lineWidth = 2.5;
  face();
  g.stroke();
  g.beginPath();
  g.moveTo(x0, y - hw - 30);
  g.lineTo(x1, y - hw - 30);
  g.moveTo(x0, y - hw);
  g.lineTo(x1, y - hw);
  g.stroke();
  for (const bx of [x0 + 2, x1 - 30]) {
    for (const by of [y - hw, top]) {
      masonry(g, bx, by - 48, 28, 40, { row: 13, wide: 1, seed: bx + by });
      g.fillStyle = '#E8DEC6';
      g.fillRect(bx - 3, by - 58, 34, 10);
      g.strokeStyle = INKS;
      g.lineWidth = 2;
      g.strokeRect(bx, by - 48, 28, 40);
      g.strokeRect(bx - 3, by - 58, 34, 10);
      // une petite boule de pierre, tout en haut
      g.fillStyle = '#DCD0B4';
      ell(g, bx + 14, by - 64, 8, 7);
      g.fill();
      g.stroke();
    }
  }
}
export function drawBridge(ctx, b, t) {
  const L = b.x1 - b.x0, hw = b.hw || 70;
  cached(ctx, `pont|${Math.round(L)}|${hw}`, (b.x0 + b.x1) / 2, b.y, hw + 80, L / 2 + 40, hw + BRIDGE_FACE + 60,
    (g, ox, oy) => paintBridge(g, ox - L / 2, ox + L / 2, oy, hw));
  // l'eau qui bouillonne au pied des piles (elle bouge)
  const { wx0, n, step } = bridgeArches(b.x0, b.x1);
  const bottom = b.y + hw + BRIDGE_FACE;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 1; i < n; i++) {
    const px = wx0 + i * step;
    for (let k = 0; k < 2; k++) {
      const u = (t * 0.8 + k * 0.5 + i * 0.3) % 1;
      const rr = 18 + u * 26, yy = bottom + 6 + u * 14;
      ctx.moveTo(px - rr, yy);
      ctx.quadraticCurveTo(px, yy + 8 * (1 - u), px + rr, yy);
    }
  }
  ctx.stroke();
}

/** Un morceau de route pavée (de (ax, ay) à (bx, by)) ; pass : 'bord' (le bord de terre) ou 'paves' */
export function drawRoad(ctx, r, pass = 'paves') {
  const w = r.w || 120;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r.ax, r.ay);
  ctx.lineTo(r.bx, r.by);
  if (pass === 'bord') {
    ctx.strokeStyle = 'rgb(122, 104, 70)';
    ctx.lineWidth = w + 16;
  } else {
    ctx.strokeStyle = cobblePattern(ctx);
    ctx.lineWidth = w;
  }
  ctx.stroke();
}
/** Un morceau de route encore à paver (en pointillés) */
export function drawRoadPlan(ctx, r, t, near) {
  ctx.save();
  ctx.setLineDash([18, 14]);
  ctx.lineDashOffset = -t * 20;
  ctx.lineCap = 'round';
  ctx.strokeStyle = near ? 'rgba(255, 230, 120, 0.95)' : 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 6;
  for (const s of [-1, 1]) {
    const nx = -(r.by - r.ay), ny = r.bx - r.ax, d = Math.hypot(nx, ny) || 1;
    const ox = nx / d * s * 55, oy = ny / d * s * 55;
    ctx.beginPath();
    ctx.moveTo(r.ax + ox, r.ay + oy);
    ctx.lineTo(r.bx + ox, r.by + oy);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = near ? 'rgba(255, 230, 120, 0.15)' : 'rgba(255, 255, 255, 0.06)';
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 110;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(r.ax, r.ay);
  ctx.lineTo(r.bx, r.by);
  ctx.stroke();
}

/** Le port (au sol) : le quai de pierre et le ponton de bois qui avance sur le fleuve */
export function drawPortGround(ctx, p) {
  // le quai
  ctx.fillStyle = STONE;
  ctx.strokeStyle = INKS;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(p.x - 10, p.y - 150, 190, 300);
  ctx.fill();
  ctx.stroke();
  // le ponton
  ctx.fillStyle = '#9A7448';
  ctx.beginPath();
  ctx.rect(p.dock - 30, p.y - 60, p.x - p.dock + 40, 120);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(50, 30, 14, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = p.dock - 10; x < p.x + 20; x += 22) {
    ctx.moveTo(x, p.y - 58);
    ctx.lineTo(x, p.y + 58);
  }
  ctx.stroke();
  // les pieux dans l'eau
  ctx.fillStyle = '#5A3A22';
  for (const x of [p.dock - 26, p.dock + 40]) for (const yy of [p.y - 62, p.y + 62]) {
    ctx.beginPath();
    ctx.rect(x - 6, yy - 4, 12, 22);
    ctx.fill();
  }
}
/** La grue du port (debout) : trois perches, une corde, un bloc qui se balance */
export function drawCrane(ctx, c, t) {
  const { x, y } = c;
  groundShadow(ctx, x, y, 60, 18, 0.25);
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 40, y);
  ctx.lineTo(x, y - 230);
  ctx.moveTo(x + 40, y);
  ctx.lineTo(x, y - 230);
  ctx.moveTo(x, y - 228);
  ctx.lineTo(x - 150, y - 260);
  ctx.stroke();
  ctx.strokeStyle = '#8A6440';
  ctx.lineWidth = 6;
  ctx.stroke();
  const sw = Math.sin(t * 1.3) * 8;
  ctx.strokeStyle = '#C9A860';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 146, y - 258);
  ctx.lineTo(x - 146 + sw, y - 150);
  ctx.stroke();
  ctx.fillStyle = '#C8BCA4';
  ctx.strokeStyle = '#4A4236';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(x - 166 + sw, y - 150, 40, 30);
  ctx.fill();
  ctx.stroke();
  // la roue du treuil
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y - 60, 30, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = t * 0.6 + i * Math.PI / 4;
    ctx.moveTo(x + Math.cos(a) * 30, y - 60 + Math.sin(a) * 30);
    ctx.lineTo(x - Math.cos(a) * 30, y - 60 - Math.sin(a) * 30);
  }
  ctx.stroke();
}

/** Un bateau à voile qui remonte le fleuve (vu de l'arrière : la voile bien en face), chargé de pierres */
export function drawBoat(ctx, b, t) {
  const { x, y } = b;
  const bob = Math.sin(t * 2 + (b.seed || 0)) * 3;
  // le sillage
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const s of [-1, 1]) {
    ctx.moveTo(x + s * 40, y + 30);
    ctx.quadraticCurveTo(x + s * 60, y + 90, x + s * 90, y + 150);
  }
  ctx.stroke();
  ctx.save();
  ctx.translate(0, bob);
  // la coque : le dessus (vu d'en haut), et l'arrière
  ctx.fillStyle = '#8A5A30';
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 260);
  ctx.quadraticCurveTo(x + 70, y - 150, x + 58, y - 30);
  ctx.lineTo(x - 58, y - 30);
  ctx.quadraticCurveTo(x - 70, y - 150, x, y - 260);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#B88A56';
  ctx.beginPath();
  ctx.moveTo(x, y - 240);
  ctx.quadraticCurveTo(x + 56, y - 150, x + 46, y - 40);
  ctx.lineTo(x - 46, y - 40);
  ctx.quadraticCurveTo(x - 56, y - 150, x, y - 240);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7A4A24';
  ctx.beginPath();
  ctx.moveTo(x - 58, y - 30);
  ctx.lineTo(x + 58, y - 30);
  ctx.lineTo(x + 44, y + 6);
  ctx.lineTo(x - 44, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // l'œil peint sur l'arrière (comme sur les bateaux de l'Antiquité)
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#F2EEE4';
    ell(ctx, x + s * 26, y - 14, 8, 5);
    ctx.fill();
    ctx.fillStyle = '#1E1612';
    ell(ctx, x + s * 26, y - 14, 3.5, 3.5);
    ctx.fill();
  }
  // les blocs de pierre (s'il est chargé)
  if (b.load) {
    for (const [dx, dy] of [[-22, -90], [18, -96], [-4, -130], [-20, -170], [20, -168], [0, -60]]) {
      ctx.fillStyle = '#C8BCA4';
      ctx.strokeStyle = '#4A4236';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x + dx - 16, y + dy - 14, 32, 22);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#E2D8C2';
      ctx.fillRect(x + dx - 16, y + dy - 20, 32, 6);
    }
  }
  // le mât et la voile
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, y - 150);
  ctx.lineTo(x, y - 420);
  ctx.moveTo(x - 92, y - 400);
  ctx.lineTo(x + 92, y - 400);
  ctx.stroke();
  const puff = 10 + Math.sin(t * 1.7 + (b.seed || 0)) * 4;
  ctx.fillStyle = '#F8F0DC';
  ctx.strokeStyle = '#6A5A40';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 88, y - 398);
  ctx.quadraticCurveTo(x, y - 398 + puff * 0.5, x + 88, y - 398);
  ctx.lineTo(x + 80, y - 240);
  ctx.quadraticCurveTo(x, y - 240 + puff, x - 80, y - 240);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = b.col || '#C8302A';
  ctx.beginPath();
  ctx.moveTo(x - 86, y - 350);
  ctx.quadraticCurveTo(x, y - 348 + puff * 0.6, x + 86, y - 350);
  ctx.lineTo(x + 84, y - 322);
  ctx.quadraticCurveTo(x, y - 320 + puff * 0.7, x - 84, y - 322);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Une charrette tirée par un bœuf (draw(look, color, x, y, size, o) dessine le bœuf et le marchand) */
export function drawCart(ctx, c, t, draw) {
  const f = c.face || 1;
  const { x, y } = c;
  // le bœuf, devant
  draw('th-boeuf', '#8A6440', x + f * 110, y, 56, { angle: f > 0 ? 0 : Math.PI, speed: c.moving ? 0.5 : 0, walk: c.walk || 0 });
  // le timon
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + f * 30, y - 44);
  ctx.lineTo(x + f * 90, y - 50);
  ctx.stroke();
  groundShadow(ctx, x, y + 2, 70, 16, 0.25);
  // la caisse, et ce qu'elle transporte
  ctx.fillStyle = '#A8804E';
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(x - 64, y - 82, 100, 40);
  ctx.fill();
  ctx.stroke();
  const goods = c.goods || 'jarres';
  if (goods === 'poissons') {
    ctx.fillStyle = '#9AB0C0';
    for (let i = 0; i < 4; i++) { ell(ctx, x - 44 + i * 22, y - 88, 12, 6); ctx.fill(); ctx.stroke(); }
  } else if (goods === 'tissus') {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ['#C8302A', '#E8C05A', '#3A6AC8'][i];
      rrect(ctx, x - 56 + i * 30, y - 104, 26, 24, 7);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#B8643A';
      ell(ctx, x - 40 + i * 30, y - 96, 11, 14);
      ctx.fill();
      ctx.stroke();
    }
  }
  // les roues
  for (const wx of [x - 46, x + 18]) {
    const rot = (c.walk || 0) * 1.2 * f;
    ctx.save();
    ctx.translate(wx, y - 22);
    ctx.rotate(rot);
    ctx.strokeStyle = '#3A2414';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#A8804E';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#6A4A2A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.moveTo(Math.cos(a) * 22, Math.sin(a) * 22);
      ctx.lineTo(-Math.cos(a) * 22, -Math.sin(a) * 22);
    }
    ctx.stroke();
    ctx.restore();
  }
  // le marchand, à côté
  draw('th-negociant', '#3A6AC8', x - f * 30, y + 26, 26, { angle: f > 0 ? 0 : Math.PI, speed: c.moving ? 0.6 : 0, walk: (c.walk || 0) * 1.4, dress: c.col });
}

/** Le drapeau d'un village : gris avec un « ? » (inconnu), à ses couleurs (ami), rouge et noir (hostile) */
export function drawBanner(ctx, b, t) {
  const { x, y } = b;
  groundShadow(ctx, x, y, 20, 6, 0.25);
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 260);
  ctx.stroke();
  ctx.strokeStyle = '#8A6440';
  ctx.lineWidth = 4;
  ctx.stroke();
  const col = b.state === 'ami' ? b.col : b.state === 'hostile' ? '#7A1E1E' : '#9A9A9A';
  const wave = (k) => Math.sin(t * 4 + k) * 6;
  ctx.fillStyle = col;
  ctx.strokeStyle = shade(col, -0.55);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 256);
  ctx.quadraticCurveTo(x + 50, y - 256 + wave(0), x + 100, y - 250 + wave(1));
  ctx.lineTo(x + 100, y - 186 + wave(2));
  ctx.quadraticCurveTo(x + 50, y - 192 + wave(1.5), x, y - 192);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(x + 50, y - 222 + wave(1) * 0.6);
  if (b.state === 'ami') {
    ctx.fillStyle = '#FFFFFF';
    ell(ctx, 0, 0, 18, 18);
    ctx.fill();
    EXTRA_ICONS.ami(ctx, 12);
  } else if (b.state === 'hostile') {
    // deux lances croisées
    ctx.strokeStyle = '#F2EEE4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, 18);
    ctx.lineTo(20, -18);
    ctx.moveTo(20, 18);
    ctx.lineTo(-20, -18);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "800 34px 'Baloo 2', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 2);
  }
  ctx.restore();
}

/** Une hutte d'un village voisin (les mêmes que celles de ton premier village) */
export function drawTownHut(ctx, h, t, pal) {
  cached(ctx, `hutte|${h.r}|${pal.thatch}`, h.x, h.y, h.r * 2.1, h.r * 1.3, h.r * 0.5, (g, ox, oy) => drawHut(g, { x: ox, y: oy, r: h.r }, 0, pal));
}
export function drawTownStake(ctx, s) { drawStake(ctx, s); }
export function drawTownTower(ctx, s, t, guard) { drawTower(ctx, s, t, guard); }
export function drawTownFire(ctx, s, t) { drawHearth(ctx, s, t, true, false); }

/** La cabane du chef de chantier : un abri de bois, une table avec les plans */
export function drawYard(ctx, y0, t) {
  cached(ctx, 'chantier', y0.x, y0.y, 200, 140, 30, (g, ox, oy) => {
    groundShadow(g, ox, oy + 2, 110, 24, 0.28);
    g.strokeStyle = '#3A2414';
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.beginPath();
    for (const x of [-90, 90]) { g.moveTo(ox + x, oy); g.lineTo(ox + x, oy - 120); }
    g.stroke();
    g.strokeStyle = '#8A6440';
    g.lineWidth = 5;
    g.stroke();
    // la table et le plan déroulé
    g.fillStyle = '#9A7A4E';
    g.strokeStyle = '#3A2414';
    g.lineWidth = 3;
    g.beginPath();
    g.rect(ox - 60, oy - 46, 120, 12);
    g.fill();
    g.stroke();
    g.fillStyle = '#F2E6C4';
    g.beginPath();
    g.rect(ox - 44, oy - 56, 80, 12);
    g.fill();
    g.stroke();
    g.strokeStyle = '#3A2414';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(ox - 50, oy - 34);
    g.lineTo(ox - 50, oy);
    g.moveTo(ox + 50, oy - 34);
    g.lineTo(ox + 50, oy);
    g.stroke();
    // le toit de planches
    g.fillStyle = '#A8804E';
    g.strokeStyle = '#3A2414';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ox - 116, oy - 112);
    g.lineTo(ox - 90, oy - 160);
    g.lineTo(ox + 90, oy - 160);
    g.lineTo(ox + 116, oy - 112);
    g.closePath();
    g.fill();
    g.stroke();
    g.strokeStyle = 'rgba(50, 30, 14, 0.5)';
    g.lineWidth = 2;
    g.beginPath();
    for (let x = -100; x < 100; x += 24) { g.moveTo(ox + x, oy - 114); g.lineTo(ox + x * 0.8, oy - 158); }
    g.stroke();
    // l'enseigne : un ouvrier
    g.save();
    g.translate(ox, oy - 186);
    g.fillStyle = '#F8F0DC';
    g.strokeStyle = '#3A2414';
    g.lineWidth = 3;
    rrect(g, -30, -24, 60, 48, 10);
    g.fill();
    g.stroke();
    EXTRA_ICONS.ouvrier(g, 18);
    g.restore();
  });
}

/** Les réserves du chantier : des tas de blocs et de troncs (selon ce qu'il y a) */
export function drawStock(ctx, s, pierre, bois) {
  const np = Math.min(12, Math.ceil(pierre / 10)), nb = Math.min(6, Math.ceil(bois / 6));
  for (let i = 0; i < nb; i++) {
    const x = s.x + 120 + (i % 3) * 18, y = s.y - Math.floor(i / 3) * 18;
    ctx.fillStyle = i % 2 ? '#8A6440' : '#7A5434';
    ctx.strokeStyle = '#3A2414';
    ctx.lineWidth = 2.5;
    rrect(ctx, x - 70, y - 16, 120, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E2C08A';
    ell(ctx, x + 50, y - 8, 5, 8);
    ctx.fill();
  }
  for (let i = 0; i < np; i++) {
    const row = Math.floor(i / 4), col = i % 4;
    const x = s.x - 120 + col * 44 + row * 22, y = s.y - row * 30;
    cutBlock(ctx, x, y, 40, 24, 10, STONES[i % STONES.length], i + 1);
  }
}

/* ============================================================================
   LE GRAND MONUMENT : la pyramide, la ziggourat, le temple, le phare
   m : { x, y (le milieu du devant, au sol), w (la demi-largeur), d (la profondeur) } ;
   k : 0 → 1, il monte ; o.ruin : 2 000 ans plus tard, un peu abîmé ; o.found : les fondations
   ============================================================================ */
export const MONUMENTS = {
  pyramide: { name: 'La grande pyramide', icon: '🔺', text: 'Comme en Égypte : un immense tombeau de pierre, aux faces bien lisses, avec sa pointe dorée.', fact: "La Grande Pyramide de Gizeh mesure 146 mètres de haut. Il a fallu environ 20 ans pour la construire, avec des milliers d'ouvriers." },
  ziggourat: { name: 'La ziggourat', icon: '🏯', text: 'Comme en Mésopotamie : une montagne de briques en étages, avec un temple tout en haut.', fact: "Les ziggourats étaient des temples à étages. La plus célèbre, celle de Babylone, a peut-être inspiré l'histoire de la tour de Babel." },
  temple: { name: 'Le grand temple', icon: '🏛️', text: 'Comme en Grèce : de grandes colonnes de marbre blanc, et un toit en triangle.', fact: "Le Parthénon, à Athènes, a 46 colonnes de marbre. Les Grecs le peignaient de couleurs vives : il n'était pas tout blanc !" },
  phare: { name: 'Le grand phare', icon: '🗼', text: "Comme à Alexandrie : une tour immense, avec un grand feu tout en haut pour guider les bateaux.", fact: "Le phare d'Alexandrie mesurait plus de 100 mètres ! Son feu, la nuit, se voyait à 50 kilomètres. C'était l'une des Sept Merveilles du monde." },
};
const MARBLE = '#F2ECDE';
const SAND = '#E2C890';

/** Une boîte de pierre vue de trois quarts : le dessus, la face de devant, les côtés */
function box(ctx, x, y, hw, d, h0, h1, col, o = {}) {
  // (x, y) = le milieu du devant au sol ; d = la profondeur ; de la hauteur h0 à h1
  const top = y - h1, bot = y - h0;
  if (h1 <= h0) return;
  ctx.fillStyle = shade(col, 0.16);
  ctx.strokeStyle = o.ink || '#4A3A24';
  ctx.lineWidth = o.lw || 3;
  ctx.beginPath();
  ctx.rect(x - hw, top - d, hw * 2, d);
  ctx.fill();
  ctx.stroke();
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, col);
  g.addColorStop(1, shade(col, -0.16));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.rect(x - hw, top, hw * 2, bot - top);
  ctx.fill();
  ctx.stroke();
  if (o.rows) {
    ctx.strokeStyle = 'rgba(80, 60, 30, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let yy = bot - o.rows; yy > top + 4; yy -= o.rows) {
      ctx.moveTo(x - hw + 2, yy);
      ctx.lineTo(x + hw - 2, yy);
    }
    ctx.stroke();
  }
}

/** L'échafaudage de bois, devant ce qui monte (de la hauteur h0 à h1) */
function scaffold(ctx, x, y, hw, h0, h1) {
  ctx.strokeStyle = '#6A4A2A';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let xx = x - hw; xx <= x + hw + 1; xx += hw / 4) {
    ctx.moveTo(xx, y - h0 + 6);
    ctx.lineTo(xx, y - h1 - 30);
  }
  for (let yy = y - h0 - 40; yy > y - h1 - 30; yy -= 50) {
    ctx.moveTo(x - hw - 6, yy);
    ctx.lineTo(x + hw + 6, yy);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160, 120, 70, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawPyramid(ctx, m, k, t, o) {
  const { x, y } = m, W = m.w, D = m.d, H = W * 1.2;
  const h = H * clamp01(k);
  const s = 1 - h / H;
  const cy = y - D / 2;                       // le milieu de la base
  const P = (fx, fz, hh) => ({ x: x + fx * W * (1 - hh / H), y: cy + fz * D / 2 * (1 - hh / H) - hh });
  const fl = P(-1, 1, 0), fr = P(1, 1, 0), bl = P(-1, -1, 0), br = P(1, -1, 0);
  const tl = P(-1, 1, h), tr = P(1, 1, h), tbl = P(-1, -1, h), tbr = P(1, -1, h);
  const col = o.ruin ? '#D8BC86' : SAND;
  ctx.lineJoin = 'round';
  // les deux côtés (un peu dans l'ombre)
  for (const [a, b, c, d2, kk] of [[bl, fl, tl, tbl, -0.25], [fr, br, tbr, tr, -0.35]]) {
    ctx.fillStyle = shade(col, kk);
    ctx.strokeStyle = '#5A4424';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // la face de devant
  const g = ctx.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, shade(col, 0.12));
  g.addColorStop(1, shade(col, -0.08));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(fl.x, fl.y);
  ctx.lineTo(fr.x, fr.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // les rangées de blocs
  ctx.strokeStyle = 'rgba(90, 66, 30, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let hh = 26; hh < h - 4; hh += 26) {
    const a = P(-1, 1, hh), b = P(1, 1, hh);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
  if (s > 0.02) {
    // le dessus, encore plat (on y travaille)
    ctx.fillStyle = shade(col, 0.2);
    ctx.strokeStyle = '#5A4424';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(tbr.x, tbr.y);
    ctx.lineTo(tbl.x, tbl.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (k > 0 && !o.done) {
      // la rampe de terre qui monte jusqu'en haut
      ctx.fillStyle = 'rgba(150, 110, 60, 0.85)';
      ctx.strokeStyle = '#5A3A1A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + W * 0.95, y + 4);
      ctx.lineTo(x + W * 0.95 + 120, y + 4);
      ctx.lineTo(tr.x + 10, tr.y + 2);
      ctx.lineTo(tr.x - 40, tr.y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // la pointe dorée
    const ap = P(0, 0, H);
    ctx.fillStyle = '#F2C24A';
    ctx.strokeStyle = '#8A5A1A';
    ctx.lineWidth = 3;
    const q1 = P(-1, 1, H * 0.92), q2 = P(1, 1, H * 0.92);
    ctx.beginPath();
    ctx.moveTo(q1.x, q1.y);
    ctx.lineTo(q2.x, q2.y);
    ctx.lineTo(ap.x, ap.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (!o.ruin) {
      ctx.fillStyle = `rgba(255, 250, 220, ${0.5 + Math.sin(t * 3) * 0.3})`;
      ell(ctx, ap.x - 8, ap.y + 26, 6, 10, -0.4);
      ctx.fill();
    }
  }
  // l'entrée
  if (k > 0.2) {
    const e = P(0, 1, H * 0.12);
    ctx.fillStyle = '#3A2A14';
    ctx.beginPath();
    ctx.moveTo(e.x - 22, e.y + 10);
    ctx.lineTo(e.x, e.y - 22);
    ctx.lineTo(e.x + 22, e.y + 10);
    ctx.closePath();
    ctx.fill();
  }
}

function drawZiggurat(ctx, m, k, t, o) {
  const { x, y } = m, W = m.w, D = m.d;
  const tiers = [[1, 0.9, 150], [0.74, 0.66, 130], [0.5, 0.44, 110], [0.3, 0.26, 90]];
  const col = o.ruin ? '#B88A5E' : '#C9965E';
  let base = 0;
  const per = 1 / tiers.length;
  tiers.forEach(([fw, fd, th], i) => {
    const kk = clamp01((k - i * per) / per);
    if (kk <= 0) return;
    const hw = W * fw, d = D * fd;
    // chaque étage est un peu en retrait vers le fond
    const yy = y - (D - d) * 0.5;
    box(ctx, x, yy + base, hw, d, 0, th * kk, shade(col, i * 0.05), { rows: 18 });
    // les contreforts
    ctx.strokeStyle = 'rgba(70, 44, 20, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let xx = x - hw + 30; xx < x + hw - 10; xx += 46) {
      ctx.moveTo(xx, yy + base - 3);
      ctx.lineTo(xx, yy + base - th * kk + 4);
    }
    ctx.stroke();
    if (kk < 1 && !o.done) scaffold(ctx, x, yy + base, hw * 0.9, 0, th * kk);
    base -= th;
  });
  // le grand escalier, au milieu de la face
  if (k > 0.1) {
    const top = Math.min(tiers.length, k / per);
    let hh = 0;
    for (let i = 0; i < Math.floor(top); i++) hh += tiers[i][2];
    const sy = y, ty = y - (D - D * tiers[Math.max(0, Math.floor(top) - 1)][1]) * 0.5 - hh;
    ctx.fillStyle = shade(col, -0.18);
    ctx.strokeStyle = '#4A2A14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 60, sy + 8);
    ctx.lineTo(x - 30, ty);
    ctx.lineTo(x + 30, ty);
    ctx.lineTo(x + 60, sy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40, 20, 10, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i < 24; i++) {
      const u = i / 24, yy = lerp(sy + 8, ty, u), hw = lerp(60, 30, u);
      ctx.moveTo(x - hw, yy);
      ctx.lineTo(x + hw, yy);
    }
    ctx.stroke();
  }
  // le petit temple bleu, tout en haut
  if (k >= 1) {
    const top = y - (D - D * 0.26) * 0.5 - 480;
    box(ctx, x, top, W * 0.14, D * 0.16, 0, 70, o.ruin ? '#5A7AA8' : '#2E5AA8', { ink: '#142A5A' });
    if (!o.ruin) {
      ctx.fillStyle = '#F2C24A';
      ctx.fillRect(x - W * 0.14, top - 76, W * 0.28, 8);
    }
  }
}

function drawTemple(ctx, m, k, t, o) {
  const { x, y } = m, W = m.w * 0.92, D = m.d * 0.8;
  const col = o.ruin ? '#E2DACA' : MARBLE;
  // les marches (le socle)
  const steps = clamp01(k / 0.2);
  for (let i = 0; i < 3; i++) {
    const kk = clamp01(steps * 3 - i);
    if (kk <= 0) break;
    box(ctx, x, y - i * 8, W - i * 22, D - i * 14, i * 22, i * 22 + 22 * kk, shade(col, -0.04 * (2 - i)));
  }
  const floor = 66, colH = 300;
  const kc = clamp01((k - 0.2) / 0.5);
  const n = 8;
  const fy = y - 16;
  const backY = fy - D + 50;
  // les colonnes : la rangée du fond, puis celle de devant
  for (const [ry, sh] of [[backY, -0.18], [fy, 0]]) {
    for (let i = 0; i < n; i++) {
      if (o.ruin && ry === fy && (i === 2 || i === 6)) continue;  // (2 000 ans plus tard, deux colonnes sont tombées)
      const cx = x - W + 60 + i * ((W * 2 - 120) / (n - 1));
      const ch = colH * clamp01(kc * 1.3 - i * 0.04);
      if (ch <= 0) continue;
      const g = ctx.createLinearGradient(cx - 22, 0, cx + 22, 0);
      g.addColorStop(0, shade(col, 0.08 + sh));
      g.addColorStop(0.6, shade(col, sh));
      g.addColorStop(1, shade(col, -0.25 + sh));
      ctx.fillStyle = g;
      ctx.strokeStyle = '#6A6250';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(cx - 22, ry - floor - ch, 44, ch);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(100, 90, 70, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const dx of [-11, 0, 11]) { ctx.moveTo(cx + dx, ry - floor - 4); ctx.lineTo(cx + dx, ry - floor - ch + 4); }
      ctx.stroke();
      if (ch >= colH * 0.98) {
        ctx.fillStyle = shade(col, 0.05 + sh);
        ctx.strokeStyle = '#6A6250';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.rect(cx - 30, ry - floor - ch - 12, 60, 14);
        ctx.fill();
        ctx.stroke();
      }
      if (kc > 0 && kc < 1 && !o.done && ry === fy && i % 3 === 0) scaffold(ctx, cx, ry - floor, 30, 0, ch);
    }
  }
  // l'entablement (la grande poutre de pierre) et le fronton en triangle
  const ke = clamp01((k - 0.7) / 0.15);
  const top = fy - floor - colH - 12;
  if (ke > 0) {
    // l'entablement : la grande poutre de pierre, posée sur les colonnes
    box(ctx, x, top + 0, W - 20, (D - 60) * (k >= 0.85 ? 1 : 0.25), 0, 50 * ke, shade(col, -0.02));
    ctx.fillStyle = o.ruin ? '#C8B89A' : '#3A6AC8';
    if (ke >= 1) ctx.fillRect(x - W + 24, top - 30, (W - 24) * 2, 10);
  }
  const kp = clamp01((k - 0.85) / 0.15);
  if (kp > 0) {
    const py = top - 50, rd = D - 60, rh = 120 * kp;
    // le toit de tuiles, à deux pentes (le faîte va de l'avant vers l'arrière)
    for (const s of [-1, 1]) {
      ctx.fillStyle = o.ruin ? (s < 0 ? '#B8A890' : '#9E8E78') : (s < 0 ? '#D2704A' : '#B05A3A');
      ctx.strokeStyle = '#5A2A14';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * (W - 10), py);
      ctx.lineTo(x, py - rh);
      ctx.lineTo(x, py - rh - rd);
      ctx.lineTo(x + s * (W - 10), py - rd);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(70, 30, 14, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 1; i < 6; i++) {
        const u = i / 6;
        ctx.moveTo(lerp(x + s * (W - 10), x, u), lerp(py, py - rh, u));
        ctx.lineTo(lerp(x + s * (W - 10), x, u), lerp(py - rd, py - rh - rd, u));
      }
      ctx.stroke();
    }
    // le fronton, en triangle, sur la façade
    ctx.fillStyle = shade(col, 0.06);
    ctx.strokeStyle = '#6A6250';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - W + 10, py);
    ctx.lineTo(x, py - rh);
    ctx.lineTo(x + W - 10, py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (kp >= 1) {
      // les statues du fronton (de simples silhouettes)
      ctx.fillStyle = o.ruin ? 'rgba(150, 140, 120, 0.5)' : 'rgba(200, 60, 40, 0.55)';
      for (let i = -3; i <= 3; i++) {
        const hh = 90 * (1 - Math.abs(i) / 4.2);
        ell(ctx, x + i * 60, py - hh * 0.4, 12, hh * 0.38);
        ctx.fill();
      }
    }
  }
}

function drawLighthouse(ctx, m, k, t, o) {
  const { x, y } = m, W = m.w * 0.5, D = m.d * 0.5;
  const col = o.ruin ? '#DCD2BE' : MARBLE;
  const tiers = [[W, D, 520, 0.5], [W * 0.62, D * 0.62, 300, 0.3], [W * 0.4, D * 0.4, 160, 0.2]];
  let base = 0, at = 0;
  tiers.forEach(([hw, d, th, share], i) => {
    const kk = clamp01((k - at) / share);
    at += share;
    if (kk <= 0) return;
    const yy = y - (D - d) * 0.5;
    box(ctx, x, yy - base, hw, d, 0, th * kk, shade(col, -0.03 * i), { rows: 24 });
    // les fenêtres
    ctx.fillStyle = '#3A3428';
    for (let j = 1; j * 80 < th * kk - 30; j++) {
      rrect(ctx, x - 9, yy - base - j * 80 - 30, 18, 30, 8);
      ctx.fill();
    }
    if (kk < 1 && !o.done) scaffold(ctx, x, yy - base, hw * 0.9, 0, th * kk);
    base += th + d * 0;
  });
  if (k >= 1) {
    // le grand feu, tout en haut… et son miroir de bronze
    const fy = y - (D - D * 0.4) * 0.5 - base - D * 0.2;
    if (!o.ruin) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, fy - 40, 10, x, fy - 40, 260);
      g.addColorStop(0, 'rgba(255, 200, 110, 0.55)');
      g.addColorStop(1, 'rgba(255, 140, 40, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 260, fy - 300, 520, 520);
      ctx.restore();
      flame(ctx, x, fy, 46, t, 3);
    }
    ctx.fillStyle = '#C9963A';
    ctx.strokeStyle = '#5A3A14';
    ctx.lineWidth = 3;
    ell(ctx, x + 60, fy - 40, 18, 46, 0.3);
    ctx.fill();
    ctx.stroke();
  }
}

/** Le monument (kind), à la hauteur k ; o.found : les fondations seulement */
export function drawMonument(ctx, m, kind, k, t, o = {}) {
  const { x, y, w, d } = m;
  groundShadow(ctx, x + w * 0.12, y - d * 0.42, w * 1.12, d * 0.62, 0.25);
  // les fondations : une plateforme de pierre, et les cordes tendues du plan
  ctx.fillStyle = '#B8AC94';
  ctx.strokeStyle = '#4A4236';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(x - w - 20, y - d - 10, (w + 20) * 2, d + 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9E927A';
  ctx.beginPath();
  ctx.rect(x - w - 20, y + 10, (w + 20) * 2, 18);
  ctx.fill();
  ctx.stroke();
  if (o.found || k <= 0) {
    ctx.save();
    ctx.setLineDash([16, 12]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(x - w, y - d, w * 2, d);
    ctx.moveTo(x - w, y - d);
    ctx.lineTo(x + w, y);
    ctx.moveTo(x + w, y - d);
    ctx.lineTo(x - w, y);
    ctx.stroke();
    ctx.restore();
    for (const [px, py] of [[-w, -d], [w, -d], [-w, 0], [w, 0]]) {
      ctx.fillStyle = '#7A5434';
      ctx.strokeStyle = '#2A1A0C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x + px - 6, y + py - 40, 12, 42);
      ctx.fill();
      ctx.stroke();
    }
    if (k <= 0) return;
  }
  if (kind === 'ziggourat') drawZiggurat(ctx, m, k, t, o);
  else if (kind === 'temple') drawTemple(ctx, m, k, t, o);
  else if (kind === 'phare') drawLighthouse(ctx, m, k, t, o);
  else drawPyramid(ctx, m, k, t, o);
}

/** La hauteur du monument (pour la barre de progression au-dessus) */
export function monumentHeight(m, kind) {
  if (kind === 'phare') return 980 + m.d * 0.25;
  if (kind === 'temple') return 560;
  if (kind === 'ziggourat') return 560;
  return m.w * 1.2 + m.d * 0.5;
}

/** Une petite image du monument (pour la fenêtre où l'on choisit sa forme) */
const THUMBS = {};
export function monumentThumb(kind) {
  if (THUMBS[kind]) return THUMBS[kind];
  const c = document.createElement('canvas');
  c.width = 220;
  c.height = 180;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, '#9ED2F2');
  sky.addColorStop(1, '#F8E8C0');
  g.fillStyle = sky;
  g.fillRect(0, 0, 220, 180);
  g.fillStyle = '#9AAE5A';
  g.fillRect(0, 140, 220, 40);
  const k = kind === 'phare' ? 0.13 : kind === 'pyramide' ? 0.17 : 0.2;
  g.save();
  g.translate(110, 166);
  g.scale(k, k);
  drawMonument(g, { x: 0, y: 0, w: 520, d: 420 }, kind, 1, 1, { done: true });
  g.restore();
  THUMBS[kind] = c.toDataURL();
  return THUMBS[kind];
}
