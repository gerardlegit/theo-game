import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";

const GAME_ID = "course-multiplications";

/* ---------- Règles ---------- */
const GAME_DURATION = 180;     // la route dure 3 minutes
const QUESTION_EVERY = 20;     // une multiplication toutes les 20 secondes
const FIRST_QUESTION_AT = 1;
const ANSWER_DELAY = 13;       // secondes entre l'apparition de la question et le passage des panneaux
const TOTAL_QUESTIONS = 9;     // questions à 1 s, 21 s, … 161 s : la dernière passe à 174 s, avant l'arrivée

/* ---------- Monde (en mètres) ---------- */
const SPEED = 25;                          // 90 km/h
const SPAWN_AHEAD = SPEED * ANSWER_DELAY;  // distance à laquelle les panneaux apparaissent
const DRAW_DIST = 360;
const LANE_W = 3.5;
const ROAD_HALF = LANE_W * 1.5;
const SEG_L = 6;                           // longueur d'une bande de route (alternance de couleurs)
const GATE_W = 2.8, GATE_BOTTOM = 0.5, GATE_TOP = 2.4;
const HIT_Z = 2.2;                         // distance à laquelle on traverse un panneau
const LANE_COLORS = ['#FF6F91', '#4FB8E8', '#F2B01E'];

/* ---------- Caméra / écran ---------- */
const W = 1000, H = 625;
const HORIZON = 235;
const FOCAL = 520;
const CAM_H = 1.3;
const NEAR = 1.6;
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

const canvas = document.getElementById('roadCanvas');
const ctx = canvas.getContext('2d');
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

const timerEl = document.getElementById('timer');
const pointsEl = document.getElementById('pointsCount');
const questionCountEl = document.getElementById('questionCount');
const routeFill = document.getElementById('routeFill');
const routeCar = document.getElementById('routeCar');
const startOverlay = document.getElementById('startOverlay');
const questionBanner = document.getElementById('questionBanner');
const questionText = document.getElementById('questionText');
const optionEls = [...document.querySelectorAll('#questionOptions .opt')];
const questionBarFill = document.getElementById('questionBarFill');
const questionFeedback = document.getElementById('questionFeedback');

const winBanner = document.getElementById('winBanner');
const winScore = document.getElementById('winScore');
const confettiLayer = document.getElementById('confettiLayer');
const scoreForm = document.getElementById('scoreForm');
const pseudoInput = document.getElementById('pseudoInput');
const scoreSaved = document.getElementById('scoreSaved');
const leaderboardList = document.getElementById('leaderboardList');

document.getElementById('totalCount').textContent = String(TOTAL_QUESTIONS);

/* ---------- Classement : le module partagé classe "le plus petit d'abord" ----------
 * On enregistre donc le nombre de réponses ratées + 1 (toujours > 0).
 */
const encodeScore = (pts) => TOTAL_QUESTIONS - pts + 1;
const decodePoints = (value) => TOTAL_QUESTIONS + 1 - value;

/* ---------- État de la partie ---------- */
let state = 'ready';   // ready → playing → finishing → done
let gameTime = 0;
let dist = 0;
let speed = 0;
let lane = 1;
let camX = 0;
let curve = 0, curveTarget = 0, nextCurveChangeAt = 0;
let bgOffset = 0;
let clock = 0;

let points = 0;
let questionIndex = 0;
let nextQuestionAt = FIRST_QUESTION_AT;
let currentQuestion = null;   // { a, b, answer, options, s, resolved }
let usedQuestions = new Set();
let gates = [];               // { s, lane, value, correct, hit }
let finishLine = null;        // { s }
let hideBannerAt = null;
let particles = [];
let flash = null;             // { color, life }
let doneAt = null;

/* ---------- Utilitaires ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Petit hasard "fixe" : le même arbre reste au même endroit d'une image à l'autre
function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Multiplications ---------- */
function makeQuestion() {
  let a, b, key;
  do {
    a = randInt(2, 10);   // la table
    b = randInt(1, 10);
    key = `${a}x${b}`;
  } while (usedQuestions.has(key));
  usedQuestions.add(key);

  const answer = a * b;
  // Les mauvaises réponses ressemblent à la bonne : table voisine, résultat voisin…
  const traps = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10];
  const wrong = [...new Set(traps.filter((n) => n > 0 && n !== answer))];
  const options = shuffle([answer, ...shuffle(wrong).slice(0, 2)]);

  // On affiche parfois "7 × 3", parfois "3 × 7"
  return Math.random() < 0.5 ? { a, b, answer, options } : { a: b, b: a, answer, options };
}

