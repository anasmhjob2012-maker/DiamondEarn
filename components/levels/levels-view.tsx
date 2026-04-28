"use client"

import { Lock, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { levelProgress, MAX_LEVEL, xpForLevel } from "@/lib/levels"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

// Display ranks every 10 levels — a "tier" badge ladder.
const TIERS = [
  { level: 1, label: "Recruit" },
  { level: 10, label: "Bronze" },
  { level: 20, label: "Silver" },
  { level: 30, label: "Gold" },
  { level: 45, label: "Platinum" },
  { level: 60, label: "Diamond" },
  { level: 80, label: "Master" },
  { level: 100, label: "Apex" },
]

export function LevelsView() {
  const { user, profile, openAuth } = useAuth()
  const xp = profile?.totalEarned ?? 0
  const { level, floor, ceil, pct, toNext } = levelProgress(xp)

  return (
    <div className="flex flex-col gap-8">
      {/* Hero progress card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass-strong relative overflow-hidden rounded-2xl p-6 md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative grid size-20 place-items-center rounded-2xl bg-white text-black edge-highlight">
              <span className="text-3xl font-semibold tabular-nums leading-none">{level}</span>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
                Level
              </span>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-widest">
                Current rank
              </div>
              <div className="text-2xl font-semibold tracking-tight">
                {tierLabel(level)}
              </div>
              <div className="text-muted-foreground mt-0.5 text-sm">
                {user ? `${fmt(xp)} XP earned` : "Sign in to track progress"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 md:items-end">
            <div className="text-muted-foreground text-xs uppercase tracking-widest">
              Next level
            </div>
            <div className="font-mono text-lg tabular-nums">
              {level >= MAX_LEVEL ? "Maxed" : `${fmt(toNext)} XP to L${level + 1}`}
            </div>
          </div>
        </div>

        {/* Glowing progress bar */}
        <div className="mt-7">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-white"
              style={{ boxShadow: "0 0 14px oklch(1 0 0 / 0.45)" }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{fmt(floor)} XP</span>
            <span>{level >= MAX_LEVEL ? "—" : fmt(ceil) + " XP"}</span>
          </div>
        </div>

        {!user && (
          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={() => openAuth({ mode: "register", intent: "Track your level progress" })}
              className="rounded-xl bg-white text-black hover:bg-white"
            >
              Create an account
            </Button>
            <span className="text-muted-foreground text-xs">
              Free. Your XP follows you across devices.
            </span>
          </div>
        )}
      </motion.div>

      {/* Tier ladder */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium tracking-tight">Tier ladder</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => {
            const unlocked = level >= t.level
            return (
              <div
                key={t.level}
                className={`glass relative overflow-hidden rounded-xl p-4 ${
                  unlocked ? "edge-highlight" : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-widest">
                    L{t.level}+
                  </span>
                  {unlocked ? (
                    <Sparkles className="size-3.5" />
                  ) : (
                    <Lock className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-3 text-lg font-semibold tracking-tight">{t.label}</div>
                <div className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                  {fmt(xpForLevel(t.level))} XP
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tip */}
      <div className="glass flex items-start gap-3 rounded-xl p-4 text-sm leading-relaxed">
        <DiamondIcon className="mt-0.5 size-4 shrink-0" />
        <p className="text-muted-foreground">
          Every diamond earned across offers, daily check-ins, promo codes and referrals counts as XP.
          Cashing out does <span className="text-foreground">not</span> reduce XP — your rank is permanent.
        </p>
      </div>
    </div>
  )
}

function tierLabel(level: number): string {
  let current = TIERS[0].label
  for (const t of TIERS) {
    if (level >= t.level) current = t.label
  }
  return current
}
