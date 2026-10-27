// ============================================================================
// Décor d'un milieu : dégradé de fond, deux couches de particules en
// suspension qui défilent moins vite que le monde (parallaxe), et bord de
// l'arène.
// ============================================================================

const TAU = Math.PI * 2;
const LAYERS = [
  { depth: 0.25, count: 34, size: 1.6, alpha: 0.5 },
  { depth: 0.55, count: 26, size: 2.6, alpha: 0.8 },
];

export function createBackground(palette, rng = Math.random) {
  // positions en fraction d'une tuile carrée qui se répète
  const layers = LAYERS.map((l) => ({
    ...l,
    specks: Array.from({ length: l.count }, () => ({ u: rng(), v: rng(), ph: rng() * TAU })),
  }));
  let grad = null;
  let gradH = 0;

  return {
    /* Fond fixe + particules (en pixels CSS, avant la caméra) */
    drawScreen(ctx, view, cam, t) {
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      if (!grad || gradH !== view.h) {
        grad = ctx.createLinearGradient(0, 0, 0, view.h);
        grad.addColorStop(0, palette.top);
        grad.addColorStop(1, palette.bottom);
        gradH = view.h;
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, view.w, view.h);

      const tile = Math.max(view.w, view.h) + 40;
      ctx.fillStyle = palette.specks;
      for (const l of layers) {
        const offX = cam.rx * cam.zoom * l.depth;
        const offY = cam.ry * cam.zoom * l.depth;
        ctx.globalAlpha = l.alpha;
        for (const s of l.specks) {
          const sx = mod(s.u * tile - offX + Math.sin(t * 0.4 + s.ph) * 6, tile) - 20;
          const sy = mod(s.v * tile - offY + t * 4 * l.depth, tile) - 20;
          if (sx > view.w + 10 || sy > view.h + 10) continue;
          ctx.beginPath();
          ctx.arc(sx, sy, l.size, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },

    /* Repères au fond et bord de l'arène (en unités du monde, après la caméra) */
    drawWorld(ctx, arena, rect) {
      const STEP = 160;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      const x0 = Math.max(0, Math.floor(rect.x0 / STEP) * STEP);
      const y0 = Math.max(0, Math.floor(rect.y0 / STEP) * STEP);
      const x1 = Math.min(arena.w, rect.x1);
      const y1 = Math.min(arena.h, rect.y1);
      for (let x = x0; x <= x1; x += STEP) {
        for (let y = y0; y <= y1; y += STEP) {
          ctx.beginPath();
          ctx.arc(x + ((y / STEP) % 2) * STEP / 2, y, 4, 0, TAU);
          ctx.fill();
        }
      }
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.strokeRect(0, 0, arena.w, arena.h);
    },
  };
}

function mod(a, n) {
  return ((a % n) + n) % n;
}
