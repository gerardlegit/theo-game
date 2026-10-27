// ============================================================================
// Physique du déplacement, commune à toutes les créatures : accélération
// limitée (inertie), glisse quand on lâche (friction du milieu), diagonales
// pas plus rapides, rotation lissée vers la direction de nage.
// ============================================================================

const TAU = Math.PI * 2;

/**
 * body : { x, y, vx, vy }
 * dir  : intention de déplacement, longueur 0..1 (analogique)
 * p    : { maxSpeed, accel, friction } — friction = part de la vitesse perdue
 *        en 1 s quand on ne pousse plus (eau ≈ 0,6 : on glisse ; terre ≈ 0,97)
 */
export function steerBody(body, dir, p, dt) {
  const len = Math.hypot(dir.x, dir.y);
  if (len > 0.001) {
    const mag = Math.min(1, len);
    // vitesse visée proportionnelle à l'inclinaison du joystick
    const tx = dir.x / len * mag * p.maxSpeed;
    const ty = dir.y / len * mag * p.maxSpeed;
    let dvx = tx - body.vx;
    let dvy = ty - body.vy;
    const dv = Math.hypot(dvx, dvy);
    const maxDv = p.accel * dt;
    if (dv > maxDv) { dvx *= maxDv / dv; dvy *= maxDv / dv; }
    body.vx += dvx;
    body.vy += dvy;
  } else {
    const keep = Math.pow(1 - p.friction, dt);
    body.vx *= keep;
    body.vy *= keep;
    if (Math.hypot(body.vx, body.vy) < 1) body.vx = body.vy = 0;
  }
  body.x += body.vx * dt;
  body.y += body.vy * dt;
}

/* Garde un corps de rayon r dans l'arène (il s'arrête contre le bord) */
export function clampToArena(body, r, arena) {
  if (body.x < r) { body.x = r; if (body.vx < 0) body.vx = 0; }
  if (body.x > arena.w - r) { body.x = arena.w - r; if (body.vx > 0) body.vx = 0; }
  if (body.y < r) { body.y = r; if (body.vy < 0) body.vy = 0; }
  if (body.y > arena.h - r) { body.y = arena.h - r; if (body.vy > 0) body.vy = 0; }
}

/* Écart d'angle le plus court, dans ]-π, π] */
export function angleDiff(from, to) {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
}

/* Tourne l'angle vers la cible d'au plus rate × dt radians */
export function turnToward(angle, target, rate, dt) {
  const d = angleDiff(angle, target);
  const max = rate * dt;
  return angle + Math.max(-max, Math.min(max, d));
}
