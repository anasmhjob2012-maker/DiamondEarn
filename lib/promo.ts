// Server-side promo catalog. The client never sees this object — it only
// submits a code string and the server matches case-insensitively.
// In production, swap this for a Firestore `promoCodes` collection.

export type PromoCode = {
  code: string             // canonical (UPPERCASE)
  reward: number           // diamonds awarded
  description: string
  expiresAt?: number       // ms epoch; missing = no expiry
}

export const PROMO_CODES: PromoCode[] = [
  { code: "WELCOME100", reward: 100, description: "First-time user bonus" },
  { code: "PS5LAUNCH", reward: 250, description: "PS5 launch event reward" },
  { code: "DIAMOND50", reward: 50, description: "Newsletter subscriber gift" },
  { code: "EARN500", reward: 500, description: "Limited-time community drop" },
]

export function findPromo(input: string): PromoCode | undefined {
  const c = input.trim().toUpperCase()
  if (!c) return undefined
  return PROMO_CODES.find((p) => p.code === c)
}
