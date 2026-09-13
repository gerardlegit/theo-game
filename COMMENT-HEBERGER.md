# Mettre le site en ligne gratuitement

Je n'ai pas d'accès direct à Internet depuis mon environnement, donc je ne peux pas
déployer le site moi-même — mais voici la manière la plus simple de le faire,
en 2 minutes, sans rien installer.

## Option la plus simple : Netlify Drop

1. Va sur **https://app.netlify.com/drop**
2. Fais glisser le dossier `kids-hub` (celui qui contient `index.html`) directement
   dans la page.
3. C'est en ligne ! Netlify te donne une adresse du type
   `https://un-nom-aleatoire.netlify.app`.
4. Optionnel : crée un compte gratuit pour choisir un nom personnalisé et remettre
   le site à jour plus tard (bouton "Deploy" à nouveau avec le dossier modifié).

## Alternative : GitHub Pages (si tu veux gérer le code avec Git)

1. Crée un compte sur **https://github.com** (gratuit).
2. Crée un nouveau dépôt (repository), par ex. `cabane-a-jeux`.
3. Mets tous les fichiers du dossier `kids-hub` dedans (via l'interface web,
   "Add file → Upload files", ou via `git push`).
4. Dans le dépôt : **Settings → Pages → Branch: main → Save**.
5. Le site sera accessible à `https://ton-nom.github.io/cabane-a-jeux/`.

## Alternative : Vercel

1. Va sur **https://vercel.com**, crée un compte gratuit.
2. "Add New Project" → importe le dossier ou le dépôt GitHub.
3. Déploiement automatique, avec une URL `https://ton-projet.vercel.app`.

## Ajouter un nouveau jeu plus tard

1. Crée un nouveau dossier dans `jeux/`, par exemple `jeux/coloriage/`.
2. Mets-y ton `index.html` (et ses fichiers CSS/JS si besoin).
3. Dans `index.html` (la page d'accueil), remplace une des cartes "Bientôt" par un
   lien `<a class="card ..." href="jeux/coloriage/index.html">` en t'inspirant de
   la carte "Mémo Animaux".
4. Pour donner à ton jeu un classement mondial, importe simplement
   `shared/leaderboard.js` (voir FIREBASE-SETUP.md, section "Ajouter le
   classement à un futur jeu").
5. Redéploie (glisser-déposer à nouveau sur Netlify, ou push sur GitHub).

## Classement mondial (Firebase)

Le site inclut un classement mondial partagé par tous les jeux (dossier
`shared/`). Pour l'activer, suis le guide **FIREBASE-SETUP.md** à la racine
du projet — 10 minutes, gratuit, à faire une seule fois pour que tous les
jeux (actuels et futurs) en profitent.
