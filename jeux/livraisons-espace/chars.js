// ============================================================================
// LES PERSONNAGES — habitants, marchands et le futur roi de la Terre,
// peints en code. Chaque dessin tient dans un cercle de rayon "s" centré sur
// (0, 0). "t" (en secondes) sert à faire cligner les yeux.
// ============================================================================

const TAU = Math.PI * 2;
const INK = '#2E2A4D';
const SKIN = '#F6CFAE';

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
}

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
}

function fillStroke(ctx, fill, s, width = 0.06) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = s * width;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

/** Reflet et ombre pour donner du volume à une forme ronde. */
function shine(ctx, x, y, rx, ry) {
  const g = ctx.createRadialGradient(x - rx * 0.4, y - ry * 0.45, 0, x, y, Math.max(rx, ry) * 1.1);
  g.addColorStop(0, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(20,10,60,0.28)');
  ctx.fillStyle = g;
  ellipse(ctx, x, y, rx, ry);
  ctx.fill();
}

function blob(ctx, s, color, rx = 0.72, ry = 0.8, cy = 0.1) {
  ellipse(ctx, 0, cy * s, rx * s, ry * s);
  fillStroke(ctx, color, s);
  shine(ctx, 0, cy * s, rx * s, ry * s);
}

function isBlinking(t, seed) {
  return (t + seed) % 3.7 < 0.14;
}

function eyes(ctx, s, t, { x = 0.27, y = -0.08, r = 0.15, seed = 0, xs = null } = {}) {
  const list = xs || [-x, x];
  const closed = isBlinking(t, seed);
  list.forEach((ex) => {
    if (closed) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = s * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo((ex - r * 0.8) * s, y * s);
      ctx.lineTo((ex + r * 0.8) * s, y * s);
      ctx.stroke();
      return;
    }
    ellipse(ctx, ex * s, y * s, r * s, r * 1.15 * s);
    fillStroke(ctx, '#FFFFFF', s, 0.04);
    circle(ctx, ex * s, (y + r * 0.15) * s, r * 0.58 * s);
    ctx.fillStyle = INK;
    ctx.fill();
    circle(ctx, (ex - r * 0.2) * s, (y - r * 0.1) * s, r * 0.22 * s);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  });
}

