// ============================================================================
// Les mondes et les niveaux de La Marche des Pompons.
// Le moteur (monde.js, script.js) ne connaît aucun niveau par son nom :
// tout ce qui décrit un niveau est ici et dans les fichiers de chaque monde.
//
// POUR AJOUTER UN NIVEAU
// ----------------------
// Ajoute un objet dans le tableau du monde (prairie.js, foret.js…) :
//   {
//     id: 'prairie-6',          // unique, sert à la sauvegarde : ne plus le changer ensuite
//     nom: 'Le nom du niveau',
//     plan: [ '…', '…' ],       // le terrain, une lettre = un cube de 16 × 16 pixels :
//         ' '  vide
//         '#'  terre (on peut la creuser)
//         'R'  roche grise (impossible à creuser)
//         '/'  '\'  pentes de terre (on les monte et descend en marchant)
//         '='  planche de bois (fine, on peut la creuser)
//         '~'  eau (les Pompons ne savent pas nager)
//         '^'  ronces (elles piquent)
//         'L'  lave (une colonne fine de « L » fait une cascade de lave)
//         'C'  un méchant clown qui se promène (posé sur le bas de la case)
//         'K'  un méchant clown qui ne bouge pas (il garde un passage)
//         'E'  l'entrée : le nuage d'où tombent les Pompons
//         'S'  la maison : la porte est posée sur le bas de la case
//     difficulte: 'difficile',  // facultatif : 'difficile' ou 'tres-difficile' (affiché au joueur)
//     pompons: 10,              // combien sortent du nuage
//     besoin: 6,                // combien doivent rentrer pour gagner
//     etoiles: [6, 8, 10],      // ★, ★★, ★★★ (facultatif)
//     cadence: 2,               // secondes entre deux Pompons
//     temps: 180,               // secondes pour finir
//     dir: 1,                   // sens de départ : 1 = vers la droite, -1 = vers la gauche
//     metiers: { creuse: 2 },   // les métiers du niveau et leur nombre :
//                               // stop, pont, creuse, tunnel, grimpe, parapluie, echelle,
//                               // friandise, toboggan
//     intro: 'ce que dit Plume au début',
//     astuce: 'l’indice du bouton 💡',
//     solution: [ … ],          // pour le pilote automatique (?debug) : voir plus bas
//   }
//
// Règles à garder en tête en dessinant un plan :
//   - un Pompon monte tout seul une marche de 6 pixels au plus : un cube (16) est un mur ;
//   - une chute de plus de 70 pixels (4 cubes et un peu) est perdue, sauf avec un parapluie ;
//   - l'entrée doit être à 4 cubes au plus au-dessus du sol (sinon les Pompons se perdent en sortant) ;
//   - un Pont = 12 briques : il avance de 3 cubes et monte d'un cube et demi ;
//   - une Échelle se pose contre un mur (pour monter) ou au bord d'un trou (pour
//     descendre), à 1 cube et demi devant le Pompon au plus ; elle mesure 7 cubes
//     au plus, et le sol doit être juste en dessous du bord. Elle marche dans les
//     deux sens : tous ceux qui arrivent en bas montent, tous ceux qui arrivent
//     en haut descendent ;
//   - un Toboggan se pose au bord d'un trou et descend en diagonale (on avance
//     autant qu'on descend, 10 cubes au plus) jusqu'au premier sol ; on ne le
//     prend que dans un sens : vers le bas ;
//   - un clown gobe tout Pompon qui arrive sur lui. Une Friandise part en cloche
//     (environ 9 cubes sur du plat, bien plus loin si on la lance d'en haut) ;
//     si elle touche un clown, il s'envole en confettis. Les clowns ne tombent
//     jamais : ils font demi-tour aux bords, aux murs et devant l'eau ou la lave ;
//   - les bords gauche et droit du plan sont des murs, le bas est le vide.
//
// La solution : une liste d'étapes { p, metier, x?, y?, etat?, tick? }.
//   Le Pompon n° p (0 = le premier sorti) reçoit le métier quand il est
//   exactement en x (et/ou en y), dans l'état « etat » (par défaut 'marche'),
//   et pas avant le pas « tick » (30 pas par seconde). metier: 'libere' remet
//   un Stop en route. Sans x ni y, le métier est donné dès la sortie du nuage.
//   Avec ?debug, __pom.verifie() rejoue toutes les solutions : chaque niveau
//   doit atteindre au moins son « besoin ».
//
// POUR AJOUTER UN MONDE : ajoute une entrée dans WORLDS ci-dessous (couleurs
// du terrain dans « theme », décor de fond dans « fond » : prairie, foret,
// grotte, montagne, volcan ou foire, voir art.js drawBackground).
// ============================================================================

