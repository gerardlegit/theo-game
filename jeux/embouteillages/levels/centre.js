// ============================================================================
// Quartier 1 : le Centre-ville de Bouchonville (STOP et Cédez-le-passage).
// Le plan et les règles des lettres sont expliqués dans index.js.
// ============================================================================

export default [
  {
    id: 'centre-1',
    nom: 'Le grand carrefour',
    plan: [
      '.....C...........~....',
      '.....#...........~....',
      '.1###x##############2.',
      '.....#ppppppp#...~....',
      '.....#pppfppp#...~....',
      '.....#ppppppp#...~....',
      'A############x#######B',
      '.....#.......#...~....',
      '.....#.......#...~....',
      '.....#.......#...~....',
      '.3##################4.',
      '.....#.......#...~....',
      '.....#.......#...~....',
      '.....D.......E...~....',
    ],
    /* les entrées de la ville (lettres) et les lieux d'arrivée (chiffres) */
    entrees: {
      A: { nom: 'La Campagne' },
      B: { nom: 'La Gare' },
      C: { nom: 'La Colline' },
      D: { nom: 'La Forêt' },
      E: { nom: 'Le Port' },
    },
    lieux: {
      1: { type: 'ecole', zone: [0, 3, 4, 5] },
      2: { type: 'hopital', zone: [18, 3, 21, 5] },
      3: { type: 'boulangerie', zone: [0, 11, 4, 13] },
      4: { type: 'piscine', zone: [18, 11, 21, 13] },
    },
    /* le décor qui n'est pas un lieu d'arrivée */
    decor: [
      { type: 'stade', zone: [6, 7, 12, 9] },
    ],
    voitures: [
      { de: 'B', vers: '3', t: 1 },
      { de: 'E', vers: '1', t: 2 },
      { de: 'D', vers: '3', t: 8 },
      { de: 'D', vers: '1', t: 8 },
      { de: 'B', vers: '1', t: 13.5 },
      { de: 'C', vers: '4', t: 16 },
      { de: 'B', vers: '4', t: 16.5 },
      { de: 'E', vers: '1', t: 17 },
      { de: 'E', vers: '3', t: 17.5 },
      { de: 'A', vers: '2', t: 19 },
      { de: 'D', vers: '1', t: 21.5 },
      { de: 'A', vers: '2', t: 22 },
      { de: 'E', vers: '2', t: 26 },
    ],
    panneaux: { stop: 4, cede: 6 },
    temps: 150,
    etoiles: [0, 10, 13],
    intro: 'Personne ne sait qui doit passer ! Choisis un panneau en bas, puis touche un rond qui clignote au bord d’un carrefour.',
    astuce: 'Dans chaque carrefour, une des routes reste sans panneau : c’est la route prioritaire. Mets un Cédez-le-passage sur les autres… et un STOP là où les haies cachent la vue !',
    solution: [
      { noeud: [5, 2], cote: 'e', panneau: 'stop' },
      { noeud: [13, 2], cote: 's', panneau: 'cede' },
      { noeud: [5, 6], cote: 'n', panneau: 'cede' },
      { noeud: [5, 6], cote: 's', panneau: 'cede' },
      { noeud: [13, 6], cote: 'n', panneau: 'stop' },
      { noeud: [13, 6], cote: 's', panneau: 'stop' },
      { noeud: [5, 10], cote: 'e', panneau: 'cede' },
      { noeud: [13, 10], cote: 'o', panneau: 'cede' },
    ],
  },
];
