"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  notificationId: z.string().min(1),
})

export async function actionMarkNotificationRead(input: unknown) {
  try {
    const session = await requireSession()
    const { notificationId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      await tx.notification.updateMany({
        where: {
          id: notificationId,
          tenantId: session.tenantId,
          userId: session.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      })
    })

    return success({})
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function actionMarkAllNotificationsRead(_input: unknown) {
  try {
    const session = await requireSession()

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      await tx.notification.updateMany({
        where: {
          tenantId: session.tenantId,
          userId: session.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      })
    })

    return success({})
  } catch (error) {
    return handleServerActionError(error)
  }
}
