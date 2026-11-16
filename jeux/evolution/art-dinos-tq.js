// ============================================================================
// Évolution — le niveau des dinosaures, en VUE DE TROIS QUARTS (comme la voie
// des humains : world.style = 'tqv', voir decor-tqv.js). Tout ce qui est
// debout se dessine debout, de profil, avec le dessinateur de profil des
// mammifères (art-profil.js : drawMammal), qui sait aussi faire les bêtes qui
// marchent sur deux pattes (biped), les longs cous (longNeck), les plaques du
// dos (behind) et les bouts de queue (piquants, massue, nageoire).
//   - Le joueur : le tétrapode, le lézard, le premier dinosaure, l'Allosaurus,
//     le T. rex ; ses évolutions se voient (pattes, écailles, griffes, plumes,
//     cornes, grande mâchoire…), ses rayures sont celles du chapitre.
//   - Les dinosaures et leurs cousins : Dimetrodon et sa voile, le cynodonte,
//     Coelophysis, Postosuchus, Plateosaurus, Stegosaurus, Brachiosaurus,
//     Diplodocus, Ceratosaurus, Edmontosaurus, Dakotaraptor, Ankylosaurus,
//     Triceratops, le T. rex rival…
//   - Les petites bêtes : le scorpion, la blatte (les insectes et le
//     mille-pattes sont dans art-humains.js).
//   - Les plantes de l'époque : les arbres anciens (Lepidodendron), les
//     prêles, les cycas, et les nids pleins d'œufs.
// La portée de la gueule (SNOUT) et le bout de la queue (TAIL_TIP : on y mord
// les géants, tailBite) restent ceux du jeu vu de dessus : rien ne change aux
// règles. Les looks s'appellent « th-<nom> ».
// ============================================================================

import { PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SNOUT, shade } from './art.js';
import { drawMammal } from './art-profil.js';
import { groundShadow } from './art-humains.js';

