"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { getDb } from "@/lib/firebase/client"
import type { ChatMessage } from "@/lib/types"
import { tierForLevel } from "@/lib/tiers"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function timeAgo(ms: number): string {
  const d = Date.now() - ms
  if (d < 60_000) return "now"
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`
  return `${Math.floor(d / 86_400_000)}d`
}

// Initials fallback avatar — same generator used in the sidebar.
function initials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "P"
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function GlobalChat({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { user, profile, openAuth, getIdToken } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Live subscription to the chat collection. We listen for the latest 50
  // messages ordered ascending. Snapshot mounts/unmounts with the panel,
  // so closing the chat saves Firestore reads.
  useEffect(() => {
    if (!open) return
    const q = query(
      collection(getDb(), "chat"),
      orderBy("createdAt", "desc"),
      limit(50),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs
          .map((d) => d.data() as ChatMessage)
          .sort((a, b) => a.createdAt - b.createdAt)
        setMessages(next)
      },
      (err) => {
        // If Firestore rules forbid reads, fall back to the GET endpoint.
        console.error("[v0] chat onSnapshot error", err.message)
        fetch("/api/chat")
          .then((r) => r.json())
          .then((data) => {
            if (data.ok) setMessages(data.messages as ChatMessage[])
          })
          .catch(() => {})
      },
    )
    return () => unsub()
  }, [open])

  // Auto-scroll to the latest message whenever the list grows.
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value || busy) return
    if (!user) {
      openAuth({ mode: "login", intent: "Post in global chat" })
      return
    }
    setBusy(true)
    try {
      const token = await getIdToken()
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: value }),
      })
      const data = await res.json()
      if (!data.ok) {
        if (data.code === "THROTTLED") {
          toast.error("Slow down", {
            description: "Wait a couple of seconds between messages.",
          })
        } else if (data.code === "BANNED") {
          toast.error("Banned", { description: "You can't post in chat." })
        } else {
          toast.error("Could not send", { description: data.error })
        }
        return
      }
      setText("")
    } catch {
      toast.error("Network error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.2 }}
          className="glass-strong fixed bottom-24 right-4 z-40 flex h-[min(560px,calc(100dvh-9rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border-white/10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] md:bottom-6 md:right-24"
          role="dialog"
          aria-label="Global chat"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] blue-glow">
              <MessageCircle className="size-4" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-medium">Global chat</span>
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-[var(--accent-blue)]" />
                Live
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-8 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
              aria-label="Close chat"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Message list */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3"
          >
            {messages.length === 0 ? (
              <div className="m-auto flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <MessageCircle className="size-6 opacity-50" />
                <p>No messages yet.</p>
                <p className="text-xs">Be the first to say hi.</p>
              </div>
            ) : (
              messages.map((m) => (
                <ChatBubble key={m.id} message={m} ownUid={user?.uid} />
              ))
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={send}
            className="border-t border-white/10 bg-black/20 px-3 py-3"
          >
            {user ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={280}
                  value={text}
                  disabled={busy}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Chat as ${profile?.displayName ?? "Player"}`}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--accent-blue)]/50 focus:bg-white/10"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={busy || text.trim().length === 0}
                  className="size-9 rounded-lg bg-white text-black hover:bg-white"
                  aria-label="Send"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() =>
                  openAuth({ mode: "login", intent: "Post in global chat" })
                }
                className="w-full rounded-lg bg-white text-black hover:bg-white"
              >
                Sign in to chat
              </Button>
            )}
          </form>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}

function ChatBubble({
  message,
  ownUid,
}: {
  message: ChatMessage
  ownUid?: string
}) {
  const isOwn = message.uid === ownUid
  const isAdmin = message.role === "admin"
  const tier = useMemo(
    () => tierForLevel(message.level ?? 1),
    [message.level],
  )

  return (
    <div className={cn("flex items-start gap-2", isOwn && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
          isAdmin
            ? "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] blue-glow"
            : "bg-white/10 text-foreground",
        )}
        aria-hidden
      >
        {isAdmin ? (
          <ShieldCheck className="size-3.5" />
        ) : (
          initials(message.displayName)
        )}
      </span>
      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-muted-foreground">
          <span className="font-medium normal-case text-foreground">
            {message.displayName}
          </span>
          {isAdmin ? (
            <span className="rounded-sm border border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)] px-1 text-[8px] uppercase text-[var(--accent-blue)]">
              Staff
            </span>
          ) : (
            <span className={cn("uppercase", tier.tone)}>
              {tier.name}
              {message.level ? ` · L${message.level}` : ""}
            </span>
          )}
          <span aria-hidden>·</span>
          <span>{timeAgo(message.createdAt)}</span>
        </div>
        <p
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm leading-relaxed text-pretty",
            isOwn
              ? "border-white/15 bg-white/[0.08]"
              : "border-white/10 bg-white/[0.04]",
          )}
        >
          {message.text}
        </p>
      </div>
    </div>
  )
}
