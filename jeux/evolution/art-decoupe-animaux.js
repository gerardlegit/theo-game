// ============================================================================
// Évolution — tous les animaux des niveaux 3 et 4 en « PAPIER DÉCOUPÉ »,
// par familles (voir art-decoupe.js : le moteur, et le loup dessiné à la main).
//
// Un quadrupède est fait des mêmes morceaux que le loup : le corps, le cou (ou
// la collerette), la tête et sa mâchoire, les oreilles, chaque patte en deux
// parties, la queue. Leurs formes sont CALCULÉES à partir de quelques mesures
// (la longueur du corps, la hauteur du dos, de la poitrine, du ventre…), sur le
// modèle des formes du loup. Les têtes, elles, sont dessinées à la main, une par
// famille : canidé, félin, cheval (et cerf, chèvre, mouton), bovin, rongeur,
// ours, cochon, éléphant. Puis viennent les détails de chaque espèce : cornes,
// bois, trompe, défenses, dents de sabre, crinière, barbe, laine, longs poils,
// rayures, taches, bosse…
// Deux autres plans de corps : les grands oiseaux coureurs (debout sur deux
// pattes), les reptiles (tout près du sol, vus presque de dessus de face/dos).
//
// Unités : 100 = la taille de l'animal ; le sol est en y = 90.
// ============================================================================

import { PLAYER, FORMS, FORM_SPINE, SNOUT, FRAMES, shade, seeded } from './art.js';
import './art-poils.js';
import {
  registerCutout, addCutoutLook, drawCutout, fang,
  path, piece, inside, strands, at, almondEye, legAngles,
} from './art-decoupe.js';

const TAU = Math.PI * 2;
const PI = Math.PI;
const mix = (a, b, k) => a + (b - a) * k;
const HORN = '#E6D8B8';
const IVORY = '#F4ECD8';
const ANTLER = '#E2D2AE';
const NOSE = '#2A2024';
const PINK = '#E59AA2';
const HOOF = '#3A2E26';

/* ---------- Agrandir / déplacer une forme (toutes ses coordonnées) ---------- */
const SCALED = new Map();
function sp(d, sx, sy = sx, dx = 0, dy = 0) {
  const key = `${d}|${sx}|${sy}|${dx}|${dy}`;
  let out = SCALED.get(key);
  if (!out) {
    let i = 0;
    out = d.replace(/-?\d+(\.\d+)?/g, (m) => {
      const v = Number(m);
      const r = i++ % 2 === 0 ? v * sx + dx : v * sy + dy;
      return String(Math.round(r * 10) / 10);
    });
    SCALED.set(key, out);
  }
  return out;
}
const n1 = (v) => Math.round(v * 10) / 10;

/* ============================================================================
   LES TÊTES DE PROFIL (tournées vers la droite ; (0, 0) = l'attache du cou)
   up : la tête sans la mâchoire du bas ; light : le museau clair ; mask : le
   front plus sombre ; jaw + hinge : la mâchoire et son articulation ; nose,
   eye [x, y, largeur, biais], ear / earFar : où sont les oreilles.
   ============================================================================ */
const HS = {
  canin: {
    up: 'M -18 -6 C -20 -26 -2 -36 18 -34 C 30 -33 38 -26 46 -20 C 54 -16 62 -12 66 -6 C 69 -1 67 4 62 6 L 38 7 C 30 9 22 14 14 17 C 8 20 6 24 0 22 L -2 26 L -6 20 L -12 22 C -18 16 -18 6 -18 -6 Z',
    light: 'M -22 6 C 0 12 30 4 72 0 L 72 40 L -22 40 Z',
    mask: 'M 6 -36 C 22 -32 38 -24 50 -17 C 44 -13 38 -12 32 -12 C 24 -16 14 -20 2 -20 Z',
    jaw: 'M -4 -4 L 36 -5 C 41 -4 41 1 36 3 L 6 6 C -2 6 -6 2 -4 -4 Z', hinge: [14, 7], jawLen: 40,
    tongue: 'M 4 -4 C 14 -9 30 -9 37 -4 C 32 0 14 1 4 -4 Z',
    mouth: 'M 62 3 C 56 6 46 7 38 7 C 34 7 31 6 29 4',
    nose: [64, -4, 'chien'], eye: [32, -15, 7.8, 0.2], ear: [8, -28], earFar: [-2, -30],
    fangUp: [54, 5], fangLow: [32, -4], tip: [64, 4], whisk: [56, 0],
  },
  felin: {
    up: 'M -16 -4 C -18 -24 -4 -34 14 -34 C 28 -34 38 -26 42 -16 C 46 -12 50 -8 50 -2 C 50 3 46 6 42 6 L 30 7 C 24 10 18 14 10 17 C 4 20 0 22 -6 20 L -8 24 L -10 18 L -14 18 C -18 12 -17 4 -16 -4 Z',
    light: 'M -20 8 C 4 10 24 0 56 -6 L 56 40 L -20 40 Z',
    mask: 'M 0 -34 C 12 -30 22 -26 30 -20 C 22 -18 12 -18 2 -20 Z',
    jaw: 'M -4 -4 L 26 -5 C 30 -4 30 1 26 3 L 4 6 C -2 6 -6 2 -4 -4 Z', hinge: [14, 7], jawLen: 30,
    tongue: 'M 4 -4 C 12 -8 22 -8 27 -4 C 22 0 12 1 4 -4 Z',
    mouth: 'M 47 2 C 43 6 37 7 31 6',
    nose: [46, -4, 'chat'], eye: [29, -17, 7.8, 0.14], ear: [6, -28], earFar: [-4, -30],
    fangUp: [40, 6], fangLow: [24, -4], tip: [48, 4], whisk: [42, 0],
  },
  equin: {
    up: 'M -12 -12 C -14 -26 -2 -34 10 -32 C 20 -30 28 -26 38 -20 C 50 -14 62 -10 70 -6 C 77 -2 79 6 75 11 C 71 15 62 15 56 13 L 42 12 C 32 13 22 17 12 18 C 2 19 -10 10 -12 -12 Z',
    light: 'M 46 -40 C 52 -6 60 4 96 -6 L 96 40 L 46 40 Z',
    mask: 'M 26 -28 C 42 -22 56 -15 68 -8 C 62 -6 52 -10 30 -21 Z',
    jaw: 'M -2 -3 L 26 -4 C 31 -3 31 2 26 4 L 2 5 C -2 5 -4 2 -2 -3 Z', hinge: [46, 12], jawLen: 28,
    tongue: 'M 2 -3 C 10 -6 20 -6 26 -3 C 20 0 10 0 2 -3 Z',
    mouth: 'M 74 11 C 68 14 60 14 54 12',
    nose: [70, 3, 'cheval'], eye: [14, -17, 6.8, 0], ear: [2, -28], earFar: [-6, -29],
    tip: [76, 10], whisk: null,
  },
  bovin: {
    up: 'M -16 -12 C -16 -30 2 -36 18 -32 C 30 -28 38 -18 44 -8 C 50 2 52 12 48 20 C 44 26 36 28 28 26 L 14 24 C 4 24 -6 20 -12 12 C -16 6 -17 -4 -16 -12 Z',
    light: 'M 30 2 C 40 8 50 10 62 4 L 62 40 L 24 40 Z',
    mask: 'M 0 -34 C 12 -30 24 -24 32 -16 C 24 -16 14 -18 2 -22 Z',
    jaw: 'M -2 -3 L 20 -3 C 24 -2 24 3 20 4 L 2 5 C -2 5 -4 2 -2 -3 Z', hinge: [22, 24], jawLen: 22,
    tongue: 'M 2 -3 C 8 -6 16 -6 20 -3 C 16 0 8 0 2 -3 Z',
    mouth: 'M 46 22 C 40 26 32 26 26 24',
    nose: [45, 14, 'cheval'], eye: [16, -12, 6.2, 0], ear: [-6, -14], earFar: [-10, -18],
    tip: [48, 20], whisk: null,
  },
  rongeur: {
    up: 'M -14 -6 C -16 -24 -2 -32 12 -30 C 24 -28 32 -20 38 -12 C 44 -6 48 -2 48 2 C 48 6 44 8 38 8 L 26 9 C 18 12 10 16 2 16 C -8 16 -14 8 -14 -6 Z',
    light: 'M -20 4 C 6 8 26 2 54 -2 L 54 40 L -20 40 Z',
    mask: 'M 0 -32 C 10 -28 18 -24 24 -20 C 16 -20 8 -20 0 -22 Z',
    jaw: 'M -2 -3 L 20 -4 C 24 -3 24 1 20 3 L 2 5 C -2 5 -4 2 -2 -3 Z', hinge: [16, 9], jawLen: 24,
    tongue: 'M 2 -3 C 8 -6 16 -6 20 -3 C 16 0 8 0 2 -3 Z',
    mouth: 'M 46 5 C 42 8 36 9 30 8',
    nose: [47, 1, 'rongeur'], eye: [22, -14, 8.4, 0], ear: [4, -26], earFar: [-4, -27],
    incisors: [43, 8], tip: [48, 4], whisk: [42, 2],
  },
  elephant: {
    up: 'M -14 -10 C -16 -36 6 -46 24 -40 C 38 -36 44 -22 44 -8 C 44 4 40 12 34 16 L 20 22 C 8 24 -4 20 -10 10 C -14 4 -14 -2 -14 -10 Z',
    light: null, mask: null,
    jaw: 'M -2 -2 L 12 -2 C 15 0 13 4 9 4 L 0 4 Z', hinge: [18, 20], jawLen: 14,
    tongue: null,
    mouth: null,
    nose: null, eye: [24, -16, 5.6, 0.05], ear: [-4, -8], earFar: [-8, -10],
    trunk: [38, 6], tusk: [30, 16], tip: [44, 4], whisk: null,
  },
};
/** Une tête agrandie ou étirée (sx, sy) à partir d'une autre */
function scaleHead(H, sx, sy, extra = {}) {
  const S = {};
  for (const [k, v] of Object.entries(H)) {
    if (typeof v === 'string') S[k] = sp(v, sx, sy);
    else if (Array.isArray(v) && typeof v[0] === 'number') S[k] = [n1(v[0] * sx), n1(v[1] * sy), ...v.slice(2)];
    else S[k] = v;
  }
  if (H.jawLen) S.jawLen = H.jawLen * sx;
  return { ...S, ...extra };
}
HS.ours = scaleHead(HS.canin, 0.86, 1.1);
HS.cochon = scaleHead(HS.canin, 1.08, 1.15, { nose: [69, 0, 'groin'] });

/* Les oreilles de profil ((0, 0) = leur base ; elles pointent vers le haut) */
const EAR_S = {
  pointe: { d: 'M -9 2 C -10 -12 -6 -26 3 -34 C 9 -24 12 -10 9 2 Z', in: 'M -5 0 C -5 -10 -2 -20 3 -26 C 6 -18 7 -8 5 0 Z' },
  rond: { d: 'M -10 3 C -13 -9 -7 -19 1 -19 C 9 -19 13 -9 9 3 Z', in: 'M -6 1 C -8 -6 -4 -13 1 -13 C 5 -13 8 -6 5 1 Z' },
  cheval: { d: 'M -6 2 C -8 -10 -4 -22 2 -30 C 8 -22 9 -10 6 2 Z', in: 'M -3 0 C -4 -8 -2 -16 2 -22 C 5 -16 5 -8 3 0 Z' },
  long: { d: 'M -7 2 C -11 -16 -9 -40 0 -52 C 9 -40 11 -16 7 2 Z', in: 'M -3 0 C -6 -14 -5 -32 0 -42 C 5 -32 6 -14 3 0 Z' },
  lateral: { d: 'M 2 -4 C -8 -9 -20 -8 -26 -1 C -20 6 -8 8 2 4 Z', in: 'M -2 -2 C -8 -5 -15 -4 -20 -1 C -15 3 -8 4 -2 2 Z' },
  tombante: { d: 'M -8 -2 C -4 -7 6 -7 10 -2 C 14 10 12 24 4 28 C -4 28 -10 14 -8 -2 Z', in: null },
  elephant: { d: 'M -4 -22 C 14 -28 28 -14 26 6 C 24 26 10 36 -6 30 C -18 24 -20 -14 -4 -22 Z', in: 'M 0 -14 C 10 -18 20 -8 18 6 C 16 20 6 26 -4 22 C -10 18 -10 -8 0 -14 Z' },
};
EAR_S.petit = { d: sp(EAR_S.rond.d, 0.68), in: sp(EAR_S.rond.in, 0.68) };

/* ============================================================================
   LES TÊTES DE FACE ((0, 0) = le milieu de la tête)
   ============================================================================ */
const HF = {
  canin: {
    face: 'M -30 -10 C -30 -30 -16 -38 0 -38 C 16 -38 30 -30 30 -10 C 31 -2 36 4 34 10 L 28 8 L 26 16 L 20 12 C 14 22 8 26 0 26 C -8 26 -14 22 -20 12 L -26 16 L -28 8 L -34 10 C -36 4 -31 -2 -30 -10 Z',
    light: 'M -40 -4 C -24 -10 -12 -6 0 -6 C 12 -6 24 -10 40 -4 L 40 40 L -40 40 Z',
    mask: 'M -10 -38 C -6 -28 -4 -22 0 -16 C 4 -22 6 -28 10 -38 Z',
    muzzle: 'M -12 -10 C -12 -19 12 -19 12 -10 C 13 0 10 12 0 13 C -10 12 -13 0 -12 -10 Z',
    nose: [0, -9, 'chien'], mouth: 'M 0 -3 L 0 4 M 0 4 C -2 7 -6 7 -8 5 M 0 4 C 2 7 6 7 8 5',
    eye: [12, -21, 6.5, -0.2], ear: [15, -24, 0.22], jawY: 6,
  },
  felin: {
    face: 'M -28 -8 C -30 -26 -16 -34 0 -34 C 16 -34 30 -26 28 -8 C 32 0 34 6 30 12 C 24 20 12 26 0 26 C -12 26 -24 20 -30 12 C -34 6 -32 0 -28 -8 Z',
    light: 'M -40 2 C -20 -2 20 -2 40 2 L 40 40 L -40 40 Z',
    mask: 'M -6 -34 C -4 -26 -2 -20 0 -16 C 2 -20 4 -26 6 -34 Z',
    muzzle: 'M -14 4 C -14 -4 14 -4 14 4 C 14 12 8 16 0 16 C -8 16 -14 12 -14 4 Z',
    nose: [0, 1, 'chat'], mouth: 'M 0 4 L 0 8 M 0 8 C -2 11 -6 11 -8 9 M 0 8 C 2 11 6 11 8 9',
    eye: [12, -12, 7, -0.12], ear: [16, -24, 0.18], jawY: 10, whisk: [10, 6],
  },
  equin: {
    face: 'M -16 -32 C -16 -44 16 -44 16 -32 C 16 -12 13 8 13 22 C 13 36 8 42 0 42 C -8 42 -13 36 -13 22 C -13 8 -16 -12 -16 -32 Z',
    light: 'M -20 18 C -10 12 10 12 20 18 L 20 60 L -20 60 Z',
    mask: 'M -4 -40 C -3 -20 -3 0 0 14 C 3 0 3 -20 4 -40 Z',
    muzzle: null,
    nose: [0, 33, 'cheval'], mouth: 'M -6 40 C -2 42 2 42 6 40',
    eye: [15, -22, 6, 0], ear: [9, -38, 0.25], jawY: 40, side: true,
  },
  bovin: {
    face: 'M -30 -20 C -30 -36 30 -36 30 -20 C 30 0 24 14 20 24 C 16 32 -16 32 -20 24 C -24 14 -30 0 -30 -20 Z',
    light: null,
    mask: 'M -12 -34 C -8 -20 -4 -10 0 -2 C 4 -10 8 -20 12 -34 Z',
    muzzle: 'M -18 14 C -18 6 18 6 18 14 C 18 26 12 32 0 32 C -12 32 -18 26 -18 14 Z',
    nose: [0, 19, 'cheval'], mouth: 'M -8 28 C -3 30 3 30 8 28',
    eye: [21, -12, 6, 0], ear: [28, -18, 0], jawY: 30, side: true,
  },
  rongeur: {
    face: 'M -24 -6 C -26 -24 -12 -30 0 -30 C 12 -30 26 -24 24 -6 C 24 10 14 20 0 20 C -14 20 -24 10 -24 -6 Z',
    light: 'M -30 2 C -16 -2 16 -2 30 2 L 30 30 L -30 30 Z',
    mask: null,
    muzzle: 'M -9 6 C -9 0 9 0 9 6 C 9 13 4 16 0 16 C -4 16 -9 13 -9 6 Z',
    nose: [0, 4, 'rongeur'], mouth: 'M 0 7 L 0 10 M 0 10 C -2 12 -4 12 -5 11 M 0 10 C 2 12 4 12 5 11',
    eye: [11, -9, 7.6, 0], ear: [14, -22, 0.2], jawY: 12, incisors: true, whisk: [7, 8],
  },
  elephant: {
    face: 'M -28 -10 C -30 -40 30 -40 28 -10 C 26 6 16 14 0 14 C -16 14 -26 6 -28 -10 Z',
    light: null, mask: null, muzzle: null,
    nose: null, mouth: null,
    eye: [14, -10, 5.6, 0], ear: [24, -12, 0], jawY: 12, trunk: true,
  },
};
function scaleFace(F, sx, sy, extra = {}) {
  const S = {};
  for (const [k, v] of Object.entries(F)) {
    if (typeof v === 'string') S[k] = sp(v, sx, sy);
    else if (Array.isArray(v) && typeof v[0] === 'number') S[k] = [n1(v[0] * sx), n1(v[1] * sy), ...v.slice(2)];
    else S[k] = v;
  }
  return { ...S, ...extra };
}
HF.ours = scaleFace(HF.canin, 1.12, 0.95, { muzzle: sp(HF.canin.muzzle, 1.15, 0.85, 0, 2) });
HF.cochon = scaleFace(HF.canin, 1.05, 1.08, { nose: [0, -4, 'groin'] });

