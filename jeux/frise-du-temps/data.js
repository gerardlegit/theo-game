// ============================================================================
// Les grandes périodes et les événements de La Frise du Temps.
//
// Chaque événement :
//  - era    : la période (voir ERAS) — sert à colorier la frise
//  - year   : l'année, en nombre, pour trier la frise (négatif = av. J.-C.)
//  - date   : la date telle qu'on l'affiche
//  - title  : le titre sur la grande carte, short : le titre sur la frise
//  - text   : ce qu'on raconte AVANT de placer la carte (sans la date !)
//  - fact   : « Le savais-tu ? », montré une fois la carte placée
// Les illustrations sont dessinées dans art.js (même id).
// ============================================================================

export const ERAS = [
  { id: 'avant', name: 'Avant les humains', short: 'Avant les humains', icon: '🦕', color: '#2FA36B', range: 'Il y a des millions d\'années' },
  { id: 'prehistoire', name: 'Préhistoire', short: 'Préhistoire', icon: '🔥', color: '#D9773F', range: 'Jusqu\'à l\'invention de l\'écriture' },
  { id: 'antiquite', name: 'Antiquité', short: 'Antiquité', icon: '🏛️', color: '#E2A21A', range: '3300 av. J.-C. → 476' },
  { id: 'moyen-age', name: 'Moyen Âge', short: 'Moyen Âge', icon: '🏰', color: '#3F7FE0', range: '476 → 1492' },
  { id: 'modernes', name: 'Temps modernes', short: 'Temps modernes', icon: '⛵', color: '#9256DB', range: '1492 → 1789' },
  { id: 'contemporaine', name: 'Époque contemporaine', short: 'Contemporaine', icon: '🚀', color: '#EC4F78', range: '1789 → aujourd\'hui' },
];

export const ERA_BY_ID = Object.fromEntries(ERAS.map((e) => [e.id, e]));

