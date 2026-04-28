import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Custom Diamond SVG — renders pure white facets so it reads as the
 * "DiamondEarn" currency mark across the PS5-style monochrome UI.
 *
 * Pass `glow` to add a soft white halo (use sparingly).
 */
export function DiamondIcon({
  className,
  glow = false,
  ...rest
}: React.SVGProps<SVGSVGElement> & { glow?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Diamond"
      className={cn("inline-block", className)}
      style={glow ? { filter: "drop-shadow(0 0 6px rgba(255,255,255,0.45))" } : undefined}
      {...rest}
    >
      {/* Crown */}
      <path d="M12 2.2 3.6 9.2h16.8L12 2.2Z" fill="#ffffff" opacity="0.95" />
      {/* Crown facet shading */}
      <path d="M12 2.2 7.6 9.2H3.6L12 2.2Z" fill="#ffffff" opacity="0.7" />
      {/* Pavilion */}
      <path d="M3.6 9.2 12 21.8l8.4-12.6H3.6Z" fill="#ffffff" opacity="0.85" />
      {/* Pavilion left facet */}
      <path d="M3.6 9.2 12 21.8 7.6 9.2H3.6Z" fill="#ffffff" opacity="0.6" />
      {/* Pavilion right facet */}
      <path d="M20.4 9.2 12 21.8l4.4-12.6h4Z" fill="#ffffff" opacity="0.55" />
      {/* Crown center band */}
      <path d="M7.6 9.2h8.8" stroke="#0a0a0a" strokeOpacity="0.18" strokeWidth="0.6" />
    </svg>
  )
}
