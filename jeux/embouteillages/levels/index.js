// ============================================================================
// Les quartiers et les niveaux des Embouteillages de Bouchonville.
// Le moteur (ville.js, script.js) ne connaît aucun niveau par son nom :
// tout ce qui décrit un niveau est ici et dans le fichier de chaque quartier.
//
// POUR AJOUTER UN NIVEAU
// ----------------------
// Ajoute un objet dans le tableau du quartier (centre.js…) :
//   {
//     id: 'centre-2',           // unique, sert à la sauvegarde : ne plus le changer ensuite
//     nom: 'Le nom du niveau',
//     plan: [ '…', '…' ],       // la ville, une lettre = un carreau de 48 × 48 pixels :
//         '#'  route (deux voies, on roule à droite)
//         'x'  carrefour caché par de hautes haies : on n'y voit rien !
//              (avec un Cédez-le-passage, les voitures passent sans voir… frayeur)
//         'A'…'Z'  une entrée de la ville, d'où sortent des voitures (au bord du plan)
//         '1'…'9'  un lieu d'arrivée (le parking au bout d'une petite route)
//         '.'  maisons et immeubles (dessinés tout seuls)
//         'p'  parc, 'f' fontaine, '~' rivière (une route qui la traverse devient un pont)
//     entrees: { A: { nom: 'La Campagne' }, … },
//     lieux: { 1: { type: 'ecole', zone: [c0, r0, c1, r1] }, … },
//                               // type : ecole, hopital, boulangerie, piscine, stade
//                               // (couleurs et icônes dans data.js LIEUX), zone : le bâtiment
//     voitures: [ { de: 'A', vers: '2', t: 0 }, … ],
//                               // t : seconde où la voiture arrive en ville
//     panneaux: { stop: 4, cede: 6 },   // les panneaux qu'on peut poser
//     temps: 150,               // secondes pour que tout le monde arrive
//     etoiles: [0, 9, 12],      // ★, ★★, ★★★ : nombre de conducteurs restés calmes
//                               // (la 1re étoile = toutes les voitures arrivées)
//     intro: 'ce que dit Zaza au début',
//     astuce: 'l’indice du bouton 💡',
//     solution: [ { noeud: [c, r], cote: 'n', panneau: 'stop', t: 0 }, … ],
//                               // les panneaux du pilote automatique (?debug) : le carrefour
//                               // en (c, r), la route qui arrive par le côté n, s, e ou o.
//   }
//
// Règles à garder en tête en dessinant un plan :
//   - un carrefour = un carreau de route qui touche 3 ou 4 autres routes ;
//   - deux routes de même rang (toutes les deux sans panneau, ou toutes les
//     deux avec un panneau) qui se croisent : les voitures se disputent ;
//   - les voitures prennent toujours le plus court chemin ;
//   - avec ?debug, __emb.verifie() rejoue chaque solution : toutes les voitures
//     doivent arriver, et sans aucun panneau la ville doit rester bloquée.
//
// POUR AJOUTER UN QUARTIER : ajoute une entrée dans QUARTIERS ci-dessous.
// ============================================================================

import centre from './centre.js';

export const QUARTIERS = [
  {
    id: 'centre',
    nom: 'Le Centre-ville',
    icone: '⛲',
    histoire: 'Au centre de Bouchonville, plus personne ne sait qui doit passer. Avec des STOP et des Cédez-le-passage, remets de l’ordre dans les carrefours !',
    couleurs: ['#7FD3F7', '#58C46B'],
    niveaux: centre,
  },
];

/* les quartiers à venir, montrés sur la carte avec « bientôt » */
export const BIENTOT = [
  { nom: 'Les Feux tricolores', icone: '🚦', texte: 'Bientôt : les feux rouges, orange et verts du quartier de la Gare !' },
  { nom: 'Les Ronds-points', icone: '🔄', texte: 'Bientôt : on tourne, on tourne… autour des ronds-points !' },
  { nom: 'Les Sens interdits', icone: '⛔', texte: 'Bientôt : les ruelles étroites et les sens uniques de la Vieille ville !' },
  { nom: 'L’École', icone: '🚸', texte: 'Bientôt : les passages piétons devant l’école !' },
];

/* tous les niveaux à la suite, avec leur quartier */
export const LEVELS = [];
QUARTIERS.forEach((q, qi) => q.niveaux.forEach((lv, li) => {
  LEVELS.push({ ...lv, quartier: q, qi, li });
}));
