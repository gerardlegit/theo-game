// ============================================================================
// LE CHÂTEAU DES PHRASES — grammaire.
//
// Chaque phrase est annotée : [FONCTION mot:NATURE mot:NATURE] .
//   Fonctions : S sujet, V verbe, COD, COI, ATT attribut du sujet,
//               CCL / CCT / CCM compléments circonstanciels (lieu, temps, manière)
//   Natures   : N nom commun, NP nom propre, D déterminant, A adjectif, V verbe,
//               PR pronom, ADV adverbe, P préposition, C conjonction,
//               X = on ne pose pas de question sur ce mot (au, du, près de…)
// Une seule phrase permet de fabriquer beaucoup de questions différentes.
// ============================================================================

import { pick, pickN, shuffle, esc, mcqChoices, cap } from '../util.js';

const SENTENCES = [
  '[S Le:D vieux:A forgeron:N] [V frappe:V] [COD le:D fer:N] [CCM avec:P force:N] .',
  '[S La:D reine:N] [V parle:V] [COI à:P ses:D sujets:N] .',
  '[S Les:D archers:N] [V tirent:V] [COD des:D flèches:N] [CCL sur:P la:D cible:N] .',
  '[S Le:D dragon:N] [V dort:V] [CCL dans:P sa:D caverne:N] .',
  '[CCT Ce:D matin:N] , [S le:D jeune:A écuyer:N] [V a:V nettoyé:V] [COD l’:D armure:N] .',
  '[S Le:D roi:N] [V est:V] [ATT très:ADV généreux:A] .',
  '[S La:D princesse:N] [V monte:V] [COD un:D cheval:N blanc:A] .',
  '[S Nous:PR] [V construisons:V] [COD un:D pont-levis:N] .',
  '[S Merlin:NP] [V prépare:V] [COD une:D potion:N magique:A] .',
  '[S Les:D chevaliers:N] [V obéissent:V] [COI au:X roi:N] .',
  '[S Le:D marchand:N] [V vend:V] [COD des:D épices:N] [CCL au:X marché:N] .',
  '[S Les:D musiciens:N] [V jouent:V] [CCM joyeusement:ADV] [CCL dans:P la:D grande:A salle:N] .',
  '[S Le:D chat:N du:X château:N] [V attrape:V] [COD les:D souris:N] .',
  '[S Tu:PR] [V polis:V] [COD ton:D bouclier:N] .',
  '[S Le:D chevalier:N] [V semble:V] [ATT courageux:A] .',
  '[S Les:D paysans:N] [V récoltent:V] [COD le:D blé:N] [CCT en:P été:N] .',
  '[S La:D sorcière:N] [V habite:V] [CCL près:X de:X la:D rivière:N] .',
  '[S Le:D moine:N] [V recopie:V] [COD un:D grimoire:N] [CCM avec:P soin:N] .',
  '[S Un:D hibou:N] [V hulule:V] [CCT pendant:P la:D nuit:N] .',
  '[S Les:D enfants:N] [V écoutent:V] [COD le:D conteur:N] .',
  '[S Le:D cheval:N] [V galope:V] [CCM rapidement:ADV] .',
  '[S Les:D gardes:N] [V surveillent:V] [COD les:D remparts:N] [CCT jour:N et:C nuit:N] .',
  '[S Le:D roi:N] [V pense:V] [COI à:P son:D royaume:N] .',
  '[S Les:D dragons:N] [V volent:V] [CCL vers:P la:D montagne:N] .',
  '[S Le:D bouffon:N] [V raconte:V] [COD une:D histoire:N drôle:A] .',
  '[S Mon:D épée:N] [V brille:V] [CCL au:X soleil:N] .',
  '[S Les:D dames:N] [V dansent:V] [CCM gracieusement:ADV] .',
  '[S Le:D jeune:A page:N] [V apporte:V] [COD le:D repas:N] .',
  '[S Vous:PR] [V traversez:V] [COD la:D forêt:N sombre:A] .',
  '[S Le:D chevalier:N] [V a:V vaincu:V] [COD le:D troll:N] [CCL sur:P le:D pont:N] .',
  '[S La:D licorne:N] [V est:V] [ATT magnifique:A] .',
  '[S Ils:PR] [V ont:V gagné:V] [COD le:D tournoi:N] .',
  '[CCT Demain:ADV] , [S les:D troupes:N] [V partiront:V] [CCL vers:P le:D nord:N] .',
  '[S Les:D lanternes:N] [V éclairent:V] [COD le:D chemin:N] .',
  '[S L’:D aubergiste:N] [V sert:V] [COD une:D soupe:N chaude:A] .',
  '[S Robin:NP] [V vise:V] [COD la:D cible:N] [CCM avec:P adresse:N] .',
  '[S La:D cloche:N de:X l’:X abbaye:N] [V sonne:V] [CCT à:P midi:N] .',
  '[S Les:D écuyers:N] [V deviennent:V] [ATT chevaliers:N] .',
  '[S Je:PR] [V rêve:V] [COI de:P dragons:N] .',
  '[S Le:D héraut:N] [V annonce:V] [COD la:D nouvelle:N] [CCM d’:P une:D voix:N forte:A] .',
  '[S La:D fée:N] [V transforme:V] [COD la:D citrouille:N] .',
  '[S Le:D vent:N] [V souffle:V] [CCM fort:ADV] [CCL sur:P la:D lande:N] .',
  '[S Notre:D armée:N] [V attaquera:V] [CCT à:P l’:D aube:N] .',
  '[S Les:D ménestrels:N] [V chantaient:V] [COD des:D ballades:N] [CCT chaque:D soir:N] .',
  '[S Le:D château:N] [V paraît:V] [ATT immense:A] .',
  '[S Il:PR] [V cherche:V] [COD le:D trésor:N] [CCL sous:P le:D vieux:A chêne:N] .',
  '[S La:D petite:A sorcière:N] [V a:V perdu:V] [COD son:D balai:N] .',
  '[S Le:D cuisinier:N] [V prépare:V] [COD un:D grand:A festin:N] .',
  '[S Elles:PR] [V parlent:V] [COI de:P leur:D voyage:N] .',
  '[S Ces:D tours:N] [V restent:V] [ATT solides:A] .',
  '[S Arthur:NP] [V retire:V] [COD l’:D épée:N] [CCL du:X rocher:N] .',
  '[S Les:D oiseaux:N] [V chantent:V] [CCT au:X printemps:N] .',
  '[S La:D jeune:A reine:N] [V devient:V] [ATT célèbre:A] .',
  '[S Le:D loup:N] [V hurle:V] [CCL dans:P la:D forêt:N] [CCT chaque:D nuit:N] .',
  '[S Nous:PR] [V partageons:V] [COD le:D pain:N] [CCM en:P silence:N] .',
];

