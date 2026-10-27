# Évolution — notes de développement

Suivi des jalons du document de conception (`Évolution — Game Design Document.md`, à la racine de `kids-hub/`, section 10).

## Adaptations au site La Cabane à Jeux

Le document de conception prévoit Vite + TypeScript + Vitest + PWA. Le jeu vit dans le site La Cabane à Jeux, qui est 100 % statique (pas de build, et pas de Node sur la machine de dev). On garde donc l'architecture et les principes du document, avec ces changements :

| Prévu dans le document | Choix retenu | Pourquoi |
| --- | --- | --- |
| TypeScript strict + Vite | JavaScript (modules ES natifs), sans build | Convention du site, pas de Node |
| `npm run build` | Aucun build : les modules se chargent tels quels | Une erreur de syntaxe ou d'import fait échouer les tests (la page ne démarre pas) |
| `npm test` (Vitest) | `python jeux/evolution/tests/run_tests.py` | Lance Edge sans fenêtre sur `tests/` (logique pure) et `tests/smoke.html` (vrai jeu piloté par des événements clavier et tactiles simulés) |
| `src/…` | `js/…` avec les mêmes sous-dossiers (`core/`, `scenes/`, `stages/`, `systems/`, `render/`, `content/`) | Le jeu est servi à `/jeux/evolution/` |
| `content/fr.json` | `content/fr.js` (module) | Pas besoin de `fetch`, ça marche aussi hors ligne |
| Police embarquée (Andika / Nunito) | Baloo 2 + Quicksand (Google Fonts) | Mêmes polices que le reste du site |
| « Aucun lien externe » | Un seul lien sortant, sur l'écran titre : « Retour à la Cabane » | Navigation du site |
| PWA (`vite-plugin-pwa`) | Reportée au jalon M6, à faire à la main (manifest + service worker) | |

Autres choix simples (consigne : « en cas de doute, l'option la plus simple ») :

- **Clavier** : on lit `e.code` (position physique de la touche). ZQSD sur AZERTY et WASD sur QWERTY donnent les mêmes codes, donc une seule table.
- **Joystick** : s'il n'y a pas encore de bouton Action (étapes 1 et 2), le joystick peut naître **n'importe où** sur l'écran, pas seulement dans la moitié gauche. Plus simple pour un enfant.
- **Physique** : la vitesse visée est proportionnelle à l'inclinaison, et l'accélération est limitée (inertie). Quand on lâche, la `friction` du milieu freine (part de la vitesse perdue en 1 s : eau 0,6).
- **Souris** : pas utilisée pour se déplacer pour l'instant (le document la dit « en option »).
- **Pause automatique** quand l'onglet est caché ou perd le focus (prévu en section 9, fait dès M0 car c'est simple).
- **`?debug`** dans l'URL : affiche les images par seconde et expose `window.__evolution` pour les tests. En plus : `&etape=nucleus` (aller à une étape), `&fiche=cell` (aller à une fiche), `&seed=7` (hasard reproductible).
- **Zoom selon la taille du joueur** (validé après M0) : on voit toujours environ 50 rayons de joueur de large en paysage, comme dans Spore. Le format 1 600 × 900 du document correspond à un joueur de rayon 32. Sur un téléphone, la première cellule fait environ 14 px de rayon.
- **Ordre fiche / transition** : la fiche découverte décrit l'être de l'étape **qu'on vient de finir** (ex. « Cellule à noyau » après l'étape 2). Elle vient donc **avant** l'écran « Des millions d'années plus tard… », qui montre la nouvelle forme puis enchaîne sur l'intro de l'étape suivante. Le document met la fiche après la transition, mais elle aurait alors parlé de la forme d'avant.
- **Sons** : quelques bruitages synthétisés dès M1 (bouchée, cœur perdu, palier, croissance), avec un réglage « Son : oui / non » dans le menu pause (clé `evolution-son`). La musique et le réglage du volume restent pour M5 et M6.
- **Lecture vocale** : le bouton « Écouter » des fiches utilise la synthèse vocale du navigateur (`speechSynthesis`, en français). Il est caché si le navigateur ne la propose pas.
- **Captures d'écran** : `tests/capture.py` photographie le jeu en temps réel. L'option `--screenshot` d'Edge fige les écrans de jeu animés.

## Jalon M0 — Socle technique ✅ (validé)

Fait :

- Canvas plein fenêtre (`100dvh`), redimensionné à chaque `resize`, `orientationchange` et changement de `visualViewport`, avec `devicePixelRatio` plafonné à 2 (`core/screen.js`).
- Boucle à pas fixe de 60 Hz, rendu interpolé, rattrapage plafonné après une longue pause (`core/loop.js`).
- Gestion des scènes (`core/scenes.js`).
- Entrées (`core/input.js`) :
  - clavier : flèches / ZQSD / WASD, Maj = sprint, Espace = action, Entrée = valider, Échap / P = pause, F = plein écran ;
  - joystick virtuel flottant (rayon 60 px, zone morte de 10 %, analogique, sprint si poussé à fond plus de 0,3 s) ;
  - bouton Action de 96 px, avec retour visuel et vibration de 15 ms ;
  - multi-touch : joystick et bouton fonctionnent en même temps ;
  - les aides affichées suivent la dernière entrée utilisée ; les commandes tactiles restent cachées tant que l'écran n'a pas été touché.