function spawnQuestion() {
  const q = makeQuestion();
  q.s = dist + SPAWN_AHEAD;
  q.resolved = false;
  currentQuestion = q;
  questionIndex += 1;

  gates = q.options.map((value, i) => ({ s: q.s, lane: i, value, correct: value === q.answer, hit: false }));

  questionText.textContent = `${q.a} × ${q.b} = ?`;
  optionEls.forEach((el, i) => { el.textContent = q.options[i]; });
  questionBanner.classList.remove('answered', 'good', 'bad');
  questionBanner.hidden = false;
  hideBannerAt = null;
}

function resolveQuestion() {
  const q = currentQuestion;
  q.resolved = true;
  const hitLane = clamp(Math.round(camX / LANE_W) + 1, 0, 2);
  const gate = gates[hitLane];
  gate.hit = true;

  questionText.textContent = `${q.a} × ${q.b} = ${q.answer}`;
  questionBanner.classList.add('answered');
  if (gate.correct) {
    points += 1;
    questionBanner.classList.add('good');
    questionFeedback.textContent = 'Bravo ! +1 point ⭐';
    burst(['⭐', '✨', '🌟'], 26);
    flash = { color: '88, 201, 123', life: 1 };
  } else {
    questionBanner.classList.add('bad');
    questionFeedback.textContent = `Oups ! La bonne réponse était ${q.answer}`;
    burst(['💨', '💥'], 10);
    flash = { color: '232, 87, 87', life: 1 };
  }
  hideBannerAt = gameTime + 3;
}

/* ---------- Déroulement ---------- */
function resetGame() {
  state = 'ready';
  gameTime = 0;
  dist = 0;
  speed = 0;
  lane = 1;
  camX = 0;
  curve = 0;
  curveTarget = 0;
  nextCurveChangeAt = 4;
  points = 0;
  questionIndex = 0;
  nextQuestionAt = FIRST_QUESTION_AT;
  currentQuestion = null;
  usedQuestions = new Set();
  gates = [];
  finishLine = null;
  hideBannerAt = null;
  particles = [];
  flash = null;
  doneAt = null;
  questionBanner.hidden = true;
}

function startGame() {
  resetGame();
  if (document.activeElement) document.activeElement.blur(); // sinon Espace/Entrée relancerait la course
  startOverlay.hidden = true;
  winBanner.classList.remove('show');
  state = 'playing';
}

function endGame() {
  state = 'done';
  questionBanner.hidden = true;
  const plural = points > 1 ? 's' : '';
  let cheer = 'Continue de t\'entraîner, tu vas y arriver ! 💪';
  if (points === TOTAL_QUESTIONS) cheer = 'Un sans-faute, champion des multiplications ! 🏆';
  else if (points >= TOTAL_QUESTIONS - 2) cheer = 'Superbe course ! 🚗💨';
  else if (points >= TOTAL_QUESTIONS / 2) cheer = 'Belle course, bien joué ! 👏';
  winScore.innerHTML = `<strong>${points}</strong> bonne${plural} réponse${plural} sur ${TOTAL_QUESTIONS}<br>${cheer}`;
  scoreForm.style.display = 'block';
  scoreSaved.style.display = 'none';
  pseudoInput.value = '';
  winBanner.classList.add('show');
  launchConfetti();
}

function steer(dir) {
  if (state !== 'playing') return;
  lane = clamp(lane + dir, 0, 2);
}

