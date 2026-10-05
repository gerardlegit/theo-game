// ============================================================================
// LE MARAIS DES PIÈGES — orthographe : homophones et accords.
//
// Les homophones ont une astuce de remplacement (a → avait, et → et puis…).
// Les accords ont des choix propres à chaque phrase.
// ============================================================================

import { pick, esc, mcqChoices, blank, cap, shuffle } from '../util.js';

// ---------------------------------------------------- homophones ---
// items : [phrase avec ___, bonne réponse]
const HOMO = {
  a: {
    choices: ['a', 'à'],
    tip: {
      a: 'On peut le remplacer par « avait » : c’est le verbe avoir → <b>a</b> sans accent.',
      à: 'On ne peut pas le remplacer par « avait » : c’est un petit mot invariable → <b>à</b> avec un accent.',
    },
    items: [
      ['Le chevalier ___ une épée magique.', 'a'], ['Il part ___ la chasse au sanglier.', 'à'],
      ['La reine ___ perdu sa couronne.', 'a'], ['Nous allons ___ la fête du village.', 'à'],
      ['Le dragon ___ très faim ce matin.', 'a'], ['Le marchand vend des pommes ___ deux sous.', 'à'],
      ['Le moulin ___ vent tourne sur la colline.', 'à'], ['Mon cheval ___ peur du tonnerre.', 'a'],
      ['On joue ___ cache-cache dans le donjon.', 'à'], ['Le page ___ oublié son bouclier.', 'a'],
      ['La sorcière habite ___ côté du marais.', 'à'], ['Le troll ___ un nez énorme.', 'a'],
    ],
  },
  et: {
    choices: ['et', 'est'],
    tip: {
      et: 'On peut le remplacer par « et puis » : il relie deux mots → <b>et</b>.',
      est: 'On peut le remplacer par « était » : c’est le verbe être → <b>est</b>.',
    },
    items: [
      ['Le roi ___ la reine dînent ensemble.', 'et'], ['Le donjon ___ très haut.', 'est'],
      ['Il prend son arc ___ ses flèches.', 'et'], ['La forêt ___ sombre et silencieuse.', 'est'],
      ['Le pont-levis ___ baissé.', 'est'], ['J’aime les tartes ___ les beignets.', 'et'],
      ['Le dragon ___ endormi dans sa grotte.', 'est'], ['Le forgeron ___ son apprenti travaillent.', 'et'],
      ['Cette armure ___ trop lourde pour moi.', 'est'], ['Il pleut ___ il vente sur la lande.', 'et'],
    ],
  },
  son: {
    choices: ['son', 'sont'],
    tip: {
      son: 'On peut le remplacer par « mon » ou « ton » : c’est un déterminant → <b>son</b>.',
      sont: 'On peut le remplacer par « étaient » : c’est le verbe être → <b>sont</b>.',
    },
    items: [
      ['Le chevalier cire ___ armure.', 'son'], ['Les gardes ___ fatigués après la nuit.', 'sont'],
      ['Les tours du château ___ très hautes.', 'sont'], ['Le roi parle à ___ fils.', 'son'],
      ['Ils ___ partis à l’aube.', 'sont'], ['Le magicien range ___ grimoire.', 'son'],
      ['Les dragons ___ gourmands.', 'sont'], ['La fée agite ___ bâton magique.', 'son'],
      ['Où ___ passés les chevaux ?', 'sont'], ['Le troll a perdu ___ gourdin.', 'son'],
    ],
  },
  on: {
    choices: ['on', 'ont'],
    tip: {
      on: 'On peut le remplacer par « il » : c’est un pronom → <b>on</b>.',
      ont: 'On peut le remplacer par « avaient » : c’est le verbe avoir → <b>ont</b>.',
    },
    items: [
      ['Les archers ___ gagné le concours.', 'ont'], ['___ entend le tonnerre au loin.', 'on'],
      ['Les paysans ___ des moutons et des chèvres.', 'ont'], ['Demain, ___ partira au tournoi.', 'on'],
      ['Ils ___ peur du loup.', 'ont'], ['Au château, ___ mange du gibier.', 'on'],
      ['Les fées ___ des ailes transparentes.', 'ont'], ['Quand ___ est chevalier, ___ est courageux.', 'on'],
      ['Les moines ___ recopié le livre.', 'ont'], ['___ dit que le dragon est gentil.', 'on'],
    ],
  },
  ou: {
    choices: ['ou', 'où'],
    tip: {
      ou: 'On peut le remplacer par « ou bien » : c’est un choix → <b>ou</b> sans accent.',
      où: 'Il indique un lieu (ou un moment), souvent dans une question → <b>où</b> avec un accent.',
    },
    items: [
      ['Veux-tu une pomme ___ une poire ?', 'ou'], ['___ se cache le trésor ?', 'où'],
      ['Le village ___ je suis né est loin d’ici.', 'où'], ['À cheval ___ à pied, nous arriverons.', 'ou'],
      ['Je connais la grotte ___ dort le dragon.', 'où'], ['Prends l’épée ___ la lance.', 'ou'],
      ['D’___ viens-tu, voyageur ?', 'où'], ['Rouge ___ bleu, quel blason préfères-tu ?', 'ou'],
    ],
  },
  ces: {
    choices: ['ces', 'ses'],
    tip: {
      ces: 'On montre quelque chose (on pourrait dire « ces … -là ») → <b>ces</b>.',
      ses: 'Cela appartient à quelqu’un (on pourrait dire « les siens / les siennes ») → <b>ses</b>.',
    },
    items: [
      ['Le chevalier range ___ armes.', 'ses'], ['Regarde ___ magnifiques bannières là-bas !', 'ces'],
      ['La reine aime ___ enfants.', 'ses'], ['___ dragons-là sont dangereux.', 'ces'],
      ['Le marchand compte ___ pièces d’or.', 'ses'], ['Qui a construit ___ remparts ?', 'ces'],
    ],
  },
  cest: {
    choices: ['c’est', 's’est'],
    tip: {
      'c’est': 'On peut le remplacer par « cela est » → <b>c’est</b>.',
      's’est': 'C’est un verbe qui se conjugue avec « se » (il s’envole → il s’est envolé). Avec « je », on dirait « je me suis » → <b>s’est</b>.',
    },
    items: [
      ['___ le plus grand château du royaume.', 'c’est'], ['Le dragon ___ envolé au-dessus des tours.', 's’est'],
      ['Le voleur ___ caché derrière le mur.', 's’est'], ['___ une belle journée pour un tournoi.', 'c’est'],
      ['La princesse ___ réveillée en sursaut.', 's’est'], ['Regarde, ___ la licorne !', 'c’est'],
    ],
  },
  ce: {
    choices: ['ce', 'se'],
    tip: {
      ce: 'On peut ajouter « -là » après le nom (ce château-là) : c’est un déterminant → <b>ce</b>.',
      se: 'Il est devant un verbe (il se prépare → je me prépare) → <b>se</b>.',
    },
    items: [
      ['Le chevalier ___ prépare pour le combat.', 'se'], ['___ château appartient au roi.', 'ce'],
      ['Elle ___ cache derrière le rideau.', 'se'], ['___ dragon est plutôt gentil.', 'ce'],
      ['Les loups ___ réunissent la nuit.', 'se'], ['Qui a forgé ___ bouclier ?', 'ce'],
    ],
  },
  la: {
    choices: ['la', 'là', 'l’a'],
    tip: {
      la: 'Il est devant un nom (la princesse) : c’est un déterminant → <b>la</b>.',
      là: 'Il indique un lieu (on peut dire « ici ») → <b>là</b> avec un accent.',
      'l’a': 'On peut le remplacer par « l’avait » → <b>l’a</b>.',
    },
    items: [
      ['Pose ton épée ___, sur la table.', 'là'], ['___ princesse regarde par la fenêtre.', 'la'],
      ['Sa bague ? Le page ___ retrouvée !', 'l’a'], ['Le trésor est caché ___-bas.', 'là'],
      ['Le roi ? Le dragon ___ salué poliment.', 'l’a'], ['Ouvre ___ porte du donjon.', 'la'],
    ],
  },
  leur: {
    choices: ['leur', 'leurs'],
    tip: {
      leur: 'Devant un verbe, « leur » veut dire « à eux » : il est <b>invariable</b>. Devant un nom singulier, c’est aussi « leur ».',
      leurs: 'Devant un nom au pluriel (plusieurs choses), on écrit <b>leurs</b> avec un s.',
    },
    items: [
      ['Les chevaliers montent sur ___ chevaux.', 'leurs'], ['Le roi ___ donne une récompense.', 'leur'],
      ['Les paysans rentrent dans ___ maisons.', 'leurs'], ['Je ___ raconte une histoire.', 'leur'],
      ['Les enfants rangent ___ jouets.', 'leurs'], ['La reine ___ sourit.', 'leur'],
    ],
  },
  er: {
    choices: ['é', 'er'],
    tip: {
      é: 'On peut le remplacer par « vendu » ou « pris » : c’est un participe passé → <b>-é</b>.',
      er: 'On peut le remplacer par « vendre » ou « prendre » : c’est un infinitif → <b>-er</b>.',
    },
    items: [
      ['Le dragon va mang___ les pommes du verger.', 'er'], ['Le chevalier a gagn___ le tournoi.', 'é'],
      ['Il faut sauv___ la princesse !', 'er'], ['Les archers ont vis___ la cible.', 'é'],
      ['Je vais trouv___ le trésor.', 'er'], ['Nous avons travers___ la rivière.', 'é'],
      ['Le roi veut écout___ le ménestrel.', 'er'], ['La fée a transform___ la citrouille.', 'é'],
      ['Il est temps de rentr___ au château.', 'er'], ['Le page a apport___ le repas.', 'é'],
    ],
  },
};

