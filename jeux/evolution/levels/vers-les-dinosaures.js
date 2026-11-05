// ============================================================================
// NIVEAU 2 — VERS LES DINOSAURES
//
// De la sortie de l'eau (il y a 375 millions d'années) jusqu'au T. rex… et à
// la météorite. Les animaux sont vus de trois quarts (art-trois-quarts.js) :
// ils vont dans toutes les directions, comme les requins.
// À chaque chapitre, le joueur devient un autre animal, avec son pouvoir à lui
// (touche F ou le bouton orange) :
//   le tétrapode aspire ses proies, le lézard laisse sa queue en leurre,
//   le premier dinosaure balaie tout d'un coup de queue, l'Allosaurus flaire
//   ce qui se cache dans les fougères, le T. rex rugit à tout faire trembler.
// On ne grandit plus en mangeant (world.noGrow) : manger vite de suite
// rapporte des combos (world.combo). Chaque chapitre se termine contre un
// géant, qu'on touche en plusieurs coups (sa barre de vie : hits).
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : marais, mares, forêts de fougères pour se cacher, arbres, boue */
const world = {
  ground: 'land',
  w: 12000,
  h: 8000,
  start: { x: 2200, y: 4000 },
  maxChasers: 3,
  noGrow: true,
  combo: true,
  noise: 560,                      // un sprint s'entend jusque-là : les chasseurs se retournent
  penalty: { adn: 0.2, growth: 0 },
  decor: [
    { type: 'mare', count: 30, r: [190, 540], zone: 'water', atStart: true },
    { type: 'boue', count: 18, r: [130, 320], zone: 'mud' },
    { type: 'fougeres', count: 70, r: [130, 340], hide: true, to: 3 },
    { type: 'fougeres', count: 60, r: [240, 520], hide: true, from: 4 },
    { type: 'arbre-ancien', count: 80, r: [80, 170], canopy: true, to: 2 },
    { type: 'conifere', count: 80, r: [110, 220], canopy: true, from: 3 },
    { type: 'rocher', count: 110, r: [18, 90] },
    { type: 'prele', count: 130, r: [14, 34], to: 2 },
    { type: 'cycas', count: 90, r: [24, 52], from: 3 },
    { type: 'os', count: 45, r: [30, 70], from: 2 },
    { type: 'nid', count: 16, r: [26, 40], from: 4 },
    { type: 'fleur', count: 160, r: [6, 12], from: 5 },
  ],
};

/* Les êtres vivants. look 'tq-…' = dessiné de trois quarts (art-trois-quarts.js).
   hits = les coups qu'encaisse un géant (sa barre de vie) ; tailBite = on le touche
   en lui mordant la queue ; breachHit = le pouvoir du chapitre le touche (le
   rugissement) ; buried = caché dans les fougères ; fierce = il attaque même plus
   gros que lui (une meute) ; habitat 'water' = il ne quitte pas sa mare. */
