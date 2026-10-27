// ============================================================================
// Dessin des créatures (molécules, bactéries, amibes) avec le code couleur
// constant du jeu : contour vert = mangeable, blanc = neutre, rouge =
// dangereux. Pour les daltoniens, un symbole s'ajoute au-dessus des
// créatures : petite fourchette = mangeable, point d'exclamation = danger.
// ============================================================================

import { drawCell } from './cell.js';

const TAU = Math.PI * 2;
export const OUTLINE = { edible: '#5BE37D', neutral: '#FFFFFF', danger: '#FF5A5A' };

/* markMin : taille minimale du symbole en unités du monde (pour rester lisible à l'écran) */
export function drawCreature(ctx, c, x, y, angle, rel, t, markMin = 5) {
  const edge = OUTLINE[rel];
  switch (c.def.sprite) {
    case 'molecule': drawMolecule(ctx, x, y, c.size, angle, c.def.color, edge); break;
    case 'bacterium': drawBacterium(ctx, x, y, c.size, angle, c.def.color, edge, t + c.seed); break;
    default:
      drawCell(ctx, x, y, c.size, angle, t, {
        fill: c.def.color,
        edge,
        seed: c.seed,
        wobble: 2.2,
        lineScale: 0.8,
        eyeColor: c.state === 'aim' || c.state === 'chase' ? '#E0201B' : '#1F2A44',
      });
  }
  if (c.def.kind === 'creature' && rel !== 'neutral') {
    const s = Math.max(markMin, c.size * 0.32);
    drawMark(ctx, x, y - c.size * 1.1 - s, rel, s);
  }
}

/* Petite molécule : trois atomes collés */
function drawMolecule(ctx, x, y, r, angle, color, edge) {
  const atoms = [[0, 0, 0.62], [0.55, 0.42, 0.42], [-0.55, 0.42, 0.42]];
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  ctx.lineWidth = Math.max(1, r * 0.22);
  ctx.strokeStyle = edge;
  for (const [ax, ay, ar] of atoms) {
    ctx.beginPath();
    ctx.arc(x + (ax * ca - ay * sa) * r, y + (ax * sa + ay * ca) * r, ar * r, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (const [ax, ay, ar] of atoms) {
    ctx.beginPath();
    ctx.arc(x + (ax * ca - ay * sa) * r, y + (ax * sa + ay * ca) * r, ar * r, 0, TAU);
    ctx.fill();
  }
}

/* Bactérie : une gélule avec un petit flagelle qui ondule */
function drawBacterium(ctx, x, y, r, angle, color, edge, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // flagelle
  ctx.beginPath();
  ctx.moveTo(-r * 1.1, 0);
  for (let i = 1; i <= 6; i++) {
    ctx.lineTo(-r * 1.1 - i * r * 0.28, Math.sin(t * 9 + i) * r * 0.25);
  }
  ctx.lineWidth = Math.max(0.8, r * 0.14);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.stroke();
  // corps
  const w = r * 1.15;
  const h = r * 0.62;
  ctx.beginPath();
  ctx.moveTo(-w + h, -h);
  ctx.lineTo(w - h, -h);
  ctx.arc(w - h, 0, h, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-w + h, h);
  ctx.arc(-w + h, 0, h, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.2);
  ctx.strokeStyle = edge;
  ctx.stroke();
  ctx.restore();
}

/* Symbole au-dessus d'une créature : fourchette (mangeable) ou « ! » (danger) */
export function drawMark(ctx, x, y, rel, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, TAU);
  ctx.fillStyle = rel === 'danger' ? '#FF5A5A' : '#3FBF62';
  ctx.fill();
  ctx.lineWidth = s * 0.18;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  if (rel === 'danger') {
    ctx.lineWidth = s * 0.26;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(0, s * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, s * 0.48, s * 0.14, 0, TAU);
    ctx.fill();
  } else {
    // fourchette : trois dents et un manche
    ctx.lineWidth = s * 0.14;
    ctx.beginPath();
    for (const dx of [-0.3, 0, 0.3]) {
      ctx.moveTo(dx * s, -s * 0.6);
      ctx.lineTo(dx * s, -s * 0.15);
    }
    ctx.moveTo(-s * 0.3, -s * 0.15);
    ctx.quadraticCurveTo(0, s * 0.1, s * 0.3, -s * 0.15);
    ctx.moveTo(0, -s * 0.05);
    ctx.lineTo(0, s * 0.62);
    ctx.stroke();
  }
  ctx.restore();
}
