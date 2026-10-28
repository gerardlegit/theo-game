// ============================================================================
// NIVEAU 1 — L'OCÉAN PRIMITIF
//
// De la toute petite cellule de la soupe primitive (il y a 1,5 milliard
// d'années) jusqu'au roi des océans du Dévonien (il y a 365 millions
// d'années). Cinq chapitres, qui suivent la vraie histoire de la vie :
// cellules, premiers animaux, Cambrien, premiers poissons, âge des poissons.
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : un grand fond marin, avec des forêts d'algues pour se cacher */
const world = {
  w: 9000,
  h: 6000,
  start: { x: 4500, y: 3000 },
  decor: [
    { type: 'algues', count: 60, r: [90, 380] },
    { type: 'rocher', count: 110, r: [16, 80] },
    { type: 'cheminee', count: 10, r: [36, 62] },
    { type: 'stromatolithe', count: 120, r: [14, 42], to: 2 },
    { type: 'eponge', count: 60, r: [14, 38], from: 3 },
    { type: 'corail', count: 45, r: [22, 64], from: 4 },
    { type: 'crinoide', count: 40, r: [24, 58], from: 4 },
  ],
};

/* Les êtres vivants. size = rayon, speed = unités/s, sense = distance où ils
   remarquent le joueur, adn = ce qu'ils rapportent quand on les mange.
   proper = nom propre (garde sa majuscule dans les missions). */
