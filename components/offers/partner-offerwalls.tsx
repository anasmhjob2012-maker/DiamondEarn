"use client"

import { useEffect, useState } from "react"
import { OfferwallCard } from "@/components/offers/offerwall-card"
import { PARTNER_OFFERWALLS } from "@/lib/offerwalls"

// Auto-switches between desktop "list" view (horizontal cards stacked) and
// mobile "grid" view (2-col compact). MistCash-inspired layout.
export function PartnerOfferwalls() {
  const [variant, setVariant] = useState<"list" | "grid">("list")

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setVariant(mq.matches ? "grid" : "list")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-3">
        {PARTNER_OFFERWALLS.map((wall) => (
          <OfferwallCard key={wall.id} wall={wall} variant="list" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {PARTNER_OFFERWALLS.map((wall) => (
        <OfferwallCard key={wall.id} wall={wall} variant="grid" />
      ))}
    </div>
  )
}
