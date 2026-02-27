"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, CheckCheck, Loader2, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { actionMarkNotificationRead, actionMarkAllNotificationsRead } from "@/server/actions/notifications/action-mark-notification-read"
import { toast } from "sonner"
import { cn } from "@/lib/utils/cn"
import type { NotificationItem } from "@/server/queries/notifications/query-get-user-notifications"

const TYPE_ICONS: Record<string, string> = {
  INTERVENTION_ASSIGNED: "🔧",
  INTERVENTION_OVERDUE:  "⏰",
  STOCK_LOW:             "📦",
  PREVENTIVE_DUE:        "📅",
  TRANSFER_PENDING:      "🔄",
  TRANSFER_RESOLVED:     "✅",
}

const TYPE_LABELS: Record<string, string> = {
  INTERVENTION_ASSIGNED: "Intervention assignée",
  INTERVENTION_OVERDUE:  "Intervention en retard",
  STOCK_LOW:             "Stock en rupture",
  PREVENTIVE_DUE:        "Préventive à venir",
  TRANSFER_PENDING:      "Transfert en attente",
  TRANSFER_RESOLVED:     "Transfert résolu",
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} jour${days > 1 ? "s" : ""}`
  return new Date(date).toLocaleDateString("fr-FR")
}

type Props = {
  notifications: NotificationItem[]
}

export function NotificationsPageClient({ notifications: initial }: Props) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter((n) => !n.readAt).length

  function markRead(id: string) {
    startTransition(async () => {
      const res = await actionMarkNotificationRead({ notificationId: id })
      if (!res.success) { toast.error(res.error); return }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      )
      router.refresh()
    })
  }

  function markAllRead() {
    startTransition(async () => {
      const res = await actionMarkAllNotificationsRead(null)
      if (!res.success) { toast.error(res.error); return }
      const now = new Date()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })))
      router.refresh()
    })
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BellOff className="w-10 h-10 mb-4" />
        <p className="text-sm">Aucune notification pour le moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Actions globales */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3 mr-2" />
            )}
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={cn(
              "flex gap-4 px-5 py-4",
              !notif.readAt && "bg-blue-50/40"
            )}
          >
            <span className="text-xl shrink-0 mt-0.5">
              {TYPE_ICONS[notif.type] ?? "🔔"}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {TYPE_LABELS[notif.type] ?? notif.type}
                  </span>
                  <p className={cn(
                    "text-sm mt-0.5",
                    !notif.readAt ? "font-semibold text-slate-900" : "text-slate-700"
                  )}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{notif.body}</p>
                </div>
                {!notif.readAt && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="shrink-0 p-1.5 rounded-md hover:bg-blue-100 text-blue-500 transition-colors"
                    title="Marquer comme lu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-400">{timeAgo(notif.createdAt)}</span>
                {notif.link && (
                  <a
                    href={notif.link}
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => { if (!notif.readAt) markRead(notif.id) }}
                  >
                    Voir →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