const HOMO_TITLE = {
  a: 'a ou à', et: 'et ou est', son: 'son ou sont', on: 'on ou ont', ou: 'ou ou où', ces: 'ces ou ses',
  cest: 'c’est ou s’est', ce: 'ce ou se', la: 'la, là ou l’a', leur: 'leur ou leurs', er: '-é ou -er',
};

export function genHomophone({ keys, skill }) {
  const key = pick(keys);
  const H = HOMO[key];
  const [txt, good] = pick(H.items);
  const atStart = txt.startsWith('___');
  const show = (c) => (atStart ? cap(c) : c);
  const isSuffix = key === 'er';
  const full = txt.replace(/___/g, show(good));
  return {
    kind: 'mcq',
    skill,
    prompt: `Choisis la bonne orthographe : <b>${esc(HOMO_TITLE[key])}</b>`,
    sentence: esc(txt).split('___').join('<span class="blank">?</span>'),
    choices: H.choices.map((c) => (isSuffix ? `-${c}` : show(c))),
    answer: H.choices.indexOf(good),
    explain: `${H.tip[good]}<br>→ « ${esc(full)} »`,
    speak: txt.replace(/___/g, '…'),
  };
}

// ------------------------------------------------------- accords ---
// [phrase, bonne réponse, pièges, explication]
const PLURALS = [
  ['Les ___ du roi galopent dans la plaine. (cheval)', 'chevaux', ['chevals', 'chevaus'], 'Les noms en <b>-al</b> font leur pluriel en <b>-aux</b> : un cheval, des chevaux.'],
  ['Le royaume compte trois ___ forts. (château)', 'châteaux', ['châteaus', 'château'], 'Les noms en <b>-eau</b> prennent un <b>x</b> au pluriel : des châteaux.'],
  ['La reine possède des ___ précieux. (bijou)', 'bijoux', ['bijous', 'bijou'], '<b>Bijou</b> fait partie des 7 exceptions en -ou qui prennent un x : bijou, caillou, chou, genou, hibou, joujou, pou.'],
  ['Le forgeron achète des ___. (clou)', 'clous', ['cloux', 'clou'], 'La plupart des noms en <b>-ou</b> prennent un <b>s</b> : des clous. Seuls 7 prennent un x (bijou, caillou, chou, genou, hibou, joujou, pou).'],
  ['Les crieurs lisent les ___ du royaume. (journal)', 'journaux', ['journals', 'journaus'], 'Les noms en <b>-al</b> font leur pluriel en <b>-aux</b> : des journaux.'],
  ['On organise des ___ au château. (bal)', 'bals', ['baux', 'bales'], 'Exception ! <b>Bal</b>, carnaval, festival, chacal, récital et régal prennent un <b>s</b> : des bals.'],
  ['Les ___ crépitent dans la cheminée. (feu)', 'feux', ['feus', 'feu'], 'Les noms en <b>-eu</b> prennent un <b>x</b> au pluriel : des feux.'],
  ['Des ___ hululent dans la forêt. (hibou)', 'hiboux', ['hibous', 'hibou'], '<b>Hibou</b> fait partie des 7 exceptions en -ou qui prennent un x.'],
  ['Les maçons font de grands ___. (travail)', 'travaux', ['travails', 'travaus'], 'Exception : <b>travail</b> devient <b>travaux</b> au pluriel (comme vitrail → vitraux).'],
  ['Les ___ de la chapelle brillent au soleil. (vitrail)', 'vitraux', ['vitrails', 'vitrals'], 'Exception : <b>vitrail</b> devient <b>vitraux</b>.'],
  ['Le chevalier blesse ses deux ___. (genou)', 'genoux', ['genous', 'genou'], '<b>Genou</b> fait partie des 7 exceptions en -ou qui prennent un x.'],
  ['Les enfants ramassent des ___. (caillou)', 'cailloux', ['caillous', 'caillou'], '<b>Caillou</b> fait partie des 7 exceptions en -ou qui prennent un x.'],
  ['Le château a deux ___. (portail)', 'portails', ['portaux', 'portail'], 'La plupart des noms en <b>-ail</b> prennent un <b>s</b> : des portails (sauf travail, vitrail, corail…).'],
  ['Les ___ volent au-dessus des tours. (oiseau)', 'oiseaux', ['oiseaus', 'oiseau'], 'Les noms en <b>-eau</b> prennent un <b>x</b> au pluriel : des oiseaux.'],
];

