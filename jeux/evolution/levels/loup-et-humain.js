// ============================================================================
// NIVEAU 4 — LE LOUP ET L'HUMAIN
//
// De l'âge de glace (il y a 40 000 ans) aux premiers villages (il y a 10 000
// ans). Le joueur est un louveteau : il chasse d'abord avec sa meute, puis
// s'approche du feu des humains, gagne leur confiance, les aide à chasser et
// à se défendre… et devient le premier chien, puis un chien de berger.
// Ici, on ne fait pas que manger : il faut rester calme près des humains (la
// jauge 🤝), aboyer pour faire fuir les lions et les loups sauvages, jouer
// avec les enfants et ramener les moutons dans l'enclos.
// Mêmes réglages que les niveaux 2 et 3 (vitesse, chasseurs).
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : la steppe enneigée et ses camps, puis les prés, les villages et les enclos */
const world = {
  ground: 'land',
  w: 12000,
  h: 8000,
  start: { x: 2200, y: 4000 },
  maxChasers: 4,
  speed: 1.3,
  noise: 560,                      // un sprint s'entend jusque-là (et fait peur aux humains)
  penalty: { adn: 0.3, growth: 0.06 },
  decor: [
    { type: 'mare', count: 20, r: [190, 480], zone: 'water' },
    { type: 'neige', count: 26, r: [150, 360], zone: 'mud', to: 3 },
    { type: 'camp', count: 16, r: [270, 320], zone: 'camp', from: 2, to: 4 },
    { type: 'village', count: 14, r: [300, 340], zone: 'camp', from: 5 },
    { type: 'enclos', count: 14, r: [250, 290], zone: 'pen', from: 5 },
    { type: 'herbes-gel', count: 85, r: [130, 340], hide: true, to: 4, atStart: true },
    { type: 'herbes', count: 90, r: [130, 340], hide: true, from: 5 },
    { type: 'sapin-neige', count: 75, r: [90, 190], canopy: true, to: 4 },
    { type: 'feuillu', count: 60, r: [90, 190], canopy: true, from: 5 },
    { type: 'rocher', count: 110, r: [18, 90] },
    { type: 'os', count: 30, r: [30, 70], to: 3 },
    { type: 'fleur', count: 150, r: [6, 12], from: 5 },
  ],
};

/* Les êtres vivants (les options sont les mêmes qu'au niveau 2 : voir vers-les-dinosaures.js ;
   les nouvelles sont expliquées dans levels/index.js : ally, human, flock, play, trust…) */
