"use client"

import { useState } from "react"
import { ShoppingBag, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { DIAMONDS_PER_USD } from "@/lib/offers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/providers/auth-provider"
import { CASHOUT_ITEMS, type CashoutItem } from "@/lib/cashout"
import { toast } from "sonner"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

const BRAND_GROUPS: { key: string; label: string }[] = [
  { key: "PayPal", label: "PayPal" },
  { key: "Razer Gold", label: "Razer Gold" },
  { key: "Steam", label: "Steam" },
  { key: "PlayStation", label: "PlayStation" },
  { key: "Amazon", label: "Amazon" },
]

export function StoreView() {
  const { user, profile, openAuth, getIdToken } = useAuth()
  const [selected, setSelected] = useState<CashoutItem | null>(null)

  return (
    <div className="flex flex-col gap-8">
      {/* Balance ribbon */}
      <div className="glass-strong flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-white">
            <DiamondIcon className="size-5" />
          </span>
          <div>
            <div className="text-muted-foreground text-[11px] uppercase tracking-widest">
              Available balance
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {profile ? fmt(profile.balance) : user ? "—" : "0"}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span>{fmt(DIAMONDS_PER_USD)} diamonds = $1.00 USD</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Verified by DiamondEarn staff
          </span>
        </div>
      </div>

      {BRAND_GROUPS.map((b) => {
        const items = CASHOUT_ITEMS.filter((i) => i.brand === b.key)
        if (items.length === 0) return null
        return (
          <section key={b.key} className="flex flex-col gap-4">
            <h2 className="text-lg font-medium tracking-tight">{b.label}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!user) {
                      openAuth({ mode: "login", intent: `Cash out ${item.label}` })
                      return
                    }
                    setSelected(item)
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="glass group flex flex-col gap-4 rounded-xl p-5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-white/10">
                      <ShoppingBag className="size-4" />
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {item.brand}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-medium leading-tight">{item.label}</h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
                      <DiamondIcon className="size-4" /> {fmt(item.cost)}
                    </span>
                    <span className="text-muted-foreground text-xs uppercase tracking-widest">
                      ${item.payoutUSD}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )
      })}

      <CashoutDialog
        item={selected}
        balance={profile?.balance ?? 0}
        onClose={() => setSelected(null)}
        getIdToken={getIdToken}
      />
    </div>
  )
}

function CashoutDialog({
  item,
  balance,
  onClose,
  getIdToken,
}: {
  item: CashoutItem | null
  balance: number
  onClose: () => void
  getIdToken: () => Promise<string>
}) {
  const [dest, setDest] = useState("")
  const [busy, setBusy] = useState(false)

  const open = !!item
  const insufficient = item ? balance < item.cost : false

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!item || busy) return
    if (insufficient) {
      toast.error("Not enough diamonds", {
        description: "Earn more to redeem this reward.",
      })
      return
    }
    setBusy(true)
    try {
      const token = await getIdToken()
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: item.id, payoutDestination: dest }),
      })
      const data = await res.json()
      if (!data.ok) {
        toast.error("Cashout failed", { description: data.error ?? "Try again." })
        return
      }
      toast.success("Cashout requested", {
        description: `Your ${item.label} request is pending review.`,
      })
      setDest("")
      onClose()
    } catch {
      toast.error("Network error", { description: "Try again in a moment." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="text-balance">{item.label}</DialogTitle>
              <DialogDescription>{item.description}</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <Mini label="Cost" value={`${fmt(item.cost)} diamonds`} />
                <Mini label="Payout" value={`$${item.payoutUSD}`} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="dest" className="text-xs uppercase tracking-widest text-muted-foreground">
                  {item.brand === "PayPal" ? "PayPal email" : `${item.brand} delivery email`}
                </label>
                <Input
                  id="dest"
                  type="email"
                  required
                  autoComplete="email"
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/5 border-white/10"
                />
              </div>
              {insufficient && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
                  You need {fmt(item.cost - balance)} more diamonds to redeem this.
                </div>
              )}
              <Button
                type="submit"
                disabled={busy || insufficient}
                className="rounded-xl bg-white text-black hover:bg-white disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Spinner className="size-4" /> Submitting
                  </>
                ) : (
                  "Confirm cashout"
                )}
              </Button>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                By confirming, your diamonds are deducted immediately and a request is created. If
                anything is wrong, contact support and we&apos;ll refund.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-muted-foreground text-[11px] uppercase tracking-widest">{label}</div>
      <div className="mt-0.5 text-sm tabular-nums">{value}</div>
    </div>
  )
}
