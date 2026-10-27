// ============================================================================
// Entrées du joueur : clavier (flèches, ZQSD, WASD), joystick virtuel flottant
// et bouton Action tactiles. Le jeu ne lit que input.move / sprint / action :
// il ne sait pas si l'ordre vient du clavier ou du doigt.
// ============================================================================

export const JOY_RADIUS = 60;      // px CSS
export const JOY_DEAD = 0.1;       // zone morte : 10 % du rayon
export const SPRINT_PUSH = 0.95;   // joystick considéré « à fond »
export const SPRINT_DELAY = 0.3;   // s à fond avant de sprinter

// e.code suit la position physique de la touche : ZQSD sur un clavier AZERTY
// et WASD sur un QWERTY donnent les mêmes codes KeyW / KeyA / KeyS / KeyD.
const DIR_CODES = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};
const GAME_CODES = new Set([...Object.keys(DIR_CODES), 'Space', 'ShiftLeft', 'ShiftRight']);

/* Touches de direction enfoncées → vecteur de longueur 1 (diagonales comprises) */
export function keysToVector(codes) {
  const dirs = new Set();
  for (const c of codes) if (DIR_CODES[c]) dirs.add(DIR_CODES[c]);
  let x = (dirs.has('right') ? 1 : 0) - (dirs.has('left') ? 1 : 0);
  let y = (dirs.has('down') ? 1 : 0) - (dirs.has('up') ? 1 : 0);
  if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
  return { x, y };
}

/* Décalage du doigt (px CSS) → vecteur analogique, longueur 0..1 */
export function joystickVector(dx, dy, radius = JOY_RADIUS, dead = JOY_DEAD) {
  const d = Math.hypot(dx, dy);
  const d0 = radius * dead;
  if (d <= d0) return { x: 0, y: 0, mag: 0 };
  const mag = Math.min(1, (d - d0) / (radius - d0));
  return { x: dx / d * mag, y: dy / d * mag, mag };
}

/**
 * surface : élément qui reçoit les touchers du joystick (le canvas)
 * joyBase / joyKnob / actionBtn : éléments du joystick et du bouton Action
 * on : { pause, fullscreen, device } appelés depuis le geste lui-même
 *      (obligatoire pour que le navigateur accepte le plein écran)
 */
