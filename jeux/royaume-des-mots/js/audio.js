// ============================================================================
// SON DU ROYAUME — musique médiévale et bruitages synthétisés (Web Audio),
// plus la lecture à voix haute (synthèse vocale du navigateur).
//
// Aucun fichier audio : luth, flûte, bourdon de vielle et tambourin sont
// fabriqués avec des oscillateurs. Trois réglages : 'all', 'sfx', 'off'.
// ============================================================================

const MODE_KEY = 'royaume-des-mots-sound';
const MODES = ['all', 'sfx', 'off'];

let ctx = null, master = null, sfxBus = null, musicBus = null, verb = null;
let mode = 'all';
try { if (MODES.includes(localStorage.getItem(MODE_KEY))) mode = localStorage.getItem(MODE_KEY); } catch { /* ignore */ }

export const soundMode = () => mode;

function applyMode() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(mode === 'off' ? 0 : 0.85, t, 0.05);
  musicBus.gain.setTargetAtTime(mode === 'all' ? 0.32 : 0, t, 0.15);
}

export function cycleSound() {
  mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  try { localStorage.setItem(MODE_KEY, mode); } catch { /* ignore */ }
  applyMode();
  if (mode === 'off') stopSpeech();
  return mode;
}

/** À appeler lors d'un geste de l'utilisateur (exigé par les navigateurs). */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.6;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    // Petite réverbération de « grande salle » : deux échos amortis.
    verb = ctx.createDelay(1);
    verb.delayTime.value = 0.21;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    const wet = ctx.createGain(); wet.gain.value = 0.3;
    verb.connect(lp); lp.connect(fb); fb.connect(verb); lp.connect(wet); wet.connect(master);
    applyMode();
  }
  if (ctx.state === 'suspended') ctx.resume();
  if (wantedTheme && !playing) startMusic(wantedTheme);
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

function tone({ f, type = 'sine', dur = 0.2, vol = 0.2, at = 0, when = null, attack = 0.005, slide = null, filter = null, bus = sfxBus, wet = false, vibrato = 0 }) {
  if (!ctx) return;
  const t = when ?? ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 5.5; lg.gain.value = vibrato;
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(t); lfo.stop(t + dur + 0.1);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filter) {
    const f2 = ctx.createBiquadFilter();
    f2.type = 'lowpass'; f2.frequency.value = filter;
    o.connect(f2); node = f2;
  }
  node.connect(g);
  g.connect(bus);
  if (wet && verb) g.connect(verb);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise({ dur = 0.2, vol = 0.2, at = 0, when = null, freq = 1500, q = 1, type = 'bandpass', sweep = null, bus = sfxBus }) {
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = when ?? ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const fl = ctx.createBiquadFilter();
  fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(freq, t);
  if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fl); fl.connect(g); g.connect(bus);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// ------------------------------------------------------------ instruments ---
function lute(n, t, dur, vol = 0.16, bus = musicBus) {
  tone({ f: midi(n), type: 'triangle', dur: Math.max(0.25, dur * 1.4), vol, when: t, attack: 0.003, bus, wet: true });
  tone({ f: midi(n), type: 'sawtooth', dur: 0.18, vol: vol * 0.35, when: t, attack: 0.002, filter: 1800, bus });
}
function flute(n, t, dur, vol = 0.07) {
  tone({ f: midi(n), type: 'sine', dur, vol, when: t, attack: 0.05, bus: musicBus, wet: true, vibrato: 3 });
  tone({ f: midi(n + 12), type: 'sine', dur, vol: vol * 0.15, when: t, attack: 0.06, bus: musicBus });
}
function drone(n, t, dur, vol = 0.035) {
  tone({ f: midi(n), type: 'sawtooth', dur, vol, when: t, attack: 0.3, filter: 600, bus: musicBus });
}
function tabor(t, vol = 0.12) {
  noise({ dur: 0.09, vol, when: t, freq: 900, type: 'bandpass', q: 0.8, bus: musicBus });
  tone({ f: 140, type: 'sine', dur: 0.12, vol: vol * 1.2, when: t, slide: 70, bus: musicBus });
}
function shaker(t, vol = 0.04) {
  noise({ dur: 0.05, vol, when: t, freq: 6000, type: 'highpass', bus: musicBus });
}

