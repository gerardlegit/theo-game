// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : épingle plantée, envol de la
// caméra, révélation de la ville, verdict et fanfare de fin de partie.
// ============================================================================

const STORAGE_KEY = 'pin-the-globe-sound';
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

function noise(start, dur, { vol = 0.08, from = 400, to = 2400 } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  pin() {
    if (!enabled) return;
    tone(900, 0, 0.09, { type: 'triangle', vol: 0.16, to: 300 });
    tone(NOTE(84), 0.06, 0.12, { vol: 0.07 });
  },
  click() {
    if (!enabled) return;
    tone(NOTE(76), 0, 0.06, { type: 'triangle', vol: 0.08 });
  },
  whoosh() {
    if (!enabled) return;
    noise(0, 0.9, { vol: 0.06, from: 300, to: 2200 });
  },
  reveal() {
    if (!enabled) return;
    tone(NOTE(79), 0, 0.18, { type: 'triangle', vol: 0.1 });
    tone(NOTE(86), 0.09, 0.3, { type: 'sine', vol: 0.09 });
  },
  hint() {
    if (!enabled) return;
    [72, 76, 79].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.25, { type: 'sine', vol: 0.07 }));
  },
  // Plus on est près, plus la mélodie monte et s'allonge.
  verdict(km) {
    if (!enabled) return;
    if (km < 250) {
      [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.09, 0.35, { type: 'triangle', vol: 0.11 }));
    } else if (km < 1500) {
      [72, 76, 79].forEach((n, i) => tone(NOTE(n), i * 0.1, 0.3, { type: 'triangle', vol: 0.1 }));
    } else {
      tone(NOTE(67), 0, 0.22, { type: 'triangle', vol: 0.1 });
      tone(NOTE(62), 0.16, 0.38, { type: 'triangle', vol: 0.1 });
    }
  },
  fanfare() {
    if (!enabled) return;
    const melody = [[67, 0], [72, 0.14], [76, 0.28], [79, 0.42], [76, 0.62], [79, 0.76], [84, 0.9]];
    melody.forEach(([n, t]) => tone(NOTE(n), t, 0.32, { type: 'triangle', vol: 0.11 }));
    tone(NOTE(48), 0.9, 0.8, { type: 'sine', vol: 0.12 });
  },
};
