import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

type Filter = {
  siteId: string
  search?: string
  status?: string
}

export async function queryGetMachinesBySite(session: SessionUser, filterOrSiteId: string | Filter) {
  const filter: Filter = typeof filterOrSiteId === "string" ? { siteId: filterOrSiteId } : filterOrSiteId
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.machine.findMany({
      where: {
        siteId: filter.siteId,
        ...(filter.status ? { status: filter.status as never } : {}),
        ...(filter.search
          ? { name: { contains: filter.search, mode: "insensitive" } }
          : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        manufacturer: true,
        model: true,
        status: true,
        serialNumber: true,
        installedAt: true,
        qrCodeSlug: true,
        // Compte les interventions ouvertes pour afficher un badge d'alerte
        _count: { select: { interventions: { where: { status: { in: ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] } } } } },
      },
    })
  })
}

export type MachineListItem = Awaited<ReturnType<typeof queryGetMachinesBySite>>[number]
