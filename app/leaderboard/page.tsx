import { Trophy } from "lucide-react"
import { getAdminDb } from "@/lib/firebase/admin"
import type { LeaderboardRow } from "@/lib/types"
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list"

export const metadata = {
  title: "Leaderboard — DiamondEarn",
  description: "Top diamond earners this season.",
}

// Cheap RSC read using the admin SDK. A 30s revalidate window keeps Firestore
// reads minimal while still feeling live.
export const revalidate = 30

async function getRows(): Promise<LeaderboardRow[]> {
  try {
    const snap = await getAdminDb()
      .collection("users")
      .orderBy("totalEarned", "desc")
      .limit(20)
      .get()
    return snap.docs.map((d, i) => {
      const data = d.data() as { displayName?: string; totalEarned?: number }
      return {
        uid: d.id,
        displayName: data.displayName ?? "Player",
        totalEarned: data.totalEarned ?? 0,
        rank: i + 1,
      }
    })
  } catch {
    // Firestore not yet provisioned or admin creds wrong — render empty state.
    return []
  }
}

export default async function LeaderboardPage() {
  const rows = await getRows()
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
          <Trophy className="size-3.5" /> Season 01
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Leaderboard</h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          The top 20 earners across the platform. Updated every 30 seconds.
        </p>
      </header>

      <LeaderboardList rows={rows} />
    </div>
  )
}