const TAU = Math.PI * 2;
function ell(ctx, x, y, rx, ry, a = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a, 0, TAU);
}
/** La hauteur du dos à l'abscisse x : [y, épaisseur au-dessus] (pour poser plaques, voile, écailles) */
function backAt(pts, x) {
  let a = pts[0], b = pts[pts.length - 1];
  for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { a = pts[i - 1]; b = pts[i]; break; }
  const k = (x - a[0]) / ((b[0] - a[0]) || 1);
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** Le bout de la queue, vu du sol (× taille, vers l'arrière) : c'est là qu'on mord les géants (tailBite) */
export const TAIL_TIP = {};

/* ============================================================================
   CE QUI POUSSE SUR LE CORPS
   ============================================================================ */
/** Des rayures sur le dos (la couleur du chapitre, pour le joueur ; sinon un peu plus sombre) */
const stripes = (n = 6) => (ctx, r, pts, col, dark, lw, fine, c) => {
  if (!fine) return;
  ctx.strokeStyle = c.sp && c.sp.kind === 'player' ? PLAYER.stripe || shade(col, -0.3) : shade(col, -0.22);
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.045;
  ctx.beginPath();
  const x0 = pts[1][0] + 0.05, x1 = pts[4][0];
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + 0.5) / n;
    const [y, tp] = backAt(pts, x);
    ctx.moveTo(x * r, (y - tp * 0.9) * r);
    ctx.quadraticCurveTo((x - 0.04) * r, (y - tp * 0.45) * r, (x + 0.02) * r, (y - tp * 0.1) * r);
  }
  ctx.stroke();
};
/** Des écailles en relief, en rangée sur le dos (le lézard, la peau épaisse du T. rex, Postosuchus) */
function studs(ctx, r, pts, col, dark, lw, fine) {
  if (!fine) return;
  ctx.fillStyle = shade(col, -0.18);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, lw * 0.7);
  const x0 = pts[1][0], x1 = pts[pts.length - 2][0];
  for (let i = 0; i < 9; i++) {
    const x = x0 + (x1 - x0) * (i + 0.5) / 9;
    const [y, tp] = backAt(pts, x);
    ell(ctx, x * r, (y - tp * 0.92) * r, r * 0.045, r * 0.035);
    ctx.fill();
    ctx.stroke();
  }
}
/** Des plumes : une crête de petites touffes sur le dos, de la couleur donnée */
const feathers = (colF) => (ctx, r, pts, col, dark, lw, fine, c) => {
  const cf = typeof colF === 'function' ? colF(c) : colF;
  ctx.fillStyle = cf;
  ctx.strokeStyle = shade(cf, -0.45);
  ctx.lineWidth = Math.max(0.6, lw * 0.8);
  const x0 = pts[1][0], x1 = pts[pts.length - 1][0];
  for (let i = 0; i < 8; i++) {
    const x = x0 + (x1 - x0) * i / 7;
    const [y, tp] = backAt(pts, x);
    const yy = (y - tp * 0.95) * r;
    ctx.beginPath();
    ctx.moveTo((x - 0.06) * r, yy + r * 0.03);
    ctx.quadraticCurveTo((x - 0.1) * r, yy - r * 0.14, (x - 0.16) * r, yy - r * 0.16);
    ctx.quadraticCurveTo((x - 0.02) * r, yy - r * 0.1, (x + 0.05) * r, yy + r * 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
};
/** Les grandes plaques du dos du stégosaure, sur deux rangées */
function plates(ctx, r, pts, col, dark, lw) {
  const x0 = pts[1][0] + 0.05, x1 = pts[pts.length - 2][0];
  for (const far of [true, false]) {
    ctx.fillStyle = far ? shade('#C8743A', -0.25) : '#C8743A';
    ctx.strokeStyle = '#5A2A12';
    ctx.lineWidth = lw;
    for (let i = 0; i < 7; i++) {
      const x = x0 + (x1 - x0) * (i + (far ? 0.5 : 0)) / 7;
      const [y, tp] = backAt(pts, x);
      const h = (0.28 + Math.sin((i / 6) * Math.PI) * 0.22) * (far ? 0.9 : 1);
      const yy = (y - tp * 0.7) * r;
      ctx.beginPath();
      ctx.moveTo((x - 0.1) * r, yy);
      ctx.lineTo((x - 0.08) * r, yy - h * 0.6 * r);
      ctx.lineTo(x * r, yy - h * r);
      ctx.lineTo((x + 0.08) * r, yy - h * 0.6 * r);
      ctx.lineTo((x + 0.1) * r, yy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}
/** La grande voile du dos de Dimetrodon, tenue par de longues épines */
function sail(ctx, r, pts, col, dark, lw) {
  const x0 = pts[1][0] + 0.05, x1 = pts[4][0] + 0.05;
  const top = [];
  for (let i = 0; i <= 8; i++) {
    const x = x0 + (x1 - x0) * i / 8;
    const [y, tp] = backAt(pts, x);
    top.push([x, y - tp * 0.8, y - tp * 0.8 - Math.sin((i / 8) * Math.PI) * 0.75]);
  }
  ctx.fillStyle = '#C86A3A';
  ctx.strokeStyle = '#5A2412';
  ctx.lineWidth = lw;
  ctx.beginPath();
  top.forEach(([x, y0], i) => (i ? ctx.lineTo(x * r, y0 * r) : ctx.moveTo(x * r, y0 * r)));
  for (let i = top.length - 1; i >= 0; i--) {
    const [x, , y1] = top[i];
    if (i === top.length - 1) ctx.lineTo(x * r, y1 * r);
    else ctx.quadraticCurveTo((x + 0.04) * r, (y1 - 0.06) * r, x * r, y1 * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70, 30, 15, 0.6)';
  ctx.lineWidth = Math.max(0.8, r * 0.02);
  ctx.beginPath();
  for (const [x, y0, y1] of top) {
    ctx.moveTo(x * r, y0 * r);
    ctx.lineTo(x * r, y1 * r);
  }
  ctx.stroke();
}
/** L'armure de l'ankylosaure : des rangées de bosses osseuses */
function armor(ctx, r, pts, col, dark, lw) {
  ctx.fillStyle = shade(col, 0.12);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, lw * 0.8);
  const x0 = pts[1][0], x1 = pts[pts.length - 2][0];
  for (const row of [0.85, 0.45, 0.05]) {
    for (let i = 0; i < 8; i++) {
      const x = x0 + (x1 - x0) * (i + (row === 0.45 ? 0.5 : 0.2)) / 8;
      const [y, tp] = backAt(pts, x);
      const yy = (y - tp * row) * r;
      ctx.beginPath();
      ctx.moveTo((x - 0.05) * r, yy + r * 0.02);
      ctx.lineTo(x * r, yy - (row === 0.85 ? 0.1 : 0.05) * r);
      ctx.lineTo((x + 0.05) * r, yy + r * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}
/** La collerette du tricératops, derrière sa tête (dessinée avant elle) */
function frill(ctx, r, pts, col, dark, lw, fine, c) {
  const H = TRICE_HEAD;
  const x = (H.x - 0.12 * H.L) * r, y = (H.y - 0.4 * H.D) * r, R = 0.62 * r;
  ctx.fillStyle = shade(col, 0.1);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x + R * 0.35, y + R * 0.55);
  ctx.quadraticCurveTo(x - R * 0.55, y + R * 0.2, x - R * 0.35, y - R * 0.55);
  ctx.quadraticCurveTo(x, y - R * 0.95, x + R * 0.5, y - R * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#C8743A';
  for (let i = 0; i < 6; i++) {
    const a = -2.6 + i * 0.42;
    ell(ctx, x + Math.cos(a) * R * 0.62, y + Math.sin(a) * R * 0.62, R * 0.08, R * 0.08);
    ctx.fill();
    ctx.stroke();
  }
}

/* ---- Ce qui pousse sur la tête (repère de la tête : L vers l'avant, D vers le bas) ---- */
function triceHorns(ctx, L, D, c, col, dark, lw) {
  ctx.fillStyle = '#EDE2C6';
  ctx.strokeStyle = '#5A4A30';
  ctx.lineWidth = lw;
  for (const [x0, x1, tx, ty] of [[-0.08, 0.1, 0.45, -1.35], [0.52, 0.66, 0.78, -0.62]]) {
    ctx.beginPath();
    ctx.moveTo(x0 * L, -0.42 * D);
    ctx.quadraticCurveTo((x0 + 0.1) * L, (ty * 0.55) * D, tx * L, ty * D);
    ctx.quadraticCurveTo((x1 + 0.08) * L, (ty * 0.5) * D, x1 * L, -0.38 * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // le bec
  ctx.fillStyle = '#4A3A2A';
  ctx.beginPath();
  ctx.moveTo(0.62 * L, 0.1 * D);
  ctx.quadraticCurveTo(0.86 * L, 0.0, 0.8 * L, 0.32 * D);
  ctx.lineTo(0.62 * L, 0.24 * D);
  ctx.closePath();
  ctx.fill();
}
/** Les petites cornes au-dessus des yeux (l'Allosaurus) ; big = l'évolution « cornes » */
const browHorns = (big = 1) => (ctx, L, D, c, col, dark, lw) => {
  ctx.fillStyle = shade(col, -0.25);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  for (const x of [0.02, 0.3]) {
    ctx.beginPath();
    ctx.moveTo((x - 0.08) * L, -0.48 * D);
    ctx.lineTo((x + 0.02) * L, (-0.48 - 0.32 * big) * D);
    ctx.lineTo((x + 0.1) * L, -0.46 * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
};
/** La corne sur le nez du Ceratosaurus, et sa petite crête */
function noseHorn(ctx, L, D, c, col, dark, lw) {
  browHorns(0.6)(ctx, L, D, c, col, dark, lw);
  ctx.fillStyle = '#EDE2C6';
  ctx.strokeStyle = '#5A4A30';
  ctx.beginPath();
  ctx.moveTo(0.42 * L, -0.38 * D);
  ctx.lineTo(0.52 * L, -0.85 * D);
  ctx.lineTo(0.6 * L, -0.34 * D);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
/** Le bec de canard d'Edmontosaurus */
function duckBill(ctx, L, D) {
  ctx.fillStyle = '#C9B48A';
  ctx.strokeStyle = '#5A4A30';
  ctx.beginPath();
  ctx.moveTo(0.5 * L, -0.15 * D);
  ctx.quadraticCurveTo(0.95 * L, -0.25 * D, 0.92 * L, 0.05 * D);
  ctx.quadraticCurveTo(0.9 * L, 0.22 * D, 0.5 * L, 0.18 * D);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
/** Le petit bec des dinosaures qui mangent des plantes */
function beak(ctx, L, D) {
  ctx.fillStyle = '#5A4A34';
  ctx.beginPath();
  ctx.moveTo(0.6 * L, -0.08 * D);
  ctx.quadraticCurveTo(0.82 * L, -0.02 * D, 0.74 * L, 0.2 * D);
  ctx.lineTo(0.6 * L, 0.14 * D);
  ctx.closePath();
  ctx.fill();
}
/** Les pointes à l'arrière de la tête de l'ankylosaure */
function ankyHead(ctx, L, D, c, col, dark, lw) {
  ctx.fillStyle = shade(col, 0.1);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  for (const [x, y] of [[-0.3, -0.35], [-0.32, 0.05]]) {
    ctx.beginPath();
    ctx.moveTo(x * L, (y - 0.12) * D);
    ctx.lineTo((x - 0.22) * L, y * D);
    ctx.lineTo(x * L, (y + 0.12) * D);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  beak(ctx, L, D);
}

/* ============================================================================
   LES MESURES DE CHAQUE BÊTE (voir art-profil.js : drawMammal)
   ============================================================================ */
const TRICE_HEAD = { x: 0.84, y: -0.36, L: 0.8, D: 0.6, snout: 0.55, eye: [0.05, -0.15], eyeR: 0.08, noseCol: '#2A2024', muzzle: false, extra: triceHorns };
const THEROPODE = {
  ground: 1.0, hip: [-0.3, -0.45], shoulder: [0.35, -0.42], depth: 0.38, hipTop: 1.05, belly: 0.95,
  neck: [[0.55, -0.55, 0.26], [0.68, -0.72, 0.24]],
  head: { x: 0.86, y: -0.8, L: 0.9, D: 0.52, snout: 0.6, eye: [0.08, -0.22], eyeR: 0.09, teeth: true, gape: 0.6, noseCol: '#2A2024' },
  legW: 0.16, stride: 0.42, cadence: 1.9, biped: { L: 0.42, w: 0.06 },
  tail: { len: 1.7, w: 0.3, droop: 0.15, curl: -0.1, base: 0.15, sway: 0.12, type: 'pointe' }, extra: stripes(),
};
const DINOS = {
  // le joueur (et ses rivaux)…
  tetrapode: {
    ground: 0.32, hip: [-0.5, 0.02], shoulder: [0.4, 0.02], depth: 0.3,
    neck: [[0.56, -0.02, 0.24], [0.64, -0.04, 0.22]],
    head: { x: 0.78, y: -0.06, L: 0.7, D: 0.42, snout: 0.3, eye: [0.1, -0.32], eyeR: 0.14, teeth: true, noseCol: '#2A3A34' },
    legW: 0.075, stride: 0.2, cadence: 2.4,
    tail: { len: 1.0, w: 0.16, droop: 0, base: 0.3, sway: 0.25, type: 'pointe', end: 'nageoire' }, extra: stripes(5),
  },
  reptile: {
    ground: 0.38, hip: [-0.42, 0], shoulder: [0.36, 0], depth: 0.26,
    neck: [[0.52, -0.04, 0.2], [0.6, -0.06, 0.18]],
    head: { x: 0.74, y: -0.1, L: 0.62, D: 0.4, snout: 0.4, eye: [0.12, -0.2], eyeR: 0.14, noseCol: '#2A3A20' },
    legW: 0.07, stride: 0.26, cadence: 3,
    tail: { len: 1.6, w: 0.14, droop: 0.05, base: 0.3, sway: 0.3, type: 'pointe' }, extra: stripes(5),
  },
  'premier-dino': {
    ...THEROPODE, ground: 0.95, depth: 0.3,
    neck: [[0.52, -0.55, 0.18], [0.62, -0.74, 0.16]],
    head: { x: 0.78, y: -0.82, L: 0.62, D: 0.42, snout: 0.5, eye: [0.12, -0.2], eyeR: 0.12, teeth: true, noseCol: '#2A2024' },
    legW: 0.11, biped: { L: 0.4, w: 0.05 }, tail: { ...THEROPODE.tail, len: 1.5, w: 0.2 },
  },
  allosaure: { ...THEROPODE, head: { ...THEROPODE.head, extra: browHorns(0.5) } },
  trex: {
    ...THEROPODE, depth: 0.44, hipTop: 1.1,
    neck: [[0.55, -0.55, 0.32], [0.66, -0.66, 0.3]],
    head: { x: 0.82, y: -0.72, L: 1.05, D: 0.62, snout: 0.6, eye: [0.02, -0.24], eyeR: 0.08, teeth: true, gape: 0.7, noseCol: '#2A2024' },
    legW: 0.19, biped: { L: 0.22, w: 0.045 },
  },
  // … les cousins et les dinosaures de chaque époque
  dimetrodon: {
    ground: 0.5, hip: [-0.45, -0.05], shoulder: [0.4, -0.05], depth: 0.3,
    neck: [[0.56, -0.1, 0.24], [0.64, -0.12, 0.22]],
    head: { x: 0.78, y: -0.14, L: 0.6, D: 0.44, snout: 0.45, eye: [0.1, -0.2], eyeR: 0.1, teeth: true, gape: 0.7, noseCol: '#2A2024' },
    legW: 0.1, stride: 0.22, cadence: 2.2, behind: sail,
    tail: { len: 1.2, w: 0.14, droop: 0.1, base: 0.25, type: 'pointe' },
  },
  cynodonte: {
    ground: 0.55, hip: [-0.5, -0.06], shoulder: [0.4, -0.06], depth: 0.3,
    neck: [[0.56, -0.12, 0.22], [0.66, -0.18, 0.2]],
    head: { x: 0.78, y: -0.26, L: 0.6, D: 0.44, snout: 0.4, ear: 'rond', earR: 0.5, eye: [0.14, -0.18], eyeR: 0.13, teeth: true },
    legW: 0.08, stride: 0.26, cadence: 2.8,
    tail: { len: 0.8, w: 0.07, droop: 0.4, type: 'fine' },
  },
  coelophysis: {
    ...THEROPODE, ground: 1.0, depth: 0.26,
    neck: [[0.5, -0.55, 0.16], [0.62, -0.8, 0.14]],
    head: { x: 0.76, y: -0.9, L: 0.7, D: 0.36, snout: 0.6, eye: [0.12, -0.2], eyeR: 0.11, teeth: true, noseCol: '#2A2024' },
    legW: 0.1, biped: { L: 0.36, w: 0.045 }, tail: { ...THEROPODE.tail, len: 1.8, w: 0.18 },
  },
  postosuchus: {
    ground: 0.85, hip: [-0.45, -0.3], shoulder: [0.35, -0.28], depth: 0.36,
    neck: [[0.54, -0.34, 0.26], [0.64, -0.38, 0.24]],
    head: { x: 0.8, y: -0.38, L: 0.9, D: 0.5, snout: 0.55, eye: [0.0, -0.2], eyeR: 0.08, teeth: true, gape: 0.7, noseCol: '#2A2024' },
    legW: 0.12, stride: 0.3, cadence: 2,
    tail: { len: 1.5, w: 0.2, droop: 0.2, base: 0.2, type: 'pointe' }, extra: studs,
  },
  plateosaure: {
    ...THEROPODE, ground: 1.1, depth: 0.42, neck: [[0.5, -0.6, 0.2]],
    longNeck: { pts: [[0.45, -0.62], [0.65, -0.8], [0.8, -1.05], [0.92, -1.25]], w0: 0.2, w1: 0.1 },
    head: { x: 0.98, y: -1.32, L: 0.45, D: 0.32, snout: 0.5, eye: [0.12, -0.2], eyeR: 0.13, noseCol: '#2A2024', extra: beak },
    legW: 0.15, biped: { L: 0.5, w: 0.07 }, extra: null,
  },
  compsognathus: {
    ...THEROPODE, ground: 0.95, depth: 0.28,
    neck: [[0.5, -0.55, 0.15], [0.6, -0.76, 0.13]],
    head: { x: 0.74, y: -0.84, L: 0.55, D: 0.36, snout: 0.5, eye: [0.12, -0.2], eyeR: 0.14, teeth: true, noseCol: '#2A2024' },
    legW: 0.09, biped: { L: 0.3, w: 0.04 }, tail: { ...THEROPODE.tail, len: 1.6, w: 0.15 },
  },
  dryosaure: {
    ...THEROPODE, ground: 1.0, depth: 0.32,
    neck: [[0.5, -0.55, 0.18], [0.6, -0.74, 0.16]],
    head: { x: 0.74, y: -0.82, L: 0.5, D: 0.42, snout: 0.45, eye: [0.14, -0.2], eyeR: 0.15, noseCol: '#2A2024', extra: beak },
    legW: 0.12, biped: { L: 0.3, w: 0.05 }, extra: null,
  },
  edmontosaure: {
    ...THEROPODE, ground: 1.05, depth: 0.42,
    neck: [[0.52, -0.55, 0.24], [0.64, -0.7, 0.22]],
    head: { x: 0.8, y: -0.76, L: 0.9, D: 0.48, snout: 0.7, eye: [0.06, -0.22], eyeR: 0.1, noseCol: '#2A2024', extra: duckBill },
    legW: 0.17, biped: { L: 0.62, w: 0.07, claws: 0.4 }, extra: stripes(4),
  },
  ceratosaure: { ...THEROPODE, head: { ...THEROPODE.head, extra: noseHorn } },
  dakotaraptor: {
    ...THEROPODE, ground: 1.0, depth: 0.32,
    neck: [[0.52, -0.55, 0.2], [0.64, -0.74, 0.18]],
    head: { x: 0.8, y: -0.82, L: 0.72, D: 0.44, snout: 0.55, eye: [0.1, -0.22], eyeR: 0.11, teeth: true, gape: 0.6, iris: '#D9A13A', noseCol: '#2A2024' },
    legW: 0.13, biped: { L: 0.5, w: 0.06, claws: 1.4 }, extra: feathers((c) => shade(c.sp.color || '#5A5288', 0.25)),
  },
  stegosaure: {
    ground: 0.95, hip: [-0.4, -0.5], shoulder: [0.4, -0.3], depth: 0.45, hipTop: 1.25, belly: 1.0,
    neck: [[0.6, -0.3, 0.18], [0.72, -0.28, 0.16]],
    head: { x: 0.86, y: -0.28, L: 0.45, D: 0.3, snout: 0.5, eye: [0.1, -0.2], eyeR: 0.11, noseCol: '#2A2024', extra: beak },
    legW: 0.14, foreW: 0.85, stride: 0.25, cadence: 1.6, behind: plates,
    tail: { len: 1.2, w: 0.2, droop: 0.2, base: 0.25, type: 'pointe', end: 'piquants' },
  },
  ankylosaure: {
    ground: 0.75, hip: [-0.4, -0.25], shoulder: [0.38, -0.25], depth: 0.45, belly: 1.0,
    neck: [[0.56, -0.24, 0.26], [0.64, -0.22, 0.24]],
    head: { x: 0.74, y: -0.2, L: 0.45, D: 0.4, snout: 0.45, eye: [0.1, -0.18], eyeR: 0.1, noseCol: '#2A2024', extra: ankyHead },
    legW: 0.15, stride: 0.2, cadence: 1.7, extra: armor,
    tail: { len: 0.9, w: 0.14, droop: 0.1, base: 0.25, type: 'pointe', end: 'massue' },
  },
  triceratops: {
    ground: 0.95, hip: [-0.45, -0.35], shoulder: [0.35, -0.3], depth: 0.48, hump: 1.05, belly: 1.0,
    neck: [[0.55, -0.32, 0.3]],
    head: TRICE_HEAD, legW: 0.15, stride: 0.26, cadence: 1.7, extra: frill,
    tail: { len: 0.8, w: 0.18, droop: 0.4, base: 0.2, type: 'pointe' },
  },
  brachiosaure: {
    ground: 1.5, hip: [-0.45, -0.55], shoulder: [0.35, -0.8], depth: 0.55, hump: 1.1, belly: 1.0, pillar: true,
    neck: [[0.55, -0.95, 0.32]],
    longNeck: { pts: [[0.5, -1.0], [0.8, -1.6], [0.9, -2.2], [1.0, -2.7]], w0: 0.26, w1: 0.1 },
    head: { x: 1.08, y: -2.78, L: 0.4, D: 0.3, snout: 0.45, dome: 0.6, eye: [0.1, -0.2], eyeR: 0.11, muzzle: false, noseCol: '#2A2024' },
    legW: 0.17, stride: 0.2, cadence: 1.2,
    tail: { len: 0.9, w: 0.22, droop: 0.5, base: 0.2, type: 'pointe' },
  },
  diplodocus: {
    ground: 1.15, hip: [-0.45, -0.45], shoulder: [0.35, -0.42], depth: 0.5, belly: 1.0, pillar: true,
    neck: [[0.55, -0.5, 0.3]],
    longNeck: { pts: [[0.5, -0.55], [0.9, -0.75], [1.2, -1.0], [1.5, -1.2]], w0: 0.22, w1: 0.08 },
    head: { x: 1.58, y: -1.25, L: 0.38, D: 0.26, snout: 0.5, eye: [0.1, -0.2], eyeR: 0.11, muzzle: false, noseCol: '#2A2024' },
    legW: 0.15, stride: 0.2, cadence: 1.2,
    tail: { len: 2.2, w: 0.22, droop: -0.05, base: 0.25, curl: 0.15, sway: 0.15, type: 'pointe' },
  },
};
DINOS['trex-rival'] = DINOS.trex;

/** La portée de la gueule (la même que vu de dessus : rien ne change au jeu) */
const BITE = {
  tetrapode: 0.545, reptile: 0.44, 'premier-dino': 0.515, allosaure: 0.65, trex: 0.762, 'trex-rival': 0.762, dimetrodon: 0.515, cynodonte: 0.41,
  coelophysis: 0.5, postosuchus: 0.665, plateosaure: 0.305, compsognathus: 0.395, dryosaure: 0.38, stegosaure: 0.305, brachiosaure: 0.29,
  diplodocus: 0.29, ceratosaure: 0.62, edmontosaure: 0.575, dakotaraptor: 0.47, ankylosaure: 0.44, triceratops: 0.71,
};

/** Où est le bout de la queue, en × taille, vers l'arrière (pour mordre la queue des géants) */
function tailTipOf(P) {
  const T = P.tail;
  return (P.hip[0] - P.depth * 0.82) - T.len * 0.8 * Math.cos(T.droop || 0);
}

for (const [id, P] of Object.entries(DINOS)) {
  const look = `th-${id}`;
  LOOKS[look] = (ctx, c, t) => drawMammal(ctx, { ...c, y: c.y - P.ground * c.size }, t, P, c.sp.color, { belly: c.sp.belly, stripe: c.sp.stripe });
  FRAMES[look] = { r: P.longNeck ? 0.16 : 0.22, x: P.longNeck ? 0.42 : 0.5, y: P.longNeck ? 0.88 : 0.8 };
  SNOUT[look] = BITE[id] ?? 0.55;
  TAIL_TIP[look] = tailTipOf(P);
}

/* ---- Le joueur : sa forme à chaque époque, et ses évolutions qui se voient ---- */
const FORM_PARTS = {
  tetrapode: (P, B) => {
    if (P.pattes) Object.assign(B, { ground: B.ground * 1.3, legW: B.legW * 1.25 });
    if (P.poumons) B.depth = B.depth * 1.12;
  },
  reptile: (P, B) => {
    if (P.ecailles) B.extra = studs;
    if (P['longues-pattes']) B.ground = B.ground * 1.3;
  },
  'premier-dino': (P, B) => {
    if (P.griffes) B.biped = { ...B.biped, L: B.biped.L * 1.35, claws: 1.6 };
    if (P.plumes) B.extra = feathers('#F2C14E');
  },
  allosaure: (P, B) => {
    if (P.cornes) B.head = { ...B.head, extra: browHorns(1.3) };
    if (P.machoire) B.head = { ...B.head, L: B.head.L * 1.12, D: B.head.D * 1.12 };
  },
  trex: (P, B) => {
    if (P.morsure) B.head = { ...B.head, L: B.head.L * 1.12, D: B.head.D * 1.12 };
    if (P['peau-epaisse']) B.extra = studs;
  },
};
const CACHE = new Map();
for (const [id, make] of Object.entries(FORM_PARTS)) {
  const form = `th-${id}`;
  FORM_SPINE[form] = null;
  FRAMES[form] = FRAMES[`th-${id}`];
  SNOUT[form] = BITE[id];
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const P = parts || {};
    const key = id + Object.keys(P).filter((k) => P[k]).sort().join(',');
    let B = CACHE.get(key);
    if (!B) {
      B = { ...DINOS[id], head: { ...DINOS[id].head } };
      make(P, B);
      CACHE.set(key, B);
    }
    drawMammal(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0, y: p.y - B.ground * p.size }, t, B, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.3), cute: true,
    });
  };
}

/* ============================================================================
   LES PETITES BÊTES : le scorpion (de profil), la blatte
   ============================================================================ */
/** Le scorpion : ses pinces devant, sa queue recourbée au-dessus du dos, et son dard */
LOOKS['th-scorpion'] = (ctx, c, t) => {
  const r = c.size, col = c.sp.color, dark = shade(col, -0.55);
  const face = c.face || (Math.cos(c.angle || 0) >= 0 ? 1 : -1);
  groundShadow(ctx, c.x, c.y, r * 1.2, r * 0.25, 0.22);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  const ph = (c.walk || 0) * 5, lw = Math.max(0.6, r * 0.06);
  // les pattes
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x = (-0.3 + i * 0.22) * r, sw = Math.sin(ph + i * 1.6) * r * 0.1;
    ctx.moveTo(x, -r * 0.3);
    ctx.lineTo(x - r * 0.12 + sw, -r * 0.42);
    ctx.lineTo(x - r * 0.2 + sw, 0);
  }
  ctx.stroke();
  // la queue, anneau par anneau, et le dard
  const strike = (c.mouth || 0) * 0.4;
  const seg = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + 0.2 + i * (0.48 + strike * 0.1);
    seg.push([-0.45 * r + Math.cos(a) * r * 0.45 * (1 - i * 0.04) + r * 0.45 * Math.cos(Math.PI + 0.2), -r * 0.35 + Math.sin(a) * r * 0.55]);
  }
  ctx.fillStyle = shade(col, 0.08);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  seg.forEach(([x, y], i) => {
    ell(ctx, x, y, r * (0.16 - i * 0.012), r * (0.13 - i * 0.01));
    ctx.fill();
    ctx.stroke();
  });
  const [sx, sy] = seg[seg.length - 1];
  ctx.fillStyle = '#3A1E10';
  ctx.beginPath();
  ctx.moveTo(sx - r * 0.06, sy);
  ctx.quadraticCurveTo(sx + r * 0.18, sy + r * 0.02, sx + r * 0.2, sy + r * 0.22);
  ctx.quadraticCurveTo(sx + r * 0.05, sy + r * 0.12, sx - r * 0.02, sy + r * 0.08);
  ctx.closePath();
  ctx.fill();
  // le corps
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ell(ctx, -r * 0.1, -r * 0.32, r * 0.48, r * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo((-0.4 + i * 0.18) * r, -r * 0.5);
    ctx.lineTo((-0.42 + i * 0.18) * r, -r * 0.16);
  }
  ctx.stroke();
  // les pinces
  for (const far of [true, false]) {
    const k = far ? 0.9 : 1, open = 0.2 + Math.abs(Math.sin(t * 2 + (c.seed || 0))) * 0.25;
    ctx.fillStyle = far ? shade(col, -0.25) : shade(col, 0.1);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(r * 0.3, -r * 0.34);
    ctx.lineTo(r * 0.6 * k, -r * (far ? 0.5 : 0.42));
    ctx.stroke();
    const px = r * 0.72 * k, py = -r * (far ? 0.52 : 0.44);
    ell(ctx, px, py, r * 0.16, r * 0.1);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + r * 0.1, py - r * 0.04);
    ctx.lineTo(px + r * 0.3, py - r * (0.06 + open * 0.3));
    ctx.moveTo(px + r * 0.1, py + r * 0.04);
    ctx.lineTo(px + r * 0.28, py + r * (0.04 + open * 0.2));
    ctx.stroke();
  }
  // les yeux
  ctx.fillStyle = '#1A1210';
  ell(ctx, r * 0.26, -r * 0.46, r * 0.04, r * 0.04);
  ctx.fill();
  ctx.restore();
};
FRAMES['th-scorpion'] = { r: 0.26, x: 0.5, y: 0.72 };
SNOUT['th-scorpion'] = 0.7;

/** La blatte géante : un grand dos ovale et brillant, de longues antennes */
LOOKS['th-blatte'] = (ctx, c, t) => {
  const r = c.size, col = c.sp.color, dark = shade(col, -0.55);
  const face = c.face || (Math.cos(c.angle || 0) >= 0 ? 1 : -1);
  groundShadow(ctx, c.x, c.y, r * 1.1, r * 0.22, 0.22);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face, 1);
  const ph = (c.walk || 0) * 6;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.6, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const x = (-0.35 + i * 0.35) * r, sw = Math.sin(ph + i * 2) * r * 0.12;
    ctx.moveTo(x, -r * 0.25);
    ctx.lineTo(x + sw - r * 0.1, -r * 0.1);
    ctx.lineTo(x + sw - r * 0.2, 0);
  }
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.lineWidth = Math.max(0.6, r * 0.06);
  ell(ctx, -r * 0.05, -r * 0.32, r * 0.7, r * 0.24);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, -r * 0.4, r * 0.45, r * 0.1, 0, Math.PI * 1.1, Math.PI * 1.8);
  ctx.stroke();
  ctx.fillStyle = shade(col, -0.2);
  ell(ctx, r * 0.66, -r * 0.3, r * 0.14, r * 0.12);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.5, r * 0.035);
  ctx.beginPath();
  ctx.moveTo(r * 0.76, -r * 0.36);
  ctx.quadraticCurveTo(r * 1.1, -r * 0.8, r * 1.45, -r * 0.7);
  ctx.moveTo(r * 0.74, -r * 0.38);
  ctx.quadraticCurveTo(r * 1.0, -r * 0.95, r * 1.3, -r * 0.95);
  ctx.stroke();
  ctx.restore();
};
FRAMES['th-blatte'] = { r: 0.26, x: 0.45, y: 0.66 };

/* ============================================================================
   LES PLANTES DE L'ÉPOQUE (dessinées par decor-tqv.js)
   d : { x, y, r, seed } ; pal : les couleurs du chapitre
   ============================================================================ */
/** Un arbre très ancien (Lepidodendron, du Carbonifère) : un tronc droit couvert d'écailles en
    losanges, qui se divise en deux, et des touffes de longues feuilles au bout des branches */
export function drawAncientTree(ctx, d, t, pal) {
  const { x, y, r } = d;
  const sw = Math.sin(t * 0.7 + d.seed) * r * 0.04;
  const H = r * 3.0, tw = r * 0.2;
  groundShadow(ctx, x + r * 0.1, y, r * 0.8, r * 0.24, 0.22);
  const bark = '#5E6A3A';
  const g = ctx.createLinearGradient(x - tw, 0, x + tw, 0);
  g.addColorStop(0, shade(bark, -0.2));
  g.addColorStop(0.45, shade(bark, 0.12));
  g.addColorStop(1, shade(bark, -0.35));
  ctx.fillStyle = g;
  ctx.strokeStyle = shade(bark, -0.6);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - tw * 1.4, y + 2);
  ctx.quadraticCurveTo(x - tw, y - H * 0.3, x - tw * 0.8, y - H);
  ctx.lineTo(x + tw * 0.8, y - H);
  ctx.quadraticCurveTo(x + tw, y - H * 0.3, x + tw * 1.4, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // les écailles en losanges
  ctx.strokeStyle = 'rgba(30, 40, 15, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const yy = y - H * (0.08 + i * 0.1);
    ctx.moveTo(x - tw * 0.8, yy);
    ctx.lineTo(x, yy - H * 0.05);
    ctx.lineTo(x + tw * 0.8, yy);
  }
  ctx.stroke();
  // deux branches, puis encore deux, avec leurs touffes
  const leaf = pal.leaf || ['#2E5E2A', '#3E7A34', '#5E9A44'];
  const tips = [];
  for (const s of [-1, 1]) {
    const bx = x + s * r * 0.55 + sw, by = y - H - r * 0.55;
    for (const [w, col] of [[tw * 1.2 + 4, shade(bark, -0.6)], [tw * 1.2, bark]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y - H + 2);
      ctx.quadraticCurveTo(x + s * r * 0.15, by + r * 0.2, bx, by);
      ctx.stroke();
    }
    tips.push([bx - r * 0.22, by - r * 0.2], [bx + r * 0.22, by - r * 0.25]);
  }
  for (const [tx, ty] of tips) {
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.36;
      ctx.strokeStyle = leaf[i % 3];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * r * 0.3, ty + Math.sin(a) * r * 0.3, tx + Math.cos(a) * r * 0.45 + sw, ty + Math.sin(a) * r * 0.42 + r * 0.12);
      ctx.stroke();
    }
  }
}

/** Une touffe de prêles : des tiges vertes, en anneaux, avec leurs petits épis */
export function drawHorsetail(ctx, d, t, pal) {
  const { x, y, r } = d;
  const col = pal.fern || '#5E8A34';
  groundShadow(ctx, x, y, r * 0.8, r * 0.2, 0.18);
  for (let i = 0; i < 6; i++) {
    const fx = x + (i - 2.5) * r * 0.28, h = r * (1.6 + ((d.seed >> i) % 5) * 0.2);
    const sw = Math.sin(t * 1.5 + i + d.seed) * r * 0.08;
    ctx.strokeStyle = i % 2 ? col : shade(col, 0.12);
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.quadraticCurveTo(fx, y - h * 0.5, fx + sw, y - h);
    ctx.stroke();
    ctx.strokeStyle = shade(col, -0.4);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 1; k < 5; k++) {
      const yy = y - h * k / 5, xx = fx + sw * (k / 5) ** 2;
      ctx.moveTo(xx - r * 0.1, yy);
      ctx.lineTo(xx + r * 0.1, yy);
    }
    ctx.stroke();
    ctx.fillStyle = '#8A6A34';
    ell(ctx, fx + sw, y - h - r * 0.08, r * 0.07, r * 0.14);
    ctx.fill();
  }
}

