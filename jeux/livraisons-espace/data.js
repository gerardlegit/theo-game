// ============================================================================
// LIVRAISONS DANS L'ESPACE — les données du jeu.
//
//  - RESOURCES  : les ressources rares, et l'astre inhabité où on les trouve
//  - CHARACTERS : les habitants qui proposent des quêtes (et ce qu'ils aiment demander)
//  - SHOPS      : les trois marchands et ce qu'ils vendent
//  - PAINTS / ACCESSORIES : les styles de fusée de l'atelier de Stella
//  - LINES      : ce que dit Bip, le copilote
// ============================================================================

/* "source" = id d'un astre de Mission Cosmos (son dessin vient de ../espace/art.js) */
export const RESOURCES = {
  fer: {
    name: 'Fer', icon: '🔩', source: 'mercure', color: '#C9C2B8',
    fact: "Le cœur de Mercure est une énorme boule de fer : il prend presque toute la place dans la planète !",
  },
  comete: {
    name: 'Poussière de comète', icon: '☄️', source: 'comete', place: 'la comète', color: '#BFEFFF',
    fact: "Une comète est une boule de glace et de poussière vieille de 4,6 milliards d'années. Elle ne reste jamais au même endroit : il faut la rattraper !",
  },
  soufre: {
    name: 'Soufre', icon: '🌋', source: 'io', color: '#EBCB52',
    fact: "Les volcans d'Io crachent du soufre jaune et orange : c'est pour ça qu'elle ressemble à une pizza !",
  },
  eau: {
    name: 'Eau salée', icon: '💧', source: 'europe', color: '#7FD3FF',
    fact: "Sous la glace d'Europe se cache un immense océan d'eau salée. Il y a peut-être de la vie dedans !",
  },
  methane: {
    name: 'Méthane liquide', icon: '🛢️', source: 'titan', color: '#E8A23F',
    fact: "Sur Titan, il y a des lacs et des rivières… mais ils sont remplis de méthane liquide, pas d'eau !",
  },
  puant: {
    name: 'Gaz qui pue', icon: '💨', source: 'uranus', color: '#A6E86A',
    fact: "Les nuages d'Uranus contiennent du sulfure d'hydrogène : un gaz qui sent l'œuf pourri. Pouah !",
  },
  diamant: {
    name: 'Diamants', icon: '💎', source: 'neptune', color: '#8FB4FF',
    fact: "Au cœur de Neptune, la pression est si forte qu'il pleut peut-être des diamants !",
  },
  azote: {
    name: "Glace d'azote", icon: '❄️', source: 'pluton', color: '#F4E9DC',
    fact: "Le grand cœur blanc de Pluton est un glacier de glace d'azote, à -230 °C !",
  },
  etoile: {
    name: "Poussière d'étoile", icon: '✨', source: 'nebuleuse', place: 'la Nébuleuse', color: '#FF9AD8',
    fact: "Une nébuleuse est un nuage géant de gaz et de poussière : c'est là que naissent les étoiles.",
  },
};
export const RESOURCE_IDS = Object.keys(RESOURCES);

/* Les habitants. "home" = l'astre au-dessus duquel ils vivent. */
export const CHARACTERS = [
  {
    id: 'lila', name: 'Capitaine Lila', home: 'iss', where: 'la Station spatiale',
    likes: ['fer', 'eau', 'methane', 'comete'],
    reasons: [
      "Les réservoirs de la Station spatiale sont presque vides !",
      "Il faut réparer un panneau solaire, vite !",
      "J'organise une expérience scientifique en apesanteur.",
    ],
    thanks: "Merci, livreur ! La Station spatiale est sauvée !",
  },
  {
    id: 'mamie', name: 'Mamie Lune', home: 'lune', where: 'la Lune',
    likes: ['fer', 'eau', 'azote', 'comete', 'etoile'],
    reasons: [
      "Je prépare un gâteau pour mon anniversaire : 4 milliards et demi d'années !",
      "Mes confitures de cratère ont besoin d'ingrédients spéciaux.",
      "Je tricote un pull pour la Terre, il me manque des fournitures.",
    ],
    thanks: "Oh, merci mon petit ! Tiens, prends quelques pièces pour toi.",
  },
  {
    id: 'martin', name: 'Martin le Martien', home: 'mars', where: 'Mars',
    likes: ['fer', 'eau', 'soufre', 'methane'],
    reasons: [
      "Mon potager martien a besoin d'ingrédients… bizarres !",
      "Mon robot à six roues est tombé en panne.",
      "Je construis une piscine sur Mars !",
    ],
    thanks: "Glouglou ! Ça veut dire « merci » en martien !",
  },
  {
    id: 'zinzin', name: 'Professeur Zinzin', home: 'venus', where: 'Vénus',
    likes: ['fer', 'soufre', 'puant', 'diamant', 'azote', 'etoile'],
    reasons: [
      "Mon expérience va faire BOUM… enfin, j'espère que non !",
      "J'invente une machine à fabriquer des arcs-en-ciel.",
      "Pour ma potion géniale, il me faut des ingrédients rarissimes !",
    ],
    thanks: "Eurêka ! Mon expérience va pouvoir commencer !",
  },
  {
    id: 'gloubi', name: 'Général Gloubi', home: 'jupiter', where: 'Jupiter',
    likes: ['fer', 'soufre', 'diamant', 'azote', 'etoile'],
    reasons: [
      "Mes soldats-robots ont besoin de pièces neuves.",
      "Je fabrique la plus grande médaille de l'Univers !",
      "Mission top secrète. Ne pose pas de questions, soldat !",
    ],
    thanks: "Garde-à-vous ! Mission accomplie, soldat !",
  },
  {
    id: 'reine', name: 'Reine des Anneaux', home: 'saturne', where: 'Saturne',
    likes: ['eau', 'diamant', 'puant', 'comete', 'etoile'],
    reasons: [
      "Ma couronne a perdu ses brillants !",
      "Je veux faire une farce au Roi Neptune, hi hi !",
      "Je prépare le grand bal des anneaux.",
    ],
    thanks: "Splendide ! Tu es le livreur préféré de la Reine !",
  },
];
export const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

