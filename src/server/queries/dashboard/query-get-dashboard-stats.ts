import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetDashboardStats(
  session: SessionUser,
  options: { stockModuleActive?: boolean; siteId?: string } = {}
) {
  const { stockModuleActive = false, siteId } = options

  // Filtre par site : siteId explicite > filtre rôle > pas de filtre (admin)
  const siteFilter: { siteId?: string | { in: string[] } } =
    siteId
      ? { siteId }
      : ["workshop_manager", "technician", "reader"].includes(session.role) && session.siteIds.length > 0
        ? { siteId: { in: session.siteIds } }
        : {}

  const now = new Date()
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const openStatuses = ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] as const

  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    // --- KPIs ---
    const [
      openInterventions,
      criticalInterventions,
      machinesUnderMaintenance,
      machinesTotal,
      overdueCount,
      preventiveThisWeekCount,
    ] = await Promise.all([
      tx.intervention.count({
        where: { ...siteFilter, status: { in: [...openStatuses] } },
      }),
      tx.intervention.count({
        where: { ...siteFilter, priority: "CRITICAL", status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      tx.machine.count({ where: { ...siteFilter, status: "UNDER_MAINTENANCE" } }),
      tx.machine.count({ where: { ...siteFilter, status: { not: "DECOMMISSIONED" } } }),
      tx.intervention.count({
        where: { ...siteFilter, scheduledAt: { lt: now }, status: { in: [...openStatuses] } },
      }),
      tx.intervention.count({
        where: {
          ...siteFilter,
          type: "PREVENTIVE",
          scheduledAt: { gte: now, lte: in7days },
          status: { in: [...openStatuses] },
        },
      }),
    ])

    // --- Interventions récentes ouvertes (5 max) ---
    const recentOpenInterventions = await tx.intervention.findMany({
      where: { ...siteFilter, status: { in: [...openStatuses] } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        createdAt: true,
        machine: { select: { name: true } },
        site: { select: { name: true } },
      },
    })

    // --- Interventions en retard (5 max) ---
    const overdueInterventions = overdueCount > 0
      ? await tx.intervention.findMany({
          where: { ...siteFilter, scheduledAt: { lt: now }, status: { in: [...openStatuses] } },
          orderBy: [{ scheduledAt: "asc" }],
          take: 5,
          select: {
            id: true,
            title: true,
            priority: true,
            scheduledAt: true,
            assignedUserId: true,
            machine: { select: { name: true } },
            site: { select: { name: true } },
          },
        })
      : []

    // --- Stock en rupture (si module actif) ---
    let lowStockCount = 0
    let lowStockItems: {
      id: string
      name: string
      reference: string
      quantityOnHand: number
      minimumLevel: number
      unit: string
      siteId: string
      site: { name: string }
    }[] = []

    if (stockModuleActive) {
      const allStockItems = await tx.stockItem.findMany({
        where: { ...siteFilter },
        select: {
          id: true,
          name: true,
          reference: true,
          quantityOnHand: true,
          minimumLevel: true,
          unit: true,
          siteId: true,
          site: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      })
      const lowItems = allStockItems.filter((i) => i.quantityOnHand <= i.minimumLevel)
      lowStockCount = lowItems.length
      lowStockItems = lowItems.slice(0, 5)
    }

    return {
      openInterventions,
      criticalInterventions,
      machinesUnderMaintenance,
      machinesTotal,
      overdueCount,
      preventiveThisWeekCount,
      lowStockCount,
      recentOpenInterventions,
      overdueInterventions,
      lowStockItems,
    }
  })
}

export type DashboardStats = Awaited<ReturnType<typeof queryGetDashboardStats>>
