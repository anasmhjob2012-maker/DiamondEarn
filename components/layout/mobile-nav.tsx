"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { NAV_ITEMS } from "@/components/layout/nav-config"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import { useAuth } from "@/components/providers/auth-provider"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

// Mobile top bar (logo + balance + hamburger) and the new MistCash-style
// bottom tab bar. Both are hidden on desktop via `md:hidden`. The bottom
// bar uses pure CSS for the active glow so it stays buttery on low-end
// laptops and 6 GB devices — no JS animations.
export function MobileNav() {
  const pathname = usePathname()
  const { user, profile, openAuth, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  // Exactly four items in the bottom bar — Home, Offers, Cashout, Profile.
  // Order is intentional: most-used flows are flanked by Home and Profile.
  const bottom = NAV_ITEMS.filter((i) => i.inBottomBar).slice(0, 4)

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-background/70 px-4 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-white">
            <DiamondIcon className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">DiamondEarn</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <DiamondIcon className="size-3.5" />
            <span className="font-mono text-xs tabular-nums">
              {profile ? fmt(profile.balance) : "—"}
            </span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="size-9">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-strong border-white/10 w-72 p-0">
              <SheetHeader className="border-b border-white/5 p-4 text-left">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <span className="grid size-8 place-items-center rounded-lg bg-white">
                    <DiamondIcon className="size-4" />
                  </span>
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5 overflow-y-auto p-3">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                        active
                          ? "bg-white text-black edge-highlight"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t border-white/5 p-3">
                {user ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={async () => {
                      setOpen(false)
                      await signOut()
                      toast.success("Signed out")
                    }}
                  >
                    <LogOut className="size-4" /> Sign out
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl bg-white text-black hover:bg-white"
                    onClick={() => {
                      setOpen(false)
                      openAuth({ mode: "login" })
                    }}
                  >
                    Sign in
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/*
        MistCash-style sticky bottom bar (mobile only).
        - Frosted glass: backdrop blur over a translucent dark surface.
        - Active state: small glowing blue under-light + tinted icon, no JS.
        - Safe-area inset prevents iOS home-indicator overlap.
      */}
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 md:hidden",
          // Lift slightly off the edge for a floating-bar feel.
          "px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
        )}
      >
        <ul
          className={cn(
            "mx-auto grid max-w-md grid-cols-4 items-stretch",
            "rounded-2xl border border-white/10",
            // Frosted glass — same recipe as `.glass-strong` but tuned for the bar.
            "bg-background/70 backdrop-blur-xl backdrop-saturate-150",
            "shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.6)]",
            // Subtle inner edge so the bar reads as a panel, not a flat strip.
            "edge-highlight",
          )}
        >
          {bottom.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <li key={item.href} className="contents">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 px-1 py-2",
                    "text-[10px] uppercase tracking-[0.14em] transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-200",
                      // Tiny lift on active — feels tactile without JS.
                      active ? "-translate-y-0.5" : "",
                    )}
                    style={
                      active
                        ? {
                            filter: "drop-shadow(0 0 6px var(--accent-blue-soft))",
                          }
                        : undefined
                    }
                  />
                  <span className="leading-none">{item.label}</span>
                  {/* Glowing blue under-light — only visible on active tab. */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--accent-blue) 50%, transparent)",
                      boxShadow:
                        "0 0 12px var(--accent-blue), 0 0 24px var(--accent-blue-soft)",
                    }}
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
