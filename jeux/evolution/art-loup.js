// ============================================================================
// Le loup et l'humain (niveau 4), dessinés de profil comme les mammifères :
// les loups, les chiens (le joueur : du louveteau au chien de berger), les
// moutons, les chèvres, l'aurochs, la marmotte, les humains (adultes,
// chasseurs avec leur lance, enfants), les os qu'ils te lancent, le camp avec
// son feu, le village et l'enclos des moutons. Et pour la fin : le défilé des
// races de chiens d'aujourd'hui, qui descendent toutes du loup.
// Les animaux sont décrits comme dans art-mammiferes.js (mêmes nombres, même
// dessinateur) ; repère de profil : tourné vers la droite, (0, 0) = le milieu
// du corps, tout est en × c.size.
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, DECORS, shade, drawSprite, seeded } from './art.js';
import { SIDE } from './art-terre.js';
import { setDetail, isFine, startSide, groundShadow, limb } from './art-dinos.js';
import { drawMammal, addMammals } from './art-mammiferes.js';

const TAU = Math.PI * 2;

/* ============================================================================
   Les animaux (en × taille). La tête : voir drawMamHead dans art-mammiferes.js.
   ============================================================================ */
const DOGS = {
  /* ---- Les formes du joueur (et les loups, qui lui ressemblent) ---- */
  louveteau: {
    ground: 0.66, hip: [-0.48, -0.08], shoulder: [0.36, -0.08], depth: 0.36, midTop: 1.05,
    neck: [[0.54, -0.18, 0.28], [0.64, -0.26, 0.26]],
    head: { x: 0.76, y: -0.34, L: 0.64, D: 0.56, snout: 0.36, ear: 'pointe', earR: 0.85, nose: 'chien', eye: [0.16, -0.16], eyeR: 0.13 },
    legs: 'patte', legW: 0.1, stride: 0.3, cadence: 2.6,
    tail: { len: 0.65, w: 0.1, droop: -0.5, curl: 0.2, type: 'touffue' },
  },
  loup: {
    ground: 0.9, hip: [-0.6, -0.2], shoulder: [0.42, -0.24], depth: 0.32, belly: 0.82,
    neck: [[0.64, -0.34, 0.25], [0.78, -0.42, 0.22]],
    head: { x: 0.92, y: -0.46, L: 0.8, D: 0.44, snout: 0.42, ear: 'pointe', earR: 0.9, nose: 'chien', eye: [0.14, -0.22], eyeR: 0.1, teeth: true, iris: '#D9A13A' },
    legs: 'patte', legW: 0.095, stride: 0.38, cadence: 2.2,
    tail: { len: 0.95, w: 0.11, droop: -0.85, curl: 0.3, type: 'touffue' },
  },
  chien: {
    ground: 0.85, hip: [-0.56, -0.18], shoulder: [0.4, -0.2], depth: 0.33,
    neck: [[0.6, -0.3, 0.25], [0.72, -0.38, 0.23]],
    head: { x: 0.86, y: -0.44, L: 0.68, D: 0.48, snout: 0.5, dome: 0.25, ear: 'pointe', earR: 0.8, nose: 'chien', eye: [0.16, -0.2], eyeR: 0.11, teeth: true },
    legs: 'patte', legW: 0.1, stride: 0.36, cadence: 2.3,
    tail: { len: 0.8, w: 0.1, droop: -0.3, curl: 0.4, type: 'touffue' },
  },
  berger: {
    ground: 0.88, hip: [-0.58, -0.2], shoulder: [0.42, -0.22], depth: 0.35,
    neck: [[0.62, -0.32, 0.28], [0.75, -0.4, 0.25]],
    head: { x: 0.9, y: -0.46, L: 0.72, D: 0.48, snout: 0.45, dome: 0.15, ear: 'pointe', earR: 0.85, nose: 'chien', eye: [0.15, -0.2], eyeR: 0.11, teeth: true },
    legs: 'patte', legW: 0.105, stride: 0.38, cadence: 2.2, fluffy: true,
    tail: { len: 0.95, w: 0.13, droop: -0.7, curl: 0.3, type: 'touffue' },
  },

  /* ---- Les autres animaux ---- */
  marmotte: {
    ground: 0.55, hip: [-0.45, 0], shoulder: [0.35, 0], depth: 0.42, midTop: 1.05,
    neck: [[0.5, -0.05, 0.3], [0.58, -0.1, 0.28]],
    head: { x: 0.68, y: -0.15, L: 0.5, D: 0.5, snout: 0.5, ear: 'rond', earR: 0.5, nose: 'chien', eye: [0.15, -0.15], eyeR: 0.14 },
    legs: 'patte', legW: 0.1, stride: 0.22, cadence: 2.8,
    tail: { len: 0.5, w: 0.08, droop: -0.1, type: 'touffue' },
  },
  mouton: {
    ground: 0.78, hip: [-0.42, -0.18], shoulder: [0.36, -0.18], depth: 0.5, belly: 1, midTop: 1.05,
    neck: [[0.52, -0.26, 0.2], [0.6, -0.34, 0.18]],
    head: { x: 0.7, y: -0.38, L: 0.5, D: 0.36, tilt: 0.45, snout: 0.75, ear: 'long', earR: 0.45, nose: 'cheval', eye: [0.15, -0.2], eyeR: 0.12, muzzle: false },
    headCol: '#3A302A', legs: 'sabot', legW: 0.065, legCol: '#3A302A', stride: 0.28, cadence: 2.4,
    tail: { len: 0.25, w: 0.07, droop: -1.2, type: 'fine' }, wool: '#F2EEE4',
  },
  chevre: {
    ground: 0.9, hip: [-0.45, -0.32], shoulder: [0.4, -0.3], depth: 0.3,
    neck: [[0.56, -0.44, 0.16], [0.66, -0.62, 0.14]],
    head: { x: 0.74, y: -0.7, L: 0.52, D: 0.3, tilt: 0.5, snout: 0.65, ear: 'pointe', earR: 0.7, nose: 'cheval', horns: 'gazelle', hornL: 0.8, beard: true, eye: [0.15, -0.2], eyeR: 0.13 },
    legs: 'sabot', legW: 0.06, stride: 0.34, cadence: 2.4,
    tail: { len: 0.2, w: 0.05, droop: 0.6, type: 'fine' },
  },
  aurochs: {
    ground: 1.0, hip: [-0.5, -0.3], shoulder: [0.4, -0.34], depth: 0.44, hump: 1.12,
    neck: [[0.6, -0.36, 0.36], [0.72, -0.3, 0.32]],
    head: { x: 0.84, y: -0.24, L: 0.62, D: 0.5, tilt: 0.45, snout: 0.7, ear: 'petit', nose: 'cheval', horns: 'bison', hornL: 1.6, eye: [0.08, -0.15], eyeR: 0.08, muzzle: false },
    legs: 'sabot', legW: 0.1, stride: 0.32, cadence: 1.9,
    tail: { len: 0.6, w: 0.04, droop: -1.2, type: 'touffe' },
  },
};

