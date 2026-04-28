"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiamondIcon } from "@/components/icons/diamond-icon"
import type { BotMessage } from "@/lib/types"
import { botAnswer, botGreeting } from "@/lib/bot-faq"
import { cn } from "@/lib/utils"

function nextId() {
  return Math.random().toString(36).slice(2, 10)
}

export function DiamondBot({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [messages, setMessages] = useState<BotMessage[]>(() => {
    const greeting = botGreeting()
    return [
      {
        id: nextId(),
        role: "bot",
        text: greeting.text,
        suggestions: greeting.suggestions,
        createdAt: Date.now(),
      },
    ]
  })
  const [text, setText] = useState("")
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll on new messages.
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, thinking, open])

  function ask(question: string) {
    const q = question.trim()
    if (!q || thinking) return
    const userMsg: BotMessage = {
      id: nextId(),
      role: "user",
      text: q,
      createdAt: Date.now(),
    }
    setMessages((m) => [...m, userMsg])
    setText("")
    setThinking(true)
    // Tiny synthetic delay so the typing indicator reads as "thinking".
    window.setTimeout(() => {
      const reply = botAnswer(q)
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "bot",
          text: reply.text,
          suggestions: reply.suggestions,
          createdAt: Date.now(),
        },
      ])
      setThinking(false)
    }, 400)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="glass-strong fixed bottom-24 right-4 z-40 flex h-[min(560px,calc(100dvh-9rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border-white/10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] md:bottom-6 md:right-24"
          role="dialog"
          aria-label="DiamondBot support"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <span className="relative grid size-9 place-items-center rounded-lg bg-white text-black edge-highlight">
              <Bot className="size-4" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 animate-pulse rounded-full bg-[var(--accent-blue)] ring-2 ring-background" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-medium">DiamondBot</span>
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Sparkles className="size-3 text-[var(--accent-blue)]" />
                AI Support
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-8 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
              aria-label="Close DiamondBot"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
          >
            {messages.map((m) => (
              <BotBubble key={m.id} message={m} onSuggest={ask} />
            ))}
            {thinking ? (
              <div className="flex items-center gap-2 px-1">
                <span className="grid size-7 place-items-center rounded-full bg-white/10">
                  <Bot className="size-3.5" />
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="typing-dot size-1.5 rounded-full bg-foreground" />
                  <span className="typing-dot size-1.5 rounded-full bg-foreground" />
                  <span className="typing-dot size-1.5 rounded-full bg-foreground" />
                </div>
              </div>
            ) : null}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask(text)
            }}
            className="border-t border-white/10 bg-black/20 px-3 py-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={280}
                value={text}
                disabled={thinking}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about earning, cashout, levels..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--accent-blue)]/50 focus:bg-white/10"
              />
              <Button
                type="submit"
                size="icon"
                disabled={thinking || text.trim().length === 0}
                className="size-9 rounded-lg bg-white text-black hover:bg-white"
                aria-label="Ask"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function BotBubble({
  message,
  onSuggest,
}: {
  message: BotMessage
  onSuggest: (q: string) => void
}) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
          isUser ? "bg-white/10" : "bg-[var(--accent-blue-soft)] blue-glow",
        )}
        aria-hidden
      >
        {isUser ? (
          <DiamondIcon className="size-3.5" />
        ) : (
          <Bot className="size-3.5 text-[var(--accent-blue)]" />
        )}
      </span>

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm leading-relaxed text-pretty",
            isUser
              ? "border-white/15 bg-white/[0.08]"
              : "border-white/10 bg-white/[0.04]",
          )}
        >
          {message.text}
        </p>

        {!isUser && message.suggestions && message.suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {message.suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSuggest(q)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--accent-blue-soft)] hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
