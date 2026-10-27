// ============================================================================
// Boucle de jeu à pas de temps fixe (60 Hz) : la logique avance toujours par
// petits pas identiques (même résultat quel que soit l'écran), et le dessin
// est interpolé entre les deux derniers pas pour rester fluide.
// ============================================================================

export const STEP = 1 / 60;
const MAX_FRAME = 0.25;            // s : au-delà (onglet en veille…), on oublie le retard

/* Calcul pur : combien de pas logiques faut-il pour une image de durée frameDt ? */
export function advanceClock(clock, frameDt, step = STEP) {
  clock.acc += Math.min(Math.max(frameDt, 0), MAX_FRAME);
  let steps = 0;
  // petite tolérance : 1/60 s mesuré peut valoir 0,0166666 au lieu de 0,0166667
  while (clock.acc >= step - 1e-9) {
    clock.acc -= step;
    steps++;
  }
  if (clock.acc < 0) clock.acc = 0;
  return { steps, alpha: clock.acc / step };
}

export function createLoop({ update, render }) {
  const clock = { acc: 0 };
  const stats = { fps: 60, frames: 0, since: 0 };
  let last = 0;
  let raf = 0;
  let running = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    const { steps, alpha } = advanceClock(clock, dt);
    for (let i = 0; i < steps; i++) update(STEP);
    render(alpha, dt);

    stats.frames++;
    stats.since += dt;
    if (stats.since >= 0.5) {
      stats.fps = stats.frames / stats.since;
      stats.frames = 0;
      stats.since = 0;
    }
  }

  return {
    stats,
    start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