- Caméra qui suit le joueur en douceur, reste dans l'arène, et zoome pour montrer 1 600 × 900 unités en paysage ou 900 de large en portrait (`core/camera.js`). Remplacé en M1 par un zoom qui suit la taille du joueur.
- Déplacement avec inertie, diagonales normalisées, rotation lissée à 8 rad/s (`systems/movement.js`).
- Plein écran : bouton et touche F (`requestFullscreen`). Sur iPhone, l'astuce « Sur l'écran d'accueil » s'affiche à la place.
- Pas de zoom ni de défilement parasite : `touch-action: none`, `user-scalable=no`, blocage de `touchmove`, `gesturestart` et du double-tape.
- Menu pause minimal : Reprendre, Plein écran, Retour à la Cabane.
- Scène « bac à sable » : une cellule (dessin procédural, yeux qui clignent) dans l'océan primitif, avec des particules en parallaxe.
- Tests : 19 tests de logique et 14 tests de fumée sur le vrai jeu, tous verts.

Critères d'acceptation :

| Critère | État |
| --- | --- |
| Un cercle se déplace avec inertie aux flèches, ZQSD, WASD et au joystick | ✅ Vérifié par les tests de fumée (clavier et doigt simulés) |
| Le plein écran fonctionne sur PC | ⚠️ Bouton et touche F branchés. Le navigateur exige un vrai geste de l'utilisateur, donc **c'est à vérifier à la main** |
| Aucun défilement ni zoom parasite sur mobile | ✅ Pas de débordement de page (test). ⚠️ Le pincement et le double-tape sont **à vérifier sur un vrai téléphone** |
| 60 i/s | ✅ 55 i/s ou plus dans Edge sans fenêtre (test). ⚠️ À confirmer sur un téléphone avec `?debug` |

Limites des tests sur cette machine : Edge sans fenêtre ne fait ni vrai tactile, ni émulation iPhone 12 / Pixel 5, ni plein écran. Paysage 844 × 390 et portrait 500 × 844 ont été vérifiés par captures d'écran.

**À tester à la main** (avec `python -m http.server 8000`, puis http://localhost:8000/jeux/evolution/?debug) :

- au clavier, sur PC : déplacement, Maj, Espace, Échap, F ;
- en émulation mobile dans les DevTools (iPhone 12 et Pixel 5, paysage et portrait) : joystick, bouton Action, pas de zoom.

## Jalon M1 — Tranche verticale : étapes 1 et 2 ✅ (en attente de validation)

Parcours jouable : écran titre → intro de l'étape 1 → jeu → animation de croissance → fiche « Première cellule » → « Des millions d'années plus tard… » → intro de l'étape 2 → jeu → fiche « Cellule à noyau » → écran « À suivre… ».

Fait :

- **Simulation sans dessin** (`systems/world.js`) : joueur, créatures, dangers et règles. Le monde produit des événements (`eat`, `hurt`, `milestone`, `complete`, `dead`) que la scène transforme en sons, particules et messages. Les tests jouent directement dessus.
- **Règle de taille** (`systems/rules.js`) : moins de 80 % = mangeable (contour vert + petite fourchette), plus de 120 % = dangereux (contour rouge + « ! »), entre les deux = neutre (blanc, on se repousse). Les contours changent en direct quand le joueur grandit.
- **Croissance** : +1 par bouchée (+3 à +5 pour une amibe), le corps grossit doucement et la caméra recule. La jauge en haut affiche l'icône de la nourriture et « 7 / 10 ».
- **Cœurs « descendants »** : 3 par étape. Un cœur perdu donne 2 s d'invincibilité, avec un clignotement à 2,5 Hz (jamais plus de 3 Hz), un « Gloups ! » et le message « Un autre prend le relais ». Sans cœurs, l'écran « La vie trouve toujours un chemin ! » s'affiche et l'étape reprend avec la moitié de la jauge.
- **Énergie** (étape 2) : se vide en 2,5 s de sprint et se recharge en 3 s. Une bouchée en rend un quart. Une fois vide, il faut en retrouver un quart pour resprinter.
- **IA** (`systems/ai.js`) :
  - `drifter` : dérive au hasard (molécules, bactéries) ;
  - `hunter` : patrouille, s'arrête 0,4 s avec les yeux rouges avant de foncer, prend un élan (×1,5 pendant 0,8 s), abandonne après 4 s, se calme 2 s après avoir attrapé le joueur et fuit quand il est devenu plus petit ;
  - au plus 2 chasseurs actifs à la fois (1 en mode facile, déjà prévu dans le code mais sans option avant M5).
- **Dangers** (`systems/hazards.js`) : eau trop chaude autour de 3 cheminées hydrothermales (zone rouge qui pulse à 1 Hz, « ! », anneau rouge qui se remplit en 1 s autour du joueur) et un courant (bande avec des chevrons qui défilent).
- **Étape 1** : 60 molécules dans l'arène (le document en prévoit 25, mais avec le zoom selon la taille, il n'en restait qu'une ou deux à l'écran).
- **Étape 2** : 45 bactéries, 2 amibes moyennes (17 et 20) qui passent du rouge au vert vers 60–80 % de la jauge, et 1 grosse amibe (36) qui reste dangereuse jusqu'au bout. À 50 % : « Attention, une cellule rapide arrive ! » (taille 26, vitesse 140).
- **Équilibrage** : la vitesse maximale de chaque prédateur (élan compris) reste sous 95 % du sprint du joueur (test automatique).
- **Flèche rouge** au bord de l'écran vers un prédateur dangereux proche mais hors de vue.
- **Grille spatiale** de 128 unités pour les contacts. Particules et textes flottants viennent de réserves fixes, sans allocation pendant la partie.
- **Écrans** :
  - titre : cellules animées, Jouer, Plein écran, Retour à la Cabane ;
  - intro d'étape : époque, nom, objectif avec icône, danger ; se ferme seule après 4 s ou d'un toucher ;
  - pause complète : Reprendre, Recommencer l'étape, Son, Plein écran, Menu principal ;
  - fiche découverte : portrait animé, « Quand ? », « Le savais-tu ? », « Ce qui a changé », Écouter, Continuer ; sur deux colonnes sur un téléphone en paysage ;
  - transition de 4 s : 6 générations qui changent peu à peu, compteur d'années, passable après 1,2 s ;
  - écran « À suivre… ».
