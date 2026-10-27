// ============================================================================
// Scène « bac à sable » (jalon M0) : on nage librement avec une cellule pour
// tester l'inertie, le sprint, le bouton Action, la caméra et le plein écran.
// ============================================================================

import { SANDBOX } from '../stages/sandbox.js';
import { steerBody, clampToArena, turnToward, angleDiff } from '../systems/movement.js';
import { createBackground } from '../render/background.js';
import { drawCell } from '../render/cell.js';

const TAU = Math.PI * 2;

export function createSandboxScene(game) {
  const def = SANDBOX;
  const { input, camera } = game;
  const bg = createBackground(def.palette);
  const player = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0, angle: 0, pa: 0, pulse: 0 };
  let t = 0;

  const scene = {
    player,

    enter() {
      player.x = player.px = def.arena.w / 2;
      player.y = player.py = def.arena.h / 2;
      player.vx = player.vy = 0;
      camera.arena = def.arena;
      camera.snap(player.x, player.y, game.view);
      input.setActionAvailable(true);
    },

    update(dt) {
      t += dt;
      player.px = player.x;
      player.py = player.y;
      player.pa = player.angle;

      const p = def.player;
      const sprint = input.sprint;
      steerBody(player, input.move, {
        maxSpeed: p.maxSpeed * (sprint ? def.sprint.speed : 1),
        accel: p.accel * (sprint ? def.sprint.accel : 1),
        friction: p.friction,
      }, dt);
      clampToArena(player, p.size, def.arena);

      if (Math.hypot(player.vx, player.vy) > 5) {
        player.angle = turnToward(player.angle, Math.atan2(player.vy, player.vx), p.turnRate, dt);
      }
      if (input.consume('action')) player.pulse = 1;
      player.pulse = Math.max(0, player.pulse - dt * 2.5);

      camera.follow(player.x, player.y, game.view, dt);
    },

    render(ctx, alpha) {
      const view = game.view;
      bg.drawScreen(ctx, view, camera, t);
      camera.apply(ctx, view, alpha);
      bg.drawWorld(ctx, def.arena, camera.visibleRect(view));

      const x = player.px + (player.x - player.px) * alpha;
      const y = player.py + (player.y - player.py) * alpha;
      const angle = player.pa + angleDiff(player.pa, player.angle) * alpha;
      const r = def.player.size;

      if (player.pulse > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r * (1.2 + (1 - player.pulse) * 1.6), 0, TAU);
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(255, 233, 140, ${player.pulse})`;
        ctx.stroke();
      }
      const speed = Math.hypot(player.vx, player.vy) / def.player.maxSpeed;
      drawCell(ctx, x, y, r, angle, t, {
        fill: '#8FE3B0',
        edge: '#FFFFFF',
        squash: Math.min(1, Math.max(0, speed - 0.6)),
      });
    },
  };
  return scene;
}
