import type { SessionUser } from "@/lib/auth/auth-session-helpers"
import { type Action } from "./permission-matrix"
import { PermissionError } from "@/lib/errors/app-error-classes"

// Vérifie une permission et lance une erreur si refusée
// Accepte un SessionUser (nouveau) ou un role string (legacy — à migrer)
export function assertCan(session: SessionUser, action: Action): void {
  if (session.role === "super_admin") return
  if (!session.permissions.includes(action)) {
    throw new PermissionError(`Action "${action}" non autorisée`, {
      role: session.role,
      action,
    })
  }
}

// Vérifie qu'un utilisateur accède uniquement aux sites qui lui sont assignés
// Exception : super_admin et utilisateurs avec site:view-all voient tous les sites
export function assertSiteAccess(
  session: SessionUser,
  targetSiteId: string
): void {
  if (session.role === "super_admin") return
  if (session.permissions.includes("site:view-all")) return
  if (session.siteIds.length === 0) return

  if (!session.siteIds.includes(targetSiteId)) {
    throw new PermissionError("Accès à ce site non autorisé", { targetSiteId })
  }
}
