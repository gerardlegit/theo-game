// ============================================================================
// LES NIVEAUX — un niveau = un système stellaire à explorer.
//
// Dans chaque niveau, le joueur réalise les missions des chefs de chantier
// (5 par bâtiment), puis construit le portail de l'ingénieure Nova, qui
// l'emmène au niveau suivant. Il garde son or et sa fusée (améliorations,
// peinture, décorations) ; tout le reste (quêtes, soute, portail) repart à zéro.
//
// POUR AJOUTER UN NIVEAU
//   1. Copier levels/systeme-solaire.js en levels/mon-niveau.js.
//   2. Décrire le système dans "system" :
//        - l'étoile au centre ("star"), les planètes ("planets", par distance),
//          les lunes ("moons", avec leur "parent"), une ceinture d'astéroïdes
//          ("belt", ou null), les objets lointains ("far"), les trous de ver ;
//        - pour une planète inventée, ajouter "name" et "paint" (voir planets.js) ;
//        - "start" : l'astre d'où part la fusée.
//   3. Les ressources ("resources") : chacune a un "source" = l'id d'un astre.
//   4. Les habitants ("characters") : il faut leur dessin dans chars.js
//      (on peut réutiliser un personnage existant en changeant "home").
//   5. L'histoire ("chapters") : chaque chapitre a un chef, un astre ("host"),
//      un type de bâtiment ("building", voir buildings.js), 5 missions, et ce
//      qu'il débloque ("shop", "customers"). Le dernier chapitre, sans
//      missions, est celui du portail.
//   6. Le danger des OVNI ("danger" : une ligne par chapitre) et l'étoile
//      d'arrivée du portail ("destination", pour l'animation de fin).
//   7. Ajouter le niveau à la liste ci-dessous. C'est tout : le moteur
//      (script.js) ne connaît aucune planète par son nom.
//
// Tant qu'il n'y a pas de niveau suivant, la fin annonce « Bientôt : … »
// (voir destination.soon).
// ============================================================================

import systemeSolaire from './systeme-solaire.js';

export const LEVELS = [systemeSolaire];
