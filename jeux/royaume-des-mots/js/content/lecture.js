// ============================================================================
// L'ABBAYE DU SCRIPTORIUM — compréhension de lecture.
//
// Des petits contes du royaume, avec des questions de plusieurs sortes :
// repérer une information, comprendre qui est « il », deviner ce qui n'est
// pas écrit (inférence), le sens d'un mot, remettre l'histoire dans l'ordre.
// ============================================================================

import { pick, pickN, shuffle, esc, mcqChoices } from '../util.js';

// q : [question, bonne réponse, pièges, explication]
// ou { order: [...étapes dans le bon ordre], why }
const TEXTS = [
  {
    level: 1, title: 'Le pain de Mathilde',
    text: 'Chaque matin, Mathilde se lève avant le soleil. Elle allume le grand four du village et pétrit la pâte. Quand les cloches sonnent, l’odeur du pain chaud remplit les ruelles. Les enfants accourent alors pour acheter une miche dorée.',
    qs: [
      ['Quel est le métier de Mathilde ?', 'boulangère', ['forgeronne', 'bergère'], 'Elle allume le four et pétrit la pâte pour faire du pain : elle est boulangère. Le texte ne le dit pas, mais les indices le montrent !'],
      ['Quand Mathilde se lève-t-elle ?', 'avant le lever du soleil', ['à midi', 'le soir'], 'Le texte dit : « Mathilde se lève avant le soleil ».'],
      ['Pourquoi les enfants accourent-ils ?', 'pour acheter du pain', ['pour sonner les cloches', 'pour allumer le four'], 'Ils accourent « pour acheter une miche dorée ». Une miche, c’est un gros pain rond.'],
      ['Dans « Elle allume le grand four », qui est « Elle » ?', 'Mathilde', ['la cloche', 'l’odeur'], '« Elle » remplace Mathilde, dont on vient de parler.'],
    ],
  },
  {
    level: 1, title: 'Pistache, le chat du château',
    text: 'Pistache est le chat de la cuisine du château. Il est roux, avec une tache blanche sur le nez. Toute la journée, il dort près de la cheminée. Mais la nuit, il chasse les souris dans la cave à provisions. Le cuisinier l’adore !',
    qs: [
      ['À quoi ressemble Pistache ?', 'Il est roux avec une tache blanche sur le nez.', ['Il est tout noir.', 'Il est gris avec des rayures.'], 'Le texte dit : « Il est roux, avec une tache blanche sur le nez ».'],
      ['Que fait Pistache pendant la nuit ?', 'Il chasse les souris.', ['Il dort près de la cheminée.', 'Il aide le cuisinier.'], 'La nuit, « il chasse les souris dans la cave à provisions ».'],
      ['À ton avis, pourquoi le cuisinier adore-t-il Pistache ?', 'Parce qu’il protège les provisions des souris.', ['Parce qu’il est roux.', 'Parce qu’il dort beaucoup.'], 'Ce n’est pas écrit, il faut le deviner : en chassant les souris, Pistache protège la nourriture du cuisinier.'],
      ['Dans « Le cuisinier l’adore », que remplace « l’ » ?', 'Pistache', ['la cave', 'le nez'], '« l’ » remplace Pistache : le cuisinier adore le chat.'],
    ],
  },
  {
    level: 2, title: 'Le message de la reine',
    text: 'La reine Aliénor appela son messager, Thibaut. Elle lui confia une lettre scellée de cire rouge. « Porte-la au seigneur du château voisin avant la nuit », lui dit-elle. Thibaut sauta sur son cheval et partit au galop. Il traversa la rivière, puis la forêt, et arriva juste au coucher du soleil.',
    qs: [
      ['Qui est Thibaut ?', 'le messager de la reine', ['le seigneur voisin', 'le fils de la reine'], 'Le texte dit : « La reine Aliénor appela son messager, Thibaut ».'],
      ['Dans « lui dit-elle », qui parle ?', 'la reine Aliénor', ['Thibaut', 'le seigneur voisin'], '« elle » remplace la reine Aliénor : c’est elle qui donne l’ordre.'],
      ['Que veut dire « Porte-la » ? « la » remplace…', 'la lettre', ['la reine', 'la rivière'], '« la » remplace la lettre scellée : « Porte la lettre ».'],
      { order: ['La reine confie une lettre à Thibaut.', 'Thibaut part au galop.', 'Il traverse la rivière.', 'Il traverse la forêt.', 'Il arrive au coucher du soleil.'], why: 'Les mots « puis » et « et » montrent l’ordre du voyage : la rivière, puis la forêt, puis l’arrivée.' },
      ['Thibaut a-t-il réussi sa mission à temps ?', 'Oui, il est arrivé juste avant la nuit.', ['Non, il est arrivé le lendemain.', 'Non, il s’est perdu dans la forêt.'], 'Il devait arriver « avant la nuit » et il arrive « au coucher du soleil » : juste à temps !'],
    ],
  },
  {
    level: 2, title: 'Le dragon enrhumé',
    text: 'Dans la montagne vivait un dragon nommé Fumerolle. Un hiver, il attrapa un terrible rhume. Chaque fois qu’il éternuait, des flammes jaillissaient de ses naseaux et brûlaient les sapins. Les villageois, inquiets, montèrent le voir avec une marmite de soupe au miel. Fumerolle la but d’un trait et se sentit aussitôt mieux. Depuis ce jour, il veille sur le village.',
    qs: [
      ['Pourquoi les sapins brûlaient-ils ?', 'Fumerolle éternuait des flammes.', ['Les villageois faisaient un feu.', 'La foudre était tombée.'], '« Chaque fois qu’il éternuait, des flammes jaillissaient de ses naseaux et brûlaient les sapins. »'],
      ['Comment se sentaient les villageois au début ?', 'inquiets', ['joyeux', 'en colère'], 'Le texte dit : « Les villageois, inquiets, montèrent le voir ».'],
      ['Que veut dire « d’un trait » ?', 'en une seule fois, sans s’arrêter', ['très lentement', 'avec une paille'], 'Boire « d’un trait », c’est boire tout d’un coup, sans s’arrêter.'],
      ['Pourquoi Fumerolle veille-t-il sur le village depuis ce jour ?', 'pour remercier les villageois de l’avoir soigné', ['parce qu’il a encore faim', 'parce que le roi l’a ordonné'], 'Ce n’est pas écrit : il faut le deviner. Les villageois l’ont aidé, alors il les protège en retour.'],
      ['Quel autre titre irait bien à cette histoire ?', 'Une soupe qui sauve un village', ['Le dragon qui mangeait les chevaliers', 'La tempête de neige'], 'Un bon titre résume l’histoire : grâce à la soupe, le dragon guérit et le village est protégé.'],
    ],
  },
  {
    level: 3, title: 'L’apprenti copiste',
    text: 'Au monastère, le jeune Benoît apprenait à copier les livres. Sa plume grattait le parchemin pendant des heures. Un jour, il renversa son encrier sur une page presque terminée. Ses yeux se remplirent de larmes. Frère Anselme s’approcha, regarda la tache et sourit : « Transforme-la en dragon ! » Benoît prit son pinceau et, de la tache noire, fit naître un magnifique dragon enluminé.',
    qs: [
      ['Que ressent Benoît quand il renverse l’encrier ?', 'Il est très triste.', ['Il est en colère contre Anselme.', 'Il trouve cela drôle.'], '« Ses yeux se remplirent de larmes » : cet indice montre qu’il est très triste.'],
      ['Comment réagit Frère Anselme ?', 'Il sourit et lui donne une idée.', ['Il le punit sévèrement.', 'Il déchire la page.'], 'Anselme « sourit » et propose de transformer la tache en dragon.'],
      ['Dans « Transforme-la en dragon », que remplace « la » ?', 'la tache d’encre', ['la page', 'la plume'], 'Anselme regarde la tache et dit : transforme la tache en dragon.'],
      ['Que veut dire « enluminé » ?', 'décoré de couleurs et de dorures', ['effacé avec soin', 'éclairé par une bougie'], 'Les moines « enluminaient » les livres : ils les décoraient de belles couleurs et d’or.'],
      ['Quelle leçon peut-on retenir de cette histoire ?', 'Une erreur peut devenir une bonne idée.', ['Il ne faut jamais écrire à la plume.', 'Les dragons aiment l’encre.'], 'Grâce à Anselme, la tache (l’erreur) devient un magnifique dragon !'],
    ],
  },
  {
    level: 3, title: 'Le chevalier inconnu',
    text: 'Le jour du grand tournoi, un chevalier inconnu entra dans l’arène. Son armure était cabossée et son cheval boitait un peu. Les spectateurs se moquèrent de lui. Pourtant, il renversa trois adversaires d’affilée. Quand il ôta son heaume, la foule découvrit le visage de Guillemette, la fille du forgeron. Le roi se leva et l’applaudit le premier.',
    qs: [
      ['Pourquoi les spectateurs se moquent-ils au début ?', 'Son armure est abîmée et son cheval boite.', ['Il tombe de cheval.', 'Il arrive en retard.'], '« Son armure était cabossée et son cheval boitait » : il n’a pas l’air d’un grand champion.'],
      ['Qui était le chevalier inconnu ?', 'Guillemette, la fille du forgeron', ['le fils du roi', 'le forgeron lui-même'], 'Quand le heaume est retiré, on découvre « le visage de Guillemette, la fille du forgeron ».'],
      ['Que veut dire « d’affilée » ?', 'l’un après l’autre, sans s’arrêter', ['avec un fil', 'difficilement'], '« Trois adversaires d’affilée » : trois, l’un après l’autre, sans perdre.'],
      ['Que montre la réaction du roi ?', 'Il admire le courage de Guillemette.', ['Il est fâché qu’elle ait gagné.', 'Il ne la reconnaît pas.'], 'Le roi « se leva et l’applaudit le premier » : il est admiratif.'],
      ['Que nous apprend cette histoire ?', 'Il ne faut pas juger quelqu’un sur son apparence.', ['Il faut toujours avoir une armure neuve.', 'Les forgerons ne font pas de tournois.'], 'Les spectateurs se sont moqués à cause de l’apparence… et ils se sont trompés !'],
    ],
  },
  {
    level: 4, title: 'La potion de courage',
    text: 'Pour préparer la potion de courage, d’abord, fais chauffer un chaudron d’eau de source. Ensuite, ajoute trois plumes de griffon et une pincée de poudre d’étoile. Puis remue sept fois dans le sens des aiguilles d’une horloge. Laisse refroidir jusqu’à ce que la potion devienne dorée. Enfin, bois-la d’un seul coup avant la bataille !',
    qs: [
      { order: ['Faire chauffer l’eau de source.', 'Ajouter les plumes et la poudre d’étoile.', 'Remuer sept fois.', 'Laisser refroidir.', 'Boire la potion.'], why: 'Les mots « d’abord, ensuite, puis, enfin » indiquent l’ordre des étapes.' },
      ['Combien de plumes de griffon faut-il ?', 'trois', ['sept', 'une pincée'], '« Ajoute trois plumes de griffon ». Attention, « sept », c’est le nombre de tours de cuillère !'],
      ['Comment sait-on que la potion est prête ?', 'Elle devient dorée.', ['Elle se met à bouillir.', 'Elle sent le miel.'], '« Laisse refroidir jusqu’à ce que la potion devienne dorée. »'],
      ['Quel genre de texte est-ce ?', 'une recette (un texte qui explique comment faire)', ['une lettre', 'un poème'], 'Le texte donne des étapes dans l’ordre, avec des verbes à l’impératif : c’est une recette.'],
      ['Quel mot annonce la dernière étape ?', 'Enfin', ['Ensuite', 'D’abord'], '« Enfin » annonce toujours la dernière étape.'],
    ],
  },
  {
    level: 4, title: 'La lettre d’Arthur',
    text: 'Château de Montfort, le 3 mai.\nChère cousine Isabeau,\nJe suis enfin écuyer ! Chaque matin, je soigne les chevaux et je fais briller l’armure de messire Gauvain. Le soir, il m’apprend à manier l’épée. J’ai encore reçu un coup sur les doigts aujourd’hui, mais je progresse. Viendras-tu au tournoi de la Saint-Jean ?\nTon cousin qui t’embrasse,\nArthur',
    qs: [
      ['Qui a écrit cette lettre ?', 'Arthur', ['Isabeau', 'messire Gauvain'], 'La signature, à la fin d’une lettre, indique qui l’a écrite : Arthur.'],
      ['À qui la lettre est-elle adressée ?', 'à sa cousine Isabeau', ['à messire Gauvain', 'au roi'], 'Au début : « Chère cousine Isabeau ».'],
      ['Que fait Arthur chaque matin ?', 'Il soigne les chevaux et fait briller une armure.', ['Il apprend à manier l’épée.', 'Il écrit des lettres.'], '« Chaque matin, je soigne les chevaux et je fais briller l’armure ». L’épée, c’est le soir !'],
      ['Qui est messire Gauvain ?', 'le chevalier qu’Arthur sert', ['le cousin d’Arthur', 'un cheval'], 'Arthur est écuyer : il est au service d’un chevalier, messire Gauvain.'],
      ['Arthur est-il découragé ?', 'Non, il dit qu’il progresse.', ['Oui, il veut rentrer chez lui.', 'Oui, il a peur des chevaux.'], 'Malgré le coup sur les doigts, il écrit « mais je progresse » : il garde le moral.'],
    ],
  },
  {
    level: 5, title: 'L’énigme du troll',
    text: 'Un troll gardait le seul pont qui menait au marché. Pour passer, chaque voyageur devait répondre à une énigme. Ceux qui se trompaient devaient faire un long détour par la montagne. Un matin, une petite bergère nommée Jeanne arriva avec ses moutons. « Qu’est-ce qui a des dents mais ne mord jamais ? » grogna le troll. Jeanne réfléchit, puis sourit : « Un peigne ! » Le troll, stupéfait, éclata de rire. Il avait enfin trouvé quelqu’un d’aussi malin que lui. Depuis, Jeanne et le troll échangent des énigmes chaque jeudi.',
    qs: [
      ['Que se passe-t-il si un voyageur se trompe ?', 'Il doit faire un long détour par la montagne.', ['Le troll le mange.', 'Il doit payer une pièce d’or.'], '« Ceux qui se trompaient devaient faire un long détour par la montagne. »'],
      ['Quelle est la réponse à l’énigme ?', 'un peigne', ['un loup', 'une scie'], 'Un peigne a des « dents »… mais il ne mord pas ! Jeanne répond « Un peigne ! ».'],
      ['Que veut dire « stupéfait » ?', 'très surpris', ['très fâché', 'très fatigué'], 'Le troll ne s’attendait pas à une bonne réponse : il est très surpris, stupéfait.'],
      ['Pourquoi le troll éclate-t-il de rire ?', 'Il est content d’avoir trouvé quelqu’un d’aussi malin que lui.', ['Il se moque de Jeanne.', 'Les moutons le chatouillent.'], '« Il avait enfin trouvé quelqu’un d’aussi malin que lui » : il est heureux.'],
      { order: ['Jeanne arrive au pont avec ses moutons.', 'Le troll pose son énigme.', 'Jeanne réfléchit.', 'Jeanne répond « Un peigne ! ».', 'Le troll éclate de rire.'], why: 'On suit l’ordre du récit : l’arrivée, la question, la réflexion, la réponse, puis la réaction du troll.' },
    ],
  },
  {
    level: 5, title: 'La nuit des étoiles filantes',
    text: 'Cette nuit-là, Aélis ne parvenait pas à dormir. Elle grimpa en silence l’escalier de la plus haute tour. Là-haut, le vieil astronome Barnabé observait le ciel. « Regarde, petite, souffla-t-il, les étoiles filantes de la Saint-Laurent ! » Des dizaines de traits lumineux traversaient la nuit. Aélis fit un vœu, mais elle refusa de le dire : un vœu raconté ne se réalise jamais, disait sa grand-mère.',
    qs: [
      ['Pourquoi Aélis monte-t-elle dans la tour ?', 'Elle n’arrive pas à dormir.', ['Barnabé l’a appelée.', 'Elle cherche sa grand-mère.'], '« Aélis ne parvenait pas à dormir » : c’est pour cela qu’elle se promène la nuit.'],
      ['Qui est Barnabé ?', 'un vieil astronome qui observe le ciel', ['le grand-père d’Aélis', 'un garde de la tour'], 'Le texte dit : « le vieil astronome Barnabé observait le ciel ».'],
      ['Que veut dire « souffla-t-il » ici ?', 'il dit à voix basse', ['il souffle une bougie', 'il est essoufflé'], 'Ici, « souffler » veut dire parler tout doucement, pour ne pas faire de bruit la nuit.'],
      ['Pourquoi Aélis garde-t-elle son vœu secret ?', 'Sa grand-mère disait qu’un vœu raconté ne se réalise pas.', ['Barnabé le lui a interdit.', 'Elle a oublié son vœu.'], 'La fin du texte l’explique : « un vœu raconté ne se réalise jamais, disait sa grand-mère ».'],
      ['Où se passe la scène principale ?', 'en haut de la plus haute tour', ['dans la chambre d’Aélis', 'dans la forêt'], 'Aélis grimpe « l’escalier de la plus haute tour », et Barnabé est « là-haut ».'],
    ],
  },
];

