import type { ModuleName } from "@prisma/client"

export type { ModuleName }

// État des modules pour un tenant (utilisé dans le contexte React)
export type TenantModulesState = {
  activeModules: Set<ModuleName>
  isModuleActive: (module: ModuleName) => boolean
}
