// ============================================================================
// LA FORGE DES VERBES — moteur de conjugaison + générateurs d'exercices.
//
// Les verbes sont vraiment conjugués par le code (1er groupe, 2e groupe et
// 15 verbes irréguliers), donc chaque partie propose des exercices nouveaux.
// Personnes : 0 je, 1 tu, 2 il/elle, 3 nous, 4 vous, 5 ils/elles.
// ============================================================================

import { pick, shuffle, cap, esc, mcqChoices, blank, uniq } from '../util.js';

export const TENSE_LABEL = {
  present: 'présent',
  imparfait: 'imparfait',
  futur: 'futur simple',
  pc: 'passé composé',
  pqp: 'plus-que-parfait',
  ps: 'passé simple',
  cond: 'conditionnel présent',
  imp: 'impératif présent',
};

/** « au présent », « à l’imparfait »… */
export const atTense = (t) => (t === 'imparfait' || t === 'imp' ? 'à l’' : 'au ') + TENSE_LABEL[t];
const atTenseB = (t) => (t === 'imparfait' || t === 'imp' ? 'à l’' : 'au ') + `<b>${TENSE_LABEL[t]}</b>`;

// Sujets possibles pour chaque personne (g = genre, utile pour les accords).
const SUBJECTS = [
  [{ t: 'je' }],
  [{ t: 'tu' }],
  [
    { t: 'il', g: 'm' }, { t: 'elle', g: 'f' }, { t: 'le roi', g: 'm' }, { t: 'la reine', g: 'f' },
    { t: 'le dragon', g: 'm' }, { t: 'la princesse', g: 'f' }, { t: 'le chevalier', g: 'm' },
    { t: 'la fée', g: 'f' }, { t: 'Merlin', g: 'm' }, { t: 'la sorcière', g: 'f' },
  ],
  [{ t: 'nous' }],
  [{ t: 'vous' }],
  [
    { t: 'ils', g: 'm' }, { t: 'elles', g: 'f' }, { t: 'les chevaliers', g: 'm' }, { t: 'les dames', g: 'f' },
    { t: 'les archers', g: 'm' }, { t: 'les fées', g: 'f' }, { t: 'les paysans', g: 'm' },
    { t: 'les princesses', g: 'f' }, { t: 'les dragons', g: 'm' },
  ],
];

// ---------------------------------------------------------------- verbes ---
const G1 = [
  ['chanter', 'une ballade'], ['danser', 'au bal du roi'], ['jouer', 'aux dés'], ['parler', 'au dragon'],
  ['marcher', 'vers le château'], ['garder', 'le pont-levis'], ['porter', 'une armure'],
  ['gagner', 'le tournoi'], ['sauter', 'par-dessus le fossé'], ['regarder', 'les étoiles'],
  ['écouter', 'le ménestrel'], ['aimer', 'les histoires de fées'], ['habiter', 'dans un donjon'],
  ['galoper', 'dans la plaine'], ['chasser', 'le sanglier'], ['manger', 'du pain d’épices'],
  ['nager', 'dans les douves'], ['voyager', 'jusqu’à la mer'], ['lancer', 'une flèche'],
  ['avancer', 'vers la forêt'], ['forger', 'une épée'], ['trouver', 'un trésor'],
  ['préparer', 'une potion'], ['raconter', 'une légende'], ['briller', 'au soleil'],
  ['travailler', 'à la forge'], ['dessiner', 'un blason'], ['crier', 'de joie'],
  ['arriver', 'au château', 'être'], ['entrer', 'dans la grande salle', 'être'],
  ['tomber', 'dans la rivière', 'être'], ['rester', 'près du feu', 'être'],
].map(([inf, c, aux]) => ({ inf, c, group: 1, aux: aux || 'avoir' }));

const G2 = [
  ['finir', 'la potion'], ['grandir', 'au château'], ['bâtir', 'une tour'], ['choisir', 'une épée'],
  ['obéir', 'au roi'], ['réussir', 'l’épreuve'], ['rougir', 'de timidité'], ['saisir', 'le bouclier'],
  ['envahir', 'le donjon'], ['guérir', 'le dragon'], ['remplir', 'le chaudron'],
  ['applaudir', 'les jongleurs'], ['réfléchir', 'à l’énigme'], ['nourrir', 'les chevaux'],
  ['ralentir', 'devant le pont'],
].map(([inf, c]) => ({ inf, c, group: 2, aux: 'avoir' }));

