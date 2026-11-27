// ============================================================================
// Les textes des Embouteillages de Bouchonville : les panneaux (avec leur
// fiche « Le savais-tu ? »), les lieux de la ville, et tout ce que dit Zaza,
// la zèbre agente de la circulation qui guide l'enfant.
// ============================================================================

/* Les outils de la barre du bas, dans l'ordre des boutons */
export const PANNEAUX = [
  {
    id: 'stop', nom: 'STOP', touche: '1',
    court: 'Arrêt obligatoire : on s’arrête, on regarde, on repart.',
    comment: 'La voiture s’arrête complètement à la ligne blanche. Elle regarde bien à gauche et à droite, et repart seulement quand plus personne n’arrive sur l’autre route. C’est le panneau des carrefours où l’on voit mal.',
    fait: 'Le STOP est le seul panneau à huit côtés : un octogone. On le reconnaît même de dos, ou couvert de neige ! On le trouve presque partout dans le monde.',
  },
  {
    id: 'cede', nom: 'Cédez', touche: '2',
    court: 'Cédez le passage : on ralentit et on laisse passer.',
    comment: 'La voiture ralentit et laisse passer celles qui arrivent sur l’autre route. Si personne ne vient, elle passe sans s’arrêter : c’est plus rapide qu’un STOP. Mais attention, il faut bien voir la route !',
    fait: 'Le Cédez-le-passage est le seul panneau en triangle la pointe en bas. Par terre, il va avec une ligne blanche en pointillés.',
  },
  {
    id: 'enlever', nom: 'Enlever', touche: '3', outil: true,
    court: 'Touche un panneau pour l’enlever.',
  },
];
export const PANNEAU_BY_ID = Object.fromEntries(PANNEAUX.map((p) => [p.id, p]));

/* Les lieux d'arrivée : leur nom, leur icône et la couleur de leurs voitures */
export const LIEUX = {
  ecole: { nom: 'L’École', icone: '🏫', couleur: '#FFC53D', fonce: '#D9961A' },
  hopital: { nom: 'L’Hôpital', icone: '🏥', couleur: '#F2555A', fonce: '#B83038' },
  boulangerie: { nom: 'La Boulangerie', icone: '🥖', couleur: '#F28C38', fonce: '#B8601E' },
  piscine: { nom: 'La Piscine', icone: '🏊', couleur: '#36B8E8', fonce: '#1F7FAD' },
  stade: { nom: 'Le Stade', icone: '⚽', couleur: '#5BC46A', fonce: '#358A42' },
};

export const STAR_TEXT = ['', 'Bravo !', 'Super !', 'Parfait !'];

/* Ce que dit Zaza */
export const ZAZA = {
  premier: 'Coucou, moi c’est Zaza ! La tempête a emporté tous les panneaux de Bouchonville. Sans règles, personne ne sait qui doit passer… Aide-moi à les remettre !',
  dispute: [
    'Tuuut ! Ils se disputent : personne ne sait qui doit passer. Il faut un panneau dans ce carrefour !',
    'Tu entends ces klaxons ? Dans ce carrefour, il n’y a pas de règle !',
    'Oh là là, ça bouchonne ! Pose un Cédez-le-passage ou un STOP sur une des routes.',
  ],
  memeRang: 'Hum… ici, les deux routes qui se croisent ont un panneau. Si tout le monde doit laisser passer, personne ne passe !',
  deuxPrio: 'Dans ce carrefour, deux routes sans panneau se croisent : on ne sait pas laquelle est prioritaire. La route prioritaire, c’est celle qui traverse tout droit, sans panneau des deux côtés.',
  frayeur: [
    'Ouh là, frayeur ! Les haies cachent la route : avec un Cédez-le-passage, on ne voit pas qui arrive. Ici, il faut un STOP pour s’arrêter et bien regarder !',
    'Pile à temps ! Dans un carrefour caché, mets plutôt un STOP.',
  ],
  furieux: [
    'Ce conducteur est tout rouge de colère ! Il attend depuis trop longtemps.',
    'Grrr ! Un conducteur furieux… Les étoiles, c’est pour les conducteurs calmes !',
  ],
  pose: [
    'Tuut-tuut ! Bien placé, ce panneau.',
    'Bravo ! Regarde : maintenant chacun sait qui passe.',
    'Super ! Le carrefour respire.',
  ],
  poseStop: 'Un STOP : la voiture s’arrête complètement, regarde, puis repart.',
  poseCede: 'Un Cédez-le-passage : la voiture ralentit et laisse passer ceux de l’autre route.',
  aveugle: 'Tu vois ces grandes haies ? On n’y voit rien dans ce carrefour : choisis bien ton panneau !',
  enleve: 'Panneau rangé ! Tu peux le poser ailleurs.',
  vide: 'Tu n’as plus de ce panneau. Enlève-en un ailleurs si tu veux le déplacer !',
  choisis: 'Choisis d’abord un panneau en bas de l’écran, puis touche un rond qui clignote.',
  arrive: ['Et une de plus à bon port !', 'Bien arrivée !', 'Pouet pouet ! Elle est garée.'],
  presque: 'Plus que quelques voitures, tiens bon !',
  idle: [
    'Astuce : touche une voiture pour voir où elle va.',
    'Le bouton ⏸ arrête le temps : tu peux poser tes panneaux tranquillement.',
    'La route où passent le plus de voitures devrait rester sans panneau : c’est la route prioritaire.',
    'Un STOP, c’est plus lent qu’un Cédez-le-passage. Garde-les pour les carrefours où l’on voit mal !',
  ],
  blagues: [
    'Pourquoi les zèbres font de bons agents de la circulation ? Parce qu’ils ont déjà le passage piéton sur le dos !',
    'Quel est le comble pour un automobiliste ? Avoir un volant… et ne pas savoir voler !',
    'Que dit un feu rouge à un feu vert ? Ne me regarde pas, je me change !',
  ],
  win: ['Bravo, la circulation est fluide !', 'Tout le monde est arrivé à l’heure, grâce à toi !', 'Bouchonville te dit merci !'],
  fail: ['Oh non, la ville est restée bloquée…', 'Les conducteurs sont rentrés à pied !', 'Quel embouteillage !'],
};
