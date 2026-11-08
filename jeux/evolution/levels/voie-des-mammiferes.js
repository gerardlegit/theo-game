// ============================================================================
// NIVEAU 3 — LA VOIE DES MAMMIFÈRES
//
// De la météorite (il y a 66 millions d'années) jusqu'à l'âge de glace et à
// l'arrivée des humains. Une petite boule de poils sort de son terrier : sans
// les dinosaures, les mammifères vont conquérir la Terre. Le joueur devient
// l'un des premiers carnivores, puis le premier chat, puis un tigre à dents
// de sabre, au milieu des mammifères les plus célèbres : chevaux, oiseaux-
// terreur, Titanoboa, mammouths laineux, ours des cavernes…
// Mêmes réglages que les niveaux 2 (vitesse, chasseurs, croissance).
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : terriers et fougères, forêts, prairies, savane, puis la neige */
const world = {
  ground: 'land',
  w: 12000,
  h: 8000,
  start: { x: 2200, y: 4000 },
  strike: {                        // le coup de griffe, à partir du chapitre 3
    name: 'Coup de griffe', icon: '🐾', type: 'griffe', from: 3,
    intro: "Nouveau : le coup de griffe ! Appuie sur F ou sur le bouton orange, quand un adversaire est tout près de toi : il reste assommé 2 secondes.",
  },
  maxChasers: 4,
  noise: 560,                      // un sprint s'entend jusque-là : les chasseurs se retournent
  penalty: { adn: 0.3, growth: 0.06 },
  decor: [
    { type: 'mare', count: 30, r: [190, 540], zone: 'water' },
    { type: 'boue', count: 22, r: [130, 320], zone: 'mud', to: 4 },
    { type: 'neige', count: 30, r: [150, 380], zone: 'mud', from: 5 },
    { type: 'fougeres', count: 80, r: [110, 380], hide: true, to: 2, atStart: true },
    { type: 'terrier', count: 45, r: [55, 75], hide: true, to: 1 },
    { type: 'herbes', count: 95, r: [130, 360], hide: true, from: 3, to: 4 },
    { type: 'herbes-gel', count: 85, r: [130, 340], hide: true, from: 5 },
    { type: 'feuillu', count: 90, r: [90, 190], canopy: true, to: 3 },
    { type: 'palmier', count: 55, r: [60, 120], canopy: true, from: 2, to: 2 },
    { type: 'feuillu', count: 30, r: [100, 200], canopy: true, from: 4, to: 4 },
    { type: 'sapin-neige', count: 80, r: [90, 190], canopy: true, from: 5 },
    { type: 'rocher', count: 120, r: [18, 90] },
    { type: 'os', count: 40, r: [30, 70], to: 1 },
    { type: 'os', count: 25, r: [30, 70], from: 4 },
    { type: 'fleur', count: 160, r: [6, 12], from: 2, to: 4 },
  ],
};

