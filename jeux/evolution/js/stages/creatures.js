// ============================================================================
// Les créatures du jeu (hors joueur). Valeurs de départ à régler en test :
//  size        rayon en unités du monde
//  maxSpeed    unités / s · accel unités / s² · friction 0..1 par seconde
//  ai          'drifter' | 'hunter' · senseRadius : distance où il repère le joueur
//  dash        multiplicateur de vitesse pendant l'élan d'une poursuite
//  growthValue croissance gagnée quand le joueur la mange
//  sprite      dessin procédural (render/creatures.js) · color : couleur du corps
// ============================================================================

export const CREATURES = {
  /* Étape 1 : de quoi grandir dans l'océan primitif */
  molecule: {
    id: 'molecule', kind: 'food', size: 4.5, maxSpeed: 12, accel: 30, friction: 0.5,
    ai: 'drifter', senseRadius: 0, growthValue: 1, sprite: 'molecule', color: '#F5E27A',
  },

  /* Étape 2 : proies et prédateurs */
  bacterium: {
    id: 'bacterium', kind: 'food', size: 5.5, maxSpeed: 20, accel: 40, friction: 0.5,
    ai: 'drifter', senseRadius: 0, growthValue: 1, sprite: 'bacterium', color: '#F7A6C1',
  },
  amoeba: {
    id: 'amoeba', kind: 'creature', size: 18, maxSpeed: 120, accel: 260, friction: 0.6,
    ai: 'hunter', senseRadius: 340, dash: 1.5, growthValue: 3, sprite: 'amoeba', color: '#B48CF2',
  },
  bigAmoeba: {
    id: 'bigAmoeba', kind: 'creature', size: 36, maxSpeed: 100, accel: 200, friction: 0.6,
    ai: 'hunter', senseRadius: 420, dash: 1.5, growthValue: 5, sprite: 'amoeba', color: '#E39BD0',
  },
  fastAmoeba: {
    id: 'fastAmoeba', kind: 'creature', size: 26, maxSpeed: 140, accel: 320, friction: 0.6,
    ai: 'hunter', senseRadius: 400, dash: 1.5, growthValue: 4, sprite: 'amoeba', color: '#F2A65A',
  },
};
