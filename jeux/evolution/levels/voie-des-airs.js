// ============================================================================
// NIVEAU 3 — LA VOIE DES AIRS
//
// De la météorite (il y a 66 millions d'années) à l'arrivée des humains. Le
// monde est VU DE CÔTÉ (world.view = 'cote', voir cote.js) : on vole dans le
// ciel, on se pose sur les falaises et en haut des arbres, on y fait son nid,
// on nourrit ses petits… et on se méfie des serpents, des crocodiles et des
// requins. Les oiseaux sont les derniers dinosaures !
//   1. Asteriornis, le petit survivant (après la météorite)
//   2. Pelagornis, le géant des mers aux « dents » en os
//   3. Phorusrhacos, l'oiseau-terreur qui ne vole plus
//   4. Argentavis, le roi du ciel des Andes (il plane dans l'air chaud)
//   5. Le corbeau, le plus malin, qui suit les premiers humains
// Manger ne fait pas grandir (world.noGrow) : on gagne par ses actions.
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* Le monde : vu de côté ; chaque chapitre a son propre paysage (chapters[].land) */
const world = {
  view: 'cote',
  ground: 'cote',
  w: 16000,
  h: 3600,
  start: { x: 1600, y: 2700 },
  noGrow: true,
  speed: 1.55,                      // la vitesse de base du joueur (×)
  maxChasers: 3,
  noise: 480,                       // foncer, ça s'entend
  penalty: { adn: 0.3, growth: 0 },
  decor: [],
};

/* Les êtres vivants (lives : 'air' vole, 'eau' nage, 'sol' marche ; swims / climbs / dives,
   alt = son étage dans le ciel, depth = sa profondeur sous l'eau, near 'eau' = il vit au bord
   de l'eau, raider = il vient voler la becquée dans ton nid ; voir levels/index.js) */
