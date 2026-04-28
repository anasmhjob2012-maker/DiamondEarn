// Admin: aggregate site stats.
//
// Counts use Firestore's `count()` aggregation when available.
// totalEarned and totalPayoutUSD are summed by streaming docs (capped at
// 5,000 each so the function stays under the timeout — sufficient for the
// MVP / launch phase).

import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const guard = await requireAdmin(req)
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status },
    )
  }

  const db = getAdminDb()
  const stats = {
    totalUsers: 0,
    totalDiamondsEarned: 0,
    totalCashoutsApproved: 0,
    totalPayoutUSD: 0,
    pendingCashouts: 0,
    bannedUsers: 0,
    chatMessages: 0,
  }

  // Users — count + sum of totalEarned + banned count.
  try {
    const usersSnap = await db.collection("users").limit(5000).get()
    stats.totalUsers = usersSnap.size
    for (const doc of usersSnap.docs) {
      const d = doc.data() as { totalEarned?: number; banned?: boolean }
      stats.totalDiamondsEarned += d.totalEarned ?? 0
      if (d.banned) stats.bannedUsers += 1
    }
  } catch (err) {
    console.error("[v0] users stats", (err as Error).message)
  }

  // Cashouts — split by status.
  try {
    const approved = await db
      .collection("cashouts")
      .where("status", "==", "approved")
      .limit(5000)
      .get()
    stats.totalCashoutsApproved = approved.size
    for (const doc of approved.docs) {
      const d = doc.data() as { payoutUSD?: number }
      stats.totalPayoutUSD += d.payoutUSD ?? 0
    }

    const pending = await db
      .collection("cashouts")
      .where("status", "==", "pending")
      .count()
      .get()
    stats.pendingCashouts = pending.data().count
  } catch (err) {
    console.error("[v0] cashout stats", (err as Error).message)
  }

  // Chat — count.
  try {
    const chat = await db.collection("chat").count().get()
    stats.chatMessages = chat.data().count
  } catch {
    /* collection may be empty */
  }

  return NextResponse.json({ ok: true, stats })
}
