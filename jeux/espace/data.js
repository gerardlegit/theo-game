// ============================================================================
// LES OBJETS DE L'ESPACE — chaque "id" correspond à un dessin dans art.js.
//
//  - riddle : l'énigme affichée sur l'ordre de mission en mode Commandant
//  - facts  : on en montre une nouvelle à chaque photo, pour apprendre plus
//  - wow    : le fait « Incroyable mais vrai ! » qui fait rire
// ============================================================================

export const SPACE_OBJECTS = [
  {
    id: 'soleil', name: 'Soleil', kind: 'étoile',
    riddle: "Je suis une étoile, et c'est autour de moi que tout le monde tourne.",
    facts: [
      "Le Soleil est une étoile : une énorme boule de gaz brûlant.",
      "Sa lumière met 8 minutes pour arriver jusqu'à la Terre.",
      "Toutes les planètes du système solaire tournent autour de lui.",
    ],
    wow: "On pourrait mettre 1 million de Terres à l'intérieur du Soleil !",
  },
  {
    id: 'mercure', name: 'Mercure', kind: 'planète',
    riddle: "Je suis la planète la plus proche du Soleil… et la plus petite.",
    facts: [
      "Mercure est la planète la plus proche du Soleil.",
      "C'est la plus petite planète du système solaire.",
      "Elle fait le tour du Soleil en seulement 88 jours : c'est la plus rapide !",
    ],
    wow: "Le jour, il y fait 430 °C… et la nuit, -180 °C. Brrr… et aïe !",
  },
  {
    id: 'venus', name: 'Vénus', kind: 'planète',
    riddle: "Je suis la planète la plus chaude, cachée sous d'épais nuages.",
    facts: [
      "Vénus est la planète la plus chaude : plus de 450 °C !",
      "Elle est cachée sous des nuages très épais qui gardent la chaleur.",
      "C'est la deuxième planète en partant du Soleil.",
    ],
    wow: "Sur Vénus, un jour dure plus longtemps qu'une année ! Ton anniversaire arriverait avant le goûter.",
  },
  {
    id: 'terre', name: 'Terre', kind: 'planète',
    riddle: "Je suis la planète bleue, et c'est ici que tu habites !",
    facts: [
      "La Terre est la seule planète connue où il y a de la vie.",
      "Elle est recouverte d'eau aux trois quarts : c'est la planète bleue.",
      "C'est la troisième planète en partant du Soleil.",
    ],
    wow: "La Terre tourne si vite autour du Soleil que tu fais 30 km chaque seconde… sans bouger de ton lit !",
  },
  {
    id: 'lune', name: 'Lune', kind: 'satellite naturel',
    riddle: "Je tourne autour de la Terre et des astronautes ont marché sur moi.",
    facts: [
      "La Lune est le satellite naturel de la Terre : elle tourne autour d'elle.",
      "Des astronautes y ont marché pour la première fois en 1969.",
      "Elle n'a pas de lumière : elle renvoie celle du Soleil.",
    ],
    wow: "Il n'y a pas de vent sur la Lune : les traces de pas des astronautes y sont encore !",
  },
  {
    id: 'mars', name: 'Mars', kind: 'planète',
    riddle: "On m'appelle la planète rouge, à cause de ma poussière de rouille.",
    facts: [
      "Mars est la planète rouge : son sol est plein de poussière de rouille.",
      "On y trouve le plus grand volcan du système solaire : l'Olympus Mons.",
      "Des robots roulent sur Mars pour l'explorer.",
    ],
    wow: "Sur Mars, les couchers de soleil sont… bleus !",
  },
  {
    id: 'jupiter', name: 'Jupiter', kind: 'planète',
    riddle: "Je suis la plus grosse planète, avec une grande tache rouge.",
    facts: [
      "Jupiter est la plus grosse planète du système solaire.",
      "Sa Grande Tache rouge est une tempête plus grande que la Terre !",
      "C'est une planète géante faite de gaz : on ne peut pas s'y poser.",
    ],
    wow: "Plus de 1 300 Terres pourraient tenir dans Jupiter !",
  },
  {
    id: 'saturne', name: 'Saturne', kind: 'planète',
    riddle: "Je suis la planète aux magnifiques anneaux de glace.",
    facts: [
      "Les anneaux de Saturne sont faits de glace et de cailloux.",
      "C'est la sixième planète en partant du Soleil.",
      "Elle a plus de 200 lunes : c'est la championne !",
    ],
    wow: "Saturne est si légère qu'elle flotterait dans une baignoire géante !",
  },
  {
    id: 'uranus', name: 'Uranus', kind: 'planète',
    riddle: "Je tourne couchée sur le côté, comme une toupie renversée.",
    facts: [
      "Uranus tourne couchée sur le côté !",
      "Sa couleur bleu-vert vient d'un gaz appelé méthane.",
      "C'est la septième planète en partant du Soleil.",
    ],
    wow: "Les nuages d'Uranus sentiraient… l'œuf pourri ! Pouah !",
  },
  {
    id: 'neptune', name: 'Neptune', kind: 'planète',
    riddle: "Je suis la planète la plus lointaine, balayée par des vents géants.",
    facts: [
      "Neptune est la planète la plus éloignée du Soleil.",
      "On y trouve les vents les plus rapides du système solaire.",
      "Elle met 165 ans pour faire le tour du Soleil !",
    ],
    wow: "Il pleut peut-être des diamants à l'intérieur de Neptune !",
  },
  {
    id: 'pluton', name: 'Pluton', kind: 'planète naine',
    riddle: "Avant j'étais une planète, maintenant on dit que je suis naine. J'ai un cœur !",
    facts: [
      "Pluton est une planète naine, tout au bout du système solaire.",
      "Elle a un grand cœur de glace dessiné sur elle.",
      "Avant 2006, on la comptait comme la 9e planète.",
    ],
    wow: "Pluton est plus petite que notre Lune !",
  },
  {
    id: 'comete', name: 'Comète', kind: 'petit corps',
    riddle: "Je suis une boule de glace sale avec une longue queue brillante.",
    facts: [
      "Une comète est une boule de glace et de poussière.",
      "Quand elle s'approche du Soleil, elle fond un peu et forme une longue queue.",
      "Sa queue est toujours tournée à l'opposé du Soleil.",
    ],
    wow: "On surnomme les comètes des « boules de neige sales » !",
  },
  {
    id: 'asteroide', name: 'Astéroïde', kind: 'petit corps',
    riddle: "Je suis un gros caillou. Avec mes copains, on forme une ceinture entre Mars et Jupiter.",
    facts: [
      "Un astéroïde est un gros rocher qui tourne autour du Soleil.",
      "La plupart vivent dans la ceinture d'astéroïdes, entre Mars et Jupiter.",
      "Certains sont minuscules, d'autres grands comme une région entière.",
    ],
    wow: "C'est peut-être un astéroïde géant qui a fait disparaître les dinosaures !",
  },
  {
    id: 'galaxie', name: 'Galaxie', kind: 'galaxie',
    riddle: "Je suis une immense spirale faite de milliards d'étoiles.",
    facts: [
      "Une galaxie, c'est des milliards d'étoiles rassemblées.",
      "Notre galaxie s'appelle la Voie lactée.",
      "Il existe des milliers de milliards de galaxies dans l'Univers.",
    ],
    wow: "Notre galaxie est si grande que la lumière met 100 000 ans pour la traverser !",
  },
  {
    id: 'nebuleuse', name: 'Nébuleuse', kind: 'nuage',
    riddle: "Je suis un nuage géant et coloré : les étoiles naissent chez moi.",
    facts: [
      "Une nébuleuse est un immense nuage de gaz et de poussière.",
      "C'est là que naissent les nouvelles étoiles : une maternité d'étoiles !",
      "Leurs couleurs viennent des gaz qui brillent.",
    ],
    wow: "Une nébuleuse peut être des milliers de fois plus grande que tout le système solaire !",
  },
  {
    id: 'trounoir', name: 'Trou noir', kind: 'mystère',
    riddle: "Je suis si gourmand que même la lumière ne peut pas m'échapper.",
    facts: [
      "Un trou noir attire tout ce qui passe trop près.",
      "Rien ne peut s'en échapper, pas même la lumière !",
      "On l'entoure souvent d'un disque de matière qui brille très fort.",
    ],
    wow: "Si tu tombais dedans, tu serais étiré comme un spaghetti. Les savants disent « spaghettification » !",
  },
  {
    id: 'satellite', name: 'Satellite', kind: 'engin humain',
    riddle: "Je suis un engin envoyé par les humains pour observer la Terre ou téléphoner.",
    facts: [
      "Un satellite artificiel est un engin construit par les humains.",
      "Il en existe des milliers autour de la Terre.",
      "Ils servent à prévoir la météo, téléphoner, regarder la télé ou trouver son chemin.",
    ],
    wow: "Le GPS de la voiture de tes parents parle avec des satellites dans l'espace !",
  },
  {
    id: 'iss', name: 'Station spatiale', kind: 'engin humain',
    riddle: "Je suis une grande maison volante où vivent des astronautes.",
    facts: [
      "La Station spatiale internationale est une maison pour astronautes.",
      "Elle fait le tour de la Terre en 1 h 30 seulement !",
      "Des astronautes de nombreux pays y vivent et travaillent ensemble.",
    ],
    wow: "Les astronautes y voient 16 levers de soleil par jour !",
  },
  {
    id: 'astronaute', name: 'Astronaute', kind: 'humain',
    riddle: "Je flotte en scaphandre et je fais des sorties dans l'espace.",
    facts: [
      "Un astronaute porte un scaphandre pour respirer et ne pas avoir froid.",
      "Dans l'espace, tout flotte : il faut s'attacher pour dormir !",
      "Thomas Pesquet est un astronaute français.",
    ],
    wow: "Dans l'espace, les astronautes grandissent de quelques centimètres !",
  },
  {
    id: 'rover', name: 'Robot martien', kind: 'engin humain',
    riddle: "Je suis un robot à six roues qui explore la planète rouge.",
    facts: [
      "Des robots à six roues explorent Mars, comme Curiosity ou Perseverance.",
      "Ils prennent des photos et analysent les cailloux.",
      "Ils sont pilotés depuis la Terre.",
    ],
    wow: "Perseverance a emmené un petit hélicoptère sur Mars : Ingenuity !",
  },
  {
    id: 'telescope', name: 'Télescope James Webb', kind: 'engin humain',
    riddle: "J'ai un grand miroir doré pour regarder les étoiles les plus lointaines.",
    facts: [
      "Le télescope James Webb observe l'Univers très, très loin.",
      "Son miroir doré est fait de 18 morceaux en forme d'hexagone.",
      "Il est placé à 1,5 million de km de la Terre, toujours derrière elle.",
    ],
    wow: "Son pare-soleil est grand comme un terrain de tennis !",
  },
  {
    id: 'fusee', name: 'Fusée', kind: 'engin humain',
    riddle: "Je décolle dans un nuage de feu pour emmener des engins dans l'espace.",
    facts: [
      "Une fusée sert à envoyer des satellites ou des astronautes dans l'espace.",
      "Elle doit aller super vite : 28 000 km/h pour rester en orbite !",
      "La fusée européenne s'appelle Ariane.",
    ],
    wow: "À 28 000 km/h, tu irais de Paris à Marseille en 1 minute et demie !",
  },
  {
    id: 'ovni', name: 'OVNI', kind: 'imaginaire',
    riddle: "Je suis une soucoupe volante… Personne ne sait si j'existe vraiment !",
    facts: [
      "OVNI veut dire Objet Volant Non Identifié.",
      "Personne n'a jamais rencontré d'extraterrestre… pour l'instant !",
      "Les savants cherchent vraiment de la vie ailleurs, par exemple sous la glace d'Europe.",
    ],
    wow: "Celui-là, c'est Zorg. Il est perdu depuis 3 000 ans et refuse de demander son chemin.",
  },
  {
    id: 'chaussette', name: 'Chaussette perdue', kind: 'déchet spatial',
    riddle: "Je suis un vêtement tout seul, perdu par un astronaute… Ça sent fort !",
    facts: [
      "Dans la Station spatiale, il n'y a pas de machine à laver !",
      "Les astronautes portent leurs vêtements plusieurs jours puis les jettent.",
      "Il y a beaucoup de déchets dans l'espace : on les appelle les débris spatiaux.",
    ],
    wow: "Un astronaute a vraiment perdu un gant dans l'espace en 1965. Il a tourné autour de la Terre pendant un mois !",
  },
  {
    id: 'io', name: 'Io', kind: 'lune de Jupiter',
    riddle: "Je suis une lune de Jupiter couverte de volcans. Je ressemble à une pizza !",
    facts: [
      "Io est une lune de Jupiter.",
      "C'est l'endroit qui a le plus de volcans dans tout le système solaire.",
      "Ses couleurs jaunes et oranges viennent du soufre.",
    ],
    wow: "Ses volcans crachent de la lave à 400 km de haut !",
  },
  {
    id: 'europe', name: 'Europe', kind: 'lune de Jupiter',
    riddle: "Je suis une lune de Jupiter couverte de glace, avec un océan caché dessous.",
    facts: [
      "Europe est une lune de Jupiter recouverte de glace.",
      "Sous la glace se cache un immense océan d'eau salée.",
      "Les savants pensent qu'il pourrait y avoir de la vie dans cet océan.",
    ],
    wow: "Il y a peut-être plus d'eau sur Europe que dans tous les océans de la Terre !",
  },
  {
    id: 'titan', name: 'Titan', kind: 'lune de Saturne',
    riddle: "Je suis la plus grosse lune de Saturne, cachée dans un brouillard orange.",
    facts: [
      "Titan est la plus grosse lune de Saturne.",
      "Elle est entourée d'un épais brouillard orange.",
      "Il y a des lacs sur Titan… mais pas d'eau : du méthane liquide !",
    ],
    wow: "Sur Titan, l'air est si épais et on est si léger qu'on pourrait voler avec des ailes accrochées aux bras !",
  },
];

