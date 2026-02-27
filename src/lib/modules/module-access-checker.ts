import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { ModuleName, MODULE_METADATA } from "./module-definitions"
import { ModuleError } from "@/lib/errors/app-error-classes"

// Vérifie si un module est actif pour un tenant
// Résultat mis en cache 60s, invalidé par le tag "modules:{tenantId}" lors d'un toggle
export const isModuleActive = unstable_cache(
  async (tenantId: string, module: ModuleName): Promise<boolean> => {
    // GMAO est toujours actif
    if (MODULE_METADATA[module].alwaysActive) return true

    const record = await prisma.tenantModule.findUnique({
      where: { tenantId_module: { tenantId, module } },
      select: { isActive: true },
    })

    return record?.isActive ?? false
  },
  ["module-access"],
  {
    revalidate: 60,
    tags: ["modules"],
  }
)

// Récupère l'ensemble des modules actifs pour un tenant
export async function getActiveTenantModules(tenantId: string): Promise<Set<ModuleName>> {
  const records = await prisma.tenantModule.findMany({
    where: { tenantId, isActive: true },
    select: { module: true },
  })

  const active = new Set<ModuleName>(records.map((r: { module: ModuleName }) => r.module))
  active.add(ModuleName.GMAO) // toujours présent

  return active
}

// Lance une erreur si le module n'est pas actif
// À utiliser dans les Server Actions et les layouts de module
export async function assertModuleActive(tenantId: string, module: ModuleName): Promise<void> {
  const active = await isModuleActive(tenantId, module)

  if (!active) {
    throw new ModuleError(MODULE_METADATA[module].label)
  }
}
