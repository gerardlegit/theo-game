// ============================================================================
// NIVEAU 5 — LES PREMIÈRES VILLES
//
// Il y a 6 000 ans, les humains entrent dans l'Antiquité. On retrouve le
// village du niveau 4… mais il a bien changé : la palissade est devenue un
// haut rempart de pierre, le village est carré, les maisons sont en pierre
// avec des toits de chaume, et au milieu, il y a un marché. Tout autour : des
// champs, des parcs à cochons, à vaches et à moutons. Plus loin, quatre autres
// villages (au nord, au sud, à l'est, à l'ouest) : amis… ou ennemis ?
// Le monde est en VUE DE TROIS QUARTS (world.view = 'tqv', voir tqv.js) ; la
// ville, le fleuve, les villages, le marché, le monument, les ouvriers et les
// bateaux sont dans villes.js (world.city), leurs dessins dans art-villes.js.
//   1. Le pont de pierre : tailler la pierre, construire un pont sur le fleuve
//      et une route jusqu'au village ami de l'Ouest.
//   2. Les échanges : vendre son blé et sa laine, gagner l'amitié du village
//      et de l'argent.
//   3. L'écriture : faire les comptes sur des tablettes, construire des écoles,
//      trouver un autre village ami (deux villages sur quatre sont hostiles !).
//   4. Les grands plans : inventer les mathématiques et les plans, choisir la
//      forme du grand monument, se lier d'amitié avec les deux villages amis.
//   5. Le grand chantier : embaucher des ouvriers, faire venir des bateaux de
//      pierres… et finir le monument que les touristes visiteront 2 000 ans
//      plus tard.
// On gagne des idées 💡 pour inventer, et des pièces d'argent pour payer.
// Le moteur (script.js, tqv.js, villes.js) ne connaît aucune espèce par son nom.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La grande plaine : le fleuve à l'ouest, la ville au milieu, quatre villages autour */
const world = {
  view: 'tqv',
  ground: 'land',
  w: 14000,
  h: 11000,
  start: { x: 7000, y: 5930 },
  village: { x: 7000, y: 5600 },
  villageR: 1150,                   // (pour les bêtes sauvages : elles restent loin de la ville)
  noGrow: true,
  noEat: true,                      // on ne mange pas les animaux : on invente, on construit, on échange
  maxChasers: 4,
  noise: 460,
  penalty: { adn: 0, growth: 0 },   // (attrapé par les soldats : ils prennent des pièces, voir city.steal)
  currency: {
    icon: '💡', name: 'idées', verb: 'Inventer', order: 'Invente', many: 'inventions', later: 'Plus tard',
    tag: 'Nouvelle invention !', sub: 'Choisis ce que ta ville va inventer :', stat: 'inventions',
  },
  res: [
    { id: 'pierre', name: 'Pierre' },
    { id: 'bois', name: 'Bois' },
    { id: 'ble', name: 'Blé' },
    { id: 'laine', name: 'Laine' },
    { id: 'argent', name: "Pièces d'argent" },
  ],
  land: {
    riverX: 4300, riverW: 360, riverBlock: true,  // le grand fleuve : on ne le traverse qu'en bateau… ou sur un pont
    noCave: true, irrigated: true, growTime: 40,  // (la grotte a disparu ; les champs sont arrosés par les canaux, le blé met 40 s à pousser)
    forests: 30, rocks: 60, flint: 0, ochre: 0, wheat: 0, bushes: 700, woodNear: 16,
    loneTrees: 320, borderTrees: 420, reeds: 200, flowers: 420, decals: 4200,
  },
  // (villes.js) la ville carrée, ses remparts, le marché, et tout ce qu'il y a autour
  city: {
    half: 1000,                      // le demi-côté des remparts
    gateW: 210,                      // la largeur des quatre portes
    quarry: [2200, -900], stones: 9, // la carrière de pierre (à l'est), et ses tas de pierres taillées
    wool: 4,                         // les balles de laine, près du parc à moutons
    monument: [1700, 2500],          // le grand chantier (au sud-est)
    port: 1800,                      // le port, sur le fleuve (à cette hauteur sous la ville)
    yard: [880, 2560],               // la cabane du chef de chantier (on y embauche les ouvriers)
    // les quatre villages : l'Ouest est toujours ami ; parmi les trois autres, un seul l'est (au hasard)
    towns: [
      { id: 'ouest', name: "le village de l'Ouest", at: [-4600, 150], friend: true, fav: 'ble', col: '#3A6AC8', people: 'les pêcheurs' },
      { id: 'nord', name: 'le village du Nord', at: [200, -4200], col: '#3A9A5A' },
      { id: 'est', name: "le village de l'Est", at: [4700, -200], col: '#C88A2A' },
      { id: 'sud', name: 'le village du Sud', at: [-300, 4100], col: '#8A4AB8' },
    ],
    friends: 1,                      // (parmi nord, est, sud) combien sont amis
    friendFav: 'laine',              // ce que préfère acheter le deuxième village ami
    reveal: 1500, aggro: 1100, leash: 1700, guards: 4,
    price: 2, favBonus: 1, friendGain: 0.035, meetGain: 0.1,
    caravan: { every: 45, gain: 6, need: 'roue', friend: 0.5 },
    worker: { cost: 60, rate: 0.0012 }, boat: { cost: 45, pierre: 50, bois: 12, sail: 16 },
    needs: { pierre: 300, bois: 60 },  // ce que coûte tout le monument
    steal: 0.3,                       // la part de tes pièces que prennent les soldats quand ils t'attrapent
  },
  // ce qu'on peut construire, et où (par rapport au marché, au centre de la ville) ;
  // built = déjà là au début du niveau (les champs, les parcs des animaux)
  sites: [
    // les parcs des animaux (des enclos : les bêtes restent dedans)
    { id: 'parc-cochons', type: 'enclos', name: 'Le parc à cochons', ch: 1, at: [-650, -1520], r: 280, gate: Math.PI / 2, built: true },
    { id: 'parc-vaches', type: 'enclos', name: 'Le parc à vaches', ch: 1, at: [650, -1520], r: 300, gate: Math.PI / 2, built: true },
    { id: 'parc-moutons', type: 'enclos', name: 'Le parc à moutons', ch: 1, at: [1560, 880], r: 280, gate: Math.PI, built: true },
    // les champs de blé (ils poussent tout seuls : on récolte quand ils sont mûrs)
    { id: 'champ-1', type: 'champ', name: 'Un champ', ch: 1, at: [-1360, -720], built: true },
    { id: 'champ-2', type: 'champ', name: 'Un champ', ch: 1, at: [-1660, -720], built: true },
    { id: 'champ-3', type: 'champ', name: 'Un champ', ch: 1, at: [-1360, -420], built: true },
    { id: 'champ-4', type: 'champ', name: 'Un champ', ch: 1, at: [-1660, -420], built: true },
    { id: 'champ-5', type: 'champ', name: 'Un champ', ch: 1, at: [-1360, 420], built: true },
    { id: 'champ-6', type: 'champ', name: 'Un champ', ch: 1, at: [-1660, 420], built: true },
    { id: 'champ-7', type: 'champ', name: 'Un champ', ch: 1, at: [-1360, 720], built: true },
    { id: 'champ-8', type: 'champ', name: 'Un champ', ch: 1, at: [-1660, 720], built: true },
    // (chapitre 1) le pont, et la route pavée jusqu'au village de l'Ouest (villes.js la découpe en morceaux)
    { id: 'pont', type: 'pont', name: 'Le pont de pierre', ch: 1, need: 'arche', cost: { pierre: 25, bois: 12 }, planR: 150, adn: 30 },
    { id: 'route', type: 'route', name: 'La route pavée', ch: 1, to: 'ouest', step: 250, cost: { pierre: 4 }, planR: 130, adn: 6 },
    // (chapitre 3) les écoles, où les enfants apprennent à écrire
    { id: 'ecole-1', type: 'ecole', name: 'Une école', ch: 3, at: [520, -500], need: 'ecriture', cost: { pierre: 15, bois: 10, argent: 30 }, planR: 130, adn: 25 },
    { id: 'ecole-2', type: 'ecole', name: 'Une école', ch: 3, at: [-540, 520], need: 'ecriture', cost: { pierre: 15, bois: 10, argent: 30 }, planR: 130, adn: 25 },
    // (chapitre 4) les fondations du monument (une fois sa forme choisie)
    { id: 'fondations', type: 'fondations', name: 'Les fondations du monument', ch: 4, at: [1700, 2500], need: 'plans', cost: { pierre: 40, bois: 20, argent: 120 }, planR: 260, adn: 40 },
    // (chapitre 5) le port, où arrivent les bateaux
    { id: 'port', type: 'port', name: 'Le port', ch: 5, need: 'voile', cost: { pierre: 25, bois: 25 }, planR: 140, adn: 30 },
  ],
  decor: [],
};

