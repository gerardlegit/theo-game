// ============================================================================
// Les dessins du jeu, tout en vectoriel (pas d'emoji ni d'image) :
// décors pré-rendus en "sprites" (avec des versions réduites pour rester nets
// et rapides à petite taille), la voiture, le papi et le petit garçon qui danse.
// ============================================================================

const TAU = Math.PI * 2;
const SUPERSAMPLE = 2;   // les sprites sont dessinés en double résolution

/* ---------- Sprite : un dessin pré-rendu et ses réductions successives ---------- */
class Sprite {
  constructor(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w * SUPERSAMPLE;
    c.height = h * SUPERSAMPLE;
    const g = c.getContext('2d');
    g.scale(SUPERSAMPLE, SUPERSAMPLE);
    draw(g, w, h);
    this.aspect = w / h;
    this.levels = [c];
    let cur = c;
    while (cur.width > 24 && cur.height > 24) {
      const n = document.createElement('canvas');
      n.width = Math.ceil(cur.width / 2);
      n.height = Math.ceil(cur.height / 2);
      const ng = n.getContext('2d');
      ng.imageSmoothingQuality = 'high';
      ng.drawImage(cur, 0, 0, n.width, n.height);
      this.levels.push(n);
      cur = n;
    }
  }

  /** Dessine le sprite posé en (x, bottom), haut de hPx pixels écran. */
  draw(ctx, x, bottom, hPx, pxRatio = 1, anchorX = 0.5) {
    const wPx = hPx * this.aspect;
    const need = hPx * pxRatio;
    let lvl = this.levels[0];
    for (const l of this.levels) {
      if (l.height >= need) lvl = l;
      else break;
    }
    ctx.drawImage(lvl, x - wPx * anchorX, bottom - hPx, wPx, hPx);
  }
}

/* ---------- Petits outils de dessin ---------- */
function blob(g, circles, color) {
  g.fillStyle = color;
  g.beginPath();
  circles.forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); });
  g.fill();
}
function rrect(g, x, y, w, h, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
function poly(g, pts, color) {
  g.fillStyle = color;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function lin(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}
function ellipse(g, x, y, rx, ry, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, TAU);
  g.fill();
}

/** Étoile à n branches (pour les particules et les décorations). */
export function starPath(c, x, y, r, inner = 0.48, points = 5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = rot + (i * Math.PI) / points;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath();
}

/* ======================= Décors ======================= */

function roundTree(col) {
  return new Sprite(200, 250, (g) => {
    rrect(g, 89, 150, 22, 100, 6, '#8B5E3C');
    rrect(g, 100, 150, 11, 100, 5, '#6E4529');
    blob(g, [[100, 105, 80], [46, 134, 44], [152, 132, 46], [100, 156, 48]], col.dark);
    blob(g, [[93, 98, 72], [50, 124, 36], [142, 118, 38], [92, 140, 42]], col.mid);
    blob(g, [[80, 74, 36], [56, 106, 22], [114, 60, 24]], col.light);
    blob(g, [[70, 62, 9], [98, 48, 6], [52, 98, 6]], 'rgba(255,255,255,0.28)');
  });
}

function pineTree(col, snowy) {
  return new Sprite(150, 280, (g) => {
    rrect(g, 66, 222, 18, 58, 4, '#7A4E2D');
    rrect(g, 75, 222, 9, 58, 3, '#5E3A20');
    [[242, 70, 120], [182, 57, 62], [120, 44, 8]].forEach(([by, hw, ay]) => {
      g.fillStyle = col.dark;
      g.beginPath();
      g.moveTo(75, ay);
      g.lineTo(75 + hw, by);
      g.quadraticCurveTo(75, by + 16, 75 - hw, by);
      g.closePath();
      g.fill();
      g.fillStyle = col.mid;
      g.beginPath();
      g.moveTo(75, ay);
      g.lineTo(75, by + 8);
      g.quadraticCurveTo(75 - hw * 0.55, by + 8, 75 - hw, by);
      g.closePath();
      g.fill();
      if (snowy) {
        const h = by - ay;
        poly(g, [
          [75, ay], [75 + hw * 0.36, ay + h * 0.36], [75 + hw * 0.16, ay + h * 0.3],
          [75, ay + h * 0.4], [75 - hw * 0.16, ay + h * 0.3], [75 - hw * 0.36, ay + h * 0.36],
        ], '#F4FAFF');
      }
    });
  });
}

function bush(flowers) {
  return new Sprite(160, 100, (g) => {
    blob(g, [[44, 66, 34], [88, 54, 42], [124, 68, 32]], '#2F8F45');
    blob(g, [[42, 62, 28], [84, 50, 36], [120, 64, 26]], '#4DB653');
    blob(g, [[70, 34, 16], [36, 52, 10]], '#86D96A');
    if (flowers) {
      [[30, 58], [58, 40], [92, 30], [112, 52], [76, 70], [132, 72], [48, 80], [100, 78]].forEach(([x, y], i) => {
        blob(g, [[x, y, 6]], flowers[i % flowers.length]);
        blob(g, [[x, y, 2.2]], '#FFE680');
      });
    }
  });
}

function tulips() {
  return new Sprite(140, 80, (g) => {
    blob(g, [[30, 78, 22], [70, 76, 26], [110, 78, 22]], '#3FA34D');
    const heads = [[22, 34, '#FF4D6D'], [46, 24, '#FFC21A'], [70, 32, '#FF7EB6'], [94, 22, '#9B5BFF'], [118, 34, '#FF4D6D']];
    heads.forEach(([x, y, color]) => {
      g.strokeStyle = '#3FA34D';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 2, 76);
      g.stroke();
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(x - 9, y);
      g.lineTo(x - 9, y - 12);
      g.lineTo(x - 4, y - 6);
      g.lineTo(x, y - 14);
      g.lineTo(x + 4, y - 6);
      g.lineTo(x + 9, y - 12);
      g.lineTo(x + 9, y);
      g.quadraticCurveTo(x, y + 10, x - 9, y);
      g.fill();
    });
  });
}

