// ============================================================================
// La voie des requins (niveau 3, version mer), vue de dessus comme tout
// l'océan : le joueur (requin-lanterne, requin-renard, requin-tigre, requin-
// marteau, mégalodon), et les géants de la mer après la météorite : Otodus,
// Basilosaurus (la baleine-serpent, avec ses minuscules pattes), Livyatan (le
// cachalot géant), les baleines, les dugongs, les manchots géants, les raies
// cachées dans le sable, et le bazar que le requin-tigre avale.
// Les corps ondulent vraiment : une vague part de la tête et grandit jusqu'à
// la queue (de gauche à droite pour un requin). Une baleine, elle, bat de la
// queue de haut en bas : vu de dessus, ses nageoires de queue s'allongent et
// se raccourcissent.
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, SPINES, SNOUT, shade, seeded, smoothClosed, spineShape, segDir, shadow, eyes, makeSpine } from './art.js';

const TAU = Math.PI * 2;
const TOOTH = '#FBF6E9';

let fine = true;
function setDetail(ctx, r) {
  const m = ctx.getTransform();
  fine = r * Math.hypot(m.a, m.b) > 26;
}

function profileAt(prof, k) {
  const x = k * (prof.length - 1);
  const i = Math.min(prof.length - 2, Math.floor(x));
  return prof[i] + (prof[i + 1] - prof[i]) * (x - i);
}

/** La colonne qui ondule : la tête reste droite, la vague grandit vers la queue */
function swimSpine(c, look, t, amp, beat) {
  const base = c.spine || makeSpine(c.x, c.y, c.angle, c.size, look);
  const n = base.length;
  const r = c.size;
  // (c.swim s'accumule dans le moteur : plus il va vite, plus il bat de la queue, sans à-coup)
  const ph = (c.swim ?? t) * beat + (c.seed || 0) * 3;
  return base.map((p, i) => {
    if (i === 0) return { x: p.x, y: p.y };
    const d = segDir(base, i);
    const k = i / (n - 1);
    const off = Math.sin(ph - i * 0.85) * amp * r * k * k;
    return { x: p.x - d.y * off, y: p.y + d.x * off };
  });
}

/** Une nageoire effilée et courbée vers l'arrière (a = sa direction, s = son côté) */
function fin(ctx, x, y, a, s, len, w, col, dark, lw) {
  const fx = Math.cos(a), fy = Math.sin(a);       // vers l'avant
  const nx = -fy * s, ny = fx * s;                // vers l'extérieur
  const tipx = x + nx * len - fx * len * 0.55, tipy = y + ny * len - fy * len * 0.55;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x + fx * w, y + fy * w);
  ctx.quadraticCurveTo(x + nx * len * 0.7 + fx * w * 0.5, y + ny * len * 0.7 + fy * w * 0.5, tipx, tipy);
  ctx.quadraticCurveTo(x + nx * len * 0.4 - fx * w * 0.9, y + ny * len * 0.4 - fy * w * 0.9, x - fx * w, y - fy * w);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** L'aileron sur le dos : une lame, avec un côté clair et un côté sombre */