/** Un cycas : un petit tronc trapu, en écailles, et une couronne de grandes feuilles raides */
export function drawCycad(ctx, d, t, pal) {
  const { x, y, r } = d;
  const leaf = pal.leaf || ['#2E5E2A', '#3E7A34', '#5E9A44'];
  groundShadow(ctx, x, y, r * 1.1, r * 0.3, 0.22);
  const H = r * 0.9;
  ctx.fillStyle = '#7A5A34';
  ctx.strokeStyle = '#3A2414';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.3, y);
  ctx.quadraticCurveTo(x - r * 0.38, y - H * 0.5, x - r * 0.22, y - H);
  ctx.lineTo(x + r * 0.22, y - H);
  ctx.quadraticCurveTo(x + r * 0.38, y - H * 0.5, x + r * 0.3, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40, 20, 8, 0.4)';
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    ctx.moveTo(x - r * 0.3, y - H * i / 5);
    ctx.lineTo(x + r * 0.3, y - H * i / 5 + r * 0.06);
  }
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.36 + Math.sin(t + i + d.seed) * 0.03;
    const L = r * (1.1 + (i % 2) * 0.2), ex = x + Math.cos(a) * L * 1.2, ey = y - H + Math.sin(a) * L * 0.6 + L * 0.3;
    ctx.strokeStyle = shade(leaf[i % 3], -0.3);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y - H);
    ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.6, y - H - L * 0.4, ex, ey);
    ctx.stroke();
    ctx.strokeStyle = leaf[i % 3];
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 1; k <= 6; k++) {
      const u = k / 7;
      const px = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * (x + Math.cos(a) * L * 0.6) + u * u * ex;
      const py = (1 - u) * (1 - u) * (y - H) + 2 * (1 - u) * u * (y - H - L * 0.4) + u * u * ey;
      ctx.moveTo(px, py);
      ctx.lineTo(px + r * 0.12, py + r * 0.14);
      ctx.moveTo(px, py);
      ctx.lineTo(px - r * 0.12, py + r * 0.14);
    }
    ctx.stroke();
  }
}