/* Les oreilles de face ((0, 0) = leur base) */
const EAR_F = {
  pointe: { d: 'M -9 4 C -10 -10 -8 -22 -2 -32 C 6 -22 9 -10 8 4 Z', in: 'M -5 2 C -6 -8 -4 -17 -1 -24 C 3 -16 5 -8 4 2 Z' },
  rond: { d: 'M -9 4 C -12 -8 -6 -16 0 -16 C 6 -16 12 -8 9 4 Z', in: 'M -5 2 C -7 -6 -4 -11 0 -11 C 4 -11 7 -6 5 2 Z' },
  cheval: { d: 'M -6 4 C -8 -10 -4 -22 1 -30 C 6 -22 8 -10 6 4 Z', in: 'M -3 2 C -4 -8 -2 -16 1 -22 C 4 -16 4 -8 3 2 Z' },
  long: { d: 'M -7 4 C -10 -16 -8 -40 0 -50 C 8 -40 10 -16 7 4 Z', in: 'M -3 2 C -5 -14 -4 -32 0 -40 C 4 -32 5 -14 3 2 Z' },
  lateral: { d: 'M -2 -4 C 8 -8 18 -6 22 0 C 18 6 8 8 -2 4 Z', in: 'M 2 -2 C 8 -4 14 -3 18 0 C 14 3 8 4 2 2 Z' },
  tombante: { d: 'M -4 -4 C 2 -8 10 -4 12 4 C 14 16 10 26 4 28 C -2 28 -6 18 -6 6 Z', in: null },
  elephant: { d: 'M 0 -20 C 18 -26 36 -12 34 10 C 32 32 16 40 2 32 C -6 26 -8 -14 0 -20 Z', in: 'M 4 -12 C 16 -16 28 -6 26 10 C 24 26 12 30 4 24 C -2 20 -2 -8 4 -12 Z' },
};
EAR_F.petit = { d: sp(EAR_F.rond.d, 0.68), in: sp(EAR_F.rond.in, 0.68) };

/* La tête vue de dos, selon la famille : [largeur, hauteur] */
const BACK_HEAD = 'M -24 -4 C -26 -20 -13 -29 0 -29 C 13 -29 26 -20 24 -4 C 22 8 10 12 0 12 C -10 12 -22 8 -24 -4 Z';
const BACK_K = { canin: [1, 1], felin: [1.05, 1], equin: [0.72, 1.1], bovin: [1.25, 1], rongeur: [1, 1], ours: [1.15, 1], cochon: [1.05, 1.05], elephant: [1.2, 1.3] };

/* ============================================================================
   LE CORPS ET LES PATTES, CALCULÉS (une fois par espèce)
   body : { L (demi-longueur), topF / topR (le dos au garrot / à la croupe),
   chest / belly (le dessous de la poitrine / du ventre), hump (la bosse) }
   ============================================================================ */
const WOLF_HIPUP = 'M -20 -16 C -4 -26 18 -20 20 -2 C 22 14 18 26 8 36 C 2 42 -1 50 -2 56 C -3 63 -15 63 -15 56 C -16 44 -24 30 -27 14 C -29 2 -30 -10 -20 -16 Z';
const WOLF_HIPLOW = 'M -7 0 C -7 -8 7 -8 7 0 L 8 22 C 10 27 18 26 22 30 C 25 33 22 36 17 36 L -1 36 C -6 36 -7 32 -5 28 Z';
const WOLF_HIPTOES = 'M 12 31 L 13 35.5 M 17 30.5 L 18 35.5';
const WOLF_FRONTLOW = 'M -8 0 C -8 -9 8 -9 8 0 L 7 34 C 8 38 12 39 17 40 C 22 42 21 48 15 48 L -5 48 C -10 48 -10 42 -7 38 Z';
const WOLF_FRONTTOES = 'M 10 43 L 11 47.5 M 15 42 L 16 47.5';
const WOLF_RUFF = 'M -26 -6 C -24 -30 4 -40 24 -32 C 38 -26 44 -8 40 8 C 38 18 34 26 28 32 L 23 27 L 20 37 L 14 29 L 8 39 L 2 29 L -4 35 L -9 25 C -20 18 -26 8 -26 -6 Z';
const WOLF_RUFFBELLY = 'M 50 -10 C 30 0 10 10 -30 4 L -30 50 L 60 50 Z';

/** Le haut d'une patte de devant (l'épaule jusqu'au coude) */
function frontUpper(l, a, b) {
  return `M ${n1(-a)} ${n1(-l * 0.26)} C ${n1(-a * 0.88)} ${n1(-l * 0.63)} ${n1(a * 0.75)} ${n1(-l * 0.63)} ${n1(a * 0.94)} ${n1(-l * 0.26)} `
    + `C ${n1(a)} ${n1(l * 0.1)} ${n1(b * 1.26)} ${n1(l * 0.58)} ${n1(b * 0.95)} ${n1(l * 0.95)} `
    + `C ${n1(b * 0.84)} ${n1(l * 1.16)} ${n1(-b * 0.95)} ${n1(l * 1.16)} ${n1(-b * 1.05)} ${n1(l * 0.95)} `
    + `C ${n1(-b * 1.37)} ${n1(l * 0.58)} ${n1(-a * 1.06)} ${n1(l * 0.1)} ${n1(-a)} ${n1(-l * 0.26)} Z`;
}
/** Le bas d'une patte, de profil, jusqu'au pied (l : sa longueur ; w : sa demi-largeur) */
function lowerLeg(l, w, foot, hind) {
  if (foot === 'sabot') {
    return {
      d: `M ${n1(-w)} 0 C ${n1(-w)} ${n1(-w * 1.1)} ${n1(w)} ${n1(-w * 1.1)} ${n1(w)} 0 C ${n1(w * 0.9)} ${n1(l * 0.4)} ${n1(w * 0.72)} ${n1(l * 0.7)} ${n1(w * 0.8)} ${n1(l - 8)} L ${n1(-w * 0.8)} ${n1(l - 8)} C ${n1(-w * 0.72)} ${n1(l * 0.7)} ${n1(-w * 0.9)} ${n1(l * 0.4)} ${n1(-w)} 0 Z`,
      hoof: `M ${n1(-w * 0.95)} ${n1(l - 10)} L ${n1(w * 1.0)} ${n1(l - 10)} L ${n1(w * 1.7)} ${n1(l)} L ${n1(-w * 1.1)} ${n1(l)} Z`,
      toes: null,
    };
  }
  if (foot === 'colonne') {
    return {
      d: `M ${n1(-w)} 0 C ${n1(-w)} ${n1(-w)} ${n1(w)} ${n1(-w)} ${n1(w)} 0 L ${n1(w * 1.06)} ${n1(l - 6)} C ${n1(w * 1.12)} ${n1(l + 1)} ${n1(-w * 1.12)} ${n1(l + 1)} ${n1(-w * 1.06)} ${n1(l - 6)} Z`,
      nails: [[w * 0.55, l - 3], [w * 0.05, l - 2], [-w * 0.5, l - 3]].map(([x, y]) => [n1(x), n1(y)]),
      toes: null,
    };
  }
  if (hind) return { d: sp(WOLF_HIPLOW, w / 7, l / 36), toes: sp(WOLF_HIPTOES, w / 7, l / 36) };
  return { d: sp(WOLF_FRONTLOW, w / 8, l / 48), toes: sp(WOLF_FRONTTOES, w / 8, l / 48) };
}
/** Une patte vue de face ou de dos : un tube, et le pied */
function legFront(l, w, foot) {
  if (foot === 'sabot') {
    return {
      d: `M ${n1(-w)} -6 C ${n1(-w)} -12 ${n1(w)} -12 ${n1(w)} -6 C ${n1(w)} ${n1(l * 0.3)} ${n1(w * 0.75)} ${n1(l * 0.6)} ${n1(w * 0.8)} ${n1(l - 9)} L ${n1(-w * 0.8)} ${n1(l - 9)} C ${n1(-w * 0.75)} ${n1(l * 0.6)} ${n1(-w)} ${n1(l * 0.3)} ${n1(-w)} -6 Z`,
      hoof: `M ${n1(-w * 0.9)} ${n1(l - 10)} L ${n1(w * 0.9)} ${n1(l - 10)} C ${n1(w * 1.3)} ${n1(l - 4)} ${n1(w * 1.2)} ${n1(l)} ${n1(w)} ${n1(l)} L ${n1(-w)} ${n1(l)} C ${n1(-w * 1.2)} ${n1(l)} ${n1(-w * 1.3)} ${n1(l - 4)} ${n1(-w * 0.9)} ${n1(l - 10)} Z`,
      split: `M 0 ${n1(l - 6)} L 0 ${n1(l)}`,
    };
  }
  if (foot === 'colonne') {
    return {
      d: `M ${n1(-w)} -6 C ${n1(-w)} -12 ${n1(w)} -12 ${n1(w)} -6 L ${n1(w * 1.08)} ${n1(l - 6)} C ${n1(w * 1.1)} ${n1(l + 1)} ${n1(-w * 1.1)} ${n1(l + 1)} ${n1(-w * 1.08)} ${n1(l - 6)} Z`,
      nails: [[-w * 0.55, l - 3], [0, l - 2], [w * 0.55, l - 3]].map(([x, y]) => [n1(x), n1(y)]),
    };
  }
  return {
    d: `M ${n1(-w)} -6 C ${n1(-w)} -12 ${n1(w)} -12 ${n1(w)} -6 C ${n1(w)} ${n1(l * 0.25)} ${n1(w * 0.8)} ${n1(l * 0.6)} ${n1(w * 0.8)} ${n1(l - 14)} `
      + `C ${n1(w * 1.2)} ${n1(l - 12)} ${n1(w * 1.45)} ${n1(l - 6)} ${n1(w * 1.1)} ${n1(l - 2)} C ${n1(w * 0.7)} ${n1(l + 2)} ${n1(-w * 0.7)} ${n1(l + 2)} ${n1(-w * 1.1)} ${n1(l - 2)} `
      + `C ${n1(-w * 1.45)} ${n1(l - 6)} ${n1(-w * 1.2)} ${n1(l - 12)} ${n1(-w * 0.8)} ${n1(l - 14)} C ${n1(-w * 0.8)} ${n1(l * 0.6)} ${n1(-w)} ${n1(l * 0.25)} ${n1(-w)} -6 Z`,
    toes: `M ${n1(-w * 0.45)} ${n1(l - 6)} L ${n1(-w * 0.45)} ${n1(l)} M 0 ${n1(l - 6)} L 0 ${n1(l + 0.5)} M ${n1(w * 0.45)} ${n1(l - 6)} L ${n1(w * 0.45)} ${n1(l)}`,
  };
}

/** Toutes les formes d'une espèce, calculées une seule fois */
function geo(A) {
  if (A._g) return A._g;
  const B = A.body;
  const f = B.L / 82, t = B.topF, r = B.topR, ch = B.chest, be = B.belly, hu = B.hump || 0;
  const X = (x) => n1(x * f);
  const g = { f };
  g.body = `M ${X(80)} 0 C ${X(84)} ${n1(ch * 0.5)} ${X(72)} ${ch - 2} ${X(50)} ${ch} C ${X(32)} ${ch + 2} ${X(14)} ${be + 6} ${X(-10)} ${be} `
    + `C ${X(-28)} ${be - 4} ${X(-46)} ${be + 2} ${X(-62)} ${be - 2} C ${X(-80)} ${be - 8} ${X(-86)} 0 ${X(-84)} ${r + 13} `
    + `C ${X(-80)} ${r + 1} ${X(-64)} ${r - 3} ${X(-46)} ${r} C ${X(-22)} ${r + 3} ${X(4)} ${n1(t + 5 - hu * 0.5)} ${X(30)} ${t - hu} `
    + `C ${X(56)} ${t - 3 - hu} ${X(76)} ${n1(t * 0.5)} ${X(80)} 0 Z`;
  g.belly = `M ${X(82)} ${ch - 28} C ${X(60)} ${ch + 2} ${X(20)} ${be + 8} ${X(-12)} ${be + 4} C ${X(-40)} ${be} ${X(-60)} ${be + 8} ${X(-76)} ${be - 4} L ${X(-80)} 140 L ${X(90)} 140 Z`;
  g.saddle = `M ${X(50)} ${t - 5 - hu} C ${X(20)} ${t + 3} ${X(-20)} ${r + 1} ${X(-90)} ${r + 1} L ${X(-92)} ${r + 21} C ${X(-60)} ${r + 13} ${X(-20)} ${t + 23} ${X(10)} ${t + 19} C ${X(30)} ${t + 17} ${X(44)} ${n1(t + 13 - hu * 0.5)} ${X(56)} ${t + 5} Z`;
  g.cape = `M ${X(-6)} -200 L ${X(140)} -200 L ${X(140)} 200 L ${X(14)} 200 L ${X(8)} ${be + 10} L ${X(16)} ${n1((be + t) / 2 + 8)} L ${X(4)} ${n1((be + t) / 2)} L ${X(12)} ${t - 6} Z`;
  g.top = (x) => mix(r, t - hu, (x / f + 84) / 164);
  // les pattes
  const lw = A.legs.w ?? 1, th = A.legs.thigh ?? 1;
  g.shoulder = [X(56), n1((t + ch) / 2 + (A.legs.shoulderY || 0))];
  g.hip = [X(-64), n1((r + be) / 2)];
  const ft = 90 - g.shoulder[1], ht = 90 - g.hip[1];
  const fu = ft * 0.44, fl = ft - fu;
  g.frontUp = frontUpper(fu, 16 * th, 9.5 * lw);
  g.elbow = [0, n1(fu)];
  g.frontLow = lowerLeg(fl, 8 * lw, A.legs.foot, false);
  const hu2 = ht * 0.62, hl = ht - hu2;
  g.hipUp = sp(WOLF_HIPUP, th, hu2 / 57);
  g.hock = [n1(-8 * th), n1(hu2)];
  g.hipLow = lowerLeg(hl, 7 * lw, A.legs.foot, true);
  // la tête, le cou, la queue
  const H = A.head;
  g.HS = HS[H.type];
  g.HF = HF[H.type];
  g.headAt = H.at || [X(76), t - 1];
  if (A.neck?.type === 'cou') {
    const [bx, by] = [X(58), t + 14];
    const [hx, hy] = g.headAt;
    const dx = hx - bx, dy = hy - by, dd = Math.hypot(dx, dy) || 1;
    const nx = -dy / dd, ny = dx / dd;
    const wb = A.neck.w, wh = A.neck.w * 0.62;
    const P2 = (x, y) => `${n1(x)} ${n1(y)}`;
    // (le dessus du cou, puis la gorge, un peu bombée)
    g.neck = `M ${P2(bx - nx * wb - dx * 0.15, by - ny * wb - dy * 0.15)} Q ${P2(bx + dx * 0.5 - nx * wb * 0.9, by + dy * 0.5 - ny * wb * 0.9)} ${P2(hx - nx * wh, hy - ny * wh)} `
      + `L ${P2(hx + nx * wh, hy + ny * wh)} Q ${P2(bx + dx * 0.45 + nx * wb * 1.25, by + dy * 0.45 + ny * wb * 1.25)} ${P2(bx + nx * wb, by + ny * wb + 10)} Z`;
    g.maneLine = [[bx - nx * wb * 0.8 - dx * 0.05, by - ny * wb * 0.8 - dy * 0.05], [hx - nx * wh * 0.7, hy - ny * wh * 0.7]];
  }
  g.ruffAt = [X(62), t + 15];
  g.tailAt = [X(-80), r + 11];
  // de face et de dos
  const W = A.W || 38, sy = (ch - t + hu) / 75;
  g.W = W;
  g.sy = sy;
  g.faceBody = sp('M -38 0 C -40 -22 -28 -44 -16 -52 C -8 -56 8 -56 16 -52 C 28 -44 40 -22 38 0 C 37 18 28 34 0 38 C -28 34 -37 18 -38 0 Z', W / 38, sy);
  g.faceSaddle = sp('M -20 -58 C -10 -48 -6 -36 0 -24 C 6 -36 10 -48 20 -58 Z', W / 38, sy);
  g.backBody = sp('M -26 -40 C -20 -52 20 -52 26 -40 C 32 -16 42 12 40 34 C 38 52 22 60 0 60 C -22 60 -38 52 -40 34 C -42 12 -32 -16 -26 -40 Z', W / 38, Math.min(1.2, sy));
  g.backSaddle = sp('M -12 -52 C -8 -22 -6 8 0 40 C 6 8 8 -22 12 -52 Z', W / 38, Math.min(1.2, sy));
  // (cy : de combien le corps est plus bas que celui du loup ; les petits animaux sont tout près du sol)
  g.cy = Math.max(0, (t + ch) / 2 - 2.5);
  g.fLegTop = n1(Math.min(30, ch * 0.75) + g.cy * 0.7);
  g.fLeg = legFront(90 - g.fLegTop, 8.5 * lw, A.legs.foot);
  g.fHindTop = n1(42 + g.cy * 0.6);
  g.fHind = legFront(Math.max(10, 80 - g.fHindTop), 7.5 * lw, A.legs.foot);
  g.bHindTop = n1(51 + g.cy * 0.6);
  g.bHind = legFront(Math.max(10, 90 - g.bHindTop), 8 * lw, A.legs.foot);
  g.bFrontTop = n1(42 + g.cy * 0.6);
  g.bFront = legFront(Math.max(8, 78 - g.bFrontTop), 7 * lw, A.legs.foot);
  g.faceHeadY = A.faceHead ?? -14;
  g.backHeadY = A.backHead ?? -54 * Math.min(1.2, sy);
  A._g = g;
  return g;
}

