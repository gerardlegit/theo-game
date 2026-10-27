// ============================================================================
// « Des millions d'années plus tard… » (4 s) : la créature se dédouble en
// générations qui changent peu à peu, un compteur d'années défile, puis la
// nouvelle forme apparaît. C'est ce moment qui montre que l'évolution se fait
// sur des générations, jamais chez un seul individu.
// ============================================================================

import { STAGES } from '../stages/index.js';
import { createBackground } from '../render/background.js';
import { drawLook } from '../render/looks.js';
import { showScreen, hideScreen } from '../ui/screens.js';
import { FR, typo } from '../content/fr.js';
import { formatAgo } from '../content/time.js';
import { sfx } from '../core/audio.js';

const TAU = Math.PI * 2;
const DURATION = 4.2;
const SKIP_AFTER = 1.2;            // s avant de pouvoir passer
const GENERATIONS = 6;

const ease = (k) => k * k * (3 - 2 * k);

export function createTransitionScene(game, fromId, toId) {
  const from = STAGES[fromId];
  const to = STAGES[toId];
  const bg = createBackground({ top: '#123B4A', bottom: '#06202A', specks: 'rgba(200, 240, 255, 0.3)' });
  const cam = { rx: 0, ry: 0, rz: 1 };
  const $ = (id) => document.getElementById(id);
  let t = 0;
  let lastLabel = '';
  let left = false;

  function next() {
    if (left || t < SKIP_AFTER) return;
    left = true;
    game.flow.stage(toId);
  }

  return {
    id: 'transition',
    enter() {
      $('transTitle').textContent = typo(FR.transition.title);
      $('transText').textContent = typo(FR.transition[toId] || '');
      $('transitionScreen').onclick = next;
      $('transSkip').onclick = (e) => { e.stopPropagation(); next(); };
      showScreen('transitionScreen');
      sfx.transform();
    },
    exit() { hideScreen('transitionScreen'); },
    update(dt) {
      t += dt;
      cam.rx += 40 * dt;
      // le compteur d'années défile de l'ancienne époque à la nouvelle
      const ma = from.ago + (to.ago - from.ago) * ease(Math.min(1, t / 3));
      const label = typo(`Il y a ${formatAgo(Math.round(ma / 100) * 100)}`);
      if (label !== lastLabel) {
        lastLabel = label;
        $('transAgo').textContent = label;
      }
      if (t >= DURATION) next();
    },
    render(ctx) {
      const view = game.view;
      bg.drawScreen(ctx, view, cam, t);
      const m = Math.min(view.w, view.h);
      const y = view.h * 0.66;
      const r = m * 0.045;
      const span = Math.min(view.w * 0.8, r * 3 * GENERATIONS);
      // une génération apparaît toutes les 0,4 s ; chacune ressemble un peu plus à la nouvelle forme
      for (let i = 0; i < GENERATIONS; i++) {
        const born = 0.3 + i * 0.4;
        if (t < born) break;
        const k = i / (GENERATIONS - 1);
        const appear = Math.min(1, (t - born) / 0.35);
        const x = view.w / 2 - span / 2 + (span * (i + 0.5)) / GENERATIONS;
        const rr = r * (0.6 + 0.4 * appear) * (1 + k * 0.25);
        const bob = Math.sin(t * 3 + i) * r * 0.15;
        // l'ancienne forme, et la nouvelle par-dessus, de plus en plus visible
        ctx.globalAlpha = appear;
        drawLook(ctx, from.look, x, y + bob, rr, 0, t + i);
        ctx.globalAlpha = appear * k;
        drawLook(ctx, to.look, x, y + bob, rr, 0, t + i);
        ctx.globalAlpha = 1;
      }
      // fil qui relie les générations
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(view.w / 2 - span / 2, y + r * 1.9);
      ctx.lineTo(view.w / 2 - span / 2 + span * Math.min(1, t / (0.3 + GENERATIONS * 0.4)), y + r * 1.9);
      ctx.stroke();
      ctx.setLineDash([]);
      // halo final
      if (t > 2.8) {
        const k = Math.min(1, (t - 2.8) / 0.8);
        const g = ctx.createRadialGradient(view.w / 2, y, 0, view.w / 2, y, span * 0.6);
        g.addColorStop(0, `rgba(255, 245, 190, ${0.25 * k})`);
        g.addColorStop(1, 'rgba(255, 245, 190, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(view.w / 2, y, span * 0.6, 0, TAU);
        ctx.fill();
      }
    },
  };
}
