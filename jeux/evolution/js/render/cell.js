// ============================================================================
// Dessin procédural d'une cellule : membrane qui ondule, contour épais,
// noyau éventuel et deux grands yeux expressifs qui regardent où l'on nage
// (et clignent de temps en temps).
// ============================================================================

const TAU = Math.PI * 2;
const POINTS = 18;
const INK = '#1F2A44';

/**
 * x, y, r : position et rayon (unités du monde) · angle : direction de nage
 * t : temps en s (ondulation, clignement)
 * o : { fill, edge, seed, squash (étirement quand on fonce), wobble (amplitude
 *       de la membrane), nucleus (couleur du noyau), eyeColor (iris), lineScale }
 */
export function drawCell(ctx, x, y, r, angle, t, o) {
  const seed = o.seed || 0;
  const squash = o.squash || 0;
  const wob = o.wobble || 1;

  // membrane : un cercle déformé par deux ondes lentes
  ctx.beginPath();
  for (let i = 0; i <= POINTS; i++) {
    const a = (i / POINTS) * TAU;
    const wobble = 1
      + 0.05 * wob * Math.sin(a * 3 + t * 2.6 + seed)
      + 0.03 * wob * Math.sin(a * 5 - t * 3.4 + seed * 2);
    // un peu étirée dans le sens de la nage quand on fonce
    const along = Math.cos(a - angle);
    const rr = r * wobble * (1 + squash * 0.18 * along * along - squash * 0.08);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = o.fill;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.14 * (o.lineScale || 1));
  ctx.strokeStyle = o.edge;
  ctx.stroke();

  const fx = Math.cos(angle);
  const fy = Math.sin(angle);

  // noyau, un peu en arrière
  if (o.nucleus) {
    ctx.beginPath();
    ctx.arc(x - fx * r * 0.32, y - fy * r * 0.32, r * 0.34, 0, TAU);
    ctx.fillStyle = o.nucleus;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - fx * r * 0.38, y - fy * r * 0.38, r * 0.12, 0, TAU);
    ctx.fillStyle = 'rgba(31, 42, 68, 0.35)';
    ctx.fill();
  }

  // reflet
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.42, r * 0.26, r * 0.15, -0.6, 0, TAU);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();

  drawEyes(ctx, x, y, r, fx, fy, t, seed, o.eyeColor || INK);
}

/* Deux yeux tournés vers l'avant ; iris rouge quand un prédateur va attaquer */
export function drawEyes(ctx, x, y, r, fx, fy, t, seed, iris) {
  const blink = ((t + seed * 1.7) % 4.2) < 0.12 ? 0.15 : 1;
  for (const side of [-1, 1]) {
    const ex = x + fx * r * 0.38 - fy * side * r * 0.3;
    const ey = y + fy * r * 0.38 + fx * side * r * 0.3;
    const er = r * 0.24;
    ctx.beginPath();
    ctx.ellipse(ex, ey, er, er * blink, 0, 0, TAU);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.strokeStyle = INK;
    ctx.stroke();
    if (blink === 1) {
      ctx.beginPath();
      ctx.arc(ex + fx * er * 0.35, ey + fy * er * 0.35, er * 0.5, 0, TAU);
      ctx.fillStyle = iris;
      ctx.fill();
    }
  }
}