const ADJ = [
  ['Les chevaliers portent des épées ___. (brillant)', 'brillantes', ['brillants', 'brillante'], '« épées » est féminin pluriel : on ajoute <b>-e</b> pour le féminin et <b>-s</b> pour le pluriel.'],
  ['Le chevalier porte une armure ___. (lourd)', 'lourde', ['lourd', 'lourdes'], '« armure » est féminin singulier : on ajoute un <b>e</b>.'],
  ['Le roi monte des chevaux ___. (blanc)', 'blancs', ['blanches', 'blanc'], '« chevaux » est masculin pluriel : on ajoute un <b>s</b>.'],
  ['Viviane est une fée très ___. (gentil)', 'gentille', ['gentile', 'gentil'], 'Au féminin, les adjectifs en <b>-il</b> doublent le l : gentil → gentille.'],
  ['Jeanne est une bergère ___. (courageux)', 'courageuse', ['courageuxe', 'courageux'], 'Au féminin, les adjectifs en <b>-eux</b> deviennent <b>-euse</b> : courageuse.'],
  ['Ces tours ___ datent de mille ans. (ancien)', 'anciennes', ['anciens', 'ancienes'], 'Au féminin, <b>-ien</b> devient <b>-ienne</b> (on double le n), puis -s au pluriel : anciennes.'],
  ['Le forgeron a fabriqué une épée ___. (neuf)', 'neuve', ['neufe', 'neuf'], 'Au féminin, les adjectifs en <b>-f</b> deviennent <b>-ve</b> : neuf → neuve.'],
  ['Les sorcières sont ___ ce soir. (joyeux)', 'joyeuses', ['joyeux', 'joyeuse'], '« sorcières » est féminin pluriel : joyeux → joyeuse → <b>joyeuses</b>.'],
  ['Une ___ bannière flotte sur le donjon. (beau)', 'belle', ['beau', 'bele'], '<b>Beau</b> devient <b>belle</b> au féminin.'],
  ['Le dragon a des écailles ___. (vert)', 'vertes', ['verts', 'verte'], '« écailles » est féminin pluriel : verte + s = <b>vertes</b>.'],
];

