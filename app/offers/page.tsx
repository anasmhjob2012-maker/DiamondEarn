import { Sparkles } from "lucide-react"
import { OFFERS } from "@/lib/offers"
import { OfferCard } from "@/components/offers/offer-card"
import { PartnerOfferwalls } from "@/components/offers/partner-offerwalls"

export const metadata = {
  title: "Offers — DiamondEarn",
  description: "Claim daily, social, video and survey offers to earn diamonds.",
}

export default function OffersPage() {
  // Group offers by category for a clean, scannable layout.
  const groups: { key: string; title: string; items: typeof OFFERS }[] = [
    { key: "daily", title: "Daily", items: OFFERS.filter((o) => o.category === "daily") },
    { key: "video", title: "Video", items: OFFERS.filter((o) => o.category === "video") },
    { key: "social", title: "Social", items: OFFERS.filter((o) => o.category === "social") },
    { key: "survey", title: "Surveys", items: OFFERS.filter((o) => o.category === "survey") },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">Earn</span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Offers</h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Cooldowns and reward amounts are enforced on the server. Sign in to claim — your progress syncs everywhere.
        </p>
      </header>

      {/* Top Offerwalls — partner integrations (AyetStudios, AdGateMedia, Lootably).
          Horizontal list on desktop / 2-col grid on mobile. */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-widest">
              Top Offerwalls
            </span>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Partner walls
            </h2>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground sm:inline-flex">
            <Sparkles className="size-3.5" />
            285+ live tasks
          </span>
        </div>
        <PartnerOfferwalls />
      </section>

      {/* Internal quick offers (claim-and-go) — below the partner walls. */}
      {groups.map((group) => (
        <section key={group.key} id={group.key} className="flex flex-col gap-4">
          <h2 className="text-lg font-medium tracking-tight">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
