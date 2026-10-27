# Évolution — Game Design Document

Oct 27, 2026 · @Gerard

## 1. Vision

**Évolution** est un jeu d'arcade 2D vu du dessus, inspiré de la phase cellule de *Spore* : l'enfant dirige un organisme, mange pour grandir, évite les prédateurs et fait évoluer sa lignée sur 3,8 milliards d'années, jusqu'à l'une de 5 fins (poisson, reptile, oiseau, grand singe, grand mammifère).

**Pitch.** « Tu commences comme une minuscule cellule dans l'océan. Mange, survis, et choisis le chemin de tes descendants. Deviendront-ils des poissons, des oiseaux ou des singes ? »

**Public cible.** Enfants de 7 à 11 ans, jouable seul ou avec un parent. Lecture courte (phrases de moins de 15 mots) ; toutes les infos importantes sont aussi données par des icônes.

**Durée.** Une partie complète (une fin) dure 15 à 25 minutes ; chaque étape dure 1 à 3 minutes. Les 5 fins demandent environ 1 h 30.

### Piliers de design

1. **Facile à prendre en main** : une seule mécanique de base (se déplacer), tout le reste est contextuel.
2. **Chaque étape se joue différemment** : le décor, la physique et les capacités changent pour garder la surprise.
3. **Vrai sur le plan scientifique** : simplifié, jamais faux.
4. **Rejouer pour explorer** : les embranchements donnent envie de découvrir toutes les branches de l'arbre de la vie.

### Objectifs pédagogiques

À la fin, l'enfant doit pouvoir dire :

- La vie est apparue dans l'eau, sous forme de cellules minuscules.
- Les êtres vivants ont changé très lentement, sur des millions d'années et des générations successives.
- L'évolution est un **arbre** avec des branches, pas une échelle : un poisson actuel n'est pas « moins évolué » qu'un singe.
- Les êtres vivants qui survivent sont ceux dont les caractères conviennent à leur milieu (sélection naturelle).
- Quelques jalons : sortie de l'eau, œuf à coquille, dinosaures à plumes ancêtres des oiseaux, météorite d'il y a 66 millions d'années.

**Règle narrative clé.** L'individu ne se transforme jamais en mangeant. Chaque transformation passe par l'écran « Des millions d'années plus tard… tes descendants ont changé ! ». Le joueur incarne une lignée.

## 2. Plateformes et architecture technique

Le jeu est une application web unique (HTML5 Canvas + TypeScript), jouable dans le navigateur sur PC en plein écran et sur smartphone, installable comme PWA et utilisable hors ligne.

### Plateformes cibles

| Plateforme | Navigateurs | Entrée | Orientation | Cible de perf |
| --- | --- | --- | --- | --- |
| PC (Windows, macOS, Linux) | Chrome, Edge, Firefox, Safari récents | Clavier (flèches / ZQSD / WASD), souris en option | Paysage | 60 i/s |
| Smartphone Android | Chrome récent | Tactile (joystick virtuel) | Paysage recommandé, portrait supporté | 60 i/s, 30 minimum |
| iPhone | Safari iOS 16+ | Tactile (joystick virtuel) | Paysage recommandé, portrait supporté | 60 i/s, 30 minimum |
| Tablette | Chrome, Safari | Tactile | Les deux | 60 i/s |

### Stack imposée

- **Langage** : TypeScript strict.
- **Build** : Vite.
- **Rendu** : Canvas 2D natif (pas de moteur lourd). Option acceptable : PixiJS si le Canvas 2D ne tient pas 60 i/s sur mobile.
- **Audio** : Web Audio API, via une petite surcouche maison (ou Howler.js).
- **Tests** : Vitest pour la logique (collisions, croissance, progression, sauvegarde).
- **PWA** : `vite-plugin-pwa` (manifest + service worker, cache de tous les assets).
- **Aucun backend**, aucune collecte de données, aucune publicité, aucun lien externe (public enfant).

### Plein écran et redimensionnement

- Bouton « Plein écran » sur l'écran titre et dans le menu pause : `element.requestFullscreen()` sur PC et Android ; sur iOS Safari (pas d'API plein écran pour un canvas), afficher l'astuce « Ajouter à l'écran d'accueil » qui lance la PWA en mode `standalone`.
- Le canvas occupe 100 % de la fenêtre (`100dvh`), redimensionné à chaque `resize` et `orientationchange`, avec `devicePixelRatio` plafonné à 2 pour la perf.
- Monde de jeu en **unités logiques** indépendantes de l'écran : une caméra suit le joueur et le zoom s'adapte pour que la zone visible fasse toujours environ 1 600 × 900 unités en paysage (900 de large en portrait).
- Respect des zones sûres (`env(safe-area-inset-*)`) pour l'encoche des téléphones.
- Bloquer le zoom et le défilement du navigateur pendant le jeu (`touch-action: none`, meta viewport `user-scalable=no`).