- **Navigation au clavier dans les menus** : les flèches passent d'un bouton à l'autre, Entrée et Espace valident.
- **Textes** dans `content/fr.js`, avec espaces insécables ajoutées à l'affichage (`typo()`). Un test vérifie que les phrases font moins de 15 mots.
- **Page d'accueil** : carte « Évolution » dans la section Nature, entrée dans la liste JSON-LD, compteur passé de 15 à 16 jeux, URL ajoutée à `sitemap.xml`.

Critères d'acceptation :

| Critère | État |
| --- | --- |
| On peut jouer de la première cellule jusqu'à la fin de l'étape 2 | ✅ Test de fumée dans le vrai jeu : titre → étape 1 → fiche → transition → étape 2 → fiche → « À suivre ». Deux bots (ils fuient le rouge et l'eau chaude, et vont vers le vert) finissent l'étape 1 en moins de 3 min et l'étape 2 en moins de 4 min, sur 3 graines de hasard chacune |
| Un prédateur devient mangeable quand le joueur grossit | ✅ Test logique (amibes 17 et 20 : rouges au début, vertes à la fin) et test de fumée (on mange une amibe en fin d'étape 2) |
| Perdre 3 cœurs relance l'étape avec la moitié de la jauge | ✅ Test logique et test de fumée (7 → 3, avec 3 cœurs) |

Tests : **52 tests de logique et 21 tests de fumée, tous verts** (`python jeux/evolution/tests/run_tests.py`, lancé deux fois de suite). Captures vérifiées à l'œil en 1 280 × 720 et 844 × 390 (téléphone en paysage) avec `tests/capture.py`.

**À tester à la main** (avec `python -m http.server 8000`, puis http://localhost:8000/jeux/evolution/) :

- le ressenti : vitesse, inertie, difficulté de l'étape 2 (les valeurs sont dans `stages/*.js` et `stages/creatures.js`) ;
- sur un vrai téléphone : joystick, plein écran (Android), astuce « écran d'accueil » (iPhone), son et vibration ;
- le bouton « Écouter » (la voix dépend du navigateur).

### Contenu à faire valider par un relecteur scientifique

Deux phrases du document ont été corrigées, car elles étaient inexactes :

- Étape 1 : « il en faudrait **des milliers** pour couvrir une tête d'épingle » devient « **un million** tiendraient sur une tête d'épingle ». Une cellule de 1 à 2 µm sur une tête d'épingle d'environ 1,5 mm donne de l'ordre du million.
- Étape 2 : « comme **toutes** les cellules de ton corps » devient « comme **presque toutes** ». Les globules rouges n'ont pas de noyau.

## Jalons suivants

- **M2 — Branche aquatique** (prochain) : étapes 3 à 5, embranchement A, fin Poisson. Capacités coller, s'enfouir, mordre ; IA `grazer` ; bouton Action ; écran d'embranchement ; épilogue et célébration. L'écran « À suivre… » sera alors remplacé par la suite.
- M3 à M6 : voir la section 10 du document.

### Question ouverte

- **Publication.** Le jeu est sur la page d'accueil depuis M1, mais il s'arrête après l'étape 2 (écran « À suivre… »). Pour attendre un jeu plus complet avant de le mettre en ligne, il suffit de ne pas pousser `index.html` et `sitemap.xml`, ou de demander le retrait de la carte.
