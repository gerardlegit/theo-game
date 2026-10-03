// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : clic d'appareil photo,
// « bonk » d'astéroïde, turbo, trou de ver, gazouillis de Bip et fanfare.
// ============================================================================

const STORAGE_KEY = 'espace-sound';
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
  /* clic-clac d'appareil photo */
  click: () => play(() => {
    noise(0, 0.05, { vol: 0.35, freq: 3500, q: 0.8 });
    noise(0.07, 0.06, { vol: 0.25, freq: 2200, q: 0.8 });
  }),
  good: () => play(() => [72, 76, 79, 84, 88].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.3, { type: 'triangle', vol: 0.12 }))),
  other: () => play(() => { tone(NOTE(76), 0, 0.15, { type: 'triangle', vol: 0.1 }); tone(NOTE(72), 0.12, 0.25, { type: 'triangle', vol: 0.1 }); }),
  bonk: () => play(() => {
    tone(160, 0, 0.25, { type: 'square', vol: 0.12, to: 60 });
    noise(0, 0.15, { vol: 0.2, freq: 400, q: 1 });
  }),
  star: () => play(() => { tone(NOTE(91), 0, 0.15, { vol: 0.08 }); tone(NOTE(96), 0.06, 0.25, { vol: 0.08 }); }),
  turbo: () => play(() => noise(0, 0.7, { vol: 0.25, freq: 300, to: 3000, q: 2 })),
  wormhole: () => play(() => {
    tone(200, 0, 0.9, { type: 'sine', vol: 0.15, to: 1600 });
    tone(300, 0.1, 0.8, { type: 'triangle', vol: 0.08, to: 2400 });
  }),
  hot: () => play(() => noise(0, 0.4, { vol: 0.18, freq: 800, q: 0.5, type: 'lowpass' })),
  spaghetti: () => play(() => tone(900, 0, 1.2, { type: 'sawtooth', vol: 0.06, to: 60 })),
  /* Bip qui parle : petits gazouillis de robot */
  bip: () => play(() => {
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      tone(700 + Math.random() * 900, i * 0.07, 0.06, { type: 'square', vol: 0.03 });
    }
  }),
  win: () => play(() => {
    const melody = [[72, 0, 0.18], [76, 0.18, 0.18], [79, 0.36, 0.18], [84, 0.54, 0.5], [79, 1.04, 0.16], [84, 1.2, 0.8]];
    melody.forEach(([n, t, d]) => {
      tone(NOTE(n), t, d, { type: 'triangle', vol: 0.15 });
      tone(NOTE(n - 12), t, d, { type: 'sine', vol: 0.1 });
    });
  }),
};
