// Top partner offerwalls. These are placeholders for the actual SDK
// integrations (AyetStudios, AdGateMedia, Lootably). When you add their
// publisher IDs, swap the `href` with the SDK iframe URL.

export type Offerwall = {
  id: "ayet" | "adgate" | "lootably" | "video-vault" | "social-loop" | "survey-pulse"
  brand: string
  tagline: string
  // Average reward range (display only — partners decide actual amounts).
  avgReward: string
  // Tasks per visit estimate (used as a small meta chip).
  estimatedTasks: number
  // Where the user lands when they tap the wall. Internal route or partner SDK.
  href: string
  // Tier label shown as accent badge: "Top", "Hot", "New".
  badge?: "Top" | "Hot" | "New"
  external?: boolean
  // Lucide icon import name — looked up in the consumer.
  icon: "Trophy" | "Flame" | "Target" | "Video" | "Megaphone" | "ScrollText"
  // Tone for the icon container.
  tone: "primary" | "blue" | "neutral"
}

export const PARTNER_OFFERWALLS: Offerwall[] = [
  {
    id: "ayet",
    brand: "AyetStudios",
    tagline:
      "Premium mobile install offers and incentivized signups across iOS & Android.",
    avgReward: "50–2,500",
    estimatedTasks: 120,
    href: "/offers#ayet",
    badge: "Top",
    icon: "Trophy",
    tone: "primary",
  },
  {
    id: "adgate",
    brand: "AdGateMedia",
    tagline:
      "Web and app surveys, sponsorship signups, and short tasks for global users.",
    avgReward: "20–1,800",
    estimatedTasks: 90,
    href: "/offers#adgate",
    badge: "Hot",
    icon: "Flame",
    tone: "blue",
  },
  {
    id: "lootably",
    brand: "Lootably",
    tagline:
      "Daily rotating high-payout campaigns. Strong conversion on US and EU traffic.",
    avgReward: "15–1,200",
    estimatedTasks: 75,
    href: "/offers#lootably",
    badge: "New",
    icon: "Target",
    tone: "neutral",
  },
]

// Branded "category" walls that route into the internal /offers page.
export const INTERNAL_OFFERWALLS: Offerwall[] = [
  {
    id: "video-vault",
    brand: "Video Vault",
    tagline: "Watch trailers, gameplay clips and partner ads.",
    avgReward: "5–25",
    estimatedTasks: 12,
    href: "/offers#video",
    icon: "Video",
    tone: "neutral",
  },
  {
    id: "social-loop",
    brand: "Social Loop",
    tagline: "Follow, share and engage with our partners.",
    avgReward: "10–40",
    estimatedTasks: 8,
    href: "/offers#social",
    icon: "Megaphone",
    tone: "neutral",
  },
  {
    id: "survey-pulse",
    brand: "Survey Pulse",
    tagline: "Quick paid surveys that respect your time.",
    avgReward: "25–60",
    estimatedTasks: 18,
    href: "/offers#survey",
    icon: "ScrollText",
    tone: "neutral",
  },
]
