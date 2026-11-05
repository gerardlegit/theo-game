// ============================================================================
// Les mammifères en VUE DE TROIS QUARTS (niveau 3 : la voie des mammifères ;
// niveau 4 : le loup et l'humain). Même dessinateur que les dinosaures
// (drawBeast, dans art-trois-quarts.js) : on voit le dos, le flanc tourné vers
// nous, et les pattes qui descendent jusqu'au sol. Ici, on lui donne tout ce
// qui fait un mammifère : une tête avec un museau, une truffe, des oreilles et
// des moustaches ; des crocs (ou des dents de sabre !) ; des sabots, des
// coussinets ; de la fourrure (laine, crinière, longs poils qui pendent) ; et
// pour les géants une trompe, des défenses, des cornes ou des bois.
// Aussi : les grands oiseaux coureurs, les lézards et les crocodiles, et les
// humains, debout, vus d'un peu au-dessus (de face, de dos ou de côté).
//
// Chaque espèce n'est qu'une liste de mesures (BEASTS, en × taille) ; elles
// s'appellent « tq-<nom> ». Le joueur a ses formes (de la musaraigne au tigre
// à dents de sabre, du louveteau au chien de berger) : ses évolutions se voient.
// ============================================================================

import { INK, PLAYER, LOOKS, FORMS, FRAMES, FORM_SPINE, shade, seeded, smoothClosed, spineShape, segDir, eye } from './art.js';
import { drawBeast, registerBeast, isFine3q, tooth, rimSample, cone, setDetail } from './art-trois-quarts.js';

const TAU = Math.PI * 2;
const IVORY = '#F2E8CF';
const ANTLER = '#DCCBA6';
const HORN = '#E8DCC0';
const NOSE = '#2A2024';
const PINK = '#D98A92';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Petits outils de dessin ---------- */
/** Des points le long d'une courbe de Bézier (p0 → p3) */
function bezier(p0, p1, p2, p3, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n, m = 1 - k;
    out.push({
      x: m * m * m * p0.x + 3 * m * m * k * p1.x + 3 * m * k * k * p2.x + k * k * k * p3.x,
      y: m * m * m * p0.y + 3 * m * m * k * p1.y + 3 * m * k * k * p2.y + k * k * k * p3.y,
    });
  }
  return out;
}

/** Un tube qui s'affine (trompe, défense, corne, crins) : de la largeur w0 à w1 */
function tube(ctx, pts, w0, w1, col, dark, lw) {
  const n = pts.length;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push({ x: pts[i].x - dy * w, y: pts[i].y + dx * w });
    R.push({ x: pts[i].x + dy * w, y: pts[i].y - dx * w });
  }
  const e = pts[n - 1], e2 = pts[n - 2];
  const ed = Math.hypot(e.x - e2.x, e.y - e2.y) || 1;
  const end = { x: e.x + (e.x - e2.x) / ed * w1 * 0.5, y: e.y + (e.y - e2.y) / ed * w1 * 0.5 };
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, [...L, end, ...R.reverse()]);
  ctx.fill();
  ctx.stroke();
}

/** Un trait épais, cerné de noir (les bois des cerfs) */
function stick(ctx, pts, w, col, dark, lw) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [c, k] of [[dark, w + lw * 2], [col, w]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = k;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
}

/* ============================================================================
   La tête d'un mammifère, vue d'un peu au-dessus.
   head : { l, w (longueur, largeur, × r), muzzle (largeur du museau, × w),
     tip (le bout du museau), pitch (le museau penche vers le sol : cheval),
     deep (la hauteur de la tête), stop (le museau, plus bas que le crâne),
     mdeep (la hauteur du museau), eyeY (les yeux, un peu sur l'avant), ear ('pointe', 'rond', 'petit', 'cheval',
     'long', 'tombante', 'elephant'), earR, earAt, earCol, earIn, nose ('chien',
     'chat', 'cheval', 'groin', aucun), noseR, eye [avant, écart, rayon], iris,
     teeth (des crocs), toothL, sabers (dents de sabre, × r), whiskers, brow,
     muzzleCol (false : pas de museau clair), dome (le crâne bombé du mammouth),
     tuft, beard, flanges (les bosses des joues d'Entelodon), horns ('bison',
     'rhino', 'gazelle', 'chevre'), hornL, antlers ('renne', 'megaceros'),
     antlerK, trunk (× r), tusks ('mammouth', 'deino'), tuskL }
   ============================================================================ */
