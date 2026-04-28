"use client"

import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { MotionButton } from "@/components/effects/motion-button"
import { DIAMONDS_PER_USD, diamondsToUSD, formatUSD } from "@/lib/offers"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

export function BalanceCard() {
  const { user, profile, openAuth } = useAuth()
  const balance = profile?.balance ?? 0

  return (
    <aside className="glass-strong relative overflow-hidden rounded-2xl p-6">
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-white/15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs uppercase tracking-widest">Your wallet</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3" /> Live
          </span>
        </div>

        {user ? (
          <>
            <div className="flex items-baseline gap-3">
              <DiamondIcon className="size-7" glow />
              <span className="text-5xl font-semibold tabular-nums tracking-tight glow-text text-white">
                {fmt(balance)}
              </span>
              <span className="text-muted-foreground text-sm">diamonds</span>
            </div>
            <div className="text-muted-foreground text-xs">
              ≈ <span className="text-foreground tabular-nums">{formatUSD(diamondsToUSD(balance))}</span>
              <span className="ml-2 opacity-70">
                ({fmt(DIAMONDS_PER_USD)} diamonds = $1.00 USD)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Lifetime earned" value={profile ? fmt(profile.totalEarned) : "—"} />
              <Stat label="Player" value={profile?.displayName ?? user.displayName ?? "Player"} />
            </div>
            <MotionButton className="mt-auto w-full">
              <Button
                asChild
                className="w-full rounded-xl bg-white text-black hover:bg-white"
              >
                <Link href="/offers">Claim more</Link>
              </Button>
            </MotionButton>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <DiamondIcon className="size-7 opacity-60" />
              <span className="text-5xl font-semibold tabular-nums tracking-tight text-muted-foreground">
                0
              </span>
              <span className="text-muted-foreground text-sm">diamonds</span>
            </div>
            <div className="text-muted-foreground text-xs">
              {fmt(DIAMONDS_PER_USD)} diamonds = $1.00 USD
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You&apos;re browsing as a guest. Create a free account to start collecting diamonds — your
              balance syncs across devices.
            </p>
            <div className="mt-auto flex flex-col gap-2 sm:flex-row">
              <MotionButton className="flex-1">
                <Button
                  onClick={() => openAuth({ mode: "register", intent: "Start earning diamonds" })}
                  className="w-full rounded-xl bg-white text-black hover:bg-white"
                >
                  Create account
                </Button>
              </MotionButton>
              <Button
                variant="outline"
                onClick={() => openAuth({ mode: "login" })}
                className="flex-1 rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
              >
                Sign in
              </Button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-muted-foreground text-[11px] uppercase tracking-widest">{label}</div>
      <div className="mt-0.5 truncate text-sm">{value}</div>
    </div>
  )
}