const species = {
  /* ---- Ta meute : elle te suit, et t'aide à chasser plus gros que toi ---- */
  'loup-de-la-meute': {
    name: 'Loup de ta meute', plural: 'loups de ta meute', kind: 'ally', look: 'loup', color: '#8E8C88', belly: '#E8E4DA',
    size: 40, speed: 200, sense: 0, adn: 0,
    fact: "Les loups vivent en meute : une famille de 5 à 10 loups qui chassent ensemble. Seul, un loup ne pourrait pas attraper un renne !",
  },

  /* ---- Les proies ---- */
  campagnol: {
    name: 'Campagnol', plural: 'campagnols', kind: 'prey', look: 'musaraigne', color: '#8A6E50',
    size: 8, speed: 80, sense: 100, adn: 2,
    fact: "Le campagnol est un petit rongeur. Il creuse des tunnels sous la neige… mais le loup l'entend quand même et bondit dessus !",
  },
  lievre: {
    name: 'Lièvre variable', plural: 'lièvres variables', kind: 'prey', look: 'palaeolagus', color: '#E6E4DE',
    size: 16, speed: 170, sense: 200, adn: 5,
    fact: "Le lièvre variable change de couleur : brun en été, tout blanc en hiver pour se cacher dans la neige !",
  },
  marmotte: {
    name: 'Marmotte', plural: 'marmottes', kind: 'prey', look: 'marmotte', color: '#9A7A52',
    size: 22, speed: 120, sense: 200, adn: 7,
    fact: "La marmotte siffle très fort pour prévenir les autres d'un danger. L'hiver, elle dort six mois dans son terrier !",
  },
  renne: {
    name: 'Renne', plural: 'rennes', kind: 'prey', look: 'renne', color: '#9A8A74', barkLine: 'Les chasseurs l’ont vu !',
    size: 85, speed: 200, sense: 360, adn: 30,
    eatLine: "Bravo ! Tout seul, tu n'aurais jamais attrapé un renne… mais en meute, tout est possible !",
    fact: "Chez les rennes, même les femelles ont des bois ! Les loups et les humains de l'âge de glace chassaient les mêmes troupeaux.",
  },
  bison: {
    name: 'Bison des steppes', plural: 'bisons des steppes', kind: 'prey', look: 'bison', color: '#6E4E36',
    size: 105, speed: 220, sense: 360, adn: 36,
    fact: "Le bison des steppes avait des cornes deux fois plus grandes que celles des bisons d'aujourd'hui. Les humains l'ont peint dans les grottes !",
  },
  saiga: {
    name: 'Saïga', plural: 'saïgas', kind: 'prey', look: 'gazelle', color: '#C9A877',
    size: 48, speed: 230, sense: 340, adn: 16,
    fact: "La saïga est une antilope au drôle de nez tout gonflé : il réchauffe l'air glacé avant qu'il n'arrive dans ses poumons !",
  },
  bouquetin: {
    name: 'Bouquetin', plural: 'bouquetins', kind: 'prey', look: 'chevre', color: '#8E7A60',
    size: 52, speed: 230, sense: 340, adn: 18,
    fact: "Le bouquetin grimpe sur les rochers les plus raides grâce à ses sabots, durs dehors et souples dessous, comme des chaussons d'escalade !",
  },
  chevreuil: {
    name: 'Chevreuil', plural: 'chevreuils', kind: 'prey', look: 'gazelle', color: '#A8683A',
    size: 46, speed: 240, sense: 340, adn: 22,
    fact: "Quand la glace a fondu, les forêts ont poussé, et les chevreuils sont arrivés. Au moindre bruit, ils bondissent et disparaissent !",
  },
  os: {
    name: 'Os', plural: 'os', kind: 'food', look: 'os-jete', color: '#F4ECD8',
    size: 12, speed: 0, sense: 0, adn: 8, trust: 0.04,
    fact: "Les humains de l'âge de glace jetaient les restes de leurs repas. Les loups les plus calmes venaient les manger… c'est peut-être comme ça que tout a commencé !",
  },

  /* ---- Les humains : ils vivent dans leur camp (puis dans leur village) ---- */
  humain: {
    name: 'Humain', plural: 'humains', kind: 'human', look: 'humain', color: '#8A6A48', habitat: 'camp', hurt: 'Ouste !',
    size: 60, speed: 80, sense: 300, adn: 0,
    fact: "Les humains de l'âge de glace vivaient en petits groupes, dans des tentes en peaux de bêtes. Ils chassaient le renne, le cheval et le mammouth.",
  },
  chasseur: {
    name: 'Chasseur', plural: 'chasseurs', kind: 'human', look: 'chasseur', color: '#6E5238', habitat: 'camp', hurt: 'Ouste !',
    size: 62, speed: 90, sense: 320, adn: 0,
    fact: "Les chasseurs avaient des lances à pointe de pierre taillée. Avec un chien qui flaire et rabat le gibier, la chasse devient bien plus facile !",
  },
  enfant: {
    name: 'Enfant', plural: 'enfants', kind: 'human', look: 'enfant', color: '#B08A5A', habitat: 'camp', hurt: 'Ouste !', play: true,
    size: 42, speed: 110, sense: 240, adn: 0,
    fact: "Dans la grotte Chauvet, on a retrouvé les traces de pas d'un enfant d'il y a 26 000 ans… et tout près, celles d'un grand loup ou d'un chien !",
  },

  /* ---- Le troupeau (chapitre 5) : on le ramène dans l'enclos ---- */
  mouton: {
    name: 'Mouton', plural: 'moutons', kind: 'flock', look: 'mouton', color: '#E8E2D4', pack: 4, near: 'pen',
    size: 40, speed: 170, sense: 170, adn: 0,
    fact: "Le mouton descend d'un mouton sauvage, le mouflon. Il a été apprivoisé il y a environ 10 000 ans, avec la chèvre : ce sont les débuts de l'élevage !",
  },
  chevre: {
    name: 'Chèvre', plural: 'chèvres', kind: 'flock', look: 'chevre', color: '#C9B08A', pack: 3, near: 'pen',
    size: 36, speed: 190, sense: 160, adn: 0,
    fact: "La chèvre a été l'un des tout premiers animaux de la ferme. Elle donne du lait, de la viande et des poils pour se tenir chaud.",
  },

  /* ---- Les dangers ---- */
  'hyene-des-cavernes': {
    name: 'Hyène des cavernes', plural: 'hyènes des cavernes', kind: 'hunter', look: 'hyene', color: '#8A7A5A', pack: 2,
    size: 95, speed: 240, sense: 340, cone: 2.4, adn: 25,
    fact: "Les hyènes des cavernes vivaient en groupe dans les grottes. Elles volaient souvent les proies des loups… et des humains !",
  },
  'lion-des-cavernes': {
    name: 'Lion des cavernes', plural: 'lions des cavernes', kind: 'hunter', look: 'lion-des-cavernes', color: '#C9A46E', roar: true,
    size: 150, speed: 300, sense: 420, cone: 2.3, adn: 40,
    fact: "Le lion des cavernes était plus grand que les lions d'aujourd'hui. Mais il avait peur du feu des humains… et des aboiements !",
  },
  'loup-sauvage': {
    name: 'Loup sauvage', plural: 'loups sauvages', kind: 'hunter', look: 'loup', color: '#6E6A66', pack: 2, eatsFlock: true, noEat: true,
    size: 90, speed: 290, sense: 400, cone: 2.4, adn: 0,
    fact: "Les loups sauvages n'ont pas disparu : ce sont tes cousins ! Le chien de berger protège le troupeau… contre ses propres cousins.",
  },
  mammouth: {
    name: 'Mammouth laineux', plural: 'mammouths laineux', kind: 'giant', look: 'mammouth', color: '#7A5A40', stomp: true,
    size: 330, speed: 120, sense: 0, adn: 0,
    fact: "Le mammouth laineux était bien trop gros pour un loup. Mais les humains le chassaient, en groupe, avec leurs lances.",
  },
  'rhino-laineux': {
    name: 'Rhinocéros laineux', plural: 'rhinocéros laineux', kind: 'defender', look: 'rhino-laineux', color: '#7A6450', stomp: true, hurt: 'Aïe, la corne !',
    size: 240, speed: 190, sense: 260, adn: 0,
    fact: "Le rhinocéros laineux avait une corne de plus d'un mètre. Même une meute de loups préférait le laisser tranquille !",
  },
  aurochs: {
    name: 'Aurochs', plural: 'aurochs', kind: 'defender', look: 'aurochs', color: '#3E2E24', stomp: true, hurt: 'Aïe, les cornes !',
    size: 190, speed: 170, sense: 260, adn: 0,
    fact: "L'aurochs était un bœuf sauvage géant, avec de grandes cornes. C'est l'ancêtre de toutes nos vaches !",
  },
};