function smile(ctx, s, y = 0.28, w = 0.22, open = false) {
  ctx.beginPath();
  ctx.moveTo(-w * s, y * s);
  ctx.quadraticCurveTo(0, (y + w * 1.1) * s, w * s, y * s);
  if (open) {
    ctx.closePath();
    ctx.fillStyle = '#B83A55';
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = s * 0.06;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function cheeks(ctx, s, y = 0.18, x = 0.42, color = 'rgba(255,111,145,0.45)') {
  [-x, x].forEach((cx) => {
    ellipse(ctx, cx * s, y * s, 0.1 * s, 0.07 * s);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function star(ctx, x, y, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rr = i % 2 ? r * 0.45 : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Couronne dorée à 3 pointes, posée sur (0, y). */
function crown(ctx, s, y, w = 0.42) {
  ctx.beginPath();
  ctx.moveTo(-w * s, y * s);
  ctx.lineTo(-w * s, (y - 0.32) * s);
  ctx.lineTo(-w * 0.5 * s, (y - 0.16) * s);
  ctx.lineTo(0, (y - 0.42) * s);
  ctx.lineTo(w * 0.5 * s, (y - 0.16) * s);
  ctx.lineTo(w * s, (y - 0.32) * s);
  ctx.lineTo(w * s, y * s);
  ctx.closePath();
  fillStroke(ctx, '#FFD24A', s, 0.05);
  [[-w, y - 0.32], [0, y - 0.42], [w, y - 0.32]].forEach(([x, yy]) => {
    circle(ctx, x * s, yy * s, 0.06 * s);
    fillStroke(ctx, '#FFF6C8', s, 0.03);
  });
  circle(ctx, 0, (y - 0.1) * s, 0.07 * s);
  ctx.fillStyle = '#E85757';
  ctx.fill();
  circle(ctx, -w * 0.62 * s, (y - 0.08) * s, 0.05 * s);
  ctx.fillStyle = '#4FB8E8';
  ctx.fill();
  circle(ctx, w * 0.62 * s, (y - 0.08) * s, 0.05 * s);
  ctx.fill();
}

const DRAW = {
  /* Capitaine Lila, l'astronaute de la Station spatiale */
  lila(ctx, s, t) {
    ellipse(ctx, 0, 0.8 * s, 0.7 * s, 0.34 * s);
    fillStroke(ctx, '#F2F4F8', s);
    ellipse(ctx, 0, 0.52 * s, 0.4 * s, 0.11 * s);
    fillStroke(ctx, '#FF8A3C', s, 0.04);
    // antenne du casque
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.05 * s;
    ctx.beginPath();
    ctx.moveTo(0.38 * s, -0.5 * s);
    ctx.lineTo(0.55 * s, -0.86 * s);
    ctx.stroke();
    circle(ctx, 0.55 * s, -0.86 * s, 0.08 * s);
    fillStroke(ctx, '#FF6F91', s, 0.03);
    circle(ctx, 0, -0.05 * s, 0.66 * s);
    fillStroke(ctx, '#F2F4F8', s);
    circle(ctx, 0, -0.03 * s, 0.53 * s);
    ctx.fillStyle = '#BFE9FF';
    ctx.fill();
    // visage + cheveux
    ctx.save();
    circle(ctx, 0, 0.02 * s, 0.42 * s);
    ctx.clip();
    ctx.fillStyle = SKIN;
    ctx.fillRect(-s, -s, 2 * s, 2 * s);
    ctx.fillStyle = '#6B3E26';
    ctx.beginPath();
    ctx.moveTo(-0.5 * s, -0.5 * s);
    ctx.lineTo(0.5 * s, -0.5 * s);
    ctx.lineTo(0.5 * s, -0.08 * s);
    ctx.quadraticCurveTo(0.2 * s, -0.22 * s, 0.05 * s, -0.12 * s);
    ctx.quadraticCurveTo(-0.2 * s, -0.24 * s, -0.5 * s, -0.04 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    eyes(ctx, s, t, { x: 0.16, y: 0.04, r: 0.09, seed: 0.3 });
    cheeks(ctx, s, 0.18, 0.27);
    smile(ctx, s, 0.22, 0.12);
    // reflet sur la vitre
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 0.06 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -0.03 * s, 0.45 * s, Math.PI * 1.15, Math.PI * 1.45);
    ctx.stroke();
  },

  /* Mamie Lune : ronde, grise, pleine de cratères et très gentille */
  mamie(ctx, s, t) {
    circle(ctx, 0, -0.78 * s, 0.24 * s);
    fillStroke(ctx, '#FFFFFF', s);
    blob(ctx, s, '#DCD6F2');
    [[-0.45, 0.35, 0.09], [0.5, 0.45, 0.07], [0.3, -0.45, 0.06], [-0.5, -0.3, 0.05]].forEach(([x, y, r]) => {
      circle(ctx, x * s, y * s, r * s);
      ctx.fillStyle = 'rgba(150,140,200,0.4)';
      ctx.fill();
    });
    // cheveux blancs
    ellipse(ctx, 0, -0.55 * s, 0.56 * s, 0.24 * s);
    fillStroke(ctx, '#FFFFFF', s, 0.05);
    // châle rose
    ctx.beginPath();
    ctx.moveTo(-0.66 * s, 0.45 * s);
    ctx.quadraticCurveTo(0, 0.75 * s, 0.66 * s, 0.45 * s);
    ctx.lineTo(0.5 * s, 0.82 * s);
    ctx.quadraticCurveTo(0, 0.98 * s, -0.5 * s, 0.82 * s);
    ctx.closePath();
    fillStroke(ctx, '#FF9AC0', s, 0.05);
    eyes(ctx, s, t, { x: 0.25, y: -0.08, r: 0.1, seed: 1.1 });
    // lunettes
    ctx.strokeStyle = '#B86B2A';
    ctx.lineWidth = 0.05 * s;
    [-0.25, 0.25].forEach((x) => {
      circle(ctx, x * s, -0.08 * s, 0.17 * s);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(-0.08 * s, -0.1 * s);
    ctx.lineTo(0.08 * s, -0.1 * s);
    ctx.stroke();
    cheeks(ctx, s, 0.16, 0.45);
    smile(ctx, s, 0.22, 0.16);
  },

  /* Martin le Martien : vert, trois yeux et deux antennes */
  martin(ctx, s, t) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.06 * s;
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(side * 0.25 * s, -0.55 * s);
      ctx.quadraticCurveTo(side * 0.3 * s, -0.85 * s, side * 0.5 * s, -0.98 * s);
      ctx.stroke();
      circle(ctx, side * 0.5 * s, -0.98 * s, 0.1 * s);
      fillStroke(ctx, '#FFC93C', s, 0.04);
    });
    blob(ctx, s, '#7CE07A');
    [[-0.45, 0.4, 0.08], [0.48, 0.3, 0.06], [0.1, 0.62, 0.05]].forEach(([x, y, r]) => {
      circle(ctx, x * s, y * s, r * s);
      ctx.fillStyle = 'rgba(40,140,60,0.35)';
      ctx.fill();
    });
    eyes(ctx, s, t, { xs: [-0.32, 0.32], y: -0.08, r: 0.13, seed: 2.2 });
    eyes(ctx, s, t + 0.5, { xs: [0], y: -0.36, r: 0.15, seed: 2.2 });
    // grande bouche avec une dent
    ctx.beginPath();
    ctx.moveTo(-0.28 * s, 0.2 * s);
    ctx.quadraticCurveTo(0, 0.6 * s, 0.28 * s, 0.2 * s);
    ctx.closePath();
    fillStroke(ctx, '#B83A55', s, 0.05);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0.02 * s, 0.2 * s, 0.1 * s, 0.09 * s);
  },

  /* Professeur Zinzin : cheveux fous et lunettes de savant */
  zinzin(ctx, s, t) {
    // blouse blanche
    ctx.beginPath();
    ctx.moveTo(-0.62 * s, 0.98 * s);
    ctx.quadraticCurveTo(-0.6 * s, 0.5 * s, 0, 0.48 * s);
    ctx.quadraticCurveTo(0.6 * s, 0.5 * s, 0.62 * s, 0.98 * s);
    ctx.closePath();
    fillStroke(ctx, '#FFFFFF', s);
    ctx.beginPath();
    ctx.moveTo(-0.08 * s, 0.6 * s);
    ctx.lineTo(0.08 * s, 0.6 * s);
    ctx.lineTo(0, 0.9 * s);
    ctx.closePath();
    ctx.fillStyle = '#E85757';
    ctx.fill();
    // cheveux en pétard
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (0.95 + (i / 14) * 1.1);
      const rr = i % 2 ? 0.62 : 0.9;
      const x = Math.cos(a) * rr * s, y = -0.12 * s + Math.sin(a) * rr * s;
      ctx[i ? 'lineTo' : 'moveTo'](x, y);
    }
    ctx.closePath();
    fillStroke(ctx, '#F4F4F8', s, 0.05);
    ellipse(ctx, 0, 0.02 * s, 0.52 * s, 0.6 * s);
    fillStroke(ctx, SKIN, s);
    // lunettes de protection sur le front
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.05 * s;
    ctx.beginPath();
    ctx.moveTo(-0.52 * s, -0.36 * s);
    ctx.lineTo(0.52 * s, -0.36 * s);
    ctx.stroke();
    [-0.2, 0.2].forEach((x) => {
      circle(ctx, x * s, -0.36 * s, 0.15 * s);
      fillStroke(ctx, '#FFC93C', s, 0.045);
      circle(ctx, x * s, -0.36 * s, 0.09 * s);
      ctx.fillStyle = '#9EE7FF';
      ctx.fill();
    });
    eyes(ctx, s, t, { x: 0.2, y: -0.04, r: 0.1, seed: 0.8 });
    // grosse moustache
    [-1, 1].forEach((side) => {
      ellipse(ctx, side * 0.15 * s, 0.22 * s, 0.17 * s, 0.08 * s, side * -0.3);
      fillStroke(ctx, '#F4F4F8', s, 0.04);
    });
    smile(ctx, s, 0.36, 0.1);
  },

  /* Général Gloubi : violet, casquette étoilée et grande moustache */
  gloubi(ctx, s, t) {
    blob(ctx, s, '#A88BFF');
    // médaille
    ctx.beginPath();
    ctx.moveTo(0.18 * s, 0.4 * s);
    ctx.lineTo(0.38 * s, 0.4 * s);
    ctx.lineTo(0.28 * s, 0.6 * s);
    ctx.closePath();
    ctx.fillStyle = '#E85757';
    ctx.fill();
    circle(ctx, 0.28 * s, 0.66 * s, 0.11 * s);
    fillStroke(ctx, '#FFD24A', s, 0.04);
    // casquette
    ctx.beginPath();
    ctx.moveTo(-0.5 * s, -0.5 * s);
    ctx.quadraticCurveTo(-0.55 * s, -1.0 * s, 0, -1.0 * s);
    ctx.quadraticCurveTo(0.55 * s, -1.0 * s, 0.5 * s, -0.5 * s);
    ctx.closePath();
    fillStroke(ctx, '#3D6B3A', s);
    ellipse(ctx, 0, -0.5 * s, 0.62 * s, 0.13 * s);
    fillStroke(ctx, '#2A4A28', s, 0.05);
    star(ctx, 0, -0.76 * s, 0.15 * s, '#FFD24A');
    // sourcils sévères (mais gentils)
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.07 * s;
    ctx.lineCap = 'round';
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(side * 0.42 * s, -0.32 * s);
      ctx.lineTo(side * 0.14 * s, -0.24 * s);
      ctx.stroke();
    });
    eyes(ctx, s, t, { x: 0.27, y: -0.08, r: 0.12, seed: 1.7 });
    [-1, 1].forEach((side) => {
      ellipse(ctx, side * 0.2 * s, 0.2 * s, 0.22 * s, 0.09 * s, side * 0.35);
      fillStroke(ctx, '#5A3A22', s, 0.04);
    });
  },

  /* La Reine des Anneaux, avec un petit Saturne sur son diadème */
  reine(ctx, s, t) {
    blob(ctx, s, '#6FD6D0');
    // diadème
    ctx.beginPath();
    ctx.moveTo(-0.45 * s, -0.55 * s);
    ctx.quadraticCurveTo(0, -0.72 * s, 0.45 * s, -0.55 * s);
    ctx.lineTo(0.38 * s, -0.75 * s);
    ctx.lineTo(0.18 * s, -0.68 * s);
    ctx.lineTo(0, -0.86 * s);
    ctx.lineTo(-0.18 * s, -0.68 * s);
    ctx.lineTo(-0.38 * s, -0.75 * s);
    ctx.closePath();
    fillStroke(ctx, '#FFD24A', s, 0.04);
    circle(ctx, 0, -0.98 * s, 0.13 * s);
    fillStroke(ctx, '#F2C46A', s, 0.04);
    ctx.strokeStyle = '#B98A1E';
    ctx.lineWidth = 0.05 * s;
    ellipse(ctx, 0, -0.98 * s, 0.25 * s, 0.07 * s, -0.3);
    ctx.stroke();
    eyes(ctx, s, t, { x: 0.26, y: -0.1, r: 0.13, seed: 2.9 });
    // cils
    if (!isBlinking(t, 2.9)) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.04 * s;
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + side * (0.5 + i * 0.35);
          const x = side * 0.26 * s + Math.cos(a) * 0.15 * s, y = -0.1 * s + Math.sin(a) * 0.17 * s;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * 0.08 * s, y + Math.sin(a) * 0.08 * s);
          ctx.stroke();
        }
      });
    }
    cheeks(ctx, s, 0.14, 0.44);
    ctx.beginPath();
    ctx.moveTo(-0.14 * s, 0.25 * s);
    ctx.quadraticCurveTo(0, 0.4 * s, 0.14 * s, 0.25 * s);
    ctx.quadraticCurveTo(0, 0.3 * s, -0.14 * s, 0.25 * s);
    fillStroke(ctx, '#FF6F91', s, 0.03);
  },

  /* Gus le mécano : un robot avec sa clé à molette */
  gus(ctx, s, t) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.05 * s;
    ctx.beginPath();
    ctx.moveTo(0, -0.62 * s);
    ctx.lineTo(0, -0.9 * s);
    ctx.stroke();
    circle(ctx, 0, -0.92 * s, 0.09 * s);
    fillStroke(ctx, (t % 1.2) < 0.6 ? '#FF6F91' : '#FFC93C', s, 0.03);
    ctx.beginPath();
    ctx.roundRect(-0.64 * s, -0.62 * s, 1.28 * s, 1.15 * s, 0.26 * s);
    fillStroke(ctx, '#B8C2D6', s);
    shine(ctx, 0, -0.05 * s, 0.64 * s, 0.58 * s);
    ctx.beginPath();
    ctx.roundRect(-0.46 * s, -0.42 * s, 0.92 * s, 0.62 * s, 0.16 * s);
    fillStroke(ctx, '#1C2260', s, 0.04);
    const closed = isBlinking(t, 0.5);
    ctx.fillStyle = '#9EE7FF';
    [-0.2, 0.2].forEach((x) => {
      ellipse(ctx, x * s, -0.16 * s, 0.08 * s, closed ? 0.015 * s : 0.11 * s);
      ctx.fill();
    });
    ctx.strokeStyle = '#9EE7FF';
    ctx.lineWidth = 0.05 * s;
    ctx.beginPath();
    ctx.arc(0, 0, 0.14 * s, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    [-0.7, 0.7].forEach((x) => {
      circle(ctx, x * s, -0.05 * s, 0.1 * s);
      fillStroke(ctx, '#8892AA', s, 0.04);
    });
    // clé à molette
    ctx.save();
    ctx.translate(0.5 * s, 0.6 * s);
    ctx.rotate(-0.7);
    ctx.beginPath();
    ctx.roundRect(-0.07 * s, -0.05 * s, 0.14 * s, 0.5 * s, 0.05 * s);
    fillStroke(ctx, '#E85757', s, 0.035);
    ctx.beginPath();
    ctx.arc(0, -0.12 * s, 0.17 * s, 0.35 * Math.PI, 2.65 * Math.PI);
    ctx.lineTo(0, -0.12 * s);
    ctx.closePath();
    fillStroke(ctx, '#C9CED8', s, 0.035);
    ctx.restore();
  },

  /* Stella, l'artiste peintre au béret rouge */
  stella(ctx, s, t) {
    blob(ctx, s, '#FF9AC0');
    ellipse(ctx, -0.08 * s, -0.66 * s, 0.56 * s, 0.2 * s, -0.15);
    fillStroke(ctx, '#E85757', s);
    circle(ctx, 0.05 * s, -0.86 * s, 0.07 * s);
    fillStroke(ctx, '#E85757', s, 0.04);
    eyes(ctx, s, t, { x: 0.26, y: -0.12, r: 0.13, seed: 3.3 });
    cheeks(ctx, s, 0.14, 0.44);
    smile(ctx, s, 0.22, 0.18, true);
    // taches de peinture
    [[-0.45, -0.38, '#4FB8E8'], [0.5, 0.38, '#FFC93C'], [-0.2, 0.55, '#58C97B']].forEach(([x, y, c]) => {
      circle(ctx, x * s, y * s, 0.06 * s);
      ctx.fillStyle = c;
      ctx.fill();
    });
    // palette
    ctx.save();
    ctx.translate(-0.55 * s, 0.62 * s);
    ctx.rotate(-0.4);
    ellipse(ctx, 0, 0, 0.32 * s, 0.22 * s);
    fillStroke(ctx, '#E0B07A', s, 0.04);
    ['#E85757', '#4FB8E8', '#FFC93C', '#58C97B'].forEach((c, i) => {
      circle(ctx, (-0.16 + i * 0.1) * s, (i % 2 ? 0.07 : -0.07) * s, 0.05 * s);
      ctx.fillStyle = c;
      ctx.fill();
    });
    ctx.restore();
  },

  /* Colonel Boum : casque de soldat et lunettes noires */
  boum(ctx, s, t) {
    blob(ctx, s, '#FFA552');
    ctx.beginPath();
    ctx.arc(0, -0.3 * s, 0.66 * s, Math.PI, TAU);
    ctx.closePath();
    fillStroke(ctx, '#5E7A3A', s);
    ellipse(ctx, 0, -0.3 * s, 0.78 * s, 0.1 * s);
    fillStroke(ctx, '#4A6230', s, 0.05);
    [[-0.3, -0.62], [0.2, -0.52], [0.05, -0.78]].forEach(([x, y]) => {
      circle(ctx, x * s, y * s, 0.07 * s);
      ctx.fillStyle = 'rgba(40,60,20,0.5)';
      ctx.fill();
    });
    // lunettes noires
    [-0.22, 0.22].forEach((x) => {
      ctx.beginPath();
      ctx.roundRect((x - 0.17) * s, -0.15 * s, 0.34 * s, 0.2 * s, 0.07 * s);
      ctx.fillStyle = '#1C1A2E';
      ctx.fill();
    });
    ctx.fillRect(-0.06 * s, -0.12 * s, 0.12 * s, 0.04 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-0.34 * s, -0.12 * s, 0.08 * s, 0.03 * s);
    ctx.fillRect(0.1 * s, -0.12 * s, 0.08 * s, 0.03 * s);
    // grand sourire
    ctx.beginPath();
    ctx.moveTo(-0.3 * s, 0.22 * s);
    ctx.quadraticCurveTo(0, 0.55 * s, 0.3 * s, 0.22 * s);
    ctx.closePath();
    fillStroke(ctx, '#FFFFFF', s, 0.05);
  },

  /* Le joueur, devenu roi de la Terre (pour l'animation de fin) */
  king(ctx, s, t) {
    // cape
    ctx.beginPath();
    ctx.moveTo(-0.35 * s, 0.1 * s);
    ctx.quadraticCurveTo(-0.95 * s, 0.7 * s, -0.8 * s, 1.15 * s);
    ctx.lineTo(0.8 * s, 1.15 * s);
    ctx.quadraticCurveTo(0.95 * s, 0.7 * s, 0.35 * s, 0.1 * s);
    ctx.closePath();
    fillStroke(ctx, '#D63B5A', s);
    for (let i = 0; i < 7; i++) {
      const x = -0.75 + i * 0.25;
      ellipse(ctx, x * s, 1.12 * s, 0.13 * s, 0.08 * s);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      circle(ctx, x * s, 1.12 * s, 0.025 * s);
      ctx.fillStyle = INK;
      ctx.fill();
    }
    // combinaison
    ellipse(ctx, 0, 0.62 * s, 0.42 * s, 0.45 * s);
    fillStroke(ctx, '#F2F4F8', s);
    ellipse(ctx, 0, 0.3 * s, 0.3 * s, 0.08 * s);
    fillStroke(ctx, '#FFC93C', s, 0.04);
    // bras qui salue avec le sceptre
    const wave = Math.sin(t * 5) * 0.25;
    ctx.save();
    ctx.translate(0.3 * s, 0.4 * s);
    ctx.rotate(0.75 + wave);
    ctx.beginPath();
    ctx.roundRect(-0.08 * s, -0.5 * s, 0.16 * s, 0.5 * s, 0.08 * s);
    fillStroke(ctx, '#F2F4F8', s, 0.045);
    ctx.strokeStyle = '#C99212';
    ctx.lineWidth = 0.07 * s;
    ctx.beginPath();
    ctx.moveTo(0, -0.45 * s);
    ctx.lineTo(0, -0.95 * s);
    ctx.stroke();
    star(ctx, 0, -1.02 * s, 0.13 * s, '#FFD24A');
    ctx.restore();
    // tête
    circle(ctx, 0, -0.18 * s, 0.38 * s);
    fillStroke(ctx, SKIN, s);
    ctx.save();
    circle(ctx, 0, -0.18 * s, 0.38 * s);
    ctx.clip();
    ctx.fillStyle = '#6B3E26';
    ctx.beginPath();
    ctx.moveTo(-0.5 * s, -0.7 * s);
    ctx.lineTo(0.5 * s, -0.7 * s);
    ctx.lineTo(0.5 * s, -0.25 * s);
    ctx.quadraticCurveTo(0.15 * s, -0.4 * s, 0, -0.3 * s);
    ctx.quadraticCurveTo(-0.2 * s, -0.42 * s, -0.5 * s, -0.22 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // yeux fermés de bonheur
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.05 * s;
    ctx.lineCap = 'round';
    [-0.14, 0.14].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x * s, -0.14 * s, 0.07 * s, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    });
    cheeks(ctx, s, -0.02, 0.24);
    smile(ctx, s, 0.0, 0.13, true);
    crown(ctx, s, -0.5, 0.32);
  },
};

export const CHARACTER_IDS = Object.keys(DRAW);

export function drawCharacter(ctx, id, s, t = 0) {
  ctx.save();
  DRAW[id](ctx, s, t);
  ctx.restore();
}

/** Petite image du personnage (pour les listes et les fenêtres). */
export function characterThumb(id, size = 96) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.translate(size / 2, size / 2 + size * 0.05);
  drawCharacter(ctx, id, size * 0.4, 1);
  return c.toDataURL();
}
