// Admin: cashout review.
//
// GET    ?status=pending|approved|rejected    → list (latest 100)
// PATCH  body: { id, status: "approved"|"rejected" }
//   - On reject we refund the user atomically.
//   - On approve we just stamp the status; payout is delivered out-of-band.

import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
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
  const status = url.searchParams.get("status") ?? "pending"
  const valid = ["pending", "approved", "rejected"]
  if (!valid.includes(status)) {
    return NextResponse.json(
      { ok: false, error: "Bad status" },
      { status: 400 },
    )
  }

  const db = getAdminDb()
  let snap
  try {
    snap = await db
      .collection("cashouts")
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get()
  } catch {
    // Composite index missing — fall back to status-only filter.
    snap = await db
      .collection("cashouts")
      .where("status", "==", status)
      .limit(100)
      .get()
  }
  const requests = snap.docs
    .map((d) => d.data())
    .sort(
      (a: { createdAt?: number }, b: { createdAt?: number }) =>
        (b.createdAt ?? 0) - (a.createdAt ?? 0),
    )
  return NextResponse.json({ ok: true, requests })
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req)
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status },
    )
  }
  let body: { id?: string; status?: "approved" | "rejected" }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Bad body" }, { status: 400 })
  }
  if (!body.id || (body.status !== "approved" && body.status !== "rejected")) {
    return NextResponse.json(
      { ok: false, error: "Missing id or invalid status" },
      { status: 400 },
    )
  }

  const db = getAdminDb()
  const ref = db.collection("cashouts").doc(body.id)

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new Error("NOT_FOUND")
      const data = snap.data() as {
        status: string
        uid: string
        cost: number
      }
      if (data.status !== "pending") {
        throw new Error("ALREADY_DECIDED")
      }
      tx.update(ref, {
        status: body.status,
        decidedAt: Date.now(),
        decidedBy: guard.uid,
      })
      // Refund on reject.
      if (body.status === "rejected") {
        const userRef = db.collection("users").doc(data.uid)
        tx.update(userRef, {
          balance: FieldValue.increment(data.cost),
        })
      }
    })

    db.collection("audit")
      .add({
        uid: guard.uid,
        kind: "admin_cashout_decision",
        target: body.id,
        decision: body.status,
        at: Date.now(),
      })
      .catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = (err as Error).message
    if (msg === "NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 },
      )
    }
    if (msg === "ALREADY_DECIDED") {
      return NextResponse.json(
        { ok: false, error: "Already decided" },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    )
  }
}
