// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : carte posée, bonne réponse,
// erreur, carte qui glisse et fanfare de fin.
// ============================================================================

const STORAGE_KEY = 'frise-sound';
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

function noise(start, dur, { vol = 0.2, freq = 2000, to = null, q = 1 } = {}) {
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
  filter.type = 'bandpass';
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
  /* petit « toc » de carte posée sur la frise */
  place: () => play(() => {
    tone(NOTE(67), 0, 0.09, { type: 'triangle', vol: 0.14 });
    noise(0, 0.05, { vol: 0.15, freq: 1800, q: 1.2 });
  }),
  /* la carte qu'on attrape */
  pick: () => play(() => tone(NOTE(74), 0, 0.08, { type: 'sine', vol: 0.1, to: NOTE(79) })),
  /* carte retournée : la date apparaît */
  flip: () => play(() => noise(0, 0.14, { vol: 0.18, freq: 900, to: 3200, q: 0.8 })),
  good: () => play(() => [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.08, 0.32, { type: 'triangle', vol: 0.13 }))),
  bad: () => play(() => {
    tone(NOTE(55), 0, 0.22, { type: 'square', vol: 0.06, to: NOTE(50) });
    tone(NOTE(50), 0.18, 0.3, { type: 'square', vol: 0.05, to: NOTE(46) });
  }),
  /* la carte glisse jusqu'à sa vraie place */
  slide: () => play(() => noise(0, 0.35, { vol: 0.12, freq: 600, to: 2400, q: 1.5 })),
  win: () => play(() => {
    [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => tone(NOTE(n), i * 0.11, 0.35, { type: 'triangle', vol: 0.12 }));
    tone(NOTE(84), 0.92, 0.9, { type: 'triangle', vol: 0.12 });
  }),
};
