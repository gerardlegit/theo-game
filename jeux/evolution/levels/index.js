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
//        stray   un loup seul : il rejoint ta meute ("joins") quand tu le touches ;
//                shy = il s'enfuit si tu fonces près de lui ou si un chasseur te poursuit ;
//                lair = { far, gap, scent, whiff, call, guards, roam, guardR } : chacun se
//                cache dans sa tanière (des hautes herbes) à plus de "far" du départ et "gap"
//                des autres, sans jamais réapparaître ; on ne le sent qu'à "scent" pixels
//                (plus loin avec radar), ou toutes les "whiff" secondes quand le vent porte
//                son odeur ; le hurlement l'attire de "call" pixels ; "guards" = l'espèce qui
//                garde chaque tanière, de la plus proche à la plus lointaine
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
//      Leur dessin ("look") est dans art.js (océan), art-terre.js (insectes,
//      scorpions, libellules, ptérosaures), art-dessus.js (tous les animaux des
//      niveaux 2, 3 et 4, et les humains, vus de dessus : look 'vd-trex',
//      'vd-mammouth', 'vd-humain'…), art-mer.js et art-requins.js (la mer),
//      art-mammiferes.js (titanoboa, oiseau) ou art-loup.js (l'os lancé).
//      (art-profil.js : les dessins de profil des intros et des fins seulement.)
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
//      'mer' / 'mammiferes' / 'loup' / 'requins' / 'airs' / 'reptiles' / 'humains') et, si besoin, le numéro affiché ("num" : deux
//      niveaux 2 qui partent du même choix). "mapIcon" remplace l'icône sur
//      la carte des niveaux de l'écran de départ (elle se construit toute
//      seule à partir des choix de fin).
//   LA VUE DE CÔTÉ (voie-des-airs.js, voie-des-reptiles.js ; moteur : cote.js,
//   dessins : art-cote.js, animations : intro-cote.js)
//      world.view = 'cote' (et ground 'cote') : le monde est vu de profil. Chaque
//      chapitre a son paysage, "land" : w, h, base (le niveau du sol, en part de
//      h), hills, start (où l'on part, en part de la largeur), cliffs + cliffH
//      (des falaises avec leurs corniches), mountains + mountainH (des sommets ;
//      summit = à partir de quelle hauteur on est « au sommet »), lakes + lakeW +
//      lakeD, sea ('right' / 'left') + seaW + seaCliff (+ seaCliffH), thermals +
//      thermalLift (les colonnes d'air chaud), camps (les humains), trees
//      ({ kapokier, feuillu, palmier, fougere, mort, pin, acacia, cypres : nombre }),
//      deco ({ fougere, buisson, herbe, roseau, fleur, rocher, os, souche,
//      champignon, cactus : par 1000 px } ; buissons, herbes et roseaux cachent),
//      pal (les couleurs : sky, sun, layers = le lointain [{ kind 'mont' / 'foret'
//      / 'palmiers', A, p, col, snow, haze }], ground, grass, rock, snow, sand,
//      water…, weather 'cendre' / 'pluie' / 'lucioles' / 'pollen' / 'neige', mist).
//      Chapitre : moves = ce que sait faire le joueur ({ fly, float, dive, climb,
//      swim, jump, flyK, walkK, swimK, climbK, agile, flapRate }) ; wings = la jauge
//      💨 des ailes (en secondes de battements) ; camo = immobile dans un arbre,
//      on est invisible ; ambush = immobile sous l'eau, on est invisible ; bark =
//      le nom du cri ({ icon, name }) ; zoom ; nestK, eggCol.
//      Espèces : lives ('air' vole, 'eau' nage, 'arbre' sur les branches, 'sol'
//      par défaut), swims, climbs, dives, floats, alt = son étage dans le ciel
//      [min, max] au-dessus du sol, depth = sous l'eau [min, max], near 'eau' = il
//      vit au bord de l'eau, raider = il vient voler la becquée dans ton nid (on
//      fonce dessus pour le chasser : mission bark), glide = il plane, leap = il
//      saute hors de l'eau (toutes les N s), flapRate, agile, shell (tortues).
//      Looks « vc-<nom> » (art-cote.js) ; les mammifères et les humains de profil
//      viennent d'art-profil.js.
//      Missions : nest (construire son nid ; place 'corniche' / 'cime' / 'sommet'
//      / 'sol' / 'cache' = dans les hautes herbes / 'haut' / 'arbre' ; eggs ;
//      hint = ce que dit Ammo au mauvais endroit), feed (n becquées rapportées au
//      nid ; species = ce qui compte), visit (atteindre n lieux : place 'cime' /
//      'thermique' + alt / 'sommet' ; icon, cry), escape (échapper n fois à un
//      chasseur). Intro 'airs' / 'reptiles' ; fin scene 'oiseaux' / 'reptiles'
//      avec "parade" = le défilé des espèces d'aujourd'hui ([{ look, name, color,
//      belly, k (la taille), fly }]).
//   LA VUE DE TROIS QUARTS (voie-des-humains.js ; moteur : tqv.js, dessins :
//   art-humains.js, animations : intro-humains.js)
//      world.view = 'tqv' : le sol est vu d'en haut, mais tout ce qui est debout
//      (humains, animaux, arbres, huttes) se dessine debout et se range du fond
//      vers le devant. Une seule carte pour tout le niveau : ce qu'on construit
//      reste d'un chapitre à l'autre. world.village + villageR (le centre et le
//      rayon de la palissade) ; world.land (riverX, riverW, caveDx/caveDy = la
//      grotte, fireTree = l'arbre en feu du chapitre 1, forests, woodNear, rocks,
//      flint, ochre, wheat + meadow = le blé sauvage, bushes = buissons, herbes,
//      fougères et fleurs, loneTrees = arbres seuls, borderTrees = la forêt du bord,
//      reeds = roseaux de la rivière, decals = touffes et fleurs au sol) ; la grotte
//      est une salle où l'on entre par une arche (la colline devient transparente) ;
//      world.spearKill = { hits, from } : à partir du chapitre "from", "hits" coups
//      de lance abattent un prédateur, et la moitié de la tribu (des guerriers) et la
//      troupe lancent aussi leurs lances sur les fauves ; world.res = les
//      ressources du compteur ([{ id, name, from, to }] : bois, silex, ocre, blé) ;
//      world.sites = ce qu'on construit ({ id, type 'foyer' / 'feu' / 'peinture' /
//      'hutte' / 'enclos' / 'champ' / 'grenier' / 'palissade' / 'porte' / 'tour',
//      name, ch, at = [dx, dy] depuis le village ou 'grotte', cost = { bois: 3,
//      feu: 1… }, need = l'invention qu'il faut, planR, adn = les idées gagnées ;
//      la palissade : ring = le nombre de morceaux, gate = l'angle de la porte, ou
//      gates = les angles de plusieurs portes ; 'canal' = le canal d'irrigation, tracé
//      par land.canal = { y, to } : une fois creusé, il arrose les champs tout seul) ;
//      world.currency = la monnaie (💡 « idées » au lieu de 🧬 : icon, name,
//      verb, order, many, later, tag, sub, stat) ; world.noEat = on ne mange
//      rien. "lines" peut remplacer toutes les phrases d'Ammo de data.js.
//      Espèces : kind 'tribu' (les gens du village), 'pillard' (ils viennent
//      voler le blé et cassent la palissade ; breaker = leur force, tough = il
//      faut deux coups de lance), fieldRaider (il mange le blé des champs),
//      tag = l'étiquette de sa fiche. Looks « th-<nom> » (art-humains.js).
//      Chapitre : night (on ne voit que près des feux), dry + world.meter (le
//      froid), bark = la torche ({ icon, name, cry, sound, ring, sparks }), power
//      type 'lance' (+ need = l'invention qui la donne), packText = les mots de
//      la troupe ({ icon, name, word, join, full, lost, sound, whiff = le mot de l'appel
//      lointain d'un chasseur caché (sp.lair) }), penned = les
//      bêtes déjà dans l'enclos, raids = les attaques ({ after = la mission après
//      laquelle elles commencent, species, chief, waves, gap, first ; les pillards visent
//      le grenier ou l'enclos et ses moutons), hunger = la faim du village (jauge 🍞 :
//      { rate, below, bread, breadGain, sheepGain, startBle, restartBle } ; il mange le blé du
//      grenier, puis les moutons ; à zéro, on a perdu et on recommence l'époque), zoom.
//      Missions : gather (res, n), build (what = un type de site, n), deliver
//      (item 'eau' : arroser les champs), harvest (n gerbes), defend (n attaques
//      repoussées sans qu'ils volent de blé). Intro 'humains' ; fin scene
//      'civilisation' avec "parade" = le défilé des inventions ([{ icon ou draw
//      'biface' / 'roue', name }]).
//   7. Ajouter le niveau à la liste ci-dessous. C'est tout : le moteur
//      (script.js) ne connaît aucune espèce par son nom.
// ============================================================================

import oceanPrimitif from './ocean-primitif.js';
import versLesDinosaures from './vers-les-dinosaures.js';
import monstresMarins from './monstres-marins.js';
import voieDesMammiferes from './voie-des-mammiferes.js';
import loupEtHumain from './loup-et-humain.js';
import voieDesRequins from './voie-des-requins.js';
import voieDesAirs from './voie-des-airs.js';
import voieDesReptiles from './voie-des-reptiles.js';
import voieDesHumains from './voie-des-humains.js';

export const LEVELS = [oceanPrimitif, versLesDinosaures, monstresMarins, voieDesMammiferes, loupEtHumain, voieDesRequins, voieDesAirs, voieDesReptiles, voieDesHumains];
