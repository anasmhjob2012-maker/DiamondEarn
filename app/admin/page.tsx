import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: "Admin — DiamondEarn",
  description: "Operations console for DiamondEarn staff.",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  // Access control happens client-side inside AdminShell using useAuth().
  // Server-side gating would require a session cookie roundtrip; the
  // /api/admin/* endpoints are the real trust boundary.
  return <AdminShell />
}