/* Les évolutions : celles du loup, puis celles du chien (oreilles, queue, taches) */
const evolutions = {
  flair: {
    name: 'Flair', ch: 1, cost: 20, effect: { vision: 1.3, radar: true },
    short: 'Tu sens les proies et les dangers de loin',
    fact: "Le nez d'un loup est des milliers de fois plus puissant que le tien : il sent un renne à plus d'un kilomètre !",
  },
  hurlement: {
    name: 'Hurlement', ch: 1, cost: 45, effect: { pack: 0.35 },
    short: 'Ta meute t’aide encore mieux : vous attrapez des proies plus grosses',
    fact: "Les loups hurlent pour appeler leur meute et se retrouver. Un hurlement s'entend à plus de 10 kilomètres !",
  },
  'pelage-epais': {
    name: 'Pelage épais', ch: 2, cost: 60, effect: { shield: 1 },
    short: 'Ta fourrure te protège : tu encaisses un coup',
    fact: "Le loup a deux couches de poils : un duvet tout doux contre le froid, et de longs poils qui laissent glisser la neige.",
  },
  calme: {
    name: 'Caractère calme', ch: 2, cost: 90, effect: { trust: 1.5 },
    short: 'Les humains te font confiance plus vite',
    fact: "Les loups les moins peureux et les moins agressifs osaient s'approcher des humains. Leurs petits sont devenus les premiers chiens !",
  },
  aboiement: {
    name: 'Aboiement', ch: 3, cost: 140, effect: { bark: true },
    short: 'Aboie (touche B) : les chasseurs s’enfuient',
    fact: "Les loups aboient très peu : ils hurlent. Les chiens, eux, aboient pour prévenir leurs humains d'un danger !",
  },
  endurance: {
    name: 'Endurance', ch: 3, cost: 180, effect: { dash: true },
    short: 'Ton sprint se recharge plus vite',
    fact: "Les loups peuvent trotter toute une nuit sans s'arrêter : plus de 50 kilomètres !",
  },
  'oreilles-tombantes': {
    name: 'Oreilles tombantes', ch: 4, cost: 200, effect: { treats: 2 },
    short: 'Les humains craquent : ils te donnent plus souvent à manger',
    fact: "Quand on apprivoise un animal pendant des générations, ses oreilles deviennent souvent toutes molles. On l'a vu chez des renards apprivoisés, en Russie !",
  },
  'queue-tire-bouchon': {
    name: 'Queue en tire-bouchon', ch: 4, cost: 240, effect: { trust: 2 },
    short: 'Ta queue frétille : les humains savent que tu es gentil',
    fact: "Le loup porte sa queue basse. Chez beaucoup de chiens, elle remonte et s'enroule : une autre trace de l'apprivoisement !",
  },
  'pelage-tachete': {
    name: 'Pelage tacheté', ch: 5, cost: 220, effect: { shield: 2 },
    short: 'Les humains te reconnaissent de loin et te protègent : tu encaisses deux coups',
    fact: "Les loups sauvages sont gris. Les chiens, eux, ont toutes les couleurs : noirs, blancs, roux, tachetés… encore un effet de l'apprivoisement !",
  },
  'instinct-berger': {
    name: 'Instinct de berger', ch: 5, cost: 260, effect: { herd: 1.6 },
    short: 'Tu rassembles les moutons de plus loin',
    fact: "Le chien de berger tourne autour du troupeau, comme un loup qui chasse… mais il ne croque pas les moutons : il les ramène !",
  },
};

