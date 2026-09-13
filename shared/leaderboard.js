// ============================================================================
// CLASSEMENT MONDIAL — module partagé par tous les jeux de La Cabane à Jeux.
//
// Un seul document Firestore = un seul score, dans la collection
// "leaderboard_scores", avec un champ "game" qui identifie le jeu
// (ex: "drapeaux", "memory"). Ça permet à chaque jeu, présent ou futur,
// d'avoir son propre classement mondial sans rien configurer de plus.
//
// Convention : plus la "value" est petite, meilleur est le score
// (un temps en secondes, un nombre de coups, etc.)
// ============================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const COLLECTION_NAME = "leaderboard_scores";

const isConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("REMPLACE_MOI");

let dbInstance = null;

function getDb() {
  if (!isConfigured) return null;
  if (!dbInstance) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

/** Indique si le fichier shared/firebase-config.js a été rempli. */
export function isLeaderboardConfigured() {
  return isConfigured;
}

/**
 * Récupère les meilleurs scores d'un jeu, triés du plus petit au plus grand.
 * @param {string} gameId - identifiant du jeu, ex: "drapeaux"
 * @param {number} max - nombre de scores à récupérer (top N)
 * @returns {Promise<Array<{name: string, value: number}>>}
 */
export async function fetchTopScores(gameId, max = 20) {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("game", "==", gameId),
      orderBy("value", "asc"),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Erreur lors du chargement du classement :", err);
    return [];
  }
}

/**
 * Enregistre un score dans le classement mondial.
 * @param {string} gameId - identifiant du jeu, ex: "drapeaux"
 * @param {string} name - pseudo du joueur (20 caractères max)
 * @param {number} value - le score (plus petit = meilleur)
 * @returns {Promise<boolean>} true si l'enregistrement a réussi
 */
export async function submitScore(gameId, name, value) {
  const db = getDb();
  if (!db) return false;

  const cleanName = String(name).trim().slice(0, 20);
  const cleanValue = Number(value);
  if (!cleanName || !Number.isFinite(cleanValue) || cleanValue <= 0) {
    return false;
  }

  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      game: gameId,
      name: cleanName,
      value: cleanValue,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("Erreur lors de l'enregistrement du score :", err);
    return false;
  }
}
