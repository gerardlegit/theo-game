// ============================================================================
// Les éléments à reconnaître : lettres, syllabes simples et sons.
// Tout est stocké en minuscules ; l'affichage choisit ensuite la forme
// (MAJUSCULE d'imprimerie ou écriture attachée).
// ============================================================================

export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

const CONSONANTS = ['b', 'd', 'f', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v'];
const VOWELS = ['a', 'e', 'i', 'o', 'u'];

export const SYLLABLES = CONSONANTS.flatMap((c) => VOWELS.map((v) => c + v));

export const SOUNDS = ['ou', 'on', 'an', 'in', 'oi', 'ai', 'eu', 'ch', 'au', 'or', 'ar', 'ir'];

// Lettres que les enfants confondent souvent : elles servent de pièges.
export const LOOKALIKE_LETTERS = {
  a: ['o', 'e', 'd'], b: ['d', 'p', 'h'], c: ['e', 'o', 'a'], d: ['b', 'p', 'q'],
  e: ['a', 'c', 'o'], f: ['t', 'l', 'j'], g: ['q', 'j', 'y'], h: ['b', 'k', 'n'],
  i: ['l', 'j', 't'], j: ['i', 'g', 'y'], k: ['h', 'x', 'l'], l: ['i', 't', 'f'],
  m: ['n', 'u', 'w'], n: ['m', 'u', 'r'], o: ['a', 'e', 'c'], p: ['q', 'b', 'd'],
  q: ['p', 'g', 'd'], r: ['n', 'v', 's'], s: ['z', 'c', 'x'], t: ['f', 'l', 'i'],
  u: ['n', 'v', 'm'], v: ['u', 'w', 'y'], w: ['v', 'm', 'u'], x: ['k', 's', 'z'],
  y: ['v', 'g', 'j'], z: ['s', 'x', 'n'],
};

// Consonnes des syllabes qui se ressemblent.
export const LOOKALIKE_CONSONANTS = {
  b: ['d', 'p'], d: ['b', 'p'], p: ['b', 'd'], m: ['n'], n: ['m', 'r'],
  l: ['t', 'f'], t: ['l', 'f'], f: ['t', 'l'], r: ['n', 'v'], s: ['f', 'r'],
  v: ['r', 'f'],
};

export { VOWELS };
