import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type SearchResult = {
  id: string
  type: "machine" | "intervention" | "stock"
  title: string
  subtitle: string
  href: string
}

export async function queryGlobalSearch(
  session: SessionUser,
  query: string,
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const q = query.trim()

  const siteFilter: { siteId?: { in: string[] } } =
    ["workshop_manager", "technician", "reader"].includes(session.role) && session.siteIds.length > 0
      ? { siteId: { in: session.siteIds } }
      : {}

  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const [machines, interventions, stockItems] = await Promise.all([
      tx.machine.findMany({
        where: {
          ...siteFilter,
          status: { not: "DECOMMISSIONED" },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
            { manufacturer: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, category: true, site: { select: { name: true } } },
        take: 5,
      }),
      tx.intervention.findMany({
        where: {
          ...siteFilter,
          status: { notIn: ["CLOSED", "CANCELLED"] },
          title: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          machine: { select: { name: true } },
        },
        take: 5,
      }),
      tx.stockItem.findMany({
        where: {
          ...siteFilter,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, reference: true, site: { select: { name: true } } },
        take: 5,
      }),
    ])

    const results: SearchResult[] = []

    for (const m of machines) {
      results.push({
        id: m.id,
        type: "machine",
        title: m.name,
        subtitle: [m.category, m.site.name].filter(Boolean).join(" · "),
        href: `/machines/${m.id}`,
      })
    }

    for (const i of interventions) {
      const typeLabel = i.type === "CORRECTIVE" ? "Corrective" : "Préventive"
      results.push({
        id: i.id,
        type: "intervention",
        title: i.title,
        subtitle: [typeLabel, i.machine?.name].filter(Boolean).join(" · "),
        href: `/interventions/${i.id}`,
      })
    }

    for (const s of stockItems) {
      results.push({
        id: s.id,
        type: "stock",
        title: s.name,
        subtitle: [s.reference, s.site.name].filter(Boolean).join(" · "),
        href: `/stock/${s.id}`,
      })
    }

    return results
  })
}
