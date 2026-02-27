"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  return new Date(date).toLocaleDateString("fr-FR")
}

type Props = {
  initialNotifications: NotificationItem[]
  unreadCount: number
}

export function NotificationBell({ initialNotifications, unreadCount }: Props) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [count, setCount] = useState(unreadCount)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function markRead(id: string) {
    startTransition(async () => {
      const res = await actionMarkNotificationRead({ notificationId: id })
      if (!res.success) { toast.error(res.error); return }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      )
      setCount((c) => Math.max(0, c - 1))
      router.refresh()
    })
  }

  function markAllRead() {
    startTransition(async () => {
      const res = await actionMarkAllNotificationsRead(null)
      if (!res.success) { toast.error(res.error); return }
      const now = new Date()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })))
      setCount(0)
      router.refresh()
    })
  }

  function handleNotificationClick(notif: NotificationItem) {
    if (!notif.readAt) markRead(notif.id)
    if (notif.link) {
      setOpen(false)
      router.push(notif.link)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="font-semibold text-sm text-slate-900">Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 hover:text-slate-900"
              onClick={markAllRead}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><CheckCheck className="w-3 h-3 mr-1" />Tout marquer lu</>
              )}
            </Button>
          )}
        </div>

        {/* Liste */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Aucune notification
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3",
                  !notif.readAt && "bg-blue-50/60 hover:bg-blue-50"
                )}
              >
                <span className="text-base shrink-0 mt-0.5">
                  {TYPE_ICONS[notif.type] ?? "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm truncate", !notif.readAt ? "font-semibold text-slate-900" : "text-slate-700")}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.readAt && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead(notif.id) }}
                    className="shrink-0 mt-1 p-1 rounded hover:bg-blue-100 text-blue-500"
                    title="Marquer comme lu"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-slate-500"
              onClick={() => { setOpen(false); router.push("/notifications") }}
            >
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
