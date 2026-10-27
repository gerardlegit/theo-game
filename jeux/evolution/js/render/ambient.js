// ============================================================================
// Fond animé des menus (titre, fiches, « à suivre ») : l'océan primitif et
// quelques cellules qui nagent tranquillement, dessinées en pixels d'écran.
// ============================================================================

import { createBackground } from './background.js';
import { drawLook } from './looks.js';
import { drawCell } from './cell.js';

const TAU = Math.PI * 2;
const OCEAN = { top: '#2C8C78', bottom: '#0B3C4A', specks: 'rgba(210, 255, 230, 0.35)' };
const KINDS = ['cell', 'nucleus', 'amoeba', 'cell', 'nucleus', 'amoeba', 'cell', 'nucleus'];

export function createAmbient(palette = OCEAN, count = 8) {
  const bg = createBackground(palette);
  const cam = { rx: 0, ry: 0, rz: 1 };
  const cells = Array.from({ length: count }, (_, i) => ({
    kind: KINDS[i % KINDS.length],
    u: Math.random(),
    v: Math.random(),
    r: 0.025 + Math.random() * 0.03,     // rayon en fraction du petit côté de l'écran
    a: Math.random() * TAU,
    turn: (Math.random() - 0.5) * 0.4,
    seed: Math.random() * 10,
  }));
  let t = 0;

  return {
    update(dt) {
      t += dt;
      cam.rx += 12 * dt;
      for (const c of cells) {
        c.a += c.turn * dt;
        c.u = (c.u + Math.cos(c.a) * 0.015 * dt + 1.2) % 1.2;
        c.v = (c.v + Math.sin(c.a) * 0.015 * dt + 1.2) % 1.2;
      }
    },

    draw(ctx, view, dim = 0) {
      bg.drawScreen(ctx, view, cam, t);
      const m = Math.min(view.w, view.h);
      for (const c of cells) {
        const x = (c.u - 0.1) * view.w;
        const y = (c.v - 0.1) * view.h;
        const r = c.r * m;
        if (c.kind === 'amoeba') {
          drawCell(ctx, x, y, r, c.a, t, { fill: '#B48CF2', edge: '#FFFFFF', seed: c.seed, wobble: 2.2, lineScale: 0.8 });
        } else {
          drawLook(ctx, c.kind, x, y, r, c.a, t + c.seed);
        }
      }
      if (dim) {
        ctx.fillStyle = `rgba(4, 24, 30, ${dim})`;
        ctx.fillRect(0, 0, view.w, view.h);
      }
    },
  };
}
