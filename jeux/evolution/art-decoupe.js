// ============================================================================
// Évolution — les animaux en « PAPIER DÉCOUPÉ » (comme dans un livre illustré
// qui s'anime). Chaque animal est un vrai dessin, découpé en morceaux : le
// corps, le cou, la tête, la mâchoire, les oreilles, chaque patte en deux
// parties (la cuisse et le bas de la patte), la queue. Chaque morceau tourne
// autour d'une articulation FIXE : une patte reste toujours accrochée à
// l'épaule, elle ne peut pas se balader hors du corps.
//
// Trois vues, choisies selon la direction : de profil (retourné vers la
// gauche), de face (quand il descend vers nous), de dos (quand il monte).
// Les animaux restent debout, vus d'un peu au-dessus, comme les humains.
//
// Le rendu : des aplats doux avec leur ombre propre (le bas de chaque morceau
// est plus sombre), un contour dans une couleur foncée de l'animal (pas du
// noir), des yeux en amande avec un iris, une pupille et un reflet.
//
// Les dessins sont écrits en « unités » : 100 = la taille de l'animal (c.size).
// Le sol est en y = 90, le milieu du corps en (0, 0).
// Ici : le moteur, et le loup (dessiné entièrement à la main). Les autres
// animaux, par familles, sont dans art-decoupe-animaux.js.
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SNOUT, shade } from './art.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, k) => a + (b - a) * k;

/* ---------- Les formes, lues une seule fois ---------- */
const PATHS = new Map();
function path(d) {
  let p = PATHS.get(d);
  if (!p) {
    p = new Path2D(d);
    PATHS.set(d, p);
  }
  return p;
}

