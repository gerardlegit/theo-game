// ============================================================================
// NIVEAU 1 — LES LETTRES
//
// Une lettre, trois habits : la MAJUSCULE, la script (comme dans les livres)
// et l'attachée (comme à l'école). Trois pages : les voyelles, les
// consonnes, puis les lettres jumelles qu'on confond si souvent (b, d, p, q,
// m, n, u…). Les pièges de chaque lettre sont des lettres qui lui
// ressemblent.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

export default {
  id: 'lettres',
  icon: '🔤',
  name: 'Les lettres',
  age: 'GS – CP',
  short: 'Une lettre, trois écritures',
  example: [['cap', 'A'], ['cursive', 'a']],
  scene: 'tour',
  goal: "Gribouille a soufflé les <b>lettres</b> du grimoire ! Touche la bulle qui contient <b>la même lettre</b>, dans l'autre écriture.",
  lines: {
    start: "Hou hou ! Regarde le parchemin : c'est la lettre à retrouver. Touche la bulle où elle se cache !",
  },
  ending: {
    title: "Toutes les lettres sont rentrées !",
    sub: "Les 26 lettres de l'alphabet ont retrouvé leur place dans le grimoire. Tu les reconnais dans les trois écritures !",
    fact: "Le savais-tu ? Avec seulement 26 lettres, on peut écrire tous les mots du français… et même des millions d'histoires !",
  },
  // Ce que dit Plume quand on confond deux lettres jumelles
  hints: {
    'b|d': "Le b et le d sont jumeaux ! Le b commence par la grande barre, puis le ventre. Le d commence par le ventre.",
    'b|p': "Le b monte vers le ciel, le p descend sous la ligne, comme une racine.",
    'd|p': "Le d monte vers le ciel, le p descend sous la ligne.",
    'd|q': "Le d monte vers le ciel, le q descend sous la ligne.",
    'p|q': "Le p et le q sont jumeaux à l'envers : le ventre du p est à droite, celui du q à gauche.",
    'b|q': "Le b monte, le q descend : regarde bien la grande barre !",
    'm|n': "Compte les bosses : le m en a deux, le n une seule !",
    'n|u': "Le n est un petit pont, le u est une petite tasse !",
    'm|u': "Le m a deux bosses en haut, le u est une tasse ouverte vers le ciel.",
    'u|v': "Le u est tout rond en bas, le v est pointu !",
    'v|w': "Le w, c'est comme deux v collés !",
    'i|l': "Le i est tout petit et il a un point sur la tête. Le l est grand !",
    'i|j': "Le i et le j ont tous les deux un point, mais le j descend sous la ligne.",
    'f|t': "Le f et le t ont une petite barre. Le f est plus grand et descend en attaché !",
    'l|t': "Le t a une petite barre qui le traverse, le l n'en a pas.",
    'a|o': "Le a a une petite queue sur le côté, le o est tout rond.",
    'a|d': "Le a est petit, le d a une grande barre qui monte.",
    'c|e': "Le e a une petite boucle, le c est ouvert.",
    'e|o': "Le o est fermé, le e a une petite boucle.",
    'g|q': "En attaché, le g fait une boucle en bas, le q descend tout droit.",
    'h|k': "Le k a une petite boucle au milieu, le h est un pont.",
    'h|n': "Le h est un n avec une grande barre qui monte !",
    's|z': "Le s est tout rond comme un serpent, le z fait des zigzags.",
  },
  chapters: [
    {
      title: 'Les voyelles',
      say: "Page 1 : les voyelles ! Ce sont les lettres qui chantent : a, e, i, o, u… et y.",
      count: 6,
      choices: 3,
      pairs: [['cap', 'cursive'], ['cursive', 'cap']],
      streak: 3,
      tips: [
        "Prends ton temps : regarde bien la forme de la lettre avant de toucher.",
        "Tu peux appuyer sur 🔊 pour entendre la lettre.",
      ],
      facts: [
        { pic: [['cursive', 'a e i']], title: 'Les voyelles', text: "Il y a 6 voyelles en français : a, e, i, o, u et y. Toutes les autres lettres sont des consonnes." },
        { pic: 'E', title: 'La championne', text: "Le E est la lettre la plus utilisée en français : on la trouve dans presque tous les mots !" },
      ],
      items: [
        { t: 'a', traps: ['o', 'e', 'd', 'u'] },
        { t: 'e', traps: ['a', 'c', 'o', 'l'] },
        { t: 'i', traps: ['l', 'j', 't', 'e'] },
        { t: 'o', traps: ['a', 'e', 'c', 'u'] },
        { t: 'u', traps: ['n', 'v', 'w', 'a'] },
        { t: 'y', traps: ['v', 'j', 'g', 'u'], say: 'i grec' },
      ],
    },
    {
      title: 'Les consonnes',
      say: "Page 2 : les consonnes ! Et voici la troisième écriture : la script, celle des livres.",
      count: 8,
      choices: 3,
      pairs: [['cap', 'cursive'], ['cursive', 'cap'], ['script', 'cursive'], ['cursive', 'script']],
      streak: 4,
      star: true,
      tips: [
        "La script, ce sont les petites lettres des livres. L'attachée, c'est celle qu'on écrit à l'école.",
        "Une étoile filante passe parfois dans le ciel : touche-la pour gagner des étoiles !",
      ],
      facts: [
        { pic: [['cap', 'A'], ['script', 'a'], ['cursive', 'a']], title: 'Trois habits', text: "Chaque lettre a trois habits : la MAJUSCULE, la script (comme dans les livres) et l'attachée (comme à l'école)." },
        { pic: 'W', title: 'La plus rare', text: "Le W est l'une des lettres les plus rares en français. On la trouve surtout dans des mots venus d'ailleurs, comme wagon ou kiwi." },
        { pic: 'αβ', title: 'Alpha, bêta', text: "Le mot « alphabet » vient des deux premières lettres de l'alphabet grec : alpha et bêta." },
      ],
      items: [
        { t: 'c', traps: ['e', 'o', 'a'] },
        { t: 'f', traps: ['t', 'l', 'j'] },
        { t: 'g', traps: ['q', 'j', 'y'], say: 'gé' },
        { t: 'h', traps: ['k', 'n', 'b'], say: 'hache' },
        { t: 'j', traps: ['i', 'g', 'y'], say: 'ji' },
        { t: 'k', traps: ['h', 'x', 'l'], say: 'ka' },
        { t: 'l', traps: ['i', 't', 'f'], say: 'elle' },
        { t: 'r', traps: ['n', 'v', 's'], say: 'ère' },
        { t: 's', traps: ['z', 'c', 'x'], say: 'esse' },
        { t: 't', traps: ['f', 'l', 'i'], say: 'té' },
        { t: 'v', traps: ['u', 'w', 'y'], say: 'vé' },
        { t: 'w', traps: ['v', 'm', 'u'], say: 'double vé' },
        { t: 'x', traps: ['k', 's', 'z'], say: 'ixe' },
        { t: 'z', traps: ['s', 'x', 'n'], say: 'zède' },
      ],
    },
    {
      title: 'Les lettres jumelles',
      say: "Page 3 : attention, les lettres jumelles ! b, d, p, q, m, n… Elles se ressemblent beaucoup. Et Gribouille va souffler sur les bulles !",
      count: 8,
      choices: 4,
      pairs: [['cap', 'cursive'], ['script', 'cursive'], ['cursive', 'script'], ['script', 'cap']],
      wind: 0.7,
      streak: 4,
      star: true,
      tips: [
        "Les bulles bougent : suis bien celle que tu veux avec tes yeux avant de toucher.",
        "Pour le b et le d, regarde par où la lettre commence : la barre ou le ventre ?",
      ],
      facts: [
        { pic: [['cursive', 'b d']], title: 'Le petit lit', text: "Ferme tes poings, pouces en l'air : ta main gauche fait un b, ta main droite fait un d. Ensemble, ça fait un petit lit !" },
        { pic: [['script', 'p q']], title: 'Les racines', text: "Le p et le q descendent sous la ligne, comme des racines. Le b et le d montent vers le ciel, comme des arbres." },
        { pic: [['cursive', 'm n']], title: 'Les montagnes', text: "Le m a deux bosses, comme deux montagnes. Le n n'en a qu'une." },
      ],
      items: [
        { t: 'b', traps: ['d', 'p', 'q', 'h'], say: 'bé' },
        { t: 'd', traps: ['b', 'p', 'q', 'a'], say: 'dé' },
        { t: 'p', traps: ['q', 'b', 'd', 'g'], say: 'pé' },
        { t: 'q', traps: ['p', 'g', 'd', 'b'], say: 'ku' },
        { t: 'm', traps: ['n', 'u', 'w', 'h'], say: 'aime' },
        { t: 'n', traps: ['m', 'u', 'h', 'r'], say: 'haine' },
        { t: 'u', traps: ['n', 'v', 'm', 'w'] },
        { t: 'h', traps: ['n', 'b', 'k', 'l'], say: 'hache' },
        { t: 'f', traps: ['t', 'l', 'j', 'b'], say: 'effe' },
        { t: 't', traps: ['f', 'l', 'i', 'j'], say: 'té' },
      ],
    },
  ],
};
