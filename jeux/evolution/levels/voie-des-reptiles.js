// ============================================================================
// NIVEAU 3 — LA VOIE DES REPTILES
//
// De la météorite (il y a 66 millions d'années) à l'arrivée des humains, dans
// la jungle. Le monde est VU DE CÔTÉ (world.view = 'cote', voir cote.js) : les
// reptiles grimpent aux arbres, plongent dans les rivières et les marais.
//   1. Le petit lézard, survivant de la météorite (sa queue se détache !)
//   2. Titanoboa, le serpent géant des premiers marais tropicaux
//   3. Le caméléon, maître du camouflage, en haut des arbres
//   4. Purussaurus, le caïman géant de l'Amazonie, champion de l'embuscade
//   5. Megalania, le varan géant d'Australie… quand les humains arrivent
// Manger ne fait pas grandir (world.noGrow) : on gagne par ses actions.
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* Le monde : vu de côté ; chaque chapitre a son propre paysage (chapters[].land) */
const world = {
  view: 'cote',
  ground: 'cote',
  w: 15000,
  h: 3400,
  start: { x: 1500, y: 2600 },
  noGrow: true,
  speed: 1.5,
  maxChasers: 3,
  noise: 480,
  penalty: { adn: 0.3, growth: 0 },
  decor: [],
};