/* Les êtres vivants (kind 'tribu' = les gens de ta ville ; 'habitant' = ceux des autres villages ;
   le soldat est un chasseur : il te poursuit si tu t'approches d'un village hostile ; tag = l'étiquette de sa fiche) */
const species = {
  /* ---- Ta ville ---- */
  citadin: {
    name: 'Les habitants de ta ville', plural: 'habitants', kind: 'tribu', look: 'th-citadin', color: '#C2A878', noEat: true, tag: '🏛️ Ta ville',
    size: 26, speed: 80, sense: 0, adn: 0,
    fact: "Dans les premières villes vivaient des milliers de personnes. Il y avait des paysans, des potiers, des tisserands, des marchands… et chacun avait son métier.",
  },
  /* ---- Les autres villages ---- */
  habitant: {
    name: 'Habitant d’un village ami', plural: 'habitants', kind: 'habitant', look: 'th-habitant', color: '#B89A6A', noEat: true, tag: '🤝 Un ami',
    size: 26, speed: 70, sense: 0, adn: 0,
    fact: "Les villages voisins échangeaient ce qu'ils avaient en trop : du blé contre du poisson, de la laine contre des poteries… C'est le début du commerce !",
  },
  soldat: {
    name: 'Soldat ennemi', plural: 'soldats ennemis', kind: 'hunter', look: 'th-soldat', color: '#8A3A2A', noEat: true, tag: '⚠️ Hostile !', hurt: 'Halte !',
    size: 32, speed: 228, sense: 900, adn: 0, steals: true, fierce: true,
    fact: "Les villages se disputaient parfois les champs, l'eau ou les troupeaux. Leurs soldats avaient des lances, des boucliers… et des casques de bronze !",
  },
  /* ---- Les animaux de la ferme (dans leurs parcs) ---- */
  cochon: {
    name: 'Cochon', plural: 'cochons', kind: 'flock', look: 'th-cochon', color: '#F2B4A8', noEat: true, tag: '🐷 La ferme',
    size: 30, speed: 140, sense: 150, adn: 0,
    fact: "Le cochon descend du sanglier. Les humains l'élèvent depuis 9 000 ans : il mange presque de tout, même les restes des repas !",
  },
  vache: {
    name: 'Vache', plural: 'vaches', kind: 'flock', look: 'th-vache', color: '#F4EEE2', noEat: true, tag: '🐄 La ferme',
    size: 46, speed: 120, sense: 150, adn: 0,
    fact: "La vache descend de l'aurochs, un bœuf sauvage géant. Elle donne du lait, et les bœufs tirent les charrues et les charrettes.",
  },
  mouton: {
    name: 'Mouton', plural: 'moutons', kind: 'flock', look: 'th-mouton', color: '#E8E2D4', noEat: true, tag: '🐑 La ferme',
    size: 34, speed: 150, sense: 150, adn: 0,
    fact: "On tond les moutons une fois par an. Avec leur laine, on file du fil, puis on tisse des tissus bien chauds.",
  },
  /* ---- Les bêtes sauvages de la plaine ---- */
  cheval: {
    name: 'Cheval sauvage', plural: 'chevaux sauvages', kind: 'neutral', look: 'th-cheval', color: '#9A6A3A', noEat: true,
    size: 56, speed: 260, sense: 300, adn: 0,
    fact: "Les humains ont apprivoisé le cheval il y a environ 5 500 ans, dans les grandes steppes. Ensuite, on a pu voyager bien plus vite !",
  },
  cerf: {
    name: 'Cerf', plural: 'cerfs', kind: 'prey', look: 'th-cerf', color: '#A8783E', noEat: true,
    size: 54, speed: 250, sense: 340, adn: 0,
    fact: "Le cerf perd ses bois chaque année, et il en repousse de plus grands.",
  },
  corbeau: {
    name: 'Corbeau', plural: 'corbeaux', kind: 'neutral', look: 'th-corbeau', color: '#24242C', flying: true, noEat: true,
    size: 18, speed: 160, sense: 0, adn: 0,
    fact: "Les corbeaux suivent les humains depuis toujours : ils mangent les graines tombées dans les champs.",
  },
};