const NAT_LABEL = {
  N: 'nom commun', NP: 'nom propre', D: 'déterminant', A: 'adjectif', V: 'verbe',
  PR: 'pronom', ADV: 'adverbe', P: 'préposition', C: 'conjonction',
};
const NAT_PLURAL = {
  N: 'tous les noms communs', D: 'tous les déterminants', A: 'tous les adjectifs', V: 'le verbe',
  PR: 'le pronom', ADV: 'l’adverbe', P: 'les prépositions',
};
const NAT_TIP = {
  N: 'Un nom commun désigne une personne, un animal ou une chose : on peut mettre « le », « la » ou « un » devant.',
  NP: 'Un nom propre désigne une personne ou un lieu précis : il commence par une majuscule.',
  D: 'Le déterminant se place devant le nom et l’annonce : le, la, un, des, mon, ses, ce, chaque…',
  A: 'L’adjectif donne une information sur le nom (comment il est). On peut souvent ajouter « très » devant.',
  V: 'Le verbe exprime une action ou un état, et il change quand on change le temps de la phrase.',
  PR: 'Le pronom remplace un nom : je, tu, il, elle, nous, vous, ils, elles…',
  ADV: 'L’adverbe précise le sens d’un verbe ou d’un adjectif. Il est invariable (vite, très, fort, joyeusement…).',
  P: 'La préposition est un petit mot invariable qui introduit un complément : à, de, dans, sur, avec, pour…',
  C: 'Les conjonctions de coordination relient deux mots ou deux phrases : mais, ou, et, donc, or, ni, car.',
};

