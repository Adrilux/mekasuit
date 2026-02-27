import { Bell } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetUserNotifications } from "@/server/queries/notifications/query-get-user-notifications"
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client"

export default async function NotificationsPage() {
  const session = await requireSession()
  const notifications = await queryGetUserNotifications(session)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
      </div>
      <NotificationsPageClient notifications={notifications} />
    </div>
  )
}
