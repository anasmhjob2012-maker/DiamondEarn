// Public read of the top earners. We use the admin SDK on the server so we
// don't need to expose a "list all users" path through Firestore rules.

import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import type { LeaderboardRow } from "@/lib/types"

export const runtime = "nodejs"
// Tiny edge-cache window keeps Firestore reads cheap while staying fresh.
export const revalidate = 30

export async function GET() {
  const snap = await getAdminDb().collection("users").orderBy("totalEarned", "desc").limit(20).get()
  const rows: LeaderboardRow[] = snap.docs.map((d, i) => {
    const data = d.data() as { displayName?: string; totalEarned?: number }
    return {
      uid: d.id,
      displayName: data.displayName ?? "Player",
      totalEarned: data.totalEarned ?? 0,
      rank: i + 1,
    }
  })
  return NextResponse.json({ ok: true, rows })
}
