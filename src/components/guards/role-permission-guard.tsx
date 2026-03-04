import { redirect } from "next/navigation"
import type { Action } from "@/lib/permissions/permission-matrix"

// Server Component — vérifie que l'utilisateur a la permission demandée
// Si non autorisé : redirige ou affiche le fallback

export function RolePermissionGuard({
  permissions,
  action,
  children,
  fallback,
  redirectTo = "/dashboard",
}: {
  permissions: string[]
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}) {
  if (!permissions.includes(action)) {
    if (fallback) return <>{fallback}</>
    redirect(redirectTo)
  }

  return <>{children}</>
}
