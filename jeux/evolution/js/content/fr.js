// ============================================================================
// Textes du jeu en français, rangés à part pour une traduction future.
// Phrases courtes (moins de 15 mots) : le jeu s'adresse aux 7–11 ans.
// Les espaces avant ! ? : sont rendues insécables à l'affichage (typo()).
// ============================================================================

export const FR = {
  title: {
    pitch: 'Tu commences comme une minuscule cellule dans l’océan. Mange, survis, et choisis le chemin de tes descendants !',
  },
  hint: {
    cell: {
      keyboard: 'Flèches, ZQSD ou WASD pour nager',
      touch: 'Pose ton doigt et glisse pour nager',
    },
    nucleus: {
      keyboard: 'Maj pour foncer · Fuis le rouge, mange le vert !',
      touch: 'Pousse le joystick à fond pour foncer',
    },
  },
  fullscreen: {
    ios: 'Sur iPhone ou iPad : touche Partager, puis « Sur l’écran d’accueil ». Le jeu s’ouvrira en grand !',
  },
  intro: {
    ago: 'Il y a environ',
    go: 'C’est parti !',
  },
  stages: {
    cell: {
      name: 'Première cellule',
      goal: 'Mange 10 molécules',
      danger: 'Évite l’eau trop chaude des cheminées !',
    },
    nucleus: {
      name: 'Cellule à noyau',
      goal: 'Mange 12 bactéries',
      danger: 'Fuis les cellules plus grosses que toi !',
    },
  },
  milestones: {
    cell: 'Bravo, tu grandis ! Encore un effort.',
    nucleus: 'Attention, une cellule rapide arrive !',
  },
  hurt: {
    predator: 'Gloups ! Un de tes descendants a été mangé. Un autre prend le relais !',
    heat: 'Aïe, trop chaud ! Un autre descendant prend le relais.',
  },
  floating: {
    predator: 'Gloups !',
    heat: 'Aïe !',
  },
  lost: {
    title: 'La vie trouve toujours un chemin !',
    text: 'Tes descendants recommencent l’étape. Tu gardes la moitié de ta croissance.',
    go: 'On repart !',
  },
  transition: {
    title: 'Des millions d’années plus tard…',
    nucleus: 'Génération après génération, tes descendants ont changé : ils ont un noyau !',
  },
  // Fiches découverte (à faire valider par un relecteur scientifique)
  cards: {
    cell: {
      name: 'Première cellule',
      example: 'Les premières cellules, nées dans l’océan',
      fact: 'Les premiers êtres vivants étaient minuscules : un million tiendraient sur une tête d’épingle !',
      change: 'Une membrane : une fine enveloppe qui protège l’intérieur.',
      icon: 'membrane',
    },
    nucleus: {
      name: 'Cellule à noyau',
      example: 'Comme l’amibe ou la paramécie, qui vivent encore aujourd’hui',
      fact: 'Ta cellule a un noyau, comme presque toutes les cellules de ton corps.',
      change: 'Un noyau : il range l’ADN, le mode d’emploi de la cellule.',
      icon: 'nucleus',
    },
  },
  card: {
    when: 'Quand ?',
    fact: 'Le savais-tu ?',
    change: 'Ce qui a changé',
    listen: 'Écouter',
    next: 'Continuer',
  },
  sequel: {
    title: 'À suivre…',
    text: 'Tes descendants vont bientôt s’assembler pour former un être de plusieurs cellules. La suite arrive bientôt !',
  },
};

/* Typographie française : espaces insécables avant ! ? : ; et dans les « » */
export function typo(s) {
  return s.replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}
