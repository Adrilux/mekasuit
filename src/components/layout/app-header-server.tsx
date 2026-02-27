import { requireSession } from "@/lib/auth/auth-session-helpers"
import {
  queryGetUserNotifications,
  queryGetUnreadNotificationCount,
} from "@/server/queries/notifications/query-get-user-notifications"
import { AppHeader } from "./app-header"

/**
 * Wrapper Server Component qui charge les notifications
 * puis les passe au client component AppHeader.
 */
export async function AppHeaderServer() {
  const session = await requireSession()

  const [notifications, unreadCount] = await Promise.all([
    queryGetUserNotifications(session),
    queryGetUnreadNotificationCount(session),
  ])

  return (
    <AppHeader
      notifications={notifications}
      unreadCount={unreadCount}
    />
  )
}