const SUBJ_VERB = [
  ['Les dragons ___ du feu. (cracher)', 'crachent', ['crache', 'craches'], 'Le sujet « les dragons » est au pluriel (ils) : le verbe se termine par <b>-ent</b>.'],
  ['Le roi et la reine ___ ensemble. (dîner)', 'dînent', ['dîne', 'dînes'], 'Deux sujets (le roi ET la reine) = ils : le verbe prend <b>-ent</b>.'],
  ['Les chevaliers du roi ___ au galop. (arriver)', 'arrivent', ['arrive', 'arrives'], 'Piège ! Le sujet est « les chevaliers » (pas « le roi ») : on écrit <b>arrivent</b>.'],
  ['Toi et moi ___ demain. (partir)', 'partirons', ['partiront', 'partira'], '« Toi et moi » = <b>nous</b> → nous partirons.'],
  ['Le chef des gardes ___ très fort. (crier)', 'crie', ['crient', 'cries'], 'Piège ! Le sujet est « le chef » (singulier), pas « les gardes » : il crie.'],
  ['Dans la forêt ___ les loups. (hurler)', 'hurlent', ['hurle', 'hurles'], 'Le sujet est placé après le verbe : qui est-ce qui hurle ? <b>les loups</b> → ils hurlent.'],
  ['Les fées les ___ de loin. (regarder)', 'regardent', ['regarde', 'regardes'], 'Ici « les » devant le verbe n’est pas le sujet ! Qui regarde ? <b>les fées</b> → elles regardent.'],
  ['Le marchand et son fils ___ des étoffes. (vendre)', 'vendent', ['vend', 'vends'], 'Deux sujets = ils : <b>vendent</b>.'],
];

