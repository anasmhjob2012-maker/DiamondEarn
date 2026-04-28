// Server-side reward catalog. The client cannot change cost or item — only
// pick by id. /api/cashout reads from this list and validates everything.

export type CashoutItem = {
  id: string
  brand: string
  label: string
  cost: number          // diamonds required
  payoutUSD: number     // user-facing payout amount
  description: string
  // Whether this item is a digital gift card or an in-game currency top-up.
  category: "gift" | "game"
  // Only set for category === "game". Used by the UI for branded styling.
  game?: "pubg" | "freefire" | "roblox"
  // Player-facing currency unit (e.g. "60 UC", "210 Diamonds", "400 Robux").
  // Display-only — the integer value is in `amount`.
  currencyLabel?: string
  // Numeric amount of in-game currency (e.g. 60, 210, 400). Used in admin
  // workflows for manual fulfillment.
  amount?: number
  // When true, the redemption modal asks for a Player/Character ID instead of
  // (or in addition to) a payout email.
  requiresPlayerId?: boolean
  // Label shown above the Player ID input (varies per platform).
  playerIdLabel?: string
}

// Game top-ups come first in the catalog so the store page renders them
// in the new "Games Top-up" section before the gift cards.
export const CASHOUT_ITEMS: CashoutItem[] = [
  // -------- PUBG Mobile --------
  {
    id: "pubg-60",
    brand: "PUBG Mobile",
    label: "60 UC",
    cost: 1000,
    payoutUSD: 1,
    description: "60 Unknown Cash credited to your PUBG Mobile account.",
    category: "game",
    game: "pubg",
    currencyLabel: "60 UC",
    amount: 60,
    requiresPlayerId: true,
    playerIdLabel: "PUBG Mobile Player ID",
  },
  {
    id: "pubg-325",
    brand: "PUBG Mobile",
    label: "325 UC",
    cost: 5000,
    payoutUSD: 5,
    description: "325 UC top-up — most popular pack for skins and crates.",
    category: "game",
    game: "pubg",
    currencyLabel: "325 UC",
    amount: 325,
    requiresPlayerId: true,
    playerIdLabel: "PUBG Mobile Player ID",
  },
  {
    id: "pubg-660",
    brand: "PUBG Mobile",
    label: "660 UC",
    cost: 10000,
    payoutUSD: 10,
    description: "660 UC bundle — best rate per UC.",
    category: "game",
    game: "pubg",
    currencyLabel: "660 UC",
    amount: 660,
    requiresPlayerId: true,
    playerIdLabel: "PUBG Mobile Player ID",
  },

  // -------- Free Fire --------
  {
    id: "ff-100",
    brand: "Free Fire",
    label: "100 Diamonds",
    cost: 1000,
    payoutUSD: 1,
    description: "100 Free Fire Diamonds delivered to your account.",
    category: "game",
    game: "freefire",
    currencyLabel: "100 Diamonds",
    amount: 100,
    requiresPlayerId: true,
    playerIdLabel: "Free Fire Player ID",
  },
  {
    id: "ff-210",
    brand: "Free Fire",
    label: "210 Diamonds",
    cost: 2000,
    payoutUSD: 2,
    description: "210 Diamonds — popular for weekly memberships.",
    category: "game",
    game: "freefire",
    currencyLabel: "210 Diamonds",
    amount: 210,
    requiresPlayerId: true,
    playerIdLabel: "Free Fire Player ID",
  },
  {
    id: "ff-530",
    brand: "Free Fire",
    label: "530 Diamonds",
    cost: 5000,
    payoutUSD: 5,
    description: "530 Diamonds — great for monthly bundle + skins.",
    category: "game",
    game: "freefire",
    currencyLabel: "530 Diamonds",
    amount: 530,
    requiresPlayerId: true,
    playerIdLabel: "Free Fire Player ID",
  },

  // -------- Roblox --------
  {
    id: "roblox-400",
    brand: "Roblox",
    label: "400 Robux",
    cost: 5000,
    payoutUSD: 5,
    description: "400 Robux credited via gift code or direct top-up.",
    category: "game",
    game: "roblox",
    currencyLabel: "400 Robux",
    amount: 400,
    requiresPlayerId: true,
    playerIdLabel: "Roblox Username",
  },
  {
    id: "roblox-800",
    brand: "Roblox",
    label: "800 Robux",
    cost: 10000,
    payoutUSD: 10,
    description: "800 Robux — a clean 10-dollar pack with no extra fees.",
    category: "game",
    game: "roblox",
    currencyLabel: "800 Robux",
    amount: 800,
    requiresPlayerId: true,
    playerIdLabel: "Roblox Username",
  },

  // -------- Gift cards --------
  {
    id: "paypal-5",
    brand: "PayPal",
    label: "$5 PayPal Cash",
    cost: 5000,
    payoutUSD: 5,
    description: "Sent to your PayPal email within 72 hours.",
    category: "gift",
  },
  {
    id: "paypal-10",
    brand: "PayPal",
    label: "$10 PayPal Cash",
    cost: 9500,
    payoutUSD: 10,
    description: "Save 5% versus two $5 redemptions.",
    category: "gift",
  },
  {
    id: "razer-5",
    brand: "Razer Gold",
    label: "$5 Razer Gold",
    cost: 5000,
    payoutUSD: 5,
    description: "Razer Gold PIN delivered to your email.",
    category: "gift",
  },
  {
    id: "razer-10",
    brand: "Razer Gold",
    label: "$10 Razer Gold",
    cost: 9500,
    payoutUSD: 10,
    description: "Better rate at $10 — most popular pick.",
    category: "gift",
  },
  {
    id: "steam-10",
    brand: "Steam",
    label: "$10 Steam Wallet",
    cost: 10000,
    payoutUSD: 10,
    description: "Steam Wallet code delivered to your email.",
    category: "gift",
  },
  {
    id: "steam-25",
    brand: "Steam",
    label: "$25 Steam Wallet",
    cost: 24000,
    payoutUSD: 25,
    description: "Best rate — save 4% vs smaller redemptions.",
    category: "gift",
  },
  {
    id: "psn-10",
    brand: "PlayStation",
    label: "$10 PSN Card",
    cost: 10000,
    payoutUSD: 10,
    description: "PlayStation Store digital code.",
    category: "gift",
  },
  {
    id: "amazon-10",
    brand: "Amazon",
    label: "$10 Amazon Gift Card",
    cost: 10000,
    payoutUSD: 10,
    description: "Digital code for amazon.com.",
    category: "gift",
  },
]

export function getCashoutItem(id: string) {
  return CASHOUT_ITEMS.find((c) => c.id === id)
}
