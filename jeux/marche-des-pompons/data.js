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
  },
  nothing: 'Il n’y a rien à creuser devant lui. Attends qu’il touche le mur !',
  ladderNothing: 'Pour poser l’échelle, il faut être tout près d’un mur ou d’un bord !',
  ladderHigh: 'Trop haut ! Une échelle mesure 7 cubes au plus.',
  ladderBlocked: 'Quelque chose gêne : l’échelle ne peut pas se dresser ici.',
  ladder: ['Et hop, une échelle ! Tout le monde va la prendre, dans les deux sens.', 'L’échelle est posée !'],
  rumble: ['Le volcan gronde…', 'Ça tremble ! Vite, vite !'],
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
