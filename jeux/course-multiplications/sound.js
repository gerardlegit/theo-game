// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : moteur, feux de départ,
// bonnes et mauvaises réponses, bonus, klaxon, saut et fanfare d'arrivée.
// ============================================================================

const STORAGE_KEY = 'course-calculs-sound';

let ac = null;
let master = null;
let noiseBuffer = null;
let engine = null;
let enabled = true;
try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { /* stockage indisponible */ }

function audio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

/** À appeler sur un clic : les navigateurs n'autorisent le son qu'après un geste. */
export function unlockAudio() { audio(); }

export function isSoundOn() { return enabled; }

export function toggleSound() {
  enabled = !enabled;
  try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignoré */ }
  if (audio()) master.gain.setTargetAtTime(enabled ? 0.9 : 0, ac.currentTime, 0.02);
  return enabled;
}

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

function tone(freq, start, dur, { type = 'sine', vol = 0.15, slideTo = 0, attack = 0.01, filter = 0 } = {}) {
  const a = audio();
  if (!a || !enabled) return;
  const t0 = a.currentTime + start;
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = gain;
  if (filter) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    gain.connect(f);
    out = f;
  }
  out.connect(master);
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  osc.connect(gain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(start, dur, { vol = 0.1, freq = 1200, slideTo = 0, q = 1, type = 'bandpass' } = {}) {
  const a = audio();
  if (!a || !enabled) return;
  if (!noiseBuffer) {
    noiseBuffer = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = a.currentTime + start;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer;
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t0);
  if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(gain).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

const arp = (notes, step, opts) => notes.forEach((n, i) => tone(NOTE(n), i * step, opts.dur || 0.3, opts));

export const sfx = {
  tap:    () => tone(NOTE(84), 0, 0.07, { type: 'triangle', vol: 0.06 }),
  lane:   () => noise(0, 0.16, { vol: 0.05, freq: 700, slideTo: 1800, q: 0.8 }),
  beep:   () => tone(NOTE(69), 0, 0.22, { type: 'square', vol: 0.06, filter: 2400 }),
  go:     () => { tone(NOTE(81), 0, 0.5, { type: 'square', vol: 0.07, filter: 3000 }); tone(NOTE(88), 0, 0.5, { type: 'triangle', vol: 0.08 }); },
  good:   () => { noise(0, 0.25, { vol: 0.08, freq: 3000, q: 0.6 }); arp([72, 76, 79, 84], 0.07, { type: 'triangle', vol: 0.13, dur: 0.35 }); },
  bad:    () => { noise(0, 0.2, { vol: 0.07, freq: 500, q: 0.6 }); tone(NOTE(58), 0.05, 0.3, { type: 'triangle', vol: 0.16, slideTo: NOTE(55) }); tone(NOTE(53), 0.32, 0.5, { type: 'triangle', vol: 0.16, slideTo: NOTE(48) }); },
  bonus:  () => arp([76, 79, 83, 88, 91, 95], 0.05, { type: 'sine', vol: 0.11, dur: 0.4 }),
  honk:   () => [0, 0.22].forEach((t) => { tone(392, t, 0.17, { type: 'square', vol: 0.05, filter: 1400 }); tone(494, t, 0.17, { type: 'square', vol: 0.05, filter: 1400 }); }),
  jump:   () => { tone(260, 0, 0.35, { type: 'triangle', vol: 0.12, slideTo: 880 }); noise(0, 0.4, { vol: 0.06, freq: 600, slideTo: 2500 }); },
  land:   () => { noise(0, 0.18, { vol: 0.12, freq: 300, type: 'lowpass' }); tone(140, 0, 0.18, { type: 'sine', vol: 0.15, slideTo: 60 }); },
  finish: () => arp([67, 72, 76, 79, 84], 0.09, { type: 'square', vol: 0.05, filter: 2600, dur: 0.4 }),
  /* petite fanfare d'arrivée */
  win: () => {
    const melody = [[72, 1], [76, 1], [79, 1], [84, 2], [79, 1], [84, 3], [83, 1], [81, 1], [79, 1], [77, 1], [76, 1], [74, 1], [72, 4]];
    const beat = 0.14;
    let t = 0.1;
    melody.forEach(([n, len]) => {
      tone(NOTE(n), t, len * beat * 1.1, { type: 'square', vol: 0.045, filter: 2600 });
      tone(NOTE(n - 12), t, len * beat * 1.1, { type: 'triangle', vol: 0.07 });
      t += len * beat;
    });
  },
};

/* ---------- Moteur : un ronronnement doux qui monte avec la vitesse ---------- */
export function engineStart() {
  const a = audio();
  if (!a || engine) return;
  const out = a.createGain();
  out.gain.value = 0.0001;
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  filter.connect(out).connect(master);
  const o1 = a.createOscillator();
  const o2 = a.createOscillator();
  o1.type = 'sawtooth';
  o2.type = 'square';
  o2.detune.value = 7;
  o1.connect(filter);
  o2.connect(filter);
  o1.start();
  o2.start();
  engine = { out, filter, o1, o2 };
  engineSpeed(0);
}

/** ratio = 0 (à l'arrêt) … 1 (pleine vitesse) */
export function engineSpeed(ratio) {
  if (!engine || !ac) return;
  const t = ac.currentTime;
  const f = 42 + ratio * 48;
  engine.o1.frequency.setTargetAtTime(f, t, 0.08);
  engine.o2.frequency.setTargetAtTime(f * 2, t, 0.08);
  engine.filter.frequency.setTargetAtTime(260 + ratio * 260, t, 0.1);
  engine.out.gain.setTargetAtTime(0.022 + ratio * 0.02, t, 0.1);
}

export function engineStop() {
  if (!engine || !ac) return;
  const e = engine;
  engine = null;
  e.out.gain.setTargetAtTime(0.0001, ac.currentTime, 0.08);
  setTimeout(() => { e.o1.stop(); e.o2.stop(); e.out.disconnect(); }, 400);
}
