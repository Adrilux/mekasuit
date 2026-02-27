import { redirect } from "next/navigation"
import { can, type Action } from "@/lib/permissions/permission-matrix"
import type { UserRole } from "@prisma/client"

// Server Component — vérifie que le rôle courant peut faire l'action demandée
// Si non autorisé : redirige ou affiche le fallback

export function RolePermissionGuard({
  role,
  action,
  children,
  fallback,
  redirectTo = "/dashboard",
}: {
  role: UserRole
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}) {
  if (!can(role, action)) {
    if (fallback) return <>{fallback}</>
    redirect(redirectTo)
  }

  return <>{children}</>
}
