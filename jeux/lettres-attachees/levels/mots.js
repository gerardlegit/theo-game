// ============================================================================
// NIVEAU 3 — LES MOTS
//
// Le parchemin montre un mot entier dans une écriture ; le joueur le
// retrouve dans une autre. Les pièges sont des mots presque pareils : une
// lettre changée (pain, bain, main), deux lettres échangées, une lettre en
// plus… Trois pages : les petits mots, les mots plus longs, puis les mots
// jumeaux (b et d, m et n, ou et on…).
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

export default {
  id: 'mots',
  icon: '📝',
  name: 'Les mots',
  age: 'CP – CE1',
  short: 'Un mot entier',
  example: [['cap', 'LUNE'], ['cursive', 'lune']],
  scene: 'lac',
  goal: "Les <b>mots</b> du grimoire flottent sur le lac ! Lis le mot du parchemin, puis touche la bulle qui contient <b>le même mot</b>, dans l'autre écriture.",
  lines: {
    start: "Hou hou ! Lis bien le mot du parchemin, lettre par lettre. Puis trouve la bulle où il se cache !",
  },
  ending: {
    title: "Tous les mots sont rentrés !",
    sub: "Petits mots, grands mots, mots jumeaux : tu les lis dans toutes les écritures. Le grimoire brille de nouveau !",
    fact: "Le savais-tu ? Quand on lit bien, on ne regarde plus chaque lettre : les yeux reconnaissent le mot entier d'un seul coup d'œil !",
  },
  hints: {},
  chapters: [
    {
      title: 'Les petits mots',
      say: "Page 1 : les petits mots ! Trois ou quatre lettres seulement… mais attention aux pièges !",
      count: 6,
      choices: 3,
      pairs: [['cap', 'cursive'], ['cursive', 'cap']],
      streak: 3,
      tips: [
        "Lis le mot dans ta tête, puis cherche-le : la première lettre, la deuxième, la troisième…",
        "Tu peux appuyer sur 🔊 pour entendre le mot.",
      ],
      facts: [
        { pic: [['cursive', 'à']], title: 'Le plus petit mot', text: "Les plus petits mots du français n'ont qu'une seule lettre : « à », « a », « y »…" },
        { pic: [['cursive', 'nez']], title: 'Les yeux sauteurs', text: "Quand tu lis, tes yeux ne glissent pas : ils font de tout petits bonds, de mot en mot !" },
      ],
      items: [
        { t: 'lit', traps: ['lot', 'nid', 'lis'] },
        { t: 'sac', traps: ['sec', 'cas', 'lac'] },
        { t: 'bol', traps: ['bal', 'lob', 'vol'] },
        { t: 'riz', traps: ['ris', 'rire', 'roi'] },
        { t: 'nez', traps: ['net', 'nef', 'zen'] },
        { t: 'lune', traps: ['dune', 'luge', 'une'] },
        { t: 'ami', traps: ['mai', 'mie', 'amie'] },
        { t: 'vélo', traps: ['vole', 'véto', 'pelé'] },
        { t: 'roi', traps: ['rot', 'roue', 'loi'] },
        { t: 'moto', traps: ['mot', 'mono', 'photo'] },
        { t: 'pain', traps: ['bain', 'main', 'pin'] },
        { t: 'mur', traps: ['mûre', 'dur', 'rum'] },
      ],
    },
    {
      title: 'Les mots plus longs',
      say: "Page 2 : des mots plus longs ! Coupe-les en morceaux : car-ta-ble, ça se lit tout seul.",
      count: 7,
      choices: 4,
      pairs: [['cap', 'cursive'], ['cursive', 'cap'], ['script', 'cursive'], ['cursive', 'script']],
      streak: 4,
      star: true,
      tips: [
        "Un mot long, ça se lit en syllabes : ma-i-son, la-pin, to-ma-te.",
        "Une étoile filante passe parfois dans le ciel : touche-la pour gagner des étoiles !",
      ],
      facts: [
        { pic: [['cursive', 'ca-dre']], title: 'Les syllabes', text: "Une syllabe, c'est un morceau de mot qu'on dit d'un seul coup de voix. « Lapin » en a deux : la-pin. Tape-les dans tes mains !" },
        { pic: [['cap', '25']], title: 'Le plus long', text: "Un des plus longs mots du français a 25 lettres : « anticonstitutionnellement ». Essaie de le dire !" },
      ],
      items: [
        { t: 'lapin', traps: ['sapin', 'lampe', 'papi'] },
        { t: 'tomate', traps: ['tortue', 'tomber', 'patate'] },
        { t: 'cheval', traps: ['cheveu', 'chenal', 'chemin'] },
        { t: 'gâteau', traps: ['bateau', 'râteau', 'château'] },
        { t: 'maison', traps: ['moisson', 'raison', 'maman'] },
        { t: 'jardin', traps: ['jasmin', 'jeudi', 'radin'] },
        { t: 'pomme', traps: ['gomme', 'homme', 'pompe'] },
        { t: 'école', traps: ['étoile', 'colle', 'éclair'] },
        { t: 'souris', traps: ['sourire', 'soucis', 'sortie'] },
        { t: 'cartable', traps: ['cartes', 'câble', 'table'] },
        { t: 'crayon', traps: ['rayon', 'canyon', 'cravate'] },
        { t: 'tortue', traps: ['tourte', 'tordue', 'portée'] },
      ],
    },
    {
      title: 'Les mots jumeaux',
      say: "Page 3 : les mots jumeaux ! Bouche, douche, mouche… Une seule lettre change. Et Gribouille souffle de toutes ses forces !",
      count: 8,
      choices: 4,
      pairs: [['cap', 'cursive'], ['cursive', 'cap'], ['script', 'cursive'], ['cursive', 'script']],
      wind: 1,
      streak: 4,
      star: true,
      tips: [
        "Les mots jumeaux n'ont qu'une lettre de différence : regarde-les une par une.",
        "b ou d ? Pense au petit lit : la main gauche fait le b, la droite fait le d.",
      ],
      facts: [
        { pic: '1f444', title: 'Bouche, douche, mouche', text: "Bouche, douche, mouche : une seule lettre change… et le mot ne veut plus du tout dire la même chose !" },
        { pic: [['cursive', 'b d']], title: 'Le petit lit', text: "Ferme tes poings, pouces en l'air : ta main gauche fait un b, ta main droite fait un d. Ensemble, ça fait un petit lit !" },
      ],
      items: [
        { t: 'bain', traps: ['daim', 'pain', 'bien'] },
        { t: 'poule', traps: ['boule', 'moule', 'poupe'] },
        { t: 'bulle', traps: ['balle', 'bille', 'dune'] },
        { t: 'mouche', traps: ['bouche', 'douche', 'moche'] },
        { t: 'nuage', traps: ['mage', 'neige', 'nage'] },
        { t: 'mer', traps: ['nez', 'mur', 'mère'] },
        { t: 'banane', traps: ['cabane', 'panne', 'bandana'] },
        { t: 'loupe', traps: ['poule', 'coupe', 'soupe'] },
        { t: 'tapis', traps: ['papi', 'tapir', 'lapin'] },
        { t: 'route', traps: ['roule', 'toute', 'rouge'] },
        { t: 'mouton', traps: ['bouton', 'mouche', 'monter'] },
        { t: 'dent', traps: ['dans', 'vent', 'pont'] },
      ],
    },
  ],
};
