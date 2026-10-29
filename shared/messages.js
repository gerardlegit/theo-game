// ============================================================================
// MESSAGES DES VISITEURS — le formulaire « Laisser un commentaire » de la
// page d'accueil, et leur lecture dans admin/.
//
// Collection "messages" : un document par message
//   { type: "commentaire" | "idee" | "probleme", name, message, createdAt }
// Tout le monde peut ENVOYER un message, mais seul le compte Firebase de
// l'admin peut les LIRE et les effacer (règles dans FIREBASE-SETUP.md) :
// les messages ne sont jamais affichés publiquement sur le site.
// ============================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const COLLECTION_NAME = "messages";
export const MAX_NAME = 30;
export const MAX_MESSAGE = 1000;
export const MESSAGE_TYPES = {
  commentaire: "💬 Commentaire",
  idee: "🎮 Idée de nouveau jeu",
  probleme: "🐞 Problème",
};

const isConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("REMPLACE_MOI");

/** L'application Firebase (null tant que shared/firebase-config.js n'est pas rempli). */
export function messagesApp() {
  if (!isConfigured) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getDb() {
  const app = messagesApp();
  return app ? getFirestore(app) : null;
}

/**
 * Envoie un message à l'équipe de la Cabane.
 * @returns {Promise<boolean>} true si le message est bien enregistré
 */
export async function sendMessage({ type, name, message }) {
  const db = getDb();
  if (!db) return false;

  const cleanType = Object.hasOwn(MESSAGE_TYPES, type) ? type : "commentaire";
  const cleanName = String(name || "").trim().slice(0, MAX_NAME);
  const cleanMessage = String(message || "").trim().slice(0, MAX_MESSAGE);
  if (cleanMessage.length < 3) return false;

  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      type: cleanType,
      name: cleanName,
      message: cleanMessage,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("Erreur lors de l'envoi du message :", err);
    return false;
  }
}

/**
 * Tous les messages, du plus récent au plus ancien (compte admin seulement).
 * @returns {Promise<Array<{id: string, type: string, name: string, message: string, date: Date|null}>>}
 */
export async function fetchMessages() {
  const db = getDb();
  if (!db) throw new Error("Firebase n'est pas configuré.");
  const snap = await getDocs(query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type,
      name: data.name || "",
      message: data.message || "",
      date: data.createdAt?.toDate?.() ?? null,
    };
  });
}

/** Efface un message (compte admin seulement). */
export async function deleteMessage(id) {
  const db = getDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (err) {
    console.error("Erreur lors de la suppression du message :", err);
    return false;
  }
}
