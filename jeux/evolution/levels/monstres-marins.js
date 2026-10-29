// ============================================================================
// NIVEAU 2 (version mer) — LES MONSTRES MARINS
//
// Pendant que les dinosaures règnent sur la terre, la mer appartient aux
// reptiles marins géants : nothosaures, ichthyosaures, plésiosaures,
// pliosaures et, à la fin, les terribles mosasaures. Du Trias (il y a 245
// millions d'années) jusqu'à la météorite, il y a 66 millions d'années.
// Ce sont des reptiles : ils respirent de l'air ! Il faut remonter à la
// surface (les taches de lumière) pendant que les monstres rôdent.
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : la haute mer, avec des forêts d'algues pour se cacher et des taches
   de lumière où l'on remonte respirer */
const world = {
  w: 12000,
  h: 8000,
  start: { x: 6000, y: 4000 },
  maxChasers: 4,
  speed: 1.3,                      // les reptiles marins nagent plus vite que les poissons du niveau 1
  noise: 560,                      // un sprint s'entend jusque-là : les chasseurs se retournent
  penalty: { adn: 0.3, growth: 0.06 },
  // la jauge d'air : elle baisse sous l'eau, on la remplit à la surface
  meter: {
    zone: 'air', icon: '🐳', low: 'air', out: 'drowned', refill: 'Aaah, de l’air !', dead: 'Plus d’air !',
    title: "Ta réserve d'air : tu es un reptile, tu respires de l'air ! Remonte à la surface, dans les taches de lumière.",
  },
  decor: [
    { type: 'surface', count: 46, r: [170, 360], zone: 'air', atStart: true },
    { type: 'algues', count: 70, r: [110, 380], hide: true },
    { type: 'rocher', count: 110, r: [16, 80] },
    { type: 'eponge', count: 60, r: [14, 38] },
    { type: 'corail', count: 50, r: [22, 64] },
    { type: 'crinoide', count: 40, r: [24, 58], to: 3 },
    { type: 'os', count: 30, r: [40, 90], from: 2 },
  ],
};

/* Les êtres vivants. En plus des autres niveaux : eatLine = ce que dit Ammo
   la première fois qu'on en croque un. */