### Structure de projet

```
evolution/
├─ index.html
├─ public/            # icônes PWA, sons, polices
├─ src/
│  ├─ main.ts         # boot, boucle de jeu, gestion des scènes
│  ├─ core/           # loop.ts, input.ts, camera.ts, audio.ts, save.ts, rng.ts
│  ├─ scenes/         # TitleScene, StageScene, TransitionScene, BranchScene, EndingScene, TreeScene
│  ├─ stages/         # un fichier de config par étape (cell.ts, multicell.ts, worm.ts…)
│  ├─ entities/       # Player, Food, Predator, Hazard, Particle
│  ├─ systems/        # movement, collision, ai, spawn, growth
│  ├─ ui/             # HUD, joystick virtuel, boutons, fiches découverte
│  ├─ content/        # textes FR (fr.json), données pédagogiques, arbre de la vie
│  └─ render/         # dessin procédural des créatures et décors
└─ tests/
```

**Principe directeur** : tout le contenu (étapes, ennemis, textes, valeurs) est décrit en **données** dans `stages/` et `content/`. Le code des systèmes est générique ; ajouter une étape ne demande qu'un nouveau fichier de config.

- Boucle à pas de temps fixe (60 Hz) pour la logique, rendu interpolé.
- Textes externalisés dans `fr.json` pour une traduction future.

## 3. Contrôles

On se déplace avec les flèches sur PC et avec un joystick virtuel sur mobile ; une seule action contextuelle (« Action ») s'ajoute à partir de l'étape 3.