/* Les êtres vivants (les options sont les mêmes qu'au niveau 2 : voir vers-les-dinosaures.js) */
const species = {
  /* ---- Les rivaux : des animaux de ton espèce, qui te piquent ta nourriture (un par chapitre) ---- */
  'cousin-musaraigne': {
    name: 'Petit mammifère rival', plural: 'petits mammifères rivaux', kind: 'rival', noEat: true, look: 'dc-musaraigne', color: '#9C7A5A',
    size: 28, speed: 165, sense: 300, adn: 6,
    fact: "Les animaux d'une même espèce se disputent souvent la nourriture : c'est la compétition ! Les plus rapides mangent les premiers.",
  },
  'cousin-miacis': {
    name: 'Miacis rival', plural: 'Miacis rivaux', proper: true, kind: 'rival', noEat: true, look: 'dc-miacis', color: '#7A6A5A',
    size: 52, speed: 210, sense: 340, adn: 10,
    fact: "Les animaux d'une même espèce se disputent souvent la nourriture : c'est la compétition ! Les plus rapides mangent les premiers.",
  },
  'cousin-proailurus': {
    name: 'Proailurus rival', plural: 'Proailurus rivaux', proper: true, kind: 'rival', noEat: true, look: 'dc-proailurus', color: '#A07A50',
    size: 85, speed: 280, sense: 400, adn: 14,
    fact: "Les animaux d'une même espèce se disputent souvent la nourriture : c'est la compétition ! Les plus rapides mangent les premiers.",
  },
  'cousin-machairodus': {
    name: 'Machairodus rival', plural: 'Machairodus rivaux', proper: true, kind: 'rival', noEat: true, look: 'dc-machairodus', color: '#B88A4A',
    size: 135, speed: 340, sense: 460, adn: 20,
    fact: "Les grands félins se volent souvent leurs proies… et les hyènes aussi ! Dans la savane, il faut manger vite.",
  },
  'cousin-homotherium': {
    name: 'Homotherium rival', plural: 'Homotherium rivaux', proper: true, kind: 'rival', noEat: true, look: 'dc-homotherium', color: '#A8845A',
    size: 205, speed: 400, sense: 520, adn: 30,
    fact: "Les Homotherium vivaient peut-être en groupe, comme les lions d'aujourd'hui. Mais au moment de manger, c'est chacun pour soi !",
  },

  /* ---- Chapitre 1 : après la météorite ---- */
  insecte: {
    name: 'Insecte', plural: 'insectes', kind: 'prey', look: 'insecte', color: '#7FA63A',
    size: 5, speed: 75, sense: 80, adn: 2,
    fact: "Les insectes ont survécu à la météorite. Pour les premiers mammifères, tout petits, c'était le repas idéal !",
  },
  'mille-pattes': {
    name: 'Mille-pattes', plural: 'mille-pattes', kind: 'prey', look: 'millepattes', color: '#B5651D',
    size: 10, speed: 60, sense: 120, adn: 4,
    fact: "Malgré leur nom, les mille-pattes n'ont jamais mille pattes ! La plupart en ont entre 30 et 400.",
  },
  'petit-lezard': {
    name: 'Petit lézard', plural: 'petits lézards', kind: 'prey', look: 'dc-lezard', color: '#8DB255',
    size: 13, speed: 110, sense: 160, adn: 3,
    fact: "Les lézards et les serpents ont survécu à la météorite. Ils sont toujours là aujourd'hui !",
  },
  'oiseau-terreur': {
    name: 'Oiseau-terreur', plural: 'oiseaux-terreur', kind: 'hunter', look: 'dc-oiseau-terreur', color: '#6E5A48',
    size: 33, speed: 240, sense: 340, cone: 2.2, adn: 14,
    fact: "Après les dinosaures, de grands oiseaux coureurs sont devenus des chasseurs : les oiseaux-terreur, avec leur énorme bec crochu !",
  },
  titanoboa: {
    name: 'Titanoboa', plural: 'Titanoboa', proper: true, kind: 'hunter', look: 'titanoboa', color: '#6B7A3A', habitat: 'water',
    size: 75, speed: 265, sense: 340, reach: 0.55, adn: 30,
    fact: "Titanoboa était le plus grand serpent de tous les temps : 13 mètres, aussi long qu'un autobus ! Il vivait dans les marais chauds.",
  },

  /* ---- Chapitre 2 : la grande forêt de l'Éocène ---- */
  eohippus: {
    name: 'Eohippus', plural: 'Eohippus', proper: true, kind: 'prey', look: 'dc-eohippus', color: '#9C7A52',
    size: 14, speed: 120, sense: 170, adn: 6,
    fact: "Eohippus est l'ancêtre du cheval… et il était grand comme un renard ! Il avait plusieurs doigts à chaque patte.",
  },
  darwinius: {
    name: 'Petit primate', plural: 'petits primates', kind: 'prey', look: 'dc-darwinius', color: '#8A6A50',
    size: 12, speed: 110, sense: 170, adn: 5,
    fact: "Les premiers primates vivaient dans les arbres de la grande forêt. Ce sont les très lointains cousins des singes… et des humains !",
  },
  gastornis: {
    name: 'Gastornis', plural: 'Gastornis', proper: true, kind: 'neutral', look: 'dc-gastornis', color: '#5E6A7A',
    size: 115, speed: 50, adn: 0,
    fact: "Gastornis était un oiseau géant, plus grand qu'un homme. Avec son bec énorme, il cassait sans doute des graines et des fruits très durs.",
  },
  pristichampsus: {
    name: 'Crocodile coureur', plural: 'crocodiles coureurs', kind: 'hunter', look: 'dc-crocodile-coureur', color: '#5E6B3A',
    size: 56, speed: 275, sense: 380, cone: 1.9, adn: 24,
    fact: "Pristichampsus était un crocodile qui chassait sur la terre ferme. Ses pattes étaient longues, et ses griffes ressemblaient à de petits sabots !",
  },
  andrewsarchus: {
    name: 'Andrewsarchus', plural: 'Andrewsarchus', proper: true, kind: 'hunter', look: 'dc-andrewsarchus', color: '#7A5E48', stomp: true, roar: true,
    size: 105, speed: 300, sense: 430, cone: 2.0, adn: 40,
    fact: "Andrewsarchus avait une tête gigantesque, presque un mètre de long ! Ses dents pouvaient broyer des os et des carapaces.",
  },
  ambulocetus: {
    name: 'Ambulocetus', plural: 'Ambulocetus', proper: true, kind: 'hunter', look: 'dc-ambulocetus', color: '#5A6670', habitat: 'water',
    size: 70, speed: 260, sense: 340, reach: 0.6, adn: 30,
    fact: "Ambulocetus, la « baleine qui marche », vivait au bord de l'eau. Ses descendants sont retournés dans la mer : ce sont les baleines !",
  },

  /* ---- Chapitre 3 : les prairies de l'Oligocène ---- */
  palaeolagus: {
    name: 'Lapin préhistorique', plural: 'lapins préhistoriques', kind: 'prey', look: 'dc-palaeolagus', color: '#A08A6A',
    size: 20, speed: 160, sense: 220, adn: 6,
    fact: "Palaeolagus ressemblait déjà beaucoup à un lapin… mais ses pattes arrière étaient plus courtes : il ne sautait pas aussi bien !",
  },
  mesohippus: {
    name: 'Mesohippus', plural: 'Mesohippus', proper: true, kind: 'prey', look: 'dc-mesohippus', color: '#B08A5A',
    size: 28, speed: 180, sense: 240, adn: 8,
    fact: "Mesohippus, un ancêtre du cheval, avait trois doigts à chaque patte. Il était grand comme un chien.",
  },
  hyaenodon: {
    name: 'Hyaenodon', plural: 'Hyaenodon', proper: true, kind: 'hunter', look: 'dc-hyaenodon', color: '#6A5A4A', pack: 3,
    size: 82, speed: 425, sense: 480, cone: 2.4, adn: 22,
    fact: "Hyaenodon ressemblait à un loup, mais ce n'était pas un chien ! Il avait des dents tranchantes comme des ciseaux et chassait peut-être en groupe.",
  },
  entelodon: {
    name: 'Entelodon', plural: 'Entelodon', proper: true, kind: 'hunter', look: 'dc-entelodon', color: '#6A4A3A', stomp: true, roar: true,
    size: 150, speed: 415, sense: 530, cone: 2.2, adn: 50,
    fact: "Entelodon, surnommé le « cochon de l'enfer », était grand comme un bison ! Il mangeait de tout, même les autres animaux.",
  },
  crocodile: {
    name: 'Crocodile', plural: 'crocodiles', kind: 'hunter', look: 'dc-crocodile', color: '#556B2F', habitat: 'water',
    size: 120, speed: 290, sense: 370, adn: 35,
    fact: "Les crocodiles ont survécu à la météorite. Ils guettent sans bouger, presque cachés sous l'eau… puis ils bondissent !",
  },
  paraceratherium: {
    name: 'Paraceratherium', plural: 'Paraceratherium', proper: true, kind: 'giant', look: 'dc-paraceratherium', color: '#8E8A7A', stomp: true, hurt: 'Écrasé !',
    size: 340, speed: 70, adn: 0,
    fact: "Paraceratherium, un rhinocéros sans corne, est le plus grand mammifère terrestre de tous les temps : 5 mètres au garrot, plus haut qu'une girafe !",
  },

  /* ---- Chapitre 4 : la savane du Miocène ---- */
  gazelle: {
    name: 'Antilope', plural: 'antilopes', kind: 'prey', look: 'dc-gazelle', color: '#C79A5E',
    size: 34, speed: 300, sense: 300, adn: 12,
    fact: "Dans la savane, les antilopes vivaient en troupeaux : à plusieurs, on repère plus vite les chasseurs !",
  },
  hipparion: {
    name: 'Hipparion', plural: 'Hipparion', proper: true, kind: 'prey', look: 'dc-hipparion', color: '#A88A64',
    size: 70, speed: 295, sense: 340, adn: 22,
    fact: "Hipparion était un cheval à trois doigts, très rapide. Des troupeaux immenses galopaient dans les grandes plaines.",
  },
  oiseau: {
    name: 'Oiseau', plural: 'oiseaux', kind: 'prey', look: 'oiseau', color: '#5FA8E8', flying: true,
    size: 30, speed: 280, sense: 260, adn: 10,
    fact: "Les oiseaux sont les descendants des dinosaures ! Ce sont les seuls dinosaures qui ont survécu à la météorite.",
  },
  chalicothere: {
    name: 'Chalicothère', plural: 'chalicothères', kind: 'defender', look: 'dc-chalicothere', color: '#7E7466', hurt: 'Aïe, les griffes !',
    size: 170, speed: 130, sense: 260, adn: 60,
    fact: "Le chalicothère avait une tête de cheval… et d'énormes griffes ! Il marchait sur ses poings, comme un gorille.",
  },
  deinotherium: {
    name: 'Deinotherium', plural: 'Deinotherium', proper: true, kind: 'giant', look: 'dc-deinotherium', color: '#8A8278', stomp: true, hurt: 'Écrasé !',
    size: 340, speed: 70, adn: 0,
    fact: "Deinotherium était un cousin géant de l'éléphant. Ses défenses étaient recourbées vers le bas, comme des crochets !",
  },
  hyene: {
    name: 'Hyène géante', plural: 'hyènes géantes', kind: 'hunter', look: 'dc-hyene', color: '#9A845E',
    size: 160, speed: 485, sense: 580, cone: 2.3, adn: 50,
    fact: "Les hyènes ont une mâchoire si puissante qu'elles croquent même les os ! Au Miocène, certaines étaient grandes comme des lions.",
  },
  amphicyon: {
    name: 'Chien-ours', plural: 'chiens-ours', kind: 'hunter', look: 'dc-amphicyon', color: '#6E5440', stomp: true, roar: true,
    size: 210, speed: 515, sense: 620, cone: 2.3, adn: 70,
    fact: "Amphicyon, le « chien-ours », avait le corps d'un ours et la tête d'un loup. C'était l'un des plus grands chasseurs de son époque.",
  },

  /* ---- Chapitre 5 : l'âge de glace ---- */
  bison: {
    name: 'Bison des steppes', plural: 'bisons des steppes', kind: 'prey', look: 'dc-bison', color: '#6E4E36',
    size: 110, speed: 300, sense: 390, adn: 30,
    fact: "Le bison des steppes avait des cornes deux fois plus grandes que celles des bisons d'aujourd'hui. Les humains l'ont peint dans les grottes !",
  },
  renne: {
    name: 'Renne', plural: 'rennes', kind: 'prey', look: 'dc-renne', color: '#9A8A74',
    size: 120, speed: 310, sense: 400, adn: 32,
    fact: "Chez les rennes, même les femelles ont des bois ! Ils vivent dans le froid, en très grands troupeaux.",
  },
  cheval: {
    name: 'Cheval sauvage', plural: 'chevaux sauvages', kind: 'prey', look: 'dc-cheval', color: '#B8925E',
    size: 85, speed: 380, sense: 430, adn: 24,
    fact: "Les chevaux de l'âge de glace avaient une crinière toute droite, comme une brosse. Les humains les ont peints sur les murs des grottes.",
  },
  megaloceros: {
    name: 'Mégacéros', plural: 'mégacéros', kind: 'defender', look: 'dc-megaloceros', color: '#8A6E50', hurt: 'Aïe, les bois !',
    size: 200, speed: 150, sense: 260, adn: 70,
    fact: "Le mégacéros, un cerf géant, avait les plus grands bois de tous les temps : plus de 3 mètres d'un bout à l'autre !",
  },
  'rhino-laineux': {
    name: 'Rhinocéros laineux', plural: 'rhinocéros laineux', kind: 'defender', look: 'dc-rhino-laineux', color: '#7A6450', stomp: true, hurt: 'Aïe, la corne !',
    size: 260, speed: 200, sense: 280, adn: 80,
    fact: "Le rhinocéros laineux était couvert d'une épaisse fourrure. Sa grande corne lui servait à pousser la neige pour trouver de l'herbe.",
  },
  mammouth: {
    name: 'Mammouth laineux', plural: 'mammouths laineux', kind: 'defender', look: 'dc-mammouth', color: '#7A5A40', stomp: true, hurt: 'Aïe, les défenses !',
    size: 330, speed: 170, sense: 260, adn: 120,
    eatLine: "Incroyable ! Tu as osé t'attaquer à un mammouth laineux… et tu as gagné !",
    fact: "Le mammouth laineux avait une fourrure épaisse, de petites oreilles pour ne pas avoir froid, et des défenses de 4 mètres !",
  },
  'hyene-des-cavernes': {
    name: 'Hyène des cavernes', plural: 'hyènes des cavernes', kind: 'hunter', look: 'dc-hyene', color: '#8A7A5A', pack: 2,
    size: 200, speed: 615, sense: 640, cone: 2.5, adn: 55,
    fact: "Les hyènes des cavernes vivaient en groupe dans les grottes. On y a retrouvé des milliers d'os qu'elles avaient rapportés !",
  },
  'lion-des-cavernes': {
    name: 'Lion des cavernes', plural: 'lions des cavernes', kind: 'hunter', look: 'dc-lion-des-cavernes', color: '#C9A46E', roar: true,
    size: 230, speed: 580, sense: 640, cone: 2.3, adn: 60,
    fact: "Le lion des cavernes était plus grand que les lions d'aujourd'hui. Sur les peintures des grottes, les mâles n'ont pas de crinière !",
  },
  'ours-des-cavernes': {
    name: 'Ours des cavernes', plural: 'ours des cavernes', kind: 'hunter', look: 'dc-ours-des-cavernes', color: '#5A4232', boss: true, stomp: true, roar: true,
    size: 360, speed: 600, sense: 720, cone: 2.3, adn: 250,
    fact: "L'ours des cavernes était énorme : debout, il mesurait plus de 3 mètres ! Il dormait tout l'hiver au fond des grottes.",
  },
};

