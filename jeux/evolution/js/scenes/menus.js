// ============================================================================
// Scènes de menu : écran titre, fiche découverte (après chaque étape) et
// écran « À suivre » (fin du contenu disponible). Le texte est en HTML,
// le fond animé sur le canvas.
// ============================================================================

import { STAGES } from '../stages/index.js';
import { createAmbient } from '../render/ambient.js';
import { drawLook } from '../render/looks.js';
import { ICONS } from '../ui/icons.js';
import { showScreen, hideScreen } from '../ui/screens.js';
import { FR, typo } from '../content/fr.js';
import { formatAgo } from '../content/time.js';
import { sfx } from '../core/audio.js';
import { canSpeak, speak, stopSpeaking } from '../core/voice.js';

const $ = (id) => document.getElementById(id);

/* ---------- Écran titre ---------- */
export function createTitleScene(game) {
  const ambient = createAmbient();
  return {
    id: 'title',
    enter() {
      $('titlePitch').textContent = typo(FR.title.pitch);
      $('playBtn').onclick = () => game.flow.play();
      showScreen('titleScreen');
    },
    exit() { hideScreen('titleScreen'); },
    update(dt) { ambient.update(dt); },
    render(ctx) { ambient.draw(ctx, game.view, 0.15); },
  };
}

/* ---------- Fiche découverte ---------- */
export function createCardScene(game, stageId) {
  const stage = STAGES[stageId];
  const card = FR.cards[stageId];
  const ambient = createAmbient(stage.palette, 6);
  const art = $('cardArt');
  const artCtx = art.getContext('2d');
  let t = 0;

  return {
    id: 'card',
    enter() {
      $('cardName').textContent = card.name;
      $('cardExample').textContent = typo(card.example);
      $('cardWhen').textContent = typo(`Il y a environ ${formatAgo(stage.ago)}`);
      $('cardFact').textContent = typo(card.fact);
      $('cardChangeIcon').innerHTML = ICONS[card.icon] || '';
      $('cardChange').textContent = typo(card.change);
      const listen = $('cardListen');
      listen.hidden = !canSpeak();
      listen.onclick = () => speak(`${card.name}. ${card.fact} ${card.change}`);
      $('cardNext').onclick = () => game.flow.afterCard(stageId);
      showScreen('cardScreen');
      $('cardNext').focus({ preventScroll: true });
      sfx.card();
    },
    exit() {
      stopSpeaking();
      hideScreen('cardScreen');
    },
    update(dt) {
      t += dt;
      ambient.update(dt);
    },
    render(ctx) {
      ambient.draw(ctx, game.view, 0.35);
      // portrait de la créature sur la fiche
      const dpr = game.view.dpr;
      const w = art.clientWidth || 160;
      const h = art.clientHeight || 110;
      if (art.width !== Math.round(w * dpr)) { art.width = Math.round(w * dpr); art.height = Math.round(h * dpr); }
      artCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      artCtx.clearRect(0, 0, w, h);
      drawLook(artCtx, stage.look, w / 2, h / 2, Math.min(w, h) * 0.32, Math.sin(t * 0.8) * 0.5, t);
    },
  };
}

/* ---------- À suivre ---------- */
export function createSequelScene(game) {
  const ambient = createAmbient();
  return {
    id: 'sequel',
    enter() {
      $('sequelTitle').textContent = typo(FR.sequel.title);
      $('sequelText').textContent = typo(FR.sequel.text);
      $('sequelReplay').onclick = () => game.flow.play();
      $('sequelMenu').onclick = () => game.flow.title();
      showScreen('sequelScreen');
      sfx.milestone();
    },
    exit() { hideScreen('sequelScreen'); },
    update(dt) { ambient.update(dt); },
    render(ctx) { ambient.draw(ctx, game.view, 0.2); },
  };
}
