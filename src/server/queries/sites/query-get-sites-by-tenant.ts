import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetSitesByTenant(session: SessionUser) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.site.findMany({
      where: {
        // workshop_manager et technicien voient seulement leurs sites
        ...(!session.permissions.includes("site:view-all")
          ? { id: { in: session.siteIds } }
          : {}),
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            machines: { where: { status: { not: "DECOMMISSIONED" } } },
            interventions: { where: { status: { in: ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] } } },
          },
        },
      },
    })
  })
}

export type SiteListItem = Awaited<ReturnType<typeof queryGetSitesByTenant>>[number]