function update(dt) {
  clock += dt;

  if (state === 'playing') {
    gameTime += dt;
    speed = Math.min(SPEED, speed + 30 * dt);
  } else if (state === 'finishing') {
    speed = Math.max(0, speed - 12 * dt);
    if (speed === 0) {
      if (doneAt === null) doneAt = clock + 0.6;
      else if (clock >= doneAt) endGame();
    }
  }
  dist += speed * dt;

  if (state === 'playing') {
    if (questionIndex < TOTAL_QUESTIONS && gameTime >= nextQuestionAt) {
      spawnQuestion();
      nextQuestionAt += QUESTION_EVERY;
    }
    if (currentQuestion && !currentQuestion.resolved && currentQuestion.s - dist <= HIT_Z) {
      resolveQuestion();
    }
    if (hideBannerAt !== null && gameTime >= hideBannerAt) {
      questionBanner.hidden = true;
      hideBannerAt = null;
    }
    // L'arche d'arrivée apparaît au loin pour être franchie pile à 3:00
    if (!finishLine && gameTime >= GAME_DURATION - ANSWER_DELAY) {
      finishLine = { s: dist + SPEED * (GAME_DURATION - gameTime) };
    }
    if (finishLine && dist >= finishLine.s) {
      state = 'finishing';
      questionBanner.hidden = true;
      burst(['🎉', '⭐', '🎊'], 30);
    }

    // Virages doux
    if (gameTime >= nextCurveChangeAt) {
      curveTarget = [-0.0008, -0.0004, 0, 0, 0.0004, 0.0008][randInt(0, 5)];
      nextCurveChangeAt = gameTime + 5 + Math.random() * 4;
    }
  }
  if (state === 'finishing') curveTarget = 0;
  curve += (curveTarget - curve) * Math.min(1, dt * 0.6);
  bgOffset += curve * speed * dt * 900;

  camX += (((lane - 1) * LANE_W) - camX) * Math.min(1, dt * 9);

  particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 900 * dt;
    p.life -= dt;
  });
  particles = particles.filter((p) => p.life > 0);
  if (flash) {
    flash.life -= dt * 2.5;
    if (flash.life <= 0) flash = null;
  }
}

/* ---------- Dessin ---------- */
let bob = 0;

function proj(x, y, z) {
  const sc = FOCAL / z;
  return {
    x: W / 2 + (x + curve * z * z - camX) * sc,
    y: HORIZON + (CAM_H + bob - y) * sc,
    sc,
  };
}

