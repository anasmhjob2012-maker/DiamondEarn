// Admin: list / search users.
//
// GET    ?q=email-fragment&limit=50  → array of UserDoc
// PATCH  body: { uid, balance?, totalEarned?, role?, banned? } → updated UserDoc
//
// All paths gated by requireAdmin().

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

  const url = new URL(req.url)
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase()
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") ?? 50)))

  const db = getAdminDb()
  // Email is stored verbatim. Firestore can't do "contains" natively, so we
  // pull `limit` recently-created users and filter in-process. Sufficient
  // for an admin operator with sane usage. For huge scale, swap in Algolia.
  let snap
  try {
    snap = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get()
  } catch {
    snap = await db.collection("users").limit(limit).get()
  }
  let rows = snap.docs.map((d) => d.data())
  if (q) {
    rows = rows.filter(
      (r: { email?: string; displayName?: string }) =>
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.displayName ?? "").toLowerCase().includes(q),
    )
  }
  return NextResponse.json({ ok: true, users: rows })
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req)
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status },
    )
  }
  let body: {
    uid?: string
    balance?: number
    totalEarned?: number
    role?: "user" | "admin"
    banned?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Bad body" }, { status: 400 })
  }
  if (!body.uid) {
    return NextResponse.json({ ok: false, error: "Missing uid" }, { status: 400 })
  }
  if (body.uid === guard.uid && body.role && body.role !== "admin") {
    // Don't let an admin demote themselves and lock everyone out.
    return NextResponse.json(
      { ok: false, error: "Cannot demote yourself." },
      { status: 400 },
    )
  }

  const update: Record<string, unknown> = {}
  if (typeof body.balance === "number" && Number.isFinite(body.balance)) {
    update.balance = Math.max(0, Math.floor(body.balance))
  }
  if (typeof body.totalEarned === "number" && Number.isFinite(body.totalEarned)) {
    update.totalEarned = Math.max(0, Math.floor(body.totalEarned))
  }
  if (body.role === "user" || body.role === "admin") {
    update.role = body.role
  }
  if (typeof body.banned === "boolean") {
    update.banned = body.banned
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "No changes" }, { status: 400 })
  }

  const db = getAdminDb()
  const userRef = db.collection("users").doc(body.uid)
  const before = await userRef.get()
  if (!before.exists) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 })
  }

  await userRef.update(update)
  db.collection("audit")
    .add({
      uid: guard.uid,
      kind: "admin_user_edit",
      target: body.uid,
      changes: update,
      at: Date.now(),
    })
    .catch(() => {})

  const after = await userRef.get()
  return NextResponse.json({ ok: true, user: after.data() })
}
