# Activer le classement mondial (Firebase)

Tous les jeux de La Cabane à Jeux partagent le **même** système de classement
mondial, via une petite base de données gratuite (Firebase Firestore). Il n'y
a qu'**une seule configuration à faire**, une seule fois : tous les jeux
actuels (Mémo, Quiz des Drapeaux) et tous les futurs jeux en profiteront
automatiquement.

Temps nécessaire : environ 10 minutes. Coût : gratuit (le forfait gratuit de
Firebase, "Spark", est largement suffisant pour un site comme celui-ci — des
dizaines de milliers de lectures/écritures par jour).

## Étape 1 — Créer un projet Firebase

1. Va sur **https://console.firebase.google.com** et connecte-toi avec un
   compte Google.
2. Clique sur **"Ajouter un projet"**.
3. Donne-lui un nom, par exemple `cabane-a-jeux`.
4. Tu peux désactiver Google Analytics (pas utile ici) puis clique sur
   **"Créer le projet"**.

## Étape 2 — Ajouter une application web

1. Une fois dans le projet, clique sur l'icône **`</>`** ("Web") sur la page
   d'accueil du projet pour ajouter une application web.
2. Donne-lui un surnom, par exemple `cabane-a-jeux-web`.
3. Tu n'as **pas** besoin de cocher "Configurer aussi Firebase Hosting".
4. Clique sur **"Enregistrer l'application"**. Firebase affiche alors un bloc
   de code avec un objet `firebaseConfig` qui ressemble à ça :

```js
const firebaseConfig = {
  apiKey: "AIzaSyDtzASxH9o2FmxMESZ6GfGM0kuReWSzYis",
  authDomain: "cabane-a-jeux-238cc.firebaseapp.com",
  projectId: "cabane-a-jeux-238cc",
  storageBucket: "cabane-a-jeux-238cc.firebasestorage.app",
  messagingSenderId: "351077499665",
  appId: "1:351077499665:web:7cd13cba7aaf1d2ab042b0"
};
```

5. **Copie ces valeurs** et colle-les dans le fichier `shared/firebase-config.js`
   du site (à la place des `"REMPLACE_MOI"`).

## Étape 3 — Activer Firestore (la base de données)

1. Dans le menu de gauche de la console Firebase, va dans **Build → Firestore
   Database**.
2. Clique sur **"Créer une base de données"**.
3. Choisis une région proche de tes joueurs (ex: `eur3 (europe-west)` pour la
   France).
4. Choisis le mode **"Production"** (on configure les règles nous-mêmes juste
   après).

## Étape 4 — Configurer les règles de sécurité

Toujours dans Firestore, va dans l'onglet **"Règles"** et remplace tout le
contenu par ceci :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard_scores/{scoreId} {
      // Tout le monde peut lire les classements
      allow read: if true;

      // On peut seulement AJOUTER un score, jamais le modifier ou le
      // supprimer, et seulement s'il respecte ce format
      allow create: if request.resource.data.keys().hasOnly(['game', 'name', 'value', 'createdAt'])
                    && request.resource.data.game is string
                    && request.resource.data.game.size() > 0
                    && request.resource.data.game.size() <= 40
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 20
                    && request.resource.data.value is number
                    && request.resource.data.value > 0
                    && request.resource.data.value < 100000;

      allow update, delete: if false;
    }
  }
}
```

Clique sur **"Publier"**.

> ℹ️ Ces règles empêchent de modifier ou supprimer un score une fois envoyé,
> et vérifient que chaque score a la bonne forme. Comme le site n'a pas de
> compte joueur (pas de mot de passe), n'importe quel visiteur peut en
> théorie enregistrer un score — comme il n'y a pas de données sensibles en
> jeu (juste un pseudo et un score), c'est un compromis très correct pour un
> site de jeux pour enfants. Si un jour tu veux empêcher la triche plus
> sérieusement, il faudrait ajouter une connexion (Firebase Auth).

## Étape 5 — Créer l'index nécessaire

Le classement fait une requête un peu particulière (filtrer par jeu **et**
trier par score), ce qui demande un "index composite" à Firestore.

**Le plus simple** : lance le site, ouvre un jeu, termine une partie et
enregistre un score. Si l'index n'existe pas encore, Firebase Firestore
affichera une erreur dans la console du navigateur (touche F12 → onglet
"Console") contenant un lien du type
`https://console.firebase.google.com/.../indexes?create_composite=...`.
Clique sur ce lien, puis sur **"Créer l'index"** dans la page qui s'ouvre.
Il faut environ 1 minute pour que l'index soit prêt.

Tu peux aussi le créer à la main : dans Firestore → onglet **"Index"** →
**"Créer un index"** :
- Collection : `leaderboard_scores`
- Champs : `game` (Croissant), puis `value` (Croissant)

## Étape 6 — Mettre à jour le site en ligne

Une fois `shared/firebase-config.js` rempli avec tes vraies valeurs :

1. Récupère le fichier mis à jour.
2. Sur GitHub, va dans le dossier `shared/` de ton dépôt (ou crée-le s'il
   n'existe pas) et mets à jour `firebase-config.js` (Add file → Upload
   files, en écrasant l'ancien).
3. Attends que GitHub Pages republie le site (1-2 minutes), puis teste un
   jeu jusqu'au bout : le classement mondial doit maintenant se remplir pour
   de vrai, visible par tous les visiteurs du site.

## Ajouter le classement à un futur jeu

Depuis n'importe quel nouveau jeu, deux lignes suffisent :

```js
import { fetchTopScores, submitScore, isLeaderboardConfigured } from "../../shared/leaderboard.js";

// Enregistrer un score (plus petit = meilleur : temps, coups, erreurs...)
await submitScore("nom-du-jeu", "Pseudo", 42);

// Récupérer le top 20
const top20 = await fetchTopScores("nom-du-jeu", 20);
```

Chaque jeu choisit un identifiant unique (`"drapeaux"`, `"memory"`, etc.) : un
même identifiant = un même classement partagé.
