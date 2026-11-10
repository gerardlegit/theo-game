// ============================================================================
// NIVEAU 4 — LA VOIE DES HUMAINS
//
// Du premier feu (il y a 800 000 ans) aux villages fortifiés (il y a 7 000
// ans). Ici, on ne mange plus les animaux : on maîtrise des techniques, une
// à une, et chacune rend les humains un peu plus forts que la nature.
// Le monde est en VUE DE TROIS QUARTS (world.view = 'tqv', voir tqv.js) : le
// sol vu d'en haut, les humains, les animaux, les arbres et les huttes
// debout. C'est toujours la même vallée, et le village y grandit de chapitre
// en chapitre : ce qu'on a construit reste.
//   1. Le premier feu : rapporter le feu de l'arbre frappé par la foudre, se
//      réchauffer, faire fuir les hyènes de la nuit avec une torche.
//   2. Le maître des chasseurs : tailler le silex, inventer la lance, former
//      une troupe et chasser le mammouth ; peindre la grotte.
//   3. Le premier village : construire des huttes, un enclos, apprivoiser
//      les mouflons (l'élevage).
//   4. Les premiers champs : semer le blé, l'arroser, le récolter (l'agriculture).
//   5. La palissade : protéger le village des pillards des autres villages.
// On gagne des idées 💡 (en ramassant, en construisant, en chassant) pour
// inventer. Le moteur (script.js) ne connaît aucune espèce par son nom.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La vallée : la rivière, la grotte, les forêts… et le village, au milieu */
const world = {
  view: 'tqv',
  ground: 'land',
  w: 9000,
  h: 7000,
  start: { x: 4560, y: 3760 },
  village: { x: 4500, y: 3600 },
  villageR: 1150,                   // le rayon de la palissade (chapitre 5)
  noGrow: true,
  noEat: true,                      // on ne mange plus les animaux : on invente
  maxChasers: 3,
  noise: 460,
  penalty: { adn: 0.25, growth: 0 },
  currency: {
    icon: '💡', name: 'idées', verb: 'Inventer', order: 'Invente', many: 'inventions', later: 'Plus tard',
    tag: 'Nouvelle invention !', sub: 'Choisis ce que ta tribu va inventer :', stat: 'inventions',
  },
  meter: {
    zone: 'feu', icon: '🔥', low: 'cold', out: 'frozen', refill: 'Aaah, il fait chaud !', dead: 'Gelé !',
    title: 'Ta chaleur : la nuit, il fait très froid. Reste près du feu !',
  },
  res: [
    { id: 'bois', name: 'Bois' },
    { id: 'silex', name: 'Silex', from: 2 },
    { id: 'ocre', name: 'Ocre', from: 2, to: 2 },
    { id: 'ble', name: 'Blé', from: 4 },
  ],
  land: {
    riverX: 2650, riverW: 210, caveDx: 500, caveDy: -1950, fireTree: [-860, -430],
    forests: 11, rocks: 42, flint: 22, ochre: 7, wheat: 30, meadow: [-1650, 1800], bushes: 64, woodNear: 12,
  },
  // ce qu'on peut construire, et où (par rapport au foyer, au centre du village)
  sites: [
    { id: 'foyer', type: 'foyer', name: 'Le foyer', ch: 1, at: [0, 0], cost: { feu: 1, bois: 3 }, planR: 70, adn: 20 },
    { id: 'feu-1', type: 'feu', name: 'Feu de garde', ch: 1, at: [0, -540], need: 'feu', cost: { bois: 4 }, planR: 55 },
    { id: 'feu-2', type: 'feu', name: 'Feu de garde', ch: 1, at: [470, 280], need: 'feu', cost: { bois: 4 }, planR: 55 },
    { id: 'feu-3', type: 'feu', name: 'Feu de garde', ch: 1, at: [-470, 280], need: 'feu', cost: { bois: 4 }, planR: 55 },
    { id: 'peinture', type: 'peinture', name: 'Les peintures', ch: 2, at: 'grotte', need: 'silex', cost: { ocre: 5 }, planR: 100, adn: 25 },
    { id: 'hutte-1', type: 'hutte', name: 'Une hutte', ch: 3, at: [-330, -190], need: 'hutte', cost: { bois: 8 }, planR: 95 },
    { id: 'hutte-2', type: 'hutte', name: 'Une hutte', ch: 3, at: [330, -210], need: 'hutte', cost: { bois: 8 }, planR: 95 },
    { id: 'hutte-3', type: 'hutte', name: 'Une hutte', ch: 3, at: [70, -340], need: 'hutte', cost: { bois: 8 }, planR: 95 },
    { id: 'hutte-4', type: 'hutte', name: 'Une hutte', ch: 3, at: [160, 370], need: 'hutte', cost: { bois: 8 }, planR: 95 },
    { id: 'enclos', type: 'enclos', name: "L'enclos", ch: 3, at: [770, -130], r: 240, gate: Math.PI, need: 'elevage', cost: { bois: 12 }, planR: 130, adn: 20 },
    { id: 'champ-1', type: 'champ', name: 'Un champ', ch: 4, at: [-730, -140], need: 'agriculture', cost: { ble: 2 }, planR: 110 },
    { id: 'champ-2', type: 'champ', name: 'Un champ', ch: 4, at: [-730, 140], need: 'agriculture', cost: { ble: 2 }, planR: 110 },
    { id: 'champ-3', type: 'champ', name: 'Un champ', ch: 4, at: [-990, -140], need: 'agriculture', cost: { ble: 2 }, planR: 110 },
    { id: 'champ-4', type: 'champ', name: 'Un champ', ch: 4, at: [-990, 140], need: 'agriculture', cost: { ble: 2 }, planR: 110 },
    { id: 'grenier', type: 'grenier', name: 'Le grenier', ch: 4, at: [-260, 530], need: 'agriculture', cost: { bois: 10 }, planR: 95, adn: 20 },
    { id: 'palissade', type: 'palissade', name: 'La palissade', ch: 5, ring: 12, gate: Math.PI / 2, need: 'palissade', cost: { bois: 3 }, adn: 6 },
    { id: 'porte', type: 'porte', name: 'La grande porte', ch: 5, angle: Math.PI / 2, need: 'palissade', cost: { bois: 8 }, planR: 110, adn: 20 },
    { id: 'tour-1', type: 'tour', name: 'Une tour de guet', ch: 5, at: [-930, 430], need: 'tour', cost: { bois: 8, silex: 3 }, planR: 70 },
    { id: 'tour-2', type: 'tour', name: 'Une tour de guet', ch: 5, at: [930, 430], need: 'tour', cost: { bois: 8, silex: 3 }, planR: 70 },
  ],
  decor: [],
};

