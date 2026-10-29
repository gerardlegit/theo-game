// ============================================================================
// Tous les dessins du jeu, faits en code (aucune image) : le joueur et ses
// évolutions (queue, yeux, nageoires, mâchoires…), les créatures de chaque
// époque, le décor du fond marin, les reflets de lumière, et Ammo le guide.
// Les corps allongés suivent une « colonne » de points (spine) : ils ondulent
// tout seuls quand la créature tourne.
// ============================================================================

const TAU = Math.PI * 2;
export const INK = '#1E2A3A';

/* ---------- Registres : d'autres fichiers (art-terre.js…) y ajoutent leurs dessins ---------- */
export const LOOKS = {};           // look d'une espèce → fonction (ctx, c, t)
export const FORMS = {};           // forme du joueur → fonction (ctx, p, parts, t, mood)
export const DECORS = {};          // type de décor posé au sol → fonction (ctx, d, t)
export const COVERS = {};          // type de cachette dessinée par-dessus les créatures → fonction (ctx, d, t)
export const FRAMES = {};          // cadrage des vignettes : look ou forme → { r, x, y } (en part de la taille)
export const FORM_SPINE = { cellule: null, ver: 'ver', poisson: 'poisson' };   // forme du joueur → colonne
export const SNOUT = {};           // (vue de dessus) look ou forme → où est la gueule, devant la tête (× taille)

/* ---------- Couleurs ---------- */
const shadeCache = new Map();
/** Éclaircit (k > 0) ou assombrit (k < 0) une couleur #RRGGBB */
export function shade(hex, k) {
  let byK = shadeCache.get(hex);
  if (!byK) { byK = new Map(); shadeCache.set(hex, byK); }
  let out = byK.get(k);
  if (out) return out;
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  out = `rgb(${r | 0},${g | 0},${b | 0})`;
  byK.set(k, out);
  return out;
}

export const mix = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });

/* Hasard reproductible (pour que le décor soit toujours dessiné pareil) */
export function seeded(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Corps allongés ---------- */
/** Contour lisse autour d'une colonne de points (de la tête à la queue).
    widths[i] = demi-largeur au point i ; nose = avancée du museau. */
export function spineShape(pts, widths, nose = 0.9) {
  const n = pts.length;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = a.x - b.x, dy = a.y - b.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    L.push({ x: pts[i].x - dy * widths[i], y: pts[i].y + dx * widths[i] });
    R.push({ x: pts[i].x + dy * widths[i], y: pts[i].y - dx * widths[i] });
  }
  const h = pts[0], h2 = pts[1];
  const hd = Math.hypot(h.x - h2.x, h.y - h2.y) || 1;
  const front = { x: h.x + (h.x - h2.x) / hd * widths[0] * nose, y: h.y + (h.y - h2.y) / hd * widths[0] * nose };
  const t = pts[n - 1], t2 = pts[n - 2];
  const td = Math.hypot(t.x - t2.x, t.y - t2.y) || 1;
  const back = { x: t.x + (t.x - t2.x) / td * widths[n - 1] * 0.8, y: t.y + (t.y - t2.y) / td * widths[n - 1] * 0.8 };
  return [front, ...L, back, ...R.reverse()];
}

export function smoothClosed(ctx, poly) {
  const n = poly.length;
  ctx.beginPath();
  const m0 = mix(poly[n - 1], poly[0], 0.5);
  ctx.moveTo(m0.x, m0.y);
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n];
    const m = mix(p, q, 0.5);
    ctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
  }
  ctx.closePath();
}

/** Direction (unitaire) du segment i de la colonne, vers la tête */
export function segDir(pts, i) {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
  const dx = a.x - b.x, dy = a.y - b.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

/* ---------- Ombre, yeux, bouche ---------- */
export function shadow(ctx, x, y, rx, ry, a = 0) {
  ctx.fillStyle = 'rgba(0, 25, 35, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, a, 0, TAU);
  ctx.fill();
}

/**
 * Un œil vu de dessus. mood : 'calm' | 'angry' | 'scared' | 'happy'.
 * (lx, ly) = direction du regard ; blink : 0 ouvert → 1 fermé
 */
export function eye(ctx, x, y, r, lx, ly, mood, blink, side, iris = INK) {
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.8, r * 0.22);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * (1 - blink * 0.9), 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (blink < 0.6) {
    const pr = r * (mood === 'scared' ? 0.36 : 0.55);
    const px = x + lx * r * 0.32, py = y + ly * r * 0.32;
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(px - pr * 0.35, py - pr * 0.35, pr * 0.35, 0, TAU);
    ctx.fill();
  }
  // sourcils : ils disent tout de l'humeur. Vu de dessus, « au-dessus de l'œil » = vers l'avant.
  if (mood === 'angry' || mood === 'scared') {
    const nx = -ly * side, ny = lx * side;      // vers l'extérieur de la tête
    const tilt = mood === 'angry' ? 1 : -1;     // fâché : le bout intérieur descend
    const cx = x + lx * r * 1.25, cy = y + ly * r * 1.25;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, r * 0.38);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - nx * r * 0.85 - lx * r * 0.4 * tilt, cy - ny * r * 0.85 - ly * r * 0.4 * tilt);
    ctx.lineTo(cx + nx * r * 0.85 + lx * r * 0.4 * tilt, cy + ny * r * 0.85 + ly * r * 0.4 * tilt);
    ctx.stroke();
  }
}

/** Deux yeux sur la tête : fwd = avancée, spread = écart, r = rayon (tout en × size) */
export function eyes(ctx, x, y, ang, size, fwd, spread, r, mood, blink, iris) {
  const fx = Math.cos(ang), fy = Math.sin(ang);
  for (const side of [-1, 1]) {
    const ex = x + fx * size * fwd - fy * size * spread * side;
    const ey = y + fy * size * fwd + fx * size * spread * side;
    eye(ctx, ex, ey, size * r, fx, fy, mood, blink, side, iris);
  }
}

/** Petite goutte de sueur d'une proie qui a peur */
export function drawSweat(ctx, x, y, s, t) {
  const bob = Math.sin(t * 8) * s * 0.15;
  ctx.fillStyle = '#9EE7FF';
  ctx.strokeStyle = '#2B7FAF';
  ctx.lineWidth = Math.max(1, s * 0.12);
  ctx.beginPath();
  ctx.moveTo(x, y - s + bob);
  ctx.quadraticCurveTo(x + s * 0.7, y + bob, x, y + s * 0.6 + bob);
  ctx.quadraticCurveTo(x - s * 0.7, y + bob, x, y - s + bob);
  ctx.fill();
  ctx.stroke();
}