/* Les êtres vivants (lives, swims, climbs, alt, depth, near : voir levels/index.js) */
const species = {
  /* ---- Les insectes ---- */
  grillon: {
    name: 'Grillon', plural: 'grillons', kind: 'prey', look: 'vc-grillon', color: '#7A6A3A',
    size: 9, speed: 70, sense: 120, adn: 4,
    fact: "Le grillon chante en frottant ses ailes l'une contre l'autre. Et il entend avec… ses pattes de devant !",
  },
  scarabee: {
    name: 'Scarabée', plural: 'scarabées', kind: 'prey', look: 'vc-scarabee', color: '#2E7A5A',
    size: 10, speed: 55, sense: 110, adn: 5,
    fact: "Les scarabées ont deux paires d'ailes : une paire dure, comme une armure, et une paire fine, pliée en dessous, pour voler.",
  },
  libellule: {
    name: 'Libellule', plural: 'libellules', kind: 'prey', lives: 'air', alt: [40, 360], look: 'vc-libellule', color: '#4AA8C8', flapRate: 30, agile: 4,
    size: 11, speed: 120, sense: 150, adn: 6,
    fact: "Les yeux de la libellule sont faits de 30 000 petits yeux : elle voit presque tout autour d'elle !",
  },
  mouche: {
    name: 'Mouche', plural: 'mouches', kind: 'prey', lives: 'air', alt: [30, 500], look: 'vc-mouche', color: '#3A4A5A', flapRate: 40, agile: 4,
    size: 8, speed: 110, sense: 130, adn: 4,
    fact: "Une mouche bat des ailes 200 fois par seconde : c'est pour ça qu'elle bourdonne !",
  },
  papillon: {
    name: 'Papillon', plural: 'papillons', kind: 'prey', lives: 'air', alt: [60, 700], look: 'vc-papillon', color: '#5A4A3A', flapRate: 10,
    size: 11, speed: 80, sense: 120, adn: 6,
    fact: "Les papillons goûtent avec leurs pattes ! Ils se posent sur une fleur… et savent tout de suite si elle est bonne.",
  },

  /* ---- Chapitre 1 : les survivants ---- */
  borealosuchus: {
    name: 'Borealosuchus', plural: 'borealosuchus', kind: 'hunter', look: 'vc-borealosuchus', color: '#5A6A44', swims: true, near: 'eau',
    size: 68, speed: 220, sense: 300, cone: 2.2, adn: 0, hurt: 'CROC !',
    fact: "Les crocodiles ont survécu à la météorite : ils peuvent rester des mois sans manger, cachés au fond de l'eau.",
  },
  serpent: {
    name: 'Serpent', plural: 'serpents', kind: 'hunter', look: 'vc-serpent', color: '#6A5A3A', climbs: true,
    size: 42, speed: 160, sense: 260, cone: 2.6, adn: 0,
    fact: "Les serpents descendent de lézards qui ont perdu leurs pattes, il y a plus de 100 millions d'années.",
  },

  /* ---- Chapitre 2 : le marais de Titanoboa ---- */
  dipneuste: {
    name: 'Dipneuste', plural: 'dipneustes', kind: 'prey', lives: 'eau', look: 'vc-dipneuste', color: '#7A6A4A',
    size: 22, speed: 130, sense: 200, adn: 10,
    fact: "Le dipneuste est un poisson… qui respire de l'air avec des poumons ! Quand sa mare sèche, il s'enterre dans la boue et attend la pluie.",
  },
  poisson: {
    name: 'Poisson', plural: 'poissons', kind: 'prey', lives: 'eau', look: 'vc-poisson', color: '#8AA86A', pack: 3,
    size: 15, speed: 140, sense: 150, adn: 6,
    fact: "Dans les rivières tropicales, il y a des milliers d'espèces de poissons, de toutes les formes et de toutes les couleurs.",
  },
  cerrejonisuchus: {
    name: 'Cerrejonisuchus', plural: 'cerrejonisuchus', kind: 'prey', look: 'vc-cerrejonisuchus', color: '#6A7A4A', swims: true, near: 'eau',
    size: 36, speed: 190, sense: 300, adn: 18,
    fact: "Ce petit crocodile au museau fin pêchait des poissons… mais lui-même était le repas préféré de Titanoboa !",
  },
  carbonemys: {
    name: 'Carbonemys', plural: 'carbonemys', kind: 'defender', look: 'vc-carbonemys', color: '#6A5A3A', shell: '#5A4A30', swims: true, near: 'eau', noEat: true,
    size: 70, speed: 120, sense: 220, adn: 0, hurt: 'CLAC !',
    fact: "Carbonemys était une tortue géante, avec une carapace grande comme une table ! Sa mâchoire était si forte qu'elle croquait même… des crocodiles.",
  },
  acherontisuchus: {
    name: 'Acherontisuchus', plural: 'acherontisuchus', kind: 'hunter', look: 'vc-champsosaure', color: '#4A5A3A', swims: true, near: 'eau',
    size: 100, speed: 240, sense: 340, cone: 2.0, adn: 0, noEat: true, hurt: 'CROC !',
    fact: "Ce crocodile de 6 mètres au long museau vivait dans les mêmes marais que Titanoboa. Les deux géants se méfiaient l'un de l'autre !",
  },

  /* ---- Chapitre 3 : la canopée ---- */
  'papillon-bleu': {
    name: 'Morpho bleu', plural: 'morphos bleus', kind: 'prey', lives: 'air', alt: [200, 900], look: 'vc-papillon-bleu', color: '#2A3A6A', flapRate: 9,
    size: 13, speed: 90, sense: 140, adn: 9,
    fact: "Les ailes du morpho ne contiennent aucun pigment bleu : ce sont de minuscules écailles qui renvoient la lumière, comme une bulle de savon !",
  },
  aigle: {
    name: 'Aigle', plural: 'aigles', kind: 'hunter', lives: 'air', alt: [500, 1300], look: 'vc-aigle', color: '#6A4A30', flapRate: 6, agile: 3,
    size: 56, speed: 300, sense: 480, cone: 1.8, adn: 0, noEat: true, hurt: 'KRIII !',
    fact: "Les aigles de la forêt chassent en planant au-dessus des arbres. Ils repèrent le moindre mouvement… mais pas un caméléon immobile !",
  },
  'serpent-arboricole': {
    name: 'Serpent des arbres', plural: 'serpents des arbres', kind: 'hunter', look: 'vc-serpent-arboricole', color: '#4E9A3A', lives: 'arbre', climbs: true,
    size: 40, speed: 150, sense: 240, cone: 2.4, adn: 0, noEat: true,
    fact: "Ce serpent vert se confond avec les feuilles. Il a de grands yeux et voit très bien… sauf ce qui ne bouge pas !",
  },

  /* ---- Chapitre 4 : l'Amazonie ---- */
  phoberomys: {
    name: 'Phoberomys', plural: 'phoberomys', kind: 'prey', look: 'vc-phoberomys', color: '#8A6A4A', near: 'eau',
    size: 50, speed: 230, sense: 360, adn: 25,
    fact: "Phoberomys était un rongeur géant, gros comme un bison ! C'est un lointain cousin du cochon d'Inde. Il venait boire au bord de l'eau…",
  },
  toxodon: {
    name: 'Toxodon', plural: 'toxodons', kind: 'prey', look: 'vc-toxodon', color: '#7A6A5A', near: 'eau',
    size: 58, speed: 220, sense: 400, adn: 40,
    fact: "Le toxodon ressemblait à un rhinocéros sans corne. Il vivait au bord des rivières et broutait les plantes d'eau.",
  },
  arapaima: {
    name: 'Arapaima', plural: 'arapaimas', kind: 'prey', lives: 'eau', look: 'vc-arapaima', color: '#7A8A6A',
    size: 34, speed: 150, sense: 200, adn: 14,
    fact: "L'arapaima est l'un des plus grands poissons de rivière : jusqu'à 3 mètres ! Il remonte à la surface pour respirer de l'air.",
  },
  piranha: {
    name: 'Piranha', plural: 'piranhas', kind: 'stinger', lives: 'eau', look: 'vc-piranha', color: '#8A8A9A', belly: '#E2604A', pack: 3,
    size: 14, speed: 160, sense: 160, adn: 0, noEat: true, hurt: 'Aïe !',
    fact: "Les piranhas ont des dents triangulaires, coupantes comme des ciseaux. Ils vivent en bande… mais ils sont surtout peureux !",
  },
  stupendemys: {
    name: 'Stupendemys', plural: 'stupendemys', kind: 'neutral', look: 'vc-stupendemys', color: '#5A5A3A', shell: '#4A4A2E', lives: 'eau', noEat: true,
    size: 80, speed: 70, sense: 0, adn: 0,
    fact: "Stupendemys était une tortue d'eau douce de 4 mètres ! Les mâles avaient des cornes sur la carapace, pour se battre.",
  },
  gryposuchus: {
    name: 'Gryposuchus', plural: 'gryposuchus', kind: 'rival', ownColor: true, look: 'vc-gryposuchus', color: '#6A7A4A', swims: true, near: 'eau',
    size: 64, speed: 200, sense: 320, adn: 0, noEat: true,
    fact: "Gryposuchus, cousin du gavial, avait un museau très long et très fin, plein de dents : idéal pour attraper les poissons.",
  },

  /* ---- Chapitre 5 : l'Australie ---- */
  oeuf: {
    name: "Œuf de Genyornis", plural: "œufs de Genyornis", kind: 'food', look: 'vc-oeuf', color: '#F0E6C8',
    size: 12, speed: 0, sense: 0, adn: 12,
    fact: "On a retrouvé des coquilles d'œufs de Genyornis… avec des traces de feu dessus : les premiers humains d'Australie les faisaient cuire !",
  },
  genyornis: {
    name: 'Genyornis', plural: 'genyornis', kind: 'defender', look: 'vc-genyornis', color: '#6A5A4A', noEat: true,
    size: 70, speed: 200, sense: 260, adn: 0, hurt: 'BAM !',
    fact: "Genyornis était un énorme oiseau qui ne volait pas, plus grand qu'un humain. Il défendait ses œufs à grands coups de pattes !",
  },
  bandicoot: {
    name: 'Bandicoot', plural: 'bandicoots', kind: 'prey', look: 'vc-agouti', color: '#9A7A5A',
    size: 20, speed: 230, sense: 280, adn: 10,
    fact: "Le bandicoot est un petit marsupial d'Australie : sa maman le porte dans une poche, comme le kangourou.",
  },
  diprotodon: {
    name: 'Diprotodon', plural: 'diprotodons', kind: 'defender', look: 'vc-diprotodon', color: '#7A6650', noEat: true,
    size: 100, speed: 140, sense: 240, adn: 0, hurt: 'BOUM !',
    fact: "Diprotodon, le plus grand marsupial de tous les temps, était gros comme un hippopotame. C'était un cousin géant du wombat !",
  },
  thylacoleo: {
    name: 'Lion marsupial', plural: 'lions marsupiaux', kind: 'hunter', look: 'vc-thylacoleo', color: '#B0905E', climbs: true,
    size: 76, speed: 280, sense: 320, cone: 2.2, adn: 0, noEat: true, hurt: 'GRRR !',
    fact: "Le lion marsupial avait la morsure la plus puissante de tous les mammifères ! Il grimpait aux arbres pour guetter ses proies.",
  },
  chasseur: {
    name: 'Chasseur', plural: 'chasseurs', kind: 'hunter', look: 'vc-chasseur', color: '#6E4A30', habitat: 'camp', noEat: true, hurt: 'Ouste !',
    size: 74, speed: 230, sense: 360, cone: 2.0, adn: 0,
    fact: "Les premiers humains sont arrivés en Australie il y a plus de 50 000 ans, en bateau ! Avec leurs lances et le feu, ils ont tout changé.",
  },
};

