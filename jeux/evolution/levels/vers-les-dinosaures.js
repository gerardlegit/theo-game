// ============================================================================
// NIVEAU 2 — VERS LES DINOSAURES
//
// De la sortie de l'eau (il y a 375 millions d'années) jusqu'au règne des
// dinosaures… et à la météorite qui y met fin, il y a 66 millions d'années.
// Sur la terre ferme, survivre est un vrai défi : la peau sèche loin de l'eau,
// les chasseurs ne voient que devant eux mais entendent quand on court, la
// boue englue, les géants écrasent. Seuls les plus malins s'en sortent.
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : marais, mares, forêts de fougères pour se cacher, arbres, boue */
const world = {
  ground: 'land',                  // terre ferme : pas de reflets d'eau, de la poussière
  w: 12000,
  h: 8000,
  start: { x: 2200, y: 4000 },
  maxChasers: 3,
  noise: 560,                      // un sprint s'entend jusque-là : les chasseurs se retournent
  penalty: { adn: 0.3, growth: 0.06 },   // se faire manger coûte un peu moins cher que dans l'océan
  decor: [
    { type: 'mare', count: 30, r: [190, 540], zone: 'water', atStart: true },
    { type: 'boue', count: 24, r: [130, 320], zone: 'mud' },
    { type: 'fougeres', count: 80, r: [110, 380], hide: true },
    { type: 'arbre-ancien', count: 80, r: [80, 170], canopy: true, to: 2 },
    { type: 'conifere', count: 80, r: [90, 190], canopy: true, from: 3 },
    { type: 'rocher', count: 120, r: [18, 90] },
    { type: 'prele', count: 130, r: [14, 34], to: 2 },
    { type: 'cycas', count: 90, r: [24, 52], from: 3 },
    { type: 'os', count: 45, r: [30, 70], from: 2 },
    { type: 'nid', count: 16, r: [26, 40], from: 4 },
    { type: 'fleur', count: 160, r: [6, 12], from: 5 },
  ],
};

/* Les êtres vivants. En plus du niveau 1 :
   habitat 'water' = ne quitte jamais les mares ; flying = vole (ignore la boue, passe au-dessus des arbres) ;
   cone = angle de vue (radians) : il ne voit que devant lui ; pack = vit en meute ;
   stomp = ses pas font trembler le sol ; roar = il rugit quand il te repère ;
   hurt = ce qui s'affiche quand il te blesse (defender, giant) ;
   reach = (animaux des mares) jusqu'où il attaque dans sa mare : 0,55 = seulement au milieu. */
