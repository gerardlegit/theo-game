// ============================================================================
// COMPTEUR DE VISITES — un document Firestore par jour.
//
// Collection "visits_daily", document "AAAA-MM-JJ" (date de Paris),
// champ "count" incrémenté à chaque visite. Une visite = une session de
// navigateur : recharger la page ne compte pas une deuxième fois.
// Le navigateur de l'admin (après connexion sur admin/) n'est jamais compté.
// ============================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  increment,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const COLLECTION_NAME = "visits_daily";
const SESSION_KEY = "cabane_visit_counted";
export const ADMIN_DEVICE_KEY = "cabane_admin_device";

const isConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("REMPLACE_MOI");

function getDb() {
  if (!isConfigured) return null;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export function todayKey() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function storageGet(store, key) {
  try { return store.getItem(key); } catch { return null; }
}
function storageSet(store, key, value) {
  try { store.setItem(key, value); } catch { /* stockage bloqué : tant pis */ }
}

/** Compte une visite (au plus une fois par session de navigateur). */
export async function recordVisit() {
  const db = getDb();
  if (!db) return;
  if (storageGet(localStorage, ADMIN_DEVICE_KEY)) return;
  if (storageGet(sessionStorage, SESSION_KEY)) return;
  storageSet(sessionStorage, SESSION_KEY, "1");
  try {
    await setDoc(doc(db, COLLECTION_NAME, todayKey()), { count: increment(1) }, { merge: true });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de la visite :", err);
  }
}

/**
 * Récupère tout l'historique des visites, trié du plus ancien au plus récent.
 * @returns {Promise<Array<{day: string, count: number}>>}
 */
export async function fetchVisitHistory() {
  const db = getDb();
  if (!db) throw new Error("Firebase n'est pas configuré.");
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  return snap.docs
    .map((d) => ({ day: d.id, count: Number(d.data().count) || 0 }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
