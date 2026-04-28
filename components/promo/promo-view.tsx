"use client"

import { useState } from "react"
import { Check, Ticket } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/providers/auth-provider"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { MotionButton } from "@/components/effects/motion-button"
import { toast } from "sonner"

export function PromoView() {
  const { user, profile, openAuth, getIdToken } = useAuth()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const redeemed = profile?.redeemedPromos ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!code.trim()) return
    if (!user) {
      openAuth({ mode: "login", intent: "Redeem a promo code" })
      return
    }
    setBusy(true)
    try {
      const token = await getIdToken()
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!data.ok) {
        const msg =
          data.code === "USED"
            ? "You already redeemed this code."
            : data.code === "EXPIRED"
              ? "This code has expired."
              : data.code === "INVALID"
                ? "That code doesn't match anything."
                : data.error ?? "Could not redeem code."
        toast.error("Redemption failed", { description: msg })
        return
      }
      toast.success(`+${data.reward} diamonds`, {
        description: `${data.description ?? "Promo redeemed"}. New balance: ${data.balance.toLocaleString()}.`,
      })
      setCode("")
    } catch {
      toast.error("Network error", { description: "Try again in a moment." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass-strong flex flex-col gap-5 rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-white text-black edge-highlight">
            <Ticket className="size-5" />
          </span>
          <h2 className="text-lg font-medium">Enter a code</h2>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="promo-code" className="text-xs uppercase tracking-widest text-muted-foreground">
            Promo code
          </label>
          <Input
            id="promo-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME100"
            autoComplete="off"
            spellCheck={false}
            className="bg-white/5 border-white/10 font-mono tracking-widest text-base h-12"
            maxLength={32}
          />
        </div>

        <MotionButton>
          <Button
            type="submit"
            size="lg"
            disabled={busy || !code.trim()}
            className="w-full rounded-xl bg-white text-black hover:bg-white disabled:opacity-50"
          >
            {busy ? (
              <>
                <Spinner className="size-4" /> Redeeming
              </>
            ) : user ? (
              <>
                <DiamondIcon className="size-4" /> Redeem code
              </>
            ) : (
              "Sign in to redeem"
            )}
          </Button>
        </MotionButton>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Each promo code can be redeemed once per account. Codes are case-insensitive.
        </p>
      </motion.form>

      {/* Redeemed history / hints */}
      <div className="flex flex-col gap-4">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-base font-medium">Where to find codes</h3>
          <ul className="text-muted-foreground mt-3 flex flex-col gap-2 text-sm leading-relaxed">
            <li>
              <span className="text-foreground">·</span> Subscribe to the DiamondEarn newsletter for
              monthly drops.
            </li>
            <li>
              <span className="text-foreground">·</span> Watch our partner streamers — codes are dropped
              live during giveaways.
            </li>
            <li>
              <span className="text-foreground">·</span> Follow our social channels for limited-time
              community events.
            </li>
          </ul>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-base font-medium">Codes you&apos;ve redeemed</h3>
          {redeemed.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              No codes redeemed yet. Try one above.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {redeemed.slice(0, 8).map((c) => (
                <li
                  key={c}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs tracking-widest"
                >
                  <span>{c}</span>
                  <Check className="size-3.5 text-muted-foreground" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
