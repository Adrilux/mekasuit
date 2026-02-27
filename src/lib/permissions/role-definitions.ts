import type { UserRole } from "@prisma/client"

// Hiérarchie des rôles — un rôle plus élevé hérite des permissions inférieures
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  client_admin: 80,
  workshop_manager: 60,
  technician: 40,
  reader: 20,
}

// Vérifie si un rôle est au moins aussi élevé qu'un rôle cible
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}
