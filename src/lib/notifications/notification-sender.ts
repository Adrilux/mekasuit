/**
 * Service d'envoi de notifications in-app.
 * À appeler depuis les server actions DANS une transaction withTenantContext.
 */
import { NotificationType, Prisma } from "@prisma/client"

type SendNotificationInput = {
  tenantId: string
  userId: string           // authUserId du destinataire
  type: NotificationType
  title: string
  body: string
  link?: string
}

/**
 * Crée une notification en DB.
 * Doit être appelé avec un TransactionClient (tx) pour rester atomique.
 */
export async function sendNotification(
  tx: Prisma.TransactionClient,
  input: SendNotificationInput
): Promise<void> {
  await tx.notification.create({
    data: {
      tenantId: input.tenantId,
      userId:   input.userId,
      type:     input.type,
      title:    input.title,
      body:     input.body,
      link:     input.link ?? null,
    },
  })
}

/**
 * Crée plusieurs notifications d'un coup (ex: notifier tous les admins).
 */
export async function sendNotificationToMany(
  tx: Prisma.TransactionClient,
  userIds: string[],
  base: Omit<SendNotificationInput, "userId">
): Promise<void> {
  if (userIds.length === 0) return
  await tx.notification.createMany({
    data: userIds.map((userId) => ({
      tenantId: base.tenantId,
      userId,
      type:  base.type,
      title: base.title,
      body:  base.body,
      link:  base.link ?? null,
    })),
  })
}