| Action | PC (clavier) | Mobile (tactile) | Disponible dès |
| --- | --- | --- | --- |
| Se déplacer (8 directions + analogique sur mobile) | Flèches, ZQSD (AZERTY) ou WASD (QWERTY) | Joystick virtuel flottant, moitié gauche de l'écran | Étape 1 |
| Sprint (dépense d'énergie) | Maj maintenue | Pousser le joystick à fond plus de 0,3 s | Étape 2 |
| Action contextuelle (mordre, creuser, sauter, battre des ailes, grimper) | Espace | Gros bouton rond, en bas à droite | Étape 3 |
| Pause / menu | Échap ou P | Bouton pause en haut à droite | Toujours |
| Plein écran | F | Bouton dans le menu | Toujours |
| Valider dans les menus | Entrée ou Espace | Toucher | Toujours |

### Physique du déplacement

- Mouvement **avec inertie** (accélération + friction), pour reproduire la sensation de nage de Spore. Les valeurs changent selon le milieu : eau = inertie forte, terre = arrêt rapide, air = planer.
- Diagonales normalisées (pas plus rapides que les droites).
- Dans l'eau, l'organisme s'oriente progressivement vers sa direction de déplacement (rotation lissée, environ 8 rad/s).

### Joystick virtuel

- Apparaît là où le doigt se pose dans la moitié gauche de l'écran ; disparaît au relâchement.
- Rayon : 60 px CSS, zone morte : 10 %. La sortie est analogique (vitesse proportionnelle à l'inclinaison).
- Bouton Action : diamètre 88 px CSS minimum (cible tactile confortable pour un enfant), semi-transparent, retour visuel à la pression, vibration courte (`navigator.vibrate(15)`) si disponible.
- Multi-touch géré : joystick et bouton utilisables en même temps.

### Détection automatique

Le jeu affiche les aides correspondant à la **dernière entrée utilisée** : pictos de flèches si une touche est pressée, joystick si l'écran est touché. Les éléments tactiles sont cachés tant qu'aucun toucher n'a eu lieu.

## 4. Boucle de jeu principale

À chaque étape, le joueur mange pour remplir sa jauge de croissance tout en évitant ce qui est plus gros que lui ; jauge pleine = transformation vers l'étape suivante.

### Déroulé d'une étape

1. **Écran d'intro** (3 s, passable) : nom de l'étape, époque sur la frise, un objectif en une phrase et une icône (« Mange 10 molécules 🟢 »).
2. **Jeu libre** dans une arène délimitée (environ 3 × 3 écrans), caméra qui suit le joueur.
3. Le joueur **mange** en touchant la nourriture (absorption automatique, pas de bouton). Chaque bouchée : +1 croissance, son « miam », petite particule, l'organisme grossit visiblement.
4. Il **évite les prédateurs**. S'il est touché par un prédateur plus gros, il perd 1 cœur et devient invincible 2 s (clignotement).
5. Paliers à 50 % de la jauge : nouvelle **petite capacité** ou nouveau danger (ex. : apparition d'un prédateur plus rapide).
6. Jauge pleine → animation de croissance, puis écran **« Des millions d'années plus tard… »**, puis **fiche découverte**, puis étape suivante (ou **embranchement**).

### Règle de taille (comme Spore)

- Chaque créature a une **taille** (rayon). Le joueur peut manger toute créature dont la taille est inférieure à **80 %** de la sienne ; toute créature dont la taille dépasse **120 %** de la sienne peut le manger. Entre les deux : les créatures se repoussent.
- Codes couleurs constants dans tout le jeu : contour **vert** = mangeable, **blanc** = neutre, **rouge** = dangereux. Le contour change en temps réel quand le joueur grossit.
- Effet clé : un prédateur du début de l'étape devient une proie à la fin. C'est le moment le plus satisfaisant de la boucle Spore, à conserver absolument.

### Santé et échec (sans frustration)

- **3 cœurs** par étape. Les cœurs sont présentés comme « descendants » : perdre un cœur = « un de tes descendants a été mangé, un autre prend le relais ».
- Plus de cœurs → message bienveillant (« La vie trouve toujours un chemin ! ») et **reprise au début de l'étape**, avec la moitié de la jauge conservée.
- Jamais de « Game Over » ni de perte de progression entre étapes.
- **Mode facile** (activé par défaut pour les 7–8 ans dans les options) : prédateurs 30 % plus lents, 5 cœurs.

### Énergie (à partir de l'étape 2)

Une petite jauge d'énergie se vide en sprintant et se recharge en 3 s à l'arrêt ou en mangeant. Elle force à choisir entre fuir et économiser, sans pénaliser le joueur qui ne sprinte jamais.

## 5. Étapes et embranchements

Le jeu compte 11 étapes jouables plus une séquence (la météorite), 4 embranchements et 5 fins ; un parcours en traverse 5 à 10 selon les choix, et les 7 premières étapes sont communes à toutes les branches terrestres.

**Fins et noms affichés.** Poisson, Reptile, Oiseau, Grand singe, Grand mammifère. Le terme « mammifère dominant » de l'idée de départ est remplacé par « grand mammifère » : le jeu ne présente aucune espèce comme supérieure aux autres.

&#91;embedded content: arbre des étapes · 4 embranchements, 5 fins\]

Les étapes 1 à 7 forment un tronc commun ; la lignée se sépare ensuite en reptiles (à gauche) et mammifères (à droite), comme dans l'arbre réel du vivant.

### Détail des étapes

Les dates sont arrondies et affichées « il y a environ… ».

| # | Étape | Époque (il y a) | Milieu | Capacité nouvelle | Objectif de croissance | Dangers |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Première cellule | 3,8 milliards d'années | Océan primitif, cheminées hydrothermales | Se déplacer (dérive avec courants) | 10 molécules | Eau trop chaude près des cheminées (zones rouges), courants. Pas de prédateur : étape tutoriel |
| 2 | Cellule à noyau | 2 milliards d'années | Océan | Sprint | 12 bactéries | Grosses cellules prédatrices (règle de taille) |
| 3 | Être pluricellulaire | 600 millions d'années | Fond marin peu profond | Action : coller une cellule libre à son corps (le corps grandit d'un segment) | 15 cellules libres ou débris | Courants forts, prédateurs pluricellulaires lents |
| 4 | Petit ver | 540 millions d'années (Cambrien) | Fond sableux | Action : s'enfouir dans le sable 2 s (invisible) | 15 particules de nourriture | Anomalocaris (grand prédateur qui patrouille) |
| 5 | Poisson | 480 à 380 millions d'années | Mer ouverte | Nage rapide. À 50 % : mâchoires (Action = mordre une proie plus grosse que 80 %) | 20 petits animaux | Scorpions de mer, Dunkleosteus (poisson cuirassé géant) |
| 6 | Premier tétrapode | 370 millions d'années | Marécage : eau + berges | Marcher sur la berge (déplacement plus lent hors de l'eau). Jauge d'humidité qui baisse à terre | 20 insectes et mille-pattes | Gros poissons dans l'eau, dessèchement à terre |
| 7 | Premier œuf à coquille | 320 millions d'années | Forêt de fougères géantes | Action : pondre un œuf dans un nid (3 nids à remplir en plus de la croissance) | 20 insectes | Grands amphibiens, libellules géantes |
| 8a | Reptile | 300 à 250 millions d'années | Désert et rochers | Jauge de chaleur : se chauffer sur les rochers ensoleillés pour aller vite | 20 insectes et plantes | Grands reptiles carnivores, nuits froides (ralentissement) |
| 9a | Dinosaure à plumes | 150 millions d'années | Forêt du Jurassique | Action : sauter puis planer (maintenir) | 25 insectes et lézards | Grands dinosaures carnivores |
| 8b | Petit mammifère | 200 à 66 millions d'années | Sous-bois à l'époque des dinosaures | Cycle jour/nuit : de nuit, les dinosaures dorment ; Action = se cacher dans un terrier | 25 insectes | Dinosaures (le jour), serpents |
| ☄ | Météorite (séquence) | 66 millions d'années | Sous-bois puis cendres | Survivre 45 s : rejoindre des terriers pendant la pluie de débris | Aucun (survie) | Débris, incendies |
| 9b | Primate | 55 à 20 millions d'années | Forêt tropicale, plusieurs étages d'arbres | Action : sauter de branche en branche, grimper | 25 fruits | Grands félins et rapaces |

### Les quatre embranchements

À chaque embranchement, un **événement** se produit, puis l'enfant choisit entre deux **cartes mutation**. Aucun choix n'est mauvais : chaque carte mène à une fin.

| Embranchement | Après l'étape | Événement montré | Carte A | Carte B |
| --- | --- | --- | --- | --- |
| A | 5 Poisson | « Les rivières et les marais se remplissent de plantes, il y a peu d'oxygène dans l'eau. » | Nageoires fines et rapides → **Fin Poisson** | Nageoires charnues et poumons → étape 6 |
| B | 7 Œuf à coquille | « La Terre se réchauffe et s'assèche. » | Écailles imperméables → étape 8a | Poils et lait pour les petits → étape 8b |
| C | 8a Reptile | « Les insectes volants se multiplient. » | Rester au sol, carapace ou écailles solides → **Fin Reptile** | Plumes et bras légers → étape 9a, puis **Fin Oiseau** |
| D | Météorite | « Les dinosaures ont disparu, la planète est libre ! » | Mains qui attrapent, yeux vers l'avant → étape 9b, puis **Fin Grand singe** | Grandir encore, explorer terres et mers → **Fin Grand mammifère** |

Une fois une fin débloquée, l'arbre de la vie permet de **reprendre directement à n'importe quel embranchement déjà atteint**, pour ne pas rejouer les étapes communes.

### Les cinq fins

Chaque fin est un **épilogue jouable de 60 s** dans un décor actuel, sans danger ni objectif, suivi d'un écran de célébration et d'une fiche.

| Fin | Épilogue | Message de la fiche |
| --- | --- | --- |
| Poisson | Nager dans un récif de corail | « Les poissons sont le groupe de vertébrés qui compte le plus d'espèces. » |
| Reptile | Lézard au soleil, crocodile et tortue en arrière-plan | « Les reptiles vivent sur Terre depuis plus de 300 millions d'années. » |
| Oiseau | Vol libre au-dessus d'une forêt (contrôle = direction) | « Les oiseaux sont des dinosaures qui ont survécu. » |
| Grand singe | Groupe de singes, utiliser un bâton pour attraper des termites | « Les humains, chimpanzés et gorilles ont des ancêtres communs. » |
| Grand mammifère | Choix final : baleine (MVP), éléphant ou loup (bonus) | « Les baleines descendent de mammifères qui marchaient sur terre. » |

## 6. Entités, IA et valeurs de départ

Toutes les entités partagent un même modèle de données et trois comportements d'IA ; les valeurs ci-dessous sont des points de départ à régler en test, à stocker dans les fichiers de config des étapes.

### Modèle de données (TypeScript)

```ts
type Diet = 'molecule' | 'plant' | 'meat' | 'any';
type AIKind = 'drifter' | 'grazer' | 'hunter';

interface CreatureDef {
  id: string;            // ex. 'anomalocaris'
  size: number;          // rayon en unités logiques
  maxSpeed: number;      // unités / s
  accel: number;         // unités / s²
  friction: number;      // 0..1 par seconde (eau ~0.6, terre ~0.9)
  ai: AIKind;
  senseRadius: number;   // distance de détection du joueur
  growthValue: number;   // croissance donnée si mangée
  sprite: string;        // id de dessin procédural
}

interface StageDef {
  id: string;            // 'cell', 'multicell', 'worm'…
  era: string;           // clé de texte, ex. 'era.cambrian'
  medium: 'water' | 'shore' | 'land' | 'trees' | 'air';
  arena: { w: number; h: number };
  growthGoal: number;    // ex. 10 pour l'étape 1
  playerStart: { size: number; maxSpeed: number };
  playerEndSize: number; // taille atteinte à 100 %
  ability?: 'bind' | 'burrow' | 'bite' | 'walk' | 'lay' | 'bask' | 'glide' | 'hide' | 'climb';
  spawns: { def: string; count: number; respawnSec: number }[];
  hazards: HazardDef[];
  milestone50?: string;  // événement à 50 % de la jauge
  next: string | BranchDef;
}
```

### Comportements d'IA

| IA | Comportement | Exemples |
| --- | --- | --- |
| `drifter` | Dérive lente aléatoire (bruit de Perlin), aucune réaction au joueur | Molécules, bactéries, plancton |
| `grazer` | Erre ; fuit le joueur s'il est plus gros et à moins de `senseRadius` | Petits poissons, insectes, lézards |
| `hunter` | Patrouille ; poursuit le joueur s'il est mangeable et visible ; abandonne après 4 s ou si le joueur se cache ; fuit s'il est devenu plus petit | Grosses cellules, Anomalocaris, dinosaures |

Règles communes :

- Un `hunter` télégraphie son attaque : il s'arrête 0,4 s et ses yeux deviennent rouges avant de foncer. Cela laisse le temps à un enfant de réagir.
- Un `hunter` ne poursuit jamais plus de 2 secondes un joueur qui vient de perdre un cœur.
- Au maximum 2 `hunter` actifs à la fois en mode normal, 1 en mode facile.

### Valeurs de départ par étape (à régler)

| Étape | Taille joueur début → fin | Vitesse max joueur | Nourriture à l'écran | Prédateurs à l'écran | Vitesse prédateur |
| --- | --- | --- | --- | --- | --- |
| 1 Première cellule | 10 → 20 | 140 | 25 molécules | 0 | — |
| 2 Cellule à noyau | 12 → 28 | 160 | 20 | 3 | 120 |
| 3 Pluricellulaire | 16 → 36 | 150 | 20 | 3 | 110 |
| 4 Ver | 18 → 40 | 170 | 18 | 1 Anomalocaris (taille 70) | 150 |
| 5 Poisson | 20 → 50 | 220 | 20 | 3 | 200 |
| 6 Tétrapode | 24 → 50 | 200 eau / 110 terre | 20 | 3 | 190 |
| 7 Œuf à coquille | 22 → 45 | 180 | 18 | 3 | 160 |
| 8a Reptile | 26 → 55 | 90 froid / 200 chaud | 18 | 3 | 170 |
| 9a Dinosaure à plumes | 26 → 55 | 210 (plané 260) | 20 | 2 | 190 |
| 8b Petit mammifère | 18 → 35 | 200 | 20 | 2 (jour) / 0 (nuit) | 210 |
| 9b Primate | 28 → 55 | 180 | 20 fruits | 2 | 180 |

Règle d'équilibrage : un prédateur ne dépasse jamais **95 %** de la vitesse de sprint du joueur, pour qu'une fuite soit toujours possible.

### Dangers d'environnement

| Danger | Étapes | Effet |
| --- | --- | --- |
| Eau trop chaude | 1 | Zone rouge pulsante ; y rester 1 s retire 1 cœur |
| Courant | 1, 3 | Zone avec flèches animées qui pousse le joueur |
| Dessèchement | 6 | Jauge d'humidité ; vide → 1 cœur perdu, recharge au contact de l'eau |
| Froid | 8a | Hors des rochers ensoleillés, la vitesse baisse progressivement |
| Jour / nuit | 8b | Cycle de 40 s ; les dinosaures dorment la nuit |
| Débris de la météorite | Séquence ☄ | Ombres au sol 1 s avant chaque impact |

## 7. Contenu pédagogique

La science passe par quatre canaux courts et visuels (écran de transition, fiche découverte, frise du temps, arbre de la vie) ; aucun texte ne bloque le jeu plus de 10 secondes sans pouvoir être passé.

### Écran de transition « Des millions d'années plus tard… »

- Durée 4 s : la créature se dédouble en plusieurs générations qui défilent (silhouettes qui changent peu à peu), un compteur d'années tourne, puis la nouvelle forme apparaît.
- Phrase unique, par exemple : « Génération après génération, tes descendants ont appris à vivre ensemble : ils forment un seul être ! »
- C'est le moment qui enseigne que l'évolution se fait **sur des générations**, pas chez un individu.

### Fiche découverte (après chaque étape)

Format fixe, une carte illustrée :

- **Nom** de l'être (et d'un vrai fossile ou exemple quand il existe).
- **Quand** : position sur la frise.
- **Le savais-tu ?** : 1 à 2 phrases, moins de 30 mots au total.
- **Ce qui a changé** : une icône (noyau, mâchoire, poumon, plume…).
- Bouton « Écouter » : lecture audio du texte (voix enregistrée, ou `speechSynthesis` en français en solution de repli).

