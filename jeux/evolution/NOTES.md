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
| « Aucun lien externe » | Un seul lien sortant, dans le menu pause : « Retour à la Cabane » | Navigation du site |
| PWA (`vite-plugin-pwa`) | Reportée au jalon M6, à faire à la main (manifest + service worker) | |

Autres choix simples (consigne : « en cas de doute, l'option la plus simple ») :

- **Clavier** : on lit `e.code` (position physique de la touche). ZQSD sur AZERTY et WASD sur QWERTY donnent les mêmes codes, donc une seule table.
- **Joystick** : s'il n'y a pas encore de bouton Action (étapes 1 et 2), le joystick peut naître **n'importe où** sur l'écran, pas seulement dans la moitié gauche. Plus simple pour un enfant.
- **Physique** : la vitesse visée est proportionnelle à l'inclinaison, et l'accélération est limitée (inertie). Quand on lâche, la `friction` du milieu freine (part de la vitesse perdue en 1 s : eau 0,6).
- **Souris** : pas utilisée pour se déplacer pour l'instant (le document la dit « en option »).
- **Pause automatique** quand l'onglet est caché ou perd le focus (prévu en section 9, fait dès M0 car c'est simple).
- **`?debug`** dans l'URL : affiche les images par seconde et expose `window.__evolution` pour les tests.

## Jalon M0 — Socle technique ✅ (en attente de validation)

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
- Caméra qui suit le joueur en douceur, reste dans l'arène, et zoome pour montrer 1 600 × 900 unités en paysage ou 900 de large en portrait (`core/camera.js`).
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

## Jalons suivants

- **M1 — Étapes 1 et 2** (prochain) : vraie cellule et cellule à noyau, nourriture `drifter`, prédateurs `hunter`, règle de taille 80 % / 120 % avec contours colorés et symboles, jauge de croissance, cœurs, invincibilité, eau trop chaude, courants, écran « Des millions d'années plus tard… », fiche découverte, écran titre, pause complète.
- M2 à M6 : voir la section 10 du document.

### Questions ouvertes pour M1

- **Taille à l'écran.** À l'étape 1, le joueur a un rayon de 10 unités, et la vue montre 1 600 unités de large. Sur un téléphone en paysage (844 px de large), cela donne une cellule d'environ **5 px de rayon** : trop petit pour un enfant. Proposition : faire suivre le zoom de la caméra à la taille du joueur, comme dans Spore (vue d'environ 80 rayons de joueur de large), avec 1 600 × 900 comme valeur de référence pour la taille moyenne. Ou bien multiplier toutes les tailles par 2.
- **Carte sur la page d'accueil.** Pas encore ajoutée (section Nature, liste JSON-LD, nombre de jeux, `sitemap.xml`). Prévu dès que le jeu est jouable (fin de M1), pour ne pas publier un bac à sable.