/* Les évolutions : deux par reptile, et elles se voient sur son corps */
const evolutions = {
  'pattes-agiles': {
    name: 'Pattes agiles', ch: 1, cost: 20, effect: { speed: 1.15 },
    short: 'Tu cours et tu grimpes plus vite',
    fact: "Les lézards ont des griffes minuscules et, pour certains, des milliers de petits poils sous les doigts : ils grimpent même sur une vitre !",
  },
  'queue-longue': {
    name: 'Queue qui repousse', ch: 1, cost: 40, effect: { power: 1.4, shield: 1 },
    short: 'Ta queue-leurre gigote plus longtemps, et tu encaisses un coup',
    fact: "Quand un lézard perd sa queue, une nouvelle repousse en quelques semaines. Elle est un peu plus courte, mais elle fonctionne !",
  },
  'corps-geant': {
    name: 'Corps géant', ch: 2, cost: 40, effect: { shield: 1, power: 1.3 },
    short: 'Ton étreinte serre plus fort, et tu encaisses un coup',
    fact: "Titanoboa mesurait 13 mètres de long, plus qu'un bus, et pesait plus d'une tonne ! C'est le plus grand serpent de tous les temps.",
  },
  'machoire-elastique': {
    name: 'Mâchoire élastique', ch: 2, cost: 70, effect: { ratio: 1.0, reach: 1.25 },
    short: 'Tu avales des proies plus grosses',
    fact: "Les serpents peuvent écarter leur mâchoire du bas en deux : ils avalent des proies plus grosses que leur tête !",
  },
  'queue-prehensile': {
    name: 'Queue enroulée', ch: 3, cost: 40, effect: { speed: 1.15 },
    short: 'Tu grimpes plus vite (ta queue s’accroche aux branches)',
    fact: "La queue du caméléon s'enroule autour des branches comme une cinquième main. Elle l'empêche de tomber !",
  },
  casque: {
    name: 'Langue géante', ch: 3, cost: 70, effect: { power: 1.5 },
    short: 'Ta langue attrape les insectes de beaucoup plus loin',
    fact: "La langue du caméléon peut être deux fois plus longue que son corps ! Elle jaillit en un centième de seconde, avec un bout collant.",
  },
  'machoire-geante': {
    name: 'Mâchoire géante', ch: 4, cost: 60, effect: { reach: 1.3, ratio: 0.95 },
    short: 'Tu attrapes de plus grosses proies, de plus loin',
    fact: "Purussaurus avait la morsure la plus puissante de tous les animaux connus : bien plus forte que celle du T. rex !",
  },
  cuirasse: {
    name: 'Cuirasse', ch: 4, cost: 90, effect: { shield: 2 },
    short: 'Ta peau en plaques d’os : tu encaisses deux coups',
    fact: "Le dos des crocodiles est couvert de plaques d'os sous la peau : les ostéodermes. Une vraie armure !",
  },
  griffes: {
    name: 'Griffes de varan', ch: 5, cost: 60, effect: { power: 1.4, speed: 1.08 },
    short: 'Ta morsure venimeuse porte plus loin',
    fact: "Les varans ont du venin dans leur salive : une proie mordue s'affaiblit… et le varan n'a plus qu'à la suivre.",
  },
  'pattes-fortes': {
    name: 'Pattes de géant', ch: 5, cost: 90, effect: { speed: 1.15, shield: 1 },
    short: 'Tu cours plus vite, et tu encaisses un coup',
    fact: "Megalania mesurait 7 mètres de long : c'est le plus grand lézard terrestre de tous les temps. Le dragon de Komodo est son petit cousin.",
  },
};

