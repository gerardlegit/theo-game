// ============================================================================
// Vocabulaire par étage : [anglais, français].
// Plus on monte, plus c'est difficile. À chaque partie, 5 mots sont tirés
// au hasard par étage ; les fausses propositions viennent du même thème.
//   Étages impairs : le mot anglais est montré → trouver le français.
//   Étages pairs   : le mot français est montré → trouver l'anglais.
// ============================================================================

export const FLOORS = [
  { theme: 'La maison', words: [
    ['house', 'maison'], ['door', 'porte'], ['window', 'fenêtre'], ['kitchen', 'cuisine'],
    ['bedroom', 'chambre'], ['chair', 'chaise'], ['key', 'clé'], ['garden', 'jardin'],
    ['stairs', 'escalier'], ['roof', 'toit'],
  ] },
  { theme: 'La nourriture', words: [
    ['bread', 'pain'], ['cheese', 'fromage'], ['apple', 'pomme'], ['water', 'eau'],
    ['milk', 'lait'], ['egg', 'œuf'], ['butter', 'beurre'], ['fish', 'poisson'],
    ['chicken', 'poulet'], ['sugar', 'sucre'],
  ] },
  { theme: 'Les animaux', words: [
    ['dog', 'chien'], ['cat', 'chat'], ['bird', 'oiseau'], ['horse', 'cheval'],
    ['cow', 'vache'], ['sheep', 'mouton'], ['mouse', 'souris'], ['rabbit', 'lapin'],
    ['duck', 'canard'], ['pig', 'cochon'],
  ] },
  { theme: 'La famille', words: [
    ['mother', 'mère'], ['father', 'père'], ['sister', 'sœur'], ['brother', 'frère'],
    ['daughter', 'fille'], ['son', 'fils'], ['grandmother', 'grand-mère'],
    ['grandfather', 'grand-père'], ['husband', 'mari'], ['aunt', 'tante'],
  ] },
  { theme: 'Les couleurs et les vêtements', words: [
    ['red', 'rouge'], ['blue', 'bleu'], ['green', 'vert'], ['yellow', 'jaune'],
    ['black', 'noir'], ['white', 'blanc'], ['coat', 'manteau'], ['shoes', 'chaussures'],
    ['hat', 'chapeau'], ['dress', 'robe'],
  ] },
  { theme: 'La ville', words: [
    ['street', 'rue'], ['church', 'église'], ['bakery', 'boulangerie'], ['market', 'marché'],
    ['bridge', 'pont'], ['station', 'gare'], ['town hall', 'mairie'], ['library', 'bibliothèque'],
    ['bookshop', 'librairie'], ['shop', 'magasin'],
  ] },
  { theme: 'Le corps et la santé', words: [
    ['head', 'tête'], ['hand', 'main'], ['foot', 'pied'], ['eye', 'œil'],
    ['mouth', 'bouche'], ['heart', 'cœur'], ['back', 'dos'], ['knee', 'genou'],
    ['tooth', 'dent'], ['doctor', 'médecin'],
  ] },
  { theme: 'Le temps qui passe', words: [
    ['Monday', 'lundi'], ['Wednesday', 'mercredi'], ['Sunday', 'dimanche'], ['morning', 'matin'],
    ['evening', 'soir'], ['rain', 'pluie'], ['snow', 'neige'], ['sun', 'soleil'],
    ['spring', 'printemps'], ['winter', 'hiver'],
  ] },
  { theme: 'Les verbes du quotidien', words: [
    ['to eat', 'manger'], ['to drink', 'boire'], ['to sleep', 'dormir'], ['to read', 'lire'],
    ['to walk', 'marcher'], ['to buy', 'acheter'], ['to sing', 'chanter'], ['to write', 'écrire'],
    ['to listen', 'écouter'], ['to cook', 'cuisiner'],
  ] },
  { theme: 'Adjectifs et faux amis', words: [
    ['tired', 'fatigué'], ['happy', 'heureux'], ['sad', 'triste'], ['cheap', 'bon marché'],
    ['expensive', 'cher'], ['early', 'tôt'], ['late', 'en retard'], ['actually', 'en fait'],
    ['currently', 'actuellement'], ['sensible', 'raisonnable'], ['eventually', 'finalement'],
  ] },
];
