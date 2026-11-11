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
// Manger ne fait pas grandir (world.noGrow) : on gagne par ses actions, et
// chaque bonne action rapporte de l'ADN pour évoluer. Au chapitre 1, ta force,
// c'est la taille de ta meute (5 loups au plus) : tous ensemble, vous attaquez
// les rennes, les bisons, les rhinocéros et même le mammouth.
// Le dessin est celui de la voie des humains (world.style = 'tqv', voir
// decor-tqv.js) : le sol vu d'en haut, et tout ce qui est debout (les loups,
// les bêtes, les humains, les sapins, les tentes) dessiné debout, de profil,
// rangé du fond vers le devant. Le jeu, lui, ne change pas.
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : la steppe enneigée et ses camps, puis les prés, les villages et les enclos */
const world = {
  ground: 'land',
  style: 'tqv',                    // dessiné de trois quarts, comme la voie des humains (decor-tqv.js)
  land: { bushes: 320, ferns: 160, fernsFrom: 5 },  // la végétation en plus, pour le plaisir des yeux
  w: 12000,
  h: 8000,
  start: { x: 2200, y: 4000 },
  maxChasers: 4,
  noGrow: true,                    // ici, manger ne fait pas grandir : on gagne par ses actions
  noise: 560,                      // un sprint s'entend jusque-là (et fait peur aux humains)
  penalty: { adn: 0.3, growth: 0.06 },
  decor: [
    { type: 'mare', count: 20, r: [190, 480], zone: 'water' },
    { type: 'neige', count: 14, r: [150, 320], zone: 'mud', to: 3 },
    { type: 'camp', count: 16, r: [270, 320], zone: 'camp', from: 2, to: 4 },
    { type: 'village', count: 14, r: [300, 340], zone: 'camp', from: 5 },
    { type: 'enclos', count: 1, at: { x: 6000, y: 4000 }, r: [640, 640], zone: 'pen', from: 5, clear: true, gate: 0, gateW: 0.6 },
    { type: 'herbes-gel', count: 50, r: [110, 240], hide: true, to: 4, atStart: true },
    { type: 'herbes', count: 55, r: [110, 240], hide: true, from: 5 },
    { type: 'sapin-neige', count: 75, r: [90, 190], canopy: true, to: 4 },
    { type: 'feuillu', count: 60, r: [90, 190], canopy: true, from: 5 },
    { type: 'rocher', count: 110, r: [18, 90] },
    { type: 'os', count: 30, r: [30, 70], to: 3 },
    { type: 'fleur', count: 150, r: [6, 12], from: 5 },
  ],
};

/* Les êtres vivants (les options sont les mêmes qu'au niveau 2 : voir vers-les-dinosaures.js ;
   les nouvelles sont expliquées dans levels/index.js : ally, human, flock, play, trust…).
   Dessinés de trois quarts (looks « th-… », art-humains.js) ; reach = la portée de leur gueule,
   la même que vus de dessus ; drawK = les humains sont dessinés plus petits que leur taille de jeu */