function house(col) {
  return new Sprite(240, 232, (g) => {
    // cheminée
    rrect(g, 160, 30, 24, 60, 3, '#B5523B');
    rrect(g, 156, 24, 32, 10, 3, '#8E3B29');
    // murs
    rrect(g, 32, 100, 176, 130, 6, col.wall);
    g.fillStyle = col.shade;
    g.fillRect(32, 108, 176, 14);
    g.fillRect(176, 108, 32, 122);
    // toit
    g.lineJoin = 'round';
    g.lineWidth = 10;
    g.strokeStyle = col.roof;
    g.fillStyle = col.roof;
    g.beginPath();
    g.moveTo(10, 112); g.lineTo(120, 20); g.lineTo(230, 112);
    g.closePath();
    g.fill();
    g.stroke();
    poly(g, [[120, 20], [230, 112], [120, 112]], col.roofDark);
    g.fillStyle = 'rgba(255,255,255,0.14)';
    for (let i = 1; i < 4; i++) {
      const y = 20 + i * 23, half = (y - 20) * (110 / 92);
      g.fillRect(120 - half, y, half * 2, 3);
    }
    rrect(g, 2, 106, 236, 13, 6, col.roofDark);
    // lucarne ronde
    blob(g, [[120, 74, 15]], '#FFFFFF');
    blob(g, [[120, 74, 11]], '#8FD3F5');
    g.fillStyle = '#FFFFFF';
    g.fillRect(119, 63, 2, 22);
    g.fillRect(109, 73, 22, 2);
    // fenêtres avec jardinière
    [48, 152].forEach((x) => {
      rrect(g, x - 3, 137, 46, 42, 6, '#FFFFFF');
      g.fillStyle = lin(g, 0, 140, 0, 176, [[0, '#CDEFFF'], [1, '#79C3EE']]);
      g.beginPath(); g.roundRect(x + 2, 142, 36, 32, 3); g.fill();
      g.fillStyle = '#FFFFFF';
      g.fillRect(x + 19, 142, 3, 32);
      g.fillRect(x + 2, 156, 36, 3);
      rrect(g, x - 4, 180, 48, 9, 3, '#9C6B43');
      [[x + 4, 178], [x + 14, 176], [x + 24, 178], [x + 34, 176]].forEach(([fx, fy], i) =>
        blob(g, [[fx, fy, 5]], i % 2 ? '#FF7EB6' : '#FF4D6D'));
    });
    // porte
    rrect(g, 104, 160, 32, 70, [16, 16, 0, 0], '#9C6B43');
    rrect(g, 108, 166, 24, 60, [12, 12, 0, 0], '#B07B50');
    blob(g, [[127, 198, 3]], '#FFD54A');
    rrect(g, 96, 226, 48, 6, 2, '#B9B1A5');
  });
}

// Le tronc courbé et les palmes d'un palmier, dessinés dans un repère 240 × 330
function drawPalm(g) {
  for (let i = 0; i <= 44; i++) {
    const t = i / 44;
    const x = (1 - t) * (1 - t) * 110 + 2 * (1 - t) * t * 96 + t * t * 140;
    const y = (1 - t) * (1 - t) * 330 + 2 * (1 - t) * t * 200 + t * t * 94;
    const r = 13 - t * 6;
    blob(g, [[x, y - r, r]], Math.floor(t * 13) % 2 ? '#A8743F' : '#946230');
    blob(g, [[x - r * 0.35, y - r * 1.1, r * 0.35]], 'rgba(255,255,255,0.12)');
  }
  const leaf = (ang, len, wid, droop, color) => {
    const a = (ang * Math.PI) / 180;
    const x = 140, y = 92;
    const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len + droop;
    const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
    const nx = -dy / d, ny = dx / d;
    const mx = (x + tx) / 2, my = (y + ty) / 2 - droop * 0.7;
    const side = ny > 0 ? -1 : 1;   // la palme se bombe vers le haut
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(mx + nx * wid * side, my + ny * wid * side, tx, ty);
    g.quadraticCurveTo(mx - nx * wid * 0.35 * side, my - ny * wid * 0.35 * side, x, y);
    g.fill();
    g.strokeStyle = 'rgba(20, 80, 30, 0.45)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(mx, my, tx, ty);
    g.stroke();
  };
  [[-160, 92, 20, 40], [-20, 96, 20, 44], [-120, 86, 18, 22], [-60, 84, 18, 22]].forEach(([a, l, w, d]) => leaf(a, l, w, d, '#2E9447'));
  [[175, 80, 18, 36], [5, 86, 18, 42], [-140, 96, 20, 50], [-40, 96, 20, 52], [-90, 64, 16, 6]].forEach(([a, l, w, d]) => leaf(a, l, w, d, '#49B95A'));
  blob(g, [[132, 102, 8], [148, 104, 8], [140, 112, 8]], '#7A4A22');
  blob(g, [[130, 99, 3], [146, 101, 3]], 'rgba(255,255,255,0.25)');
}

