// ============================================================================
// NIVEAU 3 (version mer) — LA VOIE DES REQUINS
//
// La suite des monstres marins : après la météorite (il y a 66 millions
// d'années), la mer est à prendre. À chaque chapitre, le joueur devient un
// autre requin de la grande famille, avec son pouvoir à lui (touche F) :
//   le requin-lanterne s'allume, le requin-renard fouette, le requin-tigre
//   aspire tout et rote, le requin-marteau fait BONG et trouve ce qui est
//   caché, le mégalodon saute hors de l'eau.
// Plus de jauge d'air (des branchies !), et on ne grandit plus en mangeant
// (world.noGrow) : manger vite de suite rapporte des combos (world.combo).
// Les géants tournent en larges courbes (maxTurn) : on leur échappe en virant.
// Le moteur (script.js) ne connaît aucune espèce par son nom : tout est ici.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* La carte : la haute mer, ses forêts d'algues pour se cacher, ses coraux */
const world = {
  w: 12000,
  h: 8000,
  start: { x: 6000, y: 4000 },
  maxChasers: 3,
  speed: 1.9,
  noGrow: true,
  combo: true,
  noise: 560,
  penalty: { adn: 0.2, growth: 0 },
  decor: [
    { type: 'algues', count: 60, r: [110, 300], hide: true, atStart: true, to: 3 },
    { type: 'algues', count: 40, r: [240, 520], hide: true, from: 4 },
    { type: 'rocher', count: 100, r: [16, 80] },
    { type: 'eponge', count: 50, r: [14, 38], from: 2 },
    { type: 'corail', count: 60, r: [22, 64], from: 2 },
    { type: 'os', count: 40, r: [40, 90], to: 1 },
    { type: 'os', count: 14, r: [40, 90], from: 2 },
  ],
};

/* Les êtres vivants. hits = le nombre de coups qu'encaisse un boss (sa barre de vie) ;
   tailBite = on le touche en lui mordant la queue ; breachHit = en lui retombant dessus ;
   buried = caché dans le sable ; maxTurn = il tourne lentement (rad/s). */
