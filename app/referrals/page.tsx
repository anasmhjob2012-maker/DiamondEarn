import { ReferralsView } from "@/components/referrals/referrals-view"

export const metadata = {
  title: "Referrals — DiamondEarn",
  description: "Invite friends, track your invites, and earn commissions on signup.",
}

export default function ReferralsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">
          Invite & earn
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Referrals
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Share your link. Get +50 diamonds the moment a friend creates an account.
        </p>
      </header>
      <ReferralsView />
    </div>
  )
}