function palm() {
  return new Sprite(240, 330, drawPalm);
}

function parasol(color) {
  return new Sprite(200, 210, (g) => {
    rrect(g, 96, 66, 7, 144, 3, '#F4F4F4');
    rrect(g, 100, 66, 3, 144, 2, '#D2D2D2');
    g.save();
    g.beginPath();
    g.moveTo(6, 78);
    g.quadraticCurveTo(10, 14, 100, 12);
    g.quadraticCurveTo(190, 14, 194, 78);
    for (let i = 6; i > 0; i--) {
      const x0 = 6 + (i * 188) / 6, x1 = 6 + ((i - 1) * 188) / 6;
      g.quadraticCurveTo((x0 + x1) / 2, 92, x1, 78);
    }
    g.closePath();
    g.fillStyle = color;
    g.fill();
    g.clip();
    g.fillStyle = '#FFFFFF';
    for (let i = 0; i < 6; i += 2) {
      const x0 = 6 + (i * 188) / 6, x1 = 6 + ((i + 1) * 188) / 6;
      poly(g, [[100, 10], [x0, 96], [x1, 96]], '#FFFFFF');
    }
    g.fillStyle = 'rgba(0, 0, 0, 0.08)';
    g.fillRect(100, 0, 100, 100);
    g.restore();
    blob(g, [[100, 12, 6]], '#F4F4F4');
  });
}

function sandCastle() {
  return new Sprite(170, 140, (g) => {
    const S = '#F2CF85', D = '#DDB66A';
    rrect(g, 16, 76, 138, 64, 6, S);
    [[8, 48, 40], [122, 48, 40], [62, 30, 46]].forEach(([x, y, w]) => {
      rrect(g, x, y, w, 140 - y, 4, S);
      g.fillStyle = D;
      g.fillRect(x + w * 0.7, y + 4, w * 0.3, 136 - y);
      for (let k = 0; k < 3; k++) rrect(g, x + k * (w / 3) + 1, y - 9, w / 3 - 4, 11, 2, k === 2 ? D : S);
    });
    rrect(g, 72, 104, 26, 36, [13, 13, 0, 0], '#B88844');
    g.fillStyle = '#7A4E2D';
    g.fillRect(84, 2, 3, 22);
    poly(g, [[87, 3], [108, 9], [87, 16]], '#FF4D5E');
    [[30, 100], [140, 100], [50, 120]].forEach(([x, y]) => blob(g, [[x, y, 3]], '#FFFFFF'));
  });
}

function sailBoat() {
  return new Sprite(180, 220, (g) => {
    g.fillStyle = '#7A4E2D';
    g.fillRect(88, 18, 5, 154);
    g.fillStyle = lin(g, 95, 0, 160, 0, [[0, '#FFFFFF'], [1, '#DDE8F4']]);
    g.beginPath();
    g.moveTo(96, 24); g.quadraticCurveTo(140, 90, 160, 160); g.lineTo(96, 160);
    g.closePath(); g.fill();
    g.fillStyle = '#F4F8FC';
    g.beginPath();
    g.moveTo(85, 40); g.quadraticCurveTo(52, 100, 30, 160); g.lineTo(85, 160);
    g.closePath(); g.fill();
    poly(g, [[93, 18], [116, 24], [93, 30]], '#FFC21A');
    g.fillStyle = '#E8505B';
    g.beginPath();
    g.moveTo(14, 168); g.lineTo(166, 168);
    g.quadraticCurveTo(152, 204, 126, 210); g.lineTo(54, 210);
    g.quadraticCurveTo(28, 204, 14, 168);
    g.fill();
    g.fillStyle = '#FFFFFF';
    g.fillRect(22, 178, 136, 6);
  });
}

function island() {
  return new Sprite(420, 170, (g) => {
    g.save();
    g.translate(222, 152); g.scale(0.42, 0.42); g.translate(-110, -330);
    drawPalm(g);
    g.restore();
    g.save();
    g.translate(170, 156); g.scale(0.32, 0.32); g.translate(-110, -330); g.scale(-1, 1); g.translate(-240, 0);
    drawPalm(g);
    g.restore();
    g.fillStyle = '#F3D89B';
    g.beginPath(); g.ellipse(210, 170, 190, 34, 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#E6C580';
    g.beginPath(); g.ellipse(250, 170, 140, 18, 0, Math.PI, TAU); g.fill();
    blob(g, [[150, 142, 18], [178, 138, 14]], '#4DB653');
  });
}

function lighthouse() {
  return new Sprite(130, 330, (g) => {
    g.save();
    g.beginPath();
    g.moveTo(31, 300); g.lineTo(43, 90); g.lineTo(87, 90); g.lineTo(99, 300);
    g.closePath();
    g.clip();
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 80, 130, 230);
    g.fillStyle = '#E8505B';
    for (let y = 120; y < 300; y += 70) g.fillRect(0, y, 130, 35);
    g.fillStyle = 'rgba(0, 0, 0, 0.1)';
    g.fillRect(65, 80, 65, 230);
    g.restore();
    rrect(g, 58, 250, 16, 50, [8, 8, 0, 0], '#3A3F5C');
    rrect(g, 59, 150, 12, 18, 5, '#3A3F5C');
    rrect(g, 30, 80, 70, 12, 3, '#3A3F5C');
    rrect(g, 44, 46, 42, 36, 4, '#FFE27A');
    blob(g, [[65, 64, 12]], '#FFF6C8');
    g.fillStyle = '#3A3F5C';
    [44, 58, 72, 84].forEach((x) => g.fillRect(x, 46, 2, 36));
    g.fillStyle = '#E8505B';
    g.beginPath(); g.arc(65, 47, 24, Math.PI, TAU); g.fill();
    blob(g, [[65, 20, 5]], '#3A3F5C');
    blob(g, [[34, 318, 28], [92, 318, 32], [64, 306, 28]], '#8E97A8');
    blob(g, [[44, 304, 14], [70, 296, 12]], '#A9B2C2');
  });
}