const FN_LABEL = {
  S: 'sujet', V: 'verbe', COD: 'complément d’objet direct (COD)', COI: 'complément d’objet indirect (COI)',
  ATT: 'attribut du sujet', CCL: 'complément circonstanciel de lieu', CCT: 'complément circonstanciel de temps',
  CCM: 'complément circonstanciel de manière',
};
const FN_TAP = {
  S: 'Touche tous les mots du <b>groupe sujet</b>.',
  V: 'Touche le <b>verbe conjugué</b> (avec son auxiliaire s’il en a un).',
  COD: 'Touche le <b>complément d’objet direct</b> (COD).',
  COI: 'Touche le <b>complément d’objet indirect</b> (COI).',
  ATT: 'Touche l’<b>attribut du sujet</b>.',
  CCL: 'Touche le <b>complément circonstanciel de lieu</b> (où ?).',
  CCT: 'Touche le <b>complément circonstanciel de temps</b> (quand ?).',
  CCM: 'Touche le <b>complément circonstanciel de manière</b> (comment ?).',
};

// ------------------------------------------------------------- analyse ---
function parse(src) {
  const tokens = [];
  const groups = [];
  let fn = null;
  src.split(/\s+/).forEach((raw) => {
    let w = raw;
    if (w.startsWith('[')) { fn = w.slice(1); groups.push({ fn, idx: [] }); return; }
    const closes = w.endsWith(']');
    if (closes) w = w.slice(0, -1);
    const [t, nat] = w.split(':');
    const tok = { t, nat: nat || null, fn, gi: fn ? groups.length - 1 : -1 };
    if (fn) groups[groups.length - 1].idx.push(tokens.length);
    tokens.push(tok);
    if (closes) fn = null;
  });
  return { tokens, groups };
}

const PARSED = SENTENCES.map(parse);

const isWord = (tok) => !!tok.nat;