/* ---- Pour la fin : les races de chiens d'aujourd'hui ---- */
const BREEDS = {
  'race-chihuahua': {
    ground: 0.62, hip: [-0.42, -0.1], shoulder: [0.32, -0.1], depth: 0.28,
    neck: [[0.48, -0.2, 0.2], [0.56, -0.3, 0.19]],
    head: { x: 0.68, y: -0.44, L: 0.5, D: 0.56, snout: 0.28, dome: 0.6, ear: 'pointe', earR: 1.5, nose: 'chien', eye: [0.2, -0.12], eyeR: 0.17 },
    legs: 'patte', legW: 0.07, stride: 0.3, cadence: 3,
    tail: { len: 0.6, w: 0.06, droop: 0.6, curl: 1.0, type: 'fine' },
  },
  'race-teckel': {
    ground: 0.42, hip: [-0.72, -0.05], shoulder: [0.5, -0.05], depth: 0.27,
    neck: [[0.68, -0.14, 0.2], [0.78, -0.2, 0.19]],
    head: { x: 0.9, y: -0.26, L: 0.72, D: 0.4, snout: 0.4, ear: 'tombante', earR: 1.1, nose: 'chien', eye: [0.15, -0.2], eyeR: 0.11 },
    legs: 'patte', legW: 0.08, stride: 0.18, cadence: 3.2,
    tail: { len: 0.7, w: 0.06, droop: -0.2, type: 'fine' },
  },
  'race-caniche': {
    ground: 0.9, hip: [-0.45, -0.25], shoulder: [0.36, -0.25], depth: 0.3,
    neck: [[0.54, -0.38, 0.2], [0.64, -0.5, 0.19]],
    head: { x: 0.74, y: -0.62, L: 0.62, D: 0.42, snout: 0.45, dome: 0.4, ear: 'tombante', earR: 1, earCol: '#E4DED2', nose: 'chien', eye: [0.15, -0.18], eyeR: 0.11 },
    legs: 'patte', legW: 0.07, stride: 0.32, cadence: 2.6, wool: '#F6F2EC',
    tail: { len: 0.35, w: 0.1, droop: 1.1, type: 'fine' },
  },
  'race-dalmatien': {
    ...DOGS.chien, spots: 16, stripeCol: '#1E1E1E',
    head: { ...DOGS.chien.head, ear: 'tombante', earR: 0.9 },
  },
  'race-husky': {
    ...DOGS.loup,
    head: { ...DOGS.loup.head, iris: '#6AB4E8' },
    tail: { len: 0.9, w: 0.12, droop: 0.9, curl: 1.7, type: 'touffue' },
  },
  'race-berger-allemand': {
    ...DOGS.loup, patches: { col: '#2A2420', n: 2 },
    head: { ...DOGS.loup.head, earR: 1.1 },
  },
  'race-labrador': {
    ...DOGS.chien,
    head: { ...DOGS.chien.head, ear: 'tombante', earR: 0.9, snout: 0.55 },
    tail: { len: 0.9, w: 0.12, droop: -0.5, type: 'fine' },
  },
  'race-saint-bernard': {
    ...DOGS.chien, depth: 0.4, patches: { col: '#9A4A22', n: 3 },
    head: { ...DOGS.chien.head, D: 0.58, snout: 0.6, dome: 0.3, ear: 'tombante', earR: 1, earCol: '#7A3A1A' },
  },
};

