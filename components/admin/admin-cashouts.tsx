"use client"

import { useState } from "react"
import useSWR from "swr"
import { Check, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/providers/auth-provider"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import type { CashoutRequest } from "@/lib/types"
import { toast } from "sonner"

type Status = "pending" | "approved" | "rejected"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n)
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleString()
}

export function AdminCashouts() {
  const { getIdToken } = useAuth()
  const [status, setStatus] = useState<Status>("pending")
  const [acting, setActing] = useState<string | null>(null)
  const { data, isLoading, mutate } = useSWR<CashoutRequest[]>(
    `/api/admin/cashouts?status=${status}`,
    async (url: string) => {
      const token = await getIdToken()
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      return (json.ok ? json.requests : []) as CashoutRequest[]
    },
  )

  async function decide(id: string, decision: "approved" | "rejected") {
    if (acting) return
    setActing(id)
    try {
      const token = await getIdToken()
      const res = await fetch("/api/admin/cashouts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status: decision }),
      })
      const json = await res.json()
      if (!json.ok) {
        toast.error("Failed", { description: json.error })
        return
      }
      toast.success(`Marked ${decision}`, {
        description:
          decision === "rejected"
            ? "Diamonds refunded to user."
            : "Reward will be delivered out-of-band.",
      })
      mutate()
    } catch {
      toast.error("Network error")
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {(["pending", "approved", "rejected"] as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
              status === s
                ? "border-white/30 bg-white text-black"
                : "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => mutate()}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
        >
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 rounded-xl p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No {status} cashout requests right now.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((r) => (
            <div
              key={r.id}
              className="glass flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.label}</span>
                  <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {r.brand}
                  </span>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <DiamondIcon className="size-3" />
                    <span className="font-mono tabular-nums">{fmt(r.cost)}</span>
                  </span>
                  <span>{fmtUSD(r.payoutUSD)}</span>
                  <span aria-hidden>·</span>
                  <span>{fmtDate(r.createdAt)}</span>
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  to:{" "}
                  <span className="text-foreground font-mono">
                    {r.payoutDestination}
                  </span>
                </div>
                <div className="text-muted-foreground truncate text-[10px]">
                  uid: <span className="font-mono">{r.uid}</span>
                </div>
              </div>

              {r.status === "pending" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide(r.id, "approved")}
                    disabled={acting === r.id}
                    className="rounded-lg bg-white text-black hover:bg-white"
                  >
                    {acting === r.id ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <>
                        <Check className="size-3.5" /> Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => decide(r.id, "rejected")}
                    disabled={acting === r.id}
                    className="rounded-lg border border-white/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3.5" /> Reject
                  </Button>
                </div>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {r.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