export const EVENTS = [
  // ------------------------------------------------------------ Avant les humains
  {
    id: 'dinosaures', era: 'avant', year: -66000000, date: 'Il y a 66 millions d\'années',
    title: 'La fin des dinosaures', short: 'Fin des dinosaures',
    text: 'Une énorme météorite de 10 km de large s\'écrase sur la Terre. Le ciel s\'assombrit, le climat change… et la plupart des dinosaures disparaissent.',
    fact: 'Aucun humain n\'a jamais vu de dinosaure vivant ! Mais les oiseaux sont leurs descendants : une poule est une lointaine cousine du T. rex.',
  },

  // ------------------------------------------------------------ Préhistoire
  {
    id: 'feu', era: 'prehistoire', year: -400000, date: 'Il y a environ 400 000 ans',
    title: 'Les humains maîtrisent le feu', short: 'Maîtrise du feu',
    text: 'Nos lointains ancêtres apprennent à allumer et à garder le feu. Ils peuvent enfin se réchauffer, cuire leur viande et éloigner les bêtes sauvages.',
    fact: 'Pour allumer un feu, on frottait très vite deux morceaux de bois, ou on frappait deux pierres pour faire jaillir des étincelles.',
  },
  {
    id: 'lascaux', era: 'prehistoire', year: -16000, date: 'Il y a environ 18 000 ans',
    title: 'Les peintures de la grotte de Lascaux', short: 'Grotte de Lascaux',
    text: 'Dans une grotte en France, des artistes peignent des chevaux, des taureaux et des cerfs sur les murs, à la lueur de petites lampes à graisse.',
    fact: 'La grotte a été découverte en 1940 par quatre adolescents… et leur chien, qui s\'appelait Robot !',
  },
  {
    id: 'paysans', era: 'prehistoire', year: -9000, date: 'Il y a environ 11 000 ans',
    title: 'Les premiers paysans', short: 'Premiers paysans',
    text: 'Au Proche-Orient, des humains arrêtent de se déplacer sans cesse : ils sèment du blé, élèvent des chèvres et des moutons, et bâtissent les premiers villages.',
    fact: 'C\'est le début du Néolithique. Le chien, lui, était déjà le meilleur ami de l\'homme depuis bien plus longtemps !',
  },

  // ------------------------------------------------------------ Antiquité
  {
    id: 'ecriture', era: 'antiquite', year: -3300, date: 'Vers 3300 av. J.-C.',
    title: 'L\'invention de l\'écriture', short: 'Invention de l\'écriture',
    text: 'En Mésopotamie (l\'Irak d\'aujourd\'hui), on trace de petits signes en forme de clous sur des tablettes d\'argile. C\'est la naissance de l\'écriture… et la fin de la Préhistoire !',
    fact: 'Les tout premiers textes servaient surtout à compter : des sacs de grain, des moutons, des jarres d\'huile…',
  },
  {
    id: 'pyramides', era: 'antiquite', year: -2560, date: 'Vers 2560 av. J.-C.',
    title: 'La construction des pyramides de Gizeh', short: 'Pyramides de Gizeh',
    text: 'En Égypte, des milliers d\'ouvriers empilent d\'énormes blocs de pierre pour bâtir le tombeau du pharaon Khéops.',
    fact: 'La grande pyramide est restée le monument le plus haut du monde pendant près de 4 000 ans !',
  },
  {
    id: 'jeux-olympiques', era: 'antiquite', year: -776, date: '776 av. J.-C.',
    title: 'Les premiers Jeux olympiques', short: 'Premiers Jeux olympiques',
    text: 'En Grèce, à Olympie, des athlètes se rassemblent pour honorer le dieu Zeus. La toute première épreuve est une course à pied.',
    fact: 'Le vainqueur ne gagnait pas de médaille, mais une couronne de feuilles d\'olivier !',
  },
  {
    id: 'muraille', era: 'antiquite', year: -220, date: 'Vers 220 av. J.-C.',
    title: 'La Grande Muraille de Chine', short: 'Grande Muraille de Chine',
    text: 'Le premier empereur de Chine fait relier de longs murs entre eux pour protéger son empire des attaques venues du nord.',
    fact: 'La muraille a été agrandie pendant des siècles. Mais, contrairement à ce qu\'on raconte, on ne la voit pas à l\'œil nu depuis l\'espace !',
  },
  {
    id: 'cesar', era: 'antiquite', year: -49, date: 'De 49 à 44 av. J.-C.',
    title: 'Le règne de Jules César', short: 'Règne de Jules César',
    text: 'Le général romain Jules César a conquis la Gaule (notre France) en battant Vercingétorix. Il devient ensuite le maître tout-puissant de Rome.',
    fact: 'Le mois de juillet porte son nom : Julius → juillet !',
  },

  // ------------------------------------------------------------ Moyen Âge
  {
    id: 'chute-rome', era: 'moyen-age', year: 476, date: '476',
    title: 'La chute de l\'Empire romain', short: 'Chute de l\'Empire romain',
    text: 'Le dernier empereur romain d\'Occident, un adolescent nommé Romulus Augustule, est chassé par un chef germain. L\'Antiquité se termine, le Moyen Âge commence !',
    fact: 'À sa plus grande taille, l\'Empire romain allait de l\'Angleterre jusqu\'à l\'Égypte !',
  },
  {
    id: 'charlemagne', era: 'moyen-age', year: 800, date: '25 décembre 800',
    title: 'Charlemagne devient empereur', short: 'Sacre de Charlemagne',
    text: 'Le roi des Francs, Charlemagne, est couronné empereur à Rome, le jour de Noël. Il règne sur une grande partie de l\'Europe.',
    fact: 'Charlemagne n\'a pas inventé l\'école, comme dit la chanson… mais il a beaucoup aidé à en ouvrir !',
  },
  {
    id: 'jeanne-arc', era: 'moyen-age', year: 1429, date: '1429',
    title: 'Jeanne d\'Arc délivre Orléans', short: 'Jeanne d\'Arc à Orléans',
    text: 'Pendant la guerre de Cent Ans contre les Anglais, une jeune paysanne de 17 ans, Jeanne d\'Arc, prend la tête de l\'armée française et libère la ville d\'Orléans.',
    fact: 'La guerre de Cent Ans porte mal son nom : elle a duré… 116 ans !',
  },
  {
    id: 'imprimerie', era: 'moyen-age', year: 1450, date: 'Vers 1450',
    title: 'L\'invention de l\'imprimerie', short: 'Imprimerie de Gutenberg',
    text: 'En Allemagne, Gutenberg invente une machine avec de petites lettres en métal que l\'on peut déplacer. On peut enfin fabriquer des livres très vite !',
    fact: 'Avant, les livres étaient recopiés à la main par des moines : il fallait parfois des années pour en faire un seul !',
  },

  // ------------------------------------------------------------ Temps modernes
  {
    id: 'amerique', era: 'modernes', year: 1492, date: '1492',
    title: 'Christophe Colomb découvre l\'Amérique', short: 'Colomb arrive en Amérique',
    text: 'Le navigateur Christophe Colomb veut rejoindre l\'Asie en traversant l\'océan vers l\'ouest. Après plus de deux mois de voyage, ses trois navires arrivent… sur un continent inconnu des Européens !',
    fact: 'Colomb est mort persuadé d\'être arrivé en Asie. Et des peuples vivaient déjà en Amérique depuis des milliers d\'années !',
  },
  {
    id: 'joconde', era: 'modernes', year: 1503, date: 'Vers 1503',
    title: 'Léonard de Vinci peint la Joconde', short: 'La Joconde',
    text: 'Le génial artiste italien Léonard de Vinci peint le portrait d\'une dame au sourire mystérieux. C\'est aujourd\'hui le tableau le plus célèbre du monde.',
    fact: 'La Joconde est exposée au musée du Louvre, à Paris. Léonard de Vinci a aussi dessiné des machines volantes !',
  },
  {
    id: 'versailles', era: 'modernes', year: 1682, date: '1682',
    title: 'Louis XIV s\'installe à Versailles', short: 'Louis XIV à Versailles',
    text: 'Le roi Louis XIV, surnommé le Roi-Soleil, transforme un petit pavillon de chasse en un immense château plein d\'or, de jardins et de miroirs.',
    fact: 'La célèbre galerie des Glaces du château compte 357 miroirs !',
  },

  // ------------------------------------------------------------ Époque contemporaine
  {
    id: 'bastille', era: 'contemporaine', year: 1789, date: '14 juillet 1789',
    title: 'La prise de la Bastille', short: 'Prise de la Bastille',
    text: 'À Paris, le peuple en colère attaque la Bastille, une prison qui représente le pouvoir du roi. C\'est le début de la Révolution française.',
    fact: 'C\'est pour cela que le 14 juillet est la fête nationale française, avec son défilé et ses feux d\'artifice !',
  },
  {
    id: 'avion', era: 'contemporaine', year: 1903, date: '1903',
    title: 'Le premier vol en avion', short: 'Premier vol en avion',
    text: 'Aux États-Unis, les frères Wright font décoller un avion à moteur pour la toute première fois. Le vol dure… 12 secondes !',
    fact: 'Seulement 66 ans plus tard, des humains marchaient sur la Lune !',
  },
  {
    id: 'lune', era: 'contemporaine', year: 1969, date: 'Juillet 1969',
    title: 'Les premiers pas sur la Lune', short: 'Premiers pas sur la Lune',
    text: 'L\'astronaute américain Neil Armstrong devient le premier humain à marcher sur la Lune. Des millions de gens regardent l\'exploit à la télévision !',
    fact: 'Ses traces de pas sont sûrement toujours là : sur la Lune, il n\'y a pas de vent pour les effacer !',
  },
  {
    id: 'web', era: 'contemporaine', year: 1991, date: '1991',
    title: 'La naissance du Web', short: 'Naissance du Web',
    text: 'Un chercheur anglais, Tim Berners-Lee, invente le « World Wide Web » : des pages reliées entre elles que l\'on peut lire sur Internet depuis n\'importe quel ordinateur.',
    fact: 'Le tout premier site web existe encore ! Aujourd\'hui, il y a plus d\'un milliard de sites.',
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
