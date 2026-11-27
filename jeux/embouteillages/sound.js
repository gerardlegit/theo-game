// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : les klaxons (chaque voiture a
// le sien), le sifflet de Zaza, le « clonk » d'un panneau qu'on plante, le
// crissement des pneus, le petit carillon d'une voiture garée et la fanfare.
// ============================================================================

const STORAGE_KEY = 'embouteillages-son';
let ctx = null;
let master = null;
let enabled = true;
try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { /* stockage indisponible */ }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
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

function tone(freq, start, dur, { type = 'sine', vol = 0.15, to = null, attack = 0.012, vib = 0 } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  gain.gain.setValueAtTime(vol, t0 + Math.max(attack, dur * 0.7));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  gain.connect(master);
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  if (vib) {
    const lfo = ac.createOscillator();
    const lg = ac.createGain();
    lfo.frequency.value = 28;
    lg.gain.value = vib;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
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
  src.connect(filter).connect(gain).connect(master);
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

/* un klaxon : deux notes un peu fausses ensemble, comme une vraie trompe */
function horn(base, start, dur, vol) {
  tone(base, start, dur, { type: 'sawtooth', vol: vol * 0.5, attack: 0.02 });
  tone(base * 1.26, start, dur, { type: 'square', vol: vol * 0.32, attack: 0.02 });
}

export const sfx = {
  /* id : la voiture (chacune a sa note) ; furieux : un long klaxon rageur */
  klaxon(id = 0, furieux = false) {
    play(() => {
      const base = [233, 262, 294, 208, 311, 247, 196][id % 7];
      if (furieux) {
        horn(base, 0, 0.55, 0.12);
      } else {
        horn(base, 0, 0.14, 0.1);
        if (id % 2) horn(base, 0.2, 0.14, 0.1);
      }
    }, 'klaxon', 260);
  },
  /* le sifflet de Zaza : tuuut-tut */
  sifflet() {
    play(() => {
      tone(2650, 0, 0.22, { vol: 0.09, vib: 90 });
      tone(2650, 0.28, 0.1, { vol: 0.09, vib: 90 });
    }, 'sifflet', 300);
  },
  /* un panneau qu'on plante dans le trottoir */
  pose() {
    play(() => {
      noise(0, 0.08, { vol: 0.25, freq: 900, q: 0.8 });
      tone(520, 0, 0.18, { type: 'triangle', vol: 0.18, to: 330 });
      tone(1560, 0.02, 0.25, { type: 'sine', vol: 0.05 });
    });
  },
  enleve() {
    play(() => {
      tone(380, 0, 0.12, { type: 'triangle', vol: 0.14, to: 700 });
      noise(0, 0.06, { vol: 0.1, freq: 3000 });
    });
  },
  select() { play(() => tone(880, 0, 0.07, { type: 'triangle', vol: 0.1 })); },
  refus() { play(() => { tone(220, 0, 0.12, { type: 'square', vol: 0.06 }); tone(196, 0.12, 0.16, { type: 'square', vol: 0.06 }); }); },
  /* une voiture garée : ding-dong */
  arrive(k = 0) {
    play(() => {
      const n = 76 + (k % 3) * 2;
      tone(NOTE(n), 0, 0.25, { type: 'triangle', vol: 0.12 });
      tone(NOTE(n + 4), 0.09, 0.35, { type: 'triangle', vol: 0.12 });
    }, 'arrive', 90);
  },
  /* les pneus qui crissent : une grosse frayeur */
  frayeur() {
    play(() => {
      noise(0, 0.6, { vol: 0.22, freq: 3200, to: 1400, q: 6 });
      horn(262, 0.25, 0.45, 0.12);
    }, 'frayeur', 400);
  },
  open() { play(() => { tone(660, 0, 0.08, { type: 'triangle', vol: 0.08 }); tone(990, 0.06, 0.1, { type: 'triangle', vol: 0.08 }); }); },
  zaza() { play(() => { tone(1200, 0, 0.06, { vol: 0.05, to: 1600 }); tone(1500, 0.07, 0.07, { vol: 0.05, to: 1300 }); }, 'zaza', 200); },
  star(k) { play(() => tone(NOTE(79 + k * 4), 0, 0.3, { type: 'triangle', vol: 0.14 })); },
  /* la fanfare : tout le monde klaxonne en musique */
  win() {
    play(() => {
      [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), i * 0.12, 0.3, { type: 'triangle', vol: 0.13 }));
      [0.55, 0.75].forEach((s) => horn(NOTE(60), s, 0.12, 0.08));
      horn(NOTE(67), 0.95, 0.35, 0.09);
    });
  },
  fail() {
    play(() => {
      [67, 64, 60].forEach((n, i) => tone(NOTE(n), i * 0.22, 0.32, { type: 'sawtooth', vol: 0.05 }));
      horn(NOTE(55), 0.7, 0.6, 0.06);
    });
  },
  /* la petite musique de départ d'un niveau */
  go() {
    play(() => {
      tone(NOTE(72), 0, 0.12, { type: 'triangle', vol: 0.12 });
      tone(NOTE(79), 0.14, 0.2, { type: 'triangle', vol: 0.12 });
    });
  },
};
