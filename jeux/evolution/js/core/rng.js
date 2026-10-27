// ============================================================================
// Hasard reproductible : avec la même graine, on obtient toujours la même
// suite de nombres (pratique pour les tests).
// ============================================================================

export function createRng(seed = (Math.random() * 2 ** 32) >>> 0) {
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.range = (min, max) => min + (max - min) * rng();
  return rng;
}
