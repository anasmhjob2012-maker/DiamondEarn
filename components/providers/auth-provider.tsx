"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { getDb, getFirebaseAuth } from "@/lib/firebase/client"
import type { UserDoc } from "@/lib/types"

type AuthState = {
  user: User | null
  profile: UserDoc | null
  loading: boolean
  authOpen: boolean
  authMode: "login" | "register"
  // Open the auth modal. `intent` is a human label shown on the modal so the
  // user knows why they are being asked to sign in (e.g. "Claim Offer").
  openAuth: (opts?: { mode?: "login" | "register"; intent?: string }) => void
  closeAuth: () => void
  setAuthMode: (m: "login" | "register") => void
  intent: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signOut: () => Promise<void>
  // Returns a fresh ID token for calling our server APIs. Throws if guest.
  getIdToken: () => Promise<string>
}

const AuthCtx = createContext<AuthState | null>(null)

// Read & clear any captured `?ref=CODE` from sessionStorage. We only consume
// it once per signup so a returning user doesn't get re-attributed.
function consumeReferral(): string | undefined {
  try {
    const code = sessionStorage.getItem("de:ref") ?? undefined
    if (code) sessionStorage.removeItem("de:ref")
    return code
  } catch {
    return undefined
  }
}

// Calls /api/me to provision (or fetch) the Firestore user document. Used
// after every successful sign-in path (email, Google, Microsoft, signup).
async function provisionProfile(
  user: User,
  displayName?: string,
  referredBy?: string,
): Promise<void> {
  const token = await user.getIdToken()
  await fetch("/api/me", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ displayName, referredBy }),
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [intent, setIntent] = useState<string | null>(null)

  // Holds the unsubscribe for the user-doc listener so we can swap it on
  // login/logout without leaking listeners.
  const profileUnsubRef = useRef<null | (() => void)>(null)

  // Capture ?ref=CODE on first paint so signups attribute correctly even if
  // the user wanders around the site before creating an account.
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const code = new URLSearchParams(window.location.search).get("ref")
      if (code) sessionStorage.setItem("de:ref", code.trim().toUpperCase())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)

      // Tear down old profile listener before attaching a new one.
      if (profileUnsubRef.current) {
        profileUnsubRef.current()
        profileUnsubRef.current = null
      }
      if (u) {
        const ref = doc(getDb(), "users", u.uid)
        profileUnsubRef.current = onSnapshot(
          ref,
          (snap) => setProfile(snap.exists() ? (snap.data() as UserDoc) : null),
          () => setProfile(null),
        )
      } else {
        setProfile(null)
      }
    })
    return () => {
      unsub()
      if (profileUnsubRef.current) profileUnsubRef.current()
    }
  }, [])

  const openAuth = useCallback(
    (opts?: { mode?: "login" | "register"; intent?: string }) => {
      setAuthMode(opts?.mode ?? "login")
      setIntent(opts?.intent ?? null)
      setAuthOpen(true)
    },
    [],
  )
  const closeAuth = useCallback(() => setAuthOpen(false), [])

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    // Make sure a Firestore profile exists for accounts created in older
    // builds, and surface a fresh snapshot to the UI.
    await provisionProfile(cred.user)
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      // Set the auth display name immediately so the UI shows it without a
      // round trip. The user-doc itself is created on the server in /api/me.
      await updateProfile(cred.user, { displayName })
      await provisionProfile(cred.user, displayName, consumeReferral())
    },
    [],
  )

  // OAuth — Google. Uses popup flow so it works in dev tunnels too.
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const cred = await signInWithPopup(getFirebaseAuth(), provider)
    await provisionProfile(
      cred.user,
      cred.user.displayName ?? undefined,
      consumeReferral(),
    )
  }, [])

  // OAuth — Microsoft (works for personal accounts, work, school, and
  // Xbox Live since they all federate through microsoft.com).
  const signInWithMicrosoft = useCallback(async () => {
    const provider = new OAuthProvider("microsoft.com")
    provider.setCustomParameters({ prompt: "select_account" })
    provider.addScope("openid")
    provider.addScope("email")
    provider.addScope("profile")
    const cred = await signInWithPopup(getFirebaseAuth(), provider)
    await provisionProfile(
      cred.user,
      cred.user.displayName ?? undefined,
      consumeReferral(),
    )
  }, [])

  const signOut = useCallback(async () => {
    await fbSignOut(getFirebaseAuth())
  }, [])

  const getIdToken = useCallback(async () => {
    const auth = getFirebaseAuth()
    const u = auth.currentUser
    if (!u) throw new Error("Not signed in")
    return await u.getIdToken(/* forceRefresh */ false)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      loading,
      authOpen,
      authMode,
      openAuth,
      closeAuth,
      setAuthMode,
      intent,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithMicrosoft,
      signOut,
      getIdToken,
    }),
    [
      user,
      profile,
      loading,
      authOpen,
      authMode,
      openAuth,
      closeAuth,
      intent,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithMicrosoft,
      signOut,
      getIdToken,
    ],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
