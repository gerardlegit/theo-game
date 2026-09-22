import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";
import { SPACE_OBJECTS } from "./data.js";
import { renderArt } from "./art.js";

const GAME_ID = "espace";

/* ---------- Réglages du jeu ---------- */
const W = 1000, H = 640;           // taille "logique" de l'aire de jeu
const OBJECTS_PER_GAME = 8;
const ART_R = 50;                  // rayon des dessins
const DOCK_R = 64;                 // rayon de la zone de livraison autour d'une image
const SLOT_XS = [130, 373, 627, 870];
const SLOT_YS = [108, 530];        // rangée du haut / rangée du bas
const BAND = { top: 240, bottom: 405 }; // bande centrale où flottent les noms
const SHIP_START = { x: W / 2, y: (BAND.top + BAND.bottom) / 2 };

const ACCEL = 950;                 // px/s²
const DRAG = 0.3;                  // part de la vitesse gardée après 1 s sans moteur
const MAX_SPEED = 340;
const TETHER = 62;                 // distance entre le vaisseau et le nom transporté
const PICK_MARGIN = 20;

const LABEL_FONT = '700 20px "Baloo 2", "Quicksand", sans-serif';
const LABEL_H = 36;

/* ---------- Éléments de la page ---------- */
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const deliveredCountEl = document.getElementById('deliveredCount');
const totalCountEl = document.getElementById('totalCount');
const startOverlay = document.getElementById('startOverlay');
const factToast = document.getElementById('factToast');

const winBanner = document.getElementById('winBanner');
const winTime = document.getElementById('winTime');
const confettiLayer = document.getElementById('confettiLayer');
const scoreForm = document.getElementById('scoreForm');
const pseudoInput = document.getElementById('pseudoInput');
const scoreSaved = document.getElementById('scoreSaved');
const leaderboardList = document.getElementById('leaderboardList');

/* ---------- État ---------- */
const arts = {};                   // id -> dessin pré-rendu
let bgCanvas = null;
let twinkles = [];

let state = 'loading';             // 'loading' | 'ready' | 'playing' | 'won'
let targets = [];
let labels = [];
let carried = null;
let delivered = 0;
let particles = [];
let floaters = [];
let ship = null;
let startTime = 0;
let finalScore = null;
let factTimeout = null;

const keys = { left: false, right: false, up: false, down: false };
const touchDirs = { left: false, right: false, up: false, down: false };

/* ---------- Utilitaires ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Distance entre un point et le rectangle d'une étiquette (0 si dedans). */
function distToLabel(px, py, l) {
  const dx = Math.max(Math.abs(px - l.x) - l.w / 2, 0);
  const dy = Math.max(Math.abs(py - l.y) - l.h / 2, 0);
  return Math.hypot(dx, dy);
}

function elapsedSeconds() {
  return (performance.now() - startTime) / 1000;
}

/* ---------- Préparation du canvas et du ciel étoilé ---------- */
function setupCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function buildBackground() {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = W * 2;
  bgCanvas.height = H * 2;
  const b = bgCanvas.getContext('2d');
  b.scale(2, 2);

  const g = b.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0B0F33');
  g.addColorStop(1, '#05061A');
  b.fillStyle = g;
  b.fillRect(0, 0, W, H);

  // Voiles colorés très discrets
  [[180, 520, 320, '120,70,220', 0.18], [820, 120, 300, '40,120,220', 0.16], [560, 330, 380, '220,70,150', 0.08]]
    .forEach(([x, y, r, c, a]) => {
      const n = b.createRadialGradient(x, y, 0, x, y, r);
      n.addColorStop(0, `rgba(${c},${a})`);
      n.addColorStop(1, `rgba(${c},0)`);
      b.fillStyle = n;
      b.fillRect(0, 0, W, H);
    });

  for (let i = 0; i < 320; i++) {
    const s = Math.random() < 0.9 ? rand(0.4, 1.1) : rand(1.2, 1.8);
    b.fillStyle = `rgba(255,255,255,${rand(0.25, 0.9)})`;
    b.beginPath();
    b.arc(Math.random() * W, Math.random() * H, s, 0, Math.PI * 2);
    b.fill();
  }

  twinkles = Array.from({ length: 45 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    s: rand(1, 2.2),
    phase: Math.random() * Math.PI * 2,
    speed: rand(1.2, 3),
  }));
}