const PP_ETRE = [
  ['La reine est ___ au château. (arriver)', 'arrivée', ['arrivé', 'arrivés', 'arrivées']],
  ['Les chevaliers sont ___ à l’aube. (partir)', 'partis', ['parti', 'partie', 'parties']],
  ['Les princesses sont ___ au bal. (venir)', 'venues', ['venu', 'venue', 'venus']],
  ['Le dragon est ___ dans la rivière. (tomber)', 'tombé', ['tombée', 'tombés', 'tomber']],
  ['Les fées sont ___ dans la forêt. (rester)', 'restées', ['restés', 'restée', 'rester']],
  ['Mes amies sont ___ au marché. (aller)', 'allées', ['allés', 'allée', 'aller']],
  ['Les gardes étaient ___ dans la tour. (monter)', 'montés', ['monté', 'montées', 'monter']],
  ['La sorcière est ___ par la cheminée. (sortir)', 'sortie', ['sorti', 'sorties', 'sortir']],
];

function accordQ(bank, skill, title) {
  const [txt, good, traps, why] = pick(bank);
  const { choices, answer } = mcqChoices(good, traps, traps.length + 1);
  return {
    kind: 'mcq',
    skill,
    prompt: title,
    sentence: blank(esc(txt)),
    choices,
    answer,
    explain: `${why}<br>→ « ${esc(txt.replace('___', good).replace(/ \(.*\)$/, '').replace(/ \./, '.'))} »`,
    speak: txt.replace('___', '…').replace(/\(.*\)/, ''),
  };
}

export const genPlural = ({ skill }) => accordQ(PLURALS, skill, 'Écris le nom au <b>pluriel</b> :');
export const genAdj = ({ skill }) => accordQ(ADJ, skill, 'Accorde l’<b>adjectif</b> avec le nom :');
export const genSubjVerb = ({ skill }) => accordQ(SUBJ_VERB, skill, 'Accorde le <b>verbe</b> avec son sujet :');
export function genPPEtre({ skill }) {
  const [txt, good, traps] = pick(PP_ETRE);
  const q = accordQ([[txt, good, traps, 'Avec l’auxiliaire <b>être</b>, le participe passé s’accorde avec le sujet (féminin : +e, pluriel : +s).']], skill, 'Accorde le <b>participe passé</b> :');
  return q;
}

// --------------------------------------------------------------- étapes ---
const take = (n, fn) => Array.from({ length: n }, fn).filter(Boolean);

export const ORTHO_STAGES = [
  { title: 'Le Gué des Petits Mots', gen: (skill) => shuffle([...take(4, () => genHomophone({ keys: ['a'], skill })), ...take(4, () => genHomophone({ keys: ['et'], skill }))]) },
  { title: 'Les Roseaux Murmurants', gen: (skill) => take(8, () => genHomophone({ keys: ['son', 'on', 'ou'], skill })) },
  { title: 'La Brume Trompeuse', gen: (skill) => take(8, () => genHomophone({ keys: ['ces', 'cest', 'ce', 'la', 'leur'], skill })) },
  {
    title: 'Le Pont des Accords',
    gen: (skill) => shuffle([...take(3, () => genPlural({ skill })), ...take(3, () => genAdj({ skill })), ...take(2, () => genSubjVerb({ skill }))]),
  },
  {
    title: 'L’Île du Participe',
    gen: (skill) => shuffle([...take(4, () => genHomophone({ keys: ['er'], skill })), ...take(3, () => genPPEtre({ skill })), ...take(1, () => genSubjVerb({ skill }))]),
  },
];

export function orthoBoss(skill, n = 24) {
  const gens = [
    () => genHomophone({ keys: Object.keys(HOMO), skill }),
    () => genHomophone({ keys: Object.keys(HOMO), skill }),
    () => genPlural({ skill }),
    () => genAdj({ skill }),
    () => genSubjVerb({ skill }),
    () => genPPEtre({ skill }),
  ];
  return take(n, () => pick(gens)());
}
