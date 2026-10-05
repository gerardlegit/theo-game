// ============================================================================
// SAUVEGARDE — tout est gardé dans le navigateur (localStorage).
// ============================================================================

import { todayStr } from './util.js';
import { RANKS } from './world.js';

const KEY = 'royaume-des-mots-v2';
const OLD_KEY = 'royaume-des-mots-save';

function fresh() {
  return {
    v: 2,
    hero: null, // { name, g: 'm'|'f', avatar, blason: { field, second, part, emblem } }
    introSeen: false,
    gold: 0,
    stars: {}, // 'conj-1' → meilleur nombre d'étoiles (1 à 3)
    bosses: {}, // 'conj' → true quand le gardien est délivré
    finalWon: false,
    endingSeen: false,
    owned: {}, // bâtiments achetés
    lessons: {}, // leçons lues (débloquées dans le Grimoire)
    stats: {}, // skill → { ok, ko }
    daily: { last: null, streak: 0 },
    tourBest: 0,
    greeted: {}, // régions dont on a vu l'accueil du mentor
  };
}

export let save = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
    // Ancienne version du jeu : on convertit les étoiles en écus d'or.
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
    if (old && old.stars) {
      const s = fresh();
      s.gold = Math.min(200, Number(old.stars) || 0);
      return s;
    }
  } catch { /* stockage indisponible : partie vierge */ }
  return fresh();
}

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* ignore */ }
}

export function resetSave() {
  save = fresh();
  persist();
}

export const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0) + Object.keys(save.bosses).length * 3;

export function rankOf(stars = totalStars()) {
  const g = save.hero?.g || 'm';
  if (save.finalWon) return g === 'f' ? 'Gardienne du Royaume' : 'Gardien du Royaume';
  let r = RANKS[0];
  RANKS.forEach((x) => { if (stars >= x.stars) r = x; });
  return r[g];
}

export function recordAnswer(skill, ok) {
  if (!skill) return;
  const s = save.stats[skill] || (save.stats[skill] = { ok: 0, ko: 0 });
  if (ok) s.ok++; else s.ko++;
}

export function addGold(n) {
  save.gold = Math.max(0, save.gold + n);
  persist();
}

/** Étoiles d'une étape, ou 0 si pas encore réussie. */
export const stageStars = (regionId, i) => save.stars[`${regionId}-${i + 1}`] || 0;

/** Une étape est jouable si c'est la première ou si la précédente est réussie. */
export const stageUnlocked = (regionId, i) => i === 0 || stageStars(regionId, i - 1) > 0;

export const regionStars = (regionId) => [0, 1, 2, 3, 4].reduce((a, i) => a + stageStars(regionId, i), 0);

export const bossUnlocked = (regionId) => stageStars(regionId, 4) > 0;

export function dailyDone() {
  return save.daily.last === todayStr();
}

export function completeDaily() {
  const today = todayStr();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  save.daily.streak = save.daily.last === todayStr(y) ? save.daily.streak + 1 : 1;
  save.daily.last = today;
  persist();
}

/** Remplace {heros}, {Heros} et {gardien} dans les textes de l'histoire. */
export function fill(text) {
  const name = save.hero?.name || 'jeune héros';
  const f = save.hero?.g === 'f';
  return text
    .replace(/\{heros\}/g, name)
    .replace(/\{Heros\}/g, name.charAt(0).toUpperCase() + name.slice(1))
    .replace(/\{gardien\}/g, f ? 'Gardienne' : 'Gardien');
}
