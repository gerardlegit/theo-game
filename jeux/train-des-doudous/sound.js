// Petits bruitages synthétisés (Web Audio) : pas de fichier son à charger.

const SOUND_KEY = 'train-des-doudous-sound';
let ctx = null;
let soundOn = true;
try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* stockage indisponible */ }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = 0.12, delay = 0, slide = 0 } = {}) {
  if (!soundOn) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  pick: () => tone(660, 0.08, { type: 'triangle' }),
  drop: () => { tone(520, 0.09, { type: 'triangle' }); tone(780, 0.08, { type: 'triangle', delay: 0.05 }); },
  back: () => tone(420, 0.12, { slide: -160 }),
  hint: () => { tone(880, 0.1); tone(1175, 0.14, { delay: 0.08 }); },
  oops: () => { tone(260, 0.18, { type: 'square', vol: 0.045 }); tone(200, 0.24, { type: 'square', vol: 0.045, delay: 0.13 }); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, { type: 'triangle', vol: 0.14, delay: i * 0.11 })),
  point: () => { tone(988, 0.1, { type: 'triangle' }); tone(1319, 0.22, { type: 'triangle', delay: 0.09 }); },
  // « tchou tchou ! »
  whistle: () => [0, 0.42].forEach((d) => { tone(740, 0.32, { vol: 0.1, delay: d }); tone(932, 0.32, { vol: 0.07, delay: d }); }),
  giggle: () => [0, 1, 2, 3].forEach((i) => tone(900 - i * 70, 0.07, { type: 'triangle', vol: 0.05, delay: i * 0.09, slide: 60 })),
};

export const isSoundOn = () => soundOn;

export function toggleSound() {
  soundOn = !soundOn;
  try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch { /* stockage indisponible */ }
  return soundOn;
}
