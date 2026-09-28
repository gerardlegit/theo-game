// ============================================================================
// Les trois immeubles : un par niveau, 10 étages chacun, un thème parisien
// par étage. Chaque entrée : [anglais, français, emoji facultatif].
// À chaque partie, 5 entrées sont tirées au hasard par étage ; les fausses
// propositions viennent du même étage.
//   Étages impairs : le mot anglais est montré → trouver le français.
//   Étages pairs   : le mot français est montré → trouver l'anglais.
// ============================================================================

export const LEVELS = [
  {
    id: 'debutant',
    name: 'Débutant',
    stars: 1,
    blurb: 'Des mots tout simples',
    shop: 'Boulangerie',
    floors: [
      { theme: 'À la boulangerie', emoji: '🥖', words: [
        ['bread', 'pain', '🍞'], ['cake', 'gâteau', '🎂'], ['butter', 'beurre', '🧈'],
        ['flour', 'farine', '🌾'], ['sugar', 'sucre', '🍬'], ['egg', 'œuf', '🥚'],
        ['milk', 'lait', '🥛'], ['jam', 'confiture', '🍓'], ['honey', 'miel', '🍯'],
      ] },
      { theme: 'Au café', emoji: '☕', words: [
        ['coffee', 'café', '☕'], ['tea', 'thé', '🍵'], ['cup', 'tasse', '☕'],
        ['water', 'eau', '💧'], ['glass', 'verre', '🥃'], ['chair', 'chaise', '🪑'],
        ['waiter', 'serveur', '🤵'], ['spoon', 'cuillère', '🥄'], ['juice', 'jus', '🧃'],
      ] },
      { theme: 'Au marché', emoji: '🧺', words: [
        ['apple', 'pomme', '🍎'], ['pear', 'poire', '🍐'], ['cheese', 'fromage', '🧀'],
        ['fish', 'poisson', '🐟'], ['strawberry', 'fraise', '🍓'], ['carrot', 'carotte', '🥕'],
        ['flower', 'fleur', '🌷'], ['basket', 'panier', '🧺'], ['grapes', 'raisin', '🍇'],
      ] },
      { theme: 'En ville', emoji: '🗼', words: [
        ['street', 'rue', '🛣️'], ['bridge', 'pont', '🌉'], ['church', 'église', '⛪'],
        ['river', 'rivière', '🏞️'], ['tree', 'arbre', '🌳'], ['car', 'voiture', '🚗'],
        ['bike', 'vélo', '🚲'], ['shop', 'magasin', '🏪'], ['square', 'place', '⛲'],
      ] },
      { theme: 'À la maison', emoji: '🏠', words: [
        ['door', 'porte', '🚪'], ['key', 'clé', '🔑'], ['bed', 'lit', '🛏️'],
        ['kitchen', 'cuisine', '🍳'], ['roof', 'toit', '🏠'], ['clock', 'horloge', '🕰️'],
        ['sofa', 'canapé', '🛋️'], ['bath', 'baignoire', '🛁'], ['candle', 'bougie', '🕯️'],
      ] },
      { theme: 'Les couleurs', emoji: '🎨', words: [
        ['red', 'rouge', '🔴'], ['blue', 'bleu', '🔵'], ['green', 'vert', '🟢'],
        ['yellow', 'jaune', '🟡'], ['pink', 'rose', '🌸'], ['black', 'noir', '⚫'],
        ['white', 'blanc', '⚪'], ['purple', 'violet', '🟣'], ['brown', 'marron', '🟤'],
      ] },
      { theme: 'Les vêtements', emoji: '👗', words: [
        ['hat', 'chapeau', '🎩'], ['coat', 'manteau', '🧥'], ['shoes', 'chaussures', '👞'],
        ['dress', 'robe', '👗'], ['scarf', 'écharpe', '🧣'], ['shirt', 'chemise', '👔'],
        ['gloves', 'gants', '🧤'], ['trousers', 'pantalon', '👖'], ['socks', 'chaussettes', '🧦'],
      ] },
      { theme: 'Au jardin du Luxembourg', emoji: '🌳', words: [
        ['dog', 'chien', '🐕'], ['cat', 'chat', '🐈'], ['bird', 'oiseau', '🐦'],
        ['duck', 'canard', '🦆'], ['sun', 'soleil', '☀️'], ['grass', 'herbe', '🌱'],
        ['bench', 'banc', '🪑'], ['ball', 'ballon', '⚽'], ['cloud', 'nuage', '☁️'],
      ] },
      { theme: 'La famille', emoji: '👪', words: [
        ['mother', 'mère', '👩'], ['father', 'père', '👨'], ['sister', 'sœur', '👧'],
        ['brother', 'frère', '👦'], ['grandmother', 'grand-mère', '👵'], ['grandfather', 'grand-père', '👴'],
        ['friend', 'ami', '🤝'], ['husband', 'mari', '🤵'], ['baby', 'bébé', '👶'],
      ] },
      { theme: 'Les jours de la semaine', emoji: '📅', words: [
        ['Monday', 'lundi'], ['Tuesday', 'mardi'], ['Wednesday', 'mercredi'],
        ['Thursday', 'jeudi'], ['Friday', 'vendredi'], ['Saturday', 'samedi'],
        ['Sunday', 'dimanche'], ['today', "aujourd'hui"], ['tomorrow', 'demain'],
      ] },
    ],
  },

  {
    id: 'intermediaire',
    name: 'Intermédiaire',
    stars: 2,
    blurb: 'Des phrases utiles',
    shop: 'Café',
    floors: [
      { theme: 'À la boulangerie', emoji: '🥐', words: [
        ['a baguette, please', "une baguette, s'il vous plaît"], ['how much is it?', "c'est combien ?"],
        ['a slice of cake', 'une part de gâteau'], ['still warm', 'encore chaud'],
        ['the change', 'la monnaie'], ['wholemeal bread', 'du pain complet'],
        ["I'll take this one", 'je prends celui-ci'], ['freshly baked', 'tout juste sorti du four'],
        ['a chocolate croissant', 'un pain au chocolat'],
      ] },
      { theme: 'En terrasse', emoji: '☕', words: [
        ['the bill, please', "l'addition, s'il vous plaît"], ['a white coffee', 'un café crème'],
        ['a table for two', 'une table pour deux'], ['a jug of tap water', "une carafe d'eau"],
        ['is this seat free?', 'cette place est libre ?'], ["I'm thirsty", "j'ai soif"],
        ['to take away', 'à emporter'], ['the tip', 'le pourboire'],
        ['on the terrace', 'en terrasse'],
      ] },
      { theme: 'Au marché', emoji: '🧺', words: [
        ['ripe', 'mûr'], ['a kilo of apples', 'un kilo de pommes'],
        ["goat's cheese", 'du fromage de chèvre'], ['in season', 'de saison'],
        ['a bunch of flowers', 'un bouquet de fleurs'], ['free-range eggs', 'des œufs de plein air'],
        ['can I taste?', 'je peux goûter ?'], ['organic', 'bio'],
        ['the stallholder', 'le marchand'],
      ] },
      { theme: 'Dans le métro', emoji: '🚇', words: [
        ['a metro ticket', 'un ticket de métro'], ['the platform', 'le quai'],
        ['the next stop', 'le prochain arrêt'], ['to change lines', 'changer de ligne'],
        ['rush hour', "l'heure de pointe"], ['the way out', 'la sortie'],
        ["I'm lost", 'je suis perdue'], ['turn left', 'tournez à gauche'],
        ['straight ahead', 'tout droit'],
      ] },
      { theme: "Dans l'immeuble", emoji: '🏢', words: [
        ['the sixth floor', 'le sixième étage'], ['the lift', "l'ascenseur"],
        ['the doorbell', 'la sonnette'], ['the caretaker', 'le gardien'],
        ['the neighbour', 'le voisin'], ['the balcony', 'le balcon'],
        ['the attic', 'le grenier'], ['to move house', 'déménager'],
        ['the landlord', 'le propriétaire'],
      ] },
      { theme: 'Au musée du Louvre', emoji: '🖼️', words: [
        ['a painting', 'un tableau'], ['a masterpiece', 'un chef-d’œuvre'],
        ['the queue', "la file d'attente"], ['a guided tour', 'une visite guidée'],
        ['free admission', "l'entrée gratuite"], ['an exhibition', 'une exposition'],
        ['opening hours', "les horaires d'ouverture"], ['the ceiling', 'le plafond'],
        ['a mysterious smile', 'un sourire mystérieux'],
      ] },
      { theme: 'Les boutiques', emoji: '🛍️', words: [
        ['the fitting room', "la cabine d'essayage"], ['it suits you', 'ça vous va bien'],
        ['the sales', 'les soldes'], ['too tight', 'trop serré'],
        ['a bargain', 'une bonne affaire'], ['what size?', 'quelle taille ?'],
        ['a handbag', 'un sac à main'], ['trendy', 'à la mode'],
        ['window shopping', 'le lèche-vitrines'],
      ] },
      { theme: 'Au jardin', emoji: '🌷', words: [
        ['a picnic', 'un pique-nique'], ['a deckchair', 'une chaise longue'],
        ['the fountain', 'la fontaine'], ['the weather is nice', 'il fait beau'],
        ['to go for a walk', 'se promener'], ['keep off the grass', 'pelouse interdite'],
        ['a merry-go-round', 'un manège'], ['the pond', 'le bassin'],
        ['a vanilla ice cream', 'une glace à la vanille'],
      ] },
      { theme: 'Faire la conversation', emoji: '💬', words: [
        ['nice to meet you', 'enchantée'], ['see you soon', 'à bientôt'],
        ['how are you?', 'comment allez-vous ?'], ["I don't understand", 'je ne comprends pas'],
        ['could you repeat that?', 'pouvez-vous répéter ?'], ['never mind', "ce n'est pas grave"],
        ["you're welcome", 'de rien'], ['cheers!', 'santé !'],
        ['excuse me', 'excusez-moi'],
      ] },
      { theme: 'Un soir à Paris', emoji: '🎆', words: [
        ['the fireworks', "le feu d'artifice"], ['an accordion dance', 'un bal musette'],
        ['tonight', 'ce soir'], ['the moon', 'la lune'],
        ['a starry sky', 'un ciel étoilé'], ['to have fun', "s'amuser"],
        ['a cruise on the Seine', 'une croisière sur la Seine'], ['midnight', 'minuit'],
        ['the Eiffel Tower sparkles', 'la tour Eiffel scintille'],
      ] },
    ],
  },

  {
    id: 'expert',
    name: 'Expert',
    stars: 3,
    blurb: 'Expressions et faux amis',
    shop: 'Librairie',
    floors: [
      { theme: 'Attention, faux amis !', emoji: '🎭', words: [
        ['actually', 'en fait'], ['currently', 'actuellement'],
        ['a library', 'une bibliothèque'], ['a bookshop', 'une librairie'],
        ['eventually', 'finalement'], ['sensible', 'raisonnable'],
        ['sensitive', 'sensible'], ['a disappointment', 'une déception'],
        ['a cave', 'une grotte'], ['a cellar', 'une cave'],
      ] },
      { theme: 'Expressions gourmandes', emoji: '🧀', words: [
        ['the icing on the cake', 'la cerise sur le gâteau'], ["it's a piece of cake", "c'est du gâteau"],
        ['to spill the beans', 'vendre la mèche'], ['mind your own business', 'occupe-toi de tes oignons'],
        ['to be full of beans', 'avoir la pêche'], ['to feel under the weather', 'ne pas être dans son assiette'],
        ['to make a mountain out of a molehill', 'en faire tout un fromage'],
        ['to split the difference', 'couper la poire en deux'], ['to pass out', 'tomber dans les pommes'],
      ] },
      { theme: 'La pluie et le beau temps', emoji: '🌦️', words: [
        ["it's raining cats and dogs", 'il pleut des cordes'], ['a storm in a teacup', "une tempête dans un verre d'eau"],
        ['once in a blue moon', 'tous les trente-six du mois'], ['to break the ice', 'briser la glace'],
        ['to be on cloud nine', 'être aux anges'], ["to steal someone's thunder", 'voler la vedette'],
        ['to take a rain check', 'remettre à plus tard'], ["it's a breeze", "c'est un jeu d'enfant"],
        ['every cloud has a silver lining', 'à quelque chose malheur est bon'],
      ] },
      { theme: 'Drôles de bêtes', emoji: '🐓', words: [
        ['when pigs fly', 'quand les poules auront des dents'], ["to have a frog in one's throat", 'avoir un chat dans la gorge'],
        ['to stand someone up', 'poser un lapin'], ["there's not a soul around", "il n'y a pas un chat"],
        ['to have goosebumps', 'avoir la chair de poule'], ['I could eat a horse', "j'ai une faim de loup"],
        ['as blind as a bat', 'myope comme une taupe'], ['bitterly cold', 'un froid de canard'],
        ['to have other fish to fry', "avoir d'autres chats à fouetter"],
      ] },
      { theme: 'Les phrasal verbs', emoji: '🧩', words: [
        ['to give up', 'abandonner'], ['to look forward to', 'avoir hâte de'],
        ['to run out of', 'être à court de'], ['to turn down', 'refuser'],
        ['to get along', "bien s'entendre"], ['to put off', 'repousser'],
        ['to look after', "s'occuper de"], ['to show off', 'frimer'],
        ['to find out', 'découvrir'],
      ] },
      { theme: "L'art de vivre parisien", emoji: '🥂', words: [
        ['love at first sight', 'le coup de foudre'], ['a lie-in', 'la grasse matinée'],
        ['window shopping', 'le lèche-vitrines'], ['a second-hand bookseller', 'un bouquiniste'],
        ['to stroll', 'flâner'], ['pre-dinner drinks', "l'apéro"],
        ['a leaving party', 'un pot de départ'], ['the back-to-school season', 'la rentrée'],
        ['a snack on the go', 'un casse-croûte sur le pouce'],
      ] },
      { theme: 'Drôles de caractères', emoji: '🎩', words: [
        ['cheerful', 'enjoué'], ['grumpy', 'grincheux'], ['stubborn', 'têtu'],
        ['clumsy', 'maladroit'], ['witty', "plein d'esprit"], ['shy', 'timide'],
        ['nosy', 'indiscret'], ['lazy', 'paresseux'], ['bossy', 'autoritaire'],
      ] },
      { theme: 'Petites phrases du quotidien', emoji: '💬', words: [
        ["it doesn't ring a bell", 'ça ne me dit rien'], ['too bad', 'tant pis'],
        ['bless you', 'à vos souhaits'], ['sounds good', 'ça marche'],
        ['nonsense!', "n'importe quoi !"], ['I feel blue', "j'ai le cafard"],
        ['meh', 'bof'], ['forget it', 'laisse tomber'],
        ['enjoy your meal', 'bon appétit'],
      ] },
      { theme: 'Faux amis, le retour', emoji: '🕵️', words: [
        ['to attend', 'assister à'], ['to pretend', 'faire semblant'],
        ['a coin', 'une pièce'], ['a journey', 'un voyage'],
        ['a location', 'un emplacement'], ['a lecture', 'une conférence'],
        ['to rest', 'se reposer'], ['a chat', 'une discussion'],
        ['a novel', 'un roman'],
      ] },
      { theme: 'Les proverbes', emoji: '📜', words: [
        ["Rome wasn't built in a day", "Paris ne s'est pas fait en un jour"],
        ['time will tell', 'qui vivra verra'],
        ['better late than never', 'mieux vaut tard que jamais'],
        ["don't judge a book by its cover", "l'habit ne fait pas le moine"],
        ["when the cat's away, the mice will play", "quand le chat n'est pas là, les souris dansent"],
        ["don't count your chickens before they hatch", "il ne faut pas vendre la peau de l'ours"],
        ['good things come to those who wait', 'tout vient à point à qui sait attendre'],
        ['great minds think alike', 'les grands esprits se rencontrent'],
        ['little by little', "petit à petit, l'oiseau fait son nid"],
      ] },
    ],
  },
];
