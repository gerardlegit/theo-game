// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : croc et gloups quand on mange,
// alerte quand un chasseur nous repère, battements de cœur pendant la
// poursuite, sprint, « gloups » quand on se fait manger, évolution, fanfares.
// ============================================================================

const STORAGE_KEY = 'evolution-sound';
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
  /* une petite bouchée : « plop » (plus grave pour les grosses proies) */
  eat: (big = 0) => play(() => {
    const f = 700 - big * 380 + Math.random() * 80;
    noise(0, 0.06, { vol: 0.12 + big * 0.12, freq: 2500 - big * 1600, q: 1.5 });
    tone(f, 0, 0.12, { vol: 0.12, to: f * 1.7 });
    if (big > 0.4) tone(120, 0.02, 0.2, { type: 'triangle', vol: 0.18, to: 60 });
  }),
  /* « Trop dur ! » : la dent glisse sur la carapace */
  clank: () => play(() => { tone(NOTE(84), 0, 0.08, { type: 'square', vol: 0.05 }); tone(NOTE(79), 0.06, 0.12, { type: 'square', vol: 0.05 }); }),
  /* un chasseur nous a repérés : deux notes qui font peur */
  alert: () => play(() => {
    tone(NOTE(76), 0, 0.12, { type: 'sawtooth', vol: 0.06 });
    tone(NOTE(82), 0.12, 0.25, { type: 'sawtooth', vol: 0.07 });
  }),
  /* boum-boum du cœur pendant une poursuite */
  heart: (strong = false) => play(() => {
    tone(62, 0, 0.14, { type: 'sine', vol: strong ? 0.32 : 0.22, to: 45 });
    tone(58, 0.18, 0.16, { type: 'sine', vol: strong ? 0.26 : 0.17, to: 42 });
  }),
  /* une gueule qui claque tout près */
  snap: () => play(() => { noise(0, 0.05, { vol: 0.2, freq: 1200, q: 3 }); tone(90, 0, 0.08, { type: 'square', vol: 0.06, to: 60 }); }),
  /* on s'est fait manger : glouglou qui descend */
  gulp: () => play(() => {
    noise(0, 0.12, { vol: 0.35, freq: 900, q: 2 });
    tone(320, 0.05, 0.5, { type: 'triangle', vol: 0.2, to: 70 });
    [0.15, 0.3, 0.45].forEach((t, i) => tone(500 - i * 90, t, 0.1, { vol: 0.08, to: 900 - i * 120 }));
  }),
  /* la carapace a encaissé le coup */
  shield: () => play(() => { tone(NOTE(88), 0, 0.15, { type: 'triangle', vol: 0.12 }); tone(NOTE(81), 0.05, 0.3, { type: 'triangle', vol: 0.1 }); noise(0, 0.1, { vol: 0.15, freq: 4000, q: 4 }); }),
  /* une méduse pique */
  sting: () => play(() => { tone(1200, 0, 0.15, { type: 'sawtooth', vol: 0.06, to: 300 }); noise(0, 0.12, { vol: 0.12, freq: 6000, q: 2 }); }),
  /* sprint dans l'eau */
  dash: () => play(() => { noise(0, 0.35, { vol: 0.22, freq: 500, to: 2500, q: 0.8 }); }),
  /* on récupère une bulle d'ADN */
  pickup: () => play(() => { tone(NOTE(81), 0, 0.08, { vol: 0.08 }); tone(NOTE(88), 0.05, 0.14, { vol: 0.08 }); }),
  /* ouf, semé ! */
  phew: () => play(() => { tone(NOTE(72), 0, 0.15, { type: 'triangle', vol: 0.1 }); tone(NOTE(67), 0.13, 0.25, { type: 'triangle', vol: 0.1 }); }),
  /* une mission réussie */
  mission: () => play(() => [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.08, 0.22, { type: 'triangle', vol: 0.11 }))),
  /* une partie du corps qui pousse : scintillement + accord */
  evolve: () => play(() => {
    [60, 64, 67, 72, 76, 79, 84, 88].forEach((n, i) => tone(NOTE(n), i * 0.06, 0.35, { vol: 0.07 }));
    [60, 67, 72, 76].forEach((n) => tone(NOTE(n), 0.5, 1.2, { type: 'triangle', vol: 0.05 }));
  }),
  /* fin d'un chapitre */
  chapter: () => play(() => {
    [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.5], [84, 0.62]].forEach(([n, t]) => tone(NOTE(n), t, 0.3, { type: 'triangle', vol: 0.12 }));
    [48, 55, 60, 64].forEach((n) => tone(NOTE(n), 0.62, 1.4, { vol: 0.05 }));
  }),
  /* le temps qui passe (des millions d'années) */
  time: () => play(() => {
    for (let i = 0; i < 10; i++) tone(NOTE(84 - i * 2), i * 0.11, 0.18, { vol: 0.05 });
    noise(0, 1.2, { vol: 0.08, freq: 300, to: 3000, q: 0.6 });
  }),
  /* Ammo parle : petits « bloub » */
  ammo: () => play(() => { tone(NOTE(79), 0, 0.07, { vol: 0.05, to: NOTE(84) }); tone(NOTE(74), 0.08, 0.09, { vol: 0.05, to: NOTE(79) }); }),
  /* la grande fin */
  victory: () => play(() => {
    const melody = [[67, 0], [72, 0.15], [76, 0.3], [79, 0.45], [84, 0.7], [79, 0.95], [84, 1.1], [88, 1.3]];
    melody.forEach(([n, t]) => tone(NOTE(n), t, 0.35, { type: 'triangle', vol: 0.12 }));
    [48, 55, 60, 64, 67].forEach((n) => tone(NOTE(n), 1.3, 2, { vol: 0.05 }));
  }),
  click: () => play(() => tone(NOTE(76), 0, 0.06, { type: 'triangle', vol: 0.07 })),
};
