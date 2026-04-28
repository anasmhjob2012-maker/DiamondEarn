"use client"

import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

// Lightweight page transition — opacity + tiny y-shift only.
// No layout animation, no scale, no blur — keeps repaint cost minimal on
// older Intel HD GPUs (i5 3rd gen target spec).
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
