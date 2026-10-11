// ============================================================================
// LES CONSTRUCTIONS — trois sortes de bâtiments, réutilisables dans tous les
// niveaux (un chapitre choisit son type avec "building") :
//   - domes   : deux dômes et un tunnel (la base lunaire)
//   - colonie : une serre et des habitats (la base martienne)
//   - tour    : une haute station avec une parabole (la station de Triton)
//   - body    : l'astre lui-même est le bâtiment (la Station spatiale)
//
// Chaque bâtiment est dessiné posé au sol en (0, 0) et monte vers le haut
// (y négatif). BUILDING_SIZE donne sa largeur et sa hauteur.
// ============================================================================

const TAU = Math.PI * 2;
const INK = '#2E2A4D';

export const BUILDING_SIZE = {
  domes: { w: 80, h: 42 },
  colonie: { w: 100, h: 52 },
  tour: { w: 70, h: 74 },
};

function dome(c, x, r, fill, glass = false) {
  c.beginPath();
  c.arc(x, 0, r, Math.PI, TAU);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 1.6;
  c.stroke();
  // reflet
  c.strokeStyle = glass ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, 0, r * 0.72, Math.PI * 1.15, Math.PI * 1.4);
  c.stroke();
}

function blink(c, x, y, t, phase, color = '#FF6F91') {
  const on = Math.sin(t * 4 + phase) > 0;
  c.fillStyle = on ? color : 'rgba(255,255,255,0.3)';
  c.beginPath();
  c.arc(x, y, 2.6, 0, TAU);
  c.fill();
  if (on) {
    c.fillStyle = 'rgba(255,111,145,0.25)';
    c.beginPath();
    c.arc(x, y, 6, 0, TAU);
    c.fill();
  }
}

function antenna(c, x, h, t, phase) {
  c.strokeStyle = '#8C97BC';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, 0);
  c.lineTo(x, -h);
  c.stroke();
  blink(c, x, -h, t, phase);
}

function solarPanel(c, x, y, w, h) {
  c.fillStyle = '#2E5FB8';
  c.strokeStyle = '#C9CED8';
  c.lineWidth = 1.4;
  c.beginPath();
  c.rect(x, y, w, h);
  c.fill();
  c.stroke();
  c.strokeStyle = 'rgba(158,231,255,0.6)';
  c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 1; i < 3; i++) { c.moveTo(x, y + (h * i) / 3); c.lineTo(x + w, y + (h * i) / 3); }
  c.moveTo(x + w / 2, y);
  c.lineTo(x + w / 2, y + h);
  c.stroke();
}

/** La base lunaire : deux dômes reliés par un tunnel, un panneau solaire et un drapeau */
function lunarBase(c, t) {
  c.fillStyle = '#8C97BC';
  c.beginPath();
  c.ellipse(0, 0, 40, 5, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#C9CED8';
  c.strokeStyle = INK;
  c.lineWidth = 1.4;
  c.beginPath();
  c.rect(-14, -9, 30, 8);
  c.fill();
  c.stroke();
  dome(c, -18, 18, '#E8EDF5');
  dome(c, 20, 13, '#E8EDF5');
  // hublots
  [[-24, -7], [-12, -7], [-18, -13], [20, -6]].forEach(([x, y]) => {
    c.fillStyle = '#9EE7FF';
    c.beginPath();
    c.arc(x, y, 2.6, 0, TAU);
    c.fill();
  });
  // panneau solaire sur son mât
  c.strokeStyle = '#8C97BC';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(36, 0);
  c.lineTo(36, -22);
  c.stroke();
  solarPanel(c, 28, -40, 16, 18);
  antenna(c, -37, 30, t, 0);
  // drapeau de la Cabane
  c.strokeStyle = '#C9CED8';
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(4, -12);
  c.lineTo(4, -30);
  c.stroke();
  c.fillStyle = '#FFC93C';
  c.beginPath();
  c.moveTo(4, -30);
  c.lineTo(14 + Math.sin(t * 3) * 1.5, -27);
  c.lineTo(4, -24);
  c.closePath();
  c.fill();
}

/** La base martienne : une serre, deux habitats, une antenne parabolique */
function marsBase(c, t) {
  c.fillStyle = '#7A4A3A';
  c.beginPath();
  c.ellipse(0, 0, 50, 6, 0, 0, TAU);
  c.fill();
  // serre en verre, avec des plantes dedans
  dome(c, -20, 24, 'rgba(160,240,200,0.55)', true);
  c.save();
  c.beginPath();
  c.arc(-20, 0, 23, Math.PI, TAU);
  c.clip();
  for (let i = 0; i < 6; i++) {
    const x = -36 + i * 6.5, h = 6 + (i % 3) * 3;
    c.fillStyle = i % 2 ? '#58C97B' : '#3FA35E';
    c.beginPath();
    c.ellipse(x, -h, 3, h, 0, 0, TAU);
    c.fill();
  }
  c.restore();
  // deux habitats en forme de cylindre
  [[10, 22, 18], [30, 18, 14]].forEach(([x, w, h]) => {
    c.fillStyle = '#F2F4F8';
    c.strokeStyle = INK;
    c.lineWidth = 1.4;
    c.beginPath();
    c.roundRect(x - w / 2, -h, w, h, 5);
    c.fill();
    c.stroke();
    c.fillStyle = '#FF8A3C';
    c.fillRect(x - w / 2 + 1, -h * 0.55, w - 2, 3);
    c.fillStyle = '#9EE7FF';
    c.beginPath();
    c.arc(x, -h * 0.75, 2.5, 0, TAU);
    c.fill();
  });
  // antenne parabolique
  c.strokeStyle = '#8C97BC';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(44, 0);
  c.lineTo(44, -34);
  c.stroke();
  c.save();
  c.translate(44, -38);
  c.rotate(-0.6 + Math.sin(t * 0.5) * 0.2);
  c.fillStyle = '#E8EDF5';
  c.strokeStyle = INK;
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(0, 0, 11, 5, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
  blink(c, 44, -48, t, 1.3);
  antenna(c, -46, 26, t, 2.1);
}

/** La station de Triton : une tour, un anneau, une grande parabole et des panneaux glacés */
function tritonStation(c, t) {
  // pieds
  c.strokeStyle = '#8C97BC';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-22, 0);
  c.lineTo(-10, -20);
  c.moveTo(22, 0);
  c.lineTo(10, -20);
  c.stroke();
  // tour
  c.fillStyle = '#E8EDF5';
  c.strokeStyle = INK;
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(-10, -58, 20, 52, 6);
  c.fill();
  c.stroke();
  for (let i = 0; i < 4; i++) {
    c.fillStyle = Math.sin(t * 2 + i) > -0.3 ? '#9EE7FF' : '#5A84F0';
    c.fillRect(-4, -50 + i * 11, 8, 5);
  }
  // anneau habitable
  c.fillStyle = '#C9CED8';
  c.beginPath();
  c.ellipse(0, -40, 32, 7, 0, 0, TAU);
  c.fill();
  c.stroke();
  // panneaux bleu glacier
  solarPanel(c, -34, -26, 14, 10);
  solarPanel(c, 20, -26, 14, 10);
  // parabole au sommet, qui vise les étoiles
  c.save();
  c.translate(0, -60);
  c.rotate(-0.4);
  c.fillStyle = '#F2F4F8';
  c.beginPath();
  c.ellipse(0, -4, 13, 6, 0, Math.PI, TAU);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = INK;
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, -4);
  c.lineTo(0, -14);
  c.stroke();
  c.restore();
  blink(c, -3, -76, t, 0.7, '#9EE7FF');
  blink(c, 30, -40, t, 2.5);
  blink(c, -30, -40, t, 4.2);
}