function rock(mossy) {
  return new Sprite(150, 100, (g) => {
    poly(g, [[8, 100], [20, 58], [55, 28], [100, 24], [136, 52], [146, 100]], '#7F889D');
    poly(g, [[20, 60], [55, 30], [84, 36], [64, 74], [24, 86]], '#A7B0C2');
    poly(g, [[100, 26], [136, 54], [146, 100], [104, 100], [96, 60]], '#6C758B');
    if (mossy) blob(g, [[58, 32, 14], [80, 30, 12], [40, 46, 10]], '#5DBE62');
  });
}

function mushroom() {
  return new Sprite(130, 140, (g) => {
    rrect(g, 46, 66, 38, 74, 14, '#FFF1DC');
    rrect(g, 68, 66, 16, 74, 8, '#EAD7BC');
    ellipse(g, 65, 72, 50, 10, '#E9C9A6');
    g.fillStyle = '#F04E4E';
    g.beginPath(); g.ellipse(65, 72, 62, 56, 0, Math.PI, TAU); g.closePath(); g.fill();
    g.fillStyle = '#C93232';
    g.beginPath(); g.ellipse(65, 72, 62, 56, 0, -Math.PI / 2, 0); g.lineTo(65, 72); g.closePath(); g.fill();
    blob(g, [[40, 40, 10], [78, 30, 8], [96, 54, 9], [58, 60, 6], [22, 62, 6]], '#FFFFFF');
  });
}

function cloud() {
  return new Sprite(320, 150, (g) => {
    g.save();
    g.beginPath(); g.rect(0, 0, 320, 128); g.clip();
    blob(g, [[80, 100, 48], [150, 80, 62], [226, 92, 52], [272, 110, 36], [40, 114, 30]], '#D5E7F6');
    blob(g, [[80, 94, 44], [150, 72, 58], [222, 86, 48], [268, 106, 30], [42, 110, 26]], '#FFFFFF');
    g.restore();
  });
}

