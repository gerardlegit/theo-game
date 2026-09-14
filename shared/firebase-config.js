// ============================================================================
// CONFIGURATION FIREBASE — à remplacer par les identifiants de TON projet.
// ============================================================================
//
// Comment obtenir ces valeurs (gratuit, 5 minutes) :
//   1. Va sur https://console.firebase.google.com
//   2. Clique sur "Ajouter un projet", donne-lui un nom (ex: "cabane-a-jeux")
//   3. Une fois le projet créé, clique sur l'icône Web "</>" pour ajouter une
//      application web
//   4. Donne-lui un surnom (ex: "cabane-a-jeux-web"), pas besoin de Firebase
//      Hosting
//   5. Firebase t'affiche un objet firebaseConfig : copie-colle ses valeurs
//      ci-dessous, à la place de "REMPLACE_MOI"
//   6. Active Firestore : dans le menu de gauche, "Build" → "Firestore
//      Database" → "Créer une base de données" → mode production → choisis
//      une région proche de toi
//   7. Configure les règles de sécurité comme indiqué dans FIREBASE-SETUP.md
//
// Ce fichier est chargé par tous les jeux du site (via shared/leaderboard.js),
// tu n'as besoin de le modifier qu'UNE SEULE FOIS pour que le classement
// mondial fonctionne partout.
// ============================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyDtzASxH9o2FmxMESZ6GfGM0kuReWSzYis",
  authDomain: "cabane-a-jeux-238cc.firebaseapp.com",
  projectId: "cabane-a-jeux-238cc",
  storageBucket: "cabane-a-jeux-238cc.firebasestorage.app",
  messagingSenderId: "351077499665",
  appId: "1:351077499665:web:7cd13cba7aaf1d2ab042b0",
};
