"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Phase = "idle" | "ready" | "shaking" | "open"

// A pure-SVG, GPU-cheap treasure chest. The animation runs in CSS layers
// (chest-idle / chest-shake / chest-burst, lid-pop) so the 2012-laptop
// budget stays low. We only re-render when the `phase` prop flips.
export function TreasureChest({
  phase,
  size = 220,
  onAnimationEnd,
}: {
  phase: Phase
  size?: number
  onAnimationEnd?: () => void
}) {
  const sparkleRef = useRef<HTMLDivElement | null>(null)
  const [sparkleSeed, setSparkleSeed] = useState(0)

  // Re-roll sparkle particle positions whenever a new "open" cycle starts.
  useEffect(() => {
    if (phase === "open") {
      setSparkleSeed((s) => s + 1)
      // Notify parent once the burst animation finishes (~0.9s).
      const id = window.setTimeout(() => {
        onAnimationEnd?.()
      }, 950)
      return () => window.clearTimeout(id)
    }
  }, [phase, onAnimationEnd])

  const sparkles = useMemo(() => {
    if (phase !== "open") return []
    return new Array(14).fill(0).map((_, i) => {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4
      const dist = 60 + Math.random() * 60
      return {
        id: `${sparkleSeed}-${i}`,
        sx: Math.cos(angle) * dist,
        sy: Math.sin(angle) * dist - 30,
        delay: Math.random() * 0.1,
        size: 4 + Math.random() * 6,
      }
    })
  }, [phase, sparkleSeed])

  const containerCls = (() => {
    if (phase === "open") return "chest-burst"
    if (phase === "shaking") return "chest-shake"
    if (phase === "ready") return "chest-idle"
    return ""
  })()

  return (
    <div
      ref={sparkleRef}
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {/* Sparkle particles emitted from chest center on open. */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={
            {
              left: "50%",
              top: "44%",
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              ["--sx" as string]: `${s.sx}px`,
              ["--sy" as string]: `${s.sy}px`,
            } as React.CSSProperties
          }
        />
      ))}

      <div className={containerCls} style={{ display: "inline-block" }}>
        <svg
          viewBox="0 0 200 180"
          width={size}
          height={size}
          aria-hidden
          style={{ display: "block" }}
        >
          {/* Subtle ambient glow halo behind chest */}
          <defs>
            <radialGradient id="chest-halo" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="60%" stopColor="rgba(86,182,255,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <linearGradient id="chest-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
            </linearGradient>
            <linearGradient id="chest-lid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
            </linearGradient>
            <linearGradient id="chest-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#56b6ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#56b6ff" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <ellipse cx="100" cy="160" rx="80" ry="14" fill="url(#chest-halo)" />

          {/* Light beam shooting up when open. */}
          {phase === "open" ? (
            <polygon
              points="60,90 140,90 170,10 30,10"
              fill="url(#chest-glow)"
              opacity="0.6"
              style={{ filter: "blur(2px)" }}
            />
          ) : null}

          {/* Chest body */}
          <g>
            <rect
              x="30"
              y="80"
              width="140"
              height="70"
              rx="8"
              fill="url(#chest-body)"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.2"
            />
            {/* Body bands */}
            <rect x="30" y="100" width="140" height="6" fill="rgba(255,255,255,0.18)" />
            <rect x="30" y="125" width="140" height="6" fill="rgba(255,255,255,0.14)" />
            {/* Lock */}
            <rect
              x="92"
              y="92"
              width="16"
              height="22"
              rx="3"
              fill="rgba(0,0,0,0.5)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />
            <circle cx="100" cy="103" r="2" fill="#56b6ff" />
          </g>

          {/* Lid — pops up when phase === open */}
          <g className={phase === "open" ? "lid-pop" : ""}>
            <path
              d="M30 80 Q30 50 100 50 Q170 50 170 80 Z"
              fill="url(#chest-lid)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
            />
            <path
              d="M30 80 Q30 60 100 60 Q170 60 170 80"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
          </g>

          {/* Diamond inside the chest, only visible while open */}
          {phase === "open" ? (
            <g>
              <polygon
                points="100,55 80,70 100,100 120,70"
                fill="#ffffff"
                opacity="0.95"
                style={{ filter: "drop-shadow(0 0 10px #56b6ff)" }}
              />
              <polygon
                points="100,55 80,70 100,75"
                fill="#ffffff"
                opacity="0.6"
              />
            </g>
          ) : null}

          {/* Tiny corner studs */}
          <circle cx="38" cy="88" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="162" cy="88" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="38" cy="142" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="162" cy="142" r="2" fill="rgba(255,255,255,0.5)" />
        </svg>
      </div>
    </div>
  )
}