export function createInput({ surface, joyBase, joyKnob, actionBtn, on = {} }) {
  const held = new Set();
  const presses = { action: 0, confirm: 0 };
  const joy = { id: null, ox: 0, oy: 0, vec: { x: 0, y: 0, mag: 0 }, fullTime: 0 };
  let actionPointer = null;
  let shift = false;
  let spaceHeld = false;

  const input = {
    move: { x: 0, y: 0 },
    sprint: false,
    actionHeld: false,
    device: null,                  // 'keyboard' | 'touch' : la dernière entrée utilisée
    enabled: true,                 // false quand un menu est ouvert
    actionAvailable: false,        // le bouton Action est-il montré à cette étape ?

    /* Une pression unique, consommée une seule fois par la logique */
    consume(name) {
      if (presses[name] > 0) { presses[name] = 0; return true; }
      return false;
    },

    /* Oublie tout (changement de scène, menu, perte de focus) */
    reset() {
      held.clear();
      shift = false;
      spaceHeld = false;
      presses.action = presses.confirm = 0;
      endJoystick();
      endAction();
    },

    setActionAvailable(yes) {
      input.actionAvailable = yes;
      if (actionBtn) actionBtn.hidden = !yes;
      if (!yes) endAction();
    },

    /* Pas logique : combine clavier et joystick */
    update(dt) {
      if (joy.id !== null) {
        input.move.x = joy.vec.x;
        input.move.y = joy.vec.y;
        joy.fullTime = joy.vec.mag >= SPRINT_PUSH ? joy.fullTime + dt : 0;
        input.sprint = joy.fullTime >= SPRINT_DELAY;
      } else {
        const v = keysToVector(held);
        input.move.x = v.x;
        input.move.y = v.y;
        input.sprint = shift;
      }
      input.actionHeld = spaceHeld || actionPointer !== null;
    },
  };

  function setDevice(d) {
    if (input.device === d) return;
    input.device = d;
    if (on.device) on.device(d);
  }

  /* ---------- Clavier ---------- */
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    setDevice('keyboard');
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (!e.repeat && on.pause) on.pause();
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyF') {
      if (!e.repeat && on.fullscreen) on.fullscreen();
      return;
    }
    if (!GAME_CODES.has(e.code) && e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
    // les menus utilisent le clavier normalement (Espace et Entrée cliquent les boutons),
    // mais on retient quand même les directions : on nage dès la fermeture du menu
    if (input.enabled) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') shift = true;
    else if (e.code === 'Space') { if (input.enabled) { spaceHeld = true; presses.action++; } }
    else if (e.code === 'Enter' || e.code === 'NumpadEnter') { if (input.enabled) presses.confirm++; }
    else held.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') shift = false;
    else if (e.code === 'Space') spaceHeld = false;
    else held.delete(e.code);
    if (input.enabled && GAME_CODES.has(e.code)) e.preventDefault();
  });

  window.addEventListener('blur', () => input.reset());

  /* ---------- Joystick virtuel flottant ---------- */
  function placeJoystick() {
    if (!joyBase) return;
    joyBase.style.transform = `translate(${joy.ox}px, ${joy.oy}px)`;
    const k = Math.min(1, JOY_RADIUS / Math.max(1, Math.hypot(joy.dx, joy.dy)));
    joyKnob.style.transform = `translate(${joy.dx * k}px, ${joy.dy * k}px)`;
  }

  function endJoystick() {
    joy.id = null;
    joy.vec = { x: 0, y: 0, mag: 0 };
    joy.fullTime = 0;
    if (joyBase) joyBase.classList.remove('on');
  }

  // n'importe quel toucher (même sur un bouton de menu) passe les aides en mode tactile
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') setDevice('touch');
  }, true);

  surface.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    if (!input.enabled || joy.id !== null) return;
    // moitié gauche de l'écran, sauf s'il n'y a pas de bouton Action à cette étape
    if (input.actionAvailable && e.clientX > window.innerWidth / 2) return;
    joy.id = e.pointerId;
    joy.ox = e.clientX;
    joy.oy = e.clientY;
    joy.dx = joy.dy = 0;
    joy.vec = { x: 0, y: 0, mag: 0 };
    try { surface.setPointerCapture(e.pointerId); } catch (err) { /* pointeur simulé */ }
    if (joyBase) joyBase.classList.add('on');
    placeJoystick();
    e.preventDefault();
  });

  surface.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joy.id) return;
    joy.dx = e.clientX - joy.ox;
    joy.dy = e.clientY - joy.oy;
    joy.vec = joystickVector(joy.dx, joy.dy);
    placeJoystick();
    e.preventDefault();
  });

  const joyUp = (e) => { if (e.pointerId === joy.id) endJoystick(); };
  surface.addEventListener('pointerup', joyUp);
  surface.addEventListener('pointercancel', joyUp);
  surface.addEventListener('lostpointercapture', joyUp);

  /* ---------- Bouton Action ---------- */
  function endAction() {
    actionPointer = null;
    if (actionBtn) actionBtn.classList.remove('pressed');
  }

  if (actionBtn) {
    actionBtn.addEventListener('pointerdown', (e) => {
      if (!input.enabled) return;
      actionPointer = e.pointerId;
      presses.action++;
      actionBtn.classList.add('pressed');
      try { actionBtn.setPointerCapture(e.pointerId); } catch (err) { /* pointeur simulé */ }
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (err) { /* pas de vibreur */ }
      e.preventDefault();
    });
    const actionUp = (e) => { if (e.pointerId === actionPointer) endAction(); };
    actionBtn.addEventListener('pointerup', actionUp);
    actionBtn.addEventListener('pointercancel', actionUp);
    actionBtn.addEventListener('lostpointercapture', actionUp);
  }

  /* Pas de zoom ni de défilement parasite sur mobile (pincer, double-tape, rebond) */
  document.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

  return input;
}