const species = {
  /* ---- Les rivaux : des animaux de ton espèce, qui te piquent ta nourriture (un par chapitre) ---- */
  'cousin-nothosaure': {
    name: 'Nothosaure rival', plural: 'nothosaures rivaux', kind: 'rival', look: 'nothosaure', color: '#6F9C8E',
    size: 28, speed: 165, sense: 300, adn: 6,
    fact: "Les animaux d'une même espèce se disputent souvent la nourriture : c'est la compétition ! Les plus rapides mangent les premiers.",
  },
  'cousin-ichthyosaure': {
    name: 'Ichthyosaure rival', plural: 'ichthyosaures rivaux', kind: 'rival', look: 'ichthyosaure', color: '#7B8FB0',
    size: 52, speed: 220, sense: 340, adn: 10,
    fact: "Les ichthyosaures vivaient peut-être en groupes, comme les dauphins… mais à table, c'était chacun pour soi !",
  },
  'cousin-pliosaure': {
    name: 'Pliosaure rival', plural: 'pliosaures rivaux', kind: 'rival', look: 'pliosaure', color: '#8A7F9E',
    size: 85, speed: 280, sense: 400, adn: 14,
    fact: "Les animaux d'une même espèce se disputent souvent la nourriture : c'est la compétition ! Les plus rapides mangent les premiers.",
  },
  'grand-pliosaure': {
    name: 'Grand pliosaure rival', plural: 'grands pliosaures rivaux', kind: 'rival', look: 'pliosaure', color: '#9E6A60',
    size: 135, speed: 340, sense: 460, adn: 20,
    fact: "Les animaux d'une même espèce se disputent souvent la nourriture : c'est la compétition ! Les plus rapides mangent les premiers.",
  },
  'cousin-mosasaure': {
    name: 'Jeune mosasaure', plural: 'jeunes mosasaures', kind: 'rival', look: 'mosasaure', color: '#5F7F70',
    size: 205, speed: 400, sense: 520, adn: 30,
    fact: "On a retrouvé des mosasaures avec des morsures d'autres mosasaures : ils se battaient pour la nourriture !",
  },

  /* ---- Chapitre 1 : le retour à la mer (Trias) ---- */
  sardine: {
    name: 'Petit poisson', plural: 'petits poissons', kind: 'prey', look: 'poisson', color: '#9FD8E8',
    fish: { jaw: 'small' },
    size: 9, speed: 70, sense: 110, adn: 2,
    fact: "Les mers du Trias grouillaient de petits poissons : le repas préféré des reptiles marins !",
  },
  belemnite: {
    name: 'Bélemnite', plural: 'bélemnites', kind: 'prey', look: 'belemnite', color: '#E39A8E',
    size: 13, speed: 85, sense: 150, adn: 5,
    fact: "Les bélemnites ressemblaient à des calmars, avec une coquille pointue cachée dans le corps. Leurs fossiles ont la forme d'une balle !",
  },
  meduse: {
    name: 'Méduse', plural: 'méduses', kind: 'stinger', look: 'meduse', color: '#F6A6FF',
    size: 26, speed: 28, adn: 8,
    fact: "Les méduses existent depuis plus de 500 millions d'années… et elles n'ont même pas de cerveau !",
  },
  hybodus: {
    name: 'Hybodus', plural: 'Hybodus', proper: true, kind: 'hunter', look: 'hybodus', color: '#7C8C99',
    size: 32, speed: 225, sense: 300, cone: 2.2, adn: 14,
    fact: "Hybodus était un requin avec des épines devant ses ailerons… et deux petites cornes au-dessus des yeux !",
  },
  cymbospondylus: {
    name: 'Cymbospondylus', plural: 'Cymbospondylus', proper: true, kind: 'hunter', look: 'ichthyosaure', color: '#5F7F8C',
    size: 85, speed: 260, sense: 380, cone: 1.8, adn: 35,
    fact: "Cymbospondylus, un des tout premiers ichthyosaures, était déjà aussi long qu'un autobus il y a 244 millions d'années !",
  },

  /* ---- Chapitre 2 : les ichthyosaures (Jurassique) ---- */
  ammonite: {
    name: 'Ammonite', plural: 'ammonites', kind: 'prey', look: 'ammonite', color: '#E8C99A', armored: true, eatLine: 'ammonite',
    size: 26, speed: 70, sense: 160, adn: 12,
    fact: "Les ammonites, cousines d'Ammo, vivaient dans une coquille enroulée. On a retrouvé des coquilles avec des traces de dents de mosasaures !",
  },
  plesiosaure: {
    name: 'Plesiosaurus', plural: 'Plesiosaurus', proper: true, kind: 'hunter', look: 'plesiosaure', color: '#7A8F6A',
    size: 56, speed: 275, sense: 390, cone: 2.0, adn: 26,
    fact: "Plesiosaurus avait un cou très long, une petite tête et quatre nageoires comme des ailes : il « volait » sous l'eau !",
  },
  temnodontosaurus: {
    name: 'Temnodontosaurus', plural: 'Temnodontosaurus', proper: true, kind: 'hunter', look: 'ichthyosaure', color: '#46647A',
    size: 120, speed: 380, sense: 550, cone: 2.3, adn: 45,
    fact: "Temnodontosaurus avait les plus grands yeux de tous les animaux : aussi gros qu'un ballon de foot ! Il voyait dans les profondeurs sombres.",
  },

  /* ---- Chapitre 3 : les pliosaures (Jurassique moyen) ---- */
  ophthalmosaurus: {
    name: 'Ophthalmosaurus', plural: 'Ophthalmosaurus', proper: true, kind: 'prey', look: 'ichthyosaure', color: '#8FA9B8',
    size: 60, speed: 300, sense: 380, adn: 20,
    fact: "Ophthalmosaurus veut dire « lézard aux yeux ». Avec ses énormes yeux, il chassait les calmars dans le noir.",
  },
  cryptoclidus: {
    name: 'Cryptoclidus', plural: 'Cryptoclidus', proper: true, kind: 'prey', look: 'plesiosaure', color: '#A3906A',
    size: 70, speed: 260, sense: 340, adn: 24,
    fact: "Cryptoclidus avait des dents fines comme des aiguilles, qui formaient un piège à petits poissons.",
  },
  leedsichthys: {
    name: 'Leedsichthys', plural: 'Leedsichthys', proper: true, kind: 'neutral', look: 'leedsichthys', color: '#8C9AA6',
    size: 360, speed: 60, adn: 0,
    fact: "Leedsichthys, le plus grand poisson de tous les temps, était aussi long qu'une baleine… et il ne mangeait que du plancton !",
  },
  metriorhynque: {
    name: 'Crocodile marin', plural: 'crocodiles marins', kind: 'hunter', look: 'metriorhynque', color: '#6B7A4A',
    size: 100, speed: 400, sense: 480, cone: 2.2, adn: 40,
    fact: "Metriorhynchus était un crocodile qui vivait en pleine mer, avec des nageoires à la place des pattes et une queue de poisson !",
  },
  liopleurodon: {
    name: 'Liopleurodon', plural: 'Liopleurodon', proper: true, kind: 'hunter', look: 'pliosaure', color: '#4F5D6E',
    size: 175, speed: 435, sense: 580, cone: 2.2, adn: 70,
    fact: "Liopleurodon était un pliosaure à la tête énorme, avec des dents plus longues que ta main. La terreur des mers du Jurassique !",
  },

  /* ---- Chapitre 4 : le Crétacé ---- */
  xiphactinus: {
    name: 'Xiphactinus', plural: 'Xiphactinus', proper: true, kind: 'prey', look: 'grand-poisson', color: '#B9C4CF',
    size: 100, speed: 340, sense: 420, adn: 30,
    fact: "Xiphactinus était un poisson géant aux dents de chien. On en a trouvé un avec un autre poisson de 2 mètres dans le ventre !",
  },
  platypterygius: {
    name: 'Platypterygius', plural: 'Platypterygius', proper: true, kind: 'prey', look: 'ichthyosaure', color: '#7D95A8',
    size: 110, speed: 320, sense: 420, adn: 32,
    fact: "Platypterygius fut l'un des derniers ichthyosaures. Après lui, ils ont tous disparu, bien avant la météorite.",
  },
  cretoxyrhina: {
    name: 'Cretoxyrhina', plural: 'Cretoxyrhina', proper: true, kind: 'hunter', look: 'requin', color: '#6E8296',
    size: 150, speed: 475, sense: 550, cone: 2.3, adn: 55,
    fact: "Cretoxyrhina, le « requin Ginsu », avait des dents tranchantes comme des couteaux de cuisine. Il était aussi gros qu'un grand requin blanc !",
  },
  kronosaurus: {
    name: 'Kronosaurus', plural: 'Kronosaurus', proper: true, kind: 'hunter', look: 'kronosaure', color: '#5B4B5E',
    size: 230, speed: 505, sense: 620, cone: 2.2, adn: 80,
    fact: "Kronosaurus avait une tête presque aussi longue qu'une voiture ! Son nom vient d'un géant de la mythologie grecque.",
  },

  /* ---- Chapitre 5 : le règne des mosasaures (fin du Crétacé) ---- */
  archelon: {
    name: 'Archelon', plural: 'Archelon', proper: true, kind: 'prey', look: 'tortue', color: '#6F8A5A', armored: true,
    size: 160, speed: 150, sense: 300, adn: 40,
    fact: "Archelon était une tortue de mer géante, plus grande qu'une voiture ! Sa carapace était en cuir, comme celle de la tortue luth.",
  },
  elasmosaure: {
    name: 'Elasmosaure', plural: 'elasmosaures', kind: 'prey', look: 'elasmosaure', color: '#8E9A72',
    size: 170, speed: 260, sense: 420, adn: 45,
    fact: "L'elasmosaure avait le cou le plus long de tous les reptiles marins : plus de la moitié de son corps, avec 72 vertèbres !",
  },
  squalicorax: {
    name: 'Squalicorax', plural: 'Squalicorax', proper: true, kind: 'prey', look: 'requin', color: '#7A7266',
    size: 120, speed: 360, sense: 440, adn: 30,
    fact: "Squalicorax, le « requin corbeau », mangeait de tout, même les restes des mosasaures !",
  },
  tylosaure: {
    name: 'Tylosaure', plural: 'tylosaures', kind: 'hunter', look: 'tylosaure', color: '#4E6A63',
    size: 280, speed: 565, sense: 690, cone: 2.3, adn: 90,
    fact: "Le tylosaure avait un museau pointu et dur comme un bélier, pour assommer ses proies.",
  },
  mosasaurus: {
    name: 'Mosasaure rival', plural: 'mosasaures rivaux', proper: true, kind: 'hunter', look: 'mosasaure', color: '#3D4A5A', boss: true,
    size: 360, speed: 615, sense: 780, cone: 2.3, adn: 250,
    fact: "Le mosasaure était le roi des mers à la fin du Crétacé : un lézard géant aussi long qu'un camion, avec deux rangées de dents au palais !",
  },
};