/** Bulle « ! » (repéré !) ou « ? » (perdu de vue) au-dessus d'un chasseur */
export function drawAlert(ctx, x, y, s, mark, pop = 1) {
  const r = s * pop;
  ctx.fillStyle = mark === '!' ? '#FF4D5E' : '#FFFFFF';
  ctx.strokeStyle = mark === '!' ? '#FFFFFF' : INK;
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mark === '!' ? '#FFFFFF' : INK;
  ctx.font = `800 ${Math.round(r * 1.5)}px 'Baloo 2', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mark, x, y + r * 0.08);
}

/** Bouche ouverte au bout du museau, avec ou sans dents */
export function mouth(ctx, x, y, ang, w, open, teeth, color = '#5A1F2E') {
  if (open <= 0.05) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.55 * open, w, 0, 0, TAU);
  ctx.fill();
  if (teeth === 'teeth' || teeth === 'small') {
    ctx.fillStyle = '#FFFFFF';
    const n = teeth === 'small' ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const yy = -w * 0.8 + (i / (n - 1)) * w * 1.6;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 * open, yy - w * 0.12);
      ctx.lineTo(w * 0.1 * open, yy);
      ctx.lineTo(w * 0.5 * open, yy + w * 0.12);
      ctx.fill();
    }
  } else if (teeth === 'blades') {
    ctx.fillStyle = '#E8E1D0';
    ctx.strokeStyle = INK;
    ctx.lineWidth = w * 0.08;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(w * 0.6, s * w * 0.15);
      ctx.lineTo(-w * 0.2, s * w * (0.25 + open * 0.55));
      ctx.lineTo(w * 0.6, s * w * (0.35 + open * 0.6));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ============================================================================
   Les créatures
   ============================================================================ */

/** Dessine une créature. c : { sp, x, y, angle, size, spine, t, mood, mouth, blink, seed } */
export function drawCreature(ctx, c, t) {
  if (LOOKS[c.sp.look]) return LOOKS[c.sp.look](ctx, c, t);
  switch (c.sp.look) {
    case 'molecule': return drawMolecule(ctx, c, t);
    case 'bacterie': return drawBacterie(ctx, c, t);
    case 'amibe': return drawAmibe(ctx, c, t);
    case 'plancton': return drawPlancton(ctx, c, t);
    case 'ver': return drawWorm(ctx, c, t, c.sp.color, {});
    case 'priapule': return drawWorm(ctx, c, t, c.sp.color, { spiky: true });
    case 'meduse': return drawMeduse(ctx, c, t);
    case 'trilobite': return drawTrilobite(ctx, c, t);
    case 'opabinia': return drawOpabinia(ctx, c, t);
    case 'anomalocaris': return drawAnomalocaris(ctx, c, t);
    case 'poisson': return drawFish(ctx, c, t, c.sp.color, c.sp.fish || {});
    case 'eurypteride': return drawEurypteride(ctx, c, t);
    case 'nautiloide': return drawNautiloide(ctx, c, t);
    default: return drawAmibe(ctx, c, t);
  }
}

function drawMolecule(ctx, c, t) {
  const r = c.size;
  const a = c.seed + t * 0.6;
  const atoms = [[0, 0, 0.62, '#F9E27D'], [0.75, 0.15, 0.42, '#FF9DBB'], [-0.45, 0.62, 0.42, '#9EE7FF'], [-0.4, -0.6, 0.36, '#C6F68D']];
  const pos = atoms.map(([x, y, s, col]) => ({
    x: c.x + (x * Math.cos(a) - y * Math.sin(a)) * r,
    y: c.y + (x * Math.sin(a) + y * Math.cos(a)) * r,
    s: s * r, col,
  }));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  for (let i = 1; i < pos.length; i++) { ctx.moveTo(pos[0].x, pos[0].y); ctx.lineTo(pos[i].x, pos[i].y); }
  ctx.stroke();
  for (const p of pos) {
    ctx.fillStyle = p.col;
    ctx.strokeStyle = shade(p.col, -0.45);
    ctx.lineWidth = Math.max(0.6, r * 0.1);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(p.x - p.s * 0.3, p.y - p.s * 0.3, p.s * 0.3, 0, TAU);
    ctx.fill();
  }
}

function drawBacterie(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.5, r * 1.1, r * 0.6, c.angle);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  // flagelle
  ctx.strokeStyle = shade(col, -0.35);
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  for (let i = 1; i <= 8; i++) ctx.lineTo(-r - i * r * 0.28, Math.sin(t * 14 + i * 0.9 + c.seed) * r * 0.3);
  ctx.stroke();
  // corps en gélule
  const w = r * 1.05, h = r * 0.62;
  ctx.fillStyle = col;
  ctx.strokeStyle = shade(col, -0.5);
  ctx.lineWidth = Math.max(0.8, r * 0.14);
  ctx.beginPath();
  ctx.moveTo(-w + h, -h);
  ctx.lineTo(w - h, -h);
  ctx.arc(w - h, 0, h, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-w + h, h);
  ctx.arc(-w + h, 0, h, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(col, -0.18);
  for (const [x, y] of [[-0.45, 0.1], [-0.1, -0.25], [-0.6, -0.25]]) {
    ctx.beginPath();
    ctx.arc(x * r, y * r, r * 0.12, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  eyes(ctx, c.x, c.y, c.angle, r, 0.55, 0.3, 0.22, c.mood, c.blink);
}

/** Une cellule molle avec des pseudopodes (amibes, cellules géantes) */
function drawAmibe(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  shadow(ctx, c.x + r * 0.25, c.y + r * 0.4, r * 1.05, r * 0.9);
  const N = 24;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const rel = a - c.angle;
    // un gros pseudopode vers l'avant et deux qui bougent
    const lobe = 0.16 * Math.max(0, Math.cos(rel)) ** 3
      + 0.12 * Math.sin(a * 3 + t * 1.7 + c.seed)
      + 0.07 * Math.sin(a * 5 - t * 2.3 + c.seed * 2);
    const rr = r * (1 + lobe);
    pts.push({ x: c.x + Math.cos(a) * rr, y: c.y + Math.sin(a) * rr });
  }
  const g = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.1, c.x, c.y, r * 1.2);
  g.addColorStop(0, shade(col, 0.45));
  g.addColorStop(1, col);
  ctx.fillStyle = g;
  smoothClosed(ctx, pts);
  ctx.fill();
  ctx.strokeStyle = shade(col, -0.45);
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.stroke();
  // noyau et petites bulles
  ctx.fillStyle = shade(col, -0.25);
  ctx.beginPath();
  ctx.arc(c.x - Math.cos(c.angle) * r * 0.35, c.y - Math.sin(c.angle) * r * 0.35, r * 0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(c.x - Math.cos(c.angle + 1) * r * 0.5, c.y - Math.sin(c.angle + 1) * r * 0.5, r * 0.1, 0, TAU);
  ctx.fill();
  if (c.mouth > 0.05) {
    mouth(ctx, c.x + Math.cos(c.angle) * r * 0.8, c.y + Math.sin(c.angle) * r * 0.8, c.angle, r * 0.45, c.mouth, null);
  }
  eyes(ctx, c.x, c.y, c.angle, r, 0.35, 0.3, 0.24, c.mood, c.blink);
}

function drawPlancton(ctx, c, t) {
  const r = c.size;
  const a = c.seed + t * 0.4;
  ctx.fillStyle = 'rgba(200, 255, 230, 0.75)';
  ctx.strokeStyle = '#3E9E7E';
  ctx.lineWidth = Math.max(0.6, r * 0.12);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const aa = a + (i / 6) * TAU;
    const x = c.x + Math.cos(aa) * r, y = c.y + Math.sin(aa) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(62, 158, 126, 0.55)';
  ctx.lineWidth = Math.max(0.5, r * 0.07);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const aa = a + (i / 6) * TAU;
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(aa) * r, c.y + Math.sin(aa) * r);
  }
  ctx.stroke();
  ctx.fillStyle = '#78D9A8';
  ctx.beginPath();
  ctx.arc(c.x, c.y, r * 0.35, 0, TAU);
  ctx.fill();
}

/** Vers : petits vers, vers chasseurs (spiky) et le joueur sous forme de ver */
function drawWorm(ctx, c, t, col, o) {
  const pts = c.spine;
  const r = c.size;
  const n = pts.length;
  const widths = pts.map((_, i) => r * (o.spiky ? 0.62 : 0.55) * (1 - (i / (n - 1)) * 0.55));
  widths[0] = r * (o.spiky ? 0.7 : 0.6);
  const head = pts[0];
  shadow(ctx, head.x + r * 0.3, head.y + r * 0.5, r * 0.9, r * 0.7);
  const shape = spineShape(pts, widths, 0.7);
  ctx.fillStyle = col;
  smoothClosed(ctx, shape);
  ctx.fill();
  ctx.strokeStyle = shade(col, -0.5);
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.stroke();
  // anneaux
  ctx.strokeStyle = shade(col, -0.22);
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.beginPath();
  for (let i = 1; i < n - 1; i++) {
    const d = segDir(pts, i), w = widths[i] * 0.9;
    ctx.moveTo(pts[i].x - d.y * w, pts[i].y + d.x * w);
    ctx.lineTo(pts[i].x + d.y * w, pts[i].y - d.x * w);
  }
  ctx.stroke();
  // reflet sur le dos
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[1].x, pts[1].y);
  for (let i = 2; i < n - 1; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  if (o.spiky) {
    // trompe ronde pleine de petites dents
    const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
    const mx = head.x + fx * r * 0.62, my = head.y + fy * r * 0.62;
    ctx.fillStyle = shade(col, -0.35);
    ctx.beginPath();
    ctx.arc(mx, my, r * (0.3 + c.mouth * 0.15), 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#FFF4D6';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const rr = r * (0.3 + c.mouth * 0.15);
      ctx.beginPath();
      ctx.moveTo(mx + Math.cos(a) * rr, my + Math.sin(a) * rr);
      ctx.lineTo(mx + Math.cos(a + 0.25) * rr * 0.45, my + Math.sin(a + 0.25) * rr * 0.45);
      ctx.lineTo(mx + Math.cos(a - 0.25) * rr * 0.45, my + Math.sin(a - 0.25) * rr * 0.45);
      ctx.fill();
    }
    eyes(ctx, head.x, head.y, c.angle, r, -0.05, 0.36, 0.2, c.mood, c.blink);
  } else if (!o.noFace) {
    eyes(ctx, head.x, head.y, c.angle, r, 0.2, 0.3, 0.2, c.mood, c.blink);
  }
}

function drawMeduse(ctx, c, t) {
  const r = c.size * (1 + Math.sin(t * 2.6 + c.seed) * 0.06);
  const col = c.sp.color;
  const ba = c.angle + Math.PI;
  // tentacules qui traînent derrière
  ctx.strokeStyle = 'rgba(246, 166, 255, 0.55)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const off = (i / 6 - 0.5) * 1.6;
    const sx = c.x + Math.cos(ba + off) * r * 0.75, sy = c.y + Math.sin(ba + off) * r * 0.75;
    ctx.lineWidth = Math.max(0.8, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let k = 1; k <= 6; k++) {
      const d = k * r * 0.32;
      const wig = Math.sin(t * 3 + k * 0.8 + i) * r * 0.12;
      ctx.lineTo(sx + Math.cos(ba) * d - Math.sin(ba) * wig, sy + Math.sin(ba) * d + Math.cos(ba) * wig);
    }
    ctx.stroke();
  }
  // ombrelle à bord festonné
  const pts = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TAU;
    pts.push({ x: c.x + Math.cos(a) * r * (1 + (i % 2 ? 0.06 : 0)), y: c.y + Math.sin(a) * r * (1 + (i % 2 ? 0.06 : 0)) });
  }
  const g = ctx.createRadialGradient(c.x, c.y, r * 0.1, c.x, c.y, r);
  g.addColorStop(0, 'rgba(255, 230, 255, 0.9)');
  g.addColorStop(1, 'rgba(246, 166, 255, 0.6)');
  ctx.fillStyle = g;
  smoothClosed(ctx, pts);
  ctx.fill();
  ctx.strokeStyle = shade(col, -0.35);
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.stroke();
  // les quatre « trèfles » au centre
  ctx.fillStyle = 'rgba(214, 102, 214, 0.45)';
  for (let i = 0; i < 4; i++) {
    const a = c.seed + (i / 4) * TAU;
    ctx.beginPath();
    ctx.ellipse(c.x + Math.cos(a) * r * 0.35, c.y + Math.sin(a) * r * 0.35, r * 0.2, r * 0.12, a, 0, TAU);
    ctx.fill();
  }
  // yeux endormis
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const ex = c.x + fx * r * 0.25 - fy * r * 0.28 * s, ey = c.y + fy * r * 0.25 + fx * r * 0.28 * s;
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.11, c.angle - Math.PI / 2 - 1, c.angle - Math.PI / 2 + 1, true);
    ctx.stroke();
  }
}

function drawTrilobite(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.5, r * 1.1, r * 0.75, c.angle);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  const dark = shade(col, -0.5);
  // petites pattes qui bougent
  ctx.strokeStyle = shade(col, -0.3);
  ctx.lineWidth = r * 0.06;
  for (let i = 0; i < 6; i++) {
    const x = -r * 0.7 + i * r * 0.22;
    const w = Math.sin(t * 10 + i) * r * 0.08;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, s * r * 0.55);
      ctx.lineTo(x + w, s * r * 0.82);
      ctx.stroke();
    }
  }
  // corps ovale
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, 0, r * 1.05, r * 0.68, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // tête (céphalon) avec ses pointes
  ctx.fillStyle = shade(col, 0.12);
  ctx.beginPath();
  ctx.moveTo(r * 0.25, -r * 0.72);
  ctx.quadraticCurveTo(r * 1.25, -r * 0.6, r * 1.1, 0);
  ctx.quadraticCurveTo(r * 1.25, r * 0.6, r * 0.25, r * 0.72);
  ctx.lineTo(-r * 0.25, r * 0.85);
  ctx.lineTo(r * 0.1, r * 0.45);
  ctx.lineTo(r * 0.1, -r * 0.45);
  ctx.lineTo(-r * 0.25, -r * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // segments du thorax
  ctx.strokeStyle = shade(col, -0.3);
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = r * 0.1 - i * r * 0.17;
    const h = r * 0.66 * Math.sqrt(1 - ((x + r * 0.1) / (r * 1.05)) ** 2);
    ctx.moveTo(x, -h);
    ctx.lineTo(x, h);
  }
  ctx.stroke();
  // lobe central (le « tri » de trilobite)
  ctx.fillStyle = shade(col, -0.18);
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, 0, r * 0.82, r * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.05, r * 0.6, r * 0.06, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  eyes(ctx, c.x, c.y, c.angle, r, 0.6, 0.38, 0.17, c.mood, c.blink);
}

function drawOpabinia(ctx, c, t) {
  const pts = c.spine;
  const r = c.size;
  const col = c.sp.color;
  const n = pts.length;
  const head = pts[0];
  shadow(ctx, head.x + r * 0.3, head.y + r * 0.5, r * 1.2, r * 0.6, c.angle);
  // nageoires latérales
  ctx.fillStyle = shade(col, 0.3);
  ctx.strokeStyle = shade(col, -0.4);
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  for (let i = 1; i < n; i++) {
    const d = segDir(pts, i);
    const flap = 0.5 + Math.sin(t * 6 - i) * 0.15;
    for (const s of [-1, 1]) {
      const bx = pts[i].x - d.y * r * 0.35 * s, by = pts[i].y + d.x * r * 0.35 * s;
      ctx.beginPath();
      ctx.ellipse(bx - d.y * r * 0.2 * s, by + d.x * r * 0.2 * s, r * 0.3, r * 0.17 * (1 + flap), Math.atan2(d.y, d.x), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  const widths = pts.map((_, i) => r * 0.38 * (1 - (i / (n - 1)) * 0.4));
  ctx.fillStyle = col;
  smoothClosed(ctx, spineShape(pts, widths, 0.8));
  ctx.fill();
  ctx.stroke();
  // trompe avec une pince au bout
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  const sway = Math.sin(t * 3 + c.seed) * 0.35;
  const ex = head.x + Math.cos(c.angle + sway) * r * 1.5, ey = head.y + Math.sin(c.angle + sway) * r * 1.5;
  ctx.strokeStyle = shade(col, -0.25);
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(head.x + fx * r * 0.3, head.y + fy * r * 0.3);
  ctx.quadraticCurveTo(head.x + fx * r, head.y + fy * r, ex, ey);
  ctx.stroke();
  ctx.lineWidth = r * 0.08;
  for (const s of [-1, 1]) {
    const a = c.angle + sway + s * 0.6;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + Math.cos(a) * r * 0.25, ey + Math.sin(a) * r * 0.25);
    ctx.stroke();
  }
  // cinq yeux sur des tiges (oui, cinq !)
  for (let i = 0; i < 5; i++) {
    const a = c.angle + (i - 2) * 0.55;
    const sx = head.x - fx * r * 0.05 + Math.cos(a) * r * 0.42, sy = head.y - fy * r * 0.05 + Math.sin(a) * r * 0.42;
    ctx.strokeStyle = shade(col, -0.3);
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    eye(ctx, sx, sy, r * 0.13, fx, fy, c.mood === 'scared' ? 'scared' : 'calm', c.blink, 0);
  }
}

function drawAnomalocaris(ctx, c, t) {
  const pts = c.spine;
  const r = c.size;
  const col = c.sp.color;
  const n = pts.length;
  const head = pts[0];
  shadow(ctx, head.x + r * 0.3, head.y + r * 0.5, r * 1.6, r * 0.8, c.angle);
  // éventail de la queue
  const tail = pts[n - 1], td = segDir(pts, n - 1);
  const ta = Math.atan2(-td.y, -td.x);
  ctx.fillStyle = shade(col, 0.25);
  ctx.strokeStyle = shade(col, -0.45);
  ctx.lineWidth = Math.max(1, r * 0.04);
  for (const s of [-1, -0.45, 0.45, 1]) {
    ctx.beginPath();
    ctx.ellipse(tail.x + Math.cos(ta + s * 0.5) * r * 0.35, tail.y + Math.sin(ta + s * 0.5) * r * 0.35, r * 0.38, r * 0.12, ta + s * 0.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // une frange de rabats fins sur les côtés, qui ondule comme une vague
  for (let i = 1; i < n - 1; i++) {
    const d = segDir(pts, i);
    const ang = Math.atan2(d.y, d.x);
    const wave = Math.sin(t * 7 - i * 0.9);
    const w = r * 0.32 * (1 - (i / (n - 1)) * 0.45);
    for (const s of [-1, 1]) {
      const out = w + r * (0.2 + wave * 0.05);
      const bx = pts[i].x - d.y * out * s, by = pts[i].y + d.x * out * s;
      ctx.fillStyle = shade(col, 0.15 + (i % 2) * 0.12);
      ctx.beginPath();
      ctx.ellipse(bx, by, r * 0.13, r * (0.24 + wave * 0.04), ang, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  const widths = pts.map((_, i) => r * 0.32 * (1 - (i / (n - 1)) * 0.45));
  widths[0] = r * 0.38;
  ctx.fillStyle = col;
  smoothClosed(ctx, spineShape(pts, widths, 0.7));
  ctx.fill();
  ctx.stroke();
  // rayures du dos
  ctx.strokeStyle = shade(col, -0.2);
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  for (let i = 1; i < n - 1; i++) {
    const d = segDir(pts, i), w = widths[i] * 0.85;
    ctx.moveTo(pts[i].x - d.y * w, pts[i].y + d.x * w);
    ctx.lineTo(pts[i].x + d.y * w, pts[i].y - d.x * w);
  }
  ctx.stroke();
  // deux grands bras pleins d'épines, qui attrapent quand il chasse
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  const grab = c.mouth;
  for (const s of [-1, 1]) {
    let ax = head.x + fx * r * 0.45 - fy * r * 0.18 * s, ay = head.y + fy * r * 0.45 + fx * r * 0.18 * s;
    let a = c.angle + s * (0.35 - grab * 0.25);
    ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const len = r * 0.2;
      const nx = ax + Math.cos(a) * len, ny = ay + Math.sin(a) * len;
      ctx.strokeStyle = shade(col, -0.35);
      ctx.lineWidth = r * (0.12 - k * 0.012);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      // épine vers l'intérieur
      ctx.strokeStyle = '#FFF0D0';
      ctx.lineWidth = r * 0.03;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + Math.cos(a - s * 1.4) * r * 0.1, ny + Math.sin(a - s * 1.4) * r * 0.1);
      ctx.stroke();
      ax = nx; ay = ny;
      a -= s * (0.32 + grab * 0.25);
    }
  }
  // yeux sur des tiges
  for (const s of [-1, 1]) {
    const sx = head.x + fx * r * 0.15 - fy * r * 0.62 * s, sy = head.y + fy * r * 0.15 + fx * r * 0.62 * s;
    ctx.strokeStyle = shade(col, -0.35);
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    eye(ctx, sx, sy, r * 0.16, fx, fy, c.mood, c.blink, s);
  }
}

/** Les poissons : sans mâchoire, osseux, requins, Dunkleosteus… et le joueur */
export function drawFish(ctx, c, t, col, f, extra = {}) {
  const pts = c.spine;
  const r = c.size;
  const n = pts.length;
  const head = pts[0];
  const dark = shade(col, -0.45);
  shadow(ctx, head.x + r * 0.35, head.y + r * 0.55, r * 1.5, r * 0.7, c.angle);
  // profil : grosse tête, corps qui s'affine vers la queue
  const prof = f.shark ? [0.5, 0.58, 0.52, 0.4, 0.27, 0.16] : [0.62, 0.66, 0.58, 0.45, 0.3, 0.17];
  const widths = pts.map((_, i) => r * prof[Math.min(prof.length - 1, Math.round((i / (n - 1)) * (prof.length - 1)))]);
  if (f.bigHead) { widths[0] *= 1.15; widths[1] *= 1.1; }
  // nageoire de queue
  const tail = pts[n - 1], td = segDir(pts, n - 1);
  const ta = Math.atan2(-td.y, -td.x);
  const tailSize = r * (extra.bigTail ? 0.8 : 0.6);
  const flap = Math.sin(t * 9 + c.seed) * 0.25;
  ctx.fillStyle = shade(col, 0.15);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.quadraticCurveTo(
    tail.x + Math.cos(ta + 0.9 + flap) * tailSize * 0.7, tail.y + Math.sin(ta + 0.9 + flap) * tailSize * 0.7,
    tail.x + Math.cos(ta + 0.55 + flap) * tailSize * 1.3, tail.y + Math.sin(ta + 0.55 + flap) * tailSize * 1.3);
  ctx.quadraticCurveTo(
    tail.x + Math.cos(ta + flap) * tailSize * 0.55, tail.y + Math.sin(ta + flap) * tailSize * 0.55,
    tail.x + Math.cos(ta - 0.55 + flap) * tailSize * 1.3, tail.y + Math.sin(ta - 0.55 + flap) * tailSize * 1.3);
  ctx.quadraticCurveTo(
    tail.x + Math.cos(ta - 0.9 + flap) * tailSize * 0.7, tail.y + Math.sin(ta - 0.9 + flap) * tailSize * 0.7,
    tail.x, tail.y);
  ctx.fill();
  ctx.stroke();
  // nageoires pectorales
  if (f.fins) {
    const d = segDir(pts, 1);
    const fa = Math.atan2(d.y, d.x);
    const wob = Math.sin(t * 5 + c.seed) * 0.2;
    ctx.fillStyle = shade(col, 0.2);
    for (const s of [-1, 1]) {
      const bx = pts[1].x - d.y * widths[1] * 0.85 * s, by = pts[1].y + d.x * widths[1] * 0.85 * s;
      const a = fa + Math.PI + s * (2.2 + wob);
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(fa) * r * 0.15, by + Math.sin(fa) * r * 0.15);
      ctx.quadraticCurveTo(bx + Math.cos(a + s * 0.5) * r * 0.65, by + Math.sin(a + s * 0.5) * r * 0.65, bx + Math.cos(a) * r * 0.7, by + Math.sin(a) * r * 0.7);
      ctx.lineTo(bx - Math.cos(fa) * r * 0.2, by - Math.sin(fa) * r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  // corps
  const g = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
  g.addColorStop(0, shade(col, 0.15));
  g.addColorStop(1, col);
  ctx.fillStyle = g;
  smoothClosed(ctx, spineShape(pts, widths, f.shark ? 1.5 : 0.85));
  ctx.fill();
  ctx.stroke();
  // ligne du dos et taches
  ctx.strokeStyle = shade(col, -0.18);
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[1].x, pts[1].y);
  for (let i = 2; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  if (f.shark) {
    // aileron sur le dos
    const d = segDir(pts, 2);
    ctx.fillStyle = shade(col, -0.25);
    ctx.beginPath();
    ctx.moveTo(pts[2].x + d.x * r * 0.35, pts[2].y + d.y * r * 0.35);
    ctx.lineTo(pts[2].x - d.x * r * 0.55 - d.y * r * 0.1, pts[2].y - d.y * r * 0.55 + d.x * r * 0.1);
    ctx.lineTo(pts[2].x - d.x * r * 0.3, pts[2].y - d.y * r * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (!f.armor) {
    ctx.fillStyle = shade(col, -0.12);
    for (let i = 2; i < n - 1; i++) {
      const d = segDir(pts, i);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(pts[i].x - d.y * widths[i] * 0.5 * s, pts[i].y + d.x * widths[i] * 0.5 * s, r * 0.07, 0, TAU);
        ctx.fill();
      }
    }
  }
  // écailles (carapace du joueur)
  if (extra.scales) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = r * 0.04;
    for (let i = 1; i < n - 1; i++) {
      const d = segDir(pts, i), a = Math.atan2(d.y, d.x);
      for (const s of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.arc(pts[i].x - d.y * widths[i] * s, pts[i].y + d.x * widths[i] * s, widths[i] * 0.3, a + Math.PI / 2, a + Math.PI * 1.5);
        ctx.stroke();
      }
    }
  }
  // casque d'os (poissons cuirassés) ou armure de placoderme
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  if (f.helmet || f.armor) {
    const plate = f.armor ? shade(col, -0.2) : shade(col, 0.3);
    ctx.fillStyle = plate;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, r * 0.05);
    const hx = head.x - fx * r * 0.05, hy = head.y - fy * r * 0.05;
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * (f.armor ? 0.8 : 0.7), widths[0] * 1.05, c.angle, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // plaques et rivets
    ctx.beginPath();
    ctx.moveTo(hx - fy * widths[0], hy + fx * widths[0]);
    ctx.lineTo(hx + fy * widths[0], hy - fx * widths[0]);
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + fx * r * 0.7, hy + fy * r * 0.7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (const [a, d] of [[0.6, 0.4], [-0.6, 0.4], [2.2, 0.45], [-2.2, 0.45]]) {
      ctx.beginPath();
      ctx.arc(hx + Math.cos(c.angle + a) * r * d, hy + Math.sin(c.angle + a) * r * d, r * 0.05, 0, TAU);
      ctx.fill();
    }
    if (extra.gold) {
      ctx.strokeStyle = '#FFD24A';
      ctx.lineWidth = r * 0.05;
      ctx.beginPath();
      ctx.ellipse(hx, hy, r * 0.8, widths[0] * 1.05, c.angle, 0, TAU);
      ctx.stroke();
    }
  }
  // gueule
  const nose = f.shark ? 1.2 : 0.75;
  if (f.jaw && f.jaw !== 'none') {
    mouth(ctx, head.x + fx * r * nose * 0.85, head.y + fy * r * nose * 0.85, c.angle, widths[0] * 0.55, c.mouth, f.jaw);
  } else if (c.mouth > 0.1) {
    ctx.fillStyle = '#5A1F2E';
    ctx.beginPath();
    ctx.arc(head.x + fx * r * 0.62, head.y + fy * r * 0.62, r * 0.14 * c.mouth, 0, TAU);
    ctx.fill();
  }
  if (extra.noEyes) return;
  const eyeR = f.armor ? 0.12 : extra.bigEyes ? 0.2 : 0.15;
  const iris = f.armor && c.mood === 'angry' ? '#C0182B' : INK;
  eyes(ctx, head.x, head.y, c.angle, r, f.shark ? 0.3 : 0.2, f.armor ? 0.42 : 0.4, eyeR, c.mood, c.blink, iris);
}

function drawEurypteride(ctx, c, t) {
  const pts = c.spine;
  const r = c.size;
  const col = c.sp.color;
  const n = pts.length;
  const head = pts[0];
  const dark = shade(col, -0.45);
  shadow(ctx, head.x + r * 0.35, head.y + r * 0.55, r * 1.5, r * 0.7, c.angle);
  // telson (la pointe au bout de la queue)
  const tail = pts[n - 1], td = segDir(pts, n - 1);
  ctx.fillStyle = shade(col, -0.15);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(tail.x - td.y * r * 0.12, tail.y + td.x * r * 0.12);
  ctx.lineTo(tail.x - td.x * r * 0.75, tail.y - td.y * r * 0.75);
  ctx.lineTo(tail.x + td.y * r * 0.12, tail.y - td.x * r * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // grandes pattes en forme de rame
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  const row = Math.sin(t * 5 + c.seed) * 0.5;
  for (const s of [-1, 1]) {
    const bx = head.x - fx * r * 0.35 - fy * r * 0.4 * s, by = head.y - fy * r * 0.35 + fx * r * 0.4 * s;
    const a = c.angle + Math.PI + s * (1.0 + row);
    ctx.fillStyle = shade(col, 0.1);
    ctx.beginPath();
    ctx.ellipse(bx + Math.cos(a) * r * 0.45, by + Math.sin(a) * r * 0.45, r * 0.45, r * 0.2, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // petites pattes de marche
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.05;
    for (let k = 0; k < 3; k++) {
      const la = c.angle + s * (0.9 + k * 0.35) + Math.sin(t * 8 + k) * 0.1;
      ctx.beginPath();
      ctx.moveTo(head.x - fy * r * 0.25 * s, head.y + fx * r * 0.25 * s);
      ctx.lineTo(head.x + Math.cos(la) * r * 0.75, head.y + Math.sin(la) * r * 0.75);
      ctx.stroke();
    }
  }
  // abdomen en segments
  const widths = pts.map((_, i) => r * 0.5 * (1 - (i / (n - 1)) * 0.6));
  widths[0] = r * 0.58;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.045);
  smoothClosed(ctx, spineShape(pts, widths, 0.5));
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = shade(col, -0.25);
  ctx.beginPath();
  for (let i = 1; i < n; i++) {
    const d = segDir(pts, i), w = widths[i] * 0.95;
    ctx.moveTo(pts[i].x - d.y * w, pts[i].y + d.x * w);
    ctx.lineTo(pts[i].x + d.y * w, pts[i].y - d.x * w);
  }
  ctx.stroke();
  // la tête (prosoma), bouclier arrondi
  ctx.fillStyle = shade(col, 0.12);
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.ellipse(head.x + fx * r * 0.1, head.y + fy * r * 0.1, r * 0.55, r * 0.62, c.angle, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // pinces devant
  const pinch = 0.25 + c.mouth * 0.45;
  for (const s of [-1, 1]) {
    const bx = head.x + fx * r * 0.55 - fy * r * 0.18 * s, by = head.y + fy * r * 0.55 + fx * r * 0.18 * s;
    const a = c.angle + s * 0.25;
    const ex = bx + Math.cos(a) * r * 0.55, ey = by + Math.sin(a) * r * 0.55;
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.lineWidth = r * 0.07;
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + Math.cos(a + k * pinch) * r * 0.32, ey + Math.sin(a + k * pinch) * r * 0.32);
      ctx.stroke();
    }
  }
  eyes(ctx, head.x, head.y, c.angle, r, 0.25, 0.32, 0.14, c.mood, c.blink);
}

function drawNautiloide(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  shadow(ctx, c.x - fx * r * 1.2 + r * 0.35, c.y - fy * r * 1.2 + r * 0.55, r * 2, r * 0.6, c.angle);
  // tentacules devant
  ctx.strokeStyle = '#D9806A';
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const off = (i / 7 - 0.5) * 1.2;
    const sx = c.x + Math.cos(c.angle + off) * r * 0.4, sy = c.y + Math.sin(c.angle + off) * r * 0.4;
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    const len = r * (0.7 + c.mouth * 0.4);
    for (let k = 1; k <= 5; k++) {
      const d = (k / 5) * len;
      const wig = Math.sin(t * 4 + k + i * 1.3) * r * 0.08;
      const a = c.angle + off * (1 - c.mouth * 0.6);
      ctx.lineTo(sx + Math.cos(a) * d - Math.sin(a) * wig, sy + Math.sin(a) * d + Math.cos(a) * wig);
    }
    ctx.stroke();
  }
  // longue coquille pointue, rayée
  const bx = c.x - fx * r * 0.3, by = c.y - fy * r * 0.3;
  const tipx = c.x - fx * r * 3.4, tipy = c.y - fy * r * 3.4;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bx - fy * r * 0.5, by + fx * r * 0.5);
  ctx.quadraticCurveTo(c.x - fx * r * 2 - fy * r * 0.35, c.y - fy * r * 2 + fx * r * 0.35, tipx, tipy);
  ctx.quadraticCurveTo(c.x - fx * r * 2 + fy * r * 0.35, c.y - fy * r * 2 - fx * r * 0.35, bx + fy * r * 0.5, by - fx * r * 0.5);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = '#B5651D';
  ctx.lineWidth = r * 0.16;
  for (let i = 0; i < 7; i++) {
    const k = 0.15 + i * 0.45;
    const px = c.x - fx * r * (0.3 + k), py = c.y - fy * r * (0.3 + k);
    ctx.beginPath();
    ctx.moveTo(px - fy * r * 0.6 + fx * r * 0.15, py + fx * r * 0.6 + fy * r * 0.15);
    ctx.lineTo(px, py);
    ctx.lineTo(px + fy * r * 0.6 + fx * r * 0.15, py - fx * r * 0.6 + fy * r * 0.15);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = shade(col, -0.55);
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(bx - fy * r * 0.5, by + fx * r * 0.5);
  ctx.quadraticCurveTo(c.x - fx * r * 2 - fy * r * 0.35, c.y - fy * r * 2 + fx * r * 0.35, tipx, tipy);
  ctx.quadraticCurveTo(c.x - fx * r * 2 + fy * r * 0.35, c.y - fy * r * 2 - fx * r * 0.35, bx + fy * r * 0.5, by - fx * r * 0.5);
  ctx.stroke();
  // tête molle
  ctx.fillStyle = '#E99A7E';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, r * 0.5, r * 0.55, c.angle, 0, TAU);
  ctx.fill();
  ctx.stroke();
  eyes(ctx, c.x, c.y, c.angle, r, 0.05, 0.4, 0.17, c.mood, c.blink);
}

/* ============================================================================
   Le joueur
   ============================================================================ */
export const PLAYER = { body: '#6EE0B0', belly: '#B9F5DA', dark: '#1F6B5A', cheek: 'rgba(255, 120, 150, 0.55)' };

/**
 * p : { x, y, angle, size, spine, mouth, mood, blink, speed (0..1) }
 * form : 'cellule' | 'ver' | 'poisson' ; parts : objet { queue: true, yeux: true… }
 */
export function drawPlayer(ctx, p, form, parts, t) {
  const r = p.size;
  // halo pour toujours bien se voir
  const halo = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r * 2.6);
  halo.addColorStop(0, 'rgba(220, 255, 240, 0.28)');
  halo.addColorStop(1, 'rgba(220, 255, 240, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 2.6, 0, TAU);
  ctx.fill();

  const mood = p.mood || 'happy';
  if (FORMS[form]) FORMS[form](ctx, p, parts, t, mood);
  else if (form === 'cellule') drawPlayerCell(ctx, p, parts, t, mood);
  else if (form === 'ver') drawPlayerWorm(ctx, p, parts, t, mood);
  else drawPlayerFish(ctx, p, parts, t, mood);
}

function drawPlayerCell(ctx, p, parts, t, mood) {
  const r = p.size;
  const fx = Math.cos(p.angle), fy = Math.sin(p.angle);
  shadow(ctx, p.x + r * 0.25, p.y + r * 0.4, r * 1.05, r * 0.9);
  if (parts.queue) {
    // le flagelle fouette plus vite quand on nage vite
    const ba = p.angle + Math.PI;
    ctx.strokeStyle = PLAYER.dark;
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const sx = p.x + Math.cos(ba) * r * 0.9, sy = p.y + Math.sin(ba) * r * 0.9;
    ctx.moveTo(sx, sy);
    for (let i = 1; i <= 10; i++) {
      const d = i * r * 0.2;
      const w = Math.sin(t * (10 + p.speed * 14) - i * 0.8) * r * 0.25 * (i / 10);
      ctx.lineTo(sx + Math.cos(ba) * d - Math.sin(ba) * w, sy + Math.sin(ba) * d + Math.cos(ba) * w);
    }
    ctx.stroke();
  }
  const pts = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    const along = Math.cos(a - p.angle);
    const rr = r * (1 + 0.05 * Math.sin(a * 3 + t * 2.4) + p.speed * 0.12 * along * along - p.speed * 0.05);
    pts.push({ x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr });
  }
  const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, r * 0.1, p.x, p.y, r * 1.1);
  g.addColorStop(0, PLAYER.belly);
  g.addColorStop(1, PLAYER.body);
  ctx.fillStyle = g;
  smoothClosed(ctx, pts);
  ctx.fill();
  ctx.strokeStyle = PLAYER.dark;
  ctx.lineWidth = Math.max(1.2, r * 0.12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(31, 107, 90, 0.35)';
  ctx.beginPath();
  ctx.arc(p.x - fx * r * 0.4, p.y - fy * r * 0.4, r * 0.28, 0, TAU);
  ctx.fill();
  faceFront(ctx, p, r, parts, mood, 0.32, 0.3);
}

function drawPlayerWorm(ctx, p, parts, t, mood) {
  const pts = p.spine;
  const r = p.size;
  const n = pts.length;
  if (parts.queue) {
    // une palette de queue au bout
    const tail = pts[n - 1], td = segDir(pts, n - 1);
    const ta = Math.atan2(-td.y, -td.x) + Math.sin(t * 8) * 0.3;
    ctx.fillStyle = PLAYER.belly;
    ctx.strokeStyle = PLAYER.dark;
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    ctx.ellipse(tail.x + Math.cos(ta) * r * 0.45, tail.y + Math.sin(ta) * r * 0.45, r * 0.5, r * 0.28, ta, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  drawWorm(ctx, { ...p, mood, mouth: 0, sp: {} }, t, PLAYER.body, { noFace: true });
  if (parts.carapace) {
    // plaques dorées sur le dos
    for (let i = 1; i < n - 1; i++) {
      const d = segDir(pts, i);
      const w = r * 0.5 * (1 - (i / (n - 1)) * 0.55);
      ctx.fillStyle = i % 2 ? '#E6B85C' : '#D9A441';
      ctx.strokeStyle = '#8A5A1E';
      ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.beginPath();
      ctx.ellipse(pts[i].x, pts[i].y, w * 0.55, w * 0.95, Math.atan2(d.y, d.x), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  faceFront(ctx, { ...p, x: pts[0].x, y: pts[0].y }, r * 0.85, parts, mood, 0.3, 0.38);
}

function drawPlayerFish(ctx, p, parts, t, mood) {
  const f = {
    jaw: parts['machoire-geante'] ? 'blades' : parts.machoires ? 'teeth' : 'none',
    fins: !!parts.nageoires,
    armor: !!parts.cuirasse,
    bigHead: !!parts['machoire-geante'],
  };
  const fake = { ...p, sp: {}, seed: 0, mood, iris: INK };
  drawFish(ctx, fake, t, PLAYER.body, f, { scales: !!parts.carapace, bigTail: !!parts.queue, bigEyes: !!parts.yeux, noEyes: !parts.yeux, gold: !!parts.cuirasse });
  if (!parts.yeux) {
    // pas encore d'yeux : deux petites taches sensibles à la lumière (dessinées par-dessus)
    smallEyeSpots(ctx, p.spine[0].x, p.spine[0].y, p.angle, p.size, 0.2, 0.4);
  }
  cheeks(ctx, p.spine[0].x, p.spine[0].y, p.angle, p.size, 0.05, 0.45);
}

/** Visage de la cellule et du ver : yeux (ou simples taches), joues, bouche */
function faceFront(ctx, p, r, parts, mood, fwd, spread) {
  const fx = Math.cos(p.angle), fy = Math.sin(p.angle);
  cheeks(ctx, p.x, p.y, p.angle, r, fwd - 0.2, spread + 0.15);
  if (parts.yeux) eyes(ctx, p.x, p.y, p.angle, r, fwd, spread, 0.26, mood, p.blink);
  else smallEyeSpots(ctx, p.x, p.y, p.angle, r, fwd, spread);
  // bouche : un sourire, ou grande ouverte pour croquer
  const mx = p.x + fx * r * 0.78, my = p.y + fy * r * 0.78;
  if (p.mouth > 0.1) {
    mouth(ctx, mx, my, p.angle, r * (parts.bouche ? 0.42 : 0.3), p.mouth, parts.bouche ? 'small' : null);
  } else {
    ctx.strokeStyle = PLAYER.dark;
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(mx - fx * r * 0.15, my - fy * r * 0.15, r * 0.16, p.angle - 0.9, p.angle + 0.9);
    ctx.stroke();
  }
}

export function smallEyeSpots(ctx, x, y, ang, r, fwd, spread) {
  const fx = Math.cos(ang), fy = Math.sin(ang);
  ctx.fillStyle = INK;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + fx * r * fwd - fy * r * spread * s, y + fy * r * fwd + fx * r * spread * s, Math.max(1, r * 0.12), 0, TAU);
    ctx.fill();
  }
}

export function cheeks(ctx, x, y, ang, r, fwd, spread) {
  const fx = Math.cos(ang), fy = Math.sin(ang);
  ctx.fillStyle = PLAYER.cheek;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + fx * r * fwd - fy * r * spread * s, y + fy * r * fwd + fx * r * spread * s, r * 0.13, r * 0.08, ang, 0, TAU);
    ctx.fill();
  }
}

/* ============================================================================
   L'ADN perdu (bulles à récupérer) et les petits effets
   ============================================================================ */
export function drawDrop(ctx, d, t) {
  const r = d.r * (1 + Math.sin(t * 5 + d.seed) * 0.08);
  const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 1.8);
  g.addColorStop(0, 'rgba(255, 240, 160, 0.55)');
  g.addColorStop(1, 'rgba(255, 240, 160, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, r * 1.8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.arc(d.x, d.y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // une petite double hélice
  ctx.lineWidth = r * 0.14;
  for (const ph of [0, Math.PI]) {
    ctx.strokeStyle = ph ? '#FF6F91' : '#4FB8E8';
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      const x = d.x - r * 0.6 + k * r * 1.2;
      const y = d.y + Math.sin(k * TAU + t * 3 + ph) * r * 0.35;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/* ============================================================================
   Le décor du fond marin
   ============================================================================ */
export function drawDecor(ctx, d, t) {
  if (DECORS[d.type]) return DECORS[d.type](ctx, d, t);
  switch (d.type) {
    case 'rocher': return drawRock(ctx, d);
    case 'stromatolithe': return drawStromatolite(ctx, d);
    case 'eponge': return drawSponge(ctx, d);
    case 'corail': return drawCoral(ctx, d);
    case 'crinoide': return drawCrinoid(ctx, d, t);
    case 'cheminee': return drawVent(ctx, d, t);
    case 'algues': return drawAlgaeBase(ctx, d);
    default:
  }
}

function drawRock(ctx, d) {
  if (!d.pts) {
    const rnd = seeded(d.seed);
    const n = 7 + Math.floor(rnd() * 4);
    d.pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * TAU;
      const rr = d.r * (0.75 + rnd() * 0.35);
      return { x: Math.cos(a) * rr, y: Math.sin(a) * rr };
    });
    d.col = ['#6B6F78', '#7A7065', '#5F6A70'][Math.floor(rnd() * 3)];
  }
  ctx.save();
  ctx.translate(d.x, d.y);
  shadow(ctx, d.r * 0.25, d.r * 0.3, d.r * 1.05, d.r * 0.85);
  ctx.fillStyle = d.col;
  ctx.strokeStyle = shade(d.col, -0.4);
  ctx.lineWidth = Math.max(1, d.r * 0.07);
  ctx.beginPath();
  d.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.ellipse(-d.r * 0.25, -d.r * 0.3, d.r * 0.5, d.r * 0.3, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawStromatolite(ctx, d) {
  const cols = ['#8FA36B', '#A8B57A', '#C2C58F', '#D8D3A4'];
  shadow(ctx, d.x + d.r * 0.2, d.y + d.r * 0.3, d.r, d.r * 0.85);
  for (let i = 0; i < 4; i++) {
    const rr = d.r * (1 - i * 0.22);
    ctx.fillStyle = cols[i];
    ctx.strokeStyle = 'rgba(70, 80, 40, 0.45)';
    ctx.lineWidth = Math.max(0.8, d.r * 0.05);
    ctx.beginPath();
    ctx.arc(d.x - i * d.r * 0.05, d.y - i * d.r * 0.06, rr, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

function drawSponge(ctx, d) {
  if (!d.tubes) {
    const rnd = seeded(d.seed);
    d.col = ['#F2A541', '#E8C547', '#C77DD9', '#F07E5E'][Math.floor(rnd() * 4)];
    d.tubes = Array.from({ length: 3 + Math.floor(rnd() * 3) }, () => ({ x: (rnd() - 0.5) * d.r * 1.2, y: (rnd() - 0.5) * d.r * 1.2, r: d.r * (0.35 + rnd() * 0.3) }));
  }
  shadow(ctx, d.x + d.r * 0.2, d.y + d.r * 0.3, d.r, d.r * 0.85);
  for (const tb of d.tubes) {
    ctx.fillStyle = d.col;
    ctx.strokeStyle = shade(d.col, -0.4);
    ctx.lineWidth = Math.max(1, tb.r * 0.15);
    ctx.beginPath();
    ctx.arc(d.x + tb.x, d.y + tb.y, tb.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shade(d.col, -0.55);
    ctx.beginPath();
    ctx.arc(d.x + tb.x, d.y + tb.y, tb.r * 0.5, 0, TAU);
    ctx.fill();
  }
}

function drawCoral(ctx, d) {
  if (!d.cells) {
    const rnd = seeded(d.seed);
    d.col = ['#FF8FA3', '#FFB26B', '#E86AA6', '#FFD07A'][Math.floor(rnd() * 4)];
    d.cells = [];
    for (let i = 0; i < 14; i++) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.75;
      d.cells.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr, r: d.r * (0.16 + rnd() * 0.1) });
    }
  }
  shadow(ctx, d.x + d.r * 0.2, d.y + d.r * 0.3, d.r, d.r * 0.85);
  ctx.fillStyle = shade(d.col, -0.2);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.92, 0, TAU);
  ctx.fill();
  for (const c of d.cells) {
    ctx.fillStyle = d.col;
    ctx.beginPath();
    ctx.arc(d.x + c.x, d.y + c.y, c.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = shade(d.col, -0.35);
    ctx.beginPath();
    ctx.arc(d.x + c.x, d.y + c.y, c.r * 0.4, 0, TAU);
    ctx.fill();
  }
}

function drawCrinoid(ctx, d, t) {
  if (!d.col) {
    const rnd = seeded(d.seed);
    d.col = ['#B36BD9', '#E0607E', '#F2A541'][Math.floor(rnd() * 3)];
    d.ph = rnd() * TAU;
  }
  shadow(ctx, d.x + d.r * 0.2, d.y + d.r * 0.3, d.r * 0.9, d.r * 0.8);
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + Math.sin(t * 0.8 + d.ph + i) * 0.12;
    const ex = d.x + Math.cos(a) * d.r, ey = d.y + Math.sin(a) * d.r;
    ctx.strokeStyle = d.col;
    ctx.lineWidth = d.r * 0.09;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.quadraticCurveTo(d.x + Math.cos(a + 0.4) * d.r * 0.6, d.y + Math.sin(a + 0.4) * d.r * 0.6, ex, ey);
    ctx.stroke();
    // petites plumes
    ctx.strokeStyle = shade(d.col, 0.3);
    ctx.lineWidth = d.r * 0.035;
    ctx.beginPath();
    for (let k = 1; k <= 4; k++) {
      const px = d.x + (ex - d.x) * k / 5, py = d.y + (ey - d.y) * k / 5;
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a + 1.2) * d.r * 0.14, py + Math.sin(a + 1.2) * d.r * 0.14);
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a - 1.2) * d.r * 0.14, py + Math.sin(a - 1.2) * d.r * 0.14);
    }
    ctx.stroke();
  }
  ctx.fillStyle = shade(d.col, -0.3);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.2, 0, TAU);
  ctx.fill();
}

function drawVent(ctx, d, t) {
  shadow(ctx, d.x + d.r * 0.25, d.y + d.r * 0.3, d.r * 1.3, d.r * 1.1);
  ctx.fillStyle = '#3B3340';
  ctx.strokeStyle = '#1D171F';
  ctx.lineWidth = d.r * 0.08;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 1.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#524752';
  ctx.beginPath();
  ctx.arc(d.x - d.r * 0.1, d.y - d.r * 0.12, d.r * 0.8, 0, TAU);
  ctx.fill();
  const glow = 0.6 + Math.sin(t * 2 + d.seed) * 0.2;
  const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 0.55);
  g.addColorStop(0, `rgba(255, 220, 120, ${glow})`);
  g.addColorStop(1, 'rgba(255, 90, 40, 0.4)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.45, 0, TAU);
  ctx.fill();
  // bulles qui montent (elles grossissent et s'éloignent en dérivant)
  for (let i = 0; i < 6; i++) {
    const k = (t * 0.35 + i / 6 + d.seed) % 1;
    const a = d.seed * 3 + i * 1.7;
    ctx.fillStyle = `rgba(230, 250, 255, ${0.7 * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * d.r * 0.4 * k + k * d.r * 0.8, d.y + Math.sin(a) * d.r * 0.4 * k - k * d.r * 1.6, d.r * (0.08 + k * 0.14), 0, TAU);
    ctx.fill();
  }
}