/* Les paysages (vue de côté) */
const FOUGERES = {
  sky: ['#7AA8B8', '#BED8CC', '#E8E6C8'], sun: { x: 0.7, y: 0.2, col: '#FFF0C8', r: 36, glow: 'rgba(255, 230, 190, 0.45)' },
  layers: [
    { kind: 'mont', A: 420, p: 0.1, col: '#9AB2AC', wl: 1000, haze: 'rgba(230, 240, 225, 0.45)' },
    { kind: 'foret', A: 200, p: 0.26, col: '#6A8A6A', cell: 120 },
    { kind: 'foret', A: 150, p: 0.45, col: '#4E7450', cell: 90 },
  ],
  ground: ['#6A5A3A', '#3E3424'], grass: '#5A8A3A', rock: '#8A8478', fern: ['#2E7A3A', '#5AA448'],
  waterTop: '#5A9A8A', waterDeep: '#1E4A40', waterFront: 'rgba(60, 130, 110, 0.45)', waterFront2: 'rgba(20, 60, 50, 0.6)',
  weather: 'pollen', mist: 'rgba(220, 235, 215, 0.35)',
};
const MARAIS = {
  sky: ['#5A7A7A', '#9AB8A8', '#D8DCC0'], sun: { x: 0.3, y: 0.2, col: '#F2EED0', r: 34, glow: 'rgba(240, 240, 210, 0.3)' },
  layers: [
    { kind: 'foret', A: 260, p: 0.15, col: '#7A9A88', cell: 160, haze: 'rgba(210, 225, 210, 0.5)' },
    { kind: 'palmiers', A: 260, p: 0.3, col: '#5A7A5E', cell: 220 },
    { kind: 'foret', A: 140, p: 0.5, col: '#3E5E42', cell: 100 },
  ],
  ground: ['#5A4A30', '#2E2618'], grass: '#4E7A34', rock: '#7A7468', fern: ['#2E6A34', '#4E8E3E'],
  waterTop: '#5A7A5A', waterDeep: '#1E3424', waterFront: 'rgba(70, 110, 70, 0.5)', waterFront2: 'rgba(20, 40, 25, 0.65)', weed: '#2E5A34',
  cloud: 'rgba(210, 220, 215, 0.8)', weather: 'pluie', mist: 'rgba(200, 215, 205, 0.4)',
};
const CANOPEE = {
  sky: ['#3E9AD8', '#A2D8EE', '#EAF4D8'], sun: { x: 0.78, y: 0.14, col: '#FFF8D8', r: 40 },
  layers: [
    { kind: 'foret', A: 340, p: 0.12, col: '#8AB89A', cell: 170, haze: 'rgba(240, 250, 235, 0.45)' },
    { kind: 'foret', A: 260, p: 0.28, col: '#4E8A5A', cell: 130 },
    { kind: 'foret', A: 200, p: 0.48, col: '#2E6A40', cell: 100 },
  ],
  ground: ['#5A4A2E', '#2E2618'], grass: '#3E7A34', rock: '#7A7468', flowers: '#F27AA0', fern: ['#2E6A34', '#4E9A44'],
  waterTop: '#4A9A8A', waterDeep: '#1A3E36', weather: 'lucioles',
};
const AMAZONIE = {
  sky: ['#4A8ACE', '#9ACCE8', '#F2E2B8'], sun: { x: 0.22, y: 0.18, col: '#FFF0C0', r: 42, glow: 'rgba(255, 220, 160, 0.5)' },
  layers: [
    { kind: 'foret', A: 300, p: 0.12, col: '#7AA48A', cell: 180, haze: 'rgba(250, 240, 220, 0.45)' },
    { kind: 'palmiers', A: 240, p: 0.3, col: '#4E7A50', cell: 260 },
    { kind: 'foret', A: 150, p: 0.5, col: '#355E3A', cell: 110 },
  ],
  ground: ['#7A5A34', '#3E2E1A'], grass: '#4E8A34', rock: '#8A7A64', sand: '#C8A86A', flowers: '#F2C23A', fern: ['#2E6A34', '#4E9A44'],
  waterTop: '#8A7A4A', waterDeep: '#3A3020', waterFront: 'rgba(140, 120, 70, 0.55)', waterFront2: 'rgba(60, 50, 25, 0.7)', weed: '#4A5A2A',
};
const OUTBACK = {
  sky: ['#2A7ADA', '#8AC4EE', '#F6DEB0'], sun: { x: 0.8, y: 0.16, col: '#FFF4C8', r: 44 },
  layers: [
    { kind: 'mont', A: 300, p: 0.1, col: '#C29A82', wl: 1300, haze: 'rgba(255, 230, 200, 0.45)' },
    { kind: 'mont', A: 160, p: 0.24, col: '#B07A5A', wl: 900 },
    { kind: 'foret', A: 90, p: 0.45, col: '#7A8A4A', cell: 300 },
  ],
  ground: ['#B0603A', '#6A3420'], grass: '#A8A04A', rock: '#B06A4A', sand: '#D8A06A', tallGrass: ['#C8B04A', '#E2C86A'],
  leaf: ['#5A7A4A', '#7A9A5A', '#9AB870'], waterTop: '#7AA8A8', waterDeep: '#2A4A4A', weather: 'pollen',
};