const species = {
  /* ---- Chapitre 1 : la sortie de l'eau ---- */
  insecte: {
    name: 'Insecte', plural: 'insectes', kind: 'prey', look: 'insecte', color: '#6E9A42',
    size: 8, speed: 120, sense: 120, adn: 3,
    fact: "Les premiers insectes sont apparus il y a plus de 400 millions d'années. Ils ont conquis la terre bien avant nous !",
  },
  'mille-pattes': {
    name: 'Mille-pattes', plural: 'mille-pattes', kind: 'prey', look: 'millepattes', color: '#8A5A34',
    size: 12, speed: 90, sense: 120, adn: 5,
    fact: "Les mille-pattes figurent parmi les tout premiers animaux à avoir marché sur la terre ferme. Et non : ils n'ont jamais vraiment mille pattes !",
  },
  'petit-poisson': {
    name: 'Petit poisson', plural: 'petits poissons', kind: 'prey', look: 'poisson', color: '#9FD8E8', fish: { jaw: 'small' }, habitat: 'water',
    size: 11, speed: 170, sense: 160, adn: 5,
    fact: "Les premiers animaux à pattes vivaient encore à moitié dans l'eau. Ils y chassaient les petits poissons, comme le font les tritons aujourd'hui.",
  },
  scorpion: {
    name: 'Scorpion des marais', plural: 'scorpions des marais', kind: 'hunter', look: 'scorpion', color: '#5A4230', noEat: true,
    size: 34, speed: 230, sense: 230, cone: 2.2, adn: 0,
    fact: "Les scorpions ont quitté l'eau avant nous, il y a plus de 400 millions d'années. Ils ne voient que devant eux : passe derrière !",
  },
  hyneria: {
    name: 'Hyneria', plural: 'Hyneria', proper: true, kind: 'hunter', look: 'poisson', color: '#5E6E46', fish: { jaw: 'teeth', bigHead: true }, habitat: 'water', reach: 0.95,
    noEat: true, maxTurn: 2, roar: true, tailBite: true, hits: 3, hitLine: 'MA QUEUE !',
    size: 80, speed: 320, sense: 330, cone: 2.4, adn: 0,
    fact: "Hyneria était un poisson géant de 4 mètres, aux dents énormes. Pour les premiers animaux à pattes, l'eau n'était pas un abri : c'était son garde-manger !",
  },

  /* ---- Chapitre 2 : la forêt de charbon ---- */
  blatte: {
    name: 'Blatte géante', plural: 'blattes géantes', kind: 'prey', look: 'blatte', color: '#6E4422',
    size: 11, speed: 200, sense: 170, adn: 4,
    fact: "Il y a 300 millions d'années, les blattes étaient déjà là, et bien plus grandes qu'aujourd'hui. Elles ont survécu à presque tout !",
  },
  meganeura: {
    name: 'Meganeura', plural: 'Meganeura', proper: true, kind: 'prey', look: 'libellule', color: '#3FA0B8', flying: true,
    size: 24, speed: 300, sense: 260, adn: 12,
    eatLine: "Une libellule grande comme un corbeau ! Il y avait tant d'oxygène dans l'air que les insectes devenaient géants.",
    fact: "Meganeura, une libellule de 70 centimètres d'envergure ! C'est le plus grand insecte volant de tous les temps.",
  },
  'lezard-rival': {
    name: 'Lézard rival', plural: 'lézards rivaux', kind: 'rival', look: 'tq-reptile', color: '#7E9A3A', ownColor: true,
    size: 33, speed: 270, sense: 330, adn: 0,
    fact: "Les premiers reptiles se disputaient les mêmes insectes. Celui qui attrape la blatte le premier a gagné… alors fonce !",
  },
  arthropleura: {
    name: 'Arthropleura', plural: 'Arthropleura', proper: true, kind: 'defender', look: 'millepattes', color: '#5E4C34', stomp: true, hurt: 'Aïe, ses pattes !',
    size: 95, speed: 150, sense: 200, adn: 0,
    fact: "Arthropleura, le plus grand mille-pattes de tous les temps : plus de 2 mètres de long ! Il ne mangeait que des plantes, mais il ne fallait pas le déranger.",
  },
  'scorpion-geant': {
    name: 'Scorpion géant', plural: 'scorpions géants', kind: 'hunter', look: 'scorpion', color: '#3A2418', noEat: true,
    size: 52, speed: 260, sense: 280, cone: 2.2, adn: 0,
    fact: "Pulmonoscorpius, un scorpion de la forêt de charbon, mesurait 70 centimètres. Son dard était gros comme une prune !",
  },
  dimetrodon: {
    name: 'Dimetrodon', plural: 'Dimetrodon', proper: true, kind: 'hunter', look: 'tq-dimetrodon', color: '#94633A', noEat: true, roar: true,
    size: 72, speed: 265, sense: 290, cone: 2.2, adn: 0, hitLine: 'Beurk, ça gigote !',
    fact: "Avec sa grande voile sur le dos, Dimetrodon ressemble à un dinosaure. Pourtant, il a vécu bien avant eux… et il est plus proche de toi que du T. rex !",
  },

  /* ---- Chapitre 3 : les premiers dinosaures ---- */
  cynodonte: {
    name: 'Cynodonte', plural: 'cynodontes', kind: 'prey', look: 'tq-cynodonte', color: '#8A7458', pack: 3,
    size: 24, speed: 290, sense: 280, adn: 5,
    fact: "Les cynodontes sont les ancêtres des mammifères. Ils se cachaient des dinosaures… et un jour, ce sont leurs descendants qui ont dominé la Terre !",
  },
  coelophysis: {
    name: 'Coelophysis', plural: 'Coelophysis', proper: true, kind: 'hunter', look: 'tq-coelophysis', color: '#B58A3C', noEat: true, pack: 2,
    size: 68, speed: 390, sense: 440, cone: 3, adn: 0,
    fact: "Coelophysis, un des premiers dinosaures, était fin et très rapide. On a retrouvé des centaines de squelettes ensemble : ils vivaient sans doute en groupe.",
  },
  postosuchus: {
    name: 'Postosuchus', plural: 'Postosuchus', proper: true, kind: 'hunter', look: 'tq-postosuchus', color: '#6E6A44', noEat: true, roar: true, maxTurn: 2.4, stomp: true,
    size: 115, speed: 385, sense: 480, cone: 2.8, adn: 0, hitLine: 'Ouille !',
    fact: "Postosuchus n'était pas un dinosaure, mais un cousin des crocodiles. Au Trias, c'était lui le grand chasseur, et les premiers dinosaures en avaient peur !",
  },
  'dino-rival': {
    name: 'Dinosaure rival', plural: 'dinosaures rivaux', kind: 'rival', look: 'tq-premier-dino', color: '#8E6A3A', ownColor: true,
    size: 58, speed: 330, sense: 380, adn: 0,
    fact: "Les premiers dinosaures étaient nombreux à chasser les mêmes proies. Et les grands crocodiles du Trias, eux, les croquaient tous sans distinction !",
  },
  plateosaure: {
    name: 'Plateosaurus', plural: 'Plateosaurus', proper: true, kind: 'neutral', look: 'tq-plateosaure', color: '#7FA84F', noEat: true, pack: 2,
    size: 120, speed: 150, sense: 0, adn: 0,
    fact: "Plateosaurus, long comme une camionnette, a été un des premiers grands dinosaures herbivores. Son long cou lui servait à atteindre les hautes branches.",
  },
  phytosaure: {
    name: 'Phytosaure', plural: 'phytosaures', kind: 'hunter', look: 'metriorhynque', color: '#5A6A44', noEat: true, habitat: 'water', reach: 0.85, maxTurn: 2.4,
    size: 95, speed: 330, sense: 300, cone: 2.4, adn: 0,
    fact: "Le phytosaure ressemblait à un crocodile, mais ce n'en était pas un ! Il guettait au bord des mares, les narines juste au-dessus de l'eau.",
  },

  /* ---- Chapitre 4 : le Jurassique ---- */
  compsognathus: {
    name: 'Compsognathus', plural: 'Compsognathus', proper: true, kind: 'prey', look: 'tq-compsognathus', color: '#8EA442', buried: true,
    size: 34, speed: 380, sense: 300, adn: 10,
    fact: "Compsognathus était un dinosaure grand comme une poule. Il se cachait dans les fougères… mais pas assez bien pour échapper au flair d'un Allosaurus !",
  },
  dryosaure: {
    name: 'Dryosaurus', plural: 'Dryosaurus', proper: true, kind: 'prey', look: 'tq-dryosaure', color: '#A0A04A', pack: 3,
    size: 62, speed: 430, sense: 380, adn: 16,
    fact: "Dryosaurus, un petit herbivore, comptait sur ses longues pattes pour échapper aux chasseurs : il courait très vite !",
  },
  rhamphorhynchus: {
    name: 'Rhamphorhynchus', plural: 'Rhamphorhynchus', proper: true, kind: 'prey', look: 'rhamphorhynchus', color: '#A86644', flying: true,
    size: 42, speed: 420, sense: 340, adn: 12,
    fact: "Rhamphorhynchus n'était pas un dinosaure, mais un ptérosaure, un reptile volant. Sa longue queue se terminait par une petite palette en forme de losange.",
  },
  stegosaure: {
    name: 'Stegosaurus', plural: 'Stegosaurus', proper: true, kind: 'defender', look: 'tq-stegosaure', color: '#7D9440', noEat: true, stomp: true, hurt: 'Aïe, les piquants !',
    size: 160, speed: 250, sense: 380, adn: 0,
    fact: "Les pointes de la queue de Stegosaurus étaient redoutables : on a retrouvé un os d'Allosaurus percé par l'une d'elles !",
  },
  brachiosaure: {
    name: 'Brachiosaurus', plural: 'Brachiosaurus', proper: true, kind: 'giant', look: 'tq-brachiosaure', color: '#8A8A6E', stomp: true, maxTurn: 0.6,
    size: 330, speed: 130, sense: 0, adn: 0,
    fact: "Brachiosaurus pesait autant que 10 éléphants, et sa tête montait à la hauteur d'un immeuble de 4 étages. Rien ne pouvait l'attaquer…",
  },
  diplodocus: {
    name: 'Diplodocus', plural: 'Diplodocus', proper: true, kind: 'giant', look: 'tq-diplodocus', color: '#8A7A62', stomp: true, maxTurn: 0.6,
    tailBite: true, hits: 3, hitLine: 'FLAAAC !',
    size: 300, speed: 140, sense: 0, adn: 0,
    fact: "Diplodocus mesurait plus de 25 mètres, dont une queue immense. Elle claquait peut-être comme un fouet… assez fort pour faire un bang !",
  },
  'allosaure-rival': {
    name: 'Allosaurus rival', plural: 'Allosaurus rivaux', proper: true, kind: 'rival', look: 'tq-allosaure', color: '#7A5E8E', ownColor: true,
    size: 106, speed: 450, sense: 460, adn: 0,
    fact: "On a trouvé des os d'Allosaurus avec des morsures… d'Allosaurus ! Entre grands chasseurs, on se disputait les proies, et parfois on se mangeait.",
  },
  ceratosaure: {
    name: 'Ceratosaurus', plural: 'Ceratosaurus', proper: true, kind: 'hunter', look: 'tq-ceratosaure', color: '#8C5A3C', noEat: true, roar: true, maxTurn: 2.6,
    size: 135, speed: 490, sense: 540, cone: 2.8, adn: 0,
    fact: "Ceratosaurus portait une corne sur le nez et une rangée de petites plaques sur le dos. Personne ne sait vraiment à quoi servait sa corne !",
  },

  /* ---- Chapitre 5 : le Crétacé ---- */
  edmontosaure: {
    name: 'Edmontosaurus', plural: 'Edmontosaurus', proper: true, kind: 'prey', look: 'tq-edmontosaure', color: '#7A8E5A', pack: 3,
    size: 135, speed: 470, sense: 480, adn: 30,
    eatLine: "Un Edmontosaurus ! On a retrouvé des traces de dents de T. rex sur leurs os : tu es bien dans l'histoire !",
    fact: "Edmontosaurus avait un bec de canard et des centaines de dents pour broyer les plantes. C'était le repas préféré du T. rex.",
  },
  pteranodon: {
    name: 'Pteranodon', plural: 'Pteranodon', proper: true, kind: 'prey', look: 'pteranodon', color: '#C8B8A0', flying: true,
    size: 80, speed: 520, sense: 400, adn: 14,
    fact: "Pteranodon planait au-dessus de la mer, avec 7 mètres d'envergure… et pas une seule dent dans son long bec !",
  },
  dakotaraptor: {
    name: 'Dakotaraptor', plural: 'Dakotaraptor', proper: true, kind: 'hunter', look: 'tq-dakotaraptor', color: '#5A5288', noEat: true, fierce: true, pack: 2,
    size: 112, speed: 620, sense: 560, cone: 3, adn: 0,
    fact: "Dakotaraptor, un raptor géant de 5 mètres, avait des plumes et une griffe en forme de faux à chaque pied. En meute, même un T. rex devait se méfier !",
  },
  ankylosaure: {
    name: 'Ankylosaurus', plural: 'Ankylosaurus', proper: true, kind: 'defender', look: 'tq-ankylosaure', color: '#7A7050', noEat: true, stomp: true, hurt: 'Aïe, la massue !',
    size: 160, speed: 230, sense: 340, adn: 0,
    fact: "Ankylosaurus était un vrai char d'assaut : blindé de plaques d'os, jusqu'aux paupières ! Un coup de sa queue-massue pouvait briser une patte de T. rex.",
  },
  triceratops: {
    name: 'Triceratops', plural: 'Triceratops', proper: true, kind: 'defender', look: 'tq-triceratops', color: '#A58A52', noEat: true, stomp: true, hurt: 'Aïe, les cornes !',
    size: 190, speed: 320, sense: 420, adn: 0,
    fact: "Le crâne de Triceratops mesurait plus de 2 mètres. On a trouvé ses os marqués par les dents du T. rex… et des T. rex blessés par ses cornes !",
  },
  'jeune-trex': {
    name: 'Jeune T. rex', plural: 'jeunes T. rex', kind: 'rival', look: 'tq-trex', color: '#8A7A44', ownColor: true,
    size: 160, speed: 560, sense: 560, adn: 0,
    fact: "Les jeunes T. rex étaient fins et rapides : ils chassaient de plus petites proies que les adultes. Mais un vieux T. rex n'aurait pas hésité à en croquer un !",
  },
  'trex-rival': {
    name: 'Le T. rex rival', plural: 'T. rex', proper: true, kind: 'hunter', look: 'tq-trex-rival', color: '#6A5234', noEat: true, roar: true, stomp: true, maxTurn: 1.6,
    breachHit: true, hits: 4, hitLine: 'GRRRR… !',
    size: 205, speed: 620, sense: 760, cone: 2.8, adn: 0,
    fact: "La morsure du T. rex est la plus forte de tous les animaux terrestres connus : assez pour broyer les os. Deux T. rex ne se laissaient pas le territoire sans se battre !",
  },
};