/* Les améliorations : values[niveau], prices[niveau actuel] = prix du niveau suivant */
export const UPGRADES = {
  cargo: {
    shop: 'gus', icon: '📦', name: 'Soute plus grande',
    values: [4, 6, 8, 10, 12], prices: [60, 120, 200, 300],
    label: (v) => `${v} places`,
    help: 'Pour transporter plus de ressources à la fois.',
  },
  slots: {
    shop: 'gus', icon: '📜', name: 'Grand carnet de quêtes',
    values: [3, 4, 5], prices: [80, 160],
    label: (v) => `${v} quêtes à la fois`,
    help: 'Pour accepter plus de quêtes en même temps.',
  },
  engine: {
    shop: 'gus', icon: '🚀', name: 'Moteur',
    values: [340, 400, 460], prices: [100, 200],
    label: (v, i) => ['Normal', 'Rapide', 'Super rapide'][i],
    help: 'Pour voler plus vite.',
  },
  turbo: {
    shop: 'gus', icon: '⚡', name: 'Recharge du turbo',
    values: [3.5, 2.4, 1.5], prices: [70, 140],
    label: (v) => `${String(v).replace('.', ',')} s`,
    help: 'Le turbo se recharge plus vite.',
  },
  weapon: {
    shop: 'boum', icon: '💥', name: 'Arme',
    values: [0, 1, 2, 3], prices: [80, 180, 300],
    label: (v) => ['Aucune', 'Laser', 'Double laser', 'Méga-canon'][v],
    help: 'Pour tirer sur les OVNI (ils donnent beaucoup d\'or !).',
  },
  shield: {
    shop: 'boum', icon: '🛡️', name: 'Bouclier',
    values: [0, 22, 11], prices: [120, 220],
    label: (v, i) => ['Aucun', 'Bouclier', 'Super bouclier'][i],
    help: 'Arrête un missile, puis se recharge.',
  },
};

export const PAINTS = {
  classique: { name: 'Classique', price: 0, hull: ['#FFFFFF', '#E6EAF5', '#A9B3CC'], accent: '#FF6F91', stripe: '#FFC93C', flame: ['#FFC93C', '#FF8A3C'] },
  glacier: { name: 'Bleu glacier', price: 30, hull: ['#F2FBFF', '#BFE6FA', '#6FB6E0'], accent: '#2E8BD6', stripe: '#FFFFFF', flame: ['#9EE7FF', '#FFFFFF'] },
  martien: { name: 'Vert martien', price: 30, hull: ['#EFFFE9', '#A8E59A', '#58A84A'], accent: '#2F7A2A', stripe: '#FFC93C', flame: ['#B6FF6A', '#58C97B'] },
  nuit: { name: 'Nuit violette', price: 40, hull: ['#C9BBFF', '#7A64D9', '#3A2C84'], accent: '#FFC93C', stripe: '#9EE7FF', flame: ['#C38BFF', '#FF7FC8'] },
  or: { name: 'Or royal', price: 120, hull: ['#FFF6C8', '#FFD24A', '#C99212'], accent: '#E85757', stripe: '#FFFFFF', flame: ['#FFD24A', '#FFF6C8'] },
  arcenciel: { name: 'Arc-en-ciel', price: 150, hull: ['#FFFFFF', '#F4F0FF', '#C9C2E8'], accent: 'rainbow', stripe: 'rainbow', flame: ['#FF6F91', '#FFC93C', '#58C97B', '#4FB8E8', '#B98BFF'] },
};

