// ============================================================================
// Tests du socle (jalon M0) : boucle à pas fixe, physique du déplacement,
// caméra, joystick et clavier.
// ============================================================================

import { test, ok, eq, near } from './runner.js';
import { advanceClock, STEP } from '../js/core/loop.js';
import { steerBody, clampToArena, angleDiff, turnToward } from '../js/systems/movement.js';
import { computeZoom, clampCenter, createCamera } from '../js/core/camera.js';
import { keysToVector, joystickVector, JOY_RADIUS } from '../js/core/input.js';

const WATER = { maxSpeed: 140, accel: 380, friction: 0.6 };
const body = () => ({ x: 0, y: 0, vx: 0, vy: 0 });
const run = (b, dir, p, seconds) => {
  for (let i = 0; i < Math.round(seconds / STEP); i++) steerBody(b, dir, p, STEP);
};

/* ---------- Boucle ---------- */
test('boucle : 1 s d’images à 60 Hz = 60 pas', () => {
  const clock = { acc: 0 };
  let steps = 0;
  for (let i = 0; i < 60; i++) steps += advanceClock(clock, 1 / 60).steps;
  eq(steps, 60);
});

test('boucle : un écran à 144 Hz fait aussi 60 pas par seconde', () => {
  const clock = { acc: 0 };
  let steps = 0;
  for (let i = 0; i < 144; i++) steps += advanceClock(clock, 1 / 144).steps;
  ok(steps >= 59 && steps <= 60, `obtenu ${steps}`);
});

test('boucle : alpha d’interpolation entre 0 et 1', () => {
  const clock = { acc: 0 };
  const { steps, alpha } = advanceClock(clock, 1.5 * STEP);
  eq(steps, 1);
  near(alpha, 0.5, 1e-6);
});

test('boucle : une longue pause ne fait pas des centaines de pas', () => {
  const clock = { acc: 0 };
  const { steps } = advanceClock(clock, 5);
  ok(steps <= 15, `obtenu ${steps}`);
});

/* ---------- Déplacement ---------- */
test('déplacement : la vitesse monte progressivement (inertie)', () => {
  const b = body();
  steerBody(b, { x: 1, y: 0 }, WATER, STEP);
  ok(b.vx > 0 && b.vx < WATER.maxSpeed * 0.1, `vx après 1 pas = ${b.vx}`);
});

test('déplacement : la vitesse ne dépasse pas la vitesse max', () => {
  const b = body();
  run(b, { x: 1, y: 0 }, WATER, 3);
  near(Math.hypot(b.vx, b.vy), WATER.maxSpeed, 0.01);
});

test('déplacement : une diagonale n’est pas plus rapide qu’une ligne droite', () => {
  const b = body();
  run(b, keysToVector(['ArrowRight', 'ArrowDown']), WATER, 3);
  near(Math.hypot(b.vx, b.vy), WATER.maxSpeed, 0.01);
});

test('déplacement : joystick à moitié = moitié de la vitesse', () => {
  const b = body();
  run(b, { x: 0.5, y: 0 }, WATER, 3);
  near(b.vx, WATER.maxSpeed / 2, 0.01);
});

test('déplacement : on glisse un peu quand on lâche, puis on s’arrête', () => {
  const b = body();
  run(b, { x: 1, y: 0 }, WATER, 3);
  const x0 = b.x;
  run(b, { x: 0, y: 0 }, WATER, 0.5);
  ok(b.vx > 0 && b.x > x0 + 20, 'devrait encore glisser après 0,5 s');
  run(b, { x: 0, y: 0 }, WATER, 10);
  eq(b.vx, 0, 'arrêt complet');
});

test('déplacement : la terre freine plus vite que l’eau', () => {
  const w = body();
  const l = body();
  const LAND = { maxSpeed: 140, accel: 1400, friction: 0.97 };
  run(w, { x: 1, y: 0 }, WATER, 3);
  run(l, { x: 1, y: 0 }, LAND, 3);
  const xw = w.x;
  const xl = l.x;
  run(w, { x: 0, y: 0 }, WATER, 3);
  run(l, { x: 0, y: 0 }, LAND, 3);
  ok(l.x - xl < w.x - xw, 'la glissade sur terre doit être plus courte');
});

test('déplacement : bloqué au bord de l’arène', () => {
  const b = { x: 5, y: 50, vx: -100, vy: 0 };
  clampToArena(b, 20, { w: 1000, h: 1000 });
  eq(b.x, 20);
  eq(b.vx, 0);
});

test('rotation : prend le chemin le plus court et reste lissée', () => {
  near(angleDiff(3, -3), 2 * Math.PI - 6, 1e-9);
  const a = turnToward(0, Math.PI / 2, 8, STEP);
  near(a, 8 * STEP, 1e-9);
  near(turnToward(0, 0.01, 8, STEP), 0.01, 1e-9);
});

/* ---------- Caméra ---------- */
test('caméra : on voit au moins 1 600 × 900 unités en paysage', () => {
  for (const [w, h] of [[1920, 1080], [844, 390], [1280, 1024]]) {
    const z = computeZoom(w, h);
    ok(w / z >= 1600 - 1e-6 && h / z >= 900 - 1e-6, `${w}×${h}`);
    ok(Math.abs(w / z - 1600) < 1e-6 || Math.abs(h / z - 900) < 1e-6, `${w}×${h} : trop dézoomé`);
  }
});

test('caméra : 900 unités de large en portrait', () => {
  near(390 / computeZoom(390, 844), 900, 1e-6);
});

test('caméra : reste dans l’arène, centrée si l’arène est petite', () => {
  eq(clampCenter(10, 800, 4800), 800);
  eq(clampCenter(4790, 800, 4800), 4000);
  eq(clampCenter(100, 800, 1000), 500);
});

test('caméra : suit la cible en douceur', () => {
  const cam = createCamera();
  const view = { w: 1600, h: 900, dpr: 1 };
  cam.resize(view);
  cam.arena = { w: 4800, h: 2700 };
  cam.snap(2400, 1350, view);
  cam.follow(2500, 1350, view, STEP);
  ok(cam.x > 2400 && cam.x < 2500, `x = ${cam.x}`);
});

/* ---------- Commandes ---------- */
test('clavier : flèches, ZQSD et WASD donnent les mêmes directions', () => {
  eq(keysToVector(['ArrowUp']).y, -1);
  eq(keysToVector(['KeyW']).y, -1, 'Z (AZERTY) / W (QWERTY)');
  eq(keysToVector(['KeyA']).x, -1, 'Q (AZERTY) / A (QWERTY)');
  eq(keysToVector(['KeyS']).y, 1);
  eq(keysToVector(['KeyD']).x, 1);
  eq(keysToVector(['ArrowLeft', 'ArrowRight']).x, 0, 'gauche + droite s’annulent');
  near(Math.hypot(...Object.values(keysToVector(['KeyW', 'KeyD']))), 1, 1e-9);
});

test('joystick : zone morte de 10 %', () => {
  eq(joystickVector(JOY_RADIUS * 0.09, 0).mag, 0);
  ok(joystickVector(JOY_RADIUS * 0.2, 0).mag > 0);
});

test('joystick : analogique et plafonné à 1', () => {
  const half = joystickVector(JOY_RADIUS * 0.55, 0);
  near(half.mag, 0.5, 1e-9);
  const far = joystickVector(0, JOY_RADIUS * 3);
  near(far.mag, 1, 1e-9);
  near(far.y, 1, 1e-9);
});