const IRR_LIST = [
  { inf: 'être', c: 'au château', pres: 'suis es est sommes êtes sont', imp: 'ét', fut: 'ser',
    ps: 'fus fus fut fûmes fûtes furent', pp: 'été', imper: 'sois soyons soyez', fake: ['serer', 'suire'] },
  { inf: 'avoir', c: 'un cheval', pres: 'ai as a avons avez ont', imp: 'av', fut: 'aur',
    ps: 'eus eus eut eûmes eûtes eurent', pp: 'eu', imper: 'aie ayons ayez', fake: ['aurer', 'avor'] },
  { inf: 'aller', c: 'au marché', pres: 'vais vas va allons allez vont', imp: 'all', fut: 'ir',
    ps: 'allai allas alla allâmes allâtes allèrent', pp: 'allé', aux: 'être', imper: 'va allons allez', fake: ['irer', 'vaser'] },
  { inf: 'faire', c: 'un vœu', pres: 'fais fais fait faisons faites font', imp: 'fais', fut: 'fer',
    ps: 'fis fis fit fîmes fîtes firent', pp: 'fait', imper: 'fais faisons faites', fake: ['faiser', 'ferer'] },
  { inf: 'dire', c: 'la vérité', pres: 'dis dis dit disons dites disent', imp: 'dis', fut: 'dir',
    ps: 'dis dis dit dîmes dîtes dirent', pp: 'dit', imper: 'dis disons dites', fake: ['diser', 'direr'] },
  { inf: 'venir', c: 'de la forêt', pres: 'viens viens vient venons venez viennent', imp: 'ven', fut: 'viendr',
    ps: 'vins vins vint vînmes vîntes vinrent', pp: 'venu', aux: 'être', imper: 'viens venons venez', fake: ['viendre', 'vener'] },
  { inf: 'pouvoir', c: 'voler', pres: 'peux peux peut pouvons pouvez peuvent', imp: 'pouv', fut: 'pourr',
    ps: 'pus pus put pûmes pûtes purent', pp: 'pu', fake: ['pouver', 'peuvoir'] },
  { inf: 'vouloir', c: 'un dragon', pres: 'veux veux veut voulons voulez veulent', imp: 'voul', fut: 'voudr',
    ps: 'voulus voulus voulut voulûmes voulûtes voulurent', pp: 'voulu', fake: ['vouler', 'veuloir'] },
  { inf: 'voir', c: 'la mer', pres: 'vois vois voit voyons voyez voient', imp: 'voy', fut: 'verr',
    ps: 'vis vis vit vîmes vîtes virent', pp: 'vu', imper: 'vois voyons voyez', fake: ['voyer', 'verrer'] },
  { inf: 'prendre', c: 'la route', pres: 'prends prends prend prenons prenez prennent', imp: 'pren', fut: 'prendr',
    ps: 'pris pris prit prîmes prîtes prirent', pp: 'pris', imper: 'prends prenons prenez', fake: ['prenir', 'prender'] },
  { inf: 'partir', c: 'à l’aube', pres: 'pars pars part partons partez partent', imp: 'part', fut: 'partir',
    ps: 'partis partis partit partîmes partîtes partirent', pp: 'parti', aux: 'être', imper: 'pars partons partez', fake: ['parter', 'partre'] },
  { inf: 'devoir', c: 'partir', pres: 'dois dois doit devons devez doivent', imp: 'dev', fut: 'devr',
    ps: 'dus dus dut dûmes dûtes durent', pp: 'dû', fake: ['dever', 'doiver'] },
  { inf: 'savoir', c: 'lire', pres: 'sais sais sait savons savez savent', imp: 'sav', fut: 'saur',
    ps: 'sus sus sut sûmes sûtes surent', pp: 'su', imper: 'sache sachons sachez', fake: ['saver', 'saurer'] },
  { inf: 'mettre', c: 'un heaume', pres: 'mets mets met mettons mettez mettent', imp: 'mett', fut: 'mettr',
    ps: 'mis mis mit mîmes mîtes mirent', pp: 'mis', imper: 'mets mettons mettez', fake: ['metter', 'mettir'] },
  { inf: 'tenir', c: 'la lance', pres: 'tiens tiens tient tenons tenez tiennent', imp: 'ten', fut: 'tiendr',
    ps: 'tins tins tint tînmes tîntes tinrent', pp: 'tenu', imper: 'tiens tenons tenez', fake: ['tiendre', 'tener'] },
];
const IRR = {};
IRR_LIST.forEach((v) => {
  v.group = 3;
  v.aux = v.aux || 'avoir';
  v.pres = v.pres.split(' ');
  v.ps = v.ps.split(' ');
  v.imper = v.imper ? v.imper.split(' ') : null;
  IRR[v.inf] = v;
});

