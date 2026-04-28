// Provisions the user's Firestore document on first sign-up, and is the
// canonical "who am I" endpoint used after login.
//
// On first provision we ALSO:
//   - generate a deterministic referral code from the uid
//   - record an inviter (`referredBy`) if one was passed in the body
//   - credit the inviter +50 diamonds (server-only, fully audited)

import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin"

export const runtime = "nodejs"

const REFERRAL_BONUS = 50

// Project owner — guaranteed admin. Even if their Firestore role gets reset,
// signing in re-promotes them. Override via env in production.
const OWNER_EMAIL = (
  process.env.OWNER_EMAIL ?? "anasmhjob2012@gmail.com"
).toLowerCase()

async function verify(req: Request) {
  const authHeader = req.headers.get("authorization") ?? ""
  const m = authHeader.match(/^Bearer (.+)$/)
  if (!m) return null
  try {
    return await getAdminAuth().verifyIdToken(m[1], true)
  } catch {
    return null
  }
}

// 8-char base36 referral code derived from uid.
function referralCodeForUid(uid: string): string {
  let h = 0
  for (let i = 0; i < uid.length; i++) {
    h = (h * 31 + uid.charCodeAt(i)) >>> 0
  }
  // Mix in second pass for distribution
  for (let i = uid.length - 1; i >= 0; i--) {
    h = (h ^ (uid.charCodeAt(i) << (i % 5))) >>> 0
  }
  return h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7)
}

export async function POST(req: Request) {
  const decoded = await verify(req)
  if (!decoded) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  let body: { displayName?: string; referredBy?: string } = {}
  try {
    body = await req.json()
  } catch {
    /* allow empty body */
  }

  const db = getAdminDb()
  const userRef = db.collection("users").doc(decoded.uid)
  const existing = await userRef.get()
  const displayName =
    body.displayName?.trim() || decoded.name || decoded.email?.split("@")[0] || "Player"

  if (!existing.exists) {
    const referralCode = referralCodeForUid(decoded.uid)
    let referredByUid: string | null = null

    // Validate the referral code before crediting anyone.
    if (body.referredBy) {
      const code = body.referredBy.trim().toUpperCase()
      if (code && code !== referralCode) {
        const q = await db.collection("users").where("referralCode", "==", code).limit(1).get()
        if (!q.empty) referredByUid = q.docs[0].id
      }
    }

    const isOwner = (decoded.email ?? "").toLowerCase() === OWNER_EMAIL
    await userRef.set({
      uid: decoded.uid,
      displayName,
      email: decoded.email ?? "",
      balance: 0,
      totalEarned: 0,
      createdAt: Date.now(),
      // Owner is always admin. Everyone else is a regular user; promotions
      // happen via the admin panel.
      role: isOwner ? "admin" : "user",
      lastClaim: {},
      redeemedPromos: [],
      referralCode,
      referredBy: referredByUid,
      referralCount: 0,
      referralEarnings: 0,
      cashoutCount: 0,
      banned: false,
    })

    if (referredByUid) {
      const inviterRef = db.collection("users").doc(referredByUid)
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(inviterRef)
        if (!snap.exists) return
        tx.update(inviterRef, {
          balance: FieldValue.increment(REFERRAL_BONUS),
          totalEarned: FieldValue.increment(REFERRAL_BONUS),
          referralCount: FieldValue.increment(1),
          referralEarnings: FieldValue.increment(REFERRAL_BONUS),
        })
      })
      db.collection("audit")
        .add({
          uid: referredByUid,
          kind: "referral",
          invitee: decoded.uid,
          reward: REFERRAL_BONUS,
          at: Date.now(),
        })
        .catch(() => {})
    }
  } else if (body.displayName) {
    await userRef.update({ displayName })
  }

  // Backfills for older accounts that pre-date a field.
  const refresh = await userRef.get()
  const data = refresh.data() as
    | { referralCode?: string; role?: string; email?: string }
    | undefined
  const patch: Record<string, unknown> = {}
  if (data && !data.referralCode) {
    patch.referralCode = referralCodeForUid(decoded.uid)
  }
  // Always re-assert admin role for the owner email so they can never be
  // locked out of /admin (even if their doc was created before this code).
  if (
    (decoded.email ?? "").toLowerCase() === OWNER_EMAIL &&
    data?.role !== "admin"
  ) {
    patch.role = "admin"
  }
  if (Object.keys(patch).length > 0) {
    await userRef.update(patch)
  }

  const final = await userRef.get()
  return NextResponse.json({ ok: true, profile: final.data() })
}

export async function GET(req: Request) {
  const decoded = await verify(req)
  if (!decoded) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  const snap = await getAdminDb().collection("users").doc(decoded.uid).get()
  return NextResponse.json({ ok: true, profile: snap.exists ? snap.data() : null })
}
