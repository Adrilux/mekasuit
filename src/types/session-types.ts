import type { UserRole } from "@prisma/client"

// Type de session enrichie avec les données tenant
// C'est ce type qui circule dans toute l'application côté serveur
export type SessionUser = {
  id: string        // authUserId Better Auth
  email: string
  name: string
  tenantId: string
  role: UserRole
  siteIds: string[] // sites assignés à cet utilisateur
}
