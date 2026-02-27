import { redirect } from "next/navigation"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { getActiveTenantModules } from "@/lib/modules/module-access-checker"
import { AppSidebarServer } from "@/components/layout/app-sidebar-server"
import { AppHeaderServer } from "@/components/layout/app-header-server"
import { TenantContextProvider } from "@/providers/tenant-context-provider"
import { SidebarProvider } from "@/providers/sidebar-context"
import { OfflineQueueFlusher } from "@/components/layout/offline-queue-flusher"
import { Toaster } from "@/components/ui/sonner"

// Layout principal de l'application authentifiée
// Vérifie la session, charge les modules actifs, injecte le contexte tenant

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  // Le super_admin n'a pas de tenant — il va directement dans sa console
  if (session.role === "super_admin") {
    redirect("/admin")
  }

  // Compte avec mot de passe temporaire — doit changer avant de continuer
  if (session.mustChangePassword) {
    redirect("/change-password")
  }

  const activeModules = await getActiveTenantModules(session.tenantId)

  return (
    <TenantContextProvider session={session} activeModules={activeModules}>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <AppSidebarServer />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AppHeaderServer />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
        <OfflineQueueFlusher />
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </TenantContextProvider>
  )
}
