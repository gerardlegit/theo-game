// ============================================================================
// NIVEAU 1 — LE SYSTÈME SOLAIRE
//
// Tout ce qui fait ce niveau est ici : les astres, les ressources, les
// habitants, l'histoire (4 chantiers puis le portail), le danger des OVNI et
// l'étoile où mène le portail. Le moteur du jeu (script.js) ne connaît aucune
// planète par son nom. Pour créer un niveau : voir levels/index.js.
// ============================================================================

/* Les astres : pas à l'échelle, mais dans le bon ordre.
   Sans "paint", un astre utilise le dessin de Mission Cosmos qui a le même id
   (voir planets.js pour peindre des planètes inventées). */
const system = {
  worldR: 4200,                      // rayon de la carte
  safeR: 1300,                       // zone calme autour de l'étoile : jamais d'OVNI
  star: { id: 'soleil', r: 130, burn: 180 },
  year: { dist: 380, period: 110 },  // la 1re planète fait le tour en 110 s, les autres suivent la loi de Kepler
  planets: [
    { id: 'mercure', r: 26, dist: 380 },
    { id: 'venus', r: 38, dist: 540 },
    { id: 'terre', r: 46, dist: 830 },
    { id: 'mars', r: 34, dist: 1140 },
    { id: 'jupiter', r: 100, dist: 1800 },
    { id: 'saturne', r: 96, dist: 2260, ringed: true },
    { id: 'uranus', r: 60, dist: 2690 },
    { id: 'neptune', r: 58, dist: 3050 },
    { id: 'pluton', r: 26, dist: 3370 },
  ],
  moons: [
    { id: 'iss', parent: 'terre', r: 28, dist: 120, period: 28 },
    { id: 'satellite', parent: 'terre', r: 22, dist: 185, period: 36, phase: Math.PI },
    { id: 'lune', parent: 'terre', r: 22, dist: 255, period: 46 },
    { id: 'rover', parent: 'mars', r: 26, dist: 98, period: 40 },
    { id: 'io', parent: 'jupiter', r: 19, dist: 185, period: 22 },
    { id: 'europe', parent: 'jupiter', r: 17, dist: 248, period: 34 },
    { id: 'titan', parent: 'saturne', r: 22, dist: 245, period: 44 },
    { id: 'triton', parent: 'neptune', r: 20, dist: 150, period: 38, name: 'Triton', kind: 'lune de Neptune' },
  ],
  belt: { inner: 1340, outer: 1530, count: 95, name: "Ceinture d'astéroïdes" },
  far: [
    { id: 'nebuleuse', x: 2800, y: -2300, r: 210, cloud: true, mineRange: 250 },
    { id: 'galaxie', x: -3100, y: -1850, r: 180, cloud: true },
    { id: 'trounoir', x: -2550, y: 2550, r: 80, blackHole: true },
  ],
  wormholes: [{ x: -1540, y: -560 }, { x: -450, y: -3600 }],
  // le décor qui bouge (motion : l2, spacewalk, rocket, drift, comet)
  extras: [
    { id: 'telescope', r: 34, motion: 'l2', of: 'terre', dist: 350 },
    { id: 'astronaute', r: 22, motion: 'spacewalk', of: 'iss', dist: 85, after: 'iss' },
    { id: 'fusee', r: 30, motion: 'rocket', dist: 690, period: 55 },
    { id: 'chaussette', r: 24, motion: 'drift', x: 330, y: 320 },
    { id: 'comete', r: 40, motion: 'comet', a: 1950, e: 0.78, period: 150 },
  ],
  // Bip fait une remarque quand on passe près de…
  ambient: [{ near: 'uranus', r: 280, say: "Pouah ! Ça sent l'œuf pourri par ici… c'est Uranus !", puff: '#A6E86A' }],
  start: 'terre',                    // la fusée décolle de là
  colors: {                          // couleurs sur la mini-carte
    soleil: '#FFC93C', mercure: '#B8ADA2', venus: '#EBC989', terre: '#4FA8F0', lune: '#DADAD6',
    mars: '#E0703A', jupiter: '#D9B48A', saturne: '#E8CF95', uranus: '#97E1E7', neptune: '#5A84F0',
    pluton: '#D8BFA4', comete: '#BFEFFF', galaxie: '#B9A8FF', nebuleuse: '#FF7FC8',
    trounoir: '#FF8A3C', satellite: '#F2C14E', iss: '#E8B254', astronaute: '#FFFFFF', rover: '#F2F4F8',
    telescope: '#F2BE3A', fusee: '#FF6F91', chaussette: '#FF6F91', io: '#EBCB52',
    europe: '#EDE3D2', titan: '#E8A23F', triton: '#E9C9C4',
  },
};