// Phrases à comprendre : [phrase, question, bonne réponse, pièges, explication]
const SENTENCES = [
  ['Le page apporta le bouclier au chevalier.', 'Qui a le bouclier à la fin ?', 'le chevalier', ['le page', 'le roi'], 'Le page « apporta le bouclier au chevalier » : c’est le chevalier qui le reçoit.'],
  ['Avant de partir, Hugo ferma la porte de l’écurie.', 'Qu’a fait Hugo en premier ?', 'Il a fermé la porte.', ['Il est parti.', 'Il a ouvert l’écurie.'], '« Avant de partir » : il ferme d’abord la porte, puis il part.'],
  ['Le dragon n’a jamais mangé de chevalier.', 'Que peut-on dire ?', 'Le dragon n’a mangé aucun chevalier.', ['Le dragon mange souvent des chevaliers.', 'Le dragon a mangé un seul chevalier.'], '« ne… jamais » veut dire « pas une seule fois ».'],
  ['Malgré la pluie, le tournoi a eu lieu.', 'Que s’est-il passé ?', 'Il pleuvait, mais le tournoi a quand même eu lieu.', ['Le tournoi a été annulé à cause de la pluie.', 'Il faisait très beau pour le tournoi.'], '« Malgré » veut dire « même s’il y avait » : la pluie n’a pas empêché le tournoi.'],
  ['La princesse est plus grande que son frère.', 'Qui est le plus petit ?', 'son frère', ['la princesse', 'ils sont pareils'], 'Si la princesse est plus grande, son frère est plus petit.'],
  ['Le marchand vendit son âne pour acheter une charrette.', 'Que possède le marchand à la fin ?', 'une charrette', ['un âne', 'un âne et une charrette'], 'Il a vendu l’âne, puis acheté la charrette : il lui reste la charrette.'],
  ['Si tu nourris le dragon, il te suivra partout.', 'Que faut-il faire pour que le dragon te suive ?', 'le nourrir', ['le suivre', 'le chasser'], '« Si tu nourris le dragon » est la condition : il faut d’abord le nourrir.'],
  ['Ni le roi ni la reine n’assistaient au banquet.', 'Qui était au banquet ?', 'ni le roi ni la reine', ['le roi seulement', 'le roi et la reine'], '« Ni… ni… » veut dire qu’aucun des deux n’était là.'],
  ['Le forgeron, que tout le monde craignait, était en réalité très doux.', 'Comment est vraiment le forgeron ?', 'très doux', ['méchant', 'effrayé'], '« en réalité très doux » : les gens avaient peur de lui, mais à tort.'],
  ['Le hibou dort le jour et chasse la nuit.', 'Quand le hibou chasse-t-il ?', 'la nuit', ['le jour', 'le matin'], 'Le texte dit « chasse la nuit ».'],
  ['Le roi a trois filles ; la plus jeune s’appelle Blanche.', 'Qui est Blanche ?', 'la plus jeune fille du roi', ['la reine', 'la plus âgée des filles'], '« la plus jeune s’appelle Blanche » : Blanche est la cadette des trois filles.'],
  ['Le chevalier a cassé sa lance, alors il a emprunté celle de son écuyer.', 'À qui appartient la lance qu’il utilise ?', 'à son écuyer', ['au chevalier', 'au roi'], '« celle de son écuyer » = la lance de son écuyer.'],
];

