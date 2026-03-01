import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type SupplierOption = {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export async function queryGetSuppliers(session: SessionUser): Promise<SupplierOption[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.supplier.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
    })
  })
}
