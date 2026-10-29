// ============================================================================
// Ce que dit Plume, la chouette magicienne qui guide le joueur, dans tous les
// niveaux, et la boutique magique (baguettes et chapeaux, payés en étoiles).
// (Les phrases propres à un niveau sont dans levels/.)
// ============================================================================

export const LINES = {
  resume: [
    "Hou hou ! Te revoilà ! On continue de réparer le grimoire ?",
    "Re-bonjour, petit magicien ! Les bulles t'attendaient.",
  ],
  right: [
    "Bravo !", "Super !", "Magique !", "Bien vu !", "Génial !", "Oui, c'est ça !", "Hou hou, bravo !",
  ],
  afterRetry: [
    "Voilà ! Tu l'as trouvée.",
    "Bravo, tu as persévéré !",
    "C'est ça ! La prochaine fois, du premier coup ?",
  ],
  wrong: [
    "Oups, ce n'est pas celle-là. Regarde encore !",
    "Presque ! Essaie une autre bulle.",
    "Pas tout à fait… Compare bien avec le parchemin.",
  ],
  // {n} = la première lettre différente (« troisième »), {len} = le nombre de lettres
  diffAt: [
    "Presque ! Regarde bien la {n} lettre.",
    "Ça commence pareil… mais regarde la {n} lettre !",
  ],
  diffFirst: "Regarde bien la première lettre !",
  diffLen: "Compte les lettres : sur le parchemin, il y en a {len}.",
  diffWord: "Presque ! Regarde bien le {n} mot.",
  // quand le modèle est une image : on dit à voix haute le mot choisi
  wrongImg: [
    "Ça, c'est écrit « {w} ». Est-ce que c'est le nom de l'image ?",
    "Oups ! Cette bulle dit « {w} ». Cherche encore !",
  ],
  glow: "Psst… La bonne bulle brille un peu. Tu la vois ?",
  streak: [
    "Une série de {n} ! Tu es en feu !",
    "{n} d'affilée ! Quelle baguette !",
  ],
  star: "Une étoile filante ! Touche-la vite, avant qu'elle ne disparaisse !",
  starCaught: [
    "Attrapée ! Trois étoiles pour toi !",
    "Waouh ! Tu as attrapé une étoile filante !",
  ],
  gribouille: [
    "Hi hi hi ! Gribouille s'amuse à souffler sur les bulles…",
    "Gribouille ! Arrête de souffler, enfin !",
  ],
  gribouilleLaugh: [
    "Gribouille rigole… Montre-lui que tu peux y arriver !",
    "Ne t'occupe pas de Gribouille, essaie encore !",
  ],
  shop: "Tu as assez d'étoiles pour la boutique magique ! Appuie sur 🛍️.",
  idle: [
    "Hou hou ? Touche la bulle qui a la même chose que le parchemin !",
    "Tu hésites ? Appuie sur 🔊 pour écouter.",
  ],
  jokes: [
    "Tu sais quoi ? Les chouettes peuvent tourner la tête presque jusque derrière leur dos !",
    "Les chouettes chassent la nuit. Moi, je lis la nuit… avec une lampe magique !",
    "Ma baguette ? C'est une plume ! Logique, je m'appelle Plume.",
    "Chaque bulle que tu éclates rend une lettre au grimoire. Il est déjà plus beau !",
    "Gribouille n'est pas méchant… juste très, très farceur.",
  ],
};

/* La boutique magique : la traînée d'étincelles de ta baguette et le chapeau
   de Plume. "price" en étoiles ; le premier de chaque liste est offert. */
export const WANDS = [
  { id: 'etoiles', name: 'Étoiles dorées', desc: 'La baguette des débutants.', price: 0, colors: ['#FFE066', '#FFC93C', '#FFFFFF'], shape: 'star' },
  { id: 'coeurs', name: 'Cœurs tendres', desc: 'Des petits cœurs roses partout.', price: 12, colors: ['#FF6F91', '#FF9DBB', '#FFD1DC'], shape: 'heart' },
  { id: 'arc', name: 'Arc-en-ciel', desc: 'Toutes les couleurs à la fois !', price: 20, colors: ['#FF5E5E', '#FFB13C', '#FFE066', '#58C97B', '#4FB8E8', '#B58CF0'], shape: 'dot' },
  { id: 'flocons', name: 'Flocons de neige', desc: 'Brrr… une baguette glacée.', price: 30, colors: ['#FFFFFF', '#BDEBFF', '#8FD8FF'], shape: 'snow' },
  { id: 'notes', name: 'Notes de musique', desc: 'Chaque bulle éclate en chanson.', price: 40, colors: ['#B58CF0', '#7FD6FF', '#FFFFFF'], shape: 'note' },
  { id: 'feu', name: "Feu d'artifice", desc: 'Pour les grands magiciens !', price: 55, colors: ['#FF5E5E', '#FFE066', '#FFFFFF', '#4FB8E8'], shape: 'firework' },
];

export const HATS = [
  { id: 'sorcier', name: 'Chapeau de magicien', desc: 'Le chapeau préféré de Plume.', price: 0 },
  { id: 'couronne', name: 'Couronne dorée', desc: 'Plume, reine du grimoire.', price: 25 },
  { id: 'fleur', name: 'Couronne de fleurs', desc: 'Pour une chouette des prés.', price: 18 },
  { id: 'bonnet', name: 'Bonnet à pompon', desc: 'Bien au chaud pour lire la nuit.', price: 15 },
];