/* ---------- Nouvelle partie ---------- */
function newGame() {
  const chosen = shuffle(SPACE_OBJECTS).slice(0, OBJECTS_PER_GAME);
  const slots = shuffle(SLOT_YS.flatMap((y) => SLOT_XS.map((x) => ({ x, y }))));

  targets = chosen.map((obj, i) => ({
    obj,
    x: slots[i].x + rand(-12, 12),
    y: slots[i].y + rand(-6, 6),
    done: false,
    shake: 0,
    cooldown: 0,
    phase: Math.random() * Math.PI * 2,
  }));

  // Les noms démarrent en 2 rangées dans la bande centrale, dans le désordre
  ctx.font = LABEL_FONT;
  const labelSpots = shuffle(
    [BAND.top + 18, BAND.bottom - 18].flatMap((y) => [150, 375, 625, 850].map((x) => ({ x, y })))
  );
  labels = shuffle(chosen).map((obj, i) => {
    const w = Math.ceil(ctx.measureText(obj.name).width) + 34;
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(14, 30);
    return {
      obj,
      w,
      h: LABEL_H,
      x: labelSpots[i].x + rand(-30, 30),
      y: labelSpots[i].y + rand(-8, 8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.6,
      state: 'free',
      cooldown: 0,
      placeX: 0,
      placeY: 0,
      pop: 0,
    };
  });

  ship = { x: SHIP_START.x, y: SHIP_START.y, vx: 0, vy: 0, angle: -Math.PI / 2, thrust: false };
  carried = null;
  delivered = 0;
  particles = [];
  floaters = [];
  finalScore = null;

  deliveredCountEl.textContent = '0';
  totalCountEl.textContent = String(chosen.length);
  timerEl.textContent = '0';
  hideFact();
}

function startGame() {
  startOverlay.hidden = true;
  state = 'playing';
  startTime = performance.now();
}

function showStartScreen() {
  newGame();
  state = 'ready';
  startOverlay.hidden = false;
}

/* ---------- Commandes ---------- */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',     // KeyA = touche Q sur un clavier AZERTY
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',           // KeyW = touche Z sur un clavier AZERTY
  ArrowDown: 'down', KeyS: 'down',
};

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
}

window.addEventListener('keydown', (e) => {
  if (isTyping(e) || winBanner.classList.contains('show')) return;
  const dir = KEYMAP[e.code];
  if (dir) {
    keys[dir] = true;
    e.preventDefault();
    if (state === 'ready') startGame();
    return;
  }
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (state === 'ready') startGame();
    else if (state === 'playing' && e.code === 'Space') dropCarried();
  }
});

window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) keys[dir] = false;
  if (e.code === 'Space' && !isTyping(e)) e.preventDefault();
});

window.addEventListener('blur', () => {
  Object.keys(keys).forEach((k) => { keys[k] = false; });
});

// Croix directionnelle tactile
document.querySelectorAll('.dpad button').forEach((btn) => {
  const dir = btn.dataset.dir;
  const press = (e) => {
    e.preventDefault();
    touchDirs[dir] = true;
    btn.classList.add('pressed');
    if (state === 'ready') startGame();
  };
  const release = () => {
    touchDirs[dir] = false;
    btn.classList.remove('pressed');
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
});
document.getElementById('dropBtn').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (state === 'playing') dropCarried();
});

function isDown(dir) {
  return keys[dir] || touchDirs[dir];
}

function dropCarried() {
  if (!carried) return;
  carried.state = 'free';
  carried.vx = ship.vx * 0.3;
  carried.vy = ship.vy * 0.3;
  carried.cooldown = 0.8;
  carried = null;
}

/* ---------- Effets ---------- */
function burst(x, y, count, colors, speed = 220) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(speed * 0.3, speed);
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0,
      max: rand(0.5, 1.1),
      size: rand(2, 4.5),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function addFloater(text, x, y, color) {
  floaters.push({ text, x, y, life: 0, max: 1.2, color });
}

