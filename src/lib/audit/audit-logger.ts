import { Prisma } from "@prisma/client"

type AuditInput = {
  tx: Prisma.TransactionClient
  tenantId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  entityLabel: string
  changes?: Record<string, unknown>
}

export async function logAudit({
  tx,
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  entityLabel,
  changes,
}: AuditInput): Promise<void> {
  await tx.auditLog.create({
    data: {
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      entityLabel,
      changes: changes ? (changes as Prisma.InputJsonValue) : undefined,
    },
  })
}