/* Les êtres vivants (kind 'tribu' = les gens de ta tribu ; 'pillard' = ceux qui attaquent le village ;
   fieldRaider = il vient manger le blé des champs ; tough = il ne recule qu'au deuxième coup de lance ;
   tag = l'étiquette de sa fiche) */
const species = {
  /* ---- Ta tribu ---- */
  'tribu-erectus': {
    name: 'Ta tribu', plural: 'gens de ta tribu', kind: 'tribu', look: 'th-tribu-erectus', color: '#8A6440', noEat: true, tag: '👪 Ta famille',
    size: 26, speed: 80, sense: 0, adn: 0, proper: true,
    fact: "Homo erectus vivait en petits groupes d'une vingtaine de personnes. Ils partageaient la nourriture et prenaient soin les uns des autres.",
  },
  'tribu-chasseur': {
    name: 'Ta tribu', plural: 'gens de ta tribu', kind: 'tribu', look: 'th-tribu-chasseur', color: '#8A6440', noEat: true, tag: '👪 Ta famille',
    size: 26, speed: 80, sense: 0, adn: 0, proper: true,
    fact: "Les chasseurs-cueilleurs de l'âge de glace se déplaçaient avec les saisons, en suivant les troupeaux de rennes. Ils vivaient sous des tentes en peau.",
  },
  'tribu-village': {
    name: 'Les villageois', plural: 'villageois', kind: 'tribu', look: 'th-tribu-village', color: '#B89A6A', noEat: true, tag: '🏠 Ton village',
    size: 26, speed: 80, sense: 0, adn: 0,
    fact: "Dans les premiers villages vivaient cent ou deux cents personnes. On y fabriquait des outils, des paniers, des poteries… chacun avait son travail.",
  },
  'chasseur-seul': {
    name: 'Chasseur', plural: 'chasseurs', kind: 'stray', look: 'th-chasseur', color: '#7A5A3A', joins: 'chasseur-tribu', noEat: true, tag: '🤝 Un ami ?',
    size: 27, speed: 70, sense: 0, adn: 10,
    fact: "À l'âge de glace, on ne chassait jamais seul : les chasseurs encerclaient les grands animaux, et chacun avait son rôle.",
  },
  'chasseur-tribu': {
    name: 'Chasseur de ta troupe', plural: 'chasseurs de ta troupe', kind: 'ally', look: 'th-chasseur', color: '#7A5A3A', noEat: true, tag: '🏹 Ta troupe',
    size: 27, speed: 230, sense: 0, adn: 0,
    fact: "Les chasseurs se parlaient avec des gestes et des cris d'animaux, pour ne pas faire fuir le gibier.",
  },

  /* ---- Les animaux de la vallée ---- */
  cerf: {
    name: 'Cerf', plural: 'cerfs', kind: 'prey', look: 'th-cerf', color: '#A8783E', noEat: true,
    size: 54, speed: 250, sense: 340, adn: 8,
    fact: "Le cerf perd ses bois chaque année, et il en repousse de plus grands. Avec ces bois, les humains fabriquaient des harpons et des aiguilles !",
  },
  renne: {
    name: 'Renne', plural: 'rennes', kind: 'prey', look: 'th-renne', color: '#9A8A74', noEat: true,
    size: 58, speed: 240, sense: 330, adn: 10,
    fact: "Le renne donnait presque tout aux humains de l'âge de glace : la viande, la peau pour s'habiller, les os et les bois pour les outils.",
  },
  mammouth: {
    name: 'Mammouth laineux', plural: 'mammouths laineux', kind: 'defender', look: 'th-mammouth', color: '#6E4E32', noEat: true, hurt: 'BAOUM !',
    hp: 240, need: 4, fights: true, spear: 25,
    size: 118, speed: 170, sense: 260, adn: 45, eatLine: "Bravo ! Seul, personne n'aurait pu chasser un mammouth. Ensemble, avec vos lances, vous l'avez fait !",
    fact: "Avec un seul mammouth, toute une tribu pouvait manger pendant des semaines. Ses os servaient même à construire des huttes !",
  },
  aurochs: {
    name: 'Aurochs', plural: 'aurochs', kind: 'defender', look: 'th-aurochs', color: '#3A2A22', noEat: true,
    size: 92, speed: 200, sense: 220, adn: 0, hurt: 'BAM !',
    fact: "L'aurochs était un bœuf sauvage géant, l'ancêtre de nos vaches. Les humains l'ont apprivoisé il y a environ 10 000 ans.",
  },
  hyene: {
    name: 'Hyène des cavernes', plural: 'hyènes des cavernes', kind: 'hunter', look: 'th-hyene', color: '#A08A62', pack: 2, noEat: true,
    size: 64, speed: 230, sense: 300, cone: 2.4, adn: 0, hurt: 'Aïe !',
    fact: "La nuit, les hyènes des cavernes rôdaient autour des campements. Mais elles avaient très peur du feu !",
  },
  lion: {
    name: 'Lion des cavernes', plural: 'lions des cavernes', kind: 'hunter', look: 'th-lion', color: '#C9A46E', noEat: true, roar: true,
    size: 88, speed: 255, sense: 340, cone: 2.2, adn: 0, hurt: 'GRRR !',
    fact: "Le lion des cavernes était plus grand que les lions d'aujourd'hui. Les humains l'ont peint sur les murs de la grotte Chauvet, il y a 36 000 ans.",
  },
  ours: {
    name: 'Ours des cavernes', plural: 'ours des cavernes', kind: 'hunter', look: 'th-ours', color: '#6A4A32', noEat: true,
    size: 98, speed: 200, sense: 260, cone: 2.2, adn: 0, hurt: 'GRAOU !',
    fact: "L'ours des cavernes dormait tout l'hiver au fond des grottes. Il mangeait surtout des plantes… mais mieux valait ne pas le réveiller !",
  },
  loup: {
    name: 'Loup', plural: 'loups', kind: 'hunter', look: 'th-loup', color: '#8A8682', belly: '#E8E4DA', pack: 2, noEat: true, eatsFlock: true,
    size: 60, speed: 260, sense: 300, cone: 2.4, adn: 0, hurt: 'Aïe !',
    fact: "Les loups sauvages rôdaient autour des troupeaux. Heureusement, les humains avaient déjà un allié : le chien, un loup apprivoisé !",
  },
  mouflon: {
    name: 'Mouflon', plural: 'mouflons', kind: 'flock', look: 'th-mouflon', color: '#9A6A42', belly: '#EAD8B8', pack: 3, noEat: true,
    size: 32, speed: 220, sense: 170, adn: 0,
    fact: "Le mouflon est l'ancêtre sauvage du mouton. En l'élevant pendant des siècles, les humains ont obtenu des moutons à la laine toute douce.",
  },
  mouton: {
    name: 'Mouton', plural: 'moutons', kind: 'flock', look: 'th-mouton', color: '#E8E2D4', noEat: true,
    size: 34, speed: 180, sense: 150, adn: 0,
    fact: "Le mouton donne de la laine, du lait et de la viande. C'est l'un des tout premiers animaux de la ferme, avec la chèvre.",
  },
  sanglier: {
    name: 'Sanglier', plural: 'sangliers', kind: 'neutral', look: 'th-sanglier', color: '#5A4434', noEat: true, fieldRaider: true, tag: '🌾 Gare au blé !',
    size: 48, speed: 170, sense: 200, adn: 0,
    fact: "Le sanglier adore le blé ! Les premiers paysans devaient garder leurs champs jour et nuit. Le sanglier est l'ancêtre du cochon.",
  },
  corbeau: {
    name: 'Corbeau', plural: 'corbeaux', kind: 'neutral', look: 'th-corbeau', color: '#24242C', flying: true, noEat: true,
    size: 18, speed: 160, sense: 0, adn: 0,
    fact: "Les corbeaux suivent les humains depuis toujours : ils mangent les graines tombées dans les champs et les restes des repas.",
  },

  /* ---- Les pillards des autres villages ---- */
  pillard: {
    name: 'Pillard', plural: 'pillards', kind: 'pillard', look: 'th-pillard', color: '#5A3A2A', noEat: true, tag: '⚠️ Pillard !',
    size: 30, speed: 150, sense: 0, adn: 0, breaker: 12,
    fact: "Quand les villages ont commencé à garder des réserves de blé, certains ont voulu les voler. C'est pour cela que les villages se sont entourés de palissades.",
  },
  'chef-pillard': {
    name: 'Chef des pillards', plural: 'chefs des pillards', kind: 'pillard', look: 'th-chef-pillard', color: '#3A2418', noEat: true, tag: '⚠️ Le chef !',
    size: 36, speed: 140, sense: 0, adn: 0, breaker: 22, tough: 2,
    fact: "Les chefs portaient des plumes et des peintures pour impressionner leurs ennemis… et les ennemis faisaient pareil !",
  },
};

