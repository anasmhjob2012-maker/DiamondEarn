"use client"

import { useEffect, useMemo, useState } from "react"
import { Gamepad2, Megaphone, ScrollText, Video, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/providers/auth-provider"
import { formatCooldown, rewardLabel, type Offer } from "@/lib/offers"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { MotionButton } from "@/components/effects/motion-button"
import { toast } from "sonner"

const ICONS: Record<Offer["category"], LucideIcon> = {
  daily: Gamepad2,
  social: Megaphone,
  survey: ScrollText,
  video: Video,
}

export function OfferCard({ offer }: { offer: Offer }) {
  const { user, profile, openAuth, getIdToken } = useAuth()
  const [busy, setBusy] = useState(false)
  // Optimistic local cooldown so the UI matches the server's lastClaim
  // immediately after a successful claim. Re-synced from `profile.lastClaim`
  // on every snapshot.
  const [nextAt, setNextAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())

  const lastClaim = profile?.lastClaim?.[offer.id] ?? 0
  const serverNextAt = lastClaim ? lastClaim + offer.cooldownMs : 0

  // Keep local in sync with whatever the Firestore listener says.
  useEffect(() => {
    if (serverNextAt && serverNextAt > Date.now()) setNextAt(serverNextAt)
    else setNextAt(null)
  }, [serverNextAt])

  // Tick once per second while a cooldown is active. Stops when idle so the
  // page doesn't burn CPU on the 2012 laptop.
  useEffect(() => {
    if (!nextAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [nextAt])

  const remaining = nextAt ? Math.max(0, nextAt - now) : 0
  const onCooldown = remaining > 0
  const Icon = ICONS[offer.category]

  const cooldownLabel = useMemo(() => formatCooldown(offer.cooldownMs), [offer.cooldownMs])

  async function handleClaim() {
    if (busy) return
    if (!user) {
      openAuth({ mode: "login", intent: `Claim "${offer.title}"` })
      return
    }
    setBusy(true)
    try {
      const token = await getIdToken()
      const res = await fetch("/api/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ offerId: offer.id }),
      })
      const data = (await res.json()) as
        | { ok: true; balance: number; reward: number; nextAvailableAt: number }
        | { ok: false; error: string; code: string; retryAfterMs?: number }

      if (!data.ok) {
        if (data.code === "COOLDOWN" && data.retryAfterMs) {
          setNextAt(Date.now() + data.retryAfterMs)
          toast.error("Still on cooldown", {
            description: `Try again in ${formatCooldown(data.retryAfterMs)}.`,
          })
        } else if (data.code === "NO_TOKEN" || data.code === "BAD_TOKEN") {
          toast.error("Session expired", { description: "Please sign in again." })
          openAuth({ mode: "login" })
        } else {
          toast.error("Claim failed", { description: data.error })
        }
        return
      }

      setNextAt(data.nextAvailableAt)
      toast.success(`+${data.reward} diamonds`, {
        description: `New balance: ${data.balance.toLocaleString()}`,
      })
    } catch {
      toast.error("Network error", { description: "Could not reach the server. Try again." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="glass group relative flex flex-col gap-4 rounded-xl p-5 transition-colors hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-white/10 text-foreground">
          <Icon className="size-5" />
        </div>
        {offer.badge ? (
          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-widest">
            {offer.badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-medium leading-tight text-balance">{offer.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{offer.description}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm">
          <DiamondIcon className="size-4" />
          <span className="font-medium tabular-nums">+{rewardLabel(offer)}</span>
          <span className="text-muted-foreground text-xs">· every {cooldownLabel}</span>
        </div>
        <MotionButton>
          <Button
            size="sm"
            onClick={handleClaim}
            disabled={busy || onCooldown}
            className="rounded-xl bg-white text-black hover:bg-white disabled:opacity-60"
          >
            {busy ? (
              <>
                <Spinner className="size-4" /> Claiming
              </>
            ) : onCooldown ? (
              <span className="tabular-nums">{formatCooldown(remaining)}</span>
            ) : user ? (
              "Claim"
            ) : (
              "Sign in"
            )}
          </Button>
        </MotionButton>
      </div>
    </article>
  )
}