import prairie from './prairie.js';
import foret from './foret.js';
import grotte from './grotte.js';
import montagne from './montagne.js';
import volcan from './volcan.js';
import foire from './foire.js';

export const WORLDS = [
  {
    id: 'prairie',
    nom: 'La Prairie',
    icone: '🌼',
    histoire: 'Le grand vent a déposé les Pompons dans une prairie pleine de fleurs. Il faut creuser, construire et faire demi-tour… pour rentrer à la maison !',
    theme: {
      fond: 'prairie',
      ciel: ['#7CCBF5', '#D6F1FF'],
      terre: '#B9773F', terreFonce: '#8A532A', caillou: '#E2C08F',
      herbe: '#58C46B', herbeClaire: '#8FE07A',
      roche: '#9AA3AD', rocheFonce: '#5E6670', contour: '#4A2B16',
      eau: '#3FA9E8',
    },
    niveaux: prairie,
  },
  {
    id: 'foret',
    nom: 'La Forêt',
    icone: '🌲',
    histoire: 'Dans la grande forêt, les arbres sont géants et les ronces piquent. Les Pompons vont apprendre à grimper… et à planer !',
    theme: {
      fond: 'foret',
      ciel: ['#5FB59A', '#CFEFD9'],
      terre: '#8B5A34', terreFonce: '#623B20', caillou: '#C69B6D',
      herbe: '#3E9B55', herbeClaire: '#6CC56A',
      roche: '#8E9A93', rocheFonce: '#56615B', contour: '#2E1C10',
      eau: '#3A9BC9',
    },
    niveaux: foret,
  },
  {
    id: 'grotte',
    nom: 'La Grotte',
    icone: '💎',
    histoire: 'Sous la montagne, une grotte pleine de cristaux. La roche grise est trop dure pour creuser… mais la terre, elle, se creuse en tunnel !',
    theme: {
      fond: 'grotte',
      ciel: ['#2A2350', '#4B3A78'],
      terre: '#8C6A5A', terreFonce: '#5E453B', caillou: '#B79A8A',
      herbe: '#6A8F5A', herbeClaire: '#8FB873',
      roche: '#7D8597', rocheFonce: '#4A5063', contour: '#1F1A2E',
      eau: '#4FC3E8',
    },
    niveaux: grotte,
  },
  {
    id: 'montagne',
    nom: 'La Montagne',
    icone: '🏔️',
    histoire: 'Tout en haut, le village des Pompons attend derrière les sommets enneigés. Il faudra tous les métiers pour y arriver !',
    theme: {
      fond: 'montagne',
      ciel: ['#8EC5F2', '#F1F8FF'],
      terre: '#8F7A6B', terreFonce: '#64554A', caillou: '#BFB3A8',
      herbe: '#F4FAFF', herbeClaire: '#FFFFFF', neige: true,
      roche: '#8C97A6', rocheFonce: '#566070', contour: '#2E3442',
      eau: '#5CB8E6',
    },
    niveaux: montagne,
  },
  {
    id: 'volcan',
    nom: 'Le Volcan',
    icone: '🌋',
    histoire: 'Au cœur d’un immense volcan, des rivières de lave coulent partout. Avec le nouveau métier Échelle, il faudra monter, descendre… et ne jamais tomber dans le feu !',
    theme: {
      fond: 'volcan', braise: true,
      ciel: ['#1A0404', '#6B1A08'],
      terre: '#4A3634', terreFonce: '#2C1E1E', caillou: '#7A5A50',
      herbe: '#5C2A1E', herbeClaire: '#9C4428',
      roche: '#3E3A44', rocheFonce: '#1E1B24', contour: '#120808',
      eau: '#FF7A1A',
    },
    niveaux: volcan,
  },
  {
    id: 'foire',
    nom: 'La Fête foraine',
    icone: '🎡',
    histoire: 'Une fête foraine pleine de lumières… mais de méchants clowns y gobent les Pompons ! Lance-leur des friandises et glisse sur les toboggans. Ici, 25 Pompons et que des niveaux difficiles !',
    theme: {
      fond: 'foire', confettis: true,
      ciel: ['#2A1856', '#E8689A'],
      terre: '#B9844E', terreFonce: '#8C5A30', caillou: '#FFD45E',
      herbe: '#4FC46A', herbeClaire: '#8FE07A',
      roche: '#D9475A', rocheFonce: '#8E2433', contour: '#3A1A2E',
      eau: '#4FC3F2',
    },
    niveaux: foire,
  },
];

/* la suite, annoncée à la fin du dernier monde */
export const BIENTOT = { icone: '❓', nom: 'La suite…', texte: 'Bientôt : de nouveaux mondes à explorer !' };

/* tous les niveaux à la suite, avec leur monde */
export const LEVELS = WORLDS.flatMap((w, wi) => w.niveaux.map((lv, li) => ({ ...lv, world: w, wi, li })));