const ETRE = IRR['être'];
const AVOIR = IRR['avoir'];

// Verbes du 3e groupe en -ir (pièges pour la question « quel groupe ? »).
const G3_EXTRA = ['courir', 'dormir', 'sortir', 'ouvrir', 'offrir', 'cueillir', 'servir', 'écrire', 'lire', 'boire', 'peindre', 'vendre', 'combattre'];

// ------------------------------------------------------------ conjugaison ---
const END = {
  pres1: ['e', 'es', 'e', 'ons', 'ez', 'ent'],
  pres2: ['is', 'is', 'it', 'issons', 'issez', 'issent'],
  imparfait: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
  futur: ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
  ps1: ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  ps2: ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
};

// manger → nous mangeons ; lancer → nous lançons (devant a / o).
function soften(stem, ending) {
  if (/^[aoâ]/.test(ending)) {
    if (stem.endsWith('g')) return stem + 'e';
    if (stem.endsWith('c')) return stem.slice(0, -1) + 'ç';
  }
  return stem;
}

function simple(v, tense, p) {
  const st = v.inf.slice(0, -2);
  if (v.group === 1) {
    if (tense === 'present') return soften(st, END.pres1[p]) + END.pres1[p];
    if (tense === 'imparfait') return soften(st, END.imparfait[p]) + END.imparfait[p];
    if (tense === 'futur') return v.inf + END.futur[p];
    if (tense === 'cond') return v.inf + END.imparfait[p];
    if (tense === 'ps') return soften(st, END.ps1[p]) + END.ps1[p];
  } else if (v.group === 2) {
    if (tense === 'present') return st + END.pres2[p];
    if (tense === 'imparfait') return st + 'iss' + END.imparfait[p];
    if (tense === 'futur') return v.inf + END.futur[p];
    if (tense === 'cond') return v.inf + END.imparfait[p];
    if (tense === 'ps') return st + END.ps2[p];
  } else {
    if (tense === 'present') return v.pres[p];
    if (tense === 'imparfait') return v.imp + END.imparfait[p];
    if (tense === 'futur') return v.fut + END.futur[p];
    if (tense === 'cond') return v.fut + END.imparfait[p];
    if (tense === 'ps') return v.ps[p];
  }
  throw new Error(`temps inconnu ${tense}`);
}

export function participle(v) {
  if (v.group === 1) return v.inf.slice(0, -2) + 'é';
  if (v.group === 2) return v.inf.slice(0, -2) + 'i';
  return v.pp;
}

function agree(pp, g, plural) {
  let s = pp + (g === 'f' ? 'e' : '');
  if (plural && !s.endsWith('s')) s += 's';
  return s;
}

/** Forme conjuguée sans le sujet. g = genre du sujet (pour l'accord avec être). */
export function conj(v, tense, p, g = 'm') {
  if (tense === 'pc' || tense === 'pqp') {
    const aux = v.aux === 'être' ? ETRE : AVOIR;
    const auxForm = simple(aux, tense === 'pc' ? 'present' : 'imparfait', p);
    const pp = v.aux === 'être' ? agree(participle(v), g, p >= 3) : participle(v);
    return `${auxForm} ${pp}`;
  }
  if (tense === 'imp') {
    const k = { 1: 0, 3: 1, 4: 2 }[p];
    if (v.group === 1) {
      const st = v.inf.slice(0, -2);
      return [st + 'e', soften(st, 'ons') + 'ons', st + 'ez'][k];
    }
    if (v.group === 2) return simple(v, 'present', p);
    return v.imper[k];
  }
  return simple(v, tense, p);
}

const startsWithVowel = (s) => /^[aeiouyéèêâîôûœh]/i.test(s);

/** « je » + forme, avec l'élision : j'aime, j'ai chanté. */
export function withSubject(subj, form) {
  if (subj === 'je' && startsWithVowel(form)) return `j’${form}`;
  return `${subj} ${form}`;
}

