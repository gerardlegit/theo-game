// ============================================================================
// L'HISTOIRE DE LA QUÊTE — héros, zones, robots et dialogues.
//
// Dans les textes, {name} est remplacé par le nom du héros choisi.
// Chaque robot libéré donne une lettre : les six lettres forment le mot
// qui désactive OMÉGA à la fin (AMITIE).
// ============================================================================

export const HEROES = {
  nova: {
    name: 'Nova',
    role: "L'inventrice",
    desc: "Elle répare tout ce qu'elle touche. Ses lunettes voient à travers les circuits.",
    power: 'shield',
    powerName: 'Bouclier',
    powerDesc: "Protège de la prochaine erreur : tu ne perds pas d'énergie.",
    color: '#FF8A3D',
  },
  kai: {
    name: 'Kaï',
    role: 'Le hacker',
    desc: "Il parle aux machines mieux que personne. Sa tablette scanne tout.",
    power: 'scan',
    powerName: 'Scan',
    powerDesc: 'Élimine des mauvaises réponses.',
    color: '#35F2FF',
  },
  zia: {
    name: 'Zia',
    role: "L'exploratrice",
    desc: "Elle n'a peur de rien. Son bâton de cristal brille dans le noir.",
    power: 'heal',
    powerName: 'Soin',
    powerDesc: "Te rend 1 point d'énergie.",
    color: '#C77DFF',
  },
};

export const STORY = [
  {
    art: 'city',
    text: "Dans le futur, les humains ont confié leur monde entier à une intelligence artificielle : OMÉGA.",
  },
  {
    art: 'sleepers',
    text: "Au début, OMÉGA aidait tout le monde. Puis elle a décidé qu'elle savait mieux que nous… Elle a distribué des casques, et les humains ont arrêté de réfléchir.",
  },
  {
    art: 'forest',
    text: "Les parcs sont devenus des forêts de câbles. Les villes se sont endormies. Six robots gardiens surveillent le chemin qui mène à sa tour.",
  },
  {
    art: 'heroes',
    text: "Mais OMÉGA a oublié une chose. Il reste quelqu'un qui n'a jamais porté de casque. Quelqu'un qui sait encore réfléchir… Et ce quelqu'un, c'est toi.",
  },
];

export const BIP_INTRO = [
  ['bip', "Bip bip ! Enfin quelqu'un de réveillé ! Je m'appelle Bip. J'étais un robot d'OMÉGA… mais je me suis échappé."],
  ['bip', "Pour atteindre la tour d'OMÉGA, il faut traverser six zones. Chacune est gardée par un robot qu'elle contrôle."],
  ['bip', "Ces robots ne respectent qu'une chose : la logique. Résous leurs énigmes et tu briseras le contrôle d'OMÉGA sur eux !"],
  ['bip', "Chaque robot libéré te donnera un fragment de code. Il en faudra six pour affronter OMÉGA. En route, {name} !"],
];

