// ============================================================================
// SON DE LA QUÊTE — effets et musiques synthétisés avec Web Audio.
// Aucun fichier audio : tout est fabriqué à la volée avec des oscillateurs.
//
// Trois réglages : 'all' (musique + effets), 'sfx' (effets seuls), 'off'.
// ============================================================================

const MODE_KEY = 'la-quete-sound';
const MODES = ['all', 'sfx', 'off'];

let ctx = null, master = null, sfxBus = null, musicBus = null, echo = null;
let mode = 'all';
try { mode = MODES.includes(localStorage.getItem(MODE_KEY)) ? localStorage.getItem(MODE_KEY) : 'all'; } catch { /* stockage indisponible */ }

export function soundMode() { return mode; }

function applyMode() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(mode === 'off' ? 0 : 0.9, t, 0.05);
  musicBus.gain.setTargetAtTime(mode === 'all' ? 0.2 : 0, t, 0.1);
}

export function cycleSound() {
  mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  try { localStorage.setItem(MODE_KEY, mode); } catch { /* ignore */ }
  applyMode();
  return mode;
}

/** À appeler lors d'un premier geste de l'utilisateur (les navigateurs l'exigent). */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.55;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.connect(master);
    // Petit écho pour donner de l'espace à la musique.
    echo = ctx.createDelay(1);
    echo.delayTime.value = 0.33;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(musicBus);
    applyMode();
    if (pendingTheme) playMusic(pendingTheme);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

function tone({ f, type = 'sine', dur = 0.15, vol = 0.3, at = 0, slide = null, attack = 0.005, bus = sfxBus, send = false, filter = null }) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filter) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    o.connect(lp); node = lp;
  }
  node.connect(g);
  g.connect(bus);
  if (send && echo) g.connect(echo);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise({ dur = 0.2, vol = 0.3, at = 0, freq = 1200, q = 1, type = 'bandpass', sweep = null }) {
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.frequency.setValueAtTime(freq, t);
  if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  fl.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fl); fl.connect(g); g.connect(sfxBus);
  src.start(t);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  click() { tone({ f: 880, type: 'square', dur: 0.05, vol: 0.08 }); },
  hover() { tone({ f: 1320, type: 'sine', dur: 0.04, vol: 0.04 }); },
  select() {
    [0, 4, 7, 12].forEach((s, i) => tone({ f: midi(72 + s), type: 'triangle', dur: 0.18, vol: 0.14, at: i * 0.05 }));
  },
  type() { tone({ f: 1800 + Math.random() * 400, type: 'square', dur: 0.02, vol: 0.025 }); },
  correct() {
    [0, 4, 7, 12].forEach((s, i) => tone({ f: midi(76 + s), type: 'triangle', dur: 0.22, vol: 0.18, at: i * 0.07, send: true }));
  },
  wrong() {
    tone({ f: 220, type: 'sawtooth', dur: 0.35, vol: 0.14, slide: 90, filter: 1400 });
    tone({ f: 233, type: 'square', dur: 0.3, vol: 0.06, slide: 100, filter: 900 });
  },
  zap() {
    tone({ f: 1400, type: 'sawtooth', dur: 0.28, vol: 0.12, slide: 180, filter: 3000 });
    noise({ dur: 0.25, vol: 0.12, freq: 3000, sweep: 400 });
  },
  hit() {
    noise({ dur: 0.35, vol: 0.35, freq: 900, sweep: 120, type: 'lowpass' });
    tone({ f: 160, type: 'sine', dur: 0.3, vol: 0.4, slide: 50 });
  },
  laser() {
    tone({ f: 900, type: 'square', dur: 0.4, vol: 0.09, slide: 120, filter: 2000 });
    tone({ f: 450, type: 'sawtooth', dur: 0.4, vol: 0.07, slide: 80, filter: 1500 });
  },
  hurt() {
    noise({ dur: 0.3, vol: 0.3, freq: 500, sweep: 80, type: 'lowpass' });
    tone({ f: 300, type: 'triangle', dur: 0.3, vol: 0.2, slide: 120 });
  },
  shield() {
    [0, 7, 12].forEach((s, i) => tone({ f: midi(79 + s), type: 'sine', dur: 0.4, vol: 0.14, at: i * 0.04, send: true }));
  },
  heal() {
    [0, 4, 7, 11, 14].forEach((s, i) => tone({ f: midi(72 + s), type: 'sine', dur: 0.3, vol: 0.12, at: i * 0.06, send: true }));
  },
  scan() {
    tone({ f: 300, type: 'sine', dur: 0.6, vol: 0.12, slide: 2400 });
    tone({ f: 600, type: 'triangle', dur: 0.6, vol: 0.06, slide: 3600, at: 0.05 });
  },
  glitch() {
    for (let i = 0; i < 7; i++) tone({ f: 100 + Math.random() * 1600, type: 'square', dur: 0.05, vol: 0.07, at: i * 0.05 });
    noise({ dur: 0.4, vol: 0.12, freq: 2000, q: 8 });
  },
  enter() {
    tone({ f: 60, type: 'sawtooth', dur: 1.1, vol: 0.2, slide: 110, filter: 600 });
    noise({ dur: 1, vol: 0.12, freq: 200, sweep: 1800, q: 3 });
  },
  whoosh() { noise({ dur: 0.45, vol: 0.18, freq: 300, sweep: 3000, q: 2 }); },
  freed() {
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone({ f: midi(67 + s), type: 'triangle', dur: 0.35, vol: 0.14, at: i * 0.08, send: true }));
  },
  fragment() {
    [0, 7, 12, 19].forEach((s, i) => tone({ f: midi(84 + s), type: 'sine', dur: 0.5, vol: 0.12, at: i * 0.09, send: true }));
  },
  shatter() {
    noise({ dur: 0.6, vol: 0.35, freq: 4000, sweep: 800, q: 1 });
    [0, 3, 7].forEach((s, i) => tone({ f: midi(88 + s), type: 'square', dur: 0.15, vol: 0.05, at: i * 0.04 }));
  },
  defeat() {
    [7, 5, 3, 0].forEach((s, i) => tone({ f: midi(60 + s), type: 'triangle', dur: 0.45, vol: 0.15, at: i * 0.22, send: true }));
  },
  victory() {
    const seq = [[0, 0], [4, 0.15], [7, 0.3], [12, 0.45], [7, 0.65], [12, 0.8], [16, 0.95], [19, 1.25]];
    seq.forEach(([s, at]) => {
      tone({ f: midi(72 + s), type: 'triangle', dur: 0.4, vol: 0.16, at, send: true });
      tone({ f: midi(60 + s), type: 'sine', dur: 0.4, vol: 0.1, at });
    });
  },
};