const species = {
  /* ---- Chapitre 1 : le monde en cendres ---- */
  graine: {
    name: 'Graines', plural: 'graines', kind: 'food', look: 'vc-graine', color: '#C9A060', proper: true,
    size: 10, speed: 0, sense: 0, adn: 4,
    fact: "Après la météorite, il fait froid et sombre : les plantes meurent. Mais leurs graines, elles, attendent sous la cendre. Les oiseaux au bec solide les ont mangées… et ont survécu !",
  },
  scarabee: {
    name: 'Scarabée', plural: 'scarabées', kind: 'prey', look: 'vc-scarabee', color: '#3E6A3A',
    size: 10, speed: 60, sense: 120, adn: 5,
    fact: "Les scarabées sont parmi les animaux les plus nombreux de la Terre. Ils ont traversé la catastrophe de la météorite sans trop de mal.",
  },
  libellule: {
    name: 'Libellule', plural: 'libellules', kind: 'prey', lives: 'air', alt: [60, 420], look: 'vc-libellule', color: '#4AA8C8', flapRate: 30, agile: 4,
    size: 12, speed: 140, sense: 170, adn: 6,
    fact: "Les libellules existaient bien avant les dinosaures ! Elles volent en avant, en arrière, et même sur place, comme un hélicoptère.",
  },
  purgatorius: {
    name: 'Purgatorius', plural: 'purgatorius', kind: 'neutral', look: 'vc-purgatorius', color: '#8A6A4A', noEat: true, climbs: true,
    size: 18, speed: 140, sense: 200, adn: 0,
    fact: "Ce petit mammifère grimpeur est peut-être le cousin des tout premiers singes. Toi et lui, vous êtes deux survivants de la météorite !",
  },
  borealosuchus: {
    name: 'Borealosuchus', plural: 'borealosuchus', kind: 'hunter', look: 'vc-borealosuchus', color: '#5A6A44', swims: true, near: 'eau',
    size: 72, speed: 230, sense: 300, cone: 2.2, adn: 30, hurt: 'CROC !',
    fact: "Les crocodiles ont survécu à la météorite : ils peuvent rester des mois sans manger, cachés au fond de l'eau.",
  },
  serpent: {
    name: 'Serpent', plural: 'serpents', kind: 'hunter', look: 'vc-serpent', color: '#6A5A3A', climbs: true, raider: true,
    size: 40, speed: 170, sense: 260, cone: 2.6, adn: 20,
    fact: "Les serpents adorent les œufs d'oiseaux… et ils savent grimper aux arbres ! Mais sur une paroi de roche bien lisse, ils glissent.",
  },

  /* ---- Chapitre 2 : l'océan ---- */
  poisson: {
    name: 'Poisson', plural: 'poissons', kind: 'prey', lives: 'eau', depth: [0, 240], look: 'vc-poisson', color: '#7AA8C8', pack: 3,
    size: 15, speed: 150, sense: 150, adn: 6,
    fact: "Les bancs de poissons nagent juste sous la surface : de là-haut, les oiseaux de mer les voient briller au soleil.",
  },
  'poisson-volant': {
    name: 'Poisson volant', plural: 'poissons volants', kind: 'prey', lives: 'eau', depth: [0, 120], look: 'vc-poisson-volant', color: '#5A8AC8', leap: 5,
    size: 15, speed: 180, sense: 180, adn: 8,
    fact: "Le poisson volant jaillit hors de l'eau et plane sur ses grandes nageoires, pour échapper à ceux qui le chassent… sous l'eau. Raté : toi, tu es dans les airs !",
  },
  calmar: {
    name: 'Calmar', plural: 'calmars', kind: 'prey', lives: 'eau', depth: [60, 420], look: 'vc-calmar', color: '#E2A0B0',
    size: 16, speed: 130, sense: 140, adn: 9,
    fact: "Le calmar change de couleur en un clin d'œil, et il crache de l'encre pour disparaître dans un nuage noir.",
  },
  requin: {
    name: 'Requin', plural: 'requins', kind: 'hunter', lives: 'eau', depth: [40, 700], look: 'vc-requin', color: '#6A7A8A',
    size: 110, speed: 260, sense: 380, cone: 2.0, adn: 0, noEat: true, hurt: 'CHOMP !',
    fact: "Il y a 25 millions d'années, de grands requins chassaient déjà dans les océans. Un oiseau posé sur l'eau ? Un repas facile… s'il ne s'envole pas à temps !",
  },
  labbe: {
    name: 'Labbe', plural: 'labbes', kind: 'neutral', lives: 'air', alt: [150, 900], look: 'vc-labbe', color: '#6A5A4E', raider: true, noEat: true, flapRate: 8,
    size: 30, speed: 280, sense: 300, adn: 0,
    fact: "Le labbe est un oiseau pirate : il pourchasse les autres oiseaux pour leur voler leur poisson… ou il vient le chiper directement dans le nid !",
  },

  /* ---- Chapitre 3 : la pampa ---- */
  agouti: {
    name: 'Agouti', plural: 'agoutis', kind: 'prey', look: 'vc-agouti', color: '#A8783E',
    size: 22, speed: 250, sense: 320, adn: 12,
    fact: "L'agouti est un rongeur d'Amérique du Sud, cousin du cochon d'Inde. Il court très vite… mais l'oiseau-terreur court encore plus vite !",
  },
  thylacosmilus: {
    name: 'Thylacosmilus', plural: 'thylacosmilus', kind: 'hunter', look: 'vc-thylacosmilus', color: '#C9A06A',
    size: 72, speed: 255, sense: 320, cone: 2.2, adn: 40, hurt: 'GRRR !',
    fact: "Ce « tigre à dents de sabre » d'Amérique du Sud était en fait un marsupial, comme le kangourou ! Ses dents ne s'arrêtaient jamais de pousser.",
  },
  macrauchenia: {
    name: 'Macrauchenia', plural: 'macrauchenias', kind: 'neutral', look: 'vc-macrauchenia', color: '#B08A62', noEat: true,
    size: 90, speed: 150, sense: 0, adn: 0,
    fact: "Macrauchenia ressemblait à un chameau avec une petite trompe. Charles Darwin a trouvé ses os, et il n'en revenait pas !",
  },

  /* ---- Chapitre 4 : les Andes ---- */
  carcasse: {
    name: 'Carcasse', plural: 'carcasses', kind: 'food', look: 'vc-carcasse', color: '#B5523E',
    size: 30, speed: 0, sense: 0, adn: 22,
    fact: "Argentavis se nourrissait sans doute d'animaux morts, comme les vautours. C'est utile : les charognards nettoient la nature !",
  },
  vautour: {
    name: 'Vautour', plural: 'vautours', kind: 'rival', ownColor: true, lives: 'air', alt: [300, 1400], look: 'vc-vautour', color: '#3A3230', raider: true, glide: true, flapRate: 5,
    size: 44, speed: 230, sense: 600, adn: 0, noEat: true,
    fact: "Les vautours repèrent une carcasse de très haut, puis ils descendent en cercles. Premier arrivé, premier servi !",
  },

  /* ---- Chapitre 5 : avec les premiers humains ---- */
  humain: {
    name: 'Humain', plural: 'humains', kind: 'human', look: 'vc-humain', color: '#8A6A48', habitat: 'camp', hurt: 'Ouste !',
    size: 56, speed: 80, sense: 300, adn: 0,
    fact: "Il y a 40 000 ans, des humains comme nous vivaient en petits groupes. Ils chassaient le renne… et les corbeaux les suivaient partout pour manger les restes.",
  },
  chasseur: {
    name: 'Chasseur', plural: 'chasseurs', kind: 'human', look: 'vc-chasseur', color: '#6E5238', habitat: 'camp', hurt: 'Ouste !',
    size: 58, speed: 90, sense: 320, adn: 0,
    fact: "Les chasseurs de l'âge de glace lançaient leurs sagaies avec un propulseur, un bâton qui permet de lancer bien plus loin.",
  },
  viande: {
    name: 'Restes de repas', plural: 'restes de repas', kind: 'food', look: 'vc-viande', color: '#C4583E', proper: true,
    size: 12, speed: 0, sense: 0, adn: 8, trust: 0.04,
    fact: "Les corbeaux se régalent des restes des humains. Encore aujourd'hui, ils vivent près de nous, dans les villes et les champs.",
  },
  renne: {
    name: 'Renne', plural: 'rennes', kind: 'prey', look: 'vc-renne', color: '#9A8A74', noEat: true, barkLine: 'Les chasseurs l’ont vu !',
    size: 80, speed: 240, sense: 360, adn: 0,
    fact: "Les corbeaux suivent les troupeaux de rennes, et ils croassent fort quand ils en voient : les loups et les chasseurs savent alors où aller… et partagent un peu leur repas !",
  },
  noix: {
    name: 'Noisette', plural: 'noisettes', kind: 'food', look: 'vc-noix', color: '#A8743E',
    size: 9, speed: 0, sense: 0, adn: 5,
    fact: "Les corbeaux cachent leurs provisions… et ils se souviennent de centaines de cachettes ! Ce sont parmi les oiseaux les plus intelligents.",
  },
  loup: {
    name: 'Loup', plural: 'loups', kind: 'hunter', look: 'loup', color: '#8A8682', belly: '#E8E4DA',
    size: 62, speed: 300, sense: 320, cone: 2.4, adn: 0, noEat: true,
    fact: "Les loups et les corbeaux sont de vieux amis : le corbeau montre les proies, le loup les attrape… et le corbeau mange les restes.",
  },
  aigle: {
    name: 'Aigle royal', plural: 'aigles royaux', kind: 'hunter', lives: 'air', alt: [400, 1300], look: 'vc-aigle', color: '#6A4A30', flapRate: 6, agile: 3,
    size: 56, speed: 330, sense: 420, cone: 1.8, adn: 0, noEat: true, hurt: 'KRIII !',
    fact: "L'aigle royal voit huit fois plus loin que nous : il repère un lapin à plus d'un kilomètre ! Il fond sur sa proie à plus de 200 km/h.",
  },
};