/* Les ressources rares. "source" = l'astre où on les trouve ;
   "ch" = à partir de quel chapitre les habitants peuvent en commander. */
const resources = {
  fer: {
    name: 'Fer', icon: '🔩', source: 'mercure', color: '#C9C2B8', ch: 1,
    fact: "Le cœur de Mercure est une énorme boule de fer : il prend presque toute la place dans la planète !",
  },
  lune: {
    name: 'Poussière de Lune', icon: '🌑', source: 'lune', color: '#C9C9C4', ch: 1,
    fact: "La poussière de Lune s'appelle le régolithe. Elle colle partout : les astronautes en avaient plein leurs combinaisons !",
  },
  sable: {
    name: 'Sable rouge', icon: '🏜️', source: 'mars', color: '#E0703A', ch: 1,
    fact: "Le sable de Mars est rouge parce qu'il contient de la rouille : du fer qui a rouillé il y a très, très longtemps !",
  },
  comete: {
    name: 'Poussière de comète', icon: '☄️', source: 'comete', place: 'la comète', color: '#BFEFFF', ch: 1,
    fact: "Une comète est une boule de glace et de poussière vieille de 4,6 milliards d'années. Elle ne reste jamais au même endroit : il faut la rattraper !",
  },
  soufre: {
    name: 'Soufre', icon: '🌋', source: 'io', color: '#EBCB52', ch: 1,
    fact: "Les volcans d'Io crachent du soufre jaune et orange : c'est pour ça qu'elle ressemble à une pizza !",
  },
  eau: {
    name: 'Eau salée', icon: '💧', source: 'europe', color: '#7FD3FF', ch: 1,
    fact: "Sous la glace d'Europe se cache un immense océan d'eau salée. Il y a peut-être de la vie dedans !",
  },
  methane: {
    name: 'Méthane liquide', icon: '🛢️', source: 'titan', color: '#E8A23F', ch: 2,
    fact: "Sur Titan, il y a des lacs et des rivières… mais ils sont remplis de méthane liquide, pas d'eau !",
  },
  puant: {
    name: 'Gaz qui pue', icon: '💨', source: 'uranus', color: '#A6E86A', ch: 2,
    fact: "Les nuages d'Uranus contiennent du sulfure d'hydrogène : un gaz qui sent l'œuf pourri. Pouah !",
  },
  diamant: {
    name: 'Diamants', icon: '💎', source: 'neptune', color: '#8FB4FF', ch: 3,
    fact: "Au cœur de Neptune, la pression est si forte qu'il pleut peut-être des diamants !",
  },
  azote: {
    name: "Glace d'azote", icon: '❄️', source: 'pluton', color: '#F4E9DC', ch: 3,
    fact: "Le grand cœur blanc de Pluton est un glacier de glace d'azote, à -230 °C !",
  },
  etoile: {
    name: "Poussière d'étoile", icon: '✨', source: 'nebuleuse', place: 'la Nébuleuse', color: '#FF9AD8', ch: 3,
    fact: "Une nébuleuse est un nuage géant de gaz et de poussière : c'est là que naissent les étoiles.",
  },
};

