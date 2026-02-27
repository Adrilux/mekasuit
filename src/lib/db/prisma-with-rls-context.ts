import { Prisma } from "@prisma/client"
import { prisma } from "./prisma-client-singleton"

// Toutes les opérations DB tenant-scoped DOIVENT passer par cette fonction
// Elle définit le contexte RLS pour la transaction, garantissant l'isolation
// Le set_config avec 'true' en 3e arg limite la valeur à la transaction en cours

export async function withTenantContext<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Définit le tenant_id pour toutes les politiques RLS de cette transaction
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
    return fn(tx)
  })
}

// Version sans transaction pour les lectures simples (lecture seule)
// À utiliser UNIQUEMENT pour des requêtes où la transaction n'est pas nécessaire
export async function withTenantReadContext<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
  return fn()
}
