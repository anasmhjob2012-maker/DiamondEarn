"use client"

import useSWR from "swr"
import { Ban, MessageCircle, Store, TrendingUp, Users, Wallet } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { Spinner } from "@/components/ui/spinner"

type Stats = {
  totalUsers: number
  totalDiamondsEarned: number
  totalCashoutsApproved: number
  totalPayoutUSD: number
  pendingCashouts: number
  bannedUsers: number
  chatMessages: number
}

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n)
}

export function AdminStats() {
  const { getIdToken } = useAuth()
  const { data, isLoading, mutate } = useSWR<Stats | null>(
    "/api/admin/stats",
    async (url: string) => {
      const token = await getIdToken()
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      return json.ok ? (json.stats as Stats) : null
    },
    { refreshInterval: 30_000 },
  )

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={<Users className="size-4" />}
        label="Total users"
        value={fmt(data.totalUsers)}
        sub={`${fmt(data.bannedUsers)} banned`}
      />
      <StatCard
        icon={<DiamondIcon className="size-4" />}
        label="Lifetime diamonds earned"
        value={fmt(data.totalDiamondsEarned)}
        sub="across all accounts"
        accent
      />
      <StatCard
        icon={<Wallet className="size-4" />}
        label="Total payouts"
        value={fmtUSD(data.totalPayoutUSD)}
        sub={`${fmt(data.totalCashoutsApproved)} approved redemptions`}
      />
      <StatCard
        icon={<Store className="size-4" />}
        label="Pending cashouts"
        value={fmt(data.pendingCashouts)}
        sub="awaiting review"
        accent={data.pendingCashouts > 0}
      />
      <StatCard
        icon={<MessageCircle className="size-4" />}
        label="Chat messages"
        value={fmt(data.chatMessages)}
        sub="lifetime"
      />
      <StatCard
        icon={<Ban className="size-4" />}
        label="Banned accounts"
        value={fmt(data.bannedUsers)}
        sub="cannot post in chat"
      />
      <button
        type="button"
        onClick={() => mutate()}
        className="glass flex items-center justify-center gap-2 rounded-xl p-5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
      >
        <TrendingUp className="size-4" /> Refresh stats
      </button>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={`glass relative overflow-hidden rounded-xl p-5 ${
        accent ? "blue-glow" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid size-8 place-items-center rounded-md ${
            accent
              ? "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
              : "bg-white/10"
          }`}
        >
          {icon}
        </span>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tabular-nums">{value}</div>
      {sub ? (
        <div className="text-muted-foreground mt-0.5 text-xs">{sub}</div>
      ) : null}
    </div>
  )
}
