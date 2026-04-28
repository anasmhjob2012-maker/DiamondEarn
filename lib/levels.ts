// Level curve — XP equals lifetime diamonds earned (totalEarned).
// xpForLevel(n) = 100 * n^1.5  (so leveling slows down progressively)

export const MAX_LEVEL = 100

export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level - 1, 1.5))
}

export function levelFromXp(xp: number): number {
  // Inverse: xp = 100 * (lvl-1)^1.5  =>  lvl = 1 + (xp/100)^(2/3)
  const lvl = 1 + Math.floor(Math.pow(Math.max(0, xp) / 100, 2 / 3))
  return Math.min(MAX_LEVEL, lvl)
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const span = Math.max(1, ceil - floor)
  const into = Math.max(0, xp - floor)
  return {
    level,
    floor,
    ceil,
    pct: Math.min(100, Math.round((into / span) * 100)),
    toNext: Math.max(0, ceil - xp),
  }
}