const species = {
  /* ---- Ta meute : les loups seuls te rejoignent, et elle te suit partout ---- */
  'loup-solitaire': {
    name: 'Loup solitaire', plural: 'loups solitaires', kind: 'stray', look: 'th-loup', reach: 0.62, color: '#A09C96', belly: '#EFEAE0', joins: 'loup-de-la-meute',
    size: 34, speed: 90, sense: 0, adn: 12, shy: true,
    // chacun se cache dans sa tanière, très loin des autres ; des hyènes ou un lion montent la garde
    lair: { far: 2300, gap: 2300, scent: 850, whiff: 35, call: 650,
      guards: ['hyene-des-cavernes', 'hyene-des-cavernes', 'lion-des-cavernes', 'hyene-des-cavernes', 'lion-des-cavernes'] },
    fact: "Un jeune loup quitte parfois sa famille pour trouver une autre meute. Tout seul, il a du mal à se nourrir : il a besoin des autres !",
  },
  'loup-de-la-meute': {
    name: 'Loup de ta meute', plural: 'loups de ta meute', kind: 'ally', look: 'th-loup', reach: 0.62, color: '#8E8C88', belly: '#E8E4DA',
    size: 40, speed: 200, sense: 0, adn: 0,
    fact: "Les loups vivent en meute : une famille de 5 à 10 loups qui chassent ensemble. Seul, un loup ne pourrait pas attraper un renne !",
  },

  /* ---- Les proies ---- */
  campagnol: {
    name: 'Campagnol', plural: 'campagnols', kind: 'prey', look: 'th-campagnol', reach: 0.515, color: '#8A6E50',
    size: 8, speed: 80, sense: 100, adn: 2,
    fact: "Le campagnol est un petit rongeur. Il creuse des tunnels sous la neige… mais le loup l'entend quand même et bondit dessus !",
  },
  lievre: {
    name: 'Lièvre variable', plural: 'lièvres variables', kind: 'prey', look: 'th-lievre', reach: 0.425, color: '#E6E4DE',
    size: 16, speed: 240, sense: 200, adn: 5,
    fact: "Le lièvre variable change de couleur : brun en été, tout blanc en hiver pour se cacher dans la neige !",
  },
  marmotte: {
    name: 'Marmotte', plural: 'marmottes', kind: 'prey', look: 'th-marmotte', reach: 0.425, color: '#9A7A52',
    size: 22, speed: 160, sense: 200, adn: 7,
    fact: "La marmotte siffle très fort pour prévenir les autres d'un danger. L'hiver, elle dort six mois dans son terrier !",
  },
  renne: {
    name: 'Renne', plural: 'rennes', kind: 'prey', look: 'th-renne', reach: 0.5, color: '#9A8A74', barkLine: 'Les chasseurs l’ont vu !', noEat: true, hp: 100, need: 3,
    size: 85, speed: 240, sense: 360, adn: 40,
    eatLine: "Bravo ! Tout seul, tu n'aurais jamais attrapé un renne… mais en meute, tout est possible !",
    fact: "Chez les rennes, même les femelles ont des bois ! Les loups et les humains de l'âge de glace chassaient les mêmes troupeaux.",
  },
  bison: {
    name: 'Bison des steppes', plural: 'bisons des steppes', kind: 'prey', look: 'th-bison', reach: 0.5, color: '#6E4E36', noEat: true, hp: 170, need: 4,
    size: 105, speed: 260, sense: 360, adn: 60,
    eatLine: "Quel festin ! Un bison, ça nourrit toute la meute pendant des jours.",
    fact: "Le bison des steppes avait des cornes deux fois plus grandes que celles des bisons d'aujourd'hui. Les humains l'ont peint dans les grottes !",
  },
  'cerf-geant': {
    name: 'Cerf géant', plural: 'cerfs géants', kind: 'prey', look: 'th-megaceros', reach: 0.515, color: '#8A6A44', noEat: true, hp: 130, need: 4,
    size: 125, speed: 300, sense: 360, adn: 50,
    eatLine: "Rattrapé ! Ses bois immenses ne l'ont pas aidé à s'enfuir…",
    fact: "Le cerf géant, ou mégacéros, avait les plus grands bois de tous les temps : plus de 3 mètres et demi d'un bout à l'autre, plus large qu'une voiture !",
  },
  saiga: {
    name: 'Saïga', plural: 'saïgas', kind: 'prey', look: 'th-saiga', reach: 0.425, color: '#C9A877',
    size: 48, speed: 310, sense: 340, adn: 16,
    fact: "La saïga est une antilope au drôle de nez tout gonflé : il réchauffe l'air glacé avant qu'il n'arrive dans ses poumons !",
  },
  bouquetin: {
    name: 'Bouquetin', plural: 'bouquetins', kind: 'prey', look: 'th-bouquetin', reach: 0.44, color: '#8E7A60',
    size: 52, speed: 310, sense: 340, adn: 18,
    fact: "Le bouquetin grimpe sur les rochers les plus raides grâce à ses sabots, durs dehors et souples dessous, comme des chaussons d'escalade !",
  },
  chevreuil: {
    name: 'Chevreuil', plural: 'chevreuils', kind: 'prey', look: 'th-chevreuil', reach: 0.425, color: '#A8683A',
    size: 46, speed: 320, sense: 340, adn: 22,
    fact: "Quand la glace a fondu, les forêts ont poussé, et les chevreuils sont arrivés. Au moindre bruit, ils bondissent et disparaissent !",
  },
  os: {
    name: 'Os', plural: 'os', kind: 'food', look: 'th-os', color: '#F4ECD8',
    size: 12, speed: 0, sense: 0, adn: 8, trust: 0.04,
    fact: "Les humains de l'âge de glace jetaient les restes de leurs repas. Les loups les plus calmes venaient les manger… c'est peut-être comme ça que tout a commencé !",
  },

  /* ---- Les humains : ils vivent dans leur camp (puis dans leur village) ---- */
  humain: {
    name: 'Humain', plural: 'humains', kind: 'human', look: 'th-humain', drawK: 0.5, color: '#8A6A48', habitat: 'camp', hurt: 'Ouste !',
    size: 60, speed: 80, sense: 300, adn: 0,
    fact: "Les humains de l'âge de glace vivaient en petits groupes, dans des tentes en peaux de bêtes. Ils chassaient le renne, le cheval et le mammouth.",
  },
  chasseur: {
    name: 'Chasseur', plural: 'chasseurs', kind: 'human', look: 'th-chasseur', drawK: 0.5, color: '#6E5238', habitat: 'camp', hurt: 'Ouste !',
    size: 62, speed: 90, sense: 320, adn: 0,
    fact: "Les chasseurs avaient des lances à pointe de pierre taillée. Avec un chien qui flaire et rabat le gibier, la chasse devient bien plus facile !",
  },
  enfant: {
    name: 'Enfant', plural: 'enfants', kind: 'human', look: 'th-enfant', drawK: 0.5, color: '#B08A5A', habitat: 'camp', hurt: 'Ouste !', play: true,
    size: 42, speed: 110, sense: 240, adn: 0,
    fact: "Dans la grotte Chauvet, on a retrouvé les traces de pas d'un enfant d'il y a 26 000 ans… et tout près, celles d'un grand loup ou d'un chien !",
  },

  /* ---- Le troupeau (chapitre 5) : on le ramène dans l'enclos ---- */
  mouton: {
    name: 'Mouton', plural: 'moutons', kind: 'flock', look: 'th-mouton', reach: 0.44, color: '#E8E2D4', pack: 4, near: 'pen',
    size: 40, speed: 230, sense: 170, adn: 0,
    fact: "Le mouton descend d'un mouton sauvage, le mouflon. Il a été apprivoisé il y a environ 10 000 ans, avec la chèvre : ce sont les débuts de l'élevage !",
  },
  chevre: {
    name: 'Chèvre', plural: 'chèvres', kind: 'flock', look: 'th-chevre', reach: 0.44, color: '#C9B08A', pack: 3, near: 'pen',
    size: 36, speed: 260, sense: 160, adn: 0,
    fact: "La chèvre a été l'un des tout premiers animaux de la ferme. Elle donne du lait, de la viande et des poils pour se tenir chaud.",
  },

  /* ---- Le berger attend à la porte de l'enclos ---- */
  'berger-enclos': {
    name: 'Berger', plural: 'bergers', kind: 'shepherd', look: 'th-berger-humain', drawK: 0.5, color: '#7E6A48',
    size: 62, speed: 0, sense: 0, adn: 0,
    fact: "Les premiers bergers vivaient il y a environ 10 000 ans. Avec un chien pour rassembler le troupeau et chasser les loups, leur travail est bien plus facile !",
  },

  /* ---- Les dangers ---- */
  'hyene-des-cavernes': {
    name: 'Hyène des cavernes', plural: 'hyènes des cavernes', kind: 'hunter', look: 'th-hyene', reach: 0.59, color: '#8A7A5A', pack: 2, packFear: 3,
    size: 95, speed: 290, sense: 340, cone: 2.4, adn: 25,
    fact: "Les hyènes des cavernes vivaient en groupe dans les grottes. Elles volaient souvent les proies des loups… et des humains !",
  },
  'lion-des-cavernes': {
    name: 'Lion des cavernes', plural: 'lions des cavernes', kind: 'hunter', look: 'th-lion', reach: 0.515, color: '#C9A46E', roar: true, packFear: 5,
    size: 150, speed: 340, sense: 420, cone: 2.3, adn: 40,
    fact: "Le lion des cavernes était plus grand que les lions d'aujourd'hui. Mais il avait peur du feu des humains… et des aboiements !",
  },
  'loup-sauvage': {
    name: 'Loup sauvage', plural: 'loups sauvages', kind: 'hunter', look: 'th-loup', reach: 0.62, color: '#6E6A66', pack: 2, eatsFlock: true, noEat: true,
    size: 90, speed: 340, sense: 320, cone: 2.4, adn: 0,
    fact: "Les loups sauvages n'ont pas disparu : ce sont tes cousins ! Le chien de berger protège le troupeau… contre ses propres cousins.",
  },
  mammouth: {
    name: 'Mammouth laineux', plural: 'mammouths laineux', kind: 'giant', look: 'th-mammouth', reach: 0.5, color: '#7A5A40', stomp: true,
    size: 250, speed: 130, sense: 0, adn: 120,
    fights: true, hp: 320, need: 5,
    eatLine: "Incroyable ! Toute la meute a vaincu le géant de la steppe. Personne ne l'oubliera !",
    fact: "Le mammouth laineux pesait autant que quatre voitures ! Dans la vraie vie, les loups s'attaquaient plutôt aux jeunes ou aux bêtes affaiblies, et les humains le chassaient en groupe, avec leurs lances.",
  },
  'rhino-laineux': {
    name: 'Rhinocéros laineux', plural: 'rhinocéros laineux', kind: 'defender', look: 'th-rhino-laineux', reach: 0.635, color: '#7A6450', stomp: true, hurt: 'Aïe, la corne !', fights: true, hp: 220, need: 5,
    eatLine: "Ouf ! Il a chargé, mais à cinq, vous avez été les plus forts !",
    size: 190, speed: 190, sense: 260, adn: 80,
    fact: "Le rhinocéros laineux avait une corne de plus d'un mètre. Il fallait être nombreux pour l'approcher… et surtout ne pas rester devant lui !",
  },
  aurochs: {
    name: 'Aurochs', plural: 'aurochs', kind: 'defender', look: 'th-aurochs', reach: 0.515, color: '#3E2E24', stomp: true, hurt: 'Aïe, les cornes !',
    size: 190, speed: 170, sense: 260, adn: 0,
    fact: "L'aurochs était un bœuf sauvage géant, avec de grandes cornes. C'est l'ancêtre de toutes nos vaches !",
  },
};

