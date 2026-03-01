import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetInterventionDetail(session: SessionUser, interventionId: string) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.intervention.findUnique({
      where: { id: interventionId },
      include: {
        machine: { select: { id: true, name: true, category: true } },
        site: { select: { id: true, name: true } },
        notes: { orderBy: { createdAt: "asc" } },
        partsUsed: {
          include: {
            stockItem: { select: { id: true, name: true, reference: true, unit: true } },
          },
        },
        plannedMaterials: {
          orderBy: { createdAt: "asc" },
          include: {
            stockItem: { select: { id: true, name: true, reference: true, unit: true, quantityOnHand: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            storedName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        timeEntries: {
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            userId: true,
            startedAt: true,
            endedAt: true,
            durationMinutes: true,
            note: true,
          },
        },
        checklists: {
          orderBy: { createdAt: "asc" },
          include: {
            items: { orderBy: { position: "asc" } },
          },
        },
      },
    })
  })
}
// Les champs recurrenceType, recurrenceIntervalDays, parentInterventionId
// sont inclus automatiquement dans la sélection par défaut de Prisma (pas d'include nécessaire)

export type InterventionDetail = Awaited<ReturnType<typeof queryGetInterventionDetail>>