export const ACCESSORIES = {
  aucun: { name: 'Rien', price: 0 },
  yeux: { name: 'Yeux rigolos', price: 30 },
  requin: { name: 'Aileron de requin', price: 40 },
  licorne: { name: 'Corne de licorne', price: 60 },
  dragon: { name: 'Ailes de dragon', price: 80 },
};

/* Les marchands : stations fixes dans l'espace */
export const SHOPS = [
  { id: 'gus', name: 'Garage de Gus', icon: '🔧', who: 'Gus le mécano', angle: 2.55, dist: 990, hello: "Salut ! Ici on rend les fusées plus grandes, plus rapides et plus fortes !" },
  { id: 'stella', name: 'Atelier de Stella', icon: '🎨', who: 'Stella', angle: -0.55, dist: 990, hello: "Bienvenue ! Une fusée, c'est comme un tableau : elle doit être belle !" },
  { id: 'boum', name: 'Armurerie du Colonel Boum', icon: '💥', who: 'Colonel Boum', angle: 0.95, dist: 1240, hello: "Des OVNI t'embêtent, soldat ? J'ai ce qu'il te faut !" },
];

export const EARTH_PRICE = 1000;

/* Bip, le copilote */
export const LINES = {
  firstStart: "Bip bip ! Je suis Bip, ton copilote. Va voir Capitaine Lila, juste au-dessus de la Station spatiale : elle a une livraison pour toi !",
  resume: [
    "Bip bip ! On reprend les livraisons, chef !",
    "Re-bonjour chef ! Les clients nous attendent.",
  ],
  firstQuest: (icon, name, place) => `${icon} ${name} ? Ça se trouve vers ${place}. Approche-toi : la soute se remplit toute seule. Perdu ? Regarde la carte 🗺️ !`,
  firstLoad: (who) => `Super ! Maintenant, ramène tout ça à ${who}.`,
  firstDone: "Bravo ! Tu peux prendre plusieurs quêtes en même temps. Ouvre la carte 🗺️ pour voir qui a besoin de toi (les « ! »).",
  quest: [
    "Nouvelle quête ! Regarde la carte pour préparer ton trajet.",
    "C'est noté, chef ! On va chercher ça.",
    "Une livraison de plus ! Réfléchis au meilleur chemin…",
  ],
  load: ["Chargé !", "Dans la soute !", "Hop, embarqué !"],
  cargoFull: ["La soute est pleine, chef ! Il faut livrer ou l'agrandir chez Gus.", "Plus de place dans la soute !"],
  notNeeded: "Aucune de tes quêtes n'a besoin de ça pour l'instant.",
  noSlot: "Ton carnet de quêtes est plein ! Termine une quête, ou agrandis ton carnet chez Gus.",
  partial: ["Livraison partielle ! Il en manque encore un peu.", "C'est un bon début ! Il faudra revenir avec le reste."],
  done: [
    "Quête terminée ! Ka-ching !",
    "Bravo chef, client content !",
    "Livraison parfaite ! Les pièces d'or, c'est par ici !",
  ],
  richGus: "On a assez d'or pour agrandir la soute chez Gus le mécano 🔧. C'est toi qui décides !",
  firstUfo: "Attention, un OVNI ! S'il nous touche avec un missile, on perd tout notre chargement. Fuis… ou achète une arme chez le Colonel Boum 💥 !",
  missile: ["Missile en approche ! Tourne vite !", "Attention, un missile !", "Esquive, chef !"],
  hit: [
    "Aïe ! On a perdu notre chargement ! Ramasse vite les caisses !",
    "BOUM ! La soute s'est ouverte ! Vite, récupère les caisses !",
  ],
  hitEmpty: ["Ouf, la soute était vide !", "Aïe ! Heureusement, on ne transportait rien."],
  shield: ["Le bouclier nous a protégés !", "Bloqué par le bouclier ! Ha !"],
  kill: ["OVNI détruit ! Il pleut des pièces d'or !", "Bien visé ! Ramasse le butin !", "Et un OVNI de moins !"],
  firstWeapon: "Appuie sur F (ou le bouton Tir) pour tirer : je vise l'OVNI le plus proche tout seul !",
  noWeapon: "On n'a pas d'arme ! Le Colonel Boum 💥 en vend.",
  buy: ["Super achat !", "Ça, c'est de la fusée !", "On est encore plus forts !"],
  paint: ["Waouh, trop classe !", "Tout le monde va nous regarder !"],
  earthPrice: "La Terre est à vendre : 1000 pièces d'or. Continue tes livraisons !",
  rich: "1000 pièces d'or ! Fonce sur la Terre 🌍 pour l'acheter !",
  blackhole: "Oh non, le trou noir a avalé notre chargement ! Retour près de la Terre…",
  safe: "Ici, près du Soleil, c'est la zone calme : les OVNI n'y viennent jamais.",
};
