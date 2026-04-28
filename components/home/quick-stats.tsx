"use client"

import Link from "next/link"
import { Calendar, TrendingUp, Users } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { levelFromXp } from "@/lib/levels"
import { getOfferById } from "@/lib/offers"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

export function QuickStats() {
  const { profile } = useAuth()
  const xp = profile?.totalEarned ?? 0
  const level = levelFromXp(xp)

  // "Daily ready?" reflects whether the daily-checkin offer can be claimed.
  const daily = getOfferById("daily-checkin")
  const lastDaily = profile?.lastClaim?.[daily?.id ?? ""] ?? 0
  const dailyReady = daily ? Date.now() - lastDaily >= daily.cooldownMs : false

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Quick account stats"
    >
      <StatLink
        href="/store"
        icon={<DiamondIcon className="size-4" />}
        label="Balance"
        value={profile ? fmt(profile.balance) : "—"}
        hint="Diamonds available"
      />
      <StatLink
        href="/levels"
        icon={<TrendingUp className="size-4" />}
        label="Level"
        value={profile ? `L${level}` : "—"}
        hint={profile ? `${fmt(xp)} XP` : "Sign in to track"}
      />
      <StatLink
        href="/daily"
        icon={<Calendar className="size-4" />}
        label="Daily reward"
        value={!profile ? "Sign in" : dailyReady ? "Ready" : "Locked"}
        hint={dailyReady ? "Tap to claim" : "Cooldown active"}
      />
      <StatLink
        href="/referrals"
        icon={<Users className="size-4" />}
        label="Friends invited"
        value={profile ? fmt(profile.referralCount ?? 0) : "—"}
        hint="+50 each signup"
      />
    </section>
  )
}

function StatLink({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <Link
      href={href}
      className="glass group flex flex-col gap-2 rounded-xl p-4 transition-colors hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid size-8 place-items-center rounded-md bg-white/10">{icon}</span>
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="text-muted-foreground text-xs">{hint}</div>
    </Link>
  )
}