export const OBJECT_BY_ID = Object.fromEntries(SPACE_OBJECTS.map((o) => [o.id, o]));

/* Prétextes de mission, tirés au hasard */
export const MISSION_STORIES = [
  "Le Général Gloubi a fait tomber son album photo dans un trou noir. Refais-lui toutes ses photos !",
  "Mamie Comète veut des cartes postales de ses amis de l'espace. Va les prendre en photo !",
  "Le magazine « Cosmo-Mômes » veut des photos pour sa couverture. Au boulot, reporter !",
  "Les extraterrestres de la planète Zorg ne croient pas que notre système solaire existe. Prouve-le en photos !",
  "Le Professeur Zinzin prépare un exposé sur l'espace et il a oublié ses images. Sauve-le !",
];

/* Le copilote Bip parle beaucoup… */
export const BIP = {
  start: [
    "Bip bip ! Je suis Bip, ton copilote. Allons prendre ces photos !",
    "Ceinture attachée ? Casque sur la tête ? Chaussettes propres ? C'est parti !",
    "Moteurs chauds, appareil photo prêt. On décolle, chef !",
  ],
  goodPhoto: [
    "CLIC ! Superbe photo, chef !",
    "Magnifique ! Le Général Gloubi va pleurer de joie.",
    "Wouah, quelle photo ! On dirait un vrai pro.",
    "Dans la boîte ! Une de moins sur la liste.",
    "Youpi ! Je l'encadre au-dessus de mon lit. Enfin… de ma prise électrique.",
  ],
  otherPhoto: [
    "Jolie photo… mais ce n'est pas sur notre liste !",
    "Je la garde pour ton carnet, mais ce n'est pas ce qu'on cherche.",
    "Pas sur l'ordre de mission, mais on apprend des trucs !",
  ],
  bonk: [
    "Aïe ! Qui a mis ce caillou là ?",
    "BONK ! Mes boulons ont tremblé !",
    "Ouille ! Attention aux astéroïdes, chef !",
    "On rebondit comme un ballon. Bip !",
  ],
  sun: [
    "Ouille ouille, ça chauffe ! On recule !",
    "Trop chaud ! Mes circuits fondent comme une glace au chocolat !",
  ],
  blackhole: [
    "AAAAH ! Le trou noir nous aspire ! Fonce dans l'autre sens !",
    "Il est gourmand, ce trou noir ! Vite, le TURBO !",
  ],
  spaghetti: [
    "Oh non, on a été transformés en spaghettis ! Retour à la Terre pour se remettre en forme…",
  ],
  spaghettiPhoto: [
    "CLIC ! Photo prise juste avant de devenir des spaghettis ! Retour à la Terre…",
  ],
  edge: [
    "Hé, on sort de la carte ! L'Univers n'a pas de bord… mais notre carte, si !",
    "Demi-tour, chef ! Il n'y a plus rien à photographier par là.",
  ],
  uranus: ["Pouah ! Ça sent l'œuf pourri par ici… c'est Uranus !"],
  wormhole: ["Wouhouuu ! Un trou de ver : un raccourci dans l'espace ! (On n'en a jamais vu en vrai…)"],
  star: ["Une étoile d'or ! Ça fait gagner une seconde.", "Ding ! Encore une étoile !"],
  turbo: ["TURBOOOOO !", "Accroche-toi à tes chaussettes !"],
  almost: ["Plus qu'une photo, chef ! On y est presque !"],
  ovni: ["Il s'enfuit ! Rattrape-le, chef !", "Reviens, petit OVNI ! On veut juste une photo !"],
  ovniTired: ["Il est tout essoufflé ! Vite, la photo !", "Ha ha, il n'a plus de carburant ! Approche-toi !"],
  sock: ["Beurk ! Cette odeur… c'est la chaussette du Général Gloubi !"],
  idle: [
    "Euh… chef ? On fait une pause pique-nique ?",
    "Bip ? Biiip ? Tu t'es endormi ?",
    "Si on ne bouge pas, les planètes ne vont pas venir toutes seules !",
  ],
  manyBonks: ["Tu collectionnes les cailloux ou quoi ?!", "Mon pare-chocs demande des vacances…"],
  special: {
    soleil: "Rappel de Bip : ne regarde JAMAIS le vrai Soleil sans protection !",
    terre: "Coucou la maison ! Je crois que je vois ton école d'ici !",
    pluton: "Pluton est toute contente qu'on pense encore à elle !",
    ovni: "Zorg te dit bonjour ! Enfin… « Gloubiboulga ! » en extraterrestre.",
    chaussette: "Photo prise… en se bouchant le nez !",
    trounoir: "Photo prise ! Maintenant, on s'éloigne vite avant de devenir des spaghettis !",
    uranus: "Clic ! Je retiens ma respiration… ça sent l'œuf pourri !",
    astronaute: "Il nous fait coucou ! Fais-lui coucou aussi !",
    lune: "Tu vois les traces de pas ? Moi non plus, mais elles sont là !",
  },
  win: ["Mission accomplie ! Tu es le meilleur pilote de la galaxie !"],
  jokes: [
    "Pourquoi le Soleil ne va pas à l'école ? Il a déjà des millions de degrés !",
    "Comment on fait une fête sur la Lune ? Impossible : il n'y a pas d'ambiance… pas d'atmosphère !",
    "Pourquoi les astronautes ne se disputent jamais ? Ils se laissent de l'espace !",
    "Que dit la Terre à la Lune ? Arrête de me tourner autour, j'ai le tournis !",
    "Toc toc ! Qui est là ? Pluton. Pluton qui ? Plus tôt, j'étais une planète ! 😢",
    "Pourquoi Saturne porte des anneaux ? Pour être la plus chic du système solaire !",
    "Où range-t-on la Voie lactée ? Au frigo, avec le reste du lait !",
    "Sur la Lune, tu sauterais 6 fois plus haut. Parfait pour attraper les biscuits sur l'étagère !",
    "Mon cousin est un robot aspirateur. Moi, je suis un robot de l'espace. La classe, non ?",
    "Dans l'espace, personne ne t'entend roter. Pratique !",
  ],
};