const DRAW = { domes: lunarBase, colonie: marsBase, tour: tritonStation };

/** Une grue jaune de chantier, avec son crochet qui se balance */
function crane(c, x, h, t) {
  c.save();
  c.strokeStyle = '#FFC93C';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, 0);
  c.lineTo(x, -h);
  c.lineTo(x - h * 0.7, -h);
  c.moveTo(x, -h + 8);
  c.lineTo(x - h * 0.7, -h);
  for (let y = 0; y > -h; y -= 8) { c.moveTo(x - 3, y); c.lineTo(x + 3, y - 8); }
  c.stroke();
  const hx = x - h * 0.5 + Math.sin(t * 1.6) * 4;
  c.strokeStyle = '#C9CED8';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - h * 0.5, -h);
  c.lineTo(hx, -h * 0.5);
  c.stroke();
  c.fillStyle = '#FF8A3C';
  c.fillRect(hx - 4, -h * 0.5, 8, 6);
  c.restore();
}

/**
 * Dessine un bâtiment (au sol en 0, 0). "k" = avancement (0 à 1) :
 * on voit sa silhouette en transparence, et la partie construite monte petit à petit.
 */
export function drawBuilding(c, id, k, t) {
  drawConstruction(c, (cc) => DRAW[id](cc, t), BUILDING_SIZE[id], k, t);
}

/** Même chose pour n'importe quel dessin "draw(c)" de taille {w, h} posé au sol. */
export function drawConstruction(c, draw, size, k, t) {
  if (k >= 1) {
    draw(c);
    return;
  }
  c.save();
  c.globalAlpha = 0.22;
  draw(c);
  c.restore();
  if (k > 0) {
    const top = -size.h * k - 2;
    c.save();
    c.beginPath();
    c.rect(-size.w, top, size.w * 2, size.h * k + 12);
    c.clip();
    draw(c);
    c.restore();
    // étincelles de soudure sur la partie en cours
    for (let i = 0; i < 3; i++) {
      const x = Math.sin(t * 7 + i * 2.1) * size.w * 0.35;
      c.fillStyle = i % 2 ? '#FFF6C8' : '#FFC93C';
      c.beginPath();
      c.arc(x, top + 1, 1.8 + Math.random() * 1.5, 0, TAU);
      c.fill();
    }
  }
  crane(c, size.w / 2 + 10, size.h + 14, t);
}

/** Petite image d'un bâtiment fini (pour les fenêtres) */
export function buildingThumb(id, px = 120) {
  const s = BUILDING_SIZE[id];
  const cv = document.createElement('canvas');
  cv.width = cv.height = px;
  const c = cv.getContext('2d');
  const k = (px * 0.8) / Math.max(s.w, s.h);
  c.translate(px / 2, px / 2 + (s.h * k) / 2);
  c.scale(k, k);
  DRAW[id](c, 1);
  return cv.toDataURL();
}
