"use client"

import { useState } from "react"
import { Bot, MessageCircle } from "lucide-react"
import { GlobalChat } from "@/components/chat/global-chat"
import { DiamondBot } from "@/components/chat/diamond-bot"
import { cn } from "@/lib/utils"

type Panel = null | "chat" | "bot"

// Two stacked FABs in the bottom-right that toggle the global chat sidebar
// and the DiamondBot popup. Opening one closes the other.
export function FloatingDock() {
  const [panel, setPanel] = useState<Panel>(null)

  function toggle(next: Panel) {
    setPanel((cur) => (cur === next ? null : next))
  }

  return (
    <>
      <GlobalChat
        open={panel === "chat"}
        onOpenChange={(v) => setPanel(v ? "chat" : null)}
      />
      <DiamondBot
        open={panel === "bot"}
        onOpenChange={(v) => setPanel(v ? "bot" : null)}
      />

      {/* FAB stack — sits above the mobile bottom nav (`bottom-20` on small
          screens leaves room for the 5-tab bar). */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
        <button
          type="button"
          onClick={() => toggle("chat")}
          aria-label={panel === "chat" ? "Close global chat" : "Open global chat"}
          aria-expanded={panel === "chat"}
          className={cn(
            "pointer-events-auto group relative grid size-12 place-items-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md transition-all hover:bg-white/[0.12]",
            panel === "chat" && "blue-glow border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)]",
          )}
        >
          <MessageCircle
            className={cn(
              "size-5 transition-colors",
              panel === "chat" ? "text-[var(--accent-blue)]" : "text-foreground",
            )}
          />
          <span className="absolute -top-0.5 -right-0.5 size-2.5 animate-pulse rounded-full bg-[var(--accent-blue)] ring-2 ring-background" />
          <span className="sr-only">Global chat</span>
        </button>

        <button
          type="button"
          onClick={() => toggle("bot")}
          aria-label={panel === "bot" ? "Close DiamondBot" : "Open DiamondBot support"}
          aria-expanded={panel === "bot"}
          className={cn(
            "pointer-events-auto group relative grid size-12 place-items-center rounded-full border border-white/15 bg-white text-black transition-all hover:bg-white",
            "ps5-glow",
            panel === "bot" && "blue-glow",
          )}
        >
          <Bot className="size-5" />
          <span className="sr-only">DiamondBot AI support</span>
        </button>
      </div>
    </>
  )
}
