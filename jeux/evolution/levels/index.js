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
//      (types de décor dessinés dans art.js et art-terre.js ; "from"/"to" =
//      chapitres ; hide = on s'y cache ; canopy = dessiné par-dessus les
//      créatures ; zone 'water' / 'mud' = mare / boue ; atStart = le premier
//      est posé au point de départ). ground: 'land' = sur la terre ferme.
//      maxChasers = chasseurs en même temps ; speed = vitesse du joueur (×) ;
//      noise = distance à laquelle on entend le joueur foncer ; penalty = ce qu'on perd en se faisant
//      manger (part de l'ADN, part de la croissance) ; meter = la jauge qui
//      baisse (voir monstres-marins.js : l'air, rempli dans les zones 'air'
//      de la surface ; sans meter, c'est l'eau des mares).
//   3. "species" : les êtres vivants. "kind" décide de leur comportement :
//        food    dérive tranquillement (on le mange)
//        prey    s'enfuit quand le joueur peut le manger
//        hunter  chasse le joueur s'il est plus petit, fuit s'il est plus gros
//        stinger pique quand on le touche (méduses)
//        neutral se promène et ignore le joueur
//        defender charge quand on s'approche trop (tricératops…)
//        giant   écrase quand on passe dessous (brachiosaure)
//        rival   un animal de ton espèce : de temps en temps, il te vole tes proies
//      Options : habitat 'water' (reste dans sa mare, attrape à "reach"),
//      flying (vole par-dessus le décor), cone (angle de vue : derrière lui,
//      il ne te voit pas), pack (chasse en meute), stomp (pas qui font
//      trembler), roar (rugit en te repérant), hurt (texte quand il blesse).
//      eatLine = ce que dit Ammo la première fois qu'on en croque un.
//      Leur dessin ("look") est dans art.js (océan), art-terre.js (terre
//      ferme), art-dinos.js (dinosaures : trex, triceratops, stegosaure…) ou
//      art-mer.js (reptiles marins, requins, tortues, ammonites…).
//   4. "evolutions" : les parties du corps à acheter avec l'ADN, et leur effet
//      ("effect" : speed, ratio, reach, vision, shield, armored, dash,
//      dry = on sèche moins vite, cones = voir les regards, radar).
//   5. "chapters" : époque ("ago", en millions d'années), forme du joueur
//      ("form" : cellule, ver, poisson, tetrapode, reptile, dino, grand-dino,
//      tyran, nothosaure, ichthyosaure, pliosaure, mosasaure) et ses couleurs ("skin" : body, belly, dark, stripe), tailles
//      ("size"), ADN pour grandir ("growth"), espèces présentes, évolutions
//      débloquées et missions (eat / evolve / grow). Sur la terre : dry
//      (vitesse de séchage), waterSpeed, speed, vision, fog (obscurité).
//   6. "ending" : la scène ("scene" : 'roi' = le joueur acclamé, 'meteorite'),
//      la foule ("crowd"), les légendes ("captions"), le titre et les choix ;
//      chaque choix nomme le niveau suivant ("level"). Tant qu'il n'existe
//      pas, la fin annonce « bientôt » (texte "soon").
//      Le niveau a aussi une icône ("icon"), une intro ('ocean' / 'terre' /
//      'mer') et, si besoin, le numéro affiché ("num" : deux niveaux 2 qui
//      partent du même choix).
//   7. Ajouter le niveau à la liste ci-dessous. C'est tout : le moteur
//      (script.js) ne connaît aucune espèce par son nom.
// ============================================================================

import oceanPrimitif from './ocean-primitif.js';
import versLesDinosaures from './vers-les-dinosaures.js';
import monstresMarins from './monstres-marins.js';

export const LEVELS = [oceanPrimitif, versLesDinosaures, monstresMarins];
