// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : chargement, pièces d'or,
// laser, missiles, explosions, gazouillis de Bip et fanfare royale.
// ============================================================================

const STORAGE_KEY = 'livraisons-sound';
let ctx = null;
let enabled = true;
try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { /* stockage indisponible */ }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

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

function noise(start, dur, { vol = 0.2, freq = 2000, to = null, q = 1, type = 'bandpass' } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const len = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t0);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

function play(fn) { if (enabled) fn(); }

export const sfx = {
  /* une ressource entre dans la soute */
  load: () => play(() => { tone(NOTE(67), 0, 0.09, { type: 'triangle', vol: 0.1 }); tone(NOTE(74), 0.06, 0.14, { type: 'triangle', vol: 0.1 }); }),
  full: () => play(() => { tone(NOTE(60), 0, 0.12, { type: 'square', vol: 0.05 }); tone(NOTE(55), 0.12, 0.2, { type: 'square', vol: 0.05 }); }),
  deliver: () => play(() => [72, 79].forEach((n, i) => tone(NOTE(n), i * 0.08, 0.2, { type: 'triangle', vol: 0.12 }))),
  coin: () => play(() => { tone(NOTE(88), 0, 0.08, { vol: 0.07 }); tone(NOTE(93), 0.05, 0.18, { vol: 0.07 }); }),
  /* quête terminée : tiroir-caisse + petite fanfare */
  cash: () => play(() => {
    noise(0, 0.08, { vol: 0.2, freq: 5000, q: 2 });
    [76, 79, 84, 88, 91].forEach((n, i) => tone(NOTE(n), 0.08 + i * 0.06, 0.25, { type: 'triangle', vol: 0.11 }));
  }),
  buy: () => play(() => { noise(0, 0.06, { vol: 0.2, freq: 4500, q: 2 }); tone(NOTE(84), 0.05, 0.12, { vol: 0.1 }); tone(NOTE(91), 0.12, 0.3, { vol: 0.1 }); }),
  nope: () => play(() => tone(220, 0, 0.25, { type: 'square', vol: 0.06, to: 150 })),
  open: () => play(() => tone(NOTE(79), 0, 0.12, { type: 'sine', vol: 0.08, to: NOTE(86) })),
  quest: () => play(() => [67, 72, 76].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.18, { type: 'triangle', vol: 0.1 }))),
  bonk: () => play(() => {
    tone(160, 0, 0.25, { type: 'square', vol: 0.12, to: 60 });
    noise(0, 0.15, { vol: 0.2, freq: 400, q: 1 });
  }),
  turbo: () => play(() => noise(0, 0.7, { vol: 0.25, freq: 300, to: 3000, q: 2 })),
  wormhole: () => play(() => {
    tone(200, 0, 0.9, { type: 'sine', vol: 0.15, to: 1600 });
    tone(300, 0.1, 0.8, { type: 'triangle', vol: 0.08, to: 2400 });
  }),
  hot: () => play(() => noise(0, 0.4, { vol: 0.18, freq: 800, q: 0.5, type: 'lowpass' })),
  spaghetti: () => play(() => tone(900, 0, 1.2, { type: 'sawtooth', vol: 0.06, to: 60 })),
  laser: () => play(() => tone(1400, 0, 0.12, { type: 'square', vol: 0.04, to: 300 })),
  missile: () => play(() => { noise(0, 0.5, { vol: 0.12, freq: 600, to: 2000, q: 3 }); tone(880, 0, 0.1, { type: 'square', vol: 0.04 }); tone(880, 0.15, 0.1, { type: 'square', vol: 0.04 }); }),
  boom: () => play(() => {
    noise(0, 0.9, { vol: 0.4, freq: 900, to: 80, q: 0.7, type: 'lowpass' });
    tone(120, 0, 0.6, { type: 'sine', vol: 0.2, to: 40 });
  }),
  ufoHit: () => play(() => tone(500, 0, 0.08, { type: 'square', vol: 0.05, to: 250 })),
  crash: () => play(() => {
    noise(0, 0.5, { vol: 0.35, freq: 700, to: 150, q: 0.8 });
    tone(300, 0, 0.5, { type: 'sawtooth', vol: 0.08, to: 70 });
  }),
  shield: () => play(() => { tone(1200, 0, 0.3, { type: 'sine', vol: 0.12, to: 400 }); noise(0, 0.25, { vol: 0.12, freq: 3000, q: 4 }); }),
  /* Bip qui parle : petits gazouillis de robot */
  bip: () => play(() => {
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      tone(700 + Math.random() * 900, i * 0.07, 0.06, { type: 'square', vol: 0.03 });
    }
  }),
  /* Fanfare du couronnement */
  royal: () => play(() => {
    const melody = [
      [67, 0, 0.2], [67, 0.2, 0.12], [72, 0.34, 0.45], [76, 0.8, 0.2], [79, 1.0, 0.45],
      [76, 1.5, 0.2], [79, 1.7, 0.2], [84, 1.9, 0.9], [83, 2.85, 0.2], [84, 3.05, 1.2],
    ];
    melody.forEach(([n, t, d]) => {
      tone(NOTE(n), t, d, { type: 'triangle', vol: 0.15 });
      tone(NOTE(n - 12), t, d, { type: 'sine', vol: 0.1 });
    });
    [0, 0.8, 1.9, 3.05].forEach((t) => noise(t, 0.3, { vol: 0.12, freq: 6000, q: 0.6, type: 'highpass' }));
  }),
  firework: () => play(() => { noise(0, 0.6, { vol: 0.12, freq: 2500, to: 300, q: 0.5 }); }),
};