const species = {
  molecule: {
    name: 'Molécule', plural: 'molécules', kind: 'food', look: 'molecule',
    size: 4, speed: 14, adn: 1,
    fact: "La soupe primitive était pleine de molécules : les briques de la vie, comme des Lego minuscules !",
  },
  bacterie: {
    name: 'Bactérie', plural: 'bactéries', kind: 'prey', look: 'bacterie', color: '#FFB3C7',
    size: 6, speed: 62, sense: 95, adn: 2,
    fact: "Les bactéries sont les plus anciens êtres vivants. Il y en a encore des milliers de milliards dans ton ventre !",
  },
  amibe: {
    name: 'Amibe', plural: 'amibes', kind: 'hunter', look: 'amibe', color: '#B58CF0',
    size: 16, speed: 118, sense: 185, adn: 6,
    fact: "Une amibe attrape sa nourriture en l'entourant avec son corps tout mou… puis gloups !",
  },
  geante: {
    name: 'Cellule géante', plural: 'cellules géantes', kind: 'hunter', look: 'amibe', color: '#F07A8E',
    size: 34, speed: 128, sense: 270, adn: 15,
    fact: "Certaines cellules sont des géantes : au fond des océans, les xénophyophores sont aussi grandes qu'une main !",
  },
  plancton: {
    name: 'Petite algue', plural: 'petites algues', kind: 'food', look: 'plancton', color: '#BFF2D8',
    size: 7, speed: 16, adn: 2,
    fact: "Les algues minuscules du plancton fabriquent une grande partie de l'oxygène que tu respires !",
  },
  'petit-ver': {
    name: 'Petit ver', plural: 'petits vers', kind: 'prey', look: 'ver', color: '#F7B267',
    size: 12, speed: 96, sense: 150, adn: 4,
    fact: "Les premiers animaux qui bougeaient ressemblaient à de petits vers : ils laissaient des traces dans la vase.",
  },
  meduse: {
    name: 'Méduse', plural: 'méduses', kind: 'stinger', look: 'meduse', color: '#F6A6FF',
    size: 30, speed: 28, adn: 10,
    fact: "Les méduses existent depuis plus de 500 millions d'années… et elles n'ont même pas de cerveau !",
  },
  'ver-chasseur': {
    name: 'Ver chasseur', plural: 'vers chasseurs', kind: 'hunter', look: 'priapule', color: '#C9563F',
    size: 48, speed: 178, sense: 300, adn: 20,
    fact: "Les priapulides sont des vers chasseurs avec une bouche pleine de dents. Il en existe encore aujourd'hui !",
  },
  trilobite: {
    name: 'Trilobite', plural: 'trilobites', kind: 'prey', look: 'trilobite', color: '#B08D63', armored: true,
    size: 26, speed: 72, sense: 170, adn: 14,
    fact: "Les trilobites avaient des yeux en cristal ! Ils ont vécu pendant 270 millions d'années.",
  },
  opabinia: {
    name: 'Opabinia', plural: 'opabinias', proper: true, kind: 'prey', look: 'opabinia', color: '#F29FC6',
    size: 32, speed: 140, sense: 230, adn: 12,
    fact: "Opabinia avait 5 yeux et une trompe avec une pince au bout. Quand les savants l'ont découvert, toute la salle a éclaté de rire !",
  },
  anomalocaris: {
    name: 'Anomalocaris', plural: 'anomalocaris', proper: true, kind: 'hunter', look: 'anomalocaris', color: '#E9783E',
    size: 95, speed: 232, sense: 520, adn: 40,
    fact: "Anomalocaris était le plus grand chasseur du Cambrien, avec deux bras pleins d'épines pour attraper ses proies !",
  },
  'petit-poisson': {
    name: 'Poisson sans mâchoire', plural: 'poissons sans mâchoire', kind: 'prey', look: 'poisson', color: '#7FB8E8',
    fish: { jaw: 'none' },
    size: 34, speed: 205, sense: 270, adn: 16,
    fact: "Les premiers poissons n'avaient pas de mâchoire : ils aspiraient leur nourriture. La lamproie fait encore pareil !",
  },
  eurypteride: {
    name: 'Scorpion de mer', plural: 'scorpions de mer', kind: 'hunter', look: 'eurypteride', color: '#A8664A',
    size: 130, speed: 300, sense: 560, adn: 50,
    fact: "Les scorpions de mer, ou euryptérides, nageaient avec deux pattes en forme de rame. Certains étaient plus grands qu'un homme !",
  },
  nautiloide: {
    name: 'Nautiloïde', plural: 'nautiloïdes', kind: 'hunter', look: 'nautiloide', color: '#E8D3A8',
    size: 160, speed: 262, sense: 560, adn: 60,
    fact: "Les nautiloïdes avaient une coquille droite et pointue, parfois aussi longue qu'une voiture ! Le nautile d'aujourd'hui est leur cousin.",
  },
  'poisson-osseux': {
    name: 'Poisson osseux', plural: 'poissons osseux', kind: 'prey', look: 'poisson', color: '#F2C14E',
    fish: { jaw: 'small', fins: true },
    size: 46, speed: 300, sense: 300, adn: 20,
    fact: "Les poissons osseux sont apparus il y a plus de 400 millions d'années. Aujourd'hui, ce sont presque tous les poissons que tu connais !",
  },
  ostracoderme: {
    name: 'Poisson cuirassé', plural: 'poissons cuirassés', kind: 'prey', look: 'poisson', color: '#9DB3C4', armored: true,
    fish: { jaw: 'none', helmet: true },
    size: 62, speed: 240, sense: 290, adn: 28,
    fact: "Les ostracodermes étaient des poissons sans mâchoire protégés par une armure d'os, comme un casque.",
  },
  cladoselache: {
    name: 'Cladoselache', plural: 'cladoselaches', proper: true, kind: 'hunter', look: 'poisson', color: '#7D8FA3',
    fish: { jaw: 'teeth', shark: true, fins: true },
    size: 150, speed: 430, sense: 650, adn: 55,
    fact: "Cladoselache est l'un des tout premiers requins. Il nageait déjà il y a 370 millions d'années, bien avant les dinosaures !",
  },
  jaekelopterus: {
    name: 'Scorpion de mer géant', plural: 'scorpions de mer géants', kind: 'hunter', look: 'eurypteride', color: '#8E4A3A',
    size: 175, speed: 400, sense: 620, adn: 70,
    fact: "Jaekelopterus, le scorpion de mer géant, mesurait 2,5 mètres : le plus grand arthropode de tous les temps !",
  },
  dunkleosteus: {
    name: 'Dunkleosteus', plural: 'Dunkleosteus', proper: true, kind: 'hunter', look: 'poisson', color: '#5A6B7C', boss: true,
    fish: { jaw: 'blades', armor: true, fins: true },
    size: 300, speed: 440, sense: 750, adn: 200,
    fact: "Dunkleosteus était un poisson géant de plusieurs mètres. Au lieu de dents, il avait des lames d'os tranchantes comme des ciseaux !",
  },
};

/* Les évolutions : ce qu'on achète avec l'ADN. "ch" = chapitre où elle apparaît.
   effect : speed (vitesse ×), ratio (taille des proies qu'on peut avaler, par
   rapport à la sienne), vision (×), shield (coups encaissés), armored (croquer
   les carapaces), dash (meilleur sprint). */