const species = {
  /* ---- Chapitre 1 : après la météorite ---- */
  crevette: {
    name: 'Crevette', plural: 'crevettes', kind: 'prey', look: 'crevette', color: '#F4B59A',
    size: 7, speed: 130, sense: 130, adn: 3,
    fact: "Les crevettes ont survécu à la météorite. Dans le noir, beaucoup de petits animaux sont attirés par la moindre lumière !",
  },
  'petit-poisson': {
    name: 'Petit poisson', plural: 'petits poissons', kind: 'prey', look: 'poisson', color: '#9FD8E8', fish: { jaw: 'small' },
    size: 12, speed: 210, sense: 200, adn: 5,
    fact: "Après la météorite, de nombreux poissons ont disparu. Ceux qui restaient se sont ensuite répandus partout : aujourd'hui, ils sont des dizaines de milliers d'espèces !",
  },
  meduse: {
    name: 'Méduse', plural: 'méduses', kind: 'stinger', look: 'meduse', color: '#E8A6F0', hurt: 'Ça pique !',
    size: 40, speed: 30, sense: 0, adn: 0,
    fact: "Les méduses existent depuis plus de 500 millions d'années. La météorite ne les a pas arrêtées !",
  },
  dyrosaure: {
    name: 'Dyrosaure', plural: 'dyrosaures', kind: 'hunter', look: 'metriorhynque', color: '#5F7A5A', noEat: true, maxTurn: 2.4,
    size: 70, speed: 300, sense: 300, cone: 2.4, adn: 0, hitLine: 'Mes yeux !',
    fact: "Les dyrosaures étaient de grands crocodiles marins. Ils ont survécu à la météorite, et ont continué à chasser dans les mers pendant des millions d'années.",
  },

  /* ---- Chapitre 2 : l'Éocène ---- */
  sardine: {
    name: 'Sardine', plural: 'sardines', kind: 'prey', look: 'poisson', color: '#BFE0EE', fish: { jaw: 'small' }, pack: 6,
    size: 11, speed: 260, sense: 240, adn: 3,
    fact: "Les sardines nagent en bancs serrés pour se protéger. Le requin-renard, lui, les assomme d'un coup de queue, puis il les gobe une à une !",
  },
  manchot: {
    name: 'Manchot géant', plural: 'manchots géants', kind: 'prey', look: 'manchot', color: '#20242E',
    size: 30, speed: 390, sense: 380, adn: 16,
    eatLine: "Un manchot géant ! Il était presque aussi grand que toi !",
    fact: "Il y a 50 millions d'années vivaient des manchots aussi grands qu'un être humain ! Ils « volaient » sous l'eau, comme ceux d'aujourd'hui.",
  },
  ambulocete: {
    name: 'Ambulocetus', plural: 'Ambulocetus', proper: true, kind: 'hunter', look: 'ambulocete', color: '#7A6A54', noEat: true, maxTurn: 2.6,
    size: 60, speed: 340, sense: 300, cone: 2.4, adn: 0,
    fact: "Ambulocetus, « la baleine qui marche », avait encore quatre pattes ! Les baleines sont des mammifères retournés dans la mer.",
  },
  otodus: {
    name: 'Otodus', plural: 'Otodus', proper: true, kind: 'hunter', look: 'otodus', color: '#6E7E88', noEat: true, maxTurn: 1.8, roar: true,
    size: 120, speed: 370, sense: 380, cone: 2.2, adn: 0,
    fact: "Otodus était un énorme requin de 9 mètres : un lointain cousin du mégalodon, qui n'existait pas encore !",
  },

  /* ---- Chapitre 3 : les premières baleines ---- */
  bazar: {
    name: 'Truc pas mangeable', plural: 'trucs pas mangeables', kind: 'food', look: 'bazar', color: '#8A6238',
    size: 16, speed: 6, sense: 0, adn: 8,
    eatLine: "Mais… ça ne se mange pas, ça ! Bon. Ton estomac n'est pas de cet avis.",
    fact: "Le requin-tigre avale n'importe quoi ! Dans son estomac, on a déjà trouvé des pneus, des plaques de voiture et même une armure !",
  },
  tortue: {
    name: 'Tortue de mer', plural: 'tortues de mer', kind: 'prey', look: 'tortue', color: '#5E8A58',
    size: 38, speed: 300, sense: 320, adn: 14,
    fact: "Le requin-tigre a des dents en forme de scie, assez solides pour croquer la carapace d'une tortue !",
  },
  calmar: {
    name: 'Calmar', plural: 'calmars', kind: 'prey', look: 'belemnite', color: '#C98A8A',
    size: 22, speed: 340, sense: 300, adn: 7,
    fact: "Le calmar fuit à reculons, en lançant de l'eau, comme une petite fusée !",
  },
  dorudon: {
    name: 'Dorudon', plural: 'Dorudon', proper: true, kind: 'prey', look: 'dorudon', color: '#7E8E98',
    size: 58, speed: 350, sense: 340, adn: 22,
    fact: "Dorudon était une petite baleine de 5 mètres. On a retrouvé des crânes de Dorudon avec les traces de dents de Basilosaurus !",
  },
  basilosaure: {
    name: 'Basilosaurus', plural: 'Basilosaurus', proper: true, kind: 'hunter', look: 'basilosaure', color: '#5E6E7A', noEat: true, maxTurn: 1.5, roar: true,
    tailBite: true, hits: 3, hitLine: 'MA QUEUE !',
    size: 125, speed: 400, sense: 420, cone: 2.1, adn: 0,
    fact: "Basilosaurus, une baleine longue de 18 mètres, fine comme un serpent. Elle avait encore deux minuscules pattes arrière, qui ne lui servaient presque plus à rien !",
  },

  /* ---- Chapitre 4 : la baie du Miocène ---- */
  raie: {
    name: 'Raie', plural: 'raies', kind: 'prey', look: 'raie', color: '#B89A6A', buried: true,
    size: 40, speed: 300, sense: 320, adn: 18,
    fact: "Les raies se cachent sous le sable. Le requin-marteau les trouve avec son sens électrique, et les plaque au sol avec sa tête !",
  },
  dugong: {
    name: 'Dugong', plural: 'dugongs', kind: 'prey', look: 'dugong', color: '#A89A8A',
    size: 68, speed: 300, sense: 330, adn: 20,
    fact: "Le dugong est un mammifère marin qui broute l'herbe de la mer : on l'appelle la « vache de mer ». Certains marins l'auraient pris pour une sirène !",
  },
  thon: {
    name: 'Thon', plural: 'thons', kind: 'prey', look: 'poisson', color: '#5E7EA8',
    size: 34, speed: 430, sense: 360, adn: 9,
    fact: "Le thon est l'un des poissons les plus rapides : il peut nager à plus de 70 km/h !",
  },
  'jeune-megalodon': {
    name: 'Mégalodon', plural: 'mégalodons', kind: 'hunter', look: 'megalodon', color: '#6A7884', noEat: true, maxTurn: 1.1, roar: true,
    size: 215, speed: 470, sense: 500, cone: 2, adn: 0, hitLine: 'BONG !',
    fact: "Le mégalodon pouvait mesurer plus de 15 mètres, trois fois un grand requin blanc. Une seule de ses dents est plus grande que ta main !",
  },

  /* ---- Chapitre 5 : le duel des géants ---- */
  cetothere: {
    name: 'Cétothère', plural: 'cétothères', kind: 'prey', look: 'cetothere', color: '#6E7884',
    size: 160, speed: 480, sense: 620, adn: 40,
    eatLine: "Une baleine entière ! Tu es vraiment le plus grand requin de tous les temps.",
    fact: "Les cétothères étaient de petites baleines : le repas préféré du mégalodon. On a retrouvé leurs os avec des morsures géantes !",
  },
  'grand-thon': {
    name: 'Grand thon', plural: 'grands thons', kind: 'prey', look: 'poisson', color: '#5E7EA8', pack: 3,
    size: 60, speed: 640, sense: 520, adn: 8,
    fact: "Les grands thons traversent des océans entiers. Mais pour un mégalodon, c'est juste un petit encas.",
  },
  'requin-blanc-jeune': {
    name: 'Jeune requin blanc', plural: 'jeunes requins blancs', kind: 'neutral', look: 'requin-blanc', color: '#8A98A6', noEat: true,
    size: 90, speed: 500, sense: 0, adn: 0,
    fact: "Regarde-le bien : ce petit nouveau, c'est l'ancêtre du grand requin blanc. Il sera encore là quand le mégalodon aura disparu…",
  },
  livyatan: {
    name: 'Livyatan', plural: 'Livyatan', proper: true, kind: 'hunter', look: 'livyatan', color: '#4A4E5A', noEat: true, maxTurn: 0.95, roar: true, stomp: true,
    breachHit: true, hits: 4, hitLine: 'OUILLE !',
    size: 300, speed: 680, sense: 760, cone: 2.1, adn: 0,
    fact: "Livyatan était un cachalot géant de 17 mètres, avec les plus grosses dents de tous les animaux connus : 36 centimètres ! Même le mégalodon s'en méfiait.",
  },
};

