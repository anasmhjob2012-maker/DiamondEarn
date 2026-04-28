import { StoreView } from "@/components/store/store-view"

export const metadata = {
  title: "Cashout — DiamondEarn",
  description: "Trade your diamonds for PayPal cash, Razer Gold, Steam, PSN and more.",
}

export default function StorePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">
          Cashout
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Reward Store
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Trade diamonds for real-world rewards. Requests are processed within 72 hours after a quick
          fraud check.
        </p>
      </header>
      <StoreView />
    </div>
  )
}