/** Le défilé de la fin : le loup en tête, puis les chiens, du plus petit au plus grand (k = la taille) */
export const BREED_PARADE = [
  { look: 'loup', name: 'Le loup', color: '#8A8A88', belly: '#E8E4DA', k: 1 },
  { look: 'race-chihuahua', name: 'Chihuahua', color: '#E6BE8E', belly: '#F8E8D2', k: 0.5 },
  { look: 'race-teckel', name: 'Teckel', color: '#8A4A22', belly: '#B97A4A', k: 0.62 },
  { look: 'race-caniche', name: 'Caniche', color: '#F2EEE6', belly: '#FFFFFF', k: 0.72 },
  { look: 'race-dalmatien', name: 'Dalmatien', color: '#F4F2EE', belly: '#FFFFFF', k: 0.92 },
  { look: 'race-husky', name: 'Husky', color: '#8E949C', belly: '#F2F2F2', k: 0.95 },
  { look: 'race-labrador', name: 'Labrador', color: '#E8C27A', belly: '#F6E2B4', k: 0.98 },
  { look: 'race-berger-allemand', name: 'Berger allemand', color: '#C08A4A', belly: '#E2C08A', k: 1.02 },
  { look: 'race-saint-bernard', name: 'Saint-bernard', color: '#F4EEE4', belly: '#FFFFFF', k: 1.3 },
];

// (où sont les pattes : pour que tout le défilé marche sur le même chemin)
for (const b of BREED_PARADE) b.ground = (BREEDS[b.look] || DOGS[b.look]).ground;

addMammals(DOGS);
addMammals(BREEDS);
FRAMES.mouton = { r: 0.17, x: 0.47, y: 0.58 };

/* ============================================================================
   Le joueur : du louveteau au chien de berger. Les évolutions se voient :
   gros nez (flair), fourrure épaisse, oreilles tombantes, queue en
   tire-bouchon, pelage tacheté.
   ============================================================================ */