/* Les évolutions : une ou deux par requin */
const evolutions = {
  nageoires: {
    name: 'Grandes nageoires', ch: 1, cost: 30, effect: { speed: 1.12 },
    short: 'Tu nages encore plus vite',
    fact: "Les nageoires du requin ne servent pas à avancer, mais à monter, descendre et tourner, comme les ailes d'un avion !",
  },
  lumiere: {
    name: 'Lumière puissante', ch: 1, cost: 60, effect: { power: 1.4 },
    short: 'Ton flash va beaucoup plus loin',
    fact: "Le requin-lanterne a de petites lumières sur le ventre. Vu d'en dessous, il se confond avec la lumière de la surface : c'est un camouflage !",
  },
  denticules: {
    name: 'Peau à denticules', ch: 2, cost: 90, effect: { speed: 1.2 },
    short: 'Ta peau glisse dans l’eau : tu vas plus vite',
    fact: "La peau d'un requin est couverte de minuscules dents ! Elles l'aident à glisser dans l'eau. Les ingénieurs les copient pour les avions.",
  },
  'fouet-geant': {
    name: 'Fouet géant', ch: 2, cost: 130, effect: { power: 1.4 },
    short: 'Ton coup de queue touche bien plus loin',
    fact: "La queue du requin-renard est aussi longue que tout le reste de son corps. Elle claque si vite qu'elle fait des bulles !",
  },
  'dents-rechange': {
    name: 'Dents de rechange', ch: 3, cost: 160, effect: { shield: 1 },
    short: 'Tu encaisses un coup : tes dents repoussent',
    fact: "Un requin perd des milliers de dents dans sa vie, et elles repoussent sans arrêt ! C'est pour ça qu'on en trouve tant de fossiles.",
  },
  'gros-estomac': {
    name: 'Estomac géant', ch: 3, cost: 220, effect: { power: 1.5 },
    short: 'Tu aspires de beaucoup plus loin',
    fact: "Quand il a avalé quelque chose de vraiment immangeable, le requin peut retourner son estomac et le ressortir par sa bouche pour le vider !",
  },
  'sens-electrique': {
    name: 'Sens électrique', ch: 4, cost: 200, effect: { power: 1.4, radar: true },
    short: 'Ton BONG révèle les raies de bien plus loin',
    fact: "Tous les êtres vivants produisent un peu d'électricité. Les requins la sentent, avec de petits points sur leur museau !",
  },
  'grand-marteau': {
    name: 'Grand marteau', ch: 4, cost: 280, effect: { speed: 1.15 },
    short: 'Ta tête te fait tourner et nager plus vite',
    fact: "La tête en marteau sert aussi d'aile : elle aide le requin à virer très vite, et ses yeux écartés voient presque tout autour de lui.",
  },
  'grand-saut': {
    name: 'Grand saut', ch: 5, cost: 350, effect: { power: 1.3, shield: 2 },
    short: 'Ta vague touche plus loin, et tu encaisses deux coups',
    fact: "Le grand requin blanc peut sauter complètement hors de l'eau pour attraper un phoque. Un mégalodon qui saute… ça aurait fait une sacrée vague !",
  },
};

