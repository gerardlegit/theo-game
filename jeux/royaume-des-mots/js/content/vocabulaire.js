// ============================================================================
// LA FORÊT DE BROCÉLIANDE — vocabulaire.
// Synonymes, contraires, familles, préfixes et suffixes, sens figuré,
// expressions, champs lexicaux, dictionnaire et mots du Moyen Âge.
// ============================================================================

import { pick, pickN, shuffle, esc, mcqChoices } from '../util.js';

const SYN = [
  ['courageux', 'brave'], ['rapide', 'vif'], ['effrayé', 'apeuré'], ['demeure', 'maison'], ['immense', 'gigantesque'],
  ['joyeux', 'gai'], ['combattre', 'lutter'], ['regarder', 'observer'], ['commencer', 'débuter'], ['finir', 'terminer'],
  ['cheval', 'destrier'], ['festin', 'banquet'], ['rusé', 'malin'], ['calme', 'paisible'], ['triste', 'malheureux'],
  ['crier', 'hurler'], ['briller', 'étinceler'], ['effrayant', 'terrifiant'], ['habile', 'adroit'], ['trésor', 'fortune'],
  ['sombre', 'obscur'], ['bâtir', 'construire'], ['s’enfuir', 'se sauver'], ['un ennemi', 'un adversaire'],
];

const ANT = [
  ['grand', 'petit'], ['courageux', 'peureux'], ['lourd', 'léger'], ['entrer', 'sortir'], ['ancien', 'moderne'],
  ['gagner', 'perdre'], ['ami', 'ennemi'], ['monter', 'descendre'], ['allumer', 'éteindre'], ['riche', 'pauvre'],
  ['joyeux', 'triste'], ['rapide', 'lent'], ['le jour', 'la nuit'], ['obscur', 'lumineux'], ['se souvenir', 'oublier'],
  ['attaquer', 'défendre'], ['généreux', 'avare'], ['construire', 'détruire'], ['fort', 'faible'], ['accepter', 'refuser'],
  ['plein', 'vide'], ['bruyant', 'silencieux'], ['ouvrir', 'fermer'], ['la victoire', 'la défaite'],
];

export function genMatch({ type, skill, n = 4 }) {
  const bank = type === 'syn' ? SYN : ANT;
  const pairs = [];
  const used = new Set();
  shuffle(bank).forEach(([a, b]) => {
    if (pairs.length >= n || used.has(a) || used.has(b)) return;
    used.add(a); used.add(b);
    pairs.push([a, b]);
  });
  const word = type === 'syn' ? 'synonyme' : 'contraire';
  return {
    kind: 'match',
    skill,
    prompt: `Relie chaque mot à son <b>${word}</b>.`,
    pairs,
    explain: (type === 'syn'
      ? 'Des <b>synonymes</b> sont des mots qui ont presque le même sens.'
      : 'Des <b>contraires</b> (ou antonymes) sont des mots de sens opposé.') + '<br>' + pairs.map(([a, b]) => `${esc(a)} ↔ ${esc(b)}`).join(' · '),
  };
}

export function genSynMCQ({ type, skill }) {
  const bank = type === 'syn' ? SYN : ANT;
  const [a, b] = pick(bank);
  const others = pickN(bank.filter(([x, y]) => x !== a && y !== b), 3).map(([, y]) => y);
  // Pour les contraires, on piège avec un synonyme quand il existe.
  const syn = type === 'ant' ? SYN.find(([x]) => x === a) : null;
  const { choices, answer } = mcqChoices(b, syn ? [syn[1], ...others] : others, 4);
  return {
    kind: 'mcq', skill,
    prompt: type === 'syn' ? `Quel est le <b>synonyme</b> de ce mot ?` : `Quel est le <b>contraire</b> de ce mot ?`,
    sentence: `<b class="hl">${esc(a)}</b>`,
    choices, answer,
    explain: `${esc(a)} ↔ <b>${esc(b)}</b>. ${type === 'syn' ? 'Ils ont presque le même sens.' : 'Ils ont des sens opposés.'}`,
    speak: a,
  };
}