const species = {
  /* ---- Chapitre 1 : la sortie de l'eau ---- */
  insecte: {
    name: 'Insecte', plural: 'insectes', kind: 'prey', look: 'insecte', color: '#7FA63A',
    size: 5, speed: 75, sense: 80, adn: 2,
    fact: "Les premiers insectes sont apparus il y a plus de 400 millions d'années. Ils ont conquis la terre bien avant nous !",
  },
  'mille-pattes': {
    name: 'Mille-pattes', plural: 'mille-pattes', kind: 'prey', look: 'millepattes', color: '#B5651D',
    size: 10, speed: 60, sense: 120, adn: 4,
    fact: "Les mille-pattes font partie des tout premiers animaux à avoir marché sur la terre ferme.",
  },
  'petit-poisson': {
    name: 'Petit poisson', plural: 'petits poissons', kind: 'prey', look: 'poisson', color: '#9FD8E8', habitat: 'water',
    fish: { jaw: 'small' },
    size: 9, speed: 85, sense: 120, adn: 3,
    fact: "Au Dévonien, les mares et les rivières grouillaient de poissons. Certains avaient déjà des poumons !",
  },
  scorpion: {
    name: 'Scorpion', plural: 'scorpions', kind: 'hunter', look: 'scorpion', color: '#7A4E2D',
    size: 32, speed: 185, sense: 300, cone: 2.2, adn: 14,
    fact: "Les scorpions ont été parmi les premiers chasseurs de la terre ferme. Leur queue cache un dard !",
  },
  hyneria: {
    name: 'Hyneria', plural: 'Hyneria', proper: true, kind: 'hunter', look: 'poisson', color: '#5D6B4F', habitat: 'water',
    fish: { jaw: 'teeth', fins: true },
    size: 70, speed: 205, sense: 300, reach: 0.55, adn: 30,
    fact: "Hyneria était un poisson géant aux dents pointues. Il guettait les animaux qui s'approchaient trop près du bord !",
  },

  /* ---- Chapitre 2 : la forêt de charbon ---- */
  blatte: {
    name: 'Blatte géante', plural: 'blattes géantes', kind: 'prey', look: 'blatte', color: '#8B5A2B',
    size: 12, speed: 115, sense: 170, adn: 6,
    fact: "Les ancêtres des blattes couraient déjà dans les forêts du Carbonifère, il y a 300 millions d'années… et elles sont toujours là !",
  },
  meganeura: {
    name: 'Meganeura', plural: 'Meganeura', proper: true, kind: 'hunter', look: 'libellule', color: '#3FA7D6', flying: true,
    size: 50, speed: 255, sense: 330, adn: 18,
    fact: "Meganeura était une libellule géante : ses ailes étaient aussi larges que les bras d'un adulte ! L'air contenait plus d'oxygène.",
  },
  arthropleura: {
    name: 'Arthropleura', plural: 'Arthropleura', proper: true, kind: 'neutral', look: 'millepattes', color: '#5C4033',
    size: 115, speed: 50, adn: 0,
    fact: "Arthropleura, un mille-pattes géant, mesurait plus de 2 mètres ! Rassure-toi : il mangeait des plantes.",
  },
  'scorpion-geant': {
    name: 'Scorpion géant', plural: 'scorpions géants', kind: 'hunter', look: 'scorpion', color: '#4A2F1E',
    size: 62, speed: 215, sense: 330, cone: 1.9, adn: 24,
    fact: "Pulmonoscorpius, un scorpion géant du Carbonifère, était aussi long que ton bras !",
  },
  'amphibien-geant': {
    name: 'Amphibien géant', plural: 'amphibiens géants', kind: 'hunter', look: 'lezard', color: '#6E7F3A',
    body: { wide: true },
    size: 105, speed: 235, sense: 370, cone: 2.0, adn: 40,
    fact: "Il y a 300 millions d'années, des amphibiens géants de 2 mètres, comme Eryops, chassaient au bord des marais.",
  },

  /* ---- Chapitre 3 : les premiers dinosaures ---- */
  lezard: {
    name: 'Petit reptile', plural: 'petits reptiles', kind: 'prey', look: 'lezard', color: '#8DB255',
    size: 20, speed: 160, sense: 220, adn: 6,
    fact: "Au Trias, les reptiles sont partout : petits, grands, sur terre, dans l'eau et même dans les airs !",
  },
  cynodonte: {
    name: 'Cynodonte', plural: 'cynodontes', kind: 'prey', look: 'lezard', color: '#A0785A',
    body: { fur: true },
    size: 26, speed: 175, sense: 230, adn: 8,
    fact: "Les cynodontes étaient de petits animaux poilus… ce sont les ancêtres des mammifères !",
  },
  coelophysis: {
    name: 'Coelophysis', plural: 'Coelophysis', proper: true, kind: 'hunter', look: 'coelophysis', color: '#C9A35C', pack: 3,
    size: 82, speed: 330, sense: 420, cone: 2.4, adn: 22,
    fact: "On a retrouvé des dizaines de Coelophysis ensemble : ces premiers dinosaures, légers et rapides, vivaient peut-être en groupe.",
  },
  postosuchus: {
    name: 'Postosuchus', plural: 'Postosuchus', proper: true, kind: 'hunter', look: 'lezard', color: '#7B3F2A',
    body: { snout: 1.2, plates: 'back' }, stomp: true, roar: true,
    size: 150, speed: 320, sense: 460, cone: 2.2, adn: 50,
    fact: "Postosuchus n'était pas un dinosaure mais un cousin des crocodiles. Au Trias, c'était lui le grand chasseur !",
  },
  phytosaure: {
    name: 'Phytosaure', plural: 'phytosaures', kind: 'hunter', look: 'lezard', color: '#556B2F', habitat: 'water',
    body: { snout: 1.8 },
    size: 120, speed: 225, sense: 320, adn: 35,
    fact: "Les phytosaures ressemblaient à des crocodiles, mais leurs narines étaient près des yeux, en haut de la tête.",
  },

  /* ---- Chapitre 4 : le Jurassique ---- */
  compsognathus: {
    name: 'Compsognathus', plural: 'Compsognathus', proper: true, kind: 'prey', look: 'compsognathus', color: '#7FB069',
    size: 34, speed: 300, sense: 300, adn: 12,
    fact: "Compsognathus était un tout petit dinosaure, pas plus grand qu'une poule !",
  },
  dryosaure: {
    name: 'Dryosaure', plural: 'dryosaures', kind: 'prey', look: 'dryosaure', color: '#B5C26A',
    size: 70, speed: 295, sense: 340, adn: 22,
    fact: "Dryosaurus était un petit dinosaure herbivore qui courait très vite sur ses deux pattes.",
  },
  rhamphorhynchus: {
    name: 'Rhamphorhynchus', plural: 'Rhamphorhynchus', proper: true, kind: 'prey', look: 'rhamphorhynchus', color: '#C9824F', flying: true,
    size: 30, speed: 280, sense: 260, adn: 10,
    fact: "Rhamphorhynchus était un reptile volant avec une longue queue terminée par une petite palette.",
  },
  stegosaure: {
    name: 'Stégosaure', plural: 'stégosaures', kind: 'defender', look: 'stegosaure', color: '#8C9A5B',
    body: { tailSpikes: true }, hurt: 'Pic !',
    size: 170, speed: 130, sense: 260, adn: 60,
    fact: "Le stégosaure avait des plaques sur le dos et des pointes au bout de la queue pour se défendre. Son cerveau était tout petit !",
  },
  brachiosaure: {
    name: 'Brachiosaure', plural: 'brachiosaures', kind: 'giant', look: 'brachiosaure', color: '#8E9A8A', stomp: true, hurt: 'Écrasé !',
    size: 340, speed: 70, adn: 0,
    fact: "Le brachiosaure était si grand qu'il aurait pu regarder par la fenêtre d'un immeuble de 4 étages !",
  },
  diplodocus: {
    name: 'Diplodocus', plural: 'diplodocus', kind: 'giant', look: 'diplodocus', color: '#A3946B', stomp: true, hurt: 'Écrasé !',
    size: 300, speed: 80, adn: 0,
    fact: "Le diplodocus était aussi long que trois autobus ! Il se servait peut-être de sa queue comme d'un fouet.",
  },
  ceratosaure: {
    name: 'Ceratosaurus', plural: 'Ceratosaurus', proper: true, kind: 'hunter', look: 'ceratosaure', color: '#8C5A3C', stomp: true, roar: true,
    size: 160, speed: 380, sense: 500, cone: 2.3, adn: 50,
    fact: "Ceratosaurus avait une corne sur le nez et de très longues dents.",
  },
  allosaure: {
    name: 'Allosaurus', plural: 'Allosaurus', proper: true, kind: 'hunter', look: 'allosaure', color: '#9A6A3A', stomp: true, roar: true,
    size: 210, speed: 400, sense: 540, cone: 2.3, adn: 70,
    fact: "Allosaurus était le plus grand chasseur du Jurassique. Il pouvait ouvrir la gueule très grand !",
  },

  /* ---- Chapitre 5 : le Crétacé ---- */
  edmontosaure: {
    name: 'Edmontosaure', plural: 'edmontosaures', kind: 'prey', look: 'edmontosaure', color: '#8E8466',
    size: 110, speed: 300, sense: 390, adn: 30,
    fact: "Edmontosaurus, un dinosaure à bec de canard, avait des centaines de dents pour mâcher les plantes !",
  },
  parasaurolophus: {
    name: 'Parasaurolophus', plural: 'parasaurolophus', kind: 'prey', look: 'parasaurolophus', color: '#7E9A6A',
    size: 120, speed: 310, sense: 400, adn: 32,
    fact: "Le parasaurolophus avait une longue crête creuse sur la tête : il soufflait dedans pour faire un grand « Tuuut » comme une trompette !",
  },
  gallimimus: {
    name: 'Gallimimus', plural: 'gallimimus', kind: 'prey', look: 'gallimimus', color: '#B9925E',
    size: 85, speed: 380, sense: 430, adn: 24,
    fact: "Gallimimus ressemblait à une autruche : il courait plus vite qu'un cheval de course !",
  },
  pteranodon: {
    name: 'Ptéranodon', plural: 'ptéranodons', kind: 'prey', look: 'pteranodon', color: '#E6DCC6', flying: true,
    size: 70, speed: 330, sense: 380, adn: 20,
    fact: "Le ptéranodon n'était pas un dinosaure mais un reptile volant. Ses ailes étaient des peaux tendues sur un doigt immense !",
  },
  spinosaure: {
    name: 'Spinosaure', plural: 'spinosaures', kind: 'hunter', look: 'spinosaure', color: '#6F7D5A', habitat: 'water',
    roar: true, size: 280, speed: 300, sense: 420, reach: 0.65, adn: 90,
    fact: "Le spinosaure, avec sa grande voile sur le dos, était encore plus long que le T. rex ! Il chassait les poissons dans les rivières.",
  },
  pachycephalosaure: {
    name: 'Pachycéphalosaure', plural: 'pachycéphalosaures', kind: 'defender', look: 'pachycephalosaure', color: '#B07A4A', hurt: 'Bong !',
    size: 90, speed: 285, sense: 270, adn: 26,
    fact: "Le pachycéphalosaure avait un crâne bombé et très épais, comme un casque.",
  },
  dakotaraptor: {
    name: 'Dakotaraptor', plural: 'Dakotaraptor', proper: true, kind: 'hunter', look: 'raptor', color: '#5E6E8C', pack: 2,
    size: 200, speed: 480, sense: 560, cone: 2.5, adn: 55,
    fact: "Dakotaraptor, un cousin géant du vélociraptor, était couvert de plumes et avait une énorme griffe en forme de faucille à chaque patte.",
  },
  triceratops: {
    name: 'Tricératops', plural: 'tricératops', kind: 'defender', look: 'triceratops', color: '#9C7650', stomp: true, hurt: 'Aïe, les cornes !',
    size: 260, speed: 200, sense: 280, adn: 80,
    fact: "Le tricératops avait trois cornes et une grande collerette. Même le T. rex s'en méfiait !",
  },
  ankylosaure: {
    name: 'Ankylosaure', plural: 'ankylosaures', kind: 'defender', look: 'ankylosaure', color: '#7D7461', armored: true,
    body: { club: true }, hurt: 'Boum, la massue !',
    size: 200, speed: 120, sense: 230, adn: 70,
    fact: "L'ankylosaure était couvert d'une armure d'os, avec une massue au bout de la queue !",
  },
  quetzalcoatlus: {
    name: 'Quetzalcoatlus', plural: 'Quetzalcoatlus', proper: true, kind: 'hunter', look: 'quetzalcoatlus', color: '#D8C3A0', flying: true,
    size: 230, speed: 450, sense: 560, adn: 60,
    fact: "Quetzalcoatlus était le plus grand animal volant de tous les temps. Debout, il était aussi haut qu'une girafe !",
  },
  trex: {
    name: 'T. rex rival', plural: 'T. rex rivaux', proper: true, kind: 'hunter', look: 'trex', color: '#5B4636', boss: true, stomp: true, roar: true,
    size: 360, speed: 500, sense: 660, cone: 2.3, adn: 250,
    fact: "Tyrannosaurus rex avait la morsure la plus puissante de tous les animaux terrestres connus !",
  },
};

