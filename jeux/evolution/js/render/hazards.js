// ============================================================================
// Dessin des dangers : cheminées hydrothermales entourées d'eau trop chaude
// (zone rouge qui pulse lentement, avec un « ! ») et courants (bande où des
// flèches avancent dans le sens du courant).
// ============================================================================

import { drawMark } from './creatures.js';

const TAU = Math.PI * 2;

export function drawHazards(ctx, hazards, t, rect) {
  for (const h of hazards) {
    if (h.type === 'current') drawCurrent(ctx, h, t, rect);
  }
  for (const h of hazards) {
    if (h.type === 'heat' && h.x + h.r > rect.x0 && h.x - h.r < rect.x1 && h.y + h.r > rect.y0 && h.y - h.r < rect.y1) {
      drawHeat(ctx, h, t);
    }
  }
}

function drawHeat(ctx, h, t) {
  // pulsation à 1 Hz (jamais plus de 3 Hz)
  const pulse = 0.5 + 0.5 * Math.sin(t * TAU);
  const g = ctx.createRadialGradient(h.x, h.y, h.r * 0.15, h.x, h.y, h.r);
  g.addColorStop(0, `rgba(255, 110, 70, ${0.55 + pulse * 0.15})`);
  g.addColorStop(0.75, `rgba(255, 80, 60, ${0.25 + pulse * 0.1})`);
  g.addColorStop(1, 'rgba(255, 80, 60, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r, 0, TAU);
  ctx.fill();
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = `rgba(255, 120, 90, ${0.5 + pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r * 0.92, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  // cheminée : un petit volcan de roche sombre qui fume
  const s = h.r * 0.28;
  ctx.beginPath();
  ctx.moveTo(h.x - s, h.y + s * 0.7);
  ctx.lineTo(h.x - s * 0.35, h.y - s * 0.6);
  ctx.lineTo(h.x + s * 0.35, h.y - s * 0.6);
  ctx.lineTo(h.x + s, h.y + s * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#3B2F3A';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1F1820';
  ctx.stroke();
  // bulles qui montent
  ctx.fillStyle = 'rgba(255, 230, 220, 0.6)';
  for (let i = 0; i < 4; i++) {
    const k = (t * 0.5 + i / 4) % 1;
    ctx.beginPath();
    ctx.arc(h.x + Math.sin(i * 2.3 + t * 2) * s * 0.4, h.y - s * 0.6 - k * h.r * 0.6, 2 + i % 2 * 1.5, 0, TAU);
    ctx.fill();
  }
  drawMark(ctx, h.x, h.y - h.r * 0.68, 'danger', 9);
}

function drawCurrent(ctx, h, t, rect) {
  if (h.x > rect.x1 || h.x + h.w < rect.x0 || h.y > rect.y1 || h.y + h.h < rect.y0) return;
  ctx.fillStyle = 'rgba(190, 240, 255, 0.08)';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(h.x, h.y, h.w, h.h);
  ctx.clip();
  const gap = 90;
  const shift = (t * h.speed) % gap;
  const ang = Math.atan2(h.dy, h.dx);
  ctx.strokeStyle = 'rgba(220, 250, 255, 0.35)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // chevrons alignés sur une grille qui glisse dans le sens du courant
  for (let gx = -gap; gx < h.w + gap; gx += gap) {
    for (let gy = gap / 2; gy < h.h; gy += gap) {
      const along = gx + shift;
      const x = h.x + (h.dx ? along : gy + ((gx / gap) % 2) * 20);
      const y = h.y + (h.dx ? gy + ((gx / gap) % 2) * 20 : along);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(4, 0);
      ctx.lineTo(-10, 12);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}
