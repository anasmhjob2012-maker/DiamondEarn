"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Flame,
  Megaphone,
  ScrollText,
  Target,
  Trophy,
  Video,
  type LucideIcon,
} from "lucide-react"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import type { Offerwall } from "@/lib/offerwalls"
import { cn } from "@/lib/utils"

const ICONS: Record<Offerwall["icon"], LucideIcon> = {
  Trophy,
  Flame,
  Target,
  Video,
  Megaphone,
  ScrollText,
}

// Layout variant:
//   - "list"  → horizontal sleek card (used on md+ screens)
//   - "grid"  → compact vertical card (used on small screens, 2-col grid)
type Variant = "list" | "grid"

export function OfferwallCard({
  wall,
  variant,
}: {
  wall: Offerwall
  variant: Variant
}) {
  const Icon = ICONS[wall.icon]
  const iconBg =
    wall.tone === "primary"
      ? "bg-white text-black edge-highlight"
      : wall.tone === "blue"
      ? "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] blue-glow"
      : "bg-white/10 text-foreground"

  if (variant === "list") {
    return (
      <Link
        href={wall.href}
        className="glass group relative flex items-center gap-5 overflow-hidden rounded-xl p-5 transition-colors hover:bg-white/[0.07]"
      >
        {/* Subtle hover halo on the right edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/2 size-40 -translate-y-1/2 rounded-full bg-[var(--accent-blue-soft)] opacity-0 blur-3xl transition-opacity group-hover:opacity-60"
        />

        <span
          className={cn(
            "relative grid size-14 shrink-0 place-items-center rounded-lg",
            iconBg,
          )}
        >
          <Icon className="size-6" />
        </span>

        <div className="relative flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium leading-tight">{wall.brand}</h3>
            {wall.badge ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
                  wall.badge === "Top"
                    ? "border-white/30 bg-white/10 text-white"
                    : wall.badge === "Hot"
                    ? "border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-white/15 bg-white/[0.04] text-muted-foreground",
                )}
              >
                {wall.badge}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {wall.tagline}
          </p>
        </div>

        <div className="relative flex shrink-0 flex-col items-end gap-1.5 text-right">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs">
            <DiamondIcon className="size-3.5" />
            <span className="font-mono tabular-nums">{wall.avgReward}</span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {wall.estimatedTasks}+ tasks
          </span>
        </div>

        <ArrowUpRight className="relative size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    )
  }

  // Grid variant (compact, used on small screens)
  return (
    <Link
      href={wall.href}
      className="glass group relative flex flex-col gap-3 overflow-hidden rounded-xl p-4 transition-colors hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-lg",
            iconBg,
          )}
        >
          <Icon className="size-5" />
        </span>
        {wall.badge ? (
          <span
            className={cn(
              "rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-widest",
              wall.badge === "Top"
                ? "border-white/30 bg-white/10 text-white"
                : wall.badge === "Hot"
                ? "border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                : "border-white/15 bg-white/[0.04] text-muted-foreground",
            )}
          >
            {wall.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium leading-tight">{wall.brand}</h3>
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {wall.tagline}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px]">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <DiamondIcon className="size-3" />
          <span className="font-mono tabular-nums">{wall.avgReward}</span>
        </span>
        <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
