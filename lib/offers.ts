// Server-side source of truth for offers. The client NEVER decides reward
// amounts — it only sends an offerId, and the server looks up the value here.
// Cooldowns are enforced in /api/earn via Firestore transactions.

export type Offer = {
  id: string
  title: string
  description: string
  /** Fixed reward (used when rewardMin/rewardMax are omitted). */
  reward: number
  /** When set, /api/earn rolls a random integer in [rewardMin, rewardMax]. */
  rewardMin?: number
  rewardMax?: number
  cooldownMs: number
  category: "daily" | "social" | "survey" | "video"
  badge?: string
}

export const OFFERS: Offer[] = [
  {
    id: "daily-checkin",
    title: "Daily Check-in",
    description: "Log in once per day and collect a randomized diamond drop.",
    reward: 30, // average — actual drop is 10..50
    rewardMin: 10,
    rewardMax: 50,
    cooldownMs: 1000 * 60 * 60 * 24, // 24h — true daily cycle
    category: "daily",
    badge: "10–50",
  },
  {
    id: "watch-trailer",
    title: "Watch Featured Trailer",
    description: "Watch the latest sponsored trailer end-to-end.",
    reward: 10,
    cooldownMs: 1000 * 60 * 30, // 30 min
    category: "video",
  },
  {
    id: "share-link",
    title: "Share Your Referral",
    description: "Post your referral link to a social network.",
    reward: 15,
    cooldownMs: 1000 * 60 * 60 * 4, // 4h
    category: "social",
  },
  {
    id: "quick-survey",
    title: "Quick 1-minute Survey",
    description: "Answer five short questions about your gaming habits.",
    reward: 40,
    cooldownMs: 1000 * 60 * 60 * 24, // 24h
    category: "survey",
    badge: "+40",
  },
  {
    id: "follow-channel",
    title: "Follow Official Channel",
    description: "Follow the DiamondEarn channel and confirm.",
    reward: 20,
    cooldownMs: 1000 * 60 * 60 * 24 * 7, // weekly
    category: "social",
  },
  {
    id: "rate-app",
    title: "Rate the App",
    description: "Leave an honest rating on the store of your choice.",
    reward: 50,
    cooldownMs: 1000 * 60 * 60 * 24 * 30, // monthly
    category: "daily",
    badge: "+50",
  },
]

export function getOfferById(id: string): Offer | undefined {
  return OFFERS.find((o) => o.id === id)
}

/** Returns the reward to grant for this offer. Random for ranged offers. */
export function rollReward(offer: Offer): number {
  if (typeof offer.rewardMin === "number" && typeof offer.rewardMax === "number") {
    const lo = Math.min(offer.rewardMin, offer.rewardMax)
    const hi = Math.max(offer.rewardMin, offer.rewardMax)
    // Inclusive on both ends. e.g. lo=10, hi=50 => [10..50].
    return Math.floor(Math.random() * (hi - lo + 1)) + lo
  }
  return offer.reward
}

/** Display label for an offer's reward (used in cards / buttons). */
export function rewardLabel(offer: Offer): string {
  if (typeof offer.rewardMin === "number" && typeof offer.rewardMax === "number") {
    return `${offer.rewardMin}–${offer.rewardMax}`
  }
  return `${offer.reward}`
}

export function formatCooldown(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

/** 1,000 Diamonds == $1.00 USD. Single source of truth for conversion. */
export const DIAMONDS_PER_USD = 1000

export function diamondsToUSD(d: number): number {
  return d / DIAMONDS_PER_USD
}

export function formatUSD(usd: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd)
}
