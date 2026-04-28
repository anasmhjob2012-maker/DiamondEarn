"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { NAV_ITEMS } from "@/components/layout/nav-config"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { SidebarXp } from "@/components/layout/sidebar-xp"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Persistent left sidebar. Hidden under md.
export function AppSidebar() {
  const pathname = usePathname()
  const { user, profile, openAuth, signOut, loading } = useAuth()

  return (
    <aside className="sticky top-0 z-20 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/5 bg-sidebar/70 backdrop-blur-md md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-5">
        <span className="grid size-9 place-items-center rounded-lg bg-white edge-highlight">
          <DiamondIcon className="size-4" />
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">DiamondEarn</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Rewards Arena
          </span>
        </div>
      </div>

      {/* XP + Balance card with animated progress bar */}
      <div className="px-4 pt-4">
        <SidebarXp />
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white text-black edge-highlight"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Admin nav item — only visible to admins. */}
        {profile?.role === "admin" ? (
          <Link
            href="/admin"
            className={cn(
              "group mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-white text-black edge-highlight"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-4" />
            <span>Admin</span>
            <span className="ml-auto rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[9px] uppercase tracking-widest">
              Staff
            </span>
          </Link>
        ) : null}
      </nav>

      <div className="border-t border-white/5 p-3">
        {loading ? (
          <div className="h-10 animate-pulse rounded-lg bg-white/5" aria-hidden />
        ) : user ? (
          <div className="flex items-center gap-3 rounded-lg p-2">
            <span className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-semibold">
              {(profile?.displayName ?? user.displayName ?? user.email ?? "P").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                {profile?.displayName ?? user.displayName ?? "Player"}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Sign out"
              onClick={async () => {
                await signOut()
                toast.success("Signed out")
              }}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => openAuth({ mode: "login" })}
            className="w-full rounded-xl bg-white text-black hover:bg-white"
          >
            Sign in
          </Button>
        )}
      </div>
    </aside>
  )
}
