// ============================================================================
// Bruitages synthétisés (aucun fichier audio) : bulles qui apparaissent et
// éclatent, carillon magique quand on trouve, « pschitt » quand on se
// trompe, rire de Gribouille, souffle du vent, étoile filante, page qui
// tourne, petite fanfare de fin. Et la voix : les lettres et les mots lus à
// voix haute (synthèse vocale du navigateur, en français).
// ============================================================================

const STORAGE_KEY = 'lettres-magiques-son';
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
  if (!enabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  return enabled;
}

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

function tone(freq, start, dur, { type = 'sine', vol = 0.15, to = null, attack = 0.015 } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
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
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.05, dur / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

function play(fn) { if (enabled) fn(); }

export const sfx = {
  /* une bulle se gonfle : petit « bloup » qui monte */
  inflate: (i = 0) => play(() => {
    const f = 380 + i * 70;
    tone(f, i * 0.07, 0.16, { vol: 0.07, to: f * 2.1 });
  }),
  /* la bulle éclate : « pop » sec */
  pop: () => play(() => {
    noise(0, 0.07, { vol: 0.22, freq: 3200, q: 0.8 });
    tone(900 + Math.random() * 200, 0, 0.08, { vol: 0.1, to: 300 });
  }),
  /* la bonne réponse : carillon magique (plus aigu quand la série monte) */
  right: (streak = 0) => play(() => {
    const base = 76 + Math.min(streak, 6);
    [0, 4, 7, 12].forEach((n, i) => tone(NOTE(base + n), 0.05 + i * 0.07, 0.5, { type: 'triangle', vol: 0.11 }));
    tone(NOTE(base + 19), 0.34, 0.6, { vol: 0.05 });
  }),
  /* la mauvaise bulle : « pschitt » de fumée, puis un petit boing grave */
  wrong: () => play(() => {
    noise(0, 0.35, { vol: 0.16, freq: 900, to: 300, q: 0.7 });
    tone(220, 0.05, 0.25, { type: 'square', vol: 0.05, to: 140 });
  }),
  /* Gribouille rigole : hi hi hi */
  giggle: () => play(() => {
    for (let i = 0; i < 3; i++) {
      const f = 900 - i * 60 + Math.random() * 40;
      tone(f, i * 0.12, 0.09, { type: 'square', vol: 0.035, to: f * 1.25 });
    }
  }),
  /* Gribouille souffle : fffouuu */
  wind: () => play(() => {
    noise(0, 1.1, { vol: 0.12, freq: 500, to: 1400, q: 0.6 });
  }),
  /* coup de baguette : un trait qui file */
  zap: () => play(() => {
    tone(1400, 0, 0.14, { type: 'sine', vol: 0.05, to: 2600 });
    noise(0, 0.12, { vol: 0.05, freq: 5000, q: 2 });
  }),
  /* série de bonnes réponses : petit arpège joyeux */
  streak: () => play(() => {
    [0, 2, 4, 7, 9, 12].forEach((n, i) => tone(NOTE(84 + n), i * 0.05, 0.22, { type: 'triangle', vol: 0.06 }));
  }),
  /* l'étoile filante passe… et on l'attrape */
  starPass: () => play(() => {
    for (let i = 0; i < 6; i++) tone(NOTE(96 - i), i * 0.08, 0.3, { vol: 0.03 });
  }),
  starCatch: () => play(() => {
    [0, 7, 12, 16, 19, 24].forEach((n, i) => tone(NOTE(79 + n), i * 0.045, 0.4, { type: 'triangle', vol: 0.08 }));
  }),
  /* gagner des étoiles, acheter à la boutique */
  coin: () => play(() => {
    tone(NOTE(88), 0, 0.08, { type: 'square', vol: 0.04 });
    tone(NOTE(95), 0.07, 0.25, { type: 'square', vol: 0.04 });
  }),
  /* Plume parle : hou-hou tout doux */
  hoot: () => play(() => {
    tone(520, 0, 0.16, { vol: 0.05, to: 470, attack: 0.04 });
    tone(470, 0.2, 0.22, { vol: 0.045, to: 420, attack: 0.04 });
  }),
  /* une page du grimoire se tourne */
  page: () => play(() => {
    noise(0, 0.45, { vol: 0.12, freq: 1800, to: 600, q: 0.6 });
    tone(NOTE(84), 0.3, 0.5, { type: 'triangle', vol: 0.05 });
    tone(NOTE(91), 0.4, 0.6, { type: 'triangle', vol: 0.05 });
  }),
  /* la fin d'un niveau : petite fanfare */
  fanfare: () => play(() => {
    const melody = [[72, 0], [76, 0.15], [79, 0.3], [84, 0.45], [79, 0.7], [84, 0.85]];
    melody.forEach(([n, t]) => tone(NOTE(n), t, 0.3, { type: 'triangle', vol: 0.12 }));
    [60, 64, 67, 72].forEach((n) => tone(NOTE(n), 0.85, 1.4, { type: 'sine', vol: 0.06 }));
  }),
  /* un clic dans les menus */
  click: () => play(() => tone(700, 0, 0.05, { type: 'square', vol: 0.03 })),
  /* (intro) la magie du grimoire */
  magic: () => play(() => {
    for (let i = 0; i < 8; i++) tone(NOTE(84 + [0, 4, 7, 11, 12, 16, 19, 23][i]), i * 0.06, 0.5, { vol: 0.04 });
  }),
};

/* ---------- La voix : lire une lettre ou un mot ---------- */
let frVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  frVoice = voices.find((v) => /^fr(-|_)FR/i.test(v.lang)) || voices.find((v) => /^fr/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function canSpeak() { return 'speechSynthesis' in window; }

export function speak(text, rate = 0.85) {
  if (!enabled || !canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    if (frVoice) u.voice = frVoice;
    u.rate = rate;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch (e) { /* synthèse vocale indisponible */ }
}