function mamHead(ctx, c, t, S, h, a, fx, fy, r, col, flankCol, dark, lw, T, o) {
  const fine = isFine3q();
  const Hd = S.head;
  const HL = Hd.l * r, HW = Hd.w * r;
  const mz = Hd.muzzle ?? 0.5, tip = Hd.tip ?? 0.72;
  const pitch = (Hd.pitch ?? 0) * HL;
  const nx = -fy, ny = fx;
  const cx = h.x + fx * HL * 0.2, cy = h.y + fy * HL * 0.2;
  // un point de la tête : u vers l'avant, v sur le côté (× longueur, × largeur), dy vers le bas de l'écran
  const P = (u, v, dy = 0) => ({ x: cx + fx * HL * u + nx * HW * v, y: cy + fy * HL * u + ny * HW * v + Math.max(0, u - 0.15) * pitch + dy });
  // la hauteur de la tête : le crâne est une boule ; le museau, un peu plus bas, avance devant
  const Th = Math.max(T * (Hd.deep ?? 1), HW * 0.5);
  const open = clamp(c.mouth || 0, 0, 1);
  // (la gueule s'ouvre selon la taille de la tête, sans que la mâchoire ait l'air de se décrocher)
  const lift = open * Math.min(HL * 0.05, HW * 0.1);
  const mTop = Th * (Hd.stop ?? 0.3) - lift;              // le dessus du museau
  const mBot = Th * ((Hd.stop ?? 0.3) + (Hd.mdeep ?? 0.6)) - lift;   // le bord de la gueule
  const drop = open * Math.min(HL * 0.26, HW * 0.46);
  const jawT = Math.min(HL * 0.08, HW * 0.16);
  // les contours, vus d'en haut : le crâne rond, le museau devant (u, v ; les deux bouts sur l'axe)
  const ring = (half) => [...half, ...half.slice(1, -1).reverse().map(([u, v]) => [u, -v])];
  const SKULL = ring([[-0.52, 0], [-0.44, 0.74], [-0.16, 1], [0.14, 0.94], [0.32, 0.66], [0.4, 0]]);
  const MUZ = ring([[0.14, 0], [0.22, mz * 1.02], [tip - 0.2, mz], [tip - 0.05, mz * 0.68], [tip, 0]]);
  const at = (list, dy) => list.map(([u, v]) => P(u, v, dy));
  const near = (s) => ny * s > 0.05 || (Math.abs(ny) <= 0.05 && s > 0);
  const away = fy < -0.3;                 // il s'éloigne : on voit l'arrière de sa tête
  const hanging = Hd.ear === 'tombante' || Hd.ear === 'elephant';
  const ears = (pass) => { for (const s of [-1, 1]) if (pass(s)) earOf(ctx, Hd, s, P, fx, fy, nx, ny, HL, HW, Th, lift, col, dark, lw, t + (c.seed || 0), fine); };
  const fillStroke = (pts, fill) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, pts);
    ctx.fill();
    ctx.stroke();
  };
  const saber = (s) => {
    const b = P(tip - 0.2, s * mz * 0.78, mBot);
    const L = Hd.sabers * r;
    tooth(ctx, b.x, b.y, 1, L, L * 0.17, dark, lw);
  };

  /* ---- le crâne : la joue (le côté tourné vers nous), puis le dessus ---- */
  const skull = () => {
    fillStroke(at(SKULL, Th - lift), flankCol);
    if (Hd.flanges) {
      // les grosses bosses sous les joues d'Entelodon
      for (const s of [-1, 1]) {
        const p = P(0.12, s * 0.92, Th * 0.85);
        ctx.fillStyle = shade(flankCol, -0.08);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, HW * 0.26, HW * 0.3, a, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
    const top = at(SKULL, -lift);
    ctx.fillStyle = col;
    smoothClosed(ctx, top);
    ctx.fill();
    if (fine) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = shade(col, 0.14);
      const g = P(-0.14, 0, -lift - HW * 0.14);
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, HL * 0.32, HW * 0.55, a, 0, TAU);
      ctx.fill();
      if (S.stripes && Hd.marks !== false) {
        // les rayures du front (les tigres)
        ctx.strokeStyle = o.stripe || shade(col, -0.4);
        ctx.lineWidth = Math.max(0.8, HW * 0.08);
        ctx.lineCap = 'round';
        for (const v of [-0.4, 0, 0.4]) {
          const p0 = P(-0.4, v * 1.2, -lift), p1 = P(-0.1, v * 0.8, -lift);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, top);
    ctx.stroke();
    if (Hd.dome) {
      // le haut du crâne, tout bombé (mammouth)
      const d = P(-0.22, 0, -lift - HW * Hd.dome * 0.42);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, HL * 0.34, HW * (0.5 + Hd.dome * 0.2), a, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (fine) {
        ctx.fillStyle = shade(col, 0.14);
        ctx.beginPath();
        ctx.ellipse(d.x - HW * 0.1, d.y - HW * 0.12, HL * 0.16, HW * 0.22, a, 0, TAU);
        ctx.fill();
      }
      if (Hd.tuft && fine) {
        ctx.strokeStyle = shade(col, -0.35);
        ctx.lineWidth = Math.max(0.8, HW * 0.06);
        ctx.lineCap = 'round';
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(d.x + k * HW * 0.1, d.y - HW * 0.38);
          ctx.quadraticCurveTo(d.x + k * HW * 0.18, d.y - HW * 0.7, d.x + k * HW * 0.26 - fx * HW * 0.2, d.y - HW * 0.75);
          ctx.stroke();
        }
      }
    }
  };

  /* ---- le museau : la gueule (ouverte ou fermée), le côté, le dessus, la truffe ---- */
  const RIM = [[0.2, -mz * 1.0], [tip - 0.18, -mz * 0.92], [tip, 0], [tip - 0.18, mz * 0.92], [0.2, mz * 1.0]];
  const rim = rimSample(RIM, HL, HW, 18);
  const mc = (0.2 + tip) / 2;
  const atRim = (q, dy, k = 1) => P(mc + (q[0] - mc) * k, q[1] * k, dy);
  const nr = HW * mz * (Hd.noseR ?? 0.42) * (o.bigNose ? 1.5 : 1);
  const muzzle = () => {
    if (Hd.sabers) for (const s of [-1, 1]) if (!near(s)) saber(s);
    if (open > 0.06) {
      // le fond de la gueule, la mâchoire du bas, la gencive, la langue
      ctx.fillStyle = '#2A0810';
      ctx.beginPath();
      rim.forEach((q, i) => { const p = atRim(q, mBot); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      for (let i = rim.length - 1; i >= 0; i--) { const p = atRim(rim[i], mBot + drop); ctx.lineTo(p.x, p.y); }
      ctx.closePath();
      ctx.fill();
      fillStroke(rim.map((q) => atRim(q, mBot + drop + jawT)), shade(flankCol, -0.12));
      ctx.fillStyle = '#A03848';
      smoothClosed(ctx, rim.map((q) => atRim(q, mBot + drop, 0.84)));
      ctx.fill();
      const tg = P(mc, 0, mBot + drop);
      ctx.fillStyle = '#E58A94';
      ctx.beginPath();
      ctx.ellipse(tg.x, tg.y, HL * (tip - 0.2) * 0.42, HW * mz * 0.55, a, 0, TAU);
      ctx.fill();
      if (Hd.teeth && fine) {
        for (const s of [-1, 1]) {
          if (!near(s) && Math.abs(ny) > 0.35) continue;
          const p = P(tip - 0.12, s * mz * 0.72, mBot + drop);
          tooth(ctx, p.x, p.y, -1, (Hd.toothL ?? 0.13) * HL * 0.75, HL * 0.04, dark, lw);
        }
      }
    } else {
      // gueule fermée : le menton, sous le museau
      fillStroke(rim.map((q) => atRim(q, mBot + jawT * 0.55, 0.9)), shade(flankCol, -0.14));
    }
    if (Hd.beard) {
      // la barbe (bison, chèvre)
      const b = P(mc, 0, mBot), L = HL * 0.42 * Hd.beard;
      ctx.fillStyle = shade(col, -0.35);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.moveTo(b.x - nx * HW * 0.28, b.y - ny * HW * 0.28);
      ctx.quadraticCurveTo(b.x + fx * HL * 0.1, b.y + L * 0.7, b.x + fx * HL * 0.06, b.y + L);
      ctx.quadraticCurveTo(b.x + fx * HL * 0.18, b.y + L * 0.5, b.x + nx * HW * 0.28, b.y + ny * HW * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // le côté du museau, puis le dessus (plus clair chez les chats et les chiens)
    fillStroke(at(MUZ, mBot), flankCol);
    if (open > 0.06 && Hd.teeth && fine) {
      for (const s of [-1, 1]) {
        if (!near(s) && Math.abs(ny) > 0.35) continue;
        const p = P(tip - 0.12, s * mz * 0.72, mBot);
        tooth(ctx, p.x, p.y, 1, (Hd.toothL ?? 0.13) * HL, HL * 0.045, dark, lw);
      }
    }
    if (Hd.sabers) for (const s of [-1, 1]) if (near(s)) saber(s);
    const mtop = at(MUZ, mTop);
    fillStroke(mtop, Hd.muzzleCol === false ? col : Hd.muzzleCol || o.belly || shade(col, 0.32));
    if (fine) {
      ctx.save();
      smoothClosed(ctx, mtop);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      const g = P(mc, 0, mTop - HW * 0.1);
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, HL * (tip - 0.2) * 0.4, HW * mz * 0.5, a, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // la truffe, le nez
    const np = P(tip - 0.05, 0, mTop);
    if (Hd.nose === 'chien') {
      ctx.fillStyle = Hd.noseCol || NOSE;
      ctx.beginPath();
      ctx.ellipse(np.x, np.y + nr * 0.1, nr, nr * 0.72, a, 0, TAU);
      ctx.fill();
      if (fine) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(np.x - nr * 0.3, np.y - nr * 0.2, nr * 0.32, nr * 0.2, 0, 0, TAU);
        ctx.fill();
      }
    } else if (Hd.nose === 'chat') {
      ctx.fillStyle = Hd.noseCol || PINK;
      ctx.strokeStyle = shade(Hd.noseCol || PINK, -0.45);
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      ctx.moveTo(np.x - nx * nr * 0.9, np.y - ny * nr * 0.9);
      ctx.lineTo(np.x + nx * nr * 0.9, np.y + ny * nr * 0.9);
      ctx.lineTo(np.x + fx * nr * 0.5, np.y + fy * nr * 0.5 + nr * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (Hd.nose === 'cheval') {
      ctx.fillStyle = 'rgba(25, 15, 10, 0.7)';
      for (const s of [-1, 1]) {
        const p = P(tip - 0.07, s * mz * 0.42, mTop);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, nr * 0.42, nr * 0.3, a + s * 0.5, 0, TAU);
        ctx.fill();
      }
    } else if (Hd.nose === 'groin') {
      const g = P(tip, 0, (mTop + mBot) / 2);
      ctx.fillStyle = Hd.noseCol || shade(col, 0.22);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, nr * 1.25, nr * 1.05, a, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(25, 15, 10, 0.75)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(g.x + nx * s * nr * 0.45, g.y + ny * s * nr * 0.3, nr * 0.2, nr * 0.28, 0, 0, TAU);
        ctx.fill();
      }
    }
    // la bouche, gueule fermée : un petit « w » sous la truffe
    if (open <= 0.06 && fine && (Hd.nose === 'chien' || Hd.nose === 'chat') && !away) {
      const m0 = P(tip - 0.04, 0, mTop + nr * 0.75), m1 = P(tip - 0.03, 0, mBot - Th * 0.06);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw * 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m0.x, m0.y);
      ctx.lineTo(m1.x, m1.y);
      for (const s of [-1, 1]) {
        const m2 = P(tip - 0.18, s * mz * 0.62, mBot - Th * 0.1);
        ctx.moveTo(m1.x, m1.y);
        ctx.quadraticCurveTo((m1.x + m2.x) / 2, Math.max(m1.y, m2.y) + Th * 0.12, m2.x, m2.y);
      }
      ctx.stroke();
    }
    // les moustaches
    if ((Hd.whiskers || o.whiskers) && fine) {
      ctx.strokeStyle = 'rgba(250, 245, 235, 0.85)';
      ctx.lineWidth = Math.max(0.6, r * 0.012);
      for (const s of [-1, 1]) {
        const b = P(tip - 0.14, s * mz * 0.8, (mTop + mBot) / 2);
        for (const k of [-0.18, 0, 0.18]) {
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.quadraticCurveTo(b.x + nx * s * HW * 0.5, b.y + ny * s * HW * 0.5 + k * HW * 0.4, b.x + nx * s * HW * 0.95 + fx * HL * k, b.y + ny * s * HW * 0.95 + fy * HL * k + HW * 0.15);
          ctx.stroke();
        }
      }
    }
    // les cornes du rhinocéros, sur le museau
    if (Hd.horns === 'rhino') hornOf(ctx, Hd, 0, P, fx, fy, nx, ny, HL, HW, -mTop, dark, lw);
  };

  /* ---- les yeux, sur l'avant du crâne, au-dessus du museau ---- */
  const [eu, ev, er] = Hd.eye || [0.16, 0.44, 0.12];
  const R = Math.min(r * er, HW * 0.3, HL * 0.24) * (o.cute ? 1.25 : 1);
  const eyeY = Th * (Hd.eyeY ?? 0.12) - lift;
  const eyes = () => {
    for (const s of [-1, 1]) {
      // de dos, on ne voit pas les yeux ; de trois quarts arrière, seulement celui de notre côté
      if (away && (fy < -0.8 || !near(s))) continue;
      // de profil, l'œil de l'autre côté est caché par la tête
      if (!near(s) && Math.abs(ny) > 0.8) continue;
      const p = P(eu, s * ev, eyeY);
      if (Hd.brow && fine) {
        ctx.fillStyle = shade(col, -0.25);
        ctx.beginPath();
        ctx.ellipse(p.x + fx * R * 0.5, p.y + fy * R * 0.5 - R * 0.7, R * 1.3, R * 0.6, a, 0, TAU);
        ctx.fill();
      }
      eye(ctx, p.x, p.y, R, fx, fy, c.mood || 'calm', c.blink || 0, s, Hd.iris || INK);
    }
  };

  // derrière la tête : l'oreille du fond qui pend
  if (hanging) ears((s) => !near(s));
  if (away) {
    // il s'éloigne : le museau passe derrière le crâne
    muzzle();
    skull();
    if (hanging) ears((s) => near(s));
    eyes();
    if (!hanging) ears(() => true);
  } else {
    skull();
    if (!hanging) ears(() => true);
    if (hanging) ears((s) => near(s));
    muzzle();
    eyes();
  }
  // les cornes, les bois (sur le haut du crâne)
  if (Hd.horns && Hd.horns !== 'rhino') for (const s of [-1, 1]) hornOf(ctx, Hd, s, P, fx, fy, nx, ny, HL, HW, lift, dark, lw);
  if (Hd.antlers) for (const s of [-1, 1]) antlerOf(ctx, Hd, s, P, fx, fy, nx, ny, HW, lift, dark, lw, r);
  // les défenses et la trompe (la défense du fond, la trompe au milieu, puis l'autre défense)
  if (Hd.tusks) for (const s of [-1, 1]) if (!near(s)) tuskOf(ctx, Hd, s, P, fx, fy, nx, ny, HW, mBot, r, mz, tip, dark, lw);
  if (Hd.trunk) {
    const L = Hd.trunk * r;
    const b = P(tip - 0.04, 0, (mTop + mBot) / 2);
    const sw = Math.sin(t * 1.6 + (c.seed || 0)) * 0.14;
    const up = open * L * 0.9;          // il barrit : la trompe se lève !
    const pt = (f, side, down, k = 1) => ({ x: b.x + fx * L * f + nx * L * side, y: b.y + fy * L * f + ny * L * side + L * down - up * k });
    const pts = bezier(b, pt(0.3, 0, 0.18, 0.2), pt(0.3, sw, 0.72, 1), pt(0.5, sw * 1.6, 0.92, 1.4), 14);
    const w0 = HW * mz * 0.75;
    tube(ctx, pts, w0, w0 * 0.42, col, dark, lw);
    if (fine) {
      // les plis de la trompe
      ctx.strokeStyle = shade(col, -0.3);
      ctx.lineWidth = lw * 0.6;
      for (let i = 3; i < pts.length - 1; i += 2) {
        const p = pts[i], q = pts[i + 1];
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        const w = (w0 + (w0 * 0.42 - w0) * (i / (pts.length - 1))) * 0.42;
        ctx.beginPath();
        ctx.moveTo(p.x - dy / d * w, p.y + dx / d * w);
        ctx.lineTo(p.x + dy / d * w, p.y - dx / d * w);
        ctx.stroke();
      }
    }
  }
  if (Hd.tusks) for (const s of [-1, 1]) if (near(s)) tuskOf(ctx, Hd, s, P, fx, fy, nx, ny, HW, mBot, r, mz, tip, dark, lw);
}

/* ---------- Les oreilles ---------- */
function earOf(ctx, Hd, s, P, fx, fy, nx, ny, HL, HW, Th, lift, col, dark, lw, t, fine) {
  const type = Hd.ear || 'pointe';
  const k = { pointe: 0.75, rond: 0.5, petit: 0.32, cheval: 0.72, long: 1.35, tombante: 0.85, elephant: 0.72 }[type] ?? 0.6;
  const L = HW * (Hd.earR ?? 1) * k;
  const earCol = Hd.earCol || shade(col, -0.08);
  const inner = Hd.earIn || shade(col, -0.38);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  if (type === 'elephant') {
    // une grande oreille plate, sur le côté de la tête (elle s'évente doucement)
    const p = P(-0.28, s * 0.9, Th * 0.4);
    const flap = 0.88 + Math.sin(t * 2.2) * 0.12;
    ctx.fillStyle = shade(col, -0.06);
    ctx.beginPath();
    ctx.ellipse(p.x + nx * s * L * 0.25 * flap, p.y + ny * s * L * 0.15, L * 0.55 * flap, L * 0.78, Math.atan2(fy, fx) * 0.25, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.fillStyle = shade(col, -0.25);
      ctx.beginPath();
      ctx.ellipse(p.x + nx * s * L * 0.18 * flap, p.y + ny * s * L * 0.12 + L * 0.05, L * 0.32 * flap, L * 0.5, Math.atan2(fy, fx) * 0.25, 0, TAU);
      ctx.fill();
    }
    return;
  }
  if (type === 'tombante') {
    // une oreille toute molle, qui pend le long de la joue
    const b = P(-0.2, s * 0.86, -lift);
    let dx = nx * s * 0.3 - fx * 0.15, dy = 1 + ny * s * 0.3 - fy * 0.15;
    const d = Math.hypot(dx, dy);
    dx /= d;
    dy /= d;
    ctx.fillStyle = earCol;
    ctx.beginPath();
    ctx.ellipse(b.x + dx * L * 0.48, b.y + dy * L * 0.48, L * 0.56, L * 0.32, Math.atan2(dy, dx), 0, TAU);
    ctx.fill();
    ctx.stroke();
    return;
  }
  // une oreille debout : vers le haut de l'écran, un peu vers l'arrière et vers l'extérieur
  const [eu, ev] = Hd.earAt || [-0.3, 0.6];
  const b = P(eu, s * ev, -lift);
  let dx = -fx * 0.35 + nx * s * 0.55, dy = -1 - fy * 0.35 + ny * s * 0.55;
  const d = Math.hypot(dx, dy);
  dx /= d;
  dy /= d;
  const px = -dy, py = dx;
  const shape = (k, w) => {
    ctx.beginPath();
    if (type === 'pointe' || type === 'cheval') {
      const W = L * (type === 'cheval' ? 0.42 : 0.6) * w;
      const tx = b.x + dx * L * k, ty = b.y + dy * L * k;
      ctx.moveTo(b.x + px * W, b.y + py * W);
      ctx.quadraticCurveTo(b.x + dx * L * k * 0.6 + px * W * 0.75, b.y + dy * L * k * 0.6 + py * W * 0.75, tx, ty);
      ctx.quadraticCurveTo(b.x + dx * L * k * 0.6 - px * W * 0.75, b.y + dy * L * k * 0.6 - py * W * 0.75, b.x - px * W, b.y - py * W);
      ctx.closePath();
    } else {
      const ry = type === 'long' ? L * 0.2 : L * 0.46;
      ctx.ellipse(b.x + dx * L * 0.5 * k, b.y + dy * L * 0.5 * k, L * 0.55 * k, ry * w, Math.atan2(dy, dx), 0, TAU);
    }
  };
  ctx.fillStyle = earCol;
  shape(1, 1);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = inner;
    shape(0.68, 0.55);
    ctx.fill();
  }
}

/* ---------- Les cornes (bison, aurochs, rhinocéros, gazelle, chèvre) ---------- */
function hornOf(ctx, Hd, s, P, fx, fy, nx, ny, HL, HW, lift, dark, lw) {
  const k = Hd.hornL ?? 1;
  const col = Hd.hornCol || HORN;
  // un point à partir de la base b : f vers l'avant, o vers l'extérieur, u vers le haut (× L)
  const V = (b, L, f, o2, u) => ({ x: b.x + fx * L * f + nx * s * L * o2, y: b.y + fy * L * f + ny * s * L * o2 - L * u });
  if (Hd.horns === 'rhino') {
    // deux cornes sur le museau, la grande devant
    const b1 = P((Hd.tip ?? 0.72) - 0.16, 0, -lift), L1 = HL * 0.8 * k;
    const b2 = P(0.28, 0, -lift), L2 = L1 * 0.45;
    cone(ctx, b2.x, b2.y, b2.x + fx * L2 * 0.3, b2.y + fy * L2 * 0.3 - L2, HW * 0.12, col, dark, lw);
    const pts = bezier(b1, V(b1, L1, 0.15, 0, 0.45), V(b1, L1, 0.35, 0, 0.85), V(b1, L1, 0.6, 0, 1));
    tube(ctx, pts, HW * 0.3, HW * 0.03, col, dark, lw);
    return;
  }
  if (Hd.horns === 'bison') {
    // elles partent sur les côtés, puis remontent (aurochs : beaucoup plus longues, vers l'avant)
    const b = P(-0.25, s * 0.82, -lift), L = HW * 0.6 * k;
    const fw = k > 1.2 ? 0.35 : 0.05;
    const pts = bezier(b, V(b, L, fw * 0.5, 0.6, 0.05), V(b, L, fw, 0.95, 0.45), V(b, L, fw * 1.3, 0.7, 0.8));
    tube(ctx, pts, HW * 0.22, HW * 0.04, col, dark, lw);
    return;
  }
  // gazelle, chèvre : fines et annelées, vers l'arrière
  const b = P(-0.12, s * 0.3, -lift), L = HW * 1.3 * k;
  const goat = Hd.horns === 'chevre';
  const pts = goat
    ? bezier(b, V(b, L, -0.05, 0.05, 0.55), V(b, L, -0.55, 0.12, 0.85), V(b, L, -0.85, 0.15, 0.45))
    : bezier(b, V(b, L, -0.15, 0.06, 0.5), V(b, L, -0.4, 0.1, 0.85), V(b, L, -0.7, 0.16, 0.95));
  tube(ctx, pts, HW * 0.16, HW * 0.03, Hd.hornCol || '#5A4A3A', dark, lw);
  if (isFine3q()) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = lw * 0.6;
    for (let i = 2; i < pts.length - 3; i += 2) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, HW * 0.06, 0, Math.PI);
      ctx.stroke();
    }
  }
}