/* ============================================================================
   LES QUEUES (de profil ; (0, 0) = l'attache)
   ============================================================================ */
const TAILS = {
  touffue: { d: 'M 4 -6 C -14 -6 -30 6 -38 22 C -46 38 -44 56 -36 66 L -33 59 L -28 62 L -27 54 L -22 54 C -18 40 -8 22 6 8 C 10 2 9 -6 4 -6 Z', tip: 'M -52 44 C -42 54 -30 54 -16 46 L -16 80 L -52 80 Z' },
  fine: { d: 'M 4 -4 C -12 -2 -26 8 -34 24 C -42 40 -42 56 -34 66 C -31 70 -26 68 -28 63 C -34 52 -34 40 -27 27 C -20 14 -8 6 4 4 Z', tip: null },
  touffe: { d: 'M 4 -3 C -8 2 -16 14 -20 30 C -22 40 -22 48 -21 54 L -17 54 C -17 46 -16 38 -14 30 C -10 16 -4 8 4 3 Z', tip: null, tuft: [-19, 58] },
  crin: { d: 'M 6 -6 C -8 -8 -18 0 -22 14 C -28 32 -26 54 -18 72 L -12 64 L -8 72 L -4 60 C -2 40 -2 20 6 6 Z', tip: null, hair: true },
  courte: { d: 'M 4 -6 C -6 -8 -14 -2 -14 6 C -14 14 -6 16 4 8 Z', tip: null },
  pompon: { d: 'M 2 -12 C -10 -12 -16 -4 -16 4 C -16 12 -8 16 0 14 C 8 12 10 -12 2 -12 Z', tip: null, white: true },
};
const TAIL_BACK = {
  touffue: 'M -8 0 C -18 12 -22 32 -16 46 C -12 54 -6 58 0 60 C 6 58 12 54 16 46 C 22 32 18 12 8 0 Z',
  fine: 'M -3 0 C -5 16 -5 34 -3 50 C -2 54 2 54 3 50 C 5 34 5 16 3 0 Z',
  touffe: 'M -3 0 C -4 14 -4 26 -3 36 C -8 40 -8 50 0 52 C 8 50 8 40 3 36 C 4 26 4 14 3 0 Z',
  crin: 'M -10 0 C -16 16 -16 40 -10 62 L -4 56 L 0 64 L 4 56 L 10 62 C 16 40 16 16 10 0 Z',
  courte: 'M -7 0 C -10 6 -8 14 0 16 C 8 14 10 6 7 0 Z',
  pompon: 'M -11 2 C -14 12 -8 20 0 20 C 8 20 14 12 11 2 C 6 -4 -6 -4 -11 2 Z',
};

/* ============================================================================
   LES DÉTAILS : cornes, bois, trompe, défenses, sabres, crinière, laine…
   ============================================================================ */
