// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : le nuage qui s'ouvre, les
// petits « pouic » des Pompons, la pelle, les briques, le parapluie, la
// maison qui fait la fête, le « hou hou » de Plume et la fanfare des étoiles.
// ============================================================================

const STORAGE_KEY = 'marche-des-pompons-son';
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

/* pour ne pas jouer cent fois le même bruit dans la même seconde */
const last = {};
function play(fn, key = null, gap = 0) {
  if (!enabled) return;
  if (key) {
    const now = performance.now();
    if ((last[key] || 0) + gap > now) return;
    last[key] = now;
  }
  fn();
}

export const sfx = {
  /* un bouton de métier */
  select: () => play(() => tone(NOTE(76), 0, 0.07, { type: 'triangle', vol: 0.08 })),
  /* un Pompon reçoit son métier : « pouic ! » */
  assign: () => play(() => { tone(NOTE(79), 0, 0.08, { type: 'square', vol: 0.05, to: NOTE(86) }); tone(NOTE(91), 0.06, 0.1, { type: 'triangle', vol: 0.08 }); }),
  nope: () => play(() => tone(260, 0, 0.22, { type: 'square', vol: 0.05, to: 170 })),
  /* le nuage s'ouvre et un Pompon tombe */
  release: () => play(() => tone(NOTE(84) + Math.random() * 40, 0, 0.12, { type: 'sine', vol: 0.07, to: NOTE(72) }), 'release', 120),
  land: () => play(() => noise(0, 0.07, { vol: 0.12, freq: 500, q: 1 }), 'land', 90),
  umbrella: () => play(() => noise(0, 0.18, { vol: 0.14, freq: 1800, to: 700, q: 1.5 }), 'umb', 80),
  brick: () => play(() => { tone(NOTE(67) + Math.random() * 30, 0, 0.06, { type: 'square', vol: 0.035 }); noise(0, 0.04, { vol: 0.08, freq: 2400, q: 4 }); }, 'brick', 60),
  dig: () => play(() => noise(0, 0.12, { vol: 0.16, freq: 380, to: 200, q: 0.8 }), 'dig', 110),
  bash: () => play(() => noise(0, 0.1, { vol: 0.14, freq: 700, to: 300, q: 1 }), 'bash', 110),
  rock: () => play(() => { tone(900, 0, 0.18, { type: 'triangle', vol: 0.09, to: 600 }); noise(0, 0.08, { vol: 0.12, freq: 3500, q: 5 }); }, 'rock', 200),
  bonk: () => play(() => tone(180, 0, 0.18, { type: 'square', vol: 0.06, to: 90 }), 'bonk', 200),
  climb: () => play(() => tone(NOTE(72), 0, 0.06, { type: 'triangle', vol: 0.05, to: NOTE(79) }), 'climb', 150),
  free: () => play(() => [72, 76, 79].forEach((n, i) => tone(NOTE(n), i * 0.05, 0.09, { type: 'triangle', vol: 0.07 }))),
  /* un Pompon rentre à la maison */
  saved: () => play(() => [79, 84, 88].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.16, { type: 'triangle', vol: 0.1 })), 'saved', 90),
  /* un Pompon se perd : petit « oh-oh » qui descend, puis la bulle */
  lost: (why) => play(() => {
    if (why === 'eau') noise(0, 0.35, { vol: 0.2, freq: 900, to: 250, q: 0.7 });
    else if (why === 'ronces') noise(0, 0.15, { vol: 0.15, freq: 4200, q: 3 });
    else if (why === 'lave') noise(0, 0.6, { vol: 0.22, freq: 5000, to: 1500, q: 0.8, type: 'highpass' });
    else tone(320, 0, 0.2, { type: 'square', vol: 0.05, to: 160 });
    tone(NOTE(76), 0.15, 0.18, { type: 'sine', vol: 0.08, to: NOTE(71) });
    tone(NOTE(71), 0.33, 0.25, { type: 'sine', vol: 0.08, to: NOTE(64) });
    tone(NOTE(88), 0.55, 0.3, { type: 'sine', vol: 0.05, to: NOTE(96) });
  }, 'lost', 150),
  /* une échelle qu'on pose : toc toc toc */
  ladder: () => play(() => [0, 0.08, 0.16, 0.26].forEach((d, i) => { tone(NOTE(64 + i * 3), d, 0.07, { type: 'triangle', vol: 0.09 }); noise(d, 0.05, { vol: 0.1, freq: 1800, q: 3 }); })),
  /* le volcan gronde */
  rumble: () => play(() => { noise(0, 1.8, { vol: 0.45, freq: 120, to: 60, q: 0.7, type: 'lowpass' }); tone(48, 0, 1.6, { type: 'sine', vol: 0.18, to: 36 }); }),
  /* Plume parle : « hou hou » */
  hoot: () => play(() => {
    tone(NOTE(67), 0, 0.16, { type: 'sine', vol: 0.09, to: NOTE(64) });
    tone(NOTE(67), 0.2, 0.22, { type: 'sine', vol: 0.09, to: NOTE(62) });
  }, 'hoot', 600),
  tick: () => play(() => tone(NOTE(96), 0, 0.04, { type: 'square', vol: 0.03 })),
  open: () => play(() => tone(NOTE(79), 0, 0.12, { type: 'sine', vol: 0.08, to: NOTE(86) })),
  /* les étoiles qui s'allument une par une */
  star: (i) => play(() => { tone(NOTE(84 + i * 4), 0, 0.3, { type: 'triangle', vol: 0.12 }); noise(0, 0.2, { vol: 0.06, freq: 7000, q: 0.7, type: 'highpass' }); }),
  /* niveau gagné */
  win: () => play(() => {
    const m = [[72, 0, 0.15], [76, 0.15, 0.15], [79, 0.3, 0.15], [84, 0.45, 0.45], [79, 0.95, 0.15], [84, 1.1, 0.6]];
    m.forEach(([n, t, d]) => { tone(NOTE(n), t, d, { type: 'triangle', vol: 0.13 }); tone(NOTE(n - 12), t, d, { type: 'sine', vol: 0.07 }); });
  }),
  /* niveau raté : petite mélodie douce, pas triste */
  fail: () => play(() => [[72, 0], [71, 0.18], [69, 0.36], [67, 0.6]].forEach(([n, t]) => tone(NOTE(n), t, 0.3, { type: 'triangle', vol: 0.09 }))),
  /* le vent de l'histoire */
  wind: () => play(() => noise(0, 2.4, { vol: 0.3, freq: 300, to: 1400, q: 0.6 })),
  /* la grande fête de la fin */
  fanfare: () => play(() => {
    const melody = [
      [67, 0, 0.2], [72, 0.2, 0.2], [76, 0.4, 0.2], [79, 0.6, 0.45], [76, 1.05, 0.2], [79, 1.25, 0.2],
      [84, 1.45, 0.8], [83, 2.3, 0.2], [84, 2.5, 1.1],
    ];
    melody.forEach(([n, t, d]) => {
      tone(NOTE(n), t, d, { type: 'triangle', vol: 0.14 });
      tone(NOTE(n - 12), t, d, { type: 'sine', vol: 0.09 });
    });
  }),
  firework: () => play(() => noise(0, 0.6, { vol: 0.1, freq: 2500, to: 300, q: 0.5 }), 'fw', 150),
};