/* L'histoire, en cinq chapitres */
const chapters = [
  {
    title: 'La meute de la steppe',
    ago: [0.04, 0.035],
    form: 'louveteau',
    skin: { body: '#8E8A86', belly: '#EFEAE0', dark: '#3E3A36', stripe: '#6A6662' },
    size: [24, 44],
    growth: 130,
    vision: 1.2,
    fog: 0.55,
    palette: { water: ['#C9D6DE', '#7D8E9A'], floor: '#DCE6EC', motes: 'rgba(255, 255, 255, 0.9)' },
    species: { 'loup-de-la-meute': 3, campagnol: 9, lievre: 10, marmotte: 6, renne: 4, 'hyene-des-cavernes': 2, 'lion-des-cavernes': 1, mammouth: 1 },
    unlock: ['flair', 'hurlement'],
    intro: "Brrr ! C'est l'âge de glace. Tu es un louveteau, et voici ta meute ! Seul, tu n'attrapes que des lièvres… mais avec les autres loups tout près de toi, vous pouvez chasser un renne, bien plus gros que vous !",
    missions: [
      { type: 'evolve', part: 'flair' },
      { type: 'eat', species: 'lievre', n: 5 },
      { type: 'evolve', part: 'hurlement' },
      { type: 'eat', species: 'renne', n: 1, text: 'Chasse 1 renne avec ta meute' },
      { type: 'grow' },
    ],
    tips: [
      "Reste près de ta meute : ensemble, vous attrapez des proies bien plus grosses !",
      "Les hyènes des cavernes volent les proies des loups… et elles chassent à deux. Prudence !",
      "Ne passe pas sous les pattes des mammouths !",
    ],
  },
  {
    title: "L'odeur du feu",
    ago: [0.032, 0.03],
    form: 'loup',
    skin: { body: '#8A8682', belly: '#ECE6DA', dark: '#3A3632', stripe: '#66625E' },
    size: [44, 66],
    growth: 240,
    trust: true,
    treat: 'os',
    vision: 1.2,
    fog: 0.55,
    palette: { water: ['#C9D6DE', '#7D8E9A'], floor: '#D6E0E6', motes: 'rgba(255, 255, 255, 0.9)' },
    species: { 'loup-de-la-meute': 2, humain: 4, chasseur: 3, lievre: 9, marmotte: 7, renne: 4, bison: 3, 'hyene-des-cavernes': 2, 'lion-des-cavernes': 1, 'rhino-laineux': 1 },
    unlock: ['pelage-epais', 'calme'],
    intro: "Une drôle d'odeur flotte dans l'air : de la fumée, et de la viande grillée ! Ce sont les humains, autour de leur feu. Ils ne te connaissent pas : si tu marches vers eux, ils te chasseront. Reste près du camp sans bouger, sans foncer… et laisse-les s'habituer à toi.",
    missions: [
      { type: 'evolve', part: 'pelage-epais' },
      { type: 'trust', species: 'humain', n: 50, text: 'Approche les humains : confiance 50 %' },
      { type: 'evolve', part: 'calme' },
      { type: 'eat', species: 'os', n: 4, text: 'Mange 4 os lancés par les humains' },
      { type: 'grow' },
    ],
    tips: [
      "Tu vois la jauge 🤝 ? C'est la confiance des humains. Elle monte quand tu restes près d'eux sans bouger.",
      "Quand ils te connaissent un peu, les humains te lancent des os : miam !",
      "Près du feu des humains, les chasseurs n'osent pas venir… quand les humains te font confiance.",
    ],
  },
  {
    title: 'Le loup qui aide',
    ago: [0.028, 0.025],
    form: 'loup',
    skin: { body: '#A89A86', belly: '#F2EADC', dark: '#4A4034', stripe: '#7A6E5E' },
    size: [56, 74],
    growth: 300,
    trust: true,
    treat: 'os',
    vision: 1.25,
    fog: 0.5,
    palette: { water: ['#C9D6DE', '#7D8E9A'], floor: '#D2DCDF', motes: 'rgba(255, 255, 255, 0.85)' },
    species: { humain: 4, chasseur: 3, enfant: 2, lievre: 10, marmotte: 6, saiga: 8, renne: 5, 'lion-des-cavernes': 3, 'hyene-des-cavernes': 1, mammouth: 1 },
    unlock: ['aboiement', 'endurance'],
    intro: "Tu as quitté ta meute : désormais, tu vis près des humains. Ils ont besoin de toi ! Avec ton flair, tu trouves les rennes pour les chasseurs. Et la nuit, les lions des cavernes rôdent autour du camp… Apprends à aboyer pour les faire fuir !",
    missions: [
      { type: 'evolve', part: 'aboiement' },
      { type: 'bark', species: 'renne', n: 2, text: 'Aboie pour montrer 2 rennes aux chasseurs' },
      { type: 'bark', species: 'lion-des-cavernes', n: 2, text: 'Fais fuir 2 lions des cavernes' },
      { type: 'trust', species: 'humain', n: 100, text: 'Deviens l’ami des humains : 100 %' },
      { type: 'grow' },
    ],
    tips: [
      "Appuie sur B (ou sur le bouton Aboie) : les lions et les hyènes s'enfuient !",
      "Un renne en vue ? Aboie : les chasseurs sauront où il est.",
      "Tu n'as plus ta meute : les rennes sont trop gros pour toi tout seul.",
    ],
  },
  {
    title: 'Le premier chien',
    ago: [0.015, 0.012],
    form: 'chien',
    skin: { body: '#C8A070', belly: '#F8E8CE', dark: '#5A3E1E', stripe: '#9A7448' },
    size: [60, 78],
    growth: 380,
    trust: true,
    treat: 'os',
    vision: 1.3,
    fog: 0.45,
    palette: { water: ['#B9CCC8', '#6E8A86'], floor: '#C9CFB8', motes: 'rgba(255, 255, 255, 0.7)' },
    species: { humain: 4, chasseur: 2, enfant: 4, lievre: 10, marmotte: 8, bouquetin: 8, renne: 3, 'hyene-des-cavernes': 2, 'lion-des-cavernes': 1 },
    unlock: ['oreilles-tombantes', 'queue-tire-bouchon'],
    intro: "Des milliers d'années ont passé. Tes descendants vivent avec les humains, génération après génération… et leur corps change : tu n'es plus tout à fait un loup. Tu es devenu un chien ! Les enfants veulent jouer avec toi.",
    missions: [
      { type: 'evolve', part: 'oreilles-tombantes' },
      { type: 'play', species: 'enfant', n: 3 },
      { type: 'evolve', part: 'queue-tire-bouchon' },
      { type: 'eat', species: 'os', n: 5, text: 'Mange 5 friandises des humains' },
      { type: 'grow' },
    ],
    tips: [
      "Va toucher un enfant du bout du museau : il va jouer avec toi !",
      "Avec des oreilles tombantes, les humains craquent : ils te donnent plus souvent à manger.",
      "Les hyènes des cavernes sont encore là : aboie si elles s'approchent !",
    ],
  },
  {
    title: 'Le chien de berger',
    ago: [0.01, 0.008],
    form: 'berger',
    skin: { body: '#B0703A', belly: '#F8EADA', dark: '#4A2A12', stripe: '#8A5228', patch: '#FBF6EC' },
    size: [62, 84],
    growth: 640,
    trust: true,
    treat: 'os',
    vision: 1.35,
    fog: 0.4,
    palette: { water: ['#7FB0A0', '#3A6A5A'], floor: '#8FB25E', motes: 'rgba(255, 250, 200, 0.5)' },
    species: { humain: 3, chasseur: 2, enfant: 2, mouton: 12, chevre: 6, lievre: 6, chevreuil: 7, 'loup-sauvage': 4, aurochs: 2 },
    unlock: ['pelage-tachete', 'instinct-berger'],
    intro: "La glace a fondu : partout, l'herbe et les forêts repoussent. Les humains construisent des villages, ils sèment des graines… et ils élèvent des moutons et des chèvres ! Ton travail : ramener le troupeau dans l'enclos, et le protéger des loups sauvages.",
    missions: [
      { type: 'evolve', part: 'pelage-tachete' },
      { type: 'herd', species: 'mouton', n: 6 },
      { type: 'evolve', part: 'instinct-berger' },
      { type: 'bark', species: 'loup-sauvage', n: 3, text: 'Chasse 3 loups sauvages loin du troupeau' },
      { type: 'herd', species: 'chevre', n: 4 },
    ],
    tips: [
      "Les moutons s'écartent devant toi : place-toi derrière eux pour les pousser vers l'enclos 🏡",
      "Un loup sauvage rôde près du troupeau ? Aboie !",
      "Les chèvres sont plus rapides que les moutons : vas-y doucement.",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Wouf ! Tu es un louveteau, et voici ta meute ! Reste près d'elle : ensemble, vous chassez des proies bien plus grosses que vous.",
};

/* La fin : le chien est devenu le meilleur ami de l'humain… puis le défilé des chiens d'aujourd'hui */
const ending = {
  scene: 'chien',
  title: "Le meilleur ami de l'humain",
  sub: "Il y a plus de 15 000 ans, des loups se sont approchés des humains. Génération après génération, ils sont devenus des chiens : chasseurs, gardiens, bergers… et compagnons de jeu. Aujourd'hui, il existe plus de 300 races de chiens !",
  done: "Tu es devenu le meilleur ami de l'humain",
  captions: [
    [0.4, 4.4, "Le soir, au village, tout le monde se retrouve autour du feu… et toi aussi !"],
    [4.6, 8.6, "Le loup est devenu le chien : il garde le troupeau, il aide à la chasse, il protège la maison… et il joue avec les enfants."],
    [9.4, 13.8, "Du chihuahua au saint-bernard, tous les chiens d'aujourd'hui descendent du loup !"],
  ],
  choices: [
    {
      id: 'humains', icon: '🔥', title: 'La voie des humains',
      text: "Et maintenant, vis l'aventure de tes amis humains : tailler la pierre, faire du feu, peindre les grottes…",
      level: 'voie-des-humains',
      soon: 'La voie des humains',
      fact: "Après le chien, les humains ont apprivoisé le mouton, la chèvre, la vache et le cochon : ce sont les débuts de l'élevage, il y a environ 10 000 ans !",
    },
  ],
};

export default {
  id: 'loup-et-humain',
  name: "Le loup et l'humain",
  num: 4,
  icon: '🐺',
  intro: 'loup',
  goal: "Tu es un louveteau de l'âge de glace. <b>Chasse avec ta meute, apprivoise les humains… et deviens leur meilleur ami</b> :<br>🐺 le louveteau → 🔥 le loup près du feu → 🐕 le premier chien → 🐑 le chien de berger !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
