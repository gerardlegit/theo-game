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
  {
    id: 'lyon', name: 'Lyon', country: 'France', cc: 'fr', iso: '250', continent: 'Europe',
    lat: 45.764, lon: 4.836, level: 1, capital: false, icon: '🦁',
    pop: 'environ 520 000 (plus de 2 millions avec la banlieue)', lang: 'Français',
    facts: [
      "Les frères Lumière ont inventé le cinématographe à Lyon en 1895 : c'est l'une des naissances du cinéma !",
      "Chaque mois de décembre, la Fête des Lumières illumine la ville de bougies et de projections géantes.",
    ],
  },
  {
    id: 'nice', name: 'Nice', country: 'France', cc: 'fr', iso: '250', continent: 'Europe',
    lat: 43.710, lon: 7.262, level: 1, capital: false, icon: '🏖️',
    pop: 'environ 340 000', lang: 'Français',
    facts: [
      "La promenade des Anglais longe la mer Méditerranée sur environ 7 kilomètres.",
      "Nice n'est devenue française qu'en 1860 ; avant, elle appartenait au royaume de Piémont-Sardaigne.",
    ],
  },
  {
    id: 'dublin', name: 'Dublin', country: 'Irlande', cc: 'ie', iso: '372', continent: 'Europe',
    lat: 53.350, lon: -6.260, level: 1, capital: true, icon: '☘️',
    pop: 'environ 600 000 (1,4 million avec la banlieue)', lang: 'Anglais et irlandais',
    facts: [
      "Le trèfle est le symbole de l'Irlande : on le porte le 17 mars, pour la Saint-Patrick.",
      "La rivière Liffey traverse la ville d'ouest en est et la coupe en deux.",
    ],
  },
  {
    id: 'edimbourg', name: 'Édimbourg', country: 'Royaume-Uni (Écosse)', cc: 'gb', iso: '826', continent: 'Europe',
    lat: 55.953, lon: -3.188, level: 1, capital: false, icon: '🏰',
    pop: 'environ 530 000', lang: 'Anglais',
    facts: [
      "Édimbourg est la capitale de l'Écosse. Son château est perché sur un ancien volcan !",
      "Chaque été, la ville accueille l'un des plus grands festivals de spectacles du monde.",
    ],
  },
  {
    id: 'oslo', name: 'Oslo', country: 'Norvège', cc: 'no', iso: '578', continent: 'Europe',
    lat: 59.913, lon: 10.752, level: 1, capital: true, icon: '⛷️',
    pop: 'environ 700 000', lang: 'Norvégien',
    facts: [
      "C'est à Oslo qu'est remis chaque année le prix Nobel de la paix.",
      "Le tremplin de saut à ski de Holmenkollen domine la ville depuis plus de 100 ans.",
    ],
  },
  {
    id: 'copenhague', name: 'Copenhague', country: 'Danemark', cc: 'dk', iso: '208', continent: 'Europe',
    lat: 55.676, lon: 12.568, level: 1, capital: true, icon: '🧜',
    pop: 'environ 650 000 (1,4 million avec la banlieue)', lang: 'Danois',
    facts: [
      "La statue de la Petite Sirène, inspirée du conte d'Andersen, regarde la mer depuis 1913.",
      "Le jouet LEGO a été inventé au Danemark : son nom vient de « leg godt », qui veut dire « joue bien ».",
    ],
  },
  {
    id: 'varsovie', name: 'Varsovie', country: 'Pologne', cc: 'pl', iso: '616', continent: 'Europe',
    lat: 52.230, lon: 21.012, level: 1, capital: true, icon: '🎹',
    pop: 'environ 1,8 million', lang: 'Polonais',
    facts: [
      "Marie Curie, la scientifique deux fois prix Nobel, est née à Varsovie en 1867.",
      "Le grand compositeur Frédéric Chopin a grandi à Varsovie.",
      "Détruite pendant la Seconde Guerre mondiale, la vieille ville a été entièrement reconstruite à l'identique.",
    ],
  },
  {
    id: 'budapest', name: 'Budapest', country: 'Hongrie', cc: 'hu', iso: '348', continent: 'Europe',
    lat: 47.498, lon: 19.040, level: 1, capital: true, icon: '♨️',
    pop: 'environ 1,7 million', lang: 'Hongrois',
    facts: [
      "Budapest est née de l'union de deux villes, Buda et Pest, séparées par le Danube.",
      "La ville compte de nombreux bains alimentés par des sources d'eau chaude naturelles.",
      "Le Rubik's Cube a été inventé à Budapest en 1974.",
    ],
  },
  {
    id: 'milan', name: 'Milan', country: 'Italie', cc: 'it', iso: '380', continent: 'Europe',
    lat: 45.464, lon: 9.190, level: 1, capital: false, icon: '⚽',
    pop: 'environ 1,4 million', lang: 'Italien',
    facts: [
      "Le Dôme de Milan, une immense cathédrale, est décoré de plus de 3 000 statues !",
      "Milan est une capitale de la mode, et la ville de deux grands clubs de football : l'AC Milan et l'Inter.",
    ],
  },
  {
    id: 'florence', name: 'Florence', country: 'Italie', cc: 'it', iso: '380', continent: 'Europe',
    lat: 43.770, lon: 11.256, level: 1, capital: false, icon: '🖼️',
    pop: 'environ 370 000', lang: 'Italien',
    facts: [
      "Florence est le berceau de la Renaissance : Léonard de Vinci et Michel-Ange y ont travaillé.",
      "La célèbre statue de David, sculptée par Michel-Ange, mesure plus de 5 mètres de haut.",
    ],
  },
  {
    id: 'munich', name: 'Munich', country: 'Allemagne', cc: 'de', iso: '276', continent: 'Europe',
    lat: 48.137, lon: 11.576, level: 1, capital: false, icon: '🥨',
    pop: 'environ 1,5 million', lang: 'Allemand',
    facts: [
      "Chaque automne, Munich accueille l'Oktoberfest, une immense fête populaire.",
      "Le château de Neuschwanstein, qui a inspiré celui de la Belle au bois dormant de Disney, se trouve à deux heures de route.",
    ],
  },
  {
    id: 'saint-petersbourg', name: 'Saint-Pétersbourg', country: 'Russie', cc: 'ru', iso: '643', continent: 'Europe',
    lat: 59.939, lon: 30.316, level: 1, capital: false, icon: '🌉',
    pop: 'environ 5,6 millions', lang: 'Russe',
    facts: [
      "Fondée en 1703 par le tsar Pierre le Grand, elle a été la capitale de la Russie pendant 200 ans.",
      "En juin, il fait presque jour toute la nuit : ce sont les « nuits blanches ».",
    ],
  },
  {
    id: 'porto', name: 'Porto', country: 'Portugal', cc: 'pt', iso: '620', continent: 'Europe',
    lat: 41.158, lon: -8.629, level: 2, capital: false, icon: '🌉',
    pop: 'environ 230 000 (1,7 million avec la banlieue)', lang: 'Portugais',
    facts: [
      "C'est de Porto que vient le nom du Portugal… et celui d'un vin célèbre, le porto !",
      "Les vieilles maisons colorées du quartier de la Ribeira descendent jusqu'au fleuve Douro.",
    ],
  },
  {
    id: 'seville', name: 'Séville', country: 'Espagne', cc: 'es', iso: '724', continent: 'Europe',
    lat: 37.389, lon: -5.984, level: 2, capital: false, icon: '💃',
    pop: 'environ 690 000', lang: 'Espagnol',
    facts: [
      "Séville est la ville du flamenco, une danse rythmée par les claquements de mains et de talons.",
      "C'est d'ici qu'est partie en 1519 l'expédition de Magellan, la première à faire le tour du monde.",
    ],
  },
  {
    id: 'naples', name: 'Naples', country: 'Italie', cc: 'it', iso: '380', continent: 'Europe',
    lat: 40.852, lon: 14.268, level: 2, capital: false, icon: '🍕',
    pop: 'environ 910 000', lang: 'Italien',
    facts: [
      "La pizza est née à Naples ! La pizza Margherita aurait été inventée en 1889 en l'honneur d'une reine.",
      "La ville est dominée par le Vésuve, le volcan qui a enseveli Pompéi en l'an 79.",
    ],
  },
  {
    id: 'pise', name: 'Pise', country: 'Italie', cc: 'it', iso: '380', continent: 'Europe',
    lat: 43.723, lon: 10.397, level: 2, capital: false, icon: '🗼',
    pop: 'environ 90 000', lang: 'Italien',
    facts: [
      "Sa célèbre tour penche parce que le sol sous ses fondations est trop mou.",
      "Le savant Galilée est né à Pise en 1564.",
    ],
  },
  {
    id: 'zurich', name: 'Zurich', country: 'Suisse', cc: 'ch', iso: '756', continent: 'Europe',
    lat: 47.377, lon: 8.542, level: 2, capital: false, icon: '🕰️',
    pop: 'environ 440 000', lang: 'Allemand (suisse)',
    facts: [
      "Zurich est la plus grande ville de Suisse, mais pas la capitale : c'est Berne !",
      "La ville est construite au bord d'un grand lac, avec les Alpes à l'horizon.",
    ],
  },
  {
    id: 'berne', name: 'Berne', country: 'Suisse', cc: 'ch', iso: '756', continent: 'Europe',
    lat: 46.948, lon: 7.447, level: 2, capital: true, icon: '🐻',
    pop: 'environ 140 000', lang: 'Allemand (suisse)',
    facts: [
      "L'ours est le symbole de Berne : de vrais ours vivent dans un parc au bord de la rivière Aar.",
      "C'est à Berne qu'Albert Einstein a imaginé en 1905 sa célèbre théorie de la relativité.",
    ],
  },
  {
    id: 'luxembourg', name: 'Luxembourg', country: 'Luxembourg', cc: 'lu', iso: '442', continent: 'Europe',
    lat: 49.612, lon: 6.130, level: 2, capital: true, icon: '🏰',
    pop: 'environ 135 000', lang: 'Luxembourgeois, français et allemand',
    facts: [
      "Le Luxembourg est l'un des plus petits pays d'Europe, et sa capitale porte le même nom que lui.",
      "Depuis 2020, les bus, les trams et les trains y sont gratuits pour tout le monde !",
    ],
  },
  {
    id: 'monaco', name: 'Monaco', country: 'Monaco', cc: 'mc', iso: '492', continent: 'Europe',
    lat: 43.738, lon: 7.425, level: 2, capital: true, icon: '🏎️',
    pop: 'environ 38 000', lang: 'Français',
    facts: [
      "Monaco est le deuxième plus petit pays du monde, après le Vatican.",
      "Chaque année, des voitures de Formule 1 foncent dans ses rues pendant le Grand Prix.",
    ],
  },
  {
    id: 'strasbourg', name: 'Strasbourg', country: 'France', cc: 'fr', iso: '250', continent: 'Europe',
    lat: 48.573, lon: 7.752, level: 2, capital: false, icon: '🎄',
    pop: 'environ 290 000', lang: 'Français (et alsacien)',
    facts: [
      "Son marché de Noël, créé en 1570, est l'un des plus anciens d'Europe.",
      "Strasbourg accueille le Parlement européen, où se réunissent des députés de toute l'Union européenne.",
    ],
  },
  {
    id: 'bordeaux', name: 'Bordeaux', country: 'France', cc: 'fr', iso: '250', continent: 'Europe',
    lat: 44.838, lon: -0.579, level: 2, capital: false, icon: '🍇',
    pop: 'environ 260 000', lang: 'Français',
    facts: [
      "Bordeaux est célèbre dans le monde entier pour ses vignobles.",
      "Sur la place de la Bourse, le « miroir d'eau » reflète les façades : on peut y marcher et s'y rafraîchir l'été.",
    ],
  },
  {
    id: 'ajaccio', name: 'Ajaccio', country: 'France (Corse)', cc: 'fr', iso: '250', continent: 'Europe',
    lat: 41.919, lon: 8.739, level: 2, capital: false, icon: '🎖️',
    pop: 'environ 75 000', lang: 'Français et corse',
    facts: [
      "Napoléon Bonaparte est né à Ajaccio en 1769.",
      "La Corse est surnommée « l'île de Beauté » pour ses montagnes et ses plages.",
    ],
  },
  {
    id: 'cracovie', name: 'Cracovie', country: 'Pologne', cc: 'pl', iso: '616', continent: 'Europe',
    lat: 50.065, lon: 19.945, level: 2, capital: false, icon: '🐉',
    pop: 'environ 800 000', lang: 'Polonais',
    facts: [
      "Selon la légende, un dragon vivait dans une grotte sous le château de Wawel… sa statue crache même du feu !",
      "Cracovie a été la capitale de la Pologne pendant plusieurs siècles.",
    ],
  },
  {
    id: 'kyiv', name: 'Kyiv (Kiev)', country: 'Ukraine', cc: 'ua', iso: '804', continent: 'Europe',
    lat: 50.450, lon: 30.523, level: 2, capital: true, icon: '🌻',
    pop: 'environ 3 millions', lang: 'Ukrainien',
    facts: [
      "Le tournesol est la fleur nationale de l'Ukraine, l'un des plus grands producteurs de tournesol du monde.",
      "La ville est traversée par le Dniepr, l'un des plus longs fleuves d'Europe.",
    ],
  },
  {
    id: 'bucarest', name: 'Bucarest', country: 'Roumanie', cc: 'ro', iso: '642', continent: 'Europe',
    lat: 44.427, lon: 26.103, level: 2, capital: true, icon: '🧛',
    pop: 'environ 1,8 million', lang: 'Roumain',
    facts: [
      "Le palais du Parlement de Bucarest est l'un des plus grands bâtiments du monde !",
      "La Roumanie est le pays de la légende de Dracula, inspirée d'un vrai prince de Valachie.",
    ],
  },
  {
    id: 'dubrovnik', name: 'Dubrovnik', country: 'Croatie', cc: 'hr', iso: '191', continent: 'Europe',
    lat: 42.650, lon: 18.094, level: 2, capital: false, icon: '🧱',
    pop: 'environ 40 000', lang: 'Croate',
    facts: [
      "Dubrovnik est entourée de remparts de près de 2 km : on peut faire tout le tour de la vieille ville par le haut.",
      "On la surnomme « la perle de l'Adriatique ».",
    ],
  },
  {
    id: 'tallinn', name: 'Tallinn', country: 'Estonie', cc: 'ee', iso: '233', continent: 'Europe',
    lat: 59.437, lon: 24.754, level: 2, capital: true, icon: '💻',
    pop: 'environ 450 000', lang: 'Estonien',
    facts: [
      "La vieille ville de Tallinn, avec ses tours pointues, ressemble à un décor de conte de fées.",
      "Le logiciel d'appels vidéo Skype a été créé par des programmeurs estoniens.",
    ],
  },
  {
    id: 'bergen', name: 'Bergen', country: 'Norvège', cc: 'no', iso: '578', continent: 'Europe',
    lat: 60.391, lon: 5.322, level: 2, capital: false, icon: '🐟',
    pop: 'environ 290 000', lang: 'Norvégien',
    facts: [
      "Bergen est entourée de sept montagnes et de fjords spectaculaires.",
      "C'est l'une des villes les plus pluvieuses d'Europe : il y pleut plus de 200 jours par an !",
      "Les maisons en bois colorées du vieux port ont inspiré le royaume d'Arendelle dans La Reine des neiges.",
    ],
  },
  {
    id: 'rovaniemi', name: 'Rovaniemi', country: 'Finlande', cc: 'fi', iso: '246', continent: 'Europe',
    lat: 66.503, lon: 25.729, level: 2, capital: false, icon: '🎅',
    pop: 'environ 65 000', lang: 'Finnois',
    facts: [
      "Rovaniemi se trouve juste sur le cercle polaire arctique.",
      "C'est la ville officielle du Père Noël : on peut visiter son village toute l'année !",
    ],
  },
  {
    id: 'liverpool', name: 'Liverpool', country: 'Royaume-Uni', cc: 'gb', iso: '826', continent: 'Europe',
    lat: 53.408, lon: -2.991, level: 2, capital: false, icon: '🎸',
    pop: 'environ 500 000', lang: 'Anglais',
    facts: [
      "Liverpool est la ville des Beatles, l'un des groupes de musique les plus célèbres de l'histoire.",
      "C'est un grand port : le Titanic y était immatriculé, même s'il est parti de Southampton.",
    ],
  },
  {
    id: 'hambourg', name: 'Hambourg', country: 'Allemagne', cc: 'de', iso: '276', continent: 'Europe',
    lat: 53.551, lon: 9.994, level: 2, capital: false, icon: '🚂',
    pop: 'environ 1,9 million', lang: 'Allemand',
    facts: [
      "Hambourg compte environ 2 500 ponts, plus que Venise et Amsterdam réunies !",
      "On y trouve le Miniatur Wunderland, le plus grand réseau de trains miniatures du monde.",
    ],
  },
  {
    id: 'salzbourg', name: 'Salzbourg', country: 'Autriche', cc: 'at', iso: '040', continent: 'Europe',
    lat: 47.809, lon: 13.055, level: 2, capital: false, icon: '🎼',
    pop: 'environ 155 000', lang: 'Allemand',
    facts: [
      "Le compositeur Mozart est né à Salzbourg en 1756.",
      "Son nom veut dire « château du sel » : la région s'est enrichie grâce à ses mines de sel.",
    ],
  },
  {
    id: 'la-valette', name: 'La Valette', country: 'Malte', cc: 'mt', iso: '470', continent: 'Europe',
    lat: 35.899, lon: 14.514, level: 2, capital: true, icon: '⚓',
    pop: 'environ 6 000', lang: 'Maltais et anglais',
    facts: [
      "La Valette est la plus petite capitale de l'Union européenne.",
      "Elle a été construite au XVIe siècle par les chevaliers de l'ordre de Malte.",
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
  {
    id: 'casablanca', name: 'Casablanca', country: 'Maroc', cc: 'ma', iso: '504', continent: 'Afrique',
    lat: 33.573, lon: -7.590, level: 1, capital: false, icon: '🕌',
    pop: 'environ 3,5 millions', lang: 'Arabe et berbère',
    facts: [
      "La mosquée Hassan II a un minaret de 210 mètres, l'un des plus hauts du monde. Elle est en partie construite au-dessus de l'océan !",
      "C'est la plus grande ville du Maroc, mais pas la capitale : c'est Rabat !",
    ],
  },
  {
    id: 'tunis', name: 'Tunis', country: 'Tunisie', cc: 'tn', iso: '788', continent: 'Afrique',
    lat: 36.806, lon: 10.181, level: 1, capital: true, icon: '🏛️',
    pop: 'environ 700 000 (2,7 millions avec la banlieue)', lang: 'Arabe',
    facts: [
      "Tout près de Tunis se trouvent les ruines de Carthage, une puissante cité de l'Antiquité.",
      "Le général carthaginois Hannibal a traversé les Alpes avec des éléphants pour attaquer Rome !",
      "La médina, la vieille ville, est un labyrinthe de ruelles et de souks.",
    ],
  },
  {
    id: 'johannesburg', name: 'Johannesburg', country: 'Afrique du Sud', cc: 'za', iso: '710', continent: 'Afrique',
    lat: -26.204, lon: 28.047, level: 1, capital: false, icon: '⛏️',
    pop: 'environ 5,6 millions', lang: 'Anglais, zoulou et bien d\'autres',
    facts: [
      "La ville est née en 1886 de la ruée vers l'or : on a découvert ici l'un des plus grands gisements d'or du monde.",
      "Nelson Mandela, prix Nobel de la paix, a longtemps vécu à Soweto, un quartier de Johannesburg.",
    ],
  },
  {
    id: 'abidjan', name: 'Abidjan', country: "Côte d'Ivoire", cc: 'ci', iso: '384', continent: 'Afrique',
    lat: 5.360, lon: -4.008, level: 1, capital: false, icon: '🍫',
    pop: 'environ 5,6 millions', lang: 'Français',
    facts: [
      "La Côte d'Ivoire est le premier producteur de cacao du monde : c'est avec lui qu'on fait le chocolat !",
      "Abidjan est la plus grande ville du pays, mais la capitale officielle est Yamoussoukro.",
    ],
  },
  {
    id: 'louxor', name: 'Louxor', country: 'Égypte', cc: 'eg', iso: '818', continent: 'Afrique',
    lat: 25.687, lon: 32.640, level: 1, capital: false, icon: '🏺',
    pop: 'environ 500 000', lang: 'Arabe',
    facts: [
      "Louxor est construite sur l'ancienne Thèbes, une capitale des pharaons.",
      "Dans la Vallée des Rois, juste en face, on a découvert en 1922 le tombeau de Toutankhamon et son trésor.",
    ],
  },
  {
    id: 'zanzibar', name: 'Zanzibar', country: 'Tanzanie', cc: 'tz', iso: '834', continent: 'Afrique',
    lat: -6.165, lon: 39.199, level: 1, capital: false, icon: '🌶️',
    pop: 'plus de 200 000', lang: 'Swahili',
    facts: [
      "Zanzibar est surnommée « l'île aux épices » : on y cultive le clou de girofle, la cannelle et la vanille.",
      "Sa vieille ville, Stone Town, est faite de maisons de pierre aux portes en bois sculpté.",
      "Le chanteur Freddie Mercury, du groupe Queen, est né à Zanzibar en 1946.",
    ],
  },
  {
    id: 'accra', name: 'Accra', country: 'Ghana', cc: 'gh', iso: '288', continent: 'Afrique',
    lat: 5.604, lon: -0.187, level: 1, capital: true, icon: '🥁',
    pop: 'environ 2,5 millions', lang: 'Anglais (et twi, ga…)',
    facts: [
      "Le point où se croisent l'équateur et le méridien de Greenwich (0° – 0°) se trouve dans l'océan, au sud du Ghana.",
      "À Accra, certains cercueils sont sculptés en forme de poisson, d'avion ou de voiture !",
    ],
  },
  {
    id: 'fes', name: 'Fès', country: 'Maroc', cc: 'ma', iso: '504', continent: 'Afrique',
    lat: 34.033, lon: -5.000, level: 2, capital: false, icon: '🧶',
    pop: 'environ 1,2 million', lang: 'Arabe et berbère',
    facts: [
      "Sa médina est l'un des plus grands quartiers sans voitures du monde : on y transporte les marchandises à dos d'âne.",
      "Dans les tanneries de Fès, on teint les cuirs dans de grandes cuves colorées, comme une palette de peinture géante.",
    ],
  },
  {
    id: 'alexandrie', name: 'Alexandrie', country: 'Égypte', cc: 'eg', iso: '818', continent: 'Afrique',
    lat: 31.200, lon: 29.918, level: 2, capital: false, icon: '📚',
    pop: 'environ 5,5 millions', lang: 'Arabe',
    facts: [
      "Elle a été fondée par Alexandre le Grand il y a plus de 2 300 ans.",
      "Son phare, haut d'une centaine de mètres, était l'une des Sept Merveilles du monde antique.",
      "Sa bibliothèque antique était la plus grande du monde de l'époque.",
    ],
  },
  {
    id: 'assouan', name: 'Assouan', country: 'Égypte', cc: 'eg', iso: '818', continent: 'Afrique',
    lat: 24.089, lon: 32.899, level: 2, capital: false, icon: '⛵',
    pop: 'environ 300 000', lang: 'Arabe et nubien',
    facts: [
      "À Assouan, le Nil est parsemé d'îles et de felouques, des bateaux à voile traditionnels.",
      "Au sud de la ville, le grand barrage a créé le lac Nasser, l'un des plus grands lacs artificiels du monde.",
    ],
  },
  {
    id: 'khartoum', name: 'Khartoum', country: 'Soudan', cc: 'sd', iso: '729', continent: 'Afrique',
    lat: 15.501, lon: 32.560, level: 2, capital: true, icon: '🌊',
    pop: 'environ 6 millions avec son agglomération', lang: 'Arabe et anglais',
    facts: [
      "À Khartoum, le Nil Blanc et le Nil Bleu se rejoignent pour former le Nil.",
      "Le Soudan compte plus de pyramides que l'Égypte !",
    ],
  },
  {
    id: 'dar-es-salaam', name: 'Dar es Salaam', country: 'Tanzanie', cc: 'tz', iso: '834', continent: 'Afrique',
    lat: -6.792, lon: 39.208, level: 2, capital: false, icon: '🐠',
    pop: 'plus de 5 millions', lang: 'Swahili et anglais',
    facts: [
      "Son nom veut dire « la maison de la paix » en arabe.",
      "C'est la plus grande ville de Tanzanie, mais la capitale officielle est Dodoma.",
    ],
  },
  {
    id: 'kampala', name: 'Kampala', country: 'Ouganda', cc: 'ug', iso: '800', continent: 'Afrique',
    lat: 0.348, lon: 32.582, level: 2, capital: true, icon: '🦍',
    pop: 'environ 1,7 million (bien plus avec la banlieue)', lang: 'Anglais, swahili et luganda',
    facts: [
      "Kampala est presque sur l'équateur, tout près du lac Victoria, le plus grand lac d'Afrique.",
      "L'Ouganda abrite environ la moitié des derniers gorilles des montagnes de la planète.",
    ],
  },
  {
    id: 'kigali', name: 'Kigali', country: 'Rwanda', cc: 'rw', iso: '646', continent: 'Afrique',
    lat: -1.944, lon: 30.062, level: 2, capital: true, icon: '🌿',
    pop: 'environ 1,7 million', lang: 'Kinyarwanda, anglais, français et swahili',
    facts: [
      "Kigali est réputée pour être l'une des villes les plus propres d'Afrique.",
      "Le Rwanda est surnommé « le pays des mille collines ».",
    ],
  },
  {
    id: 'arusha', name: 'Arusha', country: 'Tanzanie', cc: 'tz', iso: '834', continent: 'Afrique',
    lat: -3.387, lon: 36.683, level: 2, capital: false, icon: '🦓',
    pop: 'environ 600 000', lang: 'Swahili',
    facts: [
      "Arusha est la porte d'entrée des grands safaris : le parc du Serengeti et le cratère du Ngorongoro ne sont pas loin.",
      "Le Kilimandjaro, la plus haute montagne d'Afrique (5 895 m), se trouve à moins de 100 km.",
    ],
  },
  {
    id: 'livingstone', name: 'Livingstone', country: 'Zambie', cc: 'zm', iso: '894', continent: 'Afrique',
    lat: -17.842, lon: 25.854, level: 2, capital: false, icon: '💦',
    pop: 'environ 180 000', lang: 'Anglais',
    facts: [
      "Tout près se trouvent les chutes Victoria, que les habitants appellent « la fumée qui gronde ».",
      "La ville porte le nom de David Livingstone, un explorateur écossais qui a vu les chutes en 1855.",
    ],
  },
  {
    id: 'windhoek', name: 'Windhoek', country: 'Namibie', cc: 'na', iso: '516', continent: 'Afrique',
    lat: -22.560, lon: 17.083, level: 2, capital: true, icon: '🏜️',
    pop: 'environ 450 000', lang: 'Anglais (et afrikaans, allemand, oshiwambo…)',
    facts: [
      "La Namibie abrite le désert du Namib, l'un des plus vieux déserts du monde, avec des dunes rouges géantes.",
      "La Namibie est l'un des pays les moins peuplés du monde par rapport à sa taille.",
    ],
  },
  {
    id: 'durban', name: 'Durban', country: 'Afrique du Sud', cc: 'za', iso: '710', continent: 'Afrique',
    lat: -29.858, lon: 31.022, level: 2, capital: false, icon: '🏄',
    pop: 'environ 3,9 millions avec sa région', lang: 'Anglais et zoulou',
    facts: [
      "Durban est un grand port sur l'océan Indien, aux eaux chaudes toute l'année.",
      "On y mange le « bunny chow », un demi-pain creusé et rempli de curry !",
    ],
  },
  {
    id: 'brazzaville', name: 'Brazzaville', country: 'République du Congo', cc: 'cg', iso: '178', continent: 'Afrique',
    lat: -4.263, lon: 15.242, level: 2, capital: true, icon: '🛶',
    pop: 'environ 2 millions', lang: 'Français (et lingala, kituba)',
    facts: [
      "Brazzaville et Kinshasa se font face de part et d'autre du fleuve Congo : ce sont les capitales les plus proches du monde, après Rome et le Vatican.",
      "La ville porte le nom de l'explorateur Pierre Savorgnan de Brazza.",
    ],
  },
  {
    id: 'yaounde', name: 'Yaoundé', country: 'Cameroun', cc: 'cm', iso: '120', continent: 'Afrique',
    lat: 3.848, lon: 11.502, level: 2, capital: true, icon: '⛰️',
    pop: 'environ 4 millions', lang: 'Français et anglais',
    facts: [
      "Yaoundé est construite sur sept collines.",
      "Le Cameroun est surnommé « l'Afrique en miniature » : on y trouve désert, savane, forêt, montagnes et plages.",
    ],
  },
  {
    id: 'ouagadougou', name: 'Ouagadougou', country: 'Burkina Faso', cc: 'bf', iso: '854', continent: 'Afrique',
    lat: 12.371, lon: -1.520, level: 2, capital: true, icon: '🎬',
    pop: 'environ 3 millions', lang: 'Français et mooré',
    facts: [
      "Tous les deux ans, Ouagadougou accueille le FESPACO, le plus grand festival de cinéma africain.",
      "Le nom « Burkina Faso » veut dire « le pays des hommes intègres ».",
    ],
  },
  {
    id: 'bamako', name: 'Bamako', country: 'Mali', cc: 'ml', iso: '466', continent: 'Afrique',
    lat: 12.639, lon: -8.003, level: 2, capital: true, icon: '🎶',
    pop: 'environ 3 millions', lang: 'Bambara (et beaucoup d\'autres langues)',
    facts: [
      "Bamako est traversée par le Niger, le troisième plus long fleuve d'Afrique.",
      "Le Mali est une terre de musique : de nombreux grands musiciens y sont nés.",
    ],
  },
  {
    id: 'nouakchott', name: 'Nouakchott', country: 'Mauritanie', cc: 'mr', iso: '478', continent: 'Afrique',
    lat: 18.079, lon: -15.965, level: 2, capital: true, icon: '🐪',
    pop: 'environ 1,5 million', lang: 'Arabe',
    facts: [
      "Nouakchott n'était qu'un petit village avant d'être choisie comme capitale à la fin des années 1950.",
      "La ville est coincée entre l'océan Atlantique et le désert du Sahara.",
    ],
  },
  {
    id: 'port-louis', name: 'Port-Louis', country: 'Maurice', cc: 'mu', iso: '480', continent: 'Afrique',
    lat: -20.161, lon: 57.499, level: 2, capital: true, icon: '🐢',
    pop: 'environ 150 000', lang: 'Créole mauricien, anglais et français',
    facts: [
      "L'île Maurice était la seule maison du dodo, un gros oiseau qui ne volait pas et qui a disparu vers 1680.",
      "Elle se trouve dans l'océan Indien, à environ 200 km de La Réunion.",
    ],
  },
  {
    id: 'luanda', name: 'Luanda', country: 'Angola', cc: 'ao', iso: '024', continent: 'Afrique',
    lat: -8.839, lon: 13.289, level: 2, capital: true, icon: '🌴',
    pop: 'environ 9 millions avec son agglomération', lang: 'Portugais',
    facts: [
      "On y parle portugais, car l'Angola a été une colonie du Portugal pendant des siècles.",
      "Au large, les eaux de l'Atlantique cachent du pétrole, la grande richesse du pays.",
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
  {
    id: 'osaka', name: 'Osaka', country: 'Japon', cc: 'jp', iso: '392', continent: 'Asie',
    lat: 34.694, lon: 135.502, level: 1, capital: false, icon: '🐙',
    pop: 'environ 2,7 millions', lang: 'Japonais',
    facts: [
      "Osaka est surnommée « la cuisine du Japon » : on y mange les takoyaki, des boulettes au poulpe.",
      "Son château, entouré de douves et de hauts murs de pierre, est l'un des plus célèbres du pays.",
    ],
  },
  {
    id: 'hiroshima', name: 'Hiroshima', country: 'Japon', cc: 'jp', iso: '392', continent: 'Asie',
    lat: 34.385, lon: 132.455, level: 1, capital: false, icon: '🕊️',
    pop: 'environ 1,2 million', lang: 'Japonais',
    facts: [
      "En 1945, Hiroshima a été détruite par une bombe atomique. Reconstruite, elle est devenue une ville symbole de la paix.",
      "Tout près, sur l'île de Miyajima, un grand portail rouge (un torii) semble flotter sur la mer à marée haute.",
    ],
  },
  {
    id: 'hanoi', name: 'Hanoï', country: 'Viêt Nam', cc: 'vn', iso: '704', continent: 'Asie',
    lat: 21.028, lon: 105.854, level: 1, capital: true, icon: '🛵',
    pop: 'environ 8 millions', lang: 'Vietnamien',
    facts: [
      "Des millions de scooters circulent dans les rues de Hanoï !",
      "Au cœur de la ville, le lac Hoan Kiem est lié à la légende d'une tortue géante et d'une épée magique.",
    ],
  },
  {
    id: 'manille', name: 'Manille', country: 'Philippines', cc: 'ph', iso: '608', continent: 'Asie',
    lat: 14.599, lon: 120.984, level: 1, capital: true, icon: '🥭',
    pop: 'environ 1,8 million (plus de 13 millions avec la banlieue)', lang: 'Filipino et anglais',
    facts: [
      "Les Philippines sont un archipel de plus de 7 000 îles !",
      "Manille est l'une des villes les plus densément peuplées du monde.",
    ],
  },
  {
    id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaisie', cc: 'my', iso: '458', continent: 'Asie',
    lat: 3.139, lon: 101.687, level: 1, capital: true, icon: '🏙️',
    pop: 'environ 2 millions', lang: 'Malais',
    facts: [
      "Les tours Petronas, deux gratte-ciel jumeaux de 452 mètres, ont été les plus hautes du monde de 1998 à 2004.",
      "Son nom veut dire « confluent boueux » : la ville est née là où deux rivières se rejoignent.",
    ],
  },
  {
    id: 'agra', name: 'Agra', country: 'Inde', cc: 'in', iso: '356', continent: 'Asie',
    lat: 27.176, lon: 78.008, level: 1, capital: false, icon: '🕌',
    pop: 'environ 1,6 million', lang: 'Hindi',
    facts: [
      "Le Taj Mahal, en marbre blanc, a été construit par un empereur en souvenir de sa femme bien-aimée.",
      "Sa construction a demandé environ 20 000 ouvriers et une vingtaine d'années de travail.",
    ],
  },
  {
    id: 'la-mecque', name: 'La Mecque', country: 'Arabie saoudite', cc: 'sa', iso: '682', continent: 'Asie',
    lat: 21.389, lon: 39.858, level: 1, capital: false, icon: '🕋',
    pop: 'environ 2 millions', lang: 'Arabe',
    facts: [
      "La Mecque est la ville la plus sainte de l'islam : chaque année, des millions de pèlerins y viennent.",
      "Au centre de la Grande Mosquée se trouve la Kaaba, un grand cube recouvert d'un tissu noir brodé d'or.",
    ],
  },
  {
    id: 'taipei', name: 'Taipei', country: 'Taïwan', cc: 'tw', iso: '158', continent: 'Asie',
    lat: 25.033, lon: 121.565, level: 1, capital: false, icon: '🥟',
    pop: 'environ 2,5 millions', lang: 'Chinois (mandarin)',
    facts: [
      "La tour Taipei 101, haute de 508 mètres, a été le plus haut gratte-ciel du monde de 2004 à 2010.",
      "Le thé aux perles (bubble tea), avec ses billes de tapioca, a été inventé à Taïwan.",
    ],
  },
  {
    id: 'doha', name: 'Doha', country: 'Qatar', cc: 'qa', iso: '634', continent: 'Asie',
    lat: 25.285, lon: 51.531, level: 1, capital: true, icon: '⚽',
    pop: 'environ 1,2 million', lang: 'Arabe',
    facts: [
      "En 2022, Doha a accueilli la Coupe du monde de football, la première organisée au Moyen-Orient.",
      "Le Qatar est une presqu'île presque entièrement couverte de désert.",
    ],
  },
  {
    id: 'teheran', name: 'Téhéran', country: 'Iran', cc: 'ir', iso: '364', continent: 'Asie',
    lat: 35.689, lon: 51.389, level: 1, capital: true, icon: '🏔️',
    pop: 'environ 9 millions', lang: 'Persan',
    facts: [
      "Au nord de Téhéran se dressent les monts Elbourz : on peut y skier en hiver !",
      "Les tapis persans, tissés à la main, sont célèbres dans le monde entier.",
    ],
  },
  {
    id: 'bagdad', name: 'Bagdad', country: 'Irak', cc: 'iq', iso: '368', continent: 'Asie',
    lat: 33.315, lon: 44.366, level: 1, capital: true, icon: '🧞',
    pop: 'environ 7 millions', lang: 'Arabe et kurde',
    facts: [
      "Bagdad est le décor de nombreux contes des Mille et Une Nuits, comme ceux de Sinbad le marin.",
      "Il y a plus de 1 000 ans, c'était l'une des plus grandes villes du monde et un grand centre de savoir.",
    ],
  },
  {
    id: 'varanasi', name: 'Bénarès (Varanasi)', country: 'Inde', cc: 'in', iso: '356', continent: 'Asie',
    lat: 25.318, lon: 82.974, level: 2, capital: false, icon: '🕯️',
    pop: 'environ 1,5 million', lang: 'Hindi',
    facts: [
      "Bénarès est l'une des plus vieilles villes du monde encore habitées.",
      "Chaque jour, des pèlerins descendent les grands escaliers des ghats pour se baigner dans le Gange, un fleuve sacré.",
    ],
  },
  {
    id: 'jaipur', name: 'Jaipur', country: 'Inde', cc: 'in', iso: '356', continent: 'Asie',
    lat: 26.912, lon: 75.787, level: 2, capital: false, icon: '🐘',
    pop: 'environ 3 millions', lang: 'Hindi',
    facts: [
      "On la surnomme « la ville rose » : en 1876, elle a été peinte en rose pour accueillir un prince anglais.",
      "Le palais des Vents a 953 petites fenêtres pour que les dames de la cour puissent regarder la rue sans être vues.",
    ],
  },
  {
    id: 'colombo', name: 'Colombo', country: 'Sri Lanka', cc: 'lk', iso: '144', continent: 'Asie',
    lat: 6.927, lon: 79.861, level: 2, capital: false, icon: '🍵',
    pop: 'environ 750 000', lang: 'Cinghalais et tamoul',
    facts: [
      "Le Sri Lanka est l'un des plus grands producteurs de thé du monde : c'est le fameux thé de Ceylan.",
      "Colombo est la plus grande ville du pays ; la capitale officielle, Sri Jayawardenapura Kotte, est juste à côté.",
    ],
  },
  {
    id: 'male', name: 'Malé', country: 'Maldives', cc: 'mv', iso: '462', continent: 'Asie',
    lat: 4.175, lon: 73.509, level: 2, capital: true, icon: '🏝️',
    pop: 'environ 210 000', lang: 'Divehi',
    facts: [
      "Les Maldives comptent environ 1 200 îles de corail, si plates que le point le plus haut dépasse à peine 2 mètres !",
      "Malé est l'une des villes les plus densément peuplées du monde : les maisons couvrent toute l'île.",
    ],
  },
  {
    id: 'dacca', name: 'Dacca (Dhaka)', country: 'Bangladesh', cc: 'bd', iso: '050', continent: 'Asie',
    lat: 23.811, lon: 90.413, level: 2, capital: true, icon: '🚲',
    pop: 'environ 10 millions (plus de 20 millions avec la banlieue)', lang: 'Bengali',
    facts: [
      "On surnomme Dacca « la capitale mondiale du rickshaw » : des centaines de milliers de vélos-taxis y circulent.",
      "Le Bangladesh est traversé par d'immenses fleuves, comme le Gange et le Brahmapoutre.",
    ],
  },
  {
    id: 'karachi', name: 'Karachi', country: 'Pakistan', cc: 'pk', iso: '586', continent: 'Asie',
    lat: 24.861, lon: 67.010, level: 2, capital: false, icon: '🏏',
    pop: 'environ 17 millions', lang: 'Ourdou, sindhi et anglais',
    facts: [
      "Karachi est la plus grande ville du Pakistan, mais la capitale est Islamabad.",
      "Comme dans tout le Pakistan, le cricket y est le sport roi.",
    ],
  },
  {
    id: 'samarcande', name: 'Samarcande', country: 'Ouzbékistan', cc: 'uz', iso: '860', continent: 'Asie',
    lat: 39.654, lon: 66.976, level: 2, capital: false, icon: '🐫',
    pop: 'environ 550 000', lang: 'Ouzbek',
    facts: [
      "Samarcande était une grande étape de la route de la soie, qui reliait la Chine à l'Europe.",
      "Sa place du Registan est entourée de trois grandes écoles décorées de mosaïques bleues étincelantes.",
    ],
  },
  {
    id: 'almaty', name: 'Almaty', country: 'Kazakhstan', cc: 'kz', iso: '398', continent: 'Asie',
    lat: 43.238, lon: 76.946, level: 2, capital: false, icon: '🍎',
    pop: 'environ 2,2 millions', lang: 'Kazakh et russe',
    facts: [
      "Les pommes sont originaires des montagnes autour d'Almaty, où poussent encore des pommiers sauvages.",
      "Almaty a été la capitale du Kazakhstan jusqu'en 1997, avant Astana.",
    ],
  },
  {
    id: 'bakou', name: 'Bakou', country: 'Azerbaïdjan', cc: 'az', iso: '031', continent: 'Asie',
    lat: 40.409, lon: 49.867, level: 2, capital: true, icon: '🔥',
    pop: 'environ 2,3 millions', lang: 'Azerbaïdjanais',
    facts: [
      "L'Azerbaïdjan est surnommé « le pays du feu » : près de Bakou, une colline brûle sans arrêt grâce au gaz qui sort du sol.",
      "Bakou est au bord de la mer Caspienne, le plus grand lac du monde, et se trouve sous le niveau de la mer !",
    ],
  },
  {
    id: 'tbilissi', name: 'Tbilissi', country: 'Géorgie', cc: 'ge', iso: '268', continent: 'Asie',
    lat: 41.716, lon: 44.783, level: 2, capital: true, icon: '♨️',
    pop: 'environ 1,2 million', lang: 'Géorgien',
    facts: [
      "Son nom vient d'un mot géorgien qui veut dire « chaud », à cause de ses sources d'eau chaude.",
      "La Géorgie a son propre alphabet, aux lettres toutes arrondies.",
    ],
  },
  {
    id: 'beyrouth', name: 'Beyrouth', country: 'Liban', cc: 'lb', iso: '422', continent: 'Asie',
    lat: 33.894, lon: 35.502, level: 2, capital: true, icon: '🌲',
    pop: 'environ 2,4 millions avec son agglomération', lang: 'Arabe (on y parle aussi beaucoup français)',
    facts: [
      "Le cèdre, un grand arbre majestueux, est le symbole du Liban : il figure au centre de son drapeau.",
      "Beyrouth est l'une des plus vieilles villes du monde : elle existe depuis plus de 5 000 ans.",
    ],
  },
  {
    id: 'amman', name: 'Amman', country: 'Jordanie', cc: 'jo', iso: '400', continent: 'Asie',
    lat: 31.954, lon: 35.911, level: 2, capital: true, icon: '🏜️',
    pop: 'environ 4 millions', lang: 'Arabe',
    facts: [
      "Plus au sud, la Jordanie abrite Pétra, une ville entière taillée dans la roche rose.",
      "Pas loin d'Amman, la mer Morte est si salée qu'on y flotte sans effort ! Ses rives sont le point le plus bas de la Terre.",
    ],
  },
  {
    id: 'riyad', name: 'Riyad', country: 'Arabie saoudite', cc: 'sa', iso: '682', continent: 'Asie',
    lat: 24.713, lon: 46.675, level: 2, capital: true, icon: '🌴',
    pop: 'environ 7 millions', lang: 'Arabe',
    facts: [
      "Riyad se trouve en plein désert, au centre de la péninsule Arabique.",
      "Son nom veut dire « les jardins » : il y avait autrefois des oasis à cet endroit.",
    ],
  },
  {
    id: 'mascate', name: 'Mascate', country: 'Oman', cc: 'om', iso: '512', continent: 'Asie',
    lat: 23.588, lon: 58.383, level: 2, capital: true, icon: '🏰',
    pop: 'environ 1,5 million', lang: 'Arabe',
    facts: [
      "Mascate est entourée de montagnes rocheuses et gardée par de vieux forts.",
      "Oman est réputé pour l'encens, une résine parfumée récoltée sur un arbre depuis des milliers d'années.",
    ],
  },
  {
    id: 'lhassa', name: 'Lhassa', country: 'Chine (Tibet)', cc: 'cn', iso: '156', continent: 'Asie',
    lat: 29.652, lon: 91.172, level: 2, capital: false, icon: '🏔️',
    pop: 'environ 900 000', lang: 'Tibétain et chinois',
    facts: [
      "Lhassa est l'une des villes les plus hautes du monde : elle est à environ 3 650 mètres d'altitude.",
      "Le palais du Potala, avec plus de 1 000 pièces, domine la ville.",
    ],
  },
  {
    id: 'xian', name: "Xi'an", country: 'Chine', cc: 'cn', iso: '156', continent: 'Asie',
    lat: 34.341, lon: 108.940, level: 2, capital: false, icon: '⚔️',
    pop: 'environ 13 millions', lang: 'Chinois (mandarin)',
    facts: [
      "Près de Xi'an, des paysans ont découvert en 1974 l'armée de terre cuite : des milliers de soldats en argile !",
      "Xi'an était le point de départ de la route de la soie.",
    ],
  },
  {
    id: 'ho-chi-minh', name: 'Hô Chi Minh-Ville', country: 'Viêt Nam', cc: 'vn', iso: '704', continent: 'Asie',
    lat: 10.823, lon: 106.630, level: 2, capital: false, icon: '🍜',
    pop: 'environ 9 millions', lang: 'Vietnamien',
    facts: [
      "On l'appelait autrefois Saïgon, et beaucoup d'habitants utilisent encore ce nom.",
      "C'est la plus grande ville du Viêt Nam, tout près du delta du Mékong.",
    ],
  },
  {
    id: 'siem-reap', name: 'Siem Reap', country: 'Cambodge', cc: 'kh', iso: '116', continent: 'Asie',
    lat: 13.362, lon: 103.860, level: 2, capital: false, icon: '🌳',
    pop: 'environ 250 000', lang: 'Khmer',
    facts: [
      "Siem Reap est la porte d'entrée vers Angkor, le plus grand ensemble de temples du monde.",
      "Certains temples, comme Ta Prohm, sont envahis par d'énormes racines d'arbres.",
    ],
  },
  {
    id: 'rangoun', name: 'Rangoun', country: 'Birmanie (Myanmar)', cc: 'mm', iso: '104', continent: 'Asie',
    lat: 16.866, lon: 96.195, level: 2, capital: false, icon: '✨',
    pop: 'environ 5 millions', lang: 'Birman',
    facts: [
      "La pagode Shwedagon, recouverte d'or, brille au-dessus de la ville.",
      "Rangoun a été la capitale du pays jusqu'en 2005 ; c'est aujourd'hui Naypyidaw.",
    ],
  },
  {
    id: 'denpasar', name: 'Denpasar', country: 'Indonésie (Bali)', cc: 'id', iso: '360', continent: 'Asie',
    lat: -8.650, lon: 115.216, level: 2, capital: false, icon: '🐒',
    pop: 'environ 730 000', lang: 'Indonésien et balinais',
    facts: [
      "Denpasar est la plus grande ville de Bali, une île surnommée « l'île des dieux ».",
      "À Bali, on cultive le riz dans des rizières en terrasses, comme de grands escaliers verts.",
    ],
  },
  {
    id: 'sapporo', name: 'Sapporo', country: 'Japon', cc: 'jp', iso: '392', continent: 'Asie',
    lat: 43.062, lon: 141.354, level: 2, capital: false, icon: '⛄',
    pop: 'environ 2 millions', lang: 'Japonais',
    facts: [
      "Chaque hiver, son festival de la neige présente d'immenses sculptures de glace et de neige.",
      "Sapporo a accueilli les Jeux olympiques d'hiver en 1972.",
    ],
  },
  {
    id: 'irkoutsk', name: 'Irkoutsk', country: 'Russie', cc: 'ru', iso: '643', continent: 'Asie',
    lat: 52.287, lon: 104.305, level: 2, capital: false, icon: '💧',
    pop: 'environ 600 000', lang: 'Russe',
    facts: [
      "Irkoutsk est tout près du lac Baïkal, le lac le plus profond du monde : plus de 1 600 mètres !",
      "C'est une étape du Transsibérien, le train qui traverse la Russie de Moscou à Vladivostok en une semaine.",
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
  {
    id: 'las-vegas', name: 'Las Vegas', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 36.170, lon: -115.140, level: 1, capital: false, icon: '🌵',
    pop: 'environ 650 000', lang: 'Anglais',
    facts: [
      "Las Vegas est construite en plein désert du Mojave.",
      "La nuit, ses enseignes lumineuses sont si nombreuses que la ville brille comme un phare dans le désert.",
    ],
  },
  {
    id: 'miami', name: 'Miami', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 25.762, lon: -80.192, level: 1, capital: false, icon: '🐊',
    pop: 'environ 450 000 (plus de 6 millions avec la banlieue)', lang: 'Anglais et espagnol',
    facts: [
      "Tout près de Miami, le parc des Everglades est un immense marais où vivent alligators et lamantins.",
      "Beaucoup d'habitants parlent espagnol : la ville est très liée à Cuba et à l'Amérique latine.",
    ],
  },
  {
    id: 'orlando', name: 'Orlando', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 28.538, lon: -81.379, level: 1, capital: false, icon: '🎢',
    pop: 'environ 320 000', lang: 'Anglais',
    facts: [
      "Orlando est la capitale mondiale des parcs d'attractions : Walt Disney World s'y trouve.",
      "Non loin de là, au cap Canaveral, décollent les fusées de la NASA.",
    ],
  },
  {
    id: 'vancouver', name: 'Vancouver', country: 'Canada', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 49.283, lon: -123.121, level: 1, capital: false, icon: '🌲',
    pop: 'environ 660 000 (2,6 millions avec la banlieue)', lang: 'Anglais',
    facts: [
      "Vancouver est coincée entre l'océan Pacifique et les montagnes : on peut skier et aller à la plage le même jour.",
      "Dans le parc Stanley, on peut admirer de grands mâts totems sculptés par les peuples autochtones.",
    ],
  },
  {
    id: 'ottawa', name: 'Ottawa', country: 'Canada', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 45.421, lon: -75.697, level: 1, capital: true, icon: '🍁',
    pop: 'environ 1 million', lang: 'Anglais et français',
    facts: [
      "C'est Ottawa, et non Toronto ou Montréal, qui est la capitale du Canada !",
      "En hiver, le canal Rideau gèle et devient l'une des plus grandes patinoires du monde : près de 8 km !",
    ],
  },
  {
    id: 'boston', name: 'Boston', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 42.360, lon: -71.059, level: 1, capital: false, icon: '🦞',
    pop: 'environ 650 000', lang: 'Anglais',
    facts: [
      "Boston est l'une des plus vieilles villes des États-Unis, fondée en 1630.",
      "Juste à côté se trouvent deux universités très célèbres : Harvard et le MIT.",
    ],
  },
  {
    id: 'nouvelle-orleans', name: 'La Nouvelle-Orléans', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 29.951, lon: -90.072, level: 1, capital: false, icon: '🎷',
    pop: 'environ 380 000', lang: 'Anglais',
    facts: [
      "Elle a été fondée par des Français en 1718 et porte le nom du duc d'Orléans.",
      "C'est le berceau du jazz ! Le célèbre trompettiste Louis Armstrong y est né.",
    ],
  },
  {
    id: 'cancun', name: 'Cancún', country: 'Mexique', cc: 'mx', iso: '484', continent: 'Amérique du Nord',
    lat: 21.161, lon: -86.851, level: 1, capital: false, icon: '🏝️',
    pop: 'environ 900 000', lang: 'Espagnol',
    facts: [
      "Il y a 50 ans, Cancún n'était qu'un petit village de pêcheurs : c'est aujourd'hui une immense station balnéaire.",
      "Sa zone hôtelière est construite sur une longue bande de sable en forme de 7, entre une lagune et la mer des Caraïbes.",
    ],
  },
  {
    id: 'panama', name: 'Panama', country: 'Panama', cc: 'pa', iso: '591', continent: 'Amérique du Nord',
    lat: 8.983, lon: -79.517, level: 1, capital: true, icon: '🚢',
    pop: 'environ 1,5 million avec son agglomération', lang: 'Espagnol',
    facts: [
      "Le canal de Panama, ouvert en 1914, permet aux bateaux de passer de l'océan Atlantique au Pacifique.",
      "Sans le canal, les bateaux devraient faire le tour de toute l'Amérique du Sud !",
    ],
  },
  {
    id: 'anchorage', name: 'Anchorage', country: 'États-Unis (Alaska)', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 61.218, lon: -149.900, level: 2, capital: false, icon: '🐻',
    pop: 'environ 290 000', lang: 'Anglais',
    facts: [
      "Anchorage est la plus grande ville de l'Alaska : des élans s'y promènent parfois dans les rues !",
      "Les États-Unis ont acheté l'Alaska à la Russie en 1867.",
    ],
  },
  {
    id: 'seattle', name: 'Seattle', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 47.606, lon: -122.332, level: 2, capital: false, icon: '☕',
    pop: 'environ 750 000', lang: 'Anglais',
    facts: [
      "Sa tour Space Needle, haute de 184 mètres, a été construite pour l'Exposition universelle de 1962.",
      "La ville est entourée de montagnes et de volcans, comme le mont Rainier.",
    ],
  },
  {
    id: 'houston', name: 'Houston', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 29.760, lon: -95.370, level: 2, capital: false, icon: '🚀',
    pop: 'environ 2,3 millions', lang: 'Anglais et espagnol',
    facts: [
      "C'est à Houston que se trouve le centre de contrôle des missions spatiales de la NASA.",
      "« Houston, nous avons un problème ! » : cette phrase célèbre a été prononcée par les astronautes d'Apollo 13 en 1970.",
    ],
  },
  {
    id: 'philadelphie', name: 'Philadelphie', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 39.953, lon: -75.165, level: 2, capital: false, icon: '🔔',
    pop: 'environ 1,6 million', lang: 'Anglais',
    facts: [
      "C'est à Philadelphie qu'a été signée en 1776 la Déclaration d'indépendance des États-Unis.",
      "La Cloche de la Liberté, toute fêlée, y est exposée : c'est un symbole de la liberté américaine.",
    ],
  },
  {
    id: 'san-diego', name: 'San Diego', country: 'États-Unis', cc: 'us', iso: '840', continent: 'Amérique du Nord',
    lat: 32.716, lon: -117.161, level: 2, capital: false, icon: '🐳',
    pop: 'environ 1,4 million', lang: 'Anglais et espagnol',
    facts: [
      "San Diego est tout près de la frontière avec le Mexique.",
      "Son zoo est l'un des plus célèbres du monde, avec plus de 12 000 animaux.",
    ],
  },
  {
    id: 'calgary', name: 'Calgary', country: 'Canada', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 51.045, lon: -114.072, level: 2, capital: false, icon: '🤠',
    pop: 'environ 1,3 million', lang: 'Anglais',
    facts: [
      "Chaque été, le Stampede de Calgary, un immense rodéo, attire plus d'un million de visiteurs.",
      "Aux Jeux olympiques d'hiver de 1988, à Calgary, la Jamaïque a présenté sa toute première équipe de bobsleigh !",
    ],
  },
  {
    id: 'churchill', name: 'Churchill', country: 'Canada', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 58.768, lon: -94.165, level: 2, capital: false, icon: '❄️',
    pop: 'environ 900', lang: 'Anglais',
    facts: [
      "On la surnomme « la capitale mondiale de l'ours polaire » : en automne, ils attendent près de la ville que la baie d'Hudson gèle.",
      "Aucune route n'y mène : on y arrive en train ou en avion !",
    ],
  },
  {
    id: 'dawson', name: 'Dawson City', country: 'Canada (Yukon)', cc: 'ca', iso: '124', continent: 'Amérique du Nord',
    lat: 64.060, lon: -139.432, level: 2, capital: false, icon: '💰',
    pop: 'environ 1 500', lang: 'Anglais',
    facts: [
      "En 1898, des dizaines de milliers de chercheurs d'or se sont précipités ici : c'est la ruée vers l'or du Klondike.",
      "Les rues sont toujours en terre et les trottoirs en planches de bois, comme à l'époque !",
    ],
  },
  {
    id: 'merida', name: 'Mérida', country: 'Mexique', cc: 'mx', iso: '484', continent: 'Amérique du Nord',
    lat: 20.967, lon: -89.624, level: 2, capital: false, icon: '🌽',
    pop: 'environ 1 million', lang: 'Espagnol et maya',
    facts: [
      "Mérida est au cœur du Yucatán, le pays des anciens Mayas : beaucoup d'habitants parlent encore la langue maya.",
      "Non loin de là se dresse la pyramide de Chichén Itzá, l'une des nouvelles Sept Merveilles du monde.",
    ],
  },
  {
    id: 'guatemala', name: 'Guatemala', country: 'Guatemala', cc: 'gt', iso: '320', continent: 'Amérique du Nord',
    lat: 14.634, lon: -90.507, level: 2, capital: true, icon: '🌋',
    pop: 'environ 3 millions avec son agglomération', lang: 'Espagnol et langues mayas',
    facts: [
      "La ville est entourée de volcans, dont certains sont encore actifs, comme le Pacaya.",
      "Le quetzal, un oiseau aux longues plumes vertes, est le symbole du pays et a donné son nom à la monnaie.",
    ],
  },
  {
    id: 'san-jose', name: 'San José', country: 'Costa Rica', cc: 'cr', iso: '188', continent: 'Amérique du Nord',
    lat: 9.928, lon: -84.091, level: 2, capital: true, icon: '🐸',
    pop: 'environ 350 000 (plus de 2 millions avec la banlieue)', lang: 'Espagnol',
    facts: [
      "Le petit Costa Rica abrite environ 5 % de toutes les espèces animales et végétales du monde.",
      "Le pays a supprimé son armée en 1948.",
    ],
  },
  {
    id: 'kingston', name: 'Kingston', country: 'Jamaïque', cc: 'jm', iso: '388', continent: 'Amérique du Nord',
    lat: 17.971, lon: -76.793, level: 2, capital: true, icon: '🎵',
    pop: 'environ 670 000', lang: 'Anglais et patois jamaïcain',
    facts: [
      "Kingston est la ville du reggae : Bob Marley y a vécu, et sa maison est devenue un musée.",
      "La Jamaïque est le pays du sprinteur Usain Bolt, l'homme le plus rapide du monde.",
    ],
  },
  {
    id: 'port-au-prince', name: 'Port-au-Prince', country: 'Haïti', cc: 'ht', iso: '332', continent: 'Amérique du Nord',
    lat: 18.594, lon: -72.307, level: 2, capital: true, icon: '🎨',
    pop: 'environ 2,9 millions avec son agglomération', lang: 'Créole haïtien et français',
    facts: [
      "En 1804, Haïti est devenu le premier pays des Caraïbes à gagner son indépendance.",
      "La ville est célèbre pour ses tap-taps, des bus multicolores peints à la main.",
    ],
  },
  {
    id: 'fort-de-france', name: 'Fort-de-France', country: 'Martinique (France)', cc: 'mq', iso: '250', continent: 'Amérique du Nord',
    lat: 14.616, lon: -61.059, level: 2, capital: false, icon: '🌺',
    pop: 'environ 75 000', lang: 'Français et créole martiniquais',
    facts: [
      "Au nord de l'île, la montagne Pelée est un volcan qui a détruit la ville de Saint-Pierre en 1902.",
      "La Martinique est surnommée « l'île aux fleurs ».",
    ],
  },
  {
    id: 'nassau', name: 'Nassau', country: 'Bahamas', cc: 'bs', iso: '044', continent: 'Amérique du Nord',
    lat: 25.048, lon: -77.355, level: 2, capital: true, icon: '🐷',
    pop: 'environ 300 000', lang: 'Anglais',
    facts: [
      "Les Bahamas comptent environ 700 îles dans l'océan Atlantique.",
      "Sur une petite île des Bahamas, des cochons nagent dans la mer turquoise et viennent saluer les visiteurs !",
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
    lat: 4.711, lon: -74.072, level: 2, capital: true, icon: '💰',
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
  {
    id: 'sao-paulo', name: 'São Paulo', country: 'Brésil', cc: 'br', iso: '076', continent: 'Amérique du Sud',
    lat: -23.551, lon: -46.633, level: 1, capital: false, icon: '🏙️',
    pop: 'environ 12 millions (plus de 21 millions avec la banlieue)', lang: 'Portugais',
    facts: [
      "São Paulo est la plus grande ville d'Amérique du Sud.",
      "On y trouve la plus grande communauté japonaise du monde en dehors du Japon.",
    ],
  },
  {
    id: 'caracas', name: 'Caracas', country: 'Venezuela', cc: 've', iso: '862', continent: 'Amérique du Sud',
    lat: 10.481, lon: -66.904, level: 1, capital: true, icon: '⛰️',
    pop: 'environ 3 millions', lang: 'Espagnol',
    facts: [
      "Caracas est la ville natale de Simón Bolívar, le héros de l'indépendance de plusieurs pays d'Amérique du Sud.",
      "Le Venezuela abrite le Salto Ángel, la plus haute chute d'eau du monde : 979 mètres !",
    ],
  },
  {
    id: 'quito', name: 'Quito', country: 'Équateur', cc: 'ec', iso: '218', continent: 'Amérique du Sud',
    lat: -0.180, lon: -78.468, level: 1, capital: true, icon: '🌋',
    pop: 'environ 2,8 millions', lang: 'Espagnol',
    facts: [
      "Quito est à 2 850 mètres d'altitude, entourée de volcans.",
      "L'équateur, la ligne imaginaire qui coupe la Terre en deux, passe à une vingtaine de kilomètres : le pays lui doit son nom !",
    ],
  },
  {
    id: 'montevideo', name: 'Montevideo', country: 'Uruguay', cc: 'uy', iso: '858', continent: 'Amérique du Sud',
    lat: -34.901, lon: -56.164, level: 1, capital: true, icon: '⚽',
    pop: 'environ 1,3 million', lang: 'Espagnol',
    facts: [
      "En 1930, Montevideo a accueilli la toute première Coupe du monde de football… et l'Uruguay l'a gagnée !",
      "Plus d'un tiers des habitants de l'Uruguay vivent à Montevideo.",
    ],
  },
  {
    id: 'cayenne', name: 'Cayenne', country: 'Guyane (France)', cc: 'gf', iso: '250', continent: 'Amérique du Sud',
    lat: 4.922, lon: -52.313, level: 1, capital: false, icon: '🐒',
    pop: 'environ 65 000', lang: 'Français et créole guyanais',
    facts: [
      "La Guyane est un département français d'Amérique du Sud, couvert en grande partie par la forêt amazonienne.",
      "On y parle français et on y paie en euros, à plus de 7 000 km de Paris !",
    ],
  },
  {
    id: 'salvador', name: 'Salvador de Bahia', country: 'Brésil', cc: 'br', iso: '076', continent: 'Amérique du Sud',
    lat: -12.978, lon: -38.501, level: 1, capital: false, icon: '🥁',
    pop: 'environ 2,4 millions', lang: 'Portugais',
    facts: [
      "Salvador de Bahia a été la première capitale du Brésil, de 1549 à 1763.",
      "Elle est célèbre pour son carnaval, ses tambours et la capoeira, un mélange de danse et d'art martial.",
    ],
  },
  {
    id: 'kourou', name: 'Kourou', country: 'Guyane (France)', cc: 'gf', iso: '250', continent: 'Amérique du Sud',
    lat: 5.159, lon: -52.650, level: 2, capital: false, icon: '🚀',
    pop: 'environ 25 000', lang: 'Français et créole guyanais',
    facts: [
      "Les fusées européennes Ariane décollent du centre spatial guyanais, à Kourou.",
      "La base est installée près de l'équateur : la rotation de la Terre y donne un petit coup de pouce aux fusées !",
    ],
  },
  {
    id: 'valparaiso', name: 'Valparaíso', country: 'Chili', cc: 'cl', iso: '152', continent: 'Amérique du Sud',
    lat: -33.047, lon: -71.612, level: 2, capital: false, icon: '🎨',
    pop: 'environ 300 000', lang: 'Espagnol',
    facts: [
      "Ses maisons multicolores s'accrochent aux collines, où grimpent de vieux ascenseurs funiculaires depuis plus de 100 ans.",
      "Les murs de la ville sont couverts de grandes peintures murales colorées.",
    ],
  },
  {
    id: 'punta-arenas', name: 'Punta Arenas', country: 'Chili', cc: 'cl', iso: '152', continent: 'Amérique du Sud',
    lat: -53.164, lon: -70.917, level: 2, capital: false, icon: '🐧',
    pop: 'environ 130 000', lang: 'Espagnol',
    facts: [
      "Punta Arenas se trouve au bord du détroit de Magellan, tout au sud de l'Amérique.",
      "Non loin de la ville, on peut observer des colonies de manchots de Magellan.",
    ],
  },
  {
    id: 'asuncion', name: 'Asunción', country: 'Paraguay', cc: 'py', iso: '600', continent: 'Amérique du Sud',
    lat: -25.264, lon: -57.576, level: 2, capital: true, icon: '🕸️',
    pop: 'environ 520 000 (plus de 2 millions avec la banlieue)', lang: 'Espagnol et guarani',
    facts: [
      "Au Paraguay, presque tout le monde parle deux langues : l'espagnol et le guarani, une langue amérindienne.",
      "On y fabrique le ñandutí, une dentelle fine comme une toile d'araignée — c'est d'ailleurs ce que son nom veut dire en guarani.",
    ],
  },
  {
    id: 'medellin', name: 'Medellín', country: 'Colombie', cc: 'co', iso: '170', continent: 'Amérique du Sud',
    lat: 6.244, lon: -75.581, level: 2, capital: false, icon: '🌸',
    pop: 'environ 2,6 millions', lang: 'Espagnol',
    facts: [
      "On la surnomme « la ville de l'éternel printemps » car il y fait doux toute l'année.",
      "Des télécabines, comme dans une station de ski, relient au métro les quartiers perchés sur les collines.",
    ],
  },
  {
    id: 'carthagene', name: 'Carthagène des Indes', country: 'Colombie', cc: 'co', iso: '170', continent: 'Amérique du Sud',
    lat: 10.391, lon: -75.479, level: 2, capital: false, icon: '🏰',
    pop: 'environ 1 million', lang: 'Espagnol',
    facts: [
      "Sa vieille ville est entourée de remparts construits pour se protéger des pirates.",
      "Ses rues sont bordées de maisons colorées aux balcons de bois fleuris.",
    ],
  },
  {
    id: 'iquitos', name: 'Iquitos', country: 'Pérou', cc: 'pe', iso: '604', continent: 'Amérique du Sud',
    lat: -3.744, lon: -73.251, level: 2, capital: false, icon: '🐬',
    pop: 'environ 480 000', lang: 'Espagnol',
    facts: [
      "Iquitos est la plus grande ville du monde qu'aucune route ne relie au reste du pays : on y arrive en bateau ou en avion !",
      "Dans l'Amazone, tout près, vivent des dauphins roses.",
    ],
  },
  {
    id: 'potosi', name: 'Potosí', country: 'Bolivie', cc: 'bo', iso: '068', continent: 'Amérique du Sud',
    lat: -19.589, lon: -65.754, level: 2, capital: false, icon: '🥈',
    pop: 'environ 250 000', lang: 'Espagnol et quechua',
    facts: [
      "Potosí, à plus de 4 000 mètres d'altitude, est l'une des villes les plus hautes du monde.",
      "Sa montagne, le Cerro Rico (« la montagne riche »), a fourni d'énormes quantités d'argent à l'Espagne.",
    ],
  },
  {
    id: 'foz-do-iguacu', name: 'Foz do Iguaçu', country: 'Brésil', cc: 'br', iso: '076', continent: 'Amérique du Sud',
    lat: -25.547, lon: -54.588, level: 2, capital: false, icon: '🌈',
    pop: 'environ 260 000', lang: 'Portugais',
    facts: [
      "Tout près, les chutes d'Iguaçu forment environ 275 cascades, à la frontière du Brésil et de l'Argentine.",
      "La ville est voisine du barrage d'Itaipu, l'un des plus grands barrages hydroélectriques du monde.",
    ],
  },
  {
    id: 'mendoza', name: 'Mendoza', country: 'Argentine', cc: 'ar', iso: '032', continent: 'Amérique du Sud',
    lat: -32.890, lon: -68.845, level: 2, capital: false, icon: '🏔️',
    pop: 'environ 1 million avec son agglomération', lang: 'Espagnol',
    facts: [
      "Mendoza est au pied de l'Aconcagua, la plus haute montagne des Amériques (6 961 m).",
      "Pour arroser ses arbres en plein désert, la ville est parcourue de petits canaux au bord des trottoirs.",
    ],
  },
  {
    id: 'paramaribo', name: 'Paramaribo', country: 'Suriname', cc: 'sr', iso: '740', continent: 'Amérique du Sud',
    lat: 5.852, lon: -55.204, level: 2, capital: true, icon: '🏠',
    pop: 'environ 240 000', lang: 'Néerlandais (et sranan tongo)',
    facts: [
      "Le Suriname est le seul pays d'Amérique du Sud où la langue officielle est le néerlandais.",
      "La vieille ville est faite de jolies maisons en bois blanc, classées au patrimoine mondial.",
    ],
  },
  {
    id: 'puerto-ayora', name: 'Puerto Ayora', country: 'Équateur (Galápagos)', cc: 'ec', iso: '218', continent: 'Amérique du Sud',
    lat: -0.743, lon: -90.315, level: 2, capital: false, icon: '🐢',
    pop: 'environ 12 000', lang: 'Espagnol',
    facts: [
      "Puerto Ayora est la plus grande ville des îles Galápagos, à environ 1 000 km des côtes de l'Équateur.",
      "Les animaux des Galápagos, comme les tortues géantes et les iguanes marins, ont aidé Charles Darwin à imaginer sa théorie de l'évolution.",
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
  {
    id: 'canberra', name: 'Canberra', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -35.281, lon: 149.130, level: 1, capital: true, icon: '🏛️',
    pop: 'environ 470 000', lang: 'Anglais',
    facts: [
      "Sydney et Melbourne voulaient toutes les deux être la capitale : on a construit Canberra entre les deux !",
      "Des kangourous se promènent parfois dans les parcs de la ville.",
    ],
  },
  {
    id: 'auckland', name: 'Auckland', country: 'Nouvelle-Zélande', cc: 'nz', iso: '554', continent: 'Océanie',
    lat: -36.849, lon: 174.763, level: 1, capital: false, icon: '⛵',
    pop: 'environ 1,7 million', lang: 'Anglais et maori',
    facts: [
      "Auckland est bâtie sur une cinquantaine d'anciens volcans !",
      "On la surnomme « la ville des voiles » tant il y a de bateaux. Mais la capitale, c'est Wellington !",
    ],
  },
  {
    id: 'papeete', name: 'Papeete', country: 'Polynésie française (France)', cc: 'pf', iso: '258', continent: 'Océanie',
    lat: -17.535, lon: -149.569, level: 1, capital: false, icon: '🌺',
    pop: 'environ 25 000 (plus de 130 000 avec les communes voisines)', lang: 'Français et tahitien',
    facts: [
      "Papeete est sur l'île de Tahiti, au milieu de l'océan Pacifique, à environ 16 000 km de Paris.",
      "La Polynésie française compte 118 îles, dont la célèbre Bora-Bora.",
    ],
  },
  {
    id: 'brisbane', name: 'Brisbane', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -27.470, lon: 153.026, level: 1, capital: false, icon: '🐨',
    pop: 'environ 2,7 millions', lang: 'Anglais',
    facts: [
      "À Brisbane se trouve le plus ancien refuge de koalas du monde, Lone Pine.",
      "Brisbane accueillera les Jeux olympiques d'été en 2032.",
    ],
  },
  {
    id: 'suva', name: 'Suva', country: 'Fidji', cc: 'fj', iso: '242', continent: 'Océanie',
    lat: -18.141, lon: 178.441, level: 1, capital: true, icon: '🐚',
    pop: 'environ 95 000', lang: 'Anglais, fidjien et hindi',
    facts: [
      "Les Fidji forment un archipel de plus de 300 îles dans l'océan Pacifique.",
      "Le pays est célèbre pour ses joueurs de rugby à 7, deux fois champions olympiques (2016 et 2021).",
    ],
  },
  {
    id: 'hobart', name: 'Hobart', country: 'Australie (Tasmanie)', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -42.882, lon: 147.327, level: 2, capital: false, icon: '🐾',
    pop: 'environ 250 000', lang: 'Anglais',
    facts: [
      "Hobart est la capitale de la Tasmanie, une grande île au sud de l'Australie.",
      "En Tasmanie vit le diable de Tasmanie, un petit marsupial noir qui pousse des cris terrifiants !",
    ],
  },
  {
    id: 'darwin', name: 'Darwin', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -12.463, lon: 130.842, level: 2, capital: false, icon: '🐊',
    pop: 'environ 150 000', lang: 'Anglais',
    facts: [
      "La ville porte le nom du savant Charles Darwin.",
      "Des crocodiles marins vivent dans les rivières des environs : il ne faut surtout pas s'y baigner !",
    ],
  },
  {
    id: 'alice-springs', name: 'Alice Springs', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -23.698, lon: 133.881, level: 2, capital: false, icon: '🏜️',
    pop: 'environ 25 000', lang: 'Anglais et langues aborigènes',
    facts: [
      "Alice Springs se trouve en plein désert, presque au centre de l'Australie.",
      "Le célèbre rocher rouge Uluru se trouve à quelques heures de route de là.",
    ],
  },
  {
    id: 'cairns', name: 'Cairns', country: 'Australie', cc: 'au', iso: '036', continent: 'Océanie',
    lat: -16.920, lon: 145.771, level: 2, capital: false, icon: '🐠',
    pop: 'environ 160 000', lang: 'Anglais',
    facts: [
      "Cairns est la porte d'entrée de la Grande Barrière de corail, le plus grand récif corallien du monde.",
      "Derrière la ville pousse la forêt de Daintree, l'une des plus anciennes forêts tropicales de la planète.",
    ],
  },
  {
    id: 'christchurch', name: 'Christchurch', country: 'Nouvelle-Zélande', cc: 'nz', iso: '554', continent: 'Océanie',
    lat: -43.532, lon: 172.636, level: 2, capital: false, icon: '🌷',
    pop: 'environ 400 000', lang: 'Anglais',
    facts: [
      "On la surnomme « la ville jardin » pour ses nombreux parcs.",
      "C'est d'ici que partent beaucoup d'expéditions scientifiques vers l'Antarctique.",
    ],
  },
  {
    id: 'queenstown', name: 'Queenstown', country: 'Nouvelle-Zélande', cc: 'nz', iso: '554', continent: 'Océanie',
    lat: -45.031, lon: 168.663, level: 2, capital: false, icon: '🏔️',
    pop: 'environ 50 000 avec sa région', lang: 'Anglais',
    facts: [
      "Queenstown est la capitale des sports d'aventure : c'est ici qu'est né, en 1988, le premier saut à l'élastique ouvert au public !",
      "Les montagnes autour de la ville ont servi de décor aux films du Seigneur des anneaux.",
    ],
  },
  {
    id: 'rotorua', name: 'Rotorua', country: 'Nouvelle-Zélande', cc: 'nz', iso: '554', continent: 'Océanie',
    lat: -38.137, lon: 176.251, level: 2, capital: false, icon: '♨️',
    pop: 'environ 80 000', lang: 'Anglais et maori',
    facts: [
      "À Rotorua, des geysers crachent de l'eau bouillante et la boue bouillonne… et ça sent l'œuf pourri !",
      "C'est un grand centre de la culture maorie : on peut y voir le haka, une danse traditionnelle.",
    ],
  },
  {
    id: 'port-moresby', name: 'Port Moresby', country: 'Papouasie-Nouvelle-Guinée', cc: 'pg', iso: '598', continent: 'Océanie',
    lat: -9.443, lon: 147.180, level: 2, capital: true, icon: '🦜',
    pop: 'environ 400 000', lang: 'Anglais, tok pisin et hiri motu',
    facts: [
      "En Papouasie-Nouvelle-Guinée, on parle plus de 800 langues différentes : un record mondial !",
      "Le pays abrite les oiseaux de paradis, aux plumes extraordinaires.",
    ],
  },
  {
    id: 'port-vila', name: 'Port-Vila', country: 'Vanuatu', cc: 'vu', iso: '548', continent: 'Océanie',
    lat: -17.734, lon: 168.322, level: 2, capital: true, icon: '🌋',
    pop: 'environ 50 000', lang: 'Bichelamar, anglais et français',
    facts: [
      "Au Vanuatu, il existe une boîte aux lettres sous la mer : on y poste ses cartes avec un masque et un tuba !",
      "Sur l'île de Pentecôte, des hommes sautent d'une tour en bois, attachés par des lianes : c'est l'ancêtre du saut à l'élastique.",
    ],
  },
  {
    id: 'apia', name: 'Apia', country: 'Samoa', cc: 'ws', iso: '882', continent: 'Océanie',
    lat: -13.831, lon: -171.762, level: 2, capital: true, icon: '🌅',
    pop: 'environ 40 000', lang: 'Samoan et anglais',
    facts: [
      "En 2011, les Samoa ont sauté une journée entière (le 30 décembre) pour passer de l'autre côté de la ligne de changement de date !",
      "L'écrivain Robert Louis Stevenson, auteur de L'Île au trésor, a passé ses dernières années près d'Apia.",
    ],
  },
  {
    id: 'nukualofa', name: "Nuku'alofa", country: 'Tonga', cc: 'to', iso: '776', continent: 'Océanie',
    lat: -21.139, lon: -175.204, level: 2, capital: true, icon: '👑',
    pop: 'environ 25 000', lang: 'Tongien et anglais',
    facts: [
      "Les Tonga sont le seul royaume du Pacifique : le pays a toujours un roi.",
      "C'est l'un des premiers pays du monde à voir le soleil se lever chaque jour.",
    ],
  },
];
