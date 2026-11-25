// ============================================================================
// Les textes de La Marche des Pompons : les six métiers (avec leur fiche
// « Le savais-tu ? »), et tout ce que dit Plume, la chouette qui guide l'enfant.
// ============================================================================

/* Les métiers, dans l'ordre des boutons. « garde » = le Pompon le garde pour toujours. */
export const SKILLS = [
  {
    id: 'stop', nom: 'Stop', touche: '1',
    court: 'Il ne bouge plus : les autres font demi-tour.',
    comment: 'Le Pompon tend les bras et ne bouge plus. Les autres rebondissent sur lui et repartent dans l’autre sens. Touche-le encore une fois pour qu’il reparte.',
    fait: 'Dans une ruche, des abeilles gardiennes se postent à l’entrée et bloquent le passage aux intruses qui ne sentent pas l’odeur de la ruche !',
    icone: '✋',
  },
  {
    id: 'pont', nom: 'Pont', touche: '2',
    court: 'Il pose 12 briques en escalier.',
    comment: 'Le Pompon pose 12 briques qui montent en escalier : de quoi passer au-dessus de l’eau ou grimper sur une petite marche. Quand il n’a plus de briques, il hausse les épaules.',
    fait: 'Les fourmis légionnaires s’accrochent les unes aux autres pour former de vrais ponts vivants, et toute la colonie passe dessus !',
    icone: '🧱',
  },
  {
    id: 'creuse', nom: 'Creuseur', touche: '3',
    court: 'Il creuse un trou vers le bas.',
    comment: 'Le Pompon creuse tout droit vers le bas, jusqu’à traverser le sol. Attention : la roche grise est bien trop dure !',
    fait: 'La taupe creuse ses galeries avec ses grosses pattes en forme de pelle. Elle peut avancer de plusieurs mètres en une seule heure !',
    icone: '⛏️',
  },
  {
    id: 'tunnel', nom: 'Tunnel', touche: '4',
    court: 'Il creuse tout droit devant lui.',
    comment: 'Le Pompon creuse un tunnel droit devant lui, à travers la terre et les briques. Devant la roche grise, il s’arrête.',
    fait: 'Le tunnel sous la Manche relie la France et l’Angleterre. Il mesure 50 kilomètres, et une grande partie passe sous la mer !',
    icone: '➡️',
  },
  {
    id: 'grimpe', nom: 'Grimpeur', touche: '5', garde: true,
    court: 'Il escalade les murs (pour toujours).',
    comment: 'Quand il arrive contre un mur, le Grimpeur l’escalade au lieu de faire demi-tour. Il garde ce métier pour toujours, en plus de son travail.',
    fait: 'Le gecko grimpe sur les murs et même au plafond : sous ses doigts, des millions de poils minuscules s’accrochent à la moindre surface.',
    icone: '🧗',
  },
  {
    id: 'parapluie', nom: 'Parapluie', touche: '6', garde: true,
    court: 'Il descend tout doucement (pour toujours).',
    comment: 'Le Pompon ouvre son parapluie quand il tombe : il peut sauter de très haut sans se faire mal. Il le garde pour toujours.',
    fait: 'Les graines de pissenlit ont un petit parachute de poils : le vent peut les emporter à plusieurs kilomètres avant qu’elles se posent.',
    icone: '☂️',
  },
  {
    id: 'echelle', nom: 'Échelle', touche: '7',
    court: 'Il pose une échelle contre un mur ou au bord d’un trou.',
    comment: 'Tout près d’un mur, le Pompon pose une échelle pour monter. Tout près d’un bord, il la pose pour descendre. L’échelle reste : tous les Pompons qui arrivent dessus montent… ou descendent ! Elle mesure 7 cubes au plus.',
    fait: 'Les pompiers ont de très grandes échelles sur leurs camions : certaines montent à plus de 30 mètres, aussi haut qu’un immeuble de 10 étages !',
    icone: '🔺',
  },
  {
    id: 'friandise', nom: 'Friandise', touche: '8',
    court: 'Il lance une friandise sur un méchant clown.',
    comment: 'Le Pompon lance une friandise droit devant lui. Elle rebondit, puis roule tout droit jusqu’à toucher un méchant clown… ou un mur. Pouf ! le clown s’envole en confettis. Attention : l’eau et la lave l’arrêtent aussi.',
    fait: 'Il y a plus de 3 000 ans, en Égypte, on faisait déjà des friandises avec du miel, des dattes et des noix !',
    icone: '🍬',
  },
  {
    id: 'toboggan', nom: 'Toboggan', touche: '9',
    court: 'Il pose un toboggan pour descendre en diagonale.',
    comment: 'Tout près d’un bord, le Pompon pose un toboggan qui descend en diagonale jusqu’au premier sol. Tous ceux qui arrivent au bord glissent dessus, mais seulement vers le bas. Attention : on avance autant qu’on descend !',
    fait: 'Dans les fêtes foraines anglaises, le « helter skelter » est une grande tour avec un toboggan qui tourne autour : on glisse assis sur un petit tapis !',
    icone: '🎢',
  },
  {
    id: 'chaussures', nom: 'Chaussures', touche: '',
    court: 'Sur la Lune : il met ses chaussures et tombe doucement au sol.',
    comment: 'Sur la Lune, les Pompons flottent dans tous les sens. Avec des chaussures, ils tombent tout doucement, tout droit, juste en dessous d’eux. Attention à l’endroit : jamais au-dessus du vide ni sur un extraterrestre !',
    fait: 'Sur la Lune, tout pèse six fois moins lourd que sur la Terre. Les astronautes avaient de grosses bottes et faisaient des petits bonds en marchant !',
    icone: '👢',
  },
  {
    id: 'pioche', nom: 'Pioche', touche: '',
    court: 'Il creuse un tunnel en pente, vers le bas.',
    comment: 'Le Pompon creuse un tunnel en diagonale vers le bas : il avance autant qu’il descend, jusqu’à déboucher dans une grotte ou au bord d’une falaise. La roche grise l’arrête.',
    fait: 'Sur la Terre, les mineurs creusent des galeries en pente pour aller chercher le charbon ou les métaux, parfois à plus de mille mètres sous le sol !',
    icone: '↘️',
  },
  {
    id: 'pierre', nom: 'Pierre', touche: '',
    court: 'Il lance une pierre de Lune sur un extraterrestre.',
    comment: 'Le Pompon lance une pierre de Lune droit devant lui. Elle rebondit, puis roule tout droit jusqu’à toucher un extraterrestre… ou un mur. Zioup ! l’extraterrestre repart dans sa soucoupe.',
    fait: 'Les astronautes d’Apollo ont rapporté sur Terre presque 400 kilos de pierres de Lune ! Les savants les étudient encore aujourd’hui.',
    icone: '🌑',
  },
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

/* Les phrases de Plume */
export const PLUME = {
  nom: 'Plume',
  hello: 'Hou hou ! Moi, c’est Plume. Les Pompons marchent tout droit sans réfléchir… c’est toi qui vas réfléchir pour eux !',
  choose: ['Maintenant, touche un Pompon pour lui donner ce métier.', 'Choisis bien ton Pompon… et au bon moment !'],
  noSkill: 'Choisis d’abord un métier, en bas de l’écran.',
  empty: (nom) => `Il ne reste plus de ${nom}. Choisis un autre métier !`,
  busy: 'Ce Pompon ne peut pas maintenant : attends qu’il marche.',
  gone: 'Celui-là est déjà parti…',
  already: {
    grimpe: 'Celui-là sait déjà grimper !',
    parapluie: 'Il a déjà son parapluie.',
    autre: 'Il fait déjà ce métier !',
    chaussures: 'Il a déjà ses chaussures !',
  },
  nothing: 'Il n’y a rien à creuser devant lui. Attends qu’il touche le mur !',
  ladderNothing: 'Pour poser l’échelle, il faut être tout près d’un mur ou d’un bord !',
  ladderHigh: 'Trop haut ! Une échelle mesure 7 cubes au plus.',
  ladderBlocked: 'Quelque chose gêne : l’échelle ne peut pas se dresser ici.',
  ladder: ['Et hop, une échelle ! Tout le monde va la prendre, dans les deux sens.', 'L’échelle est posée !'],
  rumble: ['Le volcan gronde…', 'Ça tremble ! Vite, vite !'],
  slideNothing: 'Pour poser le toboggan, il faut être tout près d’un bord !',
  slideHigh: 'Trop long ! Le toboggan ne trouve pas de sol en dessous.',
  slideBlocked: 'Un mur gêne : le toboggan ne peut pas descendre par là.',
  slide: ['Wiiii ! Un toboggan ! On avance autant qu’on descend.', 'Le toboggan est posé : tout le monde glisse !'],
  clownDown: ['Pouf ! Le clown s’envole en confettis !', 'Bien visé ! Un clown de moins.'],
  flotte: 'Il flotte encore ! Mets-lui d’abord des chaussures.',
  boots: ['Hop, des chaussures ! Il descend tout doucement.', 'Regarde bien où il va tomber : juste en dessous de lui !'],
  stoneMiss: 'Raté ! Un mur ou un trou a arrêté la pierre. Lance-la du bon côté.',
  alienDown: ['Zioup ! L’extraterrestre repart dans sa soucoupe !', 'Bien visé ! Un extraterrestre de moins.'],
  candyMiss: 'Raté ! Un mur ou de l’eau a arrêté la friandise. Lance-la du bon côté, sans obstacle devant le clown.',
  rockAssign: 'Hou là ! C’est de la roche grise : impossible de la creuser.',
  rock: ['Bong ! La roche grise est trop dure.', 'Aïe, ça cogne ! La roche ne se creuse pas.'],
  bricksDone: ['Plus de briques ! Redonne-lui le métier Pont pour continuer.', 'Il hausse les épaules : son escalier est fini.'],
  bonk: 'Il s’est cogné ! Tu peux lui donner un autre métier pendant qu’il hausse les épaules.',
  free: 'Et c’est reparti !',
  saved: ['Youpi, un de plus à la maison !', 'Bienvenue chez toi, petit Pompon !', 'Bravo, il est rentré !', 'Et hop, à la maison !'],
  lost: {
    chute: ['Aïe ! Plus de 4 cubes de chute, c’est trop haut. Un parapluie l’aurait aidé.', 'Ouille, quelle bosse ! C’était trop haut pour lui.'],
    eau: ['Plouf ! Les Pompons ne savent pas nager.', 'Oh non, il est tombé à l’eau !'],
    ronces: ['Ouille, les ronces piquent !', 'Attention aux ronces !'],
    vide: ['Oh non, il est tombé dans le vide !'],
    lave: ['Ouille, la lave est brûlante ! Sa bulle le ramène au village.', 'Attention à la lave ! Il faut un chemin sans feu.'],
    clown: ['Miam ! Le méchant clown l’a gobé… mais sa bulle le ramène au village. Vite, une friandise !', 'Oh non, un clown ! Lance-lui une friandise avant que les autres arrivent.'],
    alien: ['Zap ! L’extraterrestre l’a attrapé avec son rayon… sa bulle le ramène au village. Vite, une pierre !', 'Attention aux extraterrestres ! Lance-leur des pierres.'],
  },
  lostAfter: '(Pas d’inquiétude : sa bulle le ramène tout doucement au village.)',
  onlyStops: 'Il ne reste que ton Stop. Touche-le pour qu’il reparte, ou appuie sur « Terminer ».',
  timeLow: 'Vite, il reste peu de temps !',
  needReached: 'Tu as sauvé assez de Pompons pour gagner ! Essaie d’en sauver encore plus pour les étoiles.',
  idle: ['Si tu es bloqué, le bouton 💡 donne un indice.', 'Tu peux mettre le jeu en pause ⏸ pour réfléchir tranquillement.', 'Le bouton ⏩ fait aller les Pompons plus vite.', 'Fais glisser l’écran pour voir plus loin.'],
  jokes: [
    'Pourquoi les Pompons sont si doux ? Parce qu’ils dorment dans des chaussettes !',
    'Moi, je vole… eux, ils marchent tout droit. Chacun son truc !',
    'Un Pompon qui court, c’est un Pompon pressé de goûter.',
    'Hou hou ! Tu réfléchis vite, dis donc !',
  ],
  win: ['Bravo ! Tu as très bien réfléchi !', 'Génial ! Les Pompons te disent merci !', 'Super ! Quel bon guide tu fais !'],
  fail: ['Presque ! Regarde bien où ils se perdent, et réessaie.', 'Pas grave ! Chaque essai t’apprend quelque chose.', 'Courage ! Le bouton 💡 peut t’aider.'],
};

/* Ce qu'on écrit sous les étoiles d'un niveau gagné */
export const STAR_TEXT = ['', 'Bien joué !', 'Très bien !', 'Parfait !'];