function balloon(c1, c2) {
  return new Sprite(140, 200, (g) => {
    g.strokeStyle = '#6E5A44';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(50, 144); g.lineTo(58, 170);
    g.moveTo(90, 144); g.lineTo(82, 170);
    g.stroke();
    rrect(g, 56, 168, 28, 24, 4, '#A0703F');
    g.fillStyle = '#7F5530';
    g.fillRect(56, 176, 28, 3);
    g.save();
    g.beginPath();
    g.moveTo(48, 142);
    g.bezierCurveTo(10, 108, 4, 60, 28, 28);
    g.bezierCurveTo(48, 2, 92, 2, 112, 28);
    g.bezierCurveTo(136, 60, 130, 108, 92, 142);
    g.closePath();
    g.fillStyle = c1;
    g.fill();
    g.clip();
    [[48, c2], [30, c1], [12, c2]].forEach(([rx, color]) => ellipse(g, 70, 70, rx, 90, color));
    g.fillStyle = lin(g, 0, 0, 140, 0, [[0, 'rgba(255,255,255,0.3)'], [0.45, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.18)']]);
    g.fillRect(0, 0, 140, 150);
    g.restore();
    rrect(g, 48, 138, 44, 8, 3, '#5E4A6E');
  });
}

function windmillBody() {
  return new Sprite(200, 300, (g) => {
    poly(g, [[58, 300], [142, 300], [124, 100], [76, 100]], '#F4EBDD');
    poly(g, [[100, 300], [142, 300], [124, 100], [100, 100]], '#DED1BD');
    poly(g, [[66, 108], [134, 108], [100, 60]], '#C0504D');
    poly(g, [[100, 60], [134, 108], [100, 108]], '#9C3B39');
    rrect(g, 88, 246, 24, 54, [12, 12, 0, 0], '#8B5E3C');
    rrect(g, 90, 160, 18, 22, [9, 9, 2, 2], '#6FA8D6');
    blob(g, [[100, 92, 9]], '#5B4636');
  });
}

/** Les ailes du moulin, qui tournent (centre en x, y ; r en pixels). */
export function drawWindmillBlades(c, x, y, r, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  for (let i = 0; i < 4; i++) {
    c.rotate(Math.PI / 2);
    c.fillStyle = '#6B4E37';
    c.fillRect(-r * 0.03, 0, r * 0.06, r);
    c.fillStyle = 'rgba(255, 250, 240, 0.92)';
    c.fillRect(r * 0.04, r * 0.22, r * 0.2, r * 0.76);
    c.strokeStyle = 'rgba(107, 78, 55, 0.55)';
    c.lineWidth = Math.max(0.5, r * 0.015);
    for (let k = 1; k < 4; k++) {
      const yy = r * (0.22 + k * 0.19);
      c.beginPath(); c.moveTo(r * 0.04, yy); c.lineTo(r * 0.24, yy); c.stroke();
    }
  }
  c.fillStyle = '#5B4636';
  c.beginPath(); c.arc(0, 0, r * 0.08, 0, TAU); c.fill();
  c.restore();
}

const GREEN = { dark: '#2F8F45', mid: '#4DB653', light: '#86D96A' };
const LIGHT = { dark: '#3C9A3A', mid: '#66C451', light: '#A8E274' };
const BLOSSOM = { dark: '#D9638E', mid: '#F493B4', light: '#FFD0E0' };
const AUTUMN = { dark: '#D9822B', mid: '#F2A541', light: '#FFD27A' };
const FOREST = { dark: '#1F6E46', mid: '#2E8F57', light: '#5DB86F' };

/** Construit tous les décors (à appeler une fois au démarrage). */
export function buildScenery() {
  return {
    treeGreen: roundTree(GREEN),
    treeLight: roundTree(LIGHT),
    treeBlossom: roundTree(BLOSSOM),
    treeAutumn: roundTree(AUTUMN),
    treeForest: roundTree(FOREST),
    pine: pineTree({ dark: '#1E6B47', mid: '#2F8A55' }, false),
    pineSnow: pineTree({ dark: '#1E6B47', mid: '#2F8A55' }, true),
    bushPink: bush(['#FF7EB6', '#FFFFFF']),
    bushYellow: bush(['#FFD23F', '#FFFFFF']),
    bush: bush(null),
    tulips: tulips(),
    houseRed: house({ wall: '#FFF1DC', shade: '#F0DDC0', roof: '#E8505B', roofDark: '#C23B47' }),
    houseBlue: house({ wall: '#FFE3EC', shade: '#F2CAD8', roof: '#4D7CFE', roofDark: '#3A61CF' }),
    houseOrange: house({ wall: '#E3F4FF', shade: '#C9E3F2', roof: '#FF9F43', roofDark: '#DA7F28' }),
    palm: palm(),
    parasolRed: parasol('#FF5A6E'),
    parasolBlue: parasol('#3D8BFF'),
    castle: sandCastle(),
    boat: sailBoat(),
    island: island(),
    lighthouse: lighthouse(),
    rock: rock(false),
    rockMoss: rock(true),
    mushroom: mushroom(),
    windmill: windmillBody(),
    cloud: cloud(),
    balloonA: balloon('#FF5A6E', '#FFD23F'),
    balloonB: balloon('#3D8BFF', '#FFFFFF'),
    balloonC: balloon('#22C97A', '#FFC21A'),
  };
}

/* ======================= La voiture ======================= */

export const CAR_COLORS = [
  { id: 'rouge', label: 'Rouge', body: '#FF4D5E', dark: '#C42640', light: '#FF9AA4' },
  { id: 'bleu', label: 'Bleue', body: '#3D8BFF', dark: '#1F5BC4', light: '#9CC4FF' },
  { id: 'jaune', label: 'Jaune', body: '#FFC21A', dark: '#D68F00', light: '#FFE07A' },
  { id: 'vert', label: 'Verte', body: '#22C97A', dark: '#139257', light: '#86EAB8' },
  { id: 'violet', label: 'Violette', body: '#9B5BFF', dark: '#6B32CC', light: '#C9A8FF' },
];

export const CAR_SPRITE_W = 260, CAR_SPRITE_H = 200;
// position des feux arrière dans le dessin (pour les allumer au freinage)
export const TAIL_LIGHTS = [[45, 118], [215, 118]];

/** La voiture vue de derrière, avec le petit pilote blond et le signe du calcul. */
export function carSprite(col, symbol) {
  return new Sprite(CAR_SPRITE_W, CAR_SPRITE_H, (g) => {
    // pneus
    [20, 196].forEach((x) => {
      rrect(g, x, 138, 44, 60, 12, '#24213A');
      g.fillStyle = '#3B3758';
      for (let y = 170; y < 194; y += 8) g.fillRect(x + 5, y, 34, 3);
    });
    // antenne et son petit drapeau à damier
    g.strokeStyle = '#2E2A4D';
    g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(190, 40); g.lineTo(200, 4); g.stroke();
    rrect(g, 199, 3, 22, 14, 2, '#FFFFFF');
    g.fillStyle = '#2E2A4D';
    [[199, 3], [213, 3], [206, 10]].forEach(([x, y]) => g.fillRect(x, y, 7, 7));
    // cabine
    const cabin = new Path2D();
    cabin.moveTo(42, 102); cabin.lineTo(62, 44);
    cabin.quadraticCurveTo(68, 28, 86, 28); cabin.lineTo(174, 28);
    cabin.quadraticCurveTo(192, 28, 198, 44); cabin.lineTo(218, 102);
    cabin.closePath();
    g.fillStyle = col.dark;
    g.fill(cabin);
    rrect(g, 76, 26, 108, 10, 5, col.light);
    rrect(g, 112, 26, 10, 10, 2, 'rgba(255,255,255,0.85)');
    rrect(g, 138, 26, 10, 10, 2, 'rgba(255,255,255,0.85)');
    // vitre arrière, avec le pilote aux cheveux blonds en épis
    const glass = new Path2D();
    glass.moveTo(58, 100); glass.lineTo(74, 48);
    glass.quadraticCurveTo(77, 40, 86, 40); glass.lineTo(174, 40);
    glass.quadraticCurveTo(183, 40, 186, 48); glass.lineTo(202, 100);
    glass.closePath();
    g.fillStyle = lin(g, 0, 40, 0, 100, [[0, '#22305A'], [1, '#4C6FA6']]);
    g.fill(glass);
    g.save();
    g.clip(glass);
    blob(g, [[156, 84, 18]], '#1B2547');            // appui-tête du passager
    blob(g, [[104, 86, 24]], '#F9D548');
    poly(g, [[80, 80], [84, 56], [94, 68], [100, 50], [108, 66], [118, 54], [120, 74], [128, 84]], '#F9D548');
    blob(g, [[96, 74, 6]], 'rgba(255,255,255,0.35)');
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.beginPath(); g.moveTo(130, 40); g.lineTo(158, 40); g.lineTo(122, 100); g.lineTo(94, 100); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.beginPath(); g.moveTo(166, 40); g.lineTo(174, 40); g.lineTo(138, 100); g.lineTo(130, 100); g.closePath(); g.fill();
    g.restore();
    // rétroviseurs
    rrect(g, 18, 74, 26, 18, 7, col.body);
    rrect(g, 216, 74, 26, 18, 7, col.body);
    // carrosserie
    g.fillStyle = lin(g, 0, 92, 0, 168, [[0, col.light], [0.25, col.body], [1, col.dark]]);
    g.beginPath(); g.roundRect(8, 92, 244, 76, 30); g.fill();
    rrect(g, 30, 97, 200, 5, 3, 'rgba(255,255,255,0.4)');
    // bandes de course
    rrect(g, 112, 92, 10, 26, 2, 'rgba(255,255,255,0.9)');
    rrect(g, 138, 92, 10, 26, 2, 'rgba(255,255,255,0.9)');
    // feux arrière
    [20, 190].forEach((x) => {
      rrect(g, x, 106, 50, 24, 10, '#9E1028');
      g.fillStyle = lin(g, 0, 109, 0, 125, [[0, '#FF7A7A'], [1, '#E0263C']]);
      g.beginPath(); g.roundRect(x + 4, 109, 42, 16, 8); g.fill();
      rrect(g, x + 10, 111, 14, 4, 2, 'rgba(255,255,255,0.6)');
    });
    // plaque avec le signe du calcul
    rrect(g, 96, 122, 68, 32, 8, '#2E2A4D');
    rrect(g, 99, 125, 62, 26, 6, '#FFFFFF');
    g.save();
    g.translate(130, 138);
    if (symbol === '×') g.rotate(Math.PI / 4);
    g.fillStyle = symbol === '×' ? '#FF3D7F' : '#12A88A';
    g.beginPath(); g.roundRect(-11, -3, 22, 6, 3); g.fill();
    g.beginPath(); g.roundRect(-3, -11, 6, 22, 3); g.fill();
    g.restore();
    // pare-chocs et pot d'échappement
    rrect(g, 24, 154, 212, 18, 9, '#3C3A57');
    rrect(g, 34, 155, 192, 4, 2, '#5C5982');
    ellipse(g, 200, 172, 10, 6, '#8D8AAA');
    ellipse(g, 200, 172, 6, 3.5, '#24213A');
  });
}

/* ======================= Le papi ======================= */

/**
 * Un papi en gilet, casquette et canne, posé en (x, gy) ; s = pixels par mètre.
 * dir = sens de la marche ; scared = 0…1 quand il saute pour éviter la voiture.
 */
export function drawGrandpa(c, x, gy, s, t, dir, scared = 0) {
  const PANTS = '#5E6A86', SHOE = '#3A2E2A', CARDI = '#E07B53', CARDI_D = '#BF5E39';
  const SKIN = '#FFD3B0', HAIR = '#F4F4F4', CAP = '#7B6A58';
  const swing = scared ? Math.sin(t * 20) * 0.08 : Math.sin(t * 7) * 0.14;
  c.save();
  c.translate(x, gy);
  c.scale(s, s);
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // jambes et chaussures
  [[-0.07, swing], [0.07, -swing]].forEach(([hx, fx]) => {
    c.strokeStyle = PANTS;
    c.lineWidth = 0.14;
    c.beginPath(); c.moveTo(hx, -0.8); c.lineTo(hx + fx, -0.08); c.stroke();
    ellipse(c, hx + fx + dir * 0.05, -0.05, 0.1, 0.055, SHOE);
  });

  // gilet
  c.fillStyle = CARDI;
  c.beginPath(); c.roundRect(-0.25, -1.44, 0.5, 0.7, 0.16); c.fill();
  c.fillStyle = CARDI_D;
  c.beginPath(); c.roundRect(0.08, -1.44, 0.17, 0.7, [0, 0.16, 0.16, 0]); c.fill();
  c.fillStyle = '#FFFFFF';
  c.fillRect(-0.03, -1.4, 0.06, 0.18);
  [-1.16, -1.0, -0.86].forEach((y) => ellipse(c, 0, y, 0.025, 0.025, '#F7D9A8'));

  // bras : la canne du côté où il marche, ou les deux bras en l'air s'il a peur
  c.strokeStyle = CARDI;
  c.lineWidth = 0.11;
  if (scared) {
    [-1, 1].forEach((side) => {
      c.beginPath(); c.moveTo(side * 0.2, -1.34); c.lineTo(side * 0.42, -1.72 + swing); c.stroke();
      ellipse(c, side * 0.44, -1.76 + swing, 0.06, 0.06, SKIN);
    });
  } else {
    c.beginPath(); c.moveTo(-dir * 0.2, -1.32); c.lineTo(-dir * (0.3 + swing * 0.4), -0.92); c.stroke();
    ellipse(c, -dir * (0.3 + swing * 0.4), -0.88, 0.055, 0.055, SKIN);
    c.beginPath(); c.moveTo(dir * 0.2, -1.32); c.lineTo(dir * 0.4, -1.02); c.stroke();
    c.strokeStyle = '#8B5A2B';
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(dir * 0.32, -1.1);
    c.quadraticCurveTo(dir * 0.4, -1.18, dir * 0.42, -1.02);
    c.lineTo(dir * (0.48 + swing * 0.4), 0);
    c.stroke();
    ellipse(c, dir * 0.4, -1.02, 0.055, 0.055, SKIN);
  }

  // tête
  const hy = -1.64;
  ellipse(c, 0, hy, 0.2, 0.21, SKIN);
  ellipse(c, -0.2, hy + 0.02, 0.05, 0.06, SKIN);
  ellipse(c, 0.2, hy + 0.02, 0.05, 0.06, SKIN);
  ellipse(c, -0.18, hy - 0.02, 0.07, 0.08, HAIR);
  ellipse(c, 0.18, hy - 0.02, 0.07, 0.08, HAIR);
  // casquette
  c.fillStyle = CAP;
  c.beginPath(); c.ellipse(0, hy - 0.06, 0.21, 0.15, 0, Math.PI, TAU); c.fill();
  ellipse(c, dir * 0.1, hy - 0.06, 0.17, 0.045, '#5E5040');
  // lunettes, yeux, moustache
  c.strokeStyle = '#3A2E2A';
  c.lineWidth = 0.022;
  [-1, 1].forEach((side) => {
    c.beginPath(); c.arc(side * 0.075 + dir * 0.02, hy + 0.02, 0.055, 0, TAU); c.stroke();
    ellipse(c, side * 0.075 + dir * 0.03, hy + 0.02, scared ? 0.025 : 0.016, scared ? 0.025 : 0.016, '#2E2A4D');
  });
  ellipse(c, dir * 0.02, hy + 0.12, 0.11, 0.04, HAIR);
  if (scared) ellipse(c, dir * 0.02, hy + 0.17, 0.035, 0.04, '#9A2F3F');
  ellipse(c, -0.13, hy + 0.08, 0.035, 0.025, 'rgba(255, 111, 145, 0.4)');
  ellipse(c, 0.13, hy + 0.08, 0.035, 0.025, 'rgba(255, 111, 145, 0.4)');
  c.restore();
}

/* ======================= Le petit garçon qui danse ======================= */

// Dessine le garçon debout en (x, gy), s = pixels par mètre, t = temps de la danse.
// Trois danses ridicules qui s'enchaînent : la poule, le « floss » et le disco.
export function drawBoy(c, x, gy, s, t) {
  const beat = t * 8;
  const move = Math.floor(t / 2.4) % 3;
  const b = Math.sin(beat);
  const bounce = Math.abs(b) * 0.07;
  const hipX = move === 1 ? -b * 0.1 : Math.sin(beat / 2) * 0.05;
  const hipY = -(0.55 + bounce - (move === 0 ? 0.1 : 0));
  const tilt = move === 1 ? b * 0.12 : Math.sin(beat / 2) * 0.15;
  const SKIN = '#FFD2A8', SHIRT = '#FF8A3D', HAIR = '#F9D548', GLASSES = '#2F6FE0';

  c.save();
  c.translate(x, gy);
  c.scale(s, s);
  c.lineCap = 'round';
  c.lineJoin = 'round';

  ellipse(c, 0, 0, 0.32, 0.06, 'rgba(46, 42, 77, 0.2)');

  // jambes et baskets
  [-1, 1].forEach((side) => {
    let foot = [side * 0.13, 0];
    let knee;
    if (move === 0) {                 // accroupi, genoux écartés
      foot = [side * 0.22, 0];
      knee = [hipX + side * 0.3, hipY * 0.5];
    } else if (move === 2) {          // un pied en l'air, puis l'autre
      const up = Math.max(0, Math.sin(beat / 2) * side);
      foot = [side * (0.13 + up * 0.28), -up * 0.35];
      knee = [hipX + side * (0.12 + up * 0.15), hipY * 0.5 - up * 0.2];
    } else {
      knee = [(hipX + foot[0]) / 2 + side * 0.03, hipY / 2];
    }
    c.strokeStyle = SKIN;
    c.lineWidth = 0.09;
    c.beginPath();
    c.moveTo(hipX + side * 0.08, hipY);
    c.lineTo(knee[0], knee[1]);
    c.lineTo(foot[0], foot[1]);
    c.stroke();
    ellipse(c, foot[0] + side * 0.04, foot[1] - 0.02, 0.09, 0.05, '#E8453C');
  });

  // short
  c.fillStyle = '#3D5A98';
  c.beginPath();
  c.roundRect(hipX - 0.18, hipY - 0.08, 0.36, 0.18, 0.05);
  c.fill();

  // Le haut du corps se dandine autour des hanches
  c.translate(hipX, hipY);
  c.rotate(tilt);

  // bras : épaule → coude → main
  [-1, 1].forEach((side) => {
    const sh = [side * 0.16, -0.34];
    let elbow, hand;
    if (move === 0) {                 // la poule : les coudes battent comme des ailes
      const flap = Math.sin(beat * 2) * 0.1;
      elbow = [side * 0.36, -0.28 - flap];
      hand = [side * 0.12, -0.26];
    } else if (move === 1) {          // le floss : les bras balancent d'un côté à l'autre
      elbow = [sh[0] + b * 0.16, -0.18];
      hand = [side * 0.08 + b * 0.38, -0.02];
    } else {                          // disco : un bras au ciel, l'autre en bas
      const high = Math.sin(beat / 2) * side > 0;
      elbow = high ? [side * 0.3, -0.58] : [side * 0.28, -0.14];
      hand = high ? [side * 0.36, -0.86] : [side * 0.3, 0.06];
    }
    c.strokeStyle = SHIRT;
    c.lineWidth = 0.1;
    c.beginPath();
    c.moveTo(sh[0], sh[1]);
    c.lineTo(elbow[0], elbow[1]);
    c.stroke();
    c.strokeStyle = SKIN;
    c.lineWidth = 0.075;
    c.beginPath();
    c.moveTo(elbow[0], elbow[1]);
    c.lineTo(hand[0], hand[1]);
    c.stroke();
  });

  // tee-shirt avec une grosse étoile
  c.fillStyle = SHIRT;
  c.beginPath();
  c.roundRect(-0.18, -0.42, 0.36, 0.44, 0.09);
  c.fill();
  c.fillStyle = '#FFE27A';
  starPath(c, 0, -0.2, 0.09, 0.45);
  c.fill();

  // tête qui dodeline
  c.translate(0, -0.42);
  c.rotate(Math.sin(beat * 2) * 0.15);
  const hy = -0.17;
  ellipse(c, 0, hy, 0.17, 0.17, SKIN);

  // cheveux blonds en épis
  c.fillStyle = HAIR;
  c.beginPath();
  c.arc(0, hy - 0.02, 0.18, Math.PI * 1.05, Math.PI * 1.95);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-0.15, hy - 0.1);
  [[-0.12, hy - 0.28], [-0.06, hy - 0.17], [0, hy - 0.32], [0.06, hy - 0.17], [0.13, hy - 0.27], [0.16, hy - 0.08]]
    .forEach(([px, py]) => c.lineTo(px, py));
  c.closePath();
  c.fill();

  // lunettes bleues
  c.strokeStyle = GLASSES;
  c.lineWidth = 0.028;
  [-1, 1].forEach((side) => {
    c.beginPath();
    c.arc(side * 0.075, hy, 0.058, 0, TAU);
    c.stroke();
  });
  c.beginPath();
  c.moveTo(-0.017, hy);
  c.lineTo(0.017, hy);
  c.stroke();
  // yeux qui roulent
  const look = Math.sin(beat) * 0.018;
  [-1, 1].forEach((side) => ellipse(c, side * 0.075 + look, hy + 0.005, 0.017, 0.017, '#2E2A4D'));

  // joues, grand sourire et langue tirée
  [-1, 1].forEach((side) => ellipse(c, side * 0.12, hy + 0.07, 0.03, 0.03, 'rgba(255, 111, 145, 0.45)'));
  c.fillStyle = '#9A2F3F';
  c.beginPath();
  c.arc(0, hy + 0.06, 0.065, 0.1 * Math.PI, 0.9 * Math.PI);
  c.closePath();
  c.fill();
  ellipse(c, 0.015, hy + 0.12, 0.028, 0.035, '#FF6F91');

  c.restore();
}

// Une note de musique dessinée (croche)
function drawNote(c, x, y, size, color) {
  c.fillStyle = color;
  c.strokeStyle = color;
  c.lineWidth = size * 0.12;
  c.beginPath();
  c.ellipse(x, y, size * 0.3, size * 0.22, -0.4, 0, TAU);
  c.fill();
  c.beginPath();
  c.moveTo(x + size * 0.26, y - size * 0.05);
  c.lineTo(x + size * 0.26, y - size * 0.95);
  c.quadraticCurveTo(x + size * 0.6, y - size * 0.7, x + size * 0.62, y - size * 0.45);
  c.stroke();
}

// Des notes de musique qui s'envolent autour de lui
export function drawNotes(c, x, gy, s, t) {
  const colors = ['#FF4D8B', '#3D8BFF', '#FFB020'];
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.7 + i / 3) % 1;
    c.globalAlpha = Math.sin(k * Math.PI);
    const side = i % 2 === 0 ? -1 : 1;
    drawNote(c, x + side * (0.45 + k * 0.2) * s, gy - (1.1 + k * 0.6) * s, 0.24 * s, colors[i]);
  }
  c.globalAlpha = 1;
}
