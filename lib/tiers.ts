// Gamehag-style tier ladder. Resolves a tier name from a level so we can
// label players consistently across the sidebar XP bar, leaderboard, and
// chat messages.

import { levelFromXp } from "@/lib/levels"

export type Tier = {
  name: "Player" | "Pro" | "Elite" | "Legend" | "Mythic"
  // Inclusive lower bound on level required to enter this tier.
  minLevel: number
  // Tailwind text/glow color used for the tier badge.
  tone: string
}

export const TIERS: Tier[] = [
  { name: "Player", minLevel: 1, tone: "text-muted-foreground" },
  { name: "Pro", minLevel: 10, tone: "text-foreground" },
  { name: "Elite", minLevel: 25, tone: "text-[var(--accent-blue,#56b6ff)]" },
  { name: "Legend", minLevel: 50, tone: "text-[var(--accent-blue,#56b6ff)]" },
  { name: "Mythic", minLevel: 80, tone: "text-[var(--accent-blue,#56b6ff)]" },
]

export function tierForLevel(level: number): Tier {
  let current = TIERS[0]
  for (const t of TIERS) {
    if (level >= t.minLevel) current = t
  }
  return current
}

export function tierForXp(xp: number): Tier {
  return tierForLevel(levelFromXp(xp))
}
