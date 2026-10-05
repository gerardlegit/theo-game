// ============================================================================
// Données du jeu "Pin the Globe"
//
// Chaque ville :
//  - name, country    : noms affichés au joueur
//  - cc               : code ISO alpha-2 (drapeau, via flag-icons)
//  - iso              : code ISO numérique du pays dans la carte world-atlas
//                       (sert à entourer le pays quand on demande un indice)
//  - continent        : sert à varier les villes d'une partie
//  - lat, lon         : position réelle (degrés décimaux)
//  - level            : 1 = ville très connue (mode Explorateur),
//                       2 = ville plus difficile (mode Grand voyageur)
//  - capital          : true si c'est la capitale du pays
//  - icon, pop, lang  : petite fiche d'identité
//  - facts            : « Le savais-tu ? »
// ============================================================================

export const CONTINENTS = ['Europe', 'Afrique', 'Asie', 'Amérique du Nord', 'Amérique du Sud', 'Océanie'];

export const CITIES = [
  // ------------------------------------------------------------- Europe
  {
    id: 'paris', name: 'Paris', country: 'France', cc: 'fr', iso: '250', continent: 'Europe',
    lat: 48.857, lon: 2.352, level: 1, capital: true, icon: '🗼',
    pop: 'environ 2,1 millions (plus de 12 millions avec la banlieue)', lang: 'Français',
    facts: [
      "La tour Eiffel a été construite pour l'Exposition universelle de 1889. Elle mesure 330 mètres !",
      "Le musée du Louvre est le musée le plus visité au monde : c'est là que vit la Joconde.",
    ],
  },
  {
    id: 'londres', name: 'Londres', country: 'Royaume-Uni', cc: 'gb', iso: '826', continent: 'Europe',
    lat: 51.507, lon: -0.128, level: 1, capital: true, icon: '💂',
    pop: 'environ 9 millions', lang: 'Anglais',
    facts: [
      "« Big Ben » est en réalité le surnom de la grosse cloche, pas de la tour !",
      "Londres possède le plus vieux métro du monde, ouvert en 1863. Les Anglais l'appellent « the Tube ».",
    ],
  },
  {
    id: 'rome', name: 'Rome', country: 'Italie', cc: 'it', iso: '380', continent: 'Europe',
    lat: 41.903, lon: 12.496, level: 1, capital: true, icon: '🏛️',
    pop: 'environ 2,8 millions', lang: 'Italien',
    facts: [
      "Le Colisée pouvait accueillir environ 50 000 spectateurs venus voir les combats de gladiateurs.",
      "Le Vatican, le plus petit pays du monde, se trouve entièrement à l'intérieur de Rome !",
    ],
  },
  {
    id: 'madrid', name: 'Madrid', country: 'Espagne', cc: 'es', iso: '724', continent: 'Europe',
    lat: 40.417, lon: -3.704, level: 1, capital: true, icon: '🎨',
    pop: 'environ 3,4 millions', lang: 'Espagnol',
    facts: [
      "Madrid est située en plein centre de l'Espagne, à plus de 650 mètres d'altitude.",
      "Le musée du Prado abrite des chefs-d'œuvre de grands peintres comme Velázquez et Goya.",
    ],
  },
  {
    id: 'berlin', name: 'Berlin', country: 'Allemagne', cc: 'de', iso: '276', continent: 'Europe',
    lat: 52.520, lon: 13.405, level: 1, capital: true, icon: '🐻',
    pop: 'environ 3,7 millions', lang: 'Allemand',
    facts: [
      "De 1961 à 1989, un mur coupait Berlin en deux. Sa chute est un grand moment de l'histoire !",
      "L'ours est le symbole de Berlin : on le retrouve sur le drapeau de la ville.",
      "La porte de Brandebourg est devenue le symbole de l'Allemagne réunifiée.",
    ],
  },
  {
    id: 'moscou', name: 'Moscou', country: 'Russie', cc: 'ru', iso: '643', continent: 'Europe',
    lat: 55.756, lon: 37.617, level: 1, capital: true, icon: '⛪',
    pop: 'environ 13 millions', lang: 'Russe',
    facts: [
      "La cathédrale Saint-Basile, sur la place Rouge, est célèbre pour ses coupoles colorées en forme de bulbe.",
      "Le Kremlin est une immense forteresse au cœur de la ville.",
      "La Russie est le plus grand pays du monde : elle s'étend sur 11 fuseaux horaires !",
    ],
  },
  {
    id: 'athenes', name: 'Athènes', country: 'Grèce', cc: 'gr', iso: '300', continent: 'Europe',
    lat: 37.984, lon: 23.728, level: 1, capital: true, icon: '🏺',
    pop: 'environ 3,6 millions avec son agglomération', lang: 'Grec',
    facts: [
      "Sur la colline de l'Acropole se dresse le Parthénon, un temple construit il y a près de 2 500 ans.",
      "Les premiers Jeux olympiques modernes ont eu lieu à Athènes en 1896.",
      "La ville porte le nom de la déesse Athéna.",
    ],
  },
  {
    id: 'istanbul', name: 'Istanbul', country: 'Turquie', cc: 'tr', iso: '792', continent: 'Europe',
    continentLabel: 'Europe et Asie',
    lat: 41.008, lon: 28.978, level: 1, capital: false, icon: '🕌',
    pop: 'environ 15,7 millions', lang: 'Turc',
    facts: [
      "Istanbul est à cheval sur deux continents : l'Europe et l'Asie, séparées par le détroit du Bosphore.",
      "Elle s'est d'abord appelée Byzance, puis Constantinople, avant de devenir Istanbul.",
      "Ce n'est pas la capitale de la Turquie : c'est Ankara !",
    ],
  },
  {
    id: 'lisbonne', name: 'Lisbonne', country: 'Portugal', cc: 'pt', iso: '620', continent: 'Europe',
    lat: 38.722, lon: -9.139, level: 2, capital: true, icon: '🚋',
    pop: 'environ 550 000 (près de 3 millions avec la banlieue)', lang: 'Portugais',
    facts: [
      "Lisbonne est construite sur sept collines : ses vieux tramways jaunes grimpent des rues très pentues.",
      "En 1755, un terrible tremblement de terre a détruit une grande partie de la ville.",
    ],
  },
  {
    id: 'barcelone', name: 'Barcelone', country: 'Espagne', cc: 'es', iso: '724', continent: 'Europe',
    lat: 41.385, lon: 2.173, level: 2, capital: false, icon: '⛪',
    pop: 'environ 1,7 million', lang: 'Catalan et espagnol',
    facts: [
      "La basilique de la Sagrada Família, imaginée par l'architecte Gaudí, est en construction depuis 1882 !",
      "Barcelone est la capitale de la Catalogne, une région d'Espagne qui a sa propre langue : le catalan.",
    ],
  },
  {
    id: 'venise', name: 'Venise', country: 'Italie', cc: 'it', iso: '380', continent: 'Europe',
    lat: 45.441, lon: 12.316, level: 2, capital: false, icon: '🛶',
    pop: 'environ 50 000 dans le centre historique', lang: 'Italien',
    facts: [
      "Venise est bâtie sur 118 petites îles reliées par environ 400 ponts.",
      "Pas de voitures ici : on se déplace à pied ou en bateau, comme les fameuses gondoles.",
    ],
  },
  {
    id: 'amsterdam', name: 'Amsterdam', country: 'Pays-Bas', cc: 'nl', iso: '528', continent: 'Europe',
    lat: 52.368, lon: 4.904, level: 2, capital: true, icon: '🚲',
    pop: 'environ 930 000', lang: 'Néerlandais',
    facts: [
      "La ville compte plus de 100 km de canaux et environ 1 500 ponts.",
      "Ses maisons reposent sur des pieux en bois plantés dans le sol marécageux.",
      "On y trouve plus de vélos que d'habitants !",
    ],
  },
  {
    id: 'stockholm', name: 'Stockholm', country: 'Suède', cc: 'se', iso: '752', continent: 'Europe',
    lat: 59.329, lon: 18.069, level: 2, capital: true, icon: '⛵',
    pop: 'environ 1 million', lang: 'Suédois',
    facts: [
      "Stockholm est construite sur 14 îles.",
      "C'est ici que sont remis chaque année les prix Nobel (sauf celui de la paix, remis à Oslo).",
    ],
  },
  {
    id: 'vienne', name: 'Vienne', country: 'Autriche', cc: 'at', iso: '040', continent: 'Europe',
    lat: 48.208, lon: 16.374, level: 2, capital: true, icon: '🎻',
    pop: 'environ 2 millions', lang: 'Allemand',
    facts: [
      "Mozart, Beethoven et Strauss ont vécu à Vienne : c'est une capitale de la musique classique.",
      "Le château de Schönbrunn était la résidence d'été des empereurs d'Autriche.",
    ],
  },
  {
    id: 'prague', name: 'Prague', country: 'Tchéquie', cc: 'cz', iso: '203', continent: 'Europe',
    lat: 50.076, lon: 14.438, level: 2, capital: true, icon: '🕰️',
    pop: 'environ 1,3 million', lang: 'Tchèque',
    facts: [
      "Son horloge astronomique, installée en 1410, fonctionne encore aujourd'hui !",
      "On la surnomme « la ville aux cent clochers ».",
    ],
  },
  {
    id: 'marseille', name: 'Marseille', country: 'France', cc: 'fr', iso: '250', continent: 'Europe',
    lat: 43.296, lon: 5.370, level: 2, capital: false, icon: '⚓',
    pop: 'environ 870 000', lang: 'Français',
    facts: [
      "C'est la plus ancienne ville de France : des marins grecs l'ont fondée il y a environ 2 600 ans.",
      "La basilique Notre-Dame-de-la-Garde, surnommée « la Bonne Mère », veille sur la ville.",
    ],
  },
  {
    id: 'geneve', name: 'Genève', country: 'Suisse', cc: 'ch', iso: '756', continent: 'Europe',
    lat: 46.204, lon: 6.143, level: 2, capital: false, icon: '⛲',
    pop: 'environ 200 000', lang: 'Français',
    facts: [
      "Le Jet d'eau de Genève projette de l'eau jusqu'à 140 mètres de haut.",
      "La Croix-Rouge y a été fondée en 1863, et de nombreuses organisations internationales y siègent.",
      "Ce n'est pas la capitale de la Suisse : c'est Berne !",
    ],
  },
  {
    id: 'bruxelles', name: 'Bruxelles', country: 'Belgique', cc: 'be', iso: '056', continent: 'Europe',
    lat: 50.850, lon: 4.352, level: 2, capital: true, icon: '🧇',
    pop: 'environ 1,2 million', lang: 'Français et néerlandais',
    facts: [
      "Le Manneken-Pis, une petite statue de bronze, possède plus de 1 000 costumes !",
      "Bruxelles accueille de nombreuses institutions de l'Union européenne.",
    ],
  },
  {
    id: 'reykjavik', name: 'Reykjavik', country: 'Islande', cc: 'is', iso: '352', continent: 'Europe',
    lat: 64.147, lon: -21.943, level: 2, capital: true, icon: '🌋',
    pop: 'environ 140 000', lang: 'Islandais',
    facts: [
      "C'est la capitale la plus au nord du monde.",
      "On y chauffe les maisons grâce à la chaleur qui vient des volcans et des sources chaudes.",
    ],
  },

  // ------------------------------------------------------------- Afrique
  {
    id: 'le-caire', name: 'Le Caire', country: 'Égypte', cc: 'eg', iso: '818', continent: 'Afrique',
    lat: 30.044, lon: 31.236, level: 1, capital: true, icon: '🐪',
    pop: 'environ 10 millions (plus de 20 millions avec la banlieue)', lang: 'Arabe',
    facts: [
      "Les célèbres pyramides de Gizeh se trouvent juste à côté du Caire.",
      "La grande pyramide est la seule des Sept Merveilles du monde antique encore debout.",
      "Le Nil, l'un des plus longs fleuves du monde, traverse la ville.",
    ],
  },
  {
    id: 'le-cap', name: 'Le Cap', country: 'Afrique du Sud', cc: 'za', iso: '710', continent: 'Afrique',
    lat: -33.925, lon: 18.424, level: 1, capital: false, icon: '🐧',
    pop: 'environ 4,8 millions', lang: 'Anglais, afrikaans, xhosa…',
    facts: [
      "La montagne de la Table domine la ville avec son sommet tout plat.",
      "Non loin de là, des manchots vivent sur la plage de Boulders !",
      "Le célèbre cap de Bonne-Espérance se trouve tout près.",
    ],
  },
  {
    id: 'marrakech', name: 'Marrakech', country: 'Maroc', cc: 'ma', iso: '504', continent: 'Afrique',
    lat: 31.630, lon: -7.999, level: 1, capital: false, icon: '🌴',
    pop: 'environ 1 million', lang: 'Arabe et berbère',
    facts: [
      "On la surnomme « la ville rouge » à cause de la couleur de ses murs.",
      "Sur la place Jemaa el-Fna, on croise des conteurs, des musiciens et des charmeurs de serpents.",
      "Ce n'est pas la capitale du Maroc : c'est Rabat !",
    ],
  },
  {
    id: 'nairobi', name: 'Nairobi', country: 'Kenya', cc: 'ke', iso: '404', continent: 'Afrique',
    lat: -1.292, lon: 36.822, level: 1, capital: true, icon: '🦒',
    pop: 'environ 4,4 millions', lang: 'Swahili et anglais',
    facts: [
      "Nairobi possède un parc national où l'on voit des lions et des girafes… avec des gratte-ciel derrière !",
      "Elle est presque sur l'équateur, mais il n'y fait pas trop chaud grâce à son altitude : près de 1 800 m.",
    ],
  },
  {
    id: 'lagos', name: 'Lagos', country: 'Nigeria', cc: 'ng', iso: '566', continent: 'Afrique',
    lat: 6.524, lon: 3.379, level: 2, capital: false, icon: '🎥',
    pop: 'plus de 15 millions', lang: 'Anglais, yoruba…',
    facts: [
      "Lagos est la plus grande ville du Nigeria, le pays le plus peuplé d'Afrique.",
      "Le Nigeria produit énormément de films : on appelle ce cinéma « Nollywood ».",
      "Ce n'est pas la capitale : depuis 1991, c'est Abuja.",
    ],
  },
  {
    id: 'dakar', name: 'Dakar', country: 'Sénégal', cc: 'sn', iso: '686', continent: 'Afrique',
    lat: 14.716, lon: -17.467, level: 2, capital: true, icon: '🥁',
    pop: 'environ 1,2 million (4 millions avec la banlieue)', lang: 'Français et wolof',
    facts: [
      "Dakar est la ville la plus à l'ouest de l'Afrique continentale.",
      "Face à la ville, l'île de Gorée rappelle l'histoire de la traite des esclaves.",
    ],
  },
  {
    id: 'kinshasa', name: 'Kinshasa', country: 'République démocratique du Congo', cc: 'cd', iso: '180', continent: 'Afrique',
    lat: -4.441, lon: 15.266, level: 2, capital: true, icon: '🎶',
    pop: 'environ 17 millions', lang: 'Français et lingala',
    facts: [
      "Kinshasa est la plus grande ville francophone du monde !",
      "Juste en face, de l'autre côté du fleuve Congo, se trouve Brazzaville, la capitale d'un autre pays.",
    ],
  },
  {
    id: 'addis-abeba', name: 'Addis-Abeba', country: 'Éthiopie', cc: 'et', iso: '231', continent: 'Afrique',
    lat: 9.030, lon: 38.740, level: 2, capital: true, icon: '☕',
    pop: 'environ 5,5 millions', lang: 'Amharique',
    facts: [
      "Située à 2 355 mètres d'altitude, c'est l'une des capitales les plus hautes du monde.",
      "L'Union africaine, qui réunit les pays d'Afrique, y a son siège.",
      "L'Éthiopie serait le berceau du café !",
    ],
  },
  {
    id: 'antananarivo', name: 'Antananarivo', country: 'Madagascar', cc: 'mg', iso: '450', continent: 'Afrique',
    lat: -18.879, lon: 47.508, level: 2, capital: true, icon: '🐒',
    pop: 'environ 1,5 million', lang: 'Malgache et français',
    facts: [
      "Madagascar est la 4ᵉ plus grande île du monde.",
      "Les lémuriens ne vivent à l'état sauvage qu'à Madagascar !",
    ],
  },
  {
    id: 'tombouctou', name: 'Tombouctou', country: 'Mali', cc: 'ml', iso: '466', continent: 'Afrique',
    lat: 16.773, lon: -3.007, level: 2, capital: false, icon: '🏜️',
    pop: 'environ 50 000', lang: 'Songhaï, tamasheq…',
    facts: [
      "Aux portes du désert du Sahara, Tombouctou était autrefois une grande ville de savoir et de commerce.",
      "Ses mosquées en terre crue sont inscrites au patrimoine mondial de l'UNESCO.",
    ],
  },
  {
    id: 'alger', name: 'Alger', country: 'Algérie', cc: 'dz', iso: '012', continent: 'Afrique',
    lat: 36.754, lon: 3.059, level: 2, capital: true, icon: '☀️',
    pop: 'environ 3 millions', lang: 'Arabe et tamazight',
    facts: [
      "L'Algérie est le plus grand pays d'Afrique.",
      "On la surnomme « Alger la Blanche » à cause de ses immeubles blancs face à la mer.",
    ],
  },
  {
    id: 'saint-denis', name: 'Saint-Denis', country: 'La Réunion (France)', cc: 're', iso: '250', continent: 'Afrique',
    lat: -20.882, lon: 55.451, level: 2, capital: false, icon: '🌺',
    pop: 'environ 150 000', lang: 'Français et créole réunionnais',
    facts: [
      "Saint-Denis est la plus grande ville de La Réunion, une île française de l'océan Indien.",
      "Le volcan de l'île, le piton de la Fournaise, est l'un des plus actifs du monde.",
    ],
  },

  // ------------------------------------------------------------- Asie
  {
    id: 'tokyo', name: 'Tokyo', country: 'Japon', cc: 'jp', iso: '392', continent: 'Asie',
    lat: 35.676, lon: 139.650, level: 1, capital: true, icon: '🏯',
    pop: 'environ 14 millions (37 millions avec la banlieue)', lang: 'Japonais',
    facts: [
      "Avec sa banlieue, Tokyo forme l'une des plus grandes agglomérations du monde.",
      "Par temps clair, on peut apercevoir le mont Fuji depuis la ville.",
      "Le carrefour de Shibuya est l'un des passages piétons les plus fréquentés du monde.",
    ],
  },
  {
    id: 'pekin', name: 'Pékin', country: 'Chine', cc: 'cn', iso: '156', continent: 'Asie',
    lat: 39.904, lon: 116.407, level: 1, capital: true, icon: '🏮',
    pop: 'environ 21 millions', lang: 'Chinois (mandarin)',
    facts: [
      "La Cité interdite a été le palais des empereurs de Chine pendant près de 500 ans.",
      "La Grande Muraille passe à moins de 100 km de la ville.",
      "C'est la seule ville à avoir accueilli les Jeux olympiques d'été (2008) et d'hiver (2022).",
    ],
  },
  {
    id: 'dubai', name: 'Dubaï', country: 'Émirats arabes unis', cc: 'ae', iso: '784', continent: 'Asie',
    lat: 25.205, lon: 55.271, level: 1, capital: false, icon: '🏙️',
    pop: 'environ 3,7 millions', lang: 'Arabe',
    facts: [
      "La tour Burj Khalifa, haute de 828 mètres, est le plus haut bâtiment du monde.",
      "Il y a moins de 100 ans, Dubaï n'était qu'un petit village de pêcheurs de perles.",
    ],
  },
  {
    id: 'bombay', name: 'Bombay (Mumbai)', country: 'Inde', cc: 'in', iso: '356', continent: 'Asie',
    lat: 19.076, lon: 72.878, level: 1, capital: false, icon: '🛺',
    pop: 'environ 12 millions (plus de 20 millions avec la banlieue)', lang: 'Marathi, hindi…',
    facts: [
      "Bombay est la ville de Bollywood : on y tourne des centaines de films chaque année.",
      "La « Gateway of India », un grand arc de pierre, fait face à la mer d'Oman.",
    ],
  },
  {
    id: 'bangkok', name: 'Bangkok', country: 'Thaïlande', cc: 'th', iso: '764', continent: 'Asie',
    lat: 13.756, lon: 100.502, level: 1, capital: true, icon: '🛕',
    pop: 'environ 11 millions avec la banlieue', lang: 'Thaï',
    facts: [
      "Son nom complet en thaï compte plus de 160 lettres : c'est le plus long nom de ville du monde !",
      "Autour de la ville, on trouve des marchés flottants où l'on fait ses courses en bateau.",
    ],
  },
  {
    id: 'singapour', name: 'Singapour', country: 'Singapour', cc: 'sg', iso: '702', continent: 'Asie',
    lat: 1.352, lon: 103.820, level: 1, capital: true, icon: '🦁',
    pop: 'environ 6 millions', lang: 'Anglais, malais, mandarin, tamoul',
    facts: [
      "Singapour est une ville… et aussi un pays tout entier !",
      "Elle se trouve à peine à 150 km au nord de l'équateur : il y fait chaud toute l'année.",
      "Son emblème est le Merlion, moitié lion, moitié poisson.",
    ],
  },
  {
    id: 'kyoto', name: 'Kyoto', country: 'Japon', cc: 'jp', iso: '392', continent: 'Asie',
    lat: 35.012, lon: 135.768, level: 2, capital: false, icon: '⛩️',
    pop: 'environ 1,4 million', lang: 'Japonais',
    facts: [
      "Kyoto a été la capitale impériale du Japon pendant plus de 1 000 ans.",
      "On y compte plus de 1 600 temples bouddhistes.",
    ],
  },
  {
    id: 'shanghai', name: 'Shanghai', country: 'Chine', cc: 'cn', iso: '156', continent: 'Asie',
    lat: 31.230, lon: 121.474, level: 2, capital: false, icon: '🚢',
    pop: 'environ 25 millions', lang: 'Chinois',
    facts: [
      "C'est la plus grande ville de Chine.",
      "Son port est le plus actif du monde pour les conteneurs.",
    ],
  },
  {
    id: 'hong-kong', name: 'Hong Kong', country: 'Chine (Hong Kong)', cc: 'hk', iso: '344', continent: 'Asie',
    lat: 22.319, lon: 114.169, level: 2, capital: false, icon: '🌃',
    pop: 'environ 7,5 millions', lang: 'Cantonais et anglais',
    facts: [
      "Hong Kong est l'un des endroits du monde qui comptent le plus de gratte-ciel.",
      "Ancienne colonie britannique, elle est redevenue chinoise en 1997.",
    ],
  },
  {
    id: 'seoul', name: 'Séoul', country: 'Corée du Sud', cc: 'kr', iso: '410', continent: 'Asie',
    lat: 37.567, lon: 126.978, level: 2, capital: true, icon: '🎤',
    pop: 'environ 9,4 millions', lang: 'Coréen',
    facts: [
      "Séoul est le cœur de la K-pop, la musique coréenne devenue célèbre dans le monde entier.",
      "La ville est entourée de montagnes et traversée par le fleuve Han.",
    ],
  },
  {
    id: 'jakarta', name: 'Jakarta', country: 'Indonésie', cc: 'id', iso: '360', continent: 'Asie',
    lat: -6.208, lon: 106.846, level: 2, capital: true, icon: '🏝️',
    pop: 'environ 11 millions', lang: 'Indonésien',
    facts: [
      "L'Indonésie compte plus de 17 000 îles !",
      "Une partie de Jakarta s'enfonce dans le sol : le pays construit une nouvelle capitale, Nusantara, sur l'île de Bornéo.",
    ],
  },
  {
    id: 'katmandou', name: 'Katmandou', country: 'Népal', cc: 'np', iso: '524', continent: 'Asie',
    lat: 27.717, lon: 85.324, level: 2, capital: true, icon: '🏔️',
    pop: 'environ 1,5 million', lang: 'Népali',
    facts: [
      "Katmandou est la porte d'entrée vers l'Everest, la plus haute montagne du monde (8 849 m).",
      "Le Népal a le seul drapeau national qui n'est pas rectangulaire !",
    ],
  },
  {
    id: 'oulan-bator', name: 'Oulan-Bator', country: 'Mongolie', cc: 'mn', iso: '496', continent: 'Asie',
    lat: 47.886, lon: 106.906, level: 2, capital: true, icon: '🐎',
    pop: 'environ 1,7 million', lang: 'Mongol',
    facts: [
      "C'est la capitale la plus froide du monde : l'hiver, il peut y faire -40 °C !",
      "Près de la moitié des habitants de la Mongolie vivent dans cette ville.",
      "Beaucoup de familles habitent dans des yourtes, que les Mongols appellent « ger ».",
    ],
  },
  {
    id: 'new-delhi', name: 'New Delhi', country: 'Inde', cc: 'in', iso: '356', continent: 'Asie',
    lat: 28.614, lon: 77.209, level: 2, capital: true, icon: '🐅',
    pop: "plus de 30 millions avec l'agglomération de Delhi", lang: 'Hindi et anglais',
    facts: [
      "New Delhi est la capitale de l'Inde, le pays le plus peuplé du monde.",
      "India Gate, un grand arc de 42 mètres, rend hommage aux soldats indiens.",
    ],
  },

  // ------------------------------------------------------------- Amérique du Nord
  {
    id: 'new-york', name: 'New York', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 40.713, lon: -74.006, level: 1, capital: false, icon: '🗽',
    pop: 'environ 8,3 millions (20 millions avec la banlieue)', lang: 'Anglais',
    facts: [
      "La statue de la Liberté a été offerte par la France aux États-Unis en 1886.",
      "On surnomme New York « Big Apple », la Grosse Pomme.",
      "Ce n'est pas la capitale des États-Unis : c'est Washington !",
    ],
  },
  {
    id: 'washington', name: 'Washington', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 38.907, lon: -77.037, level: 1, capital: true, icon: '🦅',
    pop: 'environ 700 000', lang: 'Anglais',
    facts: [
      "C'est la capitale des États-Unis : le président y habite, dans la Maison-Blanche.",
      "La ville porte le nom de George Washington, le premier président du pays.",
    ],
  },
  {
    id: 'los-angeles', name: 'Los Angeles', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 34.052, lon: -118.244, level: 1, capital: false, icon: '🎬',
    pop: 'environ 3,8 millions', lang: 'Anglais',
    facts: [
      "Le quartier de Hollywood est la capitale mondiale du cinéma.",
      "Les lettres géantes du panneau HOLLYWOOD mesurent près de 14 mètres de haut.",
    ],
  },
  {
    id: 'montreal', name: 'Montréal', country: 'Canada', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 45.502, lon: -73.567, level: 1, capital: false, icon: '🍁',
    pop: 'environ 1,8 million (4,3 millions avec la banlieue)', lang: 'Français',
    facts: [
      "On y parle français : c'est l'une des plus grandes villes francophones du monde.",
      "Montréal est construite sur une île, au milieu du fleuve Saint-Laurent.",
      "Elle tient son nom du mont Royal, la colline qui domine la ville.",
    ],
  },
  {
    id: 'mexico', name: 'Mexico', country: 'Mexique', cc: 'mx', iso: '484', continent: 'Amérique du Nord',
    lat: 19.433, lon: -99.133, level: 1, capital: true, icon: '🌮',
    pop: 'environ 9 millions (plus de 20 millions avec la banlieue)', lang: 'Espagnol',
    facts: [
      "La ville a été construite sur un lac, à l'emplacement de Tenochtitlan, l'ancienne capitale des Aztèques.",
      "Elle est perchée à 2 240 mètres d'altitude, entourée de volcans.",
    ],
  },
  {
    id: 'toronto', name: 'Toronto', country: 'Canada', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 43.653, lon: -79.383, level: 2, capital: false, icon: '🏒',
    pop: 'environ 3 millions', lang: 'Anglais',
    facts: [
      "La tour CN, haute de 553 mètres, domine la ville.",
      "C'est la plus grande ville du Canada… mais la capitale est Ottawa !",
    ],
  },
  {
    id: 'quebec', name: 'Québec', country: 'Canada', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 46.813, lon: -71.208, level: 2, capital: false, icon: '🏰',
    pop: 'environ 550 000', lang: 'Français',
    facts: [
      "Fondée en 1608 par Samuel de Champlain, c'est l'une des plus anciennes villes d'Amérique du Nord.",
      "C'est la seule ville au nord du Mexique à avoir gardé ses remparts.",
    ],
  },
  {
    id: 'chicago', name: 'Chicago', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 41.878, lon: -87.630, level: 2, capital: false, icon: '🌭',
    pop: 'environ 2,7 millions', lang: 'Anglais',
    facts: [
      "Le tout premier gratte-ciel du monde y a été construit en 1885.",
      "La ville borde le lac Michigan, si grand qu'on dirait la mer !",
    ],
  },
  {
    id: 'san-francisco', name: 'San Francisco', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 37.775, lon: -122.419, level: 2, capital: false, icon: '🌉',
    pop: 'environ 810 000', lang: 'Anglais',
    facts: [
      "Le pont du Golden Gate, inauguré en 1937, est peint en orange pour être bien visible dans le brouillard.",
      "Ses célèbres tramways à câble grimpent des rues très pentues.",
    ],
  },
  {
    id: 'la-havane', name: 'La Havane', country: 'Cuba', cc: 'cu', iso: '192', continent: 'Amérique du Nord',
    lat: 23.113, lon: -82.366, level: 2, capital: true, icon: '🚗',
    pop: 'environ 2,1 millions', lang: 'Espagnol',
    facts: [
      "Dans les rues de La Havane roulent encore de vieilles voitures américaines des années 1950.",
      "Cuba est la plus grande île des Caraïbes.",
    ],
  },
  {
    id: 'nuuk', name: 'Nuuk', country: 'Groenland (Danemark)', cc: 'gl', iso: '304', continent: 'Amérique du Nord',
    lat: 64.181, lon: -51.694, level: 2, capital: true, icon: '🧊',
    pop: 'environ 19 000', lang: 'Groenlandais et danois',
    facts: [
      "Nuuk est la capitale du Groenland, la plus grande île du monde.",
      "Le Groenland est recouvert à près de 80 % par une immense calotte de glace.",
    ],
  },

  // ------------------------------------------------------------- Amérique du Sud
  {
    id: 'rio', name: 'Rio de Janeiro', country: 'Brésil', cc: 'br', iso: '076', continent: 'Amérique du Sud',
    lat: -22.907, lon: -43.173, level: 1, capital: false, icon: '🎭',
    pop: 'environ 6,2 millions', lang: 'Portugais',
    facts: [
      "La statue du Christ Rédempteur, au sommet du Corcovado, mesure 30 mètres (sans son socle).",
      "Son carnaval est l'une des plus grandes fêtes du monde.",
      "Ce n'est pas la capitale du Brésil : c'est Brasília, depuis 1960.",
    ],
  },
  {
    id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentine', cc: 'ar', iso: '032', continent: 'Amérique du Sud',
    lat: -34.604, lon: -58.382, level: 1, capital: true, icon: '💃',
    pop: 'environ 3 millions (15 millions avec la banlieue)', lang: 'Espagnol',
    facts: [
      "Buenos Aires est la ville du tango, une danse née dans ses quartiers à la fin du XIXᵉ siècle.",
      "L'avenue du 9-Juillet est l'une des plus larges du monde.",
    ],
  },
  {
    id: 'lima', name: 'Lima', country: 'Pérou', cc: 'pe', iso: '604', continent: 'Amérique du Sud',
    lat: -12.046, lon: -77.043, level: 2, capital: true, icon: '🌫️',
    pop: 'environ 10 millions', lang: 'Espagnol',
    facts: [
      "Lima a été fondée en 1535 par le conquistador espagnol Francisco Pizarro.",
      "Il n'y pleut presque jamais, mais un brouillard appelé « garúa » recouvre souvent la ville.",
    ],
  },
  {
    id: 'cusco', name: 'Cusco', country: 'Pérou', cc: 'pe', iso: '604', continent: 'Amérique du Sud',
    lat: -13.532, lon: -71.968, level: 2, capital: false, icon: '🦙',
    pop: 'environ 450 000', lang: 'Espagnol et quechua',
    facts: [
      "Cusco était la capitale de l'Empire inca.",
      "C'est le point de départ pour visiter le Machu Picchu, la célèbre cité inca perchée dans les montagnes.",
      "Elle se trouve à 3 400 mètres d'altitude !",
    ],
  },
  {
    id: 'bogota', name: 'Bogota', country: 'Colombie', cc: 'co', iso: '170', continent: 'Amérique du Sud',
    lat: 4.711, lon: -74.072, level: 2, capital: true, icon: '🪙',
    pop: 'environ 7,9 millions', lang: 'Espagnol',
    facts: [
      "Bogota est perchée à environ 2 600 mètres d'altitude, dans la cordillère des Andes.",
      "Son musée de l'Or possède la plus grande collection d'objets en or précolombiens du monde.",
    ],
  },
  {
    id: 'santiago', name: 'Santiago', country: 'Chili', cc: 'cl', iso: '152', continent: 'Amérique du Sud',
    lat: -33.449, lon: -70.669, level: 2, capital: true, icon: '🍇',
    pop: 'environ 7 millions', lang: 'Espagnol',
    facts: [
      "La ville est entourée par la cordillère des Andes, aux sommets enneigés une bonne partie de l'année.",
      "Le Chili est un pays très long et très étroit : plus de 4 000 km du nord au sud !",
    ],
  },
  {
    id: 'la-paz', name: 'La Paz', country: 'Bolivie', cc: 'bo', iso: '068', continent: 'Amérique du Sud',
    lat: -16.490, lon: -68.119, level: 2, capital: true, icon: '🚡',
    pop: 'environ 800 000', lang: 'Espagnol, quechua, aymara…',
    facts: [
      "La Paz est le siège de gouvernement le plus haut du monde, à environ 3 600 mètres d'altitude.",
      "Des télécabines servent de transport en commun pour relier les quartiers !",
    ],
  },
  {
    id: 'brasilia', name: 'Brasília', country: 'Brésil', cc: 'br', iso: '076', continent: 'Amérique du Sud',
    lat: -15.794, lon: -47.882, level: 2, capital: true, icon: '✈️',
    pop: 'environ 2,8 millions', lang: 'Portugais',
    facts: [
      "Brasília a été construite en moins de 4 ans pour devenir la capitale du Brésil en 1960.",
      "Vue du ciel, la ville a la forme d'un avion… ou d'un oiseau !",
    ],
  },
  {
    id: 'manaus', name: 'Manaus', country: 'Brésil', cc: 'br', iso: '076', continent: 'Amérique du Sud',
    lat: -3.119, lon: -60.022, level: 2, capital: false, icon: '🦜',
    pop: 'environ 2,1 millions', lang: 'Portugais',
    facts: [
      "Manaus se trouve au beau milieu de la forêt amazonienne, la plus grande forêt tropicale du monde.",
      "Près de la ville, le Rio Negro sombre et le Solimões clair coulent côte à côte sans se mélanger sur des kilomètres.",
    ],
  },
  {
    id: 'ushuaia', name: 'Ushuaïa', country: 'Argentine', cc: 'ar', iso: '032', continent: 'Amérique du Sud',
    lat: -54.802, lon: -68.303, level: 2, capital: false, icon: '❄️',
    pop: 'environ 80 000', lang: 'Espagnol',
    facts: [
      "On la surnomme « la ville du bout du monde » : c'est l'une des villes les plus au sud de la planète.",
      "C'est d'ici que partent de nombreux bateaux vers l'Antarctique.",
    ],
  },

  // ------------------------------------------------------------- Océanie
  {
    id: 'sydney', name: 'Sydney', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -33.869, lon: 151.209, level: 1, capital: false, icon: '🦘',
    pop: 'environ 5,4 millions', lang: 'Anglais',
    facts: [
      "Son opéra, inauguré en 1973, a des toits qui ressemblent à des voiles de bateau.",
      "Ce n'est pas la capitale de l'Australie : c'est Canberra !",
    ],
  },
  {
    id: 'melbourne', name: 'Melbourne', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -37.814, lon: 144.963, level: 1, capital: false, icon: '🎾',
    pop: 'environ 5,2 millions', lang: 'Anglais',
    facts: [
      "Chaque année, Melbourne accueille l'Open d'Australie, un grand tournoi de tennis.",
      "Avant Canberra, Melbourne a servi de capitale à l'Australie de 1901 à 1927.",
    ],
  },
  {
    id: 'wellington', name: 'Wellington', country: 'Nouvelle-Zélande', cc: 'nz', iso: '554', continent: 'Océanie',
    lat: -41.287, lon: 174.776, level: 2, capital: true, icon: '🥝',
    pop: 'environ 215 000', lang: 'Anglais et maori',
    facts: [
      "C'est la capitale la plus au sud du monde.",
      "On la surnomme « Windy Wellington » tant le vent y souffle fort !",
    ],
  },
  {
    id: 'perth', name: 'Perth', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -31.951, lon: 115.861, level: 2, capital: false, icon: '🌅',
    pop: 'environ 2,2 millions', lang: 'Anglais',
    facts: [
      "Perth est l'une des grandes villes les plus isolées du monde : la plus proche est à plus de 2 000 km !",
      "Sur l'île de Rottnest, tout près, vivent les quokkas, de petits marsupiaux qui ont l'air de sourire.",
    ],
  },
  {
    id: 'noumea', name: 'Nouméa', country: 'Nouvelle-Calédonie (France)', cc: 'nc', iso: '540', continent: 'Océanie',
    lat: -22.276, lon: 166.458, level: 2, capital: false, icon: '🐠',
    pop: 'environ 95 000', lang: 'Français et langues kanak',
    facts: [
      "Nouméa est la plus grande ville de la Nouvelle-Calédonie, un territoire français du Pacifique.",
      "Son lagon, l'un des plus grands du monde, est inscrit au patrimoine mondial de l'UNESCO.",
    ],
  },
  {
    id: 'honolulu', name: 'Honolulu', country: 'États-Unis (Hawaï)', cc: 'us', iso: '840', continent: 'Océanie',
    lat: 21.307, lon: -157.858, level: 2, capital: false, icon: '🏄',
    pop: 'environ 350 000', lang: 'Anglais et hawaïen',
    facts: [
      "Honolulu se trouve sur l'île d'Oahu, dans l'archipel volcanique d'Hawaï, en plein océan Pacifique.",
      "Hawaï est le berceau du surf !",
    ],
  },
];
