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
//      créatures ; zone 'water' / 'mud' / 'camp' / 'pen' = mare / boue /
//      camp des humains / enclos des moutons (sa barrière bloque tout le
//      monde ; sa porte : gate = sa direction, gateW = sa largeur, en radians,
//      et seuls le joueur et les moutons la passent) ; at = à cet endroit
//      précis ; clear = rien d'autre ne pousse dessus ; atStart = le premier
//      est posé au point de départ). ground: 'land' = sur la terre ferme : la course et les vues en volume sont les mêmes partout (terre.js).
//      noGrow = manger ne fait pas grandir ("size" fixe) ; mudSpeed = ce que
//      strike = un coup qui assomme les adversaires proches 2 s (name, icon,
//      type 'queue' / 'griffe', from = à partir de ce chapitre, intro = le texte
//      qui l'annonce) ; combo = manger vite de suite rapporte plus d'ADN.
//      laisse la boue ou la neige ; maxChasers = chasseurs en même temps ; speed = vitesse du joueur (×) ;
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
//        rival   un animal de ton espèce : de temps en temps, il te vole tes proies ;
//                il fuit les gros chasseurs… qui le croquent s'ils l'attrapent (chapitre :
//                ownColor = il garde sa couleur au lieu de prendre celle du joueur ;
//                rivalHunt = { rival, by, every } : de temps en temps, sous les yeux du joueur,
//                un chasseur de la liste « by » surgit et s'attaque à un rival)
//        ally    un loup de ta meute : il te suit et attaque avec toi
//        stray   un loup seul : il rejoint ta meute ("joins") quand tu le touches
//        human   un humain : il te chasse si tu t'approches trop tant qu'il ne te
//                fait pas confiance (voir trust plus bas) ; on ne le mange jamais
//        flock   un mouton : il s'écarte devant toi ; on le pousse par la porte de l'enclos
//        shepherd le berger : il attend à la porte (chapitre : shepherd = son espèce)
//      Options : habitat 'water' (reste dans sa mare, attrape à "reach"),
//      flying (vole par-dessus le décor), cone (angle de vue : derrière lui,
//      il ne te voit pas), pack (chasse en meute), stomp (pas qui font
//      trembler), roar (rugit en te repérant), hurt (texte quand il blesse),
//      habitat 'camp' (un humain reste dans son camp), play (un enfant : il
//      joue avec toi), near 'pen' (le troupeau broute près des enclos),
//      eatsFlock (un loup sauvage qui croque les moutons), noEat (on ne peut
//      pas le manger), trust (ce que la confiance gagne quand on le mange),
//      maxTurn (il tourne lentement, en rad/s), buried (caché dans le sable),
//      hits (la barre de vie d'un boss) avec tailBite (on lui mord la queue) ou
//      breachHit (on lui retombe dessus), hitLine ; barkLine (texte quand on aboie dessus), hp + need (une barre de vie : il
//      faut "need" loups pour l'attaquer ; fights : au lieu de fuir, il se retourne et charge), packFear (assez de loups : il fuit).
//      eatLine = ce que dit Ammo la première fois qu'on en croque un.
//      Leur dessin ("look") est dans art.js (océan), art-terre.js (terre
//      ferme), art-dinos.js (dinosaures de profil, pour la fin), art-trois-quarts.js (les
//      animaux du niveau 2 vus de trois quarts : look 'tq-trex', 'tq-stegosaure'…),
//      art-poils.js (les mammifères des niveaux 3 et 4 vus de trois quarts, avec
//      leur fourrure, leurs cornes, leurs bois, leur trompe… et les humains :
//      look 'tq-mammouth', 'tq-loup', 'tq-humain'…), art-mer.js (reptiles marins,
//      requins, tortues, ammonites…) ou art-mammiferes.js (titanoboa, oiseau,
//      et les dessins de profil des intros et du défilé des chiens).
//   4. "evolutions" : les parties du corps à acheter avec l'ADN, et leur effet
//      ("effect" : speed, ratio, reach, vision, shield, armored, dash,
//      dry = on sèche moins vite, cones = voir les regards, radar ; et pour le
//      loup : howl = les loups seuls viennent vers toi, trust = la confiance
//      monte plus vite, bark = on peut aboyer (touche B), treats = les humains
//      lancent plus souvent à manger, herd = on rassemble les moutons de loin).
//   5. "chapters" : époque ("ago", en millions d'années), forme du joueur
//      ("form" : cellule, ver, poisson, tetrapode, reptile, dino, grand-dino,
//      tyran, nothosaure, ichthyosaure, pliosaure, mosasaure, musaraigne,
//      miacis, proailurus, machairodus, homotherium, louveteau, loup, chien,
//      berger) et ses couleurs ("skin" : body, belly, dark, stripe), tailles
//      ("size"), ADN pour grandir ("growth"), espèces présentes, évolutions
//      débloquées et missions (eat / evolve / grow ; pour le loup : pack =
//      rassembler une meute, trust =
//      la confiance des humains en %, bark = faire fuir en aboyant, herd =
//      ramener dans l'enclos, play = jouer avec ; "text" change la phrase).
//      power = le pouvoir de ce chapitre, touche F (type 'flash' / 'whip' / 'gulp' /
//      'hammer' / 'breach' / 'decoy' = la queue-leurre / 'roar' = le rugissement,
//      name, icon, recharge, range, intro, cry = le mot qui s'affiche) ; missions stun
//      (assommer) et hit (toucher un boss) ; start = où l'on arrive dans ce chapitre ; pack: N = la jauge de meute (N loups) ; trust: true = la jauge 🤝 de
//      confiance des humains, treat = ce qu'ils
//      te lancent à manger. Sur la terre : dry
//      (vitesse de séchage), waterSpeed, speed, vision, fog (obscurité).
//      "ago" peut descendre sous 1 (0,04 = il y a 40 000 ans). Le décor
//      avec "from" / "to" n'existe que dans ces chapitres (neige, terriers…).
//   6. "ending" : la scène ("scene" : 'roi' = le joueur acclamé, 'meteorite',
//      'feu' = l'arrivée des humains et les peintures des grottes, 'chien' =
//      la veillée au village et le défilé des races de chiens, 'requins' = le
//      défilé des requins d'aujourd'hui),
//      la foule ("crowd"), les légendes ("captions"), le titre et les choix ;
//      chaque choix nomme le niveau suivant ("level"). Tant qu'il n'existe
//      pas, la fin annonce « bientôt » (texte "soon").
//      Le niveau a aussi une icône ("icon"), une intro ('ocean' / 'terre' /
//      'mer' / 'mammiferes' / 'loup' / 'requins') et, si besoin, le numéro affiché ("num" : deux
//      niveaux 2 qui partent du même choix). "mapIcon" remplace l'icône sur
//      la carte des niveaux de l'écran de départ (elle se construit toute
//      seule à partir des choix de fin).
//   7. Ajouter le niveau à la liste ci-dessous. C'est tout : le moteur
//      (script.js) ne connaît aucune espèce par son nom.
// ============================================================================

import oceanPrimitif from './ocean-primitif.js';
import versLesDinosaures from './vers-les-dinosaures.js';
import monstresMarins from './monstres-marins.js';
import voieDesMammiferes from './voie-des-mammiferes.js';
import loupEtHumain from './loup-et-humain.js';
import voieDesRequins from './voie-des-requins.js';

export const LEVELS = [oceanPrimitif, versLesDinosaures, monstresMarins, voieDesMammiferes, loupEtHumain, voieDesRequins];