/* ---------- Les couleurs d'un animal, calculées une fois par couleur ---------- */
/** Réchauffe une couleur (vers un fauve doré) : k = 0 (rien) à 1 (tout fauve) */
function warm(col, k) {
  const n = col[0] === '#' ? parseInt(col.slice(1), 16) : col.match(/\d+/g).slice(0, 3).reduce((v, x) => (v << 8) | Number(x), 0);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const h = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${h(r + (214 - r) * k)}${h(g + (170 - g) * k)}${h(b + (112 - b) * k)}`;
}
const PALETTES = new Map();
function palette(col, belly, extra = {}) {
  const key = col + '|' + belly + '|' + (extra.dark || '');
  let P = PALETTES.get(key);
  if (!P) {
    P = {
      base: col,
      light: shade(col, 0.25),
      shadow: shade(col, -0.2),
      deep: shade(col, -0.34),
      line: extra.dark || shade(col, -0.62),
      belly: belly || shade(col, 0.6),
      bellyShadow: shade(belly || shade(col, 0.6), -0.14),
      saddle: shade(col, -0.24),
      tan: warm(col, 0.13),
      tanShadow: shade(warm(col, 0.13), -0.2),
    };
    PALETTES.set(key, P);
  }
  return P;
}

/* ---------- Dessiner un morceau ----------
   Un aplat avec son volume : le bas du morceau est dans l'ombre, le haut
   attrape la lumière (un liseré clair qui suit le contour), puis le contour. */
const LIGHTS = new Map();
function lightOf(col) {
  let l = LIGHTS.get(col);
  if (!l) {
    l = shade(col, 0.2);
    LIGHTS.set(col, l);
  }
  return l;
}
function piece(ctx, d, col, shadowCol, S) {
  const p = path(d);
  ctx.fillStyle = shadowCol;
  ctx.fill(p);
  if (S.fine) {
    ctx.save();
    ctx.clip(p);
    ctx.translate(-1.5, -7);
    ctx.fillStyle = lightOf(col);
    ctx.fill(p);
    ctx.clip(p);
    ctx.translate(1.5, 10.5);
    ctx.fillStyle = col;
    ctx.fill(p);
    ctx.restore();
  }
  ctx.strokeStyle = S.line;
  ctx.lineWidth = S.lw;
  ctx.stroke(p);
}
/** Une tache de couleur à l'intérieur d'un morceau (le ventre clair, la selle sombre…) */
function inside(ctx, d, clipD, col) {
  ctx.save();
  ctx.clip(path(clipD));
  ctx.fillStyle = col;
  ctx.fill(path(d));
  ctx.restore();
}
/** Quelques mèches de poils (de simples traits) */
function strands(ctx, d, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke(path(d));
}
function at(ctx, x, y, a = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (a) ctx.rotate(a);
}

/* ---------- Un œil en amande : un iris coloré, une pupille, un reflet ----------
   tilt : l'œil est un peu en biais ; mood : l'humeur ; blink : la paupière */
function almondEye(ctx, x, y, w, tilt, iris, mood, blink, S, flip = 1, gaze = 0.18) {
  at(ctx, x, y, tilt);
  ctx.scale(flip, 1);
  const h = w * (mood === 'scared' ? 0.7 : mood === 'angry' ? 0.48 : 0.58);
  const shape = new Path2D();
  shape.moveTo(-w, 0);
  shape.bezierCurveTo(-w * 0.55, -h, w * 0.45, -h * 1.05, w, -h * 0.1);
  shape.bezierCurveTo(w * 0.5, h * 0.75, -w * 0.5, h * 0.8, -w, 0);
  ctx.fillStyle = '#F6EFDC';
  ctx.fill(shape);
  ctx.save();
  ctx.clip(shape);
  // l'iris, qui regarde vers l'avant
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(w * gaze, -h * 0.05, h * 0.95, 0, TAU);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(w * (gaze + 0.06), -h * 0.05, h * (mood === 'scared' ? 0.32 : 0.5), 0, TAU);
  ctx.fill();
  if (S.fine) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(w * (gaze - 0.16), -h * 0.38, h * 0.26, 0, TAU);
    ctx.fill();
  }
  // la paupière qui se ferme
  if (blink > 0.05) {
    ctx.fillStyle = S.lid;
    ctx.fillRect(-w * 1.1, -h * 1.2, w * 2.2, h * 2.4 * Math.min(1, blink));
  }
  ctx.restore();
  // le trait du haut de l'œil, bien marqué
  ctx.strokeStyle = S.line;
  ctx.lineWidth = S.lw * 1.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 1.05, h * 0.05);
  ctx.bezierCurveTo(-w * 0.55, -h * 1.02, w * 0.45, -h * 1.08, w * 1.05, -h * 0.1);
  ctx.stroke();
  ctx.lineWidth = S.lw * 0.6;
  ctx.stroke(shape);
  ctx.restore();
}

/* ---------- La vue à prendre, selon la direction (avec un écart, pour ne pas clignoter) ---------- */
const VIEW_IN = 0.64, VIEW_OUT = 0.44;
function viewOf(c) {
  const s = Math.sin(c.angle ?? 0), co = Math.cos(c.angle ?? 0);
  let v = c._vue || 'profil';
  if (v === 'face' ? s < VIEW_OUT : v === 'dos' ? s > -VIEW_OUT : true) v = s > VIEW_IN ? 'face' : s < -VIEW_IN ? 'dos' : 'profil';
  if (co > 0.2) c._flip = 1;
  else if (co < -0.2) c._flip = -1;
  else if (!c._flip) c._flip = 1;
  if (v !== c._vue) {
    // au moment de se tourner, le corps se resserre un instant
    if (c._vue) c._turnAt = performance.now();
    c._vue = v;
  }
  return v;
}

/* ---------- La pose : la marche, le trot, le galop, la respiration ---------- */
function poseOf(c, t, o) {
  const spd = c.speed ?? 0;
  return {
    mv: clamp(spd * 1.7, 0, 1),                        // 0 = arrêté, 1 = lancé
    gal: clamp((spd - 0.92) / 0.25, 0, 1),             // au galop
    ph: (c.walk ?? 0) * 2.6,
    t: t + (c.seed || 0) * 3,
    open: clamp(c.mouth || 0, 0, 1),
    mood: o.mood || c.mood || 'calm',
    blink: c.blink || 0,
  };
}

/** La patte de devant ou de derrière : l'angle de la cuisse, le pli du bas, et si elle est levée */
function legAngles(Q, ph, front) {
  const { mv, gal } = Q;
  const trot = { a: -0.5 * Math.sin(ph), lift: Math.max(0, Math.cos(ph)) };
  // au galop : les pattes avancent ensemble, de très grands pas
  const gp = ph + (front ? 0 : 2.5);
  const galop = { a: -0.8 * Math.sin(gp), lift: Math.max(0, Math.cos(gp)) };
  const a = mix(trot.a, galop.a, gal) * mv;
  const lift = mix(trot.lift, galop.lift, gal) * mv;
  return { a, low: front ? 1.1 * lift : -0.95 * lift, lift };
}

/* ============================================================================
   LE LOUP — de profil (tourné vers la droite)
   ============================================================================ */
const LOUP = {
  // les articulations, dans le corps
  hip: [-54, -2], shoulder: [46, 4], neck: [62, -20], head: [76, -36], tail: [-80, -14],
  hipUp: 'M -20 -16 C -4 -26 18 -20 20 -2 C 22 14 18 26 8 36 C 2 42 -1 50 -2 56 C -3 63 -15 63 -15 56 C -16 44 -24 30 -27 14 C -29 2 -30 -10 -20 -16 Z',
  hock: [-8, 57],
  hipLow: 'M -7 0 C -7 -8 7 -8 7 0 L 8 22 C 10 27 18 26 22 30 C 25 33 22 36 17 36 L -1 36 C -6 36 -7 32 -5 28 Z',
  hipToes: 'M 12 31 L 13 35.5 M 17 30.5 L 18 35.5',
  frontUp: 'M -16 -10 C -14 -24 12 -24 15 -10 C 16 4 12 22 9 36 C 8 44 -9 44 -10 36 C -13 22 -17 4 -16 -10 Z',
  elbow: [0, 38],
  frontLow: 'M -8 0 C -8 -9 8 -9 8 0 L 7 34 C 8 38 12 39 17 40 C 22 42 21 48 15 48 L -5 48 C -10 48 -10 42 -7 38 Z',
  frontToes: 'M 10 43 L 11 47.5 M 15 42 L 16 47.5',
  body: 'M 80 0 C 84 20 72 38 50 40 C 32 42 14 30 -10 24 C -28 20 -46 26 -62 22 C -80 16 -86 0 -84 -12 C -80 -24 -64 -28 -46 -25 C -22 -22 4 -30 30 -35 C 56 -38 76 -18 80 0 Z',
  bodyBelly: 'M 82 12 C 60 42 20 32 -12 28 C -40 24 -60 32 -76 20 L -80 70 L 90 70 Z',
  bodySaddle: 'M 50 -40 C 20 -32 -20 -24 -90 -24 L -92 -4 C -60 -12 -20 -12 10 -16 C 30 -18 44 -22 56 -30 Z',
  bodyFur: 'M 30 -24 C 20 -20 10 -18 2 -18 M -10 -18 C -20 -16 -30 -16 -40 -16 M -60 -14 C -70 -12 -76 -8 -80 -2 M 22 32 L 18 37 M 8 30 L 4 35 M -22 24 L -26 29',
  ruff: 'M -26 -6 C -24 -30 4 -40 24 -32 C 38 -26 44 -8 40 8 C 38 18 34 26 28 32 L 23 27 L 20 37 L 14 29 L 8 39 L 2 29 L -4 35 L -9 25 C -20 18 -26 8 -26 -6 Z',
  ruffBelly: 'M 50 -10 C 30 0 10 10 -30 4 L -30 50 L 60 50 Z',
  headUp: 'M -18 -6 C -20 -26 -2 -36 18 -34 C 30 -33 38 -26 46 -20 C 54 -16 62 -12 66 -6 C 69 -1 67 4 62 6 L 38 7 C 30 9 22 14 14 17 C 8 20 6 24 0 22 L -2 26 L -6 20 L -12 22 C -18 16 -18 6 -18 -6 Z',
  headLight: 'M -22 6 C 0 12 30 4 72 0 L 72 40 L -22 40 Z',
  headMask: 'M 6 -36 C 22 -32 38 -24 50 -17 C 44 -13 38 -12 32 -12 C 24 -16 14 -20 2 -20 Z',
  headFur: 'M -4 -26 C -10 -20 -12 -14 -12 -8 M 2 -30 C -4 -24 -6 -18 -6 -12',
  jaw: 'M -4 -4 L 36 -5 C 41 -4 41 1 36 3 L 6 6 C -2 6 -6 2 -4 -4 Z',
  hinge: [14, 7],
  tongue: 'M 4 -4 C 14 -9 30 -9 37 -4 C 32 0 14 1 4 -4 Z',
  nose: 'M 58 -8 C 62 -11 69 -9 70 -4 C 70 0 66 2 62 2 C 58 1 56 -4 58 -8 Z',
  mouthLine: 'M 62 3 C 56 6 46 7 38 7 C 34 7 31 6 29 4',
  ear: 'M -9 2 C -10 -12 -6 -26 3 -34 C 9 -24 12 -10 9 2 Z',
  earIn: 'M -5 0 C -5 -10 -2 -20 3 -26 C 6 -18 7 -8 5 0 Z',
  earAt: [8, -28], earFarAt: [-2, -30],
  eye: [32, -15],
  tailD: 'M 4 -6 C -14 -6 -30 6 -38 22 C -46 38 -44 56 -36 66 L -33 59 L -28 62 L -27 54 L -22 54 C -18 40 -8 22 6 8 C 10 2 9 -6 4 -6 Z',
  tailTip: 'M -52 44 C -42 54 -30 54 -16 46 L -16 80 L -52 80 Z',
  tailFur: 'M -10 4 C -18 10 -24 18 -28 28 M -2 10 C -10 18 -16 28 -18 38',
};

function drawLoupSide(ctx, c, Q, P, S, o) {
  const L = LOUP;
  const { mv, gal, ph, t, open, mood } = Q;
  // le corps monte et descend à chaque pas ; au galop, il bascule d'avant en arrière
  const bob = -mv * (mix(2.2, 5, gal)) * (1 - Math.cos(ph * 2)) * 0.5;
  const pitch = gal * 0.07 * Math.sin(ph + 1.2) * mv;
  const breath = 1 + Math.sin(Q.t * 2.3) * 0.012 * (1 - mv);
  const fn = legAngles(Q, ph, true), hn = legAngles(Q, ph + Math.PI, false);
  const ff = legAngles(Q, ph + Math.PI, true), hf = legAngles(Q, ph, false);
  const farCol = P.shadow, farShadow = P.deep;

  const leg = (pivot, up, joint, low, toes, A, far) => {
    const [px, py] = pivot;
    at(ctx, px, py, A.a);
    ctx.translate(0, -A.lift * 3);
    at(ctx, joint[0], joint[1], A.low);
    piece(ctx, low, far ? P.tanShadow : P.tan, far ? shade(P.tanShadow, -0.15) : P.tanShadow, S);
    if (S.fine) strands(ctx, toes, S.line, S.lw * 0.7);
    ctx.restore();
    piece(ctx, up, far ? farCol : P.base, far ? farShadow : P.shadow, S);
    ctx.restore();
  };

  at(ctx, 0, bob, pitch);
  // les pattes du fond (plus sombres), la queue
  leg(L.hip, L.hipUp, L.hock, L.hipLow, L.hipToes, hf, true);
  leg(L.shoulder, L.frontUp, L.elbow, L.frontLow, L.frontToes, ff, true);
  let ta = 0.06 * Math.sin(Q.t * 1.6) + mv * 0.45;
  if (mood === 'happy') ta += 0.35 + 0.28 * Math.sin(Q.t * 13) * (1 - mv * 0.5);
  if (mood === 'angry') ta += 0.55;
  if (mood === 'scared') ta -= 0.4;
  at(ctx, L.tail[0], L.tail[1], ta);
  piece(ctx, L.tailD, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, L.tailTip, L.tailD, P.line);
    strands(ctx, L.tailFur, P.deep, S.lw * 0.8);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(L.tailD));
  }
  ctx.restore();
  // le corps : le ventre clair, la selle sombre sur le dos
  ctx.save();
  ctx.scale(1, breath);
  piece(ctx, L.body, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, L.bodyBelly, L.body, P.belly);
    inside(ctx, L.bodySaddle, L.body, P.saddle);
    strands(ctx, L.bodyFur, P.deep, S.lw * 0.75);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(L.body));
  }
  ctx.restore();
  // les pattes de notre côté… et le dos repasse par-dessus le haut des cuisses (elles sortent de sous le corps)
  leg(L.hip, L.hipUp, L.hock, L.hipLow, L.hipToes, hn, false);
  leg(L.shoulder, L.frontUp, L.elbow, L.frontLow, L.frontToes, fn, false);
  if (S.fine) {
    // là où la cuisse passe sur le corps, son contour devient un simple pli
    ctx.save();
    ctx.scale(1, breath);
    ctx.clip(path(L.body));
    ctx.scale(1, 1 / breath);
    for (const [pivot, up, A] of [[L.hip, L.hipUp, hn], [L.shoulder, L.frontUp, fn]]) {
      at(ctx, pivot[0], pivot[1], A.a);
      ctx.translate(0, -A.lift * 3);
      ctx.strokeStyle = P.base;
      ctx.lineWidth = S.lw * 1.6;
      ctx.stroke(path(up));
      piece(ctx, up, P.base, P.shadow, { ...S, line: P.deep, lw: S.lw * 0.7 });
      ctx.restore();
    }
    ctx.restore();
  }
  // la collerette de poils autour du cou
  const fluffy = o.fluffy ? 1.12 : 1;
  at(ctx, L.neck[0], L.neck[1]);
  ctx.scale(fluffy, fluffy);
  piece(ctx, L.ruff, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, L.ruffBelly, L.ruff, P.belly);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(L.ruff));
  }
  ctx.restore();
  // la tête : elle bouge un peu à chaque pas, se baisse quand il chasse
  let ha = 0.035 * Math.sin(ph * 2) * mv + gal * 0.12 + Math.sin(Q.t * 0.7) * 0.03 * (1 - mv);
  if (mood === 'angry') ha += 0.14;
  if (mood === 'scared') ha -= 0.1;
  at(ctx, L.head[0], L.head[1] - bob * 0.3, ha);
  let ea = Math.sin(Q.t * 9) * 0.12 * ((Q.t % 5) < 0.3 ? 1 : 0);
  if (mood === 'angry') ea -= 0.3;
  if (mood === 'scared') ea -= 0.75;
  at(ctx, L.earFarAt[0], L.earFarAt[1], ea - 0.05);
  piece(ctx, L.ear, P.shadow, P.deep, S);
  ctx.restore();
  // la gueule ouverte : le fond, la mâchoire du bas, la langue
  const ja = open * 0.55 + (mood === 'happy' && mv < 0.3 ? 0.1 : 0);
  const [hx, hy] = L.hinge;
  if (ja > 0.04) {
    const tip = { x: hx + Math.cos(ja) * 40 - Math.sin(ja) * 1, y: hy + Math.sin(ja) * 40 + Math.cos(ja) * 1 };
    ctx.fillStyle = '#5A1420';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(64, 4);
    ctx.lineTo(tip.x, tip.y);
    ctx.closePath();
    ctx.fill();
  }
  at(ctx, hx, hy, ja);
  piece(ctx, L.jaw, P.belly, P.bellyShadow, S);
  if (ja > 0.04) {
    ctx.fillStyle = '#E37C8C';
    ctx.fill(path(L.tongue));
    // le croc du bas
    fang(ctx, 32, -4, -1, 7, S);
  }
  ctx.restore();
  // le haut de la tête : le museau clair, le masque plus sombre sur le front
  piece(ctx, L.headUp, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, L.headLight, L.headUp, P.belly);
    inside(ctx, L.headMask, L.headUp, P.saddle);
    strands(ctx, L.headFur, P.deep, S.lw * 0.7);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(L.headUp));
  }
  // les crocs du haut : gueule ouverte, ou babines retroussées quand il est fâché
  if (ja > 0.04 || mood === 'angry') fang(ctx, 54, 5, 1, ja > 0.04 ? 9 : 6, S);
  if (ja <= 0.04) strands(ctx, L.mouthLine, S.line, S.lw * 0.9);
  // la truffe
  const nk = o.bigNose ? 1.3 : 1;
  ctx.save();
  ctx.translate(64, -4);
  ctx.scale(nk, nk);
  ctx.translate(-64, 4);
  ctx.fillStyle = '#2A2024';
  ctx.fill(path(L.nose));
  if (S.fine) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(62, -7, 3, 1.6, -0.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // l'œil, en amande, un peu en biais ; le sourcil dit l'humeur
  const [ex, ey] = L.eye;
  almondEye(ctx, ex, ey, 7.8, 0.2, o.iris || '#D9A13A', mood, Q.blink, S);
  if (S.fine) {
    const tilt = mood === 'angry' ? 1 : mood === 'scared' ? -1 : 0;
    ctx.strokeStyle = P.deep;
    ctx.lineWidth = S.lw * 1.3;
    ctx.beginPath();
    ctx.moveTo(ex - 9, ey - 9 - tilt * 2);
    ctx.quadraticCurveTo(ex, ey - 12, ex + 9, ey - 8 + tilt * 3);
    ctx.stroke();
  }
  // l'oreille de notre côté
  at(ctx, L.earAt[0], L.earAt[1], ea);
  piece(ctx, L.ear, P.base, P.shadow, S);
  if (S.fine) {
    ctx.fillStyle = P.deep;
    ctx.fill(path(L.earIn));
  }
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

/** Un croc (dir = 1 : vers le bas, -1 : vers le haut) */
export function fang(ctx, x, y, dir, len, S) {
  ctx.fillStyle = '#FBF6E9';
  ctx.strokeStyle = S.line;
  ctx.lineWidth = S.lw * 0.6;
  ctx.beginPath();
  ctx.moveTo(x - 2.6, y);
  ctx.quadraticCurveTo(x - 1.2, y + dir * len * 0.7, x + 0.6, y + dir * len);
  ctx.quadraticCurveTo(x + 1.4, y + dir * len * 0.4, x + 2.6, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/* ============================================================================
   LE LOUP — de face (il descend vers nous)
   Vu d'un peu au-dessus : la tête devant, le poitrail, les pattes de devant ;
   le dos part vers le haut de l'écran, la queue dépasse derrière.
   ============================================================================ */
const LOUP_FACE = {
  tail: 'M -6 4 C -8 -12 -2 -30 10 -44 L 12 -38 L 16 -42 C 18 -30 18 -18 14 -6 C 12 2 4 8 -6 4 Z',
  tailTip: 'M -10 -30 C 0 -34 10 -32 22 -34 L 22 -60 L -10 -60 Z',
  hindLow: 'M -7 -6 C -7 -10 7 -10 7 -6 L 6 22 C 10 25 10 32 4 33 L -4 33 C -10 32 -10 25 -6 22 Z',
  body: 'M -38 0 C -40 -22 -28 -44 -16 -52 C -8 -56 8 -56 16 -52 C 28 -44 40 -22 38 0 C 37 18 28 34 0 38 C -28 34 -37 18 -38 0 Z',
  bodySaddle: 'M -20 -58 C -10 -48 -6 -36 0 -24 C 6 -36 10 -48 20 -58 Z',
  frontLeg: 'M -9 -6 C -9 -12 9 -12 9 -6 C 9 10 7 30 7 46 C 11 48 13 54 10 58 C 6 62 -6 62 -10 58 C -13 54 -11 48 -7 46 C -7 30 -9 10 -9 -6 Z',
  frontToes: 'M -4 54 L -4 59.5 M 0 54 L 0 60 M 4 54 L 4 59.5',
  chest: 'M -27 -6 C -20 8 -14 22 -8 32 L -4 25 L 0 36 L 4 25 L 8 32 C 14 22 20 8 27 -6 C 12 0 -12 0 -27 -6 Z',
  ear: 'M -9 4 C -10 -10 -8 -22 -2 -32 C 6 -22 9 -10 8 4 Z',
  earIn: 'M -5 2 C -6 -8 -4 -17 -1 -24 C 3 -16 5 -8 4 2 Z',
  face: 'M -30 -10 C -30 -30 -16 -38 0 -38 C 16 -38 30 -30 30 -10 C 31 -2 36 4 34 10 L 28 8 L 26 16 L 20 12 C 14 22 8 26 0 26 C -8 26 -14 22 -20 12 L -26 16 L -28 8 L -34 10 C -36 4 -31 -2 -30 -10 Z',
  faceLight: 'M -40 -4 C -24 -10 -12 -6 0 -6 C 12 -6 24 -10 40 -4 L 40 40 L -40 40 Z',
  faceMask: 'M -10 -38 C -6 -28 -4 -22 0 -16 C 4 -22 6 -28 10 -38 Z',
  muzzle: 'M -12 -10 C -12 -19 12 -19 12 -10 C 13 0 10 12 0 13 C -10 12 -13 0 -12 -10 Z',
  nose: 'M -7 -10 C -7 -14 7 -14 7 -10 C 7 -6 3 -3 0 -3 C -3 -3 -7 -6 -7 -10 Z',
  mouth: 'M 0 -3 L 0 4 M 0 4 C -2 7 -6 7 -8 5 M 0 4 C 2 7 6 7 8 5',
};

function drawLoupFace(ctx, c, Q, P, S, o) {
  const F = LOUP_FACE;
  const { mv, ph, open, mood } = Q;
  const bob = -mv * 2.5 * (1 - Math.cos(ph * 2)) * 0.5;
  const lift = (k) => Math.max(0, Math.sin(ph + k)) * mv;
  // la queue ne dépasse derrière le dos que quand il la remue (content) ou la dresse (fâché)
  if (mood === 'happy' || mood === 'angry') {
    const ta = mood === 'happy' ? 0.5 + 0.45 * Math.sin(Q.t * 13) : 0.15;
    at(ctx, 10, -44 + bob, ta);
    piece(ctx, F.tail, P.base, P.shadow, S);
    if (S.fine) inside(ctx, F.tailTip, F.tail, P.line);
    ctx.restore();
  }
  // les pattes de derrière, au fond (plus haut sur l'écran : elles sont plus loin)
  for (const [s, k] of [[-1, 0], [1, Math.PI]]) {
    at(ctx, s * 21, 42 - lift(k) * 6);
    piece(ctx, F.hindLow, P.tanShadow, shade(P.tanShadow, -0.15), S);
    ctx.restore();
  }
  // le dos, qui part vers le haut
  at(ctx, 0, bob);
  piece(ctx, F.body, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, F.bodySaddle, F.body, P.saddle);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(F.body));
  }
  ctx.restore();
  // les pattes de devant
  for (const [s, k] of [[-1, Math.PI], [1, 0]]) {
    const up = lift(k);
    at(ctx, s * 12, 30 + bob * 0.5 - up * 9);
    ctx.scale(1, 1 - up * 0.12);
    piece(ctx, F.frontLeg, P.tan, P.tanShadow, S);
    if (S.fine) strands(ctx, F.frontToes, S.line, S.lw * 0.7);
    ctx.restore();
  }
  // le poitrail clair et touffu
  at(ctx, 0, bob);
  ctx.scale(o.fluffy ? 1.12 : 1, o.fluffy ? 1.12 : 1);
  piece(ctx, F.chest, P.belly, P.bellyShadow, S);
  ctx.restore();
  // la tête
  let ea = (Q.t % 5) < 0.3 ? Math.sin(Q.t * 9) * 0.12 : 0;
  if (mood === 'angry') ea += 0.35;
  if (mood === 'scared') ea += 0.8;
  at(ctx, 0, -14 + bob * 1.2, Math.sin(Q.t * 0.7) * 0.04 * (1 - mv));
  for (const s of [-1, 1]) {
    at(ctx, s * 15, -24, s * (0.22 + ea));
    piece(ctx, F.ear, P.base, P.shadow, S);
    if (S.fine) {
      ctx.fillStyle = P.deep;
      ctx.fill(path(F.earIn));
    }
    ctx.restore();
  }
  piece(ctx, F.face, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, F.faceLight, F.face, P.belly);
    inside(ctx, F.faceMask, F.face, P.saddle);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(F.face));
  }
  // la gueule : le menton descend quand elle s'ouvre
  const drop = open * 9;
  if (drop > 0.5) {
    ctx.fillStyle = '#5A1420';
    ctx.beginPath();
    ctx.ellipse(0, 6 + drop * 0.5, 8, 3 + drop * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#E37C8C';
    ctx.beginPath();
    ctx.ellipse(0, 9 + drop * 0.8, 5, 2.5, 0, 0, TAU);
    ctx.fill();
    for (const s of [-1, 1]) fang(ctx, s * 5, 4, 1, 5, S);
  }
  piece(ctx, F.muzzle, P.belly, P.bellyShadow, S);
  if (drop > 0.5) {
    at(ctx, 0, drop);
    ctx.fillStyle = P.belly;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.beginPath();
    ctx.ellipse(0, 12, 7, 4, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else {
    strands(ctx, F.mouth, S.line, S.lw * 0.9);
    if (mood === 'angry') for (const s of [-1, 1]) fang(ctx, s * 5, 5, 1, 4, S);
  }
  const nk = o.bigNose ? 1.3 : 1;
  ctx.save();
  ctx.translate(0, -9);
  ctx.scale(nk, nk);
  ctx.translate(0, 9);
  ctx.fillStyle = '#2A2024';
  ctx.fill(path(F.nose));
  if (S.fine) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-2, -11, 2.6, 1.3, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  for (const s of [-1, 1]) {
    almondEye(ctx, s * 12, -21, 6.5, s * -0.2, o.iris || '#D9A13A', mood, Q.blink, S, s, 0);
    if (S.fine) {
      const tilt = mood === 'angry' ? 1 : mood === 'scared' ? -1 : 0;
      ctx.strokeStyle = P.deep;
      ctx.lineWidth = S.lw * 1.3;
      ctx.beginPath();
      ctx.moveTo(s * 5, -29 + tilt * 3);
      ctx.quadraticCurveTo(s * 12, -32, s * 19, -29 - tilt * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ============================================================================
   LE LOUP — de dos (il monte, il s'éloigne)
   La croupe et la queue devant nous, le dos qui part vers le haut, la tête au fond.
   ============================================================================ */
const LOUP_DOS = {
  frontLow: 'M -7 0 L 7 0 L 7 28 C 9 32 9 36 4 36 L -4 36 C -9 36 -9 32 -7 28 Z',
  ear: 'M -8 4 C -9 -10 -7 -22 -1 -30 C 6 -21 8 -10 7 4 Z',
  headBack: 'M -24 -4 C -26 -20 -13 -29 0 -29 C 13 -29 26 -20 24 -4 C 22 8 10 12 0 12 C -10 12 -22 8 -24 -4 Z',
  headMask: 'M -10 -29 C -6 -18 -4 -10 0 -4 C 4 -10 6 -18 10 -29 Z',
  ruff: 'M -30 -40 C -26 -56 26 -56 30 -40 L 26 -33 L 21 -39 L 15 -30 L 9 -37 L 3 -28 L -3 -36 L -9 -28 L -15 -37 L -21 -30 L -26 -38 Z',
  body: 'M -26 -40 C -20 -52 20 -52 26 -40 C 32 -16 42 12 40 34 C 38 52 22 60 0 60 C -22 60 -38 52 -40 34 C -42 12 -32 -16 -26 -40 Z',
  bodyFur: 'M -30 -6 C -34 4 -36 14 -37 22 M 30 -6 C 34 4 36 14 37 22 M -22 -20 C -26 -12 -28 -6 -30 0 M 22 -20 C 26 -12 28 -6 30 0',
  bodySaddle: 'M -12 -52 C -8 -22 -6 8 0 40 C 6 8 8 -22 12 -52 Z',
  haunch: 'M -16 26 C -10 36 -10 48 -16 58 M 16 26 C 10 36 10 48 16 58',
  hindLow: 'M -8 0 L 8 0 L 7 32 C 9 34 9 39 4 39 L -4 39 C -9 39 -9 34 -7 32 Z',
  pads: 'M -4 34 C -4 36 4 36 4 34',
  tail: 'M -8 0 C -18 12 -22 32 -16 46 C -12 54 -6 58 0 60 C 6 58 12 54 16 46 C 22 32 18 12 8 0 Z',
  tailTip: 'M -26 42 C -10 52 10 52 26 42 L 26 70 L -26 70 Z',
  tailFur: 'M -6 10 C -9 20 -10 30 -8 40 M 6 10 C 9 20 10 30 8 40 M 0 14 L 0 34',
};

function drawLoupDos(ctx, c, Q, P, S) {
  const D = LOUP_DOS;
  const { mv, ph, mood } = Q;
  const bob = -mv * 2.5 * (1 - Math.cos(ph * 2)) * 0.5;
  const lift = (k) => Math.max(0, Math.sin(ph + k)) * mv;
  const sway = Math.sin(ph) * 0.03 * mv;
  // la tête, au fond, et ses oreilles vues de derrière
  let ea = (Q.t % 5) < 0.3 ? Math.sin(Q.t * 9) * 0.12 : 0;
  if (mood === 'angry') ea += 0.3;
  if (mood === 'scared') ea += 0.75;
  at(ctx, 0, -54 + bob * 1.2, Math.sin(Q.t * 0.7) * 0.04 * (1 - mv));
  for (const s of [-1, 1]) {
    at(ctx, s * 13, -18, s * (0.2 + ea));
    piece(ctx, D.ear, P.base, P.shadow, S);
    ctx.restore();
  }
  piece(ctx, D.headBack, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, D.headMask, D.headBack, P.saddle);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(D.headBack));
  }
  ctx.restore();
  // les pattes de devant, au fond
  for (const [s, k] of [[-1, 0], [1, Math.PI]]) {
    at(ctx, s * 15, 42 - lift(k) * 6);
    piece(ctx, D.frontLow, P.tanShadow, shade(P.tanShadow, -0.15), S);
    ctx.restore();
  }
  // le dos, avec la raie sombre
  at(ctx, 0, bob, sway);
  piece(ctx, D.body, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, D.bodySaddle, D.body, P.saddle);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(D.body));
  }
  // le creux entre les deux cuisses, des mèches sur les flancs, la collerette autour du cou
  if (S.fine) {
    strands(ctx, D.haunch, P.deep, S.lw * 0.9);
    strands(ctx, D.bodyFur, P.deep, S.lw * 0.75);
  }
  piece(ctx, D.ruff, P.base, P.shadow, S);
  ctx.restore();
  // les pattes de derrière, devant nous
  for (const [s, k] of [[-1, Math.PI], [1, 0]]) {
    const up = lift(k);
    at(ctx, s * 20, 51 + bob * 0.5 - up * 9);
    ctx.scale(1, 1 - up * 0.12);
    piece(ctx, D.hindLow, P.tan, P.tanShadow, S);
    if (S.fine) strands(ctx, D.pads, S.line, S.lw * 0.8);
    ctx.restore();
  }
  // la queue, qui se balance
  let ta = 0.1 * Math.sin(Q.t * 1.6) + Math.sin(ph) * 0.12 * mv;
  if (mood === 'happy') ta += 0.4 * Math.sin(Q.t * 13);
  const lifted = mood === 'angry' ? -0.4 : mood === 'happy' ? -0.15 : 0;
  at(ctx, 0, 26 + bob, ta);
  ctx.scale(1.05, 1 + lifted);
  piece(ctx, D.tail, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, D.tailTip, D.tail, P.line);
    strands(ctx, D.tailFur, P.deep, S.lw * 0.8);
  }
  ctx.restore();
}

/* ============================================================================
   Le dessinateur : l'ombre, la vue, l'échelle, le demi-tour
   ============================================================================ */
const BEASTS = {
  loup: {
    scale: 1.28, side: drawLoupSide, face: drawLoupFace, dos: drawLoupDos, iris: '#D9A13A',
    eyes: { side: [106, -52], face: [12, -35] }, shadow: { side: 96, face: 46 },
  },
};
/** Ajoute un animal découpé (art-decoupe-animaux.js) : { scale, side, face, dos, iris, eyes, shadow } */
export function registerCutout(id, B) {
  BEASTS[id] = B;
}

/** Dessine un animal découpé. o : { belly, dark, iris, mood, cute, bigNose, fluffy } */
export function drawCutout(ctx, c, t, id, col, o = {}) {
  const B = BEASTS[id];
  const r = c.size;
  const k = (r * B.scale) / 100;                 // 1 unité de dessin = k pixels du monde
  const m = ctx.getTransform();
  const su = k * Math.hypot(m.a, m.b);           // 1 unité = su pixels à l'écran
  const P = palette(col, o.belly, o);
  const S = {
    fine: su * 100 > 22,
    line: P.line,
    lid: P.base,
    lw: Math.max(1.7, 1.1 / su),
  };
  const view = viewOf(c);
  const Q = poseOf(c, t, o);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(k, k);
  // l'ombre, par terre
  ctx.fillStyle = 'rgba(0, 25, 15, 0.22)';
  ctx.beginPath();
  const sh = B.shadow || { side: 96, face: 46 };
  if (view === 'profil') ctx.ellipse(-4, 90, sh.side - Q.mv * 8, 14, 0, 0, TAU);
  else ctx.ellipse(0, 86, sh.face, 16, 0, 0, TAU);
  ctx.fill();
  // au moment de se tourner, le corps se resserre un instant
  const turn = c._turnAt ? clamp((performance.now() - c._turnAt) / 140, 0, 1) : 1;
  const sq = 0.72 + 0.28 * turn;
  if (view === 'profil') ctx.scale(c._flip * sq, 1);
  else ctx.scale(sq, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const oo = { ...o, iris: o.iris || B.iris };
  // (B : les mesures de l'espèce, pour les dessinateurs par familles)
  if (view === 'profil') B.side(ctx, c, Q, P, S, oo, B);
  else if (view === 'face') B.face(ctx, c, Q, P, S, oo, B);
  else B.dos(ctx, c, Q, P, S, oo, B);
  ctx.restore();
}

/** Où sont les yeux (dans le monde) : pour les yeux rouges des chasseurs qui te poursuivent */
export function cutoutEyes(c) {
  const B = BEASTS[CUTOUT_LOOKS[c.sp?.look]];
  if (!B || !B.eyes) return null;
  const k = (c.size * B.scale) / 100;
  const v = c._vue || 'profil';
  if (v === 'dos') return [];
  const E = B.eyes;
  if (v === 'face') return [{ x: c.x - E.face[0] * k, y: c.y + E.face[1] * k }, { x: c.x + E.face[0] * k, y: c.y + E.face[1] * k }];
  return [{ x: c.x + (c._flip || 1) * E.side[0] * k, y: c.y + E.side[1] * k }];
}

/* ---------- Les looks (les animaux) et les formes (le joueur) ---------- */
const CUTOUT_LOOKS = {};
/** Un look « dc-… » dessiné en papier découpé (snout : la portée de la gueule, pour le jeu) */
export function addCutoutLook(look, id, { snout = 0.62, frame = { r: 0.28, x: 0.48, y: 0.4 } } = {}) {
  CUTOUT_LOOKS[look] = id;
  LOOKS[look] = (ctx, c, t) => drawCutout(ctx, c, t, id, c.sp.color, { belly: c.sp.belly });
  SNOUT[look] = snout;
  FRAMES[look] = frame;
}
// (la portée de la gueule du loup : la même que celle du loup d'avant)
addCutoutLook('dc-loup', 'loup');
// le joueur : le loup (ses évolutions se voient : le flair, le pelage épais)
FORMS['dc-loup'] = (ctx, p, parts, t, mood) => {
  drawCutout(ctx, p, t, 'loup', PLAYER.body, {
    belly: PLAYER.belly, dark: PLAYER.dark, cute: true, mood,
    bigNose: !!(parts && parts.flair), fluffy: !!(parts && parts['pelage-epais']),
  });
};
FORM_SPINE['dc-loup'] = null;
SNOUT['dc-loup'] = 0.62;
FRAMES['dc-loup'] = { r: 0.28, x: 0.48, y: 0.4 };

/* Les outils, pour les autres familles (art-decoupe-animaux.js) */
export { path, palette, piece, inside, strands, at, almondEye, legAngles, warm, CUTOUT_LOOKS };
