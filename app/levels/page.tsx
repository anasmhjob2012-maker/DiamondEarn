import { LevelsView } from "@/components/levels/levels-view"

export const metadata = {
  title: "Levels & Progress — DiamondEarn",
  description: "Earn diamonds, gain XP, and climb from Level 1 to Level 100.",
}

export default function LevelsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">
          Progress
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Levels &amp; Progress
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Every diamond you ever earn counts as XP. Climb from Level 1 to Level 100 and unlock badges.
        </p>
      </header>
      <LevelsView />
    </div>
  )
}
