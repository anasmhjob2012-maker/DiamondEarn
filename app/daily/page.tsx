import { DailyReward } from "@/components/daily/daily-reward"

export const metadata = {
  title: "Daily Reward — DiamondEarn",
  description: "Claim your guaranteed 24-hour reward and watch your streak grow.",
}

export default function DailyPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">
          Login bonus
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Daily Reward
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          A guaranteed diamond drop every 24 hours. Server-verified — no double-dipping, no exploits.
        </p>
      </header>
      <DailyReward />
    </div>
  )
}