/** Un bois de cerf : un trait épais cerné, avec ses pointes */
function stick(ctx, pts, w, col, line, lw) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [c, k] of [[line, w + lw * 2], [col, w]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = k;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
}
/** Une dent de sabre (longue, courbée, avec un reflet) */
function saber(ctx, x, y, len, S) {
  ctx.fillStyle = IVORY;
  ctx.strokeStyle = S.line;
  ctx.lineWidth = S.lw * 0.7;
  ctx.beginPath();
  ctx.moveTo(x - 3.2, y);
  ctx.quadraticCurveTo(x - 2.5, y + len * 0.65, x + 1.5, y + len);
  ctx.quadraticCurveTo(x + 3.5, y + len * 0.5, x + 3.2, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
const HORNS_S = {
  bison: { d: 'M -2 -2 C 4 -14 16 -24 26 -22 C 30 -21 30 -16 26 -16 C 18 -16 10 -10 6 2 Z', at: [4, -26] },
  aurochs: { d: 'M -2 -2 C 8 -22 30 -34 46 -28 C 50 -26 48 -20 44 -22 C 30 -26 16 -16 6 2 Z', at: [2, -26] },
  gazelle: { d: 'M -2 0 C -2 -20 -12 -38 -24 -46 C -14 -36 -6 -20 4 0 Z', at: [4, -26] },
  chevre: { d: 'M -3 0 C 0 -22 -14 -38 -30 -30 C -32 -24 -26 -22 -22 -26 C -12 -30 -6 -18 5 0 Z', at: [4, -26] },
};
const HORNS_F = {
  bison: 'M 16 -2 C 26 -2 34 -10 34 -24 C 30 -18 24 -12 14 -10 Z',
  aurochs: 'M 16 -2 C 36 -4 52 -18 48 -40 C 44 -28 32 -16 14 -10 Z',
  gazelle: 'M 4 -2 C 6 -24 10 -40 16 -50 C 8 -40 2 -24 0 -2 Z',
  chevre: 'M 4 0 C 10 -20 22 -30 30 -24 C 22 -24 14 -16 10 -2 Z',
};

/** Les bois du renne (de profil) : une grande branche qui remonte vers l'avant, des pointes */
function antlersSide(ctx, type, S, P, far) {
  const col = far ? shade(ANTLER, -0.18) : ANTLER;
  if (type === 'megaceros') {
    // une longue branche vers l'arrière, puis une immense « main » plate
    stick(ctx, [[2, -26], [-6, -40], [-18, -48]], 5, col, S.line, S.lw);
    const palm = 'M -14 -44 C -30 -46 -50 -58 -56 -76 L -48 -72 L -50 -86 L -40 -76 L -38 -92 L -30 -78 L -24 -92 L -20 -76 L -10 -86 L -10 -70 C -8 -60 -8 -50 -14 -44 Z';
    ctx.fillStyle = col;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.fill(path(palm));
    ctx.stroke(path(palm));
    stick(ctx, [[2, -28], [14, -38], [20, -36]], 3.5, col, S.line, S.lw);
    return;
  }
  stick(ctx, [[2, -26], [-6, -44], [-4, -62], [8, -76]], 4.5, col, S.line, S.lw);
  stick(ctx, [[-5, -46], [8, -54]], 3.5, col, S.line, S.lw);
  stick(ctx, [[-3, -64], [-14, -74]], 3.5, col, S.line, S.lw);
  stick(ctx, [[2, -30], [14, -34], [20, -30]], 3.5, col, S.line, S.lw);
}
function antlersFront(ctx, type, s, S) {
  ctx.save();
  ctx.scale(s, 1);
  if (type === 'megaceros') {
    stick(ctx, [[10, -30], [24, -40], [38, -44]], 5, ANTLER, S.line, S.lw);
    const palm = 'M 36 -40 C 46 -50 60 -62 64 -80 L 58 -74 L 60 -90 L 52 -78 L 48 -92 L 44 -76 L 36 -88 L 34 -72 L 26 -80 L 28 -64 C 30 -54 32 -46 36 -40 Z';
    ctx.fillStyle = ANTLER;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.fill(path(palm));
    ctx.stroke(path(palm));
  } else {
    stick(ctx, [[8, -32], [18, -48], [16, -66], [8, -80]], 4.5, ANTLER, S.line, S.lw);
    stick(ctx, [[17, -50], [30, -56]], 3.5, ANTLER, S.line, S.lw);
    stick(ctx, [[16, -66], [28, -76]], 3.5, ANTLER, S.line, S.lw);
    stick(ctx, [[10, -36], [6, -48]], 3, ANTLER, S.line, S.lw);
  }
  ctx.restore();
}
/** La trompe (de profil) : elle pend jusqu'au sol, se balance… et se lève quand il barrit */
const TRUNK_S = 'M -8 -6 C 8 -4 12 14 10 34 C 8 52 12 64 20 68 C 25 70 27 64 22 61 C 16 57 17 48 19 34 C 21 14 16 -6 4 -12 Z';
const TRUNK_F = 'M -9 -4 C -10 14 -8 34 -10 52 C -11 60 -4 64 0 62 C 4 64 11 60 10 52 C 8 34 10 14 9 -4 Z';
const TUSK_S = { mammouth: 'M 0 -3 C 16 6 34 14 46 4 C 52 -2 54 -14 48 -22 C 46 -12 40 -4 30 -2 C 20 0 10 -4 0 3 Z', deino: 'M -3 -2 C 2 10 2 24 -6 32 C -10 34 -12 30 -8 28 C -2 20 -4 8 -8 2 Z' };
const TUSK_F = { mammouth: 'M 6 0 C 18 8 26 22 22 36 C 20 42 14 42 16 36 C 18 26 12 14 2 6 Z', deino: 'M 4 0 C 6 12 6 22 2 30 C 0 33 -3 32 -2 28 C 1 20 0 10 -1 2 Z' };

/** La laine du mouton : un nuage tout bouclé autour du corps */
function woolCloud(ctx, cx, cy, rx, ry, n, col, S) {
  const blobs = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    blobs.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, Math.min(rx, ry) * 0.42]);
  }
  blobs.push([cx, cy, Math.min(rx, ry) * 0.9]);
  ctx.strokeStyle = S.line;
  ctx.lineWidth = S.lw * 2;
  for (const [x, y, r] of blobs) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = shade(col, -0.12);
  for (const [x, y, r] of blobs) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  if (S.fine) {
    ctx.fillStyle = col;
    for (const [x, y, r] of blobs) { ctx.beginPath(); ctx.arc(x - r * 0.12, y - r * 0.2, r * 0.75, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = shade(col, -0.25);
    ctx.lineWidth = S.lw * 0.6;
    for (let i = 0; i < blobs.length; i += 2) {
      const [x, y, r] = blobs[i];
      ctx.beginPath();
      ctx.arc(x, y, r * 0.35, 0.5, 4);
      ctx.stroke();
    }
  }
}
/** Les longs poils qui pendent (mammouth, rhinocéros laineux, bison) : des mèches arrondies,
    de longueurs différentes, sous une ligne (yOf : la hauteur du ventre selon x).
    Renvoie [la forme pleine, le bord du bas seulement (pour le contour)] */
const FRINGES = new Map();
function fringe(x0, x1, yOf, len, n) {
  const key = `${x0}|${x1}|${len}|${n}|${yOf(x0)}|${yOf(x1)}|${yOf((x0 + x1) / 2)}`;
  let out = FRINGES.get(key);
  if (out) return out;
  const rnd = seeded(41 + n);
  let edge = '';
  for (let i = 0; i < n; i++) {
    const xa = mix(x0, x1, i / n), xb = mix(x0, x1, (i + 1) / n), xm = (xa + xb) / 2;
    const L = len * (0.65 + rnd() * 0.55);
    const ya = yOf(xa), yb = yOf(xb), ym = yOf(xm);
    edge += `${i ? ' L' : 'M'} ${n1(xa)} ${n1(ya)} Q ${n1(xa + (xm - xa) * 0.2)} ${n1(ym + L)} ${n1(xm)} ${n1(ym + L)} Q ${n1(xb - (xb - xm) * 0.2)} ${n1(ym + L)} ${n1(xb)} ${n1(yb)}`;
  }
  const fill = `${edge} L ${n1(x1)} ${n1(yOf(x1) - len * 0.9)} L ${n1(x0)} ${n1(yOf(x0) - len * 0.9)} Z`;
  out = [fill, edge];
  FRINGES.set(key, out);
  return out;
}
function drawFringe(ctx, F, col, S, bodyD, dy = 0) {
  ctx.save();
  if (bodyD) {
    // (seulement sous le corps : on ne voit que les mèches qui pendent)
    const outside = new Path2D();
    outside.rect(-600, -600, 1200, 1200);
    outside.addPath(path(bodyD), new DOMMatrix([1, 0, 0, 1, 0, dy]));
    ctx.clip(outside, 'evenodd');
  }
  ctx.fillStyle = col;
  ctx.fill(path(F[0]));
  ctx.strokeStyle = S.line;
  ctx.lineWidth = S.lw;
  ctx.stroke(path(F[1]));
  ctx.restore();
}

/* ============================================================================
   UN QUADRUPÈDE DE PROFIL
   ============================================================================ */
function drawQSide(ctx, c, Q, P, S, o, A) {
  const g = geo(A);
  const { mv, gal, ph, open, mood } = Q;
  const swing = A.legs.swing ?? 1;
  const QQ = { ...Q, mv: mv * swing };
  const bob = -mv * mix(2.2, 5, gal) * (1 - Math.cos(ph * 2)) * 0.5 * (A.bob ?? 1);
  const pitch = gal * 0.06 * Math.sin(ph + 1.2) * mv;
  const breath = 1 + Math.sin(Q.t * 2.3) * 0.012 * (1 - mv);
  const fn = legAngles(QQ, ph, true), hn = legAngles(QQ, ph + PI, false);
  const ff = legAngles(QQ, ph + PI, true), hf = legAngles(QQ, ph, false);
  const legLow = A.legs.col ? A.legs.col : P.tan, legLowS = A.legs.col ? shade(A.legs.col, -0.2) : P.tanShadow;

  const leg = (pivot, up, joint, low, A2, far) => {
    at(ctx, pivot[0], pivot[1], A2.a);
    ctx.translate(0, -A2.lift * 3);
    at(ctx, joint[0], joint[1], A2.low);
    piece(ctx, low.d, far ? legLowS : legLow, far ? shade(legLowS, -0.15) : legLowS, S);
    if (low.hoof) {
      ctx.fillStyle = HOOF;
      ctx.fill(path(low.hoof));
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.stroke(path(low.hoof));
    }
    if (low.nails && S.fine) {
      ctx.fillStyle = IVORY;
      for (const [x, y] of low.nails) { ctx.beginPath(); ctx.ellipse(x, y, 3, 2.2, 0, 0, TAU); ctx.fill(); }
    }
    // les doigts (avec de vraies griffes sombres, pour ceux qui en ont)
    if (low.toes && S.fine) strands(ctx, low.toes, A.legs.claws ? '#2E2620' : S.line, S.lw * (A.legs.claws ? 1.4 : 0.7));
    ctx.restore();
    piece(ctx, up, far ? P.shadow : P.base, far ? P.deep : P.shadow, S);
    ctx.restore();
  };
  const tailOf = () => {
    const T = TAILS[A.tail.type];
    if (!T) return;
    let ta = (A.tail.a ?? 0) + 0.06 * Math.sin(Q.t * 1.6) + mv * (A.tail.run ?? 0.4);
    if (mood === 'happy') ta += (A.tail.wag ?? 0.2) + (A.tail.wag ?? 0.2) * 0.8 * Math.sin(Q.t * 13) * (1 - mv * 0.5);
    if (mood === 'angry') ta += 0.4;
    if (mood === 'scared') ta -= 0.35;
    at(ctx, g.tailAt[0], g.tailAt[1], ta);
    const k = (A.tail.k ?? 1) * (o.fluffy ? 1.15 : 1);
    ctx.scale(k, k * (A.tail.len ?? 1));
    const col = T.white ? '#F6F2EA' : T.hair ? (A.maneCol || P.line) : P.base;
    piece(ctx, T.d, col, T.white ? '#DCD6CA' : T.hair ? shade(col, -0.2) : P.shadow, S);
    if (T.tip && S.fine && A.tail.tip !== false) {
      inside(ctx, T.tip, T.d, A.tail.tipCol || P.line);
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.stroke(path(T.d));
    }
    if (T.tuft) {
      ctx.fillStyle = A.tail.tuftCol || P.line;
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.beginPath();
      ctx.ellipse(T.tuft[0], T.tuft[1], 6, 9, 0.1, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    if (T.hair && S.fine) strands(ctx, 'M -6 4 C -14 20 -16 40 -14 60 M 0 8 C -6 24 -8 40 -8 56', shade(col, 0.25), S.lw * 0.8);
    ctx.restore();
  };

  at(ctx, 0, bob, pitch);
  // les pattes du fond, la queue
  leg(g.hip, g.hipUp, g.hock, g.hipLow, hf, true);
  leg(g.shoulder, g.frontUp, g.elbow, g.frontLow, ff, true);
  tailOf();
  // le corps
  ctx.save();
  ctx.scale(1, breath);
  piece(ctx, g.body, P.base, P.shadow, S);
  if (S.fine) {
    const pat = A.pattern || {};
    if (pat.belly !== false) inside(ctx, g.belly, g.body, P.belly);
    if (pat.saddle) inside(ctx, g.saddle, g.body, P.saddle);
    if (A.coat?.cape) inside(ctx, g.cape, g.body, A.coat.capeCol || P.deep);
    bodyMarks(ctx, g, A, P, o);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(g.body));
  }
  ctx.restore();
  // les pattes de notre côté (leur haut devient un pli doux sur le corps)
  leg(g.hip, g.hipUp, g.hock, g.hipLow, hn, false);
  leg(g.shoulder, g.frontUp, g.elbow, g.frontLow, fn, false);
  if (S.fine) {
    ctx.save();
    ctx.scale(1, breath);
    ctx.clip(path(g.body));
    ctx.scale(1, 1 / breath);
    for (const [pivot, up, A2] of [[g.hip, g.hipUp, hn], [g.shoulder, g.frontUp, fn]]) {
      at(ctx, pivot[0], pivot[1], A2.a);
      ctx.translate(0, -A2.lift * 3);
      ctx.strokeStyle = P.base;
      ctx.lineWidth = S.lw * 1.6;
      ctx.stroke(path(up));
      piece(ctx, up, P.base, P.shadow, { ...S, line: P.deep, lw: S.lw * 0.7 });
      ctx.restore();
    }
    ctx.restore();
  }
  // la fourrure : la laine, les longs poils
  if (A.coat?.wool) {
    const f = g.f, B = A.body;
    woolCloud(ctx, 0, (B.topF + B.chest) / 2 + 2, 86 * f, (B.chest - B.topF) / 2 + 6, 14, A.coat.wool, S);
  }
  if (A.coat?.shaggy) {
    const B = A.body, f = g.f;
    // (le dessous du corps : la poitrine devant, le ventre derrière)
    const yOf = (x) => mix(B.belly, B.chest, Math.max(0, Math.min(1, (x / f + 10) / 60))) - 3;
    drawFringe(ctx, fringe(66 * f, -64 * f, (x) => yOf(x) - A.coat.shaggy * 0.3, A.coat.shaggy * 1.3, 14), A.coat.hairCol || P.shadow, S, g.body);
  }
  // le cou : la collerette (les canidés), ou un vrai cou (cheval, cerf…)
  if (A.neck?.type === 'collerette') {
    const k = (A.neck.k ?? 1) * (o.fluffy ? 1.12 : 1);
    at(ctx, g.ruffAt[0], g.ruffAt[1]);
    ctx.scale(k, k);
    piece(ctx, WOLF_RUFF, P.base, P.shadow, S);
    if (S.fine) {
      inside(ctx, WOLF_RUFFBELLY, WOLF_RUFF, P.belly);
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.stroke(path(WOLF_RUFF));
    }
    ctx.restore();
  } else if (g.neck) {
    piece(ctx, g.neck, P.base, P.shadow, S);
    if (A.neck.mane) {
      const [[x0, y0], [x1, y1]] = g.maneLine;
      const mc = A.maneCol || P.line;
      ctx.lineCap = 'round';
      ctx.strokeStyle = S.line;
      ctx.lineWidth = A.neck.mane + S.lw * 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = mc;
      ctx.lineWidth = A.neck.mane;
      ctx.stroke();
      if (S.fine) {
        ctx.strokeStyle = shade(mc, 0.25);
        ctx.lineWidth = S.lw * 0.7;
        for (let k = 0.15; k < 0.95; k += 0.16) {
          const x = mix(x0, x1, k), y = mix(y0, y1, k);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 4, y + 5);
          ctx.stroke();
        }
      }
    }
  }
  // la tête
  let ha = (A.head.a ?? 0) + 0.035 * Math.sin(ph * 2) * mv + gal * 0.1 + Math.sin(Q.t * 0.7) * 0.03 * (1 - mv);
  if (mood === 'angry') ha += 0.12;
  if (mood === 'scared') ha -= 0.1;
  at(ctx, g.headAt[0], g.headAt[1] - bob * 0.3, ha);
  const hk = A.head.k ?? 1;
  ctx.scale(hk, hk);
  drawHeadSide(ctx, Q, P, S, o, A, g.HS);
  ctx.restore();
  ctx.restore();
}

/** Les rayures, les taches, la crête, les taches du joueur (sur le corps, de profil) */
function bodyMarks(ctx, g, A, P, o) {
  const pat = A.pattern || {};
  const B = A.body, f = g.f;
  if (pat.stripes) {
    ctx.save();
    ctx.clip(path(g.body));
    ctx.fillStyle = A.stripeCol || P.line;
    for (let i = 0; i < pat.stripes; i++) {
      const x = mix(60, -70, i / Math.max(1, pat.stripes - 1)) * f;
      const top = g.top(x) - 6, mid = mix(top, B.belly, 0.62);
      ctx.beginPath();
      ctx.moveTo(x - 3.5, top);
      ctx.quadraticCurveTo(x + 2, (top + mid) / 2, x - 4, mid);
      ctx.quadraticCurveTo(x + 6, (top + mid) / 2, x + 3.5, top);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  const spotCol = pat.spotCol || P.deep;
  const patch = A.patches || (o.patch ? { col: o.patch, n: 3 } : null);
  for (const [n, col, big] of [[pat.spots || 0, spotCol, false], [patch ? patch.n : 0, patch?.col, true]]) {
    if (!n) continue;
    ctx.save();
    ctx.clip(path(g.body));
    ctx.fillStyle = col;
    const rnd = seeded(13 + n * 7 + (big ? 5 : 0));
    for (let k = 0; k < n; k++) {
      const x = mix(-70, 62, rnd()) * f;
      const y = mix(g.top(x) + 6, B.belly - 4, rnd());
      ctx.beginPath();
      ctx.ellipse(x, y, big ? 18 + rnd() * 8 : 3.5 + rnd() * 3, big ? 12 + rnd() * 6 : 2.6 + rnd() * 2, rnd() * 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  if (pat.ridge) {
    // une crête de poils sombres sur le dos (hyène, Entelodon)
    ctx.fillStyle = P.line;
    for (let x = 50; x > -40; x -= 9) {
      const xx = x * f, y = g.top(xx);
      ctx.beginPath();
      ctx.moveTo(xx + 4, y + 2);
      ctx.lineTo(xx - 2, y - 7);
      ctx.lineTo(xx - 4, y + 3);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** La tête de profil (dans son repère : (0, 0) = l'attache) */
function drawHeadSide(ctx, Q, P, S, o, A, H) {
  const Hd = A.head;
  const { open, mood } = Q;
  const earT = o.ear || Hd.ear || 'pointe';
  const E = EAR_S[earT];
  const earK = (Hd.earK ?? 1) * (o.bigEars ? 1.3 : 1);
  const hanging = earT === 'tombante' || earT === 'elephant' || earT === 'lateral';
  let ea = Math.sin(Q.t * 9) * 0.12 * ((Q.t % 5) < 0.3 ? 1 : 0);
  if (mood === 'angry') ea -= 0.3;
  if (mood === 'scared') ea -= 0.7;
  const headCol = A.headCol || P.base, headSh = A.headCol ? shade(A.headCol, -0.2) : P.shadow;
  // derrière la tête : l'oreille du fond, la corne et le bois du fond
  if (!hanging) {
    at(ctx, H.earFar[0], H.earFar[1], ea - 0.05);
    ctx.scale(earK, earK);
    piece(ctx, E.d, shade(headCol, -0.2), shade(headCol, -0.34), S);
    ctx.restore();
  }
  const hornDef = Hd.horns && HORNS_S[Hd.horns];
  if (hornDef) {
    at(ctx, hornDef.at[0] - 6, hornDef.at[1] + 1);
    ctx.scale(Hd.hornK ?? 1, Hd.hornK ?? 1);
    piece(ctx, hornDef.d, shade(Hd.hornCol || HORN, -0.15), shade(Hd.hornCol || HORN, -0.3), S);
    ctx.restore();
  }
  if (Hd.antlers) {
    ctx.save();
    ctx.translate(-6, 0);
    ctx.scale(Hd.antlerK ?? 1, Hd.antlerK ?? 1);
    antlersSide(ctx, Hd.antlers, S, P, true);
    ctx.restore();
  }
  if (Hd.tusks) {
    at(ctx, H.tusk[0] - 4, H.tusk[1] - 2);
    ctx.scale(Hd.tuskK ?? 1, Hd.tuskK ?? 1);
    piece(ctx, TUSK_S[Hd.tusks], shade(IVORY, -0.15), shade(IVORY, -0.28), S);
    ctx.restore();
  }
  // la gueule : le fond, la mâchoire du bas, la langue
  const ja = open * (Hd.jawOpen ?? 0.55) + (mood === 'happy' && Q.mv < 0.3 && Hd.type === 'canin' ? 0.1 : 0);
  const [hx, hy] = H.hinge;
  if (ja > 0.04) {
    const L = H.jawLen;
    ctx.fillStyle = '#5A1420';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(H.tip[0], H.tip[1]);
    ctx.lineTo(hx + Math.cos(ja) * L, hy + Math.sin(ja) * L);
    ctx.closePath();
    ctx.fill();
  }
  at(ctx, hx, hy, ja);
  piece(ctx, H.jaw, A.headCol ? headSh : P.belly, A.headCol ? shade(headSh, -0.2) : P.bellyShadow, S);
  if (ja > 0.04) {
    if (H.tongue) {
      ctx.fillStyle = '#E37C8C';
      ctx.fill(path(H.tongue));
    }
    if (H.fangLow && Hd.teeth !== false) fang(ctx, H.fangLow[0], H.fangLow[1], -1, 6, S);
  }
  ctx.restore();
  // la tête
  piece(ctx, H.up, headCol, headSh, S);
  if (S.fine) {
    if (H.light && Hd.light !== false && !A.headCol) inside(ctx, H.light, H.up, Hd.lightCol || P.belly);
    if (H.mask && Hd.mask !== false) inside(ctx, H.mask, H.up, Hd.blaze ? P.belly : A.headCol ? shade(A.headCol, -0.15) : P.saddle);
    if (A.pattern?.stripes && Hd.type === 'felin') {
      ctx.save();
      ctx.clip(path(H.up));
      ctx.strokeStyle = A.stripeCol || P.line;
      ctx.lineWidth = 3;
      for (const [x0, y0, x1, y1] of [[-6, -32, -2, -22], [2, -34, 6, -24], [-14, -20, -6, -14]]) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(H.up));
  }
  if (Hd.flanges) {
    // les grosses bosses des joues d'Entelodon
    ctx.fillStyle = headCol;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.beginPath();
    ctx.ellipse(10, 20, 9, 8, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // les crocs, les dents de sabre, les incisives du rongeur
  if (H.fangUp && Hd.teeth !== false && (ja > 0.04 || mood === 'angry')) fang(ctx, H.fangUp[0], H.fangUp[1], 1, ja > 0.04 ? 9 : 6, S);
  const sab = (Hd.sabers || 0) * (o.saberK || 1);
  if (sab) saber(ctx, H.fangUp[0] - 4, H.fangUp[1] - 1, 26 * sab, S);
  if (H.incisors) {
    ctx.fillStyle = IVORY;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw * 0.6;
    ctx.fillRect(H.incisors[0], H.incisors[1] - 1, 4, 5);
    ctx.strokeRect(H.incisors[0], H.incisors[1] - 1, 4, 5);
  }
  if (ja <= 0.04 && H.mouth) strands(ctx, H.mouth, S.line, S.lw * 0.9);
  // le nez
  if (H.nose) noseSide(ctx, H.nose, o.bigNose ? 1.3 : 1, P, S, headCol);
  // les moustaches
  if ((Hd.whiskers || o.whiskers) && H.whisk && S.fine) {
    ctx.strokeStyle = 'rgba(250, 245, 235, 0.9)';
    ctx.lineWidth = Math.max(0.6, S.lw * 0.5);
    for (const k of [-0.25, 0, 0.25]) {
      ctx.beginPath();
      ctx.moveTo(H.whisk[0], H.whisk[1]);
      ctx.quadraticCurveTo(H.whisk[0] + 12, H.whisk[1] + k * 10, H.whisk[0] + 24, H.whisk[1] + k * 20 + 4);
      ctx.stroke();
    }
  }
  // l'œil, et le sourcil qui dit l'humeur
  const [ex, ey, ew, et] = H.eye;
  almondEye(ctx, ex, ey, ew * (o.cute ? 1.1 : 1), et, o.iris || Hd.iris || '#D9A13A', mood, Q.blink, S);
  if (S.fine && Hd.brow !== false) {
    const tilt = mood === 'angry' ? 1 : mood === 'scared' ? -1 : 0;
    ctx.strokeStyle = shade(headCol, -0.34);
    ctx.lineWidth = S.lw * 1.2;
    ctx.beginPath();
    ctx.moveTo(ex - ew - 1, ey - ew - 1 - tilt * 2);
    ctx.quadraticCurveTo(ex, ey - ew * 1.5, ex + ew + 1, ey - ew + tilt * 3);
    ctx.stroke();
  }
  // l'oreille de notre côté (celle qui pend, celle de l'éléphant)
  at(ctx, H.ear[0], H.ear[1], hanging ? (earT === 'elephant' ? Math.sin(Q.t * 2.2) * 0.08 : earT === 'lateral' ? -ea * 0.5 : 0) : ea);
  ctx.scale(earK, earK);
  piece(ctx, E.d, earT === 'tombante' ? shade(headCol, -0.18) : headCol, shade(headCol, -0.2), S);
  if (E.in && S.fine) {
    ctx.fillStyle = earT === 'elephant' ? shade(headCol, -0.18) : Hd.earIn || shade(headCol, -0.36);
    ctx.fill(path(E.in));
  }
  ctx.restore();
  // les cornes, les bois, la barbe, les défenses, la trompe
  if (hornDef) {
    at(ctx, hornDef.at[0], hornDef.at[1]);
    ctx.scale(Hd.hornK ?? 1, Hd.hornK ?? 1);
    piece(ctx, hornDef.d, Hd.hornCol || HORN, shade(Hd.hornCol || HORN, -0.2), S);
    if (S.fine && (Hd.horns === 'gazelle' || Hd.horns === 'chevre')) strands(ctx, 'M -4 -10 L 2 -12 M -8 -18 L -2 -22 M -12 -26 L -6 -30', shade(Hd.hornCol || HORN, -0.35), S.lw * 0.6);
    ctx.restore();
  }
  if (Hd.horns === 'rhino') {
    piece(ctx, 'M 36 -10 C 40 -24 44 -40 52 -50 C 52 -36 52 -22 50 -6 Z', HORN, shade(HORN, -0.2), S);
    piece(ctx, 'M 20 -22 C 22 -28 24 -34 28 -38 C 29 -32 30 -26 30 -20 Z', HORN, shade(HORN, -0.2), S);
  }
  if (Hd.antlers) {
    ctx.save();
    ctx.scale(Hd.antlerK ?? 1, Hd.antlerK ?? 1);
    antlersSide(ctx, Hd.antlers, S, P, false);
    ctx.restore();
  }
  if (Hd.beard) {
    const b = H.hinge;
    piece(ctx, `M ${b[0] - 6} ${b[1] + 2} C ${b[0]} ${b[1] + 10} ${b[0] + 2} ${b[1] + 18 * Hd.beard} ${b[0] + 6} ${b[1] + 24 * Hd.beard} C ${b[0] + 10} ${b[1] + 14} ${b[0] + 14} ${b[1] + 6} ${b[0] + 14} ${b[1] + 2} Z`,
      shade(headCol, -0.3), shade(headCol, -0.42), S);
  }
  if (Hd.trunk) {
    const up = open * 1.3;
    at(ctx, H.trunk[0], H.trunk[1], -up + Math.sin(Q.t * 1.6) * 0.06);
    ctx.scale(1, Hd.trunk);
    piece(ctx, TRUNK_S, headCol, headSh, S);
    if (S.fine) strands(ctx, 'M 8 10 L 15 11 M 9 22 L 17 22 M 9 34 L 18 34 M 10 46 L 18 46', shade(headCol, -0.3), S.lw * 0.6);
    ctx.restore();
  }
  if (Hd.tusks) {
    at(ctx, H.tusk[0], H.tusk[1]);
    ctx.scale(Hd.tuskK ?? 1, Hd.tuskK ?? 1);
    piece(ctx, TUSK_S[Hd.tusks], IVORY, shade(IVORY, -0.14), S);
    ctx.restore();
  }
}

function noseSide(ctx, N, k, P, S, headCol) {
  const [x, y, type] = N;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  if (type === 'chien') {
    ctx.fillStyle = NOSE;
    ctx.fill(path('M -6 -4 C -2 -7 5 -5 6 0 C 6 4 2 6 -2 6 C -6 5 -8 0 -6 -4 Z'));
    if (S.fine) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-2, -3, 3, 1.6, -0.2, 0, TAU);
      ctx.fill();
    }
  } else if (type === 'chat') {
    ctx.fillStyle = PINK;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw * 0.6;
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(4, -3);
    ctx.lineTo(1, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'rongeur') {
    ctx.fillStyle = PINK;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw * 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.6, 3, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'cheval') {
    ctx.fillStyle = 'rgba(30, 18, 12, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.4, 2.2, 0.5, 0, TAU);
    ctx.fill();
  } else if (type === 'groin') {
    ctx.fillStyle = shade(headCol, 0.2);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 8, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(30, 18, 12, 0.75)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(0.5, s * 3, 1.4, 2, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ============================================================================
   UN QUADRUPÈDE DE FACE (il descend vers nous)
   ============================================================================ */
function drawQFace(ctx, c, Q, P, S, o, A) {
  const g = geo(A);
  const { mv, ph, mood } = Q;
  const bob = -mv * 2.5 * (1 - Math.cos(ph * 2)) * 0.5;
  const lift = (k) => Math.max(0, Math.sin(ph + k)) * mv * (A.legs.swing ?? 1);
  const W = g.W;
  const legLow = A.legs.col || P.tan, legLowS = A.legs.col ? shade(A.legs.col, -0.2) : P.tanShadow;
  const legPiece = (L, col, colS) => {
    piece(ctx, L.d, col, colS, S);
    if (L.hoof) {
      ctx.fillStyle = HOOF;
      ctx.fill(path(L.hoof));
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.stroke(path(L.hoof));
      if (S.fine) strands(ctx, L.split, S.line, S.lw * 0.6);
    }
    if (L.nails && S.fine) {
      ctx.fillStyle = IVORY;
      for (const [x, y] of L.nails) { ctx.beginPath(); ctx.ellipse(x, y, 3, 2.2, 0, 0, TAU); ctx.fill(); }
    }
    if (L.toes && S.fine) strands(ctx, L.toes, S.line, S.lw * 0.7);
  };
  // la queue dépasse derrière le dos quand il la remue (les canidés)
  if (A.head.type === 'canin' && (mood === 'happy' || mood === 'angry')) {
    const ta = mood === 'happy' ? 0.5 + 0.45 * Math.sin(Q.t * 13) : 0.15;
    at(ctx, 10, -44 * g.sy + bob, ta);
    piece(ctx, 'M -6 4 C -8 -12 -2 -30 10 -44 L 12 -38 L 16 -42 C 18 -30 18 -18 14 -6 C 12 2 4 8 -6 4 Z', P.base, P.shadow, S);
    ctx.restore();
  }
  // les pattes de derrière, au fond
  for (const [s, k] of [[-1, 0], [1, PI]]) {
    at(ctx, s * W * 0.55, g.fHindTop - lift(k) * 6);
    legPiece(g.fHind, legLowS, shade(legLowS, -0.15));
    ctx.restore();
  }
  // le dos, qui part vers le haut
  at(ctx, 0, bob + g.cy);
  piece(ctx, g.faceBody, P.base, P.shadow, S);
  if (S.fine) {
    if (A.pattern?.saddle || A.coat?.cape) inside(ctx, g.faceSaddle, g.faceBody, A.coat?.cape ? (A.coat.capeCol || P.deep) : P.saddle);
    if (A.pattern?.stripes) {
      ctx.save();
      ctx.clip(path(g.faceBody));
      ctx.strokeStyle = A.stripeCol || P.line;
      ctx.lineWidth = 3.5;
      for (const s of [-1, 1]) for (const y of [-40, -26, -12]) {
        ctx.beginPath();
        ctx.moveTo(s * W * 0.95, y * g.sy);
        ctx.quadraticCurveTo(s * W * 0.6, y * g.sy - 4, s * W * 0.45, y * g.sy + 6);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(g.faceBody));
  }
  if (A.coat?.wool) woolCloud(ctx, 0, -10 * g.sy, W * 1.05, 40 * g.sy, 12, A.coat.wool, S);
  ctx.restore();
  // les pattes de devant
  for (const [s, k] of [[-1, PI], [1, 0]]) {
    const up = lift(k);
    at(ctx, s * W * 0.32, g.fLegTop + bob * 0.5 - up * 9);
    ctx.scale(1, 1 - up * 0.12);
    legPiece(g.fLeg, legLow, legLowS);
    ctx.restore();
  }
  if (A.coat?.shaggy) drawFringe(ctx, fringe(-W * 0.98, W * 0.98, (x) => 16 + g.cy + (x / W) * (x / W) * -10, A.coat.shaggy * 1.2, 8), A.coat.hairCol || P.shadow, S, g.faceBody, g.cy);
  // le poitrail (clair et touffu chez les canidés)
  if (A.neck?.type === 'collerette') {
    at(ctx, 0, bob + g.cy);
    const k = o.fluffy ? 1.12 : 1;
    ctx.scale(k * W / 38, k);
    piece(ctx, 'M -27 -6 C -20 8 -14 22 -8 32 L -4 25 L 0 36 L 4 25 L 8 32 C 14 22 20 8 27 -6 C 12 0 -12 0 -27 -6 Z', P.belly, P.bellyShadow, S);
    ctx.restore();
  }
  // un long cou (cheval, cerf…) qui monte jusqu'à la tête
  if (A.neck?.type === 'cou') {
    const w = A.neck.w * 0.85;
    const y0 = -20 * g.sy, y1 = g.faceHeadY + 10;
    piece(ctx, `M ${-w} ${n1(y0)} C ${-w} ${n1((y0 + y1) / 2)} ${n1(-w * 0.75)} ${n1(y1)} ${n1(-w * 0.62)} ${n1(y1)} L ${n1(w * 0.62)} ${n1(y1)} C ${n1(w * 0.75)} ${n1(y1)} ${w} ${n1((y0 + y1) / 2)} ${w} ${n1(y0)} Z`, P.base, P.shadow, S);
  }
  // la tête
  at(ctx, 0, g.faceHeadY + bob * 1.2, Math.sin(Q.t * 0.7) * 0.04 * (1 - mv));
  const hk = A.head.k ?? 1;
  ctx.scale(hk, hk);
  drawHeadFace(ctx, Q, P, S, o, A, g.HF);
  ctx.restore();
}

/** La tête de face ((0, 0) = son milieu) */
function drawHeadFace(ctx, Q, P, S, o, A, F) {
  const Hd = A.head;
  const { open, mood } = Q;
  const earT = o.ear || Hd.ear || 'pointe';
  const E = EAR_F[earT];
  const earK = (Hd.earK ?? 1) * (o.bigEars ? 1.3 : 1);
  const headCol = A.headCol || P.base, headSh = A.headCol ? shade(A.headCol, -0.2) : P.shadow;
  let ea = (Q.t % 5) < 0.3 ? Math.sin(Q.t * 9) * 0.12 : 0;
  if (mood === 'angry') ea += 0.3;
  if (mood === 'scared') ea += 0.7;
  const side = earT === 'lateral' || earT === 'elephant' || earT === 'tombante';
  const [ex0, ey0, ea0] = F.ear;
  // les oreilles, les cornes, les bois (derrière le visage)
  const ears = () => {
    for (const s of [-1, 1]) {
      at(ctx, s * ex0, ey0, side ? 0 : s * (ea0 + ea));
      ctx.scale(s * earK, earK);
      if (earT === 'elephant') ctx.rotate(Math.sin(Q.t * 2.2) * 0.06);
      piece(ctx, E.d, earT === 'tombante' ? shade(headCol, -0.18) : headCol, shade(headCol, -0.2), S);
      if (E.in && S.fine) {
        ctx.fillStyle = earT === 'elephant' ? shade(headCol, -0.18) : Hd.earIn || shade(headCol, -0.36);
        ctx.fill(path(E.in));
      }
      ctx.restore();
    }
  };
  if (earT !== 'tombante') ears();
  if (Hd.horns && HORNS_F[Hd.horns]) {
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s * (Hd.hornK ?? 1), Hd.hornK ?? 1);
      ctx.translate(Hd.horns === 'gazelle' || Hd.horns === 'chevre' ? 6 : 10, -24);
      piece(ctx, HORNS_F[Hd.horns], Hd.hornCol || HORN, shade(Hd.hornCol || HORN, -0.2), S);
      ctx.restore();
    }
  }
  if (Hd.antlers) {
    ctx.save();
    ctx.scale(Hd.antlerK ?? 1, Hd.antlerK ?? 1);
    for (const s of [-1, 1]) antlersFront(ctx, Hd.antlers, s, S);
    ctx.restore();
  }
  // le visage
  piece(ctx, F.face, headCol, headSh, S);
  if (S.fine) {
    if (F.light && Hd.light !== false && !A.headCol) inside(ctx, F.light, F.face, Hd.lightCol || P.belly);
    if (F.mask && Hd.mask !== false) inside(ctx, F.mask, F.face, Hd.blaze ? P.belly : A.headCol ? shade(A.headCol, -0.15) : P.saddle);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(F.face));
  }
  if (earT === 'tombante') ears();
  if (Hd.flanges) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = headCol;
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.beginPath();
      ctx.ellipse(s * 26, 12, 8, 9, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  // la gueule ouverte : le menton descend
  const drop = open * 9;
  const jy = F.jawY;
  if (drop > 0.5 && Hd.type !== 'elephant') {
    ctx.fillStyle = '#5A1420';
    ctx.beginPath();
    ctx.ellipse(0, jy + drop * 0.5, 8, 3 + drop * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#E37C8C';
    ctx.beginPath();
    ctx.ellipse(0, jy + 3 + drop * 0.8, 5, 2.5, 0, 0, TAU);
    ctx.fill();
    if (Hd.teeth !== false && (Hd.type === 'canin' || Hd.type === 'felin' || Hd.type === 'ours' || Hd.type === 'cochon')) {
      for (const s of [-1, 1]) fang(ctx, s * 5, jy - 2, 1, 5, S);
    }
  }
  if (F.muzzle) piece(ctx, F.muzzle, Hd.lightCol || (A.headCol ? shade(A.headCol, 0.1) : P.belly), A.headCol ? A.headCol : P.bellyShadow, S);
  if (drop > 0.5 && Hd.type !== 'elephant') {
    at(ctx, 0, drop);
    ctx.fillStyle = A.headCol || P.belly;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.beginPath();
    ctx.ellipse(0, jy + 6, 7, 4, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (F.mouth) {
    strands(ctx, F.mouth, S.line, S.lw * 0.9);
    if (mood === 'angry' && (Hd.type === 'canin' || Hd.type === 'felin')) for (const s of [-1, 1]) fang(ctx, s * 5, jy - 1, 1, 4, S);
  }
  const sab = (Hd.sabers || 0) * (o.saberK || 1);
  if (sab) for (const s of [-1, 1]) saber(ctx, s * 6, jy - 2, 26 * sab, S);
  if (F.incisors) {
    ctx.fillStyle = IVORY;
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw * 0.6;
    ctx.fillRect(-3, jy - 1, 6, 5);
    ctx.strokeRect(-3, jy - 1, 6, 5);
  }
  // le nez
  if (F.nose) {
    const [nx, ny, type] = F.nose;
    const k = o.bigNose ? 1.3 : 1;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.scale(k, k);
    if (type === 'chien') {
      ctx.fillStyle = NOSE;
      ctx.fill(path('M -7 -1 C -7 -5 7 -5 7 -1 C 7 3 3 6 0 6 C -3 6 -7 3 -7 -1 Z'));
      if (S.fine) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-2, -2, 2.6, 1.3, 0, 0, TAU);
        ctx.fill();
      }
    } else if (type === 'chat' || type === 'rongeur') {
      ctx.fillStyle = PINK;
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw * 0.6;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(5, -2);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'cheval') {
      ctx.fillStyle = 'rgba(30, 18, 12, 0.75)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * 6, 0, 2.6, 3.6, s * 0.3, 0, TAU);
        ctx.fill();
      }
    } else if (type === 'groin') {
      ctx.fillStyle = shade(headCol, 0.2);
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 8, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(30, 18, 12, 0.75)';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 4, 0, 2, 3, 0, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  if ((Hd.whiskers || o.whiskers) && F.whisk && S.fine) {
    ctx.strokeStyle = 'rgba(250, 245, 235, 0.9)';
    ctx.lineWidth = Math.max(0.6, S.lw * 0.5);
    for (const s of [-1, 1]) for (const k of [-0.3, 0, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(s * F.whisk[0], F.whisk[1]);
      ctx.lineTo(s * (F.whisk[0] + 20), F.whisk[1] + k * 14);
      ctx.stroke();
    }
  }
  // les yeux
  const [ex, ey, ew, et] = F.eye;
  for (const s of [-1, 1]) {
    almondEye(ctx, s * ex, ey, ew * (o.cute ? 1.1 : 1), s * et, o.iris || Hd.iris || '#D9A13A', mood, Q.blink, S, s, F.side ? 0.25 : 0);
    if (S.fine && Hd.brow !== false) {
      const tilt = mood === 'angry' ? 1 : mood === 'scared' ? -1 : 0;
      ctx.strokeStyle = shade(headCol, -0.34);
      ctx.lineWidth = S.lw * 1.2;
      ctx.beginPath();
      ctx.moveTo(s * (ex - ew), ey - ew - 1 + tilt * 3);
      ctx.quadraticCurveTo(s * ex, ey - ew * 1.5, s * (ex + ew), ey - ew - 1 - tilt * 2);
      ctx.stroke();
    }
  }
  if (Hd.beard) piece(ctx, `M -8 ${jy} C -6 ${jy + 14 * Hd.beard} -2 ${jy + 20 * Hd.beard} 0 ${jy + 24 * Hd.beard} C 2 ${jy + 20 * Hd.beard} 6 ${jy + 14 * Hd.beard} 8 ${jy} Z`, shade(headCol, -0.3), shade(headCol, -0.42), S);
  if (Hd.horns === 'rhino') {
    piece(ctx, 'M -7 0 C -6 -14 -3 -26 0 -34 C 3 -26 6 -14 7 0 Z', HORN, shade(HORN, -0.2), S);
  }
  if (Hd.tusks) {
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s * (Hd.tuskK ?? 1), Hd.tuskK ?? 1);
      ctx.translate(6, jy - 2);
      piece(ctx, TUSK_F[Hd.tusks], IVORY, shade(IVORY, -0.14), S);
      ctx.restore();
    }
  }
  if (Hd.trunk) {
    at(ctx, 0, 2, Math.sin(Q.t * 1.6) * 0.08);
    ctx.scale(1, Hd.trunk * (1 - open * 0.5));
    piece(ctx, TRUNK_F, headCol, headSh, S);
    if (S.fine) strands(ctx, 'M -6 12 L 6 12 M -6 24 L 6 24 M -7 36 L 7 36 M -7 48 L 7 48', shade(headCol, -0.3), S.lw * 0.6);
    ctx.restore();
  }
}

/* ============================================================================
   UN QUADRUPÈDE DE DOS (il monte, il s'éloigne)
   ============================================================================ */
function drawQDos(ctx, c, Q, P, S, o, A) {
  const g = geo(A);
  const { mv, ph, mood } = Q;
  const bob = -mv * 2.5 * (1 - Math.cos(ph * 2)) * 0.5;
  const lift = (k) => Math.max(0, Math.sin(ph + k)) * mv * (A.legs.swing ?? 1);
  const sway = Math.sin(ph) * 0.03 * mv;
  const W = g.W, wk = W / 38;
  const Hd = A.head;
  const headCol = A.headCol || P.base;
  const legLow = A.legs.col || P.tan, legLowS = A.legs.col ? shade(A.legs.col, -0.2) : P.tanShadow;
  const legPiece = (L, col, colS) => {
    piece(ctx, L.d, col, colS, S);
    if (L.hoof) {
      ctx.fillStyle = HOOF;
      ctx.fill(path(L.hoof));
      ctx.strokeStyle = S.line;
      ctx.lineWidth = S.lw;
      ctx.stroke(path(L.hoof));
    }
  };
  // la tête, au fond, avec ses oreilles, ses cornes, ses bois
  let ea = (Q.t % 5) < 0.3 ? Math.sin(Q.t * 9) * 0.12 : 0;
  if (mood === 'angry') ea += 0.3;
  if (mood === 'scared') ea += 0.7;
  const neckLong = A.neck?.type === 'cou';
  at(ctx, 0, g.backHeadY + bob * 1.2, Math.sin(Q.t * 0.7) * 0.04 * (1 - mv));
  const hk = Hd.k ?? 1;
  ctx.scale(hk, hk);
  const [bw, bh] = BACK_K[Hd.type] || [1, 1];
  const earT = o.ear || Hd.ear || 'pointe';
  const E = EAR_F[earT];
  const earK = (Hd.earK ?? 1) * (o.bigEars ? 1.3 : 1);
  if (Hd.antlers) {
    ctx.save();
    ctx.scale(Hd.antlerK ?? 1, Hd.antlerK ?? 1);
    for (const s of [-1, 1]) antlersFront(ctx, Hd.antlers, s, S);
    ctx.restore();
  }
  if (Hd.horns && HORNS_F[Hd.horns]) {
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s * (Hd.hornK ?? 1), Hd.hornK ?? 1);
      ctx.translate(Hd.horns === 'gazelle' || Hd.horns === 'chevre' ? 6 : 10, -18);
      piece(ctx, HORNS_F[Hd.horns], Hd.hornCol || HORN, shade(Hd.hornCol || HORN, -0.2), S);
      ctx.restore();
    }
  }
  const ears = () => {
    for (const s of [-1, 1]) {
      at(ctx, s * F_EAR_BACK(Hd.type, bw), -18 * bh, earT === 'lateral' || earT === 'elephant' || earT === 'tombante' ? 0 : s * (0.2 + ea));
      ctx.scale(s * earK, earK);
      piece(ctx, E.d, earT === 'tombante' ? shade(headCol, -0.18) : headCol, shade(headCol, -0.2), S);
      ctx.restore();
    }
  };
  if (earT !== 'tombante' && earT !== 'elephant') ears();
  piece(ctx, sp(BACK_HEAD, bw, bh), headCol, A.headCol ? shade(A.headCol, -0.2) : P.shadow, S);
  if (S.fine && A.head.mask !== false && !A.headCol) inside(ctx, sp('M -10 -29 C -6 -18 -4 -10 0 -4 C 4 -10 6 -18 10 -29 Z', bw, bh), sp(BACK_HEAD, bw, bh), P.saddle);
  if (earT === 'tombante' || earT === 'elephant') ears();
  ctx.restore();
  // un long cou, qui descend vers les épaules
  if (neckLong) {
    const w = A.neck.w * 0.85;
    const y0 = g.backHeadY + 8, y1 = -30 * Math.min(1.2, g.sy);
    piece(ctx, `M ${n1(-w * 0.62)} ${n1(y0)} C ${n1(-w * 0.8)} ${n1((y0 + y1) / 2)} ${-w} ${n1(y1)} ${-w} ${n1(y1 + 6)} L ${w} ${n1(y1 + 6)} C ${w} ${n1(y1)} ${n1(w * 0.8)} ${n1((y0 + y1) / 2)} ${n1(w * 0.62)} ${n1(y0)} Z`, P.base, P.shadow, S);
    if (A.neck.mane) {
      ctx.strokeStyle = S.line;
      ctx.lineWidth = A.neck.mane + S.lw * 2;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(0, y1 + 4);
      ctx.stroke();
      ctx.strokeStyle = A.maneCol || P.line;
      ctx.lineWidth = A.neck.mane;
      ctx.stroke();
    }
  }
  // les pattes de devant, au fond
  for (const [s, k] of [[-1, 0], [1, PI]]) {
    at(ctx, s * 15 * wk, g.bFrontTop - lift(k) * 6);
    legPiece(g.bFront, legLowS, shade(legLowS, -0.15));
    ctx.restore();
  }
  // le dos
  at(ctx, 0, bob + g.cy * 0.8, sway);
  piece(ctx, g.backBody, P.base, P.shadow, S);
  if (S.fine) {
    if (A.pattern?.saddle || A.coat?.cape || A.pattern?.ridge) inside(ctx, g.backSaddle, g.backBody, A.coat?.cape ? (A.coat.capeCol || P.deep) : A.pattern?.ridge ? P.line : P.saddle);
    if (A.pattern?.stripes) {
      ctx.save();
      ctx.clip(path(g.backBody));
      ctx.strokeStyle = A.stripeCol || P.line;
      ctx.lineWidth = 3.5;
      for (let y = -36; y < 50; y += 13) {
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 4, y);
          ctx.quadraticCurveTo(s * W * 0.5, y - 5, s * W * 1.05, y + 4);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (A.pattern?.spots) {
      ctx.save();
      ctx.clip(path(g.backBody));
      ctx.fillStyle = A.pattern.spotCol || P.deep;
      const rnd = seeded(29);
      for (let k = 0; k < A.pattern.spots; k++) {
        ctx.beginPath();
        ctx.ellipse((rnd() - 0.5) * W * 1.8, -40 + rnd() * 90, 3 + rnd() * 3, 2.4 + rnd() * 2, rnd() * 3, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(g.backBody));
    strands(ctx, sp('M -16 26 C -10 36 -10 48 -16 58 M 16 26 C 10 36 10 48 16 58', wk, 1), P.deep, S.lw * 0.9);
  }
  if (A.coat?.wool) woolCloud(ctx, 0, 6, W * 1.05, 50, 12, A.coat.wool, S);
  if (A.neck?.type === 'collerette') piece(ctx, sp('M -30 -40 C -26 -56 26 -56 30 -40 L 26 -33 L 21 -39 L 15 -30 L 9 -37 L 3 -28 L -3 -36 L -9 -28 L -15 -37 L -21 -30 L -26 -38 Z', wk, 1), P.base, P.shadow, S);
  ctx.restore();
  // les pattes de derrière, devant nous
  for (const [s, k] of [[-1, PI], [1, 0]]) {
    const up = lift(k);
    at(ctx, s * 20 * wk, g.bHindTop + bob * 0.5 - up * 9);
    ctx.scale(1, 1 - up * 0.12);
    legPiece(g.bHind, legLow, legLowS);
    ctx.restore();
  }
  if (A.coat?.shaggy) drawFringe(ctx, fringe(-W * 0.98, W * 0.98, (x) => 46 + g.cy + (x / W) * (x / W) * -12, A.coat.shaggy * 1.2, 8), A.coat.hairCol || P.shadow, S, g.backBody, g.cy * 0.8);
  // la queue, qui se balance
  const T = TAIL_BACK[A.tail.type];
  if (T) {
    let ta = 0.1 * Math.sin(Q.t * 1.6) + Math.sin(ph) * 0.12 * mv;
    if (mood === 'happy') ta += (A.tail.wag ?? 0.2) * 2 * Math.sin(Q.t * 13);
    const lifted = mood === 'angry' ? -0.3 : 0;
    at(ctx, 0, 26 * Math.min(1.2, g.sy) + g.cy * 0.8 + bob, ta);
    const k = (A.tail.k ?? 1) * (o.fluffy ? 1.15 : 1);
    ctx.scale(k, k * (1 + lifted) * (A.tail.len ?? 1));
    const tt = TAILS[A.tail.type];
    const col = tt.white ? '#F6F2EA' : tt.hair ? (A.maneCol || P.line) : P.base;
    piece(ctx, T, col, tt.white ? '#DCD6CA' : shade(col, -0.2), S);
    if (tt.tip && S.fine && A.tail.tip !== false) inside(ctx, 'M -26 42 C -10 52 10 52 26 42 L 26 70 L -26 70 Z', T, A.tail.tipCol || P.line);
    ctx.restore();
  }
}
/** Où sont les oreilles, sur la tête vue de dos */
function F_EAR_BACK(type, bw) {
  return (type === 'equin' ? 9 : type === 'bovin' ? 24 : type === 'elephant' ? 22 : 13) * (type === 'equin' ? 1 : bw);
}

/* ============================================================================
   LES GRANDS OISEAUX COUREURS (oiseau-terreur, Gastornis)
   ============================================================================ */
const BIRD = {
  body: 'M -50 -8 C -52 -34 -14 -44 18 -40 C 44 -36 56 -18 50 2 C 44 22 22 30 -4 30 C -30 30 -48 18 -50 -8 Z',
  belly: 'M 60 0 C 40 30 0 30 -40 14 L -60 60 L 70 60 Z',
  wing: 'M 28 -26 C 10 -34 -16 -30 -36 -18 L -30 -14 L -40 -8 L -30 -6 L -38 2 L -26 0 L -30 8 C -16 2 4 -4 22 -10 C 30 -14 32 -22 28 -26 Z',
  wingLines: 'M 14 -22 C 0 -20 -14 -16 -24 -8 M 18 -16 C 6 -12 -6 -8 -16 -2',
  tail: 'M 0 0 C -16 -12 -32 -14 -44 -8 C -34 -4 -26 0 -22 4 C -34 6 -42 12 -44 20 C -28 18 -14 12 0 8 Z',
  neck: 'M 16 -30 C 22 -50 18 -72 28 -88 L 48 -86 C 42 -68 46 -46 44 -24 Z',
  thigh: 'M -11 -8 C -12 -20 12 -20 12 -6 C 12 10 4 28 -2 42 C -4 48 -12 46 -11 40 C -12 24 -12 8 -11 -8 Z',
  shin: 'M -3 0 C -3 -4 3 -4 3 0 L 7 36 L 2 37 Z',
  toes: 'M 4 37 L 18 41 M 4 37 L 14 34 M 4 37 L -5 39',
  skull: 'M -16 -4 C -18 -20 -2 -28 12 -26 C 22 -24 28 -16 28 -6 C 28 6 20 12 8 12 C -6 12 -14 8 -16 -4 Z',
  beak: 'M 18 -20 C 34 -22 56 -16 66 -4 C 70 2 68 12 62 14 C 62 8 58 4 52 4 L 22 6 C 16 0 14 -14 18 -20 Z',
  jaw: 'M 0 -2 L 32 -2 C 36 0 34 6 30 6 L 2 6 Z',
  crest: 'M -14 -16 C -24 -26 -34 -26 -40 -20 M -12 -10 C -22 -16 -32 -14 -38 -8 M -10 -22 C -16 -32 -24 -36 -32 -34',
};
function drawBirdSide(ctx, c, Q, P, S, o, A) {
  const { mv, ph, open, mood } = Q;
  const bob = -mv * 3 * (1 - Math.cos(ph * 2)) * 0.5;
  const legCol = A.legCol || '#C9A23A';
  const legOf = (phase, far) => {
    const a = -0.6 * Math.sin(phase) * mv, lift = Math.max(0, Math.cos(phase)) * mv;
    at(ctx, -4, 8, a);
    ctx.translate(0, -lift * 4);
    at(ctx, -6, 44, 1.1 * lift);
    piece(ctx, BIRD.shin, far ? shade(legCol, -0.25) : legCol, shade(legCol, -0.35), S);
    stickPath(ctx, BIRD.toes, far ? shade(legCol, -0.25) : legCol, S);
    ctx.restore();
    piece(ctx, BIRD.thigh, far ? P.shadow : P.base, far ? P.deep : P.shadow, S);
    ctx.restore();
  };
  at(ctx, 0, bob);
  legOf(ph + PI, true);
  at(ctx, -48, -14, Math.sin(Q.t * 2) * 0.05 + mv * 0.15);
  piece(ctx, BIRD.tail, P.deep, shade(P.deep, -0.2), S);
  ctx.restore();
  piece(ctx, BIRD.neck, P.base, P.shadow, S);
  piece(ctx, BIRD.body, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, BIRD.belly, BIRD.body, P.belly);
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(BIRD.body));
  }
  piece(ctx, BIRD.wing, P.base, P.shadow, S);
  if (S.fine) strands(ctx, BIRD.wingLines, P.deep, S.lw * 0.7);
  legOf(ph, false);
  // la tête, au bout du long cou
  let ha = 0.06 * Math.sin(ph * 2) * mv + Math.sin(Q.t * 0.8) * 0.05 * (1 - mv);
  if (mood === 'angry') ha += 0.15;
  at(ctx, 38, -88 - bob * 0.3, ha);
  if (A.crest && S.fine) strands(ctx, BIRD.crest, P.deep, S.lw * 1.6);
  const ja = open * 0.5;
  if (ja > 0.04) {
    ctx.fillStyle = '#5A1420';
    ctx.beginPath();
    ctx.moveTo(22, 6);
    ctx.lineTo(60, 8);
    ctx.lineTo(22 + Math.cos(ja) * 34, 6 + Math.sin(ja) * 34);
    ctx.closePath();
    ctx.fill();
  }
  at(ctx, 22, 6, ja);
  piece(ctx, BIRD.jaw, shade(A.beakCol, -0.15), shade(A.beakCol, -0.3), S);
  ctx.restore();
  piece(ctx, BIRD.skull, P.base, P.shadow, S);
  piece(ctx, BIRD.beak, A.beakCol, shade(A.beakCol, -0.22), S);
  if (S.fine) {
    ctx.fillStyle = 'rgba(30, 18, 12, 0.6)';
    ctx.beginPath();
    ctx.ellipse(44, -8, 3, 1.6, 0.2, 0, TAU);
    ctx.fill();
  }
  almondEye(ctx, 8, -10, 7, 0.15, A.iris || '#F2C14E', mood, Q.blink, S);
  if (S.fine) {
    ctx.strokeStyle = P.deep;
    ctx.lineWidth = S.lw * 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, -18);
    ctx.quadraticCurveTo(8, -22, 18, mood === 'angry' ? -13 : -17);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
function stickPath(ctx, d, col, S) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = S.line;
  ctx.lineWidth = 5 + S.lw * 2;
  ctx.stroke(path(d));
  ctx.strokeStyle = col;
  ctx.lineWidth = 5;
  ctx.stroke(path(d));
}
function drawBirdFace(ctx, c, Q, P, S, o, A, back) {
  const { mv, ph, open, mood } = Q;
  const bob = -mv * 3 * (1 - Math.cos(ph * 2)) * 0.5;
  const legCol = A.legCol || '#C9A23A';
  // la tête et le cou (de dos : au fond, derrière le corps)
  const head = () => {
    piece(ctx, 'M -10 -30 C -12 -50 -8 -70 -8 -86 L 8 -86 C 8 -70 12 -50 10 -30 Z', P.base, P.shadow, S);
    at(ctx, 0, -92 + bob * 1.2, Math.sin(Q.t * 0.8) * 0.05);
    if (A.crest && S.fine && back) strands(ctx, 'M -6 -10 C -8 -22 -4 -30 2 -32 M 4 -10 C 6 -20 10 -26 14 -26', P.deep, S.lw * 1.6);
    piece(ctx, 'M -18 -2 C -18 -18 18 -18 18 -2 C 18 10 10 16 0 16 C -10 16 -18 10 -18 -2 Z', P.base, P.shadow, S);
    if (!back) {
      // le bec, tourné vers nous : haut, étroit, crochu au bout
      const drop = open * 8;
      if (drop > 0.5) {
        ctx.fillStyle = '#5A1420';
        ctx.beginPath();
        ctx.ellipse(0, 18 + drop * 0.5, 6, 3 + drop * 0.6, 0, 0, TAU);
        ctx.fill();
      }
      piece(ctx, 'M -10 0 C -9 -8 9 -8 10 0 C 11 14 6 26 0 34 C -6 26 -11 14 -10 0 Z', A.beakCol, shade(A.beakCol, -0.22), S);
      for (const s of [-1, 1]) {
        almondEye(ctx, s * 13, -4, 6, s * -0.15, A.iris || '#F2C14E', mood, Q.blink, S, s, 0);
        if (S.fine) {
          ctx.strokeStyle = P.deep;
          ctx.lineWidth = S.lw * 1.4;
          ctx.beginPath();
          ctx.moveTo(s * 6, mood === 'angry' ? -8 : -11);
          ctx.quadraticCurveTo(s * 13, -14, s * 20, -11);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };
  if (back) head();
  // la queue (de dos : devant nous)
  if (!back) {
    at(ctx, 0, -20);
    piece(ctx, 'M -16 0 C -22 -16 -10 -30 0 -32 C 10 -30 22 -16 16 0 Z', P.deep, shade(P.deep, -0.2), S);
    ctx.restore();
  }
  // les pattes
  for (const [s, k] of [[-1, 0], [1, PI]]) {
    const up = Math.max(0, Math.sin(ph + k)) * mv;
    at(ctx, s * 12, 24 - up * 8);
    stickPath(ctx, 'M 0 0 L 0 62', legCol, S);
    stickPath(ctx, back ? 'M 0 62 L -6 66 M 0 62 L 6 66' : 'M 0 62 L -8 68 M 0 62 L 0 70 M 0 62 L 8 68', legCol, S);
    ctx.restore();
  }
  at(ctx, 0, bob);
  piece(ctx, 'M -30 -20 C -32 -44 32 -44 30 -20 C 30 6 20 28 0 30 C -20 28 -30 6 -30 -20 Z', P.base, P.shadow, S);
  if (S.fine && !back) inside(ctx, 'M -40 -6 C -20 -12 20 -12 40 -6 L 40 60 L -40 60 Z', 'M -30 -20 C -32 -44 32 -44 30 -20 C 30 6 20 28 0 30 C -20 28 -30 6 -30 -20 Z', P.belly);
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    piece(ctx, 'M 22 -30 C 34 -24 38 -8 34 8 C 30 4 26 -4 24 -12 Z', P.deep, shade(P.deep, -0.2), S);
    ctx.restore();
  }
  ctx.restore();
  if (back) {
    at(ctx, 0, 14 + bob);
    piece(ctx, 'M -16 0 C -24 14 -14 30 0 34 C 14 30 24 14 16 0 Z', P.deep, shade(P.deep, -0.2), S);
    ctx.restore();
  } else head();
}

/* ============================================================================
   LES REPTILES (lézard, crocodiles, Ambulocetus) : tout près du sol.
   De profil : le long corps et la queue, les pattes écartées. De face et de
   dos : vus presque de dessus, la tête vers nous (ou vers le haut).
   ============================================================================ */
const REP = {
  body: 'M 56 66 C 58 54 46 48 32 48 C 6 48 -24 50 -54 56 C -84 60 -118 70 -150 82 C -118 86 -84 86 -54 84 C -24 86 6 86 32 86 C 48 86 56 78 56 66 Z',
  belly: 'M 60 74 C 30 80 -20 78 -60 78 L -60 120 L 70 120 Z',
  leg: 'M -6 -2 C -7 -8 7 -8 6 -2 C 8 4 10 8 16 10 C 20 12 18 16 12 16 L -2 16 C -8 16 -8 10 -6 6 Z',
  head: 'M -6 -10 C 0 -18 14 -18 24 -14 C 40 -10 60 -8 74 -4 C 80 -2 80 4 74 6 L 10 8 C 0 8 -6 4 -6 -10 Z',
  jaw: 'M -2 -2 L 66 -1 C 72 0 72 5 66 6 L 4 8 C -2 8 -4 4 -2 -2 Z',
  top: 'M 0 -110 C 10 -70 20 -30 22 0 C 24 30 16 50 0 56 C -16 50 -24 30 -22 0 C -20 -30 -10 -70 0 -110 Z',
  topHead: 'M -14 0 C -16 -10 16 -10 14 0 C 14 16 10 30 0 38 C -10 30 -14 16 -14 0 Z',
};
function drawRepSide(ctx, c, Q, P, S, o, A) {
  const { mv, ph, open, mood } = Q;
  const k = A.legLen ?? 1;
  const legOf = (x, phase, far) => {
    const a = -0.5 * Math.sin(phase) * mv;
    at(ctx, x, 74 - (k - 1) * 10, a);
    ctx.scale(1, k);
    piece(ctx, REP.leg, far ? P.shadow : P.base, far ? P.deep : P.shadow, S);
    ctx.restore();
  };
  const sw = Math.sin(ph) * 2 * mv;
  ctx.save();
  ctx.translate(0, -(k - 1) * 14);
  legOf(-30, ph, true);
  legOf(36, ph + PI, true);
  ctx.save();
  ctx.translate(0, sw * 0.3);
  piece(ctx, REP.body, P.base, P.shadow, S);
  if (S.fine) {
    inside(ctx, REP.belly, REP.body, P.belly);
    if (A.scutes) {
      ctx.fillStyle = P.deep;
      for (let x = 40; x > -130; x -= 10) {
        const y = x > -50 ? 49 + (40 - x) * 0.05 : 56 + (-50 - x) * 0.25;
        ctx.beginPath();
        ctx.ellipse(x, y + 1, 3.6, 2.4, 0, 0, TAU);
        ctx.fill();
      }
    }
    if (A.stripes) {
      ctx.save();
      ctx.clip(path(REP.body));
      ctx.fillStyle = P.deep;
      for (let x = 30; x > -140; x -= 18) { ctx.beginPath(); ctx.ellipse(x, 58, 3, 12, 0.2, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    ctx.strokeStyle = S.line;
    ctx.lineWidth = S.lw;
    ctx.stroke(path(REP.body));
  }
  ctx.restore();
  legOf(-24, ph + PI, false);
  legOf(42, ph, false);
  // la tête
  at(ctx, 50, 62, mood === 'angry' ? 0.04 : 0);
  ctx.scale(A.headK ?? 1, A.headK ?? 1);
  const ja = open * 0.45;
  if (ja > 0.04) {
    ctx.fillStyle = '#5A1420';
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(74, 4);
    ctx.lineTo(6 + Math.cos(ja) * 70, 6 + Math.sin(ja) * 70);
    ctx.closePath();
    ctx.fill();
  }
  at(ctx, 6, 6, ja);
  piece(ctx, REP.jaw, P.belly, P.bellyShadow, S);
  if (A.teeth && S.fine) for (let x = 12; x < 64; x += 8) fang(ctx, x, -1, -1, 4, S);
  ctx.restore();
  piece(ctx, REP.head, P.base, P.shadow, S);
  if (A.teeth && S.fine) for (let x = 16; x < 70; x += 8) fang(ctx, x, 7, 1, 4, S);
  if (A.ears && S.fine) piece(ctx, 'M 6 -12 C 4 -20 10 -24 14 -18 C 14 -14 10 -12 6 -12 Z', P.base, P.shadow, S);
  // l'œil, sur une petite bosse
  piece(ctx, 'M 16 -12 C 18 -22 32 -22 34 -12 Z', P.base, P.shadow, S);
  almondEye(ctx, 25, -14, 6, 0.1, A.iris || '#E8C23A', mood, Q.blink, S);
  ctx.fillStyle = 'rgba(30, 18, 12, 0.6)';
  ctx.beginPath();
  ctx.ellipse(72, -2, 2, 1.4, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
function drawRepTop(ctx, c, Q, P, S, o, A, back) {
  const { mv, ph, open, mood } = Q;
  const sw = Math.sin(ph) * 0.08 * mv;
  ctx.save();
  if (back) ctx.scale(1, -1);
  ctx.translate(0, 34);
  // (de dos, tout est retourné : la tête en haut, la queue vers nous)
  ctx.rotate(sw);
  // les pattes, écartées sur les côtés
  for (const [s, y, k] of [[-1, -24, 0], [1, -24, PI], [-1, 20, PI], [1, 20, 0]]) {
    const a = 0.5 * Math.sin(ph + k) * mv;
    at(ctx, s * 18, y, s * (1.2 + a));
    piece(ctx, 'M -5 0 C -5 -6 5 -6 5 0 L 4 22 C 8 24 10 28 6 30 L -6 30 C -10 28 -8 24 -4 22 Z', P.base, P.shadow, S);
    ctx.restore();
  }
  // le corps et la queue (vers le haut de l'écran)
  piece(ctx, REP.top, P.base, P.shadow, S);
  if (S.fine) {
    ctx.fillStyle = P.deep;
    for (let y = -90; y < 40; y += 11) {
      ctx.beginPath();
      ctx.ellipse(0, y, 3 + (y + 100) * 0.02, 2.4, 0, 0, TAU);
      ctx.fill();
    }
  }
  // la tête, vers nous
  at(ctx, 0, 52);
  ctx.scale(A.headK ?? 1, (A.headK ?? 1) * (A.snout ?? 1));
  piece(ctx, REP.topHead, P.base, P.shadow, S);
  ctx.restore();
  ctx.restore();
  if (!back) {
    // les yeux, sur le dessus de la tête
    for (const s of [-1, 1]) almondEye(ctx, s * 9, 90, 5, 0, A.iris || '#E8C23A', mood, Q.blink, S, s, 0);
    if (open > 0.1 && A.teeth) for (const s of [-1, 1]) fang(ctx, s * 10, 104, 1, 5, S);
  }
}

/* ============================================================================
   LES ESPÈCES : les mesures de chaque animal
   ============================================================================ */
const quad = (A) => ({ side: drawQSide, face: drawQFace, dos: drawQDos, ...A });
const L4 = (foot, w = 1, thigh = 1, extra = {}) => ({ foot, w, thigh, ...extra });

export const ANIMAUX = {
  /* ---- Les canidés (et leurs cousins) ---- */
  louveteau: quad({
    scale: 1.2, body: { L: 60, topF: -20, topR: -12, chest: 46, belly: 38 }, legs: L4('patte', 0.95, 0.9),
    neck: { type: 'collerette', k: 0.85 }, head: { type: 'canin', k: 1.22, ear: 'pointe', earK: 1.1, at: [52, -22] },
    tail: { type: 'touffue', k: 0.75, wag: 0.3 }, pattern: { saddle: true }, W: 34, faceHead: -10, iris: '#C98A2E',
  }),
  chien: quad({
    scale: 1.25, body: { L: 76, topF: -32, topR: -24, chest: 38, belly: 26 }, legs: L4('patte'),
    neck: { type: 'collerette', k: 0.75 }, head: { type: 'canin', k: 1.05, ear: 'pointe', earK: 0.85 },
    tail: { type: 'touffue', a: 1.1, k: 0.9, wag: 0.3 }, pattern: {}, iris: '#8A5A2A',
  }),
  berger: quad({
    scale: 1.28, body: { L: 80, topF: -34, topR: -25, chest: 40, belly: 26 }, legs: L4('patte'),
    neck: { type: 'collerette', k: 1.1 }, head: { type: 'canin', ear: 'pointe' },
    tail: { type: 'touffue', k: 1.05, wag: 0.25 }, pattern: { saddle: true }, iris: '#8A5A2A',
  }),
  miacis: quad({
    scale: 1.15, body: { L: 90, topF: -18, topR: -14, chest: 32, belly: 28 }, legs: L4('patte', 0.85, 0.85),
    neck: { type: 'collerette', k: 0.8 }, head: { type: 'canin', k: 0.85, ear: 'rond', earK: 1.1 },
    tail: { type: 'touffue', k: 1.05, a: 0.4 }, pattern: { stripes: 6 }, W: 32,
  }),
  hyaenodon: quad({
    scale: 1.25, body: { L: 82, topF: -34, topR: -26, chest: 38, belly: 26 }, legs: L4('patte', 1.05),
    neck: { type: 'collerette', k: 0.8 }, head: { type: 'canin', k: 1.2, ear: 'pointe', earK: 0.8 },
    tail: { type: 'fine', k: 0.9 }, pattern: { stripes: 5 }, iris: '#D0A040',
  }),
  hyene: quad({
    scale: 1.25, body: { L: 76, topF: -44, topR: -18, chest: 40, belly: 28 }, legs: L4('patte', 1.05, 1.05),
    neck: { type: 'collerette', k: 0.9 }, head: { type: 'canin', k: 1.05, ear: 'rond', earK: 1.2, lightCol: '#3A2E26' },
    tail: { type: 'touffe', k: 0.9 }, pattern: { spots: 18, ridge: true }, iris: '#C98A2E',
  }),
  amphicyon: quad({
    scale: 1.3, body: { L: 86, topF: -38, topR: -30, chest: 44, belly: 32 }, legs: L4('patte', 1.35, 1.25, { claws: true }),
    neck: { type: 'collerette', k: 1.05 }, head: { type: 'canin', k: 1.1, ear: 'rond', earK: 1.1 },
    tail: { type: 'touffue', k: 1.1 }, pattern: { saddle: true }, W: 44, iris: '#C77A2A',
  }),
  andrewsarchus: quad({
    scale: 1.3, body: { L: 84, topF: -40, topR: -28, chest: 42, belly: 30, hump: 6 }, legs: L4('sabot', 1.25, 1.2),
    neck: { type: 'collerette', k: 0.95 }, head: { type: 'canin', k: 1.45, ear: 'petit', earK: 1.1, at: [70, -36] },
    tail: { type: 'fine', k: 0.9 }, pattern: { stripes: 6 }, W: 44, iris: '#C77A2A',
  }),
  /* ---- Les félins ---- */
  proailurus: quad({
    scale: 1.2, body: { L: 80, topF: -28, topR: -24, chest: 34, belly: 26 }, legs: L4('patte', 1.05, 1.05),
    neck: null, head: { type: 'felin', k: 1.05, ear: 'pointe', earK: 0.75, at: [72, -24], whiskers: true },
    tail: { type: 'fine', k: 1.05, a: 0.3 }, pattern: { spots: 16 }, iris: '#C98A2E',
  }),
  machairodus: quad({
    scale: 1.28, body: { L: 82, topF: -34, topR: -28, chest: 38, belly: 28 }, legs: L4('patte', 1.2, 1.2),
    neck: null, head: { type: 'felin', k: 1.12, ear: 'rond', earK: 0.9, sabers: 1, at: [74, -30], whiskers: true },
    tail: { type: 'fine', k: 0.8, a: 0.3 }, pattern: { stripes: 9 }, W: 40, iris: '#D9A13A',
  }),
  homotherium: quad({
    scale: 1.3, body: { L: 82, topF: -44, topR: -24, chest: 42, belly: 30 }, legs: L4('patte', 1.3, 1.3),
    neck: null, head: { type: 'felin', k: 1.15, ear: 'petit', earK: 1.2, sabers: 0.9, at: [74, -38], whiskers: true },
    tail: { type: 'courte' }, pattern: { stripes: 6 }, W: 42, iris: '#D9A13A',
  }),
  'lion-des-cavernes': quad({
    scale: 1.3, body: { L: 84, topF: -34, topR: -28, chest: 38, belly: 28 }, legs: L4('patte', 1.2, 1.2),
    neck: null, head: { type: 'felin', k: 1.15, ear: 'rond', earK: 0.85, at: [76, -30], whiskers: true },
    tail: { type: 'touffe', k: 1.1, a: 0.25 }, pattern: {}, W: 40, iris: '#D9A13A',
  }),
  /* ---- L'ours ---- */
  'ours-des-cavernes': quad({
    scale: 1.3, body: { L: 80, topF: -42, topR: -34, chest: 46, belly: 36, hump: 10 }, legs: L4('patte', 1.5, 1.4, { claws: true, swing: 0.8 }),
    neck: null, head: { type: 'ours', k: 1.15, ear: 'rond', earK: 1, at: [72, -30], light: false, mask: false },
    tail: { type: 'courte' }, pattern: {}, W: 48, iris: '#5A3418',
  }),
  /* ---- Les rongeurs, les petits mammifères ---- */
  musaraigne: quad({
    scale: 1.15, body: { L: 66, topF: 30, topR: 32, chest: 78, belly: 76 }, legs: L4('patte', 0.75, 0.7),
    neck: null, head: { type: 'rongeur', k: 1.05, ear: 'petit', earK: 1.1, at: [56, 36], whiskers: true },
    tail: { type: 'fine', k: 0.85, a: -0.2 }, pattern: {}, W: 34, faceHead: 46, backHead: 20, iris: '#3A2418',
  }),
  palaeolagus: quad({
    scale: 1.15, body: { L: 56, topF: 18, topR: 10, chest: 74, belly: 70 }, legs: L4('patte', 0.9, 1.25),
    neck: null, head: { type: 'rongeur', k: 1.15, ear: 'long', earK: 1, at: [50, 22] },
    tail: { type: 'pompon', k: 1 }, pattern: {}, W: 34, faceHead: 30, backHead: 2, iris: '#3A2418',
  }),
  marmotte: quad({
    scale: 1.15, body: { L: 62, topF: 24, topR: 22, chest: 80, belly: 78 }, legs: L4('patte', 0.95, 0.9, { claws: true }),
    neck: null, head: { type: 'rongeur', k: 1.15, ear: 'petit', earK: 1, at: [54, 30] },
    tail: { type: 'touffue', k: 0.55, a: 0.3 }, pattern: {}, W: 40, faceHead: 40, backHead: 12, iris: '#3A2418',
  }),
  darwinius: quad({
    scale: 1.15, body: { L: 60, topF: 10, topR: 8, chest: 58, belly: 52 }, legs: L4('patte', 0.85, 0.85),
    neck: null, head: { type: 'rongeur', k: 1.2, ear: 'rond', earK: 0.9, at: [52, 14] },
    tail: { type: 'fine', k: 1.25, a: 0.6 }, pattern: {}, W: 32, faceHead: 22, backHead: -8, iris: '#C98A2E',
  }),
  /* ---- Les chevaux, les cerfs, les antilopes, la chèvre, le mouton ---- */
  eohippus: quad({
    scale: 1.15, body: { L: 64, topF: -26, topR: -30, chest: 26, belly: 20 }, legs: L4('sabot', 0.75, 0.85),
    neck: { type: 'cou', w: 10 }, head: { type: 'equin', k: 0.85, ear: 'cheval', at: [64, -58], a: 0.55, iris: '#3A2418' },
    tail: { type: 'courte' }, pattern: { spots: 12, spotCol: '#F2E6C8' }, W: 30, faceHead: -54, backHead: -66,
  }),
  mesohippus: quad({
    scale: 1.2, body: { L: 70, topF: -30, topR: -30, chest: 24, belly: 18 }, legs: L4('sabot', 0.75, 0.85),
    neck: { type: 'cou', w: 11, mane: 7 }, head: { type: 'equin', k: 0.95, ear: 'cheval', at: [72, -70], a: 0.65, iris: '#3A2418' },
    tail: { type: 'crin', k: 0.85, a: -0.2 }, pattern: {}, W: 30, faceHead: -64, backHead: -78,
  }),
  hipparion: quad({
    scale: 1.25, body: { L: 74, topF: -34, topR: -32, chest: 24, belly: 18 }, legs: L4('sabot', 0.85, 0.95),
    neck: { type: 'cou', w: 13, mane: 8 }, head: { type: 'equin', k: 1.05, ear: 'cheval', at: [78, -78], a: 0.65, iris: '#3A2418' },
    tail: { type: 'crin', k: 0.95, a: -0.2 }, pattern: { stripes: 7 }, W: 32, faceHead: -70, backHead: -84,
  }),
  cheval: quad({
    scale: 1.3, body: { L: 78, topF: -36, topR: -34, chest: 24, belly: 18 }, legs: L4('sabot', 0.95, 1),
    neck: { type: 'cou', w: 15, mane: 9 }, head: { type: 'equin', k: 1.1, ear: 'cheval', at: [82, -82], a: 0.7, iris: '#3A2418', blaze: true },
    tail: { type: 'crin', k: 1.05, a: -0.2 }, pattern: {}, W: 34, faceHead: -74, backHead: -88, maneCol: '#3A2A1E',
  }),
  gazelle: quad({
    scale: 1.2, body: { L: 64, topF: -30, topR: -32, chest: 18, belly: 14 }, legs: L4('sabot', 0.6, 0.75),
    neck: { type: 'cou', w: 9 }, head: { type: 'equin', k: 0.82, ear: 'cheval', earK: 1.1, horns: 'gazelle', at: [64, -70], a: 0.4, iris: '#2A1A12' },
    tail: { type: 'courte', k: 0.7 }, pattern: {}, W: 28, faceHead: -66, backHead: -78,
  }),
  renne: quad({
    scale: 1.25, body: { L: 74, topF: -34, topR: -32, chest: 26, belly: 20 }, legs: L4('sabot', 0.8, 0.95),
    neck: { type: 'cou', w: 14 }, head: { type: 'equin', k: 0.95, ear: 'cheval', antlers: 'renne', antlerK: 1, at: [76, -72], a: 0.45, iris: '#2A1A12' },
    tail: { type: 'courte', k: 0.8 }, pattern: {}, W: 34, faceHead: -66, backHead: -80,
  }),
  megaloceros: quad({
    scale: 1.3, body: { L: 78, topF: -38, topR: -32, chest: 26, belly: 20, hump: 4 }, legs: L4('sabot', 0.9, 1),
    neck: { type: 'cou', w: 15 }, head: { type: 'equin', k: 1, ear: 'cheval', antlers: 'megaceros', antlerK: 1.25, at: [80, -76], a: 0.45, iris: '#2A1A12' },
    tail: { type: 'courte', k: 0.8 }, pattern: {}, W: 36, faceHead: -70, backHead: -84,
  }),
  chevre: quad({
    scale: 1.15, body: { L: 62, topF: -26, topR: -26, chest: 24, belly: 18 }, legs: L4('sabot', 0.7, 0.85),
    neck: { type: 'cou', w: 10 }, head: { type: 'equin', k: 0.82, ear: 'cheval', horns: 'chevre', beard: 0.9, at: [62, -58], a: 0.45, iris: '#C9A23A' },
    tail: { type: 'courte', k: 0.7, a: 1 }, pattern: {}, W: 30, faceHead: -54, backHead: -66,
  }),
  mouton: quad({
    scale: 1.2, body: { L: 64, topF: -22, topR: -22, chest: 32, belly: 28 }, legs: L4('sabot', 0.7, 0.8, { col: '#3A302A' }),
    neck: null, head: { type: 'equin', k: 0.75, ear: 'lateral', earK: 0.8, at: [62, -24], a: 0.5, iris: '#2A1A12', light: false, mask: false },
    tail: { type: 'courte', k: 0.8 }, pattern: { belly: false }, W: 38, faceHead: -18, backHead: -40,
    coat: { wool: '#F2EEE4' }, headCol: '#3A302A',
  }),
  chalicothere: quad({
    scale: 1.3, body: { L: 74, topF: -46, topR: -26, chest: 34, belly: 26 }, legs: L4('patte', 1.1, 1.15, { claws: true }),
    neck: { type: 'cou', w: 15 }, head: { type: 'equin', k: 1, ear: 'cheval', at: [78, -78], a: 0.6, iris: '#2A1A12' },
    tail: { type: 'courte' }, pattern: {}, W: 40, faceHead: -70, backHead: -84,
  }),
  paraceratherium: quad({
    scale: 1.32, body: { L: 80, topF: -44, topR: -36, chest: 22, belly: 16 }, legs: L4('colonne', 1.3, 1.25, { swing: 0.7 }),
    neck: { type: 'cou', w: 18 }, head: { type: 'equin', k: 1.1, ear: 'cheval', at: [96, -104], a: 0.55, iris: '#2A1A12' },
    tail: { type: 'touffe', k: 0.8 }, pattern: {}, W: 44, faceHead: -94, backHead: -104,
  }),
  /* ---- Les bovins, le rhinocéros, le « cochon de l'enfer » ---- */
  bison: quad({
    scale: 1.3, body: { L: 78, topF: -38, topR: -24, chest: 40, belly: 28, hump: 24 }, legs: L4('sabot', 1.05, 1.15, { swing: 0.85 }),
    neck: null, head: { type: 'bovin', k: 1.1, ear: 'lateral', earK: 0.8, horns: 'bison', beard: 1, at: [74, -12], a: 0.35, iris: '#2A1A12' },
    tail: { type: 'touffe', k: 0.9 }, pattern: {}, W: 48, faceHead: -6, backHead: -60,
    coat: { cape: true, shaggy: 9 },
  }),
  aurochs: quad({
    scale: 1.3, body: { L: 80, topF: -38, topR: -30, chest: 38, belly: 28, hump: 8 }, legs: L4('sabot', 1.05, 1.1, { swing: 0.85 }),
    neck: null, head: { type: 'bovin', k: 1.05, ear: 'lateral', earK: 0.8, horns: 'aurochs', at: [76, -18], a: 0.3, iris: '#2A1A12', lightCol: '#C9B79A' },
    tail: { type: 'touffe', k: 0.95 }, pattern: {}, W: 46, faceHead: -10, backHead: -60,
  }),
  'rhino-laineux': quad({
    scale: 1.3, body: { L: 84, topF: -36, topR: -30, chest: 40, belly: 32, hump: 10 }, legs: L4('colonne', 1.3, 1.25, { swing: 0.8 }),
    neck: null, head: { type: 'bovin', k: 1.15, ear: 'pointe', earK: 0.6, horns: 'rhino', at: [76, -8], a: 0.45, iris: '#2A1A12' },
    tail: { type: 'touffe', k: 0.7 }, pattern: {}, W: 48, faceHead: -2, backHead: -58,
    coat: { shaggy: 14 },
  }),
  entelodon: quad({
    scale: 1.3, body: { L: 76, topF: -40, topR: -24, chest: 36, belly: 26, hump: 16 }, legs: L4('sabot', 0.95, 1.05),
    neck: null, head: { type: 'cochon', k: 1.25, ear: 'pointe', earK: 0.6, flanges: true, at: [70, -18], a: 0.25, iris: '#B5452E' },
    tail: { type: 'touffe', k: 0.6 }, pattern: { ridge: true }, W: 42, faceHead: -8, backHead: -58,
  }),
  /* ---- Les éléphants ---- */
  mammouth: quad({
    scale: 1.32, body: { L: 80, topF: -44, topR: -30, chest: 42, belly: 36, hump: 18 }, legs: L4('colonne', 1.7, 1.5, { swing: 0.7 }),
    neck: null, head: { type: 'elephant', k: 1.15, ear: 'elephant', earK: 0.6, trunk: 1.15, tusks: 'mammouth', tuskK: 1.2, at: [68, -34], a: 0.15, iris: '#3A2418' },
    tail: { type: 'touffe', k: 0.6 }, pattern: { belly: false }, W: 50, faceHead: -20, backHead: -62,
    coat: { shaggy: 18 },
  }),
  deinotherium: quad({
    scale: 1.32, body: { L: 80, topF: -40, topR: -32, chest: 40, belly: 34, hump: 6 }, legs: L4('colonne', 1.6, 1.4, { swing: 0.7 }),
    neck: null, head: { type: 'elephant', k: 1.1, ear: 'elephant', earK: 1.15, trunk: 0.95, tusks: 'deino', tuskK: 1.2, at: [70, -30], a: 0.1, iris: '#3A2418' },
    tail: { type: 'touffe', k: 0.6 }, pattern: { belly: false }, W: 50, faceHead: -18, backHead: -60,
  }),
  /* ---- Les grands oiseaux coureurs ---- */
  'oiseau-terreur': { scale: 1.15, side: drawBirdSide, face: (x, c, Q, P, S, o, A) => drawBirdFace(x, c, Q, P, S, o, A, false), dos: (x, c, Q, P, S, o, A) => drawBirdFace(x, c, Q, P, S, o, A, true), beakCol: '#D9A441', crest: true, iris: '#F2C14E', eyes: { side: [46, -98], face: [13, -96] }, shadow: { side: 60, face: 36 } },
  gastornis: { scale: 1.3, side: drawBirdSide, face: (x, c, Q, P, S, o, A) => drawBirdFace(x, c, Q, P, S, o, A, false), dos: (x, c, Q, P, S, o, A) => drawBirdFace(x, c, Q, P, S, o, A, true), beakCol: '#E2B33C', iris: '#E8833A', legCol: '#8A7A4A', shadow: { side: 60, face: 36 } },
  /* ---- Les reptiles (et la « baleine qui marche ») ---- */
  lezard: { scale: 1.0, side: drawRepSide, face: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, false), dos: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, true), stripes: true, headK: 0.6, snout: 0.8, iris: '#E8C23A', shadow: { side: 110, face: 30 } },
  crocodile: { scale: 1.0, side: drawRepSide, face: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, false), dos: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, true), scutes: true, teeth: true, iris: '#C9D23A', snout: 1.2, eyes: { side: [75, 34], face: [9, 90] }, shadow: { side: 110, face: 30 } },
  'crocodile-coureur': { scale: 1.0, side: drawRepSide, face: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, false), dos: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, true), scutes: true, teeth: true, legLen: 1.8, iris: '#F2C14E', eyes: { side: [75, 20], face: [9, 90] }, shadow: { side: 110, face: 30 } },
  ambulocetus: { scale: 0.95, side: drawRepSide, face: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, false), dos: (x, c, Q, P, S, o, A) => drawRepTop(x, c, Q, P, S, o, A, true), teeth: true, ears: true, legLen: 1.3, iris: '#C9A13A', eyes: { side: [75, 30], face: [9, 90] }, shadow: { side: 110, face: 30 } },
};

/* ---------- L'ombre, les yeux (pour les yeux rouges des chasseurs) ---------- */
for (const A of Object.values(ANIMAUX)) {
  if (!A.body) continue;
  const g = geo(A);
  const hk = A.head.k ?? 1;
  const H = g.HS, F = g.HF;
  A.shadow = A.shadow || { side: g.f * 92 + 6, face: g.W * 1.2 };
  A.eyes = A.eyes || {
    side: [g.headAt[0] + H.eye[0] * hk, g.headAt[1] + H.eye[1] * hk],
    face: [F.eye[0] * hk, g.faceHeadY + F.eye[1] * hk],
  };
}

/** La vignette : l'animal entier, de profil, bien au milieu */
function frameOf(A) {
  if (A.side === drawBirdSide) return { r: 0.24, x: 0.45, y: 0.54 };
  if (A.side === drawRepSide) return { r: 0.22, x: 0.52, y: 0.3 };
  const g = geo(A);
  const hk = A.head.k ?? 1;
  const right = Math.max(g.f * 84, g.headAt[0] + 72 * hk), left = g.f * -84 - 40 * (A.tail.k ?? 1);
  const top = Math.min(A.body.topF - (A.body.hump || 0), g.headAt[1] - 36 * hk - (A.head.antlers ? 50 : 0)), bottom = 92;
  const w = right - left, h = bottom - top;
  const r = Math.min(84 / (w * A.scale), 80 / (h * A.scale));
  return { r: +r.toFixed(3), x: +(0.5 - ((left + right) / 2) * r * A.scale / 100).toFixed(3), y: +(0.52 - ((top + bottom) / 2) * r * A.scale / 100).toFixed(3) };
}

/* ---------- Les looks « dc-… » (même portée de gueule qu'avant : celle des looks « tq-… ») ---------- */
for (const [id, A] of Object.entries(ANIMAUX)) {
  registerCutout(id, A);
  addCutoutLook(`dc-${id}`, id, { snout: SNOUT[`tq-${id}`] ?? 0.62, frame: frameOf(A) });
}

/* ============================================================================
   Le joueur : ses formes, et ses évolutions qui se voient.
   Niveau 3 : moustaches, fourrure, grandes oreilles, griffes, gros nez (flair),
   dents de sabre de plus en plus longues, longs poils.
   Niveau 4 : gros nez, pelage épais, oreilles tombantes, queue en
   tire-bouchon, pelage tacheté.
   ============================================================================ */
const VARIANTS = new Map();
function variant(id, parts) {
  const keys = ['oreilles', 'griffes', 'fourrure', 'fourrure-epaisse', 'queue-tire-bouchon', 'oreilles-tombantes'].filter((k) => parts[k]);
  const key = id + '|' + keys.join(',');
  let A = VARIANTS.get(key);
  if (!A) {
    const B = ANIMAUX[id];
    A = { ...B, head: { ...B.head }, legs: { ...B.legs }, tail: { ...B.tail }, coat: { ...(B.coat || {}) } };
    delete A._g;
    if (parts.griffes) A.legs.claws = true;
    if (parts['fourrure-epaisse']) A.coat.shaggy = 8;
    if (parts['queue-tire-bouchon']) A.tail = { ...A.tail, a: 2.2, k: (A.tail.k ?? 1) * 0.85, wag: 0.4 };
    if (parts['oreilles-tombantes']) A.head.ear = 'tombante';
    VARIANTS.set(key, A);
    registerCutout(key, A);
  }
  return key;
}
for (const id of ['musaraigne', 'miacis', 'proailurus', 'machairodus', 'homotherium', 'louveteau', 'chien', 'berger']) {
  const form = `dc-${id}`;
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const P = parts || {};
    drawCutout(ctx, p, t, variant(id, P), PLAYER.body, {
      belly: PLAYER.belly, dark: PLAYER.dark, stripe: PLAYER.stripe, cute: true, mood,
      bigNose: !!P.flair, fluffy: !!(P.fourrure || P['pelage-epais']), whiskers: !!P.moustaches, bigEars: !!P.oreilles,
      saberK: (P['dents-de-sabre'] ? 1.3 : 1) * (P['grands-sabres'] ? 1.45 : 1),
      patch: P['pelage-tachete'] ? PLAYER.patch || '#FFFFFF' : null,
    });
  };
  FORM_SPINE[form] = null;
  SNOUT[form] = SNOUT[`tq-${id}`] ?? 0.62;
  FRAMES[form] = frameOf(ANIMAUX[id]);
}