/* Les inventions : deux par époque. Elles se voient sur le joueur (la torche, la lance, la houe…) */
const evolutions = {
  feu: {
    name: 'Faire du feu', ch: 1, cost: 20, effect: { bark: true },
    short: 'Tu allumes du feu quand tu veux, et ta torche (touche B) fait fuir les fauves',
    fact: "Pour faire du feu, on frotte très vite deux morceaux de bois, ou on frappe deux pierres pour faire des étincelles. Le feu réchauffe, éclaire, fait fuir les bêtes… et permet de cuire la nourriture !",
  },
  vetements: {
    name: 'Vêtements de fourrure', ch: 1, cost: 40, effect: { dry: 0.5 },
    short: 'Tu as bien moins froid la nuit',
    fact: "Les humains ont inventé l'aiguille en os il y a environ 40 000 ans. Avec elle, ils cousaient des vêtements chauds, bien ajustés.",
  },
  silex: {
    name: 'Silex taillé', ch: 2, cost: 40, effect: { gather: 1.6 },
    short: 'Avec un outil tranchant, tu ramasses bien plus vite',
    fact: "En frappant un silex avec une autre pierre, on enlève des éclats : on obtient un biface, une lame coupante comme un couteau. C'est l'un des plus vieux outils du monde !",
  },
  lance: {
    name: 'Lance à pointe de silex', ch: 2, cost: 60, effect: {},
    short: 'Lance ta lance (touche F) : elle fait fuir les fauves et aide à chasser',
    fact: "Avec une lance, on chasse de loin, sans s'approcher des cornes et des griffes. Plus tard, le propulseur et l'arc lanceront encore plus loin !",
  },
  hutte: {
    name: 'Les huttes', ch: 3, cost: 50, effect: {},
    short: 'Tu sais construire des huttes : la tribu peut rester au même endroit',
    fact: "Les premières maisons étaient des huttes rondes, en branches, en peaux ou en os de mammouth. Pour la première fois, les humains restaient toute l'année au même endroit.",
  },
  elevage: {
    name: "L'élevage", ch: 3, cost: 70, effect: { herd: 1.6 },
    short: 'Tu sais construire un enclos, et tu rassembles les animaux de plus loin',
    fact: "Au lieu de chasser les animaux, les humains ont commencé à les garder près d'eux : c'est l'élevage. Plus besoin de courir après sa nourriture !",
  },
  agriculture: {
    name: "L'agriculture", ch: 4, cost: 60, effect: {},
    short: 'Tu sais semer des champs, et construire un grenier',
    fact: "Il y a 10 000 ans, des humains ont eu une idée géniale : au lieu de cueillir les graines, les planter ! C'est la naissance de l'agriculture.",
  },
  poterie: {
    name: 'La poterie', ch: 4, cost: 80, effect: {},
    short: 'Une jarre en argile : tu rapportes de l’eau de la rivière',
    fact: "En faisant cuire de l'argile dans le feu, on obtient une poterie solide. Les jarres gardaient l'eau, le lait, les graines…",
  },
  palissade: {
    name: 'La palissade', ch: 5, cost: 80, effect: {},
    short: 'Tu sais planter une palissade tout autour du village, et construire une grande porte',
    fact: "Une palissade, c'est un mur de troncs plantés serrés, taillés en pointe. Les pillards ne peuvent plus entrer… sauf s'ils la cassent !",
  },
  tour: {
    name: 'Les tours de guet', ch: 5, cost: 100, effect: { vision: 1.3 },
    short: 'Des tours de guet : les guetteurs voient les pillards arriver de loin, et les repoussent',
    fact: "Du haut d'une tour, on voit arriver les ennemis de très loin. Les guetteurs pouvaient donner l'alerte à tout le village !",
  },
};