/* L'histoire, en cinq reptiles */
const chapters = [
  {
    title: 'Les survivants de la jungle',
    ago: [66, 64],
    form: 'vc-lezard',
    skin: { body: '#5EA84A', belly: '#E8F0B8', dark: '#22501E', stripe: '#3A7A2E' },
    size: [22, 22],
    moves: { climb: true, swim: true, swimK: 0.6, jump: 560, climbK: 0.85 },
    vision: 1.3,
    fog: 0.4,
    palette: { water: ['#5A9A8A', '#1E4A40'], floor: '#6A5A3A', motes: 'rgba(255, 250, 210, 0.5)' },
    land: {
      start: 0.08, hills: 110, lakes: 4, lakeW: [400, 750],
      trees: { fougere: 26, palmier: 10, kapokier: 7 },
      deco: { fougere: 4, buisson: 1, champignon: 1.2, roseau: 1.5, rocher: 0.5 },
      pal: FOUGERES,
    },
    power: {
      type: 'decoy', name: 'Queue-leurre', icon: '🦎', recharge: 7, range: 100, cry: 'CLAC !',
      intro: "Ton pouvoir : la QUEUE-LEURRE ! Appuie sur F (ou sur le bouton orange) : ta queue se détache et gigote toute seule. Le chasseur se jette dessus… et toi, tu files !",
    },
    species: { grillon: 14, scarabee: 8, libellule: 8, borealosuchus: 3, serpent: 3 },
    unlock: ['pattes-agiles', 'queue-longue'],
    intro: "Il y a 66 millions d'années, la météorite a frappé. Les grands dinosaures ont disparu… mais les petits reptiles ont survécu ! Tu es un lézard. La forêt de fougères repousse partout : grimpe aux arbres (↑ près d'un tronc), saute, nage, et attrape des insectes. Méfie-toi des serpents… et des crocodiles cachés dans l'eau.",
    missions: [
      { type: 'eat', species: 'grillon', n: 8, text: 'Croque 8 grillons' },
      { type: 'evolve', part: 'pattes-agiles' },
      { type: 'visit', place: 'cime', n: 3, icon: '🌴', cry: 'Tout en haut !', text: 'Grimpe tout en haut de 3 arbres' },
      { type: 'eat', species: 'libellule', n: 4, text: 'Attrape 4 libellules (saute !)' },
      { type: 'escape', species: 'serpent', n: 3, text: 'Échappe 3 fois aux chasseurs' },
      { type: 'evolve', part: 'queue-longue' },
    ],
    tips: [
      "Près d'un tronc, appuie sur ↑ : tu grimpes ! Sur une branche, va à gauche ou à droite pour marcher dessus.",
      "Un serpent te poursuit ? Laisse ta queue (F) : il va se jeter dessus !",
      "Cache-toi dans les fougères : les chasseurs ne te voient plus.",
      "Les libellules volent bas : saute (↑) pour les attraper.",
    ],
  },
  {
    title: 'Le serpent géant',
    ago: [60, 58],
    form: 'vc-titanoboa',
    skin: { body: '#6A7A3E', belly: '#D8D0A0', dark: '#2A321A', stripe: '#3A4422' },
    size: [52, 52],
    moves: { swim: true, swimK: 1.15, walkK: 0.55 },
    vision: 1.35,
    fog: 0.45,
    zoom: 0.9,
    palette: { water: ['#5A7A5A', '#1E3424'], floor: '#5A4A30', motes: 'rgba(220, 235, 225, 0.5)' },
    land: {
      start: 0.3, hills: 50, lakes: 7, lakeW: [450, 800], lakeD: [380, 620], sea: 'right', seaW: 3500,
      trees: { cypres: 10, palmier: 14, kapokier: 3 },
      deco: { roseau: 5, fougere: 2, buisson: 0.5 },
      pal: MARAIS,
    },
    power: {
      type: 'whip', name: 'Étreinte', icon: '🌀', recharge: 4, range: 180, cry: 'SERRE !',
      intro: "Ton pouvoir : l'ÉTREINTE ! Appuie sur F : tu t'enroules et tu serres tout ce qui est autour de toi. Les proies sont assommées… et les gros crocodiles reculent !",
    },
    species: { dipneuste: 10, poisson: 14, cerrejonisuchus: 5, carbonemys: 3, acherontisuchus: 2 },
    unlock: ['corps-geant', 'machoire-elastique'],
    intro: "Il y a 60 millions d'années, les premières grandes forêts tropicales poussent, avec des marais chauds… et le plus grand serpent de tous les temps : Titanoboa, c'est toi ! 13 mètres de long ! Sur terre, tu es lent et lourd, mais dans l'eau, tu glisses comme une flèche.",
    missions: [
      { type: 'eat', species: 'dipneuste', n: 6, text: 'Avale 6 dipneustes' },
      { type: 'evolve', part: 'corps-geant' },
      { type: 'eat', species: 'cerrejonisuchus', n: 3, text: 'Attrape 3 petits crocodiles' },
      { type: 'stun', species: 'acherontisuchus', n: 2, text: 'Fais reculer 2 grands crocodiles (étreinte)' },
      { type: 'eat', species: 'poisson', n: 8, text: 'Avale 8 poissons' },
      { type: 'evolve', part: 'machoire-elastique' },
    ],
    tips: [
      "Dans l'eau, tu vas très vite : c'est là que tu chasses.",
      "Attention à la tortue géante : sa mâchoire est terrible. Contourne-la !",
      "Un grand crocodile approche ? Étreinte (F) : il recule, tout étourdi.",
    ],
  },
  {
    title: 'Le maître du camouflage',
    ago: [20, 18],
    form: 'vc-cameleon',
    skin: { body: '#5EBE4A', belly: '#E8F6B0', dark: '#1E5A1E', stripe: '#3E9A3A' },
    size: [24, 24],
    moves: { climb: true, climbK: 0.6, jump: 380 },
    camo: true,                      // immobile dans un arbre, le caméléon devient invisible
    vision: 1.4,
    fog: 0.35,
    palette: { water: ['#4A9A8A', '#1A3E36'], floor: '#5A4A2E', motes: 'rgba(230, 255, 140, 0.6)' },
    land: {
      start: 0.06, hills: 90, lakes: 0,
      trees: { kapokier: 20, feuillu: 12, palmier: 4 },
      deco: { fougere: 3, buisson: 1.5, fleur: 1.5, champignon: 1 },
      pal: CANOPEE,
    },
    power: {
      type: 'gulp', name: 'Langue', icon: '👅', recharge: 2.5, range: 230, cry: 'SLURP !', noBurp: true,
      intro: "Ton pouvoir : la LANGUE ! Appuie sur F : ta longue langue collante jaillit, et tous les insectes autour de toi arrivent dans ta bouche !",
    },
    species: { mouche: 14, papillon: 8, 'papillon-bleu': 6, grillon: 6, aigle: 2, 'serpent-arboricole': 3 },
    unlock: ['queue-prehensile', 'casque'],
    intro: "Il y a 20 millions d'années, en Afrique, un drôle de reptile vit dans les arbres : le caméléon, c'est toi ! Tu es lent… mais tu as deux super-pouvoirs : ta langue, plus longue que ton corps, et ton camouflage. Quand tu ne bouges plus dans un arbre, tu deviens invisible !",
    missions: [
      { type: 'eat', species: 'mouche', n: 10, text: 'Attrape 10 mouches avec ta langue' },
      { type: 'evolve', part: 'queue-prehensile' },
      { type: 'visit', place: 'cime', n: 3, icon: '🌳', cry: 'Tout en haut !', text: 'Grimpe en haut de 3 grands arbres' },
      { type: 'escape', species: 'aigle', n: 3, text: 'Échappe 3 fois aux chasseurs (camouflage !)' },
      { type: 'eat', species: 'papillon-bleu', n: 4, text: 'Attrape 4 morphos bleus' },
      { type: 'evolve', part: 'casque' },
    ],
    tips: [
      "Ne bouge plus dans un arbre : tu deviens invisible, même pour l'aigle !",
      "Ta langue (F) attrape tous les insectes autour de toi.",
      "Les morphos bleus volent haut : grimpe en haut des arbres pour les attraper.",
    ],
  },
  {
    title: "L'embuscade",
    ago: [8, 7],
    form: 'vc-purussaurus',
    skin: { body: '#5E6E42', belly: '#D8D2A0', dark: '#262E18', stripe: '#3E4A2A' },
    size: [66, 66],
    moves: { swim: true, swimK: 1.1, walkK: 0.5, jump: 0 },
    ambush: true,                    // immobile sous l'eau, le caïman devient invisible
    vision: 1.4,
    fog: 0.3,
    zoom: 0.85,
    palette: { water: ['#8A7A4A', '#3A3020'], floor: '#7A5A34', motes: 'rgba(255, 250, 220, 0.5)' },
    land: {
      start: 0.08, hills: 70, lakes: 6, lakeW: [500, 900], lakeD: [380, 560],
      trees: { kapokier: 8, palmier: 12, feuillu: 4 },
      deco: { roseau: 4, herbe: 2, buisson: 1, fleur: 1 },
      pal: AMAZONIE,
    },
    power: {
      type: 'whip', name: 'Coup de queue', icon: '💥', recharge: 4, range: 170, cry: 'VLAN !',
      intro: "Ton pouvoir : le COUP DE QUEUE ! Appuie sur F : tout ce qui est autour de toi est assommé.",
    },
    species: { phoberomys: 6, toxodon: 3, arapaima: 6, poisson: 10, piranha: 6, stupendemys: 2, gryposuchus: 3 },
    unlock: ['machoire-geante', 'cuirasse'],
    intro: "Il y a 8 millions d'années, l'Amazonie est un immense marais. Son roi, c'est toi : Purussaurus, un caïman de 10 mètres ! Les grosses bêtes viennent boire au bord de l'eau. Cache-toi sous la surface sans bouger : tu deviens invisible… puis jaillis !",
    missions: [
      { type: 'eat', species: 'arapaima', n: 6, text: 'Attrape 6 arapaimas' },
      { type: 'evolve', part: 'machoire-geante' },
      { type: 'eat', species: 'phoberomys', n: 5, text: 'Surprends 5 rongeurs géants au bord de l’eau' },
      { type: 'stun', species: 'gryposuchus', n: 2, text: 'Chasse 2 gryposuchus de ton marais' },
      { type: 'eat', species: 'toxodon', n: 3, text: 'Surprends 3 toxodons' },
      { type: 'evolve', part: 'cuirasse' },
    ],
    tips: [
      "Sous l'eau, ne bouge plus : tu deviens invisible. Les animaux viennent boire sans te voir…",
      "Quand une proie est tout près du bord, fonce (Espace) !",
      "Les piranhas mordillent : ne reste pas au milieu de leur banc.",
    ],
  },
  {
    title: 'Le dragon et les humains',
    ago: [0.05, 0.045],
    form: 'vc-megalania',
    skin: { body: '#8A7458', belly: '#E2D2AE', dark: '#3A2E20', stripe: '#5E4A34' },
    size: [66, 66],
    moves: { swim: true, swimK: 0.7, jump: 0 },
    vision: 1.4,
    fog: 0.3,
    zoom: 0.85,
    palette: { water: ['#7AA8A8', '#2A4A4A'], floor: '#B0603A', motes: 'rgba(255, 250, 210, 0.5)' },
    land: {
      start: 0.05, hills: 120, lakes: 2, camps: 2, cliffs: 1,
      trees: { acacia: 10, feuillu: 5 },
      deco: { herbe: 3, buisson: 1.5, rocher: 1.2, os: 0.3 },
      pal: OUTBACK,
    },
    power: {
      type: 'whip', name: 'Morsure venimeuse', icon: '🐍', recharge: 4, range: 170, cry: 'CROC VENIMEUX !',
      intro: "Ton pouvoir : la MORSURE VENIMEUSE ! Appuie sur F : tout ce qui est près de toi est mordu et s'affaiblit. Même un diprotodon !",
    },
    species: { oeuf: 8, genyornis: 3, bandicoot: 8, diprotodon: 3, thylacoleo: 2, chasseur: 3 },
    unlock: ['griffes', 'pattes-fortes'],
    intro: "Il y a 50 000 ans, en Australie, vit le plus grand lézard de tous les temps : Megalania, c'est toi ! 7 mètres, et une morsure venimeuse. Mais de nouveaux venus arrivent sur l'île… les humains, avec leurs lances et leur feu. Reste loin de leurs camps !",
    missions: [
      { type: 'eat', species: 'oeuf', n: 5, text: 'Mange 5 œufs de Genyornis' },
      { type: 'evolve', part: 'griffes' },
      { type: 'stun', species: 'diprotodon', n: 2, text: 'Mords 2 diprotodons (morsure venimeuse)' },
      { type: 'eat', species: 'bandicoot', n: 5, text: 'Attrape 5 bandicoots' },
      { type: 'escape', species: 'chasseur', n: 3, text: 'Échappe 3 fois aux chasseurs' },
      { type: 'evolve', part: 'pattes-fortes' },
    ],
    tips: [
      "Les œufs de Genyornis sont par terre… mais le grand oiseau les défend à coups de pattes !",
      "Ta morsure venimeuse (F) affaiblit même les géants.",
      "Près des camps, les chasseurs te repèrent de loin : cache-toi dans les buissons.",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! La météorite est passée… mais toi, petit lézard, tu es vivant ! Grimpe aux arbres avec ↑ quand tu es près d'un tronc.",
};

/* La fin : les reptiles sont toujours là… et les humains aussi */
const ending = {
  scene: 'reptiles',
  title: 'Les champions de la survie',
  sub: "Les reptiles ont survécu à la météorite, aux glaciations… et ils sont toujours là ! Aujourd'hui, il existe plus de 11 000 espèces de reptiles : des serpents, des lézards, des tortues, des crocodiles.",
  done: 'Tu as traversé les âges',
  captions: [
    [0.4, 4.4, "Megalania a disparu… mais les reptiles, eux, sont toujours là !"],
    [4.6, 9, "Le crocodile, la tortue, le caméléon, l'iguane, le dragon de Komodo : les cousins des dinosaures vivent encore parmi nous."],
    [9.4, 14, "Et les nouveaux maîtres de la Terre, ce sont les humains. À eux de protéger les reptiles, maintenant !"],
  ],
  parade: [
    { look: 'vc-gecko', name: 'Gecko', color: '#E2B04A', belly: '#F6E8C0', k: 0.35 },
    { look: 'vc-cameleon', name: 'Caméléon', color: '#4EB84A', belly: '#E8F6B0', k: 0.45 },
    { look: 'vc-iguane', name: 'Iguane', color: '#5AA84A', belly: '#D8E8A0', k: 0.6 },
    { look: 'vc-tortue', name: 'Tortue', color: '#7A8A4A', belly: '#E8D8A8', k: 0.6, shell: '#6A5A30' },
    { look: 'vc-serpent', name: 'Serpent', color: '#B08A3A', belly: '#F2E2B0', k: 0.55 },
    { look: 'vc-komodo', name: 'Dragon de Komodo', color: '#7A6A58', belly: '#C8B8A0', k: 0.8 },
    { look: 'vc-crocodile', name: 'Crocodile', color: '#5A6A3A', belly: '#D8D2A0', k: 0.95 },
  ],
  choices: [
    {
      id: 'humains', icon: '🔥', title: 'La voie des humains',
      text: "Et maintenant, vis l'aventure des humains : tailler la pierre, faire du feu, peindre les grottes…",
      level: 'voie-des-humains',
      soon: 'Niveau 4 : La voie des humains',
      fact: "Les tortues vivent sur Terre depuis plus de 200 millions d'années : elles ont vu passer les dinosaures, les mammouths… et les humains !",
    },
  ],
};

export default {
  id: 'voie-des-reptiles',
  name: 'La voie des reptiles',
  num: 3,
  icon: '🐊',
  intro: 'reptiles',
  goal: "Tu es un petit lézard qui a survécu à la météorite. <b>Grimpe aux arbres, plonge dans les marais, cache-toi… et traverse les âges</b> :<br>🦎 le lézard → 🐍 Titanoboa → 🌳 le caméléon → 🐊 Purussaurus → 🐉 Megalania !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