// ------------------------------------------------------------ utilitaires ---
const ALL_VERBS = [...G1, ...G2, ...IRR_LIST];
const IRR_COMMON = ['aller', 'faire', 'dire', 'venir', 'pouvoir', 'vouloir', 'voir', 'prendre', 'partir', 'devoir', 'savoir', 'mettre', 'tenir'].map((k) => IRR[k]);

const VERB_POOLS = {
  base: () => [...G1, ...G2, ETRE, AVOIR],
  irr: () => IRR_COMMON,
  all: () => ALL_VERBS,
};

function validPersons(v, tense) {
  if (tense === 'imp') return v.group === 3 && !v.imper ? [] : [1, 3, 4];
  if (tense === 'ps') return [2, 5]; // programme : 3e personnes du passé simple
  if ((tense === 'pc' || tense === 'pqp') && v.aux === 'être') return [2, 5];
  return [0, 1, 2, 3, 4, 5];
}

function pickSubject(p) {
  return pick(SUBJECTS[p]);
}

const NEAR = {
  present: ['imparfait', 'futur'],
  imparfait: ['present', 'cond'],
  futur: ['cond', 'present'],
  cond: ['futur', 'imparfait'],
  ps: ['imparfait', 'present'],
  pc: ['pqp', 'present'],
  pqp: ['pc', 'imparfait'],
  imp: ['present'],
};

function personLabel(p) {
  return ['1re personne du singulier', '2e personne du singulier', '3e personne du singulier',
    '1re personne du pluriel', '2e personne du pluriel', '3e personne du pluriel'][p];
}

function endingHint(v, tense, p) {
  const T = TENSE_LABEL[tense];
  if (tense === 'present') {
    if (v.group === 1) return `Au présent, les verbes en -er se terminent par -e, -es, -e, -ons, -ez, -ent.`;
    if (v.group === 2) return `Au présent, les verbes du 2e groupe font -is, -is, -it, -issons, -issez, -issent.`;
    return `« ${v.inf} » est un verbe irrégulier : sa conjugaison au présent est à connaître par cœur.`;
  }
  if (tense === 'imparfait') return `À l’imparfait, tous les verbes se terminent par -ais, -ais, -ait, -ions, -iez, -aient.`;
  if (tense === 'futur') return `Au futur, les terminaisons sont -ai, -as, -a, -ons, -ez, -ont${v.group === 3 ? `, et le radical de « ${v.inf} » est « ${v.fut}- »` : ', ajoutées à l’infinitif'}.`;
  if (tense === 'cond') return `Le conditionnel = radical du futur (${v.group === 3 ? v.fut : v.inf}-) + terminaisons de l’imparfait (-ais, -ais, -ait, -ions, -iez, -aient).`;
  if (tense === 'ps') return `Au passé simple, ${v.group === 1 ? 'les verbes en -er font -a / -èrent' : v.group === 2 ? 'les verbes du 2e groupe font -it / -irent' : `« ${v.inf} » fait « il ${v.ps[2]} / ils ${v.ps[5]} »`}.`;
  if (tense === 'pc') return `Passé composé = auxiliaire ${v.aux} au présent + participe passé (${participle(v)}).${v.aux === 'être' ? ' Avec être, le participe s’accorde avec le sujet !' : ''}`;
  if (tense === 'pqp') return `Plus-que-parfait = auxiliaire ${v.aux} à l’imparfait + participe passé (${participle(v)}).${v.aux === 'être' ? ' Avec être, le participe s’accorde avec le sujet !' : ''}`;
  if (tense === 'imp') return `À l’impératif, il n’y a pas de sujet.${v.group === 1 && p === 1 ? ' Attention : pour les verbes en -er, pas de « s » à la 2e personne du singulier !' : ''}`;
  return T;
}

// ----------------------------------------------------------- générateurs ---