// [mot de base, membres de la famille, intrus, astuce]
const FAMILIES = [
  ['terre', ['terrain', 'enterrer', 'souterrain', 'terrestre'], 'terrible'],
  ['chant', ['chanter', 'chanteur', 'chanson', 'chantonner'], 'champ'],
  ['roi', ['royaume', 'royal', 'royauté'], 'roche'],
  ['cheval', ['chevalier', 'chevaucher', 'chevalerie', 'chevalin'], 'cheveu'],
  ['arme', ['armure', 'armée', 'désarmer', 'armurier'], 'larme'],
  ['fleur', ['fleurir', 'fleuriste', 'fleuri', 'refleurir'], 'flèche'],
  ['jour', ['journée', 'journal', 'aujourd’hui', 'séjour'], 'jouer'],
  ['garder', ['garde', 'gardien', 'sauvegarder', 'garderie'], 'gare'],
  ['dent', ['dentiste', 'dentier', 'édenté', 'dentifrice'], 'danse'],
  ['mer', ['marin', 'maritime', 'marée', 'amerrir'], 'mercredi'],
  ['lumière', ['lumineux', 'allumer', 'illuminer', 'luminosité'], 'lune'],
  ['peur', ['peureux', 'apeuré', 'peureusement'], 'peuple'],
];

export function genFamily({ skill }) {
  const [base, fam, intrus] = pick(FAMILIES);
  const shown = pickN(fam, 3);
  const choices = shuffle([...shown, intrus]);
  return {
    kind: 'mcq', skill,
    prompt: `Quel mot n’est <b>pas</b> de la famille de « ${esc(base)} » ?`,
    sentence: '',
    choices,
    answer: choices.indexOf(intrus),
    explain: `Les mots d’une même famille partagent un <b>radical</b> et un lien de sens. « ${esc(intrus)} » ressemble à « ${esc(base)} », mais son sens n’a aucun rapport : c’est l’intrus !`,
    speak: base,
  };
}

// [question, bonne réponse, pièges, explication]
const AFFIX = [
  ['Quel est le contraire de « possible » ?', 'impossible', ['dépossible', 'repossible'], 'Le préfixe <b>im-</b> (ou in-, il-, ir-) donne le contraire. Devant p, b, m, on écrit « im ».'],
  ['Quel est le contraire de « lisible » ?', 'illisible', ['inlisible', 'délisible'], 'Devant un l, le préfixe in- devient <b>il-</b> : illisible.'],
  ['Quel est le contraire de « patient » ?', 'impatient', ['dépatient', 'repatient'], 'Le préfixe <b>im-</b> donne le contraire : impatient.'],
  ['Quel est le contraire de « couvrir » ?', 'découvrir', ['recouvrir', 'incouvrir'], 'Le préfixe <b>dé-</b> donne souvent le contraire : couvrir → découvrir.'],
  ['Quel est le contraire de « réel » ?', 'irréel', ['inréel', 'déréel'], 'Devant un r, le préfixe in- devient <b>ir-</b> : irréel.'],
  ['Quel est le contraire de « honnête » ?', 'malhonnête', ['inhonnête', 'déshonnête'], 'Le préfixe <b>mal-</b> peut aussi donner le contraire : malhonnête.'],
  ['Quel est le contraire de « obéissant » ?', 'désobéissant', ['inobéissant', 'réobéissant'], 'Devant une voyelle, dé- devient <b>dés-</b> : désobéissant.'],
  ['Dans « relire », que veut dire le préfixe « re- » ?', 'de nouveau', ['le contraire', 'avant'], 'Le préfixe <b>re-</b> (ou ré-) veut dire « de nouveau » : relire = lire encore une fois.'],
  ['Dans « préhistoire », que veut dire « pré- » ?', 'avant', ['après', 'de nouveau'], 'Le préfixe <b>pré-</b> veut dire « avant » : la préhistoire est avant l’histoire.'],
  ['Dans « sous-marin », que veut dire « sous- » ?', 'en dessous', ['au-dessus', 'le contraire'], 'Le préfixe <b>sous-</b> veut dire « en dessous ».'],
  ['Comment appelle-t-on celui qui forge ?', 'le forgeron', ['le forgeur', 'le forgier'], 'Le suffixe <b>-eron</b> indique ici un métier : forgeron (comme bûcheron).'],
  ['Comment appelle-t-on une petite fille ?', 'une fillette', ['une fillerie', 'une fillage'], 'Le suffixe <b>-ette</b> veut dire « petit » : fillette, maisonnette, tartelette.'],
  ['Que veut dire « lavable » ?', 'qu’on peut laver', ['qui lave tout', 'qu’on a lavé'], 'Le suffixe <b>-able</b> veut dire « qu’on peut » : lavable, buvable, mangeable.'],
  ['Quel mot désigne celui qui garde ?', 'le gardien', ['le gardage', 'la garderie'], 'Le suffixe <b>-ien</b> désigne ici une personne : gardien, magicien, musicien.'],
  ['Quel adverbe vient de l’adjectif « courageux » ?', 'courageusement', ['courageusité', 'courageusage'], 'Le suffixe <b>-ment</b> sert à former des adverbes : courageuse → courageusement.'],
  ['Comment appelle-t-on un petit château ?', 'un châtelet', ['un châtelage', 'un châtelier'], 'Le suffixe <b>-et</b> veut dire « petit » : châtelet, jardinet, livret.'],
];