/* Les évolutions : celles du loup, puis celles du chien (oreilles, queue, taches) */
const evolutions = {
  flair: {
    name: 'Flair', ch: 1, cost: 15, effect: { vision: 1.3, radar: true },
    short: 'Tu sens les proies et les dangers de loin',
    fact: "Le nez d'un loup est des milliers de fois plus puissant que le tien : il sent un renne à plus d'un kilomètre !",
  },
  hurlement: {
    name: 'Hurlement', ch: 1, cost: 30, effect: { howl: true },
    short: 'Les loups solitaires t’entendent et viennent vers toi',
    fact: "Les loups hurlent pour appeler leur meute et se retrouver. Un hurlement s'entend à plus de 10 kilomètres !",
  },
  'pelage-epais': {
    name: 'Pelage épais', ch: 2, cost: 30, effect: { shield: 1 },
    short: 'Ta fourrure te protège : tu encaisses un coup',
    fact: "Le loup a deux couches de poils : un duvet tout doux contre le froid, et de longs poils qui laissent glisser la neige.",
  },
  calme: {
    name: 'Caractère calme', ch: 2, cost: 40, effect: { trust: 1.5 },
    short: 'Les humains te font confiance plus vite',
    fact: "Les loups les moins peureux et les moins agressifs osaient s'approcher des humains. Leurs petits sont devenus les premiers chiens !",
  },
  aboiement: {
    name: 'Aboiement', ch: 3, cost: 60, effect: { bark: true },
    short: 'Aboie (touche B) : les chasseurs s’enfuient',
    fact: "Les loups aboient très peu : ils hurlent. Les chiens, eux, aboient pour prévenir leurs humains d'un danger !",
  },
  endurance: {
    name: 'Endurance', ch: 3, cost: 100, effect: { dash: true },
    short: 'Ton sprint se recharge plus vite',
    fact: "Les loups peuvent trotter toute une nuit sans s'arrêter : plus de 50 kilomètres !",
  },
  'oreilles-tombantes': {
    name: 'Oreilles tombantes', ch: 4, cost: 60, effect: { treats: 2 },
    short: 'Les humains craquent : ils te donnent plus souvent à manger',
    fact: "Quand on apprivoise un animal pendant des générations, ses oreilles deviennent souvent toutes molles. On l'a vu chez des renards apprivoisés, en Russie !",
  },
  'queue-tire-bouchon': {
    name: 'Queue en tire-bouchon', ch: 4, cost: 80, effect: { trust: 2 },
    short: 'Ta queue frétille : les humains savent que tu es gentil',
    fact: "Le loup porte sa queue basse. Chez beaucoup de chiens, elle remonte et s'enroule : une autre trace de l'apprivoisement !",
  },
  'pelage-tachete': {
    name: 'Pelage tacheté', ch: 5, cost: 100, effect: { shield: 2 },
    short: 'Les humains te reconnaissent de loin et te protègent : tu encaisses deux coups',
    fact: "Les loups sauvages sont gris. Les chiens, eux, ont toutes les couleurs : noirs, blancs, roux, tachetés… encore un effet de l'apprivoisement !",
  },
  'instinct-berger': {
    name: 'Instinct de berger', ch: 5, cost: 120, effect: { herd: 1.6 },
    short: 'Tu rassembles les moutons de plus loin',
    fact: "Le chien de berger tourne autour du troupeau, comme un loup qui chasse… mais il ne croque pas les moutons : il les ramène !",
  },
};