/** Recolle les mots en respectant la typographie française. */
export function joinTokens(texts) {
  let out = '';
  texts.forEach((t, i) => {
    if (i === 0) { out = t; return; }
    const prev = texts[i - 1];
    if (/^[.,]$/.test(t)) out += t;
    else if (/^[!?;:]$/.test(t)) out += ' ' + t;
    else if (/[’']$/.test(prev)) out += t;
    else out += ' ' + t;
  });
  return out;
}

const textOf = (s, idx) => joinTokens(idx.map((i) => s.tokens[i].t));
const groupOf = (s, fn) => s.groups.find((g) => g.fn === fn);
const sentenceText = (s, capFirst = true) => {
  const txt = joinTokens(s.tokens.map((t) => t.t));
  return capFirst ? cap(txt) : txt;
};

/** HTML de la phrase avec certains mots surlignés. */
function sentenceHtml(s, hl = []) {
  const parts = s.tokens.map((tok, i) => {
    const t = i === 0 ? cap(tok.t) : tok.t;
    return hl.includes(i) ? `<b class="hl">${esc(t)}</b>` : esc(t);
  });
  return joinTokens(parts);
}

function tapTokens(s) {
  return s.tokens.map((tok, i) => ({ t: i === 0 ? cap(tok.t) : tok.t, tap: isWord(tok) }));
}

// -------------------------------------------------------- générateurs ---
function explainGroup(s, fn) {
  const g = groupOf(s, fn);
  const txt = textOf(s, g.idx);
  const subj = textOf(s, groupOf(s, 'S').idx);
  const verb = textOf(s, groupOf(s, 'V').idx);
  switch (fn) {
    case 'S': return `Qui est-ce qui ${esc(verb)} ? → <b>${esc(cap(txt))}</b>. C’est le sujet : il commande l’accord du verbe.`;
    case 'V': return `Le verbe conjugué est <b>${esc(txt)}</b>. Astuce : si on raconte la phrase hier ou demain, c’est le mot qui change !`;
    case 'COD': return `${esc(cap(subj))} ${esc(verb)} quoi ? / qui ? → <b>${esc(txt)}</b>. Il est relié au verbe sans préposition : c’est un COD.`;
    case 'COI': return `${esc(cap(subj))} ${esc(verb)} à qui ? / de quoi ? → <b>${esc(txt)}</b>. Il commence par une préposition (à, de, au…) : c’est un COI.`;
    case 'ATT': return `Après le verbe d’état « ${esc(verb)} », <b>${esc(txt)}</b> donne une information sur le sujet « ${esc(subj)} » : c’est un attribut du sujet.`;
    case 'CCL': return `Où ? → <b>${esc(txt)}</b>. C’est un complément circonstanciel de lieu : on pourrait le déplacer ou le supprimer.`;
    case 'CCT': return `Quand ? → <b>${esc(txt)}</b>. C’est un complément circonstanciel de temps : on pourrait le déplacer ou le supprimer.`;
    case 'CCM': return `Comment ? → <b>${esc(txt)}</b>. C’est un complément circonstanciel de manière : on pourrait le supprimer.`;
    default: return '';
  }
}

export function genTapGroup({ fns, skill }) {
  const fn = pick(fns);
  const s = pick(PARSED.filter((p) => groupOf(p, fn)));
  return {
    kind: 'tap',
    skill,
    prompt: FN_TAP[fn],
    tokens: tapTokens(s),
    targets: groupOf(s, fn).idx,
    explain: explainGroup(s, fn),
    speak: sentenceText(s),
  };
}

export function genTapNature({ nats, skill }) {
  const nat = pick(nats);
  const s = pick(PARSED.filter((p) => p.tokens.some((t) => t.nat === nat)));
  const targets = s.tokens.map((t, i) => (t.nat === nat ? i : -1)).filter((i) => i >= 0);
  const words = targets.map((i) => `« ${s.tokens[i].t} »`).join(', ');
  return {
    kind: 'tap',
    skill,
    prompt: `Touche <b>${NAT_PLURAL[nat]}</b> de la phrase.`,
    tokens: tapTokens(s),
    targets,
    explain: `${targets.length > 1 ? 'Les réponses étaient' : 'La réponse était'} ${esc(words)}. ${esc(NAT_TIP[nat])}`,
    speak: sentenceText(s),
  };
}

export function genNatureMCQ({ nats, skill }) {
  const s = pick(PARSED.filter((p) => p.tokens.some((t) => nats.includes(t.nat))));
  const cands = s.tokens.map((t, i) => (nats.includes(t.nat) ? i : -1)).filter((i) => i >= 0);
  const i = pick(cands);
  const tok = s.tokens[i];
  const pool = Object.keys(NAT_LABEL).filter((k) => k !== tok.nat && k !== 'NP' && (nats.includes(k) || Math.random() < 0.3));
  const { choices, answer } = mcqChoices(NAT_LABEL[tok.nat], shuffle(pool).map((k) => NAT_LABEL[k]), 4);
  return {
    kind: 'mcq',
    skill,
    prompt: `Quelle est la <b>nature</b> du mot surligné ?`,
    sentence: sentenceHtml(s, [i]),
    choices,
    answer,
    explain: `« ${esc(tok.t)} » est ${['P', 'C'].includes(tok.nat) ? 'une' : 'un'} <b>${NAT_LABEL[tok.nat]}</b>. ${esc(NAT_TIP[tok.nat])}`,
    speak: sentenceText(s),
  };
}

export function genFunctionMCQ({ fns, skill }) {
  const fn = pick(fns);
  const s = pick(PARSED.filter((p) => groupOf(p, fn)));
  const g = groupOf(s, fn);
  const pool = shuffle(fns.filter((f) => f !== fn).concat(['S', 'COD', 'CCL'].filter((f) => f !== fn && !fns.includes(f))));
  const { choices, answer } = mcqChoices(FN_LABEL[fn], pool.map((f) => FN_LABEL[f]), 4);
  return {
    kind: 'mcq',
    skill,
    prompt: 'Quelle est la <b>fonction</b> du groupe surligné ?',
    sentence: sentenceHtml(s, g.idx),
    choices,
    answer,
    explain: explainGroup(s, fn),
    speak: sentenceText(s),
  };
}

/** Remettre les mots dans l'ordre (phrases sans complément circonstanciel). */
export function genOrder({ skill }) {
  const s = pick(PARSED.filter((p) => !p.groups.some((g) => g.fn.startsWith('CC')) && p.tokens.length <= 8));
  const words = s.tokens.filter(isWord).map((t, i) => (i === 0 ? cap(t.t) : t.t));
  const pieces = [];
  // Les élisions (l’, d’) restent collées au mot suivant.
  words.forEach((w) => {
    if (pieces.length && /[’']$/.test(pieces[pieces.length - 1])) pieces[pieces.length - 1] += w;
    else pieces.push(w);
  });
  return {
    kind: 'order',
    skill,
    prompt: 'Remets les mots dans l’ordre pour former une phrase correcte.',
    pieces,
    end: '.',
    explain: `La phrase est : « ${esc(sentenceText(s))} » Une phrase commence par une majuscule et se termine par un point. Dans l’ordre : sujet, verbe, puis compléments.`,
  };
}

// ---------------------------------------------------- trésor à trier ---
const WORDS = {
  N: ['château', 'épée', 'dragon', 'chevalier', 'bouclier', 'princesse', 'forêt', 'cheval', 'couronne', 'donjon', 'trésor', 'sorcière', 'armure', 'village', 'licorne', 'grimoire', 'lance', 'bannière', 'festin', 'royaume'],
  V: ['galope', 'combattent', 'brillait', 'chantera', 'protéger', 'dormaient', 'construisons', 'volera', 'rugit', 'écrivez', 'traverse', 'grandissent'],
  A: ['courageux', 'sombre', 'immense', 'brillante', 'ancien', 'rusé', 'magique', 'féroce', 'doré', 'noble', 'mystérieuse', 'joyeux', 'terrible', 'rapide', 'petite', 'gigantesque'],
  D: ['le', 'la', 'les', 'un', 'une', 'des', 'mon', 'ta', 'ses', 'ce', 'cette', 'leurs', 'trois', 'notre', 'chaque', 'quelques'],
  PR: ['il', 'elle', 'nous', 'vous', 'ils', 'je', 'tu', 'elles'],
  ADV: ['vite', 'toujours', 'très', 'bientôt', 'souvent', 'hier', 'lentement', 'courageusement', 'jamais', 'ici', 'demain', 'trop'],
  P: ['dans', 'sur', 'sous', 'avec', 'pour', 'sans', 'vers', 'chez', 'entre', 'contre'],
  C: ['mais', 'ou', 'et', 'donc', 'or', 'ni', 'car'],
};
const BIN_LABEL = { N: 'Noms', V: 'Verbes', A: 'Adjectifs', D: 'Déterminants', PR: 'Pronoms', ADV: 'Adverbes', P: 'Prépositions', C: 'Conjonctions' };

export function genSort({ bins, skill, n = 8 }) {
  const per = Math.ceil(n / bins.length);
  const items = shuffle(bins.flatMap((b) => pickN(WORDS[b], per).map((t) => ({ t, bin: b })))).slice(0, n);
  return {
    kind: 'sort',
    skill,
    prompt: 'Range chaque mot dans le bon coffre !',
    items,
    bins: bins.map((b) => ({ id: b, label: BIN_LABEL[b] })),
    explain: bins.map((b) => `<b>${BIN_LABEL[b]}</b> : ${esc(items.filter((it) => it.bin === b).map((it) => it.t).join(', '))}`).join('<br>'),
  };
}

// ------------------------------------------------ banques rédigées ---
const TYPES = [
  ['Le dragon dort dans sa caverne.', 0], ['Où se cache le trésor du roi ?', 1], ['Quel magnifique tournoi !', 2],
  ['Ferme vite le pont-levis.', 3], ['Les archers s’entraînent chaque matin.', 0], ['Pourquoi la licorne s’enfuit-elle ?', 1],
  ['Comme ce château est immense !', 2], ['Range ton épée dans son fourreau.', 3], ['As-tu vu le dragon ?', 1],
  ['Écoutez la ballade du ménestrel.', 3], ['Quelle peur j’ai eue !', 2], ['La reine porte une couronne d’or.', 0],
];
const TYPE_LABEL = ['déclarative', 'interrogative', 'exclamative', 'impérative'];
const TYPE_TIP = [
  'Une phrase déclarative raconte ou donne une information. Elle se termine par un point.',
  'Une phrase interrogative pose une question. Elle se termine par un point d’interrogation « ? ».',
  'Une phrase exclamative exprime une émotion (surprise, joie, peur…). Elle se termine par « ! ».',
  'Une phrase impérative donne un ordre ou un conseil. Le verbe est à l’impératif, sans sujet.',
];

export function genType({ skill }) {
  const [txt, k] = pick(TYPES);
  return {
    kind: 'mcq', skill,
    prompt: 'Quel est le <b>type</b> de cette phrase ?',
    sentence: esc(txt),
    choices: TYPE_LABEL.map((l) => `phrase ${l}`),
    answer: k,
    explain: esc(TYPE_TIP[k]),
    speak: txt,
  };
}

const NEGATIONS = [
  ['Le dragon dort.', 'Le dragon ne dort pas.', ['Le dragon dort pas.', 'Le dragon ne pas dort.', 'Le dragon n’dort pas.']],
  ['La reine aime les épinards.', 'La reine n’aime pas les épinards.', ['La reine ne aime pas les épinards.', 'La reine aime pas les épinards.', 'La reine n’aime les épinards.']],
  ['Le chevalier a peur.', 'Le chevalier n’a pas peur.', ['Le chevalier a pas peur.', 'Le chevalier ne a pas peur.', 'Le chevalier n’a peur pas.']],
  ['Nous irons au marché.', 'Nous n’irons pas au marché.', ['Nous irons pas au marché.', 'Nous ne irons pas au marché.', 'Nous n’irons au marché pas.']],
  ['Le troll mange toujours des cailloux.', 'Le troll ne mange jamais de cailloux.', ['Le troll mange jamais des cailloux.', 'Le troll ne mange toujours pas de cailloux.', 'Le troll ne jamais mange de cailloux.']],
  ['Il reste du pain.', 'Il ne reste plus de pain.', ['Il reste plus de pain.', 'Il ne plus reste de pain.', 'Il ne reste plus du pain.']],
  ['La sorcière voit quelque chose.', 'La sorcière ne voit rien.', ['La sorcière voit rien.', 'La sorcière ne voit pas rien.', 'La sorcière ne rien voit.']],
  ['Les gardes ferment la porte.', 'Les gardes ne ferment pas la porte.', ['Les gardes ferment pas la porte.', 'Les gardes ne pas ferment la porte.', 'Les gardes n’ferment pas la porte.']],
];

export function genNegation({ skill }) {
  const [pos, neg, traps] = pick(NEGATIONS);
  const { choices, answer } = mcqChoices(neg, traps, 3);
  return {
    kind: 'mcq', skill,
    prompt: 'Quelle est la bonne <b>phrase négative</b> ?',
    sentence: esc(pos),
    choices, answer,
    explain: `La négation a <b>deux morceaux</b> qui encadrent le verbe conjugué : ne… pas, ne… jamais, ne… plus, ne… rien. Devant une voyelle, « ne » devient « n’ ». → ${esc(neg)}`,
    speak: pos,
  };
}

const COMPLEX = [
  ['Le chevalier enfile son armure.', 1], ['Le dragon rugit et les villageois s’enfuient.', 2],
  ['Quand la cloche sonne, les moines vont prier.', 2], ['La princesse lit un grimoire ancien.', 1],
  ['Le roi entre, s’assoit et parle.', 3], ['Les archers tirent leurs flèches sur la cible.', 1],
  ['Je pense que le trésor est caché ici.', 2], ['Le vent souffle, la pluie tombe, le tonnerre gronde.', 3],
  ['Le petit page apporte le repas du seigneur.', 1], ['Le forgeron frappe le fer pendant que l’apprenti souffle sur le feu.', 2],
];

export function genComplex({ skill }) {
  const [txt, n] = pick(COMPLEX);
  return {
    kind: 'mcq', skill,
    prompt: 'Combien cette phrase contient-elle de <b>verbes conjugués</b> ?',
    sentence: esc(txt),
    choices: ['1 verbe : phrase simple', '2 verbes : phrase complexe', '3 verbes : phrase complexe'],
    answer: n - 1,
    explain: `Une phrase <b>simple</b> contient un seul verbe conjugué. Une phrase <b>complexe</b> en contient plusieurs : chaque verbe conjugué forme une « proposition ». Ici il y en a ${n}.`,
    speak: txt,
  };
}

// --------------------------------------------------------------- étapes ---
const take = (n, fn) => Array.from({ length: n }, fn).filter(Boolean);

export const GRAM_STAGES = [
  {
    title: 'La Salle des Gardes',
    gen: (skill) => [
      ...take(3, () => genTapGroup({ fns: ['V'], skill })),
      ...take(3, () => genTapGroup({ fns: ['S'], skill })),
      ...take(2, () => genType({ skill })),
    ],
  },
  {
    title: 'L’Armurerie',
    gen: (skill) => [
      ...take(3, () => genNatureMCQ({ nats: ['N', 'D', 'A', 'V'], skill })),
      ...take(2, () => genTapNature({ nats: ['A', 'N', 'D'], skill })),
      ...take(1, () => genSort({ bins: ['N', 'V', 'A', 'D'], skill })),
      ...take(2, () => genNatureMCQ({ nats: ['N', 'NP', 'D', 'A', 'V'], skill })),
    ],
  },
  {
    title: 'La Salle du Trône',
    gen: (skill) => [
      ...take(2, () => genNatureMCQ({ nats: ['PR', 'ADV', 'P', 'C'], skill })),
      ...take(1, () => genSort({ bins: ['PR', 'ADV', 'P', 'C'], skill })),
      ...take(2, () => genNegation({ skill })),
      ...take(2, () => genComplex({ skill })),
      ...take(1, () => genTapNature({ nats: ['PR', 'ADV'], skill })),
    ],
  },
  {
    title: 'Le Donjon',
    gen: (skill) => [
      ...take(2, () => genTapGroup({ fns: ['COD'], skill })),
      ...take(2, () => genTapGroup({ fns: ['COI', 'ATT'], skill })),
      ...take(4, () => genFunctionMCQ({ fns: ['S', 'COD', 'COI', 'ATT'], skill })),
    ],
  },
  {
    title: 'Les Remparts',
    gen: (skill) => [
      ...take(3, () => genTapGroup({ fns: ['CCL', 'CCT', 'CCM'], skill })),
      ...take(3, () => genFunctionMCQ({ fns: ['CCL', 'CCT', 'CCM', 'COD'], skill })),
      ...take(2, () => genOrder({ skill })),
    ],
  },
];

export function gramBoss(skill, n = 24) {
  const gens = [
    () => genTapGroup({ fns: ['S', 'V', 'COD', 'COI', 'CCL', 'CCT'], skill }),
    () => genNatureMCQ({ nats: ['N', 'D', 'A', 'V', 'PR', 'ADV', 'P', 'C'], skill }),
    () => genFunctionMCQ({ fns: ['S', 'COD', 'COI', 'ATT', 'CCL', 'CCT', 'CCM'], skill }),
    () => genNegation({ skill }),
    () => genComplex({ skill }),
    () => genType({ skill }),
    () => genOrder({ skill }),
  ];
  return take(n, () => pick(gens)());
}