/* Les évolutions : deux par oiseau, et elles se voient sur son corps */
const evolutions = {
  'bec-solide': {
    name: 'Bec solide', ch: 1, cost: 15, effect: { ratio: 0.95, speed: 1.05 },
    short: 'Tu croques des graines et des insectes plus gros',
    fact: "Un bec sans dents, solide comme un casse-noix : c'est peut-être lui qui a sauvé les oiseaux de la météorite. Ils pouvaient manger des graines quand tout le reste avait disparu.",
  },
  'ailes-longues': {
    name: 'Ailes longues', ch: 1, cost: 30, effect: { wings: 1.7, speed: 1.08 },
    short: 'Tu voles bien plus longtemps sans te fatiguer',
    fact: "Les oiseaux ont des os creux, pleins d'air : ils sont légers comme une plume ! Et leurs muscles des ailes sont énormes.",
  },
  'ailes-geantes': {
    name: 'Ailes géantes', ch: 2, cost: 40, effect: { wings: 1.8 },
    short: 'Tu planes au-dessus de la mer sans battre des ailes',
    fact: "Pelagornis avait des ailes de plus de 6 mètres d'un bout à l'autre : le plus grand oiseau volant de tous les temps ! Il planait des heures sans battre des ailes.",
  },
  'dents-os': {
    name: 'Bec à dents', ch: 2, cost: 70, effect: { reach: 1.35 },
    short: 'Ton bec à « dents » attrape les poissons de plus loin',
    fact: "Les « dents » de Pelagornis n'étaient pas de vraies dents, mais des pointes d'os sur le bord du bec. Parfait pour attraper les poissons glissants !",
  },
  'bec-hache': {
    name: 'Bec-hache', ch: 3, cost: 60, effect: { power: 1.4 },
    short: 'Ton coup de bec assomme de plus loin',
    fact: "Phorusrhacos frappait avec son énorme bec crochu, de haut en bas, comme avec une hache !",
  },
  'longues-pattes': {
    name: 'Longues pattes', ch: 3, cost: 90, effect: { speed: 1.18 },
    short: 'Tu cours bien plus vite',
    fact: "Les oiseaux-terreurs couraient sans doute à plus de 50 km/h. Ils n'avaient plus besoin de voler : ils étaient les rois de la pampa !",
  },
  'ailes-planeur': {
    name: 'Ailes de planeur', ch: 4, cost: 80, effect: { wings: 1.8 },
    short: 'Battre des ailes te fatigue bien moins',
    fact: "Argentavis pesait autant qu'un enfant de 10 ans ! Trop lourd pour battre des ailes longtemps : il montait dans les colonnes d'air chaud, comme un planeur.",
  },
  'tete-nue': {
    name: 'Œil de charognard', ch: 4, cost: 110, effect: { vision: 1.4, radar: true },
    short: 'Tu repères les carcasses de très loin',
    fact: "Les vautours ont la tête sans plumes : elle reste propre quand ils plongent la tête dans une carcasse. Malin !",
  },
  croassement: {
    name: 'Croassement', ch: 5, cost: 60, effect: { bark: true },
    short: 'Croasse (touche B) : tu montres les proies aux chasseurs',
    fact: "Les corbeaux ont plus de 30 cris différents ! Ils se parlent, ils préviennent, ils appellent… et même, ils imitent d'autres bruits.",
  },
  'bec-malin': {
    name: 'Cerveau malin', ch: 5, cost: 90, effect: { trust: 1.6 },
    short: 'Les humains t’apprécient bien plus vite',
    fact: "Les corbeaux reconnaissent les visages des humains ! Ils se souviennent de ceux qui sont gentils avec eux… et de ceux qui ne le sont pas.",
  },
};