/* Les couleurs de la vallée à chaque époque */
const NUIT = { floor: '#3E5E34', motes: 'rgba(255, 240, 200, 0.35)', water: '#2A5A7A', bank: '#5A5A3A', sand: '#8A8060', dirt: 'rgba(110, 90, 60, 0.6)', leaf: ['#1E3A22', '#2A4E2A', '#3A6234'], rock: '#7A7468', bush: ['#2A4A26', '#3A5E30', '#4E7438'], tallGrass: ['#4E6A2E', '#6A7E3A'] };
const GLACE = { floor: '#C2CEBE', motes: 'rgba(255, 255, 255, 0.9)', water: '#4E8AA8', bank: '#8A9488', sand: '#D2D8CC', dirt: 'rgba(140, 120, 90, 0.5)', leaf: ['#1E4A34', '#2A5E40', '#3A7650'], snow: '#F4F8FF', rock: '#9A968E', bush: ['#4A6A4A', '#5E7E58', '#7A9A6A'], tallGrass: ['#A8A87A', '#C8C29A'] };
const PRINTEMPS = { floor: '#7FA34E', motes: 'rgba(255, 250, 210, 0.5)', water: '#3E8EB8', bank: '#7A8A4A', sand: '#C9B07A', dirt: 'rgba(160, 130, 85, 0.6)', leaf: ['#2E5E2A', '#3E7A34', '#5E9A44'], rock: '#9A928A', berries: '#C8302A', fruit: '#E2443A', thatch: '#C9A860' };
const ETE = { floor: '#8AA850', motes: 'rgba(255, 250, 210, 0.5)', water: '#3E8EB8', bank: '#7A8A4A', sand: '#D2B87A', dirt: 'rgba(170, 135, 85, 0.65)', leaf: ['#3A6A2A', '#4E8A34', '#6EA644'], rock: '#9A928A', berries: '#7A2AA8', thatch: '#D2B060' };
const SOIR = { floor: '#7E8E48', motes: 'rgba(255, 220, 160, 0.5)', water: '#4A7A9A', bank: '#7A7A4A', sand: '#C2A070', dirt: 'rgba(150, 115, 75, 0.65)', leaf: ['#3A5A28', '#4E7232', '#6A8A3E'], rock: '#8E8478', thatch: '#C29A58' };

