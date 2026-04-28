"use client"

import { motion } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"
import { levelProgress } from "@/lib/levels"
import { tierForLevel } from "@/lib/tiers"
import { DiamondIcon } from "@/components/icons/diamond-icon"

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

// Compact XP card embedded in the sidebar. Shows balance + level + animated
// progress bar. The bar uses a CSS sweep gradient (pure GPU, no JS tick) and
// the fill width animates whenever profile.totalEarned snaps in.
export function SidebarXp() {
  const { profile, user } = useAuth()
  const xp = profile?.totalEarned ?? 0
  const balance = profile?.balance ?? 0
  const { level, pct, toNext, ceil } = levelProgress(xp)
  const tier = tierForLevel(level)

  return (
    <div className="glass relative overflow-hidden rounded-xl p-3.5">
      {/* Header row — balance + level chip */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <DiamondIcon className="size-4" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Balance
            </span>
            <span className="font-mono text-sm tabular-nums">
              {profile ? fmt(balance) : "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end leading-tight">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Level
          </span>
          <span className="font-mono text-sm tabular-nums">
            {user ? level : "—"}
          </span>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={false}
            animate={{ width: `${user ? pct : 0}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
            className="xp-bar h-full rounded-full"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] tabular-nums text-muted-foreground">
          <span className={tier.tone}>{tier.name}</span>
          <span>
            {user ? (
              level >= 100 ? "Maxed" : `${fmt(toNext)} to L${level + 1}`
            ) : (
              "Sign in to track"
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