/* ==========================================================================
   MUSIQUE — un petit séquenceur en boucle, 16 pas par mesure.
   ========================================================================== */

const THEMES = {
  title: {
    bpm: 76, lead: 'triangle',
    chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]],
    bass: [45, 41, 43, 40],
    arp: [0, 1, 2, 1, 0, 2, 1, 2],
    drums: false,
  },
  map: {
    bpm: 92, lead: 'triangle',
    chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]],
    bass: [38, 34, 36, 33],
    arp: [0, 2, 1, 2, 0, 2, 1, 0],
    drums: 'soft',
  },
  battle: {
    bpm: 124, lead: 'square',
    chords: [[52, 55, 59], [48, 52, 55], [50, 53, 57], [47, 50, 54]],
    bass: [40, 36, 38, 35],
    arp: [0, 1, 2, 1, 2, 1, 0, 2],
    drums: 'drive',
  },
  boss: {
    bpm: 138, lead: 'sawtooth',
    chords: [[48, 51, 55], [44, 48, 51], [46, 50, 53], [43, 47, 50]],
    bass: [36, 32, 34, 31],
    arp: [0, 2, 1, 2, 0, 2, 1, 2],
    drums: 'drive',
  },
  victory: {
    bpm: 112, lead: 'triangle',
    chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
    bass: [48, 53, 55, 48],
    arp: [0, 1, 2, 1, 0, 1, 2, 2],
    drums: 'soft',
  },
};

let pendingTheme = null, current = null, timer = null, step = 0, nextTime = 0;

function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); g.connect(musicBus);
  o.start(t); o.stop(t + 0.25);
}
function hat(t, vol) {
  if (!noiseBuf) noise({ dur: 0.01, vol: 0.0001 });
  const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf;
  fl.type = 'highpass'; fl.frequency.value = 7000;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(fl); fl.connect(g); g.connect(musicBus);
  src.start(t); src.stop(t + 0.06);
}
function note(t, n, type, dur, vol, cutoff, send) {
  const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  o.type = type;
  o.frequency.value = midi(n);
  lp.type = 'lowpass'; lp.frequency.value = cutoff;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); lp.connect(g); g.connect(musicBus);
  if (send) g.connect(echo);
  o.start(t); o.stop(t + dur + 0.05);
}

function schedule() {
  const th = THEMES[current];
  const sixteenth = 60 / th.bpm / 4;
  while (nextTime < ctx.currentTime + 0.15) {
    const bar = Math.floor(step / 16) % th.chords.length;
    const s = step % 16;
    const chord = th.chords[bar];
    if (s === 0) chord.forEach((n) => note(nextTime, n, 'sawtooth', sixteenth * 16, 0.035, 900, true));
    if (s % 4 === 0 || (th.drums === 'drive' && s % 2 === 0)) {
      note(nextTime, th.bass[bar], th.drums === 'drive' ? 'sawtooth' : 'triangle', sixteenth * 1.8, 0.16, 500, false);
    }
    if (s % 2 === 0) {
      const n = chord[th.arp[(s / 2) % th.arp.length]] + 12;
      note(nextTime, n, th.lead, sixteenth * 1.6, th.lead === 'triangle' ? 0.07 : 0.035, 2600, true);
    }
    if (th.drums === 'drive') {
      if (s % 4 === 0) kick(nextTime);
      if (s % 2 === 1) hat(nextTime, 0.05);
    } else if (th.drums === 'soft') {
      if (s === 0 || s === 10) kick(nextTime);
      if (s % 4 === 2) hat(nextTime, 0.03);
    }
    nextTime += sixteenth;
    step++;
  }
}

export function playMusic(name) {
  pendingTheme = name;
  if (!ctx) return;
  if (current === name && timer) return;
  stopMusic();
  current = name;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(schedule, 40);
}

export function stopMusic() {
  clearInterval(timer);
  timer = null;
  current = null;
}
