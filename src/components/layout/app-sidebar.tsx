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
  module?: ModuleName
  roles?: string[]
  exact?: boolean
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { label: "Aujourd'hui", href: "/today", icon: CalendarCheck, exact: true },
      { label: "Notifications", href: "/notifications", icon: Bell, exact: true },
    ],
  },
  {
    label: "Maintenance",
    items: [
      { label: "Machines", href: "/machines", icon: Wrench },
      { label: "Interventions", href: "/interventions", icon: ClipboardList },
      { label: "Préventives", href: "/preventive", icon: CalendarClock },
    ],
  },
  {
    label: "Stock",
    items: [
      { label: "Articles", href: "/stock", icon: Package, module: ModuleName.STOCK_MANAGEMENT },
      { label: "Transferts", href: "/stock/transfers", icon: ArrowLeftRight, module: ModuleName.INTER_SITE_TRANSFERS },
    ],
  },
  {
    label: "Analyses",
    items: [
      { label: "Rapports", href: "/reports", icon: BarChart3, module: ModuleName.ADVANCED_REPORTS },
      { label: "Assistant IA", href: "/ai-assistant", icon: Bot, module: ModuleName.AI_ASSISTANT },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Utilisateurs", href: "/users", icon: Users, roles: ["super_admin", "client_admin"] },
      { label: "Paramètres", href: "/settings", icon: Settings, roles: ["super_admin", "client_admin"], exact: true },
      { label: "Super Admin", href: "/admin", icon: Shield, roles: ["super_admin"] },
    ],
  },
]

type Props = {
  pendingTransfersCount?: number
}

export function AppSidebar({ pendingTransfersCount = 0 }: Props) {
  const pathname = usePathname()
  const { isModuleActive, session } = useTenantContext()
  const { isOpen, close } = useSidebar()

  function filterItems(items: NavItem[]) {
    return items.filter((item) => {
      if (item.module && !isModuleActive(item.module)) return false
      if (item.roles && !item.roles.includes(session.role)) return false
      return true
    })
  }

  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: filterItems(group.items) }))
    .filter((group) => group.items.length > 0)

  function renderItem(item: NavItem) {
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
  }

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
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
        {visibleGroups.map((group, i) => (
          <div key={i}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(renderItem)}
            </div>
          </div>
        ))}
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
