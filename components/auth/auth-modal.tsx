"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { trophyToast } from "@/lib/trophy-toast"
import { Lock } from "lucide-react"
import { DiamondIcon } from "@/components/icons/diamond-icon"

// Maps Firebase Auth error codes to friendly messages displayed in toasts.
function explain(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid."
    case "auth/user-not-found":
      return "No account found for that email."
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Wrong email or password."
    case "auth/email-already-in-use":
      return "An account with that email already exists."
    case "auth/weak-password":
      return "Password must be at least 6 characters."
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again."
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a minute before retrying."
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in popup was closed before finishing."
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup."
    case "auth/account-exists-with-different-credential":
      return "An account already exists with a different sign-in method."
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled in Firebase yet."
    case "auth/unauthorized-domain":
      return "This domain isn't authorized for sign-in. Add it in Firebase Auth settings."
    default:
      return "Something went wrong. Please try again."
  }
}

// Tracks which button is currently busy so we can show a spinner on the
// exact one the user clicked, without disabling all of them.
type Busy = null | "email" | "google" | "microsoft"

export function AuthModal() {
  const {
    authOpen,
    closeAuth,
    authMode,
    setAuthMode,
    intent,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithMicrosoft,
  } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [busy, setBusy] = useState<Busy>(null)

  // Reset fields when the dialog closes so credentials don't persist in DOM.
  useEffect(() => {
    if (!authOpen) {
      setEmail("")
      setPassword("")
      setDisplayName("")
      setBusy(null)
    }
  }, [authOpen])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy("email")
    try {
      await signIn(email.trim(), password)
      trophyToast("Welcome back", "Signed in to DiamondEarn")
      closeAuth()
    } catch (err) {
      const code = (err as { code?: string }).code
      toast.error("Sign-in failed", { description: explain(code) })
    } finally {
      setBusy(null)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy("email")
    try {
      const name = displayName.trim() || email.split("@")[0]
      await signUp(email.trim(), password, name)
      trophyToast("Account created", `Welcome, ${name}`)
      closeAuth()
    } catch (err) {
      const code = (err as { code?: string }).code
      toast.error("Sign-up failed", { description: explain(code) })
    } finally {
      setBusy(null)
    }
  }

  async function handleOAuth(kind: "google" | "microsoft") {
    if (busy) return
    setBusy(kind)
    try {
      if (kind === "google") {
        await signInWithGoogle()
        trophyToast("Welcome back", "Signed in with Google")
      } else {
        await signInWithMicrosoft()
        trophyToast("Welcome back", "Signed in with Microsoft")
      }
      closeAuth()
    } catch (err) {
      const code = (err as { code?: string }).code
      // Silently ignore the user closing the popup themselves.
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        toast.error("Sign-in failed", { description: explain(code) })
      }
    } finally {
      setBusy(null)
    }
  }

  const anyBusy = busy !== null

  return (
    <Dialog open={authOpen} onOpenChange={(v) => (v ? null : closeAuth())}>
      <DialogContent className="glass-strong w-[calc(100vw-2rem)] max-w-md border-white/10 p-0 sm:max-w-md">
        <div className="flex flex-col gap-5 p-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <DiamondIcon className="size-5" />
              <span className="text-sm font-medium tracking-widest uppercase">
                DiamondEarn
              </span>
            </div>
            <DialogTitle className="text-2xl text-balance">
              {authMode === "login" ? "Sign in to continue" : "Create your account"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-pretty">
              {intent ? (
                <>
                  <Lock className="mr-1 inline size-3.5" />
                  Action requires an account:{" "}
                  <span className="text-foreground">{intent}</span>
                </>
              ) : (
                "An account lets you claim diamonds, sync progress across devices, and cash out."
              )}
            </DialogDescription>
          </DialogHeader>

          {/* OAuth providers — first because most users prefer them */}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={anyBusy}
              className="ps5-glow h-11 w-full justify-center gap-3 rounded-xl border border-white/10 bg-white text-black hover:bg-white disabled:opacity-60"
            >
              {busy === "google" ? (
                <>
                  <Spinner className="size-4" /> Connecting to Google
                </>
              ) : (
                <>
                  <GoogleMark className="size-4" />
                  Continue with Google
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => handleOAuth("microsoft")}
              disabled={anyBusy}
              className="ps5-glow h-11 w-full justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] text-foreground hover:bg-white/[0.12] disabled:opacity-60"
            >
              {busy === "microsoft" ? (
                <>
                  <Spinner className="size-4" /> Connecting to Microsoft
                </>
              ) : (
                <>
                  <MicrosoftMark className="size-4" />
                  Continue with Microsoft
                </>
              )}
            </Button>
          </div>

          {/* divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              or use email
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <Tabs
            value={authMode}
            onValueChange={(v) => setAuthMode(v as "login" | "register")}
          >
            <TabsList className="bg-white/5 grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={anyBusy}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={anyBusy}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={anyBusy}
                  className="ps5-glow mt-2 h-11 rounded-xl bg-white text-black hover:bg-white disabled:opacity-60"
                >
                  {busy === "email" ? (
                    <>
                      <Spinner className="size-4" /> Signing in
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reg-name">Display name</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    required
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={anyBusy}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={anyBusy}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={anyBusy}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={anyBusy}
                  className="ps5-glow mt-2 h-11 rounded-xl bg-white text-black hover:bg-white disabled:opacity-60"
                >
                  {busy === "email" ? (
                    <>
                      <Spinner className="size-4" /> Creating account
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <button
            type="button"
            onClick={closeAuth}
            disabled={anyBusy}
            className="mx-auto text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Continue as guest
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Google "G" mark — official 4-color logo.
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}

// Microsoft 4-square mark — used for both consumer and Xbox Live federated
// sign-in (they share microsoft.com OAuth).
function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  )
}
