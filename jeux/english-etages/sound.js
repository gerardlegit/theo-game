// ============================================================================
// Petits bruitages synthétisés (aucun fichier audio) : clochette, arpège,
// et une petite valse façon accordéon musette pour la victoire.
// ============================================================================

let ctx = null;
let enabled = true;
try { enabled = localStorage.getItem('english-etages-sound') !== 'off'; } catch (e) { /* stockage indisponible */ }

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
  try { localStorage.setItem('english-etages-sound', enabled ? 'on' : 'off'); } catch (e) { /* ignoré */ }
  return enabled;
}

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

/* une note ; type 'accordion' = deux dents de scie légèrement désaccordées */
function tone(midi, start, dur, { type = 'sine', vol = 0.18, vibrato = 0 } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = type === 'accordion' ? 2200 : 6000;
  filter.connect(gain).connect(ac.destination);

  const oscTypes = type === 'accordion' ? [['sawtooth', -6], ['sawtooth', 6]] : [[type, 0]];
  oscTypes.forEach(([oscType, detune]) => {
    const osc = ac.createOscillator();
    osc.type = oscType;
    osc.frequency.value = NOTE(midi);
    osc.detune.value = detune;
    if (vibrato) {
      const lfo = ac.createOscillator();
      const depth = ac.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur);
    }
    osc.connect(filter);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  });
}

function play(fn) { if (enabled) fn(); }

export const sfx = {
  tap:   () => play(() => tone(84, 0, 0.08, { type: 'triangle', vol: 0.08 })),
  good:  () => play(() => { tone(84, 0, 0.25, { vol: 0.16 }); tone(88, 0.1, 0.4, { vol: 0.16 }); }),
  bad:   () => play(() => { tone(55, 0, 0.35, { type: 'triangle', vol: 0.2, vibrato: 6 }); tone(50, 0.3, 0.6, { type: 'triangle', vol: 0.2, vibrato: 6 }); }),
  floor: () => play(() => [72, 76, 79, 84].forEach((n, i) => tone(n, i * 0.09, 0.35, { type: 'triangle', vol: 0.14 }))),
  /* petite valse à trois temps, composée pour le jeu */
  win: () => play(() => {
    const melody = [
      [76, 1], [79, 1], [84, 1], [83, 2], [81, 1],
      [79, 1], [77, 1], [76, 1], [74, 3],
      [74, 1], [77, 1], [81, 1], [79, 2], [77, 1],
      [76, 1], [79, 1], [72, 1], [84, 3],
    ];
    const beat = 0.24;
    let t = 0;
    melody.forEach(([n, len]) => {
      tone(n, t, len * beat * 0.95, { type: 'accordion', vol: 0.07, vibrato: 3 });
      t += len * beat;
    });
    // l'accompagnement « poum-tchak-tchak »
    for (let bar = 0; bar < 8; bar++) {
      const root = [48, 43, 50, 48, 50, 43, 48, 48][bar];
      tone(root, bar * 3 * beat, beat, { type: 'triangle', vol: 0.12 });
      tone(root + 16, bar * 3 * beat + beat, beat * 0.6, { type: 'accordion', vol: 0.03 });
      tone(root + 19, bar * 3 * beat + 2 * beat, beat * 0.6, { type: 'accordion', vol: 0.03 });
    }
  }),
  lose: () => play(() => [67, 66, 65, 64].forEach((n, i) =>
    tone(n - 12, i * 0.38, i === 3 ? 0.9 : 0.36, { type: 'accordion', vol: 0.08, vibrato: i === 3 ? 8 : 0 }))),
};
