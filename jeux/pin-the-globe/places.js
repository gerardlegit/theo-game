// ============================================================================
// Données du mode "Monuments & merveilles"
//
// Chaque lieu :
//  - name             : nom affiché
//  - kind             : 'monument' (construit par les humains) ou 'nature'
//  - country, flags   : pays (texte) et drapeaux (codes ISO alpha-2, flag-icons)
//  - continent        : sert à répartir les lieux d'une partie sur la Terre
//  - lat, lon         : position réelle (degrés décimaux)
//  - icon             : émoji du lieu
//  - clue             : la devinette montrée pendant que le joueur cherche
//  - stat             : un chiffre clé { label, value }
//  - facts            : « Le savais-tu ? »
// ============================================================================

export const KINDS = {
  monument: { label: 'Monument', icon: '🏛️' },
  nature: { label: 'Merveille naturelle', icon: '🌿' },
};

export const PLACES = [
  // ------------------------------------------------------------- Europe
  {
    id: 'tour-eiffel', name: 'La tour Eiffel', kind: 'monument', country: 'France', flags: ['fr'], continent: 'Europe',
    lat: 48.858, lon: 2.294, icon: '🗼',
    clue: 'Une grande tour de fer construite pour une Exposition universelle, il y a plus de 130 ans.',
    stat: { label: 'Hauteur', value: '330 m' },
    facts: [
      "Elle a été construite en à peine plus de 2 ans, pour l'Exposition universelle de 1889.",
      'Pour la protéger de la rouille, on la repeint environ tous les 7 ans, avec 60 tonnes de peinture !',
    ],
  },
  {
    id: 'colisee', name: 'Le Colisée', kind: 'monument', country: 'Italie', flags: ['it'], continent: 'Europe',
    lat: 41.890, lon: 12.492, icon: '🏛️',
    clue: 'Un immense amphithéâtre antique où combattaient les gladiateurs.',
    stat: { label: 'Inauguré en', value: '80 apr. J.-C.' },
    facts: [
      'Il pouvait accueillir environ 50 000 spectateurs.',
      'On pouvait y tendre une immense toile, le velarium, pour protéger le public du soleil.',
    ],
  },
  {
    id: 'big-ben', name: 'Big Ben', kind: 'monument', country: 'Royaume-Uni', flags: ['gb'], continent: 'Europe',
    lat: 51.501, lon: -0.125, icon: '🕰️',
    clue: 'Une célèbre tour à horloge, au bord de la Tamise.',
    stat: { label: 'Hauteur', value: '96 m' },
    facts: [
      '« Big Ben » est en fait le surnom de la grosse cloche de 13,7 tonnes cachée dans la tour.',
      'Depuis 2012, la tour s\'appelle officiellement « Elizabeth Tower », en l\'honneur de la reine Élisabeth II.',
    ],
  },
  {
    id: 'sagrada-familia', name: 'La Sagrada Família', kind: 'monument', country: 'Espagne', flags: ['es'], continent: 'Europe',
    lat: 41.404, lon: 2.174, icon: '⛪',
    clue: "Une basilique extraordinaire imaginée par l'architecte Gaudí, en construction depuis plus de 140 ans.",
    stat: { label: 'Début des travaux', value: '1882' },
    facts: [
      "Gaudí y a travaillé plus de 40 ans, jusqu'à sa mort en 1926.",
      "Il s'inspirait de la nature : à l'intérieur, les colonnes ressemblent à des troncs d'arbres.",
    ],
  },
  {
    id: 'acropole', name: "L'Acropole d'Athènes", kind: 'monument', country: 'Grèce', flags: ['gr'], continent: 'Europe',
    lat: 37.972, lon: 23.726, icon: '🏺',
    clue: 'Une colline sacrée où se dresse le Parthénon, un temple vieux de près de 2 500 ans.',
    stat: { label: 'Parthénon construit vers', value: '440 av. J.-C.' },
    facts: [
      'Le Parthénon était dédié à Athéna, la déesse protectrice de la ville.',
      'Ses colonnes sont légèrement bombées pour paraître parfaitement droites quand on les regarde de loin !',
    ],
  },
  {
    id: 'saint-basile', name: 'La cathédrale Saint-Basile', kind: 'monument', country: 'Russie', flags: ['ru'], continent: 'Europe',
    lat: 55.752, lon: 37.623, icon: '🏰',
    clue: 'Une cathédrale aux coupoles colorées en forme de bulbe, sur une place très célèbre.',
    stat: { label: 'Construite de', value: '1555 à 1561' },
    facts: [
      'Elle a été construite sur ordre du tsar Ivan le Terrible.',
      'Elle se trouve sur la place Rouge, à Moscou, juste à côté du Kremlin.',
    ],
  },
  {
    id: 'stonehenge', name: 'Stonehenge', kind: 'monument', country: 'Royaume-Uni', flags: ['gb'], continent: 'Europe',
    lat: 51.179, lon: -1.826, icon: '☀️',
    clue: "Un mystérieux cercle de pierres géantes, dressées il y a des milliers d'années.",
    stat: { label: 'Âge', value: 'environ 5 000 ans' },
    facts: [
      'Certaines pierres pèsent plus de 20 tonnes !',
      "Le jour le plus long de l'année, le soleil se lève dans l'alignement des pierres.",
    ],
  },
  {
    id: 'tour-pise', name: 'La tour de Pise', kind: 'monument', country: 'Italie', flags: ['it'], continent: 'Europe',
    lat: 43.723, lon: 10.397, icon: '🔔',
    clue: 'Un clocher célèbre… parce qu\'il penche !',
    stat: { label: 'Inclinaison', value: 'environ 4°' },
    facts: [
      'Elle a commencé à pencher pendant sa construction, au XIIᵉ siècle, car le sol est trop mou.',
      "Des travaux l'ont redressée d'environ 40 cm, entre 1990 et 2001, pour qu'elle ne tombe pas.",
    ],
  },
  {
    id: 'mont-saint-michel', name: 'Le Mont-Saint-Michel', kind: 'monument', country: 'France', flags: ['fr'], continent: 'Europe',
    lat: 48.636, lon: -1.511, icon: '🏝️',
    clue: 'Une abbaye perchée sur un rocher, qui devient une île à marée haute.',
    stat: { label: 'Abbaye fondée en', value: '966' },
    facts: [
      "Ses marées sont parmi les plus fortes d'Europe : on dit que la mer monte « à la vitesse d'un cheval au galop ».",
      'Plus de 2 millions de visiteurs viennent le découvrir chaque année.',
    ],
  },
  {
    id: 'geirangerfjord', name: 'Le Geirangerfjord', kind: 'nature', country: 'Norvège', flags: ['no'], continent: 'Europe',
    lat: 62.104, lon: 7.094, icon: '🛳️',
    clue: 'Un long bras de mer entouré de falaises et de cascades, creusé par les glaciers.',
    stat: { label: 'Longueur', value: '15 km' },
    facts: [
      "Les fjords ont été creusés par d'énormes glaciers pendant les périodes glaciaires.",
      'La cascade des « Sept Sœurs » dévale ses falaises en sept filets d\'eau.',
    ],
  },
  {
    id: 'mont-blanc', name: 'Le mont Blanc', kind: 'nature', country: 'France et Italie', flags: ['fr', 'it'], continent: 'Europe',
    lat: 45.833, lon: 6.865, icon: '⛷️',
    clue: 'Le plus haut sommet des Alpes.',
    stat: { label: 'Altitude', value: 'environ 4 805 m' },
    facts: [
      'Il a été gravi pour la première fois en 1786.',
      "Sa hauteur change un peu chaque année, selon l'épaisseur de la neige au sommet.",
    ],
  },

  // ------------------------------------------------------------- Afrique
  {
    id: 'pyramides', name: 'Les pyramides de Gizeh', kind: 'monument', country: 'Égypte', flags: ['eg'], continent: 'Afrique',
    lat: 29.979, lon: 31.134, icon: '🔺',
    clue: 'Les tombeaux géants des pharaons, gardés par le Sphinx.',
    stat: { label: 'Âge', value: 'environ 4 500 ans' },
    facts: [
      'La grande pyramide de Khéops est la seule des Sept Merveilles du monde antique encore debout.',
      "Elle a été le plus haut monument construit par l'homme pendant près de 4 000 ans !",
    ],
  },
  {
    id: 'abou-simbel', name: "Les temples d'Abou Simbel", kind: 'monument', country: 'Égypte', flags: ['eg'], continent: 'Afrique',
    lat: 22.337, lon: 31.626, icon: '👑',
    clue: 'Des temples taillés dans la falaise, gardés par quatre statues géantes d\'un pharaon.',
    stat: { label: 'Construits vers', value: '1260 av. J.-C.' },
    facts: [
      'Dans les années 1960, ils ont été découpés en gros blocs et remontés plus haut, pour ne pas être engloutis par un lac.',
      'Deux fois par an, le soleil entre jusqu\'au fond du temple et éclaire les statues.',
    ],
  },
  {
    id: 'djenne', name: 'La Grande Mosquée de Djenné', kind: 'monument', country: 'Mali', flags: ['ml'], continent: 'Afrique',
    lat: 13.905, lon: -4.555, icon: '🕌',
    clue: 'Le plus grand bâtiment du monde construit en terre crue.',
    stat: { label: 'Reconstruite en', value: '1907' },
    facts: [
      "Chaque année, les habitants la recouvrent d'une nouvelle couche de boue, lors d'une grande fête.",
      "Les morceaux de bois qui dépassent des murs servent d'échafaudage pour l'entretenir.",
    ],
  },
  {
    id: 'lalibela', name: 'Les églises de Lalibela', kind: 'monument', country: 'Éthiopie', flags: ['et'], continent: 'Afrique',
    lat: 12.032, lon: 39.047, icon: '⛪',
    clue: 'Onze églises creusées directement dans la roche, du haut vers le bas.',
    stat: { label: 'Creusées vers', value: 'les XIIᵉ et XIIIᵉ siècles' },
    facts: [
      'Chaque église a été sculptée dans un seul bloc de roche, en creusant tout autour.',
      "L'église Saint-Georges a la forme d'une croix quand on la regarde du ciel.",
    ],
  },
  {
    id: 'kilimandjaro', name: 'Le Kilimandjaro', kind: 'nature', country: 'Tanzanie', flags: ['tz'], continent: 'Afrique',
    lat: -3.067, lon: 37.356, icon: '🌋',
    clue: "La plus haute montagne d'Afrique : un volcan au sommet enneigé.",
    stat: { label: 'Altitude', value: '5 895 m' },
    facts: [
      "Il est tout près de l'équateur, et pourtant de la neige et des glaciers couvrent son sommet.",
      'Ses glaciers fondent peu à peu à cause du réchauffement climatique.',
    ],
  },
  {
    id: 'chutes-victoria', name: 'Les chutes Victoria', kind: 'nature', country: 'Zambie et Zimbabwe', flags: ['zm', 'zw'], continent: 'Afrique',
    lat: -17.924, lon: 25.857, icon: '🌈',
    clue: "Un immense rideau d'eau surnommé « la fumée qui gronde ».",
    stat: { label: 'Largeur', value: 'environ 1,7 km' },
    facts: [
      'Elles se trouvent sur le fleuve Zambèze, à la frontière entre la Zambie et le Zimbabwe.',
      "Le nuage d'eau qu'elles soulèvent se voit à des dizaines de kilomètres.",
    ],
  },
  {
    id: 'namib', name: 'Les dunes du Namib', kind: 'nature', country: 'Namibie', flags: ['na'], continent: 'Afrique',
    lat: -24.727, lon: 15.341, icon: '🏜️',
    clue: "Des dunes de sable rouge parmi les plus hautes du monde, au bord de l'océan.",
    stat: { label: 'Hauteur des dunes', value: 'plus de 300 m' },
    facts: [
      'Le Namib est sans doute le plus vieux désert du monde.',
      "Certains scarabées y boivent… le brouillard qui arrive de l'océan !",
    ],
  },
  {
    id: 'baobabs', name: "L'allée des Baobabs", kind: 'nature', country: 'Madagascar', flags: ['mg'], continent: 'Afrique',
    lat: -20.251, lon: 44.418, icon: '🌳',
    clue: 'Une route bordée d\'arbres géants à la silhouette étrange, sur une très grande île.',
    stat: { label: 'Âge des arbres', value: "jusqu'à 800 ans" },
    facts: [
      "Les baobabs stockent des milliers de litres d'eau dans leur tronc.",
      "On les surnomme parfois « les arbres à l'envers » : leurs branches ressemblent à des racines.",
    ],
  },

  // ------------------------------------------------------------- Asie
  {
    id: 'grande-muraille', name: 'La Grande Muraille', kind: 'monument', country: 'Chine', flags: ['cn'], continent: 'Asie',
    lat: 40.354, lon: 116.006, icon: '🧱',
    clue: 'Un mur immense, construit pendant des siècles pour protéger un empire.',
    stat: { label: 'Longueur', value: 'plus de 20 000 km' },
    facts: [
      "On dit souvent qu'on la voit de l'espace à l'œil nu… mais c'est faux : elle est trop étroite !",
      'Sa construction s\'est étalée sur plus de 2 000 ans.',
    ],
  },
  {
    id: 'taj-mahal', name: 'Le Taj Mahal', kind: 'monument', country: 'Inde', flags: ['in'], continent: 'Asie',
    lat: 27.175, lon: 78.042, icon: '💍',
    clue: 'Un magnifique mausolée de marbre blanc, construit par amour.',
    stat: { label: 'Terminé vers', value: '1653' },
    facts: [
      "L'empereur Shah Jahan l'a fait construire en mémoire de son épouse, Mumtaz Mahal.",
      "Son marbre blanc change de couleur selon l'heure : rosé le matin, doré le soir.",
    ],
  },
  {
    id: 'petra', name: 'Pétra', kind: 'monument', country: 'Jordanie', flags: ['jo'], continent: 'Asie',
    lat: 30.329, lon: 35.444, icon: '🐫',
    clue: 'Une ville antique sculptée dans la roche rose du désert.',
    stat: { label: 'Âge', value: 'plus de 2 000 ans' },
    facts: [
      'Elle a été creusée par les Nabatéens, un peuple de marchands.',
      "On y entre par le Siq, un étroit canyon long de plus d'un kilomètre.",
    ],
  },
  {
    id: 'angkor-vat', name: 'Angkor Vat', kind: 'monument', country: 'Cambodge', flags: ['kh'], continent: 'Asie',
    lat: 13.412, lon: 103.867, icon: '🛕',
    clue: 'Le plus grand monument religieux du monde, au cœur de la jungle.',
    stat: { label: 'Construit au', value: 'XIIᵉ siècle' },
    facts: [
      'Il est si important pour son pays qu\'il figure sur le drapeau du Cambodge !',
      "Il est entouré d'un immense fossé rempli d'eau, comme un château fort.",
    ],
  },
  {
    id: 'burj-khalifa', name: 'Burj Khalifa', kind: 'monument', country: 'Émirats arabes unis', flags: ['ae'], continent: 'Asie',
    lat: 25.197, lon: 55.274, icon: '🏙️',
    clue: 'Le plus haut gratte-ciel du monde, au bord du désert.',
    stat: { label: 'Hauteur', value: '828 m' },
    facts: [
      'Inauguré en 2010, il compte plus de 160 étages.',
      'Par temps clair, on voit son sommet à près de 100 km de distance.',
    ],
  },
  {
    id: 'everest', name: "L'Everest", kind: 'nature', country: 'Népal et Chine', flags: ['np', 'cn'], continent: 'Asie',
    lat: 27.988, lon: 86.925, icon: '🏔️',
    clue: 'La plus haute montagne du monde.',
    stat: { label: 'Altitude', value: '8 849 m' },
    facts: [
      'Il a été gravi pour la première fois en 1953, par Edmund Hillary et Tenzing Norgay.',
      "Au sommet, l'air contient si peu d'oxygène que la plupart des alpinistes respirent avec des bouteilles.",
    ],
  },
  {
    id: 'mont-fuji', name: 'Le mont Fuji', kind: 'nature', country: 'Japon', flags: ['jp'], continent: 'Asie',
    lat: 35.361, lon: 138.727, icon: '🗻',
    clue: 'Un volcan presque parfaitement conique, symbole de son pays.',
    stat: { label: 'Altitude', value: '3 776 m' },
    facts: [
      'Sa dernière éruption date de 1707.',
      "Chaque été, des centaines de milliers de personnes l'escaladent.",
    ],
  },
  {
    id: 'baikal', name: 'Le lac Baïkal', kind: 'nature', country: 'Russie', flags: ['ru'], continent: 'Asie',
    lat: 53.5, lon: 108.2, icon: '💎',
    clue: 'Le lac le plus profond du monde, au cœur de la Sibérie.',
    stat: { label: 'Profondeur', value: '1 642 m' },
    facts: [
      "Il contient à lui seul environ 20 % de l'eau douce liquide de surface de la planète.",
      "C'est le plus vieux lac du monde : il a environ 25 millions d'années.",
      "On le surnomme « la perle de la Sibérie ». Des phoques d'eau douce y vivent !",
    ],
  },
  {
    id: 'ha-long', name: "La baie d'Ha Long", kind: 'nature', country: 'Viêt Nam', flags: ['vn'], continent: 'Asie',
    lat: 20.910, lon: 107.184, icon: '🐉',
    clue: 'Une baie parsemée de près de 2 000 îles et rochers.',
    stat: { label: 'Îles et rochers', value: 'près de 2 000' },
    facts: [
      'Son nom signifie « là où le dragon descend dans la mer ».',
      'Selon la légende, un dragon a créé les îles en crachant des pierres précieuses.',
    ],
  },
  {
    id: 'mer-morte', name: 'La mer Morte', kind: 'nature', country: 'Jordanie, Israël et Palestine', flags: ['jo', 'il', 'ps'], continent: 'Asie',
    lat: 31.5, lon: 35.5, icon: '🧂',
    clue: "Un lac si salé qu'on y flotte sans aucun effort.",
    stat: { label: 'Altitude', value: 'environ −430 m' },
    facts: [
      'Ses rives sont le point le plus bas de toutes les terres émergées.',
      "Son eau est presque 10 fois plus salée que celle de l'océan : aucun poisson ne peut y vivre.",
    ],
  },

  // ------------------------------------------------------------- Amérique du Nord
  {
    id: 'statue-liberte', name: 'La statue de la Liberté', kind: 'monument', country: 'États-Unis', flags: ['us'], continent: 'Amérique du Nord',
    lat: 40.689, lon: -74.045, icon: '🗽',
    clue: "Une statue géante qui brandit une torche à l'entrée d'un grand port.",
    stat: { label: 'Hauteur', value: '93 m avec son socle' },
    facts: [
      "C'est un cadeau de la France aux États-Unis, inauguré en 1886.",
      'Gustave Eiffel a conçu sa structure intérieure en métal !',
    ],
  },
  {
    id: 'chichen-itza', name: 'Chichén Itzá', kind: 'monument', country: 'Mexique', flags: ['mx'], continent: 'Amérique du Nord',
    lat: 20.684, lon: -88.568, icon: '🐍',
    clue: 'Une ancienne cité maya avec une grande pyramide à degrés.',
    stat: { label: 'Âge d\'or', value: 'vers l\'an 1000' },
    facts: [
      "Sa pyramide compte 365 marches, autant que de jours dans l'année.",
      "Aux équinoxes, l'ombre dessine un serpent qui semble descendre l'escalier.",
    ],
  },
  {
    id: 'mont-rushmore', name: 'Le mont Rushmore', kind: 'monument', country: 'États-Unis', flags: ['us'], continent: 'Amérique du Nord',
    lat: 43.879, lon: -103.459, icon: '🎩',
    clue: 'Les visages de quatre présidents sculptés dans une montagne.',
    stat: { label: 'Hauteur des visages', value: '18 m' },
    facts: [
      'On y reconnaît Washington, Jefferson, Theodore Roosevelt et Lincoln.',
      'Il a fallu 14 ans de travail, de 1927 à 1941.',
    ],
  },
  {
    id: 'golden-gate', name: 'Le Golden Gate Bridge', kind: 'monument', country: 'États-Unis', flags: ['us'], continent: 'Amérique du Nord',
    lat: 37.820, lon: -122.478, icon: '🌉',
    clue: 'Un grand pont suspendu orange, souvent caché dans le brouillard.',
    stat: { label: 'Longueur', value: '2,7 km' },
    facts: [
      'Inauguré en 1937, il a longtemps été le plus long pont suspendu du monde.',
      'Sa couleur orange l\'aide à rester visible dans le brouillard.',
    ],
  },
  {
    id: 'grand-canyon', name: 'Le Grand Canyon', kind: 'nature', country: 'États-Unis', flags: ['us'], continent: 'Amérique du Nord',
    lat: 36.107, lon: -112.113, icon: '🏞️',
    clue: 'Une gorge gigantesque creusée par une rivière pendant des millions d\'années.',
    stat: { label: 'Profondeur', value: "jusqu'à 1 800 m" },
    facts: [
      "C'est le fleuve Colorado qui a creusé la roche, petit à petit.",
      "Ses couches de roche colorées racontent près de 2 milliards d'années d'histoire de la Terre.",
    ],
  },
  {
    id: 'niagara', name: 'Les chutes du Niagara', kind: 'nature', country: 'Canada et États-Unis', flags: ['ca', 'us'], continent: 'Amérique du Nord',
    lat: 43.083, lon: -79.074, icon: '💦',
    clue: "D'énormes chutes d'eau à la frontière entre deux grands pays.",
    stat: { label: 'Hauteur', value: 'environ 50 m' },
    facts: [
      "Chaque seconde, des millions de litres d'eau dévalent les chutes.",
      'Des funambules les ont déjà traversées… sur un fil !',
    ],
  },
  {
    id: 'yellowstone', name: 'Yellowstone', kind: 'nature', country: 'États-Unis', flags: ['us'], continent: 'Amérique du Nord',
    lat: 44.428, lon: -110.588, icon: '♨️',
    clue: 'Le tout premier parc national du monde, plein de geysers et de sources chaudes.',
    stat: { label: 'Créé en', value: '1872' },
    facts: [
      "Le geyser Old Faithful projette de l'eau bouillante très régulièrement, environ toutes les heures et demie.",
      'Sous le parc dort un super-volcan !',
    ],
  },

  // ------------------------------------------------------------- Amérique du Sud
  {
    id: 'machu-picchu', name: 'Le Machu Picchu', kind: 'monument', country: 'Pérou', flags: ['pe'], continent: 'Amérique du Sud',
    lat: -13.163, lon: -72.545, icon: '⛰️',
    clue: 'Une cité inca perchée au sommet d\'une montagne.',
    stat: { label: 'Altitude', value: 'environ 2 430 m' },
    facts: [
      'Elle a été construite au XVᵉ siècle par les Incas.',
      "Ses pierres s'emboîtent si bien qu'on ne peut pas glisser une feuille de papier entre elles !",
    ],
  },
  {
    id: 'christ-redempteur', name: 'Le Christ Rédempteur', kind: 'monument', country: 'Brésil', flags: ['br'], continent: 'Amérique du Sud',
    lat: -22.952, lon: -43.211, icon: '🙌',
    clue: 'Une statue géante aux bras ouverts, qui domine une célèbre baie.',
    stat: { label: 'Hauteur', value: '38 m avec son socle' },
    facts: [
      'Inaugurée en 1931 à Rio de Janeiro, elle est en béton recouvert de petits carreaux de pierre.',
      'Elle est frappée par la foudre plusieurs fois par an !',
    ],
  },
  {
    id: 'iguazu', name: "Les chutes d'Iguazú", kind: 'nature', country: 'Argentine et Brésil', flags: ['ar', 'br'], continent: 'Amérique du Sud',
    lat: -25.695, lon: -54.437, icon: '🦋',
    clue: 'Un immense ensemble de près de 275 cascades, en pleine forêt tropicale.',
    stat: { label: 'Nombre de chutes', value: 'environ 275' },
    facts: [
      "Elles se trouvent à la frontière entre l'Argentine et le Brésil.",
      'La plus impressionnante s\'appelle « la Gorge du Diable ».',
    ],
  },
  {
    id: 'salto-angel', name: 'Le Salto Ángel', kind: 'nature', country: 'Venezuela', flags: ['ve'], continent: 'Amérique du Sud',
    lat: 5.967, lon: -62.536, icon: '💧',
    clue: "La plus haute chute d'eau du monde.",
    stat: { label: 'Hauteur', value: '979 m' },
    facts: [
      "L'eau tombe de si haut qu'une partie se transforme en brume avant d'atteindre le sol.",
      'Elle tombe du haut d\'un tepuy, une montagne au sommet tout plat.',
    ],
  },
  {
    id: 'galapagos', name: 'Les îles Galápagos', kind: 'nature', country: 'Équateur', flags: ['ec'], continent: 'Amérique du Sud',
    lat: -0.954, lon: -90.966, icon: '🐢',
    clue: 'Des îles volcaniques au milieu du Pacifique, peuplées de tortues géantes.',
    stat: { label: 'Grandes îles', value: '13' },
    facts: [
      "Le savant Charles Darwin les a visitées en 1835 : elles l'ont aidé à comprendre l'évolution des espèces.",
      'Les tortues géantes peuvent vivre plus de 100 ans !',
    ],
  },
  {
    id: 'atacama', name: "Le désert d'Atacama", kind: 'nature', country: 'Chili', flags: ['cl'], continent: 'Amérique du Sud',
    lat: -23.86, lon: -69.13, icon: '🔭',
    clue: 'Le désert le plus sec du monde (en dehors des pôles).',
    stat: { label: 'Pluie', value: 'presque jamais' },
    facts: [
      "Certaines stations météo n'y ont jamais enregistré la moindre goutte de pluie.",
      'Son ciel très pur attire les astronomes : on y a construit de grands télescopes.',
    ],
  },
  {
    id: 'amazonie', name: 'La forêt amazonienne', kind: 'nature', country: 'Surtout le Brésil', flags: ['br'], continent: 'Amérique du Sud',
    lat: -3.4, lon: -62.2, icon: '🦜',
    clue: 'La plus grande forêt tropicale du monde, traversée par un fleuve géant.',
    stat: { label: 'Superficie', value: 'environ 5,5 millions de km²' },
    facts: [
      'On la surnomme « le poumon de la planète ».',
      'Environ une espèce animale ou végétale connue sur dix y vit.',
    ],
  },

  // ------------------------------------------------------------- Océanie
  {
    id: 'moai', name: "Les moaï de l'île de Pâques", kind: 'monument', country: 'Chili', flags: ['cl'], continent: 'Océanie',
    lat: -27.113, lon: -109.350, icon: '🗿',
    clue: 'Des centaines de statues géantes de pierre, sur une île perdue du Pacifique.',
    stat: { label: 'Nombre', value: 'près de 900 statues' },
    facts: [
      "L'île de Pâques est l'une des îles habitées les plus isolées du monde.",
      "La plupart des moaï regardent vers l'intérieur de l'île, pas vers la mer.",
    ],
  },
  {
    id: 'opera-sydney', name: "L'opéra de Sydney", kind: 'monument', country: 'Australie', flags: ['au'], continent: 'Océanie',
    lat: -33.857, lon: 151.215, icon: '🎭',
    clue: 'Une salle de spectacle dont le toit ressemble à des voiles de bateau.',
    stat: { label: 'Inauguré en', value: '1973' },
    facts: [
      "Son toit est recouvert de plus d'un million de tuiles blanches.",
      'Il a été imaginé par un architecte danois, Jørn Utzon.',
    ],
  },
  {
    id: 'grande-barriere', name: 'La Grande Barrière de corail', kind: 'nature', country: 'Australie', flags: ['au'], continent: 'Océanie',
    lat: -18.287, lon: 147.699, icon: '🐠',
    clue: 'Le plus grand récif de corail du monde.',
    stat: { label: 'Longueur', value: 'plus de 2 300 km' },
    facts: [
      "Elle est si grande qu'on peut l'apercevoir depuis l'espace !",
      'Elle abrite des milliers d\'espèces de poissons, de tortues et de coraux.',
    ],
  },
  {
    id: 'uluru', name: 'Uluru', kind: 'nature', country: 'Australie', flags: ['au'], continent: 'Océanie',
    lat: -25.344, lon: 131.037, icon: '🌄',
    clue: 'Un énorme rocher rouge, seul au milieu du désert.',
    stat: { label: 'Hauteur', value: '348 m' },
    facts: [
      "C'est un lieu sacré pour les Anangu, un peuple aborigène.",
      'Il change de couleur selon la lumière : il devient rouge flamboyant au coucher du soleil.',
    ],
  },
  {
    id: 'fosse-mariannes', name: 'La fosse des Mariannes', kind: 'nature', country: 'Océan Pacifique', flags: [], continent: 'Océanie',
    lat: 11.35, lon: 142.2, icon: '🌊',
    clue: "L'endroit le plus profond de tous les océans.",
    stat: { label: 'Profondeur', value: 'près de 11 000 m' },
    facts: [
      "Si on y posait l'Everest, son sommet serait encore à plus de 2 km sous l'eau !",
      'Seules quelques personnes sont descendues tout au fond, dans des sous-marins spéciaux.',
    ],
  },
];