const evolutions = {
  queue: {
    name: 'Queue', ch: 1, cost: 15, effect: { speed: 1.3 },
    short: 'Tu nages beaucoup plus vite',
    fact: "Ta queue s'appelle un flagelle : elle fouette l'eau pour te faire avancer. Les spermatozoïdes nagent pareil !",
  },
  bouche: {
    name: 'Grande bouche', ch: 2, cost: 45, effect: { ratio: 0.95, reach: 1.3 },
    short: 'Tu avales des proies plus grosses',
    fact: "Les premiers animaux avec une vraie bouche et un tube pour digérer sont apparus il y a environ 550 millions d'années.",
  },
  yeux: {
    name: 'Yeux', ch: 3, cost: 80, effect: { vision: 2.6 },
    short: 'Tu vois loin, même les chasseurs',
    fact: "Les premiers vrais yeux sont apparus au Cambrien, il y a environ 520 millions d'années. Voir ses ennemis arriver, c'est très pratique !",
  },
  carapace: {
    name: 'Carapace', ch: 3, cost: 110, effect: { shield: 1 },
    short: 'Elle te protège d’une morsure',
    fact: "Au Cambrien, beaucoup d'animaux se sont fabriqué une carapace : une armure pour ne pas se faire croquer !",
  },
  nageoires: {
    name: 'Nageoires', ch: 4, cost: 180, effect: { speed: 1.15, dash: true },
    short: 'Plus rapide, et un sprint plus puissant',
    fact: "Les nageoires servent à tourner, freiner et foncer. Elles sont apparues chez les premiers poissons.",
  },
  machoires: {
    name: 'Mâchoires', ch: 4, cost: 240, effect: { ratio: 1.05, armored: true },
    short: 'Tu croques même les carapaces',
    fact: "Les mâchoires sont apparues il y a environ 440 millions d'années. Grâce à elles, les poissons ont pu croquer des proies bien dures !",
  },
  cuirasse: {
    name: 'Cuirasse', ch: 5, cost: 300, effect: { shield: 2 },
    short: 'Une armure d’os : 2 morsures encaissées',
    fact: "Les placodermes avaient la tête et le dos couverts de plaques d'os, comme une armure de chevalier.",
  },
  'machoire-geante': {
    name: 'Mâchoire géante', ch: 5, cost: 450, effect: { ratio: 1.55 },
    short: 'Tu peux croquer plus gros que toi !',
    fact: "La mâchoire de Dunkleosteus se refermait en un clin d'œil, avec une force énorme : de quoi couper une proie en deux !",
  },
};

/* L'histoire : 5 chapitres. ago = [début, fin] en millions d'années ;
   size = [taille au début, taille maximale] ; growth = ADN à manger pour
   atteindre la taille maximale ; species = combien de chaque espèce autour du joueur. */
