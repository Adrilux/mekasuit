"use client"

import Link from "next/link"
import { LogOut, User, Menu } from "lucide-react"
import { signOut } from "@/lib/auth/better-auth-client-config"
import { useTenantContext } from "@/providers/tenant-context-provider"
import { useSidebar } from "@/providers/sidebar-context"
import { useRouter } from "next/navigation"
import { NotificationBell } from "./notification-bell"
import { OfflineIndicator } from "./offline-indicator"
import type { NotificationItem } from "@/server/queries/notifications/query-get-user-notifications"

type Props = {
  notifications: NotificationItem[]
  unreadCount: number
}

export function AppHeader({ notifications, unreadCount }: Props) {
  const { session } = useTenantContext()
  const { toggle } = useSidebar()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        {/* Burger mobile */}
        <button
          onClick={toggle}
          className="md:hidden p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <OfflineIndicator />
        <NotificationBell
          initialNotifications={notifications}
          unreadCount={unreadCount}
        />

        <Link href="/profile" className="flex items-center gap-2 text-sm hover:text-slate-900 transition-colors" title="Mon profil">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700 font-medium">{session.name}</span>
          <span className="text-slate-400 text-xs hidden sm:inline">({session.role})</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
