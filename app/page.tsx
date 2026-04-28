import Link from "next/link"
import { ArrowRight, Calendar, Gamepad2, ShieldCheck, Store, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BalanceCard } from "@/components/home/balance-card"
import { QuickOffers } from "@/components/home/quick-offers"
import { FeaturedOfferwalls } from "@/components/home/featured-offerwalls"
import { QuickStats } from "@/components/home/quick-stats"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { MotionButton } from "@/components/effects/motion-button"

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass-strong relative overflow-hidden rounded-2xl p-6 md:p-10">
          {/* Subtle white glow blob — pure CSS, GPU-cheap */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/8 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest">
              <DiamondIcon className="size-3.5" /> Season 01 — Live
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Earn diamonds.
              <br />
              <span className="glow-text">Rule the leaderboard.</span>
            </h1>
            <p className="text-pretty max-w-xl text-muted-foreground">
              A premium rewards arena with a PS5-grade glass aesthetic. Browse as a guest, sign in only
              when you&apos;re ready to claim. Every reward is enforced server-side — no exploits, no
              client-side nonsense.
            </p>
            <div className="flex flex-wrap gap-3">
              <MotionButton>
                <Button asChild size="lg" className="rounded-xl bg-white text-black hover:bg-white">
                  <Link href="/offers">
                    Browse offers <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </MotionButton>
              <MotionButton>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
                >
                  <Link href="/daily">
                    <Calendar className="size-4" /> Daily reward
                  </Link>
                </Button>
              </MotionButton>
            </div>
          </div>
        </div>

        <BalanceCard />
      </section>

      {/* Quick stats */}
      <QuickStats />

      {/* Featured offerwalls */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Featured offerwalls</h2>
            <p className="text-muted-foreground text-sm">
              Pick a wall, complete tasks, earn diamonds. Server-tracked end-to-end.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/offers">
              See all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <FeaturedOfferwalls />
      </section>

      {/* Pillars */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Pillar
          icon={<Gamepad2 className="size-5" />}
          title="Play, share, earn"
          body="Quick actions across video, social and surveys — all server-tracked."
        />
        <Pillar
          icon={<ShieldCheck className="size-5" />}
          title="Anti-exploit by default"
          body="Every claim is signed by your account and verified server-side with cooldowns."
        />
        <Pillar
          icon={<Trophy className="size-5" />}
          title="Climb the ranks"
          body="Public leaderboard. Top 20 earners are featured every season."
        />
      </section>

      {/* Quick offers */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Hot right now</h2>
            <p className="text-muted-foreground text-sm">A quick taste of what you can claim today.</p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/offers">
              See all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <QuickOffers />
      </section>

      {/* CTA strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <CtaCard
          icon={<Store className="size-5" />}
          title="Cash out instantly"
          body="Trade diamonds for PayPal, Steam, PSN and more."
          href="/store"
          cta="Open the store"
        />
        <CtaCard
          icon={<Users className="size-5" />}
          title="Invite friends"
          body="+50 diamonds for every friend who signs up."
          href="/referrals"
          cta="Get my link"
        />
        <CtaCard
          icon={<Trophy className="size-5" />}
          title="Top 20 earners"
          body="See who&apos;s leading the season right now."
          href="/leaderboard"
          cta="View leaderboard"
        />
      </section>
    </div>
  )
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="grid size-9 place-items-center rounded-md bg-white/10">{icon}</div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
    </div>
  )
}

function CtaCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode
  title: string
  body: string
  href: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="glass group flex flex-col gap-3 rounded-xl p-5 transition-colors hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-md bg-white/10">{icon}</span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{cta}</span>
    </Link>
  )
}