/* Les paysages (vue de côté) : ciel, lointain, sol, arbres, falaises, eau */
const CENDRES = {
  sky: ['#6E6A66', '#A8A094', '#D8C29A'], sun: { x: 0.72, y: 0.22, col: '#F2C08A', r: 34, glow: 'rgba(240, 170, 110, 0.4)' },
  layers: [
    { kind: 'mont', A: 520, p: 0.12, col: '#8A847C', wl: 900, haze: 'rgba(200, 180, 150, 0.35)' },
    { kind: 'mont', A: 300, p: 0.28, col: '#6E6860', wl: 600, haze: 'rgba(180, 160, 130, 0.3)' },
    { kind: 'foret', A: 160, p: 0.5, col: '#5A5A4A', cell: 140 },
  ],
  ground: ['#7A6A54', '#4A3E30'], grass: '#7A7A4A', rock: '#A08A6E', sand: '#B8A882',
  waterTop: '#6A8A8E', waterDeep: '#2A3E44', waterFront: 'rgba(90, 120, 120, 0.45)', waterFront2: 'rgba(30, 50, 55, 0.6)',
  cloud: 'rgba(150, 140, 130, 0.7)', weather: 'cendre', mist: 'rgba(190, 170, 140, 0.35)', fern: ['#4E6A34', '#6E8A44'],
};
const OCEAN = {
  sky: ['#3E9AE0', '#9AD2F2', '#E8F4F2'], sun: { x: 0.25, y: 0.16, col: '#FFF8D8', r: 40 },
  layers: [
    { kind: 'mont', A: 260, p: 0.1, col: '#9AC2D8', wl: 1200, haze: 'rgba(230, 245, 255, 0.4)' },
    { kind: 'mont', A: 180, p: 0.22, col: '#7AA8BE', wl: 700 },
  ],
  ground: ['#B89A6A', '#6A5038'], grass: '#7AA84A', rock: '#C2AE92', sand: '#E8D4A0',
  waterTop: '#3AA0D0', waterDeep: '#0E3A62', waterFront: 'rgba(40, 140, 200, 0.4)', waterFront2: 'rgba(10, 50, 100, 0.6)',
  cloud: 'rgba(255, 255, 255, 0.9)',
};
const PAMPA = {
  sky: ['#4E9AD8', '#A8D8EE', '#F6E6B8'], sun: { x: 0.8, y: 0.18, col: '#FFF2C0', r: 42 },
  layers: [
    { kind: 'mont', A: 420, p: 0.1, col: '#A8B8C8', wl: 1100, haze: 'rgba(255, 240, 210, 0.4)' },
    { kind: 'mont', A: 180, p: 0.26, col: '#B8A87A', wl: 800 },
    { kind: 'foret', A: 90, p: 0.5, col: '#8A8A4A', cell: 260 },
  ],
  ground: ['#A8884E', '#6A5030'], grass: '#B8A84A', rock: '#B09A7A', sand: '#D8C08A', tallGrass: ['#C2A84A', '#D8C26A'],
  leaf: ['#5A7A2A', '#7A9A34', '#9AB848'], waterTop: '#5AA0B8', waterDeep: '#2A5068', weather: 'pollen',
};
const ANDES = {
  sky: ['#2A6ACE', '#8AC0EE', '#E2EEF6'], sun: { x: 0.7, y: 0.14, col: '#FFFBE8', r: 38 },
  layers: [
    { kind: 'mont', A: 900, p: 0.08, col: '#B8C6DA', wl: 700, snow: '#F4F8FF', haze: 'rgba(240, 248, 255, 0.5)' },
    { kind: 'mont', A: 600, p: 0.18, col: '#8E9AB0', wl: 500, snow: '#E8EEF8' },
    { kind: 'mont', A: 260, p: 0.36, col: '#7A7A6A', wl: 400 },
  ],
  ground: ['#8A7A62', '#4E4434'], grass: '#8A9A4A', rock: '#9A8E80', snow: '#F2F6FA', sand: '#C8B48A',
  waterTop: '#5AA8C8', waterDeep: '#1E4A6A', cloud: 'rgba(255, 255, 255, 0.92)', summit: 900,
};
const FORET = {
  sky: ['#5AA2E2', '#B2DCF2', '#F2EED8'], sun: { x: 0.2, y: 0.18, col: '#FFF6D0', r: 40 },
  layers: [
    { kind: 'mont', A: 380, p: 0.1, col: '#A2B8CA', wl: 1000, haze: 'rgba(255, 255, 255, 0.4)' },
    { kind: 'foret', A: 220, p: 0.25, col: '#5E8A5A', cell: 150 },
    { kind: 'foret', A: 160, p: 0.45, col: '#4A7448', cell: 110 },
  ],
  ground: ['#7A6A3E', '#4A3E26'], grass: '#6A9A3A', rock: '#9A9282', flowerCols: ['#F2D24A', '#FFFFFF', '#B08AE8', '#F28AB0'],
  waterTop: '#5AA8C0', waterDeep: '#1E4A5E', weather: 'pollen',
};