// Trapèze horizontal : centre + demi-largeur en bas (près) et en haut (loin)
function trap(x1, y1, hw1, x2, y2, hw2, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 - hw1, y1);
  ctx.lineTo(x1 + hw1, y1);
  ctx.lineTo(x2 + hw2, y2);
  ctx.lineTo(x2 - hw2, y2);
  ctx.closePath();
  ctx.fill();
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, '#6EC6F5');
  g.addColorStop(1, '#D6F0FF');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HORIZON + 1);

  ctx.fillStyle = '#FFE27A';
  ctx.beginPath();
  ctx.arc(800 - bgOffset * 0.05, 85, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `46px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  [[120, 70], [420, 45], [650, 110], [930, 60]].forEach(([x, y], i) => {
    const span = W + 160;
    const cx = ((x - bgOffset * 0.15 + clock * (4 + i)) % span + span) % span - 80;
    ctx.fillText('☁️', cx, y);
  });

  drawHills(bgOffset * 0.25, '#B7D7E8', 55, 0.011);
  drawHills(bgOffset * 0.5, '#8FD17E', 30, 0.019);
}

function drawHills(off, color, amp, freq) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, HORIZON + 1);
  for (let x = 0; x <= W; x += 10) {
    const u = x + off;
    const h = amp * (0.65 + 0.35 * Math.sin(u * freq) + 0.25 * Math.sin(u * freq * 2.7 + 1.3));
    ctx.lineTo(x, HORIZON - h);
  }
  ctx.lineTo(W, HORIZON + 1);
  ctx.closePath();
  ctx.fill();
}

function drawRoad() {
  ctx.fillStyle = '#7ED36F';
  ctx.fillRect(0, HORIZON, W, H - HORIZON);

  const first = Math.floor(dist / SEG_L);
  const count = Math.ceil(DRAW_DIST / SEG_L);
  for (let j = count; j >= 0; j--) {
    const idx = first + j;
    let zNear = idx * SEG_L - dist;
    const zFar = zNear + SEG_L;
    if (zFar <= NEAR) continue;
    if (zNear < NEAR) zNear = NEAR;
    const a = proj(0, 0, zNear);
    const b = proj(0, 0, zFar);
    const even = idx % 2 === 0;

    ctx.fillStyle = even ? '#7ED36F' : '#73C863';
    ctx.fillRect(0, b.y, W, a.y - b.y + 1);
    trap(a.x, a.y, ROAD_HALF * 1.14 * a.sc, b.x, b.y, ROAD_HALF * 1.14 * b.sc, even ? '#FF6F91' : '#FFFFFF');
    trap(a.x, a.y, ROAD_HALF * a.sc, b.x, b.y, ROAD_HALF * b.sc, even ? '#8C90A6' : '#868AA0');
    if (even) {
      [-LANE_W / 2, LANE_W / 2].forEach((lx) => {
        trap(a.x + lx * a.sc, a.y, 0.08 * a.sc, b.x + lx * b.sc, b.y, 0.08 * b.sc, '#FFFFFF');
      });
    }
  }
}

function fogAlpha(z) {
  return clamp((DRAW_DIST - z) / 80, 0, 1);
}

function drawEmoji(char, x, groundY, px) {
  ctx.font = `${Math.round(px)}px ${EMOJI_FONT}`;
  ctx.fillText(char, x, groundY);
}

function drawScenery(item) {
  const p = proj(item.x, 0, item.z);
  const px = item.h * p.sc;
  if (px < 4 || px > 900 || p.x < -px || p.x > W + px) return;
  ctx.globalAlpha = fogAlpha(item.z);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  drawEmoji(item.char, p.x, p.y + px * 0.08, px);
  ctx.globalAlpha = 1;
}

function drawGate(g, z) {
  const x = (g.lane - 1) * LANE_W;
  const tl = proj(x - GATE_W / 2, GATE_TOP, z);
  const br = proj(x + GATE_W / 2, GATE_BOTTOM, z);
  const ground = proj(x, 0, z);
  const sc = ground.sc;
  const w = br.x - tl.x, h = br.y - tl.y;
  if (w < 2) return;

  ctx.globalAlpha = fogAlpha(z);

  // Poteaux
  ctx.fillStyle = '#5B5575';
  [-1, 1].forEach((side) => {
    const px = ground.x + side * (GATE_W / 2 - 0.35) * sc;
    ctx.fillRect(px - 0.07 * sc, br.y, 0.14 * sc, ground.y - br.y);
  });

  // Après le passage : la bonne réponse devient verte, les autres grises
  let color = LANE_COLORS[g.lane];
  if (currentQuestion && currentQuestion.resolved && g.s === currentQuestion.s) {
    color = g.correct ? '#58C97B' : '#B9B5C9';
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1, 0.12 * sc);
  ctx.beginPath();
  ctx.roundRect(tl.x, tl.y, w, h, 0.3 * sc);
  ctx.fill();
  ctx.stroke();

  const fontPx = 1.25 * sc;
  if (fontPx >= 5) {
    ctx.font = `800 ${Math.round(fontPx)}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, 0.14 * sc);
    ctx.strokeStyle = 'rgba(46, 42, 77, 0.55)';
    const cy = tl.y + h / 2 + fontPx * 0.06;
    ctx.strokeText(String(g.value), tl.x + w / 2, cy);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(g.value), tl.x + w / 2, cy);
  }
  ctx.globalAlpha = 1;
}

