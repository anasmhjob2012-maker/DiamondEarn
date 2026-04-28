// Cashout request — debits diamonds atomically and creates a `cashouts`
// record in pending state for human review. Reward catalog is read from
// /lib/cashout.ts (server-only source of truth).
//
// Body:
//   { itemId: string,
//     payoutDestination?: string,   // email, for gift cards
//     playerId?: string }            // required for game top-ups
//
// The created Firestore doc carries the per-spec fields:
//   email, gameType, amount, playerId, status, timestamp.

import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin"
import { getCashoutItem } from "@/lib/cashout"

export const runtime = "nodejs"

const FIELD_MAX = 200
function sanitize(v: string): string {
  // Strip control chars and clamp length. We don't enforce shape here — the
  // game vendors accept very different ID formats.
  return v.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, FIELD_MAX)
}

export async function POST(req: Request) {
  let body: { itemId?: string; payoutDestination?: string; playerId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_BODY", error: "Invalid request." },
      { status: 400 },
    )
  }
  const item = getCashoutItem(body.itemId ?? "")
  if (!item) {
    return NextResponse.json(
      { ok: false, code: "BAD_ITEM", error: "Unknown reward selected." },
      { status: 400 },
    )
  }

  // Two redemption flows: game top-up (Player ID) or gift card (email).
  let payoutDestination = ""
  let playerId: string | undefined

  if (item.requiresPlayerId) {
    playerId = sanitize(body.playerId ?? "")
    if (playerId.length < 3) {
      return NextResponse.json(
        {
          ok: false,
          code: "BAD_PLAYER_ID",
          error: `Enter a valid ${item.playerIdLabel ?? "Player ID"}.`,
        },
        { status: 400 },
      )
    }
    // Mirror playerId into payoutDestination so the existing admin list
    // (which renders `payoutDestination`) still shows useful info even
    // before the new Player ID column ships.
    payoutDestination = playerId
  } else {
    payoutDestination = sanitize(body.payoutDestination ?? "")
    if (payoutDestination.length < 3) {
      return NextResponse.json(
        { ok: false, code: "BAD_DEST", error: "Enter a valid payout destination." },
        { status: 400 },
      )
    }
  }

  const m = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/)
  if (!m) {
    return NextResponse.json(
      { ok: false, code: "NO_TOKEN", error: "Sign in to cash out." },
      { status: 401 },
    )
  }
  let uid: string
  let email = ""
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1], true)
    uid = decoded.uid
    email = decoded.email ?? ""
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_TOKEN", error: "Session expired." },
      { status: 401 },
    )
  }

  const db = getAdminDb()
  const userRef = db.collection("users").doc(uid)
  const cashoutRef = db.collection("cashouts").doc()

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      if (!snap.exists) throw Object.assign(new Error("NO_USER"), { code: "NO_USER" })
      const data = snap.data() as { balance?: number; banned?: boolean }
      if (data.banned) {
        throw Object.assign(new Error("BANNED"), { code: "BANNED" })
      }
      const balance = data.balance ?? 0
      // Spec: validate balance is sufficient before proceeding.
      if (balance < item.cost) {
        throw Object.assign(new Error("INSUFFICIENT"), { code: "INSUFFICIENT" })
      }
      const now = Date.now()
      const created = {
        id: cashoutRef.id,
        uid,
        itemId: item.id,
        brand: item.brand,
        label: item.label,
        cost: item.cost,
        payoutUSD: item.payoutUSD,
        payoutDestination,
        status: "pending" as const,
        createdAt: now,
        // Per-spec fields used by the admin Operations Console.
        timestamp: now,
        email,
        gameType: item.category === "game" ? item.brand : "",
        amount: item.amount ?? 0,
        currencyLabel: item.currencyLabel ?? "",
        playerId: playerId ?? "",
      }
      tx.set(cashoutRef, created)
      tx.update(userRef, {
        balance: FieldValue.increment(-item.cost),
        cashoutCount: FieldValue.increment(1),
      })
      return { newBalance: balance - item.cost, request: created }
    })

    db.collection("audit")
      .add({
        uid,
        kind: "cashout",
        itemId: item.id,
        cost: item.cost,
        gameType: item.category === "game" ? item.brand : "",
        playerId: playerId ?? "",
        at: Date.now(),
      })
      .catch(() => {})

    return NextResponse.json({ ok: true, balance: result.newBalance, request: result.request })
  } catch (err) {
    const e = err as { code?: string }
    if (e.code === "INSUFFICIENT") {
      return NextResponse.json(
        { ok: false, code: "INSUFFICIENT", error: "Not enough diamonds for this reward." },
        { status: 402 },
      )
    }
    if (e.code === "NO_USER") {
      return NextResponse.json(
        { ok: false, code: "NO_USER", error: "Account not provisioned." },
        { status: 404 },
      )
    }
    if (e.code === "BANNED") {
      return NextResponse.json(
        { ok: false, code: "BANNED", error: "Cashouts are disabled on this account." },
        { status: 403 },
      )
    }
    return NextResponse.json(
      { ok: false, code: "INTERNAL", error: "Could not submit request. Try again." },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/)
  if (!m) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  let uid: string
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1], true)
    uid = decoded.uid
  } catch {
    return NextResponse.json({ ok: false, error: "Session expired" }, { status: 401 })
  }
  try {
    const snap = await getAdminDb()
      .collection("cashouts")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get()
    return NextResponse.json({
      ok: true,
      requests: snap.docs.map((d) => d.data()),
    })
  } catch {
    // Index missing or empty collection — return empty list.
    return NextResponse.json({ ok: true, requests: [] })
  }
}