/* Les évolutions (ici, pas de jauge d'eau : les mammifères ne sèchent pas !) */
const evolutions = {
  'pattes-agiles': {
    name: 'Pattes agiles', ch: 1, cost: 20, effect: { speed: 1.25 },
    short: 'Tu cours et tu grimpes partout',
    fact: "Les premiers mammifères étaient petits et agiles : ils grimpaient aux arbres et filaient se cacher au moindre danger.",
  },
  moustaches: {
    name: 'Moustaches', ch: 1, cost: 45, effect: { vision: 1.3, radar: true },
    short: 'Tu sens les dangers autour de toi, même dans le noir',
    fact: "Les moustaches sont des poils très sensibles : elles aident les petits mammifères à se repérer dans le noir, au fond de leur terrier.",
  },
  fourrure: {
    name: 'Fourrure', ch: 2, cost: 60, effect: { shield: 1 },
    short: 'Ta fourrure te protège : tu encaisses un coup',
    fact: "Les poils gardent le corps bien au chaud : c'est une invention des mammifères ! Grâce à eux, ils peuvent sortir même la nuit.",
  },
  oreilles: {
    name: 'Grandes oreilles', ch: 2, cost: 90, effect: { cones: true },
    short: 'Tu entends les chasseurs : tu sais où ils regardent',
    fact: "Dans l'oreille des mammifères, trois minuscules osselets transmettent les sons. Ce sont les plus petits os de ton corps !",
  },
  griffes: {
    name: 'Griffes rétractiles', ch: 3, cost: 140, effect: { ratio: 0.95, reach: 1.2 },
    short: 'Tu attrapes des proies plus grosses',
    fact: "Comme ton chat, Proailurus pouvait rentrer et sortir ses griffes : elles restent bien pointues pour la chasse !",
  },
  bond: {
    name: 'Bond de félin', ch: 3, cost: 180, effect: { dash: true },
    short: 'Ton sprint se recharge plus vite',
    fact: "Les félins chassent à l'affût : ils s'approchent sans bruit, puis bondissent d'un coup sur leur proie.",
  },
  'dents-de-sabre': {
    name: 'Dents de sabre', ch: 4, cost: 260, effect: { ratio: 1.05 },
    short: 'Tes longues dents attrapent des proies encore plus grosses',
    fact: "Les dents de sabre de Machairodus mesuraient plus de 15 cm ! Elles étaient fines et coupantes comme des couteaux.",
  },
  flair: {
    name: 'Flair', ch: 4, cost: 300, effect: { vision: 1.6, radar: true },
    short: 'Tu sens les proies et les chasseurs de loin',
    fact: "Dans la savane, l'odorat est précieux : un félin sent une proie… ou un danger, bien avant de les voir.",
  },
  'fourrure-epaisse': {
    name: 'Fourrure épaisse', ch: 5, cost: 400, effect: { shield: 2 },
    short: 'Tu encaisses deux coups',
    fact: "Pendant l'âge de glace, il faisait très froid : les animaux avaient une fourrure épaisse, comme le mammouth laineux.",
  },
  'grands-sabres': {
    name: 'Grands sabres', ch: 5, cost: 520, effect: { ratio: 1.6 },
    short: 'Même un mammouth ne te résiste plus !',
    fact: "Les dents d'Homotherium avaient de petites dents de scie. Dans une grotte, on a retrouvé ses os… avec ceux de jeunes mammouths !",
  },
};

