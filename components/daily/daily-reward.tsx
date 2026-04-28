"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { History, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/providers/auth-provider"
import { getOfferById, formatCooldown, rewardLabel } from "@/lib/offers"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { MotionButton } from "@/components/effects/motion-button"
import { TreasureChest } from "@/components/daily/treasure-chest"
import { toast } from "sonner"

const DAILY_OFFER_ID = "daily-checkin"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

function fmtTime(ms: number) {
  if (ms <= 0) return "00:00:00"
  const total = Math.floor(ms / 1000)
  const h = String(Math.floor(total / 3600)).padStart(2, "0")
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0")
  const s = String(total % 60).padStart(2, "0")
  return `${h}:${m}:${s}`
}

type ChestPhase = "idle" | "ready" | "shaking" | "open"

export function DailyReward() {
  const offer = useMemo(() => getOfferById(DAILY_OFFER_ID), [])
  const { user, profile, openAuth, getIdToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const tickRef = useRef<number | null>(null)
  const [lastReward, setLastReward] = useState<number | null>(null)
  const [phase, setPhase] = useState<ChestPhase>("idle")

  if (!offer) return null

  const lastClaim = profile?.lastClaim?.[offer.id] ?? 0
  const nextAt = lastClaim ? lastClaim + offer.cooldownMs : 0
  const remaining = Math.max(0, nextAt - now)
  const onCooldown = remaining > 0

  // Tick once per second only while on cooldown.
  useEffect(() => {
    if (!onCooldown) {
      if (tickRef.current) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
      return
    }
    tickRef.current = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [onCooldown])

  // Sync the chest's idle phase with cooldown state, but never override an
  // active "shaking"/"open" cycle.
  useEffect(() => {
    setPhase((p) => {
      if (p === "shaking" || p === "open") return p
      return onCooldown ? "idle" : "ready"
    })
  }, [onCooldown])

  async function handleClaim() {
    if (busy) return
    if (!user) {
      openAuth({ mode: "login", intent: "Open the daily chest" })
      return
    }
    setBusy(true)
    setPhase("shaking")
    try {
      const token = await getIdToken()
      const res = await fetch("/api/earn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offerId: offer!.id }),
      })
      const data = await res.json()
      if (!data.ok) {
        setPhase(onCooldown ? "idle" : "ready")
        if (data.code === "COOLDOWN") {
          toast.error("Already opened today", {
            description: `Next chest in ${formatCooldown(data.retryAfterMs ?? 0)}.`,
          })
        } else if (data.code === "NO_TOKEN" || data.code === "BAD_TOKEN") {
          toast.error("Session expired", { description: "Please sign in again." })
          openAuth({ mode: "login" })
        } else {
          toast.error("Claim failed", { description: data.error })
        }
        return
      }
      // Wait for the shake (1s) before popping the lid.
      window.setTimeout(() => {
        setPhase("open")
        setLastReward(data.reward)
        toast.success(`+${data.reward} diamonds`, {
          description: `New balance: ${data.balance.toLocaleString()}`,
        })
      }, 950)
    } catch {
      setPhase("ready")
      toast.error("Network error", { description: "Try again in a moment." })
    } finally {
      // Keep busy until the burst animation finishes.
      window.setTimeout(() => setBusy(false), 2200)
    }
  }

  const buttonLabel = (() => {
    if (busy) return null
    if (onCooldown) return "On cooldown"
    if (!user) return "Sign in to open"
    return `Open chest · ${rewardLabel(offer)}`
  })()

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      {/* Big chest panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass-strong relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl p-8"
      >
        {/* Subtle blue ambient halo behind the chest */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[var(--accent-blue-soft)] blur-3xl"
        />

        <div className="relative">
          <TreasureChest
            phase={phase}
            size={260}
            onAnimationEnd={() => {
              // Once the burst settles, return to idle (cooldown will be
              // active by then because the server stamped lastClaim).
              setPhase("idle")
            }}
          />
        </div>

        {/* Reward chip slides up from the chest after open */}
        <AnimatePresence>
          {lastReward !== null && phase === "open" ? (
            <motion.div
              key={lastReward}
              initial={{ opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-strong blue-glow inline-flex items-center gap-2 rounded-full px-4 py-2"
            >
              <DiamondIcon className="size-4" glow />
              <span className="font-mono text-base tabular-nums">
                +{fmt(lastReward)}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                diamonds
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-col items-center gap-1">
          <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight glow-text md:text-4xl">
            {onCooldown ? fmtTime(remaining) : "Ready"}
          </div>
          <div className="text-muted-foreground text-xs uppercase tracking-widest">
            {onCooldown ? "until next chest" : "tap the chest to open"}
          </div>
        </div>

        <MotionButton>
          <Button
            size="lg"
            disabled={busy || onCooldown}
            onClick={handleClaim}
            className="ps5-glow min-w-56 rounded-xl bg-white text-black hover:bg-white disabled:opacity-50"
          >
            {busy ? (
              <>
                <Spinner className="size-4" /> Opening
              </>
            ) : (
              buttonLabel
            )}
          </Button>
        </MotionButton>

        <p className="relative text-muted-foreground max-w-sm text-center text-sm leading-relaxed">
          Reward:{" "}
          <span className="text-foreground tabular-nums">
            +{rewardLabel(offer)} diamonds
          </span>{" "}
          rolled randomly on the server. The 24-hour countdown runs server-side and cannot be reset by reloading.
        </p>
      </motion.div>

      {/* History column */}
      <div className="flex flex-col gap-4">
        <div className="glass rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <History className="size-4" /> Your daily stats
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Balance" value={profile ? fmt(profile.balance) : "—"} />
            <Stat label="Lifetime XP" value={profile ? fmt(profile.totalEarned) : "—"} />
            <Stat
              label="Last claim"
              value={lastClaim ? new Date(lastClaim).toLocaleDateString() : "—"}
            />
            <Stat label="Reward range" value={`${rewardLabel(offer)}`} />
          </dl>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="size-4" /> How it works
          </h3>
          <ol className="text-muted-foreground mt-3 flex flex-col gap-2 text-sm leading-relaxed">
            <li>
              <span className="text-foreground">1.</span> Sign in with any browser — your chest is tied to your account.
            </li>
            <li>
              <span className="text-foreground">2.</span> Tap the open button when the timer hits zero.
            </li>
            <li>
              <span className="text-foreground">3.</span> The server rolls a random reward between 10 and 50 diamonds — and starts the next 24-hour countdown.
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <dt className="text-muted-foreground text-[11px] uppercase tracking-widest">{label}</dt>
      <dd className="mt-0.5 truncate text-sm tabular-nums">{value}</dd>
    </div>
  )
}