function drawFinish(z) {
  const postX = ROAD_HALF + 0.8;
  const ground = proj(0, 0, z);
  const sc = ground.sc;
  const tl = proj(-postX, 5.8, z);
  const br = proj(postX, 4.2, z);
  ctx.globalAlpha = fogAlpha(z);

  ctx.fillStyle = '#FFFFFF';
  [-1, 1].forEach((side) => {
    const px = ground.x + side * postX * sc;
    ctx.fillRect(px - 0.15 * sc, tl.y, 0.3 * sc, ground.y - tl.y);
  });

  // Banderole à damier
  const w = br.x - tl.x, h = br.y - tl.y;
  const cols = 16, rows = 2;
  const cw = w / cols, chh = h / 4;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(tl.x, tl.y, w, h);
  ctx.fillStyle = '#2E2A4D';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillRect(tl.x + c * cw, tl.y + r * chh, cw + 0.5, chh + 0.5);
        ctx.fillRect(tl.x + c * cw, br.y - (r + 1) * chh, cw + 0.5, chh + 0.5);
      }
    }
  }
  const fontPx = h * 0.42;
  if (fontPx >= 5) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(tl.x + w * 0.25, tl.y + h * 0.18, w * 0.5, h * 0.64);
    ctx.fillStyle = '#FF6F91';
    ctx.font = `800 ${Math.round(fontPx)}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ARRIVÉE', tl.x + w / 2, tl.y + h / 2 + fontPx * 0.06);
  }
  ctx.globalAlpha = 1;
}

function drawObjects() {
  const items = [];

  // Arbres et maisons au bord de la route
  const SPACING = 14;
  const first = Math.floor(dist / SPACING) + 1;
  const last = Math.floor((dist + DRAW_DIST) / SPACING);
  for (let idx = first; idx <= last; idx++) {
    const z = idx * SPACING - dist;
    if (z < NEAR) continue;
    [-1, 1].forEach((side) => {
      const r = hash(idx * 2 + (side > 0 ? 1 : 0));
      if (r < 0.15) return;
      if (r < 0.88) {
        items.push({ kind: 'scenery', z, x: side * (8 + r * 6), h: 6, char: r < 0.55 ? '🌳' : '🌲' });
      } else {
        items.push({ kind: 'scenery', z, x: side * (17 + r * 4), h: 7, char: r < 0.95 ? '🏡' : '🏠' });
      }
      const f = hash(idx * 7 + (side > 0 ? 3 : 0));
      if (f > 0.6) items.push({ kind: 'scenery', z: z + 5, x: side * (6.6 + f), h: 0.9, char: f > 0.8 ? '🌼' : '🌷' });
    });
  }

  gates.forEach((g) => {
    const z = g.s - dist;
    if (g.hit || z < NEAR || z > DRAW_DIST) return;
    items.push({ kind: 'gate', z, gate: g });
  });
  if (finishLine) {
    const z = finishLine.s - dist;
    if (z >= NEAR && z <= DRAW_DIST) items.push({ kind: 'finish', z });
  }

  items.sort((p, q) => q.z - p.z);
  items.forEach((item) => {
    if (item.kind === 'scenery') drawScenery(item);
    else if (item.kind === 'gate') drawGate(item.gate, item.z);
    else drawFinish(item.z);
  });
}

function drawCockpit() {
  // Montants du pare-brise
  ctx.fillStyle = '#2E2A4D';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(70, 0); ctx.lineTo(0, 380);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0); ctx.lineTo(W - 70, 0); ctx.lineTo(W, 380);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(0, 0, W, 10);

  // Tableau de bord
  ctx.fillStyle = '#433C6E';
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, 548);
  ctx.quadraticCurveTo(W / 2, 488, W, 548);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5E5690';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 550);
  ctx.quadraticCurveTo(W / 2, 490, W, 550);
  ctx.stroke();

  // Compteur de vitesse
  const kmh = Math.round(speed * 3.6);
  const sx = 165, sy = 585;
  ctx.fillStyle = '#FFF6E9';
  ctx.beginPath();
  ctx.arc(sx, sy, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFC93C';
  ctx.lineWidth = 6;
  ctx.stroke();
  const needle = Math.PI * 0.75 + (kmh / 120) * Math.PI * 1.5;
  ctx.strokeStyle = '#FF6F91';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + Math.cos(needle) * 34, sy + Math.sin(needle) * 34);
  ctx.stroke();
  ctx.fillStyle = '#2E2A4D';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "800 17px 'Baloo 2', sans-serif";
  ctx.fillText(String(kmh), sx, sy + 18);
  ctx.font = "700 10px 'Baloo 2', sans-serif";
  ctx.fillText('km/h', sx, sy + 31);

  // Petit écran de points
  ctx.fillStyle = '#2E2A4D';
  ctx.beginPath();
  ctx.roundRect(W - 245, 560, 150, 50, 12);
  ctx.fill();
  ctx.fillStyle = '#FFC93C';
  ctx.font = "800 24px 'Baloo 2', sans-serif";
  ctx.fillText(`⭐ ${points}`, W - 170, 587);

  // Volant : il tourne quand on change de voie
  const steerAngle = clamp(((lane - 1) * LANE_W - camX) * 0.18 + curve * 400, -0.8, 0.8);
  ctx.save();
  ctx.translate(W / 2, 715);
  ctx.rotate(steerAngle);
  ctx.strokeStyle = '#1F1B38';
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.arc(0, 0, 175, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-165, -20); ctx.lineTo(0, -10); ctx.lineTo(165, -20);
  ctx.stroke();
  ctx.fillStyle = '#FF6F91';
  ctx.beginPath();
  ctx.arc(0, -10, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "800 48px 'Baloo 2', sans-serif";
  ctx.fillText('×', 0, -8);
  ctx.restore();
}

function drawParticles() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  particles.forEach((p) => {
    ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
    ctx.font = `${p.size}px ${EMOJI_FONT}`;
    ctx.fillText(p.char, p.x, p.y);
  });
  ctx.globalAlpha = 1;
}

function burst(chars, count) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
    const v = 350 + Math.random() * 450;
    particles.push({
      x: W / 2 + (Math.random() - 0.5) * 120,
      y: H * 0.55,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 0.9 + Math.random() * 0.6,
      size: 22 + Math.random() * 26,
      char: chars[Math.floor(Math.random() * chars.length)],
    });
  }
}

function render() {
  bob = speed > 0 ? Math.sin(dist * 0.9) * 0.012 : 0;
  drawSky();
  drawRoad();
  drawObjects();
  drawParticles();
  if (flash) {
    ctx.fillStyle = `rgba(${flash.color}, ${0.3 * flash.life})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawCockpit();
}