/* Les couleurs de la steppe (vue de trois quarts : le sol, la neige, les mares, les sapins, les herbes) */
const GLACE = {
  water: ['#C9D6DE', '#7D8E9A'], motes: 'rgba(255, 255, 255, 0.9)', snow: '#F4F8FF', ice: true,
  pond: '#7FA6BE', bank: '#9AA4A8', sand: '#E4EAEE', leaf: ['#1E4A34', '#2A5E40', '#3A7650'], rock: '#9A968E',
  bush: ['#6A806A', '#7E947A', '#9AAE92'], tallGrass: ['#B4AE84', '#D6D0AA'], tuft: ['#A8A07A', '#8E8868'],
  dirt: 'rgba(140, 115, 85, 0.6)', hideBase: 'rgba(170, 160, 120, 0.35)', thatch: '#B8A070',
};
const DEGEL = {
  water: ['#B9CCC8', '#6E8A86'], floor: '#C9CFB8', motes: 'rgba(255, 255, 255, 0.7)', snow: '#EEF2F6',
  pond: '#5E92A8', bank: '#8A9478', sand: '#CFCBB0', leaf: ['#1E4A34', '#2E6040', '#467A52'], rock: '#9A948A',
  bush: ['#4E6E46', '#62824E', '#7E9A62'], tallGrass: ['#A8A06A', '#C8BE8A'], tuft: ['#8E9A62', '#A8AE7A'],
  dirt: 'rgba(140, 115, 80, 0.6)', hideBase: 'rgba(150, 140, 90, 0.35)', thatch: '#C2A060',
};
const PRINTEMPS = {
  water: ['#7FB0A0', '#3A6A5A'], floor: '#8FB25E', motes: 'rgba(255, 250, 200, 0.5)',
  pond: '#3E8EB8', bank: '#7A8A4A', sand: '#C9B07A', leaf: ['#2E5E2A', '#3E7A34', '#5E9A44'], rock: '#9A928A',
  bush: ['#3A6A2E', '#4E8A3A', '#6AA448'], tallGrass: ['#7A9A3A', '#A8B85A'], berries: '#C8302A', fruit: '#E2443A',
  flowers: ['#F2E25A', '#FFFFFF', '#E86A9A', '#8A6AD8'], thatch: '#C9A860',
  dirt: 'rgba(160, 130, 85, 0.6)', hideBase: 'rgba(120, 140, 50, 0.3)', pen: 'rgba(150, 125, 70, 0.3)',
};

