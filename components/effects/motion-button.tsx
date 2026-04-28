"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * PS5-style scale + soft white glow on hover/focus. Wrap any clickable
 * element. Defaults to a button. The actual visual styling (rounded, white
 * background, etc.) should still come from your existing Button or Link.
 *
 * Designed to be transform-only (cheap on GPU). Respects prefers-reduced-motion.
 */
type Props = {
  children: React.ReactNode
  className?: string
  asChild?: boolean
  /** Strength of the scale-up (default 1.04). */
  scale?: number
} & React.HTMLAttributes<HTMLDivElement>

export function MotionButton({
  children,
  className,
  scale = 1.04,
  asChild = false,
  ...rest
}: Props) {
  const reduced = useReducedMotion()
  const hover = reduced ? {} : { scale, transition: { duration: 0.18, ease: "easeOut" } }
  const tap = reduced ? {} : { scale: 0.98, transition: { duration: 0.08 } }

  return (
    <motion.div
      whileHover={hover}
      whileTap={tap}
      className={cn(
        "inline-flex rounded-xl transition-shadow duration-200",
        // glow only when hovered / focused-within
        "hover:ps5-glow focus-within:ps5-glow",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
