// ============================================================================
// Les niveaux des mammifères (et du loup) : Titanoboa, le serpent géant, et
// les oiseaux en vol, vus de dessus ; et le décor (hautes herbes, terriers,
// arbres à feuilles, palmiers, sapins sous la neige, neige). Les mammifères
// eux-mêmes sont dans art-dessus.js (vus de dessus, dans les niveaux) et
// art-profil.js (de profil, dans les intros et les fins).
// ============================================================================

import { LOOKS, FRAMES, SNOUT, SPINES, DECORS, COVERS, shade, smoothClosed, spineShape, segDir, eyes, drawSprite, turnOf, seeded } from './art.js';
import { blob } from './art-terre.js';

const TAU = Math.PI * 2;

/* Quand un animal est tout petit à l'écran, on saute les détails invisibles */
let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 34;
}
const isFine = () => fine;

/* ============================================================================
   Titanoboa, le serpent géant (vu de dessus, il nage dans les mares)
   ============================================================================ */
function drawSnake(ctx, c, t) {
  const pts = c.spine;
  if (!pts) return;
  const r = c.size;
  setDetail(ctx, r);
  const col = c.sp.color;
  const dark = shade(col, -0.55);
  const n = pts.length;
  const widths = pts.map((_, i) => r * 0.4 * (i < 2 ? 0.95 : 1 - Math.pow((i - 1) / (n - 1), 1.5) * 0.85));
  const shape = spineShape(pts, widths, 0.55);
  ctx.fillStyle = 'rgba(0, 20, 30, 0.25)';
  ctx.save();
  ctx.translate(r * 0.25, r * 0.35);
  smoothClosed(ctx, shape);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.06);
  smoothClosed(ctx, shape);
  ctx.fill();
  ctx.stroke();
  if (isFine()) {
    // les grosses taches sombres sur le dos
    ctx.fillStyle = shade(col, -0.35);
    for (let i = 2; i < n - 1; i++) {
      const d = segDir(pts, i);
      const s = i % 2 ? 1 : -1;
      const w = widths[i] * 0.45;
      ctx.beginPath();
      ctx.ellipse(pts[i].x - d.y * w * s, pts[i].y + d.x * w * s, widths[i] * 0.42, widths[i] * 0.3, Math.atan2(d.y, d.x), 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = r * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    for (let i = 2; i < n - 1; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  // la tête, un peu plus large, avec sa langue fourchue
  const h = pts[0], d0 = segDir(pts, 0);
  const ang = Math.atan2(d0.y, d0.x);
  if (Math.sin(t * 2.6 + (c.seed || 0) * 3) > 0.55 || c.mouth > 0.3) {
    const fx = h.x + d0.x * r * 0.75, fy = h.y + d0.y * r * 0.75;
    ctx.strokeStyle = '#D4314B';
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(h.x + d0.x * r * 0.45, h.y + d0.y * r * 0.45);
    ctx.lineTo(fx, fy);
    for (const s of [-1, 1]) {
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(ang + s * 0.5) * r * 0.18, fy + Math.sin(ang + s * 0.5) * r * 0.18);
    }
    ctx.stroke();
  }
  ctx.fillStyle = shade(col, 0.06);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  ctx.ellipse(h.x + d0.x * r * 0.12, h.y + d0.y * r * 0.12, r * 0.5, r * 0.36, ang, 0, TAU);
  ctx.fill();
  ctx.stroke();
  eyes(ctx, h.x, h.y, ang, r, 0.22, 0.22, 0.1, c.mood, c.blink, '#E8C547');
}

/* ============================================================================
   Les oiseaux en vol (vus de dessus)
   ============================================================================ */
function drawFlyingBird(ctx, c, t) {
  const r = c.size;
  const col = c.sp.color;
  const dark = shade(col, -0.55);
  const flap = Math.sin(t * 9 + (c.seed || 0) * 3);
  ctx.fillStyle = 'rgba(0, 25, 15, 0.16)';
  ctx.beginPath();
  ctx.ellipse(c.x + r * 0.9, c.y + r * 1.8, r * 1.3, r * 0.6, c.angle, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.lineJoin = 'round';
  // les ailes, qui battent
  for (const s of [-1, 1]) {
    const span = 1.5 + flap * 0.3;
    ctx.fillStyle = shade(col, -0.08);
    ctx.beginPath();
    ctx.moveTo(r * 0.2, s * r * 0.2);
    ctx.quadraticCurveTo(r * 0.1, s * r * span * 0.8, -r * 0.35, s * r * span);
    ctx.lineTo(-r * 0.65, s * r * span * 0.75);
    ctx.lineTo(-r * 0.5, s * r * span * 0.5);
    ctx.lineTo(-r * 0.6, s * r * span * 0.3);
    ctx.quadraticCurveTo(-r * 0.3, s * r * 0.25, -r * 0.2, s * r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // la queue en éventail
  ctx.fillStyle = shade(col, -0.15);
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, 0);
  ctx.lineTo(-r * 1.15, -r * 0.32);
  ctx.quadraticCurveTo(-r * 1.25, 0, -r * 1.15, r * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.65, r * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c.sp.beak || '#E8A33A';
  ctx.beginPath();
  ctx.moveTo(r * 0.95, 0);
  ctx.lineTo(r * 0.68, -r * 0.09);
  ctx.lineTo(r * 0.68, r * 0.09);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(col, 0.1);
  ctx.beginPath();
  ctx.arc(r * 0.55, 0, r * 0.22, 0, TAU);
  ctx.fill();
  ctx.stroke();
  eyes(ctx, r * 0.55, 0, 0, r, 0.08, 0.12, 0.08, c.mood, c.blink);
  ctx.restore();
}

/* ---------- Les looks, le cadrage des vignettes ---------- */
LOOKS.titanoboa = drawSnake;
SPINES.titanoboa = { n: 12, gap: 0.42 };
SNOUT.titanoboa = 0.55;
FRAMES.titanoboa = { r: 0.14, x: 0.7, y: 0.35 };
LOOKS.oiseau = drawFlyingBird;
FRAMES.oiseau = { r: 0.2, x: 0.55, y: 0.5 };

/* ============================================================================
   Le décor des mammifères (vu de dessus, comme le reste du sol)
   ============================================================================ */
/** Une ombre ronde et douce au sol (sous les herbes, les arbres) */
function paintShade(ctx, d) {
  const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
  g.addColorStop(0, 'rgba(30, 45, 10, 0.45)');
  g.addColorStop(1, 'rgba(30, 45, 10, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, TAU);
  ctx.fill();
}

/** Des touffes de hautes herbes (cols = les couleurs des brins) */
function grassPainter(cols) {
  return (ctx, d) => {
    const rnd = seeded(d.seed);
    ctx.lineCap = 'round';
    const tufts = 6 + (d.v % 3);
    for (let i = 0; i < tufts; i++) {
      const a0 = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.6;
      const bx = d.x + Math.cos(a0) * rr, by = d.y + Math.sin(a0) * rr;
      const n = 14 + Math.floor(rnd() * 6);
      for (let k = 0; k < n; k++) {
        const a = rnd() * TAU;
        const len = d.r * (0.22 + rnd() * 0.25);
        const bend = (rnd() - 0.5) * 0.8;
        ctx.strokeStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.lineWidth = Math.max(1.5, d.r * 0.03);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + Math.cos(a) * len * 0.6, by + Math.sin(a) * len * 0.6, bx + Math.cos(a + bend) * len, by + Math.sin(a + bend) * len);
        ctx.stroke();
      }
    }
  };
}
const paintGrass = grassPainter(['#B9B04A', '#9FA43C', '#C9BC5C', '#82963A', '#D6C46E']);
const paintFrostGrass = grassPainter(['#C9C4A0', '#B5B88E', '#E4E2CF', '#A8A77A', '#F2F2EA']);

DECORS.herbes = (ctx, d) => drawSprite(ctx, d, 'ombre-herbes', 0, paintShade, 0, 1);
COVERS.herbes = (ctx, d, t) => drawSprite(ctx, d, 'herbes', d.seed % 4, paintGrass, turnOf(d) + Math.sin(t * 1.1 + d.seed) * 0.03);
DECORS['herbes-gel'] = DECORS.herbes;
COVERS['herbes-gel'] = (ctx, d, t) => drawSprite(ctx, d, 'herbes-gel', d.seed % 4, paintFrostGrass, turnOf(d) + Math.sin(t * 1.1 + d.seed) * 0.03);

/** Un terrier : on s'y cache. Le trou dessous, le tas de terre par-dessus (on voit qui est dedans) */
DECORS.terrier = (ctx, d) => {
  const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 0.62);
  g.addColorStop(0, '#1A120B');
  g.addColorStop(1, '#4A3522');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.62, 0, TAU);
  ctx.fill();
};
function paintMound(ctx, d) {
  const rnd = seeded(d.seed);
  ctx.fillStyle = '#7A5A38';
  ctx.strokeStyle = '#4A3522';
  ctx.lineWidth = Math.max(2, d.r * 0.04);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, TAU);
  ctx.arc(d.x, d.y, d.r * 0.6, 0, TAU, true);
  ctx.fill('evenodd');
  ctx.stroke();
  // des cailloux et des mottes de terre
  for (let i = 0; i < 14; i++) {
    const a = rnd() * TAU, rr = d.r * (0.68 + rnd() * 0.25);
    ctx.fillStyle = rnd() < 0.5 ? '#8E6C45' : '#5F4630';
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr, d.r * (0.04 + rnd() * 0.05), 0, TAU);
    ctx.fill();
  }
}
COVERS.terrier = (ctx, d) => drawSprite(ctx, d, 'terrier', d.seed % 3, paintMound, turnOf(d), 1.1);

/** Le tronc, vu d'en haut, et son ombre au sol */
function stump(ctx, d, col) {
  ctx.fillStyle = 'rgba(10, 30, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(d.x + d.r * 0.5, d.y + d.r * 0.7, d.r * 1.05, d.r * 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.strokeStyle = shade(col, -0.45);
  ctx.lineWidth = Math.max(2, d.r * 0.04);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.18, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

function paintLeafy(ctx, d) {
  // un grand arbre à feuilles : des bouquets ronds qui se chevauchent
  const rnd = seeded(d.seed);
  const lobes = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * TAU + rnd() * 0.4, k = i === 0 ? 0 : 0.45 + rnd() * 0.15;
    return { x: d.x + Math.cos(a) * d.r * k, y: d.y + Math.sin(a) * d.r * k, r: d.r * (0.4 + rnd() * 0.15) };
  });
  ctx.fillStyle = '#2C5A28';
  for (const l of lobes) {
    ctx.beginPath();
    ctx.arc(l.x + d.r * 0.04, l.y + d.r * 0.05, l.r, 0, TAU);
    ctx.fill();
  }
  for (const l of lobes) {
    const g = ctx.createRadialGradient(l.x - l.r * 0.35, l.y - l.r * 0.35, l.r * 0.1, l.x, l.y, l.r);
    g.addColorStop(0, '#7DBB4E');
    g.addColorStop(1, '#3B7A33');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r * 0.92, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 255, 210, 0.14)';
  for (let i = 0; i < 18; i++) {
    const a = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.8;
    ctx.beginPath();
    ctx.arc(d.x + Math.cos(a) * rr - d.r * 0.1, d.y + Math.sin(a) * rr - d.r * 0.1, d.r * 0.06, 0, TAU);
    ctx.fill();
  }
}
DECORS.feuillu = (ctx, d) => stump(ctx, d, '#6B4F35');
COVERS.feuillu = (ctx, d, t) => drawSprite(ctx, d, 'feuillu', d.seed % 4, paintLeafy, Math.sin(t * 0.6 + d.seed) * 0.02, 1.25);