/* Les évolutions : deux par animal, et elles se voient sur son corps */
const evolutions = {
  pattes: {
    name: 'Pattes solides', ch: 1, cost: 30, effect: { speed: 1.15 },
    short: 'Tu cours bien plus vite sur la terre',
    fact: "Les premières pattes servaient sans doute d'abord à pousser dans la vase. Puis elles ont porté le corps hors de l'eau.",
  },
  poumons: {
    name: 'Grands poumons', ch: 1, cost: 60, effect: { dry: 0.55, power: 1.3 },
    short: "Tu restes bien plus longtemps hors de l'eau, et tu aspires de plus loin",
    fact: "Grâce à leurs poumons, les premiers tétrapodes respiraient l'air. Pour eux, tout un monde vide s'ouvrait !",
  },
  ecailles: {
    name: 'Écailles', ch: 2, cost: 90, effect: { shield: 1 },
    short: 'Ta peau te protège : tu encaisses un coup',
    fact: "Les écailles gardent l'eau dans le corps : les reptiles ont pu quitter les mares pour de bon.",
  },
  'longues-pattes': {
    name: 'Longues pattes', ch: 2, cost: 130, effect: { speed: 1.15 },
    short: 'Tes pattes sous le corps : tu cours plus vite',
    fact: "Les pattes des reptiles se sont peu à peu placées plus sous le corps : c'est le début d'une course bien plus rapide.",
  },
  griffes: {
    name: 'Griffes de chasseur', ch: 3, cost: 160, effect: { power: 1.4 },
    short: 'Ton coup de queue touche bien plus loin',
    fact: "Herrerasaurus avait de longues griffes aux mains pour saisir ses proies. Et une queue raide, qui l'équilibrait quand il courait.",
  },
  plumes: {
    name: 'Premières plumes', ch: 3, cost: 220, effect: { speed: 1.12, shield: 1 },
    short: 'Tu vas plus vite, et tu encaisses un coup',
    fact: "Beaucoup de dinosaures avaient des plumes, souvent comme un duvet. Elles servaient à garder la chaleur, bien avant de servir à voler !",
  },
  cornes: {
    name: 'Cornes de combat', ch: 4, cost: 200, effect: { power: 1.4 },
    short: 'Ton flair trouve les cachettes de bien plus loin',
    fact: "Allosaurus avait deux petites cornes au-dessus des yeux. Elles servaient sans doute à impressionner ses rivaux.",
  },
  machoire: {
    name: 'Mâchoire-hache', ch: 4, cost: 280, effect: { speed: 1.12, shield: 1 },
    short: 'Tu vas plus vite, et tu encaisses un coup',
    fact: "Allosaurus ouvrait la gueule très grand et frappait de haut en bas avec ses dents, comme avec une hache !",
  },
  morsure: {
    name: 'Morsure broyeuse', ch: 5, cost: 300, effect: { power: 1.3, shield: 2 },
    short: 'Ton rugissement porte plus loin, et tu encaisses deux coups',
    fact: "Le T. rex mordait avec une force de plusieurs tonnes. Il broyait les os et les avalait !",
  },
  'peau-epaisse': {
    name: "Peau d'écailles", ch: 5, cost: 360, effect: { speed: 1.12 },
    short: 'Tu cours plus vite',
    fact: "On a retrouvé des empreintes de peau de T. rex : de petites écailles, et peut-être un peu de plumes sur le dos.",
  },
};