/* La torche : le cri du niveau (touche B), avec son bruit et ses étincelles */
const TORCHE = { icon: '🔥', name: 'Torche', cry: 'FWOUF !', sound: 'torch', ring: '#FFB36B', sparks: true };
/* La lance : le pouvoir du chasseur (touche F), à partir de l'invention de la lance */
const LANCE = { type: 'lance', name: 'Lancer', icon: '🎯', recharge: 1.3, range: 0, cry: 'HOP !', need: 'lance' };

/* L'histoire, en cinq grandes inventions */
const chapters = [
  {
    title: 'Le premier feu',
    ago: [0.8, 0.4],
    form: 'th-erectus',
    skin: { body: '#8A6440', belly: '#6E4A2A', dark: '#3A2414', tone: '#A8704A', hair: '#2A1C14' },
    size: [30, 30],
    night: true,                     // c'est la nuit : on ne voit que ce qui est près d'un feu
    dry: 1 / 55,                     // le froid : la jauge 🔥 baisse loin du feu
    bark: TORCHE,
    vision: 1,
    palette: NUIT,
    species: { 'tribu-erectus': 4, hyene: 6, lion: 1, cerf: 2 },
    unlock: ['feu', 'vetements'],
    intro: "Il y a 800 000 ans. La nuit est noire et glacée, et les hyènes rôdent autour de ta tribu. Mais regarde : la foudre a mis le feu à un arbre ! Ramasse du bois mort, va prendre une branche enflammée et rapporte le feu jusqu'au camp. Attention, loin du feu, la jauge 🔥 baisse : tu as froid !",
    missions: [
      { type: 'gather', res: 'bois', n: 8, text: 'Ramasse 8 branches de bois mort' },
      { type: 'build', what: 'foyer', n: 1, img: 'feu', text: "Rapporte le feu de l'arbre en flammes et allume le foyer" },
      { type: 'evolve', part: 'feu' },
      { type: 'build', what: 'feu', n: 3, img: 'feu', text: 'Allume 3 feux de garde autour du camp' },
      { type: 'bark', species: 'hyene', n: 6, text: 'Fais fuir 6 hyènes avec ta torche' },
      { type: 'evolve', part: 'vetements' },
    ],
    tips: [
      "Chaque chose que tu ramasses te donne une idée 💡. Avec assez d'idées, tu peux inventer !",
      "Arrête-toi sur un plan en pointillés pour construire. L'étiquette te dit ce qu'il faut.",
      "Les fauves ont peur du feu : près d'un feu, tu es à l'abri.",
      "Quand ta jauge 🔥 baisse, retourne au chaud près d'un feu.",
    ],
  },
  {
    title: 'Le maître des chasseurs',
    ago: [0.04, 0.015],
    form: 'th-chasseur',
    skin: { body: '#9A6A3A', belly: '#7A5434', dark: '#3A2414', tone: '#C68A5A', hair: '#3A2618' },
    size: [30, 30],
    pack: 5,                         // la troupe de chasseurs (la jauge en haut)
    packText: { icon: '🏹', name: 'Troupe', word: 'chasseurs', join: 'Un chasseur te rejoint !', full: 'Ta troupe est au complet !', lost: 'Un chasseur s’enfuit !', sound: 'call' },
    bark: TORCHE,
    power: { ...LANCE, intro: "Ta lance est prête ! Appuie sur F (ou sur le bouton orange) : tu la lances droit devant toi. Elle fait fuir les fauves… et avec ta troupe, elle permet de chasser les plus grosses bêtes." },
    vision: 1.25,
    palette: GLACE,
    species: { 'tribu-chasseur': 5, 'chasseur-seul': 5, renne: 6, mammouth: 1, lion: 2, ours: 1, hyene: 2 },
    unlock: ['silex', 'lance'],
    intro: "Il y a 40 000 ans, c'est l'âge de glace. Les humains sont devenus de grands chasseurs… mais les lions et les ours des cavernes sont encore plus forts qu'eux. Pour devenir le maître des chasseurs, il te faut une arme : une lance à pointe de silex. Et des amis : seul, personne ne peut chasser un mammouth !",
    missions: [
      { type: 'gather', res: 'silex', n: 10, text: 'Ramasse 10 silex au bord de la rivière' },
      { type: 'evolve', part: 'silex' },
      { type: 'evolve', part: 'lance' },
      { type: 'eat', species: 'renne', n: 3, text: 'Chasse 3 rennes avec ta lance' },
      { type: 'stun', species: 'lion', n: 3, text: 'Fais fuir 3 lions des cavernes avec ta lance' },
      { type: 'pack', species: 'chasseur-seul', n: 4, text: 'Forme une troupe de 4 chasseurs' },
      { type: 'eat', species: 'mammouth', n: 1, text: 'Chassez un mammouth tous ensemble' },
      { type: 'build', what: 'peinture', n: 1, img: 'ocre', text: 'Peins vos exploits sur la paroi de la grotte' },
    ],
    tips: [
      "Le silex se trouve au bord de la rivière et près de la grotte : il brille un peu.",
      "Les chasseurs seuls ont un anneau doré : touche-les, ils te suivent. Chacun te donne des idées 💡 !",
      "Le mammouth se défend ! Quand il baisse la tête, écarte-toi… puis lance ta lance.",
      "Pour peindre, il te faut de l'ocre : la terre rouge, au pied de la grotte.",
    ],
  },
  {
    title: 'Le premier village',
    ago: [0.012, 0.0105],
    form: 'th-villageois',
    skin: { body: '#C2A878', belly: '#A8885A', dark: '#5A4020', tone: '#B07A52', hair: '#2A1C14' },
    size: [30, 30],
    bark: TORCHE,
    power: LANCE,
    vision: 1.3,
    palette: PRINTEMPS,
    species: { 'tribu-village': 6, mouflon: 9, loup: 4, aurochs: 1, cerf: 2 },
    unlock: ['hutte', 'elevage'],
    intro: "Il y a 12 000 ans. La glace a fondu, il fait plus doux. Ta tribu en a assez de marcher sans arrêt : elle veut rester ici, au bord de la rivière. Construis des huttes, puis un enclos… et ramène-y les mouflons sauvages. Au lieu de les chasser, vous allez les élever !",
    missions: [
      { type: 'evolve', part: 'hutte' },
      { type: 'build', what: 'hutte', n: 4, img: 'bois', text: 'Construis 4 huttes pour la tribu' },
      { type: 'evolve', part: 'elevage' },
      { type: 'build', what: 'enclos', n: 1, img: 'bois', text: 'Construis un enclos' },
      { type: 'herd', species: 'mouflon', n: 8, text: "Fais entrer 8 mouflons dans l'enclos" },
      { type: 'bark', species: 'loup', n: 4, text: 'Chasse 4 loups loin du troupeau (torche)' },
    ],
    tips: [
      "Il faut beaucoup de bois pour construire : les tas de bois mort sont au bord des forêts.",
      "Les mouflons s'écartent devant toi : place-toi derrière eux pour les pousser vers la porte de l'enclos.",
      "Un loup approche du troupeau ? Ta torche (B) le fait fuir.",
    ],
  },
  {
    title: 'Les premiers champs',
    ago: [0.01, 0.0085],
    form: 'th-paysan',
    skin: { body: '#D2B888', belly: '#B89A6A', dark: '#5A4020', tone: '#C68A5A', hair: '#4A2E1A' },
    size: [30, 30],
    bark: TORCHE,
    power: LANCE,
    vision: 1.3,
    palette: ETE,
    penned: { species: 'mouton', n: 6 },
    species: { 'tribu-village': 8, sanglier: 2, corbeau: 3, cerf: 2 },
    unlock: ['agriculture', 'poterie'],
    intro: "Il y a 10 000 ans. Dans la prairie pousse du blé sauvage. Et si, au lieu de le cueillir, on le plantait ? Cueille des épis, invente l'agriculture et sème des champs. Puis invente la poterie : avec une jarre, tu rapporteras l'eau de la rivière pour arroser. Mais gare aux sangliers : ils adorent le blé !",
    missions: [
      { type: 'gather', res: 'ble', n: 10, text: 'Cueille 10 épis de blé sauvage' },
      { type: 'evolve', part: 'agriculture' },
      { type: 'build', what: 'champ', n: 4, img: 'ble', text: 'Sème 4 champs' },
      { type: 'evolve', part: 'poterie' },
      { type: 'deliver', item: 'eau', n: 6, text: "Arrose les champs : 6 jarres d'eau" },
      { type: 'harvest', n: 18, text: 'Récolte 18 gerbes de blé' },
      { type: 'build', what: 'grenier', n: 1, img: 'bois', text: 'Construis le grenier' },
    ],
    tips: [
      "Le blé sauvage pousse dans la prairie, au sud-ouest du village.",
      "Un champ qui a soif montre une goutte d'eau : va remplir ta jarre à la rivière.",
      "Un sanglier dans les champs ? Fonce dessus (Espace), ou fais-le fuir avec ta torche !",
    ],
  },
  {
    title: 'La palissade',
    ago: [0.007, 0.005],
    form: 'th-chef',
    skin: { body: '#C2A878', belly: '#8A6A4A', dark: '#5A3A22', tone: '#A8704A', hair: '#1C1411' },
    size: [30, 30],
    zoom: 0.85,
    bark: TORCHE,
    power: { ...LANCE, recharge: 1.1 },
    vision: 1.35,
    palette: SOIR,
    penned: { species: 'mouton', n: 8 },
    species: { 'tribu-village': 10, corbeau: 2, cerf: 2 },
    raids: { after: 2, species: 'pillard', chief: 'chef-pillard', waves: [3, 5, 8], gap: 26, first: 8 },
    unlock: ['palissade', 'tour'],
    intro: "Il y a 7 000 ans. Ton village est riche : des champs, des troupeaux, un grenier plein de blé… Ça fait des envieux ! Les pillards d'un autre village préparent une attaque. Tu es le chef : plante une palissade tout autour du village, construis la grande porte et des tours de guet. Puis repousse les attaques !",
    missions: [
      { type: 'evolve', part: 'palissade' },
      { type: 'build', what: 'palissade', n: 12, img: 'bois', text: 'Plante la palissade tout autour du village' },
      { type: 'build', what: 'porte', n: 1, img: 'bois', text: 'Construis la grande porte' },
      { type: 'evolve', part: 'tour' },
      { type: 'build', what: 'tour', n: 2, img: 'bois', text: 'Construis 2 tours de guet' },
      { type: 'defend', species: 'pillard', n: 3, text: 'Repousse les 3 attaques des pillards' },
    ],
    tips: [
      "Chaque morceau de palissade coûte 3 bois : fais le tour du village en suivant les pointillés.",
      "Les pillards tapent sur la palissade pour la casser : lance ta lance (F) pour les faire fuir pour de bon !",
      "Ta torche (B) fait reculer les pillards… mais ils reviennent vite. La lance, elle, les renvoie chez eux.",
      "Un morceau de palissade est cassé ? Arrête-toi devant pour le réparer.",
      "Les tours de guet lancent des lances sur les pillards qui approchent.",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau (ces phrases remplacent celles de data.js) */
const lines = {
  start: "Bloub ! Te voilà humain… mais il fait nuit noire, et froid. Touche les tas de bois mort pour les ramasser : il te faut du feu !",
  // le froid de la nuit (la jauge 🔥)
  cold: [
    "Brrr… Tu as froid ! Retourne vite près d'un feu 🔥",
    "Tes doigts gèlent ! Vite, au chaud près du feu !",
  ],
  frozen: [
    "Oh non, tu as eu trop froid… Quelqu'un d'autre de ta tribu prend ta place, près du feu.",
    "Gelé ! La nuit, ne t'éloigne pas trop longtemps du feu.",
  ],
  eaten: [
    "Aïe ! Un fauve t'a attrapé… Quelqu'un d'autre de ta tribu prend la relève !",
    "Ouille ! Tu as perdu des idées 💡… Va vite les ramasser, si elles sont encore là !",
    "Croqué ! Heureusement, ta tribu est là : quelqu'un d'autre prend ta place.",
  ],
  resume: [
    "Bloub ! Te revoilà ! Ta tribu t'attendait.",
    "Re-bonjour ! On continue à inventer ?",
  ],
  spotted: [
    "Attention, un fauve t'a vu ! Recule vers le feu !",
    "Danger ! Cours vers un feu, ou fais-le fuir avec ta torche !",
    "Il arrive ! Vite, près du feu !",
  ],
  hidden: [
    "Chut… Dans les hautes herbes, il ne te voit plus.",
    "Bien caché ! Les fauves ne te voient plus.",
  ],
  idle: [
    "Tu dors ? Il y a du bois à ramasser et des choses à construire !",
    "Allez ! Ta tribu compte sur toi.",
  ],
  jokes: [
    "Tu sais quoi ? Il a fallu des centaines de milliers d'années pour passer du premier feu aux villages. Ici, ça va plus vite !",
    "Les humains ne sont ni les plus forts, ni les plus rapides. Leur force, c'est de s'entraider… et d'avoir des idées !",
    "Une invention en amène une autre : avec le feu, on cuit l'argile ; avec l'argile, on fait des jarres…",
    "Moi, Ammo, je suis une ammonite : je n'ai jamais rien inventé. Mais je suis très fière de toi !",
    "Chaque invention se transmet : les parents l'apprennent à leurs enfants, qui l'améliorent encore.",
  ],
  canEvolve: "Tu as assez d'idées pour inventer quelque chose ! Appuie sur 💡 Inventer.",
  chapterDone: "Ta tribu a réussi « {t} ». Mais les humains n'arrêtent jamais d'inventer… Leurs enfants, puis leurs petits-enfants, vont aller encore plus loin !",
  // ramasser, porter, construire
  gather_bois: "Bravo ! Chaque branche ramassée te donne aussi une idée 💡. Le tas repoussera plus tard.",
  gather_silex: "Du silex ! Une pierre très dure : en la frappant, on fait des éclats coupants comme des couteaux.",
  gather_ocre: "De l'ocre : une terre rouge. Écrasée et mélangée à de l'eau, elle devient de la peinture !",
  gather_ble: "Des épis de blé sauvage ! Dedans, il y a des graines… qu'on peut manger, ou semer.",
  fireTaken: "Tu as pris le feu ! Rapporte-le vite au camp, jusqu'au plan du foyer. Les fauves n'osent pas approcher.",
  waterTaken: "Ta jarre est pleine d'eau ! Va arroser un champ qui a soif.",
  needInvent: "Pour construire ça, il faut d'abord inventer : {x}. Appuie sur 💡 Inventer !",
  missing: "Il te manque quelque chose : regarde l'étiquette du plan, et suis la flèche pour le trouver.",
  built_foyer: "Le feu brûle au milieu du camp ! Il réchauffe, il éclaire… et les fauves ont peur de lui. Ta tribu est sauvée !",
  built_feu: "Un feu de garde ! Plus il y a de feux, plus le camp est à l'abri.",
  built_peinture: "Magnifique ! Sur la paroi : tes chasseurs et le mammouth. Ces peintures vont traverser des dizaines de milliers d'années !",
  built_hutte: "Une hutte ! Un toit pour dormir au chaud, à l'abri de la pluie et du vent.",
  built_enclos: "L'enclos est prêt ! Maintenant, ramène les mouflons dedans : place-toi derrière eux et pousse-les vers la porte.",
  built_champ: "Tu as semé un champ ! Pour que le blé pousse, il faudra l'arroser.",
  built_grenier: "Le grenier est plein ! Avec des réserves de blé, plus personne n'a faim en hiver.",
  built_palissade: "Un morceau de palissade de plus ! Continue tout autour du village.",
  built_porte: "La grande porte est construite ! Les amis passent… les pillards, eux, restent dehors. Attention, les voilà !",
  built_tour: "Une tour de guet ! Du haut, le guetteur voit les pillards arriver… et il leur lance des lances.",
  // les champs
  watered: "Arrosé ! Regarde bien : le blé va pousser.",
  ripe: "Le blé est mûr ! Va vite le récolter avant les sangliers.",
  harvest: "Quelle récolte ! Les graines de blé, on les écrase pour faire de la farine… puis des galettes !",
  fieldEaten: "Oh non, un sanglier mange le blé ! Fonce dessus (Espace) ou fais-le fuir avec ta torche !",
  // les pillards
  raid: "Les pillards attaquent ! Ils veulent voler le blé du grenier. Lance ta lance (F) pour les repousser !",
  raidRepelled: "Attaque repoussée ! Mais ils reviendront… Répare vite la palissade.",
  raidsDone: "Bravo, chef ! Les pillards ont compris : ton village est bien trop fort pour eux.",
  raidLost: "Les pillards sont repartis avec du blé… Ils vont revenir ! La prochaine fois, repousse-les avant qu'ils arrivent au grenier.",
  looted: "Ils pillent le grenier ! Vite, repousse-les !",
  wallBroken: "La palissade est cassée ! Les pillards entrent… Répare-la vite : arrête-toi devant.",
  spearHit: "Touché ! Avec une lance, on fait fuir les plus grands fauves… de loin !",
  // la troupe de chasseurs (chapitre 2)
  packTitle: "Ta troupe de chasseurs : touche les chasseurs entourés d'un anneau doré pour qu'ils te suivent",
  packJoin: "Un chasseur de plus dans ta troupe ! Ensemble, vous êtes plus forts que le plus gros des animaux.",
  packSmall: "Ce mammouth est bien trop fort pour toi tout seul ! Regarde au-dessus de lui : il vous faut plus de chasseurs.",
  huntGo: "Ouh-ouh ! Toute la troupe attaque : lancez vos lances, et attention quand il charge !",
  packLost: "Oh non, un chasseur de ta troupe a eu peur et s'est enfui ! Va vite le rechercher.",
  strayChased: "Il a peur des fauves qui te poursuivent ! Sème-les d'abord, puis reviens.",
  // l'élevage (chapitre 3)
  penned: "Bravo ! Le mouflon est dans l'enclos. Va chercher les autres : place-toi derrière eux et pousse-les vers la porte.",
  flockEaten: "Un loup a attrapé un mouflon ! Fais-le fuir avec ta torche (B) !",
  defender: "Il baisse la tête… Il va charger ! Écarte-toi !",
  horned: "Aïe ! Ce géant sait se défendre !",
  roar: [
    "Il rugit ! Recule vers le feu !",
    "GRRR ! Ne reste pas là !",
  ],
  pack: "Une meute ! Recule vers un feu, ou sors ta torche !",
};

/* La fin : les villages deviennent des villes… le début des civilisations */
const ending = {
  scene: 'civilisation',
  title: 'Les bâtisseurs de civilisations',
  sub: "Le feu, les outils, les villages, les champs, les troupeaux… En quelques milliers d'années, les humains ont changé la Terre entière. Bientôt viendront les villes, la roue, l'écriture… et l'Histoire commence !",
  done: 'Tu as bâti une civilisation',
  captions: [
    [0.4, 5, "Ton village est bien à l'abri derrière sa palissade. Les champs sont pleins de blé, les troupeaux grandissent…"],
    [5.4, 10, "Des milliers d'années passent. Les villages deviennent des villes, avec des maisons de briques, des temples et des marchés."],
    [10.4, 15.4, "Le feu, les outils, les champs, la roue, l'écriture… Les humains sont devenus les maîtres de la nature. À eux, maintenant, d'en prendre soin !"],
  ],
  // le défilé des inventions (draw = un dessin à la place de l'emoji)
  parade: [
    { icon: '🔥', name: 'Le feu' }, { draw: 'biface', name: 'Les outils' }, { icon: '🎨', name: 'Les peintures' },
    { icon: '🏠', name: 'Les maisons' }, { icon: '🐑', name: "L'élevage" }, { icon: '🌾', name: "L'agriculture" },
    { icon: '🏺', name: 'La poterie' }, { draw: 'roue', name: 'La roue' }, { icon: '📜', name: "L'écriture" },
  ],
  choices: [
    {
      id: 'villes', icon: '🏛️', title: 'Les premières villes',
      text: "Et ensuite ? Les premières villes, les pyramides, l'écriture… L'Histoire commence !",
      level: 'premieres-villes',
      soon: 'Niveau 5 : Les premières villes',
      fact: "L'écriture a été inventée il y a environ 5 000 ans, en Mésopotamie, pour compter les sacs de blé dans les greniers. C'est la fin de la Préhistoire !",
    },
  ],
};

export default {
  id: 'voie-des-humains',
  name: 'La voie des humains',
  num: 4,
  icon: '🔥',
  intro: 'humains',
  goal: "Tu es un humain de la préhistoire. <b>Maîtrise le feu, taille le silex, construis un village, élève des animaux, sème des champs… et bâtis une civilisation</b> :<br>🔥 le feu → 🎯 la lance → 🏠 le village → 🌾 les champs → 🛡️ la palissade !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