Exemples de contenu à valider par un relecteur scientifique :

| Étape | Exemple réel | Le savais-tu ? |
| --- | --- | --- |
| 1 | Premières cellules | Les premiers êtres vivants étaient si petits qu'il en faudrait des milliers pour couvrir une tête d'épingle. |
| 2 | Amibe, paramécie | Ta cellule a un noyau, comme toutes les cellules de ton corps. |
| 3 | Éponges, faune d'Ediacara | Les éponges existent encore aujourd'hui et ressemblent à ces premiers êtres pluricellulaires. |
| 4 | Faune de Burgess, Anomalocaris | Anomalocaris mesurait près d'un mètre : un géant à cette époque ! |
| 5 | Dunkleosteus | Les mâchoires ont permis aux poissons de manger de plus grosses proies. |
| 6 | Tiktaalik | Tiktaalik avait des nageoires avec des os, comme les débuts d'un bras. |
| 7 | Hylonomus | L'œuf à coquille garde le bébé au chaud et humide, même loin de l'eau. |
| 8a | Dimetrodon (voisin), premiers lézards | Les reptiles ont besoin du soleil pour réchauffer leur corps. |
| 9a | Archaeopteryx | Archaeopteryx avait des plumes, des dents et une longue queue osseuse. |
| 8b | Morganucodon | Les premiers mammifères étaient petits comme une souris. |
| ☄ | Chicxulub | Une météorite a fait disparaître les grands dinosaures il y a 66 millions d'années. |
| 9b | Premiers primates | Les primates ont des yeux vers l'avant pour bien juger les distances en sautant. |