function paintPalm(ctx, d) {
  // un palmier : de grandes palmes en étoile
  const rnd = seeded(d.seed);
  const n = 9;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd() * 0.3;
    const len = d.r * (0.85 + rnd() * 0.15);
    const ex = d.x + Math.cos(a) * len, ey = d.y + Math.sin(a) * len;
    ctx.strokeStyle = '#4E7A2C';
    ctx.lineWidth = Math.max(1.5, d.r * 0.035);
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = i % 2 ? '#5E9A35' : '#6FAE3E';
    ctx.lineWidth = Math.max(1.5, d.r * 0.05);
    ctx.beginPath();
    for (let j = 1; j <= 9; j++) {
      const u = j / 10;
      const px = d.x + (ex - d.x) * u, py = d.y + (ey - d.y) * u;
      const l = d.r * 0.22 * Math.sin(u * Math.PI);
      for (const s of [-1, 1]) {
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a + s * 1.0) * l, py + Math.sin(a + s * 1.0) * l);
      }
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#7A5A30';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r * 0.08, 0, TAU);
  ctx.fill();
}
DECORS.palmier = (ctx, d) => stump(ctx, d, '#7A5A30');
COVERS.palmier = (ctx, d, t) => drawSprite(ctx, d, 'palmier', d.seed % 3, paintPalm, turnOf(d) + Math.sin(t * 0.8 + d.seed) * 0.03, 1.1);

