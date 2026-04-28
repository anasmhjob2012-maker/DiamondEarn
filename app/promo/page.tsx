import { PromoView } from "@/components/promo/promo-view"

export const metadata = {
  title: "Promo Codes — DiamondEarn",
  description: "Redeem secret codes for instant diamond rewards.",
}

export default function PromoPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">
          Secret drops
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Promo Codes
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Got a code from our community, partner stream or newsletter? Redeem it instantly below.
        </p>
      </header>
      <PromoView />
    </div>
  )
}