function qFromText(t, q) {
  const passage = { title: t.title, text: t.text };
  if (q.order) {
    return {
      kind: 'order', passage, vertical: true,
      prompt: 'Remets les événements dans l’<b>ordre de l’histoire</b>.',
      pieces: q.order,
      explain: esc(q.why),
    };
  }
  const [question, good, traps, why] = q;
  const { choices, answer } = mcqChoices(good, traps, 3);
  return {
    kind: 'mcq', passage,
    prompt: esc(question),
    choices, answer,
    explain: esc(why),
    speak: question,
  };
}

export function genText({ levels, skill, max = 5 }) {
  const t = pick(TEXTS.filter((x) => levels.includes(x.level)));
  return t.qs.slice(0, max).map((q) => ({ ...qFromText(t, q), skill }));
}

export function genSentence({ skill }) {
  const [s, q, good, traps, why] = pick(SENTENCES);
  const { choices, answer } = mcqChoices(good, traps, 3);
  return {
    kind: 'mcq', skill,
    prompt: esc(q),
    sentence: `« ${esc(s)} »`,
    choices, answer,
    explain: esc(why),
    speak: `${s} ${q}`,
  };
}

// --------------------------------------------------------------- étapes ---
const take = (n, fn) => Array.from({ length: n }, fn).filter(Boolean);

// Une étape = un conte (ses questions dans l'ordre) + quelques phrases à comprendre.
function stage(levels, sentences) {
  return (skill) => [...genText({ levels, skill }), ...take(sentences, () => genSentence({ skill }))];
}

export const LECT_STAGES = [
  { title: 'Le Cloître des Mots', gen: (skill) => [...take(4, () => genSentence({ skill })), ...genText({ levels: [1], skill, max: 4 })] },
  { title: 'La Salle des Messagers', gen: stage([2], 3) },
  { title: 'Le Jardin des Secrets', gen: stage([3], 3) },
  { title: 'La Bibliothèque', gen: stage([4], 3) },
  { title: 'La Tour des Grimoires', gen: stage([5], 3) },
];

export function lectBoss(skill, n = 24) {
  const out = [];
  shuffle(TEXTS).forEach((t) => {
    pickN(t.qs, 2).forEach((q) => out.push({ ...qFromText(t, q), skill }));
  });
  take(6, () => genSentence({ skill })).forEach((q) => out.splice(Math.floor(Math.random() * out.length), 0, q));
  return out.slice(0, n);
}
