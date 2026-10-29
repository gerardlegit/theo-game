// ============================================================================
// LES NIVEAUX — un niveau = une partie du Grimoire Magique de Plume.
//
// Gribouille, le petit nuage farceur, a soufflé sur le grimoire : tout ce qui
// était écrit dedans s'est envolé dans des bulles. Dans chaque niveau, le
// joueur répare plusieurs pages (les chapitres). Pour chaque « sort », un
// modèle s'affiche sur le parchemin (une lettre, une image, un mot ou deux
// mots) et le joueur touche la bulle qui contient la même chose, écrite
// dans une autre écriture : MAJUSCULES (cap), script (minuscules des livres)
// ou attachée (cursive).
//
// Le joueur choisit son niveau sur l'écran de départ, ou fait « le grand
// voyage » : les niveaux les uns après les autres, dans l'ordre de la liste.
//
// POUR AJOUTER UN NIVEAU
//   1. Copier levels/mots.js en levels/mon-niveau.js et changer son "id"
//      (il sert aussi pour la sauvegarde et le classement :
//      lettres-magiques-<id>).
//   2. "scene" : le décor dessiné dans art.js ('tour', 'jardin', 'lac',
//      'chateau'). "icon", "name", "age" (le niveau scolaire), "short" (une
//      ligne sur la carte du niveau) et "example" (le petit exemple affiché
//      sur cette carte : [écriture, texte] avant et après la flèche).
//   3. "lines" : ce que dit Plume au début (start) ; "ending" : le titre, le
//      texte et le « Le savais-tu ? » de la fin du niveau.
//   4. "chapters" : les pages du niveau. Pour chacune :
//        title / say    le nom de la page et ce que dit Plume en l'ouvrant
//        count          le nombre de sorts à réussir pour réparer la page
//        choices        le nombre de bulles (3 ou 4)
//        pairs          les écritures utilisées : [modèle, bulles], tirées au
//                       hasard à chaque sort. Le modèle peut être 'img' (une
//                       image, il faut alors un "img" à chaque élément).
//        wind           (facultatif) Gribouille souffle : les bulles se
//                       balancent plus fort (0,5 = un peu, 1,5 = beaucoup)
//        star           (facultatif) une mission bonus « étoile filante »
//        streak         (facultatif) la mission bonus « série » (3 par défaut)
//        tips           les conseils que Plume donne pendant la page
//        facts          les fiches « Le savais-tu ? » ({ pic, title, text } ;
//                       pic = un code d’émoji Noto, ou un petit texte : [[écriture, texte], …])
//        items          les éléments à retrouver : { t, traps, img?, say? }
//                       t = le texte en minuscules, traps = les pièges (des
//                       mots qui se ressemblent), img = le code de l'émoji
//                       Noto (https://fonts.gstatic.com/s/e/notoemoji/…),
//                       say = comment le lire à voix haute si ce n'est pas t.
//   5. Ajouter le niveau à la liste ci-dessous. C'est tout : le moteur
//      (script.js) ne connaît aucune lettre ni aucun mot par son nom.
// ============================================================================

import lettres from './lettres.js';
import images from './images.js';
import mots from './mots.js';
import deuxMots from './deux-mots.js';

export const LEVELS = [lettres, images, mots, deuxMots];