function showFact(obj) {
  factToast.innerHTML = `<strong>${escapeHtml(obj.name)}</strong> — ${escapeHtml(obj.fact)}`;
  factToast.hidden = false;
  // Relance l'animation d'apparition
  factToast.style.animation = 'none';
  void factToast.offsetWidth;
  factToast.style.animation = '';
  clearTimeout(factTimeout);
  factTimeout = setTimeout(hideFact, 4500);
}

function hideFact() {
  clearTimeout(factTimeout);
  factToast.hidden = true;
}

/* ---------- Mise à jour ---------- */
function updateShip(dt) {
  let ax = 0, ay = 0;
  if (isDown('left')) ax -= 1;
  if (isDown('right')) ax += 1;
  if (isDown('up')) ay -= 1;
  if (isDown('down')) ay += 1;
  const len = Math.hypot(ax, ay);
  ship.thrust = len > 0;
  if (len) {
    ship.vx += (ax / len) * ACCEL * dt;
    ship.vy += (ay / len) * ACCEL * dt;
  }
  const drag = Math.pow(DRAG, dt);
  ship.vx *= drag;
  ship.vy *= drag;
  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > MAX_SPEED) {
    ship.vx *= MAX_SPEED / speed;
    ship.vy *= MAX_SPEED / speed;
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  const m = 22;
  if (ship.x < m) { ship.x = m; ship.vx = Math.abs(ship.vx) * 0.5; }
  if (ship.x > W - m) { ship.x = W - m; ship.vx = -Math.abs(ship.vx) * 0.5; }
  if (ship.y < m) { ship.y = m; ship.vy = Math.abs(ship.vy) * 0.5; }
  if (ship.y > H - m) { ship.y = H - m; ship.vy = -Math.abs(ship.vy) * 0.5; }

  if (speed > 25) {
    ship.angle = lerpAngle(ship.angle, Math.atan2(ship.vy, ship.vx), Math.min(1, dt * 10));
  }

  // Traînée du réacteur
  if (ship.thrust && Math.random() < 0.8) {
    const bx = ship.x - Math.cos(ship.angle) * 24;
    const by = ship.y - Math.sin(ship.angle) * 24;
    particles.push({
      x: bx + rand(-3, 3), y: by + rand(-3, 3),
      vx: -Math.cos(ship.angle) * 90 + rand(-25, 25),
      vy: -Math.sin(ship.angle) * 90 + rand(-25, 25),
      life: 0, max: rand(0.25, 0.45), size: rand(2, 3.5),
      color: Math.random() < 0.5 ? '#FFC93C' : '#FF8A3C',
    });
  }
}

function updateLabels(dt) {
  for (const l of labels) {
    if (l.pop > 0) l.pop = Math.max(0, l.pop - dt * 2.5);

    if (l.state === 'placed') {
      l.x += (l.placeX - l.x) * Math.min(1, dt * 10);
      l.y += (l.placeY - l.y) * Math.min(1, dt * 10);
      continue;
    }

    if (l.state === 'carried') {
      const tx = ship.x - Math.cos(ship.angle) * TETHER;
      const ty = ship.y - Math.sin(ship.angle) * TETHER;
      l.x += (tx - l.x) * Math.min(1, dt * 9);
      l.y += (ty - l.y) * Math.min(1, dt * 9);
      continue;
    }

    // Nom qui flotte librement
    l.cooldown = Math.max(0, l.cooldown - dt);
    l.x += l.vx * dt;
    l.y += l.vy * dt;

    // Un nom lâché ralentit puis revient doucement dans la bande centrale
    const sp = Math.hypot(l.vx, l.vy);
    if (sp > 40) {
      const k = Math.pow(0.35, dt);
      l.vx *= k;
      l.vy *= k;
    }
    if (l.y < BAND.top) l.vy += 90 * dt;
    else if (l.y > BAND.bottom) l.vy -= 90 * dt;
    else if ((l.y + l.vy * dt < BAND.top && l.vy < 0) || (l.y + l.vy * dt > BAND.bottom && l.vy > 0)) {
      l.vy = -l.vy; // rebond sur les bords de la bande
    }

    const minX = l.w / 2 + 8, maxX = W - l.w / 2 - 8;
    if (l.x < minX) { l.x = minX; l.vx = Math.abs(l.vx); }
    if (l.x > maxX) { l.x = maxX; l.vx = -Math.abs(l.vx); }

    // Ramassage
    if (state === 'playing' && !carried && l.cooldown === 0 && distToLabel(ship.x, ship.y, l) < PICK_MARGIN) {
      carried = l;
      l.state = 'carried';
      l.pop = 1;
      burst(l.x, l.y, 10, ['#9EE7FF', '#FFFFFF'], 120);
    }
  }
}

