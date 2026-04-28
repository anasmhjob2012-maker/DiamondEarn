export type UserDoc = {
  uid: string
  displayName: string
  email: string
  balance: number
  totalEarned: number
  createdAt: number
  // RBAC role. Defaults to "user". Promote a uid to "admin" via the admin
  // panel (or directly in Firestore) to grant access to /admin.
  role?: "user" | "admin"
  // Map of offerId -> ms epoch of last successful claim. Used for cooldown.
  lastClaim?: Record<string, number>
  // Promo codes already redeemed (one-time per user).
  redeemedPromos?: string[]
  // Referral system — code is derived from uid; track invitees server-side.
  referralCode?: string
  referredBy?: string | null
  referralCount?: number
  referralEarnings?: number
  // Cashout history references (latest at top).
  cashoutCount?: number
  // Soft-ban flag set by admins. Banned users keep XP but can't claim.
  banned?: boolean
}

// Global live-chat message stored in Firestore `chat` collection.
export type ChatMessage = {
  id: string
  uid: string
  displayName: string
  text: string
  createdAt: number
  // Tier label cached at write time so we don't have to join with users on read.
  tier?: string
  level?: number
  // Set by admins via the admin panel.
  role?: "user" | "admin"
}

// One entry in the AI DiamondBot's static FAQ knowledge base.
export type BotFAQEntry = {
  id: string
  // Lower-case keywords — any match scores the entry.
  keywords: string[]
  // Optional triggers shown as quick-reply chips.
  question: string
  answer: string
}

// Live-chat bubble rendered in the floating DiamondBot popup.
export type BotMessage = {
  id: string
  role: "user" | "bot"
  text: string
  createdAt: number
  // Suggested quick-reply chips, shown under bot messages only.
  suggestions?: string[]
}

export type EarnResponse =
  | { ok: true; balance: number; reward: number; nextAvailableAt: number }
  | { ok: false; error: string; code: string; retryAfterMs?: number }

export type LeaderboardRow = {
  uid: string
  displayName: string
  totalEarned: number
  rank: number
}

export type CashoutRequest = {
  id: string
  uid: string
  itemId: string
  brand: string
  label: string
  cost: number
  payoutUSD: number
  // For gift cards this is the user's payout email; for game top-ups it's
  // the same value as `playerId` (kept for backwards compatibility with the
  // older admin UI).
  payoutDestination: string
  status: "pending" | "approved" | "rejected"
  createdAt: number
  // Mirror of `createdAt` — kept so admins can sort by either field.
  timestamp?: number

  // ---- Per-spec fields (for the Operations Console) ----
  // Auth email of the user at submit time. Useful for manual fulfillment.
  email?: string
  // Brand label for game items (e.g. "PUBG Mobile"). Empty for gift cards.
  gameType?: string
  // Numeric amount of in-game currency redeemed (e.g. 60, 210, 400).
  amount?: number
  // Display label for the in-game currency (e.g. "60 UC").
  currencyLabel?: string
  // Player/Character/Username ID for game top-ups. Only present when
  // requiresPlayerId is true on the item.
  playerId?: string
}
