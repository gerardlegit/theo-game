// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : « plop » de bouchée, « bonk »
// doux quand on perd un cœur, arpège de croissance, petite fanfare à mi-
// parcours, accord de transformation. Le son démarre au premier geste et se
// coupe quand l'onglet est caché.
// ============================================================================

const STORAGE_KEY = 'evolution-son';
let ctx = null;
let enabled = true;
try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { /* stockage indisponible */ }

function audio() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
  }
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
  return ctx;
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else if (enabled) ctx.resume();
});

export function isSoundOn() { return enabled; }
export function toggleSound() {
  enabled = !enabled;
  try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignoré */ }
  return enabled;
}

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

function tone(freq, start, dur, { type = 'sine', vol = 0.15, to = null } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  gain.connect(ac.destination);
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  osc.connect(gain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

let lastEat = 0;
export const sfx = {
  eat(big = false) {
    // les bouchées rapprochées montent un peu dans les aigus
    const now = performance.now();
    const step = now - lastEat < 900 ? 1.12 : 1;
    lastEat = now;
    const f = (big ? 380 : 520) * step * (0.95 + Math.random() * 0.1);
    tone(f, 0, 0.12, { vol: 0.16, to: f * 1.8 });
  },
  hurt() {
    tone(260, 0, 0.25, { type: 'triangle', vol: 0.2, to: 110 });
    tone(180, 0.12, 0.3, { type: 'sine', vol: 0.12, to: 90 });
  },
  milestone() {
    [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.09, 0.22, { type: 'triangle', vol: 0.12 }));
  },
  grow() {
    [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.3, { vol: 0.1 }));
  },
  transform() {
    [48, 55, 60, 64, 67].forEach((n) => tone(NOTE(n), 0, 2.2, { vol: 0.05 }));
  },
  card() {
    tone(NOTE(84), 0, 0.3, { vol: 0.08 });
    tone(NOTE(91), 0.08, 0.4, { vol: 0.06 });
  },
};
