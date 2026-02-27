import type { UserRole } from "@prisma/client"
import { can, type Action } from "./permission-matrix"
import { PermissionError } from "@/lib/errors/app-error-classes"

// Vérifie une permission et lance une erreur si refusée
// À utiliser dans les Server Actions avant toute opération
export function assertCan(role: UserRole, action: Action): void {
  if (!can(role, action)) {
    throw new PermissionError(`Rôle "${role}" non autorisé pour l'action "${action}"`, {
      role,
      action,
    })
  }
}

// Vérifie qu'un utilisateur accède uniquement aux sites qui lui sont assignés
// Exception : super_admin et client_admin voient tous les sites de leur tenant
// Si siteIds est vide pour un rôle restreint, aucune restriction (cohérent avec les queries)
export function assertSiteAccess(
  role: UserRole,
  userSiteIds: string[],
  targetSiteId: string
): void {
  if (role === "super_admin" || role === "client_admin") return
  if (userSiteIds.length === 0) return

  if (!userSiteIds.includes(targetSiteId)) {
    throw new PermissionError("Accès à ce site non autorisé", { targetSiteId })
  }
}
