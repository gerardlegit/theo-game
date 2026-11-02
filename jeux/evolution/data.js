// ============================================================================
// Ce que dit Ammo, l'ammonite qui guide le joueur, dans tous les niveaux.
// (Les phrases propres à un niveau sont dans levels/.)
// ============================================================================

export const LINES = {
  resume: [
    "Bloub ! Te revoilà ! On continue l'évolution ?",
    "Re-bonjour ! L'océan t'attendait.",
  ],
  spotted: [
    "Attention ! On t'a repéré : file !",
    "Danger ! Il est plus gros que toi : fonce !",
    "Il arrive ! Vite, cache-toi dans les algues !",
    "Aaah ! Nage, nage, NAGE !",
  ],
  dashHint: "Appuie sur Espace (ou le bouton Fonce) pour un sprint !",
  hidden: [
    "Chut… Dans les algues, il ne te voit plus.",
    "Bien caché ! Les algues, c'est la meilleure cachette.",
  ],
  escaped: [
    "Ouf ! Tu l'as semé !",
    "Pfiou… c'était moins une !",
    "Bravo, il a abandonné !",
  ],
  eaten: [
    "Gloups ! Tu t'es fait manger… mais un de tes descendants prend la relève !",
    "Oh non ! Croqué ! Heureusement, la vie continue avec tes descendants.",
    "Aïe ! Tu as perdu de l'ADN… Va vite le récupérer, s'il est encore là !",
  ],
  shield: "Clang ! Ta carapace t'a protégé !",
  stung: "Aïe, aïe, aïe ! Les méduses, ça pique !",
  tooHard: "Trop dur ! Il te faudrait des mâchoires…",
  tooBig: "Trop gros pour toi… pour l'instant !",
  maxSize: "Tu as atteint ta taille maximale pour cette époque. Termine les missions pour avancer dans le temps !",
  canEvolve: "Tu as assez d'ADN pour évoluer ! Appuie sur 🧬 Évoluer.",
  revenge: "Avant, c'est lui qui te croquait… Maintenant, c'est ton tour !",
  bigger: "Tu as grandi ! Ce qui te faisait peur devient… ton repas.",
  /* sur la terre ferme (niveau 2) */
  mud: "Beurk, de la boue ! Ça colle, on avance tout doucement… Un chasseur qui te suit là-dedans sera ralenti, lui aussi !",
  snow: "Brrr, de la neige profonde ! On s'enfonce, on avance tout doucement… Un chasseur qui te suit là-dedans sera ralenti, lui aussi !",
  dry: [
    "Ta peau sèche ! Vite, trouve une mare 💧",
    "Attention, tu te dessèches ! Plonge dans l'eau !",
  ],
  dried: [
    "Oh non, tu t'es desséché… Tes descendants repartent d'une mare.",
    "Trop longtemps loin de l'eau ! Pense à te mouiller plus souvent.",
  ],
  /* dans la mer des reptiles marins (niveau 2, version mer) */
  air: [
    "Tu manques d'air ! Remonte respirer à la surface, dans la lumière 🐳",
    "Plus d'air ! Vite, vers une tache de lumière !",
  ],
  drowned: [
    "Oh non, tu as manqué d'air… Les reptiles marins doivent remonter respirer !",
    "Trop longtemps sous l'eau ! Pense à remonter à la surface plus souvent.",
  ],
  ammonite: "Hé ! Ce sont mes cousines, les ammonites ! Bon… la nature est ainsi faite. Bon appétit…",
  stolen: [
    "Hé ! Un animal de ton espèce t'a piqué ta proie ! Sois plus rapide que lui…",
    "Volé ! Tes cousins ont faim, eux aussi. Dépêche-toi !",
  ],
  noise: "Chut ! Quand tu cours, ça fait du bruit : les chasseurs t'ont entendu…",
  roar: [
    "Il rugit ! Il t'a vu ! Cours, cache-toi !",
    "ROAR ! Ne reste pas là !",
  ],
  stomp: [
    "Boum… boum… Tu sens le sol trembler ? Quelque chose d'énorme approche…",
    "Ces pas… c'est un géant. Fais-toi tout petit.",
  ],
  pack: "Une meute ! Ils chassent ensemble… Fuis vers une cachette !",
  defender: "Il baisse la tête… Il va charger ! Écarte-toi !",
  horned: "Aïe ! Les herbivores savent se défendre, eux aussi !",
  crushed: "Écrasé ! Ne passe jamais sous les pattes d'un géant…",
  // le loup et l'humain
  packTitle: "Ta meute : va toucher les loups entourés d'un anneau doré pour qu'ils te rejoignent",
  packJoin: "Un loup de plus dans ta meute ! Cherche les autres : ils ont un anneau doré.",
  packSmall: "Ce renne est trop fort pour vous ! Regarde au-dessus de lui : il te faut plus de loups.",
  huntGo: "Hou-hou-hou ! Toute la meute attaque : regarde sa barre de vie descendre !",
  packLost: "Oh non, un loup de ta meute s'est enfui ! Va vite le rechercher.",
  trustTitle: "La confiance des humains : reste près d'eux, sans foncer !",
  trustHint: "Doucement… Ne bouge plus : laisse les humains venir à toi. Ils vont s'habituer.",
  shoo: "Ouste ! Ils ne te connaissent pas encore : ne t'approche pas, attends sans bouger. C'est eux qui viendront !",
  shooed: "Aïe ! Ils t'ont chassé. Reviens doucement, sans foncer.",
  startle: "Oh non, tu as foncé près d'eux : ils ont eu peur ! Reste calme près des humains.",
  trustShoo: "Les humains s'habituent à toi : tu peux t'approcher, ils ne te chasseront plus !",
  trustSafe: "Les humains te font confiance ! Près de leur feu, aucun chasseur n'ose venir.",
  trustFull: "Les humains t'adorent ! Tu fais partie de la famille.",
  treat: ['Tiens !', 'Attrape !', 'Pour toi !'],
  barkHunter: "Wouf ! Le chasseur s'enfuit… et les humains accourent avec des torches !",
  penned: "Bravo, berger ! Les moutons s'écartent devant toi : pousse-les vers l'enclos.",
  flockEaten: "Un loup sauvage a croqué un mouton ! Aboie pour le faire fuir.",
  played: [
    "Ouaf ! Les enfants adorent jouer avec toi !",
    "Un câlin, une course… le chien, c'est le meilleur ami des enfants !",
  ],
  childShy: "L'enfant a encore un peu peur de toi… Gagne d'abord la confiance des humains.",
  idle: [
    "Tu dors ? Les chasseurs, eux, ne dorment jamais…",
    "Bouge un peu, il y a plein de choses à manger !",
  ],
  jokes: [
    "Tu sais quoi ? Je suis une ammonite. Mes cousins, les nautiles, existent encore aujourd'hui !",
    "Évoluer, ça prend des millions d'années. Heureusement, ici, ça va plus vite !",
    "Chaque fois que tu évolues, ce sont tes descendants qui changent, génération après génération.",
    "La vie est apparue dans l'eau. Les animaux de la terre sont venus bien plus tard !",
    "Sur la terre, les plus malins survivent : ceux qui se cachent, qui observent, qui ne courent pas pour rien.",
  ],
};
