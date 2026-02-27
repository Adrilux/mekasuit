import { prisma } from "@/lib/db/prisma-client-singleton"
import { withTenantReadContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  readAt: Date | null
  createdAt: Date
}

/**
 * Retourne les 30 dernières notifications de l'utilisateur connecté.
 * Tri : non lues d'abord, puis par date décroissante.
 */
export async function queryGetUserNotifications(
  session: SessionUser
): Promise<NotificationItem[]> {
  return withTenantReadContext(session.tenantId, () =>
    prisma.notification.findMany({
      where: { tenantId: session.tenantId, userId: session.id },
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    })
  )
}

/**
 * Retourne le nombre de notifications non lues.
 */
export async function queryGetUnreadNotificationCount(
  session: SessionUser
): Promise<number> {
  return withTenantReadContext(session.tenantId, () =>
    prisma.notification.count({
      where: { tenantId: session.tenantId, userId: session.id, readAt: null },
    })
  )
}