for (const form of ['louveteau', 'loup', 'chien', 'berger']) {
  const B = DOGS[form];
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const H = { ...B.head };
    if (parts['oreilles-tombantes']) Object.assign(H, { ear: 'tombante', earR: 1.05, earCol: shade(PLAYER.body, -0.22) });
    const P = {
      ...B, head: H,
      // la queue frétille quand on est content
      tail: parts['queue-tire-bouchon'] ? { ...B.tail, droop: 0.9, curl: 1.7, sway: 0.35 } : { ...B.tail, sway: mood === 'happy' ? 0.3 : 0.15 },
    };
    drawMammal(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, P, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.3),
      cute: true, fluffy: !!parts['pelage-epais'] || B.fluffy, bigNose: !!parts.flair,
      patches: parts['pelage-tachete'] ? { col: PLAYER.patch || '#FFFFFF', n: 3 } : null,
    });
  };
  FORM_SPINE[form] = null;
  FRAMES[form] = { r: 0.18, x: 0.47, y: 0.56 };
}

/* ============================================================================
   Les humains, de profil : une tunique en fourrure, des jambières en cuir.
   o : { spear (le chasseur et sa lance), child (un enfant) }
   Quand ils te chassent (« Ouste ! »), ils lèvent le bras en criant.
   ============================================================================ */
const SKINS = ['#C68A5A', '#8D5A3A', '#E2B48A', '#A8704A'];
const HAIR = ['#2A1C14', '#4A2E1A', '#1C1411', '#6A4628'];