function updateTargets(dt) {
  for (const t of targets) {
    t.shake = Math.max(0, t.shake - dt);
    t.cooldown = Math.max(0, t.cooldown - dt);
  }
  if (!carried) return;

  for (const t of targets) {
    if (t.done) continue;
    const dShip = Math.hypot(ship.x - t.x, ship.y - t.y);
    const dLabel = Math.hypot(carried.x - t.x, carried.y - t.y);
    if (Math.min(dShip, dLabel) > DOCK_R) continue;

    if (t.obj.id === carried.obj.id) {
      deliver(t);
      return;
    }
    if (t.cooldown === 0) reject(t, dShip);
  }
}

function deliver(t) {
  const l = carried;
  carried = null;
  l.state = 'placed';
  l.placeX = t.x;
  // L'étiquette se range côté bord de l'écran, pour libérer la bande centrale
  l.placeY = t.y + (t.y < H / 2 ? -(ART_R + 26) : ART_R + 26);
  l.pop = 1;
  t.done = true;
  delivered += 1;
  deliveredCountEl.textContent = String(delivered);

  burst(t.x, t.y, 40, ['#FFC93C', '#FF6F91', '#4FB8E8', '#58C97B', '#FFFFFF'], 260);
  addFloater('Bravo !', t.x, t.y - ART_R - 10, '#7CF0A0');
  showFact(t.obj);

  if (delivered === targets.length) {
    finishGame();
  }
}

function reject(t, dShip) {
  t.shake = 0.45;
  t.cooldown = 0.9;
  // Petit rebond du vaisseau pour bien sentir que ce n'est pas la bonne image
  const d = Math.max(dShip, 1);
  const nx = (ship.x - t.x) / d, ny = (ship.y - t.y) / d;
  ship.vx = nx * 280;
  ship.vy = ny * 280;
  addFloater('Oups ! Pas ici', t.x, t.y - ART_R - 10, '#FF8FA8');
  burst(t.x + nx * DOCK_R * 0.6, t.y + ny * DOCK_R * 0.6, 8, ['#FF6F91', '#FF9FB5'], 100);
}

function updateEffects(dt) {
  for (const p of particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.2, dt);
    p.vy *= Math.pow(0.2, dt);
  }
  particles = particles.filter((p) => p.life < p.max);

  for (const f of floaters) {
    f.life += dt;
    f.y -= 30 * dt;
  }
  floaters = floaters.filter((f) => f.life < f.max);
}

function update(dt) {
  if (state === 'playing') {
    updateShip(dt);
    updateLabels(dt);
    updateTargets(dt);
    timerEl.textContent = String(Math.floor(elapsedSeconds()));
  } else if (state === 'ready') {
    updateLabels(dt); // les noms flottent déjà derrière l'écran de départ
  }
  updateEffects(dt);
}