/** Un nid de dinosaure : un anneau de terre et de branches, et ses gros œufs tachetés */
export function drawDinoNest(ctx, d) {
  const { x, y, r } = d;
  groundShadow(ctx, x, y + 2, r * 1.2, r * 0.35, 0.25);
  ctx.fillStyle = '#8A6A44';
  ctx.strokeStyle = '#4A3420';
  ctx.lineWidth = 2.5;
  ell(ctx, x, y - r * 0.12, r * 1.1, r * 0.42);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5A4028';
  ell(ctx, x, y - r * 0.16, r * 0.8, r * 0.26);
  ctx.fill();
  const rnd = (i) => ((d.seed * 9301 + i * 49297) % 233280) / 233280;
  for (let i = 0; i < 5; i++) {
    const ex = x + (i - 2) * r * 0.3, ey = y - r * (0.25 + (i % 2) * 0.08);
    ctx.fillStyle = '#F2EAD2';
    ctx.strokeStyle = '#8A7A5A';
    ctx.lineWidth = 2;
    ell(ctx, ex, ey, r * 0.17, r * 0.24, (i - 2) * 0.15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#A8885A';
    ell(ctx, ex + (rnd(i) - 0.5) * r * 0.1, ey - r * 0.06, r * 0.03, r * 0.04);
    ctx.fill();
  }
  ctx.strokeStyle = '#6A4A28';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    ctx.moveTo(x + Math.cos(a) * r * 0.9, y - r * 0.12 + Math.sin(a) * r * 0.35);
    ctx.lineTo(x + Math.cos(a + 0.5) * r * 1.15, y - r * 0.12 + Math.sin(a + 0.5) * r * 0.4);
  }
  ctx.stroke();
}
