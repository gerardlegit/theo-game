// ============================================================================
// Évolution 3D — le catalogue des animaux : leurs mesures réelles (en mètres),
// leurs couleurs, et ce qui les rend reconnaissables. Le niveau
// (levels/vers-les-dinosaures.js) les appelle par leur nom.
// ============================================================================

import { buildPlan, theropod, quadruped, crawler } from './corps.js';

const CATALOGUE = {
  /* ---- Les formes du joueur ---- */
  tetrapode: (o) => quadruped({
    top: '#2E7A6C', side: '#4FAE9C', belly: '#F1E3A0', mark: '#1D5A4E', iris: '#F4C430', spots: 5, cute: true, dorsal: true,
    H: 0.2, foreH: 0.19, d: 0.15, trunk: 0.5, neck: 0.1, neckRise: 0.1, neckR: 0.11, tail: 0.65, tailLift: 0, hl: 0.26, hh: 0.17, hw: 0.14, legW: 0.045, legZ: 1, splay: 0.55, eye: 0.042, toes: 4, strideK: 0.5, toeClaw: 0, ...o,
  }),
  reptile: (o) => quadruped({
    top: '#8A4A16', side: '#D98E3A', belly: '#F7E0A8', mark: '#6B3A12', iris: '#FFD24A', stripes: 22, cute: true,
    H: 0.27, foreH: 0.25, d: 0.14, trunk: 0.5, neck: 0.16, neckRise: 0.32, neckR: 0.08, tail: 0.85, tailLift: 0, hl: 0.22, hh: 0.14, hw: 0.1, legW: 0.05, legZ: 1.05, splay: 0.42, eye: 0.034, toes: 4, strideK: 0.55, teeth: 3, ...o,
  }),
  // carnivore
  herrerasaure: (o) => theropod({
    top: '#7A2A1C', side: '#C8553D', belly: '#F6CFA8', mark: '#5E1F14', iris: '#F2C14E', stripes: 8, cute: true,
    H: 0.85, d: 0.3, trunk: 0.72, neck: 0.42, neckRise: 0.62, neckR: 0.11, tail: 1.75, hl: 0.42, hh: 0.26, hw: 0.13, teeth: 7, armL: 0.2, armW: 0.04, ...o,
  }),
  allosaure: (o) => theropod({
    top: '#1B3A5C', side: '#3E7CB8', belly: '#DCEAF5', mark: '#F2C14E', iris: '#F2C14E', stripes: 3.2, cute: true,
    H: 2.0, d: 0.78, trunk: 1.6, neck: 0.8, neckRise: 0.6, neckR: 0.34, tail: 4.2, hl: 1.05, hh: 0.68, hw: 0.32, teeth: 8, armL: 0.42, armW: 0.1, brows: 0.2, ...o,
  }),
  trex: (o) => theropod({
    top: '#123336', side: '#2F6E73', belly: '#F2D7A6', mark: '#E9822B', iris: '#FFB02E', stripes: 2, cute: true,
    H: 2.9, d: 1.25, trunk: 2.2, neck: 0.95, neckRise: 0.5, neckR: 0.62, tail: 5.8, hl: 1.75, hh: 1.2, hw: 0.62, teeth: 8, toothL: 0.2, armL: 0.26, armW: 0.08, jawH: 1.3, ...o,
  }),
  // herbivore
  plateosaure: (o) => theropod({
    top: '#3D6B3A', side: '#7FA84F', belly: '#EFE6B8', mark: '#2F5230', iris: '#D9A13A', spots: 3, cute: true, brow: false,
    H: 1.1, d: 0.42, trunk: 0.95, neck: 1.0, neckRise: 0.75, neckR: 0.13, tail: 2.3, hl: 0.34, hh: 0.2, hw: 0.11, teeth: 0, beak: '#C9B27A', armL: 0.38, armW: 0.07, ...o,
  }),
  stegosaure: (o) => quadruped({
    top: '#4F6B2E', side: '#7D9440', belly: '#E6DFB0', mark: '#C8553D', sail: '#D9734E', iris: '#F4C430', spots: 3, cute: true,
    H: 1.75, foreH: 1.05, d: 0.82, trunk: 1.7, neck: 0.75, neckRise: -0.12, neckR: 0.24, tail: 3.2, tailLift: 0.12, hl: 0.5, hh: 0.3, hw: 0.2, beak: '#C9B27A', legW: 0.26, eye: 0.06,
    plates: { from: -2.0, to: 1.9, n: 13, h: 0.75 }, spikes: { bone: 'tail3', L: 0.8 }, ...o,
  }),
  triceratops: (o) => quadruped({
    top: '#6E5A36', side: '#A58A52', belly: '#E8D9B0', mark: '#4F3E22', sail: '#C8553D', iris: '#F2C14E', spots: 2, cute: true,
    H: 1.65, foreH: 1.45, d: 1.05, trunk: 2.1, neck: 0.5, neckRise: -0.15, neckR: 0.55, tail: 2.6, tailLift: 0.06, hl: 1.4, hh: 0.92, hw: 0.56, beak: '#3A2E26', legW: 0.34, eye: 0.09,
    frill: { r: 1.15, back: 0.8 },
    horns: [{ at: 0.3, up: 0.45, z: 0.42, L: 1.05, r: 0.13, fwd: 0.92, rise: 0.38, out: 0.05 }, { at: 0.86, up: 0.1, L: 0.34, r: 0.09, fwd: 0.5, rise: 0.8 }], ...o,
  }),

  /* ---- Chapitre 1 : la sortie de l'eau ---- */
  'mille-pattes': (o) => crawler({
    top: '#5A3A22', side: '#7A5230', belly: '#A08050', mark: '#3A2414', stripes: 40, sides: 8, outline: 0.006,
    spine: seq([[-0.28, 0.04, 0.012, 0.012, 'tail2'], [-0.16, 0.045, 0.03, 0.03, 'tail1'], [0, 0.05, 0.034, 0.034, 'hip'], [0.16, 0.05, 0.034, 0.034, 'chest'], [0.26, 0.05, 0.03, 0.03, 'head'], [0.31, 0.045, 0.012, 0.012]]),
    manyLegs: { from: -0.26, to: 0.26, n: 16, z: 0.03, L: 0.06, r: 0.006 }, stride: 0.1, wave: 7, ...o,
  }),
  insecte: (o) => crawler({
    top: '#3F6A2C', side: '#6E9A42', belly: '#B9C96A', mark: '#2A4A1E', sides: 8, outline: 0.004,
    spine: seq([[-0.09, 0.03, 0.006, 0.006, 'tail1'], [-0.04, 0.035, 0.024, 0.02, 'hip'], [0.03, 0.036, 0.02, 0.018, 'chest'], [0.07, 0.036, 0.016, 0.014, 'head'], [0.09, 0.032, 0.005, 0.005]]),
    manyLegs: { from: -0.05, to: 0.04, n: 3, z: 0.016, L: 0.045, r: 0.004 }, stride: 0.05, ...o,
  }),
  scorpion: (o) => crawler({
    top: '#3A2A20', side: '#5A4230', belly: '#8A6E50', mark: '#241812', stripes: 16, sides: 8, outline: 0.012, iris: '#D9534F',
    spine: seq([[-0.92, 0.72, 0.012, 0.012, 'tail4'], [-0.86, 0.66, 0.05, 0.05, 'tail3'], [-0.68, 0.42, 0.07, 0.07, 'tail2'], [-0.48, 0.2, 0.09, 0.09, 'tail1'], [-0.2, 0.16, 0.2, 0.09, 'hip'], [0.1, 0.17, 0.24, 0.1, 'chest'], [0.28, 0.17, 0.2, 0.08, 'head'], [0.42, 0.14, 0.08, 0.04]]),
    claws: { x: 0.28, y: 0.15, z: 0.14, L: 0.32, r: 0.05 }, manyLegs: { from: -0.25, to: 0.2, n: 4, z: 0.2, L: 0.26, r: 0.018 }, stride: 0.25, spec: 'scorpion', ...o,
  }),
  'scorpion-geant': (o) => CATALOGUE.scorpion({ top: '#241510', side: '#4A2A1C', mark: '#120A08', ...o }),
  hyneria: (o) => crawler({
    top: '#3D4F36', side: '#6E7E4A', belly: '#D6CFA0', mark: '#2A3522', spots: 3, sides: 10, outline: 0.03, iris: '#F2C14E',
    spine: seq([[-1.9, 0.4, 0.012, 0.22, 'tail4'], [-1.55, 0.4, 0.08, 0.12, 'tail3'], [-1.0, 0.4, 0.22, 0.26, 'tail2'], [-0.45, 0.42, 0.36, 0.4, 'tail1'], [0.1, 0.44, 0.44, 0.46, 'hip'], [0.65, 0.44, 0.42, 0.4, 'chest'], [1.15, 0.42, 0.36, 0.3, 'head', true], [1.5, 0.4, 0.24, 0.18, 0, true], [1.72, 0.37, 0.1, 0.08, 0, true]]),
    head: { x: 1.15, y: 0.42, l: 0.6, h: 0.5, w: 0.3, eye: 0.075, eyeX: 0.15, eyeY: 0.3, eyeZ: 0.8, teeth: 7, toothL: 0.09 }, brow: true, wave: 6, stride: 1, spec: 'poisson', ...o,
  }),
  'cousin-tetrapode': (o) => CATALOGUE.tetrapode({ top: '#3A5A7A', side: '#6E9AB0', mark: '#2A4258', cute: false, ...o }),

  /* ---- Chapitre 2 : la forêt de charbon ---- */
  blatte: (o) => crawler({
    top: '#4A2A14', side: '#6E4422', belly: '#A0784A', mark: '#2A180C', sides: 8, outline: 0.006,
    spine: seq([[-0.2, 0.05, 0.02, 0.012, 'tail1'], [-0.1, 0.06, 0.09, 0.04, 'hip'], [0.06, 0.06, 0.09, 0.04, 'chest'], [0.16, 0.05, 0.05, 0.03, 'head'], [0.2, 0.045, 0.015, 0.012]]),
    manyLegs: { from: -0.1, to: 0.08, n: 3, z: 0.08, L: 0.1, r: 0.008 }, stride: 0.12, ...o,
  }),
  meganeura: (o) => crawler({
    top: '#1E6E8A', side: '#3FA0B8', belly: '#BFE8EE', mark: '#123F4F', stripes: 14, sides: 8, outline: 0.006, flies: true, iris: '#E2574C',
    spine: seq([[-0.55, 0, 0.01, 0.01, 'tail3'], [-0.34, 0, 0.028, 0.028, 'tail2'], [-0.1, 0, 0.04, 0.04, 'tail1'], [0.02, 0, 0.055, 0.055, 'hip'], [0.1, 0, 0.055, 0.05, 'chest'], [0.17, 0, 0.05, 0.05, 'head'], [0.22, 0, 0.018, 0.018]]),
    wing: { x: 0.06, y: 0.02, z: 0.03, span: 0.62, chord: 0.12, col: '#BFE8EE', tipCol: '#E4F7FA' }, stride: 0.4, ...o,
  }),
  arthropleura: (o) => crawler({
    top: '#3A2E20', side: '#5E4C34', belly: '#8E7A5A', mark: '#22180F', stripes: 9, sides: 10, outline: 0.03,
    spine: seq([[-1.3, 0.16, 0.08, 0.04, 'tail3'], [-0.9, 0.22, 0.24, 0.1, 'tail2'], [-0.4, 0.25, 0.34, 0.13, 'tail1'], [0.1, 0.26, 0.36, 0.14, 'hip'], [0.6, 0.25, 0.32, 0.13, 'chest'], [1.0, 0.2, 0.22, 0.1, 'head'], [1.2, 0.17, 0.08, 0.05]]),
    manyLegs: { from: -1.1, to: 0.95, n: 18, z: 0.28, L: 0.26, r: 0.024 }, stride: 0.5, wave: 3, ...o,
  }),
  dimetrodon: (o) => quadruped({
    top: '#5E3A22', side: '#94633A', belly: '#D8BE90', mark: '#3E2412', sail: '#C8553D', iris: '#F2C14E', spots: 4, brow: true,
    H: 0.48, foreH: 0.46, d: 0.32, trunk: 0.95, neck: 0.3, neckRise: 0.05, neckR: 0.16, tail: 1.3, tailLift: -0.02, hl: 0.55, hh: 0.38, hw: 0.17, teeth: 6, toothL: 0.07, legW: 0.1, legZ: 1, splay: 0.4,
    sail: { from: -0.1, to: 1.0, h: 1.05 }, toes: 4, strideK: 0.5, ...o,
  }),
  edaphosaure: (o) => quadruped({
    top: '#4A5A3A', side: '#7A8E52', belly: '#DBD7A8', mark: '#2F3A24', sail: '#D9A13A', iris: '#D9A13A', spots: 4,
    H: 0.5, foreH: 0.47, d: 0.42, trunk: 1.0, neck: 0.18, neckRise: 0.02, neckR: 0.15, tail: 1.2, hl: 0.26, hh: 0.2, hw: 0.13, legW: 0.11, legZ: 1, splay: 0.42, sail: { from: -0.05, to: 0.95, h: 0.8 }, strideK: 0.45, ...o,
  }),
  cynodonte: (o) => quadruped({
    top: '#5A4A38', side: '#8A7458', belly: '#D8C8A8', mark: '#3A2E22', iris: '#332211', stripes: 18,
    H: 0.2, foreH: 0.2, d: 0.13, trunk: 0.38, neck: 0.1, neckRise: 0.2, neckR: 0.08, tail: 0.32, hl: 0.17, hh: 0.12, hw: 0.08, legW: 0.035, legZ: 0.9, splay: 0.15, teeth: 3, ...o,
  }),

  /* ---- Le Trias ---- */
  postosuchus: (o) => quadruped({
    top: '#3A3A2A', side: '#6E6A44', belly: '#CEC69A', mark: '#23231A', iris: '#F2C14E', brow: true,
    H: 1.05, foreH: 0.85, d: 0.52, trunk: 1.25, neck: 0.5, neckRise: 0.15, neckR: 0.22, tail: 2.1, tailLift: 0, hl: 1.0, hh: 0.56, hw: 0.26, teeth: 8, toothL: 0.11, legW: 0.17, legZ: 0.85, splay: 0.08, back: { from: -1.8, to: 1.3, n: 22, h: 0.13 }, ...o,
  }),
  coelophysis: (o) => theropod({
    top: '#6E4A1E', side: '#B58A3C', belly: '#F2E0A8', mark: '#4A2E12', iris: '#F2C14E', stripes: 8,
    H: 0.72, d: 0.22, trunk: 0.6, neck: 0.48, neckRise: 0.78, neckR: 0.07, tail: 1.5, hl: 0.34, hh: 0.17, hw: 0.08, teeth: 7, toothL: 0.03, armL: 0.17, armW: 0.03, ...o,
  }),

  /* ---- Le Jurassique ---- */
  brachiosaure: (o) => quadruped({
    top: '#5E5A48', side: '#8A8A6E', belly: '#D6D2B0', mark: '#454233', iris: '#332211', spots: 0.7,
    H: 4.2, foreH: 5.6, d: 2.0, trunk: 4.6, neck: 8, neckRise: 1.02, neckR: 0.6, tail: 7.5, tailLift: 0.08, hl: 1.1, hh: 0.72, hw: 0.45, legW: 0.78, legZ: 0.6, strideK: 0.3, amble: true, eye: 0.09, ...o,
  }),
  diplodocus: (o) => quadruped({
    top: '#5A4A38', side: '#8A7A62', belly: '#D8CCAE', mark: '#3E3226', iris: '#332211', stripes: 1.5,
    H: 3.6, foreH: 3.0, d: 1.45, trunk: 4.0, neck: 7.5, neckRise: 0.42, neckR: 0.42, tail: 12, tailLift: 0.05, hl: 0.85, hh: 0.45, hw: 0.28, legW: 0.6, legZ: 0.6, strideK: 0.3, amble: true, eye: 0.07, ...o,
  }),
  compsognathus: (o) => theropod({
    top: '#5A6A2A', side: '#8EA442', belly: '#E8E4A8', mark: '#3E4A1C', iris: '#F2C14E', stripes: 12,
    H: 0.24, d: 0.08, trunk: 0.2, neck: 0.14, neckRise: 0.8, neckR: 0.03, tail: 0.5, hl: 0.11, hh: 0.07, hw: 0.035, teeth: 0, armL: 0.05, armW: 0.012, ...o,
  }),
  dryosaure: (o) => theropod({
    top: '#6A6A2E', side: '#A0A04A', belly: '#ECE8B0', mark: '#4A4A20', iris: '#9C6A2E', spots: 5, brow: false,
    H: 0.75, d: 0.27, trunk: 0.6, neck: 0.38, neckRise: 0.8, neckR: 0.09, tail: 1.5, hl: 0.26, hh: 0.16, hw: 0.08, teeth: 0, beak: '#C9B27A', armL: 0.14, armW: 0.03, ...o,
  }),
  ceratosaure: (o) => theropod({
    top: '#4F2A18', side: '#8C5A3C', belly: '#E2C8A0', mark: '#2E1609', iris: '#E8A33A', stripes: 4,
    H: 1.75, d: 0.68, trunk: 1.4, neck: 0.7, neckRise: 0.6, neckR: 0.28, tail: 3.4, hl: 0.95, hh: 0.62, hw: 0.28, teeth: 8, armL: 0.32, armW: 0.08, back: { from: -2.2, to: 2, n: 22, h: 0.13 },
    horns: [{ at: 0.72, up: 0.32, L: 0.28, r: 0.06, fwd: 0.3, rise: 0.9 }], brows: 0.1, ...o,
  }),
  'allosaure-sauvage': (o) => CATALOGUE.allosaure({ top: '#3A2A1C', side: '#8A6A42', belly: '#E2D0A8', mark: '#4F2A18', iris: '#E8A33A', cute: false, ...o }),
  rhamphorhynchus: (o) => crawler({
    top: '#6E3A28', side: '#A86644', belly: '#E8CFA8', mark: '#4A2416', sides: 8, outline: 0.01, flies: true, iris: '#F2C14E',
    spine: seq([[-0.75, 0, 0.012, 0.03, 'tail3'], [-0.4, 0, 0.012, 0.012, 'tail2'], [-0.12, 0, 0.04, 0.04, 'tail1'], [0.02, 0, 0.07, 0.07, 'hip'], [0.14, 0.02, 0.06, 0.06, 'chest'], [0.26, 0.05, 0.05, 0.05, 'head'], [0.42, 0.04, 0.012, 0.012]]),
    wing: { x: 0.1, y: 0.02, z: 0.05, span: 0.6, chord: 0.13, col: '#C47A4E', tipCol: '#E2574C' }, ...o,
  }),

  /* ---- Le Crétacé ---- */
  'trex-sauvage': (o) => CATALOGUE.trex({ top: '#2E2418', side: '#6A5234', belly: '#D8BE90', mark: '#3E2412', iris: '#FF8A1E', cute: false, stripes: 2.4, ...o }),
  'triceratops-sauvage': (o) => CATALOGUE.triceratops({ cute: false, ...o }),
  edmontosaure: (o) => quadruped({
    top: '#4A5A3A', side: '#7A8E5A', belly: '#E0DCB4', mark: '#2F3A24', iris: '#7A5226', stripes: 2.5,
    H: 2.35, foreH: 1.4, d: 0.95, trunk: 2.0, neck: 1.2, neckRise: 0.28, neckR: 0.32, tail: 4, tailLift: 0.03, hl: 1.1, hh: 0.5, hw: 0.32, beak: '#C9B27A', legW: 0.34, eye: 0.08, ...o,
  }),
  parasaurolophus: (o) => CATALOGUE.edmontosaure({ top: '#5A3E5E', side: '#8E6E96', belly: '#EADCE0', mark: '#3E2A42', sail: '#D27D3D', tube: 1.35, ...o }),
  ankylosaure: (o) => quadruped({
    top: '#4F4A36', side: '#7A7050', belly: '#CEC6A0', mark: '#2E2A1C', iris: '#7A5226',
    H: 1.05, foreH: 1.0, d: 0.98, trunk: 1.75, neck: 0.45, neckRise: -0.05, neckR: 0.42, tail: 2.6, tailLift: 0.02, hl: 0.72, hh: 0.5, hw: 0.45, beak: '#7A6A4A', legW: 0.28, legZ: 0.72, armor: { from: -0.5, to: 1.9, n: 7, h: 0.32 }, club: { bone: 'tail3', r: 0.34, back: 0.25 }, ...o,
  }),
  dakotaraptor: (o) => theropod({
    top: '#2E2A4A', side: '#5A5288', belly: '#D8D0E8', mark: '#E2574C', iris: '#FFD24A', stripes: 6,
    H: 1.05, d: 0.34, trunk: 0.85, neck: 0.55, neckRise: 0.75, neckR: 0.11, tail: 2.35, tailLift: 0.03, hl: 0.5, hh: 0.27, hw: 0.13, teeth: 7, armL: 0.32, armW: 0.05, back: { from: -1.4, to: 1.3, n: 14, h: 0.12 }, ...o,
  }),
  quetzalcoatlus: (o) => crawler({
    top: '#6E6A6E', side: '#A8A4A8', belly: '#E8E4E8', mark: '#C8553D', sides: 8, outline: 0.04, flies: true, iris: '#F2C14E',
    spine: seq([[-0.7, 0, 0.02, 0.02, 'tail2'], [-0.35, 0, 0.14, 0.14, 'tail1'], [0.1, 0, 0.28, 0.28, 'hip'], [0.5, 0.04, 0.22, 0.2, 'chest'], [1.5, 0.3, 0.1, 0.1, 'neck1'], [2.6, 0.34, 0.1, 0.13, 'head'], [4.2, 0.26, 0.02, 0.03]]),
    wing: { x: 0.45, y: 0.05, z: 0.15, span: 5.2, chord: 1.1, col: '#C47A4E', tipCol: '#8E5A3A' }, ...o,
  }),
};

/** Une liste de points de colonne : [x, y, largeur, hauteur, os, tête] */
function seq(list) {
  return list.map(([x, y, w, h, bone, head]) => ({ x, y, w, h, bone: bone || undefined, head: !!head }));
}

/* Les plans déjà construits : une même espèce ne se construit qu'une fois */
const CACHE = new Map();

/** Le plan d'un animal. mods = ce que les évolutions ajoutent (cornes, voile, couleurs…) */
export function planOf(id, mods = null) {
  const key = id + (mods ? JSON.stringify(mods) : '');
  if (!CACHE.has(key)) {
    if (!CATALOGUE[id]) throw new Error(`Animal inconnu : ${id}`);
    CACHE.set(key, buildPlan(CATALOGUE[id](mods || {})));
  }
  return CACHE.get(key);
}

export const knownAnimal = (id) => !!CATALOGUE[id];
export const animalIds = () => Object.keys(CATALOGUE);
