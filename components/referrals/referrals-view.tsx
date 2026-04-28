"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, Share2, Users } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"

const REFERRAL_BONUS = 50

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

export function ReferralsView() {
  const { user, profile, openAuth } = useAuth()
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  const code = profile?.referralCode ?? ""
  const link = useMemo(() => {
    if (!origin || !code) return ""
    return `${origin}/?ref=${code}`
  }, [origin, code])

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Copied to clipboard")
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Could not copy", { description: "Select and copy manually." })
    }
  }

  async function share() {
    if (typeof navigator === "undefined") return
    const data = {
      title: "DiamondEarn",
      text: "Join me on DiamondEarn and start earning rewards.",
      url: link,
    }
    try {
      if ("share" in navigator) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(data)
      } else {
        await copy(link)
      }
    } catch {
      /* user cancelled */
    }
  }

  if (!user) {
    return (
      <div className="glass flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-white/10">
          <Users className="size-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Sign in to invite friends</h2>
        <p className="text-muted-foreground max-w-md text-pretty">
          Each account gets a unique referral code. You earn +{REFERRAL_BONUS} diamonds per friend who signs up.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => openAuth({ mode: "login", intent: "View your referral link" })}
            className="bg-white text-black hover:bg-white/90"
          >
            Sign in
          </Button>
          <Button
            variant="outline"
            onClick={() => openAuth({ mode: "register" })}
            className="border-white/15 bg-white/5 hover:bg-white/10"
          >
            Create account
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stat row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Friends invited" value={fmt(profile?.referralCount ?? 0)} />
        <Stat label="Diamonds earned" value={fmt(profile?.referralEarnings ?? 0)} />
        <Stat label="Bonus per signup" value={`+${REFERRAL_BONUS}`} />
      </section>

      {/* Share card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass-strong rounded-2xl p-6"
      >
        <h2 className="text-lg font-medium tracking-tight">Your referral link</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Share this anywhere. New users who sign up via this link will earn you{" "}
          <span className="text-foreground">+{REFERRAL_BONUS} diamonds</span>.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input
            value={link || "Loading…"}
            readOnly
            aria-label="Referral link"
            className="bg-white/5 border-white/10 font-mono text-sm"
            onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => copy(link)}
              disabled={!link}
              className="bg-white text-black hover:bg-white/90"
            >
              {copied ? (
                <>
                  <Check className="size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copy link
                </>
              )}
            </Button>
            <Button
              onClick={share}
              variant="outline"
              disabled={!link}
              className="border-white/15 bg-white/5 hover:bg-white/10"
            >
              <Share2 className="size-4" /> Share
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <KeyVal label="Your code" value={code || "—"} mono onCopy={() => copy(code)} />
          <KeyVal
            label="Your invite link"
            value={link || "—"}
            mono
            onCopy={() => copy(link)}
          />
        </div>
      </motion.div>

      {/* How it works */}
      <section className="grid gap-4 md:grid-cols-3">
        <Step n={1} title="Share your link">
          Post it on Discord, Reddit, X — anywhere your friends hang out.
        </Step>
        <Step n={2} title="They sign up">
          Your link auto-attaches your code so the credit lands on the right account.
        </Step>
        <Step n={3} title="You both earn">
          You get +{REFERRAL_BONUS} diamonds the moment they create their account.
        </Step>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass flex items-center gap-4 rounded-xl p-4">
      <span className="grid size-10 place-items-center rounded-lg bg-white/10">
        <Users className="size-4" />
      </span>
      <div>
        <div className="text-muted-foreground text-[11px] uppercase tracking-widest">
          {label}
        </div>
        <div className="mt-0.5 text-xl font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  )
}

function KeyVal({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string
  value: string
  mono?: boolean
  onCopy?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-muted-foreground text-[11px] uppercase tracking-widest">{label}</div>
        <div className={`truncate text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
      {onCopy && (
        <Button size="icon" variant="ghost" aria-label="Copy" onClick={onCopy} className="size-8">
          <Copy className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <span className="grid size-8 place-items-center rounded-md bg-white text-black text-sm font-semibold">
        {n}
      </span>
      <h3 className="mt-3 font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{children}</p>
    </div>
  )
}