/* Les habitants qui proposent des quêtes (les « ! »). "home" = l'astre au-dessus duquel ils vivent. */
const characters = [
  {
    id: 'lila', name: 'Capitaine Lila', home: 'iss', where: 'la Station spatiale',
    likes: ['fer', 'eau', 'methane', 'comete', 'lune'],
    reasons: [
      "Les réservoirs de la Station spatiale sont presque vides !",
      "Il faut réparer un panneau solaire, vite !",
      "J'organise une expérience scientifique en apesanteur.",
    ],
    thanks: "Merci, livreur ! La Station spatiale est sauvée !",
  },
  {
    id: 'mamie', name: 'Mamie Lune', home: 'lune', where: 'la Lune',
    likes: ['fer', 'eau', 'azote', 'comete', 'etoile', 'lune'],
    reasons: [
      "Je prépare un gâteau pour mon anniversaire : 4 milliards et demi d'années !",
      "Mes confitures de cratère ont besoin d'ingrédients spéciaux.",
      "Je tricote un pull pour la Terre, il me manque des fournitures.",
    ],
    thanks: "Oh, merci mon petit ! Tiens, prends quelques pièces pour toi.",
  },
  {
    id: 'martin', name: 'Martin le Martien', home: 'mars', where: 'Mars',
    likes: ['fer', 'eau', 'soufre', 'methane', 'sable'],
    reasons: [
      "Mon potager martien a besoin d'ingrédients… bizarres !",
      "Mon robot à six roues est tombé en panne.",
      "Je construis une piscine sur Mars !",
    ],
    thanks: "Glouglou ! Ça veut dire « merci » en martien !",
  },
  {
    id: 'zinzin', name: 'Professeur Zinzin', home: 'venus', where: 'Vénus',
    likes: ['fer', 'soufre', 'puant', 'diamant', 'azote', 'etoile', 'sable'],
    reasons: [
      "Mon expérience va faire BOUM… enfin, j'espère que non !",
      "J'invente une machine à fabriquer des arcs-en-ciel.",
      "Pour ma potion géniale, il me faut des ingrédients rarissimes !",
    ],
    thanks: "Eurêka ! Mon expérience va pouvoir commencer !",
  },
  {
    id: 'gloubi', name: 'Général Gloubi', home: 'jupiter', where: 'Jupiter',
    likes: ['fer', 'soufre', 'diamant', 'azote', 'etoile', 'lune'],
    reasons: [
      "Mes soldats-robots ont besoin de pièces neuves.",
      "Je fabrique la plus grande médaille de l'Univers !",
      "Mission top secrète. Ne pose pas de questions, soldat !",
    ],
    thanks: "Garde-à-vous ! Mission accomplie, soldat !",
  },
  {
    id: 'reine', name: 'Reine des Anneaux', home: 'saturne', where: 'Saturne',
    likes: ['eau', 'diamant', 'puant', 'comete', 'etoile', 'sable'],
    reasons: [
      "Ma couronne a perdu ses brillants !",
      "Je veux faire une farce au Roi Neptune, hi hi !",
      "Je prépare le grand bal des anneaux.",
    ],
    thanks: "Splendide ! Tu es le livreur préféré de la Reine !",
  },
];

/* L'histoire : 4 chantiers de 5 missions, puis le portail.
   - host     : l'astre où l'on construit (le chef s'y tient)
   - building : le type de bâtiment (voir buildings.js)
   - shop     : le magasin qui ouvre quand le bâtiment est fini
   - customers: les habitants qui proposent ensuite des quêtes */
