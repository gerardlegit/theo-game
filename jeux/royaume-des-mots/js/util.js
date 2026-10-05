// ============================================================================
// PETITS OUTILS partagés par tous les modules du Royaume des Mots.
// ============================================================================

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const pickN = (arr, n) => shuffle(arr).slice(0, Math.min(n, arr.length));
export const rand = (min, max) => min + Math.random() * (max - min);

/** Échappe un texte pour l'insérer dans du HTML. */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Majuscule à la première lettre. */
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Crée un élément DOM à partir d'un morceau de HTML. */
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Retire les doublons d'une liste de chaînes en gardant l'ordre. */
export const uniq = (arr) => Array.from(new Set(arr));

/**
 * Construit un QCM à partir d'une bonne réponse et de pièges :
 * mélange, retire les doublons et renvoie { choices, answer }.
 */
export function mcqChoices(correct, distractors, n = 4) {
  const others = uniq(distractors).filter((d) => d !== correct).slice(0, n - 1);
  const choices = shuffle([correct, ...others]);
  return { choices, answer: choices.indexOf(correct) };
}

/** Remplace « ___ » par une case vide stylée (le texte doit déjà être échappé). */
export const blank = (html) => html.replace('___', '<span class="blank">?</span>');

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