/* Les évolutions. En plus du niveau 1 : dry (vitesse à laquelle la peau sèche
   hors de l'eau, 0 = plus jamais), cones (voir où regardent les chasseurs),
   radar (voir les chasseurs de loin sur le radar). */
const evolutions = {
  pattes: {
    name: 'Pattes', ch: 1, cost: 20, effect: { speed: 1.25 },
    short: 'Tu marches vite sur la terre',
    fact: "Les premiers tétrapodes avaient des nageoires avec des os, comme des débuts de pattes. C'est grâce à elles qu'on a pu marcher !",
  },
  poumons: {
    name: 'Poumons', ch: 1, cost: 45, effect: { dry: 0.5 },
    short: 'Tu tiens deux fois plus longtemps hors de l’eau',
    fact: "Pour vivre sur terre, il faut respirer l'air avec des poumons. Certains poissons en avaient déjà !",
  },
  ecailles: {
    name: 'Écailles', ch: 2, cost: 60, effect: { dry: 0.25, shield: 1 },
    short: 'Ta peau sèche moins vite, et elle te protège',
    fact: "La peau à écailles des reptiles garde l'eau à l'intérieur du corps : plus besoin de rester près des mares !",
  },
  oeuf: {
    name: 'Œuf à coquille', ch: 2, cost: 90, effect: { dry: 0 },
    short: 'Plus besoin d’eau : tu peux vivre partout !',
    fact: "L'œuf à coquille garde le bébé au chaud et à l'humide. Grâce à lui, les reptiles ont pu pondre loin de l'eau.",
  },
  cerveau: {
    name: 'Gros cerveau', ch: 3, cost: 140, effect: { cones: true, radar: true },
    short: 'Tu vois où regardent les chasseurs',
    fact: "Sur la terre, survivre demande d'être malin : repérer les dangers, se cacher, trouver à manger. Un plus gros cerveau, ça aide !",
  },
  griffes: {
    name: 'Griffes', ch: 3, cost: 180, effect: { ratio: 0.95, reach: 1.2 },
    short: 'Tu attrapes des proies plus grosses',
    fact: "Les dinosaures carnivores avaient de grandes griffes pour agripper leurs proies.",
  },
  dents: {
    name: 'Dents tranchantes', ch: 4, cost: 260, effect: { ratio: 1.05, armored: true },
    short: 'Tu croques même les carapaces',
    fact: "Les dents des grands carnivores étaient dentelées comme un couteau à pain !",
  },
  flair: {
    name: 'Flair', ch: 4, cost: 300, effect: { vision: 1.6, radar: true },
    short: 'Tu sens les proies et les chasseurs de loin',
    fact: "Le T. rex avait un très bon odorat : la partie de son cerveau qui sert à sentir les odeurs était énorme !",
  },
  'peau-epaisse': {
    name: 'Peau épaisse', ch: 5, cost: 400, effect: { shield: 2 },
    short: 'Tu encaisses deux coups',
    fact: "Certains grands dinosaures avaient une peau très épaisse, parfois couverte de petites plaques d'os.",
  },
  morsure: {
    name: 'Morsure géante', ch: 5, cost: 520, effect: { ratio: 1.6 },
    short: 'La morsure la plus puissante de la Terre !',
    fact: "Le T. rex pouvait broyer des os ! Sa morsure était plus forte que celle de n'importe quel animal terrestre d'aujourd'hui.",
  },
};

