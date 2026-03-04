import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type PreventiveItem = {
  id: string
  title: string
  status: string
  priority: string
  assignedUserId: string | null
  scheduledAt: Date | null
  recurrenceType: string | null
  closedAt: Date | null
  createdAt: Date
  siteId: string
  site: { name: string }
  machine: { id: string; name: string } | null
}

// Récupère toutes les interventions PREVENTIVE non clôturées ni annulées
// Filtrées par les sites de l'utilisateur si nécessaire
export async function queryGetPreventives(session: SessionUser): Promise<PreventiveItem[]> {
  const siteFilter =
    !session.permissions.includes("site:view-all") && session.siteIds.length > 0
      ? { siteId: { in: session.siteIds } }
      : {}

  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.intervention.findMany({
      where: {
        type: "PREVENTIVE",
        status: { notIn: ["CLOSED", "CANCELLED"] },
        ...siteFilter,
      },
      orderBy: [
        // Nulls last — sans date planifiée en bas
        { scheduledAt: "asc" },
        { priority: "desc" },
      ],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignedUserId: true,
        scheduledAt: true,
        recurrenceType: true,
        closedAt: true,
        createdAt: true,
        siteId: true,
        site: { select: { name: true } },
        machine: { select: { id: true, name: true } },
      },
    })
  })
}