// ---------------------------------------------------------------- thèmes ---
// Notes [midi, durée en croches]. Mode de ré (dorien), mesure à 6/8.
const THEMES = {
  map: {
    bpm: 112, steps: 48,
    melody: [[62, 2], [65, 1], [67, 2], [69, 1], [69, 2], [71, 1], [72, 2], [71, 1], [69, 3], [67, 2], [65, 1], [64, 3], [62, 3],
      [65, 2], [67, 1], [69, 2], [67, 1], [65, 2], [64, 1], [62, 2], [64, 1], [65, 2], [64, 1], [62, 2], [60, 1], [62, 6]],
    chords: [[50, 57, 62], [53, 60, 65], [50, 57, 62], [45, 52, 57], [53, 60, 65], [48, 55, 60], [48, 55, 60], [50, 57, 62]],
    voice: 'flute',
    perc: (s, t) => { if (s % 6 === 0) tabor(t, 0.07); else if (s % 6 === 3) shaker(t); },
  },
  battle: {
    bpm: 150, steps: 32,
    melody: [[62, 1], [62, 1], [65, 1], [62, 1], [67, 2], [65, 2], [64, 1], [64, 1], [67, 1], [64, 1], [69, 2], [67, 2],
      [70, 2], [69, 2], [67, 2], [65, 2], [64, 1], [65, 1], [67, 1], [64, 1], [62, 4]],
    chords: [[38, 45], [38, 45], [36, 43], [36, 43], [34, 41], [36, 43], [33, 40], [38, 45]],
    bar: 4,
    voice: 'lute',
    perc: (s, t) => { if (s % 4 === 0) tabor(t, 0.16); if (s % 4 === 2) tabor(t, 0.09); shaker(t, 0.03); },
  },
};

let wantedTheme = null, playing = null, timer = null, step = 0, nextTime = 0;

function scheduleStep(th, s, t, stepDur) {
  // Mélodie
  let pos = 0;
  for (const [n, d] of th.melody) {
    if (pos === s) {
      if (th.voice === 'flute') flute(n, t, d * stepDur * 0.95);
      else lute(n + 12, t, d * stepDur, 0.1);
    }
    pos += d;
  }
  // Accompagnement : accord égrené en début de mesure, bourdon.
  const bar = th.bar || 6;
  const chord = th.chords[Math.floor(s / bar) % th.chords.length];
  if (s % bar === 0) {
    chord.forEach((n, i) => lute(n, t + i * 0.03, stepDur * 2, 0.07));
    drone(chord[0] - (th.voice === 'flute' ? 12 : 0), t, stepDur * bar, 0.03);
  } else if (th.voice === 'flute' && s % bar === 3) {
    lute(chord[chord.length - 1], t, stepDur, 0.05);
  }
  th.perc(s, t);
}

function tick() {
  const th = THEMES[playing];
  if (!th || !ctx) return;
  const stepDur = 60 / th.bpm / 2;
  while (nextTime < ctx.currentTime + 0.25) {
    scheduleStep(th, step, nextTime, stepDur);
    nextTime += stepDur;
    step = (step + 1) % th.steps;
  }
}

function startMusic(name) {
  stopMusicNow();
  if (!ctx || !THEMES[name]) return;
  playing = name;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(tick, 60);
  tick();
}

function stopMusicNow() {
  if (timer) clearInterval(timer);
  timer = null;
  playing = null;
}

/** Lance un thème (ou null pour le silence). Sans effet si c'est déjà le bon. */
export function music(name) {
  wantedTheme = name;
  if (!ctx) return;
  if (!name) { stopMusicNow(); return; }
  if (playing !== name) startMusic(name);
}

// ------------------------------------------------------------- bruitages ---
const arp = (notes, gap, opts) => notes.forEach((n, i) => tone({ f: midi(n), at: i * gap, ...opts }));

