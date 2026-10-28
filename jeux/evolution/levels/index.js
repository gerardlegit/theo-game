// ============================================================================
// LES NIVEAUX — un niveau = une grande époque de l'histoire de la vie.
//
// Dans chaque niveau, le joueur traverse plusieurs chapitres (des millions
// d'années à chaque fois). Il mange pour grandir et gagner de l'ADN 🧬, qu'il
// dépense pour faire évoluer son corps (queue, yeux, mâchoires…). Quand toutes
// les missions d'un chapitre sont faites, le temps avance jusqu'au suivant.
// À la fin du niveau, le joueur choisit son chemin (ex. : la mer ou la terre),
// qui mène au niveau suivant. Il garde son ADN et ses statistiques ; tout le
// reste (corps, taille, chapitres) dépend du niveau.
//
// POUR AJOUTER UN NIVEAU
//   1. Copier levels/ocean-primitif.js en levels/mon-niveau.js et changer son "id".
//   2. "world" : la taille de la carte, le point de départ et le décor
//      (types de décor dessinés dans art.js : algues, rocher, cheminee,
//      stromatolithe, eponge, corail, crinoide ; "from"/"to" = chapitres).
//   3. "species" : les êtres vivants. "kind" décide de leur comportement :
//        food    dérive tranquillement (on le mange)
//        prey    s'enfuit quand le joueur peut le manger
//        hunter  chasse le joueur s'il est plus petit, fuit s'il est plus gros
//        stinger pique quand on le touche (méduses)
//      Leur dessin ("look") est dans art.js.
//   4. "evolutions" : les parties du corps à acheter avec l'ADN, et leur effet
//      ("effect" : speed, ratio, vision, shield, armored, dash).
//   5. "chapters" : époque ("ago", en millions d'années), forme du joueur
//      ("form" : cellule, ver, poisson), tailles ("size"), ADN pour grandir
//      ("growth"), espèces présentes, évolutions débloquées et missions
//      (eat / evolve / grow).
//   6. "ending" : le titre de la fin et les choix ; chaque choix nomme le
//      niveau suivant ("level"). Tant qu'il n'existe pas, la fin annonce
//      « bientôt » (texte "soon").
//   7. Ajouter le niveau à la liste ci-dessous. C'est tout : le moteur
//      (script.js) ne connaît aucune espèce par son nom.
// ============================================================================

import oceanPrimitif from './ocean-primitif.js';

export const LEVELS = [oceanPrimitif];