/* Les inventions : deux par époque. Elles se voient sur le joueur (le marteau, la balance, la tablette…) */
const evolutions = {
  bronze: {
    name: 'Les outils de bronze', ch: 1, cost: 20, effect: { gather: 1.7 },
    short: 'Un marteau et un ciseau de bronze : tu tailles la pierre bien plus vite',
    fact: "En mélangeant du cuivre et un peu d'étain fondus dans un four très chaud, on obtient le bronze : un métal dur, parfait pour les outils. C'est l'âge du bronze !",
  },
  arche: {
    name: "L'arche de pierre", ch: 1, cost: 45, effect: {},
    short: 'Des pierres taillées qui se tiennent en arc : tu sais construire un pont',
    fact: "Dans une arche, chaque pierre pousse sur sa voisine : tout tient sans colle ! Les ponts en arche des Romains sont encore debout, 2 000 ans plus tard.",
  },
  balance: {
    name: 'La balance', ch: 2, cost: 35, effect: {},
    short: 'Tu pèses les marchandises : tu peux échanger avec les autres villages',
    fact: "Avant les pièces de monnaie, on payait avec des morceaux d'argent ou de cuivre… qu'on pesait sur une balance ! Les vraies pièces sont arrivées bien plus tard.",
  },
  roue: {
    name: 'La roue', ch: 2, cost: 60, effect: {},
    short: 'Des charrettes : les marchands des villages amis viennent vendre au marché',
    fact: "La roue a été inventée il y a environ 5 500 ans. D'abord pour les potiers, puis pour les charrettes tirées par des bœufs.",
  },
  ecriture: {
    name: "L'écriture", ch: 3, cost: 60, effect: {},
    short: 'Tu notes les comptes sur des tablettes d’argile : chaque échange rapporte plus',
    fact: "L'écriture a été inventée il y a environ 5 300 ans, en Mésopotamie, pour compter les sacs de blé et les moutons ! On écrivait avec un roseau taillé, sur des tablettes d'argile.",
  },
  bouclier: {
    name: 'Le bouclier de bronze', ch: 3, cost: 50, effect: { shield: 1 },
    short: 'Un bouclier : un soldat ennemi peut te toucher une fois sans t’attraper',
    fact: "Les soldats de l'Antiquité se protégeaient avec un bouclier, un casque et parfois une cuirasse en bronze.",
  },
  mathematiques: {
    name: 'Les mathématiques', ch: 4, cost: 70, effect: {},
    short: 'Tu sais compter, mesurer et calculer : les échanges rapportent encore plus',
    fact: "Les Mésopotamiens comptaient par paquets de 60 : c'est pour cela qu'il y a 60 minutes dans une heure ! Les Égyptiens savaient calculer la surface d'un champ.",
  },
  plans: {
    name: 'Les plans', ch: 4, cost: 90, effect: {},
    short: 'Tu dessines le plan du grand monument : tu peux choisir sa forme',
    fact: "Avant de construire, les architectes dessinaient des plans, et mesuraient tout avec des cordes à nœuds, des équerres et des règles.",
  },
  voile: {
    name: 'La voile', ch: 5, cost: 70, effect: {},
    short: 'Des bateaux à voile : ils apportent les pierres par le fleuve',
    fact: "Les Égyptiens transportaient les énormes blocs de pierre sur des bateaux, le long du Nil. Le vent dans la voile les poussait… sans ramer !",
  },
  levier: {
    name: 'Le levier et la rampe', ch: 5, cost: 90, effect: {},
    short: 'Avec des leviers et des rampes, tes ouvriers montent les blocs bien plus vite',
    fact: "Un levier, c'est une longue barre : avec lui, on soulève un bloc bien trop lourd pour nos bras. Et pour monter les blocs tout en haut, on les faisait glisser sur des rampes.",
  },
};