export const sfx = {
  click() { tone({ f: 660, type: 'triangle', dur: 0.06, vol: 0.08 }); },
  select() { tone({ f: midi(79), type: 'triangle', dur: 0.12, vol: 0.1, wet: true }); },
  correct() { arp([74, 78, 81, 86], 0.07, { type: 'triangle', dur: 0.35, vol: 0.16, wet: true }); },
  wrong() {
    tone({ f: 196, type: 'triangle', dur: 0.35, vol: 0.2, slide: 130 });
    tone({ f: 185, type: 'sine', dur: 0.4, vol: 0.12, at: 0.05, slide: 110 });
  },
  coin() {
    tone({ f: midi(88), type: 'square', dur: 0.08, vol: 0.06, filter: 4000 });
    tone({ f: midi(93), type: 'square', dur: 0.25, vol: 0.06, at: 0.07, filter: 4000, wet: true });
  },
  slash() {
    noise({ dur: 0.25, vol: 0.3, freq: 5000, sweep: 800, type: 'bandpass', q: 2 });
    tone({ f: 1800, type: 'sine', dur: 0.15, vol: 0.05, slide: 600 });
  },
  hit() {
    noise({ dur: 0.3, vol: 0.35, freq: 700, sweep: 120, type: 'lowpass' });
    tone({ f: 130, type: 'sine', dur: 0.3, vol: 0.35, slide: 45 });
    tone({ f: midi(84), type: 'triangle', dur: 0.4, vol: 0.06, at: 0.02, wet: true });
  },
  hurt() {
    noise({ dur: 0.4, vol: 0.25, freq: 400, sweep: 80, type: 'lowpass' });
    tone({ f: 110, type: 'sawtooth', dur: 0.45, vol: 0.12, slide: 55, filter: 700 });
  },
  roar() {
    tone({ f: 90, type: 'sawtooth', dur: 0.9, vol: 0.16, slide: 55, filter: 500, attack: 0.08 });
    noise({ dur: 0.9, vol: 0.18, freq: 400, sweep: 150, type: 'lowpass' });
  },
  fanfare() {
    const brass = (n, at, dur) => {
      tone({ f: midi(n), type: 'sawtooth', dur, vol: 0.09, at, attack: 0.03, filter: 2200, wet: true });
      tone({ f: midi(n - 12), type: 'square', dur, vol: 0.04, at, attack: 0.03, filter: 900 });
    };
    [[67, 0, 0.15], [67, 0.15, 0.15], [67, 0.3, 0.15], [72, 0.45, 0.6], [71, 1.05, 0.15], [72, 1.2, 0.9]].forEach(([n, at, d]) => brass(n, at, d));
  },
  victory() {
    arp([62, 66, 69, 74, 78, 81, 86], 0.09, { type: 'triangle', dur: 0.6, vol: 0.13, wet: true });
    setTimeout(() => sfx.fanfare(), 650);
  },
  page() { noise({ dur: 0.22, vol: 0.12, freq: 3000, sweep: 1200, type: 'bandpass', q: 0.6 }); },
  magic() { arp([84, 88, 91, 96, 100], 0.05, { type: 'sine', dur: 0.4, vol: 0.07, wet: true }); },
  unlock() { arp([72, 79, 84], 0.1, { type: 'triangle', dur: 0.5, vol: 0.12, wet: true }); },
  build() {
    [0, 0.18, 0.36].forEach((at) => { noise({ dur: 0.08, vol: 0.3, at, freq: 2500, type: 'bandpass', q: 3 }); tone({ f: 900, type: 'square', dur: 0.05, vol: 0.04, at }); });
    setTimeout(() => arp([72, 76, 79, 84], 0.08, { type: 'triangle', dur: 0.4, vol: 0.12, wet: true }), 550);
  },
  combo() { arp([81, 86, 90], 0.05, { type: 'square', dur: 0.12, vol: 0.05, filter: 3500 }); },
  defeat() { arp([69, 65, 62, 57], 0.22, { type: 'triangle', dur: 0.5, vol: 0.14, wet: true }); },
};

// ------------------------------------------------------ lecture à voix haute ---
let frVoice = null;
function findVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  frVoice = voices.find((v) => v.lang === 'fr-FR' && /Google|Microsoft|Amélie|Thomas|Denise|Henri/i.test(v.name))
    || voices.find((v) => v.lang && v.lang.startsWith('fr')) || null;
  return frVoice;
}
if ('speechSynthesis' in window) {
  findVoice();
  speechSynthesis.onvoiceschanged = findVoice;
}

export const canSpeak = () => 'speechSynthesis' in window;

export function speak(text) {
  if (!canSpeak() || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '').replace(/_{2,}/g, '…'));
  u.lang = 'fr-FR';
  u.rate = 0.92;
  if (frVoice || findVoice()) u.voice = frVoice;
  speechSynthesis.speak(u);
}

export function stopSpeech() {
  if (canSpeak()) speechSynthesis.cancel();
}
