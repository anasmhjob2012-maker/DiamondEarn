"use client"

import { OFFERS } from "@/lib/offers"
import { OfferCard } from "@/components/offers/offer-card"

export function QuickOffers() {
  // Show a featured slice on the home page; the full list lives at /offers.
  const featured = OFFERS.slice(0, 3)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {featured.map((o) => (
        <OfferCard key={o.id} offer={o} />
      ))}
    </div>
  )
}