const FIGURE = [
  ['Le chevalier a un <b>cœur de pierre</b>.', 1, 'Il n’a pas vraiment un cœur en pierre : cela veut dire qu’il est insensible.'],
  ['Le maçon taille une <b>pierre</b> pour le mur.', 0, 'Il s’agit d’une vraie pierre : c’est le sens propre.'],
  ['La princesse <b>boit les paroles</b> du conteur.', 1, 'On ne boit pas des paroles ! Cela veut dire qu’elle écoute avec passion.'],
  ['Le page <b>boit</b> de l’eau au puits.', 0, 'Il boit vraiment de l’eau : c’est le sens propre.'],
  ['Le roi est dans une <b>colère noire</b>.', 1, 'Une colère n’a pas de couleur : « noire » veut dire « très forte ».'],
  ['Le chat <b>noir</b> dort sur le coussin.', 0, 'Le chat est vraiment noir : c’est le sens propre.'],
  ['Une <b>pluie de flèches</b> tombe sur le château.', 1, 'Ce n’est pas de la pluie : il y a énormément de flèches, comme des gouttes.'],
  ['Le chevalier a <b>une faim de loup</b>.', 1, 'Il n’est pas un loup : il a très, très faim.'],
  ['Le loup a <b>faim</b> en hiver.', 0, 'Le loup a vraiment faim : c’est le sens propre.'],
  ['Cette nouvelle m’a <b>glacé le sang</b>.', 1, 'Le sang n’a pas gelé : cela veut dire qu’on a eu très peur.'],
];

export function genFigure({ skill }) {
  const [txt, k, why] = pick(FIGURE);
  return {
    kind: 'mcq', skill,
    prompt: 'Les mots en gras sont-ils au <b>sens propre</b> ou au <b>sens figuré</b> ?',
    sentence: txt,
    choices: ['sens propre', 'sens figuré'],
    answer: k,
    explain: `Le <b>sens propre</b> est le sens premier, réel. Le <b>sens figuré</b> est une image. ${why}`,
    speak: txt.replace(/<\/?b>/g, ''),
  };
}

