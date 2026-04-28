"use client"

// Activity Logs — latest events from the `audit` collection.
//
// Every server route (earn, cashout, promo, referral, admin_*) writes into
// `audit` with a stable shape: { kind, uid, at, ...details }. We render them
// as a compact event stream and let admins filter by kind.

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivitySquare,
  CheckCircle2,
  Coins,
  Gift,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { useAuth } from "@/components/providers/auth-provider"
import { cn } from "@/lib/utils"

type AuditEntry = {
  id: string
  kind: string
  uid?: string
  at?: number
  reward?: number
  amount?: number
  cost?: number
  target?: string
  decision?: "approved" | "rejected"
  promo?: string
  offerId?: string
  invitee?: string
}

const KIND_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "earn", label: "Offer claims" },
  { value: "cashout_request", label: "Cashout requests" },
  { value: "admin_cashout_decision", label: "Cashout decisions" },
  { value: "promo", label: "Promo codes" },
  { value: "referral", label: "Referrals" },
  { value: "admin_user_update", label: "Admin user edits" },
  { value: "admin_message_delete", label: "Chat deletions" },
]

function fmtAgo(ts?: number) {
  if (!ts) return "—"
  const diff = Math.max(0, Date.now() - ts)
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function fmt(n?: number) {
  if (typeof n !== "number") return "—"
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

function iconFor(kind: string) {
  if (kind === "earn") return Coins
  if (kind === "cashout_request") return Wallet
  if (kind === "admin_cashout_decision") return ShieldCheck
  if (kind === "promo") return Gift
  if (kind === "referral") return Users
  if (kind === "admin_user_update") return ShieldCheck
  if (kind === "admin_message_delete") return XCircle
  return ActivitySquare
}

function describe(e: AuditEntry): string {
  switch (e.kind) {
    case "earn":
      return `Claimed offer ${e.offerId ?? ""} for +${fmt(e.reward)} diamonds`
    case "cashout_request":
      return `Requested cashout of ${fmt(e.amount)} for ${fmt(e.cost)} diamonds`
    case "admin_cashout_decision":
      return `${e.decision === "approved" ? "Approved" : "Rejected"} cashout ${e.target ?? ""}`
    case "promo":
      return `Redeemed promo "${e.promo ?? ""}" for +${fmt(e.reward)} diamonds`
    case "referral":
      return `Invited a friend (+${fmt(e.reward)} diamonds)`
    case "admin_user_update":
      return `Edited user ${e.target ?? ""}`
    case "admin_message_delete":
      return `Deleted chat message ${e.target ?? ""}`
    default:
      return e.kind.replace(/_/g, " ")
  }
}

export function AdminAudit() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>("all")

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const url =
        filter === "all"
          ? "/api/admin/audit?limit=100"
          : `/api/admin/audit?limit=100&kind=${encodeURIComponent(filter)}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const data = await res.json()
      if (data.ok) setEntries(data.entries as AuditEntry[])
      else setEntries([])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [user, filter])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(() => entries ?? [], [entries])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Activity log</h2>
          <p className="text-muted-foreground text-sm">
            Latest events recorded across the platform&apos;s server routes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px] rounded-xl border-white/10 bg-white/5">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-xl">
              {KIND_FILTERS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh activity log"
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl">
        {!entries || loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Spinner className="size-5" />
          </div>
        ) : grouped.length === 0 ? (
          <Empty className="bg-transparent">
            <EmptyHeader>
              <EmptyTitle>No events yet</EmptyTitle>
              <EmptyDescription>
                Server-side events will appear here as users earn, cash out, and chat.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="divide-y divide-white/5">
            {grouped.map((e) => {
              const Icon = iconFor(e.kind)
              const positive =
                e.kind === "earn" || e.kind === "promo" || e.kind === "referral"
              const negative =
                e.kind === "admin_message_delete" ||
                (e.kind === "admin_cashout_decision" && e.decision === "rejected")
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl border border-white/10",
                      positive
                        ? "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : negative
                          ? "bg-destructive/10 text-destructive"
                          : "bg-white/5 text-foreground",
                    )}
                  >
                    {positive ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{describe(e)}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {e.uid ? `${e.uid.slice(0, 8)}…` : "system"} · {e.kind}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtAgo(e.at)}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
