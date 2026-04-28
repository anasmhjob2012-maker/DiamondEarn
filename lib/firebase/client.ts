// Client-side Firebase SDK. Used in the browser only.
// All write paths that grant value (diamonds, withdrawals) MUST go through
// the server API — this file only handles auth + read-only Firestore listens.

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  return _app
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth
  _auth = getAuth(getFirebaseApp())
  // Persist sessions across reloads. Fire-and-forget; if it fails (e.g.
  // Safari private mode) auth still works in-memory for the tab.
  setPersistence(_auth, browserLocalPersistence).catch(() => {
    /* ignore */
  })
  return _auth
}

export function getDb(): Firestore {
  if (_db) return _db
  _db = getFirestore(getFirebaseApp())
  return _db
}
