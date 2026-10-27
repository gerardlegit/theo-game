// ============================================================================
// Affichage des époques : « 3,8 milliards d'années », « 600 millions d'années ».
// Les dates du jeu sont en millions d'années et arrondies.
// ============================================================================

const NBSP = '\u00a0';

function decimal(n) {
  const r = Math.round(n * 10) / 10;
  return String(r).replace('.', ',');
}

/* ma : millions d'années → « 3,8 milliards d’années » */
export function formatAgo(ma) {
  if (ma >= 1000) {
    const g = ma / 1000;
    return `${decimal(g)}${NBSP}milliard${g >= 2 ? 's' : ''} d’années`;
  }
  return `${Math.round(ma)}${NBSP}millions d’années`;
}