const chapters = [
  {
    id: 'iss', title: 'La Station spatiale', chef: 'lila', host: 'iss', building: 'body', site: '🏗️ Chantier de la Station',
    intro: "Bienvenue, livreur ! Ensemble, on va construire la Station spatiale internationale, juste au-dessus de la Terre. J'ai besoin de toi pour 5 livraisons.",
    built: 'La Station spatiale est construite !',
    fact: "La vraie Station spatiale a été assemblée dans l'espace, morceau par morceau, à partir de 1998. Elle est grande comme un terrain de foot !",
    unlocks: [
      "💥 L'Armurerie du Colonel Boum ouvre ses portes.",
      '📦 Capitaine Lila et le Professeur Zinzin te proposeront des livraisons (les « ! ») qui rapportent de l\'or.',
      "⚠️ Attention : les OVNI s'agitent au-delà de la ceinture d'astéroïdes !",
    ],
    shop: 'boum', customers: ['lila', 'zinzin'],
    missions: [
      { title: 'Le squelette de la station', needs: { fer: 2 }, reward: 40, say: "Il me faut du fer pour la charpente. Mercure, la planète toute proche du Soleil, en est pleine !" },
      { title: 'Les panneaux solaires', needs: { sable: 2, fer: 1 }, reward: 50, say: "Les panneaux solaires sont faits de silicium… et le silicium, on le fabrique avec du sable ! Le sable rouge de Mars fera l'affaire." },
      { title: 'Le bouclier', needs: { lune: 3 }, reward: 60, say: "La poussière de Lune peut protéger les astronautes des rayons du Soleil. Rapporte-m'en 3 caisses !" },
      { title: 'Le laboratoire', needs: { fer: 2, lune: 2 }, reward: 70, say: "Un laboratoire pour faire des expériences en apesanteur ! Il faut du fer et de la poussière de Lune." },
      { title: "L'eau des astronautes", needs: { comete: 2, sable: 1 }, reward: 80, say: "Les comètes sont faites de glace : de l'eau à boire ! Attention, la comète bouge tout le temps, il faut la rattraper." },
    ],
  },
  {
    id: 'lune', title: 'La base lunaire', chef: 'mamie', host: 'lune', building: 'domes',
    intro: "Coucou mon petit ! Je me sens bien seule sur ma Lune. Et si tu construisais une base pour que des astronautes viennent habiter chez moi ?",
    built: 'La base lunaire est construite !',
    fact: "Avec le programme Artemis, des astronautes doivent bientôt retourner sur la Lune… et peut-être y construire une vraie base !",
    unlocks: [
      '🔧 Le Garage de Gus ouvre : soute plus grande, moteur plus rapide…',
      '📦 Nouveaux clients : Mamie Lune et le Général Gloubi.',
    ],
    shop: 'gus', customers: ['mamie', 'gloubi'],
    missions: [
      { title: 'Les fondations', needs: { lune: 3, fer: 1 }, reward: 90, say: "On commence par les fondations : de la poussière de Lune bien tassée, et un peu de fer." },
      { title: "L'eau de la base", needs: { eau: 3 }, reward: 110, say: "Il faut de l'eau ! Il y en a sous la glace d'Europe, une lune de Jupiter. Mais attention aux OVNI, là-bas…" },
      { title: 'Les dômes', needs: { sable: 2, fer: 2 }, reward: 120, say: "Avec du sable, on fabrique du verre. Je veux des dômes transparents pour regarder les étoiles !" },
      { title: 'Les batteries', needs: { soufre: 3, fer: 1 }, reward: 140, say: "Sur la Lune, la nuit dure 14 jours ! Il faut de grosses batteries… au soufre des volcans d'Io." },
      { title: 'La serre', needs: { eau: 2, comete: 2, lune: 1 }, reward: 160, say: "Pour finir, une serre pour faire pousser des légumes. Les astronautes adorent la salade !" },
    ],
  },
  {
    id: 'mars', title: 'La base martienne', chef: 'martin', host: 'mars', building: 'colonie',
    intro: "Glouglou ! Des voisins humains sur Mars ? Super ! Construisons ensemble la toute première base martienne.",
    built: 'La première base sur Mars est construite !',
    fact: "Aucun humain n'est encore allé sur Mars : le voyage dure environ 7 mois ! Pour l'instant, ce sont des robots qui l'explorent.",
    unlocks: [
      "🎨 L'Atelier de Stella ouvre : peins et décore ta fusée !",
      '📦 Nouveaux clients : Martin le Martien et la Reine des Anneaux.',
    ],
    shop: 'stella', customers: ['martin', 'reine'],
    missions: [
      { title: 'Les habitats', needs: { sable: 3, fer: 2 }, reward: 160, say: "D'abord, des maisons solides contre les tempêtes de poussière !" },
      { title: 'Le carburant du retour', needs: { methane: 3 }, reward: 180, say: "Les fusées peuvent voler au méthane. Il y en a des lacs entiers sur Titan, la grande lune de Saturne !" },
      { title: "L'usine à oxygène", needs: { eau: 4, fer: 2 }, reward: 200, say: "En cassant l'eau en morceaux, on fabrique de l'oxygène pour respirer. Il me faut beaucoup d'eau !" },
      { title: 'Le potager martien', needs: { puant: 2, eau: 2, sable: 2 }, reward: 220, say: "Mes plantes adorent le gaz qui pue d'Uranus (beurk !). Avec de l'eau et du sable, mon potager sera parfait." },
      { title: 'La grande antenne', needs: { soufre: 2, methane: 2, fer: 2 }, reward: 250, say: "Une antenne pour parler avec la Terre : un message met jusqu'à 20 minutes pour arriver !" },
    ],
  },
  {
    id: 'triton', title: 'La station de Triton', chef: 'nova', host: 'triton', building: 'tour',
    intro: "Bonjour, je suis l'ingénieure Nova ! Mon rêve : un portail vers une autre étoile. Mais d'abord, il me faut une station tout au bout du système solaire, sur Triton, la grande lune de Neptune.",
    built: 'La station de Triton est construite !',
    fact: "Triton tourne autour de Neptune « à l'envers », et des geysers y crachent de l'azote glacé !",
    unlocks: [
      '🌀 Le Chantier du Portail ouvre, au bord du système solaire.',
      "📦 Tous les habitants te proposent des livraisons : gagne de l'or pour le portail !",
    ],
    shop: 'nova', customers: [],
    missions: [
      { title: "L'ancrage dans la glace", needs: { azote: 3, fer: 2 }, reward: 250, say: "Triton est couverte de glace d'azote, comme Pluton. Il en faut pour sceller les fondations !" },
      { title: 'Les fenêtres en diamant', needs: { diamant: 3, sable: 2 }, reward: 280, say: "Le diamant est transparent et très solide : parfait pour les fenêtres ! Il en pleut peut-être dans Neptune." },
      { title: 'Le carburant', needs: { methane: 3, comete: 2 }, reward: 300, say: "La station a besoin de carburant : du méthane de Titan et de la glace de comète." },
      { title: 'Le grand radar', needs: { diamant: 2, soufre: 2, fer: 2 }, reward: 330, say: "Un radar géant pour surveiller les OVNI… et pour viser l'autre étoile !" },
      { title: "Le cœur d'énergie", needs: { etoile: 3, azote: 2, eau: 2 }, reward: 380, say: "La dernière pièce : de la poussière d'étoile, là où naissent les étoiles. Courage, c'est loin et dangereux !" },
    ],
  },
  {
    id: 'portail', title: 'Le portail vers Proxima du Centaure', chef: 'nova', host: null,
    intro: "Grâce à ta station, on peut enfin construire le portail ! Gagne de l'or avec les livraisons des habitants, puis achète les pièces sur mon chantier, au bord du système solaire.",
    missions: [],
  },
];