/* L'histoire. En plus du niveau 1 : dry = la peau sèche hors de l'eau (part de
   la réserve perdue par seconde), waterSpeed = vitesse dans l'eau, speed =
   bonus de vitesse de la forme, vision / fog = jusqu'où on voit, et à quel point
   le reste est sombre. */
const chapters = [
  {
    title: "La sortie de l'eau",
    ago: [375, 360],
    form: 'tetrapode',
    skin: { body: '#4FAE9C', belly: '#F1E3A0', dark: '#1D5A4E', stripe: '#2E7A6C' },
    size: [20, 40],
    growth: 140,
    dry: 1 / 22,
    waterSpeed: 1,
    vision: 1.3,
    fog: 0.55,
    palette: { water: ['#5E7F4E', '#33452A'], floor: '#7C8A55', motes: 'rgba(255, 250, 200, 0.5)' },
    species: { insecte: 18, 'mille-pattes': 12, 'petit-poisson': 8, scorpion: 3, hyneria: 2 },
    unlock: ['pattes', 'poumons'],
    intro: "Te voilà au bord de l'eau, il y a 375 millions d'années. Sur la terre, presque personne… mais attention : ta peau sèche vite ! Retourne souvent dans une mare. Et dans l'eau, méfie-toi de Hyneria…",
    missions: [
      { type: 'evolve', part: 'pattes' },
      { type: 'eat', species: 'mille-pattes', n: 5 },
      { type: 'evolve', part: 'poumons' },
      { type: 'grow' },
      { type: 'eat', species: 'scorpion', n: 1, revenge: true },
    ],
    tips: [
      "Ta réserve d'eau 💧 baisse sur la terre. Bois au bord d'une mare… mais ne va pas au milieu : Hyneria guette !",
      "Le scorpion ne voit que devant lui : passe derrière lui sans courir.",
      "Quand tu sprintes, ça fait du bruit : les chasseurs t'entendent !",
    ],
  },
  {
    title: 'La forêt de charbon',
    ago: [315, 300],
    form: 'reptile',
    skin: { body: '#D98E3A', belly: '#F7E0A8', dark: '#6B3A12', stripe: '#8A4A16' },
    size: [40, 70],
    growth: 320,
    dry: 1 / 30,
    waterSpeed: 0.7,
    vision: 0.85,
    fog: 0.72,
    palette: { water: ['#3D5A3A', '#1E2E1C'], floor: '#4F6B3A', motes: 'rgba(210, 255, 170, 0.45)' },
    species: { insecte: 12, blatte: 12, 'mille-pattes': 8, arthropleura: 2, meganeura: 2, 'scorpion-geant': 2, 'amphibien-geant': 2 },
    unlock: ['ecailles', 'oeuf'],
    intro: "Des millions d'années plus tard, tes descendants ressemblent à des lézards. La forêt de charbon est sombre, humide… et pleine de monstres : libellules géantes, scorpions énormes. Il te faut une peau à écailles et des œufs à coquille pour quitter les mares !",
    missions: [
      { type: 'evolve', part: 'ecailles' },
      { type: 'eat', species: 'blatte', n: 6 },
      { type: 'evolve', part: 'oeuf' },
      { type: 'grow' },
      { type: 'eat', species: 'meganeura', n: 1, revenge: true },
    ],
    tips: [
      "Il fait sombre dans la forêt… Écoute bien : les chasseurs approchent sans bruit.",
      "La boue, ça colle ! Si un chasseur te suit dedans, il sera ralenti… toi aussi.",
      "Arthropleura est énorme, mais il ne mange que des plantes. Ouf !",
    ],
  },
  {
    title: 'Les premiers dinosaures',
    ago: [230, 210],
    form: 'dino',
    skin: { body: '#C8553D', belly: '#F6CFA8', dark: '#5E1F14', stripe: '#7A2A1C' },
    size: [70, 110],
    growth: 600,
    speed: 1.05,
    vision: 1.4,
    fog: 0.45,
    palette: { water: ['#B98F5A', '#7A5534'], floor: '#C2A36B', motes: 'rgba(255, 230, 180, 0.5)' },
    species: { lezard: 12, cynodonte: 8, coelophysis: 3, postosuchus: 2, phytosaure: 2 },
    unlock: ['cerveau', 'griffes'],
    intro: "Le Trias ! Tes descendants marchent sur deux pattes : tu es devenu l'un des tout premiers dinosaures. Mais ici, le roi, c'est Postosuchus… et les Coelophysis chassent en meute. Sois malin !",
    missions: [
      { type: 'evolve', part: 'cerveau' },
      { type: 'eat', species: 'cynodonte', n: 4 },
      { type: 'evolve', part: 'griffes' },
      { type: 'grow' },
      { type: 'eat', species: 'coelophysis', n: 1, revenge: true },
    ],
    tips: [
      "Avec un gros cerveau, tu vois les zones que regardent les chasseurs. Reste en dehors !",
      "Une meute ! Si l'un te voit, les autres arrivent aussi…",
      "Boum… boum… Tu sens le sol trembler ? C'est Postosuchus qui approche.",
    ],
  },
  {
    title: 'Le Jurassique',
    ago: [155, 145],
    form: 'grand-dino',
    skin: { body: '#3E7CB8', belly: '#DCEAF5', dark: '#1B3A5C', stripe: '#F2C14E' },
    size: [110, 170],
    growth: 1000,
    speed: 1.05,
    vision: 1.3,
    fog: 0.5,
    palette: { water: ['#5C7F4A', '#2F4A2A'], floor: '#6E8B4E', motes: 'rgba(255, 255, 210, 0.5)' },
    species: { compsognathus: 10, dryosaure: 8, rhamphorhynchus: 6, stegosaure: 2, brachiosaure: 1, diplodocus: 1, ceratosaure: 2, allosaure: 2 },
    unlock: ['dents', 'flair'],
    intro: "Le Jurassique, l'âge des géants ! Les brachiosaures et les diplodocus sont si grands qu'ils peuvent t'écraser sans le faire exprès. Et l'Allosaurus, le plus terrible chasseur de l'époque, rôde dans la forêt…",
    missions: [
      { type: 'evolve', part: 'dents' },
      { type: 'eat', species: 'dryosaure', n: 4 },
      { type: 'evolve', part: 'flair' },
      { type: 'grow' },
      { type: 'eat', species: 'ceratosaure', n: 1, revenge: true },
    ],
    tips: [
      "Ne passe pas sous les pattes d'un brachiosaure !",
      "Le stégosaure n'est pas méchant… sauf si tu t'approches trop de sa queue à pointes.",
    ],
  },
  {
    title: 'Le Crétacé',
    ago: [68, 66],
    form: 'tyran',
    skin: { body: '#2F6E73', belly: '#F2D7A6', dark: '#123336', stripe: '#E9822B' },
    size: [170, 260],
    growth: 2600,
    vision: 1.25,
    fog: 0.55,
    palette: { water: ['#7C7A4A', '#3F3C24'], floor: '#8A8656', motes: 'rgba(255, 240, 200, 0.5)' },
    species: { edmontosaure: 5, parasaurolophus: 3, gallimimus: 4, pteranodon: 3, pachycephalosaure: 3, dakotaraptor: 2, triceratops: 2, ankylosaure: 2, quetzalcoatlus: 2, spinosaure: 2, trex: 1 },
    unlock: ['peau-epaisse', 'morsure'],
    intro: "La fin du Crétacé. Les premières fleurs ont poussé, et tu es devenu un grand tyrannosaure ! Mais un autre T. rex règne ici. Pour dominer la Terre, il faudra le battre…",
    missions: [
      { type: 'evolve', part: 'peau-epaisse' },
      { type: 'eat', species: 'edmontosaure', n: 4 },
      { type: 'evolve', part: 'morsure' },
      { type: 'grow' },
      { type: 'eat', species: 'trex', n: 1, revenge: true },
    ],
    tips: [
      "Le tricératops charge si tu t'approches de ses cornes !",
      "Dans les rivières, méfie-toi du spinosaure et de sa grande voile…",
      "Le T. rex rival est plus gros que toi. Grandis et fais-toi pousser la morsure géante avant de l'attaquer !",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Moi, je reste au bord de l'eau, mais je te suis partout. Sur la terre, c'est un vrai défi : seuls les plus malins survivent !",
};

/* La fin : on domine la Terre… puis la météorite. Trois chemins pour la suite. */
const ending = {
  scene: 'meteorite',
  crowd: ['parasaurolophus', 'triceratops', 'ankylosaure', 'gallimimus'],
  title: 'La fin des dinosaures',
  sub: "Il y a 66 millions d'années, une météorite géante a frappé la Terre. Les grands dinosaures ont tous disparu… mais certains animaux ont survécu. Qui seront tes descendants ?",
  done: "Tu as dominé la Terre… jusqu'à la météorite",
  captions: [
    [0.4, 4, "Tu domines la Terre ! Aucun animal n'ose plus t'approcher…"],
    [4.2, 7.2, "Mais il y a 66 millions d'années, quelque chose arrive du ciel…"],
    [7.6, 11.6, "Une météorite géante s'écrase. Le ciel devient noir, il fait froid… Les grands dinosaures disparaissent."],
    [11.8, 15, "Mais certains animaux survivent…"],
  ],
  choices: [
    {
      id: 'airs', icon: '🐦', title: 'La voie des airs',
      text: "Tes descendants ont des plumes et deviennent de petits oiseaux… les seuls dinosaures encore vivants !",
      level: 'voie-des-airs',
      soon: 'Niveau 3 : La voie des airs',
      fact: "Les oiseaux sont des dinosaures ! La poule et le pigeon sont de lointains cousins du T. rex.",
    },
    {
      id: 'mammiferes', icon: '🐭', title: 'La voie des mammifères',
      text: 'De petites boules de poils, cachées dans leurs terriers… qui vont conquérir la planète.',
      level: 'voie-des-mammiferes',
      soon: 'Niveau 3 : La voie des mammifères',
      fact: "Les petits mammifères ont survécu en se cachant sous terre. Sans les dinosaures, ils ont pu grandir et se répandre partout.",
    },
    {
      id: 'reptiles', icon: '🐊', title: 'La voie des reptiles',
      text: 'Crocodiles, tortues et lézards : des survivants à toute épreuve.',
      level: 'voie-des-reptiles',
      soon: 'Niveau 3 : La voie des reptiles',
      fact: "Les crocodiles vivaient déjà au temps des dinosaures… et ils ont survécu à la météorite !",
    },
  ],
};

export default {
  id: 'vers-les-dinosaures',
  name: 'Vers les dinosaures',
  icon: '🦖',
  intro: 'terre',
  goal: "Tes descendants sortent de l'eau. Sur la terre, tout est dangereux : <b>seuls les plus malins survivent</b>. Cache-toi, ne cours pas pour rien, et deviens le plus grand des dinosaures :<br>🐸 le tétrapode → 🦎 le reptile → 🦖 le dinosaure → 👑 le roi de la Terre !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
