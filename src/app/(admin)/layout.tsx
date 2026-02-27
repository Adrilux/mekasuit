import { redirect } from "next/navigation"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link"
import { Shield, Building2, ScrollText } from "lucide-react"
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  if (session.role !== "super_admin") redirect("/dashboard")

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Sidebar admin */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo / titre */}
        <div className="h-14 flex items-center px-4 border-b border-slate-800">
          <Shield className="w-5 h-5 text-red-400 mr-2" />
          <span className="font-bold text-white text-sm">Admin Console</span>
        </div>
        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Tenants
          </Link>
          <Link
            href="/admin/logs"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ScrollText className="w-4 h-4" />
            Logs d&apos;activité
          </Link>
        </nav>
        {/* Footer */}
        <div className="border-t border-slate-800 p-4">
          <p className="text-xs text-slate-500 mb-1">Connecté en tant que</p>
          <p className="text-xs text-slate-300 font-medium truncate">{session.email}</p>
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