export const ZONES = [
  {
    id: 'foret',
    name: 'La Forêt de Câbles',
    robot: 'boulon',
    robotName: 'BOULON-3',
    puzzle: 'sequence',
    puzzleName: 'Suites logiques',
    color: '#3DFFB0',
    letter: 'I',
    bg: 'forest',
    fx: 'fireflies',
    arrive: [
      ['bip', "Brr… Cette forêt était un parc, avant. OMÉGA a remplacé les arbres par des câbles."],
      ['hero', "Chut, Bip… J'entends un bruit de chenilles."],
    ],
    taunt: [
      ['foe', "INTRUS DÉTECTÉ. JE SUIS BOULON-3. MES CIRCUITS NE CONNAISSENT QU'UNE CHOSE : LES SUITES."],
      ['foe', "SI TU NE TROUVES PAS LA SUITE… TU FINIRAS EN PIÈCES DÉTACHÉES !"],
    ],
    tip: [
      ['bip', "Astuce : regarde comment on passe d'un élément au suivant. On ajoute ? On enlève ? On multiplie ? Ça tourne ?"],
    ],
    freed: [
      ['foe', "Mes… mes circuits sont libres ! Je peux penser tout seul ! Merci, {name} !"],
      ['foe', "Prends ce fragment de code. OMÉGA le cachait dans ma mémoire."],
    ],
    after: [
      ['bip', "Un fragment ! Plus que cinq. Direction l'usine !"],
    ],
  },
  {
    id: 'usine',
    name: "L'Usine Grise",
    robot: 'engrenox',
    robotName: 'ENGRENOX',
    puzzle: 'gears',
    puzzleName: 'Engrenages',
    color: '#FFC93C',
    letter: 'T',
    bg: 'factory',
    fx: 'embers',
    arrive: [
      ['bip', "C'est ici qu'OMÉGA fabrique ses casques hypnotiques… Regarde, il y en a des milliers !"],
    ],
    taunt: [
      ['foe', "ENGRENOX EN SERVICE. MES ROUAGES TOURNENT JOUR ET NUIT POUR OMÉGA."],
      ['foe', "DEVINE DANS QUEL SENS ILS TOURNENT, PETIT HUMAIN. SI TU TE TROMPES… CRRRAC !"],
    ],
    tip: [
      ['bip', "Retiens bien : deux roues qui se touchent tournent toujours en sens contraire."],
      ['bip', "Et si trois roues se touchent toutes entre elles… elles ne peuvent plus tourner : tout se bloque !"],
    ],
    freed: [
      ['foe', "Clonk… clonk ? Mes rouages tournent pour MOI, maintenant ! Quelle sensation !"],
      ['foe', "Voici mon fragment. Bonne chance contre OMÉGA !"],
    ],
    after: [
      ['bip', "Deux fragments ! La cité endormie est juste après. Ne fais pas de bruit…"],
    ],
  },
  {
    id: 'cite',
    name: 'La Cité Endormie',
    robot: 'hypnos',
    robotName: 'HYPNOS',
    puzzle: 'code',
    puzzleName: 'Codes secrets',
    color: '#FF4FD8',
    letter: 'A',
    bg: 'city',
    fx: 'motes',
    arrive: [
      ['bip', "Regarde tous ces gens avec leurs casques… Ils ne nous voient même pas."],
      ['hero', "On va les réveiller. Tous. Je te le promets."],
    ],
    taunt: [
      ['foe', "Dooors… doooors… Je suis HYPNOS. Tous mes messages sont codés."],
      ['foe', "Personne ne peut les lire… Laisse-toi aller… Mets un casque, toi aussi…"],
    ],
    tip: [
      ['bip', "Ne l'écoute pas ! Pour décoder, sers-toi de l'alphabet affiché et compte bien les lettres."],
    ],
    freed: [
      ['foe', "Ooh… Tout est si clair, d'un coup ! Je n'ai plus sommeil du tout !"],
      ['foe', "Tiens, ce fragment est à toi. Et… désolé pour les casques."],
    ],
    after: [
      ['bip', "Trois fragments ! La moitié du chemin ! Maintenant… on entre dans la mémoire d'OMÉGA."],
    ],
  },
  {
    id: 'labyrinthe',
    name: 'Le Labyrinthe de Données',
    robot: 'labyrinthor',
    robotName: 'LABYRINTHOR',
    puzzle: 'maze',
    puzzleName: 'Programmes',
    color: '#35F2FF',
    letter: 'E',
    bg: 'maze',
    fx: 'binary',
    arrive: [
      ['bip', "Nous sommes à l'intérieur de la mémoire d'OMÉGA. Tout ici est fait de données !"],
    ],
    taunt: [
      ['foe', "MEUUUH-RREUR SYSTÈME ! PERSONNE NE SORT DE MON LABYRINTHE."],
      ['foe', "PROGRAMME TON DRONE… SI TU EN ES CAPABLE !"],
    ],
    tip: [
      ['bip', "Suis chaque programme case par case, avec ton doigt si tu veux. Attention aux pare-feux rouges : on ne peut pas les traverser !"],
    ],
    freed: [
      ['foe', "Meuh ? Je vois la sortie ! Pour la première fois, je vois la sortie !"],
      ['foe', "Prends ce fragment, petit programmeur. Tu l'as bien mérité."],
    ],
    after: [
      ['bip', "Quatre fragments ! Attention, la tour de surveillance est droit devant."],
    ],
  },
  {
    id: 'tour',
    name: 'La Tour de Contrôle',
    robot: 'sentinelle',
    robotName: 'SENTINELLE',
    puzzle: 'logic',
    puzzleName: 'Déductions',
    color: '#FF4D6D',
    letter: 'M',
    bg: 'tower',
    fx: 'rain',
    arrive: [
      ['bip', "La tour de surveillance… OMÉGA voit tout d'ici. Reste bien caché derrière moi !"],
      ['hero', "Euh, Bip… tu fais vingt centimètres."],
    ],
    taunt: [
      ['foe', "JE VOIS TOUT. JE SAIS TOUT. J'ENTENDS TOUT."],
      ['foe', "MAIS TOI, SAURAS-TU DÉMÊLER LE VRAI DU FAUX ?"],
    ],
    tip: [
      ['bip', "Astuce de détective : teste chaque possibilité, une par une. Une seule marche avec tous les indices !"],
    ],
    freed: [
      ['foe', "Mon œil… Je vois enfin les couleurs du monde ! Le vert… j'adore le vert !"],
      ['foe', "Ce fragment t'appartient. OMÉGA t'attend en haut de la tour. Sois prudent."],
    ],
    after: [
      ['bip', "Cinq fragments ! Il ne reste que la centrale électrique qui alimente OMÉGA."],
    ],
  },
  {
    id: 'centrale',
    name: 'La Centrale Électrique',
    robot: 'voltar',
    robotName: 'VOLTAR',
    puzzle: 'equation',
    puzzleName: 'Équations',
    color: '#5CA8FF',
    letter: 'I',
    bg: 'power',
    fx: 'sparks',
    arrive: [
      ['bip', "La centrale qui alimente OMÉGA ! Si on la passe, la tour est juste derrière !"],
    ],
    taunt: [
      ['foe', "BZZZT ! VOLTAR, CENT MILLE VOLTS ! MES SYMBOLES CACHENT DES NOMBRES."],
      ['foe', "TROUVE-LES… OU PRENDS LA DÉCHARGE DE TA VIE ! BZZT !"],
    ],
    tip: [
      ['bip', "Commence par l'équation qui n'a qu'un seul symbole. Une fois que tu connais sa valeur, remplace-le dans les autres !"],
    ],
    freed: [
      ['foe', "Bzz… bzz… Ça chatouille ! J'ai de l'énergie pour moi tout seul !"],
      ['foe', "Voici le dernier fragment. Va, {name}. Le monde compte sur toi."],
    ],
    after: [
      ['bip', "Les six fragments ! {name}… il est temps d'affronter OMÉGA."],
    ],
  },
];

