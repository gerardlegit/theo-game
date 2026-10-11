// ============================================================================
// LE PEINTRE DE PLANÈTES — chaque astre d'un niveau est dessiné :
//   1. avec "paint" : une planète inventée, peinte en code (voir PAINT_TYPES)
//   2. sinon, si c'est un astre spécial d'ici (Triton)
//   3. sinon, avec les dessins de Mission Cosmos (../espace/art.js), par son id
//
// Exemple de planète inventée, dans un fichier de niveau :
//   { id: 'brume', name: 'Brume', r: 70, dist: 1500,
//     paint: { type: 'gas', colors: ['#FFE0F0', '#E07AB8', '#6A2A60'], rings: '#F4C6E0' } }
// ============================================================================

import { renderArt } from "../espace/art.js";

const TAU = Math.PI * 2;
const HALF_SIZE = 2.2;

export const PAINT_TYPES = ['rocky', 'gas', 'ice', 'ocean', 'lava', 'star'];

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function canvasFor(r, scale = 2) {
  const half = r * HALF_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.ceil(half * 2 * scale);
  const c = canvas.getContext('2d');
  c.scale(scale, scale);
  c.translate(half, half);
  return { canvas, c, half };
}

function disc(c, r) {
  c.beginPath();
  c.arc(0, 0, r, 0, TAU);
}

function halo(c, r0, r1, color, a) {
  const g = c.createRadialGradient(0, 0, r0, 0, 0, r1);
  g.addColorStop(0, color.replace(')', `,${a})`).replace('rgb(', 'rgba('));
  g.addColorStop(1, color.replace(')', ',0)').replace('rgb(', 'rgba('));
  c.fillStyle = g;
  disc(c, r1);
  c.fill();
}

/** Ombre + reflet : la lumière vient d'en haut à gauche, comme dans Mission Cosmos */
function shade(c, r, dark = 0.6) {
  const g = c.createRadialGradient(-r * 0.45, -r * 0.5, r * 0.05, -r * 0.15, -r * 0.15, r * 1.2);
  g.addColorStop(0, 'rgba(255,255,255,0.38)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.06)');
  g.addColorStop(0.6, 'rgba(0,0,20,0)');
  g.addColorStop(1, `rgba(0,0,20,${dark})`);
  c.fillStyle = g;
  disc(c, r);
  c.fill();
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
}

function rings(c, r, color, front) {
  c.save();
  c.scale(1, 0.32);
  c.lineWidth = r * 0.38;
  c.strokeStyle = color;
  c.globalAlpha = 0.75;
  c.beginPath();
  c.arc(0, 0, r * 1.75, front ? 0 : Math.PI, front ? Math.PI : TAU);
  c.stroke();
  c.globalAlpha = 0.4;
  c.lineWidth = r * 0.12;
  c.beginPath();
  c.arc(0, 0, r * 2.05, front ? 0 : Math.PI, front ? Math.PI : TAU);
  c.stroke();
  c.restore();
}

/**
 * Peint une planète inventée de rayon r.
 * spec = { type, colors: [clair, moyen, foncé], spots?, rings?, glow? }
 */
