// ============================================================================
// Banque de questions — Le Royaume des Mots (CM1)
// difficulty: 1 = facile, 2 = moyen, 3 = difficile
// "passage" est optionnel : utilisé pour les questions de lecture (un petit
// texte affiché au-dessus de la question).
// ============================================================================

const QUESTIONS = {
  grammaire: [
    {
      difficulty: 1,
      question: "Le petit renard traverse la forêt.\n\nQuel est le sujet ?",
      answers: ["Le petit renard", "traverse", "la forêt"],
      correct: 0,
      explanation: "Le sujet est celui qui fait l'action. C'est lui qui « traverse » : le petit renard.",
    },
    {
      difficulty: 1,
      question: "Les enfants jouent dans le jardin.\n\nQuel est le verbe ?",
      answers: ["enfants", "jouent", "jardin"],
      correct: 1,
      explanation: "Le verbe, c'est l'action. Ici, l'action c'est « jouent ».",
    },
    {
      difficulty: 2,
      question: "Les petits dragon traverse la forêt.\n\nQuelle est la bonne phrase ?",
      answers: [
        "Les petits dragons traversent la forêt.",
        "Les petits dragon traverse la forêt.",
        "Les petit dragons traverse la forêt.",
      ],
      correct: 0,
      explanation: "Il y a plusieurs dragons : le nom et le verbe doivent être au pluriel.",
    },
    {
      difficulty: 2,
      question: "Ma sœur et moi lisons un livre.\n\nQuel est le sujet ?",
      answers: ["Ma sœur et moi", "lisons", "un livre"],
      correct: 0,
      explanation: "Le sujet peut contenir plusieurs personnes : ici, « Ma sœur et moi » font l'action ensemble.",
    },
    {
      difficulty: 1,
      question: "La sorcière prépare une potion.\n\nQuel est le déterminant du mot « potion » ?",
      answers: ["une", "prépare", "sorcière"],
      correct: 0,
      explanation: "Le déterminant se place juste avant le nom. Ici, c'est « une » qui accompagne « potion ».",
    },
    {
      difficulty: 1,
      question: "Le grand château brille sous la lune.\n\nQuel est l'adjectif ?",
      answers: ["grand", "château", "brille"],
      correct: 0,
      explanation: "L'adjectif donne une information sur le nom. « grand » décrit le château.",
    },
    {
      difficulty: 2,
      question: "« Quelle aventure extraordinaire ! »\n\nQuel type de phrase est-ce ?",
      answers: ["Une phrase exclamative", "Une phrase interrogative", "Une phrase négative"],
      correct: 0,
      explanation: "Le point d'exclamation « ! » et le ton montrent qu'on exprime une émotion forte : c'est une phrase exclamative.",
    },
    {
      difficulty: 2,
      question: "Le vieux magicien porte un chapeau pointu.\n\nQuel est le groupe nominal sujet ?",
      answers: ["Le vieux magicien", "un chapeau pointu", "porte"],
      correct: 0,
      explanation: "Le groupe nominal sujet est celui qui fait l'action : « Le vieux magicien ».",
    },
    {
      difficulty: 2,
      question: "Les chevaliers arrive au château.\n\nQuelle est la bonne phrase ?",
      answers: [
        "Les chevaliers arrivent au château.",
        "Les chevaliers arrive au château.",
        "Le chevaliers arrivent au château.",
      ],
      correct: 0,
      explanation: "« Les chevaliers » est pluriel, donc le verbe doit se terminer par « -ent » : arrivent.",
    },
    {
      difficulty: 3,
      question: "Quelle phrase est bien construite ?",
      answers: [
        "Le dragon garde précieusement son trésor doré.",
        "Le dragon précieusement garde doré son trésor.",
        "Garde le dragon son trésor doré précieusement.",
      ],
      correct: 0,
      explanation: "Dans une phrase française, l'ordre habituel est : sujet, puis verbe, puis compléments.",
    },
  ],

  conjugaison: [
    {
      difficulty: 1,
      question: "Aujourd'hui, je ___ un livre. (lire, présent)",
      answers: ["lis", "lisent", "lisait"],
      correct: 0,
      explanation: "Au présent, avec « je », le verbe « lire » se conjugue « je lis ».",
    },
    {
      difficulty: 2,
      question: "Hier, nous ___ au château. (aller, imparfait)",
      answers: ["allons", "allions", "irons"],
      correct: 1,
      explanation: "« Hier » indique le passé : avec « nous », l'imparfait du verbe aller est « nous allions ».",
    },
    {
      difficulty: 1,
      question: "Demain, Léo ___ dans le jardin. (jouer, futur)",
      answers: ["joue", "jouait", "jouera"],
      correct: 2,
      explanation: "« Demain » indique le futur : « il jouera ».",
    },
    {
      difficulty: 2,
      question: "Hier, elle ___ un gâteau. (manger, passé composé)",
      answers: ["mange", "a mangé", "mangera"],
      correct: 1,
      explanation: "Le passé composé se forme avec l'auxiliaire avoir ou être + le participe passé : « a mangé ».",
    },
    {
      difficulty: 1,
      question: "Quel est l'infinitif du verbe « parlons » ?",
      answers: ["parler", "parlait", "parlé"],
      correct: 0,
      explanation: "L'infinitif est la forme « de base » du verbe, celle qu'on trouve dans le dictionnaire : parler.",
    },
    {
      difficulty: 2,
      question: "« Vous chantez bien. »\n\nÀ quelle personne est conjugué le verbe ?",
      answers: ["1ère personne du singulier", "2e personne du pluriel", "3e personne du pluriel"],
      correct: 1,
      explanation: "« Vous » correspond à la 2e personne du pluriel.",
    },
    {
      difficulty: 2,
      question: "Aujourd'hui : Le dragon vole au-dessus du château.\n\nComment dire cette phrase pour DEMAIN ?",
      answers: [
        "Le dragon volera au-dessus du château.",
        "Le dragon volait au-dessus du château.",
        "Le dragon vole au-dessus du château.",
      ],
      correct: 0,
      explanation: "Pour parler de demain, on utilise le futur : « il volera ».",
    },
    {
      difficulty: 1,
      question: "Nous ___ contents de te voir. (être, présent)",
      answers: ["sommes", "sont", "êtes"],
      correct: 0,
      explanation: "Avec « nous », le verbe être au présent donne : nous sommes.",
    },
    {
      difficulty: 2,
      question: "Tu ___ bientôt huit ans. (avoir, futur)",
      answers: ["as", "avais", "auras"],
      correct: 2,
      explanation: "« Bientôt » indique le futur : avec « tu », le verbe avoir donne « tu auras ».",
    },
    {
      difficulty: 3,
      question: "Ils ___ partis à l'aventure. (partir, passé composé)",
      answers: ["ont", "sont", "avaient"],
      correct: 1,
      explanation: "Le verbe « partir » se conjugue au passé composé avec l'auxiliaire être : ils sont partis.",
    },
  ],

  orthographe: [
    {
      difficulty: 1,
      question: "Les petite fille jouent.\n\nQuelle phrase est correcte ?",
      answers: [
        "Les petites filles jouent.",
        "Les petite filles jouent.",
        "Les petites fille joue.",
      ],
      correct: 0,
      explanation: "« Les » est pluriel : le déterminant, l'adjectif et le nom doivent tous s'accorder au pluriel.",
    },
    {
      difficulty: 1,
      question: "Le chien ___ dans le jardin. (courir, présent)",
      answers: ["court", "courent", "courir"],
      correct: 0,
      explanation: "« Le chien » est singulier : le verbe courir au présent donne « il court ».",
    },
    {
      difficulty: 1,
      question: "Les enfant jouent.\n\n🐉 Le monstre des fautes a mangé une lettre ! Quelle lettre manque ?",
      answers: ["s", "e", "t"],
      correct: 0,
      explanation: "« Les enfants » est pluriel : il manque le « s » à la fin du mot « enfants ».",
    },
    {
      difficulty: 1,
      question: "Quel est le féminin de « prince » ?",
      answers: ["princesse", "princeuse", "princette"],
      correct: 0,
      explanation: "Le féminin de « prince » est « princesse ».",
    },
    {
      difficulty: 2,
      question: "___ chat dort sur le tapis. (Son / Sont)",
      answers: ["Son", "Sont", "S'on"],
      correct: 0,
      explanation: "« Son » (avec un seul mot) indique la possession : c'est le chat de quelqu'un.",
    },
    {
      difficulty: 1,
      question: "Il ___ content de venir. (et / est)",
      answers: ["et", "est", "es"],
      correct: 1,
      explanation: "« est » est le verbe être (il est content). « et » sert à relier deux mots.",
    },
    {
      difficulty: 2,
      question: "Quel est le pluriel de « cheval » ?",
      answers: ["chevals", "chevaux", "chevales"],
      correct: 1,
      explanation: "Les mots en « -al » font souvent leur pluriel en « -aux » : cheval → chevaux.",
    },
    {
      difficulty: 1,
      question: "Une ___ maison. (grand)",
      answers: ["grand", "grande", "grands"],
      correct: 1,
      explanation: "« maison » est féminin singulier : l'adjectif doit s'accorder « grande ».",
    },
    {
      difficulty: 2,
      question: "Le drago vole dans le ciel.\n\n🐉 Le monstre des fautes a mangé une lettre ! Quelle lettre manque ?",
      answers: ["n", "m", "s"],
      correct: 0,
      explanation: "Le mot correct est « dragon » : il manque la lettre « n ».",
    },
    {
      difficulty: 1,
      question: "Comment écrit-on correctement ce mot ?",
      answers: ["beaucoup", "beaucou", "beaucoups"],
      correct: 0,
      explanation: "Le mot « beaucoup » se termine toujours par « -oup », sans « s ».",
    },
  ],

  vocabulaire: [
    {
      difficulty: 1,
      question: "Le chevalier est courageux.\n\nQue signifie « courageux » ?",
      answers: ["qui n'a pas peur", "qui est très fatigué", "qui parle beaucoup"],
      correct: 0,
      explanation: "« Courageux » signifie qui fait face au danger sans avoir peur.",
    },
    {
      difficulty: 1,
      question: "Quel est le contraire de « grand » ?",
      answers: ["petit", "beau", "rapide"],
      correct: 0,
      explanation: "« Petit » est le contraire de « grand ».",
    },
    {
      difficulty: 2,
      question: "Quel mot appartient à la famille de « terre » ?",
      answers: ["terrain", "mer", "ciel"],
      correct: 0,
      explanation: "« Terrain » vient du mot « terre », comme « terrestre » ou « atterrir ».",
    },
    {
      difficulty: 2,
      question: "Que signifie le préfixe « in- » dans le mot « impossible » ?",
      answers: ["le contraire de", "en plus de", "avant"],
      correct: 0,
      explanation: "Le préfixe « in- » (ou « im- ») signifie « le contraire de » : impossible = pas possible.",
    },
    {
      difficulty: 3,
      question: "« Le chat a une longue queue. » / « Il faut faire la queue devant le magasin. »\n\nQue signifie « queue » dans la 2e phrase ?",
      answers: ["une file d'attente", "la partie arrière d'un animal", "un objet pointu"],
      correct: 0,
      explanation: "Un même mot peut avoir plusieurs sens : ici, « faire la queue » veut dire attendre en file.",
    },
    {
      difficulty: 2,
      question: "Le chevalier brandit son épée étincelante.\n\nQue signifie « brandit » ?",
      answers: ["lève fièrement", "range doucement", "laisse tomber"],
      correct: 0,
      explanation: "« Brandir » signifie lever quelque chose en l'air, souvent pour le montrer avec fierté.",
    },
    {
      difficulty: 2,
      question: "Le dragon est féroce.\n\nQue signifie « féroce » ?",
      answers: ["très agressif et sauvage", "très calme", "très joli"],
      correct: 0,
      explanation: "« Féroce » décrit un animal (ou une personne) très agressif et dangereux.",
    },
    {
      difficulty: 1,
      question: "Quel est le contraire de « rapide » ?",
      answers: ["lent", "fort", "joyeux"],
      correct: 0,
      explanation: "« Lent » est le contraire de « rapide ».",
    },
    {
      difficulty: 2,
      question: "Que signifie le suffixe « -eux » dans le mot « peureux » ?",
      answers: ["qui a la qualité de", "qui n'a pas", "avant"],
      correct: 0,
      explanation: "Le suffixe « -eux » signifie « qui a la qualité de » : peureux = qui a de la peur.",
    },
    {
      difficulty: 2,
      question: "« La forêt était sombre et mystérieuse. »\n\nQuel sentiment cette phrase donne-t-elle ?",
      answers: ["de l'inquiétude", "de la joie", "de l'ennui"],
      correct: 0,
      explanation: "Les mots « sombre » et « mystérieuse » créent une ambiance inquiétante.",
    },
  ],

  lecture: [
    {
      difficulty: 1,
      passage:
        "🌙 LE MYSTÈRE DU MOULIN\n\nMilo avançait doucement vers le vieux moulin. Une lumière brillait derrière la fenêtre. Il entendit soudain un bruit de pas. Son cœur battait très fort. Il décida d'ouvrir la porte...",
      question: "Pourquoi Milo avance-t-il doucement ?",
      answers: ["Parce qu'il est prudent, un peu apeuré", "Parce qu'il est très fatigué", "Parce qu'il joue à un jeu"],
      correct: 0,
      explanation: "Milo entend un bruit et son cœur bat fort : il avance avec prudence car il a un peu peur.",
    },
    {
      difficulty: 1,
      passage:
        "🌙 LE MYSTÈRE DU MOULIN\n\nMilo avançait doucement vers le vieux moulin. Une lumière brillait derrière la fenêtre. Il entendit soudain un bruit de pas. Son cœur battait très fort. Il décida d'ouvrir la porte...",
      question: "Que voit Milo derrière la fenêtre ?",
      answers: ["une lumière", "un dragon", "rien du tout"],
      correct: 0,
      explanation: "Le texte dit : « Une lumière brillait derrière la fenêtre. »",
    },
    {
      difficulty: 2,
      passage:
        "🌙 LE MYSTÈRE DU MOULIN\n\nMilo avançait doucement vers le vieux moulin. Une lumière brillait derrière la fenêtre. Il entendit soudain un bruit de pas. Son cœur battait très fort. Il décida d'ouvrir la porte...",
      question: "Que ressent Milo dans cette histoire ?",
      answers: ["de la peur et de l'inquiétude", "de la colère", "de l'ennui"],
      correct: 0,
      explanation: "« Son cœur battait très fort » montre que Milo est inquiet, un peu effrayé.",
    },
    {
      difficulty: 1,
      passage:
        "🐉 LA FORÊT ENCHANTÉE\n\nLéa et son chien Rex marchaient dans la forêt enchantée. Les arbres semblaient chuchoter des secrets. Soudain, Rex s'arrêta net et se mit à gronder. Devant eux, un petit dragon doré tremblait de froid. Léa comprit qu'il était perdu et l'enveloppa dans son écharpe.",
      question: "Qui accompagne Léa dans la forêt ?",
      answers: ["Rex, son chien", "un dragon", "personne"],
      correct: 0,
      explanation: "Le texte dit : « Léa et son chien Rex marchaient dans la forêt enchantée. »",
    },
    {
      difficulty: 2,
      passage:
        "🐉 LA FORÊT ENCHANTÉE\n\nLéa et son chien Rex marchaient dans la forêt enchantée. Les arbres semblaient chuchoter des secrets. Soudain, Rex s'arrêta net et se mit à gronder. Devant eux, un petit dragon doré tremblait de froid. Léa comprit qu'il était perdu et l'enveloppa dans son écharpe.",
      question: "Pourquoi Rex s'arrête-t-il soudainement ?",
      answers: ["Il a senti la présence du dragon", "Il est fatigué de marcher", "Il veut rentrer à la maison"],
      correct: 0,
      explanation: "Juste après l'arrêt de Rex, le texte révèle qu'un petit dragon se trouve devant eux.",
    },
    {
      difficulty: 1,
      passage:
        "🐉 LA FORÊT ENCHANTÉE\n\nLéa et son chien Rex marchaient dans la forêt enchantée. Les arbres semblaient chuchoter des secrets. Soudain, Rex s'arrêta net et se mit à gronder. Devant eux, un petit dragon doré tremblait de froid. Léa comprit qu'il était perdu et l'enveloppa dans son écharpe.",
      question: "Que fait Léa pour aider le dragon ?",
      answers: ["Elle l'enveloppe dans son écharpe pour le réchauffer", "Elle s'enfuit en courant", "Elle appelle un adulte"],
      correct: 0,
      explanation: "Le texte dit que Léa « l'enveloppa dans son écharpe » car le dragon tremblait de froid.",
    },
  ],
};
