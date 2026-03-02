import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { can } from "@/lib/permissions/permission-matrix"
import { Prisma } from "@prisma/client"
import { SiteFloorPlanClient } from "@/components/sites/site-floor-plan-client"

export default async function SiteFloorPlanPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  const session = await requireSession()

  const site = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.site.findFirst({
      where: { id: siteId },
      select: {
        id: true,
        name: true,
        floorPlanImage: true,
        machinePins: true,
      },
    })
  })

  if (!site) notFound()

  const machines = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.machine.findMany({
      where: {
        siteId,
        status: { not: "DECOMMISSIONED" },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: {
            interventions: {
              where: { status: { in: ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] } },
            },
          },
        },
      },
    })
  })

  const canEdit = can(session.role, "site:update")

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Link href="/sites" className="text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Plan 2D — {site.name}</h1>
      </div>

      <SiteFloorPlanClient
        site={{
          id: site.id,
          name: site.name,
          floorPlanImage: site.floorPlanImage,
          machinePins: (site.machinePins as Record<string, { x: number; y: number }>) ?? {},
        }}
        machines={machines}
        canEdit={canEdit}
      />
    </div>
  )
}
