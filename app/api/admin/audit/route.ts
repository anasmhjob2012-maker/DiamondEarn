// Admin: activity log viewer.
//
// GET ?kind=earn|cashout|admin_*&limit=100  → latest audit entries (newest first)
//
// Reads the existing `audit` collection that every server route writes to
// (earn, cashout, promo, referral, admin_*). Light-weight: paginates by `at`
// timestamp instead of cursor objects so the 2012 laptop stays happy.

import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { requireAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export async function GET(req: Request) {
  const guard = await requireAdmin(req)
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status },
    )
  }

  const url = new URL(req.url)
  const kind = url.searchParams.get("kind")?.trim() || ""
  const requested = Number.parseInt(url.searchParams.get("limit") ?? "", 10)
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  const db = getAdminDb()
  let snap
  try {
    let q = db.collection("audit").orderBy("at", "desc").limit(limit)
    if (kind) q = db.collection("audit").where("kind", "==", kind).orderBy("at", "desc").limit(limit)
    snap = await q.get()
  } catch {
    // Composite index missing — fall back to a plain ordered scan.
    const fallback = await db.collection("audit").orderBy("at", "desc").limit(limit).get()
    const filtered = kind
      ? fallback.docs.filter((d) => (d.data() as { kind?: string }).kind === kind)
      : fallback.docs
    return NextResponse.json({
      ok: true,
      entries: filtered.map((d) => ({ id: d.id, ...d.data() })),
    })
  }

  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ ok: true, entries })
}