/* ---------- Les bois (renne, mégacéros) ---------- */
function antlerOf(ctx, Hd, s, P, fx, fy, nx, ny, HW, lift, dark, lw, r) {
  const L = HW * (Hd.antlerK ?? 1.2);
  const b = P(-0.2, s * 0.32, -lift);
  const V = (f, o2, u) => ({ x: b.x + fx * L * f + nx * s * L * o2, y: b.y + fy * L * f + ny * s * L * o2 - L * u });
  const w = Math.max(1, r * 0.045);
  if (Hd.antlers === 'megaceros') {
    // une longue branche vers l'extérieur, puis une immense « main » plate
    const beam = bezier(b, V(-0.05, 0.3, 0.15), V(-0.05, 0.6, 0.25), V(0, 0.85, 0.35), 8);
    stick(ctx, beam, w * 1.3, ANTLER, dark, lw);
    const E = beam[beam.length - 1];
    const palm = [E];
    const tips = 6;
    for (let j = 0; j <= tips; j++) {
      const th = -0.5 + (j / tips) * 2.3;          // de l'avant vers le haut, puis vers l'arrière
      const R = 0.55;
      const out = Math.cos(th) * 0.35 + 0.35, up = Math.sin(th) * 0.45 + 0.25, fw = Math.cos(th) * 0.25;
      palm.push({ x: E.x + fx * L * fw * R + nx * s * L * out * R * 1.6 + 0, y: E.y + fy * L * fw * R + ny * s * L * out * R * 1.6 - L * up * R * 1.6 });
      if (j < tips) {
        const th2 = th + 1.15 / tips;
        const out2 = Math.cos(th2) * 0.35 + 0.35, up2 = Math.sin(th2) * 0.45 + 0.25, fw2 = Math.cos(th2) * 0.25;
        palm.push({ x: E.x + fx * L * fw2 * 0.6 + nx * s * L * out2 * 0.6, y: E.y + fy * L * fw2 * 0.6 + ny * s * L * out2 * 0.6 - L * up2 * 0.6 });
      }
    }
    ctx.fillStyle = ANTLER;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    palm.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // la petite pointe de devant
    stick(ctx, [V(0.02, 0.12, 0.08), V(0.3, 0.18, 0.2)], w, ANTLER, dark, lw);
    return;
  }
  // le renne : une grande branche qui remonte vers l'avant, des pointes, et la « pelle » devant le front
  const beam = bezier(b, V(-0.3, 0.3, 0.45), V(-0.25, 0.42, 1.0), V(0.15, 0.3, 1.3), 10);
  stick(ctx, beam, w, ANTLER, dark, lw);
  for (const [i, f, o2, u] of [[3, 0.3, 0.05, 0.22], [6, 0.28, 0.12, 0.2], [10, 0.12, -0.08, 0.2], [10, 0.22, 0.12, 0.05]]) {
    const p = beam[i];
    stick(ctx, [p, { x: p.x + fx * L * f + nx * s * L * o2, y: p.y + fy * L * f + ny * s * L * o2 - L * u }], w * 0.8, ANTLER, dark, lw);
  }
  stick(ctx, [V(0.02, 0.05, 0.12), V(0.35, 0.02, 0.18), V(0.48, -0.02, 0.1)], w * 0.9, ANTLER, dark, lw);
}

/* ---------- Les défenses (mammouth : en spirale ; Deinotherium : vers le bas, en crochet) ---------- */
function tuskOf(ctx, Hd, s, P, fx, fy, nx, ny, HW, Th, r, mz, tip, dark, lw) {
  const L = r * (Hd.tuskL ?? 0.8);
  if (Hd.tusks === 'deino') {
    const b = P(tip - 0.1, s * mz * 0.38, Th * 1.05);
    const V = (f, o2, d) => ({ x: b.x + fx * L * f + nx * s * L * o2, y: b.y + fy * L * f + ny * s * L * o2 + L * d });
    tube(ctx, bezier(b, V(0.1, 0.02, 0.35), V(0.02, 0.05, 0.62), V(-0.3, 0.06, 0.66)), HW * 0.16, HW * 0.05, IVORY, dark, lw);
    return;
  }
  const b = P(tip - 0.24, s * mz * 0.72, Th * 0.75);
  const V = (f, o2, d) => ({ x: b.x + fx * L * f + nx * s * L * o2, y: b.y + fy * L * f + ny * s * L * o2 + L * d });
  tube(ctx, bezier(b, V(0.45, 0.08, 0.42), V(0.98, 0.42, 0.25), V(0.72, 0.12, -0.22), 14), HW * 0.2, HW * 0.06, IVORY, dark, lw);
}

/* ============================================================================
   La fourrure : sous le corps (la queue en crins, si elle passe derrière), sur
   le dos (crinière, laine, cape, taches, touffes), devant (les longs poils qui
   pendent sous le ventre, qui couvrent le haut des pattes).
   ============================================================================ */
