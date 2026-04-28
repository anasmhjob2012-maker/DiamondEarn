"use client"

import { useEffect } from "react"
import Link from "next/link"
import {
  LogOut,
  Sparkles,
  TrendingUp,
  Users,
  Store,
  User as UserIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { OFFERS } from "@/lib/offers"
import { levelProgress } from "@/lib/levels"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { toast } from "sonner"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

export function ProfileView() {
  const { user, profile, loading, openAuth, signOut } = useAuth()

  // Auto-open the auth modal for guests landing on /profile.
  useEffect(() => {
    if (!loading && !user) {
      openAuth({ mode: "login", intent: "View your profile" })
    }
  }, [loading, user, openAuth])

  if (loading) {
    return (
      <div className="glass animate-pulse rounded-xl p-10">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="mt-4 h-4 w-72 rounded bg-white/10" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="glass flex flex-col items-center gap-4 rounded-xl p-10 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-white/10">
          <UserIcon className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile is for members</h1>
        <p className="text-muted-foreground max-w-md text-pretty">
          Sign in or create a free account to track your balance, view your claim history, and climb the
          leaderboard.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => openAuth({ mode: "login" })}
            className="bg-white text-black hover:bg-white/90"
          >
            Sign in
          </Button>
          <Button
            variant="outline"
            onClick={() => openAuth({ mode: "register" })}
            className="border-white/15 bg-white/5 hover:bg-white/10"
          >
            Create account
          </Button>
        </div>
      </div>
    )
  }

  const xp = profile?.totalEarned ?? 0
  const { level, pct, toNext } = levelProgress(xp)

  // Recent claims from the user's lastClaim map.
  const lastClaims = profile?.lastClaim ?? {}
  const recent = Object.entries(lastClaims)
    .map(([offerId, ts]) => {
      const offer = OFFERS.find((o) => o.id === offerId)
      return offer ? { offer, ts: ts as number } : null
    })
    .filter((x): x is { offer: (typeof OFFERS)[number]; ts: number } => x !== null)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-8">
      {/* Header card */}
      <header className="glass-strong flex flex-col gap-5 rounded-2xl p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="relative grid size-16 place-items-center rounded-2xl bg-white text-black text-xl font-semibold edge-highlight">
            {(profile?.displayName ?? user.displayName ?? "P").slice(0, 1).toUpperCase()}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
              L{level}
            </span>
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile?.displayName ?? user.displayName ?? "Player"}
            </h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-white/15 bg-white/5 hover:bg-white/10"
          onClick={async () => {
            await signOut()
            toast.success("Signed out")
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </header>

      {/* Stat grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<DiamondIcon className="size-4" />}
          label="Balance"
          value={profile ? fmt(profile.balance) : "—"}
          accent
        />
        <Stat
          icon={<Sparkles className="size-4" />}
          label="Lifetime earned"
          value={profile ? fmt(profile.totalEarned) : "—"}
        />
        <Stat
          icon={<Users className="size-4" />}
          label="Friends invited"
          value={fmt(profile?.referralCount ?? 0)}
        />
        <Stat
          icon={<Store className="size-4" />}
          label="Cashouts"
          value={fmt(profile?.cashoutCount ?? 0)}
        />
      </section>

      {/* Level progress */}
      <section className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-white/10">
              <TrendingUp className="size-4" />
            </span>
            <h2 className="text-base font-medium">Level progress</h2>
          </div>
          <Link
            href="/levels"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            See ladder
          </Link>
        </div>
        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-500"
            style={{ width: `${pct}%`, boxShadow: "0 0 12px oklch(1 0 0 / 0.4)" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>L{level}</span>
          <span>{fmt(toNext)} XP to next</span>
        </div>
      </section>

      {/* Recent claims */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-medium tracking-tight">Recent claims</h2>
          <Link
            href="/offers"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Browse offers
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">
              You haven&apos;t claimed any offers yet. Head to the offers page to start earning.
            </p>
          </div>
        ) : (
          <ol className="glass divide-y divide-white/5 overflow-hidden rounded-xl">
            {recent.map(({ offer, ts }) => (
              <li key={offer.id} className="flex items-center gap-4 px-5 py-3">
                <span className="grid size-9 place-items-center rounded-md bg-white text-black text-xs font-semibold">
                  +{offer.reward}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">{offer.title}</div>
                  <div className="text-muted-foreground text-xs">{new Date(ts).toLocaleString()}</div>
                </div>
                <DiamondIcon className="size-4 opacity-70" />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={`glass rounded-xl p-5 ${accent ? "glow-ring" : ""}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid size-8 place-items-center rounded-md bg-white/10">{icon}</span>
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  )
}