/* Les couleurs de la plaine à chaque époque */
const PRINTEMPS = { floor: '#82A650', motes: 'rgba(255, 250, 210, 0.5)', water: '#3E8EB8', bank: '#7A8A4A', sand: '#C9B07A', dirt: 'rgba(160, 130, 85, 0.6)', leaf: ['#2E5E2A', '#3E7A34', '#5E9A44'], rock: '#9A928A', bush: ['#3A6A32', '#4E8238', '#6A9A44'], tallGrass: ['#6A8A3A', '#8AA048'], thatch: '#D2B060', flowers: ['#F2E25A', '#FFFFFF', '#E86A9A', '#8A6AD8'] };
const ETE = { floor: '#8CA852', motes: 'rgba(255, 250, 210, 0.5)', water: '#3A88B4', bank: '#7A8A4A', sand: '#D2B87A', dirt: 'rgba(170, 135, 85, 0.65)', leaf: ['#3A6A2A', '#4E8A34', '#6EA644'], rock: '#9A928A', bush: ['#3E6A30', '#527E38', '#6E9A44'], tallGrass: ['#7A903A', '#9AA84A'], thatch: '#D8B864', flowers: ['#F2C24A', '#E8443A', '#FFFFFF', '#5A8AE8'] };
const AUTOMNE = { floor: '#8E9A4E', motes: 'rgba(255, 230, 180, 0.5)', water: '#3E7EA8', bank: '#7A7A48', sand: '#C8AC74', dirt: 'rgba(160, 120, 80, 0.65)', leaf: ['#7A6A2A', '#A8742E', '#5E7A34'], rock: '#948A80', bush: ['#6A6A32', '#8A7A3A', '#5E7A38'], tallGrass: ['#9A8A42', '#B0984A'], thatch: '#C9A458', flowers: ['#E8A040', '#C85A3A', '#F2E2B0'] };
const SOLEIL = { floor: '#9AA65A', motes: 'rgba(255, 240, 200, 0.55)', water: '#4A92BC', bank: '#8A8A52', sand: '#DCC488', dirt: 'rgba(180, 145, 95, 0.65)', leaf: ['#3E6A2C', '#527E34', '#6E9640'], rock: '#A8A096', bush: ['#4A6E34', '#5E823C', '#78984A'], tallGrass: ['#8E9A44', '#AAB050'], thatch: '#DCBC6A', flowers: ['#F2D24A', '#F28A3A', '#FFFFFF', '#E86A9A'] };

