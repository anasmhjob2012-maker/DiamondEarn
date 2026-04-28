// DiamondBot — static FAQ knowledge base. Used by the floating chat popup
// to answer common support questions without an LLM. Every answer is
// keyed by lowercase keywords; the matcher scores entries by overlap.

import type { BotFAQEntry } from "@/lib/types"

export const BOT_FAQ: BotFAQEntry[] = [
  {
    id: "what-is",
    keywords: ["what", "diamondearn", "site", "platform", "about"],
    question: "What is DiamondEarn?",
    answer:
      "DiamondEarn is a premium rewards platform. Complete offers, watch videos and surveys, and earn diamonds you can cash out for PayPal, Steam, PSN, Razer Gold, and more.",
  },
  {
    id: "earn-how",
    keywords: ["earn", "how", "diamonds", "claim", "make", "money", "start"],
    question: "How do I earn diamonds?",
    answer:
      "Open the Offers page, pick a task, and tap Claim. Daily check-ins, social shares, surveys and short videos all count. Every reward is server-verified — no exploits.",
  },
  {
    id: "cashout",
    keywords: ["cashout", "payout", "withdraw", "redeem", "paypal", "steam", "psn", "razer"],
    question: "How do I cash out?",
    answer:
      "Head to the Cashout page once your balance covers the reward you want. PayPal payouts arrive within 72 hours. Gift card codes are emailed automatically once approved.",
  },
  {
    id: "minimum",
    keywords: ["minimum", "min", "lowest", "smallest"],
    question: "What is the minimum cashout?",
    answer:
      "5,000 diamonds (worth $5). 1,000 diamonds equal $1, so you can cash out as soon as you reach that threshold.",
  },
  {
    id: "referrals",
    keywords: ["referral", "invite", "friend", "code", "link"],
    question: "How do referrals work?",
    answer:
      "Share your unique referral link from the Referrals page. You earn +50 diamonds every time a new player signs up using your link.",
  },
  {
    id: "levels",
    keywords: ["level", "xp", "rank", "tier", "progress"],
    question: "How does the level system work?",
    answer:
      "XP equals lifetime diamonds earned. As you level up you unlock tiers — Player, Pro, Elite, Legend, Mythic. Cashing out never reduces your XP — your rank is permanent.",
  },
  {
    id: "daily",
    keywords: ["daily", "chest", "reward", "checkin", "check-in", "streak"],
    question: "Where is the daily chest?",
    answer:
      "Open the Daily page and tap the chest once it's ready. The cooldown is 24 hours and the reward is rolled randomly between 10 and 50 diamonds on the server.",
  },
  {
    id: "cooldown",
    keywords: ["cooldown", "wait", "again", "timer", "locked"],
    question: "Why is an offer locked?",
    answer:
      "Each offer has its own cooldown — daily, hourly, or weekly. The countdown lives on our servers, so refreshing or signing out won't reset it.",
  },
  {
    id: "support",
    keywords: ["support", "help", "issue", "problem", "missing", "stuck", "broken"],
    question: "I'm stuck — can I talk to a human?",
    answer:
      "If your question isn't answered here, post it in the global chat or use the in-app feedback form. Admins respond within 24 hours on weekdays.",
  },
  {
    id: "ban",
    keywords: ["ban", "banned", "suspended", "blocked", "cheat"],
    question: "What gets you banned?",
    answer:
      "Multi-accounting, VPN abuse, automated claim scripts, and falsified offer completions. Every claim is logged in our audit ledger. We don't unban exploit accounts.",
  },
  {
    id: "currency",
    keywords: ["dollar", "usd", "price", "rate", "convert", "value", "worth"],
    question: "What's a diamond worth?",
    answer:
      "1,000 diamonds = $1.00 USD. The exchange rate is fixed across the entire site — what you see is what you get.",
  },
]

const FALLBACK_SUGGESTIONS = [
  "How do I earn diamonds?",
  "How do I cash out?",
  "How do referrals work?",
  "Where is the daily chest?",
]

const GREETING = {
  text: "Hi! I'm DiamondBot. I can help with earning, cashout, levels, referrals, and bans. Pick a topic below or type a question.",
  suggestions: FALLBACK_SUGGESTIONS,
}

export function botGreeting() {
  return GREETING
}

// Tokenize the user's question, score every FAQ entry by keyword overlap,
// and return the best match. Returns a fallback if nothing scores > 0.
export function botAnswer(input: string): { text: string; suggestions?: string[] } {
  const tokens = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)

  if (tokens.length === 0) {
    return GREETING
  }

  let best: { entry: BotFAQEntry; score: number } | null = null
  for (const entry of BOT_FAQ) {
    let score = 0
    for (const kw of entry.keywords) {
      if (tokens.includes(kw)) score += 2
      else if (tokens.some((t) => t.includes(kw) || kw.includes(t))) score += 1
    }
    if (!best || score > best.score) best = { entry, score }
  }

  if (!best || best.score === 0) {
    return {
      text:
        "I couldn't match that to anything in my FAQ. Try one of these popular topics, or post in the global chat for a human admin.",
      suggestions: FALLBACK_SUGGESTIONS,
    }
  }
  // Suggest two adjacent topics so the user can keep exploring.
  const others = BOT_FAQ.filter((e) => e.id !== best!.entry.id)
    .slice(0, 3)
    .map((e) => e.question)
  return { text: best.entry.answer, suggestions: others }
}