/* L'histoire, en cinq requins */
const chapters = [
  {
    title: 'Après la météorite',
    ago: [66, 62],
    form: 'requin-lanterne',
    skin: { body: '#3F6C7E', belly: '#BFEFEA', dark: '#16323E' },
    size: [24, 24],
    vision: 0.9,
    fog: 0.86,
    palette: { water: ['#123044', '#040E18'], floor: '#3C4A50', light: '#9EFFEF' },
    species: { crevette: 16, 'petit-poisson': 12, meduse: 3, dyrosaure: 4 },
    unlock: ['nageoires', 'lumiere'],
    power: {
      type: 'flash', name: 'Flash', icon: '✨', recharge: 4, range: 480,
      intro: "Ton pouvoir : le FLASH ! Appuie sur F ou sur le bouton orange : tu éclaires la mer, les chasseurs sont éblouis 2 secondes… et les proies accourent vers ta lumière !",
    },
    intro: "La météorite a tout détruit : la mer est noire et glacée. Tu es un requin-lanterne, tout petit… mais tu brilles dans le noir ! Les mosasaures ont disparu, mais les dyrosaures, de grands crocodiles marins, rôdent encore.",
    missions: [
      { type: 'eat', species: 'crevette', n: 15, text: 'Attire et croque 15 crevettes' },
      { type: 'evolve', part: 'nageoires' },
      { type: 'stun', species: 'dyrosaure', n: 4, text: 'Éblouis 4 dyrosaures' },
      { type: 'eat', species: 'petit-poisson', n: 8 },
    ],
    tips: [
      "Il fait trop noir ? Utilise ton flash ✨ : il éclaire tout, et les crevettes arrivent toutes seules !",
      "Mange vite plusieurs fois de suite : c'est un COMBO, et ça rapporte plus d'ADN !",
      "Les dyrosaures tournent moins vite que toi : au dernier moment, vire !",
    ],
  },
  {
    title: "La mer chaude de l'Éocène",
    ago: [50, 46],
    form: 'requin-renard',
    skin: { body: '#5E6EB8', belly: '#F4F6FA', dark: '#232C5E' },
    size: [48, 48],
    vision: 1.4,
    fog: 0.3,
    palette: { water: ['#27B0C0', '#0E6A84'], floor: '#C2B47E', light: '#EFFFF4' },
    species: { sardine: 30, manchot: 6, tortue: 2, ambulocete: 3, otodus: 2 },
    unlock: ['denticules', 'fouet-geant'],
    power: {
      type: 'whip', name: 'Coup de fouet', icon: '🌀', recharge: 3, range: 360,
      intro: "Ton pouvoir : le COUP DE FOUET ! Ta queue est aussi longue que ton corps. Appuie sur F au milieu d'un banc : toutes les sardines sont assommées… à table !",
    },
    intro: "Des millions d'années plus tard, il fait chaud partout. Tu es un requin-renard, avec une queue immense ! La mer est pleine de sardines et de manchots géants… et d'Otodus, un énorme requin.",
    missions: [
      { type: 'eat', species: 'sardine', n: 30, text: 'Assomme et gobe 30 sardines' },
      { type: 'evolve', part: 'denticules' },
      { type: 'eat', species: 'manchot', n: 4, text: 'Attrape 4 manchots géants' },
      { type: 'stun', species: 'otodus', n: 3, text: 'Fouette 3 Otodus' },
    ],
    tips: [
      "Fonce dans un banc de sardines, donne un coup de fouet 🌀, puis gobe-les toutes : quel combo !",
      "Les manchots vont très vite. Fouette-les quand ils passent tout près !",
      "Otodus te chasse ? Vire au dernier moment, il ne tourne pas vite. Et un coup de fouet sur le nez !",
    ],
  },
  {
    title: 'Les premières baleines',
    ago: [38, 34],
    form: 'requin-tigre',
    skin: { body: '#8E8A5E', belly: '#F2EEDC', dark: '#3E3A20', stripe: '#4E4A28' },
    size: [80, 80],
    vision: 1.5,
    fog: 0.3,
    palette: { water: ['#1E8CA8', '#0A4A68'], floor: '#8E9A84', light: '#E6FFF6' },
    species: { bazar: 16, tortue: 7, calmar: 8, dorudon: 4, meduse: 2, basilosaure: 2 },
    unlock: ['dents-rechange', 'gros-estomac'],
    power: {
      type: 'gulp', name: 'Aspirateur', icon: '😋', recharge: 5, range: 380,
      intro: "Ton pouvoir : l'ASPIRATEUR ! Tu es un requin-tigre, tu avales tout. Appuie sur F : tout ce qui est autour de toi arrive dans ta bouche. Attention au rot…",
    },
    intro: "Tu es un requin-tigre, la poubelle des mers : tu manges vraiment n'importe quoi ! Mais un monstre vient d'arriver : Basilosaurus, une baleine-serpent de 18 mètres. Tu ne peux pas la croquer… mais tu peux la faire enrager en lui mordant la queue !",
    missions: [
      { type: 'eat', species: 'bazar', n: 12, text: 'Avale 12 trucs pas mangeables' },
      { type: 'evolve', part: 'dents-rechange' },
      { type: 'eat', species: 'tortue', n: 5 },
      { type: 'hit', species: 'basilosaure', n: 3, text: 'Mords 3 fois la queue de Basilosaurus' },
    ],
    tips: [
      "Aspire tout d'un coup, et gobe tout : ça fait de sacrés combos… et un beau rot !",
      "Basilosaurus est long comme un serpent. Reste loin de sa tête, et file mordre le bout de sa queue !",
      "Il te poursuit ? Il tourne très lentement : passe derrière lui !",
    ],
  },
  {
    title: 'La baie du Miocène',
    ago: [15, 12],
    form: 'requin-marteau',
    skin: { body: '#7E96A2', belly: '#EEF2F2', dark: '#2E444E' },
    size: [90, 90],
    vision: 1.5,
    fog: 0.28,
    palette: { water: ['#30A8B0', '#12707C'], floor: '#D8C48E', light: '#F4FFEF' },
    species: { raie: 14, dugong: 6, thon: 8, 'jeune-megalodon': 2 },
    unlock: ['sens-electrique', 'grand-marteau'],
    power: {
      type: 'hammer', name: 'BONG !', icon: '🔨', recharge: 3, range: 620,
      intro: "Ton pouvoir : le BONG ! Ta tête en marteau sent l'électricité : appuie sur F, et les raies cachées dans le sable sortent toutes. Et tout près de toi, c'est un grand coup de tête !",
    },
    intro: "Tu es un requin-marteau ! Les raies se cachent sous le sable : regarde bien, on voit à peine deux petites bosses… Mais attention : le mégalodon, le plus grand requin de tous les temps, patrouille dans la baie.",
    missions: [
      { type: 'eat', species: 'raie', n: 10, text: 'Trouve et croque 10 raies cachées' },
      { type: 'evolve', part: 'sens-electrique' },
      { type: 'eat', species: 'dugong', n: 4 },
      { type: 'stun', species: 'jeune-megalodon', n: 2, text: 'BONG ! Sur le nez de 2 mégalodons !' },
    ],
    tips: [
      "Fais BONG 🔨 partout où tu passes : les raies sortent du sable, encore tout étourdies !",
      "Un mégalodon ? Il est énorme, mais il tourne très lentement. Vire au dernier moment !",
      "Pour un coup de marteau sur le nez, il faut être très près… Courage !",
    ],
  },
  {
    title: 'Le duel des géants',
    ago: [10, 9],
    form: 'megalodon',
    skin: { body: '#5E7484', belly: '#E6ECEC', dark: '#1E323E' },
    size: [220, 220],
    vision: 1.25,
    fog: 0.42,
    palette: { water: ['#14648E', '#052A48'], floor: '#556878', light: '#D8ECFF' },
    species: { cetothere: 6, 'grand-thon': 12, 'requin-blanc-jeune': 2, livyatan: 1 },
    unlock: ['grand-saut'],
    power: {
      type: 'breach', name: 'Saut géant', icon: '🌊', recharge: 5, range: 620,
      intro: "Ton pouvoir : le SAUT GÉANT ! Appuie sur F : tu jaillis hors de l'eau, plus rien ne peut te toucher… et tu retombes dans une vague énorme qui assomme tout autour de toi !",
    },
    intro: "Tu es devenu le MÉGALODON, le plus grand requin de tous les temps ! Mais un seul monstre ose te défier : Livyatan, le cachalot géant, aux dents de 36 centimètres. Tu ne peux pas le mordre de face… Saute, et retombe-lui dessus !",
    missions: [
      { type: 'eat', species: 'cetothere', n: 5 },
      { type: 'evolve', part: 'grand-saut' },
      { type: 'eat', species: 'grand-thon', n: 12, text: 'Avale 12 grands thons en passant' },
      { type: 'hit', species: 'livyatan', n: 4, text: 'Retombe 4 fois sur Livyatan' },
    ],
    tips: [
      "Vise bien : quand tu sautes, tu voles tout droit. Il faut retomber tout près de Livyatan !",
      "Pendant le saut, Livyatan ne peut pas te toucher. C'est aussi une très bonne façon de fuir !",
      "Le petit requin blanc ? Laisse-le tranquille. Il va faire parler de lui…",
    ],
  },
];

