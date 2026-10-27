// ============================================================================
// Dessin procédural d'une cellule : membrane qui ondule, contour épais et
// deux grands yeux expressifs qui regardent où l'on nage (et clignent).
// ============================================================================

const TAU = Math.PI * 2;
const POINTS = 18;

/**
 * x, y, r : position et rayon (unités du monde) · angle : direction de nage
 * t : temps en s (pour l'ondulation et le clignement) · seed : décale l'animation
 */
export function drawCell(ctx, x, y, r, angle, t, { fill, edge, seed = 0, squash = 0 }) {
  // membrane : un cercle déformé par deux ondes lentes
  ctx.beginPath();
  for (let i = 0; i <= POINTS; i++) {
    const a = (i / POINTS) * TAU;
    const wobble = 1
      + 0.05 * Math.sin(a * 3 + t * 2.6 + seed)
      + 0.03 * Math.sin(a * 5 - t * 3.4 + seed * 2);
    // un peu étirée dans le sens de la nage quand on fonce
    const along = Math.cos(a - angle);
    const rr = r * wobble * (1 + squash * 0.18 * along * along - squash * 0.08);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.strokeStyle = edge;
  ctx.stroke();

  // reflet
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.16, -0.6, 0, TAU);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();

  // yeux, tournés vers l'avant
  const blink = ((t + seed * 1.7) % 4.2) < 0.12 ? 0.15 : 1;
  const fx = Math.cos(angle);
  const fy = Math.sin(angle);
  for (const side of [-1, 1]) {
    const ex = x + fx * r * 0.38 - fy * side * r * 0.3;
    const ey = y + fy * r * 0.38 + fx * side * r * 0.3;
    const er = r * 0.24;
    ctx.beginPath();
    ctx.ellipse(ex, ey, er, er * blink, 0, 0, TAU);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.strokeStyle = '#1F2A44';
    ctx.stroke();
    if (blink === 1) {
      ctx.beginPath();
      ctx.arc(ex + fx * er * 0.35, ey + fy * er * 0.35, er * 0.5, 0, TAU);
      ctx.fillStyle = '#1F2A44';
      ctx.fill();
    }
  }
}
