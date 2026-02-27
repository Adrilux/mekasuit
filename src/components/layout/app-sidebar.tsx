"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  CalendarClock,
  CalendarCheck,
  Package,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Users,
  Settings,
  Bot,
  Shield,
  X,
} from "lucide-react"
import { useTenantContext } from "@/providers/tenant-context-provider"
import { useSidebar } from "@/providers/sidebar-context"
import { ModuleName } from "@prisma/client"
import { cn } from "@/lib/utils/cn"
import { GlobalSearch } from "@/components/layout/global-search"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  module?: ModuleName // si défini, l'item est caché si le module est inactif
  roles?: string[]   // si défini, l'item est caché selon le rôle
  exact?: boolean    // si true, actif uniquement sur l'URL exacte (pas les sous-routes)
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Machines",
    href: "/machines",
    icon: Wrench,
  },
  {
    label: "Interventions",
    href: "/interventions",
    icon: ClipboardList,
  },
  {
    label: "Aujourd'hui",
    href: "/today",
    icon: CalendarCheck,
    exact: true,
  },
  {
    label: "Préventives",
    href: "/preventive",
    icon: CalendarClock,
  },
  {
    label: "Stock",
    href: "/stock",
    icon: Package,
    module: ModuleName.STOCK_MANAGEMENT,
  },
  {
    label: "Transferts",
    href: "/stock/transfers",
    icon: ArrowLeftRight,
    module: ModuleName.INTER_SITE_TRANSFERS,
  },
  {
    label: "Rapports",
    href: "/reports",
    icon: BarChart3,
    module: ModuleName.ADVANCED_REPORTS,
  },
  {
    label: "Assistant IA",
    href: "/ai-assistant",
    icon: Bot,
    module: ModuleName.AI_ASSISTANT,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    exact: true,
  },
  {
    label: "Utilisateurs",
    href: "/users",
    icon: Users,
    roles: ["super_admin", "client_admin"],
  },
  {
    label: "Rôles",
    href: "/settings/roles",
    icon: Shield,
    roles: ["client_admin"],
  },
  {
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "client_admin"],
    exact: true,
  },
  {
    label: "Super Admin",
    href: "/admin",
    icon: Shield,
    roles: ["super_admin"],
  },
]

type Props = {
  pendingTransfersCount?: number
}

export function AppSidebar({ pendingTransfersCount = 0 }: Props) {
  const pathname = usePathname()
  const { isModuleActive, session } = useTenantContext()
  const { isOpen, close } = useSidebar()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.module && !isModuleActive(item.module)) return false
    if (item.roles && !item.roles.includes(session.role)) return false
    return true
  })

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
        <span className="font-bold text-slate-900 text-lg">GMAO</span>
        <button
          onClick={close}
          className="md:hidden p-1 rounded text-slate-400 hover:text-slate-700"
          title="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Recherche globale */}
      <div className="px-2 py-2 border-b border-slate-100 shrink-0">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const showBadge = item.href === "/stock/transfers" && pendingTransfersCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {pendingTransfersCount > 99 ? "99+" : pendingTransfersCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Sidebar desktop — toujours visible */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 shrink-0">
        {sidebarContent}
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar mobile — drawer depuis la gauche */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 transition-transform duration-200 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
