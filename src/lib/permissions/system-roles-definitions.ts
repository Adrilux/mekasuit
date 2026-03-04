import type { UserRole } from "@prisma/client"
import { PERMISSION_MATRIX } from "./permission-matrix"

// Noms français affichés dans l'UI pour chaque rôle système
export const SYSTEM_ROLE_LABELS: Record<UserRole, string> = {
  super_admin:      "Super Administrateur",
  client_admin:     "Administrateur",
  workshop_manager: "Responsable Atelier",
  technician:       "Technicien",
  reader:           "Lecteur",
}

// Définitions complètes des rôles système à créer à l'init d'un tenant
// (super_admin exclu — géré globalement, pas par tenant)
export const TENANT_SYSTEM_ROLES: { systemRole: UserRole; name: string }[] = [
  { systemRole: "client_admin", name: SYSTEM_ROLE_LABELS.client_admin },
]

// Retourne les permissions d'un rôle système depuis PERMISSION_MATRIX
export function getSystemRolePermissions(systemRole: UserRole): string[] {
  return PERMISSION_MATRIX[systemRole] ?? []
}