const chapters = [
  {
    title: 'La cellule',
    ago: [1500, 700],
    form: 'cellule',
    size: [10, 22],
    growth: 60,
    palette: { water: ['#2C8C79', '#145B5B'], floor: '#4C8E6C', light: '#DFFFD6' },
    species: { molecule: 22, bacterie: 12, amibe: 3, geante: 2 },
    unlock: ['queue'],
    intro: "Te voilà dans la soupe primitive ! Tu n'es qu'une toute petite cellule. Mange des bactéries pour grandir… mais attention : les cellules plus grosses que toi te gobent d'un coup !",
    missions: [
      { type: 'eat', species: 'bacterie', n: 6 },
      { type: 'evolve', part: 'queue' },
      { type: 'grow' },
      { type: 'eat', species: 'amibe', n: 1, revenge: true },
    ],
    tips: [
      "Une amibe ! Elle est plus grosse que toi : file !",
      "Cache-toi dans les algues : les chasseurs ne te voient plus.",
      "Avec 15 🧬, tu peux te faire pousser une queue : appuie sur Évoluer !",
    ],
  },
  {
    title: 'Les premiers animaux',
    ago: [550, 525],
    form: 'ver',
    size: [22, 40],
    growth: 220,
    palette: { water: ['#2A8A95', '#124E64'], floor: '#5B8F78', light: '#DFF8FF' },
    species: { plancton: 16, 'petit-ver': 10, amibe: 5, meduse: 4, 'ver-chasseur': 3 },
    unlock: ['bouche'],
    intro: "Des millions d'années ont passé. Tes descendants sont maintenant faits de milliers de cellules collées ensemble : tu es un petit ver ! Attention aux vers chasseurs… et aux méduses qui piquent.",
    missions: [
      { type: 'eat', species: 'petit-ver', n: 6 },
      { type: 'evolve', part: 'bouche' },
      { type: 'grow' },
      { type: 'eat', species: 'meduse', n: 2, revenge: true },
    ],
    tips: [
      "Les méduses piquent ! Ne les touche pas tant que tu es petit.",
      "Les amibes ? Maintenant, c'est toi le plus gros. Miam !",
    ],
  },
  {
    title: 'Le Cambrien',
    ago: [520, 490],
    form: 'ver',
    size: [40, 70],
    growth: 450,
    palette: { water: ['#21A0A8', '#0F5470'], floor: '#6E8E6E', light: '#E8FFFF' },
    species: { plancton: 10, 'petit-ver': 8, trilobite: 7, opabinia: 5, meduse: 4, 'ver-chasseur': 3, anomalocaris: 3 },
    unlock: ['yeux', 'carapace'],
    intro: "L'océan explose de vie ! C'est le Cambrien, plein d'animaux bizarres. Le plus terrible, c'est Anomalocaris, le roi des chasseurs. Il va te falloir des yeux pour le voir arriver !",
    missions: [
      { type: 'evolve', part: 'yeux' },
      { type: 'eat', species: 'opabinia', n: 3 },
      { type: 'evolve', part: 'carapace' },
      { type: 'grow' },
      { type: 'eat', species: 'ver-chasseur', n: 1, revenge: true },
    ],
    tips: [
      "Les trilobites ont une carapace trop dure pour toi… pour l'instant !",
      "Anomalocaris ! Il est plus rapide que toi : cache-toi ou fonce !",
    ],
  },
  {
    title: 'Les premiers poissons',
    ago: [445, 420],
    form: 'poisson',
    size: [70, 120],
    growth: 900,
    palette: { water: ['#1C8BB0', '#0B3F66'], floor: '#6F8A86', light: '#E6F6FF' },
    species: { 'petit-poisson': 10, trilobite: 8, meduse: 5, anomalocaris: 3, eurypteride: 3, nautiloide: 2 },
    unlock: ['nageoires', 'machoires'],
    intro: "Tes descendants ont un corps de poisson ! Mais l'océan est rempli de scorpions de mer et de nautiloïdes géants. Il te faut des nageoires… et surtout des mâchoires !",
    missions: [
      { type: 'evolve', part: 'nageoires' },
      { type: 'evolve', part: 'machoires' },
      { type: 'eat', species: 'trilobite', n: 4 },
      { type: 'grow' },
      { type: 'eat', species: 'anomalocaris', n: 1, revenge: true },
    ],
    tips: [
      "Avec des mâchoires, les trilobites deviennent croquables !",
      "Le scorpion de mer nage très vite. Fonce avec Espace !",
    ],
  },
  {
    title: "L'âge des poissons",
    ago: [390, 365],
    form: 'poisson',
    size: [120, 200],
    growth: 1500,
    palette: { water: ['#1A6FA8', '#082F57'], floor: '#5E7A8A', light: '#E0F0FF' },
    species: { 'poisson-osseux': 10, ostracoderme: 7, 'petit-poisson': 6, cladoselache: 3, jaekelopterus: 2, dunkleosteus: 1 },
    unlock: ['cuirasse', 'machoire-geante'],
    intro: "Bienvenue au Dévonien, l'âge des poissons ! Les plus gros chasseurs de tous les temps nagent ici, dont le terrible Dunkleosteus. Deviens le plus fort, et l'océan sera à toi !",
    missions: [
      { type: 'evolve', part: 'cuirasse' },
      { type: 'eat', species: 'jaekelopterus', n: 1 },
      { type: 'evolve', part: 'machoire-geante' },
      { type: 'grow' },
      { type: 'eat', species: 'dunkleosteus', n: 1, revenge: true },
    ],
    tips: [
      "Dunkleosteus ! Ne reste pas devant sa gueule…",
      "Avec la mâchoire géante et ta taille maximale, tu pourras croquer Dunkleosteus !",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Je suis Ammo, une ammonite. Je vais te guider à travers des millions d'années d'évolution !",
};

/* La fin du niveau : on règne sur l'océan, puis on choisit son chemin */
const ending = {
  title: "Tu règnes sur l'océan !",
  sub: "En plus d'un milliard d'années, ta minuscule cellule est devenue le chasseur le plus redoutable de la mer. Et maintenant, que vont devenir tes descendants ?",
  choices: [
    {
      id: 'mer', icon: '🌊', title: 'Rester dans la mer',
      text: 'Deviens le plus grand chasseur des océans, parmi les requins et les poissons géants.',
      level: 'maitres-des-oceans',
      soon: 'Niveau 2 : Les maîtres des océans',
    },
    {
      id: 'terre', icon: '🦖', title: 'Conquérir la terre',
      text: "Sors de l'eau sur tes nageoires… tes descendants deviendront des dinosaures !",
      level: 'vers-les-dinosaures',
      soon: 'Niveau 2 : Vers les dinosaures',
      fact: "C'est vraiment arrivé : il y a 375 millions d'années, Tiktaalik, un poisson aux nageoires musclées, rampait déjà au bord de l'eau.",
    },
  ],
};

export default {
  id: 'ocean-primitif',
  name: "L'océan primitif",
  goal: "Tu es une minuscule cellule dans la soupe primitive. <b>Mange pour grandir</b>, fais évoluer ton corps, et deviens le roi de l'océan :<br>🦠 la cellule → 🐛 le ver → 🐟 le poisson → 👑 le maître des mers !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
