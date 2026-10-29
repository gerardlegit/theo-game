// ============================================================================
// NIVEAU 4 — DEUX MOTS
//
// Le parchemin montre un petit groupe de deux mots : « un chat », « ciel
// bleu », « il mange »… Le joueur le retrouve dans une autre écriture. Les
// pièges changent l'un des deux mots (le petit mot, ou une lettre du grand).
// Trois pages : le, la, un, une ; le nom et sa couleur ; les petites phrases.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

export default {
  id: 'deux-mots',
  icon: '🎩',
  name: 'Deux mots',
  age: 'CE1',
  short: 'Deux mots ensemble',
  example: [['cap', 'UN CHAT'], ['cursive', 'un chat']],
  scene: 'chateau',
  goal: "Gribouille a emporté les <b>petites phrases</b> du grimoire jusqu'au château des nuages ! Lis les <b>deux mots</b>, puis touche la bulle où ils sont écrits pareil.",
  lines: {
    start: "Hou hou ! Maintenant, il y a deux mots à lire. Vérifie bien les deux avant de toucher la bulle !",
  },
  ending: {
    title: "Le grimoire est réparé !",
    sub: "Les lettres, les images, les mots et même les petites phrases : tout est rentré. Tu es un vrai magicien de la lecture !",
    fact: "Le savais-tu ? Avec deux mots, on peut déjà faire une phrase : « Il pleut. » « Je lis. » Et toi, tu sais les lire dans toutes les écritures !",
  },
  hints: {},
  chapters: [
    {
      title: 'Le, la, un, une',
      say: "Page 1 : un petit mot, puis un nom ! « un chat », « la lune »… Regarde bien les deux mots.",
      count: 6,
      choices: 3,
      pairs: [['cap', 'cursive'], ['cursive', 'cap']],
      streak: 3,
      tips: [
        "Le premier mot est tout petit : le, la, un ou une. Ne l'oublie pas !",
        "Tu peux appuyer sur 🔊 pour entendre les deux mots.",
      ],
      facts: [
        { pic: [['cursive', 'le la']], title: 'Les déterminants', text: "Les petits mots « le », « la », « un », « une » s'appellent des déterminants. Ils se placent devant le nom." },
        { pic: [['script', 'un · chat']], title: "L'espace", text: "Entre deux mots, on laisse un espace. Sans lui, on ne saurait plus où finit un mot et où commence l'autre !" },
      ],
      items: [
        { t: 'un chat', traps: ['le chat', 'un char', 'un rat'] },
        { t: 'la lune', traps: ['la dune', 'une lune', 'la plume'] },
        { t: 'le loup', traps: ['la loupe', 'le lion', 'le pou'] },
        { t: 'une pomme', traps: ['une gomme', 'la pomme', 'un homme'] },
        { t: 'un vélo', traps: ['un véto', 'le vélo', 'une vache'] },
        { t: 'la fée', traps: ['la fête', 'une fée', 'la clé'] },
        { t: 'le roi', traps: ['la loi', 'le rat', 'un roi'] },
        { t: 'un bateau', traps: ['un gâteau', 'le bateau', 'un râteau'] },
        { t: 'la souris', traps: ['le sourire', 'la sortie', 'une souris'] },
      ],
    },
    {
      title: 'Le nom et sa couleur',
      say: "Page 2 : un nom et sa couleur ! « chat noir », « ciel bleu »… Les pièges changent un des deux mots.",
      count: 7,
      choices: 4,
      pairs: [['cap', 'cursive'], ['cursive', 'cap'], ['script', 'cursive'], ['cursive', 'script']],
      streak: 4,
      star: true,
      tips: [
        "Vérifie le premier mot, puis le deuxième. Les deux doivent être pareils !",
        "Une étoile filante passe parfois dans le ciel : touche-la pour gagner des étoiles !",
      ],
      facts: [
        { pic: '1f408_200d_2b1b', title: 'La couleur après', text: "En français, la couleur se met souvent après le nom : on dit « un chat noir », pas « un noir chat »." },
        { pic: [['cursive', 'bleue']], title: 'Le e du féminin', text: "Quand le nom est féminin, la couleur prend souvent un e : un ciel bleu, une balle bleue." },
      ],
      items: [
        { t: 'chat noir', traps: ['chat blanc', 'char noir', 'chien noir'] },
        { t: 'robe rose', traps: ['robe rouge', 'lobe rose', 'rame rose'] },
        { t: 'ciel bleu', traps: ['ciel blanc', 'miel bleu', 'ciel bas'] },
        { t: 'pomme verte', traps: ['pomme rouge', 'gomme verte', 'pomme vide'] },
        { t: 'lion jaune', traps: ['lion jeune', 'lien jaune', 'loup jaune'] },
        { t: 'souris grise', traps: ['souris grasse', 'sourire gris', 'souris rose'] },
        { t: 'fleur rouge', traps: ['fleur rose', 'fleuve rouge', 'feuille rouge'] },
        { t: 'balle bleue', traps: ['bulle bleue', 'balle blanche', 'salle bleue'] },
        { t: 'tortue verte', traps: ['tarte verte', 'tortue lente', 'porte verte'] },
      ],
    },
    {
      title: 'Les petites phrases',
      say: "Page 3 : les petites phrases ! « il mange », « elle lit »… Qui fait quoi ? Et Gribouille souffle encore !",
      count: 8,
      choices: 4,
      pairs: [['cap', 'cursive'], ['cursive', 'cap'], ['script', 'cursive'], ['cursive', 'script']],
      wind: 1.1,
      streak: 5,
      star: true,
      tips: [
        "Il ou elle ? Je ou tu ? Le petit mot du début compte aussi !",
        "Il pleut, il pleure… Une syllabe de plus et ce n'est plus pareil. Lis jusqu'au bout !",
      ],
      facts: [
        { pic: '1f37d', title: 'Qui fait quoi ?', text: "Dans « il mange », « il » dit qui fait l'action et « mange » dit ce qu'il fait. Deux mots, et c'est déjà une phrase !" },
        { pic: '1f327', title: 'Il pleut, il pleure', text: "« Il pleut » et « il pleure » : une petite syllabe de plus, et le ciel devient… un enfant triste !" },
      ],
      items: [
        { t: 'il mange', traps: ['il nage', 'elle mange', 'il range'] },
        { t: 'elle lit', traps: ['elle rit', 'il lit', 'elle dit'] },
        { t: 'je joue', traps: ['je roule', 'tu joues', 'je jette'] },
        { t: 'tu cours', traps: ['tu cuis', 'il court', 'tu coupes'] },
        { t: 'on danse', traps: ['on pense', 'on dîne', 'on chante'] },
        { t: 'il dort', traps: ['il mord', 'il sort', 'elle dort'] },
        { t: 'elle saute', traps: ['elle sourit', 'elle sauve', 'il saute'] },
        { t: 'nous chantons', traps: ['vous chantez', 'nous chassons', 'nous sautons'] },
        { t: 'il pleut', traps: ['il pleure', 'il peut', 'il plaît'] },
        { t: 'tu bois', traps: ['tu dois', 'tu vois', 'tu bouges'] },
      ],
    },
  ],
};