function dorsal(ctx, p, d, k, r, col, dark, lw) {
  const L = r * 0.5 * k, H = r * 0.42 * k;
  // il se dresse : on le dessine penché vers le haut de l'écran, comme vu un peu de côté
  const s = d.x >= 0 ? -1 : 1;
  const tx = p.x - d.x * L * 0.55 - d.y * H * s, ty = p.y - d.y * L * 0.55 + d.x * H * s;
  ctx.fillStyle = 'rgba(0, 10, 25, 0.22)';
  ctx.beginPath();
  ctx.moveTo(p.x + d.x * L * 0.5, p.y + d.y * L * 0.5);
  ctx.lineTo(p.x - d.x * L * 0.55 + d.y * H * 0.4 * s, p.y - d.y * L * 0.55 - d.x * H * 0.4 * s);
  ctx.lineTo(p.x - d.x * L * 0.45, p.y - d.y * L * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(col, -0.2);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(p.x + d.x * L * 0.5, p.y + d.y * L * 0.5);
  ctx.quadraticCurveTo(p.x - d.y * H * 0.7 * s, p.y + d.x * H * 0.7 * s, tx, ty);
  ctx.quadraticCurveTo(p.x - d.x * L * 0.35 - d.y * H * 0.25 * s, p.y - d.y * L * 0.35 + d.x * H * 0.25 * s, p.x - d.x * L * 0.45, p.y - d.y * L * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** L'ombre au fond de la mer : elle suit tout le corps, même quand il se courbe */
function bodyShadow(ctx, pts, widths, r, nose) {
  const off = pts.map((p) => ({ x: p.x + r * 0.32, y: p.y + r * 0.5 }));
  ctx.fillStyle = 'rgba(0, 12, 28, 0.2)';
  smoothClosed(ctx, spineShape(off, widths, nose));
  ctx.fill();
}

/** La gueule grande ouverte, au bout du museau : un croissant sombre et des rangées de dents */
function openJaws(ctx, x, y, a, W, D, open, teeth, r) {
  const fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  ctx.fillStyle = '#5E1B28';
  ctx.strokeStyle = 'rgba(30, 10, 15, 0.8)';
  ctx.lineWidth = Math.max(0.6, r * 0.02);
  ctx.beginPath();
  ctx.moveTo(x + nx * W, y + ny * W);
  ctx.quadraticCurveTo(x + fx * D * open * 1.5, y + fy * D * open * 1.5, x - nx * W, y - ny * W);
  ctx.quadraticCurveTo(x - fx * D * 0.45, y - fy * D * 0.45, x + nx * W, y + ny * W);
  ctx.fill();
  ctx.stroke();
  if (!fine) return;
  ctx.fillStyle = TOOTH;
  ctx.strokeStyle = 'rgba(70, 40, 30, 0.5)';
  ctx.lineWidth = Math.max(0.4, r * 0.008);
  for (let i = 0; i <= teeth; i++) {
    const u = (i / teeth) * 2 - 1;                // de -1 à 1, le long de la mâchoire
    const px = x + nx * W * u * 0.92 + fx * D * open * 0.72 * (1 - u * u);
    const py = y + ny * W * u * 0.92 + fy * D * open * 0.72 * (1 - u * u);
    const tw = W * 1.5 / teeth, tl = W * 0.34 * (0.7 + open * 0.5);
    ctx.beginPath();
    ctx.moveTo(px + nx * tw * 0.5, py + ny * tw * 0.5);
    ctx.lineTo(px - fx * tl, py - fy * tl);
    ctx.lineTo(px - nx * tw * 0.5, py - ny * tw * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** L'œil d'un requin : tout noir, avec un reflet et un sourcil selon l'humeur */
function sharkEye(ctx, x, y, a, s, R, mood) {
  const fx = Math.cos(a), fy = Math.sin(a);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y, R * 1.15, R * 0.85, a, 0, TAU);
  ctx.fill();
  if (!fine) return;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(x + fx * R * 0.3, y + fy * R * 0.3 - R * 0.25, R * 0.28, 0, TAU);
  ctx.fill();
  if (mood === 'angry' || mood === 'scared') {
    const up = mood === 'angry' ? 1 : -1;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, R * 0.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - fx * R * 1.5 - fy * R * 1.1 * s, y - fy * R * 1.5 + fx * R * 1.1 * s);
    ctx.lineTo(x + fx * R * 1.5 - fy * R * (1.1 - up * 0.7) * s, y + fy * R * 1.5 + fx * R * (1.1 - up * 0.7) * s);
    ctx.stroke();
  }
}

/* ============================================================================
   Les requins
   S : { spine { n, gap }, body (largeurs, × r), nose (museau pointu), pect
         [longueur, largeur], dorsal (taille), beat, amp, tail ('croissant' |
         'fouet' : la longue queue du requin-renard), stripes (requin-tigre),
         glow (les points lumineux du requin-lanterne), hammer (la tête en
         marteau), scars (cicatrices), belly (la couleur du dessous), jaw }
   ============================================================================ */
function drawSharkPro(ctx, c, t, S, look, col, o = {}) {
  const r = c.size;
  setDetail(ctx, r);
  const dark = shade(col, -0.55);
  const belly = o.belly || S.belly || shade(col, 0.5);
  const lw = Math.max(0.8, r * 0.035);
  const pts = swimSpine(c, look, t, S.amp ?? 0.3, S.beat ?? 7);
  const n = pts.length;
  const widths = pts.map((_, i) => r * profileAt(S.body, i / (n - 1)));
  const head = pts[0];
  const a = Math.atan2(segDir(pts, 0).y, segDir(pts, 0).x);
  const fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  bodyShadow(ctx, pts, widths, r, S.nose ?? 1.7);

  // la queue
  const tail = pts[n - 1], td = segDir(pts, n - 1);
  const ta = Math.atan2(-td.y, -td.x);
  const flap = Math.sin((c.swim ?? t) * (S.beat ?? 7) + (c.seed || 0) * 3 - n * 0.85) * 0.35;
  if (S.tail === 'fouet') {
    // le requin-renard : une queue aussi longue que son corps ; elle claque quand il fouette
    const whip = c.whipT > 0 ? Math.sin((1 - c.whipT / 0.45) * Math.PI * 2) * 2.2 : 0;
    const L = r * 2.3;
    const a1 = ta + flap + whip * 0.5, a2 = ta + flap * 2 + whip;
    const mx = tail.x + Math.cos(a1) * L * 0.5, my = tail.y + Math.sin(a1) * L * 0.5;
    const ex = mx + Math.cos(a2) * L * 0.5, ey = my + Math.sin(a2) * L * 0.5;
    const w0 = r * 0.13;
    ctx.fillStyle = shade(col, -0.08);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(tail.x - Math.sin(a1) * w0, tail.y + Math.cos(a1) * w0);
    ctx.quadraticCurveTo(mx - Math.sin(a1) * w0 * 0.7, my + Math.cos(a1) * w0 * 0.7, ex, ey);
    ctx.quadraticCurveTo(mx + Math.sin(a1) * w0 * 0.7, my - Math.cos(a1) * w0 * 0.7, tail.x + Math.sin(a1) * w0, tail.y - Math.cos(a1) * w0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    fin(ctx, tail.x, tail.y, a1 + Math.PI, 1, r * 0.42, r * 0.09, shade(col, -0.08), dark, lw);
  } else {
    const L = r * 0.95;
    for (const s of [1, -1]) {
      const b = ta + flap + s * 0.62;
      ctx.fillStyle = shade(col, -0.08);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(tail.x - Math.cos(ta) * r * 0.08, tail.y - Math.sin(ta) * r * 0.08);
      ctx.quadraticCurveTo(tail.x + Math.cos(b + s * 0.42) * L * 0.6, tail.y + Math.sin(b + s * 0.42) * L * 0.6, tail.x + Math.cos(b) * L * (s > 0 ? 1 : 0.8), tail.y + Math.sin(b) * L * (s > 0 ? 1 : 0.8));
      ctx.quadraticCurveTo(tail.x + Math.cos(b - s * 0.3) * L * 0.42, tail.y + Math.sin(b - s * 0.3) * L * 0.42, tail.x + Math.cos(ta + flap) * L * 0.2, tail.y + Math.sin(ta + flap) * L * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // les nageoires : les grandes devant (elles s'écartent quand il tourne), les petites derrière
  const [pl, pw] = S.pect || [0.95, 0.2];
  const i1 = Math.round((n - 1) * 0.28), i2 = Math.round((n - 1) * 0.7);
  for (const s of [-1, 1]) {
    const d1 = segDir(pts, i1), a1 = Math.atan2(d1.y, d1.x);
    const swing = 1 + Math.sin(t * 2 + (c.seed || 0)) * 0.06;
    fin(ctx, pts[i1].x - d1.y * widths[i1] * 0.72 * s, pts[i1].y + d1.x * widths[i1] * 0.72 * s, a1, s, r * pl * swing, r * pw, shade(col, -0.1), dark, lw);
    const d2 = segDir(pts, i2), a2 = Math.atan2(d2.y, d2.x);
    fin(ctx, pts[i2].x - d2.y * widths[i2] * 0.7 * s, pts[i2].y + d2.x * widths[i2] * 0.7 * s, a2, s, r * pl * 0.32, r * pw * 0.55, shade(col, -0.1), dark, lw);
  }

  // le corps : le ventre clair dépasse sur les bords, le dos est plus sombre
  const outline = spineShape(pts, widths, S.nose ?? 1.7);
  ctx.fillStyle = belly;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, outline);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    const backW = widths.map((w) => w * 0.88);
    const g = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
    g.addColorStop(0, shade(col, 0.08));
    g.addColorStop(1, shade(col, -0.08));
    ctx.fillStyle = g;
    smoothClosed(ctx, spineShape(pts, backW, S.nose ?? 1.7));
    ctx.fill();
    // les rayures du requin-tigre
    if (S.stripes) {
      ctx.fillStyle = o.stripe || shade(col, -0.42);
      for (let i = 1; i < n - 1; i++) {
        const d = segDir(pts, i), w = widths[i];
        for (const f of [-0.28, 0.28]) {
          const x = pts[i].x + d.x * f * r * 0.42, y = pts[i].y + d.y * f * r * 0.42;
          ctx.beginPath();
          ctx.ellipse(x, y, r * 0.05, w * 0.7, Math.atan2(d.y, d.x), 0, TAU);
          ctx.fill();
        }
      }
    }
    // des cicatrices : il en a vu d'autres
    if (S.scars) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = r * 0.022;
      ctx.lineCap = 'round';
      const rnd = seeded(7);
      ctx.beginPath();
      for (let k = 0; k < S.scars; k++) {
        const i = 1 + Math.floor(rnd() * (n - 2));
        const d = segDir(pts, i), u = (rnd() - 0.5) * widths[i], l = r * (0.1 + rnd() * 0.2);
        const x = pts[i].x - d.y * u, y = pts[i].y + d.x * u;
        ctx.moveTo(x - d.x * l, y - d.y * l);
        ctx.lineTo(x + d.x * l + d.y * l * 0.4, y + d.y * l - d.x * l * 0.4);
      }
      ctx.stroke();
    }
    // un reflet de lumière sur le dos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = r * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 1; i < n - 1; i++) {
      const d = segDir(pts, i);
      const x = pts[i].x + d.y * widths[i] * 0.3, y = pts[i].y - d.x * widths[i] * 0.3;
      if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // les fentes des branchies
    if (!S.hammer) {
      const d = segDir(pts, 1);
      ctx.strokeStyle = 'rgba(20, 25, 35, 0.45)';
      ctx.lineWidth = Math.max(0.6, r * 0.024);
      for (const s of [-1, 1]) {
        for (let k = 0; k < 5; k++) {
          const u = r * (0.28 + k * 0.1);
          const bx = head.x - d.x * u - d.y * widths[1] * 0.55 * s, by = head.y - d.y * u + d.x * widths[1] * 0.55 * s;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - d.y * r * 0.13 * s, by + d.x * r * 0.13 * s);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
    smoothClosed(ctx, outline);
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.stroke();

  // les aiguilles lumineuses du requin-lanterne : il brille dans le noir
  if (S.glow) {
    const pulse = 0.6 + Math.sin(t * 3 + (c.seed || 0)) * 0.25 + (c.flashT > 0 ? 1 : 0);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i < n; i++) {
      const d = segDir(pts, i);
      for (const s of [-1, 1]) {
        const x = pts[i].x - d.y * widths[i] * 0.6 * s, y = pts[i].y + d.x * widths[i] * 0.6 * s;
        const R = r * (0.16 + (i % 2) * 0.05) * (1 + (c.flashT > 0 ? 1.2 : 0));
        const gl = ctx.createRadialGradient(x, y, 0, x, y, R);
        gl.addColorStop(0, `rgba(120, 255, 235, ${Math.min(1, 0.9 * pulse)})`);
        gl.addColorStop(1, 'rgba(60, 220, 255, 0)');
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(x, y, R, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // les ailerons
  dorsal(ctx, pts[Math.round((n - 1) * 0.36)], segDir(pts, Math.round((n - 1) * 0.36)), S.dorsal ?? 1, r, col, dark, lw);
  dorsal(ctx, pts[Math.round((n - 1) * 0.72)], segDir(pts, Math.round((n - 1) * 0.72)), (S.dorsal ?? 1) * 0.45, r, col, dark, lw);

  // la tête
  if (S.hammer) {
    // la tête en marteau, avec un œil à chaque bout
    const W = r * 0.95 * (o.bigHammer ? 1.2 : 1), hx = head.x + fx * r * 0.16, hy = head.y + fy * r * 0.16;
    const bong = c.bongT > 0 ? Math.sin(c.bongT * 40) * r * 0.03 : 0;
    const P = (u, v) => ({ x: hx + fx * (u * r + bong) + nx * v * W, y: hy + fy * (u * r + bong) + ny * v * W });
    const shape = [P(-0.2, 0.28), P(-0.13, 0.75), P(-0.1, 1), P(0.13, 1.02), P(0.2, 0.7), P(0.3, 0.2), P(0.3, -0.2), P(0.2, -0.7), P(0.13, -1.02), P(-0.1, -1), P(-0.13, -0.75), P(-0.2, -0.28)];
    ctx.fillStyle = shade(col, 0.06);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, shape);
    ctx.fill();
    ctx.stroke();
    if ((c.mouth || 0) > 0.15) openJaws(ctx, hx + fx * r * 0.28, hy + fy * r * 0.28, a, r * 0.24, r * 0.2, c.mouth, 8, r);
    if (fine) {
      // les petits points du sens électrique
      ctx.fillStyle = 'rgba(30, 40, 50, 0.45)';
      for (let i = 0; i < 16; i++) {
        const v = (i / 15) * 1.7 - 0.85, p = P(0.2 - Math.abs(v) * 0.09, v);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.012, 0, TAU);
        ctx.fill();
      }
    }
    for (const s of [-1, 1]) {
      const p = P(0, s * 0.95);
      if (o.cute) {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(0.8, r * 0.018);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.11, 0, TAU);
        ctx.fill();
        ctx.stroke();
        if (!c.blink) {
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.arc(p.x + fx * r * 0.04, p.y + fy * r * 0.04, r * 0.055, 0, TAU);
          ctx.fill();
        }
      } else {
        sharkEye(ctx, p.x, p.y, a, s, r * 0.06, c.mood);
      }
    }
    return;
  }
  const open = c.mouth || 0;
  if (open > 0.12) {
    const W = widths[0] * (S.jaw ?? 1.15);
    openJaws(ctx, head.x + fx * r * 0.35, head.y + fy * r * 0.35, a, W, r * 0.42, open, S.teeth ?? 9, r);
  }
  const ex = head.x - fx * r * 0.02, ey = head.y - fy * r * 0.02;
  if (o.cute) {
    eyes(ctx, ex, ey, a, r, 0, widths[0] * 0.8 / r, 0.11, c.mood, c.blink);
    ctx.fillStyle = 'rgba(255, 120, 150, 0.5)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(ex + fx * r * 0.2 + nx * widths[0] * 0.62 * s, ey + fy * r * 0.2 + ny * widths[0] * 0.62 * s, r * 0.07, r * 0.045, a, 0, TAU);
      ctx.fill();
    }
  } else {
    for (const s of [-1, 1]) sharkEye(ctx, ex + nx * widths[0] * 0.85 * s, ey + ny * widths[0] * 0.85 * s, a, s, r * (S.eyeR ?? 0.06), c.mood);
  }
}

const SHARK_LOOKS = {
  'requin-lanterne': {
    spine: { n: 6, gap: 0.42 }, body: [0.26, 0.4, 0.42, 0.34, 0.22, 0.09], nose: 1.1, pect: [0.62, 0.18], dorsal: 0.8, beat: 9, amp: 0.34, glow: true, belly: '#BFEFEA', teeth: 7,
  },
  'requin-renard': {
    spine: { n: 6, gap: 0.42 }, body: [0.2, 0.36, 0.42, 0.34, 0.2, 0.07], nose: 1.3, pect: [1.05, 0.17], dorsal: 0.9, beat: 7, amp: 0.26, tail: 'fouet', eyeR: 0.1, belly: '#F4F6FA',
  },
  'requin-tigre': {
    spine: { n: 7, gap: 0.42 }, body: [0.3, 0.46, 0.52, 0.48, 0.36, 0.22, 0.08], nose: 0.9, pect: [0.95, 0.22], dorsal: 1, beat: 6, amp: 0.26, stripes: true, belly: '#F2EEDC', jaw: 1.25, teeth: 10,
  },
  'requin-marteau': {
    spine: { n: 7, gap: 0.42 }, body: [0.2, 0.3, 0.38, 0.36, 0.28, 0.17, 0.07], pect: [0.8, 0.17], dorsal: 1.25, beat: 6.5, amp: 0.3, hammer: true, belly: '#EEF2F2',
  },
  megalodon: {
    spine: { n: 7, gap: 0.44 }, body: [0.36, 0.56, 0.64, 0.58, 0.42, 0.24, 0.09], nose: 0.75, pect: [1.2, 0.3], dorsal: 1.25, beat: 3.6, amp: 0.2, scars: 8, belly: '#E6ECEC', jaw: 1.3, teeth: 13, eyeR: 0.05,
  },
  otodus: {
    spine: { n: 7, gap: 0.42 }, body: [0.3, 0.46, 0.54, 0.5, 0.36, 0.2, 0.08], nose: 1.0, pect: [1.05, 0.24], dorsal: 1.1, beat: 4.5, amp: 0.24, scars: 4, belly: '#DCE6E8', jaw: 1.2, teeth: 11,
  },
  'requin-blanc': {
    spine: { n: 7, gap: 0.42 }, body: [0.28, 0.44, 0.52, 0.46, 0.32, 0.18, 0.08], nose: 1.1, pect: [1.0, 0.22], dorsal: 1.1, beat: 5.5, amp: 0.26, belly: '#FFFFFF', teeth: 11,
  },
};

for (const [id, S] of Object.entries(SHARK_LOOKS)) {
  SPINES[id] = S.spine;
  LOOKS[id] = (ctx, c, t) => drawSharkPro(ctx, c, t, S, id, c.sp.color);
  SNOUT[id] = 0.7;
  const len = (S.spine.n - 1) * S.spine.gap + 1.1 + (S.tail === 'fouet' ? 1.6 : 0);
  const r = Math.min(0.2, 0.8 / len);
  FRAMES[id] = { r, x: 0.12 + ((S.spine.n - 1) * S.spine.gap + (S.tail === 'fouet' ? 1.7 : 0.8)) * r * 0.92, y: 0.42 + (S.spine.n - 1) * S.spine.gap * r * 0.17 };
}

/* ---- Le joueur : ses couleurs viennent de PLAYER (elles changent à chaque chapitre) ---- */
for (const form of ['requin-lanterne', 'requin-renard', 'requin-tigre', 'requin-marteau', 'megalodon']) {
  const S = SHARK_LOOKS[form];
  FORM_SPINE[form] = form;
  FORMS[form] = (ctx, p, parts, t, mood) => {
    drawSharkPro(ctx, { ...p, sp: { kind: 'player' }, mood, seed: 0 }, t, S, form, PLAYER.body, { cute: true, belly: PLAYER.belly, stripe: PLAYER.stripe, bigHammer: !!parts['grand-marteau'] });
  };
}

/* ============================================================================
   Les baleines : elles nagent en battant de la queue de haut en bas. Vu de
   dessus, le corps ondule très peu et les deux lobes de la queue s'allongent et
   se raccourcissent. De temps en temps, elles soufflent.
   W : { spine, body, flipper [i, longueur, largeur], legs (Basilosaurus : de
         minuscules pattes ; 'quatre' : Ambulocetus), head ('serpent', 'cachalot',
         'baleine', 'dugong', 'croco'), fluke (taille), beat, amp, spots, scars }
   ============================================================================ */
function drawWhale(ctx, c, t, W, look, col) {
  const r = c.size;
  setDetail(ctx, r);
  const dark = shade(col, -0.58);
  const lw = Math.max(0.8, r * 0.032);
  const pts = swimSpine(c, look, t, W.amp ?? 0.1, W.beat ?? 2.6);
  const n = pts.length;
  const widths = pts.map((_, i) => r * profileAt(W.body, i / (n - 1)));
  const head = pts[0];
  const a = Math.atan2(segDir(pts, 0).y, segDir(pts, 0).x);
  const fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  bodyShadow(ctx, pts, widths, r, W.nose ?? 0.6);

  // la queue : deux lobes à l'horizontale, qui « respirent » (elle monte et descend)
  const tail = pts[n - 1], td = segDir(pts, n - 1), ta = Math.atan2(-td.y, -td.x);
  const pump = Math.sin((c.swim ?? t) * (W.beat ?? 2.6) + (c.seed || 0));
  const FL = r * (W.fluke ?? 0.9);
  const reach = 0.72 + pump * 0.28;
  if (W.head === 'croco') {
    // Ambulocetus : pas encore de vraie nageoire, sa queue s'effile
  } else if (W.head === 'dugong') {
    // une large palette
    ctx.fillStyle = shade(col, -0.08);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(tail.x + Math.cos(ta) * FL * 0.3, tail.y + Math.sin(ta) * FL * 0.3, FL * 0.32 * reach, FL * 0.62, ta, 0, TAU);
    ctx.fill();
    ctx.stroke();
  } else {
    for (const s of [1, -1]) {
      const b = ta + s * 1.15;
      ctx.fillStyle = shade(col, -0.1);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.quadraticCurveTo(tail.x + Math.cos(b + s * 0.25) * FL * 0.6, tail.y + Math.sin(b + s * 0.25) * FL * 0.6, tail.x + Math.cos(b) * FL * reach, tail.y + Math.sin(b) * FL * reach);
      ctx.quadraticCurveTo(tail.x + Math.cos(ta + s * 0.5) * FL * 0.55 * reach, tail.y + Math.sin(ta + s * 0.5) * FL * 0.55 * reach, tail.x + Math.cos(ta) * FL * 0.26, tail.y + Math.sin(ta) * FL * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // les nageoires (elles rament doucement)
  if (W.flipper) {
    const [i, len, w] = W.flipper;
    const d = segDir(pts, i), fa = Math.atan2(d.y, d.x);
    for (const s of [-1, 1]) {
      const row = 1 + Math.sin(t * 2.2 + (c.seed || 0) + s) * 0.12;
      fin(ctx, pts[i].x - d.y * widths[i] * 0.8 * s, pts[i].y + d.x * widths[i] * 0.8 * s, fa, s, r * len * row, r * w, shade(col, -0.12), dark, lw);
    }
  }
  // Basilosaurus : ses minuscules pattes arrière, qui ne servent plus à rien
  if (W.legs) {
    const list = W.legs === 'quatre' ? [[Math.round((n - 1) * 0.28), 0.5], [Math.round((n - 1) * 0.62), 0.55]] : [[n - 5, 0.3]];
    for (const [i, len] of list) {
      const d = segDir(pts, i);
      for (const s of [-1, 1]) {
        const paddle = Math.sin(t * 5 + i + s) * 0.3;
        const bx = pts[i].x - d.y * widths[i] * 0.85 * s, by = pts[i].y + d.x * widths[i] * 0.85 * s;
        const out = { x: -d.y * s - d.x * (0.5 + paddle), y: d.x * s - d.y * (0.5 + paddle) };
        const L = r * len;
        ctx.strokeStyle = dark;
        ctx.lineWidth = r * 0.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + out.x * L, by + out.y * L);
        ctx.stroke();
        ctx.strokeStyle = shade(col, -0.08);
        ctx.lineWidth = r * 0.065;
        ctx.stroke();
        ctx.fillStyle = shade(col, -0.2);
        ctx.beginPath();
        ctx.arc(bx + out.x * L, by + out.y * L, r * (W.legs === 'quatre' ? 0.1 : 0.05), 0, TAU);
        ctx.fill();
      }
    }
  }

  // le corps
  const outline = spineShape(pts, widths, W.nose ?? 0.6);
  const g = ctx.createLinearGradient(head.x + nx * r, head.y + ny * r, head.x - nx * r, head.y - ny * r);
  g.addColorStop(0, shade(col, -0.12));
  g.addColorStop(0.5, col);
  g.addColorStop(1, shade(col, 0.1));
  ctx.fillStyle = g;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, outline);
  ctx.fill();
  if (fine) {
    ctx.save();
    ctx.clip();
    if (W.spots) {
      ctx.fillStyle = 'rgba(245, 245, 235, 0.55)';
      const rnd = seeded(look.length * 31);
      for (let k = 0; k < W.spots; k++) {
        const i = Math.floor(rnd() * (n - 1)), u = (rnd() - 0.5) * 1.6;
        const d = segDir(pts, i), x = pts[i].x - d.y * widths[i] * u + d.x * r * (rnd() - 0.5) * 0.4, y = pts[i].y + d.x * widths[i] * u + d.y * r * (rnd() - 0.5) * 0.4;
        ctx.beginPath();
        ctx.ellipse(x, y, r * (0.03 + rnd() * 0.05), r * (0.02 + rnd() * 0.03), rnd() * 3, 0, TAU);
        ctx.fill();
      }
    }
    if (W.scars) {
      // les griffures laissées par les batailles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
      ctx.lineWidth = r * 0.016;
      ctx.lineCap = 'round';
      const rnd = seeded(11);
      ctx.beginPath();
      for (let k = 0; k < W.scars; k++) {
        const i = Math.floor(rnd() * (n - 2)), u = (rnd() - 0.5) * 1.5, l = r * (0.1 + rnd() * 0.22), sk = (rnd() - 0.5) * 1.2;
        const d = segDir(pts, i), x = pts[i].x - d.y * widths[i] * u, y = pts[i].y + d.x * widths[i] * u;
        ctx.moveTo(x - d.x * l, y - d.y * l);
        ctx.lineTo(x + d.x * l - d.y * l * sk, y + d.y * l + d.x * l * sk);
      }
      ctx.stroke();
    }
    // le reflet de lumière sur le dos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = r * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n - 1; i++) {
      const d = segDir(pts, i);
      const x = pts[i].x + d.y * widths[i] * 0.42, y = pts[i].y - d.x * widths[i] * 0.42;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    smoothClosed(ctx, outline);
  }
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.stroke();

  // la tête
  const open = c.mouth || 0;
  const w0 = widths[0];
  if (W.head === 'cachalot') {
    // Livyatan : une tête énorme et carrée ; quand il ouvre la gueule, des dents de 36 cm !
    const nose = r * 0.42;
    const hx = head.x + fx * nose, hy = head.y + fy * nose;
    if (open > 0.08) {
      ctx.fillStyle = '#5E1B28';
      ctx.beginPath();
      ctx.ellipse(hx - fx * r * 0.1, hy - fy * r * 0.1, r * (0.2 + 0.26 * open), w0 * 0.66, a, 0, TAU);
      ctx.fill();
    }
    const tn = 9;
    for (const s of [-1, 1]) {
      for (let i = 0; i < tn; i++) {
        const u = -0.25 + i / tn * (0.7 + open * 0.3);
        const bx = head.x + fx * r * u + nx * w0 * 0.86 * s * (1 - Math.max(0, u) * 0.3);
        const by = head.y + fy * r * u + ny * w0 * 0.86 * s * (1 - Math.max(0, u) * 0.3);
        const tl = r * (0.11 + open * 0.09);
        ctx.fillStyle = TOOTH;
        ctx.strokeStyle = 'rgba(70, 40, 30, 0.6)';
        ctx.lineWidth = Math.max(0.5, r * 0.008);
        ctx.beginPath();
        ctx.moveTo(bx - fx * r * 0.035, by - fy * r * 0.035);
        ctx.lineTo(bx + nx * tl * s, by + ny * tl * s);
        ctx.lineTo(bx + fx * r * 0.035, by + fy * r * 0.035);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    // l'évent (sur le côté gauche de la tête, comme les cachalots)
    ctx.fillStyle = 'rgba(15, 15, 20, 0.7)';
    ctx.beginPath();
    ctx.ellipse(head.x + fx * r * 0.2 + nx * w0 * 0.25, head.y + fy * r * 0.2 + ny * w0 * 0.25, r * 0.04, r * 0.02, a, 0, TAU);
    ctx.fill();
    for (const s of [-1, 1]) sharkEye(ctx, head.x - fx * r * 0.4 + nx * widths[1] * 0.85 * s, head.y - fy * r * 0.4 + ny * widths[1] * 0.85 * s, a, s, r * 0.04, c.mood);
  } else if (W.head === 'serpent' || W.head === 'croco') {
    // de longues mâchoires pleines de dents, qui dépassent toujours
    const L = r * (W.head === 'croco' ? 0.9 : 1.05), Wh = w0 * 0.92;
    const P = (u, v) => ({ x: head.x + fx * u * L + nx * v * Wh, y: head.y + fy * u * L + ny * v * Wh });
    const gape = 1 + open * 0.55;
    const k = (u) => 1 - u * 0.62;
    if (fine || open > 0.1) {
      ctx.fillStyle = TOOTH;
      ctx.strokeStyle = 'rgba(70, 40, 30, 0.5)';
      ctx.lineWidth = Math.max(0.4, r * 0.008);
      for (const s of [-1, 1]) {
        for (let i = 0; i < 8; i++) {
          const u = 0.08 + i * 0.12, e = P(u, s * k(u) * 0.9 * gape);
          const tl = r * (i < 2 ? 0.1 : 0.075) * (1 + open * 0.3);
          ctx.beginPath();
          ctx.moveTo(e.x - fx * r * 0.03, e.y - fy * r * 0.03);
          ctx.lineTo(e.x + nx * s * tl, e.y + ny * s * tl);
          ctx.lineTo(e.x + fx * r * 0.03, e.y + fy * r * 0.03);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    if (open > 0.08) {
      ctx.fillStyle = '#5E1B28';
      ctx.beginPath();
      ctx.ellipse(P(0.5, 0).x, P(0.5, 0).y, L * 0.46, Wh * 0.62 * open, a, 0, TAU);
      ctx.fill();
    }
    const skull = [P(-0.1, 0.92), P(0.25, k(0.25) * gape * 0.95), P(0.6, k(0.6) * gape * 0.95), P(0.92, k(0.92) * gape * 0.82), P(1.02, 0), P(0.92, -k(0.92) * gape * 0.82), P(0.6, -k(0.6) * gape * 0.95), P(0.25, -k(0.25) * gape * 0.95), P(-0.1, -0.92)];
    ctx.fillStyle = shade(col, 0.05);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, skull);
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = shade(col, -0.2);
      ctx.lineWidth = Wh * 0.28;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(P(0, 0).x, P(0, 0).y);
      ctx.lineTo(P(0.82, 0).x, P(0.82, 0).y);
      ctx.stroke();
    }
    for (const s of [-1, 1]) sharkEye(ctx, P(0.05, s * 0.62).x, P(0.05, s * 0.62).y, a, s, r * 0.07, c.mood);
  } else if (W.head === 'dugong') {
    // un gros museau tout rond, avec des moustaches : la « vache de mer »
    const hx = head.x + fx * r * 0.28, hy = head.y + fy * r * 0.28;
    ctx.fillStyle = shade(col, 0.14);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.22, r * 0.25, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = 'rgba(40, 30, 25, 0.6)';
      ctx.lineWidth = r * 0.012;
      ctx.beginPath();
      for (const s of [-1, 1]) {
        for (const q of [-0.3, 0, 0.3]) {
          ctx.moveTo(hx + fx * r * 0.14 + nx * r * 0.1 * s, hy + fy * r * 0.14 + ny * r * 0.1 * s);
          ctx.lineTo(hx + fx * r * (0.24 + q * 0.1) + nx * r * 0.22 * s, hy + fy * r * (0.24 + q * 0.1) + ny * r * 0.22 * s);
        }
      }
      ctx.stroke();
    }
    for (const s of [-1, 1]) sharkEye(ctx, head.x + nx * w0 * 0.72 * s, head.y + ny * w0 * 0.72 * s, a, s, r * 0.055, c.mood === 'scared' ? 'scared' : 'calm');
  } else {
    // une baleine : un grand museau plat, les deux évents et de tout petits yeux
    if (open > 0.1) openJaws(ctx, head.x + fx * r * 0.45, head.y + fy * r * 0.45, a, w0 * 0.85, r * 0.36, open, 8, r);
    ctx.fillStyle = 'rgba(15, 15, 20, 0.65)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(head.x - fx * r * 0.05 + nx * r * 0.04 * s, head.y - fy * r * 0.05 + ny * r * 0.04 * s, r * 0.05, r * 0.018, a, 0, TAU);
      ctx.fill();
    }
    for (const s of [-1, 1]) sharkEye(ctx, head.x - fx * r * 0.15 + nx * widths[1] * 0.92 * s, head.y - fy * r * 0.15 + ny * widths[1] * 0.92 * s, a, s, r * 0.04, c.mood);
  }
  // elle souffle ! (toutes les 7 secondes environ)
  if (W.spout && fine) {
    const u = ((t + (c.seed || 0) * 3) % 7) / 1.1;
    if (u < 1) {
      const sx = head.x - fx * r * 0.05, sy = head.y - fy * r * 0.05;
      ctx.fillStyle = `rgba(235, 248, 255, ${0.75 * (1 - u)})`;
      for (let i = 0; i < 7; i++) {
        const b = i * 0.9 + (c.seed || 0);
        const q = u * r * (0.3 + i * 0.09);
        ctx.beginPath();
        ctx.arc(sx + Math.cos(b) * q, sy + Math.sin(b) * q - u * r * 0.6, r * (0.1 + u * 0.14), 0, TAU);
        ctx.fill();
      }
    }
  }
}

const WHALES = {
  // Basilosaurus : 18 mètres de long, fine comme un serpent, avec de toutes petites pattes
  basilosaure: {
    spine: { n: 17, gap: 0.42 }, body: [0.3, 0.34, 0.38, 0.42, 0.44, 0.44, 0.43, 0.42, 0.4, 0.37, 0.34, 0.3, 0.26, 0.21, 0.16, 0.11, 0.06], beat: 4, amp: 0.34,
    flipper: [3, 0.8, 0.17], legs: 'petites', head: 'serpent', fluke: 0.8, nose: 0.3, spots: 16, scars: 7,
  },
  // Livyatan : le cachalot géant, plus massif que tout le reste
  livyatan: {
    spine: { n: 9, gap: 0.46 }, body: [0.56, 0.62, 0.66, 0.64, 0.56, 0.46, 0.34, 0.2, 0.08], beat: 2.2, amp: 0.12,
    flipper: [2, 0.72, 0.2], head: 'cachalot', fluke: 1, nose: 0.25, scars: 16, spout: true,
  },
  cetothere: {
    spine: { n: 8, gap: 0.42 }, body: [0.34, 0.5, 0.58, 0.56, 0.48, 0.34, 0.2, 0.07], beat: 2.6, amp: 0.12,
    flipper: [2, 0.8, 0.17], head: 'baleine', fluke: 0.85, nose: 0.7, spots: 22, spout: true,
  },
  dorudon: {
    spine: { n: 8, gap: 0.42 }, body: [0.28, 0.4, 0.46, 0.46, 0.38, 0.28, 0.17, 0.07], beat: 4.6, amp: 0.2,
    flipper: [2, 0.6, 0.16], legs: 'petites', head: 'serpent', fluke: 0.75, nose: 0.4, spots: 8,
  },
  dugong: {
    spine: { n: 6, gap: 0.42 }, body: [0.42, 0.58, 0.66, 0.6, 0.42, 0.18], beat: 2.4, amp: 0.1,
    flipper: [1, 0.48, 0.16], head: 'dugong', fluke: 0.62, nose: 0.5, spots: 6,
  },
  ambulocete: {
    spine: { n: 8, gap: 0.4 }, body: [0.26, 0.34, 0.38, 0.38, 0.34, 0.27, 0.18, 0.07], beat: 4, amp: 0.3,
    legs: 'quatre', head: 'croco', fluke: 0.45, nose: 0.3, spots: 12,
  },
};
for (const [id, W] of Object.entries(WHALES)) {
  SPINES[id] = W.spine;
  LOOKS[id] = (ctx, c, t) => drawWhale(ctx, c, t, W, id, c.sp.color);
  SNOUT[id] = W.head === 'serpent' || W.head === 'croco' ? 1 : W.head === 'cachalot' ? 0.7 : 0.55;
  const len = (W.spine.n - 1) * W.spine.gap + 1.5;
  const r = Math.min(0.2, 0.85 / len);
  FRAMES[id] = { r, x: 0.12 + ((W.spine.n - 1) * W.spine.gap + 0.5) * r * 0.92, y: 0.42 + (W.spine.n - 1) * W.spine.gap * r * 0.17 };
}

/* ============================================================================
   Les petits : le manchot géant (il file en battant des ailes), la raie (cachée
   dans le sable : on ne voit que deux bosses), la crevette, le bazar.
   ============================================================================ */
LOOKS.manchot = (ctx, c, t) => {
  const r = c.size;
  setDetail(ctx, r);
  const a = c.angle, fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.5, r * 1.1, r * 0.45, a);
  const flap = Math.sin(t * 14 + (c.seed || 0));
  const dark = '#141C28';
  // les ailes : elles battent très vite, c'est comme ça qu'il « vole » sous l'eau
  for (const s of [-1, 1]) {
    const bx = c.x + fx * r * 0.2 + nx * r * 0.42 * s, by = c.y + fy * r * 0.2 + ny * r * 0.42 * s;
    const out = 0.65 + flap * 0.5;
    const ex = bx + nx * r * 0.95 * s * Math.max(0.3, out) - fx * r * 0.7, ey = by + ny * r * 0.95 * s * Math.max(0.3, out) - fy * r * 0.7;
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  // le corps : noir dessus, blanc sur les bords
  ctx.fillStyle = '#F4F4EE';
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, r * 1.05, r * 0.6, a, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(c.x - fx * r * 0.08, c.y - fy * r * 0.08, r * 0.92, r * 0.42, a, 0, TAU);
  ctx.fill();
  // la tête et le grand bec pointu
  const hx = c.x + fx * r * 0.8, hy = c.y + fy * r * 0.8;
  ctx.beginPath();
  ctx.arc(hx, hy, r * 0.34, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#E8A33A';
  ctx.beginPath();
  ctx.moveTo(hx + nx * r * 0.12, hy + ny * r * 0.12);
  ctx.lineTo(hx + fx * r * 0.85, hy + fy * r * 0.85);
  ctx.lineTo(hx - nx * r * 0.12, hy - ny * r * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(hx + nx * r * 0.2 * s + fx * r * 0.08, hy + ny * r * 0.2 * s + fy * r * 0.08, r * 0.09, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = INK;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(hx + nx * r * 0.2 * s + fx * r * 0.11, hy + ny * r * 0.2 * s + fy * r * 0.11, r * 0.05, 0, TAU);
    ctx.fill();
  }
};
SNOUT.manchot = 1;
FRAMES.manchot = { r: 0.26, x: 0.45, y: 0.5 };

LOOKS.raie = (ctx, c, t) => {
  const r = c.size;
  setDetail(ctx, r);
  if (c.buried) {
    // cachée dans le sable : deux petites bosses, et c'est tout…
    ctx.fillStyle = 'rgba(70, 55, 35, 0.22)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, r * 0.95, r * 0.7, c.seed, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 245, 215, 0.32)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(c.x + s * r * 0.2, c.y - r * 0.14, r * 0.1, 0, TAU);
      ctx.fill();
    }
    return;
  }
  const a = c.angle, fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  const col = c.sp.color, dark = shade(col, -0.55);
  shadow(ctx, c.x + r * 0.3, c.y + r * 0.45, r * 1.1, r * 0.7, a);
  const P = (u, v) => ({ x: c.x + fx * u * r + nx * v * r, y: c.y + fy * u * r + ny * v * r });
  // la longue queue fine
  const tail = P(-0.75, 0), wag = Math.sin(t * 4 + (c.seed || 0)) * r * 0.4;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.quadraticCurveTo(P(-1.3, 0).x + nx * wag, P(-1.3, 0).y + ny * wag, P(-1.9, 0).x - nx * wag, P(-1.9, 0).y - ny * wag);
  ctx.stroke();
  // le corps en losange : ses bords ondulent, comme un drap
  const ph = t * 7 + (c.seed || 0) * 2;
  const pts = [P(0.95, 0)];
  for (let i = 1; i <= 5; i++) { const k = i / 5; pts.push(P(0.85 - k * 1.5, (Math.sin(k * Math.PI * 0.82) * 1.2 + 0.02) * (1 + Math.sin(ph - k * 3) * 0.11))); }
  pts.push(P(-0.8, 0));
  for (let i = 5; i >= 1; i--) { const k = i / 5; pts.push(P(0.85 - k * 1.5, -(Math.sin(k * Math.PI * 0.82) * 1.2 + 0.02) * (1 + Math.sin(ph - k * 3) * 0.11))); }
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  smoothClosed(ctx, pts);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = shade(col, -0.25);
    const rnd = seeded(5);
    for (let i = 0; i < 12; i++) {
      const p = P(rnd() * 1.1 - 0.5, (rnd() - 0.5) * 1.3);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.05, 0, TAU);
      ctx.fill();
    }
  }
  for (const s of [-1, 1]) sharkEye(ctx, P(0.42, s * 0.24).x, P(0.42, s * 0.24).y, a, s, r * 0.08, c.mood);
};
SNOUT.raie = 0.9;
FRAMES.raie = { r: 0.26, x: 0.56, y: 0.48 };

LOOKS.crevette = (ctx, c, t) => {
  const r = c.size;
  const a = c.angle, fx = Math.cos(a), fy = Math.sin(a), nx = -fy, ny = fx;
  const col = c.sp.color;
  ctx.strokeStyle = shade(col, -0.2);
  ctx.lineWidth = Math.max(0.6, r * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const s of [-1, 1]) {
    const w = Math.sin(t * 8 + s) * r * 0.4;
    ctx.moveTo(c.x + fx * r * 0.7, c.y + fy * r * 0.7);
    ctx.quadraticCurveTo(c.x + fx * r * 1.4 + nx * r * 0.7 * s, c.y + fy * r * 1.4 + ny * r * 0.7 * s, c.x + fx * (r * 2 + w) + nx * r * 1.1 * s, c.y + fy * (r * 2 + w) + ny * r * 1.1 * s);
  }
  ctx.stroke();
  const flick = Math.sin(t * 12 + (c.seed || 0)) * r * 0.2;
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const k = i / 4, u = 0.9 - k * 1.9, off = Math.sin(k * 2.2) * r * 0.32 + k * flick;
    pts.push({ x: c.x + fx * u * r + nx * off, y: c.y + fy * u * r + ny * off });
  }
  ctx.strokeStyle = col;
  ctx.lineWidth = r * 0.62;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(pts[0].x, pts[0].y, Math.max(0.7, r * 0.13), 0, TAU);
  ctx.fill();
};
SNOUT.crevette = 1;
FRAMES.crevette = { r: 0.24, x: 0.48, y: 0.52 };

/** Le bazar que le requin-tigre avale : un bout de bois, un coquillage, un caillou, un vieil os */
LOOKS.bazar = (ctx, c, t) => {
  const r = c.size;
  const kind = Math.floor((c.seed || 0) * 2.6) % 4;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate((c.seed || 0) + Math.sin(t * 0.8 + (c.seed || 0)) * 0.2);
  ctx.lineWidth = Math.max(0.8, r * 0.1);
  if (kind === 0) {
    ctx.fillStyle = '#8A6238';
    ctx.strokeStyle = '#4A321A';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.2, r * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.08);
    ctx.lineTo(r * 0.8, r * 0.05);
    ctx.stroke();
  } else if (kind === 1) {
    ctx.fillStyle = '#F0C8B0';
    ctx.strokeStyle = '#9A5A4A';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.75);
    for (let i = -5; i <= 5; i++) {
      const b = -Math.PI / 2 + i * 0.3;
      ctx.lineTo(Math.cos(b) * r * (i % 2 ? 0.86 : 0.95), Math.sin(b) * r * (i % 2 ? 0.86 : 0.95));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(0, r * 0.7);
      ctx.lineTo(Math.sin(i * 0.5) * r * 0.75, -r * 0.65);
    }
    ctx.stroke();
  } else if (kind === 2) {
    ctx.fillStyle = '#8E949C';
    ctx.strokeStyle = '#4E545C';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.1);
    ctx.lineTo(-r * 0.3, -r * 0.7);
    ctx.lineTo(r * 0.5, -r * 0.55);
    ctx.lineTo(r * 0.85, r * 0.2);
    ctx.lineTo(r * 0.2, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#F4ECD8';
    ctx.strokeStyle = '#8A7A5A';
    ctx.beginPath();
    ctx.rect(-r * 0.75, -r * 0.14, r * 1.5, r * 0.28);
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ctx.moveTo(sx * r * 0.8 + r * 0.22, sy * r * 0.18);
        ctx.arc(sx * r * 0.8, sy * r * 0.18, r * 0.22, 0, TAU);
      }
    }
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
};
FRAMES.bazar = { r: 0.28, x: 0.5, y: 0.5 };