/* L'histoire, en cinq animaux */
const chapters = [
  {
    title: "La sortie de l'eau",
    ago: [375, 360],
    form: 'tq-tetrapode',
    skin: { body: '#4FAE9C', belly: '#F1E3A0', dark: '#1D5A4E', stripe: '#2E7A6C' },
    size: [24, 24],
    dry: 1 / 22,                     // sur la terre, la réserve d'air et d'eau baisse : il faut retourner dans une mare
    vision: 1.3,
    fog: 0.5,
    palette: { water: ['#5E7F4E', '#33452A'], floor: '#7C8A55', motes: 'rgba(255, 250, 200, 0.5)' },
    species: { insecte: 26, 'mille-pattes': 14, 'petit-poisson': 10, scorpion: 4, hyneria: 3 },
    unlock: ['pattes', 'poumons'],
    power: {
      type: 'gulp', name: 'Aspiration', icon: '😋', recharge: 4, range: 300, cry: 'SLUUURP…',
      intro: "Ton pouvoir : l'ASPIRATION ! Appuie sur F ou sur le bouton orange : tu ouvres grand la gueule, et tout ce qui est petit autour de toi est aspiré dedans. Les premiers animaux à pattes mangeaient vraiment comme ça !",
    },
    intro: "Il y a 375 millions d'années, personne n'avait encore marché sur la terre. Tu es un des premiers ! Mais tu respires encore mal hors de l'eau : quand ta jauge 💧 baisse, replonge vite dans une mare. Et dans les mares, Hyneria, un poisson géant, guette. Pour le chasser de ton marais, mords-lui la queue !",
    missions: [
      { type: 'eat', species: 'insecte', n: 20, text: 'Aspire et croque 20 insectes' },
      { type: 'evolve', part: 'pattes' },
      { type: 'eat', species: 'mille-pattes', n: 8 },
      { type: 'hit', species: 'hyneria', n: 3, text: "Mords 3 fois la queue d'Hyneria" },
    ],
    tips: [
      "Ta jauge 💧 baisse sur la terre : replonge dans une mare avant qu'elle soit vide !",
      "Aspire 😋 au milieu des insectes : ils arrivent tous dans ta gueule. Mange vite, c'est un COMBO !",
      "Les petites mares sont plus sûres : Hyneria préfère les grandes.",
      "Le scorpion ne voit que devant lui : passe derrière, sans sprinter.",
      "Hyneria te poursuit dans l'eau ? Sors vite sur la berge, puis reviens lui mordre la queue !",
    ],
  },
  {
    title: 'La forêt de charbon',
    ago: [305, 295],
    form: 'tq-reptile',
    skin: { body: '#D98E3A', belly: '#F7E0A8', dark: '#6B3A12', stripe: '#8A4A16' },
    size: [34, 34],
    vision: 0.9,
    fog: 0.72,
    palette: { water: ['#3D5A3A', '#1E2E1C'], floor: '#4F6B3A', motes: 'rgba(210, 255, 170, 0.45)' },
    species: { blatte: 26, 'mille-pattes': 10, meganeura: 6, 'lezard-rival': 4, arthropleura: 2, 'scorpion-geant': 2, dimetrodon: 2 },
    unlock: ['ecailles', 'longues-pattes'],
    power: {
      type: 'decoy', name: 'Queue-leurre', icon: '🦎', recharge: 5, range: 700, cry: 'CLAC !',
      intro: "Ton pouvoir : la QUEUE-LEURRE ! Appuie sur F : tu laisses ta queue par terre, et elle gigote toute seule ! Les chasseurs se jettent dessus… pendant que toi, tu files. Elle repousse, ne t'inquiète pas !",
    },
    intro: "Des millions d'années ont passé. Te voilà lézard, dans une forêt d'arbres géants, sombre et humide. Attention : d'autres lézards chassent les mêmes blattes que toi, et ils sont rapides ! Et quelque part rôde Dimetrodon, le chasseur à la grande voile.",
    missions: [
      { type: 'eat', species: 'blatte', n: 12, text: 'Croque 12 blattes géantes' },
      { type: 'evolve', part: 'ecailles' },
      { type: 'eat', species: 'meganeura', n: 4, text: 'Attrape 4 libellules géantes' },
      { type: 'stun', species: 'dimetrodon', n: 3, text: 'Fais croquer ta queue-leurre à 3 Dimetrodon' },
    ],
    tips: [
      "Un chasseur te court après ? Laisse ta queue 🦎 : il va se jeter dessus. Toi, file te cacher !",
      "Les lézards rivaux te volent tes blattes ! Sois plus rapide qu'eux… ou mets-leur la pression : le Dimetrodon les croque aussi.",
      "Les libellules volent bas de temps en temps : attrape-les au passage.",
      "Arthropleura ne mange que des plantes… mais si tu le déranges, il te marche dessus !",
    ],
  },
  {
    title: 'Les premiers dinosaures',
    ago: [230, 220],
    form: 'tq-premier-dino',
    rivalHunt: { rival: 'dino-rival', by: ['postosuchus', 'coelophysis'], every: [20, 32] },   // sous tes yeux, un chasseur croque un rival
    skin: { body: '#C8553D', belly: '#F6CFA8', dark: '#5E1F14', stripe: '#7A2A1C' },
    size: [62, 62],
    vision: 1.35,
    fog: 0.4,
    palette: { water: ['#B98F5A', '#7A5534'], floor: '#C2A36B', motes: 'rgba(255, 230, 180, 0.5)' },
    species: { cynodonte: 18, 'petit-poisson': 6, 'dino-rival': 3, plateosaure: 2, coelophysis: 2, phytosaure: 2, postosuchus: 2 },
    unlock: ['griffes', 'plumes'],
    power: {
      type: 'whip', name: 'Coup de queue', icon: '💥', recharge: 3, range: 300, cry: 'VLAN !',
      intro: "Ton pouvoir : le COUP DE QUEUE ! Tu es un des premiers dinosaures, et ta queue est raide comme un bâton. Appuie sur F : tout ce qui est autour de toi est assommé. Les petits, tu les croques ; les gros, tu files !",
    },
    intro: "Le Trias ! Tu marches maintenant sur deux pattes : tu es un des tout premiers dinosaures. Mais ici, ce sont les cousins des crocodiles qui commandent, et le plus terrible s'appelle Postosuchus. Les Coelophysis, eux, chassent à deux.",
    missions: [
      { type: 'eat', species: 'cynodonte', n: 15, text: 'Assomme et croque 15 cynodontes' },
      { type: 'evolve', part: 'griffes' },
      { type: 'eat', species: 'petit-poisson', n: 5, text: 'Pêche 5 poissons dans les mares' },
      { type: 'stun', species: 'postosuchus', n: 3, text: "Assomme 3 Postosuchus d'un coup de queue" },
    ],
    tips: [
      "Les cynodontes courent en petites bandes : fonce au milieu et donne un coup de queue 💥, puis croque-les tous !",
      "Dans les mares, le phytosaure guette, juste sous l'eau. Pêche vite, et ressors !",
      "Postosuchus tourne moins vite que toi : vire au dernier moment, puis frappe !",
      "Tes rivaux te volent tes proies… mais Postosuchus les croque aussi. Ici, tout le monde est le repas de quelqu'un !",
    ],
  },
  {
    title: 'Le Jurassique',
    ago: [150, 145],
    form: 'tq-allosaure',
    rivalHunt: { rival: 'allosaure-rival', by: ['ceratosaure'], every: [20, 32] },
    skin: { body: '#3E7CB8', belly: '#DCEAF5', dark: '#1B3A5C', stripe: '#F2C14E' },
    size: [112, 112],
    vision: 1.3,
    fog: 0.42,
    palette: { water: ['#5C7F4A', '#2F4A2A'], floor: '#6E8B4E', motes: 'rgba(255, 255, 210, 0.5)' },
    species: { compsognathus: 12, dryosaure: 8, rhamphorhynchus: 3, 'allosaure-rival': 2, stegosaure: 2, brachiosaure: 1, diplodocus: 1, ceratosaure: 2 },
    unlock: ['cornes', 'machoire'],
    power: {
      type: 'hammer', name: 'Flair', icon: '👃', recharge: 3, range: 620, cry: 'SNIF SNIF !',
      intro: "Ton pouvoir : le FLAIR ! Appuie sur F : tu renifles, et tout ce qui se cache dans les fougères est débusqué. Et si un ennemi est collé à toi, il prend un grand coup de tête !",
    },
    intro: "Le Jurassique, l'âge des géants ! Regarde en l'air : ces cous qui montent jusqu'au ciel, ce sont des Brachiosaurus et des Diplodocus. Tu es un Allosaurus, le grand chasseur… mais même toi, tu ne peux pas les croquer. Par contre, leur mordre la queue…",
    missions: [
      { type: 'eat', species: 'compsognathus', n: 10, text: 'Débusque et croque 10 Compsognathus cachés' },
      { type: 'evolve', part: 'cornes' },
      { type: 'eat', species: 'dryosaure', n: 5 },
      { type: 'hit', species: 'diplodocus', n: 3, text: "Mords 3 fois la queue d'un Diplodocus" },
    ],
    tips: [
      "Deux petits yeux qui brillent dans les fougères ? Fais SNIF 👃 : le Compsognathus sort, tout étourdi !",
      "Ne passe pas sous le ventre d'un géant : ses pattes écrasent tout !",
      "La queue du Diplodocus est très longue : mords le bout, loin des pattes.",
      "Les Allosaurus rivaux te volent tes proies. Le Ceratosaurus, lui, n'hésite pas à les croquer !",
    ],
  },
  {
    title: 'Le Crétacé',
    ago: [68, 66],
    form: 'tq-trex',
    rivalHunt: { rival: 'jeune-trex', by: ['trex-rival'], every: [22, 34] },
    skin: { body: '#2F6E73', belly: '#F2D7A6', dark: '#123336', stripe: '#E9822B' },
    size: [180, 180],
    vision: 1.25,
    fog: 0.5,
    palette: { water: ['#7C7A4A', '#3F3C24'], floor: '#8A8656', motes: 'rgba(255, 240, 200, 0.5)' },
    species: { edmontosaure: 7, pteranodon: 2, 'jeune-trex': 2, ankylosaure: 1, triceratops: 2, dakotaraptor: 4, 'trex-rival': 1 },
    unlock: ['morsure', 'peau-epaisse'],
    power: {
      type: 'roar', name: 'Rugissement', icon: '📢', recharge: 5, range: 640, cry: 'GROAAAAR !',
      intro: "Ton pouvoir : le RUGISSEMENT ! Appuie sur F : tu rugis si fort que le sol tremble, et tout ce qui est autour de toi est assommé de peur. Même l'autre T. rex, s'il est assez près…",
    },
    intro: "La fin du Crétacé. Les premières fleurs ont poussé, et tu es devenu le plus grand chasseur de tous les temps : le T. rex ! Mais un autre T. rex règne ici. Pour devenir le roi de la Terre, il faudra le faire reculer… à coups de rugissements.",
    missions: [
      { type: 'eat', species: 'edmontosaure', n: 5 },
      { type: 'evolve', part: 'morsure' },
      { type: 'stun', species: 'dakotaraptor', n: 4, text: "Fais fuir 4 Dakotaraptor d'un rugissement" },
      { type: 'hit', species: 'trex-rival', n: 4, text: "Rugis 4 fois au nez de l'autre T. rex" },
    ],
    tips: [
      "Les Dakotaraptor chassent à deux, et ils n'ont peur de rien. Un bon rugissement 📢 les calme !",
      "L'autre T. rex tourne moins vite que toi. Attends qu'il soit tout près… et GROAAAR !",
      "Le Triceratops et l'Ankylosaurus chargent si tu les déranges. Laisse-les tranquilles !",
      "Les jeunes T. rex te volent tes Edmontosaurus. Et l'autre grand T. rex, lui, les croque sans hésiter !",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Moi, je reste au bord de l'eau, mais je te suis partout. Sur la terre, c'est un vrai défi : seuls les plus malins survivent ! Essaie ton pouvoir 😋 : le bouton orange.",
};

/* La fin : on domine la Terre… puis la météorite. Trois chemins pour la suite. */
const ending = {
  scene: 'meteorite',
  crowd: ['edmontosaure', 'triceratops', 'ankylosaure', 'edmontosaure'],
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