const EXPR = [
  ['avoir la tête dans les nuages', 'être distrait, rêveur', ['être très grand', 'avoir mal à la tête']],
  ['mettre la main à la pâte', 'participer au travail', ['faire un gâteau', 'se salir les mains']],
  ['prendre ses jambes à son cou', 's’enfuir en courant', ['faire de la gymnastique', 'tomber par terre']],
  ['avoir un chat dans la gorge', 'avoir la voix enrouée', ['avoir avalé un chat', 'avoir très faim']],
  ['tomber des nues', 'être très surpris', ['tomber d’un nuage', 'avoir le vertige']],
  ['avoir du pain sur la planche', 'avoir beaucoup de travail', ['être boulanger', 'avoir faim']],
  ['coûter les yeux de la tête', 'coûter très cher', ['faire mal aux yeux', 'être très beau']],
  ['être à cheval sur le règlement', 'être très strict', ['savoir monter à cheval', 'ne pas aimer les règles']],
  ['monter sur ses grands chevaux', 'se mettre en colère', ['partir en voyage', 'devenir chevalier']],
  ['briser la glace', 'mettre fin à la gêne, commencer à parler', ['casser un miroir', 'avoir froid']],
  ['donner sa langue au chat', 'renoncer à deviner', ['parler aux animaux', 'se taire pour toujours']],
  ['être tiré à quatre épingles', 'être très bien habillé', ['être piqué par une épingle', 'être très fatigué']],
];

export function genExpression({ skill }) {
  const [e, meaning, traps] = pick(EXPR);
  const { choices, answer } = mcqChoices(meaning, traps, 3);
  return {
    kind: 'mcq', skill,
    prompt: 'Que veut dire cette <b>expression</b> ?',
    sentence: `« ${esc(e)} »`,
    choices, answer,
    explain: `« ${esc(e)} » veut dire <b>${esc(meaning)}</b>. Une expression ne se comprend pas mot à mot : c’est une image !`,
    speak: e,
  };
}

const POLY = [
  ['tour', 'un bâtiment', ['La tour du château est très haute.', 'C’est ton tour de jouer.', 'Le magicien fait un tour de magie.']],
  ['tour', 'un moment où c’est à quelqu’un de jouer', ['C’est ton tour de lancer les dés.', 'La tour du château est très haute.', 'Le jongleur fait un tour d’adresse.']],
  ['page', 'un jeune garçon au service d’un seigneur', ['Le page apporte le bouclier.', 'Tourne la page du grimoire.', 'Cette histoire fait dix pages.']],
  ['page', 'une feuille d’un livre', ['Tourne la page du grimoire.', 'Le page apporte le bouclier.', 'Le jeune page sert le roi.']],
  ['avocat', 'un fruit', ['L’avocat est bien mûr.', 'L’avocat défend l’accusé.', 'L’avocat parle au juge.']],
  ['glace', 'un miroir', ['La reine se regarde dans la glace.', 'Le lac est couvert de glace.', 'Je mange une glace à la fraise.']],
  ['souris', 'un petit animal', ['La souris grignote le fromage.', 'Je clique avec la souris.', 'Tu souris à la princesse.']],
  ['plume', 'un outil pour écrire', ['Le moine trempe sa plume dans l’encre.', 'Une plume tombe de l’aile du hibou.', 'Ce sac est léger comme une plume.']],
];

export function genPolysemy({ skill }) {
  const [word, meaning, sentences] = pick(POLY);
  const good = sentences[0];
  const choices = shuffle(sentences);
  return {
    kind: 'mcq', skill,
    prompt: `Dans quelle phrase le mot « ${esc(word)} » désigne-t-il <b>${esc(meaning)}</b> ?`,
    sentence: '',
    choices, answer: choices.indexOf(good),
    explain: `Un même mot peut avoir plusieurs sens. C’est la phrase qui aide à trouver le bon : « ${esc(good)} »`,
    speak: word,
  };
}

const FIELDS = [
  ['le château fort', ['donjon', 'créneau', 'pont-levis', 'douves', 'remparts', 'meurtrière'], ['ordinateur', 'plage', 'fusée']],
  ['la chevalerie', ['armure', 'heaume', 'lance', 'écu', 'adoubement', 'destrier'], ['tablier', 'trottinette', 'parapluie']],
  ['la peur', ['frisson', 'terreur', 'trembler', 'effroi', 'angoisse', 'épouvante'], ['rire', 'fête', 'sourire']],
  ['la fête', ['banquet', 'ménestrel', 'danse', 'festin', 'jongleur', 'musique'], ['siège', 'bataille', 'prison']],
  ['la mer', ['vague', 'navire', 'marin', 'écume', 'tempête', 'port'], ['sapin', 'désert', 'enclume']],
  ['la forêt', ['chêne', 'clairière', 'sentier', 'mousse', 'fougère', 'sous-bois'], ['vague', 'trône', 'enclume']],
];

