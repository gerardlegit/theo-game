// ============================================================================
// DESSINS DE L'ESPACE — chaque objet est peint en code sur un <canvas>.
//
// Chaque fonction de ART reçoit un contexte déjà centré sur (0, 0), le rayon
// "r" de l'objet et un générateur aléatoire à graine fixe : le dessin est donc
// toujours le même d'une partie à l'autre. La lumière vient d'en haut à gauche.
// ============================================================================

const TAU = Math.PI * 2;
const HALF_SIZE = 2.2; // demi-taille du canvas, en multiples de r

/* ---------- Petits outils ---------- */
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

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
}

function radial(ctx, x0, y0, r0, x1, y1, r1, stops) {
  const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

/** Halo lumineux autour du centre, qui s'efface vers l'extérieur. */
function halo(ctx, r0, r1, rgb, a) {
  ctx.fillStyle = radial(ctx, 0, 0, r0, 0, 0, r1, [[0, `rgba(${rgb},${a})`], [1, `rgba(${rgb},0)`]]);
  circle(ctx, 0, 0, r1);
  ctx.fill();
}

/** Tache douce et floue (nuages, poussières, étoiles). */
function softDot(ctx, x, y, rad, rgb, a) {
  ctx.fillStyle = radial(ctx, x, y, 0, x, y, rad, [[0, `rgba(${rgb},${a})`], [1, `rgba(${rgb},0)`]]);
  circle(ctx, x, y, rad);
  ctx.fill();
}

/** Ombre + reflet qui donnent du volume à une sphère. */
function shade(ctx, r, dark = 0.6) {
  ctx.fillStyle = radial(ctx, -r * 0.45, -r * 0.5, r * 0.05, -r * 0.15, -r * 0.15, r * 1.2, [
    [0, 'rgba(255,255,255,0.38)'],
    [0.3, 'rgba(255,255,255,0.06)'],
    [0.6, 'rgba(0,0,20,0)'],
    [1, `rgba(0,0,20,${dark})`],
  ]);
  circle(ctx, 0, 0, r);
  ctx.fill();
}

/** Cratère : creux sombre + rebord éclairé du côté opposé à la lumière. */
function crater(ctx, x, y, cr, rgbDark, rgbLight) {
  ctx.fillStyle = `rgba(${rgbDark},0.4)`;
  circle(ctx, x, y, cr);
  ctx.fill();
  ctx.fillStyle = `rgba(${rgbDark},0.35)`;
  circle(ctx, x - cr * 0.2, y - cr * 0.2, cr * 0.72);
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgbLight},0.55)`;
  ctx.lineWidth = Math.max(0.6, cr * 0.22);
  ctx.beginPath();
  ctx.arc(x, y, cr * 0.9, -0.1 * Math.PI, 0.65 * Math.PI);
  ctx.stroke();
}

/** Forme fermée et arrondie passant près des points donnés. */
function smoothPath(ctx, pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}

function blob(rand, cx, cy, rad, n = 9, jag = 0.35) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = rad * (1 - jag / 2 + rand() * jag);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

/** Demi-anneau (arrière = moitié haute, avant = moitié basse). */
function halfAnnulus(ctx, r0, r1, front) {
  const a0 = front ? 0 : Math.PI;
  const a1 = front ? Math.PI : TAU;
  ctx.beginPath();
  ctx.arc(0, 0, r1, a0, a1);
  ctx.arc(0, 0, r0, a1, a0, true);
  ctx.closePath();
}

/** Petite étoile scintillante à 4 branches. */
function sparkle(ctx, x, y, s, rgb = '255,255,255') {
  softDot(ctx, x, y, s * 1.4, rgb, 0.5);
  ctx.fillStyle = `rgba(${rgb},0.95)`;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 2);
  ctx.quadraticCurveTo(x, y, x + s * 2, y);
  ctx.quadraticCurveTo(x, y, x, y + s * 2);
  ctx.quadraticCurveTo(x, y, x - s * 2, y);
  ctx.quadraticCurveTo(x, y, x, y - s * 2);
  ctx.fill();
}

const scalePts = (pts, r) => pts.map(([x, y]) => [x * r, y * r]);

/* ---------- Les dessins ---------- */
const ART = {
  soleil(ctx, r, rand) {
    halo(ctx, r * 0.7, r * 2, '255,190,60', 0.6);

    // Rayons de lumière
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU + rand() * 0.08;
      const len = r * (1.2 + (i % 2 ? 0.2 : 0.5) + rand() * 0.15);
      const w = 0.075;
      ctx.fillStyle = radial(ctx, 0, 0, r * 0.9, 0, 0, len, [[0, 'rgba(255,220,90,0.6)'], [1, 'rgba(255,160,40,0)']]);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - w) * r * 0.9, Math.sin(a - w) * r * 0.9);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.lineTo(Math.cos(a + w) * r * 0.9, Math.sin(a + w) * r * 0.9);
      ctx.fill();
    }
    ctx.restore();

    // Boule de feu
    ctx.fillStyle = radial(ctx, -r * 0.3, -r * 0.3, r * 0.05, 0, 0, r, [
      [0, '#FFFDE0'], [0.3, '#FFE45C'], [0.75, '#FFB020'], [1, '#F27A0C'],
    ]);
    circle(ctx, 0, 0, r);
    ctx.fill();

    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();
    for (let i = 0; i < 160; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * r, s = r * (0.03 + rand() * 0.07);
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,200,0.2)' : 'rgba(230,110,0,0.16)';
      circle(ctx, Math.cos(a) * d, Math.sin(a) * d, s);
      ctx.fill();
    }
    ctx.fillStyle = radial(ctx, 0, 0, r * 0.55, 0, 0, r, [[0, 'rgba(200,70,0,0)'], [1, 'rgba(200,70,0,0.45)']]);
    circle(ctx, 0, 0, r);
    ctx.fill();
    [[0.35, 0.2, 0.07], [0.46, 0.3, 0.04], [-0.3, 0.45, 0.05]].forEach(([x, y, s]) => {
      softDot(ctx, x * r, y * r, s * r * 1.8, '160,60,0', 0.35);
      ctx.fillStyle = 'rgba(130,40,0,0.6)';
      circle(ctx, x * r, y * r, s * r);
      ctx.fill();
    });
    ctx.restore();
  },

  mercure(ctx, r, rand) {
    ctx.fillStyle = radial(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#D3C9BE'], [0.6, '#A89D92'], [1, '#7E7268']]);
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();
    for (let i = 0; i < 18; i++) {
      smoothPath(ctx, blob(rand, (rand() - 0.5) * 2 * r, (rand() - 0.5) * 2 * r, r * (0.15 + rand() * 0.25)));
      ctx.fillStyle = rand() < 0.5 ? 'rgba(90,78,68,0.14)' : 'rgba(240,232,222,0.14)';
      ctx.fill();
    }
    for (let i = 0; i < 38; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.95;
      const cr = r * (0.03 + Math.pow(rand(), 2) * 0.16);
      crater(ctx, Math.cos(a) * d, Math.sin(a) * d, cr, '80,70,62', '240,232,224');
    }
    ctx.restore();
    shade(ctx, r, 0.72);
  },

  venus(ctx, r, rand) {
    halo(ctx, r * 0.95, r * 1.3, '255,230,170', 0.4);
    ctx.fillStyle = radial(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#FFF3D1'], [0.55, '#EBC989'], [1, '#C98F4A']]);
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const y = -r + rand() * 2 * r;
      ctx.strokeStyle = rand() < 0.6 ? 'rgba(255,250,230,0.3)' : 'rgba(200,140,60,0.13)';
      ctx.lineWidth = r * (0.06 + rand() * 0.12);
      ctx.beginPath();
      ctx.moveTo(-r * 1.1, y);
      ctx.bezierCurveTo(
        -r * 0.3, y + (rand() - 0.5) * r * 0.7,
        r * 0.3, y + (rand() - 0.5) * r * 0.7,
        r * 1.1, y + (rand() - 0.5) * r * 0.4,
      );
      ctx.stroke();
    }
    ctx.restore();
    shade(ctx, r, 0.6);
  },

  terre(ctx, r, rand) {
    halo(ctx, r * 0.95, r * 1.32, '110,180,255', 0.6);
    ctx.fillStyle = radial(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#6EC3F5'], [0.5, '#2F86D1'], [1, '#123F8C']]);
    circle(ctx, 0, 0, r);
    ctx.fill();

    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();

    const africa = [[-0.38, -0.28], [-0.15, -0.36], [0.12, -0.34], [0.3, -0.3], [0.38, -0.12], [0.58, -0.06], [0.48, 0.1], [0.35, 0.3], [0.28, 0.5], [0.15, 0.7], [0.05, 0.7], [0.0, 0.45], [-0.05, 0.2], [-0.18, 0.05], [-0.35, 0.02], [-0.48, -0.1]];
    const europe = [[-0.35, -0.44], [-0.28, -0.56], [-0.1, -0.6], [0.0, -0.74], [0.18, -0.82], [0.4, -0.77], [0.55, -0.62], [0.4, -0.52], [0.2, -0.46], [0.05, -0.44], [-0.12, -0.47]];
    const asia = [[0.42, -0.42], [0.62, -0.58], [0.95, -0.55], [1.05, -0.2], [0.95, 0.05], [0.75, -0.06], [0.62, -0.2], [0.5, -0.28]];
    const america = [[-1.1, -0.05], [-0.84, -0.08], [-0.7, 0.08], [-0.72, 0.3], [-0.82, 0.55], [-0.95, 0.8], [-1.15, 0.6]];

    ctx.fillStyle = radial(ctx, 0, 0, 0, 0, 0, r, [[0, '#8AD466'], [1, '#3F8F3A']]);
    [africa, europe, asia, america].forEach((pts) => {
      smoothPath(ctx, scalePts(pts, r));
      ctx.fill();
    });
    circle(ctx, r * 0.5, r * 0.46, r * 0.06); // Madagascar
    ctx.fill();

    // Désert du Sahara et d'Arabie
    ctx.save();
    smoothPath(ctx, scalePts(africa, r));
    ctx.clip();
    ctx.save();
    ctx.scale(1, 0.45);
    softDot(ctx, -r * 0.05, -r * 0.45, r * 0.45, '232,196,118', 0.95);
    ctx.restore();
    ctx.restore();
    ctx.save();
    smoothPath(ctx, scalePts(asia, r));
    ctx.clip();
    softDot(ctx, r * 0.62, -r * 0.3, r * 0.2, '220,186,110', 0.85);
    ctx.restore();

    // Calottes glaciaires
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.98, r * 0.55, r * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.99, r * 0.62, r * 0.15, 0, 0, TAU);
    ctx.fill();

    // Nuages : voiles doux en bandes, plus quelques tourbillons
    for (let i = 0; i < 26; i++) {
      const y = (rand() - 0.5) * 1.8 * r;
      const x = (rand() - 0.5) * 1.8 * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.35);
      softDot(ctx, 0, 0, r * (0.12 + rand() * 0.18), '255,255,255', 0.35 + rand() * 0.3);
      ctx.restore();
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const cx = (rand() - 0.5) * 1.6 * r, cy = (rand() - 0.5) * 1.6 * r;
      const a0 = rand() * TAU;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = r * 0.025;
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.1 + rand() * 0.12), a0, a0 + 1.2 + rand() * 1.5);
      ctx.stroke();
    }
    ctx.restore();

    shade(ctx, r, 0.65);
    ctx.strokeStyle = 'rgba(160,210,255,0.55)';
    ctx.lineWidth = r * 0.04;
    circle(ctx, 0, 0, r * 0.99);
    ctx.stroke();
  },

  lune(ctx, r, rand) {
    halo(ctx, r * 0.95, r * 1.3, '230,230,255', 0.28);
    ctx.fillStyle = radial(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#F4F4F0'], [0.6, '#D0D0CC'], [1, '#9D9D9A']]);
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();
    // Les "mers" sombres de la Lune
    [[-0.3, -0.35, 0.28], [0.1, -0.42, 0.22], [0.32, -0.1, 0.22], [-0.08, -0.05, 0.26], [-0.48, 0.08, 0.2], [0.05, 0.28, 0.15], [0.42, 0.28, 0.1]]
      .forEach(([x, y, s]) => {
        for (let i = 0; i < 14; i++) {
          const a = rand() * TAU, d = rand() * s * r * 0.7;
          softDot(ctx, x * r + Math.cos(a) * d, y * r + Math.sin(a) * d, s * r * (0.45 + rand() * 0.4), '95,98,110', 0.22);
        }
      });
    for (let i = 0; i < 30; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.95;
      crater(ctx, Math.cos(a) * d, Math.sin(a) * d, r * (0.025 + Math.pow(rand(), 2) * 0.1), '90,90,96', '255,255,250');
    }
    // Cratère Tycho et ses rayons
    const tx = r * 0.08, ty = r * 0.64;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = r * 0.02;
    for (let i = 0; i < 12; i++) {
      const a = rand() * TAU, len = r * (0.25 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(a) * len, ty + Math.sin(a) * len);
      ctx.stroke();
    }
    softDot(ctx, tx, ty, r * 0.08, '255,255,255', 0.8);
    ctx.restore();
    shade(ctx, r, 0.55);
  },

  mars(ctx, r, rand) {
    halo(ctx, r * 0.95, r * 1.22, '255,140,90', 0.32);
    ctx.fillStyle = radial(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#F7A56C'], [0.5, '#D9622E'], [1, '#8E2F14']]);
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();
    [[-0.4, -0.1, 0.3], [0.3, 0.3, 0.28], [0.45, -0.3, 0.18], [-0.2, 0.5, 0.2]].forEach(([x, y, s]) => {
      smoothPath(ctx, blob(rand, x * r, y * r, s * r, 10, 0.5));
      ctx.fillStyle = 'rgba(110,38,18,0.38)';
      ctx.fill();
    });
    for (let i = 0; i < 10; i++) {
      smoothPath(ctx, blob(rand, (rand() - 0.5) * 1.8 * r, (rand() - 0.5) * 1.8 * r, r * (0.1 + rand() * 0.18)));
      ctx.fillStyle = 'rgba(255,195,145,0.18)';
      ctx.fill();
    }
    // Valles Marineris, le grand canyon martien
    ctx.strokeStyle = 'rgba(90,28,12,0.55)';
    ctx.lineWidth = r * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.02);
    ctx.bezierCurveTo(-r * 0.2, r * 0.12, r * 0.05, -r * 0.02, r * 0.35, r * 0.1);
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.9;
      crater(ctx, Math.cos(a) * d, Math.sin(a) * d, r * (0.03 + rand() * 0.06), '100,35,15', '255,190,150');
    }
    // Calotte polaire
    softDot(ctx, r * 0.05, -r * 0.9, r * 0.45, '255,255,255', 0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(r * 0.05, -r * 0.92, r * 0.36, r * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    shade(ctx, r, 0.7);
  },

  jupiter(ctx, r, rand) {
    ctx.fillStyle = '#E8D5B7';
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();
    const bands = [
      [-0.84, '#C99B6D'], [-0.68, '#F0DEC2'], [-0.52, '#B07A4F'], [-0.38, '#F6E8D2'],
      [-0.2, '#C48A5A'], [-0.04, '#F3E3CA'], [0.1, '#D6A77A'], [0.26, '#F5E6CF'],
      [0.42, '#B8825A'], [0.58, '#EEDCC0'], [0.74, '#C9A07A'], [0.88, '#E2CDB0'],
    ];
    bands.forEach(([y, color], i) => {
      const top = y * r;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-r, r * 1.1);
      for (let x = -r; x <= r + 0.1; x += r / 12) {
        ctx.lineTo(x, top + Math.sin((x / r) * 5 + i * 2.1) * r * 0.025);
      }
      ctx.lineTo(r, r * 1.1);
      ctx.closePath();
      ctx.fill();
    });
    // Remous dans les bandes
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,250,240,0.25)' : 'rgba(140,85,50,0.2)';
      ctx.beginPath();
      ctx.ellipse((rand() - 0.5) * 2 * r, (rand() - 0.5) * 1.8 * r, r * (0.08 + rand() * 0.18), r * 0.025, 0, 0, TAU);
      ctx.fill();
    }
    // La Grande Tache rouge
    ctx.save();
    ctx.translate(r * 0.28, r * 0.33);
    ctx.fillStyle = 'rgba(250,235,215,0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.3, r * 0.17, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = radial(ctx, -r * 0.05, -r * 0.03, 0, 0, 0, r * 0.26, [[0, '#EE9A6A'], [0.6, '#C9532F'], [1, '#A8452C']]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.26, r * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,170,0.5)';
    ctx.lineWidth = r * 0.02;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.15, r * 0.07, 0, 0.4, TAU - 0.6);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    shade(ctx, r, 0.65);
  },

  saturne(ctx, r, rand) {
    const pr = r * 0.72;
    const TILT = 0.3;
    const rings = [
      [1.2, 1.32, 'rgba(190,165,125,0.45)'],
      [1.34, 1.52, 'rgba(236,214,170,0.92)'],
      [1.53, 1.67, 'rgba(214,186,138,0.88)'],
      // (espace vide : la division de Cassini)
      [1.74, 1.88, 'rgba(226,206,166,0.75)'],
      [1.9, 1.96, 'rgba(200,180,140,0.45)'],
    ];
    const drawRings = (front) => {
      ctx.save();
      ctx.rotate(-0.38);
      ctx.scale(1, TILT);
      rings.forEach(([a, b, col]) => {
        halfAnnulus(ctx, pr * a, pr * b, front);
        ctx.fillStyle = col;
        ctx.fill();
      });
      ctx.restore();
    };

    halo(ctx, pr * 0.9, pr * 1.3, '255,225,160', 0.3);
    drawRings(false);

    ctx.fillStyle = radial(ctx, -pr * 0.3, -pr * 0.3, 0, 0, 0, pr, [[0, '#FBEBC4'], [0.6, '#E3C58B'], [1, '#B58B4E']]);
    circle(ctx, 0, 0, pr);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, pr);
    ctx.clip();
    ctx.rotate(-0.38);
    [[-0.6, 0.12, 'rgba(180,130,70,0.25)'], [-0.25, 0.1, 'rgba(255,245,220,0.3)'], [0.1, 0.14, 'rgba(190,140,80,0.22)'], [0.45, 0.1, 'rgba(170,120,65,0.25)']]
      .forEach(([y, h, col]) => {
        ctx.fillStyle = col;
        ctx.fillRect(-pr * 1.2, y * pr, pr * 2.4, h * pr);
      });
    // Ombre des anneaux sur la planète
    ctx.fillStyle = 'rgba(80,55,20,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, pr * 0.1, pr * 1.3, pr * 0.1, 0, 0, Math.PI);
    ctx.fill();
    ctx.restore();
    shade(ctx, pr, 0.65);

    drawRings(true);
  },

  uranus(ctx, r, rand) {
    const pr = r * 0.9;
    halo(ctx, pr * 0.95, pr * 1.32, '150,240,245', 0.4);
    const ring = (front) => {
      ctx.save();
      ctx.rotate(1.35);
      ctx.scale(1, 0.2);
      halfAnnulus(ctx, pr * 1.36, pr * 1.44, front);
      ctx.fillStyle = 'rgba(210,248,255,0.55)';
      ctx.fill();
      halfAnnulus(ctx, pr * 1.5, pr * 1.53, front);
      ctx.fillStyle = 'rgba(210,248,255,0.3)';
      ctx.fill();
      ctx.restore();
    };
    ring(false);
    ctx.fillStyle = radial(ctx, -pr * 0.3, -pr * 0.3, 0, 0, 0, pr, [[0, '#E2FBFC'], [0.55, '#97E1E7'], [1, '#4AA6B6']]);
    circle(ctx, 0, 0, pr);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, pr);
    ctx.clip();
    ctx.rotate(1.35);
    for (let i = -3; i <= 3; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(40,120,140,0.08)';
      ctx.fillRect(-pr * 1.2, i * pr * 0.25, pr * 2.4, pr * 0.12);
    }
    ctx.restore();
    shade(ctx, pr, 0.6);
    ring(true);
  },

  neptune(ctx, r, rand) {
    halo(ctx, r * 0.95, r * 1.32, '90,140,255', 0.5);
    ctx.fillStyle = radial(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#93B8FF'], [0.5, '#3F6FE0'], [1, '#162C8C']]);
    circle(ctx, 0, 0, r);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, r);
    ctx.clip();
    [[-0.55, 0.12], [-0.1, 0.08], [0.5, 0.14]].forEach(([y, h]) => {
      ctx.fillStyle = 'rgba(20,40,130,0.22)';
      ctx.fillRect(-r * 1.1, y * r, r * 2.2, h * r);
    });
    // Grande Tache sombre
    ctx.fillStyle = 'rgba(15,25,95,0.75)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, r * 0.12, r * 0.25, r * 0.13, -0.1, 0, TAU);
    ctx.fill();
    // Nuages blancs
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    [[-0.12, 0.3, 0.22, 0.035], [0.35, -0.32, 0.2, 0.03], [0.3, 0.52, 0.16, 0.03], [-0.45, -0.1, 0.1, 0.025]]
      .forEach(([x, y, w, h]) => {
        ctx.beginPath();
        ctx.ellipse(x * r, y * r, w * r, h * r, -0.05, 0, TAU);
        ctx.fill();
      });
    ctx.restore();
    shade(ctx, r, 0.7);
  },

  pluton(ctx, r, rand) {
    const pr = r * 0.85;
    ctx.fillStyle = radial(ctx, -pr * 0.3, -pr * 0.3, 0, 0, 0, pr, [[0, '#EAD9C3'], [0.6, '#C09A7C'], [1, '#7A5645']]);
    circle(ctx, 0, 0, pr);
    ctx.fill();
    ctx.save();
    circle(ctx, 0, 0, pr);
    ctx.clip();
    for (let i = 0; i < 14; i++) {
      smoothPath(ctx, blob(rand, (rand() - 0.5) * 2 * pr, (rand() - 0.5) * 2 * pr, pr * (0.1 + rand() * 0.2)));
      ctx.fillStyle = rand() < 0.5 ? 'rgba(120,70,50,0.2)' : 'rgba(255,240,225,0.18)';
      ctx.fill();
    }
    // Grande région sombre
    smoothPath(ctx, blob(rand, -pr * 0.6, pr * 0.45, pr * 0.5, 11, 0.4));
    ctx.fillStyle = 'rgba(95,42,28,0.62)';
    ctx.fill();
    // Le fameux cœur de glace
    ctx.save();
    ctx.translate(pr * 0.22, pr * 0.1);
    ctx.rotate(-0.15);
    ctx.scale(pr / 110, pr / 110);
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.bezierCurveTo(-50, 5, -44, -40, -14, -38);
    ctx.bezierCurveTo(-5, -37, 0, -30, 0, -24);
    ctx.bezierCurveTo(0, -30, 5, -37, 14, -38);
    ctx.bezierCurveTo(44, -40, 50, 5, 0, 38);
    ctx.fillStyle = 'rgba(252,245,234,0.92)';
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * pr * 0.9;
      crater(ctx, Math.cos(a) * d, Math.sin(a) * d, pr * (0.03 + rand() * 0.05), '90,50,35', '255,235,215');
    }
    ctx.restore();
    shade(ctx, pr, 0.65);
  },

  comete(ctx, r, rand) {
    const hx = r * 0.6, hy = -r * 0.6;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(Math.atan2(-hy, -hx)); // la queue part vers le bas à gauche
    ctx.globalCompositeOperation = 'lighter';
    const L = r * 2.15;

    // Queue de poussière (large, courbe, dorée)
    let g = ctx.createLinearGradient(0, 0, L, 0);
    g.addColorStop(0, 'rgba(255,245,215,0.85)');
    g.addColorStop(1, 'rgba(255,190,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.13);
    ctx.quadraticCurveTo(L * 0.5, -r * 0.22, L, r * 0.05);
    ctx.lineTo(L * 0.95, r * 0.62);
    ctx.quadraticCurveTo(L * 0.5, r * 0.38, 0, r * 0.13);
    ctx.closePath();
    ctx.fill();

    // Queue d'ions (fine, droite, bleue)
    g = ctx.createLinearGradient(0, 0, L * 1.05, 0);
    g.addColorStop(0, 'rgba(150,210,255,0.9)');
    g.addColorStop(1, 'rgba(90,150,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.06);
    ctx.lineTo(L * 1.05, -r * 0.24);
    ctx.lineTo(L * 1.05, -r * 0.04);
    ctx.lineTo(0, r * 0.06);
    ctx.closePath();
    ctx.fill();

    // Filaments
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const spread = (rand() - 0.3) * r * 0.5;
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + rand() * 0.12})`;
      ctx.lineWidth = r * (0.01 + rand() * 0.02);
      ctx.beginPath();
      ctx.moveTo(r * 0.1, 0);
      ctx.quadraticCurveTo(L * 0.5, spread * 0.4, L * (0.7 + rand() * 0.3), spread);
      ctx.stroke();
    }

    // Chevelure et noyau
    softDot(ctx, 0, 0, r * 0.5, '190,235,255', 0.85);
    softDot(ctx, 0, 0, r * 0.22, '255,255,255', 1);
    ctx.restore();
    sparkle(ctx, hx, hy, r * 0.09);
  },

  asteroide(ctx, r, rand) {
    const pts = [];
    const n = 15;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const rr = r * (0.78 + rand() * 0.22) * (i === 4 || i === 11 ? 0.84 : 1);
      pts.push([Math.cos(a) * rr * 1.12, Math.sin(a) * rr * 0.82]);
    }
    ctx.save();
    ctx.rotate(-0.45);
    smoothPath(ctx, pts);
    ctx.fillStyle = radial(ctx, -r * 0.35, -r * 0.3, 0, 0, 0, r * 1.1, [[0, '#BCAB95'], [0.55, '#857361'], [1, '#4A3F36']]);
    ctx.fill();
    ctx.save();
    smoothPath(ctx, pts);
    ctx.clip();
    for (let i = 0; i < 16; i++) {
      smoothPath(ctx, blob(rand, (rand() - 0.5) * 2 * r, (rand() - 0.5) * 1.6 * r, r * (0.08 + rand() * 0.18)));
      ctx.fillStyle = rand() < 0.5 ? 'rgba(60,48,40,0.2)' : 'rgba(230,215,195,0.14)';
      ctx.fill();
    }
    for (let i = 0; i < 20; i++) {
      crater(ctx, (rand() - 0.5) * 1.9 * r, (rand() - 0.5) * 1.4 * r, r * (0.03 + Math.pow(rand(), 2) * 0.17), '55,45,38', '230,215,195');
    }
    ctx.rotate(0.45);
    shade(ctx, r * 1.1, 0.7);
    ctx.restore();
    ctx.restore();
  },

  galaxie(ctx, r, rand) {
    ctx.save();
    ctx.rotate(-0.5);
    ctx.scale(1, 0.62);
    halo(ctx, 0, r * 1.5, '150,140,255', 0.28);
    ctx.globalCompositeOperation = 'lighter';
    // Voile diffus des bras
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 40; i++) {
        const t = i / 40;
        const theta = t * TAU * 1.2 + arm * Math.PI;
        const rad = r * 0.15 + t * r * 1.2;
        softDot(ctx, Math.cos(theta) * rad, Math.sin(theta) * rad, r * (0.16 + t * 0.16), t < 0.3 ? '255,210,160' : '120,150,255', 0.2);
      }
    }
    // Étoiles des bras spiraux
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 750; i++) {
        const t = Math.pow(rand(), 0.85);
        const theta = t * TAU * 1.2 + arm * Math.PI;
        const rad = r * 0.12 + t * r * 1.25;
        const spread = (rand() - 0.5) * r * (0.2 + t * 0.4);
        const x = Math.cos(theta) * rad + Math.cos(theta + Math.PI / 2) * spread;
        const y = Math.sin(theta) * rad + Math.sin(theta + Math.PI / 2) * spread;
        const c = t < 0.28 ? '255,228,185' : rand() < 0.22 ? '255,130,200' : '175,205,255';
        ctx.fillStyle = `rgba(${c},${0.35 + rand() * 0.55})`;
        circle(ctx, x, y, r * (0.008 + rand() * 0.02));
        ctx.fill();
      }
    }
    // Cœur brillant
    softDot(ctx, 0, 0, r * 0.55, '255,215,150', 0.6);
    softDot(ctx, 0, 0, r * 0.22, '255,255,240', 1);
    ctx.restore();
    sparkle(ctx, r * 0.95, -r * 0.7, r * 0.06, '200,220,255');
    sparkle(ctx, -r * 1.0, r * 0.55, r * 0.05);
  },

  nebuleuse(ctx, r, rand) {
    const pal = ['255,80,170', '140,90,255', '60,190,255', '255,140,70', '90,230,200'];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 50; i++) {
      const a = rand() * TAU, d = Math.pow(rand(), 0.7) * r * 0.95;
      const c = d < r * 0.35 ? (rand() < 0.6 ? pal[3] : pal[0]) : pal[Math.floor(rand() * pal.length)];
      softDot(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.85, r * (0.22 + rand() * 0.4), c, 0.16 + rand() * 0.12);
    }
    softDot(ctx, 0, 0, r * 0.4, '255,240,220', 0.5);
    ctx.restore();

    // Zones de poussière sombre (douces)
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 7; i++) {
      const a = rand() * TAU, d = r * (0.3 + rand() * 0.5);
      softDot(ctx, Math.cos(a) * d, Math.sin(a) * d, r * (0.15 + rand() * 0.15), '20,6,40', 0.45);
    }
    ctx.restore();

    // Bord tout doux
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = radial(ctx, 0, 0, r * 0.5, 0, 0, r * 1.35, [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(-r * HALF_SIZE, -r * HALF_SIZE, r * HALF_SIZE * 2, r * HALF_SIZE * 2);
    ctx.restore();

    // Jeunes étoiles
    for (let i = 0; i < 22; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * r;
      ctx.fillStyle = `rgba(255,255,255,${0.5 + rand() * 0.5})`;
      circle(ctx, Math.cos(a) * d, Math.sin(a) * d, r * (0.01 + rand() * 0.015));
      ctx.fill();
    }
    sparkle(ctx, r * 0.1, -r * 0.05, r * 0.08);
    sparkle(ctx, -r * 0.5, -r * 0.4, r * 0.05, '200,230,255');
    sparkle(ctx, r * 0.55, r * 0.35, r * 0.05, '255,220,240');
  },

  trounoir(ctx, r, rand) {
    const s = r * 0.42; // rayon de l'ombre noire
    const T = 0.26;
    halo(ctx, s, r * 1.7, '255,140,40', 0.4);
    const diskFill = () => radial(ctx, 0, 0, s * 1.2, 0, 0, r * 1.6, [
      [0, 'rgba(255,250,220,1)'], [0.15, 'rgba(255,210,110,1)'], [0.45, 'rgba(255,130,30,0.9)'],
      [0.8, 'rgba(190,60,10,0.5)'], [1, 'rgba(120,20,0,0)'],
    ]);
    const disk = (front) => {
      ctx.save();
      ctx.rotate(-0.18);
      ctx.scale(1, T);
      halfAnnulus(ctx, s * 1.2, r * 1.6, front);
      ctx.fillStyle = diskFill();
      ctx.fill();
      ctx.restore();
    };

    disk(false);
    // Lumière du disque déviée autour du trou noir
    ctx.save();
    ctx.rotate(-0.18);
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.55, 0, TAU);
    ctx.arc(0, 0, s * 1.02, TAU, 0, true);
    ctx.fillStyle = radial(ctx, 0, 0, s, 0, 0, s * 1.55, [[0, 'rgba(255,245,210,1)'], [0.35, 'rgba(255,170,60,0.9)'], [1, 'rgba(220,80,10,0)']]);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#000';
    circle(ctx, 0, 0, s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,235,190,0.95)';
    ctx.lineWidth = r * 0.025;
    circle(ctx, 0, 0, s * 1.02);
    ctx.stroke();

    disk(true);
  },

  satellite(ctx, r, rand) {
    ctx.save();
    ctx.rotate(-0.35);
    // Bras des panneaux
    ctx.strokeStyle = '#C9CED8';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(-r * 1.3, 0);
    ctx.lineTo(r * 1.3, 0);
    ctx.stroke();

    const panel = (x0) => {
      const w = r * 0.9, h = r * 0.56;
      const g = ctx.createLinearGradient(x0, -h / 2, x0 + w, h / 2);
      g.addColorStop(0, '#3B6FF0');
      g.addColorStop(0.5, '#2248B0');
      g.addColorStop(1, '#152B6E');
      ctx.fillStyle = g;
      ctx.fillRect(x0, -h / 2, w, h);
      ctx.strokeStyle = 'rgba(170,210,255,0.55)';
      ctx.lineWidth = r * 0.015;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + (w * i) / 5, -h / 2);
        ctx.lineTo(x0 + (w * i) / 5, h / 2);
        ctx.stroke();
      }
      for (let j = 1; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(x0, -h / 2 + (h * j) / 3);
        ctx.lineTo(x0 + w, -h / 2 + (h * j) / 3);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(x0, -h / 2);
      ctx.lineTo(x0 + w * 0.45, -h / 2);
      ctx.lineTo(x0 + w * 0.15, h / 2);
      ctx.lineTo(x0, h / 2);
      ctx.fill();
      ctx.strokeStyle = '#D8DDE6';
      ctx.lineWidth = r * 0.03;
      ctx.strokeRect(x0, -h / 2, w, h);
    };
    panel(-r * 1.32);
    panel(r * 0.42);

    // Antenne parabolique
    ctx.strokeStyle = '#B8BFCC';
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.3);
    ctx.lineTo(0, -r * 0.52);
    ctx.stroke();
    ctx.fillStyle = radial(ctx, -r * 0.08, -r * 0.62, 0, 0, -r * 0.58, r * 0.34, [[0, '#FFFFFF'], [1, '#9AA3B5']]);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.58, r * 0.32, r * 0.11, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6B7385';
    circle(ctx, 0, -r * 0.66, r * 0.035);
    ctx.fill();

    // Corps en feuille d'or
    const bw = r * 0.34, bh = r * 0.3;
    const g = ctx.createLinearGradient(-bw, -bh, bw, bh);
    g.addColorStop(0, '#FFE9A3');
    g.addColorStop(0.45, '#E0AE2A');
    g.addColorStop(1, '#94620A');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-bw, -bh, bw * 2, bh * 2, r * 0.06) : ctx.rect(-bw, -bh, bw * 2, bh * 2);
    ctx.fill();
    ctx.lineWidth = r * 0.015;
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = rand() < 0.5 ? 'rgba(255,255,230,0.45)' : 'rgba(110,70,0,0.35)';
      const x = (rand() - 0.5) * bw * 1.8, y = (rand() - 0.5) * bh * 1.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * r * 0.2, y + (rand() - 0.5) * r * 0.2);
      ctx.stroke();
    }
    // Petite antenne
    ctx.strokeStyle = '#B8BFCC';
    ctx.lineWidth = r * 0.025;
    ctx.beginPath();
    ctx.moveTo(bw * 0.4, bh);
    ctx.lineTo(bw * 0.7, bh + r * 0.3);
    ctx.stroke();
    ctx.fillStyle = '#FF6F91';
    circle(ctx, bw * 0.7, bh + r * 0.3, r * 0.04);
    ctx.fill();
    ctx.restore();
  },
};

/**
 * Peint l'objet "id" une fois pour toutes dans un canvas hors écran.
 * @returns {{canvas: HTMLCanvasElement, half: number}} half = demi-taille en pixels "logiques"
 */
export function renderArt(id, r, scale = 2) {
  const half = r * HALF_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.ceil(half * 2 * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(half, half);
  ART[id](ctx, r, mulberry32(hashString(id)));
  return { canvas, half };
}