/* ---------- Dessin ---------- */
function drawBackground(now) {
  ctx.drawImage(bgCanvas, 0, 0, W, H);
  for (const s of twinkles) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(now / 1000 * s.speed + s.phase));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTargets(now) {
  const t0 = now / 1000;
  for (const t of targets) {
    const bob = Math.sin(t0 * 1.3 + t.phase) * 3;
    const shakeX = t.shake > 0 ? Math.sin(t.shake * 60) * 5 * (t.shake / 0.45) : 0;
    const x = t.x + shakeX, y = t.y + bob;

    // Zone de livraison
    ctx.save();
    ctx.lineWidth = 2.5;
    if (t.done) {
      ctx.strokeStyle = 'rgba(88,201,123,0.9)';
      ctx.shadowColor = 'rgba(88,201,123,0.8)';
      ctx.shadowBlur = 18;
    } else {
      const near = carried && Math.hypot(ship.x - t.x, ship.y - t.y) < DOCK_R + 60;
      ctx.strokeStyle = t.shake > 0 ? 'rgba(255,111,145,0.9)' : near ? 'rgba(255,201,60,0.85)' : 'rgba(255,255,255,0.22)';
      ctx.setLineDash([8, 7]);
      ctx.lineDashOffset = -t0 * 12;
    }
    ctx.beginPath();
    ctx.arc(t.x, t.y, DOCK_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const art = arts[t.obj.id];
    ctx.drawImage(art.canvas, x - art.half, y - art.half, art.half * 2, art.half * 2);
  }
}

function drawLabel(l, now) {
  const scale = 1 + l.pop * 0.25;
  const wobble = l.state === 'free' ? Math.sin(now / 700 + l.x * 0.01) * 0.04 : 0;
  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(wobble);
  ctx.scale(scale, scale);

  let bg = '#FFFFFF', fg = '#2E2A4D', glow = 'rgba(255,255,255,0.45)';
  if (l.state === 'carried') { bg = '#FFC93C'; glow = 'rgba(255,201,60,0.8)'; }
  if (l.state === 'placed') { bg = '#58C97B'; fg = '#FFFFFF'; glow = 'rgba(88,201,123,0.6)'; }

  ctx.shadowColor = glow;
  ctx.shadowBlur = l.state === 'free' ? 10 : 18;
  roundRectPath(-l.w / 2, -l.h / 2, l.w, l.h, l.h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = fg;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(l.state === 'placed' ? `✓ ${l.obj.name}` : l.obj.name, 0, 2);
  ctx.restore();
}

function drawBeam(now) {
  if (!carried) return;
  const bx = ship.x - Math.cos(ship.angle) * 18;
  const by = ship.y - Math.sin(ship.angle) * 18;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(120,220,255,0.25)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(carried.x, carried.y);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,240,255,0.9)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -now / 25;
  ctx.stroke();
  ctx.restore();
}

function drawShip(now) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.scale(1.15, 1.15);

  if (carried) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34);
    g.addColorStop(0, 'rgba(120,220,255,0.35)');
    g.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flamme du réacteur
  if (ship.thrust) {
    const f = 14 + Math.sin(now / 35) * 4 + Math.random() * 4;
    const g = ctx.createLinearGradient(-17, 0, -17 - f * 1.6, 0);
    g.addColorStop(0, 'rgba(255,255,220,0.95)');
    g.addColorStop(0.4, 'rgba(255,180,60,0.9)');
    g.addColorStop(1, 'rgba(255,80,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-16, -7);
    ctx.quadraticCurveTo(-17 - f * 1.6, 0, -16, 7);
    ctx.closePath();
    ctx.fill();
  }

  // Ailerons
  ctx.fillStyle = '#FF6F91';
  ctx.strokeStyle = 'rgba(46,42,77,0.4)';
  ctx.lineWidth = 1;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(-4, side * 8);
    ctx.lineTo(-20, side * 20);
    ctx.lineTo(-18, side * 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Coque
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.bezierCurveTo(18, -13, -8, -13, -18, -8);
    ctx.lineTo(-18, 8);
    ctx.bezierCurveTo(-8, 13, 18, 13, 26, 0);
    ctx.closePath();
  };
  const bg = ctx.createLinearGradient(0, -12, 0, 12);
  bg.addColorStop(0, '#FFFFFF');
  bg.addColorStop(0.5, '#E6EAF5');
  bg.addColorStop(1, '#A9B3CC');
  bodyPath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.save();
  bodyPath();
  ctx.clip();
  ctx.fillStyle = '#FF6F91';
  ctx.fillRect(15, -14, 14, 28);          // nez
  ctx.fillStyle = '#FFC93C';
  ctx.fillRect(-12, -14, 3, 28);          // bande décorative
  ctx.restore();
  bodyPath();
  ctx.strokeStyle = 'rgba(46,42,77,0.45)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Hublot
  const wg = ctx.createRadialGradient(1, -2, 1, 3, 0, 7);
  wg.addColorStop(0, '#DFFAFF');
  wg.addColorStop(1, '#2E8BD6');
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7C88A8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(1, -2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEffects() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    const k = 1 - p.life / p.max;
    ctx.globalAlpha = k;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.font = '800 22px "Baloo 2", "Quicksand", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floaters) {
    ctx.globalAlpha = 1 - f.life / f.max;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(7,9,32,0.8)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

function draw(now) {
  drawBackground(now);
  drawTargets(now);
  labels.filter((l) => l.state === 'placed').forEach((l) => drawLabel(l, now));
  labels.filter((l) => l.state === 'free').forEach((l) => drawLabel(l, now));
  drawBeam(now);
  if (carried) drawLabel(carried, now);
  drawShip(now);
  drawEffects();
}

/* ---------- Boucle principale ---------- */
let lastFrame = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  update(dt);
  draw(now);
  requestAnimationFrame(loop);
}

/* ---------- Victoire + classement ---------- */
function launchConfetti() {
  const pieces = ['🚀', '⭐', '🪐', '✨', '🌟', '☄️'];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    span.className = 'confetti-piece';
    span.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    span.style.left = `${Math.random() * 100}vw`;
    span.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
    span.style.fontSize = `${1 + Math.random() * 1.2}rem`;
    confettiLayer.appendChild(span);
    setTimeout(() => span.remove(), 3000);
  }
}