export function genField({ skill }) {
  const [theme, members, intrus] = pick(FIELDS);
  const odd = pick(intrus);
  const choices = shuffle([...pickN(members, 3), odd]);
  return {
    kind: 'mcq', skill,
    prompt: `Quel mot n’appartient <b>pas</b> au champ lexical de <b>${esc(theme)}</b> ?`,
    sentence: '',
    choices, answer: choices.indexOf(odd),
    explain: `Un <b>champ lexical</b> regroupe des mots qui parlent du même thème. « ${esc(odd)} » n’a rien à voir avec ${esc(theme)} !`,
    speak: theme,
  };
}

const DICO = ['chevalier', 'château', 'chemin', 'chêne', 'cheval', 'chaudron', 'dragon', 'donjon', 'douves', 'dame', 'destrier',
  'parchemin', 'page', 'princesse', 'prince', 'pont', 'potion', 'bouclier', 'blason', 'banquet', 'bannière', 'baron',
  'tour', 'trésor', 'troll', 'troubadour', 'tournoi', 'tonneau', 'sorcière', 'seigneur', 'sentier', 'serpent', 'sceau',
  'manant', 'marché', 'moine', 'moulin', 'muraille', 'ménestrel', 'licorne', 'lance', 'lanterne', 'luth'];

const base = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function genDico({ skill, last = false }) {
  for (let i = 0; i < 30; i++) {
    const letter = pick(DICO)[0];
    const pool = DICO.filter((w) => w[0] === letter);
    if (pool.length < 4) continue;
    const words = pickN(pool, 4);
    const sorted = words.slice().sort((a, b) => base(a).localeCompare(base(b)));
    if (new Set(words.map(base)).size < 4) continue;
    const good = last ? sorted[3] : sorted[0];
    return {
      kind: 'mcq', skill,
      prompt: `Quel mot vient <b>${last ? 'en dernier' : 'en premier'}</b> dans le dictionnaire ?`,
      sentence: '',
      choices: shuffle(words),
      answer: -1,
      good,
      explain: `L’ordre alphabétique : ${esc(sorted.join(' → '))}. Quand la 1re lettre est la même, on compare la 2e, puis la 3e…`,
    };
  }
  return null;
}

export function genOrderAlpha({ skill }) {
  const letter = pick(['c', 'd', 'p', 'b', 't', 's', 'm', 'l']);
  const pool = DICO.filter((w) => w[0] === letter);
  let words = pickN(pool, 4);
  while (new Set(words.map(base)).size < words.length) words = pickN(pool, 4);
  const sorted = words.slice().sort((a, b) => base(a).localeCompare(base(b)));
  return {
    kind: 'order', skill,
    prompt: 'Range ces mots dans l’<b>ordre alphabétique</b> (comme dans le dictionnaire).',
    pieces: sorted,
    vertical: true,
    explain: `L’ordre est : ${esc(sorted.join(' → '))}. Si la 1re lettre est la même, on regarde la 2e, puis la 3e…`,
  };
}