/** La queue en crins d'un cheval (ou la petite queue d'un éléphant), qui pend vers le sol */
function hangingTail(ctx, X) {
  const { S, P, pts, full, n, r, col, dark, lw, H } = X;
  const C = S.crin;
  const i = Math.min(n - 1, Math.round(C.at * (full - 1)));
  const d = segDir(pts, i);
  const b = P[i];
  const L = C.len * r;
  const sw = Math.sin(X.t * 2 + (X.c.seed || 0)) * 0.1;
  const p = (f, side, down) => ({ x: b.x - d.x * L * f - d.y * L * side, y: b.y - d.y * L * f + d.x * L * side + down * Math.min(L, H * 0.95) });
  const tcol = C.col || shade(col, -0.45);
  const pts2 = bezier(b, p(0.3, 0, 0.1), p(0.38, sw, 0.6), p(0.3, sw * 1.5, 1), 10);
  if (C.w) {
    tube(ctx, pts2, C.w * r * 0.5, C.w * r, tcol, dark, lw);
    if (isFine3q()) {
      ctx.strokeStyle = shade(tcol, 0.25);
      ctx.lineWidth = lw * 0.6;
      for (const k of [-0.25, 0.1]) {
        ctx.beginPath();
        pts2.forEach((q, j) => { const x = q.x + k * C.w * r * (j / 10), y = q.y; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      }
    }
  } else {
    // une fine queue, avec une touffe au bout
    stick(ctx, pts2, Math.max(1, r * 0.035), col, dark, lw);
    const e = pts2[pts2.length - 1];
    ctx.fillStyle = tcol;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + r * 0.04, r * 0.06, r * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}
const tailBehind = (X) => {
  const i = Math.min(X.n - 1, Math.round(X.S.crin.at * (X.full - 1)));
  return segDir(X.pts, i).y > 0.15;
};

function furUnder(ctx, X) {
  if (X.S.crin && tailBehind(X)) hangingTail(ctx, X);
}

function furOver(ctx, X) {
  const { S, P, pts, widths, n, full, r, col, dark, lw, o } = X;
  const fine = isFine3q();
  const idx = (f) => Math.min(n - 1, Math.round(f * (full - 1)));
  // la « selle » plus sombre sur le dos (loups, chiens)
  if (S.saddle && fine) {
    const i0 = idx(S.saddle[0]), i1 = idx(S.saddle[1]);
    if (i1 > i0 + 1) {
      ctx.fillStyle = o.stripe || shade(col, -0.22);
      ctx.globalAlpha = 0.75;
      smoothClosed(ctx, spineShape(P.slice(i0, i1 + 1), widths.slice(i0, i1 + 1).map((w, k) => w * (0.4 + 0.3 * Math.sin((k / (i1 - i0)) * Math.PI))), 0.5));
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  // la cape de longs poils sombres sur l'avant du corps (bison)
  if (S.cape) {
    const i1 = idx(S.cape);
    const sub = P.slice(0, i1 + 1), w2 = widths.slice(0, i1 + 1).map((w) => w * 1.08 + r * 0.03);
    ctx.fillStyle = shade(col, -0.3);
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    smoothClosed(ctx, spineShape(sub, w2, 0.7));
    ctx.fill();
    ctx.stroke();
    if (fine) tufts(ctx, spineShape(sub, w2, 0.7), sub, r * 0.09, shade(col, -0.3), dark, lw, 2);
  }
  // les taches (le joueur au pelage tacheté, le saint-bernard)
  const patch = S.patches || (o.patch ? { col: o.patch, n: 3 } : null);
  if (patch && fine) {
    const rnd = seeded(7 + patch.n * 13);
    ctx.fillStyle = patch.col;
    for (let k = 0; k < patch.n; k++) {
      const i = 1 + Math.floor(rnd() * Math.max(1, idx(S.tailAt ?? 0.6) - 1));
      const d = segDir(pts, i), u = (rnd() - 0.5) * 0.9 * widths[i];
      ctx.beginPath();
      ctx.ellipse(P[i].x - d.y * u, P[i].y + d.x * u, r * (0.12 + rnd() * 0.08), r * (0.09 + rnd() * 0.05), rnd() * 3, 0, TAU);
      ctx.fill();
    }
  }
  // la laine du mouton : un gros nuage tout bouclé
  if (S.wool) {
    const i1 = idx(S.woolTo ?? 0.7);
    const blobs = [];
    for (let i = 0; i <= i1; i++) {
      const d = segDir(pts, i), w = widths[i];
      for (const [v, dy, k] of [[-0.78, X.T * 0.55, 0.42], [0.78, X.T * 0.55, 0.42], [-0.45, 0, 0.45], [0.45, 0, 0.45], [0, -X.T * 0.15, 0.5]]) {
        blobs.push({ x: P[i].x - d.y * w * v, y: P[i].y + d.x * w * v + dy, R: w * k });
      }
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw * 2;
    for (const b of blobs) { ctx.beginPath(); ctx.arc(b.x, b.y, b.R, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = shade(S.wool, -0.1);
    for (const b of blobs) { ctx.beginPath(); ctx.arc(b.x, b.y, b.R, 0, TAU); ctx.fill(); }
    if (fine) {
      ctx.fillStyle = S.wool;
      for (const b of blobs) { ctx.beginPath(); ctx.arc(b.x - b.R * 0.15, b.y - b.R * 0.2, b.R * 0.72, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = shade(S.wool, -0.25);
      ctx.lineWidth = lw * 0.6;
      for (let k = 0; k < blobs.length; k += 2) {
        const b = blobs[k];
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.R * 0.35, 0.5, 4);
        ctx.stroke();
      }
    }
  }
  // la crinière du cheval, la crête de poils (hyène, Entelodon)
  if (S.mane || S.ridge) {
    const i1 = idx(S.mane || S.ridge);
    const mcol = S.maneCol || shade(col, -0.5);
    if (fine) {
      ctx.fillStyle = mcol;
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw * 0.7;
      for (let i = 0; i < i1; i++) {
        for (const k of [0, 0.5]) {
          const x = P[i].x + (P[i + 1].x - P[i].x) * k, y = P[i].y + (P[i + 1].y - P[i].y) * k;
          const hh = r * (S.mane ? 0.09 : 0.11) * (1 - (i + k) / (i1 + 1) * 0.5);
          const d = segDir(pts, i);
          ctx.beginPath();
          ctx.moveTo(x + d.x * r * 0.05, y + d.y * r * 0.05);
          ctx.lineTo(x - d.x * r * 0.04, y - d.y * r * 0.04 - hh);
          ctx.lineTo(x - d.x * r * 0.05, y - d.y * r * 0.05);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }
  // les touffes de poils sur les bords du corps
  if (S.fur && fine) {
    const i1 = idx(S.tailAt ?? 0.6);
    const sub = P.slice(0, i1 + 1);
    tufts(ctx, spineShape(sub, widths.slice(0, i1 + 1), 0.6), sub, r * S.fur, col, dark, lw, 1);
  }
  // les ailes repliées des oiseaux coureurs
  if (S.wing) {
    const i = idx(0.3);
    const d = segDir(pts, i);
    for (const s of [-1, 1]) {
      const ox = -d.y * s, oy = d.x * s;
      const b = { x: P[i].x + ox * widths[i] * 0.75, y: P[i].y + oy * widths[i] * 0.75 + X.T * 0.3 };
      ctx.fillStyle = shade(col, -0.18);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.ellipse(b.x - d.x * r * S.wing * 0.5, b.y - d.y * r * S.wing * 0.5, r * S.wing, r * S.wing * 0.42, Math.atan2(d.y, d.x), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }
  // le bout de la queue : une touffe (lion, bison), un pompon (lapin), un éventail de plumes
  if (n === full) {
    const tp = P[n - 1], td = segDir(pts, n - 1);
    if (S.tuft) {
      ctx.fillStyle = S.tuftCol || shade(col, -0.45);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.ellipse(tp.x - td.x * r * S.tuft * 0.5, tp.y - td.y * r * S.tuft * 0.5, r * S.tuft * 1.3, r * S.tuft * 0.8, Math.atan2(td.y, td.x), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    if (S.pompon) {
      ctx.fillStyle = '#F6F2EA';
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y - r * S.pompon * 0.3, r * S.pompon, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    if (S.fan) {
      ctx.fillStyle = shade(col, -0.25);
      ctx.strokeStyle = dark;
      ctx.lineWidth = lw * 0.8;
      for (const k of [-0.5, 0, 0.5]) {
        const ang = Math.atan2(-td.y, -td.x) + k * 0.6;
        ctx.beginPath();
        ctx.ellipse(tp.x + Math.cos(ang) * r * S.fan * 0.6, tp.y + Math.sin(ang) * r * S.fan * 0.6, r * S.fan * 0.7, r * S.fan * 0.25, ang, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  if (S.crin && !tailBehind(X)) hangingTail(ctx, X);
}

/** Des touffes de poils tout autour d'un contour : de petites bosses toutes douces (pas sur le museau) */
function tufts(ctx, outline, pts, L, col, dark, lw, step) {
  const n = pts.length;
  const centerOf = (j) => {
    // spineShape : [devant, côté gauche (n points), derrière, côté droit (à l'envers)]
    if (j >= 1 && j <= n) return pts[j - 1];
    if (j >= n + 2) return pts[2 * n + 1 - j];
    return null;
  };
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.8;
  for (let j = 2; j < outline.length; j += step) {
    if (j === n + 1) continue;
    const c0 = centerOf(j);
    if (!c0 || c0 === pts[0]) continue;
    const p = outline[j];
    const ang = Math.atan2(p.y - c0.y, p.x - c0.x);
    if (Math.sin(ang) < -0.35) continue;     // (pas sur le haut du dos : on dirait des pointes)
    const R = L * 0.75;
    const x = p.x + Math.cos(ang) * L * 0.2, y = p.y + Math.sin(ang) * L * 0.2;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, R, ang - 1.3, ang + 1.3);
    ctx.stroke();
  }
}

/** Devant : les longs poils qui pendent sous le ventre (mammouth, rhinocéros laineux, bison) */
function furLast(ctx, X) {
  const { S, P, pts, widths, n, full, r, col, dark, lw, T } = X;
  if (!S.shaggy) return;
  const i1 = Math.min(n - 1, Math.round((S.shagTo ?? 0.65) * (full - 1)));
  const L = S.shaggy * r;
  const hair = shade(col, -0.12);
  const edge = [];
  for (let i = 0; i <= i1; i++) {
    const d = segDir(pts, i);
    // le bord du flanc tourné vers le bas de l'écran
    const s = d.x >= 0 ? 1 : -1;
    const ox = -d.y * s, oy = d.x * s;
    edge.push({ x: P[i].x + ox * widths[i] * 0.95, y: P[i].y + oy * widths[i] * 0.95 + T * 0.9 });
  }
  const rnd = seeded(31);
  ctx.fillStyle = hair;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw * 0.8;
  ctx.lineJoin = 'round';
  for (let i = 0; i < edge.length - 1; i++) {
    const a = edge[i], b = edge[i + 1];
    const k = 3;
    for (let j = 0; j < k; j++) {
      const u0 = j / k, u1 = (j + 1) / k, um = (u0 + u1) / 2;
      const x0 = a.x + (b.x - a.x) * u0, y0 = a.y + (b.y - a.y) * u0;
      const x1 = a.x + (b.x - a.x) * u1, y1 = a.y + (b.y - a.y) * u1;
      const xm = a.x + (b.x - a.x) * um, ym = a.y + (b.y - a.y) * um;
      const len = L * (0.7 + rnd() * 0.5) * (i === 0 ? 0.7 : 1);
      ctx.beginPath();
      ctx.moveTo(x0, y0 - L * 0.3);
      ctx.lineTo(x0, y0);
      ctx.quadraticCurveTo(xm - (x1 - x0) * 0.2, ym + len * 0.6, xm + Math.sin(X.t * 2 + i + j) * L * 0.05, ym + len);
      ctx.quadraticCurveTo(xm + (x1 - x0) * 0.3, ym + len * 0.5, x1, y1);
      ctx.lineTo(x1, y1 - L * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(xm - (x1 - x0) * 0.2, ym + len * 0.6, xm + Math.sin(X.t * 2 + i + j) * L * 0.05, ym + len);
      ctx.quadraticCurveTo(xm + (x1 - x0) * 0.3, ym + len * 0.5, x1, y1);
      ctx.stroke();
    }
  }
}

/* ============================================================================
   La tête d'un grand oiseau coureur : une petite tête ronde… et un bec énorme,
   crochu, haut comme une hache.
   head : { l, w, beakL (× l), beakD (hauteur du bec, × r), beakCol, crest, iris }
   ============================================================================ */
function birdHead(ctx, c, t, S, h, a, fx, fy, r, col, flankCol, dark, lw, T, o) {
  const fine = isFine3q();
  const Hd = S.head;
  const HL = Hd.l * r, HW = Hd.w * r, BD = Hd.beakD * r;
  const nx = -fy, ny = fx;
  const cx = h.x + fx * HL * 0.15, cy = h.y + fy * HL * 0.15;
  const P = (u, v, dy = 0) => ({ x: cx + fx * HL * u + nx * HW * v, y: cy + fy * HL * u + ny * HW * v + dy });
  const Th = T * 0.75;
  const open = clamp(c.mouth || 0, 0, 1);
  const tipU = 0.35 + Hd.beakL;
  const bc = Hd.beakCol;
  // le bec : le dessus, puis sa hauteur (profonde près de la tête, fine au bout)
  const half = [[0.25, 0.62], [0.55, 0.5], [tipU - 0.35, 0.32], [tipU - 0.1, 0.14], [tipU, 0]];
  const loop = [...half, ...half.slice(0, -1).reverse().map(([u, v]) => [u, -v])];
  const depth = (u) => BD * (1 - 0.55 * clamp((u - 0.25) / (tipU - 0.25), 0, 1));
  const drop = open * BD * 0.8;
  // la crête de plumes, derrière la tête
  if (Hd.crest && fine) {
    ctx.strokeStyle = shade(col, -0.35);
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, HW * 0.16);
    for (const k of [-0.3, 0, 0.3]) {
      const b = P(-0.3, k);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x - fx * HL * 0.4, b.y - fy * HL * 0.4 - HW * 0.5, b.x - fx * HL * 0.7 + nx * k * HW, b.y - fy * HL * 0.7 + ny * k * HW - HW * 0.35);
      ctx.stroke();
    }
  }
  // la tête ronde : la joue, puis le dessus
  for (const [dy, fill] of [[Th, flankCol], [0, col]]) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = dark;
    ctx.lineWidth = lw;
    ctx.beginPath();
    const p = P(0, 0, dy);
    ctx.ellipse(p.x, p.y, HL * 0.55, HW, a, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // gueule ouverte : la mâchoire du bas, et le fond tout sombre
  if (open > 0.06) {
    ctx.fillStyle = '#2A0810';
    ctx.beginPath();
    loop.forEach(([u, v], i) => { const p = P(u, v * 0.8, depth(u) * 0.55); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(bc, -0.25);
    ctx.strokeStyle = dark;
    smoothClosed(ctx, loop.map(([u, v]) => P(u * 0.95, v * 0.8, depth(u) * 0.75 + drop)));
    ctx.fill();
    ctx.stroke();
  }
  // le côté du bec, puis le dessus
  ctx.fillStyle = shade(bc, -0.22);
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  smoothClosed(ctx, loop.map(([u, v]) => P(u, v, depth(u) * (open > 0.06 ? 0.55 : 1))));
  ctx.fill();
  ctx.stroke();
  // le crochet, au bout
  const hk = P(tipU - 0.02, 0, 0), hk2 = P(tipU + 0.06, 0, BD * 0.45), hk3 = P(tipU - 0.14, 0, BD * 0.32);
  ctx.fillStyle = shade(bc, -0.35);
  ctx.beginPath();
  ctx.moveTo(hk.x, hk.y);
  ctx.quadraticCurveTo(hk2.x + fx * HL * 0.05, hk2.y - BD * 0.1, hk2.x, hk2.y);
  ctx.lineTo(hk3.x, hk3.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = bc;
  smoothClosed(ctx, loop.map(([u, v]) => P(u, v)));
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const g = P(0.6, 0, -BD * 0.05);
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, HL * 0.35, HW * 0.18, a, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(25, 15, 10, 0.6)';
    for (const s of [-1, 1]) {
      const p = P(0.65, s * 0.3);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, HW * 0.1, HW * 0.06, a, 0, TAU);
      ctx.fill();
    }
  }
  // les yeux, sur les côtés, sous un sourcil fâché
  const R = Math.min(HW * 0.32, r * 0.12) * (o.cute ? 1.2 : 1);
  for (const s of [-1, 1]) {
    const p = P(0.05, s * 0.62);
    if (fine) {
      ctx.fillStyle = shade(col, -0.3);
      ctx.beginPath();
      ctx.ellipse(p.x + fx * R * 0.4, p.y + fy * R * 0.4 - R * 0.6, R * 1.25, R * 0.55, a, 0, TAU);
      ctx.fill();
    }
    eye(ctx, p.x, p.y, R, fx, fy, c.mood || 'calm', c.blink || 0, s, Hd.iris || '#F2C14E');
  }
}

/* ============================================================================
   Les humains, debout, vus d'un peu au-dessus : de face quand ils descendent
   (vers le bas de l'écran), de dos quand ils montent, de côté sinon.
   Une tunique en fourrure, des jambières en cuir. o : { spear (le chasseur et
   sa lance), crook (le berger et son bâton), child (un enfant) }. Quand ils te
   chassent (« Ouste ! »), ils lèvent le bras en criant.
   ============================================================================ */
const SKINS = ['#C68A5A', '#8D5A3A', '#E2B48A', '#A8704A'];
const HAIR = ['#2A1C14', '#4A2E1A', '#1C1411', '#6A4628'];

function drawPerson(ctx, c, t, o) {
  const ch = !!o.child;
  const r = c.size * (ch ? 0.92 : 1);
  setDetail(ctx, r);
  const fine = isFine3q();
  const i = Math.floor((c.seed || 0) * 7) % 4;
  const skin = SKINS[i], hair = HAIR[(i + 1) % 4];
  const col = c.sp.color;
  const dark = shade(col, -0.55);
  const skinDark = shade(skin, -0.5);
  const lw = Math.max(0.8, r * 0.035);
  const legCol = '#6A4A30';
  const fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  // vers la droite de la personne, sur l'écran (de côté, ce côté-là est tourné vers nous)
  const px = -fy, py = fx;
  const wide = 0.5 + 0.5 * Math.abs(fy);
  const ph = (c.walk || 0) * 2.4;
  const sw = Math.sin(ph);
  const bob = Math.abs(Math.cos(ph)) * 0.03 * r;
  const x = c.x, y = c.y - bob;
  const footY = c.y + (ch ? 0.75 : 0.95) * r;
  const hipY = y + (ch ? 0.3 : 0.22) * r;
  const shY = y - (ch ? 0.22 : 0.5) * r;
  const headR = (ch ? 0.3 : 0.24) * r;
  const headY = shY - headR * 1.25;
  const angry = c.state === 'charge' || c.state === 'alert';
  // l'ombre
  ctx.fillStyle = 'rgba(0, 25, 15, 0.22)';
  ctx.beginPath();
  ctx.ellipse(c.x, footY, r * 0.34, r * 0.12, 0, 0, TAU);
  ctx.fill();
  // les jambes (celle du fond d'abord) : elles avancent dans le sens de la marche
  const legs = [-1, 1].map((s) => {
    const hx = x + px * s * 0.09 * r * wide, hy = hipY + py * s * 0.02 * r;
    const step = s * sw;
    const foot = { x: hx + fx * step * 0.17 * r, y: footY + fy * step * 0.07 * r + py * s * 0.03 * r - Math.max(0, -step * fy) * 0.02 * r };
    return { s, hx, hy, foot, near: py * s >= 0 };
  }).sort((p, q) => p.foot.y - q.foot.y);
  for (const L of legs) {
    const lc = L.near ? legCol : shade(legCol, -0.2);
    stick(ctx, [{ x: L.hx, y: L.hy }, { x: (L.hx + L.foot.x) / 2 + fx * 0.02 * r, y: (L.hy + L.foot.y) / 2 }, { x: L.foot.x, y: L.foot.y - 0.04 * r }], 0.12 * r, lc, shade(legCol, -0.5), lw);
    ctx.fillStyle = shade(lc, -0.35);
    ctx.strokeStyle = shade(legCol, -0.6);
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.ellipse(L.foot.x + fx * 0.05 * r, L.foot.y, 0.08 * r + Math.abs(fx) * 0.04 * r, 0.055 * r, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // les bras : celui du fond passe derrière la tunique
  const shW = 0.19 * r * wide;
  const armOf = (s) => {
    const sx = x + px * s * shW * 1.05, sy = shY + 0.06 * r + py * s * 0.03 * r;
    const swing = -s * sw;
    const raise = angry && s === 1;
    const hand = raise
      ? { x: sx + px * s * 0.12 * r + Math.sin(t * 14) * 0.06 * r, y: headY - 0.3 * r }
      : (o.spear || o.crook) && s === 1
        ? { x: sx + px * s * 0.1 * r + fx * 0.12 * r, y: sy + 0.32 * r }
        : { x: sx + fx * swing * 0.15 * r + px * s * 0.05 * r, y: sy + 0.42 * r + fy * swing * 0.04 * r };
    return { s, sx, sy, hand, near: py * s >= 0 || Math.abs(fy) > 0.7 };
  };
  const arms = [armOf(-1), armOf(1)];
  const drawArm = (A) => {
    const mid = { x: (A.sx + A.hand.x) / 2 + px * A.s * 0.04 * r, y: (A.sy + A.hand.y) / 2 + 0.02 * r };
    stick(ctx, [{ x: A.sx, y: A.sy }, mid], 0.11 * r, A.near ? col : shade(col, -0.2), dark, lw);
    stick(ctx, [mid, A.hand], 0.085 * r, A.near ? skin : shade(skin, -0.2), skinDark, lw);
  };
  // la lance, le bâton : tenus par la main droite
  const tool = () => {
    const A = arms[1];
    if (angry) return;
    if (o.spear) {
      const b = { x: A.hand.x - fx * 0.02 * r, y: footY - 0.02 * r }, tp = { x: A.hand.x + fx * 0.05 * r, y: headY - 0.8 * r };
      stick(ctx, [b, tp], Math.max(1, r * 0.035), '#8A6A42', '#4A3420', lw * 0.6);
      cone(ctx, tp.x, tp.y + 0.05 * r, tp.x + fx * 0.02 * r, tp.y - 0.2 * r, 0.05 * r, '#A8A296', '#4A463E', lw);
    }
    if (o.crook) {
      const b = { x: A.hand.x, y: footY - 0.02 * r }, tp = { x: A.hand.x + fx * 0.03 * r, y: headY - 0.45 * r };
      stick(ctx, [b, tp], Math.max(1, r * 0.05), '#8A6A42', '#4A3420', lw * 0.6);
      ctx.strokeStyle = '#4A3420';
      ctx.lineWidth = Math.max(1, r * 0.05) + lw * 1.2;
      ctx.beginPath();
      ctx.arc(tp.x + 0.09 * r, tp.y, 0.09 * r, Math.PI, Math.PI * 2.1);
      ctx.stroke();
      ctx.strokeStyle = '#8A6A42';
      ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.stroke();
    }
  };
  const toolBehind = fy < -0.3;
  if (toolBehind) tool();
  for (const A of arms) if (!A.near) drawArm(A);
  // la tunique en fourrure, avec des franges
  const hemW = 0.25 * r * wide, hemY = hipY + 0.08 * r;
  ctx.fillStyle = col;
  ctx.strokeStyle = dark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x - shW, shY);
  ctx.quadraticCurveTo(x, shY - 0.07 * r, x + shW, shY);
  ctx.lineTo(x + hemW, hemY);
  const nF = 7;
  for (let k = 0; k <= nF; k++) ctx.lineTo(x + hemW - (2 * hemW * k) / nF, hemY + (k % 2 ? 0.08 : 0) * r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine) {
    // la ceinture, et le col en fourrure claire
    ctx.strokeStyle = shade(col, -0.38);
    ctx.lineWidth = lw * 1.5;
    ctx.beginPath();
    ctx.moveTo(x - (shW + hemW) * 0.5, (shY + hemY) * 0.5 + 0.03 * r);
    ctx.lineTo(x + (shW + hemW) * 0.5, (shY + hemY) * 0.5 + 0.03 * r);
    ctx.stroke();
  }
  ctx.fillStyle = shade(col, 0.35);
  ctx.beginPath();
  ctx.ellipse(x, shY + 0.01 * r, shW * 1.02, 0.07 * r, 0, 0, TAU);
  ctx.fill();
  // la tête : de dos, on ne voit que les cheveux
  const hx = x + fx * 0.02 * r, hy = headY;
  const back = fy < -0.35;
  const longHair = i % 2 === 1;
  if (longHair && !back) {
    // les cheveux longs, derrière la tête
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(hx - fx * headR * 0.25, hy + headR * 0.55, headR * 1.05, headR * 1.05, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = skin;
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(hx, hy, headR, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hair;
  ctx.strokeStyle = shade(hair, -0.4);
  ctx.beginPath();
  if (back) {
    ctx.arc(hx, hy - headR * 0.02, headR * 1.04, 0, TAU);
    ctx.fill();
    if (longHair) {
      ctx.beginPath();
      ctx.ellipse(hx, hy + headR * 0.7, headR * 0.85, headR * 0.6, 0, 0, TAU);
      ctx.fill();
    }
  } else {
    // les cheveux sur le haut et à l'arrière de la tête (de côté, ils partent vers l'arrière)
    const bx = hx - fx * headR * 0.35, by = hy - headR * 0.38 - Math.max(0, fy) * headR * 0.1;
    ctx.ellipse(bx, by, headR * (1.05 - Math.abs(fx) * 0.1), headR * 0.78, -fx * 0.3, Math.PI * 0.95, Math.PI * 2.05);
    ctx.quadraticCurveTo(bx + headR * 0.3 * fx, by + headR * 0.2, bx - headR * fx * 0.2, by + headR * 0.1);
    ctx.fill();
  }
  if (!back) {
    // le visage : les yeux partent du côté où il regarde
    const side = Math.abs(fx) > 0.75;
    const ex = hx + fx * headR * (side ? 0.5 : 0.28), ey = hy + headR * 0.02;
    const R = headR * 0.13;
    ctx.fillStyle = INK;
    for (const s of side ? [0] : [-1, 1]) {
      ctx.beginPath();
      ctx.arc(ex + s * headR * 0.36, ey, R, 0, TAU);
      ctx.fill();
    }
    if (angry) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(0.6, headR * 0.1);
      ctx.lineCap = 'round';
      for (const s of side ? [0] : [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(ex + s * headR * 0.36 - headR * 0.18, ey - headR * 0.32);
        ctx.lineTo(ex + s * headR * 0.36 + headR * 0.18 * (s || 1), ey - headR * 0.22);
        ctx.stroke();
      }
      ctx.fillStyle = '#5E1B28';
      ctx.beginPath();
      ctx.ellipse(ex + fx * headR * 0.1, ey + headR * 0.45, headR * 0.15, headR * 0.19, 0, 0, TAU);
      ctx.fill();
    } else if (fine) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(0.6, headR * 0.09);
      ctx.lineCap = 'round';
      ctx.beginPath();
      const mx = ex + fx * headR * 0.1, my = ey + headR * 0.42;
      ctx.moveTo(mx - headR * 0.18, my);
      ctx.quadraticCurveTo(mx, my + headR * 0.14, mx + headR * 0.18, my);
      ctx.stroke();
    }
    if (fine) {
      // des joues roses
      ctx.fillStyle = 'rgba(230, 110, 110, 0.3)';
      for (const s of side ? [0] : [-1, 1]) {
        ctx.beginPath();
        ctx.arc(ex + s * headR * 0.5 + (side ? -fx * headR * 0.15 : 0), ey + headR * 0.28, headR * 0.14, 0, TAU);
        ctx.fill();
      }
    }
  }
  for (const A of arms) if (A.near) drawArm(A);
  if (!toolBehind) tool();
}

/* ============================================================================
   Les mesures de chaque espèce (r = la taille de l'animal ; body : du cou au
   bout de la queue ; arch : le dos qui se bombe ; hip : la hauteur des pattes)
   ============================================================================ */
/** Quatre pattes : devant (les épaules), derrière (les hanches) */
const legs4 = (front, back, w, foot = 'patte', o = {}) => [
  { at: front, w, spread: o.spread ?? 0.03, stride: o.stride ?? 0.3, ph: 0, fwd: o.fwd ?? 0.04, lift: o.lift ?? 0.14, toes: 0, foot, knee: o.kf ?? -0.25, thigh: o.thigh ?? 1.7, claws: o.claws },
  { at: back, w: w * (o.hind ?? 1.12), spread: o.spread ?? 0.03, stride: o.stride ?? 0.3, ph: 1, fwd: -0.02, lift: o.lift ?? 0.14, toes: 0, foot, knee: o.kh ?? -1.0, thigh: (o.thigh ?? 1.7) * 1.2, claws: o.claws },
];
/** Un mammifère : sa tête, sa fourrure, son ventre clair */
const M = (S) => ({ drawHead: mamHead, under: furUnder, over: furOver, last: furLast, belly: true, legsUnder: true, flankTaper: true, sway: 0.07, cadence: 2, ...S });
/** Une tête de mammifère (les réglages par défaut : un petit carnivore) */
const head = (o) => ({ l: 0.6, w: 0.42, muzzle: 0.45, tip: 0.72, ear: 'pointe', earR: 0.8, nose: 'chien', eye: [0.14, 0.44, 0.12], ...o });
/** Les deux pattes d'un oiseau coureur */
const birdLegs = (at, w, stride = 0.5) => [{ at, w, spread: 0.08, stride, lift: 0.22, toes: 3, fwd: 0.1, thigh: 1.3 }];

export const BEASTS = {
  /* ---- Les formes du joueur (niveau 3), et les rivaux, qui lui ressemblent ---- */
  musaraigne: M({
    spine: { n: 8, gap: 0.27 }, body: [0.24, 0.36, 0.42, 0.42, 0.35, 0.07, 0.055, 0.04], hip: 0.3, flank: 0.22, cadence: 2.8, tailAt: 0.62,
    head: head({ l: 0.62, w: 0.4, muzzle: 0.32, tip: 0.92, ear: 'rond', earR: 0.95, noseCol: '#C9727E', eye: [0.1, 0.48, 0.13] }),
    legs: legs4(0.15, 0.5, 0.1, 'patte', { stride: 0.22 }),
  }),
  miacis: M({
    spine: { n: 10, gap: 0.28 }, body: [0.2, 0.28, 0.32, 0.32, 0.31, 0.27, 0.11, 0.13, 0.12, 0.06], hip: 0.4, flank: 0.2, cadence: 2.5, tailAt: 0.6,
    head: head({ l: 0.6, w: 0.4, muzzle: 0.42, tip: 0.78, ear: 'rond', earR: 0.85, teeth: true }),
    legs: legs4(0.12, 0.5, 0.1, 'patte', { stride: 0.26 }), stripes: true,
  }),
  proailurus: M({
    spine: { n: 9, gap: 0.3 }, body: [0.2, 0.3, 0.33, 0.32, 0.3, 0.08, 0.075, 0.07, 0.06], hip: 0.55, flank: 0.22, cadence: 2.4, tailAt: 0.55,
    head: head({ l: 0.55, w: 0.44, muzzle: 0.42, tip: 0.66, ear: 'pointe', earR: 0.8, nose: 'chat', iris: '#C98A2E', teeth: true, eye: [0.16, 0.42, 0.12] }),
    legs: legs4(0.12, 0.47, 0.11, 'patte', { stride: 0.3 }), spots: 9,
  }),
  machairodus: M({
    spine: { n: 9, gap: 0.32 }, body: [0.24, 0.36, 0.4, 0.38, 0.35, 0.09, 0.08, 0.07, 0.06], hip: 0.68, flank: 0.24, cadence: 2.1, tailAt: 0.55,
    head: head({ l: 0.58, w: 0.48, muzzle: 0.46, tip: 0.7, ear: 'rond', earR: 0.7, nose: 'chat', sabers: 0.3, iris: '#D9A13A', teeth: true, eye: [0.15, 0.42, 0.11] }),
    legs: legs4(0.12, 0.47, 0.13, 'patte', { stride: 0.34 }), stripes: true,
  }),
  homotherium: M({
    spine: { n: 8, gap: 0.33 }, body: [0.26, 0.4, 0.44, 0.4, 0.34, 0.1, 0.07, 0.04], arch: [0.14, 0.2, 0.14, 0.05, 0, 0, 0, 0], hip: 0.74, flank: 0.26, cadence: 2, tailAt: 0.62,
    head: head({ l: 0.62, w: 0.48, muzzle: 0.5, tip: 0.72, ear: 'petit', earR: 1.2, nose: 'chat', sabers: 0.26, iris: '#D9A13A', teeth: true, eye: [0.15, 0.42, 0.1] }),
    legs: legs4(0.14, 0.55, 0.15, 'patte', { stride: 0.36 }), stripes: true,
  }),

  /* ---- Chapitres 1 et 2 : après la météorite, la grande forêt ---- */
  eohippus: M({
    spine: { n: 8, gap: 0.28 }, body: [0.15, 0.27, 0.31, 0.32, 0.31, 0.07, 0.05, 0.03], neck: { n: 2, h: 0.32 }, arch: [0, 0, 0, 0.04, 0.06, 0, 0, 0], hip: 0.62, flank: 0.2, cadence: 2.4,
    head: head({ l: 0.6, w: 0.3, muzzle: 0.55, tip: 0.76, pitch: 0.25, ear: 'pointe', earR: 0.9, nose: 'cheval', eye: [0.02, 0.62, 0.12], muzzleCol: false }),
    legs: legs4(0.12, 0.55, 0.07, 'sabot', { stride: 0.3 }), spots: 9, stripe: '#F2E6C8',
  }),
  darwinius: M({
    spine: { n: 10, gap: 0.26 }, body: [0.2, 0.28, 0.3, 0.29, 0.07, 0.06, 0.06, 0.05, 0.05, 0.04], hip: 0.45, flank: 0.2, cadence: 2.5, tailAt: 0.42,
    head: head({ l: 0.48, w: 0.48, muzzle: 0.4, tip: 0.62, ear: 'rond', earR: 0.6, eye: [0.2, 0.42, 0.17], iris: '#C98A2E' }),
    legs: legs4(0.1, 0.36, 0.08, 'patte', { stride: 0.28 }),
  }),
  andrewsarchus: M({
    spine: { n: 8, gap: 0.33 }, body: [0.3, 0.42, 0.46, 0.42, 0.36, 0.1, 0.07, 0.04], arch: [0.12, 0.18, 0.12, 0.04, 0, 0, 0, 0], hip: 0.68, flank: 0.26, cadence: 1.8,
    head: head({ l: 1.0, w: 0.5, muzzle: 0.55, tip: 0.8, ear: 'petit', earR: 1, teeth: true, toothL: 0.1, brow: true, iris: '#C77A2A', eye: [0.0, 0.5, 0.08] }),
    legs: legs4(0.14, 0.55, 0.13, 'sabot', { stride: 0.32 }), stripes: true,
  }),
  ambulocetus: M({
    spine: { n: 9, gap: 0.33 }, body: [0.26, 0.34, 0.38, 0.36, 0.32, 0.25, 0.18, 0.12, 0.06], hip: 0.3, flank: 0.2, cadence: 1.8, sway: 0.1, belly: false,
    head: head({ l: 1.0, w: 0.36, muzzle: 0.5, tip: 0.88, ear: 'petit', earR: 0.8, teeth: true, toothL: 0.1, iris: '#C9A13A', eye: [-0.05, 0.62, 0.1], muzzleCol: false }),
    legs: [
      { at: 0.14, w: 0.1, spread: 0.2, stride: 0.22, ph: 0, fwd: 0.06, lift: 0.1, toes: 0, foot: 'patte', thigh: 1.2 },
      { at: 0.5, w: 0.13, spread: 0.22, stride: 0.22, ph: 1, fwd: 0, lift: 0.1, toes: 0, foot: 'patte', thigh: 1.3 },
    ],
  }),

  /* ---- Chapitre 3 : les prairies de l'Oligocène ---- */
  palaeolagus: M({
    spine: { n: 6, gap: 0.27 }, body: [0.26, 0.36, 0.42, 0.44, 0.36, 0.12], hip: 0.36, flank: 0.24, cadence: 2.8,
    head: head({ l: 0.5, w: 0.44, muzzle: 0.48, tip: 0.62, ear: 'long', earR: 1.0, noseCol: '#C77A7A', eye: [0.05, 0.56, 0.15] }),
    legs: [
      { at: 0.15, w: 0.08, spread: 0.03, stride: 0.2, ph: 0, fwd: 0.06, lift: 0.14, toes: 0, foot: 'patte', thigh: 1.1 },
      { at: 0.7, w: 0.13, spread: 0.06, stride: 0.26, ph: 0, fwd: 0.08, lift: 0.14, toes: 0, foot: 'patte', thigh: 1.6 },
    ],
    pompon: 0.14,
  }),
  mesohippus: M({
    spine: { n: 7, gap: 0.3 }, body: [0.16, 0.28, 0.32, 0.33, 0.32, 0.06, 0.03], neck: { n: 2, h: 0.45 }, hip: 0.82, flank: 0.22, cadence: 2.3,
    head: head({ l: 0.66, w: 0.3, muzzle: 0.55, tip: 0.8, pitch: 0.3, ear: 'cheval', earR: 0.8, nose: 'cheval', eye: [0, 0.62, 0.11], muzzleCol: false }),
    legs: legs4(0.1, 0.62, 0.07, 'sabot', { stride: 0.34 }), mane: 0.25, crin: { at: 0.75, len: 0.7, w: 0.14 },
  }),
  hyaenodon: M({
    spine: { n: 9, gap: 0.32 }, body: [0.22, 0.32, 0.36, 0.35, 0.32, 0.09, 0.08, 0.06, 0.04], hip: 0.68, flank: 0.24, cadence: 2.2,
    head: head({ l: 0.85, w: 0.44, muzzle: 0.45, tip: 0.8, ear: 'pointe', earR: 0.7, teeth: true, iris: '#D0A040', brow: true, eye: [0.08, 0.46, 0.09] }),
    legs: legs4(0.12, 0.47, 0.11, 'patte', { stride: 0.34 }), stripes: true,
  }),
  entelodon: M({
    spine: { n: 8, gap: 0.33 }, body: [0.3, 0.44, 0.46, 0.4, 0.34, 0.08, 0.05, 0.03], arch: [0.15, 0.35, 0.28, 0.12, 0.02, 0, 0, 0], hip: 0.7, flank: 0.28, cadence: 1.9,
    head: head({ l: 0.95, w: 0.55, muzzle: 0.55, tip: 0.8, pitch: 0.12, ear: 'pointe', earR: 0.55, nose: 'groin', teeth: true, flanges: true, brow: true, iris: '#B5452E', eye: [0.0, 0.5, 0.07], muzzleCol: false }),
    legs: legs4(0.14, 0.58, 0.1, 'sabot', { stride: 0.3 }), ridge: 0.55, crin: { at: 0.65, len: 0.45 },
  }),
  paraceratherium: M({
    spine: { n: 9, gap: 0.33 }, body: [0.16, 0.2, 0.3, 0.46, 0.5, 0.5, 0.44, 0.06, 0.03], neck: { n: 4, h: 1.1 }, hip: 1.1, flank: 0.3, cadence: 1.4, sway: 0.04,
    head: head({ l: 0.72, w: 0.34, muzzle: 0.6, tip: 0.8, pitch: 0.3, ear: 'cheval', earR: 0.8, nose: 'cheval', eye: [0.02, 0.6, 0.1], muzzleCol: false }),
    legs: legs4(0.38, 0.72, 0.17, 'colonne', { stride: 0.28, kh: -0.6 }), crin: { at: 0.85, len: 0.6 },
  }),
  lezard: {
    spine: { n: 9, gap: 0.3 }, body: [0.2, 0.3, 0.34, 0.33, 0.27, 0.18, 0.11, 0.06, 0.02], hip: 0.2, flank: 0.12, sway: 0.12, cadence: 1.8,
    head: { l: 0.5, w: 0.27, snout: 0.6, teeth: 2, eye: [-0.06, 0.62, 0.15] },
    legs: [
      { at: 0.16, w: 0.11, spread: 0.24, stride: 0.26, ph: 0, fwd: 0.08, lift: 0.1 },
      { at: 0.5, w: 0.12, spread: 0.24, stride: 0.26, ph: 1, fwd: 0, lift: 0.1 },
    ],
    stripes: true,
  },
  'crocodile-coureur': {
    spine: { n: 9, gap: 0.34 }, body: [0.22, 0.32, 0.38, 0.38, 0.32, 0.22, 0.14, 0.07, 0.03], hip: 0.42, flank: 0.16, sway: 0.08, cadence: 1.8,
    head: { l: 0.95, w: 0.28, snout: 0.5, teeth: 7, brow: true, iris: '#F2C14E', eye: [-0.15, 0.62, 0.1] },
    legs: [
      { at: 0.15, w: 0.13, spread: 0.08, stride: 0.32, ph: 0, fwd: 0.06, lift: 0.14 },
      { at: 0.48, w: 0.15, spread: 0.08, stride: 0.32, ph: 1, fwd: 0, lift: 0.14 },
    ],
    studs: { from: 0.08, to: 0.9, s: 0.05 },
  },
  crocodile: {
    spine: { n: 10, gap: 0.33 }, body: [0.24, 0.34, 0.4, 0.4, 0.36, 0.28, 0.2, 0.13, 0.07, 0.03], hip: 0.2, flank: 0.14, sway: 0.1, cadence: 1.5,
    head: { l: 1.05, w: 0.32, snout: 0.45, teeth: 8, brow: true, iris: '#C9D23A', eye: [-0.2, 0.6, 0.09] },
    legs: [
      { at: 0.14, w: 0.13, spread: 0.26, stride: 0.24, ph: 0, fwd: 0.08, lift: 0.1 },
      { at: 0.44, w: 0.15, spread: 0.28, stride: 0.24, ph: 1, fwd: 0, lift: 0.1 },
    ],
    studs: { from: 0.06, to: 0.95, s: 0.06 },
  },

  /* ---- Chapitre 4 : la savane du Miocène ---- */
  gazelle: M({
    spine: { n: 7, gap: 0.28 }, body: [0.14, 0.24, 0.27, 0.27, 0.26, 0.06, 0.04], neck: { n: 2, h: 0.5 }, hip: 0.95, flank: 0.2, cadence: 2.5,
    head: head({ l: 0.5, w: 0.26, muzzle: 0.5, tip: 0.78, pitch: 0.25, ear: 'pointe', earR: 1.1, nose: 'cheval', horns: 'gazelle', eye: [0.02, 0.62, 0.14], muzzleCol: false }),
    legs: legs4(0.12, 0.65, 0.055, 'sabot', { stride: 0.38 }), tuft: 0.05,
  }),
  hipparion: M({
    spine: { n: 7, gap: 0.32 }, body: [0.18, 0.31, 0.35, 0.36, 0.35, 0.06, 0.03], neck: { n: 2, h: 0.6 }, hip: 0.95, flank: 0.24, cadence: 2.2,
    head: head({ l: 0.78, w: 0.32, muzzle: 0.55, tip: 0.82, pitch: 0.35, ear: 'cheval', earR: 0.8, nose: 'cheval', eye: [0.0, 0.62, 0.1], muzzleCol: false }),
    legs: legs4(0.1, 0.62, 0.08, 'sabot', { stride: 0.38 }), mane: 0.25, crin: { at: 0.75, len: 0.8, w: 0.16 }, stripes: true,
  }),
  chalicothere: M({
    spine: { n: 7, gap: 0.34 }, body: [0.2, 0.38, 0.44, 0.42, 0.36, 0.07, 0.04], neck: { n: 2, h: 0.35 }, arch: [0.1, 0.3, 0.22, 0.08, 0, 0, 0], hip: 0.85, flank: 0.28, cadence: 1.6,
    head: head({ l: 0.7, w: 0.36, muzzle: 0.6, tip: 0.8, pitch: 0.3, ear: 'cheval', earR: 0.8, nose: 'cheval', eye: [0.02, 0.6, 0.1], muzzleCol: false }),
    legs: legs4(0.12, 0.62, 0.13, 'patte', { stride: 0.28, claws: true, kf: 0.6 }), crin: { at: 0.75, len: 0.45 },
  }),
  deinotherium: M({
    spine: { n: 7, gap: 0.35 }, body: [0.4, 0.56, 0.62, 0.62, 0.54, 0.08, 0.04], arch: [0.08, 0.12, 0.08, 0.03, 0, 0, 0], hip: 1.0, flank: 0.34, cadence: 1.3, sway: 0.04,
    head: head({ l: 0.62, w: 0.68, muzzle: 0.5, tip: 0.66, pitch: 0.1, ear: 'elephant', earR: 1.2, nose: null, eye: [0.08, 0.6, 0.07], trunk: 0.85, tusks: 'deino', tuskL: 0.6, dome: 0.25, muzzleCol: false, deep: 1.1 }),
    legs: legs4(0.14, 0.58, 0.2, 'colonne', { stride: 0.26, kf: 0, kh: -0.3, thigh: 1.05 }), crin: { at: 0.85, len: 0.45 },
  }),
  hyene: M({
    spine: { n: 8, gap: 0.32 }, body: [0.24, 0.36, 0.4, 0.36, 0.3, 0.08, 0.07, 0.05], arch: [0.14, 0.22, 0.15, 0.05, -0.02, -0.04, -0.06, -0.08], hip: 0.72, flank: 0.26, cadence: 2.2,
    head: head({ l: 0.72, w: 0.5, muzzle: 0.48, tip: 0.74, ear: 'rond', earR: 0.85, teeth: true, iris: '#C98A2E', eye: [0.1, 0.44, 0.1], muzzleCol: '#3A2E26' }),
    legs: legs4(0.12, 0.55, 0.11, 'patte', { stride: 0.32 }), spots: 14, ridge: 0.5, tuft: 0.06,
  }),
  amphicyon: M({
    spine: { n: 9, gap: 0.33 }, body: [0.3, 0.44, 0.48, 0.46, 0.42, 0.14, 0.14, 0.11, 0.06], hip: 0.72, flank: 0.3, cadence: 1.8, tailAt: 0.58,
    head: head({ l: 0.85, w: 0.54, muzzle: 0.5, tip: 0.76, ear: 'rond', earR: 0.75, teeth: true, iris: '#C77A2A', brow: true, eye: [0.08, 0.44, 0.08] }),
    legs: legs4(0.12, 0.47, 0.15, 'patte', { stride: 0.32, claws: true }), fur: 0.07,
  }),

  /* ---- Chapitre 5 : l'âge de glace ---- */
  bison: M({
    spine: { n: 7, gap: 0.33 }, body: [0.4, 0.52, 0.52, 0.44, 0.36, 0.06, 0.03], arch: [0.12, 0.42, 0.34, 0.12, 0, 0, 0], hip: 0.8, flank: 0.3, cadence: 1.9,
    head: head({ l: 0.6, w: 0.56, muzzle: 0.55, tip: 0.7, pitch: 0.4, ear: 'petit', earR: 1, nose: 'cheval', horns: 'bison', beard: 1, eye: [0.05, 0.55, 0.08], muzzleCol: false }),
    legs: legs4(0.14, 0.62, 0.12, 'sabot', { stride: 0.3 }), cape: 0.4, shaggy: 0.13, shagTo: 0.4, crin: { at: 0.8, len: 0.45 },
  }),
  renne: M({
    spine: { n: 7, gap: 0.31 }, body: [0.18, 0.3, 0.34, 0.34, 0.32, 0.08, 0.04], neck: { n: 2, h: 0.5 }, hip: 0.92, flank: 0.24, cadence: 2.2,
    head: head({ l: 0.6, w: 0.32, muzzle: 0.55, tip: 0.78, pitch: 0.25, ear: 'pointe', earR: 0.9, nose: 'cheval', antlers: 'renne', antlerK: 1.5, eye: [0.02, 0.6, 0.11], muzzleCol: false }),
    legs: legs4(0.12, 0.62, 0.075, 'sabot', { stride: 0.36 }), fur: 0.05,
  }),
  cheval: M({
    spine: { n: 7, gap: 0.32 }, body: [0.18, 0.32, 0.36, 0.37, 0.36, 0.06, 0.03], neck: { n: 2, h: 0.62 }, hip: 0.95, flank: 0.25, cadence: 2.2,
    head: head({ l: 0.78, w: 0.33, muzzle: 0.55, tip: 0.82, pitch: 0.35, ear: 'cheval', earR: 0.8, nose: 'cheval', eye: [0.0, 0.62, 0.1], muzzleCol: '#E8DCC4' }),
    legs: legs4(0.1, 0.62, 0.085, 'sabot', { stride: 0.38 }), mane: 0.25, maneCol: '#3A2A1E', crin: { at: 0.75, len: 0.85, w: 0.17, col: '#3A2A1E' }, legCol: '#5A4636',
  }),
  megaloceros: M({
    spine: { n: 7, gap: 0.33 }, body: [0.2, 0.34, 0.38, 0.38, 0.34, 0.07, 0.04], neck: { n: 2, h: 0.55 }, arch: [0, 0.06, 0.04, 0, 0, 0, 0], hip: 1.0, flank: 0.26, cadence: 2,
    head: head({ l: 0.62, w: 0.32, muzzle: 0.55, tip: 0.78, pitch: 0.25, ear: 'pointe', earR: 0.9, nose: 'cheval', antlers: 'megaceros', antlerK: 2.4, eye: [0.02, 0.6, 0.1], muzzleCol: false }),
    legs: legs4(0.12, 0.62, 0.09, 'sabot', { stride: 0.36 }),
  }),
  'rhino-laineux': M({
    spine: { n: 7, gap: 0.34 }, body: [0.36, 0.5, 0.54, 0.54, 0.46, 0.07, 0.03], arch: [0, 0.22, 0.18, 0.08, 0.03, 0, 0], hip: 0.7, flank: 0.32, cadence: 1.6,
    head: head({ l: 0.78, w: 0.5, muzzle: 0.62, tip: 0.8, pitch: 0.45, ear: 'pointe', earR: 0.6, nose: 'cheval', horns: 'rhino', eye: [0.0, 0.58, 0.07], muzzleCol: false }),
    legs: legs4(0.14, 0.62, 0.15, 'colonne', { stride: 0.26, kf: 0, kh: -0.4 }), shaggy: 0.2, crin: { at: 0.85, len: 0.4 }, fur: 0.06,
  }),
  mammouth: M({
    spine: { n: 7, gap: 0.35 }, body: [0.42, 0.58, 0.62, 0.6, 0.52, 0.08, 0.04], arch: [0.22, 0.42, 0.32, 0.16, 0.06, 0, 0], hip: 1.0, flank: 0.36, cadence: 1.3, sway: 0.04,
    head: head({ l: 0.6, w: 0.76, muzzle: 0.5, tip: 0.62, pitch: 0.1, ear: 'elephant', earR: 0.6, nose: null, eye: [0.1, 0.55, 0.07], trunk: 1.2, tusks: 'mammouth', tuskL: 0.85, dome: 0.55, tuft: true, muzzleCol: false, deep: 1.15 }),
    legs: legs4(0.14, 0.58, 0.2, 'colonne', { stride: 0.26, kf: 0, kh: -0.3, thigh: 1.05 }), shaggy: 0.3, shagTo: 0.7, fur: 0.07, crin: { at: 0.85, len: 0.4 },
  }),
  'lion-des-cavernes': M({
    spine: { n: 9, gap: 0.32 }, body: [0.26, 0.38, 0.4, 0.38, 0.34, 0.08, 0.07, 0.06, 0.05], hip: 0.72, flank: 0.26, cadence: 2.1, tailAt: 0.55,
    head: head({ l: 0.62, w: 0.52, muzzle: 0.48, tip: 0.7, ear: 'rond', earR: 0.6, nose: 'chat', teeth: true, whiskers: true, iris: '#D9A13A', eye: [0.16, 0.42, 0.1] }),
    legs: legs4(0.12, 0.47, 0.13, 'patte', { stride: 0.36 }), tuft: 0.07,
  }),
  'ours-des-cavernes': M({
    spine: { n: 6, gap: 0.36 }, body: [0.42, 0.56, 0.6, 0.58, 0.48, 0.14], arch: [0.1, 0.22, 0.18, 0.08, 0.04, 0], hip: 0.72, flank: 0.32, cadence: 1.7,
    head: head({ l: 0.72, w: 0.62, muzzle: 0.48, tip: 0.72, ear: 'rond', earR: 0.6, teeth: true, iris: '#5A3418', eye: [0.1, 0.42, 0.08], dome: 0.15, brow: true }),
    legs: legs4(0.16, 0.7, 0.17, 'patte', { stride: 0.3, claws: true }), fur: 0.08,
  }),

  /* ---- Les grands oiseaux coureurs ---- */
  'oiseau-terreur': {
    spine: { n: 7, gap: 0.3 }, body: [0.1, 0.12, 0.3, 0.38, 0.34, 0.24, 0.12], neck: { n: 3, h: 0.75 }, hip: 0.95, flank: 0.2, cadence: 2.5, sway: 0.05,
    drawHead: birdHead, over: furOver,
    head: { l: 0.48, w: 0.34, beakL: 1.15, beakD: 0.36, beakCol: '#D9A441', crest: true, iris: '#F2C14E' },
    biped: true, legs: birdLegs(0.5, 0.13), feathers: '#4E3E30', wing: 0.32, fan: 0.3,
  },
  gastornis: {
    spine: { n: 7, gap: 0.3 }, body: [0.14, 0.16, 0.36, 0.46, 0.42, 0.28, 0.14], neck: { n: 3, h: 0.6 }, hip: 0.8, flank: 0.24, cadence: 2, sway: 0.05,
    drawHead: birdHead, over: furOver,
    head: { l: 0.55, w: 0.42, beakL: 0.85, beakD: 0.5, beakCol: '#E2B33C', iris: '#E8833A' },
    biped: true, legs: birdLegs(0.5, 0.17, 0.42), feathers: '#4A5462', wing: 0.36, fan: 0.32,
  },

  /* ---- Niveau 4 : les loups, les chiens (les formes du joueur), et les autres ---- */
  louveteau: M({
    spine: { n: 7, gap: 0.27 }, body: [0.24, 0.34, 0.38, 0.36, 0.13, 0.13, 0.08], arch: [0, 0, 0, 0, -0.04, -0.08, -0.12], hip: 0.42, flank: 0.22, cadence: 2.6, tailAt: 0.55, wag: 0.5,
    head: head({ l: 0.62, w: 0.56, muzzle: 0.4, tip: 0.66, ear: 'pointe', earR: 0.85, eye: [0.16, 0.42, 0.14] }),
    legs: legs4(0.12, 0.45, 0.1, 'patte', { stride: 0.24 }), fur: 0.05,
  }),
  loup: M({
    spine: { n: 9, gap: 0.31 }, body: [0.22, 0.31, 0.34, 0.33, 0.3, 0.1, 0.15, 0.16, 0.11], arch: [0.02, 0.02, 0, 0, 0, -0.06, -0.12, -0.18, -0.24], hip: 0.68, flank: 0.24, cadence: 2.2, tailAt: 0.55, wag: 0.4,
    head: head({ l: 0.76, w: 0.46, muzzle: 0.42, tip: 0.78, ear: 'pointe', earR: 0.95, teeth: true, iris: '#D9A13A', eye: [0.12, 0.44, 0.1] }),
    legs: legs4(0.12, 0.47, 0.1, 'patte', { stride: 0.34 }), fur: 0.06, saddle: [0.1, 0.5], tuft: 0.08, tuftCol: '#3A3632',
  }),
  chien: M({
    spine: { n: 9, gap: 0.3 }, body: [0.22, 0.31, 0.34, 0.33, 0.3, 0.1, 0.1, 0.09, 0.05], arch: [0.02, 0.02, 0, 0, 0, 0.04, 0.12, 0.2, 0.28], hip: 0.62, flank: 0.24, cadence: 2.3, tailAt: 0.55, wag: 0.6,
    head: head({ l: 0.68, w: 0.5, muzzle: 0.45, tip: 0.74, ear: 'pointe', earR: 0.85, teeth: true, eye: [0.14, 0.42, 0.12], dome: 0.1 }),
    legs: legs4(0.12, 0.47, 0.1, 'patte', { stride: 0.32 }),
  }),
  berger: M({
    spine: { n: 9, gap: 0.31 }, body: [0.24, 0.33, 0.36, 0.35, 0.32, 0.12, 0.16, 0.17, 0.12], arch: [0.02, 0.02, 0, 0, 0, -0.02, -0.04, -0.06, -0.06], hip: 0.66, flank: 0.25, cadence: 2.2, tailAt: 0.55, wag: 0.5,
    head: head({ l: 0.72, w: 0.5, muzzle: 0.44, tip: 0.76, ear: 'pointe', earR: 0.9, teeth: true, eye: [0.13, 0.42, 0.11] }),
    legs: legs4(0.12, 0.47, 0.105, 'patte', { stride: 0.34 }), fur: 0.08,
  }),
  marmotte: M({
    spine: { n: 6, gap: 0.27 }, body: [0.3, 0.42, 0.46, 0.44, 0.2, 0.14], hip: 0.3, flank: 0.24, cadence: 2.8, tailAt: 0.7,
    head: head({ l: 0.5, w: 0.5, muzzle: 0.5, tip: 0.62, ear: 'petit', earR: 1, eye: [0.08, 0.5, 0.14] }),
    legs: legs4(0.15, 0.6, 0.1, 'patte', { stride: 0.2, claws: true }), fur: 0.04,
  }),
  mouton: M({
    spine: { n: 6, gap: 0.3 }, body: [0.24, 0.42, 0.48, 0.48, 0.4, 0.1], hip: 0.62, flank: 0.3, cadence: 2.4, belly: false,
    head: head({ l: 0.52, w: 0.36, muzzle: 0.6, tip: 0.74, pitch: 0.2, ear: 'tombante', earR: 0.6, nose: 'cheval', eye: [0.08, 0.6, 0.12], muzzleCol: false }),
    legs: legs4(0.15, 0.68, 0.065, 'sabot', { stride: 0.26 }), wool: '#F2EEE4', woolTo: 0.85, headCol: '#3A302A', legCol: '#3A302A',
  }),
  chevre: M({
    spine: { n: 6, gap: 0.3 }, body: [0.16, 0.28, 0.3, 0.3, 0.27, 0.06], neck: { n: 2, h: 0.42 }, hip: 0.8, flank: 0.22, cadence: 2.4,
    head: head({ l: 0.52, w: 0.3, muzzle: 0.55, tip: 0.76, pitch: 0.25, ear: 'pointe', earR: 0.9, nose: 'cheval', horns: 'chevre', hornL: 0.9, beard: 0.8, eye: [0.02, 0.62, 0.13], muzzleCol: false }),
    legs: legs4(0.15, 0.7, 0.06, 'sabot', { stride: 0.32 }), tuft: 0.05,
  }),
  aurochs: M({
    spine: { n: 7, gap: 0.34 }, body: [0.34, 0.46, 0.5, 0.48, 0.42, 0.07, 0.04], arch: [0.05, 0.16, 0.12, 0.04, 0, 0, 0], hip: 0.85, flank: 0.3, cadence: 1.9,
    head: head({ l: 0.62, w: 0.5, muzzle: 0.58, tip: 0.74, pitch: 0.38, ear: 'petit', earR: 1, nose: 'cheval', horns: 'bison', hornL: 1.7, eye: [0.02, 0.56, 0.08], muzzleCol: '#C9B79A' }),
    legs: legs4(0.14, 0.62, 0.11, 'sabot', { stride: 0.3 }), crin: { at: 0.8, len: 0.7 },
  }),
};
// le mouton : la tête et les pattes toutes noires
BEASTS.mouton.drawHead = (ctx, c, t, S, h, a, fx, fy, r, col, flankCol, dark, lw, T, o) =>
  mamHead(ctx, c, t, S, h, a, fx, fy, r, S.headCol, shade(S.headCol, -0.2), shade(S.headCol, -0.5), lw, T, { ...o, belly: null });
// la musaraigne a toujours ses moustaches
BEASTS.musaraigne.head.whiskers = true;

/* Le cadrage des vignettes (fiches « Le savais-tu ? », missions) : l'animal entier, bien au milieu.
   (dans la vignette, il regarde en haut à droite : la queue part en bas à gauche, les pattes descendent) */
function frameOf(S) {
  const len = S.spine.gap * (S.spine.n - 1);
  const rise = (S.neck?.h ?? 0) + 0.3;
  const hl = (S.head?.l ?? 0.5) * (S.head?.beakL ? 1 + S.head.beakL : 1);
  const R = 0.8 / (len * 0.94 + hl + 0.3);
  return { r: R, x: 0.5 + ((len * 0.94 - hl) / 2) * R, y: 0.5 - ((len * 0.34 + (S.hip ?? 0.3)) - rise) / 2 * R };
}

for (const [id, S] of Object.entries(BEASTS)) {
  const look = `tq-${id}`;
  registerBeast(look, S);
  FRAMES[look] = frameOf(S);
  LOOKS[look] = (ctx, c, t) => {
    const col = c.sp.color;
    drawBeast(ctx, { ...c, look }, t, S, col, { belly: c.sp.belly || shade(col, 0.42), stripe: c.sp.stripe, legCol: S.legCol });
  };
}

/* ---------- Les humains ---------- */
for (const [id, o] of [['humain', {}], ['chasseur', { spear: true }], ['enfant', { child: true }], ['humain-berger', { crook: true }]]) {
  LOOKS[`tq-${id}`] = (ctx, c, t) => drawPerson(ctx, c, t, o);
  FRAMES[`tq-${id}`] = { r: 0.36, x: 0.5, y: 0.53 };
}

/* ============================================================================
   Le joueur : ses formes, et ses évolutions qui se voient.
   Niveau 3 : moustaches, fourrure, grandes oreilles, griffes, gros nez (flair),
   dents de sabre de plus en plus longues, longs poils.
   Niveau 4 : gros nez, pelage épais, oreilles tombantes, queue en
   tire-bouchon, pelage tacheté.
   ============================================================================ */
const PLAYER_FORMS = {};
for (const form of ['musaraigne', 'miacis', 'proailurus', 'machairodus', 'homotherium']) {
  const B = BEASTS[form];
  PLAYER_FORMS[`tq-${form}`] = (parts) => {
    const Hd = { ...B.head };
    if (parts.oreilles) Hd.earR = (Hd.earR || 1) * 1.3;
    if (parts.moustaches) Hd.whiskers = true;
    if (Hd.sabers) Hd.sabers *= (parts['dents-de-sabre'] ? 1.3 : 1) * (parts['grands-sabres'] ? 1.45 : 1);
    return {
      ...B, head: Hd,
      legs: parts.griffes ? B.legs.map((L) => ({ ...L, claws: true })) : B.legs,
      fur: parts.fourrure || parts['fourrure-epaisse'] ? 0.07 : B.fur,
      shaggy: parts['fourrure-epaisse'] ? 0.12 : 0,
      body: parts.fourrure ? B.body.map((w, i) => (i / (B.body.length - 1) > (B.tailAt ?? 0.6) ? w * 1.35 : w)) : B.body,
    };
  };
}
for (const form of ['louveteau', 'loup', 'chien', 'berger']) {
  const B = BEASTS[form];
  PLAYER_FORMS[`tq-${form}`] = (parts) => {
    const Hd = { ...B.head };
    if (parts['oreilles-tombantes']) Object.assign(Hd, { ear: 'tombante', earR: 1.0, earCol: shade(PLAYER.body, -0.22) });
    const S = { ...B, head: Hd };
    if (parts['pelage-epais']) S.fur = Math.max(B.fur || 0, 0.09);
    if (parts['queue-tire-bouchon']) {
      // la queue remonte et s'enroule sur le dos
      S.arch = B.arch.map((v, i) => (i / (B.arch.length - 1) > 0.55 ? 0.15 + (i / (B.arch.length - 1) - 0.55) * 1.6 : v));
      S.wag = 0.8;
    }
    return S;
  };
}
for (const [form, make] of Object.entries(PLAYER_FORMS)) {
  const S0 = make({});
  registerBeast(form, S0);
  FRAMES[form] = frameOf(S0);
  FORM_SPINE[form] = form;
  // (un rival, de ton espèce : le même corps, sans les évolutions)
  LOOKS[form] = (ctx, c, t) => drawBeast(ctx, { ...c, look: form }, t, S0, c.sp.color, { belly: c.sp.belly || shade(c.sp.color, 0.42), stripe: c.sp.stripe });
  FORMS[form] = (ctx, p, parts, t, mood) => {
    const S = make(parts || {});
    drawBeast(ctx, { ...p, look: form, mood, seed: 0 }, t, S, PLAYER.body, {
      belly: PLAYER.belly, stripe: PLAYER.stripe || shade(PLAYER.body, -0.32), cute: true, dark: PLAYER.dark,
      bigNose: !!(parts && parts.flair), patch: parts && parts['pelage-tachete'] ? PLAYER.patch || '#FFFFFF' : null,
    });
  };
}
