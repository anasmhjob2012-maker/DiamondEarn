"use client"

import { useEffect, useState } from "react"
import { OfferwallCard } from "@/components/offers/offerwall-card"
import { PARTNER_OFFERWALLS, INTERNAL_OFFERWALLS } from "@/lib/offerwalls"

// Home-page featured strip — shows the 3 partner walls + 3 internal category
// walls. Switches between horizontal list (desktop) and 2-col grid (mobile)
// for the MistCash-inspired responsive feel.
export function FeaturedOfferwalls() {
  const [variant, setVariant] = useState<"list" | "grid">("list")

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setVariant(mq.matches ? "grid" : "list")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Top 3 partners always come first — they convert higher.
  const all = [...PARTNER_OFFERWALLS, ...INTERNAL_OFFERWALLS]

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-3">
        {all.slice(0, 4).map((wall) => (
          <OfferwallCard key={wall.id} wall={wall} variant="list" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {all.map((wall) => (
        <OfferwallCard key={wall.id} wall={wall} variant="grid" />
      ))}
    </div>
  )
}