/** QCM : compléter la phrase avec la bonne forme. */
export function genForm({ tenses, pool = 'base', skill, n = 4 }) {
  for (let tries = 0; tries < 40; tries++) {
    const tense = pick(tenses);
    const v = pick(VERB_POOLS[pool]());
    const persons = validPersons(v, tense);
    if (!persons.length) continue;
    const p = pick(persons);
    const s = pickSubject(p);
    const g = s.g || 'm';
    const correct = conj(v, tense, p, g);

    // Pièges : autres personnes du même temps, même personne à un temps voisin.
    let traps = [];
    if ((tense === 'pc' || tense === 'pqp') && v.aux === 'être') {
      const aux = conj(v, tense, p, g).split(' ')[0];
      traps = ['m', 'f'].flatMap((gg) => [false, true].map((pl) => `${aux} ${agree(participle(v), gg, pl)}`));
    }
    validPersons(v, tense).forEach((q) => { if (q !== p) traps.push(conj(v, tense, q, g)); });
    (NEAR[tense] || []).forEach((t) => {
      if (validPersons(v, t).includes(p)) traps.push(conj(v, t, p, g));
    });
    // Impératif : le piège classique est la forme du présent (« tu chantes »).
    if (tense === 'imp') [0, 1, 2, 5].forEach((q) => traps.push(conj(v, 'present', q, g)));
    traps = shuffle(uniq(traps)).filter((t) => t !== correct);
    if (traps.length < n - 1) continue;

    let shown = (f) => f;
    let sentence;
    if (tense === 'imp') {
      shown = (f) => cap(f);
      sentence = `___ (${v.inf}) ${v.c} !`;
    } else if (p === 0) {
      shown = (f) => withSubject('je', f);
      sentence = `___ (${v.inf}) ${v.c}.`;
    } else {
      sentence = `${cap(s.t)} ___ (${v.inf}) ${v.c}.`;
    }
    const { choices, answer } = mcqChoices(shown(correct), traps.map(shown), n);
    const full = tense === 'imp' ? `${cap(correct)} ${v.c} !` : `${cap(p === 0 ? withSubject('je', correct) : `${s.t} ${correct}`)} ${v.c}.`;
    return {
      kind: 'mcq',
      skill,
      prompt: tense === 'imp'
        ? `Donne l’ordre : verbe à l’<b>impératif présent</b> (${personLabel(p)}) :`
        : `Conjugue le verbe ${atTenseB(tense)} :`,
      sentence: blank(esc(sentence)),
      choices,
      answer,
      explain: `${esc(full)}<br>${esc(endingHint(v, tense, p))}`,
      speak: sentence.replace('___', '…'),
    };
  }
  return null;
}

/** QCM : à quel temps est conjugué ce verbe ? */
export function genWhichTense({ tenses, pool = 'all', skill }) {
  for (let tries = 0; tries < 60; tries++) {
    const tense = pick(tenses);
    const v = pick(VERB_POOLS[pool]());
    const persons = validPersons(v, tense).filter((q) => q !== 0);
    if (!persons.length) continue;
    const p = pick(persons);
    const s = pickSubject(p);
    const form = conj(v, tense, p, s.g);
    // On écarte les formes identiques dans deux temps (ex. « il finit »).
    const clash = tenses.some((t) => t !== tense && validPersons(v, t).includes(p) && conj(v, t, p, s.g) === form);
    if (clash) continue;
    let others = shuffle(tenses.filter((t) => t !== tense));
    if (others.length < 2) others.push(...shuffle(['futur', 'pc', 'cond'].filter((t) => t !== tense && !others.includes(t))));
    const { choices, answer } = mcqChoices(TENSE_LABEL[tense], others.slice(0, 3).map((t) => TENSE_LABEL[t]), Math.max(3, Math.min(4, tenses.length)));
    const subj = tense === 'imp' ? '' : `${esc(cap(s.t))} `;
    const verb = tense === 'imp' ? esc(cap(form)) : esc(form);
    return {
      kind: 'mcq',
      skill,
      prompt: 'À quel temps le verbe est-il conjugué ?',
      sentence: `${subj}<b class="hl">${verb}</b> ${esc(v.c)}${tense === 'imp' ? ' !' : '.'}`,
      choices,
      answer,
      explain: `« ${esc(form)} » est le verbe <b>${esc(v.inf)}</b> ${atTenseB(tense)}. ${esc(endingHint(v, tense, p))}`,
      speak: `${tense === 'imp' ? '' : s.t} ${form} ${v.c}`,
    };
  }
  return null;
}