function drawPerson(ctx, c, t, o) {
  const r = c.size;
  setDetail(ctx, r);
  const fine = isFine();
  const i = Math.floor((c.seed || 0) * 7) % 4;
  const skin = SKINS[i], hair = HAIR[(i + 1) % 4];
  const col = c.sp.color;
  const dark = shade(col, -0.55);
  const lw = Math.max(0.8, r * 0.035);
  const legCol = '#6A4A30';
  startSide(ctx, c);
  groundShadow(ctx, -0.32 * r, 0.32 * r, 0.98 * r, r * 0.1);
  const ph = (c.walk || 0) * 2.4;
  const sw = Math.sin(ph);
  ctx.translate(0, -Math.abs(Math.cos(ph)) * 0.03 * r);
  const ch = !!o.child;
  const hipY = (ch ? 0.4 : 0.25) * r, footY = 0.98 * r;
  const shY = (ch ? -0.42 : -0.7) * r;
  const headY = (ch ? -0.72 : -1.0) * r, headR = (ch ? 0.27 : 0.22) * r;
  const angry = c.state === 'charge' || c.state === 'alert';
  // les jambes (celle de derrière, plus sombre)
  for (const s of [-1, 1]) {
    const fx = s * sw * 0.24 * r, kx = fx * 0.6 + 0.05 * r, ky = (hipY + footY) / 2;
    const lc = s < 0 ? shade(legCol, -0.25) : legCol;
    limb(ctx, [[0, hipY, 0.11 * r], [kx, ky, 0.09 * r], [fx, footY - 0.05 * r, 0.08 * r]], lc, shade(legCol, -0.5), lw);
    ctx.fillStyle = shade(lc, -0.3);
    ctx.beginPath();
    ctx.ellipse(fx + 0.06 * r, footY - 0.04 * r, 0.11 * r, 0.055 * r, 0, 0, TAU);
    ctx.fill();
  }
  // le bras de derrière
  limb(ctx, [[-0.02 * r, shY + 0.08 * r, 0.075 * r], [-sw * 0.12 * r - 0.04 * r, shY + 0.42 * r, 0.065 * r], [-sw * 0.2 * r, shY + 0.75 * r, 0.06 * r]], shade(skin, -0.2), shade(skin, -0.55), lw);
  // la tunique en fourrure, avec des franges
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-0.17 * r, shY);
  ctx.quadraticCurveTo(0, shY - 0.06 * r, 0.17 * r, shY);
  ctx.lineTo(0.26 * r, hipY + 0.06 * r);
  const n = 7;
  for (let k = 0; k <= n; k++) ctx.lineTo((0.26 - 0.52 * k / n) * r, hipY + (k % 2 ? 0.14 : 0.06) * r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.strokeStyle = shade(col, -0.35);
    ctx.lineWidth = lw * 1.4;
    ctx.beginPath();
    ctx.moveTo(-0.22 * r, (shY + hipY) * 0.42);
    ctx.lineTo(0.22 * r, (shY + hipY) * 0.42);
    ctx.stroke();
  }
  // le col en fourrure claire
  ctx.fillStyle = shade(col, 0.35);
  ctx.beginPath();
  ctx.ellipse(0.02 * r, shY + 0.01 * r, 0.2 * r, 0.07 * r, 0, 0, TAU);
  ctx.fill();
  // la tête
  ctx.fillStyle = skin;
  ctx.strokeStyle = shade(skin, -0.55);
  ctx.beginPath();
  ctx.arc(0.03 * r, headY, headR, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(0.12 * r, headY - headR * 0.85);
  ctx.quadraticCurveTo(-headR * 0.5, headY - headR * 1.25, -headR * 1.05, headY - headR * 0.1);
  ctx.quadraticCurveTo(-headR * 1.2, headY + headR * (ch ? 0.7 : 1.4), -headR * 0.45, headY + headR * (ch ? 0.6 : 1.2));
  ctx.quadraticCurveTo(-headR * 0.2, headY, 0.12 * r, headY - headR * 0.85);
  ctx.fill();
  // le nez, l'œil, la bouche
  ctx.fillStyle = shade(skin, -0.12);
  ctx.beginPath();
  ctx.ellipse(0.03 * r + headR * 0.98, headY + headR * 0.08, headR * 0.16, headR * 0.12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0.03 * r + headR * 0.5, headY - headR * 0.15, headR * 0.12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.6, headR * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (angry) {
    // il crie « Ouste ! » et fronce les sourcils
    ctx.moveTo(0.03 * r + headR * 0.3, headY - headR * 0.42);
    ctx.lineTo(0.03 * r + headR * 0.75, headY - headR * 0.3);
    ctx.stroke();
    ctx.fillStyle = '#5E1B28';
    ctx.beginPath();
    ctx.ellipse(0.03 * r + headR * 0.68, headY + headR * 0.45, headR * 0.13, headR * 0.17, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.moveTo(0.03 * r + headR * 0.45, headY + headR * 0.42);
    ctx.quadraticCurveTo(0.03 * r + headR * 0.65, headY + headR * 0.55, 0.03 * r + headR * 0.82, headY + headR * 0.38);
    ctx.stroke();
  }
  // le bras de devant : il tient la lance, ou il fait de grands gestes
  const hand = angry ? { x: 0.28 * r, y: headY - 0.35 * r + Math.sin(t * 14) * 0.06 * r }
    : o.spear ? { x: 0.22 * r, y: shY + 0.5 * r } : { x: sw * 0.2 * r, y: shY + 0.75 * r };
  if (o.spear && !angry) {
    ctx.strokeStyle = '#6A4A2A';
    ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath();
    ctx.moveTo(0.12 * r, footY - 0.05 * r);
    ctx.lineTo(0.3 * r, headY - 0.75 * r);
    ctx.stroke();
    ctx.fillStyle = '#9A9488';
    ctx.strokeStyle = '#4A463E';
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(0.3 * r, headY - 0.95 * r);
    ctx.lineTo(0.35 * r, headY - 0.72 * r);
    ctx.lineTo(0.26 * r, headY - 0.73 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  limb(ctx, [[0.05 * r, shY + 0.08 * r, 0.08 * r], [(0.05 * r + hand.x) / 2 + 0.06 * r, (shY + hand.y) / 2 + 0.06 * r, 0.068 * r], [hand.x, hand.y, 0.062 * r]], skin, shade(skin, -0.55), lw);
  ctx.restore();
}

LOOKS.humain = (ctx, c, t) => drawPerson(ctx, c, t, {});
LOOKS.chasseur = (ctx, c, t) => drawPerson(ctx, c, t, { spear: true });
LOOKS.enfant = (ctx, c, t) => drawPerson(ctx, c, t, { child: true });
for (const id of ['humain', 'chasseur', 'enfant']) {
  SIDE[id] = [0.25, -0.9];
  FRAMES[id] = { r: 0.17, x: 0.5, y: 0.6 };
}

/* ---------- Un os lancé par les humains (il brille un peu : miam !) ---------- */
LOOKS['os-jete'] = (ctx, c, t) => {
  const r = c.size;
  const glow = 0.25 + Math.sin(t * 4) * 0.12;
  const g = ctx.createRadialGradient(c.x, c.y, r * 0.2, c.x, c.y, r * 1.8);
  g.addColorStop(0, `rgba(255, 240, 170, ${glow})`);
  g.addColorStop(1, 'rgba(255, 240, 170, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r * 1.8, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.seed);
  ctx.fillStyle = '#F4ECD8';
  ctx.strokeStyle = '#8A7A5A';
  ctx.lineWidth = Math.max(0.8, r * 0.08);
  ctx.beginPath();
  ctx.rect(-r * 0.7, -r * 0.13, r * 1.4, r * 0.26);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.moveTo(sx * r * 0.75 + r * 0.2, sy * r * 0.17);
      ctx.arc(sx * r * 0.75, sy * r * 0.17, r * 0.2, 0, TAU);
    }
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F4ECD8';
  ctx.fillRect(-r * 0.7, -r * 0.1, r * 1.4, r * 0.2);
  ctx.restore();
};
FRAMES['os-jete'] = { r: 0.3, x: 0.5, y: 0.5 };

/* ============================================================================
   Le décor : le camp des humains (tentes en peaux, le feu au milieu), le
   village (maisons au toit de paille) et l'enclos des moutons. Vus de dessus.
   ============================================================================ */
/** Le feu, vu de dessus : il vacille, et la fumée monte */
export function campFire(ctx, x, y, s, t) {
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * 6);
  g.addColorStop(0, `rgba(255, 160, 60, ${0.4 + Math.sin(t * 9) * 0.05})`);
  g.addColorStop(1, 'rgba(255, 120, 30, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, s * 6, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  for (const [k, col] of [[1, '#FF7A1A'], [0.65, '#FFB23A'], [0.35, '#FFE58A']]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * TAU;
      const rr = s * k * (0.75 + 0.25 * Math.sin(t * 12 + i * 2.1));
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.fill();
  }
  // la fumée
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.25 + i / 4) % 1;
    ctx.fillStyle = `rgba(200, 200, 200, ${0.28 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin(i * 1.7 + t * 0.6) * s * 0.8 + u * s * 2, y - u * s * 7, s * (0.5 + u * 1.2), 0, TAU);
    ctx.fill();
  }
}

/** Une tente en peaux, vue de dessus (les perches dépassent au sommet) */
function tent(ctx, x, y, R, a) {
  ctx.fillStyle = 'rgba(30, 20, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + R * 0.25, y + R * 0.3, R * 1.05, R * 0.95, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(x - R * 0.2, y - R * 0.2, R * 0.1, x, y, R);
  g.addColorStop(0, '#D2B48A');
  g.addColorStop(1, '#8E6E48');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5A4028';
  ctx.lineWidth = Math.max(1.5, R * 0.05);
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // les coutures entre les peaux
  ctx.strokeStyle = 'rgba(90, 64, 40, 0.6)';
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const b = a + (i / 7) * TAU;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(b) * R, y + Math.sin(b) * R);
  }
  ctx.stroke();
  // l'entrée, tournée vers le feu
  ctx.fillStyle = '#3A2818';
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a) * R * 0.35, y + Math.sin(a) * R * 0.35);
  ctx.lineTo(x + Math.cos(a - 0.35) * R, y + Math.sin(a - 0.35) * R);
  ctx.lineTo(x + Math.cos(a + 0.35) * R, y + Math.sin(a + 0.35) * R);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4A3420';
  ctx.lineWidth = Math.max(1.5, R * 0.06);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const b = a + 0.6 + i * 1.2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(b) * R * 0.28, y + Math.sin(b) * R * 0.28);
  }
  ctx.stroke();
}

/** Une maison ronde au toit de paille (le village, il y a 10 000 ans) */
function hut(ctx, x, y, R) {
  ctx.fillStyle = 'rgba(30, 20, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + R * 0.25, y + R * 0.3, R * 1.05, R * 0.95, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(x - R * 0.25, y - R * 0.25, R * 0.1, x, y, R);
  g.addColorStop(0, '#E4C97A');
  g.addColorStop(1, '#A8853E');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6A5022';
  ctx.lineWidth = Math.max(1.5, R * 0.05);
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110, 80, 30, 0.45)';
  ctx.lineWidth = Math.max(1, R * 0.03);
  for (const k of [0.75, 0.5, 0.25]) {
    ctx.beginPath();
    ctx.arc(x, y, R * k, 0, TAU);
    ctx.stroke();
  }
}

function paintCamp(huts) {
  return (ctx, d) => {
    const rnd = seeded(d.seed);
    // la terre tassée par les pas
    const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
    g.addColorStop(0, huts ? 'rgba(150, 120, 80, 0.6)' : 'rgba(120, 95, 70, 0.6)');
    g.addColorStop(1, 'rgba(120, 95, 70, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, TAU);
    ctx.fill();
    // les tentes (ou les maisons) tout autour
    const n = huts ? 4 : 3;
    const a0 = rnd() * TAU;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU + (rnd() - 0.5) * 0.4;
      const x = d.x + Math.cos(a) * d.r * 0.62, y = d.y + Math.sin(a) * d.r * 0.62;
      if (huts) hut(ctx, x, y, d.r * 0.2);
      else tent(ctx, x, y, d.r * 0.2, a + Math.PI);
    }
    // les pierres du foyer et le bois
    ctx.strokeStyle = '#4A3420';
    ctx.lineCap = 'round';
    ctx.lineWidth = d.r * 0.035;
    ctx.beginPath();
    ctx.moveTo(d.x + d.r * 0.18, d.y + d.r * 0.2);
    ctx.lineTo(d.x + d.r * 0.32, d.y + d.r * 0.14);
    ctx.moveTo(d.x + d.r * 0.2, d.y + d.r * 0.26);
    ctx.lineTo(d.x + d.r * 0.34, d.y + d.r * 0.22);
    ctx.stroke();
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * TAU;
      ctx.fillStyle = i % 2 ? '#8A8680' : '#6E6A64';
      ctx.beginPath();
      ctx.arc(d.x + Math.cos(a) * d.r * 0.12, d.y + Math.sin(a) * d.r * 0.12, d.r * 0.03, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#2A1E16';
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r * 0.09, 0, TAU);
    ctx.fill();
  };
}
const paintTents = paintCamp(false);
const paintHuts = paintCamp(true);

DECORS.camp = (ctx, d, t) => {
  drawSprite(ctx, d, 'camp', d.seed % 3, paintTents, 0, 1.05);
  campFire(ctx, d.x, d.y, d.r * 0.06, t + d.seed);
};
DECORS.village = (ctx, d, t) => {
  drawSprite(ctx, d, 'village', d.seed % 3, paintHuts, 0, 1.05);
  campFire(ctx, d.x, d.y, d.r * 0.06, t + d.seed);
};

/** L'enclos des moutons : une barrière de pieux, avec une entrée */
function paintPen(ctx, d) {
  ctx.fillStyle = 'rgba(210, 200, 120, 0.35)';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.85, 0, TAU);
  ctx.fill();
  const gate = 0.5;                  // l'entrée (en radians)
  ctx.strokeStyle = '#6A4A2A';
  ctx.lineCap = 'round';
  for (const k of [0.83, 0.87]) {
    ctx.lineWidth = d.r * 0.022;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r * k, gate / 2, TAU - gate / 2);
    ctx.stroke();
  }
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const a = gate / 2 + (TAU - gate) * i / n;
    ctx.fillStyle = '#5A3E22';
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * d.r * 0.85, d.y + Math.sin(a) * d.r * 0.85, d.r * 0.03, 0, TAU);
    ctx.fill();
  }
  // un tas de foin
  ctx.fillStyle = '#D9BE5A';
  ctx.beginPath();
  ctx.ellipse(d.x - d.r * 0.3, d.y - d.r * 0.25, d.r * 0.14, d.r * 0.1, 0.4, 0, TAU);
  ctx.fill();
}
DECORS.enclos = (ctx, d) => drawSprite(ctx, d, 'enclos', 0, paintPen, 0, 1.05);