### Frise du temps

- Barre fine en haut de l'écran pendant le jeu : un repère montre l'époque actuelle.
- Échelle **non linéaire** (logarithmique simplifiée), sinon les étapes 3 à 9 tiendraient dans les derniers 15 % de la barre. Une info-bulle l'explique : « Si toute l'histoire de la vie durait une journée, les dinosaures apparaîtraient vers 22 h 30 ! »

### Arbre de la vie (écran de collection)

- Accessible depuis le menu principal. Montre les 4 embranchements et les 5 fins sous forme d'arbre.
- Branches non découvertes : grisées, avec un « ? ».
- Toucher une étape déjà vue : rouvre sa fiche. Toucher un embranchement atteint : propose de rejouer à partir de là.
- Récompense : 5 fins débloquées → l'arbre se complète et un écran spécial explique que l'humain est une petite branche voisine de celle des grands singes.

### Ce que le jeu évite de dire

- « Plus évolué », « supérieur », « dominant », « le but de l'évolution ».
- « La créature décide d'évoluer » : les cartes mutation sont présentées comme « Et si tes descendants avaient… ? ».
- « L'homme descend du singe » : on dit « humains et grands singes ont des ancêtres communs ».

## 8. Interface, direction artistique et audio

Une interface minimale avec de grosses icônes, un style dessiné à la main généré en code (pas d'images à produire pour le MVP) et une musique d'ambiance qui change d'instrument à chaque étape.

### HUD en jeu

| Élément | Position | Contenu |
| --- | --- | --- |
| Jauge de croissance | Haut, centrée | Barre + icône de la nourriture + compteur « 7 / 10 » |
| Cœurs (descendants) | Haut gauche | 3 icônes |
| Énergie | Sous les cœurs (dès l'étape 2) | Petite barre jaune |
| Jauge spéciale | Sous l'énergie, selon l'étape | Humidité (6), chaleur (8a), jour/nuit (8b) |
| Frise du temps | Bord supérieur, très fine | Repère de l'époque |
| Pause | Haut droite | Bouton 56 px CSS minimum |
| Joystick et bouton Action | Bas gauche / bas droite (tactile uniquement) | Voir section 3 |
| Flèche de prédateur hors écran | Bord de l'écran | Petite flèche rouge pointant vers un `hunter` proche |

Taille de texte minimale : 18 px CSS sur mobile. Police arrondie très lisible (ex. Andika ou Nunito, embarquée).

### Écrans

1. **Titre** : animation de cellules en fond, boutons Jouer, Arbre de la vie, Options, Plein écran.
2. **Intro d'étape** : nom, époque, objectif en icône.
3. **Jeu**.
4. **Pause** : Reprendre, Recommencer l'étape, Options, Menu principal.
5. **Transition** « Des millions d'années plus tard… ».
6. **Fiche découverte**.
7. **Embranchement** : événement illustré puis deux grandes cartes à toucher, chacune avec un aperçu animé de la forme suivante.
8. **Épilogue de fin** puis **célébration** (confettis, « Tu as découvert la branche des oiseaux ! 3 / 5 »).
9. **Arbre de la vie**.
10. **Options** : volume musique et effets, mode facile, voix de lecture, réinitialiser la sauvegarde (avec confirmation).

### Direction artistique

- **Style** : formes douces et rondes, contour épais, couleurs vives mais pas saturées, yeux expressifs sur toutes les créatures (même les cellules), comme dans Spore.
- **Rendu procédural** : chaque créature est dessinée en code à partir de primitives (cercles, courbes de Bézier, segments articulés). Animation par ondulation sinusoïdale du corps et des nageoires, clignement des yeux aléatoire. Avantages : aucun asset à produire, taille et couleur ajustables en continu pendant la croissance.
- **Décors** : fond en dégradé par milieu, 2 à 3 couches de parallaxe (particules en suspension dans l'eau, plantes, arbres).
- **Palettes** : eau primitive vert-bleu, Cambrien turquoise, marécage vert olive, désert ocre, Jurassique vert profond, sous-bois nocturne bleu nuit, après météorite gris puis renaissance verte.
- **Prédateurs** : jamais effrayants ni sanglants. Quand le joueur est mangé : animation « gloups » comique, aucun sang.
- **Lisibilité** : contour vert / blanc / rouge (section 4) toujours visible, avec en plus un symbole pour les daltoniens (petite fourchette = mangeable, point d'exclamation = danger).

### Audio

- **Musique** : une boucle calme par milieu ; l'instrumentation s'enrichit au fil de l'évolution (sons de bulles et nappes au début, percussions sur terre, chants d'oiseaux et cordes à la fin). Couche de tension ajoutée en fondu quand un `hunter` poursuit le joueur.
- **Effets** : bouchée (« miam » ou « plop »), croissance (arpège montant), cœur perdu (« bonk » doux), palier 50 % (petite fanfare), transformation (accord long), carte choisie.
- **Voix** : lecture des fiches et des objectifs (option activée par défaut), utile pour les lecteurs débutants.
- Le son démarre au premier geste de l'utilisateur (contrainte des navigateurs mobiles) ; coupé automatiquement quand l'onglet est caché.

## 9. Sauvegarde, accessibilité et performance

La progression est sauvegardée automatiquement en local, le jeu reste jouable sans lecture et sans couleur, et il doit tenir 60 images par seconde sur un téléphone d'entrée de gamme de 2021.

### Sauvegarde

- Stockage `localStorage` sous la clé `evolution.save.v1`, encapsulé dans `try/catch` (si indisponible, le jeu fonctionne sans sauvegarde).
- Sauvegarde automatique à la fin de chaque étape et à chaque choix d'embranchement ; jamais en cours d'étape.
- Contenu :

```ts
interface SaveV1 {
  version: 1;
  currentStage: string | null;   // reprise de la partie en cours
  path: string[];                // étapes et choix de la partie en cours
  endingsUnlocked: string[];     // 'fish' | 'reptile' | 'bird' | 'ape' | 'mammal'
  branchesReached: string[];     // 'A' | 'B' | 'C' | 'D'
  cardsSeen: string[];           // fiches découverte vues
  settings: { music: number; sfx: number; easy: boolean; voice: boolean };
}
```

- Bouton « Continuer » sur l'écran titre si `currentStage` n'est pas nul.

### Accessibilité

- Information jamais portée par la couleur seule (symboles en plus des contours, section 8).
- Lecture vocale des textes, sous-titres pour toute narration.
- Option « Mouvements réduits » : supprime le tremblement d'écran et les flashs ; activée automatiquement si `prefers-reduced-motion`.
- Aucun clignotement à plus de 3 Hz.
- Navigation complète des menus au clavier (flèches + Entrée) et focus visible.
- Pause automatique si l'onglet perd le focus ou si le téléphone est verrouillé.

### Performance

- Budget : 60 i/s sur un téléphone Android milieu de gamme de 2021 ; au maximum 150 entités actives par étape.
- Collisions : grille spatiale (cellules de 128 unités), pas de test tous-contre-tous.
- Particules en pool réutilisé, pas d'allocation dans la boucle de jeu.
- Ne dessiner que ce qui est dans le champ de la caméra (+ marge de 100 unités).
- Poids total du jeu inférieur à 15 Mo (musique en OGG/MP3 compressés), premier chargement inférieur à 3 s en 4G.
- Si les i/s tombent sous 45 pendant 3 s : réduire automatiquement les particules et la parallaxe.

## 10. Plan de développement pour Claude Code

Le développement se fait en 7 jalons ; chaque jalon produit une version jouable, et Claude Code ne passe au suivant que lorsque tous les critères d'acceptation du jalon sont vérifiés.

### Consignes générales pour Claude Code

- Lire ce document en entier avant d'écrire du code ; en cas de doute, choisir l'option la plus simple et le noter dans `NOTES.md`.
- Respecter la stack et la structure de la section 2. Tout contenu (étapes, valeurs, textes) va dans des fichiers de données, pas dans le code des systèmes.
- Écrire les tests Vitest pour la logique pure : règle de taille, croissance, collisions, transitions d'étapes, sauvegarde.
- À la fin de chaque jalon : `npm run build` sans erreur, `npm test` vert, tester au clavier **et** en émulation mobile (DevTools, iPhone 12 et Pixel 5, paysage et portrait).
- Ne pas ajouter de dépendance non listée sans le justifier dans `NOTES.md`.

### Jalons

1. **M0 — Socle technique.** Projet Vite + TypeScript, canvas plein fenêtre avec redimensionnement et `devicePixelRatio`, boucle à pas fixe, gestion des scènes, entrées clavier + joystick virtuel + bouton Action, caméra, bouton plein écran.
   - *Accepté si* : un cercle se déplace avec inertie aux flèches, ZQSD, WASD et au joystick ; plein écran fonctionne sur PC ; aucun défilement ni zoom parasite sur mobile ; 60 i/s.
2. **M1 — Tranche verticale : étapes 1 et 2.** Rendu procédural de la cellule, nourriture `drifter`, prédateurs `hunter`, règle de taille 80 % / 120 % avec contours colorés, jauge de croissance, cœurs, invincibilité, dangers chaleur et courant, écran de transition, fiche découverte, écran titre et pause.
   - *Accepté si* : on peut jouer de la première cellule jusqu'à la fin de l'étape 2 ; un prédateur devient mangeable quand le joueur grossit ; perdre 3 cœurs relance l'étape avec la moitié de la jauge.
3. **M2 — Branche aquatique : étapes 3 à 5, embranchement A, fin Poisson.** Capacités coller, s'enfouir, mordre ; IA `grazer` ; écran d'embranchement à cartes ; épilogue et célébration.
   - *Accepté si* : une partie complète jusqu'à la fin Poisson est jouable en 8 à 12 minutes.
4. **M3 — Sortie de l'eau et lignée reptile : étapes 6, 7, 8a, 9a, embranchements B et C, fins Reptile et Oiseau.** Jauges humidité et chaleur, nids, planer.
   - *Accepté si* : les fins Reptile et Oiseau sont atteignables ; la jauge d'humidité et la jauge de chaleur ont un effet visible sur le jeu.
5. **M4 — Lignée mammifère : étape 8b, séquence météorite, embranchement D, étape 9b, fins Grand singe et Grand mammifère (baleine).** Cycle jour/nuit, terriers, branches.
   - *Accepté si* : les 5 fins sont atteignables ; la séquence météorite dure 45 s et ne peut pas être perdue définitivement.
6. **M5 — Progression et pédagogie.** Sauvegarde `SaveV1`, bouton Continuer, frise du temps, arbre de la vie avec reprise à un embranchement, toutes les fiches de la section 7, lecture vocale, options, mode facile.
   - *Accepté si* : fermer et rouvrir le navigateur conserve les fins débloquées ; depuis l'arbre, on rejoue un embranchement atteint sans refaire les étapes communes.
7. **M6 — Finition et publication.** Musique et effets, PWA hors ligne, accessibilité (section 9), optimisation, réglage des valeurs, astuce iOS « Ajouter à l'écran d'accueil ».
   - *Accepté si* : score Lighthouse PWA valide ; le jeu se lance hors ligne après une première visite ; en émulation mobile avec ralentissement CPU ×4, le jeu reste au-dessus de 45 i/s.

### Prompt de démarrage à coller dans Claude Code

```
Tu vas développer le jeu « Évolution » décrit dans GAME_DESIGN.md (à la racine du projet).
Lis le document en entier. Commence par le jalon M0 de la section 10, puis M1.
À la fin de chaque jalon : vérifie les critères d'acceptation, lance npm run build et npm test,
résume ce qui est fait et ce qui reste dans NOTES.md, puis attends ma validation avant le jalon suivant.
```

Pour l'utiliser : exporter ce document en Markdown, l'enregistrer sous `GAME_DESIGN.md` à la racine d'un dossier vide, puis lancer Claude Code dans ce dossier avec le prompt ci-dessus.