/* Les évolutions (voir levels/index.js). dry = la jauge d'air baisse moins vite. */
const evolutions = {
  palmes: {
    name: 'Nageoires', ch: 1, cost: 20, effect: { speed: 1.25 },
    short: 'Tes pattes deviennent des nageoires : tu nages vite',
    fact: "Les reptiles marins venaient de la terre : leurs pattes se sont peu à peu changées en nageoires.",
  },
  poumons: {
    name: 'Grands poumons', ch: 1, cost: 45, effect: { dry: 0.5 },
    short: 'Tu retiens ton souffle deux fois plus longtemps',
    fact: "Les reptiles marins respiraient de l'air, comme les baleines aujourd'hui. Certains pouvaient rester sous l'eau très longtemps !",
  },
  nageoire: {
    name: 'Queue en croissant', ch: 2, cost: 60, effect: { speed: 1.15, dash: true },
    short: 'Plus rapide, et un sprint plus puissant',
    fact: "Les ichthyosaures avaient une queue en croissant, comme les thons et les requins : parfaite pour nager très vite !",
  },
  'grands-yeux': {
    name: 'Grands yeux', ch: 2, cost: 90, effect: { vision: 1.5, cones: true },
    short: 'Tu vois loin, et tu vois où regardent les chasseurs',
    fact: "Les ichthyosaures avaient des yeux géants, protégés par un anneau d'os, pour voir dans les profondeurs sombres.",
  },
  machoires: {
    name: 'Mâchoires puissantes', ch: 3, cost: 140, effect: { ratio: 0.95, reach: 1.2 },
    short: 'Tu attrapes des proies plus grosses',
    fact: "Les pliosaures avaient une morsure parmi les plus puissantes de tous les animaux !",
  },
  flair: {
    name: 'Flair sous-marin', ch: 3, cost: 180, effect: { vision: 1.6, radar: true },
    short: 'Tu sens les proies et les chasseurs de loin',
    fact: "Les pliosaures sentaient les odeurs sous l'eau : l'eau entrait par leur bouche et ressortait par leurs narines.",
  },
  dents: {
    name: 'Dents coniques', ch: 4, cost: 260, effect: { ratio: 1.05, armored: true },
    short: 'Tu croques même les coquilles',
    fact: "Les grands reptiles marins avaient des dents en forme de cônes, très solides : parfaites pour briser les coquilles des ammonites !",
  },
  cuir: {
    name: 'Peau dure', ch: 4, cost: 300, effect: { shield: 1 },
    short: 'Elle te protège d’une morsure',
    fact: "La peau des mosasaures était couverte de petites écailles, comme celle des serpents.",
  },
  'peau-epaisse': {
    name: 'Peau épaisse', ch: 5, cost: 400, effect: { shield: 2 },
    short: 'Tu encaisses deux coups',
    fact: "On a retrouvé des mosasaures couverts de cicatrices : ils se battaient entre eux… et ils guérissaient !",
  },
  morsure: {
    name: 'Morsure géante', ch: 5, cost: 520, effect: { ratio: 1.6 },
    short: 'La morsure la plus terrible des océans !',
    fact: "Les mosasaures avaient une mâchoire articulée, comme les serpents : ils pouvaient avaler des proies énormes !",
  },
};

