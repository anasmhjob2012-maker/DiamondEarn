import { Crown, Medal } from "lucide-react"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import type { LeaderboardRow } from "@/lib/types"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

export function LeaderboardList({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="glass rounded-xl p-10 text-center">
        <h2 className="text-lg font-medium">No champions yet</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Be the first to claim an offer and you&apos;ll show up here.
        </p>
      </div>
    )
  }

  const [first, second, third, ...rest] = rows
  return (
    <div className="flex flex-col gap-6">
      {/* Podium */}
      <div className="grid gap-3 md:grid-cols-3">
        <PodiumCard row={second} place={2} />
        <PodiumCard row={first} place={1} highlight />
        <PodiumCard row={third} place={3} />
      </div>

      {/* Rest */}
      {rest.length > 0 && (
        <ol className="glass divide-y divide-white/5 overflow-hidden rounded-xl">
          {rest.map((row) => (
            <li
              key={row.uid}
              className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/5"
            >
              <span className="text-muted-foreground w-8 text-sm tabular-nums">#{row.rank}</span>
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-foreground text-xs font-semibold">
                {row.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1 truncate text-sm">{row.displayName}</span>
              <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
                <DiamondIcon className="size-3.5" /> {fmt(row.totalEarned)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function PodiumCard({
  row,
  place,
  highlight,
}: {
  row: LeaderboardRow | undefined
  place: 1 | 2 | 3
  highlight?: boolean
}) {
  if (!row) {
    return (
      <div className="glass rounded-xl p-6 opacity-50">
        <div className="text-muted-foreground text-xs uppercase tracking-widest">#{place}</div>
        <div className="mt-2 text-sm">Waiting for a contender…</div>
      </div>
    )
  }
  const Icon = place === 1 ? Crown : Medal
  return (
    <div
      className={cn(
        "glass relative flex flex-col items-center gap-3 rounded-xl p-6 text-center",
        highlight && "glow-ring",
        place === 1 && "md:order-2",
        place === 2 && "md:order-1",
        place === 3 && "md:order-3",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs uppercase tracking-widest",
          highlight ? "bg-white/15 text-foreground" : "bg-white/5 text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" /> #{row.rank}
      </span>
      <span
        className={cn(
          "grid place-items-center rounded-full text-base font-semibold",
          highlight ? "size-16 bg-white/15 text-foreground" : "size-14 bg-white/5",
        )}
      >
        {row.displayName.slice(0, 1).toUpperCase()}
      </span>
      <div className="flex flex-col items-center">
        <span className="font-medium">{row.displayName}</span>
        <span className="text-muted-foreground inline-flex items-center gap-1 text-sm tabular-nums">
          <DiamondIcon className="size-3.5" /> {fmt(row.totalEarned)}
        </span>
      </div>
    </div>
  )
}
