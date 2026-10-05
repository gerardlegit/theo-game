// ============================================================================
// LE MONDE — régions, personnages, histoire, leçons du Grimoire, boutique.
// ============================================================================

import { CONJ_STAGES, conjBoss } from './content/conjugaison.js';
import { GRAM_STAGES, gramBoss } from './content/grammaire.js';
import { ORTHO_STAGES, orthoBoss } from './content/orthographe.js';
import { VOCAB_STAGES, vocabBoss } from './content/vocabulaire.js';
import { LECT_STAGES, lectBoss } from './content/lecture.js';

// Petits tableaux de conjugaison pour les leçons.
const table = (rows) => `<table class="conj-table">${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

export const REGIONS = [
  {
    id: 'conj',
    name: 'La Forge des Verbes',
    subject: 'Conjugaison',
    color: '#E0672F',
    bg: 'forge',
    mentor: { name: 'Maître Enclume', emoji: '🧔', badge: '⚒️', role: 'le forgeron' },
    greet: 'Ho, ho ! Bienvenue à la Forge, {heros} ! Ici, on forge les verbes comme des épées : chaque terminaison doit être parfaite. Le dragon Brasegueule, ensorcelé, crache des verbes tordus… Aide-moi à les redresser !',
    boss: {
      name: 'Brasegueule', emoji: '🐉', title: 'le dragon de la forge', hp: 10,
      intro: 'GRRRAAAH ! Le Grand Charabia m’a tout embrouillé ! Je confonds le présent et le futur, je crachais des « ils chantes » !',
      taunts: ['Mes flammes vont faire fondre tes terminaisons !', 'Le passé simple ? Jamais entendu parler !', 'Tu chanteras… ou tu chantais ? Hé hé hé !', 'Mon feu est plus chaud que ton imparfait !'],
      freed: 'Ouf… ma tête est enfin claire. Merci, {heros} ! Je ne cracherai plus que de belles flammes bien conjuguées. Je viendrai garder ton château !',
    },
    stages: CONJ_STAGES,
    bossGen: conjBoss,
    lessons: [
      {
        title: 'Le présent',
        html: `<p>Le présent sert à dire ce qui se passe <b>maintenant</b>.</p>
          ${table([['', '1er groupe (-er)', '2e groupe (-ir)'], ['je', 'chant<b>e</b>', 'fin<b>is</b>'], ['tu', 'chant<b>es</b>', 'fin<b>is</b>'], ['il/elle', 'chant<b>e</b>', 'fin<b>it</b>'], ['nous', 'chant<b>ons</b>', 'fin<b>issons</b>'], ['vous', 'chant<b>ez</b>', 'fin<b>issez</b>'], ['ils/elles', 'chant<b>ent</b>', 'fin<b>issent</b>']])}
          <p><b>Être</b> : je suis, tu es, il est, nous sommes, vous êtes, ils sont.<br><b>Avoir</b> : j’ai, tu as, il a, nous avons, vous avez, ils ont.</p>
          <p><b>Les 3 groupes :</b> 1er groupe = verbes en <b>-er</b> (sauf aller) · 2e groupe = verbes en <b>-ir</b> qui font <b>-issons</b> avec nous · 3e groupe = tous les autres (aller, venir, partir, prendre…).</p>`,
        tip: 'Avec « tu », le verbe se termine presque toujours par un -s. Avec « ils », par -ent… qu’on n’entend pas !',
      },
      {
        title: 'L’imparfait et les verbes irréguliers',
        html: `<p>L’<b>imparfait</b> sert à décrire le passé ou une habitude : « Autrefois, le dragon <b>dormait</b> ».</p>
          <p>Mêmes terminaisons pour <b>tous</b> les verbes : <b>-ais, -ais, -ait, -ions, -iez, -aient</b>.</p>
          <p>Le radical est celui de « nous » au présent : nous <u>finiss</u>ons → je <u>finiss</u>ais ; nous <u>fais</u>ons → je <u>fais</u>ais. Seule exception : être → j’<b>ét</b>ais.</p>
          <p><b>Présent des irréguliers à connaître :</b></p>
          ${table([['aller', 'je vais, nous allons, ils vont'], ['faire', 'je fais, vous faites, ils font'], ['dire', 'je dis, vous dites, ils disent'], ['venir', 'je viens, nous venons, ils viennent'], ['prendre', 'je prends, il prend, ils prennent'], ['pouvoir', 'je peux, il peut, ils peuvent'], ['vouloir', 'je veux, il veut, ils veulent'], ['voir', 'je vois, nous voyons, ils voient']])}`,
        tip: 'À l’imparfait, « nous » et « vous » s’écrivent -ions et -iez : nous chantions, vous chantiez.',
      },
      {
        title: 'Le futur simple',
        html: `<p>Le futur sert à dire ce qui <b>va arriver</b> : « Demain, nous <b>partirons</b> ».</p>
          <p>Terminaisons pour tous les verbes : <b>-ai, -as, -a, -ons, -ez, -ont</b>.</p>
          <p>1er et 2e groupes : on les ajoute à l’<b>infinitif</b> → je chanter<b>ai</b>, tu finir<b>as</b>.</p>
          ${table([['être', 'je serai'], ['avoir', 'j’aurai'], ['aller', 'j’irai'], ['faire', 'je ferai'], ['venir', 'je viendrai'], ['pouvoir', 'je pourrai'], ['voir', 'je verrai'], ['vouloir', 'je voudrai']])}
          <p><b>Trouver l’infinitif</b> : c’est le « nom » du verbe. Pour le trouver, dis « il faut… » : il faut <b>prendre</b>, il faut <b>aller</b>.</p>`,
        tip: 'Au futur, on entend toujours le son [r] juste avant la terminaison : chante-r-ai, fini-r-ons, se-r-ont.',
      },
      {
        title: 'Le passé composé et le plus-que-parfait',
        html: `<p>Le <b>passé composé</b> = auxiliaire <b>avoir</b> ou <b>être</b> au présent + <b>participe passé</b>.</p>
          <p>j’<b>ai</b> chant<b>é</b> · tu <b>as</b> fin<b>i</b> · il <b>a</b> pr<b>is</b> · nous <b>avons</b> v<b>u</b></p>
          <p>Les verbes de mouvement (aller, venir, partir, arriver, entrer, tomber, rester…) prennent <b>être</b>. Le participe s’<b>accorde</b> alors avec le sujet :</p>
          <p>il est parti · elle est parti<b>e</b> · ils sont parti<b>s</b> · elles sont parti<b>es</b></p>
          <p>Le <b>plus-que-parfait</b> = auxiliaire à l’<b>imparfait</b> + participe passé : j’<b>avais</b> chanté, elle <b>était</b> partie. Il raconte une action encore plus ancienne.</p>`,
        tip: 'Avec avoir, pas d’accord avec le sujet : « elles ont chanté ». Avec être, on accorde : « elles sont venues ».',
      },
      {
        title: 'Passé simple, conditionnel et impératif',
        html: `<p>Le <b>passé simple</b> est le temps des contes et des récits :</p>
          ${table([['chanter', 'il chant<b>a</b>', 'ils chant<b>èrent</b>'], ['finir', 'il fin<b>it</b>', 'ils fin<b>irent</b>'], ['être', 'il <b>fut</b>', 'ils <b>furent</b>'], ['avoir', 'il <b>eut</b>', 'ils <b>eurent</b>'], ['faire', 'il <b>fit</b>', 'ils <b>firent</b>'], ['prendre', 'il <b>prit</b>', 'ils <b>prirent</b>'], ['venir', 'il <b>vint</b>', 'ils <b>vinrent</b>'], ['aller', 'il <b>alla</b>', 'ils <b>allèrent</b>']])}
          <p>Le <b>conditionnel présent</b> exprime un souhait ou une condition : radical du futur + terminaisons de l’imparfait → je chanter<b>ais</b>, nous ser<b>ions</b>, ils pourr<b>aient</b>.</p>
          <p>L’<b>impératif</b> donne un ordre, sans sujet, à 3 personnes : Chante ! Chantons ! Chantez ! · Finis ! · Prends ! · Sois ! · Aie !</p>`,
        tip: 'À l’impératif, les verbes en -er n’ont pas de « s » avec tu : « Chante ! », « Range ton épée ! ».',
      },
    ],
  },
  {
    id: 'gram',
    name: 'Le Château des Phrases',
    subject: 'Grammaire',
    color: '#3D6FD6',
    bg: 'castle',
    mentor: { name: 'Dame Syntaxe', emoji: '👸', badge: '📐', role: 'la châtelaine' },
    greet: 'Soyez le bienvenu au Château, {heros} ! Chaque phrase y est construite comme une muraille : sujet, verbe, compléments, chaque pierre a sa place. Mais le Golem Désordre, ensorcelé, mélange toutes les pierres…',
    boss: {
      name: 'le Golem Désordre', emoji: '🗿', title: 'le gardien des murailles', hp: 10,
      intro: 'BOUM… BOUM… Sujet ? Verbe ? COD ? Tout est mélangé dans ma tête de pierre !',
      taunts: ['Je vais écraser tes compléments !', 'Un adjectif ? Un adverbe ? Pour moi, c’est pareil !', 'Mes pierres sont dans le désordre, et tes phrases aussi !', 'Trouve donc le sujet… si tu peux !'],
      freed: 'Mes pierres… sont de nouveau bien rangées. Sujet, verbe, complément… Merci, {heros}. Je serai le plus solide rempart de ton château !',
    },
    stages: GRAM_STAGES,
    bossGen: gramBoss,
    lessons: [
      {
        title: 'Le verbe, le sujet et les types de phrases',
        html: `<p>Le <b>verbe conjugué</b> est le mot qui change quand on change le temps : « Le dragon <b>dort</b> » → « Hier, le dragon <b>dormait</b> ». On peut l’encadrer par <b>ne… pas</b>.</p>
          <p>Le <b>sujet</b> répond à la question <b>« Qui est-ce qui… ? »</b> : Qui est-ce qui dort ? → <b>Le dragon</b>. Ce peut être un nom, un groupe nominal ou un pronom.</p>
          <p><b>4 types de phrases :</b></p>
          <ul><li><b>déclarative</b> : elle raconte (.)</li><li><b>interrogative</b> : elle pose une question (?)</li><li><b>exclamative</b> : elle exprime une émotion (!)</li><li><b>impérative</b> : elle donne un ordre</li></ul>`,
        tip: 'Le sujet peut être très long : « Le vieux chat roux du château » dort. Touche bien tous ses mots !',
      },
      {
        title: 'La nature des mots',
        html: `<p>Chaque mot a une <b>nature</b> (sa « famille » de mots), comme un chevalier a son blason :</p>
          <ul><li><b>Nom commun</b> : château, épée, dragon (on peut mettre « le » ou « un » devant)</li>
          <li><b>Nom propre</b> : Merlin, Arthur, Brocéliande (avec une majuscule)</li>
          <li><b>Déterminant</b> : le, la, un, des, mon, ses, ce, chaque… (devant le nom)</li>
          <li><b>Adjectif</b> : courageux, immense, doré (il décrit le nom)</li>
          <li><b>Verbe</b> : galope, chantera, protéger (action ou état, il se conjugue)</li></ul>`,
        tip: 'Pour reconnaître un adjectif, essaie d’ajouter « très » devant : très courageux ✔ — très château ✘.',
      },
      {
        title: 'Pronoms, petits mots et phrases',
        html: `<ul><li><b>Pronom</b> : il remplace un nom → je, tu, il, elle, nous, vous, ils, elles.</li>
          <li><b>Adverbe</b> : il précise un verbe ou un adjectif, il est invariable → vite, très, souvent, hier, joyeusement.</li>
          <li><b>Préposition</b> : à, de, dans, sur, sous, avec, pour, sans, vers, chez.</li>
          <li><b>Conjonction de coordination</b> : mais, ou, et, donc, or, ni, car.</li></ul>
          <p><b>Forme négative</b> : deux morceaux autour du verbe → ne… pas, ne… jamais, ne… plus, ne… rien.</p>
          <p><b>Phrase simple</b> = 1 verbe conjugué. <b>Phrase complexe</b> = plusieurs verbes conjugués.</p>`,
        tip: 'Pour retenir les conjonctions : « Mais où est donc Ornicar ? » → mais, ou, et, donc, or, ni, car.',
      },
      {
        title: 'COD, COI et attribut du sujet',
        html: `<p>Le <b>COD</b> (complément d’objet direct) répond à <b>« verbe + quoi ? / qui ? »</b>, <b>sans</b> préposition : Le chevalier polit <b>son épée</b>.</p>
          <p>Le <b>COI</b> (complément d’objet indirect) répond à <b>« verbe + à qui ? / de quoi ? »</b>, <b>avec</b> une préposition : La reine parle <b>à ses sujets</b>.</p>
          <p>L’<b>attribut du sujet</b> suit un <b>verbe d’état</b> (être, paraître, sembler, devenir, rester…) et dit comment est le sujet : Le roi est <b>généreux</b>.</p>`,
        tip: 'COD et COI ne peuvent pas être supprimés ni déplacés sans abîmer la phrase.',
      },
      {
        title: 'Les compléments circonstanciels',
        html: `<p>Les <b>compléments circonstanciels</b> donnent des précisions sur les circonstances de l’action :</p>
          <ul><li><b>de lieu</b> : où ? → dans la forêt, sur le pont</li><li><b>de temps</b> : quand ? → à l’aube, chaque soir, demain</li><li><b>de manière</b> : comment ? → avec force, rapidement</li></ul>
          <p>On peut souvent les <b>déplacer</b> ou les <b>supprimer</b> : « <u>À l’aube</u>, l’armée attaquera » = « L’armée attaquera <u>à l’aube</u> ».</p>
          <p><b>Ordre des mots</b> : en général, sujet → verbe → compléments. La phrase commence par une majuscule et finit par un point.</p>`,
        tip: 'Si tu peux enlever le groupe et que la phrase reste correcte, c’est sûrement un complément circonstanciel !',
      },
    ],
  },
  {
    id: 'ortho',
    name: 'Le Marais des Pièges',
    subject: 'Orthographe',
    color: '#2E9C7A',
    bg: 'swamp',
    mentor: { name: 'Gaspard le Passeur', emoji: '🧓', badge: '🛶', role: 'le passeur' },
    greet: 'Chut… avance doucement, {heros}. Dans ce marais, les mots se ressemblent mais ne s’écrivent pas pareil : a ou à, son ou sont… Un seul faux pas et plouf ! La Vouivre ensorcelée y tend ses pièges.',
    boss: {
      name: 'la Vouivre', emoji: '🐍', title: 'la serpente du marais', hp: 10, g: 'f',
      intro: 'Sssss… « a » ou « à » ? « ces » ou « ses » ? Je ssssème la confusion dans tous les mots !',
      taunts: ['Ssssi tu te trompes, tu tombes dans la vase !', 'Les chevals… euh, les chevaux ? Ssss !', 'Ton orthographe va couler !', 'Ssssais-tu vraiment accorder ?'],
      freed: 'Ssss… merci, {heros}. Le brouillard s’est levé. Je garderai les douves de ton château, et gare à ceux qui font des fautes !',
    },
    stages: ORTHO_STAGES,
    bossGen: orthoBoss,
    lessons: [
      {
        title: 'a / à — et / est',
        html: `<p><b>a</b> (sans accent) = verbe avoir → on peut dire <b>avait</b> : Le dragon <b>a</b> faim → avait faim ✔</p>
          <p><b>à</b> (avec accent) = petit mot invariable → on ne peut pas dire « avait » : Il part <b>à</b> la chasse.</p>
          <p><b>est</b> = verbe être → on peut dire <b>était</b> : Le donjon <b>est</b> haut → était haut ✔</p>
          <p><b>et</b> = mot qui relie → on peut dire <b>et puis</b> : le roi <b>et</b> la reine.</p>`,
        tip: 'Pour chaque homophone, essaie la phrase avec le mot de remplacement. Si ça marche, tu as trouvé !',
      },
      {
        title: 'son / sont — on / ont — ou / où',
        html: `<p><b>sont</b> = verbe être → <b>étaient</b> · <b>son</b> = déterminant → <b>mon, ton</b></p>
          <p><b>ont</b> = verbe avoir → <b>avaient</b> · <b>on</b> = pronom → <b>il</b></p>
          <p><b>ou</b> = choix → <b>ou bien</b> · <b>où</b> = lieu ou question (Où vas-tu ?)</p>`,
        tip: '« On » est toujours le sujet d’un verbe : on mange, on joue. « Ont » est toujours le verbe : ils ont.',
      },
      {
        title: 'ces / ses, c’est / s’est, ce / se, la / là / l’a, leur / leurs',
        html: `<p><b>ces</b> = on montre (ces … -là) · <b>ses</b> = à lui, à elle (les siens)</p>
          <p><b>c’est</b> = cela est · <b>s’est</b> = verbe avec « se » (je me suis → il s’est)</p>
          <p><b>ce</b> = devant un nom (ce château-là) · <b>se</b> = devant un verbe (il se cache)</p>
          <p><b>la</b> = devant un nom · <b>là</b> = un lieu (ici) · <b>l’a</b> = l’avait</p>
          <p><b>leur</b> devant un verbe = à eux (invariable) · <b>leurs</b> devant un nom pluriel</p>`,
        tip: '« Je leur donne » : leur est devant le verbe, jamais de s ! « Leurs chevaux » : plusieurs chevaux, donc -s.',
      },
      {
        title: 'Les accords',
        html: `<p><b>Pluriel des noms</b> : en général +s. Mais :</p>
          <ul><li>-eau, -au, -eu → <b>+x</b> : châteaux, feux</li><li>-al → <b>-aux</b> : chevaux (sauf bals, festivals, carnavals…)</li><li>-ou → +s, sauf 7 noms en <b>-oux</b> : bijou, caillou, chou, genou, hibou, joujou, pou</li><li>-ail → +s, sauf travail → travaux, vitrail → vitraux</li></ul>
          <p><b>Adjectif</b> : il s’accorde avec le nom (féminin +e, pluriel +s) : des épées brillant<b>es</b>.</p>
          <p><b>Verbe</b> : il s’accorde avec son sujet. Attention aux pièges : « Les chevaliers du roi arriv<b>ent</b> ».</p>`,
        tip: 'Pour accorder le verbe, cherche bien qui fait l’action : ce n’est pas toujours le mot juste avant !',
      },
      {
        title: '-é ou -er ? Le participe avec être',
        html: `<p>Remplace par un verbe du 3e groupe comme <b>vendre / vendu</b> ou <b>prendre / pris</b> :</p>
          <ul><li>Il va mang<b>er</b> → il va vendre → <b>-er</b> (infinitif)</li><li>Il a mang<b>é</b> → il a vendu → <b>-é</b> (participe passé)</li></ul>
          <p>Après un petit mot comme <b>à, de, pour, sans</b>, ou après un autre verbe, c’est souvent l’infinitif en -er.</p>
          <p><b>Avec être</b>, le participe passé s’accorde avec le sujet : la reine est arrivé<b>e</b>, les chevaliers sont parti<b>s</b>.</p>`,
        tip: '« vendre / vendu » : si tu entends « vendre », écris -er. Si tu entends « vendu », écris -é.',
      },
    ],
  },
  {
    id: 'vocab',
    name: 'La Forêt de Brocéliande',
    subject: 'Vocabulaire',
    color: '#4F9A3A',
    bg: 'forest',
    mentor: { name: 'la Fée Viviane', emoji: '🧚', badge: '✨', role: 'la fée de la forêt' },
    greet: 'Bienvenue dans ma forêt enchantée, {heros}. Ici, chaque arbre porte des mots : des jumeaux qui ont le même sens, des familles aux racines communes… Mais l’Ogre Grignotemots, ensorcelé, dévore le sens des mots !',
    boss: {
      name: 'l’Ogre Grignotemots', emoji: '👹', title: 'le dévoreur de mots', hp: 10,
      intro: 'MIAM ! Je grignote les synonymes, je croque les contraires, j’avale les préfixes ! Il ne restera plus un seul mot dans cette forêt !',
      taunts: ['Courageux, peureux… c’est pareil dans mon ventre !', 'Je vais dévorer ton dictionnaire !', 'Avoir la tête dans les nuages ? Moi, j’ai le ventre dans les mots !', 'Encore faim de vocabulaire !'],
      freed: 'Oh… les mots ont de nouveau du goût et du sens. Merci, {heros} ! Plus jamais je ne mangerai de mots… seulement de la soupe aux légumes. Je viendrai cultiver ton jardin !',
    },
    stages: VOCAB_STAGES,
    bossGen: vocabBoss,
    lessons: [
      {
        title: 'Synonymes et contraires',
        html: `<p>Des <b>synonymes</b> ont presque le même sens : courageux = brave, cheval = destrier, festin = banquet.</p>
          <p>Des <b>contraires</b> (antonymes) ont des sens opposés : entrer ≠ sortir, ami ≠ ennemi, lourd ≠ léger.</p>
          <p>Les synonymes évitent les répétitions et rendent un texte plus riche !</p>`,
        tip: 'Pour vérifier un synonyme, remplace le mot dans la phrase : le sens doit rester le même.',
      },
      {
        title: 'Les familles de mots',
        html: `<p>Une <b>famille de mots</b> regroupe des mots formés à partir d’un même <b>radical</b>, avec un sens commun :</p>
          <p><b>cheval</b> → chevalier, chevaucher, chevalerie · <b>roi</b> → royaume, royal, royauté · <b>terre</b> → terrain, enterrer, souterrain</p>
          <p>Attention aux faux amis : « cheveu » ressemble à « cheval », mais n’a aucun rapport !</p>`,
        tip: 'Un mot de la famille doit avoir un lien de sens, pas seulement des lettres en commun.',
      },
      {
        title: 'Préfixes et suffixes',
        html: `<p>Le <b>préfixe</b> se place <b>avant</b> le radical : <b>re</b>lire (de nouveau), <b>dé</b>couvrir (contraire), <b>im</b>possible, <b>il</b>lisible, <b>ir</b>réel (contraire), <b>pré</b>histoire (avant), <b>sous</b>-marin (en dessous).</p>
          <p>Le <b>suffixe</b> se place <b>après</b> : forger<b>on</b> (métier), fill<b>ette</b> (petit), lav<b>able</b> (qu’on peut), gard<b>ien</b> (personne), rapide<b>ment</b> (adverbe).</p>`,
        tip: 'Devant m, b, p, le préfixe « in- » devient « im- » : impossible, imbuvable, immobile.',
      },
      {
        title: 'Sens propre, sens figuré et expressions',
        html: `<p>Le <b>sens propre</b> est le sens premier, réel : « une pierre » dans un mur.</p>
          <p>Le <b>sens figuré</b> est une image : « un cœur de pierre » = quelqu’un d’insensible.</p>
          <p>Les <b>expressions</b> ne se comprennent pas mot à mot : « prendre ses jambes à son cou » = s’enfuir en courant.</p>
          <p>Un même mot peut avoir <b>plusieurs sens</b> : la <b>tour</b> du château / c’est ton <b>tour</b>.</p>`,
        tip: 'Si la phrase est impossible « en vrai », c’est sûrement le sens figuré !',
      },
      {
        title: 'Champ lexical, dictionnaire et Moyen Âge',
        html: `<p>Un <b>champ lexical</b> regroupe des mots qui parlent du même thème. Château fort : donjon, créneaux, pont-levis, douves, meurtrière.</p>
          <p>Dans le <b>dictionnaire</b>, les mots sont rangés dans l’ordre alphabétique. Si la 1re lettre est la même, on regarde la 2e, puis la 3e : <b>cha</b>teau → <b>che</b>val → <b>chê</b>ne.</p>
          <p><b>Mots du Moyen Âge</b> : un écuyer (au service d’un chevalier), l’adoubement (devenir chevalier), un destrier (cheval de combat), un heaume (casque).</p>`,
        tip: 'Les accents ne comptent pas pour l’ordre alphabétique : « chêne » se range comme « chene ».',
      },
    ],
  },
  {
    id: 'lect',
    name: 'L’Abbaye du Scriptorium',
    subject: 'Lecture',
    color: '#9A5BC7',
    bg: 'abbey',
    mentor: { name: 'Frère Anselme', emoji: '👨‍🦲', badge: '📜', role: 'le moine copiste' },
    greet: 'Paix sur toi, {heros}. Dans notre scriptorium, nous recopions les plus belles histoires du royaume. Mais le Spectre des Pages Blanches, ensorcelé, efface les mots et embrouille le sens des récits. Seul un bon lecteur pourra le délivrer.',
    boss: {
      name: 'le Spectre des Pages Blanches', emoji: '👻', title: 'l’effaceur d’histoires', hp: 10,
      intro: 'Hoooou… J’efface les mots, je mélange les histoires… Qui est « il » ? Qui est « elle » ? Plus personne ne le sait… hoooou !',
      taunts: ['Hoooou… as-tu bien lu ?', 'Je vais effacer la fin de l’histoire !', 'Lire entre les lignes ? Il n’y a plus de lignes ! Hoooou !', 'Tes yeux se fatiguent…'],
      freed: 'Ahhh… les pages se remplissent de nouveau de belles histoires. Merci, {heros}. Je hanterai désormais la bibliothèque de ton château… gentiment !',
    },
    stages: LECT_STAGES,
    bossGen: lectBoss,
    lessons: [
      {
        title: 'Bien lire une phrase',
        html: `<p>Pour comprendre une phrase, cherche <b>qui</b> fait <b>quoi</b>, <b>où</b> et <b>quand</b>.</p>
          <p>Attention aux petits mots qui changent tout : <b>ne… jamais</b> (pas une fois), <b>malgré</b> (même avec), <b>avant de</b>, <b>plus… que</b>, <b>ni… ni…</b> (aucun des deux).</p>
          <p>Lis toujours la question en entier, puis <b>retourne dans le texte</b> pour vérifier ta réponse.</p>`,
        tip: 'La réponse est souvent écrite dans le texte : relis la bonne phrase avant de choisir !',
      },
      {
        title: 'Les mots qui remplacent',
        html: `<p>Pour éviter les répétitions, les auteurs remplacent les noms par des <b>pronoms</b> (il, elle, le, la, lui, leur…) ou d’autres groupes de mots.</p>
          <p>« La reine appela <b>Thibaut</b>. Elle <b>lui</b> confia une lettre. » → <b>lui</b> = Thibaut, <b>Elle</b> = la reine.</p>
          <p>Pour trouver qui est remplacé, cherche <b>juste avant</b> dans le texte.</p>`,
        tip: 'Remplace le pronom par le nom que tu as trouvé : si la phrase a du sens, c’est gagné !',
      },
      {
        title: 'Lire entre les lignes',
        html: `<p>Parfois, l’auteur ne dit pas tout : il donne des <b>indices</b>. C’est à toi de <b>deviner</b> (on dit « faire une inférence »).</p>
          <p>« Ses yeux se remplirent de larmes. » → ce n’est pas écrit, mais on comprend qu’il est <b>triste</b>.</p>
          <p>Pour comprendre un mot inconnu, aide-toi des mots autour : c’est le <b>contexte</b>.</p>`,
        tip: 'Sois un détective : chaque indice compte ! Les gestes et les paroles montrent les sentiments.',
      },
      {
        title: 'Les types de textes',
        html: `<ul><li><b>Le récit</b> raconte une histoire, avec des personnages (souvent au passé simple).</li>
          <li><b>La recette ou la consigne</b> explique comment faire, étape par étape (verbes à l’impératif).</li>
          <li><b>La lettre</b> a un lieu et une date, une formule pour saluer, et une signature à la fin.</li></ul>
          <p>Les <b>mots de l’ordre</b> : d’abord, ensuite, puis, après, enfin.</p>`,
        tip: 'Dans une lettre, celui qui écrit signe à la fin. Celui qui reçoit est nommé au début.',
      },
      {
        title: 'Le grand lecteur',
        html: `<p>Un grand lecteur sait :</p>
          <ul><li>retrouver les <b>informations</b> écrites dans le texte ;</li><li>comprendre les <b>personnages</b> et ce qu’ils ressentent ;</li><li>remettre les <b>événements</b> dans l’ordre ;</li><li>trouver la <b>morale</b> ou un bon <b>titre</b> qui résume l’histoire.</li></ul>`,
        tip: 'Un bon titre résume toute l’histoire, pas seulement un détail.',
      },
    ],
  },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

export const FINAL_BOSS = {
  name: 'Embrouillard', emoji: '🧙‍♂️', title: 'le mage du Grand Charabia', hp: 16,
  intro: 'Ainsi, c’est toi, {heros}, qui as délivré mes gardiens… Mais ici, dans ma tour, je règne sur TOUS les mots ! Le Grand Charabia ne sera jamais brisé !',
  taunts: ['Ma magie mélange tous les temps !', 'Charabia, brouillamini, embrouillamini !', 'Tu ne sauras jamais accorder ce participe !', 'Mes sortilèges sont plus forts que ton Grimoire !', 'Le royaume restera dans le brouillard !'],
};

export const STORY_INTRO = [
  { art: 'kingdom', text: 'Il était une fois le royaume d’<b>Alphabelle</b>, où les mots vivaient en harmonie. Les verbes se conjuguaient sans fausse note, les phrases s’alignaient comme des remparts, et chaque histoire brillait comme un vitrail.' },
  { art: 'mage', text: 'Mais un soir d’orage, le mage <b>Embrouillard</b>, jaloux de cette harmonie, lança un terrible sortilège : <b>le Grand Charabia</b>. En un éclair, tous les mots du royaume se mirent à s’emmêler…' },
  { art: 'guardians', text: 'Les cinq gardiens du royaume furent ensorcelés : un dragon, un golem, une vouivre, un ogre et un spectre. Désormais, ils sèment la confusion dans leurs régions.' },
  { art: 'owl', text: 'Je suis <b>Plume</b>, la chouette savante du roi. Selon la prophétie, seul un jeune héros qui maîtrise la langue pourra délivrer les gardiens… et briser le sortilège.' },
  { art: 'hero', text: 'Et ce héros… c’est <b>toi</b> ! Prends ta plume comme on prend une épée. L’aventure commence !' },
];

export const STORY_END = [
  { art: 'tower', text: 'Dans un éclair de lumière, le bâton d’Embrouillard se brise. Le Grand Charabia se dissipe comme la brume au soleil…' },
  { art: 'mage-free', text: '« Je… je voulais seulement qu’on m’écoute », murmure le vieux mage. « Personne ne comprenait mes grimoires. » {Heros} lui tend la main : « Alors apprends avec nous. Les mots sont plus beaux quand on les partage. »' },
  { art: 'kingdom', text: 'Dans tout Alphabelle, les mots retrouvent leur place. Les cloches sonnent, les bannières claquent au vent, et les gardiens délivrés dansent dans les prés.' },
  { art: 'crown', text: 'Le roi pose sur ta tête la <b>Couronne des Mots</b>. Tu es désormais <b>{gardien} du Royaume</b> ! Mais il reste tant de choses à apprendre… L’aventure continue !' },
];

// Rang selon le nombre d'étoiles gagnées.
export const RANKS = [
  { stars: 0, m: 'Page', f: 'Page' },
  { stars: 6, m: 'Écuyer', f: 'Écuyère' },
  { stars: 18, m: 'Chevalier', f: 'Chevalière' },
  { stars: 33, m: 'Baron', f: 'Baronne' },
  { stars: 48, m: 'Comte', f: 'Comtesse' },
  { stars: 63, m: 'Duc', f: 'Duchesse' },
  { stars: 78, m: 'Prince', f: 'Princesse' },
];

// Boutique du domaine (les bâtiments apparaissent dans le décor du château).
export const SHOP = [
  { id: 'palissade', name: 'Palissade en bois', icon: '🚧', price: 20, desc: 'Une première protection contre les loups.' },
  { id: 'puits', name: 'Puits', icon: '⛲', price: 25, desc: 'De l’eau fraîche pour tout le domaine.' },
  { id: 'jardin', name: 'Jardin des simples', icon: '🌿', price: 30, desc: 'Des herbes pour soigner et cuisiner.' },
  { id: 'tour', name: 'Tour de guet', icon: '🗼', price: 45, desc: 'Pour voir arriver les visiteurs de loin.' },
  { id: 'forge', name: 'Forge', icon: '⚒️', price: 50, desc: 'Pour forger épées et fers à cheval.' },
  { id: 'donjon', name: 'Donjon de pierre', icon: '🏰', price: 80, desc: 'La grande tour, cœur de ton château.' },
  { id: 'bannieres', name: 'Bannières à ton blason', icon: '🚩', price: 35, desc: 'Tes couleurs flottent au vent !' },
  { id: 'ecurie', name: 'Écurie et destrier', icon: '🐴', price: 60, desc: 'Un fier cheval de combat.' },
  { id: 'moulin', name: 'Moulin à vent', icon: '🌾', price: 65, desc: 'Pour moudre le blé du village.' },
  { id: 'muraille', name: 'Muraille crénelée', icon: '🧱', price: 100, desc: 'De hauts remparts avec des créneaux.' },
  { id: 'douves', name: 'Douves et pont-levis', icon: '🌉', price: 90, desc: 'Un fossé d’eau et un pont qui se lève.', needs: 'muraille' },
  { id: 'chapelle', name: 'Chapelle à vitraux', icon: '⛪', price: 85, desc: 'Ses vitraux brillent au soleil.' },
  { id: 'feux', name: 'Feu de joie', icon: '🔥', price: 40, desc: 'Pour danser et chanter le soir.' },
  { id: 'tourmage', name: 'Tour du magicien', icon: '🔮', price: 120, desc: 'Une tour pointue pleine de secrets.' },
  { id: 'dragon', name: 'Dragonneau apprivoisé', icon: '🐲', price: 160, desc: 'Un bébé dragon qui vole au-dessus du château.' },
  { id: 'licorne', name: 'Licorne', icon: '🦄', price: 200, desc: 'La créature la plus rare du royaume.' },
];

// Couleurs héraldiques (avec leur vrai nom : on apprend en jouant !).
export const TINCTURES = [
  { id: 'gueules', name: 'Gueules', color: '#C8102E', hint: 'rouge' },
  { id: 'azur', name: 'Azur', color: '#1F55B3', hint: 'bleu' },
  { id: 'sinople', name: 'Sinople', color: '#2E7D32', hint: 'vert' },
  { id: 'sable', name: 'Sable', color: '#26232B', hint: 'noir' },
  { id: 'pourpre', name: 'Pourpre', color: '#6E2C91', hint: 'violet' },
  { id: 'or', name: 'Or', color: '#E7B416', hint: 'jaune' },
  { id: 'argent', name: 'Argent', color: '#EDEDED', hint: 'blanc' },
];
export const EMBLEMS = ['🦁', '🐉', '🦅', '🌹', '⭐', '⚜️', '🐺', '🦄', '🗝️', '🌙', '🦊', '🐻'];
export const PARTITIONS = [
  { id: 'plein', name: 'Plein' }, { id: 'parti', name: 'Parti' }, { id: 'coupe', name: 'Coupé' }, { id: 'bande', name: 'En bande' },
];
export const AVATARS = ['🤴', '👸', '🧙‍♂️', '🧙‍♀️', '🧝‍♂️', '🧝‍♀️', '🦊', '🐻'];
