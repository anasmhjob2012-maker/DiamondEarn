// Anti-cheat enforcement point. Every diamond ever credited flows through here.
//
// Hardening (vs "Mr. Cash" style spammers):
//   1. Caller MUST attach a fresh Firebase ID token. We verify with admin SDK.
//   2. The reward is read (or rolled) from a server-only catalog (lib/offers.ts).
//      The client cannot influence the reward by editing the request body.
//   3. Cooldown is enforced inside a Firestore transaction, using the user
//      document's `lastClaim[offerId]` timestamp — so two parallel requests
//      cannot both succeed (race-safe).
//   4. We log each successful claim into the `audit` collection for review.

import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin"
import { getOfferById, rollReward } from "@/lib/offers"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: { offerId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, code: "BAD_BODY", error: "Invalid JSON body." }, { status: 400 })
  }

  const offerId = typeof body.offerId === "string" ? body.offerId : null
  if (!offerId) {
    return NextResponse.json({ ok: false, code: "BAD_OFFER", error: "Missing offerId." }, { status: 400 })
  }
  const offer = getOfferById(offerId)
  if (!offer) {
    return NextResponse.json({ ok: false, code: "UNKNOWN_OFFER", error: "Unknown offer." }, { status: 400 })
  }

  // 1) Verify Firebase ID token.
  const authHeader = req.headers.get("authorization") ?? ""
  const m = authHeader.match(/^Bearer (.+)$/)
  if (!m) {
    return NextResponse.json(
      { ok: false, code: "NO_TOKEN", error: "Missing authentication token." },
      { status: 401 },
    )
  }
  let uid: string
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1], /* checkRevoked */ true)
    uid = decoded.uid
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_TOKEN", error: "Authentication token is invalid or expired." },
      { status: 401 },
    )
  }

  // Compute the reward server-side. For ranged offers (e.g. daily 10..50)
  // this rolls a fresh random value. The client receives it in the response,
  // but cannot influence it.
  const reward = rollReward(offer)

  // 2) Run an atomic transaction: re-check cooldown using server time, then
  //    increment balance and stamp the new last-claim time.
  const db = getAdminDb()
  const userRef = db.collection("users").doc(uid)

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      const now = Date.now()

      // Auto-provision if a user somehow earns before /api/me ran.
      if (!snap.exists) {
        const fresh = {
          uid,
          displayName: "Player",
          email: "",
          balance: reward,
          totalEarned: reward,
          createdAt: now,
          lastClaim: { [offer.id]: now },
        }
        tx.set(userRef, fresh)
        return { balance: fresh.balance, nextAvailableAt: now + offer.cooldownMs }
      }

      const data = snap.data() as { balance?: number; totalEarned?: number; lastClaim?: Record<string, number> }
      const last = data.lastClaim?.[offer.id] ?? 0
      const elapsed = now - last
      if (elapsed < offer.cooldownMs) {
        const retryAfterMs = offer.cooldownMs - elapsed
        const err = new Error("COOLDOWN")
        ;(err as Error & { retryAfterMs: number }).retryAfterMs = retryAfterMs
        throw err
      }

      const newBalance = (data.balance ?? 0) + reward
      tx.update(userRef, {
        balance: FieldValue.increment(reward),
        totalEarned: FieldValue.increment(reward),
        [`lastClaim.${offer.id}`]: now,
      })
      return { balance: newBalance, nextAvailableAt: now + offer.cooldownMs }
    })

    // Best-effort audit log (failure here must not roll back the credit).
    db.collection("audit")
      .add({
        uid,
        offerId: offer.id,
        reward,
        at: Date.now(),
        kind: "earn",
      })
      .catch(() => {})

    return NextResponse.json({
      ok: true,
      balance: result.balance,
      reward,
      nextAvailableAt: result.nextAvailableAt,
    })
  } catch (err) {
    if ((err as Error).message === "COOLDOWN") {
      const retryAfterMs = (err as Error & { retryAfterMs: number }).retryAfterMs
      return NextResponse.json(
        {
          ok: false,
          code: "COOLDOWN",
          error: "This offer is still on cooldown.",
          retryAfterMs,
        },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { ok: false, code: "INTERNAL", error: "Could not credit reward. Try again." },
      { status: 500 },
    )
  }
}