function paintSnowFir(ctx, d) {
  // un sapin couvert de neige : des étages d'aiguilles, de la neige sur le dessus
  const rnd = seeded(d.seed);
  for (const [k, col] of [[1, '#1F4430'], [0.72, '#2A5A3C'], [0.45, '#346B47']]) {
    ctx.fillStyle = col;
    ctx.strokeStyle = 'rgba(10, 30, 20, 0.5)';
    ctx.lineWidth = Math.max(1.5, d.r * 0.02);
    ctx.beginPath();
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU + d.v;
      const rr = d.r * k * (i % 2 ? 0.72 : 1);
      const x = d.x + Math.cos(a) * rr, y = d.y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(245, 250, 255, 0.92)';
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, rr = Math.sqrt(rnd()) * d.r * 0.85;
    ctx.beginPath();
    ctx.ellipse(d.x + Math.cos(a) * rr - d.r * 0.05, d.y + Math.sin(a) * rr - d.r * 0.05, d.r * (0.06 + rnd() * 0.08), d.r * (0.04 + rnd() * 0.05), a, 0, TAU);
    ctx.fill();
  }
}
DECORS['sapin-neige'] = (ctx, d) => stump(ctx, d, '#4E3A28');
COVERS['sapin-neige'] = (ctx, d, t) => drawSprite(ctx, d, 'sapin-neige', d.seed % 3, paintSnowFir, Math.sin(t * 0.6 + d.seed) * 0.02, 1.1);

/** Une congère : on s'enfonce dans la neige profonde, on avance tout doucement */
DECORS.neige = (ctx, d, t) => {
  ctx.fillStyle = 'rgba(120, 150, 185, 0.35)';
  smoothClosed(ctx, blob(d, 1.08));
  ctx.fill();
  const g = ctx.createRadialGradient(d.x - d.r * 0.25, d.y - d.r * 0.25, d.r * 0.1, d.x, d.y, d.r);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(1, '#D6E4F0');
  ctx.fillStyle = g;
  smoothClosed(ctx, blob(d));
  ctx.fill();
  ctx.strokeStyle = 'rgba(140, 170, 200, 0.6)';
  ctx.lineWidth = Math.max(2, d.r * 0.025);
  ctx.stroke();
  // ça scintille
  for (let i = 0; i < 5; i++) {
    const k = (Math.sin(t * 2 + i * 1.7 + d.seed) + 1) / 2;
    const a = d.seed * 0.3 + i * 1.3;
    const x = d.x + Math.cos(a) * d.r * 0.5, y = d.y + Math.sin(a) * d.r * 0.45;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + k * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, d.r * 0.015 + k * d.r * 0.012, 0, TAU);
    ctx.fill();
  }
};
