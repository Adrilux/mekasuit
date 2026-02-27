import { redirect } from "next/navigation"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { MODULE_METADATA, type ModuleName } from "@/lib/modules/module-definitions"

// Server Component — vérifie côté serveur si le module est actif
// Si inactif : redirige vers /dashboard ou affiche le fallback
// Entourer chaque layout de module avec ce guard

export async function ModuleFeatureGuard({
  module,
  tenantId,
  children,
  fallback,
}: {
  module: ModuleName
  tenantId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const active = await isModuleActive(tenantId, module)

  if (!active) {
    if (fallback) return <>{fallback}</>
    redirect(`/dashboard?module_inactive=${MODULE_METADATA[module].label}`)
  }

  return <>{children}</>
}