/* Où sont les magasins (angle en radians, distance à l'étoile) */
const shops = {
  gus: { angle: 2.55, dist: 990 },
  stella: { angle: -0.55, dist: 990 },
  boum: { angle: 0.95, dist: 1240 },
  nova: { angle: 0.35, dist: 3800 },
};

/* Le danger des OVNI, chapitre après chapitre (n = combien, sight = jusqu'où ils voient,
   fire = secondes entre deux tirs, speed/turn = vitesse et virage des missiles) */
const danger = [
  { n: 0 },
  { n: 3, sight: 560, fire: [3.6, 4.6], speed: 270, turn: 1.4 },
  { n: 4, sight: 620, fire: [3.0, 4.0], speed: 300, turn: 1.55 },
  { n: 6, sight: 680, fire: [2.6, 3.4], speed: 330, turn: 1.7 },
  { n: 8, sight: 720, fire: [2.2, 3.0], speed: 360, turn: 1.85 },
];

export default {
  id: 'systeme-solaire',
  name: 'Le système solaire',
  // ce que dit l'écran de départ
  goal: "Livre des <b>ressources rares</b> pour conquérir l'espace, étape par étape :<br>🛰️ la Station spatiale → 🌙 une base sur la Lune → 🔴 une base sur Mars → ❄️ une station sur Triton → 🌀 un portail vers une autre étoile !",
  lines: {
    start: "Bip bip ! Je suis Bip, ton copilote. Capitaine Lila nous attend juste au-dessus de la Terre, sur le chantier de la Station spatiale !",
    ufoAwake: "Attention chef : les OVNI se réveillent au-delà de la ceinture d'astéroïdes ! Près du Soleil, on est à l'abri.",
  },
  launch: true,                      // ce niveau commence par le décollage depuis la Terre
  system,
  resources,
  characters,
  chapters,
  shops,
  danger,
  // l'étoile où mène le portail (l'animation de fin)
  destination: {
    name: 'Proxima du Centaure',
    title: '✨ Bienvenue à Proxima du Centaure ! ✨',
    text: "Ton portail t'a emmené jusqu'à l'étoile la plus proche du Soleil : une petite étoile rouge, si loin que sa lumière met plus de 4 ans pour arriver jusqu'à la Terre !",
    star: { colors: ['#FFE2B8', '#FF8A3C', '#C2261E'], corona: '255,110,60' },
    planet: { name: 'Proxima b', colors: ['#E8A07A', '#A4583C', '#4A2420'] },
    companions: 'Alpha du Centaure A et B',
    sky: ['#120A2E', '#3A1230'],
    soon: 'le <b>niveau 2</b>, autour de Proxima du Centaure',
  },
};
