// ============================================================================
// NIVEAU 2 — LES IMAGES
//
// Le parchemin montre une image (un émoji Noto) : le joueur touche la bulle
// qui contient son nom. Les pièges sont des mots qui se ressemblent (chat,
// char, chou…) : il faut lire tout le mot, pas seulement la première lettre.
// Trois pages : les animaux, la maison, la nature et le goûter.
// Pour créer un niveau : voir levels/index.js.
// ============================================================================

export default {
  id: 'images',
  icon: '🖼️',
  name: 'Les images',
  age: 'CP',
  short: 'Une image, un mot',
  example: [['img', '1f408'], ['cursive', 'chat']],
  scene: 'jardin',
  goal: "Les <b>images</b> du grimoire ont perdu leur nom ! Regarde l'image, puis touche la bulle qui contient <b>son nom</b>.",
  lines: {
    start: "Hou hou ! Cette fois, le parchemin montre une image. Trouve la bulle où son nom est écrit !",
  },
  ending: {
    title: "Chaque image a retrouvé son nom !",
    sub: "Les animaux, la maison, les fruits… tout est revenu dans le grimoire. Tu sais lire des mots entiers !",
    fact: "Le savais-tu ? Les tout premiers livres pour enfants, il y a très longtemps, avaient déjà des images à côté des mots, pour aider à lire.",
  },
  hints: {},
  chapters: [
    {
      title: 'Les animaux',
      say: "Page 1 : les animaux ! Regarde bien l'image, puis lis chaque bulle jusqu'au bout.",
      count: 6,
      choices: 3,
      pairs: [['img', 'cursive'], ['img', 'cap']],
      streak: 3,
      tips: [
        "Attention, les pièges commencent souvent par la même lettre ! Lis le mot jusqu'au bout.",
        "Tu ne sais pas ce que montre l'image ? Appuie sur 🔊, je te le dis à l'oreille.",
      ],
      facts: [
        { pic: '1f408', title: 'Les lettres muettes', text: "Dans « chat », on n'entend pas le t ! C'est une lettre muette. Il y en a aussi dans « loup » (le p) et dans « souris » (le s)." },
        { pic: '1f40c', title: 'Une seule lettre', text: "Une seule lettre peut tout changer : chat, char, chou… Ce sont des mots très différents !" },
      ],
      items: [
        { t: 'chat', img: '1f408', traps: ['char', 'chou', 'rat'] },
        { t: 'chien', img: '1f415', traps: ['chêne', 'bien', 'chine'] },
        { t: 'lion', img: '1f981', traps: ['lien', 'loin', 'lino'] },
        { t: 'loup', img: '1f43a', traps: ['loupe', 'poule', 'coup'] },
        { t: 'vache', img: '1f404', traps: ['tache', 'vague', 'hache'] },
        { t: 'poule', img: '1f414', traps: ['boule', 'moule', 'pull'] },
        { t: 'souris', img: '1f401', traps: ['sourire', 'sous', 'radis'] },
        { t: 'lapin', img: '1f407', traps: ['sapin', 'lampe', 'lait'] },
        { t: 'poisson', img: '1f41f', traps: ['poison', 'boisson', 'buisson'] },
        { t: 'cochon', img: '1f416', traps: ['cocher', 'coton', 'bouchon'] },
        { t: 'ours', img: '1f43b', traps: ['jours', 'tours', 'os'] },
        { t: 'canard', img: '1f986', traps: ['renard', 'canapé', 'car'] },
        { t: 'tortue', img: '1f422', traps: ['tortille', 'torche', 'tarte'] },
        { t: 'escargot', img: '1f40c', traps: ['escalier', 'cargo', 'escalope'] },
      ],
    },
    {
      title: 'À la maison',
      say: "Page 2 : les objets de la maison ! Et maintenant, certains mots sont aussi écrits en script.",
      count: 7,
      choices: 3,
      pairs: [['img', 'cursive'], ['img', 'cap'], ['img', 'script']],
      streak: 4,
      star: true,
      tips: [
        "Regarde la longueur du mot : un mot court, un mot long… ça aide à choisir !",
        "Une étoile filante passe parfois dans le ciel : touche-la pour gagner des étoiles !",
      ],
      facts: [
        { pic: '1f6b2', title: 'Vélocipède', text: "« Vélo », c'est le raccourci de « vélocipède », le nom des tout premiers vélos, il y a plus de 150 ans." },
        { pic: '1f511', title: "L'accent aigu", text: "Le petit trait sur le é de « clé » s'appelle un accent aigu. Il change le son : on dit « é »." },
      ],
      items: [
        { t: 'lit', img: '1f6cf', traps: ['lait', 'lot', 'nid'] },
        { t: 'clé', img: '1f511', traps: ['clou', 'blé', 'cri'] },
        { t: 'livre', img: '1f4d6', traps: ['lièvre', 'lire', 'libre'] },
        { t: 'chaise', img: '1fa91', traps: ['chaîne', 'fraise', 'caisse'] },
        { t: 'vélo', img: '1f6b2', traps: ['véto', 'solo', 'vole'] },
        { t: 'ballon', img: '1f388', traps: ['balai', 'bouton', 'salon'] },
        { t: 'tasse', img: '2615', traps: ['casse', 'masse', 'tisse'] },
        { t: 'cadeau', img: '1f381', traps: ['château', 'gâteau', 'cadre'] },
        { t: 'maison', img: '1f3e0', traps: ['raison', 'moisson', 'maman'] },
        { t: 'bougie', img: '1f56f', traps: ['bouge', 'bougeoir', 'boucle'] },
        { t: 'ciseaux', img: '2702', traps: ['oiseaux', 'cerceaux', 'ciseau'] },
        { t: 'téléphone', img: '1f4f1', traps: ['télévision', 'trombone', 'xylophone'] },
      ],
    },
    {
      title: 'Nature et goûter',
      say: "Page 3 : la nature et le goûter ! Quatre bulles maintenant, et Gribouille souffle dessus…",
      count: 8,
      choices: 4,
      pairs: [['img', 'cursive'], ['img', 'cap'], ['img', 'script']],
      wind: 0.6,
      streak: 4,
      star: true,
      tips: [
        "Gâteau, bateau, râteau… ils se terminent pareil ! Regarde bien le début du mot.",
        "Les bulles bougent : prends ton temps, elles ne s'envolent pas !",
      ],
      facts: [
        { pic: '1f382', title: 'Les mots en -eau', text: "Gâteau, bateau, râteau, château : ces mots finissent tous par « eau », qu'on lit « o »." },
        { pic: '2600', title: 'Les rimes', text: "« Soleil » et « sommeil » riment : ils finissent par le même son. Les poètes adorent les rimes !" },
        { pic: '2b50', title: 'Le petit chapeau', text: "L'accent circonflexe (^) de « gâteau », c'est comme un petit chapeau posé sur la lettre." },
      ],
      items: [
        { t: 'pomme', img: '1f34e', traps: ['pompe', 'homme', 'gomme'] },
        { t: 'lune', img: '1f319', traps: ['dune', 'luge', 'plume'] },
        { t: 'soleil', img: '2600', traps: ['sommeil', 'orteil', 'sel'] },
        { t: 'fleur', img: '1f33c', traps: ['flûte', 'fleuve', 'peur'] },
        { t: 'arbre', img: '1f333', traps: ['arbitre', 'ombre', 'barbe'] },
        { t: 'fraise', img: '1f353', traps: ['braise', 'frise', 'phrase'] },
        { t: 'banane', img: '1f34c', traps: ['cabane', 'banc', 'panne'] },
        { t: 'étoile', img: '2b50', traps: ['toile', 'école', 'étole'] },
        { t: 'gâteau', img: '1f382', traps: ['bateau', 'râteau', 'château'] },
        { t: 'carotte', img: '1f955', traps: ['culotte', 'calotte', 'carton'] },
        { t: 'nuage', img: '2601', traps: ['plage', 'page', 'nuit'] },
        { t: 'bateau', img: '26f5', traps: ['bâton', 'gâteau', 'râteau'] },
      ],
    },
  ],
};