/* L'histoire, en cinq chapitres */
const chapters = [
  {
    title: 'La meute de la steppe',
    ago: [0.04, 0.035],
    form: 'th-louveteau',
    skin: { body: '#8E8A86', belly: '#EFEAE0', dark: '#3E3A36', stripe: '#6A6662' },
    size: [36, 36],
    pack: 5,                         // la meute à rassembler, 5 loups au plus (jauge en haut de l'écran)
    vision: 1.2,
    fog: 0.55,
    palette: { ...GLACE, floor: '#DCE6EC' },
    species: { 'loup-solitaire': 5, campagnol: 6, lievre: 6, marmotte: 4, renne: 3, bison: 1, 'cerf-geant': 1, 'rhino-laineux': 1, mammouth: 1, 'hyene-des-cavernes': 4, 'lion-des-cavernes': 2 },
    unlock: ['flair', 'hurlement'],
    intro: "Brrr ! C'est l'âge de glace. Tu es un louveteau, tout seul dans la steppe. Cinq loups solitaires se cachent très loin d'ici, chacun dans les hautes herbes… et des hyènes ou des lions montent la garde ! Faufile-toi jusqu'à eux sans te faire voir, et sans courir : ils sont timides. Touche-les, ils te suivront. Avec 3 loups, ta meute peut attaquer un renne. Avec 5, même un mammouth !",
    missions: [
      { type: 'pack', species: 'loup-solitaire', n: 3 },
      { type: 'eat', species: 'renne', n: 3, text: 'Attaque 3 rennes avec ta meute' },
      { type: 'evolve', part: 'hurlement' },
      { type: 'pack', species: 'loup-solitaire', n: 5 },
      { type: 'eat', species: 'rhino-laineux', n: 1, text: 'Attaque un rhinocéros laineux' },
      { type: 'eat', species: 'mammouth', n: 1, text: 'Attaque un mammouth laineux' },
    ],
    tips: [
      "Les loups solitaires sont cachés loin, dans les hautes herbes. Tu ne les sens que de près… ou quand le vent porte leur odeur : suis vite la flèche !",
      "Évolue le Flair : tu sentiras les loups de plus loin, et plus souvent.",
      "Les gardiens ne voient que devant eux : passe derrière, ou cache-toi dans les herbes. Ne cours pas, ça s'entend !",
      "Un loup solitaire a peur si tu fonces, ou si on te poursuit. Approche-le doucement.",
      "Avec 3 loups, les hyènes te laissent tranquille. Avec 5, même le lion s'enfuit !",
      "Au-dessus de chaque grosse bête, tu vois combien de loups il faut : 3 pour le renne, 4 pour le bison et le cerf géant, 5 pour le rhinocéros et le mammouth.",
      "Le rhinocéros et le mammouth se défendent ! Quand tu vois le « ! », écarte-toi : ta meute continue de mordre pendant ce temps.",
    ],
  },
  {
    title: "L'odeur du feu",
    ago: [0.032, 0.03],
    form: 'th-loup-joueur',
    skin: { body: '#8A8682', belly: '#ECE6DA', dark: '#3A3632', stripe: '#66625E' },
    size: [58, 58],
    trust: true,
    treat: 'os',
    vision: 1.2,
    fog: 0.55,
    palette: { ...GLACE, floor: '#D6E0E6' },
    species: { humain: 4, chasseur: 3, lievre: 8, marmotte: 6, renne: 2, bison: 2, 'hyene-des-cavernes': 4, 'lion-des-cavernes': 2, 'rhino-laineux': 1 },
    unlock: ['pelage-epais', 'calme'],
    intro: "Tu as grandi, et tu pars seul explorer. Une drôle d'odeur flotte dans l'air : de la fumée, et de la viande grillée ! Ce sont les humains, autour de leur feu. Ils ne te connaissent pas : si tu marches vers eux, ils te chasseront. Reste près du camp sans bouger, sans foncer… et laisse-les s'habituer à toi.",
    missions: [
      { type: 'evolve', part: 'pelage-epais' },
      { type: 'trust', species: 'humain', n: 70, text: 'Approche les humains : confiance 70 %' },
      { type: 'evolve', part: 'calme' },
      { type: 'eat', species: 'os', n: 10, text: 'Mange 10 os lancés par les humains' },
    ],
    tips: [
      "Tu vois la jauge 🤝 ? C'est la confiance des humains. Elle monte quand tu restes près d'eux sans bouger : si tu marches, elle monte à peine.",
      "Loin du camp, les hyènes et les lions rôdent : ils sont plus nombreux, ouvre l'œil !",
      "Quand ils te connaissent un peu, les humains te lancent des os : miam !",
      "Près du feu des humains, les chasseurs n'osent pas venir… quand les humains te font confiance.",
    ],
  },
  {
    title: 'Le loup qui aide',
    ago: [0.028, 0.025],
    form: 'th-loup-joueur',
    skin: { body: '#A89A86', belly: '#F2EADC', dark: '#4A4034', stripe: '#7A6E5E' },
    size: [62, 62],
    trust: true,
    treat: 'os',
    vision: 1.25,
    fog: 0.5,
    palette: { ...GLACE, floor: '#D2DCDF', motes: 'rgba(255, 255, 255, 0.85)' },
    species: { humain: 4, chasseur: 3, enfant: 2, lievre: 10, marmotte: 6, saiga: 8, renne: 5, 'lion-des-cavernes': 4, 'hyene-des-cavernes': 4, mammouth: 1 },
    unlock: ['aboiement', 'endurance'],
    intro: "Désormais, tu vis près des humains. Ils ont besoin de toi ! Avec ton flair, tu trouves les rennes pour les chasseurs. Et la nuit, les lions des cavernes rôdent autour du camp… Apprends à aboyer pour les faire fuir !",
    missions: [
      { type: 'evolve', part: 'aboiement' },
      { type: 'bark', species: 'renne', n: 6, text: 'Aboie pour montrer 6 rennes aux chasseurs' },
      { type: 'bark', species: 'lion-des-cavernes', n: 5, text: 'Fais fuir 5 lions des cavernes' },
      { type: 'trust', species: 'humain', n: 100, text: 'Deviens l’ami des humains : 100 %' },
    ],
    tips: [
      "Appuie sur B (ou sur le bouton Aboie) : les lions et les hyènes s'enfuient !",
      "Un renne en vue ? Aboie : les chasseurs sauront où il est.",
      "Chaque bonne action te rapporte de l'ADN 🧬 pour évoluer.",
    ],
  },
  {
    title: 'Le premier chien',
    ago: [0.015, 0.012],
    form: 'th-chien',
    skin: { body: '#C8A070', belly: '#F8E8CE', dark: '#5A3E1E', stripe: '#9A7448' },
    size: [62, 62],
    trust: true,
    treat: 'os',
    vision: 1.3,
    fog: 0.45,
    palette: DEGEL,
    species: { humain: 4, chasseur: 2, enfant: 7, lievre: 10, marmotte: 8, bouquetin: 8, renne: 3, 'hyene-des-cavernes': 4, 'lion-des-cavernes': 2 },
    unlock: ['oreilles-tombantes', 'queue-tire-bouchon'],
    intro: "Des milliers d'années ont passé. Tes descendants vivent avec les humains, génération après génération… et leur corps change : tu n'es plus tout à fait un loup. Tu es devenu un chien ! Les enfants veulent jouer avec toi.",
    missions: [
      { type: 'evolve', part: 'oreilles-tombantes' },
      { type: 'play', species: 'enfant', n: 6 },
      { type: 'evolve', part: 'queue-tire-bouchon' },
      { type: 'eat', species: 'os', n: 12, text: 'Mange 12 friandises des humains' },
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
    form: 'th-berger',
    skin: { body: '#B0703A', belly: '#F8EADA', dark: '#4A2A12', stripe: '#8A5228', patch: '#FBF6EC' },
    size: [66, 66],
    start: { x: 7300, y: 4000 },     // on arrive devant la porte de l'enclos
    shepherd: 'berger-enclos',
    trust: true,
    treat: 'os',
    vision: 1.35,
    fog: 0.4,
    palette: PRINTEMPS,
    species: { humain: 3, chasseur: 2, enfant: 2, mouton: 12, chevre: 6, lievre: 6, chevreuil: 7, 'loup-sauvage': 6, aurochs: 1 },
    unlock: ['pelage-tachete', 'instinct-berger'],
    intro: "La glace a fondu : partout, l'herbe et les forêts repoussent. Les humains construisent des villages, ils sèment des graines… et ils élèvent des moutons et des chèvres ! Ton travail : pousser le troupeau jusqu'à la porte du grand enclos, où le berger l'attend, et éloigner les loups sauvages.",
    missions: [
      { type: 'evolve', part: 'pelage-tachete' },
      { type: 'herd', species: 'mouton', n: 12, text: 'Fais entrer 12 moutons par la porte' },
      { type: 'evolve', part: 'instinct-berger' },
      { type: 'bark', species: 'loup-sauvage', n: 6, text: 'Éloigne 6 loups sauvages en aboyant' },
      { type: 'herd', species: 'chevre', n: 6, text: 'Fais entrer 6 chèvres par la porte' },
    ],
    tips: [
      "Les moutons s'écartent devant toi : place-toi derrière eux pour les pousser vers la porte 🚪",
      "La barrière arrête les moutons : fais-les passer par la porte, là où attend le berger.",
      "Un loup sauvage rôde près du troupeau ? Aboie !",
      "Les chèvres sont plus rapides que les moutons : vas-y doucement.",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Tu es tout seul, petit louveteau… Les loups solitaires se cachent très loin, gardés par des hyènes et des lions. Faufile-toi jusqu'à eux, tout doucement !",
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
  goal: "Tu es un louveteau de l'âge de glace. <b>Rassemble ta meute, apprivoise les humains… et deviens leur meilleur ami</b> :<br>🐺 le louveteau → 🔥 le loup près du feu → 🐕 le premier chien → 🐑 le chien de berger !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