/* L'histoire, en cinq oiseaux */
const chapters = [
  {
    title: 'Le petit survivant',
    ago: [66, 65],
    form: 'vc-asteriornis',
    skin: { body: '#9A7A58', belly: '#EAD8B8', dark: '#4A3420', stripe: '#6E5236' },
    size: [24, 24],
    moves: { fly: true, float: true, flyK: 0.85, flapRate: 13 },
    wings: 3.2,                      // en secondes : battre des ailes fatigue vite (la jauge 💨)
    vision: 1.3,
    fog: 0.4,
    palette: { water: ['#6A8A8E', '#2A3E44'], floor: '#7A6A54', motes: 'rgba(80, 76, 74, 0.6)' },
    land: {
      start: 0.08, hills: 120, cliffs: 6, cliffH: [520, 900], lakes: 3,
      trees: { mort: 16, fougere: 18, palmier: 5 },
      deco: { fougere: 2.5, rocher: 1.2, os: 0.4, souche: 0.6, herbe: 1, roseau: 1 },
      pal: CENDRES,
    },
    species: { graine: 14, scarabee: 8, libellule: 7, purgatorius: 3, borealosuchus: 2, serpent: 3 },
    unlock: ['bec-solide', 'ailes-longues'],
    intro: "Il y a 66 millions d'années, une immense météorite a frappé la Terre. Les grands dinosaures ont disparu… sauf un tout petit : TOI ! Tu es un oiseau, Asteriornis. Mange des graines, vole de falaise en falaise (pas trop longtemps : la jauge 💨 baisse quand tu bats des ailes), et fais ton nid sur une corniche, là où les serpents ne grimpent pas.",
    missions: [
      { type: 'eat', species: 'graine', n: 8, text: 'Picore 8 tas de graines' },
      { type: 'evolve', part: 'bec-solide' },
      { type: 'eat', species: 'libellule', n: 4, text: 'Attrape 4 libellules en vol' },
      { type: 'nest', place: 'corniche', eggs: 3, text: 'Fais ton nid sur une corniche de falaise', hint: "Ici, les serpents viendraient manger tes œufs ! Va sur une corniche, sur la paroi d'une falaise." },
      { type: 'feed', n: 6, species: ['graine', 'scarabee', 'libellule'], text: 'Nourris tes petits : 6 becquées' },
      { type: 'evolve', part: 'ailes-longues' },
    ],
    tips: [
      "Appuie sur ↑ pour t'envoler. Quand ta jauge 💨 est vide, tu ne peux plus monter : pose-toi pour te reposer.",
      "Les corniches sont de petits rebords sur les falaises. Pose-toi dessus et ne bouge plus : tu construis ton nid !",
      "Quand tes petits ont faim, attrape à manger : ça reste dans ton bec. Rapporte-le au nid !",
      "Méfie-toi de l'eau : un crocodile s'y cache. Et les serpents grimpent aux arbres !",
    ],
  },
  {
    title: 'Le géant des mers',
    ago: [25, 23],
    form: 'vc-pelagornis',
    skin: { body: '#F2F0EA', belly: '#FFFFFF', dark: '#5A5A60', stripe: '#C8C8CC', wing: '#E2E2E6', tip: '#3A3A42', beak: '#E6C98A' },
    size: [42, 42],
    moves: { fly: true, float: true, dive: true, agile: 2.2, flapRate: 4.5 },
    wings: 7,
    vision: 1.5,
    fog: 0.3,
    zoom: 0.85,
    palette: { water: ['#3AA0D0', '#0E3A62'], floor: '#B89A6A', motes: 'rgba(255, 255, 255, 0.5)' },
    land: {
      start: 0.4, hills: 70, sea: 'right', seaW: 8200, seaCliff: true, seaCliffH: [800, 1000], cliffs: 3, cliffH: [500, 800], thermals: 3,
      trees: { pin: 6, palmier: 4 }, deco: { herbe: 2, rocher: 1, fleur: 1.5 },
      pal: OCEAN,
    },
    species: { poisson: 24, 'poisson-volant': 6, calmar: 6, requin: 3, labbe: 3 },
    unlock: ['ailes-geantes', 'dents-os'],
    intro: "Des millions d'années ont passé. Tes descendants sont devenus GÉANTS : tu es Pelagornis, l'oiseau aux ailes de 6 mètres ! Tu planes au-dessus de l'océan et tu attrapes les poissons près de la surface. Pour plonger, pique vers l'eau (ou appuie sur ↓ quand tu es posé dessus). Mais attention : sous l'eau, un requin guette les oiseaux posés…",
    missions: [
      { type: 'eat', species: 'poisson', n: 8, text: 'Pêche 8 poissons' },
      { type: 'evolve', part: 'ailes-geantes' },
      { type: 'nest', place: 'corniche', eggs: 1, text: 'Fais ton nid sur la grande falaise', hint: 'Les oiseaux de mer nichent sur les corniches des falaises, au-dessus des vagues.' },
      { type: 'feed', n: 5, species: ['poisson', 'poisson-volant', 'calmar'], text: 'Nourris ton petit : 5 poissons' },
      { type: 'bark', species: 'labbe', n: 3, text: 'Chasse 3 labbes voleurs (fonce dessus)' },
      { type: 'evolve', part: 'dents-os' },
    ],
    tips: [
      "Pique vers l'eau, ou appuie sur ↓ quand tu es posé dessus : tu plonges et tu attrapes les poissons !",
      "Ne reste pas trop longtemps posé sur l'eau : le requin te voit d'en dessous.",
      "Les colonnes d'air chaud, près des falaises, te font monter sans effort.",
      "Un labbe veut voler la becquée de ton petit ? Fonce dessus !",
    ],
  },
  {
    title: "L'oiseau-terreur",
    ago: [15, 12],
    form: 'vc-phorusrhacos',
    skin: { body: '#7A6248', belly: '#D8C8A8', dark: '#3A2A1A', stripe: '#5A4632', beak: '#E2B34E' },
    size: [46, 46],
    moves: { jump: 700 },
    vision: 1.4,
    fog: 0.3,
    zoom: 0.95,
    palette: { water: ['#5AA0B8', '#2A5068'], floor: '#A8884E', motes: 'rgba(255, 250, 210, 0.5)' },
    land: {
      start: 0.1, hills: 150, lakes: 2, cliffs: 1,
      trees: { acacia: 12, feuillu: 3 }, deco: { herbe: 5, buisson: 1.5, rocher: 0.7, fleur: 1 },
      pal: PAMPA,
    },
    power: {
      type: 'whip', name: 'Coup de bec', icon: '💥', recharge: 3, range: 150, cry: 'TCHAC !',
      intro: "Ton pouvoir : le COUP DE BEC ! Appuie sur F (ou sur le bouton orange) : tout ce qui est près de toi est assommé. Même le Thylacosmilus !",
    },
    species: { agouti: 12, scarabee: 8, thylacosmilus: 2, macrauchenia: 3 },
    unlock: ['bec-hache', 'longues-pattes'],
    intro: "Surprise ! Certains oiseaux ont arrêté de voler. Pourquoi voler, quand on est le plus fort par terre ? Tu es Phorusrhacos, l'oiseau-terreur : 2 mètres de haut, un bec comme une hache, et tu cours très vite. Appuie sur ↑ pour sauter. Ton nid, tu le fais par terre, caché dans les hautes herbes.",
    missions: [
      { type: 'eat', species: 'agouti', n: 6, text: 'Attrape 6 agoutis à la course' },
      { type: 'evolve', part: 'bec-hache' },
      { type: 'stun', species: 'thylacosmilus', n: 2, text: 'Assomme 2 Thylacosmilus d’un coup de bec' },
      { type: 'nest', place: 'cache', eggs: 2, text: 'Fais ton nid caché dans les hautes herbes', hint: 'Ici, tout le monde verrait tes œufs ! Cache ton nid dans les hautes herbes.' },
      { type: 'feed', n: 5, species: ['agouti', 'scarabee'], text: 'Nourris tes petits : 5 repas' },
      { type: 'evolve', part: 'longues-pattes' },
    ],
    tips: [
      "Tu ne voles plus, mais tu sautes : appuie sur ↑.",
      "Le coup de bec (F) assomme les agoutis… et même le Thylacosmilus !",
      "Les hautes herbes cachent ton nid. Arrête-toi dedans, sans bouger.",
    ],
  },
  {
    title: 'Le roi du ciel',
    ago: [6, 5.5],
    form: 'vc-argentavis',
    skin: { body: '#3A3230', belly: '#5A504A', dark: '#1A1414', stripe: '#2A2420', wing: '#3A3230', tip: '#141010', beak: '#E8D4A8' },
    size: [58, 58],
    moves: { fly: true, flyK: 1.05, agile: 1.8, flapRate: 3.5 },
    wings: 3,
    vision: 1.6,
    fog: 0.25,
    zoom: 0.78,
    palette: { water: ['#5AA8C8', '#1E4A6A'], floor: '#8A7A62', motes: 'rgba(255, 255, 255, 0.6)' },
    land: {
      start: 0.06, hills: 130, mountains: 4, mountainH: [1100, 1600], cliffs: 2, thermals: 8, thermalLift: 360, summit: 900,
      trees: { pin: 7 }, deco: { rocher: 1.4, herbe: 2, fleur: 0.6 },
      pal: ANDES,
    },
    species: { carcasse: 6, vautour: 4, thylacosmilus: 2, agouti: 6 },
    unlock: ['ailes-planeur', 'tete-nue'],
    intro: "Il y a 6 millions d'années, au-dessus des Andes, plane le plus grand oiseau de son temps : Argentavis, c'est toi ! Tu es lourd : battre des ailes te fatigue très vite. Le secret ? Les colonnes d'air chaud qui montent du sol : entre dedans, et elles te soulèvent tout là-haut, sans effort.",
    missions: [
      { type: 'visit', place: 'thermique', n: 3, alt: 1300, icon: '🌀', cry: 'Tout là-haut !', text: "Monte tout en haut de 3 colonnes d'air chaud" },
      { type: 'eat', species: 'carcasse', n: 4, text: 'Mange 4 carcasses (avant les vautours)' },
      { type: 'evolve', part: 'ailes-planeur' },
      { type: 'nest', place: 'sommet', eggs: 1, text: 'Fais ton nid au sommet d’une montagne', hint: "Plus haut ! Argentavis nichait tout en haut des montagnes, loin de tout." },
      { type: 'bark', species: 'vautour', n: 3, text: 'Chasse 3 vautours de ton nid (fonce dessus)' },
      { type: 'evolve', part: 'tete-nue' },
    ],
    tips: [
      "L'air chaud qui monte se voit : il tremble et forme des volutes. Entre dedans sans battre des ailes !",
      "Tout là-haut, tu vois les carcasses de très loin. Les vautours aussi : sois le premier !",
      "Ta jauge 💨 se remplit quand tu planes dans l'air chaud ou quand tu es posé.",
    ],
  },
  {
    title: 'Le plus malin des oiseaux',
    ago: [0.04, 0.035],
    form: 'vc-corbeau',
    skin: { body: '#2A2A34', belly: '#4A4A58', dark: '#0E0E14', stripe: '#1A1A22', wing: '#24242E', tip: '#101018', beak: '#2E2C34' },
    size: [26, 26],
    moves: { fly: true, float: false, flapRate: 8, agile: 3.4 },
    wings: 9,
    trust: true,
    treat: 'viande',
    bark: { icon: '🐦', name: 'Croasse' },
    vision: 1.4,
    fog: 0.3,
    palette: { water: ['#5AA8C0', '#1E4A5E'], floor: '#7A6A3E', motes: 'rgba(255, 250, 220, 0.5)' },
    land: {
      start: 0.08, hills: 110, lakes: 2, camps: 2,
      trees: { feuillu: 14, pin: 10 }, deco: { herbe: 2.5, buisson: 1.2, fleur: 2, rocher: 0.6 },
      pal: FORET,
    },
    species: { humain: 4, chasseur: 3, renne: 5, noix: 10, scarabee: 6, loup: 1, aigle: 2 },
    unlock: ['croassement', 'bec-malin'],
    intro: "Il y a 40 000 ans, de nouveaux animaux sont arrivés : les humains ! Tu es un corbeau, l'oiseau le plus malin. Approche-toi du camp tout doucement : si les humains te font confiance, ils te laisseront leurs restes. Et avec ton croassement, tu leur montreras où sont les rennes…",
    missions: [
      { type: 'trust', species: 'humain', n: 50, text: 'Approche les humains : confiance 50 %' },
      { type: 'evolve', part: 'croassement' },
      { type: 'bark', species: 'renne', n: 4, text: 'Croasse pour montrer 4 rennes aux chasseurs' },
      { type: 'eat', species: 'viande', n: 5, text: 'Mange 5 restes de repas des humains' },
      { type: 'nest', place: 'cime', eggs: 4, text: 'Fais ton nid tout en haut d’un grand arbre', hint: "Les corbeaux nichent tout en haut des arbres : monte jusqu'à la cime !" },
      { type: 'evolve', part: 'bec-malin' },
    ],
    tips: [
      "Près du camp, reste posé sans bouger : la confiance 🤝 monte.",
      "Croasse (B) quand tu vois un renne : les chasseurs viendront !",
      "Un aigle royal tourne dans le ciel : cache-toi dans les feuillages des arbres.",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Tu es un oiseau… et les oiseaux sont des dinosaures ! Les seuls qui ont survécu à la météorite. Envole-toi avec ↑ !",
};

/* La fin : les oiseaux sont partout… et les humains arrivent */
const ending = {
  scene: 'oiseaux',
  title: 'Les derniers dinosaures',
  sub: "Les oiseaux descendent des dinosaures : ce sont les seuls qui ont survécu à la météorite. Aujourd'hui, il existe plus de 10 000 espèces d'oiseaux : du colibri, pas plus gros qu'un pouce, à l'autruche, plus grande qu'un humain !",
  done: 'Tu as conquis le ciel',
  captions: [
    [0.4, 4.4, "Le ciel appartient aux oiseaux. Ils ont colonisé toute la Terre, des déserts aux glaces du pôle."],
    [4.6, 9, "Le colibri, le perroquet, la chouette, le manchot, l'autruche… et même la poule : ce sont tous des dinosaures !"],
    [9.4, 14, "Et un jour, de nouveaux animaux lèvent les yeux vers le ciel, et rêvent de voler eux aussi : les humains."],
  ],
  crowd: ['libellule', 'poisson'],
  parade: [
    { look: 'vc-colibri', name: 'Colibri', color: '#3AB87A', belly: '#E8F4E8', k: 0.35, fly: true },
    { look: 'vc-perroquet', name: 'Perroquet', color: '#E2443A', belly: '#F2D23A', k: 0.7, fly: true },
    { look: 'vc-toucan', name: 'Toucan', color: '#1E1E24', belly: '#F2F0E8', k: 0.6 },
    { look: 'vc-chouette', name: 'Chouette', color: '#B8946A', belly: '#F0E2C8', k: 0.65 },
    { look: 'vc-poule', name: 'Poule', color: '#C27A3A', belly: '#E8B07A', k: 0.7 },
    { look: 'vc-manchot', name: 'Manchot', color: '#1E1E2A', belly: '#FFFFFF', k: 0.75 },
    { look: 'vc-flamant', name: 'Flamant rose', color: '#F29AAA', belly: '#F8C8D0', k: 0.8 },
    { look: 'vc-autruche', name: 'Autruche', color: '#2A2420', belly: '#3A3430', k: 1.1 },
  ],
  choices: [
    {
      id: 'humains', icon: '🔥', title: 'La voie des humains',
      text: "Et maintenant, vis l'aventure des humains : tailler la pierre, faire du feu, peindre les grottes…",
      level: 'voie-des-humains',
      soon: 'Niveau 4 : La voie des humains',
      fact: "Les humains ont toujours rêvé de voler comme les oiseaux. Il leur a fallu attendre 1783 pour monter dans les airs… en ballon !",
    },
  ],
};

export default {
  id: 'voie-des-airs',
  name: 'La voie des airs',
  num: 3,
  icon: '🐦',
  intro: 'airs',
  goal: "Tu es un petit oiseau qui a survécu à la météorite. <b>Vole de falaise en falaise, fais ton nid, nourris tes petits… et conquiers le ciel</b> :<br>🐦 Asteriornis → 🌊 Pelagornis → 💥 l'oiseau-terreur → ⛰️ Argentavis → 🐦 le corbeau !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
