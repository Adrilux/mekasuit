import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type CustomReportListItem = {
  id: string
  name: string
  columns: string[]
  filters: Record<string, string | undefined>
  createdAt: Date
  updatedAt: Date
}

export async function queryGetCustomReports(session: SessionUser): Promise<CustomReportListItem[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const reports = await tx.customReport.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, columns: true, filters: true, createdAt: true, updatedAt: true },
    })

    return reports.map((r) => ({
      id: r.id,
      name: r.name,
      columns: r.columns,
      filters: (r.filters as Record<string, string | undefined>) ?? {},
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  })
}

export async function queryGetCustomReportById(
  session: SessionUser,
  id: string,
): Promise<CustomReportListItem | null> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const report = await tx.customReport.findUnique({
      where: { id },
      select: { id: true, name: true, columns: true, filters: true, createdAt: true, updatedAt: true },
    })

    if (!report) return null

    return {
      id: report.id,
      name: report.name,
      columns: report.columns,
      filters: (report.filters as Record<string, string | undefined>) ?? {},
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }
  })
}
