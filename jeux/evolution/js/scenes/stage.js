// ============================================================================
// Scène d'une étape : intro (nom, époque, objectif), jeu libre, animation de
// croissance quand la jauge est pleine, ou message bienveillant quand il n'y
// a plus de cœurs. La simulation est dans systems/world.js ; ici, on dessine,
// on joue les sons et on met le HUD à jour.
// ============================================================================

import { STAGES } from '../stages/index.js';
import { createWorld, stepWorld } from '../systems/world.js';
import { relation, restartGrowth } from '../systems/rules.js';
import { isActiveHunter } from '../systems/ai.js';
import { angleDiff } from '../systems/movement.js';
import { createBackground } from '../render/background.js';
import { drawCreature } from '../render/creatures.js';
import { drawHazards } from '../render/hazards.js';
import { drawLook } from '../render/looks.js';
import { createEffects } from '../render/effects.js';
import { ICONS } from '../ui/icons.js';
import { showScreen, hideScreen } from '../ui/screens.js';
import { FR, typo } from '../content/fr.js';
import { formatAgo } from '../content/time.js';
import { sfx } from '../core/audio.js';

const TAU = Math.PI * 2;
const INTRO_TIME = 4;              // s avant que l'intro se ferme toute seule
const GROW_TIME = 1.6;             // s d'animation de croissance en fin d'étape
const LOST_TIME = 6;               // s avant de repartir tout seul après un échec