/* ---------- HUD ---------- */
const hudCache = {};
function setText(el, key, text) {
  if (hudCache[key] !== text) {
    hudCache[key] = text;
    el.textContent = text;
  }
}

function updateHud() {
  const timeLeft = state === 'playing' ? GAME_DURATION - gameTime : (state === 'ready' ? GAME_DURATION : 0);
  setText(timerEl, 'timer', formatTime(timeLeft));
  setText(pointsEl, 'points', String(points));
  setText(questionCountEl, 'question', String(questionIndex));
  const pct = `${clamp(gameTime / GAME_DURATION, 0, 1) * 100}%`;
  routeFill.style.width = pct;
  routeCar.style.left = pct;
  if (currentQuestion && !currentQuestion.resolved) {
    questionBarFill.style.width = `${clamp((currentQuestion.s - dist) / SPAWN_AHEAD, 0, 1) * 100}%`;
  }
}

/* ---------- Boucle ---------- */
let lastTs = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
  lastTs = ts;
  update(dt);
  render();
  updateHud();
  requestAnimationFrame(frame);
}

/* ---------- Commandes ---------- */
document.addEventListener('keydown', (e) => {
  if (e.target === pseudoInput) return;
  const key = e.key.toLowerCase();
  if (key === 'arrowleft' || key === 'q' || key === 'a') {
    steer(-1);
    e.preventDefault();
  } else if (key === 'arrowright' || key === 'd') {
    steer(1);
    e.preventDefault();
  } else if ((key === 'enter' || key === ' ') && state === 'ready' && !startOverlay.hidden) {
    startGame();
    e.preventDefault();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  steer(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
});
document.getElementById('leftBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); steer(-1); });
document.getElementById('rightBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); steer(1); });

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restart').addEventListener('click', startGame);
document.getElementById('playAgain').addEventListener('click', startGame);

/* ---------- Victoire + classement ---------- */
function launchConfetti() {
  const pieces = ['🎉', '⭐', '🎊', '✨', '🏆', '🏁'];
  for (let i = 0; i < 16; i++) {
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
      <span class="lb-time">${decodePoints(entry.value)} pts</span>
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
  const ok = await submitScore(GAME_ID, name, encodeScore(points));
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

resetGame();
renderLeaderboard();
requestAnimationFrame(frame);
