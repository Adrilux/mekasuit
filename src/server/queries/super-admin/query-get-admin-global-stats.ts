import { prisma } from "@/lib/db/prisma-client-singleton"

/**
 * Stats globales super-admin — sans RLS, voit toutes les données
 */
export async function queryGetAdminGlobalStats() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [openInterventions, tenantsThisMonth] = await Promise.all([
    prisma.intervention.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] } },
    }),
    prisma.tenant.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
  ])

  return { openInterventions, tenantsThisMonth }
}