const MEDIEVAL = [
  ['le donjon', 'la tour principale du château fort'],
  ['les douves', 'le fossé rempli d’eau autour du château'],
  ['le pont-levis', 'le pont qu’on peut lever pour fermer le château'],
  ['un écuyer', 'un jeune homme au service d’un chevalier'],
  ['l’adoubement', 'la cérémonie où l’on devient chevalier'],
  ['un ménestrel', 'un musicien qui chante et raconte des histoires'],
  ['un heaume', 'le casque du chevalier'],
  ['un destrier', 'un cheval de combat'],
  ['un blason', 'l’emblème peint sur le bouclier d’une famille'],
  ['les créneaux', 'les ouvertures en haut des murailles'],
  ['une joute', 'un combat à cheval avec des lances'],
  ['le scriptorium', 'la salle où les moines copient les livres'],
  ['un enlumineur', 'un artiste qui décore les manuscrits'],
  ['la herse', 'la grille qui ferme l’entrée du château'],
  ['un vitrail', 'une fenêtre faite de morceaux de verre colorés'],
  ['un seigneur', 'le maître d’un domaine et de ses terres'],
  ['un serf', 'un paysan attaché à la terre de son seigneur'],
  ['une meurtrière', 'une fente étroite dans le mur pour tirer à l’arc'],
  ['un troubadour', 'un poète qui compose et chante des chansons'],
  ['une échoppe', 'une petite boutique'],
];

export function genMedieval({ skill }) {
  const [w, def] = pick(MEDIEVAL);
  const traps = pickN(MEDIEVAL.filter(([x]) => x !== w), 3).map(([, d]) => d);
  const { choices, answer } = mcqChoices(def, traps, 4);
  return {
    kind: 'mcq', skill,
    prompt: 'Que veut dire ce <b>mot du Moyen Âge</b> ?',
    sentence: `<b class="hl">${esc(w)}</b>`,
    choices, answer,
    explain: `<b>${esc(w)}</b> : ${esc(def)}.`,
    speak: w,
  };
}

function affixQ(skill) {
  const [q, good, traps, why] = pick(AFFIX);
  const { choices, answer } = mcqChoices(good, traps, 3);
  return { kind: 'mcq', skill, prompt: esc(q), sentence: '', choices, answer, explain: why, speak: q };
}

// Les QCM « dictionnaire » sont construits avec un champ good : on calcule l'index ici.
function fix(q) {
  if (q && q.answer === -1 && q.good) q.answer = q.choices.indexOf(q.good);
  return q;
}

// --------------------------------------------------------------- étapes ---
const take = (n, fn) => Array.from({ length: n }, () => fix(fn())).filter(Boolean);

export const VOCAB_STAGES = [
  {
    title: 'Le Sentier des Jumeaux',
    gen: (skill) => [
      ...take(1, () => genMatch({ type: 'syn', skill })),
      ...take(3, () => genSynMCQ({ type: 'syn', skill })),
      ...take(1, () => genMatch({ type: 'ant', skill })),
      ...take(3, () => genSynMCQ({ type: 'ant', skill })),
    ],
  },
  {
    title: 'Les Racines du Vieux Chêne',
    gen: (skill) => shuffle([...take(5, () => genFamily({ skill })), ...take(3, () => genMedieval({ skill }))]),
  },
  {
    title: 'La Clairière des Préfixes',
    gen: (skill) => take(8, () => affixQ(skill)),
  },
  {
    title: 'La Source des Images',
    gen: (skill) => shuffle([...take(3, () => genFigure({ skill })), ...take(3, () => genExpression({ skill })), ...take(2, () => genPolysemy({ skill }))]),
  },
  {
    title: 'Le Cercle des Fées',
    gen: (skill) => shuffle([
      ...take(2, () => genField({ skill })), ...take(2, () => genDico({ skill, last: Math.random() < 0.5 })),
      ...take(1, () => genOrderAlpha({ skill })), ...take(3, () => genMedieval({ skill })),
    ]),
  },
];

export function vocabBoss(skill, n = 24) {
  const gens = [
    () => genSynMCQ({ type: pick(['syn', 'ant']), skill }),
    () => genFamily({ skill }),
    () => affixQ(skill),
    () => genFigure({ skill }),
    () => genExpression({ skill }),
    () => genPolysemy({ skill }),
    () => genField({ skill }),
    () => genMedieval({ skill }),
    () => genDico({ skill, last: Math.random() < 0.5 }),
    () => genMatch({ type: pick(['syn', 'ant']), skill }),
  ];
  return take(n, () => pick(gens)());
}