/** QCM : retrouver l'infinitif d'une forme conjuguée. */
export function genInfinitive({ skill }) {
  const tense = pick(['present', 'imparfait', 'futur']);
  const v = pick(Math.random() < 0.6 ? IRR_COMMON : [...G1, ...G2]);
  const p = pick([1, 2, 3, 4, 5]);
  const s = pickSubject(p);
  const form = conj(v, tense, p, s.g);
  const st = v.inf.slice(0, -2);
  const fakes = v.group === 3 ? v.fake : v.group === 1 ? [st + 'ir', st + 're'] : [st + 'er', st + 'isser'];
  const { choices, answer } = mcqChoices(v.inf, fakes, 3);
  return {
    kind: 'mcq',
    skill,
    prompt: 'Quel est l’infinitif de ce verbe ?',
    sentence: `${esc(cap(s.t))} <b class="hl">${esc(form)}</b>…`,
    choices,
    answer,
    explain: `L’infinitif, c’est le nom du verbe, sa forme « non conjuguée » : on peut dire « il faut <b>${esc(v.inf)}</b> ». « ${esc(form)} » vient du verbe ${esc(v.inf)}.`,
    speak: `${s.t} ${form}`,
  };
}

/** QCM : à quel groupe appartient ce verbe ? */
export function genGroup({ skill }) {
  const roll = Math.random();
  let inf, group, why;
  if (roll < 0.33) {
    const v = pick(G1); inf = v.inf; group = 1;
    why = `« ${inf} » se termine par -er : c’est un verbe du 1er groupe.`;
  } else if (roll < 0.66) {
    const v = pick(G2); inf = v.inf; group = 2;
    why = `« ${inf} » se termine par -ir et on dit « nous ${conj(v, 'present', 3)} » (avec -issons) : 2e groupe.`;
  } else {
    const trap = Math.random() < 0.5;
    inf = trap ? pick(['partir', 'venir', 'tenir', 'courir', 'dormir', 'sortir', 'ouvrir', 'offrir', 'cueillir', 'servir']) : pick(['aller', ...G3_EXTRA, 'prendre', 'voir', 'faire', 'dire', 'savoir', 'pouvoir']);
    group = 3;
    if (inf === 'aller') why = '« aller » se termine par -er, mais c’est le seul verbe en -er du 3e groupe !';
    else if (inf.endsWith('ir') && !inf.endsWith('oir')) why = `« ${inf} » se termine par -ir mais on ne dit pas « nous ${inf.slice(0, -2)}issons » : il est du 3e groupe.`;
    else why = `« ${inf} » ne se termine ni par -er, ni par -ir avec -issons : c’est un verbe du 3e groupe.`;
  }
  const labels = ['1er groupe', '2e groupe', '3e groupe'];
  return {
    kind: 'mcq',
    skill,
    prompt: 'À quel groupe appartient ce verbe ?',
    sentence: `<b class="hl">${esc(inf)}</b>`,
    choices: labels,
    answer: group - 1,
    explain: esc(why),
    speak: inf,
  };
}

/** QCM : accorder le participe passé avec l'auxiliaire être. */
export function genAccordPP({ skill }) {
  const v = pick([...G1.filter((x) => x.aux === 'être'), IRR['aller'], IRR['venir'], IRR['partir']]);
  const p = pick([2, 5]);
  const s = pickSubject(p);
  const tense = pick(['pc', 'pc', 'pqp']);
  const full = conj(v, tense, p, s.g);
  const aux = full.split(' ')[0];
  const pp = participle(v);
  const variants = ['m', 'f'].flatMap((gg) => [false, true].map((pl) => agree(pp, gg, pl)));
  const correct = agree(pp, s.g, p === 5);
  const { choices, answer } = mcqChoices(correct, variants, 4);
  const who = p === 5 ? (s.g === 'f' ? 'féminin pluriel' : 'masculin pluriel') : (s.g === 'f' ? 'féminin singulier' : 'masculin singulier');
  return {
    kind: 'mcq',
    skill,
    prompt: 'Accorde le participe passé :',
    sentence: blank(esc(`${cap(s.t)} ${aux} ___ (${v.inf}) ${v.c}.`)),
    choices,
    answer,
    explain: `Avec l’auxiliaire <b>être</b>, le participe passé s’accorde avec le sujet. « ${esc(s.t)} » est ${who} → <b>${esc(correct)}</b>.`,
    speak: `${s.t} ${aux} … ${v.c}`,
  };
}