export function renderPainted(spec, r, seed = 1) {
  const { canvas, c, half } = canvasFor(r);
  const rand = mulberry32(seed);
  const [light, mid, dark] = spec.colors || ['#EEEEEE', '#AAAAAA', '#555555'];
  const type = spec.type || 'rocky';

  if (type === 'star') {
    halo(c, r * 0.8, r * 2.1, hexToRgb(spec.glow || mid), 0.55);
    const g = c.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    g.addColorStop(0, light);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, dark);
    c.fillStyle = g;
    disc(c, r);
    c.fill();
    c.save();
    disc(c, r);
    c.clip();
    for (let i = 0; i < 14; i++) {
      c.fillStyle = `rgba(255,255,255,${0.06 + rand() * 0.08})`;
      c.beginPath();
      c.arc((rand() - 0.5) * 1.8 * r, (rand() - 0.5) * 1.8 * r, r * (0.08 + rand() * 0.14), 0, TAU);
      c.fill();
    }
    c.restore();
    return { canvas, half };
  }

  halo(c, r * 0.95, r * 1.3, hexToRgb(spec.glow || light), 0.25);
  if (spec.rings) rings(c, r, spec.rings, false);

  const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  g.addColorStop(0, light);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  disc(c, r);
  c.fill();

  c.save();
  disc(c, r);
  c.clip();
  if (type === 'gas') {
    // des bandes ondulées, comme Jupiter
    const n = 6 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const y = -r + ((i + 0.5) / n) * 2 * r;
      const h = (r * 2 / n) * (0.35 + rand() * 0.4);
      c.fillStyle = i % 2 ? `rgba(255,255,255,${0.12 + rand() * 0.12})` : `${dark}55`;
      c.beginPath();
      c.moveTo(-r * 1.1, y);
      for (let x = -r * 1.1; x <= r * 1.1; x += r * 0.2) c.lineTo(x, y + Math.sin(x / r * 4 + i) * h * 0.25);
      c.lineTo(r * 1.1, y + h);
      c.lineTo(-r * 1.1, y + h);
      c.closePath();
      c.fill();
    }
    if (spec.spots) {
      c.fillStyle = spec.spots;
      c.beginPath();
      c.ellipse(r * 0.3, r * 0.25, r * 0.22, r * 0.12, 0, 0, TAU);
      c.fill();
    }
  } else if (type === 'ocean') {
    // continents et nuages
    for (let i = 0; i < 6; i++) {
      c.fillStyle = spec.spots || '#5BB86A';
      c.beginPath();
      c.ellipse((rand() - 0.5) * 1.6 * r, (rand() - 0.5) * 1.6 * r, r * (0.15 + rand() * 0.25), r * (0.1 + rand() * 0.18), rand() * 3, 0, TAU);
      c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      c.lineWidth = r * (0.05 + rand() * 0.06);
      const y = (rand() - 0.5) * 1.6 * r, x = (rand() - 0.5) * r;
      c.beginPath();
      c.moveTo(x - r * 0.4, y);
      c.quadraticCurveTo(x, y - r * 0.15, x + r * 0.45, y + r * 0.05);
      c.stroke();
    }
  } else if (type === 'ice') {
    // de longues fissures dans la glace
    c.strokeStyle = spec.spots || `${dark}88`;
    c.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      c.lineWidth = r * (0.02 + rand() * 0.03);
      const a = rand() * TAU, b = a + Math.PI + (rand() - 0.5) * 1.5;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1);
      c.quadraticCurveTo((rand() - 0.5) * r, (rand() - 0.5) * r, Math.cos(b) * r * 1.1, Math.sin(b) * r * 1.1);
      c.stroke();
    }
  } else if (type === 'lava') {
    // des fleuves de lave qui brillent
    c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      c.strokeStyle = spec.spots || '#FF8A3C';
      c.shadowColor = spec.spots || '#FF8A3C';
      c.shadowBlur = r * 0.15;
      c.lineWidth = r * (0.03 + rand() * 0.04);
      let x = (rand() - 0.5) * 1.8 * r, y = (rand() - 0.5) * 1.8 * r;
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (rand() - 0.5) * r * 0.6;
        y += (rand() - 0.5) * r * 0.6;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    c.shadowBlur = 0;
  } else {
    // rocky : des cratères
    for (let i = 0; i < 14; i++) {
      const x = (rand() - 0.5) * 1.8 * r, y = (rand() - 0.5) * 1.8 * r, cr = r * (0.05 + rand() * 0.14);
      c.fillStyle = `${dark}66`;
      c.beginPath();
      c.arc(x, y, cr, 0, TAU);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.3)';
      c.lineWidth = cr * 0.2;
      c.beginPath();
      c.arc(x, y, cr * 0.9, -0.1 * Math.PI, 0.65 * Math.PI);
      c.stroke();
    }
  }
  c.restore();
  shade(c, r, 0.6);
  if (spec.rings) rings(c, r, spec.rings, true);
  return { canvas, half };
}

/** Triton : une lune glacée rose pâle, avec des traînées sombres laissées par ses geysers */
function renderTriton(r) {
  const { canvas, c } = canvasFor(r);
  const half = r * HALF_SIZE;
  halo(c, r * 0.9, r * 1.3, 'rgb(220,230,255)', 0.35);
  const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  g.addColorStop(0, '#FFF4F0');
  g.addColorStop(0.55, '#E9C9C4');
  g.addColorStop(1, '#A98A92');
  c.fillStyle = g;
  disc(c, r);
  c.fill();
  c.save();
  disc(c, r);
  c.clip();
  c.fillStyle = 'rgba(255,240,245,0.6)';
  c.beginPath();
  c.ellipse(0, r * 0.75, r * 1.1, r * 0.55, 0, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(90,60,70,0.4)';
  c.lineCap = 'round';
  [[-0.3, 0.3, 0.5], [0.1, 0.45, 0.4], [0.4, 0.2, 0.45], [-0.5, -0.1, 0.35]].forEach(([x, y, l]) => {
    c.lineWidth = r * 0.07;
    c.beginPath();
    c.moveTo(x * r, y * r);
    c.lineTo((x + l * 0.8) * r, (y - l * 0.3) * r);
    c.stroke();
  });
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, d = r * (0.2 + (i % 3) * 0.2);
    c.fillStyle = 'rgba(150,110,120,0.18)';
    c.beginPath();
    c.arc(Math.cos(a) * d, -r * 0.3 + Math.sin(a) * d * 0.5, r * 0.12, 0, TAU);
    c.fill();
  }
  c.restore();
  shade(c, r, 0.55);
  return { canvas, half };
}

const CUSTOM = { triton: renderTriton };

/** Le dessin d'un astre décrit dans un niveau (voir l'en-tête du fichier) */
export function renderBody(def, r) {
  if (def.paint) return renderPainted(def.paint, r, hashString(def.id));
  if (CUSTOM[def.id]) return CUSTOM[def.id](r);
  return renderArt(def.art || def.id, r);
}
