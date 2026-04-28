"use client"

import * as React from "react"

/**
 * PS5 home-screen feel: 14 ambient white orbs gently floating across the
 * background. Pure CSS animation (transform + opacity only) so it costs
 * almost nothing on weak GPUs like Intel HD 4000 (i5 3rd gen).
 *
 * The seed is computed on the client to avoid hydration mismatches.
 */

type Orb = {
  size: number
  top: number
  left: number
  delay: number
  duration: number
  blur: number
  opacity: number
}

function generateOrbs(count: number): Orb[] {
  const orbs: Orb[] = []
  for (let i = 0; i < count; i++) {
    orbs.push({
      size: 80 + Math.random() * 220,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: -Math.random() * 18,
      duration: 14 + Math.random() * 12,
      blur: 30 + Math.random() * 50,
      opacity: 0.18 + Math.random() * 0.25,
    })
  }
  return orbs
}

export function FloatingOrbs({ count = 14 }: { count?: number }) {
  // Generate once per client mount to avoid SSR/CSR mismatch.
  const [orbs, setOrbs] = React.useState<Orb[] | null>(null)

  React.useEffect(() => {
    setOrbs(generateOrbs(count))
  }, [count])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      // The container itself is fixed and behind every layer of UI.
    >
      {orbs?.map((o, i) => (
        <span
          key={i}
          className="orb"
          style={{
            width: o.size,
            height: o.size,
            top: `${o.top}%`,
            left: `${o.left}%`,
            animationDelay: `${o.delay}s`,
            animationDuration: `${o.duration}s`,
            filter: `blur(${o.blur}px)`,
            opacity: o.opacity,
          }}
        />
      ))}
    </div>
  )
}
