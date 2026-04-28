"use client"

import { toast } from "sonner"
import { DiamondIcon } from "@/components/icons/diamond-icon"

// PS5 "Trophy Earned" style toast. Renders a glassmorphic card with the
// DiamondEarn mark on the left and message + subtitle on the right.
//
// Sonner's `toast.custom` lets us render JSX while keeping queueing,
// dismissal, and timer behavior consistent with the rest of the app.
export function trophyToast(title: string, description?: string) {
  toast.custom(
    () => (
      <div
        role="status"
        className="glass-strong flex w-[320px] items-center gap-3 rounded-xl px-4 py-3 edge-highlight"
        style={{
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(255,255,255,0.05)",
        }}
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-black">
          <DiamondIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Trophy earned
          </div>
          <div className="truncate text-sm font-medium text-foreground">{title}</div>
          {description ? (
            <div className="truncate text-xs text-muted-foreground">{description}</div>
          ) : null}
        </div>
      </div>
    ),
    { duration: 3500 },
  )
}
