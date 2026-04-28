// Server-only Firebase Admin SDK. Imported from API routes & RSC.
// Holds the trust boundary: no client may forge requests past `verifyIdToken`.

import "server-only"
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

let _app: App | null = null

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Paste the service account JSON in Project Settings → Vars.",
    )
  }
  try {
    const parsed = JSON.parse(raw)
    // Newlines in private keys often arrive escaped when pasted into env UIs.
    if (typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n")
    }
    return parsed
  } catch (err) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: " + (err as Error).message)
  }
}

export function getAdminApp(): App {
  if (_app) return _app
  if (getApps().length) {
    _app = getApp()
    return _app
  }
  const sa = getServiceAccount()
  _app = initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }),
  })
  return _app
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}
