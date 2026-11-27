// ============================================================================
// Quartier 1 : le Centre-ville de Bouchonville (STOP et Cédez-le-passage).
// Le plan et les règles des lettres sont expliqués dans index.js.
// ============================================================================

export default [
  /* La leçon de Zaza : un niveau guidé pas à pas (le champ « lecon »).
     Trois carrefours, trois règles : un Cédez-le-passage sur la petite route,
     un STOP là où les haies cachent la vue, deux panneaux face à face quand
     la petite route traverse la grande. Les voitures arrivent juste quand il
     faut : pendant les explications, le temps est arrêté. */
  {
    id: 'centre-lecon',
    nom: 'La leçon de Zaza',
    plan: [
      '...B.......D.....',
      '...#.......#.....',
      '...#.......#.....',
      'A######x#######..',
      'pppppp.#...#..1..',
      'ppfppp.#...#.....',
      'pppppp.C...E.....',
    ],
    entrees: {
      A: { nom: 'La Campagne' },
      B: { nom: 'La Colline' },
      C: { nom: 'La Forêt' },
      D: { nom: 'Le Moulin' },
      E: { nom: 'Le Port' },
    },
    lieux: {
      1: { type: 'ecole', zone: [12, 5, 16, 6] },
    },
    voitures: [
      /* 1er carrefour : la grande route contre la petite */
      { de: 'A', vers: '1', t: 0.3 },
      { de: 'B', vers: '1', t: 0.3 },
      /* 2e carrefour, caché par les haies */
      { de: 'A', vers: '1', t: 5.5 },
      { de: 'C', vers: '1', t: 8.1 },
      /* 3e carrefour : la petite route arrive des deux côtés */
      { de: 'A', vers: '1', t: 12 },
      { de: 'D', vers: '1', t: 17.2 },
      { de: 'E', vers: '1', t: 17.2 },
      /* et toute la ville roule */
      { de: 'B', vers: '1', t: 28 },
      { de: 'A', vers: '1', t: 29 },
      { de: 'D', vers: '1', t: 30.5 },
    ],
    panneaux: { stop: 1, cede: 3 },
    temps: 300,
    etoiles: [0, 0, 0],
    intro: 'Bienvenue à l’auto-école de Zaza !',
    astuce: 'La grande route reste sans panneau : elle est prioritaire. Un Cédez-le-passage sur la petite route… et un STOP là où les haies cachent la vue !',
    /* les étapes de la leçon (script.js, « La leçon de Zaza ») :
         quand  : on laisse rouler jusqu'à ce moment (dispute: [c, r] = ce carrefour se bloque)
         camera : [c, r] zoome sur ce carrefour, 'tout' montre toute la ville
         dit    : ce que dit Zaza
         montre : ce qu'on montre du doigt (outil, rond, noeud, bouton) ou en couleur
                  (zone: [c0, r0, c1, r1], avec texte et etiquette: [c, r] où l'écrire)
         attend : 'suivant' (un bouton), { outil }, { pose: [clés], panneau }, { duree: s }
         fiche  : ouvre la fiche « Le savais-tu ? » d'un panneau */
    lecon: [
      { camera: [3, 3], dit: 'Bienvenue à l’auto-école de Zaza ! Je vais t’apprendre à remettre les panneaux. Regarde bien ce carrefour…', attend: 'suivant', bouton: 'C’est parti ! 🚗' },
      { quand: { dispute: [3, 3] }, camera: [3, 3], dit: 'Tuuut ! Ces deux voitures se disputent : aucune ne sait qui doit passer en premier.', montre: [{ noeud: [3, 3] }], attend: 'suivant' },
      {
        dit: 'La grande route reste sans panneau : elle est prioritaire. Sur la petite route, on pose un Cédez-le-passage.',
        montre: [{ zone: [0, 3, 6, 3], couleur: '#5BC46A', texte: 'grande route', etiquette: [5, 3] }, { zone: [3, 0, 3, 2], couleur: '#FFC53D', texte: 'petite route', etiquette: [4.7, 2.1] }],
        attend: 'suivant',
      },
      { dit: 'Touche le panneau Cédez-le-passage, là où je te le montre.', montre: [{ outil: 'cede' }], attend: { outil: 'cede' } },
      { dit: 'Bien ! Maintenant, touche le rond jaune au bout de la petite route.', montre: [{ rond: '3,3,n' }], attend: { pose: ['3,3,n'], panneau: 'cede' } },
      { dit: 'Regarde : la voiture de la petite route ralentit, laisse passer la grande route… puis elle repart !', attend: { duree: 3.2 } },
      { fiche: 'cede' },
      { quand: { dispute: [7, 3] }, camera: [7, 3], dit: 'Oh, un autre carrefour bloqué ! Tu vois l’œil barré ? De hautes haies cachent la vue.', montre: [{ noeud: [7, 3] }], attend: 'suivant' },
      { dit: 'Avec un Cédez-le-passage, on ne verrait pas qui arrive : frayeur ! Ici, il faut un STOP. On s’arrête complètement, on regarde bien, puis on repart.', attend: 'suivant' },
      { dit: 'Choisis le STOP.', montre: [{ outil: 'stop' }], attend: { outil: 'stop' } },
      { dit: 'Et touche le rond de la petite route.', montre: [{ rond: '7,3,s' }], attend: { pose: ['7,3,s'], panneau: 'stop' } },
      { dit: 'La voiture s’arrête… elle regarde… et elle repart quand la route est libre. Parfait !', attend: { duree: 4 } },
      { fiche: 'stop' },
      {
        quand: { dispute: [11, 3] }, camera: [11, 3],
        dit: 'Le dernier carrefour a quatre routes ! La grande route le traverse tout droit : elle reste prioritaire.',
        montre: [
          { zone: [8, 3, 13, 3], couleur: '#5BC46A', texte: 'grande route', etiquette: [8.6, 3] },
          { zone: [11, 0, 11, 2], couleur: '#FFC53D', texte: 'petite route', etiquette: [12.7, 2.1] },
          { zone: [11, 4, 11, 6], couleur: '#FFC53D', texte: 'petite route', etiquette: [12.7, 4.9] },
        ],
        attend: 'suivant',
      },
      { dit: 'Mais la petite route arrive des deux côtés : il faut un panneau de chaque côté. À toi : pose deux Cédez-le-passage !', montre: [{ outil: 'cede' }, { rond: '11,3,n' }, { rond: '11,3,s' }], attend: { pose: ['11,3,n', '11,3,s'], panneau: 'cede' } },
      { dit: 'Génial ! Les voitures de la petite route laissent passer celles de la grande route.', attend: { duree: 4 } },
      { camera: 'tout', dit: 'Dans les vrais niveaux, les voitures arrivent vite. Le bouton ⏸ arrête le temps : tu peux poser tes panneaux tranquillement !', montre: [{ bouton: 'pauseBtn' }], attend: 'suivant' },
      { dit: 'Et maintenant, regarde ta ville rouler… Tout le monde sait qui doit passer !', attend: { duree: 3 } },
    ],
    fin: 'Bravo, tu connais les trois secrets de Zaza : la grande route reste prioritaire, un Cédez-le-passage sur la petite route, et un STOP là où l’on ne voit rien !',
    solution: [
      { noeud: [3, 3], cote: 'n', panneau: 'cede' },
      { noeud: [7, 3], cote: 's', panneau: 'stop' },
      { noeud: [11, 3], cote: 'n', panneau: 'cede' },
      { noeud: [11, 3], cote: 's', panneau: 'cede' },
    ],
  },
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
