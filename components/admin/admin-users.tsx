"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Pencil, Search, ShieldCheck, ShieldOff, UserX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"
import type { UserDoc } from "@/lib/types"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { tierForXp } from "@/lib/tiers"
import { levelFromXp } from "@/lib/levels"
import { toast } from "sonner"

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

export function AdminUsers() {
  const { getIdToken, profile: me } = useAuth()
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [editing, setEditing] = useState<UserDoc | null>(null)

  // Debounce the search input so we don't re-fetch on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
    return () => window.clearTimeout(id)
  }, [q])

  const swrKey = useMemo(
    () => `/api/admin/users?q=${encodeURIComponent(debouncedQ)}`,
    [debouncedQ],
  )
  const { data, isLoading, mutate } = useSWR<UserDoc[]>(
    swrKey,
    async (url: string) => {
      const token = await getIdToken()
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      return (json.ok ? json.users : []) as UserDoc[]
    },
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or display name..."
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 rounded-xl p-10 text-center">
          <p className="text-muted-foreground text-sm">No users matched.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Balance</th>
                  <th className="px-4 py-2.5 font-medium">XP / Level</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.map((u) => {
                  const xp = u.totalEarned ?? 0
                  const level = levelFromXp(xp)
                  const tier = tierForXp(xp)
                  return (
                    <tr
                      key={u.uid}
                      className={`border-b border-white/5 last:border-b-0 ${
                        u.banned ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground truncate">
                            {u.displayName || "Player"}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            {u.email || "(no email)"}
                          </span>
                          <span className="text-muted-foreground truncate font-mono text-[10px]">
                            {u.uid}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <DiamondIcon className="size-3" />
                          {fmt(u.balance ?? 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono tabular-nums text-xs">
                            {fmt(xp)} XP
                          </span>
                          <span className={`text-[10px] uppercase tracking-widest ${tier.tone}`}>
                            {tier.name} · L{level}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                            u.role === "admin"
                              ? "border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                              : u.banned
                              ? "border-destructive/40 bg-destructive/10 text-destructive"
                              : "border-white/10 bg-white/[0.04] text-muted-foreground"
                          }`}
                        >
                          {u.role === "admin" ? (
                            <ShieldCheck className="size-3" />
                          ) : u.banned ? (
                            <UserX className="size-3" />
                          ) : null}
                          {u.banned ? "banned" : u.role ?? "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(u)}
                          className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditUserDialog
        user={editing}
        ownUid={me?.uid}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          mutate()
        }}
      />
    </div>
  )
}

function EditUserDialog({
  user,
  ownUid,
  onClose,
  onSaved,
}: {
  user: UserDoc | null
  ownUid?: string
  onClose: () => void
  onSaved: () => void
}) {
  const { getIdToken } = useAuth()
  const [balance, setBalance] = useState("0")
  const [xp, setXp] = useState("0")
  const [role, setRole] = useState<"user" | "admin">("user")
  const [banned, setBanned] = useState(false)
  const [busy, setBusy] = useState(false)

  // Reset the form whenever a new user is opened.
  useEffect(() => {
    if (!user) return
    setBalance(String(user.balance ?? 0))
    setXp(String(user.totalEarned ?? 0))
    setRole(user.role === "admin" ? "admin" : "user")
    setBanned(!!user.banned)
  }, [user])

  if (!user) return null
  const isSelf = user.uid === ownUid

  async function save() {
    if (busy || !user) return
    setBusy(true)
    try {
      const token = await getIdToken()
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: user.uid,
          balance: Number(balance),
          totalEarned: Number(xp),
          role,
          banned,
        }),
      })
      const json = await res.json()
      if (!json.ok) {
        toast.error("Could not save", { description: json.error })
        return
      }
      toast.success("User updated")
      onSaved()
    } catch {
      toast.error("Network error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="glass-strong max-w-md border-white/10">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {user.displayName} · {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="balance">Balance (diamonds)</Label>
            <Input
              id="balance"
              type="number"
              min={0}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="xp">Lifetime XP (totalEarned)</Label>
            <Input
              id="xp"
              type="number"
              min={0}
              value={xp}
              onChange={(e) => setXp(e.target.value)}
              className="bg-white/5 border-white/10"
            />
            <p className="text-muted-foreground text-[11px]">
              Determines the player&apos;s level and tier.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">Role</span>
              <span className="text-muted-foreground text-[11px]">
                {isSelf ? "You can't demote yourself." : "Promote to admin."}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isSelf && role === "admin"}
                onClick={() => setRole("user")}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-widest transition-colors ${
                  role === "user"
                    ? "border-white/30 bg-white text-black"
                    : "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                } disabled:opacity-50`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-widest transition-colors ${
                  role === "admin"
                    ? "border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBanned((b) => !b)}
            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
              banned
                ? "border-destructive/40 bg-destructive/10"
                : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldOff
                className={`size-4 ${
                  banned ? "text-destructive" : "text-muted-foreground"
                }`}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">{banned ? "Banned" : "Active"}</span>
                <span className="text-muted-foreground text-[11px]">
                  Banned users keep XP but can&apos;t post or claim.
                </span>
              </div>
            </div>
            <span
              className={`size-9 rounded-full border-2 ${
                banned
                  ? "border-destructive bg-destructive"
                  : "border-white/20 bg-transparent"
              }`}
              aria-hidden
            />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-xl bg-white text-black hover:bg-white"
          >
            {busy ? <Spinner className="size-4" /> : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