/* L'histoire. dry = la jauge d'air qui baisse (part de la réserve par seconde). */
const chapters = [
  {
    title: 'Le retour à la mer',
    ago: [245, 235],
    form: 'nothosaure',
    skin: { body: '#3FA7A0', belly: '#E8F2C8', dark: '#1F5C58', stripe: '#2A6F6A' },
    size: [20, 40],
    growth: 90,
    dry: 1 / 26,
    vision: 1.2,
    fog: 0.5,
    palette: { water: ['#1E8C9E', '#0B4A5E'], floor: '#7C8F7A', light: '#E6FFF6' },
    species: { sardine: 22, belemnite: 15, 'cousin-nothosaure': 3, meduse: 4, hybodus: 3, cymbospondylus: 1 },
    unlock: ['palmes', 'poumons'],
    intro: "Des millions d'années ont passé. Tes descendants sont devenus des reptiles… et ils sont retournés dans la mer ! Mais un reptile respire de l'air : remonte souvent à la surface, dans les taches de lumière 🐳. Et méfie-toi des requins Hybodus…",
    missions: [
      { type: 'evolve', part: 'palmes' },
      { type: 'eat', species: 'belemnite', n: 5 },
      { type: 'evolve', part: 'poumons' },
      { type: 'grow' },
      { type: 'eat', species: 'hybodus', n: 1, revenge: true },
    ],
    tips: [
      "Ta réserve d'air 🐳 baisse sous l'eau. Remonte respirer dans une tache de lumière !",
      "L'Hybodus ne voit que devant lui : passe derrière sans foncer.",
      "Quand tu fonces, ça fait du bruit : les chasseurs t'entendent !",
    ],
  },
  {
    title: 'Les ichthyosaures',
    ago: [200, 190],
    form: 'ichthyosaure',
    skin: { body: '#5B8DEF', belly: '#E4ECFF', dark: '#24407E', stripe: '#2E4F9A' },
    size: [40, 70],
    growth: 200,
    dry: 1 / 34,
    vision: 0.95,
    fog: 0.62,
    palette: { water: ['#1B7FA6', '#093D5C'], floor: '#6F8E85', light: '#E2F6FF' },
    species: { sardine: 13, belemnite: 12, ammonite: 6, 'cousin-ichthyosaure': 3, meduse: 3, hybodus: 3, plesiosaure: 2, temnodontosaurus: 2 },
    unlock: ['nageoire', 'grands-yeux'],
    intro: "Le Jurassique ! Tes descendants ont un corps de dauphin : tu es un ichthyosaure. Mais les eaux sont sombres… et le terrible Temnodontosaurus, aux yeux géants, te voit de très loin !",
    missions: [
      { type: 'evolve', part: 'nageoire' },
      { type: 'eat', species: 'hybodus', n: 3 },
      { type: 'evolve', part: 'grands-yeux' },
      { type: 'grow' },
      { type: 'eat', species: 'plesiosaure', n: 1, revenge: true },
    ],
    tips: [
      "Les ammonites ont une coquille trop dure pour toi… pour l'instant !",
      "Temnodontosaurus ! Cache-toi dans les algues, vite !",
      "N'oublie pas de remonter respirer : les chasseurs aussi rôdent près de la surface…",
    ],
  },
  {
    title: 'Les pliosaures',
    ago: [165, 160],
    form: 'pliosaure',
    skin: { body: '#8E6FD8', belly: '#EAE0FF', dark: '#3E2B78', stripe: '#4B3590' },
    size: [70, 110],
    growth: 380,
    dry: 1 / 42,
    vision: 1.1,
    fog: 0.55,
    palette: { water: ['#1A6E93', '#08324F'], floor: '#667F80', light: '#E0F2FF' },
    species: { belemnite: 10, ammonite: 8, ophthalmosaurus: 7, cryptoclidus: 7, 'cousin-pliosaure': 3, leedsichthys: 2, metriorhynque: 3, liopleurodon: 2 },
    unlock: ['machoires', 'flair'],
    intro: "Tes descendants ont une tête énorme et quatre nageoires comme des ailes : tu es un pliosaure ! Mais ici règne Liopleurodon, encore plus grand que toi… et les crocodiles marins chassent en pleine mer.",
    missions: [
      { type: 'evolve', part: 'machoires' },
      { type: 'eat', species: 'cryptoclidus', n: 4 },
      { type: 'evolve', part: 'flair' },
      { type: 'grow' },
      { type: 'eat', species: 'metriorhynque', n: 1, revenge: true },
    ],
    tips: [
      "Leedsichthys est le plus grand poisson du monde… mais il ne mange que du plancton. Ouf !",
      "Liopleurodon ! Ne reste surtout pas devant sa gueule…",
    ],
  },
  {
    title: 'Le Crétacé',
    ago: [110, 100],
    form: 'pliosaure',
    skin: { body: '#D9534F', belly: '#FFE0D6', dark: '#6E1E1C', stripe: '#7A2220' },
    size: [110, 170],
    growth: 650,
    dry: 1 / 50,
    vision: 1.1,
    fog: 0.6,
    palette: { water: ['#155F86', '#062A45'], floor: '#5D7480', light: '#DDEFFF' },
    species: { ammonite: 9, belemnite: 8, xiphactinus: 7, platypterygius: 6, 'grand-pliosaure': 3, cretoxyrhina: 3, kronosaurus: 2 },
    unlock: ['dents', 'cuir'],
    intro: "Le Crétacé ! Tu es un grand pliosaure… mais Kronosaurus, avec sa tête aussi longue qu'une voiture, est encore plus fort. Et les requins Cretoxyrhina coupent tout avec leurs dents-couteaux !",
    missions: [
      { type: 'evolve', part: 'dents' },
      { type: 'eat', species: 'ammonite', n: 5 },
      { type: 'evolve', part: 'cuir' },
      { type: 'grow' },
      { type: 'eat', species: 'cretoxyrhina', n: 1, revenge: true },
    ],
    tips: [
      "Avec des dents coniques, les coquilles des ammonites deviennent croquables !",
      "Kronosaurus est plus gros que toi : cache-toi dans les algues quand il approche.",
    ],
  },
  {
    title: 'Le règne des mosasaures',
    ago: [68, 66],
    form: 'mosasaure',
    skin: { body: '#3E6B5A', belly: '#F4E9C8', dark: '#173A2E', stripe: '#F2B33D' },
    size: [170, 260],
    growth: 1500,
    dry: 1 / 60,
    vision: 1.15,
    fog: 0.62,
    palette: { water: ['#124F75', '#05223A'], floor: '#566B78', light: '#D8ECFF' },
    species: { xiphactinus: 7, ammonite: 7, archelon: 4, elasmosaure: 5, squalicorax: 4, 'cousin-mosasaure': 2, tylosaure: 3, mosasaurus: 1 },
    unlock: ['peau-epaisse', 'morsure'],
    intro: "La fin du Crétacé. Tu es devenu un mosasaure, un lézard de mer géant et impitoyable ! Mais un autre mosasaure, encore plus énorme, règne sur ces eaux. Pour devenir le maître des océans, il faudra le battre…",
    missions: [
      { type: 'evolve', part: 'peau-epaisse' },
      { type: 'eat', species: 'archelon', n: 3 },
      { type: 'evolve', part: 'morsure' },
      { type: 'grow' },
      { type: 'eat', species: 'mosasaurus', n: 1, revenge: true },
    ],
    tips: [
      "Le tylosaure fonce comme un bélier ! Garde tes distances…",
      "Le mosasaure rival est plus gros que toi. Grandis et fais-toi pousser la morsure géante avant de l'attaquer !",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! On reste dans la mer ! Mais attention : tes descendants respirent de l'air maintenant. Remonte souvent à la surface 🐳… et ouvre l'œil, la mer est pleine de monstres !",
};

/* La fin : on règne sur les océans… puis la météorite. Deux chemins pour la suite. */
const ending = {
  scene: 'meteorite',
  crowd: ['elasmosaure', 'archelon', 'xiphactinus', 'ammonite'],
  title: 'La fin des monstres marins',
  sub: "Il y a 66 millions d'années, une météorite géante a frappé la Terre. Les mosasaures, les plésiosaures et les ammonites ont tous disparu… mais certains animaux ont survécu. Qui seront tes descendants ?",
  done: "Tu as régné sur les océans… jusqu'à la météorite",
  captions: [
    [0.4, 4, "Tu règnes sur les océans ! Plus aucun animal n'ose t'approcher…"],
    [4.2, 7.2, "Mais il y a 66 millions d'années, quelque chose arrive du ciel…"],
    [7.6, 11.6, "Une météorite géante s'écrase. Une vague immense, le ciel noir, l'eau qui se refroidit… Les monstres marins disparaissent."],
    [11.8, 15, "Mais certains animaux survivent…"],
  ],
  choices: [
    {
      id: 'terre', icon: '🐢', title: 'Retourner sur la terre',
      text: 'Tes descendants remontent sur la plage et deviennent des reptiles : tortues, crocodiles, lézards…',
      level: 'voie-des-reptiles',
      soon: 'Niveau 3 : La voie des reptiles',
      fact: "Les tortues de mer ont survécu à la météorite ! Elles reviennent toujours pondre leurs œufs sur la plage.",
    },
    {
      id: 'mer', icon: '🦈', title: 'Devenir un requin',
      text: "Les requins ont survécu à la météorite… et ils règnent encore aujourd'hui sur les océans !",
      level: 'voie-des-requins',
      soon: 'Niveau 3 : La voie des requins',
      fact: "Les requins existent depuis plus de 400 millions d'années : ils sont plus vieux que les arbres !",
    },
  ],
};

export default {
  id: 'monstres-marins',
  num: 2,
  name: 'Les monstres marins',
  icon: '🌊',
  intro: 'mer',
  goal: "Tes descendants retournent dans la mer. Ce sont des reptiles : <b>ils respirent de l'air</b> ! Remonte à la surface, échappe aux monstres, et deviens le plus terrible des prédateurs marins :<br>🦎 le nothosaure → 🐬 l'ichthyosaure → 🦕 le pliosaure → 👑 le mosasaure !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
