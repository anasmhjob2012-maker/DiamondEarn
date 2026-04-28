// Server-only RBAC helper. Verifies the bearer token AND the user's
// `role === "admin"` flag in Firestore. Use from every /api/admin/* route
// before doing anything privileged.

import "server-only"
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin"

export type AdminGuardResult =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403; error: string }

export async function requireAdmin(req: Request): Promise<AdminGuardResult> {
  const authHeader = req.headers.get("authorization") ?? ""
  const m = authHeader.match(/^Bearer (.+)$/)
  if (!m) return { ok: false, status: 401, error: "Missing token" }
  let uid: string
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1], true)
    uid = decoded.uid
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired token" }
  }
  const snap = await getAdminDb().collection("users").doc(uid).get()
  const data = snap.data() as { role?: string } | undefined
  if (!snap.exists || data?.role !== "admin") {
    return { ok: false, status: 403, error: "Admin only" }
  }
  return { ok: true, uid }
}

// Lightweight helper: just verify the token and return the uid (any role).
export async function requireUser(
  req: Request,
): Promise<{ ok: true; uid: string } | { ok: false; status: 401; error: string }> {
  const authHeader = req.headers.get("authorization") ?? ""
  const m = authHeader.match(/^Bearer (.+)$/)
  if (!m) return { ok: false, status: 401, error: "Missing token" }
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1], true)
    return { ok: true, uid: decoded.uid }
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired token" }
  }
}