/* Une forêt d'algues : le pied sombre sur le fond… */
function drawAlgaeBase(ctx, d) {
  const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
  g.addColorStop(0, 'rgba(20, 70, 40, 0.55)');
  g.addColorStop(1, 'rgba(20, 70, 40, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, TAU);
  ctx.fill();
}

/* Ce qui se dessine par-dessus les créatures : les cachettes (algues, fougères…) */
export function drawCover(ctx, d, t) {
  if (COVERS[d.type]) return COVERS[d.type](ctx, d, t);
  return drawAlgaeFronds(ctx, d, t);
}

/* …et les longues lanières qui ondulent par-dessus les créatures (on s'y cache).
   De loin (petites à l'écran), on recopie une image toute prête qui se balance :
   c'est bien plus rapide quand il y a beaucoup d'algues à l'écran. */
export function drawAlgaeFronds(ctx, d, t) {
  const m = ctx.getTransform();
  if (d.r * Math.hypot(m.a, m.b) < 170) {
    const v = (d.r > 240 ? 3 : 0) + d.seed % 3;
    drawSprite(ctx, d, 'algues', v, paintAlgae, turnOf(d) + Math.sin(t * 1.1 + d.seed) * 0.04, 1.35);
    return;
  }
  liveFronds(ctx, d, t);
}

function paintAlgae(ctx, d) {
  liveFronds(ctx, { ...d, n: d.v >= 3 ? 40 : 24 }, 0);
}

function liveFronds(ctx, d, t) {
  if (!d.fronds) {
    const rnd = seeded(d.seed);
    const n = d.n || Math.round(Math.min(46, 10 + d.r / 8));
    d.fronds = Array.from({ length: n }, () => {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.75;
      return {
        x: Math.cos(a) * rr, y: Math.sin(a) * rr,
        len: 20 + rnd() * d.r * 0.4,
        dir: -1.2 + rnd() * 0.6,
        w: 2.5 + rnd() * 4.5,
        ph: rnd() * TAU,
        col: ['#3FA65A', '#4FBF6A', '#2E8A4C', '#6BCB5E'][Math.floor(rnd() * 4)],
      };
    });
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.78;
  for (const f of d.fronds) {
    const bx = d.x + f.x, by = d.y + f.y;
    ctx.strokeStyle = f.col;
    // la lanière ondule : une moitié épaisse près du pied, une moitié fine au bout
    let px = bx, py = by;
    const seg = 5;
    ctx.lineWidth = f.w * 0.92;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let k = 1; k <= seg; k++) {
      const a = f.dir + Math.sin(t * 1.3 + f.ph + k * 0.6) * 0.35 * (k / seg);
      px += Math.cos(a) * f.len / seg;
      py += Math.sin(a) * f.len / seg;
      ctx.lineTo(px, py);
      if (k === 2) {
        ctx.stroke();
        ctx.lineWidth = f.w * 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- Des images toutes prêtes pour la végétation ----------
   Une fougère, c'est des centaines de petits traits : les redessiner tous à
   chaque image ralentit beaucoup le jeu quand il y en a des dizaines à
   l'écran. On dessine donc chaque plante une seule fois dans une petite toile
   (quelques variantes par type), puis on recopie cette image, tournée et
   balancée par le vent. La toile est refaite plus grande si on zoome. */
const SPRITES = new Map();

export function drawSprite(ctx, d, key, v, paint, angle = 0, pad = 1.3) {
  const m = ctx.getTransform();
  const px = d.r * Math.hypot(m.a, m.b);
  let R = 32;
  while (R < px && R < 256) R *= 2;
  let s = SPRITES.get(key + v);
  if (!s || s.R < R) {
    const half = Math.ceil(R * pad);
    const c = document.createElement('canvas');
    c.width = c.height = half * 2;
    paint(c.getContext('2d'), { x: half, y: half, r: R, seed: v * 7919 + 13, v });
    s = { c, R, half };
    SPRITES.set(key + v, s);
  }
  const k = d.r / s.R;
  ctx.save();
  ctx.translate(d.x, d.y);
  if (angle) ctx.rotate(angle);
  ctx.drawImage(s.c, -s.half * k, -s.half * k, s.half * 2 * k, s.half * 2 * k);
  ctx.restore();
}

/** Un angle fixe propre à chaque plante (pour que les copies ne se ressemblent pas) */
export const turnOf = (d) => (d.seed % 628) / 100;

/* ============================================================================
   Textures pré-dessinées : le sable du fond et les reflets de lumière
   ============================================================================ */
export function buildFloorTile(color, seed = 1) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, S, S);
  const rnd = seeded(seed);
  // grandes taches douces (qui se répètent sans couture)
  for (let i = 0; i < 14; i++) {
    const x = rnd() * S, y = rnd() * S, r = 60 + rnd() * 120;
    const light = rnd() < 0.5;
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        gr.addColorStop(0, light ? 'rgba(255, 255, 230, 0.1)' : 'rgba(0, 30, 30, 0.12)');
        gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.fillStyle = gr;
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
  }
  // grains de sable
  for (let i = 0; i < 900; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(255, 255, 230, 0.16)' : 'rgba(0, 30, 30, 0.14)';
    g.beginPath();
    g.arc(rnd() * S, rnd() * S, 0.8 + rnd() * 1.8, 0, TAU);
    g.fill();
  }
  // petites rides de sable
  g.strokeStyle = 'rgba(255, 255, 230, 0.07)';
  g.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const x = rnd() * S, y = rnd() * S, w = 30 + rnd() * 60;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + w / 2, y - 8, x + w, y);
    g.stroke();
  }
  return c;
}

/** Les reflets du soleil qui dansent au fond de l'eau (réseau de lignes claires) */
export function buildCaustics(seed = 7) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const rnd = seeded(seed);
  const base = Array.from({ length: 16 }, () => ({ x: rnd() * S, y: rnd() * S }));
  const pts = [];
  for (const p of base) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) pts.push({ x: p.x + ox, y: p.y + oy });
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let d1 = 1e9, d2 = 1e9;
      for (const p of pts) {
        const dx = p.x - x, dy = p.y - y;
        const d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1);
      const v = Math.max(0, 1 - edge / 16) ** 3;
      const i = (y * S + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(v * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* ============================================================================
   Petites images (fiches, missions, évolutions)
   ============================================================================ */
const thumbCache = new Map();

/** Image d'une espèce, centrée et à la bonne taille */
export function speciesThumb(id, sp, size = 96) {
  const key = 'sp:' + id + size;
  if (thumbCache.has(key)) return thumbCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  const long = ['ver', 'priapule', 'opabinia', 'anomalocaris', 'poisson', 'eurypteride'].includes(sp.look);
  const fr = FRAMES[sp.look];
  const r = fr ? size * fr.r : sp.look === 'nautiloide' ? size * 0.13 : long ? size * 0.2 : size * 0.3;
  const angle = -0.35;
  const cx = fr ? size * fr.x : sp.look === 'nautiloide' ? size * 0.72 : long ? size * 0.66 : size / 2;
  const cy = fr ? size * fr.y : sp.look === 'nautiloide' ? size * 0.4 : long ? size * 0.4 : size / 2;
  const fake = {
    sp, x: cx, y: cy, angle, size: r, seed: 1, mood: sp.kind === 'hunter' ? 'angry' : 'calm', mouth: sp.kind === 'hunter' ? 0.6 : 0, blink: 0,
    spine: makeSpine(cx, cy, angle, r, sp.look),
  };
  drawCreature(g, fake, 0.3);
  const url = c.toDataURL();
  thumbCache.set(key, url);
  return url;
}

/** Image du joueur avec une évolution donnée (pour la boutique d'évolutions) */
export function playerThumb(form, parts, size = 96) {
  const key = 'pl:' + form + PLAYER.body + Object.keys(parts).sort().join(',') + size;
  if (thumbCache.has(key)) return thumbCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  const fr = FRAMES[form];
  const r = fr ? size * fr.r : form === 'cellule' ? size * 0.26 : size * 0.2;
  const angle = -0.35;
  const cx = fr ? size * fr.x : form === 'cellule' ? size * 0.55 : size * 0.64;
  const cy = fr ? size * fr.y : form === 'cellule' ? size * 0.5 : size * 0.42;
  const p = { x: cx, y: cy, angle, size: r, mouth: 0, mood: 'happy', blink: 0, speed: 0.3, walk: 0.4, spine: makeSpine(cx, cy, angle, r, FORM_SPINE[form]) };
  drawPlayer(g, p, form, parts, 0.5);
  const url = c.toDataURL();
  thumbCache.set(key, url);
  return url;
}

/* Combien de points dans la colonne, et leur écart, selon la forme */
export const SPINES = {
  ver: { n: 7, gap: 0.36 },
  priapule: { n: 7, gap: 0.36 },
  opabinia: { n: 5, gap: 0.4 },
  anomalocaris: { n: 7, gap: 0.33 },
  poisson: { n: 6, gap: 0.42 },
  eurypteride: { n: 6, gap: 0.33 },
};

/** Une colonne droite, derrière la tête (pour démarrer ou pour les vignettes) */
export function makeSpine(x, y, angle, size, look) {
  const s = SPINES[look];
  if (!s) return null;
  return Array.from({ length: s.n }, (_, i) => ({ x: x - Math.cos(angle) * size * s.gap * i, y: y - Math.sin(angle) * size * s.gap * i }));
}

/* ============================================================================
   Ammo, l'ammonite qui te guide
   ============================================================================ */
export const AMMO_SVG = `
<svg class="bip ammo" viewBox="0 0 84 84" aria-hidden="true">
  <g class="ammo-tent" fill="none" stroke="#E07B5F" stroke-width="5" stroke-linecap="round">
    <path d="M16 64 q-6 6 -4 14"/><path d="M24 68 q-2 7 1 13"/><path d="M33 68 q3 7 8 11"/><path d="M40 64 q7 4 11 10"/>
  </g>
  <circle cx="48" cy="36" r="29" fill="#F7CF94" stroke="#7A4A2A" stroke-width="3"/>
  <g fill="none" stroke="#C17F45" stroke-width="2.6" stroke-linecap="round">
    <path d="M48 36 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 0 1 12 -12 a18 18 0 0 1 18 18 a24 24 0 0 1 -24 24"/>
    <path d="M70 18 l-5 4 M76 30 l-6 2 M76 44 l-6 -1 M69 57 l-5 -3 M58 64 l-3 -5"/>
  </g>
  <ellipse cx="27" cy="57" rx="19" ry="15" fill="#FF9F80" stroke="#7A4A2A" stroke-width="3"/>
  <g class="bip-eyes">
    <circle cx="20" cy="53" r="6" fill="#fff" stroke="#2E2A4D" stroke-width="2"/>
    <circle cx="33" cy="52" r="6" fill="#fff" stroke="#2E2A4D" stroke-width="2"/>
    <circle cx="21" cy="54" r="3" fill="#2E2A4D"/>
    <circle cx="34" cy="53" r="3" fill="#2E2A4D"/>
  </g>
  <ellipse cx="15" cy="60" rx="3.5" ry="2" fill="rgba(255,90,120,0.5)"/>
  <ellipse cx="38" cy="60" rx="3.5" ry="2" fill="rgba(255,90,120,0.5)"/>
  <path class="bip-mouth" d="M22 62 Q27 66 32 62" stroke="#2E2A4D" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</svg>`;
