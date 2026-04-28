// Promo code redemption — server-side validation, one-time per user.
// Mirrors /api/earn's hardening: token verify, atomic txn, audit log.

import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin"
import { findPromo } from "@/lib/promo"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, code: "BAD_BODY", error: "Invalid request." }, { status: 400 })
  }
  const raw = (body.code ?? "").toString()
  if (!raw.trim()) {
    return NextResponse.json({ ok: false, code: "EMPTY", error: "Enter a code." }, { status: 400 })
  }
  const promo = findPromo(raw)
  if (!promo) {
    return NextResponse.json({ ok: false, code: "INVALID", error: "That code is not valid." }, { status: 404 })
  }
  if (promo.expiresAt && Date.now() > promo.expiresAt) {
    return NextResponse.json({ ok: false, code: "EXPIRED", error: "This code has expired." }, { status: 410 })
  }

  const m = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/)
  if (!m) {
    return NextResponse.json({ ok: false, code: "NO_TOKEN", error: "Sign in to redeem." }, { status: 401 })
  }
  let uid: string
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1], true)
    uid = decoded.uid
  } catch {
    return NextResponse.json({ ok: false, code: "BAD_TOKEN", error: "Session expired." }, { status: 401 })
  }

  const db = getAdminDb()
  const userRef = db.collection("users").doc(uid)
  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      if (!snap.exists) {
        throw Object.assign(new Error("NO_USER"), { code: "NO_USER" })
      }
      const data = snap.data() as { redeemedPromos?: string[]; balance?: number }
      const redeemed = data.redeemedPromos ?? []
      if (redeemed.includes(promo.code)) {
        throw Object.assign(new Error("USED"), { code: "USED" })
      }
      tx.update(userRef, {
        balance: FieldValue.increment(promo.reward),
        totalEarned: FieldValue.increment(promo.reward),
        redeemedPromos: FieldValue.arrayUnion(promo.code),
      })
      return { newBalance: (data.balance ?? 0) + promo.reward }
    })

    db.collection("audit")
      .add({ uid, kind: "promo", code: promo.code, reward: promo.reward, at: Date.now() })
      .catch(() => {})

    return NextResponse.json({
      ok: true,
      reward: promo.reward,
      balance: result.newBalance,
      description: promo.description,
    })
  } catch (err) {
    const e = err as { code?: string; message?: string }
    if (e.code === "USED") {
      return NextResponse.json(
        { ok: false, code: "USED", error: "You already redeemed this code." },
        { status: 409 },
      )
    }
    if (e.code === "NO_USER") {
      return NextResponse.json(
        { ok: false, code: "NO_USER", error: "Account not provisioned. Sign in again." },
        { status: 404 },
      )
    }
    return NextResponse.json(
      { ok: false, code: "INTERNAL", error: "Could not redeem code. Try again." },
      { status: 500 },
    )
  }
}