function finishGame() {
  state = 'won';
  ship.thrust = false;
  const seconds = Math.floor(elapsedSeconds());
  finalScore = Math.max(1, seconds);
  timerEl.textContent = String(seconds);

  setTimeout(() => {
    winTime.innerHTML = `Tous les noms sont livrés en ${finalScore} secondes.<br>Ton score : <strong>${finalScore} points</strong><br><small>(1 point par seconde : moins tu en as, mieux c'est !)</small>`;
    scoreForm.style.display = 'block';
    scoreSaved.style.display = 'none';
    pseudoInput.value = '';
    winBanner.classList.add('show');
    launchConfetti();
  }, 900);
}

document.getElementById('playAgain').addEventListener('click', (e) => {
  e.currentTarget.blur();
  winBanner.classList.remove('show');
  showStartScreen();
});

document.getElementById('restart').addEventListener('click', (e) => {
  e.currentTarget.blur();
  winBanner.classList.remove('show');
  newGame();
  startGame();
});

document.getElementById('startBtn').addEventListener('click', (e) => {
  e.currentTarget.blur();
  startGame();
});

async function renderLeaderboard() {
  if (!isLeaderboardConfigured()) {
    leaderboardList.innerHTML =
      '<li class="leaderboard-empty">Classement mondial pas encore activé sur ce site (configuration Firebase à faire par l\'administrateur).</li>';
    return;
  }

  leaderboardList.innerHTML = '<li class="leaderboard-empty">Chargement…</li>';
  const list = await fetchTopScores(GAME_ID, 20);
  leaderboardList.innerHTML = '';

  if (list.length === 0) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty">Sois le premier du classement mondial !</li>';
    return;
  }

  list.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-time">${entry.value} pts</span>
    `;
    leaderboardList.appendChild(li);
  });
}

document.getElementById('saveScore').addEventListener('click', async () => {
  const name = pseudoInput.value.trim();
  if (!name) {
    pseudoInput.focus();
    return;
  }
  const saveBtn = document.getElementById('saveScore');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Envoi…';
  const ok = await submitScore(GAME_ID, name, finalScore);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Enregistrer mon score';

  if (ok) {
    scoreForm.style.display = 'none';
    scoreSaved.textContent = 'Score enregistré ! 🎉';
    scoreSaved.style.color = 'var(--green)';
    scoreSaved.style.display = 'block';
    renderLeaderboard();
  } else {
    scoreSaved.textContent = "Oups, l'enregistrement a échoué. Réessaie !";
    scoreSaved.style.color = 'var(--red)';
    scoreSaved.style.display = 'block';
  }
});

document.getElementById('skipScore').addEventListener('click', () => {
  scoreForm.style.display = 'none';
});

/* ---------- Démarrage ---------- */
async function init() {
  setupCanvas();
  buildBackground();
  SPACE_OBJECTS.forEach((obj) => {
    arts[obj.id] = renderArt(obj.id, ART_R);
  });
  // On attend la police des étiquettes pour mesurer correctement leur largeur
  try {
    await document.fonts.load(LABEL_FONT);
  } catch (err) {
    // tant pis, on garde la police de secours
  }
  showStartScreen();
  requestAnimationFrame(loop);
}

init();
renderLeaderboard();