/** Saisie au clavier : écrire soi-même la forme conjuguée. */
export function genType({ tenses, pool = 'base', skill }) {
  for (let tries = 0; tries < 40; tries++) {
    const tense = pick(tenses);
    const v = pick(VERB_POOLS[pool]());
    const persons = validPersons(v, tense);
    if (!persons.length) continue;
    const p = pick(persons);
    const s = pickSubject(p);
    const form = conj(v, tense, p, s.g);
    const answers = tense === 'imp'
      ? [form, `${form} !`]
      : [form, withSubject(p === 0 ? 'je' : s.t, form)];
    const shownSubj = tense === 'imp' ? `(${personLabel(p)})` : `« ${p === 0 ? 'je' : s.t} »`;
    const sentence = tense === 'imp' ? `___ ${v.c} !` : p === 0 ? `___ ${v.c}.` : `${cap(s.t)} ___ ${v.c}.`;
    return {
      kind: 'type',
      skill,
      prompt: `Écris le verbe <b>${esc(v.inf)}</b> ${atTenseB(tense)} avec ${esc(shownSubj)} :`,
      sentence: blank(esc(sentence)),
      answers,
      display: tense === 'imp' ? cap(form) : (p === 0 ? withSubject('je', form) : form),
      explain: esc(endingHint(v, tense, p)),
      speak: `${v.inf}, ${TENSE_LABEL[tense]}`,
    };
  }
  return null;
}

// --------------------------------------------------------------- étapes ---
const take = (n, fn) => Array.from({ length: n }, fn).filter(Boolean);

export const CONJ_STAGES = [
  {
    title: 'Les Lames du Présent',
    gen: (skill) => [
      ...take(5, () => genForm({ tenses: ['present'], pool: 'base', skill, n: 3 })),
      ...take(2, () => genGroup({ skill })),
      ...take(1, () => genForm({ tenses: ['present'], pool: 'base', skill, n: 4 })),
    ],
  },
  {
    title: 'Le Feu de l’Imparfait',
    gen: (skill) => [
      ...take(3, () => genForm({ tenses: ['imparfait'], pool: 'all', skill })),
      ...take(3, () => genForm({ tenses: ['present'], pool: 'irr', skill })),
      ...take(2, () => genWhichTense({ tenses: ['present', 'imparfait'], skill })),
    ],
  },
  {
    title: 'L’Enclume du Futur',
    gen: (skill) => [
      ...take(4, () => genForm({ tenses: ['futur'], pool: 'all', skill })),
      ...take(2, () => genInfinitive({ skill })),
      ...take(1, () => genWhichTense({ tenses: ['present', 'imparfait', 'futur'], skill })),
      ...take(1, () => genType({ tenses: ['futur'], pool: 'base', skill })),
    ],
  },
  {
    title: 'Le Marteau du Passé',
    gen: (skill) => [
      ...take(3, () => genForm({ tenses: ['pc'], pool: 'all', skill })),
      ...take(2, () => genAccordPP({ skill })),
      ...take(2, () => genForm({ tenses: ['pqp'], pool: 'all', skill })),
      ...take(1, () => genWhichTense({ tenses: ['pc', 'pqp', 'imparfait', 'present'], skill })),
    ],
  },
  {
    title: 'Les Runes anciennes',
    gen: (skill) => [
      ...take(3, () => genForm({ tenses: ['ps'], pool: 'all', skill })),
      ...take(2, () => genForm({ tenses: ['cond'], pool: 'all', skill })),
      ...take(2, () => genForm({ tenses: ['imp'], pool: 'all', skill })),
      ...take(1, () => genWhichTense({ tenses: ['ps', 'imparfait', 'cond', 'futur'], skill })),
    ],
  },
];

export function conjBoss(skill, n = 24) {
  const ALL = ['present', 'imparfait', 'futur', 'pc', 'pqp', 'ps', 'cond', 'imp'];
  const gens = [
    () => genForm({ tenses: ALL, pool: 'all', skill }),
    () => genForm({ tenses: ALL, pool: 'all', skill }),
    () => genWhichTense({ tenses: ['present', 'imparfait', 'futur', 'pc', 'ps', 'cond'], skill }),
    () => genType({ tenses: ['present', 'imparfait', 'futur'], pool: 'all', skill }),
    () => genAccordPP({ skill }),
    () => genInfinitive({ skill }),
  ];
  return take(n, () => pick(gens)());
}