/* Ce que dit Ammo, ton guide, dans ce niveau */
const lines = {
  start: "Bloub ! Bonne nouvelle : tu as des branchies, plus besoin de remonter respirer ! Il fait tout noir… Appuie sur le bouton ✨ Flash pour t'allumer !",
};

/* La fin : le mégalodon disparaît, mais ses cousins sont toujours là */
const ending = {
  scene: 'requins',
  crowd: ['cetothere', 'cetothere', 'dugong', 'cetothere'],
  title: "Plus vieux que les arbres",
  sub: "Il y a 3,6 millions d'années, la mer s'est refroidie, les baleines sont parties vers les pôles, et le mégalodon a disparu. Mais les requins, eux, sont toujours là, depuis plus de 400 millions d'années. Aujourd'hui, ce sont eux qui ont besoin d'être protégés !",
  done: "Tu as régné sur les mers avec le mégalodon",
  captions: [
    [0.4, 4.4, "Livyatan est vaincu : tu es le roi de tous les océans !"],
    [4.7, 8.6, "Mais la mer se refroidit. Les baleines partent vers les pôles… et le mégalodon finit par disparaître."],
    [9.4, 13.8, "Tes cousins, eux, sont toujours là aujourd'hui : plus de 500 espèces de requins nagent dans nos océans !"],
  ],
  choices: [
    {
      id: 'aujourdhui', icon: '🦈', title: "Les requins d'aujourd'hui",
      text: "Requin-baleine, requin blanc, requin-lanterne : plonge dans les océans d'aujourd'hui, et aide-les à survivre !",
      level: 'requins-aujourdhui',
      soon: "Niveau 4 : Les requins d'aujourd'hui",
      fact: "Les humains ne sont pas la proie des requins : c'est l'inverse ! Chaque année, des dizaines de millions de requins sont pêchés.",
    },
  ],
};

export default {
  id: 'voie-des-requins',
  name: 'La voie des requins',
  num: 3,
  icon: '🦈',
  intro: 'requins',
  goal: "Les monstres marins ont disparu : la mer est à toi ! <b>À chaque époque, tu deviens un autre requin, avec son pouvoir rigolo</b> :<br>✨ le requin-lanterne → 🌀 le requin-renard → 😋 le requin-tigre → 🔨 le requin-marteau → 👑 le mégalodon !",
  world,
  species,
  evolutions,
  chapters,
  lines,
  ending,
};