export function createStageScene(game, stageId, { growth = 0, intro = true } = {}) {
  const stage = STAGES[stageId];
  const { camera, input, hud } = game;
  const world = createWorld(stage, { rng: game.newRng(), growth, easy: game.settings.easy });
  const p = world.player;
  const bg = createBackground(stage.palette);
  const fx = createEffects();
  const $ = (id) => document.getElementById(id);
  let phase = 'intro';
  let phaseTime = 0;
  let t = 0;

  function startPlay() {
    if (phase !== 'intro') return;
    phase = 'play';
    phaseTime = 0;
    hideScreen('introScreen');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    game.showHint(FR.hint[stageId]);
  }

  function showIntro() {
    const txt = FR.stages[stageId];
    $('introAgo').textContent = typo(`${FR.intro.ago} ${formatAgo(stage.ago)}`);
    $('introName').textContent = txt.name;
    $('introGoalIcon').innerHTML = ICONS[stage.food] || '';
    $('introGoal').textContent = typo(txt.goal);
    $('introDanger').textContent = typo(txt.danger);
    $('introGo').onclick = (e) => { e.stopPropagation(); startPlay(); };
    $('introScreen').onclick = startPlay;
    showScreen('introScreen');
  }

  function showLost() {
    $('lostTitle').textContent = typo(FR.lost.title);
    $('lostText').textContent = typo(FR.lost.text);
    $('lostGo').onclick = retry;
    showScreen('lostScreen');
  }

  function retry() {
    if (phase !== 'lost') return;
    phase = 'leaving';
    game.flow.stage(stageId, { growth: restartGrowth(world.growth), intro: false });
  }

  function onEvent(ev) {
    switch (ev.type) {
      case 'eat': {
        const big = ev.def.kind === 'creature';
        sfx.eat(big);
        fx.burst(ev.x, ev.y, ev.def.color, big ? 16 : 8, p.size * 5, p.size * 0.12);
        fx.text(ev.x, ev.y - p.size, `+${ev.def.growthValue}`, '#FFF3A0', p.size * 0.9);
        break;
      }
      case 'hurt':
        sfx.hurt();
        fx.text(ev.x, ev.y - p.size, FR.floating[ev.cause], '#FFFFFF', p.size * 1.2);
        fx.burst(p.x, p.y, '#FFFFFF', 10, p.size * 4, p.size * 0.12);
        hud.toast(FR.hurt[ev.cause]);
        try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* pas de vibreur */ }
        break;
      case 'milestone':
        sfx.milestone();
        if (FR.milestones[stageId]) hud.toast(FR.milestones[stageId]);
        fx.burst(p.x, p.y, '#FFE36E', 18, p.size * 6, p.size * 0.15);
        break;
      default:
    }
  }

  /* Hors du jeu libre, rien ne bouge : on fige les positions pour l'interpolation */
  function freeze() {
    p.px = p.x; p.py = p.y; p.pa = p.angle; p.ps = p.size;
    for (const c of world.creatures) { c.px = c.x; c.py = c.y; c.pa = c.angle; }
  }

  const scene = {
    id: stageId,
    world,
    get phase() { return phase; },
    get interactive() { return phase === 'play'; },
    get canPause() { return phase === 'play'; },

    enter() {
      camera.arena = stage.arena;
      camera.setSize(p.size, true);
      camera.snap(p.x, p.y);
      input.setActionAvailable(false);
      hud.show(stage, world);
      if (intro) showIntro();
      else startPlay();
    },

    exit() {
      hud.hide();
      hideScreen('introScreen');
      hideScreen('lostScreen');
      game.hideHint();
    },

    update(dt) {
      t += dt;
      phaseTime += dt;
      if (phase === 'play') {
        stepWorld(world, input, dt);
        for (const ev of world.events) onEvent(ev);
        if (world.done) {
          phase = 'grow';
          phaseTime = 0;
          game.hideHint();
          sfx.grow();
          fx.burst(p.x, p.y, '#FFF3B0', 28, p.size * 7, p.size * 0.18);
        } else if (world.dead) {
          phase = 'lost';
          phaseTime = 0;
          game.hideHint();
          showLost();
        }
      } else {
        freeze();
        if (phase === 'intro' && phaseTime >= INTRO_TIME) startPlay();
        if (phase === 'lost' && phaseTime >= LOST_TIME) {
          retry();
          return;
        }
        if (phase === 'grow') {
          // le corps grossit encore un peu, entouré de lumière
          p.size += (stage.playerEndSize * 1.2 - p.size) * (1 - Math.exp(-3 * dt));
          if (phaseTime >= GROW_TIME) {
            phase = 'leaving';
            game.flow.stageDone(stageId);
            return;
          }
        }
      }
      fx.update(dt);
      camera.setSize(p.size);
      camera.follow(p.x, p.y, dt);
      hud.update(world);
    },

    render(ctx, alpha) {
      const view = game.view;
      bg.drawScreen(ctx, view, camera, t);
      camera.apply(ctx, alpha);
      const rect = camera.visibleRect(80);
      bg.drawWorld(ctx, stage.arena, rect);
      drawHazards(ctx, world.hazards, t, rect);

      const ps = p.ps + (p.size - p.ps) * alpha;
      const markMin = 9 / camera.rz;   // symboles d'au moins 9 px de rayon à l'écran
      // la nourriture d'abord, les créatures par-dessus
      for (let pass = 0; pass < 2; pass++) {
        for (const c of world.creatures) {
          if ((c.def.kind === 'food') !== (pass === 0)) continue;
          const x = c.px + (c.x - c.px) * alpha;
          const y = c.py + (c.y - c.py) * alpha;
          if (x < rect.x0 || x > rect.x1 || y < rect.y0 || y > rect.y1) continue;
          const a = c.pa + angleDiff(c.pa, c.angle) * alpha;
          drawCreature(ctx, c, x, y, a, relation(ps, c.size), t, markMin);
        }
      }

      const x = p.px + (p.x - p.px) * alpha;
      const y = p.py + (p.y - p.py) * alpha;
      const angle = p.pa + angleDiff(p.pa, p.angle) * alpha;
      if (phase === 'grow') {
        const g = ctx.createRadialGradient(x, y, ps * 0.5, x, y, ps * 3);
        g.addColorStop(0, 'rgba(255, 245, 190, 0.7)');
        g.addColorStop(1, 'rgba(255, 245, 190, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, ps * 3, 0, TAU);
        ctx.fill();
      }
      // jauge de chaleur : un anneau rouge se remplit dans l'eau trop chaude
      if (p.heat > 0) {
        ctx.beginPath();
        ctx.arc(x, y, ps * 1.45, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, p.heat));
        ctx.lineWidth = Math.max(2, ps * 0.18);
        ctx.strokeStyle = '#FF5A5A';
        ctx.stroke();
      }
      // invincible : clignote à 2,5 Hz (jamais plus de 3 Hz)
      const blinkOff = p.invincible > 0 && Math.floor(p.invincible * 5) % 2 === 1;
      ctx.globalAlpha = blinkOff ? 0.35 : 1;
      const speed = Math.hypot(p.vx, p.vy) / stage.playerStart.maxSpeed;
      drawLook(ctx, stage.look, x, y, ps, angle, t, { squash: Math.min(1, Math.max(0, speed - 0.7) * 1.5) });
      ctx.globalAlpha = 1;
      fx.draw(ctx);

      drawThreatArrows(ctx, view, ps);
    },
  };

  /* Petite flèche rouge au bord de l'écran vers un prédateur proche mais invisible */
  function drawThreatArrows(ctx, view, ps) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const reach = (view.w / camera.rz) * 1.2;
    const m = 34;
    for (const c of world.creatures) {
      if (c.def.ai !== 'hunter' || relation(ps, c.size) !== 'danger') continue;
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d > reach && !isActiveHunter(c)) continue;
      const s = camera.toScreen(c.x, c.y);
      if (s.x > -c.size * camera.rz && s.x < view.w + c.size * camera.rz
        && s.y > -c.size * camera.rz && s.y < view.h + c.size * camera.rz) continue;
      const a = Math.atan2(s.y - view.h / 2, s.x - view.w / 2);
      // point du bord de l'écran dans cette direction
      const kx = (view.w / 2 - m) / Math.max(1e-6, Math.abs(Math.cos(a)));
      const ky = (view.h / 2 - m) / Math.max(1e-6, Math.abs(Math.sin(a)));
      const k = Math.min(kx, ky);
      const ax = view.w / 2 + Math.cos(a) * k;
      const ay = view.h / 2 + Math.sin(a) * k;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -13);
      ctx.lineTo(-10, 13);
      ctx.closePath();
      ctx.fillStyle = '#FF5A5A';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();
    }
  }

  return scene;
}