/* L'histoire, en cinq chapitres */
const chapters = [
  {
    title: 'Après la météorite',
    ago: [66, 60],
    form: 'dc-musaraigne',
    skin: { body: '#C9895A', belly: '#F6E3C8', dark: '#5E3A22', stripe: '#8C5A36' },
    size: [20, 40],
    growth: 130,
    vision: 1.2,
    fog: 0.6,
    palette: { water: ['#5B6E5A', '#2F3A30'], floor: '#6E6A58', motes: 'rgba(225, 222, 212, 0.55)' },
    species: { insecte: 22, 'mille-pattes': 15, 'petit-lezard': 9, 'cousin-musaraigne': 3, 'oiseau-terreur': 3, titanoboa: 2 },
    unlock: ['pattes-agiles', 'moustaches'],
    intro: "La météorite a tout changé : les grands dinosaures ont disparu ! Toi, tu es une petite boule de poils qui sort de son terrier. Le monde est vide… mais attention aux oiseaux-terreur, et ne t'approche pas trop des marais : Titanoboa y guette !",
    missions: [
      { type: 'evolve', part: 'pattes-agiles' },
      { type: 'eat', species: 'mille-pattes', n: 5 },
      { type: 'evolve', part: 'moustaches' },
      { type: 'grow' },
      { type: 'eat', species: 'oiseau-terreur', n: 1, revenge: true },
    ],
    tips: [
      "Un terrier, c'est la meilleure cachette : glisse-toi dedans, personne ne te verra !",
      "L'oiseau-terreur ne voit que devant lui : passe derrière lui sans courir.",
      "Quand tu sprintes, ça fait du bruit : les chasseurs t'entendent !",
    ],
  },
  {
    title: "La grande forêt de l'Éocène",
    ago: [50, 45],
    form: 'dc-miacis',
    skin: { body: '#7E7FB8', belly: '#E6E4F6', dark: '#34355E', stripe: '#55568A' },
    size: [40, 70],
    growth: 280,
    vision: 0.9,
    fog: 0.68,
    palette: { water: ['#3F6A4A', '#1E3A28'], floor: '#5E7A3A', motes: 'rgba(210, 255, 170, 0.45)' },
    species: { insecte: 15, eohippus: 15, darwinius: 10, 'cousin-miacis': 3, gastornis: 2, pristichampsus: 2, andrewsarchus: 2, ambulocetus: 2 },
    unlock: ['fourrure', 'oreilles'],
    intro: "Il fait chaud partout sur la Terre : une immense forêt pousse, avec des palmiers jusqu'aux pôles ! Tu es devenu Miacis, l'ancêtre des chats et des chiens. Ici vivent les premiers chevaux, petits comme des renards… et Andrewsarchus, à la tête gigantesque.",
    missions: [
      { type: 'evolve', part: 'fourrure' },
      { type: 'eat', species: 'eohippus', n: 6 },
      { type: 'evolve', part: 'oreilles' },
      { type: 'grow' },
      { type: 'eat', species: 'pristichampsus', n: 1, revenge: true },
    ],
    tips: [
      "Il fait sombre sous les arbres… Avec de grandes oreilles, tu sauras où regardent les chasseurs.",
      "Gastornis est énorme, mais il ne mange que des graines et des fruits. Ouf !",
      "Dans les mares, méfie-toi d'Ambulocetus, la baleine qui marche !",
    ],
  },
  {
    title: 'Les premières prairies',
    ago: [30, 25],
    form: 'dc-proailurus',
    skin: { body: '#E08A3C', belly: '#FBE7C8', dark: '#6B3A12', stripe: '#9A5520' },
    size: [70, 110],
    growth: 530,
    speed: 1.05,
    vision: 1.35,
    fog: 0.45,
    palette: { water: ['#8A8A50', '#4F4A2A'], floor: '#A49A5A', motes: 'rgba(255, 240, 190, 0.5)' },
    species: { palaeolagus: 15, mesohippus: 11, 'cousin-proailurus': 3, hyaenodon: 3, entelodon: 2, crocodile: 2, paraceratherium: 1 },
    unlock: ['griffes', 'bond'],
    intro: "La Terre se refroidit : les forêts reculent, les premières prairies apparaissent. Tu es devenu Proailurus, le tout premier chat ! Cache-toi dans les hautes herbes : les Hyaenodon chassent en meute, et le terrible Entelodon rôde…",
    missions: [
      { type: 'evolve', part: 'griffes' },
      { type: 'eat', species: 'mesohippus', n: 4 },
      { type: 'evolve', part: 'bond' },
      { type: 'grow' },
      { type: 'eat', species: 'hyaenodon', n: 1, revenge: true },
    ],
    tips: [
      "Les hautes herbes sont de parfaites cachettes pour un chat !",
      "Une meute ! Si un Hyaenodon te voit, les autres arrivent aussi…",
      "Boum… boum… C'est Paraceratherium, le plus grand mammifère de tous les temps. Ne passe pas sous ses pattes !",
    ],
  },
  {
    title: 'La savane du Miocène',
    ago: [9, 7],
    form: 'dc-machairodus',
    skin: { body: '#E2B24A', belly: '#FBF0D2', dark: '#6E4E14', stripe: '#7A4E1C' },
    size: [110, 170],
    growth: 900,
    speed: 1.05,
    vision: 1.4,
    fog: 0.42,
    palette: { water: ['#B49A5A', '#6A5530'], floor: '#C2A65E', motes: 'rgba(255, 235, 180, 0.5)' },
    species: { gazelle: 12, hipparion: 10, oiseau: 7, 'cousin-machairodus': 3, chalicothere: 2, deinotherium: 2, hyene: 2, amphicyon: 2 },
    unlock: ['dents-de-sabre', 'flair'],
    intro: "Une immense savane couvre la Terre. Tu es devenu Machairodus, l'un des premiers tigres à dents de sabre ! Des troupeaux de chevaux galopent partout… mais le chien-ours et les hyènes géantes ne te laisseront pas faire.",
    missions: [
      { type: 'evolve', part: 'dents-de-sabre' },
      { type: 'eat', species: 'hipparion', n: 4 },
      { type: 'evolve', part: 'flair' },
      { type: 'grow' },
      { type: 'eat', species: 'hyene', n: 1, revenge: true },
    ],
    tips: [
      "Ne passe pas sous les pattes du Deinotherium !",
      "Le chalicothère n'est pas méchant… sauf si tu t'approches de ses grandes griffes.",
      "Le chien-ours est plus gros que toi : grandis avant de l'approcher !",
    ],
  },
  {
    title: "L'âge de glace",
    ago: [0.04, 0.015],
    form: 'dc-homotherium',
    skin: { body: '#B5784A', belly: '#F6E6D2', dark: '#4E2E16', stripe: '#7A4A28' },
    size: [170, 260],
    growth: 2100,
    vision: 1.25,
    fog: 0.5,
    palette: { water: ['#C9D6DE', '#7D8E9A'], floor: '#DCE6EC', motes: 'rgba(255, 255, 255, 0.9)' },
    species: { bison: 5, renne: 4, cheval: 4, 'cousin-homotherium': 2, megaloceros: 2, 'rhino-laineux': 2, mammouth: 2, 'hyene-des-cavernes': 2, 'lion-des-cavernes': 2, 'ours-des-cavernes': 1 },
    unlock: ['fourrure-epaisse', 'grands-sabres'],
    intro: "Brrr ! C'est l'âge de glace : la neige recouvre tout. Tu es devenu Homotherium, un grand tigre à dents de sabre. Autour de toi, des mammouths laineux, des rhinocéros laineux… et le roi des glaces : l'ours des cavernes. Pour régner, il faudra le battre !",
    missions: [
      { type: 'evolve', part: 'fourrure-epaisse' },
      { type: 'evolve', part: 'grands-sabres' },
      { type: 'eat', species: 'mammouth', n: 1 },
      { type: 'grow' },
      { type: 'eat', species: 'ours-des-cavernes', n: 1, revenge: true },
    ],
    tips: [
      "La neige profonde, ça ralentit ! Un chasseur qui te suit dedans sera ralenti, lui aussi.",
      "Le mammouth charge avec ses défenses si tu t'approches. Fais-toi pousser les grands sabres avant de l'attaquer !",
      "L'ours des cavernes est plus gros que toi. Grandis au maximum avant de l'affronter !",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Les dinosaures ont disparu… À toi de conquérir la Terre ! Mais attention : de nouveaux chasseurs arrivent. Cache-toi dans les terriers !",
};

/* La fin : on règne sur l'âge de glace… puis les humains arrivent, avec le feu. */
const ending = {
  scene: 'feu',
  crowd: ['mammouth', 'rhino-laineux', 'megaloceros', 'bison', 'renne', 'cheval'],
  title: "L'arrivée des humains",
  sub: "Il y a environ 15 000 ans, la glace commence à fondre. Les mammouths et les tigres à dents de sabre disparaissent peu à peu… et les humains peuplent toute la Terre. Quelle sera la suite de l'histoire ?",
  done: "Tu as régné sur l'âge de glace… jusqu'à l'arrivée des humains",
  captions: [
    [0.4, 4, "Tu règnes sur l'âge de glace ! Même les mammouths te respectent…"],
    [4.2, 7.6, "Mais un soir, une drôle de lumière brille au loin…"],
    [7.8, 11.6, "Un nouvel animal arrive. Il n'a ni griffes ni crocs… mais il sait faire du feu : c'est l'être humain !"],
    [11.8, 15, "Sur les murs des grottes, les humains ont peint les animaux de l'âge de glace. C'est grâce à eux qu'on sait à quoi tu ressemblais !"],
  ],
  choices: [
    {
      id: 'humains', icon: '🔥', title: 'La voie des humains',
      text: "Tailler la pierre, faire du feu, peindre les grottes : l'aventure des premiers humains commence !",
      level: 'voie-des-humains',
      soon: 'Niveau 4 : La voie des humains',
      fact: "Les humains sont des mammifères, comme toi ! Nous sommes des primates, cousins des singes.",
    },
    {
      id: 'loup', icon: '🐺', title: "Le loup et l'humain",
      text: "Un loup s'approche du feu des humains… et devient leur meilleur ami.",
      level: 'loup-et-humain',
      soon: "Niveau 4 : Le loup et l'humain",
      fact: "Tous les chiens, du chihuahua au saint-bernard, descendent de loups apprivoisés par les humains il y a plus de 15 000 ans !",
    },
  ],
};

export default {
  id: 'voie-des-mammiferes',
  name: 'La voie des mammifères',
  num: 3,
  icon: '🐾',
  intro: 'mammiferes',
  goal: "Les dinosaures ont disparu ! Tu es une petite boule de poils qui sort de son terrier. <b>Cache-toi, grandis, et deviens le roi de l'âge de glace</b> :<br>🐭 le petit mammifère → 🦊 Miacis → 🐱 le premier chat → 🐯 le tigre à dents de sabre !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
