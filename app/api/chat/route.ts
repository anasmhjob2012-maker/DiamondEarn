// Global live-chat backend.
//
// POST   - send a message (auth required, rate-limited per uid).
// GET    - returns the latest 50 messages, oldest first. Used as a fallback
//          when the client can't open a Firestore snapshot listener.
// DELETE - admin-only message removal (uid bumped via the admin panel).
//
// Anti-spam: each uid is throttled to one message every ~2s. Messages are
// trimmed to 280 chars. Profanity filtering is intentionally minimal here —
// admins can remove offensive messages from the admin panel.

import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { requireAdmin, requireUser } from "@/lib/admin-auth"
import { levelFromXp } from "@/lib/levels"
import { tierForLevel } from "@/lib/tiers"

export const runtime = "nodejs"

const MAX_LEN = 280
const THROTTLE_MS = 2000

function clean(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LEN)
}

export async function POST(req: Request) {
  const guard = await requireUser(req)
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", error: guard.error },
      { status: guard.status },
    )
  }
  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_BODY", error: "Invalid JSON" },
      { status: 400 },
    )
  }
  const text = clean(body.text ?? "")
  if (text.length < 1) {
    return NextResponse.json(
      { ok: false, code: "EMPTY", error: "Message is empty." },
      { status: 400 },
    )
  }

  const db = getAdminDb()
  const userRef = db.collection("users").doc(guard.uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) {
    return NextResponse.json(
      { ok: false, code: "NO_USER", error: "Account not provisioned." },
      { status: 404 },
    )
  }
  const userData = userSnap.data() as {
    displayName?: string
    totalEarned?: number
    role?: "user" | "admin"
    banned?: boolean
    lastChatAt?: number
  }

  if (userData.banned) {
    return NextResponse.json(
      { ok: false, code: "BANNED", error: "Your account is banned from chat." },
      { status: 403 },
    )
  }

  const now = Date.now()
  const last = userData.lastChatAt ?? 0
  if (now - last < THROTTLE_MS) {
    return NextResponse.json(
      {
        ok: false,
        code: "THROTTLED",
        error: "Please wait a moment before sending another message.",
        retryAfterMs: THROTTLE_MS - (now - last),
      },
      { status: 429 },
    )
  }

  const level = levelFromXp(userData.totalEarned ?? 0)
  const tier = tierForLevel(level)
  const msgRef = db.collection("chat").doc()
  const message = {
    id: msgRef.id,
    uid: guard.uid,
    displayName: userData.displayName ?? "Player",
    text,
    createdAt: now,
    level,
    tier: tier.name,
    role: userData.role ?? "user",
  }
  await msgRef.set(message)
  await userRef.update({ lastChatAt: now })

  return NextResponse.json({ ok: true, message })
}

export async function GET() {
  try {
    const snap = await getAdminDb()
      .collection("chat")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get()
    const messages = snap.docs.map((d) => d.data()).reverse()
    return NextResponse.json({ ok: true, messages })
  } catch {
    return NextResponse.json({ ok: true, messages: [] })
  }
}

// Admin-only delete. Body: { id: string }
export async function DELETE(req: Request) {
  const guard = await requireAdmin(req)
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status },
    )
  }
  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Bad body" }, { status: 400 })
  }
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
  }
  await getAdminDb().collection("chat").doc(body.id).delete()
  await getAdminDb()
    .collection("audit")
    .add({
      uid: guard.uid,
      kind: "chat_delete",
      messageId: body.id,
      at: Date.now(),
    })
    .catch(() => {})
  return NextResponse.json({ ok: true })
}
