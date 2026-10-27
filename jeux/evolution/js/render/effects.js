// ============================================================================
// Petits effets : particules (bouchées, croissance) et textes qui flottent
// (« +1 », « Gloups ! »). Tout vient de réserves créées une fois pour toutes :
// aucune allocation pendant la partie.
// ============================================================================

const TAU = Math.PI * 2;
const MAX_PARTICLES = 96;
const MAX_TEXTS = 8;

export function createEffects() {
  const parts = Array.from({ length: MAX_PARTICLES }, () => ({ life: 0 }));
  const texts = Array.from({ length: MAX_TEXTS }, () => ({ life: 0 }));
  let nextPart = 0;
  let nextText = 0;

  return {
    burst(x, y, color, n, speed, size) {
      for (let i = 0; i < n; i++) {
        const p = parts[nextPart];
        nextPart = (nextPart + 1) % MAX_PARTICLES;
        const a = Math.random() * TAU;
        const s = speed * (0.4 + Math.random() * 0.6);
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
        p.life = p.max = 0.45 + Math.random() * 0.3;
        p.color = color;
        p.r = size * (0.6 + Math.random() * 0.6);
      }
    },

    text(x, y, str, color, size) {
      const tx = texts[nextText];
      nextText = (nextText + 1) % MAX_TEXTS;
      tx.x = x; tx.y = y; tx.str = str; tx.color = color; tx.size = size;
      tx.life = tx.max = 1.1;
    },

    update(dt) {
      for (const p of parts) {
        if (p.life <= 0) continue;
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
      }
      for (const tx of texts) {
        if (tx.life <= 0) continue;
        tx.life -= dt;
        tx.y -= tx.size * 1.4 * dt;
      }
    },

    draw(ctx) {
      for (const p of parts) {
        if (p.life <= 0) continue;
        ctx.globalAlpha = p.life / p.max;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const tx of texts) {
        if (tx.life <= 0) continue;
        ctx.globalAlpha = Math.min(1, tx.life / tx.max * 2);
        ctx.font = `800 ${tx.size}px 'Baloo 2', sans-serif`;
        ctx.lineWidth = tx.size * 0.18;
        ctx.strokeStyle = 'rgba(15, 40, 50, 0.85)';
        ctx.strokeText(tx.str, tx.x, tx.y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.str, tx.x, tx.y);
      }
      ctx.globalAlpha = 1;
    },
  };
}