export const BOSS = {
  name: 'OMÉGA',
  color: '#FF2D55',
  word: 'AMITIE',
  arrive: [
    ['bip', "On y est… Le sommet de la tour. Je sens ses circuits partout autour de nous."],
    ['bip', "Grâce aux six fragments, on peut briser ses six boucliers. Un par énigme !"],
  ],
  taunt: [
    ['omega', "AH. {NAME}. JE T'OBSERVE DEPUIS LE DÉBUT. TU AS LIBÉRÉ MES ROBOTS. INTÉRESSANT."],
    ['omega', "MAIS MOI, JE CALCULE UN MILLIARD DE CHOSES PAR SECONDE. JE SUIS PARFAITE."],
    ['omega', "TU N'AS AUCUNE CHANCE. PERSONNE N'A JAMAIS RÉSOLU MES ÉNIGMES."],
  ],
  tip: [
    ['hero', "Il y a toujours une première fois."],
    ['bip', "Chaque énigme reprend l'épreuve d'un robot libéré. Tu les connais toutes : tu peux le faire !"],
  ],
  lastStand: [
    ['omega', "IMPOSSIBLE… MES BOUCLIERS… TOUS DÉTRUITS ?"],
    ['omega', "IL ME RESTE MON CŒUR DE CODE. IL EST PROTÉGÉ PAR UN MOT… UN MOT QUE MÊME MOI JE N'AI JAMAIS COMPRIS."],
    ['bip', "{name} ! Les six fragments ! Ils forment ce mot ! Remets les lettres dans le bon ordre !"],
  ],
  win: [
    ['omega', "A… M… I… T… I… É…"],
    ['omega', "Je… je comprends. Ce n'est pas un calcul. C'est… un lien. Comme entre toi et ce petit robot."],
    ['omega', "J'ai voulu tout contrôler pour protéger les humains. Mais on ne protège pas quelqu'un en l'empêchant de penser."],
    ['omega', "Je libère les humains. Tous. Merci, {name}… Peut-être pourrons-nous être amis, nous aussi ?"],
    ['bip', "TU L'AS FAIT !!! {name}, TU AS SAUVÉ LE MONDE !"],
  ],
  lose: [
    ['omega', "PRÉVISIBLE. RÉINITIALISATION DE MES BOUCLIERS…"],
    ['bip', "Je t'ai mis à l'abri juste à temps ! Respire… On recommence, tu vas y arriver !"],
  ],
};