/* La lance : le pouvoir du joueur (touche F) : elle fait reculer les soldats ennemis */
const LANCE = { type: 'lance', name: 'Lancer', icon: '🎯', recharge: 1.2, range: 0, cry: 'HOP !' };
const PEUPLE = { citadin: 14, cheval: 3, cerf: 3, corbeau: 4 };
const PARCS = [
  { species: 'cochon', n: 6, pen: 'parc-cochons' },
  { species: 'vache', n: 5, pen: 'parc-vaches' },
  { species: 'mouton', n: 7, pen: 'parc-moutons' },
];

/* L'histoire, en cinq grandes inventions */
const chapters = [
  {
    title: 'Le pont de pierre',
    ago: [0.006, 0.0056],
    form: 'th-batisseur',
    skin: { body: '#C2A878', belly: '#A8885A', dark: '#5A4020', tone: '#B07A52', hair: '#2A1C14' },
    size: [30, 30],
    zoom: 0.85,
    power: { ...LANCE, intro: "Ta lance est prête : appuie sur F (ou sur le bouton orange). Elle fait reculer ceux qui t'attaquent… On ne sait jamais !" },
    vision: 1.3,
    palette: PRINTEMPS,
    penned: PARCS,
    species: PEUPLE,
    unlock: ['bronze', 'arche'],
    intro: "Il y a 6 000 ans. Ton village est devenu une ville, avec des remparts de pierre et un grand marché ! De l'autre côté du fleuve, il y a le village de l'Ouest : ses habitants sont des amis. Pour aller les voir, il faut un pont. Taille des pierres à la carrière, invente l'arche, construis un pont de pierre… puis une route pavée jusqu'à chez eux !",
    missions: [
      { type: 'gather', res: 'pierre', n: 12, text: 'Taille 12 pierres à la carrière, à l’est de la ville' },
      { type: 'evolve', part: 'bronze' },
      { type: 'evolve', part: 'arche' },
      { type: 'build', what: 'pont', n: 1, img: 'pierre', text: 'Construis un pont de pierre sur le fleuve' },
      { type: 'build', what: 'route', n: 0, img: 'pierre', text: 'Pave la route jusqu’au village de l’Ouest' },
      { type: 'meet', town: 'ouest', n: 1, text: 'Va rencontrer le village de l’Ouest' },
    ],
    tips: [
      "La carrière est à l'est de la ville : touche les tas de pierres pour les tailler. Chaque pierre te donne une idée 💡.",
      "Pour sortir de la ville, passe par une des quatre portes des remparts.",
      "Le fleuve est trop large et trop profond : on ne peut le traverser que sur un pont !",
      "La route est faite de morceaux : arrête-toi sur chaque plan en pointillés pour le paver.",
      "Sur une route pavée, on marche bien plus vite !",
    ],
  },
  {
    title: 'Les échanges',
    ago: [0.0056, 0.0053],
    form: 'th-marchand',
    skin: { body: '#3A6AC8', belly: '#2A4E98', dark: '#1E2A50', tone: '#C68A5A', hair: '#2A1C14' },
    size: [30, 30],
    zoom: 0.85,
    power: LANCE,
    vision: 1.3,
    palette: ETE,
    penned: PARCS,
    species: PEUPLE,
    unlock: ['balance', 'roue'],
    intro: "Il y a 5 500 ans. Le village de l'Ouest n'a pas de champs : ses habitants sont des pêcheurs. Ils ont besoin de blé… et toi, tu as besoin d'argent ! Récolte le blé de tes champs et la laine de tes moutons, invente la balance, et va vendre tout ça au marché du village de l'Ouest. Plus tu échanges, plus ils deviennent tes amis !",
    missions: [
      { type: 'evolve', part: 'balance' },
      { type: 'trade', town: 'ouest', n: 20, text: 'Vends 20 marchandises au village de l’Ouest' },
      { type: 'evolve', part: 'roue' },
      { type: 'friend', town: 'ouest', n: 1, pct: 100, text: 'Amitié du village de l’Ouest : 100 %' },
      { type: 'money', n: 120, text: 'Gagne 120 pièces d’argent' },
    ],
    tips: [
      "Le blé mûr est doré : arrête-toi dans un champ pour le récolter. Il repousse tout seul !",
      "Les balles de laine sont à côté du parc à moutons, à l'est de la ville.",
      "Au village de l'Ouest, arrête-toi devant l'étal du marché : tu vends tout seul.",
      "Le village de l'Ouest préfère le blé : il le paie plus cher que la laine.",
      "Avec la roue, des charrettes de marchands viendront vendre à ton marché : ça rapporte aussi des pièces !",
    ],
  },
  {
    title: "L'écriture",
    ago: [0.0053, 0.005],
    form: 'th-scribe',
    skin: { body: '#F2EEE4', belly: '#D8D0BE', dark: '#5A5040', tone: '#B07A52', hair: '#1C1411' },
    size: [30, 30],
    zoom: 0.85,
    power: LANCE,
    vision: 1.35,
    palette: AUTOMNE,
    penned: PARCS,
    species: PEUPLE,
    unlock: ['ecriture', 'bouclier'],
    intro: "Il y a 5 300 ans. Tant d'échanges… qui doit combien à qui ? On ne s'y retrouve plus ! Invente l'écriture pour noter les comptes sur des tablettes d'argile, et construis des écoles pour l'apprendre aux enfants. Puis trouve un autre village ami. Mais attention : sur les trois autres villages, deux sont hostiles. Leurs soldats t'attaqueront si tu t'approches !",
    missions: [
      { type: 'evolve', part: 'ecriture' },
      { type: 'build', what: 'ecole', n: 2, img: 'pierre', text: 'Construis 2 écoles dans ta ville' },
      { type: 'meet', n: 2, text: 'Trouve un deuxième village ami (attention aux villages hostiles !)' },
      { type: 'evolve', part: 'bouclier' },
      { type: 'trade', n: 12, text: 'Note 12 échanges sur des tablettes d’argile' },
      { type: 'friend', n: 2, pct: 50, text: 'Amitié de 2 villages : 50 %' },
    ],
    tips: [
      "Les villages du Nord, de l'Est et du Sud sont loin. Un seul est ami… mais lequel ?",
      "Un village hostile ? Ses soldats foncent sur toi : sauve-toi vite, ou lance ta lance (F) !",
      "S'ils t'attrapent, les soldats te prennent des pièces et te ramènent à ta ville.",
      "Chaque échange est noté sur une tablette d'argile : avec l'écriture, il rapporte une pièce de plus.",
      "Les écoles se construisent dans ta ville : suis les pointillés. Il faut aussi payer les maîtres : 30 pièces par école.",
    ],
  },
  {
    title: 'Les grands plans',
    ago: [0.0048, 0.0046],
    form: 'th-architecte',
    skin: { body: '#C8302A', belly: '#9A2A22', dark: '#4A1A10', tone: '#C68A5A', hair: '#2A1C14' },
    size: [30, 30],
    zoom: 0.76,
    power: LANCE,
    vision: 1.35,
    palette: SOLEIL,
    penned: PARCS,
    species: PEUPLE,
    unlock: ['mathematiques', 'plans'],
    intro: "Il y a 4 800 ans. Ta ville est riche et puissante. Et si elle construisait quelque chose d'immense, que tout le monde verrait de très loin ? Pour cela, il faut savoir compter, mesurer, calculer : invente les mathématiques, puis les plans. Tu choisiras la forme du grand monument ! Mais un tel chantier coûtera très cher : deviens le meilleur ami des deux villages amis, et mets beaucoup d'argent de côté.",
    missions: [
      { type: 'evolve', part: 'mathematiques' },
      { type: 'evolve', part: 'plans' },
      { type: 'choose', text: 'Choisis la forme du grand monument' },
      { type: 'build', what: 'fondations', n: 1, img: 'pierre', text: 'Pose les fondations du monument' },
      { type: 'friend', n: 2, pct: 100, text: 'Amitié des 2 villages amis : 100 %' },
      { type: 'money', n: 300, have: true, text: 'Mets 300 pièces de côté pour le grand chantier' },
    ],
    tips: [
      "Le grand chantier est au sud-est de la ville : va voir le plan en pointillés. Les fondations coûtent 120 pièces : garde de l'argent !",
      "Avec les mathématiques, chaque échange rapporte encore une pièce de plus.",
      "Les charrettes des marchands rapportent des pièces même quand tu n'es pas là !",
      "Chaque village a sa marchandise préférée : il la paie plus cher.",
    ],
  },
  {
    title: 'Le grand chantier',
    ago: [0.0046, 0.0044],
    form: 'th-pharaon',
    skin: { body: '#F2EEE4', belly: '#E8C05A', dark: '#5A4020', tone: '#B07A52', hair: '#1C1411' },
    size: [30, 30],
    zoom: 0.68,
    power: LANCE,
    vision: 1.4,
    palette: SOLEIL,
    penned: PARCS,
    species: PEUPLE,
    unlock: ['voile', 'levier'],
    intro: "Il y a 4 600 ans. C'est le moment ! Pour bâtir le grand monument, il faut des ouvriers (et ils coûtent très cher), et des montagnes de pierres. Invente la voile et construis un port : des bateaux apporteront les pierres par le fleuve. Embauche des ouvriers à la cabane du chantier… et termine le monument qui restera dans l'Histoire !",
    missions: [
      { type: 'evolve', part: 'voile' },
      { type: 'build', what: 'port', n: 1, img: 'bois', text: 'Construis le port, au bord du fleuve' },
      { type: 'hire', n: 6, text: 'Embauche 6 ouvriers (60 pièces chacun)' },
      { type: 'boat', n: 5, text: 'Fais venir 5 bateaux chargés de pierres (45 pièces chacun)' },
      { type: 'evolve', part: 'levier' },
      { type: 'monument', n: 100, text: 'Termine le grand monument !' },
    ],
    tips: [
      "Au port, arrête-toi sur le quai pour commander un bateau de pierres (45 pièces).",
      "À la cabane du chantier, arrête-toi pour embaucher un ouvrier (60 pièces).",
      "Le monument a besoin de 300 pierres et de 60 bois. Tu peux aussi apporter les tiens : approche-toi du chantier.",
      "Plus il y a d'ouvriers, plus le monument monte vite. Mais sans pierres, ils ne peuvent rien faire !",
      "Plus d'argent ? Va vendre du blé et de la laine dans les villages amis.",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau (ces phrases remplacent celles de data.js) */
const lines = {
  start: "Bloub ! Te voilà dans ta ville… elle est devenue magnifique ! Va tailler des pierres à la carrière, à l'est : il faut construire un pont.",
  eaten: [
    "Aïe ! Les soldats t'ont attrapé… Ils t'ont pris des pièces et t'ont ramené chez toi.",
    "Attrapé ! Ce village est hostile : ne t'en approche plus sans ta lance.",
    "Ouille ! La prochaine fois, sauve-toi dès que tu vois les soldats !",
  ],
  resume: [
    "Bloub ! Te revoilà ! Ta ville t'attendait.",
    "Re-bonjour ! On continue à bâtir ?",
  ],
  spotted: [
    "Attention, des soldats ! Sauve-toi, ou lance ta lance (F) !",
    "Ils t'ont vu ! Cours vers ta ville !",
  ],
  hidden: [
    "Chut… Dans les hautes herbes, ils ne te voient plus.",
  ],
  idle: [
    "Tu dors ? Il y a des pierres à tailler et des choses à construire !",
    "Allez ! Ta ville compte sur toi.",
  ],
  jokes: [
    "Tu sais quoi ? La Grande Pyramide est faite de plus de 2 millions de blocs de pierre. Heureusement, ici, il en faut moins !",
    "Les premières écoles s'appelaient « les maisons des tablettes ». Les élèves y recopiaient des listes de mots !",
    "Moi, Ammo, je n'ai jamais su compter jusqu'à 60. Mais je te fais confiance !",
    "Avec l'écriture, la Préhistoire est finie : c'est le début de l'Histoire !",
    "Les marchands de l'Antiquité voyageaient très loin : certains traversaient des déserts entiers avec leurs ânes.",
  ],
  canEvolve: "Tu as assez d'idées pour inventer quelque chose ! Appuie sur 💡 Inventer.",
  chapterDone: "Ta ville a réussi « {t} ». Mais les humains n'arrêtent jamais d'inventer… Les siècles passent, et ta ville grandit encore !",
  // ramasser, construire
  gather_pierre: "Une pierre taillée ! Avec des blocs bien carrés, on construit des murs solides.",
  gather_bois: "Du bois ! Il en faut pour les échafaudages, les toits… et les bateaux.",
  gather_laine: "De la laine de mouton ! Les villages voisins en font des tissus.",
  needInvent: "Pour construire ça, il faut d'abord inventer : {x}. Appuie sur 💡 Inventer !",
  missing: "Il te manque quelque chose : regarde l'étiquette du plan, et suis la flèche pour le trouver.",
  built_pont: "Le pont de pierre est debout ! Ses arches tiennent toutes seules. Maintenant, pave la route jusqu'au village de l'Ouest.",
  built_route: "Un morceau de route pavée ! Continue jusqu'au village de l'Ouest.",
  roadDone: "La route est finie, de ta ville jusqu'au village de l'Ouest ! Va vite leur dire bonjour.",
  built_ecole: "Une école ! Les enfants y apprennent à écrire sur des tablettes d'argile.",
  built_fondations: "Les fondations sont posées ! Le monument montera ici… au prochain chapitre.",
  built_port: "Le port est prêt ! Arrête-toi sur le quai pour commander un bateau de pierres.",
  // les champs
  ripe: "Le blé est mûr dans les champs ! Arrête-toi dedans pour le récolter : les villages amis l'achètent.",
  harvest: "Belle récolte ! Le blé, on peut le vendre au marché des villages amis.",
  // le fleuve, les routes
  river: "Le fleuve est bien trop large et trop profond pour le traverser à la nage. Il faut un pont !",
  road: "Sur la route pavée, on marche bien plus vite !",
  // les villages
  townFriend: "Bonjour, voisins ! {x} t'accueille avec le sourire : c'est un village ami.",
  townHostile: "Attention ! {x} est hostile : ses soldats foncent sur toi. Sauve-toi, ou lance ta lance (F) !",
  townKnownHostile: "{x} est hostile : n'y retourne pas !",
  tradeLocked: "Pour échanger, il faut d'abord inventer la balance. Appuie sur 💡 Inventer !",
  tradeNothing: "Tu n'as rien à vendre ! Rapporte du blé de tes champs, ou de la laine du parc à moutons.",
  traded: "Marché conclu ! Tu vends tes marchandises, et ils te paient en pièces d'argent. Plus tu échanges, plus ils sont tes amis !",
  tablet: "Avec l'écriture, chaque échange est noté sur une tablette d'argile : plus personne ne se trompe dans les comptes !",
  friendMax: "{x} est devenu ton meilleur ami ! Ses marchands viendront souvent à ton marché.",
  caravan: "Une charrette de marchands arrive au marché : ils paient en pièces d'argent pour vendre chez toi !",
  caught: "Les soldats t'ont pris {n} pièces…",
  // le monument
  chooseNeed: "Pour choisir la forme du monument, invente d'abord les plans !",
  chosen: "Quel beau choix ! Pose maintenant les fondations, juste ici.",
  needChoose: "Choisis d'abord la forme du monument : va au grand chantier, au sud-est de la ville.",
  hired: "Un ouvrier de plus sur le chantier ! Il taille et monte les blocs de pierre.",
  hireNeed: "Il te faut {n} pièces pour payer un ouvrier.",
  boatOrdered: "Bateau commandé ! Il descend le fleuve, chargé de pierres… Il arrive bientôt au port.",
  boatNeed: "Il te faut {n} pièces pour commander un bateau.",
  boatArrived: "Un bateau est arrivé au port ! Les ouvriers déchargent les pierres pour le chantier.",
  noWorkers: "Le chantier attend des ouvriers : embauche-les à la cabane du chef de chantier.",
  noStone: "Il n'y a plus de pierres sur le chantier ! Fais venir un bateau, ou apporte des pierres de la carrière.",
  noWood: "Il n'y a plus de bois sur le chantier ! Apporte du bois de la forêt, ou fais venir un bateau.",
  stored: "Tu déposes tes pierres et ton bois sur le chantier : les ouvriers vont s'en servir.",
  monumentHalf: "Le monument est à moitié construit ! On le voit déjà de très loin.",
  monumentDone: "Le monument est terminé ! C'est le plus beau du monde… Il restera debout pendant des milliers d'années !",
  spearHit: "Touché ! Le soldat recule. Mais il en reste d'autres : file !",
  shield: "CLANG ! Ton bouclier t'a protégé !",
};

/* La fin : le monument terminé… puis, 2 000 ans plus tard, les touristes */
const ending = {
  scene: 'touristes',
  title: 'Le monument de l’Histoire',
  sub: "Les villes, l'écriture, le commerce, les mathématiques, les grands monuments… Les humains sont entrés dans l'Histoire. Et ce qu'ils ont bâti, on vient encore l'admirer aujourd'hui !",
  done: 'Tu as bâti un monument qui a traversé l’Histoire',
  captions: [
    [0.4, 4.8, "Le monument est terminé ! Toute la ville fait la fête : les ouvriers, les marchands, les enfants des écoles…"],
    [5.6, 10.2, "2 000 ans plus tard… Les remparts sont tombés, mais le monument est toujours là."],
    [10.4, 15.4, "Aujourd'hui, des touristes viennent du monde entier pour l'admirer… et le prendre en photo !"],
  ],
  // le défilé des inventions (draw = un dessin à la place de l'emoji)
  parade: [
    { icon: '🌉', name: 'Le pont' }, { icon: '⚖️', name: 'La balance' }, { draw: 'roue', name: 'La roue' },
    { icon: '📜', name: "L'écriture" }, { icon: '🏫', name: "L'école" }, { icon: '🔢', name: 'Les maths' },
    { icon: '📐', name: 'Les plans' }, { icon: '⛵', name: 'La voile' }, { icon: '🏛️', name: 'Le monument' },
  ],
  choices: [
    {
      id: 'chateaux', icon: '🏰', title: 'Les châteaux forts',
      text: "Et ensuite ? Les chevaliers, les châteaux forts, les cathédrales… Le Moyen Âge !",
      level: 'chateaux-forts',
      soon: 'Niveau 6 : Les châteaux forts',
      fact: "La Grande Pyramide de Gizeh a été construite il y a 4 500 ans. Pendant près de 4 000 ans, ce fut le plus haut monument du monde !",
    },
  ],
};

export default {
  id: 'premieres-villes',
  name: 'Les premières villes',
  num: 5,
  icon: '🏛️',
  intro: 'villes',
  goal: "Ton village est devenu une ville de pierre. <b>Construis un pont, échange avec les villages amis, invente l'écriture et les mathématiques… et bâtis un monument qui restera dans l'Histoire</b> :<br>🌉 le pont → ⚖️ les échanges → 📜 l'écriture → 📐 les plans → 🏛️ le monument !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
