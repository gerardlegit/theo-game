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
  // un bloc de pierre taillée, vu de trois quarts
  ctx.strokeStyle = '#4A4236';
  ctx.fillStyle = '#C8BCA4';
  ctx.beginPath();
  ctx.rect(-s * 0.75, -s * 0.2, s * 1.2, s * 0.8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#E2D8C2';
  ctx.beginPath();
  ctx.moveTo(-s * 0.75, -s * 0.2);
  ctx.lineTo(-s * 0.4, -s * 0.6);
  ctx.lineTo(s * 0.8, -s * 0.6);
  ctx.lineTo(s * 0.45, -s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#A89C84';
  ctx.beginPath();
  ctx.moveTo(s * 0.45, -s * 0.2);
  ctx.lineTo(s * 0.8, -s * 0.6);
  ctx.lineTo(s * 0.8, s * 0.2);
  ctx.lineTo(s * 0.45, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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

/** Un morceau de rempart (est-ouest) : sa face de pierre, son chemin de ronde et ses créneaux */
const WALL_H = 150, WALL_T = 44;
function paintWallH(g, ox, oy, len) {
  const x0 = ox - len / 2;
  // le chemin de ronde (le dessus du mur)
  g.fillStyle = shade(STONE, 0.1);
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  g.beginPath();
  g.rect(x0, oy - WALL_H - WALL_T * 0.55, len, WALL_T * 0.55);
  g.fill();
  g.stroke();
  // la face
  const gr = g.createLinearGradient(0, oy - WALL_H, 0, oy);
  gr.addColorStop(0, STONE);
  gr.addColorStop(1, shade(STONE, -0.14));
  g.fillStyle = gr;
  g.beginPath();
  g.rect(x0, oy - WALL_H, len, WALL_H);
  g.fill();
  g.stroke();
  // les pierres
  g.strokeStyle = 'rgba(70, 58, 40, 0.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  for (let row = 0, yy = oy - WALL_H + 22; yy < oy - 4; yy += 22, row++) {
    g.moveTo(x0 + 2, yy);
    g.lineTo(x0 + len - 2, yy);
    for (let xx = x0 + (row % 2 ? 18 : 40); xx < x0 + len - 6; xx += 46) {
      g.moveTo(xx, yy);
      g.lineTo(xx, yy - 22);
    }
  }
  g.stroke();
  // les créneaux
  for (let xx = x0 + 6; xx < x0 + len - 20; xx += 34) {
    g.fillStyle = shade(STONE, 0.05);
    g.strokeStyle = INKS;
    g.lineWidth = 2.5;
    g.beginPath();
    g.rect(xx, oy - WALL_H - 22, 20, 22);
    g.fill();
    g.stroke();
    g.fillStyle = shade(STONE, 0.2);
    g.fillRect(xx + 1, oy - WALL_H - 30, 18, 8);
  }
  // la mousse, au pied du mur
  g.fillStyle = 'rgba(80, 110, 50, 0.35)';
  for (let xx = x0 + 10; xx < x0 + len - 10; xx += 57) {
    ell(g, xx, oy - 4, 16, 6);
    g.fill();
  }
}
export function drawWallH(ctx, w) {
  cached(ctx, `murH|${Math.round(w.len)}`, w.x, w.y, WALL_H + 40, w.len / 2 + 4, 10, (g, ox, oy) => paintWallH(g, ox, oy, w.len));
}
/** Un bloc du rempart nord-sud (vu par le bout : on voit surtout son chemin de ronde) */
function paintWallV(g, ox, oy, len) {
  const x0 = ox - WALL_T / 2 - 6, w = WALL_T + 12;
  const gr = g.createLinearGradient(x0, 0, x0 + w, 0);
  gr.addColorStop(0, shade(STONE, -0.1));
  gr.addColorStop(0.5, STONE);
  gr.addColorStop(1, shade(STONE, -0.2));
  g.fillStyle = gr;
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  g.beginPath();
  g.rect(x0, oy - WALL_H - len, w, WALL_H + len);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(70, 58, 40, 0.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  for (let yy = oy - 22; yy > oy - WALL_H; yy -= 22) {
    g.moveTo(x0 + 2, yy);
    g.lineTo(x0 + w - 2, yy);
  }
  g.moveTo(ox, oy - 2);
  g.lineTo(ox, oy - 22);
  g.stroke();
  // les créneaux, des deux côtés du chemin de ronde
  for (const s of [-1, 1]) {
    g.fillStyle = shade(STONE, 0.12);
    g.strokeStyle = INKS;
    g.lineWidth = 2.5;
    g.beginPath();
    g.rect(ox + s * (w / 2 - 6) - 7, oy - WALL_H - len - 18, 14, 22);
    g.fill();
    g.stroke();
  }
}
export function drawWallV(ctx, w) {
  cached(ctx, `murV|${Math.round(w.len)}`, w.x, w.y, WALL_H + w.len + 30, WALL_T / 2 + 10, 6, (g, ox, oy) => paintWallV(g, ox, oy, w.len));
}

/** Une tour ronde du rempart (r = son rayon) */
function paintTower(g, ox, oy, r, H, flag) {
  groundShadow(g, ox, oy, r * 1.1, r * 0.35, 0.3);
  const gr = g.createLinearGradient(ox - r, 0, ox + r, 0);
  gr.addColorStop(0, shade(STONE, 0.12));
  gr.addColorStop(0.55, STONE);
  gr.addColorStop(1, shade(STONE, -0.28));
  g.fillStyle = gr;
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(ox - r, oy - H);
  g.lineTo(ox - r, oy);
  g.ellipse(ox, oy, r, r * 0.35, 0, Math.PI, 0, true);
  g.lineTo(ox + r, oy - H);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(70, 58, 40, 0.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  for (let yy = oy - 22; yy > oy - H + 6; yy -= 22) {
    g.moveTo(ox - r + 2, yy);
    g.ellipse(ox, yy, r - 2, r * 0.33, 0, Math.PI, 0, true);
  }
  g.stroke();
  // une meurtrière
  g.fillStyle = '#2A2218';
  rrect(g, ox - 5, oy - H * 0.62, 10, 28, 4);
  g.fill();
  // le haut : le chemin de ronde, et ses créneaux
  g.fillStyle = shade(STONE, 0.15);
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  ell(g, ox, oy - H, r * 1.08, r * 0.38);
  g.fill();
  g.stroke();
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i + 0.5) * (Math.PI / 7);
    const mx = ox + Math.cos(a) * r * 1.02, my = oy - H - Math.sin(a) * -r * 0.36;
    g.fillStyle = shade(STONE, 0.04);
    g.beginPath();
    g.rect(mx - 8, my - 22, 16, 22);
    g.fill();
    g.stroke();
  }
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
  cached(ctx, `tour|${r}|${H}|${tw.flag || ''}`, tw.x, tw.y, H + (tw.flag ? 110 : 40), r * 1.2 + 60, r * 0.5, (g, ox, oy) => paintTower(g, ox, oy, r, H, tw.flag));
}

/** Le grand portail d'une porte nord ou sud : l'arche par-dessus le passage (gw = sa largeur) */
function paintGateArch(g, ox, oy, gw) {
  const H = WALL_H + 30, top = oy - H;
  g.fillStyle = STONE;
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(ox - gw / 2 - 10, top);
  g.lineTo(ox + gw / 2 + 10, top);
  g.lineTo(ox + gw / 2 + 10, oy - 112);
  g.quadraticCurveTo(ox, oy - 190, ox - gw / 2 - 10, oy - 112);
  g.closePath();
  g.fill();
  g.stroke();
  // la clé de voûte, et les grosses pierres de l'arche
  g.strokeStyle = 'rgba(70, 58, 40, 0.55)';
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 1; i < 6; i++) {
    const u = i / 6, xx = lerp(ox - gw / 2 - 10, ox + gw / 2 + 10, u);
    const yy = oy - 112 - Math.sin(u * Math.PI) * 52;
    g.moveTo(xx, yy);
    g.lineTo(xx + (u - 0.5) * 10, top + 2);
  }
  g.stroke();
  g.fillStyle = '#E8C05A';
  g.strokeStyle = '#6A4A1A';
  g.beginPath();
  g.moveTo(ox - 12, oy - 164);
  g.lineTo(ox + 12, oy - 164);
  g.lineTo(ox + 9, top + 2);
  g.lineTo(ox - 9, top + 2);
  g.closePath();
  g.fill();
  g.stroke();
  // les créneaux
  for (let xx = ox - gw / 2 - 6; xx < ox + gw / 2; xx += 34) {
    g.fillStyle = shade(STONE, 0.05);
    g.strokeStyle = INKS;
    g.lineWidth = 2.5;
    g.beginPath();
    g.rect(xx, top - 22, 20, 22);
    g.fill();
    g.stroke();
  }
}
export function drawGateArch(ctx, ga) {
  cached(ctx, `porte|${ga.w}`, ga.x, ga.y, WALL_H + 70, ga.w / 2 + 20, 4, (g, ox, oy) => paintGateArch(g, ox, oy, ga.w));
}

/** Une maison de pierre, avec son toit de chaume (v = la variante : la porte, les fenêtres, les pots…) */
const HOUSE_WALLS = ['#D2C4A6', '#C8B898', '#DCCFAE', '#C2B08C', '#D8C8A2'];
function paintHouse(g, ox, oy, v, thatch) {
  const r = seeded(v * 97 + 11);
  const W = 190 + Math.floor(r() * 3) * 16, Hw = 88 + Math.floor(r() * 3) * 8;
  const wall = HOUSE_WALLS[v % HOUSE_WALLS.length];
  groundShadow(g, ox + 10, oy + 2, W * 0.6, 26, 0.3);
  // le mur de devant, en pierres
  const gr = g.createLinearGradient(0, oy - Hw, 0, oy);
  gr.addColorStop(0, shade(wall, 0.06));
  gr.addColorStop(1, shade(wall, -0.14));
  g.fillStyle = gr;
  g.strokeStyle = INKS;
  g.lineWidth = 3;
  g.beginPath();
  g.rect(ox - W / 2, oy - Hw, W, Hw);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(80, 64, 44, 0.4)';
  g.lineWidth = 1.5;
  g.beginPath();
  for (let row = 0, yy = oy - 6; yy > oy - Hw + 8; yy -= 18, row++) {
    for (let xx = ox - W / 2 + (row % 2 ? 10 : 26); xx < ox + W / 2 - 14; xx += 32 + (row * 7) % 9) {
      g.moveTo(xx, yy);
      g.lineTo(xx + 22, yy);
      g.moveTo(xx + 24, yy);
      g.lineTo(xx + 24, yy - 14);
    }
  }
  g.stroke();
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
/** Le sol de la carrière : de la roche claire, entaillée en gradins */
export function drawQuarryGround(ctx, q) {
  const r = seeded(31);
  ctx.fillStyle = '#B4AA98';
  ell(ctx, q.x, q.y, q.r, q.r * 0.7);
  ctx.fill();
  ctx.fillStyle = '#9E9482';
  ell(ctx, q.x + 20, q.y + 10, q.r * 0.72, q.r * 0.48);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70, 60, 44, 0.5)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(q.x + 20, q.y + 10, q.r * (0.72 - i * 0.18), q.r * (0.48 - i * 0.12), 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 250, 235, 0.25)';
  for (let i = 0; i < 26; i++) {
    ell(ctx, q.x + (r() * 2 - 1) * q.r * 0.9, q.y + (r() * 2 - 1) * q.r * 0.6, 8 + r() * 16, 4 + r() * 6);
    ctx.fill();
  }
}

/** Un tas de pierres taillées (d.amount = ce qu'il en reste) */
export function drawStonePile(ctx, d, t) {
  const n = Math.max(0, d.amount ?? 4), max = d.max || 4;
  groundShadow(ctx, d.x, d.y, d.r * 1.0, d.r * 0.3);
  const spots = [[-0.55, 0], [0.05, 0.05], [0.6, 0], [-0.25, -0.5], [0.35, -0.48], [0.05, -0.95]];
  const k = Math.ceil((n / max) * spots.length);
  for (let i = 0; i < k; i++) {
    const [fx, fy] = spots[i];
    const x = d.x + fx * d.r, y = d.y + fy * d.r * 0.8;
    const s = d.r * 0.36;
    ctx.fillStyle = '#C8BCA4';
    ctx.strokeStyle = '#4A4236';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(x - s, y - s * 1.1, s * 2, s * 1.1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E2D8C2';
    ctx.beginPath();
    ctx.rect(x - s, y - s * 1.45, s * 2, s * 0.35);
    ctx.fill();
    ctx.stroke();
  }
  if (n > 0) {
    // ça brille un peu : on peut les prendre
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + Math.sin(t * 3 + d.seed) * 0.25})`;
    ell(ctx, d.x - d.r * 0.3, d.y - d.r * 0.9, 5, 5);
    ctx.fill();
  } else {
    // (vide) un ciseau et un maillet posés par terre
    ctx.strokeStyle = '#6A4A2A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(d.x - 16, d.y - 4);
    ctx.lineTo(d.x + 18, d.y - 10);
    ctx.stroke();
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

/** Le pont de pierre (au sol : on marche dessus) : son tablier pavé, ses parapets, ses arches */
export function drawBridge(ctx, b, t) {
  const { x0, x1, y } = b, hw = b.hw || 70;
  // les arches (sous le tablier, au-dessus de l'eau)
  const n = Math.max(2, Math.round((x1 - x0) / 140));
  const step = (x1 - x0) / n;
  ctx.fillStyle = shade(STONE, -0.12);
  ctx.strokeStyle = INKS;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y + hw);
  ctx.lineTo(x1, y + hw);
  ctx.lineTo(x1, y + hw + 70);
  for (let i = n - 1; i >= 0; i--) {
    const ax = x0 + (i + 0.5) * step;
    ctx.lineTo(ax + step * 0.4, y + hw + 70);
    ctx.quadraticCurveTo(ax + step * 0.4, y + hw + 18, ax, y + hw + 14);
    ctx.quadraticCurveTo(ax - step * 0.4, y + hw + 18, ax - step * 0.4, y + hw + 70);
  }
  ctx.lineTo(x0, y + hw + 70);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // le reflet des arches dans l'eau
  ctx.fillStyle = 'rgba(20, 40, 60, 0.35)';
  for (let i = 0; i < n; i++) {
    const ax = x0 + (i + 0.5) * step;
    ell(ctx, ax, y + hw + 76, step * 0.38, 10);
    ctx.fill();
  }
  // le tablier pavé
  ctx.fillStyle = cobblePattern(ctx);
  ctx.beginPath();
  ctx.rect(x0, y - hw, x1 - x0, hw * 2);
  ctx.fill();
  ctx.strokeStyle = INKS;
  ctx.stroke();
  // les parapets
  for (const py of [y - hw, y + hw - 14]) {
    ctx.fillStyle = STONE;
    ctx.strokeStyle = INKS;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(x0, py - 10, x1 - x0, 22);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(70, 58, 40, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let xx = x0 + 40; xx < x1; xx += 40) {
      ctx.moveTo(xx, py - 10);
      ctx.lineTo(xx, py + 12);
    }
    ctx.stroke();
  }
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
    const x = s.x - 120 + col * 44 + row * 22, y = s.y - row * 26;
    ctx.fillStyle = '#C8BCA4';
    ctx.strokeStyle = '#4A4236';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(x - 20, y - 26, 40, 26);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E2D8C2';
    ctx.fillRect(x - 20, y - 32, 40, 6);
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
