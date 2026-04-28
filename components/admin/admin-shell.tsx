"use client"

import { useState } from "react"
import { Lock, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/providers/auth-provider"
import { Spinner } from "@/components/ui/spinner"
import { AdminStats } from "@/components/admin/admin-stats"
import { AdminUsers } from "@/components/admin/admin-users"
import { AdminCashouts } from "@/components/admin/admin-cashouts"
import { AdminAudit } from "@/components/admin/admin-audit"

// Top-level admin shell. Acts as the access-control layer:
//   - Loading auth → spinner
//   - Not signed in → sign-in CTA
//   - Signed in but role !== "admin" → access denied screen
//   - Otherwise renders the tabbed dashboard.
export function AdminShell() {
  const { user, profile, loading, openAuth } = useAuth()
  const [tab, setTab] = useState("stats")

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="glass-strong mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
          <Lock className="size-5" />
        </span>
        <h1 className="text-balance text-xl font-semibold">Admin only</h1>
        <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
          Sign in with an admin account to manage users, review cashouts, and inspect
          live site stats.
        </p>
        <Button
          onClick={() => openAuth({ mode: "login", intent: "Open admin panel" })}
          className="rounded-xl bg-white text-black hover:bg-white"
        >
          Sign in
        </Button>
      </div>
    )
  }

  if (profile?.role !== "admin") {
    return (
      <div className="glass-strong mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-5" />
        </span>
        <h1 className="text-balance text-xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
          Your account is signed in, but it does not have the{" "}
          <span className="text-foreground">admin</span> role. Ask another admin to
          promote your uid in Firestore.
        </p>
        <code className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-mono text-muted-foreground">
          {user.uid}
        </code>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)] px-3 py-1 text-[11px] uppercase tracking-widest text-[var(--accent-blue)]">
          <ShieldCheck className="size-3.5" /> Admin
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Operations console
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty text-sm">
          Live look at user growth, lifetime diamonds earned, pending cashouts, and chat
          health. Every action is recorded in the audit ledger.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="cashouts">Cashouts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <AdminStats />
        </TabsContent>
        <TabsContent value="cashouts" className="mt-6">
          <AdminCashouts />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <AdminUsers />
        </TabsContent>
        <TabsContent value="logs" className="mt-6">
          <AdminAudit />
        </TabsContent>
      </Tabs>
    </div>
  )
}
